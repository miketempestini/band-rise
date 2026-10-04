// today.js
// The Today screen (main hub): top bar, the three blocks of the day, End Day,
// and side panels with this week's money, debt, and the player's stats.
// Clicking a free block opens the action picker on top of this screen.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.today = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var dow = Game.rules.day.dayOfWeek(state.day);

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<div class="dashboard">' +
        '<section class="dashboard__main">' +
          h.notice(app.notice) +
          Game.ui.today.tipHtml(state) +
          Game.ui.today.toastsHtml(state) +
          Game.ui.today.eventHtml(state) +
          '<h2 class="section-title">' + Game.content.calendar.dayNames[dow] + '\'s plan</h2>' +
          '<div class="blocks" data-tour="blocks">' + Game.ui.today.blocksHtml(state) + '</div>' +
          '<div class="end-day" data-tour="endDay">' +
            '<button class="btn btn--primary btn--big" data-action="endDay">End Day</button>' +
            Game.ui.today.timeSaversHtml(state) +
          '</div>' +
          '<p class="hint">' + Game.ui.today.tonightHint(state) + '</p>' +
        '</section>' +
        '<aside class="dashboard__side">' +
          Game.ui.today.bandAlertHtml(state) +
          Game.ui.today.jobAlertHtml(state) +
          Game.ui.today.upcomingHtml(state) +
          Game.ui.statsPanel.html(state) +
          Game.ui.today.weekPanelHtml(state) +
          Game.ui.today.debtPanelHtml(state, app) +
        '</aside>' +
      '</div>' +
      (app.pickerBlock ? Game.ui.actionPicker.html(state, app.pickerBlock, app.pickerSongStep, app.pickerSet, app.practiceSort, app.practiceFilter) : '');

    h.bind(root, {
      endDay: function () { app.endDay(); },
      openPicker: function (event, el) { app.openPicker(el.getAttribute('data-block')); },
      openCalendar: function () { app.navigate('calendar'); },
      dismissToast: function (event, el) { app.dismissToast(el.getAttribute('data-toast')); },
      openInbox: function () { app.navigate('inbox'); },
      skipAhead: function () { app.skipAhead(); },
      repeatEvening: function () { app.repeatEvening(); },
      answerEvent: function (event, el) { app.answerEvent(el.getAttribute('data-choice')); },
      dismissTip: function (event, el) { app.dismissTip(el.getAttribute('data-tip')); },
      tipsOff: function () { app.setTutorial(false); },
      focusPayBack: function () {
        var input = root.querySelector('#payback-amount');
        if (input) { input.focus(); input.select(); }
      },
      payBackMax: function () {
        root.querySelector('#payback-amount').value = Math.min(state.player.cash, state.player.loanOwed);
      },
      payBack: function () {
        app.payBack(Number(root.querySelector('#payback-amount').value));
      }
    });

    if (app.pickerBlock) Game.ui.actionPicker.bind(root, app);

    // Highlight whatever the current tip card is talking about.
    var tip = Game.rules.progress.tutorialCard(state);
    var target = tip && document.querySelector('[data-tour="' + tip.target + '"]');
    if (target) target.classList.add('tour-highlight');
  },

  // Today's event: what happened and the choices, each with its effects spelled out.
  eventHtml: function (state) {
    var h = Game.ui.helpers;
    var pending = state.pendingEvent;
    if (!pending) return '';
    var event = Game.content.events[pending.eventId];
    var buttons = Game.rules.events.choices(state).map(function (c) {
      return '<button class="choice-btn' + (c.safe ? ' choice-btn--safe' : '') + '" data-action="answerEvent" data-choice="' + c.id + '"' +
        (c.problem ? ' disabled title="' + h.escape(c.problem) + '"' : '') + '>' +
        '<strong>' + h.escape(c.label) + '</strong><span>' + h.escape(c.description) + '</span>' +
        (c.safe ? '<em>Happens if you don\'t answer</em>' : '') + '</button>';
    }).join('');
    return '<div class="event-card"><div class="event-card__title">⚡ ' + h.escape(event.title) + '</div>' +
      '<p>' + h.escape(event.text(state, pending.data)) + '</p>' +
      '<div class="event-card__choices">' + buttons + '</div></div>';
  },

  // A tutorial tip card (first few days only), with "Got it" and "Turn off tips".
  tipHtml: function (state) {
    var h = Game.ui.helpers;
    var tip = Game.rules.progress.tutorialCard(state);
    if (!tip) return '';
    return '<div class="tip-card"><div class="tip-card__title">💡 ' + h.escape(tip.title) + '</div>' +
      '<p>' + h.escape(tip.text) + '</p>' +
      '<div class="tip-card__actions"><button class="btn btn--small btn--primary" data-action="dismissTip" data-tip="' + tip.id + '">Got it</button>' +
      '<button class="btn btn--small btn--ghost" data-action="tipsOff">Turn off tips</button></div></div>';
  },

  // "Skip to next commitment" and "Repeat yesterday's evening".
  timeSaversHtml: function (state) {
    var h = Game.ui.helpers;
    var skipProblem = Game.rules.day.skipProblem(state);
    var repeatProblem = Game.rules.actions.repeatProblem(state);
    var last = state.lastEvening;
    return '<button class="btn" data-action="skipAhead"' + (skipProblem ? ' disabled title="' + h.escape(skipProblem) + '"' : '') +
        ' title="Ends quiet days until a show, a planned task, an event, a message, or the weekly summary">⏩ Skip to next commitment</button>' +
      (last ? '<button class="btn" data-action="repeatEvening"' + (repeatProblem ? ' disabled title="' + h.escape(repeatProblem) + '"' : '') + '>' +
        '🔁 Repeat yesterday\'s evening (' + h.escape(Game.content.actions[last.actionId].name) + ')</button>' : '');
  },

  // The three block cards: locked day job, a planned action, or free time.
  // Each card shows energy before and after the block.
  blocksHtml: function (state) {
    var h = Game.ui.helpers;
    var b = Game.balance;
    return Game.rules.actions.dayPlan(state).map(function (row) {
      var name = Game.content.calendar.blockNames[row.block];
      var energyLine = '<span class="block__energy">Energy ' + Math.round(row.energyBefore) + ' → ' + Math.round(row.energyAfter) +
        (Game.rules.energy.isTired(row.energyAfter) ? ' <span class="badge badge--warn">Tired</span>' : '') + '</span>';

      if (row.kind === 'gig') {
        var e = state.entries[row.entryId];
        var venue = Game.content.venues[row.venueId];
        return '<button class="block block--show" data-action="openCalendar">' +
          '<span class="block__time">' + name + '</span>' +
          '<span class="block__title">🎤 Show at ' + h.escape(venue.name) + '</span>' +
          '<span class="block__detail">' + (row.problem ? '<span class="block__problem">' + h.escape(row.problem) + '</span>' :
            h.escape(Game.rules.booking.dealLabel(venue, e.deal, e.fee)) + ' · ' + e.songIds.length + ' songs · -' + b.energy.cost.gig + ' energy') + '</span>' +
          energyLine +
          '</button>';
      }
      if (row.kind === 'studio') {
        var se = state.entries[row.entryId];
        return '<button class="block block--show" data-action="openCalendar">' +
          '<span class="block__time">' + name + '</span>' +
          '<span class="block__title">🎙️ ' + h.escape(Game.content.studios[se.studio].name) + '</span>' +
          '<span class="block__detail">Recording "' + h.escape(state.songs[se.songId].title) + '" · ' +
            h.money(b.recording.studios[se.studio].cost) + ' · -' + b.energy.cost.studio + ' energy</span>' +
          energyLine +
          '</button>';
      }
      if (row.kind === 'job') {
        return '<div class="block block--locked">' +
          '<span class="block__time">' + name + '</span>' +
          '<span class="block__title">Day job</span>' +
          '<span class="block__detail">Locked · -' + b.energy.cost.dayJob + ' energy</span>' +
          energyLine +
          '</div>';
      }

      var title, detail;
      if (row.kind === 'action') {
        var action = Game.content.actions[row.actionId];
        title = action.name;
        var about = '';
        var mine = Game.rules.actions.plannedEntry(state, row.block);
        if (mine && mine.plannedAhead) title += ' <span class="badge">Planned ahead</span>';
        var planned = Game.rules.actions.plannedEntry(state, row.block);
        if (planned && planned.request && planned.request.venueId) {
          about = '<span class="block__song">to ' + h.escape(Game.content.venues[planned.request.venueId].name) +
            ' (' + h.escape(h.dateLabel(planned.request.gigDay)) + ')</span>';
        } else if (planned && planned.request && planned.request.studio) {
          about = '<span class="block__song">' + h.escape(Game.content.studios[planned.request.studio].name) + ', ' +
            planned.request.sessions.length + ' song' + (planned.request.sessions.length === 1 ? '' : 's') +
            ' (' + h.escape(h.dateLabel(planned.request.day)) + ')</span>';
        } else if (row.personId && state.people[row.personId]) {
          about = '<span class="block__song">with ' + h.escape(state.people[row.personId].name) + '</span>';
        } else if (row.songIds && action.songsMax) {
          about = '<span class="block__song">' + row.songIds.length + ' song' + (row.songIds.length === 1 ? '' : 's') + '</span>';
        } else if (row.songIds) {
          var venue = Game.rules.gigs.openMicTonight(state);
          about = '<span class="block__song">' + (venue ? h.escape(venue.name) + ': ' : '') +
            row.songIds.map(function (id) { return state.songs[id] ? '"' + h.escape(state.songs[id].title) + '"' : ''; }).join(', ') + '</span>';
        } else if (row.songId === 'all') {
          about = '<span class="block__song">All songs</span>';
        } else if (row.songId && state.songs[row.songId]) {
          about = '<span class="block__song">"' + h.escape(state.songs[row.songId].title) + '"</span>';
        } else if (action.effects.songProgress) {
          var preview = Game.rules.actions.writePreview(state, row.block);
          about = '<span class="block__song">' + (preview.finishes ? 'Finishes the song!' :
            'Song ' + Math.round(preview.from) + ' → ' + Math.round(preview.to) + '/' + Game.balance.songs.progressToFinish) + '</span>';
        }
        detail = row.problem
          ? '<span class="block__problem">Won\'t happen: ' + h.escape(row.problem) + '</span>'
          : about + (action.moneyCost ? h.money(action.moneyCost) + ' · ' : '') + 'Click to change';
      } else {
        title = 'Free time';
        detail = '+' + b.time.emptyBlockEnergy + ' energy · Click to plan';
      }
      return '<button class="block block--' + row.kind + '" data-action="openPicker" data-block="' + row.block + '">' +
        '<span class="block__time">' + name + '</span>' +
        '<span class="block__title">' + title + '</span>' +
        '<span class="block__detail">' + detail + '</span>' +
        energyLine +
        '</button>';
    }).join('');
  },

  // Banners for things that just unlocked (like small rooms). Each has a "Got it" button.
  toastsHtml: function (state) {
    var h = Game.ui.helpers;
    var unread = Game.rules.booking.unreadCount(state);
    var inbox = unread
      ? '<div class="toast toast--inbox"><span>📬 You have ' + unread + ' new message' + (unread === 1 ? '' : 's') + '.</span>' +
        '<button class="btn btn--small btn--primary" data-action="openInbox">Open Inbox</button></div>'
      : '';
    return inbox + state.toasts.map(function (t) {
      return '<div class="toast' + (t.milestone ? ' toast--milestone' : '') + '"><span>' + (t.milestone ? '🏆 ' : '🎉 ') + h.escape(t.text) + '</span>' +
        '<button class="btn btn--small" data-action="dismissToast" data-toast="' + t.id + '">Got it</button></div>';
    }).join('');
  },

  // A red panel when job standing is low (below 25).
  jobAlertHtml: function (state) {
    var job = state.player.job;
    if (job.status === 'none' || job.standing >= Game.balance.job.warningStanding) return '';
    return '<div class="panel panel--debt"><h3 class="panel__title">Job trouble</h3>' +
      '<p class="panel__warn">Your boss warned you. Job standing ' + Math.round(job.standing) + ': at 0 you\'re fired. ' +
      'Each shift you work adds +' + Game.balance.job.standingPerShift + '.</p></div>';
  },

  // The next few booked shows.
  upcomingHtml: function (state) {
    var h = Game.ui.helpers;
    var shows = Game.rules.booking.upcomingShows(state).filter(function (e) { return e.day > state.day; }).slice(0, 3);
    if (!shows.length) return '';
    return '<div class="panel"><h3 class="panel__title">Coming up</h3><ul class="log">' + shows.map(function (e) {
      var days = e.day - state.day;
      return '<li>🎤 ' + h.escape(Game.content.venues[e.venueId].name) + ', ' + h.dateLabel(e.day) +
        ' <span class="muted">(in ' + days + ' day' + (days === 1 ? '' : 's') + ')</span></li>';
    }).join('') + '</ul></div>';
  },

  // A red panel when a bandmate wants to talk (satisfaction under 30).
  bandAlertHtml: function (state) {
    var h = Game.ui.helpers;
    var unhappy = Game.rules.people.needTalk(state);
    if (!unhappy.length) return '';
    return '<div class="panel panel--debt">' +
      '<h3 class="panel__title">Band trouble</h3>' +
      unhappy.map(function (m) {
        var quitting = m.satisfaction < Game.balance.satisfaction.quitThreshold;
        return '<p class="panel__warn">' + h.escape(m.name) + ': "We need to talk." (satisfaction ' + Math.round(m.satisfaction) + ')' +
          (quitting ? ' Will quit this Sunday!' : '') + '</p>';
      }).join('') +
      '<p class="hint">Plan a Talk (+' + Game.balance.satisfaction.talkGain + ' satisfaction) from a free block.</p>' +
      '</div>';
  },

  // A short note next to End Day about what happens tonight.
  tonightHint: function (state) {
    var b = Game.balance;
    var dow = Game.rules.day.dayOfWeek(state.day);
    if (dow === b.time.billsDayOfWeek) {
      return 'Tonight: rent and living costs of ' + Game.ui.helpers.money(b.housing[state.player.housing].weeklyCost) + ' are due, then your weekly summary.';
    }
    var openMic = Game.rules.gigs.openMicTonight(state);
    var mic = openMic ? 'Open mic tonight at ' + openMic.name + ' (plan it in the Evening). ' : '';
    if (dow === b.time.paydayDayOfWeek) return mic + 'Tonight: payday.';
    return mic + 'Energy recovers overnight (+' + b.energy.overnight + ').';
  },

  // "This week" panel: money so far and what's coming.
  weekPanelHtml: function (state) {
    var h = Game.ui.helpers;
    var f = Game.rules.day.weekForecast(state);
    var rows = [
      ['Earned this week', h.money(f.earnedSoFar)],
      ['Pay still coming Friday', h.money(f.upcomingPay)]
    ];
    if (f.plannedSpending > 0) rows.push(['Planned today', '-' + h.money(f.plannedSpending)]);
    rows.push(['Bills due Sunday', '-' + h.money(f.bills)]);
    rows.push(['Cash after Sunday (about)', h.money(f.projectedCash)]);

    var warning = f.projectedCash < 0
      ? '<p class="panel__warn">You\'re on track to run short. Mom and Dad will lend ' + h.money(Game.balance.debt.familyLoanAmount) + ' if you do.</p>'
      : '';
    return '<div class="panel">' +
      '<h3 class="panel__title">This week</h3>' +
      '<dl class="rows">' + rows.map(function (r) {
        return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>';
      }).join('') + '</dl>' +
      warning +
      '</div>';
  },

  // Debt panel: only shown when the player owes money. Includes the Pay back form.
  debtPanelHtml: function (state, app) {
    var h = Game.ui.helpers;
    var d = Game.balance.debt;
    var p = state.player;
    if (p.loanOwed <= 0) return '';

    var most = Math.min(p.cash, p.loanOwed);
    var status;
    if (p.loanOwed > d.gameOverDebt) {
      var sundaysLeft = d.gameOverWeeks + 1 - p.debtWeeksOverLimit;
      status = '<p class="panel__warn">Your debt is over ' + h.money(d.gameOverDebt) + '. ' +
        'If it\'s still over on ' + sundaysLeft + ' more Sunday' + (sundaysLeft === 1 ? '' : 's') +
        ', it\'s game over.</p>';
    } else {
      status = '<p class="hint">Keep it at ' + h.money(d.gameOverDebt) + ' or less. Too long above that ends your career.</p>';
    }

    return '<div class="panel panel--debt">' +
      '<h3 class="panel__title">Owed to Mom and Dad: ' + h.money(p.loanOwed) + '</h3>' +
      status +
      '<div class="payback">' +
        '<input type="number" id="payback-amount" class="input input--money" min="1" max="' + most + '" step="1" value="' + most + '"' + (most > 0 ? '' : ' disabled') + '>' +
        '<button class="btn btn--small" data-action="payBackMax"' + (most > 0 ? '' : ' disabled') + '>Max</button>' +
        '<button class="btn btn--small btn--primary" data-action="payBack"' + (most > 0 ? '' : ' disabled') + '>Pay back</button>' +
      '</div>' +
      (app.payBackMessage ? '<p class="hint">' + h.escape(app.payBackMessage) + '</p>' : '') +
      '</div>';
  }
};
