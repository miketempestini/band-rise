// energy-morale.test.js
// Tests for energy (js/rules/energy.js) and morale (js/rules/morale.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState() {
    return Game.rules.career.startCareer('Test', 'keys', 1).state;
  }

  Game.test('Energy: Tired means under 25', function (t) {
    t.ok(Game.rules.energy.isTired(24), '24 is Tired');
    t.ok(!Game.rules.energy.isTired(25), '25 is not');
  });

  Game.test('Morale drift: Sunday moves morale 3 toward 50', function (t) {
    var s = freshState();
    s.player.morale = 40;
    t.equal(Game.rules.morale.weeklyDrift(s).state.player.morale, 43, 'from 40: up to 43');
    s.player.morale = 60;
    t.equal(Game.rules.morale.weeklyDrift(s).state.player.morale, 57, 'from 60: down to 57');
    s.player.morale = 49;
    t.equal(Game.rules.morale.weeklyDrift(s).state.player.morale, 50, 'from 49: stops at 50');
    s.player.morale = 50;
    t.equal(Game.rules.morale.weeklyDrift(s).state.player.morale, 50, 'at 50: stays');
  });

  Game.test('Morale drift: happens at End Day on Sunday', function (t) {
    var s = freshState();
    for (var i = 0; i < 6; i++) s = Game.rules.day.endDay(s).state; // Monday to Saturday
    s.player.morale = 30;
    t.equal(Game.rules.day.endDay(s).state.player.morale, 30 + 10 + 3, 'Sunday off +10, then drift +3 toward 50');
  });

  Game.test('Burned out: starts below 15 and lasts until morale is above 25', function (t) {
    var s = freshState();
    s.player.morale = 16;
    s = Game.rules.morale.change(s, -2).state;
    t.ok(s.player.burnedOut, '14: Burned out');
    s = Game.rules.morale.change(s, 11).state;
    t.ok(s.player.burnedOut, '25: still Burned out');
    s = Game.rules.morale.change(s, 1).state;
    t.ok(!s.player.burnedOut, '26: recovered');
  });

  Game.test('Full day off: a weekend day of only Rest or Free time gives +10 morale', function (t) {
    var s = freshState();
    for (var i = 0; i < 5; i++) s = Game.rules.day.endDay(s).state; // now Saturday
    s.player.morale = 50;
    s = Game.rules.actions.plan(s, 'morning', 'rest').state;
    t.equal(Game.rules.day.endDay(s).state.player.morale, 50 + 5 + 10, 'Rest +5 and day off +10');
    var working = Game.rules.actions.plan(s, 'evening', 'practice').state;
    t.equal(Game.rules.day.endDay(working).state.player.morale, 55, 'Practice counts as work: no day-off bonus');
  });

})();
