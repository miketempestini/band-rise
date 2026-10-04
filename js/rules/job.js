// job.js
// Rules for the day job: which days you work, days off (vacation, calling in sick, skipping),
// job standing (how your boss sees you), getting fired, and finding work again.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.job = {

  // True if your job expects you on this day (before any day off is counted).
  scheduledOn: function (state, day) {
    var job = state.player.job;
    if (job.status !== 'none' && job.extraShifts && job.extraShifts[day]) return true; // an overtime shift
    if (job.startsDay !== null && day < job.startsDay) return false;
    return Game.rules.day.isWorkday(state, Game.rules.day.dayOfWeek(day));
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

  // True if a booked show or studio session sits in that day's job blocks (so the day off is needed).
  dayOffNeeded: function (state, day) {
    var plan = state.schedule[day] || {};
    return Game.balance.job.jobBlocks.some(function (block) {
      var e = plan[block] && state.entries[plan[block]];
      return !!e && (e.type === 'gig' || e.type === 'studio');
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
    var nextMonday = s.day + (b.time.daysPerWeek - Game.rules.day.dayOfWeek(s.day));
    s.player.job.status = 'part';
    s.player.job.startsDay = nextMonday;
    s.player.job.standing = b.job.startStanding;
    return { state: s, log: ['You landed a part-time job (Mon/Wed/Fri), starting next Monday!'], found: true };
  }
};
