// housing.test.js
// Tests for Phase 13, lifestyle and legacy: the housing ladder (moving costs, weekly bills, the morale resting
// level, the House's free studio, the vacation home), the debt block on upgrades, the ten fame levels, and the
// career card's numbers.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var H = function () { return Game.rules.housing; };

  function freshState(cash) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.cash = cash === undefined ? 100000 : cash;
    return s;
  }

  Game.test('Housing: moving costs 4 weeks of the new home, and bills and the morale resting level follow it', function (t) {
    var h = Game.balance.housing;
    var s = freshState();
    t.equal(H().weeklyBills(s), 400, 'the starter apartment: $400 a week');
    t.equal(H().restingLevel(s), 50, 'morale rests at 50');
    t.equal(H().moveCost('nicer'), 4 * 700, 'moving to the nicer apartment: $2,800');
    var r = H().move(s, 'nicer');
    t.equal(r.state.player.cash, 100000 - 2800, 'paid up front');
    t.equal(H().weeklyBills(r.state), 700, '$700 a week now');
    t.equal(Game.rules.morale.restingLevel(r.state), 55, 'morale rests at 55');
    t.equal(r.state.thisWeek.costs.housing, 2800, 'shows in the weekly summary');
    var m = H().move(r.state, 'mansion').state;
    t.equal(H().weeklyBills(m), h.mansion.weeklyCost, 'mansion: $5,000 a week');
    t.equal(H().restingLevel(m), h.mansion.moraleRest, 'rests at 65');
    t.ok(H().moveProblem(m, 'mansion'), 'can\'t move into where you live');
    t.ok(H().moveProblem(m, 'vacation').indexOf('main home') !== -1, 'the vacation home can\'t be your main home');
  });

  Game.test('Housing: Sunday bills charge your homes, and the morale drift heads for the new resting level', function (t) {
    var s = H().move(freshState(), 'house').state;
    s.day = 6;
    s.player.morale = 40;
    var cash = s.player.cash;
    s.pendingEvent = null;
    var r = Game.rules.day.endDay(s).state;
    t.equal(r.ledger[0].costs.bills, Game.balance.housing.house.weeklyCost, 'Sunday: $1,500 for the House');
    t.ok(r.player.morale > 40, 'morale drifts up toward 60');
  });

  Game.test('Housing: the House comes with a home studio and unlocks the vacation home', function (t) {
    var s = freshState();
    t.ok(H().vacationProblem(s).indexOf('House') !== -1, 'vacation home locked before the House');
    s = H().move(s, 'house').state;
    t.ok(s.player.gear.homeStudio, 'free home studio');
    t.ok(s.player.livedInHouse, 'lived in the House');
    t.equal(H().vacationProblem(s), null, 'vacation home unlocked');
    var v = H().buyVacationHome(s).state;
    t.equal(v.player.cash, s.player.cash - 4 * 4000, '4 weeks up front: $16,000');
    t.equal(H().weeklyBills(v), 1500 + 4000, 'bills: the House plus the vacation home');
    t.equal(H().restingLevel(v), 75, 'morale rests at 75');
    var down = H().move(v, 'starter').state;
    t.ok(down.player.vacationHome, 'moving down keeps the vacation home');
    t.equal(H().vacationProblem(down), 'You already own it.', 'and it stays unlocked');
    var sold = H().sellVacationHome(v).state;
    t.equal(H().weeklyBills(sold), 1500, 'sold: its cost stops');
    t.equal(sold.player.cash, v.player.cash, 'no money back');
  });

  Game.test('Debt: while you owe Mom and Dad you can\'t move up or buy the vacation home; moving down is fine', function (t) {
    var s = H().move(freshState(), 'house').state;
    s.player.loanOwed = 1000;
    t.equal(H().moveProblem(s, 'mansion'), 'Pay back Mom and Dad first.', 'no upgrade');
    t.equal(H().vacationProblem(s), 'Pay back Mom and Dad first.', 'no vacation home');
    t.equal(H().moveProblem(s, 'nicer'), null, 'moving down is allowed');
    t.equal(H().move(s, 'nicer').state.player.housing, 'nicer', 'and works');
    var broke = freshState(100);
    t.ok(H().moveProblem(broke, 'nicer').indexOf('costs') !== -1, 'an upgrade needs the cash');
    broke.player.housing = 'nicer';
    t.equal(H().moveProblem(broke, 'starter'), null, 'moving down works even without the cash (Mom and Dad lend)');
  });

  Game.test('Fame: all ten levels, by total fans, at their exact thresholds', function (t) {
    var levels = Game.balance.fameLevels;
    t.equal(levels.length, 10, 'ten levels');
    var s = freshState();
    levels.forEach(function (l, i) {
      s.cities.hometown.fans = l.minFans;
      t.equal(Game.rules.progress.fame(s).name, l.name, l.minFans.toLocaleString() + ' fans: ' + l.name);
      if (i > 0) {
        s.cities.hometown.fans = l.minFans - 1;
        t.equal(Game.rules.progress.fame(s).name, levels[i - 1].name, 'one fan short: ' + levels[i - 1].name);
      }
    });
    s.cities.hometown.fans = 600;
    s.cities.harlowFalls.fans = 500;
    var ladder = Game.rules.progress.fameLadder(s);
    t.equal(ladder.filter(function (l) { return l.current; })[0].name, 'Hometown Heroes', 'fans from every city count (1,100)');
    t.equal(ladder.filter(function (l) { return l.reached; }).length, 4, 'four levels reached');
  });

  Game.test('Career card: name, fame, days and weeks, fans, songs, and the biggest show', function (t) {
    var s = freshState();
    var st = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(st.state, st.songId).state;
    s.day = 30;
    s.cities.hometown.fans = 120;
    s.stats.biggestCrowd = 48;
    s.stats.biggestShow = { venueId: 'backRoom', crowd: 48, day: 20 };
    var card = Game.rules.progress.careerCard(s);
    t.equal(card.name, 'Test');
    t.equal(card.fame, 'Local Act', '120 fans');
    t.equal(card.days, 30);
    t.equal(card.weeks, 4);
    t.equal(card.fans, 120);
    t.equal(card.originals, 1, 'one original');
    t.sameContents(card.biggestShow, { venueName: 'The Back Room', cityName: 'Millbrook', crowd: 48, date: Game.rules.day.longDate(20) }, 'biggest show');
    t.equal(card.started, 'Monday, January 5, 2026');
    s.stats.biggestCrowd = 0;
    s.stats.biggestShow = null;
    s.debug.forceNextGig = 'solid';
    var r = Game.rules.gigs.playGig(s, 'backRoom', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'door' });
    t.sameContents(r.state.stats.biggestShow, { venueId: 'backRoom', crowd: r.gig.crowd, day: 30 }, 'a gig records your biggest show');
  });

  Game.test('Save: a version 12 save loads in the starter apartment, with no vacation home and no biggest show', function (t) {
    var old = Game.util.clone(freshState());
    old.version = 12;
    delete old.player.vacationHome; delete old.player.livedInHouse; delete old.stats.biggestShow;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.version, Game.balance.save.version);
    t.equal(loaded.state.player.vacationHome, false);
    t.equal(loaded.state.stats.biggestShow, null);
  });

})();
