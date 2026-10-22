// labelDeal.js
// A record label's contract: every term in plain words, marked good, fair, or harsh; what the deal means for you
// (an estimate at your current fans and shows); your manager's take; one counter-offer; and Sign or Decline.
// With several labels bidding, it can also show every open offer side by side. Draw only: the open offer is
// app.labelOfferId (null for the comparison) and the ticked counter-offer asks are app.labelAsks.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.labelDeal = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var lb = Game.rules.label;
    var open = lb.openOffers(state);
    var m = app.labelOfferId ? state.inbox.filter(function (x) { return x.id === app.labelOfferId; })[0] : null;
    if (app.labelOfferId && (!m || !m.data.labelId)) { app.labelOfferId = null; app.goBack('labelDeal'); return; }
    var body = m ? Game.ui.labelDeal.contractHtml(state, app, m) : Game.ui.labelDeal.compareHtml(state, open);

    root.innerHTML =
      Game.ui.topbar.html(state, 'inbox') +
      '<section class="screen screen--narrow label-deal">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">' + (m ? 'Record deal' : 'Compare offers') + '</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        body +
      '</section>';

    h.bind(root, {
      back: function () { app.closeLabelDeal(); },
      focusPayBack: function () { app.closeLabelDeal(); },
      ask: function (e, el) { app.labelAskToggle(el.getAttribute('data-ask')); },
      counter: function () { app.sendLabelCounter(); },
      sign: function (e, el) { app.signLabelDeal(el.getAttribute('data-id')); },
      decline: function (e, el) { app.declineLabel(el.getAttribute('data-id')); },
      read: function (e, el) { app.openLabelDeal(el.getAttribute('data-id')); },
      compare: function () { app.openLabelCompare(); }
    });
  },

  // A rating as a tape mark with a word (the color alone never carries the meaning).
  markHtml: function (rating) {
    return '<span class="term__mark term__mark--' + rating + '">' + { good: 'Good', fair: 'Fair', harsh: 'Harsh' }[rating] + '</span>';
  },

  // One offer's full contract.
  contractHtml: function (state, app, m) {
    var h = Game.ui.helpers;
    var self = Game.ui.labelDeal;
    var lb = Game.rules.label;
    var t = m.data.terms;
    var info = lb.info(t.labelId);
    var est = lb.estimate(state, t);
    var rows = lb.termRows(state, t);
    var others = lb.openOffers(state).length;
    var pending = m.data.counter && m.data.counter.status === 'pending';

    var terms = rows.map(function (r) {
      return '<div class="term term--' + r.rating + '">' +
        '<div class="term__head"><span class="term__name">' + h.escape(r.name) + '</span>' + self.markHtml(r.rating) + '</div>' +
        '<div class="term__value">' + h.escape(r.value) + '</div>' +
        '<p class="term__meaning">' + h.escape(r.meaning) + '</p></div>';
    }).join('');

    var weeks = est.weeks;
    var meaning = '<div class="deal-estimate">' +
      '<h3 class="deal-estimate__title">What this means for you</h3>' +
      '<p class="hint">Rough numbers at your current fans and shows, over about ' + weeks + ' weeks (the time to deliver what you\'d owe' +
        (est.late ? ', at your writing pace of about ' + est.pace + ' weeks a record: you\'d miss deadlines' : '') + ').</p>' +
      '<dl class="rows">' +
        '<dt>You\'d get</dt><dd>about ' + h.money(est.total) + ' <span class="muted">(the advance' + (t.tourSupport ? ', tour support' : '') + ', and royalties once it\'s paid back)</span></dd>' +
        '<dt>Those records unsigned</dt><dd>about ' + h.money(est.unsigned) + '</dd>' +
        '<dt>Their push</dt><dd>about ' + est.pushFans.toLocaleString() + ' new fans</dd>' +
        (est.fines ? '<dt>Fines for late records</dt><dd class="neg">about ' + h.money(est.fines) + '</dd>' : '') +
        '<dt>Their cut of shows and merch</dt><dd' + (est.cut360 ? ' class="neg"' : '') + '>' + (est.cut360 ? 'about ' + h.money(est.cut360) : 'none') + '</dd>' +
        '<dt>Advance paid back</dt><dd>' + (est.recoupWeeks ? 'in about ' + est.recoupWeeks + ' weeks' : 'probably never') + '</dd>' +
        '<dt>Buyout if you left right away</dt><dd>' + h.money(est.buyoutNow) + '</dd>' +
      '</dl>' +
      '<p class="deal-estimate__verdict">' + self.markHtml(est.verdict) + ' ' + h.escape({ good: 'Better than staying independent.',
        fair: 'About the same as staying independent.', harsh: 'Worse than staying independent.' }[est.verdict]) + '</p>' +
      '</div>';

    var counter;
    if (m.data.counter) {
      counter = '<div class="panel deal-counter"><h3 class="panel__title">Counter-offer</h3><p>' + ({
        pending: 'You asked for: ' + m.data.counter.asks.map(function (a) { return self.askLabel(t, a); }).join(' and ') + '. They answer tomorrow.',
        accepted: 'They agreed. The terms above include what you asked for.',
        refused: 'They said no. The terms above are their original offer, and it still stands.' }[m.data.counter.status]) + '</p></div>';
    } else if (!m.resolved) {
      var c = Game.balance.label.counter;
      var asks = app.labelAsks.filter(function (a) { return !lb.askProblem(t, a); });
      var boxes = lb.askIds().map(function (a) {
        var problem = lb.askProblem(t, a);
        var on = asks.indexOf(a) !== -1;
        var full = !on && asks.length >= c.maxAsks;
        return '<label class="ask' + (problem ? ' ask--off' : '') + '"' + (problem ? ' title="' + h.escape(problem) + '"' : '') + '>' +
          '<input type="checkbox" data-action="ask" data-ask="' + a + '"' + (on ? ' checked' : '') + (problem || full ? ' disabled' : '') + '> ' +
          h.escape(self.askLabel(t, a)) + '</label>';
      }).join('');
      var chance = asks.length ? lb.counterChance(state, m.id, asks) : null;
      counter = '<div class="panel deal-counter"><h3 class="panel__title">Make one counter-offer</h3>' +
        '<p class="hint">Ask for up to ' + c.maxAsks + ' changes. Each one makes a yes less likely; other labels bidding and your fame make it more likely. ' +
          'If they say no, this offer still stands.</p>' +
        '<div class="asks">' + boxes + '</div>' +
        '<div class="actions actions--left"><button class="btn" data-action="counter"' + (asks.length ? '' : ' disabled') + '>Send counter-offer</button>' +
          (chance !== null ? '<span class="deal-counter__odds">' + Math.round(chance * 100) + '% chance they agree</span>' : '') + '</div></div>';
    } else {
      counter = '';
    }

    var signProblem = lb.signProblem(state, m.id);
    var actions = m.resolved ? '<p class="hint">This offer is closed (' + h.escape(m.resolved) + ').</p>'
      : '<div class="actions actions--left deal-actions">' +
          '<button class="btn btn--primary" data-action="sign" data-id="' + m.id + '"' + (signProblem ? ' disabled title="' + h.escape(signProblem) + '"' : '') + '>Sign with ' + h.escape(info.name) + '</button>' +
          '<button class="btn" data-action="decline" data-id="' + m.id + '">Decline</button>' +
          (others > 1 ? '<button class="btn btn--ghost" data-action="compare">Compare ' + others + ' offers</button>' : '') +
        '</div>' + (signProblem && !pending ? '<p class="hint">' + h.escape(signProblem) + '</p>' : '');

    return '<article class="contract paper">' +
        '<div class="contract__label" style="--label-ink:' + info.color + '">' + h.escape(info.name) + '</div>' +
        '<p class="contract__kind">' + Game.content.labelTiers[info.tier] + ' · ' + Game.content.labelPersonalities[info.personality] +
          (m.resolved ? '' : ' · answer by ' + h.dateLabel(m.expiresDay)) + '</p>' +
        '<p class="contract__blurb">' + h.escape(info.blurb) + '</p>' +
        '<p class="contract__take">' + h.escape(lb.managerTake(state, t, est)) + '</p>' +
        meaning +
        '<h3 class="contract__terms-title">The terms</h3>' +
        '<div class="terms">' + terms + '</div>' +
      '</article>' + counter + actions;
  },

  // What an ask would change, in words.
  askLabel: function (t, ask) {
    var a = Game.balance.label.counter.asks;
    if (ask === 'advance') return 'A bigger advance ($' + Game.rules.label.round(t.advance * (1 + a.advance.amount)).toLocaleString() + ')';
    if (ask === 'royalty') return 'A higher royalty (' + Math.round(Math.min(0.9, t.royalty + a.royalty.amount) * 100) + '%)';
    if (ask === 'records') return 'One record fewer (' + Math.max(1, t.owe.count - a.records.amount) + ')';
    if (ask === 'deadline') return a.deadline.amount + ' more weeks per record';
    if (ask === 'masters') return t.masters === 'label' ? 'Masters come back to you later' : 'You own your masters';
    return 'No cut of shows or merch';
  },

  // Every open offer side by side.
  compareHtml: function (state, open) {
    var h = Game.ui.helpers;
    var self = Game.ui.labelDeal;
    var lb = Game.rules.label;
    if (!open.length) return '<p class="hint">No label offers are open right now.</p>';
    var cols = open.map(function (m) {
      var t = m.data.terms;
      var rows = {};
      lb.termRows(state, t).forEach(function (r) { rows[r.id] = r; });
      return { m: m, t: t, rows: rows, est: lb.estimate(state, t), info: lb.info(t.labelId) };
    });
    var line = function (label, cell) {
      return '<tr><th scope="row">' + h.escape(label) + '</th>' + cols.map(function (c) { return '<td>' + cell(c) + '</td>'; }).join('') + '</tr>';
    };
    var term = function (id) {
      return function (c) { var r = c.rows[id]; return r ? self.markHtml(r.rating) + ' ' + h.escape(r.value) : ''; };
    };
    return '<div class="panel compare"><table class="compare__table">' +
      '<thead><tr><th></th>' + cols.map(function (c) {
        return '<th scope="col"><span class="compare__label" style="--label-ink:' + c.info.color + '">' + h.escape(c.info.name) + '</span><br><span class="muted">' +
          Game.content.labelTiers[c.info.tier] + '</span></th>';
      }).join('') + '</tr></thead><tbody>' +
      line('On the numbers', function (c) { return self.markHtml(c.est.verdict) + ' about ' + h.money(c.est.total) + ' vs ' + h.money(c.est.unsigned) + ' unsigned'; }) +
      ['advance', 'royalty', 'reach', 'support', 'recoup', 'records', 'control', 'masters', 'cut360', 'renewal', 'buyout', 'drop', 'opens'].map(function (id) {
        var name = cols[0].rows[id] ? cols[0].rows[id].name : id;
        return line(name, term(id));
      }).join('') +
      line('', function (c) {
        return '<button class="btn btn--small" data-action="read" data-id="' + c.m.id + '">Read</button> ' +
          '<button class="btn btn--small btn--primary" data-action="sign" data-id="' + c.m.id + '"' + (lb.signProblem(state, c.m.id) ? ' disabled' : '') + '>Sign</button>';
      }) +
      '</tbody></table></div>' +
      '<p class="hint">Each label\'s manager\'s take and the counter-offer are on its full contract (Read).</p>';
  }
};
