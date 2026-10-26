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
    var s = Game.util.clone(state);
    Game.rules.audience.buzzOn(s, cityId, amount);
    return { state: s, log: [] };
  },

  // The same as addBuzz, but it changes s itself instead of making a copy. Only for rules that already made their
  // own copy of the state and change many cities in a loop (copying the whole game once per city is slow).
  buzzOn: function (s, cityId, amount) {
    var b = Game.balance.buzz;
    s.cities[cityId].buzz = Game.util.clamp(s.cities[cityId].buzz + amount, b.min, b.max);
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
      if (city.fans <= 0 || city.club || s.day - city.lastActivityDay < f.fadeAfterDays) return; // a fan club keeps fans around
      var lost = Math.min(city.fans, Game.rules.gigs.roundFans(rng, city.fans * f.fadePerWeek));
      if (!lost) return;
      city.fans -= lost;
      log.push(Game.content.cities[id].name + ': -' + lost + ' fan' + (lost === 1 ? '' : 's') + ' (no show or release there in ' + f.fadeAfterDays + '+ days).');
    });
    s.rngState = rng.getState();
    return { state: s, log: log };
  },

  // Sunday night: fan clubs. A city where you have 10% of its most possible fans gets a fan club, and every fan club
  // grows its city's fans by 2% a week on its own (never past the city's most). The first club ever gets a banner.
  // Returns { state, log }.
  fanClubs: function (state) {
    var c = Game.balance.fans.club;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var log = [];
    var hadOne = Object.keys(s.cities).some(function (id) { return s.cities[id].club; });
    var formed = [];
    Object.keys(s.cities).forEach(function (id) {
      var city = s.cities[id];
      var ceiling = Game.content.cities[id].fanCeiling;
      if (!city.club && city.fans >= ceiling * c.share) {
        city.club = true;
        formed.push(Game.content.cities[id].name);
      }
      if (!city.club) return;
      var grow = Math.min(ceiling - city.fans, Game.rules.gigs.roundFans(rng, city.fans * c.weekly));
      if (grow > 0) city.fans += grow;
    });
    s.rngState = rng.getState();
    if (formed.length) {
      var text = 'A fan club started in ' + formed.join(', ') + '! Fan clubs grow on their own every week, and those fans don\'t fade.';
      log.push(text);
      if (!hadOne) s.toasts.push({ id: 'fanClub-' + s.day, text: text });
    }
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
      if (Game.rules.manager.adsRunning(s, id)) return; // tour ads are running there: buzz holds
      s.cities[id].buzz = Math.max(b.min, before + b.fadePerDay);
      var lost = Game.util.round1(before - s.cities[id].buzz);
      log.push(Game.content.cities[id].name + ' buzz faded: -' + lost + '.');
    });
    return { state: s, log: log };
  }
};
