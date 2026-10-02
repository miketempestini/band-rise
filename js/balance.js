// balance.js
// Every tunable number in the game, in one place.
// Every number comes from Design.md. They are all starting guesses, meant to be tuned
// once the game is playable. To rebalance, change a number here, never in the rules or screens.
//
// Money is in dollars. "Chance" values are decimals: 0.3 means 30%.
// A value of null means Design.md hasn't decided that number yet (see PROGRESS.md).

window.Game = window.Game || {};

Game.balance = {

  // ---------------------------------------------------------------
  // Time and calendar
  // ---------------------------------------------------------------
  time: {
    blocks: ['morning', 'afternoon', 'evening'], // The three parts of each day, in order
    daysPerWeek: 7,                // Weeks run Monday to Sunday
    startBookingWeeks: 4,          // How far ahead you can book at the start
    managerBookingWeeks: 12,       // How far ahead you can book after getting a Manager
    emptyBlockEnergy: 5,           // Energy gained for each block left empty at End Day
    paydayDayOfWeek: 4,            // Friday (0 = Monday): day-job pay arrives that night
    billsDayOfWeek: 6              // Sunday (0 = Monday): rent and living costs are due that night
  },

  // ---------------------------------------------------------------
  // The day job
  // ---------------------------------------------------------------
  job: {
    fullTimeDays: [0, 1, 2, 3, 4],   // Monday to Friday (0 = Monday)
    partTimeDays: [0, 2, 4],         // Monday, Wednesday, Friday
    jobBlocks: ['morning', 'afternoon'], // Which blocks a shift fills
    payPerShift: 110,                // Pay for one workday (two blocks), paid Friday night
    overtimePay: 165,                // Pay for an optional Saturday overtime shift
    startStanding: 60,               // How your boss sees you at the start (0 to 100)
    maxStanding: 100,                // Highest possible job standing
    standingPerShift: 1,             // Standing gained for each shift worked
    sickDayPenalty: -15,             // Standing change when you call in sick
    skipPenalty: -25,                // Standing change when you skip without calling
    warningStanding: 25,             // Below this, your boss warns you
    firedStanding: 0,                // At this standing, you're fired
    vacationDaysPerYear: 10,         // Vacation days you get each year
    vacationNoticeDays: 14,          // Book vacation this many days ahead for no penalty
    partTimeMinReputation: 20,       // Reputation needed to go part-time
    partTimeMinStanding: 50,         // Job standing needed to go part-time
    quitMoraleBonus: 15,             // Morale gained when you quit the day job (milestone)
    lookForWorkChance: 0.5,          // Chance each "Look for work" try lands a part-time job
    quitScreenIncomeWeeks: 4         // The quit screen shows this many weeks of music income
  },

  // ---------------------------------------------------------------
  // Cancellations and no-shows
  // ---------------------------------------------------------------
  cancellations: {
    earlyNoticeDays: 7,              // Cancelling this many days ahead or more counts as "early"
    early:  { venueRelationship: -10, reputation: 0,  bandSatisfaction: 0 },  // Cancel 7+ days ahead
    late:   { venueRelationship: -20, reputation: -3, bandSatisfaction: -5 }, // Cancel under 7 days ahead
    noShow: { venueRelationship: -40, reputation: -8, bandSatisfaction: -10, banDays: 60 } // Didn't show up
  },

  // ---------------------------------------------------------------
  // Travel
  // ---------------------------------------------------------------
  travel: {
    blocksEachWay: { near: 1, mid: 2, far: 3 }, // Travel blocks each way (far = a full day)
    energyPerBlock: 15,                         // Energy cost for each travel block
    hotelPerNight: 80,                          // Cost of a hotel night out of town
    gasRoundTrip: { near: 40, mid: 80, far: 150 } // Gas cost for a round trip
  },

  // ---------------------------------------------------------------
  // Economy: starting money, income, and costs
  // ---------------------------------------------------------------
  economy: {
    startCash: 500,                  // Cash at the start of a new career
    // Weekly bills (rent + living costs) come from the housing table below.
    // Starter apartment: $275 rent + $125 living costs = $400 a week.
    openMicTips: { min: 0, max: 20 },// Tip jar at an open mic (more on a good night)
    coverGigFee: 25,                 // Flat fee for a cover gig
    coverGigMinReputation: null,     // NOT DECIDED in Design.md: reputation needed for cover gigs
    coverGigMinMusicianship: null,   // NOT DECIDED in Design.md: musicianship needed for cover gigs
    rehearsalRoomPerBlock: 20,       // Rehearsal room rent per block (needed with a band)
    networkingCost: 15,              // Drinks when you go out to network
    hangOutCost: 15,                 // Cost to hang out with a contact
    vanCost: 3000,                   // Used van (needed for Far cities with a band, and tours)
    productionCost: { min: 500, max: 5000 }, // Sound and lights per show at theaters and bigger
    surpriseBill: { min: 40, max: 300 },     // Random bills like a broken string or car trouble
    instrumentUpgrades: [            // Instrument tiers you can buy, in order
      { tier: 1, cost: 400,  gigBonus: 5 },
      { tier: 2, cost: 1500, gigBonus: 10 },
      { tier: 3, cost: 5000, gigBonus: 15 }
    ],
    sessionPlayerFee: 75             // Hire a fill-in player for one gig
  },

  // ---------------------------------------------------------------
  // Merch: T-shirts and CDs sold at gigs
  // ---------------------------------------------------------------
  merch: {
    shirt: { costEach: 8, price: 20, packSize: 25, packCost: 200 }, // Bought 25 at a time for $200
    cd:    { costEach: 3, price: 10, packSize: 50, packCost: 150 }, // Bought 50 at a time for $150
    // Chance each person in the crowd buys each item, by gig result
    buyChance: { rough: 0.01, solid: 0.03, great: 0.06, legendary: 0.09 },
    recordStoreMultiplier: 2         // Hollow Records in-store: merch sells at double the rate
  },

  // ---------------------------------------------------------------
  // Splitting money with the band
  // ---------------------------------------------------------------
  bandPay: {
    playerShares: 1,                 // You keep one equal share of gig pay
    memberShares: 1,                 // Each member who played gets one share
    divaShares: 1.5                  // A Diva wants 1.5 shares
  },

  // ---------------------------------------------------------------
  // Streaming income (paid every Sunday per released song)
  // weekly pay per song = total fans x payPerFan x (recording quality / 100) x freshness
  // ---------------------------------------------------------------
  streaming: {
    payPerFan: 0.02,                 // Dollars per fan per song per week, before quality and freshness
    freshnessStart: 1,               // A new release starts at full freshness
    freshnessDropPerWeek: 0.03,      // Freshness drops 3% a week after release
    freshnessMin: 0.3                // Freshness never drops below this
  },

  // ---------------------------------------------------------------
  // Going broke (from the answer in Design.md's Open questions)
  // ---------------------------------------------------------------
  debt: {
    familyLoanAmount: 1000,          // Mom and Dad lend this much each time your cash would drop below 0
                                     // (no limit: they keep lending until your cash is back to $0 or more)
    gameOverDebt: 3000,              // Owing more than this for too long ends the game
    gameOverWeeks: 5,                // ...for more than this many weeks in a row
    gameOverMessage: "You went broke, had to sell your guitar, and move back into your parent's house. Maybe this music thing is more of a hobby for you.",
    // Actions you can't do while you owe money. Later phases add ids here (for example 'upgradeHousing').
    blockedActions: []
  },

  // ---------------------------------------------------------------
  // Skills
  // gain = base x (1 - skill / growthCap) x morale multiplier x energy multiplier
  // ---------------------------------------------------------------
  skills: {
    max: 100,                        // Skills go from 0 to 100
    // The "Suggested build" on the skills page (adds up to startingPoints).
    start: { musicianship: 20, performance: 10, songwriting: 10, promotion: 5, networking: 5 },
    startingPoints: 50,              // Points the player spends across the five skills at New career
    startingMaxPerSkill: 30,         // No skill can get more than this many starting points
    startingMinPerSkill: 0,          // ...or fewer than this
    instrumentBonus: {               // Starting instrument adds +3 to one skill
      guitar: { skill: 'performance', amount: 3 },
      keys:   { skill: 'songwriting', amount: 3 },
      bass:   { skill: 'networking',  amount: 3 }
    },
    growthCap: 120,                  // Gains shrink as a skill nears this number
    baseGain: {                      // Base skill gains per action
      practice: { musicianship: 3 },
      rehearse: { musicianship: 1.5 },
      playLive: { performance: 3, musicianship: 1, networking: 1 },
      write:    { songwriting: 2 },
      network:  { networking: 2 },
      promote:  { promotion: 2 }
    },
    moraleLowThreshold: 30,          // Morale below this slows skill gains
    moraleHighThreshold: 70,         // Morale above this speeds them up
    moraleLowMultiplier: 0.75,       // Skill gain multiplier when morale is low
    moraleMidMultiplier: 1.0,        // ...when morale is in the middle
    moraleHighMultiplier: 1.25,      // ...when morale is high
    tiredMultiplier: 0.5,            // Skill gain multiplier when Tired
    rustMinSkill: 30,                // Only skills above this can rust
    rustAfterDays: 14,               // A skill unused this long starts to rust
    rustWarningDays: 10,             // Show a rust warning icon after this many unused days
    rustPerWeek: 1                   // Points lost each week while rusting
  },

  // ---------------------------------------------------------------
  // Energy (0 to 100)
  // ---------------------------------------------------------------
  energy: {
    max: 100,                        // Highest possible energy
    start: 100,                      // Energy at the start
    overnight: 50,                   // Energy recovered overnight
    exhaustedOvernight: 30,          // Recovery overnight after hitting 0 energy
    tiredThreshold: 25,              // Below this you're Tired
    restGain: 25,                    // The Rest action gives back this much
    cost: {                          // Energy cost per action (per block)
      dayJob: 20,
      gig: 25,
      studio: 20,
      practice: 15,
      rehearse: 15,
      openMic: 15,
      travel: 15,
      write: 10,
      network: 10,
      hangOut: 10,
      jam: 10,
      talk: 10,
      promote: 5,
      admin: 5
    }
  },

  // ---------------------------------------------------------------
  // Morale (0 to 100)
  // ---------------------------------------------------------------
  morale: {
    max: 100,                        // Highest possible morale
    start: 60,                       // Morale at the start
    change: {                        // Morale changes from things that happen
      legendaryGig: 15,
      milestone: 10,
      fullDayOff: 10,
      greatGig: 8,
      finishSong: 5,
      hangOut: 5,
      rest: 5,
      cantPayBills: -15,
      exhausted: -10,
      bandmateQuits: -10,
      roughGig: -8,
      cancelGig: -5,
      dayJobShift: -2,
      removeMember: -5
    },
    weeklyDrift: 3,                  // Each Sunday, morale moves this much toward its resting level
    burnedOutThreshold: 15,          // Below this you're Burned out
    burnedOutRecovery: 25,           // Burned out lasts until morale is back above this
    roadFatigueStartDay: 5,          // On tour, from this day on the road...
    roadFatiguePerDay: -3            // ...morale drops this much each day
  },

  // ---------------------------------------------------------------
  // People and bandmates
  // ---------------------------------------------------------------
  people: {
    roles: ['guitar', 'bass', 'drums', 'keys', 'vocals'], // Slots a person can fill in a band
    meetBaseChance: 0.30,            // Base chance to meet someone when networking
    meetNetworkingDivisor: 2,        // ...plus Networking / 2 percent
    openMicMeetChance: 0.20,         // Chance to meet someone at an open mic
    newPersonSkillMin: 10,           // Lowest skill a new person can have
    newPersonSkillBase: 30,          // Highest skill = 30 + Networking / 2 + Reputation / 2
    newPersonSkillNetworkingDivisor: 2,
    newPersonSkillReputationDivisor: 2,
    statMax: 100,                    // Skill, reliability, ambition, etc. go from 0 to 100
    maxContacts: 12,                 // Contacts list size; the coldest contact drops off when full
    startRelationship: 20,           // Relationship with a new contact
    startSatisfaction: 70,           // Satisfaction when someone joins the band
    relationship: {                  // Relationship gains
      jam: 8,
      hangOut: 5,
      gigTogether: 8,
      fadePerWeek: -1                // Lost each week you don't interact
    },
    inviteMinRelationship: 50,       // Relationship needed to invite someone to the band
    inviteSkillGap: 30,              // Your reputation must be at least (their skill - 30)
    coWriteMinRelationship: 40,      // Relationship needed to co-write a song
    maxBandMembers: 4,               // Members besides you
    minOnStageForClubs: 3,           // People on stage needed for clubs and bigger
    playerMusicianshipWeight: 2,     // Your Musicianship counts twice in band musicianship
    newMemberTightnessDrop: -20,     // Every song loses this much tightness when someone joins
    sessionPlayerTightness: 50       // A session player counts as this tightness on every song
  },

  // ---------------------------------------------------------------
  // Personality traits
  // ---------------------------------------------------------------
  traits: {
    workhorse:    { rehearsalTightnessBonus: 0.5, minRehearsalsPerWeek: 2 }, // +50% tightness from rehearsals
    easygoing:    { weeklySatisfaction: 2 },                                  // Satisfaction drifts up 2 a week
    perfectionist:{ bandMusicianshipBonus: 5, roughGigSatisfaction: -10 },
    partyAnimal:  { gigScoreBonus: 5, reliabilityPenalty: -20 },
    diva:         { gigScoreBonus: 5 },                                       // Pay share is in bandPay.divaShares
    flaky:        { skillBonusWhenCreated: 15, missRehearsalChance: 0.25 },
    clashes: [                       // Pairs of traits that don't get along
      ['workhorse', 'flaky'],
      ['perfectionist', 'partyAnimal'],
      ['diva', 'diva']
    ]
  },

  // ---------------------------------------------------------------
  // Band satisfaction (checked every Sunday)
  // ---------------------------------------------------------------
  satisfaction: {
    max: 100,
    change: {
      earnedGigMoney: 3,             // Earned gig money this week
      gigsMatchedAmbition: 3,        // Got as many gigs as they wanted
      rehearsedThisWeek: 2,          // At least one rehearsal this week
      greatOrLegendaryGig: 4,
      noGigTwoWeeks: -5,             // No gig in 14 days (only if ambition over 50)
      roughGig: -3,
      perClashingBandmate: -3,
      cancelledGig: -5,              // Applied right away
      memberRemoved: -5,             // Everyone else loses this when you remove a member
      tourShow: 2                    // Gained per tour show
    },
    noGigDays: 14,                   // "No gig in 14 days" check
    noGigMinAmbition: 50,            // ...only applies above this ambition
    ambitionLow: 40,                 // Ambition under 40 wants a gig every 2 weeks
    ambitionHigh: 70,                // 40 to 70 wants one a week; over 70 wants two a week
    gigsWantedPerWeek: { low: 0.5, mid: 1, high: 2 },
    talkThreshold: 30,               // Below this they ask to talk
    talkGain: 15,                    // The Talk action gives this much
    talkCooldownDays: 14,            // Talk works once every 2 weeks per person
    quitThreshold: 15                // Below this they quit at the end of the week
  },

  // ---------------------------------------------------------------
  // Songs: writing, tightness, setlists
  // ---------------------------------------------------------------
  songs: {
    startingCovers: 5,               // Covers you can already play at the start
    coverQuality: 50,                // Covers have a fixed quality
    coverFanFactor: 0.75,            // Fans from an all-cover set count at 0.75x
    originalFanFactor: 1.25,         // Fans from an all-original set count at 1.25x
    progressToFinish: 100,           // A song is done when progress reaches this
    progressBase: 12,                // Progress per Write block = 12 + Songwriting / 5
    progressSongwritingDivisor: 5,
    coWriterProgressDivisor: 10,     // Co-writer adds their skill / 10 to progress
    // quality = 15 + 0.6 x Songwriting + random(0 to 25) + 5 if morale > 70 + co-writer skill / 10
    qualityBase: 15,
    qualitySongwritingWeight: 0.6,
    qualityRandomMax: 25,
    qualityHighMoraleBonus: 5,
    qualityHighMoraleThreshold: 70,
    coWriterQualityDivisor: 10,
    pointsPerStar: 20,               // Quality shown as 1 to 5 stars: quality / 20, rounded up
    maxStars: 5,                     // The most stars a song can show
    titleMaxLength: 40,              // Longest song name the player can type
    titleSuggestionTries: 20,        // Tries to find a random title that isn't already used
    luckyRoll: 20,                   // The reveal calls a luck roll this high or higher "Lucky night!"
    unluckyRoll: 5,                  // ...and this low or lower "Not much luck this time"
    tightness: {
      max: 100,
      newOriginal: 30,               // A new original starts at this tightness
      cover: 60,                     // Covers start at this tightness
      practiceGain: 10,              // Practice alone: +10 to one song
      rehearseGain: 12,              // Rehearse with the band: +12 to each song...
      rehearseMaxSongs: 4,           // ...up to 4 songs
      playLiveGain: 5,               // Playing a song live
      decayAfterDays: 7,             // Not played or rehearsed this long starts the slide
      decayPerWeek: -3,              // Tightness lost per week
      floor: 20                      // Tightness never drops below this from decay
    },
    setlist: {                       // Songs needed per show type, and the cover limit (null = any)
      openMic:   { songs: 2,  coverLimit: null },
      smallRoom: { songs: 6,  coverLimit: null },
      club:      { songs: 10, coverLimit: null },
      theater:   { songs: 14, coverLimit: 2 },
      arena:     { songs: 18, coverLimit: 2 }
    }
  },

  // ---------------------------------------------------------------
  // Recording and releasing
  // recording quality = 0.5 x song quality + 0.25 x band musicianship + 0.25 x tightness + studio bonus
  // ---------------------------------------------------------------
  recording: {
    bookAheadDays: 2,                // Studio time must be booked this many days ahead
    songsPerBlock: 1,                // One song recorded per studio block
    songQualityWeight: 0.5,
    bandMusicianshipWeight: 0.25,
    tightnessWeight: 0.25,
    studios: {
      home: { cost: 0,    oneTimeCost: 300, bonus: 0,  qualityCap: 40 },  // Needs the First recording milestone
      demo: { cost: 75,   bonus: 0 },                                      // Needs nothing
      pro:  { cost: 250,  bonus: 10, minReputation: 40 },
      top:  { cost: 1000, bonus: 20 }                                      // Needs a label deal
    }
  },

  releases: {
    sizes: {                         // How many recorded songs each release type needs
      single: { min: 1, max: 1 },
      ep:     { min: 3, max: 5 },
      album:  { min: 8, max: 12 }
    },
    buzzQualityDivisor: 10,          // Release buzz = (avg recording quality / 10) x size bonus
    sizeBonus: { single: 1, ep: 1.5, album: 2 },
    newFansRate: 0.05,               // New fans per city = city fans x 5% x (avg quality / 50)
    newFansQualityDivisor: 50,
    spamWindowWeeks: 4,              // A release within 4 weeks of the last one...
    spamBuzzMultiplier: 0.5,         // ...gets half the buzz
    reputationQualityDivisor: 20     // A release adds avg recording quality / 20 reputation
  },

  // ---------------------------------------------------------------
  // Venues and booking
  // ---------------------------------------------------------------
  venues: {
    tiers: {                         // Rules for each venue tier (0 = open mic ... 4 = arena)
      0: { name: 'Open mic',   minReputation: 0,  minOnStage: 1, bookAhead: { min: 0, max: 0 },   ticket: 0,  doorShare: 0,    footTraffic: 30,  gigScorePenalty: 0 },
      1: { name: 'Small room', minReputation: 10, minOnStage: 1, bookAhead: { min: 7, max: 14 },  ticket: 8,  doorShare: 0.70, footTraffic: 30,  gigScorePenalty: -3, guarantee: { min: 50,  max: 100 } },
      2: { name: 'Club',       minReputation: 30, minOnStage: 3, bookAhead: { min: 14, max: 28 }, ticket: 12, doorShare: 0.75, footTraffic: 40,  gigScorePenalty: -6, guarantee: { min: 200, max: 500 } },
      3: { name: 'Theater',    minReputation: 60, minOnStage: 3, bookAhead: { min: 28, max: 56 }, ticket: 25, doorShare: 0.80, footTraffic: 60,  gigScorePenalty: -10, guarantee: { min: 2000, max: null } },
      4: { name: 'Arena',      minReputation: 85, minOnStage: 3, bookAhead: null,                 ticket: 45, doorShare: null, footTraffic: 200, gigScorePenalty: -15, guarantee: { min: 20000, max: null } }
    },
    // Booking chance = 50% + 3% x (reputation - required) + Networking / 4 % + venue relationship / 5 %
    bookingBaseChance: 0.50,
    bookingPerReputationPoint: 0.03,
    bookingNetworkingDivisor: 4,
    bookingRelationshipDivisor: 5,
    bookingMinChance: 0.05,          // Booking chance never goes below 5%...
    bookingMaxChance: 0.95,          // ...or above 95%
    replyDays: { min: 1, max: 3 },   // Venue replies arrive 1 to 3 days later
    relationshipMin: -50,            // Venue relationship goes from -50...
    relationshipMax: 100,            // ...to 100
    relationshipStart: 0,
    relationshipAfterGoodShow: 5,    // After a Solid or better show
    relationshipAfterRoughShow: -10  // After a Rough show
  },

  // ---------------------------------------------------------------
  // Offers that come to you
  // ---------------------------------------------------------------
  offers: {
    openingSlotFee: { min: 50, max: 150 },   // Flat fee for an opening slot
    openingSlotFanRate: 0.5,                 // New fans from their crowd come at half the normal rate
    sessionWorkFee: { min: 100, max: 200 },  // Pay per session for sitting in on another band's recording
    sessionWorkMinMusicianship: null,        // NOT DECIDED in Design.md
    sessionWorkMinReputation: null,          // NOT DECIDED in Design.md
    sessionWorkBlocks: null,                 // NOT DECIDED in Design.md ("a few slots")
    sessionWorkStreamingShare: null,         // NOT DECIDED in Design.md ("a small percentage")
    residencyWeeks: 4                        // A residency is a weekly night for a month
  },

  // ---------------------------------------------------------------
  // Geography and tours
  // ---------------------------------------------------------------
  geography: {
    nearMinReputation: 25,           // Near cities unlock at reputation 25
    midMinReputation: 40,            // Mid cities: reputation 40 and a first Near show
    farMinReputation: 50,            // Far cities: reputation 50 and a van
    venuesPerCity: { min: 2, max: 4 },
    fanCeiling: {                    // Most fans a city can ever have
      hometown: 50000,
      near: { min: 20000, max: 40000 },
      national: 500000
    }
  },

  tours: {
    minShows: 3,                     // A tour is 3+ out-of-town shows...
    withinDays: 10                   // ...within 10 days
  },

  // ---------------------------------------------------------------
  // Fans, buzz, and crowd size
  // ---------------------------------------------------------------
  fans: {
    fadeAfterDays: 30,               // No show or release in a city this long...
    fadePerWeek: 0.02                // ...costs 2% of that city's fans per week
  },

  buzz: {
    min: 0,                          // Buzz never goes below this
    max: 100,                        // ...or above this
    fadePerDay: -2                   // Buzz fades 2 points a day (overnight)
  },

  crowd: {
    // expected crowd = city fans x (8% + buzz / 5 %) + foot traffic x (0.5 + buzz / 100)
    fanTurnout: 0.08,
    buzzTurnoutDivisor: 5,
    footTrafficBase: 0.5,
    footTrafficBuzzDivisor: 100,
    randomMin: 0.85,                 // Actual crowd = expected x random 0.85 to 1.15...
    randomMax: 1.15                  // ...capped at venue capacity
  },

  // ---------------------------------------------------------------
  // Reputation (0 to 100)
  // ---------------------------------------------------------------
  reputation: {
    max: 100,
    start: 0,
    tierMultiplier: 0.5,             // Gig reputation x (1 + venue tier x 0.5)
    diminishingDivisor: 150          // Gains x (1 - reputation / 150); losses not reduced
  },

  // ---------------------------------------------------------------
  // Promotion
  // ---------------------------------------------------------------
  promotion: {
    postOnline:  { cost: 0,   buzzBase: 1, buzzSkillDivisor: 20 },   // +1 + Promotion / 20 hometown buzz
    flyers:      { cost: 20,  buzz: 3 },                             // One city
    socialAds:   { cost: 50,  buzz: 8 },                             // One city, needs first release
    bigCampaign: { cost: 150, buzz: 15, maxCities: 3, fanRate: 0.01, minReputation: 40 },
    pressPush:   { cost: 500, buzz: 10, reputation: 2 },             // Every city with fans, needs Manager
    paidSkillDivisor: 100            // Paid promo effects x (1 + Promotion / 100)
  },

  // ---------------------------------------------------------------
  // Gig resolution
  // score = 0.35 x band musicianship + 0.25 x Performance + 0.20 x avg song quality
  //       + 0.20 x avg tightness + modifiers + luck
  // ---------------------------------------------------------------
  gigs: {
    weights: { bandMusicianship: 0.35, performance: 0.25, songQuality: 0.20, tightness: 0.20 },
    tiredPenalty: -10,
    lowMoralePenalty: -5,            // Morale below the low threshold
    highMoraleBonus: 5,              // Morale above the high threshold
    moraleLowThreshold: 30,
    moraleHighThreshold: 70,
    fullRoomThreshold: 0.80,         // Room more than 80% full...
    fullRoomBonus: 5,                // ...gives +5
    emptyRoomThreshold: 0.25,        // Room less than 25% full (not open mics)...
    emptyRoomPenalty: -5,            // ...gives -5
    luckMin: -10,
    luckMax: 10,
    badLuckStreak: 2,                // After this many Rough results in a row, luck can't go below 0
    results: {                       // minScore = lowest score for that result
      rough:     { minScore: -Infinity, fanConversion: 0,    buzz: -5, reputation: -1 },
      solid:     { minScore: 25,        fanConversion: 0.08, buzz: 2,  reputation: 2 },
      great:     { minScore: 45,        fanConversion: 0.15, buzz: 5,  reputation: 3 },
      legendary: { minScore: 65,        fanConversion: 0.25, buzz: 10, reputation: 5 }
    }
  },

  // ---------------------------------------------------------------
  // Milestones that need numbers (the full list goes in js/content/milestones.js later)
  // ---------------------------------------------------------------
  milestones: {
    smallRoomsReputation: 10,
    fullBandOnStage: 3,
    onTheRoadReputation: 25,
    managerReputation: 50,
    managerFans: 2000,
    managerCut: 0.15,                // Manager takes 15% of gig pay
    theaterReputation: 60,
    labelReputation: 65,
    labelFans: 10000,
    labelAdvance: { min: 10000, max: 50000 },
    labelStreamingCut: 0.80,         // Label keeps 80% of streaming until the advance is paid back
    awardsMonth: 12,                 // Awards season is every December
    arenaReputation: 85,
    arenaFans: 100000
  },

  // ---------------------------------------------------------------
  // Housing (the lifestyle ladder)
  // ---------------------------------------------------------------
  housing: {
    starter:  { name: 'Starter apartment',    weeklyCost: 400,  moraleRest: 50 },
    nicer:    { name: 'Nicer apartment',      weeklyCost: 700,  moraleRest: 55 },
    house:    { name: 'House',                weeklyCost: 1500, moraleRest: 60, freeHomeStudio: true },
    mansion:  { name: 'Mansion in the hills', weeklyCost: 5000, moraleRest: 65 },
    vacation: { name: 'Vacation home',        weeklyCost: 4000, moraleRest: 75, canBePrimary: false, needs: 'house' },
    moveCostWeeks: 4                 // Moving costs 4 weeks of the new rent up front
  },

  // ---------------------------------------------------------------
  // Fame levels (by total fans across all cities)
  // ---------------------------------------------------------------
  fameLevels: [
    { name: 'Bedroom Musician',   minFans: 0 },
    { name: 'Open Mic Regular',   minFans: 10 },
    { name: 'Local Act',          minFans: 100 },
    { name: 'Hometown Heroes',    minFans: 1000 },
    { name: 'Regional Draw',      minFans: 5000 },
    { name: 'Touring Act',        minFans: 25000 },
    { name: 'Rising Star',        minFans: 100000 },
    { name: 'National Headliner', minFans: 500000 },
    { name: 'Arena Act',          minFans: 2000000 },
    { name: 'Legend',             minFans: 10000000 }
  ],

  // ---------------------------------------------------------------
  // Saving
  // ---------------------------------------------------------------
  save: {
    version: 3,                      // Save format version, bumped when the state shape changes
    storageKey: 'bandRise.save'      // The name the save is stored under in the browser
  },

  // ---------------------------------------------------------------
  // Debug panel (only shown when the address ends in ?debug)
  // ---------------------------------------------------------------
  debug: {
    cashStep: 500,                   // The +$ and -$ buttons add or remove this much
    skipDays: 7                      // The skip button jumps this many days
  }
};
