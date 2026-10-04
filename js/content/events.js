// events.js
// Random events: small surprises that come up in the morning, each with a choice.
// Fixed data, never saved. Every number (how often, how likely, costs and amounts) is in balance.js
// (balance.events, one entry per event).
//
// Each event has:
//   id, title          an id and a short title for the card
//   weight             how likely it is compared to other events that can happen that day
//   cooldownDays       optional: how long before it can happen again (default in balance.events)
//   when(state)        true if it can happen today
//   setup(state, rng)  optional: rolls details for this time (an amount, a venue, a person) into "data"
//   text(state, data)  what the card says
//   choices(state, data)  the options, each { id, label, effects, safe }. "safe" is the choice that
//                      happens if you end the day without answering.
//
// Effects (handled in js/rules/events.js, and described on each button before you pick):
//   cash: dollars (+ or -)          energy, morale, buzz, reputation: amounts (+ or -)
//   gigScore: { amount, days, label }    a gig score change for a number of days
//   dailyEnergy: { amount, days, label } an energy change every night for a number of days
//   overtime: day                   work an extra shift that day (paid balance.job.overtimePay)
//   fillIn: { venueId, day }        a show booked on that day (no booking odds)
//   satisfaction: { personId, amount }  a bandmate's satisfaction

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var b = Game.balance;
  var n = Game.balance.events; // each event's numbers (costs, amounts, weights)
  var dow = function (state) { return Game.rules.day.dayOfWeek(state.day); };
  var name = function (state, id) { return state.people[id] ? state.people[id].name : 'A bandmate'; };
  var members = function (state) { return Game.rules.people.members(state); };
  // Tomorrow's booked show, if there is one.
  var showTomorrow = function (state) {
    var plan = state.schedule[state.day + 1] || {};
    var ids = Object.keys(plan).map(function (block) { return plan[block]; });
    return ids.map(function (id) { return state.entries[id]; }).filter(function (e) { return e && e.type === 'gig'; })[0] || null;
  };

  Game.content.events = {

    overtime: {
      id: 'overtime',
      title: 'Overtime offer',
      weight: n.overtime.weight,
      when: function (s) {
        var sat = s.day + 1;
        var plan = s.schedule[sat] || {};
        var showThere = b.job.jobBlocks.some(function (block) {
          return plan[block] && s.entries[plan[block]] && s.entries[plan[block]].type === 'gig';
        });
        return dow(s) === n.overtime.dayOfWeek && s.player.job.status !== 'none' && !Game.rules.job.scheduledOn(s, sat) && !showThere && !Game.rules.travel.awayOnDay(s, sat);
      },
      text: function () {
        return 'Your boss stops you on the way out: "Can you pick up a shift tomorrow? Saturday, morning and afternoon."';
      },
      choices: function (s) {
        return [
          { id: 'take', label: 'Work Saturday', effects: { overtime: s.day + 1 } },
          { id: 'decline', label: 'Keep my Saturday free', effects: {}, safe: true }
        ];
      }
    },

    crackingAmp: {
      id: 'crackingAmp',
      title: 'Your amp is crackling',
      weight: n.crackingAmp.weight,
      when: function (s) { return s.stats.gigsPlayed >= n.crackingAmp.minGigsPlayed; },
      text: function () { return 'Your amp has started crackling and cutting out mid-song.'; },
      choices: function () {
        return [
          { id: 'fix', label: 'Get it fixed', effects: { cash: -n.crackingAmp.fixCost } },
          { id: 'playOn', label: 'Play on', effects: { gigScore: { amount: n.crackingAmp.playOnGigScore, days: n.crackingAmp.playOnDays, label: 'Crackling amp' } }, safe: true }
        ];
      }
    },

    brokenString: {
      id: 'brokenString',
      title: 'Snap!',
      weight: n.brokenString.weight,
      when: function () { return true; },
      text: function () { return 'A string snapped during warm-up, and it was your last spare.'; },
      choices: function () {
        return [
          { id: 'buy', label: 'Buy a fresh set', effects: { cash: -n.brokenString.fixCost } },
          { id: 'makeDo', label: 'Make do for now', effects: { gigScore: { amount: n.brokenString.makeDoGigScore, days: n.brokenString.makeDoDays, label: 'Missing a string' } }, safe: true }
        ];
      }
    },

    blogMention: {
      id: 'blogMention',
      title: 'A blog mentioned you',
      weight: n.blogMention.weight,
      when: function (s) { return s.stats.bestResult && s.stats.bestResult !== 'rough'; },
      text: function () { return 'A local music blog gave your last set a nice little write-up!'; },
      choices: function () {
        return [
          { id: 'share', label: 'Share it everywhere', effects: { buzz: n.blogMention.shareBuzz, energy: n.blogMention.shareEnergy } },
          { id: 'enjoy', label: 'Just enjoy it', effects: { buzz: n.blogMention.enjoyBuzz, morale: n.blogMention.enjoyMorale }, safe: true }
        ];
      }
    },

    carTrouble: {
      id: 'carTrouble',
      title: 'Car trouble',
      weight: n.carTrouble.weight,
      when: function () { return true; },
      text: function () { return 'Your car makes a horrible grinding noise and won\'t start.'; },
      choices: function () {
        return [
          { id: 'fix', label: 'Fix it properly', effects: { cash: -n.carTrouble.fixCost } },
          { id: 'bus', label: 'Take the bus for a week', effects: { dailyEnergy: { amount: n.carTrouble.busEnergyPerNight, days: n.carTrouble.busDays, label: 'Taking the bus' } }, safe: true }
        ];
      }
    },

    fillIn: {
      id: 'fillIn',
      title: 'Can you fill in?',
      weight: n.fillIn.weight,
      when: function (s) {
        var venue = Game.content.venues[n.fillIn.venues[0]];
        return s.player.reputation >= b.economy.coverGigMinReputation &&
          Game.rules.songs.playable(s).length >= Game.rules.booking.setFor(venue, 'guarantee').size &&
          !Game.rules.booking.blockTaken(s, s.day + 1, 'evening');
      },
      setup: function (s, rng) {
        return { venueId: rng.pick(n.fillIn.venues) };
      },
      text: function (s, data) {
        return 'A band dropped out at ' + Game.content.venues[data.venueId].name +
          '. Can you play tomorrow night? They\'ll pay the usual guarantee, no questions asked.';
      },
      choices: function (s, data) {
        return [
          { id: 'accept', label: 'We\'ll be there', effects: { fillIn: { venueId: data.venueId, day: s.day + 1 }, reputation: n.fillIn.reputation } },
          { id: 'decline', label: 'Not this time', effects: {}, safe: true }
        ];
      }
    },

    lessons: {
      id: 'lessons',
      title: 'Lesson request',
      weight: n.lessons.weight,
      when: function (s) { return s.player.skills.musicianship >= n.lessons.minMusicianship; },
      text: function () { return 'A neighbor\'s kid wants a guitar lesson tonight. Their parents will pay.'; },
      choices: function () {
        return [
          { id: 'teach', label: 'Teach the lesson', effects: { cash: n.lessons.pay, energy: n.lessons.energy } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    party: {
      id: 'party',
      title: 'Roommate\'s party',
      weight: n.party.weight,
      when: function () { return true; },
      text: function () { return 'Your roommate is throwing a party tonight. It\'s going to be loud either way.'; },
      choices: function () {
        return [
          { id: 'join', label: 'Join in', effects: { morale: n.party.joinMorale, energy: n.party.joinEnergy } },
          { id: 'earplugs', label: 'Earplugs and an early night', effects: { morale: n.party.stayInMorale }, safe: true }
        ];
      }
    },

    sunnySaturday: {
      id: 'sunnySaturday',
      title: 'Sunny Saturday',
      weight: n.sunnySaturday.weight,
      when: function (s) { return dow(s) === n.sunnySaturday.dayOfWeek; },
      setup: function (s, rng) { return { cash: rng.int(n.sunnySaturday.buskCash.min, n.sunnySaturday.buskCash.max) }; },
      text: function () { return 'It\'s gorgeous out and the downtown square is packed.'; },
      choices: function (s, data) {
        return [
          { id: 'busk', label: 'Busk downtown', effects: { cash: data.cash, buzz: n.sunnySaturday.buskBuzz, energy: n.sunnySaturday.buskEnergy } },
          { id: 'stay', label: 'Stay in', effects: {}, safe: true }
        ];
      }
    },

    moreRehearsal: {
      id: 'moreRehearsal',
      title: 'Your bandmate wants more',
      weight: n.moreRehearsal.weight,
      when: function (s) { return s.band.memberIds.length > 0; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, data) {
        var p = s.people[data.personId];
        return (p ? p.name : 'Your bandmate') + ' thinks the band should rehearse more often.';
      },
      choices: function (s, data) {
        return [
          { id: 'promise', label: 'Promise a rehearsal this week', effects: { satisfaction: { personId: data.personId, amount: n.moreRehearsal.promiseSatisfaction } } },
          { id: 'notNow', label: 'Not right now', effects: { satisfaction: { personId: data.personId, amount: n.moreRehearsal.refuseSatisfaction } }, safe: true }
        ];
      }
    },

    // ----- Band life (Phase 9) -----

    argument: {
      id: 'argument',
      title: 'Argument in the van',
      weight: n.argument.weight,
      when: function (s) { return s.band.memberIds.length >= n.argument.minMembers; },
      setup: function (s, rng) {
        var a = rng.pick(s.band.memberIds);
        var others = s.band.memberIds.filter(function (id) { return id !== a; });
        return { a: a, b: rng.pick(others) };
      },
      text: function (s, d) {
        return name(s, d.a) + ' and ' + name(s, d.b) + ' are fighting about the set order, and both look at you.';
      },
      choices: function (s, d) {
        return [
          { id: 'sideA', label: 'Side with ' + name(s, d.a), effects: {
            satisfaction: { personId: d.a, amount: n.argument.sideWith, reason: 'You took their side' },
            satisfaction2: { personId: d.b, amount: n.argument.sideAgainst, reason: 'You took the other side' } } },
          { id: 'sideB', label: 'Side with ' + name(s, d.b), effects: {
            satisfaction: { personId: d.b, amount: n.argument.sideWith, reason: 'You took their side' },
            satisfaction2: { personId: d.a, amount: n.argument.sideAgainst, reason: 'You took the other side' } } },
          { id: 'stayOut', label: 'Stay out of it', effects: {
            satisfaction: { personId: d.a, amount: n.argument.stayOut, reason: 'You didn\'t back them up' },
            satisfaction2: { personId: d.b, amount: n.argument.stayOut, reason: 'You didn\'t back them up' } }, safe: true }
        ];
      }
    },

    sideProject: {
      id: 'sideProject',
      title: 'A side project',
      weight: n.sideProject.weight,
      when: function (s) { return members(s).some(function (m) { return m.ambition > n.sideProject.minAmbition; }); },
      setup: function (s, rng) {
        return { personId: rng.pick(members(s).filter(function (m) { return m.ambition > n.sideProject.minAmbition; })).id };
      },
      text: function (s, d) { return name(s, d.personId) + ' started a side project with some friends and wants your blessing.'; },
      choices: function (s, d) {
        return [
          { id: 'encourage', label: 'Encourage it', effects: {
            satisfaction: { personId: d.personId, amount: n.sideProject.encourageSatisfaction, reason: 'You supported their side project' },
            reliability: { personId: d.personId, amount: n.sideProject.encourageReliability } } },
          { id: 'commit', label: 'Ask them to commit to the band', effects: {
            satisfaction: { personId: d.personId, amount: n.sideProject.commitSatisfaction, reason: 'You asked them to drop their side project' } }, safe: true }
        ];
      }
    },

    biggerShare: {
      id: 'biggerShare',
      title: 'A bigger share?',
      weight: n.biggerShare.weight,
      cooldownDays: n.biggerShare.cooldownDays,
      when: function (s) { return members(s).some(function (m) { return m.ambition > n.biggerShare.minAmbition && !m.shares; }); },
      setup: function (s, rng) {
        return { personId: rng.pick(members(s).filter(function (m) { return m.ambition > n.biggerShare.minAmbition && !m.shares; })).id };
      },
      text: function (s, d) { return name(s, d.personId) + ' says they do more than their share and wants a bigger cut of gig pay.'; },
      choices: function (s, d) {
        return [
          { id: 'give', label: 'Give them a bigger cut', effects: { bigShare: { personId: d.personId, shares: b.bandPay.divaShares },
            satisfaction: { personId: d.personId, amount: n.biggerShare.giveSatisfaction, reason: 'You gave them a bigger cut' } } },
          { id: 'no', label: 'Equal shares for everyone', effects: {
            satisfaction: { personId: d.personId, amount: n.biggerShare.refuseSatisfaction, reason: 'You said no to a bigger cut' } }, safe: true }
        ];
      }
    },

    gearStolen: {
      id: 'gearStolen',
      title: 'Gear stolen',
      weight: n.gearStolen.weight,
      when: function (s) { return s.band.memberIds.length >= 1; },
      text: function () { return 'Someone broke into the rehearsal room and walked off with a pedalboard and two mics.'; },
      choices: function () {
        return [
          { id: 'replace', label: 'Replace it', effects: { cash: -n.gearStolen.replaceCost } },
          { id: 'borrow', label: 'Borrow gear for now', effects: { gigScore: { amount: n.gearStolen.borrowGigScore, days: n.gearStolen.borrowDays, label: 'Borrowed gear' } }, safe: true }
        ];
      }
    },

    sickBeforeShow: {
      id: 'sickBeforeShow',
      title: 'Sick before a show',
      weight: n.sickBeforeShow.weight,
      when: function (s) { return s.band.memberIds.length >= 1 && !!showTomorrow(s); },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds), entryId: showTomorrow(s).id }; },
      text: function (s, d) { return name(s, d.personId) + ' woke up with a fever, and you have a show tomorrow.'; },
      choices: function (s, d) {
        return [
          { id: 'session', label: 'Hire a session player for it', effects: { sessionForShow: d.entryId } },
          { id: 'shorthanded', label: 'Play short-handed', effects: { gigScore: { amount: n.sickBeforeShow.shortGigScore, days: n.sickBeforeShow.shortDays, label: 'Short-handed' } }, safe: true }
        ];
      }
    },

    noiseComplaint: {
      id: 'noiseComplaint',
      title: 'Noise complaint',
      weight: n.noiseComplaint.weight,
      when: function (s) { return s.band.memberIds.length >= 1; },
      text: function () { return 'The neighbors at the rehearsal space called the landlord. There\'s a fine, or you can keep it down.'; },
      choices: function () {
        return [
          { id: 'pay', label: 'Pay the fine', effects: { cash: -n.noiseComplaint.fine } },
          { id: 'quiet', label: 'Keep it down', effects: { satisfactionAll: n.noiseComplaint.quietSatisfaction, reason: 'Rehearsing quietly' }, safe: true }
        ];
      }
    },

    songIdea: {
      id: 'songIdea',
      title: 'A song idea',
      weight: n.songIdea.weight,
      when: function (s) { return s.band.memberIds.length >= 1; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, d) { return name(s, d.personId) + ' shows up humming a melody they can\'t get out of their head.'; },
      choices: function (s, d) {
        return [
          { id: 'write', label: 'Write it together now', effects: { songProgress: n.songIdea.progress, energy: n.songIdea.energy,
            satisfaction: { personId: d.personId, amount: n.songIdea.satisfaction, reason: 'You wrote their idea together' } } },
          { id: 'later', label: 'Maybe later', effects: {}, safe: true }
        ];
      }
    },

    lateNight: {
      id: 'lateNight',
      title: 'Late-night hang',
      weight: n.lateNight.weight,
      when: function (s) { return s.band.memberIds.length >= n.lateNight.minMembers; },
      text: function () { return 'Rehearsal turned into pizza, which is turning into a very late night.'; },
      choices: function () {
        return [
          { id: 'stay', label: 'Stay out', effects: { morale: n.lateNight.morale, relationshipAll: n.lateNight.relationship, energy: n.lateNight.energy } },
          { id: 'home', label: 'Head home', effects: {}, safe: true }
        ];
      }
    }
  };
})();
