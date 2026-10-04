// merch.js
// Rules for the Shop (merch stock, the home recording setup, and vans) and selling merch at gigs.
// Numbers are in balance.merch (prices, pack sizes, buy rates), balance.recording.studios.home, and balance.vans.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.merch = {

  // Everything in the Shop: { id, name, price, detail, unlocked, why, owned }.
  shopItems: function (state) {
    var m = Game.balance.merch;
    var home = Game.balance.recording.studios.home;
    var hasEp = state.releases.some(function (r) { return r.type === 'ep' || r.type === 'album'; });
    return [
      {
        id: 'shirts', name: 'T-shirts (' + m.shirt.packSize + ')', price: m.shirt.packCost,
        detail: 'Sell for $' + m.shirt.price + ' each at gigs. You have ' + state.player.merchStock.shirts + '.',
        unlocked: state.milestones.firstPaidGig !== undefined, why: 'Unlocks with your first paid gig.'
      },
      {
        id: 'cds', name: 'CDs (' + m.cd.packSize + ')', price: m.cd.packCost,
        detail: 'Sell for $' + m.cd.price + ' each at gigs. You have ' + state.player.merchStock.cds + '.',
        unlocked: hasEp, why: 'Unlocks with your first EP (or album).'
      },
      {
        id: 'homeStudio', name: 'Home recording setup', price: home.oneTimeCost,
        detail: 'Record at home for free, any free block. Recordings top out at quality ' + home.qualityCap + '.',
        unlocked: state.milestones.firstRecording !== undefined, why: 'Unlocks after your first recording.',
        owned: state.player.gear.homeStudio
      }
    ].concat(Game.rules.merch.vanItems(state));
  },

  // The three vans: { id: 'van-beater', ..., kind }. Unlocked by milestone 10 (On the road).
  // Buying a van replaces the one you have (no trade-in).
  vanItems: function (state) {
    var vans = Game.balance.vans;
    var current = state.player.gear.van;
    return Object.keys(vans).map(function (kind) {
      var v = vans[kind];
      return {
        id: 'van-' + kind, kind: kind, name: Game.content.vans[kind].name, price: v.price,
        detail: Game.content.vans[kind].blurb + ' ' + (v.maxShows === null ? 'Never breaks down.' : 'Lasts ' + v.maxShows + ' out-of-town shows.') +
          (current ? ' (Replaces your ' + Game.content.vans[current.kind].name.toLowerCase() + ', no trade-in.)' : ''),
        unlocked: state.milestones.onTheRoad !== undefined, why: 'Unlocks with milestone 10, On the road (reputation ' + Game.balance.milestones.onTheRoadReputation + ').',
        owned: !!current && current.kind === kind && !current.worn
      };
    });
  },

  // Buys an item from the Shop. Merch is paid up front. Returns { state, log }.
  buy: function (state, itemId) {
    var item = Game.rules.merch.shopItems(state).filter(function (i) { return i.id === itemId; })[0];
    if (!item) return { state: state, log: ['That isn\'t in the shop.'] };
    if (!item.unlocked) return { state: state, log: [item.why] };
    if (item.owned) return { state: state, log: ['You already have one.'] };
    if (state.player.cash < item.price) return { state: state, log: ['That costs $' + item.price + ' (you have $' + Math.floor(state.player.cash) + ').'] };
    var m = Game.balance.merch;
    var s = Game.rules.money.spend(state, item.price, itemId === 'homeStudio' || item.kind ? 'gear' : 'merchStock').state;
    if (item.kind) {
      s.player.gear.van = { kind: item.kind, shows: 0, worn: false };
      s.stats.vansBought += 1;
      // A first van is milestone 12 (Wheels), and may open the Far cities.
      return { state: Game.rules.progress.checkUnlocks(s).state, log: ['Bought a ' + item.name.toLowerCase() + ' for $' + item.price.toLocaleString() + '.'] };
    }
    if (itemId === 'shirts') s.player.merchStock.shirts += m.shirt.packSize;
    if (itemId === 'cds') s.player.merchStock.cds += m.cd.packSize;
    if (itemId === 'homeStudio') s.player.gear.homeStudio = true;
    return { state: s, log: ['Bought ' + item.name + ' for $' + item.price + '.'] };
  },

  // Selling at a gig: each person in the crowd has a chance to buy each item you have in stock
  // (1% Rough, 3% Solid, 6% Great, 9% Legendary; double at Hollow Records). Sales stop when stock runs out.
  // Merch money is yours (not split with the band). Returns { state, sold: { shirts, cds }, revenue, soldOut: [names] }.
  sellAtGig: function (state, crowd, result, venueId) {
    var m = Game.balance.merch;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var chance = m.buyChance[result] * (venueId === 'hollowRecords' ? m.recordStoreMultiplier : 1);
    var items = [['shirts', m.shirt.price], ['cds', m.cd.price]];
    var sold = { shirts: 0, cds: 0 };
    var revenue = 0;
    var soldOut = [];
    items.forEach(function (item) {
      var key = item[0];
      if (s.player.merchStock[key] <= 0) return;
      for (var person = 0; person < crowd && s.player.merchStock[key] > 0; person++) {
        if (rng.chance(chance)) {
          s.player.merchStock[key] -= 1;
          sold[key] += 1;
          revenue += item[1];
        }
      }
      if (s.player.merchStock[key] === 0 && sold[key] > 0) soldOut.push(Game.content.merch[key].name);
    });
    s.rngState = rng.getState();
    if (revenue > 0) s = Game.rules.money.earn(s, revenue, 'merch').state;
    return { state: s, sold: sold, revenue: revenue, soldOut: soldOut };
  }
};
