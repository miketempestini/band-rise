// venues.js
// Every venue in the game, in every city. Fixed data, never saved. Names are made up.
// The rules for each tier (who can book it, how far ahead, ticket price, foot traffic, score penalty)
// are in balance.js (balance.venues.tiers), and so is each venue's flat fee (balance.venues.guarantees).
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

(function () {
var pay = Game.balance.venues.guarantees;

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
    deals: { guarantee: pay.cornerTap, door: true, coverNight: true }
  },
  backRoom: {
    id: 'backRoom', name: 'The Back Room', cityId: 'hometown', tier: 1,
    capacity: 60, showBlock: 'evening',
    deals: { guarantee: pay.backRoom, door: true, coverNight: true }
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
    deals: { guarantee: pay.basement, door: true }
  },
  velvetLounge: {
    id: 'velvetLounge', name: 'Velvet Lounge', cityId: 'hometown', tier: 2,
    capacity: 300, showBlock: 'evening',
    deals: { guarantee: pay.velvetLounge, door: true }
  },

  // ----- Tier 3: theater (locked until reputation 60 and a release) -----
  orpheum: {
    id: 'orpheum', name: 'The Orpheum', cityId: 'hometown', tier: 3,
    capacity: 1200, showBlock: 'evening', requiresRelease: true,
    deals: { guarantee: pay.orpheum, door: true }
  }
};

// ----- Out-of-town venues (Phase 11) -----
// Every other city has an open mic night and 2 to 4 venues. All shows are in the evening.
// Out of town, rooms offer a guarantee or the door (cover nights and in-stores are hometown things).
// Arenas (tier 4) take no booking emails: they come with offers in a later phase.

// Small helpers so each venue fits on one line.
var openMic = function (id, name, cityId, day) {
  return { id: id, name: name, cityId: cityId, tier: 0, openMicDay: day, capacity: null, showBlock: 'evening', deals: {} };
};
var room = function (id, name, cityId, tier, capacity) {
  var v = { id: id, name: name, cityId: cityId, tier: tier, capacity: capacity, showBlock: 'evening',
    deals: { guarantee: pay[id], door: tier < 4 } };
  if (tier >= 3) v.requiresRelease = true; // theaters and bigger need a release, like The Orpheum
  return v;
};

[
  // Near: Harlow Falls (open mic Wednesday), Cedar Junction (open mic Friday)
  openMic('lanternRoom', 'The Lantern Room', 'harlowFalls', 2),
  room('copperPint', 'The Copper Pint', 'harlowFalls', 1, 50),
  room('millStreetHall', 'Mill Street Hall', 'harlowFalls', 1, 55),
  room('theDepot', 'The Depot', 'harlowFalls', 2, 220),
  openMic('junctionCoffee', 'Junction Coffee Co.', 'cedarJunction', 4),
  room('railyardTavern', 'Railyard Tavern', 'cedarJunction', 1, 45),
  room('grayFox', 'The Gray Fox', 'cedarJunction', 1, 60),
  room('signalHouse', 'Signal House', 'cedarJunction', 2, 180),
  // Mid: Port Ellery (open mic Monday), Ashford Springs (open mic Wednesday)
  openMic('harborLights', 'Harbor Lights Cafe', 'portEllery', 0),
  room('rustyAnchor', 'The Rusty Anchor', 'portEllery', 1, 60),
  room('lighthouseBallroom', 'Lighthouse Ballroom', 'portEllery', 2, 300),
  room('tidewaterClub', 'Tidewater Club', 'portEllery', 2, 200),
  openMic('springhouseCoffee', 'Springhouse Coffee', 'ashfordSprings', 2),
  room('wineCellar', 'The Wine Cellar', 'ashfordSprings', 1, 50),
  room('theAvalon', 'The Avalon', 'ashfordSprings', 2, 250),
  room('brickworks', 'Brickworks', 'ashfordSprings', 2, 180),
  // Far: Redstone (Tue), Lake Varden (Thu), Bellmont City (Mon), Sable Bay (Fri)
  openMic('redRockCoffee', 'Red Rock Coffee', 'redstone', 1),
  room('dustySaloon', 'The Dusty Saloon', 'redstone', 1, 60),
  room('theForge', 'The Forge', 'redstone', 2, 300),
  room('redstoneGrand', 'Redstone Grand', 'redstone', 3, 1000),
  openMic('loonCafe', 'Loon Cafe', 'lakeVarden', 3),
  room('theBoathouse', 'The Boathouse', 'lakeVarden', 1, 50),
  room('pinewoodHall', 'Pinewood Hall', 'lakeVarden', 2, 250),
  room('theLyric', 'The Lyric', 'lakeVarden', 3, 900),
  openMic('nightOwl', 'Night Owl Lounge', 'bellmontCity', 0),
  room('backAlleyBar', 'Back Alley Bar', 'bellmontCity', 1, 60),
  room('neonGarden', 'Neon Garden', 'bellmontCity', 2, 300),
  room('unionStation', 'Union Station Club', 'bellmontCity', 2, 200),
  room('thePalace', 'The Palace', 'bellmontCity', 3, 1500),
  openMic('driftwoodCafe', 'Driftwood Cafe', 'sableBay', 4),
  room('surfShack', 'The Surf Shack', 'sableBay', 1, 45),
  room('pierNine', 'Pier 9', 'sableBay', 2, 250),
  room('bayfrontTheater', 'Bayfront Theater', 'sableBay', 3, 1200),
  // National (locked for now): New Halston, Crescent City, Kingsport
  openMic('velvetMic', 'The Velvet Mic', 'newHalston', 1),
  room('clubMeridian', 'Club Meridian', 'newHalston', 2, 300),
  room('halstonTheater', 'The Halston Theater', 'newHalston', 3, 1500),
  room('halstonArena', 'Halston Arena', 'newHalston', 4, 15000),
  openMic('moonlightCoffee', 'Moonlight Coffee', 'crescentCity', 3),
  room('crescentClub', 'The Crescent Club', 'crescentCity', 2, 280),
  room('crescentTheater', 'Crescent Theater', 'crescentCity', 3, 1400),
  room('crescentArena', 'Crescent Arena', 'crescentCity', 4, 12000),
  openMic('docksideMic', 'Dockside Mic', 'kingsport', 2),
  room('theKingsway', 'The Kingsway', 'kingsport', 2, 250),
  room('royalTheater', 'Royal Theater', 'kingsport', 3, 1200),
  room('kingsportColiseum', 'Kingsport Coliseum', 'kingsport', 4, 10000),
  // International (locked for now): Lindenberg, Port Aurelia, Valmora
  openMic('cafeLinde', 'Cafe Linde', 'lindenberg', 1),
  room('lindenCellar', 'The Linden Cellar', 'lindenberg', 2, 300),
  room('lindenbergHall', 'Lindenberg Concert Hall', 'lindenberg', 3, 1500),
  room('lindenbergArena', 'Lindenberg Arena', 'lindenberg', 4, 15000),
  openMic('aureliaBeachBar', 'Aurelia Beach Bar', 'portAurelia', 4),
  room('clubSolana', 'Club Solana', 'portAurelia', 2, 280),
  room('teatroAurelia', 'Teatro Aurelia', 'portAurelia', 3, 1300),
  room('aureliaStadium', 'Aurelia Stadium', 'portAurelia', 4, 20000),
  openMic('valmoraLounge', 'Valmora Lounge', 'valmora', 3),
  room('blueDoor', 'The Blue Door', 'valmora', 2, 250),
  room('valmoraOpera', 'Valmora Opera House', 'valmora', 3, 1400),
  room('valmoraFestival', 'Valmora Festival Grounds', 'valmora', 4, 25000)
].forEach(function (v) { Game.content.venues[v.id] = v; });

// ----- Festivals (Phase 12): one in each National city. Offers only, afternoon slots. -----
// The fee and the crowd come with each offer (balance.bigOffers).
var festival = function (id, name, cityId, capacity) {
  return { id: id, name: name, cityId: cityId, tier: 4, festival: true, capacity: capacity, showBlock: 'afternoon', deals: {} };
};
[
  festival('halstonFest', 'New Halston Music Fest', 'newHalston', 40000),
  festival('crescentFest', 'Crescent Riverfront Festival', 'crescentCity', 30000),
  festival('harborlineFest', 'Harborline Summer Fest', 'kingsport', 35000)
].forEach(function (v) { Game.content.venues[v.id] = v; });
})();
