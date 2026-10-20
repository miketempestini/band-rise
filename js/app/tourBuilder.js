// tourBuilder.js (app)
// The Tour Builder's actions: the draft tour (app.tourBuild: { name, stops: [null or { cityId, venueId }], earliestDay,
// view }), adding and removing stops, picking venues, and sending it to the manager.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  // A fresh, empty draft: 3 empty stops (the fewest a tour can have).
  newTourBuild: function () {
    var stops = [];
    for (var i = 0; i < Game.balance.manager.tour.minCities; i++) stops.push(null);
    return { name: '', stops: stops, earliestDay: null, view: 'home' };
  },

  openTourBuilder: function () {
    var app = Game.app;
    if (!app.tourBuild) app.tourBuild = app.newTourBuild();
    app.navigate('tourBuilder');
  },

  tbView: function (view) { Game.app.tourBuild.view = view; Game.app.render(); },

  // Puts a city on a stop (slot), or the first empty stop (adding one if they're all full). Its venue starts as the
  // biggest room there that will take you.
  tbAdd: function (cityId, slot) {
    var app = Game.app;
    var d = app.tourBuild;
    var state = app.state;
    if (cityId === 'hometown' || !state.cities[cityId] || !state.cities[cityId].unlocked) return;
    if (d.stops.some(function (x) { return x && x.cityId === cityId; })) return; // already on the tour
    var venue = Game.rules.manager.builderVenues(state, cityId)[0];
    var stop = { cityId: cityId, venueId: venue ? venue.id : null };
    if (slot === undefined || slot === null) slot = d.stops.indexOf(null);
    if (slot === -1) { d.stops.push(stop); } else { d.stops[slot] = stop; }
    app.notice = null;
    app.render();
  },

  tbAddStop: function () { Game.app.tourBuild.stops.push(null); Game.app.render(); },

  // Empties a stop (an empty stop beyond the first 3 is removed).
  tbRemove: function (slot) {
    var d = Game.app.tourBuild;
    if (d.stops[slot] || d.stops.length <= Game.balance.manager.tour.minCities) d.stops[slot] = null;
    else d.stops.splice(slot, 1);
    Game.app.render();
  },

  tbVenue: function (slot, venueId) {
    var stop = Game.app.tourBuild.stops[slot];
    if (stop) stop.venueId = venueId;
    Game.app.render();
  },

  tbClear: function () { Game.app.tourBuild = Game.app.newTourBuild(); Game.app.render(); },

  // Sends the tour to the manager; on success, back to the Manager screen with a note.
  tbSend: function () {
    var app = Game.app;
    var d = app.tourBuild;
    var result = Game.rules.manager.requestBuiltTour(app.state, { name: d.name, stops: d.stops, earliestDay: d.earliestDay });
    if (result.state === app.state) {
      app.notice = { kind: 'error', text: result.log.join(' ') };
      app.render();
      return;
    }
    app.state = result.state;
    app.tourBuild = null;
    app.autoSave();
    app.navigate('manager');
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.render();
  }
});
