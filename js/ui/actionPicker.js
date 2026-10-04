// actionPicker.js
// The list of actions that pops up when you click a free block on the Today screen.
// Each action shows its money cost, energy cost, and expected effect.
// Actions you can't afford (money or energy) are greyed out with the reason.
// Actions that need a song (Practice) open a second step to pick the song.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.actionPicker = {

  // block: which block is being planned. songStepFor: an action id when picking its song(s), else null.
  // pickedSet: the songs ticked so far when picking a set (open mic).
  // state may be a view of a later day (from the Calendar); then the title shows that day's date.
  html: function (state, block, songStepFor, pickedSet, sortBy, filter) {
    var blockName = (state.planningAhead ? Game.rules.day.dateLabel(state.day) + ' · ' : '') + Game.content.calendar.blockNames[block];
    var stepAction = songStepFor && Game.content.actions[songStepFor];
    var body, title;
    if (stepAction && stepAction.setSize) {
      body = Game.ui.actionPicker.setStepHtml(state, stepAction, pickedSet || []);
      title = blockName + ': pick ' + stepAction.setSize + ' songs for the open mic';
    } else if (stepAction && stepAction.songsMax) {
      body = Game.ui.actionPicker.setStepHtml(state, stepAction, pickedSet || []);
      title = blockName + ': pick up to ' + stepAction.songsMax + ' songs to rehearse';
    } else if (stepAction && (stepAction.needsPerson || stepAction.optionalCoWriter)) {
      body = Game.ui.actionPicker.personStepHtml(state, block, songStepFor);
      title = stepAction.optionalCoWriter ? blockName + ': write alone or with a bandmate?' : blockName + ': who will you ' + stepAction.name.toLowerCase() + ' with?';
    } else if (stepAction) {
      body = Game.ui.actionPicker.songStepHtml(state, block, songStepFor, sortBy, filter);
      title = blockName + ': which song will you ' + stepAction.name.toLowerCase() + '?';
    } else {
      body = Game.ui.actionPicker.actionListHtml(state, block);
      title = blockName + ': choose an action';
    }

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
            (a.needsSong ? ' <span class="pick__more">pick a song →</span>' : '') +
            (a.setSize ? ' <span class="pick__more">pick ' + a.setSize + ' songs →</span>' : '') +
            (a.songsMax ? ' <span class="pick__more">pick songs →</span>' : '') +
            (a.needsPerson ? ' <span class="pick__more">pick someone →</span>' : '') +
            (a.needsBooking ? ' <span class="pick__more">opens Book →</span>' : '') + '</span>' +
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
  songStepHtml: function (state, block, actionId, sortBy, filter) {
    var h = Game.ui.helpers;
    var action = Game.content.actions[actionId];
    var gain = action.effects.tightness;
    var entry = Game.rules.actions.plannedEntry(state, block);
    var current = entry && entry.actionId === actionId ? entry.songId : null;
    var loosest = Game.rules.songs.loosest(state);
    var songsList = Game.rules.actions.songsFor(state, actionId);
    // Only call out the loosest song when the songs aren't all equally tight.
    var allTied = songsList.every(function (s) { return s.tightness === songsList[0].tightness; });
    if (allTied) loosest = null;

    var shown = Game.rules.songs.filterSongs(songsList, filter);
    var sorted = Game.rules.songs.sortSongs(state, shown, sortBy);
    var rows = sorted.length ? sorted.map(function (song) {
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
    }).join('') : '<p class="hint">No ' + (filter === 'originals' ? 'finished originals' : 'covers') + ' yet.</p>';

    // "Practice all songs" sits on top: a small gain on every song, and none of them fade.
    var allRow = action.allSongsGain
      ? '<button class="pick pick--all' + (current === 'all' ? ' pick--current' : '') + '" data-action="pickSong" data-song="all">' +
          '<span class="pick__head"><span class="pick__name">Practice all songs' +
            (current === 'all' ? ' <span class="badge">Planned</span>' : '') + '</span>' +
            '<span class="pick__costs">' + songsList.length + ' songs</span></span>' +
          '<span class="pick__desc">+' + action.allSongsGain + ' tightness on every song, and resets their fading clock so none of them lose tightness.</span>' +
        '</button>'
      : '';

    var sorts = [['tightLow', 'Tightness ↑'], ['tightHigh', 'Tightness ↓'], ['name', 'Name A–Z'], ['lastPlayed', 'Last played']];
    var sortBar = '<div class="sort-bar"><span class="muted">Sort:</span>' + sorts.map(function (opt) {
      return '<button class="btn btn--small' + (opt[0] === sortBy ? ' btn--primary' : '') + '" data-action="sortSongs" data-sort="' + opt[0] + '">' + opt[1] + '</button>';
    }).join('') + '</div>';

    var filters = [['all', 'All'], ['covers', 'Covers'], ['originals', 'Originals']];
    var filterBar = '<div class="sort-bar"><span class="muted">Show:</span>' + filters.map(function (opt) {
      return '<button class="btn btn--small' + (opt[0] === filter ? ' btn--primary' : '') + '" data-action="filterSongs" data-filter="' + opt[0] + '">' + opt[1] + '</button>';
    }).join('') + '</div>';

    return '<div class="picks">' + allRow + '</div>' +
      '<div class="list-controls">' + filterBar + sortBar + '</div>' +
      '<div class="picks">' + rows + '</div>' +
      '<div class="actions">' +
        '<button class="btn btn--ghost" data-action="pickerBack">← Back to actions</button>' +
      '</div>';
  },

  // Set step (open mic): every finished song with its tightness, quality, and last played.
  // Click songs to tick them (ticking one more than the set holds swaps out your earliest pick);
  // the confirm button works once exactly the right number are ticked.
  // Rehearse uses the same list, but you pick 1 to 4 songs instead of exactly 2.
  setStepHtml: function (state, action, picked) {
    var h = Game.ui.helpers;
    var exact = !!action.setSize;
    var size = action.setSize || action.songsMax;
    var gain = exact ? Game.balance.songs.tightness.playLiveGain : Game.balance.songs.tightness.rehearseGain;
    var verb = exact ? 'played' : 'rehearsed';
    var suggested = exact ? Game.rules.gigs.suggestSet(state, size) : Game.rules.actions.loosestSongs(state, size);
    var venue = exact ? Game.rules.gigs.openMicTonight(state) : null;
    var crowd = venue ? Game.rules.gigs.crowdRange(state, venue) : null;
    var ready = !Game.rules.actions.pickedSongsProblem(state, action.id, picked);

    var rows = Game.rules.songs.playable(state).map(function (song) {
      var on = picked.indexOf(song.id) !== -1;
      var days = Game.rules.songs.daysSincePlayed(state, song);
      return '<button class="pick pick--song pick--check' + (on ? ' pick--current' : '') + '" data-action="toggleSetSong" data-song="' + song.id + '">' +
        '<span class="pick__head">' +
          '<span class="pick__name"><span class="check">' + (on ? '✓' : '') + '</span>' + h.escape(song.title) +
            (suggested.indexOf(song.id) !== -1 ? ' <span class="badge badge--warn">Suggested</span>' : '') + '</span>' +
          '<span class="pick__costs">' + (song.isCover ? 'Cover' : 'Original') + ' · ' + h.stars(song.quality) + ' ' + song.quality + '</span>' +
        '</span>' +
        '<span class="pick__song-stats">' +
          '<span class="meter meter--tight"><span class="meter__fill" style="width:' + Math.round(song.tightness) + '%"></span></span>' +
          '<span>Tightness <strong class="tight-num">' + Math.round(song.tightness) + '</strong> (+' + gain + ' if ' + verb + ')</span>' +
          '<span class="muted">' + h.daysAgo(days) + '</span>' +
        '</span>' +
        '</button>';
    }).join('');

    var note = exact
      ? (venue ? venue.name + ' tonight' : '') + (crowd ? ' · expected crowd ' + crowd.low + ' to ' + crowd.high : '') +
        ' · Tighter, better songs score higher. Originals win more fans.'
      : 'Room costs ' + h.money(action.moneyCost) + '. Each song gets +' + gain + ' tightness if a bandmate shows up ' +
        '(x' + Game.balance.songs.tightness.rehearseNoShowMultiplier + ' if nobody does; x' + (1 + Game.balance.traits.workhorse.rehearsalTightnessBonus) +
        ' with a Workhorse). The loosest songs are suggested.';
    return '<p class="hint picker-note">' + note + '</p>' +
      '<div class="picks">' + rows + '</div>' +
      '<div class="actions actions--split">' +
        '<button class="btn btn--ghost" data-action="pickerBack">← Back to actions</button>' +
        '<span class="hint">' + picked.length + ' of ' + (exact ? '' : 'up to ') + size + ' picked' +
          (picked.length === size ? ' · click another song to swap' : '') + '</span>' +
        '<button class="btn btn--primary" data-action="confirmSet"' + (ready ? '' : ' disabled') + '>' +
          (exact ? 'Play these ' + size + ' songs' : 'Rehearse ' + picked.length + ' song' + (picked.length === 1 ? '' : 's')) + '</button>' +
      '</div>';
  },

  // Person step (Jam, Hang out, Talk): band members first, then contacts, with role, skill,
  // relationship (and satisfaction for members). People who can't be picked are greyed out with why.
  personStepHtml: function (state, block, actionId) {
    var h = Game.ui.helpers;
    var action = Game.content.actions[actionId];
    var entry = Game.rules.actions.plannedEntry(state, block);
    var current = entry && entry.actionId === actionId ? entry.personId : null;
    var rows = Game.rules.actions.peopleFor(state, actionId).map(function (p) {
      var problem = Game.rules.actions.personProblem(state, actionId, p.id);
      var isMember = p.status === 'member';
      return '<button class="pick pick--song' + (p.id === current ? ' pick--current' : '') + '" data-action="pickPerson" data-person="' + p.id + '"' +
        (problem ? ' disabled' : '') + '>' +
        '<span class="pick__head">' +
          '<span class="pick__name">' + h.escape(p.name) + (isMember ? ' <span class="badge badge--warn">Band</span>' : '') +
            (p.id === current ? ' <span class="badge">Planned</span>' : '') + '</span>' +
          '<span class="pick__costs">' + Game.content.roles[p.role].name + ' · skill ' + p.skill + ' · ' + Game.content.traits[p.trait].name + '</span>' +
        '</span>' +
        '<span class="pick__song-stats">' +
          '<span class="meter meter--tight"><span class="meter__fill" style="width:' + Math.round(p.relationship) + '%"></span></span>' +
          '<span>Relationship <strong class="tight-num">' + Math.floor(p.relationship) + '</strong>' +
            (action.effects.relationship ? ' → <strong>' + Math.min(Game.balance.people.statMax, Math.floor(p.relationship + action.effects.relationship)) + '</strong>' : '') + '</span>' +
          (isMember ? '<span class="muted">Satisfaction ' + Math.round(p.satisfaction) + '</span>' : '') +
        '</span>' +
        (problem ? '<span class="pick__reason">' + h.escape(problem) + '</span>' : '') +
        '</button>';
    }).join('');
    // Write: a "Write alone" choice first; a co-writer adds their skill / 10 to progress and quality.
    var alone = action.optionalCoWriter
      ? '<button class="pick pick--all' + (entry && entry.actionId === actionId && !current ? ' pick--current' : '') + '" data-action="pickPerson" data-person="">' +
          '<span class="pick__head"><span class="pick__name">Write alone</span></span>' +
          '<span class="pick__desc">Bandmates with relationship ' + Game.balance.people.coWriteMinRelationship +
            '+ can co-write: they add their skill / ' + Game.balance.songs.coWriterProgressDivisor + ' to progress and their skill / ' +
            Game.balance.songs.coWriterQualityDivisor + ' to the song\'s quality.</span></button>'
      : '';
    return '<div class="picks">' + alone + rows + '</div>' +
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
    if (g.gig) parts.push('Expected crowd ' + g.gig.crowd.low + ' to ' + g.gig.crowd.high + ' at ' + g.gig.venueName);
    if (g.tightness) parts.push('+' + g.tightness + ' tightness on a song you pick');
    if (g.relationship) parts.push('+' + g.relationship + ' relationship with someone you pick');
    if (g.talk) parts.push('+' + g.talk + ' satisfaction for a bandmate');
    if (g.rehearsal) parts.push('+' + g.rehearsal + ' tightness on up to ' + Game.balance.songs.tightness.rehearseMaxSongs + ' songs');
    if (opt.action.needsBooking) parts.push('Pick a venue, date, and deal on the Book screen');
    if (g.meetChance) parts.push(Math.round(g.meetChance * 100) + '% chance to meet someone');
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
      if (action === 'toggleSetSong') app.toggleSetSong(target.getAttribute('data-song'));
      if (action === 'pickPerson') app.planAction(app.pickerSongStep, target.getAttribute('data-person') || null);
      if (action === 'confirmSet') app.planAction(app.pickerSongStep, app.pickerSet.slice());
      if (action === 'pickerBack') app.pickerShowActions();
      if (action === 'filterSongs') app.setPracticeFilter(target.getAttribute('data-filter'));
      if (action === 'sortSongs') app.setPracticeSort(target.getAttribute('data-sort'));
      if (action === 'pickFree') app.planAction(null);
    });
    document.onkeydown = function (event) {
      if (event.key === 'Escape') app.closePicker();
    };
  }
};
