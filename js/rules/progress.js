// progress.js
// Things that unlock as your career grows, announced once with a banner (a "toast") on Today.
// For now: cover nights (reputation 5 + Musicianship 25) and small rooms (reputation 10).
// (The full milestone list from Design.md comes later.)

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.progress = {

  // The unlocks checked so far: id, when it's reached, and the banner text.
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
      },
      {
        id: 'smallRooms',
        reached: function (s) { return s.player.reputation >= b.milestones.smallRoomsReputation; },
        text: 'Small rooms unlocked! You can now book real shows at Corner Tap, The Back Room, and Hollow Records. Open Book to send an email.'
      }
    ];
  },

  // Records anything newly reached (in state.milestones) and queues its banner. Returns { state, log }.
  checkUnlocks: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    Game.rules.progress.unlocks().forEach(function (u) {
      if (s.milestones[u.id] === undefined && u.reached(s)) {
        s.milestones[u.id] = s.day;
        s.toasts.push({ id: u.id, text: u.text });
        log.push(u.text);
      }
    });
    return { state: s, log: log };
  },

  // Removes a banner once the player has seen it. Returns { state, log }.
  dismissToast: function (state, toastId) {
    var s = Game.util.clone(state);
    s.toasts = s.toasts.filter(function (t) { return t.id !== toastId; });
    return { state: s, log: [] };
  }
};
