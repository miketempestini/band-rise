// planning.test.js
// Tests for planning tasks on later days from the Calendar (Game.rules.actions with a day).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    return s;
  }

  function endDays(s, n) {
    for (var i = 0; i < n; i++) s = Game.rules.day.endDay(s).state;
    return s;
  }

  Game.test('Planning ahead: a task planned for a later day waits there, then shows up on Today', function (t) {
    var s = freshState();
    s = Game.rules.actions.plan(s, 'morning', 'practice', null, 5).state; // Saturday morning
    t.equal(s.day, 0, 'still today');
    t.equal(Game.rules.actions.plannedActionId(s, 'morning'), null, 'nothing planned today');
    var e = s.entries[s.schedule[5].morning];
    t.equal(e.actionId, 'practice', 'saved on Saturday');
    t.ok(e.plannedAhead, 'marked as planned ahead');
    s = endDays(s, 5);
    t.equal(Game.rules.actions.plannedActionId(s, 'morning'), 'practice', 'on Saturday it\'s on Today');
  });

  Game.test('Planning ahead: energy and cash aren\'t checked until the day comes', function (t) {
    var s = freshState();
    s.player.energy = 0;
    s.player.cash = 0;
    var r = Game.rules.actions.plan(s, 'evening', 'hangOut', null, 5);
    t.ok(r.log.length > 0, 'Hang out still needs someone to hang out with');
    var met = Game.rules.people.meet(s);
    r = Game.rules.actions.plan(met.state, 'evening', 'hangOut', met.personId, 5);
    t.equal(r.log.length, 0, 'planned even with $0 and 0 energy today');
    t.equal(Game.rules.actions.option(met.state, 'evening', 'hangOut').ok, false, 'but today it would be refused');
  });

  Game.test('Planning ahead: job blocks, shows, and open mic nights still apply to that day', function (t) {
    var s = freshState();
    t.ok(Game.rules.actions.plan(s, 'morning', 'practice', null, 2).log.length > 0, 'Wednesday morning is the day job');
    t.equal(Game.rules.actions.plan(s, 'evening', 'openMic', null, 8).log.length, 0, 'next Tuesday evening: open mic OK');
    t.ok(Game.rules.actions.plan(s, 'evening', 'openMic', null, 9).log.length > 0, 'next Wednesday: no open mic');
    t.ok(Game.rules.actions.plan(s, 'evening', 'emailVenue', { venueId: 'backRoom', gigDay: 20, deal: 'guarantee' }, 3).log.length > 0,
      'emails can\'t be planned ahead');
    t.ok(Game.rules.actions.plan(s, 'evening', 'practice', null, -1).log.length > 0, 'past days refused');
  });

  Game.test('Planning ahead: change or clear a planned task on that day or before', function (t) {
    var s = freshState();
    s = Game.rules.actions.plan(s, 'evening', 'practice', null, 3).state;
    s = Game.rules.actions.plan(s, 'evening', 'write', null, 3).state;
    t.equal(s.entries[s.schedule[3].evening].actionId, 'write', 'changed to Write');
    t.equal(Object.keys(s.entries).length, 1, 'the old plan was replaced, not doubled');
    s = Game.rules.actions.clear(s, 'evening', 3).state;
    t.ok(!s.schedule[3].evening, 'cleared');
  });

  Game.test('Planning ahead: if the task can\'t happen on the day (no energy), it\'s skipped as free time', function (t) {
    var s = freshState();
    s = Game.rules.actions.plan(s, 'evening', 'practice', null, 1).state;
    s = endDays(s, 1);
    s.player.energy = 45; // 45 - 40 for the job leaves 5: not enough for Practice (15)
    var row = Game.rules.actions.dayPlan(s)[2];
    t.ok(row.problem, 'Today flags it: ' + row.problem);
    var after = Game.rules.day.endDay(s).state;
    t.equal(after.lastDayReport.blocks[2].title, 'Free time', 'skipped');
  });

  Game.test('Planning ahead: a show booked into that block replaces the planned task', function (t) {
    var s = freshState();
    s.player.reputation = 12;
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    s = Game.rules.actions.plan(s, 'evening', 'practice', null, 10).state;
    s = Game.rules.booking.sendRequest(s, 'backRoom', 10, 'guarantee').state;
    s.debug.acceptNextBooking = true;
    s = Game.rules.debug.replyNow(s).state;
    var r = Game.rules.booking.acceptOffer(s, s.inbox[0].id, null);
    t.ok(r.entryId, 'booked');
    t.equal(r.state.entries[r.state.schedule[10].evening].type, 'gig', 'the show has the block');
    t.ok(r.log.join(' ').indexOf('replaces your planned Practice') !== -1, 'says so');
  });

  Game.test('Planning ahead: taking a day off frees the job blocks; undoing it removes plans there', function (t) {
    var s = freshState(); // day 21 is a Monday (a workday)
    s = Game.rules.job.takeDayOff(s, 21, 'vacation').state;
    s = Game.rules.actions.plan(s, 'morning', 'write', null, 21).state;
    t.equal(s.entries[s.schedule[21].morning].actionId, 'write', 'planned in a freed job block');
    var undone = Game.rules.job.cancelDayOff(s, 21);
    t.ok(!undone.state.schedule[21].morning, 'removed when you go back to work');
    t.ok(undone.log.length > 0, 'says so');
  });

})();
