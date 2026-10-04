// sessionWork.js
// Session work: sitting in on another band's recording. Once your Musicianship and reputation are high
// enough, an offer can arrive in the Inbox: a few studio sessions over a few days, a flat fee per session,
// and (if you play every session) a small share of the song's streaming money once the band releases it.
// Numbers are in balance.sessionWork.
//
// Inbox messages:
//   kind 'sessionWork':        data { bandName, songTitle, fee, quality, bandFans, sessions: [{ day, block }] }
//   kind 'sessionRelease':     data { workId }   (news: the band released the song, your share starts)
// Each accepted job lives in state.sessionWork[id] (shape in state.js), and each session is a calendar
// entry { type: 'sessionWork', workId } (a commitment, like studio time).

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.sessionWork = {

  // True if bands would ask you to play on their recordings.
  eligible: function (state) {
    var w = Game.balance.sessionWork;
    return state.player.skills.musicianship >= w.minMusicianship && state.player.reputation >= w.minReputation;
  },

  // Why a block can't hold a session, or null if it's free: day-job blocks (even on a day off) and
  // anything booked or waiting on a reply are off limits. A planned task is fine (the session replaces it).
  slotProblem: function (state, day, block) {
    if (Game.rules.job.scheduledOn(state, day) && Game.balance.job.jobBlocks.indexOf(block) !== -1) return 'You work then.';
    var plan = state.schedule[day];
    var entry = plan && plan[block] && state.entries[plan[block]];
    if (entry && entry.type !== 'action') return 'Something is booked then.';
    var taken = Game.rules.booking.blockTaken(state, day, block);
    return taken ? taken + '.' : null;
  },

  // Picks the session times for an offer: one block each, over 2 to 4 different days in the next 3 to 10 days.
  // Returns [{ day, block }] in time order, or null if your calendar is too full.
  findSlots: function (state, rng) {
    var w = Game.balance.sessionWork;
    var blocks = Game.balance.time.blocks;
    var free = {}; // day: [free blocks]
    var days = [];
    for (var d = state.day + w.daysAhead.min; d <= state.day + w.daysAhead.max; d++) {
      var open = blocks.filter(function (block) { return !Game.rules.sessionWork.slotProblem(state, d, block); });
      if (open.length) { free[d] = open; days.push(d); }
    }
    var dayCount = Math.min(rng.int(w.days.min, w.days.max), w.sessions, days.length);
    if (dayCount < w.days.min) return null;

    // Pick the days, then one session on each, then any extra sessions in other free blocks of those days.
    // (On a workday only the evening is free, so if the chosen days don't have room for every session,
    // another day is added, up to the most days allowed.)
    var chosenDays = [];
    var room = function () { return chosenDays.reduce(function (sum, day) { return sum + free[day].length; }, 0); };
    var mostDays = Math.min(w.days.max, w.sessions, days.length);
    while (chosenDays.length < dayCount || (room() < w.sessions && chosenDays.length < mostDays)) {
      var pick = rng.pick(days.filter(function (x) { return chosenDays.indexOf(x) === -1; }));
      chosenDays.push(pick);
    }
    var slots = chosenDays.map(function (day) {
      var block = rng.pick(free[day]);
      free[day] = free[day].filter(function (b) { return b !== block; });
      return { day: day, block: block };
    });
    while (slots.length < w.sessions) {
      var spare = chosenDays.filter(function (day) { return free[day].length; });
      if (!spare.length) return null;
      var extraDay = rng.pick(spare);
      var extraBlock = rng.pick(free[extraDay]);
      free[extraDay] = free[extraDay].filter(function (b) { return b !== extraBlock; });
      slots.push({ day: extraDay, block: extraBlock });
    }
    return slots.sort(function (a, b) { return a.day - b.day || blocks.indexOf(a.block) - blocks.indexOf(b.block); });
  },

  // Each morning: maybe a band asks you to play on their recording (one open offer at a time). Returns { state, log }.
  // force: true to skip the requirements and the chance (the debug panel's "Session work offer" button).
  roll: function (state, force) {
    var w = Game.balance.sessionWork;
    var names = Game.content.names;
    if (!force && !Game.rules.sessionWork.eligible(state)) return { state: state, log: [] };
    if (state.inbox.some(function (m) { return m.kind === 'sessionWork' && !m.resolved; })) return { state: state, log: [] };
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var log = [];
    if (force || rng.chance(w.dailyChance)) {
      var sessions = Game.rules.sessionWork.findSlots(s, rng);
      var data = {
        bandName: 'The ' + rng.pick(names.bandNameFirst) + ' ' + rng.pick(names.bandNameSecond),
        songTitle: rng.pick(names.songTitleFirst) + ' ' + rng.pick(names.songTitleSecond),
        fee: rng.int(w.fee.min / w.feeRoundTo, w.fee.max / w.feeRoundTo) * w.feeRoundTo, // a round number
        quality: rng.int(w.songQuality.min, w.songQuality.max),
        bandFans: rng.int(w.bandFans.min, w.bandFans.max),
        sessions: sessions
      };
      if (sessions) {
        s = Game.rules.booking.addInbox(s, 'sessionWork', data, Math.min(s.day + w.expiryDays, sessions[0].day - 1));
        log.push(data.bandName + ' want you to play on their recording. Check your Inbox.');
      }
    }
    s.rngState = rng.getState();
    return { state: s, log: log };
  },

  // Why a session work offer can't be accepted right now, or null.
  acceptProblem: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'sessionWork') return 'That offer isn\'t open.';
    for (var i = 0; i < m.data.sessions.length; i++) {
      var slot = m.data.sessions[i];
      var problem = Game.rules.sessionWork.slotProblem(state, slot.day, slot.block);
      if (problem) return Game.rules.day.dateLabel(slot.day) + ' ' + Game.content.calendar.blockNames[slot.block].toLowerCase() + ': ' + problem;
    }
    return null;
  },

  // Accepts session work: every session goes on the calendar (replacing any task planned there). Returns { state, log }.
  accept: function (state, messageId) {
    var problem = Game.rules.sessionWork.acceptProblem(state, messageId);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    var m = s.inbox.filter(function (x) { return x.id === messageId; })[0];
    var d = m.data;
    var workId = 'w' + s.nextSessionWorkId;
    s.nextSessionWorkId += 1;
    s.sessionWork[workId] = {
      id: workId, bandName: d.bandName, songTitle: d.songTitle, fee: d.fee, quality: d.quality, bandFans: d.bandFans,
      sessions: d.sessions.length, played: 0, missed: 0, status: 'booked', releaseDay: null, announced: false
    };
    d.sessions.forEach(function (slot) {
      s.schedule[slot.day] = s.schedule[slot.day] || {};
      var planned = s.schedule[slot.day][slot.block];
      if (planned) delete s.entries[planned];
      var id = 'e' + s.nextEntryId;
      s.nextEntryId += 1;
      s.entries[id] = { id: id, day: slot.day, block: slot.block, type: 'sessionWork', workId: workId, status: 'booked' };
      s.schedule[slot.day][slot.block] = id;
    });
    m.resolved = 'accepted';
    m.read = true;
    return { state: s, log: ['Booked: ' + d.sessions.length + ' sessions with ' + d.bandName + ' ($' + d.fee + ' each). They\'re on your Calendar.'] };
  },

  // Plays one session (called at End Day; the energy is taken there). At 0 energy you miss it: no pay,
  // and no streaming share for this song. After the last session the band schedules the release.
  // Returns { state, log, missed }.
  playSession: function (state, entry, energy) {
    var w = Game.balance.sessionWork;
    var s = Game.util.clone(state);
    var work = s.sessionWork[entry.workId];
    var log = [];
    var missed = energy <= 0;
    if (missed) {
      work.missed += 1;
      log.push('You were too worn out to make the session with ' + work.bandName + ': no pay, and no streaming share for this song.');
    } else {
      work.played += 1;
      s = Game.rules.money.earn(s, work.fee, 'sessionWork').state;
      var base = Game.balance.skills.baseGain.sessionWork;
      var gains = [];
      Object.keys(base).forEach(function (skill) {
        var trained = Game.rules.skills.train(s, skill, base[skill], energy);
        s = trained.state;
        gains.push(Game.util.signed(trained.gain) + ' ' + Game.content.skills[skill]);
      });
      work = s.sessionWork[entry.workId];
      log.push('Session with ' + work.bandName + ' (' + work.played + ' of ' + work.sessions + '): +$' + work.fee + ', ' + gains.join(', ') + '.');
    }
    if (work.played + work.missed >= work.sessions) {
      work.status = 'done';
      if (work.missed === 0) {
        var rng = Game.rng.create(s.rngState);
        work.releaseDay = s.day + rng.int(w.releaseAfterWeeks.min, w.releaseAfterWeeks.max) * Game.balance.time.daysPerWeek;
        s.rngState = rng.getState();
        log.push('That\'s a wrap. "' + work.songTitle + '" comes out around ' + Game.rules.day.dateLabel(work.releaseDay) +
          ', and you\'ll get ' + Math.round(w.streamingShare * 100) + '% of its streaming money.');
      }
    }
    return { state: s, log: log, missed: missed };
  },

  // Cancels the rest of a session work job (no penalty: you just lose the pay and the streaming share).
  // Returns { state, log }.
  cancel: function (state, workId) {
    var work = state.sessionWork[workId];
    if (!work || work.status !== 'booked') return { state: state, log: ['That session work isn\'t booked.'] };
    var s = Game.util.clone(state);
    Object.keys(s.entries).forEach(function (id) {
      var e = s.entries[id];
      if (e.type === 'sessionWork' && e.workId === workId) {
        delete s.entries[id];
        delete s.schedule[e.day][e.block];
      }
    });
    s.sessionWork[workId].status = 'cancelled';
    return { state: s, log: ['Cancelled the rest of the sessions with ' + work.bandName + '.'] };
  },

  // Each morning: songs you played on that come out today get a note in the Inbox. Returns { state, log }.
  processReleases: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    Object.keys(s.sessionWork).forEach(function (id) {
      var work = s.sessionWork[id];
      if (work.releaseDay === null || work.announced || work.releaseDay > s.day) return;
      work.announced = true;
      s = Game.rules.booking.addInbox(s, 'sessionRelease', { workId: id }, null);
      log.push(work.bandName + ' released "' + work.songTitle + '". Your streaming share starts this Sunday.');
    });
    return { state: s, log: log };
  },

  // Songs you earn a streaming share from on a given day: played every session, and released before that day.
  creditedSongs: function (state, day) {
    return Object.keys(state.sessionWork).map(function (id) { return state.sessionWork[id]; }).filter(function (work) {
      return work.status === 'done' && work.missed === 0 && work.releaseDay !== null && work.releaseDay < day;
    });
  },

  // This Sunday's session credits: for each credited song,
  //   their fans x $0.02 x (song quality / 100) x freshness x your 10% share.
  // day: optional, the Sunday to work it out for (leave out for today).
  creditsPay: function (state, day) {
    var w = Game.balance.sessionWork;
    var st = Game.balance.streaming;
    if (day === undefined) day = state.day;
    var total = Game.rules.sessionWork.creditedSongs(state, day).reduce(function (sum, work) {
      var fresh = Game.rules.recording.freshness({ day: work.releaseDay }, day);
      return sum + work.bandFans * st.payPerFan * (work.quality / 100) * fresh * w.streamingShare;
    }, 0);
    return Math.round(total);
  },

  // Sunday night: pays your session credits (before bills). Returns { state, log }.
  payCredits: function (state) {
    if (!Game.rules.sessionWork.creditedSongs(state, state.day).length) return { state: state, log: [] };
    var pay = Game.rules.sessionWork.creditsPay(state);
    var s = pay > 0 ? Game.rules.money.earn(state, pay, 'sessionCredits').state : state;
    return { state: s, log: ['Session credits (your share of songs you played on): +$' + pay + '.'] };
  }
};
