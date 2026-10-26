// inbox.test.js
// Tests for the Inbox archive (only read, finished messages are archived; open offers never) and the keyboard
// shortcuts (E ends the day on Today, letters switch tabs, typing in a box is left alone).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState() {
    return Game.rules.career.startCareer('Test', 'guitar', 1).state;
  }

  Game.test('Inbox: "Archive read messages" tucks away read, finished messages and never open offers', function (t) {
    var B = Game.rules.booking;
    var s = freshState();
    s = B.addInbox(s, 'note', { title: 'Old news', text: 'Read it.' }, null);
    s = B.addInbox(s, 'note', { title: 'New news', text: 'Not read yet.' }, null);
    s = B.addInbox(s, 'managerOffer', {}, s.day + 7);
    s.inbox[0].read = true;          // read news: archivable
    s.inbox[2].read = true;          // a read offer still waiting for an answer: not archivable
    t.equal(B.archivable(s).length, 1, 'one message can be archived');
    var r = B.archiveRead(s).state;
    t.ok(r.inbox[0].archived, 'the read news is archived');
    t.ok(!r.inbox[1].archived, 'unread news stays');
    t.ok(!r.inbox[2].archived, 'the open offer stays');
    t.equal(B.archivable(r).length, 0, 'nothing left to archive');
  });

  Game.test('Keyboard: E ends the day on Today, letters switch tabs, and typing in a box is left alone', function (t) {
    if (!Game.app || !Game.ui.keys) { t.ok(true, 'screens not loaded'); return; }
    var app = Game.app;
    var saved = { state: app.state, screen: app.screen, autoSave: app.autoSave, endDay: app.endDay, navigate: app.navigate };
    var root = document.createElement('div');
    root.id = 'app';
    root.hidden = true;
    var debug = document.createElement('div');
    debug.id = 'debug';
    document.body.appendChild(root);
    document.body.appendChild(debug);
    var calls = [];
    app.autoSave = function () {};
    try {
      app.state = freshState();
      app.show('today');
      app.endDay = function () { calls.push('endDay'); };
      app.navigate = function (screen) { calls.push(screen); };
      var key = function (k, extra) { return Game.ui.keys.handle(Object.assign({ key: k, target: root }, extra || {}), app); };
      t.ok(key('e'), 'E is handled');
      t.ok(key('i'), 'I is handled');
      t.equal(key('e', { ctrlKey: true }), false, 'not with Ctrl held');
      var box = document.createElement('input');
      root.appendChild(box);
      t.equal(key('e', { target: box }), false, 'not while typing in a box');
      t.sameContents(calls, ['endDay', 'inbox'], 'End Day, then the Inbox');
      t.ok(key('?') && Game.ui.keys.helpOpen(), '? shows the list');
      t.ok(key('Escape') && !Game.ui.keys.helpOpen(), 'Esc hides it');
    } finally {
      Game.ui.keys.toggleHelp(false);
      app.state = saved.state; app.screen = saved.screen; app.autoSave = saved.autoSave; app.endDay = saved.endDay; app.navigate = saved.navigate;
      document.body.removeChild(root);
      document.body.removeChild(debug);
    }
  });
})();
