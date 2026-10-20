// app/planWeek.js
// Plan week: picking a week, choosing evenings, applying them, and week templates.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {


  openPlanWeek: function () {
    var app = Game.app;
    app.planWeekStart = Game.rules.planWeek.weekStart(app.state.day);
    app.planWeekPicks = {};
    app.show('planWeek');
  },

  planWeekSelect: function (weekStart) {
    Game.app.planWeekStart = weekStart;
    Game.app.planWeekPicks = {};
    Game.app.notice = null;
    Game.app.render();
  },

  // A task picked for one evening in the Plan week list (not applied until "Apply to all 7 evenings").
  planWeekPick: function (dayOfWeek, value) {
    var picks = Game.app.planWeekPicks;
    if (value) picks[dayOfWeek] = value;
    else delete picks[dayOfWeek];
    Game.app.render();
  },

  // Shows what a Plan week rule did: the evenings it couldn't set, or a short "done".
  planWeekResult: function (result, doneText) {
    var app = Game.app;
    app.notice = result.log.length
      ? { kind: 'error', text: 'Some evenings weren\'t set. ' + result.log.join(' ') }
      : { kind: 'info', text: doneText };
    app.applyRule(result);
  },

  applyPlanWeek: function (weekStart) {
    var app = Game.app;
    var result = Game.rules.planWeek.applyWeek(app.state, weekStart, app.planWeekPicks);
    app.planWeekPicks = {};
    app.planWeekResult(result, 'Evenings planned.');
  },

  saveWeekTemplate: function (weekStart) {
    var app = Game.app;
    var result = Game.rules.planWeek.saveTemplate(app.state, app.templateNameDraft, weekStart);
    var failed = result.state === app.state;
    if (!failed) app.templateNameDraft = '';
    app.notice = { kind: failed ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  applyWeekTemplate: function (templateId, weekStart) {
    Game.app.planWeekResult(Game.rules.planWeek.applyTemplate(Game.app.state, templateId, weekStart), 'Template applied.');
  },

  deleteWeekTemplate: function (templateId) {
    Game.app.notice = null;
    Game.app.applyRule(Game.rules.planWeek.deleteTemplate(Game.app.state, templateId));
  }
});
