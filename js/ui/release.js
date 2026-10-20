// release.js
// One release's page (open it from a sleeve in Music → Releases, or a highlighted chart entry): its record sleeve,
// total and this week's streams, best week, chart spot and peak, Gold and Platinum records (and how close the next
// one is), a week-by-week bar chart, the tracklist with each song's streams, and any promo push or viral run.
// Draw only: the numbers come from Game.rules.streaming.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.release = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var songs = Game.ui.songs;
    var sr = Game.rules.streaming;
    var state = app.state;
    var rel = state.releases.filter(function (r) { return r.id === app.releaseId; })[0];
    var stats = sr.releaseStats(state, rel);
    var chart = rel.type === 'single' ? (state.songs[rel.songIds[0]] || {}).chart : rel.chart;
    var amounts = sr.recordAmounts(rel);
    var next = (rel.records || []).indexOf('gold') === -1 ? 'gold' : ((rel.records || []).indexOf('platinum') === -1 ? 'platinum' : null);
    var bestWeek = Math.max.apply(null, stats.weeks.concat([0]));
    var promo = rel.promo && Game.balance.streaming.promos[rel.promo.id];
    var promoLine = promo ? (rel.promo.week < promo.weeks
      ? Game.content.promos[rel.promo.id].name + ': week ' + (rel.promo.week + 1) + ' of ' + promo.weeks + ' (+' + Math.round(sr.promoBoost(rel) * 100) + '% streams this week)'
      : Game.content.promos[rel.promo.id].name + ' (finished)') : '';
    var viral = rel.songIds.filter(function (id) { return state.songs[id] && state.songs[id].streams && state.songs[id].streams.viral; })
      .map(function (id) { return '"' + h.escape(state.songs[id].title) + '"'; });

    var tracks = rel.songIds.map(function (id, i) {
      var song = state.songs[id];
      var st = song.streams || sr.newStats();
      return '<tr><td class="num">' + (i + 1) + '</td><td class="song__title">' + h.escape(song.title) + '</td>' +
        '<td class="num">' + (song.recording ? song.recording.quality : '–') + '</td>' +
        '<td class="num">' + songs.short(st.weeks.length ? st.weeks[st.weeks.length - 1] : 0) + '</td>' +
        '<td>' + songs.sparkline(st.weeks) + '</td>' +
        '<td class="num">' + songs.short(st.total) + '</td>' +
        '<td>' + songs.chartText(song.chart) + (st.viral ? ' <span class="badge badge--warn">Viral</span>' : '') + '</td></tr>';
    }).join('');

    root.innerHTML =
      Game.ui.topbar.html(state, app.screen) +
      '<div class="backdrop backdrop--songs" aria-hidden="true"></div>' +
      '<section class="screen">' +
        '<div class="screen__head">' +
          '<h1 class="screen__title">' + h.escape(rel.name) + '</h1>' +
          '<button class="btn" data-action="back">← Releases</button>' +
        '</div>' +
        '<div class="release-top">' +
          songs.sleeveHtml(state, rel, true) +
          '<div class="panel release-facts">' +
            '<h3 class="panel__title">' + Game.content.releaseTypes[rel.type].name + ', released ' + h.dateLabel(rel.day) + '</h3>' +
            '<dl class="rows rows--big">' +
              '<dt>Total streams</dt><dd>' + stats.total.toLocaleString() + '</dd>' +
              '<dt>Last week</dt><dd>' + stats.thisWeek.toLocaleString() + '</dd>' +
              '<dt>Best week</dt><dd>' + bestWeek.toLocaleString() + '</dd>' +
              '<dt>' + (rel.type === 'single' ? 'Singles chart' : 'Albums chart') + '</dt><dd>' + songs.chartText(chart) + '</dd>' +
              (chart && chart.weeks ? '<dt>Weeks on the chart</dt><dd>' + chart.weeks + '</dd>' : '') +
              '<dt>Records</dt><dd>' + ((rel.records || []).length ? rel.records.map(function (k) { return k === 'gold' ? 'Gold' : 'Platinum'; }).join(', ') : 'None yet') + '</dd>' +
            '</dl>' +
            (next ? '<p class="hint">' + (next === 'gold' ? 'Gold' : 'Platinum') + ' at ' + amounts[next].toLocaleString() + ' streams: ' +
              Math.min(100, Math.round(stats.total / amounts[next] * 100)) + '% there.</p>' +
              '<span class="meter meter--big"><span class="meter__fill" style="width:' + Math.min(100, stats.total / amounts[next] * 100) + '%"></span></span>' : '') +
            (promoLine ? '<p class="hint">' + promoLine + '</p>' : '') +
            (viral.length ? '<p class="hint"><strong>Going viral:</strong> ' + viral.join(', ') + '</p>' : '') +
          '</div>' +
        '</div>' +
        '<div class="panel"><h3 class="panel__title">Week by week</h3>' + Game.ui.release.chartSvg(stats.weeks) + '</div>' +
        '<div class="tracklist paper"><h3 class="panel__title">Tracklist</h3>' +
          '<table class="song-table"><thead><tr><th class="num">#</th><th>Song</th><th class="num">Quality</th><th class="num">Last week</th><th>Trend</th><th class="num">Total</th><th>Singles chart</th></tr></thead>' +
          '<tbody>' + tracks + '</tbody></table>' +
        '</div>' +
      '</section>';

    h.bind(root, {
      back: function () { app.closeRelease(); },
      focusPayBack: function () { app.closeRelease(); }
    });
  },

  // A bar chart of the release's weekly streams (an SVG, drawn here with no libraries). The bars line up from the
  // right (last week is always at the right edge), and there's always room for a few months of bars, so a brand-new
  // release shows one normal bar instead of one giant one.
  chartSvg: function (weeks) {
    if (!weeks.length) return '<p class="hint">Streams start the Sunday after release.</p>';
    var W = 900, H = 200, pad = 40;
    var max = Math.max.apply(null, weeks.concat([1]));
    var slots = Math.max(weeks.length, Game.balance.ui.streamChartWeeks);
    var slot = (W - pad) / slots;
    var first = pad + (slots - weeks.length) * slot;   // where the oldest bar starts
    var bars = weeks.map(function (v, i) {
      var hgt = (H - 30) * v / max;
      return '<rect class="chart__in" x="' + (first + i * slot + slot * 0.15).toFixed(1) + '" y="' + (H - 20 - hgt).toFixed(1) + '" width="' + (slot * 0.7).toFixed(1) +
        '" height="' + hgt.toFixed(1) + '"><title>' + v.toLocaleString() + ' streams</title></rect>';
    }).join('');
    var oldest = weeks.length > 1
      ? '<text class="chart__label" x="' + first.toFixed(1) + '" y="' + (H - 4) + '">' + weeks.length + ' weeks ago</text>' : '';
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Streams each week">' +
      '<line class="chart__axis" x1="' + pad + '" y1="' + (H - 20) + '" x2="' + W + '" y2="' + (H - 20) + '"/>' +
      '<text class="chart__label" x="0" y="14">' + Game.ui.songs.short(max) + '</text>' +
      oldest + '<text class="chart__label" x="' + W + '" y="' + (H - 4) + '" text-anchor="end">last week</text>' + bars + '</svg>';
  }
};
