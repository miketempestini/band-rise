// debug.js
// Shortcut rules for testing the game by hand (used by the debug panel, shown with ?debug).
// Later phases can add more shortcuts here.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.debug = {

  // Adds (positive) or removes (negative) cash. Removing goes through the normal spend rule,
  // so it triggers Mom and Dad's loans just like a real bill would.
  changeCash: function (state, amount) {
    if (amount >= 0) return Game.rules.money.earn(state, amount, 'debug');
    return Game.rules.money.spend(state, -amount, 'debug');
  },

  // Runs End Day several times in a row. Stops early if the game ends.
  // Returns { state, log, weekEnded } where weekEnded is true if any Sunday was crossed.
  skipDays: function (state, days) {
    var s = state;
    var log = [];
    var weekEnded = false;
    for (var i = 0; i < days && !s.gameOver; i++) {
      var result = Game.rules.day.endDay(s);
      s = result.state;
      log = log.concat(result.log);
      weekEnded = weekEnded || result.weekEnded;
    }
    return { state: s, log: log, weekEnded: weekEnded };
  },

  // Sets energy to a value, kept between 0 and the max.
  setEnergy: function (state, value) {
    var s = Game.util.clone(state);
    s.player.energy = Game.util.clamp(Math.round(value) || 0, 0, Game.balance.energy.max);
    return { state: s, log: ['Debug: energy set to ' + s.player.energy + '.'] };
  },

  // Sets morale to a value, kept between 0 and the max. Also updates Burned out.
  setMorale: function (state, value) {
    var s = Game.util.clone(state);
    s.player.morale = Game.util.clamp(Math.round(value) || 0, 0, Game.balance.morale.max);
    return Game.rules.morale.updateBurnout(s);
  },

  // Sets one skill to a value, kept between 0 and the max.
  setSkill: function (state, skill, value) {
    var s = Game.util.clone(state);
    s.player.skills[skill] = Game.util.clamp(Number(value) || 0, 0, Game.balance.skills.max);
    return { state: s, log: [] };
  },

  // Finishes the song in progress right now (starting one first if there isn't one).
  // Returns { state, log, songId } so the screen can show the reveal.
  finishSong: function (state) {
    var s = state;
    var song = Game.rules.songs.inProgress(s);
    if (!song) {
      var started = Game.rules.songs.startSong(s);
      s = started.state;
      song = s.songs[started.songId];
    }
    var done = Game.rules.songs.finishSong(s, song.id);
    var unlocked = Game.rules.progress.checkUnlocks(done.state);
    return { state: unlocked.state, log: done.log, songId: song.id };
  },

  // Meets a random new contact right now.
  addContact: function (state) {
    return Game.rules.people.meet(state);
  },

  // Sets one person's relationship, kept between 0 and 100.
  setRelationship: function (state, personId, value) {
    var s = Game.util.clone(state);
    if (!s.people[personId]) return { state: state, log: [] };
    s.people[personId].relationship = Game.util.clamp(Number(value) || 0, 0, Game.balance.people.statMax);
    return { state: s, log: [] };
  },

  // Sets one person's satisfaction, kept between 0 and 100.
  setSatisfaction: function (state, personId, value) {
    var s = Game.util.clone(state);
    if (!s.people[personId]) return { state: state, log: [] };
    s.people[personId].satisfaction = Game.util.clamp(Number(value) || 0, 0, Game.balance.satisfaction.max);
    return { state: s, log: [] };
  },

  // Sets reputation (0 to 100) and announces anything it unlocks.
  setReputation: function (state, value) {
    var s = Game.util.clone(state);
    s.player.reputation = Game.util.clamp(Number(value) || 0, 0, Game.balance.reputation.max);
    return Game.rules.progress.checkUnlocks(s);
  },

  // Makes the next booking reply a yes (true), or back to normal odds (false).
  acceptNextBooking: function (state, on) {
    var s = Game.util.clone(state);
    s.debug.acceptNextBooking = !!on;
    return { state: s, log: [] };
  },

  // Venues answer every open booking request right now (instead of waiting 1 to 3 days).
  replyNow: function (state) {
    var s = Game.util.clone(state);
    Object.keys(s.requests).forEach(function (id) {
      if (s.requests[id].status === 'pending') s.requests[id].replyDay = s.day;
    });
    return Game.rules.booking.processReplies(s);
  },

  // Records the next booked studio session right now (and takes it off the calendar).
  recordNextSession: function (state) {
    var e = Game.rules.recording.nextSession(state);
    if (!e) return { state: state, log: ['No studio time booked.'] };
    var r = Game.rules.recording.record(state, e.songId, e.studio);
    var s = r.state;
    delete s.entries[e.id];
    delete s.schedule[e.day][e.block];
    return Game.rules.progress.checkUnlocks(s);
  },

  // Pays one week of streaming money right now.
  streamingNow: function (state) {
    var s = Game.util.clone(state);
    s.day += 1; // count releases made today
    var r = Game.rules.recording.payStreaming(s);
    r.state.day = state.day;
    return r;
  },

  // A session work offer arrives right now (skipping the requirements and the odds).
  sessionWorkOffer: function (state) {
    var r = Game.rules.sessionWork.roll(state, true);
    return { state: r.state, log: r.log.length ? r.log : ['No offer: one is already open, or your calendar is too full.'] };
  },

  // Songs you finished session work on come out today (so their streaming share starts this Sunday).
  releaseSessionSongs: function (state) {
    var s = Game.util.clone(state);
    Object.keys(s.sessionWork).forEach(function (id) {
      var work = s.sessionWork[id];
      if (work.releaseDay !== null && !work.announced) work.releaseDay = s.day;
    });
    return Game.rules.sessionWork.processReleases(s);
  },

  // The big time (Phase 12): offers arrive right now, skipping their requirements.
  managerOffer: function (state) {
    return { state: Game.rules.booking.addInbox(state, 'managerOffer', {}, state.day + Game.balance.manager.offerExpiryDays), log: [] };
  },
  labelOffer: function (state) {
    return { state: Game.rules.booking.addInbox(state, 'labelOffer', { advance: Game.rules.label.advanceFor(state) }, state.day + Game.balance.label.offerExpiryDays), log: [] };
  },
  bigOffer: function (state, kind) {
    var r = Game.rules.bigShows.roll(state, kind);
    return { state: r.state, log: r.log.length ? r.log : ['No ' + kind + ' offer: one is open already, or no National city is unlocked (needs a manager and a label).'] };
  },
  // Awards: nominations now, or the ceremony now (for this year's nominations).
  awardsNominate: function (state) {
    var r = Game.rules.awards.nominate(state);
    return { state: r.state, log: r.log.length ? r.log : ['No nominations: nothing released this year qualifies, and not enough new fans.'] };
  },
  awardsCeremony: function (state) { return Game.rules.awards.ceremony(state); },

  // Adds fans to the hometown (never past its fan ceiling).
  addFans: function (state, amount) {
    var r = Game.rules.audience.addFans(state, 'hometown', amount);
    return Game.rules.progress.checkUnlocks(r.state);
  },

  // Forces the next gig's result ('rough' or 'legendary'), or clears it with null.
  forceNextGig: function (state, result) {
    var s = Game.util.clone(state);
    s.debug.forceNextGig = result;
    return { state: s, log: [] };
  },

  // Sets hometown buzz, kept between 0 and the max.
  setBuzz: function (state, value) {
    var b = Game.balance.buzz;
    var s = Game.util.clone(state);
    s.cities.hometown.buzz = Game.util.clamp(Number(value) || 0, b.min, b.max);
    return { state: s, log: [] };
  }
};
