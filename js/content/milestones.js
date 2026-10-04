// milestones.js
// The career milestones from Design.md, in order. Fixed data, never saved.
// Milestones 1 to 13 are live so far (their checks are in js/rules/progress.js); the rest show on the
// Career screen as what's ahead.

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
var m = Game.balance.milestones;
var j = Game.balance.job;
var n = function (x) { return x.toLocaleString('en-US'); };

Game.content.milestones = [
  { id: 'firstOpenMic',  number: 1,  name: 'First open mic',   trigger: 'Play an open mic' },
  { id: 'firstOriginal', number: 2,  name: 'First original',   trigger: 'Finish writing a song' },
  { id: 'firstBandmate', number: 3,  name: 'First bandmate',   trigger: 'Someone accepts your invite' },
  { id: 'smallRooms',    number: 4,  name: 'Small rooms',      trigger: 'Reputation ' + m.smallRoomsReputation },
  { id: 'firstPaidGig',  number: 5,  name: 'First paid gig',   trigger: 'Play a paid show at a small room' },
  { id: 'firstRecording', number: 6, name: 'First recording',  trigger: 'Record a song' },
  { id: 'firstRelease',  number: 7,  name: 'First release',    trigger: 'Release a single or EP' },
  { id: 'partTime',      number: 8,  name: 'Part-time',        trigger: 'Reputation ' + j.partTimeMinReputation + ' and job standing ' + j.partTimeMinStanding + '+' },
  { id: 'fullBand',      number: 9,  name: 'Full band',        trigger: m.fullBandOnStage + '+ on stage' },
  { id: 'onTheRoad',     number: 10, name: 'On the road',      trigger: 'Reputation ' + m.onTheRoadReputation },
  { id: 'quitJob',       number: 11, name: 'Quit the day job', trigger: 'You choose to quit' },
  { id: 'wheels',        number: 12, name: 'Wheels',           trigger: 'Buy a van' },
  { id: 'firstTour',     number: 13, name: 'First tour',       trigger: Game.balance.tours.minShows + '+ out-of-town shows in ' + Game.balance.tours.withinDays + ' days' },
  { id: 'manager',       number: 14, name: 'Manager',          trigger: 'Reputation ' + m.managerReputation + ' and ' + n(m.managerFans) + ' fans' },
  { id: 'theater',       number: 15, name: 'Theater',          trigger: 'Reputation ' + m.theaterReputation + ' and a release' },
  { id: 'labelOffer',    number: 16, name: 'Label offer',      trigger: 'Reputation ' + m.labelReputation + ' and ' + n(m.labelFans) + ' fans' },
  { id: 'awards',        number: 17, name: 'Awards season',    trigger: 'Every December' },
  { id: 'arena',         number: 18, name: 'Arena',            trigger: 'Reputation ' + m.arenaReputation + ' and ' + n(m.arenaFans) + ' fans' }
];
})();
