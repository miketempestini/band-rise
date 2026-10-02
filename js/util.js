// util.js
// Small helper functions used all over the game.

window.Game = window.Game || {};

Game.util = {

  // Makes a full, separate copy of a plain object (like the game state).
  // Rules change the copy, never the original, so the old state stays untouched.
  clone: function (obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Keeps a number between a lowest and highest value.
  // Example: clamp(130, 0, 100) gives 100.
  clamp: function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  },

  // Rounds to one decimal place, for showing numbers like "+2.5".
  round1: function (value) {
    return Math.round(value * 10) / 10;
  },

  // Shows a change with its sign, like "+2.5" or "-15".
  signed: function (value) {
    var r = Game.util.round1(value);
    return (r > 0 ? '+' : '') + r;
  }
};
