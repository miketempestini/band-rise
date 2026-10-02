// state.js
// Builds a brand-new game state: one plain object that holds everything about a player's game.
// Saving the game later just means storing this object in the browser.
// The shape follows "Saved game state" in Design.md. Starting numbers come from balance.js.
//
// This file only builds the starting state. It has no game rules.
// (For example, the +3 bonus from the starting instrument is added later by the New career rule.)

window.Game = window.Game || {};

Game.state = {

  // Returns a fresh state for a new career.
  // seed: optional whole number for the random generator. Leave it out to get a random one.
  createNew: function (seed) {
    var b = Game.balance;
    if (seed === undefined) {
      seed = Game.rng.newSeed();
    }

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
        skills: {
          musicianship: b.skills.start.musicianship,
          performance: b.skills.start.performance,
          songwriting: b.skills.start.songwriting,
          promotion: b.skills.start.promotion,
          networking: b.skills.start.networking
        },
        skillLastUsed: { musicianship: 0, performance: 0, songwriting: 0, promotion: 0, networking: 0 },
        job: {
          status: 'full',                // 'full' | 'part' | 'none'
          standing: b.job.startStanding,
          vacationDaysLeft: b.job.vacationDaysPerYear
        },
        loanOwed: 0,
        housing: 'starter',
        gear: { instrumentTier: 0, homeStudio: false, van: false },
        merchStock: { shirts: 0, cds: 0 },
        badLuckStreak: 0
      },

      band: { name: null, memberIds: [], formedDay: null },
      people: {},      // id: { id, name, role, skill, reliability, ambition, trait, relationship, satisfaction, status, metDay, lastSeenDay }
      songs: {},       // id: { id, title, isCover, progress, quality, tightness, lastPlayedDay, recording, releaseId }
      releases: [],    // { id, type: 'single' | 'ep' | 'album', songIds, day }
      cities: {},      // id: { id, fans, buzz, unlocked, lastActivityDay }
      venues: {},      // id: { id, relationship, bannedUntilDay, pendingRequestId }
      schedule: {},    // day number: { morning: entryId, afternoon: entryId, evening: entryId }
      entries: {},     // id: { id, day, block, type, actionId, venueId, songIds, personIds, deal, status }
      inbox: [],       // { id, day, kind: 'offer' | 'event' | 'reply' | 'info', templateId, data, expiresDay, resolved }
      milestones: {},  // milestoneId: day reached
      ledger: [],      // one entry per week: { week, income: {...}, costs: {...} }
      stats: { gigsPlayed: 0, bestResult: null, biggestCrowd: 0, totalEarned: 0 }
    };
  }
};
