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
            '<thead><tr><th>Title</th><th>Type</th><th>Stars</th><th class="num">Quality</th><th>Tightness</th><th>Last played</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<p class="hint">Tightness is how well you know a song. Practice adds +' + b.tightness.practiceGain +
            '. Songs unplayed for ' + fadeDays + ' days lose ' + (-b.tightness.decayPerWeek) + ' a week (never below ' + b.tightness.floor + ').</p>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      back: function () { app.closeSongs(); },
      focusPayBack: function () { app.closeSongs(); }
    });
  }
};
