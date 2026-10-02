// venues.js
// Every venue in the game. Fixed data, never saved. Names are made up.
// The rules for each tier (who can book it, how far ahead, ticket price, foot traffic, score penalty)
// are in balance.js (balance.venues.tiers).
//
//   cityId       which city it's in (see cities.js)
//   tier         0 open mic, 1 small room, 2 club, 3 theater, 4 arena
//   openMicDay   for open mics: the day of the week it runs (0 = Monday ... 6 = Sunday)
//   capacity     how many people fit (null = no limit, like an open mic)
//   showBlock    which part of the day its shows happen
//   deals        what you can ask for when you book:
//                  guarantee: a flat fee (dollars)       door: true (a share of ticket sales)
//                  coverNight: true (flat cover-night fee, covers only)
//                  inStore: true (no pay: an in-store performance for fans and reputation)
//   requiresRelease  true if you need a release before you can book it

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.venues = {
  // ----- Tier 0: open mics -----
  rustyNail: {
    id: 'rustyNail', name: 'The Rusty Nail', cityId: 'hometown', tier: 0,
    openMicDay: 1, // Tuesday
    capacity: null, showBlock: 'evening', deals: {}
  },
  beanThere: {
    id: 'beanThere', name: 'Bean There Cafe', cityId: 'hometown', tier: 0,
    openMicDay: 3, // Thursday
    capacity: null, showBlock: 'evening', deals: {}
  },

  // ----- Tier 1: small rooms -----
  cornerTap: {
    id: 'cornerTap', name: 'Corner Tap', cityId: 'hometown', tier: 1,
    capacity: 45, showBlock: 'evening',
    deals: { guarantee: 60, door: true, coverNight: true }
  },
  backRoom: {
    id: 'backRoom', name: 'The Back Room', cityId: 'hometown', tier: 1,
    capacity: 60, showBlock: 'evening',
    deals: { guarantee: 100, door: true, coverNight: true }
  },
  hollowRecords: {
    id: 'hollowRecords', name: 'Hollow Records in-store', cityId: 'hometown', tier: 1,
    capacity: 40, showBlock: 'afternoon', // in-store shows are in the afternoon
    deals: { inStore: true }
  },

  // ----- Tier 2: clubs (locked until reputation 30 and 3+ on stage) -----
  basement: {
    id: 'basement', name: 'The Basement', cityId: 'hometown', tier: 2,
    capacity: 200, showBlock: 'evening',
    deals: { guarantee: 250, door: true }
  },
  velvetLounge: {
    id: 'velvetLounge', name: 'Velvet Lounge', cityId: 'hometown', tier: 2,
    capacity: 300, showBlock: 'evening',
    deals: { guarantee: 400, door: true }
  },

  // ----- Tier 3: theater (locked until reputation 60 and a release) -----
  orpheum: {
    id: 'orpheum', name: 'The Orpheum', cityId: 'hometown', tier: 3,
    capacity: 1200, showBlock: 'evening', requiresRelease: true,
    deals: { guarantee: 2000, door: true }
  }
};
