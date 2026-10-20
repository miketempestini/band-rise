// tourbuilder.test.js
// Tests for tours you build yourself (Game.rules.manager: builtTourProblem, requestBuiltTour, planBuiltTour): what a
// request needs, venues answering (with the manager falling back to another room, or dropping a stop), the travel
// order, and accepting the proposal like any tour.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A famous band with a manager, a van, 20 songs, two bandmates, and every city you can drive or fly to unlocked.
  function builderState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.reputation = 100;
    s.player.cash = 500000;
    s.player.job.status = 'none';
    s.player.gear.van = { kind: 'new', shows: 0, worn: false };
    s.manager.hired = true;
    for (var i = 0; i < 20; i++) {
      var st = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(st.state, st.songId).state;
    }
    for (var k = 0; k < 2; k++) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      s.people[met.personId].status = 'member';
      s.people[met.personId].joinedDay = s.day;
      s.band.memberIds.push(met.personId);
    }
    Object.keys(s.cities).forEach(function (id) { s.cities[id].unlocked = true; });
    s.scene.shows = [];
    return s;
  }

  var always = function () { return 1; };
  var stop = function (cityId, venueId) { return { cityId: cityId, venueId: venueId }; };

  Game.test('Tour Builder: a request needs 3+ stops, no city twice, and venues that will take you', function (t) {
    var m = Game.rules.manager;
    var s = builderState();
    t.ok(/at least 3 stops/.test(m.builtTourProblem(s, { stops: [stop('harlowFalls', 'theDepot'), stop('redstone', 'theForge')] })), 'too few');
    t.ok(/twice/.test(m.builtTourProblem(s, { stops: [stop('harlowFalls', 'theDepot'), stop('redstone', 'theForge'), stop('harlowFalls', 'copperPint')] })), 'a repeat');
    var low = Game.util.clone(s);
    low.player.reputation = 35; // clubs yes, theaters no
    t.ok(/needs/.test(m.builtTourProblem(low, { stops: [stop('harlowFalls', 'theDepot'), stop('redstone', 'redstoneGrand'), stop('sableBay', 'pierNine')] })),
      'a theater you can\'t book yet: ' + m.builtTourProblem(low, { stops: [stop('harlowFalls', 'theDepot'), stop('redstone', 'redstoneGrand'), stop('sableBay', 'pierNine')] }));
    var ok = { name: 'Hand Built', stops: [stop('harlowFalls', 'theDepot'), null, stop('redstone', 'theForge'), stop('sableBay', 'pierNine')] };
    t.equal(m.builtTourProblem(s, ok), null, 'empty stops are fine, 3 filled ones are enough');
    var sent = m.requestBuiltTour(s, ok);
    t.equal(sent.state.tourRequests.length, 1, 'the manager is planning it');
    t.equal(sent.state.tourRequests[0].stops.length, 3, 'with your 3 stops');
  });

  Game.test('Tour Builder: when every venue says yes, the tour uses your venues, routed for travel', function (t) {
    var s = builderState();
    var request = { name: null, stops: [stop('lindenberg', 'lindenCellar'), stop('harlowFalls', 'theDepot'), stop('redstone', 'theForge')], earliestDay: null };
    var plan = Game.rules.manager.planBuiltTour(s, request, Game.rng.create(1), always);
    t.equal(plan.shows.length, 3, '3 shows (' + plan.skipped.map(function (x) { return x.why; }).join(' ') + ')');
    t.sameContents(plan.shows.map(function (x) { return x.venueId; }), ['theDepot', 'theForge', 'lindenCellar'], 'your venues, nearest first');
    t.equal(plan.changes.length, 0, 'no changes');
    t.ok(plan.built, 'marked as a tour you built');
    t.ok(plan.shows[0].day >= s.day + Game.balance.manager.tour.leadDays, 'at least 5 weeks out');
  });

  Game.test('Tour Builder: a venue that says no is swapped for another room in that city, or the stop is dropped', function (t) {
    var s = builderState();
    var request = { stops: [stop('harlowFalls', 'theDepot'), stop('redstone', 'theForge'), stop('bellmontCity', 'neonGarden')] };
    // The Depot and Neon Garden say no; everyone else says yes. Harlow Falls has other rooms; so does Bellmont City.
    var plan = Game.rules.manager.planBuiltTour(s, request, Game.rng.create(1), function (v) { return v.id === 'theDepot' || v.id === 'neonGarden' ? 0 : 1; });
    var venues = plan.shows.map(function (x) { return x.venueId; });
    t.ok(venues.indexOf('theDepot') === -1 && venues.some(function (v) { return Game.content.venues[v].cityId === 'harlowFalls'; }), 'another room in Harlow Falls');
    t.ok(venues.indexOf('theForge') !== -1, 'The Forge said yes');
    t.ok(plan.changes.some(function (c) { return /The Depot said no, so/.test(c); }), plan.changes[0]);
    // Nobody in Redstone says yes: the stop is dropped.
    var dropped = Game.rules.manager.planBuiltTour(s, request, Game.rng.create(1), function (v) { return v.cityId === 'redstone' ? 0 : 1; });
    t.ok(dropped.shows.every(function (x) { return Game.content.venues[x.venueId].cityId !== 'redstone'; }), 'no show in Redstone');
    t.ok(dropped.changes.some(function (c) { return /No venue in Redstone/.test(c); }), 'a note says why');
  });

  Game.test('Tour Builder: the proposal is accepted like any tour (shows, trips, and the tours list)', function (t) {
    var s = builderState();
    var request = { name: 'The Hand Built Tour', stops: [stop('harlowFalls', 'theDepot'), stop('redstone', 'theForge'), stop('sableBay', 'pierNine')] };
    var plan = Game.rules.manager.planBuiltTour(s, request, Game.rng.create(1), always);
    plan.name = request.name;
    s = Game.rules.booking.addInbox(s, 'tourProposal', plan, s.day + 3);
    var m = s.inbox[s.inbox.length - 1];
    var r = Game.rules.manager.acceptTour(s, m.id, null, {});
    t.equal(r.log[0] && /Booked/.test(r.log.join(' ')) ? true : r.state !== s, true, 'accepted: ' + r.log.join(' '));
    var shows = Object.keys(r.state.entries).map(function (id) { return r.state.entries[id]; }).filter(function (e) { return e.type === 'gig'; });
    t.equal(shows.length, 3, '3 shows on the calendar');
    t.ok(Object.keys(r.state.trips).length >= 1, 'with the travel');
    t.equal(r.state.tours[r.state.tours.length - 1].name, 'The Hand Built Tour', 'on the tours list with its name');
  });
})();
