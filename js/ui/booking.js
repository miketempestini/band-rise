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
        self.studioHtml(state, app) +
        sections +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('booking'); },
      focusPayBack: function () { app.goBack('booking'); },
      pickDeal: function (e, el) { app.bookingPick(el.getAttribute('data-venue'), el.getAttribute('data-deal')); },
      pickDate: function (e, el) { app.bookingDate(Number(el.getAttribute('data-day'))); },
      sendIn: function (e, el) { app.sendBookingEmail(el.getAttribute('data-block')); },
      cancelDraft: function () { app.bookingPick(null, null); },
      studioPick: function (e, el) { app.studioPick(el.getAttribute('data-studio')); },
      studioDate: function (e, el) { app.studioDate(Number(el.getAttribute('data-day'))); },
      studioSend: function (e, el) { app.sendStudioBooking(el.getAttribute('data-block')); },
      studioCancel: function () { app.studioPick(null); }
    });
    root.querySelectorAll('.studio-song').forEach(function (sel) {
      sel.addEventListener('change', function () { app.studioSong(sel.getAttribute('data-block'), sel.value); });
    });
    root.querySelectorAll('input[name="studio-dayoff"]').forEach(function (radio) {
      radio.addEventListener('change', function () { app.studioJobChoice(radio.value); });
    });
  },

  // The Studio section: pick a studio, a day 10+ days ahead, and a song for up to 3 blocks that day.
  studioHtml: function (state, app) {
    var h = Game.ui.helpers;
    var r = Game.balance.recording;
    var draft = app.studioDraft;
    var originals = Game.rules.recording.recordable(state);

    var studios = ['demo', 'pro', 'top'].map(function (id) {
      var st = r.studios[id];
      var problem = Game.rules.recording.studioProblem(state, id);
      var chosen = draft && draft.studio === id;
      return '<div class="deal' + (chosen ? ' deal--chosen' : '') + (problem ? ' deal--locked' : '') + '">' +
        '<div class="deal__head"><strong>' + Game.content.studios[id].name + '</strong><span class="deal__chance">' +
          h.money(st.cost) + ' a block · +' + st.bonus + '</span></div>' +
        '<p class="hint">' + h.escape(Game.content.studios[id].blurb) + '</p>' +
        (problem ? '<p class="pick__reason">🔒 ' + h.escape(problem) + '</p>'
          : '<div class="deal__foot"><span></span><button class="btn btn--small' + (chosen ? ' btn--primary' : '') +
            '" data-action="studioPick" data-studio="' + id + '"' + (originals.length ? '' : ' disabled title="Write an original first"') + '>' +
            (chosen ? 'Chosen' : 'Book this') + '</button></div>') +
        '</div>';
    }).join('');

    var form = draft ? Game.ui.booking.studioFormHtml(state, app, draft, originals) : '';
    return '<div class="panel">' +
      '<h3 class="panel__title">🎙️ Studio time · book ' + r.bookAheadDays + ' to ' + r.bookAheadMaxDays + ' days ahead · one song per block</h3>' +
      '<p class="hint">Recording quality = half the song\'s quality + a quarter of band musicianship + a quarter of its tightness + the studio bonus. ' +
        'Rehearse a song before recording it. ' +
        (state.player.gear.homeStudio ? 'You own a home setup: use "Record at home" from any free block.' : 'A home setup (in the Shop after your first recording) records for free, capped at ' + r.studios.home.qualityCap + '.') +
        '</p>' +
      (originals.length ? '' : '<p class="pick__reason">You need a finished original to record.</p>') +
      '<div class="venue-grid">' + studios + '</div>' + form +
      '</div>';
  },

  studioFormHtml: function (state, app, draft, originals) {
    var h = Game.ui.helpers;
    var r = Game.balance.recording;
    var studio = r.studios[draft.studio];
    var dates = Game.rules.recording.bookingDays(state).map(function (d) {
      var label = Game.content.calendar.dayNames[Game.rules.day.dayOfWeek(d)].slice(0, 3) + ' W' + Game.rules.day.weekNumber(d);
      return '<button class="date-btn' + (draft.day === d ? ' date-btn--on' : '') + '" data-action="studioDate" data-day="' + d + '">' + label + '</button>';
    }).join('');

    var blocksHtml = '';
    var sessions = [];
    if (draft.day !== null) {
      blocksHtml = Game.balance.time.blocks.map(function (block) {
        var problem = Game.rules.recording.blockProblem(state, draft.day, block);
        var job = !problem && Game.rules.booking.clashesWithJob(state, draft.day, block);
        var picked = draft.sessions[block] || '';
        if (picked) sessions.push({ block: block, songId: picked });
        var options = '<option value="">(no song)</option>' + originals.map(function (s) {
          return '<option value="' + s.id + '"' + (picked === s.id ? ' selected' : '') + '>' + h.escape(s.title) +
            ' (would record at about ' + Game.rules.recording.quality(state, s, draft.studio) + ')</option>';
        }).join('');
        return '<div class="plan__row"><span class="plan__block">' + Game.content.calendar.blockNames[block] + '</span>' +
          (problem ? '<span class="muted">' + h.escape(problem) + '</span>'
            : '<select class="input input--select studio-song" data-block="' + block + '">' + options + '</select>' +
              (job ? '<span class="badge badge--warn">Day job</span>' : '')) +
          '</div>';
      }).join('');
    }

    var needsDayOff = sessions.some(function (s) { return Game.rules.booking.clashesWithJob(state, draft.day, s.block); });
    var dayOff = needsDayOff ? '<div class="form-row"><span class="muted">That\'s during your day job. Take the day off:</span><div class="form-row__btns">' +
      [['vacation', 'Vacation day'], ['sick', 'Call in sick (' + Game.balance.job.sickDayPenalty + ')'], ['skip', 'Skip work (' + Game.balance.job.skipPenalty + ')']].map(function (k) {
        var problem = Game.rules.job.dayOffProblem(state, draft.day, k[0], true);
        return '<label class="switch"><input type="radio" name="studio-dayoff" value="' + k[0] + '"' + (draft.jobChoice === k[0] ? ' checked' : '') +
          (problem ? ' disabled' : '') + '> ' + k[1] + (problem ? ' <span class="muted">(' + h.escape(problem) + ')</span>' : '') + '</label>';
      }).join('') + '</div></div>' : '';

    var request = { studio: draft.studio, day: draft.day, sessions: sessions, jobChoice: needsDayOff ? draft.jobChoice : null };
    var problem = draft.day === null ? null : Game.rules.recording.requestProblem(state, request);
    var send = '';
    if (draft.day !== null && sessions.length && !problem) {
      send = '<div class="form-row"><span class="muted">' + sessions.length + ' song' + (sessions.length === 1 ? '' : 's') + ' · ' +
        h.money(sessions.length * studio.cost) + ' paid on the day. Book it in which block today? (' + Game.content.actions.bookStudio.energyCost + ' energy)</span>' +
        '<div class="form-row__btns">' + Game.balance.time.blocks.map(function (block) {
          var opt = Game.rules.actions.option(Game.rules.actions.clear(state, block).state, block, 'bookStudio');
          var current = Game.rules.actions.plannedEntry(state, block);
          var ok = opt.ok && !(current && current.type !== 'action');
          return '<button class="btn btn--small' + (ok ? ' btn--primary' : '') + '" data-action="studioSend" data-block="' + block + '"' +
            (ok ? '' : ' disabled title="' + h.escape(opt.reason || 'Something is booked then') + '"') + '>' + Game.content.calendar.blockNames[block] + '</button>';
        }).join('') + '</div></div>';
    } else if (problem && sessions.length) {
      send = '<p class="pick__reason">' + h.escape(problem) + '</p>';
    }

    return '<div class="booking-form">' +
      '<div class="form-row"><span class="muted">Pick a day:</span><div class="dates">' + dates + '</div></div>' +
      (blocksHtml ? '<div class="plan">' + blocksHtml + '</div>' : '') +
      dayOff + send +
      '<div class="actions actions--left"><button class="btn btn--ghost btn--small" data-action="studioCancel">Never mind</button></div>' +
      '</div>';
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
