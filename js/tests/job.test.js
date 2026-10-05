// job.test.js
// Tests for the day job: standing, days off, getting fired, and Look for work (js/rules/job.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    return Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
  }

  function endDays(s, n) {
    for (var i = 0; i < n; i++) s = Game.rules.day.endDay(s).state;
    return s;
  }

  Game.test('Job: +1 standing per shift worked', function (t) {
    var s = endDays(freshState(), 1);
    t.equal(s.player.job.standing, 61, '60 + 1');
  });

  Game.test('Job: calling in sick costs 15 standing and isn\'t paid; skipping costs 25', function (t) {
    var s = freshState();
    t.ok(Game.rules.job.dayOffProblem(s, s.day + 3, 'sick'), 'can\'t call in sick 3 days ahead');
    s = Game.rules.job.takeDayOff(s, s.day, 'sick').state;
    s.player.energy = 60;
    var after = endDays(s, 1);
    t.equal(after.player.job.standing, 45, '60 - 15');
    t.equal(after.player.job.unpaidShifts, 0, 'not paid');
    t.ok(after.player.energy > 60, 'no job blocks: free time all day');
    var skip = Game.rules.job.takeDayOff(freshState(), 2, 'skip').state;
    t.equal(endDays(skip, 3).player.job.standing, 60 + 2 - 25, 'two shifts, then -25');
  });

  Game.test('Job: vacation days need 14 days\' notice, are paid, and there are 10 a year', function (t) {
    var s = freshState();
    t.ok(Game.rules.job.dayOffProblem(s, 13, 'vacation'), '13 days ahead: too soon');
    s = Game.rules.job.takeDayOff(s, 14, 'vacation').state;
    t.equal(s.player.job.vacationDaysLeft, 9, 'one used');
    s = endDays(s, 15);
    t.equal(s.player.job.standing, 60 + 10, 'no standing lost (10 shifts worked, +1 each)');
    var none = freshState();
    none.player.job.vacationDaysLeft = 0;
    t.ok(Game.rules.job.dayOffProblem(none, 20, 'vacation'), 'no days left');
    var c = Game.rules.job.cancelDayOff(Game.rules.job.takeDayOff(freshState(), 21, 'vacation').state, 21).state;
    t.equal(c.player.job.vacationDaysLeft, 10, 'cancelling gives the day back');
  });

  Game.test('Job: a vacation day is paid on Friday like a worked shift', function (t) {
    var s = Game.rules.job.takeDayOff(freshState(), 0, 'vacation', true).state;
    s = endDays(s, 5);
    t.equal(s.player.cash, 500 + 5 * 110, 'all 5 shifts paid');
  });

  Game.test('Job: below 25 you get a warning; at 0 you\'re fired', function (t) {
    var s = freshState();
    s.player.job.standing = 30;
    var warned = Game.rules.job.changeStanding(s, -10);
    t.ok(warned.log.join(' ').indexOf('warned') !== -1, 'warning at 20');
    var fired = Game.rules.job.changeStanding(warned.state, -25);
    t.equal(fired.state.player.job.standing, 0);
    t.equal(fired.state.player.job.status, 'none', 'fired');
    t.ok(fired.log.join(' ').indexOf('fired') !== -1, 'says so');
    t.equal(Game.rules.day.isJobBlock(fired.state, 'morning'), false, 'no more job blocks');
  });

  Game.test('Look for work: only without a job; a find starts part-time next Monday', function (t) {
    var s = freshState();
    t.equal(Game.rules.actions.option(s, 'evening', 'lookForWork').ok, false, 'not while employed');
    s.player.job.status = 'none';
    s.day = 2; // Wednesday
    var found = null;
    for (var seed = 1; seed <= 20 && !found; seed++) {
      s.rngState = seed;
      var r = Game.rules.job.lookForWork(s);
      if (r.found) found = r.state;
    }
    t.ok(found, 'found a job within 20 tries');
    t.equal(found.player.job.status, 'part');
    t.equal(found.player.job.startsDay, 7, 'starts next Monday');
    t.equal(Game.rules.job.scheduledOn(found, 4), false, 'not this Friday');
    t.equal(Game.rules.job.scheduledOn(found, 7), true, 'Monday');
    t.equal(Game.rules.job.scheduledOn(found, 8), false, 'not Tuesday (part-time)');
  });

  Game.test('Booking over the job: the afternoon in-store needs a day off', function (t) {
    var s = freshState();
    s.player.reputation = 12;
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    var gigDay = 8; // Tuesday next week (a workday)
    s = Game.rules.booking.sendRequest(s, 'hollowRecords', gigDay, 'inStore').state;
    s.debug.acceptNextBooking = true;
    s = Game.rules.debug.replyNow(s).state;
    var msg = s.inbox[0].id;
    t.ok(Game.rules.booking.acceptProblem(s, msg, null), 'needs a choice');
    t.ok(Game.rules.booking.acceptProblem(s, msg, 'vacation'), 'vacation needs 14 days\' notice');
    var r = Game.rules.booking.acceptOffer(s, msg, 'sick');
    t.ok(r.entryId, 'booked with a sick day');
    t.equal(r.state.player.job.daysOff[gigDay], 'sick');
  });

  Game.test('Vacation days reset on January 1', function (t) {
    var s = freshState();
    s.player.job.vacationDaysLeft = 3;
    var newYear = 0;
    while (!Game.rules.day.isNewYear(newYear)) newYear += 1;
    s.day = newYear - 2;
    s.pendingEvent = null;
    s = Game.rules.day.endDay(s).state;
    t.equal(s.player.job.vacationDaysLeft, 3, 'December 30: not yet');
    s.pendingEvent = null;
    s = Game.rules.day.endDay(s).state;
    t.equal(Game.rules.day.dateLabel(s.day), 'Friday, January 1', 'January 1, 2027');
    t.equal(s.player.job.vacationDaysLeft, Game.balance.job.vacationDaysPerYear, 'reset');
  });

})();
