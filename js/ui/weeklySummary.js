// weeklySummary.js
// The Sunday night wrap-up: money in, money out, ending cash, and debt.
// It shows the most recent week in the ledger.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.weeklySummary = {

  // Plain names for each money category.
  incomeLabels: { loans: 'Loans from Mom and Dad', dayJob: 'Day job', tips: 'Open mic tips', gigPay: 'Gig pay (your share)', streaming: 'Streaming', label: 'Label advance', merch: 'Merch sales', sessionWork: 'Session work', sessionCredits: 'Session credits', overtime: 'Overtime', events: 'Odd jobs and luck', sessionRefund: 'Session players refunded', debug: 'Debug cash' },
  costLabels: { paidBack: 'Paid back to Mom and Dad', bills: 'Rent and living costs', networking: 'Going out to network', promotion: 'Promotion', rehearsal: 'Rehearsal room', hangOut: 'Hanging out', sessionPlayers: 'Session players', travel: 'Travel and hotels', production: 'Production', studio: 'Studio time', merchStock: 'Merch stock', gear: 'Gear', events: 'Surprise costs', debug: 'Debug' },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var d = Game.balance.debt;
    var state = app.state;
    var week = state.ledger[state.ledger.length - 1];
    var self = Game.ui.weeklySummary;

    // The "Money in" and "Money out" lists (the rules add them up).
    var totals = Game.rules.money.weekTotals(week);
    var inRows = totals.income.map(function (r) { return [self.incomeLabels[r.key] || r.key, h.money(r.amount)]; });
    var outRows = totals.costs.map(function (r) { return [self.costLabels[r.key] || r.key, h.money(r.amount)]; });

    var debtWarning = '';
    if (week.endDebt > d.gameOverDebt) {
      var sundaysLeft = Game.rules.money.sundaysUntilGameOver(state);
      debtWarning = '<p class="panel__warn">Your debt has been over ' + h.money(d.gameOverDebt) + ' for ' +
        state.player.debtWeeksOverLimit + ' Sunday' + (state.player.debtWeeksOverLimit === 1 ? '' : 's') +
        ' in a row. ' + sundaysLeft + ' more and it\'s game over.</p>';
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">Week of ' + Game.rules.day.weekLabel(Game.rules.day.firstDayOfWeek(week.week)) + ': wrap-up</h1>' +
        '<div class="summary-grid">' +
          self.listPanel('Money in', inRows, h.money(totals.totalIn), 'Nothing came in this week.') +
          self.listPanel('Money out', outRows, h.money(totals.totalOut), 'Nothing went out this week.') +
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
          '<button class="btn btn--primary btn--big" data-action="continue">Start the week of ' + Game.rules.day.weekLabel(Game.rules.day.firstDayOfWeek(week.week + 1)) + '</button>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      continue: function () { app.leaveWeeklySummary(); },
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
