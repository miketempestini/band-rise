# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

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
- Phase 2 (to be defined). Likely: the action picker for free blocks (Practice, Write, Rest, Network)
  and skills, so evenings and weekends have real choices.
- Ideas held back on purpose (not in Phase 1): job standing changes (+1 per shift), Sunday morale drift,
  Exhausted/Tired effects, vacation days, the Day results screen.

## Known issues / open decisions
- **Morale only goes down right now.** Each workday costs 2 morale, and the things that raise it (rest, hanging out,
  gigs, and the Sunday drift toward 50) aren't built yet. After about 6 weeks morale reaches 0. It has no effect yet,
  but it will once skills arrive. Sunday drift should probably come in the next phase.
- With no cap on debt, cash never goes below $0: Mom and Dad always cover the gap.
- Older saves will be refused if a later phase adds new state fields without a version bump and upgrade step.
- The debug panel floats in the bottom-right corner and can cover part of the side panels on smaller windows.
- Design.md still has no numbers for these (they're `null` in balance.js): cover gig unlock (reputation and
  musicianship), and session work (requirements, studio blocks, streaming share).
- Not decided: whether or how family loans get paid back automatically (for now only by hand with Pay back).
- Far travel is stored as 3 blocks each way ("a full day").
