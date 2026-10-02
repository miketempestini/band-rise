// audience.test.js
// Tests for buzz (js/rules/audience.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState() {
    return Game.rules.career.startCareer('Test', 'bass', 1).state;
  }

  Game.test('Hometown: a new career starts with a hometown at 0 fans and 0 buzz', function (t) {
    var s = freshState();
    t.equal(s.cities.hometown.fans, 0);
    t.equal(s.cities.hometown.buzz, 0);
    t.ok(s.cities.hometown.unlocked, 'unlocked');
  });

  Game.test('Buzz: fades 2 points a night, never below 0', function (t) {
    var s = freshState();
    s.cities.hometown.buzz = 10;
    s = Game.rules.day.endDay(s).state;
    t.equal(s.cities.hometown.buzz, 8, '10 to 8');
    s.cities.hometown.buzz = 1;
    s = Game.rules.day.endDay(s).state;
    t.equal(s.cities.hometown.buzz, 0, '1 to 0, not -1');
    s = Game.rules.day.endDay(s).state;
    t.equal(s.cities.hometown.buzz, 0, 'stays at 0');
  });

  Game.test('Buzz: Post online adds 1 + Promotion / 20; flyers add 3 x (1 + Promotion / 100)', function (t) {
    var s = freshState();
    s.player.skills.promotion = 20;
    t.near(Game.rules.audience.promoBuzz(s, 'postOnline'), 2, 'post at Promotion 20');
    t.near(Game.rules.audience.promoBuzz(s, 'flyers'), 3.6, 'flyers at Promotion 20');
  });

  Game.test('Buzz: never goes above 100', function (t) {
    var s = freshState();
    s.cities.hometown.buzz = 99;
    t.equal(Game.rules.audience.addBuzz(s, 'hometown', 5).state.cities.hometown.buzz, 100);
  });

})();
