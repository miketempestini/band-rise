// scene.js
// The music scene: 50 other bands (names in content/scene.js, numbers in balance.scene). They have reputation,
// fans, and skills like your band; most are small, a few are big. Three of them are your rivals, who climb as you do.
//
// What the scene does:
//   - Venue calendars: every venue (small rooms and up) has other bands' shows booked. A night another band has is
//     taken for you (booking.dateProblem), and you can buy a ticket to see the show.
//   - Rivals grab opening slots you don't answer, put out records (sometimes the same week as yours), and chart.
//   - Other bands are the "other acts" on the charts, and they're your competition at the awards.
//
// state.scene = {
//   bands:     { id: { id, name, homeCity, reputation, fans, musicianship, performance, songwriting, members,
//                      tier (its size when the scene began), rival, rivalIndex, yearStartFans, awardsWon, nextReleaseDay } },
//   rivals:    [band ids],
//   shows:     [{ id, venueId, day, bandId, openerId, playerOpens }]   (other bands' shows; past ones are removed)
//   releases:  [{ id, bandId, type: 'ep' | 'album', name, lead, day, quality, tracks, streams: { total, weeks },
//                 lastWeek, leadWeek, chart, leadChart }]               (rivals' records)
//   nextShowId, nextReleaseId,
//   filled:    { cityId: the last day that city's venue calendars are filled up to } (only cities you've unlocked),
//   rngState:  the scene's own dice (so the scene never changes the rest of the game's dice rolls)
// }
// A ticket is a calendar entry: { id, day, block: 'evening', type: 'ticket', showId, venueId, bandId, openerId, price }.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.scene = {

  // ----- Building the scene -----

  // A band's size from its reputation: 1 small room ... 4 arena, or 0 if it's too small for booked rooms yet.
  sizeOf: function (reputation) {
    var size = 0;
    Game.balance.scene.sizes.forEach(function (z) { if (reputation >= z.minRep) size = z.tier; });
    return size;
  },

  // About how many fans a band with this reputation has (with some spread from the dice).
  fansFor: function (reputation, rng) {
    var f = Game.balance.scene.fans;
    return Math.round(Math.pow(10, f.logBase + f.logPerRep * reputation + (rng ? rng.range(-f.logSpread, f.logSpread) : 0)));
  },

  // Skills that go with a reputation (with some spread from the dice, if rng is given).
  skillsFor: function (reputation, rng) {
    var k = Game.balance.scene.skills;
    var one = function () {
      return Math.round(Game.util.clamp(k.base + k.perRep * reputation + (rng ? rng.range(-k.spread, k.spread) : 0), 0, Game.balance.skills.max));
    };
    return { musicianship: one(), performance: one(), songwriting: one() };
  },

  // Picks a home city at home, more often the hometown and the big cities (bands abroad are added by addLocalBands).
  pickHome: function (rng) {
    var weights = Game.balance.scene.homeWeights;
    var list = Object.keys(Game.content.cities).filter(function (id) { return weights[Game.content.cities[id].region] && !Game.content.cities[id].countryId; });
    var total = list.reduce(function (t, id) { return t + weights[Game.content.cities[id].region]; }, 0);
    var roll = rng.next() * total;
    for (var i = 0; i < list.length; i++) {
      roll -= weights[Game.content.cities[list[i]].region];
      if (roll < 0) return list[i];
    }
    return list[list.length - 1];
  },

  // A new scene for a new career: 3 rivals near your starting level, then the pyramid of other bands.
  create: function (seed) {
    var b = Game.balance.scene;
    var sc = Game.rules.scene;
    var rng = Game.rng.create(seed + b.seedOffset);
    var names = Game.content.scene.bandNames.slice();
    // Shuffle the names so every career has different bands in each size.
    for (var i = names.length - 1; i > 0; i--) {
      var j = rng.int(0, i);
      var tmp = names[i]; names[i] = names[j]; names[j] = tmp;
    }
    var scene = { bands: {}, rivals: [], shows: [], releases: [], nextShowId: 1, nextReleaseId: 1, filled: {}, rngState: 0 };
    var n = 0;
    var add = function (reputation, extra) {
      n += 1;
      var id = 'b' + n;
      var skills = sc.skillsFor(reputation, rng);
      var band = {
        id: id, name: names[n - 1], homeCity: extra.homeCity || sc.pickHome(rng), reputation: reputation,
        fans: extra.fans !== undefined ? extra.fans : sc.fansFor(reputation, rng),
        musicianship: skills.musicianship, performance: skills.performance, songwriting: skills.songwriting,
        members: rng.int(b.members.min, b.members.max), tier: sc.sizeOf(reputation),
        rival: !!extra.rival, rivalIndex: extra.rival ? extra.rivalIndex : null,
        yearStartFans: 0, awardsWon: 0, nextReleaseDay: null
      };
      band.yearStartFans = band.fans;
      scene.bands[id] = band;
      return band;
    };
    // The rivals: from your hometown, starting where you start (no reputation, no fans), give or take their offset.
    for (var r = 0; r < b.rivals.count; r++) {
      var rival = add(Math.max(0, b.rivals.repOffsets[r]), { rival: true, rivalIndex: r, homeCity: 'hometown', fans: 0 });
      rival.nextReleaseDay = rng.int(b.releases.everyDays.min, b.releases.everyDays.max);
      scene.rivals.push(rival.id);
    }
    b.sizes.forEach(function (z) {
      for (var k = 0; k < z.count; k++) add(rng.int(z.minRep, z.maxRep), {});
    });
    scene.rngState = rng.getState();
    Game.rules.scene.addLocalBands(scene, seed);
    return scene;
  },

  // Adds each foreign country's local bands (names in content/scene.js), living in that country's cities. They have
  // their own dice (from the seed), so older saves get the same bands a new career would. Changes scene.
  addLocalBands: function (scene, seed) {
    var b = Game.balance.scene;
    var sc = Game.rules.scene;
    var rng = Game.rng.create(seed + b.localSeedOffset);
    var n = Object.keys(scene.bands).length;
    Object.keys(Game.content.scene.localBands).forEach(function (country) {
      var names = Game.content.scene.localBands[country].slice();
      var cities = Object.keys(Game.content.cities).filter(function (id) { return Game.content.cities[id].countryId === country; });
      b.localSizes.forEach(function (ls) {
        var z = b.sizes.filter(function (x) { return x.tier === ls.tier; })[0];
        for (var k = 0; k < ls.count; k++) {
          n += 1;
          var rep = rng.int(z.minRep, z.maxRep);
          var skills = sc.skillsFor(rep, rng);
          var fans = sc.fansFor(rep, rng);
          scene.bands['b' + n] = {
            id: 'b' + n, name: names.shift(), homeCity: rng.pick(cities), reputation: rep, fans: fans,
            musicianship: skills.musicianship, performance: skills.performance, songwriting: skills.songwriting,
            members: rng.int(b.members.min, b.members.max), tier: sc.sizeOf(rep), rival: false, rivalIndex: null,
            yearStartFans: fans, awardsWon: 0, nextReleaseDay: null, countryId: country
          };
        }
      });
    });
  },

  // If a scene band has your band's name, it takes a spare name instead (so names never clash). Changes s.
  renameClash: function (s) {
    var mine = String(s.band.name || '').toLowerCase();
    if (!mine) return;
    var used = {};
    Object.keys(s.scene.bands).forEach(function (id) { used[s.scene.bands[id].name.toLowerCase()] = true; });
    Object.keys(s.scene.bands).forEach(function (id) {
      var band = s.scene.bands[id];
      if (band.name.toLowerCase() !== mine) return;
      var spare = Game.content.scene.spareNames.filter(function (x) { return !used[x.toLowerCase()] && x.toLowerCase() !== mine; })[0];
      if (spare) { band.name = spare; used[spare.toLowerCase()] = true; }
    });
  },

  // ----- Looking things up -----

  band: function (state, id) { return state.scene.bands[id] || null; },
  rivals: function (state) { return state.scene.rivals.map(function (id) { return state.scene.bands[id]; }); },

  // The fame level for a number of fans (the same ladder as yours).
  fameName: function (fans) {
    var levels = Game.balance.fameLevels;
    var i = 0;
    while (i + 1 < levels.length && fans >= levels[i + 1].minFans) i += 1;
    return levels[i].name;
  },

  // Another band's show at a venue on a night, or null.
  showOn: function (state, venueId, day) {
    return state.scene.shows.filter(function (x) { return x.venueId === venueId && x.day === day; })[0] || null;
  },

  showById: function (state, id) {
    return state.scene.shows.filter(function (x) { return x.id === id; })[0] || null;
  },

  // A venue's coming shows (from a day on), soonest first.
  showsAt: function (state, venueId, fromDay, limit) {
    return state.scene.shows.filter(function (x) { return x.venueId === venueId && x.day >= fromDay; })
      .sort(function (a, b) { return a.day - b.day; }).slice(0, limit || undefined);
  },

  // Who's on the bill, in words: "The Paper Wolves, with Neon Sparrows opening" (or "with you opening").
  billText: function (state, show) {
    var head = Game.rules.scene.band(state, show.bandId);
    var opener = show.openerId ? Game.rules.scene.band(state, show.openerId) : null;
    return (head ? head.name : 'A touring band') + (show.playerOpens ? ', with you opening' : (opener ? ', with ' + opener.name + ' opening' : ''));
  },

  // Why a venue's night is taken by another band (for booking.dateProblem), or null.
  takenProblem: function (state, venue, day) {
    if (!state.scene) return null;
    var show = Game.rules.scene.showOn(state, venue.id, day);
    if (!show) return null;
    var band = Game.rules.scene.band(state, show.bandId);
    return (band ? band.name : 'Another band') + ' has a show at ' + venue.name;
  },

  // ----- Venue calendars -----

  // The venues that have other bands' shows: small rooms and up, not festivals or the record-store in-stores.
  calendarVenues: function () {
    return Object.keys(Game.content.venues).map(function (id) { return Game.content.venues[id]; }).filter(function (v) {
      return v.tier >= 1 && !v.festival && !v.deals.inStore;
    }).sort(function (a, b) { return b.tier - a.tier || (a.id < b.id ? -1 : 1); }); // big rooms first, so big bands are placed first
  },

  // How far ahead calendars are filled: as far as you can book (4 weeks, or 12 with a manager).
  calendarEnd: function (state) {
    return Game.rules.manager.horizonDay(state);
  },

  // True if you already have that venue on that night: a show, a request waiting for a reply, or an offer.
  playerHolds: function (state, venueId, day) {
    var venue = Game.content.venues[venueId];
    var plan = state.schedule[day];
    var entry = plan && plan[venue.showBlock] && state.entries[plan[venue.showBlock]];
    if (entry && entry.type === 'gig' && entry.venueId === venueId) return true;
    var asked = Object.keys(state.requests).some(function (id) {
      var r = state.requests[id];
      return r.status === 'pending' && r.venueId === venueId && r.gigDay === day;
    });
    if (asked) return true;
    return state.inbox.some(function (m) {
      return !m.resolved && m.data && m.data.venueId === venueId && (m.data.gigDay === day || m.data.day === day);
    });
  },

  // Picks a band for a show (headliner or opener), or null if nobody fits. busy: bands playing too close to this night.
  pickBand: function (s, rng, venue, busy, role) {
    var b = Game.balance.scene;
    var sc = Game.rules.scene;
    var w = b.playWeights;
    var list = [], total = 0;
    Object.keys(s.scene.bands).forEach(function (id) {
      if (busy[id]) return;
      var band = s.scene.bands[id];
      var size = sc.sizeOf(band.reputation);
      var sizeW = role === 'opener' ? (size === venue.tier - 1 ? 1 : 0)
        : (size === venue.tier ? 1 : (size === venue.tier + 1 ? w.upTier : 0));
      if (!sizeW) return;
      // Home-city bands first; touring bands anywhere; other bands only in their own country.
      var sameCountry = Game.rules.travel.countryOf(band.homeCity) === Game.rules.travel.countryOf(venue.cityId);
      var placeW = band.homeCity === venue.cityId ? w.home : (band.reputation >= b.touringRep ? w.touring : (sameCountry ? w.away : 0));
      if (!placeW) return;
      list.push({ id: id, w: sizeW * placeW });
      total += sizeW * placeW;
    });
    if (!list.length) return null;
    var roll = rng.next() * total;
    for (var i = 0; i < list.length; i++) {
      roll -= list[i].w;
      if (roll < 0) return list[i].id;
    }
    return list[list.length - 1].id;
  },

  // Fills one night on every calendar venue. Changes s.
  fillDay: function (s, rng, day, venues) {
    var b = Game.balance.scene;
    var sc = Game.rules.scene;
    var dow = Game.rules.day.dayOfWeek(day);
    // Bands playing within gapDays of this night can't play it.
    var busy = {};
    s.scene.shows.forEach(function (x) {
      if (Math.abs(x.day - day) < b.gapDays) {
        busy[x.bandId] = true;
        if (x.openerId) busy[x.openerId] = true;
      }
    });
    venues.forEach(function (venue) {
      if (!rng.chance(b.showChance[venue.tier][dow])) return;
      if (sc.playerHolds(s, venue.id, day) || sc.showOn(s, venue.id, day)) return;
      var head = sc.pickBand(s, rng, venue, busy, 'headliner');
      if (!head) return;
      busy[head] = true;
      var opener = null;
      if (b.openerChance[venue.tier] && rng.chance(b.openerChance[venue.tier])) {
        opener = sc.pickBand(s, rng, venue, busy, 'opener');
        if (opener) busy[opener] = true;
      }
      s.scene.shows.push({ id: 'g' + s.scene.nextShowId, venueId: venue.id, day: day, bandId: head, openerId: opener, playerOpens: false });
      s.scene.nextShowId += 1;
    });
  },

  // Fills the calendars of every city you've unlocked, as far ahead as you can book (only nights not filled before;
  // a city you just unlocked fills from today). Changes s.
  fill: function (s) {
    var sc = Game.rules.scene;
    var last = sc.calendarEnd(s);
    var venues = sc.calendarVenues().filter(function (v) { return s.cities[v.cityId].unlocked; });
    var start = {};
    venues.forEach(function (v) {
      var f = s.scene.filled[v.cityId];
      start[v.cityId] = f === undefined || f === null ? s.day : Math.max(f + 1, s.day);
    });
    var cities = Object.keys(start);
    if (!cities.length) return;
    var from = Math.min.apply(null, cities.map(function (c) { return start[c]; }));
    if (from > last) return;
    var rng = Game.rng.create(s.scene.rngState);
    for (var d = from; d <= last; d++) {
      sc.fillDay(s, rng, d, venues.filter(function (v) { return start[v.cityId] <= d; }));
    }
    cities.forEach(function (c) { s.scene.filled[c] = last; });
    s.scene.rngState = rng.getState();
  },

  // Takes other bands' shows off a venue's night (an offer from the venue wins over them). Changes s.
  clearNight: function (s, venueId, day) {
    if (!s.scene) return;
    s.scene.shows = s.scene.shows.filter(function (x) { return !(x.venueId === venueId && x.day === day); });
  },

  // ----- Rivals and the rest of the scene, each Monday -----

  // Rivals move toward your level (plus their offset); other bands drift a little but stay about their size. Changes s.
  weeklyDrift: function (s, rng) {
    var b = Game.balance.scene;
    var sc = Game.rules.scene;
    var playerFans = Game.rules.progress.totalFans(s);
    Object.keys(s.scene.bands).forEach(function (id) {
      var band = s.scene.bands[id];
      if (band.rival) {
        var rv = b.rivals;
        var targetRep = Game.util.clamp(s.player.reputation + rv.repOffsets[band.rivalIndex], 0, Game.balance.reputation.max);
        band.reputation = Game.util.round1(Game.util.clamp(band.reputation + (targetRep - band.reputation) * rv.pull +
          rng.range(-rv.wobble, rv.wobble), 0, Game.balance.reputation.max));
        var targetFans = playerFans * rv.fanShares[band.rivalIndex];
        band.fans = Math.max(0, Math.round(band.fans + (targetFans - band.fans) * rv.pull));
        var skills = sc.skillsFor(band.reputation);
        band.musicianship = skills.musicianship;
        band.performance = skills.performance;
        band.songwriting = skills.songwriting;
      } else {
        var z = b.sizes.filter(function (x) { return x.tier === band.tier; })[0];
        band.reputation = Game.util.round1(Game.util.clamp(band.reputation + rng.range(-b.drift.rep, b.drift.rep), z.minRep, z.maxRep));
        band.fans = Math.max(0, Math.round(band.fans * (1 + rng.range(-b.drift.fanShare, b.drift.fanShare))));
      }
    });
  },

  // ----- Rivals' records -----

  // A rival puts out an EP or album today. sameWeek: true if it's the week you released one. Changes s; returns a log line.
  rivalRelease: function (s, rng, band, sameWeek) {
    var r = Game.balance.scene.releases;
    var names = Game.content.names;
    var type = rng.chance(r.albumShare) ? 'album' : 'ep';
    var quality = Math.round(Game.util.clamp((band.songwriting + band.musicianship) / 2 + rng.range(-r.qualitySpread, r.qualitySpread),
      r.minQuality, r.maxQuality));
    var rel = {
      id: 'r' + s.scene.nextReleaseId, bandId: band.id, type: type,
      name: rng.pick(names.songTitleFirst) + ' ' + rng.pick(names.songTitleSecond),
      lead: rng.pick(names.songTitleFirst) + ' ' + rng.pick(names.songTitleSecond),
      day: s.day, quality: quality, tracks: r.tracks[type],
      streams: { total: 0, weeks: [] }, lastWeek: 0, leadWeek: 0, chart: null, leadChart: null
    };
    s.scene.nextReleaseId += 1;
    s.scene.releases.push(rel);
    band.nextReleaseDay = s.day + rng.int(r.everyDays.min, r.everyDays.max);
    var typeName = Game.content.releaseTypes[type].name;
    var text = sameWeek
      ? 'Your rival ' + band.name + ' dropped their ' + typeName + ' "' + rel.name + '" the same week as yours. The charts will tell who wins.'
      : 'Your rival ' + band.name + ' released a new ' + typeName + ', "' + rel.name + '".';
    return { text: text, title: (sameWeek ? 'Same week: ' : 'New from ') + band.name + ': "' + rel.name + '"' };
  },

  // This week's streams for a rival's record (every track at your streaming formula, without boosts):
  // { perTrack, total }.
  rivalStreams: function (s, rel, day) {
    var st = Game.balance.streaming;
    var band = Game.rules.scene.band(s, rel.bandId);
    var perTrack = Math.round((band ? band.fans : 0) * st.streamsPerFan * (rel.quality / 100) * Game.rules.recording.freshness(rel, day) *
      (1 + Game.rules.label.rivalReach(band))); // a rival on a label gets its push
    return { perTrack: perTrack, total: perTrack * rel.tracks };
  },

  // Sunday: rivals' newest records get their week's streams (older ones have dropped off). Returns chart entries for
  // the singles (each record's lead single) and albums charts. Changes s.
  weeklyStreams: function (s) {
    var sc = Game.rules.scene;
    var out = { singles: [], albums: [] };
    var newest = {}; // band id: its newest records (out already today), newest first
    s.scene.releases.filter(function (rel) { return rel.day < s.day; }).sort(function (a, b) { return b.day - a.day; }).forEach(function (rel) {
      (newest[rel.bandId] = newest[rel.bandId] || []).push(rel.id);
    });
    s.scene.releases.forEach(function (rel) {
      if (rel.day >= s.day) return; // released today: streams start next Sunday, like yours
      if (newest[rel.bandId].indexOf(rel.id) >= Game.balance.scene.releases.charting) { rel.lastWeek = 0; rel.leadWeek = 0; return; }
      var w = sc.rivalStreams(s, rel, s.day);
      rel.lastWeek = w.total;
      rel.leadWeek = w.perTrack;
      rel.streams.total += w.total;
      rel.streams.weeks.push(w.total);
      rel.streams.weeks = rel.streams.weeks.slice(-Game.balance.streaming.historyWeeks);
      var artist = sc.band(s, rel.bandId).name;
      if (w.total > 0) {
        out.albums.push({ key: 'rival:' + rel.id, title: rel.name, artist: artist, streams: w.total, mine: false, bandId: rel.bandId, sceneReleaseId: rel.id });
        out.singles.push({ key: 'rivalSong:' + rel.id, title: rel.lead, artist: artist, streams: w.perTrack, mine: false, bandId: rel.bandId, sceneReleaseId: rel.id });
      }
    });
    return out;
  },

  // After the charts are built: each rival record's chart spot, peak, and weeks. Changes s.
  recordCharts: function (s) {
    var pos = { albums: {}, singles: {} };
    s.charts.albums.forEach(function (e, i) { if (e.sceneReleaseId) pos.albums[e.sceneReleaseId] = i + 1; });
    s.charts.singles.forEach(function (e, i) { if (e.sceneReleaseId) pos.singles[e.sceneReleaseId] = i + 1; });
    var spot = function (ch, p) {
      ch = ch || { pos: null, last: null, peak: null, weeks: 0, peakDay: null };
      ch.last = ch.pos;
      ch.pos = p || null;
      if (p) {
        ch.weeks += 1;
        if (!ch.peak || p < ch.peak) { ch.peak = p; ch.peakDay = s.day; }
      }
      return ch;
    };
    s.scene.releases.forEach(function (rel) {
      if (rel.chart || pos.albums[rel.id]) rel.chart = spot(rel.chart, pos.albums[rel.id]);
      if (rel.leadChart || pos.singles[rel.id]) rel.leadChart = spot(rel.leadChart, pos.singles[rel.id]);
    });
  },

  // The scene band for a chart entry by another act: bigger hits go to bigger bands (give or take a few places).
  // Rivals only chart with their real records. kind: 'single' or 'album'.
  chartArtist: function (s, rng, kind, streams) {
    var c = Game.balance.charts;
    var top = kind === 'single' ? c.singleTop : c.albumTop;
    var list = Object.keys(s.scene.bands).map(function (id) { return s.scene.bands[id]; })
      .filter(function (band) { return !band.rival; })
      .sort(function (a, b) { return b.fans - a.fans || (a.id < b.id ? -1 : 1); });
    var share = Math.max(0, Math.min(1, streams / top));
    var index = Math.floor((1 - Math.sqrt(share)) * (list.length - 1)) + (rng ? rng.int(-c.artistWobble, c.artistWobble) : 0);
    return list[Game.util.clamp(index, 0, list.length - 1)];
  },

  // ----- Tickets -----

  ticketPrice: function (venue) { return Game.balance.venues.tiers[venue.tier].ticket; },

  // Why you can't buy a ticket to a show, or null if you can.
  ticketProblem: function (state, showId) {
    var show = Game.rules.scene.showById(state, showId);
    if (!show) return 'That show isn\'t on the calendar any more.';
    if (show.day < state.day) return 'That show is over.';
    if (show.playerOpens) return 'You\'re opening that show.';
    var venue = Game.content.venues[show.venueId];
    var trip = Game.rules.travel.tripAt(state, show.day, 'evening');
    if (venue.cityId === 'hometown') {
      if (trip) return 'You\'ll be on the road that night.';
    } else if (!trip || trip.cities.indexOf(venue.cityId) === -1) {
      return 'You can only see shows in ' + Game.content.cities[venue.cityId].name + ' while you\'re there on a trip.';
    }
    var plan = state.schedule[show.day];
    var entry = plan && plan.evening && state.entries[plan.evening];
    if (entry && entry.type === 'ticket') return 'You already have a ticket for that night.';
    if (entry && entry.type !== 'action') return 'Something is booked that evening.';
    var taken = Game.rules.booking.blockTaken(state, show.day, 'evening', true);
    if (taken) return taken + '.';
    return null;
  },

  // Buys a ticket: paid now (no refunds), and the evening goes on your calendar. A task planned that evening gives way.
  // Returns { state, log }.
  buyTicket: function (state, showId) {
    var problem = Game.rules.scene.ticketProblem(state, showId);
    if (problem) return { state: state, log: [problem] };
    var show = Game.rules.scene.showById(state, showId);
    var venue = Game.content.venues[show.venueId];
    var price = Game.rules.scene.ticketPrice(venue);
    var s = Game.util.clone(state);
    var log = [];
    var planned = s.schedule[show.day] && s.schedule[show.day].evening;
    if (planned && s.entries[planned] && s.entries[planned].type === 'action') {
      log.push('It replaces your planned ' + Game.content.actions[s.entries[planned].actionId].name + ' that evening.');
      delete s.entries[planned];
    }
    s = Game.rules.money.spend(s, price, 'tickets').state;
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    s.entries[id] = { id: id, day: show.day, block: 'evening', type: 'ticket', showId: show.id, venueId: show.venueId,
      bandId: show.bandId, openerId: show.openerId, price: price };
    s.schedule[show.day] = s.schedule[show.day] || {};
    s.schedule[show.day].evening = id;
    log.unshift('Bought a ticket: ' + Game.rules.scene.billText(s, show) + ' at ' + venue.name + ', ' +
      Game.rules.day.shortDate(show.day) + ' ($' + price + ').');
    return { state: s, log: log };
  },

  // Gives a ticket away (no refund). Returns { state, log }.
  cancelTicket: function (state, entryId) {
    var entry = state.entries[entryId];
    if (!entry || entry.type !== 'ticket') return { state: state, log: ['That ticket isn\'t on your calendar.'] };
    var s = Game.util.clone(state);
    delete s.entries[entryId];
    if (s.schedule[entry.day]) delete s.schedule[entry.day][entry.block];
    return { state: s, log: ['You gave the ticket away (no refund).'] };
  },

  // The night of the show (from End Day): energy, Networking (and a little Musicianship and Performance), a lift in
  // morale, and a chance to meet someone (better in bigger rooms). Returns { state, log }.
  attend: function (state, entry) {
    var b = Game.balance.scene.show;
    var venue = Game.content.venues[entry.venueId];
    var band = Game.rules.scene.band(state, entry.bandId);
    var networkingAtStart = state.player.skills.networking;
    var s = Game.util.clone(state);
    s.player.energy = Game.rules.energy.clamp(s.player.energy - b.energy);
    var gains = [];
    [['networking', b.networking], ['musicianship', b.musicianship], ['performance', b.performance]].forEach(function (g) {
      var t = Game.rules.skills.train(s, g[0], g[1]);
      s = t.state;
      if (t.gain > 0) gains.push('+' + Game.util.round1(t.gain) + ' ' + Game.content.skills[g[0]]);
    });
    var lifted = Game.rules.morale.change(s, b.morale);
    s = lifted.state;
    var chance = Math.min(1, Game.rules.people.meetChance(networkingAtStart) + venue.tier * b.meetBonusPerTier);
    var met = Game.rules.people.tryMeet(s, chance);
    s = met.state;
    var line = 'Saw ' + (band ? band.name : 'the show') + ' at ' + venue.name + ': ' + gains.concat(['+' + b.morale + ' morale', '-' + b.energy + ' energy']).join(', ') + '.';
    var log = [line].concat(lifted.log);
    if (met.personId) log.push('You met ' + s.people[met.personId].name + ' in the crowd.');
    else log.push('You didn\'t meet anyone new.');
    return { state: s, log: log };
  },

  // ----- Each night (from End Day, after the new day starts) -----

  // Past shows come off the calendars; on January 1 bands start counting this year's new fans; on Mondays the scene
  // drifts and rivals move toward your level; rivals may put out records (sometimes the same week as yours) and grab
  // opening slots you haven't answered; and calendars are filled as far ahead as you can book. Returns { state, log }.
  nightly: function (state) {
    var sc = Game.rules.scene;
    var b = Game.balance.scene;
    var s = Game.util.clone(state);
    var log = [];
    var notes = [];
    var rng = Game.rng.create(s.scene.rngState);

    s.scene.shows = s.scene.shows.filter(function (x) { return x.day >= s.day; });

    if (Game.rules.day.isNewYear(s.day)) {
      Object.keys(s.scene.bands).forEach(function (id) { s.scene.bands[id].yearStartFans = s.scene.bands[id].fans; });
    }
    if (Game.rules.day.dayOfWeek(s.day) === 0) {
      sc.weeklyDrift(s, rng);
      Game.rules.label.rivalSignings(s, rng).forEach(function (note) { notes.push(note); }); // rivals sign with labels too
    }

    // Rivals' records: when it's time, or (sometimes) the same week as an EP or album you put out yesterday.
    var ready = sc.rivals(s).filter(function (band) { return band.reputation >= b.releases.minRep; });
    ready.forEach(function (band) {
      if (band.nextReleaseDay !== null && band.nextReleaseDay <= s.day) notes.push(sc.rivalRelease(s, rng, band, false));
    });
    var yours = s.releases.filter(function (r) { return r.day === s.day - 1 && r.type !== 'single'; });
    if (yours.length && ready.length && rng.chance(b.releases.sameWeekChance)) {
      notes.push(sc.rivalRelease(s, rng, rng.pick(ready), true));
    }

    // Opening slots: a rival may grab one you haven't answered; slots you declined or let expire go to a rival.
    // (Rivals big enough for small rooms go first; early on, any rival will do.)
    var rivals = sc.rivals(s).filter(function (band) { return sc.sizeOf(band.reputation) >= 1; });
    if (!rivals.length) rivals = sc.rivals(s);
    s.inbox.forEach(function (m) {
      // (Slots you accepted are yours: skip them, so they don't roll the scene's dice every night.)
      if (m.kind !== 'opening' || !m.data.showId || m.data.filled || m.resolved === 'accepted') return;
      var show = sc.showById(s, m.data.showId);
      var rival = rng.pick(rivals);
      if (!m.resolved && rng.chance(b.stealChance)) {
        m.resolved = 'taken';
        m.data.filled = true;
        m.data.takenBy = rival.id;
        if (show) show.openerId = rival.id;
        notes.push({ title: rival.name + ' took the opening slot', text: 'You waited too long: your rival ' + rival.name +
          ' grabbed the opening slot at ' + Game.content.venues[m.data.venueId].name + ' on ' + Game.rules.day.dateLabel(m.data.day) + '.' });
        log.push(rival.name + ' took the opening slot at ' + Game.content.venues[m.data.venueId].name + '.');
      } else if (m.resolved === 'declined' || m.resolved === 'expired') {
        m.data.filled = true;
        m.data.takenBy = rival.id;
        if (show && !show.playerOpens) show.openerId = rival.id;
      }
    });

    s.scene.rngState = rng.getState();
    sc.fill(s);
    notes.forEach(function (note) {
      s = Game.rules.booking.addInbox(s, 'note', { title: note.title, text: note.text }, null);
      if (note.text) log.push(note.text);
    });
    return { state: s, log: log };
  },

  // ----- Older saves -----

  // For a save from before the scene (version 19 or older), after a fresh scene was added from its seed: the rivals
  // catch up to your level, bands start this year's count, the chart's other acts become scene bands, and the venue
  // calendars fill. Changes s.
  catchUp: function (s) {
    var sc = Game.rules.scene;
    var b = Game.balance.scene;
    var rng = Game.rng.create(s.scene.rngState);
    var fans = Game.rules.progress.totalFans(s);
    sc.rivals(s).forEach(function (band) {
      band.reputation = Game.util.clamp(s.player.reputation + b.rivals.repOffsets[band.rivalIndex], 0, Game.balance.reputation.max);
      band.fans = Math.round(fans * b.rivals.fanShares[band.rivalIndex]);
      var skills = sc.skillsFor(band.reputation);
      band.musicianship = skills.musicianship;
      band.performance = skills.performance;
      band.songwriting = skills.songwriting;
      band.nextReleaseDay = s.day + rng.int(0, b.releases.everyDays.max);
    });
    Object.keys(s.scene.bands).forEach(function (id) { s.scene.bands[id].yearStartFans = s.scene.bands[id].fans; });
    s.scene.rngState = rng.getState();
    sc.renameClash(s);
    var byKey = {};
    ['singles', 'albums'].forEach(function (key) {
      var kind = key === 'singles' ? 'single' : 'album';
      s.charts.pool[key].forEach(function (e) {
        var band = sc.chartArtist(s, null, kind, e.streams);
        e.bandId = band.id;
        e.artist = band.name;
        byKey[e.id] = e;
      });
      s.charts[key].forEach(function (e) {
        if (e.mine) return;
        var from = byKey[e.key];
        var band = from ? s.scene.bands[from.bandId] : sc.chartArtist(s, null, kind, e.streams);
        e.bandId = band.id;
        e.artist = band.name;
      });
    });
    s.scene.filled = {};
    sc.fill(s);
  },

  // ----- The Career screen's Rivals panel -----

  // You and your rivals side by side: [{ name, you, fame, fans, reputation, latest, bestChart, awards, next }].
  rivalRows: function (state) {
    var sc = Game.rules.scene;
    var year = Game.rules.awards.year(state.day);
    var thisYear = function (ch) { return ch && ch.peak && ch.peakDay !== null && Game.rules.awards.year(ch.peakDay) === year ? ch.peak : null; };
    var best = function (list) { return list.filter(function (x) { return x; }).sort(function (a, b) { return a - b; })[0] || null; };

    var myLatest = state.releases.slice().sort(function (a, b) { return b.day - a.day; })[0] || null;
    var myCharts = state.releases.map(function (r) { return r.type === 'single' ? null : thisYear(r.chart); })
      .concat(Object.keys(state.songs).map(function (id) { return thisYear(state.songs[id].chart); }));
    var myNext = Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'gig' && e.day >= state.day; }).sort(function (a, b) { return a.day - b.day; })[0];
    var rows = [{
      name: state.band.name || state.player.name, you: true, fame: Game.rules.progress.fame(state).name,
      label: state.label.deal ? Game.rules.label.name(state.label.deal.labelId) : null,
      fans: Game.rules.progress.totalFans(state), reputation: state.player.reputation,
      latest: myLatest ? { name: myLatest.name, type: myLatest.type, day: myLatest.day } : null,
      bestChart: best(myCharts),
      awards: state.awards.filter(function (n) { return n.won; }).length,
      next: myNext ? { day: myNext.day, venueId: myNext.venueId, opening: myNext.deal === 'opening' } : null
    }];
    sc.rivals(state).forEach(function (band) {
      var rels = state.scene.releases.filter(function (r) { return r.bandId === band.id; }).sort(function (a, b) { return b.day - a.day; });
      var next = state.scene.shows.filter(function (x) { return (x.bandId === band.id || x.openerId === band.id) && x.day >= state.day; })
        .sort(function (a, b) { return a.day - b.day; })[0];
      rows.push({
        name: band.name, you: false, fame: sc.fameName(band.fans), fans: band.fans, reputation: band.reputation,
        label: band.labelId && Game.content.labels[band.labelId] ? Game.rules.label.name(band.labelId) : null,
        latest: rels[0] ? { name: rels[0].name, type: rels[0].type, day: rels[0].day } : null,
        bestChart: best(rels.map(function (r) { return thisYear(r.chart); }).concat(rels.map(function (r) { return thisYear(r.leadChart); }))),
        awards: band.awardsWon,
        next: next ? { day: next.day, venueId: next.venueId, opening: next.openerId === band.id,
          headliner: next.openerId === band.id ? sc.band(state, next.bandId).name : null } : null
      });
    });
    return rows;
  }
};
