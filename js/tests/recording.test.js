// recording.test.js
// Tests for recording, releases, streaming, the Shop, and merch sales (js/rules/recording.js, js/rules/merch.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // A career with some original songs (quality and tightness set by the caller).
  function withOriginals(count, quality, tightness) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.morale = 50;
    var ids = [];
    for (var i = 0; i < count; i++) {
      var started = Game.rules.songs.startSong(s);
      s = Game.rules.songs.finishSong(started.state, started.songId).state;
      s.songs[started.songId].quality = quality;
      s.songs[started.songId].tightness = tightness;
      ids.push(started.songId);
    }
    return { state: s, ids: ids };
  }

  // Gives songs a recording of a set quality (without going through a studio).
  function recorded(s, ids, quality) {
    ids.forEach(function (id) { s.songs[id].recording = { quality: quality, day: s.day, studio: 'demo' }; });
    return s;
  }

  Game.test('Recording quality: 0.5 x song + 0.25 x band musicianship + 0.25 x tightness + studio bonus', function (t) {
    var o = withOriginals(1, 60, 40); // solo, Musicianship 20
    var song = o.state.songs[o.ids[0]];
    t.equal(Game.rules.recording.quality(o.state, song, 'demo'), 45, '30 + 5 + 10 + 0');
    t.equal(Game.rules.recording.quality(o.state, song, 'pro'), 55, '+10 at the Pro studio');
    t.equal(Game.rules.recording.quality(o.state, song, 'top'), 65, '+20 at the Top studio');
    t.equal(Game.rules.recording.quality(o.state, song, 'home'), 40, 'home recordings top out at 40');
  });

  Game.test('Recording: pays the studio, keeps the better recording, and only originals can be recorded', function (t) {
    var o = withOriginals(1, 60, 40);
    var s = o.state;
    var cash = s.player.cash;
    var r = Game.rules.recording.record(s, o.ids[0], 'demo');
    t.equal(r.state.player.cash, cash - 75, '$75 a block');
    t.equal(r.state.songs[o.ids[0]].recording.quality, 45);
    r.state.songs[o.ids[0]].tightness = 0;
    var worse = Game.rules.recording.record(r.state, o.ids[0], 'demo');
    t.equal(worse.state.songs[o.ids[0]].recording.quality, 45, 'a worse take doesn\'t replace the better one');
    var cover = Game.rules.songs.playable(s).filter(function (x) { return x.isCover; })[0].id;
    t.ok(Game.rules.recording.record(s, cover, 'demo').log[0].indexOf('can\'t') !== -1, 'covers can\'t be recorded');
  });

  Game.test('Studio booking: 10 to 28 days ahead, one song per block, Pro needs reputation 40', function (t) {
    var o = withOriginals(2, 50, 50);
    var s = o.state;
    var req = function (day, sessions, studio) { return { studio: studio || 'demo', day: day, sessions: sessions }; };
    t.ok(Game.rules.recording.requestProblem(s, req(9, [{ block: 'evening', songId: o.ids[0] }])), '9 days ahead: too soon');
    t.equal(Game.rules.recording.requestProblem(s, req(12, [{ block: 'evening', songId: o.ids[0] }])), null, '12 days ahead (a Saturday evening): OK');
    t.ok(Game.rules.recording.requestProblem(s, req(12, [{ block: 'evening', songId: o.ids[0] }, { block: 'evening', songId: o.ids[1] }])), 'two songs in one block refused');
    t.ok(Game.rules.recording.requestProblem(s, req(12, [{ block: 'evening', songId: o.ids[0] }], 'pro')), 'Pro needs reputation 40');
    t.ok(Game.rules.recording.requestProblem(s, req(14, [{ block: 'morning', songId: o.ids[0] }])), 'a weekday morning needs a day off');
    t.equal(Game.rules.recording.requestProblem(s, Object.assign(req(14, [{ block: 'morning', songId: o.ids[0] }]), { jobChoice: 'vacation' })), null, 'with a vacation day: OK');
  });

  Game.test('Studio booking: sessions go on the calendar and record on the day', function (t) {
    var o = withOriginals(2, 50, 50);
    var s = o.state;
    s = Game.rules.actions.plan(s, 'evening', 'bookStudio',
      { studio: 'demo', day: 12, sessions: [{ block: 'morning', songId: o.ids[0] }, { block: 'afternoon', songId: o.ids[1] }] }).state;
    s = Game.rules.day.endDay(s).state;
    t.equal(s.entries[s.schedule[12].morning].type, 'studio', 'morning session booked');
    t.equal(s.entries[s.schedule[12].afternoon].type, 'studio', 'afternoon session booked');
    for (var i = 1; i < 12; i++) { s.pendingEvent = null; s = Game.rules.day.endDay(s).state; }
    s.pendingEvent = null;
    var after = Game.rules.day.endDay(s).state;
    t.ok(after.songs[o.ids[0]].recording && after.songs[o.ids[1]].recording, 'both recorded');
    t.ok(after.milestones.firstRecording !== undefined, 'First recording milestone');
  });

  Game.test('Releases: Single 1 song, EP 3-5, Album 8-12, only unreleased recordings', function (t) {
    var o = withOriginals(3, 50, 50);
    var s = recorded(o.state, o.ids, 50);
    t.ok(Game.rules.recording.releaseProblem(s, 'ep', o.ids.slice(0, 2)), 'EP with 2 songs refused');
    t.equal(Game.rules.recording.releaseProblem(s, 'ep', o.ids), null, 'EP with 3: OK');
    t.ok(Game.rules.recording.releaseProblem(s, 'album', o.ids), 'Album needs 8');
    s = Game.rules.recording.release(s, 'single', [o.ids[0]]).state;
    t.ok(Game.rules.recording.releaseProblem(s, 'single', [o.ids[0]]), 'can\'t release the same song twice');
  });

  Game.test('Releases: buzz, fans, and reputation; half the buzz within 4 weeks', function (t) {
    var o = withOriginals(4, 50, 50);
    var s = recorded(o.state, o.ids, 60);
    s.cities.hometown.fans = 100;
    var preview = Game.rules.recording.releasePreview(s, 'ep', o.ids.slice(0, 3));
    t.near(preview.buzz, 60 / 10 * 1.5, 'EP buzz: 6 x 1.5 = 9');
    t.near(preview.fansPerCity.hometown, 100 * 0.05 * (60 / 50), 'fans: 100 x 5% x 1.2 = 6');
    t.near(preview.reputation, 3, 'reputation: 60 / 20 = 3 (at reputation 0)');
    var r = Game.rules.recording.release(s, 'ep', o.ids.slice(0, 3)).state;
    t.equal(r.cities.hometown.buzz, 9);
    t.ok(r.cities.hometown.fans >= 105 && r.cities.hometown.fans <= 107, 'about +6 fans');
    t.ok(Game.rules.progress.checkUnlocks(r).state.milestones.firstRelease !== undefined, 'First release milestone');
    r.day += 10;
    t.ok(Game.rules.recording.releasePreview(r, 'single', [o.ids[3]]).halved, '10 days later: half the buzz');
    r.day += 20;
    t.ok(!Game.rules.recording.releasePreview(r, 'single', [o.ids[3]]).halved, '30 days later: full buzz');
  });

  Game.test('Streaming: 500 fans and 3 new songs at quality 50 pay about $15 a week', function (t) {
    var o = withOriginals(3, 50, 50);
    var s = recorded(o.state, o.ids, 50);
    s.cities.hometown.fans = 500;
    s = Game.rules.recording.release(s, 'ep', o.ids).state;
    s.cities.hometown.fans = 500; // ignore the release's own new fans for the example
    t.equal(Game.rules.recording.streamingPay(s), 0, 'nothing on release day');
    s.day += 6; // the next Sunday
    t.equal(Game.rules.recording.streamingPay(s), 15, '500 x 0.02 x 0.5 x 3 songs');
  });

  Game.test('Streaming: freshness x 0.97 a week, never below 0.3; paid on Sunday as its own line', function (t) {
    var rel = { day: 0 };
    t.equal(Game.rules.recording.freshness(rel, 6), 1, 'first Sunday: 1');
    t.near(Game.rules.recording.freshness(rel, 6 + 70), Math.pow(0.97, 10), '10 weeks later');
    t.equal(Game.rules.recording.freshness(rel, 6 + 7 * 200), 0.3, 'never below 0.3');
    var o = withOriginals(1, 50, 50);
    var s = recorded(o.state, o.ids, 50);
    s.cities.hometown.fans = 500;
    s = Game.rules.recording.release(s, 'single', o.ids).state;
    for (var i = 0; i < 7; i++) { s.pendingEvent = null; s = Game.rules.day.endDay(s).state; }
    t.ok(s.ledger[0].income.streaming > 0, 'streaming shows in the weekly summary: $' + s.ledger[0].income.streaming);
  });

  Game.test('Shop: shirts after the first paid gig, CDs after the first EP, home setup after the first recording', function (t) {
    var s = withOriginals(0, 50, 50).state;
    t.ok(Game.rules.merch.buy(s, 'shirts').log[0].indexOf('first paid gig') !== -1, 'shirts locked');
    s.milestones.firstPaidGig = 0;
    var bought = Game.rules.merch.buy(s, 'shirts');
    t.equal(bought.state.player.merchStock.shirts, 25, '+25 shirts');
    t.equal(bought.state.player.cash, s.player.cash - 200, '$200');
    t.ok(Game.rules.merch.buy(s, 'cds').log[0].indexOf('EP') !== -1, 'CDs locked');
    s.milestones.firstRecording = 0;
    var home = Game.rules.merch.buy(s, 'homeStudio').state;
    t.ok(home.player.gear.homeStudio, 'home setup bought');
    t.equal(Game.rules.actions.option(home, 'evening', 'recordHome').ok, false, 'needs an original to record');
  });

  Game.test('Merch: sells by result, sells out when stock runs out, double at Hollow Records', function (t) {
    var s = withOriginals(0, 50, 50).state;
    s.player.merchStock.shirts = 3;
    var r = Game.rules.merch.sellAtGig(s, 200, 'legendary', 'cornerTap'); // 9% of 200 people: about 18 want one
    t.equal(r.sold.shirts, 3, 'all 3 sold');
    t.equal(r.state.player.merchStock.shirts, 0, 'stock at 0');
    t.ok(r.soldOut.indexOf('T-shirts') !== -1, 'sold out');
    t.equal(r.revenue, 60, '3 x $20, all yours');
    var normal = 0, hollow = 0;
    for (var seed = 1; seed <= 50; seed++) {
      var st = Game.util.clone(s);
      st.player.merchStock.cds = 1000;
      st.rngState = seed;
      normal += Game.rules.merch.sellAtGig(st, 40, 'solid', 'cornerTap').sold.cds;
      hollow += Game.rules.merch.sellAtGig(st, 40, 'solid', 'hollowRecords').sold.cds;
    }
    t.ok(hollow > normal * 1.5, 'Hollow Records sells about double (' + normal + ' vs ' + hollow + ')');
    s.player.merchStock.shirts = 0;
    t.equal(Game.rules.merch.sellAtGig(s, 50, 'great', 'cornerTap').revenue, 0, 'no stock, no sales');
  });

  Game.test('Social ads: locked until your first release, then +8 buzz x (1 + Promotion / 100)', function (t) {
    var o = withOriginals(1, 50, 50);
    var s = o.state;
    t.equal(Game.rules.actions.option(s, 'evening', 'socialAds').ok, false, 'locked');
    s = recorded(s, o.ids, 50);
    s = Game.rules.recording.release(s, 'single', o.ids).state;
    t.ok(Game.rules.actions.option(s, 'evening', 'socialAds').ok, 'unlocked');
    t.near(Game.rules.audience.promoBuzz(s, 'socialAds'), 8 * 1.05, 'at Promotion 5');
  });

  Game.test('Save: a version 7 save upgrades with the release counter', function (t) {
    var old = Game.util.clone(withOriginals(0, 50, 50).state);
    old.version = 7;
    delete old.nextReleaseId;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.nextReleaseId, 1);
  });

})();
