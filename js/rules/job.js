// job.js
// Rules for the day job: which days you work, days off (vacation, calling in sick, skipping),
// job standing (how your boss sees you), getting fired, finding work again, and (Phase 10)
// going part-time or quitting. Both changes start next Monday: until then they wait in job.pending.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.job = {

  // Your job on a given day: 'full', 'part', or 'none'. A change you asked for (going part-time or
  // quitting) counts from the Monday it starts, so the Calendar already shows it.
  statusOn: function (state, day) {
    var job = state.player.job;
    if (job.pending && day >= job.pending.day) return job.pending.status;
    return job.status;
  },

  // True if your job expects you on this day (before any day off is counted).
  scheduledOn: function (state, day) {
    var job = state.player.job;
    var status = Game.rules.job.statusOn(state, day);
    if (status !== 'none' && job.extraShifts && job.extraShifts[day]) return true; // an overtime shift
    if (job.startsDay !== null && day < job.startsDay) return false;
    return Game.rules.day.isWorkday(state, Game.rules.day.dayOfWeek(day), status);
  },

  // ----- Going part-time and quitting (Phase 10) -----

  // The first day of next week (a Monday). On a Monday, that's a week from today.
  nextMonday: function (state) {
    var t = Game.balance.time;
    return state.day + (t.daysPerWeek - Game.rules.day.dayOfWeek(state.day));
  },

  // Why you can't go part-time right now, or null if you can.
  partTimeProblem: function (state) {
    var b = Game.balance.job;
    var job = state.player.job;
    if (job.status !== 'full') return 'Only a full-time job can go part-time.';
    if (job.pending) return 'You already asked for a change starting ' + Game.rules.day.dateLabel(job.pending.day) + '.';
    if (state.player.reputation < b.partTimeMinReputation) {
      return 'Needs reputation ' + b.partTimeMinReputation + ' (you have ' + Math.floor(state.player.reputation) + ').';
    }
    if (job.standing < b.partTimeMinStanding) {
      return 'Needs job standing ' + b.partTimeMinStanding + ' (you have ' + Math.round(job.standing) + ').';
    }
    return null;
  },

  // Asks to go part-time (Monday, Wednesday, Friday) from next Monday. Returns { state, log }.
  goPartTime: function (state) {
    var problem = Game.rules.job.partTimeProblem(state);
    if (problem) return { state: state, log: [problem] };
    return Game.rules.job.setPending(state, 'part',
      'You\'re going part-time from ' + Game.rules.day.dateLabel(Game.rules.job.nextMonday(state)) + '.');
  },

  // Why you can't quit right now, or null if you can.
  quitProblem: function (state) {
    var job = state.player.job;
    if (job.status === 'none') return 'You don\'t have a day job.';
    if (job.pending && job.pending.status === 'none') return 'You already quit: your last week ends ' + Game.rules.day.dateLabel(job.pending.day - 1) + '.';
    return null;
  },

  // Quits the day job: it ends next Monday (this week's shifts still count). Replaces a pending part-time change.
  // Returns { state, log }.
  quit: function (state) {
    var problem = Game.rules.job.quitProblem(state);
    if (problem) return { state: state, log: [problem] };
    return Game.rules.job.setPending(state, 'none',
      'You quit! Your day job ends ' + Game.rules.day.dateLabel(Game.rules.job.nextMonday(state)) + '.');
  },

  // Saves a job change for next Monday. Plans on the new schedule's free days stay; plans on days you'll
  // still work are untouched. Returns { state, log }.
  setPending: function (state, status, line) {
    var s = Game.util.clone(state);
    s.player.job.pending = { status: status, day: Game.rules.job.nextMonday(s) };
    s = Game.rules.job.dropDaysOffNotNeeded(s).state;
    return { state: s, log: [line] };
  },

  // Why a part-time or quit change can't be cancelled, or null if it can. It can't if something is now
  // booked in the job blocks of a day you'd be working again (a show, studio time, or session work).
  cancelPendingProblem: function (state) {
    if (!state.player.job.pending) return 'There\'s no change to cancel.';
    var s = Game.util.clone(state);
    s.player.job.pending = null;
    var clash = Object.keys(s.schedule).map(Number).filter(function (day) {
      return day >= s.day && Game.rules.job.worksOn(s, day) && Game.rules.job.dayOffNeeded(s, day);
    })[0];
    if (clash !== undefined) return 'You booked something during work hours on ' + Game.rules.day.dateLabel(clash) + '. Cancel it first.';
    return null;
  },

  // "Never mind": cancels a part-time or quit change before it starts. Returns { state, log }.
  cancelPending: function (state) {
    var problem = Game.rules.job.cancelPendingProblem(state);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    s.player.job.pending = null;
    var log = ['Never mind: your job stays as it is.'];
    // Tasks planned in job blocks on days you'll now be working again are removed.
    Object.keys(s.schedule).map(Number).forEach(function (day) {
      if (day >= s.day && Game.rules.job.worksOn(s, day)) {
        var dropped = Game.rules.job.dropPlansInJobBlocks(s, day);
        s = dropped.state;
        log = log.concat(dropped.log);
      }
    });
    return { state: s, log: log };
  },

  // Removes planned days off on days you won't be scheduled to work anymore (a vacation day is given back).
  // Returns { state, log }.
  dropDaysOffNotNeeded: function (state) {
    var s = Game.util.clone(state);
    var job = s.player.job;
    Object.keys(job.daysOff).map(Number).forEach(function (day) {
      if (Game.rules.job.scheduledOn(s, day)) return;
      if (job.daysOff[day] === 'vacation') job.vacationDaysLeft += 1;
      delete job.daysOff[day];
    });
    return { state: s, log: [] };
  },

  // Each morning: a change that starts today takes effect. Quitting is milestone 11 (checked by
  // Game.rules.progress.checkUnlocks). Returns { state, log, changed }.
  applyPending: function (state) {
    var pending = state.player.job.pending;
    if (!pending || state.day < pending.day) return { state: state, log: [], changed: false };
    var s = Game.util.clone(state);
    var job = s.player.job;
    job.status = pending.status;
    job.pending = null;
    if (pending.status === 'none') {
      job.quitDay = s.day;
      job.daysOff = {};
      job.extraShifts = {};
      return { state: s, log: ['You\'re free: no more day job. Every weekday block is yours now.'], changed: true };
    }
    return { state: s, log: ['Part-time starts today: you work ' + Game.rules.job.workdayNames('part') + '.'], changed: true };
  },

  // The days a job works, in words, like "Monday, Wednesday, and Friday".
  workdayNames: function (status) {
    var b = Game.balance.job;
    var days = (status === 'part' ? b.partTimeDays : b.fullTimeDays).map(function (d) { return Game.content.calendar.dayNames[d]; });
    return days.length > 1 ? days.slice(0, -1).join(', ') + ', and ' + days[days.length - 1] : days.join('');
  },

  // ----- The quit screen -----

  // Music income for one week of the ledger (or this week's running totals): gig pay, tips, merch,
  // streaming, and session work. Not the day job, overtime, loans, or lucky events.
  musicIncome: function (week) {
    return Game.balance.job.musicIncomeCategories.reduce(function (sum, key) { return sum + (week.income[key] || 0); }, 0);
  },

  // What the quit confirm screen shows: your last (up to) 4 finished weeks of music income next to
  // that week's bills, the average, your weekly bills now, and the job pay you'd give up.
  // Returns { weeks: [{ week, music, bills }], averageMusic, weeklyBills, jobPayPerWeek, coversShare }
  // (coversShare: how much of your weekly bills music covers on average, 0.6 = 60%).
  quitSummary: function (state) {
    var b = Game.balance;
    var weeks = state.ledger.slice(-b.job.quitScreenIncomeWeeks).map(function (w) {
      return { week: w.week, music: Game.rules.job.musicIncome(w), bills: w.costs.bills || 0 };
    });
    var total = weeks.reduce(function (sum, w) { return sum + w.music; }, 0);
    var averageMusic = weeks.length ? Math.round(total / weeks.length) : 0;
    var weeklyBills = b.housing[state.player.housing].weeklyCost;
    var status = state.player.job.status;
    var shifts = status === 'none' ? 0 : (status === 'part' ? b.job.partTimeDays.length : b.job.fullTimeDays.length);
    return {
      weeks: weeks,
      averageMusic: averageMusic,
      weeklyBills: weeklyBills,
      jobPayPerWeek: shifts * b.job.payPerShift,
      coversShare: weeklyBills > 0 ? averageMusic / weeklyBills : 0
    };
  },

  // True if you'll actually be at work that day (scheduled, and not taking it off).
  worksOn: function (state, day) {
    return Game.rules.job.scheduledOn(state, day) && !state.player.job.daysOff[day];
  },

  // True if the day's shift gets paid: worked days and vacation days (sick and skipped days aren't paid).
  paidOn: function (state, day) {
    var off = state.player.job.daysOff[day];
    return Game.rules.job.scheduledOn(state, day) && (!off || off === 'vacation');
  },

  // Why you can't take this day off this way, or null if you can.
  // kind: 'vacation' | 'sick' | 'skip'. forShow: true when it's for a booked show (sick is allowed any day ahead).
  dayOffProblem: function (state, day, kind, forShow) {
    var b = Game.balance.job;
    var ahead = day - state.day;
    if (ahead < 0) return 'That day has already passed.';
    if (!Game.rules.job.scheduledOn(state, day)) return 'You don\'t work that day.';
    if (state.player.job.daysOff[day]) return 'You already have that day off.';
    if (kind === 'vacation') {
      if (ahead < b.vacationNoticeDays) return 'Vacation needs ' + b.vacationNoticeDays + ' days\' notice (that\'s ' + ahead + ' days away).';
      if (state.player.job.vacationDaysLeft <= 0) return 'No vacation days left this year.';
    }
    if (kind === 'sick' && !forShow && ahead > b.sickNoticeDays) return 'You can only call in sick for ' + Game.rules.job.sickWindowText() + '.';
    return null;
  },

  // When you're allowed to call in sick, in words: "today or tomorrow" (or "today or up to N days ahead").
  sickWindowText: function () {
    var days = Game.balance.job.sickNoticeDays;
    return days === 1 ? 'today or tomorrow' : 'today or up to ' + days + ' days ahead';
  },

  // Takes a day off. Vacation uses one of your vacation days now (and is paid);
  // sick (-15 standing) and skip (-25) cost standing on the day itself.
  // If it isn't allowed, the state comes back unchanged with the reason. Returns { state, log }.
  takeDayOff: function (state, day, kind, forShow) {
    var problem = Game.rules.job.dayOffProblem(state, day, kind, forShow);
    if (problem) return { state: state, log: [problem] };
    var s = Game.util.clone(state);
    s.player.job.daysOff[day] = kind;
    if (kind === 'vacation') s.player.job.vacationDaysLeft -= 1;
    return { state: s, log: [] };
  },

  // Undoes a planned day off (a vacation day is given back). Returns { state, log }.
  cancelDayOff: function (state, day) {
    var s = Game.util.clone(state);
    var kind = s.player.job.daysOff[day];
    if (!kind || day < s.day) return { state: state, log: [] };
    if (kind === 'vacation') s.player.job.vacationDaysLeft += 1;
    delete s.player.job.daysOff[day];
    // Tasks you planned in the job blocks that day can't happen now that you're working.
    return Game.rules.job.dropPlansInJobBlocks(s, day);
  },

  // True if a booked show, studio session, session work, or a trip (travelling or being away) sits in that
  // day's job blocks (so the day off is needed).
  dayOffNeeded: function (state, day) {
    var plan = state.schedule[day] || {};
    return Game.balance.job.jobBlocks.some(function (block) {
      var e = plan[block] && state.entries[plan[block]];
      return (!!e && (e.type === 'gig' || e.type === 'studio' || e.type === 'sessionWork' || e.type === 'travel')) ||
        !!Game.rules.travel.tripAt(state, day, block);
    });
  },

  // Why a planned day off can't be undone, or null if it can.
  undoDayOffProblem: function (state, day) {
    if (!state.player.job.daysOff[day]) return 'That isn\'t a day off.';
    if (day < state.day) return 'That day is already over.';
    if (Game.rules.job.dayOffNeeded(state, day)) return 'A booked show or studio session needs that day off.';
    return null;
  },

  // The player undoes a day off from the Calendar (only if nothing booked needs it). Returns { state, log }.
  undoDayOff: function (state, day) {
    var problem = Game.rules.job.undoDayOffProblem(state, day);
    if (problem) return { state: state, log: [problem] };
    return Game.rules.job.cancelDayOff(state, day);
  },

  // Removes tasks planned in the job blocks on a day you'll now be working. Returns { state, log }.
  dropPlansInJobBlocks: function (state, day) {
    var s = Game.util.clone(state);
    var log = [];
    var plan = s.schedule[day] || {};
    Game.balance.job.jobBlocks.forEach(function (block) {
      var e = plan[block] && s.entries[plan[block]];
      if (e && e.type === 'action') {
        log.push('Removed your planned ' + Game.content.actions[e.actionId].name + ' (' + Game.content.calendar.blockNames[block] + '): you\'re working.');
        delete s.entries[plan[block]];
        delete plan[block];
      }
    });
    return { state: s, log: log };
  },

  // Changes job standing (kept between 0 and 100). Below 25 your boss warns you; at 0 you're fired.
  // Returns { state, log }.
  changeStanding: function (state, amount) {
    var b = Game.balance.job;
    var s = Game.util.clone(state);
    var job = s.player.job;
    var before = job.standing;
    job.standing = Game.util.clamp(job.standing + amount, 0, b.maxStanding);
    var log = [];
    if (job.standing <= b.firedStanding && job.status !== 'none') {
      job.status = 'none';
      job.pending = null;
      job.daysOff = {};
      log.push('You\'re fired. Your boss had enough. (Use Look for work to find a new job.)');
    } else if (job.standing < b.warningStanding && before >= b.warningStanding) {
      log.push('Your boss warned you: one more slip and you\'re out. (Job standing ' + Math.round(job.standing) + ')');
    }
    return { state: s, log: log };
  },

  // Runs at End Day for a scheduled day you took off: pays a vacation day, or costs standing
  // for a sick or skipped day. Returns { state, log }.
  resolveDayOff: function (state) {
    var b = Game.balance.job;
    var s = Game.util.clone(state);
    var kind = s.player.job.daysOff[s.day];
    delete s.player.job.daysOff[s.day];
    if (kind === 'vacation') {
      s.player.job.unpaidShifts += 1;
      return { state: s, log: ['Vacation day (paid).'] };
    }
    var change = kind === 'sick' ? b.sickDayPenalty : b.skipPenalty;
    var r = Game.rules.job.changeStanding(s, change);
    return {
      state: r.state,
      log: [(kind === 'sick' ? 'Called in sick' : 'Skipped work') + ': ' + change + ' job standing (now ' + Math.round(r.state.player.job.standing) + ').'].concat(r.log)
    };
  },

  // Look for work: a 50% chance to land a part-time job (Mon/Wed/Fri) starting next Monday.
  // Returns { state, log, found }.
  lookForWork: function (state) {
    var b = Game.balance;
    var s = Game.util.clone(state);
    var rng = Game.rng.create(s.rngState);
    var found = rng.chance(b.job.lookForWorkChance);
    s.rngState = rng.getState();
    if (!found) return { state: s, log: ['No luck finding work today.'], found: false };
    var nextMonday = Game.rules.job.nextMonday(s);
    s.player.job.status = 'part';
    s.player.job.startsDay = nextMonday;
    s.player.job.standing = b.job.startStanding;
    return { state: s, log: ['You landed a part-time job (Mon/Wed/Fri), starting next Monday!'], found: true };
  }
};
