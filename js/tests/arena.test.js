// arena.test.js
// Tests for the easier road to arenas: the lower fan bar, fan clubs (they form at 10% of a city's most fans, grow each
// Sunday, stop fading, and never pass the city's most), and bigger word-of-mouth on tours far from home.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState() {
    return Game.rules.career.startCareer('Test', 'guitar', 1).state;
  }

  Game.test('Arenas: the bar is reputation 85 and 60,000 fans', function (t) {
    var s = freshState();
    s.player.reputation = 85;
    s.cities.hometown.fans = 40000;
    s.cities.harlowFalls.fans = 19999;
    t.equal(Game.rules.progress.checkUnlocks(s).state.milestones.arena, undefined, '59,999 fans: not yet');
    s.cities.harlowFalls.fans = 20000;
    t.ok(Game.rules.progress.checkUnlocks(s).state.milestones.arena !== undefined, '60,000 fans: the Arena milestone');
  });

  Game.test('Fan clubs: one forms at 10% of a city\'s most fans and grows on its own each week', function (t) {
    var c = Game.balance.fans.club;
    var ceiling = Game.content.cities.hometown.fanCeiling;
    var s = freshState();
    s.cities.hometown.fans = Math.floor(ceiling * c.share) - 1;
    var r = Game.rules.audience.fanClubs(s);
    t.equal(r.state.cities.hometown.club, false, 'just under 10%: no club');
    s.cities.hometown.fans = Math.ceil(ceiling * c.share);
    r = Game.rules.audience.fanClubs(s);
    t.ok(r.state.cities.hometown.club, 'at 10%: a fan club');
    t.ok(r.state.cities.hometown.fans > s.cities.hometown.fans, 'and it grows: +' + (r.state.cities.hometown.fans - s.cities.hometown.fans));
    t.ok(r.state.toasts.some(function (x) { return /fan club/.test(x.text); }), 'the first one gets a banner');
    var full = Game.util.clone(r.state);
    full.cities.hometown.fans = ceiling - 1;
    t.equal(Game.rules.audience.fanClubs(full).state.cities.hometown.fans, ceiling, 'never past the city\'s most');
  });

  Game.test('Fan clubs: a city with a club doesn\'t fade when you\'ve been away', function (t) {
    var s = freshState();
    s.day = 100;
    s.cities.hometown.fans = 8000;
    s.cities.hometown.lastActivityDay = 0;
    t.ok(Game.rules.audience.fadeFans(s).state.cities.hometown.fans < 8000, 'no club: fans fade');
    s.cities.hometown.club = true;
    t.equal(Game.rules.audience.fadeFans(s).state.cities.hometown.fans, 8000, 'with a club: they stay');
  });

  Game.test('Tours: word of mouth is bigger far from home (National cities and abroad)', function (t) {
    var tr = Game.rules.travel;
    var t2 = Game.balance.tours;
    var near = Object.keys(Game.content.venues).filter(function (id) { var v = Game.content.venues[id]; return v.tier > 0 && Game.content.cities[v.cityId].region === 'near'; })[0];
    var nat = Object.keys(Game.content.venues).filter(function (id) { var v = Game.content.venues[id]; return v.tier > 0 && Game.content.cities[v.cityId].region === 'national'; })[0];
    var abroad = Object.keys(Game.content.venues).filter(function (id) { var v = Game.content.venues[id]; return v.tier > 0 && Game.content.cities[v.cityId].region === 'international'; })[0];
    t.equal(tr.tourFanBonus(near), t2.fanBonus, 'near: +' + Math.round(t2.fanBonus * 100) + '%');
    t.equal(tr.tourFanBonus(nat), t2.fanBonusByRegion.national, 'National: +' + Math.round(t2.fanBonusByRegion.national * 100) + '%');
    t.equal(tr.tourFanBonus(abroad), t2.fanBonusByRegion.international, 'abroad: +' + Math.round(t2.fanBonusByRegion.international * 100) + '%');
  });
})();
