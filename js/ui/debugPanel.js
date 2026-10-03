// debugPanel.js
// A small testing panel, only shown when the address ends in ?debug.
// Later phases can add more buttons here.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.debugPanel = {

  selectedSkill: 'musicianship', // the skill picked in the dropdown (just for this page visit, not saved)
  selectedPerson: null,          // the person picked in the people dropdown
  collapsed: false,              // true when the panel is folded down to just its title

  render: function (root, app) {
    var h = Game.ui.helpers;
    var d = Game.balance.debug;
    var showOn = ['today', 'weeklySummary', 'dayResults', 'songs', 'people', 'booking', 'inbox', 'calendar', 'career', 'shop'];

    if (!app.debug || !app.state || app.state.gameOver || showOn.indexOf(app.screen) === -1) {
      root.innerHTML = '';
      return;
    }

    var forced = app.state.debug && app.state.debug.forceNextGig;

    // People you can set a relationship (or satisfaction) for.
    var known = Object.keys(app.state.people).filter(function (id) { return app.state.people[id].status !== 'former'; });
    if (known.indexOf(Game.ui.debugPanel.selectedPerson) === -1) Game.ui.debugPanel.selectedPerson = known[0] || null;
    var personNow = app.state.people[Game.ui.debugPanel.selectedPerson];
    var personOptions = known.map(function (id) {
      return '<option value="' + id + '"' + (id === Game.ui.debugPanel.selectedPerson ? ' selected' : '') + '>' + h.escape(app.state.people[id].name) + '</option>';
    }).join('');

    // The skill dropdown remembers the last skill picked.
    var selectedSkill = Game.ui.debugPanel.selectedSkill;
    var skillOptions = Object.keys(Game.content.skills).map(function (id) {
      return '<option value="' + id + '"' + (id === selectedSkill ? ' selected' : '') + '>' + Game.content.skills[id] + '</option>';
    }).join('');

    if (Game.ui.debugPanel.collapsed) {
      root.innerHTML = '<div class="debug"><button class="debug__title debug__toggle" data-action="toggleDebug">Debug ▸</button></div>';
      h.bind(root, { toggleDebug: function () { Game.ui.debugPanel.collapsed = false; app.render(); } });
      return;
    }

    root.innerHTML =
      '<div class="debug">' +
        '<button class="debug__title debug__toggle" data-action="toggleDebug">Debug ▾</button>' +
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
          '<button class="btn btn--small" data-action="recordNow">Record next session</button>' +
          '<button class="btn btn--small" data-action="streamNow">+1 week streaming</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<span>Next gig:</span>' +
          '<button class="btn btn--small' + (forced === 'rough' ? ' btn--primary' : '') + '" data-action="forceRough">Rough</button>' +
          '<button class="btn btn--small' + (forced === 'legendary' ? ' btn--primary' : '') + '" data-action="forceLegendary">Legendary</button>' +
          (forced ? '<button class="btn btn--small" data-action="forceClear">Normal</button>' : '') +
        '</div>' +
        '<div class="debug__row">' +
          '<button class="btn btn--small" data-action="addContact">Add random contact</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<label>Reputation <input type="number" id="debug-rep" class="input input--tiny" value="' + Math.floor(app.state.player.reputation) + '"></label>' +
          '<button class="btn btn--small" data-action="setReputation">Set</button>' +
        '</div>' +
        '<div class="debug__row">' +
          '<button class="btn btn--small' + (app.state.debug.acceptNextBooking ? ' btn--primary' : '') + '" data-action="acceptNext">Next reply: Yes' + (app.state.debug.acceptNextBooking ? ' ✓' : '') + '</button>' +
          '<button class="btn btn--small" data-action="replyNow">Replies now</button>' +
        '</div>' +
        (personOptions ? '<div class="debug__row">' +
          '<select id="debug-person" class="input input--select">' + personOptions + '</select>' +
          '<input type="number" id="debug-person-value" class="input input--tiny" value="' + (personNow ? Math.floor(personNow.relationship) : 0) + '">' +
          '<button class="btn btn--small" data-action="setRelationship">Rel</button>' +
          '<button class="btn btn--small" data-action="setSatisfaction">Sat</button>' +
        '</div>' : '') +
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
      toggleDebug: function () { Game.ui.debugPanel.collapsed = true; app.render(); },
      finishSong: function () { app.debugFinishSong(); },
      recordNow: function () { app.applyRule(rules.recordNextSession(app.state)); },
      streamNow: function () { app.applyRule(rules.streamingNow(app.state)); },
      addContact: function () { app.applyRule(rules.addContact(app.state)); },
      setReputation: function () { app.applyRule(rules.setReputation(app.state, root.querySelector('#debug-rep').value)); },
      acceptNext: function () { app.applyRule(rules.acceptNextBooking(app.state, !app.state.debug.acceptNextBooking)); },
      replyNow: function () { app.applyRule(rules.replyNow(app.state)); },
      setRelationship: function () {
        Game.ui.debugPanel.selectedPerson = root.querySelector('#debug-person').value;
        app.applyRule(rules.setRelationship(app.state, Game.ui.debugPanel.selectedPerson, root.querySelector('#debug-person-value').value));
      },
      setSatisfaction: function () {
        Game.ui.debugPanel.selectedPerson = root.querySelector('#debug-person').value;
        app.applyRule(rules.setSatisfaction(app.state, Game.ui.debugPanel.selectedPerson, root.querySelector('#debug-person-value').value));
      },
      forceRough: function () { app.applyRule(rules.forceNextGig(app.state, 'rough')); },
      forceLegendary: function () { app.applyRule(rules.forceNextGig(app.state, 'legendary')); },
      forceClear: function () { app.applyRule(rules.forceNextGig(app.state, null)); },
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
