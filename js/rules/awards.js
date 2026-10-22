// awards.js
// Awards season (Phase 12, milestone 17): every December (real calendar years). Nominations arrive on the first
// Monday of December, from your releases and fans this year; the ceremony is the last Saturday of December,
// and each win adds reputation. Numbers are in balance.awards; names in content/business.js.
//
// Categories:
//   song      Song of the Year: your best recording released this year (quality 60+)
//   record    Record of the Year: your best EP or album released this year (average quality 55+)
//   breakout  Breakout Act: 2,000+ new fans this year
// Awards are head to head: each category you're nominated in also has your rivals and the scene's big bands as
// nominees, and one of you wins (see withRivals and ceremony).
// Each nomination is kept in state.awards: { year, category, title, chance, won (null until the ceremony),
//   nominees: [{ name, title, strength, you, bandId }], winner (a name, after the ceremony) }.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.awards = {

  // Which calendar year a day is in (like 2026).
  year: function (day) { return Game.rules.day.date(day).year; },

  // True on the first Monday of December (nominations) / the last Saturday of December (the ceremony).
  isNominationsDay: function (day) {
    var a = Game.balance.awards;
    var d = Game.rules.day.date(day);
    return d.month === a.month - 1 && d.dayOfWeek === a.nominationsDayOfWeek && d.date <= Game.balance.time.daysPerWeek;
  },
  isCeremonyDay: function (day) {
    var a = Game.balance.awards;
    var d = Game.rules.day.date(day);
    var next = Game.rules.day.date(day + Game.balance.time.daysPerWeek);
    return d.month === a.month - 1 && d.dayOfWeek === a.ceremonyDayOfWeek && next.month !== d.month;
  },

  // The ceremony day in the same December as a day (the last Saturday of the month).
  ceremonyDayAfter: function (day) {
    var d = day;
    while (!Game.rules.awards.isCeremonyDay(d)) d += 1;
    return d;
  },

  // A win chance from a quality: (quality - 50) / 50, kept between 10% and 80%.
  qualityChance: function (quality) {
    var a = Game.balance.awards;
    return Game.util.clamp((quality - a.qualityFloor) / a.qualityFloor, a.minChance, a.maxChance);
  },

  // The nominations you'd get this year (without giving them). Returns [{ category, title, chance }].
  // A better chance for a song or record that reached the Top 10 this year (its chart record, or null).
  chartBonus: function (state, chart) {
    var aw = Game.rules.awards;
    if (!chart || !chart.peak || chart.peak > Game.balance.charts.topTen || chart.peakDay === null) return 0;
    return aw.year(chart.peakDay) === aw.year(state.day) ? Game.balance.awards.topTenBonus : 0;
  },

  // The nominations you'd get this year (without giving them). Returns [{ category, title, chance, nominees }]:
  // for each category you qualify for, the other nominees are your rivals (with a record or new fans this year) and the
  // scene's biggest bands. chance is your chance of winning against them (see strengths).
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
      list.push(aw.withRivals(state, { category: 'song', title: '"' + best.title + '"',
        strength: Math.min(a.maxChance, aw.qualityChance(best.recording.quality) + aw.chartBonus(state, best.chart) +
          Game.rules.label.awardsBoost(state, Game.rules.streaming.releaseOf(state, best))) })); // a prestige label's records get noticed
    }

    // Record of the Year: the best EP or album this year.
    var records = releases.filter(function (r) { return r.type !== 'single' && r.avgQuality >= a.recordMinQuality; })
      .sort(function (x, y) { return y.avgQuality - x.avgQuality; });
    if (records.length) {
      var rec = records[0];
      list.push(aw.withRivals(state, { category: 'record', title: '"' + (rec.name || Game.content.releaseTypes[rec.type].name) + '" (' + Game.content.releaseTypes[rec.type].name + ')',
        strength: Math.min(a.maxChance, aw.qualityChance(rec.avgQuality) + aw.chartBonus(state, rec.chart) + Game.rules.label.awardsBoost(state, rec)) }));
    }

    // Breakout Act: new fans this year.
    var gained = Game.rules.progress.totalFans(state) - state.stats.yearStartFans;
    if (gained >= a.breakoutMinFans) {
      list.push(aw.withRivals(state, { category: 'breakout', title: gained.toLocaleString() + ' new fans this year',
        strength: aw.breakoutChance(gained) }));
    }
    return list;
  },

  // Breakout Act strength from new fans: new fans / 20,000, kept between 10% and 80%.
  breakoutChance: function (gained) {
    var a = Game.balance.awards;
    return Game.util.clamp(gained / a.breakoutFansForMax, a.minChance, a.maxChance);
  },

  // The other nominees in a category (up to 4: rivals first if they qualify, then the scene's biggest bands), each
  // { name, title, strength, bandId }. No dice: other bands' records are judged by their skills.
  otherNominees: function (state, category) {
    var a = Game.balance.awards;
    var aw = Game.rules.awards;
    var sc = Game.rules.scene;
    var names = Game.content.names;
    var year = aw.year(state.day);
    var out = [];
    // Rivals: their best record this year (song and record), or their new fans this year (breakout).
    sc.rivals(state).forEach(function (band) {
      if (category === 'breakout') {
        var gained = band.fans - band.yearStartFans;
        if (gained >= a.breakoutMinFans) out.push({ name: band.name, title: gained.toLocaleString() + ' new fans', strength: aw.breakoutChance(gained), bandId: band.id });
        return;
      }
      var rels = state.scene.releases.filter(function (r) { return r.bandId === band.id && aw.year(r.day) === year; })
        .sort(function (x, y) { return y.quality - x.quality; });
      var r = rels[0];
      if (!r) return;
      var minQ = category === 'song' ? a.songMinQuality : a.recordMinQuality;
      if (r.quality < minQ) return;
      var chart = category === 'song' ? r.leadChart : r.chart;
      out.push({ name: band.name, title: '"' + (category === 'song' ? r.lead : r.name) + '"',
        strength: Math.min(a.maxChance, aw.qualityChance(r.quality) + aw.chartBonus(state, chart)), bandId: band.id });
    });
    // The rest: the scene's biggest bands (Breakout Act: the biggest small and club bands, who are still breaking out).
    var bands = Object.keys(state.scene.bands).map(function (id) { return state.scene.bands[id]; })
      .filter(function (band) { return !band.rival && (category !== 'breakout' || sc.sizeOf(band.reputation) <= 2); })
      .sort(function (x, y) { return y.fans - x.fans || (x.id < y.id ? -1 : 1); });
    for (var i = 0; i < bands.length && out.length < a.nominees - 1; i++) {
      var band = bands[i];
      var n = Number(band.id.slice(1)) + year; // picks a title for their record from the word lists (the same all year)
      if (category === 'breakout') {
        var grew = Math.round(band.fans * a.sceneBreakoutShare);
        out.push({ name: band.name, title: grew.toLocaleString() + ' new fans', strength: aw.breakoutChance(grew), bandId: band.id });
      } else {
        out.push({ name: band.name, title: '"' + names.songTitleFirst[n % names.songTitleFirst.length] + ' ' +
          names.songTitleSecond[(n * 3) % names.songTitleSecond.length] + '"',
          strength: aw.qualityChance((band.songwriting + band.musicianship) / 2), bandId: band.id });
      }
    }
    return out.slice(0, a.nominees - 1);
  },

  // Your nomination with the other nominees and your chance against them: each nominee's weight is its strength
  // cubed, and your chance is your share of all the weights.
  withRivals: function (state, mine) {
    var aw = Game.rules.awards;
    var power = Game.balance.awards.strengthPower;
    var others = aw.otherNominees(state, mine.category);
    var nominees = [{ name: state.band.name || state.player.name, title: mine.title, strength: mine.strength, you: true }].concat(others);
    var total = nominees.reduce(function (t, x) { return t + Math.pow(x.strength, power); }, 0);
    return { category: mine.category, title: mine.title, chance: Math.pow(mine.strength, power) / total, nominees: nominees };
  },

  // Each morning: on the first Monday of December, nominations arrive; on the last Saturday of December, the
  // winners are announced (each win adds reputation). January 1 resets the "new fans this year" count.
  // Returns { state, log }.
  check: function (state) {
    var aw = Game.rules.awards;
    var s = state;
    var log = [];

    if (Game.rules.day.isNewYear(state.day)) {
      s = Game.util.clone(s);
      s.stats.yearStartFans = Game.rules.progress.totalFans(s);
    }

    if (aw.isNominationsDay(s.day)) {
      var nominated = aw.nominate(s);
      s = nominated.state;
      log = log.concat(nominated.log);
    }
    if (aw.isCeremonyDay(s.day)) {
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
        s.awards.push({ year: aw.year(s.day), category: n.category, title: n.title, chance: n.chance, won: null,
          nominees: n.nominees.map(function (x) { return { name: x.name, title: x.title, strength: x.strength, you: !!x.you, bandId: x.bandId || null }; }),
          winner: null });
      });
      var text = 'You\'re nominated: ' + noms.map(function (n) {
        var rivals = n.nominees.filter(function (x) { return !x.you; }).map(function (x) { return x.name; });
        return Game.content.business.awards[n.category].name + ' for ' + n.title + ' (' + Math.round(n.chance * 100) + '% chance' +
          (rivals.length ? ', up against ' + aw.listText(rivals) : '') + ')';
      }).join('; ') + '. The ceremony is ' + Game.rules.day.dateLabel(aw.ceremonyDayAfter(s.day)) + '.';
      s = Game.rules.booking.addInbox(s, 'note', { title: '🏅 Awards season: nominations', text: text }, null);
      log.push(text);
    }
    return { state: s, log: log };
  },

  // "A, B, and C".
  listText: function (items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + (items.length > 2 ? ',' : '') + ' and ' + items[items.length - 1];
  },

  // Awards night: one winner in each category you're nominated in, picked by strength (cubed), so the strongest
  // nominee usually wins. A win adds reputation; a scene band that wins keeps count. Returns { state, log }.
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
        var nominees = n.nominees && n.nominees.length ? n.nominees : [{ name: 'you', strength: n.chance, you: true }];
        var winner;
        if (nominees.length === 1) {
          winner = rng.chance(n.chance) ? nominees[0] : null; // nominations from before rivals: your old chance
        } else {
          var total = nominees.reduce(function (t, x) { return t + Math.pow(x.strength, a.strengthPower); }, 0);
          var roll = rng.next() * total;
          for (var i = 0; i < nominees.length && !winner; i++) {
            roll -= Math.pow(nominees[i].strength, a.strengthPower);
            if (roll < 0) winner = nominees[i];
          }
          winner = winner || nominees[nominees.length - 1];
        }
        n.won = !!(winner && winner.you);
        n.winner = winner ? winner.name : null;
        if (winner && winner.bandId && s.scene.bands[winner.bandId]) s.scene.bands[winner.bandId].awardsWon += 1;
        if (n.won) s.player.reputation = Game.util.clamp(s.player.reputation + a.winReputation, 0, Game.balance.reputation.max);
        lines.push(Game.content.business.awards[n.category].name + ': ' + (n.won ? 'you won! +' + a.winReputation + ' reputation.'
          : (winner ? 'it went to ' + winner.name + ' for ' + winner.title + '.' : 'not this year.')));
      });
      s.rngState = rng.getState();
      var result = 'Awards night. ' + lines.join(' ');
      s = Game.rules.booking.addInbox(s, 'note', { title: '🏆 Awards night', text: result }, null);
      log.push(result);
    }
    return { state: s, log: log };
  }
};
