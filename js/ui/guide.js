// guide.js
// The Guide (Settings → Guide): Walt explains every mechanic in the game, one section at a time, with a contents
// list (on the left on a computer, at the top on a phone). Draw only: the open section lives on Game.app
// (guideSection), and the text is content (Game.content.handbook.sections).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.guide = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var sections = Game.content.handbook.sections();
    var index = 0;
    sections.forEach(function (s, i) { if (s.id === app.guideSection) index = i; });
    var section = sections[index];
    var prev = sections[index - 1];
    var next = sections[index + 1];
    var hasGame = !!app.state && !app.state.gameOver;

    var contents = sections.map(function (s, i) {
      return '<li><button class="guide-toc__item' + (i === index ? ' guide-toc__item--on' : '') + '" data-action="section" data-section="' + s.id + '"' +
        (i === index ? ' aria-current="true"' : '') + '>' + h.escape(s.title) + '</button></li>';
    }).join('');

    root.innerHTML =
      (hasGame ? Game.ui.topbar.html(app.state, 'settings') : '') + // the Guide lives under Settings, so that tab is lit
      '<section class="screen guide">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Guide</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        '<div class="guide__layout">' +
          '<nav class="guide-toc panel" aria-label="Guide contents">' +
            Game.ui.handbook.mentorHtml() +
            '<ol class="guide-toc__list">' + contents + '</ol>' +
            (hasGame ? '<button class="btn btn--small guide-toc__replay" data-action="handbook">Read the welcome handbook again</button>' : '') +
          '</nav>' +
          '<article class="guide-section paper" id="guide-section">' +
            '<h2 class="hb-page__title">' + h.escape(section.title) + '</h2>' +
            '<p class="hb-note">' + section.note + '</p>' +
            Game.ui.handbook.bodyHtml(section.body) +
            '<div class="guide-section__nav">' +
              (prev ? '<button class="btn" data-action="section" data-section="' + prev.id + '">← ' + h.escape(prev.title) + '</button>' : '<span></span>') +
              (next ? '<button class="btn" data-action="section" data-section="' + next.id + '">' + h.escape(next.title) + ' →</button>' : '') +
            '</div>' +
            '<button class="btn btn--ghost m-only guide-section__top" data-action="contents">Back to contents</button>' +
          '</article>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      section: function (e, el) { app.guideGo(el.getAttribute('data-section')); },
      contents: function () { var toc = root.querySelector('.guide-toc'); if (toc && toc.scrollIntoView) toc.scrollIntoView(); },
      handbook: function () { app.openHandbook('guide'); },
      back: function () { app.goBack('guide'); },
      focusPayBack: function () { app.goBack('guide'); }
    });
  }
};
