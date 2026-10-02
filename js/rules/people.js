// people.js
// Rules for people and the band: meeting people, relationships, inviting and removing members,
// band musicianship, trait effects, rehearsals, splitting gig pay, and the weekly satisfaction check.
//
// A person looks like:
//   { id, name, role, skill, reliability, ambition, trait, relationship, satisfaction,
//     status: 'contact' | 'member' | 'former', metDay, lastSeenDay, joinedDay, lastTalkDay,
//     interactedThisWeek, week: { gigs: [results], earned, rehearsals }, gigDays: [days],
//     satisfactionReasons: [{ text, amount }] (this week), lastWeekReasons: [...] }

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.people = {

  // ----- Looking things up (these never change the state) -----

  // Everyone you know who isn't in the band.
  contacts: function (state) {
    return Object.keys(state.people).map(function (id) { return state.people[id]; })
      .filter(function (p) { return p.status === 'contact'; });
  },

  // Your bandmates, in the order they joined.
  members: function (state) {
    return state.band.memberIds.map(function (id) { return state.people[id]; });
  },

  // Chance to meet someone when you Network: 30% + Networking / 2 percent (never above 100%).
  meetChance: function (networking) {
    var b = Game.balance.people;
    return Math.min(1, b.meetBaseChance + networking / b.meetNetworkingDivisor / 100);
  },

  // The highest skill a new person can have: 30 + Networking / 2 + Reputation / 2.
  maxNewSkill: function (state) {
    var b = Game.balance.people;
    return b.newPersonSkillBase + state.player.skills.networking / b.newPersonSkillNetworkingDivisor +
      state.player.reputation / b.newPersonSkillReputationDivisor;
  },

  // Band musicianship = the average skill of everyone, with your Musicianship counted twice,
  // plus +5 for each Perfectionist. Solo, it's just your Musicianship.
  bandMusicianship: function (state) {
    var b = Game.balance.people;
    var members = Game.rules.people.members(state);
    var total = state.player.skills.musicianship * b.playerMusicianshipWeight;
    var bonus = 0;
    members.forEach(function (m) {
      total += m.skill;
      if (m.trait === 'perfectionist') bonus += Game.balance.traits.perfectionist.bandMusicianshipBonus;
    });
    return total / (members.length + b.playerMusicianshipWeight) + bonus;
  },

  // Extra gig score from band traits: +5 for each Party Animal and each Diva.
  traitGigBonus: function (state) {
    var t = Game.balance.traits;
    return Game.rules.people.members(state).reduce(function (sum, m) {
      if (m.trait === 'partyAnimal') return sum + t.partyAnimal.gigScoreBonus;
      if (m.trait === 'diva') return sum + t.diva.gigScoreBonus;
      return sum;
    }, 0);
  },

  // How gig pay splits: everyone gets one share (a Diva wants 1.5). Returns
  // { yourShare (a fraction, like 0.5), memberShares: { personId: fraction } }.
  payShares: function (state) {
    var bp = Game.balance.bandPay;
    var members = Game.rules.people.members(state);
    var shares = {};
    var total = bp.playerShares;
    members.forEach(function (m) {
      shares[m.id] = m.trait === 'diva' ? bp.divaShares : bp.memberShares;
      total += shares[m.id];
    });
    Object.keys(shares).forEach(function (id) { shares[id] = shares[id] / total; });
    return { yourShare: bp.playerShares / total, memberShares: shares };
  },

  // How many other band members clash with this person's trait.
  clashCount: function (state, person) {
    var pairs = Game.balance.traits.clashes;
    return Game.rules.people.members(state).filter(function (other) {
      if (other.id === person.id) return false;
      return pairs.some(function (pair) {
        return (pair[0] === person.trait && pair[1] === other.trait) || (pair[1] === person.trait && pair[0] === other.trait);
      });
    }).length;
  },

  // Why you can't invite someone, or null if you can.
  inviteProblem: function (state, personId) {
    var b = Game.balance.people;
    var p = state.people[personId];
    if (!p || p.status !== 'contact') return 'They\'re not one of your contacts.';
    if (state.band.memberIds.length >= b.maxBandMembers) return 'Your band is full (' + b.maxBandMembers + ' members besides you).';
    if (p.relationship < b.inviteMinRelationship) {
      return 'Needs relationship ' + b.inviteMinRelationship + ' (you have ' + Math.floor(p.relationship) + ').';
    }
    var needed = p.skill - b.inviteSkillGap;
    if (state.player.reputation < needed) {
      return 'Needs reputation ' + Math.ceil(needed) + ' for a skill-' + p.skill + ' player (you have ' + Math.floor(state.player.reputation) + ').';
    }
    return null;
  },

  // Why you can't Talk to someone right now, or null if you can.
  talkProblem: function (state, personId) {
    var p = state.people[personId];
    if (!p || p.status !== 'member') return 'Talk is only for band members.';
    var cooldown = Game.balance.satisfaction.talkCooldownDays;
    if (p.lastTalkDay !== null && state.day - p.lastTalkDay < cooldown) {
      var left = cooldown - (state.day - p.lastTalkDay);
      return 'You talked recently. Try again in ' + left + ' day' + (left === 1 ? '' : 's') + '.';
    }
    return null;
  },

  // Band members unhappy enough to want a talk (satisfaction under 30).
  needTalk: function (state) {
    return Game.rules.people.members(state).filter(function (m) {
      return m.satisfaction < Game.balance.satisfaction.talkThreshold;
    });
  },

  // ----- Changing things (each returns a new state) -----

  // Makes a brand-new person (not added to the game yet). rng: a random generator.
  generate: function (state, rng) {
    var b = Game.balance.people;
    var t = Game.balance.traits;
    var names = Game.content.names;
    var trait = rng.pick(Object.keys(Game.content.traits));
    var skill = rng.int(b.newPersonSkillMin, Math.floor(Game.rules.people.maxNewSkill(state)));
    var reliability = rng.int(b.reliabilityRange.min, b.reliabilityRange.max);
    if (trait === 'flaky') skill += t.flaky.skillBonusWhenCreated;
    if (trait === 'partyAnimal') reliability += t.partyAnimal.reliabilityPenalty;
    return {
      name: rng.pick(names.firstNames) + ' ' + rng.pick(names.lastNames),
      role: rng.pick(b.roles),
      skill: Math.min(b.statMax, skill),
      reliability: Game.util.clamp(reliability, 0, b.statMax),
      ambition: rng.int(b.ambitionRange.min, b.ambitionRange.max),
      trait: trait
    };
  },

  // Meets someone new and adds them to your contacts (dropping the coldest contact if the list is full).
  // Returns { state, personId, log }.
  meet: function (state) {
    var b = Game.balance.people;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var person = Game.rules.people.generate(s, rng);
    s.rngState = rng.getState();

    var id = 'p' + s.nextPersonId;
    s.nextPersonId += 1;
    person.id = id;
    person.relationship = b.startRelationship;
    person.satisfaction = b.startSatisfaction;
    person.status = 'contact';
    person.metDay = s.day;
    person.lastSeenDay = s.day;
    person.joinedDay = null;
    person.lastTalkDay = null;
    person.interactedThisWeek = true;
    person.week = { gigs: [], earned: 0, rehearsals: 0 };
    person.gigDays = [];
    person.satisfactionReasons = [];
    person.lastWeekReasons = [];
    s.people[id] = person;

    var log = ['You met ' + person.name + ', a ' + Game.content.roles[person.role].person + ' (skill ' + person.skill + ', ' +
      Game.content.traits[person.trait].name + ').'];
    var trimmed = Game.rules.people.trimContacts(s, id);
    return { state: trimmed.state, personId: id, log: log.concat(trimmed.log) };
  },

  // Rolls a chance to meet someone. Returns { state, personId (or null), log }.
  tryMeet: function (state, chance) {
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var met = rng.chance(chance);
    s.rngState = rng.getState();
    if (!met) return { state: s, personId: null, log: [] };
    return Game.rules.people.meet(s);
  },

  // Keeps the contacts list at its limit: the coldest contact (lowest relationship,
  // then the one you saw longest ago) drops off. Band members don't count.
  // keepId: the person you just met, who is never the one dropped (they'd always be coldest).
  // Returns { state, log }.
  trimContacts: function (state, keepId) {
    var max = Game.balance.people.maxContacts;
    var s = Game.util.clone(state);
    var log = [];
    var others = function () {
      return Game.rules.people.contacts(s).filter(function (p) { return p.id !== keepId; });
    };
    var contacts = others();
    while (contacts.length > (keepId ? max - 1 : max)) {
      var coldest = contacts.reduce(function (a, b) {
        if (b.relationship !== a.relationship) return b.relationship < a.relationship ? b : a;
        return b.lastSeenDay < a.lastSeenDay ? b : a;
      });
      delete s.people[coldest.id];
      log.push('You lost touch with ' + coldest.name + '.');
      contacts = others();
    }
    return { state: s, log: log };
  },

  // Spending time with someone: relationship goes up (max 100) and it counts as seeing them this week.
  interact: function (state, personId, relationshipGain) {
    var s = Game.util.clone(state);
    var p = s.people[personId];
    p.relationship = Game.util.clamp(p.relationship + relationshipGain, 0, Game.balance.people.statMax);
    p.lastSeenDay = s.day;
    p.interactedThisWeek = true;
    return { state: s, log: [] };
  },

  // Changes a member's satisfaction (0 to 100) and remembers why, for the People screen.
  changeSatisfaction: function (state, personId, amount, reason) {
    var s = Game.util.clone(state);
    var p = s.people[personId];
    p.satisfaction = Game.util.clamp(p.satisfaction + amount, 0, Game.balance.satisfaction.max);
    p.satisfactionReasons.push({ text: reason, amount: amount });
    return { state: s, log: [] };
  },

  // Talk (members only): +15 satisfaction, once every 2 weeks per person. Returns { state, log }.
  talk: function (state, personId) {
    var problem = Game.rules.people.talkProblem(state, personId);
    if (problem) return { state: state, log: [problem] };
    var s = Game.rules.people.changeSatisfaction(state, personId, Game.balance.satisfaction.talkGain, 'You talked it out').state;
    s.people[personId].lastTalkDay = s.day;
    s = Game.rules.people.interact(s, personId, 0).state;
    return { state: s, log: [] };
  },

  // Invites a contact into the band. If it isn't allowed, the state comes back unchanged with the reason.
  // Joining drops every song's tightness by 20 while they learn it.
  // Returns { state, log, firstMember } (firstMember: true when this starts the band, so it needs a name).
  invite: function (state, personId) {
    var problem = Game.rules.people.inviteProblem(state, personId);
    if (problem) return { state: state, log: [problem], firstMember: false };
    var b = Game.balance.people;
    var s = Game.util.clone(state);
    var p = s.people[personId];
    var firstMember = s.band.memberIds.length === 0;
    p.status = 'member';
    p.joinedDay = s.day;
    p.satisfaction = b.startSatisfaction;
    p.satisfactionReasons = [];
    s.band.memberIds.push(personId);
    if (firstMember) s.band.formedDay = s.day;
    s = Game.rules.songs.dropAllTightness(s, b.newMemberTightnessDrop).state;
    return {
      state: s,
      firstMember: firstMember,
      log: [p.name + ' joined the band! Every song loses ' + (-b.newMemberTightnessDrop) + ' tightness while they learn it.']
    };
  },

  // Removes a member. Everyone else loses 5 satisfaction, and you lose 5 morale. Returns { state, log }.
  remove: function (state, personId) {
    var s = Game.util.clone(state);
    var p = s.people[personId];
    if (!p || p.status !== 'member') return { state: state, log: ['They\'re not in the band.'] };
    s = Game.rules.people.leaveBand(s, personId);
    Game.rules.people.members(s).forEach(function (m) {
      s = Game.rules.people.changeSatisfaction(s, m.id, Game.balance.satisfaction.change.memberRemoved,
        'You removed ' + p.name).state;
    });
    var morale = Game.rules.morale.change(s, Game.balance.morale.change.removeMember);
    return { state: morale.state, log: ['You removed ' + p.name + ' from the band. ' + Game.balance.morale.change.removeMember + ' morale.'].concat(morale.log) };
  },

  // Takes someone out of the band (they become a former member).
  leaveBand: function (state, personId) {
    var s = Game.util.clone(state);
    s.people[personId].status = 'former';
    s.band.memberIds = s.band.memberIds.filter(function (id) { return id !== personId; });
    return s;
  },

  // Names the band. The name can't be blank or too long. Returns { state, log }.
  nameBand: function (state, name) {
    var max = Game.balance.people.bandNameMaxLength;
    var clean = String(name || '').trim();
    if (!clean) return { state: state, log: ['Give your band a name.'] };
    if (clean.length > max) return { state: state, log: ['Band names can be up to ' + max + ' characters.'] };
    var s = Game.util.clone(state);
    s.band.name = clean;
    return { state: s, log: [] };
  },

  // A random band name suggestion, like "The Velvet Static". Returns { state, name }.
  suggestBandName: function (state) {
    var names = Game.content.names;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var name = 'The ' + rng.pick(names.bandNameFirst) + ' ' + rng.pick(names.bandNameSecond);
    s.rngState = rng.getState();
    return { state: s, name: name };
  },

  // A rehearsal: each member shows up based on reliability (a Flaky one also misses 25% of the time).
  // Each chosen song gets +12 tightness (x1.5 if a Workhorse is there; half if nobody shows up).
  // Returns { state, attended: [names], missed: [names], gain }.
  rehearse: function (state, songIds) {
    var tb = Game.balance.songs.tightness;
    var t = Game.balance.traits;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var attended = [];
    var missed = [];
    var workhorseThere = false;
    Game.rules.people.members(s).forEach(function (m) {
      var shows = rng.chance(m.reliability / Game.balance.people.statMax);
      if (m.trait === 'flaky' && rng.chance(t.flaky.missRehearsalChance)) shows = false;
      if (shows) {
        attended.push(m);
        if (m.trait === 'workhorse') workhorseThere = true;
      } else {
        missed.push(m);
      }
    });
    s.rngState = rng.getState();

    var gain = tb.rehearseGain;
    if (!attended.length) gain *= tb.rehearseNoShowMultiplier;
    if (workhorseThere) gain *= 1 + t.workhorse.rehearsalTightnessBonus;
    songIds.forEach(function (id) {
      if (s.songs[id]) s = Game.rules.songs.practiceSong(s, id, gain).state;
    });
    attended.forEach(function (m) {
      s = Game.rules.people.interact(s, m.id, 0).state;
      s.people[m.id].week.rehearsals += 1;
    });
    return {
      state: s,
      attended: attended.map(function (m) { return m.name; }),
      missed: missed.map(function (m) { return m.name; }),
      gain: gain
    };
  },

  // After a gig: every member played it. +8 relationship each, the gig counts toward their
  // satisfaction this week, and they get their share of the pay. A Perfectionist loses 10 after a Rough gig.
  // pay: total gig pay (before splitting). Returns { state, log }.
  recordGig: function (state, result, pay) {
    var b = Game.balance;
    var s = Game.util.clone(state);
    var shares = Game.rules.people.payShares(s).memberShares;
    var log = [];
    Game.rules.people.members(s).forEach(function (m) {
      s = Game.rules.people.interact(s, m.id, b.people.relationship.gigTogether).state;
      var p = s.people[m.id];
      p.week.gigs.push(result);
      p.gigDays.push(s.day);
      p.week.earned += pay * (shares[m.id] || 0);
      if (result === 'rough' && m.trait === 'perfectionist') {
        s = Game.rules.people.changeSatisfaction(s, m.id, b.traits.perfectionist.roughGigSatisfaction, 'Hated the Rough gig (Perfectionist)').state;
        log.push(m.name + ' is upset about the Rough gig.');
      }
    });
    return { state: s, log: log };
  },

  // Every Sunday night: each member's satisfaction check, "we need to talk" warnings,
  // quitting below 15, relationships fading for anyone you didn't see, and a fresh week.
  // Returns { state, log }.
  weeklyCheck: function (state) {
    var b = Game.balance;
    var sb = b.satisfaction;
    var c = sb.change;
    var t = b.traits;
    var s = Game.util.clone(state);
    var log = [];
    var people = Game.rules.people;

    people.members(s).forEach(function (m) {
      var add = function (amount, text) { s = people.changeSatisfaction(s, m.id, amount, text).state; };
      var w = m.week;
      var before = s.people[m.id].satisfaction;
      var gigsThisWeek = w.gigs.length;
      var gigsLast14 = m.gigDays.filter(function (d) { return s.day - d < sb.noGigDays; }).length;
      var inBandDays = s.day - m.joinedDay;

      if (w.earned > 0) add(c.earnedGigMoney, 'Earned gig money');
      var wanted = m.ambition < sb.ambitionLow ? 'low' : (m.ambition > sb.ambitionHigh ? 'high' : 'mid');
      var matched = wanted === 'low' ? gigsLast14 >= 1 : gigsThisWeek >= sb.gigsWantedPerWeek[wanted];
      if (matched) add(c.gigsMatchedAmbition, 'Got as many gigs as they wanted');
      if (w.rehearsals > 0) add(c.rehearsedThisWeek, 'Rehearsed this week');
      w.gigs.forEach(function (result) {
        if (result === 'great' || result === 'legendary') add(c.greatOrLegendaryGig, 'A ' + result + ' gig');
        if (result === 'rough') add(c.roughGig, 'A Rough gig');
      });
      if (m.ambition > sb.noGigMinAmbition && gigsLast14 === 0 && inBandDays >= sb.noGigDays) {
        add(c.noGigTwoWeeks, 'No gig in ' + sb.noGigDays + ' days');
      }
      var clashes = people.clashCount(s, m);
      if (clashes) add(c.perClashingBandmate * clashes, 'Clashes with ' + clashes + ' bandmate' + (clashes === 1 ? '' : 's'));
      if (m.trait === 'easygoing') add(t.easygoing.weeklySatisfaction, 'Easygoing');
      if (m.trait === 'workhorse' && w.rehearsals < t.workhorse.minRehearsalsPerWeek) {
        add(t.workhorse.tooFewRehearsals, 'Fewer than ' + t.workhorse.minRehearsalsPerWeek + ' rehearsals (Workhorse)');
      }

      var now = s.people[m.id];
      if (now.satisfaction < sb.quitThreshold) {
        s = people.leaveBand(s, m.id);
        var moraleHit = Game.rules.morale.change(s, b.morale.change.bandmateQuits);
        s = moraleHit.state;
        log.push(m.name + ' quit the band. ' + b.morale.change.bandmateQuits + ' morale.');
        log = log.concat(moraleHit.log);
      } else {
        var moved = Math.round(now.satisfaction - before);
        log.push(m.name + ': satisfaction ' + Math.round(now.satisfaction) + ' (' + (moved > 0 ? '+' : (moved < 0 ? '' : '±')) + moved + ' this week).');
        if (now.satisfaction < sb.talkThreshold) {
          log.push(m.name + ': "We need to talk." (satisfaction ' + Math.round(now.satisfaction) + ')');
        }
      }
    });

    // Relationships fade for anyone you didn't spend time with; then everyone starts a fresh week.
    Object.keys(s.people).forEach(function (id) {
      var p = s.people[id];
      if (p.status === 'former') return;
      if (!p.interactedThisWeek) {
        p.relationship = Math.max(0, p.relationship + b.people.relationship.fadePerWeek);
      }
      p.interactedThisWeek = false;
      p.week = { gigs: [], earned: 0, rehearsals: 0 };
      p.lastWeekReasons = p.satisfactionReasons;
      p.satisfactionReasons = [];
    });
    return { state: s, log: log };
  }
};
