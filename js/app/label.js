// app/label.js
// Record label actions: reading a contract (and comparing offers), choosing a counter-offer, signing, turning a label
// down, and buying yourself out. These are Game.app actions: a screen calls one, it runs a rule, and the app saves
// and redraws.

window.Game = window.Game || {};
Game.app = Game.app || {};

Object.assign(Game.app, {

  labelOfferId: null,     // the offer whose contract is open (null with the comparison open)
  labelAsks: [],          // the counter-offer asks ticked on the contract
  signedNotice: null,     // what you signed, shown on the Manager screen after the signing moment

  // Opens an offer's contract.
  openLabelDeal: function (messageId) {
    var app = Game.app;
    app.labelOfferId = messageId;
    app.labelAsks = [];
    app.returnTo.labelDeal = app.screen === 'labelDeal' ? app.returnTo.labelDeal : app.screen;
    app.show('labelDeal');
    window.scrollTo(0, 0);
  },

  // Opens the side-by-side comparison of every open offer.
  openLabelCompare: function () {
    var app = Game.app;
    app.labelOfferId = null;
    app.returnTo.labelDeal = app.screen === 'labelDeal' ? app.returnTo.labelDeal : app.screen;
    app.show('labelDeal');
    window.scrollTo(0, 0);
  },

  closeLabelDeal: function () {
    Game.app.labelOfferId = null;
    Game.app.goBack('labelDeal');
  },

  // Ticks or unticks a counter-offer ask.
  labelAskToggle: function (ask) {
    var app = Game.app;
    var i = app.labelAsks.indexOf(ask);
    if (i === -1) app.labelAsks.push(ask); else app.labelAsks.splice(i, 1);
    app.render();
  },

  sendLabelCounter: function () {
    var app = Game.app;
    var result = Game.rules.label.counter(app.state, app.labelOfferId, app.labelAsks);
    app.labelAsks = [];
    app.applyWithNotice(result);
  },

  // Signs a deal, after a summary to confirm.
  signLabelDeal: function (messageId) {
    var app = Game.app;
    var problem = Game.rules.label.signProblem(app.state, messageId);
    if (problem) { app.notice = { kind: 'error', text: problem }; app.render(); return; }
    var m = app.state.inbox.filter(function (x) { return x.id === messageId; })[0];
    var t = m.data.terms;
    var lb = Game.rules.label;
    var summary = 'Sign with ' + lb.name(t.labelId) + '?\n\n' +
      '$' + t.advance.toLocaleString() + ' advance, ' + Math.round(t.royalty * 100) + '% royalty.\n' +
      'You owe ' + lb.oweText(t) + ', ' + t.deadlineWeeks + ' weeks each.\n' +
      'Masters: ' + lb.mastersText(t) + '.\n' +
      (t.gigCut || t.merchCut ? 'They take ' + Math.round(t.gigCut * 100) + '% of shows and ' + Math.round(t.merchCut * 100) + '% of merch.\n' : '') +
      (t.dropsYou ? '' : 'They never let you go: the buyout is the only way out.\n') +
      '\nThe other offers will be withdrawn.';
    if (!window.confirm(summary)) return;
    var result = lb.sign(app.state, messageId);
    app.labelOfferId = null;
    app.state = result.state;
    app.autoSave();
    app.signedNotice = result.log.join(' ');
    app.show('dealSigned'); // the signing moment, then your deal on the Manager screen
    window.scrollTo(0, 0);
  },

  // From the signing moment: on to your deal, with what you signed as the message.
  leaveDealSigned: function () {
    var app = Game.app;
    app.show('manager');
    app.notice = app.signedNotice ? { kind: 'info', text: app.signedNotice } : null; // after switching screens (which clears messages)
    app.signedNotice = null;
    app.render();
    window.scrollTo(0, 0);
  },

  // Answers a label request ('yes' or 'no').
  answerLabelRequest: function (messageId, choice) {
    Game.app.applyWithNotice(Game.rules.label.answerRequest(Game.app.state, messageId, choice));
  },

  declineLabel: function (messageId) {
    var app = Game.app;
    app.state = Game.rules.booking.declineOffer(app.state, messageId).state;
    app.autoSave();
    if (app.labelOfferId === messageId) app.closeLabelDeal(); else app.render();
  },

  // Buys you out of your deal, after a confirmation.
  buyoutLabel: function () {
    var app = Game.app;
    var problem = Game.rules.label.buyoutProblem(app.state);
    if (problem) { app.notice = { kind: 'error', text: problem }; app.render(); return; }
    var price = Game.rules.label.buyoutPrice(app.state);
    if (!window.confirm('Buy yourself out of your ' + Game.rules.label.name(app.state.label.deal.labelId) + ' deal for $' + price.toLocaleString() + '?')) return;
    app.applyWithNotice(Game.rules.label.buyout(app.state));
  }
});
