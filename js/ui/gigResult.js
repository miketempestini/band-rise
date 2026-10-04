// gigResult.js
// The gig result screen. First a short crowd meter fills up while the headcount counts up
// (about 2.5 seconds, skippable). Then the result: headline, crowd, a score breakdown bar
// split into labeled parts, what you got, and one plain tip when something hurt the score.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.gigResult = {

  render: function (root, app) {
    var gig = app.state.lastGig;
    if (app.gigPhase === 'meter') Game.ui.gigResult.renderMeter(root, app, gig);
    else Game.ui.gigResult.renderResult(root, app, gig);
  },

  // How big the crowd bar is drawn: the room's capacity, or the most people that could have come.
  crowdScale: function (gig) {
    if (gig.capacity !== null) return gig.capacity;
    return Math.max(gig.crowd, Math.round(gig.expectedCrowd * Game.balance.crowd.randomMax));
  },

  // ----- Part 1: the crowd meter -----

  renderMeter: function (root, app, gig) {
    var scale = Game.ui.gigResult.crowdScale(gig);
    root.innerHTML =
      '<section class="title-screen gig-meter">' +
        '<p class="reveal__kicker">' + Game.ui.helpers.escape(gig.venueName) + ' · ' + (gig.kind === 'show' ? 'show' : 'open mic') + '</p>' +
        '<div class="gig-meter__count"><span id="crowd-count">0</span> <span class="gig-meter__unit">people</span></div>' +
        '<div class="meter meter--crowd"><span class="meter__fill" id="crowd-fill" style="width:0%"></span></div>' +
        '<p class="hint">You step up to the mic...</p>' +
        '<button class="btn btn--ghost" data-action="skip">Skip</button>' +
      '</section>';

    var count = root.querySelector('#crowd-count');
    var fill = root.querySelector('#crowd-fill');
    var duration = Game.balance.gigs.crowdMeterSeconds * 1000;
    var started = null;
    var token = {}; // stops this animation if the screen changes before it ends
    app.gigAnimation = token;

    function step(now) {
      if (app.gigAnimation !== token) return;
      if (started === null) started = now;
      var t = Math.min(1, (now - started) / duration);
      var eased = 1 - Math.pow(1 - t, 3); // starts fast, slows near the end
      count.textContent = Math.round(gig.crowd * eased);
      fill.style.width = (gig.crowd / scale * 100 * eased) + '%';
      if (t < 1) window.requestAnimationFrame(step);
      else app.finishGigMeter();
    }
    window.requestAnimationFrame(step);

    Game.ui.helpers.bind(root, {
      skip: function () { app.finishGigMeter(); }
    });
  },

  // ----- Part 2: the result -----

  renderResult: function (root, app, gig) {
    var h = Game.ui.helpers;
    var text = Game.content.gigText;
    var self = Game.ui.gigResult;
    var r = gig.rewards;
    var u = Game.util;
    var scale = self.crowdScale(gig);

    var rewardRows = [
      ['Fans', u.signed(r.fans) + ' <span class="muted">(' + Game.content.cities.hometown.name + ' now ' + r.cityFans.toLocaleString() + ')</span>'],
      ['Buzz', u.signed(r.buzz) + ' <span class="muted">(now ' + Math.round(r.buzzNow) + ')</span>'],
      ['Reputation', u.signed(r.reputation) + ' <span class="muted">(now ' + u.round1(r.reputationNow) + ')</span>'],
      ['Morale', r.morale ? u.signed(r.morale) : '±0'],
      gig.kind === 'show'
        ? ['Pay', h.money(r.pay) + (r.band && r.band.length ? ' <span class="muted">(your share ' + h.money(r.yourPay) + ')</span>' : '')]
        : ['Tip jar', h.money(r.tips) + (r.band && r.band.length ? ' <span class="muted">(your share ' + h.money(r.yourTips) + ')</span>' : '')],
      ['Skills', Object.keys(r.skills).map(function (skill) {
        return u.signed(r.skills[skill]) + ' ' + Game.content.skills[skill];
      }).join(', ')]
    ];
    if (gig.kind === 'show') {
      rewardRows.push(['Venue relationship', u.signed(r.venueRelationship) + ' <span class="muted">(now ' + Math.round(r.venueRelationshipNow) + ')</span>']);
      if (gig.sessionPlayers) rewardRows.push(['Session players', gig.sessionPlayers + ' (paid when hired)']);
    }
    if (r.merch && (r.merch.sold.shirts || r.merch.sold.cds)) {
      rewardRows.push(['Merch', h.money(r.merch.revenue) + ' <span class="muted">(' +
        [r.merch.sold.shirts ? r.merch.sold.shirts + ' shirt' + (r.merch.sold.shirts === 1 ? '' : 's') : '',
         r.merch.sold.cds ? r.merch.sold.cds + ' CD' + (r.merch.sold.cds === 1 ? '' : 's') : ''].filter(Boolean).join(', ') +
        (r.merch.soldOut.length ? ' · ' + r.merch.soldOut.join(' and ') + ' sold out!' : '') + ')</span>']);
    }
    if (r.band && r.band.length) {
      rewardRows.push(['Band', h.escape(r.band.join(', ')) + ' <span class="muted">(+' + Game.balance.people.relationship.gigTogether + ' relationship each)</span>']);
    }
    gig.songs.forEach(function (song) {
      rewardRows.push(['"' + h.escape(song.title) + '"', 'Tightness ' + Math.round(song.tightnessBefore) + ' → ' + Math.round(song.tightnessAfter)]);
    });

    var notes = [];
    if (gig.luckProtected) notes.push('Bad-luck protection: after two Rough nights, luck couldn\'t go below 0 tonight.');
    if (gig.forced) notes.push('Debug: this result was forced from the debug panel.');
    gig.notes.forEach(function (line) { notes.push(line); });

    root.innerHTML =
      Game.ui.topbar.html(app.state, app.screen) +
      '<section class="screen screen--narrow gig-result">' +
        '<p class="reveal__kicker">' + h.dateLabel(gig.day) + ' · ' + (gig.kind === 'show' ? h.escape(Game.rules.booking.dealLabel(Game.content.venues[gig.venueId], gig.deal, gig.fee)) : 'open mic') + '</p>' +
        '<h1 class="screen__title gig-result__headline gig-result__headline--' + gig.result + '">' +
          h.escape(text.headlines[gig.result].replace('{venue}', gig.venueName)) + '</h1>' +

        '<div class="panel">' +
          '<h3 class="panel__title">Crowd</h3>' +
          '<div class="gig-crowd"><strong>' + gig.crowd + '</strong> people' +
            (gig.capacity !== null ? ' of ' + gig.capacity : '') + '</div>' +
          '<div class="meter meter--crowd"><span class="meter__fill" style="width:' + (gig.crowd / scale * 100) + '%"></span></div>' +
        '</div>' +

        '<div class="panel">' +
          '<h3 class="panel__title">Why it went this way</h3>' +
          self.breakdownHtml(gig) +
        '</div>' +

        (gig.tipId ? '<div class="panel panel--tip"><strong>Tip:</strong> ' + h.escape(text.tips[gig.tipId]) + '</div>' : '') +

        '<div class="panel">' +
          '<h3 class="panel__title">What you got</h3>' +
          '<dl class="rows">' + rewardRows.map(function (row) {
            return '<dt>' + row[0] + '</dt><dd>' + row[1] + '</dd>';
          }).join('') + '</dl>' +
          (notes.length ? '<ul class="log gig-notes">' + notes.map(function (n) { return '<li>' + h.escape(n) + '</li>'; }).join('') + '</ul>' : '') +
        '</div>' +

        '<div class="actions">' +
          '<button class="btn btn--primary btn--big" data-action="continue">Continue</button>' +
        '</div>' +
      '</section>';

    root.querySelector('[data-action="continue"]').focus({ preventScroll: true });
    window.scrollTo(0, 0);
    h.bind(root, {
      continue: function () { app.leaveGigResult(); },
      focusPayBack: function () { app.leaveGigResult(); }
    });
  },

  // The score breakdown: a bar of the positive parts, red chips for the negative parts,
  // and a scale showing where Rough, Solid, Great, and Legendary start and where this score landed.
  breakdownHtml: function (gig) {
    var g = Game.balance.gigs;
    var labels = Game.content.gigText.parts;
    var u = Game.util;
    var positives = gig.parts.filter(function (p) { return p.value > 0; });
    var negatives = gig.parts.filter(function (p) { return p.value < 0; });
    var positiveTotal = positives.reduce(function (sum, p) { return sum + p.value; }, 0);
    var top = g.results.legendary.minScore + g.luckMax; // the scale runs from 0 to just past Legendary
    var scaleMax = Math.max(top, positiveTotal, gig.score);
    var pct = function (v) { return Math.max(0, v) / scaleMax * 100; };

    // The bar shows each positive part's size and number; the legend underneath names every part.
    var bar = positives.map(function (p) {
      return '<span class="seg seg--' + p.id + '" style="width:' + pct(p.value) + '%" title="' + labels[p.id] + ' ' + u.signed(p.value) + '">' +
        '<span class="seg__value">' + u.signed(p.value) + '</span></span>';
    }).join('');

    var chips = positives.map(function (p) {
      return '<span class="chip"><span class="swatch seg--' + p.id + '"></span>' + labels[p.id] + ' ' + u.signed(p.value) + '</span>';
    }).join('') + negatives.map(function (p) {
      return '<span class="chip chip--bad">' + labels[p.id] + ' ' + u.signed(p.value) + '</span>';
    }).join('');
    var zeroLuck = gig.parts.filter(function (p) { return p.id === 'luck' && p.value === 0; }).length;

    var marks = g.resultOrder.slice(1).map(function (id) {
      return '<span class="scale__mark" style="left:' + pct(g.results[id].minScore) + '%">' +
        '<span>' + id.charAt(0).toUpperCase() + id.slice(1) + ' ' + g.results[id].minScore + '</span></span>';
    }).join('');

    return '<div class="breakdown">' + bar + '</div>' +
      (chips || zeroLuck ? '<div class="chips">' + chips + (zeroLuck ? '<span class="chip">Luck ±0</span>' : '') + '</div>' : '') +
      '<div class="scale">' +
        '<div class="scale__track"><span class="scale__score" style="width:' + pct(gig.score) + '%"></span></div>' +
        marks +
      '</div>' +
      '<p class="gig-score">Score <strong>' + u.round1(gig.score) + '</strong> → <span class="gig-result__headline--' + gig.result + '">' +
        gig.result.charAt(0).toUpperCase() + gig.result.slice(1) + '</span></p>';
  }
};
