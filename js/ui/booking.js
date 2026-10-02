// booking.js (screen)
// The Booking screen: venues grouped by tier. Each shows its requirements (met or not), booking window,
// deals, acceptance chance, and expected crowd. Pick a venue and deal, then a date, then which block
// today you'll spend emailing them (it's an Admin action). The reply comes 1 to 3 days later.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.booking = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.booking;
    var tiers = Game.balance.venues.tiers;

    // Venues grouped by tier.
    var groups = {};
    Game.rules.booking.venues().forEach(function (v) {
      groups[v.tier] = groups[v.tier] || [];
      groups[v.tier].push(v);
    });
    var sections = Object.keys(groups).map(function (tier) {
      var w = tiers[tier].bookAhead;
      return '<div class="panel">' +
        '<h3 class="panel__title">' + tiers[tier].name + 's · book ' + w.min + ' to ' + w.max + ' days ahead · $' +
          tiers[tier].ticket + ' tickets</h3>' +
        '<div class="venue-grid">' + groups[tier].map(function (v) { return self.venueHtml(state, app, v); }).join('') + '</div>' +
        '</div>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Book a show</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        self.waitingHtml(state) +
        sections +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('booking'); },
      focusPayBack: function () { app.goBack('booking'); },
      pickDeal: function (e, el) { app.bookingPick(el.getAttribute('data-venue'), el.getAttribute('data-deal')); },
      pickDate: function (e, el) { app.bookingDate(Number(el.getAttribute('data-day'))); },
      sendIn: function (e, el) { app.sendBookingEmail(el.getAttribute('data-block')); },
      cancelDraft: function () { app.bookingPick(null, null); }
    });
  },

  // Requests you're waiting on, and emails planned for today.
  waitingHtml: function (state) {
    var h = Game.ui.helpers;
    var lines = [];
    Object.keys(state.requests).forEach(function (id) {
      var r = state.requests[id];
      if (r.status !== 'pending') return;
      lines.push('Waiting to hear from <strong>' + h.escape(Game.content.venues[r.venueId].name) + '</strong> about ' +
        h.dateLabel(r.gigDay) + ' (reply by ' + h.dateLabel(r.replyDay) + ', ' + Math.round(r.chance * 100) + '% chance).');
    });
    Object.keys(state.entries).forEach(function (id) {
      var e = state.entries[id];
      if (e.actionId === 'emailVenue' && e.day === state.day) {
        lines.push('Email to <strong>' + h.escape(Game.content.venues[e.request.venueId].name) + '</strong> planned for this ' +
          Game.content.calendar.blockNames[e.block].toLowerCase() + ' (about ' + h.dateLabel(e.request.gigDay) + '). It goes out when you end the day.');
      }
    });
    if (!lines.length) return '';
    return '<div class="panel"><h3 class="panel__title">Waiting on</h3><ul class="log">' +
      lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></div>';
  },

  // One venue's card: what it needs, its deals with odds and pay, and (when chosen) the booking form.
  venueHtml: function (state, app, venue) {
    var h = Game.ui.helpers;
    var booking = Game.rules.booking;
    var vs = state.venues[venue.id];
    var draft = app.bookingDraft && app.bookingDraft.venueId === venue.id ? app.bookingDraft : null;
    var crowd = Game.rules.gigs.crowdRange(state, venue);
    var tier = Game.balance.venues.tiers[venue.tier];
    var banned = vs.bannedUntilDay !== null && state.day < vs.bannedUntilDay;
    var plannedToday = Object.keys(state.entries).some(function (id) {
      var e = state.entries[id];
      return e.actionId === 'emailVenue' && e.day === state.day && e.request.venueId === venue.id;
    });

    var deals = booking.dealsFor(venue).map(function (deal) {
      var reqs = booking.requirements(state, venue, deal);
      var allMet = reqs.every(function (r) { return r.met; });
      var chance = booking.acceptanceChance(state, venue, deal);
      var pay;
      if (deal === 'door') pay = '$' + booking.payFor(venue, 'door', crowd.low) + ' to $' + booking.payFor(venue, 'door', crowd.high) + ' at the expected crowd';
      else pay = h.money(booking.payFor(venue, deal, 0));
      var blocked = !allMet || banned || vs.pendingRequestId || plannedToday;
      var chosen = draft && draft.deal === deal;
      return '<div class="deal' + (chosen ? ' deal--chosen' : '') + (allMet ? '' : ' deal--locked') + '">' +
        '<div class="deal__head"><strong>' + h.escape(booking.dealLabel(venue, deal)) + '</strong>' +
          (allMet ? '<span class="deal__chance">' + Math.round(chance * 100) + '% chance</span>' : '<span class="badge">Locked</span>') + '</div>' +
        '<ul class="reqs">' + reqs.map(function (r) {
          return '<li class="' + (r.met ? 'pos' : 'neg') + '">' + (r.met ? '✓ ' : '✗ ') + h.escape(r.text) + '</li>';
        }).join('') + '</ul>' +
        '<div class="deal__foot"><span class="muted">Pay: ' + pay + '</span>' +
          (blocked ? '' : '<button class="btn btn--small' + (chosen ? ' btn--primary' : '') + '" data-action="pickDeal" data-venue="' + venue.id + '" data-deal="' + deal + '">' +
            (chosen ? 'Chosen' : 'Request this') + '</button>') +
        '</div>' +
        '</div>';
    }).join('');

    var status = '';
    if (banned) status = '<p class="panel__warn">Won\'t book you until ' + h.dateLabel(vs.bannedUntilDay) + ' (no-show).</p>';
    else if (vs.pendingRequestId) status = '<p class="hint">Request sent. Waiting for their reply.</p>';
    else if (plannedToday) status = '<p class="hint">You plan to email them today.</p>';

    return '<div class="venue' + (draft ? ' venue--open' : '') + '">' +
      '<div class="venue__head"><span class="venue__name">' + h.escape(venue.name) + '</span>' +
        '<span class="muted">' + venue.capacity.toLocaleString() + ' capacity · ' + Game.content.calendar.blockNames[venue.showBlock] + ' shows</span></div>' +
      '<div class="venue__stats"><span>Expected crowd <strong>' + crowd.low + ' to ' + crowd.high + '</strong> of ' + venue.capacity.toLocaleString() + '</span>' +
        '<span>Relationship <strong>' + Math.round(vs.relationship) + '</strong></span>' +
        '<span>Set: ' + booking.setFor(venue, booking.dealsFor(venue)[0]).size + ' songs</span></div>' +
      status +
      deals +
      (draft ? Game.ui.booking.formHtml(state, app, venue, draft) : '') +
      '</div>';
  },

  // Step 2 and 3 of a request: pick a date, then which block today to send the email in.
  formHtml: function (state, app, venue, draft) {
    var h = Game.ui.helpers;
    var dates = Game.rules.booking.bookingDates(state, venue).map(function (d) {
      var label = Game.content.calendar.dayNames[Game.rules.day.dayOfWeek(d.day)].slice(0, 3) + ' W' + Game.rules.day.weekNumber(d.day);
      var clash = d.free && Game.rules.booking.clashesWithJob(state, d.day, venue.showBlock);
      return '<button class="date-btn' + (draft.gigDay === d.day ? ' date-btn--on' : '') + (clash ? ' date-btn--job' : '') + '"' +
        ' data-action="pickDate" data-day="' + d.day + '"' + (d.free ? '' : ' disabled') +
        ' title="' + h.escape(d.free ? (clash ? 'During your day job: you\'d need a day off' : h.dateLabel(d.day)) : d.why) + '">' + label + '</button>';
    }).join('');

    var send = '';
    if (draft.gigDay !== null && draft.gigDay !== undefined) {
      var blocks = Game.balance.time.blocks.map(function (block) {
        var opt = Game.rules.actions.option(Game.rules.actions.clear(state, block).state, block, 'emailVenue');
        var current = Game.rules.actions.plannedEntry(state, block);
        var busy = current && current.type === 'gig';
        var ok = opt.ok && !busy;
        return '<button class="btn btn--small' + (ok ? ' btn--primary' : '') + '" data-action="sendIn" data-block="' + block + '"' +
          (ok ? '' : ' disabled title="' + h.escape(opt.reason || 'A show is booked then') + '"') + '>' +
          Game.content.calendar.blockNames[block] + (current && ok ? ' (replaces ' + h.escape(Game.content.actions[current.actionId].name) + ')' : '') + '</button>';
      }).join('');
      send = '<div class="form-row"><span class="muted">Send the email in which block today? (' +
        Game.content.actions.emailVenue.energyCost + ' energy)</span><div class="form-row__btns">' + blocks + '</div></div>';
    }

    return '<div class="booking-form">' +
      '<div class="form-row"><span class="muted">Pick a date (' + Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + ' show):</span>' +
        '<div class="dates">' + dates + '</div>' +
        '<span class="hint">Orange dates fall on your day job: accepting would need a vacation day, a sick day, or skipping work.</span></div>' +
      send +
      '<div class="actions actions--left"><button class="btn btn--ghost btn--small" data-action="cancelDraft">Never mind</button></div>' +
      '</div>';
  }
};
