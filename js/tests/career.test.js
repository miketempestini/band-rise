// career.test.js
// Tests for starting a new career (js/state.js and js/rules/career.js).

Game.test('New career: starting numbers come from balance.js, with version and seed', function (t) {
  var b = Game.balance;
  var s = Game.rules.career.startCareer('Sam', 'guitar', 777).state;
  t.equal(s.version, b.save.version, 'version');
  t.equal(s.seed, 777, 'seed');
  t.equal(s.rngState, 777, 'random generator position starts at the seed');
  t.equal(s.day, 0, 'starts on Monday of week 1');
  t.equal(s.player.name, 'Sam');
  t.equal(s.player.cash, b.economy.startCash, 'cash');
  t.equal(s.player.energy, b.energy.start, 'energy');
  t.equal(s.player.morale, b.morale.start, 'morale');
  t.equal(s.player.reputation, b.reputation.start, 'reputation');
  t.equal(s.player.job.status, 'full', 'full-time job');
  t.equal(s.player.loanOwed, 0, 'no debt');
  t.equal(s.gameOver, null, 'not game over');
});

Game.test('New career: each instrument adds its +3 skill bonus', function (t) {
  var start = Game.balance.skills.start;
  var guitar = Game.rules.career.startCareer('A', 'guitar', 1).state.player.skills;
  var keys = Game.rules.career.startCareer('B', 'keys', 1).state.player.skills;
  var bass = Game.rules.career.startCareer('C', 'bass', 1).state.player.skills;
  t.equal(guitar.performance, start.performance + 3, 'guitar: Performance');
  t.equal(keys.songwriting, start.songwriting + 3, 'keys: Songwriting');
  t.equal(bass.networking, start.networking + 3, 'bass: Networking');
  t.equal(guitar.songwriting, start.songwriting, 'guitar leaves Songwriting alone');
});
