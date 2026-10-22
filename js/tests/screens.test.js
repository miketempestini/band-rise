// screens.test.js
// Opens every screen with real data and checks none of them breaks: once with a brand-new career and once with the
// late-career test save (test-saves/late-career.js), which has hundreds of messages, finished tours, and every
// feature unlocked. Both Inbox and Manager bugs this year only showed up with lots of data.
// It draws into a hidden box, so nothing shows on the test page, and puts everything back afterwards.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  var screens = ['today', 'calendar', 'inbox', 'booking', 'map', 'songs', 'people', 'shop', 'finances', 'career', 'settings',
    'manager', 'job'];

  // Draws one screen (or a setup function's screen) and returns null, or the error's message.
  function tryScreen(app, setup) {
    try { setup(app); return null; } catch (e) { return e.message; }
  }

  function openEverything(t, label, state) {
    var app = Game.app;
    var problems = [];
    var check = function (name, setup) {
      app.state = Game.util.clone(state);
      app.pickerBlock = null; app.dayReportOpen = false; app.posterTourId = null; app.screen = 'title';
      var err = tryScreen(app, setup);
      if (err) problems.push(name + ': ' + err);
    };
    screens.forEach(function (name) { check(name, function (a) { a.show(name); }); });
    check('planWeek', function (a) { a.openPlanWeek(); });
    check('music: releases', function (a) { a.musicSection = 'releases'; a.show('songs'); });
    check('music: charts', function (a) { a.musicSection = 'charts'; a.show('songs'); });
    state.releases.forEach(function (rel) { check('release page (' + rel.id + ')', function (a) { a.openRelease(rel.id); }); });
    // A ticket to another band's show tonight (if a show in town is free): Today, the Calendar, and Book draw it.
    var show = state.scene.shows.filter(function (x) { return !Game.rules.scene.ticketProblem(state, x.id); })[0];
    if (show) {
      ['today', 'calendar', 'booking'].forEach(function (name) {
        check(name + ' with a ticket', function (a) {
          a.state = Game.rules.scene.buyTicket(a.state, show.id).state;
          a.show(name);
          a.calendarDay = show.day; // the Calendar opens on the ticket's day
          a.render();
        });
      });
    }
    check('map: world', function (a) { a.mapView = 'world'; a.show('map'); a.mapView = 'home'; });
    check('book abroad', function (a) {
      a.state.cities.lindenberg.unlocked = true;
      a.bookingCity = 'lindenberg';
      a.show('booking');
      a.bookingCity = 'hometown';
    });
    check('tour builder (empty)', function (a) { a.tourBuild = null; a.openTourBuilder(); });
    check('tour builder (with stops)', function (a) {
      a.tourBuild = a.newTourBuild();
      Object.keys(a.state.cities).filter(function (id) { return id !== 'hometown' && a.state.cities[id].unlocked; }).slice(0, 4)
        .forEach(function (id) { a.tbAdd(id); });
      a.tourBuild.view = 'world';
      a.show('tourBuilder');
      a.tourBuild = null;
    });
    check('setlist editor', function (a) {
      var show = Object.keys(a.state.entries).map(function (id) { return a.state.entries[id]; }).filter(function (e) { return e.type === 'gig'; })[0];
      if (!show) return;
      a.show('calendar');
      a.calendarDay = show.day;
      a.editSetlist(show.id);
      a.setlistDraft = null;
    });
    check('action picker', function (a) { a.show('today'); a.pickerBlock = 'evening'; a.render(); });
    check('day readout', function (a) { a.show('today'); a.dayReportOpen = true; a.render(); });
    // Record labels: three offers (a contract, a counter-offer pending, the comparison), then the Manager screen signed.
    check('label offers', function (a) {
      var rng = Game.rng.create(3);
      ['porchlight', 'monolith', 'goldtooth'].forEach(function (id) { a.state = Game.rules.label.addOffer(a.state, rng, id); });
      var ids = Game.rules.label.openOffers(a.state).map(function (m) { return m.id; });
      a.show('inbox');
      a.openLabelDeal(ids[0]);
      a.labelAsks = ['advance', 'royalty']; a.render();
      a.state = Game.rules.label.counter(a.state, ids[1], ['records']).state;
      a.openLabelDeal(ids[1]);
      a.openLabelCompare();
      a.state.manager.hired = true;
      a.state = Game.rules.label.sign(a.state, ids[2]).state;
      a.signedNotice = 'Signed.';
      a.show('dealSigned');      // the signing moment
      a.leaveDealSigned();       // then your deal on the Manager screen
      a.musicSection = 'releases'; a.show('songs'); a.musicSection = 'writing';
      a.show('career');
      a.show('finances');
    });
    Game.content.handbook.pages(state).forEach(function (page, i) {
      check('handbook page ' + (i + 1), function (a) { a.openHandbook('today'); a.handbookGo(i); });
    });
    Game.content.handbook.sections().forEach(function (section) {
      check('guide: ' + section.id, function (a) { a.show('settings'); a.openGuide(); a.guideGo(section.id); });
    });
    if (state.lastGig) check('gig result', function (a) { a.gigPhase = 'result'; a.show('gigResult'); });
    if (state.ledger.length) check('weekly summary', function (a) { a.show('weeklySummary'); });
    if (Object.keys(state.songs).length) check('song reveal', function (a) { a.revealQueue = [Object.keys(a.state.songs)[0]]; a.show('songReveal'); });
    if (state.band.memberIds.length) check('name the band', function (a) { a.show('nameBand'); });
    state.tours.forEach(function (tour) {
      check('tour poster (' + tour.id + ')', function (a) { a.show('career'); a.openTourPoster(tour.id); });
      if (tour.result) check('tour wrap-up (' + tour.id + ')', function (a) { a.openTourWrapUp(tour.id, 'career'); });
    });
    t.equal(problems.length, 0, label + (problems.length ? ': ' + problems.join(' | ') : ': every screen opened'));
  }

  Game.test('Screens: every screen opens with a new career and with the late-career save', function (t) {
    if (!Game.app || !Game.ui) { t.ok(true, 'screens not loaded'); return; }
    var app = Game.app;
    var saved = { state: app.state, screen: app.screen, autoSave: app.autoSave };
    var root = document.createElement('div');
    root.id = 'app';
    root.hidden = true;
    var debug = document.createElement('div');
    debug.id = 'debug';
    debug.hidden = true;
    document.body.appendChild(root);
    document.body.appendChild(debug);
    app.autoSave = function () {}; // never touch the real saved game
    try {
      openEverything(t, 'new career', Game.rules.career.startCareer('Test', 'guitar', 1).state);
      var late = Game.save.parse(JSON.stringify(Game.testSaves.lateCareer));
      t.ok(late.ok, 'the late-career save loads: ' + (late.message || 'ok'));
      if (late.ok) openEverything(t, 'late career', late.state);
    } finally {
      app.state = saved.state; app.screen = saved.screen; app.autoSave = saved.autoSave;
      app.pickerBlock = null; app.dayReportOpen = false; app.posterTourId = null;
      document.body.removeChild(root);
      document.body.removeChild(debug);
    }
  });

})();
