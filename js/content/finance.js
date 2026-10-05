// finance.js
// Plain names for every kind of money, shared by the weekly wrap-up and the Finances screen. Fixed data, never saved.

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.finance = {
  // Money into your cash (the categories money.earn uses).
  income: {
    loans: 'Loans from Mom and Dad', dayJob: 'Day job', tips: 'Tips (your share)', gigPay: 'Gig pay (your share)',
    streaming: 'Streaming', label: 'Label advance', merch: 'Merch sales', sessionWork: 'Session work',
    sessionCredits: 'Session credits', overtime: 'Overtime', events: 'Odd jobs and luck',
    sessionRefund: 'Session players refunded', debug: 'Debug cash'
  },
  // Money out of your cash (the categories money.spend uses).
  costs: {
    housing: 'Moving and homes', paidBack: 'Paid back to Mom and Dad', bills: 'Rent and living costs',
    networking: 'Going out to network', promotion: 'Promotion and ads', rehearsal: 'Rehearsal room', hangOut: 'Hanging out',
    sessionPlayers: 'Session players', travel: 'Travel and hotels (your part)', production: 'Production', studio: 'Studio time',
    merchStock: 'Merch cost', gear: 'Gear and vans', events: 'Surprise costs', debug: 'Debug'
  },
  // A category's name, from either list.
  name: function (key) {
    return Game.content.finance.income[key] || Game.content.finance.costs[key] || key;
  }
};
