// finances.test.js
// Tests for the Finances screen's records (js/rules/finances.js): cash in and out, loans, band show money
// (ticket sales, the manager, each bandmate), bandmates' travel shares, the label's cut, periods, pruning,
// trips and tours in the show list, the weekly chart, and the top earners and costs.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var F = function () { return Game.rules.finances; };

  function freshState() {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.morale = 50;
    for (var i = 0; i < 6; i++) { var st = Game.rules.songs.startSong(s); s = Game.rules.songs.finishSong(st.state, st.songId).state; }
    return s;
  }

  // Adds easygoing bandmates. Returns { state, ids }.
  function withBand(s, count) {
    var ids = [];
    s.player.reputation = Math.max(s.player.reputation, 40);
    for (var i = 0; i < count; i++) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      s.people[met.personId].relationship = 60; s.people[met.personId].skill = 40; s.people[met.personId].trait = 'easygoing';
      s = Game.rules.people.invite(s, met.personId).state;
      ids.push(met.personId);
    }
    return { state: s, ids: ids };
  }

  Game.test('Finances: every dollar in and out of your cash is recorded; loans are money in, paying back is money out', function (t) {
    var s = freshState();
    s = Game.rules.money.earn(s, 110, 'dayJob').state;
    s = Game.rules.money.spend(s, 400, 'bills').state;
    s = Game.rules.money.spend(s, s.player.cash + 50, 'studio').state; // needs a loan
    s = Game.rules.money.payBack(s, 200).state;
    var sum = F().summary(s, 7);
    var amount = function (rows, key) { return (rows.filter(function (r) { return r.key === key; })[0] || { amount: 0 }).amount; };
    t.equal(amount(sum.yourIn, 'dayJob'), 110, 'day job in');
    t.equal(amount(sum.yourIn, 'loans'), Game.balance.debt.familyLoanAmount, 'the loan is money in');
    t.equal(amount(sum.yourOut, 'bills'), 400, 'bills out');
    t.equal(amount(sum.yourOut, 'paidBack'), 200, 'paying back is money out');
    t.equal(sum.net, sum.totalIn - sum.totalOut, 'net = in - out');
  });

  Game.test('Finances: a show records ticket sales, the manager, each bandmate by name, and you', function (t) {
    var band = withBand(freshState(), 2);
    var s = band.state;
    s = Game.rules.booking.addInbox(s, 'managerOffer', {}, s.day + 7);
    s = Game.rules.manager.hire(s, s.inbox[s.inbox.length - 1].id).state;
    s.debug.forceNextGig = 'solid';
    var r = Game.rules.gigs.playGig(s, 'backRoom', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'door' });
    var sum = F().summary(r.state, 7);
    var b = sum.band;
    var memberTotal = b.members.reduce(function (t2, m) { return t2 + m.amount; }, 0);
    t.ok(b.ticketSales > 0, 'ticket sales $' + b.ticketSales);
    t.equal(b.members.length, 2, 'both bandmates');
    t.ok(b.members.every(function (m) { return m.name === r.state.people[m.personId].name; }), 'by name');
    t.ok(Math.abs(b.ticketSales - (b.managerPay + memberTotal + b.yourPay)) <= 2, 'ticket sales = manager + band + you (give or take rounding)');
    var show = r.state.finances.shows[r.state.finances.shows.length - 1];
    t.equal(show.venueId, 'backRoom', 'a show record');
    t.equal(show.yourPay, b.yourPay, 'with your pay');
  });

  Game.test('Finances: bandmates\' part of gas and hotels and the label\'s cut of streaming are recorded', function (t) {
    var band = withBand(freshState(), 3);
    var s = band.state;
    s = Game.rules.travel.addShow(s, 'copperPint', 12, 'door', null).state;
    s.day = 12;
    var leg = s.entries[s.schedule[12].afternoon];
    s = Game.rules.travel.travelBlock(s, leg, 100).state;
    s = Game.rules.travel.nightly(s).state;
    var covered = F().summary(s, 7).band.travelCovered;
    t.equal(covered.length, 3, 'each bandmate');
    var gas = Game.rules.travel.legGas('hometown', 'harlowFalls', s);
    t.equal(covered.reduce(function (t2, m) { return t2 + m.amount; }, 0), Math.round(gas * 0.75) + Math.round(Game.balance.travel.hotelPerNight * 0.75),
      'they covered 3 of 4 shares of gas and the hotel');
    t.ok(s.finances.entries.filter(function (e) { return e.flow === 'out' && e.cat === 'travel'; }).every(function (e) { return e.tripId; }), 'your travel costs know their trip');

    var l = freshState();
    var ids = Object.keys(l.songs).filter(function (id) { return !l.songs[id].isCover; });
    l.songs[ids[0]].recording = { quality: 100, day: 0, studio: 'pro' };
    l.releases.push({ id: 'r1', type: 'single', songIds: [ids[0]], day: 0, avgQuality: 100 });
    l.cities.hometown.fans = 10000;
    l.day = 6;
    l.label = { signed: true, signedDay: 0, advance: 1000, owed: 1000, nextOfferDay: 0 };
    var paid = Game.rules.recording.payStreaming(l).state;
    t.equal(F().summary(paid, 7).band.labelKept, 1000 - paid.label.owed, 'the label\'s cut');
  });

  Game.test('Finances: periods filter by days, and records older than 92 days are dropped', function (t) {
    var s = freshState();
    s = Game.rules.money.earn(s, 100, 'dayJob').state;
    s.day = 20;
    s = Game.rules.money.earn(s, 50, 'tips').state;
    t.equal(F().summary(s, 7).totalIn, 50, 'last week: only the recent $50');
    t.equal(F().summary(s, 30).totalIn, 150, 'last month: both');
    s.day = 20 + Game.balance.finances.keepDays + 1;
    var pruned = F().prune(s).state;
    t.equal(pruned.finances.entries.length, 0, 'old records dropped');
    t.equal(F().prune(pruned).state, pruned, 'nothing to drop: the same state');
  });

  Game.test('Finances: the show list groups a trip\'s shows with its travel, and nets each one', function (t) {
    var s = freshState();
    s.player.reputation = 30;
    s = Game.rules.progress.checkUnlocks(s).state;
    s = Game.rules.travel.addShow(s, 'copperPint', 12, 'door', null).state;
    s = Game.rules.travel.addShow(s, 'railyardTavern', 13, 'door', null).state;
    for (var d = 0; d < 15; d++) { s.pendingEvent = null; s = Game.rules.day.endDay(s).state; }
    var groups = F().showList(s, 30);
    var trip = groups.filter(function (g) { return g.tripId; })[0];
    t.ok(trip, 'a trip group');
    t.equal(trip.shows.length, 2, 'both shows in it');
    t.ok(trip.travel > 0, 'its travel: $' + trip.travel);
    var showsNet = trip.shows.reduce(function (t2, x) { return t2 + x.net; }, 0);
    t.equal(trip.net, showsNet - trip.travel, 'trip net = shows - travel');
  });

  Game.test('Finances: the weekly chart has the last 13 weeks, and top earners add up to 100%', function (t) {
    var s = freshState();
    for (var d = 0; d < 21; d++) { s.pendingEvent = null; s = Game.rules.day.endDay(s).state; }
    var weeks = F().weekly(s, Game.balance.finances.chartWeeks);
    t.equal(weeks.length, 4, '3 finished weeks + this week so far (only 4 so far)');
    t.ok(weeks[weeks.length - 1].current, 'the last is this week');
    t.equal(weeks[0].in, Game.rules.money.weekTotals(s.ledger[0]).totalIn, 'from the ledger');
    var top = F().top(s, 30);
    var allIn = F().summary(s, 30);
    if (allIn.yourIn.length <= Game.balance.finances.topCount) {
      t.near(top.earnings.reduce(function (t2, r) { return t2 + r.share; }, 0), 1, 'earnings shares add up to 100%');
    }
    t.ok(top.costs.every(function (r, i) { return i === 0 || r.amount <= top.costs[i - 1].amount; }), 'biggest first');
  });

  Game.test('Save: a version 14 save loads with empty finances', function (t) {
    var old = Game.util.clone(freshState());
    old.version = 14;
    delete old.finances;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.sameContents(loaded.state.finances, { entries: [], shows: [] }, 'empty');
  });

})();
