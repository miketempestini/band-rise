// day.js
// Rules for the calendar and for ending the day.

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.day = {

  // Which day of the week it is: 0 = Monday ... 6 = Sunday.
  dayOfWeek: function (day) {
    return day % Game.balance.time.daysPerWeek;
  },

  // ----- Real dates -----
  // The game counts days from 0. Day 0 is the start date in balance.time.startDate (Monday, January 5, 2026),
  // and each day after is the next calendar day. Dates are worked out in UTC so they never shift with time zones.

  // A day as a real date: { year, month (0 = January), date (1 to 31), dayOfWeek (0 = Monday) }.
  date: function (day) {
    var start = Game.balance.time.startDate;
    var msPerDay = 24 * 60 * 60 * 1000;
    var d = new Date(Date.UTC(start.year, start.month - 1, start.day) + day * msPerDay);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), date: d.getUTCDate(), dayOfWeek: Game.rules.day.dayOfWeek(day) };
  },

  // The short name of a month or weekday, like "Mar" or "Sat".
  shortName: function (name) { return name.slice(0, 3); },

  // A day as words, like "Saturday, March 14" (used in messages and on screens).
  dateLabel: function (day) {
    var d = Game.rules.day.date(day);
    var c = Game.content.calendar;
    return c.dayNames[d.dayOfWeek] + ', ' + c.monthNames[d.month] + ' ' + d.date;
  },

  // The full date with the year, like "Monday, January 5, 2026" (the top bar and the Career screen).
  longDate: function (day) {
    return Game.rules.day.dateLabel(day) + ', ' + Game.rules.day.date(day).year;
  },

  // A short date, like "Sat, Mar 14" (date buttons and the calendar).
  shortDate: function (day) {
    var d = Game.rules.day.date(day);
    var c = Game.content.calendar;
    var sn = Game.rules.day.shortName;
    return sn(c.dayNames[d.dayOfWeek]) + ', ' + sn(c.monthNames[d.month]) + ' ' + d.date;
  },

  // The Monday-to-Sunday week a day is in, like "Mar 9 – 15" or "Mar 30 – Apr 5".
  weekLabel: function (day) {
    var monday = day - Game.rules.day.dayOfWeek(day);
    var a = Game.rules.day.date(monday);
    var b = Game.rules.day.date(monday + Game.balance.time.daysPerWeek - 1);
    var sn = Game.rules.day.shortName;
    var months = Game.content.calendar.monthNames;
    return sn(months[a.month]) + ' ' + a.date + ' – ' + (b.month === a.month ? '' : sn(months[b.month]) + ' ') + b.date;
  },

  // A span of days, like "January 5 – February 1".
  spanLabel: function (fromDay, toDay) {
    var months = Game.content.calendar.monthNames;
    var a = Game.rules.day.date(fromDay);
    var b = Game.rules.day.date(toDay);
    return months[a.month] + ' ' + a.date + ' – ' + months[b.month] + ' ' + b.date + (b.year !== a.year ? ', ' + b.year : '');
  },

  // True on New Year's Day (January 1).
  isNewYear: function (day) {
    var d = Game.rules.day.date(day);
    return d.month === 0 && d.date === 1;
  },

  // The Monday that starts week number N of the career.
  firstDayOfWeek: function (week) {
    return (week - 1) * Game.balance.time.daysPerWeek;
  },

  // Which week of the career it is, starting at 1 (for counting weeks, not for showing dates).
  weekNumber: function (day) {
    return Math.floor(day / Game.balance.time.daysPerWeek) + 1;
  },

  // True if the day job needs the player on this day of the week.
  // status: optional ('full' | 'part' | 'none'); leave it out to use the job you have now.
  isWorkday: function (state, dayOfWeek, status) {
    var job = Game.balance.job;
    if (status === undefined) status = state.player.job.status;
    if (status === 'full') return job.fullTimeDays.indexOf(dayOfWeek) !== -1;
    if (status === 'part') return job.partTimeDays.indexOf(dayOfWeek) !== -1;
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

    var bills = Game.rules.housing.weeklyBills(state);
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
    var before = Game.rules.day.snapshot(s); // for the "Previous day" summary on Today
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
      } else if (entry && entry.type === 'travel') {
        // Travel to or from an out-of-town show. Leaving home at 0 energy (or without a van the trip needs)
        // means you don't go: every show on that trip is a no-show.
        var travel = Game.rules.travel.travelBlock(s, entry, s.player.energy);
        s = travel.state;
        if (travel.stranded) {
          title = 'Stayed home';
          lines = lines.concat(travel.log);
        } else {
          title = entry.to === 'hometown' ? 'Driving home' : 'Travel to ' + Game.content.cities[entry.to].name;
          didWork = true;
          s.player.energy = Game.rules.energy.clamp(s.player.energy - b.travel.energyPerBlock);
          lines = lines.concat(travel.log);
          lines.push('-' + b.travel.energyPerBlock + ' energy.');
          if (s.player.energy === 0 && !exhausted) {
            exhausted = true;
            lines.push('The drive drained you to 0 energy. You\'re Exhausted.');
          }
        }
      } else if (entry && entry.type === 'sessionWork') {
        // Session work on another band's recording: a commitment. At 0 energy you miss it.
        title = 'Session work: ' + s.sessionWork[entry.workId].bandName;
        var energyAtSession = s.player.energy;
        var session = Game.rules.sessionWork.playSession(s, entry, energyAtSession);
        s = session.state;
        if (!session.missed) {
          didWork = true;
          s.player.energy = Game.rules.energy.clamp(s.player.energy - b.energy.cost.sessionWork);
          session.log[0] = session.log[0].replace(/\.$/, '') + ', -' + b.energy.cost.sessionWork + ' energy.';
          if (s.player.energy === 0 && !exhausted) {
            exhausted = true;
            session.log.push('The session drained you to 0 energy. You\'re Exhausted.');
          }
        }
        lines = lines.concat(session.log);
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
        var done = Game.rules.actions.perform(s, actionId, entry.songId, entry.songIds, entry.personId, entry.request, entry.cityIds);
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
    // On the road: a hotel if you're away tonight, and road fatigue from day 5.
    var road = Game.rules.travel.nightly(s);
    s = road.state;
    road.log.forEach(function (line) { endLines.push(line); });
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
      // Streaming money (and session credits) comes in first, so it can help cover the bills.
      var streaming = Game.rules.recording.payStreaming(s);
      s = streaming.state;
      streaming.log.forEach(function (line) { endLines.push(line); });
      var credits = Game.rules.sessionWork.payCredits(s);
      s = credits.state;
      credits.log.forEach(function (line) { endLines.push(line); });
      var bills = Game.rules.housing.weeklyBills(s); // your home, plus the vacation home if you own one
      var paid = Game.rules.money.spend(s, bills, 'bills');
      s = paid.state;
      endLines.push('Paid $' + bills.toLocaleString() + ' for rent and living costs.');
      paid.log.forEach(function (line) { endLines.push(line); });

      // Cities you haven't played (or released music) in for 30 days lose some fans.
      var faded = Game.rules.audience.fadeFans(s);
      s = faded.state;
      faded.log.forEach(function (line) { endLines.push(line); });

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
    // Your manager posts for the band every night (after the fade, so it holds buzz up).
    var posts = Game.rules.manager.dailyPosts(s);
    s = posts.state;
    posts.log.forEach(function (line) { endLines.push(line); });

    // Anything newly unlocked or achieved (like small rooms at reputation 10) gets a banner on Today
    // (checked before the day moves forward, so it's dated the day it happened).
    var unlocked = Game.rules.progress.checkUnlocks(s);
    s = unlocked.state;
    unlocked.milestoneLog.forEach(function (line) { endLines.push(line); });

    // On to tomorrow. A job change you asked for (part-time or quitting) starts on its Monday;
    // quitting is a milestone, so it's checked again right away.
    s.day += 1;
    var jobChange = Game.rules.job.applyPending(s);
    s = jobChange.state;
    jobChange.log.forEach(function (line) { endLines.push(line); });
    if (jobChange.changed) {
      var quitMilestone = Game.rules.progress.checkUnlocks(s);
      s = quitMilestone.state;
      quitMilestone.milestoneLog.forEach(function (line) { endLines.push(line); });
    }

    // Check for rusty skills.
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
    // Session work: songs you played on may come out, and a new offer may arrive.
    var released = Game.rules.sessionWork.processReleases(s);
    s = released.state;
    released.log.forEach(function (line) { endLines.push(line); });
    var sessionOffer = Game.rules.sessionWork.roll(s);
    s = sessionOffer.state;
    sessionOffer.log.forEach(function (line) { endLines.push(line); });
    // The big time: your manager books "yes" replies, plans tours, and emails venues on Mondays; manager,
    // label, arena, and festival offers may arrive; and in December, awards season.
    [Game.rules.manager.processAds, Game.rules.manager.autoAccept, Game.rules.manager.offerCheck, Game.rules.label.offerCheck,
      Game.rules.manager.processTourRequests, Game.rules.bigShows.roll, Game.rules.manager.autoBook, Game.rules.awards.check].forEach(function (rule) {
      var r = rule(s);
      s = r.state;
      r.log.forEach(function (line) { endLines.push(line); });
    });
    var expired = Game.rules.booking.expireOffers(s);
    s = expired.state;
    expired.log.forEach(function (line) { endLines.push(line); });

    // A new year of vacation days.
    if (day.isNewYear(s.day)) {
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

    report.summary = Game.rules.day.summary(before, s, report);
    s.lastDayReport = report;

    // A flat list of everything that happened, for tests and simple displays.
    var log = [];
    report.blocks.forEach(function (row) {
      row.lines.forEach(function (line) { log.push(Game.content.calendar.blockNames[row.block] + ', ' + row.title + ': ' + line); });
    });
    log = log.concat(report.overnight);

    return { state: s, log: log, weekEnded: weekEnded };
  },

  // ----- The "Previous day" summary (shown on Today after End Day) -----

  // What the summary compares against: noted at the start of End Day.
  snapshot: function (state) {
    return {
      cash: state.player.cash, debt: state.player.loanOwed, energy: state.player.energy, morale: state.player.morale,
      inboxIds: state.inbox.map(function (m) { return m.id; }),
      peopleIds: Object.keys(state.people),
      memberIds: state.band.memberIds.slice(),
      milestoneIds: Object.keys(state.milestones)
    };
  },

  // The day's summary: cash, energy, and morale before and after, and the big moments.
  // Returns { cash: { before, after }, energy: { before, after }, morale: { before, after }, highlights: [{ icon, text }] }.
  summary: function (before, state, report) {
    return {
      cash: { before: before.cash, after: state.player.cash },
      energy: { before: before.energy, after: state.player.energy },
      morale: { before: before.morale, after: state.player.morale },
      highlights: Game.rules.day.summaryHighlights(before, state, report)
    };
  },

  // The big moments of a day, in order: a gig (or a no-show), milestones, songs finished, new messages,
  // people met, bandmates joining or leaving, and loans from Mom and Dad. Returns [{ icon, text }].
  summaryHighlights: function (before, state, report) {
    var list = [];
    var add = function (icon, text) { list.push({ icon: icon, text: text }); };
    var venues = Game.content.venues;

    // The gig.
    var g = state.lastGig;
    if (report.gig && g && g.day === report.day) {
      var fans = g.rewards ? g.rewards.fans : 0;
      add('🎤', g.result.charAt(0).toUpperCase() + g.result.slice(1) + (g.kind === 'openMic' ? ' set at ' : ' show at ') + g.venueName + ': ' +
        g.crowd + ' people, +' + fans + ' fan' + (fans === 1 ? '' : 's') + '.');
    }
    (report.blocks || []).forEach(function (row) { if (row.title === 'No-show') add('🚫', row.lines[0] || 'No-show.'); });

    // Milestones reached.
    Game.content.milestones.forEach(function (m) {
      if (state.milestones[m.id] !== undefined && before.milestoneIds.indexOf(m.id) === -1) add('🏆', 'Milestone ' + m.number + ': ' + m.name + '!');
    });

    // Songs finished.
    (report.finishedSongs || []).forEach(function (id) {
      if (state.songs[id]) add('🎵', 'You finished a song: "' + state.songs[id].title + '".');
    });

    // New messages.
    state.inbox.forEach(function (m) {
      if (before.inboxIds.indexOf(m.id) !== -1) return;
      var label = Game.rules.day.messageLabel(state, m);
      if (label) add(m.kind === 'event' ? '⚡' : '📬', label);
    });

    // People.
    Object.keys(state.people).forEach(function (id) {
      if (before.peopleIds.indexOf(id) === -1) add('👋', 'You met ' + state.people[id].name + ' (' + Game.content.roles[state.people[id].role].person + ').');
    });
    state.band.memberIds.forEach(function (id) {
      if (before.memberIds.indexOf(id) === -1) add('🎸', state.people[id].name + ' joined the band.');
    });
    before.memberIds.forEach(function (id) {
      if (state.band.memberIds.indexOf(id) === -1 && state.people[id]) add('💔', state.people[id].name + ' left the band.');
    });

    // Loans.
    if (state.player.loanOwed > before.debt) add('💸', 'Mom and Dad lent you $' + (state.player.loanOwed - before.debt).toLocaleString() + '.');
    return list;
  },

  // A short label for a new Inbox message, like "The Basement said yes" or "Tour proposal". Null to skip it.
  messageLabel: function (state, m) {
    var d = m.data;
    var venue = d.venueId && Game.content.venues[d.venueId];
    switch (m.kind) {
      case 'reply': return venue.name + (d.yes ? ' said yes! Accept it in your Inbox.' : ' said no.');
      case 'event': return d.title + '.';
      case 'opening': return 'Opening slot offer: ' + venue.name + '.';
      case 'residency': return 'Residency offer: ' + venue.name + '.';
      case 'sessionWork': return 'Session work offer from ' + d.bandName + '.';
      case 'sessionRelease': return 'A song you played on came out.';
      case 'managerOffer': return 'A manager wants to work with you.';
      case 'labelOffer': return 'A label wants to sign you.';
      case 'tourProposal': return 'Your tour proposal is ready.';
      case 'arenaOffer': return 'Arena offer: ' + venue.name + '.';
      case 'festivalOffer': return 'Festival offer: ' + venue.name + '.';
      case 'note': return d.title.replace(/^\W+/, '') + '.';
      default: return null;
    }
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
