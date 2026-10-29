// handbook.js
// Everything Walt (the mentor) explains. Fixed text, never saved.
//   mentor     who Walt is (name, portrait, one line about him)
//   pages(state)  the welcome handbook: short pages shown before the first day of every new career
//   sections()    the Guide (Settings → Guide): every mechanic in the game, readable any time
//
// Each page or section is { id, title, note, body }:
//   note   Walt's handwritten line at the top
//   body   a list of pieces, in order. A string is a paragraph. Objects are:
//            { table: { cols: [...], rows: [[...], ...] } }   a cheat-sheet table
//            { list: ['...', ...] }                            a bulleted list
//            { tip: '...' }                                    Walt's tip in a box
// Text may use <strong>; it's written here, never typed by the player (the player's name is escaped below).
// Every number comes from balance.js, so the handbook stays true when the game's numbers change.

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var b = Game.balance;
  var mentorName = 'Walt Ferris';               // change the mentor's name here (it's used everywhere he appears)
  var mentorFirst = mentorName.split(' ')[0];
  var mc = b.morale.change;
  var ec = b.energy.cost;
  var signed = Game.util.signed;
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var pct = function (x) { return Math.round(x * 100) + '%'; };
  var esc = function (text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var dayName = function (i) { return Game.content.calendar.dayNames[i]; };
  var venueName = function (id) { return Game.content.venues[id].name; };
  var tiers = b.venues.tiers;
  var results = b.gigs.results;
  var weeklyBills = b.housing.starter.weeklyCost;
  var weekPay = b.job.payPerShift * b.job.fullTimeDays.length;
  var openMicNights = dayName(Game.content.venues.rustyNail.openMicDay) + ' (' + venueName('rustyNail') + ') and ' +
    dayName(Game.content.venues.beanThere.openMicDay) + ' (' + venueName('beanThere') + ')';
  // How many Write blocks a song takes at a Songwriting level.
  var writeBlocks = function (songwriting) {
    return Math.ceil(b.songs.progressToFinish / (b.songs.progressBase + songwriting / b.songs.progressSongwritingDivisor));
  };
  // A skill gain at a skill level (the skill formula without morale and energy).
  var gainAt = function (base, skill) { return Math.round(base * (1 - skill / b.skills.growthCap) * 10) / 10; };

  // ----- Pieces both the handbook and the Guide use -----

  var energyTable = { table: { cols: ['What you do', 'Energy'], rows: [
    ['Day job (each block)', '-' + ec.dayJob],
    ['Play a show', '-' + ec.gig],
    ['Practice, Rehearse, Play the open mic', '-' + ec.practice],
    ['Studio session, session work', '-' + ec.studio],
    ['Travel (each block)', '-' + ec.travel],
    ['Write, Network, Hang out, Jam, Talk', '-' + ec.write],
    ['Post online, Hang flyers, email a venue', '-' + ec.promote],
    ['Rest', '+' + b.energy.restGain],
    ['Each block left empty', '+' + b.time.emptyBlockEnergy],
    ['Overnight', '+' + b.energy.overnight + ' (only +' + b.energy.exhaustedOvernight + ' after hitting 0)']
  ] } };

  var moraleUp = { table: { cols: ['Raises morale', 'Change'], rows: [
    ['Rest', signed(mc.rest)],
    ['Hang out with someone', signed(mc.hangOut)],
    ['A full day off (no job, no work)', signed(mc.fullDayOff)],
    ['Finish a song', signed(mc.finishSong)],
    ['A Great show', signed(mc.greatGig)],
    ['A Legendary show', signed(mc.legendaryGig)],
    ['Reach a milestone', signed(mc.milestone)]
  ] } };
  var moraleDown = { table: { cols: ['Lowers morale', 'Change'], rows: [
    ['Each day-job shift', String(mc.dayJobShift)],
    ['A Rough show', String(mc.roughGig)],
    ['Hitting 0 energy (Exhausted)', String(mc.exhausted)],
    ['Cancelling a show', String(mc.cancelGig)],
    ['A bandmate quits', String(mc.bandmateQuits)],
    ['Removing a bandmate', String(mc.removeMember)],
    ['Each day on the road from day ' + b.morale.roadFatigueStartDay, String(b.morale.roadFatiguePerDay)]
  ] } };

  var moraleEffects = 'Morale over ' + b.skills.moraleHighThreshold + ' makes your skills grow ' +
    pct(b.skills.moraleHighMultiplier - 1) + ' faster and adds ' + signed(b.gigs.highMoraleBonus) + ' to every show. Under ' +
    b.skills.moraleLowThreshold + ', skills grow ' + pct(1 - b.skills.moraleLowMultiplier) + ' slower and every show loses ' +
    Math.abs(b.gigs.lowMoralePenalty) + '. Under ' + b.morale.burnedOutThreshold + ' you\'re <strong>Burned out</strong>: Write and ' +
    'Practice stop teaching you anything until morale is back above ' + b.morale.burnedOutRecovery + '.';

  var skillTable = function (state) {
    var cols = ['Skill', 'What it does', 'Grows from'];
    if (state) cols.push('You');
    var grows = {
      musicianship: 'Practice, Rehearse, playing live',
      performance: 'Playing live',
      songwriting: 'Write',
      promotion: 'Post online, Hang flyers, ads, releasing music',
      networking: 'Network, playing live, seeing other bands'
    };
    return { table: { cols: cols, rows: Object.keys(Game.content.skills).map(function (id) {
      var row = [Game.content.skills[id], Game.content.skillDescriptions[id], grows[id]];
      if (state) row.push(String(Math.round(state.player.skills[id])));
      return row;
    }) } };
  };

  var unlockTable = { table: { cols: ['Reputation', 'What opens up'], rows: [
    [String(tiers[1].minReputation), 'Small rooms: email venues from Book. Opening-slot offers start.'],
    [String(b.offers.residency.minReputation), 'Residency offers. Going part-time at the job (with job standing ' + b.job.partTimeMinStanding + '+).'],
    [String(b.geography.nearMinReputation), 'Near cities (day trips).'],
    [String(tiers[2].minReputation), 'Clubs (with ' + b.people.minOnStageForClubs + '+ people on stage).'],
    [String(b.geography.midMinReputation), 'Mid cities (after a Near show), the Pro studio, the Big campaign.'],
    [String(b.milestones.managerReputation), 'A manager (with ' + b.milestones.managerFans.toLocaleString('en-US') + ' fans), and with one, indie label offers. Far cities (with a van).'],
    [String(b.label.tiers.mid.minReputation), 'Mid-size labels can offer (with a manager and ' + b.label.tiers.mid.minFans.toLocaleString('en-US') + ' fans).'],
    [String(tiers[3].minReputation), 'Theaters (with a release).'],
    [String(b.label.tiers.major.minReputation), 'Major labels can offer (with ' + b.label.tiers.major.minFans.toLocaleString('en-US') + ' fans).'],
    [String(tiers[4].minReputation), 'Arena and festival offers (with ' + b.milestones.arenaFans.toLocaleString('en-US') + ' fans and a major label, or a Top 10 record on a smaller one).']
  ] } };

  var scoreTable = { table: { cols: ['Part of the score', 'How much'], rows: [
    ['Band musicianship (yours, plus your bandmates\')', pct(b.gigs.weights.bandMusicianship)],
    ['Your Performance', pct(b.gigs.weights.performance)],
    ['Song quality (the set\'s average)', pct(b.gigs.weights.songQuality)],
    ['Tightness (the set\'s average)', pct(b.gigs.weights.tightness)],
    ['Tired (energy under ' + b.energy.tiredThreshold + ')', String(b.gigs.tiredPenalty)],
    ['Morale', b.gigs.lowMoralePenalty + ' under ' + b.gigs.moraleLowThreshold + ', ' + signed(b.gigs.highMoraleBonus) + ' over ' + b.gigs.moraleHighThreshold],
    ['Running order', signed(b.gigs.setlist.opener.strong) + ' for a strong opener, ' + signed(b.gigs.setlist.closer.strong) + ' for a strong closer'],
    ['A full room (' + pct(b.gigs.fullRoomThreshold) + '+)', signed(b.gigs.fullRoomBonus)],
    ['Bigger rooms expect more', '0 at open mics down to ' + tiers[4].gigScorePenalty + ' at arenas'],
    ['Luck', b.gigs.luckMin + ' to ' + signed(b.gigs.luckMax)]
  ] } };

  var resultTable = { table: { cols: ['Result', 'Score', 'New fans', 'Buzz', 'Reputation', 'Morale'], rows: [
    ['Rough', 'under ' + results.solid.minScore, pct(results.rough.fanConversion), signed(results.rough.buzz), signed(results.rough.reputation), String(mc.roughGig)],
    ['Solid', results.solid.minScore + ' to ' + (results.great.minScore - 1), pct(results.solid.fanConversion) + ' of the crowd', signed(results.solid.buzz), signed(results.solid.reputation), '0'],
    ['Great', results.great.minScore + ' to ' + (results.legendary.minScore - 1), pct(results.great.fanConversion), signed(results.great.buzz), signed(results.great.reputation), signed(mc.greatGig)],
    ['Legendary', results.legendary.minScore + '+', pct(results.legendary.fanConversion), signed(results.legendary.buzz), signed(results.legendary.reputation), signed(mc.legendaryGig)]
  ] } };

  var tightnessText = 'Tightness is how well you know a song, from 0 to 100. A new original starts at ' + b.songs.tightness.newOriginal +
    ', a cover at ' + b.songs.tightness.cover + '. Practice adds ' + b.songs.tightness.practiceGain + ' to one song, playing it at a show adds ' +
    b.songs.tightness.playLiveGain + ', and Rehearse with the band adds ' + b.songs.tightness.rehearseGain + ' to up to ' +
    b.songs.tightness.rehearseMaxSongs + ' songs. A song you haven\'t played or rehearsed for ' + b.songs.tightness.decayAfterDays +
    ' days loses ' + Math.abs(b.songs.tightness.decayPerWeek) + ' a week (never below ' + b.songs.tightness.floor + ').';

  Game.content.handbook = {

    mentor: {
      name: mentorName,
      portrait: 'p02',
      about: 'Played guitar in arenas for fifteen years. Now runs the guitar shop on Main Street in Millbrook.'
    },

    // ----- The welcome handbook (before the first day) -----
    pages: function (state) {
      var p = state.player;
      var first = esc(String(p.name).split(' ')[0] || p.name);
      return [
        {
          id: 'welcome', title: 'Welcome to Millbrook', note: 'Pull up a stool, ' + first + '. Let\'s talk.',
          body: [
            'I\'m ' + mentorName + '. I played guitar in arenas for fifteen years, back when people still held up lighters. These days I run ' +
              'the guitar shop on Main Street and keep an eye on kids with more nerve than sense. Kids like you.',
            'Here\'s where you stand: a day job, a cheap apartment, ' + money(p.cash) + ' in the bank, and ' + b.songs.startingCovers +
              ' covers you can play. The goal is to go from open mics at ' + venueName('rustyNail') + ' to headlining arenas.',
            'You get there by growing two things: <strong>fans</strong> (people who come back to see you) and <strong>reputation</strong> ' +
              '(what the music business thinks of you). Don\'t go broke, and don\'t burn yourself out. I\'ve seen that end more careers than bad songs.',
            'Give me a few minutes and I\'ll show you how it all works. You can skip ahead any time, and everything I tell you is in ' +
              '<strong>Settings → Guide</strong> whenever you want it again.'
          ]
        },
        {
          id: 'day', title: 'How a day works', note: 'Every day is three blocks. Spend them well.',
          body: [
            'Each day has three blocks: <strong>Morning</strong>, <strong>Afternoon</strong>, and <strong>Evening</strong>. On weekdays the day job ' +
              'takes your morning and afternoon, so your evening is the time you get for music. Weekends are wide open.',
            'Pick a free block on the Today screen and choose what to do: Practice, Write, Network, Rest, and more. Each choice shows what ' +
              'it costs (cash and energy) and what it should do for you.',
            'When the plan looks right, press <strong>End Day</strong>. The blocks play out in order, you recover overnight, and the next day ' +
              'starts. The <strong>Previous day</strong> box on Today tells you what happened.',
            { table: { cols: ['When', 'What happens'], rows: [
              ['Weekday mornings and afternoons', 'Day job: ' + money(b.job.payPerShift) + ' a shift, ' + mc.dayJobShift + ' morale a shift'],
              ['Open mic nights', openMicNights + ', in the evening'],
              [dayName(b.time.paydayDayOfWeek) + ' night', 'Payday: ' + money(weekPay) + ' for a full week'],
              [dayName(b.time.billsDayOfWeek) + ' night', 'Rent and living costs: ' + money(weeklyBills) + ', then the weekly summary']
            ] } },
            { tip: 'The Calendar lets you plan days and weeks ahead, so you don\'t have to decide everything the morning of.' }
          ]
        },
        {
          id: 'energy', title: 'Energy: what you can do today', note: 'Tired musicians play tired shows.',
          body: [
            '<strong>Energy</strong> runs from 0 to ' + b.energy.max + '. Almost everything costs some: the day job alone costs ' +
              (ec.dayJob * b.job.jobBlocks.length) + ' a day. You get back ' + b.energy.overnight + ' overnight, ' + b.time.emptyBlockEnergy +
              ' for each block you leave empty, and ' + b.energy.restGain + ' from Rest.',
            'Under ' + b.energy.tiredThreshold + ' you\'re <strong>Tired</strong>: your skills grow half as fast, and a show scores ' +
              Math.abs(b.gigs.tiredPenalty) + ' lower. Hit 0 and you\'re <strong>Exhausted</strong>: you only get ' + b.energy.exhaustedOvernight +
              ' back that night, and you lose ' + Math.abs(mc.exhausted) + ' morale.',
            'You can\'t start something you don\'t have the energy for. The job and booked shows happen anyway, even if they drain you to 0.',
            energyTable,
            { tip: 'A workday plus an evening show costs ' + (ec.dayJob * b.job.jobBlocks.length + ec.gig) + ' energy, and a night\'s sleep gives back ' +
              b.energy.overnight + '. Rest the day before a show that matters.' }
          ]
        },
        {
          id: 'morale', title: 'Morale: how you feel about all this', note: 'I\'ve seen more bands quit from burnout than from bad songs.',
          body: [
            'Energy is about today. <strong>Morale</strong> is about the long haul. It runs from 0 to ' + b.morale.max + ', and you start at ' +
              b.morale.start + '.',
            'Why it matters: ' + moraleEffects,
            'The day job wears you down a little every shift (' + Math.abs(mc.dayJobShift * b.job.fullTimeDays.length) + ' a week). Music, rest, ' +
              'and friends build you back up. Every Sunday your morale also drifts ' + b.morale.weeklyDrift + ' points toward a resting level (' +
              b.housing.starter.moraleRest + ' in your first apartment; nicer homes raise it).',
            moraleUp,
            moraleDown,
            { tip: 'So when Rest says ' + signed(mc.rest) + ' morale, that isn\'t a nice extra. It\'s what keeps your playing improving. A full day off ' +
              'means no job and no work: only Rest, Hang out, or empty blocks.' }
          ]
        },
        {
          id: 'money', title: 'Money: keep the lights on', note: 'Rent is due every Sunday. It doesn\'t care how the gig went.',
          body: [
            'You start with ' + money(b.economy.startCash) + '. The job pays ' + money(weekPay) + ' a week and your bills are ' + money(weeklyBills) +
              ', so you save about ' + money(weekPay - weeklyBills) + ' a week if you spend nothing on music. Every purchase early on is a real choice.',
            'If your cash would drop below zero, Mom and Dad lend you ' + money(b.debt.familyLoanAmount) + ' (as often as it takes). Pay them back ' +
              'from Today when you can. While you owe them you can\'t move to a nicer home, and if you owe more than ' + money(b.debt.gameOverDebt) +
              ' for more than ' + b.debt.gameOverWeeks + ' Sundays in a row, the game is over.',
            'Music money starts small and grows: the open mic tip jar, then your share of the door at small rooms, then T-shirts, then streaming ' +
              'once you release music. The <strong>Finances</strong> tab shows where every dollar went.',
            { table: { cols: ['Money in', 'How much'], rows: [
              ['Day job (paid ' + dayName(b.time.paydayDayOfWeek) + ')', money(b.job.payPerShift) + ' a shift'],
              ['Open mic tip jar', money(b.gigs.openMicTips.rough.min) + ' to ' + money(b.gigs.openMicTips.legendary.max)],
              ['Small rooms', pct(tiers[1].doorShare) + ' of ' + money(tiers[1].ticket) + ' tickets'],
              ['T-shirts', 'Sell for ' + money(b.merch.shirt.price) + ' (cost ' + money(b.merch.shirt.costEach) + ')'],
              ['Streaming', 'Every Sunday, once you release music']
            ] } },
            { table: { cols: ['Money out', 'How much'], rows: [
              ['Rent and living (' + dayName(b.time.billsDayOfWeek) + ')', money(weeklyBills) + ' a week'],
              ['Network or Hang out', money(b.economy.networkingCost)],
              ['Hang flyers', money(b.promotion.flyers.cost)],
              ['Rehearsal room', money(b.economy.rehearsalRoomPerBlock) + ' a block'],
              ['Studio time', 'From ' + money(b.recording.studios.demo.cost) + ' a block']
            ] } }
          ]
        },
        {
          id: 'skills', title: 'Skills: what you\'re good at', note: 'Talent is practice you did when nobody was watching.',
          body: [
            'You have five skills from 0 to ' + b.skills.max + '. They make almost every result better.',
            skillTable(state),
            'Skills grow fast while they\'re low and slow down near the top: Practice at Musicianship 20 gives about +' + gainAt(b.skills.baseGain.practice.musicianship, 20) +
              ', at 80 about +' + gainAt(b.skills.baseGain.practice.musicianship, 80) + '. Being Tired halves your gains, and morale speeds them up or slows them down.',
            'A skill over ' + b.skills.rustMinSkill + ' that you don\'t use for ' + b.skills.rustAfterDays + ' days starts to rust: ' + b.skills.rustPerWeek +
              ' point a week until you use it again.',
            { tip: 'Skills don\'t unlock anything by themselves. They make your shows and songs better. Good shows raise reputation, and reputation opens the doors.' }
          ]
        },
        {
          id: 'audience', title: 'Fans, buzz, and reputation', note: 'Fans pay the rent. Reputation opens the doors.',
          body: [
            '<strong>Fans</strong> are people in a city who\'ll come back. Each city counts its own. A good show turns part of the crowd into fans; ' +
              'a Rough one wins none. Originals win more fans than covers. Fans stay, unless you go quiet in a city for ' + b.fans.fadeAfterDays + ' days.',
            '<strong>Buzz</strong> is how hot you are in a city right now, 0 to ' + b.buzz.max + '. It fades ' + Math.abs(b.buzz.fadePerDay) + ' a day. Shows, ' +
              'posting online, flyers, and releases raise it, and buzz brings bigger crowds. Promote in the days before a show.',
            '<strong>Reputation</strong> is one number from 0 to ' + b.reputation.max + ' for what the music business thinks of you. Good shows raise it, ' +
              'bigger rooms count for more, and gains get smaller as you climb. A Rough show costs you. It never fades on its own, and it\'s the key to everything:',
            unlockTable,
            { tip: 'You outgrow rooms. Once small rooms open, open mics give half the reputation; by ' + tiers[2].minReputation + ' they give none. Keep moving up.' }
          ]
        },
        {
          id: 'songs', title: 'Songs: covers, originals, and tightness', note: 'Anyone can play a cover. Write something of your own.',
          body: [
            'You start with ' + b.songs.startingCovers + ' covers you already know. They\'re dependable (quality ' + b.songs.coverQuality + '), but crowds ' +
              'don\'t get as attached: an all-cover set wins ' + pct(1 - b.songs.coverFanFactor) + ' fewer fans, and an all-original set wins ' +
              pct(b.songs.originalFanFactor - 1) + ' more.',
            '<strong>Write</strong> works on one original at a time. Each Write block adds progress (' + b.songs.progressBase + ' + Songwriting ÷ ' +
              b.songs.progressSongwritingDivisor + ') and the song is done at ' + b.songs.progressToFinish + ', so your first one takes about ' +
              writeBlocks(state.player.skills.songwriting) + ' blocks. Its quality (1 to ' + b.songs.maxStars + ' stars) comes mostly from Songwriting, ' +
              'plus some luck, plus a bonus if your morale is over ' + b.songs.qualityHighMoraleThreshold + '.',
            tightnessText,
            { tip: 'Song quality and tightness are ' + pct(b.gigs.weights.songQuality + b.gigs.weights.tightness) + ' of every show\'s score. Great songs played loose still sound rough.' }
          ]
        },
        {
          id: 'shows', title: 'Playing shows', note: 'The real work happens before you walk on stage.',
          body: [
            'Everyone starts at open mics: ' + openMicNights + '. Plan "Play the open mic" in the evening on one of those days and pick ' +
              b.songs.setlist.openMic.songs + ' songs. There\'s no pay, just a tip jar, but every show builds skills, fans, and reputation, and you might meet someone.',
            'Every show gets a score. Here\'s what goes into it:',
            scoreTable,
            'The score decides how the night went:',
            resultTable,
            'The result screen shows every part, so you\'ll always know why a night went well or badly. At reputation ' + tiers[1].minReputation +
              ', small rooms open up: email a venue from the <strong>Book</strong> tab to ask for a date, and you\'ll get a share of the door.'
          ]
        },
        {
          id: 'band', title: 'Finding a band', note: 'You can start alone. You can\'t finish alone.',
          body: [
            'You meet people by <strong>Network</strong>ing (' + money(b.economy.networkingCost) + ' for drinks, a ' + pct(b.people.meetBaseChance) +
              ' chance plus Networking ÷ ' + b.people.meetNetworkingDivisor + ' percent), at open mics, and at other bands\' shows. They show up on the ' +
              '<strong>People</strong> tab as contacts.',
            '<strong>Jam</strong> (+' + b.people.relationship.jam + ') and <strong>Hang out</strong> (+' + b.people.relationship.hangOut + ') build your ' +
              'relationship. At ' + b.people.inviteMinRelationship + ' or more you can invite them to the band, if your reputation is close enough to their skill. ' +
              'A band has one of each instrument (' + b.people.roles.join(', ') + '), and you fill one spot yourself.',
            'Bandmates make shows better, and you need ' + b.people.minOnStageForClubs + ' people on stage to play clubs. In return they split each ' +
              'show\'s pay with you equally, and every Sunday they check if they\'re happy: enough shows, money, and rehearsals. Below ' +
              b.satisfaction.talkThreshold + ' they ask to talk; below ' + b.satisfaction.quitThreshold + ' they quit.',
            { tip: 'A new member means relearning the songs (every song loses ' + Math.abs(b.people.newMemberTightnessDrop) + ' tightness). Book the rehearsal room (' +
              money(b.economy.rehearsalRoomPerBlock) + ' a block) and Rehearse.' }
          ]
        },
        {
          id: 'firstWeek', title: 'Your first week', note: 'Here\'s what I\'d do. Your call, though.',
          body: [
            { list: [
              '<strong>Monday evening:</strong> Practice (to sound better on stage) or Write (to start your first original).',
              '<strong>' + dayName(Game.content.venues.rustyNail.openMicDay) + ' evening:</strong> play the open mic at ' + venueName('rustyNail') +
                '. Pick your two tightest songs.',
              '<strong>Wednesday:</strong> Network once to meet people. Watch the ' + money(b.economy.networkingCost) + '.',
              '<strong>' + dayName(Game.content.venues.beanThere.openMicDay) + ':</strong> another open mic at ' + venueName('beanThere') +
                ', or Rest if your energy is getting low.',
              '<strong>The weekend:</strong> Write and Practice, and take one full day off for ' + signed(mc.fullDayOff) + ' morale.',
              '<strong>Every day:</strong> keep energy above ' + b.energy.tiredThreshold + ' before a show, and keep ' + money(weeklyBills) + ' for Sunday.'
            ] },
            'When you want the full story on anything, it\'s in <strong>Settings → Guide</strong> (on a phone, Settings is under More). ' +
              'For your first few days I\'ll leave you notes on the Today screen, too.',
            { tip: 'Now get out there. The Rusty Nail\'s sound guy owes me a favor. Don\'t make me regret it.' }
          ]
        }
      ];
    },

    // ----- The Guide (Settings → Guide): every mechanic -----
    sections: function () {
      var fame = b.fameLevels;
      var studios = b.recording.studios;
      var promos = b.streaming.promos;
      var setl = b.gigs.setlist;
      var c = b.cancellations;
      var res = b.offers.residency;
      var sw = b.sessionWork;
      var t = b.travel;
      var h = b.housing;
      var lb = b.label;
      return [
        {
          id: 'goal', title: 'The goal and fame', note: 'Nobody hands you an arena. You build up to one.',
          body: [
            'You start as a bedroom musician in Millbrook with a day job. The aim is to grow from open mics to small rooms, clubs, theaters, and arenas, at ' +
              'home and around the world. There\'s no single finish line: fame levels show how far you\'ve come, and milestones mark the big steps.',
            'The game ends only if you go broke for too long (see Money). Burnout won\'t end it, but it will stall you.',
            { table: { cols: ['Fame level', 'Total fans'], rows: fame.map(function (f) { return [f.name, f.minFans.toLocaleString('en-US') + '+']; }) } }
          ]
        },
        {
          id: 'days', title: 'Days, blocks, and the calendar', note: 'Plan the week, not just the day.',
          body: [
            'Each day has three blocks (Morning, Afternoon, Evening). Plan what to do in each free block, then End Day. Planned blocks play out in order; ' +
              'you can change or clear a plan until then. Empty blocks give ' + b.time.emptyBlockEnergy + ' energy back.',
            'The <strong>Calendar</strong> shows ' + b.time.startBookingWeeks + ' weeks ahead (' + b.time.managerBookingWeeks + ' once you have a manager). Plan ' +
              'any free block ahead of time, book days off work, and set up shows: their setlist, encore, and cancelling. Booked shows, studio time, travel, ' +
              'and tickets fill their blocks, and plans can\'t overwrite them.',
            { list: [
              '<strong>Plan week:</strong> fill a whole week\'s evenings at once, and save it as a template to reuse (up to ' + b.planWeek.maxTemplates + ').',
              '<strong>Skip to next commitment:</strong> ends quiet days in one go, until a show, a plan, an event, a message, or Sunday\'s summary.',
              '<strong>Repeat yesterday\'s evening:</strong> plans the same evening action again.',
              '<strong>Keyboard shortcuts</strong> (on a computer): E ends the day, 1 / 2 / 3 plan the morning, afternoon, or evening, letters switch tabs ' +
                '(T, C, I, B, M, U, P, S, F, R), Esc goes back, and ? shows the list.'
            ] },
            { table: { cols: ['Cancelling a show', 'Venue relationship', 'Reputation', 'Bandmates\' satisfaction'], rows: [
              [c.earlyNoticeDays + '+ days ahead', String(c.early.venueRelationship), String(c.early.reputation), String(c.early.bandSatisfaction)],
              ['Under ' + c.earlyNoticeDays + ' days ahead', String(c.late.venueRelationship), String(c.late.reputation), String(c.late.bandSatisfaction)],
              ['Not showing up', String(c.noShow.venueRelationship), String(c.noShow.reputation) + ', and banned for ' + c.noShow.banDays + ' days', String(c.noShow.bandSatisfaction)]
            ] } },
            'Cancelling also costs you ' + Math.abs(mc.cancelGig) + ' morale.'
          ]
        },
        {
          id: 'job', title: 'The day job', note: 'It pays the rent. Don\'t quit before the music does.',
          body: [
            'Full-time is Monday to Friday, mornings and afternoons. Each shift pays ' + money(b.job.payPerShift) + ' (on ' + dayName(b.time.paydayDayOfWeek) +
              ' night), costs ' + ec.dayJob + ' energy a block, and ' + Math.abs(mc.dayJobShift) + ' morale.',
            '<strong>Job standing</strong> (0 to ' + b.job.maxStanding + ', you start at ' + b.job.startStanding + ') is how your boss sees you. Each shift adds ' +
              b.job.standingPerShift + '. Under ' + b.job.warningStanding + ' you get a warning; at ' + b.job.firedStanding + ' you\'re fired.',
            { table: { cols: ['Time off', 'How'], rows: [
              ['Vacation day', b.job.vacationDaysPerYear + ' a year, paid. Book ' + b.job.vacationNoticeDays + '+ days ahead for no penalty.'],
              ['Call in sick', 'Today or tomorrow only: ' + b.job.sickDayPenalty + ' standing, unpaid.'],
              ['Skip work', b.job.skipPenalty + ' standing, unpaid.']
            ] } },
            '<strong>Going part-time</strong> (Monday, Wednesday, Friday) needs reputation ' + b.job.partTimeMinReputation + ' and standing ' + b.job.partTimeMinStanding +
              '+. <strong>Quitting</strong> frees every weekday and gives ' + signed(b.job.quitMoraleBonus) + ' morale, but your income is all music from then on. ' +
              'Both take effect the next Monday. The Job screen shows how much music has been paying first. Without a job, Look for work gives a ' +
              pct(b.job.lookForWorkChance) + ' chance at a part-time one.',
            'On some ' + dayName(b.events.overtime.dayOfWeek) + 's your boss offers an overtime shift for the next day (' + money(b.job.overtimePay) + ').'
          ]
        },
        {
          id: 'energy', title: 'Energy', note: 'You\'re no good to anyone at zero.',
          body: [
            'Energy (0 to ' + b.energy.max + ') is how much you can do today. You start each career at ' + b.energy.start + '.',
            energyTable,
            'Under ' + b.energy.tiredThreshold + ' you\'re <strong>Tired</strong>: skill gains are halved and shows score ' + Math.abs(b.gigs.tiredPenalty) +
              ' lower. Hit 0 and you\'re <strong>Exhausted</strong>: only ' + b.energy.exhaustedOvernight + ' back overnight and ' + mc.exhausted + ' morale.',
            'You can\'t start an optional action without the energy for it. Commitments (the job, shows, studio time, travel) happen anyway.'
          ]
        },
        {
          id: 'morale', title: 'Morale', note: 'Look after yourself. Nobody else is going to.',
          body: [
            'Morale (0 to ' + b.morale.max + ', you start at ' + b.morale.start + ') is how you feel about the whole thing over weeks.',
            moraleEffects,
            moraleUp,
            moraleDown,
            'A <strong>full day off</strong> means no job and no work actions that day (Rest, Hang out, and empty blocks are fine). Each Sunday morale drifts ' +
              b.morale.weeklyDrift + ' points toward your home\'s resting level (see Housing). Songs you write while morale is over ' +
              b.songs.qualityHighMoraleThreshold + ' also come out ' + b.songs.qualityHighMoraleBonus + ' points better.'
          ]
        },
        {
          id: 'money', title: 'Money and debt', note: 'Broke is a mood. Debt is a problem.',
          body: [
            'You start with ' + money(b.economy.startCash) + '. Every Sunday night your home\'s weekly cost comes out (' + money(weeklyBills) + ' for the starter apartment). ' +
              'Every dollar in and out is listed on the <strong>Finances</strong> tab, kept for about three months, with show-by-show settlements.',
            'If your cash would go below zero, Mom and Dad lend you ' + money(b.debt.familyLoanAmount) + ' at a time. Pay it back from Today. While you owe money you ' +
              'can\'t move up or buy the vacation home. Owing more than ' + money(b.debt.gameOverDebt) + ' for more than ' + b.debt.gameOverWeeks +
              ' Sundays in a row ends the game.',
            'Surprise bills (' + money(b.economy.surpriseBill.min) + ' to ' + money(b.economy.surpriseBill.max) + ') come from events like a broken string or car trouble.',
            'Gig pay is split equally between you and every bandmate who played (a Diva wants ' + b.bandPay.divaShares + ' shares). You pay the band\'s costs ' +
              '(rehearsal room, studio, promotion, gas). Merch and streaming money is yours.'
          ]
        },
        {
          id: 'skills', title: 'Skills', note: 'A little every day beats a lot once a month.',
          body: [
            skillTable(null),
            'At New career you spend ' + b.skills.startingPoints + ' points (0 to ' + b.skills.startingMaxPerSkill + ' per skill), and your instrument adds +3: ' +
              'guitar to Performance, keys to Songwriting, bass to Networking.',
            'A gain is the action\'s base amount × (1 − skill ÷ ' + b.skills.growthCap + '), so skills grow fast while low and slowly near the top. Morale changes ' +
              'gains (×' + b.skills.moraleLowMultiplier + ' under ' + b.skills.moraleLowThreshold + ', ×' + b.skills.moraleHighMultiplier + ' over ' +
              b.skills.moraleHighThreshold + '), and being Tired halves them.',
            { table: { cols: ['Action', 'Base gain'], rows: [
              ['Practice', '+' + b.skills.baseGain.practice.musicianship + ' Musicianship'],
              ['Rehearse', '+' + b.skills.baseGain.rehearse.musicianship + ' Musicianship'],
              ['Playing a show', '+' + b.skills.baseGain.playLive.performance + ' Performance, +' + b.skills.baseGain.playLive.musicianship + ' Musicianship, +' +
                b.skills.baseGain.playLive.networking + ' Networking'],
              ['Write', '+' + b.skills.baseGain.write.songwriting + ' Songwriting'],
              ['Network', '+' + b.skills.baseGain.network.networking + ' Networking'],
              ['Post online, Hang flyers', '+' + b.skills.baseGain.promote.promotion + ' Promotion'],
              ['Session work (each session)', '+' + b.skills.baseGain.sessionWork.musicianship + ' Musicianship']
            ] } },
            '<strong>Rust:</strong> a skill over ' + b.skills.rustMinSkill + ' unused for ' + b.skills.rustAfterDays + ' days loses ' + b.skills.rustPerWeek +
              ' a week until you use it (a warning shows after ' + b.skills.rustWarningDays + ' days).'
          ]
        },
        {
          id: 'songs', title: 'Songs', note: 'Write the song only you could write.',
          body: [
            'You start with ' + b.songs.startingCovers + ' covers (quality ' + b.songs.coverQuality + ', tightness ' + b.songs.tightness.cover + '). Covers win ' +
              pct(1 - b.songs.coverFanFactor) + ' fewer fans; originals win ' + pct(b.songs.originalFanFactor - 1) + ' more (a mixed set is in between).',
            '<strong>Writing:</strong> one original at a time. Each Write block adds ' + b.songs.progressBase + ' + Songwriting ÷ ' + b.songs.progressSongwritingDivisor +
              ' progress; done at ' + b.songs.progressToFinish + ' (about ' + writeBlocks(10) + ' blocks at Songwriting 10, ' + writeBlocks(50) + ' at 50). ' +
              'Finishing a song gives ' + signed(mc.finishSong) + ' morale.',
            '<strong>Quality</strong> = ' + b.songs.qualityBase + ' + ' + b.songs.qualitySongwritingWeight + ' × Songwriting + luck (0 to ' + b.songs.qualityRandomMax + '), ' +
              signed(b.songs.qualityHighMoraleBonus) + ' if morale is over ' + b.songs.qualityHighMoraleThreshold + '. Shown as stars (' + b.songs.pointsPerStar + ' points a star).',
            '<strong>Co-writing:</strong> a bandmate with relationship ' + b.people.coWriteMinRelationship + '+ can write with you. Their skill adds to progress (÷' +
              b.songs.coWriterProgressDivisor + ') and quality (÷' + b.songs.coWriterQualityDivisor + ').',
            tightnessText + ' "Practice all songs" adds ' + b.songs.tightness.practiceAllGain + ' to every song and stops them fading that week.'
          ]
        },
        {
          id: 'setlists', title: 'Setlists', note: 'Open strong, close stronger.',
          body: [
            'Each kind of show wants a set size:',
            { table: { cols: ['Show', 'Songs'], rows: [
              ['Open mic', String(b.songs.setlist.openMic.songs)],
              ['Cover night', b.songs.setlist.coverNight.songs + ' (covers only)'],
              ['Small room', String(b.songs.setlist.smallRoom.songs)],
              ['Club', String(b.songs.setlist.club.songs)],
              ['Theater', b.songs.setlist.theater.songs + ' (up to ' + b.songs.setlist.theater.coverLimit + ' covers)'],
              ['Arena', b.songs.setlist.arena.songs + ' (up to ' + b.songs.setlist.arena.coverLimit + ' covers)']
            ] } },
            'A song\'s strength is (quality + tightness) ÷ 2. Opening with one of the set\'s ' + setl.strongCount + ' strongest songs is ' + signed(setl.opener.strong) +
              ', closing with one is ' + signed(setl.closer.strong) + '. In sets of ' + setl.weakFromSetSize + '+ songs, a weak opener or closer is ' + setl.opener.weak + '.',
            '<strong>Crowd favorites</strong> (songs that charted or went viral) add ' + signed(setl.favorite) + ' each, up to ' + signed(setl.favoritesMax) +
              ', plus ' + signed(setl.knowTheWords.bonus) + ' where you have ' + pct(setl.knowTheWords.share) + '+ of the city\'s possible fans.',
            '<strong>The encore</strong> (picked ahead of time) plays after a Great or Legendary night: ' + signed(Math.round(setl.encore.fans * 100)) + '% new fans (' +
              signed(Math.round(setl.encore.favoriteFans * 100)) + '% with a crowd favorite) and ' + signed(setl.encore.buzz) + ' buzz.',
            'Drag songs to reorder (press and hold on a phone), or press <strong>Best order</strong>.'
          ]
        },
        {
          id: 'gigs', title: 'Shows and the score', note: 'The crowd can tell when you\'re ready.',
          body: [
            'Every show (open mics included) is scored from these parts:',
            scoreTable,
            'Band traits add to it too (a Party Animal or Diva is +5 each), and so do gear upgrades (see Shop). After two Rough results in a row, the next show\'s luck can\'t be negative.',
            resultTable,
            'Every show also grows skills and tightness, pays (the tip jar, the door, or a fee), sells merch, and changes your relationship with the venue (' +
              signed(b.venues.relationshipAfterGoodShow) + ' after Solid or better, ' + b.venues.relationshipAfterRoughShow + ' after Rough).'
          ]
        },
        {
          id: 'audience', title: 'Fans, buzz, and reputation', note: 'Grow the crowd, then grow the room.',
          body: [
            '<strong>Fans</strong> are counted per city. New fans from a show = crowd × the result\'s rate × originals factor, slowing as the city fills up ' +
              '(each city has a most it can ever hold). A city you haven\'t played or released in for ' + b.fans.fadeAfterDays + ' days loses ' + pct(b.fans.fadePerWeek) + ' of its fans a week.',
            '<strong>Fan clubs:</strong> once you have ' + pct(b.fans.club.share) + ' of a city\'s most possible fans, a fan club forms there. It grows that city\'s fans by ' +
              pct(b.fans.club.weekly) + ' every week on its own, and those fans never fade. The Map shows where you have one, and how close you are elsewhere.',
            '<strong>Buzz</strong> (per city, 0 to ' + b.buzz.max + ') fades ' + Math.abs(b.buzz.fadePerDay) + ' a day. <strong>Expected crowd</strong> = city fans × (' +
              pct(b.crowd.fanTurnout) + ' + buzz ÷ ' + b.crowd.buzzTurnoutDivisor + ' %) + the venue\'s walk-ins × (' + b.crowd.footTrafficBase + ' + buzz ÷ ' +
              b.crowd.footTrafficBuzzDivisor + '), give or take, up to the room\'s size. The Book screen shows the range.',
            '<strong>Reputation</strong> (0 to ' + b.reputation.max + ') changes after each show by the result\'s amount × (1 + venue size × ' + b.reputation.tierMultiplier +
              '). Gains shrink as you climb (× (1 − reputation ÷ ' + b.reputation.diminishingDivisor + ')); losses don\'t. Releases, awards, and the press push add some too.',
            unlockTable,
            '<strong>Outgrowing rooms:</strong> once small rooms open, open mics give half the reputation; shows more than one size below the biggest you\'ve unlocked give none.'
          ]
        },
        {
          id: 'promotion', title: 'Promotion', note: 'Nobody comes to a show they never heard about.',
          body: [
            { table: { cols: ['Promotion', 'Cost', 'Effect', 'Needs'], rows: [
              ['Post online', 'Free', '+' + b.promotion.postOnline.buzzBase + ' + Promotion ÷ ' + b.promotion.postOnline.buzzSkillDivisor + ' hometown buzz', '-'],
              ['Hang flyers', money(b.promotion.flyers.cost), '+' + b.promotion.flyers.buzz + ' buzz in one city', '-'],
              ['Social ads', money(b.promotion.socialAds.cost), '+' + b.promotion.socialAds.buzz + ' buzz in one city', 'A release'],
              ['Big campaign', money(b.promotion.bigCampaign.cost), '+' + b.promotion.bigCampaign.buzz + ' buzz in up to ' + b.promotion.bigCampaign.maxCities +
                ' cities, plus ' + pct(b.promotion.bigCampaign.fanRate) + ' new fans', 'Reputation ' + b.promotion.bigCampaign.minReputation],
              ['Press and radio push', money(b.promotion.pressPush.cost), '+' + b.promotion.pressPush.buzz + ' buzz everywhere you have fans, +' +
                b.promotion.pressPush.reputation + ' reputation (every ' + b.promotion.pressPush.cooldownDays + ' days)', 'A manager']
            ] } },
            'Paid promotion is multiplied by (1 + Promotion ÷ ' + b.promotion.paidSkillDivisor + '). Releases and good shows add buzz too, and a manager posts for you every day.'
          ]
        },
        {
          id: 'booking', title: 'Venues and booking', note: 'Ask for the room you can fill.',
          body: [
            { table: { cols: ['Venue size', 'Needs', 'Book ahead', 'Ticket', 'Your share'], rows: [1, 2, 3, 4].map(function (n) {
              var v = tiers[n];
              return [v.name, 'Reputation ' + v.minReputation + (v.minOnStage > 1 ? ', ' + v.minOnStage + '+ on stage' : '') + (n === 3 ? ', a release' : '') + (n === 4 ? ', ' + b.milestones.arenaFans.toLocaleString('en-US') + ' fans' : ''),
                v.bookAhead ? v.bookAhead.min + ' to ' + v.bookAhead.max + ' days' : 'Offers only', money(v.ticket), v.doorShare ? pct(v.doorShare) + ' of the door' : 'A fee'];
            }) } },
            'Open mics need nothing: just plan one on its night. To book anything bigger, open <strong>Book</strong>, pick a venue and a date inside its window, ' +
              'and send an email (' + ec.email + ' energy, no block). One open request per venue at a time.',
            '<strong>Your chance</strong> = ' + pct(b.venues.bookingBaseChance) + ' + ' + pct(b.venues.bookingPerReputationPoint) + ' for each reputation point above what the venue needs + Networking ÷ ' +
              b.venues.bookingNetworkingDivisor + ' % + venue relationship ÷ ' + b.venues.bookingRelationshipDivisor + ' % (between ' + pct(b.venues.bookingMinChance) +
              ' and ' + pct(b.venues.bookingMaxChance) + '). The answer arrives in the Inbox ' + b.venues.replyDays.min + ' to ' + b.venues.replyDays.max +
              ' days later; accept a yes within ' + b.venues.offerExpiryDays + ' days.',
            '<strong>Cover nights</strong> at some small rooms pay a flat ' + money(b.economy.coverGigFee) + ' for ' + b.songs.setlist.coverNight.songs +
              ' covers (needs reputation ' + b.economy.coverGigMinReputation + ' and Musicianship ' + b.economy.coverGigMinMusicianship + '). Hollow Records in-stores pay nothing ' +
              'but sell merch at double the rate. Short a player for a club? Hire a session player for ' + money(b.economy.sessionPlayerFee) + '.',
            'Other bands book venues too: a night someone else has is taken (the venue\'s flyer shows who\'s playing).'
          ]
        },
        {
          id: 'offers', title: 'Offers that come to you', note: 'Say yes to the right ones.',
          body: [
            { list: [
              '<strong>Fill-in:</strong> a band dropped out, can you play tomorrow? Short notice, no odds, ' + signed(b.events.fillIn.reputation) + ' reputation.',
              '<strong>Opening slot</strong> (reputation ' + b.offers.openingSlot.minReputation + '+): open for a touring band at a club for a ' +
                money(b.offers.openingSlotFee.min) + ' to ' + money(b.offers.openingSlotFee.max) + ' fee and a ' + b.offers.openingSlot.setSize +
                '-song set. Their crowd fills the room; you win fans from it at half the usual rate. No ' + b.people.minOnStageForClubs + '-on-stage rule.',
              '<strong>Residency</strong> (reputation ' + res.minReputation + '+, a venue that likes you, relationship ' + res.minRelationship + '+): a weekly night for ' +
                b.offers.residencyWeeks + ' weeks at the venue\'s fee, offered on Mondays. Regulars keep the room at least ' + pct(res.crowdFloor) + ' full. ' +
                'You can make one counter-offer (another night, up to ' + pct(res.maxRateChange) + ' more money, or ' + res.minWeeks + ' to ' + res.maxWeeks + ' weeks); each change lowers the odds.',
              '<strong>Session work</strong> (Musicianship ' + sw.minMusicianship + '+ and reputation ' + sw.minReputation + '+): play on another band\'s recording, ' + sw.sessions +
                ' sessions at ' + money(sw.fee.min) + ' to ' + money(sw.fee.max) + ' each, ' + signed(b.skills.baseGain.sessionWork.musicianship) + ' Musicianship a session. ' +
                'Play every session and you get ' + pct(sw.streamingShare) + ' of the song\'s streaming money every Sunday once it\'s out.'
            ] }
          ]
        },
        {
          id: 'people', title: 'People and the band', note: 'Pick people you\'d share a van with.',
          body: [
            'You meet people by Networking (' + pct(b.people.meetBaseChance) + ' + Networking ÷ ' + b.people.meetNetworkingDivisor + ' %), at open mics (' +
              pct(b.people.openMicMeetChance) + '), and at other bands\' shows. Better Networking and reputation means better players. You keep up to ' +
              b.people.maxContacts + ' contacts.',
            '<strong>Relationship</strong> starts at ' + b.people.startRelationship + '. Jam ' + signed(b.people.relationship.jam) + ', Hang out ' + signed(b.people.relationship.hangOut) +
              ', a show together ' + signed(b.people.relationship.gigTogether) + ', and ' + b.people.relationship.fadePerWeek + ' a week without contact.',
            '<strong>Inviting:</strong> needs relationship ' + b.people.inviteMinRelationship + '+, and your reputation must be at least their skill − ' + b.people.inviteSkillGap +
              '. One of each instrument (' + b.people.roles.join(', ') + '), you included, and up to ' + b.people.maxBandMembers + ' bandmates. Remove a member to make room.',
            '<strong>Satisfaction</strong> (checked every Sunday): bandmates like earning gig money, as many shows as their ambition wants, rehearsals, and great nights; ' +
              'they dislike long gaps, Rough shows, cancellations, and clashing bandmates. Below ' + b.satisfaction.talkThreshold + ' they ask to talk (Talk gives ' +
              signed(b.satisfaction.talkGain) + ', once every ' + b.satisfaction.talkCooldownDays + ' days); below ' + b.satisfaction.quitThreshold + ' they quit.',
            { table: { cols: ['Trait', 'Upside', 'Downside', 'Clashes with'], rows: Object.keys(Game.content.traits).map(function (id) {
              var tr = Game.content.traits[id];
              return [tr.name, tr.upside, tr.downside, tr.clashesWith];
            }) } },
            'Rehearse needs a bandmate and the rehearsal room (' + money(b.economy.rehearsalRoomPerBlock) + ' a block). Every new member costs each song ' +
              Math.abs(b.people.newMemberTightnessDrop) + ' tightness. Once you have a bandmate you can name the band.'
          ]
        },
        {
          id: 'recording', title: 'Recording and releases', note: 'A record keeps working while you sleep.',
          body: [
            'Book studio time from the Book screen at least ' + b.recording.bookAheadDays + ' days ahead. Each block records one original. ' +
              '<strong>Recording quality</strong> = ' + b.recording.songQualityWeight + ' × song quality + ' + b.recording.bandMusicianshipWeight + ' × band musicianship + ' +
              b.recording.tightnessWeight + ' × tightness + the studio\'s bonus.',
            { table: { cols: ['Studio', 'Cost', 'Bonus', 'Needs'], rows: [
              ['Home setup', money(studios.home.oneTimeCost) + ' once, then free', 'Quality tops out at ' + studios.home.qualityCap, 'Your first recording'],
              ['Demo', money(studios.demo.cost) + ' a block', '+' + studios.demo.bonus, '-'],
              ['Pro', money(studios.pro.cost) + ' a block', '+' + studios.pro.bonus, 'Reputation ' + studios.pro.minReputation],
              ['Top', money(studios.top.cost) + ' a block', '+' + studios.top.bonus, 'A label deal']
            ] } },
            '<strong>Releasing</strong> (Music → Releases): a single (1 song), EP (' + b.releases.sizes.ep.min + ' to ' + b.releases.sizes.ep.max + '), or album (' +
              b.releases.sizes.album.min + ' to ' + b.releases.sizes.album.max + '). A release gives buzz (bigger for EPs and albums), new fans in every city ' +
              'where you have them, and reputation (quality ÷ ' + b.releases.reputationQualityDivisor + '). Releasing again within ' + b.releases.spamWindowWeeks +
              ' weeks gives half the buzz.',
            'Each release can have one promo push: a playlist pitch (' + money(promos.playlist.cost) + '), radio (' + money(promos.radio.cost) + '), or a music video (' +
              money(promos.video.cost) + '). Each boosts streams for its first weeks.'
          ]
        },
        {
          id: 'streaming', title: 'Streaming and charts', note: 'Hits pay for years. Most songs pay for weeks.',
          body: [
            'Every Sunday each released song is streamed: your total fans × ' + b.streaming.streamsPerFan + ' × (recording quality ÷ 100) × freshness × boosts. ' +
              'Each stream pays $' + b.streaming.payPerStream + '. Freshness drops ' + pct(b.streaming.freshnessDropPerWeek) +
              ' a week (never below ' + pct(b.streaming.freshnessMin) + '), so keep releasing.',
            { list: [
              '<strong>Buzz:</strong> up to +' + pct(b.streaming.buzzBoostMax) + '.',
              '<strong>Charting:</strong> +' + pct(b.streaming.chartBoostMin) + ' to +' + pct(b.streaming.chartBoostMax) + ' (at #1).',
              '<strong>Played live:</strong> +' + pct(b.streaming.livePerShow) + ' per show that week, up to +' + pct(b.streaming.liveMax) + '.',
              '<strong>Viral:</strong> a ' + pct(b.streaming.viralChance) + ' chance each Sunday for songs of quality ' + b.streaming.viralMinQuality + '+.',
              '<strong>Promo push:</strong> from the release form.'
            ] },
            'The charts (Music → Charts) are a Top ' + b.charts.singlesSize + ' singles and Top ' + b.charts.albumsSize + ' albums, updated every Sunday, with ' +
              'your songs, your rivals\' records, and other acts. Gold and Platinum come at ' + b.streaming.records.song.gold.toLocaleString('en-US') + ' and ' +
              b.streaming.records.song.platinum.toLocaleString('en-US') + ' streams for a single (' + b.streaming.records.album.gold.toLocaleString('en-US') +
              ' and ' + b.streaming.records.album.platinum.toLocaleString('en-US') + ' for an EP or album).'
          ]
        },
        {
          id: 'shop', title: 'Merch and the Shop', note: 'Sell a shirt, buy a sandwich. That\'s the business.',
          body: [
            { table: { cols: ['Item', 'Cost', 'What it does'], rows: [
              ['T-shirts', money(b.merch.shirt.packCost) + ' for ' + b.merch.shirt.packSize, 'Sell for ' + money(b.merch.shirt.price) + ' at shows'],
              ['CDs', money(b.merch.cd.packCost) + ' for ' + b.merch.cd.packSize, 'Sell for ' + money(b.merch.cd.price) + ' (after your first EP)'],
              ['Tour shirts', money(b.merch.tourShirt.packCost) + ' for ' + b.merch.tourShirt.packSize, 'Sell for ' + money(b.merch.tourShirt.tourPrice) + ' on that tour'],
              ['Instrument upgrades', b.economy.instrumentUpgrades.map(function (u) { return money(u.cost); }).join(', '),
                b.economy.instrumentUpgrades.map(function (u) { return signed(u.gigBonus); }).join(', ') + ' to every show\'s score'],
              ['Vans', money(b.vans.beater.price) + ' (lasts ' + b.vans.beater.maxShows + ' shows), ' + money(b.vans.used.price) + ' (' + b.vans.used.maxShows + '), ' +
                money(b.vans.new.price) + ' (never breaks)', 'Far cities with a band, and tours'],
              ['Private jet', money(t.jet.price), 'Cheaper, faster flights (after Going global)']
            ] } },
            'Merch comes in bigger orders too, at the same price per item: up to ' + b.merch.orderPacks.shirts.slice(-1)[0] * b.merch.shirt.packSize + ' T-shirts or ' +
              b.merch.orderPacks.cds.slice(-1)[0] * b.merch.cd.packSize + ' CDs at once, so you can stock up before a tour.',
            'Each person in the crowd might buy each item you have in stock: ' + pct(b.merch.buyChance.rough) + ' on a Rough night, ' + pct(b.merch.buyChance.solid) +
              ' Solid, ' + pct(b.merch.buyChance.great) + ' Great, ' + pct(b.merch.buyChance.legendary) + ' Legendary. Performance helps you sell.'
          ]
        },
        {
          id: 'travel', title: 'Travel and tours', note: 'The road is where bands get good. And tired.',
          body: [
            { table: { cols: ['Cities', 'Open at', 'Each way', 'Getting there'], rows: [
              ['Near', 'Reputation ' + b.geography.nearMinReputation, t.blocksEachWay.near + ' block', money(t.gasRoundTrip.near) + ' gas round trip'],
              ['Mid', 'Reputation ' + b.geography.midMinReputation + ' and a Near show', t.blocksEachWay.mid + ' blocks', money(t.gasRoundTrip.mid) + ' gas'],
              ['Far', 'Reputation ' + b.geography.farMinReputation + ' and a van', t.blocksEachWay.far + ' blocks (a full day)', money(t.gasRoundTrip.far) + ' gas'],
              ['National', 'A manager, and a mid-size or major label (or reputation ' + b.label.nationalWithoutLabel + ')', t.flight.blocks + ' blocks', money(t.flight.perPersonOneWay) + ' a person each way (flight)'],
              ['International', 'Tour shows in ' + b.geography.internationalMinNationalCities + ' National cities', t.internationalFlight.blocks + ' blocks',
                money(t.internationalFlight.perPersonOneWay) + ' a person each way, and jet lag (' + t.jetLag.energy + ' energy)']
            ] } },
            'Book out-of-town shows from Book like any other; the game plans the trip (travel blocks, ' + t.energyPerBlock + ' energy each, hotels at ' +
              money(t.hotelPerNight) + ' a night). Shows close together are chained, so you drive straight on. Bandmates pay their share of the road costs.',
            '<strong>Tours</strong> are ' + b.tours.minShows + '+ out-of-town shows within ' + b.tours.withinDays + ' days. Tour shows win ' + pct(b.tours.fanBonus) + ' (' + pct(b.tours.fanBonusByRegion.national) + ' in National cities, ' +
              pct(b.tours.fanBonusByRegion.international) + ' abroad)' +
              ' more new fans and give the next city +' + b.tours.nextCityBuzz + ' buzz. With a manager, ask for a tour (or build one stop by stop in the Tour Builder) ' +
              'and approve the proposal, with optional ads in each city. Bandmates\' moods change on the road by trait, and from day ' + b.morale.roadFatigueStartDay +
              ' you lose ' + Math.abs(b.morale.roadFatiguePerDay) + ' morale a day.'
          ]
        },
        {
          id: 'bigTime', title: 'Manager and big shows', note: 'Good people take a cut. Great ones earn it.',
          body: [
            '<strong>Manager</strong> (reputation ' + b.milestones.managerReputation + ' and ' + b.milestones.managerFans.toLocaleString('en-US') + ' fans): takes ' +
              pct(b.manager.gigPayCut) + ' of all gig pay. Books shows for you (up to the shows a week you set), plans tours, posts every day (+' +
              b.manager.social.dailyBuzz + ' buzz wherever you have fans), opens the press push, and stretches the calendar to ' + b.time.managerBookingWeeks + ' weeks.',
            '<strong>Record labels</strong> only talk to artists with a manager. Deals change everything about your records: see Record labels.',
            '<strong>Theaters</strong> (reputation ' + tiers[3].minReputation + ' and a release) and <strong>arenas and festivals</strong> (reputation ' +
              tiers[4].minReputation + ' and ' + b.milestones.arenaFans.toLocaleString('en-US') + ' fans, by offer on Mondays, with a major label: or a Top 10 record on a smaller one, ' +
              'or reputation ' + b.label.bigShowsWithout.reputation + ' and ' + b.label.bigShowsWithout.fans.toLocaleString('en-US') + ' fans without). Big rooms have production costs: ' +
              pct(b.production.share) + ' of the show\'s pay, up to ' + money(b.production.theater) + ' at a theater and ' + money(b.production.arena) + ' at an arena.',
            '<strong>Awards</strong> every December: nominations on the first Monday, the ceremony on the last Saturday. Song of the Year (a release with quality ' +
              b.awards.songMinQuality + '+), Record of the Year (an EP or album, ' + b.awards.recordMinQuality + '+), and Breakout Act (' +
              b.awards.breakoutMinFans.toLocaleString('en-US') + '+ new fans that year). Each win is ' + signed(b.awards.winReputation) + ' reputation.'
          ]
        },
        {
          id: 'labels', title: 'Record labels', note: 'A good deal is rocket fuel. A bad one is a cage. Read every line.',
          body: [
            'Once you have a manager, labels start calling (mostly on Mondays, more when you\'re hot: buzz, a charting song, a new record). When one offers, ' +
              'others may join within days: up to ' + lb.maxOpenOffers + ' at once, side by side. Each offer opens as a full contract with your manager\'s take. ' +
              'You can make one counter-offer per deal; the label answers the next morning. Turn a label down and it waits ' + lb.declineCooldownWeeks.min + ' to ' +
              lb.declineCooldownWeeks.max + ' weeks before calling again; others can still call. Let an offer run out and a rival might get it.',
            '<strong>Asking your manager:</strong> whenever you\'re unsigned, ask your manager (Manager screen) to find you a deal. An offer arrives in ' +
              lb.managerSearch.days.min / 7 + ' to ' + lb.managerSearch.days.max / 7 + ' weeks, from a label that would sign you (never a shark). Turn it down and you wait ' +
              Math.round(lb.managerSearch.rejectWaitDays / 7) + ' weeks before you can ask again.',
            { table: { cols: ['Labels', 'Can offer at', 'Typical deal'], rows: ['indie', 'mid', 'major', 'shark'].map(function (k) {
              var t = lb.tiers[k];
              var names = Object.keys(Game.content.labels).filter(function (id) { return Game.content.labels[id].tier === k; })
                .map(function (id) { return Game.content.labels[id].name; }).join(', ');
              return [names, 'Reputation ' + t.minReputation + ', ' + t.minFans.toLocaleString('en-US') + ' fans' + (k === 'shark' ? ' (more often when you\'re desperate)' : ''),
                pct(t.royalty.min) + ' to ' + pct(t.royalty.max) + ' royalty, +' + pct(t.reach.min) + ' to +' + pct(t.reach.max) + ' reach, ' +
                t.records.min + ' to ' + t.records.max + (t.recordType === 'album' ? ' albums' : ' EPs or albums') + ', ' + t.deadlineWeeks.min + ' to ' + t.deadlineWeeks.max + ' weeks each'];
            }) } },
            '<strong>How the money works:</strong> on records made under a deal, the label keeps its share of streaming and your royalty pays back the advance ' +
              '(and anything they charge back to you) before you see a cent. In return the label\'s reach boosts those records\' streams and new fans, and its push ' +
              'wins fans in every city you can play. Records you made before signing stay all yours.',
            { table: { cols: ['Term', 'What to look for'], rows: [
              ['Advance', 'Cash now, but it\'s paid back from your royalty. Big advances often hide harsh terms.'],
              ['Royalty', 'Your share of streaming on these records. Under 15% and they barely pay you.'],
              ['Charged back', 'Studio time, promo, or tour support added to what you owe them.'],
              ['Records owed', 'How many EPs or albums, and the weeks for each. Singles never count. Missing a deadline means a fine, a lower royalty, or one more record.'],
              ['Creative control', 'Approval: they reject records under their quality bar. Shelving: they can hold a finished record for weeks.'],
              ['Masters', 'Who owns the recordings when the deal ends. If the label does, those records keep paying you only your royalty, forever.'],
              ['360 cut', 'A share of every show\'s pay and every merch sale while you\'re signed.'],
              ['Renewal option', 'If your last record is good, they can keep you for more.'],
              ['Buyout', 'The price to leave early. In bad deals it\'s a fortune.'],
              ['Getting dropped', lb.strikesToDrop + ' strikes (missed deadlines, or flops under the label\'s quality floor) and most labels can let you go: reputation ' +
                lb.dropReputation + ', but you\'re free. Some never let go.']
            ] } },
            '<strong>Keeping them happy:</strong> a label\'s mood (Loves you, Warm, Lukewarm, Cold) shows on the Manager screen. Loving you makes its reach ' +
              Math.round((lb.mood.loveReach - 1) * 100) + '% stronger; cold, it\'s ' + Math.round((1 - lb.mood.coldReach) * 100) + '% weaker and stops paying for promo pushes. ' +
              'Between records it sends requests: a single first (deliver it for ' + signed(lb.requests.singleFirst.met) + ' mood and a bigger push on your next record), ' +
              'A&R notes after a weak record (hit their quality bar next time for ' + signed(lb.requests.anr.met) + '), and a release party when a record comes out. ' +
              'Promising and missing hurts more than saying no.',
            '<strong>Ending a deal:</strong> deliver every record you owe (unless they pick up a renewal), buy yourself out, or get dropped. A few weeks later, offers start again.',
            '<strong>What labels open:</strong> any deal opens the Top studio; a mid-size or major label opens the National cities (or reach reputation ' + lb.nationalWithoutLabel +
              '); a major opens arena and festival offers (or a Top 10 record on a smaller label, or reputation ' + lb.bigShowsWithout.reputation + ' and ' +
              lb.bigShowsWithout.fans.toLocaleString('en-US') + ' fans). Once open, they stay open.',
            { tip: 'Read the "What this means for you" box and your manager\'s take on every contract. The worst deals look the best on the first line.' }
          ]
        },
        {
          id: 'housing', title: 'Housing', note: 'Where you sleep changes how you feel.',
          body: [
            'Your home sets your weekly bills and the resting level your morale drifts toward each Sunday. Moving costs ' + h.moveCostWeeks +
              ' weeks of the new place up front, and you can\'t move up while you owe money.',
            { table: { cols: ['Home', 'Each week', 'Morale rests at'], rows: h.ladder.concat(['vacation']).map(function (id) {
              var home = h[id];
              return [home.name + (id === 'house' ? ' (free home studio)' : '') + (id === 'vacation' ? ' (a second home, needs the house)' : ''),
                money(home.weeklyCost), String(home.moraleRest)];
            }) } }
          ]
        },
        {
          id: 'scene', title: 'The music scene', note: 'Go see other bands. You\'ll learn something.',
          body: [
            (b.scene.sizes.reduce(function (sum, size) { return sum + size.count; }, 0) + b.scene.rivals.count) + ' other bands play the same venues, from small-room bands to arena acts. Their shows fill venue calendars (so some nights are taken), their songs ' +
              'fill the charts, and the biggest compete with you for awards.',
            'Three of them are your <strong>rivals</strong>: they start near your level and keep pace with you. Their records chart and they can grab an opening slot you haven\'t answered. ' +
              'The Career screen shows how you compare.',
            '<strong>Tickets:</strong> buy a ticket to another band\'s show from a venue\'s flyer on Book (the ticket price). Going costs ' + b.scene.show.energy +
              ' energy and gives ' + signed(b.scene.show.morale) + ' morale, a little Networking, Musicianship, and Performance, and a better chance to meet someone.'
          ]
        },
        {
          id: 'global', title: 'Going global', note: 'The world is bigger than Millbrook. Go see it.',
          body: [
            'After a tour with shows in ' + b.geography.internationalMinNationalCities + ' different National cities, ' +
              (Object.keys(Game.content.countries).length - 1) + ' countries open up on the <strong>World map</strong>. ' +
              'Tours, the Book screen, and big-show offers can go abroad; auto-booking stays at home. Buzz abroad is counted by country.',
            'International flights take ' + t.internationalFlight.blocks + ' blocks each way and cost ' + money(t.internationalFlight.perPersonOneWay) +
              ' a person; hops between cities in the same country take ' + t.hop.blocks + ' block (' + money(t.hop.perPersonOneWay) + '). Landing after an international flight costs ' +
              t.jetLag.energy + ' energy (jet lag). Your first show abroad unlocks the private jet in the Shop: one price per flight for the whole band, ' +
              t.jet.blocksFaster + ' block faster, and only ' + t.jetLag.withJet + ' energy of jet lag.'
          ]
        },
        {
          id: 'events', title: 'Events and milestones', note: 'Life happens. Answer it.',
          body: [
            'Some mornings something happens: an event with choices on Today. If you don\'t answer, the safe choice is picked at End Day. ' +
              'Events grow with your career: your stage comes from your reputation, each stage has its own events, and the money at stake grows with it.',
            { table: { cols: ['Stage', 'Reputation', 'How often', 'Money at stake', 'For example'], rows: b.events.stageOrder.map(function (id) {
              var st = b.events.stages[id];
              var examples = { starting: 'a broken string, a lesson, overtime', local: 'a radio interview, a wedding gig, a shady promoter',
                touring: 'a sync license, lost luggage abroad, a rival poaching a bandmate', star: 'the halftime show, a tax audit, a tabloid story' }[id];
              return [st.name, st.minReputation + '+', 'about 1 day in ' + Math.round(1 / st.dailyChance), 'x' + st.moneyScale, examples];
            }) } },
            '<strong>Gambles:</strong> some choices are risky, and the card shows the odds (like "60%: the crowd loved it · 40%: it came off petty"). ' +
              'Choices that could cost you a bandmate are marked in red. <strong>Stories:</strong> some events continue days or weeks later (a brand deal\'s ad ' +
              'comes out, a lawsuit goes to trial, a documentary premieres), and what you chose first shapes what comes next. Once an event happens, it won\'t ' +
              'come back for months. And however big the bill, an event never takes more than ' + Math.round(b.events.maxCashShare * 100) +
              '% of the cash you have (small bills up to $' + b.events.costFloor + ' are paid in full), so a bad break hurts but never sinks you.',
            '<strong>Milestones</strong> mark the big steps and each gives ' + signed(mc.milestone) + ' morale (quitting the job gives ' + signed(b.job.quitMoraleBonus) + '):',
            { table: { cols: ['#', 'Milestone', 'How'], rows: Game.content.milestones.map(function (m) { return [String(m.number), m.name, m.trigger]; }) } }
          ]
        },
        {
          id: 'tips', title: mentorFirst + '\'s tips', note: 'Things I wish someone had told me.',
          body: [
            { list: [
              'Rest the day before a show that matters. Tired costs ' + Math.abs(b.gigs.tiredPenalty) + ' points, more than most things you can do.',
              'Keep morale over ' + b.skills.moraleHighThreshold + ' and everything grows faster. Take a full day off every week.',
              'Practice the songs you\'ll play, and open and close with your strongest.',
              'Write early. Originals win more fans, and you need them to record and release.',
              'Post online or hang flyers in the days before a show. Buzz fades ' + Math.abs(b.buzz.fadePerDay) + ' a day, so don\'t do it a week early.',
              'Network and jam to build a band before you need one for clubs.',
              'Keep a cushion for Sunday\'s bills. Debt is a slow trap.',
              'When the room gets easy, move up. You outgrow rooms, and reputation only grows in bigger ones.',
              'Don\'t quit the job until music pays the rent for a few weeks in a row.'
            ] }
          ]
        }
      ];
    }
  };
})();
