// state.js
// Builds a brand-new game state: one plain object that holds everything about a player's game.
// Saving the game later just means storing this object in the browser.
// The shape follows "Saved game state" in Design.md. Starting numbers come from balance.js.
//
// This file only builds the starting state. It has no game rules.
// (The +3 bonus from the starting instrument is added by Game.rules.career.startCareer.)

window.Game = window.Game || {};

Game.state = {

  // Returns a fresh state for a new career.
  // seed: optional whole number for the random generator. Leave it out to get a random one.
  createNew: function (seed) {
    var b = Game.balance;
    if (seed === undefined) {
      seed = Game.rng.newSeed();
    }

    var skills = {
      musicianship: b.skills.start.musicianship,
      performance: b.skills.start.performance,
      songwriting: b.skills.start.songwriting,
      promotion: b.skills.start.promotion,
      networking: b.skills.start.networking
    };

    return {
      version: b.save.version,
      seed: seed,          // The starting seed, kept for reference
      rngState: seed,      // The random generator's current position (updated as the game rolls dice)
      day: 0,              // 0 = Monday of week 1

      player: {
        name: '',
        instrument: 'guitar',            // 'guitar' | 'keys' | 'bass'
        cash: b.economy.startCash,
        energy: b.energy.start,
        morale: b.morale.start,
        reputation: b.reputation.start,
        skills: skills,
        skillLastUsed: { musicianship: 0, performance: 0, songwriting: 0, promotion: 0, networking: 0 },
        job: {
          status: 'full',                // 'full' | 'part' | 'none'
          standing: b.job.startStanding,
          vacationDaysLeft: b.job.vacationDaysPerYear,
          unpaidShifts: 0                // Shifts worked since the last payday
        },
        loanOwed: 0,                     // Total debt owed to Mom and Dad
        debtWeeksOverLimit: 0,           // Sundays in a row with debt above the game-over line
        burnedOut: false,                // true while Burned out (morale fell below 15, until back above 25)
        housing: 'starter',
        gear: { instrumentTier: 0, homeStudio: false, van: false },
        merchStock: { shirts: 0, cds: 0 },
        badLuckStreak: 0
      },

      band: { name: null, memberIds: [], formedDay: null },
      people: {},      // id: { id, name, role, skill, reliability, ambition, trait, relationship, satisfaction, status, metDay, lastSeenDay }
      songs: {},       // id: { id, title, isCover, progress, quality, tightness, lastPlayedDay, startedDay,
                       //       writtenDay, qualityParts, recording, releaseId }  (covers are added by startCareer)
      nextSongId: 1,   // used to give each new song its own id
      releases: [],    // { id, type: 'single' | 'ep' | 'album', songIds, day }
      cities: Game.state.startingCities(), // id: { id, fans, buzz, unlocked, lastActivityDay }
      venues: {},      // id: { id, relationship, bannedUntilDay, pendingRequestId }
      schedule: {},    // day number: { morning: entryId, afternoon: entryId, evening: entryId }
      entries: {},     // id: { id, day, block, type, actionId, venueId, songIds, personIds, deal, status }
      nextEntryId: 1,  // used to give each new entry its own id
      inbox: [],       // { id, day, kind: 'offer' | 'event' | 'reply' | 'info', templateId, data, expiresDay, resolved }
      milestones: {},  // milestoneId: day reached
      ledger: [],      // one entry per finished week: { week, startCash, endCash, startDebt, endDebt, income, costs, loans, paidBack, shiftsWorked, startSkills, endSkills }
      thisWeek: Game.state.newWeek(b.economy.startCash, 0, skills), // running totals for the week in progress
      lastDayReport: null, // what happened at the last End Day: { day, blocks: [{ block, title, lines }], overnight: [lines] }
      gameOver: null,  // null while playing; { day, message } once the game has ended
      lastGig: null,   // the full result of the most recent gig (for the gig result screen)
      debug: { forceNextGig: null }, // debug panel: 'rough' or 'legendary' forces the next gig's result
      stats: { gigsPlayed: 0, bestResult: null, biggestCrowd: 0, totalEarned: 0 }
    };
  },

  // The cities you start with: just the hometown, with no fans or buzz yet.
  startingCities: function () {
    var cities = {};
    Object.keys(Game.content.cities).forEach(function (id) {
      if (Game.content.cities[id].region === 'hometown') {
        cities[id] = { id: id, fans: 0, buzz: 0, unlocked: true, lastActivityDay: 0 };
      }
    });
    return cities;
  },

  // Returns a fresh, empty tally for a new week.
  // income and costs hold money by category, like { dayJob: 550 } or { bills: 400 }.
  // startSkills is a copy of the skills at the start of the week, so the summary can show what changed.
  newWeek: function (startCash, startDebt, startSkills) {
    return {
      startCash: startCash,
      startDebt: startDebt,
      startSkills: Game.util.clone(startSkills),
      shiftsWorked: 0,
      income: {},
      costs: {},
      loans: 0,        // money borrowed from Mom and Dad this week
      paidBack: 0      // debt paid back this week
    };
  }
};
