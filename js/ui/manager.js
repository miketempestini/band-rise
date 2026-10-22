// manager.js (screen)
// The Manager screen (Phase 12): who your manager is and what they take, the auto-booking rules (cities,
// venue sizes, nights, shows a week), and asking for a tour (cities, venue size, earliest start).
// Opened from the Book screen. Before you have a manager it says how to get one.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.manager = {

  sizes: { 1: 'Small rooms', 2: 'Clubs', 3: 'Theaters' },

  // Your record deal: the label, every term, what you've delivered and owe, the money so far, and the buyout.
  // Without one: whether labels can call, open offers, and past deals.
  labelHtml: function (state) {
    var h = Game.ui.helpers;
    var lb = Game.rules.label;
    var d = state.label.deal;
    var pct = function (x) { return Math.round(x * 100) + '%'; };
    var past = state.label.past.length ? '<p class="hint">Past deals: ' + state.label.past.map(function (x) {
      return h.escape(lb.name(x.labelId)) + ' (' + h.escape(x.endReason || 'ended') + ' ' + Game.rules.day.shortDate(x.endDay) + ')';
    }).join(', ') + '.</p>' : '';
    if (!d) {
      var problem = lb.offersProblem(state);
      var open = lb.openOffers(state);
      return '<div class="panel"><h3 class="panel__title">Record labels</h3>' +
        (open.length ? '<p>' + open.length + ' label offer' + (open.length === 1 ? ' is' : 's are') + ' waiting for you.</p>' +
          '<button class="btn btn--small btn--primary" data-action="labelOffers">' + (open.length > 1 ? 'Compare the offers' : 'Read the contract') + '</button>'
          : '<p>' + h.escape(problem || 'No deal yet. Labels call on Mondays, more often when you\'re hot (buzz, a charting song, a new record).') + '</p>') +
        past + '</div>';
    }
    var info = lb.info(d.labelId);
    if (d.legacy) {
      return '<div class="panel"><h3 class="panel__title">Your label: ' + h.escape(info.name) + '</h3>' +
        '<p>Your original deal: ' + (d.unrecouped > 0 ? pct(d.recoupShare) + ' of your streaming pays back the last ' + h.money(d.unrecouped) + ' of the advance, then it\'s all yours.'
          : 'the advance is paid back, so your streaming is all yours.') + ' You owe them no records, and you can leave for free.</p>' +
        '<button class="btn btn--small" data-action="buyout">Leave the deal</button>' + past + '</div>';
    }
    var buyout = lb.buyoutPrice(state);
    var owe = d.delivered + ' of ' + d.owe.count + ' ' + (d.owe.type === 'album' ? 'albums' : 'EPs or albums') + ' delivered';
    var weeksLeft = Math.ceil((d.nextDueDay - state.day) / Game.balance.time.daysPerWeek);
    return '<div class="panel label-panel"><h3 class="panel__title">Your label: <span class="label-card__logo" style="--label-ink:' + info.color + '">' + h.escape(info.name) + '</span></h3>' +
      '<p class="muted">' + Game.content.labelTiers[info.tier] + ' · ' + Game.content.labelPersonalities[info.personality] + ' · signed ' + h.dateLabel(d.signedDay) + '</p>' +
      '<dl class="rows">' +
        '<dt>Records</dt><dd>' + owe + '</dd>' +
        '<dt>Next record due</dt><dd' + (weeksLeft <= 4 ? ' class="neg"' : '') + '>' + h.dateLabel(d.nextDueDay) + ' (' + Math.max(0, weeksLeft) + ' week' + (weeksLeft === 1 ? '' : 's') + ')</dd>' +
        '<dt>Missing it means</dt><dd>' + h.escape(lb.penaltyText(d)) + '</dd>' +
        '<dt>Strikes</dt><dd' + (d.strikes ? ' class="neg"' : '') + '>' + d.strikes + (d.dropsYou ? ' of ' + Game.balance.label.strikesToDrop + ' (then they can drop you)' : ' (they never let go)') + '</dd>' +
        '<dt>Royalty</dt><dd>' + pct(d.royalty) + ' of streaming on these records</dd>' +
        '<dt>Still to pay back</dt><dd' + (d.unrecouped > 0 ? ' class="neg"' : '') + '>' + h.money(d.unrecouped) + ' <span class="muted">(advance ' + h.money(d.advance) +
          (d.charged ? ' + ' + h.money(d.charged) + ' charged back' : '') + ')</span></dd>' +
        '<dt>Royalties paid to you</dt><dd>' + h.money(d.royaltyPaid) + '</dd>' +
        '<dt>The label has kept</dt><dd>' + h.money(d.labelKept) + (d.cut360 ? ' from streaming, plus ' + h.money(d.cut360) + ' of shows and merch' : '') + '</dd>' +
        '<dt>Reach</dt><dd>+' + pct(d.reach) + ' streams on these records' + (d.freePromo ? ', a ' + h.escape(Game.content.promos[d.freePromo].name.toLowerCase()) + ' on each' : '') + '</dd>' +
        (d.gigCut || d.merchCut ? '<dt>360 cut</dt><dd>' + pct(d.gigCut) + ' of shows, ' + pct(d.merchCut) + ' of merch</dd>' : '') +
        '<dt>Creative control</dt><dd>' + h.escape(lb.controlText(d)) + '</dd>' +
        '<dt>Masters</dt><dd>' + h.escape(lb.mastersText(d)) + '</dd>' +
        (d.renewal ? '<dt>Renewal option</dt><dd>' + (d.renewed ? 'Used: they kept you for ' + d.renewal + ' more' : '+' + d.renewal + ' if your last record is quality ' + Game.balance.label.renewalMinQuality + '+') + '</dd>' : '') +
        '<dt>Buyout</dt><dd>' + h.money(buyout) + '</dd>' +
      '</dl>' +
      '<button class="btn btn--small" data-action="buyout"' + (lb.buyoutProblem(state) ? ' disabled title="' + h.escape(lb.buyoutProblem(state)) + '"' : '') + '>Buy out for ' + h.money(buyout) + '</button>' +
      past + '</div>';
  },

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
        '-week calendar, auto-booking, tours on request, and the press and radio push. Record labels only talk to artists with a manager.</p></div>' +
        (state.label.deal ? self.labelHtml(state) : ''); // a deal you signed before letting your manager go
    } else {
      body = '<div class="panel"><h3 class="panel__title">' + h.escape(who.name) + ' · ' + h.escape(who.company) + '</h3>' +
        '<p>Takes ' + Math.round(b.manager.gigPayCut * 100) + '% of all gig pay (before the band\'s split). Since ' + h.dateLabel(state.manager.hiredDay) + '.</p>' +
        '<p class="hint">You can book ' + b.time.managerBookingWeeks + ' weeks ahead. Press and radio push: ' +
          (Game.rules.actions.pressPushWait(state) ? 'ready in ' + Game.rules.actions.pressPushWait(state) + ' days' : 'ready (plan it from any free block)') + '.</p>' +
        '<button class="btn btn--small btn--ghost" data-action="letGo">Let them go</button></div>' +
        self.labelHtml(state) + self.rulesHtml(state) + self.tourHtml(state, app);
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
      requestTour: function () { app.requestTour(); },
      openTourBuilder: function () { app.openTourBuilder(); },
      buyout: function () { app.buyoutLabel(); },
      labelOffers: function () { var open = Game.rules.label.openOffers(app.state); if (open.length > 1) app.openLabelCompare(); else app.openLabelDeal(open[0].id); }
    });
    var start = root.querySelector('#tour-start');
    if (start) start.addEventListener('change', function () { app.tourDraftSet('earliestDay', Number(start.value)); });
    // The tour's name is remembered as you type (without redrawing, so the box keeps its place).
    var name = root.querySelector('#tour-name');
    if (name) name.addEventListener('input', function () { app.tourDraftName(name.value); });
  },

  // Cities you've unlocked (for the rules and tours).
  openCities: function (state, withHome) {
    // (Auto-booking stays at home: international cities are for tours, offers, and the Book screen.)
    return Object.keys(Game.content.cities).filter(function (id) {
      return state.cities[id].unlocked && (withHome ? !Game.content.cities[id].countryId : id !== 'hometown');
    });
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
      '<div class="form-row form-row--inline"><span class="muted">At most</span><input type="number" id="rule-max" class="input input--money" min="1" max="' +
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
      return '<div class="panel"><h3 class="panel__title">Tour</h3><p>Your manager is planning ' +
        (pending.name ? '<strong>' + h.escape(pending.name) + '</strong>, a tour of ' : 'a tour of ') +
        pending.cities.map(function (id) { return h.escape(Game.content.cities[id].name); }).join(', ') +
        '. The proposal arrives ' + h.dateLabel(pending.readyDay) + '.</p></div>';
    }
    var d = app.tourDraft || { name: '', cities: [], tier: 2, earliestDay: null };
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
    return '<div class="panel"><h3 class="panel__title">Build a tour yourself</h3>' +
        '<p class="hint">Drag cities from the Home and World maps onto tour stops, pick the venue in each city, and send it to your manager. ' +
        'They contact every venue (any that say no get swapped for another room in that city), fit the dates, and send you a proposal to approve.</p>' +
        '<button class="btn btn--primary btn--small" data-action="openTourBuilder">Open the Tour Builder</button></div>' +
      '<div class="panel"><h3 class="panel__title">Ask for a tour</h3>' +
      '<p class="hint">Pick ' + t.minCities + ' or more cities and a venue size. Your manager takes ' + t.planDays +
        ' days to plan it, then sends a proposal with dates, travel, and money estimates. Tours start at least ' + t.leadDays / Game.balance.time.daysPerWeek +
        ' weeks out so every venue has room, and any city that won\'t fit in your calendar is left out (with the reason). A tour needs a van.</p>' +
      '<label class="form-row"><span class="muted">Tour name (optional):</span>' +
        '<input type="text" id="tour-name" class="input" maxlength="' + t.nameMaxLength + '" placeholder="Like The Neon Highway Tour" autocomplete="off" value="' +
        h.escape(d.name || '') + '"></label>' +
      '<div class="form-row"><span class="muted">Cities' + (d.cities.length ? ' (' + d.cities.length + ' picked)' : '') + ':</span>' +
        '<div class="form-row__btns">' + (cities || '<span class="muted">Unlock some cities first (see the Map).</span>') + '</div></div>' +
      '<div class="form-row"><span class="muted">Venue size:</span><div class="form-row__btns">' + tiers + '</div></div>' +
      '<div class="form-row"><span class="muted">Start no earlier than:</span><select id="tour-start" class="input"><option value="">As soon as possible</option>' + weeks + '</select></div>' +
      '<button class="btn btn--primary btn--small" data-action="requestTour"' + (problem ? ' disabled' : '') + '>Ask for a tour plan</button>' +
      (problem && d.cities.length ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') +
      '</div>';
  }
};
