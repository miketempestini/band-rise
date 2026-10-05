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
    startDate: { year: 2026, month: 1, day: 5 }, // Every career starts on Monday, January 5, 2026 (day 0)
    daysPerYear: 365,              // About a year (only used to size the two-year balance check)
    calendarWeeks: 4,              // How many weeks the Calendar screen shows
    startBookingWeeks: 4,          // How far ahead you can book at the start
    managerBookingWeeks: 12,       // How far ahead you can book after getting a Manager (and the Calendar shows)
    calendarPageWeeks: 4,          // The Calendar shows this many weeks at a time
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
    sickNoticeDays: 1,               // You can only call in sick for today or up to this many days ahead
                                     // (unless it's for a booked show, decided when you accept it)
    partTimeMinReputation: 20,       // Reputation needed to go part-time
    partTimeMinStanding: 50,         // Job standing needed to go part-time
    quitMoraleBonus: 15,             // Morale gained when you quit the day job (milestone)
    lookForWorkChance: 0.5,          // Chance each "Look for work" try lands a part-time job
    quitScreenIncomeWeeks: 4,        // The quit screen shows this many weeks of music income
    // Money that counts as "music income" on the quit screen (gig pay, tips, merch, streaming, session work)
    musicIncomeCategories: ['tips', 'gigPay', 'merch', 'streaming', 'sessionWork', 'sessionCredits']
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
    hotelPerNight: 80,                          // Cost of a hotel night out of town (one price for the whole band)
    gasRoundTrip: { near: 40, mid: 80, far: 150 }, // Gas cost for a round trip; each one-way leg costs half
    // Back-to-back shows: if your next out-of-town show is within this many days (or going home in between
    // doesn't fit), you drive straight on to the next city instead of going home.
    chainWithinDays: 2,
    openMicSignupDays: { min: 1, max: 14 },     // Out-of-town open mics: sign up for a night this many days ahead
    // National cities are reached by plane: each way takes this many blocks (airport time included) and costs
    // this much per person on stage (you plus your bandmates). No van needed for the flight itself.
    flight: { blocks: 2, perPersonOneWay: 300 }
  },

  // ---------------------------------------------------------------
  // Big shows: production costs (sound and lights) paid on the night, by venue tier
  // ---------------------------------------------------------------
  production: {
    share: 0.25,                     // Production costs 25% of the show's pay (before splits)...
    theater: 1000,                   // ...up to $1,000 at a theater (tier 3)
    arena: 5000,                     // ...up to $5,000 at an arena (tier 4)
    festival: 0                      // Festivals provide their own production
  },

  // ---------------------------------------------------------------
  // The manager (milestone 14: reputation 50 and 2,000 fans)
  // ---------------------------------------------------------------
  manager: {
    gigPayCut: 0.15,                 // Takes 15% of all gig pay (before the band's split)
    offerExpiryDays: 7,              // Answer the manager's offer within this many days
    reofferWeeks: 8,                 // Turn the manager down and they ask again this many weeks later
    autoBook: {
      defaultMaxPerWeek: 2,          // Starting rule: at most this many shows a week
      maxPerWeekLimit: 5             // The most shows a week you can set (dates follow each venue's booking window)
    },
    tour: {
      planDays: 5,                   // The manager takes this many days to plan a tour
      leadDays: 35,                  // The first show is at least 5 weeks after the proposal arrives
      proposalExpiryDays: 3,         // Answer a tour proposal within this many days
      minCities: 2,
      maxCities: 8,
      showDayOfWeekPreferred: [3, 4, 5, 6, 2, 1, 0], // Nights the manager tries first (Thursday first), as with residencies
      // Ad campaigns you can add per city to a tour proposal. They land a week before the show (and the city's
      // buzz doesn't fade while the ads run). fans: new fans in that city right away.
      adLeadDays: 7,
      ads: {
        posters: { cost: 150,  buzz: 20, fans: 0 },
        local:   { cost: 500,  buzz: 35, fans: 50 },
        full:    { cost: 1500, buzz: 50, fans: 200 }
      }
    },
    // The manager posts for the band every day (free: part of the cut). Buzz in every city where you have fans,
    // more in "focus cities": cities with an out-of-town show in the next 2 weeks.
    social: {
      dailyBuzz: 1,                  // +1 buzz a day in every city with fans (buzz fades 2 a day)
      focusBuzz: 3,                  // +3 a day in focus cities
      focusDays: 14
    }
  },

  // ---------------------------------------------------------------
  // The label (milestone 16: reputation 65 and 10,000 fans)
  // ---------------------------------------------------------------
  label: {
    advanceBase: 10000,              // Advance = $10,000 + $2 per fan, up to $50,000
    advancePerFan: 2,
    advanceMax: 50000,
    streamingCut: 0.80,              // The label keeps 80% of streaming until the advance is paid back
    offerExpiryDays: 7,
    reofferWeeks: 8                  // Turn the label down and they ask again this many weeks later
  },

  // ---------------------------------------------------------------
  // Arenas and festivals (milestone 18: reputation 85 and 100,000 fans): offers only
  // ---------------------------------------------------------------
  bigOffers: {
    offerDayOfWeek: 0,               // Offers arrive on Mondays...
    arenaWeeklyChance: 0.10,         // ...an arena offer 10% of the time
    festivalWeeklyChance: 0.10,      // ...a festival offer 10% of the time (one of each open at a time)
    daysAhead: { min: 42, max: 70 }, // The show is 6 to 10 weeks out
    expiryDays: 5,
    festivalFee: { min: 5000, max: 15000 }, festivalFeeRoundTo: 500,
    festivalCrowdShare: { min: 0.3, max: 0.6 }, // A festival crowd fills this much of the grounds
    festivalSetSize: 8                // A festival slot is an 8-song set (an arena is a full 18)
  },

  // ---------------------------------------------------------------
  // Awards season: every December (weeks 48 to 52 of each 52-week year)
  // ---------------------------------------------------------------
  awards: {
    month: 12,                       // Awards season is December (vacation days and "this year" follow real years too)
    nominationsDayOfWeek: 0,         // Nominations arrive on the first Monday of December (0 = Monday)
    ceremonyDayOfWeek: 5,            // The ceremony is on the last Saturday of December
    songMinQuality: 60,              // Song of the Year: a release this year with recording quality 60+
    recordMinQuality: 55,            // Record of the Year: an EP or album this year, average quality 55+
    breakoutMinFans: 2000,           // Breakout Act: 2,000+ new fans this year
    breakoutFansForMax: 20000,       // ...the win chance tops out at this many new fans
    qualityFloor: 50,                // Song/record win chance = (quality - 50) / 50
    minChance: 0.10,
    maxChance: 0.80,
    winReputation: 5                 // Each win: +5 reputation
  },

  // ---------------------------------------------------------------
  // Vans (in the Shop from milestone 10, On the road). Needed for Far cities with a band, and for tours.
  // maxShows: how many out-of-town shows it lasts before breaking down for good (null = never).
  // ---------------------------------------------------------------
  vans: {
    beater: { price: 1500,  maxShows: 10 },
    used:   { price: 3000,  maxShows: 30 },
    new:    { price: 12000, maxShows: null }
  },

  // ---------------------------------------------------------------
  // Economy: starting money, income, and costs
  // ---------------------------------------------------------------
  economy: {
    startCash: 500,                  // Cash at the start of a new career
    // Weekly bills (rent + living costs) come from the housing table below.
    // Starter apartment: $275 rent + $125 living costs = $400 a week.
    // Open mic tip jar: see gigs.openMicTips (it depends on how the night went)
    coverGigFee: 50,                 // Flat fee for a cover night, no matter who shows up (owner's change from $25)
    coverGigMinReputation: 5,        // PLACEHOLDER: reputation needed for cover nights
    coverGigMinMusicianship: 25,     // PLACEHOLDER: Musicianship needed for cover nights
    rehearsalRoomPerBlock: 20,       // Rehearsal room rent per block (needed with a band)
    networkingCost: 15,              // Drinks when you go out to network
    hangOutCost: 15,                 // Cost to hang out with a contact
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
    freshnessDropPerWeek: 0.03,      // Freshness drops 3% a week after release (x 0.97 each week)
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
    blockedActions: ['upgradeHousing', 'buyVacationHome'] // While you owe money: no moving up, no vacation home
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
      promote:  { promotion: 2 },
      sessionWork: { musicianship: 1.5 } // Each session on another band's recording
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
      sessionWork: 20,               // A session on another band's recording
    email: 5,                      // Emailing a venue (no block needed: send as many as you like)
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
    reliabilityRange: { min: 40, max: 95 }, // A new person's reliability (Party Animal then loses 20)
    ambitionRange: { min: 10, max: 90 },    // A new person's ambition
    bandNameMaxLength: 40,           // Longest band name the player can type
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
    sessionPlayerTightness: 50,      // A session player counts as this tightness on every song
    sessionPlayerSkill: 40           // PLACEHOLDER: a session player's skill (for band musicianship)
  },

  // ---------------------------------------------------------------
  // Personality traits
  // ---------------------------------------------------------------
  traits: {
    workhorse:    { rehearsalTightnessBonus: 0.5, minRehearsalsPerWeek: 2, tooFewRehearsals: -3 }, // +50% tightness from rehearsals; -3 satisfaction with fewer than 2 a week
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
      practiceAllGain: 1,            // "Practice all songs": +1 to every song (and none of them fade that week)
      rehearseGain: 12,              // Rehearse with the band: +12 to each song...
      rehearseMaxSongs: 4,           // ...up to 4 songs
      rehearseNoShowMultiplier: 0.5, // If no bandmate shows up, songs get half the rehearsal tightness
      playLiveGain: 10,              // Playing a song live (changed from Design.md's +5 at the owner's request)
      decayAfterDays: 7,             // Not played or rehearsed this long starts the slide
      decayPerWeek: -3,              // Tightness lost per week
      floor: 20                      // Tightness never drops below this from decay
    },
    setlist: {                       // Songs needed per show type, and the cover limit (null = any)
      openMic:   { songs: 2,  coverLimit: null },
      coverNight: { songs: 5, coversOnly: true },  // Cover nights: 5 songs, covers only
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
    bookAheadDays: 10,               // Studio time must be booked at least this many days ahead (owner's change from 2)
    bookAheadMaxDays: 28,            // ...and at most this far ahead (the 4-week calendar)
    maxBlocksPerBooking: 3,          // One booking can reserve up to this many blocks on one day
    songsPerBlock: 1,                // One song recorded per studio block
    songQualityWeight: 0.5,
    bandMusicianshipWeight: 0.25,
    tightnessWeight: 0.25,
    studios: {
      home: { cost: 0,    oneTimeCost: 300, bonus: 0,  qualityCap: 40 },  // Needs the First recording milestone
      demo: { cost: 75,   bonus: 0 },                                      // Needs nothing
      pro:  { cost: 250,  bonus: 10, minReputation: 40 },
      top:  { cost: 1000, bonus: 20, needsLabel: true }                    // Needs a label deal
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
    tiers: {                         // Rules for each venue tier (0 = open mic ... 4 = arena); setlist = which songs.setlist entry it uses
      0: { name: 'Open mic',   setlist: 'openMic',   minReputation: 0,  minOnStage: 1, bookAhead: { min: 0, max: 0 },   ticket: 0,  doorShare: 0,    footTraffic: 30,  gigScorePenalty: 0 },
      1: { name: 'Small room', setlist: 'smallRoom', minReputation: 10, minOnStage: 1, bookAhead: { min: 7, max: 14 },  ticket: 8,  doorShare: 0.70, footTraffic: 30,  gigScorePenalty: -3, guarantee: { min: 50,  max: 100 } },
      2: { name: 'Club',       setlist: 'club',      minReputation: 30, minOnStage: 3, bookAhead: { min: 14, max: 28 }, ticket: 12, doorShare: 0.75, footTraffic: 40,  gigScorePenalty: -6, guarantee: { min: 200, max: 500 } },
      3: { name: 'Theater',    setlist: 'theater',   minReputation: 60, minOnStage: 3, bookAhead: { min: 28, max: 56 }, ticket: 25, doorShare: 0.80, footTraffic: 60,  gigScorePenalty: -10, guarantee: { min: 2000, max: null } },
      4: { name: 'Arena',      setlist: 'arena',     minReputation: 85, minOnStage: 3, bookAhead: null,                 ticket: 45, doorShare: null, footTraffic: 200, gigScorePenalty: -15, guarantee: { min: 20000, max: null } }
    },
    // Each venue's flat fee (its "guarantee"), in dollars. Venue names and sizes are in js/content/venues.js.
    guarantees: {
      cornerTap: 60,
      backRoom: 100,
      basement: 250,
      velvetLounge: 400,
      orpheum: 2000,
      // Near
      copperPint: 70, millStreetHall: 80, theDepot: 300,
      railyardTavern: 60, grayFox: 90, signalHouse: 250,
      // Mid
      rustyAnchor: 100, lighthouseBallroom: 450, tidewaterClub: 300,
      wineCellar: 80, theAvalon: 350, brickworks: 250,
      // Far
      dustySaloon: 100, theForge: 500, redstoneGrand: 2000,
      theBoathouse: 80, pinewoodHall: 400, theLyric: 2000,
      backAlleyBar: 100, neonGarden: 500, unionStation: 350, thePalace: 2500,
      surfShack: 70, pierNine: 400, bayfrontTheater: 2200,
      // National (locked for now)
      clubMeridian: 500, halstonTheater: 3000, halstonArena: 25000,
      crescentClub: 450, crescentTheater: 2800, crescentArena: 22000,
      theKingsway: 400, royalTheater: 2500, kingsportColiseum: 20000,
      // International (locked for now)
      lindenCellar: 500, lindenbergHall: 3000, lindenbergArena: 25000,
      clubSolana: 450, teatroAurelia: 2800, aureliaStadium: 30000,
      blueDoor: 400, valmoraOpera: 3000, valmoraFestival: 30000
    },
    // Booking chance = 50% + 3% x (reputation - required) + Networking / 4 % + venue relationship / 5 %
    bookingBaseChance: 0.50,
    bookingPerReputationPoint: 0.03,
    bookingNetworkingDivisor: 4,
    bookingRelationshipDivisor: 5,
    bookingMinChance: 0.05,          // Booking chance never goes below 5%...
    bookingMaxChance: 0.95,          // ...or above 95%
    replyDays: { min: 1, max: 3 },   // Venue replies arrive 1 to 3 days later
    offerExpiryDays: 3,              // A "yes" must be accepted within this many days (and before the show)
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
    // (Session work, sitting in on another band's recording, has its own section: balance.sessionWork)
    residencyWeeks: 4,                       // A residency is a weekly night for a month

    // Opening slots: play before a touring band at a club. Chance each morning (from reputation 10):
    //   1% + reputation / 20 % + Networking / 40 %   (reputation 20, Networking 20: 2.5% a day)
    openingSlot: {
      minReputation: 10,
      baseChance: 0.01,
      reputationDivisor: 20,
      networkingDivisor: 40,
      daysAhead: { min: 3, max: 10 },      // the show is this many days away
      crowdShare: { min: 0.6, max: 0.9 },  // the headliner's crowd fills this much of the room
      setSize: 6,                          // an opening set is 6 songs (no 3-on-stage rule)
      expiryDays: 2,                       // answer within this many days
      venueTier: 2,                        // opening slots happen at clubs (tier 2)
      feeRoundTo: 5                        // the fee is a round number: a multiple of $5
    },

    // Residencies: a contract for a weekly night at one venue, offered (on Mondays) by a venue that likes you.
    residency: {
      minReputation: 20,
      minRelationship: 15,                 // the venue's relationship with you
      offerDayOfWeek: 0,                   // offers only arrive on this day (0 = Monday)
      weeklyChance: 0.25,                  // chance each Monday that an eligible venue offers one
      startDaysAhead: 7,                   // the first night is at least this many days away
      // The venue offers the first of these nights (0 = Monday) whose dates are all free: Thursday, Friday, Wednesday...
      preferredNights: [3, 4, 2, 5, 1, 6, 0],
      crowdFloor: 0.5,                     // regulars come back: the crowd never drops below half the room
      expiryDays: 3,                       // answer within this many days
      // Negotiating (one counter-offer per contract; the answer comes the next morning):
      counterReplyDays: 1,                 // the venue answers a counter-offer this many days later
      counterKeepOpenDays: 2,              // a counter-offer keeps the contract open at least this many more days
      minWeeks: 3,
      maxWeeks: 6,
      maxRateChange: 0.25,                 // ask for up to 25% more (or less) per night
      rateStep: 0.05,                      // the rates you can ask for go up and down in 5% steps...
      rateRoundTo: 5,                      // ...rounded to the nearest $5
      dayChangePenalty: 0.10,              // a different night: -10% chance
      ratePenaltyPerPercent: 0.02,         // each 1% more money: -2% chance
      lengthPenaltyPerWeek: 0.05,          // each week longer or shorter: -5% chance
      relationshipBonusDivisor: 2,         // + venue relationship / 2 % chance
      minChance: 0.05,
      maxChance: 0.95
    }
  },

  // ---------------------------------------------------------------
  // Session work: sitting in on another band's recording (offers arrive in the Inbox)
  // Your streaming share each Sunday = their fans x streaming.payPerFan x (song quality / 100) x freshness x share
  // ---------------------------------------------------------------
  sessionWork: {
    minMusicianship: 40,             // Offers only come once your Musicianship is this high...
    minReputation: 20,               // ...and your reputation is this high
    dailyChance: 0.04,               // Chance each morning of an offer (one open offer at a time)
    sessions: 3,                     // Each job is this many studio sessions, one block each...
    days: { min: 2, max: 4 },        // ...spread over this many different days...
    daysAhead: { min: 3, max: 10 },  // ...somewhere in this many days from now (never on job blocks or booked blocks)
    fee: { min: 100, max: 200 },     // Pay per session, decided when the offer arrives...
    feeRoundTo: 10,                  // ...as a round number (a multiple of $10)
    expiryDays: 2,                   // Answer the offer within this many days
    releaseAfterWeeks: { min: 2, max: 6 }, // The band releases the song this long after your last session
    bandFans: { min: 1000, max: 5000 },    // How many fans the other band has (for your streaming share)
    songQuality: { min: 50, max: 80 },     // How good their song is
    streamingShare: 0.10             // You get 10% of the song's streaming money (only if you played every session)
  },

  // ---------------------------------------------------------------
  // Plan Week: set all 7 evenings at once, and saved week templates
  // ---------------------------------------------------------------
  planWeek: {
    maxTemplates: 5,                 // How many week templates you can keep
    templateNameMaxLength: 30        // Longest template name you can type
  },

  // ---------------------------------------------------------------
  // Geography and tours
  // ---------------------------------------------------------------
  geography: {
    nearMinReputation: 25,           // Near cities unlock at reputation 25
    midMinReputation: 40,            // Mid cities: reputation 40 and a first Near show
    farMinReputation: 50,            // Far cities: reputation 50 and a van
    venuesPerCity: { min: 2, max: 4 },
    fanCeilings: {                   // Most fans each city can ever have
      hometown: 50000,
      harlowFalls: 30000, cedarJunction: 25000,                              // Near
      portEllery: 50000, ashfordSprings: 45000,                              // Mid
      redstone: 80000, lakeVarden: 70000, bellmontCity: 100000, sableBay: 90000, // Far
      newHalston: 500000, crescentCity: 400000, kingsport: 350000,           // National
      lindenberg: 500000, portAurelia: 450000, valmora: 400000               // International
    }
  },

  tours: {
    minShows: 3,                     // A tour is 3+ out-of-town shows...
    withinDays: 10,                  // ...within 10 days
    // Word of mouth on tour: tour shows win 50% more new fans, and give buzz to the next city on the route.
    fanBonus: 0.5,
    nextCityBuzz: 10,
    // Any out-of-town show gives a little buzz to the other cities in the same region (Near, Mid, Far...).
    regionBuzz: 3
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
    diminishingDivisor: 110,         // Gains x (1 - reputation / 110); losses not reduced (owner's change from 150)
    // "Outgrowing" rooms (owner's change, so reputation is hard to gain and bigger rooms and other cities matter):
    outgrownTierGap: 1,              // Gigs more than this many tiers below the highest tier you've unlocked give no reputation
    openMicAfterSmallRooms: 0.5      // Once small rooms are unlocked, open mics give only half the reputation
  },

  // ---------------------------------------------------------------
  // Promotion
  // ---------------------------------------------------------------
  promotion: {
    postOnline:  { cost: 0,   buzzBase: 1, buzzSkillDivisor: 20 },   // +1 + Promotion / 20 hometown buzz
    flyers:      { cost: 20,  buzz: 3 },                             // One city
    socialAds:   { cost: 50,  buzz: 8 },                             // One city, needs first release
    bigCampaign: { cost: 150, buzz: 15, maxCities: 3, fanRate: 0.01, minReputation: 40 }, // Up to 3 cities you pick
    pressPush:   { cost: 500, buzz: 10, reputation: 2, cooldownDays: 14 }, // Every city with fans, needs Manager; once every 2 weeks
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
    resultOrder: ['rough', 'solid', 'great', 'legendary'], // worst to best
    results: {                       // minScore = lowest score for that result (morale changes are in morale.change)
      rough:     { minScore: -Infinity, fanConversion: 0,    buzz: -5, reputation: -1 },
      solid:     { minScore: 25,        fanConversion: 0.08, buzz: 2,  reputation: 2 },
      great:     { minScore: 45,        fanConversion: 0.15, buzz: 5,  reputation: 3 },
      legendary: { minScore: 65,        fanConversion: 0.25, buzz: 10, reputation: 5 }
    },
    openMicTips: {                   // Tip jar dollars, random within the range, by result
      rough:     { min: 0,  max: 5 },
      solid:     { min: 0,  max: 20 },
      great:     { min: 10, max: 30 },
      legendary: { min: 20, max: 40 }
    },
    // The one tip on the result screen points at the biggest thing that hurt. These decide when
    // something counts as "hurting":
    badLuckTipAt: -4,                // luck this low or lower
    looseSongsTipAt: 50,             // average tightness below this
    crowdMeterSeconds: 2.5           // how long the crowd meter fills before the result shows
  },

  // ---------------------------------------------------------------
  // Milestones that need numbers (the full list goes in js/content/milestones.js later)
  // ---------------------------------------------------------------
  milestones: {
    smallRoomsReputation: 10,
    fullBandOnStage: 3,
    onTheRoadReputation: 25,
    managerReputation: 50,
    managerFans: 2000,               // (the manager's cut is in balance.manager)
    theaterReputation: 60,
    labelReputation: 65,
    labelFans: 10000,                // (the advance and streaming cut are in balance.label)
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
    ladder: ['starter', 'nicer', 'house', 'mansion'], // Homes you can live in, cheapest first (the vacation home is a second home)
    moveCostWeeks: 4                 // Moving (or buying the vacation home) costs 4 weeks of the new home's weekly cost up front
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
    version: 15,                     // Save format version, bumped when the state shape changes
    storageKey: 'bandRise.save'      // The name the save is stored under in the browser
  },

  // ---------------------------------------------------------------
  // Random events (see js/content/events.js for each event's own numbers)
  // ---------------------------------------------------------------
  events: {
    dailyChance: 0.28,               // Chance each morning that something happens (about one every 3.5 days)
    defaultCooldownDays: 10,         // The same event won't happen again for at least this many days
    firstOvertimeWeek: 1,            // The overtime offer is guaranteed on this week's Friday

    // Each event's own numbers. "weight" is how likely it is compared to the other events that can
    // happen that day (6 is twice as likely as 3). Cash amounts are dollars; gigScore/dailyEnergy
    // effects last "days" days. Satisfaction and relationship amounts are for bandmates.
    overtime:      { weight: 6, dayOfWeek: 4 },          // asked on Fridays (0 = Monday), for the next day
    crackingAmp:   { weight: 3, minGigsPlayed: 1, fixCost: 60, playOnGigScore: -3, playOnDays: 7 },
    brokenString:  { weight: 4, fixCost: 15, makeDoGigScore: -2, makeDoDays: 4 },
    blogMention:   { weight: 3, shareBuzz: 8, shareEnergy: -5, enjoyBuzz: 3, enjoyMorale: 3 },
    carTrouble:    { weight: 2, fixCost: 150, busEnergyPerNight: -5, busDays: 7 },
    fillIn:        { weight: 3, venues: ['cornerTap', 'backRoom'], reputation: 1 },
    lessons:       { weight: 3, minMusicianship: 25, pay: 40, energy: -10 },
    party:         { weight: 3, joinMorale: 8, joinEnergy: -15, stayInMorale: -3 },
    sunnySaturday: { weight: 4, dayOfWeek: 5, buskCash: { min: 15, max: 35 }, buskBuzz: 2, buskEnergy: -15 },
    moreRehearsal: { weight: 3, promiseSatisfaction: 5, refuseSatisfaction: -3 },
    // Band life (Phase 9)
    argument:      { weight: 3, minMembers: 2, sideWith: 6, sideAgainst: -6, stayOut: -2 },
    sideProject:   { weight: 2, minAmbition: 50, encourageSatisfaction: 6, encourageReliability: -10, commitSatisfaction: -4 },
    biggerShare:   { weight: 2, cooldownDays: 30, minAmbition: 60, giveSatisfaction: 5, refuseSatisfaction: -8 },
    gearStolen:    { weight: 2, replaceCost: 120, borrowGigScore: -3, borrowDays: 7 },
    sickBeforeShow:{ weight: 4, shortGigScore: -5, shortDays: 2 },
    noiseComplaint:{ weight: 2, fine: 40, quietSatisfaction: -3 },
    songIdea:      { weight: 3, progress: 15, energy: -10, satisfaction: 3 },
    lateNight:     { weight: 3, minMembers: 2, morale: 8, relationship: 4, energy: -15 }
  },

  // ---------------------------------------------------------------
  // Tutorial and the end of the first three weeks
  // ---------------------------------------------------------------
  tutorial: {
    days: 3                          // Tip cards show on the first this-many days of a new career
  },
  slice: {
    endDay: 21,                      // The "Three weeks in" card shows after this many days (end of week 3)
    // Where a new player should land by then (from Design.md's "Where the player should land")
    targets: {
      cash:       { min: 400, max: 900 },
      fans:       { min: 6,   max: 15 },
      originals:  { min: 1,   max: 2 },
      bandSize:   { min: 1,   max: 1 },  // bandmates besides you
      reputation: { min: 10,  max: 13 }
    }
  },

  // ---------------------------------------------------------------
  // Finances screen
  // ---------------------------------------------------------------
  finances: {
    keepDays: 92,                    // Money records older than this are dropped each night (the screen shows up to 90 days)
    periods: [7, 30, 90],            // The filters: last week, last month, last 3 months (in days)
    chartWeeks: 13,                  // The weekly chart shows this many weeks
    topCount: 5                      // "Top earners and costs" lists this many of each
  },

  // ---------------------------------------------------------------
  // Time savers
  // ---------------------------------------------------------------
  timeSavers: {
    maxSkipDays: 14                  // "Skip to next commitment" never skips more than this many days at once
  },

  // ---------------------------------------------------------------
  // Screens: how much to show at once
  // ---------------------------------------------------------------
  ui: {
    playerNameMaxLength: 24,         // Longest player name you can type at New career
    skillBigStep: 5,                 // The skills page has -5/-1/+1/+5 buttons: this is the big step
    upcomingMilestones: 4,           // The Career screen lists this many milestones under "Coming up"
    upcomingShows: 3                 // Today's "Coming up" panel lists this many booked shows
  },

  // ---------------------------------------------------------------
  // Debug panel (only shown when the address ends in ?debug)
  // ---------------------------------------------------------------
  debug: {
    cashStep: 500,                   // The +$ and -$ buttons add or remove this much
    fansStep: 5000,                  // The "+ fans" button adds this many hometown fans
    skipDays: 7                      // The skip button jumps this many days
  }
};
