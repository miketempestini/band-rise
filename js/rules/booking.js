// booking.js
// Rules for booking shows: venue requirements, booking odds, emailing a venue, replies in the inbox,
// accepting offers onto the calendar, setlists, session players, cancellations, and no-shows.
//
// A booked show is a calendar entry:
//   state.entries[id] = { id, day, block, type: 'gig', venueId, deal, songIds, sessionPlayers, status: 'booked' }
//   state.schedule[day][block] = id
// A deal is 'door', 'coverNight', or 'inStore' (booked by email), 'guarantee' (a fill-in show, from an event:
// the venue's usual flat fee; venues can't be emailed for a flat fee), 'opening' or 'residency'
// (from offers; those entries also carry a flat fee), or 'openMic' (an out-of-town open mic you signed up for).
// Out-of-town shows also get travel booked around them (see Game.rules.travel).

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.booking = {

  // ----- Looking things up (these never change the state) -----

  // Venues you can email (everything except open mics and arenas, which only come as offers).
  // cityId: optional, just one city's venues.
  venues: function (cityId) {
    var all = Game.content.venues;
    var tiers = Game.balance.venues.tiers;
    return Object.keys(all).map(function (id) { return all[id]; }).filter(function (v) {
      return v.tier > 0 && tiers[v.tier].bookAhead && (!cityId || v.cityId === cityId);
    });
  },

  // The deals you can email a venue for, in a fixed order. Shows are booked for a share of the door
  // (owner's change: no flat-fee bookings), plus cover nights and in-stores where a venue has them.
  // A venue's flat fee (deals.guarantee) is still what it pays for fill-ins and residencies.
  dealsFor: function (venue) {
    return ['door', 'coverNight', 'inStore'].filter(function (deal) { return venue.deals[deal]; });
  },

  // How many songs a show needs, and whether they must all be covers.
  setFor: function (venue, deal) {
    var lists = Game.balance.songs.setlist;
    if (deal === 'coverNight') return { size: lists.coverNight.songs, coversOnly: true };
    if (deal === 'opening') return { size: Game.balance.offers.openingSlot.setSize, coversOnly: false, coverLimit: null };
    if (deal === 'festival') return { size: Game.balance.bigOffers.festivalSetSize, coversOnly: false, coverLimit: lists.arena.coverLimit };
    var list = lists[Game.balance.venues.tiers[venue.tier].setlist]; // each tier says which setlist size it uses
    return { size: list.songs, coversOnly: false, coverLimit: list.coverLimit };
  },

  // The reputation a booking needs (cover nights have their own, lower bar).
  requiredReputation: function (venue, deal) {
    if (deal === 'coverNight') return Game.balance.economy.coverGigMinReputation;
    return Game.balance.venues.tiers[venue.tier].minReputation;
  },

  // Each requirement for booking a venue with a deal: [{ text, met }].
  requirements: function (state, venue, deal) {
    var b = Game.balance;
    var p = state.player;
    var reqs = [];
    var rep = Game.rules.booking.requiredReputation(venue, deal);
    reqs.push({ text: 'Reputation ' + rep + ' (you have ' + Math.floor(p.reputation) + ')', met: p.reputation >= rep });
    if (deal === 'coverNight') {
      var mus = b.economy.coverGigMinMusicianship;
      reqs.push({ text: 'Musicianship ' + mus + ' (you have ' + Math.floor(p.skills.musicianship) + ')', met: p.skills.musicianship >= mus });
    }
    var onStageNeeded = b.venues.tiers[venue.tier].minOnStage;
    if (onStageNeeded > 1) {
      var onStage = 1 + state.band.memberIds.length;
      reqs.push({ text: onStageNeeded + '+ on stage (you have ' + onStage + ')', met: onStage >= onStageNeeded });
    }
    if (venue.requiresRelease) reqs.push({ text: 'A release', met: state.releases.length > 0 });
    if (venue.cityId !== 'hometown') {
      var city = Game.content.cities[venue.cityId];
      reqs.push({ text: city.name + ' unlocked' + (state.cities[venue.cityId].unlocked ? '' : ' (' + Game.rules.travel.cityUnlockProblem(state, venue.cityId) + ')'),
        met: state.cities[venue.cityId].unlocked });
    }
    var set = Game.rules.booking.setFor(venue, deal);
    var songs = Game.rules.songs.playable(state).filter(function (s) { return !set.coversOnly || s.isCover; }).length;
    reqs.push({ text: set.size + (set.coversOnly ? ' covers' : ' songs') + ' for the set (you have ' + songs + ')', met: songs >= set.size });
    return reqs;
  },

  // Booking odds: 50% + 3% x (reputation - required) + Networking / 4 % + venue relationship / 5 %,
  // kept between 5% and 95%.
  acceptanceChance: function (state, venue, deal) {
    var v = Game.balance.venues;
    var rel = state.venues[venue.id].relationship;
    var chance = v.bookingBaseChance +
      v.bookingPerReputationPoint * (state.player.reputation - Game.rules.booking.requiredReputation(venue, deal)) +
      state.player.skills.networking / v.bookingNetworkingDivisor / 100 +
      rel / v.bookingRelationshipDivisor / 100;
    return Game.util.clamp(chance, v.bookingMinChance, v.bookingMaxChance);
  },

  // The days you can ask for: inside the venue's booking window and your booking horizon (4 weeks, or 12
  // with a manager). Each is { day, free, why }.
  bookingDates: function (state, venue) {
    var w = Game.balance.venues.tiers[venue.tier].bookAhead;
    var last = Math.min(state.day + w.max, Game.rules.manager.horizonDay(state));
    var dates = [];
    for (var d = state.day + w.min; d <= last; d++) {
      var taken = Game.rules.booking.dateProblem(state, venue, d);
      dates.push({ day: d, free: !taken, why: taken });
    }
    return dates;
  },

  // Why a show at this venue can't be on this date, or null: outside its window or your horizon, the block
  // is taken, or (out of town) the travel doesn't fit (see Game.rules.travel.check).
  dateProblem: function (state, venue, day) {
    var w = Game.balance.venues.tiers[venue.tier].bookAhead;
    if (!w || day < state.day + w.min || day > state.day + w.max) return 'Outside ' + venue.name + '\'s booking window.';
    if (day > Game.rules.manager.horizonDay(state)) {
      return 'You can only book ' + Game.rules.manager.calendarWeeks(state) + ' weeks ahead' +
        (Game.rules.manager.hired(state) ? '' : ' (' + Game.balance.time.managerBookingWeeks + ' with a manager)') + '.';
    }
    var away = venue.cityId !== 'hometown';
    var taken = Game.rules.booking.blockTaken(state, day, venue.showBlock, away);
    if (!taken && away) taken = Game.rules.travel.check(state, venue.id, day).problem;
    return taken || null;
  },

  // Why a block is already taken (a show, studio time, session work, travel, being away on a trip, or a
  // pending request or offer for it), or null if it's free. ignoreAway: true to skip the "away on a trip"
  // check (used for out-of-town shows, which can join a trip).
  blockTaken: function (state, day, block, ignoreAway) {
    var plan = state.schedule[day];
    var entry = plan && plan[block] && state.entries[plan[block]];
    if (entry && entry.type === 'gig') return 'Show booked at ' + Game.content.venues[entry.venueId].name;
    if (entry && entry.type === 'studio') return 'Studio time booked';
    if (entry && entry.type === 'sessionWork') return 'Session work booked';
    if (entry && entry.type === 'travel') return 'Travelling';
    if (!ignoreAway && Game.rules.travel.tripAt(state, day, block)) return 'On the road';
    var pending = Object.keys(state.requests).map(function (id) { return state.requests[id]; }).filter(function (r) {
      return r.status === 'pending' && r.gigDay === day && Game.content.venues[r.venueId].showBlock === block;
    })[0];
    if (pending) return 'Waiting to hear from ' + Game.content.venues[pending.venueId].name;
    var offer = state.inbox.filter(function (m) {
      return !m.resolved && m.kind === 'reply' && m.data.yes && m.data.gigDay === day && Game.content.venues[m.data.venueId].showBlock === block;
    })[0];
    if (offer) return 'Offer waiting in your inbox';
    return null;
  },

  // What's in one block of a day (for the Calendar grid). Returns one of:
  //   { kind: 'show' | 'studio' | 'sessionWork' | 'travel' | 'plan', entry }   something booked or planned there
  //   { kind: 'away', trip }                        free, but you're away on a trip
  //   { kind: 'pending', reason }                   held for a booking reply or an offer (reason from blockTaken)
  //   { kind: 'job' } or { kind: 'off', offKind }   a day-job block (or a day off: 'vacation', 'sick', 'skip')
  //   { kind: 'free' }
  blockContents: function (state, day, block) {
    var plan = state.schedule[day];
    var entry = plan && plan[block] && state.entries[plan[block]];
    if (entry) return { kind: { gig: 'show', studio: 'studio', sessionWork: 'sessionWork', travel: 'travel', action: 'plan' }[entry.type], entry: entry };
    var trip = Game.rules.travel.tripAt(state, day, block);
    if (trip) return { kind: 'away', trip: trip };
    var waiting = Game.rules.booking.blockTaken(state, day, block);
    if (waiting) return { kind: 'pending', reason: waiting };
    if (Game.rules.job.scheduledOn(state, day) && Game.balance.job.jobBlocks.indexOf(block) !== -1) {
      var off = state.player.job.daysOff[day];
      return off ? { kind: 'off', offKind: off } : { kind: 'job' };
    }
    return { kind: 'free' };
  },

  // Why you can't send a booking request, or null if you can.
  requestProblem: function (state, venueId, gigDay, deal) {
    var venue = Game.content.venues[venueId];
    if (!venue || venue.tier === 0) return 'Pick a venue.';
    if (Game.rules.booking.dealsFor(venue).indexOf(deal) === -1) return 'Pick a deal.';
    var vs = state.venues[venueId];
    if (vs.bannedUntilDay !== null && state.day < vs.bannedUntilDay) {
      return venue.name + ' won\'t book you until ' + Game.rules.day.dateLabel(vs.bannedUntilDay) + ' (you didn\'t show up).';
    }
    if (vs.pendingRequestId) return 'You already have a request out to ' + venue.name + '.';
    var unmet = Game.rules.booking.requirements(state, venue, deal).filter(function (r) { return !r.met; })[0];
    if (unmet) return 'Needs ' + unmet.text + '.';
    var problem = Game.rules.booking.dateProblem(state, venue, gigDay);
    if (problem) return /window|weeks ahead/.test(problem) ? problem : problem.replace(/\.$/, '') + ' that day.';
    return null;
  },

  // A suggested setlist for a show: the best songs by quality + tightness (covers only for a cover night).
  suggestSetlist: function (state, venue, deal) {
    var set = Game.rules.booking.setFor(venue, deal);
    return Game.rules.songs.playable(state)
      .filter(function (s) { return !set.coversOnly || s.isCover; })
      .sort(function (a, b) { return (b.quality + b.tightness) - (a.quality + a.tightness); })
      .slice(0, set.size)
      .map(function (s) { return s.id; });
  },

  // Why a setlist doesn't work for a show, or null if it's fine.
  setlistProblem: function (state, venue, deal, songIds) {
    var set = Game.rules.booking.setFor(venue, deal);
    var problem = Game.rules.gigs.setProblem(state, songIds, set.size);
    if (problem) return problem;
    if (set.coversOnly && songIds.some(function (id) { return !state.songs[id].isCover; })) return 'A cover night is covers only.';
    return null;
  },

  // What a show pays (before splitting with the band).
  //   guarantee: the flat fee     door: crowd x ticket price x door share
  //   coverNight: the cover-night fee     inStore: nothing
  //   opening, residency: the agreed fee (passed in)
  payFor: function (venue, deal, crowd, fee) {
    var tier = Game.balance.venues.tiers[venue.tier];
    if (deal === 'opening' || deal === 'residency' || deal === 'arena' || deal === 'festival') return fee || 0;
    if (deal === 'guarantee') return venue.deals.guarantee;
    if (deal === 'door') return Math.round(crowd * tier.ticket * tier.doorShare);
    if (deal === 'coverNight') return Game.balance.economy.coverGigFee;
    return 0;
  },

  // A plain description of a deal, like "$60 guarantee" or "70% of the door ($8 tickets)".
  dealLabel: function (venue, deal, fee) {
    var tier = Game.balance.venues.tiers[venue.tier];
    if (deal === 'opening') return 'Opening slot: $' + fee + ' flat, their crowd';
    if (deal === 'residency') return 'Residency: $' + fee + ' a night';
    if (deal === 'arena') return 'Arena headliner: $' + Number(fee).toLocaleString() + ' flat';
    if (deal === 'festival') return 'Festival slot: $' + Number(fee).toLocaleString() + ' flat';
    if (deal === 'guarantee') return '$' + venue.deals.guarantee + ' guarantee';
    if (deal === 'door') return Math.round(tier.doorShare * 100) + '% of the door ($' + tier.ticket + ' tickets)';
    if (deal === 'coverNight') return 'Cover night: $' + Game.balance.economy.coverGigFee + ' flat, covers only';
    if (deal === 'openMic') return 'Open mic: tip jar, new fans';
    return 'In-store: no pay, good for fans';
  },

  // Production (sound and lights) for a show: theaters and arenas pay 25% of the show's pay (before splits),
  // up to $1,000 (theater) or $5,000 (arena), on the night. Festivals provide their own. Smaller rooms: none.
  // pay: the show's pay; left out, it's the most it could cost.
  productionCost: function (venue, deal, pay) {
    var p = Game.balance.production;
    if (deal === 'festival' || venue.festival) return p.festival;
    var cap = venue.tier === 3 ? p.theater : (venue.tier === 4 ? p.arena : 0);
    if (pay === undefined) return cap;
    return Math.min(cap, Math.round(pay * p.share));
  },

  // The penalties for cancelling a show this many days ahead (or a no-show).
  cancelPenalty: function (daysAhead) {
    var c = Game.balance.cancellations;
    return daysAhead >= c.earlyNoticeDays ? c.early : c.late;
  },

  // Why a booked show would be a no-show, or null: no energy left, or (clubs and bigger) not enough
  // people on stage, counting session players. Openers don't need a full band.
  noShowReason: function (state, entry, energy) {
    if (energy <= 0) return 'you had no energy left.';
    var venue = Game.content.venues[entry.venueId];
    var needed = Game.balance.venues.tiers[venue.tier].minOnStage;
    var onStage = 1 + state.band.memberIds.length + (entry.sessionPlayers || 0);
    if (entry.deal !== 'opening' && onStage < needed) {
      return 'the room needs ' + needed + ' on stage and you only had ' + onStage + '.';
    }
    return null;
  },

  // ----- Changing things (each returns a new state) -----

  // Emails a venue right now (no block needed: send as many as you like). Costs a little energy.
  // The reply comes 1 to 3 days later. Returns { state, log }.
  emailVenue: function (state, venueId, gigDay, deal) {
    var cost = Game.balance.energy.cost.email;
    var problem = Game.rules.booking.requestProblem(state, venueId, gigDay, deal);
    if (problem) return { state: state, log: [problem] };
    if (state.player.energy < cost) return { state: state, log: ['You\'re too tired to write an email (it takes ' + cost + ' energy).'] };
    var sent = Game.rules.booking.sendRequest(state, venueId, gigDay, deal);
    var s = sent.state;
    s.player.energy = Game.rules.energy.clamp(s.player.energy - cost);
    return { state: s, log: [sent.log[0].replace(/\.$/, '') + ' (-' + cost + ' energy). The reply comes in ' +
      Game.balance.venues.replyDays.min + ' to ' + Game.balance.venues.replyDays.max + ' days.'] };
  },

  // Sends a booking email (Game.rules.booking.emailVenue is what the player uses: it also costs energy).
  // The reply comes 1 to 3 days later. Returns { state, log }.
  sendRequest: function (state, venueId, gigDay, deal) {
    var problem = Game.rules.booking.requestProblem(state, venueId, gigDay, deal);
    if (problem) return { state: state, log: ['Didn\'t send the email: ' + problem] };
    var v = Game.balance.venues;
    var venue = Game.content.venues[venueId];
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var replyDay = s.day + rng.int(v.replyDays.min, v.replyDays.max);
    s.rngState = rng.getState();
    var id = 'r' + s.nextRequestId;
    s.nextRequestId += 1;
    s.requests[id] = {
      id: id, venueId: venueId, gigDay: gigDay, deal: deal,
      chance: Game.rules.booking.acceptanceChance(s, venue, deal),
      sentDay: s.day, replyDay: replyDay, status: 'pending'
    };
    s.venues[venueId].pendingRequestId = id;
    return { state: s, log: ['Emailed ' + venue.name + ' about ' + Game.rules.day.dateLabel(gigDay) + '.'] };
  },

  // Adds a message to the inbox. Returns the new state.
  addInbox: function (state, kind, data, expiresDay) {
    var s = Game.util.clone(state);
    var id = 'm' + s.nextInboxId;
    s.nextInboxId += 1;
    s.inbox.push({ id: id, day: s.day, kind: kind, templateId: null, data: data, expiresDay: expiresDay, resolved: false, read: false });
    return s;
  },

  // Each night: venues answer requests whose reply day has come. A yes is an offer to accept
  // (within 3 days and before the show); a no is just a note. Returns { state, log }.
  processReplies: function (state) {
    var b = Game.balance.venues;
    var s = Game.util.clone(state);
    var log = [];
    Object.keys(s.requests).forEach(function (id) {
      var r = s.requests[id];
      if (r.status !== 'pending' || r.replyDay > s.day) return;
      var venue = Game.content.venues[r.venueId];
      var rng = Game.rng.create(s.rngState);
      var yes = s.debug.acceptNextBooking ? true : rng.chance(r.chance);
      s.rngState = rng.getState();
      s.debug.acceptNextBooking = false;
      r.status = 'answered';
      s.venues[r.venueId].pendingRequestId = null;
      var expires = Math.min(s.day + b.offerExpiryDays, r.gigDay - 1);
      s = Game.rules.booking.addInbox(s, 'reply',
        { venueId: r.venueId, gigDay: r.gigDay, deal: r.deal, yes: yes, chance: r.chance, byManager: !!r.byManager },
        yes ? expires : null);
      log.push(venue.name + (yes ? ' said yes! Accept the show in your Inbox.' : ' said no this time.'));
    });
    return { state: s, log: log };
  },

  // Each night: offers you didn't answer in time go away. Returns { state, log }.
  expireOffers: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    s.inbox.forEach(function (m) {
      if (!m.resolved && m.expiresDay !== null && m.expiresDay < s.day) {
        m.resolved = 'expired';
        log.push('The offer from ' + (m.data.venueId ? Game.content.venues[m.data.venueId].name : m.data.bandName) + ' expired.');
      }
    });
    return { state: s, log: log };
  },

  // Why you can't accept an offer, or null if you can.
  // jobChoice: 'vacation' | 'sick' | 'skip' when the show (or its trip) lands on work hours, else null.
  acceptProblem: function (state, messageId, jobChoice) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || !m.data.yes) return 'That offer isn\'t open.';
    var venue = Game.content.venues[m.data.venueId];
    var without = Game.rules.booking.withoutMessage(state, messageId);
    var away = venue.cityId !== 'hometown';
    var taken = Game.rules.booking.blockTaken(without, m.data.gigDay, venue.showBlock, away);
    if (taken) return taken + ' that day.';
    if (away) return Game.rules.travel.jobProblem(state, Game.rules.travel.check(without, venue.id, m.data.gigDay, m.data.deal), jobChoice);
    if (Game.rules.booking.clashesWithJob(state, m.data.gigDay, venue.showBlock)) {
      if (!jobChoice) return 'This show is during your day job. Choose a vacation day, calling in sick, or skipping work.';
      return Game.rules.job.dayOffProblem(state, m.data.gigDay, jobChoice, true);
    }
    return null;
  },

  // The state with one inbox message ignored (so an offer doesn't block its own date).
  withoutMessage: function (state, messageId) {
    var s = Game.util.clone(state);
    s.inbox = s.inbox.filter(function (m) { return m.id !== messageId; });
    return s;
  },

  // The workdays accepting an offer would need off: the show's day for a hometown show on work hours,
  // or every workday an out-of-town trip keeps you away.
  offerJobDays: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var venue = Game.content.venues[m.data.venueId];
    if (venue.cityId !== 'hometown') {
      return Game.rules.travel.check(Game.rules.booking.withoutMessage(state, messageId), venue.id, m.data.gigDay, m.data.deal).jobDays;
    }
    return Game.rules.booking.clashesWithJob(state, m.data.gigDay, venue.showBlock) ? [m.data.gigDay] : [];
  },

  // True if a show in this block would land on a day-job block.
  clashesWithJob: function (state, day, block) {
    return Game.rules.job.worksOn(state, day) && Game.balance.job.jobBlocks.indexOf(block) !== -1;
  },

  // Accepts an offer: the show goes on the calendar with a suggested setlist.
  // Returns { state, log, entryId }.
  acceptOffer: function (state, messageId, jobChoice) {
    var problem = Game.rules.booking.acceptProblem(state, messageId, jobChoice);
    if (problem) return { state: state, log: [problem], entryId: null };
    var s = Game.util.clone(state);
    var m = s.inbox.filter(function (x) { return x.id === messageId; })[0];
    var venue = Game.content.venues[m.data.venueId];
    if (venue.cityId !== 'hometown') {
      // Out of town: the show and its travel go on the calendar together.
      var added = Game.rules.travel.addShow(s, venue.id, m.data.gigDay, m.data.deal, jobChoice);
      s = added.state;
      s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; } });
      return { state: s, log: ['Booked: ' + venue.name + ' in ' + Game.content.cities[venue.cityId].name + ', ' + Game.rules.day.dateLabel(m.data.gigDay) +
        '. Travel is on your Calendar.'].concat(added.log), entryId: added.entryId };
    }
    if (Game.rules.booking.clashesWithJob(s, m.data.gigDay, venue.showBlock)) {
      s = Game.rules.job.takeDayOff(s, m.data.gigDay, jobChoice, true).state;
      m = s.inbox.filter(function (x) { return x.id === messageId; })[0];
    }
    m.resolved = 'accepted';
    m.read = true;
    // A task planned in that block gives way to the show.
    var log = [];
    var plannedId = s.schedule[m.data.gigDay] && s.schedule[m.data.gigDay][venue.showBlock];
    if (plannedId && s.entries[plannedId] && s.entries[plannedId].type === 'action') {
      log.push('The show replaces your planned ' + Game.content.actions[s.entries[plannedId].actionId].name + ' that ' +
        Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + '.');
      delete s.entries[plannedId];
    }
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    s.entries[id] = {
      id: id, day: m.data.gigDay, block: venue.showBlock, type: 'gig', venueId: venue.id, deal: m.data.deal,
      songIds: Game.rules.booking.suggestSetlist(s, venue, m.data.deal), sessionPlayers: 0, status: 'booked'
    };
    s.schedule[m.data.gigDay] = s.schedule[m.data.gigDay] || {};
    s.schedule[m.data.gigDay][venue.showBlock] = id;
    return { state: s, log: ['Booked: ' + venue.name + ', ' + Game.rules.day.dateLabel(m.data.gigDay) + '.'].concat(log), entryId: id };
  },

  // A fill-in show (from an event): booked straight onto the calendar with the venue's guarantee,
  // no booking odds. A task planned in that block gives way. Returns { state, log, entryId }.
  bookFillIn: function (state, venueId, day) {
    var venue = Game.content.venues[venueId];
    var s = Game.util.clone(state);
    var log = [];
    var plannedId = s.schedule[day] && s.schedule[day][venue.showBlock];
    if (plannedId && s.entries[plannedId] && s.entries[plannedId].type === 'action') {
      log.push('The show replaces your planned ' + Game.content.actions[s.entries[plannedId].actionId].name + '.');
      delete s.entries[plannedId];
    }
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    s.entries[id] = {
      id: id, day: day, block: venue.showBlock, type: 'gig', venueId: venueId, deal: 'guarantee',
      songIds: Game.rules.booking.suggestSetlist(s, venue, 'guarantee'), sessionPlayers: 0, status: 'booked', fillIn: true
    };
    s.schedule[day] = s.schedule[day] || {};
    s.schedule[day][venue.showBlock] = id;
    log.unshift('Booked: fill-in show at ' + venue.name + ', ' + Game.rules.day.dateLabel(day) + '. Check the setlist on the Calendar.');
    return { state: s, log: log, entryId: id };
  },

  // Declines an offer (no penalty). Returns { state, log }.
  declineOffer: function (state, messageId) {
    var s = Game.util.clone(state);
    s.inbox.forEach(function (m) { if (m.id === messageId) { m.resolved = 'declined'; m.read = true; } });
    return { state: s, log: [] };
  },

  // Marks every inbox message as read (when the Inbox screen opens).
  markAllRead: function (state) {
    var s = Game.util.clone(state);
    s.inbox.forEach(function (m) { m.read = true; });
    return { state: s, log: [] };
  },

  // How many inbox messages you haven't seen yet.
  unreadCount: function (state) {
    return state.inbox.filter(function (m) { return !m.read; }).length;
  },

  // Every booked show still to come, soonest first.
  upcomingShows: function (state) {
    return Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'gig' && e.day >= state.day; })
      .sort(function (a, b) { return a.day - b.day; });
  },

  // Changes a booked show's setlist. Returns { state, log }.
  setSetlist: function (state, entryId, songIds) {
    var e = state.entries[entryId];
    var venue = Game.content.venues[e.venueId];
    var problem = Game.rules.booking.setlistProblem(state, venue, e.deal, songIds);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    s.entries[entryId].songIds = songIds.slice();
    return { state: s, log: [] };
  },

  // Hires (+1) or lets go (-1) a session player for a booked show. Each costs $75 when hired
  // (refunded if you let them go before the show). The band can't go over 4 plus you.
  changeSessionPlayers: function (state, entryId, change) {
    var b = Game.balance;
    var e = state.entries[entryId];
    var room = b.people.maxBandMembers - state.band.memberIds.length;
    var next = e.sessionPlayers + change;
    if (next < 0) return { state: state, log: [] };
    if (next > room) return { state: state, log: ['There\'s no room on stage for another player.'] };
    var s = Game.util.clone(state);
    s.entries[entryId].sessionPlayers = next;
    if (change > 0) s = Game.rules.money.spend(s, b.economy.sessionPlayerFee, 'sessionPlayers').state;
    else s = Game.rules.money.earn(s, b.economy.sessionPlayerFee, 'sessionRefund').state;
    return { state: s, log: [] };
  },

  // Applies the cancellation or no-show penalties to the venue, your reputation, your bandmates,
  // and your morale. which: 'early' | 'late' | 'noShow'. Returns { state, log }.
  applyPenalty: function (state, venueId, which) {
    var b = Game.balance;
    var p = b.cancellations[which];
    var s = Game.util.clone(state);
    var vs = s.venues[venueId];
    vs.relationship = Game.util.clamp(vs.relationship + p.venueRelationship, b.venues.relationshipMin, b.venues.relationshipMax);
    if (p.banDays) vs.bannedUntilDay = s.day + p.banDays;
    s.player.reputation = Game.util.clamp(s.player.reputation + p.reputation, 0, b.reputation.max);
    if (p.bandSatisfaction) {
      Game.rules.people.members(s).forEach(function (m) {
        s = Game.rules.people.changeSatisfaction(s, m.id, p.bandSatisfaction, which === 'noShow' ? 'You didn\'t show up to a gig' : 'You cancelled a gig').state;
      });
    }
    var morale = Game.rules.morale.change(s, b.morale.change.cancelGig);
    s = morale.state;
    var name = Game.content.venues[venueId].name;
    var parts = [name + ' relationship ' + p.venueRelationship];
    if (p.reputation) parts.push('reputation ' + p.reputation);
    if (p.bandSatisfaction) parts.push('bandmates ' + p.bandSatisfaction + ' satisfaction');
    parts.push('morale ' + b.morale.change.cancelGig);
    if (p.banDays) parts.push('banned for ' + p.banDays + ' days');
    return { state: s, log: [parts.join(', ') + '.'].concat(morale.log) };
  },

  // Cancels a booked show. 7+ days ahead costs less than late. Session players are refunded,
  // and a day off taken for the show is given back. Returns { state, log }.
  cancelShow: function (state, entryId) {
    var e = state.entries[entryId];
    if (!e || e.type !== 'gig') return { state: state, log: ['That show isn\'t booked.'] };
    var ahead = e.day - state.day;
    var which = ahead >= Game.balance.cancellations.earlyNoticeDays ? 'early' : 'late';
    var s = Game.util.clone(state);
    if (e.sessionPlayers) s = Game.rules.money.earn(s, e.sessionPlayers * Game.balance.economy.sessionPlayerFee, 'sessionRefund').state;
    delete s.entries[entryId];
    delete s.schedule[e.day][e.block];
    // The days this show kept you away (its trip, if it's out of town), to give back days off it needed.
    var tr = Game.rules.travel;
    var trip = Object.keys(s.trips).map(function (id) { return s.trips[id]; }).filter(function (x) { return x.showIds.indexOf(entryId) !== -1; })[0];
    var days = [e.day];
    if (trip) {
      for (var d = tr.slotDay(trip.startT); d <= tr.slotDay(trip.endT); d++) days.push(d);
      if (tr.started(s, trip)) {
        trip.showIds = trip.showIds.filter(function (id) { return id !== entryId; }); // the trip goes ahead as planned
      } else {
        var rebuilt = tr.rebuild(s);
        if (rebuilt.problems.length) trip.showIds = trip.showIds.filter(function (id) { return id !== entryId; });
        else s = rebuilt.state;
      }
    }
    // Give back a day off taken for it (unless something else that day still needs it).
    days.forEach(function (d) {
      if (d >= s.day && s.player.job.daysOff[d] && !Game.rules.job.dayOffNeeded(s, d)) s = Game.rules.job.cancelDayOff(s, d).state;
    });
    var penalty = Game.rules.booking.applyPenalty(s, e.venueId, which);
    return { state: penalty.state, log: ['Cancelled the show at ' + Game.content.venues[e.venueId].name + '. '].concat(penalty.log) };
  },

  // Plays a booked show in its block (called at End Day). At 0 energy it's a no-show.
  // energy: your energy at the start of the block. Returns { state, gig, log, noShow }.
  // Clubs and bigger also need enough people on stage on the night (session players can cover); an opener doesn't.
  playShow: function (state, entry, energy) {
    var why = Game.rules.booking.noShowReason(state, entry, energy);
    if (why) {
      var penalty = Game.rules.booking.applyPenalty(state, entry.venueId, 'noShow');
      return { state: penalty.state, gig: null, noShow: true,
        log: ['No-show at ' + Game.content.venues[entry.venueId].name + ': ' + why + ' '].concat(penalty.log) };
    }
    var venue = Game.content.venues[entry.venueId];
    var songIds = entry.songIds;
    if (Game.rules.booking.setlistProblem(state, venue, entry.deal, songIds)) {
      songIds = Game.rules.booking.suggestSetlist(state, venue, entry.deal);
    }
    var o = Game.balance.offers;
    var played = Game.rules.gigs.playGig(state, entry.venueId, songIds, energy, {
      deal: entry.deal, sessionPlayers: entry.sessionPlayers, fee: entry.fee,
      crowdShare: entry.deal === 'opening' ? o.openingSlot.crowdShare                // the headliner's crowd
        : (entry.deal === 'festival' ? Game.balance.bigOffers.festivalCrowdShare : null), // a festival crowd
      fanRate: (entry.deal === 'opening' ? o.openingSlotFanRate : 1) *              // their fans, at half the rate
        (Game.rules.travel.isTourShow(state, entry) ? 1 + Game.balance.tours.fanBonus : 1), // word of mouth on tour: more new fans
      crowdFloor: entry.deal === 'residency' ? o.residency.crowdFloor : null      // regulars come back
    });
    var after = Game.rules.travel.afterShow(played.state, entry); // out of town: tours, unlocks, your van
    var s = after.state;
    var log = played.log.concat(after.log);
    // Theaters and arenas: production (sound and lights), paid on the night.
    var production = Game.rules.booking.productionCost(venue, entry.deal, played.gig.rewards.pay + played.gig.rewards.managerCut);
    // The Finances screen's show record: its trip (if out of town), tour, and production.
    var trip = Object.keys(state.trips).filter(function (id) { return state.trips[id].showIds.indexOf(entry.id) !== -1; })[0] || null;
    var record = s.finances && s.finances.shows[s.finances.shows.length - 1];
    if (record && record.day === s.day && record.venueId === entry.venueId) {
      record.tripId = trip;
      record.tour = Game.rules.travel.isTourShow(state, entry);
      record.production = production;
    }
    if (production > 0) {
      var paid = Game.rules.money.spend(s, production, 'production');
      s = paid.state;
      log.push('Production (sound and lights): -$' + production.toLocaleString() + '.');
      log = log.concat(paid.log);
    }
    return { state: s, gig: played.gig, log: log, noShow: false };
  }
};
