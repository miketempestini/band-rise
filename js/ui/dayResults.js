// dayResults.js
// The day's results: the "Previous day" box on Today (money, energy, morale, and the big moments), and the full
// readout (one line per block, then the overnight changes) that opens as a pop-up when you click the box.
// Draw only: the numbers come from state.lastDayReport (its summary is built by Game.rules.day.summary).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.dayResults = {

  // How many big moments the box lists before "+N more".
  boxHighlights: 5,

  // A change with its sign and color, like "+$110" in green or "-$400" in red.
  changeHtml: function (before, after, money) {
    var h = Game.ui.helpers;
    var diff = Math.round(after - before);
    var text = money ? (diff >= 0 ? '+' : '-') + h.money(Math.abs(diff)) : Game.util.signed(diff);
    return '<span class="' + (diff > 0 ? 'pos' : (diff < 0 ? 'neg' : 'muted')) + '">' + (diff === 0 ? '±0' : text) + '</span>';
  },

  // The "Previous day" box on Today. Clicking it opens the full readout.
  boxHtml: function (state) {
    var h = Game.ui.helpers;
    var self = Game.ui.dayResults;
    var report = state.lastDayReport;
    if (!report) {
      return '<div class="panel recap recap--empty"><h3 class="panel__title">Previous day</h3>' +
        '<p class="hint">End the day to see a summary here: money, energy, and anything big that happened.</p></div>';
    }
    var sum = report.summary;
    var numbers = sum
      ? '<dl class="rows recap__numbers">' +
          '<dt>Cash</dt><dd>' + self.changeHtml(sum.cash.before, sum.cash.after, true) + ' <span class="muted">(now ' + h.money(sum.cash.after) + ')</span></dd>' +
          '<dt>Energy</dt><dd>' + Math.round(sum.energy.before) + ' → <strong>' + Math.round(sum.energy.after) + '</strong></dd>' +
          '<dt>Morale</dt><dd>' + Math.round(sum.morale.before) + ' → <strong>' + Math.round(sum.morale.after) + '</strong> ' +
            self.changeHtml(sum.morale.before, sum.morale.after) + '</dd>' +
        '</dl>'
      : '';
    var highlights = sum ? sum.highlights : report.overnight.slice(0, self.boxHighlights).map(function (line) { return { icon: '•', text: line }; });
    var shown = highlights.slice(0, self.boxHighlights);
    var list = shown.length
      ? '<ul class="recap__list">' + shown.map(function (x) { return '<li><span class="recap__icon">' + x.icon + '</span>' + h.escape(x.text) + '</li>'; }).join('') +
        (highlights.length > shown.length ? '<li class="muted">+' + (highlights.length - shown.length) + ' more</li>' : '') + '</ul>'
      : '<p class="hint">A quiet day.</p>';
    return '<button class="panel recap" data-action="openDayReport" title="See the full day">' +
      '<h3 class="panel__title">Previous day · ' + h.escape(h.dateLabel(report.day)) + '</h3>' +
      numbers + list +
      '<span class="recap__more">See the full day ›</span>' +
      '</button>';
  },

  // The full readout: every block, then everything overnight. Shown in a pop-up over Today.
  bodyHtml: function (state) {
    var h = Game.ui.helpers;
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
    var overnight = report.overnight.map(function (line) { return '<li>' + h.escape(line) + '</li>'; }).join('');
    return '<h3 class="panel__title">Your day</h3>' + blockRows +
      '<h3 class="panel__title">Tonight</h3><ul class="log">' + overnight + '</ul>';
  },

  // The pop-up with the full readout.
  modalHtml: function (state) {
    var h = Game.ui.helpers;
    return '<div class="overlay" data-action="closeDayReport">' +
      '<div class="modal modal--wide" role="dialog" aria-label="The previous day">' +
        '<div class="modal__head"><h2 class="modal__title">' + h.escape(h.dateLabel(state.lastDayReport.day)) + '</h2>' +
          '<button class="btn btn--ghost btn--small" data-action="closeDayReport">Close</button></div>' +
        '<div class="modal__body">' + Game.ui.dayResults.boxNumbersOnly(state) + Game.ui.dayResults.bodyHtml(state) + '</div>' +
      '</div></div>';
  },

  // The summary numbers again at the top of the pop-up (if this day has them).
  boxNumbersOnly: function (state) {
    var h = Game.ui.helpers;
    var self = Game.ui.dayResults;
    var sum = state.lastDayReport.summary;
    if (!sum) return '';
    return '<p class="recap__strip">Cash ' + self.changeHtml(sum.cash.before, sum.cash.after, true) + ' (now ' + h.money(sum.cash.after) + ') · Energy ' +
      Math.round(sum.energy.before) + ' → ' + Math.round(sum.energy.after) + ' · Morale ' + Math.round(sum.morale.before) + ' → ' + Math.round(sum.morale.after) + '</p>';
  },

  // Connects the pop-up: Close, a click outside it, or Escape.
  bindModal: function (root, app) {
    var overlay = root.querySelector('.overlay[data-action="closeDayReport"]');
    if (!overlay) return;
    overlay.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (target && target.getAttribute('data-action') === 'closeDayReport' && (target !== overlay || event.target === overlay)) app.closeDayReport();
    });
    document.onkeydown = function (event) { if (event.key === 'Escape') app.closeDayReport(); };
  }
};
