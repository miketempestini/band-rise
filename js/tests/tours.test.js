// tours.test.js
// Tests for tours once they're booked (js/rules/tours.js): the wrap-up and its gold record, tour shirts, road mood
// by trait, the poster's details; plus auto-booking leaving a tour proposal's dates alone, available actions listed
// first in the picker, and the version tag in js/files.js.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A well-known act with a manager, a van, songs, money, and the Near and Mid cities open.
  function tourState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 60;
    s.player.reputation = 70;
    s.player.cash = 20000;
    s.player.job.status = 'none';
    s.player.gear.van = { kind: 'new', shows: 0, worn: false };
    for (var i = 0; i < 6; i++) {
      var started = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(started.state, started.songId).state;
    }
    ['harlowFalls', 'cedarJunction', 'portEllery', 'ashfordSprings'].forEach(function (id) { s.cities[id].unlocked = true; });
    s = Game.rules.booking.addInbox(s, 'managerOffer', {}, s.day + 7);
    s = Game.rules.manager.hire(s, s.inbox[s.inbox.length - 1].id).state;
    s.manager.rules.on = false; // no auto-booking unless a test turns it on
    return s;
  }

  // Asks for a 3-city tour, waits for the proposal, and accepts it. Returns the new state.
  function bookedTour(s, name) {
    s = Game.rules.manager.requestTour(s, { name: name, cities: ['harlowFalls', 'cedarJunction', 'portEllery'], tier: 1 }).state;
    s.day += Game.balance.manager.tour.planDays;
    s = Game.rules.manager.processTourRequests(s).state;
    var m = Game.rules.manager.lastMessage(s, 'tourProposal');
    return Game.rules.manager.acceptTour(s, m.id, null).state;
  }

  // Ends days until the tour's last show is behind you (or a limit). Returns { state, endedOn }.
  function playThrough(s, tour) {
    var endedOn = null;
    for (var i = 0; i < 120 && s.day <= tour.lastDay; i++) {
      var r = Game.rules.day.endDay(s);
      if (r.state.lastDayReport.tourEnded) endedOn = r.state.lastDayReport.day;
      s = r.state;
    }
    return { state: s, endedOn: endedOn };
  }

  Game.test('Tours: each booked show knows its tour, and the tour keeps its dates', function (t) {
    var s = bookedTour(tourState(), 'The Neon Highway Tour');
    var tour = s.tours[0];
    var shows = Game.rules.booking.upcomingShows(s).filter(function (e) { return e.tourId === tour.id; });
    t.equal(shows.length, 3, '3 shows carry the tour id');
    t.equal(tour.dates.length, 3, 'the tour keeps its 3 dates');
    t.equal(tour.result, null, 'no wrap-up yet');
    t.equal(Game.rules.tours.status(s, tour), 'ahead', 'coming up');
  });

  Game.test('Tour wrap-up: saved when the last show is played, its totals match the shows, and a gold record means it made money', function (t) {
    var s = bookedTour(tourState(), 'Wrap Test');
    var tour = s.tours[0];
    var r = playThrough(s, tour);
    s = r.state;
    tour = s.tours[0];
    t.equal(r.endedOn, tour.lastDay, 'it ends on the last show\'s day');
    t.ok(!!tour.result, 'the wrap-up is saved on the tour');
    var shows = s.finances.shows.filter(function (x) { return x.tourId === tour.id; });
    t.equal(tour.result.shows, shows.length, 'shows played');
    t.equal(tour.result.crowd, shows.reduce(function (a, x) { return a + x.crowd; }, 0), 'total crowd');
    var made = tour.result.yourPay + tour.result.merch - tour.result.production - tour.result.travel;
    t.equal(tour.result.net, made, 'net = pay + merch - production - travel');
    t.equal(tour.result.profit, tour.result.net > 0, 'gold record only when it made money');
    t.ok(tour.result.fansByCity.length > 0 && tour.result.best !== null, 'fans per city and the best night');
    t.equal(Game.rules.tours.status(s, tour), 'done');
  });

  Game.test('Tour wrap-up: a tour that lost money gets no gold record', function (t) {
    var s = tourState();
    s.tours.push({ id: 'tourX', name: 'Loss Tour', cities: ['harlowFalls'], dates: [], firstDay: 0, lastDay: 0, shows: 1, result: null });
    s.finances.shows.push({ day: 0, venueId: 'cornerTap', deal: 'door', gross: 100, managerCut: 0, memberPay: {}, yourPay: 50, tips: 0, yourTips: 0,
      merch: 0, production: 0, tripId: 'tripX', tour: true, tourName: 'Loss Tour', tourId: 'tourX', crowd: 20, result: 'rough', fans: 2 });
    s.finances.entries.push({ day: 0, flow: 'out', cat: 'travel', amount: 300, tripId: 'tripX' });
    var w = Game.rules.tours.wrapUp(s, 'tourX');
    t.equal(w.net, -250, '$50 pay - $300 travel');
    t.equal(w.profit, false, 'no gold record');
  });

  Game.test('Tour shirts: in the Shop while a tour is coming up; they sell better on that tour, and leftovers drop to $10 after it', function (t) {
    var ts = Game.balance.merch.tourShirt;
    var none = tourState();
    t.equal(Game.rules.merch.tourShirtItems(none).length, 0, 'no tour: none in the Shop');
    var s = bookedTour(tourState(), 'Shirt Tour');
    var tour = s.tours[0];
    t.equal(Game.rules.merch.tourShirtItems(s).length, 1, 'a tour coming up: tour shirts in the Shop');
    var cash = s.player.cash;
    s = Game.rules.merch.buy(s, 'tourShirts').state;
    t.equal(s.player.cash, cash - ts.packCost, 'paid $' + ts.packCost);
    t.sameContents(s.tourMerch, { tourId: tour.id, count: ts.packSize }, 'stocked for this tour');
    t.equal(Game.rules.tours.shirtSale(s, null), null, 'saved for the tour: not sold at other shows before it');
    var on = Game.rules.tours.shirtSale(s, tour.id);
    t.equal(on.price, ts.tourPrice, '$' + ts.tourPrice + ' on the tour');
    t.equal(on.boost, ts.buyBoost, 'more likely to sell');
    var crowd = 400;
    var sold = Game.rules.merch.sellAtGig(s, crowd, 'great', 'theDepot', tour.id);
    t.ok(sold.sold.tourShirts > 0, 'sold ' + sold.sold.tourShirts + ' at a tour show');
    var after = Game.util.clone(s);
    after.tours[0].result = Game.rules.tours.wrapUp(after, tour.id);
    t.equal(Game.rules.tours.shirtSale(after, null).price, ts.leftoverPrice, 'after the tour: $' + ts.leftoverPrice + ' leftovers');
  });

  Game.test('Road mood: Party Animals love the road, Easygoing ones miss home from the 4th night, others tire from the 8th', function (t) {
    var rm = Game.balance.traits.roadMood;
    var s = tourState();
    var ids = [];
    ['partyAnimal', 'easygoing', 'workhorse'].forEach(function (trait) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      s.people[met.personId].relationship = 60; s.people[met.personId].skill = 40; s.people[met.personId].trait = trait;
      s = Game.rules.people.invite(s, met.personId).state;
      s.people[met.personId].satisfaction = 50;
      ids.push(met.personId);
    });
    for (var night = 1; night <= 10; night++) s = Game.rules.tours.roadMood(s, night).state;
    t.equal(s.people[ids[0]].satisfaction, 50 + 10 * rm.partyAnimal, 'Party Animal: +' + rm.partyAnimal + ' every night');
    t.equal(s.people[ids[1]].satisfaction, 50 + (10 - rm.easygoingFromNight + 1) * rm.easygoing, 'Easygoing: from the 4th night');
    t.equal(s.people[ids[2]].satisfaction, 50 + (10 - rm.othersFromNight + 1) * rm.others, 'Workhorse: from the 8th night');
    var reasons = s.people[ids[0]].satisfactionReasons.filter(function (r) { return r.text === 'Loves the road'; });
    t.equal(reasons.length, 1, 'one line on the People screen, added up');
    t.equal(reasons[0].amount, 10 * rm.partyAnimal);
  });

  Game.test('Tour poster: the band, the tour name, and every date with its city and venue, in order', function (t) {
    var s = bookedTour(tourState(), 'Poster Tour');
    s.band.name = 'The Velvet Static';
    var d = Game.rules.tours.posterData(s, s.tours[0].id);
    t.equal(d.band, 'The Velvet Static');
    t.equal(d.title, 'Poster Tour');
    t.equal(d.rows.length, 3, '3 dates');
    t.ok(d.rows.every(function (r, i) { return i === 0 || r.day > d.rows[i - 1].day; }), 'in date order');
  });

  Game.test('Auto-booking leaves an open tour proposal\'s dates alone (with room for the drives)', function (t) {
    var gap = Game.balance.manager.tour.autoBookGapDays;
    var s = tourState();
    s = Game.rules.manager.requestTour(s, { cities: ['harlowFalls', 'cedarJunction', 'portEllery'], tier: 1 }).state;
    s.day += Game.balance.manager.tour.planDays;
    s = Game.rules.manager.processTourRequests(s).state;
    var m = Game.rules.manager.lastMessage(s, 'tourProposal');
    var days = m.data.shows.map(function (x) { return x.day; });
    var from = Math.min.apply(null, days) - gap, to = Math.max.apply(null, days) + gap;
    var hold = Game.rules.manager.tourHoldDays(s);
    t.ok(hold[from] && hold[to] && !hold[from - 1] && !hold[to + 1], 'held: ' + from + ' to ' + to);
    s.manager.rules = { on: true, cities: ['hometown', 'harlowFalls', 'cedarJunction', 'portEllery'], tiers: [1], nights: [0, 1, 2, 3, 4, 5, 6], maxPerWeek: 5 };
    while (Game.rules.day.dayOfWeek(s.day) !== 0) s.day += 1;
    var booked = Game.rules.manager.autoBook(s).state;
    var sent = Object.keys(booked.requests).map(function (id) { return booked.requests[id]; }).filter(function (r) { return r.byManager; });
    t.ok(sent.every(function (r) { return r.gigDay < from || r.gigDay > to; }), 'no request lands on the tour (' + sent.length + ' sent elsewhere)');
    t.equal(Game.rules.manager.tourAcceptProblem(booked, m.id, null), null, 'the tour can still be accepted');
  });

  Game.test('Action picker: actions you can do now come first, the ones you can\'t at the bottom', function (t) {
    if (!Game.ui || !Game.ui.actionPicker) { t.ok(true, 'screens not loaded'); return; }
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.cash = 0; // some actions cost money, so some can't be done
    var html = Game.ui.actionPicker.actionListHtml(s, 'evening');
    var box = document.createElement('div');
    box.innerHTML = html;
    var disabled = Array.prototype.map.call(box.querySelectorAll('.pick'), function (b) { return b.disabled; });
    var firstOff = disabled.indexOf(true);
    t.ok(firstOff > 0, 'some available, some not');
    t.ok(disabled.slice(firstOff).every(function (d) { return d; }), 'every unavailable one is after every available one');
  });

  Game.test('Version tag: js/files.js starts with the current save version, so a save change also changes the tag', function (t) {
    t.ok(Game.files && Game.files.tag.indexOf('v' + Game.balance.save.version + '-') === 0,
      'tag ' + (Game.files && Game.files.tag) + ' should start with v' + Game.balance.save.version + '-');
  });

})();
