// events.js (rules)
// Random events: rolling one in the morning, describing each choice's effects, applying the choice,
// and temporary effects (like "-3 gig score for 7 days") that run out on their own.
//
// Events grow with your career. Your stage comes from your reputation (balance.events.stages: Starting out, Local
// act, Touring act, Star); each event lists the stages it can happen in, and its dollar amounts are scaled by the
// stage (events.scaled). Bigger stages roll a little less often, and an event waits longer before it can repeat.
// Some choices are gambles (outcomes with odds, shown on the card) and some start a story: the next step is queued
// in state.eventQueue ([{ eventId, day, data }]) and arrives on its day without a dice roll.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.events = {

  // Your career stage for events, from your reputation: 'starting' | 'local' | 'touring' | 'star'.
  stage: function (state) {
    var b = Game.balance.events;
    var stage = b.stageOrder[0];
    b.stageOrder.forEach(function (id) { if (state.player.reputation >= b.stages[id].minReputation) stage = id; });
    return stage;
  },

  // A base dollar amount scaled to your stage (and rounded to a tidy number).
  scaled: function (state, base) {
    var st = Game.balance.events.stages[Game.rules.events.stage(state)];
    return Math.round(base * st.moneyScale / st.roundTo) * st.roundTo;
  },

  // Every event (both content files). Story steps only arrive through the queue.
  all: function () {
    var out = {};
    [Game.content.events, Game.content.eventsBig || {}].forEach(function (group) {
      Object.keys(group).forEach(function (id) { out[id] = group[id]; });
    });
    return out;
  },

  // One event by id.
  get: function (id) { return Game.rules.events.all()[id]; },

  // Events that could happen today: in your stage's pool, their conditions met, and not on cooldown.
  eligible: function (state) {
    var all = Game.rules.events.all();
    var stage = Game.rules.events.stage(state);
    var stageCooldown = Game.balance.events.stages[stage].cooldownDays;
    return Object.keys(all).map(function (id) { return all[id]; }).filter(function (e) {
      if (e.story || e.stages.indexOf(stage) === -1) return false;
      var last = state.eventHistory[e.id];
      var cooldown = e.cooldownDays || stageCooldown;
      if (last !== undefined && state.day - last < cooldown) return false;
      return e.when(state);
    });
  },

  // The choices for today's event, each with a plain description of its effects.
  // Returns [{ id, label, effects, safe, description, problem }].
  choices: function (state) {
    var pending = state.pendingEvent;
    if (!pending) return [];
    var event = Game.rules.events.get(pending.eventId);
    return event.choices(state, pending.data).map(function (c) {
      return {
        id: c.id, label: c.label, effects: c.effects, safe: !!c.safe,
        description: Game.rules.events.describe(state, c.effects),
        problem: Game.rules.events.problem(state, c.effects),
        risky: Game.rules.events.risky(c.effects),
        // A gamble's outcomes one by one (for the card), and what happens no matter what.
        outcomes: c.effects.gamble ? c.effects.gamble.map(function (o) {
          return { chance: o.chance, text: o.text || '', description: Game.rules.events.describe(state, o.effects) };
        }) : null,
        sure: c.effects.gamble ? Game.rules.events.describe(state, Object.assign({}, c.effects, { gamble: null })) : null
      };
    });
  },

  // True if a choice could cost you a bandmate (the card marks it).
  risky: function (effects) {
    if (effects.memberLeaves) return true;
    return !!(effects.gamble && effects.gamble.some(function (o) { return o.effects.memberLeaves; }));
  },

  // About how many fans a share of your fans is (for the card).
  fanCount: function (state, share) {
    return Math.round(Game.rules.progress.totalFans(state) * Math.abs(share));
  },

  // The money a choice really moves. Gains are paid in full. A cost is capped at a share of the cash you have
  // (rounded down to the stage's round number), so one bill hurts but never sinks you; bills up to costFloor are
  // always paid in full. The card shows this same number.
  cashOf: function (state, effects) {
    var e = Game.balance.events;
    if (!effects.cash || effects.cash > 0) return effects.cash || 0;
    var roundTo = e.stages[Game.rules.events.stage(state)].roundTo;
    var cap = Math.max(e.costFloor, Math.floor(Math.max(0, state.player.cash) * e.maxCashShare / roundTo) * roundTo);
    return -Math.min(-effects.cash, cap);
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
    var cash = Game.rules.events.cashOf(state, effects);
    if (cash) parts.push((cash > 0 ? '+$' : '-$') + Math.abs(cash).toLocaleString());
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
    if (effects.satisfaction2) {
      var p2 = state.people[effects.satisfaction2.personId];
      parts.push(u.signed(effects.satisfaction2.amount) + ' satisfaction' + (p2 ? ' for ' + p2.name : ''));
    }
    if (effects.satisfactionAll) parts.push(u.signed(effects.satisfactionAll) + ' satisfaction for everyone');
    if (effects.relationshipAll) parts.push(u.signed(effects.relationshipAll) + ' relationship with every bandmate');
    if (effects.reliability) {
      var pr = state.people[effects.reliability.personId];
      parts.push(u.signed(effects.reliability.amount) + ' reliability' + (pr ? ' for ' + pr.name : ''));
    }
    if (effects.bigShare) {
      var ps = state.people[effects.bigShare.personId];
      parts.push((ps ? ps.name : 'They') + ' takes ' + effects.bigShare.shares + ' shares of gig pay from now on');
    }
    if (effects.sessionForShow) parts.push('a session player covers tomorrow\'s show (-$' + Game.balance.economy.sessionPlayerFee + ')');
    if (effects.songProgress) parts.push('+' + effects.songProgress + ' progress on your song');
    if (effects.fans) {
      var many = Game.rules.events.fanCount(state, effects.fans);
      parts.push((effects.fans > 0 ? '+' : '-') + many.toLocaleString() + ' fans');
    }
    if (effects.buzzAll) parts.push(u.signed(effects.buzzAll) + ' buzz everywhere you have fans');
    if (effects.streams) parts.push(u.signed(Math.round(effects.streams.amount * 100)) + '% streams for ' + effects.streams.weeks + ' weeks');
    if (effects.labelMood && state.label.deal && !state.label.deal.legacy) parts.push(u.signed(effects.labelMood) + ' label mood');
    if (effects.awardsBoost) parts.push('+' + Math.round(effects.awardsBoost * 100) + '% award chances this year');
    if (effects.memberLeaves) {
      var gone = state.people[effects.memberLeaves];
      parts.push((gone ? gone.name : 'They') + ' leaves the band');
    }
    if (effects.gamble) {
      parts.push(effects.gamble.map(function (o) {
        return Math.round(o.chance * 100) + '%: ' + (o.text ? o.text + ' (' : '') + Game.rules.events.describe(state, o.effects) + (o.text ? ')' : '');
      }).join(' · or ') );
    }
    if (effects.followUp) parts.push('the story continues');
    return parts.length ? parts.join(' · ') : 'Nothing changes';
  },

  // Each morning (right after the day moves forward): maybe an event happens.
  // The first overtime offer is guaranteed on week 1's Friday. Returns { state, log }.
  roll: function (state) {
    var b = Game.balance.events;
    var s = Game.util.clone(state);
    if (s.pendingEvent) return { state: s, log: [] };
    // A story's next step arrives on its day, no dice needed.
    var queued = (s.eventQueue || []).filter(function (q) { return q.day <= s.day; })[0];
    if (queued) {
      s.eventQueue = s.eventQueue.filter(function (q) { return q !== queued; });
      var step = Game.rules.events.get(queued.eventId);
      s.pendingEvent = { eventId: step.id, day: s.day, data: queued.data || {} };
      s.eventHistory[step.id] = s.day;
      s = Game.rules.booking.addInbox(s, 'event', { eventId: step.id, text: step.text(s, s.pendingEvent.data), title: step.title }, null);
      s.inbox[s.inbox.length - 1].read = true;
      return { state: s, log: [] };
    }
    var options = Game.rules.events.eligible(s);
    if (!options.length) return { state: s, log: [] };

    var rng = Game.rng.create(s.rngState);
    var chosen = null;
    var overtime = options.filter(function (e) { return e.id === 'overtime'; })[0];
    var chance = b.stages[Game.rules.events.stage(s)].dailyChance;
    if (overtime && Game.rules.day.weekNumber(s.day) === b.firstOvertimeWeek && s.eventHistory.overtime === undefined) {
      chosen = overtime;
    } else if (rng.chance(chance)) {
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
    var event = Game.rules.events.get(pending.eventId);
    var applied = Game.rules.events.apply(state, choice.effects);
    var s = applied.state;
    s.pendingEvent = null;
    s.inbox.forEach(function (m) {
      if (m.kind === 'event' && m.day === pending.day && m.data.eventId === pending.eventId && !m.resolved) {
        m.resolved = 'answered';
        m.data.answer = choice.label + (auto ? ' (you didn\'t answer)' : '') + (applied.outcome ? '. ' + applied.outcome : '');
      }
    });
    var line = event.title + ': ' + choice.label + (auto ? ' (you didn\'t answer, so that\'s what happened)' : '') + '. ' +
      (choice.effects.gamble ? (applied.outcome || '') : choice.description + '.');
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
    var cash = Game.rules.events.cashOf(state, effects);
    if (cash > 0) s = Game.rules.money.earn(s, cash, 'events').state;
    if (cash < 0) {
      var spent = Game.rules.money.spend(s, -cash, 'events');
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
    var isMember = function (id) { return id && s.people[id] && s.people[id].status === 'member'; };
    if (effects.satisfaction && isMember(effects.satisfaction.personId)) {
      s = Game.rules.people.changeSatisfaction(s, effects.satisfaction.personId, effects.satisfaction.amount,
        effects.satisfaction.reason || (effects.satisfaction.amount > 0 ? 'You backed them up' : 'You brushed them off')).state;
    }
    if (effects.satisfaction2 && isMember(effects.satisfaction2.personId)) {
      s = Game.rules.people.changeSatisfaction(s, effects.satisfaction2.personId, effects.satisfaction2.amount,
        effects.satisfaction2.reason || 'You took the other side').state;
    }
    if (effects.satisfactionAll) {
      Game.rules.people.members(s).forEach(function (m) {
        s = Game.rules.people.changeSatisfaction(s, m.id, effects.satisfactionAll, effects.reason || 'Band life').state;
      });
    }
    if (effects.relationshipAll) {
      Game.rules.people.members(s).forEach(function (m) { s = Game.rules.people.interact(s, m.id, effects.relationshipAll).state; });
    }
    if (effects.reliability && isMember(effects.reliability.personId)) {
      var person = s.people[effects.reliability.personId];
      person.reliability = Game.util.clamp(person.reliability + effects.reliability.amount, 0, b.people.statMax);
    }
    if (effects.bigShare && isMember(effects.bigShare.personId)) s.people[effects.bigShare.personId].shares = effects.bigShare.shares;
    if (effects.sessionForShow && s.entries[effects.sessionForShow]) {
      s = Game.rules.booking.changeSessionPlayers(s, effects.sessionForShow, 1).state;
    }
    if (effects.songProgress) {
      // Adds progress to the song in progress (starting one if needed). It stops just short of finished,
      // so the song is completed (and revealed) by your next Write block.
      var writing = Game.rules.songs.inProgress(s);
      if (!writing) {
        var started = Game.rules.songs.startSong(s);
        s = started.state;
        writing = s.songs[started.songId];
      }
      s.songs[writing.id].progress = Math.min(b.songs.progressToFinish - 1, s.songs[writing.id].progress + effects.songProgress);
    }
    if (effects.fans) {
      // Fans won or lost across every city where you have fans (in proportion; wins stay under each city's most).
      Object.keys(s.cities).forEach(function (id) {
        var city = s.cities[id];
        if (city.fans <= 0) return;
        var change = Math.round(city.fans * effects.fans);
        city.fans = Math.max(0, Math.min(Game.content.cities[id].fanCeiling, city.fans + change));
      });
    }
    if (effects.buzzAll) {
      Object.keys(s.cities).forEach(function (id) { if (s.cities[id].fans > 0) Game.rules.audience.buzzOn(s, id, effects.buzzAll); });
    }
    if (effects.streams) {
      s.effects.push({ id: 'e' + s.day + '-' + s.effects.length, kind: 'streams', amount: effects.streams.amount,
        untilDay: s.day + effects.streams.weeks * b.time.daysPerWeek, label: effects.streams.label || 'Streams change' });
    }
    if (effects.awardsBoost) {
      s.effects.push({ id: 'e' + s.day + '-' + s.effects.length, kind: 'awards', amount: effects.awardsBoost,
        untilDay: s.day + b.events.awardsBoostDays, label: 'Award buzz' });
    }
    if (effects.labelMood && s.label.deal && !s.label.deal.legacy) log.push(Game.rules.label.changeMood(s.label.deal, effects.labelMood, 'an event'));
    if (effects.memberLeaves && isMember(effects.memberLeaves)) {
      var leaving = s.people[effects.memberLeaves];
      s = Game.rules.people.leaveBand(s, effects.memberLeaves);
      var hurt = Game.rules.morale.change(s, b.morale.change.bandmateQuits);
      s = hurt.state;
      log.push(leaving.name + ' left the band. ' + b.morale.change.bandmateQuits + ' morale.');
    }
    var outcome = null;
    if (effects.gamble) {
      // Roll the outcome with the game's dice, then apply it.
      var rng = Game.rng.create(s.rngState);
      var roll = rng.next();
      s.rngState = rng.getState();
      var picked = effects.gamble[effects.gamble.length - 1];
      var sum = 0;
      for (var g = 0; g < effects.gamble.length; g++) {
        sum += effects.gamble[g].chance;
        if (roll < sum) { picked = effects.gamble[g]; break; }
      }
      var inner = Game.rules.events.apply(s, picked.effects);
      s = inner.state;
      log = log.concat(inner.log);
      outcome = (picked.text ? picked.text + ': ' : '') + Game.rules.events.describe(state, picked.effects) + '.';
    }
    if (effects.followUp) {
      s.eventQueue = (s.eventQueue || []).concat([{ eventId: effects.followUp.eventId, day: s.day + effects.followUp.inDays, data: effects.followUp.data || {} }]);
    }
    return { state: s, log: log, outcome: outcome };
  },

  // The streams change from active events (a sync license, a backlash): a multiplier, never under the floor.
  streamsMultiplier: function (state) {
    var total = Game.rules.events.active(state, 'streams').reduce(function (sum, e) { return sum + e.amount; }, 0);
    return Math.max(Game.balance.events.streamsFloor, 1 + total);
  },

  // Extra award chances from active events (a documentary, a magazine cover).
  awardsBoost: function (state) {
    return Game.rules.events.active(state, 'awards').reduce(function (sum, e) { return sum + e.amount; }, 0);
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
