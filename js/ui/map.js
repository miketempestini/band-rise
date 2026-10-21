// map.js
// The Map screen, in front of a dim picture of a van on the highway. Two views (app.mapView):
//   Home:  a paper road map with push pins (Millbrook in the middle, then rings of Near, Mid, and Far cities), and a
//          card for every city at home (including the National cities you fly to).
//   World: a paper world map with made-up countries (outlines from content/countries.js), a pin for every city you
//          fly to, and dashed flight paths from Millbrook; then the international cities' cards, by country.
// Each card has the city's travel time and cost, fans out of its fan ceiling, buzz, venues, and whether it's
// unlocked (or exactly what it still needs). "Book here" opens the Book screen on that city.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.map = {

  // The ring each driving region sits on, as a share of the map's half-width (drawing only).
  rings: { hometown: 0, near: 0.3, mid: 0.6, far: 0.9 },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.map;
    var world = app.mapView === 'world';
    var regions = ['hometown', 'near', 'mid', 'far', 'national'];
    var names = { hometown: 'Hometown', near: 'Near cities', mid: 'Mid cities', far: 'Far cities', national: 'National cities' };
    var byRegion = {};
    Object.keys(Game.content.cities).forEach(function (id) {
      var r = Game.content.cities[id].region;
      byRegion[r] = (byRegion[r] || []).concat(id);
    });

    var cards = world
      ? Object.keys(Game.content.countries).filter(function (c) { return c !== 'home'; }).map(function (c) {
          var country = Game.content.countries[c];
          var ids = Object.keys(Game.content.cities).filter(function (id) { return Game.content.cities[id].countryId === c; });
          return '<div class="panel"><h3 class="panel__title">' + h.escape(country.name) + '</h3>' +
            '<p class="hint">' + h.escape(country.blurb) + '</p><div class="city-grid">' +
            ids.map(function (id) { return self.cityHtml(state, id); }).join('') + '</div></div>';
        }).join('')
      : regions.map(function (r) {
          return '<div class="panel"><h3 class="panel__title">' + names[r] + '</h3><div class="city-grid">' +
            byRegion[r].map(function (id) { return self.cityHtml(state, id); }).join('') + '</div></div>';
        }).join('');
    var toggle = '<div class="sort-bar">' +
      '<button class="btn btn--small' + (world ? '' : ' btn--primary') + '" data-action="mapView" data-view="home">Home map</button>' +
      '<button class="btn btn--small' + (world ? ' btn--primary' : '') + '" data-action="mapView" data-view="world">World map</button></div>';

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<div class="backdrop backdrop--map" aria-hidden="true"></div>' +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Map</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        toggle +
        (world
          ? '<div class="map-sheet map-sheet--world paper">' + self.worldSvg(state) + '</div>'
          : '<div class="map-layout">' +
              '<div class="map-sheet paper">' + self.svg(state, byRegion) + '</div>' +
              '<div class="panel">' + self.vanHtml(state) + '</div>' +
            '</div>') +
        cards +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('map'); },
      focusPayBack: function () { app.goBack('map'); },
      bookCity: function (e, el) { app.bookingCitySelect(el.getAttribute('data-city')); },
      mapView: function (e, el) { app.mapView = el.getAttribute('data-view'); app.render(); }
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
        return '<g class="map__city' + (open ? '' : ' map__city--locked') + '" data-city="' + id + '">' +
          '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + radius.toFixed(1) + '"/>' +
          '<text x="' + x.toFixed(1) + '" y="' + (y + radius + 13).toFixed(1) + '" text-anchor="middle">' +
            Game.ui.helpers.escape(Game.content.cities[id].name) + '</text></g>';
      }).join('');
    }).join('');
    return '<svg class="map" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Map of cities around Millbrook">' + rings + dots + '</svg>' +
      '<p class="hint">Rings: Near (1 travel block each way), Mid (2), Far (a full day). National cities are a flight away (with a manager and a label); the rest of the world is on the World map.</p>';
  },

  // A smooth closed outline through a list of [x, y] points (curves through the midpoints), as an SVG path.
  smoothPath: function (points) {
    var mid = function (a, b) { return [((a[0] + b[0]) / 2).toFixed(1), ((a[1] + b[1]) / 2).toFixed(1)]; };
    var n = points.length;
    var d = 'M' + mid(points[n - 1], points[0]).join(' ');
    points.forEach(function (p, i) { d += ' Q' + p[0] + ' ' + p[1] + ' ' + mid(p, points[(i + 1) % n]).join(' '); });
    return d + 'Z';
  },

  // The World map: countries, a pin for every city you fly to (bigger with more fans, hollow while locked), and
  // dashed flight paths from Millbrook to each country's capital.
  worldSvg: function (state) {
    var h = Game.ui.helpers;
    var self = Game.ui.map;
    var countries = Game.content.countries;
    var home = Game.content.cities.hometown.world;
    var lands = Object.keys(countries).map(function (c) {
      var country = countries[c];
      return '<path class="world__land' + (c === 'home' ? ' world__land--home' : '') + '" d="' + self.smoothPath(country.shape) + '"/>' +
        '<text class="world__country" x="' + country.label[0] + '" y="' + country.label[1] + '" text-anchor="middle">' + h.escape(country.name) + '</text>';
    }).join('');
    var routes = Object.keys(countries).filter(function (c) { return c !== 'home'; }).map(function (c) {
      var to = Game.content.cities[countries[c].capital].world;
      // A gentle arc: bend the line sideways from its middle by a fifth of its length (always to the same side).
      var dx = to.x - home.x, dy = to.y - home.y;
      var cx = (home.x + to.x) / 2 + dy * 0.2, cy = (home.y + to.y) / 2 - dx * 0.2;
      return '<path class="world__route" d="M' + home.x + ' ' + home.y + ' Q' + cx + ' ' + cy + ' ' + to.x + ' ' + to.y + '"/>';
    }).join('');
    var pins = Object.keys(Game.content.cities).filter(function (id) { return Game.content.cities[id].world; }).map(function (id) {
      var city = Game.content.cities[id];
      var open = state.cities[id].unlocked;
      var r = 4 + Math.min(9, Math.sqrt(state.cities[id].fans) / 80);
      return '<g class="world__city' + (open ? '' : ' world__city--locked') + (id === 'hometown' ? ' world__city--home' : '') + '" data-city="' + id + '">' +
        '<circle cx="' + city.world.x + '" cy="' + city.world.y + '" r="' + r.toFixed(1) + '"><title>' + h.escape(city.name) + ': ' +
          state.cities[id].fans.toLocaleString() + ' fans' + (open ? '' : ' (locked)') + '</title></circle>' +
        '<text x="' + city.world.x + '" y="' + (city.world.y - r - 5).toFixed(1) + '" text-anchor="middle">' + h.escape(city.name) + '</text></g>';
    }).join('');
    return '<svg class="world" viewBox="0 0 1000 560" role="img" aria-label="World map">' + lands + routes + pins + '</svg>' +
      '<p class="hint m-only">Swipe the map sideways to see the whole world.</p>' +
      '<p class="hint">Flights abroad: ' + Game.balance.travel.internationalFlight.blocks + ' blocks and ' +
        h.money(Game.balance.travel.internationalFlight.perPersonOneWay) + ' a person each way; short flights inside a country ' +
        Game.balance.travel.hop.blocks + ' block and ' + h.money(Game.balance.travel.hop.perPersonOneWay) + ' a person.' +
        (Game.rules.travel.hasJet(state) ? ' Your jet: ' + h.money(Game.balance.travel.jet.international) + ' a flight abroad, ' +
          h.money(Game.balance.travel.jet.national) + ' at home, a block faster.' : '') + '</p>';
  },

  // Your van, if you have one.
  vanHtml: function (state) {
    var h = Game.ui.helpers;
    var van = state.player.gear.van;
    var left = Game.rules.travel.vanShowsLeft(state);
    return '<h3 class="panel__title">Your van</h3>' +
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
    var drive = cityId !== 'hometown'; // places you travel to (driving, or flights)
    var fly = drive && tr.isFlight('hometown', cityId);
    var kind = drive ? tr.legKind('hometown', cityId) : null;
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
      '<div class="city__head"><strong>' + h.escape(city.name) + '</strong>' + (cs.unlocked ? '' : ' <span class="badge">Locked</span>') + '</div>' +
      '<p class="hint">' + h.escape(city.blurb) + '</p>' +
      '<dl class="rows">' +
        (drive ? '<dt>Travel</dt><dd>' + tr.legBlocks('hometown', cityId) + ' block' + (tr.legBlocks('hometown', cityId) === 1 ? '' : 's') + ' each way · ' +
          (fly ? h.money(tr.legGas('hometown', cityId, state) * 2) + ' in flights round trip (' +
              (tr.hasJet(state) ? 'your jet, ' + h.money(Game.balance.travel.jet[kind]) + ' a flight' : h.money(tr.fare(kind).perPersonOneWay) + ' a person each way') + ')'
            : h.money(Game.balance.travel.gasRoundTrip[city.region]) + ' gas round trip') + '</dd>' : '') +
        '<dt>Fans</dt><dd>' + cs.fans.toLocaleString() + ' / ' + city.fanCeiling.toLocaleString() + '</dd>' +
        '<dt>Buzz</dt><dd>' + Math.round(cs.buzz) + '</dd>' +
        (cityId === 'hometown' ? '' : '<dt>Shows played</dt><dd>' + played + '</dd>') +
      '</dl>' +
      (cs.fans > 0 && fadeDays >= Game.balance.fans.fadeAfterDays ? '<p class="panel__warn">No show or release here in ' + fadeDays + ' days: fans are fading.</p>' : '') +
      '<p class="hint">' + venueList + '</p>' +
      (problem ? '<p class="pick__reason">' + h.escape(problem) + '</p>'
        : !cs.unlocked ? '<p class="hint">You qualify: it opens at the end of today.</p>'
        : (cityId === 'hometown' || drive ? '<button class="btn btn--small btn--primary" data-action="bookCity" data-city="' + cityId + '">Book here</button>' : '')) +
      '</div>';
  }
};
