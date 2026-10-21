// mobile.js
// The phone layout's own pieces. On a phone (a screen up to Game.files.phoneQuery wide), mobile.css hides the desktop
// top bar and tabs and shows these instead:
//   - a slim stat bar pinned at the top (cash, energy, morale, date); tap it to drop down the rest
//   - a bottom tab bar (Today, Calendar, Inbox, Book, More), where More opens a sheet with the other screens
// They're always drawn, but a desktop browser never shows them (styles.css hides .m-only), so the desktop look can't
// change. Also here: isPhone() for the few things that behave differently on a phone (sharing a save, the tap-to-explain
// bubble), and the share helper. Draw only: the open/closed flags live on Game.app (statsOpen, moreOpen).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.mobile = {

  // True when the phone layout is showing (the same rule mobile.css uses).
  isPhone: function () {
    return !!(window.matchMedia && window.matchMedia(Game.files.phoneQuery).matches);
  },

  // The screens on the bottom bar, and the ones in the More sheet. [screen, label]
  barTabs: [['today', 'Today'], ['calendar', 'Calendar'], ['inbox', 'Inbox'], ['booking', 'Book']],
  moreTabs: function (state) {
    var tabs = [['map', 'Map'], ['songs', 'Music'], ['people', 'People'], ['shop', 'Shop'], ['finances', 'Finances'], ['career', 'Career']];
    if (Game.rules.manager.hired(state)) tabs.push(['manager', 'Manager']);
    tabs.push(['settings', 'Settings']);
    return tabs;
  },

  // The slim stat bar (and, when open, the rest of the numbers under it).
  barHtml: function (state) {
    var h = Game.ui.helpers;
    var b = Game.balance;
    var p = state.player;
    var open = !!Game.app.statsOpen;
    var mini = function (label, value, max, kind) {
      var pct = Math.round(Math.max(0, Math.min(1, value / max)) * 100);
      return '<span class="mbar__meter' + (kind ? ' mbar__meter--' + kind : '') + '"><span class="mbar__label">' + label + '</span>' +
        '<span class="mbar__num">' + Math.round(value) + '</span>' +
        '<span class="mbar__track"><span class="mbar__fill" style="width:' + pct + '%"></span></span></span>';
    };
    var daysToRent = Game.rules.day.daysUntilBills(state);
    var more = open
      ? '<div class="mbar__more">' +
          '<div class="mbar__who"><strong>' + h.escape(p.name) + '</strong> on ' + Game.content.instruments[p.instrument].name.toLowerCase() +
            ' · <span class="mbar__fame">' + Game.rules.progress.fame(state).name + '</span></div>' +
          '<dl class="rows">' +
            '<dt>Reputation</dt><dd>' + Math.round(p.reputation) + '</dd>' +
            '<dt>Date</dt><dd>' + h.dateLabel(state.day) + ', ' + Game.rules.day.date(state.day).year + '</dd>' +
            '<dt>Rent</dt><dd' + (daysToRent === 0 ? ' class="neg"' : '') + '>' + (daysToRent === 0 ? 'Due tonight' : 'In ' + daysToRent + (daysToRent === 1 ? ' day' : ' days')) +
              ' (' + h.money(Game.rules.housing.weeklyBills(state)) + ')</dd>' +
            (p.loanOwed > 0 ? '<dt>Debt</dt><dd class="neg">' + h.money(p.loanOwed) + '</dd>' : '') +
          '</dl>' +
          (p.loanOwed > 0 ? '<button class="btn btn--small" data-action="focusPayBack">Pay back</button>' : '') +
        '</div>'
      : '';
    return '<header class="mbar m-only' + (open ? ' mbar--open' : '') + '">' +
      '<button class="mbar__row" data-mobile="stats" aria-expanded="' + open + '" aria-label="Show all your numbers">' +
        '<span class="mbar__cash">' + h.money(p.cash) + (p.loanOwed > 0 ? '<span class="mbar__debt"> debt ' + h.money(p.loanOwed) + '</span>' : '') + '</span>' +
        mini('Energy', p.energy, b.energy.max, Game.rules.energy.isTired(p.energy) ? 'warn' : '') +
        mini('Morale', p.morale, b.morale.max, p.burnedOut ? 'bad' : '') +
        '<span class="mbar__date">' + Game.rules.day.shortDate(state.day) + '</span>' +
        '<span class="mbar__chev" aria-hidden="true">' + (open ? '▲' : '▼') + '</span>' +
      '</button>' + more +
      '</header>';
  },

  // The bottom tab bar, and the More sheet when it's open. screen: the screen showing now.
  navHtml: function (state, screen) {
    var self = Game.ui.mobile;
    var unread = Game.rules.booking.unreadCount(state);
    var talk = Game.rules.people.needTalk(state).length;
    var more = self.moreTabs(state);
    var inMore = more.some(function (t) { return t[0] === screen; }) || self.barTabs.every(function (t) { return t[0] !== screen; });
    var button = function (tab) {
      var on = tab[0] === screen;
      var badge = tab[0] === 'inbox' && unread ? '<span class="mnav__badge">' + unread + '</span>' : '';
      return '<button class="mnav__tab' + (on ? ' mnav__tab--on' : '') + '" data-nav="' + tab[0] + '"' + (on ? ' aria-current="page"' : '') + '>' +
        tab[1] + badge + '</button>';
    };
    var sheet = Game.app.moreOpen
      ? '<div class="msheet" data-mobile="moreClose">' +
          '<div class="msheet__paper paper" role="dialog" aria-label="More screens">' +
            '<div class="msheet__head"><h2 class="msheet__title">More</h2>' +
              '<button class="btn btn--small" data-mobile="moreClose">Close</button></div>' +
            '<div class="msheet__grid">' + more.map(function (tab) {
              var on = tab[0] === screen;
              var badge = tab[0] === 'people' && talk ? '<span class="mnav__badge">!</span>' : '';
              return '<button class="msheet__item' + (on ? ' msheet__item--on' : '') + '" data-nav="' + tab[0] + '">' + tab[1] + badge + '</button>';
            }).join('') + '</div>' +
          '</div>' +
        '</div>'
      : '';
    return '<nav class="mnav m-only" aria-label="Screens">' + self.barTabs.map(button).join('') +
      '<button class="mnav__tab' + (inMore ? ' mnav__tab--on' : '') + '" data-mobile="more" aria-expanded="' + !!Game.app.moreOpen + '">More' +
        (talk ? '<span class="mnav__badge">!</span>' : '') + '</button>' +
      '</nav>' + sheet;
  },

  // Connects the slim bar and the More sheet (called after every screen draws, like the tabs).
  bind: function (root, app) {
    root.querySelectorAll('[data-mobile]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        var what = el.getAttribute('data-mobile');
        if (what === 'moreClose' && el.classList.contains('msheet') && ev.target !== el) return; // a tap inside the sheet
        if (what === 'stats') app.statsOpen = !app.statsOpen;
        if (what === 'more') app.moreOpen = !app.moreOpen;
        if (what === 'moreClose') app.moreOpen = false;
        app.render();
      });
    });
    Game.ui.mobile.noticeToast(root, app);
  },

  // ----- Messages you'd otherwise miss -----
  // A screen's message (like "Bought a ticket...") is drawn at the top of the screen, but on a phone you're often
  // scrolled far below it. When a new message shows up out of sight, a copy pops up just above the bottom bar for a
  // few seconds. The message itself stays where it is.
  noticeToast: function (root, app) {
    var self = Game.ui.mobile;
    var fresh = app.notice && app.notice !== self.lastNotice;
    self.lastNotice = app.notice; // the same message drawn again (say, after opening More) doesn't pop up twice
    if (!fresh || !self.isPhone()) return;
    var box = root.querySelector('.notice');
    var bar = root.querySelector('.mbar');
    var nav = root.querySelector('.mnav');
    if (!box) return;
    var r = box.getBoundingClientRect();
    var top = bar ? bar.getBoundingClientRect().bottom : 0;
    var bottom = nav ? nav.getBoundingClientRect().top : window.innerHeight;
    if (r.top >= top && r.bottom <= bottom) return; // you can already see it
    var old = document.querySelector('.m-toast');
    if (old) old.parentNode.removeChild(old);
    var toast = document.createElement('div');
    toast.className = 'm-toast paper m-toast--' + app.notice.kind;
    toast.setAttribute('role', 'status');
    toast.textContent = app.notice.text;
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, Game.balance.ui.noticeToastMs);
  },

  // ----- Tap to explain -----
  // On a phone there's no hovering, so the little hints that appear when you point at something (like why a button is
  // greyed out) would be lost. Tapping a greyed-out button, or anything that isn't a button but has a hint, shows its
  // hint in a small bubble instead. Installed once (Game.app.start).
  installHints: function () {
    var self = Game.ui.mobile;
    if (self.hintsInstalled || !document.addEventListener) return;
    self.hintsInstalled = true;
    document.addEventListener('touchend', function (ev) {
      if (!self.isPhone() || !ev.changedTouches || !ev.changedTouches.length) return;
      var touch = ev.changedTouches[0];
      var bubble = document.querySelector('.tip-bubble');
      if (bubble) bubble.parentNode.removeChild(bubble);
      var stack = document.elementsFromPoint ? document.elementsFromPoint(touch.clientX, touch.clientY) : [];
      var target = null;
      for (var i = 0; i < stack.length && !target; i++) {
        var el = stack[i].closest ? stack[i].closest('[title]') : null;
        if (!el) continue;
        var clickable = el.matches('button, a, select, input, [data-action], [data-nav]');
        if (el.disabled || !clickable) target = el;
        else break; // a normal button: it just does its job
      }
      if (!target) return;
      var tip = document.createElement('div');
      tip.className = 'tip-bubble';
      tip.setAttribute('role', 'status');
      tip.textContent = target.getAttribute('title');
      document.body.appendChild(tip);
      var x = Math.max(12, Math.min(window.innerWidth - tip.offsetWidth - 12, touch.clientX - tip.offsetWidth / 2));
      var y = touch.clientY - tip.offsetHeight - 16;
      tip.style.left = x + 'px';
      tip.style.top = (y < 8 ? touch.clientY + 24 : y) + 'px';
      setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, Game.balance.ui.tipBubbleMs);
    }, { passive: true });
  },

  // A canvas picture as a PNG file's contents (a Blob), made right away (sharing has to happen straight after a tap).
  canvasBlob: function (canvas) {
    var data = atob(canvas.toDataURL('image/png').split(',')[1]);
    var bytes = new Uint8Array(data.length);
    for (var i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i);
    return new Blob([bytes], { type: 'image/png' });
  },

  // ----- Sharing a file (a save or a picture) -----
  // On a phone, opens the share sheet (AirDrop, Files, Messages...) with the file. Returns true if the share sheet was
  // used; false means "not on a phone or the phone can't share files", so the caller downloads it instead.
  shareFile: function (blob, fileName, title) {
    var self = Game.ui.mobile;
    if (!self.isPhone() || !navigator.share || !navigator.canShare || typeof File === 'undefined') return false;
    var file = new File([blob], fileName, { type: blob.type });
    if (!navigator.canShare({ files: [file] })) return false;
    navigator.share({ files: [file], title: title }).catch(function () {}); // closing the share sheet isn't an error
    return true;
  }
};
