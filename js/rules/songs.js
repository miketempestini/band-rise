// songs.js
// Rules for the song catalog: starting covers, writing originals, quality and stars,
// practicing a song, naming songs, and tightness fading.
//
// A song looks like:
//   { id, title, isCover, progress, quality, tightness, lastPlayedDay,
//     startedDay, writtenDay, qualityParts, recording, releaseId }
// The song in progress is the original with quality still null.
// "lastPlayedDay" is the last day the song was played, practiced, or (later) rehearsed.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.songs = {

  // ----- Looking things up (these never change the state) -----

  // Every song, as a list: finished originals (newest first), then covers.
  list: function (state) {
    var all = Object.keys(state.songs).map(function (id) { return state.songs[id]; });
    var originals = all.filter(function (s) { return !s.isCover && s.quality !== null; })
      .sort(function (a, b) { return b.writtenDay - a.writtenDay; });
    var covers = all.filter(function (s) { return s.isCover; });
    return originals.concat(covers);
  },

  // Songs you can play or practice (everything except the song in progress).
  playable: function (state) {
    return Game.rules.songs.list(state);
  },

  // The original you're writing right now, or null.
  inProgress: function (state) {
    var ids = Object.keys(state.songs);
    for (var i = 0; i < ids.length; i++) {
      var song = state.songs[ids[i]];
      if (!song.isCover && song.quality === null) return song;
    }
    return null;
  },

  // The playable song with the lowest tightness (the picker preselects it).
  loosest: function (state) {
    var songs = Game.rules.songs.playable(state);
    if (!songs.length) return null;
    return songs.reduce(function (worst, s) { return s.tightness < worst.tightness ? s : worst; });
  },

  // How much one Write block adds: 12 + Songwriting / 5.
  progressPerBlock: function (songwriting) {
    var b = Game.balance.songs;
    return b.progressBase + songwriting / b.progressSongwritingDivisor;
  },

  // Stars from quality: quality / 20, rounded up, from 1 to 5. (A cover's 50 is 3 stars.)
  stars: function (quality) {
    var b = Game.balance.songs;
    return Game.util.clamp(Math.ceil(quality / b.pointsPerStar), 1, b.maxStars);
  },

  // Days since the song was last played or practiced.
  daysSincePlayed: function (state, song) {
    return state.day - song.lastPlayedDay;
  },

  // ----- Changing things (each returns a new state) -----

  // Picks a random original title that isn't already used. Uses the saved random seed.
  // Returns { state, title }.
  suggestTitle: function (state) {
    var names = Game.content.names;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var used = Object.keys(s.songs).map(function (id) { return s.songs[id].title; });
    var title;
    for (var i = 0; i < Game.balance.songs.titleSuggestionTries; i++) {
      title = rng.pick(names.songTitleFirst) + ' ' + rng.pick(names.songTitleSecond);
      if (used.indexOf(title) === -1) break;
    }
    s.rngState = rng.getState();
    return { state: s, title: title };
  },

  // Adds the starting covers: a random few from the cover list, quality 50, tightness 60.
  // Returns { state, log }.
  addStartingCovers: function (state) {
    var b = Game.balance.songs;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var pool = Game.content.names.coverTitles.slice();
    for (var i = 0; i < b.startingCovers && pool.length; i++) {
      var title = pool.splice(rng.int(0, pool.length - 1), 1)[0]; // take one out so there are no repeats
      var id = 's' + s.nextSongId;
      s.nextSongId += 1;
      s.songs[id] = {
        id: id, title: title, isCover: true, progress: b.progressToFinish,
        quality: b.coverQuality, tightness: b.tightness.cover, lastPlayedDay: s.day,
        startedDay: null, writtenDay: null, qualityParts: null, recording: null, releaseId: null
      };
    }
    s.rngState = rng.getState();
    return { state: s, log: [] };
  },

  // Starts a new original (called by Write when nothing is in progress). Returns { state, songId }.
  startSong: function (state) {
    var s = Game.util.clone(state);
    var id = 's' + s.nextSongId;
    s.nextSongId += 1;
    s.songs[id] = {
      id: id, title: 'Untitled song', isCover: false, progress: 0, quality: null,
      tightness: Game.balance.songs.tightness.newOriginal, lastPlayedDay: s.day,
      startedDay: s.day, writtenDay: null, qualityParts: null, recording: null, releaseId: null
    };
    return { state: s, songId: id };
  },

  // One Write block: adds progress to the song in progress (starting one if needed),
  // and finishes it if progress reaches 100.
  // songwriting: the Songwriting skill at the start of the block.
  // Returns { state, songId, added, progress, finished, log }.
  write: function (state, songwriting) {
    var b = Game.balance.songs;
    var s = state;
    var song = Game.rules.songs.inProgress(s);
    if (!song) {
      var started = Game.rules.songs.startSong(s);
      s = started.state;
      song = s.songs[started.songId];
    }
    s = Game.util.clone(s);
    var added = Game.rules.songs.progressPerBlock(songwriting);
    var target = s.songs[song.id];
    target.progress = Math.min(b.progressToFinish, target.progress + added);

    var result = { state: s, songId: song.id, added: added, progress: target.progress, finished: false, log: [] };
    if (target.progress >= b.progressToFinish) {
      var done = Game.rules.songs.finishSong(s, song.id);
      result.state = done.state;
      result.finished = true;
      result.log = done.log;
    }
    return result;
  },

  // Finishes a song: rolls its quality, gives it a suggested title, and +5 morale.
  //   quality = 15 + 0.6 x Songwriting + luck (0 to 25) + 5 if morale is above 70
  // Returns { state, log }.
  finishSong: function (state, songId) {
    var b = Game.balance.songs;
    var s = Game.util.clone(state);
    var song = s.songs[songId];
    var rng = Game.rng.create(s.rngState);

    var parts = {
      base: b.qualityBase,
      songwriting: b.qualitySongwritingWeight * s.player.skills.songwriting,
      luck: rng.int(0, b.qualityRandomMax),
      mood: s.player.morale > b.qualityHighMoraleThreshold ? b.qualityHighMoraleBonus : 0
    };
    s.rngState = rng.getState();

    song.progress = b.progressToFinish;
    song.quality = Math.round(parts.base + parts.songwriting + parts.luck + parts.mood);
    song.qualityParts = parts;
    song.writtenDay = s.day;
    song.lastPlayedDay = s.day;
    song.tightness = b.tightness.newOriginal;

    var named = Game.rules.songs.suggestTitle(s);
    s = named.state;
    s.songs[songId].title = named.title;

    var morale = Game.rules.morale.change(s, Game.balance.morale.change.finishSong);
    s = morale.state;
    var stars = Game.rules.songs.stars(song.quality);
    return {
      state: s,
      log: ['New song: quality ' + song.quality + ' (' + stars + ' star' + (stars === 1 ? '' : 's') +
        '), +' + Game.balance.morale.change.finishSong + ' morale.'].concat(morale.log)
    };
  },

  // Practice on one song: +10 tightness (max 100), and it counts as played today.
  // Returns { state, log, added }.
  practiceSong: function (state, songId, amount) {
    var s = Game.util.clone(state);
    var song = s.songs[songId];
    var before = song.tightness;
    song.tightness = Math.min(Game.balance.songs.tightness.max, song.tightness + amount);
    song.lastPlayedDay = s.day;
    return { state: s, log: [], added: song.tightness - before };
  },

  // Renames a song. The name can't be blank or too long.
  // If it isn't allowed, the state comes back unchanged with the reason in the log. Returns { state, log }.
  rename: function (state, songId, title) {
    var max = Game.balance.songs.titleMaxLength;
    var clean = String(title || '').trim();
    if (!state.songs[songId]) return { state: state, log: ['That song doesn\'t exist.'] };
    if (!clean) return { state: state, log: ['Give your song a name.'] };
    if (clean.length > max) return { state: state, log: ['Song names can be up to ' + max + ' characters.'] };
    var s = Game.util.clone(state);
    s.songs[songId].title = clean;
    return { state: s, log: [] };
  },

  // Runs each night, after the day moves forward.
  // A song not played or practiced for 7 days loses 3 tightness that night, then 3 more
  // every 7 days, and never drops below 20. Returns { state, log }.
  applyFading: function (state) {
    var t = Game.balance.songs.tightness;
    var s = Game.util.clone(state);
    var faded = [];
    Game.rules.songs.playable(s).forEach(function (song) {
      var days = Game.rules.songs.daysSincePlayed(s, song);
      var fadeNight = days >= t.decayAfterDays && (days - t.decayAfterDays) % Game.balance.time.daysPerWeek === 0;
      if (fadeNight && song.tightness > t.floor) {
        s.songs[song.id].tightness = Math.max(t.floor, song.tightness + t.decayPerWeek);
        faded.push('"' + song.title + '"');
      }
    });
    var log = faded.length
      ? ['Getting loose (unplayed for a week or more): ' + faded.join(', ') + ' (' + t.decayPerWeek + ' tightness).']
      : [];
    return { state: s, log: log };
  }
};
