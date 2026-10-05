// careerCard.js
// Draws the career card (Phase 13) on a canvas: a clean summary of your career (fame level, days played, fans,
// songs, biggest show) in the game's colors, and saves it as a PNG image to share. Draw only: the numbers come
// from Game.rules.progress.careerCard. No libraries: just the browser's built-in canvas.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.careerCard = {

  // The card's size in pixels (a common size for sharing images).
  width: 1200,
  height: 630,

  // The game's colors (the same as the variables at the top of styles.css).
  colors: { bg: '#1b1a2e', panel: '#262443', panel2: '#312e52', line: '#423e6b', text: '#f7f3ea', muted: '#b3adcb',
    accent: '#ffb547', teal: '#4fd1c5', pink: '#ff7eb6' },

  font: function (size, weight) {
    return (weight || 'normal') + ' ' + size + 'px ui-rounded, "SF Pro Rounded", "Nunito", "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  },

  // A rounded rectangle path.
  roundRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // Draws the card. card: from Game.rules.progress.careerCard.
  draw: function (canvas, card) {
    if (!canvas || !canvas.getContext) return;
    var self = Game.ui.careerCard;
    var c = self.colors;
    var ctx = canvas.getContext('2d');
    var W = self.width;
    var H = self.height;

    // Background, a soft stage-light glow, and a border.
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);
    var glow = ctx.createRadialGradient(W * 0.85, -40, 20, W * 0.85, -40, 520);
    glow.addColorStop(0, 'rgba(255, 181, 71, 0.35)');
    glow.addColorStop(1, 'rgba(255, 181, 71, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 6;
    self.roundRect(ctx, 18, 18, W - 36, H - 36, 28);
    ctx.stroke();

    // Header: the game, the player, the band.
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = c.accent;
    ctx.font = self.font(26, 'bold');
    ctx.fillText('BAND RISE · CAREER CARD', 64, 82);
    ctx.fillStyle = c.text;
    ctx.font = self.font(64, 'bold');
    ctx.fillText(card.name, 64, 160);
    ctx.fillStyle = c.muted;
    ctx.font = self.font(28);
    ctx.fillText(card.instrument + (card.band ? ' · ' + card.band : ' · solo') + ' · ' + card.home, 64, 202);

    // Fame level badge.
    ctx.font = self.font(34, 'bold');
    var fameText = '⭐ ' + card.fame;
    var fw = ctx.measureText(fameText).width + 48;
    ctx.fillStyle = c.accent;
    self.roundRect(ctx, 64, 232, fw, 64, 32);
    ctx.fill();
    ctx.fillStyle = c.bg;
    ctx.fillText(fameText, 88, 276);

    // Stat tiles: fans, days played, songs, milestones.
    var tiles = [
      ['FANS', card.fans.toLocaleString()],
      ['DAYS PLAYED', card.days.toLocaleString() + '  (' + card.weeks + ' wk)'],
      ['ORIGINAL SONGS', card.originals + '  ·  ' + card.releases + ' release' + (card.releases === 1 ? '' : 's')],
      ['MILESTONES', card.milestones + ' of ' + card.milestonesTotal + '  ·  rep ' + card.reputation]
    ];
    var tw = (W - 128 - 3 * 20) / 4;
    tiles.forEach(function (t, i) {
      var x = 64 + i * (tw + 20);
      ctx.fillStyle = c.panel2;
      self.roundRect(ctx, x, 328, tw, 120, 18);
      ctx.fill();
      ctx.fillStyle = c.muted;
      ctx.font = self.font(18, 'bold');
      ctx.fillText(t[0], x + 22, 364);
      ctx.fillStyle = c.text;
      ctx.font = self.font(t[1].length > 14 ? 26 : 38, 'bold');
      ctx.fillText(t[1], x + 22, 418);
    });

    // Biggest show.
    ctx.fillStyle = c.panel;
    self.roundRect(ctx, 64, 470, W - 128, 82, 18);
    ctx.fill();
    ctx.fillStyle = c.teal;
    ctx.font = self.font(18, 'bold');
    ctx.fillText('BIGGEST SHOW', 88, 502);
    ctx.fillStyle = c.text;
    ctx.font = self.font(28, 'bold');
    var big = card.biggestShow;
    ctx.fillText(big ? (big.venueName ? big.venueName + ', ' + big.cityName + ' · ' : '') + big.crowd.toLocaleString() + ' people' +
      (big.date ? ' · ' + big.date : '') : 'Still waiting for the first one', 88, 538);

    // Footer: the dates.
    ctx.fillStyle = c.muted;
    ctx.font = self.font(20);
    ctx.fillText('Started ' + card.started + '   →   ' + card.today, 64, H - 44);
  },

  // Saves the card as a PNG file (works from a double-clicked file too: no server needed).
  save: function (canvas, state) {
    if (!canvas || !canvas.toDataURL) return;
    var d = Game.rules.day.date(state.day);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'band-rise-card-' + d.year + '-' + pad(d.month + 1) + '-' + pad(d.date) + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
