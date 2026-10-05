// settings.js
// The Settings screen: export and import save files.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.settings = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var hasGame = !!app.state && !app.state.gameOver;

    root.innerHTML =
      (hasGame ? Game.ui.topbar.html(app.state, app.screen) : '') +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Settings</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        (hasGame ? '<div class="panel">' +
          '<h3 class="panel__title">Tutorial</h3>' +
          '<label class="switch"><input type="checkbox" id="tips-toggle"' + (app.state.settings.tutorial ? ' checked' : '') + '>' +
            ' Show tutorial tips on the first ' + Game.balance.tutorial.days + ' days</label>' +
        '</div>' : '') +
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
        '<div class="actions actions--left">' +
          '<button class="btn btn--ghost" data-action="title">Title screen</button>' +
        '</div>' +
      '</section>';

    var tips = root.querySelector('#tips-toggle');
    if (tips) tips.addEventListener('change', function () { app.setTutorial(tips.checked); });

    var fileInput = root.querySelector('#import-file');
    fileInput.addEventListener('change', function () { app.importFile(fileInput.files[0]); });

    h.bind(root, {
      export: function () { app.exportSave(); },
      import: function () { fileInput.click(); },
      back: function () { if (hasGame) app.goBack('settings'); else app.show('title'); },
      focusPayBack: function () { app.goBack('settings'); },
      title: function () { app.show('title'); }
    });
  }
};
