// debugPanel.js
// A small testing panel, only shown when the address ends in ?debug.
// Later phases can add more buttons here.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.debugPanel = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var d = Game.balance.debug;
    var showOn = ['today', 'weeklySummary'];

    if (!app.debug || !app.state || app.state.gameOver || showOn.indexOf(app.screen) === -1) {
      root.innerHTML = '';
      return;
    }

    root.innerHTML =
      '<div class="debug">' +
        '<div class="debug__title">Debug</div>' +
        '<div class="debug__row">' +
          '<button class="btn btn--small" data-action="cashUp">+' + h.money(d.cashStep) + '</button>' +
          '<button class="btn btn--small" data-action="cashDown">-' + h.money(d.cashStep) + '</button>' +
          '<button class="btn btn--small" data-action="skip">Skip ' + d.skipDays + ' days</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<label>Energy <input type="number" id="debug-energy" class="input input--tiny" value="' + app.state.player.energy + '"></label>' +
          '<button class="btn btn--small" data-action="setEnergy">Set</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<label>Morale <input type="number" id="debug-morale" class="input input--tiny" value="' + app.state.player.morale + '"></label>' +
          '<button class="btn btn--small" data-action="setMorale">Set</button>' +
        '</div>' +
      '</div>';

    var rules = Game.rules.debug;
    h.bind(root, {
      cashUp: function () { app.applyRule(rules.changeCash(app.state, d.cashStep)); },
      cashDown: function () { app.applyRule(rules.changeCash(app.state, -d.cashStep)); },
      skip: function () { app.afterDayChange(rules.skipDays(app.state, d.skipDays)); },
      setEnergy: function () { app.applyRule(rules.setEnergy(app.state, Number(root.querySelector('#debug-energy').value))); },
      setMorale: function () { app.applyRule(rules.setMorale(app.state, Number(root.querySelector('#debug-morale').value))); }
    });
  }
};
