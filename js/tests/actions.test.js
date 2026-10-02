// actions.test.js
// Tests for planning and doing actions (js/rules/actions.js and End Day).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState() {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.morale = 50; // middle morale: skill multiplier 1
    return s;
  }

  // Moves a fresh career forward to Saturday (no job blocks).
  function saturday() {
    var s = freshState();
    for (var i = 0; i < 5; i++) s = Game.rules.day.endDay(s).state;
    s.player.energy = 100;
    s.player.morale = 50;
    return s;
  }

  Game.test('Actions: every action has its numbers from balance.js', function (t) {
    var a = Game.content.actions;
    var b = Game.balance;
    t.equal(a.practice.energyCost, b.energy.cost.practice, 'practice energy');
    t.equal(a.network.moneyCost, b.economy.networkingCost, 'network cost');
    t.equal(a.hangFlyers.moneyCost, b.promotion.flyers.cost, 'flyers cost');
    t.equal(a.rest.effects.energy, b.energy.restGain, 'rest energy');
  });

  Game.test('Actions: planning puts the action on today\'s calendar; clearing removes it', function (t) {
    var s = freshState();
    s = Game.rules.actions.plan(s, 'evening', 'practice').state;
    t.equal(Game.rules.actions.plannedActionId(s, 'evening'), 'practice', 'planned');
    s = Game.rules.actions.clear(s, 'evening').state;
    t.equal(Game.rules.actions.plannedActionId(s, 'evening'), null, 'cleared');
    t.equal(Object.keys(s.entries).length, 0, 'entry removed');
  });

  Game.test('Actions: can\'t plan on a day-job block', function (t) {
    var s = freshState();
    var r = Game.rules.actions.plan(s, 'morning', 'practice');
    t.equal(Game.rules.actions.plannedActionId(r.state, 'morning'), null);
    t.ok(r.log.length > 0, 'gives a reason');
  });

  Game.test('Actions: can\'t plan without enough energy at that point in the day', function (t) {
    var s = freshState();
    s.player.energy = 50; // 50 - 40 for the job leaves 10 by the evening
    var opt = Game.rules.actions.option(s, 'evening', 'practice');
    t.equal(opt.ok, false, 'Practice needs 15');
    t.ok(opt.reason.indexOf('energy') !== -1, 'reason mentions energy');
    t.ok(Game.rules.actions.option(s, 'evening', 'postOnline').ok, 'Post online (5 energy) is fine');
  });

  Game.test('Actions: can\'t plan without enough cash', function (t) {
    var s = freshState();
    s.player.cash = 10;
    var opt = Game.rules.actions.option(s, 'evening', 'hangFlyers');
    t.equal(opt.ok, false, 'flyers cost $20');
    t.ok(opt.reason.indexOf('$') !== -1, 'reason mentions money');
  });

  Game.test('Actions: earlier planned actions count toward later blocks', function (t) {
    var s = saturday();
    s.player.cash = 25;
    s = Game.rules.actions.plan(s, 'morning', 'hangFlyers').state; // $20, leaves $5
    t.equal(Game.rules.actions.option(s, 'afternoon', 'network').ok, false, 'only $5 left for Network ($15)');
  });

  Game.test('Actions: Practice at End Day grows Musicianship and costs 15 energy', function (t) {
    var s = saturday();
    s = Game.rules.actions.plan(s, 'morning', 'practice').state;
    var after = Game.rules.day.endDay(s).state;
    t.ok(Math.abs(after.player.skills.musicianship - 22.5) < 0.0001, 'Musicianship 20 to 22.5');
    t.equal(after.player.skillLastUsed.musicianship, s.day, 'marked as used');
    t.equal(after.lastDayReport.blocks[0].title, 'Practice', 'shows on the Day results');
    t.equal(Object.keys(after.entries).length, 0, 'finished day removed from the calendar');
  });

  Game.test('Actions: Rest gives +25 energy and +5 morale', function (t) {
    var s = saturday();
    s.player.energy = 40;
    var r = Game.rules.actions.perform(s, 'rest');
    t.equal(r.state.player.energy, 65);
    t.equal(r.state.player.morale, 55);
  });

  Game.test('Actions: Network costs $15 and grows Networking', function (t) {
    var s = saturday();
    var cash = s.player.cash;
    var r = Game.rules.actions.perform(s, 'network');
    t.equal(r.state.player.cash, cash - 15);
    t.ok(r.state.player.skills.networking > s.player.skills.networking, 'Networking went up');
    t.equal(r.state.thisWeek.costs.networking, 15, 'shows in the weekly summary');
  });

  Game.test('Actions: Post online and Hang flyers raise hometown buzz and Promotion', function (t) {
    var s = saturday(); // Promotion 5
    var post = Game.rules.actions.perform(s, 'postOnline').state;
    t.equal(post.cities.hometown.buzz, 1.25, 'post: 1 + 5 / 20');
    t.ok(post.player.skills.promotion > 5, 'Promotion grew');
    var flyers = Game.rules.actions.perform(s, 'hangFlyers').state;
    t.ok(Math.abs(flyers.cities.hometown.buzz - 3.15) < 0.0001, 'flyers: 3 x 1.05');
  });

  Game.test('Actions: Tired halves the skill gain from Practice', function (t) {
    var s = saturday();
    s.player.energy = 20;
    var r = Game.rules.actions.perform(s, 'practice');
    t.ok(Math.abs(r.state.player.skills.musicianship - 21.25) < 0.0001, '+1.25 instead of +2.5');
  });

  Game.test('Actions: Burned out stops Practice from building skill', function (t) {
    var s = saturday();
    s.player.morale = 10;
    s.player.burnedOut = true;
    var r = Game.rules.actions.perform(s, 'practice');
    t.equal(r.state.player.skills.musicianship, 20, 'no gain');
    t.ok(Game.rules.actions.option(s, 'morning', 'practice').burnedOutWarning, 'picker warns');
  });

  Game.test('Actions: a planned action that can\'t happen anymore is skipped as free time', function (t) {
    var s = saturday();
    s = Game.rules.actions.plan(s, 'morning', 'hangFlyers').state;
    s.player.cash = 0; // money vanished after planning
    var after = Game.rules.day.endDay(s).state;
    t.equal(after.lastDayReport.blocks[0].title, 'Free time');
    t.equal(after.cities.hometown.buzz, 0, 'no buzz added');
  });

  Game.test('Save: a version 1 save (Phase 1) upgrades and loads', function (t) {
    var s = freshState();
    var old = Game.util.clone(s);
    old.version = 1;
    delete old.cities.hometown;
    delete old.player.burnedOut;
    delete old.nextEntryId;
    delete old.lastDayReport;
    old.lastDayLog = ['old'];
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.version, Game.balance.save.version, 'now the current version');
    t.equal(loaded.state.cities.hometown.buzz, 0, 'hometown added');
    t.equal(loaded.state.player.burnedOut, false, 'burnedOut added');
    t.ok(!('lastDayLog' in loaded.state), 'old field removed');
  });

})();
