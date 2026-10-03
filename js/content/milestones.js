// milestones.js
// The career milestones from Design.md, in order. Fixed data, never saved.
// Only the first five are live so far (their checks are in js/rules/progress.js); the rest show on the
// Career screen as what's ahead.

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.milestones = [
  { id: 'firstOpenMic',  number: 1,  name: 'First open mic',   trigger: 'Play an open mic' },
  { id: 'firstOriginal', number: 2,  name: 'First original',   trigger: 'Finish writing a song' },
  { id: 'firstBandmate', number: 3,  name: 'First bandmate',   trigger: 'Someone accepts your invite' },
  { id: 'smallRooms',    number: 4,  name: 'Small rooms',      trigger: 'Reputation 10' },
  { id: 'firstPaidGig',  number: 5,  name: 'First paid gig',   trigger: 'Play a paid show at a small room' },
  { id: 'firstRecording', number: 6, name: 'First recording',  trigger: 'Record a song' },
  { id: 'firstRelease',  number: 7,  name: 'First release',    trigger: 'Release a single or EP' },
  { id: 'partTime',      number: 8,  name: 'Part-time',        trigger: 'Reputation 20 and job standing 50+' },
  { id: 'fullBand',      number: 9,  name: 'Full band',        trigger: '3+ on stage' },
  { id: 'onTheRoad',     number: 10, name: 'On the road',      trigger: 'Reputation 25' },
  { id: 'quitJob',       number: 11, name: 'Quit the day job', trigger: 'You choose to quit' },
  { id: 'wheels',        number: 12, name: 'Wheels',           trigger: 'Buy a van' },
  { id: 'firstTour',     number: 13, name: 'First tour',       trigger: '3+ out-of-town shows in 10 days' },
  { id: 'manager',       number: 14, name: 'Manager',          trigger: 'Reputation 50 and 2,000 fans' },
  { id: 'theater',       number: 15, name: 'Theater',          trigger: 'Reputation 60 and a release' },
  { id: 'labelOffer',    number: 16, name: 'Label offer',      trigger: 'Reputation 65 and 10,000 fans' },
  { id: 'awards',        number: 17, name: 'Awards season',    trigger: 'Every December' },
  { id: 'arena',         number: 18, name: 'Arena',            trigger: 'Reputation 85 and 100,000 fans' }
];
