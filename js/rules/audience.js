// audience.js
// Rules for fans and buzz in each city. (Fans start changing once gigs arrive.)
// Buzz is how hot you are right now: it goes up with promotion and fades every day.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.audience = {

  // How much buzz a promotion action adds, based on the Promotion skill.
  //   Post online: 1 + Promotion / 20
  //   Hang flyers: 3 x (1 + Promotion / 100)   (paid promotion gets the skill multiplier)
  promoBuzz: function (state, kind) {
    var p = Game.balance.promotion;
    var skill = state.player.skills.promotion;
    if (kind === 'postOnline') return p.postOnline.buzzBase + skill / p.postOnline.buzzSkillDivisor;
    if (kind === 'flyers') return p.flyers.buzz * (1 + skill / p.paidSkillDivisor);
    if (kind === 'socialAds') return p.socialAds.buzz * (1 + skill / p.paidSkillDivisor);
    throw new Error('Unknown promotion kind: ' + kind);
  },

  // Adds buzz to one city, kept between 0 and 100. Returns { state, log }.
  addBuzz: function (state, cityId, amount) {
    var b = Game.balance.buzz;
    var s = Game.util.clone(state);
    s.cities[cityId].buzz = Game.util.clamp(s.cities[cityId].buzz + amount, b.min, b.max);
    return { state: s, log: [] };
  },

  // Overnight: buzz fades 2 points in every city, never below 0. Returns { state, log }.
  fadeBuzz: function (state) {
    var b = Game.balance.buzz;
    var s = Game.util.clone(state);
    var log = [];
    Object.keys(s.cities).forEach(function (id) {
      var before = s.cities[id].buzz;
      if (before <= b.min) return;
      s.cities[id].buzz = Math.max(b.min, before + b.fadePerDay);
      var lost = Game.util.round1(before - s.cities[id].buzz);
      log.push(Game.content.cities[id].name + ' buzz faded: -' + lost + '.');
    });
    return { state: s, log: log };
  }
};
