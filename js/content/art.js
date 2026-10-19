// art.js
// The pictures in assets/: which painting goes with each kind of venue, and the portraits people get.
// (Screen backdrops are set in styles.css, since only the look uses them.)

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.art = {

  // A painting for each venue size (by tier: 0 open mic ... 4 arena), plus festivals.
  venues: {
    0: 'assets/venues/openmic.jpg',
    1: 'assets/venues/smallroom.jpg',
    2: 'assets/venues/club.jpg',
    3: 'assets/venues/theater.jpg',
    4: 'assets/venues/arena.jpg',
    festival: 'assets/venues/festival.jpg'
  },

  // Portraits for the people you meet. Each person keeps one (person.portrait is one of these ids).
  portraits: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12'],

  // Where a portrait's picture is.
  portraitSrc: function (id) {
    return 'assets/portraits/' + id + '.jpg';
  },

  // The painting for a show: festivals have their own, everything else goes by the venue's size.
  venueSrc: function (venue, deal) {
    var art = Game.content.art.venues;
    return deal === 'festival' ? art.festival : art[venue.tier];
  }
};
