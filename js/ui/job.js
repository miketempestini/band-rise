// job.js (screen)
// The Job screen: your day job at a glance (schedule, standing, vacation days), and the big decisions:
// go part-time, or quit (which opens the quit confirm screen). A change starts next Monday, and until
// then there's a "Never mind" button. Opened from the Job row in the Stats panel or the Calendar.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.job = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var b = Game.balance.job;
    var rules = Game.rules.job;
    var job = state.player.job;
    var names = { full: 'Full-time', part: 'Part-time', none: 'No day job' };

    var summary;
    if (job.status === 'none') {
      summary = '<p>' + (job.quitDay !== null ? 'You quit your day job on ' + h.dateLabel(job.quitDay) + '. ' : '') +
        'No shifts, no boss. Every block is yours.</p>' +
        '<p class="hint">Need money again? Plan "Look for work" in a free block: a ' + Math.round(b.lookForWorkChance * 100) +
        '% chance each try to land a part-time job (' + rules.workdayNames('part') + ').</p>';
    } else {
      var shifts = job.status === 'part' ? b.partTimeDays.length : b.fullTimeDays.length;
      summary = '<dl class="rows rows--big">' +
        '<dt>Job</dt><dd>' + names[job.status] + '</dd>' +
        '<dt>Workdays</dt><dd>' + rules.workdayNames(job.status) + '</dd>' +
        '<dt>Pay</dt><dd>' + h.money(shifts * b.payPerShift) + ' a week (' + h.money(b.payPerShift) + ' a shift, paid Friday)</dd>' +
        '<dt>Job standing</dt><dd>' + Math.round(job.standing) + ' / ' + b.maxStanding + '</dd>' +
        '<dt>Vacation days</dt><dd>' + job.vacationDaysLeft + ' left this year</dd>' +
        '</dl>';
    }

    var pending = '';
    if (job.pending) {
      var cancelProblem = rules.cancelPendingProblem(state);
      pending = '<div class="notice notice--info">' +
        (job.pending.status === 'none'
          ? 'You quit. Your last day of work is this week; from ' + h.dateLabel(job.pending.day) + ' you\'re free.'
          : 'You\'re going part-time from ' + h.dateLabel(job.pending.day) + ' (' + rules.workdayNames('part') + ').') +
        '</div>' +
        '<div class="actions actions--left"><button class="btn" data-action="cancelPending"' +
          (cancelProblem ? ' disabled title="' + h.escape(cancelProblem) + '"' : '') + '>Never mind, keep my job as it is</button>' +
          (cancelProblem ? ' <span class="pick__reason">' + h.escape(cancelProblem) + '</span>' : '') + '</div>';
    }

    var choices = '';
    if (job.status !== 'none' && !(job.pending && job.pending.status === 'none')) {
      var partProblem = rules.partTimeProblem(state);
      var partCard = job.status === 'full' && !job.pending
        ? '<div class="shop-item">' +
            '<div class="shop-item__name">Go part-time</div>' +
            '<p class="hint">Work ' + rules.workdayNames('part') + ' only (' + h.money(b.partTimeDays.length * b.payPerShift) +
              ' a week instead of ' + h.money(b.fullTimeDays.length * b.payPerShift) + '), starting next Monday. ' +
              'Needs reputation ' + b.partTimeMinReputation + ' and job standing ' + b.partTimeMinStanding + '.</p>' +
            '<div class="shop-item__buy">' + (partProblem
              ? '<span class="pick__reason">🔒 ' + h.escape(partProblem) + '</span>'
              : '<button class="btn btn--primary" data-action="partTime">Go part-time</button>') + '</div>' +
          '</div>'
        : '';
      var quitCard = '<div class="shop-item">' +
          '<div class="shop-item__name">Quit the day job</div>' +
          '<p class="hint">Every weekday block becomes yours, from next Monday. See your music income next to your bills before you decide.</p>' +
          '<div class="shop-item__buy"><button class="btn" data-action="quitScreen">Quit the day job…</button></div>' +
        '</div>';
      choices = '<div class="shop-grid">' + partCard + quitCard + '</div>';
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Day job</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="panel"><h3 class="panel__title">' + (job.status === 'none' ? 'No day job' : 'Your job') + '</h3>' + summary + pending + '</div>' +
        choices +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('job'); },
      focusPayBack: function () { app.goBack('job'); },
      partTime: function () { app.goPartTime(); },
      quitScreen: function () { app.show('quitJob'); },
      cancelPending: function () { app.cancelJobChange(); }
    });
  }
};
