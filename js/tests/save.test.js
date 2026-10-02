// save.test.js
// Tests for saving and loading (js/save.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var SAVE_TEST_KEY = 'bandRise.testSave'; // tests use their own slot so they never touch the real save

  function playedState() {
    var s = Game.rules.career.startCareer('Test', 'keys', 42).state;
    for (var i = 0; i < 10; i++) s = Game.rules.day.endDay(s).state;
    return s;
  }

  Game.test('Save: saving then loading gives back the exact same state', function (t) {
    var s = playedState();
    var loaded = Game.save.parse(Game.save.serialize(s));
    t.ok(loaded.ok, 'loaded without problems');
    t.sameContents(loaded.state, s, 'same state');
  });

  Game.test('Save: saving to the browser and reading it back gives the same state', function (t) {
    var s = playedState();
    t.ok(Game.save.writeToBrowser(s, SAVE_TEST_KEY).ok, 'saved');
    var loaded = Game.save.readFromBrowser(SAVE_TEST_KEY);
    t.ok(loaded.ok, 'read back');
    t.sameContents(loaded.state, s, 'same state');
    Game.save.clearBrowserSave(SAVE_TEST_KEY);
    t.ok(Game.save.readFromBrowser(SAVE_TEST_KEY).empty, 'cleared');
  });

  Game.test('Save: broken or wrong files give a friendly message instead of crashing', function (t) {
    var notJson = Game.save.parse('this is not a save {{{');
    t.equal(notJson.ok, false, 'not JSON');
    t.ok(notJson.message, 'has a message');

    var wrongShape = Game.save.parse('{"hello": "world"}');
    t.equal(wrongShape.ok, false, 'JSON but not a save');

    var future = Game.save.parse(JSON.stringify({ version: 999 }));
    t.equal(future.ok, false, 'newer version');
    t.ok(future.message.indexOf('newer') !== -1, 'says it is from a newer version');

    t.equal(Game.save.parse('null').ok, false, 'null');
    t.equal(Game.save.parse('[]').ok, false, 'a list');
  });

  Game.test('Save: a missing browser save is reported as empty', function (t) {
    Game.save.clearBrowserSave(SAVE_TEST_KEY);
    var result = Game.save.readFromBrowser(SAVE_TEST_KEY);
    t.equal(result.ok, false);
    t.ok(result.empty, 'empty');
  });

})();
