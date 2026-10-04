// contract.js
// The residency contract: the venue's terms (night of the week, nightly rate, number of weeks),
// and a way to propose different terms. Changes lower the chance they'll agree; the answer comes
// the next morning, and you get one counter-offer per contract.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.contract = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var r = Game.balance.offers.residency;
    var m = state.inbox.filter(function (x) { return x.id === app.contractId; })[0];
    if (!m || m.resolved) { app.show('inbox'); return; }
    var offer = m.data;
    var terms = app.contractTerms;
    var venue = Game.content.venues[offer.venueId];
    var days = Game.content.calendar.dayNames;
    var offers = Game.rules.offers;

    var describe = function (t) {
      var dates = offers.residencyDates(state, t.weekday, t.weeks);
      return t.weeks + ' ' + days[t.weekday] + 's at <strong>$' + t.rate + '</strong> a night = <strong>' + h.money(t.rate * t.weeks) + '</strong> ' +
        '<span class="muted">(' + dates.map(function (d) { return 'W' + Game.rules.day.weekNumber(d); }).join(', ') + ')</span>';
    };

    var dayOptions = days.map(function (name, i) {
      var problem = offers.residencyProblem(state, offer.venueId, i, terms.weeks);
      return '<option value="' + i + '"' + (terms.weekday === i ? ' selected' : '') + (problem ? ' disabled' : '') + '>' + name + (problem ? ' (taken)' : '') + '</option>';
    }).join('');
    var rateOptions = '';
    var steps = Math.round(r.maxRateChange * 100 / 5);
    for (var k = -steps; k <= steps; k++) {
      var rate = Math.round(offer.rate * (1 + k * 0.05) / 5) * 5;
      rateOptions += '<option value="' + rate + '"' + (terms.rate === rate ? ' selected' : '') + '>$' + rate + (k === 0 ? ' (offered)' : (k > 0 ? ' (+' + k * 5 + '%)' : ' (' + k * 5 + '%)')) + '</option>';
    }
    var weekOptions = '';
    for (var w = r.minWeeks; w <= r.maxWeeks; w++) {
      weekOptions += '<option value="' + w + '"' + (terms.weeks === w ? ' selected' : '') + '>' + w + ' weeks' + (w === offer.weeks ? ' (offered)' : '') + '</option>';
    }

    var changed = terms.weekday !== offer.weekday || terms.rate !== offer.rate || terms.weeks !== offer.weeks;
    var problem = offers.termsProblem(state, offer, terms);
    var chance = offers.counterChance(state, offer, terms);
    var originalProblem = offers.residencyProblem(state, offer.venueId, offer.weekday, offer.weeks);
    var c = offer.counter;

    var counterArea;
    if (c && c.status === 'pending') {
      counterArea = '<p class="notice notice--info">You proposed ' + c.weeks + ' ' + days[c.weekday] + 's at $' + c.rate +
        ' (' + Math.round(c.chance * 100) + '% chance). They\'ll answer tomorrow morning.</p>';
    } else if (c && c.status === 'declined') {
      counterArea = '<p class="notice notice--error">They said no to your changes. You can still sign the original terms until ' +
        h.dateLabel(m.expiresDay) + '.</p>';
    } else {
      counterArea =
        '<div class="contract-edit">' +
          '<label class="field"><span class="field__label">Night</span><select class="input" id="c-day">' + dayOptions + '</select></label>' +
          '<label class="field"><span class="field__label">Nightly rate</span><select class="input" id="c-rate">' + rateOptions + '</select></label>' +
          '<label class="field"><span class="field__label">Length</span><select class="input" id="c-weeks">' + weekOptions + '</select></label>' +
        '</div>' +
        (changed ? '<p>Your terms: ' + describe(terms) + '</p>' : '') +
        (problem ? '<p class="pick__reason">' + h.escape(problem) + '</p>' : '') +
        '<p class="hint">A different night costs ' + Math.round(r.dayChangePenalty * 100) + '% chance, each 1% more money ' +
          Math.round(r.ratePenaltyPerPercent * 100) + '%, each week longer or shorter ' + Math.round(r.lengthPenaltyPerWeek * 100) +
          '%. Your relationship with ' + h.escape(venue.name) + ' (' + Math.round(state.venues[offer.venueId].relationship) + ') adds ' +
          Math.round(state.venues[offer.venueId].relationship / r.relationshipBonusDivisor) + '%. You get one counter-offer.</p>' +
        '<button class="btn" data-action="propose"' + (changed && !problem ? '' : ' disabled') + '>Propose these terms' +
          (changed && !problem ? ' (' + Math.round(chance * 100) + '% chance, answer tomorrow)' : '') + '</button>';
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">📜 Residency contract</h1>' +
          '<button class="btn" data-action="back">← Inbox</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="panel contract">' +
          '<h3 class="panel__title">' + h.escape(venue.name) + ' offers</h3>' +
          '<p class="contract__terms">' + describe(offer) + '</p>' +
          '<ul class="log">' +
            '<li>Each night is a booked show in the ' + Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + ' with a ' +
              Game.rules.booking.setFor(venue, 'residency').size + '-song set. Pay is split with the band as usual.</li>' +
            '<li>Regulars come back: the crowd never drops below ' + Math.round(r.crowdFloor * 100) + '% of the room (' +
              Math.round(venue.capacity * r.crowdFloor) + ' people).</li>' +
            '<li>Cancelling a night costs the usual cancellation penalties.</li>' +
          '</ul>' +
          (originalProblem ? '<p class="pick__reason">' + h.escape(originalProblem) + '</p>' : '') +
          '<div class="actions actions--left"><button class="btn btn--primary btn--big" data-action="sign"' + (originalProblem ? ' disabled' : '') + '>Sign as offered</button>' +
            '<button class="btn btn--ghost" data-action="decline">Decline</button></div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Negotiate</h3>' + counterArea +
        '</div>' +
      '</section>';

    var bindSelect = function (id, field) {
      var el = root.querySelector('#' + id);
      if (el) el.addEventListener('change', function () { app.contractSet(field, Number(el.value)); });
    };
    bindSelect('c-day', 'weekday');
    bindSelect('c-rate', 'rate');
    bindSelect('c-weeks', 'weeks');
    h.bind(root, {
      back: function () { app.show('inbox'); },
      focusPayBack: function () { app.show('inbox'); },
      sign: function () { app.signContract(); },
      propose: function () { app.proposeContract(); },
      decline: function () { app.declineOffer(m.id); app.show('inbox'); }
    });
  }
};
