// newCareer.js
// The New career screen: enter a name and pick a starting instrument.
// "Next" moves on to the skills page (chooseSkills.js) to spend starting points.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.newCareer = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var bonuses = Game.balance.skills.instrumentBonus;
    var draft = app.draftCareer || {}; // keeps your choices if you come back from the skills page
    var chosen = draft.instrument || Object.keys(Game.content.instruments)[0];

    // One card per instrument, showing its skill bonus.
    var cards = Object.keys(Game.content.instruments).map(function (id) {
      var inst = Game.content.instruments[id];
      var bonus = bonuses[id];
      return '<label class="choice">' +
        '<input type="radio" name="instrument" value="' + id + '"' + (id === chosen ? ' checked' : '') + '>' +
        '<span class="choice__body">' +
          '<span class="choice__title">' + inst.name + '</span>' +
          '<span class="choice__bonus">+' + bonus.amount + ' ' + Game.content.skills[bonus.skill] + '</span>' +
          '<span class="choice__blurb">' + inst.blurb + ' Also sings.</span>' +
        '</span>' +
      '</label>';
    }).join('');

    root.innerHTML =
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">New career</h1>' +
        '<div class="panel">' +
          '<label class="field">' +
            '<span class="field__label">Your name</span>' +
            '<input type="text" id="career-name" class="input" maxlength="' + Game.balance.ui.playerNameMaxLength + '" placeholder="Type a name" autocomplete="off" value="' + h.escape(draft.name || '') + '">' +
          '</label>' +
          '<div class="field">' +
            '<span class="field__label">Starting instrument</span>' +
            '<div class="choices">' + cards + '</div>' +
          '</div>' +
          '<p class="hint">Next, you\'ll spend ' + Game.balance.skills.startingPoints + ' points on your skills. ' +
            'You start on a Monday with ' + h.money(Game.balance.economy.startCash) +
            ', a full-time day job, and rent due every Sunday.</p>' +
          '<p class="form-error" id="career-error"></p>' +
          '<div class="actions">' +
            '<button class="btn btn--ghost" data-action="back">Back</button>' +
            '<button class="btn btn--primary" data-action="next">Next: choose skills</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    var nameInput = root.querySelector('#career-name');
    nameInput.focus();

    function next() {
      var name = nameInput.value.trim();
      if (!name) {
        root.querySelector('#career-error').textContent = 'Please enter a name.';
        nameInput.focus();
        return;
      }
      var instrument = root.querySelector('input[name="instrument"]:checked').value;
      app.chooseSkills(name, instrument);
    }

    // Pressing Enter in the name box also moves on.
    nameInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') next();
    });

    h.bind(root, {
      back: function () { app.draftCareer = null; app.show('title'); },
      next: next
    });
  }
};
