// morale.js
// Rules for morale: changing it, Burned out, and the Sunday drift toward a resting level.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.morale = {

  // Changes morale by an amount (kept between 0 and 100) and updates Burned out.
  // Returns { state, log }.
  change: function (state, amount) {
    var s = Game.util.clone(state);
    s.player.morale = Game.util.clamp(s.player.morale + amount, 0, Game.balance.morale.max);
    return Game.rules.morale.updateBurnout(s);
  },

  // Burned out starts when morale falls below 15 and lasts until it's back above 25.
  // Returns { state, log } with a line when Burned out starts or ends.
  updateBurnout: function (state) {
    var b = Game.balance.morale;
    var s = Game.util.clone(state);
    var log = [];
    if (!s.player.burnedOut && s.player.morale < b.burnedOutThreshold) {
      s.player.burnedOut = true;
      log.push('You\'re Burned out. Practice won\'t build skill until your morale is back above ' + b.burnedOutRecovery + '. Rest or take a day off.');
    } else if (s.player.burnedOut && s.player.morale > b.burnedOutRecovery) {
      s.player.burnedOut = false;
      log.push('You\'re not Burned out anymore.');
    }
    return { state: s, log: log };
  },

  // The morale level things drift back toward each Sunday. Better housing raises it.
  restingLevel: function (state) {
    return Game.rules.housing.restingLevel(state); // the vacation home counts too
  },

  // Every Sunday, morale moves up to 3 points toward its resting level.
  // Returns { state, log }.
  weeklyDrift: function (state) {
    var b = Game.balance.morale;
    var target = Game.rules.morale.restingLevel(state);
    var gap = target - state.player.morale;
    var step = Math.max(-b.weeklyDrift, Math.min(b.weeklyDrift, gap));
    if (step === 0) return { state: state, log: [] };
    var result = Game.rules.morale.change(state, step);
    var line = 'Weekly morale drift toward ' + target + ': ' + (step > 0 ? '+' : '') + Game.util.round1(step) + ' morale.';
    return { state: result.state, log: [line].concat(result.log) };
  }
};
