// actions.js
// Every action the player can put in a free block. Fixed data, never saved.
// All numbers come from balance.js, so tuning happens there.
//
// Each action has:
//   name, description   what the player sees
//   blocks              how many blocks it takes
//   energyCost          energy it uses (0 for Rest, which gives energy instead)
//   moneyCost           dollars it costs
//   moneyCategory       how the cost shows up in the weekly summary
//   requirements        what you need before you can pick it (none yet in this phase)
//   effects             what it does:
//                         skills: { skillName: base gain }   (grown by the skill formula)
//                         energy: amount gained               (Rest)
//                         morale: amount gained               (Rest)
//                         buzz:   'postOnline' | 'flyers'     (hometown buzz, sized by the Promotion skill)
//                         tightness: amount added to the song you pick (Practice)
//                         songProgress: true                  (Write: adds progress to the song in progress)
//                         gig: 'openMic'                      (plays a gig; see js/rules/gigs.js)
//   needsSong           true if the player picks which song it's for (Practice). The choice can also be
//                       'all' (Practice all songs: a small tightness gain on every song, see allSongsGain)
//   setSize             how many songs the player picks for the set (open mic: 2)
//   onlyOpenMicNight    true if it can only be planned in the Evening on an open mic night
//   countsAsWork        true if doing it means the day isn't a "full day off"
//   noSkillWhenBurnedOut  true if Burned out stops its skill gain

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var b = Game.balance;

  Game.content.actions = {
    practice: {
      id: 'practice',
      name: 'Practice',
      description: 'Woodshed alone on one song. Tightens it up and sharpens your playing.',
      blocks: 1,
      energyCost: b.energy.cost.practice,
      moneyCost: 0,
      moneyCategory: null,
      requirements: {},
      effects: { skills: b.skills.baseGain.practice, tightness: b.songs.tightness.practiceGain },
      needsSong: true,
      allSongsGain: b.songs.tightness.practiceAllGain,
      countsAsWork: true,
      noSkillWhenBurnedOut: true
    },

    write: {
      id: 'write',
      name: 'Write',
      description: 'Work on your song in progress (or start a new one).',
      blocks: 1,
      energyCost: b.energy.cost.write,
      moneyCost: 0,
      moneyCategory: null,
      requirements: {},
      effects: { skills: b.skills.baseGain.write, songProgress: true },
      countsAsWork: true,
      noSkillWhenBurnedOut: true
    },

    openMic: {
      id: 'openMic',
      name: 'Play the open mic',
      description: 'Sign up, wait your turn, play two songs for whoever shows up.',
      blocks: 1,
      energyCost: b.energy.cost.openMic,
      moneyCost: 0,
      moneyCategory: null,
      requirements: {},
      effects: { gig: 'openMic' },
      setSize: b.songs.setlist.openMic.songs,
      onlyOpenMicNight: true,
      countsAsWork: true,
      noSkillWhenBurnedOut: false
    },

    rest: {
      id: 'rest',
      name: 'Rest',
      description: 'Couch, snacks, nothing on the calendar.',
      blocks: 1,
      energyCost: 0,
      moneyCost: 0,
      moneyCategory: null,
      requirements: {},
      effects: { energy: b.energy.restGain, morale: b.morale.change.rest },
      countsAsWork: false,
      noSkillWhenBurnedOut: false
    },

    network: {
      id: 'network',
      name: 'Network',
      description: 'Buy a drink, talk shop with musicians around town.',
      blocks: 1,
      energyCost: b.energy.cost.network,
      moneyCost: b.economy.networkingCost,
      moneyCategory: 'networking',
      requirements: {},
      effects: { skills: b.skills.baseGain.network },
      countsAsWork: true,
      noSkillWhenBurnedOut: false
    },

    postOnline: {
      id: 'postOnline',
      name: 'Post online',
      description: 'Clips, photos, and a little self-promotion.',
      blocks: 1,
      energyCost: b.energy.cost.promote,
      moneyCost: b.promotion.postOnline.cost,
      moneyCategory: 'promotion',
      requirements: {},
      effects: { skills: b.skills.baseGain.promote, buzz: 'postOnline' },
      countsAsWork: true,
      noSkillWhenBurnedOut: false
    },

    hangFlyers: {
      id: 'hangFlyers',
      name: 'Hang flyers',
      description: 'Print a stack and paper the coffee shops.',
      blocks: 1,
      energyCost: b.energy.cost.promote,
      moneyCost: b.promotion.flyers.cost,
      moneyCategory: 'promotion',
      requirements: {},
      effects: { skills: b.skills.baseGain.promote, buzz: 'flyers' },
      countsAsWork: true,
      noSkillWhenBurnedOut: false
    }
  };
})();
