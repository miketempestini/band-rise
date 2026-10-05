// balance.sim.js
// The balance check: plays the first 21 days many times with a simple, sensible strategy (no clicking,
// just the game's own rules), then compares where players land with the targets in Design.md
// ("Where the player should land"). It only reports and suggests; it never changes balance.js.

window.Game = window.Game || {};

Game.balanceSim = {

  // The simple strategy, run each morning before End Day. Returns the state with today planned.
  planDay: function (s) {
    var A = Game.rules.actions;
    var tryPlan = function (state, block, actionId, choice) {
      var r = A.plan(state, block, actionId, choice);
      return r.log.length ? state : r.state;
    };

    // 1. Answer today's event: take money and shows when offered, otherwise the safe choice.
    if (s.pendingEvent) {
      var choices = Game.rules.events.choices(s);
      var keen = ['take', 'accept', 'teach', 'busk'];
      var pick = choices.filter(function (c) { return keen.indexOf(c.id) !== -1 && !c.problem; })[0] ||
        choices.filter(function (c) { return c.safe; })[0];
      s = Game.rules.events.resolve(s, pick.id).state;
    }

    // 2. Invite anyone who'd say yes (one bandmate is plenty for now).
    if (!s.band.memberIds.length) {
      Game.rules.people.contacts(s).forEach(function (p) {
        if (!s.band.memberIds.length && !Game.rules.people.inviteProblem(s, p.id)) {
          s = Game.rules.people.invite(s, p.id).state;
          s = Game.rules.people.nameBand(s, 'The Sim Band').state;
        }
      });
    }

    // 3. Accept any show offers that don't clash with the job.
    s.inbox.forEach(function (m) {
      if (!m.resolved && m.kind === 'reply' && m.data.yes && !Game.rules.booking.acceptProblem(s, m.id, null)) {
        s = Game.rules.booking.acceptOffer(s, m.id, null).state;
      }
    });

    var dow = Game.rules.day.dayOfWeek(s.day);
    var weekend = dow >= 5;
    var originals = Game.rules.songs.playable(s).filter(function (x) { return !x.isCover; }).length;
    var writing = Game.rules.songs.inProgress(s);

    // 4. Once small rooms open: email The Back Room for a Saturday, if nothing paid is coming up.
    var hasShow = Game.rules.booking.upcomingShows(s).length > 0;
    var waiting = s.venues.backRoom.pendingRequestId;
    if (s.player.reputation >= Game.balance.milestones.smallRoomsReputation && !hasShow && !waiting) {
      for (var d = 7; d <= 14; d++) {
        if (Game.rules.day.dayOfWeek(s.day + d) === 5 &&
            !Game.rules.booking.requestProblem(s, 'backRoom', s.day + d, 'door')) {
          var sent = Game.rules.booking.emailVenue(s, 'backRoom', s.day + d, 'door'); // no block needed
          if (sent.state !== s) s = sent.state;
          break;
        }
      }
    }

    // 5. The rest of the day.
    var warmest = Game.rules.people.contacts(s).sort(function (a, b) { return b.relationship - a.relationship; })[0];
    if (!weekend) {
      if (Game.rules.gigs.openMicTonight(s)) s = tryPlan(s, 'evening', 'openMic');
      else if (s.band.memberIds.length && dow === 2) s = tryPlan(s, 'evening', 'rehearse');
      else if (originals < 1 || writing) s = tryPlan(s, 'evening', 'write');
      else if (warmest && s.day % 2 === 0) s = tryPlan(s, 'evening', 'jam', warmest.id);
      else s = tryPlan(s, 'evening', s.day % 2 === 0 ? 'network' : 'practice');
    } else {
      s = tryPlan(s, 'morning', originals < 2 || writing ? 'write' : 'practice', originals < 2 || writing ? undefined : 'all');
      s = tryPlan(s, 'afternoon', warmest ? 'jam' : 'network', warmest ? warmest.id : undefined);
      s = tryPlan(s, 'evening', s.player.energy < 40 ? 'rest' : 'network');
    }
    return s;
  },

  // Plays one career for some days. Returns the numbers that matter.
  playOne: function (seed, days) {
    var s = Game.rules.career.startCareer('Sim', ['guitar', 'keys', 'bass'][seed % 3], seed).state;
    for (var i = 0; i < days && !s.gameOver; i++) {
      s = Game.balanceSim.planDay(s);
      s = Game.rules.day.endDay(s).state;
    }
    var report = Game.rules.progress.sliceReport(s);
    var values = {};
    report.rows.forEach(function (r) { values[r.id] = r.value; });
    values.paidShow = s.stats.paidShows > 0 || report.nextPaidShow !== null ? 1 : 0;
    values.debt = s.player.loanOwed;
    return values;
  },

  // Runs many careers and summarizes each number: average, lowest, highest, and how many landed on target.
  run: function (runs, days) {
    var t = Game.balance.slice.targets;
    var all = [];
    for (var seed = 1; seed <= runs; seed++) all.push(Game.balanceSim.playOne(seed, days));
    var summary = {};
    Object.keys(all[0]).forEach(function (key) {
      var list = all.map(function (v) { return v[key]; });
      var target = t[key] || (key === 'paidShow' ? { min: 1, max: 1 } : null);
      summary[key] = {
        avg: list.reduce(function (a, b) { return a + b; }, 0) / list.length,
        min: Math.min.apply(null, list),
        max: Math.max.apply(null, list),
        target: target,
        inRange: target ? list.filter(function (v) { return v >= target.min && v <= target.max; }).length / list.length : null
      };
    });
    return summary;
  },

  // Plain suggestions for numbers that land outside their targets (nothing is changed automatically).
  suggestions: {
    cash: {
      low: 'Cash is low: lower economy.networkingCost or energy-free costs, or raise job.payPerShift a little.',
      high: 'Cash is high: raise rent (housing.starter.weeklyCost) slightly, or lower job.overtimePay.'
    },
    fans: {
      low: 'Fans are low: raise gigs.results.solid.fanConversion (now 0.08) to about 0.10-0.12, or crowd.footTrafficBase.',
      high: 'Fans are high: lower gigs.results.solid.fanConversion, or songs.coverFanFactor.'
    },
    originals: {
      low: 'Too few originals: raise songs.progressBase (now 12) to about 14, so a first song takes fewer Write blocks.',
      high: 'Too many originals: lower songs.progressBase.'
    },
    bandSize: {
      low: 'Few players get a bandmate: lower people.inviteMinRelationship (now 50) to about 40, or raise relationship.jam (now 8).',
      high: 'More than one bandmate: raise people.inviteMinRelationship.'
    },
    reputation: {
      low: 'Reputation is low: raise gigs.results.solid.reputation (now 2) to 3, or lower milestones.smallRoomsReputation.',
      high: 'Reputation is high: lower gigs.results.solid.reputation, or raise reputation.diminishingDivisor\'s effect.'
    },
    paidShow: {
      low: 'Few players have a paid show booked: reputation 10 arrives too late, or booking odds are low. Lower milestones.smallRoomsReputation or raise venues.bookingBaseChance.',
      high: ''
    }
  },

  // Draws the report into an element on the test page.
  render: function (el, runs, days) {
    var started = Date.now();
    var summary = Game.balanceSim.run(runs, days);
    var seconds = ((Date.now() - started) / 1000).toFixed(1);
    var labels = { cash: 'Cash ($)', fans: 'Fans', originals: 'Original songs', bandSize: 'Bandmates', reputation: 'Reputation',
      paidShow: 'Paid show played or booked', debt: 'Debt ($)' };
    var round = function (v) { return Math.round(v * 10) / 10; };
    var notes = [];
    var rows = Object.keys(summary).map(function (key) {
      var r = summary[key];
      var target = r.target ? (key === 'paidShow' ? 'Yes' : r.target.min + ' to ' + r.target.max) : '-';
      var flag = '';
      if (r.target) {
        var low = r.avg < r.target.min;
        var high = r.avg > r.target.max;
        flag = low ? 'Too low' : (high ? 'Too high' : 'On target');
        if ((low || high) && Game.balanceSim.suggestions[key]) notes.push(Game.balanceSim.suggestions[key][low ? 'low' : 'high']);
      }
      var avgText = key === 'paidShow' ? Math.round(r.avg * 100) + '% of runs' : round(r.avg);
      return '<tr class="' + (flag === 'On target' ? 'ok' : (flag ? 'off' : '')) + '">' +
        '<td>' + labels[key] + '</td><td>' + target + '</td><td>' + avgText + '</td>' +
        '<td>' + (key === 'paidShow' ? '-' : round(r.min) + ' to ' + round(r.max)) + '</td>' +
        '<td>' + (r.inRange === null ? '-' : Math.round(r.inRange * 100) + '%') + '</td>' +
        '<td>' + flag + '</td></tr>';
    }).join('');
    el.innerHTML = '<h2>Balance check: first ' + days + ' days, ' + runs + ' runs</h2>' +
      '<p class="muted">Strategy: open mics on Tue/Thu, Write until there\'s an original, Jam with the warmest contact, ' +
        'invite when allowed, email The Back Room once small rooms open, take overtime and fill-ins. (' + seconds + 's)</p>' +
      '<table class="sim"><thead><tr><th>Number</th><th>Target (Design.md)</th><th>Average</th><th>Range</th><th>Runs on target</th><th></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      (notes.length ? '<h3>Suggested balance.js changes (not applied)</h3><ul>' + notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>'
        : '<p class="ok">Everything lands on target on average.</p>');
    return summary;
  },

  // ----- The longer check: days 22 to 90 (Phase 9) -----

  // The same simple player, plus: grows to a trio (and more), co-writes, takes opening slots,
  // residencies, and session work, goes part-time as soon as it can (Phase 10), and books clubs
  // (14-28 days out) once they unlock. Plays first, then this.
  planLongDay: function (s) {
    var sim = Game.balanceSim;
    var A = Game.rules.actions;

    // Accept opening slots and sign residencies as offered.
    s.inbox.forEach(function (m) {
      if (m.resolved) return;
      if (m.kind === 'opening') s = Game.rules.offers.acceptOpening(s, m.id).state;
      if (m.kind === 'residency') s = Game.rules.offers.signResidency(s, m.id, { weekday: m.data.weekday, rate: m.data.rate, weeks: m.data.weeks }).state;
      if (m.kind === 'sessionWork' && !Game.rules.sessionWork.acceptProblem(s, m.id)) s = Game.rules.sessionWork.accept(s, m.id).state;
    });

    // Go part-time as soon as it's allowed (more evenings and afternoons for music).
    if (!Game.rules.job.partTimeProblem(s)) s = Game.rules.job.goPartTime(s).state;

    // Grow the band: invite anyone who'd say yes until there are 3 bandmates.
    Game.rules.people.contacts(s).forEach(function (p) {
      if (s.band.memberIds.length < 3 && !Game.rules.people.inviteProblem(s, p.id)) {
        s = Game.rules.people.invite(s, p.id).state;
        if (!s.band.name) s = Game.rules.people.nameBand(s, 'The Sim Band').state;
      }
    });

    // Once clubs unlock, email one for a Saturday 14-28 days out (if nothing's booked or pending there).
    var clubOk = !Game.rules.booking.requestProblem(s, 'basement', s.day + 14, 'door') ||
      Game.rules.booking.requirements(s, Game.content.venues.basement, 'guarantee').every(function (r) { return r.met; });
    if (clubOk && !s.venues.basement.pendingRequestId) {
      var upcomingClub = Game.rules.booking.upcomingShows(s).some(function (e) { return Game.content.venues[e.venueId].tier === 2; });
      if (!upcomingClub) {
        for (var d = 14; d <= 28; d++) {
          if (Game.rules.day.dayOfWeek(s.day + d) === 5 && !Game.rules.booking.requestProblem(s, 'basement', s.day + d, 'door')) {
            var r = Game.rules.booking.emailVenue(s, 'basement', s.day + d, 'door'); // no block needed
            if (r.state !== s) s = r.state;
            break;
          }
        }
      }
    }

    s = sim.planDay(s);

    // Clubs need a 10-song set: until there are 10 songs, swap Practice and Network for Write.
    var clubSet = Game.rules.booking.setFor(Game.content.venues.basement, 'guarantee').size;
    if (Game.rules.songs.playable(s).length < clubSet) {
      Game.balance.time.blocks.forEach(function (block) {
        var planned = A.plannedEntry(s, block);
        if (planned && (planned.actionId === 'practice' || planned.actionId === 'network')) {
          var w = A.plan(s, block, 'write');
          if (!w.log.length) s = w.state;
        }
      });
    }

    // Co-write: if Write is planned and a bandmate is close enough, write together.
    Game.balance.time.blocks.forEach(function (block) {
      var e = A.plannedEntry(s, block);
      if (!e || e.actionId !== 'write' || e.personId) return;
      var partner = Game.rules.people.members(s).filter(function (m) { return !A.personProblem(s, 'write', m.id); })[0];
      if (partner) {
        var again = A.plan(s, block, 'write', partner.id);
        if (!again.log.length) s = again.state;
      }
    });
    return s;
  },

  // Plays one career to day 90 and records when things happened.
  playLong: function (seed, days) {
    var s = Game.rules.career.startCareer('Sim', ['guitar', 'keys', 'bass'][seed % 3], seed).state;
    var when = { rep30: null, trio: null, firstClub: null, partTime: null };
    var openings = 0, residencyShows = 0;
    for (var i = 0; i < days && !s.gameOver; i++) {
      s = Game.balanceSim.planLongDay(s);
      s = Game.rules.day.endDay(s).state;
      if (when.rep30 === null && s.player.reputation >= 30) when.rep30 = s.day;
      if (when.trio === null && s.band.memberIds.length >= 2) when.trio = s.day;
      if (when.partTime === null && s.player.job.status === 'part') when.partTime = s.day;
      if (s.lastDayReport.gig && s.lastGig) {
        var tier = Game.content.venues[s.lastGig.venueId].tier;
        if (tier === 2 && s.lastGig.deal !== 'opening' && when.firstClub === null) when.firstClub = s.lastGig.day;
        if (s.lastGig.deal === 'opening') openings += 1;
        if (s.lastGig.deal === 'residency') residencyShows += 1;
      }
    }
    return {
      rep30: when.rep30, trio: when.trio, firstClub: when.firstClub, partTime: when.partTime,
      sessionJobs: Object.keys(s.sessionWork).length,
      cash: s.player.cash, fans: Game.rules.progress.totalFans(s), reputation: s.player.reputation,
      bandSize: s.band.memberIds.length, openings: openings, residencyShows: residencyShows, debt: s.player.loanOwed
    };
  },

  // Runs the longer check and draws its report.
  renderLong: function (el, runs, days) {
    var all = [];
    for (var seed = 1; seed <= runs; seed++) all.push(Game.balanceSim.playLong(seed, days));
    var round = function (v) { return Math.round(v * 10) / 10; };
    var stat = function (key) {
      var hit = all.map(function (r) { return r[key]; }).filter(function (v) { return v !== null; });
      if (!hit.length) return { share: 0, text: 'never' };
      var avg = hit.reduce(function (a, b) { return a + b; }, 0) / hit.length;
      return { share: hit.length / all.length, text: 'day ' + round(avg) + ' (range ' + Math.min.apply(null, hit) + ' to ' + Math.max.apply(null, hit) + ')' };
    };
    var avgOf = function (key) {
      var list = all.map(function (r) { return r[key]; });
      return round(list.reduce(function (a, b) { return a + b; }, 0) / list.length) + ' (range ' + round(Math.min.apply(null, list)) + ' to ' + round(Math.max.apply(null, list)) + ')';
    };
    var milestones = [['rep30', 'Reputation 30'], ['trio', 'A 3-piece band'], ['partTime', 'Part-time job starts'], ['firstClub', 'First club show (headlining)']];
    var rows = milestones.map(function (m) {
      var st = stat(m[0]);
      return '<tr><td>' + m[1] + '</td><td>' + Math.round(st.share * 100) + '% of runs</td><td>' + st.text + '</td></tr>';
    }).join('');
    var totals = [['cash', 'Cash at day ' + days + ' ($)'], ['fans', 'Fans'], ['reputation', 'Reputation'], ['bandSize', 'Bandmates'],
      ['openings', 'Opening slots played'], ['residencyShows', 'Residency nights played'], ['sessionJobs', 'Session work jobs taken'], ['debt', 'Debt ($)']].map(function (m) {
      return '<tr><td>' + m[1] + '</td><td colspan="2">' + avgOf(m[0]) + '</td></tr>';
    }).join('');
    var club = stat('firstClub');
    var note = club.share < 0.5
      ? 'Fewer than half the runs headline a club by day ' + days + '. If clubs should arrive sooner, consider lowering venues.tiers[2].minReputation (30) or raising reputation gains (gigs.results.*.reputation).'
      : 'Most runs reach clubs by day ' + days + '.';
    el.innerHTML += '<h2>Balance check: days 22 to ' + days + ', ' + runs + ' runs (how fast players reach clubs)</h2>' +
      '<p class="muted">The same simple player, plus: grows to a trio, writes (and co-writes) until it has the 10 songs a club set needs, takes opening slots, residencies, and session work, goes part-time as soon as it can, and emails The Basement once clubs unlock.</p>' +
      '<table class="sim"><thead><tr><th>When</th><th>Reached by day ' + days + '</th><th>Average day</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<table class="sim" style="margin-top:16px"><thead><tr><th>At day ' + days + '</th><th colspan="2">Average</th></tr></thead><tbody>' + totals + '</tbody></table>' +
      '<p>' + note + '</p>';
    return all;
  },

  // ----- The two-year check (Phase 12): does money ever stop mattering? -----

  // The same player as the 90-day check, plus the big-time moves: writes up to a 14-song theater set, hires the manager and turns on auto-booking
  // (clubs and theaters, Friday and Saturday, 2 a week), buys a used van, records and releases an EP every
  // 12 weeks, asks for a tour every 10 weeks, uses the press push, signs the label, takes arena and festival
  // offers, and quits the day job once music covers its bills 1.5 times over.
  planBigDay: function (s) {
    var sim = Game.balanceSim;
    var A = Game.rules.actions;
    s = sim.planLongDay(s);

    // Theaters need a 14-song set: once theaters are close (reputation 55+), keep writing until there are 14 songs.
    var theaterSet = Game.rules.booking.setFor(Game.content.venues.orpheum, 'door').size;
    if (s.player.reputation >= Game.balance.milestones.theaterReputation - 5 && Game.rules.songs.playable(s).length < theaterSet) {
      Game.balance.time.blocks.forEach(function (block) {
        var planned = A.plannedEntry(s, block);
        if (planned && planned.type === 'action' && (planned.actionId === 'practice' || planned.actionId === 'network' || planned.actionId === 'jam')) {
          var w = A.plan(s, block, 'write');
          if (!w.log.length) s = w.state;
        }
      });
    }

    // Offers: hire, sign, book tours and big shows (calling in sick if a trip needs work days).
    s.inbox.forEach(function (m) {
      if (m.resolved) return;
      if (m.kind === 'managerOffer') s = Game.rules.manager.hire(s, m.id).state;
      if (m.kind === 'labelOffer') s = Game.rules.label.sign(s, m.id).state;
      if (m.kind === 'tourProposal') {
        var job = Game.rules.manager.tourAcceptProblem(s, m.id, null) ? 'sick' : null;
        s = Game.rules.manager.acceptTour(s, m.id, job).state;
      }
      if (m.kind === 'arenaOffer' || m.kind === 'festivalOffer') {
        var ok = !Game.rules.bigShows.acceptProblem(s, m.id, null) ? null : 'sick';
        s = Game.rules.bigShows.accept(s, m.id, ok).state;
      }
    });

    // Auto-booking: clubs (and theaters once open) in every city you can drive to, Fridays and Saturdays.
    if (Game.rules.manager.hired(s)) {
      var cities = Object.keys(s.cities).filter(function (id) {
        return s.cities[id].unlocked && Game.rules.travel.regionOrder.indexOf(Game.content.cities[id].region) !== -1;
      });
      var tiers = s.player.reputation >= Game.balance.milestones.theaterReputation && s.releases.length ? [2, 3] : [2];
      var r = s.manager.rules;
      if (!r.on || r.cities.length !== cities.length || r.tiers.length !== tiers.length) {
        s = Game.rules.manager.setRules(s, { on: true, cities: cities, tiers: tiers, nights: [4, 5], maxPerWeek: 2 }).state;
      }
    }

    // A used van once there's money for it.
    if (!s.player.gear.van && s.player.cash > Game.balance.vans.used.price * 2 && s.milestones.onTheRoad !== undefined) {
      s = Game.rules.merch.buy(s, 'van-used').state;
    }

    // Quit the day job once music pays the bills 1.5 times over (a month of history).
    var q = Game.rules.job.quitSummary(s);
    if (s.player.job.status !== 'none' && !s.player.job.pending && q.weeks.length >= Game.balance.job.quitScreenIncomeWeeks && q.coversShare >= 1.5) {
      s = Game.rules.job.quit(s).state;
    }

    // An EP every 12 weeks: record the three best unreleased originals at the best studio you can use, then release.
    var lastRelease = s.releases.length ? s.releases[s.releases.length - 1].day : -Infinity;
    var fresh = Game.rules.songs.playable(s).filter(function (x) { return !x.isCover && !x.releaseId; })
      .sort(function (a, b) { return b.quality - a.quality; }).slice(0, 3);
    if (s.day - lastRelease >= 84 && fresh.length === 3 && s.player.cash > 3000) {
      var studio = Game.rules.label.signed(s) ? 'top' : (Game.rules.recording.studioProblem(s, 'pro') ? 'demo' : 'pro');
      fresh.forEach(function (song) { s = Game.rules.recording.record(s, song.id, studio).state; });
      s = Game.rules.recording.release(s, 'ep', fresh.map(function (x) { return x.id; })).state;
    }

    // A tour every 10 weeks (up to 6 out-of-town cities, clubs or theaters).
    if (Game.rules.manager.hired(s) && s.player.gear.van) {
      var lastTour = Game.rules.manager.lastMessage(s, 'tourProposal');
      if (!lastTour || s.day - lastTour.day >= 70) {
        var away = Object.keys(s.cities).filter(function (id) { return id !== 'hometown' && s.cities[id].unlocked && Game.content.cities[id].region !== 'international'; })
          .sort(function (a, b) { return s.cities[b].fans - s.cities[a].fans; }).slice(0, 6);
        var tier = s.player.reputation >= Game.balance.milestones.theaterReputation && s.releases.length ? 3 : 2;
        if (away.length >= 2) s = Game.rules.manager.requestTour(s, { cities: away, tier: tier }).state;
      }
    }

    // The press push whenever it's ready (in any free block).
    if (Game.rules.manager.hired(s) && !A.pressPushWait(s) && s.player.cash > 3000) {
      Game.balance.time.blocks.some(function (block) {
        if (A.plannedEntry(s, block)) return false;
        var r = A.plan(s, block, 'pressPush');
        if (!r.log.length) { s = r.state; return true; }
        return false;
      });
    }
    return s;
  },

  // Plays one career for two game years and records money and progress along the way.
  playYears: function (seed, days) {
    var s = Game.rules.career.startCareer('Sim', ['guitar', 'keys', 'bass'][seed % 3], seed).state;
    var b = Game.balance;
    var checkpoints = { 90: null, 180: null, 365: null, 545: null, 728: null };
    var when = { manager: null, label: null, quit: null, theater: null, arena: null, festival: null, tour: null, cash50k: null };
    for (var i = 0; i < days && !s.gameOver; i++) {
      s = Game.balanceSim.planBigDay(s);
      s = Game.rules.day.endDay(s).state;
      if (checkpoints[s.day] === null) checkpoints[s.day] = s.player.cash;
      if (when.manager === null && s.manager.hired) when.manager = s.day;
      if (when.label === null && s.label.signed) when.label = s.day;
      if (when.quit === null && s.player.job.quitDay !== null) when.quit = s.day;
      if (when.tour === null && s.milestones.firstTour !== undefined) when.tour = s.day;
      if (when.cash50k === null && s.player.cash >= 50000) when.cash50k = s.day;
      if (s.lastDayReport.gig && s.lastGig) {
        var v = Game.content.venues[s.lastGig.venueId];
        if (when.theater === null && v.tier === 3) when.theater = s.day;
        if (when.arena === null && s.lastGig.deal === 'arena') when.arena = s.day;
        if (when.festival === null && s.lastGig.deal === 'festival') when.festival = s.day;
      }
    }
    // The last 8 weeks: money in and out each week.
    var recent = s.ledger.slice(-8);
    var sum = function (o) { return Object.keys(o).reduce(function (t, k) { return t + o[k]; }, 0); };
    var weeklyIn = recent.reduce(function (t, w) { return t + sum(w.income); }, 0) / Math.max(1, recent.length);
    var weeklyOut = recent.reduce(function (t, w) { return t + sum(w.costs); }, 0) / Math.max(1, recent.length);
    var outBy = {};
    recent.forEach(function (w) { Object.keys(w.costs).forEach(function (k) { outBy[k] = (outBy[k] || 0) + w.costs[k] / recent.length; }); });
    var inBy = {};
    recent.forEach(function (w) { Object.keys(w.income).forEach(function (k) { inBy[k] = (inBy[k] || 0) + w.income[k] / recent.length; }); });
    return {
      checkpoints: checkpoints, when: when, cash: s.player.cash, fans: Game.rules.progress.totalFans(s), reputation: s.player.reputation,
      weeklyIn: weeklyIn, weeklyOut: weeklyOut, inBy: inBy, outBy: outBy,
      runwayWeeks: weeklyOut > 0 ? s.player.cash / weeklyOut : Infinity, gameOver: !!s.gameOver,
      labelOwed: s.label.owed, bills: b.housing[s.player.housing].weeklyCost
    };
  },

  // Runs the two-year check and draws its report: money over time, where money comes from and goes,
  // when the big milestones land, and whether money still matters by the end.
  renderYears: function (el, runs, days) {
    var started = Date.now();
    var all = [];
    for (var seed = 1; seed <= runs; seed++) all.push(Game.balanceSim.playYears(seed, days));
    var avg = function (list) { return list.length ? list.reduce(function (a, b) { return a + b; }, 0) / list.length : null; };
    var money = function (v) { return v === null ? '-' : '$' + Math.round(v).toLocaleString(); };
    var range = function (list) { return list.length ? money(Math.min.apply(null, list)) + ' to ' + money(Math.max.apply(null, list)) : '-'; };
    var cashRows = Object.keys(all[0].checkpoints).map(function (day) {
      var list = all.map(function (r) { return r.checkpoints[day]; }).filter(function (v) { return v !== null; });
      return '<tr><td>Day ' + day + '</td><td>' + money(avg(list)) + '</td><td>' + range(list) + '</td></tr>';
    }).join('');
    var whenNames = { manager: 'Manager hired', quit: 'Quit the day job', tour: 'First tour', theater: 'First theater show', label: 'Label signed',
      festival: 'First festival', arena: 'First arena show', cash50k: 'Cash reaches $50,000' };
    var whenRows = Object.keys(whenNames).map(function (k) {
      var hit = all.map(function (r) { return r.when[k]; }).filter(function (v) { return v !== null; });
      return '<tr><td>' + whenNames[k] + '</td><td>' + Math.round(hit.length / all.length * 100) + '% of runs</td><td>' +
        (hit.length ? 'day ' + Math.round(avg(hit)) + ' (' + Math.min.apply(null, hit) + ' to ' + Math.max.apply(null, hit) + ')' : 'never') + '</td></tr>';
    }).join('');
    var cats = function (key) {
      var totals = {};
      all.forEach(function (r) { Object.keys(r[key]).forEach(function (k) { totals[k] = (totals[k] || 0) + r[key][k] / all.length; }); });
      return Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).map(function (k) { return k + ' ' + money(totals[k]); }).join(', ');
    };
    var weeklyIn = avg(all.map(function (r) { return r.weeklyIn; }));
    var weeklyOut = avg(all.map(function (r) { return r.weeklyOut; }));
    var runway = avg(all.map(function (r) { return Math.min(r.runwayWeeks, 999); }));
    var stopped = all.filter(function (r) { return r.runwayWeeks >= 52; }).length;
    var verdict = stopped / all.length >= 0.5
      ? 'Money stops mattering: by the end of year 2, ' + stopped + ' of ' + all.length + ' runs could pay a full year of costs from savings, and still earn more than they spend each week.'
      : 'Money still matters by the end of year 2 in most runs (' + (all.length - stopped) + ' of ' + all.length + ' have less than a year of costs saved).';
    el.innerHTML += '<h2>Balance check: two years, ' + runs + ' runs (does money ever stop mattering?)</h2>' +
      '<p class="muted">The 90-day player, plus: hires the manager and auto-books clubs and theaters, buys a used van, releases an EP every 12 weeks, ' +
        'asks for a tour every 10 weeks, uses the press push, signs the label, takes arena and festival offers, and quits the day job once music pays ' +
        'the bills 1.5 times over. (' + ((Date.now() - started) / 1000).toFixed(1) + 's)</p>' +
      '<table class="sim"><thead><tr><th>Cash at</th><th>Average</th><th>Range</th></tr></thead><tbody>' + cashRows + '</tbody></table>' +
      '<table class="sim" style="margin-top:16px"><thead><tr><th>When</th><th>Reached</th><th>Average day</th></tr></thead><tbody>' + whenRows + '</tbody></table>' +
      '<table class="sim" style="margin-top:16px"><tbody>' +
        '<tr><td>Weekly money in (last 8 weeks)</td><td>' + money(weeklyIn) + '</td><td>' + cats('inBy') + '</td></tr>' +
        '<tr><td>Weekly money out (last 8 weeks)</td><td>' + money(weeklyOut) + '</td><td>' + cats('outBy') + '</td></tr>' +
        '<tr><td>Savings in weeks of costs</td><td>' + Math.round(runway) + ' weeks</td><td></td></tr>' +
        '<tr><td>Fans / reputation at the end</td><td>' + Math.round(avg(all.map(function (r) { return r.fans; }))).toLocaleString() + ' / ' +
          Math.round(avg(all.map(function (r) { return r.reputation; }))) + '</td><td></td></tr>' +
        '<tr><td>Still owed to the label</td><td>' + money(avg(all.map(function (r) { return r.labelOwed; }))) + '</td><td></td></tr>' +
        '<tr><td>Game overs</td><td>' + all.filter(function (r) { return r.gameOver; }).length + '</td><td></td></tr>' +
      '</tbody></table><p><strong>' + verdict + '</strong></p>';
    return all;
  }
};
