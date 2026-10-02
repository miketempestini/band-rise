// today.js
// The Today screen (main hub): top bar, the three blocks of the day, End Day,
// and side panels with this week's money, debt, and what happened last night.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.today = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var dow = Game.rules.day.dayOfWeek(state.day);

    root.innerHTML =
      Game.ui.topbar.html(state) +
      '<div class="dashboard">' +
        '<section class="dashboard__main">' +
          '<h2 class="section-title">' + Game.content.calendar.dayNames[dow] + '\'s plan</h2>' +
          '<div class="blocks">' + Game.ui.today.blocksHtml(state) + '</div>' +
          '<div class="end-day">' +
            '<button class="btn btn--primary btn--big" data-action="endDay">End Day</button>' +
            '<span class="hint">' + Game.ui.today.tonightHint(state) + '</span>' +
          '</div>' +
        '</section>' +
        '<aside class="dashboard__side">' +
          Game.ui.today.weekPanelHtml(state) +
          Game.ui.today.debtPanelHtml(state, app) +
          Game.ui.today.lastNightHtml(state) +
        '</aside>' +
      '</div>';

    h.bind(root, {
      endDay: function () { app.endDay(); },
      settings: function () { app.show('settings'); },
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
  },

  // The three block cards: locked day job, or free time.
  blocksHtml: function (state) {
    var b = Game.balance;
    return b.time.blocks.map(function (block) {
      var name = Game.content.calendar.blockNames[block];
      if (Game.rules.day.isJobBlock(state, block)) {
        return '<div class="block block--locked">' +
          '<span class="block__time">' + name + '</span>' +
          '<span class="block__title">Day job</span>' +
          '<span class="block__detail">Locked · -' + b.energy.cost.dayJob + ' energy</span>' +
          '</div>';
      }
      return '<div class="block block--free">' +
        '<span class="block__time">' + name + '</span>' +
        '<span class="block__title">Free time</span>' +
        '<span class="block__detail">+' + b.time.emptyBlockEnergy + ' energy</span>' +
        '</div>';
    }).join('');
  },

  // A short note next to End Day about what happens tonight.
  tonightHint: function (state) {
    var b = Game.balance;
    var dow = Game.rules.day.dayOfWeek(state.day);
    if (dow === b.time.billsDayOfWeek) {
      return 'Tonight: rent and living costs of ' + Game.ui.helpers.money(b.housing[state.player.housing].weeklyCost) + ' are due, then your weekly summary.';
    }
    if (dow === b.time.paydayDayOfWeek) return 'Tonight: payday.';
    return 'Energy recovers overnight (+' + b.energy.overnight + ').';
  },

  // "This week" panel: money so far and what's coming.
  weekPanelHtml: function (state) {
    var h = Game.ui.helpers;
    var f = Game.rules.day.weekForecast(state);
    var rows = [
      ['Earned this week', h.money(f.earnedSoFar)],
      ['Pay still coming Friday', h.money(f.upcomingPay)],
      ['Bills due Sunday', '-' + h.money(f.bills)],
      ['Cash after Sunday (about)', h.money(f.projectedCash)]
    ];
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
  },

  // "Last night" panel: the log from the last End Day.
  lastNightHtml: function (state) {
    var h = Game.ui.helpers;
    var lines = state.lastDayLog.length
      ? state.lastDayLog.map(function (line) { return '<li>' + h.escape(line) + '</li>'; }).join('')
      : '<li>Your first day. The job fills your morning and afternoon. Evenings are yours.</li>';
    return '<div class="panel">' +
      '<h3 class="panel__title">' + (state.lastDayLog.length ? 'Last night' : 'Welcome') + '</h3>' +
      '<ul class="log">' + lines + '</ul>' +
      '</div>';
  }
};
