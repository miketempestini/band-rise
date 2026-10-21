// mobile.test.js
// Tests for the phone layout's own pieces: the Calendar's week strip rule, and that the phone's bottom bar plus its
// More sheet reach every screen the desktop tabs do. (How things look on a phone is checked by eye and by the
// screens test, which draws the phone pieces along with every screen.)

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  Game.test('Phone calendar: the week strip starts on this week\'s Monday and stays inside the calendar', function (t) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.day = 10; // a Wednesday
    var week = Game.rules.day.calendarWeek(s, 0);
    t.equal(week.start, 7, 'this week starts on Monday (day 7)');
    t.equal(week.weeks, Game.balance.time.startBookingWeeks, Game.balance.time.startBookingWeeks + ' weeks without a manager');
    t.equal(Game.rules.day.calendarWeek(s, 2).start, 7 + 2 * Game.balance.time.daysPerWeek, 'two weeks on');
    t.equal(Game.rules.day.calendarWeek(s, 99).index, week.weeks - 1, 'never past the last week');
    t.equal(Game.rules.day.calendarWeek(s, -3).index, 0, 'never before this week');
    s.manager.hired = true;
    t.equal(Game.rules.day.calendarWeek(s, 99).index, Game.balance.time.managerBookingWeeks - 1, 'with a manager: 12 weeks');
  });

  Game.test('Phone navigation: the bottom bar and the More sheet reach every screen the desktop tabs do', function (t) {
    if (!Game.ui || !Game.ui.mobile) { t.ok(true, 'screens not loaded'); return; }
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    var desktop = [];
    var html = Game.ui.topbar.navHtml(s, 'today');
    html.replace(/data-nav="([a-zA-Z]+)"/g, function (all, screen) { desktop.push(screen); return all; });
    var phone = Game.ui.mobile.barTabs.concat(Game.ui.mobile.moreTabs(s)).map(function (tab) { return tab[0]; });
    t.ok(desktop.length >= 10, desktop.length + ' desktop tabs');
    t.ok(desktop.every(function (screen) { return phone.indexOf(screen) !== -1; }), 'every desktop tab is on the phone: ' + phone.join(', '));
    s.manager.hired = true;
    t.ok(Game.ui.mobile.moreTabs(s).some(function (tab) { return tab[0] === 'manager'; }), 'Manager shows up in More once you have one');
    t.ok(Game.ui.topbar.html(s, 'today').indexOf('class="mnav m-only"') !== -1, 'every screen with the top bar also draws the phone bar');
  });
})();
