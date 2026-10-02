// topbar.js
// The bar across the top of the game screens: cash, debt, energy, morale, reputation, date, rent.
// Draw only: it reads the state and returns HTML.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.topbar = {

  html: function (state) {
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

    return '<header class="topbar">' +
      '<div class="topbar__who">' +
        '<span class="topbar__brand">Band Rise</span>' +
        '<span class="topbar__name">' + h.escape(p.name) + ' · ' + Game.content.instruments[p.instrument].name + '</span>' +
      '</div>' +
      '<div class="stat"><span class="stat__label">Cash</span><span class="stat__value stat__value--cash">' + h.money(p.cash) + '</span></div>' +
      debt +
      h.meter('Energy', p.energy, b.energy.max) +
      h.meter('Morale', p.morale, b.morale.max) +
      '<div class="stat"><span class="stat__label">Reputation</span><span class="stat__value">' + Math.round(p.reputation) + '</span></div>' +
      '<div class="stat"><span class="stat__label">Date</span><span class="stat__value">' + h.dateLabel(state.day) + '</span></div>' +
      '<div class="stat' + (daysToRent === 0 ? ' stat--warn' : '') + '"><span class="stat__label">Rent</span><span class="stat__value">' + rentText + '</span></div>' +
      '<button class="btn btn--ghost topbar__settings" data-action="settings">Settings</button>' +
      '</header>';
  }
};
