// save.js
// Saving and loading the game.
//
// The whole game is one plain object (the state). Saving turns it into text (JSON) and stores it,
// either in the browser's localStorage (auto-save) or in a downloaded .json file (export).
// Loading turns the text back into the state, after checking that it really is a Band Rise save.
// Nothing here ever crashes the game: every problem comes back as a friendly message instead.

window.Game = window.Game || {};

Game.save = {

  // Turns the state into text for storing.
  serialize: function (state) {
    return JSON.stringify(state);
  },

  // Turns saved text back into a state.
  // Returns { ok: true, state } or { ok: false, message } with a message for the player.
  parse: function (text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return { ok: false, message: "That file doesn't look like a Band Rise save. It may be damaged." };
    }
    var problem = Game.save.validate(data);
    if (problem) return { ok: false, message: problem };
    return { ok: true, state: data };
  },

  // Checks that loaded data has the shape of a Band Rise save.
  // Returns null if it looks right, or a message explaining what's wrong.
  validate: function (data) {
    var notASave = "That file doesn't look like a Band Rise save.";
    if (!data || typeof data !== 'object' || Array.isArray(data)) return notASave;

    var currentVersion = Game.balance.save.version;
    if (typeof data.version !== 'number') return notASave;
    if (data.version > currentVersion) {
      return 'That save is from a newer version of Band Rise and can\'t be opened here.';
    }

    // Compare against a fresh state: every top-level and player field should be there.
    var fresh = Game.state.createNew(1);
    for (var key in fresh) {
      if (!(key in data)) return notASave + ' (missing "' + key + '")';
    }
    if (!data.player || typeof data.player !== 'object') return notASave;
    for (var pkey in fresh.player) {
      if (!(pkey in data.player)) return notASave + ' (missing "player.' + pkey + '")';
    }
    if (typeof data.day !== 'number' || typeof data.player.cash !== 'number') return notASave;

    return null;
  },

  // ----- Browser storage (auto-save) -----
  // key is optional. Tests pass their own key so they never touch the real save.

  // Stores the state in the browser. Returns { ok } or { ok: false, message }.
  writeToBrowser: function (state, key) {
    try {
      localStorage.setItem(key || Game.balance.save.storageKey, Game.save.serialize(state));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: "Couldn't save the game in this browser. Try Export save in Settings to keep a copy." };
    }
  },

  // Loads the state from the browser.
  // Returns { ok: true, state }, or { ok: false, empty: true } if there's no save,
  // or { ok: false, message } if the save is broken.
  readFromBrowser: function (key) {
    var text;
    try {
      text = localStorage.getItem(key || Game.balance.save.storageKey);
    } catch (error) {
      return { ok: false, message: "This browser won't let Band Rise read its save." };
    }
    if (text === null) return { ok: false, empty: true, message: 'No saved game found. Start a new career!' };

    var result = Game.save.parse(text);
    if (!result.ok) {
      result.message = 'Your saved game couldn\'t be loaded. It may be damaged. ' +
        'You can import a save file or start a new career.';
    }
    return result;
  },

  // True if there's something stored in the browser (even if it turns out to be broken).
  hasBrowserSave: function (key) {
    try {
      return localStorage.getItem(key || Game.balance.save.storageKey) !== null;
    } catch (error) {
      return false;
    }
  },

  // Deletes the browser save (used after a game over).
  clearBrowserSave: function (key) {
    try {
      localStorage.removeItem(key || Game.balance.save.storageKey);
    } catch (error) {
      // Nothing to do: if we can't reach storage, there's nothing to clear.
    }
  },

  // ----- Files (export and import) -----

  // A file name like "band-rise-week3.json".
  exportFileName: function (state) {
    return 'band-rise-week' + Game.rules.day.weekNumber(state.day) + '.json';
  },

  // Downloads the state as a .json file.
  downloadFile: function (state) {
    var blob = new Blob([Game.save.serialize(state)], { type: 'application/json' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = Game.save.exportFileName(state);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  // Reads a file the player picked and calls done(result) with { ok, state } or { ok: false, message }.
  readFile: function (file, done) {
    if (!file) {
      done({ ok: false, message: 'No file was picked.' });
      return;
    }
    var reader = new FileReader();
    reader.onload = function () { done(Game.save.parse(reader.result)); };
    reader.onerror = function () { done({ ok: false, message: "Couldn't read that file." }); };
    reader.readAsText(file);
  }
};
