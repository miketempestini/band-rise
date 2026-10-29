// events.test.js
// Tests for random events (js/content/events.js and js/rules/events.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    return s;
  }

  // Puts a specific event on today, like the morning roll would.
  function withEvent(s, eventId, data) {
    s = Game.util.clone(s);
    s.pendingEvent = { eventId: eventId, day: s.day, data: data || {} };
    s.eventHistory[eventId] = s.day;
    return s;
  }

  Game.test('Events: every event has a weight, text, and a safe choice', function (t) {
    var s = freshState();
    s.band.memberIds = [];
    var all = Game.rules.events.all();
    Object.keys(all).forEach(function (id) {
      var e = all[id];
      t.ok(e.weight > 0, id + ' weight');
      var data = { venueId: 'cornerTap', personId: 'p1', cash: 20, bandId: s.scene.rivals[0] };
      t.ok(e.text(s, data).length > 0, id + ' text');
      var choices = e.choices(s, data);
      t.ok(choices.length >= 2, id + ' has choices');
      t.equal(choices.filter(function (c) { return c.safe; }).length, 1, id + ' has exactly one safe choice');
    });
  });

  Game.test('Events: starting out, about one every 3 to 5 days', function (t) {
    var count = 0, days = 0;
    for (var seed = 1; seed <= 30; seed++) {
      var s = freshState(seed);
      for (var d = 0; d < 21; d++) {
        s = Game.rules.day.endDay(s).state;
        if (s.pendingEvent) count += 1;
        days += 1;
      }
    }
    var every = days / count;
    t.ok(every >= 2.5 && every <= 5.5, 'one every ' + Math.round(every * 10) / 10 + ' days');
  });

  Game.test('Events: the overtime offer is guaranteed on the first Friday', function (t) {
    for (var seed = 1; seed <= 5; seed++) {
      var s = freshState(seed);
      for (var d = 0; d < 4; d++) {
        s.pendingEvent = null;
        s = Game.rules.day.endDay(s).state;
      }
      t.equal(s.pendingEvent && s.pendingEvent.eventId, 'overtime', 'seed ' + seed + ': Friday overtime offer');
    }
  });

  Game.test('Events: choices describe their effects before you pick', function (t) {
    var s = withEvent(freshState(), 'crackingAmp');
    var choices = Game.rules.events.choices(s);
    t.equal(choices[0].description, '-$60');
    t.equal(choices[1].description, '-3 gig score for 7 days');
  });

  Game.test('Events: playing on with a crackling amp costs 3 gig score for 7 days', function (t) {
    var s = withEvent(freshState(), 'crackingAmp');
    s = Game.rules.events.resolve(s, 'playOn').state;
    t.equal(s.pendingEvent, null, 'answered');
    t.equal(Game.rules.events.gigScoreChange(s), -3, 'active');
    s.day = 1;
    var gig = Game.rules.gigs.playGig(s, 'rustyNail', Game.rules.gigs.suggestSet(s, 2), 100).gig;
    t.equal(gig.parts.filter(function (p) { return p.id === 'setbacks'; })[0].value, -3, 'shows in the score breakdown');
    s.day = 7;
    t.equal(Game.rules.events.gigScoreChange(s), 0, 'over after 7 days');
  });

  Game.test('Events: taking overtime makes Saturday a paid shift ($165)', function (t) {
    var s = freshState();
    s.day = 4; // Friday
    s = Game.rules.actions.plan(s, 'morning', 'practice', null, 5).state; // a plan on Saturday morning
    s = withEvent(s, 'overtime');
    var r = Game.rules.events.resolve(s, 'take');
    s = r.state;
    t.ok(Game.rules.job.scheduledOn(s, 5), 'working Saturday');
    t.ok(!s.schedule[5].morning, 'the planned task was removed');
    t.ok(r.log.join(' ').indexOf('Removed') !== -1, 'says so');
    s = Game.rules.day.endDay(s).state; // Friday night
    var cash = s.player.cash;
    s = Game.rules.day.endDay(s).state; // Saturday: overtime
    t.equal(s.player.cash, cash + 165, '+$165');
    t.ok(!Game.rules.job.scheduledOn(s, 12), 'only that one Saturday');
  });

  Game.test('Events: taking the bus costs 5 energy every night for 7 days', function (t) {
    var s = withEvent(freshState(), 'carTrouble');
    s = Game.rules.events.resolve(s, 'bus').state;
    s.player.energy = 50;
    s = Game.rules.events.nightly(s).state;
    t.equal(s.player.energy, 45, '-5');
    s.day = 7;
    t.equal(Game.rules.events.active(s, 'dailyEnergy').length, 0, 'over after 7 days');
  });

  Game.test('Events: a fill-in offer books a show tomorrow with no booking odds', function (t) {
    var s = freshState();
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    s.player.reputation = 5;
    t.ok(Game.content.events.fillIn.when(s), 'can happen at reputation 5 with 6 songs');
    s = withEvent(s, 'fillIn', { venueId: 'backRoom' });
    s = Game.rules.events.resolve(s, 'accept').state;
    var e = s.entries[s.schedule[s.day + 1].evening];
    t.equal(e.type, 'gig', 'booked');
    t.equal(e.venueId, 'backRoom');
    t.equal(e.deal, 'guarantee');
    t.equal(s.player.reputation, 6, '+1 reputation');
  });

  Game.test('Events: an unanswered event gets its safe choice at End Day', function (t) {
    var s = withEvent(freshState(), 'party');
    var morale = s.player.morale;
    var after = Game.rules.day.endDay(s);
    t.ok(after.state.lastDayReport.overnight.join(' ').indexOf('didn\'t answer') !== -1, 'Day results say so');
    t.ok(after.state.player.morale <= morale - 3 + 0, 'earplugs: -3 morale (plus the day\'s other changes)');
  });

  Game.test('Events: the same event doesn\'t come back within its cooldown', function (t) {
    var s = freshState();
    s.eventHistory.party = s.day;
    t.ok(!Game.rules.events.eligible(s).some(function (e) { return e.id === 'party'; }), 'on cooldown');
    s.day += Game.balance.events.stages[Game.rules.events.stage(s)].cooldownDays; // each stage sets how long before a repeat
    t.ok(Game.rules.events.eligible(s).some(function (e) { return e.id === 'party'; }), 'back after the cooldown');
  });

  // ----- Events that grow with your career -----

  Game.test('Events: your stage comes from reputation, and each stage has its own pool', function (t) {
    var ev = Game.rules.events;
    var s = freshState();
    var stages = Game.balance.events.stages;
    var check = function (rep, stage) {
      s.player.reputation = rep;
      t.equal(ev.stage(s), stage, 'reputation ' + rep + ': ' + stage);
      return ev.eligible(s).map(function (e) { return e.id; });
    };
    var early = check(0, 'starting');
    t.ok(early.indexOf('party') !== -1 && early.indexOf('tvSpot') === -1, 'starting out: the roommate\'s party yes, the halftime show no');
    var touring = check(stages.touring.minReputation, 'touring');
    t.ok(touring.indexOf('lessons') === -1, 'a touring act never gets the $40 lesson');
    var star = check(stages.star.minReputation, 'star');
    t.ok(star.indexOf('tvSpot') !== -1 && star.indexOf('lessons') === -1, 'a star gets the halftime show');
    t.ok(Object.keys(ev.all()).filter(function (id) { return !ev.get(id).story; }).length >= 60, 'about 70 events (' + Object.keys(ev.all()).length + ' with story steps)');
  });

  Game.test('Events: money scales with your stage', function (t) {
    var ev = Game.rules.events;
    var stages = Game.balance.events.stages;
    var s = freshState();
    s.player.reputation = 0;
    t.equal(ev.scaled(s, 60), 60, 'starting out: as written');
    s.player.reputation = stages.touring.minReputation;
    t.equal(ev.scaled(s, 60), 60 * stages.touring.moneyScale, 'touring: x' + stages.touring.moneyScale);
    s.player.reputation = stages.star.minReputation;
    t.equal(ev.scaled(s, 60), 60 * stages.star.moneyScale, 'star: x' + stages.star.moneyScale);
  });

  Game.test('Events: every event builds its card at each of its stages (a new career and the late save)', function (t) {
    var ev = Game.rules.events;
    var late = Game.save.parse(JSON.stringify(Game.testSaves.lateCareer)).state;
    var problems = [];
    [freshState(), late].forEach(function (base, which) {
      Object.keys(ev.all()).forEach(function (id) {
        var e = ev.get(id);
        e.stages.forEach(function (stage) {
          var s = Game.util.clone(base);
          s.player.reputation = Game.balance.events.stages[stage].minReputation;
          var data = { venueId: 'cornerTap', personId: s.band.memberIds[0] || 'p1', cash: 20, bandId: s.scene.rivals[0] };
          try {
            if (e.setup && e.when(s)) data = e.setup(s, Game.rng.create(3));
            s.pendingEvent = { eventId: id, day: s.day, data: data };
            var choices = ev.choices(s);
            if (!e.text(s, data) || choices.length < 2 || choices.filter(function (c) { return c.safe; }).length !== 1) problems.push(id + '@' + stage);
            if (choices.some(function (c) { return !c.description || /undefined|NaN/.test(c.description); })) problems.push(id + '@' + stage + ' text');
          } catch (err) { problems.push(id + '@' + stage + ' (' + (which ? 'late' : 'new') + '): ' + err.message); }
        });
      });
    });
    t.equal(problems.length, 0, problems.slice(0, 4).join('; ') || 'all good');
  });

  Game.test('Events: a gamble shows its odds and rolls one outcome with the game\'s dice', function (t) {
    var ev = Game.rules.events;
    var s = freshState();
    s.player.reputation = Game.balance.events.stages.touring.minReputation;
    s.cities.hometown.fans = 10000;
    s.pendingEvent = { eventId: 'podcast', day: s.day, data: {} };
    var go = ev.choices(s).filter(function (c) { return c.id === 'go'; })[0];
    t.ok(/55%: You were funny and real/.test(go.description) && /45%/.test(go.description), 'odds on the card: ' + go.description);
    var outcomes = {};
    for (var seed = 1; seed <= 30; seed++) {
      var x = Game.util.clone(s);
      x.rngState = seed;
      var r = ev.resolve(x, 'go');
      outcomes[r.state.cities.hometown.fans > 10000 ? 'win' : 'lose'] = true;
      if (seed === 1) t.ok(/funny and real|regret/.test(r.log[0]), 'the log says what happened: ' + r.log[0]);
    }
    t.ok(outcomes.win && outcomes.lose, 'both outcomes happen');
  });

  Game.test('Events: a story continues on its day, skipping the dice', function (t) {
    var ev = Game.rules.events;
    var s = freshState();
    s.player.reputation = Game.balance.events.stages.touring.minReputation;
    s.pendingEvent = { eventId: 'brandDeal', day: s.day, data: {} };
    var signed = ev.resolve(s, 'sign').state;
    t.equal(signed.eventQueue.length, 1, 'the ad is queued');
    var due = signed.eventQueue[0].day;
    t.equal(due - s.day, Game.balance.events.brandDeal.followDays, 'in ' + Game.balance.events.brandDeal.followDays + ' days');
    var early = Game.util.clone(signed);
    early.day = due - 1;
    early.rngState = 1;
    var r1 = ev.roll(early).state;
    t.ok(!r1.pendingEvent || r1.pendingEvent.eventId !== 'brandDealAd', 'not before its day');
    var onDay = Game.util.clone(signed);
    onDay.day = due;
    var r2 = ev.roll(onDay).state;
    t.equal(r2.pendingEvent.eventId, 'brandDealAd', 'on its day: the story continues');
    t.equal(r2.eventQueue.length, 0, 'off the queue');
    t.ok(!ev.eligible(onDay).some(function (e) { return e.story; }), 'story steps never roll at random');
  });

  Game.test('Events: new effects: fans, buzz everywhere, streams for a while, award chances, label mood, a bandmate leaving', function (t) {
    var ev = Game.rules.events;
    var s = freshState();
    s.cities.hometown.fans = 10000;
    s.cities.harlowFalls.fans = 2000;
    var r = ev.apply(s, { fans: 0.1, buzzAll: 7 }).state;
    t.equal(r.cities.hometown.fans, 11000, '+10% fans in each city');
    t.equal(r.cities.harlowFalls.buzz, s.cities.harlowFalls.buzz + 7, 'buzz everywhere you have fans');
    r = ev.apply(s, { streams: { amount: 0.4, weeks: 2, label: 'Test' }, awardsBoost: 0.1 }).state;
    t.near(ev.streamsMultiplier(r), 1.4, 'streams +40%');
    t.near(ev.awardsBoost(r), 0.1, 'award chances +10%');
    var later = Game.util.clone(r);
    later.day += 15;
    t.near(ev.streamsMultiplier(later), 1, 'the streams boost wears off');
    var dip = ev.apply(s, { streams: { amount: -0.95, weeks: 1 } }).state;
    t.near(ev.streamsMultiplier(dip), Game.balance.events.streamsFloor, 'a dip never goes below the floor');
    var band = Game.util.clone(s);
    band.people.p1 = { id: 'p1', name: 'Test Member', status: 'member', satisfaction: 70 };
    band.band.memberIds = ['p1'];
    var gone = ev.apply(band, { memberLeaves: 'p1' }).state;
    t.equal(gone.band.memberIds.length, 0, 'a bandmate can leave');
    t.ok(ev.risky({ gamble: [{ chance: 1, effects: { memberLeaves: 'p1' } }] }), 'and the card warns you');
  });

  Game.test('Events: bigger stages roll a little less often, and wait longer before a repeat', function (t) {
    var st = Game.balance.events.stages;
    var order = Game.balance.events.stageOrder;
    for (var i = 1; i < order.length; i++) {
      t.ok(st[order[i]].dailyChance <= st[order[i - 1]].dailyChance, order[i] + ': chance ' + st[order[i]].dailyChance);
      t.ok(st[order[i]].cooldownDays >= st[order[i - 1]].cooldownDays, order[i] + ': cooldown ' + st[order[i]].cooldownDays + ' days');
    }
  });

  Game.test('Events: a cost never takes more than a share of your cash, but small bills are paid in full', function (t) {
    var e = Game.balance.events;
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.reputation = e.stages.star.minReputation;
    s.player.cash = 3500;
    s.pendingEvent = { eventId: 'sampleLawsuit', day: s.day, data: {} };
    var settle = Game.rules.events.choices(s).filter(function (c) { return c.id === 'settle'; })[0];
    var cap = Math.floor(3500 * e.maxCashShare / e.stages.star.roundTo) * e.stages.star.roundTo;
    var expected = Math.max(e.costFloor, cap);
    t.ok(-settle.effects.cash > expected, 'the full star-sized bill is bigger than the cap');
    t.ok(settle.description.indexOf('-$' + expected.toLocaleString()) !== -1, 'the card shows the capped cost: ' + settle.description);
    var after = Game.rules.events.resolve(s, 'settle').state;
    t.equal(after.player.cash, 3500 - expected, 'only the capped cost is paid');
    t.equal(after.player.loanOwed, 0, 'no family loan needed');
    // A rich star pays the whole bill.
    s.player.cash = 10000000;
    t.equal(Game.rules.events.cashOf(s, settle.effects), settle.effects.cash, 'the full bill when you can afford it');
    // A small bill is paid in full even when broke.
    s.player.cash = 0;
    t.equal(Game.rules.events.cashOf(s, { cash: -e.costFloor }), -e.costFloor, 'bills up to the floor are always paid');
    t.equal(Game.rules.events.cashOf(s, { cash: 5000 }), 5000, 'gains are never capped');
  });

})();
