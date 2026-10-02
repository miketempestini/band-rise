// actionPicker.js
// The list of actions that pops up when you click a free block on the Today screen.
// Each action shows its money cost, energy cost, and expected effect.
// Actions you can't afford (money or energy) are greyed out with the reason.
// Actions that need a song (Practice) open a second step to pick the song.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.actionPicker = {

  // block: which block is being planned. songStepFor: an action id when picking its song, else null.
  html: function (state, block, songStepFor) {
    var blockName = Game.content.calendar.blockNames[block];
    var body = songStepFor
      ? Game.ui.actionPicker.songStepHtml(state, block, songStepFor)
      : Game.ui.actionPicker.actionListHtml(state, block);
    var title = songStepFor
      ? blockName + ': which song will you ' + Game.content.actions[songStepFor].name.toLowerCase() + '?'
      : blockName + ': choose an action';

    return '<div class="overlay" data-action="closePicker">' +
      '<div class="modal" role="dialog" aria-label="' + title + '">' +
        '<div class="modal__head">' +
          '<h2 class="modal__title">' + title + '</h2>' +
          '<button class="btn btn--ghost btn--small" data-action="closePicker">Close</button>' +
        '</div>' +
        body +
      '</div>' +
    '</div>';
  },

  // Step 1: every action, with costs, expected effect, and why it's greyed out (if it is).
  actionListHtml: function (state, block) {
    var h = Game.ui.helpers;
    var picker = Game.ui.actionPicker;
    var planned = Game.rules.actions.plannedActionId(state, block);

    var rows = Game.rules.actions.options(state, block).map(function (opt) {
      var a = opt.action;
      var isPlanned = planned === a.id;
      return '<button class="pick' + (isPlanned ? ' pick--current' : '') + '" data-action="pickAction" data-id="' + a.id + '"' +
        (opt.ok ? '' : ' disabled') + '>' +
        '<span class="pick__head">' +
          '<span class="pick__name">' + a.name + (isPlanned ? ' <span class="badge">Planned</span>' : '') +
            (a.needsSong ? ' <span class="pick__more">pick a song →</span>' : '') + '</span>' +
          '<span class="pick__costs">' + picker.costText(a) + '</span>' +
        '</span>' +
        '<span class="pick__desc">' + a.description + '</span>' +
        '<span class="pick__effect">' + h.escape(picker.effectText(opt)) + '</span>' +
        (opt.reason ? '<span class="pick__reason">' + h.escape(opt.reason) + '</span>' : '') +
        (opt.burnedOutWarning ? '<span class="pick__reason">Burned out: no skill gain until morale is back above ' + Game.balance.morale.burnedOutRecovery + '.</span>' : '') +
        '</button>';
    }).join('');

    return '<div class="picks">' + rows + '</div>' +
      '<div class="actions">' +
        '<button class="btn" data-action="pickFree">' + (planned ? 'Clear: leave as Free time' : 'Leave as Free time') +
          ' (+' + Game.balance.time.emptyBlockEnergy + ' energy)</button>' +
      '</div>';
  },

  // Step 2 (Practice): pick a finished song. Shows tightness and days since last played.
  // The loosest song is marked as suggested.
  songStepHtml: function (state, block, actionId) {
    var h = Game.ui.helpers;
    var gain = Game.content.actions[actionId].effects.tightness;
    var entry = Game.rules.actions.plannedEntry(state, block);
    var current = entry && entry.actionId === actionId ? entry.songId : null;
    var loosest = Game.rules.songs.loosest(state);
    var songsList = Game.rules.songs.playable(state);
    // Only call out the loosest song when the songs aren't all equally tight.
    var allTied = songsList.every(function (s) { return s.tightness === songsList[0].tightness; });
    if (allTied) loosest = null;

    var rows = Game.rules.songs.playable(state).map(function (song) {
      var days = Game.rules.songs.daysSincePlayed(state, song);
      var after = Math.min(Game.balance.songs.tightness.max, song.tightness + gain);
      var tag = song.id === current ? ' <span class="badge">Planned</span>'
        : (loosest && song.id === loosest.id ? ' <span class="badge badge--warn">Loosest</span>' : '');
      return '<button class="pick pick--song' + (song.id === current ? ' pick--current' : '') + '" data-action="pickSong" data-song="' + song.id + '">' +
        '<span class="pick__head">' +
          '<span class="pick__name">' + h.escape(song.title) + tag + '</span>' +
          '<span class="pick__costs">' + (song.isCover ? 'Cover' : 'Original') + ' · ' + h.stars(song.quality) + '</span>' +
        '</span>' +
        '<span class="pick__song-stats">' +
          '<span class="meter meter--tight"><span class="meter__fill" style="width:' + Math.round(song.tightness) + '%"></span></span>' +
          '<span>Tightness ' + Math.round(song.tightness) + ' → <strong>' + Math.round(after) + '</strong></span>' +
          '<span class="muted">' + h.daysAgo(days) + '</span>' +
        '</span>' +
        '</button>';
    }).join('');

    return '<div class="picks">' + rows + '</div>' +
      '<div class="actions">' +
        '<button class="btn btn--ghost" data-action="pickerBack">← Back to actions</button>' +
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
    var g = opt.gains;
    if (g.songProgress) {
      var p = g.songProgress;
      parts.push(p.finishes
        ? 'Finishes ' + (p.isNew ? 'a new song' : '"' + p.title + '"') + '!'
        : util.signed(p.added) + ' progress on ' + (p.isNew ? 'a new song' : '"' + p.title + '"') +
          ' (' + Math.round(p.from) + ' → ' + Math.round(p.to) + ')');
    }
    if (g.tightness) parts.push('+' + g.tightness + ' tightness on a song you pick');
    if (g.buzz) parts.push(util.signed(g.buzz) + ' ' + Game.content.cities.hometown.name + ' buzz');
    Object.keys(g.skills).forEach(function (skill) {
      parts.push(util.signed(g.skills[skill]) + ' ' + Game.content.skills[skill]);
    });
    if (g.morale) parts.push(util.signed(g.morale) + ' morale');
    if (g.energy) parts.push(util.signed(g.energy) + ' energy');
    var text = parts.join(', ');
    if (opt.tired && Object.keys(g.skills).length) text += ' (Tired: half skill gain)';
    return text;
  },

  // Connects the picker's buttons. Clicking the dark background or pressing Escape closes it.
  bind: function (root, app) {
    var overlay = root.querySelector('.overlay');
    overlay.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (!target || target.disabled) return;
      var action = target.getAttribute('data-action');
      if (action === 'closePicker' && (target !== overlay || event.target === overlay)) app.closePicker();
      if (action === 'pickAction') app.pickAction(target.getAttribute('data-id'));
      if (action === 'pickSong') app.planAction(app.pickerSongStep, target.getAttribute('data-song'));
      if (action === 'pickerBack') app.pickerShowActions();
      if (action === 'pickFree') app.planAction(null);
    });
    document.onkeydown = function (event) {
      if (event.key === 'Escape') app.closePicker();
    };
  }
};
