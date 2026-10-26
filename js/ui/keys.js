// keys.js
// Keyboard shortcuts on a computer: E ends the day, 1 / 2 / 3 plan the morning, afternoon, and evening (on Today),
// letters switch tabs, Esc goes back, and ? shows the list. They only work on screens with the top bar, never while
// you're typing in a box or holding Ctrl, Cmd, or Alt, and never on a phone. Pop-ups that use keys themselves (the
// action picker and the day readout) keep theirs: the shortcuts wait while one is open.
// The key list is fixed text here (it's about the keyboard, not game numbers).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.keys = {

  // The tab shortcuts: key, screen, and its name.
  tabs: [['t', 'today', 'Today'], ['c', 'calendar', 'Calendar'], ['i', 'inbox', 'Inbox'], ['b', 'booking', 'Book'], ['m', 'map', 'Map'],
    ['u', 'songs', 'Music'], ['p', 'people', 'People'], ['s', 'shop', 'Shop'], ['f', 'finances', 'Finances'], ['r', 'career', 'Career']],

  // Sets up the one key listener (when the game starts).
  install: function () {
    var self = Game.ui.keys;
    if (self.installed || !document.addEventListener) return;
    self.installed = true;
    document.addEventListener('keydown', function (event) { if (self.handle(event, Game.app)) event.preventDefault(); });
  },

  // Handles one key press. Returns true if it did something (so the browser doesn't also act on it).
  handle: function (event, app) {
    var self = Game.ui.keys;
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    var target = event.target;
    if (target && target.closest && target.closest('input, textarea, select, [contenteditable]')) return false;
    if (Game.ui.mobile.isPhone()) return false;
    if (event.key === 'Escape' && self.helpOpen()) { self.toggleHelp(false); return true; }
    if (!app.state || !document.querySelector('#app .topbar')) return false;   // only screens with the top bar
    if (app.pickerBlock || app.dayReportOpen || document.querySelector('#app .overlay')) return false; // a pop-up has the keys
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === '?' || key === '/') { self.toggleHelp(); return true; } // ? (or / without Shift) shows the list
    if (key === 'Escape') { app.goBack(app.screen); return true; }
    if (app.screen === 'today') {
      if (key === 'e') { app.endDay(); return true; }
      var block = { 1: 'morning', 2: 'afternoon', 3: 'evening' }[key];
      if (block) {
        var button = document.querySelector('#app [data-action="openPicker"][data-block="' + block + '"]');
        if (button && !button.disabled) { app.openPicker(block); return true; }
        return false;
      }
    }
    var tab = self.tabs.filter(function (t) { return t[0] === key; })[0];
    if (tab) {
      if (tab[1] !== app.screen) app.navigate(tab[1]);
      return true;
    }
    return false;
  },

  helpOpen: function () { return !!document.querySelector('.keys-help'); },

  // Shows or hides the shortcuts sheet (on is optional: true shows, false hides, left out flips it).
  toggleHelp: function (on) {
    var self = Game.ui.keys;
    var sheet = document.querySelector('.keys-help');
    if (on === undefined) on = !sheet;
    if (sheet) sheet.parentNode.removeChild(sheet);
    if (!on) return;
    var row = function (keys, what) { return '<dt>' + keys.map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') + '</dt><dd>' + what + '</dd>'; };
    var div = document.createElement('div');
    div.className = 'keys-help paper';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-label', 'Keyboard shortcuts');
    div.innerHTML = '<h2 class="keys-help__title">Keyboard shortcuts</h2><dl>' +
      row(['E'], 'End Day (on Today)') +
      row(['1', '2', '3'], 'Plan morning, afternoon, evening (on Today)') +
      self.tabs.map(function (t) { return row([t[0].toUpperCase()], t[2]); }).join('') +
      row(['Esc'], 'Close or go back') +
      row(['?'], 'Show or hide this list') +
      '</dl><p class="keys-help__foot">Shortcuts pause while you type in a box.</p>';
    document.body.appendChild(div);
  }
};
