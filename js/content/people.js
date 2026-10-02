// people.js
// Fixed words for people: band roles and the six personality traits.
// The numbers for each trait live in balance.js (balance.traits).

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.roles = {
  guitar: { name: 'Guitar', person: 'guitarist' },
  bass:   { name: 'Bass',   person: 'bassist' },
  drums:  { name: 'Drums',  person: 'drummer' },
  keys:   { name: 'Keys',   person: 'keys player' },
  vocals: { name: 'Vocals', person: 'singer' }
};

Game.content.traits = {
  workhorse: {
    name: 'Workhorse',
    upside: '+50% tightness from rehearsals',
    downside: 'Unhappy with fewer than 2 rehearsals a week',
    clashesWith: 'Flaky'
  },
  easygoing: {
    name: 'Easygoing',
    upside: 'Satisfaction drifts up 2 a week',
    downside: 'None',
    clashesWith: 'No one'
  },
  perfectionist: {
    name: 'Perfectionist',
    upside: '+5 to band musicianship',
    downside: '-10 satisfaction after a Rough gig',
    clashesWith: 'Party Animal'
  },
  partyAnimal: {
    name: 'Party Animal',
    upside: '+5 gig score (crowd energy)',
    downside: 'Reliability -20',
    clashesWith: 'Perfectionist'
  },
  diva: {
    name: 'Diva',
    upside: '+5 gig score',
    downside: 'Wants 1.5 shares of gig pay',
    clashesWith: 'Another Diva'
  },
  flaky: {
    name: 'Flaky',
    upside: 'Usually skilled (+15 when met)',
    downside: 'Misses 25% of rehearsals',
    clashesWith: 'Workhorse'
  }
};
