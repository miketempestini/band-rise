// tourWrapUp.js
// The tour wrap-up: after a tour's last show (and from the Career screen later), a settlement sheet for the whole
// tour: shows and crowd, ticket sales, your pay, merch, production, travel, what you made, the best night, and the
// fans you won in each city. A tour that made money gets a gold record. Draw only: the numbers were saved on the
// tour by Game.rules.tours.wrapUp when it ended.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.tourWrapUp = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var tour = Game.rules.tours.find(state, app.wrapUpTourId);
    var r = tour.result || Game.rules.tours.wrapUp(state, tour.id);
    var best = r.best;
    var bestText = best ? h.escape(Game.content.venues[best.venueId].name) + ', ' + h.escape(Game.content.cities[Game.content.venues[best.venueId].cityId].name) +
      ' (' + h.dateLabel(best.day) + '): ' + best.crowd.toLocaleString() + ' people' + (best.result ? ', ' + best.result.charAt(0).toUpperCase() + best.result.slice(1) : '') : 'No shows played.';
    var net = (r.net >= 0 ? '+' : '-') + h.money(Math.abs(r.net));
    var fans = r.fansByCity.filter(function (f) { return f.fans > 0; }); // cities already full of fans are left out

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<article class="settlement wrapup paper paper--taped">' +
          (r.profit ? '<span class="wrapup__record" title="This tour made money"><span class="disc disc--gold disc--big"></span>Gold record</span>' : '') +
          '<header class="settlement__head">' +
            '<h1 class="settlement__title">' + h.escape(Game.rules.tours.label(tour)) + '</h1>' +
            '<span class="settlement__week">' + Game.rules.day.spanLabel(tour.firstDay, tour.lastDay) + '</span>' +
          '</header>' +
          '<div class="summary-grid">' +
            '<div class="settlement__col"><h3 class="panel__title">The tour</h3><dl class="rows">' +
              '<dt>Shows played</dt><dd>' + r.shows + '</dd>' +
              '<dt>Total crowd</dt><dd>' + r.crowd.toLocaleString() + '</dd>' +
              '<dt>Ticket sales and fees</dt><dd>' + h.money(r.gross) + '</dd>' +
            '</dl></div>' +
            '<div class="settlement__col"><h3 class="panel__title">Your money</h3><dl class="rows">' +
              '<dt>Your pay and tips</dt><dd>' + h.money(r.yourPay) + '</dd>' +
              '<dt>Merch</dt><dd>' + h.money(r.merch) + '</dd>' +
              '<dt>Production</dt><dd>-' + h.money(r.production) + '</dd>' +
              '<dt>Travel and hotels (your part)</dt><dd>-' + h.money(r.travel) + '</dd>' +
              '<dt class="rows__total">You made</dt><dd class="rows__total ' + (r.net >= 0 ? 'pos' : 'neg') + '">' + net + '</dd>' +
            '</dl></div>' +
          '</div>' +
          '<dl class="rows settlement__totals">' +
            '<dt>Best night</dt><dd>' + bestText + '</dd>' +
          '</dl>' +
          (fans.length ? '<h3 class="panel__title wrapup__fans-title">New fans</h3><dl class="rows">' + fans.map(function (f) {
            return '<dt>' + h.escape(Game.content.cities[f.cityId].name) + '</dt><dd>+' + f.fans.toLocaleString() + '</dd>';
          }).join('') + '</dl>' : '') +
        '</article>' +
        '<div class="actions">' +
          '<button class="btn" data-action="poster">See the tour poster</button>' +
          '<button class="btn btn--primary btn--big" data-action="continue">' + (app.wrapUpFrom === 'career' ? '← Back to Career' : 'Continue') + '</button>' +
        '</div>' +
      '</section>' +
      (app.posterTourId ? Game.ui.tourPoster.modalHtml() : '');

    h.bind(root, {
      continue: function () { app.leaveTourWrapUp(); },
      focusPayBack: function () { app.leaveTourWrapUp(); },
      poster: function () { app.openTourPoster(tour.id); }
    });
    if (app.posterTourId) Game.ui.tourPoster.bindModal(root, app, state, app.posterTourId);
  }
};
