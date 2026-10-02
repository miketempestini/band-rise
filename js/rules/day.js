// day.js
// Rules for the calendar and for ending the day.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.day = {

  // Which day of the week it is: 0 = Monday ... 6 = Sunday.
  dayOfWeek: function (day) {
    return day % Game.balance.time.daysPerWeek;
  },

  // Which week it is, starting at 1.
  weekNumber: function (day) {
    return Math.floor(day / Game.balance.time.daysPerWeek) + 1;
  },

  // True if the day job needs the player on this day of the week.
  isWorkday: function (state, dayOfWeek) {
    var job = Game.balance.job;
    if (state.player.job.status === 'full') return job.fullTimeDays.indexOf(dayOfWeek) !== -1;
    if (state.player.job.status === 'part') return job.partTimeDays.indexOf(dayOfWeek) !== -1;
    return false;
  },

  // True if this block of today is taken by the day job.
  isJobBlock: function (state, block) {
    var dow = Game.rules.day.dayOfWeek(state.day);
    return Game.rules.day.isWorkday(state, dow) && Game.balance.job.jobBlocks.indexOf(block) !== -1;
  },

  // How many days until bills are due. 0 means they're due tonight.
  daysUntilBills: function (state) {
    var t = Game.balance.time;
    var dow = Game.rules.day.dayOfWeek(state.day);
    return (t.billsDayOfWeek - dow + t.daysPerWeek) % t.daysPerWeek;
  },

  // A quick look at the rest of this week's money, for the Today screen.
  // Returns { earnedSoFar, upcomingPay, bills, projectedCash }.
  weekForecast: function (state) {
    var b = Game.balance;
    var dow = Game.rules.day.dayOfWeek(state.day);

    // Pay still to come this Friday: shifts already worked plus workdays left before payday (today included).
    var upcomingPay = 0;
    if (dow <= b.time.paydayDayOfWeek) {
      var shifts = state.player.job.unpaidShifts;
      for (var d = dow; d <= b.time.paydayDayOfWeek; d++) {
        if (Game.rules.day.isWorkday(state, d)) shifts += 1;
      }
      upcomingPay = shifts * b.job.payPerShift;
    }

    var earnedSoFar = 0;
    for (var key in state.thisWeek.income) earnedSoFar += state.thisWeek.income[key];

    var bills = b.housing[state.player.housing].weeklyCost;
    return {
      earnedSoFar: earnedSoFar,
      upcomingPay: upcomingPay,
      bills: bills,
      projectedCash: state.player.cash + upcomingPay - bills
    };
  },

  // Ends the current day and moves to the next one.
  // In order: work the day job, rest in empty blocks, Friday payday, Sunday bills and
  // debt check, overnight energy recovery, then move to tomorrow.
  // Returns { state, log, weekEnded } where weekEnded is true after Sunday night.
  endDay: function (state) {
    if (state.gameOver) {
      return { state: state, log: [], weekEnded: false };
    }

    var b = Game.balance;
    var day = Game.rules.day;
    var money = Game.rules.money;
    var clamp = Game.util.clamp;
    var s = Game.util.clone(state);
    var log = [];
    var dow = day.dayOfWeek(s.day);
    var weekEnded = false;

    // 1. Go through the three blocks: job blocks cost energy, empty blocks restore a little.
    var jobBlocks = 0;
    var emptyBlocks = 0;
    b.time.blocks.forEach(function (block) {
      if (day.isJobBlock(s, block)) jobBlocks += 1;
      else emptyBlocks += 1;
    });
    var energyChange = emptyBlocks * b.time.emptyBlockEnergy - jobBlocks * b.energy.cost.dayJob;
    s.player.energy = clamp(s.player.energy + energyChange, 0, b.energy.max);

    // 2. A workday counts as one shift: it wears down morale and gets paid on Friday.
    if (jobBlocks > 0) {
      s.player.job.unpaidShifts += 1;
      s.thisWeek.shiftsWorked += 1;
      s.player.morale = clamp(s.player.morale + b.morale.change.dayJobShift, 0, b.morale.max);
      log.push('Worked a shift at your day job (' + b.morale.change.dayJobShift + ' morale).');
    }
    if (emptyBlocks > 0) {
      log.push('Free time: +' + (emptyBlocks * b.time.emptyBlockEnergy) + ' energy.');
    }

    // 3. Friday night: payday for every shift worked since the last one.
    if (dow === b.time.paydayDayOfWeek && s.player.job.unpaidShifts > 0) {
      var pay = s.player.job.unpaidShifts * b.job.payPerShift;
      s = money.earn(s, pay, 'dayJob').state;
      s.player.job.unpaidShifts = 0;
      log.push('Payday! +$' + pay.toLocaleString() + ' from your day job.');
    }

    // 4. Sunday night: bills, the debt check, and closing out the week.
    if (dow === b.time.billsDayOfWeek) {
      var bills = b.housing[s.player.housing].weeklyCost;
      var paid = money.spend(s, bills, 'bills');
      s = paid.state;
      log.push('Paid $' + bills.toLocaleString() + ' for rent and living costs.');
      log = log.concat(paid.log);

      s = day.checkDebt(s);
      if (s.gameOver) {
        log.push(s.gameOver.message);
      }

      s = day.closeWeek(s);
      weekEnded = true;
    }

    // 5. Overnight: recover energy.
    s.player.energy = clamp(s.player.energy + b.energy.overnight, 0, b.energy.max);
    log.push('Slept: +' + b.energy.overnight + ' energy overnight.');

    // 6. On to tomorrow.
    s.day += 1;
    s.lastDayLog = log;
    return { state: s, log: log, weekEnded: weekEnded };
  },

  // Sunday check: count weeks in a row with debt above the game-over line.
  // Going over the limit for more than gameOverWeeks Sundays in a row ends the game.
  checkDebt: function (state) {
    var d = Game.balance.debt;
    var s = Game.util.clone(state);
    if (s.player.loanOwed > d.gameOverDebt) {
      s.player.debtWeeksOverLimit += 1;
    } else {
      s.player.debtWeeksOverLimit = 0;
    }
    if (s.player.debtWeeksOverLimit > d.gameOverWeeks) {
      s.gameOver = { day: s.day, message: d.gameOverMessage };
    }
    return s;
  },

  // Saves this week's totals into the ledger (for the weekly summary) and starts a fresh tally.
  closeWeek: function (state) {
    var s = Game.util.clone(state);
    var w = s.thisWeek;
    s.ledger.push({
      week: Game.rules.day.weekNumber(s.day),
      startCash: w.startCash,
      endCash: s.player.cash,
      startDebt: w.startDebt,
      endDebt: s.player.loanOwed,
      income: w.income,
      costs: w.costs,
      loans: w.loans,
      paidBack: w.paidBack,
      shiftsWorked: w.shiftsWorked
    });
    s.thisWeek = Game.state.newWeek(s.player.cash, s.player.loanOwed);
    return s;
  }
};
