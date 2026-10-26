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
    if (data && typeof data === 'object' && typeof data.version === 'number' &&
        data.version < Game.balance.save.version) {
      data = Game.save.upgrade(data);
    }
    var problem = Game.save.validate(data);
    if (problem) return { ok: false, message: problem };
    return { ok: true, state: data };
  },

  // Brings a save from an older version up to date, so old saves keep working.
  // Anything the new version added gets filled in with its starting value from a fresh state.
  upgrade: function (data) {
    var fresh = Game.state.createNew(typeof data.seed === 'number' ? data.seed : 1);

    // Copies over any field the old save is missing, looking inside nested objects too.
    function fillMissing(target, source) {
      Object.keys(source).forEach(function (key) {
        var value = source[key];
        var isPlainObject = value && typeof value === 'object' && !Array.isArray(value);
        if (!(key in target)) {
          target[key] = Game.util.clone(value);
        } else if (isPlainObject && target[key] && typeof target[key] === 'object') {
          fillMissing(target[key], value);
        }
      });
    }

    var fromVersion = data.version;
    fillMissing(data, fresh);
    delete data.lastDayLog; // version 1 field, replaced by lastDayReport in version 2

    // Version 3 added songs: older careers get their starting covers.
    if (fromVersion < 3 && Object.keys(data.songs).length === 0) {
      data = Game.rules.songs.addStartingCovers(data).state;
    }

    // Version 11 turned "do you have a van" (true/false) into the van itself (or null).
    if (data.player.gear.van === false || data.player.gear.van === true) data.player.gear.van = null;

    // Version 16 gave every person a portrait, and version 18 matched faces to names: people from older saves get a
    // new face that suits their name, in the order you met them.
    if (fromVersion < 18) {
      var ids = Object.keys(data.people).sort(function (a, b) { return Number(a.slice(1)) - Number(b.slice(1)); });
      ids.forEach(function (id) { delete data.people[id].portrait; });
      ids.forEach(function (id) {
        data.people[id].portrait = Game.rules.people.portraitFor(data, Number(id.slice(1)), data.people[id].name.split(' ')[0]);
      });
    }

    // Version 19 counted streams and added the charts: releases get a name (their first track's) and records, and each
    // released song gets an estimate of its past streams. The charts fill in on the next Sunday.
    if (fromVersion < 19) {
      data.releases.forEach(function (rel) {
        if (!rel.name) rel.name = data.songs[rel.songIds[0]] ? data.songs[rel.songIds[0]].title : Game.content.releaseTypes[rel.type].name;
        if (rel.promo === undefined) rel.promo = null;
        if (!rel.records) rel.records = [];
        if (rel.chart === undefined) rel.chart = null;
        rel.songIds.forEach(function (id) {
          var song = data.songs[id];
          if (song && song.recording && !song.streams) song.streams = Game.rules.streaming.estimatePast(data, song, rel);
        });
      });
    }

    // Version 20 added the music scene (other bands, rivals, venue calendars): a fresh scene from the save's seed was
    // filled in above; now the rivals catch up to your level and the calendars fill.
    if (fromVersion < 20) Game.rules.scene.catchUp(data);

    // Version 21 went global: new National and International cities and venues (filled in above), the private jet
    // (gear.jet, filled in above), and local bands abroad, added to a scene that doesn't have them yet.
    if (fromVersion < 21) {
      var hasLocals = Object.keys(data.scene.bands).some(function (id) { return data.scene.bands[id].countryId; });
      if (!hasLocals) Game.rules.scene.addLocalBands(data.scene, data.seed);
    }

    // Version 22 counts National cities played on any tour (not only the manager's) toward opening the world. Older
    // saves get credit for the National cities on their finished tours, and any National city they've played (tours
    // you booked yourself weren't recorded before).
    if (fromVersion < 22) {
      var credit = data.stats.nationalTourCities;
      data.tours.forEach(function (t) {
        if (t.result) t.cities.forEach(function (c) { if (Game.content.cities[c].region === 'national') credit[c] = t.lastDay; });
      });
      Object.keys(data.stats.citiesPlayed).forEach(function (c) {
        if (data.stats.citiesPlayed[c] > 0 && Game.content.cities[c] && Game.content.cities[c].region === 'national' && credit[c] === undefined) credit[c] = data.day;
      });
    }

    // Version 24 rebuilt record labels. An older save signed with Northbound keeps its deal as it was (80% of streaming
    // pays back the rest of the advance, then it's all yours; nothing owed; free to leave), and keeps everything it
    // opened. The old fields go.
    if (fromVersion < 24) {
      var old = data.label;
      if (old.signed) {
        old.deal = Game.rules.label.legacyDeal(old);
        old.everSigned = true;
        old.nextDealId = 2;
        old.opened = { topStudio: true, national: true, bigShows: true };
      }
      ['signed', 'signedDay', 'advance', 'owed'].forEach(function (k) { delete old[k]; });
      // An old-style offer still open in the Inbox can't be signed anymore: it lapses (new labels will call).
      data.inbox.forEach(function (m) { if (m.kind === 'labelOffer' && !m.data.labelId && !m.resolved) { m.resolved = 'expired'; m.data.cooled = true; } });
    }

    // Version 26: a deal signed before then gets the label's mood (it starts warm), and nothing asked of you yet.
    // (Fan clubs and the Inbox archive fill in on their own: cities get club: false above.)
    if (fromVersion < 26 && data.label.deal && data.label.deal.mood === undefined) {
      data.label.deal.mood = Game.balance.label.mood.start;
      data.label.deal.ask = null;
      data.label.deal.nextPushBonus = 0;
    }

    // Cities you already qualify for open right away (new cities in an update shouldn't wait for the next End Day).
    data = Game.rules.travel.updateCityUnlocks(data).state;

    data.version = Game.balance.save.version;
    return data;
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
    var d = Game.rules.day.date(state.day);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'band-rise-' + d.year + '-' + pad(d.month + 1) + '-' + pad(d.date) + '.json';
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
