// actions.js
// Rules for planning actions in free blocks and doing them at End Day.
//
// A planned action is stored like any other calendar item (see Design.md's data model):
//   state.schedule[day][block] = entryId
//   state.entries[entryId] = { id, day, block, type: 'action', actionId, songId, status: 'planned' }
// songId is only used by actions that need a song (Practice); songIds by actions with a set (open mic)
// or a song list (Rehearse); personId by actions done with someone (Jam, Hang out, Talk).

window.Game = window.Game || {};
Game.rules = Game.rules || {};

Game.rules.actions = {

  // The calendar entry planned for a block today, or null.
  plannedEntry: function (state, block) {
    var today = state.schedule[state.day];
    var entryId = today && today[block];
    return entryId && state.entries[entryId] ? state.entries[entryId] : null;
  },

  // The action planned for a block today, or null.
  plannedActionId: function (state, block) {
    var entry = Game.rules.actions.plannedEntry(state, block);
    return entry ? entry.actionId : null;
  },

  // Why an action can't be done with this much energy and cash, or null if it can.
  affordProblem: function (action, energy, cash) {
    if (energy < action.energyCost) {
      return 'Needs ' + action.energyCost + ' energy (you\'ll have ' + Math.round(energy) + ').';
    }
    if (cash < action.moneyCost) {
      return 'Costs $' + action.moneyCost + ' (you\'ll have $' + Math.round(cash).toLocaleString() + ').';
    }
    return null;
  },

  // Walks through today's three blocks in order and works out the energy and cash before and after each.
  // Used by the Today screen and to check whether an action can be planned.
  // Returns a list of { block, kind: 'job' | 'action' | 'free', actionId, problem,
  //                     energyBefore, energyAfter, cashBefore, cashAfter }.
  dayPlan: function (state) {
    var b = Game.balance;
    var clampEnergy = Game.rules.energy.clamp;
    var energy = state.player.energy;
    var cash = state.player.cash;

    return b.time.blocks.map(function (block) {
      var row = { block: block, kind: 'free', actionId: null, problem: null, energyBefore: energy, cashBefore: cash };

      if (Game.rules.day.isJobBlock(state, block)) {
        row.kind = 'job';
        energy = clampEnergy(energy - b.energy.cost.dayJob);
      } else {
        var entry = Game.rules.actions.plannedEntry(state, block);
        var actionId = entry && entry.actionId;
        var action = actionId && Game.content.actions[actionId];
        if (action) {
          row.kind = 'action';
          row.actionId = actionId;
          row.songId = entry.songId || null;
          row.songIds = entry.songIds || null;
          row.personId = entry.personId || null;
          row.problem = Game.rules.actions.affordProblem(action, energy, cash);
        }
        if (action && !row.problem) {
          energy = clampEnergy(energy - action.energyCost + (action.effects.energy || 0));
          cash -= action.moneyCost;
        } else {
          // Free time (or an action that will be skipped, which also counts as free time).
          energy = clampEnergy(energy + b.time.emptyBlockEnergy);
        }
      }

      row.energyAfter = energy;
      row.cashAfter = cash;
      return row;
    });
  },

  // Everything the action picker needs to show one action for one block.
  // Returns { action, ok, reason, gains: { skills: { name: amount }, energy, morale, buzz }, burnedOutWarning }.
  option: function (state, block, actionId) {
    var action = Game.content.actions[actionId];
    var plan = Game.rules.actions.dayPlan(state);
    var row = plan[Game.balance.time.blocks.indexOf(block)];
    var result = { action: action, ok: true, reason: null, gains: { skills: {} }, burnedOutWarning: false };

    if (row.kind === 'job') {
      result.ok = false;
      result.reason = 'This block is taken by your day job.';
    } else {
      result.reason = Game.rules.actions.affordProblem(action, row.energyBefore, row.cashBefore);
      result.ok = !result.reason;
    }

    // Expected gains, using the energy you'll have at the start of this block.
    var skills = action.effects.skills || {};
    Object.keys(skills).forEach(function (skill) {
      if (state.player.burnedOut && action.noSkillWhenBurnedOut) {
        result.gains.skills[skill] = 0;
        result.burnedOutWarning = true;
      } else {
        result.gains.skills[skill] = Game.rules.skills.gainFor(state, skill, skills[skill], row.energyBefore);
      }
    });
    if (action.effects.energy) result.gains.energy = action.effects.energy;
    if (action.effects.morale) result.gains.morale = action.effects.morale;
    if (action.effects.buzz) result.gains.buzz = Game.rules.audience.promoBuzz(state, action.effects.buzz);
    if (action.effects.tightness) result.gains.tightness = action.effects.tightness;
    if (action.effects.songProgress) result.gains.songProgress = Game.rules.actions.writePreview(state, block);
    if (action.needsSong && !Game.rules.songs.playable(state).length) {
      result.ok = false;
      result.reason = 'You don\'t have any finished songs yet.';
    }
    if (action.setSize && Game.rules.songs.playable(state).length < action.setSize) {
      result.ok = false;
      result.reason = 'You need at least ' + action.setSize + ' finished songs.';
    }
    if (action.onlyOpenMicNight) {
      var venue = Game.rules.gigs.openMicTonight(state);
      if (!venue || block !== Game.balance.time.blocks[Game.balance.time.blocks.length - 1]) {
        result.ok = false;
        result.reason = Game.rules.gigs.openMicSchedule();
      } else {
        result.gains.gig = { venueName: venue.name, crowd: Game.rules.gigs.crowdRange(state, venue) };
      }
    }
    if (action.needsPerson && !Game.rules.actions.peopleFor(state, actionId).length) {
      result.ok = false;
      result.reason = action.needsPerson === 'member'
        ? 'You don\'t have any bandmates yet.'
        : 'You haven\'t met anyone yet. Network or play open mics to meet people.';
    }
    if (action.needsBand && !state.band.memberIds.length) {
      result.ok = false;
      result.reason = 'You need a bandmate first. Meet people, get to know them, then Invite them on the People screen.';
    }
    if (action.songsMax && !Game.rules.songs.playable(state).length) {
      result.ok = false;
      result.reason = 'You don\'t have any finished songs yet.';
    }
    if (action.effects.relationship) result.gains.relationship = action.effects.relationship;
    if (action.effects.talk) result.gains.talk = Game.balance.satisfaction.talkGain;
    if (action.effects.rehearsal) result.gains.rehearsal = Game.balance.songs.tightness.rehearseGain;
    if (action.effects.meet) result.gains.meetChance = Game.rules.people.meetChance(state.player.skills.networking);
    if (action.effects.gig) result.gains.meetChance = Game.balance.people.openMicMeetChance;
    result.tired = Game.rules.energy.isTired(row.energyBefore);
    return result;
  },

  // The people an action can be done with: anyone you know (contacts and members), or members only.
  peopleFor: function (state, actionId) {
    var action = Game.content.actions[actionId];
    var members = Game.rules.people.members(state);
    if (action.needsPerson === 'member') return members;
    return members.concat(Game.rules.people.contacts(state));
  },

  // Why a person can't be picked for an action, or null if they can.
  personProblem: function (state, actionId, personId) {
    var allowed = Game.rules.actions.peopleFor(state, actionId).some(function (p) { return p.id === personId; });
    if (!allowed) return 'Pick someone you know.';
    if (Game.content.actions[actionId].effects.talk) return Game.rules.people.talkProblem(state, personId);
    return null;
  },

  // Why a list of songs for Rehearse isn't allowed (1 to 4 different finished songs), or null.
  songListProblem: function (state, songIds, max) {
    if (!Array.isArray(songIds) || songIds.length < 1 || songIds.length > max) return 'Pick 1 to ' + max + ' songs.';
    var playable = Game.rules.songs.playable(state).map(function (song) { return song.id; });
    for (var i = 0; i < songIds.length; i++) {
      if (playable.indexOf(songIds[i]) === -1) return 'That song can\'t be rehearsed.';
      if (songIds.indexOf(songIds[i]) !== i) return 'Each song only once.';
    }
    return null;
  },

  // The loosest songs, up to max (the suggested list for Rehearse).
  loosestSongs: function (state, max) {
    return Game.rules.songs.sortSongs(state, Game.rules.songs.playable(state), 'tightLow')
      .slice(0, max).map(function (song) { return song.id; });
  },

  // What a Write in this block would do to the song in progress, counting earlier Write blocks today.
  // Returns { title, from, to, added, finishes, isNew }.
  writePreview: function (state, block) {
    var b = Game.balance.songs;
    var blocks = Game.balance.time.blocks;
    var song = Game.rules.songs.inProgress(state);
    var from = song ? song.progress : 0;
    // Earlier Write blocks today add their progress first (a finished song means this one starts fresh).
    for (var i = 0; i < blocks.indexOf(block); i++) {
      if (Game.rules.actions.plannedActionId(state, blocks[i]) === 'write') {
        from += Game.rules.songs.progressPerBlock(state.player.skills.songwriting);
        if (from >= b.progressToFinish) { from = 0; song = null; }
      }
    }
    var added = Game.rules.songs.progressPerBlock(state.player.skills.songwriting);
    var to = Math.min(b.progressToFinish, from + added);
    return {
      title: song ? song.title : 'a new song',
      from: from, to: to, added: added,
      finishes: to >= b.progressToFinish,
      isNew: !song && from === 0
    };
  },

  // The picker's list: every action, with its option details.
  options: function (state, block) {
    return Object.keys(Game.content.actions).map(function (id) {
      return Game.rules.actions.option(state, block, id);
    });
  },

  // Plans an action in one of today's blocks (replacing anything planned there).
  // choice: for Practice, a song id, or 'all' for Practice all songs (left out: the loosest song).
  //         for a gig, a list of song ids for the set (left out: the suggested best set).
  //         for Rehearse, a list of 1 to 4 song ids (left out: the loosest songs).
  //         for Jam, Hang out, or Talk, a person id.
  // If it isn't allowed, the state comes back unchanged with the reason in the log.
  // Returns { state, log }.
  plan: function (state, block, actionId, songChoice) {
    var action = Game.content.actions[actionId];
    var songId = null;
    var songIds = null;
    var personId = null;
    if (!action) {
      return { state: state, log: ['Unknown action.'] };
    }
    if (action.setSize) {
      songIds = Array.isArray(songChoice) ? songChoice.slice() : Game.rules.gigs.suggestSet(state, action.setSize);
      var setProblem = Game.rules.gigs.setProblem(state, songIds, action.setSize);
      if (setProblem) return { state: state, log: [setProblem] };
    }
    if (action.songsMax) {
      songIds = Array.isArray(songChoice) ? songChoice.slice() : Game.rules.actions.loosestSongs(state, action.songsMax);
      var listProblem = Game.rules.actions.songListProblem(state, songIds, action.songsMax);
      if (listProblem) return { state: state, log: [listProblem] };
    }
    if (action.needsPerson) {
      personId = songChoice;
      var personProblem = Game.rules.actions.personProblem(state, actionId, personId);
      if (personProblem) return { state: state, log: [personProblem] };
    }
    if (action.needsSong) {
      songId = songChoice;
      var playable = Game.rules.songs.playable(state);
      if (!songId && playable.length) songId = Game.rules.songs.loosest(state).id;
      var ok = (songId === 'all' && playable.length > 0) || playable.some(function (song) { return song.id === songId; });
      if (!ok) return { state: state, log: ['Pick a finished song to practice.'] };
    }
    // Check it as if the block were empty, so swapping one action for another works.
    var check = Game.rules.actions.option(Game.rules.actions.clear(state, block).state, block, actionId);
    if (!check.ok) {
      return { state: state, log: [check.reason] };
    }

    var s = Game.rules.actions.clear(state, block).state;
    var id = 'e' + s.nextEntryId;
    s.nextEntryId += 1;
    s.entries[id] = { id: id, day: s.day, block: block, type: 'action', actionId: actionId, songId: songId, songIds: songIds, personId: personId, status: 'planned' };
    s.schedule[s.day] = s.schedule[s.day] || {};
    s.schedule[s.day][block] = id;
    return { state: s, log: [] };
  },

  // Sets a block back to Free time. Returns { state, log }.
  clear: function (state, block) {
    var s = Game.util.clone(state);
    var today = s.schedule[s.day];
    if (today && today[block]) {
      delete s.entries[today[block]];
      delete today[block];
    }
    return { state: s, log: [] };
  },

  // Removes a finished day's plan from the calendar (called at End Day).
  clearDay: function (state, day) {
    var s = Game.util.clone(state);
    var plan = s.schedule[day] || {};
    Object.keys(plan).forEach(function (block) { delete s.entries[plan[block]]; });
    delete s.schedule[day];
    return s;
  },

  // Does an action during End Day: pays its costs and applies its effects.
  // If there isn't enough energy or cash by now, it's skipped.
  // songId: the song for actions that need one (Practice). songIds: the set for a gig, or Rehearse's songs.
  // personId: who it's with (Jam, Hang out, Talk).
  // Returns { state, line, notes, skipped, finishedSongId, gig }: line is the one-line result for Day results.
  perform: function (state, actionId, songId, songIds, personId) {
    var util = Game.util;
    var action = Game.content.actions[actionId];
    var s = state;
    var parts = [];
    var notes = [];

    var problem = Game.rules.actions.affordProblem(action, s.player.energy, s.player.cash);
    if (!problem && action.needsPerson) problem = Game.rules.actions.personProblem(s, actionId, personId);
    if (!problem && action.needsBand && !s.band.memberIds.length) problem = 'You don\'t have a band anymore.';
    if (problem) {
      return { state: s, line: 'Skipped ' + action.name + '. ' + problem, notes: [], skipped: true };
    }

    var energyAtStart = s.player.energy;
    var songwritingAtStart = s.player.skills.songwriting;
    var networkingAtStart = s.player.skills.networking;
    var metPeople = [];
    var tired = Game.rules.energy.isTired(energyAtStart);
    var finishedSongId = null;
    var gig = null;

    // Money.
    if (action.moneyCost > 0) {
      s = Game.rules.money.spend(s, action.moneyCost, action.moneyCategory).state;
      parts.push('-$' + action.moneyCost);
    }

    // Energy.
    var energyChange = (action.effects.energy || 0) - action.energyCost;
    s = util.clone(s);
    s.player.energy = Game.rules.energy.clamp(s.player.energy + energyChange);
    parts.push(util.signed(s.player.energy - energyAtStart) + ' energy'); // the real change (Rest can't go past 100)

    // Buzz (worked out before today's Promotion gain).
    if (action.effects.buzz) {
      var buzz = Game.rules.audience.promoBuzz(s, action.effects.buzz);
      s = Game.rules.audience.addBuzz(s, 'hometown', buzz).state;
      parts.push(util.signed(buzz) + ' ' + Game.content.cities.hometown.name + ' buzz');
    }

    // Song tightness (Practice). If the song is gone, the loosest song is used instead.
    if (action.effects.tightness && songId === 'all') {
      var all = Game.rules.songs.practiceAll(s, action.allSongsGain);
      s = all.state;
      parts.push('+' + action.allSongsGain + ' tightness on all ' + all.count + ' songs (fading reset)');
    } else if (action.effects.tightness) {
      if (!s.songs[songId] || s.songs[songId].quality === null) {
        var fallback = Game.rules.songs.loosest(s);
        songId = fallback ? fallback.id : null;
      }
      if (songId) {
        var practiced = Game.rules.songs.practiceSong(s, songId, action.effects.tightness);
        s = practiced.state;
        parts.push(util.signed(practiced.added) + ' tightness on "' + s.songs[songId].title + '" (now ' + Math.round(s.songs[songId].tightness) + ')');
      }
    }

    // A gig (open mic). If the set no longer works, the suggested best set is played instead.
    if (action.effects.gig) {
      var venue = Game.rules.gigs.openMicTonight(s);
      if (Game.rules.gigs.setProblem(s, songIds, action.setSize)) {
        songIds = Game.rules.gigs.suggestSet(s, action.setSize);
      }
      var played = Game.rules.gigs.playGig(s, venue.id, songIds, energyAtStart);
      s = played.state;
      gig = played.gig;
      parts = [played.log[0].replace(/\.$/, '')].concat(parts);
      notes = notes.concat(played.log.slice(1));
      // A 20% chance to meet someone at the open mic.
      var micMeet = Game.rules.people.tryMeet(s, Game.balance.people.openMicMeetChance);
      s = micMeet.state;
      notes = notes.concat(micMeet.log);
      if (micMeet.personId) metPeople.push(micMeet.personId);
    }

    // Time with someone (Jam, Hang out): relationship goes up.
    if (action.effects.relationship) {
      s = Game.rules.people.interact(s, personId, action.effects.relationship).state;
      parts.push(util.signed(action.effects.relationship) + ' relationship with ' + s.people[personId].name +
        ' (now ' + Math.floor(s.people[personId].relationship) + ')');
    }

    // Talk: +15 satisfaction for a bandmate.
    if (action.effects.talk) {
      s = Game.rules.people.talk(s, personId).state;
      parts.push(util.signed(Game.balance.satisfaction.talkGain) + ' satisfaction for ' + s.people[personId].name +
        ' (now ' + Math.round(s.people[personId].satisfaction) + ')');
    }

    // Rehearse: whoever shows up, and tightness on the chosen songs.
    if (action.effects.rehearsal) {
      if (Game.rules.actions.songListProblem(s, songIds, action.songsMax)) {
        songIds = Game.rules.actions.loosestSongs(s, action.songsMax);
      }
      var rehearsal = Game.rules.people.rehearse(s, songIds);
      s = rehearsal.state;
      if (rehearsal.attended.length) parts.push(rehearsal.attended.join(' and ') + ' showed up');
      if (rehearsal.missed.length) parts.push(rehearsal.missed.join(' and ') + ' didn\'t show');
      parts.push(util.signed(rehearsal.gain) + ' tightness on ' + songIds.length + ' song' + (songIds.length === 1 ? '' : 's'));
    }

    // Song progress (Write), using Songwriting from the start of the block.
    if (action.effects.songProgress) {
      var written = Game.rules.songs.write(s, songwritingAtStart);
      s = written.state;
      if (written.finished) {
        finishedSongId = written.songId;
        parts.push('finished your song');
        notes = notes.concat(written.log);
      } else {
        parts.push(util.signed(written.added) + ' progress on your song (now ' + Math.round(written.progress) + '/' + Game.balance.songs.progressToFinish + ')');
      }
    }

    // Skills.
    var skills = action.effects.skills || {};
    Object.keys(skills).forEach(function (skill) {
      var name = Game.content.skills[skill];
      if (s.player.burnedOut && action.noSkillWhenBurnedOut) {
        s = util.clone(s);
        s.player.skillLastUsed[skill] = s.day;
        parts.push('no ' + name + ' (Burned out)');
        return;
      }
      var trained = Game.rules.skills.train(s, skill, skills[skill], energyAtStart);
      s = trained.state;
      parts.push(util.signed(trained.gain) + ' ' + name + (tired ? ' (Tired: half gain)' : ''));
    });

    // Network: a chance to meet someone (30% + Networking / 2, using Networking from the start of the block).
    if (action.effects.meet) {
      var met = Game.rules.people.tryMeet(s, Game.rules.people.meetChance(networkingAtStart));
      s = met.state;
      if (met.personId) metPeople.push(met.personId);
      else parts.push('didn\'t meet anyone new');
      notes = notes.concat(met.log);
    }

    // Morale.
    if (action.effects.morale) {
      var changed = Game.rules.morale.change(s, action.effects.morale);
      s = changed.state;
      parts.push(util.signed(action.effects.morale) + ' morale');
      notes = notes.concat(changed.log);
    }

    return { state: s, line: parts.join(', ') + '.', notes: notes, skipped: false, finishedSongId: finishedSongId, gig: gig, metPeople: metPeople };
  }
};
