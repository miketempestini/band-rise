// finances.js
// Money records for the Finances screen: every dollar into or out of your cash (logged by money.earn and
// money.spend), plus band money that never touches your cash (a show's ticket sales, the manager's cut, each
// bandmate's pay, what bandmates chip in for travel, what the label keeps from streaming), and one record per show.
// Records older than balance.finances.keepDays are dropped each night. Numbers are in balance.finances.
//
//   state.finances.entries: { day, flow: 'in' | 'out' | 'band', cat, amount, personId?, tripId? }
//   state.finances.shows:   { day, venueId, deal, gross, managerCut, memberPay: { personId: $ }, yourPay,
//                             tips, yourTips, merch, production, tripId, tour }

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.finances = {

  // Adds one record to a state that's already a copy (used inside other rules, like money.earn).
  add: function (s, entry) {
    if (!s.finances || !entry.amount) return;
    entry.day = s.day;
    s.finances.entries.push(entry);
  },

  // Adds a show record to a state that's already a copy (from gigs.playGig).
  addShow: function (s, show) {
    if (!s.finances) return;
    show.day = s.day;
    s.finances.shows.push(show);
  },

  // Each night: drops records older than keepDays. Returns { state, log }.
  prune: function (state) {
    var keep = Game.balance.finances.keepDays;
    var oldest = state.day - keep;
    if (!state.finances.entries.some(function (e) { return e.day < oldest; }) &&
        !state.finances.shows.some(function (x) { return x.day < oldest; })) return { state: state, log: [] };
    var s = Game.util.clone(state);
    s.finances.entries = s.finances.entries.filter(function (e) { return e.day >= oldest; });
    s.finances.shows = s.finances.shows.filter(function (x) { return x.day >= oldest; });
    return { state: s, log: [] };
  },

  // The first day of the last N days (today is the Nth).
  periodStart: function (state, days) { return state.day - days + 1; },

  // The records in the last N days (today included).
  inPeriod: function (list, state, days) {
    var from = Game.rules.finances.periodStart(state, days);
    return list.filter(function (e) { return e.day >= from && e.day <= state.day; });
  },

  // Adds up amounts by a key. Returns [{ key, amount }], biggest first.
  totals: function (list, keyOf) {
    var by = {};
    list.forEach(function (e) { var k = keyOf(e); by[k] = (by[k] || 0) + e.amount; });
    return Object.keys(by).map(function (k) { return { key: k, amount: by[k] }; }).sort(function (a, b) { return b.amount - a.amount; });
  },

  // A person's name (former bandmates too), or "A bandmate".
  personName: function (state, id) {
    return state.people[id] ? state.people[id].name : 'A bandmate';
  },

  // Everything for one period: your money in and out by category, the band's show money, and what others covered.
  // Returns { from, to, yourIn: [{ key, amount }], yourOut, totalIn, totalOut, net,
  //           band: { ticketSales, showFees, managerPay, members: [{ personId, name, amount }], yourPay, yourTips,
  //                   bandTips, travelCovered: [{ personId, name, amount }], labelKept } }.
  summary: function (state, days) {
    var f = Game.rules.finances;
    var list = f.inPeriod(state.finances.entries, state, days);
    var flow = function (name) { return list.filter(function (e) { return e.flow === name; }); };
    var yourIn = f.totals(flow('in'), function (e) { return e.cat; });
    var yourOut = f.totals(flow('out'), function (e) { return e.cat; });
    var band = flow('band');
    var sumCat = function (cat) { return band.filter(function (e) { return e.cat === cat; }).reduce(function (t, e) { return t + e.amount; }, 0); };
    var people = function (cat) {
      return f.totals(band.filter(function (e) { return e.cat === cat; }), function (e) { return e.personId; })
        .map(function (x) { return { personId: x.key, name: f.personName(state, x.key), amount: x.amount }; });
    };
    var add = function (rows) { return rows.reduce(function (t, r) { return t + r.amount; }, 0); };
    var totalIn = add(yourIn);
    var totalOut = add(yourOut);
    return {
      from: f.periodStart(state, days), to: state.day,
      yourIn: yourIn, yourOut: yourOut, totalIn: totalIn, totalOut: totalOut, net: totalIn - totalOut,
      band: {
        ticketSales: sumCat('ticketSales'), showFees: sumCat('showFees'), managerPay: sumCat('managerPay'),
        members: people('memberPay'),
        yourPay: (yourIn.filter(function (r) { return r.key === 'gigPay'; })[0] || { amount: 0 }).amount,
        yourTips: (yourIn.filter(function (r) { return r.key === 'tips'; })[0] || { amount: 0 }).amount,
        bandTips: sumCat('bandTips'),
        travelCovered: people('travelCovered'),
        labelKept: sumCat('labelKept')
      }
    };
  },

  // The biggest earnings and costs in a period, with each one's share of the total (0 to 1).
  // Returns { earnings: [{ key, amount, share }], costs: [...] }.
  top: function (state, days) {
    var sum = Game.rules.finances.summary(state, days);
    var n = Game.balance.finances.topCount;
    var withShare = function (rows, total) {
      return rows.slice(0, n).map(function (r) { return { key: r.key, amount: r.amount, share: total ? r.amount / total : 0 }; });
    };
    return { earnings: withShare(sum.yourIn, sum.totalIn), costs: withShare(sum.yourOut, sum.totalOut) };
  },

  // Money in and out for each of the last N weeks (finished weeks from the ledger, plus this week so far).
  // Returns [{ week, firstDay, in, out }], oldest first.
  weekly: function (state, weeks) {
    var rows = state.ledger.slice(-(weeks - 1)).map(function (w) {
      var t = Game.rules.money.weekTotals(w);
      return { week: w.week, firstDay: Game.rules.day.firstDayOfWeek(w.week), in: t.totalIn, out: t.totalOut };
    });
    var now = Game.rules.money.weekTotals(state.thisWeek);
    var week = Game.rules.day.weekNumber(state.day);
    rows.push({ week: week, firstDay: Game.rules.day.firstDayOfWeek(week), in: now.totalIn, out: now.totalOut, current: true });
    return rows;
  },

  // Shows in a period, newest first, grouped by trip: shows on the same trip (or tour) share one group with that
  // trip's travel (your part of gas, flights, and hotels). Each show's net to you = your pay + your tips + merch -
  // production; a group's net also takes off its travel.
  // Returns [{ tripId, tour, shows: [show], travel, net }].
  showList: function (state, days) {
    var f = Game.rules.finances;
    var shows = f.inPeriod(state.finances.shows, state, days).slice().sort(function (a, b) { return b.day - a.day; });
    var travelOf = function (tripId) {
      return state.finances.entries.filter(function (e) { return e.flow === 'out' && e.tripId === tripId; }).reduce(function (t, e) { return t + e.amount; }, 0);
    };
    var groups = [];
    var byTrip = {};
    shows.forEach(function (x) {
      x.net = x.yourPay + x.yourTips + x.merch - (x.production || 0);
      if (x.tripId && byTrip[x.tripId]) { byTrip[x.tripId].shows.push(x); return; }
      var g = { tripId: x.tripId || null, tour: !!x.tour, shows: [x], travel: x.tripId ? travelOf(x.tripId) : 0 };
      if (x.tripId) byTrip[x.tripId] = g;
      groups.push(g);
    });
    groups.forEach(function (g) {
      g.tour = g.shows.some(function (x) { return x.tour; });
      g.shows.sort(function (a, b) { return a.day - b.day; });
      g.net = g.shows.reduce(function (t, x) { return t + x.net; }, 0) - g.travel;
    });
    return groups;
  }
};
