// songs.js (the Music tab)
// Everything about your music, in three sections (in front of a dim picture of a bedroom studio):
// - Writing: the song in progress (a notebook page) and the catalog, printed like a cassette tracklist, with each
//   released song's streams (this week, a trend line, and the total)
// - Releases: your discography as record sleeves (click one for its page), and the form to put out a Single, EP, or
//   Album (with a name and an optional release-week promo push)
// - Charts: this week's Top 40 singles and Top 20 albums, with your entries highlighted
// The screen id is still 'songs'. Draw only: the numbers come from Game.rules.streaming and Game.rules.recording.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.songs = {

  sections: [['writing', 'Writing'], ['releases', 'Releases'], ['charts', 'Charts']],

  render: function (root, app) {
    var h = Game.ui.helpers;
    var self = Game.ui.songs;
    var state = app.state;
    var section = app.musicSection || 'writing';
    var tabs = self.sections.map(function (sct) {
      return '<button class="btn btn--small' + (sct[0] === section ? ' btn--primary' : '') + '" data-action="section" data-section="' + sct[0] + '">' + sct[1] + '</button>';
    }).join('');
    var body = section === 'releases' ? self.releasesHtml(state, app) : (section === 'charts' ? self.chartsHtml(state) : self.writingHtml(state));

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<div class="backdrop backdrop--songs" aria-hidden="true"></div>' +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">Music</h1>' +
          '<button class="btn" data-action="back">← Back</button>' +
        '</div>' +
        h.notice(app.notice) +
        '<div class="sort-bar">' + tabs + '</div>' +
        body +
      '</section>';

    h.bind(root, {
      back: function () { app.closeSongs(); },
      focusPayBack: function () { app.closeSongs(); },
      section: function (e, el) { app.setMusicSection(el.getAttribute('data-section')); },
      openRelease: function (e, el) { app.openRelease(el.getAttribute('data-release')); },
      releaseType: function (e, el) { app.releaseDraft = { type: el.getAttribute('data-type'), songIds: [], name: '', promo: null }; app.render(); },
      releaseToggle: function (e, el) {
        var ids = app.releaseDraft.songIds;
        var id = el.getAttribute('data-song');
        var i = ids.indexOf(id);
        if (i === -1) ids.push(id); else ids.splice(i, 1);
        app.render();
      },
      releasePromo: function (e, el) { app.releaseDraft.promo = el.getAttribute('data-promo') || null; app.render(); },
      release: function () {
        var d = app.releaseDraft;
        var name = Game.content.releaseTypes[d.type].name;
        if (window.confirm('Release your ' + name + ' now? Released songs can\'t be released again.')) app.releaseMusic();
      }
    });
    // The release name is remembered as you type (no redraw, so the box keeps its place).
    var nameBox = root.querySelector('#release-name');
    if (nameBox) nameBox.addEventListener('input', function () { app.releaseDraft.name = nameBox.value; });
  },

  // ----- Shared pieces (also used by the release page) -----

  // A small trend line of weekly numbers (an SVG), or a dash when there's no history yet.
  sparkline: function (values) {
    if (!values || values.length < 2) return '<span class="muted">–</span>';
    var w = 90, hgt = 24;
    var max = Math.max.apply(null, values.concat([1]));
    var pts = values.map(function (v, i) {
      return (i / (values.length - 1) * w).toFixed(1) + ',' + (hgt - v / max * (hgt - 2) - 1).toFixed(1);
    }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + hgt + '" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  },

  // Big numbers made short: 1,250,000 -> "1.25M", 48,300 -> "48.3K".
  short: function (n) {
    if (n >= 1000000) return (Math.round(n / 10000) / 100) + 'M';
    if (n >= 1000) return (Math.round(n / 100) / 10) + 'K';
    return String(Math.round(n));
  },

  // A release's record sleeve: a color and pattern picked from its id, its name, the band, and any record stickers.
  // big: true for the release page.
  sleeveHtml: function (state, rel, big) {
    var h = Game.ui.helpers;
    var covers = Game.content.covers;
    var n = Number(String(rel.id).replace(/\D/g, '')) || 0;
    var color = covers.colors[n % covers.colors.length];
    var pattern = covers.patterns[(n * covers.patternStep) % covers.patterns.length];
    var stickers = (rel.records || []).map(function (kind) {
      return '<span class="sleeve__sticker sleeve__sticker--' + kind + '">' + (kind === 'gold' ? 'Gold' : 'Platinum') + '</span>';
    }).join('');
    return '<span class="sleeve sleeve--' + pattern + (big ? ' sleeve--big' : '') + '" style="--sleeve: ' + color + '">' +
      '<span class="sleeve__type">' + Game.content.releaseTypes[rel.type].name + '</span>' +
      '<span class="sleeve__title">' + h.escape(rel.name) + '</span>' +
      '<span class="sleeve__band">' + h.escape(state.band.name || state.player.name) + '</span>' +
      (stickers ? '<span class="sleeve__stickers">' + stickers + '</span>' : '') +
      '</span>';
  },

  // A chart spot as text: "#12" (with its peak), or "-".
  chartText: function (chart) {
    if (!chart || !chart.peak) return '<span class="muted">–</span>';
    return (chart.pos ? '#' + chart.pos : 'off') + ' <span class="muted">(peak #' + chart.peak + ')</span>';
  },

  // ----- Writing -----

  writingHtml: function (state) {
    var h = Game.ui.helpers;
    var b = Game.balance.songs;
    var self = Game.ui.songs;
    var songs = Game.rules.songs.list(state);
    var writing = Game.rules.songs.inProgress(state);

    var progressPanel;
    if (writing) {
      var perBlock = Game.rules.songs.progressPerBlock(state.player.skills.songwriting);
      var blocksLeft = Math.ceil((b.progressToFinish - writing.progress) / perBlock);
      progressPanel = '<div class="notebook paper">' +
        '<h3 class="panel__title">Writing now</h3>' +
        '<div class="writing">' +
          '<span class="writing__title">' + h.escape(writing.title) + '</span>' +
          '<span class="meter meter--big"><span class="meter__fill" style="width:' + Math.round(writing.progress) + '%"></span></span>' +
          '<span class="writing__numbers">' + Math.round(writing.progress) + ' / ' + b.progressToFinish +
            ' · about ' + blocksLeft + ' more Write block' + (blocksLeft === 1 ? '' : 's') + ' (+' + Game.util.round1(perBlock) + ' each)</span>' +
        '</div></div>';
    } else {
      progressPanel = '<div class="notebook paper"><h3 class="panel__title">Writing now</h3>' +
        '<p class="hint">Nothing in progress. Plan a <strong>Write</strong> block to start a new original.</p></div>';
    }

    var fadeDays = b.tightness.decayAfterDays;
    var rows = songs.map(function (song) {
      var days = Game.rules.songs.daysSincePlayed(state, song);
      var fading = days >= fadeDays && song.tightness > b.tightness.floor;
      var st = song.streams;
      var streamsCell = st
        ? '<span class="streams"><span class="streams__week">' + self.short(st.weeks.length ? st.weeks[st.weeks.length - 1] : 0) + '</span>' +
          self.sparkline(st.weeks) + '<span class="muted">' + self.short(st.total) + ' total</span></span>'
        : '<span class="muted">' + (song.isCover ? 'Cover' : (song.recording ? 'Not released' : 'Not recorded')) + '</span>';
      return '<tr>' +
        '<td class="song__title">' + h.escape(song.title) + '</td>' +
        '<td><span class="tag tag--' + (song.isCover ? 'cover' : 'original') + '">' + (song.isCover ? 'Cover' : 'Original') + '</span></td>' +
        '<td>' + h.stars(song.quality) + '</td>' +
        '<td class="num" data-label="Quality">' + song.quality + '</td>' +
        '<td class="song__tight" data-label="Tightness"><span class="meter meter--tight"><span class="meter__fill" style="width:' + Math.round(song.tightness) + '%"></span></span>' +
          '<span class="num">' + Math.round(song.tightness) + '</span></td>' +
        '<td class="' + (fading ? 'song__fading' : 'muted') + '" data-label="Last played">' + (days <= 0 ? 'Today' : days + (days === 1 ? ' day' : ' days')) + (fading ? ' · fading' : '') + '</td>' +
        '<td data-label="Recording">' + self.recordingCell(state, song) + '</td>' +
        '<td data-label="Streams">' + streamsCell + '</td>' +
        '</tr>';
    }).join('');
    var originals = songs.filter(function (x) { return !x.isCover; }).length;

    return progressPanel +
      '<div class="tracklist paper">' +
        '<h3 class="panel__title">Catalog: ' + originals + ' original' + (originals === 1 ? '' : 's') + ', ' + (songs.length - originals) + ' covers</h3>' +
        '<table class="song-table song-table--catalog">' +
          '<thead><tr><th>Title</th><th>Type</th><th>Stars</th><th class="num">Quality</th><th>Tightness</th><th>Last played</th><th>Recording</th><th>Streams (this week)</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<p class="hint">Tightness is how well you know a song. Practice adds +' + b.tightness.practiceGain + '. Songs unplayed for ' + fadeDays +
          ' days lose ' + (-b.tightness.decayPerWeek) + ' a week (never below ' + b.tightness.floor + '). Released songs you play live stream more that week.</p>' +
      '</div>';
  },

  // A song's recording: quality and where, and which release it's on.
  recordingCell: function (state, song) {
    if (song.isCover) return '<span class="muted">Cover</span>';
    if (!song.recording) return '<span class="muted">Not recorded</span>';
    var rel = song.releaseId && state.releases.filter(function (r) { return r.id === song.releaseId; })[0];
    return '<strong>' + song.recording.quality + '</strong> <span class="muted">' + Game.content.studios[song.recording.studio].name +
      '</span>' + (rel ? ' <span class="tag tag--original">' + Game.content.releaseTypes[rel.type].name + '</span>' : '');
  },

  // ----- Releases -----

  releasesHtml: function (state, app) {
    var h = Game.ui.helpers;
    var self = Game.ui.songs;
    var sleeves = state.releases.slice().reverse().map(function (rel) {
      var stats = Game.rules.streaming.releaseStats(state, rel);
      var chart = rel.type === 'single' ? (state.songs[rel.songIds[0]] || {}).chart : rel.chart;
      return '<button class="disc-card" data-action="openRelease" data-release="' + rel.id + '">' +
        self.sleeveHtml(state, rel, false) +
        '<span class="disc-card__name">' + h.escape(rel.name) + '</span>' +
        '<span class="disc-card__meta">' + Game.content.releaseTypes[rel.type].name + ', ' + Game.rules.day.shortDate(rel.day) + '</span>' +
        '<span class="disc-card__meta">' + self.short(stats.total) + ' streams' + (chart && chart.peak ? ' · peak #' + chart.peak : '') + '</span>' +
        '</button>';
    }).join('');
    var week = state.charts.week;
    return '<div class="panel">' +
        '<h3 class="panel__title">Discography</h3>' +
        (week ? '<p class="hint">Last Sunday: ' + week.streams.toLocaleString() + ' streams, ' + h.money(week.pay) + '.</p>' : '') +
        (sleeves ? '<div class="discography">' + sleeves + '</div>' : '<p class="hint">Nothing released yet. Record your originals (Book → Studio time), then release them below.</p>') +
      '</div>' +
      self.releaseFormHtml(state, app);
  },

  // Put together a release: pick Single, EP, or Album, tick recorded songs, name it, pick a promo push, see what it
  // would do, release.
  releaseFormHtml: function (state, app) {
    var h = Game.ui.helpers;
    var b = Game.balance.releases;
    var draft = app.releaseDraft;
    var ready = Game.rules.recording.releasable(state);
    if (!ready.length) {
      return '<div class="panel"><h3 class="panel__title">Release music</h3>' +
        '<p class="hint">Record your originals first (Book → Studio time). Recorded songs you haven\'t released yet show up here.</p></div>';
    }
    var types = Object.keys(b.sizes).map(function (type) {
      var size = b.sizes[type];
      return '<button class="btn btn--small' + (draft.type === type ? ' btn--primary' : '') + '" data-action="releaseType" data-type="' + type + '">' +
        Game.content.releaseTypes[type].name + ' (' + (size.min === size.max ? size.min : size.min + '-' + size.max) + ')</button>';
    }).join('');
    var list = ready.map(function (song) {
      var on = draft.songIds.indexOf(song.id) !== -1;
      return '<button class="setlist-song' + (on ? ' setlist-song--on' : '') + '" data-action="releaseToggle" data-song="' + song.id + '">' +
        '<span class="check">' + (on ? '✓' : '') + '</span>' + h.escape(song.title) + '<span class="muted"> · recording quality ' + song.recording.quality + '</span></button>';
    }).join('');
    var promos = Game.balance.streaming.promos;
    var promoBtns = '<button class="btn btn--small' + (!draft.promo ? ' btn--primary' : '') + '" data-action="releasePromo" data-promo="">No push</button>' +
      Object.keys(promos).map(function (id) {
        var p = promos[id];
        return '<button class="btn btn--small' + (draft.promo === id ? ' btn--primary' : '') + '" data-action="releasePromo" data-promo="' + id + '" title="' +
          h.escape(Game.content.promos[id].blurb) + '">' + Game.content.promos[id].name + ' ' + h.money(p.cost) + '</button>';
      }).join('');
    var chosen = draft.promo ? promos[draft.promo] : null;
    var problem = Game.rules.recording.releaseProblem(state, draft.type, draft.songIds, draft.name, draft.promo);
    var preview = '';
    if (!problem) {
      var p = Game.rules.recording.releasePreview(state, draft.type, draft.songIds);
      var fans = Object.keys(p.fansPerCity).reduce(function (sum, id) { return sum + p.fansPerCity[id]; }, 0);
      preview = '<p class="hint">Average recording quality ' + Math.round(p.avgQuality) + ' · about ' +
        (fans ? Game.util.signed(p.buzz) + ' buzz' + (p.halved ? ' (halved: your last release was under ' + b.spamWindowWeeks + ' weeks ago)' : '') + ', +' + Math.round(fans) + ' fans' : 'no buzz or fans yet (you need fans first)') +
        ', ' + Game.util.signed(p.reputation) + ' reputation. Streams start next Sunday.</p>';
    }
    var nameRow = draft.type === 'single' ? '' :
      '<label class="form-row"><span class="muted">' + Game.content.releaseTypes[draft.type].name + ' name (optional, or it\'s named after its first song):</span>' +
        '<input type="text" id="release-name" class="input" maxlength="' + b.nameMaxLength + '" autocomplete="off" value="' + h.escape(draft.name || '') + '"></label>';
    return '<div class="panel"><h3 class="panel__title">Release music</h3>' +
      Game.ui.songs.labelRulesHtml(state, draft) +
      '<div class="form-row__btns">' + types + '</div>' +
      '<div class="setlist-edit release-list">' + list + '</div>' +
      nameRow +
      '<div class="form-row"><span class="muted">Release-week push:</span><div class="form-row__btns">' + promoBtns + '</div>' +
        (chosen ? '<span class="hint">' + Game.content.promos[draft.promo].name + ': +' + Math.round(chosen.boost * 100) + '% streams the first week, fading over ' +
          chosen.weeks + ' weeks.</span>' : '') + '</div>' +
      preview +
      '<div class="actions actions--left"><button class="btn btn--primary" data-action="release"' + (problem ? ' disabled title="' + h.escape(problem) + '"' : '') + '>' +
        'Release ' + Game.content.releaseTypes[draft.type].name + (chosen ? ' (' + h.money(chosen.cost) + ')' : '') + '</button>' +
        (problem && draft.songIds.length ? ' <span class="pick__reason">' + h.escape(problem) + '</span>' : '') + '</div>' +
      '</div>';
  },

  // Signed to a label: how this release fits the deal (records owed, the quality bar, shelving, the free promo push).
  labelRulesHtml: function (state, draft) {
    var h = Game.ui.helpers;
    var lb = Game.rules.label;
    var d = state.label.deal;
    if (!d || d.legacy) return '';
    var counts = lb.counts(d, draft.type);
    var bits = [counts ? 'This counts toward your deal: ' + (d.delivered + 1) + ' of ' + d.owe.count + ' (due ' + Game.rules.day.shortDate(d.nextDueDay) + ').'
      : 'A ' + Game.content.releaseTypes[draft.type].name.toLowerCase() + ' doesn\'t count toward your deal (you owe ' + lb.oweText(d) + ').'];
    if (d.qualityBar) bits.push('They won\'t release anything under average quality ' + d.qualityBar + '.');
    if (counts && d.flopQuality) bits.push('Under ' + d.flopQuality + ' counts as a flop (a strike).');
    if (d.control === 'shelve') bits.push('They may hold it for a few weeks.');
    if (d.freePromo) bits.push('With no push picked, they pay for a ' + Game.content.promos[d.freePromo].name.toLowerCase() + '.');
    bits.push('On these records you get ' + Math.round(d.royalty * 100) + '% of streaming' + (d.unrecouped > 0 ? ', after paying back ' + h.money(d.unrecouped) : '') + '.');
    return '<p class="label-note"><strong>' + h.escape(lb.name(d.labelId)) + ':</strong> ' + h.escape(bits.join(' ')) + '</p>';
  },

  // ----- Charts -----

  chartsHtml: function (state) {
    var h = Game.ui.helpers;
    var self = Game.ui.songs;
    var c = state.charts;
    if (!c.day) return '<div class="panel"><h3 class="panel__title">Charts</h3><p class="hint">The charts come out on Sunday night' +
      (state.releases.length ? '.' : ', once you\'ve released something.') + '</p></div>';
    var best = Game.rules.streaming.best(state);
    var bestLine = [best.single ? '"' + h.escape(best.single.title) + '" is #' + best.singlePos + ' on the singles chart' : '',
      best.album ? '"' + h.escape(best.album.title) + '" is #' + best.albumPos + ' on the albums chart' : ''].filter(Boolean).join(', and ');
    var table = function (entries, title) {
      return '<div class="chart-sheet paper"><h3 class="panel__title">' + title + '</h3>' +
        '<table class="chart-table"><thead><tr><th class="num">#</th><th>Last</th><th>Title</th><th>Artist</th><th class="num">Peak</th><th class="num">Weeks</th><th class="num">Streams</th></tr></thead><tbody>' +
        entries.map(function (e, i) {
          var pos = i + 1;
          var move = e.last === null ? '<span class="chart-move chart-move--new">New</span>'
            : (e.last > pos ? '<span class="chart-move chart-move--up">▲ ' + (e.last - pos) + '</span>'
              : (e.last < pos ? '<span class="chart-move chart-move--down">▼ ' + (pos - e.last) + '</span>' : '<span class="chart-move">=</span>'));
          var attrs = e.mine && e.releaseId ? ' class="chart-row--mine" data-action="openRelease" data-release="' + e.releaseId + '" title="Open this release"' : '';
          return '<tr' + attrs + '><td class="num chart-pos">' + pos + '</td><td>' + move + '</td><td class="chart-title">' + h.escape(e.title) + '</td>' +
            '<td>' + h.escape(e.artist) + (e.bandId && state.scene.bands[e.bandId] && state.scene.bands[e.bandId].rival ? ' <span class="badge badge--rival">Rival</span>' : '') +
            '</td><td class="num">' + e.peak + '</td><td class="num">' + e.weeks + '</td><td class="num">' + self.short(e.streams) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    };
    return '<p class="hint">Charts for the week ending ' + h.dateLabel(c.day) + '. ' + (bestLine ? bestLine + '.' : 'None of your music is on the charts this week.') + '</p>' +
      '<div class="charts-grid">' + table(c.singles, 'Top ' + c.singles.length + ' singles') + table(c.albums, 'Top ' + c.albums.length + ' albums') + '</div>';
  }
};
