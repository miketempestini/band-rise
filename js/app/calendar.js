// app/calendar.js
// The Calendar: picking a day, days off, clearing plans, editing setlists, session players, and cancelling shows, studio time, and session work.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  // From the Calendar: remove a planned task from a block on a day.
  calendarClear: function (day, block) {
    var app = Game.app;
    var result = Game.rules.actions.clear(app.state, block, day);
    app.notice = null;
    app.applyRule(result);
  },

  calendarSelect: function (day) {
    Game.app.calendarDay = day;
    Game.app.setlistDraft = null;
    Game.app.notice = null;
    Game.app.render();
  },

  calendarDayOff: function (day, kind) {
    var app = Game.app;
    var result = Game.rules.job.takeDayOff(app.state, day, kind);
    app.notice = result.log.length ? { kind: 'error', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  calendarUndoDayOff: function (day) {
    var result = Game.rules.job.undoDayOff(Game.app.state, day);
    Game.app.notice = result.log.length ? { kind: result.state === Game.app.state ? 'error' : 'info', text: result.log.join(' ') } : null;
    Game.app.applyRule(result);
  },

  editSetlist: function (entryId) {
    Game.app.setlistDraft = { entryId: entryId, songIds: Game.app.state.entries[entryId].songIds.slice() };
    Game.app.setlistError = null;
    Game.app.render();
  },

  toggleSetlistSong: function (songId) {
    var draft = Game.app.setlistDraft;
    var i = draft.songIds.indexOf(songId);
    if (i === -1) draft.songIds.push(songId);
    else draft.songIds.splice(i, 1);
    Game.app.render();
  },

  saveSetlist: function () {
    var app = Game.app;
    var result = Game.rules.booking.setSetlist(app.state, app.setlistDraft.entryId, app.setlistDraft.songIds);
    if (result.log.length) {
      app.setlistError = result.log.join(' ');
      app.render();
      return;
    }
    app.setlistDraft = null;
    app.setlistError = null;
    app.applyRule(result);
  },

  changeSessionPlayers: function (entryId, change) {
    var app = Game.app;
    var result = Game.rules.booking.changeSessionPlayers(app.state, entryId, change);
    app.notice = result.log.length ? { kind: 'error', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  cancelShow: function (entryId) {
    var app = Game.app;
    var e = app.state.entries[entryId];
    var penalty = Game.rules.booking.cancelPenalty(e.day - app.state.day);
    var msg = 'Cancel the show at ' + Game.content.venues[e.venueId].name + '? The venue loses ' + (-penalty.venueRelationship) +
      ' relationship' + (penalty.reputation ? ', you lose ' + (-penalty.reputation) + ' reputation' : '') +
      (penalty.bandSatisfaction ? ', and your bandmates lose ' + (-penalty.bandSatisfaction) + ' satisfaction' : '') + '.';
    if (!window.confirm(msg)) return;
    var result = Game.rules.booking.cancelShow(app.state, entryId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  cancelStudio: function (entryId) {
    var app = Game.app;
    if (!window.confirm('Cancel this studio session? It\'s free: studios only charge when you record.')) return;
    var result = Game.rules.recording.cancelSession(app.state, entryId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  cancelSessionWork: function (workId) {
    var app = Game.app;
    var work = app.state.sessionWork[workId];
    if (!window.confirm('Cancel the rest of your sessions with ' + work.bandName + '? You lose the pay for them and the streaming share.')) return;
    var result = Game.rules.sessionWork.cancel(app.state, workId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // Gives away a ticket to another band's show (no refund).
  cancelTicket: function (entryId) {
    var app = Game.app;
    if (!window.confirm('Give this ticket away? Tickets can\'t be refunded.')) return;
    var result = Game.rules.scene.cancelTicket(app.state, entryId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  }
});
