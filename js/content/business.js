// business.js
// The people you do business with in the big time (Phase 12). Names are made up. Fixed data, never saved.
// Their numbers (the manager's cut) are in balance.js. Record labels have their own file (js/content/labels.js).

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.business = {
  manager: { name: 'Rita Vance', company: 'Vance Artist Management' },
  // Award categories (the rules for each are in Game.rules.awards; numbers in balance.awards).
  awards: {
    song:     { name: 'Song of the Year' },
    record:   { name: 'Record of the Year' },
    breakout: { name: 'Breakout Act' }
  }
};
