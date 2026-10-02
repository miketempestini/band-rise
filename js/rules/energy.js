// energy.js
// Rules for energy: being Tired, and how much you recover overnight.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.energy = {

  // True when energy is low enough to count as Tired (skill gains are halved).
  isTired: function (energy) {
    return energy < Game.balance.energy.tiredThreshold;
  },

  // Keeps energy between 0 and the max.
  clamp: function (energy) {
    return Game.util.clamp(energy, 0, Game.balance.energy.max);
  },

  // How much energy comes back overnight. Less if a commitment drained you to 0 today (Exhausted).
  overnightRecovery: function (exhausted) {
    var b = Game.balance.energy;
    return exhausted ? b.exhaustedOvernight : b.overnight;
  }
};
