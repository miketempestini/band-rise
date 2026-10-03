// skipSummary.js
// After "Skip to next commitment": the days that went by (the notable lines from each) and why it stopped.
// Continue goes on to the last day's usual screens (gig result, reveals, Day results, weekly summary).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.skipSummary = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var r = app.skipResult;
    var days = r.days.map(function (d) {
      var lines = d.lines.length ? d.lines : ['A quiet day.'];
      return '<div class="result-row">' +
        '<span class="result-row__time">' + h.escape(h.dateLabel(d.day)) + '</span>' +
        '<span class="result-row__lines">' + lines.map(function (l) { return '<span>' + h.escape(l) + '</span>'; }).join('') + '</span>' +
        '</div>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(app.state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">⏩ Skipped ' + r.days.length + ' day' + (r.days.length === 1 ? '' : 's') + '</h1>' +
        '<p class="notice notice--info">' + h.escape(r.stopReason) + '</p>' +
        '<div class="panel skip-days">' + days + '</div>' +
        '<div class="actions"><button class="btn btn--primary btn--big" data-action="continue">Continue</button></div>' +
      '</section>';

    root.querySelector('[data-action="continue"]').focus({ preventScroll: true });
    h.bind(root, {
      continue: function () { app.leaveSkipSummary(); },
      focusPayBack: function () { app.leaveSkipSummary(); }
    });
  }
};
