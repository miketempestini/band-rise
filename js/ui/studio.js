// studio.js (screen)
// The Studio time section on the Book screen (hometown only): pick a studio, a day 10+ days ahead, and a song for
// up to 3 blocks that day, then book it from a block today. Draw only; Game.app's studio actions do the rest.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.studio = {

  // The Studio section: pick a studio, a day 10+ days ahead, and a song for up to 3 blocks that day.
  html: function (state, app) {
    var h = Game.ui.helpers;
    var r = Game.balance.recording;
    var draft = app.studioDraft;
    var originals = Game.rules.recording.recordable(state);

    var studios = ['demo', 'pro', 'top'].map(function (id) {
      var st = r.studios[id];
      var problem = Game.rules.recording.studioProblem(state, id);
      var chosen = draft && draft.studio === id;
      return '<div class="deal' + (chosen ? ' deal--chosen' : '') + (problem ? ' deal--locked' : '') + '">' +
        '<div class="deal__head"><strong>' + Game.content.studios[id].name + '</strong><span class="deal__chance">' +
          h.money(st.cost) + ' a block · +' + st.bonus + '</span></div>' +
        '<p class="hint">' + h.escape(Game.content.studios[id].blurb) + '</p>' +
        (problem ? '<p class="pick__reason">' + h.escape(problem) + '</p>'
          : '<div class="deal__foot"><span></span><button class="btn btn--small' + (chosen ? ' btn--primary' : '') +
            '" data-action="studioPick" data-studio="' + id + '"' + (originals.length ? '' : ' disabled title="Write an original first"') + '>' +
            (chosen ? 'Chosen' : 'Book this') + '</button></div>') +
        '</div>';
    }).join('');

    var form = draft ? Game.ui.studio.formHtml(state, app, draft, originals) : '';
    return '<div class="panel">' +
      '<h3 class="panel__title">Studio time · book ' + r.bookAheadDays + ' to ' + r.bookAheadMaxDays + ' days ahead · one song per block</h3>' +
      '<p class="hint">Recording quality = half the song\'s quality + a quarter of band musicianship + a quarter of its tightness + the studio bonus. ' +
        'Rehearse a song before recording it. ' +
        (state.player.gear.homeStudio ? 'You own a home setup: use "Record at home" from any free block.' : 'A home setup (in the Shop after your first recording) records for free, capped at ' + r.studios.home.qualityCap + '.') +
        '</p>' +
      (originals.length ? '' : '<p class="pick__reason">You need a finished original to record.</p>') +
      '<div class="venue-grid">' + studios + '</div>' + form +
      '</div>';
  },

  formHtml: function (state, app, draft, originals) {
    var h = Game.ui.helpers;
    var r = Game.balance.recording;
    var studio = r.studios[draft.studio];
    var dates = Game.rules.recording.bookingDays(state).map(function (d) {
      var label = Game.rules.day.shortDate(d);
      return '<button class="date-btn' + (draft.day === d ? ' date-btn--on' : '') + '" data-action="studioDate" data-day="' + d + '">' + label + '</button>';
    }).join('');

    var blocksHtml = '';
    var sessions = [];
    if (draft.day !== null) {
      blocksHtml = Game.balance.time.blocks.map(function (block) {
        var problem = Game.rules.recording.blockProblem(state, draft.day, block);
        var job = !problem && Game.rules.booking.clashesWithJob(state, draft.day, block);
        var picked = draft.sessions[block] || '';
        if (picked) sessions.push({ block: block, songId: picked });
        var options = '<option value="">(no song)</option>' + originals.map(function (s) {
          return '<option value="' + s.id + '"' + (picked === s.id ? ' selected' : '') + '>' + h.escape(s.title) +
            ' (would record at about ' + Game.rules.recording.quality(state, s, draft.studio) + ')</option>';
        }).join('');
        return '<div class="plan__row"><span class="plan__block">' + Game.content.calendar.blockNames[block] + '</span>' +
          (problem ? '<span class="muted">' + h.escape(problem) + '</span>'
            : '<select class="input input--select studio-song" data-block="' + block + '">' + options + '</select>' +
              (job ? '<span class="badge badge--warn">Day job</span>' : '')) +
          '</div>';
      }).join('');
    }

    var needsDayOff = sessions.some(function (s) { return Game.rules.booking.clashesWithJob(state, draft.day, s.block); });
    var dayOff = needsDayOff ? '<div class="form-row"><span class="muted">That\'s during your day job. Take the day off:</span><div class="form-row__btns">' +
      [['vacation', 'Vacation day'], ['sick', 'Call in sick (' + Game.balance.job.sickDayPenalty + ')'], ['skip', 'Skip work (' + Game.balance.job.skipPenalty + ')']].map(function (k) {
        var problem = Game.rules.job.dayOffProblem(state, draft.day, k[0], true);
        return '<label class="switch"><input type="radio" name="studio-dayoff" value="' + k[0] + '"' + (draft.jobChoice === k[0] ? ' checked' : '') +
          (problem ? ' disabled' : '') + '> ' + k[1] + (problem ? ' <span class="muted">(' + h.escape(problem) + ')</span>' : '') + '</label>';
      }).join('') + '</div></div>' : '';

    var request = { studio: draft.studio, day: draft.day, sessions: sessions, jobChoice: needsDayOff ? draft.jobChoice : null };
    var problem = draft.day === null ? null : Game.rules.recording.requestProblem(state, request);
    var send = '';
    if (draft.day !== null && sessions.length && !problem) {
      send = '<div class="form-row"><span class="muted">' + sessions.length + ' song' + (sessions.length === 1 ? '' : 's') + ' · ' +
        h.money(sessions.length * studio.cost) + ' paid on the day. Book it in which block today? (' + Game.content.actions.bookStudio.energyCost + ' energy)</span>' +
        '<div class="form-row__btns">' + Game.balance.time.blocks.map(function (block) {
          var opt = Game.rules.actions.option(Game.rules.actions.clear(state, block).state, block, 'bookStudio');
          var current = Game.rules.actions.plannedEntry(state, block);
          var ok = opt.ok && !(current && current.type !== 'action');
          return '<button class="btn btn--small' + (ok ? ' btn--primary' : '') + '" data-action="studioSend" data-block="' + block + '"' +
            (ok ? '' : ' disabled title="' + h.escape(opt.reason || 'Something is booked then') + '"') + '>' + Game.content.calendar.blockNames[block] + '</button>';
        }).join('') + '</div></div>';
    } else if (problem && sessions.length) {
      send = '<p class="pick__reason">' + h.escape(problem) + '</p>';
    }

    return '<div class="booking-form">' +
      '<div class="form-row"><span class="muted">Pick a day:</span><div class="dates">' + dates + '</div></div>' +
      (blocksHtml ? '<div class="plan">' + blocksHtml + '</div>' : '') +
      dayOff + send +
      '<div class="actions actions--left"><button class="btn btn--ghost btn--small" data-action="studioCancel">Never mind</button></div>' +
      '</div>';
  }
};
