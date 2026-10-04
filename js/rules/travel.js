// travel.js
// Going on the road (Phase 11): trips to out-of-town shows, the travel blocks they need, gas and hotels,
// leaving home (and not making it), tours, vans, road fatigue, and which cities are unlocked.
//
// How trips work:
//   - Booking an out-of-town show books its travel for you. A trip is: home -> first city, then city to city,
//     then back home. Each one-way leg takes the blocks right before the next show (or right after the last
//     one), as many as the farther city's distance needs (Near 1, Mid 2, Far 3).
//   - Shows close together (within balance.travel.chainWithinDays, or too close to go home in between) are one
//     trip: you drive straight from city to city and stay in hotels.
//   - Travel blocks are calendar entries { type: 'travel', tripId, from, to, legStart }.
//     Trips are kept in state.trips[id] = { id, showIds, cities, startT, endT, needsVan }.
//   - Time is counted in "slots": day x 3 + block (morning 0, afternoon 1, evening 2), so a trip's
//     startT and endT are its first and last travel slots. You're "away" from startT to endT.
//   - Once a trip has started (its first travel day is over), it's fixed; trips that haven't started are
//     rebuilt whenever an out-of-town show is booked or cancelled.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.travel = {

  // ----- Time slots -----

  slot: function (day, block) {
    var blocks = Game.balance.time.blocks;
    return day * blocks.length + blocks.indexOf(block);
  },
  slotDay: function (t) { return Math.floor(t / Game.balance.time.blocks.length); },
  slotBlock: function (t) { var blocks = Game.balance.time.blocks; return blocks[t % blocks.length]; },
  // The first slot of a day.
  dayStart: function (day) { return day * Game.balance.time.blocks.length; },

  // ----- Cities and distances -----

  // The order regions sit in, from home outward (flights aren't driven).
  regionOrder: ['hometown', 'near', 'mid', 'far'],

  cityOfVenue: function (venueId) { return Game.content.venues[venueId].cityId; },
  isOutOfTown: function (venueId) { return Game.content.venues[venueId].cityId !== 'hometown'; },

  // The region that sets a leg's distance and gas: the farther of the two cities.
  legRegion: function (fromCityId, toCityId) {
    var order = Game.rules.travel.regionOrder;
    var a = order.indexOf(Game.content.cities[fromCityId].region);
    var b = order.indexOf(Game.content.cities[toCityId].region);
    return order[Math.max(a, b)];
  },

  // Blocks of driving for one leg (0 if it's the same city).
  legBlocks: function (fromCityId, toCityId) {
    if (fromCityId === toCityId) return 0;
    return Game.balance.travel.blocksEachWay[Game.rules.travel.legRegion(fromCityId, toCityId)];
  },

  // Gas for one leg: half the round trip of the farther city.
  legGas: function (fromCityId, toCityId) {
    if (fromCityId === toCityId) return 0;
    return Game.balance.travel.gasRoundTrip[Game.rules.travel.legRegion(fromCityId, toCityId)] / 2;
  },

  // ----- Cities unlocking -----

  // Why a city isn't open to you yet, or null if it is (or would be now).
  cityUnlockProblem: function (state, cityId) {
    var g = Game.balance.geography;
    var region = Game.content.cities[cityId].region;
    var rep = state.player.reputation;
    var need = [];
    if (region === 'hometown') return null;
    if (region === 'near' && rep < g.nearMinReputation) need.push('reputation ' + g.nearMinReputation + ' (you have ' + Math.floor(rep) + ')');
    if (region === 'mid') {
      if (rep < g.midMinReputation) need.push('reputation ' + g.midMinReputation + ' (you have ' + Math.floor(rep) + ')');
      if (!Game.rules.travel.playedRegion(state, 'near')) need.push('a show in a Near city');
    }
    if (region === 'far') {
      if (rep < g.farMinReputation) need.push('reputation ' + g.farMinReputation + ' (you have ' + Math.floor(rep) + ')');
      if (!state.player.gear.van) need.push('a van (in the Shop)');
    }
    if (region === 'national') return 'Needs a manager and a label (coming in a later phase).';
    if (region === 'international') return 'Needs a major nationwide tour first (coming in a later phase).';
    return need.length ? 'Needs ' + need.join(' and ') + '.' : null;
  },

  // True if you've played a show in any city of a region.
  playedRegion: function (state, region) {
    return Object.keys(state.stats.citiesPlayed).some(function (id) {
      return Game.content.cities[id].region === region && state.stats.citiesPlayed[id] > 0;
    });
  },

  // Unlocks any city whose rule is now met (once unlocked, a city stays open). Mid and Far cities get a
  // banner (Near cities are announced by milestone 10). Returns { state, log }.
  updateCityUnlocks: function (state) {
    var s = Game.util.clone(state);
    var log = [];
    var opened = {};
    Object.keys(Game.content.cities).forEach(function (id) {
      if (s.cities[id].unlocked || Game.rules.travel.cityUnlockProblem(s, id)) return;
      s.cities[id].unlocked = true;
      var region = Game.content.cities[id].region;
      opened[region] = (opened[region] || []).concat(Game.content.cities[id].name);
    });
    ['mid', 'far'].forEach(function (region) {
      if (!opened[region]) return;
      var text = (region === 'mid' ? 'Mid cities' : 'Far cities') + ' unlocked: ' + opened[region].join(', ') +
        '. Open the Map or Book to play there.';
      s.toasts.push({ id: 'cities-' + region, text: text });
      log.push(text);
    });
    return { state: s, log: log };
  },

  // ----- Vans -----

  // The van you own (or null). A van marked "worn" is on its last trip: it gets you home, then it's gone.
  van: function (state) { return state.player.gear.van || null; },

  // Shows left before your van breaks down (null = never; 0 = no van).
  vanShowsLeft: function (state) {
    var van = Game.rules.travel.van(state);
    if (!van) return 0;
    var max = Game.balance.vans[van.kind].maxShows;
    return max === null ? null : Math.max(0, max - van.shows);
  },

  // ----- Tours -----

  // Days of every out-of-town show: played so far, plus booked ones still to come.
  outOfTownDays: function (state) {
    var booked = Game.rules.travel.outOfTownShows(state).map(function (e) { return e.day; });
    return state.stats.outOfTownShowDays.concat(booked).sort(function (a, b) { return a - b; });
  },

  // True if a show on this day is part of a tour: 3+ out-of-town shows within 10 days (the day included).
  isTour: function (days, day) {
    var t = Game.balance.tours;
    for (var start = day - t.withinDays + 1; start <= day; start++) {
      var count = days.filter(function (d) { return d >= start && d < start + t.withinDays; }).length;
      if (count >= t.minShows) return true;
    }
    return false;
  },

  // True if you've played a tour: 3+ out-of-town shows within 10 days (milestone 13).
  playedTour: function (state) {
    var days = state.stats.outOfTownShowDays;
    return days.some(function (d) { return Game.rules.travel.isTour(days, d); });
  },

  // Why booking an out-of-town show on this day needs a van you don't have, or null.
  // A van is needed for Far cities with a band, and for any tour.
  vanProblem: function (state, venueId, day) {
    if (state.player.gear.van) return null;
    var region = Game.content.cities[Game.rules.travel.cityOfVenue(venueId)].region;
    if (region === 'far' && state.band.memberIds.length) return 'A Far city with a band needs a van (in the Shop).';
    var days = Game.rules.travel.outOfTownDays(state).concat([day]);
    if (Game.rules.travel.isTour(days, day)) return 'That would make it a tour (3+ out-of-town shows in 10 days): you need a van (in the Shop).';
    return null;
  },

  // ----- Laying out trips -----

  // Booked out-of-town shows still to come, in time order.
  outOfTownShows: function (state) {
    var tr = Game.rules.travel;
    return Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'gig' && e.day >= state.day && tr.isOutOfTown(e.venueId); })
      .sort(function (a, b) { return tr.slot(a.day, a.block) - tr.slot(b.day, b.block); });
  },

  // True once a trip's first travel day is over (then it's fixed).
  started: function (state, trip) {
    return trip.startT < Game.rules.travel.dayStart(state.day);
  },

  // The trip you're away on at a given time (from its first to its last travel block), or null.
  tripAt: function (state, day, block) {
    var t = Game.rules.travel.slot(day, block);
    var ids = Object.keys(state.trips);
    for (var i = 0; i < ids.length; i++) {
      var trip = state.trips[ids[i]];
      if (trip.startT <= t && t <= trip.endT) return trip;
    }
    return null;
  },

  // True if you're away (or travelling) at any point of a day.
  awayOnDay: function (state, day) {
    return Game.balance.time.blocks.some(function (block) { return !!Game.rules.travel.tripAt(state, day, block); });
  },

  // Groups the out-of-town shows that aren't on a started trip into trips, and lays out their travel.
  // Returns { trips: [{ showIds, cities, legs: [{ from, to, slots }], startT, endT }], problems: [text] }.
  layout: function (state) {
    var tr = Game.rules.travel;
    var b = Game.balance.travel;
    var locked = {};
    Object.keys(state.trips).forEach(function (id) {
      if (tr.started(state, state.trips[id])) state.trips[id].showIds.forEach(function (sid) { locked[sid] = true; });
    });
    var shows = tr.outOfTownShows(state).filter(function (e) { return !locked[e.id]; });
    var groups = [];
    var problems = [];
    shows.forEach(function (e, i) {
      var prev = shows[i - 1];
      if (prev) {
        var gap = tr.slot(e.day, e.block) - tr.slot(prev.day, prev.block) - 1;
        var prevCity = tr.cityOfVenue(prev.venueId);
        var city = tr.cityOfVenue(e.venueId);
        var homeAndBack = tr.legBlocks(prevCity, 'hometown') + tr.legBlocks('hometown', city);
        if (e.day - prev.day <= b.chainWithinDays || gap < homeAndBack) {
          groups[groups.length - 1].push(e);
          return;
        }
      }
      groups.push([e]);
    });

    var trips = groups.map(function (group) {
      var legs = [];
      var cities = group.map(function (e) { return tr.cityOfVenue(e.venueId); });
      group.forEach(function (e, i) {
        var from = i === 0 ? 'hometown' : cities[i - 1];
        var n = tr.legBlocks(from, cities[i]);
        var t = tr.slot(e.day, e.block);
        if (i > 0 && n > t - tr.slot(group[i - 1].day, group[i - 1].block) - 1) {
          problems.push('There isn\'t time to get from ' + Game.content.cities[from].name + ' to ' + Game.content.cities[cities[i]].name + ' for ' +
            Game.rules.day.dateLabel(e.day) + '.');
        }
        var slots = [];
        for (var k = n; k >= 1; k--) slots.push(t - k);
        if (n) legs.push({ from: from, to: cities[i], slots: slots });
      });
      var last = group[group.length - 1];
      var lastCity = cities[cities.length - 1];
      var back = [];
      for (var k = 1; k <= tr.legBlocks(lastCity, 'hometown'); k++) back.push(tr.slot(last.day, last.block) + k);
      legs.push({ from: lastCity, to: 'hometown', slots: back });
      return {
        showIds: group.map(function (e) { return e.id; }), cities: cities, legs: legs,
        startT: legs[0].slots[0], endT: back[back.length - 1]
      };
    });

    // Every trip must fit: it can't start in the past, and nothing else can be booked while you're away
    // (shows, studio time, session work, another trip). Planned tasks are fine (they give way).
    var now = tr.dayStart(state.day);
    trips.forEach(function (trip) {
      var first = Game.content.venues[state.entries[trip.showIds[0]].venueId];
      if (trip.startT < now) problems.push('It\'s too late to get to ' + Game.content.cities[first.cityId].name + ' for that show.');
      for (var t = trip.startT; t <= trip.endT; t++) {
        var day = tr.slotDay(t);
        var block = tr.slotBlock(t);
        var plan = state.schedule[day];
        var entry = plan && plan[block] && state.entries[plan[block]];
        if (entry && trip.showIds.indexOf(entry.id) === -1 && entry.type !== 'action' && entry.type !== 'travel') {
          problems.push('You\'d be on the road on ' + Game.rules.day.dateLabel(day) + ', but ' +
            (entry.type === 'gig' ? 'a show at ' + Game.content.venues[entry.venueId].name : (entry.type === 'studio' ? 'studio time' : 'session work')) +
            ' is booked then.');
          return;
        }
        var other = Object.keys(state.trips).map(function (id) { return state.trips[id]; }).filter(function (x) {
          return tr.started(state, x) && x.startT <= t && t <= x.endT;
        })[0];
        if (other) { problems.push('You\'re already on the road then.'); return; }
      }
    });
    return { trips: trips, problems: problems };
  },

  // Rebuilds the travel for every trip that hasn't started. Planned tasks in travel blocks are removed, and
  // so are tasks you can't do on the road during a trip. Returns { state, log, problems } (if there are
  // problems, the state comes back unchanged).
  rebuild: function (state) {
    var tr = Game.rules.travel;
    var s = Game.util.clone(state);
    Object.keys(s.trips).forEach(function (id) {
      if (tr.started(s, s.trips[id])) return;
      delete s.trips[id];
      Object.keys(s.entries).forEach(function (eid) {
        var e = s.entries[eid];
        if (e.type === 'travel' && e.tripId === id) { delete s.entries[eid]; delete s.schedule[e.day][e.block]; }
      });
    });
    var laid = tr.layout(s);
    if (laid.problems.length) return { state: state, log: laid.problems, problems: laid.problems };
    var log = [];
    laid.trips.forEach(function (trip) {
      var tripId = 'trip' + s.nextTripId;
      s.nextTripId += 1;
      var needsVan = trip.showIds.some(function (sid) {
        var e = s.entries[sid];
        var region = Game.content.cities[tr.cityOfVenue(e.venueId)].region;
        return (region === 'far' && s.band.memberIds.length > 0) || tr.isTour(tr.outOfTownDays(s), e.day);
      });
      s.trips[tripId] = { id: tripId, showIds: trip.showIds, cities: trip.cities, startT: trip.startT, endT: trip.endT, needsVan: needsVan };
      trip.legs.forEach(function (leg) {
        leg.slots.forEach(function (t, i) {
          var day = tr.slotDay(t);
          var block = tr.slotBlock(t);
          s.schedule[day] = s.schedule[day] || {};
          var planned = s.schedule[day][block] && s.entries[s.schedule[day][block]];
          if (planned && planned.type === 'action') {
            log.push('Travel replaces your planned ' + Game.content.actions[planned.actionId].name + ' (' + Game.rules.day.dateLabel(day) + ').');
            delete s.entries[planned.id];
          }
          var id = 'e' + s.nextEntryId;
          s.nextEntryId += 1;
          s.entries[id] = { id: id, day: day, block: block, type: 'travel', tripId: tripId, from: leg.from, to: leg.to, legStart: i === 0, status: 'booked' };
          s.schedule[day][block] = id;
        });
      });
      // Tasks planned while you're away that you can't do on the road are dropped.
      for (var t = trip.startT; t <= trip.endT; t++) {
        var d = tr.slotDay(t);
        var bl = tr.slotBlock(t);
        var e = s.schedule[d] && s.schedule[d][bl] && s.entries[s.schedule[d][bl]];
        if (e && e.type === 'action' && !Game.content.actions[e.actionId].onTheRoad) {
          log.push('You\'ll be on the road, so your planned ' + Game.content.actions[e.actionId].name + ' (' + Game.rules.day.dateLabel(d) + ') was removed.');
          delete s.entries[e.id];
          delete s.schedule[d][bl];
        }
      }
    });
    return { state: s, log: log, problems: [] };
  },

  // Workdays that a trip (one that hasn't started) keeps you away from, where you haven't taken the day off yet.
  jobDaysNeeded: function (state) {
    var tr = Game.rules.travel;
    var days = [];
    Object.keys(state.trips).forEach(function (id) {
      var trip = state.trips[id];
      if (tr.started(state, trip)) return;
      for (var t = trip.startT; t <= trip.endT; t++) {
        var day = tr.slotDay(t);
        if (Game.balance.job.jobBlocks.indexOf(tr.slotBlock(t)) !== -1 && Game.rules.job.worksOn(state, day) && days.indexOf(day) === -1) days.push(day);
      }
    });
    return days.sort(function (a, b) { return a - b; });
  },

  // Adds an out-of-town show to the calendar and rebuilds the travel (taking any days off with jobChoice).
  // Doesn't check booking rules (callers do). Returns { state, log, problems, entryId, jobDays }.
  addShow: function (state, venueId, day, deal, jobChoice) {
    var venue = Game.content.venues[venueId];
    var s = Game.util.clone(state);
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    var planned = s.schedule[day] && s.schedule[day][venue.showBlock];
    var log = [];
    if (planned && s.entries[planned] && s.entries[planned].type === 'action') {
      log.push('The show replaces your planned ' + Game.content.actions[s.entries[planned].actionId].name + '.');
      delete s.entries[planned];
    }
    s.entries[id] = {
      id: id, day: day, block: venue.showBlock, type: 'gig', venueId: venueId, deal: deal,
      songIds: Game.rules.booking.suggestSetlist(s, venue, deal), sessionPlayers: 0, status: 'booked'
    };
    s.schedule[day] = s.schedule[day] || {};
    s.schedule[day][venue.showBlock] = id;
    var built = Game.rules.travel.rebuild(s);
    if (built.problems.length) return { state: state, log: built.problems, problems: built.problems, entryId: null, jobDays: [] };
    s = built.state;
    var jobDays = Game.rules.travel.jobDaysNeeded(s);
    if (jobChoice) {
      jobDays.forEach(function (d) { s = Game.rules.job.takeDayOff(s, d, jobChoice, true).state; });
    }
    return { state: s, log: log.concat(built.log), problems: [], entryId: id, jobDays: jobDays };
  },

  // Why an out-of-town show on this day can't be booked (travel, van, or the city), or null. Also says
  // which workdays the trip would need off: { problem, jobDays }.
  check: function (state, venueId, day, deal) {
    var tr = Game.rules.travel;
    var cityId = tr.cityOfVenue(venueId);
    var taken = Game.rules.booking.blockTaken(state, day, Game.content.venues[venueId].showBlock, true);
    if (taken) return { problem: taken + ' that day.', jobDays: [] };
    if (!state.cities[cityId].unlocked) return { problem: tr.cityUnlockProblem(state, cityId) || 'That city isn\'t open to you yet.', jobDays: [] };
    var van = tr.vanProblem(state, venueId, day);
    if (van) return { problem: van, jobDays: [] };
    var added = tr.addShow(state, venueId, day, deal || 'guarantee', null);
    if (added.problems.length) return { problem: added.problems[0], jobDays: [] };
    return { problem: null, jobDays: added.jobDays };
  },

  // What the trip for a new out-of-town show would look like, for the Book screen and the Inbox:
  // { legs: [{ from, to, slots }], gas, hotelNights, hotelCost, energy, jobDays, problem }.
  preview: function (state, venueId, day, deal) {
    var tr = Game.rules.travel;
    var b = Game.balance.travel;
    var c = tr.check(state, venueId, day, deal);
    if (c.problem) return { problem: c.problem, legs: [], gas: 0, hotelNights: 0, hotelCost: 0, energy: 0, jobDays: [] };
    var s = tr.addShow(state, venueId, day, deal || 'guarantee', null);
    var trip = Object.keys(s.state.trips).map(function (id) { return s.state.trips[id]; })
      .filter(function (x) { return x.showIds.indexOf(s.entryId) !== -1; })[0];
    var legs = tr.tripLegs(s.state, trip);
    var gas = legs.reduce(function (sum, leg) { return sum + tr.legGas(leg.from, leg.to); }, 0);
    var blocks = legs.reduce(function (sum, leg) { return sum + leg.slots.length; }, 0);
    var nights = tr.tripNights(trip);
    return { problem: null, legs: legs, gas: gas, hotelNights: nights, hotelCost: nights * b.hotelPerNight,
      energy: blocks * b.energyPerBlock, jobDays: c.jobDays, showCount: trip.showIds.length };
  },

  // A trip's legs, read back from its travel entries: [{ from, to, slots }].
  tripLegs: function (state, trip) {
    var tr = Game.rules.travel;
    var legs = [];
    Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'travel' && e.tripId === trip.id; })
      .sort(function (a, b) { return tr.slot(a.day, a.block) - tr.slot(b.day, b.block); })
      .forEach(function (e) {
        if (e.legStart || !legs.length) legs.push({ from: e.from, to: e.to, slots: [] });
        legs[legs.length - 1].slots.push(tr.slot(e.day, e.block));
      });
    return legs;
  },

  // How many nights a trip spends away from home (one hotel night each).
  tripNights: function (trip) {
    var tr = Game.rules.travel;
    return tr.slotDay(trip.endT) - tr.slotDay(trip.startT);
  },

  // ----- On the day (called from End Day) -----

  // A travel block: leaving home (if you can), paying gas at the start of each leg, and getting home.
  // At the very first block, if you're at 0 energy or the trip needs a van you don't have, you don't go:
  // every show on the trip is a no-show. Returns { state, log, stranded }.
  travelBlock: function (state, entry, energy) {
    var tr = Game.rules.travel;
    var trip = state.trips[entry.tripId];
    var t = tr.slot(entry.day, entry.block);
    var s = Game.util.clone(state);
    var log = [];
    if (trip && t === trip.startT) {
      var why = energy <= 0 ? 'you had no energy left to travel' : (trip.needsVan && !s.player.gear.van ? 'this trip needs a van and you don\'t have one' : null);
      if (why) return tr.strand(s, trip.id, why);
    }
    if (entry.legStart) {
      var gas = tr.legGas(entry.from, entry.to);
      var spent = Game.rules.money.spend(s, gas, 'travel');
      s = spent.state;
      log = log.concat(spent.log);
      log.push((entry.to === 'hometown' ? 'Driving home from ' + Game.content.cities[entry.from].name : 'On the road to ' + Game.content.cities[entry.to].name) +
        ': $' + gas + ' gas.');
    } else {
      log.push(entry.to === 'hometown' ? 'Still driving home.' : 'Still on the road to ' + Game.content.cities[entry.to].name + '.');
    }
    if (trip && t === trip.endT) {
      log.push('Home again.');
      var van = s.player.gear.van;
      if (van && van.worn) {
        s.player.gear.van = null;
        log.push('Your ' + Game.content.vans[van.kind].name.toLowerCase() + ' got you home, then broke down for good. You\'ll need a new van for Far cities with a band, or a tour.');
      }
      delete s.trips[trip.id];
    }
    return { state: s, log: log, stranded: false };
  },

  // You couldn't leave: every show on the trip is a no-show, and the trip is called off. Returns { state, log, stranded }.
  strand: function (state, tripId, why) {
    var s = Game.util.clone(state);
    var trip = s.trips[tripId];
    var log = ['You couldn\'t leave for ' + trip.cities.map(function (c) { return Game.content.cities[c].name; })
      .filter(function (n, i, all) { return all.indexOf(n) === i; }).join(', ') + ': ' + why + '.'];
    Object.keys(s.entries).forEach(function (id) {
      var e = s.entries[id];
      if (e.type === 'travel' && e.tripId === tripId) { delete s.entries[id]; delete s.schedule[e.day][e.block]; }
    });
    trip.showIds.forEach(function (sid) {
      var e = s.entries[sid];
      if (!e) return;
      var penalty = Game.rules.booking.applyPenalty(s, e.venueId, 'noShow');
      s = penalty.state;
      log.push('No-show at ' + Game.content.venues[e.venueId].name + ' (' + Game.rules.day.dateLabel(e.day) + '). ' + penalty.log.join(' '));
      delete s.entries[sid];
      delete s.schedule[e.day][e.block];
    });
    delete s.trips[tripId];
    return { state: s, log: log, stranded: true };
  },

  // After an out-of-town show is played: count it (for tours, unlocks, and your van), and on a tour every
  // bandmate gains satisfaction. Returns { state, log }.
  afterShow: function (state, entry) {
    var tr = Game.rules.travel;
    if (!tr.isOutOfTown(entry.venueId)) return { state: state, log: [] };
    var s = Game.util.clone(state);
    var log = [];
    var cityId = tr.cityOfVenue(entry.venueId);
    // This show, every out-of-town show played before it, and the ones still booked.
    var days = s.stats.outOfTownShowDays.concat(tr.outOfTownShows(s).filter(function (e) { return e.id !== entry.id; })
      .map(function (e) { return e.day; })).concat([entry.day]);
    var tour = tr.isTour(days, entry.day);
    s.stats.outOfTownShowDays.push(entry.day);
    s.stats.citiesPlayed[cityId] = (s.stats.citiesPlayed[cityId] || 0) + 1;
    if (tour && s.band.memberIds.length) {
      var gain = Game.balance.satisfaction.change.tourShow;
      Game.rules.people.members(s).forEach(function (m) { s = Game.rules.people.changeSatisfaction(s, m.id, gain, 'Tour show').state; });
      log.push('Tour show: bandmates +' + gain + ' satisfaction.');
    }
    var van = s.player.gear.van;
    if (van) {
      van.shows += 1;
      var max = Game.balance.vans[van.kind].maxShows;
      if (max !== null && van.shows >= max && !van.worn) {
        van.worn = true;
        log.push('Your van is on its last legs: it\'ll get you home, then that\'s it.');
      }
    }
    return { state: s, log: log };
  },

  // Each night: a hotel if you're away tonight, and road fatigue from your 5th day in a row on the road.
  // Returns { state, log }.
  nightly: function (state) {
    var tr = Game.rules.travel;
    var b = Game.balance;
    var s = Game.util.clone(state);
    var log = [];
    var lastToday = tr.dayStart(s.day) + b.time.blocks.length - 1;
    var awayTonight = Object.keys(s.trips).some(function (id) {
      var trip = s.trips[id];
      return trip.startT <= lastToday && trip.endT > lastToday;
    });
    if (tr.awayOnDay(s, s.day) || awayTonight) s.player.roadDays += 1;
    else s.player.roadDays = 0;
    if (awayTonight) {
      var spent = Game.rules.money.spend(s, b.travel.hotelPerNight, 'travel');
      s = spent.state;
      log.push('Hotel: -$' + b.travel.hotelPerNight + '.');
      log = log.concat(spent.log);
    }
    if (s.player.roadDays >= b.morale.roadFatigueStartDay) {
      var m = Game.rules.morale.change(s, b.morale.roadFatiguePerDay);
      s = m.state;
      log.push('Road fatigue (day ' + s.player.roadDays + ' on the road): ' + b.morale.roadFatiguePerDay + ' morale.');
      log = log.concat(m.log);
    }
    return { state: s, log: log };
  },

  // ----- Out-of-town open mics -----

  // The open mic nights you could sign up for at an out-of-town open mic (within the sign-up window).
  openMicDates: function (state, venueId) {
    var w = Game.balance.travel.openMicSignupDays;
    var venue = Game.content.venues[venueId];
    var dates = [];
    for (var d = state.day + w.min; d <= state.day + w.max; d++) {
      if (Game.rules.day.dayOfWeek(d) === venue.openMicDay) dates.push(d);
    }
    return dates;
  },

  // Why you can't sign up for an out-of-town open mic that night, or null. (jobChoice: how you'll take
  // workdays off, if the trip needs any.)
  openMicProblem: function (state, venueId, day, jobChoice) {
    var venue = Game.content.venues[venueId];
    if (!venue || venue.tier !== 0 || !Game.rules.travel.isOutOfTown(venueId)) return 'Pick an out-of-town open mic.';
    if (Game.rules.travel.openMicDates(state, venueId).indexOf(day) === -1) return 'Pick one of its open mic nights.';
    var setSize = Game.balance.songs.setlist.openMic.songs;
    if (Game.rules.songs.playable(state).length < setSize) return 'You need ' + setSize + ' finished songs.';
    var taken = Game.rules.booking.blockTaken(state, day, venue.showBlock, true);
    if (taken) return taken + ' that night.';
    return Game.rules.travel.jobProblem(state, Game.rules.travel.check(state, venueId, day, 'openMic'), jobChoice);
  },

  // Turns a travel check into a problem: its own problem, or (if the trip needs workdays off) a missing
  // or impossible day-off choice. Returns text or null.
  jobProblem: function (state, check, jobChoice) {
    if (check.problem) return check.problem;
    if (!check.jobDays.length) return null;
    if (!jobChoice) return 'This trip is during your day job. Choose a vacation day, calling in sick, or skipping work.';
    for (var i = 0; i < check.jobDays.length; i++) {
      var p = Game.rules.job.dayOffProblem(state, check.jobDays[i], jobChoice, true);
      if (p) return Game.rules.day.dateLabel(check.jobDays[i]) + ': ' + p;
    }
    return null;
  },

  // Signs up for an out-of-town open mic: no email, no odds. The travel is booked. Returns { state, log }.
  signUpOpenMic: function (state, venueId, day, jobChoice) {
    var problem = Game.rules.travel.openMicProblem(state, venueId, day, jobChoice);
    if (problem) return { state: state, log: [problem] };
    var added = Game.rules.travel.addShow(state, venueId, day, 'openMic', jobChoice);
    var venue = Game.content.venues[venueId];
    return { state: added.state, log: ['Signed up: open mic at ' + venue.name + ', ' + Game.content.cities[venue.cityId].name + ', ' +
      Game.rules.day.dateLabel(day) + '. Travel is on your Calendar.'].concat(added.log) };
  }
};
