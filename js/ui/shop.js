// shop.js
// The Shop screen: merch stock (T-shirts, CDs), the home recording setup, vans, and housing (where you live).
// Locked items say what unlocks them.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.shop = {

  // Housing: every home with its weekly cost, morale resting level, and what moving costs.
  housingHtml: function (state) {
    var h = Game.ui.helpers;
    var cards = Game.rules.housing.options(state).map(function (o) {
      var icon = { starter: '🏢', nicer: '🏬', house: '🏡', mansion: '🏰', vacation: '🏖️' }[o.id];
      var button;
      if (o.current) button = '<span class="badge badge--warn">You live here</span>';
      else if (o.second && o.owned) button = '<span class="badge badge--warn">Yours</span> <button class="btn btn--small btn--ghost" data-action="sellVacation">Sell (no refund)</button>';
      else if (o.problem) button = '<span class="pick__reason">🔒 ' + h.escape(o.problem) + '</span>';
      else if (o.second) button = '<button class="btn btn--primary" data-action="buyVacation">Buy for ' + h.money(o.moveCost) + '</button>';
      else button = '<button class="btn btn--primary" data-action="moveHome" data-home="' + o.id + '">Move for ' + h.money(o.moveCost) + '</button>';
      return '<div class="shop-item' + (o.problem && !o.current && !o.owned ? ' shop-item--locked' : '') + '">' +
        '<div class="shop-item__icon">' + icon + '</div>' +
        '<div class="shop-item__name">' + h.escape(o.name) + '</div>' +
        '<p class="hint">' + h.money(o.weeklyCost) + ' a week' + (o.second ? ' on top of your home' : '') + ' · morale rests at ' + o.moraleRest +
          (o.studio ? ' · comes with a home studio' : '') + (o.second ? ' · a second home, unlocks after the House' : '') + '</p>' +
        '<div class="shop-item__buy">' + button + '</div>' +
        '</div>';
    }).join('');
    return '<div class="panel"><h3 class="panel__title">🏠 Housing</h3>' +
      '<p class="hint">Weekly bills now: <strong>' + h.money(Game.rules.housing.weeklyBills(state)) + '</strong>. Morale drifts toward <strong>' +
        Game.rules.housing.restingLevel(state) + '</strong> each Sunday. Moving costs ' + Game.balance.housing.moveCostWeeks +
        ' weeks of the new home\'s cost up front. While you owe Mom and Dad, you can only move down.</p>' +
      '<div class="shop-grid">' + cards + '</div></div>';
  },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var stock = state.player.merchStock;
    var m = Game.balance.merch;

    var cards = Game.rules.merch.shopItems(state).map(function (item) {
      var icon = item.kind ? '🚐' : { shirts: '👕', cds: '💿', homeStudio: '🎛️' }[item.id];
      var button;
      if (item.owned) button = '<span class="badge badge--warn">Owned</span>';
      else if (!item.unlocked) button = '<span class="pick__reason">🔒 ' + h.escape(item.why) + '</span>';
      else button = '<button class="btn btn--primary" data-action="buy" data-item="' + item.id + '"' +
        (state.player.cash < item.price ? ' disabled title="Not enough cash"' : '') + '>Buy for ' + h.money(item.price) + '</button>';
      return '<div class="shop-item' + (item.unlocked ? '' : ' shop-item--locked') + '">' +
        '<div class="shop-item__icon">' + icon + '</div>' +
        '<div class="shop-item__name">' + h.escape(item.name) + '</div>' +
        '<p class="hint">' + h.escape(item.detail) + '</p>' +
        '<div class="shop-item__buy">' + button + '</div>' +
        '</div>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Shop</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="panel">' +
          '<h3 class="panel__title">Your merch stock</h3>' +
          '<dl class="rows rows--big">' +
            '<dt>👕 T-shirts</dt><dd>' + stock.shirts + '</dd>' +
            '<dt>💿 CDs</dt><dd>' + stock.cds + '</dd>' +
          '</dl>' +
          '<p class="hint">At each gig, every person in the crowd might buy one of each item you have: ' +
            Math.round(m.buyChance.rough * 100) + '% on a Rough night, ' + Math.round(m.buyChance.solid * 100) + '% Solid, ' +
            Math.round(m.buyChance.great * 100) + '% Great, ' + Math.round(m.buyChance.legendary * 100) + '% Legendary ' +
            '(double at Hollow Records). Merch money is all yours.</p>' +
        '</div>' +
        '<div class="shop-grid">' + cards + '</div>' +
        Game.ui.shop.housingHtml(state) +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('shop'); },
      focusPayBack: function () { app.goBack('shop'); },
      buy: function (e, el) { app.buyItem(el.getAttribute('data-item')); },
      moveHome: function (e, el) { app.moveHome(el.getAttribute('data-home')); },
      buyVacation: function () { app.buyVacationHome(); },
      sellVacation: function () { app.sellVacationHome(); }
    });
  }
};
