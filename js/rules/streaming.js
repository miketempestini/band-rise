// streaming.js
// Streams and charts. Every Sunday night:
// 1. each released song gets a stream count for the week:
//      total fans x streamsPerFan x (recording quality / 100) x freshness x boosts
//    (boosts: buzz, last week's chart spot, live plays that week, a release-week promo push, and going viral)
// 2. streaming money is paid (streams x payPerStream; records made under a label deal are split with the label)
// 3. the charts are updated: a Top 40 singles chart and a Top 20 albums chart, where your songs and releases compete
//    with made-up songs by other acts
// 4. releases that pass a stream total earn Gold and Platinum records, and first chart moments get a banner
// Numbers are in balance.streaming and balance.charts.
//
// A released song keeps: song.streams = { total, weeks: [last weekly counts, oldest first], live, viral }
//   and song.chart = { pos (or null), last, peak, weeks, peakDay } once it has charted.
// A release keeps: name, promo: { id, week } (or null), records: ['gold', 'platinum'], chart (EPs and albums).
// state.charts = { day, singles: [entry], albums: [entry], pool: { singles, albums }, nextId, moments: [...], week }
//   entry = { key, title, artist, streams, last, peak, weeks, mine, songId, releaseId }.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.streaming = {

  // A new, empty stream record for a song that's just been released.
  newStats: function () {
    return { total: 0, weeks: [], live: 0, viral: 0 };
  },

  // The release a song is on, or null.
  releaseOf: function (state, song) {
    return state.releases.filter(function (r) { return song.releaseId ? r.id === song.releaseId : r.songIds.indexOf(song.id) !== -1; })[0] || null;
  },

  // The buzz boost: your average buzz in the cities where you have fans, as 0 to buzzBoostMax.
  buzzBoost: function (state) {
    var ids = Object.keys(state.cities).filter(function (id) { return state.cities[id].fans > 0; });
    if (!ids.length) return 0;
    var avg = ids.reduce(function (t, id) { return t + state.cities[id].buzz; }, 0) / ids.length;
    return avg / Game.balance.buzz.max * Game.balance.streaming.buzzBoostMax;
  },

  // The chart boost from last week's spot: from chartBoostMin at the bottom of the chart to chartBoostMax at #1.
  chartBoost: function (pos) {
    var st = Game.balance.streaming;
    var size = Game.balance.charts.singlesSize;
    if (!pos) return 0;
    return st.chartBoostMin + (size - pos) / (size - 1) * (st.chartBoostMax - st.chartBoostMin);
  },

  // A release's promo boost this week: full in its first week, fading to nothing over its weeks.
  promoBoost: function (release) {
    if (!release || !release.promo) return 0;
    var p = Game.balance.streaming.promos[release.promo.id];
    if (!p || release.promo.week >= p.weeks) return 0;
    return p.boost * (1 - release.promo.week / p.weeks);
  },

  // Everything that multiplies a song's streams this week: { buzz, chart, live, promo, viral, label, total }.
  // label: the reach of the label you're signed with, on records made under that deal.
  boosts: function (state, song) {
    var st = Game.balance.streaming;
    var sr = Game.rules.streaming;
    var stats = song.streams || sr.newStats();
    var b = {
      buzz: sr.buzzBoost(state),
      chart: sr.chartBoost(song.chart && song.chart.pos),
      live: Math.min(st.liveMax, stats.live * st.livePerShow),
      promo: sr.promoBoost(sr.releaseOf(state, song)),
      viral: stats.viral ? st.viralCurve[stats.viral - 1] : 1,
      label: Game.rules.label.reachFor(state, song)
    };
    b.event = Game.rules.events.streamsMultiplier(state); // events: a sync license lifts streams, a scandal dents them
    b.total = Math.min(st.maxBoost, (1 + b.buzz) * (1 + b.chart) * (1 + b.live) * (1 + b.promo) * b.viral * (1 + b.label) * b.event);
    return b;
  },

  // A song's streams for the week ending on `day` (0 if it isn't out yet, or came out that day).
  songStreams: function (state, song, day) {
    var st = Game.balance.streaming;
    var rel = Game.rules.streaming.releaseOf(state, song);
    if (!rel || rel.day >= day || !song.recording) return 0;
    var fans = Game.rules.progress.totalFans(state);
    var fresh = Game.rules.recording.freshness(rel, day);
    return Math.round(fans * st.streamsPerFan * (song.recording.quality / 100) * fresh * Game.rules.streaming.boosts(state, song).total);
  },

  // Every released song's streams for the week ending on `day`: { songId: streams }.
  weekStreams: function (state, day) {
    var out = {};
    state.releases.forEach(function (rel) {
      rel.songIds.forEach(function (id) {
        var song = state.songs[id];
        if (song) out[id] = Game.rules.streaming.songStreams(state, song, day);
      });
    });
    return out;
  },

  // The money a week of streams pays (before the label's cut).
  payFor: function (streams) {
    return Math.round(streams * Game.balance.streaming.payPerStream);
  },

  // A release's total streams (its tracks added up), this week's, and its weekly history (added up by week).
  releaseStats: function (state, release) {
    var songs = release.songIds.map(function (id) { return state.songs[id]; }).filter(function (x) { return x && x.streams; });
    var total = songs.reduce(function (t, x) { return t + x.streams.total; }, 0);
    var len = songs.reduce(function (m, x) { return Math.max(m, x.streams.weeks.length); }, 0);
    var weeks = [];
    for (var i = 0; i < len; i++) {
      weeks.push(songs.reduce(function (t, x) {
        var w = x.streams.weeks;
        var at = w.length - len + i; // line the histories up by their most recent week
        return t + (at >= 0 ? w[at] : 0);
      }, 0));
    }
    return { total: total, thisWeek: weeks.length ? weeks[weeks.length - 1] : 0, weeks: weeks };
  },

  // The record amounts for a release: { gold, platinum } (singles have their own, smaller amounts).
  recordAmounts: function (release) {
    var r = Game.balance.streaming.records;
    return release.type === 'single' ? r.song : r.album;
  },

  // ----- Sunday night -----

  // The whole Sunday: viral rolls, streams, money, history, promos, charts, records, and chart moments.
  // Returns { state, log }.
  weekly: function (state) {
    var sr = Game.rules.streaming;
    var st = Game.balance.streaming;
    if (!state.releases.length) return { state: state, log: [] };
    var s = Game.util.clone(state);
    var log = [];

    // Going viral: each released song of quality 50+ that isn't viral already has a small chance.
    var rng = Game.rng.create(s.rngState);
    var viralNow = [];
    s.releases.forEach(function (rel) {
      if (rel.day >= s.day) return;
      rel.songIds.forEach(function (id) {
        var song = s.songs[id];
        if (!song || !song.streams || song.streams.viral || !song.recording || song.recording.quality < st.viralMinQuality) return;
        if (rng.chance(st.viralChance)) { song.streams.viral = 1; viralNow.push(song); }
      });
    });
    s.rngState = rng.getState();

    // This week's streams for every released song.
    var weekly = sr.weekStreams(s, s.day);
    var totalStreams = 0;
    Object.keys(weekly).forEach(function (id) {
      var song = s.songs[id];
      song.streams = song.streams || sr.newStats();
      if (sr.releaseOf(s, song).day >= s.day) return; // out today: it starts next week
      song.streams.total += weekly[id];
      song.streams.weeks.push(weekly[id]);
      if (song.streams.weeks.length > st.historyWeeks) song.streams.weeks.shift();
      song.streams.live = 0;
      if (song.streams.viral) song.streams.viral = song.streams.viral >= st.viralCurve.length ? 0 : song.streams.viral + 1;
      totalStreams += weekly[id];
    });
    s.releases.forEach(function (rel) { if (rel.promo && rel.day < s.day) rel.promo.week += 1; });

    // Money: records made under a label deal (now or before) are split with that label (Game.rules.label); the rest
    // is all yours.
    var pay = sr.payFor(totalStreams);
    var dealt = s.releases.some(function (rel) { return Game.rules.label.releaseDeal(s, rel); });
    if (dealt) {
      var byRelease = {};
      s.releases.forEach(function (rel) {
        if (rel.day >= s.day) return;
        var streams = rel.songIds.reduce(function (t, id) { return t + (weekly[id] || 0); }, 0);
        if (streams > 0) byRelease[rel.id] = sr.payFor(streams);
      });
      var settled = Game.rules.label.settleStreaming(s, byRelease);
      s = settled.state;
      log.push(totalStreams.toLocaleString() + ' streams. ' + settled.log[0]);
    } else {
      if (pay > 0) s = Game.rules.money.earn(s, pay, 'streaming').state;
      log.push('Streaming: ' + totalStreams.toLocaleString() + ' streams, +$' + pay.toLocaleString() + ' this week.');
    }
    viralNow.forEach(function (song) {
      var text = '"' + song.title + '" went viral! Its streams are way up for the next few weeks.';
      log.push(text);
      s.toasts.push({ id: 'viral-' + song.id + '-' + s.day, text: text });
      s = Game.rules.booking.addInbox(s, 'note', { title: '"' + song.title + '" went viral', text: 'A clip of it is everywhere this week. Streams are about ' +
        st.viralCurve[0] + ' times normal, easing off over the next ' + (st.viralCurve.length - 1) + ' weeks.' }, null);
    });

    var charted = sr.updateCharts(s, weekly);
    s = charted.state;
    log = log.concat(charted.log);
    var records = sr.checkRecords(s);
    s = records.state;
    log = log.concat(records.log);
    s.charts.week = { day: s.day, streams: totalStreams, pay: pay };
    return { state: s, log: log };
  },

  // Gold and Platinum records for releases that passed their amounts (each once). Changes a state that's already a
  // copy. Returns { state, log }.
  checkRecords: function (s) {
    var sr = Game.rules.streaming;
    var log = [];
    var notes = [];
    // First mark every record won (on this state's own releases), then send the Inbox notes afterwards:
    // adding a note makes a fresh copy of the whole state, so a record marked after that would land on the old copy.
    s.releases.forEach(function (rel) {
      rel.records = rel.records || [];
      var total = sr.releaseStats(s, rel).total;
      var amounts = sr.recordAmounts(rel);
      ['gold', 'platinum'].forEach(function (kind) {
        if (rel.records.indexOf(kind) !== -1 || total < amounts[kind]) return;
        rel.records.push(kind);
        var name = kind === 'gold' ? 'Gold' : 'Platinum';
        var text = '"' + rel.name + '" went ' + name + '! (' + amounts[kind].toLocaleString() + ' streams)';
        log.push(text);
        s.toasts.push({ id: 'record-' + rel.id + '-' + kind, text: text, milestone: true });
        notes.push({ title: name + ' record: "' + rel.name + '"', text: 'Your ' +
          Game.content.releaseTypes[rel.type].name + ' passed ' + amounts[kind].toLocaleString() + ' streams. A ' + name.toLowerCase() +
          ' record is on its way for your wall.' });
      });
    });
    notes.forEach(function (note) { s = Game.rules.booking.addInbox(s, 'note', note, null); });
    return { state: s, log: log };
  },

  // ----- The charts -----

  // A chart entry by another act: a band from the scene (bigger hits go to bigger bands) and a made-up title.
  // kind: 'single' or 'album'.
  makeEntry: function (s, rng, kind, streams) {
    var names = Game.content.names;
    var band = Game.rules.scene.chartArtist(s, rng, kind, streams);
    var title = rng.pick(names.songTitleFirst) + ' ' + rng.pick(names.songTitleSecond);
    var id = 'o' + s.charts.nextId;
    s.charts.nextId += 1;
    return { id: id, kind: kind, title: title, artist: band.name, bandId: band.id, streams: Math.round(streams) };
  },

  // Fills an empty pool of other acts' songs or albums: streams fall from the top level down the list.
  seedPool: function (s, rng, kind) {
    var c = Game.balance.charts;
    var size = kind === 'single' ? c.singlesSize : c.albumsSize;
    var top = kind === 'single' ? c.singleTop : c.albumTop;
    var step = Math.pow(c.bottomShare, 1 / (size - 1)); // so the last chart spot sits at top x bottomShare
    var pool = [];
    for (var i = 0; i < size + c.poolExtra; i++) {
      pool.push(Game.rules.streaming.makeEntry(s, rng, kind, top * Math.pow(step, i) * (1 + rng.range(-c.seedWobble, c.seedWobble))));
    }
    return pool;
  },

  // One week for the other acts: streams drift (mostly down), a few new ones arrive, faded ones drop off, and the whole
  // pool is scaled so the top stays near its usual level.
  movePool: function (s, rng, kind) {
    var c = Game.balance.charts;
    var key = kind === 'single' ? 'singles' : 'albums';
    var size = kind === 'single' ? c.singlesSize : c.albumsSize;
    var top = kind === 'single' ? c.singleTop : c.albumTop;
    var pool = s.charts.pool[key];
    if (!pool.length) pool = Game.rules.streaming.seedPool(s, rng, kind);
    pool.forEach(function (e) { e.streams = Math.round(e.streams * (c.drift.min + rng.next() * (c.drift.max - c.drift.min))); });
    var arrivals = kind === 'single' ? c.newSingles : c.newAlbums;
    for (var i = 0; i < arrivals; i++) {
      pool.push(Game.rules.streaming.makeEntry(s, rng, kind, top * (c.newMin + rng.next() * rng.next() * (c.newMax - c.newMin))));
    }
    pool.sort(function (a, b) { return b.streams - a.streams; });
    var scale = top * (1 + rng.range(-c.topWobble, c.topWobble)) / pool[0].streams;
    pool.forEach(function (e) { e.streams = Math.round(e.streams * scale); });
    s.charts.pool[key] = pool.slice(0, size + c.poolExtra);
  },

  // Builds this week's charts from the other acts and your music, and records chart spots, peaks, and weeks.
  // weekly: this week's streams by song id. Changes a state that's already a copy. Returns { state, log }.
  updateCharts: function (s, weekly) {
    var sr = Game.rules.streaming;
    var c = Game.balance.charts;
    var rng = Game.rng.create(s.rngState);
    sr.movePool(s, rng, 'single');
    sr.movePool(s, rng, 'album');
    s.rngState = rng.getState();
    var me = s.band.name || s.player.name;
    var prev = { singles: {}, albums: {} };
    s.charts.singles.forEach(function (e, i) { prev.singles[e.key] = { pos: i + 1, peak: e.peak, weeks: e.weeks }; });
    s.charts.albums.forEach(function (e, i) { prev.albums[e.key] = { pos: i + 1, peak: e.peak, weeks: e.weeks }; });

    var mine = { singles: [], albums: [] };
    Object.keys(weekly).forEach(function (id) {
      if (weekly[id] > 0) mine.singles.push({ key: 'song:' + id, title: s.songs[id].title, artist: me, streams: weekly[id], mine: true, songId: id, releaseId: s.songs[id].releaseId });
    });
    s.releases.forEach(function (rel) {
      if (rel.type === 'single') return;
      var streams = rel.songIds.reduce(function (t, id) { return t + (weekly[id] || 0); }, 0);
      if (streams > 0) mine.albums.push({ key: 'rel:' + rel.id, title: rel.name, artist: me, streams: streams, mine: true, releaseId: rel.id });
    });

    // Your rivals' records compete with real streams (each album, and its lead single).
    var rivals = Game.rules.scene.weeklyStreams(s);

    var build = function (key, size) {
      var others = s.charts.pool[key].map(function (e) {
        var band = e.bandId && s.scene.bands[e.bandId];
        return { key: e.id, title: e.title, artist: band ? band.name : e.artist, bandId: e.bandId || null, streams: e.streams, mine: false };
      });
      var list = others.concat(rivals[key]).concat(mine[key]).sort(function (a, b) { return b.streams - a.streams; }).slice(0, size);
      return list.map(function (e, i) {
        var p = prev[key][e.key];
        e.last = p ? p.pos : null;
        e.peak = p ? Math.min(p.peak, i + 1) : i + 1;
        e.weeks = p ? p.weeks + 1 : 1;
        return e;
      });
    };
    s.charts.singles = build('singles', c.singlesSize);
    s.charts.albums = build('albums', c.albumsSize);
    s.charts.day = s.day;
    Game.rules.scene.recordCharts(s);

    // Your songs' and releases' chart records, and the first-time moments.
    var log = [];
    var spot = function (holder, pos) {
      var ch = holder.chart || { pos: null, last: null, peak: null, weeks: 0, peakDay: null };
      ch.last = ch.pos;
      ch.pos = pos;
      if (pos) {
        ch.weeks += 1;
        if (!ch.peak || pos < ch.peak) { ch.peak = pos; ch.peakDay = s.day; }
      }
      holder.chart = ch;
    };
    var songPos = {}, relPos = {};
    s.charts.singles.forEach(function (e, i) { if (e.mine) songPos[e.songId] = i + 1; });
    s.charts.albums.forEach(function (e, i) { if (e.mine) relPos[e.releaseId] = i + 1; });
    Object.keys(weekly).forEach(function (id) { if (s.songs[id].chart || songPos[id]) spot(s.songs[id], songPos[id] || null); });
    s.releases.forEach(function (rel) { if (rel.type !== 'single' && (rel.chart || relPos[rel.id])) spot(rel, relPos[rel.id] || null); });

    var moment = function (kind, title, text) {
      if (s.charts.moments.some(function (m) { return m.kind === kind; })) return;
      s.charts.moments.push({ day: s.day, kind: kind, title: title });
      s.toasts.push({ id: 'chart-' + kind, text: text, milestone: true });
      log.push(text);
    };
    var bestSingle = s.charts.singles.filter(function (e) { return e.mine; })[0];
    var bestAlbum = s.charts.albums.filter(function (e) { return e.mine; })[0];
    if (bestSingle) {
      var sp = songPos[bestSingle.songId];
      moment('entry', bestSingle.title, '"' + bestSingle.title + '" is on the charts, at #' + sp + '!');
      if (sp <= c.topTen) moment('top10', bestSingle.title, '"' + bestSingle.title + '" is a Top 10 hit (#' + sp + ')!');
      if (sp === 1) moment('number1', bestSingle.title, '"' + bestSingle.title + '" is the #1 song in the country!');
      log.push('Charts: "' + bestSingle.title + '" is #' + sp + (bestSingle.last ? ' (last week #' + bestSingle.last + ')' : ' (new)') + '.');
    }
    if (bestAlbum) {
      var ap = relPos[bestAlbum.releaseId];
      moment('albumEntry', bestAlbum.title, '"' + bestAlbum.title + '" is on the albums chart, at #' + ap + '!');
      if (ap <= c.topTen) moment('albumTop10', bestAlbum.title, '"' + bestAlbum.title + '" is a Top 10 album (#' + ap + ')!');
      if (ap === 1) moment('albumNumber1', bestAlbum.title, '"' + bestAlbum.title + '" is the #1 album in the country!');
    }
    return { state: s, log: log };
  },

  // Your best spots on this week's charts: { single: entry or null, singlePos, album: entry or null, albumPos }.
  best: function (state) {
    var c = state.charts;
    var single = null, singlePos = null, album = null, albumPos = null;
    c.singles.forEach(function (e, i) { if (e.mine && !single) { single = e; singlePos = i + 1; } });
    c.albums.forEach(function (e, i) { if (e.mine && !album) { album = e; albumPos = i + 1; } });
    return { single: single, singlePos: singlePos, album: album, albumPos: albumPos };
  },

  // ----- Older saves -----

  // Estimates a song's past streams (for saves from before streams were counted): each week since its release, at
  // today's fans and that week's freshness, with no boosts.
  estimatePast: function (state, song, release) {
    var st = Game.balance.streaming;
    var fans = Game.rules.progress.totalFans(state);
    var total = 0, weeks = [];
    for (var day = release.day + Game.balance.time.daysPerWeek; day <= state.day; day += Game.balance.time.daysPerWeek) {
      var w = Math.round(fans * st.streamsPerFan * (song.recording.quality / 100) * Game.rules.recording.freshness(release, day));
      total += w;
      weeks.push(w);
    }
    return { total: total, weeks: weeks.slice(-st.historyWeeks), live: 0, viral: 0 };
  }
};
