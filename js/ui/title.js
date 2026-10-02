// title.js
// The title screen: Continue, New career, Import save.

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

    root.innerHTML =
      '<section class="title-screen">' +
        '<h1 class="title-screen__name">Band Rise</h1>' +
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
      '</section>';

    var fileInput = root.querySelector('#import-file');
    fileInput.addEventListener('change', function () { app.importFile(fileInput.files[0]); });

    h.bind(root, {
      continue: function () { app.continueGame(); },
      newCareer: function () { app.draftCareer = null; app.show('newCareer'); },
      import: function () { fileInput.click(); }
    });
  }
};
