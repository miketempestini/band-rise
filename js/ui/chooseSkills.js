// chooseSkills.js
// The skills page at New career: spend 50 starting points across the five skills.
// Each skill can get 0 to 30 points, and all points must be spent before starting.
// The instrument's +3 bonus is added on top and shown on its skill.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.chooseSkills = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var b = Game.balance.skills;
    var career = Game.rules.career;
    var draft = app.draftCareer;
    var allocation = draft.allocation;
    var left = career.pointsLeft(allocation);
    var bonus = b.instrumentBonus[draft.instrument];
    var instrumentName = Game.content.instruments[draft.instrument].name;

    var rows = Object.keys(Game.content.skills).map(function (skill) {
      var value = allocation[skill];
      var extra = bonus.skill === skill ? bonus.amount : 0;
      var can = career.canAdjust(allocation, skill);
      var big = Game.balance.ui.skillBigStep;
      function stepButton(delta, enabled) {
        return '<button class="btn btn--small step" data-action="step" data-skill="' + skill + '" data-delta="' + delta + '"' +
          (enabled ? '' : ' disabled') + '>' + (delta > 0 ? '+' : '') + delta + '</button>';
      }
      return '<div class="alloc">' +
        '<div class="alloc__info">' +
          '<span class="alloc__name">' + Game.content.skills[skill] + '</span>' +
          '<span class="alloc__desc">' + Game.content.skillDescriptions[skill] + '</span>' +
        '</div>' +
        '<div class="alloc__controls">' +
          stepButton(-big, can.remove) + stepButton(-1, can.remove) +
          '<span class="alloc__value">' + value + '</span>' +
          stepButton(1, can.add) + stepButton(big, can.add) +
        '</div>' +
        '<div class="alloc__total">' +
          (extra ? '<span class="alloc__bonus">+' + extra + ' from ' + instrumentName + '</span>' : '') +
          '<span>Starts at <strong>' + (value + extra) + '</strong></span>' +
        '</div>' +
        '</div>';
    }).join('');

    root.innerHTML =
      '<section class="screen screen--narrow">' +
        '<h1 class="screen__title">Choose your skills</h1>' +
        '<div class="panel">' +
          '<div class="alloc-head">' +
            '<div>' +
              '<div class="alloc-head__left' + (left === 0 ? ' alloc-head__left--done' : '') + '">' +
                'Points left: <strong>' + left + '</strong> / ' + b.startingPoints + '</div>' +
              '<p class="hint">Each skill can have ' + b.startingMinPerSkill + ' to ' + b.startingMaxPerSkill +
                ' points. Spend them all to start. Skills grow faster while they\'re low.</p>' +
            '</div>' +
            '<div class="alloc-head__helpers">' +
              '<button class="btn btn--small" data-action="suggested">Suggested build</button>' +
              '<button class="btn btn--small" data-action="randomize">Randomize</button>' +
              '<button class="btn btn--small" data-action="reset">Reset</button>' +
            '</div>' +
          '</div>' +
          rows +
          '<div class="actions">' +
            '<button class="btn btn--ghost" data-action="back">Back</button>' +
            '<button class="btn btn--primary" data-action="start"' + (left === 0 ? '' : ' disabled') + '>' +
              (left === 0 ? 'Start career' : 'Spend ' + left + ' more point' + (left === 1 ? '' : 's')) +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      step: function (event, el) {
        app.setAllocation(career.adjustAllocation(allocation, el.getAttribute('data-skill'), Number(el.getAttribute('data-delta'))));
      },
      suggested: function () { app.setAllocation(career.suggestedAllocation()); },
      randomize: function () { app.setAllocation(career.randomAllocation(Game.rng.newSeed())); },
      reset: function () { app.setAllocation(career.emptyAllocation()); },
      back: function () { app.show('newCareer'); },
      start: function () { app.newCareer(); }
    });
  }
};
