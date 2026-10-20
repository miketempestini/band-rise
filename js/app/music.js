// app/music.js
// The Music tab: switching sections, opening a release's page, and putting out a release (with its name and promo).
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  // Writing, Releases, or Charts.
  setMusicSection: function (section) {
    Game.app.musicSection = section;
    Game.app.render();
  },

  // A release's page.
  openRelease: function (releaseId) {
    Game.app.releaseId = releaseId;
    Game.app.navigate('release');
  },

  // Back from a release's page to Music's Releases section.
  closeRelease: function () {
    Game.app.musicSection = 'releases';
    Game.app.show('songs');
  },

  // Releases what's on the release form (type, ticked songs, name, promo push).
  releaseMusic: function () {
    var app = Game.app;
    var d = app.releaseDraft;
    var result = Game.rules.recording.release(app.state, d.type, d.songIds, d.name, d.promo);
    var ok = result.state !== app.state;
    app.notice = { kind: ok ? 'info' : 'error', text: result.log.join(' ') };
    if (ok) {
      app.releaseDraft = { type: 'single', songIds: [], name: '', promo: null };
      app.state = Game.rules.progress.checkUnlocks(result.state).state; // First release milestone
      app.autoSave();
    }
    app.render();
  }
});
