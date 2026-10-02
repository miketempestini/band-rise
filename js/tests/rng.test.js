// rng.test.js
// Tests for the seeded random number generator (js/rng.js).

Game.test('Random generator: the same seed gives the same numbers', function (t) {
  var a = Game.rng.create(12345);
  var b = Game.rng.create(12345);
  for (var i = 0; i < 20; i++) {
    t.equal(a.next(), b.next(), 'roll ' + (i + 1));
  }
});

Game.test('Random generator: different seeds give different numbers', function (t) {
  var a = Game.rng.create(1);
  var b = Game.rng.create(2);
  t.ok(a.next() !== b.next(), 'first rolls should differ');
});

Game.test('Random generator: picking up from a saved position continues the same sequence', function (t) {
  var original = Game.rng.create(999);
  original.next();
  original.next();
  var saved = original.getState();   // like saving the game here
  var resumed = Game.rng.create(saved);
  t.equal(resumed.next(), original.next(), 'the next roll after loading matches');
});

Game.test('Random generator: numbers stay inside their ranges', function (t) {
  var rng = Game.rng.create(42);
  for (var i = 0; i < 1000; i++) {
    var n = rng.next();
    t.ok(n >= 0 && n < 1, 'next() between 0 and 1, got ' + n);
    var whole = rng.int(-10, 10);
    t.ok(whole >= -10 && whole <= 10 && Math.floor(whole) === whole, 'int(-10, 10) got ' + whole);
  }
});
