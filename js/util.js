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
  }
};
