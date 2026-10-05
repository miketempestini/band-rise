// map.js
// The Map screen: a simple ring map (Millbrook in the middle, then Near, Mid, and Far cities), and a card for
// every city with its distance, travel time and gas, fans out of its fan ceiling, buzz, venues, and whether
// it's unlocked (or exactly what it still needs). "Book here" opens the Book screen on that city.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.map = {

  // The ring each driving region sits on, as a share of the map's half-width (drawing only).
  rings: { hometown: 0, near: 0.3, mid: 0.6, far: 0.9 },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.map;
    var regions = ['hometown', 'near', 'mid', 'far', 'national', 'international'];
    var names = { hometown: 'Hometown', near: 'Near cities', mid: 'Mid cities', far: 'Far cities', national: 'National cities', international: 'International cities' };
    var byRegion = {};
    Object.keys(Game.content.cities).forEach(function (id) {
      var r = Game.content.cities[id].region;
      byRegion[r] = (byRegion[r] || []).concat(id);
    });

    var cards = regions.map(function (r) {
      return '<div class="panel"><h3 class="panel__title">' + names[r] + '</h3><div class="city-grid">' +
        byRegion[r].map(function (id) { return self.cityHtml(state, id); }).join('') + '</div></div>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">🗺️ Map</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="map-layout">' +
          '<div class="panel">' + self.svg(state, byRegion) + '</div>' +
          '<div class="panel">' + self.vanHtml(state) + '</div>' +
        '</div>' +
        cards +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('map'); },
      focusPayBack: function () { app.goBack('map'); },
      bookCity: function (e, el) { app.bookingCitySelect(el.getAttribute('data-city')); }
    });
  },

  // The ring map: dots for the cities you drive to, bigger when you have more fans there.
  svg: function (state, byRegion) {
    var self = Game.ui.map;
    var size = 360;
    var mid = size / 2;
    var half = mid - 20;
    var rings = ['near', 'mid', 'far'].map(function (r) {
      return '<circle cx="' + mid + '" cy="' + mid + '" r="' + (self.rings[r] * half) + '" class="map__ring"/>';
    }).join('');
    var dots = ['hometown', 'near', 'mid', 'far'].map(function (r) {
      var ids = byRegion[r] || [];
      return ids.map(function (id, i) {
        var angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2 + (r === 'mid' ? Math.PI / 4 : 0);
        var x = mid + Math.cos(angle) * self.rings[r] * half;
        var y = mid + Math.sin(angle) * self.rings[r] * half;
        var open = state.cities[id].unlocked;
        var fans = state.cities[id].fans;
        var radius = 6 + Math.min(10, Math.sqrt(fans) / 4);
        return '<g class="map__city' + (open ? '' : ' map__city--locked') + '">' +
          '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + radius.toFixed(1) + '"/>' +
          '<text x="' + x.toFixed(1) + '" y="' + (y + radius + 13).toFixed(1) + '" text-anchor="middle">' +
            Game.ui.helpers.escape(Game.content.cities[id].name) + (open ? '' : ' 🔒') + '</text></g>';
      }).join('');
    }).join('');
    return '<svg class="map" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Map of cities around Millbrook">' + rings + dots + '</svg>' +
      '<p class="hint">Rings: Near (1 travel block each way), Mid (2), Far (a full day). National cities are a flight away (with a manager and a label); International cities come later.</p>';
  },

  // Your van, if you have one.
  vanHtml: function (state) {
    var h = Game.ui.helpers;
    var van = state.player.gear.van;
    var left = Game.rules.travel.vanShowsLeft(state);
    return '<h3 class="panel__title">🚐 Your van</h3>' +
      (van
        ? '<p><strong>' + h.escape(Game.content.vans[van.kind].name) + '</strong> · ' + (left === null ? 'never breaks down' : left + ' out-of-town show' + (left === 1 ? '' : 's') + ' left') +
          (van.worn ? ' · on its last trip' : '') + '</p>'
        : '<p class="muted">No van. You can drive yourself anywhere you\'ve unlocked, but Far cities with a band, and tours, need one (Shop).</p>') +
      '<p class="hint">A tour is ' + Game.balance.tours.minShows + '+ out-of-town shows within ' + Game.balance.tours.withinDays + ' days. On the road you pay gas and ' +
        h.money(Game.balance.travel.hotelPerNight) + ' a hotel night, each travel block costs ' + Game.balance.travel.energyPerBlock + ' energy, and from day ' +
        Game.balance.morale.roadFatigueStartDay + ' away morale drops ' + (-Game.balance.morale.roadFatiguePerDay) + ' a day.</p>';
  },

  // One city's card.
  cityHtml: function (state, cityId) {
    var h = Game.ui.helpers;
    var tr = Game.rules.travel;
    var city = Game.content.cities[cityId];
    var cs = state.cities[cityId];
    var drive = cityId !== 'hometown' && city.region !== 'international'; // places you can travel to now (driving, or flights)
    var fly = drive && tr.isFlight('hometown', cityId);
    var problem = cs.unlocked ? null : tr.cityUnlockProblem(state, cityId);
    var venues = Object.keys(Game.content.venues).map(function (id) { return Game.content.venues[id]; })
      .filter(function (v) { return v.cityId === cityId; });
    var venueList = venues.map(function (v) {
      return h.escape(v.name) + ' <span class="muted">(' + (v.tier === 0 ? 'open mic, ' + Game.content.calendar.dayNames[v.openMicDay] + 's'
        : Game.balance.venues.tiers[v.tier].name.toLowerCase() + ', ' + v.capacity.toLocaleString()) + ')</span>';
    }).join(' · ');
    var played = state.stats.citiesPlayed[cityId] || 0;
    var fadeDays = state.day - cs.lastActivityDay;
    return '<div class="city' + (cs.unlocked ? '' : ' city--locked') + '">' +
      '<div class="city__head"><strong>' + h.escape(city.name) + '</strong>' + (cs.unlocked ? '' : ' <span class="badge">🔒 Locked</span>') + '</div>' +
      '<p class="hint">' + h.escape(city.blurb) + '</p>' +
      '<dl class="rows">' +
        (drive ? '<dt>Travel</dt><dd>' + tr.legBlocks('hometown', cityId) + ' block' + (tr.legBlocks('hometown', cityId) === 1 ? '' : 's') + ' each way · ' +
          (fly ? h.money(tr.legGas('hometown', cityId, state) * 2) + ' in flights round trip (' + h.money(Game.balance.travel.flight.perPersonOneWay) + ' a person each way)'
            : h.money(Game.balance.travel.gasRoundTrip[city.region]) + ' gas round trip') + '</dd>' : (cityId === 'hometown' ? '' : '<dt>Travel</dt><dd>Flights (later)</dd>')) +
        '<dt>Fans</dt><dd>' + cs.fans.toLocaleString() + ' / ' + city.fanCeiling.toLocaleString() + '</dd>' +
        '<dt>Buzz</dt><dd>' + Math.round(cs.buzz) + '</dd>' +
        (cityId === 'hometown' ? '' : '<dt>Shows played</dt><dd>' + played + '</dd>') +
      '</dl>' +
      (cs.fans > 0 && fadeDays >= Game.balance.fans.fadeAfterDays ? '<p class="panel__warn">No show or release here in ' + fadeDays + ' days: fans are fading.</p>' : '') +
      '<p class="hint">' + venueList + '</p>' +
      (problem ? '<p class="pick__reason">' + h.escape(problem) + '</p>'
        : (cityId === 'hometown' || drive ? '<button class="btn btn--small btn--primary" data-action="bookCity" data-city="' + cityId + '">Book here</button>' : '')) +
      '</div>';
  }
};
