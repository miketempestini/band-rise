// events.js
// Random events: small surprises that come up in the morning, each with a choice.
// Fixed data, never saved. How often events happen is in balance.js (balance.events).
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
  var dow = function (state) { return Game.rules.day.dayOfWeek(state.day); };
  var name = function (state, id) { return state.people[id] ? state.people[id].name : 'A bandmate'; };
  var members = function (state) { return Game.rules.people.members(state); };
  // Tomorrow's booked show, if there is one.
  var showTomorrow = function (state) {
    var plan = state.schedule[state.day + 1] || {};
    var ids = Object.keys(plan).map(function (block) { return plan[block]; });
    return ids.map(function (id) { return state.entries[id]; }).filter(function (e) { return e && e.type === 'gig'; })[0] || null;
  };
  var FRIDAY = 4;
  var SATURDAY = 5;

  Game.content.events = {

    overtime: {
      id: 'overtime',
      title: 'Overtime offer',
      weight: 6,
      when: function (s) {
        var sat = s.day + 1;
        var plan = s.schedule[sat] || {};
        var showThere = b.job.jobBlocks.some(function (block) {
          return plan[block] && s.entries[plan[block]] && s.entries[plan[block]].type === 'gig';
        });
        return dow(s) === FRIDAY && s.player.job.status !== 'none' && !Game.rules.job.scheduledOn(s, sat) && !showThere;
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
      weight: 3,
      when: function (s) { return s.stats.gigsPlayed >= 1; },
      text: function () { return 'Your amp has started crackling and cutting out mid-song.'; },
      choices: function () {
        return [
          { id: 'fix', label: 'Get it fixed', effects: { cash: -60 } },
          { id: 'playOn', label: 'Play on', effects: { gigScore: { amount: -3, days: 7, label: 'Crackling amp' } }, safe: true }
        ];
      }
    },

    brokenString: {
      id: 'brokenString',
      title: 'Snap!',
      weight: 4,
      when: function () { return true; },
      text: function () { return 'A string snapped during warm-up, and it was your last spare.'; },
      choices: function () {
        return [
          { id: 'buy', label: 'Buy a fresh set', effects: { cash: -15 } },
          { id: 'makeDo', label: 'Make do for now', effects: { gigScore: { amount: -2, days: 4, label: 'Missing a string' } }, safe: true }
        ];
      }
    },

    blogMention: {
      id: 'blogMention',
      title: 'A blog mentioned you',
      weight: 3,
      when: function (s) { return s.stats.bestResult && s.stats.bestResult !== 'rough'; },
      text: function () { return 'A local music blog gave your last set a nice little write-up!'; },
      choices: function () {
        return [
          { id: 'share', label: 'Share it everywhere', effects: { buzz: 8, energy: -5 } },
          { id: 'enjoy', label: 'Just enjoy it', effects: { buzz: 3, morale: 3 }, safe: true }
        ];
      }
    },

    carTrouble: {
      id: 'carTrouble',
      title: 'Car trouble',
      weight: 2,
      when: function () { return true; },
      text: function () { return 'Your car makes a horrible grinding noise and won\'t start.'; },
      choices: function () {
        return [
          { id: 'fix', label: 'Fix it properly', effects: { cash: -150 } },
          { id: 'bus', label: 'Take the bus for a week', effects: { dailyEnergy: { amount: -5, days: 7, label: 'Taking the bus' } }, safe: true }
        ];
      }
    },

    fillIn: {
      id: 'fillIn',
      title: 'Can you fill in?',
      weight: 3,
      when: function (s) {
        var venue = Game.content.venues.cornerTap;
        return s.player.reputation >= b.economy.coverGigMinReputation &&
          Game.rules.songs.playable(s).length >= Game.rules.booking.setFor(venue, 'guarantee').size &&
          !Game.rules.booking.blockTaken(s, s.day + 1, 'evening');
      },
      setup: function (s, rng) {
        return { venueId: rng.pick(['cornerTap', 'backRoom']) };
      },
      text: function (s, data) {
        return 'A band dropped out at ' + Game.content.venues[data.venueId].name +
          '. Can you play tomorrow night? They\'ll pay the usual guarantee, no questions asked.';
      },
      choices: function (s, data) {
        return [
          { id: 'accept', label: 'We\'ll be there', effects: { fillIn: { venueId: data.venueId, day: s.day + 1 }, reputation: 1 } },
          { id: 'decline', label: 'Not this time', effects: {}, safe: true }
        ];
      }
    },

    lessons: {
      id: 'lessons',
      title: 'Lesson request',
      weight: 3,
      when: function (s) { return s.player.skills.musicianship >= 25; },
      text: function () { return 'A neighbor\'s kid wants a guitar lesson tonight. Their parents will pay.'; },
      choices: function () {
        return [
          { id: 'teach', label: 'Teach the lesson', effects: { cash: 40, energy: -10 } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    party: {
      id: 'party',
      title: 'Roommate\'s party',
      weight: 3,
      when: function () { return true; },
      text: function () { return 'Your roommate is throwing a party tonight. It\'s going to be loud either way.'; },
      choices: function () {
        return [
          { id: 'join', label: 'Join in', effects: { morale: 8, energy: -15 } },
          { id: 'earplugs', label: 'Earplugs and an early night', effects: { morale: -3 }, safe: true }
        ];
      }
    },

    sunnySaturday: {
      id: 'sunnySaturday',
      title: 'Sunny Saturday',
      weight: 4,
      when: function (s) { return dow(s) === SATURDAY; },
      setup: function (s, rng) { return { cash: rng.int(15, 35) }; },
      text: function () { return 'It\'s gorgeous out and the downtown square is packed.'; },
      choices: function (s, data) {
        return [
          { id: 'busk', label: 'Busk downtown', effects: { cash: data.cash, buzz: 2, energy: -15 } },
          { id: 'stay', label: 'Stay in', effects: {}, safe: true }
        ];
      }
    },

    moreRehearsal: {
      id: 'moreRehearsal',
      title: 'Your bandmate wants more',
      weight: 3,
      when: function (s) { return s.band.memberIds.length > 0; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, data) {
        var p = s.people[data.personId];
        return (p ? p.name : 'Your bandmate') + ' thinks the band should rehearse more often.';
      },
      choices: function (s, data) {
        return [
          { id: 'promise', label: 'Promise a rehearsal this week', effects: { satisfaction: { personId: data.personId, amount: 5 } } },
          { id: 'notNow', label: 'Not right now', effects: { satisfaction: { personId: data.personId, amount: -3 } }, safe: true }
        ];
      }
    }    ,

    // ----- Band life (Phase 9) -----

    argument: {
      id: 'argument',
      title: 'Argument in the van',
      weight: 3,
      when: function (s) { return s.band.memberIds.length >= 2; },
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
            satisfaction: { personId: d.a, amount: 6, reason: 'You took their side' },
            satisfaction2: { personId: d.b, amount: -6, reason: 'You took the other side' } } },
          { id: 'sideB', label: 'Side with ' + name(s, d.b), effects: {
            satisfaction: { personId: d.b, amount: 6, reason: 'You took their side' },
            satisfaction2: { personId: d.a, amount: -6, reason: 'You took the other side' } } },
          { id: 'stayOut', label: 'Stay out of it', effects: {
            satisfaction: { personId: d.a, amount: -2, reason: 'You didn\'t back them up' },
            satisfaction2: { personId: d.b, amount: -2, reason: 'You didn\'t back them up' } }, safe: true }
        ];
      }
    },

    sideProject: {
      id: 'sideProject',
      title: 'A side project',
      weight: 2,
      when: function (s) { return members(s).some(function (m) { return m.ambition > 50; }); },
      setup: function (s, rng) {
        return { personId: rng.pick(members(s).filter(function (m) { return m.ambition > 50; })).id };
      },
      text: function (s, d) { return name(s, d.personId) + ' started a side project with some friends and wants your blessing.'; },
      choices: function (s, d) {
        return [
          { id: 'encourage', label: 'Encourage it', effects: {
            satisfaction: { personId: d.personId, amount: 6, reason: 'You supported their side project' },
            reliability: { personId: d.personId, amount: -10 } } },
          { id: 'commit', label: 'Ask them to commit to the band', effects: {
            satisfaction: { personId: d.personId, amount: -4, reason: 'You asked them to drop their side project' } }, safe: true }
        ];
      }
    },

    biggerShare: {
      id: 'biggerShare',
      title: 'A bigger share?',
      weight: 2,
      cooldownDays: 30,
      when: function (s) { return members(s).some(function (m) { return m.ambition > 60 && !m.shares; }); },
      setup: function (s, rng) {
        return { personId: rng.pick(members(s).filter(function (m) { return m.ambition > 60 && !m.shares; })).id };
      },
      text: function (s, d) { return name(s, d.personId) + ' says they do more than their share and wants a bigger cut of gig pay.'; },
      choices: function (s, d) {
        return [
          { id: 'give', label: 'Give them a bigger cut', effects: { bigShare: { personId: d.personId, shares: b.bandPay.divaShares },
            satisfaction: { personId: d.personId, amount: 5, reason: 'You gave them a bigger cut' } } },
          { id: 'no', label: 'Equal shares for everyone', effects: {
            satisfaction: { personId: d.personId, amount: -8, reason: 'You said no to a bigger cut' } }, safe: true }
        ];
      }
    },

    gearStolen: {
      id: 'gearStolen',
      title: 'Gear stolen',
      weight: 2,
      when: function (s) { return s.band.memberIds.length >= 1; },
      text: function () { return 'Someone broke into the rehearsal room and walked off with a pedalboard and two mics.'; },
      choices: function () {
        return [
          { id: 'replace', label: 'Replace it', effects: { cash: -120 } },
          { id: 'borrow', label: 'Borrow gear for now', effects: { gigScore: { amount: -3, days: 7, label: 'Borrowed gear' } }, safe: true }
        ];
      }
    },

    sickBeforeShow: {
      id: 'sickBeforeShow',
      title: 'Sick before a show',
      weight: 4,
      when: function (s) { return s.band.memberIds.length >= 1 && !!showTomorrow(s); },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds), entryId: showTomorrow(s).id }; },
      text: function (s, d) { return name(s, d.personId) + ' woke up with a fever, and you have a show tomorrow.'; },
      choices: function (s, d) {
        return [
          { id: 'session', label: 'Hire a session player for it', effects: { sessionForShow: d.entryId } },
          { id: 'shorthanded', label: 'Play short-handed', effects: { gigScore: { amount: -5, days: 2, label: 'Short-handed' } }, safe: true }
        ];
      }
    },

    noiseComplaint: {
      id: 'noiseComplaint',
      title: 'Noise complaint',
      weight: 2,
      when: function (s) { return s.band.memberIds.length >= 1; },
      text: function () { return 'The neighbors at the rehearsal space called the landlord. There\'s a fine, or you can keep it down.'; },
      choices: function () {
        return [
          { id: 'pay', label: 'Pay the fine', effects: { cash: -40 } },
          { id: 'quiet', label: 'Keep it down', effects: { satisfactionAll: -3, reason: 'Rehearsing quietly' }, safe: true }
        ];
      }
    },

    songIdea: {
      id: 'songIdea',
      title: 'A song idea',
      weight: 3,
      when: function (s) { return s.band.memberIds.length >= 1; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, d) { return name(s, d.personId) + ' shows up humming a melody they can\'t get out of their head.'; },
      choices: function (s, d) {
        return [
          { id: 'write', label: 'Write it together now', effects: { songProgress: 15, energy: -10,
            satisfaction: { personId: d.personId, amount: 3, reason: 'You wrote their idea together' } } },
          { id: 'later', label: 'Maybe later', effects: {}, safe: true }
        ];
      }
    },

    lateNight: {
      id: 'lateNight',
      title: 'Late-night hang',
      weight: 3,
      when: function (s) { return s.band.memberIds.length >= 2; },
      text: function () { return 'Rehearsal turned into pizza, which is turning into a very late night.'; },
      choices: function () {
        return [
          { id: 'stay', label: 'Stay out', effects: { morale: 8, relationshipAll: 4, energy: -15 } },
          { id: 'home', label: 'Head home', effects: {}, safe: true }
        ];
      }
    }
  };
})();
