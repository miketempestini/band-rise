// dealSigned.js
// The moment you sign a record deal: the lights go down, the contract slams onto the desk, your signature is written
// across the bottom in marker, the label's stamp comes down, and "Deal signed!" bursts onto the screen with confetti.
// All of it is CSS animation (styles.css, "Signing a record deal"), so it plays once when the screen is drawn, and
// players who asked for less motion see the finished moment right away. Tapping anywhere skips to the end.
// Draw only: it reads the deal you just signed (state.label.deal).

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.dealSigned = {

  render: function (root, app) {
    var h = Game.ui.helpers;
    var state = app.state;
    var d = state.label.deal;
    if (!d) { app.show('manager'); return; }
    var lb = Game.rules.label;
    var info = lb.info(d.labelId);
    var artist = state.band.name || state.player.name;
    var pct = function (x) { return Math.round(x * 100) + '%'; };
    var count = Game.balance.ui.signingConfetti;
    var colors = ['--tape-show', '--tape-studio', '--tape-money', '--tape-job', '--tape-event', '--amber'];
    // Confetti pieces: spread across the screen in a fixed pattern (no dice needed for decoration).
    var confetti = '';
    for (var i = 0; i < count; i++) {
      confetti += '<span class="signing__bit" style="--x:' + ((i * 37 + 11) % 100) + '%;--delay:' + ((i % 12) * 0.07).toFixed(2) + 's;--spin:' +
        ((i % 2 ? 1 : -1) * (180 + (i * 53) % 540)) + 'deg;--drift:' + (((i * 29) % 21) - 10) + 'vw;--c:var(' + colors[i % colors.length] + ')"></span>';
    }
    var rays = '';
    for (var r = 0; r < 12; r++) rays += '<span class="signing__ray" style="--a:' + (r * 30) + 'deg"></span>';

    root.innerHTML =
      '<section class="signing" data-action="skip" style="--label-ink:' + info.color + '" aria-live="polite">' +
        '<div class="signing__light" aria-hidden="true"></div>' +
        '<div class="signing__stage">' +
          '<article class="signing__contract paper">' +
            '<div class="signing__label">' + h.escape(info.name) + '</div>' +
            '<div class="signing__title">Recording agreement</div>' +
            '<p class="signing__between">between <strong>' + h.escape(info.name) + '</strong> and <strong>' + h.escape(artist) + '</strong></p>' +
            '<dl class="signing__terms">' +
              '<dt>Advance</dt><dd>' + h.money(d.advance) + '</dd>' +
              '<dt>Royalty</dt><dd>' + pct(d.royalty) + '</dd>' +
              '<dt>Records</dt><dd>' + h.escape(lb.oweText(d)) + '</dd>' +
              '<dt>Masters</dt><dd>' + { artist: 'Yours', reverts: 'Come back to you', label: 'Theirs' }[d.masters] + '</dd>' +
            '</dl>' +
            '<div class="signing__fine" aria-hidden="true"><span></span><span></span><span></span><span></span></div>' +
            '<div class="signing__sign">' +
              '<svg class="signing__signature" viewBox="0 0 640 130" preserveAspectRatio="xMinYMid meet" role="img" aria-label="Signed: ' + h.escape(state.player.name) + '">' +
                '<text x="8" y="96" style="--ink-len:' + Math.max(1, state.player.name.length) * Game.balance.ui.signingInkPerLetter + '">' + h.escape(state.player.name) + '</text>' +
              '</svg>' +
              '<div class="signing__line"></div>' +
              '<div class="signing__who"><span>Artist</span><span>' + h.dateLabel(d.signedDay) + '</span></div>' +
            '</div>' +
            '<div class="signing__stamp" aria-hidden="true"><span>Signed</span><small>' + h.escape(info.name) + '</small></div>' +
          '</article>' +
        '</div>' +
        '<div class="signing__burst" aria-hidden="true">' + rays + '</div>' +
        '<div class="signing__confetti" aria-hidden="true">' + confetti + '</div>' +
        '<div class="signing__finale">' +
          '<h1 class="signing__headline">Deal signed!</h1>' +
          '<p class="signing__sub">' + h.escape(artist) + ' x ' + h.escape(info.name) + ' · <strong>+' + h.money(d.advance) + '</strong> advance</p>' +
          '<button class="btn btn--primary btn--big signing__go" data-action="continue">See your deal</button>' +
        '</div>' +
      '</section>';

    var section = root.querySelector('.signing');
    // A long name: widen the signature's drawing area so the whole name fits on the line (it scales down to fit).
    var svg = root.querySelector('.signing__signature');
    var fit = function () {
      var text = svg.querySelector('text');
      var width = text.getBBox ? text.getBBox().width : 0;
      if (width + 16 > 640) svg.setAttribute('viewBox', '0 0 ' + Math.ceil(width + 16) + ' 130');
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    h.bind(root, {
      // A tap before the end skips to the finished moment; after that it does nothing (use the button).
      skip: function (e) {
        if (e.target.closest('[data-action="continue"]')) return;
        if (section.getAnimations) section.getAnimations({ subtree: true }).forEach(function (a) { try { a.finish(); } catch (err) { /* endless ones */ } });
      },
      continue: function (e) { e.stopPropagation(); app.leaveDealSigned(); }
    });
  }
};
