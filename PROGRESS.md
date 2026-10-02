# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

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
- Phase 3 (to be defined). Natural next steps from Design.md: songs (Write, catalog, tightness) and the
  first open mic, so buzz, Performance, and fans start to matter.
- Held back on purpose: job standing changes (+1 per shift), vacation days, call in sick,
  "Repeat yesterday" and Plan Week shortcuts, meeting people while networking (Phase 5).

## Known issues / open decisions
- **Buzz can't build from posting alone.** One Post online adds about +1.25 at Promotion 5, but buzz fades
  2 every night, so it's gone by morning. Flyers or several posts a day are needed. Kept the Design.md numbers
  on purpose; revisit when gigs make buzz matter (options: smaller fade, bigger post bonus, or fade only above some level).
- Morale now has ways up (Rest, days off, Sunday drift), but a full-time week still costs about 10. Weekends
  off roughly balance it.
- A skill can start at 33 (30 points + the instrument's +3). That's above 30, so it rusts after 14 days if
  unused. Performance can't be used yet (it grows from playing live, which comes with gigs), so a 33 Performance
  will slip back to 30 over a few weeks. Fine for now; worth a look when gigs arrive.
- Skills set with the debug panel keep their old "last used" day, so they may start rusting right away.
- Older saves will be refused if a later phase adds new state fields without a version bump (the upgrade step
  in save.js fills in missing fields automatically when the version goes up).
- With no cap on debt, cash never goes below $0: Mom and Dad always cover the gap.
- Design.md still has no numbers for these (they're `null` in balance.js): cover gig unlock (reputation and
  musicianship), and session work (requirements, studio blocks, streaming share).
- Not decided: whether or how family loans get paid back automatically (for now only by hand with Pay back).
- Far travel is stored as 3 blocks each way ("a full day").
