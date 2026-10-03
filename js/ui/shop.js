// shop.js
// The Shop screen: merch stock (T-shirts, CDs) and the home recording setup.
// Locked items say what unlocks them.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.shop = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var stock = state.player.merchStock;
    var m = Game.balance.merch;

    var cards = Game.rules.merch.shopItems(state).map(function (item) {
      var icon = { shirts: '👕', cds: '💿', homeStudio: '🎛️' }[item.id];
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
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('shop'); },
      focusPayBack: function () { app.goBack('shop'); },
      buy: function (e, el) { app.buyItem(el.getAttribute('data-item')); }
    });
  }
};
