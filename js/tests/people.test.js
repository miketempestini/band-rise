// people.test.js
// Tests for people and the band (js/rules/people.js, and the Jam / Hang out / Talk / Rehearse actions).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    return s;
  }

  // Adds a contact with chosen stats. Returns { state, id }.
  function addPerson(state, stats) {
    var met = Game.rules.people.meet(state);
    var s = met.state;
    Object.keys(stats || {}).forEach(function (key) { s.people[met.personId][key] = stats[key]; });
    return { state: s, id: met.personId };
  }

  // A state with one bandmate (relationship and reputation set so the invite works).
  function withMember(stats, seed) {
    var s = freshState(seed);
    s.player.reputation = 20; // enough to invite players up to skill 50
    var added = addPerson(s, Object.assign({ relationship: 60, skill: 30, trait: 'diva', reliability: 100, ambition: 30 }, stats || {}));
    s = Game.rules.people.invite(added.state, added.id).state;
    return { state: s, id: added.id };
  }

  function weeklyCheck(s) {
    return Game.rules.people.weeklyCheck(s).state;
  }

  Game.test('Meeting: the chance is 32.5% at Networking 5 and 60% at Networking 60', function (t) {
    t.near(Game.rules.people.meetChance(5), 0.325, 'Networking 5');
    t.near(Game.rules.people.meetChance(60), 0.60, 'Networking 60');
    var met = 0, runs = 1000;
    for (var seed = 1; seed <= runs; seed++) {
      var s = freshState(seed);
      if (Game.rules.people.tryMeet(s, Game.rules.people.meetChance(5)).personId) met += 1;
    }
    t.ok(Math.abs(met / runs - 0.325) < 0.05, 'met someone ' + Math.round(met / runs * 100) + '% of the time');
  });

  Game.test('New people: skill from 10 to 30 + Networking/2 + Reputation/2; trait adjustments apply', function (t) {
    for (var seed = 1; seed <= 200; seed++) {
      var s = freshState(seed);
      var rng = Game.rng.create(seed);
      var p = Game.rules.people.generate(s, rng);
      var max = Math.floor(30 + 5 / 2) + (p.trait === 'flaky' ? 15 : 0);
      if (p.skill < 10 || p.skill > max) { t.ok(false, 'seed ' + seed + ' skill ' + p.skill + ' (' + p.trait + ')'); return; }
      if (p.reliability > 95 || (p.trait === 'partyAnimal' && p.reliability > 75)) { t.ok(false, 'reliability ' + p.reliability); return; }
      if (p.ambition < 10 || p.ambition > 90) { t.ok(false, 'ambition ' + p.ambition); return; }
    }
    t.ok(true);
  });

  Game.test('Meeting: a new contact starts at relationship 20, and the 13th pushes out the coldest', function (t) {
    var s = freshState();
    for (var i = 0; i < 12; i++) s = Game.rules.people.meet(s).state;
    var contacts = Game.rules.people.contacts(s);
    t.equal(contacts.length, 12, '12 contacts');
    t.equal(contacts[0].relationship, 20, 'starts at 20');
    contacts.forEach(function (p, i) { s.people[p.id].relationship = 30 + i; });
    var coldest = contacts[0].id;
    var r = Game.rules.people.meet(s);
    t.equal(Game.rules.people.contacts(r.state).length, 12, 'still 12');
    t.ok(!r.state.people[coldest], 'the coldest one dropped off');
    t.ok(r.log.join(' ').indexOf('lost touch') !== -1, 'says so');
  });

  Game.test('Invite: needs relationship 50 and reputation at least (their skill - 30)', function (t) {
    var s = freshState();
    var added = addPerson(s, { relationship: 49, skill: 30 });
    s = added.state;
    var problem = Game.rules.people.inviteProblem(s, added.id);
    t.ok(problem && problem.indexOf('relationship 50') !== -1, 'relationship too low: ' + problem);
    s.people[added.id].relationship = 50;
    t.equal(Game.rules.people.inviteProblem(s, added.id), null, 'skill 30 needs reputation 0: OK');
    s.people[added.id].skill = 44;
    s.player.reputation = 13;
    problem = Game.rules.people.inviteProblem(s, added.id);
    t.ok(problem && problem.indexOf('reputation 14') !== -1, 'skill 44 needs reputation 14: ' + problem);
    s.player.reputation = 14;
    t.equal(Game.rules.people.inviteProblem(s, added.id), null, 'reputation 14: OK');
  });

  Game.test('Invite: they join, the band forms, and every song drops 20 tightness (never below 0)', function (t) {
    var s = freshState();
    var added = addPerson(s, { relationship: 60, skill: 20 });
    s = added.state;
    var cover = Game.rules.songs.playable(s)[0].id;
    s.songs[cover].tightness = 10;
    var r = Game.rules.people.invite(s, added.id);
    t.ok(r.firstMember, 'first member');
    t.equal(r.state.people[added.id].status, 'member');
    t.equal(r.state.band.memberIds.length, 1);
    t.equal(r.state.songs[cover].tightness, 0, '10 - 20 stops at 0');
    var other = Game.rules.songs.playable(s)[1].id;
    t.equal(r.state.songs[other].tightness, 40, '60 - 20');
  });

  Game.test('Band musicianship: the average with your Musicianship counted twice (+5 per Perfectionist)', function (t) {
    var s = freshState();
    t.near(Game.rules.people.bandMusicianship(s), 20, 'solo: your Musicianship');
    var band = withMember({ skill: 41, trait: 'easygoing' });
    t.near(Game.rules.people.bandMusicianship(band.state), (20 * 2 + 41) / 3, '(20 + 20 + 41) / 3 = 27');
    band.state.people[band.id].trait = 'perfectionist';
    t.near(Game.rules.people.bandMusicianship(band.state), 27 + 5, 'Perfectionist +5');
  });

  Game.test('Band at gigs: band skill uses band musicianship; a Diva adds +5 and takes 1.5 shares of tips', function (t) {
    var band = withMember({ skill: 41, trait: 'diva' });
    var s = band.state;
    s.day = 1;
    s.player.energy = 100;
    var r = Game.rules.gigs.playGig(s, 'rustyNail', Game.rules.gigs.suggestSet(s, 2), 100);
    var part = function (id) { return r.gig.parts.filter(function (p) { return p.id === id; })[0].value; };
    t.near(part('bandSkill'), 0.35 * 27, 'band skill part');
    t.equal(part('traits'), 5, 'Diva +5');
    t.near(Game.rules.people.payShares(s).yourShare, 1 / 2.5, 'your share is 1 of 2.5');
    t.equal(r.gig.rewards.yourTips, Math.round(r.gig.rewards.tips * 0.4), 'you keep your share of tips');
    t.equal(r.state.people[band.id].relationship, 68, '+8 relationship for playing together');
  });

  Game.test('Satisfaction: a member below 15 on Sunday quits the band, and you lose 10 morale', function (t) {
    var band = withMember({ trait: 'diva', ambition: 30 });
    var s = band.state;
    s.people[band.id].satisfaction = 10;
    s = weeklyCheck(s);
    t.equal(s.people[band.id].status, 'former', 'quit');
    t.equal(s.band.memberIds.length, 0, 'band is empty');
    t.equal(s.player.morale, 40, '-10 morale');
  });

  Game.test('Satisfaction: the Sunday reasons from Design.md add up', function (t) {
    var band = withMember({ trait: 'diva', ambition: 50 }); // mid ambition: wants 1 gig a week
    var s = band.state;
    var p = s.people[band.id];
    p.week = { gigs: ['great'], earned: 5, rehearsals: 1 };
    p.gigDays = [s.day];
    s = weeklyCheck(s);
    // +3 earned money, +3 matched ambition, +2 rehearsed, +4 Great gig = +12
    t.equal(s.people[band.id].satisfaction, 82, '70 + 12');
    t.equal(s.people[band.id].lastWeekReasons.length, 4, 'four reasons recorded');
  });

  Game.test('Satisfaction: no gig in 14 days costs 5 (ambition over 50); clashes cost 3 each', function (t) {
    var band = withMember({ trait: 'workhorse', ambition: 80, reliability: 100 });
    var s = band.state;
    s.day = 20; // in the band 20 days, never gigged
    var flaky = addPerson(s, { relationship: 60, skill: 20, trait: 'flaky' });
    s = Game.rules.people.invite(flaky.state, flaky.id).state;
    s = weeklyCheck(s);
    // Workhorse: -5 no gig, -3 clash with Flaky, -3 fewer than 2 rehearsals = -11
    t.equal(s.people[band.id].satisfaction, 59, '70 - 11');
  });

  Game.test('Satisfaction: under 30 gives a "We need to talk" warning', function (t) {
    var band = withMember({ trait: 'diva' });
    band.state.people[band.id].satisfaction = 25;
    t.equal(Game.rules.people.needTalk(band.state).length, 1, 'shows on Today');
    var r = Game.rules.people.weeklyCheck(band.state);
    t.ok(r.log.join(' ').indexOf('We need to talk') !== -1, 'in the Sunday log');
  });

  Game.test('Talk: +15 satisfaction, then not again for 14 days', function (t) {
    var band = withMember({ trait: 'diva' });
    var s = band.state;
    s.people[band.id].satisfaction = 40;
    s = Game.rules.people.talk(s, band.id).state;
    t.equal(s.people[band.id].satisfaction, 55, '+15');
    s.day += 13;
    t.ok(Game.rules.people.talkProblem(s, band.id), '13 days later: not yet');
    s.day += 1;
    t.equal(Game.rules.people.talkProblem(s, band.id), null, '14 days later: OK');
  });

  Game.test('Jam (+8) and Hang out ($15, +5 relationship, +5 morale) at End Day', function (t) {
    var s = freshState();
    for (var i = 0; i < 5; i++) s = Game.rules.day.endDay(s).state; // Saturday
    s.player.energy = 100;
    s.player.morale = 50;
    var added = addPerson(s);
    s = added.state;
    s = Game.rules.actions.plan(s, 'morning', 'jam', added.id).state;
    s = Game.rules.actions.plan(s, 'afternoon', 'hangOut', added.id).state;
    var cash = s.player.cash;
    var after = Game.rules.day.endDay(s).state;
    t.equal(after.people[added.id].relationship, 20 + 8 + 5, 'relationship 33');
    t.equal(after.player.cash, cash - 15, '$15');
    t.ok(after.player.morale >= 55, 'morale up');
  });

  Game.test('Relationships fade 1 a week without contact', function (t) {
    var s = freshState();
    var added = addPerson(s, { relationship: 40 });
    s = weeklyCheck(added.state); // met this week: no fade
    t.equal(s.people[added.id].relationship, 40, 'met this week');
    s = weeklyCheck(s);
    t.equal(s.people[added.id].relationship, 39, 'a week apart: -1');
  });

  Game.test('Rehearse: +12 tightness when the bandmate shows (x1.5 Workhorse), half if they don\'t', function (t) {
    var band = withMember({ trait: 'easygoing', reliability: 100 });
    var song = Game.rules.songs.playable(band.state)[0].id; // at 40 after the join drop
    var r = Game.rules.people.rehearse(band.state, [song]);
    t.equal(r.state.songs[song].tightness, 52, '40 + 12');
    t.equal(r.state.people[band.id].week.rehearsals, 1, 'counted for satisfaction');
    band.state.people[band.id].trait = 'workhorse';
    t.equal(Game.rules.people.rehearse(band.state, [song]).state.songs[song].tightness, 58, 'Workhorse: +18');
    band.state.people[band.id].reliability = 0;
    band.state.people[band.id].trait = 'easygoing';
    var noShow = Game.rules.people.rehearse(band.state, [song]);
    t.equal(noShow.missed.length, 1, 'didn\'t show');
    t.equal(noShow.state.songs[song].tightness, 46, 'half: +6');
  });

  Game.test('Rehearse: needs a band, costs $20, and up to 4 songs', function (t) {
    var s = freshState();
    t.equal(Game.rules.actions.option(s, 'evening', 'rehearse').ok, false, 'solo: not available');
    var band = withMember({ trait: 'easygoing', reliability: 100 });
    s = band.state;
    var songs = Game.rules.songs.playable(s).map(function (x) { return x.id; });
    t.ok(Game.rules.actions.plan(s, 'evening', 'rehearse', songs).log.length > 0, '5 songs refused');
    s = Game.rules.actions.plan(s, 'evening', 'rehearse', songs.slice(0, 3)).state;
    var cash = s.player.cash;
    var after = Game.rules.day.endDay(s).state;
    t.equal(after.player.cash, cash - 20, '$20 room');
    t.equal(after.songs[songs[0]].tightness, 52, 'rehearsed song +12');
    t.equal(after.songs[songs[4]].tightness, 40, 'other songs unchanged');
  });

  Game.test('Remove: others lose 5 satisfaction and you lose 5 morale', function (t) {
    var band = withMember({ trait: 'easygoing' });
    var s = band.state;
    var second = addPerson(s, { relationship: 60, skill: 20, trait: 'diva' });
    s = Game.rules.people.invite(second.state, second.id).state;
    s = Game.rules.people.remove(s, band.id).state;
    t.equal(s.people[band.id].status, 'former');
    t.equal(s.people[second.id].satisfaction, 65, 'other member -5');
    t.equal(s.player.morale, 45, '-5 morale');
  });

  Game.test('Band name: blank refused; a suggestion looks like "The X Y"', function (t) {
    var s = freshState();
    t.ok(Game.rules.people.nameBand(s, '  ').log.length > 0, 'blank refused');
    t.equal(Game.rules.people.nameBand(s, ' The Rusty Hinges ').state.band.name, 'The Rusty Hinges');
    t.ok(/^The \S+ \S+$/.test(Game.rules.people.suggestBandName(s).name), 'suggestion format');
  });

  Game.test('Save: a version 4 save (Phase 4) upgrades with the new people fields', function (t) {
    var old = Game.util.clone(freshState());
    old.version = 4;
    delete old.nextPersonId;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.nextPersonId, 1);
  });

})();
