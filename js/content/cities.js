// cities.js
// Every city in the game. Names are made up. Fixed data, never saved.
//   region      'hometown' | 'near' | 'mid' | 'far' | 'national' | 'international'
//               (the region decides travel time, gas, and how the city unlocks: see Game.rules.travel)
//   fanCeiling  the most fans this city can ever have (numbers in balance.geography.fanCeilings)
//   blurb       a line for the Map screen
// Each city's open mic and venues are in venues.js (by cityId).

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var ceiling = Game.balance.geography.fanCeilings;
  var city = function (id, name, region, blurb) {
    return { id: id, name: name, region: region, fanCeiling: ceiling[id], blurb: blurb };
  };

  Game.content.cities = {
    hometown:       city('hometown', 'Millbrook', 'hometown', 'Home. Where it all starts.'),
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
    // National: flights (locked until the manager and label phases)
    newHalston:     city('newHalston', 'New Halston', 'national', 'A giant media city. Arenas, festivals, and press.'),
    crescentCity:   city('crescentCity', 'Crescent City', 'national', 'A music capital with a famous theater district.'),
    kingsport:      city('kingsport', 'Kingsport', 'national', 'A port city with a coliseum and a big summer festival.'),
    // International: flights (locked until after a major nationwide tour)
    lindenberg:     city('lindenberg', 'Lindenberg', 'international', 'Cobblestones, concert halls, and serious listeners.'),
    portAurelia:    city('portAurelia', 'Port Aurelia', 'international', 'A sunny coast city that loves a stadium show.'),
    valmora:        city('valmora', 'Valmora', 'international', 'An old opera city with a huge outdoor festival.')
  };
})();
