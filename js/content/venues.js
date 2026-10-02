// venues.js
// Every venue in the game. Fixed data, never saved. Names are made up.
// For now only the two hometown open mics; more rooms arrive with booking.
//
//   cityId       which city it's in (see cities.js)
//   tier         0 open mic, 1 small room, 2 club, 3 theater, 4 arena (rules per tier are in balance.js)
//   openMicDay   for open mics: the day of the week it runs (0 = Monday ... 6 = Sunday)
//   capacity     how many people fit (null = no limit, like an open mic)

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.venues = {
  rustyNail: {
    id: 'rustyNail',
    name: 'The Rusty Nail',
    cityId: 'hometown',
    tier: 0,
    openMicDay: 1, // Tuesday
    capacity: null
  },
  beanThere: {
    id: 'beanThere',
    name: 'Bean There Cafe',
    cityId: 'hometown',
    tier: 0,
    openMicDay: 3, // Thursday
    capacity: null
  }
};
