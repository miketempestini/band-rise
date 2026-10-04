// gigs.test.js
// Tests for open mics and gig results (js/rules/gigs.js, and the open mic action).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A fresh career (Suggested build, Guitar) on a Tuesday, rested, with middle morale.
  function tuesday(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.day = 1; // Tuesday: The Rusty Nail's open mic
    s.player.energy = 100;
    s.player.morale = 50;
    return s;
  }

  function play(s, energy) {
    var set = Game.rules.gigs.suggestSet(s, 2);
    return Game.rules.gigs.playGig(s, 'rustyNail', set, energy === undefined ? 100 : energy);
  }

  function part(gig, id) {
    var found = gig.parts.filter(function (p) { return p.id === id; })[0];
    return found ? found.value : 0;
  }

  Game.test('Crowd: with 0 fans and 0 buzz, an open mic expects 15 and gets 13 to 17', function (t) {
    var s = tuesday();
    t.near(Game.rules.gigs.expectedCrowd(s, Game.content.venues.rustyNail), 15, 'expected');
    var low = 999, high = 0, total = 0, runs = 300;
    for (var seed = 1; seed <= runs; seed++) {
      var crowd = play(tuesday(seed)).gig.crowd;
      low = Math.min(low, crowd);
      high = Math.max(high, crowd);
      total += crowd;
    }
    t.ok(low >= 13 && high <= 17, 'range was ' + low + ' to ' + high);
    t.ok(Math.abs(total / runs - 15) < 0.5, 'average about 15, got ' + (total / runs));
  });

  Game.test('Score: a first open mic with starting skills and covers lands about 22 to 42', function (t) {
    var low = 999, high = -999, total = 0, runs = 300;
    for (var seed = 1; seed <= runs; seed++) {
      var score = play(tuesday(seed)).gig.score;
      low = Math.min(low, score);
      high = Math.max(high, score);
      total += score;
    }
    t.ok(low >= 22 && high <= 42.5, 'range was ' + low + ' to ' + high);
    t.ok(Math.abs(total / runs - 32.25) < 1.5, 'average about 32, got ' + (total / runs));
  });

  Game.test('Score: Tired (-10), low and high morale (-5 / +5) show up as parts', function (t) {
    var tired = play(tuesday(4), 20).gig;
    t.equal(part(tired, 'tired'), -10, 'Tired');
    var low = tuesday(4); low.player.morale = 20;
    t.equal(part(play(low).gig, 'morale'), -5, 'low morale');
    var high = tuesday(4); high.player.morale = 80;
    t.equal(part(play(high).gig, 'morale'), 5, 'high morale');
    t.equal(part(play(tuesday(4)).gig, 'venueTier'), 0, 'open mics have no venue tier penalty');
  });

  Game.test('Bad-luck protection: after two Rough results, luck is never below 0', function (t) {
    for (var seed = 1; seed <= 200; seed++) {
      var s = tuesday(seed);
      s.player.badLuckStreak = 2;
      var luck = part(play(s).gig, 'luck');
      if (luck < 0) { t.ok(false, 'seed ' + seed + ' rolled ' + luck); return; }
    }
    t.ok(true);
  });

  Game.test('Bad-luck protection: Rough results count up the streak; anything else resets it', function (t) {
    var s = tuesday();
    s.debug.forceNextGig = 'rough';
    s = play(s).state;
    t.equal(s.player.badLuckStreak, 1, 'one Rough');
    s.debug.forceNextGig = 'rough';
    s = play(s).state;
    t.equal(s.player.badLuckStreak, 2, 'two Rough');
    s.debug.forceNextGig = 'legendary';
    s = play(s).state;
    t.equal(s.player.badLuckStreak, 0, 'reset');
  });

  Game.test('Reputation: gains shrink as reputation climbs (x (1 - reputation / 110)); losses do not', function (t) {
    var change = Game.rules.gigs.reputationChange;
    t.near(change(0, 2, 0), 2, 'Solid open mic at reputation 0: +2');
    t.near(change(0, 2, 1), 3, 'tier 1 room: x1.5');
    t.near(change(55, 2, 2), 2 * 2 * 0.5, 'Solid club at reputation 55: +4 x half = +2');
    t.near(change(75, -1, 0), -1, 'Rough at 75: still -1');
  });

  Game.test('Reputation: open mics give half once small rooms unlock, then nothing once clubs unlock', function (t) {
    var change = Game.rules.gigs.reputationChange;
    t.near(change(9, 2, 0), 2 * (1 - 9 / 110), 'reputation 9: full');
    t.near(change(10, 2, 0), 2 * 0.5 * (1 - 10 / 110), 'reputation 10: half');
    t.equal(change(30, 2, 0), 0, 'reputation 30: nothing from open mics');
    t.ok(change(30, 2, 1) > 0, 'small rooms still count at 30');
    t.equal(change(60, 2, 1), 0, 'reputation 60: nothing from small rooms');
    t.ok(change(60, 2, 2) > 0, 'clubs still count at 60');
    t.ok(Game.rules.gigs.outgrownNote(30, 0).indexOf('outgrown') !== -1, 'the result says why');
  });

  Game.test('Fans: fractions round randomly (1.4 means 1 fan, with a 40% chance of a second)', function (t) {
    var rng = Game.rng.create(12345);
    var twos = 0, runs = 2000;
    for (var i = 0; i < runs; i++) {
      var n = Game.rules.gigs.roundFans(rng, 1.4);
      if (n !== 1 && n !== 2) { t.ok(false, 'got ' + n); return; }
      if (n === 2) twos += 1;
    }
    t.ok(Math.abs(twos / runs - 0.4) < 0.04, 'second fan ' + Math.round(twos / runs * 100) + '% of the time');
    t.equal(Game.rules.gigs.roundFans(rng, 3), 3, 'whole numbers stay whole');
  });

  Game.test('Fans: the originals factor is 0.75 for covers, 1.0 for a mix, 1.25 for originals', function (t) {
    var f = Game.rules.gigs.originalsFactor;
    t.near(f([{ isCover: true }, { isCover: true }]), 0.75);
    t.near(f([{ isCover: false }, { isCover: true }]), 1.0);
    t.near(f([{ isCover: false }, { isCover: false }]), 1.25);
  });

  Game.test('Fans: crowd x conversion x originals factor x room under the city ceiling', function (t) {
    var s = tuesday(8);
    s.cities.hometown.fans = 25000; // half of the 50,000 ceiling
    s.debug.forceNextGig = 'great';
    var gig = play(s).gig;
    var expected = gig.crowd * 0.15 * 0.75 * 0.5;
    t.near(gig.rewards.rawFans, expected, 'raw fans');
    t.ok(gig.rewards.fans === Math.floor(expected) || gig.rewards.fans === Math.ceil(expected), 'rounded to a neighbor');
  });

  Game.test('Results: Legendary gives +10 buzz, +5 reputation, +15 morale, and $20-40 in tips', function (t) {
    var s = tuesday(3);
    s.debug.forceNextGig = 'legendary';
    var r = play(s);
    t.equal(r.gig.result, 'legendary');
    t.equal(r.gig.rewards.buzz, 10, 'buzz');
    t.near(r.state.player.reputation, 5, 'reputation (at 0: no shrinking)');
    t.equal(r.state.player.morale, 65, 'morale');
    t.ok(r.gig.rewards.tips >= 20 && r.gig.rewards.tips <= 40, 'tips ' + r.gig.rewards.tips);
    t.equal(r.state.thisWeek.income.tips, r.gig.rewards.tips, 'tips show in the weekly summary');
    t.ok(part(r.gig, 'debug') !== 0 || r.gig.score >= 65, 'a visible Debug part when forcing was needed');
    t.equal(r.state.debug.forceNextGig, null, 'the force is used up');
  });

  Game.test('Results: Rough costs buzz, reputation (never below 0) and morale; tips $0-5', function (t) {
    var s = tuesday(3);
    s.cities.hometown.buzz = 10;
    s.debug.forceNextGig = 'rough';
    var r = play(s);
    t.equal(r.gig.result, 'rough');
    t.equal(r.state.cities.hometown.buzz, 5, 'buzz -5');
    t.equal(r.state.player.reputation, 0, 'reputation stays at 0');
    t.equal(r.state.player.morale, 42, 'morale -8');
    t.ok(r.gig.rewards.tips <= 5, 'tips ' + r.gig.rewards.tips);
    t.equal(r.gig.rewards.fans, 0, 'no fans on a Rough night');
  });

  Game.test('Playing live: +10 tightness per song, skill gains, and stats', function (t) {
    var s = tuesday(2);
    var set = Game.rules.gigs.suggestSet(s, 2);
    var r = Game.rules.gigs.playGig(s, 'rustyNail', set, 100);
    set.forEach(function (id) {
      t.equal(r.state.songs[id].tightness, s.songs[id].tightness + 10, 'tightness +10');
      t.equal(r.state.songs[id].lastPlayedDay, s.day, 'counts as played');
    });
    t.ok(r.state.player.skills.performance > s.player.skills.performance, 'Performance grew');
    t.ok(r.state.player.skills.networking > s.player.skills.networking, 'Networking grew');
    t.equal(r.state.stats.gigsPlayed, 1, 'gigs played');
    t.equal(r.state.stats.bestResult, r.gig.result, 'best result');
    t.equal(r.state.stats.biggestCrowd, r.gig.crowd, 'biggest crowd');
    t.equal(r.state.lastGig.crowd, r.gig.crowd, 'saved for the result screen');
  });

  Game.test('Open mic: only on Tuesday or Thursday evenings', function (t) {
    var s = tuesday();
    t.ok(Game.rules.actions.option(s, 'evening', 'openMic').ok, 'Tuesday evening');
    s.day = 3;
    t.ok(Game.rules.actions.option(s, 'evening', 'openMic').ok, 'Thursday evening');
    s.day = 5;
    var sat = Game.rules.actions.option(s, 'evening', 'openMic');
    t.equal(sat.ok, false, 'not Saturday');
    t.ok(sat.reason.indexOf('Tuesday') !== -1, 'says when open mics are');
    s.day = 1;
    s.player.job.status = 'none';
    t.equal(Game.rules.actions.option(s, 'afternoon', 'openMic').ok, false, 'not in the afternoon');
  });

  Game.test('Open mic: the suggested set is the best 2 songs; sets must be exactly 2 different songs', function (t) {
    var s = tuesday();
    var songs = Game.rules.songs.playable(s);
    s.songs[songs[3].id].tightness = 90;
    s.songs[songs[1].id].tightness = 80;
    t.sameContents(Game.rules.gigs.suggestSet(s, 2), [songs[3].id, songs[1].id], 'tightest two (same quality)');
    t.ok(Game.rules.gigs.setProblem(s, [songs[0].id], 2), 'one song refused');
    t.ok(Game.rules.gigs.setProblem(s, [songs[0].id, songs[0].id], 2), 'same song twice refused');
    var planned = Game.rules.actions.plan(s, 'evening', 'openMic', [songs[0].id, songs[2].id]).state;
    t.sameContents(Game.rules.actions.plannedEntry(planned, 'evening').songIds, [songs[0].id, songs[2].id], 'chosen set saved');
  });

  Game.test('Open mic at End Day: plays the gig, costs 15 energy, and flags the result screen', function (t) {
    var s = tuesday(6);
    var set = Game.rules.gigs.suggestSet(s, 2);
    s = Game.rules.actions.plan(s, 'evening', 'openMic', set).state;
    var r = Game.rules.day.endDay(s);
    t.ok(r.state.lastDayReport.gig, 'gig flagged');
    t.equal(r.state.lastGig.venueName, 'The Rusty Nail');
    t.equal(r.state.stats.gigsPlayed, 1);
    t.ok(r.state.lastDayReport.blocks[2].lines[0].indexOf('-15 energy') !== -1, 'Day results line shows -15 energy');
  });

  Game.test('Save: a version 3 save (Phase 3) upgrades with the new gig fields', function (t) {
    var old = Game.util.clone(tuesday());
    old.version = 3;
    delete old.debug;
    delete old.lastGig;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.debug.forceNextGig, null, 'debug added');
    t.equal(loaded.state.lastGig, null, 'lastGig added');
  });

})();
