// career.js (screen)
// The Career screen: your fame level, milestones reached (each one a gold record) and what's next, the shareable
// career card, your tours, and lifetime stats.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.career = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var fame = Game.rules.progress.fame(state);
    var st = state.stats;

    var reached = Game.content.milestones.filter(function (m) { return state.milestones[m.id] !== undefined; });
    var ahead = Game.content.milestones.filter(function (m) { return state.milestones[m.id] === undefined; }).slice(0, Game.balance.ui.upcomingMilestones);

    var milestoneRow = function (m, done) {
      return '<div class="milestone' + (done ? ' milestone--done' : '') + '">' +
        '<span class="milestone__num"><span class="disc' + (done ? ' disc--gold' : '') + '">' + (done ? '' : m.number) + '</span></span>' +
        '<span class="milestone__name">' + m.name + '</span>' +
        '<span class="milestone__when muted">' + (done ? h.dateLabel(state.milestones[m.id]) : m.trigger) + '</span>' +
        '</div>';
    };

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Career</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        '<div class="panel fame">' +
          '<h3 class="panel__title">Fame level</h3>' +
          '<div class="fame__name">' + fame.name + '</div>' +
          '<div class="fame__fans">' + fame.fans.toLocaleString() + ' fan' + (fame.fans === 1 ? '' : 's') + '</div>' +
          (fame.next
            ? '<span class="meter meter--big"><span class="meter__fill" style="width:' + Math.round(fame.toNext * 100) + '%"></span></span>' +
              '<p class="hint">' + (fame.next.minFans - fame.fans).toLocaleString() + ' more to <strong>' + fame.next.name + '</strong> (' +
              fame.next.minFans.toLocaleString() + ' fans)</p>'
            : '<p class="hint">The top. Legend.</p>') +
          '<div class="fame-ladder">' + Game.rules.progress.fameLadder(state).map(function (l) {
            return '<div class="fame-step' + (l.reached ? ' fame-step--reached' : '') + (l.current ? ' fame-step--current' : '') + '">' +
              '<span class="fame-step__mark">' + (l.reached ? '✓' : '') + '</span>' +
              '<span class="fame-step__name">' + l.name + '</span>' +
              '<span class="fame-step__fans">' + l.minFans.toLocaleString() + ' fans</span></div>';
          }).reverse().join('') + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Career card</h3>' +
          '<p class="hint">A snapshot of your career to share with other players. Save it as an image.</p>' +
          '<canvas id="career-card" class="career-card" width="' + Game.ui.careerCard.width + '" height="' + Game.ui.careerCard.height + '"></canvas>' +
          '<div class="actions actions--left"><button class="btn btn--primary" data-action="saveCard">Save as image</button></div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Milestones · ' + reached.length + ' reached</h3>' +
          (reached.length ? reached.map(function (m) { return milestoneRow(m, true); }).join('') : '<p class="hint">None yet. Your first open mic is a good start.</p>') +
          '<h4 class="show__sub">Coming up</h4>' +
          ahead.map(function (m) { return milestoneRow(m, false); }).join('') +
        '</div>' +
        Game.ui.career.toursHtml(state) +
        '<div class="panel">' +
          '<h3 class="panel__title">Lifetime</h3>' +
          '<dl class="rows">' +
            '<dt>Started</dt><dd>' + Game.rules.day.longDate(0) + '</dd>' +
            '<dt>Days played</dt><dd>' + state.day + '</dd>' +
            '<dt>Weeks played</dt><dd>' + Math.floor(state.day / Game.balance.time.daysPerWeek) + '</dd>' +
            '<dt>Gigs played</dt><dd>' + st.gigsPlayed + ' (' + st.openMicsPlayed + ' open mics, ' + st.paidShows + ' paid shows)</dd>' +
            '<dt>Best result</dt><dd>' + (st.bestResult ? st.bestResult.charAt(0).toUpperCase() + st.bestResult.slice(1) : '-') + '</dd>' +
            '<dt>Biggest crowd</dt><dd>' + st.biggestCrowd + (st.biggestShow ? ' (' + h.escape(Game.content.venues[st.biggestShow.venueId].name) + ', ' + h.dateLabel(st.biggestShow.day) + ')' : '') + '</dd>' +
            '<dt>Earned from music</dt><dd>' + h.money(st.totalEarned) + '</dd>' +
            '<dt>Original songs</dt><dd>' + Game.rules.songs.playable(state).filter(function (x) { return !x.isCover; }).length + '</dd>' +
            '<dt>Reputation</dt><dd>' + Game.util.round1(state.player.reputation) + '</dd>' +
          '</dl>' +
        '</div>' +
      '</section>' +
      (app.posterTourId ? Game.ui.tourPoster.modalHtml() : '');

    h.bind(root, {
      back: function () { app.goBack('career'); },
      focusPayBack: function () { app.goBack('career'); },
      saveCard: function () { Game.ui.careerCard.save(root.querySelector('#career-card'), state); },
      tourPoster: function (e, el) { app.openTourPoster(el.getAttribute('data-tour')); },
      tourWrapUp: function (e, el) { app.openTourWrapUp(el.getAttribute('data-tour'), 'career'); }
    });
    if (app.posterTourId) Game.ui.tourPoster.bindModal(root, app, state, app.posterTourId);
    Game.ui.careerCard.draw(root.querySelector('#career-card'), Game.rules.progress.careerCard(state));
    // The card uses the game's fonts: draw it again once they've finished loading (the first time, they may not be).
    if (document.fonts) {
      document.fonts.load('800 72px "Barlow Condensed"').then(function () {
        Game.ui.careerCard.draw(root.querySelector('#career-card'), Game.rules.progress.careerCard(state));
      });
    }
  },

  // Your tours, newest first: the name (or the cities), the dates, how many shows, and how it's going. Finished tours
  // that made money get a gold record, other finished ones a black record, and tours still ahead an outline.
  // Each has a Poster button, and finished ones a Wrap-up button.
  toursHtml: function (state) {
    var h = Game.ui.helpers;
    var rows = state.tours.slice().reverse().map(function (t) {
      var status = Game.rules.tours.status(state, t);
      var disc = status !== 'done' ? 'disc disc--ahead' : (t.result && t.result.profit ? 'disc disc--gold' : 'disc');
      var when = status === 'ahead' ? 'Coming up' : (status === 'now' ? 'On tour now' : (t.result ? (t.result.net >= 0 ? '+' : '-') + h.money(Math.abs(t.result.net)) : ''));
      return '<div class="milestone tour-row">' +
        '<span class="milestone__num"><span class="' + disc + '"></span></span>' +
        '<span><span class="milestone__name">' + h.escape(Game.rules.tours.label(t)) + '</span>' +
          '<span class="tour-row__meta">' + Game.rules.day.spanLabel(t.firstDay, t.lastDay) + ', ' + t.shows + ' show' + (t.shows === 1 ? '' : 's') +
            (when ? ' · ' + when : '') + '</span></span>' +
        '<span class="tour-row__btns">' +
          (t.result ? '<button class="btn btn--small" data-action="tourWrapUp" data-tour="' + t.id + '">Wrap-up</button>' : '') +
          '<button class="btn btn--small" data-action="tourPoster" data-tour="' + t.id + '">Poster</button>' +
        '</span>' +
        '</div>';
    }).join('');
    return '<div class="panel">' +
      '<h3 class="panel__title">Tours</h3>' +
      (rows || '<p class="hint">No tours yet. Once you have a manager, ask for one on the Manager screen (and give it a name if you like).</p>') +
      '</div>';
  }
};
