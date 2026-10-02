// debugPanel.js
// A small testing panel, only shown when the address ends in ?debug.
// Later phases can add more buttons here.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.debugPanel = {

  selectedSkill: 'musicianship', // the skill picked in the dropdown (just for this page visit, not saved)

  render: function (root, app) {
    var h = Game.ui.helpers;
    var d = Game.balance.debug;
    var showOn = ['today', 'weeklySummary', 'dayResults', 'songs'];

    if (!app.debug || !app.state || app.state.gameOver || showOn.indexOf(app.screen) === -1) {
      root.innerHTML = '';
      return;
    }

    // The skill dropdown remembers the last skill picked.
    var selectedSkill = Game.ui.debugPanel.selectedSkill;
    var skillOptions = Object.keys(Game.content.skills).map(function (id) {
      return '<option value="' + id + '"' + (id === selectedSkill ? ' selected' : '') + '>' + Game.content.skills[id] + '</option>';
    }).join('');

    root.innerHTML =
      '<div class="debug">' +
        '<div class="debug__title">Debug</div>' +
        '<div class="debug__row">' +
          '<button class="btn btn--small" data-action="cashUp">+' + h.money(d.cashStep) + '</button>' +
          '<button class="btn btn--small" data-action="cashDown">-' + h.money(d.cashStep) + '</button>' +
          '<button class="btn btn--small" data-action="skip">Skip ' + d.skipDays + ' days</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<label>Energy <input type="number" id="debug-energy" class="input input--tiny" value="' + app.state.player.energy + '"></label>' +
          '<button class="btn btn--small" data-action="setEnergy">Set</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<label>Morale <input type="number" id="debug-morale" class="input input--tiny" value="' + app.state.player.morale + '"></label>' +
          '<button class="btn btn--small" data-action="setMorale">Set</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<select id="debug-skill" class="input input--select">' + skillOptions + '</select>' +
          '<input type="number" id="debug-skill-value" class="input input--tiny" value="' + Math.floor(app.state.player.skills[selectedSkill]) + '">' +
          '<button class="btn btn--small" data-action="setSkill">Set</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<button class="btn btn--small" data-action="finishSong">Finish song now</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<label>Buzz <input type="number" id="debug-buzz" class="input input--tiny" value="' + Math.round(app.state.cities.hometown.buzz) + '"></label>' +
          '<button class="btn btn--small" data-action="setBuzz">Set</button>' +
        '</div>' +
      '</div>';

    var rules = Game.rules.debug;
    h.bind(root, {
      cashUp: function () { app.applyRule(rules.changeCash(app.state, d.cashStep)); },
      cashDown: function () { app.applyRule(rules.changeCash(app.state, -d.cashStep)); },
      skip: function () { app.afterDayChange(rules.skipDays(app.state, d.skipDays)); },
      setEnergy: function () { app.applyRule(rules.setEnergy(app.state, Number(root.querySelector('#debug-energy').value))); },
      setMorale: function () { app.applyRule(rules.setMorale(app.state, Number(root.querySelector('#debug-morale').value))); },
      setSkill: function () {
        var skill = root.querySelector('#debug-skill').value;
        Game.ui.debugPanel.selectedSkill = skill;
        app.applyRule(rules.setSkill(app.state, skill, Number(root.querySelector('#debug-skill-value').value)));
      },
      finishSong: function () { app.debugFinishSong(); },
      setBuzz: function () { app.applyRule(rules.setBuzz(app.state, Number(root.querySelector('#debug-buzz').value))); }
    });

    // When a different skill is picked, show its current value.
    var select = root.querySelector('#debug-skill');
    select.addEventListener('change', function () {
      Game.ui.debugPanel.selectedSkill = select.value;
      root.querySelector('#debug-skill-value').value = Math.floor(app.state.player.skills[select.value]);
    });
  }
};
