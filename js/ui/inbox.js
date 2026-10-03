// inbox.js
// The Inbox screen: replies from venues. A "yes" is an offer with Accept or Decline and an answer-by date.
// If the show lands on your day job, Accept asks how you'll take the day off.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.inbox = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.inbox;
    var messages = state.inbox.slice().reverse(); // newest first
    var open = messages.filter(function (m) { return !m.resolved && m.data.yes; });
    var rest = messages.filter(function (m) { return !(!m.resolved && m.data.yes); });

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Inbox</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        (messages.length ? '' : '<p class="hint">No messages yet. Email a venue from Book; their reply lands here in 1 to 3 days.</p>') +
        (open.length ? '<div class="panel"><h3 class="panel__title">Offers waiting for you</h3>' + open.map(function (m) { return self.messageHtml(state, m); }).join('') + '</div>' : '') +
        (rest.length ? '<div class="panel"><h3 class="panel__title">Earlier</h3>' + rest.map(function (m) { return self.messageHtml(state, m); }).join('') + '</div>' : '') +
      '</section>';

    h.bind(root, {
      back: function () { app.goBack('inbox'); },
      focusPayBack: function () { app.goBack('inbox'); },
      accept: function (e, el) { app.acceptOffer(el.getAttribute('data-id'), el.getAttribute('data-job') || null); },
      decline: function (e, el) { app.declineOffer(el.getAttribute('data-id')); }
    });
  },

  messageHtml: function (state, m) {
    var h = Game.ui.helpers;
    var d = m.data;
    if (m.kind === 'event') {
      // A record of a morning event and how you answered it.
      return '<div class="message">' +
        '<div class="message__head"><strong>⚡ ' + h.escape(d.title) + '</strong>' +
          '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
        '<p>' + h.escape(d.text) + '</p>' +
        '<div class="message__foot"><span class="badge">' + h.escape(d.answer ? 'You chose: ' + d.answer : 'Waiting on Today') + '</span></div>' +
        '</div>';
    }
    var venue = Game.content.venues[d.venueId];
    var when = h.dateLabel(d.gigDay) + ' (' + Game.content.calendar.blockNames[venue.showBlock].toLowerCase() + ')';
    var head = d.yes
      ? '<strong class="pos">✓ ' + h.escape(venue.name) + ' said yes!</strong>'
      : '<strong class="neg">✗ ' + h.escape(venue.name) + ' said no.</strong>';
    var body = d.yes
      ? 'Show on ' + when + '. Deal: ' + h.escape(Game.rules.booking.dealLabel(venue, d.deal)) + '.'
      : 'They passed on ' + when + ' (you had a ' + Math.round(d.chance * 100) + '% chance). Try another venue, or ask again with more reputation.';

    var buttons = '';
    var status = '';
    if (m.resolved) {
      status = '<span class="badge">' + { accepted: 'Accepted', declined: 'Declined', expired: 'Expired' }[m.resolved] + '</span>';
    } else if (d.yes) {
      var clash = Game.rules.booking.clashesWithJob(state, d.gigDay, venue.showBlock);
      if (clash) {
        var choices = [['vacation', 'Accept, use a vacation day'], ['sick', 'Accept, call in sick that day (' + Game.balance.job.sickDayPenalty + ' standing)'],
          ['skip', 'Accept, skip work (' + Game.balance.job.skipPenalty + ' standing)']];
        buttons = '<p class="hint">This show is during your day job (' + h.dateLabel(d.gigDay) + '). How will you take the day off?</p>' +
          choices.map(function (c) {
            var problem = Game.rules.booking.acceptProblem(state, m.id, c[0]);
            return '<button class="btn btn--small' + (problem ? '' : ' btn--primary') + '" data-action="accept" data-id="' + m.id + '" data-job="' + c[0] + '"' +
              (problem ? ' disabled title="' + h.escape(problem) + '"' : '') + '>' + c[1] + '</button>';
          }).join(' ');
      } else {
        var problem = Game.rules.booking.acceptProblem(state, m.id, null);
        buttons = '<button class="btn btn--small btn--primary" data-action="accept" data-id="' + m.id + '"' + (problem ? ' disabled' : '') + '>Accept</button>' +
          (problem ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '');
      }
      buttons += ' <button class="btn btn--small" data-action="decline" data-id="' + m.id + '">Decline</button>';
      status = '<span class="muted">Answer by ' + h.dateLabel(m.expiresDay) + '</span>';
    }

    return '<div class="message' + (m.read ? '' : ' message--new') + '">' +
      '<div class="message__head">' + head + (m.read ? '' : ' <span class="badge badge--warn">New</span>') +
        '<span class="message__date muted">' + h.dateLabel(m.day) + '</span></div>' +
      '<p>' + body + '</p>' +
      (buttons || status ? '<div class="message__foot">' + buttons + ' ' + status + '</div>' : '') +
      '</div>';
  }
};
