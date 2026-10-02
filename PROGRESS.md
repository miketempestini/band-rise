# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

### Session 5b: Practice all songs + sorting (2026-10-02)
- Practice's song step has **Practice all songs** on top: +1 tightness on every finished song
  (`balance.songs.tightness.practiceAllGain`) and they all count as played, so none of them fade.
  Musicianship still grows as normal. Planned as `songId: 'all'`; the block card shows "All songs".
- Sort buttons on the Practice song list: Tightness ↑ (default), Tightness ↓, Name A–Z, Last played
  (longest ago first). The choice is remembered while the page is open. Rule: `Game.rules.songs.sortSongs`.
- Show toggle on the same list: All / Covers / Originals (`Game.rules.songs.filterSongs`).
- 105 tests passing.

### Session 5: Phase 4, open mics and the gig result (2026-10-02)
- **Venues** (`js/content/venues.js`): The Rusty Nail (Tuesday open mic) and Bean There Cafe (Thursday).
- **Play the open mic** action: Evening only, on open mic nights (other times it's greyed out with the schedule).
  15 energy. A set step lists every finished song with tightness, quality, stars, and last played; the best 2
  (quality + tightness) are pre-ticked. Exactly 2 must be picked; ticking a third swaps out the earliest pick.
  Today also says "Open mic tonight at ..." on those days.
- **Gig rule** (`js/rules/gigs.js`): crowd (expected x 0.85-1.15), score (0.35 Musicianship + 0.25 Performance +
  0.20 avg quality + 0.20 avg tightness), modifiers (instrument tier, Tired -10, morale ±5, venue tier),
  luck -10..+10, bad-luck protection after two Rough results.
- **Results:** fans (conversion x originals factor 0.75-1.25 x room under the city ceiling, random rounding),
  buzz, reputation (x venue tier multiplier, gains shrink with reputation, never below 0), morale (Rough -8,
  Great +8, Legendary +15), tip jar (Rough $0-5, Solid $0-20, Great $10-30, Legendary $20-40), skills from
  playing live, and **+10 tightness per song played** (owner's change; Design.md updated from +5).
- **Gig result screen:** 2.5-second crowd meter (skippable), then headline, crowd bar, score breakdown bar with
  a labeled legend (negatives in red), a scale showing where each result starts, the rewards, and one tip
  for the biggest thing that hurt (tired, low morale, bad luck, loose songs).
- **Stats:** gigs played, best result, biggest crowd (on the Stats panel). Tips show in the weekly summary.
- **Debug:** "Next gig: Rough / Legendary" (shown as a visible "Debug" part of the score).
- **Saves:** version 4 (adds `lastGig`, `debug`). **Tests:** 101 passing (gigs.test.js is new).

### Session 4: Phase 3, songs and songwriting (2026-10-02)
- **Starting catalog:** 5 covers picked at random (with the saved seed) from 12 made-up titles in
  `js/content/names.js`. Quality 50, tightness 60.
- **Write action:** -10 energy, +2 Songwriting (base). Adds 12 + Songwriting/5 progress to the song in progress
  (starts a new one if none). At 100: quality = 15 + 0.6 x Songwriting + luck 0-25 + 5 if morale > 70,
  rounded; stars = quality/20 rounded up (1-5); +5 morale; tightness 30; random title suggestion.
  Burned out stops only the skill gain, not progress. The picker previews "+14 progress (28 → 42)" or "Finishes!".
- **Song reveal screen** after End Day (before Day results): stars with a small pop animation, quality, a
  "Base 15 + Songwriting 7.8 + luck 18 = 41" line (plus "Lucky night!" or a mood tip), and a name box
  with a 🎲 Another button.
- **Practice** now asks which song (second step in the picker; loosest song tagged): +10 tightness (max 100)
  plus the Musicianship gain. Practicing counts as playing the song.
- **Tightness fading:** a song unplayed for 7 days loses 3 that night, then 3 more each week, never below 20.
  Shown in the Day results "Tonight" list.
- **Songs screen** (new Songs button in the top bar): song in progress with progress bar and blocks left;
  catalog table with title, Cover/Original, stars, quality, tightness bar, days since last played ("fading" in red).
- **Debug:** "Finish song now" (starts one if needed) and shows the reveal.
- **Saves:** version 3. Older saves get their 5 starting covers when loaded.
- **Tests:** 85 passing (songs.test.js is new). One career test changed: the random generator position now
  moves at career start, because the covers are picked randomly.

### Session 3c: Skill changes on the weekly wrap-up (2026-10-02)
- The weekly summary has a **Skills this week** panel: each skill's current value and its change for the week
  (green +, red -, grey ±0), so you can see what your week's choices did.
- `thisWeek.startSkills` is recorded at the start of each week; each ledger entry now saves `startSkills` and
  `endSkills`. The week now closes at the very end of Sunday night, so Sunday-night rust counts in that week.
- Weeks saved before this change simply don't show the panel. 69 tests passing.

### Session 3b: Starting skill points (2026-10-02)
- New career is now two steps: name + instrument, then a **Choose your skills** page (`js/ui/chooseSkills.js`).
- Spend 50 points across the five skills (0 to 30 each, numbers in balance.js). Start career stays greyed out
  until all 50 are spent. Each skill shows a short description and its final starting value.
- The instrument's +3 bonus still applies on top (shown on its skill, like "+3 from Guitar, starts at 23").
- Helpers: Suggested build (the old 20/10/10/5/5 defaults), Randomize, Reset, and -5/-1/+1/+5 buttons
  (+5 adds as much as it can, up to 5). Back keeps your name, instrument, and points.
- Rules in `js/rules/career.js`: `allocationProblem`, `adjustAllocation`, `randomAllocation`, `suggestedAllocation`.
  `startCareer(name, instrument, seed, allocation)`; leaving out the allocation uses the Suggested build.
- Design.md updated (Skills section, Setup, Screens table). 67 tests passing.

### Session 3: Phase 2, actions, energy, morale, and skills (2026-10-02)
- **Actions** (`js/content/actions.js`): Practice, Rest, Network, Post online, Hang flyers. Each defines blocks,
  energy cost, money cost, requirements (none yet), and effects, all from balance.js. Empty blocks stay "Free time".
- **Action picker:** click a free or planned block. Shows money cost, energy cost, and the exact expected effect
  (like "+2.5 Musicianship"). Actions you can't afford in money or energy by that point in the day are greyed out
  with the reason. Option to clear back to Free time.
- **Block cards** show energy before → after each block, with a Tired badge.
- **Skills** (`js/rules/skills.js`): growth formula with the morale and Tired multipliers. Stored as decimals,
  shown as whole numbers with a thin bar toward the next point. Rust: above 30 and unused 14 days loses 1, then
  1 a week, never below 30. Warning icon at 10 days ("Rust soon"), "Rusting" once it starts.
- **Energy** (`js/rules/energy.js`): Tired under 25 (half skill gains). Optional actions need enough energy.
  Exhausted when the day job drains you to 0: only +30 overnight and -10 morale.
- **Morale** (`js/rules/morale.js`): job shift -2, Rest +5, full day off +10 (no job and only Rest/Free time),
  Sunday drift 3 toward 50, Burned out below 15 (Practice gives no skill) until back above 25.
- **Hometown** "Millbrook" (`js/content/cities.js`) with fans (0 for now) and buzz. Buzz fades 2 a night.
  Post online adds 1 + Promotion/20; flyers add 3 x (1 + Promotion/100). Both also train Promotion.
- **Day results screen** after every End Day: one line per block, plus a "Tonight" list (shift, day off,
  Exhausted, payday, bills, drift, sleep, buzz fade, rust). On Sunday it leads into the weekly summary.
- **Stats panel** on Today: skills with bars and rust icons, energy, morale (Burned out badge), buzz, fans.
  Replaced the "Last night" panel.
- **Debug panel** (now bottom-left): set any skill, set buzz (plus everything from Phase 1).
- **Saves:** version 2. Version 1 saves upgrade automatically (missing fields filled in).
- **Tests:** 62 passing. Test runner gained `t.near` for decimals. Two Phase 1 tests updated on purpose
  (the job can now cause Exhausted; a free Saturday now gives +10 morale).

### Session 2: Phase 1, skeleton, saving, and the day loop (2026-10-02)
- **Screens:** Title (Continue, New career, Import save), New career (name + Guitar/Keys/Bass with
  its +3 skill bonus), Today (dashboard), Weekly summary, Settings (export/import), Game over.
- **Today screen:** top bar (cash, debt + Pay back, energy and morale bars, reputation, "Week 1, Monday",
  days until rent, Settings). Three block cards: weekday Morning/Afternoon locked as "Day job", the rest "Free time".
  Side panels: This week (earned, pay coming Friday, bills Sunday, projected cash), Debt (with Pay back form),
  Last night (log from the last End Day).
- **End Day** (`js/rules/day.js`): job blocks cost 20 energy each, empty blocks +5 each, -2 morale per shift,
  Friday payday ($110 per shift), Sunday bills ($400 from the housing table), debt check, then +50 energy overnight.
- **Money** (`js/rules/money.js`): all money goes through earn/spend. Spending below $0 triggers $1,000 loans from
  Mom and Dad, as many as needed (no cap). Pay back any whole amount up to cash/debt.
  `blockedByDebt(state, actionId)` + `balance.debt.blockedActions` let later phases block actions while in debt.
- **Game over:** on the 6th Sunday in a row with debt above $3,000, shows the exact message from Design.md,
  deletes the browser save, and offers a button back to the title screen.
- **Saving** (`js/save.js`): auto-save after every End Day (also after New career, Pay back, debug changes, import).
  Continue loads it. Export downloads `band-rise-weekN.json`; Import loads one. Broken or missing saves show a
  friendly message.
- **Debug panel:** add `?debug` to the address. +$500, -$500 (goes through the loan rule), skip 7 days, set energy/morale.
- **Tests:** 31 passing (rng, career, money, day, save, debug).
- Design.md and balance.js updated: no $5,000 debt cap. Separate rent/living numbers removed from balance.js
  (the $400 comes from the housing table).
- New state fields: `thisWeek` (running weekly totals), `lastDayLog`, `gameOver`, `player.debtWeeksOverLimit`,
  `player.job.unpaidShifts`. Debt uses `player.loanOwed`.
- `.claude/launch.json` serves the folder at http://localhost:8765 for the Claude browser preview (the game itself
  still runs by double-clicking index.html).

### Session 1: Project setup (2026-10-02)
- `CLAUDE.md`, `index.html`, `styles.css`, `js/balance.js`, `js/rng.js`, `js/state.js`, folders, `tests.html`
  with a no-library test runner, git repo (pushed to github.com/miketempestini/band-rise, private).

## What's next
- Phase 5 (to be defined). Likely next from Design.md: meeting people (Network and open mics), contacts,
  and the first bandmate; then booking small rooms once reputation reaches 10 (milestones).
- Held back on purpose: meeting people at open mics (20%), milestones (First open mic, First original, Small rooms),
  booked venues and gig pay, merch, room-fullness modifiers (they only matter for rooms with a capacity),
  co-writing, recording, renaming songs from the Songs screen.
- Also not built yet: job standing changes, vacation days, call in sick, "Repeat yesterday" and Plan Week shortcuts.

## Known issues / open decisions
- **Balance check:** at starting skills a cover open mic scores about 32 (22 to 42), so mostly Solid: about
  1 fan and +2 reputation a night. Two open mics a week reach reputation 10 in roughly 2.5 weeks, matching
  Design.md's first-three-weeks target.
- **Buzz can't build from posting alone.** One Post online adds about +1.25 at Promotion 5, but buzz fades
  2 every night, so it's gone by morning. Flyers or several posts a day are needed. Kept the Design.md numbers
  on purpose; revisit when gigs make buzz matter (options: smaller fade, bigger post bonus, or fade only above some level).
- Morale now has ways up (Rest, days off, Sunday drift), but a full-time week still costs about 10. Weekends
  off roughly balance it.
- A skill can start at 33 (30 points + the instrument's +3). That's above 30, so it rusts after 14 days if
  unused. Performance can't be used yet (it grows from playing live, which comes with gigs), so a 33 Performance
  will slip back to 30 over a few weeks. Fine for now; worth a look when gigs arrive.
- If the game is closed during a song reveal, the song keeps its suggested name and the reveal isn't shown
  again (rename on the Songs screen isn't built yet).
- Debug "Skip 7 days" doesn't show song reveals (songs finished while skipping keep their suggested names).
- Skills set with the debug panel keep their old "last used" day, so they may start rusting right away.
- Older saves will be refused if a later phase adds new state fields without a version bump (the upgrade step
  in save.js fills in missing fields automatically when the version goes up).
- With no cap on debt, cash never goes below $0: Mom and Dad always cover the gap.
- Design.md still has no numbers for these (they're `null` in balance.js): cover gig unlock (reputation and
  musicianship), and session work (requirements, studio blocks, streaming share).
- Not decided: whether or how family loans get paid back automatically (for now only by hand with Pay back).
- Far travel is stored as 3 blocks each way ("a full day").
