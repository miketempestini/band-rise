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
    return { state: done.state, log: done.log, songId: song.id };
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
