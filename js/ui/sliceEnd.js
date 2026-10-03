// sliceEnd.js
// The one-time "Three weeks in" card after the week 3 wrap-up: your next paid show (or a nudge to book one),
// and where you landed next to Design.md's targets. Play continues after it.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.sliceEnd = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var report = Game.rules.progress.sliceReport(app.state);
    var show = report.nextPaidShow;

    var headline = show
      ? 'Your first real show is in ' + show.inDays + ' day' + (show.inDays === 1 ? '' : 's') + '.'
      : 'Time to book your first real show.';
    var sub = show
      ? show.venueName + ', ' + h.dateLabel(show.day) + '. Rehearse, promote, and rest up the day before.'
      : (app.state.player.reputation >= Game.balance.milestones.smallRoomsReputation
          ? 'Small rooms are open to you. Email a venue from Book: the reply comes in a few days.'
          : 'Keep playing open mics to reach reputation ' + Game.balance.milestones.smallRoomsReputation +
            '. Then small rooms open up, and you can book a paid show.');

    var rows = report.rows.map(function (r) {
      var value = r.id === 'cash' ? h.money(r.value) : Game.util.round1(r.value);
      var target = r.id === 'cash' ? h.money(r.min) + ' to ' + h.money(r.max) : (r.min === r.max ? r.min : r.min + ' to ' + r.max);
      return '<tr><td>' + r.label + '</td><td><strong>' + value + '</strong></td><td class="muted">' + target + '</td>' +
        '<td>' + (r.inRange ? '<span class="pos">✓</span>' : '<span class="muted">·</span>') + '</td></tr>';
    }).join('');

    root.innerHTML =
      '<section class="title-screen reveal">' +
        '<p class="reveal__kicker">Three weeks in</p>' +
        '<h1 class="screen__title screen__title--big slice__headline">' + h.escape(headline) + '</h1>' +
        '<p class="slice__sub">' + h.escape(sub) + '</p>' +
        '<div class="panel slice__panel">' +
          '<h3 class="panel__title">Where you landed</h3>' +
          '<table class="song-table"><thead><tr><th></th><th>You</th><th>A typical start</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '</div>' +
        '<div class="actions">' +
          (show ? '' : '<button class="btn btn--big" data-action="book">Go to Book</button>') +
          '<button class="btn btn--primary btn--big" data-action="continue">Keep playing</button>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      continue: function () { app.leaveSliceEnd('today'); },
      book: function () { app.leaveSliceEnd('booking'); }
    });
  }
};
