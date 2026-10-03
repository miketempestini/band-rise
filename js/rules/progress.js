// progress.js
// How far your career has come: milestones (each celebrated once with a banner and +10 morale),
// other unlocks (like cover nights), fame levels, the "Three weeks in" report, and tutorial tips.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.progress = {

  // ----- Milestones and unlocks -----

  // The checks for the milestones that are live so far (1 to 5).
  milestoneChecks: {
    firstOpenMic: function (s) { return s.stats.openMicsPlayed >= 1; },
    firstOriginal: function (s) {
      return Object.keys(s.songs).some(function (id) { return !s.songs[id].isCover && s.songs[id].quality !== null; });
    },
    firstBandmate: function (s) {
      return Object.keys(s.people).some(function (id) { return s.people[id].joinedDay !== null; });
    },
    smallRooms: function (s) { return s.player.reputation >= Game.balance.milestones.smallRoomsReputation; },
    firstPaidGig: function (s) { return s.stats.paidShows >= 1; },
    firstRecording: function (s) {
      return Object.keys(s.songs).some(function (id) { return !!s.songs[id].recording; });
    },
    firstRelease: function (s) { return s.releases.length >= 1; }
  },

  // Other unlocks that get a banner but aren't milestones.
  unlocks: function () {
    var b = Game.balance;
    return [
      {
        id: 'coverNights',
        reached: function (s) {
          return s.player.reputation >= b.economy.coverGigMinReputation &&
            s.player.skills.musicianship >= b.economy.coverGigMinMusicianship;
        },
        text: 'Cover nights unlocked! Corner Tap and The Back Room will book you for $' + b.economy.coverGigFee +
          ' to play ' + b.songs.setlist.coverNight.songs + ' covers. Open Book to send an email.'
      }
    ];
  },

  // Extra words for some milestone banners.
  milestoneExtra: {
    smallRooms: ' You can now book real shows at Corner Tap, The Back Room, and Hollow Records. Open Book to send an email.',
    firstBandmate: ' Rehearse is unlocked.',
    firstPaidGig: ' You got paid to play. T-shirts are now in the Shop.',
    firstRecording: ' The home recording setup is now in the Shop, and you can release music from the Songs screen.',
    firstRelease: ' Streaming money starts next Sunday, and Social ads are unlocked.'
  },

  // Records anything newly reached (in state.milestones) and queues its banner.
  // Milestones also give +10 morale. Returns { state, log, milestoneLog }.
  checkUnlocks: function (state) {
    var progress = Game.rules.progress;
    var s = Game.util.clone(state);
    var log = [];
    var milestoneLog = [];
    progress.unlocks().forEach(function (u) {
      if (s.milestones[u.id] === undefined && u.reached(s)) {
        s.milestones[u.id] = s.day;
        s.toasts.push({ id: u.id, text: u.text });
        log.push(u.text);
      }
    });
    Game.content.milestones.forEach(function (m) {
      var check = progress.milestoneChecks[m.id];
      if (!check || s.milestones[m.id] !== undefined || !check(s)) return;
      s.milestones[m.id] = s.day;
      var bonus = Game.balance.morale.change.milestone;
      var morale = Game.rules.morale.change(s, bonus);
      s = morale.state;
      var text = 'Milestone ' + m.number + ': ' + m.name + '! +' + bonus + ' morale.' + (progress.milestoneExtra[m.id] || '');
      s.toasts.push({ id: m.id, text: text, milestone: true });
      log.push(text);
      milestoneLog.push('🏆 Milestone: ' + m.name + '! +' + bonus + ' morale.');
    });
    return { state: s, log: log, milestoneLog: milestoneLog };
  },

  // Removes a banner once the player has seen it. Returns { state, log }.
  dismissToast: function (state, toastId) {
    var s = Game.util.clone(state);
    s.toasts = s.toasts.filter(function (t) { return t.id !== toastId; });
    return { state: s, log: [] };
  },

  // ----- Fame -----

  // Total fans across every city.
  totalFans: function (state) {
    return Object.keys(state.cities).reduce(function (sum, id) { return sum + state.cities[id].fans; }, 0);
  },

  // Your fame level by total fans, and how far you are toward the next one.
  // Returns { name, next (or null), fans, toNext (0 to 1) }.
  fame: function (state) {
    var levels = Game.balance.fameLevels;
    var fans = Game.rules.progress.totalFans(state);
    var i = 0;
    while (i + 1 < levels.length && fans >= levels[i + 1].minFans) i += 1;
    var next = levels[i + 1] || null;
    var toNext = next ? (fans - levels[i].minFans) / (next.minFans - levels[i].minFans) : 1;
    return { name: levels[i].name, next: next, fans: fans, toNext: toNext };
  },

  // ----- The end of the first three weeks -----

  // True once it's time for the "Three weeks in" card (and it hasn't been shown yet).
  sliceDue: function (state) {
    return state.day >= Game.balance.slice.endDay && state.milestones.sliceEnd === undefined;
  },

  // Where you landed after three weeks, next to Design.md's targets, plus your next paid show.
  // Returns { rows: [{ id, label, value, min, max, inRange }], nextPaidShow: { venueName, inDays } or null }.
  sliceReport: function (state) {
    var t = Game.balance.slice.targets;
    var values = {
      cash: state.player.cash,
      fans: Game.rules.progress.totalFans(state),
      originals: Game.rules.songs.playable(state).filter(function (s) { return !s.isCover; }).length,
      bandSize: state.band.memberIds.length,
      reputation: state.player.reputation
    };
    var labels = { cash: 'Cash', fans: 'Fans', originals: 'Original songs', bandSize: 'Bandmates', reputation: 'Reputation' };
    var rows = Object.keys(t).map(function (id) {
      return { id: id, label: labels[id], value: values[id], min: t[id].min, max: t[id].max,
        inRange: values[id] >= t[id].min && values[id] <= t[id].max };
    });
    var paid = Game.rules.booking.upcomingShows(state).filter(function (e) {
      return Game.rules.booking.payFor(Game.content.venues[e.venueId], e.deal, 0) > 0 || e.deal === 'door';
    })[0];
    return {
      rows: rows,
      nextPaidShow: paid ? { venueName: Game.content.venues[paid.venueId].name, inDays: paid.day - state.day, day: paid.day } : null
    };
  },

  // Marks the "Three weeks in" card as seen. Returns { state, log }.
  markSliceSeen: function (state) {
    var s = Game.util.clone(state);
    s.milestones.sliceEnd = s.day;
    return { state: s, log: [] };
  },

  // ----- Tutorial tips -----

  // The tip card to show on Today right now, or null (tips are off, it's past the first days, or all seen).
  tutorialCard: function (state) {
    if (!state.settings.tutorial || state.day >= Game.balance.tutorial.days) return null;
    var cards = Game.content.tutorial.filter(function (c) { return c.day <= state.day && !state.tutorialSeen[c.id]; });
    return cards[0] || null;
  },

  // Marks a tip card as seen. Returns { state, log }.
  dismissTip: function (state, cardId) {
    var s = Game.util.clone(state);
    s.tutorialSeen[cardId] = true;
    return { state: s, log: [] };
  },

  // Turns the tutorial tips on or off. Returns { state, log }.
  setTutorial: function (state, on) {
    var s = Game.util.clone(state);
    s.settings.tutorial = !!on;
    return { state: s, log: [] };
  }
};
