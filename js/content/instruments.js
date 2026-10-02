// instruments.js
// The three starting instruments. Each one also sings.
// The skill bonus for each lives in balance.js (skills.instrumentBonus).

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.instruments = {
  guitar: { name: 'Guitar', blurb: 'Front and center. You own the stage.' },
  keys:   { name: 'Keys',   blurb: 'Chords and hooks. Songs come easier.' },
  bass:   { name: 'Bass',   blurb: 'The glue. Everybody knows the bass player.' }
};
