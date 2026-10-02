// helpers.js
// Small drawing helpers shared by every screen.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.helpers = {

  // Shows a dollar amount like "$1,250" or "-$40".
  money: function (amount) {
    var sign = amount < 0 ? '-' : '';
    return sign + '$' + Math.abs(Math.round(amount)).toLocaleString();
  },

  // Shows a day like "Week 1, Monday".
  dateLabel: function (day) {
    var dow = Game.rules.day.dayOfWeek(day);
    return 'Week ' + Game.rules.day.weekNumber(day) + ', ' + Game.content.calendar.dayNames[dow];
  },

  // Star rating like "★★★☆☆" for a song's quality.
  stars: function (quality) {
    var max = Game.balance.songs.maxStars;
    var n = Game.rules.songs.stars(quality);
    return '<span class="stars" title="Quality ' + Math.round(quality) + '">' +
      '★'.repeat(n) + '<span class="stars__empty">' + '★'.repeat(max - n) + '</span></span>';
  },

  // "Today", "Yesterday", or "5 days ago".
  daysAgo: function (days) {
    if (days <= 0) return 'Played today';
    if (days === 1) return 'Played yesterday';
    return 'Played ' + days + ' days ago';
  },

  // Makes text safe to put on the page (so a name like "<b>" shows as typed instead of as HTML).
  escape: function (text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // A small labeled bar, like the energy and morale meters in the top bar.
  meter: function (label, value, max) {
    var percent = Math.round((value / max) * 100);
    return '<div class="stat">' +
      '<span class="stat__label">' + label + '</span>' +
      '<span class="stat__value">' + Math.round(value) + '</span>' +
      '<span class="meter"><span class="meter__fill" style="width:' + percent + '%"></span></span>' +
      '</div>';
  },

  // Connects buttons to what they do. Any element with data-action="name" runs handlers[name] when clicked.
  bind: function (root, handlers) {
    root.querySelectorAll('[data-action]').forEach(function (el) {
      var handler = handlers[el.getAttribute('data-action')];
      if (handler) {
        el.addEventListener('click', function (event) { handler(event, el); });
      }
    });
  },

  // A friendly message box (used for errors and info), or nothing if there's no message.
  notice: function (notice) {
    if (!notice) return '';
    return '<div class="notice notice--' + notice.kind + '">' + Game.ui.helpers.escape(notice.text) + '</div>';
  }
};
