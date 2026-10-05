// bigtime.test.js
// Tests for Phase 12, the big time: the manager (cut, 12-week horizon, auto-booking, tours), the Big campaign
// and the press push, production costs, the label (advance, streaming payback, Top studio, National cities),
// flights, arena and festival offers, awards season, and milestones 14 to 18.
// Day 0 is a Monday.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A well-known act: reputation 70, plenty of songs, a full bank account, and the Near and Mid cities open.
  function bigState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    s.player.reputation = 70;
    s.player.cash = 20000;
    s.player.job.status = 'none';
    for (var i = 0; i < 6; i++) {
      var started = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(started.state, started.songId).state;
    }
    ['harlowFalls', 'cedarJunction', 'portEllery', 'ashfordSprings'].forEach(function (id) { s.cities[id].unlocked = true; });
    return s;
  }

  // Hires the manager through their Inbox offer.
  function withManager(s) {
    s = Game.rules.booking.addInbox(s, 'managerOffer', {}, s.day + 7);
    return Game.rules.manager.hire(s, s.inbox[s.inbox.length - 1].id).state;
  }

  // Adds easygoing bandmates. Returns the new state.
  function withBand(s, count) {
    for (var i = 0; i < count; i++) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      s.people[met.personId].relationship = 60; s.people[met.personId].skill = 40; s.people[met.personId].trait = 'easygoing';
      s = Game.rules.people.invite(s, met.personId).state;
    }
    return s;
  }

  function lastMessage(s, kind) { return Game.rules.manager.lastMessage(s, kind); }

  // ----- The manager -----

  Game.test('Manager: the offer comes at reputation 50 and 2,000 fans, and again 8 weeks after you turn it down', function (t) {
    var s = bigState();
    s.player.reputation = 49;
    s.cities.hometown.fans = 2000;
    t.equal(Game.rules.manager.offerCheck(s).state.inbox.length, 0, 'reputation 49: no offer');
    s.player.reputation = 50;
    s = Game.rules.manager.offerCheck(s).state;
    var m = lastMessage(s, 'managerOffer');
    t.ok(m, 'an offer');
    t.equal(Game.rules.manager.offerCheck(s).state.inbox.length, s.inbox.length, 'only one at a time');
    s = Game.rules.booking.declineOffer(s, m.id).state;
    s.day += 7 * Game.balance.manager.reofferWeeks - 1;
    t.equal(Game.rules.manager.offerCheck(s).state.inbox.length, s.inbox.length, 'not again too soon');
    s.day += 1;
    t.ok(Game.rules.manager.offerCheck(s).state.inbox.length > s.inbox.length, '8 weeks later: asked again');
    var hired = Game.rules.manager.hire(s, lastMessage(Game.rules.manager.offerCheck(s).state, 'managerOffer').id);
    t.equal(hired.state.manager.hired, false, 'an old message can\'t be used');
  });

  Game.test('Manager: takes 15% of gig pay before the band\'s split; you can book 12 weeks ahead', function (t) {
    var s = bigState();
    t.equal(Game.rules.manager.calendarWeeks(s), Game.balance.time.startBookingWeeks, '4 weeks without a manager');
    var theater = Game.content.venues.orpheum;
    var lastWithout = Game.rules.booking.bookingDates(s, theater).map(function (d) { return d.day; });
    t.equal(Math.max.apply(null, lastWithout), s.day + 28, 'a theater: only 4 weeks out without a manager');
    s = withManager(s);
    t.equal(Game.rules.manager.calendarWeeks(s), Game.balance.time.managerBookingWeeks, '12 weeks with one');
    t.equal(Math.max.apply(null, Game.rules.booking.bookingDates(s, theater).map(function (d) { return d.day; })), s.day + 56, 'theaters up to 8 weeks out');
    t.equal(Game.rules.manager.cutOf(s, 1000), 150, '15% of $1,000');
    s.debug.forceNextGig = 'solid';
    var r = Game.rules.gigs.playGig(s, 'backRoom', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'door' });
    var w = r.gig.rewards;
    t.ok(w.managerCut > 0, 'the manager took $' + w.managerCut);
    t.equal(w.managerCut, Math.round((w.pay + w.managerCut) * Game.balance.manager.gigPayCut), '15% of the door');
    t.equal(r.state.thisWeek.income.gigPay, w.pay, 'you get the rest (solo)');
  });

  Game.test('Auto-booking: on Mondays, emails venues that fit your rules, up to your shows-a-week limit; "yes" replies get booked', function (t) {
    var s = withManager(bigState());
    t.ok(Game.rules.manager.rulesProblem(s, { on: true, cities: [], tiers: [1], nights: [5], maxPerWeek: 1 }), 'needs a city');
    s = Game.rules.manager.setRules(s, { on: true, cities: ['hometown'], tiers: [1], nights: [4, 5], maxPerWeek: 1 }).state;
    var r = Game.rules.manager.autoBook(s);
    var asks = Object.keys(r.state.requests).map(function (id) { return r.state.requests[id]; });
    t.ok(asks.length > 0, asks.length + ' emails');
    t.ok(asks.every(function (q) { return q.byManager && [4, 5].indexOf(Game.rules.day.dayOfWeek(q.gigDay)) !== -1; }), 'Fridays and Saturdays only');
    t.ok(asks.every(function (q) { return Game.content.venues[q.venueId].tier === 1 && Game.content.venues[q.venueId].cityId === 'hometown'; }), 'hometown small rooms only');
    var weeks = {};
    asks.forEach(function (q) { var w = Game.rules.day.weekNumber(q.gigDay); weeks[w] = (weeks[w] || 0) + 1; });
    t.ok(Object.keys(weeks).every(function (w) { return weeks[w] <= 1; }), 'at most 1 a week');
    var tuesday = Game.util.clone(s);
    tuesday.day = 1;
    t.equal(Game.rules.manager.autoBook(tuesday).state, tuesday, 'only on Mondays');

    var replied = Game.util.clone(r.state);
    replied.debug.acceptNextBooking = true;
    Object.keys(replied.requests).forEach(function (id) { replied.requests[id].replyDay = replied.day; });
    replied = Game.rules.booking.processReplies(replied).state;
    var booked = Game.rules.manager.autoAccept(replied);
    t.equal(Game.rules.booking.upcomingShows(booked.state).length, 1, 'the "yes" was booked for you');
    t.ok(booked.log[0].indexOf('Your manager booked') === 0, 'with a note');
  });

  Game.test('Tours: the manager plans one show per city, nearest first, starting 5+ weeks out, with estimates', function (t) {
    var s = withManager(bigState());
    s.player.gear.van = { kind: 'used', shows: 0, worn: false };
    t.ok(Game.rules.manager.tourRequestProblem(s, { cities: ['harlowFalls'], tier: 1 }), 'needs at least 2 cities');
    s = Game.rules.manager.requestTour(s, { cities: ['portEllery', 'harlowFalls', 'cedarJunction'], tier: 1 }).state;
    t.equal(s.tourRequests.length, 1, 'planning');
    t.equal(Game.rules.manager.processTourRequests(s).state.inbox.length, s.inbox.length, 'not ready yet');
    s.day += Game.balance.manager.tour.planDays;
    s = Game.rules.manager.processTourRequests(s).state;
    var m = lastMessage(s, 'tourProposal');
    t.ok(m, 'the proposal arrived after 5 days');
    var cities = m.data.shows.map(function (x) { return Game.content.venues[x.venueId].cityId; });
    t.equal(m.data.shows.length, 3, '3 shows');
    t.equal(cities[2], 'portEllery', 'the Mid city last (nearest first)');
    t.ok(m.data.shows[0].day >= s.day + Game.balance.manager.tour.leadDays, 'starts 5+ weeks out');
    t.ok(m.data.shows.every(function (x) { return Game.content.venues[x.venueId].tier === 1; }), 'small rooms');
    t.ok(m.data.shows.every(function (x, i) { return i === 0 || x.day > m.data.shows[i - 1].day; }), 'in date order');
    var e = m.data.estimate;
    t.equal(e.rows.length, 3, 'an estimate per show');
    t.ok(e.travel > 0 && e.hotels > 0, 'travel and hotels counted');
    t.equal(e.net, e.income - e.travel - e.hotels - e.production, 'net = pay - costs');
  });

  Game.test('Tours: accepting books every show and the chained travel; declining books nothing', function (t) {
    var s = withManager(bigState());
    s.player.gear.van = { kind: 'used', shows: 0, worn: false };
    s = Game.rules.manager.requestTour(s, { cities: ['harlowFalls', 'cedarJunction', 'portEllery'], tier: 1 }).state;
    s.day += Game.balance.manager.tour.planDays;
    s = Game.rules.manager.processTourRequests(s).state;
    var m = lastMessage(s, 'tourProposal');
    var declined = Game.rules.booking.declineOffer(s, m.id).state;
    t.equal(Game.rules.booking.upcomingShows(declined).length, 0, 'declined: nothing booked');
    var noVan = Game.util.clone(s);
    noVan.player.gear.van = null;
    t.ok(Game.rules.manager.tourAcceptProblem(noVan, m.id, null).indexOf('van') !== -1, 'a tour needs a van');
    var r = Game.rules.manager.acceptTour(s, m.id, null);
    t.equal(Game.rules.booking.upcomingShows(r.state).length, 3, '3 shows booked');
    var trips = Object.keys(r.state.trips).length;
    t.ok(trips >= 1 && trips < 3, 'travel chains from city to city (' + trips + ' trip' + (trips === 1 ? '' : 's') + ')');
    t.equal(lastMessage(r.state, 'tourProposal').resolved, 'accepted');
  });

  // ----- Promotion -----

  Game.test('Big campaign: reputation 40, up to 3 picked cities, +buzz and +1% fans in each', function (t) {
    var s = bigState();
    s.cities.hometown.fans = 1000;
    s.cities.harlowFalls.fans = 500;
    var low = Game.util.clone(s);
    low.player.reputation = 39;
    t.equal(Game.rules.actions.option(low, 'evening', 'bigCampaign').ok, false, 'reputation 39: locked');
    t.ok(Game.rules.actions.plan(s, 'evening', 'bigCampaign', ['hometown', 'harlowFalls', 'portEllery', 'redstone']).log.length, '4 cities is too many');
    s = Game.rules.actions.plan(s, 'evening', 'bigCampaign', ['hometown', 'harlowFalls']).state;
    var buzz = Game.rules.audience.promoBuzz(s, 'bigCampaign');
    var r = Game.rules.actions.perform(s, 'bigCampaign', null, null, null, null, ['hometown', 'harlowFalls']);
    t.equal(r.state.cities.hometown.fans, 1010, 'hometown +1% fans');
    t.equal(r.state.cities.harlowFalls.fans, 505, 'Harlow Falls +1% fans');
    t.near(r.state.cities.harlowFalls.buzz, Math.min(100, buzz), 'buzz there');
    t.equal(r.state.cities.cedarJunction.buzz, 0, 'cities you didn\'t pick are untouched');
    t.equal(r.state.player.cash, s.player.cash - Game.balance.promotion.bigCampaign.cost, '$150');
  });

  Game.test('Press and radio push: needs a manager, +buzz everywhere you have fans, +2 reputation, once every 2 weeks', function (t) {
    var s = bigState();
    s.cities.hometown.fans = 1000;
    s.cities.harlowFalls.fans = 10;
    t.equal(Game.rules.actions.option(s, 'evening', 'pressPush').ok, false, 'no manager: locked');
    s = withManager(s);
    t.ok(Game.rules.actions.option(s, 'evening', 'pressPush').ok, 'with a manager');
    var r = Game.rules.actions.perform(s, 'pressPush', null, null, null, null, null);
    t.equal(r.state.player.reputation, s.player.reputation + Game.balance.promotion.pressPush.reputation, '+2 reputation');
    t.ok(r.state.cities.harlowFalls.buzz > 0 && r.state.cities.hometown.buzz > 0, 'buzz in both cities with fans');
    t.equal(r.state.cities.cedarJunction.buzz, 0, 'none where you have no fans');
    t.equal(Game.rules.actions.option(r.state, 'evening', 'pressPush').ok, false, 'not again right away');
    var later = Game.util.clone(r.state);
    later.day += Game.balance.promotion.pressPush.cooldownDays;
    t.ok(Game.rules.actions.option(later, 'evening', 'pressPush').ok, 'two weeks later: ready');
  });

  // ----- Production -----

  Game.test('Production: theaters cost $1,000 on the night, arenas $5,000, festivals nothing', function (t) {
    var p = Game.balance.production;
    t.equal(Game.rules.booking.productionCost(Game.content.venues.orpheum, 'door'), p.theater, 'theater');
    t.equal(Game.rules.booking.productionCost(Game.content.venues.halstonArena, 'arena'), p.arena, 'arena');
    t.equal(Game.rules.booking.productionCost(Game.content.venues.halstonFest, 'festival'), p.festival, 'festival');
    t.equal(Game.rules.booking.productionCost(Game.content.venues.basement, 'door'), 0, 'clubs: none');
    var s = withBand(bigState(), 2);
    s.releases.push({ id: 'r1', type: 'single', songIds: [], day: 0, avgQuality: 50 });
    s = Game.rules.offers.bookShow(s, 'orpheum', s.day, 'door').state;
    var entry = s.entries[s.schedule[s.day].evening];
    var r = Game.rules.booking.playShow(s, entry, 100);
    t.equal(r.state.thisWeek.costs.production, p.theater, 'paid on the night');
  });

  // ----- The label -----

  Game.test('Label: offer at reputation 65 and 10,000 fans; advance $10,000 + $2 a fan, up to $50,000', function (t) {
    var s = bigState();
    s.player.reputation = 65;
    s.cities.hometown.fans = 9999;
    t.equal(Game.rules.label.offerCheck(s).state.inbox.length, 0, '9,999 fans: no offer');
    s.cities.hometown.fans = 15000;
    t.equal(Game.rules.label.advanceFor(s), 40000, '15,000 fans: $40,000');
    s.cities.hometown.fans = 50000;
    t.equal(Game.rules.label.advanceFor(s), Game.balance.label.advanceMax, 'capped at $50,000');
    s.cities.hometown.fans = 15000;
    s = Game.rules.label.offerCheck(s).state;
    t.equal(lastMessage(s, 'labelOffer').data.advance, 40000, 'the offer');
  });

  Game.test('Label: signing pays the advance, opens the Top studio and (with a manager) National cities', function (t) {
    var s = bigState();
    t.ok(Game.rules.recording.studioProblem(s, 'top'), 'Top studio locked');
    s = Game.rules.booking.addInbox(s, 'labelOffer', { advance: 30000 }, s.day + 7);
    var cash = s.player.cash;
    s = Game.rules.label.sign(s, s.inbox[s.inbox.length - 1].id).state;
    t.equal(s.player.cash, cash + 30000, '+$30,000');
    t.equal(s.label.owed, 30000, 'owed back from streaming');
    t.equal(Game.rules.recording.studioProblem(s, 'top'), null, 'Top studio open');
    t.equal(s.cities.newHalston.unlocked, false, 'National cities also need a manager');
    s = withManager(s);
    t.ok(s.cities.newHalston.unlocked && s.cities.kingsport.unlocked, 'with a manager: National cities open');
    t.equal(s.cities.lindenberg.unlocked, false, 'International stays locked');
  });

  Game.test('Label: keeps 80% of streaming until the advance is paid back, then it\'s all yours', function (t) {
    var s = bigState();
    s.label = { signed: true, signedDay: 0, advance: 100, owed: 100, nextOfferDay: 0 };
    t.sameContents(Game.rules.label.splitStreaming(s, 50), { yours: 10, label: 40 }, '$50: label $40, you $10');
    t.sameContents(Game.rules.label.splitStreaming(Object.assign(Game.util.clone(s), { label: { signed: true, owed: 30 } }), 50), { yours: 20, label: 30 },
      'never more than you still owe');
    s.label.owed = 0;
    t.sameContents(Game.rules.label.splitStreaming(s, 50), { yours: 50, label: 0 }, 'paid back: all yours');
  });

  // ----- Flights -----

  Game.test('Flights: National cities are 2 blocks each way and $300 a person each way (no van needed)', function (t) {
    var s = withBand(bigState(), 2);
    t.ok(Game.rules.travel.isFlight('hometown', 'newHalston'), 'a flight');
    t.equal(Game.rules.travel.legBlocks('hometown', 'newHalston'), Game.balance.travel.flight.blocks, '2 blocks');
    t.equal(Game.rules.travel.legGas('hometown', 'newHalston', s), 3 * Game.balance.travel.flight.perPersonOneWay, 'you + 2 bandmates: $900');
    s.cities.newHalston.unlocked = true;
    t.equal(Game.rules.travel.check(s, 'clubMeridian', s.day + 20).problem, null, 'a band can fly without a van');
  });

  // ----- Arenas and festivals -----

  Game.test('Arenas and festivals: offers only, from reputation 85 and 100,000 fans with a label; booked with flights', function (t) {
    var s = withBand(withManager(bigState()), 2);
    for (var i = 0; i < 12; i++) { var st = Game.rules.songs.startSong(s); s = Game.rules.songs.finishSong(st.state, st.songId).state; }
    s.player.reputation = 85;
    s.cities.hometown.fans = 50000;
    s.cities.harlowFalls.fans = 30000;
    s.cities.portEllery.fans = 25000;
    t.equal(Game.rules.bigShows.eligible(s), false, 'no label: no offers');
    s.label = { signed: true, signedDay: 0, advance: 0, owed: 0, nextOfferDay: 0 };
    s = Game.rules.progress.checkUnlocks(s).state;
    t.ok(Game.rules.bigShows.eligible(s), 'eligible');
    t.ok(Game.rules.booking.venues().every(function (v) { return v.tier < 4; }), 'arenas can\'t be emailed');
    var r = Game.rules.bigShows.roll(s, 'arena');
    var m = lastMessage(r.state, 'arenaOffer');
    t.ok(m, 'an arena offer');
    t.ok(m.data.day - s.day >= Game.balance.bigOffers.daysAhead.min, '6+ weeks out');
    t.equal(m.data.fee, Game.content.venues[m.data.venueId].deals.guarantee, 'the arena\'s flat fee');
    var booked = Game.rules.bigShows.accept(r.state, m.id, null);
    var show = Game.rules.booking.upcomingShows(booked.state)[0];
    t.equal(show.deal, 'arena', 'booked');
    t.equal(Game.rules.booking.payFor(Game.content.venues[show.venueId], 'arena', 0, show.fee), m.data.fee, 'pays the fee');
    t.ok(Object.keys(booked.state.trips).length === 1, 'with flights');

    var f = Game.rules.bigShows.roll(s, 'festival');
    var fm = lastMessage(f.state, 'festivalOffer');
    t.ok(fm.data.fee >= Game.balance.bigOffers.festivalFee.min && fm.data.fee <= Game.balance.bigOffers.festivalFee.max, 'festival fee $' + fm.data.fee);
    t.equal(Game.rules.booking.setFor(Game.content.venues[fm.data.venueId], 'festival').size, Game.balance.bigOffers.festivalSetSize, '8-song set');
  });

  // ----- Awards -----

  Game.test('Awards: nominations from this year\'s releases and new fans, with odds; a win adds reputation', function (t) {
    var a = Game.balance.awards;
    var s = bigState();
    while (!Game.rules.awards.isNominationsDay(s.day)) s.day += 1;
    t.equal(Game.rules.day.dateLabel(s.day), 'Monday, December 7', 'the first Monday of December 2026');
    var ids = Object.keys(s.songs).filter(function (id) { return !s.songs[id].isCover; });
    s.songs[ids[0]].recording = { quality: 75, day: 10, studio: 'pro' };
    s.songs[ids[1]].recording = { quality: 58, day: 10, studio: 'demo' };
    s.releases.push({ id: 'r1', type: 'single', songIds: [ids[0]], day: 100, avgQuality: 75 });
    s.releases.push({ id: 'r2', type: 'ep', songIds: [ids[1]], day: 120, avgQuality: 58 });
    s.stats.yearStartFans = 0;
    s.cities.hometown.fans = 5000;
    var noms = Game.rules.awards.nominationsFor(s);
    t.sameContents(noms.map(function (n) { return n.category; }), ['song', 'record', 'breakout'], 'all three categories');
    t.near(noms[0].chance, 0.5, 'song: (75 - 50) / 50 = 50%');
    t.near(noms[1].chance, 0.16, 'record: (58 - 50) / 50 = 16%');
    t.near(noms[2].chance, 0.25, 'breakout: 5,000 / 20,000 = 25%');
    s = Game.rules.awards.check(s).state;
    t.equal(s.awards.length, 3, 'nominated on the first Monday of December');
    t.ok(s.milestones.awards === undefined && Game.rules.progress.checkUnlocks(s).state.milestones.awards !== undefined, 'milestone 17 with the first nomination');
    s.awards.forEach(function (n) { n.chance = 1; });
    s.day = Game.rules.awards.ceremonyDayAfter(s.day);
    t.equal(Game.rules.day.dateLabel(s.day), 'Saturday, December 26', 'the last Saturday of December');
    var rep = s.player.reputation;
    var r = Game.rules.awards.check(s);
    t.ok(r.state.awards.every(function (n) { return n.won === true; }), 'all won (chance forced to 100%)');
    t.equal(r.state.player.reputation, Math.min(100, rep + 3 * a.winReputation), '+5 reputation each');
    t.ok(lastMessage(r.state, 'note').data.title.indexOf('Awards night') !== -1, 'results in the Inbox');
  });

  Game.test('Awards: last year\'s releases don\'t count, and a new year starts the new-fans count over', function (t) {
    var s = bigState();
    var ids = Object.keys(s.songs).filter(function (id) { return !s.songs[id].isCover; });
    s.songs[ids[0]].recording = { quality: 90, day: 10, studio: 'pro' };
    s.releases.push({ id: 'r1', type: 'single', songIds: [ids[0]], day: 100, avgQuality: 90 });
    var newYear = 0;
    while (!Game.rules.day.isNewYear(newYear)) newYear += 1;
    s.day = newYear + 10;
    t.equal(Game.rules.awards.nominationsFor(s).length, 0, 'a release last year: no nomination');
    s.cities.hometown.fans = 4000;
    s.day = newYear;
    t.equal(Game.rules.awards.check(s).state.stats.yearStartFans, 4000, 'a new year remembers today\'s fans');
  });

  // ----- Milestones and saving -----

  Game.test('Milestones 14 to 18: Manager, Theater, Label offer, Awards season, Arena', function (t) {
    var s = bigState();
    s.player.reputation = 60;
    s.cities.hometown.fans = 2000;
    var r = Game.rules.progress.checkUnlocks(s).state;
    t.ok(r.milestones.manager !== undefined, 'Manager at reputation 50 and 2,000 fans');
    t.equal(r.milestones.theater, undefined, 'Theater needs a release');
    s.releases.push({ id: 'r1', type: 'single', songIds: [], day: 0, avgQuality: 50 });
    t.ok(Game.rules.progress.checkUnlocks(s).state.milestones.theater !== undefined, 'Theater at reputation 60 with a release');
    s.player.reputation = 85;
    s.cities.hometown.fans = 50000;
    s.cities.harlowFalls.fans = 30000;
    s.cities.portEllery.fans = 20000;
    var top = Game.rules.progress.checkUnlocks(s).state;
    t.ok(top.milestones.labelOffer !== undefined, 'Label offer at reputation 65 and 10,000 fans');
    t.ok(top.milestones.arena !== undefined, 'Arena at reputation 85 and 100,000 fans');
  });

  Game.test('Save: a version 11 save loads with no manager, no label, and no awards', function (t) {
    var old = Game.util.clone(Game.rules.career.startCareer('Test', 'guitar', 1).state);
    old.version = 11;
    delete old.manager; delete old.label; delete old.awards; delete old.tourRequests; delete old.nextTourRequestId; delete old.stats.yearStartFans;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.version, Game.balance.save.version);
    t.equal(loaded.state.manager.hired, false, 'no manager');
    t.equal(loaded.state.label.signed, false, 'no label');
    t.sameContents(loaded.state.awards, [], 'no awards');
  });

})();
