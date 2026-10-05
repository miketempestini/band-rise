// housing.js
// The housing ladder (Phase 13): moving to a nicer (or cheaper) home, and the vacation home, a second home you
// can buy once you've lived in the House. Better homes cost more each week but raise the morale resting level
// (where morale drifts each Sunday). Moving costs 4 weeks of the new home's cost up front. While you owe
// Mom and Dad money you can't move up or buy the vacation home (moving down and selling are always fine).
// Numbers are in balance.housing.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.housing = {

  // Your weekly bills: your main home, plus the vacation home if you own one.
  weeklyBills: function (state) {
    var h = Game.balance.housing;
    return h[state.player.housing].weeklyCost + (state.player.vacationHome ? h.vacation.weeklyCost : 0);
  },

  // The morale resting level: your main home's, or the vacation home's if that's higher.
  restingLevel: function (state) {
    var h = Game.balance.housing;
    return Math.max(h[state.player.housing].moraleRest, state.player.vacationHome ? h.vacation.moraleRest : 0);
  },

  // What moving into a home (or buying the vacation home) costs up front: 4 weeks of its weekly cost.
  moveCost: function (homeId) {
    var h = Game.balance.housing;
    return h[homeId].weeklyCost * h.moveCostWeeks;
  },

  // True if moving there would be a step up (a higher weekly cost than your main home).
  isUpgrade: function (state, homeId) {
    var h = Game.balance.housing;
    return h[homeId].weeklyCost > h[state.player.housing].weeklyCost;
  },

  // Why you can't move into a home, or null.
  moveProblem: function (state, homeId) {
    var h = Game.balance.housing;
    if (h.ladder.indexOf(homeId) === -1) return homeId === 'vacation' ? 'The vacation home can\'t be your main home.' : 'Pick a home.';
    if (state.player.housing === homeId) return 'You already live there.';
    if (Game.rules.housing.isUpgrade(state, homeId)) {
      var blocked = Game.rules.money.blockedByDebt(state, 'upgradeHousing');
      if (blocked) return blocked;
      var cost = Game.rules.housing.moveCost(homeId);
      if (state.player.cash < cost) return 'Moving costs $' + cost.toLocaleString() + ' (you have $' + Math.floor(state.player.cash).toLocaleString() + ').';
    }
    return null;
  },

  // Moves your main home. Moving into the House gives you a free home studio. Returns { state, log }.
  move: function (state, homeId) {
    var problem = Game.rules.housing.moveProblem(state, homeId);
    if (problem) return { state: state, log: [problem] };
    var h = Game.balance.housing;
    var cost = Game.rules.housing.moveCost(homeId);
    var spent = Game.rules.money.spend(state, cost, 'housing');
    var s = spent.state;
    s.player.housing = homeId;
    var log = ['Moved into the ' + h[homeId].name.toLowerCase() + ' ($' + cost.toLocaleString() + ' to move). Weekly bills: $' +
      Game.rules.housing.weeklyBills(s).toLocaleString() + '.'];
    if (h[homeId].freeHomeStudio) {
      s.player.livedInHouse = true;
      if (!s.player.gear.homeStudio) {
        s.player.gear.homeStudio = true;
        log.push('It comes with a home studio: "Record at home" is ready.');
      }
    }
    return { state: s, log: log.concat(spent.log) };
  },

  // Why you can't buy the vacation home, or null.
  vacationProblem: function (state) {
    if (state.player.vacationHome) return 'You already own it.';
    if (!state.player.livedInHouse) return 'Unlocks once you\'ve lived in the House.';
    var blocked = Game.rules.money.blockedByDebt(state, 'buyVacationHome');
    if (blocked) return blocked;
    var cost = Game.rules.housing.moveCost('vacation');
    if (state.player.cash < cost) return 'It costs $' + cost.toLocaleString() + ' up front (you have $' + Math.floor(state.player.cash).toLocaleString() + ').';
    return null;
  },

  // Buys the vacation home: 4 weeks up front, then its weekly cost on top of your main home. Returns { state, log }.
  buyVacationHome: function (state) {
    var problem = Game.rules.housing.vacationProblem(state);
    if (problem) return { state: state, log: [problem] };
    var cost = Game.rules.housing.moveCost('vacation');
    var spent = Game.rules.money.spend(state, cost, 'housing');
    var s = spent.state;
    s.player.vacationHome = true;
    return { state: s, log: ['Bought the vacation home ($' + cost.toLocaleString() + '). Morale now rests at ' + Game.rules.housing.restingLevel(s) +
      '. Weekly bills: $' + Game.rules.housing.weeklyBills(s).toLocaleString() + '.'].concat(spent.log) };
  },

  // Sells the vacation home: its weekly cost stops (no money back). Returns { state, log }.
  sellVacationHome: function (state) {
    if (!state.player.vacationHome) return { state: state, log: ['You don\'t own a vacation home.'] };
    var s = Game.util.clone(state);
    s.player.vacationHome = false;
    return { state: s, log: ['Sold the vacation home. Weekly bills: $' + Game.rules.housing.weeklyBills(s).toLocaleString() + '.'] };
  },

  // Every home for the Shop: { id, name, weeklyCost, moraleRest, moveCost, current, problem } (main homes first,
  // then the vacation home with owned/problem).
  options: function (state) {
    var h = Game.balance.housing;
    var homes = h.ladder.map(function (id) {
      return { id: id, name: h[id].name, weeklyCost: h[id].weeklyCost, moraleRest: h[id].moraleRest, moveCost: Game.rules.housing.moveCost(id),
        current: state.player.housing === id, problem: Game.rules.housing.moveProblem(state, id), studio: !!h[id].freeHomeStudio };
    });
    homes.push({ id: 'vacation', name: h.vacation.name, weeklyCost: h.vacation.weeklyCost, moraleRest: h.vacation.moraleRest,
      moveCost: Game.rules.housing.moveCost('vacation'), owned: !!state.player.vacationHome, problem: Game.rules.housing.vacationProblem(state), second: true });
    return homes;
  }
};
