// people.js
// Fixed words for people: band roles and the six personality traits.
// The numbers for each trait live in balance.js (balance.traits); the text below is built from them.

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.roles = {
  guitar: { name: 'Guitar', person: 'guitarist' },
  bass:   { name: 'Bass',   person: 'bassist' },
  drums:  { name: 'Drums',  person: 'drummer' },
  keys:   { name: 'Keys',   person: 'keys player' },
  vocals: { name: 'Vocals', person: 'singer' }
};

(function () {
var t = Game.balance.traits;
var pct = function (x) { return Math.round(x * 100) + '%'; };

Game.content.traits = {
  workhorse: {
    name: 'Workhorse',
    upside: '+' + pct(t.workhorse.rehearsalTightnessBonus) + ' tightness from rehearsals',
    downside: 'Unhappy with fewer than ' + t.workhorse.minRehearsalsPerWeek + ' rehearsals a week',
    clashesWith: 'Flaky'
  },
  easygoing: {
    name: 'Easygoing',
    upside: 'Satisfaction drifts up ' + t.easygoing.weeklySatisfaction + ' a week',
    downside: 'None',
    clashesWith: 'No one'
  },
  perfectionist: {
    name: 'Perfectionist',
    upside: '+' + t.perfectionist.bandMusicianshipBonus + ' to band musicianship',
    downside: t.perfectionist.roughGigSatisfaction + ' satisfaction after a Rough gig',
    clashesWith: 'Party Animal'
  },
  partyAnimal: {
    name: 'Party Animal',
    upside: '+' + t.partyAnimal.gigScoreBonus + ' gig score (crowd energy)',
    downside: 'Reliability ' + t.partyAnimal.reliabilityPenalty,
    clashesWith: 'Perfectionist'
  },
  diva: {
    name: 'Diva',
    upside: '+' + t.diva.gigScoreBonus + ' gig score',
    downside: 'Wants ' + Game.balance.bandPay.divaShares + ' shares of gig pay',
    clashesWith: 'Another Diva'
  },
  flaky: {
    name: 'Flaky',
    upside: 'Usually skilled (+' + t.flaky.skillBonusWhenCreated + ' when met)',
    downside: 'Misses ' + pct(t.flaky.missRehearsalChance) + ' of rehearsals',
    clashesWith: 'Workhorse'
  }
};
})();
