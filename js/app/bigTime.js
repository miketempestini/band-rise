// app/bigTime.js
// The big time: the manager, auto-booking rules, tours (requests, names, ads, accepting), the label, and arena and festival offers.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  openManager: function () { Game.app.navigate('manager'); },

  hireManager: function (messageId) { Game.app.applyWithNotice(Game.rules.manager.hire(Game.app.state, messageId)); },

  letGoManager: function () {
    if (!window.confirm('Let your manager go? You lose auto-booking, tours, the press push, and the 12-week calendar (shows already booked stay).')) return;
    Game.app.applyWithNotice(Game.rules.manager.letGo(Game.app.state));
  },

  saveManagerRules: function (rules) { Game.app.applyWithNotice(Game.rules.manager.setRules(Game.app.state, rules)); },

  // The tour request form on the Manager screen.
  tourDraftSet: function (field, value) {
    var app = Game.app;
    app.tourDraft = app.tourDraft || { name: '', cities: [], tier: 2, earliestDay: null };
    if (field === 'city') {
      var i = app.tourDraft.cities.indexOf(value);
      if (i === -1) app.tourDraft.cities.push(value); else app.tourDraft.cities.splice(i, 1);
    } else {
      app.tourDraft[field] = value;
    }
    app.render();
  },

  // The tour name box: just remembered (no redraw, so you can keep typing).
  tourDraftName: function (name) {
    var app = Game.app;
    app.tourDraft = app.tourDraft || { name: '', cities: [], tier: 2, earliestDay: null };
    app.tourDraft.name = name;
  },

  requestTour: function () {
    var app = Game.app;
    var result = Game.rules.manager.requestTour(app.state, app.tourDraft || { cities: [] });
    if (result.state !== app.state) app.tourDraft = null;
    app.applyWithNotice(result);
  },

  acceptTour: function (messageId, jobChoice) {
    Game.app.applyWithNotice(Game.rules.manager.acceptTour(Game.app.state, messageId, jobChoice, Game.app.tourAds[messageId] || {}));
  },

  // An ad package picked (or cleared) for one city on a tour proposal.
  tourAdPick: function (messageId, cityId, packageId) {
    var ads = Game.app.tourAds[messageId] = Game.app.tourAds[messageId] || {};
    if (packageId) ads[cityId] = packageId; else delete ads[cityId];
    Game.app.render();
  },

  // The tour poster pop-up (on Career or the wrap-up).
  openTourPoster: function (tourId) {
    Game.app.posterTourId = tourId;
    Game.app.render();
  },

  closeTourPoster: function () {
    Game.app.posterTourId = null;
    Game.app.render();
  },

  // The tour wrap-up screen. from: 'career' when opened from the Career screen (Back goes there), else it follows
  // the gig result after a tour's last show.
  openTourWrapUp: function (tourId, from) {
    var app = Game.app;
    app.wrapUpTourId = tourId;
    app.wrapUpFrom = from || null;
    app.show('tourWrapUp');
  },

  leaveTourWrapUp: function () {
    var app = Game.app;
    if (app.wrapUpFrom === 'career') { app.show('career'); return; }
    app.wrapUpShownDay = app.state.lastDayReport.day; // shown: carry on with song reveals and the weekly summary
    app.afterGigResult();
  },

  acceptBigShow: function (messageId, jobChoice) { Game.app.applyWithNotice(Game.rules.bigShows.accept(Game.app.state, messageId, jobChoice)); }
});
