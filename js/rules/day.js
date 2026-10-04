// day.js
// Rules for the calendar and for ending the day.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.day = {

  // Which day of the week it is: 0 = Monday ... 6 = Sunday.
  dayOfWeek: function (day) {
    return day % Game.balance.time.daysPerWeek;
  },

  // A day as words, like "Week 2, Saturday" (used in messages and on screens).
  dateLabel: function (day) {
    return 'Week ' + Game.rules.day.weekNumber(day) + ', ' + Game.content.calendar.dayNames[Game.rules.day.dayOfWeek(day)];
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
  // (Not on a day you've taken off.)
  isJobBlock: function (state, block) {
    return Game.rules.job.worksOn(state, state.day) && Game.balance.job.jobBlocks.indexOf(block) !== -1;
  },

  // How many days until bills are due. 0 means they're due tonight.
  daysUntilBills: function (state) {
    var t = Game.balance.time;
    var dow = Game.rules.day.dayOfWeek(state.day);
    return (t.billsDayOfWeek - dow + t.daysPerWeek) % t.daysPerWeek;
  },

  // A quick look at the rest of this week's money, for the Today screen.
  // Returns { earnedSoFar, upcomingPay, plannedSpending, bills, projectedCash }.
  weekForecast: function (state) {
    var b = Game.balance;
    var dow = Game.rules.day.dayOfWeek(state.day);

    // Pay still to come this Friday: shifts already worked plus workdays left before payday (today included).
    var upcomingPay = 0;
    if (dow <= b.time.paydayDayOfWeek) {
      var shifts = state.player.job.unpaidShifts;
      for (var d = dow; d <= b.time.paydayDayOfWeek; d++) {
        if (Game.rules.job.paidOn(state, state.day + (d - dow))) shifts += 1;
      }
      upcomingPay = shifts * b.job.payPerShift;
    }

    var earnedSoFar = 0;
    for (var key in state.thisWeek.income) earnedSoFar += state.thisWeek.income[key];

    // Money that today's planned actions will cost.
    var plan = Game.rules.actions.dayPlan(state);
    var plannedSpending = state.player.cash - plan[plan.length - 1].cashAfter;

    var bills = b.housing[state.player.housing].weeklyCost;
    return {
      earnedSoFar: earnedSoFar,
      upcomingPay: upcomingPay,
      plannedSpending: plannedSpending,
      bills: bills,
      projectedCash: state.player.cash + upcomingPay - plannedSpending - bills
    };
  },

  // Ends the current day and moves to the next one.
  // In order:
  //   1. Each block, Morning to Evening: the day job, a planned action, or free time.
  //   2. End of the day: shift morale, a full day off, Exhausted.
  //   3. Friday payday; Sunday bills, morale drift, debt check, and the week's wrap-up.
  //   4. Overnight: energy recovers, buzz fades, then tomorrow begins; rust and song fading are checked.
  // Returns { state, log, weekEnded }. The full report is saved in state.lastDayReport
  // for the Day results screen: { day, blocks: [{ block, title, lines }], overnight: [lines],
  // finishedSongs: [songIds], gig: true if a gig was played } (these drive the reveal and gig result screens).
  endDay: function (state) {
    if (state.gameOver) {
      return { state: state, log: [], weekEnded: false };
    }

    var b = Game.balance;
    var day = Game.rules.day;
    var util = Game.util;
    var s = util.clone(state);
    var dow = day.dayOfWeek(s.day);
    var report = { day: s.day, blocks: [], overnight: [], finishedSongs: [], gig: false };
    var weekEnded = false;

    // Today's event, if you didn't answer it: the safe choice happens.
    var unanswered = Game.rules.events.autoResolve(s);
    s = unanswered.state;
    var eventLines = unanswered.log;
    var exhausted = false;
    var jobBlocks = 0;
    var didWork = false; // true if any action today counts as work (so it isn't a full day off)

    // Small helper so every change to morale also updates Burned out and records any note.
    function changeMorale(amount, lines) {
      var r = Game.rules.morale.change(s, amount);
      s = r.state;
      r.log.forEach(function (line) { lines.push(line); });
    }

    // 1. The three blocks, in order.
    b.time.blocks.forEach(function (block) {
      var lines = [];
      var title;
      var entry = Game.rules.actions.plannedEntry(s, block);
      var actionId = entry && entry.type === 'action' ? entry.actionId : null;

      if (entry && entry.type === 'gig') {
        // A booked show: a commitment, so it happens even if you're Tired. At 0 energy it's a no-show.
        var energyAtShow = s.player.energy;
        var show = Game.rules.booking.playShow(s, entry, energyAtShow);
        s = show.state;
        title = show.noShow ? 'No-show' : 'Show at ' + Game.content.venues[entry.venueId].name;
        if (!show.noShow) {
          report.gig = true;
          didWork = true;
          s.player.energy = Game.rules.energy.clamp(s.player.energy - b.energy.cost.gig);
          lines.push(show.log[0].replace(/\.$/, '') + ', -' + b.energy.cost.gig + ' energy.');
          lines = lines.concat(show.log.slice(1));
          if (s.player.energy === 0 && !exhausted) {
            exhausted = true;
            lines.push('The show drained you to 0 energy. You\'re Exhausted.');
          }
        } else {
          lines = lines.concat(show.log);
        }
      } else if (entry && entry.type === 'studio') {
        // Booked studio time: a commitment. Records the song and pays the studio for the block.
        title = 'Studio: ' + Game.content.studios[entry.studio].name;
        didWork = true;
        var rec = Game.rules.recording.record(s, entry.songId, entry.studio);
        s = rec.state;
        s.player.energy = Game.rules.energy.clamp(s.player.energy - b.energy.cost.studio);
        lines.push(rec.log[0].replace(/\.$/, '') + ', -' + b.energy.cost.studio + ' energy.');
        if (s.player.energy === 0 && !exhausted) {
          exhausted = true;
          lines.push('The session drained you to 0 energy. You\'re Exhausted.');
        }
      } else if (day.isJobBlock(s, block)) {
        title = 'Day job';
        jobBlocks += 1;
        s.player.energy = Game.rules.energy.clamp(s.player.energy - b.energy.cost.dayJob);
        lines.push('-' + b.energy.cost.dayJob + ' energy.');
        if (s.player.energy === 0 && !exhausted) {
          exhausted = true;
          lines.push('The job drained you to 0 energy. You\'re Exhausted.');
        }
      } else if (actionId) {
        var done = Game.rules.actions.perform(s, actionId, entry.songId, entry.songIds, entry.personId, entry.request);
        s = done.state;
        if (done.finishedSongId) report.finishedSongs.push(done.finishedSongId);
        if (done.gig) report.gig = true;
        title = Game.content.actions[actionId].name;
        lines.push(done.line);
        lines = lines.concat(done.notes);
        if (done.skipped) {
          title = 'Free time';
          s.player.energy = Game.rules.energy.clamp(s.player.energy + b.time.emptyBlockEnergy);
          lines.push('+' + b.time.emptyBlockEnergy + ' energy from free time instead.');
        } else if (Game.content.actions[actionId].countsAsWork) {
          didWork = true;
        }
      } else {
        title = 'Free time';
        s.player.energy = Game.rules.energy.clamp(s.player.energy + b.time.emptyBlockEnergy);
        lines.push('+' + b.time.emptyBlockEnergy + ' energy.');
      }

      report.blocks.push({ block: block, title: title, lines: lines });
    });

    // 2. End of the day.
    var endLines = report.overnight;
    if (jobBlocks > 0 && s.player.job.extraShifts[s.day]) {
      // An overtime shift is paid right away, at the overtime rate.
      delete s.player.job.extraShifts[s.day];
      s = Game.rules.money.earn(s, b.job.overtimePay, 'overtime').state;
      s.thisWeek.shiftsWorked += 1;
      endLines.push('Overtime shift: +$' + b.job.overtimePay + ', ' + b.morale.change.dayJobShift + ' morale.');
      changeMorale(b.morale.change.dayJobShift, endLines);
    } else if (jobBlocks > 0) {
      s.player.job.unpaidShifts += 1;
      s.thisWeek.shiftsWorked += 1;
      endLines.push('Day job shift: ' + b.morale.change.dayJobShift + ' morale, +' + b.job.standingPerShift + ' job standing.');
      changeMorale(b.morale.change.dayJobShift, endLines);
      var standing = Game.rules.job.changeStanding(s, b.job.standingPerShift);
      s = standing.state;
      standing.log.forEach(function (line) { endLines.push(line); });
    } else if (Game.rules.job.scheduledOn(s, s.day) && s.player.job.daysOff[s.day]) {
      var off = Game.rules.job.resolveDayOff(s);
      s = off.state;
      off.log.forEach(function (line) { endLines.push(line); });
    }
    if (jobBlocks === 0 && !didWork) {
      endLines.push('Full day off: +' + b.morale.change.fullDayOff + ' morale.');
      changeMorale(b.morale.change.fullDayOff, endLines);
    }
    if (exhausted) {
      endLines.push('Exhausted: ' + b.morale.change.exhausted + ' morale, and you\'ll only recover ' + b.energy.exhaustedOvernight + ' energy tonight.');
      changeMorale(b.morale.change.exhausted, endLines);
    }
    // Remember tonight's evening task, for "Repeat yesterday's evening".
    s.lastEvening = Game.rules.actions.eveningToRepeat(s);
    s = Game.rules.actions.clearDay(s, s.day);

    // 3. Friday night: payday for every shift worked since the last one.
    if (dow === b.time.paydayDayOfWeek && s.player.job.unpaidShifts > 0) {
      var pay = s.player.job.unpaidShifts * b.job.payPerShift;
      s = Game.rules.money.earn(s, pay, 'dayJob').state;
      s.player.job.unpaidShifts = 0;
      endLines.push('Payday! +$' + pay.toLocaleString() + ' from your day job.');
    }

    // Sunday night: bills, morale drift, the debt check, and closing out the week.
    if (dow === b.time.billsDayOfWeek) {
      // Streaming money comes in first, so it can help cover the bills.
      var streaming = Game.rules.recording.payStreaming(s);
      s = streaming.state;
      streaming.log.forEach(function (line) { endLines.push(line); });
      var bills = b.housing[s.player.housing].weeklyCost;
      var paid = Game.rules.money.spend(s, bills, 'bills');
      s = paid.state;
      endLines.push('Paid $' + bills.toLocaleString() + ' for rent and living costs.');
      paid.log.forEach(function (line) { endLines.push(line); });

      var drift = Game.rules.morale.weeklyDrift(s);
      s = drift.state;
      drift.log.forEach(function (line) { endLines.push(line); });

      // The band's weekly satisfaction check, quits, and relationships fading.
      var band = Game.rules.people.weeklyCheck(s);
      s = band.state;
      band.log.forEach(function (line) { endLines.push(line); });
      s.thisWeek.bandNotes = band.log; // shown on the weekly summary

      s = day.checkDebt(s);
      if (s.gameOver) {
        endLines.push(s.gameOver.message);
      }

      weekEnded = true; // the week is closed at the very end of tonight, after rust
    }

    // 4. Overnight: energy recovers and buzz fades.
    var recovery = Game.rules.energy.overnightRecovery(exhausted);
    var energyBefore = s.player.energy;
    s.player.energy = Game.rules.energy.clamp(s.player.energy + recovery);
    endLines.push('Slept: ' + util.signed(s.player.energy - energyBefore) + ' energy (now ' + Math.round(s.player.energy) + ').');
    var nightly = Game.rules.events.nightly(s);
    s = nightly.state;
    nightly.log.forEach(function (line) { endLines.push(line); });

    var faded = Game.rules.audience.fadeBuzz(s);
    s = faded.state;
    faded.log.forEach(function (line) { endLines.push(line); });

    // Anything newly unlocked or achieved (like small rooms at reputation 10) gets a banner on Today
    // (checked before the day moves forward, so it's dated the day it happened).
    var unlocked = Game.rules.progress.checkUnlocks(s);
    s = unlocked.state;
    unlocked.milestoneLog.forEach(function (line) { endLines.push(line); });

    // On to tomorrow, then check for rusty skills.
    s.day += 1;
    var rust = Game.rules.skills.applyRust(s);
    s = rust.state;
    rust.log.forEach(function (line) { endLines.push(line); });

    // Songs nobody has played or practiced for a week get looser.
    var fading = Game.rules.songs.applyFading(s);
    s = fading.state;
    fading.log.forEach(function (line) { endLines.push(line); });

    // Venues answer booking emails, and offers you didn't answer in time go away.
    var replies = Game.rules.booking.processReplies(s);
    s = replies.state;
    replies.log.forEach(function (line) { endLines.push(line); });
    // Residency counter-offers get their answers, and new opening slots or residencies may arrive.
    var counters = Game.rules.offers.processCounters(s);
    s = counters.state;
    counters.log.forEach(function (line) { endLines.push(line); });
    var offers = Game.rules.offers.roll(s);
    s = offers.state;
    offers.log.forEach(function (line) { endLines.push(line); });
    var expired = Game.rules.booking.expireOffers(s);
    s = expired.state;
    expired.log.forEach(function (line) { endLines.push(line); });

    // A new year of vacation days.
    if (s.day % b.time.daysPerYear === 0) {
      s.player.job.vacationDaysLeft = b.job.vacationDaysPerYear;
      endLines.push('A new year: ' + b.job.vacationDaysPerYear + ' vacation days.');
    }


    // Temporary effects that ran out, then maybe a new event for the morning.
    var ended = Game.rules.events.expire(s);
    s = ended.state;
    ended.log.forEach(function (line) { endLines.push(line); });
    s = Game.rules.events.roll(s).state;

    eventLines.reverse().forEach(function (line) { endLines.unshift(line); });

    // Sunday night: save the week's totals (including tonight's skill changes) for the weekly summary.
    if (weekEnded) {
      s = day.closeWeek(s, day.weekNumber(report.day));
    }

    s.lastDayReport = report;

    // A flat list of everything that happened, for tests and simple displays.
    var log = [];
    report.blocks.forEach(function (row) {
      row.lines.forEach(function (line) { log.push(Game.content.calendar.blockNames[row.block] + ', ' + row.title + ': ' + line); });
    });
    log = log.concat(report.overnight);

    return { state: s, log: log, weekEnded: weekEnded };
  },

  // "Skip to next commitment": ends days one after another (with nothing planned) until something needs
  // you: tomorrow has a show or a planned task, an event comes up, a new message arrives, a song finishes,
  // a gig is played, or a week ends. Never more than balance.timeSavers.maxSkipDays at once.
  // Returns { state, days: [{ day, lines }], last (the last day's endDay result), stopReason }.
  skipToNextCommitment: function (state) {
    var b = Game.balance;
    var s = state;
    var days = [];
    var last = null;
    var reason = 'Skipped as far as allowed.';
    for (var i = 0; i < b.timeSavers.maxSkipDays; i++) {
      var unreadBefore = Game.rules.booking.unreadCount(s);
      last = Game.rules.day.endDay(s);
      s = last.state;
      var r = s.lastDayReport;
      days.push({ day: r.day, lines: r.overnight.filter(function (line) { return line.indexOf('Slept') !== 0; }) });
      if (s.gameOver) { reason = 'Game over.'; break; }
      if (last.weekEnded) { reason = 'The week ended: time for your weekly summary.'; break; }
      if (r.gig) { reason = 'You played a gig.'; break; }
      if (r.finishedSongs.length) { reason = 'You finished a song.'; break; }
      if (s.pendingEvent) { reason = 'Something came up.'; break; }
      if (Game.rules.booking.unreadCount(s) > unreadBefore) { reason = 'You have a new message.'; break; }
      if (s.schedule[s.day] && Object.keys(s.schedule[s.day]).length) { reason = 'Today has something planned.'; break; }
    }
    return { state: s, days: days, last: last, stopReason: reason };
  },

  // Why skipping ahead isn't possible right now, or null.
  skipProblem: function (state) {
    if (state.pendingEvent) return 'Answer today\'s event first.';
    if (state.schedule[state.day] && Object.keys(state.schedule[state.day]).length) return 'Today has plans: use End Day.';
    return null;
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
  // week: the week number being closed.
  closeWeek: function (state, week) {
    var s = Game.util.clone(state);
    var w = s.thisWeek;
    // Older saves may not have the starting skills yet; then the week shows no skill changes.
    var startSkills = w.startSkills || s.player.skills;
    s.ledger.push({
      week: week,
      startCash: w.startCash,
      endCash: s.player.cash,
      startDebt: w.startDebt,
      endDebt: s.player.loanOwed,
      income: w.income,
      costs: w.costs,
      loans: w.loans,
      paidBack: w.paidBack,
      shiftsWorked: w.shiftsWorked,
      bandNotes: w.bandNotes || [],
      startSkills: Game.util.clone(startSkills),
      endSkills: Game.util.clone(s.player.skills)
    });
    s.thisWeek = Game.state.newWeek(s.player.cash, s.player.loanOwed, s.player.skills);
    return s;
  }
};
