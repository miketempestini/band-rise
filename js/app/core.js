// app/core.js
// Game.app, the part that holds the current game state and keeps track of which screen is showing: showing and
// drawing screens, moving between them, saving, starting or continuing a career, and what happens after End Day
// (gig result, song reveals, weekly summary). The other files in js/app/ add each screen's actions to Game.app.
//
// This is the only place that holds the current game state. When the player does something,
// a screen asks Game.app to run a rule; Game.app swaps in the new state, saves, and redraws.

window.Game = window.Game || {};

Game.app = Object.assign(Game.app || {}, {
  state: null,          // the current game, or null on the title screen before one is loaded
  screen: 'title',      // which screen is showing (a name from Game.ui)
  notice: null,         // a message to show on the title or settings screen: { kind: 'error' | 'info', text }
  payBackMessage: null, // result of the last Pay back attempt, shown in the debt panel
  pickerBlock: null,    // which block the action picker is open for ('morning' etc.), or null when closed
  pickerDay: null,      // which day the picker is planning (null = today; a later day from the Calendar)
  pickerSongStep: null, // an action id (like 'practice') while the picker asks which song, else null
  pickerSet: [],        // songs ticked so far when picking a set (open mic), in running order
  pickerEncore: null,   // the open mic's encore song (or null)
  practiceSort: 'tightLow', // how the Practice song list is sorted (remembered while the page is open)
  practiceFilter: 'all',    // which songs the Practice list shows: 'all', 'covers', or 'originals'
  gigPhase: 'meter',    // the gig result screen: 'meter' (crowd animation) then 'result'
  gigAnimation: null,   // the running crowd meter animation (so it can be stopped)
  revealQueue: [],      // ids of finished songs still waiting for their reveal screen
  revealThen: 'today',  // the screen to show after the last reveal
  revealError: null,    // a problem with the typed song name, shown on the reveal screen
  returnTo: {},         // for each tab screen, the screen its Back button returns to
  calendarDay: null,    // the day selected on the Calendar screen
  bookingDraft: null,   // the booking being set up: { venueId, gigDay, deal }
  bookingCity: 'hometown', // which city the Book screen shows
  tourBuild: null,         // the Tour Builder's draft (see js/app/tourBuilder.js)
  mapView: 'home',         // the Map screen's view: 'home' (the road map) or 'world' (the World map)
  openMicDraft: null,   // an out-of-town open mic sign-up being set up: { venueId, day, jobChoice }
  setlistDraft: null,   // songs ticked while editing a booked show's setlist
  skipResult: null,     // what "Skip to next commitment" did, for the skip summary screen
  studioDraft: null,    // a studio booking being set up: { studio, day, sessions: { block: songId }, jobChoice }
  releaseDraft: { type: 'single', songIds: [], name: '', promo: null }, // a release being put together in Music → Releases
  musicSection: 'writing', // which section of the Music tab is showing: 'writing', 'releases', or 'charts'
  releaseId: null,      // the release whose page is open
  contractId: null,     // the residency offer being reviewed
  contractTerms: null,  // the terms you're editing on the contract screen: { weekday, rate, weeks }
  planWeekStart: null,  // the Monday of the week shown on the Plan week screen
  titleIntroPlayed: false, // true once the title screen's intro has played (it plays once per page load)
  daySheetDay: null,    // the day Today's day sheet was last drawn for (it slides in once when a new day starts)
  financeDays: 7,        // which period the Finances screen shows (7, 30, or 90 days)
  calendarPage: 0,      // which 4 weeks the Calendar shows (0 = from this week; up to 2 with a manager)
  tourDraft: null,      // a tour request being set up on the Manager screen: { name, cities, tier, earliestDay }
  tourAds: {},          // ads picked on a tour proposal in the Inbox: { messageId: { cityId: packageId } }
  planWeekPicks: {},    // Plan week choices not applied yet: { dayOfWeek: actionId | 'clear' }
  templateNameDraft: '', // the name typed for a new week template
  bandNameDraft: '',       // the band name shown in the name box on the Name your band screen
  pendingWeekSummary: false, // true when the weekly summary should follow End Day (after any gig result and song reveals)
  dayReportOpen: false, // true while the full "previous day" readout is open over Today
  posterTourId: null,   // the tour whose poster pop-up is open, or null
  wrapUpTourId: null,   // the tour shown on the tour wrap-up screen
  wrapUpFrom: null,     // 'career' when the wrap-up was opened from the Career screen
  wrapUpShownDay: null, // the day whose tour wrap-up has already been shown (so it shows once)
  draftCareer: null,    // a career being set up: { name, instrument, allocation } (not saved until Start)
  debug: /[?&]debug\b/.test(window.location.search), // true when the address ends in ?debug

  // Runs once when the page loads.
  start: function () {
    Game.app.show('title');
  },

  // Switches to a screen and draws it.
  show: function (screen) {
    var app = Game.app;
    if (screen !== app.screen) {
      app.notice = null;
      app.payBackMessage = null;
      app.pickerBlock = null;
      app.pickerDay = null;
      app.pickerSongStep = null;
      app.revealError = null;
      app.dayReportOpen = false;
      app.posterTourId = null;
    }
    app.screen = screen;
    app.render();
  },

  // Draws the current screen and the debug panel.
  render: function () {
    var app = Game.app;
    var root = document.getElementById('app');
    Game.ui[app.screen].render(root, app);
    Game.ui.topbar.bind(root, app);
    Game.ui.debugPanel.render(document.getElementById('debug'), app);
  },

  // Saves the current game in the browser. Shows a message if that fails.
  autoSave: function () {
    var result = Game.save.writeToBrowser(Game.app.state);
    if (!result.ok) {
      window.alert(result.message);
    }
  },

  // Uses a rule's result as the new state, saves, and redraws the current screen.
  applyRule: function (result) {
    Game.app.state = result.state;
    Game.app.autoSave();
    Game.app.render();
  },


  // From the New career screen: remember the name and instrument, then go to the skills page.
  chooseSkills: function (name, instrument) {
    var app = Game.app;
    var draft = app.draftCareer || {};
    app.draftCareer = {
      name: name,
      instrument: instrument,
      allocation: draft.allocation || Game.rules.career.emptyAllocation()
    };
    app.show('chooseSkills');
  },

  // Changes the skills page's point spread (helpers and +/- buttons) and redraws.
  setAllocation: function (allocation) {
    Game.app.draftCareer.allocation = allocation;
    Game.app.render();
  },

  // From the skills page: start the career with the chosen name, instrument, and skill points.
  newCareer: function () {
    var app = Game.app;
    var draft = app.draftCareer;
    if (Game.save.hasBrowserSave() &&
        !window.confirm('Starting a new career will replace your saved game. Continue?')) {
      return;
    }
    app.state = Game.rules.career.startCareer(draft.name, draft.instrument, undefined, draft.allocation).state;
    app.draftCareer = null;
    app.autoSave();
    app.show('today');
  },

  continueGame: function () {
    var result = Game.save.readFromBrowser();
    if (!result.ok) {
      Game.app.notice = { kind: 'error', text: result.message };
      Game.app.render();
      return;
    }
    Game.app.state = result.state;
    Game.app.show(result.state.gameOver ? 'gameOver' : 'today');
  },


  // Goes to a screen from the tabs, remembering where you came from (for Back buttons).
  // Opening the Inbox marks its messages as read (after drawing them, so new ones still stand out).
  navigate: function (screen) {
    var app = Game.app;
    if (screen === app.screen) return;
    var resting = ['songReveal', 'nameBand', 'settings', screen];
    if (resting.indexOf(app.screen) === -1) app.returnTo[screen] = app.screen;
    if (screen === 'calendar') { app.calendarDay = app.state.day; app.calendarPage = 0; }
    if (screen === 'booking') { app.bookingDraft = null; app.studioDraft = null; app.openMicDraft = null; }
    app.show(screen);
    if (screen === 'inbox' && Game.rules.booking.unreadCount(app.state)) {
      app.state = Game.rules.booking.markAllRead(app.state).state;
      app.autoSave();
    }
  },

  // Back from a tab screen to wherever you came from (Today if unsure).
  goBack: function (screen) {
    var back = Game.app.returnTo[screen];
    Game.app.show(back && back !== screen ? back : 'today');
  },


  // Uses a rule's result and shows its message (as an error if nothing changed).
  applyWithNotice: function (result) {
    var app = Game.app;
    app.notice = result.log.length ? { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  // Shows the reveal screen for each finished song in turn, then goes to nextScreen.
  startReveals: function (songIds, nextScreen) {
    var app = Game.app;
    app.revealQueue = songIds.slice();
    app.revealThen = nextScreen;
    app.revealError = null;
    app.show('songReveal');
  },

  // On the reveal screen: roll another random title suggestion.
  suggestRevealTitle: function () {
    var app = Game.app;
    var suggested = Game.rules.songs.suggestTitle(app.state);
    var renamed = Game.rules.songs.rename(suggested.state, app.revealQueue[0], suggested.title);
    app.revealError = null;
    app.applyRule(renamed);
  },

  // On the reveal screen: keep the typed name, then show the next reveal (or move on).
  nameRevealedSong: function (title) {
    var app = Game.app;
    var result = Game.rules.songs.rename(app.state, app.revealQueue[0], title);
    if (result.log.length) {
      app.revealError = result.log.join(' ');
      app.render();
      return;
    }
    app.state = result.state;
    app.autoSave();
    app.revealQueue.shift();
    app.revealError = null;
    if (app.revealQueue.length) app.render();
    else app.show(app.revealThen);
  },

  // Debug: finish the song in progress right now and show its reveal.
  debugFinishSong: function () {
    var app = Game.app;
    var result = Game.rules.debug.finishSong(app.state);
    app.state = result.state;
    app.autoSave();
    app.startReveals([result.songId], app.screen === 'songReveal' ? 'today' : app.screen);
  },

  // Ends the day, then shows the Day results screen (and the weekly summary after it on Sundays).
  endDay: function () {
    Game.app.afterDayChange(Game.rules.day.endDay(Game.app.state), true);
  },

  // After one or more days pass: handle game over, otherwise save and show the right screen.
  // showResults: true to show the Day results screen first (the debug skip leaves it out).
  afterDayChange: function (result, showResults) {
    var app = Game.app;
    app.state = result.state;
    if (app.state.gameOver) {
      Game.save.clearBrowserSave(); // a finished career can't be continued
      app.show('gameOver');
      return;
    }
    app.autoSave();
    if (showResults) {
      app.pendingWeekSummary = result.weekEnded;
      if (app.state.lastDayReport.gig) {
        app.gigPhase = 'meter';
        app.show('gigResult'); // the gig comes first, then any song reveal, then back to Today (or the week's wrap-up)
      } else {
        app.afterGigResult();
      }
    } else {
      app.show(result.weekEnded ? 'weeklySummary' : 'today');
    }
  },

  // The crowd meter is done (or skipped): show the result.
  finishGigMeter: function () {
    var app = Game.app;
    app.gigAnimation = null;
    if (app.screen !== 'gigResult' || app.gigPhase !== 'meter') return;
    app.gigPhase = 'result';
    app.render();
  },

  // Leaving the gig result screen.
  leaveGigResult: function () {
    Game.app.gigAnimation = null;
    Game.app.afterGigResult();
  },

  // After the gig (or right after End Day if there was none): song reveals, then the weekly summary on Sunday
  // night, otherwise straight back to Today (the day's summary is in the "Previous day" box there).
  afterGigResult: function () {
    var app = Game.app;
    // A tour's last show today: its wrap-up comes first (once).
    var ended = app.state.lastDayReport.tourEnded;
    if (ended && app.wrapUpShownDay !== app.state.lastDayReport.day && Game.rules.tours.find(app.state, ended)) {
      app.openTourWrapUp(ended, null);
      return;
    }
    var next = app.pendingWeekSummary ? 'weeklySummary' : 'today';
    app.pendingWeekSummary = false;
    app.dayReportOpen = false;
    var finished = app.state.lastDayReport.finishedSongs || [];
    if (finished.length) app.startReveals(finished, next);
    else app.show(next);
  },

  // The full readout of the previous day, as a pop-up over Today.
  openDayReport: function () {
    Game.app.dayReportOpen = true;
    Game.app.render();
  },

  closeDayReport: function () {
    Game.app.dayReportOpen = false;
    document.onkeydown = null;
    Game.app.render();
  },

  // Leaving the weekly summary: after week 3, the one-time "Three weeks in" card; otherwise Today.
  leaveWeeklySummary: function () {
    var app = Game.app;
    app.show(Game.rules.progress.sliceDue(app.state) ? 'sliceEnd' : 'today');
  },

  // Leaving the "Three weeks in" card (it won't show again). to: 'today' or 'booking'.
  leaveSliceEnd: function (to) {
    var app = Game.app;
    app.state = Game.rules.progress.markSliceSeen(app.state).state;
    app.autoSave();
    app.show(to || 'today');
  },

  exportSave: function () {
    Game.save.downloadFile(Game.app.state);
    Game.app.notice = { kind: 'info', text: 'Save file downloaded: ' + Game.save.exportFileName(Game.app.state) };
    Game.app.render();
  },

  importFile: function (file) {
    Game.save.readFile(file, function (result) {
      var app = Game.app;
      if (!result.ok) {
        app.notice = { kind: 'error', text: result.message };
        app.render();
        return;
      }
      app.state = result.state;
      app.autoSave();
      app.show(app.state.gameOver ? 'gameOver' : 'today');
    });
  }
});
