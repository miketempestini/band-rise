// app/booking.js
// Book and the Inbox: booking requests, studio time, open mic sign-ups, accepting and declining offers, opening slots, and residency contracts.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {


  // On the Booking screen: choose a venue and deal (or null to start over).
  bookingPick: function (venueId, deal) {
    var app = Game.app;
    app.bookingDraft = venueId ? { venueId: venueId, deal: deal, gigDay: null } : null;
    app.notice = null;
    app.render();
  },

  bookingDate: function (day) {
    Game.app.bookingDraft.gigDay = day;
    Game.app.render();
  },


  studioPick: function (studio) {
    var app = Game.app;
    app.studioDraft = studio ? { studio: studio, day: null, sessions: {}, jobChoice: null } : null;
    app.notice = null;
    app.render();
  },

  studioDate: function (day) {
    Game.app.studioDraft.day = day;
    Game.app.studioDraft.sessions = {};
    Game.app.studioDraft.jobChoice = null;
    Game.app.render();
  },

  studioSong: function (block, songId) {
    var draft = Game.app.studioDraft;
    if (songId) draft.sessions[block] = songId;
    else delete draft.sessions[block];
    Game.app.render();
  },

  studioJobChoice: function (kind) {
    Game.app.studioDraft.jobChoice = kind;
    Game.app.render();
  },

  // Plans "Book studio time" in a block today with the chosen studio, day, and songs.
  sendStudioBooking: function (block) {
    var app = Game.app;
    var d = app.studioDraft;
    var sessions = Object.keys(d.sessions).map(function (b) { return { block: b, songId: d.sessions[b] }; });
    var request = { studio: d.studio, day: d.day, sessions: sessions, jobChoice: d.jobChoice };
    var result = Game.rules.actions.plan(app.state, block, 'bookStudio', request);
    if (result.log.length) {
      app.notice = { kind: 'error', text: result.log.join(' ') };
      app.render();
      return;
    }
    app.studioDraft = null;
    app.notice = { kind: 'info', text: 'Studio booking planned for this ' + Game.content.calendar.blockNames[block].toLowerCase() +
      '. The sessions go on your Calendar when you end the day.' };
    app.applyRule(result);
  },

  // Emails the chosen venue right now (no block needed; it costs a little energy).
  sendBookingEmail: function () {
    var app = Game.app;
    var d = app.bookingDraft;
    var result = Game.rules.booking.emailVenue(app.state, d.venueId, d.gigDay, d.deal);
    var sent = result.state !== app.state;
    if (sent) app.bookingDraft = null;
    app.notice = { kind: sent ? 'info' : 'error', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // The Book screen's city tabs (and the Map's "Book here").
  bookingCitySelect: function (cityId) {
    var app = Game.app;
    app.bookingCity = cityId;
    app.bookingDraft = null;
    app.openMicDraft = null;
    app.notice = null;
    if (app.screen === 'booking') app.render();
    else app.navigate('booking');
  },

  // Out-of-town open mics: pick the night (and how to take work off), then sign up.
  openMicPick: function (venueId, day) {
    Game.app.openMicDraft = venueId ? { venueId: venueId, day: day, jobChoice: null } : null;
    Game.app.notice = null;
    Game.app.render();
  },

  openMicJobChoice: function (kind) {
    Game.app.openMicDraft.jobChoice = kind;
    Game.app.render();
  },

  signUpOpenMic: function () {
    var app = Game.app;
    var d = app.openMicDraft;
    var result = Game.rules.travel.signUpOpenMic(app.state, d.venueId, d.day, d.jobChoice);
    var ok = result.state !== app.state;
    if (ok) app.openMicDraft = null;
    app.notice = { kind: ok ? 'info' : 'error', text: result.log.join(' ') };
    app.applyRule(result);
  },

  acceptOffer: function (messageId, jobChoice) {
    var app = Game.app;
    var result = Game.rules.booking.acceptOffer(app.state, messageId, jobChoice);
    app.notice = { kind: result.entryId ? 'info' : 'error', text: result.log.join(' ') +
      (result.entryId ? ' A setlist was picked for you; change it on the Calendar.' : '') };
    app.applyRule(result);
  },


  acceptOpening: function (messageId) {
    var app = Game.app;
    var result = Game.rules.offers.acceptOpening(app.state, messageId);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  openContract: function (messageId) {
    var app = Game.app;
    var m = app.state.inbox.filter(function (x) { return x.id === messageId; })[0];
    app.contractId = messageId;
    app.contractTerms = { weekday: m.data.weekday, rate: m.data.rate, weeks: m.data.weeks };
    app.show('contract');
  },

  contractSet: function (field, value) {
    Game.app.contractTerms[field] = value;
    Game.app.render();
  },

  signContract: function () {
    var app = Game.app;
    var m = app.state.inbox.filter(function (x) { return x.id === app.contractId; })[0];
    var result = Game.rules.offers.signResidency(app.state, app.contractId, { weekday: m.data.weekday, rate: m.data.rate, weeks: m.data.weeks });
    if (result.state === app.state) { app.notice = { kind: 'error', text: result.log.join(' ') }; app.render(); return; }
    app.state = result.state;
    app.autoSave();
    app.show('calendar');
    app.notice = { kind: 'info', text: 'Signed! ' + result.log.join(' ') };
    app.render();
  },

  proposeContract: function () {
    var app = Game.app;
    var result = Game.rules.offers.counterResidency(app.state, app.contractId, app.contractTerms);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  declineOffer: function (messageId) {
    Game.app.notice = null;
    Game.app.applyRule(Game.rules.booking.declineOffer(Game.app.state, messageId));
  },

  acceptSessionWork: function (messageId) {
    var app = Game.app;
    var result = Game.rules.sessionWork.accept(app.state, messageId);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  }
});
