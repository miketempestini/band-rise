// handbook.js
// The welcome handbook: Walt's short pages shown before the first day of every new career (and again from
// Settings → Guide). One page at a time, with Back / Next, page dots, and a way to skip. Draw only: the page number
// lives on Game.app (handbookPage), and the text is content (Game.content.handbook).
// Also holds bodyHtml, which draws a page's paragraphs, tables, lists, and tips (the Guide screen uses it too).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.handbook = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var content = Game.content.handbook;
    var pages = content.pages(app.state);
    var index = Math.max(0, Math.min(pages.length - 1, app.handbookPage || 0));
    var page = pages[index];
    var last = index === pages.length - 1;
    var replay = app.handbookReturn && app.handbookReturn !== 'today';
    var dots = pages.map(function (p, i) {
      return '<span class="hb-dots__dot' + (i === index ? ' hb-dots__dot--on' : '') + '"></span>';
    }).join('');

    root.innerHTML =
      '<div class="backdrop backdrop--openmic" aria-hidden="true"></div>' +
      '<section class="screen screen--narrow handbook">' +
        '<div class="hb-top">' +
          Game.ui.handbook.mentorHtml() +
          '<button class="btn btn--ghost btn--small" data-action="skip">' + (replay ? 'Close the handbook' : 'Skip the handbook') + '</button>' +
        '</div>' +
        '<article class="hb-page paper paper--taped" aria-live="polite">' +
          '<div class="hb-page__count">Page ' + (index + 1) + ' of ' + pages.length + '</div>' +
          '<h1 class="hb-page__title">' + h.escape(page.title) + '</h1>' +
          '<p class="hb-note">' + page.note + '</p>' +
          Game.ui.handbook.bodyHtml(page.body) +
        '</article>' +
        '<div class="hb-nav">' +
          '<button class="btn" data-action="prev"' + (index === 0 ? ' disabled' : '') + '>Back</button>' +
          '<div class="hb-dots" aria-hidden="true">' + dots + '</div>' +
          '<button class="btn btn--primary" data-action="next">' +
            (last ? (replay ? 'Done' : 'Start my first day') : 'Next') + '</button>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      prev: function () { app.handbookGo(index - 1); },
      next: function () { if (last) app.closeHandbook(); else app.handbookGo(index + 1); },
      skip: function () { app.closeHandbook(); }
    });
  },

  // Walt's portrait, name, and one line about him.
  mentorHtml: function () {
    var m = Game.content.handbook.mentor;
    return '<div class="hb-mentor">' +
      '<img class="hb-mentor__face" src="' + Game.content.art.portraitSrc(m.portrait) + '" alt="">' +
      '<div><div class="hb-mentor__name">' + Game.ui.helpers.escape(m.name) + '</div>' +
      '<div class="hb-mentor__about">' + Game.ui.helpers.escape(m.about) + '</div></div>' +
      '</div>';
  },

  // A page's (or Guide section's) pieces, in order: paragraphs, tables, lists, and tips.
  // The text is written in content/handbook.js (not typed by the player), so it may hold <strong>.
  bodyHtml: function (body) {
    return body.map(function (piece) {
      if (typeof piece === 'string') return '<p>' + piece + '</p>';
      if (piece.table) {
        // Wider tables stack into cards on a phone (hb-table--stack); two columns fit side by side.
        return '<div class="hb-table-wrap"><table class="hb-table' + (piece.table.cols.length > 2 ? ' hb-table--stack' : '') + '">' +
          '<thead><tr>' + piece.table.cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead>' +
          '<tbody>' + piece.table.rows.map(function (row) {
            return '<tr>' + row.map(function (cell, i) {
              return '<td data-label="' + Game.ui.helpers.escape(piece.table.cols[i]) + '">' + cell + '</td>';
            }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
      }
      if (piece.list) return '<ul class="hb-list">' + piece.list.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>';
      if (piece.tip) {
        var first = Game.content.handbook.mentor.name.split(' ')[0];
        return '<div class="hb-tip"><span class="hb-tip__from">' + Game.ui.helpers.escape(first) + '\'s tip</span> ' + piece.tip + '</div>';
      }
      return '';
    }).join('');
  }
};
