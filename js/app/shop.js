// app/shop.js
// The Shop, and housing (moving and the vacation home).
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {


  buyItem: function (itemId) {
    var app = Game.app;
    var result = Game.rules.merch.buy(app.state, itemId);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  moveHome: function (homeId) {
    var app = Game.app;
    var cost = Game.rules.housing.moveCost(homeId);
    if (!window.confirm('Move into the ' + Game.balance.housing[homeId].name.toLowerCase() + '? Moving costs ' + Game.ui.helpers.money(cost) +
      ' now, and your weekly bills become ' + Game.ui.helpers.money(Game.balance.housing[homeId].weeklyCost + (app.state.player.vacationHome ? Game.balance.housing.vacation.weeklyCost : 0)) + '.')) return;
    app.applyWithNotice(Game.rules.housing.move(app.state, homeId));
  },

  buyVacationHome: function () { Game.app.applyWithNotice(Game.rules.housing.buyVacationHome(Game.app.state)); },

  sellVacationHome: function () {
    if (!window.confirm('Sell the vacation home? Its weekly cost stops, and you get nothing back.')) return;
    Game.app.applyWithNotice(Game.rules.housing.sellVacationHome(Game.app.state));
  }
});
