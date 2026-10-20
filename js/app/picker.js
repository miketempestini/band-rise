// app/picker.js
// The action picker: opening it for a block, picking an action, and the song, set, person, and city steps.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

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
  }
});
