// career.js
// Rules for starting a new career.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.career = {

  // Starts a brand-new career.
  // name: the player's name. instrument: 'guitar', 'keys' or 'bass'.
  // seed: optional, for repeatable randomness (tests pass a fixed one).
  // Returns { state, log }.
  startCareer: function (name, instrument, seed) {
    var bonuses = Game.balance.skills.instrumentBonus;
    if (!bonuses[instrument]) {
      throw new Error('Unknown instrument: ' + instrument);
    }

    var state = Game.state.createNew(seed);
    state.player.name = String(name || '').trim();
    state.player.instrument = instrument;

    // Each starting instrument adds a small bonus to one skill (guitar: Performance, and so on).
    var bonus = bonuses[instrument];
    state.player.skills[bonus.skill] += bonus.amount;

    return {
      state: state,
      log: ['Your career begins. +' + bonus.amount + ' ' + bonus.skill + ' from your ' + instrument + '.']
    };
  }
};
