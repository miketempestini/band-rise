// progress.test.js
// Tests for milestones, fame, the "Three weeks in" card, tutorial tips, and the time savers.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    return s;
  }

  Game.test('Milestones: each fires once with a banner and +10 morale', function (t) {
    var s = freshState();
    s.stats.openMicsPlayed = 1;
    var r = Game.rules.progress.checkUnlocks(s);
    t.equal(r.state.milestones.firstOpenMic, s.day, 'First open mic reached');
    t.equal(r.state.player.morale, 60, '+10 morale');
    t.ok(r.state.toasts.some(function (x) { return x.id === 'firstOpenMic'; }), 'banner');
    var again = Game.rules.progress.checkUnlocks(r.state);
    t.equal(again.state.player.morale, 60, 'not twice');
  });

  Game.test('Milestones 1 to 5 trigger from play', function (t) {
    var s = freshState();
    s.player.reputation = 12;
    var started = Game.rules.songs.startSong(s);
    s = Game.rules.songs.finishSong(started.state, started.songId).state;
    var met = Game.rules.people.meet(s);
    s = met.state;
    s.people[met.personId].relationship = 60;
    s.people[met.personId].skill = 20;
    s = Game.rules.people.invite(s, met.personId).state;
    s.day = 1;
    s = Game.rules.gigs.playGig(s, 'rustyNail', Game.rules.gigs.suggestSet(s, 2), 100).state;
    s = Game.rules.gigs.playGig(s, 'backRoom', Game.rules.gigs.suggestSet(s, 6), 100, { deal: 'guarantee' }).state;
    s = Game.rules.progress.checkUnlocks(s).state;
    ['firstOpenMic', 'firstOriginal', 'firstBandmate', 'smallRooms', 'firstPaidGig'].forEach(function (id) {
      t.ok(s.milestones[id] !== undefined, id);
    });
  });

  Game.test('Fame: levels by total fans, with progress toward the next', function (t) {
    var s = freshState();
    t.equal(Game.rules.progress.fame(s).name, 'Bedroom Musician', '0 fans');
    s.cities.hometown.fans = 10;
    t.equal(Game.rules.progress.fame(s).name, 'Open Mic Regular', '10 fans');
    s.cities.hometown.fans = 55;
    var f = Game.rules.progress.fame(s);
    t.equal(f.next.name, 'Local Act');
    t.near(f.toNext, 0.5, 'halfway from 10 to 100');
  });

  Game.test('Three weeks in: shows after day 21 once, and finds the next paid show', function (t) {
    var s = freshState();
    s.day = 20;
    t.ok(!Game.rules.progress.sliceDue(s), 'not yet on day 20');
    s.day = 21;
    t.ok(Game.rules.progress.sliceDue(s), 'due on day 21');
    var report = Game.rules.progress.sliceReport(s);
    t.equal(report.nextPaidShow, null, 'no paid show yet');
    t.equal(report.rows.filter(function (r) { return r.id === 'cash'; })[0].inRange, true, '$500 is inside $400-900');
    s = Game.rules.booking.bookFillIn(s, 'backRoom', 26).state;
    t.equal(Game.rules.progress.sliceReport(s).nextPaidShow.inDays, 5, 'your first real show is in 5 days');
    s = Game.rules.progress.markSliceSeen(s).state;
    t.ok(!Game.rules.progress.sliceDue(s), 'only once');
  });

  Game.test('Tutorial: tips show on the first days, can be dismissed, and can be turned off', function (t) {
    var s = freshState();
    t.equal(Game.rules.progress.tutorialCard(s).id, 'topbar', 'first tip');
    s = Game.rules.progress.dismissTip(s, 'topbar').state;
    t.equal(Game.rules.progress.tutorialCard(s).id, 'blocks', 'next tip');
    s = Game.rules.progress.setTutorial(s, false).state;
    t.equal(Game.rules.progress.tutorialCard(s), null, 'off');
    s = Game.rules.progress.setTutorial(s, true).state;
    s.day = Game.balance.tutorial.days;
    t.equal(Game.rules.progress.tutorialCard(s), null, 'none after the first days');
  });

  Game.test('Repeat yesterday\'s evening: plans the same task (and song) again', function (t) {
    var s = freshState();
    var song = Game.rules.songs.playable(s)[2].id;
    s = Game.rules.actions.plan(s, 'evening', 'practice', song).state;
    s = Game.rules.day.endDay(s).state;
    t.equal(Game.rules.actions.repeatProblem(s), null, 'available');
    s = Game.rules.actions.repeatEvening(s).state;
    var e = Game.rules.actions.plannedEntry(s, 'evening');
    t.equal(e.actionId, 'practice');
    t.equal(e.songId, song, 'same song');
    t.ok(Game.rules.actions.repeatProblem(s), 'not twice');
  });

  Game.test('Skip to next commitment: stops on the day something is planned', function (t) {
    var s = freshState();
    s.pendingEvent = null;
    s = Game.rules.actions.plan(s, 'evening', 'write', null, 3).state; // Thursday evening
    var r = Game.rules.day.skipToNextCommitment(s);
    t.ok(r.state.day <= 3, 'stopped by Thursday (day ' + r.state.day + ')');
    t.ok(r.days.length >= 1, 'skipped at least a day');
    t.ok(r.stopReason.length > 0, 'says why: ' + r.stopReason);
  });

  Game.test('Skip to next commitment: always stops at the end of the week', function (t) {
    var s = freshState(9);
    var r = Game.rules.day.skipToNextCommitment(s);
    t.ok(r.state.day <= 7, 'stopped by the weekly summary (day ' + r.state.day + ')');
    t.ok(Game.rules.day.skipProblem(Game.rules.actions.plan(freshState(), 'evening', 'rest').state), 'not with plans today');
  });

  Game.test('Save: a version 6 save upgrades with events, settings, and tutorial fields', function (t) {
    var old = Game.util.clone(freshState());
    old.version = 6;
    delete old.pendingEvent; delete old.eventHistory; delete old.effects; delete old.settings; delete old.tutorialSeen; delete old.lastEvening;
    delete old.player.job.extraShifts; delete old.stats.openMicsPlayed; delete old.stats.paidShows;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.settings.tutorial, true);
    t.equal(loaded.state.stats.paidShows, 0);
  });

})();
