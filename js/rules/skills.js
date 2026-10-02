// skills.js
// Rules for the five skills: how fast they grow, and how they rust when ignored.
//
// Growth formula (from Design.md):
//   gain = base x (1 - skill / 120) x morale multiplier x energy multiplier
// So skills grow fast early and slower as they climb. Skills are stored with decimals.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.skills = {

  // The morale part of the formula: slower when morale is low, faster when high.
  moraleMultiplier: function (morale) {
    var b = Game.balance.skills;
    if (morale < b.moraleLowThreshold) return b.moraleLowMultiplier;
    if (morale > b.moraleHighThreshold) return b.moraleHighMultiplier;
    return b.moraleMidMultiplier;
  },

  // The energy part of the formula: halved when Tired.
  energyMultiplier: function (energy) {
    return Game.rules.energy.isTired(energy) ? Game.balance.skills.tiredMultiplier : 1;
  },

  // How much a skill would grow from an action, without changing anything.
  // energy: the player's energy at the start of the action (defaults to current energy).
  gainFor: function (state, skill, base, energy) {
    var b = Game.balance.skills;
    if (energy === undefined) energy = state.player.energy;
    var current = state.player.skills[skill];
    var growth = Math.max(0, 1 - current / b.growthCap);
    return base * growth *
      Game.rules.skills.moraleMultiplier(state.player.morale) *
      Game.rules.skills.energyMultiplier(energy);
  },

  // Grows a skill from an action and marks it as used today (which resets its rust clock).
  // Returns { state, log, gain }.
  train: function (state, skill, base, energy) {
    var s = Game.util.clone(state);
    var gain = Game.rules.skills.gainFor(state, skill, base, energy);
    s.player.skills[skill] = Math.min(Game.balance.skills.max, s.player.skills[skill] + gain);
    s.player.skillLastUsed[skill] = s.day;
    return { state: s, log: [], gain: gain };
  },

  // How many days since a skill was last used.
  daysUnused: function (state, skill) {
    return state.day - state.player.skillLastUsed[skill];
  },

  // Rust status for the screen: 'rusting' (losing points), 'warning' (close to it), or null.
  rustStatus: function (state, skill) {
    var b = Game.balance.skills;
    if (state.player.skills[skill] <= b.rustMinSkill) return null;
    var days = Game.rules.skills.daysUnused(state, skill);
    if (days >= b.rustAfterDays) return 'rusting';
    if (days >= b.rustWarningDays) return 'warning';
    return null;
  },

  // Runs each night, after the day moves forward.
  // A skill above 30 unused for 14 days loses 1 point that night, then 1 more every 7 days,
  // until it's used again. It never rusts below 30.
  // Returns { state, log }.
  applyRust: function (state) {
    var b = Game.balance.skills;
    var s = Game.util.clone(state);
    var log = [];
    Object.keys(s.player.skills).forEach(function (skill) {
      var days = Game.rules.skills.daysUnused(s, skill);
      var value = s.player.skills[skill];
      var rustNight = days >= b.rustAfterDays && (days - b.rustAfterDays) % Game.balance.time.daysPerWeek === 0;
      if (value > b.rustMinSkill && rustNight) {
        s.player.skills[skill] = Math.max(b.rustMinSkill, value - b.rustPerWeek);
        log.push(Game.content.skills[skill] + ' is getting rusty: -' + b.rustPerWeek + ' (unused for ' + days + ' days).');
      }
    });
    return { state: s, log: log };
  }
};
