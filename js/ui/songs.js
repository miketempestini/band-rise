// songs.js
// The Songs screen: your whole catalog at a glance.
// Each song shows its title, cover or original, stars, quality, tightness, and days since last played.
// The song in progress shows its progress bar on top.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.songs = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var b = Game.balance.songs;
    var state = app.state;
    var songs = Game.rules.songs.list(state);
    var writing = Game.rules.songs.inProgress(state);

    // The song in progress (or a nudge to start one).
    var progressPanel;
    if (writing) {
      var perBlock = Game.rules.songs.progressPerBlock(state.player.skills.songwriting);
      var blocksLeft = Math.ceil((b.progressToFinish - writing.progress) / perBlock);
      progressPanel = '<div class="panel">' +
        '<h3 class="panel__title">Writing now</h3>' +
        '<div class="writing">' +
          '<span class="writing__title">' + h.escape(writing.title) + '</span>' +
          '<span class="meter meter--big"><span class="meter__fill" style="width:' + Math.round(writing.progress) + '%"></span></span>' +
          '<span class="writing__numbers">' + Math.round(writing.progress) + ' / ' + b.progressToFinish +
            ' · about ' + blocksLeft + ' more Write block' + (blocksLeft === 1 ? '' : 's') +
            ' (+' + Game.util.round1(perBlock) + ' each)</span>' +
        '</div>' +
      '</div>';
    } else {
      progressPanel = '<div class="panel"><h3 class="panel__title">Writing now</h3>' +
        '<p class="hint">Nothing in progress. Plan a <strong>Write</strong> block to start a new original.</p></div>';
    }

    var fadeDays = b.tightness.decayAfterDays;
    var rows = songs.map(function (song) {
      var days = Game.rules.songs.daysSincePlayed(state, song);
      var fading = days >= fadeDays && song.tightness > b.tightness.floor;
      return '<tr>' +
        '<td class="song__title">' + h.escape(song.title) + '</td>' +
        '<td><span class="tag tag--' + (song.isCover ? 'cover' : 'original') + '">' + (song.isCover ? 'Cover' : 'Original') + '</span></td>' +
        '<td>' + h.stars(song.quality) + '</td>' +
        '<td class="num">' + song.quality + '</td>' +
        '<td class="song__tight">' +
          '<span class="meter meter--tight"><span class="meter__fill" style="width:' + Math.round(song.tightness) + '%"></span></span>' +
          '<span class="num">' + Math.round(song.tightness) + '</span>' +
        '</td>' +
        '<td class="' + (fading ? 'song__fading' : 'muted') + '">' + (days <= 0 ? 'Today' : days + (days === 1 ? ' day' : ' days')) +
          (fading ? ' · fading' : '') + '</td>' +
        '<td>' + Game.ui.songs.recordingCell(state, song) + '</td>' +
        '</tr>';
    }).join('');

    var originals = songs.filter(function (s) { return !s.isCover; }).length;

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Songs</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        progressPanel +
        '<div class="panel">' +
          '<h3 class="panel__title">Catalog: ' + originals + ' original' + (originals === 1 ? '' : 's') + ', ' +
            (songs.length - originals) + ' covers</h3>' +
          '<table class="song-table">' +
            '<thead><tr><th>Title</th><th>Type</th><th>Stars</th><th class="num">Quality</th><th>Tightness</th><th>Last played</th><th>Recording</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<p class="hint">Tightness is how well you know a song. Practice adds +' + b.tightness.practiceGain +
            '. Songs unplayed for ' + fadeDays + ' days lose ' + (-b.tightness.decayPerWeek) + ' a week (never below ' + b.tightness.floor + ').</p>' +
        '</div>' +
        Game.ui.songs.releasePanelHtml(state, app) +
        Game.ui.songs.releasesHtml(state) +
      '</section>';

    h.bind(root, {
      back: function () { app.closeSongs(); },
      focusPayBack: function () { app.closeSongs(); },
      releaseType: function (e, el) { app.releaseDraft = { type: el.getAttribute('data-type'), songIds: [] }; app.render(); },
      releaseToggle: function (e, el) {
        var ids = app.releaseDraft.songIds;
        var id = el.getAttribute('data-song');
        var i = ids.indexOf(id);
        if (i === -1) ids.push(id); else ids.splice(i, 1);
        app.render();
      },
      release: function () {
        var d = app.releaseDraft;
        var name = Game.content.releaseTypes[d.type].name;
        if (window.confirm('Release your ' + name + ' now? Released songs can\'t be released again.')) app.releaseMusic(d.type, d.songIds.slice());
      }
    });
  },

  // A song's recording: quality and where, and whether it's out.
  recordingCell: function (state, song) {
    if (song.isCover) return '<span class="muted">Cover</span>';
    if (!song.recording) return '<span class="muted">Not recorded</span>';
    var rel = song.releaseId && state.releases.filter(function (r) { return r.id === song.releaseId; })[0];
    return '<strong>' + song.recording.quality + '</strong> <span class="muted">' + Game.content.studios[song.recording.studio].name +
      '</span>' + (rel ? ' <span class="tag tag--original">' + Game.content.releaseTypes[rel.type].name + '</span>' : '');
  },

  // Put together a release: pick Single, EP, or Album, tick recorded songs, see what it would do, release.
  releasePanelHtml: function (state, app) {
    var h = Game.ui.helpers;
    var b = Game.balance.releases;
    var draft = app.releaseDraft;
    var ready = Game.rules.recording.releasable(state);
    var types = Object.keys(b.sizes).map(function (type) {
      var size = b.sizes[type];
      return '<button class="btn btn--small' + (draft.type === type ? ' btn--primary' : '') + '" data-action="releaseType" data-type="' + type + '">' +
        Game.content.releaseTypes[type].name + ' (' + (size.min === size.max ? size.min : size.min + '-' + size.max) + ')</button>';
    }).join('');
    if (!ready.length) {
      return '<div class="panel"><h3 class="panel__title">💿 Release music</h3>' +
        '<p class="hint">Record your originals first (Book → Studio time). Recorded songs you haven\'t released yet show up here.</p></div>';
    }
    var list = ready.map(function (s) {
      var on = draft.songIds.indexOf(s.id) !== -1;
      return '<button class="setlist-song' + (on ? ' setlist-song--on' : '') + '" data-action="releaseToggle" data-song="' + s.id + '">' +
        '<span class="check">' + (on ? '✓' : '') + '</span>' + h.escape(s.title) + '<span class="muted"> · recording quality ' + s.recording.quality + '</span></button>';
    }).join('');
    var problem = Game.rules.recording.releaseProblem(state, draft.type, draft.songIds);
    var preview = '';
    if (!problem) {
      var p = Game.rules.recording.releasePreview(state, draft.type, draft.songIds);
      var fans = Object.keys(p.fansPerCity).reduce(function (sum, id) { return sum + p.fansPerCity[id]; }, 0);
      preview = '<p class="hint">Average recording quality ' + Math.round(p.avgQuality) + ' · about ' +
        (fans ? Game.util.signed(p.buzz) + ' buzz' + (p.halved ? ' (halved: your last release was under 4 weeks ago)' : '') + ', +' + Math.round(fans) + ' fans' : 'no buzz or fans yet (you need fans first)') +
        ', ' + Game.util.signed(p.reputation) + ' reputation. Streaming pays from next Sunday.</p>';
    }
    return '<div class="panel"><h3 class="panel__title">💿 Release music</h3>' +
      '<div class="form-row__btns">' + types + '</div>' +
      '<div class="setlist-edit release-list">' + list + '</div>' +
      preview +
      '<div class="actions actions--left"><button class="btn btn--primary" data-action="release"' + (problem ? ' disabled title="' + h.escape(problem) + '"' : '') + '>' +
        'Release ' + Game.content.releaseTypes[draft.type].name + '</button>' +
        (problem && draft.songIds.length ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') + '</div>' +
      '</div>';
  },

  // Your releases so far, with this week's streaming estimate.
  releasesHtml: function (state) {
    var h = Game.ui.helpers;
    if (!state.releases.length) return '';
    var rows = state.releases.slice().reverse().map(function (r) {
      return '<li><strong>' + Game.content.releaseTypes[r.type].name + '</strong> · ' + h.dateLabel(r.day) + ' · ' +
        r.songIds.map(function (id) { return h.escape(state.songs[id].title); }).join(', ') +
        ' <span class="muted">(freshness ' + Math.round(Game.rules.recording.freshness(r, state.day + 7) * 100) + '%)</span></li>';
    }).join('');
    var sunday = Game.util.clone(state);
    sunday.day += Game.rules.day.daysUntilBills(state) || Game.balance.time.daysPerWeek;
    return '<div class="panel"><h3 class="panel__title">Your releases</h3><ul class="log">' + rows + '</ul>' +
      '<p class="hint">Streaming next Sunday: about ' + h.money(Game.rules.recording.streamingPay(sunday)) + ' (total fans × $0.02 × recording quality, fading 3% a week).</p></div>';
  }
};
