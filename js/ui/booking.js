// booking.js (screen)
// The Booking screen: a button for each city, then that city's venues grouped by tier (each group under a painting
// of that size of venue, each venue drawn as a paper flyer). Each shows its
// requirements (met or not), booking window, deals, acceptance chance, and expected crowd. Pick a venue
// and deal, then a date, then send the email (no block needed, a little energy). The reply comes 1 to 3
// days later. Out of town, each date shows the trip it would take, and open mics are a quick sign-up.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.booking = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.booking;
    var tiers = Game.balance.venues.tiers;
    var cityId = app.bookingCity || 'hometown';
    var city = Game.content.cities[cityId];
    var home = cityId === 'hometown';

    // City tabs: your home country's cities (locked ones say why on hover), then each foreign country's cities once
    // international cities are open (until then, one line says what opens them).
    var tab = function (id) {
      var open = state.cities[id].unlocked;
      return '<button class="btn btn--small' + (id === cityId ? ' btn--primary' : '') + '" data-action="city" data-city="' + id + '"' +
        (open ? '' : ' disabled title="' + h.escape(Game.rules.travel.cityUnlockProblem(state, id) || '') + '"') + '>' +
        h.escape(Game.content.cities[id].name) + '</button>';
    };
    var countryOf = Game.rules.travel.countryOf;
    var homeIds = Object.keys(Game.content.cities).filter(function (id) { return countryOf(id) === 'home'; });
    var abroad = Object.keys(Game.content.countries).filter(function (c) { return c !== 'home'; });
    var anyAbroad = Object.keys(Game.content.cities).some(function (id) { return countryOf(id) !== 'home' && state.cities[id].unlocked; });
    var cityTabs = '<div class="sort-bar">' + homeIds.map(tab).join('') + '</div>' +
      (anyAbroad
        ? abroad.map(function (c) {
            var ids = Object.keys(Game.content.cities).filter(function (id) { return countryOf(id) === c; });
            return '<div class="sort-bar sort-bar--country"><span class="sort-bar__label">' + h.escape(Game.content.countries[c].name) + '</span>' + ids.map(tab).join('') + '</div>';
          }).join('')
        : '<p class="hint">Abroad: ' + h.escape(Game.rules.travel.cityUnlockProblem(state, 'lindenberg') || '') + '</p>');

    // Venues grouped by tier.
    var groups = {};
    Game.rules.booking.venues(cityId).forEach(function (v) {
      groups[v.tier] = groups[v.tier] || [];
      groups[v.tier].push(v);
    });
    var sections = Object.keys(groups).map(function (tier) {
      var w = tiers[tier].bookAhead;
      return '<div class="panel panel--art">' +
        h.artBanner(Game.content.art.venues[tier], tiers[tier].name + 's', 'Book ' + w.min + ' to ' + w.max + ' days ahead, $' +
          tiers[tier].ticket + ' tickets') +
        '<div class="venue-grid">' + groups[tier].map(function (v) { return self.venueHtml(state, app, v); }).join('') + '</div>' +
        '</div>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Book a show</h1>' +
          '<div class="actions actions--left"><button class="btn" data-action="openManager">Manager</button>' +
          '<button class="btn" data-action="back">← Back</button></div>' +
        '</div>' +
        h.notice(app.notice) +
        cityTabs +
        self.waitingHtml(state) +
        (home ? Game.ui.studio.html(state, app)
          : '<p class="hint">' + h.escape(city.name) + ' · ' + Game.rules.travel.legBlocks('hometown', cityId) + ' travel block' +
              (Game.rules.travel.legBlocks('hometown', cityId) === 1 ? '' : 's') + ' each way · ' +
              (Game.rules.travel.isFlight('hometown', cityId) ? '$' + Game.rules.travel.legGas('hometown', cityId, state) * 2 + ' in flights round trip'
                : '$' + Game.balance.travel.gasRoundTrip[city.region] + ' gas round trip') + ' · fans ' + state.cities[cityId].fans.toLocaleString() + ' · buzz ' + Math.round(state.cities[cityId].buzz) +
              '. Travel is booked for you when you accept a show.</p>' + self.openMicHtml(state, app, cityId)) +
        sections +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('booking'); },
      focusPayBack: function () { app.goBack('booking'); },
      pickDeal: function (e, el) { app.bookingPick(el.getAttribute('data-venue'), el.getAttribute('data-deal')); },
      pickDate: function (e, el) { app.bookingDate(Number(el.getAttribute('data-day'))); },
      sendEmail: function () { app.sendBookingEmail(); },
      city: function (e, el) { app.bookingCitySelect(el.getAttribute('data-city')); },
      openManager: function () { app.openManager(); },
      openMicPick: function (e, el) { app.openMicPick(el.getAttribute('data-venue'), Number(el.getAttribute('data-day'))); },
      openMicCancel: function () { app.openMicPick(null); },
      openMicSignUp: function () { app.signUpOpenMic(); },
      cancelDraft: function () { app.bookingPick(null, null); },
      studioPick: function (e, el) { app.studioPick(el.getAttribute('data-studio')); },
      studioDate: function (e, el) { app.studioDate(Number(el.getAttribute('data-day'))); },
      studioSend: function (e, el) { app.sendStudioBooking(el.getAttribute('data-block')); },
      studioCancel: function () { app.studioPick(null); },
      buyTicket: function (e, el) { app.buyTicket(el.getAttribute('data-show')); }
    });
    root.querySelectorAll('.studio-song').forEach(function (sel) {
      sel.addEventListener('change', function () { app.studioSong(sel.getAttribute('data-block'), sel.value); });
    });
    root.querySelectorAll('input[name="studio-dayoff"]').forEach(function (radio) {
      radio.addEventListener('change', function () { app.studioJobChoice(radio.value); });
    });
    root.querySelectorAll('input[name="openmic-dayoff"]').forEach(function (radio) {
      radio.addEventListener('change', function () { app.openMicJobChoice(radio.value); });
    });
  },

  // An out-of-town open mic: pick one of its nights and sign up (no email, no odds). Travel is booked for you.
  openMicHtml: function (state, app, cityId) {
    var h = Game.ui.helpers;
    var tr = Game.rules.travel;
    var venue = Object.keys(Game.content.venues).map(function (id) { return Game.content.venues[id]; })
      .filter(function (v) { return v.cityId === cityId && v.tier === 0; })[0];
    if (!venue) return '';
    var draft = app.openMicDraft && app.openMicDraft.venueId === venue.id ? app.openMicDraft : null;
    var dates = tr.openMicDates(state, venue.id).map(function (d) {
      var label = Game.rules.day.shortDate(d);
      var taken = Game.rules.booking.blockTaken(state, d, venue.showBlock, true) || tr.check(state, venue.id, d, 'openMic').problem;
      return '<button class="date-btn' + (draft && draft.day === d ? ' date-btn--on' : '') + '" data-action="openMicPick" data-venue="' + venue.id +
        '" data-day="' + d + '"' + (taken ? ' disabled title="' + h.escape(taken) + '"' : '') + '>' + label + '</button>';
    }).join('');
    var form = '';
    if (draft) {
      var preview = tr.preview(state, venue.id, draft.day, 'openMic');
      var problem = tr.openMicProblem(state, venue.id, draft.day, draft.jobChoice);
      form = Game.ui.booking.tripHtml(preview) +
        (preview.jobDays.length ? Game.ui.booking.dayOffChoiceHtml(state, preview.jobDays, draft.jobChoice, 'openmic-dayoff') : '') +
        '<div class="actions actions--left"><button class="btn btn--primary btn--small" data-action="openMicSignUp"' + (problem ? ' disabled' : '') + '>Sign up</button>' +
          '<button class="btn btn--ghost btn--small" data-action="openMicCancel">Never mind</button>' +
          (problem && !(preview.jobDays.length && !draft.jobChoice) ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') + '</div>';
    }
    return '<div class="panel panel--art">' +
      h.artBanner(Game.content.art.venues[0], 'Open mic: ' + h.escape(venue.name), Game.content.calendar.dayNames[venue.openMicDay] + ' evenings') +
      '<p class="hint">No email, no odds: just sign up for a night (' + Game.balance.travel.openMicSignupDays.min + ' to ' +
        Game.balance.travel.openMicSignupDays.max + ' days ahead) and play ' + Game.balance.songs.setlist.openMic.songs + ' songs. A cheap way to win your first fans here.</p>' +
      '<div class="dates">' + dates + '</div>' + (draft ? '<div class="booking-form">' + form + '</div>' : '') +
      '</div>';
  },

  // A trip preview: each leg, gas, hotel nights, and the energy the driving takes.
  tripHtml: function (preview) {
    var h = Game.ui.helpers;
    var tr = Game.rules.travel;
    if (preview.problem) return '<p class="pick__reason">' + h.escape(preview.problem) + '</p>';
    var when = function (t) {
      return Game.rules.day.shortDate(tr.slotDay(t)) +
        ' ' + Game.content.calendar.blockNames[tr.slotBlock(t)].toLowerCase();
    };
    var legs = preview.legs.map(function (leg) {
      return '<li>' + (tr.isFlight(leg.from, leg.to) ? (tr.legKind(leg.from, leg.to) === 'hop' ? 'Short flight ' : 'Fly ') : 'Drive ') + h.escape(Game.content.cities[leg.from].name) + ' → ' + h.escape(Game.content.cities[leg.to].name) + ': ' +
        leg.slots.map(when).join(', ') + '</li>';
    }).join('');
    return '<div class="trip"><strong>The trip' + (preview.showCount > 1 ? ' (with your other show' + (preview.showCount > 2 ? 's' : '') + ' nearby)' : '') + '</strong>' +
      '<ul class="log">' + legs + '</ul>' +
      '<p class="hint">' + (preview.legs.some(function (leg) { return tr.isFlight(leg.from, leg.to); }) ? 'Flights ' : 'Gas ') + h.money(preview.gas) + ' · ' +
        preview.hotelNights + ' hotel night' + (preview.hotelNights === 1 ? '' : 's') +
        ' (' + h.money(preview.hotelCost) + ')' + (preview.yourCost < preview.gas + preview.hotelCost ? ' · your part ' + h.money(preview.yourCost) + ' (the band chips in)' : '') +
        ' · ' + preview.energy + ' energy of travel' + (preview.jetLag ? ' (' + preview.jetLag + ' of it jet lag)' : '') +
        (preview.jobDays.length ? ' · needs ' + preview.jobDays.map(function (d) { return h.dateLabel(d); }).join(', ') + ' off work' : '') + '</p></div>';
  },

  // Radio buttons for how to take workdays off for a trip (vacation, sick, or skip).
  dayOffChoiceHtml: function (state, days, chosen, name) {
    var h = Game.ui.helpers;
    return '<div class="form-row"><span class="muted">That\'s during your day job. Take ' + (days.length === 1 ? 'the day' : 'those days') + ' off:</span><div class="form-row__btns">' +
      [['vacation', 'Vacation day' + (days.length > 1 ? 's' : '')], ['sick', 'Call in sick (' + Game.balance.job.sickDayPenalty + (days.length > 1 ? ' each' : '') + ')'],
        ['skip', 'Skip work (' + Game.balance.job.skipPenalty + (days.length > 1 ? ' each' : '') + ')']].map(function (k) {
        var problem = null;
        days.forEach(function (d) { problem = problem || Game.rules.job.dayOffProblem(state, d, k[0], true); });
        return '<label class="switch"><input type="radio" name="' + name + '" value="' + k[0] + '"' + (chosen === k[0] ? ' checked' : '') +
          (problem ? ' disabled' : '') + '> ' + k[1] + (problem ? ' <span class="muted">(' + h.escape(problem) + ')</span>' : '') + '</label>';
      }).join('') + '</div></div>';
  },

  // Requests you're waiting on.
  waitingHtml: function (state) {
    var h = Game.ui.helpers;
    var lines = [];
    Object.keys(state.requests).forEach(function (id) {
      var r = state.requests[id];
      if (r.status !== 'pending') return;
      lines.push('Waiting to hear from <strong>' + h.escape(Game.content.venues[r.venueId].name) + '</strong> about ' +
        h.dateLabel(r.gigDay) + ' (reply by ' + h.dateLabel(r.replyDay) + ', ' + Math.round(r.chance * 100) + '% chance).');
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

    var deals = booking.dealsFor(venue).map(function (deal) {
      var reqs = booking.requirements(state, venue, deal);
      var allMet = reqs.every(function (r) { return r.met; });
      var chance = booking.acceptanceChance(state, venue, deal);
      var pay;
      if (deal === 'door') pay = '$' + booking.payFor(venue, 'door', crowd.low) + ' to $' + booking.payFor(venue, 'door', crowd.high) + ' at the expected crowd';
      else pay = h.money(booking.payFor(venue, deal, 0));
      var blocked = !allMet || banned || vs.pendingRequestId;
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

    return '<div class="venue paper' + (draft ? ' venue--open' : '') + '">' +
      '<div class="venue__head"><span class="venue__name">' + h.escape(venue.name) + '</span>' +
        '<span class="muted">' + venue.capacity.toLocaleString() + ' capacity · ' + Game.content.calendar.blockNames[venue.showBlock] + ' shows</span></div>' +
      '<div class="venue__stats"><span>Expected crowd <strong>' + crowd.low + ' to ' + crowd.high + '</strong> of ' + venue.capacity.toLocaleString() + '</span>' +
        '<span>Relationship <strong>' + Math.round(vs.relationship) + '</strong></span>' +
        '<span>Set: ' + booking.setFor(venue, booking.dealsFor(venue)[0]).size + ' songs</span></div>' +
      status +
      deals +
      (draft ? Game.ui.booking.formHtml(state, app, venue, draft) : '') +
      Game.ui.booking.showsHtml(state, venue) +
      '</div>';
  },

  // A short reason for a ticket you can't buy (the full reason shows on hover).
  busyText: function (problem) {
    if (/while you're there/.test(problem)) return 'Only on a trip here';
    if (/on the road/.test(problem)) return 'You\'re away';
    if (/over/.test(problem)) return 'Over';
    return 'Busy that night';
  },

  // Other bands' coming shows at a venue (from its calendar), each with a ticket button.
  showsHtml: function (state, venue) {
    var h = Game.ui.helpers;
    var sc = Game.rules.scene;
    if (venue.deals.inStore) return ''; // record-store in-stores don't book other bands
    var shows = sc.showsAt(state, venue.id, state.day, Game.balance.scene.flyerShows);
    if (!shows.length) return '<div class="venue__shows"><p class="hint">Nothing on their calendar yet.</p></div>';
    var price = sc.ticketPrice(venue);
    var rows = shows.map(function (show) {
      var head = sc.band(state, show.bandId);
      var opener = show.openerId && sc.band(state, show.openerId);
      var plan = state.schedule[show.day];
      var mine = plan && plan.evening && state.entries[plan.evening];
      var have = mine && mine.type === 'ticket' && mine.showId === show.id;
      var problem = have ? null : sc.ticketProblem(state, show.id);
      var tag = function (band) { return band && band.rival ? ' <span class="badge badge--rival">Rival</span>' : ''; };
      return '<li class="gig-row">' +
        '<span class="gig-row__date">' + Game.rules.day.shortDate(show.day) + '</span>' +
        '<span class="gig-row__bill"><strong>' + h.escape(head ? head.name : 'A touring band') + '</strong>' + tag(head) +
          (show.playerOpens ? '<span class="muted">, with you opening</span>' : (opener ? '<span class="muted">, with ' + h.escape(opener.name) + '</span>' + tag(opener) : '')) + '</span>' +
        (have ? '<span class="badge badge--good">Ticket bought</span>'
          : (show.playerOpens ? '' : (problem ? '<span class="gig-row__busy" title="' + h.escape(problem) + '">' + h.escape(Game.ui.booking.busyText(problem)) + '</span>'
            : '<button class="btn btn--small" data-action="buyTicket" data-show="' + show.id + '" title="Paid now, no refunds. -' +
              Game.balance.scene.show.energy + ' energy on the night.">Ticket ' + h.money(price) + '</button>'))) +
        '</li>';
    }).join('');
    return '<div class="venue__shows"><span class="venue__shows-title">Coming up here</span><ul class="gig-rows">' + rows + '</ul></div>';
  },

  // Step 2 and 3 of a request: pick a date (out of town, see the trip it would take), then send the email.
  formHtml: function (state, app, venue, draft) {
    var h = Game.ui.helpers;
    var away = venue.cityId !== 'hometown';
    var dates = Game.rules.booking.bookingDates(state, venue).map(function (d) {
      var label = Game.rules.day.shortDate(d.day);
      var clash = d.free && (away ? Game.rules.travel.check(state, venue.id, d.day, draft.deal).jobDays.length > 0
        : Game.rules.booking.clashesWithJob(state, d.day, venue.showBlock));
      return '<button class="date-btn' + (draft.gigDay === d.day ? ' date-btn--on' : '') + (clash ? ' date-btn--job' : '') + '"' +
        ' data-action="pickDate" data-day="' + d.day + '"' + (d.free ? '' : ' disabled') +
        ' title="' + h.escape(d.free ? (clash ? 'During your day job: you\'d need a day off' : h.dateLabel(d.day)) : d.why) + '">' + label + '</button>';
    }).join('');

    var send = '';
    if (draft.gigDay !== null && draft.gigDay !== undefined) {
      var cost = Game.balance.energy.cost.email;
      var tired = state.player.energy < cost;
      send = (away ? Game.ui.booking.tripHtml(Game.rules.travel.preview(state, venue.id, draft.gigDay, draft.deal)) : '') +
        '<div class="form-row"><button class="btn btn--primary btn--small" data-action="sendEmail"' + (tired ? ' disabled' : '') + '>Send the email (-' + cost + ' energy)</button>' +
        '<span class="hint">' + (tired ? 'You\'re too tired to write an email.' : 'No block needed: email as many venues as you like today.') + '</span></div>';
    }

    return '<div class="booking-form">' +
      '<div class="form-row"><span class="muted">Pick a date (' + Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + ' show):</span>' +
        '<div class="dates">' + dates + '</div>' +
        '<span class="hint">Orange dates ' + (away ? 'need time off work for the trip' : 'fall on your day job') +
          ': accepting would need a vacation day, a sick day, or skipping work.</span></div>' +
      send +
      '<div class="actions actions--left"><button class="btn btn--ghost btn--small" data-action="cancelDraft">Never mind</button></div>' +
      '</div>';
  }
};
