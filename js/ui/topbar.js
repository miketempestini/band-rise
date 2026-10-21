// topbar.js
// The bar across the top of the game screens, drawn like the lid of a road case: the logo, who you are, then
// readouts for cash, debt, energy and morale (LED meters), reputation, date, and rent.
// Below it, the tabs to move between screens, drawn like a mixing desk's scribble strip (white tape with each
// name written in marker, and a little light that's on for the screen you're on).
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
        '<span class="topbar__name">' + h.escape(p.name) + ' on ' + Game.content.instruments[p.instrument].name.toLowerCase() + '</span>' +
        '<span class="topbar__fame" title="Fame level (by total fans)">' + Game.rules.progress.fame(state).name + '</span>' +
      '</div>' +
      '<div class="stat"><span class="stat__label">Cash</span><span class="stat__value stat__value--cash">' + h.money(p.cash) + '</span></div>' +
      debt +
      h.ledMeter('Energy', p.energy, b.energy.max, Game.rules.energy.isTired(p.energy) ? 'warn' : '') +
      h.ledMeter('Morale', p.morale, b.morale.max, p.burnedOut ? 'bad' : '') +
      '<div class="stat"><span class="stat__label">Reputation</span><span class="stat__value">' + Math.round(p.reputation) + '</span></div>' +
      '<div class="stat"><span class="stat__label">Date</span><span class="stat__value">' + Game.rules.day.shortDate(state.day) + ', ' + Game.rules.day.date(state.day).year + '</span></div>' +
      '<div class="stat' + (daysToRent === 0 ? ' stat--warn' : '') + '"><span class="stat__label">Rent</span><span class="stat__value">' + rentText + '</span></div>' +
      '</header>' +
      Game.ui.topbar.navHtml(state, screen) +
      // The phone's slim stat bar and bottom tabs (hidden on desktop; see js/ui/mobile.js and mobile.css).
      Game.ui.mobile.barHtml(state) + Game.ui.mobile.navHtml(state, screen);
  },

  // The row of tabs. Inbox shows how many unread messages there are (a little red light with the number);
  // People shows "!" when a bandmate wants to talk.
  navHtml: function (state, screen) {
    var unread = Game.rules.booking.unreadCount(state);
    var tabs = [
      ['today', 'Today'],
      ['calendar', 'Calendar'],
      ['inbox', 'Inbox' + (unread ? ' <span class="badge badge--count" title="' + unread + ' new">' + unread + '</span>' : '')],
      ['booking', 'Book'],
      ['map', 'Map'],
      ['songs', 'Music'],
      ['people', 'People' + (Game.rules.people.needTalk(state).length ? ' <span class="badge badge--count" title="A bandmate wants to talk">!</span>' : '')],
      ['shop', 'Shop'],
      ['finances', 'Finances'],
      ['career', 'Career'],
      ['settings', 'Settings']
    ];
    return '<nav class="tabs"><div class="tabs__strip">' + tabs.map(function (tab) {
      var on = tab[0] === screen;
      return '<button class="tab' + (on ? ' tab--active' : '') + '" data-nav="' + tab[0] + '" data-tour="' + tab[0] + '"' +
        (on ? ' aria-current="page"' : '') + '>' + tab[1] + '</button>';
    }).join('') + '</div></nav>';
  },

  // Connects the tabs (called after every screen draws).
  bind: function (root, app) {
    root.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () { app.navigate(el.getAttribute('data-nav')); });
    });
  }
};
