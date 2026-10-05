// calendar.js
// The Calendar screen: a 4-week grid of everything booked (job shifts, days off, shows, requests,
// today's plans). Click a day to see it: take a workday off, or manage a booked show
// (setlist, session players, cancel).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.calendar = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var self = Game.ui.calendar;
    var b = Game.balance;
    // The Calendar shows 4 weeks at a time: 4 weeks in all, or 12 (three pages) with a manager.
    var pageWeeks = b.time.calendarPageWeeks;
    var pages = Math.ceil(Game.rules.manager.calendarWeeks(state) / pageWeeks);
    var page = Math.min(app.calendarPage || 0, pages - 1);
    var start = state.day - Game.rules.day.dayOfWeek(state.day) + page * pageWeeks * b.time.daysPerWeek; // this page's first Monday
    var selected = app.calendarDay === null || app.calendarDay === undefined ? state.day : app.calendarDay;
    var job = state.player.job;

    var head = Game.content.calendar.dayNames.map(function (n) { return '<div class="cal__dow">' + n.slice(0, 3) + '</div>'; }).join('');
    var cells = '';
    for (var d = start; d < start + pageWeeks * b.time.daysPerWeek; d++) {
      cells += self.cellHtml(state, d, d === selected, d === start);
    }

    var jobLine = job.status === 'none'
      ? 'No day job. (Plan "Look for work" from a free block.)'
      : (job.status === 'full' ? 'Full-time' : 'Part-time') + ' day job · standing <strong>' + Math.round(job.standing) + '</strong> · ' +
        job.vacationDaysLeft + ' vacation day' + (job.vacationDaysLeft === 1 ? '' : 's') + ' left this year';
    if (job.pending) {
      jobLine += ' · ' + (job.pending.status === 'none' ? 'quitting' : 'part-time') + ' from ' + h.dateLabel(job.pending.day);
    }

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Calendar</h1>' +
          '<div class="actions actions--left">' +
            '<button class="btn" data-action="planWeek">🗓️ Plan week</button>' +
            '<button class="btn" data-action="openJob">💼 Day job</button>' +
            '<button class="btn" data-action="back">← Back</button>' +
          '</div>' +
        '</div>' +
        h.notice(app.notice) +
        '<p class="hint">' + jobLine + '</p>' +
        (pages > 1 ? '<div class="sort-bar"><button class="btn btn--small" data-action="calPage" data-page="' + (page - 1) + '"' + (page === 0 ? ' disabled' : '') + '>◀ Earlier</button>' +
          '<span class="muted">' + Game.rules.day.spanLabel(start, start + pageWeeks * b.time.daysPerWeek - 1) +
          ' (page ' + (page + 1) + ' of ' + pages + ')</span>' +
          '<button class="btn btn--small" data-action="calPage" data-page="' + (page + 1) + '"' + (page >= pages - 1 ? ' disabled' : '') + '>Later ▶</button></div>' : '') +
        '<div class="cal-layout">' +
          '<div class="cal">' + head + cells + '</div>' +
          '<div class="cal-detail">' + self.detailHtml(state, app, selected) + '</div>' +
        '</div>' +
      '</section>' +
      (app.pickerBlock ? Game.ui.actionPicker.html(app.pickerView(), app.pickerBlock, app.pickerSongStep, app.pickerSet, app.practiceSort, app.practiceFilter) : '');

    h.bind(root, {
      back: function () { app.goBack('calendar'); },
      focusPayBack: function () { app.goBack('calendar'); },
      selectDay: function (e, el) { app.calendarSelect(Number(el.getAttribute('data-day'))); },
      dayOff: function (e, el) { app.calendarDayOff(Number(el.getAttribute('data-day')), el.getAttribute('data-kind')); },
      undoDayOff: function (e, el) { app.calendarUndoDayOff(Number(el.getAttribute('data-day'))); },
      editSetlist: function (e, el) { app.editSetlist(el.getAttribute('data-entry')); },
      toggleSetlistSong: function (e, el) { app.toggleSetlistSong(el.getAttribute('data-song')); },
      saveSetlist: function () { app.saveSetlist(); },
      cancelSetlist: function () { app.setlistDraft = null; app.render(); },
      session: function (e, el) { app.changeSessionPlayers(el.getAttribute('data-entry'), Number(el.getAttribute('data-change'))); },
      cancelShow: function (e, el) { app.cancelShow(el.getAttribute('data-entry')); },
      cancelStudio: function (e, el) { app.cancelStudio(el.getAttribute('data-entry')); },
      cancelSessionWork: function (e, el) { app.cancelSessionWork(el.getAttribute('data-work')); },
      planWeek: function () { app.openPlanWeek(); },
      calPage: function (e, el) { app.calendarPage = Number(el.getAttribute('data-page')); app.render(); },
      openJob: function () { app.openJob(); },
      planBlock: function (e, el) { app.openPicker(el.getAttribute('data-block'), Number(el.getAttribute('data-day'))); },
      clearBlock: function (e, el) { app.calendarClear(Number(el.getAttribute('data-day')), el.getAttribute('data-block')); }
    });
    if (app.pickerBlock) Game.ui.actionPicker.bind(root, app);
  },

  // What's in one block of a day, for the grid: { text, kind }.
  blockInfo: function (state, day, block) {
    var c = Game.rules.booking.blockContents(state, day, block);
    var text = {
      show: function () { return '🎤 ' + Game.content.venues[c.entry.venueId].name; },
      studio: function () { return '🎙️ ' + Game.content.studios[c.entry.studio].name; },
      sessionWork: function () { return '🎧 ' + state.sessionWork[c.entry.workId].bandName; },
      travel: function () { return '🚐 ' + (c.entry.to === 'hometown' ? 'Home' : Game.content.cities[c.entry.to].name); },
      away: function () { return 'On the road'; },
      plan: function () { return Game.content.actions[c.entry.actionId].name; },
      pending: function () { return '? ' + c.reason.replace('Waiting to hear from ', ''); },
      off: function () { return 'Off (' + c.offKind + ')'; },
      job: function () { return 'Job'; },
      free: function () { return ''; }
    }[c.kind]();
    return { text: text, kind: c.kind };
  },

  // first: true for the first cell on the page (it always shows its month).
  cellHtml: function (state, day, isSelected, first) {
    var self = Game.ui.calendar;
    var past = day < state.day;
    var rows = Game.balance.time.blocks.map(function (block) {
      var info = self.blockInfo(state, day, block);
      return '<span class="cal__block cal__block--' + info.kind + '">' + (info.text ? Game.ui.helpers.escape(info.text) : '&nbsp;') + '</span>';
    }).join('');
    return '<button class="cal__day' + (day === state.day ? ' cal__day--today' : '') + (past ? ' cal__day--past' : '') +
      (isSelected ? ' cal__day--selected' : '') + '" data-action="selectDay" data-day="' + day + '">' +
      '<span class="cal__date">' + Game.ui.calendar.cellDate(day, first) + (day === state.day ? ' · Today' : '') + '</span>' + rows + '</button>';
  },

  // A calendar cell's date: just the day of the month, with the month's short name on the 1st (and on the page's first cell).
  cellDate: function (day, first) {
    var d = Game.rules.day.date(day);
    return d.date === 1 || first ? Game.rules.day.shortName(Game.content.calendar.monthNames[d.month]) + ' ' + d.date : String(d.date);
  },

  // The selected day: its job situation and any booked shows.
  detailHtml: function (state, app, day) {
    var h = Game.ui.helpers;
    var b = Game.balance;
    var self = Game.ui.calendar;
    var parts = ['<h3 class="panel__title">' + h.dateLabel(day) + (day === state.day ? ' (today)' : '') + '</h3>'];

    // The day's three blocks: plan a task in any free one (today or later).
    if (day >= state.day) parts.push(self.planHtml(state, day));

    // The job that day.
    if (Game.rules.job.scheduledOn(state, day)) {
      var off = state.player.job.daysOff[day];
      if (off) {
        parts.push('<p>Day off: <strong>' + { vacation: 'vacation day (paid)', sick: 'calling in sick (' + b.job.sickDayPenalty + ' standing)', skip: 'skipping work (' + b.job.skipPenalty + ' standing)' }[off] + '</strong></p>' +
          (Game.rules.job.undoDayOffProblem(state, day) ? '' : '<button class="btn btn--small" data-action="undoDayOff" data-day="' + day + '">Undo day off</button>'));
      } else if (day >= state.day) {
        var kinds = [['vacation', 'Vacation day (paid)'], ['sick', 'Call in sick (' + b.job.sickDayPenalty + ')'], ['skip', 'Skip work (' + b.job.skipPenalty + ')']];
        parts.push('<p>Day job: Morning and Afternoon.</p><div class="dayoff">' + kinds.map(function (k) {
          var problem = Game.rules.job.dayOffProblem(state, day, k[0]);
          return '<button class="btn btn--small" data-action="dayOff" data-day="' + day + '" data-kind="' + k[0] + '"' +
            (problem ? ' disabled title="' + h.escape(problem) + '"' : '') + '>' + k[1] + '</button>';
        }).join('') + '</div><p class="hint">Vacation needs ' + b.job.vacationNoticeDays + ' days\' notice. Calling in sick is only for ' + Game.rules.job.sickWindowText() + '.</p>');
      }
    } else {
      parts.push('<p class="muted">No day job this day.</p>');
    }

    // Booked shows that day.
    var shows = Object.keys(state.entries).map(function (id) { return state.entries[id]; })
      .filter(function (e) { return e.type === 'gig' && e.day === day; });
    shows.forEach(function (e) { parts.push(self.showHtml(state, app, e)); });
    if (!shows.length) parts.push('<p class="hint">No show booked. Use Book to email a venue.</p>');

    return '<div class="panel">' + parts.join('') + '</div>';
  },

  // The three blocks of a day with Plan / Change / Clear buttons. Energy and cash for a later day are
  // checked when that day comes (Today will flag anything that won't fit).
  planHtml: function (state, day) {
    var h = Game.ui.helpers;
    var self = Game.ui.calendar;
    var rows = Game.balance.time.blocks.map(function (block) {
      var name = Game.content.calendar.blockNames[block];
      var info = self.blockInfo(state, day, block);
      var plan = state.schedule[day];
      var entry = plan && plan[block] && state.entries[plan[block]];
      var right;
      if (info.kind === 'job') right = '<span class="muted">Day job</span>';
      else if (info.kind === 'show') right = '<span class="muted">Show (see below)</span>';
      else if (info.kind === 'travel') {
        right = '<span class="plan__task">🚐 ' + (entry.to === 'hometown' ? 'Driving home from ' + h.escape(Game.content.cities[entry.from].name)
          : 'Travel to ' + h.escape(Game.content.cities[entry.to].name)) + '</span><span class="muted">-' + Game.balance.travel.energyPerBlock + ' energy</span>';
      }
      else if (info.kind === 'sessionWork') {
        var work = state.sessionWork[entry.workId];
        right = '<span class="plan__task">🎧 Session work: ' + h.escape(work.bandName) + ', "' + h.escape(work.songTitle) + '" (+' + h.money(work.fee) + ')</span>' +
          '<button class="btn btn--small btn--ghost" data-action="cancelSessionWork" data-work="' + work.id + '">Cancel</button>';
      }
      else if (info.kind === 'studio') {
        right = '<span class="plan__task">🎙️ ' + h.escape(Game.content.studios[entry.studio].name) + ': "' + h.escape(state.songs[entry.songId].title) + '"</span>' +
          '<button class="btn btn--small btn--ghost" data-action="cancelStudio" data-entry="' + entry.id + '">Cancel</button>';
      }
      else if (entry && entry.type === 'action') {
        right = '<span class="plan__task">' + h.escape(Game.ui.calendar.taskLabel(state, entry)) + '</span>' +
          '<button class="btn btn--small" data-action="planBlock" data-day="' + day + '" data-block="' + block + '">Change</button>' +
          '<button class="btn btn--small btn--ghost" data-action="clearBlock" data-day="' + day + '" data-block="' + block + '">Clear</button>';
      } else {
        right = '<span class="muted">' + (info.kind === 'away' ? 'On the road (' + Game.rules.actions.roadActionsText() + ')' : 'Free time') + '</span>' +
          '<button class="btn btn--small btn--primary" data-action="planBlock" data-day="' + day + '" data-block="' + block + '">Plan…</button>';
      }
      return '<div class="plan__row"><span class="plan__block">' + name + '</span>' + right + '</div>';
    }).join('');
    return '<div class="plan">' + rows + '</div>' +
      (day > state.day ? '<p class="hint">Planned tasks show up on Today when the day comes; you can still change them then. ' +
        'Energy and cash are checked on the day.</p>' : '');
  },

  // A short label for a planned task, like "Practice: That Bar-Band Classic" or "Jam with Dana Reyes".
  taskLabel: function (state, e) {
    var name = Game.content.actions[e.actionId].name;
    if (e.personId && state.people[e.personId]) return name + ' with ' + state.people[e.personId].name;
    if (e.songId === 'all') return name + ': all songs';
    if (e.songId && state.songs[e.songId]) return name + ': ' + state.songs[e.songId].title;
    if (e.songIds && e.songIds.length) return name + ' (' + e.songIds.length + ' songs)';
    if (e.request && e.request.venueId) return name + ': ' + Game.content.venues[e.request.venueId].name;
    if (e.request && e.request.studio) return name + ': ' + Game.content.studios[e.request.studio].name;
    return name;
  },

  // A booked show: deal, setlist (editable), session players, and cancel.
  showHtml: function (state, app, e) {
    var h = Game.ui.helpers;
    var b = Game.balance;
    var venue = Game.content.venues[e.venueId];
    var set = Game.rules.booking.setFor(venue, e.deal);
    var editing = app.setlistDraft && app.setlistDraft.entryId === e.id;
    var ahead = e.day - state.day;
    var penalty = Game.rules.booking.cancelPenalty(ahead);
    var room = b.people.maxBandMembers - state.band.memberIds.length;

    var setlist;
    if (editing) {
      var picked = app.setlistDraft.songIds;
      setlist = '<p class="hint">Pick exactly ' + set.size + (set.coversOnly ? ' covers' : ' songs') + ' (' + picked.length + ' picked).</p>' +
        '<div class="setlist-edit">' + Game.rules.songs.sortSongs(state, Game.rules.songs.playable(state), 'tightHigh')
          .filter(function (s) { return !set.coversOnly || s.isCover; })
          .map(function (s) {
            var on = picked.indexOf(s.id) !== -1;
            return '<button class="setlist-song' + (on ? ' setlist-song--on' : '') + '" data-action="toggleSetlistSong" data-song="' + s.id + '">' +
              '<span class="check">' + (on ? '✓' : '') + '</span>' + h.escape(s.title) +
              '<span class="muted"> · ' + (s.isCover ? 'cover' : 'original') + ' · quality ' + s.quality + ' · tightness ' + Math.round(s.tightness) + '</span></button>';
          }).join('') + '</div>' +
        '<div class="actions actions--left">' +
          '<button class="btn btn--small btn--primary" data-action="saveSetlist"' + (picked.length === set.size ? '' : ' disabled') + '>Save setlist</button>' +
          '<button class="btn btn--small btn--ghost" data-action="cancelSetlist">Cancel</button></div>' +
        (app.setlistError ? '<p class="pick__reason">' + h.escape(app.setlistError) + '</p>' : '');
    } else {
      setlist = '<ol class="setlist">' + e.songIds.map(function (id) {
        var s = state.songs[id];
        return s ? '<li>' + h.escape(s.title) + ' <span class="muted">(tightness ' + Math.round(s.tightness) + ')</span></li>' : '';
      }).join('') + '</ol>' +
        '<button class="btn btn--small" data-action="editSetlist" data-entry="' + e.id + '">Edit setlist</button>';
    }

    var penaltyText = 'Cancelling now (' + ahead + ' day' + (ahead === 1 ? '' : 's') + ' ahead): venue ' + penalty.venueRelationship +
      (penalty.reputation ? ', reputation ' + penalty.reputation : '') +
      (penalty.bandSatisfaction ? ', bandmates ' + penalty.bandSatisfaction + ' satisfaction' : '') +
      ', morale ' + b.morale.change.cancelGig + '.';

    // Out of town: the trip this show is part of.
    var trip = Object.keys(state.trips).map(function (id) { return state.trips[id]; }).filter(function (x) { return x.showIds.indexOf(e.id) !== -1; })[0];
    var tripText = '';
    if (trip) {
      var tr = Game.rules.travel;
      var legs = tr.tripLegs(state, trip);
      tripText = '<p class="hint">🚐 Trip: ' + legs.map(function (leg) {
        return Game.content.cities[leg.from].name + ' → ' + Game.content.cities[leg.to].name + ' (' + h.dateLabel(tr.slotDay(leg.slots[0])) + ' ' +
          Game.content.calendar.blockNames[tr.slotBlock(leg.slots[0])].toLowerCase() + ')';
      }).join(', ') + ' · gas ' + h.money(legs.reduce(function (sum, leg) { return sum + tr.legGas(leg.from, leg.to, state); }, 0)) +
        ' · ' + tr.tripNights(trip) + ' hotel night' + (tr.tripNights(trip) === 1 ? '' : 's') + (trip.needsVan ? ' · needs a van' : '') + '</p>';
    }

    return '<div class="show">' +
      '<div class="show__head">🎤 <strong>' + h.escape(venue.name) + '</strong>' + (venue.cityId !== 'hometown' ? ', ' + h.escape(Game.content.cities[venue.cityId].name) : '') +
        ' · ' + Game.content.calendar.blockNames[e.block] + '</div>' + tripText +
      '<p class="muted">' + h.escape(Game.rules.booking.dealLabel(venue, e.deal, e.fee)) + '</p>' +
      '<h4 class="show__sub">Setlist</h4>' + setlist +
      '<h4 class="show__sub">Session players</h4>' +
      '<div class="session">' +
        '<button class="btn btn--small" data-action="session" data-entry="' + e.id + '" data-change="-1"' + (e.sessionPlayers ? '' : ' disabled') + '>−</button>' +
        '<strong>' + e.sessionPlayers + '</strong>' +
        '<button class="btn btn--small" data-action="session" data-entry="' + e.id + '" data-change="1"' + (e.sessionPlayers < room ? '' : ' disabled') + '>+</button>' +
        '<span class="hint">' + h.money(b.economy.sessionPlayerFee) + ' each for this show. They count as skill ' + b.people.sessionPlayerSkill +
          ' and know every song at tightness ' + b.people.sessionPlayerTightness + '.</span>' +
      '</div>' +
      '<div class="actions actions--left"><button class="btn btn--small" data-action="cancelShow" data-entry="' + e.id + '">Cancel show</button></div>' +
      '<p class="hint">' + penaltyText + '</p>' +
      '</div>';
  }
};
