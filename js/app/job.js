// app/job.js
// The day job: opening its screen, going part-time, quitting, and changing your mind.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {


  // Opens the Job screen (from the Stats panel or the Calendar).
  openJob: function () {
    Game.app.navigate('job');
  },

  goPartTime: function () {
    var app = Game.app;
    var result = Game.rules.job.goPartTime(app.state);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  // From the quit confirm screen: quits (the job ends next Monday), then back to the Job screen.
  quitJob: function () {
    var app = Game.app;
    var result = Game.rules.job.quit(app.state);
    app.show('job');
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  cancelJobChange: function () {
    var app = Game.app;
    var result = Game.rules.job.cancelPending(app.state);
    app.notice = { kind: result.state === app.state ? 'error' : 'info', text: result.log.join(' ') };
    app.applyRule(result);
  }
});
