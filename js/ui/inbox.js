// inbox.js
// The Inbox screen: replies from venues, opening slot offers, residency contracts, session work offers
// (and news when a song you played on comes out), and event records.
// Open offers have Accept (or Review contract) and Decline, and an answer-by date.
// If a show lands on your day job, Accept asks how you'll take the day off.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.inbox = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.inbox;
    var messages = state.inbox.slice().reverse(); // newest first
    var offerKinds = ['opening', 'residency', 'sessionWork', 'managerOffer', 'labelOffer', 'tourProposal', 'arenaOffer', 'festivalOffer'];
    var isOpen = function (m) { return !m.resolved && (m.data.yes || offerKinds.indexOf(m.kind) !== -1); };
    var open = messages.filter(isOpen);
    var rest = messages.filter(function (m) { return !isOpen(m); });

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Inbox</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        (messages.length ? '' : '<p class="hint">No messages yet. Email a venue from Book; their reply lands here in ' +
          Game.balance.venues.replyDays.min + ' to ' + Game.balance.venues.replyDays.max + ' days.</p>') +
        (open.length ? '<div class="panel"><h3 class="panel__title">Offers waiting for you</h3>' + open.map(function (m) { return self.messageHtml(state, m); }).join('') + '</div>' : '') +
        (rest.length ? '<div class="panel"><h3 class="panel__title">Earlier</h3>' + rest.map(function (m) { return self.messageHtml(state, m); }).join('') + '</div>' : '') +
      '</section>';

    root.querySelectorAll('.tour-ad').forEach(function (sel) {
      sel.addEventListener('change', function () { app.tourAdPick(sel.getAttribute('data-id'), sel.getAttribute('data-city'), sel.value); });
    });
    h.bind(root, {
      back: function () { app.goBack('inbox'); },
      focusPayBack: function () { app.goBack('inbox'); },
      accept: function (e, el) { app.acceptOffer(el.getAttribute('data-id'), el.getAttribute('data-job') || null); },
      decline: function (e, el) { app.declineOffer(el.getAttribute('data-id')); },
      acceptOpening: function (e, el) { app.acceptOpening(el.getAttribute('data-id')); },
      reviewContract: function (e, el) { app.openContract(el.getAttribute('data-id')); },
      acceptSessionWork: function (e, el) { app.acceptSessionWork(el.getAttribute('data-id')); },
      hireManager: function (e, el) { app.hireManager(el.getAttribute('data-id')); },
      signLabel: function (e, el) { app.signLabel(el.getAttribute('data-id')); },
      acceptTour: function (e, el) { app.acceptTour(el.getAttribute('data-id'), el.getAttribute('data-job') || null); },
      acceptBigShow: function (e, el) { app.acceptBigShow(el.getAttribute('data-id'), el.getAttribute('data-job') || null); }
    });
  },

  // An opening slot or residency offer.
  offerHtml: function (state, m) {
    var h = Game.ui.helpers;
    var d = m.data;
    var venue = Game.content.venues[d.venueId];
    var head, body, buttons = '';
    if (m.kind === 'opening') {
      head = '🎸 ' + venue.name + ' wants you to open!';
      body = 'A touring band is headlining on ' + h.dateLabel(d.day) + '. You\'d play a ' + Game.balance.offers.openingSlot.setSize +
        '-song opening set to their crowd (' + Math.round(Game.balance.offers.openingSlot.crowdShare.min * 100) + '-' +
        Math.round(Game.balance.offers.openingSlot.crowdShare.max * 100) + '% of ' + venue.capacity + ' people) for $' + d.fee +
        '. Fans come from their crowd at half the usual rate.';
      if (!m.resolved) {
        buttons = '<button class="btn btn--small btn--primary" data-action="acceptOpening" data-id="' + m.id + '">Accept</button> ' +
          '<button class="btn btn--small" data-action="decline" data-id="' + m.id + '">Decline</button>';
      }
    } else {
      var terms = d.signed || d;
      head = '📜 Residency offer from ' + venue.name;
      body = terms.weeks + ' ' + Game.content.calendar.dayNames[terms.weekday] + ' nights at $' + terms.rate + ' a night, starting at least a week from now.' +
        (d.counter && !m.resolved ? ' Your counter-offer: ' + d.counter.weeks + ' ' + Game.content.calendar.dayNames[d.counter.weekday] +
          's at $' + d.counter.rate + ' (' + (d.counter.status === 'pending' ? 'answer tomorrow' : 'they said no') + ').' : '');
      if (!m.resolved) {
        buttons = '<button class="btn btn--small btn--primary" data-action="reviewContract" data-id="' + m.id + '">Review contract</button> ' +
          '<button class="btn btn--small" data-action="decline" data-id="' + m.id + '">Decline</button>';
      }
    }
    var status = m.resolved
      ? '<span class="badge">' + ({ accepted: 'Accepted', declined: 'Declined', expired: 'Expired' }[m.resolved] || m.resolved) + '</span>'
      : '<span class="muted">Answer by ' + h.dateLabel(m.expiresDay) + '</span>';
    return '<div class="message' + (m.read ? '' : ' message--new') + '">' +
      '<div class="message__head"><strong class="pos">' + h.escape(head) + '</strong>' + (m.read ? '' : ' <span class="badge badge--warn">New</span>') +
        '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
      '<p>' + h.escape(body) + '</p>' +
      '<div class="message__foot">' + buttons + ' ' + status + '</div></div>';
  },

  // A session work offer: the band, the song, every session's time, the pay, and the streaming share.
  sessionWorkHtml: function (state, m) {
    var h = Game.ui.helpers;
    var w = Game.balance.sessionWork;
    var d = m.data;
    var times = d.sessions.map(function (slot) {
      return h.dateLabel(slot.day) + ' ' + Game.content.calendar.blockNames[slot.block].toLowerCase();
    }).join('; ');
    var buttons = '';
    if (!m.resolved) {
      var problem = Game.rules.sessionWork.acceptProblem(state, m.id);
      buttons = '<button class="btn btn--small btn--primary" data-action="acceptSessionWork" data-id="' + m.id + '"' + (problem ? ' disabled' : '') + '>Accept</button> ' +
        '<button class="btn btn--small" data-action="decline" data-id="' + m.id + '">Decline</button>' +
        (problem ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '');
    }
    var status = m.resolved
      ? '<span class="badge">' + ({ accepted: 'Accepted', declined: 'Declined', expired: 'Expired' }[m.resolved] || m.resolved) + '</span>'
      : '<span class="muted">Answer by ' + h.dateLabel(m.expiresDay) + '</span>';
    return '<div class="message' + (m.read ? '' : ' message--new') + '">' +
      '<div class="message__head"><strong class="pos">🎧 ' + h.escape(d.bandName) + ' want you on their recording</strong>' +
        (m.read ? '' : ' <span class="badge badge--warn">New</span>') + '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
      '<p>' + d.sessions.length + ' studio sessions for their song "' + h.escape(d.songTitle) + '": ' + h.escape(times) + '. ' +
        h.money(d.fee) + ' a session, -' + Game.balance.energy.cost.sessionWork + ' energy each. Play every session and you get ' +
        Math.round(w.streamingShare * 100) + '% of the song\'s streaming money once it\'s out.</p>' +
      '<div class="message__foot">' + buttons + ' ' + status + '</div></div>';
  },

  // A message card: a heading, a body (HTML), buttons, and the answer-by date or the outcome.
  cardHtml: function (m, head, body, buttons) {
    var h = Game.ui.helpers;
    var status = m.resolved
      ? '<span class="badge">' + ({ accepted: 'Accepted', declined: 'Declined', expired: 'Expired' }[m.resolved] || m.resolved) + '</span>'
      : (m.expiresDay !== null ? '<span class="muted">Answer by ' + h.dateLabel(m.expiresDay) + '</span>' : '');
    return '<div class="message' + (m.read ? '' : ' message--new') + '">' +
      '<div class="message__head"><strong class="pos">' + h.escape(head) + '</strong>' + (m.read ? '' : ' <span class="badge badge--warn">New</span>') +
        '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' + body +
      (buttons || status ? '<div class="message__foot">' + (m.resolved ? '' : buttons || '') + ' ' + status + '</div>' : '') + '</div>';
  },

  // Accept buttons that ask how to take workdays off when an offer needs them (one button per way).
  jobButtonsHtml: function (state, m, action, jobDays, problemFor, label) {
    var h = Game.ui.helpers;
    if (!jobDays.length) {
      var p = problemFor(null);
      return '<button class="btn btn--small btn--primary" data-action="' + action + '" data-id="' + m.id + '"' + (p ? ' disabled' : '') + '>' + label + '</button>' +
        (p ? ' <span class="pick__reason">' + h.escape(p) + '</span>' : '');
    }
    return '<p class="hint">This keeps you away from your day job on ' + jobDays.map(function (x) { return h.dateLabel(x); }).join(', ') + '. How will you take ' +
      (jobDays.length > 1 ? 'those days' : 'the day') + ' off?</p>' +
      [['vacation', 'vacation'], ['sick', 'call in sick'], ['skip', 'skip work']].map(function (k) {
        var p = problemFor(k[0]);
        return '<button class="btn btn--small' + (p ? '' : ' btn--primary') + '" data-action="' + action + '" data-id="' + m.id + '" data-job="' + k[0] + '"' +
          (p ? ' disabled title="' + h.escape(p) + '"' : '') + '>' + label + ', ' + k[1] + '</button>';
      }).join(' ');
  },

  // Phase 12 messages: the manager's and label's offers, tour proposals, arena and festival offers, and notes.
  bigTimeHtml: function (state, m) {
    var h = Game.ui.helpers;
    var self = Game.ui.inbox;
    var b = Game.balance;
    var d = m.data;
    var decline = '<button class="btn btn--small" data-action="decline" data-id="' + m.id + '">Decline</button>';
    if (m.kind === 'note') return self.cardHtml(m, d.title, '<p>' + h.escape(d.text) + '</p>', '');
    if (m.kind === 'managerOffer') {
      var who = Game.content.business.manager;
      return self.cardHtml(m, '💼 ' + who.name + ' wants to manage you',
        '<p>' + h.escape(who.company) + ' takes ' + Math.round(b.manager.gigPayCut * 100) + '% of your gig pay. In return: a ' + b.time.managerBookingWeeks +
        '-week calendar, auto-booking by your rules, tours planned on request, and the press and radio push.</p>',
        '<button class="btn btn--small btn--primary" data-action="hireManager" data-id="' + m.id + '">Hire them</button> ' + decline);
    }
    if (m.kind === 'labelOffer') {
      return self.cardHtml(m, '📀 ' + Game.content.business.label.name + ' wants to sign you',
        '<p>A <strong>' + h.money(d.advance) + '</strong> advance, paid now. You get the Top studio' + (Game.rules.manager.hired(state) ? ' and the National cities' : ' (and National cities once you have a manager)') +
        '. The label keeps ' + Math.round(b.label.streamingCut * 100) + '% of your streaming money until the advance is paid back. Turn it down and they\'ll ask again in ' +
        b.label.reofferWeeks + ' weeks.</p>',
        '<button class="btn btn--small btn--primary" data-action="signLabel" data-id="' + m.id + '">Sign</button> ' + decline);
    }
    if (m.kind === 'tourProposal') {
      var ads = (m.resolved ? null : Game.app.tourAds[m.id]) || {};
      var e = d.shows.length && !m.resolved ? Game.rules.manager.proposalEstimate(state, m.id, ads) : d.estimate;
      var packages = b.manager.tour.ads;
      var adNames = { posters: 'Posters and playlists', local: 'Local ads', full: 'Full campaign' };
      var seen = {};
      var rows = e.rows.map(function (r) {
        var v = Game.content.venues[r.venueId];
        var city = v.cityId;
        var first = !seen[city];
        seen[city] = true;
        var select = m.resolved || !first ? '' : '<select class="input tour-ad" data-id="' + m.id + '" data-city="' + city + '"><option value="">No ads</option>' +
          Object.keys(packages).map(function (k) {
            var pk = packages[k];
            return '<option value="' + k + '"' + (ads[city] === k ? ' selected' : '') + '>' + adNames[k] + ' (' + h.money(pk.cost) + ': +' + pk.buzz + ' buzz' +
              (pk.fans ? ', +' + pk.fans + ' fans' : '') + ')</option>';
          }).join('') + '</select>';
        return '<tr><td>' + h.dateLabel(r.day) + '</td><td>' + h.escape(v.name) + ', ' + h.escape(Game.content.cities[city].name) + '</td><td>' + select + '</td><td>' +
          (r.crowdNoAds !== undefined && r.crowd !== r.crowdNoAds ? r.crowdNoAds + ' → <strong>' + r.crowd + '</strong>' : r.crowd) +
          '</td><td>' + h.money(r.yourPay) + '</td></tr>';
      }).join('');
      var skipped = d.skipped.length ? '<p class="hint">Skipped: ' + d.skipped.map(function (x) {
        return h.escape(Game.content.cities[x.cityId].name) + ' (' + h.escape(x.why) + ')';
      }).join('; ') + '</p>' : '';
      var body = (d.shows.length
        ? '<table class="quit-table"><thead><tr><th>Date</th><th>Venue</th><th>Ads</th><th>Crowd (about)</th><th>Your pay</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          '<p class="hint">Your pay is after the manager\'s cut and the band\'s shares, at today\'s fans and buzz. Your costs: travel ' + h.money(e.travel) +
          ', hotels ' + h.money(e.hotels) + ' (the band chips in for the rest)' + (e.production ? ', production ' + h.money(e.production) : '') +
          (e.adCost ? ', ads ' + h.money(e.adCost) : '') + '. About <strong>' + h.money(e.net) + '</strong> left over. ' +
          'Ads land a week before the show and hold that city\'s buzz until then. Your manager\'s daily posts and word of mouth on tour add a little more.</p>'
        : '<p>Your manager couldn\'t fit any shows.</p>') + skipped;
      var buttons = d.shows.length ? self.jobButtonsHtml(state, m, 'acceptTour', e.jobDays.filter(function (x) { return Game.rules.job.worksOn(state, x); }),
        function (choice) { return Game.rules.manager.tourAcceptProblem(state, m.id, choice) || Game.rules.manager.adsProblem(state, m.id, ads); },
        'Book the tour' + (e.adCost ? ' + ads' : '')) + ' ' + decline : decline;
      return self.cardHtml(m, '🚐 Tour proposal: ' + d.shows.length + ' show' + (d.shows.length === 1 ? '' : 's'), body, buttons);
    }
    // Arena or festival offer.
    var venue = Game.content.venues[d.venueId];
    var arena = m.kind === 'arenaOffer';
    var preview = Game.rules.travel.preview(Game.rules.booking.withoutMessage(state, m.id), d.venueId, d.day, arena ? 'arena' : 'festival');
    var bodyBig = '<p>' + (arena ? 'Headline ' : 'Play a slot at ') + h.escape(venue.name) + ' in ' + h.escape(Game.content.cities[venue.cityId].name) + ', ' +
      h.dateLabel(d.day) + ' (' + Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + '): <strong>' + h.money(d.fee) + '</strong> flat, ' +
      Game.rules.booking.setFor(venue, arena ? 'arena' : 'festival').size + '-song set. ' +
      (arena ? 'Production costs ' + h.money(b.production.arena) + ' on the night.' : 'The festival provides production.') + '</p>' + Game.ui.booking.tripHtml(preview);
    return self.cardHtml(m, (arena ? '🏟️ Arena offer: ' : '🎪 Festival offer: ') + venue.name, bodyBig,
      self.jobButtonsHtml(state, m, 'acceptBigShow', Game.rules.bigShows.jobDays(state, m.id),
        function (choice) { return Game.rules.bigShows.acceptProblem(state, m.id, choice); }, 'Accept') + ' ' + decline);
  },

  messageHtml: function (state, m) {
    var h = Game.ui.helpers;
    var d = m.data;
    if (['note', 'managerOffer', 'labelOffer', 'tourProposal', 'arenaOffer', 'festivalOffer'].indexOf(m.kind) !== -1) return Game.ui.inbox.bigTimeHtml(state, m);
    if (m.kind === 'opening' || m.kind === 'residency') return Game.ui.inbox.offerHtml(state, m);
    if (m.kind === 'sessionWork') return Game.ui.inbox.sessionWorkHtml(state, m);
    if (m.kind === 'sessionRelease') {
      var work = state.sessionWork[d.workId];
      return '<div class="message' + (m.read ? '' : ' message--new') + '">' +
        '<div class="message__head"><strong class="pos">🎶 ' + h.escape(work.bandName) + ' released "' + h.escape(work.songTitle) + '"</strong>' +
          (m.read ? '' : ' <span class="badge badge--warn">New</span>') + '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
        '<p>You played on it, so ' + Math.round(Game.balance.sessionWork.streamingShare * 100) +
          '% of its streaming money is yours, paid every Sunday as "Session credits".</p></div>';
    }
    if (m.kind === 'event') {
      // A record of a morning event and how you answered it.
      return '<div class="message">' +
        '<div class="message__head"><strong>⚡ ' + h.escape(d.title) + '</strong>' +
          '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
        '<p>' + h.escape(d.text) + '</p>' +
        '<div class="message__foot"><span class="badge">' + h.escape(d.answer ? 'You chose: ' + d.answer : 'Waiting on Today') + '</span></div>' +
        '</div>';
    }
    var venue = Game.content.venues[d.venueId];
    var away = venue.cityId !== 'hometown';
    var place = h.escape(venue.name) + (away ? ' (' + h.escape(Game.content.cities[venue.cityId].name) + ')' : '');
    var when = h.dateLabel(d.gigDay) + ' (' + Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + ')';
    var head = d.yes
      ? '<strong class="pos">✓ ' + place + ' said yes!</strong>'
      : '<strong class="neg">✗ ' + place + ' said no.</strong>';
    var body = d.yes
      ? 'Show on ' + when + '. Deal: ' + h.escape(Game.rules.booking.dealLabel(venue, d.deal)) + '.'
      : 'They passed on ' + when + ' (you had a ' + Math.round(d.chance * 100) + '% chance). Try another venue, or ask again with more reputation.';

    var buttons = '';
    var status = '';
    if (m.resolved) {
      status = '<span class="badge">' + { accepted: 'Accepted', declined: 'Declined', expired: 'Expired' }[m.resolved] + '</span>';
    } else if (d.yes) {
      var jobDays = Game.rules.booking.offerJobDays(state, m.id);
      var many = jobDays.length > 1;
      if (away) buttons = Game.ui.booking.tripHtml(Game.rules.travel.preview(Game.rules.booking.withoutMessage(state, m.id), venue.id, d.gigDay, d.deal));
      if (jobDays.length) {
        var choices = [['vacation', 'Accept, use ' + (many ? jobDays.length + ' vacation days' : 'a vacation day')],
          ['sick', 'Accept, call in sick (' + Game.balance.job.sickDayPenalty + ' standing' + (many ? ' each' : '') + ')'],
          ['skip', 'Accept, skip work (' + Game.balance.job.skipPenalty + ' standing' + (many ? ' each' : '') + ')']];
        buttons += '<p class="hint">' + (away ? 'The trip keeps you away from your day job on ' : 'This show is during your day job (') +
          jobDays.map(function (x) { return h.dateLabel(x); }).join(', ') + (away ? '' : ')') + '. How will you take ' + (many ? 'those days' : 'the day') + ' off?</p>' +
          choices.map(function (c) {
            var problem = Game.rules.booking.acceptProblem(state, m.id, c[0]);
            return '<button class="btn btn--small' + (problem ? '' : ' btn--primary') + '" data-action="accept" data-id="' + m.id + '" data-job="' + c[0] + '"' +
              (problem ? ' disabled title="' + h.escape(problem) + '"' : '') + '>' + c[1] + '</button>';
          }).join(' ');
      } else {
        var problem = Game.rules.booking.acceptProblem(state, m.id, null);
        buttons += '<button class="btn btn--small btn--primary" data-action="accept" data-id="' + m.id + '"' + (problem ? ' disabled' : '') + '>Accept</button>' +
          (problem ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '');
      }
      buttons += ' <button class="btn btn--small" data-action="decline" data-id="' + m.id + '">Decline</button>';
      status = '<span class="muted">Answer by ' + h.dateLabel(m.expiresDay) + '</span>';
    }

    return '<div class="message' + (m.read ? '' : ' message--new') + '">' +
      '<div class="message__head">' + head + (m.read ? '' : ' <span class="badge badge--warn">New</span>') +
        '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
      '<p>' + body + '</p>' +
      (buttons || status ? '<div class="message__foot">' + buttons + ' ' + status + '</div>' : '') +
      '</div>';
  }
};
