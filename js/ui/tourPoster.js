// tourPoster.js
// Draws a tour's poster on a canvas: a day-glo gig poster with the band's name, the tour's name, and every date,
// city, and venue, and saves it as a PNG to share. Lettering only (no photos), so it can be saved even from a
// double-clicked file. Draw only: the details come from Game.rules.tours.posterData.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.tourPoster = {

  // The poster's size in pixels (a tall poster).
  width: 900,
  height: 1260,

  // Day-glo poster papers, picked by the tour's number, and the ink.
  papers: ['#f7d83e', '#ff8ec0', '#7dd8ea', '#b6f36b', '#ffb054'],
  ink: '#141414',
  red: '#b3261e',

  font: function (size, weight, hand) {
    return (weight || 'normal') + ' ' + size + 'px ' + (hand ? '"Permanent Marker", cursive' : '"Barlow Condensed", "Arial Narrow", sans-serif');
  },

  // Shrinks a font size until the text fits the width.
  fit: function (ctx, text, size, weight, maxWidth) {
    var self = Game.ui.tourPoster;
    while (size > 12) {
      ctx.font = self.font(size, weight);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  },

  // Draws the poster. data: from Game.rules.tours.posterData. index: which tour (picks the paper color).
  draw: function (canvas, data, index) {
    if (!canvas || !canvas.getContext) return;
    var self = Game.ui.tourPoster;
    var ctx = canvas.getContext('2d');
    var W = self.width, H = self.height, pad = 70;

    // The paper, a little lighter at the top, with a thick ink border.
    ctx.fillStyle = self.papers[index % self.papers.length];
    ctx.fillRect(0, 0, W, H);
    var shine = ctx.createLinearGradient(0, 0, 0, H);
    shine.addColorStop(0, 'rgba(255,255,255,0.35)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = self.ink;
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.fillStyle = self.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // The band, then the tour's name as big as it fits (up to three lines).
    var y = 160;
    ctx.font = self.font(self.fit(ctx, data.band.toUpperCase(), 64, '800', W - 2 * pad), '800');
    ctx.fillText(data.band.toUpperCase(), W / 2, y);
    ctx.font = self.font(30, 'normal', true);
    ctx.fillStyle = self.red;
    ctx.fillText('live on the', W / 2, y + 56);
    ctx.fillStyle = self.ink;

    var words = data.title.toUpperCase().split(' ');
    var lines = [];
    var size = 120;
    ctx.font = self.font(size, '800');
    words.forEach(function (w) {
      var last = lines[lines.length - 1];
      if (last && ctx.measureText(last + ' ' + w).width <= W - 2 * pad) lines[lines.length - 1] = last + ' ' + w;
      else lines.push(w);
    });
    if (lines.length > 3) { lines = [data.title.toUpperCase()]; }
    y += 170;
    lines.forEach(function (line) {
      var s = self.fit(ctx, line, size, '800', W - 2 * pad);
      ctx.font = self.font(s, '800');
      ctx.fillText(line, W / 2, y);
      y += s * 0.95;
    });

    // A rule, then one line per show: the date on the left, the city and venue on the right.
    y += 20;
    ctx.fillRect(pad, y, W - 2 * pad, 6);
    y += 60;
    var rows = data.rows;
    var space = H - 150 - y;
    var rowH = Math.min(62, Math.max(30, Math.floor(space / Math.max(1, rows.length))));
    rows.forEach(function (r) {
      ctx.textAlign = 'left';
      ctx.font = self.font(Math.round(rowH * 0.62), '800');
      ctx.fillText(r.date.toUpperCase(), pad, y);
      ctx.textAlign = 'right';
      var place = r.city.toUpperCase() + '  ' + r.venue;
      ctx.font = self.font(self.fit(ctx, place, Math.round(rowH * 0.62), '700', W - 2 * pad - 230), '700');
      ctx.fillText(place, W - pad, y);
      y += rowH;
    });

    // The footer.
    ctx.textAlign = 'center';
    ctx.font = self.font(26, '700');
    ctx.fillText('BAND RISE', W / 2, H - 70);
  },

  // Saves the poster as a PNG file (works from a double-clicked file too).
  save: function (canvas, data) {
    if (!canvas || !canvas.toDataURL) return;
    var fileName = 'band-rise-' + data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-poster.png';
    if (Game.ui.mobile.isPhone() && Game.ui.mobile.shareFile(Game.ui.mobile.canvasBlob(canvas), fileName, data.title)) return; // phone: share sheet
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // The poster in a pop-up (a clipboard): the canvas and Save / Close buttons.
  modalHtml: function () {
    var self = Game.ui.tourPoster;
    return '<div class="overlay" data-action="closePoster">' +
      '<div class="modal modal--poster" role="dialog" aria-label="Tour poster">' +
        '<div class="modal__paper">' +
          '<div class="modal__head"><h2 class="modal__title">Tour poster</h2>' +
            '<button class="btn btn--ghost btn--small" data-action="closePoster">Close</button></div>' +
          '<canvas id="tour-poster" class="tour-poster" width="' + self.width + '" height="' + self.height + '"></canvas>' +
          '<div class="actions"><button class="btn btn--primary" data-action="savePoster">Save as image</button></div>' +
        '</div>' +
      '</div></div>';
  },

  // Draws the poster into its canvas (again once the fonts have loaded) and connects Save, Close, and a click
  // outside the pop-up.
  bindModal: function (root, app, state, tourId) {
    var self = Game.ui.tourPoster;
    var canvas = root.querySelector('#tour-poster');
    var data = Game.rules.tours.posterData(state, tourId);
    var index = state.tours.map(function (t) { return t.id; }).indexOf(tourId);
    self.draw(canvas, data, index);
    if (document.fonts) {
      document.fonts.load('800 60px "Barlow Condensed"').then(function () { self.draw(root.querySelector('#tour-poster'), data, index); });
    }
    var overlay = root.querySelector('.overlay[data-action="closePoster"]');
    overlay.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (!target) return;
      var action = target.getAttribute('data-action');
      if (action === 'savePoster') self.save(canvas, data);
      if (action === 'closePoster' && (target !== overlay || event.target === overlay)) app.closeTourPoster();
    });
  }
};
