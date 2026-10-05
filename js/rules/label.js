// label.js
// The label deal (Phase 12, milestone 16): once you're at reputation 65 with 10,000 fans, a label offers you a
// cash advance. Signing also opens the Top studio and (with a manager) the National cities. The label keeps 80%
// of your streaming money until the advance is paid back. Numbers are in balance.label.
//
// Inbox message: kind 'labelOffer', data { advance }.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.label = {

  signed: function (state) { return !!state.label.signed; },

  // True if you've reached the Label offer milestone's bar (reputation 65 and 10,000 fans).
  qualifies: function (state) {
    var m = Game.balance.milestones;
    return state.player.reputation >= m.labelReputation && Game.rules.progress.totalFans(state) >= m.labelFans;
  },

  // The advance on offer: $10,000 + $2 per fan, up to $50,000.
  advanceFor: function (state) {
    var l = Game.balance.label;
    return Math.min(l.advanceMax, l.advanceBase + l.advancePerFan * Game.rules.progress.totalFans(state));
  },

  // Each morning: if you qualify and haven't signed, an offer arrives (again 8 weeks after you turn one down).
  // Returns { state, log }.
  offerCheck: function (state) {
    var l = Game.balance.label;
    if (Game.rules.label.signed(state) || !Game.rules.label.qualifies(state)) return { state: state, log: [] };
    var last = Game.rules.manager.lastMessage(state, 'labelOffer');
    if (last && (!last.resolved || state.day - last.day < l.reofferWeeks * Game.balance.time.daysPerWeek)) return { state: state, log: [] };
    var advance = Game.rules.label.advanceFor(state);
    var s = Game.rules.booking.addInbox(state, 'labelOffer', { advance: advance }, state.day + l.offerExpiryDays);
    return { state: s, log: [Game.content.business.label.name + ' wants to sign you, with a $' + advance.toLocaleString() + ' advance. Check your Inbox.'] };
  },

  // Signs with the label: the advance is paid now. Returns { state, log }.
  sign: function (state, messageId) {
    var m = state.inbox.filter(function (x) { return x.id === messageId; })[0];
    if (!m || m.resolved || m.kind !== 'labelOffer') return { state: state, log: ['That offer isn\'t open.'] };
    var s = Game.rules.money.earn(state, m.data.advance, 'label').state;
    s.label = { signed: true, signedDay: s.day, advance: m.data.advance, owed: m.data.advance, nextOfferDay: 0 };
    s.inbox.forEach(function (x) { if (x.id === messageId) { x.resolved = 'accepted'; x.read = true; } });
    s = Game.rules.progress.checkUnlocks(s).state; // National cities (with a manager)
    return { state: s, log: ['You signed with ' + Game.content.business.label.name + ': +$' + m.data.advance.toLocaleString() +
      '. The Top studio is open. The label keeps ' + Math.round(Game.balance.label.streamingCut * 100) + '% of streaming until the advance is paid back.'] };
  },

  // Splits a week's streaming money: while you still owe the label, they keep 80% (never more than you owe).
  // Returns { yours, label }.
  splitStreaming: function (state, pay) {
    if (!Game.rules.label.signed(state) || state.label.owed <= 0) return { yours: pay, label: 0 };
    var take = Math.min(state.label.owed, Math.round(pay * Game.balance.label.streamingCut));
    return { yours: pay - take, label: take };
  }
};
