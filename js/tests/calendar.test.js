// calendar.test.js
// Tests for real calendar dates: day numbers become dates (a new career starts Monday, January 5, 2026),
// short dates, week labels, month and year rollovers, and New Year's Day.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var D = function () { return Game.rules.day; };

  // The first day number that matches a test (searching forward from day 0).
  function findDay(test) {
    var day = 0;
    while (!test(day)) day += 1;
    return day;
  }

  Game.test('Dates: day 0 is Monday, January 5, 2026, and each day after is the next calendar day', function (t) {
    t.equal(D().dateLabel(0), 'Monday, January 5', 'day 0');
    t.equal(D().longDate(0), 'Monday, January 5, 2026', 'with the year');
    t.sameContents(D().date(0), { year: 2026, month: 0, date: 5, dayOfWeek: 0 }, 'as parts');
    t.equal(D().dateLabel(5), 'Saturday, January 10', 'day 5 is a Saturday');
    t.equal(D().dateLabel(26), 'Saturday, January 31', 'the end of January');
    t.equal(D().dateLabel(27), 'Sunday, February 1', 'rolls into February');
    for (var day = 0; day < 800; day += 37) {
      t.equal(D().date(day).dayOfWeek, D().dayOfWeek(day), 'weekdays always line up (day ' + day + ')');
    }
  });

  Game.test('Dates: short dates, week labels, spans, and leap years', function (t) {
    t.equal(D().shortDate(5), 'Sat, Jan 10', 'short date');
    t.equal(D().weekLabel(3), 'Jan 5 – 11', 'a week inside one month');
    t.equal(D().weekLabel(D().firstDayOfWeek(4)), 'Jan 26 – Feb 1', 'a week across two months');
    t.equal(D().firstDayOfWeek(4), 21, 'week 4 starts on day 21');
    t.equal(D().spanLabel(0, 27), 'January 5 – February 1', 'a span');
    var leap = findDay(function (d) { var x = D().date(d); return x.year === 2028 && x.month === 1 && x.date === 29; });
    t.equal(D().dateLabel(leap), 'Tuesday, February 29', '2028 has a February 29');
    t.equal(D().dateLabel(leap + 1), 'Wednesday, March 1', 'then March 1');
  });

  Game.test('Dates: New Year\'s Day, and the year changes on it', function (t) {
    var ny = findDay(D().isNewYear);
    t.equal(D().longDate(ny), 'Friday, January 1, 2027', 'the first New Year\'s Day');
    t.equal(D().date(ny - 1).year, 2026, 'the day before is still 2026');
    t.equal(findDay(function (d) { return d > ny && D().isNewYear(d); }) - ny, 365, '2027 has 365 days');
  });

  Game.test('Awards follow real Decembers: the first Monday and the last Saturday', function (t) {
    var aw = Game.rules.awards;
    var noms = findDay(aw.isNominationsDay);
    t.equal(D().longDate(noms), 'Monday, December 7, 2026', 'nominations');
    t.equal(D().longDate(aw.ceremonyDayAfter(noms)), 'Saturday, December 26, 2026', 'the ceremony');
    var next = findDay(function (d) { return d > noms && aw.isNominationsDay(d); });
    t.equal(D().longDate(next), 'Monday, December 6, 2027', 'next year');
    t.equal(aw.year(noms), 2026, 'the award year is the calendar year');
  });

})();
