// bigShows.js
// Arenas and festivals (Phase 12, milestone 18): offers only. Once you're at reputation 85 with 100,000 fans
// and a label deal, promoters may offer you an arena night or a festival slot in a National city.
// Numbers are in balance.bigOffers (and balance.production for what a show costs on the night).
//
// Inbox messages: kind 'arenaOffer' or 'festivalOffer', data { venueId, day, fee }.
// Accepting books the show (deal 'arena' or 'festival', with that flat fee) and its flights.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.bigShows = {

  // True if arena and festival offers can come: the Arena milestone's bar, plus a label.
  eligible: function (state) {
    var m = Game.balance.milestones;
    return state.player.reputation >= m.arenaReputation && Game.rules.progress.totalFans(state) >= m.arenaFans &&
      Game.rules.label.signed(state);
  },

  // The arenas (or festivals) in cities you've unlocked.
  venues: function (state, festival) {
    return Object.keys(Game.content.venues).map(function (id) { return Game.content.venues[id]; }).filter(function (v) {
      return v.tier === 4 && !!v.festival === !!festival && state.cities[v.cityId].unlocked;
    });
  },

  // Each Monday: maybe an arena offer, maybe a festival offer (one of each open at a time), 6 to 10 weeks out,
  // on a date your calendar and the flights allow. force: 'arena' | 'festival' to make one arrive (debug).
  // Returns { state, log }.
  roll: function (state, force) {
    var o = Game.balance.bigOffers;
    if (!force && (!Game.rules.bigShows.eligible(state) || Game.rules.day.dayOfWeek(state.day) !== o.offerDayOfWeek)) return { state: state, log: [] };
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var log = [];
    [['arena', o.arenaWeeklyChance], ['festival', o.festivalWeeklyChance]].forEach(function (kind) {
      var name = kind[0];
      if (force && force !== name) return;
      var open = s.inbox.some(function (m) { return m.kind === name + 'Offer' && !m.resolved; });
      if (open || !(force || rng.chance(kind[1]))) return;
      var venue = rng.pick(Game.rules.bigShows.venues(s, name === 'festival'));
      if (!venue) return;
      var start = s.day + rng.int(o.daysAhead.min, o.daysAhead.max);
      var fee = name === 'festival'
        ? rng.int(o.festivalFee.min / o.festivalFeeRoundTo, o.festivalFee.max / o.festivalFeeRoundTo) * o.festivalFeeRoundTo
        : venue.deals.guarantee;
      // The first date from there that's free and the flights allow.
      for (var d = start; d <= start + Game.balance.time.daysPerWeek; d++) {
        if (Game.rules.booking.blockTaken(s, d, venue.showBlock, true) || Game.rules.travel.check(s, venue.id, d, name).problem) continue;
        s = Game.rules.booking.addInbox(s, name + 'Offer', { venueId: venue.id, day: d, fee: fee }, s.day + o.expiryDays);
        log.push((name === 'arena' ? 'An arena wants you to headline: ' : 'A festival wants you: ') + venue.name + ', ' +
          Game.rules.day.dateLabel(d) + ', $' + fee.toLocaleString() + '. Check your Inbox.');
        break;
      }
    });
    s.rngState = rng.getState();
    return { state: s, log: log };
  },

  // The workdays an arena or festival offer's trip would need off.
  jobDays: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var deal = m.kind === 'arenaOffer' ? 'arena' : 'festival';
    return Game.rules.travel.check(state, m.data.venueId, m.data.day, deal).jobDays;
  },

  // Why an arena or festival offer can't be accepted, or null. jobChoice: how to take workdays off, if needed.
  acceptProblem: function (state, messageId, jobChoice) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || (m.kind !== 'arenaOffer' && m.kind !== 'festivalOffer')) return 'That offer isn\'t open.';
    var deal = m.kind === 'arenaOffer' ? 'arena' : 'festival';
    var set = Game.rules.booking.setFor(Game.content.venues[m.data.venueId], deal).size;
    if (Game.rules.songs.playable(state).length < set) return 'You need ' + set + ' songs for this set.';
    return Game.rules.travel.jobProblem(state, Game.rules.travel.check(state, m.data.venueId, m.data.day, deal), jobChoice);
  },

  // Accepts an arena or festival offer: the show and its flights go on the calendar. Returns { state, log }.
  accept: function (state, messageId, jobChoice) {
    var problem = Game.rules.bigShows.acceptProblem(state, messageId, jobChoice);
    if (problem) return { state: state, log: [problem] };
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var deal = m.kind === 'arenaOffer' ? 'arena' : 'festival';
    var added = Game.rules.travel.addShow(state, m.data.venueId, m.data.day, deal, jobChoice);
    var s = added.state;
    s.entries[added.entryId].fee = m.data.fee;
    s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; } });
    var venue = Game.content.venues[m.data.venueId];
    return { state: s, log: ['Booked: ' + venue.name + ', ' + Game.rules.day.dateLabel(m.data.day) + ' ($' + m.data.fee.toLocaleString() +
      '). Flights are on your Calendar.'].concat(added.log) };
  }
};
