// topbar.js
// The bar across the top of the game screens: cash, debt, energy, morale, reputation, date, rent,
// and below it a row of tabs to move between screens (Today, Calendar, Inbox, Book, Songs, People, Settings).
// Draw only: it reads the state and returns HTML. Tabs use data-nav and are connected by Game.app.render.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.topbar = {

  // screen: the screen showing now (its tab is highlighted).
  html: function (state, screen) {
    var h = Game.ui.helpers;
    var b = Game.balance;
    var p = state.player;
    var daysToRent = Game.rules.day.daysUntilBills(state);
    var rentText = daysToRent === 0 ? 'Due tonight' : 'In ' + daysToRent + (daysToRent === 1 ? ' day' : ' days');

    var debt = '';
    if (p.loanOwed > 0) {
      debt = '<div class="stat stat--debt">' +
        '<span class="stat__label">Debt</span>' +
        '<span class="stat__value">' + h.money(p.loanOwed) + '</span>' +
        '<button class="btn btn--small" data-action="focusPayBack">Pay back</button>' +
        '</div>';
    }

    return '<header class="topbar" data-tour="topbar">' +
      '<div class="topbar__who">' +
        '<span class="topbar__brand">Band Rise</span>' +
        '<span class="topbar__name">' + h.escape(p.name) + ' · ' + Game.content.instruments[p.instrument].name + '</span>' +
        '<span class="topbar__fame" title="Fame level (by total fans)">⭐ ' + Game.rules.progress.fame(state).name + '</span>' +
      '</div>' +
      '<div class="stat"><span class="stat__label">Cash</span><span class="stat__value stat__value--cash">' + h.money(p.cash) + '</span></div>' +
      debt +
      h.meter('Energy', p.energy, b.energy.max) +
      h.meter('Morale', p.morale, b.morale.max) +
      '<div class="stat"><span class="stat__label">Reputation</span><span class="stat__value">' + Math.round(p.reputation) + '</span></div>' +
      '<div class="stat"><span class="stat__label">Date</span><span class="stat__value">' + Game.rules.day.shortDate(state.day) + ', ' + Game.rules.day.date(state.day).year + '</span></div>' +
      '<div class="stat' + (daysToRent === 0 ? ' stat--warn' : '') + '"><span class="stat__label">Rent</span><span class="stat__value">' + rentText + '</span></div>' +
      '</header>' +
      Game.ui.topbar.navHtml(state, screen);
  },

  // The row of tabs. Inbox shows how many unread messages there are; People shows "!" when
  // a bandmate wants to talk.
  navHtml: function (state, screen) {
    var unread = Game.rules.booking.unreadCount(state);
    var tabs = [
      ['today', '🏠 Today'],
      ['calendar', '📅 Calendar'],
      ['inbox', '📬 Inbox' + (unread ? ' <span class="badge badge--warn">' + unread + '</span>' : '')],
      ['booking', '🎤 Book'],
      ['map', '🗺️ Map'],
      ['songs', '🎵 Songs'],
      ['people', '👥 People' + (Game.rules.people.needTalk(state).length ? ' <span class="badge badge--bad">!</span>' : '')],
      ['shop', '🛒 Shop'],
      ['finances', '💰 Finances'],
      ['career', '🏆 Career'],
      ['settings', '⚙️ Settings']
    ];
    return '<nav class="tabs">' + tabs.map(function (tab) {
      return '<button class="tab' + (tab[0] === screen ? ' tab--active' : '') + '" data-nav="' + tab[0] + '" data-tour="' + tab[0] + '">' + tab[1] + '</button>';
    }).join('') + '</nav>';
  },

  // Connects the tabs (called after every screen draws).
  bind: function (root, app) {
    root.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () { app.navigate(el.getAttribute('data-nav')); });
    });
  }
};
