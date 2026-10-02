// dayResults.js
// The Day results screen, shown after every End Day:
// one line per block, then the overnight changes.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.dayResults = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var report = state.lastDayReport;

    var blockRows = report.blocks.map(function (row) {
      return '<div class="result-row">' +
        '<span class="result-row__time">' + Game.content.calendar.blockNames[row.block] + '</span>' +
        '<span class="result-row__title">' + h.escape(row.title) + '</span>' +
        '<span class="result-row__lines">' + row.lines.map(function (line) {
          return '<span>' + h.escape(line) + '</span>';
        }).join('') + '</span>' +
        '</div>';
    }).join('');

    var overnight = report.overnight.map(function (line) {
      return '<li>' + h.escape(line) + '</li>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(state) +
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">' + h.dateLabel(report.day) + '</h1>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Your day</h3>' +
          blockRows +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Tonight</h3>' +
          '<ul class="log">' + overnight + '</ul>' +
        '</div>' +
        '<div class="actions">' +
          '<button class="btn btn--primary btn--big" data-action="continue">' +
            (app.pendingWeekSummary ? 'See the week' : 'Continue to ' + Game.content.calendar.dayNames[Game.rules.day.dayOfWeek(state.day)]) +
          '</button>' +
        '</div>' +
      '</section>';

    root.querySelector('[data-action="continue"]').focus();

    h.bind(root, {
      continue: function () { app.leaveDayResults(); },
      settings: function () { app.show('settings'); },
      focusPayBack: function () { app.leaveDayResults(); }
    });
  }
};
