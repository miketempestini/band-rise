// band.test.js
// Tests for a bigger band, clubs, co-writing, opening slots, residency contracts, and band-life events.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    s.player.reputation = 40; // enough to invite good players
    return s;
  }

  // Adds bandmates with chosen traits. Returns { state, ids }.
  function withBand(traits, seed) {
    var s = freshState(seed);
    var ids = [];
    traits.forEach(function (trait) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      var p = s.people[met.personId];
      p.relationship = 60; p.skill = 40; p.trait = trait; p.reliability = 100; p.ambition = 50;
      s = Game.rules.people.invite(s, met.personId).state;
      ids.push(met.personId);
    });
    return { state: s, ids: ids };
  }

  // Enough songs for any set: 10 originals.
  function withSongs(s, count) {
    for (var i = 0; i < count; i++) {
      var st = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(st.state, st.songId).state;
    }
    return s;
  }

  Game.test('Bigger band: up to 4 members besides you; a 5th is refused', function (t) {
    var band = withBand(['easygoing', 'easygoing', 'easygoing', 'easygoing']);
    t.equal(band.state.band.memberIds.length, 4, '4 members');
    var met = Game.rules.people.meet(band.state);
    met.state.people[met.personId].relationship = 60;
    t.ok(Game.rules.people.inviteProblem(met.state, met.personId).indexOf('full') !== -1, 'band full');
  });

  Game.test('Bigger band: clashes count between every pair', function (t) {
    var band = withBand(['diva', 'diva', 'workhorse', 'flaky']);
    var s = band.state;
    t.equal(Game.rules.people.clashCount(s, s.people[band.ids[0]]), 1, 'Diva clashes with the other Diva');
    t.equal(Game.rules.people.clashCount(s, s.people[band.ids[2]]), 1, 'Workhorse clashes with Flaky');
    t.equal(Game.rules.people.clashCount(s, s.people[band.ids[3]]), 1, 'Flaky clashes with Workhorse');
  });

  Game.test('Milestone 9: Full band at 3 on stage', function (t) {
    var two = withBand(['easygoing']);
    t.equal(Game.rules.progress.checkUnlocks(two.state).state.milestones.fullBand, undefined, '2 on stage: not yet');
    var three = withBand(['easygoing', 'easygoing']);
    t.ok(Game.rules.progress.checkUnlocks(three.state).state.milestones.fullBand !== undefined, '3 on stage: Full band');
  });

  Game.test('Clubs: need reputation 30 and 3 in the band (session players don\'t count for booking); 10-song sets', function (t) {
    var duo = withBand(['easygoing']);
    var s = withSongs(duo.state, 10);
    s.player.reputation = 30;
    t.ok(Game.rules.booking.requestProblem(s, 'basement', s.day + 20, 'guarantee').indexOf('on stage') !== -1, 'a duo can\'t book a club');
    var trio = withBand(['easygoing', 'easygoing']);
    var t3 = withSongs(trio.state, 10);
    t3.player.reputation = 29;
    t.ok(Game.rules.booking.requestProblem(t3, 'basement', t3.day + 20, 'guarantee'), 'reputation 29: locked');
    t3.player.reputation = 30;
    t.equal(Game.rules.booking.requestProblem(t3, 'basement', t3.day + 20, 'guarantee'), null, 'trio at reputation 30: OK');
    t.equal(Game.rules.booking.setFor(Game.content.venues.basement, 'guarantee').size, 10, '10-song set');
  });

  Game.test('Clubs: on the night you need 3 on stage; session players can cover a missing member', function (t) {
    var trio = withBand(['easygoing', 'easygoing']);
    var s = withSongs(trio.state, 10);
    var booked = Game.rules.offers.bookShow(s, 'basement', s.day + 20, 'guarantee');
    s = booked.state;
    var entry = s.entries[booked.entryId];
    t.equal(Game.rules.booking.noShowReason(s, entry, 100), null, 'full trio: plays');
    s = Game.rules.people.leaveBand(s, trio.ids[0]);
    t.ok(Game.rules.booking.noShowReason(s, entry, 100), 'a member left: no-show');
    entry.sessionPlayers = 1;
    t.equal(Game.rules.booking.noShowReason(s, entry, 100), null, 'a session player covers');
  });

  Game.test('Co-writing: needs relationship 40, adds their skill / 10 to progress and to quality', function (t) {
    var band = withBand(['easygoing']);
    var s = band.state;
    var id = band.ids[0];
    s.people[id].relationship = 39;
    t.ok(Game.rules.actions.plan(s, 'evening', 'write', id).log[0].indexOf('relationship 40') !== -1, 'relationship 39 refused');
    s.people[id].relationship = 40;
    s.people[id].skill = 50;
    var alone = Game.rules.songs.write(s, 10).added;
    var together = Game.rules.songs.write(s, 10, id).added;
    t.near(together - alone, 5, '+50 / 10 progress');
    var w = Game.rules.songs.write(s, 10, id);
    var st = w.state;
    var song = Game.rules.songs.inProgress(st);
    var done = Game.rules.songs.finishSong(st, song.id).state;
    t.equal(done.songs[song.id].qualityParts.coWriter, 5, 'quality +5');
    t.equal(done.songs[song.id].qualityParts.coWriterName, s.people[id].name);
  });

  Game.test('Opening slots: odds rise with reputation and Networking', function (t) {
    var s = freshState();
    s.player.reputation = 9;
    t.equal(Game.rules.offers.openingChance(s), 0, 'below reputation 10: none');
    s.player.reputation = 20;
    s.player.skills.networking = 20;
    t.near(Game.rules.offers.openingChance(s), 0.025, 'reputation 20, Networking 20: 2.5% a day');
    s.player.reputation = 40;
    s.player.skills.networking = 40;
    t.near(Game.rules.offers.openingChance(s), 0.04, '40 / 40: 4%');
  });

  Game.test('Opening slots: the headliner\'s crowd, half-rate fans, the agreed fee, a 6-song set', function (t) {
    var s = withSongs(freshState(), 3);
    s = Game.rules.booking.addInbox(s, 'opening', { venueId: 'basement', day: s.day + 5, fee: 100 }, s.day + 2);
    var accepted = Game.rules.offers.acceptOpening(s, s.inbox[0].id);
    var entryId = accepted.state.schedule[s.day + 5].evening;
    var entry = accepted.state.entries[entryId];
    t.equal(entry.deal, 'opening');
    t.equal(entry.songIds.length, 6, '6-song set');
    t.equal(Game.rules.booking.noShowReason(accepted.state, entry, 100), null, 'no 3-on-stage rule for an opener');
    var st = accepted.state;
    st.day = entry.day;
    st.debug.forceNextGig = 'great';
    var played = Game.rules.booking.playShow(st, entry, 100);
    t.ok(played.gig.crowd >= 120 && played.gig.crowd <= 180, 'crowd 60-90% of 200: ' + played.gig.crowd);
    var factor = Game.rules.gigs.originalsFactor(entry.songIds.map(function (id) { return st.songs[id]; }));
    t.near(played.gig.rewards.rawFans, played.gig.crowd * 0.15 * 0.5 * factor, 'fans at half the rate');
    t.equal(played.gig.rewards.pay, 100, 'paid the fee');
  });

  Game.test('Residency: signing books every night; the crowd never drops below half the room', function (t) {
    var s = withSongs(freshState(), 3);
    s = Game.rules.booking.addInbox(s, 'residency', { venueId: 'backRoom', weekday: 3, rate: 100, weeks: 4, counter: null }, s.day + 3);
    var r = Game.rules.offers.signResidency(s, s.inbox[0].id, { weekday: 3, rate: 100, weeks: 4 });
    var shows = Game.rules.booking.upcomingShows(r.state);
    t.equal(shows.length, 4, '4 shows');
    t.ok(shows.every(function (e) { return Game.rules.day.dayOfWeek(e.day) === 3 && e.deal === 'residency' && e.fee === 100; }), 'Thursdays at $100');
    t.ok(shows[0].day - s.day >= 7, 'starts at least a week out');
    var st = r.state;
    st.day = shows[0].day;
    st.cities.hometown.fans = 0;
    var played = Game.rules.booking.playShow(st, shows[0], 100);
    t.ok(played.gig.crowd >= 30, 'at least half of 60: ' + played.gig.crowd);
  });

  Game.test('Residency negotiation: changes lower the odds; one counter-offer; a no keeps the original on the table', function (t) {
    var s = withSongs(freshState(), 3);
    var offer = { venueId: 'backRoom', weekday: 3, rate: 100, weeks: 4, counter: null };
    t.equal(Game.rules.offers.counterChance(s, offer, { weekday: 3, rate: 100, weeks: 4 }), 1, 'no changes: 100%');
    t.near(Game.rules.offers.counterChance(s, offer, { weekday: 4, rate: 100, weeks: 4 }), 0.85, 'a different night: 95% - 10%');
    t.near(Game.rules.offers.counterChance(s, offer, { weekday: 3, rate: 120, weeks: 4 }), 0.55, '+20% money: 95% - 40%');
    t.near(Game.rules.offers.counterChance(s, offer, { weekday: 3, rate: 100, weeks: 6 }), 0.85, '+2 weeks: 95% - 10%');
    t.ok(Game.rules.offers.termsProblem(s, offer, { weekday: 3, rate: 130, weeks: 4 }), '+30% money not allowed');
    s = Game.rules.booking.addInbox(s, 'residency', offer, s.day + 3);
    var id = s.inbox[0].id;
    s = Game.rules.offers.counterResidency(s, id, { weekday: 3, rate: 125, weeks: 4 }).state;
    t.ok(Game.rules.offers.counterResidency(s, id, { weekday: 3, rate: 110, weeks: 4 }).log[0].indexOf('already') !== -1, 'only one counter');
    s.inbox[0].data.counter.chance = 0; // force a no
    s.day += 1;
    s = Game.rules.offers.processCounters(s).state;
    t.equal(s.inbox[0].data.counter.status, 'declined', 'they said no');
    t.equal(s.inbox[0].resolved, false, 'the offer is still open');
    t.equal(Game.rules.booking.upcomingShows(Game.rules.offers.signResidency(s, id, { weekday: 3, rate: 100, weeks: 4 }).state).length, 4, 'original terms can still be signed');
  });

  Game.test('Residency negotiation: a yes signs your terms', function (t) {
    var s = withSongs(freshState(), 3);
    s = Game.rules.booking.addInbox(s, 'residency', { venueId: 'backRoom', weekday: 3, rate: 100, weeks: 4, counter: null }, s.day + 3);
    var id = s.inbox[0].id;
    s = Game.rules.offers.counterResidency(s, id, { weekday: 4, rate: 110, weeks: 5 }).state;
    s.inbox[0].data.counter.chance = 1; // force a yes
    s.day += 1;
    s = Game.rules.offers.processCounters(s).state;
    var shows = Game.rules.booking.upcomingShows(s);
    t.equal(shows.length, 5, '5 weeks');
    t.ok(shows.every(function (e) { return Game.rules.day.dayOfWeek(e.day) === 4 && e.fee === 110; }), 'Fridays at $110');
  });

  Game.test('Band events: a bigger share changes the pay split; an argument moves both bandmates', function (t) {
    var band = withBand(['easygoing', 'easygoing']);
    var s = band.state;
    s.pendingEvent = { eventId: 'biggerShare', day: s.day, data: { personId: band.ids[0] } };
    s = Game.rules.events.resolve(s, 'give').state;
    t.near(Game.rules.people.payShares(s).yourShare, 1 / 3.5, 'your share: 1 of 3.5');
    s.pendingEvent = { eventId: 'argument', day: s.day, data: { a: band.ids[0], b: band.ids[1] } };
    var before0 = s.people[band.ids[0]].satisfaction;
    var before1 = s.people[band.ids[1]].satisfaction;
    s = Game.rules.events.resolve(s, 'sideA').state;
    t.equal(s.people[band.ids[0]].satisfaction, before0 + 6, 'A +6');
    t.equal(s.people[band.ids[1]].satisfaction, before1 - 6, 'B -6');
  });

  Game.test('Band events: a sick bandmate before a show can be covered by a session player', function (t) {
    var band = withBand(['easygoing']);
    var s = withSongs(band.state, 6);
    s = Game.rules.offers.bookShow(s, 'backRoom', s.day + 1, 'guarantee').state;
    t.ok(Game.content.events.sickBeforeShow.when(s), 'can happen with a show tomorrow');
    var data = Game.content.events.sickBeforeShow.setup(s, Game.rng.create(5));
    s.pendingEvent = { eventId: 'sickBeforeShow', day: s.day, data: data };
    var cash = s.player.cash;
    s = Game.rules.events.resolve(s, 'session').state;
    t.equal(s.entries[data.entryId].sessionPlayers, 1, 'session player booked');
    t.equal(s.player.cash, cash - 75, '$75');
  });

  Game.test('Save: a version 8 save loads as the current version', function (t) {
    var old = Game.util.clone(freshState());
    old.version = 8;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.version, Game.balance.save.version);
  });

})();
