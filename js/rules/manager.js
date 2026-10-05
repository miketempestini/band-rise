// manager.js
// The manager (Phase 12, milestone 14): hiring, their 15% cut of gig pay, the 12-week calendar,
// auto-booking by your rules, and planning tours on request.
// Numbers are in balance.manager (and balance.time for the calendar).
//
// Inbox messages:
//   kind 'managerOffer':  data {}                        (hire or turn down)
//   kind 'tourProposal':  data { shows: [{ venueId, day }], skipped: [{ cityId, why }], estimate }
//   kind 'note':          data { title, text }           (a short note, like "Your manager booked a show")

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.manager = {

  // ----- Basics -----

  hired: function (state) { return !!state.manager.hired; },

  // How many weeks you can see and book ahead: 4, or 12 with a manager.
  calendarWeeks: function (state) {
    var t = Game.balance.time;
    return Game.rules.manager.hired(state) ? t.managerBookingWeeks : t.startBookingWeeks;
  },

  // The last day you can book: your booking horizon.
  horizonDay: function (state) {
    return state.day + Game.rules.manager.calendarWeeks(state) * Game.balance.time.daysPerWeek;
  },

  // The manager's cut of some gig pay (0 without a manager).
  cutOf: function (state, pay) {
    return Game.rules.manager.hired(state) ? Math.round(pay * Game.balance.manager.gigPayCut) : 0;
  },

  // ----- Hiring -----

  // True if you've reached the Manager milestone's bar (reputation 50 and 2,000 fans).
  qualifies: function (state) {
    var m = Game.balance.milestones;
    return state.player.reputation >= m.managerReputation && Game.rules.progress.totalFans(state) >= m.managerFans;
  },

  // The newest inbox message of a kind, or null.
  lastMessage: function (state, kind) {
    var list = state.inbox.filter(function (m) { return m.kind === kind; });
    return list.length ? list[list.length - 1] : null;
  },

  // Each morning: if you qualify and have no manager, an offer arrives (again 8 weeks after you turn one
  // down or let it expire). Returns { state, log }.
  offerCheck: function (state) {
    var b = Game.balance.manager;
    if (Game.rules.manager.hired(state) || !Game.rules.manager.qualifies(state)) return { state: state, log: [] };
    var last = Game.rules.manager.lastMessage(state, 'managerOffer');
    if (last && (!last.resolved || state.day - last.day < b.reofferWeeks * Game.balance.time.daysPerWeek)) return { state: state, log: [] };
    var who = Game.content.business.manager;
    var s = Game.rules.booking.addInbox(state, 'managerOffer', {}, state.day + b.offerExpiryDays);
    return { state: s, log: [who.name + ' of ' + who.company + ' wants to manage you. Check your Inbox.'] };
  },

  // Hires the manager (from their Inbox offer). Returns { state, log }.
  hire: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'managerOffer') return { state: state, log: ['That offer isn\'t open.'] };
    var s = Game.util.clone(state);
    s.manager.hired = true;
    s.manager.hiredDay = s.day;
    s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; } });
    s = Game.rules.progress.checkUnlocks(s).state; // a manager can open National cities (with a label)
    return { state: s, log: [Game.content.business.manager.name + ' is your manager now. They take ' +
      Math.round(Game.balance.manager.gigPayCut * 100) + '% of gig pay. Set up auto-booking or ask for a tour on the Manager screen.'] };
  },

  // Lets the manager go. Shows already booked stay. Returns { state, log }.
  letGo: function (state) {
    if (!Game.rules.manager.hired(state)) return { state: state, log: ['You don\'t have a manager.'] };
    var s = Game.util.clone(state);
    s.manager.hired = false;
    s.manager.rules.on = false;
    s.tourRequests = [];
    s.inbox.forEach(function (x) { if (x.kind === 'tourProposal' && !x.resolved) x.resolved = 'declined'; });
    return { state: s, log: ['You let ' + Game.content.business.manager.name + ' go. Shows already booked stay on your calendar.'] };
  },

  // ----- Auto-booking -----

  // Why a set of auto-booking rules won't work, or null.
  // rules: { on, cities: [cityIds], tiers: [1, 2, 3], nights: [0..6], maxPerWeek }
  rulesProblem: function (state, rules) {
    var a = Game.balance.manager.autoBook;
    if (!rules.cities.length) return 'Pick at least one city.';
    if (rules.cities.some(function (id) { return !state.cities[id] || !state.cities[id].unlocked; })) return 'Pick cities you\'ve unlocked.';
    if (!rules.tiers.length) return 'Pick at least one venue size.';
    if (!rules.nights.length) return 'Pick at least one night.';
    if (rules.maxPerWeek < 1 || rules.maxPerWeek > a.maxPerWeekLimit) return 'Shows a week: 1 to ' + a.maxPerWeekLimit + '.';
    return null;
  },

  // Saves the auto-booking rules. Returns { state, log }.
  setRules: function (state, rules) {
    var problem = Game.rules.manager.rulesProblem(state, rules);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    s.manager.rules = Game.util.clone(rules);
    return { state: s, log: [rules.on ? 'Auto-booking is on. Your manager emails venues every Monday.' : 'Auto-booking rules saved (it\'s off).'] };
  },

  // How many shows are booked (or asked for) in the calendar week that holds a day.
  weekLoad: function (state, day) {
    var start = day - Game.rules.day.dayOfWeek(day);
    var end = start + Game.balance.time.daysPerWeek;
    var shows = Object.keys(state.entries).filter(function (id) {
      var e = state.entries[id];
      return e.type === 'gig' && e.day >= start && e.day < end;
    }).length;
    var asks = Object.keys(state.requests).filter(function (id) {
      var r = state.requests[id];
      return r.status === 'pending' && r.gigDay >= start && r.gigDay < end;
    }).length;
    var offers = state.inbox.filter(function (m) { return m.kind === 'reply' && m.data.yes && !m.resolved && m.data.gigDay >= start && m.data.gigDay < end; }).length;
    return shows + asks + offers;
  },

  // Every Monday: the manager emails venues that fit your rules (no energy from you, normal odds), for dates
  // that need no time off work and whose travel fits, never past your shows-a-week limit. Returns { state, log }.
  autoBook: function (state) {
    var b = Game.balance;
    var rules = state.manager.rules;
    if (!Game.rules.manager.hired(state) || !rules.on || Game.rules.day.dayOfWeek(state.day) !== 0) return { state: state, log: [] };
    var s = state;
    var sent = [];
    var last = Game.rules.manager.horizonDay(s);
    for (var d = s.day + 1; d <= last; d++) { // each venue's own booking window decides which of these dates work
      if (rules.nights.indexOf(Game.rules.day.dayOfWeek(d)) === -1) continue;
      rules.cities.forEach(function (cityId) {
        if (Game.rules.manager.weekLoad(s, d) >= rules.maxPerWeek) return;
        Game.rules.booking.venues(cityId).forEach(function (v) {
          if (rules.tiers.indexOf(v.tier) === -1 || Game.rules.manager.weekLoad(s, d) >= rules.maxPerWeek) return;
          if (Game.rules.booking.requestProblem(s, v.id, d, 'door')) return;
          var needsOff = v.cityId === 'hometown' ? Game.rules.booking.clashesWithJob(s, d, v.showBlock) : Game.rules.travel.check(s, v.id, d, 'door').jobDays.length > 0;
          if (needsOff) return;
          var r = Game.rules.booking.sendRequest(s, v.id, d, 'door');
          if (r.state === s) return;
          s = r.state;
          var reqId = s.venues[v.id].pendingRequestId;
          s.requests[reqId].byManager = true;
          sent.push(v.name + ' (' + Game.rules.day.dateLabel(d) + ')');
        });
      });
    }
    if (!sent.length) return { state: s, log: [] };
    return { state: s, log: ['Your manager emailed ' + sent.length + ' venue' + (sent.length === 1 ? '' : 's') + ': ' + sent.join(', ') + '.'] };
  },

  // Each morning: a "yes" to a request your manager sent is booked for you (if it still fits without time off).
  // Returns { state, log }.
  autoAccept: function (state) {
    var s = state;
    var log = [];
    state.inbox.forEach(function (m) {
      if (m.kind !== 'reply' || m.resolved || !m.data.yes || !m.data.byManager) return;
      if (Game.rules.booking.offerJobDays(s, m.id).length || Game.rules.booking.acceptProblem(s, m.id, null)) return;
      var r = Game.rules.booking.acceptOffer(s, m.id, null);
      if (!r.entryId) return;
      s = r.state;
      log.push('Your manager booked ' + Game.content.venues[m.data.venueId].name + ' for ' + Game.rules.day.dateLabel(m.data.gigDay) + '.');
    });
    return { state: s, log: log };
  },

  // ----- Tours -----

  // Why a tour request won't work, or null. request: { cities: [cityIds], tier, earliestDay }
  tourRequestProblem: function (state, request) {
    var t = Game.balance.manager.tour;
    if (!Game.rules.manager.hired(state)) return 'You need a manager.';
    if (state.tourRequests.length) return 'Your manager is already planning a tour.';
    if (state.inbox.some(function (m) { return m.kind === 'tourProposal' && !m.resolved; })) return 'Answer the tour proposal in your Inbox first.';
    var cities = request.cities || [];
    if (cities.length < t.minCities || cities.length > t.maxCities) return 'Pick ' + t.minCities + ' to ' + t.maxCities + ' cities.';
    if (cities.some(function (id) { return id === 'hometown' || !state.cities[id] || !state.cities[id].unlocked; })) return 'Pick out-of-town cities you\'ve unlocked.';
    if ([1, 2, 3].indexOf(request.tier) === -1) return 'Pick a venue size.';
    return null;
  },

  // Asks the manager to plan a tour. The proposal arrives in 5 days. Returns { state, log }.
  requestTour: function (state, request) {
    var problem = Game.rules.manager.tourRequestProblem(state, request);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    s.tourRequests.push({ id: 'tr' + s.nextTourRequestId, cities: request.cities.slice(), tier: request.tier,
      earliestDay: request.earliestDay || s.day, readyDay: s.day + Game.balance.manager.tour.planDays });
    s.nextTourRequestId += 1;
    return { state: s, log: [Game.content.business.manager.name + ' is planning your tour. The proposal will be in your Inbox in ' +
      Game.balance.manager.tour.planDays + ' days.'] };
  },

  // The venue the manager picks in a city: the requested size, or the biggest smaller one there.
  tourVenue: function (state, cityId, tier) {
    var venues = Game.rules.booking.venues(cityId).filter(function (v) { return v.tier <= tier && Game.rules.booking.dealsFor(v).indexOf('door') !== -1; })
      .sort(function (a, b) { return b.tier - a.tier || b.capacity - a.capacity; });
    return venues[0] || null;
  },

  // Plans a tour: one show per city, nearest cities first, each show on the first free evening the travel
  // allows, starting at least 5 weeks out and inside your 12-week calendar. Returns
  // { shows: [{ venueId, day }], skipped: [{ cityId, why }], estimate }.
  planTour: function (state, cities, tier, earliestDay) {
    var tr = Game.rules.travel;
    var t = Game.balance.manager.tour;
    var order = ['near', 'mid', 'far', 'national', 'international'];
    var sorted = cities.slice().sort(function (a, b) {
      return order.indexOf(Game.content.cities[a].region) - order.indexOf(Game.content.cities[b].region);
    });
    var start = Math.max(earliestDay || 0, state.day + t.leadDays);
    var last = Game.rules.manager.horizonDay(state);
    var hyp = state;
    var shows = [];
    var skipped = [];
    var prev = null;
    sorted.forEach(function (cityId) {
      var venue = Game.rules.manager.tourVenue(state, cityId, tier);
      if (!venue) { skipped.push({ cityId: cityId, why: 'No venue that size there.' }); return; }
      var unmet = Game.rules.booking.requirements(state, venue, 'door').filter(function (r) { return !r.met; })[0];
      if (unmet) { skipped.push({ cityId: cityId, why: venue.name + ' needs ' + unmet.text + '.' }); return; }
      // The next show waits for the drive: the next evening if the leg fits in a morning and afternoon, else a day later.
      var from = prev ? prev.day + 1 + (tr.legBlocks(Game.content.venues[prev.venueId].cityId, cityId) > 2 ? 1 : 0) : start;
      for (var d = from; d <= last; d++) {
        if (Game.rules.booking.blockTaken(hyp, d, venue.showBlock, true)) continue;
        var added = tr.addShow(hyp, venue.id, d, 'door', null);
        if (added.problems.length) continue;
        hyp = added.state;
        prev = { venueId: venue.id, day: d };
        shows.push(prev);
        return;
      }
      skipped.push({ cityId: cityId, why: 'No date that fits before ' + Game.rules.day.dateLabel(last) + '.' });
    });
    return { shows: shows, skipped: skipped, estimate: Game.rules.manager.tourEstimate(state, hyp, shows) };
  },

  // A tour's money, roughly: each show's expected crowd (with any ads you picked) and your door share (after the
  // manager and the band), then your part of gas or flights and hotels (the band chips in), production, and ads.
  // hyp: the state with the tour on the calendar. ads: optional { cityId: packageId } (see balance.manager.tour.ads).
  // Returns { rows: [{ venueId, day, crowdNoAds, crowd, pay, yourPay, production }], income, travel, hotels,
  // production, adCost, net, jobDays }. (Daily posts and word of mouth aren't counted: a little extra on top.)
  tourEstimate: function (state, hyp, shows, ads) {
    var tr = Game.rules.travel;
    var b = Game.balance;
    var packages = b.manager.tour.ads;
    var share = Game.rules.people.payShares(state).yourShare;
    ads = ads || {};
    var rows = shows.map(function (show) {
      var venue = Game.content.venues[show.venueId];
      var crowdNoAds = Math.min(venue.capacity, Math.round(Game.rules.gigs.expectedCrowd(state, venue)));
      var pkg = packages[ads[venue.cityId]];
      var crowd = crowdNoAds;
      if (pkg) {
        // The same crowd sum, with the ad's fans and buzz in that city.
        var view = Game.util.clone(state);
        view.cities[venue.cityId].fans = Math.min(Game.content.cities[venue.cityId].fanCeiling, view.cities[venue.cityId].fans + pkg.fans);
        view.cities[venue.cityId].buzz = Math.min(b.buzz.max, view.cities[venue.cityId].buzz + pkg.buzz);
        crowd = Math.min(venue.capacity, Math.round(Game.rules.gigs.expectedCrowd(view, venue)));
      }
      var pay = Game.rules.booking.payFor(venue, 'door', crowd);
      var afterCut = pay - Math.round(pay * b.manager.gigPayCut);
      return { venueId: show.venueId, day: show.day, crowdNoAds: crowdNoAds, crowd: crowd, pay: pay, yourPay: Math.round(afterCut * share),
        production: Game.rules.booking.productionCost(venue, 'door', pay) };
    });
    var travel = 0;
    var hotels = 0;
    Object.keys(hyp.trips).forEach(function (id) {
      var trip = hyp.trips[id];
      if (state.trips[id] || !trip.showIds.some(function (sid) { return !state.entries[sid]; })) return; // only the new trips
      tr.tripLegs(hyp, trip).forEach(function (leg) { travel += tr.yourShareOf(state, tr.legGas(leg.from, leg.to, state)); });
      hotels += tr.tripNights(trip) * tr.yourShareOf(state, b.travel.hotelPerNight);
    });
    var adCost = Object.keys(ads).reduce(function (sum, cityId) { return sum + (packages[ads[cityId]] ? packages[ads[cityId]].cost : 0); }, 0);
    var income = rows.reduce(function (sum, r) { return sum + r.yourPay; }, 0);
    var production = rows.reduce(function (sum, r) { return sum + r.production; }, 0);
    return { rows: rows, income: income, travel: travel, hotels: hotels, production: production, adCost: adCost,
      net: income - travel - hotels - production - adCost, jobDays: tr.jobDaysNeeded(hyp) };
  },

  // A tour proposal's estimate with a set of ads (for the Inbox, as you pick them). Returns the tourEstimate.
  proposalEstimate: function (state, messageId, ads) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var hyp = state;
    m.data.shows.forEach(function (x) {
      var added = Game.rules.travel.addShow(hyp, x.venueId, x.day, 'door', null);
      if (!added.problems.length) hyp = added.state;
    });
    return Game.rules.manager.tourEstimate(state, hyp, m.data.shows, ads);
  },

  // ----- Tour ad campaigns -----

  // Why a set of ads can't go with a tour proposal, or null. ads: { cityId: packageId }.
  adsProblem: function (state, messageId, ads) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var packages = Game.balance.manager.tour.ads;
    var cities = m.data.shows.map(function (x) { return Game.content.venues[x.venueId].cityId; });
    var cost = 0;
    var ids = Object.keys(ads || {});
    for (var i = 0; i < ids.length; i++) {
      if (cities.indexOf(ids[i]) === -1) return 'Ads only go in cities on the tour.';
      if (!packages[ads[ids[i]]]) return 'Pick an ad package.';
      cost += packages[ads[ids[i]]].cost;
    }
    if (cost > state.player.cash) return 'The ads cost $' + cost.toLocaleString() + ' (you have $' + Math.floor(state.player.cash).toLocaleString() + ').';
    return null;
  },

  // Each morning: ad campaigns land a week before their show: buzz and new fans in that city. While the ads
  // run (until the show), that city's buzz doesn't fade. Finished campaigns are cleared. Returns { state, log }.
  processAds: function (state) {
    if (!state.adCampaigns.length) return { state: state, log: [] };
    var s = Game.util.clone(state);
    var log = [];
    var packages = Game.balance.manager.tour.ads;
    s.adCampaigns.forEach(function (c) {
      if (c.landed || c.landDay > s.day) return;
      var pkg = packages[c.packageId];
      c.landed = true;
      s = Game.rules.audience.addBuzz(s, c.cityId, pkg.buzz).state;
      var added = Game.rules.audience.addFans(s, c.cityId, pkg.fans);
      s = added.state;
      log.push('Your ads are up in ' + Game.content.cities[c.cityId].name + ': +' + pkg.buzz + ' buzz' + (added.added ? ', +' + added.added + ' fans' : '') + '.');
    });
    s.adCampaigns = s.adCampaigns.filter(function (c) { return c.showDay >= s.day; });
    return { state: s, log: log };
  },

  // True if ads are running in a city today (landed, and the show hasn't happened yet): its buzz holds.
  adsRunning: function (state, cityId) {
    return state.adCampaigns.some(function (c) { return c.cityId === cityId && c.landed && c.showDay >= state.day; });
  },

  // ----- Daily posts -----

  // Cities with an out-of-town show in the next 2 weeks (the manager posts more about those).
  focusCities: function (state) {
    var last = state.day + Game.balance.manager.social.focusDays;
    var list = [];
    Game.rules.travel.outOfTownShows(state).forEach(function (e) {
      var city = Game.content.venues[e.venueId].cityId;
      if (e.day <= last && list.indexOf(city) === -1) list.push(city);
    });
    return list;
  },

  // Each night: the manager posts for the band (free): +1 buzz in every city with fans, +3 more in focus cities.
  // Returns { state, log }.
  dailyPosts: function (state) {
    if (!Game.rules.manager.hired(state)) return { state: state, log: [] };
    var so = Game.balance.manager.social;
    var focus = Game.rules.manager.focusCities(state);
    var s = state;
    var reached = 0;
    Object.keys(state.cities).forEach(function (id) {
      var amount = (state.cities[id].fans > 0 ? so.dailyBuzz : 0) + (focus.indexOf(id) !== -1 ? so.focusBuzz : 0);
      if (!amount) return;
      s = Game.rules.audience.addBuzz(s, id, amount).state;
      reached += 1;
    });
    if (!reached) return { state: s, log: [] };
    return { state: s, log: ['Your manager posted for the band: buzz in ' + reached + ' cit' + (reached === 1 ? 'y' : 'ies') +
      (focus.length ? ' (extra for ' + focus.map(function (id) { return Game.content.cities[id].name; }).join(', ') + ')' : '') + '.'] };
  },

  // Each morning: tour plans that are ready become a proposal in the Inbox. Returns { state, log }.
  processTourRequests: function (state) {
    var ready = state.tourRequests.filter(function (r) { return r.readyDay <= state.day; });
    if (!ready.length) return { state: state, log: [] };
    var s = Game.util.clone(state);
    var log = [];
    ready.forEach(function (r) {
      var plan = Game.rules.manager.planTour(s, r.cities, r.tier, r.earliestDay);
      s.tourRequests = s.tourRequests.filter(function (x) { return x.id !== r.id; });
      s = Game.rules.booking.addInbox(s, 'tourProposal', plan, s.day + Game.balance.manager.tour.proposalExpiryDays);
      log.push(Game.content.business.manager.name + ' sent you a tour proposal: ' + plan.shows.length + ' show' + (plan.shows.length === 1 ? '' : 's') + '. Check your Inbox.');
    });
    return { state: s, log: log };
  },

  // Why a tour proposal can't be accepted, or null. jobChoice: how to take workdays off, if it needs any.
  tourAcceptProblem: function (state, messageId, jobChoice) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'tourProposal') return 'That proposal isn\'t open.';
    if (!m.data.shows.length) return 'There are no shows in this plan.';
    var tr = Game.rules.travel;
    var days = state.stats.outOfTownShowDays.concat(tr.outOfTownShows(state).map(function (e) { return e.day; }))
      .concat(m.data.shows.map(function (x) { return x.day; }));
    var tour = m.data.shows.some(function (x) { return tr.isTour(days, x.day); });
    if (tour && !state.player.gear.van) return 'This is a tour (3+ out-of-town shows in 10 days): you need a van (in the Shop).';
    var hyp = state;
    for (var i = 0; i < m.data.shows.length; i++) {
      var x = m.data.shows[i];
      var venue = Game.content.venues[x.venueId];
      var taken = Game.rules.booking.blockTaken(hyp, x.day, venue.showBlock, true);
      var added = taken ? null : tr.addShow(hyp, x.venueId, x.day, 'door', null);
      if (taken || added.problems.length) {
        return venue.name + ' on ' + Game.rules.day.dateLabel(x.day) + ' doesn\'t fit anymore (' + (taken || added.problems[0]) + '). Ask for a new plan.';
      }
      hyp = added.state;
    }
    return tr.jobProblem(state, { problem: null, jobDays: tr.jobDaysNeeded(hyp) }, jobChoice);
  },

  // Accepts a tour: every show (no odds: the manager already confirmed them) and all the travel go on the
  // calendar. Returns { state, log }.
  // ads: optional { cityId: packageId }: paid now, landing a week before that city's show.
  acceptTour: function (state, messageId, jobChoice, ads) {
    var problem = Game.rules.manager.tourAcceptProblem(state, messageId, jobChoice) || Game.rules.manager.adsProblem(state, messageId, ads || {});
    if (problem) return { state: state, log: [problem] };
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var s = state;
    m.data.shows.forEach(function (x) { s = Game.rules.travel.addShow(s, x.venueId, x.day, 'door', null).state; });
    var jobDays = Game.rules.travel.jobDaysNeeded(s);
    jobDays.forEach(function (d) { s = Game.rules.job.takeDayOff(s, d, jobChoice, true).state; });
    s = Game.util.clone(s);
    s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; } });
    var log = ['Tour booked: ' + m.data.shows.length + ' shows and all the travel are on your Calendar.'];
    // Ads: pay now; each lands a week before its city's show.
    var packages = Game.balance.manager.tour.ads;
    Object.keys(ads || {}).forEach(function (cityId) {
      var pkg = packages[ads[cityId]];
      var show = m.data.shows.filter(function (x) { return Game.content.venues[x.venueId].cityId === cityId; })[0];
      s = Game.rules.money.spend(s, pkg.cost, 'promotion').state;
      s.adCampaigns.push({ cityId: cityId, packageId: ads[cityId], landDay: Math.max(s.day, show.day - Game.balance.manager.tour.adLeadDays),
        showDay: show.day, landed: false });
      log.push('Ads booked in ' + Game.content.cities[cityId].name + ' ($' + pkg.cost.toLocaleString() + ').');
    });
    var landed = Game.rules.manager.processAds(s); // ads for a show within a week land right away
    return { state: landed.state, log: log.concat(landed.log) };
  }
};
