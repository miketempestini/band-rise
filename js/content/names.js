// names.js
// Name lists: cover song titles, words for random original song titles, people, and band names.
// Everything is made up, to stay clear of real songs, people, and bands.

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
  ],

  // People you meet: a random first name + last name.
  firstNames: [
    'Dana', 'Theo', 'Maya', 'Jules', 'Rosa', 'Eli', 'Priya', 'Marcus', 'Nina', 'Sam',
    'Ivy', 'Owen', 'Lena', 'Dez', 'Hana', 'Carlos', 'Wren', 'Tasha', 'Felix', 'June',
    'Ari', 'Bo', 'Kenji', 'Lou'
  ],
  // Which first names are usually given to women, to men, or to anyone. A new person's portrait comes from the
  // matching group of faces (see Game.content.art.portraitGroups), so names and faces fit together.
  nameGroups: {
    Maya: 'women', Rosa: 'women', Priya: 'women', Nina: 'women', Ivy: 'women', Lena: 'women', Hana: 'women',
    Wren: 'women', Tasha: 'women', June: 'women',
    Theo: 'men', Eli: 'men', Marcus: 'men', Owen: 'men', Carlos: 'men', Felix: 'men', Kenji: 'men',
    Dana: 'anyone', Jules: 'anyone', Sam: 'anyone', Dez: 'anyone', Ari: 'anyone', Bo: 'anyone', Lou: 'anyone'
  },
  lastNames: [
    'Reyes', 'Park', 'Okafor', 'Lindqvist', 'Moreau', 'Bishop', 'Kowalski', 'Nguyen', 'Hale',
    'Castillo', 'Abernathy', 'Fox', 'Delgado', 'Sato', 'Whitfield', 'Mercer', 'Quinn', 'Varga'
  ],

  // Band names are built as "The " + first word + second word, like "The Velvet Static".
  bandNameFirst: [
    'Velvet', 'Paper', 'Neon', 'Midnight', 'Rusty', 'Hollow', 'Electric', 'Golden', 'Crooked', 'Northern',
    'Borrowed', 'Late', 'Quiet', 'Burning', 'Second-Hand'
  ],
  bandNameSecond: [
    'Static', 'Lanterns', 'Wolves', 'Satellites', 'Motel', 'Parade', 'Daydreams', 'Engines', 'Ghosts',
    'Streetlights', 'Radios', 'Hearts', 'Payday', 'Sparrows'
  ]
};
