// setlistEditor.js
// The running-order editor shared by the Calendar's show card and the action picker's open-mic set step: the set as a
// numbered list you can drag (or move with the up and down buttons), a "Best order" button, the encore pick, and a live
// line showing what the order is worth (from Game.rules.setlist). Draw only: the screens keep the draft and call
// Game.app to change it.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.setlistEditor = {

  // The editor. songIds: the set in order; encoreSongId: the encore (or null); cityId: where the show is (for crowd
  // favorites); coversOnly: a cover night (the encore must be a cover too).
  html: function (state, songIds, encoreSongId, cityId, coversOnly) {
    var h = Game.ui.helpers;
    var sl = Game.rules.setlist;
    var rows = songIds.map(function (id, i) {
      var song = state.songs[id];
      if (!song) return '';
      return '<li class="set-row" draggable="true" data-index="' + i + '">' +
        '<span class="set-row__grip" aria-hidden="true">⋮⋮</span>' +
        '<span class="set-row__num">' + (i + 1) + '</span>' +
        '<span class="set-row__title">' + h.escape(song.title) + (sl.isFavorite(song) ? ' <span class="badge badge--good">Crowd favorite</span>' : '') + '</span>' +
        '<span class="set-row__strength muted">strength ' + Math.round(sl.strength(song)) + '</span>' +
        '<span class="set-row__moves">' +
          '<button class="btn btn--small btn--ghost" data-action="setMove" data-index="' + i + '" data-dir="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button>' +
          '<button class="btn btn--small btn--ghost" data-action="setMove" data-index="' + i + '" data-dir="1"' + (i === songIds.length - 1 ? ' disabled' : '') + ' aria-label="Move down">↓</button>' +
        '</span></li>';
    }).join('');
    var options = Game.rules.songs.playable(state).filter(function (song) {
      return songIds.indexOf(song.id) === -1 && (!coversOnly || song.isCover);
    }).map(function (song) {
      return '<option value="' + song.id + '"' + (song.id === encoreSongId ? ' selected' : '') + '>' + h.escape(song.title) +
        (sl.isFavorite(song) ? ' (crowd favorite)' : '') + '</option>';
    }).join('');
    var e = Game.balance.gigs.setlist.encore;
    return '<div class="set-editor">' +
      '<ol class="set-rows">' + (rows || '<li class="hint">Pick songs below.</li>') + '</ol>' +
      '<div class="set-editor__foot">' +
        '<button class="btn btn--small" data-action="setBest"' + (songIds.length < 2 ? ' disabled' : '') + '>Best order</button>' +
        '<span class="set-editor__value">' + Game.ui.setlistEditor.valueText(state, songIds, cityId) + '</span>' +
      '</div>' +
      '<label class="form-row set-editor__encore"><span class="muted">Encore:</span>' +
        '<select class="input set-encore"><option value="">No encore</option>' + options + '</select>' +
        '<span class="hint">Played after a Great or Legendary night: +' + Math.round(e.fans * 100) + '% new fans (+' + Math.round(e.favoriteFans * 100) +
          '% with a crowd favorite) and +' + e.buzz + ' buzz.</span></label>' +
      '</div>';
  },

  // "Set order: Opener +3 · Closer +3 · Crowd favorites +1 = +7" (only the parts that count).
  valueText: function (state, songIds, cityId) {
    var labels = Game.content.gigText.parts;
    var parts = Game.rules.setlist.parts(state, songIds, cityId).filter(function (p) { return p.value; });
    var total = parts.reduce(function (sum, p) { return sum + p.value; }, 0);
    if (!parts.length) return 'Set order: no bonus yet (open and close with strong songs).';
    return 'Set order: ' + parts.map(function (p) { return labels[p.id] + ' ' + Game.util.signed(p.value); }).join(' · ') +
      ' = <strong>' + Game.util.signed(total) + '</strong> on the gig score';
  },

  // Connects the editor inside root: moves (buttons and drag and drop), Best order, and the encore pick.
  // handlers: { move(from, to), best(), encore(songId or null) }.
  bind: function (root, handlers) {
    var editor = root.querySelector('.set-editor');
    if (!editor) return;
    editor.querySelectorAll('[data-action="setMove"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.getAttribute('data-index'));
        handlers.move(i, i + Number(btn.getAttribute('data-dir')));
      });
    });
    var best = editor.querySelector('[data-action="setBest"]');
    if (best) best.addEventListener('click', function () { handlers.best(); });
    var encore = editor.querySelector('.set-encore');
    if (encore) encore.addEventListener('change', function () { handlers.encore(encore.value || null); });
    Game.ui.setlistEditor.bindTouch(editor, handlers);
    // Drag and drop: drag a row onto another row to move it there.
    var from = null;
    editor.querySelectorAll('.set-row').forEach(function (row) {
      row.addEventListener('dragstart', function (ev) {
        from = Number(row.getAttribute('data-index'));
        row.classList.add('set-row--dragging');
        if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(from)); }
      });
      row.addEventListener('dragend', function () { row.classList.remove('set-row--dragging'); });
      row.addEventListener('dragover', function (ev) { ev.preventDefault(); row.classList.add('set-row--over'); });
      row.addEventListener('dragleave', function () { row.classList.remove('set-row--over'); });
      row.addEventListener('drop', function (ev) {
        ev.preventDefault();
        row.classList.remove('set-row--over');
        var to = Number(row.getAttribute('data-index'));
        if (from !== null && from !== to) handlers.move(from, to);
        from = null;
      });
    });
  },

  // Phones (no mouse dragging there): press and hold a song for a moment to pick it up, slide your finger up or down,
  // and let go to drop it. A quick swipe still scrolls the page. Only on the phone layout.
  bindTouch: function (editor, handlers) {
    if (!Game.ui.mobile.isPhone()) return;
    var rows = editor.querySelectorAll('.set-row');
    var held = null; // { row, from, timer, startY, lifted }
    var rowAt = function (y) {
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) return Number(rows[i].getAttribute('data-index'));
      }
      return null;
    };
    rows.forEach(function (row) {
      row.addEventListener('touchstart', function (ev) {
        if (ev.target.closest('button')) return; // the arrow buttons work as normal
        var y = ev.touches[0].clientY;
        held = { row: row, from: Number(row.getAttribute('data-index')), startY: y, lifted: false };
        held.timer = setTimeout(function () {
          if (!held) return;
          held.lifted = true;
          row.classList.add('set-row--lifted');
        }, Game.balance.ui.holdToDragMs);
      }, { passive: true });
      row.addEventListener('touchmove', function (ev) {
        if (!held) return;
        var y = ev.touches[0].clientY;
        if (!held.lifted) {
          // Moved before the hold finished: it's a scroll, not a drag.
          if (Math.abs(y - held.startY) > Game.balance.ui.holdSlopPx) { clearTimeout(held.timer); held = null; }
          return;
        }
        ev.preventDefault(); // while dragging, the page doesn't scroll
        held.row.style.transform = 'translateY(' + (y - held.startY) + 'px)';
      }, { passive: false });
      row.addEventListener('touchend', function (ev) {
        if (!held) return;
        clearTimeout(held.timer);
        var h = held;
        held = null;
        if (!h.lifted) return;
        h.row.classList.remove('set-row--lifted');
        h.row.style.transform = '';
        var to = rowAt(ev.changedTouches[0].clientY);
        if (to !== null && to !== h.from) handlers.move(h.from, to);
      });
      row.addEventListener('touchcancel', function () {
        if (held) { clearTimeout(held.timer); held.row.classList.remove('set-row--lifted'); held.row.style.transform = ''; held = null; }
      });
    });
  }
};
