// global.test.js
// Tests for going global: the new National and International cities and countries, kinds of flights and what they
// cost (airlines and the private jet), unlocking the world, milestone 19 and the jet in the Shop, jet lag, country
// buzz, manager tours abroad, local bands, and loading older saves.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A big career: famous, rich, with a band of three (you + 2) and a van.
  function worldState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.reputation = 100;
    s.player.morale = 60;
    s.player.cash = 3000000;
    s.player.job.status = 'none';
    s.player.gear.van = { kind: 'new', shows: 0, worn: false };
    for (var i = 0; i < 20; i++) {
      var started = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(started.state, started.songId).state;
    }
    for (var k = 0; k < 2; k++) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      s.people[met.personId].status = 'member';
      s.people[met.personId].joinedDay = s.day;
      s.band.memberIds.push(met.personId);
    }
    s.scene.shows = []; // no other bands' shows in the way
    return s;
  }

  Game.test('World: 6 National cities and 15 International cities in 5 countries, each with venues', function (t) {
    var cities = Game.content.cities;
    var national = Object.keys(cities).filter(function (id) { return cities[id].region === 'national'; });
    var abroad = Object.keys(cities).filter(function (id) { return cities[id].region === 'international'; });
    t.equal(national.length, 6, '6 National cities');
    t.equal(abroad.length, 15, '15 International cities');
    var countries = Object.keys(Game.content.countries).filter(function (c) { return c !== 'home'; });
    t.equal(countries.length, 5, '5 countries abroad');
    countries.forEach(function (c) {
      var mine = abroad.filter(function (id) { return cities[id].countryId === c; });
      t.equal(mine.length, 3, Game.content.countries[c].name + ' has 3 cities');
      t.ok(Game.content.countries[c].shape.length >= 6 && cities[Game.content.countries[c].capital].countryId === c, 'an outline and a capital in the country');
    });
    national.concat(abroad).forEach(function (id) {
      var venues = Object.keys(Game.content.venues).filter(function (v) { return Game.content.venues[v].cityId === id; });
      t.ok(venues.length >= 3 && cities[id].fanCeiling > 0 && cities[id].world, cities[id].name + ': venues, a fan ceiling, and a spot on the map');
    });
    Object.keys(Game.content.venues).forEach(function (v) {
      var venue = Game.content.venues[v];
      if (venue.tier >= 1 && !venue.festival && !venue.deals.inStore) t.ok(Game.balance.venues.guarantees[v] > 0, venue.name + ' has a fee');
    });
  });

  Game.test('Flights: national, international, and hops inside a country, priced per person on the airlines', function (t) {
    var tr = Game.rules.travel;
    var b = Game.balance.travel;
    var s = worldState(); // you + 2 bandmates = 3 people
    t.equal(tr.legKind('hometown', 'harlowFalls'), 'drive', 'driving at home');
    t.equal(tr.legKind('hometown', 'ironridge'), 'national', 'a National city is a flight');
    t.equal(tr.legKind('hometown', 'lindenberg'), 'international', 'abroad');
    t.equal(tr.legKind('newHalston', 'akarumi'), 'international', 'National city to abroad');
    t.equal(tr.legKind('lindenberg', 'askerholm'), 'hop', 'inside Nordhavia');
    t.equal(tr.legKind('lindenberg', 'valmora'), 'international', 'between two countries');
    t.equal(tr.legBlocks('hometown', 'lindenberg', s), b.internationalFlight.blocks, b.internationalFlight.blocks + ' blocks abroad');
    t.equal(tr.legBlocks('lindenberg', 'frostvik', s), b.hop.blocks, b.hop.blocks + ' block for a hop');
    t.equal(tr.legGas('hometown', 'lindenberg', s), 3 * b.internationalFlight.perPersonOneWay, '3 people abroad');
    t.equal(tr.legGas('lindenberg', 'frostvik', s), 3 * b.hop.perPersonOneWay, '3 people on a hop');
    t.equal(tr.legGas('hometown', 'ironridge', s), 3 * b.flight.perPersonOneWay, '3 people at home');
    t.equal(tr.legGas('hometown', 'harlowFalls', s), b.gasRoundTrip.near / 2, 'driving is unchanged');
  });

  Game.test('Private jet: one price for the whole band and a block faster (never under 1); hops take the cheaper fare', function (t) {
    var tr = Game.rules.travel;
    var j = Game.balance.travel.jet;
    var s = worldState();
    s.player.gear.jet = true;
    t.equal(tr.legGas('hometown', 'lindenberg', s), j.international, 'abroad: $' + j.international.toLocaleString());
    t.equal(tr.legGas('hometown', 'ironridge', s), j.national, 'at home: $' + j.national.toLocaleString());
    t.equal(tr.legGas('lindenberg', 'frostvik', s), Math.min(j.hop, 3 * Game.balance.travel.hop.perPersonOneWay), 'a hop: the cheaper');
    t.equal(tr.legBlocks('hometown', 'lindenberg', s), Game.balance.travel.internationalFlight.blocks - j.blocksFaster, 'a block faster abroad');
    t.equal(tr.legBlocks('lindenberg', 'frostvik', s), 1, 'a hop is still 1 block');
    s.band.memberIds.push('pExtra');
    t.equal(tr.legGas('hometown', 'lindenberg', s), j.international, 'a bigger band costs the same on the jet');
    t.equal(tr.legGas('hometown', 'harlowFalls', s), Game.balance.travel.gasRoundTrip.near / 2, 'the jet doesn\'t change driving');
  });

  Game.test('Unlocking the world: a finished tour that played 2 or more National cities', function (t) {
    var tr = Game.rules.travel;
    var s = worldState();
    s.manager.hired = true;
    s.label.signed = true;
    t.ok(/2 or more National cities/.test(tr.cityUnlockProblem(s, 'lindenberg')), tr.cityUnlockProblem(s, 'lindenberg'));
    s.tours.push({ id: 't1', name: null, cities: ['newHalston', 'harlowFalls', 'redstone'], firstDay: 1, lastDay: 5, shows: 3, result: { shows: 3 } });
    t.ok(tr.cityUnlockProblem(s, 'lindenberg'), 'one National city isn\'t enough');
    s.tours.push({ id: 't2', name: null, cities: ['newHalston', 'kingsport', 'redstone'], firstDay: 10, lastDay: 15, shows: 3, result: null });
    t.ok(tr.cityUnlockProblem(s, 'lindenberg'), 'a tour that isn\'t finished doesn\'t count');
    s.tours[1].result = { shows: 3 };
    t.equal(tr.cityUnlockProblem(s, 'lindenberg'), null, 'two National cities on a finished tour: open');
    var r = tr.updateCityUnlocks(s);
    t.ok(Object.keys(Game.content.cities).every(function (id) { return Game.content.cities[id].region !== 'international' || r.state.cities[id].unlocked; }), 'every international city opens');
    t.ok(r.state.toasts.some(function (x) { return x.id === 'cities-international'; }), 'a banner');
    t.ok(r.state.inbox.some(function (m) { return m.kind === 'note' && /International cities are open/.test(m.data.title); }), 'an Inbox note');
  });

  Game.test('Milestone 19 and the jet: your first show abroad unlocks the private jet in the Shop', function (t) {
    var s = worldState();
    var jet = function (st) { return Game.rules.merch.shopItems(st).filter(function (i) { return i.id === 'jet'; })[0]; };
    t.ok(!jet(s).unlocked, 'locked: ' + jet(s).why);
    s.stats.citiesPlayed.lindenberg = 1;
    s = Game.rules.progress.checkUnlocks(s).state;
    t.ok(s.milestones.goingGlobal !== undefined, 'milestone 19, Going global');
    t.ok(jet(s).unlocked, 'the jet is in the Shop');
    var cash = s.player.cash;
    var bought = Game.rules.merch.buy(s, 'jet').state;
    t.equal(bought.player.cash, cash - Game.balance.travel.jet.price, 'paid $' + Game.balance.travel.jet.price.toLocaleString());
    t.ok(bought.player.gear.jet, 'you own it');
    t.ok(jet(bought).owned, 'the Shop says you own it');
  });

  Game.test('Jet lag: arriving from another country costs energy (less on your own jet)', function (t) {
    var b = Game.balance.travel.jetLag;
    var s = worldState();
    s.player.energy = 80;
    var leg = { id: 'eT', day: s.day, block: 'morning', type: 'travel', from: 'hometown', to: 'lindenberg', legStart: true, tripId: 'none' };
    var r = Game.rules.travel.travelBlock(s, leg, s.player.energy);
    t.equal(r.state.player.energy, 80 - b.energy, '-' + b.energy + ' energy');
    t.ok(r.log.some(function (l) { return /Jet lag/.test(l); }), 'a line in the day report');
    s.player.gear.jet = true;
    t.equal(Game.rules.travel.travelBlock(s, leg, s.player.energy).state.player.energy, 80 - b.withJet, 'on the jet: -' + b.withJet);
    var hop = { id: 'eH', day: s.day, block: 'morning', type: 'travel', from: 'lindenberg', to: 'askerholm', legStart: true, tripId: 'none' };
    t.equal(Game.rules.travel.travelBlock(s, hop, s.player.energy).state.player.energy, 80, 'no jet lag on a hop');
  });

  Game.test('Country buzz: a show abroad gives buzz to the other cities in that country', function (t) {
    var s = worldState();
    ['lindenberg', 'askerholm', 'frostvik', 'valmora'].forEach(function (id) { s.cities[id].unlocked = true; s.cities[id].buzz = 0; });
    var venue = Object.keys(Game.content.venues).filter(function (v) { return Game.content.venues[v].cityId === 'lindenberg' && Game.content.venues[v].tier === 2; })[0];
    var r = Game.rules.travel.afterShow(s, { id: 'eX', day: s.day, block: 'evening', type: 'gig', venueId: venue });
    t.ok(r.state.cities.askerholm.buzz > 0 && r.state.cities.frostvik.buzz > 0, 'Askerholm and Frostvik get buzz');
    t.equal(r.state.cities.valmora.buzz, 0, 'another country doesn\'t');
  });

  Game.test('Manager tours abroad: a country\'s cities stay together, with short hops between them', function (t) {
    var s = worldState();
    s.manager.hired = true;
    s.label.signed = true;
    Object.keys(s.cities).forEach(function (id) { s.cities[id].unlocked = true; });
    var plan = Game.rules.manager.planTour(s, ['lindenberg', 'valmora', 'askerholm', 'castellune'], 2, null);
    var order = plan.shows.map(function (x) { return Game.content.cities[Game.content.venues[x.venueId].cityId].countryId; });
    t.equal(plan.shows.length, 4, 'all 4 cities planned (' + plan.skipped.map(function (x) { return x.why; }).join(' ') + ')');
    t.ok(order[0] === order[1] && order[2] === order[3] && order[1] !== order[2], 'two countries, each together: ' + order.join(', '));
  });

  Game.test('Scene abroad: local bands live in their country, and unlocked cities abroad get calendars', function (t) {
    var s = worldState(3);
    var locals = Object.keys(s.scene.bands).map(function (id) { return s.scene.bands[id]; }).filter(function (b) { return b.countryId; });
    t.ok(locals.length === 15 && locals.every(function (b) { return Game.content.cities[b.homeCity].countryId === b.countryId; }), '15 local bands, each at home in its country');
    Object.keys(s.cities).forEach(function (id) { if (Game.content.cities[id].countryId === 'kaigara') s.cities[id].unlocked = true; });
    s.manager.hired = true;
    s.scene.shows = [];
    s.scene.filled = {};
    Game.rules.scene.fill(s);
    var abroad = s.scene.shows.filter(function (x) { return Game.content.cities[Game.content.venues[x.venueId].cityId].countryId === 'kaigara'; });
    t.ok(abroad.length > 0, abroad.length + ' shows in Kaigara');
    var smallAway = abroad.filter(function (x) {
      var b = s.scene.bands[x.bandId];
      return b.reputation < Game.balance.scene.touringRep && Game.rules.travel.countryOf(b.homeCity) !== 'kaigara';
    });
    t.equal(smallAway.length, 0, 'only local bands and touring bands play abroad');
  });

  Game.test('Saves: a version 20 save gets the new cities, local bands abroad, and the jet (not owned)', function (t) {
    var s = worldState(4);
    var old = JSON.parse(JSON.stringify(s));
    old.version = 20;
    delete old.cities.ironridge;
    delete old.venues.akarumiDome;
    delete old.player.gear.jet;
    Object.keys(old.scene.bands).forEach(function (id) { if (old.scene.bands[id].countryId) delete old.scene.bands[id]; });
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loads');
    t.ok(loaded.state.cities.ironridge && loaded.state.venues.akarumiDome, 'new cities and venues');
    t.equal(loaded.state.player.gear.jet, false, 'no jet yet');
    t.equal(Object.keys(loaded.state.scene.bands).length, Object.keys(s.scene.bands).length, 'local bands added');
    t.sameContents(loaded.state.scene.bands, s.scene.bands, 'the same local bands a new career gets');
  });
})();
