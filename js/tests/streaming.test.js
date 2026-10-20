// streaming.test.js
// Tests for streams and charts (js/rules/streaming.js): the weekly stream formula and its boosts, money and the
// label's cut, history, Gold and Platinum records, the charts (who gets on, spots, peaks, weeks, new entries), viral
// runs, release-week promos, live plays, release names, and loading older saves.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A career with some recorded originals (quality q) ready to release, and plenty of cash.
  function withRecordings(count, q, seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.cash = 50000;
    var ids = [];
    for (var i = 0; i < count; i++) {
      var st = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(st.state, st.songId).state;
      s.songs[st.songId].recording = { quality: q, day: 0, studio: 'pro' };
      ids.push(st.songId);
    }
    return { state: s, ids: ids };
  }

  // Ends days until the next Sunday night has passed (a Monday morning). Returns the new state.
  function toMonday(s) {
    do { s.pendingEvent = null; s = Game.rules.day.endDay(s).state; } while (Game.rules.day.dayOfWeek(s.day) !== 0);
    return s;
  }

  Game.test('Streams: fans x streams per fan x quality x freshness x boosts, and money is streams x pay per stream', function (t) {
    var st = Game.balance.streaming;
    var o = withRecordings(1, 60);
    var s = Game.rules.recording.release(o.state, 'single', o.ids).state;
    s.cities.hometown.fans = 10000;
    s.cities.hometown.buzz = 0;
    var song = s.songs[o.ids[0]];
    t.equal(Game.rules.streaming.songStreams(s, song, s.day), 0, 'nothing on release day');
    var day = s.day + 6;
    var expect = Math.round(10000 * st.streamsPerFan * 0.6 * Game.rules.recording.freshness(s.releases[0], day));
    t.equal(Game.rules.streaming.songStreams(s, song, day), expect, expect.toLocaleString() + ' streams with no boosts');
    t.equal(Game.rules.streaming.payFor(expect), Math.round(expect * st.payPerStream), 'pay per stream');
  });

  Game.test('Streams: buzz, chart spot, live plays, promo, and viral each multiply the streams (capped)', function (t) {
    var st = Game.balance.streaming;
    var o = withRecordings(1, 60);
    var s = Game.rules.recording.release(o.state, 'single', o.ids, null, 'video').state;
    s.cities.hometown.fans = 10000;
    s.cities.hometown.buzz = Game.balance.buzz.max;
    var song = s.songs[o.ids[0]];
    song.chart = { pos: 1, last: null, peak: 1, weeks: 1, peakDay: s.day };
    song.streams.live = 10;
    song.streams.viral = 1;
    var b = Game.rules.streaming.boosts(s, song);
    t.near(b.buzz, st.buzzBoostMax, 'full buzz: +' + st.buzzBoostMax * 100 + '%');
    t.near(b.chart, st.chartBoostMax, '#1: +' + st.chartBoostMax * 100 + '%');
    t.near(b.live, st.liveMax, '10 shows: capped at +' + st.liveMax * 100 + '%');
    t.near(b.promo, st.promos.video.boost, 'music video, first week: +' + st.promos.video.boost * 100 + '%');
    t.equal(b.viral, st.viralCurve[0], 'viral: x' + st.viralCurve[0]);
    t.equal(b.total, st.maxBoost, 'all together: capped at x' + st.maxBoost);
    t.near(Game.rules.streaming.chartBoost(Game.balance.charts.singlesSize), st.chartBoostMin, 'the bottom of the chart: +' + st.chartBoostMin * 100 + '%');
  });

  Game.test('Release: a name for an EP (or its first song\'s), a single named after its song; a promo push is paid and fades', function (t) {
    var st = Game.balance.streaming;
    var o = withRecordings(4, 60);
    var cash = o.state.cash;
    var ep = Game.rules.recording.release(o.state, 'ep', o.ids.slice(0, 3), '  Neon Nights  ', 'radio').state;
    t.equal(ep.releases[0].name, 'Neon Nights', 'named (and trimmed)');
    t.equal(ep.player.cash, o.state.player.cash - st.promos.radio.cost, 'the radio push is paid now');
    var plain = Game.rules.recording.release(o.state, 'ep', o.ids.slice(0, 3), '', null).state;
    t.equal(plain.releases[0].name, plain.songs[o.ids[0]].title, 'blank: named after its first song');
    var single = Game.rules.recording.release(o.state, 'single', [o.ids[3]], 'Ignored', null).state;
    t.equal(single.releases[0].name, single.songs[o.ids[3]].title, 'a single is its song');
    var rel = ep.releases[0];
    t.near(Game.rules.streaming.promoBoost(rel), st.promos.radio.boost, 'full in its first week');
    rel.promo.week = st.promos.radio.weeks / 2;
    t.near(Game.rules.streaming.promoBoost(rel), st.promos.radio.boost / 2, 'half way: half');
    rel.promo.week = st.promos.radio.weeks;
    t.equal(Game.rules.streaming.promoBoost(rel), 0, 'gone after its weeks');
    t.ok(Game.rules.recording.releaseProblem(Object.assign(Game.util.clone(o.state), { player: Object.assign(Game.util.clone(o.state.player), { cash: 10 }) }),
      'single', [o.ids[3]], null, 'video'), 'can\'t afford the push');
  });

  Game.test('Sunday: streams are counted and kept week by week, live plays reset, and the money comes in', function (t) {
    var st = Game.balance.streaming;
    var o = withRecordings(1, 60);
    var s = Game.rules.recording.release(o.state, 'single', o.ids).state;
    s.cities.hometown.fans = 5000;
    s.songs[o.ids[0]].streams.live = 2;
    var cash = s.player.cash;
    s = toMonday(s);
    var stats = s.songs[o.ids[0]].streams;
    t.equal(stats.weeks.length, 1, 'one week of history');
    t.ok(stats.total > 0 && stats.total === stats.weeks[0], 'total = the week: ' + stats.total.toLocaleString());
    t.equal(stats.live, 0, 'live plays reset');
    t.ok(s.ledger[s.ledger.length - 1].income.streaming > 0, 'streaming money in the week\'s summary');
    t.equal(s.charts.week.streams, stats.weeks[0], 'the week\'s streams are noted for the summary');
    for (var i = 0; i < st.historyWeeks + 3; i++) s = toMonday(s);
    t.equal(s.songs[o.ids[0]].streams.weeks.length, st.historyWeeks, 'history keeps ' + st.historyWeeks + ' weeks');
  });

  Game.test('Records: Gold and Platinum at their stream totals, each only once', function (t) {
    var r = Game.balance.streaming.records;
    var o = withRecordings(1, 60);
    var s = Game.rules.recording.release(o.state, 'single', o.ids).state;
    s.songs[o.ids[0]].streams.total = r.song.gold;
    var a = Game.rules.streaming.checkRecords(Game.util.clone(s));
    t.sameContents(a.state.releases[0].records, ['gold'], 'Gold at ' + r.song.gold.toLocaleString());
    var again = Game.rules.streaming.checkRecords(Game.util.clone(a.state));
    t.equal(again.log.length, 0, 'not twice');
    a.state.songs[o.ids[0]].streams.total = r.song.platinum;
    t.sameContents(Game.rules.streaming.checkRecords(Game.util.clone(a.state)).state.releases[0].records, ['gold', 'platinum'], 'then Platinum');
    t.ok(r.album.gold > r.song.gold, 'EPs and albums need more streams');
  });

  Game.test('Records: Gold and Platinum won in the same week are both kept, with a note for each', function (t) {
    var r = Game.balance.streaming.records;
    var o = withRecordings(1, 60);
    var s = Game.rules.recording.release(o.state, 'single', o.ids).state;
    s.songs[o.ids[0]].streams.total = r.song.platinum;
    var inboxBefore = s.inbox.length;
    var a = Game.rules.streaming.checkRecords(Game.util.clone(s));
    t.sameContents(a.state.releases[0].records, ['gold', 'platinum'], 'both records saved');
    t.equal(a.state.inbox.length, inboxBefore + 2, 'an Inbox note for each');
    t.equal(Game.rules.streaming.checkRecords(Game.util.clone(a.state)).log.length, 0, 'not announced again the next week');
  });

  Game.test('Charts: a big act gets on and a tiny one doesn\'t; spots, last week, peaks, weeks, and new entries are kept', function (t) {
    var c = Game.balance.charts;
    var small = withRecordings(1, 70);
    var s1 = Game.rules.recording.release(small.state, 'single', small.ids).state;
    s1.cities.hometown.fans = 500;
    s1 = toMonday(s1);
    t.equal(s1.charts.singles.length, c.singlesSize, 'a Top ' + c.singlesSize);
    t.equal(s1.charts.albums.length, c.albumsSize, 'a Top ' + c.albumsSize + ' albums');
    t.ok(!s1.charts.singles.some(function (e) { return e.mine; }), '500 fans: not on the chart');
    t.ok(s1.charts.singles.every(function (e, i) { return i === 0 || e.streams <= s1.charts.singles[i - 1].streams; }), 'in order');

    var big = withRecordings(1, 90, 2);
    var s2 = Game.rules.recording.release(big.state, 'single', big.ids).state;
    ['hometown', 'harlowFalls', 'cedarJunction'].forEach(function (id) { s2.cities[id].unlocked = true; s2.cities[id].fans = Game.content.cities[id].fanCeiling; });
    Game.content.cities.bellmontCity && (s2.cities.bellmontCity.unlocked = true, s2.cities.bellmontCity.fans = 100000);
    s2.cities.newHalston.fans = 500000; s2.cities.crescentCity.fans = 400000; s2.cities.kingsport.fans = 350000;
    s2 = toMonday(s2);
    var mine = s2.charts.singles.filter(function (e) { return e.mine; })[0];
    t.ok(!!mine, 'over a million fans: on the chart');
    var song = s2.songs[big.ids[0]];
    t.ok(song.chart && song.chart.pos && song.chart.peak === song.chart.pos && song.chart.weeks === 1, 'the song keeps its spot, peak, and weeks');
    t.equal(mine.last, null, 'a new entry has no last week');
    t.ok(s2.charts.moments.some(function (m) { return m.kind === 'entry'; }), 'the first-entry moment');
    var s3 = toMonday(s2);
    var again = s3.charts.singles.filter(function (e) { return e.mine; })[0];
    t.ok(!again || again.last === song.chart.pos, 'next week: last week\'s spot is remembered');
    t.ok(s3.songs[big.ids[0]].chart.weeks >= (again ? 2 : 1), 'weeks on the chart add up');
  });

  Game.test('Viral: rolled from the saved seed (repeatable), then x4, x3, x2, x1.5 and done', function (t) {
    var st = Game.balance.streaming;
    var o = withRecordings(1, 80);
    var s = Game.rules.recording.release(o.state, 'single', o.ids).state;
    s.cities.hometown.fans = 1000;
    s.songs[o.ids[0]].streams.viral = 1;
    var curve = [];
    for (var i = 0; i < st.viralCurve.length + 1; i++) {
      curve.push(Game.rules.streaming.boosts(s, s.songs[o.ids[0]]).viral);
      s = toMonday(s);
    }
    t.sameContents(curve.slice(0, st.viralCurve.length), st.viralCurve, 'the viral curve');
    t.equal(s.songs[o.ids[0]].streams.viral, 0, 'then back to normal');
    var a = Game.rules.streaming.weekly(Game.util.clone(s));
    var b = Game.rules.streaming.weekly(Game.util.clone(s));
    t.equal(JSON.stringify(a.state.songs), JSON.stringify(b.state.songs), 'the same seed gives the same result');
  });

  Game.test('Live: playing a released song at a show counts toward its live boost that week', function (t) {
    var o = withRecordings(3, 60);
    var s = Game.rules.recording.release(o.state, 'ep', o.ids).state;
    var played = Game.rules.gigs.playGig(s, 'rustyNail', o.ids.slice(0, 2), 100, {}).state;
    t.equal(played.songs[o.ids[0]].streams.live, 1, 'played: counted');
    t.equal(played.songs[o.ids[2]].streams.live, 0, 'not played: not counted');
  });

  Game.test('Awards: a Top 10 song this year gets a better nomination chance', function (t) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    t.equal(Game.rules.awards.chartBonus(s, { peak: 5, peakDay: s.day }), Game.balance.awards.topTenBonus, 'Top 10 this year');
    t.equal(Game.rules.awards.chartBonus(s, { peak: 15, peakDay: s.day }), 0, '#15: nothing');
    t.equal(Game.rules.awards.chartBonus(s, null), 0, 'never charted: nothing');
  });

  Game.test('Save: a version 18 save upgrades with release names, estimated past streams, and empty charts', function (t) {
    var o = withRecordings(2, 60);
    var s = Game.rules.recording.release(o.state, 'ep', [], null, null).state; // (won't release: no songs)
    s = Game.rules.recording.release(o.state, 'single', [o.ids[0]]).state;
    s.cities.hometown.fans = 2000;
    s.day += 21;
    var old = Game.util.clone(s);
    old.version = 18;
    delete old.charts;
    delete old.releases[0].name; delete old.releases[0].records; delete old.releases[0].promo; delete old.releases[0].chart;
    delete old.songs[o.ids[0]].streams;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    var rel = loaded.state.releases[0];
    t.equal(rel.name, loaded.state.songs[o.ids[0]].title, 'named after its song');
    t.ok(loaded.state.songs[o.ids[0]].streams.total > 0 && loaded.state.songs[o.ids[0]].streams.weeks.length === 3, 'three weeks of past streams estimated');
    t.equal(loaded.state.charts.singles.length, 0, 'charts start empty');
  });

})();
