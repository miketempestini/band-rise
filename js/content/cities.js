// cities.js
// Every city in the game. Names are made up. More cities arrive in later phases.
// region: 'hometown' | 'near' | 'mid' | 'far' | 'national' | 'international'

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.cities = {
  hometown: {
    id: 'hometown',
    name: 'Millbrook',
    region: 'hometown',
    fanCeiling: Game.balance.geography.fanCeiling.hometown // the most fans this city can ever have
  }
};
