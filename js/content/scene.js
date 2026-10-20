// scene.js (content)
// The other bands in the music scene: 50 made-up band names, plus spares (used if your band picks one of these
// names, so no two bands ever share a name). Everything is made up, to stay clear of real bands.
// Each new career gives these bands their own stats (see Game.rules.scene); the numbers are in balance.scene.

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.scene = {

  bandNames: [
    'The Paper Wolves', 'Neon Sparrows', 'The Crooked Lanterns', 'Static Orchard', 'The Late Satellites',
    'Copper Tides', 'The Hollow Pines', 'Midnight Ferry', 'The Rusty Compass', 'Glass Antlers',
    'The Velvet Ghosts', 'Sunday Arcade', 'The Borrowed Engines', 'Silver Thistle', 'The Northern Porch',
    'Electric Meadow', 'The Lonely Radios', 'Paper Moon Parade', 'The Cinder Hearts', 'Blue Lantern Club',
    'The Wandering Maps', 'Gravel & Gold', 'The Kitchen Lights', 'Honey Static', 'The Night Bus Choir',
    'Lost Weekend Club', 'The Brass Owls', 'Fever Garden', 'The Golden Hour Band', 'Ten Mile Echo',
    'The Tin Rockets', 'Winter Signal', 'The Rooftop Saints', 'Cardboard Kings', 'The Second Sunrise',
    'Wild Orchard', 'The Low Porchlights', 'Faded Postcards', 'The Iron Lilies', 'Moth & Lantern',
    'The Cassette Kids', 'Velvet Freeway', 'The Drift Club', 'Coastline Radio', 'The Marble Foxes',
    'Thunder Bakery', 'The Plastic Saints', 'Harbor Ghosts', 'The Last Arcade', 'Juniper Static'
  ],

  // Local bands abroad: 3 per country (2 club-size, 1 theater-size; see balance.scene.localSizes).
  localBands: {
    nordhavia: ['Fjord Lights', 'The Snowline Choir', 'Northbound Ferries'],
    solvara:   ['Los Faroles', 'Sunset Brigada', 'The Salt Coast'],
    veronesse: ['I Lupi di Carta', 'The Opera Thieves', 'Rosa Nera'],
    kaigara:   ['Neon Koi', 'Midnight Shinkansen', 'The Paper Lantern Club'],
    kestara:   ['The Red Dust Kings', 'Southern Stars Revue', 'Coral Static']
  },

  // Spare names, used in order if your band's name matches one of the scene's bands.
  spareNames: [
    'The Quiet Engines', 'Sparrow Hill', 'The Neon Orchard', 'Copper Lanterns', 'The Paper Cranes',
    'Midnight Arcade', 'The Static Hearts', 'Gold Coast Ferry', 'The Winter Porch', 'Hollow Radio'
  ]
};
