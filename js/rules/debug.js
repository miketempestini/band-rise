// debug.js
// Shortcut rules for testing the game by hand (used by the debug panel, shown with ?debug).
// Later phases can add more shortcuts here.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.debug = {

  // Adds (positive) or removes (negative) cash. Removing goes through the normal spend rule,
  // so it triggers Mom and Dad's loans just like a real bill would.
  changeCash: function (state, amount) {
    if (amount >= 0) return Game.rules.money.earn(state, amount, 'debug');
    return Game.rules.money.spend(state, -amount, 'debug');
  },

  // Runs End Day several times in a row. Stops early if the game ends.
  // Returns { state, log, weekEnded } where weekEnded is true if any Sunday was crossed.
  skipDays: function (state, days) {
    var s = state;
    var log = [];
    var weekEnded = false;
    for (var i = 0; i < days && !s.gameOver; i++) {
      var result = Game.rules.day.endDay(s);
      s = result.state;
      log = log.concat(result.log);
      weekEnded = weekEnded || result.weekEnded;
    }
    return { state: s, log: log, weekEnded: weekEnded };
  },

  // Sets energy to a value, kept between 0 and the max.
  setEnergy: function (state, value) {
    var s = Game.util.clone(state);
    s.player.energy = Game.util.clamp(Math.round(value) || 0, 0, Game.balance.energy.max);
    return { state: s, log: ['Debug: energy set to ' + s.player.energy + '.'] };
  },

  // Sets morale to a value, kept between 0 and the max.
  setMorale: function (state, value) {
    var s = Game.util.clone(state);
    s.player.morale = Game.util.clamp(Math.round(value) || 0, 0, Game.balance.morale.max);
    return { state: s, log: ['Debug: morale set to ' + s.player.morale + '.'] };
  }
};
