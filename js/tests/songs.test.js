// songs.test.js
// Tests for songs and songwriting (js/rules/songs.js, and Write/Practice in js/rules/actions.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50; // middle morale: no mood bonus, skill multiplier 1
    return s;
  }

  function covers(state) {
    return Game.rules.songs.list(state).filter(function (song) { return song.isCover; });
  }

  // Finishes a brand-new song with a given Songwriting and morale, and returns its quality.
  function qualityFor(seed, songwriting, morale) {
    var s = freshState(seed);
    s.player.skills.songwriting = songwriting;
    s.player.morale = morale;
    var started = Game.rules.songs.startSong(s);
    var done = Game.rules.songs.finishSong(started.state, started.songId);
    return done.state.songs[started.songId].quality;
  }

  Game.test('Songs: a new career starts with 5 different covers at quality 50 and tightness 60', function (t) {
    var list = covers(freshState());
    t.equal(list.length, 5, 'five covers');
    list.forEach(function (song) {
      t.equal(song.quality, 50, song.title + ' quality');
      t.equal(song.tightness, 60, song.title + ' tightness');
      t.ok(Game.content.names.coverTitles.indexOf(song.title) !== -1, song.title + ' comes from names.js');
    });
    var titles = list.map(function (song) { return song.title; });
    t.equal(titles.filter(function (x, i) { return titles.indexOf(x) === i; }).length, 5, 'no repeats');
    t.sameContents(covers(freshState(9)), covers(freshState(9)), 'same seed, same covers');
  });

  Game.test('Writing: progress per block is 14 at Songwriting 10 and 24 at Songwriting 60', function (t) {
    t.near(Game.rules.songs.progressPerBlock(10), 14);
    t.near(Game.rules.songs.progressPerBlock(60), 24);
  });

  Game.test('Writing: a first song takes 8 Write blocks at Songwriting 10, and 5 at 60', function (t) {
    [[10, 8], [60, 5]].forEach(function (pair) {
      var s = freshState();
      var blocks = 0;
      var result;
      do {
        result = Game.rules.songs.write(s, pair[0]);
        s = result.state;
        blocks += 1;
      } while (!result.finished && blocks < 20);
      t.equal(blocks, pair[1], 'Songwriting ' + pair[0]);
    });
  });

  Game.test('Quality: always 21 to 46 at Songwriting 10, and both ends can happen', function (t) {
    var low = 999, high = -1;
    for (var seed = 1; seed <= 400; seed++) {
      var q = qualityFor(seed, 10, 50);
      low = Math.min(low, q);
      high = Math.max(high, q);
    }
    t.ok(low >= 21 && high <= 46, 'range was ' + low + ' to ' + high);
    t.equal(low, 21, 'lowest seen');
    t.equal(high, 46, 'highest seen');
  });

  Game.test('Quality: always 51 to 76 at Songwriting 60', function (t) {
    var low = 999, high = -1;
    for (var seed = 1; seed <= 400; seed++) {
      var q = qualityFor(seed, 60, 50);
      low = Math.min(low, q);
      high = Math.max(high, q);
    }
    t.ok(low >= 51 && high <= 76, 'range was ' + low + ' to ' + high);
    t.equal(low, 51, 'lowest seen');
    t.equal(high, 76, 'highest seen');
  });

  Game.test('Quality: morale over 70 adds 5, and the same seed always gives the same roll', function (t) {
    t.equal(qualityFor(3, 10, 71) - qualityFor(3, 10, 50), 5, 'mood bonus');
    t.equal(qualityFor(3, 10, 70) - qualityFor(3, 10, 50), 0, 'exactly 70 gets no bonus');
    t.equal(qualityFor(5, 30, 50), qualityFor(5, 30, 50), 'repeatable');
  });

  Game.test('Stars: quality / 20 rounded up, from 1 to 5', function (t) {
    var stars = Game.rules.songs.stars;
    t.equal(stars(50), 3, 'a cover (50)');
    t.equal(stars(21), 2, '21');
    t.equal(stars(40), 2, '40');
    t.equal(stars(41), 3, '41');
    t.equal(stars(5), 1, 'never below 1');
    t.equal(stars(100), 5, '100');
  });

  Game.test('Finishing a song: +5 morale, tightness 30, a suggested title, and it joins the catalog', function (t) {
    var s = freshState();
    var started = Game.rules.songs.startSong(s);
    var done = Game.rules.songs.finishSong(started.state, started.songId).state;
    var song = done.songs[started.songId];
    t.equal(done.player.morale, 55, '+5 morale');
    t.equal(song.tightness, 30, 'new originals start at 30');
    t.ok(song.title !== 'Untitled song' && song.title.length > 0, 'got a title: ' + song.title);
    t.equal(Game.rules.songs.inProgress(done), null, 'nothing in progress anymore');
    t.equal(Game.rules.songs.playable(done).length, 6, '5 covers + 1 original');
  });

  Game.test('Writing at End Day: progress builds up, and finishing is reported for the reveal', function (t) {
    var s = freshState();
    s.player.skills.songwriting = 60; // 24 per block: done on the 5th
    for (var i = 0; i < 5; i++) {
      s.player.energy = 100;
      s = Game.rules.actions.plan(s, 'evening', 'write').state;
      var r = Game.rules.day.endDay(s);
      s = r.state;
      if (i < 4) t.equal(s.lastDayReport.finishedSongs.length, 0, 'day ' + (i + 1) + ': not done yet');
    }
    t.equal(s.lastDayReport.finishedSongs.length, 1, 'day 5: finished');
    t.ok(s.songs[s.lastDayReport.finishedSongs[0]].quality !== null, 'quality rolled');
  });

  Game.test('Write preview: two Write blocks in one day add up', function (t) {
    var s = freshState();
    var day = s;
    for (var i = 0; i < 5; i++) day = Game.rules.day.endDay(day).state; // Saturday
    day.player.energy = 100;
    day = Game.rules.actions.plan(day, 'morning', 'write').state;
    var second = Game.rules.actions.writePreview(day, 'afternoon');
    t.near(second.from, 14, 'afternoon starts where the morning ends');
    t.near(second.to, 28);
  });

  Game.test('Practice: +10 tightness to the song you pick, max 100, and it counts as played', function (t) {
    var s = freshState();
    for (var i = 0; i < 5; i++) s = Game.rules.day.endDay(s).state; // Saturday
    s.player.energy = 100;
    var song = covers(s)[0];
    s = Game.rules.actions.plan(s, 'morning', 'practice', song.id).state;
    t.equal(Game.rules.actions.plannedEntry(s, 'morning').songId, song.id, 'song saved with the plan');
    var after = Game.rules.day.endDay(s).state;
    t.equal(after.songs[song.id].tightness, 70, '60 + 10');
    t.equal(after.songs[song.id].lastPlayedDay, s.day, 'played today');
    t.ok(after.player.skills.musicianship > s.player.skills.musicianship, 'Musicianship still grows');
    after.songs[song.id].tightness = 95;
    t.equal(Game.rules.songs.practiceSong(after, song.id, 10).state.songs[song.id].tightness, 100, 'capped at 100');
  });

  Game.test('Practice: planning without a song picks the loosest; a made-up song is refused', function (t) {
    var s = freshState();
    var loose = covers(s)[2];
    s.songs[loose.id].tightness = 25;
    var planned = Game.rules.actions.plan(s, 'evening', 'practice').state;
    t.equal(Game.rules.actions.plannedEntry(planned, 'evening').songId, loose.id, 'loosest song chosen');
    var refused = Game.rules.actions.plan(s, 'evening', 'practice', 'nope');
    t.equal(Game.rules.actions.plannedActionId(refused.state, 'evening'), null, 'not planned');
    t.ok(refused.log.length > 0, 'gives a reason');
  });

  Game.test('Tightness: a song unplayed for 7 days loses 3, then 3 more each week', function (t) {
    var s = freshState();
    var id = covers(s)[0].id;
    for (var i = 0; i < 6; i++) s = Game.rules.day.endDay(s).state;
    t.equal(s.songs[id].tightness, 60, '6 days: no change');
    s = Game.rules.day.endDay(s).state;
    t.equal(s.songs[id].tightness, 57, '7 days: -3');
    for (var j = 0; j < 7; j++) s = Game.rules.day.endDay(s).state;
    t.equal(s.songs[id].tightness, 54, '14 days: -6');
  });

  Game.test('Tightness: never fades below 20', function (t) {
    var s = freshState();
    var id = covers(s)[0].id;
    s.songs[id].tightness = 21;
    for (var i = 0; i < 7; i++) s = Game.rules.day.endDay(s).state;
    t.equal(s.songs[id].tightness, 20, '21 - 3 stops at 20');
    for (var j = 0; j < 14; j++) s = Game.rules.day.endDay(s).state;
    t.equal(s.songs[id].tightness, 20, 'stays at 20');
  });

  Game.test('Naming: blank and too-long names are refused', function (t) {
    var s = freshState();
    var id = covers(s)[0].id;
    t.equal(Game.rules.songs.rename(s, id, '  My Song  ').state.songs[id].title, 'My Song', 'trimmed');
    t.ok(Game.rules.songs.rename(s, id, '   ').log.length > 0, 'blank refused');
    var long = new Array(Game.balance.songs.titleMaxLength + 2).join('x');
    t.ok(Game.rules.songs.rename(s, id, long).log.length > 0, 'too long refused');
  });

  Game.test('Save: a version 2 save (Phase 2) upgrades and gets its 5 starting covers', function (t) {
    var s = freshState();
    var old = Game.util.clone(s);
    old.version = 2;
    old.songs = {};
    delete old.nextSongId;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(covers(loaded.state).length, 5, 'covers added');
  });

  Game.test('Practice all songs: +1 tightness on every song, and they all count as played', function (t) {
    var s = freshState();
    for (var i = 0; i < 5; i++) s = Game.rules.day.endDay(s).state; // Saturday
    s.player.energy = 100;
    var before = Game.util.clone(s.songs);
    s = Game.rules.actions.plan(s, 'morning', 'practice', 'all').state;
    t.equal(Game.rules.actions.plannedEntry(s, 'morning').songId, 'all', 'planned as all songs');
    var after = Game.rules.day.endDay(s).state;
    Game.rules.songs.playable(after).forEach(function (song) {
      t.equal(song.tightness, before[song.id].tightness + 1, song.title + ' +1');
      t.equal(song.lastPlayedDay, s.day, song.title + ' counts as played');
    });
    t.ok(after.player.skills.musicianship > s.player.skills.musicianship, 'Musicianship still grows');
  });

  Game.test('Practice all songs: keeps songs from fading', function (t) {
    var s = freshState();
    var id = covers(s)[0].id;
    for (var i = 0; i < 6; i++) s = Game.rules.day.endDay(s).state; // Sunday, day 6
    s.player.energy = 100;
    s = Game.rules.actions.plan(s, 'morning', 'practice', 'all').state;
    s = Game.rules.day.endDay(s).state; // day 7: would have faded without practice
    t.equal(s.songs[id].tightness, 61, '60 + 1, no -3');
  });

  Game.test('Sorting songs: by tightness both ways, by name, and by last played', function (t) {
    var s = freshState();
    var list = covers(s);
    s.songs[list[0].id].tightness = 30; s.songs[list[0].id].lastPlayedDay = 5;
    s.songs[list[1].id].tightness = 90; s.songs[list[1].id].lastPlayedDay = -3;
    var songs = Game.rules.songs.playable(s);
    var sort = function (by) { return Game.rules.songs.sortSongs(s, songs, by).map(function (x) { return x.id; }); };
    t.equal(sort('tightLow')[0], list[0].id, 'loosest first');
    t.equal(sort('tightHigh')[0], list[1].id, 'tightest first');
    t.equal(sort('lastPlayed')[0], list[1].id, 'longest since played first');
    var names = Game.rules.songs.sortSongs(s, songs, 'name').map(function (x) { return x.title; });
    t.sameContents(names, names.slice().sort(function (a, b) { return a.localeCompare(b); }), 'A to Z');
  });

  Game.test('Filtering songs: covers only, originals only, or all', function (t) {
    var s = freshState();
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    var songs = Game.rules.songs.playable(s);
    t.equal(Game.rules.songs.filterSongs(songs, 'covers').length, 5, 'covers');
    t.equal(Game.rules.songs.filterSongs(songs, 'originals').length, 1, 'originals');
    t.equal(Game.rules.songs.filterSongs(songs, 'all').length, 6, 'all');
  });

})();
