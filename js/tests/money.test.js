// money.test.js
// Tests for earning, spending, family loans, and paying debt back (js/rules/money.js).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function moneyTestState(cash) {
    var s = Game.rules.career.startCareer('Test', 'guitar', 1).state;
    s.player.cash = cash;
    return s;
  }

  Game.test('Money: spending more than you have gets a $1,000 loan from Mom and Dad', function (t) {
    var s = moneyTestState(100);
    var result = Game.rules.money.spend(s, 400, 'bills');
    t.equal(result.state.player.cash, 700, 'cash: 100 - 400 + 1,000');
    t.equal(result.state.player.loanOwed, 1000, 'debt');
    t.equal(result.state.thisWeek.loans, 1000, 'loan recorded for the weekly summary');
    t.equal(result.log.length, 1, 'one log line about the loan');
  });

  Game.test('Money: a big bill gets as many $1,000 loans as needed (no limit)', function (t) {
    var s = moneyTestState(100);
    s.player.loanOwed = 9000;
    var result = Game.rules.money.spend(s, 2500, 'bills');
    t.equal(result.state.player.cash, 600, 'cash: 100 - 2,500 + 3,000');
    t.equal(result.state.player.loanOwed, 12000, 'debt went past $5,000 with no cap');
    t.ok(result.state.player.cash >= 0, 'cash never goes below $0');
  });

  Game.test('Money: spending within your cash takes no loan', function (t) {
    var result = Game.rules.money.spend(moneyTestState(500), 400, 'bills');
    t.equal(result.state.player.cash, 100);
    t.equal(result.state.player.loanOwed, 0);
  });

  Game.test('Money: rules return a new state and leave the old one alone', function (t) {
    var s = moneyTestState(500);
    Game.rules.money.spend(s, 400, 'bills');
    t.equal(s.player.cash, 500, 'original state unchanged');
  });

  Game.test('Money: paying back debt lowers cash and debt', function (t) {
    var s = moneyTestState(700);
    s.player.loanOwed = 1000;
    var result = Game.rules.money.payBack(s, 500);
    t.equal(result.state.player.cash, 200);
    t.equal(result.state.player.loanOwed, 500);
    t.equal(result.state.thisWeek.paidBack, 500);
  });

  Game.test('Money: you can\'t pay back more than your cash, your debt, or a non-whole amount', function (t) {
    var s = moneyTestState(300);
    s.player.loanOwed = 1000;
    t.equal(Game.rules.money.payBack(s, 400).state.player.cash, 300, 'more than cash: refused');
    s.player.cash = 5000;
    t.equal(Game.rules.money.payBack(s, 1500).state.player.loanOwed, 1000, 'more than debt: refused');
    t.equal(Game.rules.money.payBack(s, 12.5).state.player.loanOwed, 1000, 'not a whole number: refused');
    t.equal(Game.rules.money.payBack(s, 0).state.player.loanOwed, 1000, 'zero: refused');
  });

  Game.test('Money: actions on the debt list are blocked only while in debt', function (t) {
    var saved = Game.balance.debt.blockedActions;
    Game.balance.debt.blockedActions = ['testAction'];
    var s = moneyTestState(500);
    t.equal(Game.rules.money.blockedByDebt(s, 'testAction'), null, 'no debt: allowed');
    s.player.loanOwed = 1000;
    t.ok(Game.rules.money.blockedByDebt(s, 'testAction'), 'in debt: blocked with a reason');
    t.equal(Game.rules.money.blockedByDebt(s, 'otherAction'), null, 'actions not on the list stay allowed');
    Game.balance.debt.blockedActions = saved;
  });

})();
