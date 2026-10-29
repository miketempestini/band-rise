// eventsBig.js
// Random events for Touring acts and Stars, plus the story arcs (events that continue days or weeks later).
// Same shape as js/content/events.js. Every number is in balance.events; dollar amounts go through S(), which scales
// them to your career stage (x25 for a touring act, x100 for a star).
//
// Extra effects these events use (handled in js/rules/events.js):
//   fans: share        a share of your fans won (+) or lost (-), across every city where you have fans
//   buzzAll: amount    buzz in every city where you have fans
//   streams: { amount, weeks, label }   your streams up (or down) by this share for some weeks
//   labelMood: amount  your record label's mood (if you have a deal)
//   awardsBoost: share better award chances for a year
//   memberLeaves: personId   a bandmate leaves (the card warns you)
//   gamble: [{ chance, text, effects }]   outcomes rolled with the game's dice when you pick it (odds on the card)
//   followUp: { eventId, inDays, data }   the story's next step, queued for that day
// Story steps have story: true: they never roll at random, they only arrive from a followUp.

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var n = Game.balance.events;
  var S = function (state, base) { return Game.rules.events.scaled(state, base); };
  var name = function (state, id) { return state.people[id] ? state.people[id].name : 'A bandmate'; };
  var members = function (state) { return Game.rules.people.members(state); };
  var away = function (state) { return Game.rules.travel.awayOnDay(state, state.day); };
  var abroad = function (state) {
    return Game.balance.time.blocks.some(function (block) {
      var trip = Game.rules.travel.tripAt(state, state.day, block);
      return trip && trip.cities.some(function (c) { return Game.content.cities[c].region === 'international'; });
    });
  };
  var showSoon = function (state) {
    return [1, 2].some(function (ahead) {
      var plan = state.schedule[state.day + ahead] || {};
      return Object.keys(plan).some(function (block) { var e = state.entries[plan[block]]; return e && e.type === 'gig'; });
    });
  };
  var rivalName = function (state, id) { var band = Game.rules.scene.band(state, id); return band ? band.name : 'A rival band'; };
  var hasDeal = function (state) { return !!state.label.deal && !state.label.deal.legacy; };
  var pct = function (x) { return Math.round(x * 100) + '%'; };

  Game.content.eventsBig = {

    // ----- Touring act -----

    lostLuggage: {
      id: 'lostLuggage', title: 'Lost luggage', stages: ['touring', 'star'], weight: n.lostLuggage.weight,
      when: function (s) { return away(s) && abroad(s); },
      text: function () { return 'The airline lost two cases of your gear somewhere between airports. Tonight\'s show is in a few hours.'; },
      choices: function (s) {
        var l = n.lostLuggage;
        return [
          { id: 'rent', label: 'Rent backline in town', effects: { cash: -S(s, l.rent) } },
          { id: 'makeDo', label: 'Make do with what we\'ve got', effects: { gigScore: { amount: l.gigScore, days: l.days, label: 'Borrowed gear' } }, safe: true }
        ];
      }
    },

    busBreakdown: {
      id: 'busBreakdown', title: 'The bus broke down', stages: ['touring'], weight: n.busBreakdown.weight,
      when: function (s) { return away(s); },
      text: function () { return 'The tour bus died on the highway shoulder. The mechanic says days, not hours.'; },
      choices: function (s) {
        var bb = n.busBreakdown;
        return [
          { id: 'rent', label: 'Rent a replacement now', effects: { cash: -S(s, bb.rent) } },
          { id: 'limp', label: 'Cram into vans and limp along', effects: { dailyEnergy: { amount: bb.dailyEnergy, days: bb.days, label: 'Cramped vans' }, morale: bb.morale }, safe: true }
        ];
      }
    },

    soreThroat: {
      id: 'soreThroat', title: 'A sore throat', stages: ['touring', 'star'], weight: n.soreThroat.weight,
      when: function (s) { return showSoon(s); },
      text: function () { return 'Your throat is raw and you have a show in the next day or two. The doctor says rest; the promoter says sing.'; },
      choices: function () {
        var t = n.soreThroat;
        return [
          { id: 'push', label: 'Push through', effects: { gamble: [
            { chance: t.chance, text: 'Your voice held', effects: {} },
            { chance: 1 - t.chance, text: 'Your voice gave out', effects: { gigScore: { amount: t.badGigScore, days: t.badDays, label: 'Strained voice' } } }] } },
          { id: 'rest', label: 'Rest your voice, sing softer', effects: { gigScore: { amount: t.restGigScore, days: t.restDays, label: 'Resting your voice' } }, safe: true }
        ];
      }
    },

    syncLicense: {
      id: 'syncLicense', title: 'A TV show wants your song', stages: ['touring', 'star'], weight: n.syncLicense.weight,
      when: function (s) { return s.releases.length > 0; },
      text: function (s) {
        return 'A hit TV drama wants one of your songs for a big scene, and offers $' + S(s, n.syncLicense.pay).toLocaleString() + ' for the license.';
      },
      choices: function (s) {
        var y = n.syncLicense;
        return [
          { id: 'license', label: 'License it', effects: { cash: S(s, y.pay), streams: { amount: y.streams, weeks: y.weeks, label: 'TV placement' } } },
          { id: 'pass', label: 'Keep it off TV', effects: { morale: y.passMorale }, safe: true }
        ];
      }
    },

    podcast: {
      id: 'podcast', title: 'A big podcast invite', stages: ['touring', 'star'], weight: n.podcast.weight,
      when: function () { return true; },
      text: function () { return 'One of the biggest podcasts in the country wants you on for three unscripted hours.'; },
      choices: function () {
        var p = n.podcast;
        return [
          { id: 'go', label: 'Go on the show', effects: { energy: p.energy, gamble: [
            { chance: p.chance, text: 'You were funny and real', effects: { fans: p.winFans, buzzAll: p.winBuzz } },
            { chance: 1 - p.chance, text: 'You said something you regret', effects: { reputation: p.loseReputation, morale: p.loseMorale } }] } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    merchKnockoff: {
      id: 'merchKnockoff', title: 'Bootleg shirts', stages: ['touring', 'star'], weight: n.merchKnockoff.weight,
      when: function () { return true; },
      text: function () { return 'Bootleggers are selling knock-off shirts with your name outside every show.'; },
      choices: function (s) {
        var m = n.merchKnockoff;
        return [
          { id: 'security', label: 'Hire security to clear them out', effects: { cash: -S(s, m.security) } },
          { id: 'ignore', label: 'Ignore it', effects: { morale: m.ignoreMorale }, safe: true }
        ];
      }
    },

    promoterSkips: {
      id: 'promoterSkips', title: 'The promoter skipped out', stages: ['touring', 'star'], weight: n.promoterSkips.weight,
      when: function (s) { return s.stats.gigsPlayed > 0; },
      text: function () { return 'A promoter from last week\'s show stopped answering calls, and your fee never arrived.'; },
      choices: function (s) {
        var p = n.promoterSkips;
        return [
          { id: 'sue', label: 'Get lawyers on it', effects: { cash: -S(s, p.legal), gamble: [
            { chance: p.chance, text: 'You won', effects: { cash: S(s, p.payout) } },
            { chance: 1 - p.chance, text: 'He had nothing left to take', effects: {} }] } },
          { id: 'letGo', label: 'Chalk it up to experience', effects: { morale: p.letGoMorale }, safe: true }
        ];
      }
    },

    supportLegend: {
      id: 'supportLegend', title: 'A legend calls', stages: ['touring'], weight: n.supportLegend.weight,
      when: function () { return true; },
      text: function () { return 'A band you grew up worshipping asks you to open their hometown show, a one-night thing.'; },
      choices: function () {
        var l = n.supportLegend;
        return [
          { id: 'open', label: 'Drop everything and do it', effects: { energy: l.energy, buzzAll: l.buzz, fans: l.fans, reputation: l.reputation } },
          { id: 'pass', label: 'We\'re too booked up', effects: {}, safe: true }
        ];
      }
    },

    poached: {
      id: 'poached', title: 'A bandmate gets an offer', stages: ['touring', 'star'], weight: n.poached.weight,
      when: function (s) { return members(s).length > 0 && Game.rules.scene.rivals(s).length > 0; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds), bandId: rng.pick(Game.rules.scene.rivals(s)).id }; },
      text: function (s, d) { return rivalName(s, d.bandId) + ' offered ' + name(s, d.personId) + ' a spot in their band, with more money.'; },
      choices: function (s, d) {
        var p = n.poached;
        return [
          { id: 'match', label: 'Match their offer', effects: { cash: -S(s, p.match), satisfaction: { personId: d.personId, amount: p.matchSatisfaction, reason: 'You matched a rival\'s offer' } } },
          { id: 'choose', label: 'Let them choose', effects: { gamble: [
            { chance: p.chance, text: 'They stayed', effects: { satisfaction: { personId: d.personId, amount: p.staySatisfaction, reason: 'They chose the band' } } },
            { chance: 1 - p.chance, text: 'They took the offer', effects: { memberLeaves: d.personId } }] }, safe: true }
        ];
      }
    },

    festivalSwap: {
      id: 'festivalSwap', title: 'A better festival slot', stages: ['touring'], weight: n.festivalSwap.weight,
      when: function () { return true; },
      text: function () { return 'A festival lost its sunset act and asks if you can fill in on short notice.'; },
      choices: function () {
        var f = n.festivalSwap;
        return [
          { id: 'play', label: 'Take the sunset slot', effects: { energy: f.energy, buzzAll: f.buzz, fans: f.fans } },
          { id: 'pass', label: 'Can\'t make it work', effects: {}, safe: true }
        ];
      }
    },

    radioAdd: {
      id: 'radioAdd', title: 'National radio picked up your song', stages: ['touring', 'star'], weight: n.radioAdd.weight,
      when: function (s) { return s.releases.length > 0; },
      text: function () { return 'Stations across the country added your single. The label wants you on a radio tour of morning shows.'; },
      choices: function () {
        var r = n.radioAdd;
        return [
          { id: 'tour', label: 'Do the radio tour', effects: { energy: r.energy, streams: { amount: r.streams, weeks: r.weeks, label: 'Radio play' }, buzzAll: r.buzz } },
          { id: 'quiet', label: 'Let the song do the work', effects: { streams: { amount: r.quietStreams, weeks: r.weeks, label: 'Radio play' } }, safe: true }
        ];
      }
    },

    tourInjury: {
      id: 'tourInjury', title: 'An injury on the road', stages: ['touring', 'star'], weight: n.tourInjury.weight,
      when: function (s) { return members(s).length > 0; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, d) { return name(s, d.personId) + ' sprained a wrist loading out last night.'; },
      choices: function (s) {
        var t = n.tourInjury;
        return [
          { id: 'sub', label: 'Hire a session player for a week', effects: { cash: -S(s, t.session) } },
          { id: 'playThrough', label: 'They\'ll play through it', effects: { gigScore: { amount: t.gigScore, days: t.days, label: 'Injured bandmate' } }, safe: true }
        ];
      }
    },

    labelPush: {
      id: 'labelPush', title: 'Your label wants to go big', stages: ['touring', 'star'], weight: n.labelPush.weight,
      when: function (s) { return hasDeal(s) && s.releases.length > 0; },
      text: function (s) {
        return (hasDeal(s) ? Game.rules.label.name(s.label.deal.labelId) : 'Your label') + ' wants to put real money behind your latest record if you split the cost: $' +
          S(s, n.labelPush.cost).toLocaleString() + ' from you.';
      },
      choices: function (s) {
        var l = n.labelPush;
        return [
          { id: 'split', label: 'Split the cost', effects: { cash: -S(s, l.cost), labelMood: l.mood, streams: { amount: l.streams, weeks: l.weeks, label: 'Label push' } } },
          { id: 'pass', label: 'Not right now', effects: { labelMood: l.passMood }, safe: true }
        ];
      }
    },

    viralClip: {
      id: 'viralClip', title: 'A clip went viral', stages: ['touring', 'star'], weight: n.viralClip.weight,
      when: function (s) { return s.stats.gigsPlayed > 0; },
      text: function () { return 'A fan\'s video from your last show is everywhere this week.'; },
      choices: function () {
        var v = n.viralClip;
        return [
          { id: 'lean', label: 'Lean in: post every day', effects: { energy: v.energy, buzzAll: v.buzz, fans: v.fans } },
          { id: 'enjoy', label: 'Enjoy it', effects: { buzzAll: v.enjoyBuzz }, safe: true }
        ];
      }
    },

    charityGig: {
      id: 'charityGig', title: 'A children\'s hospital asks', stages: ['touring'], weight: n.charityGig.weight,
      when: function () { return true; },
      text: function () { return 'A children\'s hospital asks if you\'d play a short set for the kids on your day off.'; },
      choices: function () {
        var c = n.charityGig;
        return [
          { id: 'play', label: 'Play for the kids', effects: { energy: c.energy, reputation: c.reputation, morale: c.morale } },
          { id: 'decline', label: 'Politely decline', effects: {}, safe: true }
        ];
      }
    },

    visaTrouble: {
      id: 'visaTrouble', title: 'Visa trouble', stages: ['touring', 'star'], weight: n.visaTrouble.weight,
      when: function (s) { return away(s) && abroad(s); },
      text: function () { return 'Border control flagged the band\'s work visas. It\'ll get sorted, but how fast is up to you.'; },
      choices: function (s) {
        var v = n.visaTrouble;
        return [
          { id: 'expedite', label: 'Pay an immigration lawyer to rush it', effects: { cash: -S(s, v.expedite) } },
          { id: 'wait', label: 'Wait it out in line', effects: { dailyEnergy: { amount: v.dailyEnergy, days: v.days, label: 'Visa trouble' }, morale: v.morale }, safe: true }
        ];
      }
    },

    hotelDamage: {
      id: 'hotelDamage', title: 'The hotel sent a bill', stages: ['touring', 'star'], weight: n.hotelDamage.weight,
      when: function (s) { return members(s).length > 0 && away(s); },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, d) { return 'After a wild night, the hotel billed the band for a wrecked room. Everyone knows it was ' + name(s, d.personId) + '.'; },
      choices: function (s, d) {
        var h = n.hotelDamage;
        return [
          { id: 'pay', label: 'Pay it and move on', effects: { cash: -S(s, h.pay) } },
          { id: 'theirs', label: 'It comes out of their pay', effects: { satisfaction: { personId: d.personId, amount: h.satisfaction, reason: 'You made them pay for the hotel room' } }, safe: true }
        ];
      }
    },

    // ----- Star -----

    stadiumCharity: {
      id: 'stadiumCharity', title: 'A stadium benefit', stages: ['star'], weight: n.stadiumCharity.weight,
      when: function () { return true; },
      text: function () { return 'A disaster-relief benefit at a sold-out stadium wants you to headline, for free.'; },
      choices: function (s) {
        var c = n.stadiumCharity;
        return [
          { id: 'headline', label: 'Headline it', effects: { energy: c.energy, reputation: c.reputation, fans: c.fans, morale: c.morale } },
          { id: 'donate', label: 'Send a donation instead', effects: { cash: -S(s, c.donate), reputation: c.donateReputation } },
          { id: 'decline', label: 'Decline', effects: {}, safe: true }
        ];
      }
    },

    tvSpot: {
      id: 'tvSpot', title: 'The biggest TV night of the year', stages: ['star'], weight: n.tvSpot.weight,
      when: function () { return true; },
      text: function () { return 'You\'re asked to play the halftime show of the year\'s biggest broadcast. Live, no second takes.'; },
      choices: function () {
        var t = n.tvSpot;
        return [
          { id: 'play', label: 'Play it live', effects: { energy: t.energy, gamble: [
            { chance: t.chance, text: 'You owned it', effects: { fans: t.winFans, buzzAll: t.winBuzz, streams: { amount: t.winStreams, weeks: t.weeks, label: 'Halftime show' } } },
            { chance: 1 - t.chance, text: 'The sound went wrong', effects: { reputation: t.loseReputation } }] } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    taxAudit: {
      id: 'taxAudit', title: 'A tax audit', stages: ['star'], weight: n.taxAudit.weight,
      when: function () { return true; },
      text: function () { return 'The tax office is auditing your last two years of touring income.'; },
      choices: function (s) {
        var t = n.taxAudit;
        return [
          { id: 'accountants', label: 'Hire top accountants', effects: { cash: -S(s, t.accountants) } },
          { id: 'self', label: 'Handle it yourself', effects: { gamble: [
            { chance: t.chance, text: 'Your books were clean', effects: {} },
            { chance: 1 - t.chance, text: 'They found mistakes', effects: { cash: -S(s, t.penalty) } }] }, safe: true }
        ];
      }
    },

    superstarCollab: {
      id: 'superstarCollab', title: 'A superstar wants a feature', stages: ['star'], weight: n.superstarCollab.weight,
      when: function (s) { return s.releases.length > 0; },
      text: function () { return 'One of the biggest names in pop wants you on their next single.'; },
      choices: function (s) {
        var c = n.superstarCollab;
        return [
          { id: 'record', label: 'Record the feature', effects: { energy: c.energy, cash: S(s, c.pay), fans: c.fans, streams: { amount: c.streams, weeks: c.weeks, label: 'Superstar feature' } } },
          { id: 'pass', label: 'Not our sound', effects: {}, safe: true }
        ];
      }
    },

    burnout: {
      id: 'burnout', title: 'Your doctor\'s warning', stages: ['touring', 'star'], weight: n.burnout.weight,
      when: function (s) { return s.player.morale < 70 || s.player.energy < 60; },
      text: function () { return 'Your doctor looks at your schedule and says it plainly: slow down, or something will give.'; },
      choices: function () {
        var bo = n.burnout;
        return [
          { id: 'rest', label: 'Take two easy weeks', effects: { dailyEnergy: { amount: bo.restEnergy, days: bo.restDays, label: 'Taking it easy' }, buzzAll: bo.restBuzz } },
          { id: 'push', label: 'Push on', effects: { gamble: [
            { chance: bo.chance, text: 'You held together', effects: {} },
            { chance: 1 - bo.chance, text: 'You hit a wall', effects: { morale: bo.badMorale, gigScore: { amount: bo.badGigScore, days: bo.badDays, label: 'Burned out on the road' } } }] }, safe: true }
        ];
      }
    },

    awardCampaign: {
      id: 'awardCampaign', title: 'Awards season politics', stages: ['star'], weight: n.awardCampaign.weight,
      when: function (s) { return s.releases.length > 0; },
      text: function (s) {
        return 'A publicist says a For Your Consideration campaign (ads, parties, voter screenings) would cost $' + S(s, n.awardCampaign.cost).toLocaleString() + '.';
      },
      choices: function (s) {
        var a = n.awardCampaign;
        return [
          { id: 'campaign', label: 'Run the campaign', effects: { cash: -S(s, a.cost), awardsBoost: a.boost } },
          { id: 'pass', label: 'Let the music speak', effects: {}, safe: true }
        ];
      }
    },

    leakedDemo: {
      id: 'leakedDemo', title: 'Your demo leaked', stages: ['star'], weight: n.leakedDemo.weight,
      when: function () { return true; },
      text: function () { return 'Rough demos from your next record leaked online and fans are going wild.'; },
      choices: function () {
        var l = n.leakedDemo;
        return [
          { id: 'release', label: 'Release them early, officially', effects: { gamble: [
            { chance: l.chance, text: 'Fans loved the raw versions', effects: { streams: { amount: l.winStreams, weeks: l.weeks, label: 'Surprise release' }, buzzAll: l.winBuzz } },
            { chance: 1 - l.chance, text: 'It looked unfinished', effects: { reputation: l.loseReputation, labelMood: l.loseMood } }] } },
          { id: 'quiet', label: 'Say nothing', effects: {}, safe: true }
        ];
      }
    },

    magazineCover: {
      id: 'magazineCover', title: 'A magazine cover', stages: ['star'], weight: n.magazineCover.weight,
      when: function () { return true; },
      text: function () { return 'The biggest music magazine in the country wants you on its cover.'; },
      choices: function () {
        var m = n.magazineCover;
        return [
          { id: 'shoot', label: 'Do the shoot and interview', effects: { energy: m.energy, awardsBoost: m.boost, buzzAll: m.buzz } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    privateGig: {
      id: 'privateGig', title: 'A billionaire\'s party', stages: ['star'], weight: n.privateGig.weight,
      when: function () { return true; },
      text: function (s) { return 'A billionaire offers $' + S(s, n.privateGig.pay).toLocaleString() + ' for a private set at a birthday party. It will leak.'; },
      choices: function (s) {
        var p = n.privateGig;
        return [
          { id: 'play', label: 'Take the money', effects: { cash: S(s, p.pay), reputation: p.reputation, energy: p.energy } },
          { id: 'pass', label: 'We\'re not for sale', effects: {}, safe: true }
        ];
      }
    },

    signatureGuitar: {
      id: 'signatureGuitar', title: 'Your own signature guitar', stages: ['star'], weight: n.signatureGuitar.weight,
      when: function () { return true; },
      text: function () { return 'A guitar maker wants to sell a signature model with your name on the headstock.'; },
      choices: function (s) {
        var g = n.signatureGuitar;
        return [
          { id: 'sign', label: 'Sign the deal', effects: { cash: S(s, g.pay), reputation: g.reputation } },
          { id: 'pass', label: 'Pass', effects: {}, safe: true }
        ];
      }
    },

    breakupRumor: {
      id: 'breakupRumor', title: 'Breakup rumors', stages: ['touring', 'star'], weight: n.breakupRumor.weight,
      when: function (s) { return members(s).length > 0; },
      text: function () { return 'Gossip sites say the band is about to split. The band is fine, but everyone\'s asking.'; },
      choices: function () {
        var r = n.breakupRumor;
        return [
          { id: 'mystery', label: 'Lean into the mystery', effects: { gamble: [
            { chance: r.chance, text: 'The buzz was huge', effects: { buzzAll: r.winBuzz } },
            { chance: 1 - r.chance, text: 'The band didn\'t find it funny', effects: { satisfactionAll: r.loseSatisfaction, reason: 'You played up the breakup rumors' } }] } },
          { id: 'deny', label: 'Deny it', effects: { energy: r.denyEnergy, buzzAll: r.denyBuzz }, safe: true }
        ];
      }
    },

    // ----- Stories: a first step, and what follows -----

    brandDeal: {
      id: 'brandDeal', title: 'A brand deal', stages: ['touring', 'star'], weight: n.brandDeal.weight,
      when: function () { return true; },
      text: function (s) { return 'A sneaker company wants you as the face of an ad campaign: $' + S(s, n.brandDeal.pay).toLocaleString() + ' up front.'; },
      choices: function (s) {
        var d = n.brandDeal;
        return [
          { id: 'sign', label: 'Sign with them', effects: { cash: S(s, d.pay), followUp: { eventId: 'brandDealAd', inDays: d.followDays } } },
          { id: 'pass', label: 'Stay out of ads', effects: {}, safe: true }
        ];
      }
    },
    brandDealAd: {
      id: 'brandDealAd', title: 'The ad is out', story: true, stages: ['touring', 'star'], weight: 1,
      when: function () { return false; },
      text: function () { return 'Your sneaker ad hit TV and phones everywhere. Fans are talking about it, one way or the other.'; },
      choices: function () {
        var d = n.brandDeal;
        return [
          { id: 'promote', label: 'Promote it hard', effects: { energy: d.adEnergy, gamble: [
            { chance: d.chance, text: 'People loved it', effects: { fans: d.winFans, buzzAll: d.winBuzz } },
            { chance: 1 - d.chance, text: 'Fans called you a sellout', effects: { reputation: d.loseReputation, morale: d.loseMorale } }] } },
          { id: 'quiet', label: 'Let it run quietly', effects: { gamble: [
            { chance: d.quietChance, text: 'It went over fine', effects: { buzzAll: d.quietBuzz } },
            { chance: 1 - d.quietChance, text: 'Some fans grumbled', effects: { reputation: d.quietReputation } }] }, safe: true }
        ];
      }
    },

    sampleLawsuit: {
      id: 'sampleLawsuit', title: 'Sued over a sample', stages: ['touring', 'star'], weight: n.sampleLawsuit.weight,
      when: function (s) { return s.releases.length > 0; },
      text: function () { return 'An old band\'s lawyers say one of your songs borrows their riff, and they want to be paid.'; },
      choices: function (s) {
        var l = n.sampleLawsuit;
        return [
          { id: 'settle', label: 'Settle now', effects: { cash: -S(s, l.settle) }, safe: true },
          { id: 'fight', label: 'Fight it in court', effects: { cash: -S(s, l.lawyers), followUp: { eventId: 'sampleCourt', inDays: l.followDays } } }
        ];
      }
    },
    sampleCourt: {
      id: 'sampleCourt', title: 'Your day in court', story: true, stages: ['touring', 'star'], weight: 1,
      when: function () { return false; },
      text: function () { return 'The riff lawsuit goes to trial tomorrow. Their lawyers make one last offer to settle.'; },
      choices: function (s) {
        var l = n.sampleLawsuit;
        return [
          { id: 'trial', label: 'Go to trial', effects: { gamble: [
            { chance: l.chance, text: 'You won, and they pay your costs', effects: { cash: S(s, l.winPay), reputation: l.winReputation } },
            { chance: 1 - l.chance, text: 'You lost', effects: { cash: -S(s, l.losePay) } }] } },
          { id: 'settle', label: 'Settle on the courthouse steps', effects: { cash: -S(s, l.stepsSettle) }, safe: true }
        ];
      }
    },

    rivalFeud: {
      id: 'rivalFeud', title: 'A rival starts a feud', stages: ['local', 'touring', 'star'], weight: n.rivalFeud.weight,
      when: function (s) { return Game.rules.scene.rivals(s).length > 0; },
      setup: function (s, rng) { return { bandId: rng.pick(Game.rules.scene.rivals(s)).id }; },
      text: function (s, d) { return rivalName(s, d.bandId) + ' took a shot at you in an interview, and fans want to know what you\'ll say.'; },
      choices: function (s, d) {
        var f = n.rivalFeud;
        return [
          { id: 'diss', label: 'Fire back with a diss track', effects: { energy: f.energy, gamble: [
            { chance: f.chance, text: 'Your track won the feud', effects: { buzzAll: f.winBuzz, fans: f.winFans } },
            { chance: 1 - f.chance, text: 'It looked petty', effects: { reputation: f.loseReputation, morale: f.loseMorale } }] } },
          { id: 'peace', label: 'Call them and make peace', effects: { reputation: f.peaceReputation, followUp: { eventId: 'rivalPeace', inDays: f.followDays, data: { bandId: d.bandId } } } },
          { id: 'ignore', label: 'Ignore it', effects: { morale: f.ignoreMorale }, safe: true }
        ];
      }
    },
    rivalPeace: {
      id: 'rivalPeace', title: 'Peace with a rival', story: true, stages: ['local', 'touring', 'star'], weight: 1,
      when: function () { return false; },
      text: function (s, d) { return rivalName(s, d.bandId) + ' liked how you handled it, and wants to do a joint show to bury the hatchet in public.'; },
      choices: function () {
        var f = n.rivalFeud;
        return [
          { id: 'joint', label: 'Play the joint show', effects: { energy: f.jointEnergy, buzzAll: f.jointBuzz, fans: f.jointFans } },
          { id: 'pass', label: 'Peace is enough', effects: {}, safe: true }
        ];
      }
    },

    documentary: {
      id: 'documentary', title: 'A documentary crew', stages: ['touring', 'star'], weight: n.documentary.weight,
      when: function () { return true; },
      text: function () { return 'A filmmaker wants to follow you on the road for a feature documentary. Cameras everywhere, for weeks.'; },
      choices: function () {
        var d = n.documentary;
        return [
          { id: 'film', label: 'Let them film', effects: { energy: d.energy, dailyEnergy: { amount: d.filmEnergy, days: d.filmDays, label: 'Cameras on the road' },
            followUp: { eventId: 'documentaryRelease', inDays: d.followDays } } },
          { id: 'pass', label: 'No cameras', effects: {}, safe: true }
        ];
      }
    },
    documentaryRelease: {
      id: 'documentaryRelease', title: 'The documentary premieres', story: true, stages: ['touring', 'star'], weight: 1,
      when: function () { return false; },
      text: function () { return 'The documentary is done and premieres this week. You haven\'t seen the final cut.'; },
      choices: function () {
        var d = n.documentary;
        return [
          { id: 'premiere', label: 'Walk the red carpet and promote it', effects: { gamble: [
            { chance: d.chance, text: 'Critics loved it', effects: { awardsBoost: d.winBoost, fans: d.winFans, buzzAll: d.winBuzz } },
            { chance: 1 - d.chance, text: 'The edit was unflattering', effects: { reputation: d.loseReputation, morale: d.loseMorale } }] } },
          { id: 'skip', label: 'Let it come out quietly', effects: { gamble: [
            { chance: d.chance, text: 'It found an audience', effects: { fans: d.quietFans } },
            { chance: 1 - d.chance, text: 'People talked about the worst scenes', effects: { reputation: d.quietReputation } }] }, safe: true }
        ];
      }
    },

    soloOffer: {
      id: 'soloOffer', title: 'A solo deal for a bandmate', stages: ['touring', 'star'], weight: n.soloOffer.weight,
      when: function (s) { return members(s).length > 0; },
      setup: function (s, rng) { return { personId: rng.pick(s.band.memberIds) }; },
      text: function (s, d) { return 'A label offered ' + name(s, d.personId) + ' a solo record deal. They want to know where you stand.'; },
      choices: function (s, d) {
        var o = n.soloOffer;
        return [
          { id: 'support', label: 'Support them, do both', effects: { satisfaction: { personId: d.personId, amount: o.support, reason: 'You backed their solo record' },
            followUp: { eventId: 'soloReturn', inDays: o.followDays, data: { personId: d.personId } } }, safe: true },
          { id: 'stay', label: 'Ask them to stay focused on the band', effects: { satisfaction: { personId: d.personId, amount: o.stay, reason: 'You asked them to turn down a solo deal' } } },
          { id: 'letGo', label: 'Tell them to go for it', effects: { memberLeaves: d.personId } }
        ];
      }
    },
    soloReturn: {
      id: 'soloReturn', title: 'The solo record is out', story: true, stages: ['touring', 'star'], weight: 1,
      when: function (s) { return true; },
      text: function (s, d) { return name(s, d.personId) + '\'s solo record just came out, and they\'re watching how the band reacts.'; },
      choices: function (s, d) {
        var o = n.soloOffer;
        return [
          { id: 'plug', label: 'Plug it to your fans', effects: { energy: o.plugEnergy, buzzAll: o.plugBuzz, satisfaction: { personId: d.personId, amount: o.plugSatisfaction, reason: 'You plugged their solo record' } } },
          { id: 'focus', label: 'Keep the focus on the band', effects: { satisfaction: { personId: d.personId, amount: o.focusSatisfaction, reason: 'You ignored their solo record' } }, safe: true }
        ];
      }
    },

    tabloid: {
      id: 'tabloid', title: 'A tabloid story', stages: ['star'], weight: n.tabloid.weight,
      when: function () { return true; },
      text: function () { return 'A tabloid ran a made-up story about you, and it\'s all over the internet.'; },
      choices: function (s) {
        var t = n.tabloid;
        return [
          { id: 'respond', label: 'Respond publicly', effects: { gamble: [
            { chance: t.chance, text: 'Fans rallied behind you', effects: { buzzAll: t.winBuzz } },
            { chance: 1 - t.chance, text: 'It kept the story alive', effects: { reputation: t.loseReputation } }] } },
          { id: 'sue', label: 'Sue for libel', effects: { cash: -S(s, t.sue), followUp: { eventId: 'tabloidVerdict', inDays: t.followDays } } },
          { id: 'quiet', label: 'Stay quiet', effects: { reputation: t.quietReputation }, safe: true }
        ];
      }
    },
    tabloidVerdict: {
      id: 'tabloidVerdict', title: 'The libel case', story: true, stages: ['star'], weight: 1,
      when: function () { return false; },
      text: function () { return 'Your libel case against the tabloid comes to a head. They\'d like to make it go away.'; },
      choices: function (s) {
        var t = n.tabloid;
        return [
          { id: 'trial', label: 'See it through', effects: { gamble: [
            { chance: t.verdictChance, text: 'You won big', effects: { cash: S(s, t.verdictPay), reputation: t.verdictReputation } },
            { chance: 1 - t.verdictChance, text: 'You lost, and pay their costs', effects: { cash: -S(s, t.verdictLoss) } }] } },
          { id: 'drop', label: 'Drop the case', effects: {}, safe: true }
        ];
      }
    }
  };
})();
