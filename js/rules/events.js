// events.js (rules)
// Random events: rolling one in the morning, describing each choice's effects, applying the choice,
// and temporary effects (like "-3 gig score for 7 days") that run out on their own.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.events = {

  // Events that could happen today (their conditions are met and they're not on cooldown).
  eligible: function (state) {
    var all = Game.content.events;
    return Object.keys(all).map(function (id) { return all[id]; }).filter(function (e) {
      var last = state.eventHistory[e.id];
      var cooldown = e.cooldownDays || Game.balance.events.defaultCooldownDays;
      if (last !== undefined && state.day - last < cooldown) return false;
      return e.when(state);
    });
  },

  // The choices for today's event, each with a plain description of its effects.
  // Returns [{ id, label, effects, safe, description, problem }].
  choices: function (state) {
    var pending = state.pendingEvent;
    if (!pending) return [];
    var event = Game.content.events[pending.eventId];
    return event.choices(state, pending.data).map(function (c) {
      return {
        id: c.id, label: c.label, effects: c.effects, safe: !!c.safe,
        description: Game.rules.events.describe(state, c.effects),
        problem: Game.rules.events.problem(state, c.effects)
      };
    });
  },

  // Why a choice can't be picked right now, or null.
  problem: function (state, effects) {
    if (effects.fillIn) {
      var f = effects.fillIn;
      if (Game.rules.booking.blockTaken(state, f.day, Game.content.venues[f.venueId].showBlock)) return 'That slot is taken now.';
    }
    return null;
  },

  // Describes effects in plain words, like "-$60 · -3 gig score for 7 days".
  describe: function (state, effects) {
    var u = Game.util;
    var parts = [];
    if (effects.cash) parts.push((effects.cash > 0 ? '+$' : '-$') + Math.abs(effects.cash));
    if (effects.energy) parts.push(u.signed(effects.energy) + ' energy');
    if (effects.morale) parts.push(u.signed(effects.morale) + ' morale');
    if (effects.buzz) parts.push(u.signed(effects.buzz) + ' ' + Game.content.cities.hometown.name + ' buzz');
    if (effects.reputation) parts.push(u.signed(effects.reputation) + ' reputation');
    if (effects.gigScore) parts.push(u.signed(effects.gigScore.amount) + ' gig score for ' + effects.gigScore.days + ' days');
    if (effects.dailyEnergy) parts.push(u.signed(effects.dailyEnergy.amount) + ' energy every night for ' + effects.dailyEnergy.days + ' days');
    if (effects.overtime !== undefined) {
      parts.push('+$' + Game.balance.job.overtimePay + ', work ' + Game.rules.day.dateLabel(effects.overtime) + ' morning and afternoon');
    }
    if (effects.fillIn) {
      var venue = Game.content.venues[effects.fillIn.venueId];
      parts.push('show at ' + venue.name + ' tomorrow evening ($' + venue.deals.guarantee + ')');
    }
    if (effects.satisfaction) {
      var p = state.people[effects.satisfaction.personId];
      parts.push(u.signed(effects.satisfaction.amount) + ' satisfaction' + (p ? ' for ' + p.name : ''));
    }
    return parts.length ? parts.join(' · ') : 'Nothing changes';
  },

  // Each morning (right after the day moves forward): maybe an event happens.
  // The first overtime offer is guaranteed on week 1's Friday. Returns { state, log }.
  roll: function (state) {
    var b = Game.balance.events;
    var s = Game.util.clone(state);
    if (s.pendingEvent) return { state: s, log: [] };
    var options = Game.rules.events.eligible(s);
    if (!options.length) return { state: s, log: [] };

    var rng = Game.rng.create(s.rngState);
    var chosen = null;
    var overtime = options.filter(function (e) { return e.id === 'overtime'; })[0];
    if (overtime && Game.rules.day.weekNumber(s.day) === b.firstOvertimeWeek && s.eventHistory.overtime === undefined) {
      chosen = overtime;
    } else if (rng.chance(b.dailyChance)) {
      var total = options.reduce(function (sum, e) { return sum + e.weight; }, 0);
      var roll = rng.next() * total;
      for (var i = 0; i < options.length && !chosen; i++) {
        roll -= options[i].weight;
        if (roll < 0) chosen = options[i];
      }
      chosen = chosen || options[options.length - 1];
    }
    var data = chosen && chosen.setup ? chosen.setup(s, rng) : {};
    s.rngState = rng.getState();
    if (!chosen) return { state: s, log: [] };

    s.pendingEvent = { eventId: chosen.id, day: s.day, data: data };
    s.eventHistory[chosen.id] = s.day;
    s = Game.rules.booking.addInbox(s, 'event', { eventId: chosen.id, text: chosen.text(s, data), title: chosen.title }, null);
    s.inbox[s.inbox.length - 1].read = true; // it shows on Today; the inbox just keeps a record
    return { state: s, log: [] };
  },

  // Answers today's event with one of its choices. Returns { state, log }.
  resolve: function (state, choiceId, auto) {
    var pending = state.pendingEvent;
    if (!pending) return { state: state, log: [] };
    var choice = Game.rules.events.choices(state).filter(function (c) { return c.id === choiceId; })[0];
    if (!choice) return { state: state, log: ['Pick one of the choices.'] };
    if (choice.problem) return { state: state, log: [choice.problem] };
    var event = Game.content.events[pending.eventId];
    var applied = Game.rules.events.apply(state, choice.effects);
    var s = applied.state;
    s.pendingEvent = null;
    s.inbox.forEach(function (m) {
      if (m.kind === 'event' && m.day === pending.day && m.data.eventId === pending.eventId && !m.resolved) {
        m.resolved = 'answered';
        m.data.answer = choice.label + (auto ? ' (you didn\'t answer)' : '');
      }
    });
    var line = event.title + ': ' + choice.label + (auto ? ' (you didn\'t answer, so that\'s what happened)' : '') + '. ' + choice.description + '.';
    return { state: s, log: [line].concat(applied.log) };
  },

  // At End Day: an unanswered event gets its safe choice. Returns { state, log }.
  autoResolve: function (state) {
    if (!state.pendingEvent) return { state: state, log: [] };
    var safe = Game.rules.events.choices(state).filter(function (c) { return c.safe; })[0];
    return Game.rules.events.resolve(state, safe.id, true);
  },

  // Applies a choice's effects. Returns { state, log }.
  apply: function (state, effects) {
    var b = Game.balance;
    var s = Game.util.clone(state);
    var log = [];
    if (effects.cash > 0) s = Game.rules.money.earn(s, effects.cash, 'events').state;
    if (effects.cash < 0) {
      var spent = Game.rules.money.spend(s, -effects.cash, 'events');
      s = spent.state;
      log = log.concat(spent.log);
    }
    if (effects.energy) s.player.energy = Game.rules.energy.clamp(s.player.energy + effects.energy);
    if (effects.morale) {
      var m = Game.rules.morale.change(s, effects.morale);
      s = m.state;
      log = log.concat(m.log);
    }
    if (effects.buzz) s = Game.rules.audience.addBuzz(s, 'hometown', effects.buzz).state;
    if (effects.reputation) s.player.reputation = Game.util.clamp(s.player.reputation + effects.reputation, 0, b.reputation.max);
    if (effects.gigScore) {
      s.effects.push({ id: 'e' + s.day + '-' + s.effects.length, kind: 'gigScore', amount: effects.gigScore.amount,
        untilDay: s.day + effects.gigScore.days, label: effects.gigScore.label });
    }
    if (effects.dailyEnergy) {
      s.effects.push({ id: 'e' + s.day + '-' + s.effects.length, kind: 'dailyEnergy', amount: effects.dailyEnergy.amount,
        untilDay: s.day + effects.dailyEnergy.days, label: effects.dailyEnergy.label });
    }
    if (effects.overtime !== undefined) {
      s.player.job.extraShifts[effects.overtime] = true;
      var dropped = Game.rules.job.dropPlansInJobBlocks(s, effects.overtime);
      s = dropped.state;
      log = log.concat(dropped.log);
    }
    if (effects.fillIn) {
      var booked = Game.rules.booking.bookFillIn(s, effects.fillIn.venueId, effects.fillIn.day);
      s = booked.state;
      log = log.concat(booked.log);
    }
    if (effects.satisfaction && s.people[effects.satisfaction.personId] && s.people[effects.satisfaction.personId].status === 'member') {
      s = Game.rules.people.changeSatisfaction(s, effects.satisfaction.personId, effects.satisfaction.amount,
        effects.satisfaction.amount > 0 ? 'You promised more rehearsals' : 'You brushed off their idea').state;
    }
    return { state: s, log: log };
  },

  // Active temporary effects of one kind (they last until their untilDay).
  active: function (state, kind) {
    return state.effects.filter(function (e) { return e.kind === kind && e.untilDay > state.day; });
  },

  // The total gig score change from active effects (like a crackling amp).
  gigScoreChange: function (state) {
    return Game.rules.events.active(state, 'gigScore').reduce(function (sum, e) { return sum + e.amount; }, 0);
  },

  // Each night: energy effects (like taking the bus) apply, and expired effects go away. Returns { state, log }.
  nightly: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    Game.rules.events.active(s, 'dailyEnergy').forEach(function (e) {
      s.player.energy = Game.rules.energy.clamp(s.player.energy + e.amount);
      log.push(e.label + ': ' + Game.util.signed(e.amount) + ' energy.');
    });
    return { state: s, log: log };
  },

  // Removes effects that have run out (call after the day moves forward). Returns { state, log }.
  expire: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    s.effects = s.effects.filter(function (e) {
      if (e.untilDay > s.day) return true;
      log.push(e.label + ' is over.');
      return false;
    });
    return { state: s, log: log };
  }
};
