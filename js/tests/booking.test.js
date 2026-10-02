// booking.test.js
// Tests for venues, booking, the inbox, booked shows, cancellations, and session players (js/rules/booking.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A career that can book small rooms: reputation 12, Networking 9, plus one original (6 songs).
  function bookable(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.reputation = 12;
    s.player.skills.networking = 9;
    s.player.morale = 50;
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    return s;
  }

  // Sends a request and gets a forced "yes" into the inbox. Returns { state, messageId }.
  function yesOffer(s, venueId, gigDay, deal) {
    s = Game.rules.booking.sendRequest(s, venueId, gigDay, deal).state;
    s.debug.acceptNextBooking = true;
    s = Game.rules.debug.replyNow(s).state;
    var m = s.inbox[s.inbox.length - 1];
    return { state: s, messageId: m.id };
  }

  // Books a show and returns { state, entryId }.
  function booked(s, venueId, gigDay, deal) {
    var offer = yesOffer(s, venueId, gigDay, deal);
    var r = Game.rules.booking.acceptOffer(offer.state, offer.messageId, null);
    return { state: r.state, entryId: r.entryId };
  }

  Game.test('Booking odds: reputation 12 for a room that needs 10, Networking 9 is about 58%', function (t) {
    var s = bookable();
    var chance = Game.rules.booking.acceptanceChance(s, Game.content.venues.backRoom, 'guarantee');
    t.near(chance, 0.5825, '50% + 6% + 2.25%');
    s.player.reputation = 0;
    t.near(Game.rules.booking.acceptanceChance(s, Game.content.venues.backRoom, 'guarantee'), 0.2225, 'lower reputation');
    s.player.reputation = 100;
    t.near(Game.rules.booking.acceptanceChance(s, Game.content.venues.backRoom, 'guarantee'), 0.95, 'never above 95%');
  });

  Game.test('Booking: requirements, the 7-14 day window, and one open request per venue', function (t) {
    var s = bookable();
    s.player.reputation = 9;
    t.ok(Game.rules.booking.requestProblem(s, 'backRoom', s.day + 7, 'guarantee'), 'reputation 9: small rooms locked');
    s.player.reputation = 12;
    t.ok(Game.rules.booking.requestProblem(s, 'backRoom', s.day + 6, 'guarantee'), '6 days out: too soon');
    t.ok(Game.rules.booking.requestProblem(s, 'backRoom', s.day + 15, 'guarantee'), '15 days out: too far');
    t.equal(Game.rules.booking.requestProblem(s, 'backRoom', s.day + 10, 'guarantee'), null, '10 days out: OK');
    s = Game.rules.booking.sendRequest(s, 'backRoom', s.day + 10, 'guarantee').state;
    t.ok(Game.rules.booking.requestProblem(s, 'backRoom', s.day + 11, 'door'), 'second request to the same venue refused');
    t.ok(Game.rules.booking.requestProblem(s, 'basement', s.day + 20, 'guarantee'), 'clubs are locked');
  });

  Game.test('Booking: the reply comes 1 to 3 days later, as an offer that expires', function (t) {
    var s = bookable(4);
    s = Game.rules.booking.sendRequest(s, 'backRoom', s.day + 10, 'guarantee').state;
    var req = s.requests[Object.keys(s.requests)[0]];
    t.ok(req.replyDay - s.day >= 1 && req.replyDay - s.day <= 3, 'reply in ' + (req.replyDay - s.day) + ' days');
    s.debug.acceptNextBooking = true;
    for (var i = 0; i < 3; i++) s = Game.rules.day.endDay(s).state;
    var m = s.inbox[0];
    t.ok(m && m.data.yes, 'yes in the inbox');
    t.ok(Game.rules.booking.unreadCount(s) >= 1, 'counts as unread');
    t.equal(s.venues.backRoom.pendingRequestId, null, 'venue free for a new request');
    for (var j = 0; j < 4; j++) s = Game.rules.day.endDay(s).state;
    t.equal(s.inbox[0].resolved, 'expired', 'expired after 3 days unanswered');
  });

  Game.test('Booking: accepting puts the show on the calendar with a suggested setlist', function (t) {
    var s = bookable();
    var b = booked(s, 'backRoom', s.day + 10, 'guarantee');
    var e = b.state.entries[b.entryId];
    t.equal(e.type, 'gig');
    t.equal(e.block, 'evening');
    t.equal(e.songIds.length, 6, 'small room: 6 songs');
    t.equal(b.state.schedule[s.day + 10].evening, b.entryId, 'on the calendar');
    t.ok(Game.rules.booking.blockTaken(b.state, s.day + 10, 'evening'), 'that block is now taken');
  });

  Game.test('Pay: guarantee is flat; door is crowd x ticket x share; cover night is $50', function (t) {
    var room = Game.content.venues.backRoom;
    t.equal(Game.rules.booking.payFor(room, 'guarantee', 3), 100, 'guarantee: $100 whoever shows');
    t.equal(Game.rules.booking.payFor(room, 'door', 30), Math.round(30 * 8 * 0.7), '30 people x $8 x 70% = $168');
    t.equal(Game.rules.booking.payFor(room, 'coverNight', 5), 50, 'cover night $50');
    t.equal(Game.rules.booking.payFor(Game.content.venues.hollowRecords, 'inStore', 40), 0, 'in-store pays nothing');
  });

  Game.test('Pay split: gig pay is shared equally with the band (a Diva takes 1.5 shares)', function (t) {
    var s = bookable();
    var met = Game.rules.people.meet(s);
    s = met.state;
    s.people[met.personId].relationship = 60;
    s.people[met.personId].skill = 20;
    s.people[met.personId].trait = 'easygoing';
    s = Game.rules.people.invite(s, met.personId).state;
    var show = booked(s, 'backRoom', s.day + 10, 'guarantee');
    var e = show.state.entries[show.entryId];
    var before = show.state.player.cash;
    show.state.day = e.day;
    var r = Game.rules.gigs.playGig(show.state, 'backRoom', e.songIds, 100, { deal: 'guarantee' });
    t.equal(r.gig.rewards.pay, 100, 'the show paid $100');
    t.equal(r.state.player.cash - before, 50 + r.gig.rewards.yourTips, 'you keep half: $50');
    t.equal(r.state.people[met.personId].week.earned, 50, 'bandmate earned $50 (counts for satisfaction)');
    r.state.people[met.personId].trait = 'diva';
    t.near(Game.rules.people.payShares(r.state).yourShare, 0.4, 'with a Diva: your share 1 of 2.5');
  });

  Game.test('Booked shows: room over 80% full +5, under 25% full -5, crowd never over capacity', function (t) {
    var s = bookable(3);
    s.cities.hometown.fans = 2000; // a huge crowd for a 45-person room
    var r = Game.rules.gigs.playGig(s, 'cornerTap', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'door' });
    t.equal(r.gig.crowd, 45, 'capped at 45');
    var part = function (gig) { return gig.parts.filter(function (p) { return p.id === 'room'; })[0].value; };
    t.equal(part(r.gig), 5, 'packed room +5');
    var empty = bookable(3);
    empty.cities.hometown.fans = 0;
    var r2 = Game.rules.gigs.playGig(empty, 'backRoom', Game.rules.gigs.suggestSet(empty, 6), 100, { deal: 'door' });
    t.ok(r2.gig.crowd < 15, 'about 15 people in a 60 room (' + r2.gig.crowd + ')');
    t.equal(part(r2.gig), -5, 'under 25% full -5');
  });

  Game.test('Booked shows: venue relationship +5 after Solid or better, -10 after Rough', function (t) {
    var s = bookable();
    s.debug.forceNextGig = 'great';
    var r = Game.rules.gigs.playGig(s, 'backRoom', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'guarantee' });
    t.equal(r.state.venues.backRoom.relationship, 5);
    r.state.debug.forceNextGig = 'rough';
    var r2 = Game.rules.gigs.playGig(r.state, 'backRoom', Game.rules.gigs.suggestSet(r.state, 6), 100, { deal: 'guarantee' });
    t.equal(r2.state.venues.backRoom.relationship, -5);
  });

  Game.test('Booked shows play at End Day and pay out', function (t) {
    var s = bookable(5);
    var show = booked(s, 'backRoom', s.day + 7, 'guarantee');
    s = show.state;
    for (var i = 0; i < 7; i++) s = Game.rules.day.endDay(s).state;
    var cash = s.player.cash;
    var r = Game.rules.day.endDay(s).state;
    t.ok(r.lastDayReport.gig, 'the show was played');
    t.equal(r.lastGig.venueName, 'The Back Room');
    t.equal(r.thisWeek.income.gigPay, 100, 'paid $100 as gig pay');
    t.ok(!r.entries[show.entryId], 'off the calendar after');
  });

  Game.test('Cancelling: 7+ days ahead costs venue -10 only; under 7 days also costs reputation and band', function (t) {
    var s = bookable();
    var early = booked(s, 'backRoom', s.day + 10, 'guarantee');
    var r = Game.rules.booking.cancelShow(early.state, early.entryId).state;
    t.equal(r.venues.backRoom.relationship, -10, 'venue -10');
    t.equal(r.player.reputation, 12, 'reputation unchanged');
    t.equal(r.player.morale, early.state.player.morale - 5, 'morale -5');
    t.ok(!r.entries[early.entryId], 'off the calendar');

    var late = booked(s, 'backRoom', s.day + 10, 'guarantee');
    late.state.day += 5; // now only 5 days ahead
    var r2 = Game.rules.booking.cancelShow(late.state, late.entryId).state;
    t.equal(r2.venues.backRoom.relationship, -20, 'venue -20');
    t.equal(r2.player.reputation, 9, 'reputation -3');
  });

  Game.test('No-show: at 0 energy the show is missed: venue -40 and banned, reputation -8, band -10', function (t) {
    var s = bookable();
    var met = Game.rules.people.meet(s);
    s = met.state;
    s.people[met.personId].relationship = 60;
    s.people[met.personId].skill = 20;
    s = Game.rules.people.invite(s, met.personId).state;
    var show = booked(s, 'backRoom', s.day + 10, 'guarantee');
    var r = Game.rules.booking.playShow(show.state, show.state.entries[show.entryId], 0);
    t.ok(r.noShow, 'no-show');
    t.equal(r.state.venues.backRoom.relationship, -40, 'venue -40');
    t.equal(r.state.venues.backRoom.bannedUntilDay, show.state.day + 60, 'banned 60 days');
    t.equal(r.state.player.reputation, 4, 'reputation -8');
    t.equal(r.state.people[met.personId].satisfaction, 60, 'bandmate -10');
    t.ok(Game.rules.booking.requestProblem(r.state, 'backRoom', r.state.day + 10, 'guarantee').indexOf('won\'t book') !== -1, 'can\'t book while banned');
  });

  Game.test('Cover nights: need reputation 5 and Musicianship 25, pay $50, and are covers only', function (t) {
    var s = bookable();
    s.player.reputation = 5;
    s.player.skills.musicianship = 24;
    t.ok(Game.rules.booking.requestProblem(s, 'cornerTap', s.day + 8, 'coverNight'), 'Musicianship 24: locked');
    s.player.skills.musicianship = 25;
    t.equal(Game.rules.booking.requestProblem(s, 'cornerTap', s.day + 8, 'coverNight'), null, 'unlocked before small rooms');
    t.ok(Game.rules.booking.requestProblem(s, 'cornerTap', s.day + 8, 'guarantee'), 'regular shows still need 10');
    var show = booked(s, 'cornerTap', s.day + 8, 'coverNight');
    var e = show.state.entries[show.entryId];
    t.equal(e.songIds.length, 5, '5 songs');
    t.ok(e.songIds.every(function (id) { return show.state.songs[id].isCover; }), 'all covers');
    var original = Object.keys(show.state.songs).filter(function (id) { return !show.state.songs[id].isCover; })[0];
    t.ok(Game.rules.booking.setSetlist(show.state, show.entryId, e.songIds.slice(0, 4).concat([original])).log.length > 0, 'an original is refused');
  });

  Game.test('Session players: $75 each, count as skill 40 and tightness 50, refunded if let go', function (t) {
    var s = bookable();
    var show = booked(s, 'backRoom', s.day + 10, 'guarantee');
    var cash = show.state.player.cash;
    var r = Game.rules.booking.changeSessionPlayers(show.state, show.entryId, 1).state;
    t.equal(r.player.cash, cash - 75, '$75');
    t.equal(r.entries[show.entryId].sessionPlayers, 1);
    t.near(Game.rules.people.bandMusicianship(r, 1), (20 * 2 + 40) / 3, 'band musicianship with a session player');
    var songs = [{ tightness: 80 }];
    t.near(Game.rules.gigs.effectiveTightness(r, songs, 1), 65, 'tightness pulled toward 50: (80 + 50) / 2');
    var back = Game.rules.booking.changeSessionPlayers(r, show.entryId, -1).state;
    t.equal(back.player.cash, cash, 'refunded');
  });

  Game.test('Small rooms unlocked: a banner appears once when reputation reaches 10', function (t) {
    var s = bookable();
    s.player.reputation = 9;
    s.milestones = {};
    s.toasts = [];
    s = Game.rules.progress.checkUnlocks(s).state;
    t.ok(!s.milestones.smallRooms, 'not at 9');
    s.player.reputation = 10;
    s = Game.rules.progress.checkUnlocks(s).state;
    t.ok(s.toasts.some(function (x) { return x.id === 'smallRooms'; }), 'banner queued');
    s = Game.rules.progress.dismissToast(s, 'smallRooms').state;
    s = Game.rules.progress.checkUnlocks(s).state;
    t.ok(!s.toasts.some(function (x) { return x.id === 'smallRooms'; }), 'only once');
  });

  Game.test('Booking: the picker can\'t overwrite a booked show', function (t) {
    var s = bookable();
    var show = booked(s, 'backRoom', s.day + 7, 'guarantee');
    var st = show.state;
    st.day += 7;
    t.equal(Game.rules.actions.option(st, 'evening', 'rest').ok, false, 'block is taken');
    t.ok(Game.rules.actions.clear(st, 'evening').log.length > 0, 'clear refuses');
    t.equal(Game.rules.actions.dayPlan(st)[2].kind, 'gig', 'shows on Today as a show');
  });

  Game.test('Save: a version 5 save (Phase 5) upgrades with venues, requests, and job days off', function (t) {
    var old = Game.util.clone(bookable());
    old.version = 5;
    delete old.requests; delete old.toasts; delete old.nextRequestId; delete old.nextInboxId;
    old.venues = {};
    delete old.player.job.daysOff; delete old.player.job.startsDay;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.venues.backRoom.relationship, 0, 'venues added');
    t.sameContents(loaded.state.player.job.daysOff, {}, 'days off added');
  });

})();
