// day.test.js
// Tests for the calendar and End Day (js/rules/day.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function dayTestState() {
    return Game.rules.career.startCareer('Test', 'guitar', 1).state;
  }

  // Runs End Day a number of times and returns the last result.
  function endDays(state, count) {
    var result = { state: state };
    for (var i = 0; i < count; i++) result = Game.rules.day.endDay(result.state);
    return result;
  }

  Game.test('End Day: moves to the next day', function (t) {
    var result = Game.rules.day.endDay(dayTestState());
    t.equal(result.state.day, 1);
  });

  Game.test('End Day: Friday night pays $110 for each of the 5 shifts', function (t) {
    var thursdayDone = endDays(dayTestState(), 4).state; // Monday to Thursday ended
    t.equal(thursdayDone.player.cash, 500, 'no pay before Friday night');
    var fridayDone = Game.rules.day.endDay(thursdayDone).state;
    t.equal(fridayDone.player.cash, 500 + 5 * 110, 'paid $550 on Friday night');
    t.equal(fridayDone.player.job.unpaidShifts, 0, 'unpaid shifts reset after payday');
  });

  Game.test('End Day: Sunday night charges $400 bills and ends the week', function (t) {
    var saturdayDone = endDays(dayTestState(), 6).state;
    t.equal(saturdayDone.player.cash, 1050, 'before Sunday: $500 + $550 pay');
    var sunday = Game.rules.day.endDay(saturdayDone);
    t.equal(sunday.state.player.cash, 650, 'after Sunday: $1,050 - $400');
    t.ok(sunday.weekEnded, 'week ended');
    var week = sunday.state.ledger[0];
    t.equal(week.income.dayJob, 550, 'summary: day job income');
    t.equal(week.costs.bills, 400, 'summary: bills');
    t.equal(week.startCash, 500, 'summary: starting cash');
    t.equal(week.endCash, 650, 'summary: ending cash');
    t.equal(sunday.state.thisWeek.startCash, 650, 'next week starts fresh from the new cash');
  });

  Game.test('End Day: a weekday costs 40 energy for the job, +5 for the free evening, then +50 overnight', function (t) {
    var s = dayTestState();
    s.player.energy = 60;
    t.equal(Game.rules.day.endDay(s).state.player.energy, 75, '60 - 40 + 5 + 50');
  });

  Game.test('End Day: weekend days give +5 per empty block, and energy never goes over 100', function (t) {
    var s = endDays(dayTestState(), 5).state; // now Saturday
    s.player.energy = 30;
    t.equal(Game.rules.day.endDay(s).state.player.energy, 95, '30 + 15 + 50');
    s.player.energy = 80;
    t.equal(Game.rules.day.endDay(s).state.player.energy, 100, 'capped at 100');
  });

  Game.test('End Day: energy can\'t drop below 0 from the job', function (t) {
    var s = dayTestState();
    s.player.energy = 10;
    t.equal(Game.rules.day.endDay(s).state.player.energy, 50, '10 - 40 + 5 stops at 0, then +50');
  });

  Game.test('End Day: each job shift costs 2 morale; weekends cost nothing', function (t) {
    var week = endDays(dayTestState(), 5).state;
    t.equal(week.player.morale, 60 - 5 * 2, 'five shifts: -10');
    t.equal(Game.rules.day.endDay(week).state.player.morale, 50, 'Saturday: no change');
  });

  Game.test('End Day: running short on Sunday triggers a loan', function (t) {
    var s = endDays(dayTestState(), 6).state;
    s.player.cash = 100;
    var sunday = Game.rules.day.endDay(s).state;
    t.equal(sunday.player.cash, 700, '100 - 400 + 1,000');
    t.equal(sunday.player.loanOwed, 1000);
    t.equal(sunday.ledger[0].loans, 1000, 'loan shows in the weekly summary');
  });

  Game.test('Going broke: game over on the 6th Sunday in a row with debt above $3,000', function (t) {
    var s = dayTestState();
    s.player.cash = 100000;   // plenty of cash so bills don't add more loans
    s.player.loanOwed = 3500;
    s = endDays(s, 7 * 5).state;
    t.equal(s.player.debtWeeksOverLimit, 5, 'five Sundays over the limit');
    t.equal(s.gameOver, null, 'five weeks: still playing');
    s = endDays(s, 7).state;
    t.ok(s.gameOver, 'sixth Sunday: game over');
    t.equal(s.gameOver.message, "You went broke, had to sell your guitar, and move back into your parent's house. Maybe this music thing is more of a hobby for you.", 'exact message');
    var after = Game.rules.day.endDay(s).state;
    t.equal(after.day, s.day, 'End Day does nothing after game over');
  });

  Game.test('Going broke: getting debt to $3,000 or less resets the count', function (t) {
    var s = dayTestState();
    s.player.cash = 100000;
    s.player.loanOwed = 3500;
    s = endDays(s, 7 * 4).state;
    t.equal(s.player.debtWeeksOverLimit, 4);
    s.player.loanOwed = 3000; // exactly $3,000 is not "above"
    s = endDays(s, 7).state;
    t.equal(s.player.debtWeeksOverLimit, 0, 'count back to 0');
  });

  Game.test('Calendar: days until rent and the week forecast', function (t) {
    var s = dayTestState();
    t.equal(Game.rules.day.daysUntilBills(s), 6, 'Monday: 6 days');
    var f = Game.rules.day.weekForecast(s);
    t.equal(f.upcomingPay, 550, 'Monday: all 5 shifts still to be paid');
    t.equal(f.bills, 400);
    t.equal(f.projectedCash, 650);
    var sunday = endDays(s, 6).state;
    t.equal(Game.rules.day.daysUntilBills(sunday), 0, 'Sunday: due tonight');
    t.equal(Game.rules.day.weekForecast(sunday).upcomingPay, 0, 'Sunday: payday already happened');
  });

})();
