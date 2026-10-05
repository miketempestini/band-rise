// awards.js
// Awards season (Phase 12, milestone 17): every December. A game year is 52 weeks; December is weeks 48 to 52.
// Nominations arrive on the Monday of week 48, from your releases and fans this year; the ceremony is the
// Saturday of week 52, and each win adds reputation. Numbers are in balance.awards; names in content/business.js.
//
// Categories:
//   song      Song of the Year: your best recording released this year (quality 60+)
//   record    Record of the Year: your best EP or album released this year (average quality 55+)
//   breakout  Breakout Act: 2,000+ new fans this year
// Each nomination is kept in state.awards: { year, category, title, chance, won (null until the ceremony) }.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.awards = {

  // Which game year a day is in (starting at 1), and which week of that year (1 to 52).
  year: function (day) { return Math.floor(day / Game.balance.time.daysPerYear) + 1; },
  weekOfYear: function (day) {
    return Math.floor((day % Game.balance.time.daysPerYear) / Game.balance.time.daysPerWeek) + 1;
  },

  // A win chance from a quality: (quality - 50) / 50, kept between 10% and 80%.
  qualityChance: function (quality) {
    var a = Game.balance.awards;
    return Game.util.clamp((quality - a.qualityFloor) / a.qualityFloor, a.minChance, a.maxChance);
  },

  // The nominations you'd get this year (without giving them). Returns [{ category, title, chance }].
  nominationsFor: function (state) {
    var a = Game.balance.awards;
    var aw = Game.rules.awards;
    var thisYear = aw.year(state.day);
    var releases = state.releases.filter(function (r) { return aw.year(r.day) === thisYear; });
    var list = [];

    // Song of the Year: the best recording on any release this year.
    var best = null;
    releases.forEach(function (r) {
      r.songIds.forEach(function (id) {
        var song = state.songs[id];
        if (song && song.recording && (!best || song.recording.quality > best.recording.quality)) best = song;
      });
    });
    if (best && best.recording.quality >= a.songMinQuality) {
      list.push({ category: 'song', title: '"' + best.title + '"', chance: aw.qualityChance(best.recording.quality) });
    }

    // Record of the Year: the best EP or album this year.
    var records = releases.filter(function (r) { return r.type !== 'single' && r.avgQuality >= a.recordMinQuality; })
      .sort(function (x, y) { return y.avgQuality - x.avgQuality; });
    if (records.length) {
      var rec = records[0];
      list.push({ category: 'record', title: 'your ' + Game.content.releaseTypes[rec.type].name + ' (' + Game.rules.day.dateLabel(rec.day) + ')',
        chance: aw.qualityChance(rec.avgQuality) });
    }

    // Breakout Act: new fans this year.
    var gained = Game.rules.progress.totalFans(state) - state.stats.yearStartFans;
    if (gained >= a.breakoutMinFans) {
      list.push({ category: 'breakout', title: gained.toLocaleString() + ' new fans this year',
        chance: Game.util.clamp(gained / a.breakoutFansForMax, a.minChance, a.maxChance) });
    }
    return list;
  },

  // Each morning: on the Monday of week 48, nominations arrive; on the Saturday of week 52, the winners are
  // announced (each win adds reputation). A new year resets the "new fans this year" count. Returns { state, log }.
  check: function (state) {
    var a = Game.balance.awards;
    var aw = Game.rules.awards;
    var dow = Game.rules.day.dayOfWeek(state.day);
    var week = aw.weekOfYear(state.day);
    var s = state;
    var log = [];

    if (state.day % Game.balance.time.daysPerYear === 0) {
      s = Game.util.clone(s);
      s.stats.yearStartFans = Game.rules.progress.totalFans(s);
    }

    if (week === a.nominationsWeek && dow === 0) {
      var nominated = aw.nominate(s);
      s = nominated.state;
      log = log.concat(nominated.log);
    }
    if (week === a.ceremonyWeek && dow === a.ceremonyDayOfWeek) {
      var held = aw.ceremony(s);
      s = held.state;
      log = log.concat(held.log);
    }
    return { state: s, log: log };
  },

  // Gives this year's nominations (if any) and sends them to the Inbox. Returns { state, log }.
  nominate: function (state) {
    var a = Game.balance.awards;
    var aw = Game.rules.awards;
    var s = state;
    var log = [];
    var noms = aw.nominationsFor(s);
    if (noms.length) {
      s = Game.util.clone(s);
      noms.forEach(function (n) {
        s.awards.push({ year: aw.year(s.day), category: n.category, title: n.title, chance: n.chance, won: null });
      });
      var text = 'You\'re nominated: ' + noms.map(function (n) {
        return Game.content.business.awards[n.category].name + ' for ' + n.title + ' (' + Math.round(n.chance * 100) + '% chance)';
      }).join('; ') + '. The ceremony is ' + Game.rules.day.dateLabel(s.day + (a.ceremonyWeek - a.nominationsWeek) * Game.balance.time.daysPerWeek + a.ceremonyDayOfWeek) + '.';
      s = Game.rules.booking.addInbox(s, 'note', { title: '🏅 Awards season: nominations', text: text }, null);
      log.push(text);
    }
    return { state: s, log: log };
  },

  // Awards night: each open nomination this year wins or not (by its chance). A win adds reputation.
  // Returns { state, log }.
  ceremony: function (state) {
    var a = Game.balance.awards;
    var aw = Game.rules.awards;
    var s = state;
    var log = [];
    var open = s.awards.filter(function (n) { return n.won === null && n.year === aw.year(s.day); });
    if (open.length) {
      s = Game.util.clone(s);
      var rng = Game.rng.create(s.rngState);
      var lines = [];
      s.awards.forEach(function (n) {
        if (n.won !== null || n.year !== aw.year(s.day)) return;
        n.won = rng.chance(n.chance);
        if (n.won) s.player.reputation = Game.util.clamp(s.player.reputation + a.winReputation, 0, Game.balance.reputation.max);
        lines.push(Game.content.business.awards[n.category].name + ': ' + (n.won ? 'you won! +' + a.winReputation + ' reputation.' : 'not this year.'));
      });
      s.rngState = rng.getState();
      var result = 'Awards night. ' + lines.join(' ');
      s = Game.rules.booking.addInbox(s, 'note', { title: '🏆 Awards night', text: result }, null);
      log.push(result);
    }
    return { state: s, log: log };
  }
};
