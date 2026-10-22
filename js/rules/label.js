// label.js
// Record labels. Once you have a manager, labels can offer you a deal: 12 labels (js/content/labels.js) in four tiers
// (indie, mid, major, and sharks), each with a personality that shapes its terms. Numbers are in balance.label.
//
// A deal's terms (an offer's data.terms, and the deal itself once signed):
//   labelId, tier, personality
//   advance          cash when you sign; paid back ("recouped") from your royalty before you see any of it
//   royalty          your share of streaming money on records made under the deal (the label keeps the rest)
//   reach            how much the label boosts those records' streams, and new fans when they come out
//   push             new fans in every open city when a record comes out (a share of each city's most fans)
//   freePromo        the release-week push the label pays for on each record (or null)
//   tourSupport      money toward each tour you accept
//   owe              { count, type }: the records you owe ('ep': EPs or albums count, 'album': albums only)
//   deadlineWeeks    weeks to deliver each record; penalty: 'fine' | 'royalty' | 'extend' for a missed one
//   control          'full' | 'approval' (they reject records under qualityBar) | 'shelve' (they may hold a record)
//   masters          who owns those recordings after the deal: 'artist' | 'reverts' (back to you revertWeeks later) | 'label'
//   gigCut, merchCut a "360" cut of gig pay and merch sales
//   recoup           { recording, promo, tour }: which of the label's costs are charged back to you
//   renewal          extra records the label can add if you're doing well (0 = no option)
//   buyout           { mult, flatShare }: leaving early costs unrecouped x mult + advance x flatShare
//   dropsYou         false: the label never lets you go (buyout is the only way out); flopQuality: a record under this flops
//   awardsBoost, bigShowMult   prestige at the awards, and how much more often arena and festival offers come
// A signed deal adds: id, signedDay, unrecouped, recouped, recoupShare, royaltyPaid, labelKept, cut360, charged,
//   delivered, nextDueDay, misses, flops, strikes, renewed, reminders, endDay, endReason, allReleases (older saves).
//
// state.label = { deal, past: [ended deals], cooldowns: { labelId: day }, pending: [{ labelId, day }] (bidding-war
//   joiners), nextOfferDay, opened: { topStudio, national, bigShows }, declined, droppedDay, everSigned, nextDealId }
// Inbox message: kind 'labelOffer', data { labelId, terms, counter: null | { asks, chance, replyDay, status }, cooled }.
// A release made under a deal keeps dealId; a release the label is holding has held: true (it comes out on its day).

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.label = {

  // ----- The deal you're in -----

  deal: function (state) { return state.label.deal || null; },
  signed: function (state) { return !!state.label.deal; },
  info: function (labelId) { return Game.content.labels[labelId]; },
  name: function (labelId) { return Game.content.labels[labelId].name; },
  managerFirst: function () { return Game.content.business.manager.name.split(' ')[0]; },

  // A deal by id: the current one or an ended one.
  dealById: function (state, id) {
    var d = state.label.deal;
    if (d && d.id === id) return d;
    return state.label.past.filter(function (x) { return x.id === id; })[0] || null;
  },

  // The deal a release was made under (an older save's deal covers every release), or null.
  releaseDeal: function (state, rel) {
    if (!rel) return null;
    if (rel.dealId) return Game.rules.label.dealById(state, rel.dealId);
    var d = state.label.deal;
    return d && d.allReleases ? d : null;
  },

  // Does a release of this type count toward what you owe?
  counts: function (deal, type) {
    return type !== 'single' && (deal.owe.type === 'ep' || type === 'album');
  },

  round: function (n) {
    var r = Game.balance.label.roundTo;
    return Math.round(n / r) * r;
  },

  // ----- Who can offer -----

  // True if a tier's labels would look at you (reputation and fans).
  tierOpen: function (state, tier) {
    var t = Game.balance.label.tiers[tier];
    return state.player.reputation >= t.minReputation && Game.rules.progress.totalFans(state) >= t.minFans;
  },

  // Sharks come looking when times are hard: you owe money, you were dropped in the last half year, or you've
  // turned down several deals.
  desperate: function (state) {
    var b = Game.balance.label;
    var dropped = state.label.droppedDay !== null && state.day - state.label.droppedDay < 26 * Game.balance.time.daysPerWeek;
    return state.player.loanOwed > 0 || dropped || state.label.declined >= b.desperate.declinedDeals;
  },

  openOffers: function (state) {
    return state.inbox.filter(function (m) { return m.kind === 'labelOffer' && !m.resolved; });
  },

  // Why no label can offer right now, or null.
  offersProblem: function (state) {
    if (!Game.rules.manager.hired(state)) return 'Labels only talk to artists with a manager.';
    if (state.label.deal) return 'You\'re signed with ' + Game.rules.label.name(state.label.deal.labelId) + '.';
    if (state.day < state.label.nextOfferDay) return 'Labels will start calling again on ' + Game.rules.day.dateLabel(state.label.nextOfferDay) + '.';
    return null;
  },

  // The labels that could make you an offer today.
  eligibleLabels: function (state) {
    var lb = Game.rules.label;
    if (lb.offersProblem(state)) return [];
    var open = lb.openOffers(state).map(function (m) { return m.data.labelId; });
    return Object.keys(Game.content.labels).filter(function (id) {
      var info = Game.content.labels[id];
      return lb.tierOpen(state, info.tier) && open.indexOf(id) === -1 && !((state.label.cooldowns[id] || 0) > state.day);
    });
  },

  // Your streaming money in a normal week right now (before any label's share): what advances are sized from.
  weeklyPay: function (state) {
    var weekly = Game.rules.streaming.weekStreams(state, state.day + Game.balance.time.daysPerWeek);
    var total = Object.keys(weekly).reduce(function (sum, id) { return sum + weekly[id]; }, 0);
    return Game.rules.streaming.payFor(total);
  },

  // Extra chance a week that labels call: buzz where you have fans, a song on the charts, a recent release.
  hotBonus: function (state) {
    var h = Game.balance.label.hotChance;
    var bonus = 0;
    var cities = Object.keys(state.cities).filter(function (id) { return state.cities[id].fans > 0; });
    var buzz = cities.length ? cities.reduce(function (t, id) { return t + state.cities[id].buzz; }, 0) / cities.length : 0;
    if (buzz >= h.buzzAt) bonus += h.buzz;
    if (Object.keys(state.songs).some(function (id) { return state.songs[id].chart && state.songs[id].chart.pos; })) bonus += h.charting;
    if (state.releases.some(function (r) { return state.day - r.day <= h.recentDays; })) bonus += h.recentRelease;
    return bonus;
  },

  // ----- Rolling an offer -----

  // Picks a key from { key: weight } with the dice.
  pickWeighted: function (rng, weights) {
    var keys = Object.keys(weights).filter(function (k) { return weights[k] > 0; });
    var total = keys.reduce(function (t, k) { return t + weights[k]; }, 0);
    var roll = rng.range(0, total);
    for (var i = 0; i < keys.length; i++) {
      roll -= weights[keys[i]];
      if (roll <= 0) return keys[i];
    }
    return keys[keys.length - 1];
  },

  // A new offer's terms from a label: its tier's ranges shaped by its personality (the game's dice).
  makeTerms: function (state, rng, labelId) {
    var b = Game.balance.label;
    var lb = Game.rules.label;
    var info = Game.content.labels[labelId];
    var t = b.tiers[info.tier];
    var p = b.personalities[info.personality];
    var r2 = function (x) { return Math.round(x * 100) / 100; };
    var weekly = lb.weeklyPay(state);
    var advance = lb.round(Math.max(rng.range(t.advanceFloor.min, t.advanceFloor.max), weekly * rng.range(t.advanceWeeks.min, t.advanceWeeks.max)) * p.advanceMult);
    var promoAt = Game.util.clamp(b.promoLadder.indexOf(t.freePromo) + p.promoShift, 0, b.promoLadder.length - 1);
    var freePromo = b.promoLadder[promoAt];
    var tourSupport = lb.round(rng.range(t.tourSupport.min, t.tourSupport.max) * p.tourMult);
    var masters = lb.pickWeighted(rng, p.masters);
    var control = lb.pickWeighted(rng, p.control);
    var cut = function (c) { return rng.chance(c.chance) ? r2(rng.range(c.min, c.max)) : 0; };
    return {
      labelId: labelId, tier: info.tier, personality: info.personality,
      advance: Math.max(b.roundTo, advance),
      royalty: Game.util.clamp(r2(rng.range(t.royalty.min, t.royalty.max) + p.royaltyShift), b.penaltyAmounts.royaltyFloor, 0.9),
      reach: r2(rng.range(t.reach.min, t.reach.max) * p.reachMult),
      push: t.push * p.reachMult,
      freePromo: freePromo,
      tourSupport: tourSupport,
      owe: { count: Math.max(1, rng.int(t.records.min, t.records.max) + p.recordsShift), type: t.recordType },
      deadlineWeeks: Math.max(6, rng.int(t.deadlineWeeks.min, t.deadlineWeeks.max) + p.deadlineShift),
      penalty: lb.pickWeighted(rng, p.penalty),
      control: control,
      qualityBar: control === 'approval' ? b.qualityBar[info.tier] : null,
      masters: masters,
      revertWeeks: masters === 'reverts' ? rng.int(b.revertWeeks.min, b.revertWeeks.max) : null,
      gigCut: cut(p.gigCut),
      merchCut: cut(p.merchCut),
      recoup: { recording: rng.chance(p.recoup.recording), promo: !!freePromo && rng.chance(p.recoup.promo), tour: tourSupport > 0 && rng.chance(p.recoup.tour) },
      renewal: rng.chance(p.renewal) ? rng.int(b.renewalRecords.min, b.renewalRecords.max) : 0,
      buyout: { mult: p.buyout.mult, flatShare: p.buyout.flatShare },
      dropsYou: p.dropsYou,
      flopQuality: b.flopQuality[info.tier],
      awardsBoost: p.awardsBoost,
      bigShowMult: p.bigShowMult
    };
  },

  // Adds an offer from a label to the Inbox. Changes nothing else. Returns the new state.
  addOffer: function (s, rng, labelId) {
    var terms = Game.rules.label.makeTerms(s, rng, labelId);
    return Game.rules.booking.addInbox(s, 'labelOffer', { labelId: labelId, terms: terms, counter: null, cooled: false },
      s.day + Game.balance.label.offerExpiryDays);
  },

  // Each morning: labels joining a bidding war arrive, and on Mondays a new offer may come (sharks more often when
  // you're desperate). When one label offers, others may join over the next few days. Returns { state, log }.
  offerCheck: function (state) {
    var lb = Game.rules.label;
    var b = Game.balance.label;
    if (lb.offersProblem(state)) {
      if (state.label.pending.length && state.label.deal) { var c = Game.util.clone(state); c.label.pending = []; return { state: c, log: [] }; }
      return { state: state, log: [] };
    }
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var log = [];
    // Bidding-war joiners whose day has come.
    var waiting = [];
    s.label.pending.forEach(function (p) {
      if (p.day > s.day) { waiting.push(p); return; }
      if (lb.openOffers(s).length >= b.maxOpenOffers || lb.eligibleLabels(s).indexOf(p.labelId) === -1) return;
      s = lb.addOffer(s, rng, p.labelId);
      log.push(lb.name(p.labelId) + ' heard about the other offers and wants in. Check your Inbox.');
    });
    s.label.pending = waiting;
    // Mondays: a new offer, if nothing's on the table.
    if (Game.rules.day.dayOfWeek(s.day) === b.offerDayOfWeek && !lb.openOffers(s).length) {
      var eligible = lb.eligibleLabels(s);
      var order = eligible.slice();
      for (var i = order.length - 1; i > 0; i--) { var j = rng.int(0, i); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      var hot = lb.hotBonus(s);
      var desperate = lb.desperate(s);
      for (var k = 0; k < order.length; k++) {
        var id = order[k];
        var tier = Game.content.labels[id].tier;
        var chance = tier === 'shark' ? (desperate ? b.desperate.weeklyChance : b.tiers.shark.weeklyChance) : b.tiers[tier].weeklyChance + hot;
        if (!rng.chance(chance)) continue;
        s = lb.addOffer(s, rng, id);
        log.push(lb.name(id) + ' wants to sign you. Read the contract in your Inbox.');
        eligible.forEach(function (other) {
          if (other !== id && Game.content.labels[other].tier !== 'shark' && rng.chance(b.biddingWar.chance)) {
            s.label.pending.push({ labelId: other, day: s.day + rng.int(b.biddingWar.days.min, b.biddingWar.days.max) });
          }
        });
        break;
      }
    }
    s.rngState = rng.getState();
    return { state: s, log: log };
  },

  // ----- Reading a contract -----

  // Your typical money per week from shows and merch lately (from the Finances records): { gigs, merch }.
  recentShowMoney: function (state) {
    var from = state.day - 4 * Game.balance.time.daysPerWeek;
    var shows = (state.finances && state.finances.shows || []).filter(function (x) { return x.day >= from; });
    var gigs = shows.reduce(function (t, x) { return t + (x.gross || 0); }, 0) / 4;
    var merch = shows.reduce(function (t, x) { return t + (x.merch || 0); }, 0) / 4;
    return { gigs: gigs, merch: merch };
  },

  // New fans a label's push gives a record (at a typical quality and size).
  pushFansFor: function (state, push, type) {
    var rb = Game.balance.releases;
    var size = rb.sizeBonus[type] / rb.sizeBonus.album;
    return Math.round(Object.keys(state.cities).filter(function (id) { return state.cities[id].unlocked; }).reduce(function (t, id) {
      return t + Game.content.cities[id].fanCeiling * push * 0.6 * size;
    }, 0));
  },

  // What a deal means for you, roughly, at your current fans and shows, over the time it would take to deliver
  // what you owe. Returns { weeks, unsigned, royalties, total, cut360, pushFans, fansValue, value, ratio, verdict,
  // recoupWeeks (null = probably never), buyoutNow }.
  estimate: function (state, terms) {
    var b = Game.balance.label;
    var lb = Game.rules.label;
    var e = b.estimate;
    var fans = Game.rules.progress.totalFans(state);
    var tracks = e.tracks[terms.owe.type];
    // How long a record really takes at your writing pace. Slower than the deadline means missed deadlines: one more
    // record owed each time (an "extend" contract), a lower royalty, or fines.
    var pace = lb.paceWeeks(state, terms);
    var late = pace > terms.deadlineWeeks;
    // A renewal option adds its records (labels use it when you're doing well, and some never let go).
    var records = (terms.owe.count + (terms.renewal || 0)) * (late && terms.penalty === 'extend' ? 2 : 1);
    var weeks = records * Math.max(terms.deadlineWeeks, pace);
    var royalty = late && terms.penalty === 'royalty' ? Math.max(b.penaltyAmounts.royaltyFloor, terms.royalty - b.penaltyAmounts.royalty * records / 2) : terms.royalty;
    var fines = late && terms.penalty === 'fine' ? Math.max(b.penaltyAmounts.fineMin, terms.advance * b.penaltyAmounts.fineShare) * records : 0;
    var perSongWeek = fans * e.perFanPerSongWeek;
    var activeSongs = tracks * records / 2;
    var unsigned = perSongWeek * activeSongs * weeks;              // what those records would make you unsigned
    var royalties = unsigned * (1 + terms.reach) * royalty;        // your share of them under the deal
    var studio = Game.balance.recording.studios[lb.tierOpen(state, 'mid') ? 'pro' : 'demo'].cost;
    var charged = terms.advance + (terms.recoup.recording ? studio * tracks * terms.owe.count : 0) +
      (terms.recoup.promo && terms.freePromo ? Game.balance.streaming.promos[terms.freePromo].cost * terms.owe.count : 0) +
      (terms.recoup.tour ? terms.tourSupport * Math.max(1, Math.round(weeks / 12)) : 0);
    var streamCash = Math.max(0, royalties - charged);
    var tours = terms.tourSupport * Math.max(1, Math.round(weeks / 12));
    var total = terms.advance + streamCash + tours - fines;
    var show = lb.recentShowMoney(state);
    var cut360 = (show.gigs * terms.gigCut + show.merch * terms.merchCut) * weeks;
    var pushFans = lb.pushFansFor(state, terms.push, terms.owe.type) * terms.owe.count;
    var releasedSongs = Object.keys(state.songs).filter(function (id) { return state.songs[id].releaseId; }).length;
    // New fans are worth streams on all your songs, and bigger crowds at your shows (about half the time on average).
    var fansValue = pushFans * e.perFanPerSongWeek * (releasedSongs + activeSongs) * weeks / 2 +
      (show.gigs + show.merch) * Math.min(1, pushFans / Math.max(1, fans)) * weeks / 2;
    var value = total + fansValue - cut360;
    var ratio = unsigned > 0 ? value / unsigned : (value > 0 ? 9 : 0);
    var perWeekRoyalty = perSongWeek * tracks * (1 + terms.reach) * terms.royalty;
    // A contract full of traps is worse than its numbers: 4+ harsh terms drop the verdict one step.
    var harsh = lb.termRows(state, terms).filter(function (r) { return r.rating === 'harsh'; }).length;
    var verdicts = ['harsh', 'fair', 'good'];
    var level = ratio >= 1.3 ? 2 : (ratio >= 0.8 ? 1 : 0);
    if (harsh >= b.estimate.trapTerms) level = Math.max(0, level - 1);
    // A deal that opens a door you don't have yet (the National cities, arenas) is worth a step more: that's the
    // push to the next level.
    var opensNew = ((terms.tier === 'mid' || terms.tier === 'major') && !lb.opens(state, 'national')) || (terms.tier === 'major' && !lb.opens(state, 'bigShows'));
    if (opensNew) level = Math.min(2, level + 1);
    return {
      weeks: weeks, pace: pace, late: late, fines: Math.round(fines), unsigned: Math.round(unsigned), royalties: Math.round(royalties), total: Math.round(total), cut360: Math.round(cut360),
      pushFans: pushFans, fansValue: Math.round(fansValue), value: Math.round(value), ratio: ratio,
      verdict: verdicts[level], harshTerms: harsh, opensNew: opensNew,
      recoupWeeks: perWeekRoyalty > 0 && charged / perWeekRoyalty < weeks * 3 ? Math.ceil(charged / perWeekRoyalty) : null,
      buyoutNow: lb.round(terms.advance * (terms.buyout.mult + terms.buyout.flatShare))
    };
  },

  // About how many weeks a record of this deal's kind takes you to write, at your Songwriting and a typical week.
  paceWeeks: function (state, terms) {
    var sb = Game.balance.songs;
    var blocksPerSong = Math.ceil(sb.progressToFinish / (sb.progressBase + state.player.skills.songwriting / sb.progressSongwritingDivisor));
    var e = Game.balance.label.estimate;
    return Math.ceil(e.tracks[terms.owe.type] * blocksPerSong / e.writeBlocksPerWeek);
  },

  // Plain text for each kind of term.
  mastersText: function (t) {
    if (t.masters === 'artist') return 'You own them';
    if (t.masters === 'reverts') return 'The label owns them, then they come back to you ' + Math.round(t.revertWeeks / 52) + ' years after the deal';
    return 'The label owns them forever';
  },
  controlText: function (t) {
    if (t.control === 'full') return 'You decide what comes out and when';
    if (t.control === 'approval') return 'They reject records with average recording quality under ' + t.qualityBar;
    var w = Game.balance.label.shelveWeeks;
    return 'They can hold ("shelve") a finished record for ' + w.min + ' to ' + w.max + ' weeks';
  },
  penaltyText: function (t) {
    var p = Game.balance.label.penaltyAmounts;
    if (t.penalty === 'fine') return 'A fine of $' + Math.max(p.fineMin, Game.rules.label.round(t.advance * p.fineShare)).toLocaleString();
    if (t.penalty === 'royalty') return 'Your royalty drops ' + Math.round(p.royalty * 100) + ' points';
    return 'You owe ' + p.extend + ' more record';
  },
  oweText: function (t) {
    var kind = t.owe.type === 'album' ? 'album' : 'EP or album';
    return t.owe.count + ' ' + (t.owe.count === 1 ? kind : (t.owe.type === 'album' ? 'albums' : 'EPs or albums'));
  },

  // Every term as a row for the contract: { id, name, value, meaning, rating: 'good' | 'fair' | 'harsh' }.
  termRows: function (state, t) {
    var lb = Game.rules.label;
    var money = function (n) { return '$' + Math.round(n).toLocaleString(); };
    var pct = function (x) { return Math.round(x * 100) + '%'; };
    var weekly = lb.weeklyPay(state);
    var charges = ['recording', 'promo', 'tour'].filter(function (k) { return t.recoup[k]; });
    var chargeNames = { recording: 'studio time', promo: 'promo pushes', tour: 'tour support' };
    var buyoutNow = lb.round(t.advance * (t.buyout.mult + t.buyout.flatShare));
    var rows = [
      { id: 'advance', name: 'Advance', value: money(t.advance),
        meaning: 'Paid when you sign. It isn\'t free money: it\'s paid back from your royalty before you see any streaming money from these records.' +
          (weekly > 0 ? ' That\'s about ' + Math.round(t.advance / weekly) + ' weeks of your streaming money right now.' : ''),
        rating: t.advance >= 50000 || (weekly > 0 && t.advance / weekly >= 20) ? 'good' : (weekly > 0 && t.advance / weekly < 4 && t.advance < 10000 ? 'harsh' : 'fair') },
      { id: 'royalty', name: 'Royalty', value: pct(t.royalty) + ' to you',
        meaning: 'Your share of streaming money from records made under this deal. The label keeps ' + pct(1 - t.royalty) + '.',
        rating: t.royalty >= 0.4 ? 'good' : (t.royalty >= 0.2 ? 'fair' : 'harsh') },
      { id: 'reach', name: 'Reach and push', value: '+' + pct(t.reach) + ' streams',
        meaning: 'The label boosts streams and new fans on these records' + (t.push > 0 ? ', and each record wins about ' +
          lb.pushFansFor(state, t.push, t.owe.type).toLocaleString() + ' new fans across the cities you can play' : '') + '.',
        rating: t.reach >= 0.6 ? 'good' : 'fair' },
      { id: 'support', name: 'Support', value: (t.freePromo ? Game.content.promos[t.freePromo].name + ' on every record' : 'No promo push') +
          (t.tourSupport ? ', ' + money(t.tourSupport) + ' per tour' : ''),
        meaning: t.freePromo || t.tourSupport ? 'The label pays for these.' : 'You\'re on your own for promotion and touring.',
        rating: t.freePromo || t.tourSupport ? 'good' : 'fair' },
      { id: 'recoup', name: 'Charged back to you', value: charges.length ? charges.map(function (k) { return chargeNames[k]; }).join(', ') : 'Nothing extra',
        meaning: charges.length ? 'These costs are added to what you owe the label and paid back from your royalty too.' : 'Only the advance is paid back.',
        rating: !charges.length ? 'good' : (charges.length === 1 ? 'fair' : 'harsh') },
      { id: 'records', name: 'Records owed', value: lb.oweText(t) + ', ' + t.deadlineWeeks + ' weeks each',
        meaning: 'Singles don\'t count. Each record is due ' + t.deadlineWeeks + ' weeks after the last one (or after signing). Missing a deadline: ' +
          lb.penaltyText(t).toLowerCase() + '.',
        rating: t.deadlineWeeks >= 20 && t.owe.count <= 2 ? 'good' : (t.deadlineWeeks >= 15 ? 'fair' : 'harsh') },
      { id: 'control', name: 'Creative control', value: { full: 'Yours', approval: 'Their approval', shelve: 'They can shelve' }[t.control],
        meaning: lb.controlText(t) + '.', rating: t.control === 'full' ? 'good' : (t.control === 'approval' ? 'fair' : 'harsh') },
      { id: 'masters', name: 'Masters', value: { artist: 'Yours', reverts: 'Come back to you', label: 'Theirs forever' }[t.masters],
        meaning: lb.mastersText(t) + '. ' + (t.masters === 'artist' ? 'After the deal, those records pay you everything.'
          : 'While they own them, those records keep paying you only your royalty.'),
        rating: t.masters === 'artist' ? 'good' : (t.masters === 'reverts' ? 'fair' : 'harsh') },
      { id: 'cut360', name: '360 cut', value: t.gigCut || t.merchCut ? pct(t.gigCut) + ' of shows, ' + pct(t.merchCut) + ' of merch' : 'None',
        meaning: t.gigCut || t.merchCut ? 'The label takes this from every show\'s pay and every merch sale while you\'re signed.' : 'Your shows and merch stay yours.',
        rating: !t.gigCut && !t.merchCut ? 'good' : (t.gigCut <= 0.1 && t.merchCut <= 0.1 ? 'fair' : 'harsh') },
      { id: 'renewal', name: 'Renewal option', value: t.renewal ? '+' + t.renewal + ' record' + (t.renewal === 1 ? '' : 's') : 'None',
        meaning: t.renewal ? 'If your last record is good (quality ' + Game.balance.label.renewalMinQuality + '+), the label can keep you for more.' : 'The deal ends when you deliver.',
        rating: !t.renewal ? 'good' : (t.dropsYou ? 'fair' : 'harsh') },
      { id: 'buyout', name: 'Buyout', value: money(buyoutNow) + ' today',
        meaning: 'To leave early: what you still owe them' + (t.buyout.mult !== 1 ? ' x' + t.buyout.mult : '') +
          (t.buyout.flatShare ? ' plus ' + pct(t.buyout.flatShare) + ' of the advance' : '') + '.',
        rating: t.buyout.mult + t.buyout.flatShare <= 1.2 ? 'good' : (t.buyout.mult + t.buyout.flatShare <= 2 ? 'fair' : 'harsh') },
      { id: 'drop', name: 'Getting out', value: t.dropsYou ? 'They can drop you' : 'They never let go',
        meaning: t.dropsYou ? Game.balance.label.strikesToDrop + ' strikes (missed deadlines, or records under quality ' + t.flopQuality +
          ') and they can drop you: reputation ' + Game.balance.label.dropReputation + ', but you\'re free.'
          : 'No matter what happens, the only way out is the buyout.',
        rating: t.dropsYou ? 'fair' : 'harsh' }
    ];
    if (t.awardsBoost) rows.push({ id: 'awards', name: 'Prestige', value: '+' + pct(t.awardsBoost) + ' at the awards',
      meaning: 'Their records get noticed by awards voters.', rating: 'good' });
    var opens = [];
    if (!state.label.opened.topStudio) opens.push('the Top studio');
    if ((t.tier === 'mid' || t.tier === 'major') && !Game.rules.label.opens(state, 'national')) opens.push('the National cities');
    if (t.tier === 'major' && !state.label.opened.bigShows) opens.push('arena and festival offers (at reputation ' + Game.balance.milestones.arenaReputation + ')');
    rows.push({ id: 'opens', name: 'Opens', value: opens.length ? opens.join(', ') : 'Nothing new',
      meaning: opens.length ? 'Signing opens these for good, even after the deal ends.' : 'You already have everything this label can open.',
      rating: opens.length ? 'good' : 'fair' });
    return rows;
  },

  // Your manager's take: the two worst clauses (or the best part), and how the numbers come out.
  managerTake: function (state, t, est) {
    var lb = Game.rules.label;
    var who = lb.managerFirst();
    var money = function (n) { return '$' + Math.round(n).toLocaleString(); };
    var worst = [];
    if (est.late) worst.push('At your pace a record takes about ' + est.pace + ' weeks to write, and they want one every ' + t.deadlineWeeks +
      '. Every late record: ' + lb.penaltyText(t).toLowerCase() + '.');
    if (!t.dropsYou) worst.push('They never let you go, and buying out would cost about ' + money(est.buyoutNow) + '.');
    if (t.royalty < 0.15) worst.push('A ' + Math.round(t.royalty * 100) + '% royalty is robbery. Those records would barely pay you.');
    if (t.gigCut + t.merchCut >= 0.3) worst.push('They want ' + Math.round(t.gigCut * 100) + '% of your shows and ' + Math.round(t.merchCut * 100) + '% of your merch. That\'s about ' + money(est.cut360) + ' over the deal.');
    if (t.masters === 'label') worst.push('They\'d own those recordings forever.');
    if (t.control === 'shelve') worst.push('They can sit on your records for weeks.');
    var verdict = { good: 'On the numbers, this is a strong deal.', fair: 'On the numbers, it\'s about even with staying independent.',
      harsh: 'On the numbers, you\'d come out behind.' }[est.verdict] +
      (est.opensNew ? (est.verdict === 'good' ? ' And' : ' But') + ' they\'d open doors we can\'t open ourselves yet.' : '');
    if (worst.length) return who + ': "' + worst.slice(0, 2).join(' ') + ' ' + verdict + '"';
    var best = t.masters === 'artist' ? 'You keep your masters. That\'s rare.' : (t.reach >= 0.6 ? 'Their reach would put you in front of a lot of new people.'
      : (t.royalty >= 0.4 ? 'That royalty is generous.' : 'Nothing scary in the fine print.'));
    return who + ': "' + best + ' ' + verdict + '"';
  },

  // ----- Counter-offers -----

  askIds: function () { return Object.keys(Game.balance.label.counter.asks); },

  // Why an ask doesn't make sense for these terms, or null.
  askProblem: function (t, ask) {
    if (!Game.balance.label.counter.asks[ask]) return 'Pick something to ask for.';
    if (ask === 'records' && t.owe.count <= 1) return 'They only want one record already.';
    if (ask === 'masters' && t.masters === 'artist') return 'You\'d already own your masters.';
    if (ask === 'no360' && !t.gigCut && !t.merchCut) return 'There\'s no cut to drop.';
    return null;
  },

  // The terms with the asks granted.
  applyAsks: function (t, asks) {
    var a = Game.balance.label.counter.asks;
    var n = Game.util.clone(t);
    asks.forEach(function (ask) {
      if (ask === 'advance') n.advance = Game.rules.label.round(n.advance * (1 + a.advance.amount));
      if (ask === 'royalty') n.royalty = Math.min(0.9, Math.round((n.royalty + a.royalty.amount) * 100) / 100);
      if (ask === 'records') n.owe.count = Math.max(1, n.owe.count - a.records.amount);
      if (ask === 'deadline') n.deadlineWeeks += a.deadline.amount;
      if (ask === 'masters') {
        if (n.masters === 'label') { n.masters = 'reverts'; n.revertWeeks = Game.balance.label.revertWeeks.max; } else { n.masters = 'artist'; n.revertWeeks = null; }
      }
      if (ask === 'no360') { n.gigCut = 0; n.merchCut = 0; }
    });
    return n;
  },

  // The chance a label agrees to these asks: base - each ask's cost + a bidding war + your fame and buzz.
  counterChance: function (state, messageId, asks) {
    var c = Game.balance.label.counter;
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m) return 0;
    var others = Game.rules.label.openOffers(state).length - 1;
    var t = Game.balance.label.tiers[m.data.terms.tier];
    var cities = Object.keys(state.cities).filter(function (id) { return state.cities[id].fans > 0; });
    var buzz = cities.length ? cities.reduce(function (s, id) { return s + state.cities[id].buzz; }, 0) / cities.length : 0;
    var chance = c.base - asks.reduce(function (s, ask) { return s + c.asks[ask].cost; }, 0) + others * c.perOtherOffer +
      Math.max(0, state.player.reputation - t.minReputation) / c.fameDivisor + buzz / c.buzzDivisor;
    return Game.util.clamp(chance, c.minChance, c.maxChance);
  },

  counterProblem: function (state, messageId, asks) {
    var c = Game.balance.label.counter;
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'labelOffer') return 'That offer isn\'t open.';
    if (m.data.counter) return 'You\'ve already made your counter-offer on this deal.';
    if (!asks.length) return 'Pick what to ask for.';
    if (asks.length > c.maxAsks) return 'Ask for at most ' + c.maxAsks + ' things.';
    for (var i = 0; i < asks.length; i++) {
      var p = Game.rules.label.askProblem(m.data.terms, asks[i]);
      if (p) return p;
    }
    return null;
  },

  // Sends a counter-offer: the label answers the next morning (the offer stays open until then). Returns { state, log }.
  counter: function (state, messageId, asks) {
    var c = Game.balance.label.counter;
    var problem = Game.rules.label.counterProblem(state, messageId, asks);
    if (problem) return { state: state, log: [problem] };
    var chance = Game.rules.label.counterChance(state, messageId, asks);
    var s = Game.util.clone(state);
    var m = s.inbox.filter(function (x) { return x.id === messageId; })[0];
    m.data.counter = { asks: asks.slice(), chance: chance, replyDay: s.day + c.replyDays, status: 'pending' };
    m.expiresDay = Math.max(m.expiresDay, s.day + c.replyDays + c.keepOpenDays);
    return { state: s, log: ['Counter-offer sent to ' + Game.rules.label.name(m.data.labelId) + ' (' + Math.round(chance * 100) + '% chance). They\'ll answer tomorrow.'] };
  },

  // ----- Signing and turning down -----

  signProblem: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'labelOffer') return 'That offer isn\'t open.';
    if (state.label.deal) return 'You\'re already signed with ' + Game.rules.label.name(state.label.deal.labelId) + '.';
    if (m.data.counter && m.data.counter.status === 'pending') return 'Wait for their answer to your counter-offer (tomorrow).';
    return null;
  },

  // Signs a deal: the advance is paid now, the other offers are withdrawn, and the label's doors open.
  // Returns { state, log }.
  sign: function (state, messageId) {
    var lb = Game.rules.label;
    var problem = lb.signProblem(state, messageId);
    if (problem) return { state: state, log: [problem] };
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var s = Game.util.clone(state);
    var t = Game.util.clone(m.data.terms);
    var deal = Object.assign(t, {
      id: 'd' + s.label.nextDealId, signedDay: s.day, unrecouped: t.advance, recouped: 0, recoupShare: 1, royaltyPaid: 0, labelKept: 0,
      cut360: 0, charged: 0, delivered: 0, nextDueDay: s.day + t.deadlineWeeks * Game.balance.time.daysPerWeek, misses: 0, flops: 0,
      strikes: 0, renewed: false, reminders: {}, endDay: null, endReason: null, allReleases: false
    });
    s.label.nextDealId += 1;
    s.label.deal = deal;
    s.label.everSigned = true;
    s.label.pending = [];
    s.label.opened.topStudio = true;
    if (t.tier === 'mid' || t.tier === 'major') s.label.opened.national = true;
    if (t.tier === 'major') s.label.opened.bigShows = true;
    s.inbox.forEach(function (x) {
      if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; }
      else if (x.kind === 'labelOffer' && !x.resolved) { x.resolved = 'withdrawn'; x.data.cooled = true; }
    });
    s = Game.rules.money.earn(s, t.advance, 'label').state;
    s = Game.rules.progress.checkUnlocks(s).state; // the record deal milestone, and any cities it opens
    return { state: s, log: ['You signed with ' + lb.name(t.labelId) + ': +$' + t.advance.toLocaleString() + '. You owe them ' + lb.oweText(t) +
      '; the first is due ' + Game.rules.day.dateLabel(deal.nextDueDay) + '. Your deal is on the Manager screen.'] };
  },

  // ----- Money under a deal -----

  // The label's boost to a song's streams this week (0 if it isn't on a record from your current deal).
  reachFor: function (state, song) {
    var d = state.label.deal;
    if (!d) return 0;
    var rel = Game.rules.streaming.releaseOf(state, song);
    var owner = Game.rules.label.releaseDeal(state, rel);
    return owner && owner.id === d.id ? d.reach : 0;
  },

  // Your share of a record's streaming money under its deal: royalty while the deal runs; after it, everything if you
  // own the masters (or they've come back), otherwise still the royalty.
  yourShare: function (state, deal) {
    if (deal.endDay === null) return deal.royalty;
    if (deal.masters === 'artist') return 1;
    if (deal.masters === 'reverts' && state.day >= deal.endDay + deal.revertWeeks * Game.balance.time.daysPerWeek) return 1;
    return deal.royalty;
  },

  // Sunday: splits the week's streaming money record by record. payByRelease: { releaseId: dollars }.
  // Your share of a current deal's records pays back what you owe the label first. Returns { state, log }.
  settleStreaming: function (state, payByRelease) {
    var lb = Game.rules.label;
    var s = Game.util.clone(state);
    var yours = 0, kept = 0, recouped = 0, total = 0;
    var relById = {};
    s.releases.forEach(function (r) { relById[r.id] = r; });
    Object.keys(payByRelease).forEach(function (relId) {
      var pay = payByRelease[relId];
      total += pay;
      var deal = lb.releaseDeal(s, relById[relId]);
      if (!deal) { yours += pay; return; }
      var mine = Math.round(pay * lb.yourShare(s, deal));
      var theirs = pay - mine;
      if (deal.endDay === null && deal.unrecouped > 0) {
        var back = Math.min(deal.unrecouped, Math.round(mine * deal.recoupShare));
        deal.unrecouped -= back;
        deal.recouped += back;
        mine -= back;
        theirs += back;
        recouped += back;
      }
      deal.royaltyPaid += mine;
      deal.labelKept += theirs;
      yours += mine;
      kept += theirs;
    });
    if (yours > 0) s = Game.rules.money.earn(s, yours, 'streaming').state;
    if (kept > 0) Game.rules.finances.add(s, { flow: 'band', cat: 'labelKept', amount: kept });
    var d = s.label.deal;
    var line = 'Streaming: $' + total.toLocaleString() + ' this week. You got $' + yours.toLocaleString() + (kept ? ' (the label kept $' + kept.toLocaleString() +
      (recouped ? ', $' + recouped.toLocaleString() + ' of it paying back your advance' : '') + ')' : '') + '.' +
      (d && recouped && d.unrecouped === 0 ? ' Your ' + lb.name(d.labelId) + ' advance is paid back: from now on your royalty comes to you.' : '');
    return { state: s, log: [line] };
  },

  // The label's cut of a show's pay, or of merch sales (0 without a deal).
  gigCut: function (state, pay) { var d = state.label.deal; return d ? Math.round(pay * d.gigCut) : 0; },
  merchCut: function (state, revenue) { var d = state.label.deal; return d ? Math.round(revenue * d.merchCut) : 0; },

  // Studio time under a deal: the label pays, and may charge it back to you. Changes s. Returns a short note.
  payStudio: function (s, cost) {
    var d = s.label.deal;
    if (!d || cost <= 0) return null;
    Game.rules.finances.add(s, { flow: 'band', cat: 'labelPaid', amount: cost });
    if (d.recoup.recording) { d.unrecouped += cost; d.charged += cost; return 'paid by ' + Game.rules.label.name(d.labelId) + ', charged to your account'; }
    return 'paid by ' + Game.rules.label.name(d.labelId);
  },

  // Tour support when you accept a tour. Returns { state, log }.
  tourSupport: function (state) {
    var d = state.label.deal;
    if (!d || !d.tourSupport) return { state: state, log: [] };
    var s = Game.rules.money.earn(state, d.tourSupport, 'labelSupport').state;
    if (d.recoup.tour) { s.label.deal.unrecouped += d.tourSupport; s.label.deal.charged += d.tourSupport; }
    return { state: s, log: [Game.rules.label.name(d.labelId) + ' chipped in $' + d.tourSupport.toLocaleString() + ' of tour support' +
      (d.recoup.tour ? ' (charged to your account)' : '') + '.'] };
  },

  // ----- Releasing under a deal -----

  // Why the label won't put this record out, or null.
  releaseProblem: function (state, avgQuality) {
    var d = state.label.deal;
    if (!d || !d.qualityBar || avgQuality >= d.qualityBar) return null;
    return Game.rules.label.name(d.labelId) + ' won\'t put out a record under quality ' + d.qualityBar + ' (this one averages ' + Math.round(avgQuality) +
      '). Re-record the songs in a better studio, or pick stronger ones.';
  },

  // A label that shelves may hold a new record: days to hold it (0 = it comes out now). Uses the given dice.
  holdDays: function (state, rng) {
    var d = state.label.deal;
    var w = Game.balance.label.shelveWeeks;
    if (!d || d.control !== 'shelve' || !rng.chance(Game.balance.label.shelveChance)) return 0;
    return rng.int(w.min, w.max) * Game.balance.time.daysPerWeek;
  },

  // The label's push when a record comes out: new fans in every city you can play. Changes nothing else.
  // Returns { state, gained }.
  pushFans: function (state, rel, rng) {
    var deal = Game.rules.label.releaseDeal(state, rel);
    if (!deal || deal.endDay !== null || !deal.push) return { state: state, gained: 0 };
    var rb = Game.balance.releases;
    var size = rb.sizeBonus[rel.type] / rb.sizeBonus.album;
    var s = state;
    var gained = 0;
    Object.keys(s.cities).filter(function (id) { return s.cities[id].unlocked; }).forEach(function (id) {
      var n = Game.content.cities[id].fanCeiling * deal.push * (rel.avgQuality / 100) * size;
      var added = Game.rules.audience.addFans(s, id, Game.rules.gigs.roundFans(rng, n));
      s = added.state;
      gained += added.added;
    });
    return { state: s, gained: gained };
  },

  // After a release under a deal: the label's free promo, records delivered, flops, renewals, and the deal ending
  // when you've delivered everything. rel is in s.releases already (s is changed). Returns { state, log }.
  onRelease: function (s, rel) {
    var lb = Game.rules.label;
    var b = Game.balance.label;
    var d = s.label.deal;
    if (!d) return { state: s, log: [] };
    var log = [];
    rel.dealId = d.id;
    if (d.legacy) return { state: s, log: [] }; // an older save's deal: nothing owed
    if (!rel.promo && d.freePromo) {
      rel.promo = { id: d.freePromo, week: 0 };
      var cost = Game.balance.streaming.promos[d.freePromo].cost;
      Game.rules.finances.add(s, { flow: 'band', cat: 'labelPaid', amount: cost });
      if (d.recoup.promo) { d.unrecouped += cost; d.charged += cost; }
      log.push(lb.name(d.labelId) + ' paid for a ' + Game.content.promos[d.freePromo].name.toLowerCase() + (d.recoup.promo ? ' (charged to your account)' : '') + '.');
    }
    if (!lb.counts(d, rel.type)) {
      log.push('Singles don\'t count toward your ' + lb.name(d.labelId) + ' deal.');
      return { state: s, log: log };
    }
    d.delivered += 1;
    d.nextDueDay = s.day + d.deadlineWeeks * Game.balance.time.daysPerWeek;
    d.reminders = {};
    if (rel.avgQuality < d.flopQuality) {
      d.flops += 1;
      d.strikes += 1;
      log.push(lb.name(d.labelId) + ' thinks "' + rel.name + '" flopped (quality under ' + d.flopQuality + '). That\'s strike ' + d.strikes + '.');
      if (d.dropsYou && d.strikes >= b.strikesToDrop) return lb.drop(s, log);
    }
    if (d.delivered < d.owe.count) {
      log.push('That\'s ' + d.delivered + ' of ' + d.owe.count + ' records for ' + lb.name(d.labelId) + '. The next is due ' + Game.rules.day.dateLabel(d.nextDueDay) + '.');
      return { state: s, log: log };
    }
    if (d.renewal && !d.renewed && rel.avgQuality >= b.renewalMinQuality) {
      d.renewed = true;
      d.owe.count += d.renewal;
      log.push(lb.name(d.labelId) + ' liked it so much they picked up their option: you owe them ' + d.renewal + ' more record' + (d.renewal === 1 ? '' : 's') + '.');
      return { state: s, log: log };
    }
    return lb.endDeal(s, 'delivered', log.concat(['That\'s everything you owed ' + lb.name(d.labelId) + '. The deal is done: you\'re a free agent.']));
  },

  // Ends the current deal (reason: 'delivered' | 'bought out' | 'dropped'). Anything still owed is written off.
  // Changes s. Returns { state, log }.
  endDeal: function (s, reason, log) {
    var d = s.label.deal;
    d.endDay = s.day;
    d.endReason = reason;
    d.unrecouped = 0;
    s.label.past.push(d);
    s.label.deal = null;
    s.label.pending = [];
    s.label.nextOfferDay = s.day + Game.balance.label.afterDealWeeks * Game.balance.time.daysPerWeek;
    return { state: s, log: log || [] };
  },

  // The label drops you: reputation and buzz take a hit, and the deal ends. Changes s. Returns { state, log }.
  drop: function (s, log) {
    var b = Game.balance.label;
    var name = Game.rules.label.name(s.label.deal.labelId);
    s.player.reputation = Game.util.clamp(s.player.reputation + b.dropReputation, 0, Game.balance.reputation.max);
    Object.keys(s.cities).forEach(function (id) {
      if (s.cities[id].fans > 0) s = Game.rules.audience.addBuzz(s, id, b.dropBuzz).state;
    });
    s.label.droppedDay = s.day;
    var text = name + ' dropped you. Reputation ' + b.dropReputation + ', and the buzz is gone for now. You\'re free to sign somewhere else.';
    s = Game.rules.booking.addInbox(s, 'note', { title: name + ' dropped you', text: text }, null);
    return Game.rules.label.endDeal(s, 'dropped', (log || []).concat([text]));
  },

  // What it costs to buy yourself out today.
  buyoutPrice: function (state) {
    var d = state.label.deal;
    if (!d) return 0;
    return Game.rules.label.round(Math.max(0, d.unrecouped) * d.buyout.mult + d.advance * d.buyout.flatShare);
  },

  buyoutProblem: function (state) {
    if (!state.label.deal) return 'You don\'t have a label deal.';
    var price = Game.rules.label.buyoutPrice(state);
    if (state.player.cash < price) return 'You\'d need $' + price.toLocaleString() + ' (you have $' + Math.floor(state.player.cash).toLocaleString() + ').';
    return null;
  },

  // Buys you out of your deal. Returns { state, log }.
  buyout: function (state) {
    var lb = Game.rules.label;
    var problem = lb.buyoutProblem(state);
    if (problem) return { state: state, log: [problem] };
    var price = lb.buyoutPrice(state);
    var name = lb.name(state.label.deal.labelId);
    var s = price > 0 ? Game.rules.money.spend(state, price, 'labelBuyout').state : state;
    s = Game.util.clone(s);
    var masters = { artist: 'They\'re yours.', reverts: 'They come back to you ' + Math.round((s.label.deal.revertWeeks || 0) / 52) + ' years from now.',
      label: name + ' keeps them, and keeps its share of their streaming.' }[s.label.deal.masters];
    return lb.endDeal(s, 'bought out', ['You bought yourself out of your ' + name + ' deal for $' + price.toLocaleString() + '. The records you made with them: ' + masters]);
  },

  // ----- Overnight -----

  // Each night: records the label was holding come out, counter-offers get their answers, deadlines bring reminders
  // and penalties, turned-down offers start their cooldowns (an offer you let run out may go to a rival), and the
  // doors a deal opens stay open. Returns { state, log }.
  nightly: function (state) {
    var lb = Game.rules.label;
    var b = Game.balance.label;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var log = [];
    var notes = [];

    // Held records come out.
    s.releases.forEach(function (rel) {
      if (!rel.held || rel.day > s.day) return;
      rel.held = false;
      var out = Game.rules.recording.releaseEffects(s, rel, rng);
      s = out.state;
      notes.push({ title: '"' + rel.name + '" is out', text: '"' + rel.name + '" is finally out. ' + out.text });
      log.push('"' + rel.name + '" is out. ' + out.text);
    });

    // Counter-offer answers.
    s.inbox.forEach(function (m) {
      if (m.kind !== 'labelOffer' || m.resolved || !m.data.counter || m.data.counter.status !== 'pending' || m.data.counter.replyDay > s.day) return;
      var yes = rng.chance(m.data.counter.chance);
      m.data.counter.status = yes ? 'accepted' : 'refused';
      if (yes) m.data.terms = lb.applyAsks(m.data.terms, m.data.counter.asks);
      m.read = false;
      log.push(lb.name(m.data.labelId) + (yes ? ' agreed to your counter-offer. The new terms are in your Inbox.' : ' said no to your counter-offer. The original offer still stands.'));
    });

    // Deadlines: reminders, then the penalty for a missed one.
    var d = s.label.deal;
    if (d && d.nextDueDay !== null && d.delivered < d.owe.count) {
      var week = Game.balance.time.daysPerWeek;
      b.reminderWeeks.forEach(function (w) {
        if (d.nextDueDay - s.day === w * week && !d.reminders[w]) {
          d.reminders[w] = true;
          notes.push({ title: 'Record due for ' + lb.name(d.labelId), text: 'Your next record for ' + lb.name(d.labelId) + ' is due in ' + w + ' week' +
            (w === 1 ? '' : 's') + ' (' + Game.rules.day.dateLabel(d.nextDueDay) + '): ' + lb.oweText({ owe: { count: 1, type: d.owe.type } }) + '. Missing it: ' + lb.penaltyText(d).toLowerCase() + '.' });
        }
      });
      if (s.day > d.nextDueDay) {
        var missed = lb.missDeadline(s);
        s = missed.state;
        log = log.concat(missed.log);
        if (missed.note) notes.push(missed.note);
      }
    }

    // Offers you turned down or let run out: that label waits a while. One you let run out may go to a rival.
    var srng = Game.rng.create(s.scene.rngState);
    s.inbox.forEach(function (m) {
      if (m.kind !== 'labelOffer' || !m.data.labelId || m.data.cooled || (m.resolved !== 'declined' && m.resolved !== 'expired')) return;
      m.data.cooled = true;
      var cd = m.resolved === 'declined' ? b.declineCooldownWeeks : b.expireCooldownWeeks;
      s.label.cooldowns[m.data.labelId] = s.day + rng.int(cd.min, cd.max) * Game.balance.time.daysPerWeek;
      s.label.declined += 1;
      if (m.resolved === 'expired' && srng.chance(b.rivalSnipeChance)) {
        var free = Game.rules.scene.rivals(s).filter(function (band) { return !band.labelId; });
        if (free.length) {
          var rival = srng.pick(free);
          rival.labelId = m.data.labelId;
          notes.push({ title: rival.name + ' signed with ' + lb.name(m.data.labelId), text: 'The deal you let slip went to your rival ' + rival.name + '. ' +
            lb.name(m.data.labelId) + ' is putting their weight behind them now.' });
        }
      }
    });
    s.scene.rngState = srng.getState();

    // Doors stay open: a smaller label with a Top 10 record opens arena and festival offers.
    if (s.label.deal && !s.label.opened.bigShows && lb.hasTopTen(s)) s.label.opened.bigShows = true;

    s.rngState = rng.getState();
    notes.forEach(function (note) { s = Game.rules.booking.addInbox(s, 'note', note, null); });
    return { state: s, log: log };
  },

  // A missed deadline: the contract's penalty, a strike, and a new deadline (or the label drops you).
  // Changes s. Returns { state, log, note }.
  missDeadline: function (s) {
    var lb = Game.rules.label;
    var b = Game.balance.label;
    var p = b.penaltyAmounts;
    var d = s.label.deal;
    var name = lb.name(d.labelId);
    d.misses += 1;
    d.strikes += 1;
    d.nextDueDay += d.deadlineWeeks * Game.balance.time.daysPerWeek;
    d.reminders = {};
    var what;
    if (d.penalty === 'fine') {
      var fine = Math.max(p.fineMin, lb.round(d.advance * p.fineShare));
      s = Game.rules.money.spend(s, fine, 'labelFine').state;
      d = s.label.deal;
      what = 'a $' + fine.toLocaleString() + ' fine';
    } else if (d.penalty === 'royalty') {
      d.royalty = Math.max(p.royaltyFloor, Math.round((d.royalty - p.royalty) * 100) / 100);
      what = 'your royalty drops to ' + Math.round(d.royalty * 100) + '%';
    } else {
      d.owe.count += p.extend;
      what = 'you now owe them ' + d.owe.count + ' records in all';
    }
    var text = 'You missed your deadline for ' + name + ': ' + what + '. Strike ' + d.strikes + '. The next record is due ' + Game.rules.day.dateLabel(d.nextDueDay) + '.';
    if (d.dropsYou && d.strikes >= b.strikesToDrop) {
      var dropped = lb.drop(s, [text]);
      return { state: dropped.state, log: dropped.log, note: null };
    }
    return { state: s, log: [text], note: { title: 'Missed deadline: ' + name, text: text } };
  },

  // ----- What deals open -----

  hasTopTen: function (state) {
    var top = Game.balance.charts.topTen;
    var hit = function (ch) { return ch && ch.peak && ch.peak <= top; };
    return state.releases.some(function (r) { return hit(r.chart); }) ||
      Object.keys(state.songs).some(function (id) { return hit(state.songs[id].chart); });
  },

  // True if something a label can open is open: 'topStudio' | 'national' | 'bigShows' (once open, they stay open;
  // without the right label, the National cities and big shows open later on their own).
  opens: function (state, what) {
    var b = Game.balance.label;
    var o = state.label.opened;
    if (what === 'topStudio') return !!o.topStudio;
    if (what === 'national') return !!o.national || state.player.reputation >= b.nationalWithoutLabel;
    if (what === 'bigShows') {
      return !!o.bigShows || (!!state.label.deal && Game.rules.label.hasTopTen(state)) ||
        (state.player.reputation >= b.bigShowsWithout.reputation && Game.rules.progress.totalFans(state) >= b.bigShowsWithout.fans);
    }
    return false;
  },

  // How much more often arena and festival offers come with your label (1 without one).
  bigShowMult: function (state) { return state.label.deal ? state.label.deal.bigShowMult : 1; },

  // A release's awards boost from the label it came out on.
  awardsBoost: function (state, rel) {
    var deal = Game.rules.label.releaseDeal(state, rel);
    return deal ? deal.awardsBoost : 0;
  },

  // ----- Rivals -----

  // The best tier of label that would sign a band this size (sharks don't count).
  rivalTier: function (band) {
    var t = Game.balance.label.tiers;
    var tier = null;
    ['indie', 'mid', 'major'].forEach(function (k) { if (band.reputation >= t[k].minReputation && band.fans >= t[k].minFans) tier = k; });
    return tier;
  },

  // Mondays: rivals without a label may sign with one (the scene's own dice). Changes s. Returns notes for the Inbox.
  rivalSignings: function (s, rng) {
    var notes = [];
    Game.rules.scene.rivals(s).forEach(function (band) {
      if (band.labelId) return;
      var tier = Game.rules.label.rivalTier(band);
      if (!tier || !rng.chance(Game.balance.label.rivalSignChance)) return;
      var choices = Object.keys(Game.content.labels).filter(function (id) { return Game.content.labels[id].tier === tier; });
      band.labelId = rng.pick(choices);
      notes.push({ title: band.name + ' signed with ' + Game.rules.label.name(band.labelId),
        text: 'Your rival ' + band.name + ' signed with ' + Game.rules.label.name(band.labelId) + '. Expect their records to get a push.' });
    });
    return notes;
  },

  // A rival's streaming boost from its label (the middle of its tier's reach, shaped by the label's personality).
  rivalReach: function (band) {
    if (!band || !band.labelId || !Game.content.labels[band.labelId]) return 0;
    var info = Game.content.labels[band.labelId];
    var r = Game.balance.label.tiers[info.tier].reach;
    return (r.min + r.max) / 2 * Game.balance.label.personalities[info.personality].reachMult;
  },

  // ----- Older saves -----

  // An older save's Northbound deal (before version 24): 80% of all streaming paid the advance back, then it was all
  // yours. It owes nothing, and leaving is free.
  legacyDeal: function (old) {
    var b = Game.balance.label;
    return {
      labelId: 'northbound', tier: 'mid', personality: 'balanced', advance: old.advance || 0, royalty: 1, reach: 0, push: 0, freePromo: null, tourSupport: 0,
      owe: { count: 0, type: 'ep' }, deadlineWeeks: 0, penalty: 'fine', control: 'full', qualityBar: null, masters: 'artist', revertWeeks: null,
      gigCut: 0, merchCut: 0, recoup: { recording: false, promo: false, tour: false }, renewal: 0, buyout: { mult: 0, flatShare: 0 }, dropsYou: false,
      flopQuality: 0, awardsBoost: 0, bigShowMult: 1,
      id: 'd1', signedDay: old.signedDay || 0, unrecouped: Math.max(0, old.owed || 0), recouped: 0, recoupShare: b.legacyRecoupShare,
      royaltyPaid: 0, labelKept: 0, cut360: 0, charged: 0, delivered: 0, nextDueDay: null, misses: 0, flops: 0, strikes: 0, renewed: false,
      reminders: {}, endDay: null, endReason: null, allReleases: true, legacy: true
    };
  }
};
