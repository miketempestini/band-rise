// money.js
// Rules for money coming in and going out, family loans, and paying debt back.
//
// Every bit of money the game moves should go through earn() or spend(), so that:
//   - the weekly summary always knows where money came from and went, and
//   - Mom and Dad's loans kick in automatically whenever cash would drop below $0.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.money = {

  // Adds money to the player's cash.
  // category: a short name for where it came from, like 'dayJob'. Used by the weekly summary.
  // Returns { state, log }.
  earn: function (state, amount, category) {
    var s = Game.util.clone(state);
    s.player.cash += amount;
    s.thisWeek.income[category] = (s.thisWeek.income[category] || 0) + amount;
    Game.rules.finances.add(s, { flow: 'in', cat: category, amount: amount });
    return { state: s, log: [] };
  },

  // Takes money from the player's cash.
  // If that would leave cash below $0, Mom and Dad lend money, $1,000 at a time,
  // until cash is back to $0 or more. There's no limit on how much they'll lend.
  // Returns { state, log }.
  // extra: optional details for the Finances screen's record, like { tripId } for travel costs.
  spend: function (state, amount, category, extra) {
    var b = Game.balance.debt;
    var s = Game.util.clone(state);
    var log = [];

    s.player.cash -= amount;
    s.thisWeek.costs[category] = (s.thisWeek.costs[category] || 0) + amount;
    Game.rules.finances.add(s, Object.assign({ flow: 'out', cat: category, amount: amount }, extra || {}));

    // Keep borrowing until cash isn't negative anymore.
    while (s.player.cash < 0) {
      s.player.cash += b.familyLoanAmount;
      s.player.loanOwed += b.familyLoanAmount;
      s.thisWeek.loans += b.familyLoanAmount;
      Game.rules.finances.add(s, { flow: 'in', cat: 'loans', amount: b.familyLoanAmount });
      log.push('You were short on cash. Mom and Dad lent you $' + b.familyLoanAmount.toLocaleString() + '.');
    }

    return { state: s, log: log };
  },

  // Pays back some of the debt owed to Mom and Dad.
  // amount must be a whole number, more than 0, and no more than your cash or your debt.
  // If the amount isn't allowed, the state comes back unchanged with a log line explaining why.
  // Returns { state, log }.
  payBack: function (state, amount) {
    var most = Game.rules.money.maxPayBack(state);

    if (!Number.isInteger(amount) || amount <= 0) {
      return { state: state, log: ['Enter a whole dollar amount to pay back.'] };
    }
    if (amount > most) {
      return { state: state, log: ['You can pay back at most $' + most.toLocaleString() + ' right now.'] };
    }

    var s = Game.util.clone(state);
    s.player.cash -= amount;
    s.player.loanOwed -= amount;
    s.thisWeek.paidBack += amount;
    Game.rules.finances.add(s, { flow: 'out', cat: 'paidBack', amount: amount });
    return { state: s, log: ['You paid Mom and Dad back $' + amount.toLocaleString() + '.'] };
  },

  // The most you can pay back right now: your cash or your debt, whichever is smaller.
  maxPayBack: function (state) {
    return Math.max(0, Math.min(state.player.cash, state.player.loanOwed));
  },

  // How many more Sundays over the debt line until the game ends (counting the one that ends it).
  // Example: game over after more than 5 Sundays; 2 so far, so 4 more ends it.
  sundaysUntilGameOver: function (state) {
    return Game.balance.debt.gameOverWeeks + 1 - state.player.debtWeeksOverLimit;
  },

  // Adds up one week from the ledger for the weekly summary.
  // Money in = every income category, plus Mom and Dad's loans; money out = every cost, plus what you paid back.
  // Returns { income: [{ key, amount }], costs: [{ key, amount }], totalIn, totalOut }
  // (the keys 'loans' and 'paidBack' stand for the loan lines).
  weekTotals: function (week) {
    var income = Object.keys(week.income).map(function (key) { return { key: key, amount: week.income[key] }; });
    if (week.loans > 0) income.push({ key: 'loans', amount: week.loans });
    var costs = Object.keys(week.costs).map(function (key) { return { key: key, amount: week.costs[key] }; });
    if (week.paidBack > 0) costs.push({ key: 'paidBack', amount: week.paidBack });
    var sum = function (rows) { return rows.reduce(function (total, r) { return total + r.amount; }, 0); };
    return { income: income, costs: costs, totalIn: sum(income), totalOut: sum(costs) };
  },

  // True if the player owes any money.
  isInDebt: function (state) {
    return state.player.loanOwed > 0;
  },

  // Later phases use this to block some actions while the player owes money.
  // Returns a reason to show the player if the action is blocked, or null if it's allowed.
  // Which actions are blocked is set in balance.js (debt.blockedActions).
  blockedByDebt: function (state, actionId) {
    var blocked = Game.balance.debt.blockedActions.indexOf(actionId) !== -1;
    if (blocked && Game.rules.money.isInDebt(state)) {
      return 'Pay back Mom and Dad first.';
    }
    return null;
  }
};
