// scene.test.js
// Tests for the music scene (js/rules/scene.js): the 50 other bands and their sizes, rivals following your level,
// venue calendars (who plays where, taken nights, offers clearing a night), tickets and the night out, rivals grabbing
// opening slots and releasing records, the charts' other acts, head-to-head awards, and loading older saves.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function career(seed) {
    return Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
  }

  // A career with every city you can drive or fly to unlocked and a manager (so you can book 12 weeks ahead), with the
  // calendars filled again for all of them.
  function wideCareer(seed) {
    var s = career(seed);
    Object.keys(s.cities).forEach(function (id) { if (Game.content.cities[id].region !== 'international') s.cities[id].unlocked = true; });
    s.manager.hired = true;
    s.scene.shows = [];
    s.scene.filled = {};
    Game.rules.scene.fill(s);
    return s;
  }

  // Runs a test with some balance numbers changed, then puts them back. changes: [[object, key, value], ...]
  function withBalance(changes, fn) {
    var old = changes.map(function (c) { return c[0][c[1]]; });
    changes.forEach(function (c) { c[0][c[1]] = c[2]; });
    try { fn(); } finally { changes.forEach(function (c, i) { c[0][c[1]] = old[i]; }); }
  }

  // Ends one day (skipping any morning event). Returns the new state.
  function nextDay(s) {
    s.pendingEvent = null;
    return Game.rules.day.endDay(s).state;
  }

  // The first hometown show at a venue of this tier, from minAhead days on (tomorrow if not given), or null.
  function hometownShow(s, tier, minAhead) {
    return s.scene.shows.filter(function (x) {
      var v = Game.content.venues[x.venueId];
      return v.cityId === 'hometown' && v.tier === tier && x.day >= s.day + (minAhead || 1);
    }).sort(function (a, b) { return a.day - b.day; })[0] || null;
  }

  Game.test('Scene: 50 bands at home in a pyramid of sizes (3 of them rivals from your hometown), plus local bands abroad; the same for the same seed', function (t) {
    var b = Game.balance.scene;
    var s = Game.state.createNew(5);
    var all = Object.keys(s.scene.bands).map(function (id) { return s.scene.bands[id]; });
    var bands = all.filter(function (band) { return !band.countryId; });
    t.equal(bands.length, 50, '50 bands at home');
    var perCountry = b.localSizes.reduce(function (n, z) { return n + z.count; }, 0);
    t.equal(all.length - bands.length, perCountry * Object.keys(Game.content.scene.localBands).length, perCountry + ' local bands in each country');
    t.equal(s.scene.rivals.length, b.rivals.count, '3 rivals');
    t.ok(Game.rules.scene.rivals(s).every(function (band) { return band.rival && band.homeCity === 'hometown'; }), 'rivals are from Millbrook');
    b.sizes.forEach(function (z) {
      var count = bands.filter(function (band) { return !band.rival && band.reputation >= z.minRep && band.reputation <= z.maxRep; }).length;
      t.equal(count, z.count, z.count + ' bands of size ' + z.tier);
    });
    var names = {};
    bands.forEach(function (band) { names[band.name] = true; });
    all.forEach(function (band) { names[band.name] = true; });
    t.equal(Object.keys(names).length, all.length, 'every name is different');
    t.sameContents(Game.state.createNew(5).scene, s.scene, 'the same seed builds the same scene');
    t.ok(JSON.stringify(Game.state.createNew(6).scene.bands) !== JSON.stringify(s.scene.bands), 'another seed builds another scene');
    var big = bands.filter(function (band) { return band.reputation >= 85; })[0];
    var small = bands.filter(function (band) { return !band.rival && band.reputation < 30; })[0];
    t.ok(big.fans > small.fans * 100, 'arena bands have far more fans (' + big.fans.toLocaleString() + ') than small-room bands (' + small.fans + ')');
  });

  Game.test('Scene: naming your band after a scene band gives that band a spare name', function (t) {
    var s = career();
    var taken = s.scene.bands.b10.name;
    s = Game.rules.people.nameBand(s, taken).state;
    t.equal(s.band.name, taken, 'your band has the name');
    t.ok(s.scene.bands.b10.name !== taken, 'the scene band is now "' + s.scene.bands.b10.name + '"');
    t.ok(Game.content.scene.spareNames.indexOf(s.scene.bands.b10.name) !== -1, 'a spare name');
  });

  Game.test('Calendars: only cities you\'ve unlocked, as far ahead as you can book', function (t) {
    var s = career(3);
    var horizon = Game.rules.manager.horizonDay(s);
    t.equal(s.scene.filled.hometown, horizon, 'Millbrook filled to your booking horizon (4 weeks)');
    t.ok(s.scene.shows.length > 0 && s.scene.shows.every(function (x) { return Game.content.venues[x.venueId].cityId === 'hometown' && x.day <= horizon; }),
      'only Millbrook\'s venues (' + s.scene.shows.length + ' shows)');
    s.cities.harlowFalls.unlocked = true;
    s = nextDay(s);
    t.ok(s.scene.shows.some(function (x) { return Game.content.venues[x.venueId].cityId === 'harlowFalls' && x.day < horizon; }),
      'a city you unlock fills from today');
    s.manager.hired = true;
    s = nextDay(s);
    t.equal(s.scene.filled.hometown, Game.rules.manager.horizonDay(s), 'with a manager: 12 weeks ahead');
  });

  Game.test('Calendars: headliners fit the room, openers are one size down, nobody plays two nights running', function (t) {
    var sc = Game.rules.scene;
    var s = wideCareer(3);
    t.ok(s.scene.shows.length > 300, s.scene.shows.length + ' shows booked across every city');
    var ok = true, openersOk = true, gapOk = true, venuesOk = true;
    var days = {};
    s.scene.shows.forEach(function (x) {
      var v = Game.content.venues[x.venueId];
      if (v.tier < 1 || v.festival || v.deals.inStore || Game.content.cities[v.cityId].region === 'international') venuesOk = false;
      var size = sc.sizeOf(s.scene.bands[x.bandId].reputation);
      if (size !== v.tier && size !== v.tier + 1) ok = false;
      if (x.openerId && sc.sizeOf(s.scene.bands[x.openerId].reputation) !== v.tier - 1) openersOk = false;
      [x.bandId, x.openerId].forEach(function (id) {
        if (!id) return;
        (days[id] = days[id] || []).push(x.day);
      });
    });
    Object.keys(days).forEach(function (id) {
      var list = days[id].sort(function (a, b) { return a - b; });
      for (var i = 1; i < list.length; i++) if (list[i] - list[i - 1] < Game.balance.scene.gapDays) gapOk = false;
    });
    t.ok(venuesOk, 'only small rooms and up, no festivals, in-stores, or international cities');
    t.ok(ok, 'headliners are the venue\'s size (or one size up)');
    t.ok(openersOk, 'openers are one size down');
    t.ok(gapOk, 'no band plays twice within ' + Game.balance.scene.gapDays + ' days');
    var busyFriday = s.scene.shows.filter(function (x) { return Game.rules.day.dayOfWeek(x.day) === 4; }).length;
    var quietMonday = s.scene.shows.filter(function (x) { return Game.rules.day.dayOfWeek(x.day) === 0; }).length;
    t.ok(busyFriday > quietMonday * 2, 'Fridays are busy (' + busyFriday + ' shows), Mondays quiet (' + quietMonday + ')');
  });

  Game.test('Calendars: each night, past shows come off and one more day is filled', function (t) {
    var s = career(4);
    var day0 = s.day;
    s = nextDay(s);
    t.ok(s.scene.shows.every(function (x) { return x.day >= s.day; }), 'nothing before today');
    t.equal(s.scene.filled.hometown, Game.rules.manager.horizonDay(s), 'filled to the new day\'s booking horizon');
    t.equal(s.day, day0 + 1);
  });

  Game.test('Taken nights: another band\'s night can\'t be booked; an offer from the venue moves them', function (t) {
    var s = career(2);
    s.player.reputation = 40;
    var show = hometownShow(s, 1, Game.balance.venues.tiers[1].bookAhead.min); // inside the room's booking window
    var venue = Game.content.venues[show.venueId];
    var band = s.scene.bands[show.bandId];
    var problem = Game.rules.booking.dateProblem(s, venue, show.day);
    t.equal(problem, band.name + ' has a show at ' + venue.name, 'dateProblem: ' + problem);
    var dates = Game.rules.booking.bookingDates(s, venue).filter(function (d) { return d.day === show.day; });
    if (dates.length) t.ok(!dates[0].free, 'not a free date on the Book screen');
    var filled = Game.rules.booking.bookFillIn(s, show.venueId, show.day).state;
    t.equal(Game.rules.scene.showOn(filled, show.venueId, show.day), null, 'a fill-in show (the venue asked you) clears their night');
    // A night you've asked for is skipped when calendars fill.
    var t2 = career(2);
    t2.scene.shows = [];
    t2.scene.filled = {};
    var day = t2.day + 8;
    t2.requests.q1 = { id: 'q1', venueId: 'backRoom', gigDay: day, deal: 'door', status: 'pending', replyDay: t2.day + 2, chance: 0.5 };
    withBalance([[Game.balance.scene.showChance, 1, [1, 1, 1, 1, 1, 1, 1]]], function () { Game.rules.scene.fill(t2); });
    t.equal(Game.rules.scene.showOn(t2, 'backRoom', day), null, 'no other band booked on a night you asked for');
    t.ok(Game.rules.scene.showOn(t2, 'backRoom', day + 2) !== null, 'other nights fill as usual');
  });

  Game.test('Tickets: paid when bought, the evening is booked, no refund when given away; out of town only on a trip', function (t) {
    var sc = Game.rules.scene;
    var s = wideCareer(6);
    s.player.cash = 500;
    var show = hometownShow(s, 2);
    var price = Game.balance.venues.tiers[2].ticket;
    var r = sc.buyTicket(s, show.id);
    t.equal(r.state.player.cash, 500 - price, 'paid $' + price + ' right away');
    var entryId = r.state.schedule[show.day].evening;
    t.equal(r.state.entries[entryId].type, 'ticket', 'the evening is booked');
    t.ok(r.log[0].indexOf('Bought a ticket') === 0, r.log[0]);
    t.equal(Game.rules.booking.blockTaken(r.state, show.day, 'evening'), 'You have a ticket to a show', 'nothing else fits that evening');
    t.ok(sc.ticketProblem(r.state, show.id), 'can\'t buy twice: ' + sc.ticketProblem(r.state, show.id));
    var planned = Game.rules.actions.plan(r.state, 'evening', 'practice', null, show.day);
    t.equal(planned.state.entries[planned.state.schedule[show.day].evening].type, 'ticket', 'the action picker can\'t overwrite it: ' + planned.log[0]);
    var given = sc.cancelTicket(r.state, entryId);
    t.equal(given.state.player.cash, 500 - price, 'giving it away: no refund');
    t.ok(!given.state.schedule[show.day].evening, 'the evening is free again');
    var away = s.scene.shows.filter(function (x) { return Game.content.venues[x.venueId].cityId !== 'hometown' && x.day > s.day; })[0];
    t.ok(/while you're there on a trip/.test(sc.ticketProblem(s, away.id)), 'out of town: only on a trip there');
    var past = Game.util.clone(s);
    past.day = show.day + 1;
    t.equal(sc.ticketProblem(past, show.id), 'That show is over.');
  });

  Game.test('Tickets: the night out gives Networking (and a little Musicianship and Performance), morale, and a chance to meet someone', function (t) {
    var b = Game.balance.scene.show;
    var s = career(7);
    s.scene.shows.push({ id: 'gTest', venueId: 'basement', day: s.day, bandId: 'b20', openerId: null, playerOpens: false });
    s.player.energy = 80;
    s.player.morale = 50;
    s.player.skills.networking = 100; // a sure meeting: 30% + 100 / 2 % + 2 x 5% for a club
    var before = Game.util.clone(s.player.skills);
    s = Game.rules.scene.buyTicket(s, 'gTest').state;
    var contacts = Object.keys(s.people).length;
    s = nextDay(s);
    var block = s.lastDayReport.blocks.filter(function (x) { return x.block === 'evening'; })[0];
    t.ok(block.title.indexOf('Show: ') === 0, block.title);
    t.ok(block.lines[0].indexOf('Saw ' + s.scene.bands.b20.name + ' at The Basement') === 0, block.lines[0]);
    t.ok(s.player.skills.musicianship > before.musicianship, 'a little Musicianship');
    t.ok(s.player.skills.performance > before.performance, 'a little Performance');
    t.equal(Object.keys(s.people).length, contacts + 1, 'met someone');
    t.ok(s.player.morale >= 50 + b.morale - 5, 'a lift in morale (before the night\'s other changes)');
  });

  Game.test('Rivals: they move toward your level each Monday (one behind, one even, one ahead)', function (t) {
    var rv = Game.balance.scene.rivals;
    var s = career(8);
    s.player.reputation = 50;
    s.cities.hometown.fans = 10000;
    var rng = Game.rng.create(1);
    for (var i = 0; i < 25; i++) Game.rules.scene.weeklyDrift(s, rng);
    Game.rules.scene.rivals(s).forEach(function (band) {
      var aim = 50 + rv.repOffsets[band.rivalIndex];
      t.ok(Math.abs(band.reputation - aim) <= rv.wobble * 2, band.name + ': reputation ' + band.reputation + ' (aiming for ' + aim + ')');
      var fanAim = 10000 * rv.fanShares[band.rivalIndex];
      t.ok(Math.abs(band.fans - fanAim) < fanAim * 0.05, band.name + ': ' + band.fans + ' fans (aiming for ' + fanAim + ')');
    });
  });

  Game.test('Opening slots: they\'re on a real club show, you open under the headliner, and a rival grabs one you don\'t answer', function (t) {
    var s = career(9);
    s.player.reputation = 40;
    var r;
    withBalance([[Game.balance.offers.openingSlot, 'baseChance', 1]], function () { r = Game.rules.offers.roll(s); });
    var m = r.state.inbox.filter(function (x) { return x.kind === 'opening'; })[0];
    t.ok(m && m.data.showId, 'an opening offer on a real show');
    var show = Game.rules.scene.showById(r.state, m.data.showId);
    t.equal(show.venueId, m.data.venueId, 'at that club');
    t.equal(show.openerId, null, 'with no opener yet');
    t.ok(r.log[0].indexOf(r.state.scene.bands[show.bandId].name) !== -1, 'names the headliner: ' + r.log[0]);
    // Accepting: your show goes on the calendar and the headliner stays.
    var songs = r.state;
    for (var i = 0; i < 6; i++) { var st = Game.rules.songs.startSong(songs); songs = Game.rules.songs.finishSong(st.state, st.songId).state; }
    var accepted = Game.rules.offers.acceptOpening(songs, m.id).state;
    var after = Game.rules.scene.showById(accepted, m.data.showId);
    t.ok(after && after.playerOpens, 'their show stays, with you opening');
    t.equal(accepted.entries[accepted.schedule[m.data.day].evening].deal, 'opening', 'your opening set is on the calendar');
    // Not answering: a rival may take it.
    var stolen;
    withBalance([[Game.balance.scene, 'stealChance', 1]], function () { stolen = Game.rules.scene.nightly(r.state).state; });
    var gone = stolen.inbox.filter(function (x) { return x.id === m.id; })[0];
    t.equal(gone.resolved, 'taken', 'taken by a rival');
    t.ok(stolen.scene.bands[gone.data.takenBy].rival, 'by one of your rivals');
    t.equal(Game.rules.scene.showById(stolen, m.data.showId).openerId, gone.data.takenBy, 'they open that show instead');
    t.ok(stolen.inbox.some(function (x) { return x.kind === 'note' && /took the opening slot/.test(x.data.title); }), 'a note in the Inbox');
  });

  Game.test('Rivals\' records: on their schedule, sometimes the same week as yours, and they chart from their real streams', function (t) {
    var s = career(10);
    s.player.cash = 5000;
    Game.rules.scene.rivals(s).forEach(function (band) { band.reputation = 60; band.fans = 400000; band.nextReleaseDay = 9999; });
    var ids = [];
    for (var i = 0; i < 3; i++) {
      var st = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(st.state, st.songId).state;
      s.songs[st.songId].recording = { quality: 60, day: 0, studio: 'pro' };
      ids.push(st.songId);
    }
    s = Game.rules.recording.release(s, 'ep', ids, 'Our EP').state;
    withBalance([[Game.balance.scene.releases, 'sameWeekChance', 1]], function () { s = nextDay(s); });
    t.equal(s.scene.releases.length, 1, 'a rival released a record');
    var rel = s.scene.releases[0];
    t.ok(s.inbox.some(function (x) { return x.kind === 'note' && x.data.title.indexOf('Same week') === 0; }), 'a "same week" note');
    t.ok(Game.rules.scene.band(s, rel.bandId).nextReleaseDay > s.day, 'their next record is months away');
    do { s = nextDay(s); } while (Game.rules.day.dayOfWeek(s.day) !== 0); // its first Sunday
    rel = s.scene.releases[0];
    t.ok(rel.streams.total > 0, 'their record has streams: ' + rel.streams.total.toLocaleString());
    var onChart = s.charts.albums.filter(function (e) { return e.sceneReleaseId === rel.id; })[0];
    t.ok(onChart && rel.chart && rel.chart.pos, 'on the albums chart at #' + (rel.chart && rel.chart.pos));
    t.ok(s.charts.singles.some(function (e) { return e.sceneReleaseId === rel.id; }), 'and its lead single on the singles chart');
  });

  Game.test('Rivals\' records: only their 2 newest still stream and chart', function (t) {
    var s = career(15);
    var rival = Game.rules.scene.rivals(s)[0];
    rival.fans = 500000;
    s.day = 200;
    [10, 60, 120].forEach(function (day, i) {
      s.scene.releases.push({ id: 'r' + (i + 1), bandId: rival.id, type: 'album', name: 'Record ' + (i + 1), lead: 'Song ' + (i + 1), day: day,
        quality: 70, tracks: 10, streams: { total: 0, weeks: [] }, lastWeek: 0, leadWeek: 0, chart: null, leadChart: null });
    });
    var out = Game.rules.scene.weeklyStreams(s);
    t.sameContents(out.albums.map(function (e) { return e.sceneReleaseId; }).sort(), ['r2', 'r3'], 'the two newest');
    t.equal(s.scene.releases[0].lastWeek, 0, 'the oldest has dropped off');
  });

  Game.test('Charts: the other acts are scene bands, and the biggest hits go to the biggest bands', function (t) {
    var s = career(11);
    var weekly = {};
    s = Game.rules.streaming.updateCharts(Game.util.clone(s), weekly).state;
    var allScene = s.charts.singles.concat(s.charts.albums).every(function (e) {
      return e.bandId && s.scene.bands[e.bandId] && s.scene.bands[e.bandId].name === e.artist;
    });
    t.ok(allScene, 'every chart entry is by a scene band');
    var byFans = Object.keys(s.scene.bands).map(function (id) { return s.scene.bands[id]; }).filter(function (b) { return !b.rival; })
      .sort(function (a, b) { return b.fans - a.fans; }).map(function (b) { return b.id; });
    var rank = byFans.indexOf(s.charts.singles[0].bandId);
    t.ok(rank <= Game.balance.charts.artistWobble * 3, 'the #1 single is by one of the biggest bands (#' + (rank + 1) + ' by fans)');
  });

  Game.test('Awards: a rival with a record this year is a nominee, one nominee wins, and a winning rival keeps count', function (t) {
    var s = career(12);
    while (!Game.rules.awards.isNominationsDay(s.day)) s.day += 1;
    var ids = Object.keys(s.songs).filter(function (id) { return s.songs[id].isCover; });
    s.songs[ids[0]].recording = { quality: 70, day: 10, studio: 'pro' };
    s.releases.push({ id: 'r1', type: 'single', songIds: [ids[0]], day: s.day - 30, avgQuality: 70, name: 'Ours', records: [], chart: null });
    var rival = Game.rules.scene.rivals(s)[0];
    s.scene.releases.push({ id: 'r1', bandId: rival.id, type: 'album', name: 'Their Album', lead: 'Their Song', day: s.day - 20,
      quality: 90, tracks: 10, streams: { total: 0, weeks: [] }, lastWeek: 0, leadWeek: 0, chart: null, leadChart: null });
    var song = Game.rules.awards.nominationsFor(s).filter(function (n) { return n.category === 'song'; })[0];
    var theirs = song.nominees.filter(function (x) { return x.bandId === rival.id; })[0];
    t.ok(theirs, 'your rival is nominated for "Their Song"');
    t.equal(theirs.title, '"Their Song"');
    t.ok(song.chance < Game.rules.awards.qualityChance(70), 'your chance (' + Math.round(song.chance * 100) + '%) is lower with real competition');
    s = Game.rules.awards.check(s).state;
    s.awards.forEach(function (n) { n.nominees.forEach(function (x) { x.strength = x.bandId === rival.id ? 1 : 0; }); });
    s.day = Game.rules.awards.ceremonyDayAfter(s.day);
    s = Game.rules.awards.check(s).state;
    var n = s.awards.filter(function (x) { return x.category === 'song'; })[0];
    t.equal(n.won, false, 'you didn\'t win');
    t.equal(n.winner, rival.name, 'your rival did');
    t.equal(s.scene.bands[rival.id].awardsWon, 1, 'their award count went up');
  });

  Game.test('Saves: a version 19 save gets a scene, with rivals at your level and calendars filled', function (t) {
    var s = career(13);
    s.player.reputation = 70;
    s.cities.hometown.fans = 50000;
    var old = JSON.parse(JSON.stringify(s));
    delete old.scene;
    old.version = 19;
    old.charts.pool.singles = [{ id: 'o1', kind: 'single', title: 'Old Song', artist: 'The Old Act', streams: 1000000 }];
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loads');
    var st = loaded.state;
    t.equal(Object.keys(st.scene.bands).length, Object.keys(Game.state.createNew(1).scene.bands).length, 'a full scene of bands');
    t.ok(Game.rules.scene.rivals(st).every(function (band) { return Math.abs(band.reputation - 70) <= 6; }), 'rivals near your reputation');
    t.ok(st.scene.shows.length > 0 && st.scene.filled.hometown === Game.rules.manager.horizonDay(st), 'calendars filled');
    t.ok(st.charts.pool.singles[0].bandId && st.charts.pool.singles[0].artist !== 'The Old Act', 'old chart acts became scene bands');
  });

  Game.test('Career: the Rivals panel lists you and your three rivals', function (t) {
    var rows = Game.rules.scene.rivalRows(career(14));
    t.equal(rows.length, 4, 'you plus three');
    t.ok(rows[0].you, 'you first');
    t.ok(rows.slice(1).every(function (r) { return !r.you && r.fame; }), 'each rival has a fame level');
  });
})();
