// setlist.js
// Setlist strategy: the order of a set matters. Numbers are in balance.gigs.setlist.
//   - Opener and closer: starting and ending with one of the set's strongest songs helps the gig score; starting or
//     ending with one of its weakest hurts. A song's strength is (quality + tightness) / 2.
//   - Crowd favorites: songs that charted (or are going viral right now) get a cheer, more so in a city where lots of
//     people know them.
//   - The encore: an extra song picked ahead of time. After a Great or Legendary night the band comes back out and
//     plays it, for more new fans (more again if it's a favorite) and a little buzz. It never changes the score.
// The score parts ('opener', 'closer', 'favorites') are added to every gig in Game.rules.gigs.scoreParts.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.setlist = {

  // A song's strength for ordering: (quality + tightness) / 2.
  strength: function (song) {
    return ((song.quality || 0) + (song.tightness || 0)) / 2;
  },

  // True if the crowd knows this song: it charted (any singles chart peak) or it's going viral right now.
  isFavorite: function (song) {
    return !!(song && ((song.chart && song.chart.peak) || (song.streams && song.streams.viral)));
  },

  // How many songs count as "strong" in a set this size: 2, or 1 in sets of 2 or 3, 0 for a single song.
  strongCount: function (n) {
    return Math.min(Game.balance.gigs.setlist.strongCount, Math.floor(n / 2));
  },

  // How many count as "weak": the same, but only in sets of 4 or more (in a short set the last song is always one of
  // the weakest, so it isn't held against you).
  weakCount: function (n) {
    return n >= Game.balance.gigs.setlist.weakFromSetSize ? Game.rules.setlist.strongCount(n) : 0;
  },

  // The set's song ids from strongest to weakest (ties keep the set's order).
  byStrength: function (state, songIds) {
    var sl = Game.rules.setlist;
    return songIds.map(function (id, i) { return { id: id, i: i, strength: sl.strength(state.songs[id]) }; })
      .sort(function (a, b) { return b.strength - a.strength || a.i - b.i; })
      .map(function (x) { return x.id; });
  },

  // The set's score parts: [{ id: 'opener' | 'closer' | 'favorites', value }]. cityId: where the show is.
  parts: function (state, songIds, cityId) {
    var b = Game.balance.gigs.setlist;
    var sl = Game.rules.setlist;
    var n = songIds.length;
    var k = sl.strongCount(n);
    var kw = sl.weakCount(n);
    var ranked = sl.byStrength(state, songIds);
    var strong = ranked.slice(0, k);
    var weak = kw ? ranked.slice(n - kw) : [];
    var spot = function (id, values) {
      if (strong.indexOf(id) !== -1) return values.strong;
      if (weak.indexOf(id) !== -1) return values.weak;
      return 0;
    };
    var opener = n ? spot(songIds[0], b.opener) : 0;
    var closer = n > 1 ? spot(songIds[n - 1], b.closer) : 0;
    var favorites = songIds.filter(function (id) { return sl.isFavorite(state.songs[id]); }).length;
    var cheer = Math.min(b.favoritesMax, favorites * b.favorite);
    if (favorites && cityId) {
      var city = state.cities[cityId];
      if (city.fans >= Game.content.cities[cityId].fanCeiling * b.knowTheWords.share) cheer += b.knowTheWords.bonus;
    }
    return [{ id: 'opener', value: opener }, { id: 'closer', value: closer }, { id: 'favorites', value: cheer }];
  },

  // The parts added up.
  total: function (state, songIds, cityId) {
    return Game.rules.setlist.parts(state, songIds, cityId).reduce(function (sum, p) { return sum + p.value; }, 0);
  },

  // The best running order for these songs: the strongest first, the second strongest last, the rest in between
  // (strongest first). Returns a new list of ids.
  bestOrder: function (state, songIds) {
    var ranked = Game.rules.setlist.byStrength(state, songIds);
    if (ranked.length < 3) return ranked;
    return [ranked[0]].concat(ranked.slice(2), [ranked[1]]);
  },

  // Why a song can't be the encore for this set, or null (no encore is fine). coversOnly: true for a cover night.
  encoreProblem: function (state, songIds, encoreSongId, coversOnly) {
    if (!encoreSongId) return null;
    var song = state.songs[encoreSongId];
    var playable = Game.rules.songs.playable(state).some(function (x) { return x.id === encoreSongId; });
    if (!song || !playable) return 'That song isn\'t ready to play.';
    if (songIds.indexOf(encoreSongId) !== -1) return 'That song is already in the set.';
    if (coversOnly && !song.isCover) return 'A cover night is covers only.';
    return null;
  },

  // What an encore adds after this result: null (no encore tonight), or { songId, title, favorite, fanBonus, buzz }.
  encoreFor: function (state, songIds, encoreSongId, result) {
    var b = Game.balance.gigs.setlist.encore;
    if (!encoreSongId || (result !== 'great' && result !== 'legendary')) return null;
    if (Game.rules.setlist.encoreProblem(state, songIds, encoreSongId)) return null;
    var song = state.songs[encoreSongId];
    var favorite = Game.rules.setlist.isFavorite(song);
    return { songId: encoreSongId, title: song.title, favorite: favorite, fanBonus: favorite ? b.favoriteFans : b.fans, buzz: b.buzz };
  }
};
