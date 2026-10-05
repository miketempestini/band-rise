// quitJob.js
// The quit confirm screen: your last 4 weeks of music income next to each week's bills, the average,
// and the job pay you'd be giving up. Confirming quits; the job ends next Monday.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.quitJob = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var sum = Game.rules.job.quitSummary(state);
    var problem = Game.rules.job.quitProblem(state);
    var weeksWanted = Game.balance.job.quitScreenIncomeWeeks;

    var rows = sum.weeks.length
      ? sum.weeks.map(function (w) {
          return '<tr><td>Week of ' + Game.rules.day.weekLabel(Game.rules.day.firstDayOfWeek(w.week)) + '</td><td>' + h.money(w.music) + '</td><td>' + h.money(w.bills) + '</td>' +
            '<td class="' + (w.music >= w.bills ? 'pos' : 'neg') + '">' + h.money(w.music - w.bills) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="4" class="muted">No finished weeks yet.</td></tr>';

    var share = Math.round(sum.coversShare * 100);
    var verdict = sum.weeks.length
      ? (share >= 100
          ? 'Music covered your bills on average (' + share + '%). You can live on it.'
          : 'Music covers about ' + share + '% of your weekly bills. Without the job you\'d be about ' +
            h.money(sum.weeklyBills - sum.averageMusic) + ' short each week.')
      : 'You haven\'t finished a week yet, so there\'s no music income to compare.';

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Quit the day job?</h1>' +
          '<button class="btn" data-action="back">← Day job</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="panel">' +
          '<h3 class="panel__title">Your last ' + (sum.weeks.length < weeksWanted && sum.weeks.length ? sum.weeks.length + ' of ' : '') +
            weeksWanted + ' weeks</h3>' +
          '<table class="quit-table"><thead><tr><th></th><th>Music income</th><th>Bills</th><th>Left over</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
          '<p class="hint">Music income: gig pay, tips, merch, streaming, and session work (not the day job, overtime, loans, or lucky breaks).</p>' +
          '<dl class="rows rows--big">' +
            '<dt>Average music income</dt><dd>' + h.money(sum.averageMusic) + ' a week</dd>' +
            '<dt>Bills now</dt><dd>' + h.money(sum.weeklyBills) + ' a week</dd>' +
            '<dt>Day job pay you\'d give up</dt><dd>' + h.money(sum.jobPayPerWeek) + ' a week</dd>' +
          '</dl>' +
          '<p><strong>' + h.escape(verdict) + '</strong></p>' +
          '<p class="hint">The job ends next Monday (this week\'s shifts still count and get paid). Quitting is a milestone: +' +
            Game.balance.job.quitMoraleBonus + ' morale. You can always plan "Look for work" later.</p>' +
          '<div class="actions actions--left">' +
            '<button class="btn btn--primary" data-action="quit"' + (problem ? ' disabled' : '') + '>Yes, quit the day job</button>' +
            '<button class="btn btn--ghost" data-action="back">Keep my job</button>' +
            (problem ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      back: function () { app.show('job'); },
      focusPayBack: function () { app.show('job'); },
      quit: function () { app.quitJob(); }
    });
  }
};
