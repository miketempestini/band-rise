// rng.js
// A seeded random number generator.
//
// "Seeded" means: give it the same starting number (the seed) and it produces the exact
// same list of "random" numbers every time. That lets us save the seed with the game,
// so reloading can't re-roll a bad result, and tests can expect exact results.
//
// How to use it:
//   var rng = Game.rng.create(state.rngState);  // start from the saved position
//   var roll = rng.next();                      // a decimal from 0 up to (not including) 1
//   var dice = rng.int(1, 6);                   // a whole number from 1 to 6
//   if (rng.chance(0.3)) { ... }                // true 30% of the time
//   newState.rngState = rng.getState();         // save the new position back into the state
//
// It uses a small, well-known method called "mulberry32". Never use Math.random() in game rules.

window.Game = window.Game || {};

Game.rng = {

  // Makes a new generator starting from a seed (any whole number).
  create: function (seed) {
    // ">>> 0" keeps the number as a positive 32-bit whole number, which the method needs.
    var current = seed >>> 0;

    // The core step: scramble the current number to get the next one.
    // The odd-looking constants are part of the mulberry32 recipe. Don't change them.
    function next() {
      current = (current + 0x6D2B79F5) >>> 0;
      var t = current;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // turn it into a decimal from 0 to just under 1
    }

    return {
      // A decimal from 0 up to (but not including) 1.
      next: next,

      // A decimal between min and max. Example: rng.range(0.85, 1.15) for crowd size.
      range: function (min, max) {
        return min + next() * (max - min);
      },

      // A whole number from min to max, including both ends. Example: rng.int(-10, 10) for luck.
      int: function (min, max) {
        return min + Math.floor(next() * (max - min + 1));
      },

      // Returns true with the given chance. Example: rng.chance(0.2) is true 20% of the time.
      chance: function (probability) {
        return next() < probability;
      },

      // Picks one item from a list at random.
      pick: function (list) {
        return list[Math.floor(next() * list.length)];
      },

      // The generator's current position. Save this into the state so the next roll continues from here.
      getState: function () {
        return current;
      }
    };
  },

  // Makes a fresh seed for a brand-new game. This is the only place real randomness is used.
  newSeed: function () {
    return Math.floor(Math.random() * 4294967296) >>> 0;
  }
};
