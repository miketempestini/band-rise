// actionPicker.js
// The list of actions that pops up when you click a free block on the Today screen.
// Each action shows its money cost, energy cost, and expected effect.
// Actions you can't afford (money or energy) are greyed out with the reason.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.actionPicker = {

  html: function (state, block) {
    var h = Game.ui.helpers;
    var picker = Game.ui.actionPicker;
    var planned = Game.rules.actions.plannedActionId(state, block);
    var blockName = Game.content.calendar.blockNames[block];

    var rows = Game.rules.actions.options(state, block).map(function (opt) {
      var a = opt.action;
      var isPlanned = planned === a.id;
      return '<button class="pick' + (isPlanned ? ' pick--current' : '') + '" data-action="pickAction" data-id="' + a.id + '"' +
        (opt.ok ? '' : ' disabled') + '>' +
        '<span class="pick__head">' +
          '<span class="pick__name">' + a.name + (isPlanned ? ' <span class="badge">Planned</span>' : '') + '</span>' +
          '<span class="pick__costs">' + picker.costText(a) + '</span>' +
        '</span>' +
        '<span class="pick__desc">' + a.description + '</span>' +
        '<span class="pick__effect">' + picker.effectText(opt) + '</span>' +
        (opt.reason ? '<span class="pick__reason">' + h.escape(opt.reason) + '</span>' : '') +
        (opt.burnedOutWarning ? '<span class="pick__reason">Burned out: no skill gain until morale is back above ' + Game.balance.morale.burnedOutRecovery + '.</span>' : '') +
        '</button>';
    }).join('');

    return '<div class="overlay" data-action="closePicker">' +
      '<div class="modal" role="dialog" aria-label="Choose an action">' +
        '<div class="modal__head">' +
          '<h2 class="modal__title">' + blockName + ': choose an action</h2>' +
          '<button class="btn btn--ghost btn--small" data-action="closePicker">Close</button>' +
        '</div>' +
        '<div class="picks">' + rows + '</div>' +
        '<div class="actions">' +
          '<button class="btn" data-action="pickFree">' + (planned ? 'Clear: leave as Free time' : 'Leave as Free time') +
            ' (+' + Game.balance.time.emptyBlockEnergy + ' energy)</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // "$15 · -10 energy", or "Free · +25 energy" for Rest.
  costText: function (action) {
    var money = action.moneyCost ? Game.ui.helpers.money(action.moneyCost) : 'Free';
    var energy = (action.effects.energy || 0) - action.energyCost;
    return money + ' · ' + Game.util.signed(energy) + ' energy';
  },

  // The expected effect, like "+2.5 Musicianship" or "+1.3 Millbrook buzz, +1.9 Promotion".
  effectText: function (opt) {
    var util = Game.util;
    var parts = [];
    if (opt.gains.buzz) parts.push(util.signed(opt.gains.buzz) + ' ' + Game.content.cities.hometown.name + ' buzz');
    Object.keys(opt.gains.skills).forEach(function (skill) {
      parts.push(util.signed(opt.gains.skills[skill]) + ' ' + Game.content.skills[skill]);
    });
    if (opt.gains.morale) parts.push(util.signed(opt.gains.morale) + ' morale');
    if (opt.gains.energy) parts.push(util.signed(opt.gains.energy) + ' energy');
    var text = parts.join(', ');
    if (opt.tired && Object.keys(opt.gains.skills).length) text += ' (Tired: half skill gain)';
    return text;
  },

  // Connects the picker's buttons. Clicking the dark background or pressing Escape closes it.
  bind: function (root, app) {
    var overlay = root.querySelector('.overlay');
    overlay.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (!target) return;
      var action = target.getAttribute('data-action');
      if (action === 'closePicker' && (target === overlay ? event.target === overlay : true)) app.closePicker();
      if (action === 'pickAction' && !target.disabled) app.planAction(target.getAttribute('data-id'));
      if (action === 'pickFree') app.planAction(null);
    });
    document.onkeydown = function (event) {
      if (event.key === 'Escape') app.closePicker();
    };
  }
};
