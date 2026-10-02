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

  newCareer: function (name, instrument) {
    if (Game.save.hasBrowserSave() &&
        !window.confirm('Starting a new career will replace your saved game. Continue?')) {
      return;
    }
    Game.app.state = Game.rules.career.startCareer(name, instrument).state;
    Game.app.autoSave();
    Game.app.show('today');
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

  endDay: function () {
    Game.app.afterDayChange(Game.rules.day.endDay(Game.app.state));
  },

  // After one or more days pass: handle game over, otherwise save and show the right screen.
  afterDayChange: function (result) {
    var app = Game.app;
    app.state = result.state;
    if (app.state.gameOver) {
      Game.save.clearBrowserSave(); // a finished career can't be continued
      app.show('gameOver');
      return;
    }
    app.autoSave();
    app.show(result.weekEnded ? 'weeklySummary' : 'today');
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
