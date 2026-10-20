// cities.js
// Every city in the game. Names are made up. Fixed data, never saved.
//   region      'hometown' | 'near' | 'mid' | 'far' | 'national' | 'international'
//               (the region decides travel time, gas, and how the city unlocks: see Game.rules.travel)
//   fanCeiling  the most fans this city can ever have (numbers in balance.geography.fanCeilings)
//   blurb       a line for the Map screen
//   world       { x, y } on the World map (drawing only; Millbrook, National, and International cities)
//   countryId   international cities only: which country they're in (see countries.js)
// Each city's open mic and venues are in venues.js (by cityId).

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var ceiling = Game.balance.geography.fanCeilings;
  // world: where the city sits on the World map (drawing only). countryId: international cities only.
  var city = function (id, name, region, blurb, world, countryId) {
    var c = { id: id, name: name, region: region, fanCeiling: ceiling[id], blurb: blurb, world: world || null };
    if (countryId) c.countryId = countryId;
    return c;
  };

  Game.content.cities = {
    hometown:       city('hometown', 'Millbrook', 'hometown', 'Home. Where it all starts.', { x: 245, y: 245 }),
    // Near: day trips
    harlowFalls:    city('harlowFalls', 'Harlow Falls', 'near', 'A college town with a river walk and a loyal bar crowd.'),
    cedarJunction:  city('cedarJunction', 'Cedar Junction', 'near', 'An old rail town that loves a loud Friday night.'),
    // Mid: usually an overnight
    portEllery:     city('portEllery', 'Port Ellery', 'mid', 'A harbor city with a busy waterfront music scene.'),
    ashfordSprings: city('ashfordSprings', 'Ashford Springs', 'mid', 'Wine bars, hot springs, and surprisingly good clubs.'),
    // Far: a full day's drive
    redstone:       city('redstone', 'Redstone', 'far', 'A desert city with big rooms and late nights.'),
    lakeVarden:     city('lakeVarden', 'Lake Varden', 'far', 'A lake town that fills up every summer weekend.'),
    bellmontCity:   city('bellmontCity', 'Bellmont City', 'far', 'The big city. Every band wants to play here.'),
    sableBay:       city('sableBay', 'Sable Bay', 'far', 'A beach city with a pier full of venues.'),
    // National: flights (with a manager and a label)
    newHalston:     city('newHalston', 'New Halston', 'national', 'A giant media city. Arenas, festivals, and press.', { x: 340, y: 160 }),
    crescentCity:   city('crescentCity', 'Crescent City', 'national', 'A music capital with a famous theater district.', { x: 310, y: 330 }),
    kingsport:      city('kingsport', 'Kingsport', 'national', 'A port city with a coliseum and a big summer festival.', { x: 160, y: 160 }),
    ironridge:      city('ironridge', 'Ironridge', 'national', 'An old steel city that loves loud guitars.', { x: 360, y: 250 }),
    marlowBay:      city('marlowBay', 'Marlow Bay', 'national', 'A resort coast with a beach festival every summer.', { x: 150, y: 330 }),
    duskfield:      city('duskfield', 'Duskfield', 'national', 'The capital, with a college crowd and a famous theater row.', { x: 250, y: 140 }),
    // International: flights to other countries (after a tour that played 2+ National cities)
    lindenberg:     city('lindenberg', 'Lindenberg', 'international', 'Cobblestones, concert halls, and serious listeners.', { x: 545, y: 125 }, 'nordhavia'),
    askerholm:      city('askerholm', 'Askerholm', 'international', 'A harbor capital of wooden warehouses turned into clubs.', { x: 495, y: 105 }, 'nordhavia'),
    frostvik:       city('frostvik', 'Frostvik', 'international', 'A small far-north town that turns out for every show.', { x: 590, y: 95 }, 'nordhavia'),
    portAurelia:    city('portAurelia', 'Port Aurelia', 'international', 'A sunny coast city that loves a stadium show.', { x: 485, y: 395 }, 'solvara'),
    santaLiora:     city('santaLiora', 'Santa Liora', 'international', 'Whitewashed streets and rooftop bars over the sea.', { x: 455, y: 365 }, 'solvara'),
    ventamar:       city('ventamar', 'Ventamar', 'international', 'A windy surf town with a coliseum by the beach.', { x: 520, y: 420 }, 'solvara'),
    valmora:        city('valmora', 'Valmora', 'international', 'An old opera city with a huge outdoor festival.', { x: 545, y: 250 }, 'veronesse'),
    castellune:     city('castellune', 'Castellune', 'international', 'A hilltop city of courtyards and late suppers.', { x: 505, y: 235 }, 'veronesse'),
    bellarosa:      city('bellarosa', 'Bellarosa', 'international', 'A rose-garden town with a grand old concert hall.', { x: 580, y: 275 }, 'veronesse'),
    akarumi:        city('akarumi', 'Akarumi', 'international', 'A neon megacity with a giant dome and a summer festival.', { x: 860, y: 195 }, 'kaigara'),
    tsukiyama:      city('tsukiyama', 'Tsukiyama', 'international', 'A moonlit mountain city of tiny, legendary live houses.', { x: 830, y: 150 }, 'kaigara'),
    hoshiro:        city('hoshiro', 'Hoshiro', 'international', 'A port city that never sleeps, with star-shaped streets.', { x: 875, y: 240 }, 'kaigara'),
    portKiara:      city('portKiara', 'Port Kiara', 'international', 'A harbor city with an opera house on the water.', { x: 800, y: 445 }, 'kestara'),
    sundaraFalls:   city('sundaraFalls', 'Sundara Falls', 'international', 'A rainforest town where shows end at the waterfall.', { x: 760, y: 410 }, 'kestara'),
    vellmore:       city('vellmore', 'Vellmore', 'international', 'A dusty outback town with a big, loyal crowd.', { x: 845, y: 475 }, 'kestara')
  };
})();
