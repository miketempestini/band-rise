// handbook.test.js
// Tests for Walt's welcome handbook and the Guide (js/content/handbook.js): every page and section has words in it,
// no number came out broken, the key numbers match balance.js, and the screens open and close where they should.

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  // All the text of a page or section, as one string (tables and lists included).
  function allText(item) {
    return [item.title, item.note].concat(item.body.map(function (piece) {
      if (typeof piece === 'string') return piece;
      if (piece.table) return piece.table.cols.concat([].concat.apply([], piece.table.rows)).join(' ');
      if (piece.list) return piece.list.join(' ');
      return piece.tip || '';
    })).join(' ');
  }

  function newCareer() {
    return Game.rules.career.startCareer('Sam Rivera', 'guitar', 1).state;
  }

  Game.test('Handbook: every page and Guide section has a title, a note, and text, with no broken numbers', function (t) {
    var items = Game.content.handbook.pages(newCareer()).concat(Game.content.handbook.sections());
    var ids = {};
    var broken = items.filter(function (item) {
      var text = allText(item);
      return !item.title || !item.note || !item.body.length || /undefined|NaN|\[object|Infinity/.test(text);
    }).map(function (item) { return item.id; });
    items.forEach(function (item) { ids[item.id + (ids[item.id] ? '2' : '')] = true; });
    t.ok(Game.content.handbook.pages(newCareer()).length >= 10, 'the welcome handbook has its pages');
    t.ok(Game.content.handbook.sections().length >= 20, 'the Guide covers every system');
    t.equal(broken.length, 0, broken.length ? 'broken: ' + broken.join(', ') : 'all readable');
  });

  Game.test('Handbook: the numbers Walt quotes are the game\'s real numbers', function (t) {
    var pages = Game.content.handbook.pages(newCareer());
    var page = function (id) { return allText(pages.filter(function (p) { return p.id === id; })[0]); };
    var b = Game.balance;
    t.ok(page('morale').indexOf('Rest +' + b.morale.change.rest) !== -1, 'Rest\'s morale');
    t.ok(page('morale').indexOf('no work) +' + b.morale.change.fullDayOff) !== -1, 'a full day off');
    t.ok(page('energy').indexOf(b.energy.overnight + ' overnight') !== -1, 'overnight energy');
    t.ok(page('energy').indexOf('Under ' + b.energy.tiredThreshold) !== -1, 'the Tired line');
    t.ok(page('day').indexOf('$' + b.housing.starter.weeklyCost) !== -1, 'the rent');
    t.ok(page('audience').indexOf('Small rooms') !== -1 && page('audience').indexOf(String(b.venues.tiers[1].minReputation)) !== -1, 'small rooms at reputation 10');
  });

  Game.test('Handbook: the player\'s name is shown safely and the mentor has a real portrait', function (t) {
    var s = newCareer();
    s.player.name = '<b>Sam</b>';
    var welcome = Game.content.handbook.pages(s)[0];
    t.ok(welcome.note.indexOf('<b>') === -1 && welcome.note.indexOf('&lt;b&gt;') !== -1, 'the name is escaped');
    t.ok(Game.content.art.portraits.indexOf(Game.content.handbook.mentor.portrait) !== -1, 'portrait ' + Game.content.handbook.mentor.portrait);
  });

  Game.test('Handbook: a new career opens it, and finishing or skipping goes to the first day', function (t) {
    if (!Game.app || !Game.ui.handbook) { t.ok(true, 'screens not loaded'); return; }
    var app = Game.app;
    var saved = { state: app.state, screen: app.screen, page: app.handbookPage, back: app.handbookReturn, autoSave: app.autoSave,
      returnTo: app.returnTo.guide };
    var holder = document.createElement('div');
    holder.id = 'app';
    holder.hidden = true;
    var debug = document.createElement('div');
    debug.id = 'debug';
    debug.hidden = true;
    document.body.appendChild(holder);
    document.body.appendChild(debug);
    app.autoSave = function () {}; // never touch the real saved game
    try {
      app.screen = 'settings';
      app.state = newCareer();
      app.openHandbook('today');
      t.equal(app.screen, 'handbook', 'opens on the handbook');
      var pages = Game.content.handbook.pages(app.state).length;
      for (var i = 1; i < pages; i++) app.handbookGo(i);
      t.ok(holder.innerHTML.indexOf('Start my first day') !== -1, 'the last page starts the first day');
      app.closeHandbook();
      t.equal(app.screen, 'today', 'finishing goes to Today');
      app.openHandbook('settings');
      t.ok(holder.innerHTML.indexOf('Close the handbook') !== -1, 'opened again from Settings, it can be closed');
      app.closeHandbook();
      t.equal(app.screen, 'settings', 'closing goes back to Settings');
      app.openGuide();
      t.equal(app.screen, 'guide', 'Settings opens the Guide');
      app.guideGo('morale');
      t.ok(holder.querySelector('.guide-section').textContent.indexOf('Morale') !== -1, 'a section opens');
      app.goBack('guide');
      t.equal(app.screen, 'settings', 'Back returns to Settings');
    } finally {
      document.body.removeChild(holder);
      document.body.removeChild(debug);
      app.state = saved.state; app.screen = saved.screen; app.handbookPage = saved.page; app.handbookReturn = saved.back;
      app.autoSave = saved.autoSave; app.returnTo.guide = saved.returnTo;
    }
  });
})();
