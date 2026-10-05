// career.js (screen)
// The Career screen: your fame level, milestones reached (and what's next), and lifetime stats.

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
        '<span class="milestone__num">' + (done ? '🏆' : m.number) + '</span>' +
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
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Milestones · ' + reached.length + ' reached</h3>' +
          (reached.length ? reached.map(function (m) { return milestoneRow(m, true); }).join('') : '<p class="hint">None yet. Your first open mic is a good start.</p>') +
          '<h4 class="show__sub">Coming up</h4>' +
          ahead.map(function (m) { return milestoneRow(m, false); }).join('') +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Lifetime</h3>' +
          '<dl class="rows">' +
            '<dt>Started</dt><dd>' + Game.rules.day.longDate(0) + '</dd>' +
            '<dt>Days played</dt><dd>' + state.day + '</dd>' +
            '<dt>Weeks played</dt><dd>' + Math.floor(state.day / Game.balance.time.daysPerWeek) + '</dd>' +
            '<dt>Gigs played</dt><dd>' + st.gigsPlayed + ' (' + st.openMicsPlayed + ' open mics, ' + st.paidShows + ' paid shows)</dd>' +
            '<dt>Best result</dt><dd>' + (st.bestResult ? st.bestResult.charAt(0).toUpperCase() + st.bestResult.slice(1) : '-') + '</dd>' +
            '<dt>Biggest crowd</dt><dd>' + st.biggestCrowd + '</dd>' +
            '<dt>Earned from music</dt><dd>' + h.money(st.totalEarned) + '</dd>' +
            '<dt>Original songs</dt><dd>' + Game.rules.songs.playable(state).filter(function (x) { return !x.isCover; }).length + '</dd>' +
            '<dt>Reputation</dt><dd>' + Game.util.round1(state.player.reputation) + '</dd>' +
          '</dl>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('career'); },
      focusPayBack: function () { app.goBack('career'); }
    });
  }
};
