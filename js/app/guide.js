// app/guide.js
// Opening and paging through Walt's welcome handbook and the Guide. Nothing here changes the game: these only
// remember which page or section is open (on Game.app) and switch screens.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  handbookPage: 0,        // which page of the welcome handbook is showing
  handbookReturn: null,   // where the handbook goes when it closes: 'today' (a new career) or the screen that opened it
  guideSection: null,     // which Guide section is showing (null = the first)

  // Opens the welcome handbook at its first page. from: the screen to go back to when it closes.
  openHandbook: function (from) {
    var app = Game.app;
    app.handbookPage = 0;
    app.handbookReturn = from || 'today';
    app.show('handbook');
    window.scrollTo(0, 0);
  },

  // Turns to a page of the handbook.
  handbookGo: function (page) {
    Game.app.handbookPage = page;
    Game.app.render();
    window.scrollTo(0, 0);
  },

  // Finishes or skips the handbook: on to the first day (a new career) or back to the Guide or Settings.
  closeHandbook: function () {
    var app = Game.app;
    var back = app.handbookReturn || 'today';
    app.handbookReturn = null;
    app.show(back);
    window.scrollTo(0, 0);
  },

  // Opens the Guide (from Settings). Back returns to the screen that opened it.
  openGuide: function () {
    var app = Game.app;
    app.returnTo.guide = app.screen;
    app.show('guide');
    window.scrollTo(0, 0);
  },

  // Shows one Guide section, scrolled to its start (on a phone the contents list sits above it).
  guideGo: function (sectionId) {
    var app = Game.app;
    app.guideSection = sectionId;
    app.render();
    var article = document.getElementById('guide-section');
    var top = article ? article.getBoundingClientRect().top + window.pageYOffset : 0;
    var bar = document.querySelector('.mbar');
    var barHeight = bar && Game.ui.mobile.isPhone() ? bar.offsetHeight : 0;
    window.scrollTo(0, Game.ui.mobile.isPhone() ? Math.max(0, top - barHeight - Game.balance.ui.guideScrollGap) : 0);
  }
});
