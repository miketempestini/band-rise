// planWeek.js
// Plan Week: set all 7 evenings of a week at once, and save a week's evenings as a template to reuse.
// Everything goes through Game.rules.actions.plan, so the usual checks still apply (booked shows, open mic
// nights, and so on). Tasks that need a pick get a sensible default: the loosest song for Practice, the
// suggested set for an open mic, the loosest songs for Rehearse, your closest contact for Jam or Hang out,
// and writing alone. Templates are saved in state.weekTemplates: { id, name, evenings: { dayOfWeek: { actionId, choice } } }.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.planWeek = {

  // The evening block (the last block of the day).
  evening: function () {
    var blocks = Game.balance.time.blocks;
    return blocks[blocks.length - 1];
  },

  // The Monday of the week a day is in.
  weekStart: function (day) {
    return day - Game.rules.day.dayOfWeek(day);
  },

  // The weeks you can plan: this week and the rest of the Calendar's weeks (their Mondays).
  weeks: function (state) {
    var t = Game.balance.time;
    var first = Game.rules.planWeek.weekStart(state.day);
    var list = [];
    for (var i = 0; i < t.calendarWeeks; i++) list.push(first + i * t.daysPerWeek);
    return list;
  },

  // The 7 evenings of a week: [{ day, dayOfWeek, past, contents }] (contents from booking.blockContents).
  evenings: function (state, weekStart) {
    var evening = Game.rules.planWeek.evening();
    var list = [];
    for (var i = 0; i < Game.balance.time.daysPerWeek; i++) {
      var day = weekStart + i;
      list.push({ day: day, dayOfWeek: i, past: day < state.day, contents: Game.rules.booking.blockContents(state, day, evening) });
    }
    return list;
  },

  // The tasks that make sense to pick from the Plan Week list (not the ones set up on the Book screen).
  actionChoices: function () {
    var all = Game.content.actions;
    return Object.keys(all).filter(function (id) { return !all[id].needsBooking; });
  },

  // A sensible pick for a task on a day, or null when the planner's own default is fine
  // (loosest song, suggested set, loosest songs, writing alone). For Jam, Hang out, or Talk: the closest
  // person you can pick (null if there's nobody).
  defaultChoice: function (state, actionId, day) {
    var action = Game.content.actions[actionId];
    if (!action.needsPerson) return null;
    var view = Game.rules.actions.viewForDay(state, day);
    var people = Game.rules.actions.peopleFor(view, actionId).slice().sort(function (a, b) { return b.relationship - a.relationship; });
    var best = people.filter(function (p) { return !Game.rules.actions.personProblem(view, actionId, p.id); })[0];
    return best ? best.id : null;
  },

  // The pick saved on a planned entry (a person, a set of songs, or one song), or null.
  choiceFromEntry: function (entry) {
    return entry.personId || (entry.songIds ? entry.songIds.slice() : null) || entry.songId || null;
  },

  // Plans one evening. If a saved pick no longer works (a song or person is gone), the default pick is tried.
  // Returns { state, log } (log has the reason if it couldn't be planned).
  planEvening: function (state, day, actionId, choice) {
    var evening = Game.rules.planWeek.evening();
    var fallback = Game.rules.planWeek.defaultChoice(state, actionId, day);
    var first = choice === undefined || choice === null ? fallback : choice;
    var result = Game.rules.actions.plan(state, evening, actionId, first, day);
    if (result.log.length && first !== fallback) result = Game.rules.actions.plan(state, evening, actionId, fallback, day);
    return result;
  },

  // Sets a whole week's evenings at once. picks: { dayOfWeek: actionId | 'clear' } (days left out stay as they are;
  // days already over are skipped). Returns { state, log } with one line per evening that couldn't be set.
  applyWeek: function (state, weekStart, picks) {
    var s = state;
    var log = [];
    var evening = Game.rules.planWeek.evening();
    Game.rules.planWeek.evenings(state, weekStart).forEach(function (e) {
      var pick = picks[e.dayOfWeek];
      if (!pick || e.past) return;
      var result = pick === 'clear'
        ? Game.rules.actions.clear(s, evening, e.day)
        : Game.rules.planWeek.planEvening(s, e.day, pick, null);
      if (result.log.length) log.push(Game.content.calendar.dayNames[e.dayOfWeek] + ': ' + result.log[0]);
      else s = result.state;
    });
    return { state: s, log: log };
  },

  // Why a week can't be saved as a template with this name, or null.
  templateProblem: function (state, name, weekStart) {
    var b = Game.balance.planWeek;
    var clean = String(name || '').trim();
    if (!clean) return 'Give the template a name.';
    if (clean.length > b.templateNameMaxLength) return 'Keep the name to ' + b.templateNameMaxLength + ' characters.';
    var replacing = state.weekTemplates.some(function (t) { return t.name === clean; });
    if (!replacing && state.weekTemplates.length >= b.maxTemplates) return 'You can keep ' + b.maxTemplates + ' templates. Delete one first.';
    if (!Object.keys(Game.rules.planWeek.eveningsToSave(state, weekStart)).length) return 'Plan some evenings in this week first.';
    return null;
  },

  // The planned evening tasks of a week, ready to save: { dayOfWeek: { actionId, choice } }.
  eveningsToSave: function (state, weekStart) {
    var saved = {};
    Game.rules.planWeek.evenings(state, weekStart).forEach(function (e) {
      if (e.contents.kind !== 'plan') return;
      var entry = e.contents.entry;
      saved[e.dayOfWeek] = { actionId: entry.actionId, choice: Game.rules.planWeek.choiceFromEntry(entry) };
    });
    return saved;
  },

  // Saves a week's planned evenings as a template (a template with the same name is replaced). Returns { state, log }.
  saveTemplate: function (state, name, weekStart) {
    var problem = Game.rules.planWeek.templateProblem(state, name, weekStart);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    var clean = String(name).trim();
    var evenings = Game.rules.planWeek.eveningsToSave(s, weekStart);
    var existing = s.weekTemplates.filter(function (t) { return t.name === clean; })[0];
    if (existing) {
      existing.evenings = evenings;
    } else {
      s.weekTemplates.push({ id: 't' + s.nextTemplateId, name: clean, evenings: evenings });
      s.nextTemplateId += 1;
    }
    return { state: s, log: ['Saved the template "' + clean + '".'] };
  },

  // Deletes a template. Returns { state, log }.
  deleteTemplate: function (state, templateId) {
    var s = Game.util.clone(state);
    s.weekTemplates = s.weekTemplates.filter(function (t) { return t.id !== templateId; });
    return { state: s, log: [] };
  },

  // Fills a week's evenings from a template (evenings it doesn't cover stay as they are; days already over
  // are skipped). Returns { state, log } with one line per evening that couldn't be set.
  applyTemplate: function (state, templateId, weekStart) {
    var template = state.weekTemplates.filter(function (t) { return t.id === templateId; })[0];
    if (!template) return { state: state, log: ['That template is gone.'] };
    var s = state;
    var log = [];
    Game.rules.planWeek.evenings(state, weekStart).forEach(function (e) {
      var item = template.evenings[e.dayOfWeek];
      if (!item || e.past) return;
      var result = Game.rules.planWeek.planEvening(s, e.day, item.actionId, item.choice);
      if (result.log.length) log.push(Game.content.calendar.dayNames[e.dayOfWeek] + ': ' + result.log[0]);
      else s = result.state;
    });
    return { state: s, log: log };
  }
};
