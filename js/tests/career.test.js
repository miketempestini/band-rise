// career.test.js
// Tests for starting a new career (js/state.js and js/rules/career.js).

Game.test('New career: starting numbers come from balance.js, with version and seed', function (t) {
  var b = Game.balance;
  var s = Game.rules.career.startCareer('Sam', 'guitar', 777).state;
  t.equal(s.version, b.save.version, 'version');
  t.equal(s.seed, 777, 'seed');
  t.ok(typeof s.rngState === 'number', 'random generator position is saved (it moves when the starting covers are picked)');
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

Game.test('Skill points: a new career uses the points you spent, plus the instrument bonus on top', function (t) {
  var allocation = { musicianship: 30, performance: 0, songwriting: 10, promotion: 0, networking: 10 };
  var skills = Game.rules.career.startCareer('A', 'keys', 1, allocation).state.player.skills;
  t.equal(skills.musicianship, 30);
  t.equal(skills.performance, 0);
  t.equal(skills.songwriting, 13, '10 points + 3 from Keys');
  t.equal(skills.networking, 10);
});

Game.test('Skill points: the Suggested build matches balance.js and adds up to 50', function (t) {
  var a = Game.rules.career.suggestedAllocation();
  t.sameContents(a, Game.balance.skills.start);
  t.equal(Game.rules.career.pointsLeft(a), 0, 'all 50 spent');
  t.equal(Game.rules.career.allocationProblem(a), null, 'allowed');
});

Game.test('Skill points: must spend exactly 50, with 0 to 30 per skill', function (t) {
  var c = Game.rules.career;
  t.ok(c.allocationProblem(c.emptyAllocation()), 'nothing spent: not allowed');
  t.ok(c.allocationProblem({ musicianship: 31, performance: 19, songwriting: 0, promotion: 0, networking: 0 }), 'over 30: not allowed');
  t.ok(c.allocationProblem({ musicianship: 30, performance: 30, songwriting: 0, promotion: 0, networking: -10 }), 'negative: not allowed');
  t.ok(c.allocationProblem({ musicianship: 30, performance: 21, songwriting: 0, promotion: 0, networking: 0 }), '51 points: not allowed');
  var threw = false;
  try { c.startCareer('A', 'guitar', 1, c.emptyAllocation()); } catch (e) { threw = true; }
  t.ok(threw, 'starting with points left over is refused');
});

Game.test('Skill points: +/- buttons stay inside the points left, the cap, and 0', function (t) {
  var c = Game.rules.career;
  var a = c.emptyAllocation();
  a = c.adjustAllocation(a, 'musicianship', 5);
  t.equal(a.musicianship, 5, '+5');
  a = c.adjustAllocation(a, 'musicianship', -1);
  t.equal(a.musicianship, 4, '-1');
  a = c.adjustAllocation(a, 'musicianship', -5);
  t.equal(a.musicianship, 0, 'never below 0');
  a.musicianship = 28;
  a = c.adjustAllocation(a, 'musicianship', 5);
  t.equal(a.musicianship, 30, '+5 at 28 stops at the cap of 30');
  a.performance = 18; // 48 spent, 2 left
  a = c.adjustAllocation(a, 'songwriting', 5);
  t.equal(a.songwriting, 2, '+5 with 2 points left adds 2');
  t.equal(c.pointsLeft(a), 0);
});

Game.test('Skill points: Randomize spends exactly 50, never over 30, and repeats with the same seed', function (t) {
  var c = Game.rules.career;
  for (var seed = 1; seed <= 20; seed++) {
    var a = c.randomAllocation(seed);
    t.equal(c.allocationProblem(a), null, 'seed ' + seed + ' is a valid spread');
  }
  t.sameContents(c.randomAllocation(7), c.randomAllocation(7), 'same seed, same spread');
});

