// audience.js
// Rules for fans and buzz in each city.
// Fans stick around (but fade if you go quiet in a city, and never pass the city's fan ceiling).
// Buzz is how hot you are right now: it goes up with promotion and gigs and fades every day.

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
    if (kind === 'bigCampaign') return p.bigCampaign.buzz * (1 + skill / p.paidSkillDivisor);
    if (kind === 'pressPush') return p.pressPush.buzz * (1 + skill / p.paidSkillDivisor);
    throw new Error('Unknown promotion kind: ' + kind);
  },

  // Adds buzz to one city, kept between 0 and 100. Returns { state, log }.
  addBuzz: function (state, cityId, amount) {
    var b = Game.balance.buzz;
    var s = Game.util.clone(state);
    s.cities[cityId].buzz = Game.util.clamp(s.cities[cityId].buzz + amount, b.min, b.max);
    return { state: s, log: [] };
  },

  // Adds fans to a city, never above its fan ceiling (the most fans it can ever have). Returns { state, added }.
  addFans: function (state, cityId, amount) {
    var s = Game.util.clone(state);
    var city = s.cities[cityId];
    var before = city.fans;
    city.fans = Math.max(0, Math.min(Game.content.cities[cityId].fanCeiling, city.fans + amount));
    return { state: s, added: city.fans - before };
  },

  // Sunday night: every city with fans but no show or release for 30 days loses 2% of its fans
  // (fractions round randomly, like fan gains). Returns { state, log }.
  fadeFans: function (state) {
    var f = Game.balance.fans;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var log = [];
    Object.keys(s.cities).forEach(function (id) {
      var city = s.cities[id];
      if (city.fans <= 0 || s.day - city.lastActivityDay < f.fadeAfterDays) return;
      var lost = Math.min(city.fans, Game.rules.gigs.roundFans(rng, city.fans * f.fadePerWeek));
      if (!lost) return;
      city.fans -= lost;
      log.push(Game.content.cities[id].name + ': -' + lost + ' fan' + (lost === 1 ? '' : 's') + ' (no show or release there in ' + f.fadeAfterDays + '+ days).');
    });
    s.rngState = rng.getState();
    return { state: s, log: log };
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
