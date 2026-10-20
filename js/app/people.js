// app/people.js
// Songs and People: opening and closing those screens, inviting and removing bandmates, and naming the band.
// These are Game.app actions: a screen calls one, it runs a rule, and the app saves and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {


  openSongs: function () {
    Game.app.navigate('songs');
  },

  closeSongs: function () {
    Game.app.goBack('songs');
  },


  openPeople: function () {
    Game.app.navigate('people');
  },

  closePeople: function () {
    Game.app.goBack('people');
  },

  // Invites a contact. The first member starts the band, so the player names it next.
  invitePerson: function (personId) {
    var app = Game.app;
    var problem = Game.rules.people.inviteProblem(app.state, personId);
    if (problem) {
      app.notice = { kind: 'error', text: problem };
      app.render();
      return;
    }
    var result = Game.rules.people.invite(app.state, personId);
    app.state = Game.rules.progress.checkUnlocks(result.state).state; // First bandmate milestone
    app.autoSave();
    if (result.firstMember) {
      var suggested = Game.rules.people.suggestBandName(app.state);
      app.state = suggested.state;
      app.bandNameDraft = suggested.name;
      app.show('nameBand');
    } else {
      app.notice = { kind: 'info', text: result.log.join(' ') };
      app.render();
    }
  },

  removePerson: function (personId) {
    var app = Game.app;
    var person = app.state.people[personId];
    if (!window.confirm('Remove ' + person.name + ' from the band? Everyone else loses some satisfaction, and you lose some morale.')) return;
    var result = Game.rules.people.remove(app.state, personId);
    app.notice = { kind: 'info', text: result.log.join(' ') };
    app.applyRule(result);
  },

  suggestBandName: function () {
    var app = Game.app;
    var suggested = Game.rules.people.suggestBandName(app.state);
    app.state = suggested.state;
    app.bandNameDraft = suggested.name;
    app.revealError = null;
    app.autoSave();
    app.render();
  },

  saveBandName: function (name) {
    var app = Game.app;
    var result = Game.rules.people.nameBand(app.state, name);
    if (result.log.length) {
      app.revealError = result.log.join(' ');
      app.bandNameDraft = name;
      app.render();
      return;
    }
    app.state = result.state;
    app.autoSave();
    app.notice = { kind: 'info', text: 'Welcome to ' + app.state.band.name + '. Rehearse is unlocked: plan it from a free block.' };
    app.screen = 'people';
    app.revealError = null;
    app.render();
  }
});
