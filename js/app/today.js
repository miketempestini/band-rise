// app/today.js
// Today's extras: skipping ahead, repeating an evening, events, tutorial tips, banners, and paying back debt.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  dismissToast: function (toastId) {
    Game.app.applyRule(Game.rules.progress.dismissToast(Game.app.state, toastId));
  },


  // "Skip to next commitment": ends quiet days until something needs you, then shows what happened.
  skipAhead: function () {
    var app = Game.app;
    var problem = Game.rules.day.skipProblem(app.state);
    if (problem) { app.notice = { kind: 'error', text: problem }; app.render(); return; }
    var result = Game.rules.day.skipToNextCommitment(app.state);
    app.skipResult = result;
    app.state = result.state;
    if (app.state.gameOver) { app.afterDayChange(result.last, true); return; }
    app.autoSave();
    app.show('skipSummary');
  },

  // From the skip summary: on to the last day's usual screens (gig result, reveals, Day results, summary).
  leaveSkipSummary: function () {
    var app = Game.app;
    var last = app.skipResult.last;
    app.skipResult = null;
    app.afterDayChange(last, true);
  },

  repeatEvening: function () {
    var app = Game.app;
    var result = Game.rules.actions.repeatEvening(app.state);
    app.notice = result.log.length ? { kind: 'error', text: result.log.join(' ') } : null;
    app.applyRule(result);
  },

  answerEvent: function (choiceId) {
    var app = Game.app;
    var result = Game.rules.events.resolve(app.state, choiceId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.state = Game.rules.progress.checkUnlocks(result.state).state;
    app.autoSave();
    app.render();
  },

  dismissTip: function (cardId) {
    Game.app.applyRule(Game.rules.progress.dismissTip(Game.app.state, cardId));
  },

  setTutorial: function (on) {
    Game.app.applyRule(Game.rules.progress.setTutorial(Game.app.state, on));
  },

  payBack: function (amount) {
    var result = Game.rules.money.payBack(Game.app.state, amount);
    Game.app.payBackMessage = result.log.join(' ');
    Game.app.applyRule(result);
  }
});
