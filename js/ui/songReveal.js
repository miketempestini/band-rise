// songReveal.js
// The short reveal moment when a song is finished: its stars, its quality, one line about
// what shaped it, and a name box (pre-filled with a random suggestion) to name it.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.songReveal = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var b = Game.balance.songs;
    var song = app.state.songs[app.revealQueue[0]];
    var stars = Game.rules.songs.stars(song.quality);

    root.innerHTML =
      '<section class="title-screen reveal">' +
        '<p class="reveal__kicker">You finished a song!</p>' +
        '<div class="reveal__stars">' + h.stars(song.quality) + '</div>' +
        '<p class="reveal__quality">Quality <strong>' + song.quality + '</strong> · ' + stars + ' star' + (stars === 1 ? '' : 's') + '</p>' +
        '<p class="reveal__why">' + h.escape(Game.ui.songReveal.whyLine(song)) + '</p>' +
        '<div class="panel reveal__name">' +
          '<label class="field">' +
            '<span class="field__label">Name your song</span>' +
            '<span class="reveal__name-row">' +
              '<input type="text" id="song-title" class="input" maxlength="' + b.titleMaxLength + '" value="' + h.escape(song.title) + '" autocomplete="off">' +
              '<button class="btn" data-action="suggest" title="Suggest another name">🎲 Another</button>' +
            '</span>' +
          '</label>' +
          '<p class="form-error" id="song-error">' + (app.revealError ? h.escape(app.revealError) : '') + '</p>' +
          '<div class="actions">' +
            '<button class="btn btn--primary btn--big" data-action="keep">Keep this name</button>' +
          '</div>' +
        '</div>' +
        '<p class="hint">+' + Game.balance.morale.change.finishSong + ' morale. It starts at tightness ' + b.tightness.newOriginal + ': practice it to tighten it up.</p>' +
      '</section>';

    var input = root.querySelector('#song-title');
    input.focus();
    input.select();
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') app.nameRevealedSong(input.value);
    });

    h.bind(root, {
      suggest: function () { app.suggestRevealTitle(); },
      keep: function () { app.nameRevealedSong(input.value); }
    });
  },

  // One line about what shaped the quality, like
  // "Base 15 + Songwriting 7.8 + luck 19 + good mood 5 = 47."
  whyLine: function (song) {
    var p = song.qualityParts;
    if (!p) return '';
    var r = Game.util.round1;
    var line = 'Base ' + p.base + ' + Songwriting ' + r(p.songwriting) + ' + luck ' + p.luck +
      (p.mood ? ' + good mood ' + p.mood : '') +
      (p.coWriter ? ' + co-writer ' + p.coWriterName + ' ' + r(p.coWriter) : '') + ' = ' + song.quality + '.';
    if (p.luck >= Game.balance.songs.luckyRoll) line += ' Lucky night!';
    else if (p.luck <= Game.balance.songs.unluckyRoll) line += ' Not much luck this time.';
    if (!p.mood) line += ' (Morale over ' + Game.balance.songs.qualityHighMoraleThreshold + ' adds +' + Game.balance.songs.qualityHighMoraleBonus + '.)';
    return line;
  }
};
