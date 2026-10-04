// recording.js
// Rules for recording songs (studio bookings and home recording), releasing singles, EPs, and albums,
// and streaming money every Sunday. Numbers are in balance.recording, balance.releases, balance.streaming.
//
// A studio session is a calendar entry:
//   state.entries[id] = { id, day, block, type: 'studio', studio, songId, status: 'booked' }
// A recorded song has song.recording = { quality, day, studio }.
// A release is { id, type: 'single' | 'ep' | 'album', songIds, day, avgQuality } in state.releases.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.recording = {

  // ----- Recording -----

  // Recording quality = 0.5 x song quality + 0.25 x band musicianship + 0.25 x tightness + studio bonus.
  // Home recordings are capped at 40.
  quality: function (state, song, studioId) {
    var r = Game.balance.recording;
    var studio = r.studios[studioId];
    var q = r.songQualityWeight * song.quality +
      r.bandMusicianshipWeight * Game.rules.people.bandMusicianship(state) +
      r.tightnessWeight * song.tightness + studio.bonus;
    if (studio.qualityCap !== undefined) q = Math.min(q, studio.qualityCap);
    return Math.round(q);
  },

  // Songs you can record: finished originals.
  recordable: function (state) {
    return Game.rules.songs.playable(state).filter(function (s) { return !s.isCover; });
  },

  // Why a studio can't be booked, or null. (Home recording isn't booked: it's the "Record at home" action.)
  studioProblem: function (state, studioId) {
    var studio = Game.balance.recording.studios[studioId];
    if (!studio || studioId === 'home') return 'Pick a studio.';
    if (studio.minReputation && state.player.reputation < studio.minReputation) {
      return 'Needs reputation ' + studio.minReputation + ' (you have ' + Math.floor(state.player.reputation) + ').';
    }
    if (studio.needsLabel) return 'Needs a label deal.';
    return null;
  },

  // The days you can book a studio: 10 to 28 days from today.
  bookingDays: function (state) {
    var r = Game.balance.recording;
    var days = [];
    for (var d = state.day + r.bookAheadDays; d <= state.day + r.bookAheadMaxDays; d++) days.push(d);
    return days;
  },

  // Why a block can't hold a studio session, or null if it's free.
  blockProblem: function (state, day, block) {
    var plan = state.schedule[day];
    var entry = plan && plan[block] && state.entries[plan[block]];
    if (entry && entry.type === 'gig') return 'A show is booked then.';
    if (entry && entry.type === 'studio') return 'Studio time is already booked then.';
    if (entry && entry.type === 'sessionWork') return 'Session work is booked then.';
    var taken = Game.rules.booking.blockTaken(state, day, block);
    return taken ? taken + '.' : null;
  },

  // Why a studio booking request doesn't work, or null.
  // request: { studio, day, sessions: [{ block, songId }], jobChoice } (jobChoice: for sessions on job blocks).
  requestProblem: function (state, request) {
    var r = Game.balance.recording;
    if (!request) return 'Pick a studio, a day, and songs.';
    var studioProblem = Game.rules.recording.studioProblem(state, request.studio);
    if (studioProblem) return studioProblem;
    if (Game.rules.recording.bookingDays(state).indexOf(request.day) === -1) {
      return 'Studio time is booked ' + r.bookAheadDays + ' to ' + r.bookAheadMaxDays + ' days ahead.';
    }
    var sessions = request.sessions || [];
    if (sessions.length < 1 || sessions.length > r.maxBlocksPerBooking) return 'Pick 1 to ' + r.maxBlocksPerBooking + ' songs to record.';
    var recordable = Game.rules.recording.recordable(state).map(function (s) { return s.id; });
    var blocks = [];
    var songs = [];
    var needsDayOff = false;
    for (var i = 0; i < sessions.length; i++) {
      var sess = sessions[i];
      if (Game.balance.time.blocks.indexOf(sess.block) === -1 || blocks.indexOf(sess.block) !== -1) return 'One song per block.';
      if (recordable.indexOf(sess.songId) === -1) return 'Only finished originals can be recorded.';
      if (songs.indexOf(sess.songId) !== -1) return 'Each song only once per booking.';
      var problem = Game.rules.recording.blockProblem(state, request.day, sess.block);
      if (problem) return problem;
      if (Game.rules.booking.clashesWithJob(state, request.day, sess.block)) needsDayOff = true;
      blocks.push(sess.block);
      songs.push(sess.songId);
    }
    if (needsDayOff) {
      if (!request.jobChoice) return 'Those blocks are during your day job: choose how you\'ll take the day off.';
      return Game.rules.job.dayOffProblem(state, request.day, request.jobChoice, true);
    }
    return null;
  },

  // Books studio sessions onto the calendar (called at End Day when the "Book studio time" block happens).
  // A task planned in those blocks gives way. Returns { state, log }.
  bookSessions: function (state, request) {
    var problem = Game.rules.recording.requestProblem(state, request);
    if (problem) return { state: state, log: ['Didn\'t book the studio: ' + problem] };
    var s = Game.util.clone(state);
    var log = [];
    var needsDayOff = request.sessions.some(function (sess) { return Game.rules.booking.clashesWithJob(s, request.day, sess.block); });
    if (needsDayOff) s = Game.rules.job.takeDayOff(s, request.day, request.jobChoice, true).state;
    s.schedule[request.day] = s.schedule[request.day] || {};
    request.sessions.forEach(function (sess) {
      var planned = s.schedule[request.day][sess.block];
      if (planned && s.entries[planned] && s.entries[planned].type === 'action') {
        log.push('Studio time replaces your planned ' + Game.content.actions[s.entries[planned].actionId].name + '.');
        delete s.entries[planned];
      }
      var id = 'e' + s.nextEntryId;
      s.nextEntryId += 1;
      s.entries[id] = { id: id, day: request.day, block: sess.block, type: 'studio', studio: request.studio, songId: sess.songId, status: 'booked' };
      s.schedule[request.day][sess.block] = id;
    });
    log.unshift('Booked ' + request.sessions.length + ' block' + (request.sessions.length === 1 ? '' : 's') + ' at the ' +
      Game.content.studios[request.studio].name + ' on ' + Game.rules.day.dateLabel(request.day) + '.');
    return { state: s, log: log };
  },

  // Cancels a studio session (free: studios don't charge until you record). A day off taken for it
  // is given back if no other session or show still needs it. Returns { state, log }.
  cancelSession: function (state, entryId) {
    var e = state.entries[entryId];
    if (!e || e.type !== 'studio') return { state: state, log: ['That session isn\'t booked.'] };
    var s = Game.util.clone(state);
    delete s.entries[entryId];
    delete s.schedule[e.day][e.block];
    if (!Game.rules.job.dayOffNeeded(s, e.day) && s.player.job.daysOff[e.day]) s = Game.rules.job.cancelDayOff(s, e.day).state;
    return { state: s, log: ['Cancelled studio time on ' + Game.rules.day.dateLabel(e.day) + '.'] };
  },

  // Records a song (in a studio session, or at home). Pays the studio for the block, works out the
  // recording quality, and keeps the better recording if the song was recorded before.
  // Returns { state, log, quality }.
  record: function (state, songId, studioId) {
    var studio = Game.balance.recording.studios[studioId];
    var s = Game.util.clone(state);
    var song = s.songs[songId];
    if (!song || song.isCover || song.quality === null) return { state: state, log: ['That song can\'t be recorded.'], quality: null };
    if (studio.cost > 0) s = Game.rules.money.spend(s, studio.cost, 'studio').state;
    var q = Game.rules.recording.quality(s, s.songs[songId], studioId);
    var before = s.songs[songId].recording;
    var kept = !before || q >= before.quality;
    if (kept) s.songs[songId].recording = { quality: q, day: s.day, studio: studioId };
    s.songs[songId].lastPlayedDay = s.day;
    var name = Game.content.studios[studioId].name;
    var line = 'Recorded "' + song.title + '" at the ' + name + ': recording quality ' + q +
      (studio.cost ? ' (-$' + studio.cost + ')' : '') +
      (kept ? '' : ' (your earlier recording at ' + before.quality + ' was better, so you kept that one)') + '.';
    return { state: s, log: [line], quality: q };
  },

  // The next booked studio session (soonest first), or null.
  nextSession: function (state) {
    return Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'studio'; })
      .sort(function (a, b) { return a.day - b.day; })[0] || null;
  },

  // ----- Releases -----

  // Recorded originals that haven't been released yet.
  releasable: function (state) {
    return Game.rules.recording.recordable(state).filter(function (s) { return s.recording && !s.releaseId; });
  },

  // Why a release doesn't work, or null.
  releaseProblem: function (state, type, songIds) {
    var size = Game.balance.releases.sizes[type];
    if (!size) return 'Pick Single, EP, or Album.';
    if (!Array.isArray(songIds) || songIds.length < size.min || songIds.length > size.max) {
      return 'A ' + Game.content.releaseTypes[type].name + ' needs ' + (size.min === size.max ? size.min : size.min + ' to ' + size.max) + ' recorded songs.';
    }
    var ok = Game.rules.recording.releasable(state).map(function (s) { return s.id; });
    for (var i = 0; i < songIds.length; i++) {
      if (ok.indexOf(songIds[i]) === -1) return 'Only recorded songs that haven\'t been released yet.';
      if (songIds.indexOf(songIds[i]) !== i) return 'Each song only once.';
    }
    return null;
  },

  // What a release would do, without doing it: { avgQuality, buzz, halved, reputation, fansPerCity: { cityId: about } }.
  releasePreview: function (state, type, songIds) {
    var b = Game.balance.releases;
    var avg = songIds.reduce(function (sum, id) { return sum + state.songs[id].recording.quality; }, 0) / songIds.length;
    var last = state.releases[state.releases.length - 1];
    var halved = !!last && state.day - last.day < b.spamWindowWeeks * Game.balance.time.daysPerWeek;
    var buzz = avg / b.buzzQualityDivisor * b.sizeBonus[type] * (halved ? b.spamBuzzMultiplier : 1);
    var fans = {};
    Object.keys(state.cities).forEach(function (id) {
      if (state.cities[id].fans > 0) fans[id] = state.cities[id].fans * b.newFansRate * (avg / b.newFansQualityDivisor);
    });
    var rep = avg / b.reputationQualityDivisor * (1 - state.player.reputation / Game.balance.reputation.diminishingDivisor);
    return { avgQuality: avg, buzz: buzz, halved: halved, reputation: rep, fansPerCity: fans };
  },

  // Releases a Single, EP, or Album: buzz and new fans in every city where you have fans (half the buzz if
  // your last release was under 4 weeks ago), and a reputation boost. Streaming starts next Sunday.
  // Returns { state, log }.
  release: function (state, type, songIds) {
    var problem = Game.rules.recording.releaseProblem(state, type, songIds);
    if (problem) return { state: state, log: [problem] };
    var preview = Game.rules.recording.releasePreview(state, type, songIds);
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var gained = 0;
    Object.keys(preview.fansPerCity).forEach(function (id) {
      var added = Game.rules.audience.addFans(s, id, Game.rules.gigs.roundFans(rng, preview.fansPerCity[id])); // capped at the fan ceiling
      s = added.state;
      var n = added.added;
      s.cities[id].lastActivityDay = s.day;
      gained += n;
      s = Game.rules.audience.addBuzz(s, id, preview.buzz).state;
    });
    s.rngState = rng.getState();
    s.player.reputation = Game.util.clamp(s.player.reputation + preview.reputation, 0, Game.balance.reputation.max);
    var id = 'rel' + s.nextReleaseId;
    s.nextReleaseId += 1;
    s.releases.push({ id: id, type: type, songIds: songIds.slice(), day: s.day, avgQuality: preview.avgQuality });
    songIds.forEach(function (songId) { s.songs[songId].releaseId = id; });
    var name = Game.content.releaseTypes[type].name;
    var u = Game.util;
    var cities = Object.keys(preview.fansPerCity).length;
    return {
      state: s,
      log: ['Released your ' + name + '! ' +
        (cities ? u.signed(preview.buzz) + ' buzz' + (preview.halved ? ' (halved: your last release was under ' + Game.balance.releases.spamWindowWeeks + ' weeks ago)' : '') +
          ', +' + gained + ' fan' + (gained === 1 ? '' : 's') + ', ' : 'No fans yet to hear it, so no buzz or new fans. ') +
        u.signed(preview.reputation) + ' reputation. Streaming money starts next Sunday.']
    };
  },

  // ----- Streaming -----

  // A release's freshness on a given day: 1 at first, x 0.97 for each full week, never below 0.3.
  freshness: function (release, day) {
    var b = Game.balance.streaming;
    var weeks = Math.max(0, Math.floor((day - release.day - 1) / Game.balance.time.daysPerWeek));
    return Math.max(b.freshnessMin, b.freshnessStart * Math.pow(1 - b.freshnessDropPerWeek, weeks));
  },

  // This Sunday's streaming money: for each released song,
  //   total fans x 0.02 x (recording quality / 100) x freshness.
  // Only releases from before that day count (a release on Sunday starts paying next Sunday).
  // day: optional, the Sunday to work it out for (leave out for today).
  streamingPay: function (state, day) {
    var b = Game.balance.streaming;
    if (day === undefined) day = state.day;
    var fans = Game.rules.progress.totalFans(state);
    var total = 0;
    state.releases.forEach(function (rel) {
      if (rel.day >= day) return;
      var fresh = Game.rules.recording.freshness(rel, day);
      rel.songIds.forEach(function (id) {
        var song = state.songs[id];
        if (song && song.recording) total += fans * b.payPerFan * (song.recording.quality / 100) * fresh;
      });
    });
    return Math.round(total);
  },

  // The next Sunday's streaming (on a Sunday, the one a week later) and about how much it will pay,
  // with today's fans. Returns { day, pay }.
  streamingEstimate: function (state) {
    var day = state.day + (Game.rules.day.daysUntilBills(state) || Game.balance.time.daysPerWeek);
    return { day: day, pay: Game.rules.recording.streamingPay(state, day) };
  },

  // Sunday night: pays streaming money. Returns { state, log }.
  payStreaming: function (state) {
    var pay = Game.rules.recording.streamingPay(state);
    if (!state.releases.length) return { state: state, log: [] };
    var s = pay > 0 ? Game.rules.money.earn(state, pay, 'streaming').state : state;
    return { state: s, log: ['Streaming: +$' + pay + ' this week.'] };
  }
};
