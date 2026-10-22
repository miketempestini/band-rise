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
        Game.ui.career.rivalsHtml(state) +
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
        Game.ui.career.chartsHtml(state) +
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

  // Chart highlights (first entries, Top 10s, and #1s) and every Gold and Platinum record.
  // You and your three rivals side by side, on a clipped sheet: fame, label, fans, reputation, latest record, best chart spot
  // this year, awards won, and the next show on the calendar.
  rivalsHtml: function (state) {
    var h = Game.ui.helpers;
    var rows = Game.rules.scene.rivalRows(state).map(function (r) {
      var latest = r.latest ? '"' + h.escape(r.latest.name) + '" (' + Game.content.releaseTypes[r.latest.type].name + ', ' + Game.rules.day.shortDate(r.latest.day) + ')' : 'Nothing yet';
      var next = r.next ? Game.rules.day.shortDate(r.next.day) + ', ' + h.escape(Game.content.venues[r.next.venueId].name) +
        (r.next.opening ? ' (opening' + (r.next.headliner ? ' for ' + h.escape(r.next.headliner) : '') + ')' : '') : 'Nothing booked';
      return '<tr class="' + (r.you ? 'chart-row--you' : '') + '">' +
        '<td><strong>' + h.escape(r.name) + '</strong>' + (r.you ? ' <span class="badge">You</span>' : ' <span class="badge badge--rival">Rival</span>') + '</td>' +
        '<td>' + h.escape(r.fame) + '</td>' +
        '<td>' + (r.label ? h.escape(r.label) : 'Unsigned') + '</td>' +
        '<td class="num">' + r.fans.toLocaleString() + '</td>' +
        '<td class="num">' + Math.round(r.reputation) + '</td>' +
        '<td>' + latest + '</td>' +
        '<td class="num">' + (r.bestChart ? '#' + r.bestChart : '–') + '</td>' +
        '<td class="num">' + r.awards + '</td>' +
        '<td>' + next + '</td></tr>';
    }).join('');
    return '<div class="chart-sheet paper rivals-sheet"><h3 class="panel__title">Rivals</h3>' +
      '<p class="hint">Three bands from Millbrook climbing alongside you. They chase the same opening slots, chart against you, and turn up at the awards.</p>' +
      '<div class="table-scroll"><table class="chart-table"><thead><tr><th>Band</th><th>Fame</th><th>Label</th><th class="num">Fans</th><th class="num">Reputation</th>' +
      '<th>Latest record</th><th class="num">Best chart this year</th><th class="num">Awards</th><th>Next show</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  },

  chartsHtml: function (state) {
    var h = Game.ui.helpers;
    var labels = { entry: 'First chart entry', top10: 'First Top 10 single', number1: 'First #1 single',
      albumEntry: 'First album on the chart', albumTop10: 'First Top 10 album', albumNumber1: 'First #1 album' };
    var moments = state.charts.moments.map(function (m) {
      return '<div class="milestone"><span class="milestone__num"><span class="disc disc--gold"></span></span>' +
        '<span class="milestone__name">' + labels[m.kind] + ': "' + h.escape(m.title) + '"</span>' +
        '<span class="milestone__when muted">' + h.dateLabel(m.day) + '</span></div>';
    }).join('');
    var records = state.releases.filter(function (r) { return r.records && r.records.length; }).map(function (r) {
      return '<li>"' + h.escape(r.name) + '" (' + Game.content.releaseTypes[r.type].name + '): ' +
        r.records.map(function (k) { return k === 'gold' ? 'Gold' : 'Platinum'; }).join(' and ') + '</li>';
    }).join('');
    if (!moments && !records) return '';
    return '<div class="panel"><h3 class="panel__title">Charts and records</h3>' + moments +
      (records ? '<h4 class="show__sub">Records</h4><ul class="log">' + records + '</ul>' : '') + '</div>';
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
