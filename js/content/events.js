// events.js
// Random events for Starting out and Local act (bigger stages and stories are in eventsBig.js): surprises that come
// up in the morning, each with a choice. Each event lists the career stages it can happen in (stages); dollar amounts
// go through S(), which scales them to your stage.
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
  // A base dollar amount, scaled to your career stage (bigger for bigger acts).
  var S = function (state, base) { return Game.rules.events.scaled(state, base); };
  // Tomorrow's booked show, if there is one.
  var showTomorrow = function (state) {
    var plan = state.schedule[state.day + 1] || {};
    var ids = Object.keys(plan).map(function (block) { return plan[block]; });
    return ids.map(function (id) { return state.entries[id]; }).filter(function (e) { return e && e.type === 'gig'; })[0] || null;
  };

  Game.content.events = {

    overtime: {
      id: 'overtime',
      stages: ['starting', 'local'],
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
      stages: ['starting', 'local'],
      title: 'Your amp is crackling',
      weight: n.crackingAmp.weight,
      when: function (s) { return s.stats.gigsPlayed >= n.crackingAmp.minGigsPlayed; },
      text: function () { return 'Your amp has started crackling and cutting out mid-song.'; },
      choices: function (s) {
        return [
          { id: 'fix', label: 'Get it fixed', effects: { cash: -S(s, n.crackingAmp.fixCost) } },
          { id: 'playOn', label: 'Play on', effects: { gigScore: { amount: n.crackingAmp.playOnGigScore, days: n.crackingAmp.playOnDays, label: 'Crackling amp' } }, safe: true }
        ];
      }
    },

    brokenString: {
      id: 'brokenString',
      stages: ['starting', 'local'],
      title: 'Snap!',
      weight: n.brokenString.weight,
      when: function () { return true; },
      text: function () { return 'A string snapped during warm-up, and it was your last spare.'; },
      choices: function (s) {
        return [
          { id: 'buy', label: 'Buy a fresh set', effects: { cash: -S(s, n.brokenString.fixCost) } },
          { id: 'makeDo', label: 'Make do for now', effects: { gigScore: { amount: n.brokenString.makeDoGigScore, days: n.brokenString.makeDoDays, label: 'Missing a string' } }, safe: true }
        ];
      }
    },

    blogMention: {
      id: 'blogMention',
      stages: ['starting'],
      title: 'A blog mentioned you',
      weight: n.blogMention.weight,
      when: function (s) { return s.stats.bestResult && s.stats.bestResult !== 'rough'; },
      text: function () { return 'A local music blog gave your last set a nice little write-up!'; },
      choices: function (s) {
        return [
          { id: 'share', label: 'Share it everywhere', effects: { buzz: n.blogMention.shareBuzz, energy: n.blogMention.shareEnergy } },
          { id: 'enjoy', label: 'Just enjoy it', effects: { buzz: n.blogMention.enjoyBuzz, morale: n.blogMention.enjoyMorale }, safe: true }
        ];
      }
    },

    carTrouble: {
      id: 'carTrouble',
      stages: ['starting', 'local'],
      title: 'Car trouble',
      weight: n.carTrouble.weight,
      when: function () { return true; },
      text: function () { return 'Your car makes a horrible grinding noise and won\'t start.'; },
      choices: function (s) {
        return [
          { id: 'fix', label: 'Fix it properly', effects: { cash: -S(s, n.carTrouble.fixCost) } },
          { id: 'bus', label: 'Take the bus for a week', effects: { dailyEnergy: { amount: n.carTrouble.busEnergyPerNight, days: n.carTrouble.busDays, label: 'Taking the bus' } }, safe: true }
        ];
      }
    },

    fillIn: {
      id: 'fillIn',
      stages: ['starting', 'local'],
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
      stages: ['starting'],
      title: 'Lesson request',
      weight: n.lessons.weight,
      when: function (s) { return s.player.skills.musicianship >= n.lessons.minMusicianship; },
      text: function () { return 'A neighbor\'s kid wants a guitar lesson tonight. Their parents will pay.'; },
      choices: function (s) {
        return [
          { id: 'teach', label: 'Teach the lesson', effects: { cash: S(s, n.lessons.pay), energy: n.lessons.energy } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    party: {
      id: 'party',
      stages: ['starting', 'local'],
      title: 'Roommate\'s party',
      weight: n.party.weight,
      when: function () { return true; },
      text: function () { return 'Your roommate is throwing a party tonight. It\'s going to be loud either way.'; },
      choices: function (s) {
        return [
          { id: 'join', label: 'Join in', effects: { morale: n.party.joinMorale, energy: n.party.joinEnergy } },
          { id: 'earplugs', label: 'Earplugs and an early night', effects: { morale: n.party.stayInMorale }, safe: true }
        ];
      }
    },

    sunnySaturday: {
      id: 'sunnySaturday',
      stages: ['starting'],
      title: 'Sunny Saturday',
      weight: n.sunnySaturday.weight,
      when: function (s) { return dow(s) === n.sunnySaturday.dayOfWeek; },
      setup: function (s, rng) { return { cash: S(s, rng.int(n.sunnySaturday.buskCash.min, n.sunnySaturday.buskCash.max)) }; },
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
      stages: ['local', 'touring'],
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
      stages: ['local', 'touring'],
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
      stages: ['local', 'touring'],
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
      stages: ['local', 'touring', 'star'],
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
      stages: ['local', 'touring'],
      title: 'Gear stolen',
      weight: n.gearStolen.weight,
      when: function (s) { return s.band.memberIds.length >= 1; },
      text: function () { return 'Someone broke into the rehearsal room and walked off with a pedalboard and two mics.'; },
      choices: function (s) {
        return [
          { id: 'replace', label: 'Replace it', effects: { cash: -S(s, n.gearStolen.replaceCost) } },
          { id: 'borrow', label: 'Borrow gear for now', effects: { gigScore: { amount: n.gearStolen.borrowGigScore, days: n.gearStolen.borrowDays, label: 'Borrowed gear' } }, safe: true }
        ];
      }
    },

    sickBeforeShow: {
      id: 'sickBeforeShow',
      stages: ['starting', 'local', 'touring', 'star'],
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
      stages: ['starting', 'local'],
      title: 'Noise complaint',
      weight: n.noiseComplaint.weight,
      when: function (s) { return s.band.memberIds.length >= 1; },
      text: function () { return 'The neighbors at the rehearsal space called the landlord. There\'s a fine, or you can keep it down.'; },
      choices: function (s) {
        return [
          { id: 'pay', label: 'Pay the fine', effects: { cash: -S(s, n.noiseComplaint.fine) } },
          { id: 'quiet', label: 'Keep it down', effects: { satisfactionAll: n.noiseComplaint.quietSatisfaction, reason: 'Rehearsing quietly' }, safe: true }
        ];
      }
    },

    songIdea: {
      id: 'songIdea',
      stages: ['starting', 'local', 'touring'],
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
      stages: ['local', 'touring'],
      title: 'Late-night hang',
      weight: n.lateNight.weight,
      when: function (s) { return s.band.memberIds.length >= n.lateNight.minMembers; },
      text: function () { return 'Rehearsal turned into pizza, which is turning into a very late night.'; },
      choices: function (s) {
        return [
          { id: 'stay', label: 'Stay out', effects: { morale: n.lateNight.morale, relationshipAll: n.lateNight.relationship, energy: n.lateNight.energy } },
          { id: 'home', label: 'Head home', effects: {}, safe: true }
        ];
      }
    },

    // ----- Local act: bigger chances around town -----

    radioInterview: {
      id: 'radioInterview',
      title: 'Local radio wants you',
      stages: ['local'],
      weight: n.radioInterview.weight,
      when: function (s) { return s.cities.hometown.fans > 0; },
      text: function () { return 'The morning show on the local rock station wants you in the studio to play a song live and chat.'; },
      choices: function () {
        var r = n.radioInterview;
        return [
          { id: 'go', label: 'Go on air', effects: { energy: r.energy, buzz: r.buzz, fans: r.fans } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    weddingGig: {
      id: 'weddingGig',
      title: 'A wedding gig',
      stages: ['local'],
      weight: n.weddingGig.weight,
      when: function () { return true; },
      text: function () { return 'A couple who saw you play wants you for their wedding reception. Covers all night, but the money\'s real.'; },
      choices: function (s) {
        var w = n.weddingGig;
        return [
          { id: 'play', label: 'Play the wedding', effects: { cash: S(s, w.pay), energy: w.energy, morale: w.morale } },
          { id: 'decline', label: 'Not our thing', effects: {}, safe: true }
        ];
      }
    },

    venueFavor: {
      id: 'venueFavor',
      title: 'A favor for a venue',
      stages: ['local'],
      weight: n.venueFavor.weight,
      when: function () { return true; },
      text: function () { return 'The owner of a local club is putting on a benefit for a regular who got sick, and asks if you\'ll play for free.'; },
      choices: function () {
        var v = n.venueFavor;
        return [
          { id: 'play', label: 'Play the benefit', effects: { reputation: v.reputation, buzz: v.buzz, energy: v.energy } },
          { id: 'decline', label: 'We can\'t this time', effects: {}, safe: true }
        ];
      }
    },

    heckler: {
      id: 'heckler',
      title: 'Heckled by a rival',
      stages: ['local'],
      weight: n.heckler.weight,
      when: function (s) { return Game.rules.scene.rivals(s).length > 0; },
      setup: function (s, rng) { return { bandId: rng.pick(Game.rules.scene.rivals(s)).id }; },
      text: function (s, d) {
        var band = Game.rules.scene.band(s, d.bandId);
        return 'Someone from ' + (band ? band.name : 'a rival band') + ' heckled you all through your last set, and people noticed.';
      },
      choices: function () {
        var h = n.heckler;
        return [
          { id: 'clapBack', label: 'Clap back from the stage next time', effects: { gamble: [
            { chance: h.chance, text: 'The crowd loved it', effects: { buzz: h.winBuzz, reputation: h.winReputation } },
            { chance: 1 - h.chance, text: 'It came off petty', effects: { reputation: h.loseReputation, morale: h.loseMorale } }] } },
          { id: 'slide', label: 'Let it slide', effects: { morale: h.slideMorale }, safe: true }
        ];
      }
    },

    localPaper: {
      id: 'localPaper',
      title: 'A profile in the paper',
      stages: ['local'],
      weight: n.localPaper.weight,
      when: function () { return true; },
      text: function () { return 'The city paper wants to profile you for its weekend arts section.'; },
      choices: function () {
        var l = n.localPaper;
        return [
          { id: 'interview', label: 'Do the interview', effects: { buzz: l.buzz, fans: l.fans, energy: l.energy } },
          { id: 'skip', label: 'Skip it', effects: {}, safe: true }
        ];
      }
    },

    shadyPromoter: {
      id: 'shadyPromoter',
      title: 'A promoter with a deal',
      stages: ['local'],
      weight: n.shadyPromoter.weight,
      when: function () { return true; },
      text: function (s) {
        return 'A promoter you\'ve never heard of promises a packed, well-paid show if you put down a $' + S(s, n.shadyPromoter.deposit).toLocaleString() + ' deposit.';
      },
      choices: function (s) {
        var p = n.shadyPromoter;
        return [
          { id: 'pay', label: 'Pay the deposit', effects: { cash: -S(s, p.deposit), gamble: [
            { chance: p.chance, text: 'He was legit', effects: { cash: S(s, p.payout), buzz: p.winBuzz } },
            { chance: 1 - p.chance, text: 'He vanished with your money', effects: { morale: p.loseMorale } }] } },
          { id: 'walk', label: 'Walk away', effects: {}, safe: true }
        ];
      }
    },

    musicVideo: {
      id: 'musicVideo',
      title: 'A film student\'s offer',
      stages: ['local'],
      weight: n.musicVideo.weight,
      when: function (s) { return s.releases.length > 0; },
      text: function (s) {
        return 'A film student wants to shoot a music video for one of your songs, for just $' + S(s, n.musicVideo.cost).toLocaleString() + ' in costs.';
      },
      choices: function (s) {
        var m = n.musicVideo;
        return [
          { id: 'shoot', label: 'Shoot the video', effects: { cash: -S(s, m.cost), streams: { amount: m.streams, weeks: m.weeks, label: 'Music video' }, buzz: m.buzz } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    coverViral: {
      id: 'coverViral',
      title: 'Your cover is taking off',
      stages: ['local'],
      weight: n.coverViral.weight,
      when: function () { return true; },
      text: function () { return 'A cover you posted on a whim is getting shared a lot more than usual.'; },
      choices: function () {
        var c = n.coverViral;
        return [
          { id: 'ride', label: 'Ride the wave: post every day', effects: { energy: c.energy, gamble: [
            { chance: c.chance, text: 'It blew up', effects: { fans: c.winFans, buzzAll: c.winBuzz } },
            { chance: 1 - c.chance, text: 'It cooled off', effects: { buzz: c.loseBuzz } }] } },
          { id: 'leave', label: 'Enjoy it and move on', effects: { buzz: c.leaveBuzz }, safe: true }
        ];
      }
    },

    sponsorLocal: {
      id: 'sponsorLocal',
      title: 'A local sponsor',
      stages: ['local'],
      weight: n.sponsorLocal.weight,
      when: function () { return true; },
      text: function () { return 'A local brewery wants its logo on your flyers and banner. Some fans might roll their eyes.'; },
      choices: function (s) {
        var p = n.sponsorLocal;
        return [
          { id: 'take', label: 'Take the money', effects: { cash: S(s, p.pay), buzz: p.buzz, reputation: p.reputation } },
          { id: 'pass', label: 'Keep it independent', effects: {}, safe: true }
        ];
      }
    },

    workshop: {
      id: 'workshop',
      title: 'Teach a workshop',
      stages: ['local'],
      weight: n.workshop.weight,
      when: function (s) { return s.player.skills.musicianship >= n.lessons.minMusicianship; },
      text: function () { return 'A music school asks you to run a weekend songwriting workshop.'; },
      choices: function (s) {
        var w = n.workshop;
        return [
          { id: 'teach', label: 'Run the workshop', effects: { cash: S(s, w.pay), energy: w.energy, morale: w.morale } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    contestJudge: {
      id: 'contestJudge',
      title: 'Judge a battle of the bands',
      stages: ['local'],
      weight: n.contestJudge.weight,
      when: function () { return true; },
      text: function () { return 'The high school\'s battle of the bands wants a "real musician" on the judging panel.'; },
      choices: function (s) {
        var c = n.contestJudge;
        return [
          { id: 'judge', label: 'Be a judge', effects: { cash: S(s, c.pay), energy: c.energy, reputation: c.reputation } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    }
  };
})();
