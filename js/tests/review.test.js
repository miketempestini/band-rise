// review.test.js
// Tests added after the rules review: rules that didn't have a test yet (cancelling studio time and
// shows, offers arriving and expiring, band-life events, the cover nights banner, debug shortcuts,
// song names, the browser save check), plus the rules moved out of the screens (debt countdown,
// weekly totals, streaming estimate, residency rates, undoing a day off, what's in a calendar block).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var TEST_KEY = 'bandRise.testSaveReview'; // tests use their own slot so they never touch the real save

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    return s;
  }

  // Adds finished originals. Returns { state, ids }.
  function withOriginals(s, count) {
    var ids = [];
    for (var i = 0; i < count; i++) {
      var started = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(started.state, started.songId).state;
      ids.push(started.songId);
    }
    return { state: s, ids: ids };
  }

  // Adds easygoing bandmates (relationship 60, reliability 100). Returns { state, ids }.
  function withBand(count, seed) {
    var s = freshState(seed);
    s.player.reputation = 40; // enough to invite anyone
    var ids = [];
    for (var i = 0; i < count; i++) {
      var met = Game.rules.people.meet(s);
      s = met.state;
      var p = s.people[met.personId];
      p.relationship = 60; p.skill = 40; p.trait = 'easygoing'; p.reliability = 100; p.ambition = 50;
      s = Game.rules.people.invite(s, met.personId).state;
      ids.push(met.personId);
    }
    return { state: s, ids: ids };
  }

  // Puts an event on today and answers it with one choice. Returns the new state.
  function answer(s, eventId, data, choiceId) {
    s = Game.util.clone(s);
    s.pendingEvent = { eventId: eventId, day: s.day, data: data || {} };
    return Game.rules.events.resolve(s, choiceId).state;
  }

  // ----- Studio time and days off -----

  Game.test('Studio: a morning session on a workday takes a day off; cancelling is free and gives it back', function (t) {
    var o = withOriginals(freshState(), 2);
    var s = o.state;
    var vacation = s.player.job.vacationDaysLeft;
    var day = 14; // a Monday, two weeks out
    s = Game.rules.recording.bookSessions(s, { studio: 'demo', day: day, jobChoice: 'vacation',
      sessions: [{ block: 'morning', songId: o.ids[0] }, { block: 'afternoon', songId: o.ids[1] }] }).state;
    t.equal(s.player.job.daysOff[day], 'vacation', 'vacation day taken');
    t.equal(s.player.job.vacationDaysLeft, vacation - 1, 'one vacation day used');
    var cash = s.player.cash;
    s = Game.rules.recording.cancelSession(s, s.schedule[day].morning).state;
    t.equal(s.player.cash, cash, 'cancelling is free');
    t.equal(s.player.job.daysOff[day], 'vacation', 'the afternoon session still needs the day off');
    s = Game.rules.recording.cancelSession(s, s.schedule[day].afternoon).state;
    t.equal(s.player.job.daysOff[day], undefined, 'day off given back');
    t.equal(s.player.job.vacationDaysLeft, vacation, 'vacation day returned');
  });

  Game.test('Cancelling a show refunds session players and gives back its day off (unless a session needs it)', function (t) {
    var s = withOriginals(freshState(), 1).state;
    var day = 16; // a Wednesday: Hollow Records plays in the afternoon, a work block
    s = Game.rules.offers.bookShow(s, 'hollowRecords', day, 'inStore').state;
    var entryId = s.schedule[day].afternoon;
    s = Game.rules.job.takeDayOff(s, day, 'vacation', true).state;
    s = Game.rules.booking.changeSessionPlayers(s, entryId, 1).state;
    var cash = s.player.cash;
    var r = Game.rules.booking.cancelShow(s, entryId);
    t.equal(r.state.player.cash, cash + Game.balance.economy.sessionPlayerFee, 'session player refunded');
    t.equal(r.state.player.job.daysOff[day], undefined, 'day off given back');

    // Same show, but a studio session that morning still needs the day off.
    var s2 = Game.util.clone(s);
    s2.entries.studioTest = { id: 'studioTest', day: day, block: 'morning', type: 'studio', studio: 'demo', songId: null, status: 'booked' };
    s2.schedule[day].morning = 'studioTest';
    t.equal(Game.rules.booking.cancelShow(s2, entryId).state.player.job.daysOff[day], 'vacation', 'day off kept for the session');
  });

  Game.test('Undo day off: allowed for a free future day, refused when a show needs it or the day is over', function (t) {
    var s = withOriginals(freshState(), 1).state;
    var day = 16;
    s = Game.rules.job.takeDayOff(s, day, 'vacation').state;
    t.equal(Game.rules.job.undoDayOffProblem(s, day), null, 'nothing booked: can undo');
    var withShow = Game.rules.offers.bookShow(s, 'hollowRecords', day, 'inStore').state;
    t.ok(Game.rules.job.undoDayOffProblem(withShow, day), 'a show in the afternoon needs it');
    t.equal(Game.rules.job.undoDayOff(withShow, day).state.player.job.daysOff[day], 'vacation', 'undo refused');
    var later = Game.util.clone(s);
    later.day = day + 1;
    t.ok(Game.rules.job.undoDayOffProblem(later, day), 'the day is over');
    t.ok(Game.rules.job.undoDayOffProblem(s, day + 1), 'not a day off');
    var undone = Game.rules.job.undoDayOff(s, day).state;
    t.equal(undone.player.job.daysOff[day], undefined, 'undone');
  });

  Game.test('Calendar blocks: shows, studio time, plans, job, days off, and free time', function (t) {
    var o = withOriginals(freshState(), 1);
    var s = o.state;
    t.equal(Game.rules.booking.blockContents(s, 1, 'morning').kind, 'job', 'Tuesday morning: job');
    t.equal(Game.rules.booking.blockContents(s, 1, 'evening').kind, 'free', 'Tuesday evening: free');
    t.equal(Game.rules.booking.blockContents(s, 5, 'morning').kind, 'free', 'Saturday morning: free');
    s = Game.rules.offers.bookShow(s, 'backRoom', 9, 'guarantee').state;
    t.equal(Game.rules.booking.blockContents(s, 9, 'evening').kind, 'show', 'booked show');
    s = Game.rules.recording.bookSessions(s, { studio: 'demo', day: 12, sessions: [{ block: 'evening', songId: o.ids[0] }] }).state;
    t.equal(Game.rules.booking.blockContents(s, 12, 'evening').kind, 'studio', 'studio time');
    s = Game.rules.job.takeDayOff(s, 16, 'vacation').state;
    var off = Game.rules.booking.blockContents(s, 16, 'morning');
    t.equal(off.kind, 'off', 'day off');
    t.equal(off.offKind, 'vacation');
    s = Game.rules.actions.plan(s, 'evening', 'practice', o.ids[0], 2).state;
    t.equal(Game.rules.booking.blockContents(s, 2, 'evening').kind, 'plan', 'planned task');
  });

  // ----- Offers -----

  Game.test('Residency offers: need reputation 20 and venue relationship 15; only on Mondays', function (t) {
    var s = withOriginals(freshState(), 1).state;
    s.player.reputation = 25;
    s.venues.backRoom.relationship = 20;
    t.sameContents(Game.rules.offers.residencyVenues(s).map(function (v) { return v.id; }), ['backRoom'], 'The Back Room likes you');
    var low = Game.util.clone(s);
    low.player.reputation = 19;
    t.equal(Game.rules.offers.residencyVenues(low).length, 0, 'reputation 19: none');
    var cold = Game.util.clone(s);
    cold.venues.backRoom.relationship = 14;
    t.equal(Game.rules.offers.residencyVenues(cold).length, 0, 'relationship 14: none');

    // Try many Mondays (different random seeds): some bring an offer, always on the venue's terms.
    var offers = [];
    var tuesdayOffers = 0;
    for (var seed = 1; seed <= 40; seed++) {
      var m = Game.util.clone(s);
      m.rngState = seed;
      var rolled = Game.rules.offers.roll(m).state;
      offers = offers.concat(rolled.inbox.filter(function (x) { return x.kind === 'residency'; }));
      var tue = Game.util.clone(s);
      tue.day = 1;
      tue.rngState = seed;
      tuesdayOffers += Game.rules.offers.roll(tue).state.inbox.filter(function (x) { return x.kind === 'residency'; }).length;
    }
    t.ok(offers.length > 0, 'some Mondays bring an offer (' + offers.length + ' of 40)');
    t.equal(tuesdayOffers, 0, 'never on a Tuesday');
    t.ok(offers.every(function (x) {
      return x.data.venueId === 'backRoom' && x.data.weekday === Game.balance.offers.residency.preferredNights[0] &&
        x.data.rate === Game.balance.venues.guarantees.backRoom && x.data.weeks === Game.balance.offers.residencyWeeks;
    }), 'Thursdays, the room\'s usual fee, 4 weeks');
  });

  Game.test('Opening slot offers arrive at clubs, a few days out, for a round fee', function (t) {
    var o = Game.balance.offers;
    var s = withOriginals(freshState(), 1).state;
    s.day = 1; // a Tuesday, so only opening slots can arrive
    s.player.reputation = 40;
    s.player.skills.networking = 40;
    var offers = [];
    for (var seed = 1; seed <= 150; seed++) {
      var m = Game.util.clone(s);
      m.rngState = seed;
      offers = offers.concat(Game.rules.offers.roll(m).state.inbox.filter(function (x) { return x.kind === 'opening'; }));
    }
    t.ok(offers.length > 0, 'some days bring an offer (' + offers.length + ' of 150)');
    t.ok(offers.every(function (x) { return Game.content.venues[x.data.venueId].tier === o.openingSlot.venueTier; }), 'at clubs');
    t.ok(offers.every(function (x) {
      var ahead = x.data.day - s.day;
      return ahead >= o.openingSlot.daysAhead.min && ahead <= o.openingSlot.daysAhead.max;
    }), '3 to 10 days out');
    t.ok(offers.every(function (x) {
      return x.data.fee % o.openingSlot.feeRoundTo === 0 && x.data.fee >= o.openingSlotFee.min && x.data.fee <= o.openingSlotFee.max;
    }), '$50 to $150 in $5 steps');
    t.ok(offers.every(function (x) { return x.expiresDay === Math.min(s.day + o.openingSlot.expiryDays, x.data.day - 1); }), 'answer within 2 days');
  });

  Game.test('Offers expire if not answered in time; declining has no penalty', function (t) {
    var s = freshState();
    s = Game.rules.booking.addInbox(s, 'opening', { venueId: 'basement', day: s.day + 6, fee: 100 }, s.day + 2);
    s = Game.rules.booking.addInbox(s, 'residency', { venueId: 'backRoom', weekday: 3, rate: 100, weeks: 4, counter: null }, s.day + 3);
    var onTime = Game.util.clone(s);
    onTime.day += 2;
    t.equal(Game.rules.booking.expireOffers(onTime).state.inbox[0].resolved, false, 'still open on its last day');
    var late = Game.util.clone(s);
    late.day += 3;
    var expired = Game.rules.booking.expireOffers(late);
    t.equal(expired.state.inbox[0].resolved, 'expired', 'the opening slot expired');
    t.equal(expired.state.inbox[1].resolved, false, 'the residency still has a day');
    t.ok(expired.log[0].indexOf('The Basement') !== -1, 'says which venue');

    var rep = s.player.reputation;
    var declined = Game.rules.offers.decline(s, s.inbox[1].id).state;
    t.equal(declined.inbox[1].resolved, 'declined', 'declined');
    t.equal(declined.venues.backRoom.relationship, s.venues.backRoom.relationship, 'venue doesn\'t mind');
    t.equal(declined.player.reputation, rep, 'no reputation lost');
  });

  Game.test('Residency rates: 5% steps up to 25% each way, rounded to $5; other amounts are refused', function (t) {
    var s = freshState();
    var offer = { venueId: 'backRoom', weekday: 3, rate: 100, weeks: 4, counter: null };
    var options = Game.rules.offers.rateOptions(offer);
    t.sameContents(options.map(function (o) { return o.rate; }), [75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125], '$75 to $125');
    t.equal(options[5].percent, 0, 'the offered rate is 0%');
    t.equal(options[10].percent, 25, 'the top step is +25%');
    t.equal(Game.rules.offers.termsProblem(s, offer, { weekday: 3, rate: 110, weeks: 4 }), null, '$110 is on the list');
    t.ok(Game.rules.offers.termsProblem(s, offer, { weekday: 3, rate: 103, weeks: 4 }), '$103 is not');
    var small = Game.rules.offers.rateOptions({ rate: 60 }).map(function (o) { return o.rate; });
    t.ok(small.every(function (r, i) { return i === 0 || r > small[i - 1]; }), 'no repeated rates for a small fee: ' + small.join(', '));
    t.ok(small.indexOf(60) !== -1, 'the offered $60 is there');
  });

  // ----- Band-life events -----

  Game.test('Band events: encouraging a side project costs reliability; asking them to commit costs satisfaction', function (t) {
    var e = Game.balance.events.sideProject;
    var band = withBand(1);
    var id = band.ids[0];
    var before = band.state.people[id];
    var yes = answer(band.state, 'sideProject', { personId: id }, 'encourage');
    t.equal(yes.people[id].satisfaction, before.satisfaction + e.encourageSatisfaction, 'happier');
    t.equal(yes.people[id].reliability, before.reliability + e.encourageReliability, 'less reliable');
    var no = answer(band.state, 'sideProject', { personId: id }, 'commit');
    t.equal(no.people[id].satisfaction, before.satisfaction + e.commitSatisfaction, 'unhappy');
    t.equal(no.people[id].reliability, before.reliability, 'reliability unchanged');
  });

  Game.test('Band events: a noise complaint is a fine, or everyone rehearses quietly', function (t) {
    var e = Game.balance.events.noiseComplaint;
    var band = withBand(2);
    var cash = band.state.player.cash;
    t.equal(answer(band.state, 'noiseComplaint', {}, 'pay').player.cash, cash - e.fine, 'fine paid');
    var quiet = answer(band.state, 'noiseComplaint', {}, 'quiet');
    band.ids.forEach(function (id) {
      t.equal(quiet.people[id].satisfaction, band.state.people[id].satisfaction + e.quietSatisfaction, 'everyone a little unhappy');
    });
  });

  Game.test('Band events: a song idea adds progress (never quite finishing the song)', function (t) {
    var e = Game.balance.events.songIdea;
    var band = withBand(1);
    var id = band.ids[0];
    var s = answer(band.state, 'songIdea', { personId: id }, 'write');
    var song = Game.rules.songs.inProgress(s);
    t.ok(song, 'a song was started');
    t.equal(song.progress, e.progress, '+15 progress');
    t.equal(s.player.energy, band.state.player.energy + e.energy, 'energy spent');
    t.equal(s.people[id].satisfaction, band.state.people[id].satisfaction + e.satisfaction, 'they liked it');
    s.songs[song.id].progress = Game.balance.songs.progressToFinish - 5;
    var again = answer(s, 'songIdea', { personId: id }, 'write');
    t.equal(again.songs[song.id].progress, Game.balance.songs.progressToFinish - 1, 'stops just short of finished');
    t.equal(again.songs[song.id].quality, null, 'not finished yet');
  });

  Game.test('Band events: a late night out lifts morale and every bandmate\'s relationship, but costs energy', function (t) {
    var e = Game.balance.events.lateNight;
    var band = withBand(2);
    var s = answer(band.state, 'lateNight', {}, 'stay');
    t.equal(s.player.morale, band.state.player.morale + e.morale, 'morale');
    t.equal(s.player.energy, band.state.player.energy + e.energy, 'energy');
    band.ids.forEach(function (id) {
      t.equal(s.people[id].relationship, band.state.people[id].relationship + e.relationship, 'relationship up');
    });
    t.sameContents(answer(band.state, 'lateNight', {}, 'home').player, band.state.player, 'heading home changes nothing');
  });

  Game.test('Band events: stolen gear costs money to replace, or borrowed gear hurts gigs for a week', function (t) {
    var e = Game.balance.events.gearStolen;
    var band = withBand(1);
    var cash = band.state.player.cash;
    t.equal(answer(band.state, 'gearStolen', {}, 'replace').player.cash, cash - e.replaceCost, 'replaced');
    var borrowed = answer(band.state, 'gearStolen', {}, 'borrow');
    t.equal(Game.rules.events.gigScoreChange(borrowed), e.borrowGigScore, '-3 gig score');
    var later = Game.util.clone(borrowed);
    later.day += e.borrowDays;
    t.equal(Game.rules.events.gigScoreChange(later), 0, 'gone after 7 days');
  });

  // ----- Banners, debug shortcuts, song names, saving -----

  Game.test('Cover nights: the banner shows once reputation and Musicianship are high enough', function (t) {
    var b = Game.balance.economy;
    var s = freshState();
    s.player.reputation = b.coverGigMinReputation - 1;
    s.player.skills.musicianship = b.coverGigMinMusicianship;
    t.equal(Game.rules.progress.checkUnlocks(s).state.milestones.coverNights, undefined, 'reputation too low');
    s.player.reputation = b.coverGigMinReputation;
    var r = Game.rules.progress.checkUnlocks(s);
    t.ok(r.state.milestones.coverNights !== undefined, 'unlocked');
    t.ok(r.state.toasts.some(function (x) { return x.id === 'coverNights' && x.text.indexOf('$' + b.coverGigFee) !== -1; }), 'banner with the fee');
    t.equal(Game.rules.progress.checkUnlocks(r.state).state.toasts.length, r.state.toasts.length, 'only once');
  });

  Game.test('Debug: set skill, buzz, relationship, and satisfaction stay in range; unknown people are ignored', function (t) {
    var band = withBand(1);
    var s = band.state;
    var id = band.ids[0];
    t.equal(Game.rules.debug.setSkill(s, 'musicianship', 150).state.player.skills.musicianship, 100, 'skill capped at 100');
    t.equal(Game.rules.debug.setSkill(s, 'musicianship', -5).state.player.skills.musicianship, 0, 'skill at least 0');
    t.equal(Game.rules.debug.setBuzz(s, 150).state.cities.hometown.buzz, Game.balance.buzz.max, 'buzz capped');
    t.equal(Game.rules.debug.setRelationship(s, id, 130).state.people[id].relationship, 100, 'relationship capped');
    t.equal(Game.rules.debug.setSatisfaction(s, id, -10).state.people[id].satisfaction, 0, 'satisfaction at least 0');
    t.equal(Game.rules.debug.setRelationship(s, 'nobody', 50).state, s, 'unknown person: nothing changes');
    t.equal(Game.rules.debug.setSatisfaction(s, 'nobody', 50).state, s, 'unknown person: nothing changes');
  });

  Game.test('Debug: add contact, set reputation (with unlocks), record next session, streaming now', function (t) {
    var o = withOriginals(freshState(), 1);
    var s = o.state;
    var count = Object.keys(s.people).length;
    t.equal(Object.keys(Game.rules.debug.addContact(s).state.people).length, count + 1, 'one new contact');
    t.ok(Game.rules.debug.setReputation(s, Game.balance.milestones.smallRoomsReputation).state.milestones.smallRooms !== undefined,
      'reputation 10 unlocks Small rooms');

    s = Game.rules.recording.bookSessions(s, { studio: 'demo', day: 12, sessions: [{ block: 'evening', songId: o.ids[0] }] }).state;
    var entryId = s.schedule[12].evening;
    var rec = Game.rules.debug.recordNextSession(s).state;
    t.ok(rec.songs[o.ids[0]].recording, 'recorded');
    t.equal(rec.entries[entryId], undefined, 'session taken off the calendar');
    t.equal(Game.rules.debug.recordNextSession(rec).log[0], 'No studio time booked.', 'nothing left to record');

    rec.releases.push({ id: 'r1', type: 'single', songIds: [o.ids[0]], day: rec.day, avgQuality: 50 });
    rec.songs[o.ids[0]].recording.quality = 50;
    rec.cities.hometown.fans = 1000;
    var cash = rec.player.cash;
    var paid = Game.rules.debug.streamingNow(rec).state;
    t.equal(paid.player.cash, cash + 10, '1,000 fans x $0.02 x 50% = $10');
    t.equal(paid.day, rec.day, 'the day doesn\'t change');
  });

  Game.test('Song names: a suggested title is never one you already use', function (t) {
    var s = freshState();
    var first = Game.rules.songs.suggestTitle(s).title;
    var started = Game.rules.songs.startSong(s);
    s = started.state;
    s.songs[started.songId].title = first;
    var second = Game.rules.songs.suggestTitle(s).title;
    t.ok(second !== first, '"' + first + '" is taken, got "' + second + '"');
  });

  Game.test('Save: the browser save check says whether something is stored', function (t) {
    Game.save.clearBrowserSave(TEST_KEY);
    t.equal(Game.save.hasBrowserSave(TEST_KEY), false, 'nothing stored');
    Game.save.writeToBrowser(freshState(), TEST_KEY);
    t.equal(Game.save.hasBrowserSave(TEST_KEY), true, 'stored');
    Game.save.clearBrowserSave(TEST_KEY);
    t.equal(Game.save.hasBrowserSave(TEST_KEY), false, 'cleared');
  });

  // ----- Rules moved out of the screens -----

  Game.test('Debt: Pay back max, Sundays until game over, and the weekly totals', function (t) {
    var s = freshState();
    s.player.cash = 300;
    s.player.loanOwed = 1000;
    t.equal(Game.rules.money.maxPayBack(s), 300, 'limited by cash');
    s.player.cash = 2000;
    t.equal(Game.rules.money.maxPayBack(s), 1000, 'limited by debt');
    s.player.debtWeeksOverLimit = 2;
    t.equal(Game.rules.money.sundaysUntilGameOver(s), Game.balance.debt.gameOverWeeks - 1, '2 Sundays over so far: 4 more ends it');

    var week = { income: { dayJob: 550, tips: 20 }, costs: { bills: 400 }, loans: 1000, paidBack: 100 };
    var totals = Game.rules.money.weekTotals(week);
    t.equal(totals.totalIn, 1570, 'money in includes the loan');
    t.equal(totals.totalOut, 500, 'money out includes paying back');
    t.equal(totals.income[totals.income.length - 1].key, 'loans', 'loan line last');
    t.equal(Game.rules.money.weekTotals({ income: {}, costs: {}, loans: 0, paidBack: 0 }).income.length, 0, 'an empty week has no lines');
  });

  Game.test('Streaming estimate: next Sunday\'s pay (or the Sunday after, on a Sunday)', function (t) {
    var o = withOriginals(freshState(), 1);
    var s = o.state;
    s.songs[o.ids[0]].recording = { quality: 50, day: 0, studio: 'demo' };
    s.releases.push({ id: 'r1', type: 'single', songIds: [o.ids[0]], day: 0, avgQuality: 50 });
    s.cities.hometown.fans = 1000;
    s.day = 1;
    var est = Game.rules.recording.streamingEstimate(s);
    t.equal(est.day, 6, 'this Sunday');
    t.equal(est.pay, 10, '$10');
    s.day = 6;
    t.equal(Game.rules.recording.streamingEstimate(s).day, 13, 'on a Sunday: next week\'s');
  });

  Game.test('Skills page: + needs points left and room under the cap; - needs points above 0', function (t) {
    var b = Game.balance.skills;
    var a = Game.rules.career.emptyAllocation();
    t.sameContents(Game.rules.career.canAdjust(a, 'musicianship'), { add: true, remove: false }, 'empty: can add only');
    a.musicianship = b.startingMaxPerSkill;
    t.equal(Game.rules.career.canAdjust(a, 'musicianship').add, false, 'at the cap');
    var full = Game.rules.career.suggestedAllocation();
    t.sameContents(Game.rules.career.canAdjust(full, 'performance'), { add: false, remove: true }, 'all spent: can remove only');
  });

  Game.test('Picker: open mics need exactly 2 songs; Rehearse takes 1 to 4', function (t) {
    var s = freshState();
    var ids = Game.rules.songs.playable(s).map(function (x) { return x.id; });
    t.ok(Game.rules.actions.pickedSongsProblem(s, 'openMic', ids.slice(0, 1)), 'open mic: 1 is not enough');
    t.equal(Game.rules.actions.pickedSongsProblem(s, 'openMic', ids.slice(0, 2)), null, 'open mic: 2 is right');
    t.ok(Game.rules.actions.pickedSongsProblem(s, 'rehearse', []), 'rehearse: none picked');
    t.equal(Game.rules.actions.pickedSongsProblem(s, 'rehearse', ids.slice(0, 3)), null, 'rehearse: 3 is fine');
    t.ok(Game.rules.actions.pickedSongsProblem(s, 'rehearse', ids.slice(0, 5)), 'rehearse: 5 is too many');
  });

})();
