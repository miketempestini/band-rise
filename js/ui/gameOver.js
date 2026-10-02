// gameOver.js
// The game over screen.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.gameOver = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;

    root.innerHTML =
      '<section class="title-screen">' +
        '<h1 class="screen__title screen__title--big">Game over</h1>' +
        '<div class="panel panel--gameover">' +
          '<p class="gameover__message">' + h.escape(state.gameOver.message) + '</p>' +
          '<dl class="rows">' +
            '<dt>Career ended</dt><dd>' + h.dateLabel(state.gameOver.day) + '</dd>' +
            '<dt>Owed to Mom and Dad</dt><dd>' + h.money(state.player.loanOwed) + '</dd>' +
          '</dl>' +
        '</div>' +
        '<div class="actions">' +
          '<button class="btn btn--primary btn--big" data-action="title">Back to title screen</button>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      title: function () { app.state = null; app.show('title'); }
    });
  }
};
