// tours.js
// Rules for tours once they're booked (planning and accepting a tour is in manager.js):
// - the tour's wrap-up when its last show is played (totals, best night, fans per city, and a gold record if it made
//   money), saved on the tour so it can be reopened from the Career screen
// - the details for its poster
// - tour shirts (bought in the Shop while a tour is coming up; they sell better on that tour)
// - road mood: how nights on the road change each bandmate's satisfaction, by trait
// Numbers are in balance.merch.tourShirt and balance.traits.roadMood.
//
// A tour (state.tours) looks like: { id, name (or null), cities, firstDay, lastDay, shows, result (null until it ends) }.
// Its booked shows carry entry.tourId, and each played show's finance record carries tourId too.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.tours = {

  // A tour by its id, or null.
  find: function (state, tourId) {
    return state.tours.filter(function (t) { return t.id === tourId; })[0] || null;
  },

  // What to call a tour (its name, or "Tour of ..." from its cities).
  label: function (tour) {
    return Game.rules.manager.tourLabel(tour.name, tour.cities);
  },

  // Tours to draw as a line across the Calendar: [{ id, label, firstDay, lastDay }] from the first show to the last.
  // Tours the manager booked (state.tours), plus tours you booked yourself: a trip with 3+ shows that aren't part of a
  // manager's tour.
  calendarSpans: function (state) {
    var spans = state.tours.map(function (t) {
      return { id: t.id, label: Game.rules.tours.label(t), firstDay: t.firstDay, lastDay: t.lastDay };
    });
    Object.keys(state.trips).forEach(function (id) {
      var shows = state.trips[id].showIds.map(function (sid) { return state.entries[sid]; })
        .filter(function (e) { return e && e.type === 'gig' && !e.tourId; });
      if (shows.length < Game.balance.tours.minShows) return;
      var days = shows.map(function (e) { return e.day; });
      var cities = shows.map(function (e) { return Game.content.venues[e.venueId].cityId; })
        .filter(function (c, i, all) { return all.indexOf(c) === i; });
      spans.push({ id: id, label: Game.rules.manager.tourLabel(null, cities), firstDay: Math.min.apply(null, days), lastDay: Math.max.apply(null, days) });
    });
    return spans;
  },

  // Where a tour stands today: 'ahead', 'now' (between its first and last show), or 'done'.
  status: function (state, tour) {
    if (tour.result) return 'done';
    if (tour.firstDay > state.day) return 'ahead';
    return tour.lastDay >= state.day ? 'now' : 'done';
  },

  // The tour's shows still on the calendar after today.
  showsLeft: function (state, tourId) {
    return Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'gig' && e.tourId === tourId && e.day > state.day; });
  },

  // The wrap-up for a tour, from its played shows' records: { shows, crowd, gross, yourPay, merch, production,
  // travel, net, profit, best: { venueId, day, crowd, result } or null, fansByCity: [{ cityId, fans }] }.
  // net = your pay and tips + merch - production - your part of the travel and hotels.
  wrapUp: function (state, tourId) {
    var shows = state.finances.shows.filter(function (x) { return x.tourId === tourId; });
    var trips = {};
    shows.forEach(function (x) { if (x.tripId) trips[x.tripId] = true; });
    var travel = state.finances.entries.filter(function (e) { return e.flow === 'out' && e.tripId && trips[e.tripId]; })
      .reduce(function (t, e) { return t + e.amount; }, 0);
    var sum = function (key) { return shows.reduce(function (t, x) { return t + (x[key] || 0); }, 0); };
    var yourPay = sum('yourPay') + sum('yourTips');
    var merch = sum('merch');
    var production = sum('production');
    var net = yourPay + merch - production - travel;
    var order = Game.balance.gigs.resultOrder;
    var best = shows.slice().sort(function (a, b) {
      return order.indexOf(b.result) - order.indexOf(a.result) || (b.crowd || 0) - (a.crowd || 0);
    })[0] || null;
    var fans = {};
    shows.forEach(function (x) {
      var cityId = Game.content.venues[x.venueId].cityId;
      fans[cityId] = (fans[cityId] || 0) + (x.fans || 0);
    });
    return {
      shows: shows.length, crowd: sum('crowd'), gross: sum('gross'), yourPay: yourPay, merch: merch, production: production,
      travel: travel, net: net, profit: net > 0,
      best: best ? { venueId: best.venueId, day: best.day, crowd: best.crowd || 0, result: best.result || null } : null,
      fansByCity: Object.keys(fans).map(function (id) { return { cityId: id, fans: fans[id] }; }).sort(function (a, b) { return b.fans - a.fans; })
    };
  },

  // At the end of each day: any tour whose shows are all done gets its wrap-up saved. Returns { state, endedId }
  // (endedId: the tour that ended today with at least one show played, so the wrap-up screen can follow).
  checkEnded: function (state) {
    var tours = Game.rules.tours;
    var endedId = null;
    var s = state;
    state.tours.forEach(function (t) {
      if (t.result || t.firstDay > state.day || tours.showsLeft(state, t.id).length) return;
      var result = tours.wrapUp(state, t.id);
      if (s === state) s = Game.util.clone(state);
      tours.find(s, t.id).result = result;
      if (result.shows > 0) endedId = t.id;
    });
    return { state: s, endedId: endedId };
  },

  // The details for a tour's poster: { band, title, rows: [{ day, date, city, venue }] } (from its saved shows).
  posterData: function (state, tourId) {
    var t = Game.rules.tours.find(state, tourId);
    var played = state.finances.shows.filter(function (x) { return x.tourId === tourId; })
      .map(function (x) { return { venueId: x.venueId, day: x.day }; });
    var booked = Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'gig' && e.tourId === tourId; })
      .map(function (e) { return { venueId: e.venueId, day: e.day }; });
    var rows = (t.dates || []).concat(played, booked);
    var seen = {};
    rows = rows.filter(function (r) { var k = r.day + r.venueId; if (seen[k]) return false; seen[k] = true; return true; })
      .sort(function (a, b) { return a.day - b.day; })
      .map(function (r) {
        var v = Game.content.venues[r.venueId];
        return { day: r.day, date: Game.rules.day.shortDate(r.day), city: Game.content.cities[v.cityId].name, venue: v.name };
      });
    return { band: state.band.name || state.player.name, title: Game.rules.tours.label(t), rows: rows };
  },

  // ----- Tour shirts -----

  // The tour you can buy tour shirts for: the next one coming up (or happening now), or null.
  shirtTour: function (state) {
    var tours = Game.rules.tours;
    return state.tours.filter(function (t) { return tours.status(state, t) !== 'done'; })
      .sort(function (a, b) { return a.firstDay - b.firstDay; })[0] || null;
  },

  // Why you can't buy tour shirts now, or null.
  shirtProblem: function (state) {
    var t = Game.rules.tours.shirtTour(state);
    if (!t) return 'Book a tour first (ask your manager for one).';
    var tm = state.tourMerch;
    if (tm.count > 0 && tm.tourId !== t.id) return 'Sell your ' + tm.count + ' leftover tour shirts first.';
    return null;
  },

  // Buys a pack of tour shirts for the next tour. Returns { state, log }.
  buyShirts: function (state) {
    var problem = Game.rules.tours.shirtProblem(state);
    if (problem) return { state: state, log: [problem] };
    var ts = Game.balance.merch.tourShirt;
    if (state.player.cash < ts.packCost) return { state: state, log: ['That costs $' + ts.packCost + ' (you have $' + Math.floor(state.player.cash) + ').'] };
    var t = Game.rules.tours.shirtTour(state);
    var s = Game.rules.money.spend(state, ts.packCost, 'merchStock').state;
    s.tourMerch = { tourId: t.id, count: s.tourMerch.count + ts.packSize };
    return { state: s, log: ['Bought ' + ts.packSize + ' tour shirts for ' + Game.rules.tours.label(t) + ' ($' + ts.packCost + ').'] };
  },

  // How tour shirts sell at a show: { price, boost } on their tour, the leftover price once the tour is over, or
  // null when they're being saved for a tour that hasn't started (or there are none).
  shirtSale: function (state, tourId) {
    var tm = state.tourMerch;
    var ts = Game.balance.merch.tourShirt;
    if (!tm || tm.count <= 0) return null;
    if (tourId && tourId === tm.tourId) return { price: ts.tourPrice, boost: ts.buyBoost };
    var t = Game.rules.tours.find(state, tm.tourId);
    if (!t || Game.rules.tours.status(state, t) === 'done') return { price: ts.leftoverPrice, boost: 1 };
    return null;
  },

  // ----- Road mood -----

  // Each night on the road: every bandmate's satisfaction changes by trait (Party Animals love it, Easygoing ones miss
  // home from the 4th night, everyone else gets road-weary from the 8th). roadNight: how many nights in a row you've
  // been away. Returns { state, log }.
  roadMood: function (state, roadNight) {
    var rm = Game.balance.traits.roadMood;
    var s = state;
    var log = [];
    Game.rules.people.members(state).forEach(function (p) {
      var change = 0, reason = '';
      if (p.trait === 'partyAnimal') { change = rm.partyAnimal; reason = 'Loves the road'; }
      else if (p.trait === 'easygoing') { if (roadNight >= rm.easygoingFromNight) { change = rm.easygoing; reason = 'Misses home'; } }
      else if (roadNight >= rm.othersFromNight) { change = rm.others; reason = 'Road-weary'; }
      if (!change) return;
      s = Game.rules.people.changeSatisfaction(s, p.id, change, reason, true).state;
      log.push(p.name + ': ' + Game.util.signed(change) + ' satisfaction (' + reason.toLowerCase() + ').');
    });
    return { state: s, log: log };
  }
};
