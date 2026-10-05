// manager.js (screen)
// The Manager screen (Phase 12): who your manager is and what they take, the auto-booking rules (cities,
// venue sizes, nights, shows a week), and asking for a tour (cities, venue size, earliest start).
// Opened from the Book screen. Before you have a manager it says how to get one.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.manager = {

  sizes: { 1: 'Small rooms', 2: 'Clubs', 3: 'Theaters' },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.manager;
    var b = Game.balance;
    var who = Game.content.business.manager;
    var hired = Game.rules.manager.hired(state);

    var body;
    if (!hired) {
      var m = b.milestones;
      body = '<div class="panel"><h3 class="panel__title">No manager yet</h3><p>Once you reach reputation ' + m.managerReputation + ' and ' + m.managerFans.toLocaleString() +
        ' fans, ' + h.escape(who.name) + ' of ' + h.escape(who.company) + ' will offer to manage you (Inbox).</p>' +
        '<p class="hint">You have reputation ' + Math.floor(state.player.reputation) + ' and ' + Game.rules.progress.totalFans(state).toLocaleString() + ' fans. ' +
        'A manager takes ' + Math.round(b.manager.gigPayCut * 100) + '% of gig pay, and gives you a ' + b.time.managerBookingWeeks +
        '-week calendar, auto-booking, tours on request, and the press and radio push.</p></div>';
    } else {
      body = '<div class="panel"><h3 class="panel__title">' + h.escape(who.name) + ' · ' + h.escape(who.company) + '</h3>' +
        '<p>Takes ' + Math.round(b.manager.gigPayCut * 100) + '% of all gig pay (before the band\'s split). Since ' + h.dateLabel(state.manager.hiredDay) + '.</p>' +
        '<p class="hint">You can book ' + b.time.managerBookingWeeks + ' weeks ahead. Press and radio push: ' +
          (Game.rules.actions.pressPushWait(state) ? 'ready in ' + Game.rules.actions.pressPushWait(state) + ' days' : 'ready (plan it from any free block)') + '.</p>' +
        '<button class="btn btn--small btn--ghost" data-action="letGo">Let them go</button></div>' +
        self.rulesHtml(state) + self.tourHtml(state, app);
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Manager</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        body +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('manager'); },
      focusPayBack: function () { app.goBack('manager'); },
      letGo: function () { app.letGoManager(); },
      saveRules: function () { app.saveManagerRules(self.readRules(root)); },
      tourCity: function (e, el) { app.tourDraftSet('city', el.getAttribute('data-city')); },
      tourTier: function (e, el) { app.tourDraftSet('tier', Number(el.getAttribute('data-tier'))); },
      requestTour: function () { app.requestTour(); }
    });
    var start = root.querySelector('#tour-start');
    if (start) start.addEventListener('change', function () { app.tourDraftSet('earliestDay', Number(start.value)); });
  },

  // Cities you've unlocked (for the rules and tours).
  openCities: function (state, withHome) {
    return Object.keys(Game.content.cities).filter(function (id) { return state.cities[id].unlocked && (withHome || id !== 'hometown'); });
  },

  // The auto-booking rules form.
  rulesHtml: function (state) {
    var h = Game.ui.helpers;
    var self = Game.ui.manager;
    var r = state.manager.rules;
    var box = function (name, value, on, label) {
      return '<label class="switch"><input type="checkbox" name="' + name + '" value="' + value + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';
    };
    var cities = self.openCities(state, true).map(function (id) { return box('rule-city', id, r.cities.indexOf(id) !== -1, h.escape(Game.content.cities[id].name)); }).join(' ');
    var tiers = [1, 2, 3].map(function (t) { return box('rule-tier', t, r.tiers.indexOf(t) !== -1, self.sizes[t]); }).join(' ');
    var nights = Game.content.calendar.dayNames.map(function (n, i) { return box('rule-night', i, r.nights.indexOf(i) !== -1, n.slice(0, 3)); }).join(' ');
    return '<div class="panel"><h3 class="panel__title">Auto-booking</h3>' +
      '<p class="hint">Every Monday your manager emails venues that match these rules, for dates inside each venue\'s booking window ' +
        '(normal odds, no energy from you). A "yes" is booked for you if it needs no time off work and the travel fits.</p>' +
      '<div class="form-row">' + box('rule-on', 'on', r.on, '<strong>Auto-booking on</strong>') + '</div>' +
      '<div class="form-row"><span class="muted">Cities:</span><div class="form-row__btns">' + cities + '</div></div>' +
      '<div class="form-row"><span class="muted">Venue sizes:</span><div class="form-row__btns">' + tiers + '</div></div>' +
      '<div class="form-row"><span class="muted">Nights:</span><div class="form-row__btns">' + nights + '</div></div>' +
      '<div class="form-row"><span class="muted">At most</span><input type="number" id="rule-max" class="input input--money" min="1" max="' +
        Game.balance.manager.autoBook.maxPerWeekLimit + '" value="' + r.maxPerWeek + '"><span class="muted">shows a week</span></div>' +
      '<button class="btn btn--primary btn--small" data-action="saveRules">Save rules</button></div>';
  },

  // Reads the rules form back into a rules object.
  readRules: function (root) {
    var picked = function (name) {
      return Array.prototype.slice.call(root.querySelectorAll('input[name="' + name + '"]:checked')).map(function (el) { return el.value; });
    };
    return {
      on: picked('rule-on').length > 0,
      cities: picked('rule-city'),
      tiers: picked('rule-tier').map(Number),
      nights: picked('rule-night').map(Number),
      maxPerWeek: Number(root.querySelector('#rule-max').value)
    };
  },

  // Asking for a tour: cities, venue size, and the earliest week to start.
  tourHtml: function (state, app) {
    var h = Game.ui.helpers;
    var self = Game.ui.manager;
    var t = Game.balance.manager.tour;
    var pending = state.tourRequests[0];
    if (pending) {
      return '<div class="panel"><h3 class="panel__title">🚐 Tour</h3><p>Your manager is planning a tour of ' +
        pending.cities.map(function (id) { return h.escape(Game.content.cities[id].name); }).join(', ') +
        '. The proposal arrives ' + h.dateLabel(pending.readyDay) + '.</p></div>';
    }
    var d = app.tourDraft || { cities: [], tier: 2, earliestDay: null };
    var cities = self.openCities(state, false).map(function (id) {
      var on = d.cities.indexOf(id) !== -1;
      return '<button class="btn btn--small' + (on ? ' btn--primary' : '') + '" data-action="tourCity" data-city="' + id + '">' + (on ? '✓ ' : '') +
        h.escape(Game.content.cities[id].name) + '</button>';
    }).join(' ');
    var tiers = [1, 2, 3].map(function (tier) {
      return '<button class="btn btn--small' + (d.tier === tier ? ' btn--primary' : '') + '" data-action="tourTier" data-tier="' + tier + '">' + self.sizes[tier] + '</button>';
    }).join(' ');
    var first = state.day + t.leadDays;
    var weeks = '';
    for (var day = first - Game.rules.day.dayOfWeek(first); day <= Game.rules.manager.horizonDay(state) - Game.balance.time.daysPerWeek; day += Game.balance.time.daysPerWeek) {
      weeks += '<option value="' + day + '"' + (d.earliestDay === day ? ' selected' : '') + '>The week of ' + Game.rules.day.weekLabel(day) + '</option>';
    }
    var problem = Game.rules.manager.tourRequestProblem(state, d);
    return '<div class="panel"><h3 class="panel__title">🚐 Ask for a tour</h3>' +
      '<p class="hint">Pick ' + t.minCities + ' to ' + t.maxCities + ' cities and a venue size. Your manager takes ' + t.planDays +
        ' days to plan it, then sends a proposal with dates, travel, and money estimates. Tours start at least ' + t.leadDays / Game.balance.time.daysPerWeek +
        ' weeks out so every venue has room. A tour needs a van.</p>' +
      '<div class="form-row"><span class="muted">Cities:</span><div class="form-row__btns">' + (cities || '<span class="muted">Unlock some cities first (see the Map).</span>') + '</div></div>' +
      '<div class="form-row"><span class="muted">Venue size:</span><div class="form-row__btns">' + tiers + '</div></div>' +
      '<div class="form-row"><span class="muted">Start no earlier than:</span><select id="tour-start" class="input"><option value="">As soon as possible</option>' + weeks + '</select></div>' +
      '<button class="btn btn--primary btn--small" data-action="requestTour"' + (problem ? ' disabled' : '') + '>Ask for a tour plan</button>' +
      (problem && d.cities.length ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') +
      '</div>';
  }
};
