// merch.js
// Rules for the Shop (merch stock, the home recording setup, and vans) and selling merch at gigs.
// Numbers are in balance.merch (prices, pack sizes, buy rates), balance.recording.studios.home, and balance.vans.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.merch = {

  // Everything in the Shop: { id, name, price, detail, unlocked, why, owned }. Merch items also have packSize and
  // orders: the order sizes you can buy at once ([{ packs, count, price }], smallest first; price is one pack's).
  shopItems: function (state) {
    var m = Game.balance.merch;
    var home = Game.balance.recording.studios.home;
    var hasEp = state.releases.some(function (r) { return r.type === 'ep' || r.type === 'album'; });
    return [
      {
        id: 'shirts', name: 'T-shirts', price: m.shirt.packCost, packSize: m.shirt.packSize, orders: Game.rules.merch.orders('shirts', m.shirt),
        detail: 'Sell for $' + m.shirt.price + ' each at gigs. You have ' + state.player.merchStock.shirts + '.',
        unlocked: state.milestones.firstPaidGig !== undefined, why: 'Unlocks with your first paid gig.'
      },
      {
        id: 'cds', name: 'CDs', price: m.cd.packCost, packSize: m.cd.packSize, orders: Game.rules.merch.orders('cds', m.cd),
        detail: 'Sell for $' + m.cd.price + ' each at gigs. You have ' + state.player.merchStock.cds + '.',
        unlocked: hasEp, why: 'Unlocks with your first EP (or album).'
      },
      {
        id: 'homeStudio', name: 'Home recording setup', price: home.oneTimeCost,
        detail: 'Record at home for free, any free block. Recordings top out at quality ' + home.qualityCap + '.',
        unlocked: state.milestones.firstRecording !== undefined, why: 'Unlocks after your first recording.',
        owned: state.player.gear.homeStudio
      }
    ].concat(Game.rules.merch.tourShirtItems(state), Game.rules.merch.vanItems(state), [Game.rules.merch.jetItem(state)]);
  },

  // The order sizes for a merch item: [{ packs, count, price }] (balance.merch.orderPacks).
  orders: function (itemId, pack) {
    return Game.balance.merch.orderPacks[itemId].map(function (n) { return { packs: n, count: n * pack.packSize, price: n * pack.packCost }; });
  },

  // The private jet: unlocked by milestone 19 (Going global, your first international show).
  jetItem: function (state) {
    var j = Game.balance.travel.jet;
    var t = Game.balance.travel;
    return {
      id: 'jet', name: 'Private jet', price: j.price,
      detail: 'Fly the whole band for one price: ' + '$' + j.national.toLocaleString() + ' a flight at home and $' + j.international.toLocaleString() +
        ' abroad (airlines charge $' + t.flight.perPersonOneWay.toLocaleString() + ' and $' + t.internationalFlight.perPersonOneWay.toLocaleString() +
        ' a person), ' + j.blocksFaster + ' block faster, and less jet lag (-' + t.jetLag.withJet + ' energy instead of -' + t.jetLag.energy + ').',
      unlocked: state.milestones.goingGlobal !== undefined, why: 'Unlocks with milestone 19, Going global (your first international show).',
      owned: !!state.player.gear.jet
    };
  },

  // Tour shirts, while a tour is coming up (or happening now): [] or one item.
  tourShirtItems: function (state) {
    var t = Game.rules.tours.shirtTour(state);
    if (!t) return [];
    var ts = Game.balance.merch.tourShirt;
    var problem = Game.rules.tours.shirtProblem(state);
    var have = state.tourMerch.tourId === t.id ? state.tourMerch.count : 0;
    return [{
      id: 'tourShirts', name: 'Tour shirts: ' + Game.rules.tours.label(t), price: ts.packCost, packSize: ts.packSize,
      orders: Game.rules.merch.orders('tourShirts', ts),
      detail: 'Sell for $' + ts.tourPrice + ' each on this tour, and fans are ' + ts.buyBoost + ' times as likely to buy one. ' +
        'Leftovers sell for $' + ts.leftoverPrice + ' after the tour. You have ' + have + '.',
      unlocked: !problem, why: problem
    }];
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

  // Buys an item from the Shop. Merch is paid up front; packs: how many packs at once (merch only, one of the item's
  // order sizes; 1 if left out). Returns { state, log }.
  buy: function (state, itemId, packs) {
    var item = Game.rules.merch.shopItems(state).filter(function (i) { return i.id === itemId; })[0];
    if (!item) return { state: state, log: ['That isn\'t in the shop.'] };
    if (!item.unlocked) return { state: state, log: [item.why] };
    if (item.owned) return { state: state, log: ['You already have one.'] };
    packs = packs || 1;
    if (item.orders && !item.orders.some(function (o) { return o.packs === packs; })) return { state: state, log: ['Pick one of the order sizes.'] };
    if (!item.orders && packs !== 1) return { state: state, log: ['That comes one at a time.'] };
    var price = item.price * packs;
    if (state.player.cash < price) return { state: state, log: ['That costs $' + price.toLocaleString() + ' (you have $' + Math.floor(state.player.cash).toLocaleString() + ').'] };
    if (itemId === 'tourShirts') return Game.rules.tours.buyShirts(state, packs);
    var m = Game.balance.merch;
    var s = Game.rules.money.spend(state, price, itemId === 'homeStudio' || itemId === 'jet' || item.kind ? 'gear' : 'merchStock').state;
    if (itemId === 'jet') {
      s.player.gear.jet = true;
      // Trips that haven't started are laid out again: the jet is faster and has its own prices.
      s = Game.rules.travel.rebuild(s).state;
      return { state: s, log: ['Bought a private jet for $' + item.price.toLocaleString() + '. Flights are now one price for the whole band, and faster.'] };
    }
    if (item.kind) {
      s.player.gear.van = { kind: item.kind, shows: 0, worn: false };
      s.stats.vansBought += 1;
      // A first van is milestone 12 (Wheels), and may open the Far cities.
      return { state: Game.rules.progress.checkUnlocks(s).state, log: ['Bought a ' + item.name.toLowerCase() + ' for $' + item.price.toLocaleString() + '.'] };
    }
    if (itemId === 'shirts') s.player.merchStock.shirts += m.shirt.packSize * packs;
    if (itemId === 'cds') s.player.merchStock.cds += m.cd.packSize * packs;
    if (itemId === 'homeStudio') s.player.gear.homeStudio = true;
    if (item.orders) {
      return { state: s, log: ['Bought ' + (item.packSize * packs).toLocaleString() + ' ' + item.name + ' for $' + price.toLocaleString() + '. You have ' +
        (itemId === 'shirts' ? s.player.merchStock.shirts : s.player.merchStock.cds).toLocaleString() + ' now.'] };
    }
    return { state: s, log: ['Bought ' + item.name + ' for $' + price.toLocaleString() + '.'] };
  },

  // Selling at a gig: each person in the crowd has a chance to buy each item you have in stock
  // (1% Rough, 3% Solid, 6% Great, 9% Legendary; double at Hollow Records). Sales stop when stock runs out.
  // Tour shirts sell too: on their tour at a higher price and rate, after it at the leftover price (tourId: this
  // show's tour, if any). Merch money is yours (not split with the band).
  // Signed to a label with a 360 cut, the label takes its share of the sales.
  // Returns { state, sold: { shirts, cds, tourShirts }, revenue (all sales), labelCut, soldOut: [names] }.
  sellAtGig: function (state, crowd, result, venueId, tourId) {
    var m = Game.balance.merch;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var chance = m.buyChance[result] * (venueId === 'hollowRecords' ? m.recordStoreMultiplier : 1);
    var items = [['shirts', m.shirt.price], ['cds', m.cd.price]];
    var sold = { shirts: 0, cds: 0, tourShirts: 0 };
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
    var shirts = Game.rules.tours.shirtSale(s, tourId);
    if (shirts) {
      for (var fan = 0; fan < crowd && s.tourMerch.count > 0; fan++) {
        if (rng.chance(Math.min(1, chance * shirts.boost))) {
          s.tourMerch.count -= 1;
          sold.tourShirts += 1;
          revenue += shirts.price;
        }
      }
      if (s.tourMerch.count === 0 && sold.tourShirts > 0) soldOut.push('tour shirts');
    }
    s.rngState = rng.getState();
    var labelCut = Game.rules.label.merchCut(s, revenue);
    if (revenue - labelCut > 0) s = Game.rules.money.earn(s, revenue - labelCut, 'merch').state;
    return { state: s, sold: sold, revenue: revenue, labelCut: labelCut, soldOut: soldOut };
  }
};
