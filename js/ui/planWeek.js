// planWeek.js (screen)
// Plan Week: the 7 evenings of one week in a list. Pick a task for each, then "Apply to all 7 evenings"
// plans them in one go (tasks that need a pick get a sensible default; "Change picks…" opens the normal
// picker for that evening). Week templates save a week's evenings to reuse later.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.planWeek = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var pw = Game.rules.planWeek;
    var weeks = pw.weeks(state);
    var weekStart = weeks.indexOf(app.planWeekStart) === -1 ? weeks[0] : app.planWeekStart;
    var picks = app.planWeekPicks || {};
    var evening = pw.evening();
    var actionIds = pw.actionChoices();

    var weekButtons = weeks.map(function (start) {
      return '<button class="btn btn--small' + (start === weekStart ? ' btn--primary' : '') + '" data-action="week" data-start="' + start + '">' +
        'Week ' + Game.rules.day.weekNumber(start) + (start === weeks[0] ? ' (this week)' : '') + '</button>';
    }).join('');

    var rows = pw.evenings(state, weekStart).map(function (e) {
      var dayName = Game.content.calendar.dayNames[e.dayOfWeek];
      var c = e.contents;
      var now;
      if (c.kind === 'plan') now = h.escape(Game.ui.calendar.taskLabel(state, c.entry));
      else if (c.kind === 'free') now = '<span class="muted">Free time</span>';
      else now = '<span class="muted">' + h.escape(Game.ui.calendar.blockInfo(state, e.day, evening).text) + '</span>';
      var locked = e.past || (c.kind !== 'plan' && c.kind !== 'free');
      var select = locked
        ? '<span class="muted">' + (e.past ? 'Over' : 'Booked') + '</span>'
        : '<select class="input plan-week__select" data-dow="' + e.dayOfWeek + '">' +
            '<option value="">Leave as is</option>' +
            '<option value="clear"' + (picks[e.dayOfWeek] === 'clear' ? ' selected' : '') + '>Free time (clear it)</option>' +
            actionIds.map(function (id) {
              return '<option value="' + id + '"' + (picks[e.dayOfWeek] === id ? ' selected' : '') + '>' + h.escape(Game.content.actions[id].name) + '</option>';
            }).join('') +
          '</select>';
      return '<div class="plan__row' + (e.past ? ' plan__row--past' : '') + '">' +
        '<span class="plan__block">' + dayName + (e.day === state.day ? ' (today)' : '') + '</span>' +
        '<span class="plan__task">' + now + '</span>' + select +
        (locked ? '' : '<button class="btn btn--small btn--ghost" data-action="changePicks" data-day="' + e.day + '">Change picks…</button>') +
        '</div>';
    }).join('');

    var templates = state.weekTemplates.length
      ? state.weekTemplates.map(function (t) {
          var summary = Object.keys(t.evenings).sort().map(function (dow) {
            return Game.content.calendar.dayNames[dow].slice(0, 3) + ' ' + Game.content.actions[t.evenings[dow].actionId].name;
          }).join(' · ');
          return '<div class="plan__row"><span class="plan__block">' + h.escape(t.name) + '</span>' +
            '<span class="plan__task muted">' + h.escape(summary) + '</span>' +
            '<button class="btn btn--small btn--primary" data-action="applyTemplate" data-id="' + t.id + '">Apply to this week</button>' +
            '<button class="btn btn--small btn--ghost" data-action="deleteTemplate" data-id="' + t.id + '">Delete</button></div>';
        }).join('')
      : '<p class="hint">No templates yet. Plan a week, then save it here to reuse it.</p>';

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen screen--narrow">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Plan week</h1>' +
          '<button class="btn" data-action="back">← Calendar</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="sort-bar">' + weekButtons + '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Evenings, week ' + Game.rules.day.weekNumber(weekStart) + '</h3>' +
          rows +
          '<p class="hint">Tasks that need a pick get a sensible one: the loosest song for Practice, the suggested set for an open mic, ' +
            'the loosest songs for Rehearse, your closest contact for Jam or Hang out, and writing alone. ' +
            'Energy and cash are checked on the day itself.</p>' +
          '<div class="actions actions--left"><button class="btn btn--primary" data-action="applyWeek"' +
            (Object.keys(picks).length ? '' : ' disabled') + '>Apply to all 7 evenings</button></div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3 class="panel__title">Week templates</h3>' +
          templates +
          '<div class="payback">' +
            '<input type="text" id="template-name" class="input" maxlength="' + Game.balance.planWeek.templateNameMaxLength +
              '" placeholder="Template name, like Gig week" value="' + h.escape(app.templateNameDraft || '') + '">' +
            '<button class="btn btn--small" data-action="saveTemplate">Save this week\'s evenings as a template</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
      (app.pickerBlock ? Game.ui.actionPicker.html(app.pickerView(), app.pickerBlock, app.pickerSongStep, app.pickerSet, app.practiceSort, app.practiceFilter) : '');

    root.querySelectorAll('.plan-week__select').forEach(function (sel) {
      sel.addEventListener('change', function () { app.planWeekPick(Number(sel.getAttribute('data-dow')), sel.value); });
    });
    var nameBox = root.querySelector('#template-name');
    if (nameBox) nameBox.addEventListener('input', function () { app.templateNameDraft = nameBox.value; });
    h.bind(root, {
      back: function () { app.show('calendar'); },
      focusPayBack: function () { app.show('calendar'); },
      week: function (e, el) { app.planWeekSelect(Number(el.getAttribute('data-start'))); },
      changePicks: function (e, el) { app.openPicker(evening, Number(el.getAttribute('data-day'))); },
      applyWeek: function () { app.applyPlanWeek(weekStart); },
      saveTemplate: function () { app.saveWeekTemplate(weekStart); },
      applyTemplate: function (e, el) { app.applyWeekTemplate(el.getAttribute('data-id'), weekStart); },
      deleteTemplate: function (e, el) { app.deleteWeekTemplate(el.getAttribute('data-id')); }
    });
    if (app.pickerBlock) Game.ui.actionPicker.bind(root, app);
  }
};
