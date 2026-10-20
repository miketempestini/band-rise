// setlist.test.js
// Tests for setlist strategy (js/rules/setlist.js): opener and closer, crowd favorites, the best order, the encore,
// saving a set in order, and the parts on the gig score.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A career with 6 finished songs of different strength (quality and tightness set by hand). Returns { state, ids }
  // with ids strongest first.
  function withSongs(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.scene.shows = [];
    var ids = [];
    for (var i = 0; i < 6; i++) {
      var st = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(st.state, st.songId).state;
      s.songs[st.songId].quality = 90 - i * 10;
      s.songs[st.songId].tightness = 90 - i * 10;
      ids.push(st.songId);
    }
    return { state: s, ids: ids };
  }

  var value = function (parts, id) { return parts.filter(function (p) { return p.id === id; })[0].value; };

  Game.test('Setlist: a strong opener and closer add to the score; weak ones cost points (in sets of 4+)', function (t) {
    var b = Game.balance.gigs.setlist;
    var o = withSongs();
    var ids = o.ids; // strongest first
    var best = Game.rules.setlist.parts(o.state, [ids[0], ids[2], ids[3], ids[1]], 'hometown');
    t.equal(value(best, 'opener'), b.opener.strong, 'strong opener');
    t.equal(value(best, 'closer'), b.closer.strong, 'strong closer');
    var worst = Game.rules.setlist.parts(o.state, [ids[3], ids[0], ids[1], ids[2]], 'hometown');
    t.equal(value(worst, 'opener'), b.opener.weak, 'weak opener');
    t.equal(value(worst, 'closer'), b.closer.weak, 'weak closer');
    var two = Game.rules.setlist.parts(o.state, [ids[0], ids[1]], 'hometown');
    t.equal(value(two, 'closer'), 0, 'a 2-song set doesn\'t hold the second song against you');
    t.equal(value(two, 'opener'), b.opener.strong, 'but a strong opener still counts');
  });

  Game.test('Setlist: crowd favorites (charted or viral) get a cheer, more where lots of people know them', function (t) {
    var b = Game.balance.gigs.setlist;
    var o = withSongs();
    var s = o.state;
    var set = o.ids.slice(0, 4);
    t.equal(value(Game.rules.setlist.parts(s, set, 'hometown'), 'favorites'), 0, 'no favorites yet');
    s.songs[set[1]].chart = { pos: 12, last: null, peak: 12, weeks: 1, peakDay: 0 };
    t.equal(value(Game.rules.setlist.parts(s, set, 'hometown'), 'favorites'), b.favorite, 'a charted song');
    s.songs[set[2]].streams = { total: 0, weeks: [], live: 0, viral: 2 };
    s.songs[set[3]].chart = { pos: 30, last: null, peak: 30, weeks: 1, peakDay: 0 };
    t.equal(value(Game.rules.setlist.parts(s, set, 'hometown'), 'favorites'), b.favoritesMax, 'up to +' + b.favoritesMax);
    s.cities.hometown.fans = Game.content.cities.hometown.fanCeiling;
    t.equal(value(Game.rules.setlist.parts(s, set, 'hometown'), 'favorites'), b.favoritesMax + b.knowTheWords.bonus, 'a city that knows the words');
  });

  Game.test('Setlist: Best order puts the strongest song first and the second strongest last', function (t) {
    var o = withSongs();
    var mixed = [o.ids[4], o.ids[1], o.ids[3], o.ids[0], o.ids[2]];
    var best = Game.rules.setlist.bestOrder(o.state, mixed);
    t.equal(best[0], o.ids[0], 'strongest first');
    t.equal(best[best.length - 1], o.ids[1], 'second strongest last');
    t.sameContents(best.slice().sort(), mixed.slice().sort(), 'the same songs');
    t.ok(Game.rules.setlist.total(o.state, best, 'hometown') >= Game.rules.setlist.total(o.state, mixed, 'hometown'), 'worth at least as much');
  });

  Game.test('Setlist: the encore plays only after a Great or Legendary night, for more fans and buzz', function (t) {
    var b = Game.balance.gigs.setlist.encore;
    var o = withSongs();
    var set = o.ids.slice(0, 3);
    t.equal(Game.rules.setlist.encoreProblem(o.state, set, o.ids[0]), 'That song is already in the set.', 'not a song from the set');
    t.equal(Game.rules.setlist.encoreFor(o.state, set, o.ids[4], 'solid'), null, 'no encore after a Solid night');
    var e = Game.rules.setlist.encoreFor(o.state, set, o.ids[4], 'great');
    t.equal(e.fanBonus, b.fans, '+' + Math.round(b.fans * 100) + '% fans');
    o.state.songs[o.ids[4]].chart = { pos: 5, last: null, peak: 5, weeks: 1, peakDay: 0 };
    t.equal(Game.rules.setlist.encoreFor(o.state, set, o.ids[4], 'legendary').fanBonus, b.favoriteFans, 'more with a crowd favorite');
    // On a real gig: force a Great night, with and without an encore.
    var s = o.state;
    s.debug.forceNextGig = 'great';
    var without = Game.rules.gigs.playGig(s, 'rustyNail', set, 100);
    s.debug.forceNextGig = 'great';
    var withEncore = Game.rules.gigs.playGig(s, 'rustyNail', set, 100, { encoreSongId: o.ids[4] });
    t.ok(withEncore.gig.encore && withEncore.gig.encore.songId === o.ids[4], 'the encore is on the gig');
    t.ok(withEncore.gig.rewards.fans >= without.gig.rewards.fans, 'at least as many fans (' + withEncore.gig.rewards.fans + ' vs ' + without.gig.rewards.fans + ')');
    t.equal(withEncore.gig.rewards.buzz, without.gig.rewards.buzz + b.buzz, '+' + b.buzz + ' buzz');
    t.ok(withEncore.state.songs[o.ids[4]].tightness > s.songs[o.ids[4]].tightness, 'the encore song gets tighter');
  });

  Game.test('Setlist: the order is saved as given, with the encore, and the parts show on the gig score', function (t) {
    var o = withSongs();
    var s = o.state;
    s.player.reputation = 20;
    var id = 'eTest';
    var set = o.ids.slice(0, 6);
    s.entries[id] = { id: id, day: s.day + 9, block: 'evening', type: 'gig', venueId: 'backRoom', deal: 'door', songIds: set, sessionPlayers: 0, status: 'booked' };
    var reversed = set.slice().reverse();
    var saved = Game.rules.booking.setSetlist(s, id, reversed, null).state;
    t.sameContents(saved.entries[id].songIds, reversed, 'order kept');
    var bad = Game.rules.booking.setSetlist(s, id, set, set[0]);
    t.equal(bad.state, s, 'an encore from the set is refused: ' + bad.log[0]);
    // A suggested setlist comes out in the best order.
    var suggested = Game.rules.booking.suggestSetlist(s, Game.content.venues.backRoom, 'door');
    t.sameContents(suggested, Game.rules.setlist.bestOrder(s, suggested), 'suggested sets are in the best order');
    var gig = Game.rules.gigs.playGig(s, 'backRoom', suggested, 100, { deal: 'door' }).gig;
    t.ok(gig.parts.some(function (p) { return p.id === 'opener'; }) && gig.parts.some(function (p) { return p.id === 'closer'; }), 'Opener and Closer on the score');
  });
})();
