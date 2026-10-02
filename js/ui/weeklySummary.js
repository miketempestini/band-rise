// weeklySummary.js
// The Sunday night wrap-up: money in, money out, ending cash, and debt.
// It shows the most recent week in the ledger.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.weeklySummary = {

  // Plain names for each money category.
  incomeLabels: { dayJob: 'Day job', tips: 'Open mic tips', gigPay: 'Gig pay (your share)', sessionRefund: 'Session players refunded', debug: 'Debug cash' },
  costLabels: { bills: 'Rent and living costs', networking: 'Going out to network', promotion: 'Promotion', rehearsal: 'Rehearsal room', hangOut: 'Hanging out', sessionPlayers: 'Session players', debug: 'Debug' },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var d = Game.balance.debt;
    var state = app.state;
    var week = state.ledger[state.ledger.length - 1];
    var self = Game.ui.weeklySummary;

    // Build the "Money in" and "Money out" lists, adding up totals as we go.
    var totalIn = 0;
    var inRows = Object.keys(week.income).map(function (key) {
      totalIn += week.income[key];
      return [self.incomeLabels[key] || key, h.money(week.income[key])];
    });
    if (week.loans > 0) {
      totalIn += week.loans;
      inRows.push(['Loans from Mom and Dad', h.money(week.loans)]);
    }

    var totalOut = 0;
    var outRows = Object.keys(week.costs).map(function (key) {
      totalOut += week.costs[key];
      return [self.costLabels[key] || key, h.money(week.costs[key])];
    });
    if (week.paidBack > 0) {
      totalOut += week.paidBack;
      outRows.push(['Paid back to Mom and Dad', h.money(week.paidBack)]);
    }

    var debtWarning = '';
    if (week.endDebt > d.gameOverDebt) {
      var sundaysLeft = d.gameOverWeeks + 1 - state.player.debtWeeksOverLimit;
      debtWarning = '<p class="panel__warn">Your debt has been over ' + h.money(d.gameOverDebt) + ' for ' +
        state.player.debtWeeksOverLimit + ' Sunday' + (state.player.debtWeeksOverLimit === 1 ? '' : 's') +
        ' in a row. ' + sundaysLeft + ' more and it\'s game over.</p>';
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">Week ' + week.week + ' wrap-up</h1>' +
        '<div class="summary-grid">' +
          self.listPanel('Money in', inRows, h.money(totalIn), 'Nothing came in this week.') +
          self.listPanel('Money out', outRows, h.money(totalOut), 'Nothing went out this week.') +
        '</div>' +
        self.skillsPanel(week) +
        (week.bandNotes && week.bandNotes.length
          ? '<div class="panel"><h3 class="panel__title">Band this week</h3><ul class="log">' +
              week.bandNotes.map(function (line) { return '<li>' + h.escape(line) + '</li>'; }).join('') + '</ul></div>'
          : '') +
        '<div class="panel">' +
          '<dl class="rows rows--big">' +
            '<dt>Starting cash</dt><dd>' + h.money(week.startCash) + '</dd>' +
            '<dt>Ending cash</dt><dd class="highlight">' + h.money(week.endCash) + '</dd>' +
            (week.startDebt > 0 || week.endDebt > 0
              ? '<dt>Debt</dt><dd>' + h.money(week.startDebt) + ' → ' + h.money(week.endDebt) + '</dd>'
              : '') +
            '<dt>Day job shifts worked</dt><dd>' + week.shiftsWorked + '</dd>' +
          '</dl>' +
          debtWarning +
        '</div>' +
        '<div class="actions">' +
          '<button class="btn btn--primary btn--big" data-action="continue">Start week ' + (week.week + 1) + '</button>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      continue: function () { app.show('today'); },
      focusPayBack: function () { app.show('today'); }
    });
  },

  // "Skills this week": each skill's value now, and how much it went up or down this week.
  skillsPanel: function (week) {
    if (!week.startSkills || !week.endSkills) return ''; // weeks saved before this was added
    var rows = Object.keys(Game.content.skills).map(function (skill) {
      var change = Game.util.round1(week.endSkills[skill] - week.startSkills[skill]);
      var kind = change > 0 ? 'up' : (change < 0 ? 'down' : 'same');
      return '<div class="skill-change">' +
        '<span class="skill-change__name">' + Game.content.skills[skill] + '</span>' +
        '<span class="skill-change__value">' + Math.floor(week.endSkills[skill]) + '</span>' +
        '<span class="skill-change__delta skill-change__delta--' + kind + '">' +
          (change === 0 ? '±0' : Game.util.signed(change)) + '</span>' +
        '</div>';
    }).join('');
    return '<div class="panel">' +
      '<h3 class="panel__title">Skills this week</h3>' +
      '<div class="skill-changes">' + rows + '</div>' +
      '</div>';
  },

  // A panel with a list of label/amount rows and a total.
  listPanel: function (title, rows, total, emptyText) {
    var body = rows.length
      ? rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('')
      : '<dt class="muted">' + emptyText + '</dt><dd></dd>';
    return '<div class="panel">' +
      '<h3 class="panel__title">' + title + '</h3>' +
      '<dl class="rows">' + body + '<dt class="rows__total">Total</dt><dd class="rows__total">' + total + '</dd></dl>' +
      '</div>';
  }
};
