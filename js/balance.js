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
    flight: { blocks: 2, perPersonOneWay: 300 },
    // International flights (between countries, including home to abroad) and hops (two cities in the same
    // foreign country): blocks each way and the fare per person on stage.
    internationalFlight: { blocks: 3, perPersonOneWay: 1200 },
    hop: { blocks: 1, perPersonOneWay: 250 },
    // The private jet (Shop, after milestone 19): one price for the whole band per flight, and 1 block faster
    // (never less than 1 block). A hop costs the cheaper of the airline fares and the jet's hop price.
    jet: { price: 1500000, national: 2000, international: 6000, hop: 2000, blocksFaster: 1 },
    // Jet lag: arriving after an international flight costs energy (less on your own jet)
    jetLag: { energy: 15, withJet: 7 }
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
      autoBookGapDays: 2,            // Auto-booking leaves an open tour proposal's dates alone, from this many days
                                     // before its first show to this many after its last (room for the drives)
      minCities: 3,                  // A tour request needs at least this many cities (there's no most: any city that
                                     // doesn't fit in your calendar is left out of the plan, with the reason)
      nameMaxLength: 40,             // Longest tour name you can type (the name is optional)
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
  // Record labels (see js/rules/label.js; the 12 labels' names are in js/content/labels.js)
  // Offers only come once you have a manager. Each label has a tier (indie, mid, major, shark) and a personality.
  // An offer's terms are rolled from its tier's ranges, then shaped by its personality.
  // ---------------------------------------------------------------
  label: {
    offerExpiryDays: 7,              // Answer an offer within this many days (longer while a counter-offer is pending)
    maxOpenOffers: 3,                // At most this many label offers open at once (a bidding war)
    offerDayOfWeek: 0,               // New offers arrive on Mondays (0 = Monday)
    declineCooldownWeeks: { min: 8, max: 16 }, // Turn a label down and it waits this long before offering again
    expireCooldownWeeks: { min: 6, max: 10 },  // Let its offer run out: this long
    afterDealWeeks: 4,               // After a deal ends (or you buy out), offers start again this many weeks later
    hotChance: { buzzAt: 50, buzz: 0.05, charting: 0.05, recentRelease: 0.05, recentDays: 28 }, // Extra chance a week:
                                     // buzz 50+ where you have fans, a song on the chart, or a release in the last 4 weeks
    biddingWar: { chance: 0.35, days: { min: 1, max: 4 } }, // When one label offers, each other eligible label may join
    rivalSnipeChance: 0.5,           // An offer you let run out may go to a rival without a label
    // Asking your manager to find you a deal: an offer arrives in this many days (from a label that would sign you,
    // never a shark; most often the biggest tier you qualify for). Turn that offer down (or let it run out) and you
    // wait this many days before you can ask again.
    managerSearch: { days: { min: 7, max: 14 }, bestTierChance: 0.7, rejectWaitDays: 28 },
    // The tiers: who can offer, how often (each Monday), and the ranges every offer's terms are rolled from.
    //   royalty: your share of streaming money on records made under the deal
    //   advanceWeeks: the advance in weeks of your current streaming money (never under advanceFloor, in dollars)
    //   reach: how much the label boosts those records' streams (0.5 = +50%) and new fans when they come out
    //   push: new fans in every open city when a record comes out, as a share of that city's most fans x quality
    //   records: how many EPs or albums you owe; recordType 'ep' = an EP or an album counts, 'album' = albums only
    //   deadlineWeeks: weeks to deliver each record
    //   freePromo: the release-week push the label pays for on each record (null = none)
    //   tourSupport: money toward each tour you accept (dollars)
    tiers: {
      indie: { minReputation: 40, minFans: 2000, weeklyChance: 0.12, royalty: { min: 0.45, max: 0.60 }, advanceWeeks: { min: 4, max: 10 },
               advanceFloor: { min: 5000, max: 15000 }, reach: { min: 0.20, max: 0.40 }, push: 0.005, records: { min: 1, max: 2 }, recordType: 'ep',
               deadlineWeeks: { min: 24, max: 30 }, freePromo: null, tourSupport: { min: 0, max: 0 } },
      mid:   { minReputation: 55, minFans: 10000, weeklyChance: 0.10, royalty: { min: 0.25, max: 0.40 }, advanceWeeks: { min: 8, max: 16 },
               advanceFloor: { min: 15000, max: 40000 }, reach: { min: 0.30, max: 0.50 }, push: 0.006, records: { min: 2, max: 3 }, recordType: 'ep',
               deadlineWeeks: { min: 18, max: 26 }, freePromo: 'playlist', tourSupport: { min: 2000, max: 5000 } },
      major: { minReputation: 70, minFans: 50000, weeklyChance: 0.08, royalty: { min: 0.15, max: 0.25 }, advanceWeeks: { min: 20, max: 40 },
               advanceFloor: { min: 75000, max: 200000 }, reach: { min: 0.60, max: 1.20 }, push: 0.015, records: { min: 3, max: 5 }, recordType: 'album',
               deadlineWeeks: { min: 16, max: 24 }, freePromo: 'radio', tourSupport: { min: 10000, max: 30000 } },
      shark: { minReputation: 35, minFans: 1000, weeklyChance: 0.04, royalty: { min: 0.08, max: 0.15 }, advanceWeeks: { min: 30, max: 50 },
               advanceFloor: { min: 30000, max: 80000 }, reach: { min: 0.15, max: 0.35 }, push: 0.003, records: { min: 3, max: 5 }, recordType: 'album',
               deadlineWeeks: { min: 10, max: 14 }, freePromo: null, tourSupport: { min: 0, max: 0 } }
    },
    tierOrder: ['indie', 'mid', 'major', 'shark'],
    // Sharks come looking when you're desperate: in debt, after a flop, or after turning down this many deals.
    desperate: { weeklyChance: 0.25, declinedDeals: 3 },
    // Personalities shape the terms: multipliers on the tier's ranges, and how likely each clause is.
    //   royaltyShift: added to the rolled royalty     advanceMult / reachMult: multiply the advance and the reach
    //   masters: chances of 'artist' (you own them), 'reverts' (they come back revertWeeks after the deal), 'label' (theirs)
    //   control: chances of 'full', 'approval' (a quality bar), 'shelve' (they may hold a record a few weeks)
    //   gigCut / merchCut: { chance, min, max } of a 360 cut     recoup: chance each cost is charged back to you
    //   penalty: chances of each missed-deadline penalty      renewal: chance of a renewal option
    //   buyout: { mult, flatShare }: buyout = unrecouped x mult + advance x flatShare     dropsYou: false = they never let you go
    personalities: {
      friendly:   { royaltyShift: 0.10, advanceMult: 0.7, reachMult: 0.8, deadlineShift: 6, recordsShift: 0, promoShift: 0, tourMult: 1,
                    masters: { artist: 0.8, reverts: 0.2, label: 0 }, control: { full: 1, approval: 0, shelve: 0 },
                    gigCut: { chance: 0, min: 0, max: 0 }, merchCut: { chance: 0, min: 0, max: 0 },
                    recoup: { recording: 0, promo: 0, tour: 0 }, penalty: { fine: 1, royalty: 0, extend: 0 },
                    renewal: 0, buyout: { mult: 1, flatShare: 0 }, dropsYou: true, awardsBoost: 0, bigShowMult: 1 },
      prestige:   { royaltyShift: 0, advanceMult: 0.6, reachMult: 1.0, deadlineShift: 2, recordsShift: 0, promoShift: 0, tourMult: 1,
                    masters: { artist: 0, reverts: 0.6, label: 0.4 }, control: { full: 0, approval: 1, shelve: 0 },
                    gigCut: { chance: 0, min: 0, max: 0 }, merchCut: { chance: 0.3, min: 0.05, max: 0.10 },
                    recoup: { recording: 0.5, promo: 0, tour: 0.5 }, penalty: { fine: 0, royalty: 1, extend: 0 },
                    renewal: 0.3, buyout: { mult: 1.5, flatShare: 0.25 }, dropsYou: true, awardsBoost: 0.10, bigShowMult: 1.5 },
      pincher:    { royaltyShift: -0.02, advanceMult: 0.4, reachMult: 0.5, deadlineShift: 0, recordsShift: 0, promoShift: -1, tourMult: 0,
                    masters: { artist: 0.2, reverts: 0.3, label: 0.5 }, control: { full: 0.7, approval: 0.3, shelve: 0 },
                    gigCut: { chance: 0.2, min: 0.05, max: 0.10 }, merchCut: { chance: 0.3, min: 0.05, max: 0.15 },
                    recoup: { recording: 0.9, promo: 0.9, tour: 0.9 }, penalty: { fine: 0.7, royalty: 0.3, extend: 0 },
                    renewal: 0.2, buyout: { mult: 1.5, flatShare: 0.25 }, dropsYou: true, awardsBoost: 0, bigShowMult: 1 },
      hype:       { royaltyShift: 0, advanceMult: 1.2, reachMult: 1.4, deadlineShift: -4, recordsShift: 0, promoShift: 1, tourMult: 1.5,
                    masters: { artist: 0.1, reverts: 0.3, label: 0.6 }, control: { full: 0.6, approval: 0, shelve: 0.4 },
                    gigCut: { chance: 0.5, min: 0.05, max: 0.20 }, merchCut: { chance: 0.8, min: 0.10, max: 0.20 },
                    recoup: { recording: 0.5, promo: 0.7, tour: 0.7 }, penalty: { fine: 0.3, royalty: 0, extend: 0.7 },
                    renewal: 0.5, buyout: { mult: 2, flatShare: 0.5 }, dropsYou: true, awardsBoost: 0, bigShowMult: 1.5 },
      balanced:   { royaltyShift: 0, advanceMult: 1.0, reachMult: 1.0, deadlineShift: 0, recordsShift: 0, promoShift: 0, tourMult: 1,
                    masters: { artist: 0.3, reverts: 0.5, label: 0.2 }, control: { full: 0.8, approval: 0.2, shelve: 0 },
                    gigCut: { chance: 0.2, min: 0.05, max: 0.10 }, merchCut: { chance: 0.2, min: 0.05, max: 0.10 },
                    recoup: { recording: 0.5, promo: 0.3, tour: 0.3 }, penalty: { fine: 0.5, royalty: 0.3, extend: 0.2 },
                    renewal: 0.3, buyout: { mult: 1.2, flatShare: 0.1 }, dropsYou: true, awardsBoost: 0, bigShowMult: 1 },
      corporate:  { royaltyShift: -0.02, advanceMult: 1.3, reachMult: 1.3, deadlineShift: 0, recordsShift: 1, promoShift: 0, tourMult: 1,
                    masters: { artist: 0, reverts: 0.1, label: 0.9 }, control: { full: 0.3, approval: 0.5, shelve: 0.2 },
                    gigCut: { chance: 0.5, min: 0.05, max: 0.15 }, merchCut: { chance: 0.5, min: 0.05, max: 0.15 },
                    recoup: { recording: 1, promo: 0.8, tour: 0.8 }, penalty: { fine: 0.2, royalty: 0.2, extend: 0.6 },
                    renewal: 0.7, buyout: { mult: 2, flatShare: 0.5 }, dropsYou: true, awardsBoost: 0.03, bigShowMult: 2 },
      predatory:  { royaltyShift: 0, advanceMult: 1.0, reachMult: 1.0, deadlineShift: 0, recordsShift: 0, promoShift: 0, tourMult: 0,
                    masters: { artist: 0, reverts: 0, label: 1 }, control: { full: 0, approval: 0.3, shelve: 0.7 },
                    gigCut: { chance: 1, min: 0.20, max: 0.30 }, merchCut: { chance: 1, min: 0.20, max: 0.30 },
                    recoup: { recording: 1, promo: 1, tour: 1 }, penalty: { fine: 0, royalty: 0.3, extend: 0.7 },
                    renewal: 1, buyout: { mult: 3, flatShare: 1 }, dropsYou: false, awardsBoost: 0, bigShowMult: 1 }
    },
    promoLadder: [null, 'playlist', 'radio', 'video'], // free promo pushes, smallest first (personality promoShift moves along it)
    qualityBar: { indie: 65, mid: 60, major: 70, shark: 50 }, // a label with approval rejects records under this average quality
    revertWeeks: { min: 104, max: 260 }, // masters that come back to you: this long after the deal ends (2 to 5 years)
    shelveWeeks: { min: 2, max: 8 },  // a label that shelves holds a record this long...
    shelveChance: 0.5,                // ...this often
    penaltyAmounts: { fineShare: 0.15, fineMin: 2000, royalty: 0.03, royaltyFloor: 0.02, extend: 1 }, // fine: 15% of the advance
    renewalRecords: { min: 1, max: 2 }, // a renewal option adds this many records...
    renewalMinQuality: 60,            // ...if your last record's average quality was this or better
    strikesToDrop: 2,                 // Missed deadlines plus flops: this many and the label can drop you
    flopQuality: { indie: 45, mid: 50, major: 55, shark: 0 }, // a record under this average quality counts as a flop
    dropReputation: -5,               // Getting dropped costs this much reputation...
    dropBuzz: -15,                    // ...and this much buzz everywhere you have fans
    reminderWeeks: [4, 1],            // Inbox reminders this many weeks before a deadline
    roundTo: 500,                     // Advances, tour support, and buyouts are rounded to this many dollars
    // Counter-offers: one per offer, up to maxAsks things. Chance they agree = base - each ask's cost + leverage.
    counter: {
      maxAsks: 2, base: 0.70, replyDays: 1, keepOpenDays: 2, minChance: 0.05, maxChance: 0.90,
      asks: {                         // what each ask changes, and how much it lowers the chance
        advance:  { amount: 0.25, cost: 0.15 },   // +25% advance
        royalty:  { amount: 0.05, cost: 0.25 },   // +5 royalty points
        records:  { amount: 1,    cost: 0.20 },   // one record fewer (never under 1)
        deadline: { amount: 6,    cost: 0.10 },   // +6 weeks per record
        masters:  { cost: 0.25 },                 // masters one step better for you (label → reverts → yours)
        no360:    { cost: 0.20 }                  // no cut of shows or merch
      },
      perOtherOffer: 0.15,            // +15% for each other open label offer (a bidding war)
      fameDivisor: 200,               // +(reputation - the tier's minimum) / 200
      buzzDivisor: 400                // +your average buzz / 400
    },
    // The estimate on the contract: what a typical record makes (fans x this x tracks x weeks), and tracks per record.
    estimate: { perFanPerSongWeek: 0.006, tracks: { ep: 4, album: 10 }, writeBlocksPerWeek: 4, trapTerms: 4 }, // 4+ harsh terms: the verdict drops a step // ...and Write blocks a typical week has room for
    // Rivals sign too (scene dice): each Monday, each rival without a label signs with this chance once they qualify.
    rivalSignChance: 0.05,
    // What deals open (once open, they stay open). Without the right label, they open later:
    nationalWithoutLabel: 75,         // National cities: a mid-size or major label, or reputation 75 (and a manager)
    bigShowsWithout: { reputation: 95, fans: 60000 },  // Arenas: a major, or a smaller label with a Top 10 record,
                                     // or reputation 90 and 250,000 fans without
    legacyRecoupShare: 0.8,          // Older saves' Northbound deal: 80% of streaming paid the advance back
    // How the label feels about you (0 to 100). Loving you strengthens its reach; cold, it weakens and stops paying for
    // promo pushes.
    mood: { start: 60, max: 100, love: 75, warm: 50, cold: 30, loveReach: 1.2, coldReach: 0.7 },
    // Requests between records (one open at a time). Answering yes and delivering wins the label over; yes and missing
    // (or no, or not answering) cools it.
    requests: {
      weeklyChance: 0.35,            // Each Monday, the chance the label sends a "single first" request (when it fits)
      expiryDays: 5,                 // Answer a request within this many days (not answering counts as no)
      singleFirst: { minWeeksToDue: 8, recentSingleDays: 42, windowDays: 28, met: 15, missed: -15, no: -5, pushBonus: 0.5 },
      anr: { below: 70, plus: 5, met: 15, missed: -15, no: -5 }, // after a record under quality 70: the next one should
                                     // average 5 more than this one (and never ask for more than 95)
      anrMax: 95,
      party: { cost: { indie: 500, mid: 2000, major: 8000, shark: 2000 }, energy: 20, buzz: 8, morale: 5, mood: 5, skip: -3, expiryDays: 2 }
    }
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
    winReputation: 5,                // Each win: +5 reputation
    topTenBonus: 0.10,               // A song or record that reached the Top 10 this year: +10% win chance
    nominees: 5,                     // Each category has up to 5 nominees (you, rivals, and other big bands)
    strengthPower: 3,                // The winner is picked by strength (the win chance above) cubed, so the best
                                     // nominee usually wins but not always
    sceneBreakoutShare: 0.5          // Other bands' "new fans this year" for Breakout Act: half their fans
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
    recordStoreMultiplier: 2,        // Hollow Records in-store: merch sells at double the rate
    // Tour shirts (in the Shop while a tour is coming up): sold on that tour's shows at a higher price, and fans are
    // more likely to buy one. Leftovers after the tour sell for less at any gig. One tour's shirts at a time.
    tourShirt: { packSize: 25, packCost: 250, tourPrice: 30, buyBoost: 1.5, leftoverPrice: 10 },
    // Order sizes in the Shop, in packs (the same price per item at any size): T-shirts $200 to $10,000, CDs $150 to
    // $10,500, tour shirts $250 to $10,000, so you can stock up before a tour in one go.
    orderPacks: { shirts: [1, 5, 10, 25, 50], cds: [1, 4, 10, 30, 70], tourShirts: [1, 4, 10, 20, 40] }
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
    payPerFan: 0.02,                 // Session credits: dollars per fan of the other band, per week (see sessionWork)
    // Each released song's streams a week = total fans x streamsPerFan x (recording quality / 100) x freshness x boosts.
    streamsPerFan: 3.6,              // (tuned so streaming money stays about where it was before streams were counted)
    payPerStream: 0.004,             // Dollars per stream (before the label's cut)
    freshnessStart: 1,               // A new release starts at full freshness
    freshnessDropPerWeek: 0.03,      // Freshness drops 3% a week after release (x 0.97 each week)
    freshnessMin: 0.3,               // Freshness never drops below this
    historyWeeks: 26,                // Weeks of stream history each song keeps (for its trend line and release page)
    // Boosts (they multiply together, up to maxBoost):
    buzzBoostMax: 0.25,              // Buzz: up to +25% at full buzz (your average buzz where you have fans)
    chartBoostMin: 0.02,             // Chart: last week's spot adds +2% at the bottom of the chart...
    chartBoostMax: 0.30,             // ...up to +30% at #1
    livePerShow: 0.05,               // Live: +5% for each show that week where the song was in the set...
    liveMax: 0.30,                   // ...up to +30%
    viralChance: 0.01,               // Viral: each Sunday, each released song of quality 50+ has a 1% chance...
    viralMinQuality: 50,
    viralCurve: [4, 3, 2, 1.5],      // ...of streams x4 that week, then x3, x2, x1.5
    maxBoost: 8,                     // All boosts together never multiply streams by more than this
    // Release-week promo pushes (one per release, picked on the release form): cost, boost in the first week, and how
    // many weeks it takes to fade to nothing.
    promos: {
      playlist: { cost: 500,  boost: 0.5, weeks: 4 },
      radio:    { cost: 1500, boost: 1.0, weeks: 6 },
      video:    { cost: 4000, boost: 1.5, weeks: 8 }
    },
    // Records: a release's total streams for Gold and Platinum (a single goes by its song; EPs and albums add up tracks).
    records: {
      song:  { gold: 1000000, platinum: 5000000 },
      album: { gold: 5000000, platinum: 25000000 }
    }
  },

  // The charts: a Top 40 singles chart and a Top 20 albums chart, updated every Sunday. Other acts' songs and albums
  // are made up; yours join when their week's streams are high enough.
  charts: {
    singlesSize: 40,
    albumsSize: 20,
    topTen: 10,                      // "Top 10" moments
    singleTop: 1200000,              // About how many streams the #1 single gets in a week
    albumTop: 10000000,              // About how many streams the #1 album gets in a week
    bottomShare: 0.06,               // The last chart spot gets about 6% of #1's streams
    poolExtra: 15,                   // Other acts kept just below the chart, ready to climb
    seedWobble: 0.15,                // Starting streams vary up to 15% either way
    drift: { min: 0.80, max: 1.06 }, // Each week, other acts' streams change by this much (mostly falling)
    newSingles: 4,                   // New songs by other acts arriving each week...
    newAlbums: 2,                    // ...and new albums
    newMin: 0.03,                    // A new arrival starts between 3% and 60% of #1's streams (usually low)
    newMax: 0.60,
    topWobble: 0.10,                 // #1's streams vary up to 10% either way from week to week
    artistWobble: 3                  // Other acts' songs go to bands by size (the biggest bands get the biggest hits),
                                     // give or take this many places down the list of bands
  },

  // ---------------------------------------------------------------
  // The music scene: 50 other bands (names in js/content/scene.js), 3 of them your rivals. They fill venue
  // calendars, chart, release music, and compete for awards. See Game.rules.scene.
  // ---------------------------------------------------------------
  scene: {
    seedOffset: 7919,                // The scene gets its own dice, started from the career's seed plus this
    // The pyramid of other bands by size (the sizes match venue tiers). Rivals come on top of these 47.
    sizes: [
      { tier: 1, count: 24, minRep: 10, maxRep: 29 },   // Small-room bands
      { tier: 2, count: 14, minRep: 30, maxRep: 59 },   // Club bands
      { tier: 3, count: 7,  minRep: 60, maxRep: 84 },   // Theater bands
      { tier: 4, count: 2,  minRep: 85, maxRep: 100 }   // Arena bands
    ],
    // Fans follow reputation: about 10 ^ (1.6 + 0.047 x reputation), so ~120 fans at 10, ~1,000 at 30, ~25,000 at 60,
    // ~400,000 at 85, give or take (logSpread)
    fans: { logBase: 1.6, logPerRep: 0.047, logSpread: 0.25 },
    skills: { base: 15, perRep: 0.7, spread: 8 },   // Their skills: 15 + 0.7 x reputation, give or take 8
    members: { min: 3, max: 5 },
    homeWeights: { hometown: 8, near: 3, mid: 3, far: 3, national: 4 }, // How likely a band is to come from each kind of city
                                     // (at home; bands abroad are the local bands below)
    localSizes: [{ tier: 2, count: 2 }, { tier: 3, count: 1 }], // Each foreign country's local bands, by size
    localSeedOffset: 104729,         // Local bands abroad get their own dice too (so older saves can add them)
    touringRep: 60,                  // Bands this big play in any city (smaller ones mostly play at home)
    drift: { rep: 1, fanShare: 0.03 }, // Each Monday, other bands' reputation moves up to 1 point and fans up to 3%
    // The 3 rivals: they start near you and keep moving toward your level (behind / even / ahead)
    rivals: {
      count: 3,
      repOffsets: [-6, 0, 6],        // Reputation they aim for, compared with yours
      fanShares: [0.7, 1.0, 1.4],    // Fans they aim for, compared with yours
      pull: 0.3,                     // Each Monday they close 30% of the gap to where they're aiming
      wobble: 2                      // ...give or take 2 reputation
    },
    // Venue calendars: the chance a venue has another band's show on each night (Monday first), by tier
    showChance: {
      1: [0.15, 0.20, 0.25, 0.30, 0.50, 0.55, 0.20],
      2: [0.10, 0.15, 0.20, 0.30, 0.50, 0.55, 0.15],
      3: [0.05, 0.05, 0.10, 0.20, 0.45, 0.50, 0.10],
      4: [0.00, 0.00, 0.05, 0.10, 0.30, 0.35, 0.05]
    },
    gapDays: 2,                      // A band plays at most once every 2 days
    playWeights: { home: 4, touring: 2, away: 0.3, upTier: 0.3 }, // Who headlines: home bands first, touring bands
                                     // anywhere, others rarely; a band one size up sometimes plays a smaller room
    openerChance: { 2: 0.5, 3: 0.8, 4: 1 }, // Clubs and bigger: the chance of an opener (a band one size down)
    flyerShows: 3,                   // Each venue flyer on the Book screen lists this many coming shows
    // Seeing a show (a ticket costs the venue tier's ticket price)
    show: { energy: 10, networking: 3, musicianship: 0.5, performance: 0.5, morale: 2, meetBonusPerTier: 0.05 },
    stealChance: 0.2,                // Each night, a rival may grab an opening slot you haven't answered
    // Rivals' releases
    releases: {
      everyDays: { min: 90, max: 180 }, // Each rival puts out an EP or album every 3 to 6 months
      sameWeekChance: 0.35,          // When you release an EP or album, the chance a rival drops one that week too
      minRep: 10,                    // Rivals start releasing once they reach small rooms
      albumShare: 0.5,               // Half their releases are albums, half EPs
      tracks: { ep: 4, album: 10 },
      charting: 2,                   // Only each rival's 2 newest records still stream enough to chart (older ones drop off)
      qualitySpread: 8,              // Quality: their skills' average, give or take 8...
      minQuality: 30, maxQuality: 95 // ...kept between 30 and 95
    }
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
    roles: ['guitar', 'bass', 'drums', 'keys', 'vocals'], // Slots a person can fill in a band (one of each, you included)
    openRoleWeight: 3,               // People you meet are 3 times as likely to play a role your band still needs
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
    portraitStep: 5,                 // Each new person's portrait is this many places along the list from the last one
                                     // (so faces don't come in order), skipping any face someone you know already has
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
    // Road mood: each night on the road, bandmates' satisfaction changes by trait. Party Animals love it (every night);
    // Easygoing ones miss home from their 4th night away; everyone else gets road-weary from the 8th.
    roadMood: { partyAnimal: 2, easygoing: -2, easygoingFromNight: 4, others: -1, othersFromNight: 8 },
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
    reputationQualityDivisor: 20,    // A release adds avg recording quality / 20 reputation
    nameMaxLength: 40                // Longest EP or album name you can type (optional: blank uses the first track's name)
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
      foundryHall: 450, ironridgeCivic: 2600, steelworksArena: 22000,
      theSandbar: 400, marlowPavilion: 2400, baysideAmphitheater: 20000,
      ivyRoom: 500, duskfieldGrand: 3000, capitolCenter: 25000,
      crescentClub: 450, crescentTheater: 2800, crescentArena: 22000,
      theKingsway: 400, royalTheater: 2500, kingsportColiseum: 20000,
      // International (locked for now)
      lindenCellar: 500, lindenbergHall: 3000, lindenbergArena: 25000,
      clubSolana: 450, teatroAurelia: 2800, aureliaStadium: 30000,
      blueDoor: 400, valmoraOpera: 3000, valmoraFestival: 30000,
      klubbNord: 450, askerholmKonserthus: 2800, iceCellar: 400, frostvikOpera: 2400,
      salaLiora: 450, teatroDelSol: 2600, laOla: 400, ventamarColiseo: 2800,
      ilCortile: 400, teatroCastellune: 2600, laCantina: 400, bellarosaHall: 2400,
      clubHikari: 550, akarumiHall: 3400, akarumiDome: 35000, studioTsuki: 450, tsukiyamaTheater: 2800,
      hoshiroLiveHouse: 500, hoshiroCivicHall: 3000,
      reefClub: 450, kiaraOpera: 3000, kestaraStadium: 28000, theGorge: 400, sundaraTheater: 2600,
      outbackHall: 400, vellmorePavilion: 2400
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
      ironridge: 350000, marlowBay: 300000, duskfield: 450000,
      // International (capitals 800,000)
      lindenberg: 800000, askerholm: 450000, frostvik: 300000,               // Nordhavia
      portAurelia: 800000, santaLiora: 500000, ventamar: 400000,             // Solvara
      valmora: 800000, castellune: 500000, bellarosa: 350000,                // Veronesse
      akarumi: 800000, tsukiyama: 600000, hoshiro: 550000,                   // Kaigara
      portKiara: 800000, sundaraFalls: 400000, vellmore: 300000              // Kestara
    },
    // International cities open after you finish a tour that played at least this many National cities
    internationalMinNationalCities: 2
  },

  tours: {
    minShows: 3,                     // A tour is 3+ out-of-town shows...
    withinDays: 10,                  // ...within 10 days
    // Word of mouth on tour: tour shows win 50% more new fans, and give buzz to the next city on the route.
    fanBonus: 0.5,
    fanBonusByRegion: { national: 1.0, international: 1.25 }, // ...and more far from home: +100% in National cities, +125% abroad
    nextCityBuzz: 10,
    // Any out-of-town show gives a little buzz to the other cities in the same region (Near, Mid, Far...).
    regionBuzz: 3
  },

  // ---------------------------------------------------------------
  // Fans, buzz, and crowd size
  // ---------------------------------------------------------------
  fans: {
    fadeAfterDays: 30,               // No show or release in a city this long...
    fadePerWeek: 0.02,               // ...costs 2% of that city's fans per week
    // Fan clubs: once you have this share of a city's most possible fans, a fan club forms there. It grows the city's
    // fans by this much each Sunday (still under the city's most), and that city's fans stop fading.
    club: { share: 0.10, weekly: 0.02 }
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
    // Setlist strategy (Game.rules.setlist): a song's strength is (quality + tightness) / 2.
    setlist: {
      strongCount: 2,                // "Strong" = the set's 2 strongest songs, "weak" = its 2 weakest (1 each in short sets)
      weakFromSetSize: 4,            // Weak openers and closers only count against you in sets of 4 or more songs
      opener: { strong: 3, weak: -2 }, // Opening with a strong song / a weak one
      closer: { strong: 3, weak: -2 }, // Closing with a strong song / a weak one
      favorite: 1,                   // Each crowd favorite (a song that charted, or is going viral)...
      favoritesMax: 2,               // ...up to +2
      knowTheWords: { share: 0.25, bonus: 1 }, // +1 more for favorites where you have 25%+ of the city's fan ceiling
      // The encore (picked ahead of time): after a Great or Legendary night, more new fans and a little buzz
      encore: { fans: 0.15, favoriteFans: 0.30, buzz: 3 }
    },
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
    arenaReputation: 85,
    arenaFans: 60000                 // (lowered from 100,000 so arenas are reachable in a normal career)
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
    version: 27,                     // Save format version, bumped when the state shape changes
    storageKey: 'bandRise.save'      // The name the save is stored under in the browser
  },

  // ---------------------------------------------------------------
  // Random events (see js/content/events.js for each event's own numbers)
  // ---------------------------------------------------------------
  events: {
    dailyChance: 0.28,               // (Starting out) chance each morning that something happens (about one every 3.5 days)
    defaultCooldownDays: 10,         // The same event won't happen again for at least this many days (stages set their own)
    firstOvertimeWeek: 1,            // The overtime offer is guaranteed on this week's Friday
    // Career stages (by reputation): which events can happen, how often, how long before one repeats, and how much
    // money is at stake (an event's dollar amounts are its base x moneyScale, rounded to roundTo).
    stages: {
      starting: { name: 'Starting out', minReputation: 0,  dailyChance: 0.28, cooldownDays: 45,  moneyScale: 1,   roundTo: 5 },
      local:    { name: 'Local act',    minReputation: 20, dailyChance: 0.24, cooldownDays: 90,  moneyScale: 4,   roundTo: 10 },
      touring:  { name: 'Touring act',  minReputation: 50, dailyChance: 0.20, cooldownDays: 120, moneyScale: 25,  roundTo: 100 },
      star:     { name: 'Star',         minReputation: 80, dailyChance: 0.18, cooldownDays: 150, moneyScale: 100, roundTo: 500 }
    },
    stageOrder: ['starting', 'local', 'touring', 'star'],
    streamsFloor: 0.2,               // Temporary stream dips never cut streams below 20% of normal
    // An event never costs more than this share of the cash you have (so a famous but broke act isn't sunk by one
    // star-sized bill), except that a bill up to costFloor is always paid in full (the small beginner events).
    maxCashShare: 0.25,
    costFloor: 300,
    awardsBoostDays: 365,            // An awards boost from an event lasts this long

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
    lateNight:     { weight: 3, minMembers: 2, morale: 8, relationship: 4, energy: -15 },

    // ----- Bigger events (cash amounts are base dollars: x the stage's moneyScale) -----
    // Local act
    radioInterview: { weight: 3, energy: -15, buzz: 6, fans: 0.02 },
    weddingGig:     { weight: 3, pay: 100, energy: -25, morale: -3 },
    venueFavor:     { weight: 3, reputation: 1, buzz: 4, energy: -20 },
    heckler:        { weight: 2, chance: 0.6, winBuzz: 6, winReputation: 1, loseReputation: -1, loseMorale: -5, slideMorale: -2 },
    localPaper:     { weight: 3, buzz: 5, fans: 0.01, energy: -10 },
    shadyPromoter:  { weight: 2, deposit: 75, chance: 0.5, payout: 250, winBuzz: 5, loseMorale: -5 },
    musicVideo:     { weight: 3, cost: 50, streams: 0.2, weeks: 4, buzz: 3 },
    coverViral:     { weight: 2, chance: 0.4, energy: -15, winFans: 0.05, winBuzz: 8, loseBuzz: 3, leaveBuzz: 2 },
    sponsorLocal:   { weight: 2, pay: 150, buzz: 2, reputation: -1 },
    workshop:       { weight: 2, pay: 75, energy: -20, morale: 3 },
    contestJudge:   { weight: 2, pay: 50, energy: -10, reputation: 1 },
    // Touring act
    lostLuggage:    { weight: 4, rent: 60, gigScore: -5, days: 4 },
    busBreakdown:   { weight: 4, rent: 100, dailyEnergy: -10, days: 5, morale: -5 },
    soreThroat:     { weight: 4, restGigScore: -3, restDays: 2, chance: 0.65, badGigScore: -12, badDays: 7 },
    syncLicense:    { weight: 3, pay: 400, streams: 0.4, weeks: 4, passMorale: 3 },
    podcast:        { weight: 3, energy: -10, chance: 0.55, winFans: 0.04, winBuzz: 6, loseReputation: -2, loseMorale: -5 },
    merchKnockoff:  { weight: 3, security: 40, ignoreMorale: -3 },
    promoterSkips:  { weight: 3, legal: 40, chance: 0.5, payout: 160, letGoMorale: -5 },
    supportLegend:  { weight: 2, energy: -20, buzz: 10, fans: 0.03, reputation: 2 },
    poached:        { weight: 2, match: 60, matchSatisfaction: 10, chance: 0.5, staySatisfaction: 5 },
    festivalSwap:   { weight: 3, energy: -15, buzz: 6, fans: 0.02 },
    radioAdd:       { weight: 3, energy: -25, streams: 0.3, weeks: 3, buzz: 5, quietStreams: 0.1 },
    tourInjury:     { weight: 3, session: 30, gigScore: -6, days: 5 },
    labelPush:      { weight: 3, cost: 80, mood: 10, streams: 0.25, weeks: 4, passMood: -3 },
    viralClip:      { weight: 3, energy: -10, buzz: 10, fans: 0.03, enjoyBuzz: 4 },
    charityGig:     { weight: 2, energy: -20, reputation: 2, morale: 5 },
    visaTrouble:    { weight: 3, expedite: 50, dailyEnergy: -8, days: 3, morale: -5 },
    hotelDamage:    { weight: 2, pay: 40, satisfaction: -10 },
    // Star
    stadiumCharity: { weight: 2, energy: -25, reputation: 2, fans: 0.02, morale: 5, donate: 100, donateReputation: 1 },
    tvSpot:         { weight: 2, energy: -20, chance: 0.7, winFans: 0.08, winBuzz: 15, winStreams: 0.5, weeks: 4, loseReputation: -3 },
    taxAudit:       { weight: 2, accountants: 80, chance: 0.6, penalty: 300 },
    superstarCollab:{ weight: 2, energy: -20, pay: 100, streams: 0.4, weeks: 6, fans: 0.05 },
    burnout:        { weight: 3, restEnergy: 10, restDays: 14, restBuzz: -5, chance: 0.6, badMorale: -20, badGigScore: -8, badDays: 14 },
    awardCampaign:  { weight: 2, cost: 150, boost: 0.10 },
    leakedDemo:     { weight: 2, chance: 0.5, winStreams: 0.6, weeks: 4, winBuzz: 10, loseReputation: -2, loseMood: -10 },
    magazineCover:  { weight: 3, energy: -10, boost: 0.05, buzz: 8 },
    privateGig:     { weight: 2, pay: 500, reputation: -2, energy: -20 },
    signatureGuitar:{ weight: 2, pay: 200, reputation: -1 },
    breakupRumor:   { weight: 2, denyEnergy: -5, denyBuzz: 3, chance: 0.5, winBuzz: 12, loseSatisfaction: -8 },
    // Stories (a first step, then a follow-up some days later)
    brandDeal:      { weight: 2, pay: 300, followDays: 21, adEnergy: -10, chance: 0.6, winFans: 0.05, winBuzz: 8, loseReputation: -3, loseMorale: -8,
                      quietChance: 0.6, quietBuzz: 3, quietReputation: -2 },
    sampleLawsuit:  { weight: 2, settle: 120, lawyers: 40, followDays: 14, chance: 0.55, winPay: 100, winReputation: 1, losePay: 250, stepsSettle: 160 },
    rivalFeud:      { weight: 2, energy: -15, chance: 0.5, winBuzz: 10, winFans: 0.03, loseReputation: -2, loseMorale: -5, peaceReputation: 1,
                      ignoreMorale: -2, followDays: 10, jointBuzz: 6, jointFans: 0.02, jointEnergy: -15 },
    documentary:    { weight: 2, energy: -10, filmEnergy: -3, filmDays: 14, followDays: 42, chance: 0.65, winBoost: 0.10, winFans: 0.05, winBuzz: 10,
                      loseReputation: -3, loseMorale: -10, quietFans: 0.02, quietReputation: -2 },
    soloOffer:      { weight: 2, support: 15, stay: -15, followDays: 30, plugEnergy: -5, plugBuzz: 4, plugSatisfaction: 10, focusSatisfaction: -5 },
    tabloid:        { weight: 2, chance: 0.5, winBuzz: 5, loseReputation: -3, sue: 100, followDays: 21, quietReputation: -1,
                      verdictChance: 0.5, verdictPay: 300, verdictReputation: 2, verdictLoss: 150 }
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
  // Old records (dropped so the saved game doesn't keep growing)
  // ---------------------------------------------------------------
  history: {
    keepDays: 92                     // Read, finished Inbox messages and answered booking emails older than this are dropped each night
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
    upcomingShows: 3,                // Today's "Coming up" panel lists this many booked shows
    ledSegments: 10,                 // How many little lights the top bar's Energy and Morale meters have
    streamChartWeeks: 12,            // A release page's week-by-week chart always has room for at least this many bars
    tipBubbleMs: 3500,               // Phone: how long a tap-to-explain hint bubble stays up (milliseconds)
    noticeToastMs: 4000,             // Phone: how long a pop-up copy of an out-of-sight message stays up (milliseconds)
    signingConfetti: 48,             // Confetti pieces when you sign a record deal
    signingInkPerLetter: 260,        // How much pen line each letter of your signature takes to draw (bigger = slower to finish)
    guideScrollGap: 12,              // Phone: space left above a Guide section when the page jumps to it (pixels)
    swipeMinPx: 50,                  // Phone: how far a finger moves sideways to count as a swipe
    holdToDragMs: 300,               // Phone: how long to press a setlist song before it can be dragged
    holdSlopPx: 10                   // Phone: moving more than this before the hold finishes means you're scrolling
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
