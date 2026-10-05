// finances.js (screen)
// The Finances tab: every dollar in and out for a period (last week, last month, last 3 months): the band's
// show money (ticket sales, the manager, each bandmate, you), your money in and out by category, what others
// covered, the top earners and costs, a weekly chart, and a show-by-show list with trips and tours grouped.
// Draw only: the numbers come from Game.rules.finances.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.finances = {

  periodNames: { 7: 'Last week', 30: 'Last month', 90: 'Last 3 months' },

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.finances;
    var f = Game.rules.finances;
    var days = app.financeDays || Game.balance.finances.periods[0];
    var sum = f.summary(state, days);
    var tracked = state.finances.entries.length || state.finances.shows.length;

    var periods = Game.balance.finances.periods.map(function (d) {
      return '<button class="btn btn--small' + (d === days ? ' btn--primary' : '') + '" data-action="period" data-days="' + d + '">' + self.periodNames[d] + '</button>';
    }).join('');

    var body = tracked
      ? self.cardsHtml(state, sum) +
        '<div class="finance-grid">' +
          self.showMoneyHtml(sum) +
          self.topHtml(state, days) +
          self.listHtml('Your money in', sum.yourIn, sum.totalIn, 'pos') +
          self.listHtml('Your money out', sum.yourOut, sum.totalOut, 'neg') +
        '</div>' +
        self.coveredHtml(sum) +
        self.chartHtml(state) +
        self.showsHtml(state, days)
      : '<div class="panel"><p class="hint">Money is tracked from now on. End a day and your earnings and costs will show up here.</p></div>';

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Finances</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        '<div class="sort-bar">' + periods + '<span class="muted">' + Game.rules.day.spanLabel(Math.max(0, sum.from), sum.to) + '</span></div>' +
        body +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('finances'); },
      focusPayBack: function () { app.goBack('finances'); },
      period: function (e, el) { app.financeDays = Number(el.getAttribute('data-days')); app.render(); }
    });
  },

  // Money in, money out, net, plus cash now and debt.
  cardsHtml: function (state, sum) {
    var h = Game.ui.helpers;
    var card = function (label, value, cls) {
      return '<div class="finance-card"><span class="finance-card__label">' + label + '</span><span class="finance-card__value ' + (cls || '') + '">' + value + '</span></div>';
    };
    return '<div class="finance-cards">' +
      card('Money in', h.money(sum.totalIn), 'pos') +
      card('Money out', h.money(sum.totalOut), 'neg') +
      card('Net', (sum.net >= 0 ? '+' : '-') + h.money(Math.abs(sum.net)), sum.net >= 0 ? 'pos' : 'neg') +
      card('Cash now', h.money(state.player.cash)) +
      (state.player.loanOwed ? card('Owed to Mom and Dad', h.money(state.player.loanOwed), 'neg') : '') +
      (state.label.signed && state.label.owed > 0 ? card('Label advance to pay back', h.money(state.label.owed), 'neg') : '') +
      '</div>';
  },

  // The band's show money: what came in, and where it went.
  showMoneyHtml: function (sum) {
    var h = Game.ui.helpers;
    var b = sum.band;
    var rows = [];
    if (b.ticketSales) rows.push(['Ticket sales (the door)', h.money(b.ticketSales)]);
    if (b.showFees) rows.push(['Show fees', h.money(b.showFees)]);
    var split = [];
    if (b.managerPay) split.push(['Manager', h.money(b.managerPay)]);
    b.members.forEach(function (m) { split.push([h.escape(m.name), h.money(m.amount)]); });
    split.push(['You', h.money(b.yourPay)]);
    var tips = b.yourTips + b.bandTips;
    return '<div class="panel"><h3 class="panel__title">Show money (the whole band)</h3>' +
      (rows.length || tips
        ? '<dl class="rows">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') +
            '</dl><h4 class="show__sub">Who got it</h4><dl class="rows">' + split.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
            (tips ? '<p class="hint">Tips: ' + h.money(tips) + ' (yours ' + h.money(b.yourTips) + ', the band\'s ' + h.money(b.bandTips) + ').</p>' : '')
        : '<p class="hint">No shows in this period.</p>') +
      '</div>';
  },

  // A list of categories with amounts and a total.
  listHtml: function (title, rows, total, cls) {
    var h = Game.ui.helpers;
    return '<div class="panel"><h3 class="panel__title">' + title + '</h3>' +
      (rows.length
        ? '<dl class="rows">' + rows.map(function (r) { return '<dt>' + h.escape(Game.content.finance.name(r.key)) + '</dt><dd>' + h.money(r.amount) + '</dd>'; }).join('') +
            '<dt class="rows__total">Total</dt><dd class="rows__total ' + cls + '">' + h.money(total) + '</dd></dl>'
        : '<p class="hint">Nothing in this period.</p>') +
      '</div>';
  },

  // What bandmates and the label covered (money that didn't come out of your cash).
  coveredHtml: function (sum) {
    var h = Game.ui.helpers;
    var b = sum.band;
    if (!b.travelCovered.length && !b.labelKept) return '';
    return '<div class="panel"><h3 class="panel__title">Covered by others</h3><dl class="rows">' +
      b.travelCovered.map(function (m) { return '<dt>' + h.escape(m.name) + '\'s part of gas and hotels</dt><dd>' + h.money(m.amount) + '</dd>'; }).join('') +
      (b.labelKept ? '<dt>' + h.escape(Game.content.business.label.name) + ' kept (from streaming)</dt><dd>' + h.money(b.labelKept) + '</dd>' : '') +
      '</dl></div>';
  },

  // The biggest earners and costs, as bars with percentages.
  topHtml: function (state, days) {
    var h = Game.ui.helpers;
    var t = Game.rules.finances.top(state, days);
    var bars = function (rows, cls) {
      return rows.length ? rows.map(function (r) {
        var pct = Math.round(r.share * 100);
        return '<div class="finance-bar"><span class="finance-bar__name">' + h.escape(Game.content.finance.name(r.key)) + '</span>' +
          '<span class="finance-bar__track"><span class="finance-bar__fill finance-bar__fill--' + cls + '" style="width:' + pct + '%"></span></span>' +
          '<span class="finance-bar__pct">' + pct + '%</span></div>';
      }).join('') : '<p class="hint">Nothing yet.</p>';
    };
    return '<div class="panel"><h3 class="panel__title">Top earners and costs</h3>' +
      '<h4 class="show__sub">Earnings</h4>' + bars(t.earnings, 'in') +
      '<h4 class="show__sub">Costs</h4>' + bars(t.costs, 'out') + '</div>';
  },

  // The weekly chart: money in (green) and out (red) for each of the last 13 weeks.
  chartHtml: function (state) {
    var h = Game.ui.helpers;
    var weeks = Game.rules.finances.weekly(state, Game.balance.finances.chartWeeks);
    var max = Math.max.apply(null, weeks.map(function (w) { return Math.max(w.in, w.out); }).concat([1]));
    var W = 900, H = 220, pad = 30, slot = (W - pad) / weeks.length, bar = slot * 0.32;
    var bars = weeks.map(function (w, i) {
      var x = pad + i * slot + slot * 0.15;
      var hin = (H - 50) * w.in / max;
      var hout = (H - 50) * w.out / max;
      var d = Game.rules.day.date(w.firstDay);
      var label = Game.content.calendar.monthNames[d.month].slice(0, 3) + ' ' + d.date;
      return '<rect class="chart__in" x="' + x.toFixed(1) + '" y="' + (H - 30 - hin).toFixed(1) + '" width="' + bar.toFixed(1) + '" height="' + hin.toFixed(1) + '"><title>' +
          label + ': in ' + h.money(w.in) + '</title></rect>' +
        '<rect class="chart__out" x="' + (x + bar + 2).toFixed(1) + '" y="' + (H - 30 - hout).toFixed(1) + '" width="' + bar.toFixed(1) + '" height="' + hout.toFixed(1) + '"><title>' +
          label + ': out ' + h.money(w.out) + '</title></rect>' +
        '<text class="chart__label" x="' + (x + bar).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + label + (w.current ? '*' : '') + '</text>';
    }).join('');
    return '<div class="panel"><h3 class="panel__title">Week by week</h3>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Money in and out each week">' +
        '<line class="chart__axis" x1="' + pad + '" y1="' + (H - 30) + '" x2="' + W + '" y2="' + (H - 30) + '"/>' +
        '<text class="chart__label" x="0" y="20">' + h.money(max) + '</text>' + bars +
      '</svg><p class="hint"><span class="pos">■</span> money in · <span class="neg">■</span> money out · * this week so far</p></div>';
  },

  // Show by show, newest first; a trip (or tour) groups its shows with its travel.
  showsHtml: function (state, days) {
    var h = Game.ui.helpers;
    var groups = Game.rules.finances.showList(state, days);
    if (!groups.length) return '<div class="panel"><h3 class="panel__title">Show by show</h3><p class="hint">No shows in this period.</p></div>';
    var showRow = function (x, inTrip) {
      var v = Game.content.venues[x.venueId];
      var band = Object.keys(x.memberPay).reduce(function (t, id) { return t + x.memberPay[id]; }, 0);
      return '<tr' + (inTrip ? ' class="finance-trip__show"' : '') + '><td>' + h.escape(Game.rules.day.shortDate(x.day)) + '</td>' +
        '<td>' + h.escape(v.name) + (v.cityId !== 'hometown' ? ', ' + h.escape(Game.content.cities[v.cityId].name) : '') + '</td>' +
        '<td>' + h.money(x.gross || x.tips) + '</td><td>' + h.money(x.managerCut) + '</td><td>' + h.money(band) + '</td>' +
        '<td>' + h.money(x.yourPay + x.yourTips) + '</td><td>' + h.money(x.merch) + '</td><td>' + h.money(x.production || 0) + '</td>' +
        '<td class="' + (x.net >= 0 ? 'pos' : 'neg') + '">' + h.money(x.net) + '</td></tr>';
    };
    var rows = groups.map(function (g) {
      if (!g.tripId) return showRow(g.shows[0], false);
      var cities = g.shows.map(function (x) { return Game.content.cities[Game.content.venues[x.venueId].cityId].name; })
        .filter(function (n, i, all) { return all.indexOf(n) === i; });
      return '<tr class="finance-trip"><td colspan="7"><strong>' + (g.tour ? '🚐 Tour' : '🚐 Trip') + ':</strong> ' + h.escape(cities.join(', ')) + ' · ' +
          g.shows.length + ' show' + (g.shows.length === 1 ? '' : 's') + ' · your travel and hotels ' + h.money(g.travel) + '</td>' +
          '<td>Trip net</td><td class="' + (g.net >= 0 ? 'pos' : 'neg') + '"><strong>' + h.money(g.net) + '</strong></td></tr>' +
        g.shows.map(function (x) { return showRow(x, true); }).join('');
    }).join('');
    return '<div class="panel"><h3 class="panel__title">Show by show</h3>' +
      '<table class="quit-table finance-shows"><thead><tr><th>Date</th><th>Venue</th><th>Ticket sales / fee</th><th>Manager</th><th>Band</th><th>You</th>' +
        '<th>Merch</th><th>Production</th><th>Net to you</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="hint">Net to you: your pay and tips, plus merch, minus production (and, for a trip, minus your part of the travel and hotels).</p></div>';
  }
};
