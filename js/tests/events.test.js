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
    Object.keys(Game.content.events).forEach(function (id) {
      var e = Game.content.events[id];
      t.ok(e.weight > 0, id + ' weight');
      var data = { venueId: 'cornerTap', personId: 'p1', cash: 20 };
      t.ok(e.text(s, data).length > 0, id + ' text');
      var choices = e.choices(s, data);
      t.ok(choices.length >= 2, id + ' has choices');
      t.equal(choices.filter(function (c) { return c.safe; }).length, 1, id + ' has exactly one safe choice');
    });
  });

  Game.test('Events: about one every 3 to 4 days on average', function (t) {
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
    t.ok(every >= 2.5 && every <= 4.5, 'one every ' + Math.round(every * 10) / 10 + ' days');
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
    s.day += Game.balance.events.defaultCooldownDays;
    t.ok(Game.rules.events.eligible(s).some(function (e) { return e.id === 'party'; }), 'back after the cooldown');
  });

})();
