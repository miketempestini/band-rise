// offers.js
// Offers that come to you in the Inbox: opening slots (play before a touring band at a club) and
// residency contracts (a weekly night at one venue), including negotiating a residency's terms.
// Numbers are in balance.offers.openingSlot and balance.offers.residency.
//
// Inbox messages:
//   kind 'opening':   data { venueId, day, fee }
//   kind 'residency': data { venueId, weekday, rate, weeks, counter: null | { weekday, rate, weeks, chance,
//                       status: 'pending' | 'declined', replyDay } }

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.offers = {

  // ----- Opening slots -----

  // Chance each morning of an opening slot offer: 1% + reputation / 20 % + Networking / 40 % (from reputation 10).
  openingChance: function (state) {
    var o = Game.balance.offers.openingSlot;
    if (state.player.reputation < o.minReputation) return 0;
    return Math.min(1, o.baseChance + state.player.reputation / o.reputationDivisor / 100 +
      state.player.skills.networking / o.networkingDivisor / 100);
  },

  // Clubs: where opening slots happen (the tier is in balance.offers.openingSlot.venueTier).
  clubs: function () {
    return Game.rules.booking.venues('hometown').filter(function (v) { return v.tier === Game.balance.offers.openingSlot.venueTier; });
  },

  // ----- Residencies -----

  // Venues that might offer you a residency: rooms you've played that like you, once you're well known.
  residencyVenues: function (state) {
    var r = Game.balance.offers.residency;
    if (state.player.reputation < r.minReputation) return [];
    return Game.rules.booking.venues('hometown').filter(function (v) {
      var vs = state.venues[v.id];
      return v.deals.guarantee && vs.relationship >= r.minRelationship &&
        Game.rules.booking.requirements(state, v, 'guarantee').every(function (q) { return q.met; });
    });
  },

  // The show dates for residency terms: the first chosen weekday at least a week away, then weekly.
  residencyDates: function (state, weekday, weeks) {
    var r = Game.balance.offers.residency;
    var first = state.day + r.startDaysAhead;
    while (Game.rules.day.dayOfWeek(first) !== weekday) first += 1;
    var dates = [];
    for (var i = 0; i < weeks; i++) dates.push(first + i * Game.balance.time.daysPerWeek);
    return dates;
  },

  // Why residency terms can't be booked (a date is taken), or null.
  residencyProblem: function (state, venueId, weekday, weeks) {
    var venue = Game.content.venues[venueId];
    var dates = Game.rules.offers.residencyDates(state, weekday, weeks);
    for (var i = 0; i < dates.length; i++) {
      var taken = Game.rules.booking.blockTaken(state, dates[i], venue.showBlock) ||
        Game.rules.recording.blockProblem(state, dates[i], venue.showBlock);
      if (taken) return Game.rules.day.dateLabel(dates[i]) + ' is taken (' + String(taken).replace(/\.$/, '') + ').';
    }
    return null;
  },

  // The chance a venue agrees to your changed terms (100% if nothing changed).
  // A different night, more money, or a different length each lower it; a good relationship raises it.
  counterChance: function (state, offer, terms) {
    var r = Game.balance.offers.residency;
    if (terms.weekday === offer.weekday && terms.rate === offer.rate && terms.weeks === offer.weeks) return 1;
    var chance = r.maxChance;
    if (terms.weekday !== offer.weekday) chance -= r.dayChangePenalty;
    var morePercent = (terms.rate - offer.rate) / offer.rate * 100;
    if (morePercent > 0) chance -= morePercent * r.ratePenaltyPerPercent;
    chance -= Math.abs(terms.weeks - offer.weeks) * r.lengthPenaltyPerWeek;
    chance += state.venues[offer.venueId].relationship / r.relationshipBonusDivisor / 100;
    return Game.util.clamp(chance, r.minChance, r.maxChance);
  },

  // The nightly rates you can ask for: the offered rate, then steps up and down (5% each, up to 25%),
  // each rounded to a whole $5. Returns [{ rate, percent }] from lowest to highest, where percent is the
  // step's change (like -10 or +5; 0 is the offered rate).
  rateOptions: function (offer) {
    var r = Game.balance.offers.residency;
    var steps = Math.round(r.maxRateChange / r.rateStep);
    var options = [];
    for (var k = -steps; k <= steps; k++) {
      var rate = k === 0 ? offer.rate : Math.round(offer.rate * (1 + k * r.rateStep) / r.rateRoundTo) * r.rateRoundTo;
      // Small rates can round to the same dollar amount twice; keep just one of each.
      var last = options[options.length - 1];
      if (last && last.rate === rate) { if (k === 0) last.percent = 0; continue; }
      options.push({ rate: rate, percent: Math.round(k * r.rateStep * 100) });
    }
    return options;
  },

  // Why counter-offer terms aren't allowed, or null.
  termsProblem: function (state, offer, terms) {
    var r = Game.balance.offers.residency;
    if (terms.weeks < r.minWeeks || terms.weeks > r.maxWeeks) return 'Length must be ' + r.minWeeks + ' to ' + r.maxWeeks + ' weeks.';
    var allowed = Game.rules.offers.rateOptions(offer).some(function (o) { return o.rate === terms.rate; });
    if (!allowed) return 'Pick one of the rates on the list (up to ' + Math.round(r.maxRateChange * 100) + '% more or less).';
    return Game.rules.offers.residencyProblem(state, offer.venueId, terms.weekday, terms.weeks);
  },

  // ----- Each morning -----

  // Maybe an opening slot offer arrives (any day) or a residency offer (Mondays). Returns { state, log }.
  roll: function (state) {
    var o = Game.balance.offers;
    var s = Game.util.clone(state);
    var log = [];
    var rng = Game.rng.create(s.rngState);

    // Opening slot.
    var openNow = s.inbox.some(function (m) { return m.kind === 'opening' && !m.resolved; });
    if (!openNow && rng.chance(Game.rules.offers.openingChance(s))) {
      var club = rng.pick(Game.rules.offers.clubs());
      var day = s.day + rng.int(o.openingSlot.daysAhead.min, o.openingSlot.daysAhead.max);
      var round = o.openingSlot.feeRoundTo;
      var fee = rng.int(o.openingSlotFee.min / round, o.openingSlotFee.max / round) * round; // a round number
      var free = function (venue, d) {
        return !Game.rules.booking.blockTaken(s, d, venue.showBlock) && !Game.rules.recording.blockProblem(s, d, venue.showBlock);
      };
      // The slot is on a real show from a club's calendar (another band headlining, no opener yet), if there is one.
      var shows = s.scene.shows.filter(function (x) {
        var v = Game.content.venues[x.venueId];
        return v.cityId === 'hometown' && v.tier === o.openingSlot.venueTier && !x.openerId && !x.playerOpens &&
          x.day >= s.day + o.openingSlot.daysAhead.min && x.day <= s.day + o.openingSlot.daysAhead.max && free(v, x.day);
      });
      var show = shows.length ? rng.pick(shows) : null;
      if (show) { club = Game.content.venues[show.venueId]; day = show.day; }
      if (club && (show || (!s.scene.shows.length && free(club, day)))) {
        var headliner = show ? Game.rules.scene.band(s, show.bandId).name : null;
        s = Game.rules.booking.addInbox(s, 'opening', { venueId: club.id, day: day, fee: fee, showId: show ? show.id : null,
          bandId: show ? show.bandId : null }, Math.min(s.day + o.openingSlot.expiryDays, day - 1));
        log.push(club.name + ' wants you to open for ' + (headliner || 'a touring band') + ' on ' + Game.rules.day.dateLabel(day) + '. Check your Inbox.');
      }
    }

    // Residency (only on the offer day: Mondays).
    var residencyNow = s.inbox.some(function (m) { return m.kind === 'residency' && !m.resolved; });
    if (!residencyNow && Game.rules.day.dayOfWeek(s.day) === o.residency.offerDayOfWeek) {
      var venues = Game.rules.offers.residencyVenues(s);
      if (venues.length && rng.chance(o.residency.weeklyChance)) {
        var venue = rng.pick(venues);
        // Offer the first weekday (Thursday, then Friday, ...) whose dates are all free.
        var weekday = o.residency.preferredNights.filter(function (d) { return !Game.rules.offers.residencyProblem(s, venue.id, d, o.residencyWeeks); })[0];
        if (weekday !== undefined) {
          s = Game.rules.booking.addInbox(s, 'residency',
            { venueId: venue.id, weekday: weekday, rate: venue.deals.guarantee, weeks: o.residencyWeeks, counter: null },
            s.day + o.residency.expiryDays);
          log.push(venue.name + ' is offering you a residency! Read the contract in your Inbox.');
        }
      }
    }
    s.rngState = rng.getState();
    return { state: s, log: log };
  },

  // Each morning: venues answer residency counter-offers from yesterday. A yes signs the contract.
  // Returns { state, log }.
  processCounters: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    s.inbox.forEach(function (m) {
      var c = m.kind === 'residency' && !m.resolved && m.data.counter;
      if (!c || c.status !== 'pending' || c.replyDay > s.day) return;
      var rng = Game.rng.create(s.rngState);
      var yes = rng.chance(c.chance);
      s.rngState = rng.getState();
      var name = Game.content.venues[m.data.venueId].name;
      if (yes && !Game.rules.offers.residencyProblem(s, m.data.venueId, c.weekday, c.weeks)) {
        var signed = Game.rules.offers.signResidency(s, m.id, { weekday: c.weekday, rate: c.rate, weeks: c.weeks });
        s = signed.state;
        log.push(name + ' agreed to your terms! Residency signed. ' + signed.log.join(' '));
      } else {
        s.inbox.forEach(function (x) { if (x.id === m.id) { x.data.counter.status = 'declined'; x.read = false; } });
        log.push(name + ' said no to your changes. The original terms are still on the table.');
      }
    });
    return { state: s, log: log };
  },

  // ----- Answering -----

  // Accepts an opening slot: the show goes on the calendar (6 songs, the club's crowd, the agreed fee).
  // Returns { state, log }.
  acceptOpening: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'opening') return { state: state, log: ['That offer isn\'t open.'] };
    var venue = Game.content.venues[m.data.venueId];
    var taken = Game.rules.booking.blockTaken(state, m.data.day, venue.showBlock) || Game.rules.recording.blockProblem(state, m.data.day, venue.showBlock);
    if (taken) return { state: state, log: [String(taken).replace(/\.$/, '') + ' that day.'] };
    if (Game.rules.songs.playable(state).length < Game.balance.offers.openingSlot.setSize) {
      return { state: state, log: ['You need ' + Game.balance.offers.openingSlot.setSize + ' songs for an opening set.'] };
    }
    var s = Game.rules.offers.bookShow(state, m.data.venueId, m.data.day, 'opening', m.data.fee).state;
    s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; } });
    var show = m.data.showId && Game.rules.scene.showById(s, m.data.showId);
    if (show) { show.playerOpens = true; show.openerId = null; } // you're on the bill, under the headliner
    return { state: s, log: ['Booked: opening at ' + venue.name + ', ' + Game.rules.day.dateLabel(m.data.day) + ' ($' + m.data.fee + ').'] };
  },

  // Puts one show on the calendar (used by opening slots and residencies). Returns { state, entryId }.
  bookShow: function (state, venueId, day, deal, fee) {
    var venue = Game.content.venues[venueId];
    var s = Game.util.clone(state);
    var planned = s.schedule[day] && s.schedule[day][venue.showBlock];
    if (planned && s.entries[planned] && s.entries[planned].type === 'action') delete s.entries[planned];
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    s.entries[id] = {
      id: id, day: day, block: venue.showBlock, type: 'gig', venueId: venueId, deal: deal, fee: fee,
      songIds: Game.rules.booking.suggestSetlist(s, venue, deal), sessionPlayers: 0, status: 'booked'
    };
    s.schedule[day] = s.schedule[day] || {};
    s.schedule[day][venue.showBlock] = id;
    // An opening slot is on another band's night (they stay on as headliner); any other offer from a venue moves
    // other bands' shows to make room.
    if (deal !== 'opening') Game.rules.scene.clearNight(s, venueId, day);
    return { state: s, entryId: id };
  },

  // Signs a residency on these terms: books every night. Returns { state, log }.
  signResidency: function (state, messageId, terms) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'residency') return { state: state, log: ['That contract isn\'t open.'] };
    var problem = Game.rules.offers.residencyProblem(state, m.data.venueId, terms.weekday, terms.weeks);
    if (problem) return { state: state, log: [problem] };
    var s = state;
    var dates = Game.rules.offers.residencyDates(state, terms.weekday, terms.weeks);
    dates.forEach(function (d) { s = Game.rules.offers.bookShow(s, m.data.venueId, d, 'residency', terms.rate).state; });
    s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; x.data.signed = terms; } });
    return {
      state: s,
      log: ['Residency at ' + Game.content.venues[m.data.venueId].name + ': ' + terms.weeks + ' ' +
        Game.content.calendar.dayNames[terms.weekday] + 's at $' + terms.rate + ' a night, starting ' + Game.rules.day.dateLabel(dates[0]) + '.']
    };
  },

  // Sends a counter-offer on a residency. The venue answers next morning. One counter per contract.
  // Returns { state, log }.
  counterResidency: function (state, messageId, terms) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'residency') return { state: state, log: ['That contract isn\'t open.'] };
    if (m.data.counter) return { state: state, log: ['You already made a counter-offer on this contract.'] };
    var problem = Game.rules.offers.termsProblem(state, m.data, terms);
    if (problem) return { state: state, log: [problem] };
    var r = Game.balance.offers.residency;
    var s = Game.util.clone(state);
    var chance = Game.rules.offers.counterChance(s, m.data, terms);
    s.inbox.forEach(function (x) {
      if (x.id === messageId) {
        x.data.counter = { weekday: terms.weekday, rate: terms.rate, weeks: terms.weeks, chance: chance, status: 'pending', replyDay: s.day + r.counterReplyDays };
        x.expiresDay = Math.max(x.expiresDay, s.day + r.counterKeepOpenDays); // keep the offer open for the reply
      }
    });
    return { state: s, log: ['Counter-offer sent to ' + Game.content.venues[m.data.venueId].name + ' (' + Math.round(chance * 100) + '% chance). They\'ll answer tomorrow.'] };
  },

  // Declines an opening slot or residency (no penalty). Returns { state, log }.
  decline: function (state, messageId) {
    return Game.rules.booking.declineOffer(state, messageId);
  }
};
