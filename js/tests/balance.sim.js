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
            !Game.rules.booking.requestProblem(s, 'backRoom', s.day + d, 'guarantee')) {
          var before = s;
          s = tryPlan(s, weekend ? 'morning' : 'evening', 'emailVenue', { venueId: 'backRoom', gigDay: s.day + d, deal: 'guarantee' });
          if (s !== before) return s; // the email uses this block (the rest of the day stays simple)
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

  // The same simple player, plus: grows to a trio (and more), co-writes, takes opening slots and
  // residencies, and books clubs (14-28 days out) once they unlock. Plays first, then this.
  planLongDay: function (s) {
    var sim = Game.balanceSim;
    var A = Game.rules.actions;

    // Accept opening slots and sign residencies as offered.
    s.inbox.forEach(function (m) {
      if (m.resolved) return;
      if (m.kind === 'opening') s = Game.rules.offers.acceptOpening(s, m.id).state;
      if (m.kind === 'residency') s = Game.rules.offers.signResidency(s, m.id, { weekday: m.data.weekday, rate: m.data.rate, weeks: m.data.weeks }).state;
    });

    // Grow the band: invite anyone who'd say yes until there are 3 bandmates.
    Game.rules.people.contacts(s).forEach(function (p) {
      if (s.band.memberIds.length < 3 && !Game.rules.people.inviteProblem(s, p.id)) {
        s = Game.rules.people.invite(s, p.id).state;
        if (!s.band.name) s = Game.rules.people.nameBand(s, 'The Sim Band').state;
      }
    });

    // Once clubs unlock, email one for a Saturday 14-28 days out (if nothing's booked or pending there).
    var clubOk = !Game.rules.booking.requestProblem(s, 'basement', s.day + 14, 'guarantee') ||
      Game.rules.booking.requirements(s, Game.content.venues.basement, 'guarantee').every(function (r) { return r.met; });
    if (clubOk && !s.venues.basement.pendingRequestId) {
      var upcomingClub = Game.rules.booking.upcomingShows(s).some(function (e) { return Game.content.venues[e.venueId].tier === 2; });
      if (!upcomingClub) {
        for (var d = 14; d <= 28; d++) {
          if (Game.rules.day.dayOfWeek(s.day + d) === 5 && !Game.rules.booking.requestProblem(s, 'basement', s.day + d, 'guarantee')) {
            var r = A.plan(s, Game.rules.day.dayOfWeek(s.day) >= 5 ? 'morning' : 'evening', 'emailVenue',
              { venueId: 'basement', gigDay: s.day + d, deal: 'guarantee' });
            if (!r.log.length) return r.state;
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
    var when = { rep30: null, trio: null, firstClub: null };
    var openings = 0, residencyShows = 0;
    for (var i = 0; i < days && !s.gameOver; i++) {
      s = Game.balanceSim.planLongDay(s);
      s = Game.rules.day.endDay(s).state;
      if (when.rep30 === null && s.player.reputation >= 30) when.rep30 = s.day;
      if (when.trio === null && s.band.memberIds.length >= 2) when.trio = s.day;
      if (s.lastDayReport.gig && s.lastGig) {
        var tier = Game.content.venues[s.lastGig.venueId].tier;
        if (tier === 2 && s.lastGig.deal !== 'opening' && when.firstClub === null) when.firstClub = s.lastGig.day;
        if (s.lastGig.deal === 'opening') openings += 1;
        if (s.lastGig.deal === 'residency') residencyShows += 1;
      }
    }
    return {
      rep30: when.rep30, trio: when.trio, firstClub: when.firstClub,
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
    var milestones = [['rep30', 'Reputation 30'], ['trio', 'A 3-piece band'], ['firstClub', 'First club show (headlining)']];
    var rows = milestones.map(function (m) {
      var st = stat(m[0]);
      return '<tr><td>' + m[1] + '</td><td>' + Math.round(st.share * 100) + '% of runs</td><td>' + st.text + '</td></tr>';
    }).join('');
    var totals = [['cash', 'Cash at day ' + days + ' ($)'], ['fans', 'Fans'], ['reputation', 'Reputation'], ['bandSize', 'Bandmates'],
      ['openings', 'Opening slots played'], ['residencyShows', 'Residency nights played'], ['debt', 'Debt ($)']].map(function (m) {
      return '<tr><td>' + m[1] + '</td><td colspan="2">' + avgOf(m[0]) + '</td></tr>';
    }).join('');
    var club = stat('firstClub');
    var note = club.share < 0.5
      ? 'Fewer than half the runs headline a club by day ' + days + '. If clubs should arrive sooner, consider lowering venues.tiers[2].minReputation (30) or raising reputation gains (gigs.results.*.reputation).'
      : 'Most runs reach clubs by day ' + days + '.';
    el.innerHTML += '<h2>Balance check: days 22 to ' + days + ', ' + runs + ' runs (how fast players reach clubs)</h2>' +
      '<p class="muted">The same simple player, plus: grows to a trio, writes (and co-writes) until it has the 10 songs a club set needs, takes opening slots and residencies, and emails The Basement once clubs unlock.</p>' +
      '<table class="sim"><thead><tr><th>When</th><th>Reached by day ' + days + '</th><th>Average day</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<table class="sim" style="margin-top:16px"><thead><tr><th>At day ' + days + '</th><th colspan="2">Average</th></tr></thead><tbody>' + totals + '</tbody></table>' +
      '<p>' + note + '</p>';
    return all;
  }
};
