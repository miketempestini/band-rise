// dayjob.test.js
// Tests for Phase 10, the day job arc: going part-time, quitting (and its confirm screen math),
// session work (offers, sessions, and the streaming share), Plan week and week templates,
// and milestones 8 (Part-time) and 11 (Quit the day job).

// Wrapped in a function so the helpers below stay private to this file (no extra globals).
(function () {

  function freshState(seed) {
    var s = Game.rules.career.startCareer('Test', 'guitar', seed || 1).state;
    s.player.morale = 50;
    return s;
  }

  // Ends days until the given day, answering any event with its safe choice along the way.
  function playUntil(s, day) {
    while (s.day < day) {
      s.pendingEvent = null;
      s = Game.rules.day.endDay(s).state;
    }
    return s;
  }

  // A week from the ledger with only the money parts the quit screen reads.
  function week(n, income, bills) {
    return { week: n, income: income, costs: { bills: bills }, loans: 0, paidBack: 0 };
  }

  // A finished session work job you played every session of (released on releaseDay).
  function creditedWork(s, id, bandFans, quality, releaseDay) {
    s.sessionWork[id] = { id: id, bandName: 'The Test Band', songTitle: 'Test Song', fee: 150, quality: quality, bandFans: bandFans,
      sessions: 3, played: 3, missed: 0, status: 'done', releaseDay: releaseDay, announced: true };
    return s;
  }

  // ----- Going part-time -----

  Game.test('Part-time: needs reputation 20 and job standing 50, and only a full-time job', function (t) {
    var s = freshState();
    s.player.reputation = 19;
    t.ok(Game.rules.job.partTimeProblem(s).indexOf('reputation') !== -1, 'reputation 19: not yet');
    s.player.reputation = 20;
    s.player.job.standing = 49;
    t.ok(Game.rules.job.partTimeProblem(s).indexOf('standing') !== -1, 'standing 49: not yet');
    s.player.job.standing = 50;
    t.equal(Game.rules.job.partTimeProblem(s), null, 'reputation 20, standing 50: OK');
    s.player.job.status = 'part';
    t.ok(Game.rules.job.partTimeProblem(s), 'already part-time');
  });

  Game.test('Part-time: starts next Monday; the schedule becomes Monday, Wednesday, Friday', function (t) {
    var s = freshState();
    s.player.reputation = 20;
    s.day = 2; // a Wednesday
    var r = Game.rules.job.goPartTime(s);
    t.sameContents(r.state.player.job.pending, { status: 'part', day: 7 }, 'waits for next Monday');
    t.equal(r.state.player.job.status, 'full', 'still full-time this week');
    t.ok(Game.rules.job.scheduledOn(r.state, 3), 'this Thursday: still working');
    t.ok(Game.rules.job.scheduledOn(r.state, 7), 'next Monday: working');
    t.equal(Game.rules.job.scheduledOn(r.state, 8), false, 'next Tuesday: free');
    t.ok(Game.rules.job.scheduledOn(r.state, 9), 'next Wednesday: working');
    t.equal(Game.rules.job.scheduledOn(r.state, 10), false, 'next Thursday: free');
    t.equal(Game.rules.job.goPartTime(s).state.player.job.pending.day, 7, 'asked on a Wednesday: next Monday');
    var monday = Game.util.clone(s);
    monday.day = 7;
    t.equal(Game.rules.job.goPartTime(monday).state.player.job.pending.day, 14, 'asked on a Monday: a week later');
  });

  Game.test('Part-time pay: a full week is $550, a part-time week is 3 shifts = $330', function (t) {
    var s = freshState();
    s.player.reputation = 20;
    s = Game.rules.job.goPartTime(s).state;
    s = playUntil(s, 14); // two full weeks
    t.equal(s.player.job.status, 'part', 'part-time now');
    t.equal(s.ledger[0].income.dayJob, 5 * Game.balance.job.payPerShift, 'week 1 (full-time): $550');
    t.equal(s.ledger[0].shiftsWorked, 5, '5 shifts');
    t.equal(s.ledger[1].income.dayJob, 3 * Game.balance.job.payPerShift, 'week 2 (part-time): $330');
    t.equal(s.ledger[1].shiftsWorked, 3, '3 shifts');
  });

  Game.test('Milestone 8: Part-time fires at reputation 20 and job standing 50 while full-time', function (t) {
    var s = freshState();
    s.player.reputation = 19;
    t.equal(Game.rules.progress.checkUnlocks(s).state.milestones.partTime, undefined, 'reputation 19: no');
    s.player.reputation = 20;
    var r = Game.rules.progress.checkUnlocks(s);
    t.ok(r.state.milestones.partTime !== undefined, 'reached');
    t.ok(r.state.toasts.some(function (x) { return x.id === 'partTime' && x.text.indexOf('+10 morale') !== -1; }), 'banner, +10 morale');
  });

  // ----- Quitting -----

  Game.test('Quit screen math: the last 4 weeks of music income next to bills, the average, and the job pay', function (t) {
    var s = freshState();
    s.ledger = [
      week(1, { dayJob: 550, tips: 100 }, 400),                        // too old: not shown
      week(2, { dayJob: 550, tips: 20, gigPay: 80 }, 400),             // music 100
      week(3, { dayJob: 550, overtime: 165, gigPay: 150, merch: 50 }, 400), // music 200 (overtime doesn't count)
      week(4, { dayJob: 550, streaming: 30, sessionWork: 270, events: 40 }, 400), // music 300 (events don't count)
      week(5, { dayJob: 550, sessionCredits: 4, gigPay: 196 }, 400)    // music 200
    ];
    var q = Game.rules.job.quitSummary(s);
    t.sameContents(q.weeks.map(function (w) { return w.week; }), [2, 3, 4, 5], 'the last 4 weeks');
    t.sameContents(q.weeks.map(function (w) { return w.music; }), [100, 200, 300, 200], 'music income each week');
    t.sameContents(q.weeks.map(function (w) { return w.bills; }), [400, 400, 400, 400], 'bills each week');
    t.equal(q.averageMusic, 200, 'average $200');
    t.equal(q.weeklyBills, 400, 'bills now $400');
    t.equal(q.jobPayPerWeek, 550, 'full-time pay $550');
    t.near(q.coversShare, 0.5, 'music covers half the bills');
    s.player.job.status = 'part';
    t.equal(Game.rules.job.quitSummary(s).jobPayPerWeek, 330, 'part-time pay $330');
  });

  Game.test('Quit screen math: fewer than 4 weeks shows what there is; none shows nothing', function (t) {
    var s = freshState();
    t.equal(Game.rules.job.quitSummary(s).weeks.length, 0, 'no weeks yet');
    t.equal(Game.rules.job.quitSummary(s).averageMusic, 0, 'average 0');
    s.ledger = [week(1, { tips: 15 }, 400), week(2, { tips: 30, gigPay: 60 }, 400)];
    var q = Game.rules.job.quitSummary(s);
    t.equal(q.weeks.length, 2, '2 weeks');
    t.equal(q.averageMusic, 53, '(15 + 90) / 2, rounded');
  });

  Game.test('Quitting: the job ends next Monday, frees every block, and is milestone 11 (+15 morale)', function (t) {
    var s = freshState();
    s.day = 2; // Wednesday
    s = Game.rules.job.takeDayOff(Game.util.clone(s), 18, 'vacation').state; // a vacation day after quitting
    var vacation = s.player.job.vacationDaysLeft;
    s = Game.rules.job.quit(s).state;
    t.sameContents(s.player.job.pending, { status: 'none', day: 7 }, 'ends next Monday');
    t.ok(Game.rules.job.scheduledOn(s, 4), 'this Friday: still working');
    t.equal(Game.rules.job.scheduledOn(s, 7), false, 'next Monday: free');
    t.equal(s.player.job.daysOff[18], undefined, 'the vacation day after quitting is dropped');
    t.equal(s.player.job.vacationDaysLeft, vacation + 1, '...and given back');
    t.ok(Game.rules.job.quitProblem(s), 'can\'t quit twice');

    s = playUntil(s, 7);
    t.equal(s.player.job.status, 'none', 'no job');
    t.equal(s.player.job.quitDay, 7, 'quit on Monday');
    t.equal(s.milestones.quitJob, 7, 'milestone 11 dated Monday');
    t.ok(s.toasts.some(function (x) { return x.id === 'quitJob' && x.text.indexOf('+' + Game.balance.job.quitMoraleBonus + ' morale') !== -1; }), 'banner, +15 morale');
    t.equal(Game.rules.day.isJobBlock(s, 'morning'), false, 'Monday morning is free');
    t.equal(s.ledger[0].income.dayJob, 3 * Game.balance.job.payPerShift, 'the last week (Wednesday to Friday) was still paid');
  });

  Game.test('Never mind: a part-time or quit change can be cancelled before Monday (unless something is booked in work hours)', function (t) {
    var s = freshState();
    s = Game.rules.job.quit(s).state;
    var undone = Game.rules.job.cancelPending(s).state;
    t.equal(undone.player.job.pending, null, 'cancelled');
    t.ok(Game.rules.job.scheduledOn(undone, 8), 'working next Tuesday again');

    // Booked an in-store show on a work afternoon after quitting: can't take the quit back now.
    var booked = Game.rules.offers.bookShow(s, 'hollowRecords', 9, 'inStore').state;
    t.ok(Game.rules.job.cancelPendingProblem(booked), 'a show in work hours blocks it');
    t.equal(Game.rules.job.cancelPending(booked).state.player.job.pending.status, 'none', 'still quitting');
  });

  // ----- Session work -----

  Game.test('Session work: offers need Musicianship 40 and reputation 20', function (t) {
    var w = Game.balance.sessionWork;
    var s = freshState();
    s.player.skills.musicianship = w.minMusicianship;
    s.player.reputation = w.minReputation - 1;
    t.equal(Game.rules.sessionWork.eligible(s), false, 'reputation too low');
    s.player.reputation = w.minReputation;
    t.equal(Game.rules.sessionWork.eligible(s), true, 'eligible');
    s.player.skills.musicianship = w.minMusicianship - 1;
    t.equal(Game.rules.sessionWork.eligible(s), false, 'Musicianship too low');
    var offers = 0;
    for (var seed = 1; seed <= 30; seed++) {
      var m = Game.util.clone(s);
      m.rngState = seed;
      offers += Game.rules.sessionWork.roll(m).state.inbox.length;
    }
    t.equal(offers, 0, 'no offers while not eligible');
  });

  Game.test('Session work: an offer is 3 sessions over 2 to 4 days, 3 to 10 days out, never in work hours, for a round fee', function (t) {
    var w = Game.balance.sessionWork;
    for (var seed = 1; seed <= 20; seed++) {
      var s = freshState(seed);
      var r = Game.rules.sessionWork.roll(s, true);
      var m = r.state.inbox[r.state.inbox.length - 1];
      t.equal(m.kind, 'sessionWork', 'offer arrived (seed ' + seed + ')');
      var d = m.data;
      var days = d.sessions.map(function (x) { return x.day; }).filter(function (day, i, all) { return all.indexOf(day) === i; });
      t.equal(d.sessions.length, w.sessions, '3 sessions');
      t.ok(days.length >= w.days.min && days.length <= Math.min(w.days.max, w.sessions), days.length + ' different days');
      t.ok(d.sessions.every(function (x) { return x.day - s.day >= w.daysAhead.min && x.day - s.day <= w.daysAhead.max; }), '3 to 10 days out');
      t.ok(d.sessions.every(function (x) { return !(Game.rules.job.scheduledOn(s, x.day) && Game.balance.job.jobBlocks.indexOf(x.block) !== -1); }), 'not in work hours');
      t.ok(d.fee % w.feeRoundTo === 0 && d.fee >= w.fee.min && d.fee <= w.fee.max, '$' + d.fee);
      t.ok(m.expiresDay < d.sessions[0].day, 'answer before the first session');
    }
  });

  Game.test('Session work: accepting books every session (replacing planned tasks); cancelling removes them', function (t) {
    var s = freshState();
    s = Game.rules.sessionWork.roll(s, true).state;
    var m = s.inbox[s.inbox.length - 1];
    var first = m.data.sessions[0];
    s = Game.rules.actions.plan(s, first.block, 'rest', null, first.day).state;
    var r = Game.rules.sessionWork.accept(s, m.id);
    var entries = Object.keys(r.state.entries).map(function (id) { return r.state.entries[id]; }).filter(function (e) { return e.type === 'sessionWork'; });
    t.equal(entries.length, 3, '3 sessions on the calendar');
    t.equal(r.state.entries[r.state.schedule[first.day][first.block]].type, 'sessionWork', 'the planned Rest gave way');
    t.equal(r.state.inbox[r.state.inbox.length - 1].resolved, 'accepted', 'offer accepted');
    t.ok(Game.rules.actions.plan(r.state, first.block, 'rest', null, first.day).log.length, 'can\'t plan over a session');
    var workId = entries[0].workId;
    var cancelled = Game.rules.sessionWork.cancel(r.state, workId).state;
    t.equal(Object.keys(cancelled.entries).filter(function (id) { return cancelled.entries[id].type === 'sessionWork'; }).length, 0, 'sessions removed');
    t.equal(cancelled.sessionWork[workId].status, 'cancelled', 'cancelled');
  });

  Game.test('Session work: sessions pay their fee and build Musicianship at End Day; the song comes out 2 to 6 weeks later', function (t) {
    var w = Game.balance.sessionWork;
    var s = freshState();
    s = Game.rules.sessionWork.roll(s, true).state;
    var m = s.inbox[s.inbox.length - 1];
    s = Game.rules.sessionWork.accept(s, m.id).state;
    var workId = Object.keys(s.sessionWork)[0];
    var musicianship = s.player.skills.musicianship;
    var lastDay = m.data.sessions[m.data.sessions.length - 1].day;
    s = playUntil(s, lastDay + 1);
    var work = s.sessionWork[workId];
    t.equal(work.played, 3, 'played all 3');
    t.equal(work.status, 'done', 'done');
    t.ok(s.player.skills.musicianship > musicianship, 'Musicianship grew');
    var paid = s.ledger.concat([s.thisWeek]).reduce(function (sum, wk) { return sum + (wk.income.sessionWork || 0); }, 0);
    t.equal(paid, 3 * m.data.fee, 'paid 3 x $' + m.data.fee);
    var weeks = (work.releaseDay - lastDay) / Game.balance.time.daysPerWeek;
    t.ok(weeks >= w.releaseAfterWeeks.min && weeks <= w.releaseAfterWeeks.max, 'release in ' + weeks + ' weeks');
  });

  Game.test('Session work: a missed session pays nothing and loses the streaming share', function (t) {
    var s = freshState();
    s.sessionWork.w1 = { id: 'w1', bandName: 'The Test Band', songTitle: 'Test Song', fee: 150, quality: 60, bandFans: 3000,
      sessions: 3, played: 2, missed: 0, status: 'booked', releaseDay: null, announced: false };
    var cash = s.player.cash;
    var r = Game.rules.sessionWork.playSession(s, { workId: 'w1' }, 0);
    t.ok(r.missed, 'missed at 0 energy');
    t.equal(r.state.player.cash, cash, 'no pay');
    t.equal(r.state.sessionWork.w1.status, 'done', 'the job is over');
    t.equal(r.state.sessionWork.w1.releaseDay, null, 'no streaming share');
  });

  Game.test('Session credits: 10% of the song\'s streaming (their fans x $0.02 x quality), only after it\'s released', function (t) {
    var s = freshState();
    s = creditedWork(s, 'w1', 3000, 60, 10);
    t.equal(Game.rules.sessionWork.creditsPay(s, 10), 0, 'release day itself: nothing yet');
    t.equal(Game.rules.sessionWork.creditsPay(s, 13), 4, '3,000 x $0.02 x 60% x 10% = $3.60, about $4');
    s = creditedWork(s, 'w2', 3000, 60, 10);
    t.equal(Game.rules.sessionWork.creditsPay(s, 13), 7, 'two songs: $7.20, about $7');
    s.sessionWork.w2.missed = 1;
    t.equal(Game.rules.sessionWork.creditsPay(s, 13), 4, 'a song with a missed session doesn\'t count');
    var later = Game.rules.sessionWork.creditsPay(s, 10 + 1 + 10 * Game.balance.time.daysPerWeek);
    t.ok(later < 4, 'it fades like your own releases ($' + later + ' after 10 weeks)');
  });

  Game.test('Session credits are paid on Sunday night as their own line, and the release lands in the Inbox', function (t) {
    var s = freshState();
    s = creditedWork(s, 'w1', 5000, 80, 3);
    s.sessionWork.w1.announced = false;
    s = playUntil(s, 4);
    t.ok(s.inbox.some(function (m) { return m.kind === 'sessionRelease' && m.data.workId === 'w1'; }), 'release news in the Inbox');
    s = playUntil(s, 7);
    t.equal(s.ledger[0].income.sessionCredits, 8, '5,000 x $0.02 x 80% x 10% = $8 on Sunday');
  });

  // ----- Plan week -----

  Game.test('Plan week: sets every evening at once, with default picks, and says which evenings couldn\'t be set', function (t) {
    var s = freshState();
    var r = Game.rules.planWeek.applyWeek(s, 0, { 0: 'practice', 1: 'openMic', 2: 'openMic', 4: 'write', 5: 'rest' });
    var evening = Game.rules.planWeek.evening();
    var at = function (day) { var id = r.state.schedule[day] && r.state.schedule[day][evening]; return id ? r.state.entries[id] : null; };
    t.equal(at(0).actionId, 'practice', 'Monday: Practice');
    t.ok(at(0).songId, '...on the loosest song');
    t.equal(at(1).actionId, 'openMic', 'Tuesday: open mic');
    t.equal(at(1).songIds.length, Game.balance.songs.setlist.openMic.songs, '...with the suggested set');
    t.equal(at(2), null, 'Wednesday: no open mic that night');
    t.equal(r.log.length, 1, 'one evening couldn\'t be set');
    t.ok(r.log[0].indexOf('Wednesday') === 0, 'and it says which');
    t.equal(at(3), null, 'Thursday: left as is');
    t.equal(at(4).actionId, 'write', 'Friday: Write');
    t.equal(at(5).actionId, 'rest', 'Saturday: Rest');
    var cleared = Game.rules.planWeek.applyWeek(r.state, 0, { 0: 'clear' });
    t.equal(cleared.state.schedule[0][evening], undefined, 'clear sets Monday back to free time');
  });

  Game.test('Plan week: Jam picks your closest contact', function (t) {
    var s = freshState();
    var a = Game.rules.people.meet(s); s = a.state;
    var b = Game.rules.people.meet(s); s = b.state;
    s.people[a.personId].relationship = 25;
    s.people[b.personId].relationship = 40;
    var r = Game.rules.planWeek.applyWeek(s, 0, { 2: 'jam' });
    t.equal(r.state.entries[r.state.schedule[2].evening].personId, b.personId, 'the warmer contact');
  });

  Game.test('Week templates: save a week, apply it to another week, replace by name, keep at most 5', function (t) {
    var s = freshState();
    var a = Game.rules.people.meet(s); s = a.state;
    s = Game.rules.planWeek.applyWeek(s, 0, { 0: 'practice', 1: 'openMic', 3: 'jam' }).state;
    t.ok(Game.rules.planWeek.templateProblem(s, '  ', 0), 'needs a name');
    t.ok(Game.rules.planWeek.templateProblem(s, 'Empty', 7), 'an empty week can\'t be saved');
    s = Game.rules.planWeek.saveTemplate(s, 'Open mic week', 0).state;
    t.equal(s.weekTemplates.length, 1, 'saved');
    t.equal(s.weekTemplates[0].evenings[3].choice, a.personId, 'remembers who you jam with');

    var r = Game.rules.planWeek.applyTemplate(s, s.weekTemplates[0].id, 7);
    var evening = Game.rules.planWeek.evening();
    t.equal(r.log.length, 0, 'every evening set');
    t.equal(r.state.entries[r.state.schedule[7][evening]].actionId, 'practice', 'next Monday: Practice');
    t.equal(r.state.entries[r.state.schedule[8][evening]].actionId, 'openMic', 'next Tuesday: open mic');
    t.equal(r.state.entries[r.state.schedule[10][evening]].personId, a.personId, 'next Thursday: Jam with the same person');

    // The person is gone: Jam falls back to the closest contact you still have.
    var gone = Game.util.clone(s);
    var c = Game.rules.people.meet(gone); gone = c.state;
    delete gone.people[a.personId];
    var fallback = Game.rules.planWeek.applyTemplate(gone, gone.weekTemplates[0].id, 7);
    t.equal(fallback.state.entries[fallback.state.schedule[10][evening]].personId, c.personId, 'falls back to someone you know');

    s = Game.rules.planWeek.saveTemplate(s, 'Open mic week', 0).state;
    t.equal(s.weekTemplates.length, 1, 'same name replaces');
    for (var i = 2; i <= Game.balance.planWeek.maxTemplates; i++) s = Game.rules.planWeek.saveTemplate(s, 'Template ' + i, 0).state;
    t.equal(s.weekTemplates.length, Game.balance.planWeek.maxTemplates, '5 templates');
    t.ok(Game.rules.planWeek.templateProblem(s, 'One more', 0), 'a 6th is refused');
    s = Game.rules.planWeek.deleteTemplate(s, s.weekTemplates[0].id).state;
    t.equal(s.weekTemplates.length, Game.balance.planWeek.maxTemplates - 1, 'deleted');
  });

  // ----- Saving -----

  Game.test('Save: a version 9 save loads as the current version with the new job, session work, and template fields', function (t) {
    var old = Game.util.clone(freshState());
    old.version = 9;
    delete old.player.job.pending; delete old.player.job.quitDay;
    delete old.sessionWork; delete old.nextSessionWorkId; delete old.weekTemplates; delete old.nextTemplateId;
    var loaded = Game.save.parse(JSON.stringify(old));
    t.ok(loaded.ok, 'loaded: ' + loaded.message);
    t.equal(loaded.state.version, Game.balance.save.version);
    t.equal(loaded.state.player.job.pending, null, 'no job change waiting');
    t.equal(loaded.state.player.job.quitDay, null);
    t.sameContents(loaded.state.sessionWork, {}, 'no session work yet');
    t.sameContents(loaded.state.weekTemplates, [], 'no templates yet');
  });

})();
