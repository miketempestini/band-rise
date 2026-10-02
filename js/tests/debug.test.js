// debug.test.js
// Tests for the debug shortcuts (js/rules/debug.js).

Game.test('Debug: cash buttons add money, and removing it can trigger a loan', function (t) {
  var s = Game.rules.career.startCareer('Test', 'bass', 1).state;
  t.equal(Game.rules.debug.changeCash(s, 500).state.player.cash, 1000, '+$500');
  var down = Game.rules.debug.changeCash(s, -600).state;
  t.equal(down.player.cash, 900, '500 - 600 + 1,000 loan');
  t.equal(down.player.loanOwed, 1000);
});

Game.test('Debug: skip 7 days runs a full week', function (t) {
  var s = Game.rules.career.startCareer('Test', 'bass', 1).state;
  var result = Game.rules.debug.skipDays(s, 7);
  t.equal(result.state.day, 7);
  t.ok(result.weekEnded, 'crossed a Sunday');
  t.equal(result.state.player.cash, 650);
});

Game.test('Debug: set energy and morale stay between 0 and 100', function (t) {
  var s = Game.rules.career.startCareer('Test', 'bass', 1).state;
  t.equal(Game.rules.debug.setEnergy(s, 30).state.player.energy, 30);
  t.equal(Game.rules.debug.setEnergy(s, 250).state.player.energy, 100);
  t.equal(Game.rules.debug.setMorale(s, -5).state.player.morale, 0);
});
