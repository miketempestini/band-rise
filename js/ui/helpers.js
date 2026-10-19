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

  // Shows a day like "Saturday, March 14".
  dateLabel: function (day) {
    return Game.rules.day.dateLabel(day);
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

  // A labeled LED meter, like the energy and morale meters in the top bar: a row of little lights, as on a
  // mixing desk, with as many lit as the value fills (balance.ui.ledSegments lights in all).
  // mood: '' normally, 'warn' (amber lights) or 'bad' (red lights) when the value is in trouble.
  ledMeter: function (label, value, max, mood) {
    var count = Game.balance.ui.ledSegments;
    var lit = Math.round((value / max) * count);
    var lights = '';
    for (var i = 0; i < count; i++) lights += '<i class="led__light' + (i < lit ? ' led__light--on' : '') + '"></i>';
    return '<div class="stat stat--led">' +
      '<span class="stat__label">' + label + '</span>' +
      '<span class="stat__value">' + Math.round(value) + '</span>' +
      '<span class="led' + (mood ? ' led--' + mood : '') + '" role="meter" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="' + max +
        '" aria-valuenow="' + Math.round(value) + '">' + lights + '</span>' +
      '</div>';
  },

  // A wide painted banner (like a venue's picture) with a title and a line under it, for the top of a panel.
  // src: the picture (from Game.content.art). sub: optional small print under the title.
  artBanner: function (src, title, sub) {
    return '<div class="art-banner" style="background-image: url(\'' + src + '\')">' +
      '<h3 class="art-banner__title">' + title + '</h3>' +
      (sub ? '<span class="art-banner__sub">' + sub + '</span>' : '') +
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
