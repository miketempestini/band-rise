// nameBand.js
// Shown when your first bandmate joins: "We're a band now." Name the band
// (a random name is suggested, with a button for another).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.nameBand = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var member = Game.rules.people.members(app.state)[0];

    root.innerHTML =
      '<section class="title-screen reveal">' +
        '<p class="reveal__kicker">' + h.escape(member ? member.name : 'Someone') + ' said yes!</p>' +
        '<h1 class="screen__title screen__title--big">We\'re a band now.</h1>' +
        '<p class="hint">Every song lost ' + (-Game.balance.people.newMemberTightnessDrop) +
          ' tightness while they learn it. Rehearse to tighten things back up.</p>' +
        '<div class="panel reveal__name">' +
          '<label class="field">' +
            '<span class="field__label">Name your band</span>' +
            '<span class="reveal__name-row">' +
              '<input type="text" id="band-name" class="input" maxlength="' + Game.balance.people.bandNameMaxLength + '" value="' + h.escape(app.bandNameDraft || '') + '" autocomplete="off">' +
              '<button class="btn" data-action="suggest">🎲 Another</button>' +
            '</span>' +
          '</label>' +
          '<p class="form-error">' + (app.revealError ? h.escape(app.revealError) : '') + '</p>' +
          '<div class="actions">' +
            '<button class="btn btn--primary btn--big" data-action="keep">Name the band</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    var input = root.querySelector('#band-name');
    input.focus();
    input.select();
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') app.saveBandName(input.value);
    });
    h.bind(root, {
      suggest: function () { app.suggestBandName(); },
      keep: function () { app.saveBandName(input.value); }
    });
  }
};
