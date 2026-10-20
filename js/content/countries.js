// countries.js
// The countries on the World map. Everything is made up. Fixed data, never saved.
//   name, blurb   for the Map screen
//   capital       the city with the country's biggest room
//   shape         the country's outline on the World map, as points on a 1000 x 560 sheet (drawing only; the
//                 Map screen smooths them into a curvy coastline)
//   label         where the country's name is lettered on the map
// 'home' is your own country (Millbrook, the Near/Mid/Far cities, and the National cities). International cities
// say which country they're in with countryId (see cities.js).

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.countries = {
  home: {
    id: 'home', name: 'Home', capital: 'newHalston', blurb: 'Where it all started.',
    label: [250, 372],
    shape: [[112, 150], [140, 118], [178, 112], [205, 96], [252, 92], [290, 104], [332, 100], [372, 128], [392, 168], [384, 196], [404, 228], [398, 270], [372, 300], [380, 330], [352, 362], [310, 372], [282, 392], [240, 386], [200, 392], [168, 372], [128, 352], [110, 318], [92, 280], [104, 246], [90, 210], [100, 176]]
  },
  nordhavia: {
    id: 'nordhavia', name: 'Nordhavia', capital: 'lindenberg',
    blurb: 'Fjords, cold nights, and concert halls where nobody talks during the quiet songs.',
    label: [548, 52],
    shape: [[468, 102], [484, 82], [512, 74], [526, 60], [556, 64], [586, 58], [612, 74], [630, 102], [618, 124], [628, 146], [604, 162], [576, 158], [552, 170], [522, 162], [496, 150], [478, 132]]
  },
  veronesse: {
    id: 'veronesse', name: 'Veronesse', capital: 'valmora',
    blurb: 'Old opera cities on hills, where the crowds dress up and sing along.',
    label: [540, 318],
    shape: [[478, 222], [500, 206], [530, 208], [556, 196], [584, 206], [606, 226], [600, 248], [616, 270], [598, 292], [570, 290], [548, 304], [520, 296], [496, 280], [486, 256]]
  },
  solvara: {
    id: 'solvara', name: 'Solvara', capital: 'portAurelia',
    blurb: 'A sunny coast of beach towns and stadiums that stay loud until sunrise.',
    label: [482, 462],
    shape: [[428, 360], [446, 340], [476, 342], [502, 334], [530, 350], [548, 378], [540, 398], [552, 420], [530, 442], [500, 436], [474, 448], [448, 432], [436, 408], [420, 384]]
  },
  kaigara: {
    id: 'kaigara', name: 'Kaigara', capital: 'akarumi',
    blurb: 'Neon island megacities with packed live houses and the biggest domes on earth.',
    label: [858, 292],
    shape: [[806, 140], [822, 120], [846, 116], [866, 132], [880, 158], [874, 178], [894, 196], [904, 224], [892, 250], [872, 268], [850, 260], [832, 240], [838, 218], [818, 200], [808, 172]]
  },
  kestara: {
    id: 'kestara', name: 'Kestara', capital: 'portKiara',
    blurb: 'Big skies, long beaches, and fans who drive all day to see a show.',
    label: [804, 528],
    shape: [[718, 410], [740, 386], [772, 380], [800, 368], [832, 380], [864, 396], [888, 424], [884, 452], [892, 478], [866, 500], [832, 496], [800, 508], [766, 498], [740, 480], [722, 452], [706, 430]]
  }
};
