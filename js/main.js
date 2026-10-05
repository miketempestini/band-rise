// main.js
// Starts the game and keeps track of which screen is showing.
//
// This is the only place that holds the current game state. When the player does something,
// a screen asks Game.app to run a rule; Game.app swaps in the new state, saves, and redraws.

window.Game = window.Game || {};

Game.app = {
  state: null,          // the current game, or null on the title screen before one is loaded
  screen: 'title',      // which screen is showing (a name from Game.ui)
  notice: null,         // a message to show on the title or settings screen: { kind: 'error' | 'info', text }
  payBackMessage: null, // result of the last Pay back attempt, shown in the debt panel
  pickerBlock: null,    // which block the action picker is open for ('morning' etc.), or null when closed
  pickerDay: null,      // which day the picker is planning (null = today; a later day from the Calendar)
  pickerSongStep: null, // an action id (like 'practice') while the picker asks which song, else null
  pickerSet: [],        // songs ticked so far when picking a set (open mic)
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
  openMicDraft: null,   // an out-of-town open mic sign-up being set up: { venueId, day, jobChoice }
  setlistDraft: null,   // songs ticked while editing a booked show's setlist
  skipResult: null,     // what "Skip to next commitment" did, for the skip summary screen
  studioDraft: null,    // a studio booking being set up: { studio, day, sessions: { block: songId }, jobChoice }
  releaseDraft: { type: 'single', songIds: [] }, // a release being put together on the Songs screen
  contractId: null,     // the residency offer being reviewed
  contractTerms: null,  // the terms you're editing on the contract screen: { weekday, rate, weeks }
  planWeekStart: null,  // the Monday of the week shown on the Plan week screen
  calendarPage: 0,      // which 4 weeks the Calendar shows (0 = from this week; up to 2 with a manager)
  tourDraft: null,      // a tour request being set up on the Manager screen: { cities, tier, earliestDay }
  tourAds: {},          // ads picked on a tour proposal in the Inbox: { messageId: { cityId: packageId } }
  planWeekPicks: {},    // Plan week choices not applied yet: { dayOfWeek: actionId | 'clear' }
  templateNameDraft: '', // the name typed for a new week template
  bandNameDraft: '',       // the band name shown in the name box on the Name your band screen
  pendingWeekSummary: false, // true when the weekly summary should follow the Day results screen
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

  // ----- Player actions -----

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

  // Opens the action picker for one of today's blocks.
  // day: optional, to plan a later day from the Calendar.
  openPicker: function (block, day) {
    Game.app.pickerBlock = block;
    Game.app.pickerDay = day === undefined || day === Game.app.state.day ? null : day;
    Game.app.render();
  },

  // The state as the picker should see it: today, or the later day being planned.
  pickerView: function () {
    var app = Game.app;
    return app.pickerDay === null ? app.state : Game.rules.actions.viewForDay(app.state, app.pickerDay);
  },

  closePicker: function () {
    Game.app.pickerBlock = null;
    Game.app.pickerDay = null;
    Game.app.pickerSongStep = null;
    document.onkeydown = null;
    Game.app.render();
  },

  // An action was clicked in the picker. Actions that need a song (or a set) open the song step first.
  pickAction: function (actionId) {
    var app = Game.app;
    var action = Game.content.actions[actionId];
    if (action.needsBooking) {
      // Emailing a venue is set up on the Booking screen (venue, date, deal, then the block).
      app.pickerBlock = null;
      app.pickerSongStep = null;
      document.onkeydown = null;
      app.navigate('booking');
      return;
    }
    if (action.needsCities) {
      // Big campaign: pick up to 3 cities (your biggest ones are ticked to start).
      app.pickerSet = Game.rules.actions.campaignCities(app.pickerView()).slice(0, action.needsCities);
      app.pickerSongStep = actionId;
      app.render();
      return;
    }
    if (action.setSize || action.songsMax) {
      // Start from the songs already planned in this block, or the suggested ones.
      var entry = Game.rules.actions.plannedEntry(app.pickerView(), app.pickerBlock);
      app.pickerSet = entry && entry.actionId === actionId && entry.songIds
        ? entry.songIds.slice()
        : (action.setSize ? Game.rules.gigs.suggestSet(app.state, action.setSize) : Game.rules.actions.loosestSongs(app.state, action.songsMax));
      app.pickerSongStep = actionId;
      app.render();
    } else if (action.needsSong || action.needsPerson ||
               (action.optionalCoWriter && app.pickerView().band.memberIds.length)) {
      app.pickerSongStep = actionId;
      app.render();
    } else {
      app.planAction(actionId);
    }
  },

  // Changes which songs the Practice list shows.
  setPracticeFilter: function (filter) {
    Game.app.practiceFilter = filter;
    Game.app.render();
  },

  // Changes how the Practice song list is sorted.
  setPracticeSort: function (sortBy) {
    Game.app.practiceSort = sortBy;
    Game.app.render();
  },

  // Ticks or unticks a song while picking a set. If the set is already full,
  // ticking another song swaps out the one picked earliest.
  toggleSetSong: function (songId) {
    var app = Game.app;
    var stepAction = Game.content.actions[app.pickerSongStep];
    var size = stepAction.setSize || stepAction.songsMax || stepAction.needsCities;
    var i = app.pickerSet.indexOf(songId);
    if (i !== -1) {
      app.pickerSet.splice(i, 1);
    } else {
      if (app.pickerSet.length >= size) app.pickerSet.shift();
      app.pickerSet.push(songId);
    }
    app.render();
  },

  // From the song step back to the list of actions.
  pickerShowActions: function () {
    Game.app.pickerSongStep = null;
    Game.app.render();
  },

  // Plans an action in the open block (or clears it back to Free time when actionId is null).
  // songId: the song picked for actions that need one.
  planAction: function (actionId, songId) {
    var app = Game.app;
    var result = actionId
      ? Game.rules.actions.plan(app.state, app.pickerBlock, actionId, songId, app.pickerDay)
      : Game.rules.actions.clear(app.state, app.pickerBlock, app.pickerDay);
    app.notice = result.log.length && result.state === app.state ? { kind: 'error', text: result.log.join(' ') } : null;
    app.pickerBlock = null;
    app.pickerDay = null;
    app.pickerSongStep = null;
    document.onkeydown = null;
    app.applyRule(result);
  },

  // ----- Moving between screens with the tabs -----

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

  // ----- Booking, inbox, and the calendar -----

  // On the Booking screen: choose a venue and deal (or null to start over).
  bookingPick: function (venueId, deal) {
    var app = Game.app;
    app.bookingDraft = venueId ? { venueId: venueId, deal: deal, gigDay: null } : null;
    app.notice = null;
    app.render();
  },

  bookingDate: function (day) {
    Game.app.bookingDraft.gigDay = day;
    Game.app.render();
  },

  // ----- Studio time (on the Book screen) -----

  studioPick: function (studio) {
    var app = Game.app;
    app.studioDraft = studio ? { studio: studio, day: null, sessions: {}, jobChoice: null } : null;
    app.notice = null;
    app.render();
  },

  studioDate: function (day) {
    Game.app.studioDraft.day = day;
    Game.app.studioDraft.sessions = {};
    Game.app.studioDraft.jobChoice = null;
    Game.app.render();
  },

  studioSong: function (block, songId) {
    var draft = Game.app.studioDraft;
    if (songId) draft.sessions[block] = songId;
    else delete draft.sessions[block];
    Game.app.render();
  },

  studioJobChoice: function (kind) {
    Game.app.studioDraft.jobChoice = kind;
    Game.app.render();
  },

  // Plans "Book studio time" in a block today with the chosen studio, day, and songs.
  sendStudioBooking: function (block) {
    var app = Game.app;
    var d = app.studioDraft;
    var sessions = Object.keys(d.sessions).map(function (b) { return { block: b, songId: d.sessions[b] }; });
    var request = { studio: d.studio, day: d.day, sessions: sessions, jobChoice: d.jobChoice };
    var result = Game.rules.actions.plan(app.state, block, 'bookStudio', request);
    if (result.log.length) {
      app.notice = { kind: 'error', text: result.log.join(' ') };
      app.render();
      return;
    }
    app.studioDraft = null;
    app.notice = { kind: 'info', text: 'Studio booking planned for this ' + Game.content.calendar.blockNames[block].toLowerCase() +
      '. The sessions go on your Calendar when you end the day.' };
    app.applyRule(result);
  },

  // ----- The Shop and releases -----

  buyItem: function (itemId) {
    var app = Game.app;
    var result = Game.rules.merch.buy(app.state, itemId);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  releaseMusic: function (type, songIds) {
    var app = Game.app;
    var result = Game.rules.recording.release(app.state, type, songIds);
    var ok = result.state !== app.state;
    app.notice = { kind: ok ? 'info' : 'error', text: result.log.join(' ') };
    if (ok) {
      app.releaseDraft = { type: 'single', songIds: [] };
      app.state = Game.rules.progress.checkUnlocks(result.state).state; // First release milestone
      app.autoSave();
      app.render();
    } else {
      app.render();
    }
  },

  // Emails the chosen venue right now (no block needed; it costs a little energy).
  sendBookingEmail: function () {
    var app = Game.app;
    var d = app.bookingDraft;
    var result = Game.rules.booking.emailVenue(app.state, d.venueId, d.gigDay, d.deal);
    var sent = result.state !== app.state;
    if (sent) app.bookingDraft = null;
    app.notice = { kind: sent ? 'info' : 'error', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // The Book screen's city tabs (and the Map's "Book here").
  bookingCitySelect: function (cityId) {
    var app = Game.app;
    app.bookingCity = cityId;
    app.bookingDraft = null;
    app.openMicDraft = null;
    app.notice = null;
    if (app.screen === 'booking') app.render();
    else app.navigate('booking');
  },

  // Out-of-town open mics: pick the night (and how to take work off), then sign up.
  openMicPick: function (venueId, day) {
    Game.app.openMicDraft = venueId ? { venueId: venueId, day: day, jobChoice: null } : null;
    Game.app.notice = null;
    Game.app.render();
  },

  openMicJobChoice: function (kind) {
    Game.app.openMicDraft.jobChoice = kind;
    Game.app.render();
  },

  signUpOpenMic: function () {
    var app = Game.app;
    var d = app.openMicDraft;
    var result = Game.rules.travel.signUpOpenMic(app.state, d.venueId, d.day, d.jobChoice);
    var ok = result.state !== app.state;
    if (ok) app.openMicDraft = null;
    app.notice = { kind: ok ? 'info' : 'error', text: result.log.join(' ') };
    app.applyRule(result);
  },

  acceptOffer: function (messageId, jobChoice) {
    var app = Game.app;
    var result = Game.rules.booking.acceptOffer(app.state, messageId, jobChoice);
    app.notice = { kind: result.entryId ? 'info' : 'error', text: result.log.join(' ') +
      (result.entryId ? ' A setlist was picked for you; change it on the Calendar.' : '') };
    app.applyRule(result);
  },

  // ----- Opening slots and residency contracts -----

  acceptOpening: function (messageId) {
    var app = Game.app;
    var result = Game.rules.offers.acceptOpening(app.state, messageId);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  openContract: function (messageId) {
    var app = Game.app;
    var m = app.state.inbox.filter(function (x) { return x.id === messageId; })[0];
    app.contractId = messageId;
    app.contractTerms = { weekday: m.data.weekday, rate: m.data.rate, weeks: m.data.weeks };
    app.show('contract');
  },

  contractSet: function (field, value) {
    Game.app.contractTerms[field] = value;
    Game.app.render();
  },

  signContract: function () {
    var app = Game.app;
    var m = app.state.inbox.filter(function (x) { return x.id === app.contractId; })[0];
    var result = Game.rules.offers.signResidency(app.state, app.contractId, { weekday: m.data.weekday, rate: m.data.rate, weeks: m.data.weeks });
    if (result.state === app.state) { app.notice = { kind: 'error', text: result.log.join(' ') }; app.render(); return; }
    app.state = result.state;
    app.autoSave();
    app.show('calendar');
    app.notice = { kind: 'info', text: 'Signed! ' + result.log.join(' ') };
    app.render();
  },

  proposeContract: function () {
    var app = Game.app;
    var result = Game.rules.offers.counterResidency(app.state, app.contractId, app.contractTerms);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  declineOffer: function (messageId) {
    Game.app.notice = null;
    Game.app.applyRule(Game.rules.booking.declineOffer(Game.app.state, messageId));
  },

  // From the Calendar: remove a planned task from a block on a day.
  calendarClear: function (day, block) {
    var app = Game.app;
    var result = Game.rules.actions.clear(app.state, block, day);
    app.notice = null;
    app.applyRule(result);
  },

  calendarSelect: function (day) {
    Game.app.calendarDay = day;
    Game.app.setlistDraft = null;
    Game.app.notice = null;
    Game.app.render();
  },

  calendarDayOff: function (day, kind) {
    var app = Game.app;
    var result = Game.rules.job.takeDayOff(app.state, day, kind);
    app.notice = result.log.length ? { kind: 'error', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  calendarUndoDayOff: function (day) {
    var result = Game.rules.job.undoDayOff(Game.app.state, day);
    Game.app.notice = result.log.length ? { kind: result.state === Game.app.state ? 'error' : 'info', text: result.log.join(' ') } : null;
    Game.app.applyRule(result);
  },

  editSetlist: function (entryId) {
    Game.app.setlistDraft = { entryId: entryId, songIds: Game.app.state.entries[entryId].songIds.slice() };
    Game.app.setlistError = null;
    Game.app.render();
  },

  toggleSetlistSong: function (songId) {
    var draft = Game.app.setlistDraft;
    var i = draft.songIds.indexOf(songId);
    if (i === -1) draft.songIds.push(songId);
    else draft.songIds.splice(i, 1);
    Game.app.render();
  },

  saveSetlist: function () {
    var app = Game.app;
    var result = Game.rules.booking.setSetlist(app.state, app.setlistDraft.entryId, app.setlistDraft.songIds);
    if (result.log.length) {
      app.setlistError = result.log.join(' ');
      app.render();
      return;
    }
    app.setlistDraft = null;
    app.setlistError = null;
    app.applyRule(result);
  },

  changeSessionPlayers: function (entryId, change) {
    var app = Game.app;
    var result = Game.rules.booking.changeSessionPlayers(app.state, entryId, change);
    app.notice = result.log.length ? { kind: 'error', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  cancelShow: function (entryId) {
    var app = Game.app;
    var e = app.state.entries[entryId];
    var penalty = Game.rules.booking.cancelPenalty(e.day - app.state.day);
    var msg = 'Cancel the show at ' + Game.content.venues[e.venueId].name + '? The venue loses ' + (-penalty.venueRelationship) +
      ' relationship' + (penalty.reputation ? ', you lose ' + (-penalty.reputation) + ' reputation' : '') +
      (penalty.bandSatisfaction ? ', and your bandmates lose ' + (-penalty.bandSatisfaction) + ' satisfaction' : '') + '.';
    if (!window.confirm(msg)) return;
    var result = Game.rules.booking.cancelShow(app.state, entryId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  cancelStudio: function (entryId) {
    var app = Game.app;
    if (!window.confirm('Cancel this studio session? It\'s free: studios only charge when you record.')) return;
    var result = Game.rules.recording.cancelSession(app.state, entryId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  cancelSessionWork: function (workId) {
    var app = Game.app;
    var work = app.state.sessionWork[workId];
    if (!window.confirm('Cancel the rest of your sessions with ' + work.bandName + '? You lose the pay for them and the streaming share.')) return;
    var result = Game.rules.sessionWork.cancel(app.state, workId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  acceptSessionWork: function (messageId) {
    var app = Game.app;
    var result = Game.rules.sessionWork.accept(app.state, messageId);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // ----- The day job (Phase 10) -----

  // Opens the Job screen (from the Stats panel or the Calendar).
  openJob: function () {
    Game.app.navigate('job');
  },

  goPartTime: function () {
    var app = Game.app;
    var result = Game.rules.job.goPartTime(app.state);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // From the quit confirm screen: quits (the job ends next Monday), then back to the Job screen.
  quitJob: function () {
    var app = Game.app;
    var result = Game.rules.job.quit(app.state);
    app.show('job');
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  cancelJobChange: function () {
    var app = Game.app;
    var result = Game.rules.job.cancelPending(app.state);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // ----- The big time (Phase 12): manager, tours, label, arenas and festivals -----

  // Uses a rule's result and shows its message (as an error if nothing changed).
  applyWithNotice: function (result) {
    var app = Game.app;
    app.notice = result.log.length ? { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  openManager: function () { Game.app.navigate('manager'); },
  hireManager: function (messageId) { Game.app.applyWithNotice(Game.rules.manager.hire(Game.app.state, messageId)); },
  letGoManager: function () {
    if (!window.confirm('Let your manager go? You lose auto-booking, tours, the press push, and the 12-week calendar (shows already booked stay).')) return;
    Game.app.applyWithNotice(Game.rules.manager.letGo(Game.app.state));
  },
  saveManagerRules: function (rules) { Game.app.applyWithNotice(Game.rules.manager.setRules(Game.app.state, rules)); },

  // The tour request form on the Manager screen.
  tourDraftSet: function (field, value) {
    var app = Game.app;
    app.tourDraft = app.tourDraft || { cities: [], tier: 2, earliestDay: null };
    if (field === 'city') {
      var i = app.tourDraft.cities.indexOf(value);
      if (i === -1) app.tourDraft.cities.push(value); else app.tourDraft.cities.splice(i, 1);
    } else {
      app.tourDraft[field] = value;
    }
    app.render();
  },
  requestTour: function () {
    var app = Game.app;
    var result = Game.rules.manager.requestTour(app.state, app.tourDraft || { cities: [] });
    if (result.state !== app.state) app.tourDraft = null;
    app.applyWithNotice(result);
  },
  acceptTour: function (messageId, jobChoice) {
    Game.app.applyWithNotice(Game.rules.manager.acceptTour(Game.app.state, messageId, jobChoice, Game.app.tourAds[messageId] || {}));
  },
  // An ad package picked (or cleared) for one city on a tour proposal.
  tourAdPick: function (messageId, cityId, packageId) {
    var ads = Game.app.tourAds[messageId] = Game.app.tourAds[messageId] || {};
    if (packageId) ads[cityId] = packageId; else delete ads[cityId];
    Game.app.render();
  },
  signLabel: function (messageId) { Game.app.applyWithNotice(Game.rules.label.sign(Game.app.state, messageId)); },
  acceptBigShow: function (messageId, jobChoice) { Game.app.applyWithNotice(Game.rules.bigShows.accept(Game.app.state, messageId, jobChoice)); },

  // ----- Housing (Phase 13) -----

  moveHome: function (homeId) {
    var app = Game.app;
    var cost = Game.rules.housing.moveCost(homeId);
    if (!window.confirm('Move into the ' + Game.balance.housing[homeId].name.toLowerCase() + '? Moving costs ' + Game.ui.helpers.money(cost) +
      ' now, and your weekly bills become ' + Game.ui.helpers.money(Game.balance.housing[homeId].weeklyCost + (app.state.player.vacationHome ? Game.balance.housing.vacation.weeklyCost : 0)) + '.')) return;
    app.applyWithNotice(Game.rules.housing.move(app.state, homeId));
  },
  buyVacationHome: function () { Game.app.applyWithNotice(Game.rules.housing.buyVacationHome(Game.app.state)); },
  sellVacationHome: function () {
    if (!window.confirm('Sell the vacation home? Its weekly cost stops, and you get nothing back.')) return;
    Game.app.applyWithNotice(Game.rules.housing.sellVacationHome(Game.app.state));
  },

  // ----- Plan week -----

  openPlanWeek: function () {
    var app = Game.app;
    app.planWeekStart = Game.rules.planWeek.weekStart(app.state.day);
    app.planWeekPicks = {};
    app.show('planWeek');
  },

  planWeekSelect: function (weekStart) {
    Game.app.planWeekStart = weekStart;
    Game.app.planWeekPicks = {};
    Game.app.notice = null;
    Game.app.render();
  },

  // A task picked for one evening in the Plan week list (not applied until "Apply to all 7 evenings").
  planWeekPick: function (dayOfWeek, value) {
    var picks = Game.app.planWeekPicks;
    if (value) picks[dayOfWeek] = value;
    else delete picks[dayOfWeek];
    Game.app.render();
  },

  // Shows what a Plan week rule did: the evenings it couldn't set, or a short "done".
  planWeekResult: function (result, doneText) {
    var app = Game.app;
    app.notice = result.log.length
      ? { kind: 'error', text: 'Some evenings weren\'t set. ' + result.log.join(' ') }
      : { kind: 'info', text: doneText };
    app.applyRule(result);
  },

  applyPlanWeek: function (weekStart) {
    var app = Game.app;
    var result = Game.rules.planWeek.applyWeek(app.state, weekStart, app.planWeekPicks);
    app.planWeekPicks = {};
    app.planWeekResult(result, 'Evenings planned.');
  },

  saveWeekTemplate: function (weekStart) {
    var app = Game.app;
    var result = Game.rules.planWeek.saveTemplate(app.state, app.templateNameDraft, weekStart);
    var failed = result.state === app.state;
    if (!failed) app.templateNameDraft = '';
    app.notice = { kind: failed ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  applyWeekTemplate: function (templateId, weekStart) {
    Game.app.planWeekResult(Game.rules.planWeek.applyTemplate(Game.app.state, templateId, weekStart), 'Template applied.');
  },

  deleteWeekTemplate: function (templateId) {
    Game.app.notice = null;
    Game.app.applyRule(Game.rules.planWeek.deleteTemplate(Game.app.state, templateId));
  },

  dismissToast: function (toastId) {
    Game.app.applyRule(Game.rules.progress.dismissToast(Game.app.state, toastId));
  },

  // ----- Songs -----

  openSongs: function () {
    Game.app.navigate('songs');
  },

  closeSongs: function () {
    Game.app.goBack('songs');
  },

  // ----- People and the band -----

  openPeople: function () {
    Game.app.navigate('people');
  },

  closePeople: function () {
    Game.app.goBack('people');
  },

  // Invites a contact. The first member starts the band, so the player names it next.
  invitePerson: function (personId) {
    var app = Game.app;
    var problem = Game.rules.people.inviteProblem(app.state, personId);
    if (problem) {
      app.notice = { kind: 'error', text: problem };
      app.render();
      return;
    }
    var result = Game.rules.people.invite(app.state, personId);
    app.state = Game.rules.progress.checkUnlocks(result.state).state; // First bandmate milestone
    app.autoSave();
    if (result.firstMember) {
      var suggested = Game.rules.people.suggestBandName(app.state);
      app.state = suggested.state;
      app.bandNameDraft = suggested.name;
      app.show('nameBand');
    } else {
      app.notice = { kind: 'info', text: result.log.join(' ') };
      app.render();
    }
  },

  removePerson: function (personId) {
    var app = Game.app;
    var person = app.state.people[personId];
    if (!window.confirm('Remove ' + person.name + ' from the band? Everyone else loses some satisfaction, and you lose some morale.')) return;
    var result = Game.rules.people.remove(app.state, personId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  suggestBandName: function () {
    var app = Game.app;
    var suggested = Game.rules.people.suggestBandName(app.state);
    app.state = suggested.state;
    app.bandNameDraft = suggested.name;
    app.revealError = null;
    app.autoSave();
    app.render();
  },

  saveBandName: function (name) {
    var app = Game.app;
    var result = Game.rules.people.nameBand(app.state, name);
    if (result.log.length) {
      app.revealError = result.log.join(' ');
      app.bandNameDraft = name;
      app.render();
      return;
    }
    app.state = result.state;
    app.autoSave();
    app.notice = { kind: 'info', text: 'Welcome to ' + app.state.band.name + '. Rehearse is unlocked: plan it from a free block.' };
    app.screen = 'people';
    app.revealError = null;
    app.render();
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
        app.show('gigResult'); // the gig comes first, then any song reveal, then Day results
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

  // After the gig (or right after End Day if there was none): song reveals, then Day results.
  afterGigResult: function () {
    var app = Game.app;
    var finished = app.state.lastDayReport.finishedSongs || [];
    if (finished.length) app.startReveals(finished, 'dayResults');
    else app.show('dayResults');
  },

  // Leaves the Day results screen: on to the weekly summary on Sunday night, otherwise back to Today.
  leaveDayResults: function () {
    var app = Game.app;
    var next = app.pendingWeekSummary ? 'weeklySummary' : 'today';
    app.pendingWeekSummary = false;
    app.show(next);
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

  // ----- Time savers, events, and tips on Today -----

  // "Skip to next commitment": ends quiet days until something needs you, then shows what happened.
  skipAhead: function () {
    var app = Game.app;
    var problem = Game.rules.day.skipProblem(app.state);
    if (problem) { app.notice = { kind: 'error', text: problem }; app.render(); return; }
    var result = Game.rules.day.skipToNextCommitment(app.state);
    app.skipResult = result;
    app.state = result.state;
    if (app.state.gameOver) { app.afterDayChange(result.last, true); return; }
    app.autoSave();
    app.show('skipSummary');
  },

  // From the skip summary: on to the last day's usual screens (gig result, reveals, Day results, summary).
  leaveSkipSummary: function () {
    var app = Game.app;
    var last = app.skipResult.last;
    app.skipResult = null;
    app.afterDayChange(last, true);
  },

  repeatEvening: function () {
    var app = Game.app;
    var result = Game.rules.actions.repeatEvening(app.state);
    app.notice = result.log.length ? { kind: 'error', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  answerEvent: function (choiceId) {
    var app = Game.app;
    var result = Game.rules.events.resolve(app.state, choiceId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.state = Game.rules.progress.checkUnlocks(result.state).state;
    app.autoSave();
    app.render();
  },

  dismissTip: function (cardId) {
    Game.app.applyRule(Game.rules.progress.dismissTip(Game.app.state, cardId));
  },

  setTutorial: function (on) {
    Game.app.applyRule(Game.rules.progress.setTutorial(Game.app.state, on));
  },

  payBack: function (amount) {
    var result = Game.rules.money.payBack(Game.app.state, amount);
    Game.app.payBackMessage = result.log.join(' ');
    Game.app.applyRule(result);
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
};

Game.app.start();
