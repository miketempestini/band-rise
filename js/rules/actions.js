// actions.js
// Rules for planning actions in free blocks and doing them at End Day.
//
// A planned action is stored like any other calendar item (see Design.md's data model):
//   state.schedule[day][block] = entryId
//   state.entries[entryId] = { id, day, block, type: 'action', actionId, status: 'planned' }

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.actions = {

  // The action planned for a block today, or null.
  plannedActionId: function (state, block) {
    var today = state.schedule[state.day];
    var entryId = today && today[block];
    return entryId && state.entries[entryId] ? state.entries[entryId].actionId : null;
  },

  // Why an action can't be done with this much energy and cash, or null if it can.
  affordProblem: function (action, energy, cash) {
    if (energy < action.energyCost) {
      return 'Needs ' + action.energyCost + ' energy (you\'ll have ' + Math.round(energy) + ').';
    }
    if (cash < action.moneyCost) {
      return 'Costs $' + action.moneyCost + ' (you\'ll have $' + Math.round(cash).toLocaleString() + ').';
    }
    return null;
  },

  // Walks through today's three blocks in order and works out the energy and cash before and after each.
  // Used by the Today screen and to check whether an action can be planned.
  // Returns a list of { block, kind: 'job' | 'action' | 'free', actionId, problem,
  //                     energyBefore, energyAfter, cashBefore, cashAfter }.
  dayPlan: function (state) {
    var b = Game.balance;
    var clampEnergy = Game.rules.energy.clamp;
    var energy = state.player.energy;
    var cash = state.player.cash;

    return b.time.blocks.map(function (block) {
      var row = { block: block, kind: 'free', actionId: null, problem: null, energyBefore: energy, cashBefore: cash };

      if (Game.rules.day.isJobBlock(state, block)) {
        row.kind = 'job';
        energy = clampEnergy(energy - b.energy.cost.dayJob);
      } else {
        var actionId = Game.rules.actions.plannedActionId(state, block);
        var action = actionId && Game.content.actions[actionId];
        if (action) {
          row.kind = 'action';
          row.actionId = actionId;
          row.problem = Game.rules.actions.affordProblem(action, energy, cash);
        }
        if (action && !row.problem) {
          energy = clampEnergy(energy - action.energyCost + (action.effects.energy || 0));
          cash -= action.moneyCost;
        } else {
          // Free time (or an action that will be skipped, which also counts as free time).
          energy = clampEnergy(energy + b.time.emptyBlockEnergy);
        }
      }

      row.energyAfter = energy;
      row.cashAfter = cash;
      return row;
    });
  },

  // Everything the action picker needs to show one action for one block.
  // Returns { action, ok, reason, gains: { skills: { name: amount }, energy, morale, buzz }, burnedOutWarning }.
  option: function (state, block, actionId) {
    var action = Game.content.actions[actionId];
    var plan = Game.rules.actions.dayPlan(state);
    var row = plan[Game.balance.time.blocks.indexOf(block)];
    var result = { action: action, ok: true, reason: null, gains: { skills: {} }, burnedOutWarning: false };

    if (row.kind === 'job') {
      result.ok = false;
      result.reason = 'This block is taken by your day job.';
    } else {
      result.reason = Game.rules.actions.affordProblem(action, row.energyBefore, row.cashBefore);
      result.ok = !result.reason;
    }

    // Expected gains, using the energy you'll have at the start of this block.
    var skills = action.effects.skills || {};
    Object.keys(skills).forEach(function (skill) {
      if (state.player.burnedOut && action.noSkillWhenBurnedOut) {
        result.gains.skills[skill] = 0;
        result.burnedOutWarning = true;
      } else {
        result.gains.skills[skill] = Game.rules.skills.gainFor(state, skill, skills[skill], row.energyBefore);
      }
    });
    if (action.effects.energy) result.gains.energy = action.effects.energy;
    if (action.effects.morale) result.gains.morale = action.effects.morale;
    if (action.effects.buzz) result.gains.buzz = Game.rules.audience.promoBuzz(state, action.effects.buzz);
    result.tired = Game.rules.energy.isTired(row.energyBefore);
    return result;
  },

  // The picker's list: every action, with its option details.
  options: function (state, block) {
    return Object.keys(Game.content.actions).map(function (id) {
      return Game.rules.actions.option(state, block, id);
    });
  },

  // Plans an action in one of today's blocks (replacing anything planned there).
  // If it isn't allowed, the state comes back unchanged with the reason in the log.
  // Returns { state, log }.
  plan: function (state, block, actionId) {
    if (!Game.content.actions[actionId]) {
      return { state: state, log: ['Unknown action.'] };
    }
    // Check it as if the block were empty, so swapping one action for another works.
    var check = Game.rules.actions.option(Game.rules.actions.clear(state, block).state, block, actionId);
    if (!check.ok) {
      return { state: state, log: [check.reason] };
    }

    var s = Game.rules.actions.clear(state, block).state;
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    s.entries[id] = { id: id, day: s.day, block: block, type: 'action', actionId: actionId, status: 'planned' };
    s.schedule[s.day] = s.schedule[s.day] || {};
    s.schedule[s.day][block] = id;
    return { state: s, log: [] };
  },

  // Sets a block back to Free time. Returns { state, log }.
  clear: function (state, block) {
    var s = Game.util.clone(state);
    var today = s.schedule[s.day];
    if (today && today[block]) {
      delete s.entries[today[block]];
      delete today[block];
    }
    return { state: s, log: [] };
  },

  // Removes a finished day's plan from the calendar (called at End Day).
  clearDay: function (state, day) {
    var s = Game.util.clone(state);
    var plan = s.schedule[day] || {};
    Object.keys(plan).forEach(function (block) { delete s.entries[plan[block]]; });
    delete s.schedule[day];
    return s;
  },

  // Does an action during End Day: pays its costs and applies its effects.
  // If there isn't enough energy or cash by now, it's skipped.
  // Returns { state, line, notes, skipped }: line is the one-line result for the Day results screen.
  perform: function (state, actionId) {
    var util = Game.util;
    var action = Game.content.actions[actionId];
    var s = state;
    var parts = [];
    var notes = [];

    var problem = Game.rules.actions.affordProblem(action, s.player.energy, s.player.cash);
    if (problem) {
      return { state: s, line: 'Skipped ' + action.name + '. ' + problem, notes: [], skipped: true };
    }

    var energyAtStart = s.player.energy;
    var tired = Game.rules.energy.isTired(energyAtStart);

    // Money.
    if (action.moneyCost > 0) {
      s = Game.rules.money.spend(s, action.moneyCost, action.moneyCategory).state;
      parts.push('-$' + action.moneyCost);
    }

    // Energy.
    var energyChange = (action.effects.energy || 0) - action.energyCost;
    s = util.clone(s);
    s.player.energy = Game.rules.energy.clamp(s.player.energy + energyChange);
    parts.push(util.signed(s.player.energy - energyAtStart) + ' energy'); // the real change (Rest can't go past 100)

    // Buzz (worked out before today's Promotion gain).
    if (action.effects.buzz) {
      var buzz = Game.rules.audience.promoBuzz(s, action.effects.buzz);
      s = Game.rules.audience.addBuzz(s, 'hometown', buzz).state;
      parts.push(util.signed(buzz) + ' ' + Game.content.cities.hometown.name + ' buzz');
    }

    // Skills.
    var skills = action.effects.skills || {};
    Object.keys(skills).forEach(function (skill) {
      var name = Game.content.skills[skill];
      if (s.player.burnedOut && action.noSkillWhenBurnedOut) {
        s = util.clone(s);
        s.player.skillLastUsed[skill] = s.day;
        parts.push('no ' + name + ' (Burned out)');
        return;
      }
      var trained = Game.rules.skills.train(s, skill, skills[skill], energyAtStart);
      s = trained.state;
      parts.push(util.signed(trained.gain) + ' ' + name + (tired ? ' (Tired: half gain)' : ''));
    });

    // Morale.
    if (action.effects.morale) {
      var changed = Game.rules.morale.change(s, action.effects.morale);
      s = changed.state;
      parts.push(util.signed(action.effects.morale) + ' morale');
      notes = notes.concat(changed.log);
    }

    return { state: s, line: parts.join(', ') + '.', notes: notes, skipped: false };
  }
};
