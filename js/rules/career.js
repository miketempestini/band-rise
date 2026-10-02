// career.js
// Rules for starting a new career, including spending the starting skill points.
//
// An "allocation" is how the player spends their starting points, like
//   { musicianship: 20, performance: 10, songwriting: 10, promotion: 5, networking: 5 }
// It must add up to exactly 50, with each skill between 0 and 30 (numbers in balance.js).

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.career = {

  // An allocation with every skill at 0 (where the skills page starts).
  emptyAllocation: function () {
    var a = {};
    Object.keys(Game.balance.skills.start).forEach(function (skill) {
      a[skill] = Game.balance.skills.startingMinPerSkill;
    });
    return a;
  },

  // The "Suggested build" from balance.js.
  suggestedAllocation: function () {
    return Game.util.clone(Game.balance.skills.start);
  },

  // How many points an allocation has spent so far.
  pointsSpent: function (allocation) {
    return Object.keys(allocation).reduce(function (total, skill) { return total + allocation[skill]; }, 0);
  },

  // How many points are still left to spend.
  pointsLeft: function (allocation) {
    return Game.balance.skills.startingPoints - Game.rules.career.pointsSpent(allocation);
  },

  // Adds (positive delta) or removes (negative delta) points from one skill.
  // Adds only as many as are left and the cap allows, and never goes below the minimum.
  // Example: +5 with only 3 points left adds 3. Returns a new allocation.
  adjustAllocation: function (allocation, skill, delta) {
    var b = Game.balance.skills;
    var a = Game.util.clone(allocation);
    if (delta > 0) {
      var room = Math.min(Game.rules.career.pointsLeft(a), b.startingMaxPerSkill - a[skill]);
      a[skill] += Math.max(0, Math.min(delta, room));
    } else {
      a[skill] = Math.max(b.startingMinPerSkill, a[skill] + delta);
    }
    return a;
  },

  // Spreads all the starting points randomly, one at a time, never past the cap.
  // seed: a whole number (the same seed always gives the same spread).
  randomAllocation: function (seed) {
    var b = Game.balance.skills;
    var rng = Game.rng.create(seed);
    var a = Game.rules.career.emptyAllocation();
    var skills = Object.keys(a);
    while (Game.rules.career.pointsLeft(a) > 0) {
      var open = skills.filter(function (skill) { return a[skill] < b.startingMaxPerSkill; });
      a[rng.pick(open)] += 1;
    }
    return a;
  },

  // Checks an allocation. Returns null if it's allowed, or a message saying what's wrong.
  allocationProblem: function (allocation) {
    var b = Game.balance.skills;
    var skills = Object.keys(b.start);
    for (var i = 0; i < skills.length; i++) {
      var value = allocation[skills[i]];
      if (!Number.isInteger(value)) return 'Every skill needs a whole number of points.';
      if (value < b.startingMinPerSkill || value > b.startingMaxPerSkill) {
        return 'Each skill can have ' + b.startingMinPerSkill + ' to ' + b.startingMaxPerSkill + ' points.';
      }
    }
    var left = Game.rules.career.pointsLeft(allocation);
    if (left > 0) return 'You still have ' + left + ' point' + (left === 1 ? '' : 's') + ' to spend.';
    if (left < 0) return 'That\'s ' + (-left) + ' point' + (left === -1 ? '' : 's') + ' too many.';
    return null;
  },

  // Starts a brand-new career.
  // name: the player's name. instrument: 'guitar', 'keys' or 'bass'.
  // seed: optional, for repeatable randomness (tests pass a fixed one).
  // allocation: optional starting skill points (leave out to use the Suggested build).
  // Returns { state, log }.
  startCareer: function (name, instrument, seed, allocation) {
    var bonuses = Game.balance.skills.instrumentBonus;
    if (!bonuses[instrument]) {
      throw new Error('Unknown instrument: ' + instrument);
    }
    allocation = allocation || Game.rules.career.suggestedAllocation();
    var problem = Game.rules.career.allocationProblem(allocation);
    if (problem) {
      throw new Error('Bad starting skills: ' + problem);
    }

    var state = Game.state.createNew(seed);
    state.player.name = String(name || '').trim();
    state.player.instrument = instrument;

    // Starting skills: the points the player spent, plus the instrument's bonus on top.
    Object.keys(allocation).forEach(function (skill) {
      state.player.skills[skill] = allocation[skill];
    });
    var bonus = bonuses[instrument];
    state.player.skills[bonus.skill] += bonus.amount;
    state.thisWeek.startSkills = Game.util.clone(state.player.skills); // week 1 starts from these

    return {
      state: state,
      log: ['Your career begins. +' + bonus.amount + ' ' + Game.content.skills[bonus.skill] + ' from your ' +
        Game.content.instruments[instrument].name + '.']
    };
  }
};
