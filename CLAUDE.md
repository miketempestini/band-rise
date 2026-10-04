# Band Rise: rules for every session

Band Rise is a browser game about a musician working their way up from open mics to arenas.
The full game design lives in [Design.md](Design.md). It is the source of truth for how the game works
and for every number in it. Read the parts that matter for the current task before changing anything.

The owner is not a developer. Explain plans and results in plain language.

## Before you start and when you finish

- **Start:** read [PROGRESS.md](PROGRESS.md) to see what's built, what's next, and any known issues.
- **Finish:** update PROGRESS.md before the session ends: what you built, what's next, any new known issues.

## Tech rules (non-negotiable)

- Vanilla HTML, CSS, and JavaScript only. No libraries, no frameworks, no npm, no build step.
- The game must run by double-clicking `index.html` in Chrome (a `file://` address, no server).
- Use classic `<script>` tags loaded in order. **Never** use JavaScript modules (`import`/`export`,
  `type="module"`). Modules refuse to load from `file://`.
- Every file attaches what it defines to one global object called `Game`. Each file starts with:
  ```js
  window.Game = window.Game || {};
  ```
  and then adds its piece, for example `Game.rng = { ... }`. No other globals.
- Don't use `fetch()` to load local files. It doesn't work from `file://`. Fixed data goes in `.js` files under `js/content/`.
- Desktop-first layout.

## Architecture rules

1. **Rules are plain functions; screens only draw.**
   A game rule takes the current state (and any inputs) and returns
   `{ state: newState, log: [ ...lines describing what happened ] }`.
   Rules don't touch the page (no `document`, no `window` except `Game`).
   Screens in `js/ui/` only read the state and draw it. They never change game numbers themselves.
   When the player clicks something, the screen calls a rule and redraws with the state it gets back.
2. **All numbers come from `js/balance.js`.** Never put a raw number in rules or screens
   (prices, chances, limits, bonuses). Add it to `Game.balance` with a short comment and use it from there.
   The only exceptions are plain 0 and 1 used as math, not as tunable values.
3. **Randomness only through `js/rng.js`.** Never call `Math.random()`. Rules use the seed saved
   in the state (`state.rngState`) and save the updated seed back into the new state, so results
   are repeatable and reloading can't re-roll a result.
4. **Build only what the current phase asks for.** Don't build ahead, even if it seems easy.
   Note good ideas in PROGRESS.md under "What's next" instead.
5. **Every new rule gets at least one test** in `js/tests/`, listed in `tests.html`.
   Run tests.html and make sure everything is green before finishing.
6. **Write plain, beginner-friendly comments.** Explain *what* a piece of code does and *why*,
   in everyday words. Avoid jargon. If a term is unavoidable, explain it the first time.
7. **Update PROGRESS.md at the end of every session.**

## Folder layout

```
index.html        The game page. Loads scripts in order (see below).
styles.css        All the look and layout.
tests.html        The test page. Open it to see passing/failing tests.
Design.md         The game design (source of truth).
PROGRESS.md       Running log: built, next, known issues.
js/
  balance.js      Every tunable number, grouped by system.
  rng.js          Seeded random number generator (repeatable randomness).
  util.js         Small helpers: clone (copy the state) and clamp (keep a number in range).
  state.js        Builds a brand-new game state (the save data shape).
  save.js         Saving/loading: browser auto-save, export/import files, checking a save is valid.
  main.js         Game.app: holds the current state, switches screens, runs rules, auto-saves.
  content/        Fixed game data that never gets saved: actions, venues, cities, events, names...
  rules/          One file per game system (energy.js, gigs.js, booking.js...). Plain functions.
  ui/             One file per screen (title.js, today.js, calendar.js...). Draw only.
  tests/          test-runner.js plus one test file per system (rng.test.js, gigs.test.js...).
```

## Script load order

Files must load in this order, because later files use things earlier files define:

1. `js/balance.js`
2. `js/rng.js`, `js/util.js`
3. `js/content/*.js`
4. `js/state.js`, `js/save.js`
5. `js/rules/*.js`: money, energy, morale, skills, audience, songs, people, gigs, job, booking, progress, events, recording, merch, offers, sessionWork, travel, actions, planWeek, career, day, debug
   (a file only needs to load before another at page start if it's used while loading; keep this order anyway)
6. `js/ui/*.js` (game page only; `helpers.js`, `topbar.js`, `statsPanel.js`, `actionPicker.js` before `today.js`)
7. `js/main.js` (game page only, always last: it starts the game)

`tests.html` loads 1 to 5, then `js/tests/test-runner.js`, then each `*.test.js` file.
When you add a new file, add its `<script>` tag to **both** `index.html` and `tests.html`
(UI files only go in `index.html`).

## Writing tests

```js
Game.test('what this checks, in plain words', function (t) {
  t.equal(actual, expected, 'optional note');
  t.ok(somethingTrue, 'optional note');
  t.near(decimal, 2.5, 'optional note');        // for decimals (allows tiny rounding differences)
  t.sameContents(objectA, objectB, 'optional'); // for objects and lists
});
```

Use a fixed seed in tests so results are the same every run.
Wrap each test file in `(function () { ... })();` so its helper functions don't become globals.
Tests that touch localStorage must pass their own key (never the real save key).
Open tests.html straight from the file (or with headless Chrome's `--dump-dom`) to check results.

## How the pieces fit (built in Phase 1)

- **Rules** return `{ state, log }`. `Game.rules.day.endDay` also returns `weekEnded`.
- **All money** goes through `Game.rules.money.earn` / `spend` (with a category name). `spend`
  takes family loans automatically, and both record the money for the weekly summary.
- **Blocking actions while in debt:** add the action id to `Game.balance.debt.blockedActions`
  and check `Game.rules.money.blockedByDebt(state, actionId)` (returns a reason or null).
- **Screens** have `render(root, app)`. They draw with HTML strings and connect buttons with
  `data-action="name"` + `Game.ui.helpers.bind`. They call methods on `Game.app` to change things.
- **Debug panel:** add buttons in `js/ui/debugPanel.js`, with the logic as rules in `js/rules/debug.js`.

## How the pieces fit (added in Phase 2)

- **Actions** are data in `js/content/actions.js` (costs, effects, flags; numbers from balance.js).
  To add an action: add an entry there, and if it has a new kind of effect, handle it in
  `Game.rules.actions.perform` and in `option` (for the picker's expected effect).
- **Planned actions** live in `state.schedule[day][block]` → `state.entries[id]`, and are removed at End Day.
- `Game.rules.actions.dayPlan(state)` walks today's blocks in order and gives energy/cash before and after each.
  Use it for any "can I afford this at that point in the day?" check.
- **End Day** builds `state.lastDayReport` (`{ day, blocks: [{ block, title, lines }], overnight: [...] }`),
  which the Day results screen draws. New nightly effects should add their lines to `report.overnight`.
- **Morale** changes should go through `Game.rules.morale.change` so Burned out stays up to date.
- **Skills** grow through `Game.rules.skills.train` (it also resets the rust clock).
- **Buzz**: `Game.rules.audience.addBuzz` / `fadeBuzz`. Cities are content in `js/content/cities.js`.

## How the pieces fit (added in Phase 3)

- **Songs** live in `state.songs` (see `js/rules/songs.js` for the shape). The song in progress is the
  original whose `quality` is still `null`. `Game.rules.songs.playable(state)` lists finished songs.
- **Randomness in rules:** `var rng = Game.rng.create(s.rngState); ... s.rngState = rng.getState();`
  (see `finishSong` or `suggestTitle`). Never roll without saving the new position back.
- **Actions that need a song** set `needsSong: true`; the picker then asks for a song and the entry
  stores `songId`. `Game.rules.actions.perform(state, actionId, songId)`.
- **Finished songs** are listed in `lastDayReport.finishedSongs`; `Game.app.startReveals` shows a
  reveal screen for each before Day results.
- **Name lists** (covers, song titles; people later) are in `js/content/names.js`.

## How the pieces fit (added in Phase 4)

- **Venues** are content in `js/content/venues.js`; per-tier rules (foot traffic, score penalty, ticket)
  are in `balance.venues.tiers`.
- **Gigs:** `Game.rules.gigs.playGig(state, venueId, songIds, energyAtStart)` does everything (crowd, score
  parts, luck, result, fans, buzz, reputation, morale, tips, tightness, skills, stats) and saves the full
  breakdown in `state.lastGig`. Score parts are a list of `{ id, value }`; labels and tips are in
  `js/content/gigText.js`. To add a modifier later, add a part in `scoreParts` and a label in gigText.
- **Actions with a set** use `setSize`; the picker's set step stores `songIds` on the entry.
- **After End Day** the order is: gig result (crowd meter, then result) → song reveals → Day results →
  weekly summary. See `Game.app.afterDayChange` / `afterGigResult`.
- **Debug forcing** lives in `state.debug.forceNextGig`; the result screen shows an honest "Debug" score part.

## How the pieces fit (added in Phase 5)

- **People** live in `state.people` (shape at the top of `js/rules/people.js`); the band is `state.band`.
  Status is 'contact', 'member', or 'former'. Trait words are in `js/content/people.js`, trait numbers in
  `balance.traits`.
- **Band effects:** `Game.rules.people.bandMusicianship(state)` feeds the gig score; `traitGigBonus` is the
  "Band traits" part; `payShares` splits any gig pay (use it for every kind of gig pay in later phases).
  `recordGig` must be called after every gig so members get relationship, pay, and satisfaction tallies.
- **Satisfaction** changes go through `Game.rules.people.changeSatisfaction(state, id, amount, reason)` so
  the People screen can show why. The Sunday check is `weeklyCheck` (called from End Day before the week closes).
- **Actions done with someone** set `needsPerson: 'anyone' | 'member'`; the entry stores `personId`.
  Rehearse uses `songsMax` (pick 1 to 4 songs). Network has `effects.meet`.

## How the pieces fit (added in Phase 6)

- **Navigation:** the top bar has a row of tabs (`data-nav`), connected once in `Game.app.render`
  (`Game.ui.topbar.bind`). Screens don't bind Songs/People/Settings themselves. `Game.app.navigate(screen)`
  remembers where you came from; a screen's Back button calls `Game.app.goBack(screen)`.
  Pass `app.screen` to `Game.ui.topbar.html(state, app.screen)` so the right tab is highlighted.
- **Booked shows** are calendar entries with `type: 'gig'` (see `js/rules/booking.js`). They play in
  `Game.rules.day.endDay` via `Game.rules.booking.playShow`. Planned actions can't overwrite them.
- **Booking requests** live in `state.requests`; replies become `state.inbox` messages (`kind: 'reply'`).
  `processReplies` / `expireOffers` run overnight.
- **Gig pay:** `playGig(..., { deal, sessionPlayers })` pays through `Game.rules.booking.payFor` and splits with
  `payShares`. Money categories: `tips`, `gigPay`, `sessionPlayers`, `sessionRefund`.
- **Job:** `Game.rules.job` (scheduledOn / worksOn / paidOn, days off, standing, Look for work).
  `isJobBlock` respects days off.
- **Unlock banners:** `Game.rules.progress.checkUnlocks` (runs every End Day) adds to `state.toasts`;
  add new unlocks to its list.
- **Planning ahead:** `plan(state, block, actionId, choice, day)` and `clear(state, block, day)` take an optional
  day. Internally they run on `Game.rules.actions.viewForDay(state, day)`, a throwaway copy where `state.day` is
  the planned day and `planningAhead` is true (which skips energy/cash checks in `option`). Never save a view.
  The picker draws from `Game.app.pickerView()`.

## How the pieces fit (added in Phase 7)

- **Events** are content in `js/content/events.js` (`when`, optional `setup`, `text`, `choices` with one `safe`
  choice). `Game.rules.events` rolls one each morning (`roll`, at the end of End Day), describes and applies
  effects, auto-answers with the safe choice at the next End Day, and runs temporary effects (`state.effects`:
  `gigScore` shows as the "Setbacks" score part; `dailyEnergy` applies overnight). New effect kinds go in
  `describe` and `apply`.
- **Milestones**: names in `js/content/milestones.js`; live checks in `Game.rules.progress.milestoneChecks`.
  `checkUnlocks` gives the banner and +10 morale (call it after anything that could reach one outside End Day).
- **Tutorial** tips: `js/content/tutorial.js`; elements they point at carry `data-tour="..."`.
- **Time savers**: `Game.rules.day.skipToNextCommitment` and `Game.rules.actions.repeatEvening`.
- **Balance check**: `js/tests/balance.sim.js` runs on tests.html after the tests (100 runs x 21 days). Its
  `planDay` is the "simple, sensible player"; update it when new systems change what a sensible player does.
- **Recording (Phase 8)**: `Game.rules.recording` (studio requests and sessions, recording quality, releases,
  streaming). Studio sessions are calendar entries with `type: 'studio'` (commitments like shows; the action
  picker can't overwrite them). Booking requests can be venue emails (`request.venueId`) or studio bookings
  (`request.studio`): check which before reading their fields. `Game.rules.merch` runs the Shop and gig sales.
- **Offers (Phase 9)**: `Game.rules.offers` rolls opening slots (daily) and residencies (Mondays), handles
  residency counter-offers (`processCounters`, next morning), and books their shows (`deal: 'opening' | 'residency'`,
  each with a `fee`). `Game.rules.booking.noShowReason` is the one place that decides a no-show.
- **Co-writing**: Write has `optionalCoWriter`; the picker's person step adds "Write alone". `songs.write(state,
  songwriting, coWriterId)` and `finishSong` handle the bonuses.
- **Balance check**: tests.html now also runs a 90-day check (`renderLong`, 50 runs) with `planLongDay`.
- **Numbers in content and text (after the rules review)**: content files read their numbers from balance.js
  (events: `balance.events.<eventId>`; venue fees: `balance.venues.guarantees`). Any number shown in on-screen
  text (descriptions, hints, tips) is built from balance.js too, never typed into the sentence.
- **Shared screen logic lives in rules**: e.g. `money.maxPayBack` / `sundaysUntilGameOver` / `weekTotals`,
  `recording.streamingEstimate`, `offers.rateOptions`, `job.undoDayOffProblem`, `booking.blockContents`,
  `actions.pickedSongsProblem`, `career.canAdjust`. If a screen needs to work something out, add a rule.
- **Day job (Phase 10)**: going part-time and quitting wait in `player.job.pending` ({ status, day }) until next
  Monday; `Game.rules.job.statusOn(state, day)` gives the job on any day (use it, not `job.status`, for future days).
  `applyPending` runs each morning in End Day. The quit screen reads `job.quitSummary` (music income categories are
  in `balance.job.musicIncomeCategories`). Milestones 8 and 11 are live; `progress.milestoneMorale` gives quitting +15.
- **Session work (Phase 10)**: `Game.rules.sessionWork` (offers in the Inbox, kind `sessionWork`; jobs in
  `state.sessionWork`; calendar entries `type: 'sessionWork'`, commitments like studio time; Sunday "Session credits").
  Entry types are now `'action' | 'gig' | 'studio' | 'sessionWork' | 'travel'`: anything that treats a booked block
  as taken must handle every booked kind.
- **Plan week (Phase 10)**: `Game.rules.planWeek` (applyWeek, templates in `state.weekTemplates`). It plans through
  `actions.plan`, so every normal check applies.
- **On the road (Phase 11)**: `Game.rules.travel`. Out-of-town shows get travel entries (`type: 'travel'`) and a
  trip in `state.trips`; call `travel.addShow` to book one, and `travel.rebuild` after any out-of-town show changes
  (trips that have started are fixed). `travel.check(state, venueId, day)` says if a date works and which workdays
  it needs off. `booking.blockTaken(..., ignoreAway)` also reports travel and "On the road"; `travel.tripAt` says if
  you're away. Actions you can do away are marked `onTheRoad` in actions.js. Cities and their venues are content;
  their fan ceilings and venue fees are in balance.js. Fan gains go through the ceiling (`audience.addFans`).
- **Emailing a venue** is `booking.emailVenue` (instant, 5 energy, no block). There's no "Email a venue" action now.
- **Publishing**: the game is served by GitHub Pages from the `main` branch at
  https://miketempestini.github.io/band-rise/ (pushing to main updates it in about a minute).
  `.nojekyll` makes Pages serve the files as they are.

## Saving

The whole game is one plain object (see "Saved game state" in Design.md). Saving means
storing that object in the browser's localStorage (key in `balance.save.storageKey`).
Keep the state plain data only: no functions, no DOM elements, nothing that can't go through `JSON.stringify`.
When you add a field to the state, add it in `Game.state.createNew`. Save checking compares against
it, so older saves missing the field will be refused. If that matters, bump `balance.save.version`
and add an upgrade step in save.js.
