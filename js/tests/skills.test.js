// skills.test.js
// Tests for skill growth and rust (js/rules/skills.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function skillState() {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.morale = 50; // middle morale: multiplier 1
    return s;
  }

  function close(a, b) {
    return Math.abs(a - b) < 0.0001;
  }

  Game.test('Skills: Practice at Musicianship 20 gives +2.5', function (t) {
    var s = skillState();
    s.player.skills.musicianship = 20;
    var gain = Game.rules.skills.gainFor(s, 'musicianship', 3, 100);
    t.ok(close(gain, 2.5), 'expected 2.5, got ' + gain);
  });

  Game.test('Skills: Practice at Musicianship 80 gives +1', function (t) {
    var s = skillState();
    s.player.skills.musicianship = 80;
    var gain = Game.rules.skills.gainFor(s, 'musicianship', 3, 100);
    t.ok(close(gain, 1), 'expected 1, got ' + gain);
  });

  Game.test('Skills: being Tired (energy under 25) halves the gain', function (t) {
    var s = skillState();
    s.player.skills.musicianship = 20;
    t.ok(close(Game.rules.skills.gainFor(s, 'musicianship', 3, 24), 1.25), 'energy 24: half of 2.5');
    t.ok(close(Game.rules.skills.gainFor(s, 'musicianship', 3, 25), 2.5), 'energy 25: not Tired');
  });

  Game.test('Skills: morale changes the gain (x0.75 below 30, x1.25 above 70)', function (t) {
    var s = skillState();
    s.player.skills.musicianship = 20;
    s.player.morale = 29;
    t.ok(close(Game.rules.skills.gainFor(s, 'musicianship', 3, 100), 1.875), 'low morale');
    s.player.morale = 71;
    t.ok(close(Game.rules.skills.gainFor(s, 'musicianship', 3, 100), 3.125), 'high morale');
  });

  Game.test('Skills: training stores decimals, marks the skill used, and never passes 100', function (t) {
    var s = skillState();
    s.day = 5;
    var r = Game.rules.skills.train(s, 'musicianship', 3, 100);
    t.ok(close(r.state.player.skills.musicianship, 22.5), 'stored as 22.5');
    t.equal(r.state.player.skillLastUsed.musicianship, 5, 'marked as used today');
    s.player.skills.musicianship = 99.9;
    t.ok(Game.rules.skills.train(s, 'musicianship', 50, 100).state.player.skills.musicianship <= 100, 'capped at 100');
  });

  Game.test('Rust: a skill above 30 loses 1 point after 14 unused days, not 13', function (t) {
    var s = skillState();
    s.player.skills.musicianship = 50;
    for (var i = 0; i < 13; i++) s = Game.rules.day.endDay(s).state;
    t.equal(s.player.skills.musicianship, 50, '13 days: no rust yet');
    t.equal(Game.rules.skills.rustStatus(s, 'musicianship'), 'warning', 'warning icon after 10 days');
    s = Game.rules.day.endDay(s).state;
    t.equal(s.player.skills.musicianship, 49, '14 days: -1');
    t.equal(Game.rules.skills.rustStatus(s, 'musicianship'), 'rusting');
  });

  Game.test('Rust: then 1 more point each week, and never below 30', function (t) {
    var s = skillState();
    s.player.skills.musicianship = 50;
    for (var i = 0; i < 21; i++) s = Game.rules.day.endDay(s).state;
    t.equal(s.player.skills.musicianship, 48, '21 days: -2');
    s.player.skills.musicianship = 30.5;
    for (var j = 0; j < 7; j++) s = Game.rules.day.endDay(s).state;
    t.equal(s.player.skills.musicianship, 30, 'stops at 30');
  });

  Game.test('Rust: skills at 30 or below never rust', function (t) {
    var s = skillState(); // starts at Musicianship 20
    for (var i = 0; i < 30; i++) s = Game.rules.day.endDay(s).state;
    t.equal(s.player.skills.musicianship, 20);
    t.equal(Game.rules.skills.rustStatus(s, 'musicianship'), null, 'no warning');
  });

})();
