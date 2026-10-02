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
    }
    app.screen = screen;
    app.render();
  },

  // Draws the current screen and the debug panel.
  render: function () {
    var app = Game.app;
    Game.ui[app.screen].render(document.getElementById('app'), app);
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
  openPicker: function (block) {
    Game.app.pickerBlock = block;
    Game.app.render();
  },

  closePicker: function () {
    Game.app.pickerBlock = null;
    document.onkeydown = null;
    Game.app.render();
  },

  // Plans an action in the open block (or clears it back to Free time when actionId is null).
  planAction: function (actionId) {
    var app = Game.app;
    var result = actionId
      ? Game.rules.actions.plan(app.state, app.pickerBlock, actionId)
      : Game.rules.actions.clear(app.state, app.pickerBlock);
    app.pickerBlock = null;
    document.onkeydown = null;
    app.applyRule(result);
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
      app.show('dayResults');
    } else {
      app.show(result.weekEnded ? 'weeklySummary' : 'today');
    }
  },

  // Leaves the Day results screen: on to the weekly summary on Sunday night, otherwise back to Today.
  leaveDayResults: function () {
    var app = Game.app;
    var next = app.pendingWeekSummary ? 'weeklySummary' : 'today';
    app.pendingWeekSummary = false;
    app.show(next);
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
