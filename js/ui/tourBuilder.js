// tourBuilder.js (screen)
// The Tour Builder (from the Manager screen): build a tour by hand. On the left, the Home or World map; below it, a
// chip for every city. Drag a chip onto a tour stop (or click a chip or a map pin to fill the next empty stop), then
// pick the venue in each city. Send it to your manager, who contacts every venue, fits the dates, and sends a
// proposal to the Inbox (see Game.rules.manager.requestBuiltTour). Draw only: the draft lives in app.tourBuild.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.tourBuilder = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var self = Game.ui.tourBuilder;
    var state = app.state;
    var d = app.tourBuild;
    var t = Game.balance.manager.tour;
    var world = d.view === 'world';

    var byRegion = {};
    Object.keys(Game.content.cities).forEach(function (id) {
      var r = Game.content.cities[id].region;
      byRegion[r] = (byRegion[r] || []).concat(id);
    });
    var map = '<div class="sort-bar">' +
        '<button class="btn btn--small' + (world ? '' : ' btn--primary') + '" data-action="tbView" data-view="home">Home map</button>' +
        '<button class="btn btn--small' + (world ? ' btn--primary' : '') + '" data-action="tbView" data-view="world">World map</button></div>' +
      '<div class="map-sheet paper builder__map' + (world ? ' map-sheet--world' : '') + '">' + (world ? Game.ui.map.worldSvg(state) : Game.ui.map.svg(state, byRegion)) + '</div>' +
      '<p class="hint">Drag a city onto a stop, or click a city (or its pin) to fill the next empty stop.' +
        (world ? '' : ' National cities are on the World map.') + '</p>';

    var stops = d.stops.map(function (stop, i) { return self.stopHtml(state, stop, i); }).join('');
    var request = { name: d.name, stops: d.stops, earliestDay: d.earliestDay };
    var problem = Game.rules.manager.builtTourProblem(state, request);
    var filled = d.stops.filter(function (x) { return x; });
    var crowd = filled.reduce(function (sum, x) {
      var range = Game.rules.gigs.crowdRange(state, Game.content.venues[x.venueId]);
      return sum + Math.round((range.low + range.high) / 2);
    }, 0);

    var first = state.day + t.leadDays;
    var weeks = '';
    for (var day = first - Game.rules.day.dayOfWeek(first); day <= Game.rules.manager.horizonDay(state) - Game.balance.time.daysPerWeek; day += Game.balance.time.daysPerWeek) {
      weeks += '<option value="' + day + '"' + (d.earliestDay === day ? ' selected' : '') + '>The week of ' + Game.rules.day.weekLabel(day) + '</option>';
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<div class="backdrop backdrop--map" aria-hidden="true"></div>' +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Tour Builder</h1>' +
          '<button class="btn" data-action="back">← Manager</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="builder">' +
          '<div class="builder__left">' + map + self.chipsHtml(state, d) + '</div>' +
          '<div class="panel builder__board">' +
            '<h3 class="panel__title">Tour stops' + (filled.length ? ' (' + filled.length + ')' : '') + '</h3>' +
            '<p class="hint">At least ' + t.minCities + ' stops. Order doesn\'t matter: your manager routes the tour for the shortest travel and fits the dates ' +
              '(at least ' + t.leadDays / Game.balance.time.daysPerWeek + ' weeks out). Each venue answers with its normal odds; if one says no, your manager tries another room in that city.</p>' +
            '<div class="tb-stops">' + stops + '</div>' +
            '<button class="btn btn--small" data-action="tbAddStop">+ Add a stop</button>' +
            '<div class="tb-send">' +
              '<label class="form-row"><span class="muted">Tour name (optional):</span>' +
                '<input type="text" id="tb-name" class="input" maxlength="' + t.nameMaxLength + '" placeholder="Like The Neon Highway Tour" autocomplete="off" value="' +
                h.escape(d.name || '') + '"></label>' +
              '<label class="form-row"><span class="muted">Start no earlier than:</span><select id="tb-start" class="input"><option value="">As soon as possible</option>' + weeks + '</select></label>' +
              (filled.length ? '<p class="hint">' + filled.length + ' stop' + (filled.length === 1 ? '' : 's') + ', about ' + crowd.toLocaleString() +
                ' people in all at today\'s fans. The proposal shows the dates, travel, and money.</p>' : '') +
              '<div class="actions actions--left">' +
                '<button class="btn btn--primary" data-action="tbSend"' + (problem ? ' disabled' : '') + '>Send to my manager</button>' +
                '<button class="btn btn--ghost" data-action="tbClear">Clear</button>' +
                (problem && filled.length ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      back: function () { app.navigate('manager'); },
      focusPayBack: function () { app.navigate('manager'); },
      tbView: function (e, el) { app.tbView(el.getAttribute('data-view')); },
      tbAddStop: function () { app.tbAddStop(); },
      tbRemove: function (e, el) { app.tbRemove(Number(el.getAttribute('data-slot'))); },
      tbChip: function (e, el) { app.tbAdd(el.getAttribute('data-city')); },
      tbSend: function () { app.tbSend(); },
      tbClear: function () { app.tbClear(); }
    });
    self.bindExtras(root, app);
  },

  // One tour stop: empty (a drop target), or a city with its venue choice.
  stopHtml: function (state, stop, i) {
    var h = Game.ui.helpers;
    if (!stop) {
      return '<div class="tb-stop tb-stop--empty" data-slot="' + i + '"><span class="tb-stop__num">' + (i + 1) + '</span>' +
        '<span class="muted">Drop a city here</span>' +
        '<button class="btn btn--small btn--ghost" data-action="tbRemove" data-slot="' + i + '" aria-label="Remove this stop">✕</button></div>';
    }
    var city = Game.content.cities[stop.cityId];
    var venues = Game.rules.manager.builderVenues(state, stop.cityId);
    var options = venues.map(function (v) {
      return '<option value="' + v.id + '"' + (v.id === stop.venueId ? ' selected' : '') + '>' + h.escape(v.name) + ' (' +
        Game.balance.venues.tiers[v.tier].name.toLowerCase() + ', ' + v.capacity.toLocaleString() + ', ' +
        Math.round(Game.rules.booking.acceptanceChance(state, v, 'door') * 100) + '% chance)</option>';
    }).join('');
    var where = city.countryId ? Game.content.countries[city.countryId].name : Game.ui.tourBuilder.regionName(city.region);
    var range = stop.venueId ? Game.rules.gigs.crowdRange(state, Game.content.venues[stop.venueId]) : null;
    return '<div class="tb-stop" data-slot="' + i + '"><span class="tb-stop__num">' + (i + 1) + '</span>' +
      '<div class="tb-stop__body"><strong>' + h.escape(city.name) + '</strong> <span class="muted">' + h.escape(where) + '</span>' +
        (venues.length
          ? '<select class="input tb-venue" data-slot="' + i + '">' + options + '</select>' +
            (range ? '<span class="hint">' + (range.low === range.high ? 'Expected crowd: a full house (' + range.high.toLocaleString() + ')'
              : 'Expected crowd ' + range.low.toLocaleString() + ' to ' + range.high.toLocaleString()) + '</span>' : '')
          : '<span class="pick__reason">No room there will take you yet.</span>') +
      '</div>' +
      '<button class="btn btn--small btn--ghost" data-action="tbRemove" data-slot="' + i + '" aria-label="Remove this stop">✕</button></div>';
  },

  regionName: function (region) {
    return { near: 'Near', mid: 'Mid', far: 'Far', national: 'National' }[region] || '';
  },

  // Every out-of-town city as a chip, grouped (at home by region, abroad by country). Locked cities say why on hover;
  // cities already in the tour are ticked.
  chipsHtml: function (state, d) {
    var h = Game.ui.helpers;
    var inTour = d.stops.filter(function (x) { return x; }).map(function (x) { return x.cityId; });
    var chip = function (id) {
      var open = state.cities[id].unlocked;
      var on = inTour.indexOf(id) !== -1;
      var why = open ? '' : (Game.rules.travel.cityUnlockProblem(state, id) || 'Locked');
      return '<button class="tb-chip' + (on ? ' tb-chip--on' : '') + '" data-action="tbChip" data-city="' + id + '"' +
        (open && !on ? ' draggable="true"' : ' disabled') + (why ? ' title="' + h.escape(why) + '"' : '') + '>' + (on ? '✓ ' : '') +
        h.escape(Game.content.cities[id].name) + '</button>';
    };
    var group = function (label, ids) {
      return '<div class="tb-group"><span class="tb-group__label">' + h.escape(label) + '</span>' + ids.map(chip).join('') + '</div>';
    };
    var ids = function (test) { return Object.keys(Game.content.cities).filter(function (id) { return id !== 'hometown' && test(Game.content.cities[id]); }); };
    var html = ['near', 'mid', 'far', 'national'].map(function (r) {
      return group(Game.ui.tourBuilder.regionName(r), ids(function (c) { return c.region === r; }));
    }).join('') + Object.keys(Game.content.countries).filter(function (c) { return c !== 'home'; }).map(function (c) {
      return group(Game.content.countries[c].name, ids(function (city) { return city.countryId === c; }));
    }).join('');
    return '<div class="panel tb-chips"><h3 class="panel__title">Cities</h3>' + html + '</div>';
  },

  // The parts h.bind doesn't cover: dragging chips onto stops, clicking map pins, the venue pickers, and the form.
  bindExtras: function (root, app) {
    root.querySelectorAll('.tb-chip[draggable="true"]').forEach(function (chip) {
      chip.addEventListener('dragstart', function (ev) {
        if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = 'copy'; ev.dataTransfer.setData('text/plain', chip.getAttribute('data-city')); }
      });
    });
    root.querySelectorAll('.tb-stop').forEach(function (slot) {
      slot.addEventListener('dragover', function (ev) { ev.preventDefault(); slot.classList.add('tb-stop--over'); });
      slot.addEventListener('dragleave', function () { slot.classList.remove('tb-stop--over'); });
      slot.addEventListener('drop', function (ev) {
        ev.preventDefault();
        var cityId = ev.dataTransfer ? ev.dataTransfer.getData('text/plain') : '';
        if (cityId) app.tbAdd(cityId, Number(slot.getAttribute('data-slot')));
      });
    });
    root.querySelectorAll('.builder__map [data-city]').forEach(function (pin) {
      pin.addEventListener('click', function () { app.tbAdd(pin.getAttribute('data-city')); });
    });
    root.querySelectorAll('.tb-venue').forEach(function (sel) {
      sel.addEventListener('change', function () { app.tbVenue(Number(sel.getAttribute('data-slot')), sel.value); });
    });
    var name = root.querySelector('#tb-name');
    if (name) name.addEventListener('input', function () { app.tourBuild.name = name.value; });
    var start = root.querySelector('#tb-start');
    if (start) start.addEventListener('change', function () { app.tourBuild.earliestDay = start.value === '' ? null : Number(start.value); app.render(); });
  }
};
