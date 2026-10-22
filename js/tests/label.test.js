// label.test.js
// Tests for record labels (Game.rules.label): who can offer, offers and bidding wars, the terms each label can roll,
// counter-offers, signing, streaming money under a deal (royalty, paying back the advance, masters after the deal),
// the 360 cut, records owed (quality bar, shelving, flops, renewals, deadlines and their penalties), getting dropped,
// buying out, what deals open, rivals signing, and older saves. Day 0 is a Monday.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var L = function () { return Game.rules.label; };
  var week = 7;

  // A career with a manager, reputation 60, and 12,000 fans: indie and mid-size labels can call.
  function signedUpState() {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.manager.hired = true;
    s.manager.hiredDay = 0;
    s.player.reputation = 60;
    s.cities.hometown.fans = 12000;
    return s;
  }

  // An offer from a label (the game's dice from a fixed seed), added to the Inbox. Returns { state, id }.
  function offerFrom(s, labelId, seed) {
    var rng = Game.rng.create(seed || 7);
    var out = L().addOffer(s, rng, labelId);
    return { state: out, id: out.inbox[out.inbox.length - 1].id };
  }

  // Signs an offer whose terms you set yourself (changes: fields to override). Returns the state.
  function signWith(s, labelId, changes) {
    var o = offerFrom(s, labelId);
    var m = o.state.inbox[o.state.inbox.length - 1];
    Object.keys(changes || {}).forEach(function (k) { m.data.terms[k] = changes[k]; });
    return L().sign(o.state, o.id).state;
  }

  // Finished, recorded originals (quality q), not released yet. Returns { state, ids }.
  function recorded(s, n, q) {
    var ids = [];
    for (var i = 0; i < n; i++) {
      var st = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(st.state, st.songId).state;
      s.songs[st.songId].recording = { quality: q, day: s.day, studio: 'pro' };
      ids.push(st.songId);
    }
    return { state: s, ids: ids };
  }

  // ----- Who can offer -----

  Game.test('Labels: no offers without a manager; each tier has its own bar', function (t) {
    var s = signedUpState();
    s.manager.hired = false;
    t.equal(L().eligibleLabels(s).length, 0, 'no manager: no labels');
    t.ok(/manager/.test(L().offersProblem(s)), L().offersProblem(s));
    s.manager.hired = true;
    var tiers = L().eligibleLabels(s).map(function (id) { return Game.content.labels[id].tier; });
    t.ok(tiers.indexOf('indie') !== -1 && tiers.indexOf('mid') !== -1, 'indie and mid-size at reputation 60 and 12,000 fans');
    t.equal(tiers.indexOf('major'), -1, 'no majors yet');
    s.player.reputation = 72;
    s.cities.hometown.fans = 50000;
    s.cities.harlowFalls.fans = 5000;
    t.ok(L().eligibleLabels(s).some(function (id) { return Game.content.labels[id].tier === 'major'; }), 'majors at reputation 70 and 50,000 fans');
  });

  Game.test('Labels: offers come on Mondays; a bidding war adds more (never more than 3 open)', function (t) {
    var found = null;
    for (var seed = 1; seed <= 400 && !found; seed++) {
      var s = signedUpState();
      s.rngState = seed;
      var r = L().offerCheck(s);
      if (L().openOffers(r.state).length) found = r.state;
    }
    t.ok(found, 'an offer arrived on some Monday');
    var m = L().openOffers(found)[0];
    t.ok(Game.content.labels[m.data.labelId] && m.data.terms.advance > 0, 'from ' + L().name(m.data.labelId) + ' with terms');
    var tuesday = Game.util.clone(found);
    tuesday.day = 1;
    t.equal(L().openOffers(L().offerCheck(tuesday).state).length >= 1, true, 'still open on Tuesday');
    // Joiners arrive on their day, up to the most open at once.
    var war = Game.util.clone(found);
    Object.keys(Game.content.labels).forEach(function (id) { war.label.pending.push({ labelId: id, day: 0 }); });
    var joined = L().offerCheck(war).state;
    t.equal(L().openOffers(joined).length, Game.balance.label.maxOpenOffers, 'a bidding war: ' + Game.balance.label.maxOpenOffers + ' open at most');
  });

  Game.test('Labels: sharks come more often when you\'re desperate', function (t) {
    var s = signedUpState();
    t.equal(L().desperate(s), false, 'not desperate');
    s.player.loanOwed = 1000;
    t.ok(L().desperate(s), 'in debt');
    s.player.loanOwed = 0;
    s.label.declined = Game.balance.label.desperate.declinedDeals;
    t.ok(L().desperate(s), 'after turning down ' + Game.balance.label.desperate.declinedDeals + ' deals');
  });

  // ----- Terms -----

  Game.test('Labels: every label\'s terms stay inside its tier and personality, and the same dice give the same offer', function (t) {
    var s = signedUpState();
    var b = Game.balance.label;
    var problems = [];
    Object.keys(Game.content.labels).forEach(function (id) {
      var info = Game.content.labels[id];
      var tier = b.tiers[info.tier];
      var p = b.personalities[info.personality];
      for (var seed = 1; seed <= 25; seed++) {
        var x = L().makeTerms(s, Game.rng.create(seed), id);
        var lo = Math.max(b.penaltyAmounts.royaltyFloor, tier.royalty.min + p.royaltyShift - 0.011);
        if (x.royalty < lo || x.royalty > tier.royalty.max + p.royaltyShift + 0.011) problems.push(id + ' royalty ' + x.royalty);
        if (x.owe.count < 1 || x.deadlineWeeks < 6) problems.push(id + ' records');
        if (!(p.masters[x.masters] > 0)) problems.push(id + ' masters ' + x.masters);
        if (!(p.control[x.control] > 0)) problems.push(id + ' control ' + x.control);
        if (x.gigCut && (x.gigCut < p.gigCut.min - 0.01 || x.gigCut > p.gigCut.max + 0.01)) problems.push(id + ' 360');
        if (x.dropsYou !== p.dropsYou) problems.push(id + ' drops');
        if (x.control === 'approval' && !x.qualityBar) problems.push(id + ' quality bar');
      }
    });
    t.equal(problems.length, 0, problems.slice(0, 5).join(', ') || 'all in range');
    t.sameContents(L().makeTerms(s, Game.rng.create(3), 'monolith'), L().makeTerms(s, Game.rng.create(3), 'monolith'), 'same seed, same offer');
    var shark = L().makeTerms(s, Game.rng.create(3), 'goldtooth');
    t.ok(shark.royalty <= 0.15 && shark.gigCut >= 0.2 && shark.masters === 'label' && !shark.dropsYou, 'a shark: low royalty, big 360 cut, masters, no way out');
    var friend = L().makeTerms(s, Game.rng.create(3), 'porchlight');
    t.ok(friend.royalty >= 0.5 && !friend.gigCut && friend.masters !== 'label', 'artist-friendly: high royalty, no 360, masters stay with you');
  });

  Game.test('Labels: the contract rates each term, and the estimate shows a shark deal is worse than a fair one', function (t) {
    var s = signedUpState();
    s.finances.shows.push({ day: s.day, gross: 2000, merch: 500 });
    var shark = L().makeTerms(s, Game.rng.create(5), 'goldtooth');
    var friend = L().makeTerms(s, Game.rng.create(5), 'porchlight');
    var es = L().estimate(s, shark);
    var ef = L().estimate(s, friend);
    t.ok(es.cut360 > 0 && ef.cut360 === 0, 'the 360 cut costs money with the shark only');
    t.ok(es.ratio < ef.ratio, 'shark ' + es.ratio.toFixed(2) + ' vs friendly ' + ef.ratio.toFixed(2));
    var rows = L().termRows(s, shark);
    var rating = function (id) { return rows.filter(function (r) { return r.id === id; })[0].rating; };
    t.equal(rating('royalty'), 'harsh', 'a shark royalty is harsh');
    t.equal(rating('drop'), 'harsh', 'never letting go is harsh');
    t.ok(/never let you go/.test(L().managerTake(s, shark, es)), 'the manager flags the worst clause: ' + L().managerTake(s, shark, es));
  });

  // ----- Counter-offers -----

  Game.test('Labels: one counter-offer; each ask lowers the odds, a bidding war raises them; the answer comes next morning', function (t) {
    var o = offerFrom(signedUpState(), 'northbound');
    var s = o.state;
    var one = L().counterChance(s, o.id, ['advance']);
    var two = L().counterChance(s, o.id, ['advance', 'royalty']);
    t.ok(two < one, 'two asks: lower odds');
    var war = offerFrom(s, 'neonHarbor', 9).state;
    t.ok(L().counterChance(war, o.id, ['advance']) > one, 'another label bidding: better odds');
    t.ok(L().counterProblem(s, o.id, ['advance', 'royalty', 'deadline']), 'at most 2 asks');
    var sent = L().counter(s, o.id, ['advance', 'records']).state;
    t.ok(L().signProblem(sent, o.id), 'can\'t sign while waiting for their answer');
    t.ok(L().counterProblem(sent, o.id, ['royalty']), 'only one counter-offer per deal');
    var before = sent.inbox.filter(function (m) { return m.id === o.id; })[0].data.terms;
    var yes = Game.util.clone(sent);
    yes.inbox.filter(function (m) { return m.id === o.id; })[0].data.counter.chance = 1;
    yes.day += 1;
    var after = L().nightly(yes).state.inbox.filter(function (m) { return m.id === o.id; })[0];
    t.equal(after.data.counter.status, 'accepted', 'they agreed');
    t.equal(after.data.terms.advance, L().round(before.advance * (1 + Game.balance.label.counter.asks.advance.amount)), 'a bigger advance');
    t.equal(after.data.terms.owe.count, Math.max(1, before.owe.count - 1), 'one record fewer');
    var no = Game.util.clone(sent);
    no.inbox.filter(function (m) { return m.id === o.id; })[0].data.counter.chance = 0;
    no.day += 1;
    var refused = L().nightly(no).state;
    var rm = refused.inbox.filter(function (m) { return m.id === o.id; })[0];
    t.equal(rm.data.counter.status, 'refused', 'they said no');
    t.equal(rm.data.terms.advance, before.advance, 'the original terms');
    t.equal(L().signProblem(refused, o.id), null, 'and you can still sign them');
  });

  // ----- Signing and turning down -----

  Game.test('Labels: signing pays the advance, withdraws the other offers, and opens doors by tier', function (t) {
    var s = signedUpState();
    t.ok(Game.rules.recording.studioProblem(s, 'top'), 'Top studio locked');
    var a = offerFrom(s, 'porchlight');
    var b = offerFrom(a.state, 'northbound', 11);
    var cash = b.state.player.cash;
    var advance = b.state.inbox.filter(function (m) { return m.id === b.id; })[0].data.terms.advance;
    var signed = L().sign(b.state, b.id).state;
    t.equal(signed.player.cash, cash + advance, '+$' + advance.toLocaleString());
    t.equal(signed.label.deal.labelId, 'northbound', 'signed with Northbound');
    t.equal(signed.inbox.filter(function (m) { return m.id === a.id; })[0].resolved, 'withdrawn', 'the other offer is withdrawn');
    t.equal(Game.rules.recording.studioProblem(signed, 'top'), null, 'Top studio open');
    t.ok(L().opens(signed, 'national') && !signed.label.opened.bigShows, 'a mid-size label opens the National cities, not arenas');
    t.ok(signed.milestones.labelOffer !== undefined, 'the Record deal milestone');
    t.equal(L().eligibleLabels(signed).length, 0, 'no offers while signed');
    var indie = L().sign(a.state, a.id).state;
    t.ok(!indie.label.opened.national, 'an indie doesn\'t open the National cities');
  });

  Game.test('Labels: turning one down starts its cooldown; other labels can still call', function (t) {
    var o = offerFrom(signedUpState(), 'neonHarbor');
    var s = Game.rules.booking.declineOffer(o.state, o.id).state;
    s.day += 1;
    s = L().nightly(s).state;
    t.ok(s.label.cooldowns.neonHarbor >= s.day + Game.balance.label.declineCooldownWeeks.min * week - 1, 'Neon Harbor waits 8+ weeks');
    var eligible = L().eligibleLabels(s);
    t.equal(eligible.indexOf('neonHarbor'), -1, 'not Neon Harbor');
    t.ok(eligible.indexOf('northbound') !== -1, 'Northbound can still call');
  });

  // ----- Money under a deal -----

  Game.test('Labels: streaming on a deal\'s records pays the label its share and your royalty pays back the advance first', function (t) {
    var s = signWith(signedUpState(), 'northbound', { royalty: 0.25, advance: 100, reach: 0 });
    s.releases.push({ id: 'rA', type: 'ep', songIds: [], day: 0, avgQuality: 60, dealId: s.label.deal.id });
    s.releases.push({ id: 'rB', type: 'ep', songIds: [], day: 0, avgQuality: 60 });
    var cash = s.player.cash;
    var r = L().settleStreaming(s, { rA: 1000, rB: 1000 }).state;
    t.equal(r.label.deal.unrecouped, 0, 'the $100 advance is paid back');
    t.equal(r.player.cash, cash + 1000 + 150, 'unsigned record: $1,000; deal record: 25% = $250, minus $100 paid back');
    t.equal(r.label.deal.labelKept, 850, 'the label kept $750 + $100');
    // After the deal: masters decide.
    var ended = Game.util.clone(r);
    ended = L().endDeal(ended, 'delivered').state;
    var deal = ended.label.past[0];
    deal.masters = 'artist';
    t.equal(L().yourShare(ended, deal), 1, 'your masters: everything is yours again');
    deal.masters = 'label';
    t.equal(L().yourShare(ended, deal), 0.25, 'their masters: still only your royalty');
    deal.masters = 'reverts';
    deal.revertWeeks = 104;
    t.equal(L().yourShare(ended, deal), 0.25, 'before they come back: your royalty');
    ended.day += 104 * week;
    t.equal(L().yourShare(ended, deal), 1, 'once they come back: everything');
  });

  Game.test('Labels: the label boosts streams on its records only, and takes its 360 cut of shows and merch', function (t) {
    var s = signWith(signedUpState(), 'neonHarbor', { reach: 0.5, gigCut: 0.2, merchCut: 0.1 });
    var o = recorded(s, 2, 70);
    s = o.state;
    s.releases.push({ id: 'rA', type: 'single', songIds: [o.ids[0]], day: 0, avgQuality: 70, dealId: s.label.deal.id });
    s.releases.push({ id: 'rB', type: 'single', songIds: [o.ids[1]], day: 0, avgQuality: 70 });
    s.songs[o.ids[0]].releaseId = 'rA';
    s.songs[o.ids[1]].releaseId = 'rB';
    t.equal(Game.rules.streaming.boosts(s, s.songs[o.ids[0]]).label, 0.5, 'the deal\'s record: +50%');
    t.equal(Game.rules.streaming.boosts(s, s.songs[o.ids[1]]).label, 0, 'your own record: no boost');
    t.equal(L().gigCut(s, 1000), 200, '20% of a $1,000 show');
    s.player.merchStock.shirts = 500;
    var sold = Game.rules.merch.sellAtGig(s, 400, 'legendary', 'cornerTap', null);
    t.equal(sold.labelCut, Math.round(sold.revenue * 0.1), 'and 10% of merch ($' + sold.labelCut + ' of $' + sold.revenue + ')');
    t.equal(sold.state.player.cash, s.player.cash + sold.revenue - sold.labelCut, 'you keep the rest');
  });

  // ----- Records owed -----

  Game.test('Labels: records owed count EPs and albums (not singles); delivering them all ends the deal', function (t) {
    var s = signWith(signedUpState(), 'porchlight', { owe: { count: 2, type: 'ep' }, renewal: 0, qualityBar: null, control: 'full' });
    var o = recorded(s, 4, 70);
    s = Game.rules.recording.release(o.state, 'single', [o.ids[0]], null, null).state;
    t.equal(s.label.deal.delivered, 0, 'a single doesn\'t count');
    t.equal(s.releases[s.releases.length - 1].dealId, s.label.deal.id, 'but it\'s on the label');
    s.day += week * 5;
    s = Game.rules.recording.release(s, 'ep', o.ids.slice(1, 4), 'First EP', null).state;
    t.equal(s.label.deal.delivered, 1, 'an EP counts');
    t.equal(s.label.deal.nextDueDay, s.day + s.label.deal.deadlineWeeks * week, 'the next deadline starts now');
    var more = recorded(s, 3, 70);
    s = Game.rules.recording.release(more.state, 'ep', more.ids, 'Second EP', null).state;
    t.equal(s.label.deal, null, 'everything delivered: the deal is over');
    t.equal(s.label.past[0].endReason, 'delivered', 'ended by delivering');
    t.ok(s.label.nextOfferDay > s.day, 'offers start again a few weeks later');
  });

  Game.test('Labels: an album-only deal ignores EPs; a renewal option keeps you when the last record is good', function (t) {
    var s = signWith(signedUpState(), 'monolith', { owe: { count: 1, type: 'album' }, renewal: 2, qualityBar: null, control: 'full' });
    var o = recorded(s, 11, 75);
    s = Game.rules.recording.release(o.state, 'ep', o.ids.slice(0, 3), 'An EP', null).state;
    t.equal(s.label.deal.delivered, 0, 'an EP doesn\'t count on an album deal');
    s.day += week * 5;
    s = Game.rules.recording.release(s, 'album', o.ids.slice(3, 11), 'The Album', null).state;
    t.ok(s.label.deal && s.label.deal.renewed, 'quality 75: they picked up their option');
    t.equal(s.label.deal.owe.count, 3, '2 more albums owed');
  });

  Game.test('Labels: a quality bar rejects weak records; a weak record is a flop (a strike)', function (t) {
    var s = signWith(signedUpState(), 'lanternHill', { control: 'approval', qualityBar: 65, flopQuality: 45, owe: { count: 3, type: 'ep' } });
    var o = recorded(s, 3, 50);
    t.ok(/won't put out/.test(Game.rules.recording.releaseProblem(o.state, 'ep', o.ids, null, null)), 'quality 50 is under the bar of 65');
    var s2 = signWith(signedUpState(), 'northbound', { control: 'full', qualityBar: null, flopQuality: 55, owe: { count: 3, type: 'ep' }, dropsYou: true });
    var o2 = recorded(s2, 3, 40);
    var r = Game.rules.recording.release(o2.state, 'ep', o2.ids, null, null).state;
    t.equal(r.label.deal.strikes, 1, 'quality 40: a flop, strike 1');
  });

  Game.test('Labels: a label that shelves holds the record; it comes out (with its fans and buzz) on its day', function (t) {
    var found = null;
    for (var seed = 1; seed <= 60 && !found; seed++) {
      var s = signWith(signedUpState(), 'sunsetGlobal', { control: 'shelve', qualityBar: null, owe: { count: 3, type: 'ep' } });
      s.rngState = seed;
      var o = recorded(s, 3, 70);
      var r = Game.rules.recording.release(o.state, 'ep', o.ids, 'Held', null).state;
      var rel = r.releases[r.releases.length - 1];
      if (rel.held) found = { state: r, rel: rel };
    }
    t.ok(found, 'they held one');
    t.ok(found.rel.day > found.state.day, 'out on ' + Game.rules.day.dateLabel(found.rel.day));
    t.equal(found.state.label.deal.delivered, 1, 'it counts as delivered when you hand it in');
    var later = Game.util.clone(found.state);
    later.day = found.rel.day;
    var fans = Game.rules.progress.totalFans(later);
    var out = L().nightly(later).state;
    t.equal(out.releases[out.releases.length - 1].held, false, 'out now');
    t.ok(Game.rules.progress.totalFans(out) > fans, 'with its new fans');
  });

  // ----- Deadlines, penalties, getting dropped -----

  Game.test('Labels: deadlines bring reminders, and a missed one brings the contract\'s penalty and a strike', function (t) {
    var s = signWith(signedUpState(), 'northbound', { penalty: 'royalty', royalty: 0.3, dropsYou: true });
    var d = s.label.deal;
    var r = Game.util.clone(s);
    r.day = d.nextDueDay - 4 * week;
    r = L().nightly(r).state;
    t.ok(r.inbox.some(function (m) { return m.kind === 'note' && /due in 4 weeks/.test(m.data.text); }), '4 weeks out: a reminder');
    r.day = d.nextDueDay + 1;
    r = L().nightly(r).state;
    t.equal(r.label.deal.royalty, 0.27, 'royalty 30% → 27%');
    t.equal(r.label.deal.strikes, 1, 'strike 1');
    t.equal(r.label.deal.nextDueDay, d.nextDueDay + d.deadlineWeeks * week, 'a new deadline');
    r.day = r.label.deal.nextDueDay + 1;
    r = L().nightly(r).state;
    t.equal(r.label.deal, null, 'strike 2: they dropped you');
    t.equal(r.label.past[0].endReason, 'dropped', 'dropped');
    t.equal(r.player.reputation, Math.max(0, s.player.reputation + Game.balance.label.dropReputation), 'reputation ' + Game.balance.label.dropReputation);
  });

  Game.test('Labels: other penalties (a fine, one more record); a shark never lets you go', function (t) {
    var fine = signWith(signedUpState(), 'riverbend', { penalty: 'fine', advance: 40000, dropsYou: true });
    var cash = fine.player.cash;
    fine.day = fine.label.deal.nextDueDay + 1;
    fine = L().nightly(fine).state;
    t.equal(fine.player.cash, cash - Math.max(Game.balance.label.penaltyAmounts.fineMin, 6000), 'a fine of 15% of the advance');
    var shark = signWith(signedUpState(), 'goldtooth', { penalty: 'extend', dropsYou: false });
    var owed = shark.label.deal.owe.count;
    for (var i = 0; i < 3; i++) { shark.day = shark.label.deal.nextDueDay + 1; shark = L().nightly(shark).state; }
    t.ok(shark.label.deal, 'three misses and still signed');
    t.equal(shark.label.deal.owe.count, owed + 3, 'each miss: one more record owed');
  });

  Game.test('Labels: buying out costs what you still owe times the contract\'s multiplier, plus its share of the advance', function (t) {
    var s = signWith(signedUpState(), 'goldtooth', { advance: 50000, buyout: { mult: 3, flatShare: 1 } });
    t.equal(L().buyoutPrice(s), 50000 * 3 + 50000, 'unrecouped $50,000 x3 + $50,000');
    t.ok(L().buyoutProblem(s), 'can\'t afford it: ' + L().buyoutProblem(s));
    s.player.cash = 300000;
    var r = L().buyout(s).state;
    t.equal(r.label.deal, null, 'free');
    t.equal(r.player.cash, 300000 - 200000, 'paid $200,000');
    t.equal(r.label.past[0].endReason, 'bought out', 'bought out');
  });

  // ----- What deals open -----

  Game.test('Labels: National cities need a mid-size or major label (or reputation 75); arenas a major (or a Top 10 on a smaller label)', function (t) {
    var s = signedUpState();
    t.equal(L().opens(s, 'national'), false, 'no label');
    s.player.reputation = Game.balance.label.nationalWithoutLabel;
    t.ok(L().opens(s, 'national'), 'reputation 75 without a label');
    var indie = signWith(signedUpState(), 'porchlight');
    t.equal(L().opens(indie, 'bigShows'), false, 'an indie: no arenas');
    indie.releases.push({ id: 'rT', type: 'single', songIds: [], day: 0, avgQuality: 70, chart: { pos: 3, peak: 3 } });
    t.ok(L().opens(indie, 'bigShows'), 'with a Top 10 record');
    var major = signWith(signedUpState(), 'monolith');
    t.ok(major.label.opened.bigShows && major.label.opened.national, 'a major opens both');
    major = L().endDeal(major, 'bought out').state;
    t.ok(L().opens(major, 'bigShows'), 'and they stay open after the deal');
    var free = signedUpState();
    free.player.reputation = Game.balance.label.bigShowsWithout.reputation;
    free.cities.hometown.fans = 50000;
    free.cities.newHalston.fans = 200000;
    t.ok(L().opens(free, 'bigShows'), 'or reputation 90 and 250,000 fans without a label');
  });

  // ----- Rivals -----

  Game.test('Labels: rivals sign with labels too, and a signed rival\'s records stream more', function (t) {
    var s = signedUpState();
    Game.rules.scene.rivals(s).forEach(function (band) { band.reputation = 75; band.fans = 60000; });
    var notes = [];
    var rng = Game.rng.create(4);
    for (var w = 0; w < 200 && !notes.length; w++) notes = L().rivalSignings(s, rng);
    t.ok(notes.length, notes.length ? notes[0].title : 'nobody signed');
    var band = Game.rules.scene.rivals(s).filter(function (b) { return b.labelId; })[0];
    t.equal(Game.content.labels[band.labelId].tier, 'major', 'a band that big signs with a major');
    t.ok(L().rivalReach(band) > 0, 'their label pushes their records');
  });

  // ----- Older saves -----

  Game.test('Labels: a version 23 save signed with Northbound keeps its deal; an unsigned one starts clean', function (t) {
    var old = Game.util.clone(signedUpState());
    old.version = 23;
    old.label = { signed: true, signedDay: 5, advance: 30000, owed: 12000, nextOfferDay: 0 };
    old.inbox.push({ id: 'mOld', day: 0, kind: 'labelOffer', templateId: null, data: { advance: 20000 }, expiresDay: 7, resolved: false, read: true });
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loads: ' + (loaded.message || 'ok'));
    var d = loaded.state.label.deal;
    t.ok(d && d.legacy && d.labelId === 'northbound', 'the old Northbound deal');
    t.equal(d.unrecouped, 12000, '$12,000 still to pay back');
    t.equal(loaded.state.label.signed, undefined, 'the old fields are gone');
    t.ok(loaded.state.label.opened.national && loaded.state.label.opened.bigShows, 'everything it opened stays open');
    t.equal(loaded.state.inbox.filter(function (m) { return m.id === 'mOld'; })[0].resolved, 'expired', 'an old-style open offer lapses');
    var r = L().settleStreaming(loaded.state, {});
    t.ok(r.state, 'streaming still settles');
    var plain = Game.util.clone(signedUpState());
    plain.version = 23;
    plain.label = { signed: false, signedDay: null, advance: 0, owed: 0, nextOfferDay: 0 };
    var p = Game.save.parse(JSON.stringify(plain));
    t.ok(p.ok && p.state.label.deal === null, 'unsigned: no deal');
  });
})();
