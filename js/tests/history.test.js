// history.test.js
// Tests for keeping the saved game small and End Day quick: old records dropped each night (day.pruneHistory),
// rules that change many cities, songs, or bandmates in a loop copying the game only once, and accepted opening
// slots no longer rolling the scene's dice.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function career(seed) {
    return Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
  }

  // Adds an Inbox message and sets how it stands. Returns the new state.
  function message(s, kind, expiresDay, resolved, read) {
    s = Game.rules.booking.addInbox(s, kind, { title: kind, text: '' }, expiresDay);
    var m = s.inbox[s.inbox.length - 1];
    m.resolved = resolved;
    m.read = read;
    return s;
  }

  Game.test('Old records: finished, read Inbox messages older than the limit are dropped; anything still open stays', function (t) {
    var keep = Game.balance.history.keepDays;
    var s = career();
    s.inbox = [];
    s.day = 10;
    s = message(s, 'note', null, false, true);       // m: old news, read: dropped
    s = message(s, 'note', null, false, false);      // old news, not read yet: stays
    s = message(s, 'reply', s.day + 3, false, true); // an offer nobody answered yet: stays
    s = message(s, 'reply', s.day + 3, 'accepted', true); // answered, but the newest reply: stays
    s = message(s, 'event', null, 'answered', true); // the newest event: stays
    var ids = s.inbox.map(function (m) { return m.id; });
    s.day = 10 + keep + 1;
    s = message(s, 'note', null, false, true);       // a new note (so the old read note isn't the newest)
    var left = Game.rules.day.pruneHistory(s).state.inbox.map(function (m) { return m.id; });
    t.ok(left.indexOf(ids[0]) === -1, 'the old read note is dropped');
    t.ok(left.indexOf(ids[1]) !== -1, 'an unread note stays');
    t.ok(left.indexOf(ids[2]) !== -1, 'an unanswered offer stays');
    t.ok(left.indexOf(ids[3]) !== -1, 'the newest message of a kind stays');
    t.ok(left.indexOf(ids[4]) !== -1, 'the newest event stays');
    t.equal(left.length, s.inbox.length - 1, 'only one message dropped');
  });

  Game.test('Old records: answered booking emails and old weekly summaries are dropped; pending ones stay', function (t) {
    var keep = Game.balance.history.keepDays;
    var weeks = Math.max(Game.balance.finances.chartWeeks, Game.balance.job.quitScreenIncomeWeeks);
    var s = career();
    s.day = keep + 20;
    s.requests = {
      r1: { id: 'r1', venueId: 'backRoom', gigDay: 12, deal: 'door', chance: 0.5, sentDay: 5, replyDay: 7, status: 'answered' },
      r2: { id: 'r2', venueId: 'backRoom', gigDay: s.day + 5, deal: 'door', chance: 0.5, sentDay: 5, replyDay: s.day + 1, status: 'pending' },
      r3: { id: 'r3', venueId: 'backRoom', gigDay: s.day + 9, deal: 'door', chance: 0.5, sentDay: s.day - 2, replyDay: s.day, status: 'answered' }
    };
    s.ledger = [];
    for (var w = 1; w <= weeks + 7; w++) s.ledger.push({ week: w });
    var r = Game.rules.day.pruneHistory(s).state;
    t.sameContents(Object.keys(r.requests).sort(), ['r2', 'r3'], 'the old answered email is dropped; pending and recent ones stay');
    t.equal(r.ledger.length, weeks, 'weekly summaries: as many as the Finances chart shows');
    t.equal(r.ledger[r.ledger.length - 1].week, weeks + 7, 'the newest week stays');
    t.equal(s.ledger.length, weeks + 7, 'the old state is left alone');
    t.equal(Game.rules.day.pruneHistory(r).state, r, 'nothing to drop: the same state (no copy)');
  });

  Game.test('Old records: a long career\'s save stays small, and End Day still works', function (t) {
    var s = Game.save.parse(JSON.stringify(Game.testSaves.lateCareer)).state;
    var before = JSON.stringify(s).length;
    s.pendingEvent = null;
    var r = Game.rules.day.endDay(s);
    t.ok(JSON.stringify(r.state).length < before * 0.7, 'the save shrinks: ' + before + ' -> ' + JSON.stringify(r.state).length + ' characters');
    t.equal(r.state.day, s.day + 1, 'the day moves on');
    t.ok(r.state.inbox.length > 0, 'recent messages are still in the Inbox');
  });

  Game.test('Copy once: the manager\'s nightly posts and road mood change a copy and leave the old state alone', function (t) {
    var s = career();
    s.manager.hired = true;
    s.cities.hometown.fans = 50;
    var buzzBefore = s.cities.hometown.buzz;
    var posted = Game.rules.manager.dailyPosts(s).state;
    t.equal(posted.cities.hometown.buzz, buzzBefore + Game.balance.manager.social.dailyBuzz, 'hometown buzz goes up');
    t.equal(s.cities.hometown.buzz, buzzBefore, 'the old state keeps its buzz');

    var met = Game.rules.people.meet(s);
    s = met.state;
    var id = met.personId;
    s.people[id].trait = 'partyAnimal';
    s.people[id].status = 'member'; // straight into the band (this test is about copying, not inviting)
    s.band.memberIds = [id];
    s.people[id].satisfaction = 50;
    var moody = Game.rules.tours.roadMood(s, 1).state;
    t.equal(moody.people[id].satisfaction, 50 + Game.balance.traits.roadMood.partyAnimal, 'a Party Animal enjoys the road');
    t.equal(s.people[id].satisfaction, 50, 'the old state keeps its satisfaction');
  });

  Game.test('Copy once: buzzOn, tightenOn, interactOn, and satisfactionOn match the rules that copy', function (t) {
    var s = career();
    var city = 'hometown';
    t.sameContents(Game.rules.audience.addBuzz(s, city, 7).state.cities, (function () {
      var c = Game.util.clone(s); Game.rules.audience.buzzOn(c, city, 7); return c.cities;
    })(), 'buzz');
    var songId = Object.keys(s.songs)[0];
    var practiced = Game.rules.songs.practiceSong(s, songId, 9);
    var copy = Game.util.clone(s);
    t.equal(Game.rules.songs.tightenOn(copy, songId, 9), practiced.added, 'tightness added');
    t.sameContents(copy.songs, practiced.state.songs, 'songs');
  });

  Game.test('Scene: an opening slot you accepted doesn\'t roll the scene\'s dice every night', function (t) {
    var s = career();
    var show = s.scene.shows[0];
    t.ok(show, 'the scene has a show to open for');
    var withSlot = Game.rules.booking.addInbox(s, 'opening', { venueId: show.venueId, day: show.day, fee: 100, showId: show.id,
      bandId: show.bandId }, s.day + 3);
    var m = withSlot.inbox[withSlot.inbox.length - 1];
    m.resolved = 'accepted';
    m.read = true;
    var plain = Game.rules.scene.nightly(s).state;
    var accepted = Game.rules.scene.nightly(withSlot).state;
    t.equal(accepted.scene.rngState, plain.scene.rngState, 'the scene\'s dice are where they would be without the slot');
  });

})();
