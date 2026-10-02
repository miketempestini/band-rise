// people.js
// The People screen: your band and your contacts, each with their stats, trait,
// and a relationship bar. Band members also show satisfaction and why it moved this week.
// Invite and Remove happen right here; Jam, Hang out, and Talk are planned in a block on Today.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.people = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var b = Game.balance;
    var state = app.state;
    var self = Game.ui.people;
    var members = Game.rules.people.members(state);
    var contacts = Game.rules.people.contacts(state)
      .sort(function (x, y) { return y.relationship - x.relationship; });

    var bandSection = members.length
      ? members.map(function (p) { return self.cardHtml(state, p, true); }).join('')
      : '<p class="hint">No bandmates yet. Build a relationship to ' + b.people.inviteMinRelationship +
        ' with a contact (Jam and Hang out from a free block), then Invite them here.</p>';

    var contactSection = contacts.length
      ? contacts.map(function (p) { return self.cardHtml(state, p, false); }).join('')
      : '<p class="hint">You haven\'t met anyone yet. Network (a ' +
        Math.round(Game.rules.people.meetChance(state.player.skills.networking) * 100) +
        '% chance right now) or play open mics (' + Math.round(b.people.openMicMeetChance * 100) + '%) to meet people.</p>';

    root.innerHTML =
      Game.ui.topbar.html(state) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">People</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="panel">' +
          '<h3 class="panel__title">' + (state.band.name ? h.escape(state.band.name) : 'Your band') +
            ' · ' + members.length + ' of ' + b.people.maxBandMembers + ' members besides you' +
            (members.length ? ' · band musicianship ' + Game.util.round1(Game.rules.people.bandMusicianship(state)) : '') + '</h3>' +
          '<div class="people-grid">' + bandSection + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Contacts · ' + contacts.length + ' of ' + b.people.maxContacts +
            ' (when full, the one you\'re least close to drops off)</h3>' +
          '<div class="people-grid">' + contactSection + '</div>' +
        '</div>' +
        '<p class="hint">Jam, Hang out, and Talk take a block: plan them from a free block on Today. ' +
          'Relationships fade ' + (-b.people.relationship.fadePerWeek) + ' a week if you don\'t spend time together.</p>' +
      '</section>';

    h.bind(root, {
      back: function () { app.closePeople(); },
      people: function () {},
      songs: function () { app.openSongs(); },
      settings: function () { app.show('settings'); },
      focusPayBack: function () { app.closePeople(); },
      invite: function (event, el) { app.invitePerson(el.getAttribute('data-person')); },
      remove: function (event, el) { app.removePerson(el.getAttribute('data-person')); }
    });
  },

  // One person's card.
  cardHtml: function (state, p, isMember) {
    var h = Game.ui.helpers;
    var trait = Game.content.traits[p.trait];
    var sb = Game.balance.satisfaction;
    var bar = function (label, value, kind) {
      return '<div class="person__bar"><span class="muted">' + label + '</span>' +
        '<span class="meter meter--' + kind + '"><span class="meter__fill" style="width:' + Math.round(value) + '%"></span></span>' +
        '<strong>' + Math.floor(value) + '</strong></div>';
    };

    var extra;
    if (isMember) {
      var reasons = p.satisfactionReasons.length ? p.satisfactionReasons : p.lastWeekReasons;
      var label = p.satisfactionReasons.length ? 'This week' : 'Last week';
      var warn = '';
      if (p.satisfaction < sb.quitThreshold) warn = '<p class="panel__warn">Will quit this Sunday unless things improve.</p>';
      else if (p.satisfaction < sb.talkThreshold) warn = '<p class="panel__warn">"We need to talk." Plan a Talk.</p>';
      extra = bar('Satisfaction', p.satisfaction, p.satisfaction < sb.talkThreshold ? 'bad' : 'good') +
        warn +
        (reasons.length
          ? '<ul class="reasons"><li class="muted">' + label + ':</li>' + reasons.map(function (r) {
              return '<li class="' + (r.amount < 0 ? 'neg' : 'pos') + '">' + Game.util.signed(r.amount) + ' ' + h.escape(r.text) + '</li>';
            }).join('') + '</ul>'
          : '<p class="hint">Satisfaction is checked every Sunday.</p>') +
        '<div class="actions actions--left"><button class="btn btn--small" data-action="remove" data-person="' + p.id + '">Remove from band</button></div>';
    } else {
      var problem = Game.rules.people.inviteProblem(state, p.id);
      extra = '<div class="actions actions--left">' +
        '<button class="btn btn--small' + (problem ? '' : ' btn--primary') + '" data-action="invite" data-person="' + p.id + '"' + (problem ? ' disabled' : '') + '>Invite to the band</button>' +
        '</div>' +
        (problem ? '<p class="pick__reason">' + h.escape(problem) + '</p>' : '');
    }

    return '<div class="person' + (isMember ? ' person--member' : '') + '">' +
      '<div class="person__head">' +
        '<span class="person__name">' + h.escape(p.name) + '</span>' +
        '<span class="tag tag--' + (isMember ? 'original' : 'cover') + '">' + Game.content.roles[p.role].name + '</span>' +
      '</div>' +
      '<div class="person__stats">' +
        '<span>Skill <strong>' + p.skill + '</strong></span>' +
        '<span>Reliability <strong>' + p.reliability + '</strong></span>' +
        '<span>Ambition <strong>' + p.ambition + '</strong></span>' +
      '</div>' +
      '<div class="person__trait" title="Clashes with: ' + trait.clashesWith + '"><strong>' + trait.name + '</strong> · ' +
        '<span class="pos">' + trait.upside + '</span> · <span class="neg">' + trait.downside + '</span></div>' +
      bar('Relationship', p.relationship, 'rel') +
      extra +
      '</div>';
  }
};
