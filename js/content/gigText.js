// gigText.js
// Words for the gig result screen: headlines for each result, and the plain tips
// shown when something hurt the score. "{venue}" is replaced with the venue's name.

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.gigText = {
  headlines: {
    rough: 'Rough night at {venue}.',
    solid: 'Solid set at {venue}.',
    great: 'Great night at {venue}!',
    legendary: 'Legendary night at {venue}!'
  },

  // Labels for each part of the score breakdown.
  parts: {
    bandSkill: 'Band skill',
    stagePresence: 'Stage presence',
    songs: 'Songs',
    tightness: 'Tightness',
    instrument: 'Instrument',
    tired: 'Tired',
    morale: 'Morale',
    traits: 'Band traits',
    venueTier: 'Big room',
    luck: 'Luck',
    debug: 'Debug'
  },

  // One tip, for the biggest thing that hurt the score.
  tips: {
    tired: 'You were tired. Rest the day before a show.',
    lowMorale: 'Your morale was low. A day off or some rest before a show helps.',
    badLuck: 'Bad luck tonight. It happens. After two Rough nights in a row, luck can\'t go against you.',
    looseSongs: 'Your songs were loose. Practice them before the next show.'
  }
};
