// studios.js
// Names and descriptions for the four places to record, and the merch you can stock.
// Fixed data, never saved. Their numbers (cost, bonus, cap, prices) live in balance.js.

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
var st = Game.balance.recording.studios;

Game.content.studios = {
  home: { id: 'home', name: 'Home setup', blurb: 'Your own gear in the spare room. Free once you own it, but recordings top out at quality ' + st.home.qualityCap + '.' },
  demo: { id: 'demo', name: 'Demo studio', blurb: 'A cheap room with an engineer who\'s seen it all.' },
  pro:  { id: 'pro',  name: 'Pro studio',  blurb: 'Real gear, a real producer. Recordings come out +' + st.pro.bonus + ' better.' },
  top:  { id: 'top',  name: 'Top studio',  blurb: 'Where the records you love were made. +' + st.top.bonus + ', and only for signed acts.' }
};

})();

// The three vans in the Shop. Prices and how long they last are in balance.vans.
Game.content.vans = {
  beater: { id: 'beater', name: 'Beater van', blurb: 'Rust, a sticky door, and a lot of miles. It runs... for now.' },
  used:   { id: 'used',   name: 'Used van',   blurb: 'A solid old touring van with plenty of life left.' },
  new:    { id: 'new',    name: 'New van',    blurb: 'Brand new, with a warranty. It won\'t let you down.' }
};

Game.content.merch = {
  shirts: { id: 'shirts', name: 'T-shirts', unit: 'shirt' },
  cds:    { id: 'cds',    name: 'CDs',      unit: 'CD' }
};

Game.content.releaseTypes = {
  single: { id: 'single', name: 'Single' },
  ep:     { id: 'ep',     name: 'EP' },
  album:  { id: 'album',  name: 'Album' }
};

// Release-week promo pushes (costs and boosts are in balance.streaming.promos).
Game.content.promos = {
  playlist: { id: 'playlist', name: 'Playlist pitch', blurb: 'Get it onto curated playlists.' },
  radio:    { id: 'radio',    name: 'Radio push',     blurb: 'A plugger works it to radio stations.' },
  video:    { id: 'video',    name: 'Music video',    blurb: 'Shoot a video. The biggest push, and it lasts longest.' }
};

// Record sleeves: each release gets a color and a pattern, picked from its number (see Game.ui.songs.sleeveHtml).
Game.content.covers = {
  colors: ['#e2483d', '#2f6fde', '#f2b134', '#1f9e78', '#9b4dca', '#ef6aa6', '#3b3b4f', '#e9e3d0'],
  patterns: ['stripes', 'rings', 'grid', 'burst', 'split'],
  patternStep: 3   // Steps through the patterns so neighbours don't match
};
