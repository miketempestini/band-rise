// title.js
// The title screen: Continue, New career, Import save, over a concert picture (assets/title-stage.jpg).
// The first time it's drawn after the page loads, a short intro plays (all in styles.css): the stage fades and
// zooms in, the title slams in, then the buttons rise. Clicking anywhere skips to the end.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.title = {

  render: function (root, app) {
    var h = Game.ui.helpers;

    // Peek at the saved game so the Continue button can say whose career it is.
    var saved = Game.save.readFromBrowser();
    var continueNote = '';
    if (saved.ok) {
      continueNote = h.escape(saved.state.player.name) + ' · ' + h.dateLabel(saved.state.day);
    } else if (!saved.empty) {
      continueNote = "Saved game can't be loaded";
    }

    // Play the intro only once per page load, so coming back here (or an import error redrawing it) doesn't replay it.
    var intro = !app.titleIntroPlayed;
    app.titleIntroPlayed = true;

    root.innerHTML =
      '<section class="title-screen title-screen--home' + (intro ? ' title-screen--intro' : '') + '">' +
        '<div class="title-screen__stage" aria-hidden="true"></div>' +
        '<div class="title-screen__glow" aria-hidden="true"></div>' +
        '<div class="title-screen__shade" aria-hidden="true"></div>' +
        '<div class="title-screen__content">' +
        '<h1 class="title-screen__name"><span>Band</span> <span>Rise</span></h1>' +
        '<p class="title-screen__tagline">From open mic to arena.</p>' +
        '<div class="title-screen__menu">' +
          '<button class="btn btn--primary btn--big" data-action="continue"' + (saved.ok ? '' : ' disabled') + '>' +
            'Continue' + (continueNote ? '<span class="btn__note">' + continueNote + '</span>' : '') +
          '</button>' +
          '<button class="btn btn--big" data-action="newCareer">New career</button>' +
          '<button class="btn btn--big" data-action="import">Import save</button>' +
          '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
        '</div>' +
        h.notice(app.notice || (!saved.ok && !saved.empty ? { kind: 'error', text: saved.message } : null)) +
        '</div>' +
      '</section>';

    // Clicking anywhere during the intro skips it: without the intro class, everything is already in its final place.
    // Once the last button has risen, the intro is over and clicks don't need to skip anything.
    var screen = root.querySelector('.title-screen');
    var skip = function () { screen.classList.remove('title-screen--intro'); };
    if (intro) {
      screen.addEventListener('click', skip);
      screen.addEventListener('animationend', function (e) {
        if (e.animationName === 'title-rise' && e.target.matches('.title-screen__menu > .btn:last-of-type')) {
          screen.removeEventListener('click', skip);
        }
      });
    }

    var fileInput = root.querySelector('#import-file');
    fileInput.addEventListener('change', function () { app.importFile(fileInput.files[0]); });

    h.bind(root, {
      continue: function () { app.continueGame(); },
      newCareer: function () { app.draftCareer = null; app.show('newCareer'); },
      import: function () { fileInput.click(); }
    });
  }
};
