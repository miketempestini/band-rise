// names.js
// Name lists: cover song titles and words for random original song titles.
// Everything is made up, to stay clear of real song names. (People's names come in a later phase.)

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.names = {

  // Generic, made-up covers. Each new career gets a random few of these.
  coverTitles: [
    'That Bar-Band Classic',
    'The Wedding Slow Dance',
    'Everybody\'s Road-Trip Anthem',
    'The Breakup Ballad Everyone Knows',
    'The Three-Chord Singalong',
    'That Song From the Car Commercial',
    'The Karaoke Showstopper',
    'Dad\'s Favorite Rock Song',
    'The Campfire Standard',
    'The Last-Call Closer',
    'That Summer Hit From Way Back',
    'The One Everybody Requests'
  ],

  // Random original titles are built as "first word + second word", like "Neon Highway".
  songTitleFirst: [
    'Neon', 'Paper', 'Midnight', 'Broken', 'Golden', 'Rusty', 'Electric', 'Quiet',
    'Last', 'Borrowed', 'Velvet', 'Hollow', 'Wild', 'Northern', 'Silver', 'Crooked',
    'Summer', 'Lonely', 'Burning', 'Little'
  ],
  songTitleSecond: [
    'Highway', 'Hearts', 'Radio', 'Kitchen Light', 'Parade', 'Motel', 'Static', 'Rain',
    'Getaway', 'Lullaby', 'Basement', 'Fireworks', 'Streetlights', 'Daydream', 'Ghosts',
    'Payday', 'Heartbeat', 'Weekend', 'Echo', 'Small Town'
  ]
};
