// gigs.js
// Rules for playing a gig: crowd size, the score, the result, and everything you get from it.
// For now that means the hometown open mics. Every number comes from balance.js (mostly balance.gigs).
//
// The score (from Design.md):
//   0.35 x band musicianship + 0.25 x Performance + 0.20 x average song quality
//   + 0.20 x average tightness + modifiers + luck
// "Band musicianship" is the band's average skill with your Musicianship counted twice
// (see Game.rules.people.bandMusicianship). Solo, it's just your own Musicianship.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.gigs = {

  // ----- Looking things up (these never change the state) -----

  // The open mic running tonight in your city, or null if there isn't one.
  openMicTonight: function (state) {
    var dow = Game.rules.day.dayOfWeek(state.day);
    var venues = Game.content.venues;
    var ids = Object.keys(venues);
    for (var i = 0; i < ids.length; i++) {
      if (venues[ids[i]].openMicDay === dow) return venues[ids[i]];
    }
    return null;
  },

  // A plain sentence listing when the open mics happen, like
  // "Open mics: Tuesday evening at The Rusty Nail, Thursday evening at Bean There Cafe."
  openMicSchedule: function () {
    var venues = Game.content.venues;
    var nights = Object.keys(venues).filter(function (id) { return venues[id].openMicDay !== undefined; })
      .map(function (id) {
        return Game.content.calendar.dayNames[venues[id].openMicDay] + ' evening at ' + venues[id].name;
      });
    return 'Open mics: ' + nights.join(', ') + '.';
  },

  // Expected crowd = city fans x (8% + buzz/5 %) + foot traffic x (0.5 + buzz/100).
  expectedCrowd: function (state, venue) {
    var c = Game.balance.crowd;
    var city = state.cities[venue.cityId];
    var footTraffic = Game.balance.venues.tiers[venue.tier].footTraffic;
    return city.fans * (c.fanTurnout + city.buzz / c.buzzTurnoutDivisor / 100) +
      footTraffic * (c.footTrafficBase + city.buzz / c.footTrafficBuzzDivisor);
  },

  // The lowest and highest crowd you could get (shown before the show, like "13 to 17").
  crowdRange: function (state, venue) {
    var c = Game.balance.crowd;
    var expected = Game.rules.gigs.expectedCrowd(state, venue);
    var cap = venue.capacity === null ? Infinity : venue.capacity;
    return {
      low: Math.min(cap, Math.round(expected * c.randomMin)),
      high: Math.min(cap, Math.round(expected * c.randomMax))
    };
  },

  // The best set of a given size: the songs with the highest quality + tightness.
  suggestSet: function (state, size) {
    return Game.rules.songs.playable(state)
      .slice()
      .sort(function (a, b) { return (b.quality + b.tightness) - (a.quality + a.tightness); })
      .slice(0, size)
      .map(function (song) { return song.id; });
  },

  // Why a set isn't allowed (wrong number of songs, repeats, unknown songs), or null if it's fine.
  setProblem: function (state, songIds, size) {
    if (!Array.isArray(songIds) || songIds.length !== size) return 'Pick exactly ' + size + ' songs.';
    var playable = Game.rules.songs.playable(state).map(function (song) { return song.id; });
    for (var i = 0; i < songIds.length; i++) {
      if (playable.indexOf(songIds[i]) === -1) return 'That song can\'t be played.';
      if (songIds.indexOf(songIds[i]) !== i) return 'Each song can only be played once.';
    }
    return null;
  },

  // Fans from covers count less than fans from originals:
  // 0.75 for an all-cover set, 1.25 for all originals, and in between for a mix.
  originalsFactor: function (songs) {
    var b = Game.balance.songs;
    var originals = songs.filter(function (song) { return !song.isCover; }).length;
    var share = songs.length ? originals / songs.length : 0;
    return b.coverFanFactor + (b.originalFanFactor - b.coverFanFactor) * share;
  },

  // The average tightness the crowd hears. Session players know every song at 50, so they pull
  // the average toward 50 by their share of the people on stage.
  effectiveTightness: function (state, songs, sessionPlayers) {
    var avg = songs.reduce(function (sum, song) { return sum + song.tightness; }, 0) / songs.length;
    var extra = sessionPlayers || 0;
    if (!extra) return avg;
    var regulars = 1 + state.band.memberIds.length;
    return (avg * regulars + Game.balance.people.sessionPlayerTightness * extra) / (regulars + extra);
  },

  // The score parts before luck. Returns a list of { id, value }.
  // energy: your energy at the start of the gig's block (Tired is checked on this).
  // options: { sessionPlayers, crowd } for booked shows (crowd decides the room-fullness modifier).
  scoreParts: function (state, songs, venue, energy, options) {
    var g = Game.balance.gigs;
    var p = state.player;
    var opts = options || {};
    var room = 0;
    if (venue.capacity !== null && opts.crowd !== undefined) {
      var full = opts.crowd / venue.capacity;
      if (full > g.fullRoomThreshold) room = g.fullRoomBonus;
      else if (full < g.emptyRoomThreshold && venue.tier > 0) room = g.emptyRoomPenalty;
    }
    var average = function (key) {
      return songs.reduce(function (sum, song) { return sum + song[key]; }, 0) / songs.length;
    };
    var instrumentBonus = 0;
    Game.balance.economy.instrumentUpgrades.forEach(function (upgrade) {
      if (upgrade.tier === p.gear.instrumentTier) instrumentBonus = upgrade.gigBonus;
    });
    var morale = 0;
    if (p.morale < g.moraleLowThreshold) morale = g.lowMoralePenalty;
    if (p.morale > g.moraleHighThreshold) morale = g.highMoraleBonus;

    return [
      { id: 'bandSkill', value: g.weights.bandMusicianship * Game.rules.people.bandMusicianship(state, opts.sessionPlayers) },
      { id: 'stagePresence', value: g.weights.performance * p.skills.performance },
      { id: 'songs', value: g.weights.songQuality * average('quality') },
      { id: 'tightness', value: g.weights.tightness * Game.rules.gigs.effectiveTightness(state, songs, opts.sessionPlayers) },
      { id: 'instrument', value: instrumentBonus },
      { id: 'tired', value: Game.rules.energy.isTired(energy) ? g.tiredPenalty : 0 },
      { id: 'morale', value: morale },
      { id: 'traits', value: Game.rules.people.traitGigBonus(state) },
      { id: 'venueTier', value: Game.balance.venues.tiers[venue.tier].gigScorePenalty },
      { id: 'room', value: room },
      { id: 'setbacks', value: Game.rules.events.gigScoreChange(state) } // event effects like a crackling amp
    ];
  },

  // Which result a score gets: 'rough', 'solid', 'great' or 'legendary'.
  resultFor: function (score) {
    var g = Game.balance.gigs;
    var order = g.resultOrder;
    for (var i = order.length - 1; i >= 0; i--) {
      if (score >= g.results[order[i]].minScore) return order[i];
    }
    return order[0];
  },

  // Reputation change from a gig: base x (1 + venue tier x 0.5).
  // Gains shrink as you climb (x (1 - reputation / 150)). Losses don't shrink.
  reputationChange: function (reputation, base, tier) {
    var r = Game.balance.reputation;
    var change = base * (1 + tier * r.tierMultiplier);
    if (change > 0) change *= (1 - reputation / r.diminishingDivisor);
    return change;
  },

  // Turns a fraction of a fan into whole fans: 1.4 means 1 fan, with a 40% chance of a second.
  roundFans: function (rng, amount) {
    var whole = Math.floor(amount);
    return whole + (rng.chance(amount - whole) ? 1 : 0);
  },

  // The tip for the biggest thing that hurt the score, or null if nothing did.
  // Returns an id from Game.content.gigText.tips.
  pickTip: function (parts, averageTightness) {
    var g = Game.balance.gigs;
    var value = function (id) {
      var part = parts.filter(function (x) { return x.id === id; })[0];
      return part ? part.value : 0;
    };
    var hurts = [
      { id: 'tired', cost: -value('tired') },
      { id: 'lowMorale', cost: -value('morale') },
      { id: 'badLuck', cost: value('luck') <= g.badLuckTipAt ? -value('luck') : 0 },
      { id: 'looseSongs', cost: averageTightness < g.looseSongsTipAt ? (g.looseSongsTipAt - averageTightness) * g.weights.tightness : 0 }
    ];
    var worst = hurts.reduce(function (a, b) { return b.cost > a.cost ? b : a; });
    return worst.cost > 0 ? worst.id : null;
  },

  // ----- Playing a gig -----

  // Plays a gig and applies everything that comes from it.
  // energy: your energy at the start of the block (before the gig's energy cost).
  // options (booked shows): { deal, sessionPlayers }.
  // Returns { state, gig, log }. The gig's full details are also saved in state.lastGig.
  playGig: function (state, venueId, songIds, energy, options) {
    var opts = options || {};
    var b = Game.balance;
    var g = b.gigs;
    var gigs = Game.rules.gigs;
    var s = Game.util.clone(state);
    var venue = Game.content.venues[venueId];
    var city = s.cities[venue.cityId];
    var rng = Game.rng.create(s.rngState);
    var songs = songIds.map(function (id) { return s.songs[id]; });
    var averageTightness = gigs.effectiveTightness(s, songs, opts.sessionPlayers);

    // Crowd: expected crowd x a random 0.85 to 1.15, capped at the venue's capacity.
    var expected = gigs.expectedCrowd(s, venue);
    var crowd = Math.max(0, Math.round(expected * rng.range(b.crowd.randomMin, b.crowd.randomMax)));
    if (venue.capacity !== null) crowd = Math.min(crowd, venue.capacity);

    // Score: the parts, then luck (never below 0 after two Rough results in a row).
    var parts = gigs.scoreParts(s, songs, venue, energy, { sessionPlayers: opts.sessionPlayers, crowd: crowd });
    var protectedLuck = s.player.badLuckStreak >= g.badLuckStreak;
    parts.push({ id: 'luck', value: rng.int(protectedLuck ? 0 : g.luckMin, g.luckMax) });
    var score = parts.reduce(function (sum, part) { return sum + part.value; }, 0);

    // Debug: force the result by adding a visible "Debug" part that moves the score into range.
    var forced = s.debug && s.debug.forceNextGig;
    if (forced) {
      var order = g.resultOrder;
      var low = g.results[forced].minScore;
      var next = order[order.indexOf(forced) + 1];
      var high = next ? g.results[next].minScore - 1 : Infinity;
      var shift = score < low ? low - score : (score > high ? high - score : 0);
      if (shift) {
        parts.push({ id: 'debug', value: shift });
        score += shift;
      }
      s.debug.forceNextGig = null;
    }

    var result = gigs.resultFor(score);
    var outcome = g.results[result];
    s.player.badLuckStreak = result === 'rough' ? s.player.badLuckStreak + 1 : 0;

    // Fans: crowd x conversion x originals factor x room left under the city's fan ceiling.
    var ceiling = Game.content.cities[venue.cityId].fanCeiling;
    var rawFans = crowd * outcome.fanConversion * gigs.originalsFactor(songs) * Math.max(0, 1 - city.fans / ceiling);
    var fans = gigs.roundFans(rng, rawFans);

    // Tip jar.
    var tipRange = g.openMicTips[result];
    var tips = venue.tier === 0 ? rng.int(tipRange.min, tipRange.max) : 0;
    s.rngState = rng.getState();

    city.fans += fans;
    city.lastActivityDay = s.day;

    // Buzz.
    var buzzBefore = city.buzz;
    s = Game.rules.audience.addBuzz(s, venue.cityId, outcome.buzz).state;
    var buzzAfter = s.cities[venue.cityId].buzz;

    // Reputation (never below 0 or above the max).
    var repBefore = s.player.reputation;
    var repChange = gigs.reputationChange(repBefore, outcome.reputation, venue.tier);
    s.player.reputation = Game.util.clamp(repBefore + repChange, 0, b.reputation.max);

    // Morale.
    var moraleByResult = { rough: b.morale.change.roughGig, solid: 0, great: b.morale.change.greatGig, legendary: b.morale.change.legendaryGig };
    var moraleChange = moraleByResult[result];
    var notes = [];
    if (moraleChange) {
      var m = Game.rules.morale.change(s, moraleChange);
      s = m.state;
      notes = m.log;
    }

    // Tips and show pay: split into equal shares with the band (a Diva takes 1.5). You keep your share.
    var share = Game.rules.people.payShares(s).yourShare;
    var yourTips = Math.round(tips * share);
    if (yourTips > 0) s = Game.rules.money.earn(s, yourTips, 'tips').state;
    var pay = opts.deal ? Game.rules.booking.payFor(venue, opts.deal, crowd) : 0;
    var yourPay = Math.round(pay * share);
    if (yourPay > 0) s = Game.rules.money.earn(s, yourPay, 'gigPay').state;
    s.stats.totalEarned += yourTips + yourPay;
    var bandNames = Game.rules.people.members(s).map(function (m) { return m.name; });
    var bandGig = Game.rules.people.recordGig(s, result, tips + pay);
    s = bandGig.state;
    notes = notes.concat(bandGig.log);

    // Merch: some of the crowd buys a shirt or a CD (if you have stock). Merch money is all yours.
    var merch = Game.rules.merch.sellAtGig(s, crowd, result, venueId);
    s = merch.state;
    s.stats.totalEarned += merch.revenue;

    // Venue relationship (booked rooms): +5 after a Solid or better show, -10 after a Rough one.
    var venueChange = 0;
    if (venue.tier > 0) {
      venueChange = result === 'rough' ? b.venues.relationshipAfterRoughShow : b.venues.relationshipAfterGoodShow;
      var vs = s.venues[venueId];
      vs.relationship = Game.util.clamp(vs.relationship + venueChange, b.venues.relationshipMin, b.venues.relationshipMax);
    }

    // Each song played gets tighter and counts as played today.
    var songResults = songIds.map(function (id) {
      var before = s.songs[id].tightness;
      s = Game.rules.songs.practiceSong(s, id, b.songs.tightness.playLiveGain).state;
      var song = s.songs[id];
      return { id: id, title: song.title, isCover: song.isCover, quality: song.quality, tightnessBefore: before, tightnessAfter: song.tightness };
    });

    // Skill gains for playing live (Tired halves them, like any other action).
    var skillGains = {};
    var playLive = b.skills.baseGain.playLive;
    Object.keys(playLive).forEach(function (skill) {
      var trained = Game.rules.skills.train(s, skill, playLive[skill], energy);
      s = trained.state;
      skillGains[skill] = trained.gain;
    });

    // Stats.
    s.stats.gigsPlayed += 1;
    if (venue.tier === 0) s.stats.openMicsPlayed += 1;
    if (venue.tier > 0 && pay > 0) s.stats.paidShows += 1;
    if (!s.stats.bestResult || g.resultOrder.indexOf(result) > g.resultOrder.indexOf(s.stats.bestResult)) {
      s.stats.bestResult = result;
    }
    s.stats.biggestCrowd = Math.max(s.stats.biggestCrowd, crowd);

    var gig = {
      day: s.day,
      kind: venue.tier === 0 ? 'openMic' : 'show',
      deal: opts.deal || null,
      sessionPlayers: opts.sessionPlayers || 0,
      venueId: venueId,
      venueName: venue.name,
      songs: songResults,
      expectedCrowd: expected,
      crowd: crowd,
      capacity: venue.capacity,
      parts: parts,
      score: score,
      result: result,
      forced: !!forced,
      luckProtected: protectedLuck,
      rewards: {
        fans: fans,
        rawFans: rawFans,
        cityFans: s.cities[venue.cityId].fans,
        buzz: buzzAfter - buzzBefore,
        buzzNow: buzzAfter,
        reputation: s.player.reputation - repBefore,
        reputationNow: s.player.reputation,
        morale: moraleChange,
        tips: tips,
        yourTips: yourTips,
        pay: pay,
        yourPay: yourPay,
        venueRelationship: venueChange,
        merch: { sold: merch.sold, revenue: merch.revenue, soldOut: merch.soldOut },
        venueRelationshipNow: s.venues[venueId].relationship,
        band: bandNames,
        skills: skillGains
      },
      tipId: gigs.pickTip(parts, averageTightness),
      notes: notes
    };
    s.lastGig = gig;

    var resultName = result.charAt(0).toUpperCase() + result.slice(1);
    var money = '';
    if (yourTips) money += ', $' + yourTips + ' in tips' + (bandNames.length ? ' (your share)' : '');
    if (pay) money += ', $' + pay + ' pay' + (bandNames.length ? ' (your share $' + yourPay + ')' : '');
    if (merch.revenue) money += ', $' + merch.revenue + ' in merch';
    return {
      state: s,
      gig: gig,
      log: [resultName + (venue.tier === 0 ? ' set' : ' show at ' + venue.name) + ': ' + crowd +
        (venue.capacity !== null ? ' of ' + venue.capacity : '') + ' people, ' +
        (fans === 1 ? '+1 fan' : '+' + fans + ' fans') + money + '.'].concat(notes)
    };
  }
};
