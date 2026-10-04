// road.test.js
// Tests for Phase 11, on the road: cities unlocking, travel booked around out-of-town shows (blocks, gas,
// hotels, day job), chained trips, not making it, tours, vans, road fatigue, fan fading, fan ceilings,
// out-of-town open mics, emailing venues without using a block, and milestones 10, 12, and 13.
// Day 0 is a Monday, so days 5, 12, and 19 are Saturdays.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var tr = function () { return Game.rules.travel; };

  // A career that can play out of town: reputation 30 (Near cities open), 6 songs, plenty of energy.
  function roadState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    s.player.reputation = 30;
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    s = Game.rules.progress.checkUnlocks(s).state;
    s.toasts = [];
    return s;
  }

  // Adds bandmates (easygoing, happy). Returns { state, ids }.
  function withBand(s, count) {
    var ids = [];
    for (var i = 0; i < count; i++) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      s.people[met.personId].relationship = 60; s.people[met.personId].skill = 40; s.people[met.personId].trait = 'easygoing';
      s = Game.rules.people.invite(s, met.personId).state;
      ids.push(met.personId);
    }
    return { state: s, ids: ids };
  }

  // Books an out-of-town show straight onto the calendar (with its travel). Returns the new state.
  function book(s, venueId, day, jobChoice) {
    var r = tr().addShow(s, venueId, day, 'guarantee', jobChoice);
    if (r.problems.length) throw new Error(r.problems[0]);
    return r.state;
  }

  // The travel entries on the calendar, as "day block from>to" strings in time order.
  function travelPlan(s) {
    return Object.keys(s.entries).map(function (id) { return s.entries[id]; })
      .filter(function (e) { return e.type === 'travel'; })
      .sort(function (a, b) { return tr().slot(a.day, a.block) - tr().slot(b.day, b.block); })
      .map(function (e) { return e.day + ' ' + e.block + ' ' + e.from + '>' + e.to; });
  }

  function tripList(s) { return Object.keys(s.trips).map(function (id) { return s.trips[id]; }); }

  // ----- Cities -----

  Game.test('Cities: Near at reputation 25, Mid at 40 plus a Near show, Far at 50 plus a van; National and International stay locked', function (t) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.reputation = 24;
    t.ok(tr().cityUnlockProblem(s, 'harlowFalls'), 'reputation 24: Near locked');
    s.player.reputation = 25;
    s = tr().updateCityUnlocks(s).state;
    t.ok(s.cities.harlowFalls.unlocked && s.cities.cedarJunction.unlocked, 'reputation 25: both Near cities');
    s.player.reputation = 40;
    s = tr().updateCityUnlocks(s).state;
    t.equal(s.cities.portEllery.unlocked, false, 'Mid needs a Near show too');
    t.ok(tr().cityUnlockProblem(s, 'portEllery').indexOf('Near city') !== -1, 'and says so');
    s.stats.citiesPlayed.harlowFalls = 1;
    var r = tr().updateCityUnlocks(s);
    t.ok(r.state.cities.portEllery.unlocked && r.state.cities.ashfordSprings.unlocked, 'Mid cities open');
    t.ok(r.state.toasts.some(function (x) { return x.id === 'cities-mid'; }), 'with a banner');
    s = r.state;
    s.player.reputation = 50;
    t.equal(tr().updateCityUnlocks(s).state.cities.redstone.unlocked, false, 'Far needs a van');
    s.player.gear.van = { kind: 'used', shows: 0, worn: false };
    t.ok(tr().updateCityUnlocks(s).state.cities.redstone.unlocked, 'reputation 50 and a van: Far open');
    s.player.reputation = 100;
    s = tr().updateCityUnlocks(s).state;
    t.equal(s.cities.newHalston.unlocked, false, 'National stays locked');
    t.equal(s.cities.lindenberg.unlocked, false, 'International stays locked');
  });

  Game.test('Cities: every city has an open mic and 2 to 4 venues, and its own fan ceiling', function (t) {
    var g = Game.balance.geography;
    Object.keys(Game.content.cities).forEach(function (id) {
      var venues = Object.keys(Game.content.venues).map(function (v) { return Game.content.venues[v]; }).filter(function (v) { return v.cityId === id; });
      var openMics = venues.filter(function (v) { return v.tier === 0; }).length;
      var others = venues.length - openMics;
      t.ok(openMics >= 1, Game.content.cities[id].name + ' has an open mic');
      if (id !== 'hometown') t.ok(others >= g.venuesPerCity.min && others <= g.venuesPerCity.max, Game.content.cities[id].name + ': ' + others + ' venues');
      t.ok(Game.content.cities[id].fanCeiling > 0, 'fan ceiling ' + Game.content.cities[id].fanCeiling);
    });
  });

  // ----- Travel booking -----

  Game.test('Travel: a Near show on Saturday evening means travel Saturday afternoon and drive back Sunday morning', function (t) {
    var s = book(roadState(), 'copperPint', 12);
    t.sameContents(travelPlan(s), ['12 afternoon hometown>harlowFalls', '13 morning harlowFalls>hometown'], 'the travel');
    var trip = tripList(s)[0];
    t.equal(tr().tripNights(trip), 1, 'one hotel night');
    t.equal(tr().jobDaysNeeded(s).length, 0, 'a weekend: no time off work');
    t.equal(Game.rules.booking.blockTaken(s, 12, 'afternoon'), 'Travelling', 'the travel block is taken');
    var p = tr().preview(roadState(), 'copperPint', 12, 'guarantee');
    t.equal(p.gas, Game.balance.travel.gasRoundTrip.near, 'gas $40 round trip');
    t.equal(p.hotelCost, Game.balance.travel.hotelPerNight, 'hotel $80');
    t.equal(p.energy, 2 * Game.balance.travel.energyPerBlock, '2 travel blocks: 30 energy');
  });

  Game.test('Travel: a Mid show on a Wednesday takes 2 blocks each way and needs both workdays off', function (t) {
    var s = roadState();
    s.cities.portEllery.unlocked = true;
    var c = tr().check(s, 'rustyAnchor', 9);
    t.equal(c.problem, null, 'it fits');
    t.sameContents(c.jobDays, [9, 10], 'Wednesday and Thursday off work');
    s = book(s, 'rustyAnchor', 9, 'sick');
    t.sameContents(travelPlan(s), ['9 morning hometown>portEllery', '9 afternoon hometown>portEllery',
      '10 morning portEllery>hometown', '10 afternoon portEllery>hometown'], '2 blocks each way');
    t.equal(s.player.job.daysOff[9], 'sick', 'Wednesday off');
    t.equal(s.player.job.daysOff[10], 'sick', 'Thursday off');
  });

  Game.test('Travel: accepting an out-of-town offer asks how to take workdays off, then books the show and the trip', function (t) {
    var s = roadState();
    s.cities.portEllery.unlocked = true;
    s = Game.rules.booking.sendRequest(s, 'rustyAnchor', 9, 'guarantee').state;
    s.debug.acceptNextBooking = true;
    s = Game.rules.debug.replyNow(s).state;
    var m = s.inbox[s.inbox.length - 1];
    t.sameContents(Game.rules.booking.offerJobDays(s, m.id), [9, 10], 'two workdays');
    t.ok(Game.rules.booking.acceptProblem(s, m.id, null).indexOf('day job') !== -1, 'asks how to take them off');
    var r = Game.rules.booking.acceptOffer(s, m.id, 'skip');
    t.ok(r.entryId, 'booked');
    t.equal(travelPlan(r.state).length, 4, 'travel booked');
    t.equal(r.state.player.job.daysOff[10], 'skip', 'days off taken');
  });

  Game.test('Travel: a Far show takes a full day each way (2 hotel nights); with a band it needs a van', function (t) {
    var s = roadState();
    s.cities.redstone.unlocked = true;
    s = book(s, 'dustySaloon', 12);
    t.sameContents(travelPlan(s), ['11 evening hometown>redstone', '12 morning hometown>redstone', '12 afternoon hometown>redstone',
      '13 morning redstone>hometown', '13 afternoon redstone>hometown', '13 evening redstone>hometown'], 'leave Friday evening, back Sunday evening');
    t.equal(tr().tripNights(tripList(s)[0]), 2, 'two hotel nights');
    var band = withBand(roadState(), 1).state;
    band.cities.redstone.unlocked = true;
    t.ok(tr().check(band, 'dustySaloon', 12).problem.indexOf('van') !== -1, 'with a band: needs a van');
    band.player.gear.van = { kind: 'beater', shows: 0, worn: false };
    t.equal(tr().check(band, 'dustySaloon', 12).problem, null, 'with a van: OK');
  });

  Game.test('Travel: a locked city can\'t be booked, and a show too soon to reach is refused', function (t) {
    var s = roadState();
    t.ok(tr().check(s, 'rustyAnchor', 12).problem.indexOf('Needs') !== -1, 'Mid city locked');
    s.cities.redstone.unlocked = true;
    s.day = 12;
    t.ok(tr().check(s, 'dustySaloon', 12).problem, 'a Far show tonight: too late to get there');
  });

  Game.test('Travel: shows close together chain into one trip; far apart they\'re two trips', function (t) {
    var s = book(book(roadState(), 'copperPint', 12), 'railyardTavern', 13);
    t.equal(tripList(s).length, 1, 'Saturday Harlow Falls + Sunday Cedar Junction: one trip');
    t.sameContents(travelPlan(s), ['12 afternoon hometown>harlowFalls', '13 afternoon harlowFalls>cedarJunction', '14 morning cedarJunction>hometown'],
      'home, city to city, then home');
    t.equal(tr().tripNights(tripList(s)[0]), 2, 'two hotel nights');
    t.sameContents(tr().jobDaysNeeded(s), [14], 'driving home Monday morning needs Monday off');
    var apart = book(book(roadState(), 'copperPint', 12), 'railyardTavern', 19);
    t.equal(tripList(apart).length, 2, 'a week apart: two trips');
  });

  Game.test('On the road: only Practice, Write, Rest, Post online, or Talk; hometown things are blocked', function (t) {
    var s = book(book(roadState(), 'copperPint', 12), 'railyardTavern', 14, 'sick'); // away all Sunday (day 13)
    t.ok(Game.rules.actions.plan(s, 'evening', 'network', null, 13).log[0].indexOf('on the road') !== -1, 'no networking out of town');
    t.equal(Game.rules.actions.plan(s, 'evening', 'practice', null, 13).log.length, 0, 'Practice is fine');
    t.equal(Game.rules.booking.blockTaken(s, 13, 'evening'), 'On the road', 'no hometown bookings while away');
    t.equal(Game.rules.booking.blockContents(s, 13, 'morning').kind, 'away', 'the Calendar shows you away');
  });

  Game.test('Travel costs: gas when each leg starts, a hotel each night away, and 15 energy a travel block', function (t) {
    var s = book(roadState(), 'copperPint', 12);
    s.day = 12;
    s.player.energy = 100;
    var costsBefore = s.thisWeek.costs.travel || 0;
    s.pendingEvent = null;
    var sat = Game.rules.day.endDay(s).state;
    t.equal((sat.thisWeek.costs.travel || 0) - costsBefore, Game.balance.travel.gasRoundTrip.near / 2 + Game.balance.travel.hotelPerNight,
      'Saturday: $20 gas + $80 hotel');
    t.sameContents(sat.stats.outOfTownShowDays, [12], 'the show counts');
    t.equal(sat.stats.citiesPlayed.harlowFalls, 1);
    sat.pendingEvent = null;
    var sun = Game.rules.day.endDay(sat).state;
    t.equal(sun.ledger[sun.ledger.length - 1].costs.travel, Game.balance.travel.gasRoundTrip.near + Game.balance.travel.hotelPerNight, 'the week: $120');
    t.equal(Object.keys(sun.trips).length, 0, 'home again: the trip is over');
    var lines = sat.lastDayReport.blocks[1].lines.join(' ');
    t.ok(lines.indexOf('-' + Game.balance.travel.energyPerBlock + ' energy') !== -1, 'the travel block costs 15 energy');
  });

  Game.test('Can\'t get there: no energy to leave (or no van when the trip needs one) means no-shows for the whole trip', function (t) {
    var s = book(book(roadState(), 'copperPint', 12), 'railyardTavern', 13);
    var trip = tripList(s)[0];
    var first = s.entries[s.schedule[12].afternoon];
    var rel = s.venues.copperPint.relationship;
    var r = tr().travelBlock(s, first, 0);
    t.ok(r.stranded, 'couldn\'t leave');
    t.equal(Object.keys(r.state.trips).length, 0, 'trip called off');
    t.equal(Game.rules.booking.upcomingShows(r.state).length, 0, 'both shows gone');
    t.equal(r.state.venues.copperPint.relationship, rel + Game.balance.cancellations.noShow.venueRelationship, 'no-show penalty');
    t.ok(r.state.venues.railyardTavern.bannedUntilDay !== null, 'the second venue too');

    var noVan = Game.util.clone(s);
    noVan.trips[trip.id].needsVan = true;
    t.ok(tr().travelBlock(noVan, first, 100).stranded, 'needs a van, has none: stranded');
    t.equal(tr().travelBlock(s, first, 100).stranded, false, 'with energy: off you go');
  });

  Game.test('Cancelling an out-of-town show rebuilds the trip and gives back days off it needed', function (t) {
    var s = book(book(roadState(), 'copperPint', 12), 'railyardTavern', 13, 'sick');
    t.equal(s.player.job.daysOff[14], 'sick', 'Monday off for the drive home');
    var second = s.schedule[13].evening;
    var r = Game.rules.booking.cancelShow(s, second);
    t.sameContents(travelPlan(r.state), ['12 afternoon hometown>harlowFalls', '13 morning harlowFalls>hometown'], 'back to a simple trip');
    t.equal(r.state.player.job.daysOff[14], undefined, 'Monday off given back');
  });

  // ----- Tours -----

  Game.test('Tours: 3+ out-of-town shows within 10 days', function (t) {
    t.ok(tr().isTour([1, 5, 9], 9), 'days 1, 5, 9: a tour');
    t.ok(tr().isTour([1, 5, 10], 5), 'days 1 to 10: still within 10 days');
    t.equal(tr().isTour([1, 5, 11], 11), false, 'days 1 to 11: too spread out');
    t.equal(tr().isTour([1, 5], 5), false, 'two shows isn\'t a tour');
    var s = roadState();
    s.stats.outOfTownShowDays = [3, 6, 9];
    t.ok(tr().playedTour(s), 'played a tour');
  });

  Game.test('Tours: need a van, and bandmates gain satisfaction for each tour show', function (t) {
    var s = book(book(roadState(), 'copperPint', 12), 'railyardTavern', 13);
    t.ok(tr().check(s, 'grayFox', 19).problem.indexOf('tour') !== -1, 'a third show within 10 days needs a van');
    s.player.gear.van = { kind: 'used', shows: 0, worn: false };
    t.equal(tr().check(s, 'grayFox', 19).problem, null, 'with a van: OK');

    var band = withBand(roadState(), 1);
    var b = band.state;
    b.stats.outOfTownShowDays = [10, 11];
    var entry = { venueId: 'copperPint', day: 12 };
    var before = b.people[band.ids[0]].satisfaction;
    var r = tr().afterShow(b, entry);
    t.equal(r.state.people[band.ids[0]].satisfaction, before + Game.balance.satisfaction.change.tourShow, '+2 for a tour show');
    t.ok(tr().playedTour(r.state), 'and that\'s a tour played');
  });

  Game.test('Milestones 10, 12, 13: On the road (reputation 25), Wheels (a van), First tour', function (t) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.reputation = Game.balance.milestones.onTheRoadReputation;
    s = Game.rules.progress.checkUnlocks(s).state;
    t.ok(s.milestones.onTheRoad !== undefined, 'On the road');
    t.ok(s.cities.harlowFalls.unlocked, 'Near cities open with it');
    s.player.cash = 5000;
    var bought = Game.rules.merch.buy(s, 'van-used');
    t.equal(bought.state.player.cash, 5000 - Game.balance.vans.used.price, 'paid $3,000');
    t.ok(bought.state.milestones.wheels !== undefined, 'Wheels');
    t.sameContents(bought.state.player.gear.van, { kind: 'used', shows: 0, worn: false }, 'the van');
    var toured = Game.util.clone(bought.state);
    toured.stats.outOfTownShowDays = [20, 22, 24];
    t.ok(Game.rules.progress.checkUnlocks(toured).state.milestones.firstTour !== undefined, 'First tour');
  });

  // ----- Vans -----

  Game.test('Vans: a beater lasts 10 out-of-town shows (it gets you home, then it\'s gone); a new van never breaks', function (t) {
    var s = book(roadState(), 'copperPint', 12);
    s.player.gear.van = { kind: 'beater', shows: Game.balance.vans.beater.maxShows - 1, worn: false };
    var r = tr().afterShow(s, { venueId: 'copperPint', day: 12 });
    t.ok(r.state.player.gear.van.worn, 'the 10th show wears it out');
    var home = r.state.entries[r.state.schedule[13].morning];
    var back = tr().travelBlock(r.state, home, 100);
    t.equal(back.state.player.gear.van, null, 'it got you home, then broke down');
    var fresh = book(roadState(), 'copperPint', 12);
    fresh.player.gear.van = { kind: 'new', shows: 500, worn: false };
    t.equal(tr().afterShow(fresh, { venueId: 'copperPint', day: 12 }).state.player.gear.van.worn, false, 'a new van never wears out');
    t.equal(tr().vanShowsLeft(fresh), null, 'unlimited');
  });

  // ----- Road fatigue, fans -----

  Game.test('Road fatigue: from the 5th day in a row on the road, morale drops 3 a night', function (t) {
    var s = book(roadState(), 'copperPint', 12);
    s.day = 12;
    s.player.roadDays = 3;
    var day4 = tr().nightly(s).state;
    t.equal(day4.player.roadDays, 4, 'day 4');
    t.equal(day4.player.morale, s.player.morale, 'no fatigue yet');
    var day5 = tr().nightly(day4).state;
    t.equal(day5.player.morale, day4.player.morale + Game.balance.morale.roadFatiguePerDay, 'day 5: -3 morale');
    var home = Game.util.clone(day5);
    home.trips = {};
    t.equal(tr().nightly(home).state.player.roadDays, 0, 'a day at home resets it');
  });

  Game.test('Fans fade 2% a week in a city with no show or release for 30 days', function (t) {
    var s = roadState();
    s.cities.harlowFalls.fans = 1000;
    s.cities.harlowFalls.lastActivityDay = 0;
    s.day = Game.balance.fans.fadeAfterDays - 1;
    t.equal(Game.rules.audience.fadeFans(s).state.cities.harlowFalls.fans, 1000, 'day 29: no fading yet');
    s.day = Game.balance.fans.fadeAfterDays;
    var r = Game.rules.audience.fadeFans(s);
    t.equal(r.state.cities.harlowFalls.fans, 980, 'day 30: -2% (20 fans)');
    t.ok(r.log[0].indexOf('Harlow Falls') === 0, 'and says where');
    s.cities.harlowFalls.lastActivityDay = 10;
    t.equal(Game.rules.audience.fadeFans(s).state.cities.harlowFalls.fans, 1000, 'a show 20 days ago keeps them');
  });

  Game.test('Fan ceilings: a city never has more fans than its ceiling, from gigs or releases', function (t) {
    var s = roadState();
    var ceiling = Game.content.cities.harlowFalls.fanCeiling;
    t.equal(ceiling, Game.balance.geography.fanCeilings.harlowFalls, 'from balance.js');
    t.equal(Game.rules.audience.addFans(s, 'harlowFalls', ceiling * 2).state.cities.harlowFalls.fans, ceiling, 'capped');
    s.cities.harlowFalls.fans = ceiling - 1;
    s.cities.harlowFalls.buzz = 100;
    s.debug.forceNextGig = 'legendary';
    var r = Game.rules.gigs.playGig(s, 'theDepot', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'guarantee' });
    t.ok(r.state.cities.harlowFalls.fans <= ceiling, 'a legendary gig doesn\'t pass it (' + r.state.cities.harlowFalls.fans + ')');
  });

  // ----- Open mics and email -----

  Game.test('Out-of-town open mics: sign up for its night (no email, no odds); the trip and days off are booked', function (t) {
    var s = roadState();
    var dates = tr().openMicDates(s, 'junctionCoffee');
    t.ok(dates.every(function (d) { return Game.rules.day.dayOfWeek(d) === Game.content.venues.junctionCoffee.openMicDay; }), 'Fridays only');
    var day = dates[0];
    t.ok(tr().openMicProblem(s, 'junctionCoffee', day, null).indexOf('day job') !== -1, 'Friday afternoon travel: asks about work');
    var r = tr().signUpOpenMic(s, 'junctionCoffee', day, 'sick');
    var show = r.state.entries[r.state.schedule[day].evening];
    t.equal(show.deal, 'openMic', 'signed up');
    t.equal(show.songIds.length, Game.balance.songs.setlist.openMic.songs, '2 songs');
    t.equal(r.state.player.job.daysOff[day], 'sick', 'Friday off');
    t.equal(travelPlan(r.state).length, 2, 'travel there and back');
  });

  Game.test('Email a venue: no block needed, 5 energy each, as many venues as you like; too tired is refused', function (t) {
    var s = roadState();
    var e = s.player.energy;
    var r1 = Game.rules.booking.emailVenue(s, 'backRoom', 12, 'guarantee');
    t.ok(r1.state.venues.backRoom.pendingRequestId, 'sent');
    t.equal(r1.state.player.energy, e - Game.balance.energy.cost.email, '-5 energy');
    t.equal(Object.keys(r1.state.schedule[0] || {}).length, 0, 'no block used');
    var r2 = Game.rules.booking.emailVenue(r1.state, 'cornerTap', 11, 'guarantee');
    t.ok(r2.state.venues.cornerTap.pendingRequestId, 'a second venue the same day');
    var tired = Game.util.clone(s);
    tired.player.energy = Game.balance.energy.cost.email - 1;
    t.ok(Game.rules.booking.emailVenue(tired, 'backRoom', 12, 'guarantee').log[0].indexOf('tired') !== -1, 'too tired');
  });

  // ----- Saving -----

  Game.test('Save: a version 10 save loads with every city, no trips, and no van', function (t) {
    var old = Game.util.clone(Game.rules.career.startCareer('Test', 'guitar', 1).state);
    old.version = 10;
    old.cities = { hometown: old.cities.hometown };
    old.player.gear.van = false;
    delete old.trips; delete old.nextTripId; delete old.player.roadDays;
    delete old.stats.outOfTownShowDays; delete old.stats.citiesPlayed; delete old.stats.vansBought;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.version, Game.balance.save.version);
    t.equal(Object.keys(loaded.state.cities).length, Object.keys(Game.content.cities).length, 'every city');
    t.equal(loaded.state.cities.harlowFalls.unlocked, false, 'new cities start locked');
    t.equal(loaded.state.player.gear.van, null, 'no van');
    t.sameContents(loaded.state.trips, {}, 'no trips');
  });

})();
