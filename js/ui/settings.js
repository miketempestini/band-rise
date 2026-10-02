// settings.js
// The Settings screen: export and import save files.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.settings = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var hasGame = !!app.state && !app.state.gameOver;

    root.innerHTML =
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">Settings</h1>' +
        h.notice(app.notice) +
        '<div class="panel">' +
          '<h3 class="panel__title">Saves</h3>' +
          '<p class="hint">The game saves itself in this browser after every day. ' +
            'Export a save file to keep a backup or move to another computer.</p>' +
          '<div class="actions actions--left">' +
            '<button class="btn" data-action="export"' + (hasGame ? '' : ' disabled') + '>Export save</button>' +
            '<button class="btn" data-action="import">Import save</button>' +
            '<input type="file" id="import-file" accept=".json,application/json" hidden>' +
          '</div>' +
          '<p class="hint">Importing replaces the game you have now.</p>' +
        '</div>' +
        '<div class="actions">' +
          '<button class="btn btn--ghost" data-action="back">Back</button>' +
          '<button class="btn btn--ghost" data-action="title">Title screen</button>' +
        '</div>' +
      '</section>';

    var fileInput = root.querySelector('#import-file');
    fileInput.addEventListener('change', function () { app.importFile(fileInput.files[0]); });

    h.bind(root, {
      export: function () { app.exportSave(); },
      import: function () { fileInput.click(); },
      back: function () { if (hasGame) app.goBack('settings'); else app.show('title'); },
      title: function () { app.show('title'); }
    });
  }
};
