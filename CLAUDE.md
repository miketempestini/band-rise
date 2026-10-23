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
- Desktop-first layout, plus a phone layout that must never change the desktop (see "The phone layout" below).

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
index.html        The game page. Loads every file from the list in js/files.js (see below).
styles.css        All the look and layout (desktop).
mobile.css        The phone layout's extra rules (only loaded on screens up to 700 pixels wide).
tests.html        The test page. Open it to see passing/failing tests.
assets/           Pictures (title, backdrops, venues, portraits) and fonts (with their licenses).
test-saves/       Save files for testing (late-career.json: a rich, famous, everything-unlocked career; import it).
                  late-career.js is the same save as a script, for the screens test. Regenerate both together.
Design.md         The game design (source of truth).
PROGRESS.md       Running log: built, next, known issues.
js/
  files.js        The list of every file to load, in order, and the version tag (both pages use it).
  balance.js      Every tunable number, grouped by system.
  rng.js          Seeded random number generator (repeatable randomness).
  util.js         Small helpers: clone (copy the state) and clamp (keep a number in range).
  state.js        Builds a brand-new game state (the save data shape).
  save.js         Saving/loading: browser auto-save, export/import files, checking a save is valid.
  app/            Game.app: core.js holds the current state, switches screens, saves, and runs the End Day flow;
                  the other files add each area's actions (booking, calendar, shop, bigTime, people...).
  main.js         Starts the game. Loads last.
  content/        Fixed game data that never gets saved: actions, venues, cities, events, names...
  rules/          One file per game system (energy.js, gigs.js, booking.js...). Plain functions.
  ui/             One file per screen (title.js, today.js, calendar.js...). Draw only.
  tests/          test-runner.js plus one test file per system (rng.test.js, gigs.test.js...).
```

## Script load order

Every file is listed once, in order, in **`js/files.js`**. Both pages load that list (index.html and tests.html each
fetch `files.js` fresh, then write classic `<script>` tags for the list, each with `?v=<tag>`). Order:

1. `Game.files.game`: `js/balance.js`; `js/rng.js`, `js/util.js`; `js/content/*.js`; `js/state.js`, `js/save.js`;
   `js/rules/*.js` (money, finances, housing, energy, morale, skills, audience, songs, people, gigs, job, booking,
   progress, events, recording, streaming, scene, merch, offers, sessionWork, travel, manager, tours, label, bigShows, awards, actions,
   planWeek, career, day, debug)
2. `Game.files.screens`: `js/ui/*.js`, then `js/app/core.js` and the other `js/app/*.js` files
3. `Game.files.start`: `js/main.js` (game page only, always last: it starts the game)

`tests.html` loads 1 and 2 (not main.js, so nothing starts), the late-career test save, then
`js/tests/test-runner.js` and each `*.test.js` file (those are listed in tests.html).
**When you add a game, screen, or app file, add it to `js/files.js` only.** Test files go in tests.html.

**Publishing:** change `Game.files.tag` in js/files.js before every publish. It starts with "v" + the save version
(a test checks that), then the date and a letter, like `v18-2026-10-20a`.

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
- **End Day** builds `state.lastDayReport` (`{ day, blocks: [{ block, title, lines }], overnight: [...], summary }`),
  which Today's Previous day box and its pop-up draw. New nightly effects should add their lines to `report.overnight`.
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
- **After End Day** the order is: gig result (crowd meter, then result) → song reveals → weekly summary (Sunday) →
  back to Today. There's no Day results screen anymore: Today's "Previous day" box shows `lastDayReport.summary`
  (built by `Game.rules.day.summary` in End Day), and clicking it opens the full readout as a pop-up
  (`Game.ui.dayResults`). See `Game.app.afterDayChange` / `afterGigResult`.
- **Debug forcing** lives in `state.debug.forceNextGig`; the result screen shows an honest "Debug" score part.

## How the pieces fit (added in Phase 5)

- **People** live in `state.people` (shape at the top of `js/rules/people.js`); the band is `state.band`.
  Status is 'contact', 'member', or 'former'. Trait words are in `js/content/people.js`, trait numbers in
  `balance.traits`.
- **Band effects:** `Game.rules.people.bandMusicianship(state)` feeds the gig score; `traitGigBonus` is the
  "Band traits" part; `payShares` splits any gig pay (use it for every kind of gig pay in later phases).
  `recordGig` must be called after every gig so members get relationship, pay, and satisfaction tallies.
- **Satisfaction** changes go through `Game.rules.people.changeSatisfaction(state, id, amount, reason)` so
  the People screen can show why (or `satisfactionOn`, below). The Sunday check is `weeklyCheck` (called from End Day
  before the week closes).
- **Copy once in loops (added later, for speed):** a late save is hundreds of KB, and every `Game.util.clone` copies all
  of it. A rule that changes many cities, songs, or bandmates should copy the state once, then use the helpers that
  change that copy directly: `audience.buzzOn(s, cityId, amount)`, `songs.tightenOn(s, songId, amount)`,
  `people.interactOn(s, id, gain)`, `people.satisfactionOn(s, id, amount, reason, merge)`. Never pass them a state you
  didn't copy yourself. Old records are dropped nightly by `day.pruneHistory` (`balance.history`): new lists that grow
  every day or week need a cleanup there too.
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
- **The big time (Phase 12)**: `Game.rules.manager` (hiring, `cutOf`, `calendarWeeks`/`horizonDay`, auto-booking,
  tour requests and proposals), `Game.rules.label` (offer, advance, `splitStreaming`), `Game.rules.bigShows` (arena and
  festival offers, deals 'arena' | 'festival' with a fee), `Game.rules.awards` (nominations and the ceremony). They run each
  morning from End Day. `booking.dateProblem` is the one check for "can a show be on this date" (window, horizon, block,
  travel). Production costs: `booking.productionCost`. Flights: `travel.isFlight` / `legGas(from, to, state)`.
- **Housing (Phase 13)**: `Game.rules.housing` (`weeklyBills`, `restingLevel`, `move`, the vacation home). Always use
  `housing.weeklyBills(state)` for rent, never `balance.housing[...]` directly. Fame: `progress.fame` / `fameLadder`;
  the career card's numbers: `progress.careerCard` (drawn by `Game.ui.careerCard` on a canvas).
- **Screens**: every screen uses the same header (`.screen__head`: title on the left, "← Back" on the right), panels with a
  `.panel__title`, and no emoji (the look comes from the design system below, not from icons).
- **Manager and touring upgrades**: `manager.dailyPosts` (nightly), tour ads (`state.adCampaigns`, `manager.processAds`,
  `adsRunning` stops buzz fading), `manager.proposalEstimate(state, messageId, ads)`, word of mouth in `travel.afterShow` and
  `travel.isTourShow` (fanRate bonus in `booking.playShow`), road costs split with `travel.yourShareOf`, and production via
  `booking.productionCost(venue, deal, pay)`.
- **Finances (money records)**: every dollar of your cash goes through `money.earn` / `money.spend` (pass
  `{ tripId }` as spend's 4th argument for trip costs), which also log it for the Finances tab. Money that isn't
  yours (a show's gross, the manager's cut, bandmates' pay and travel shares, the label's cut) is logged with
  `Game.rules.finances.add(s, { flow: 'band', ... })`. Records are kept for 92 days. New money flows must do one or
  the other. Category names live in `js/content/finance.js`.
- **Dates**: day numbers are real dates (day 0 = Monday, January 5, 2026, in `balance.time.startDate`). Show dates with
  `Game.rules.day.dateLabel` ("Saturday, March 14"), `shortDate` ("Sat, Mar 14"), `longDate` (with the year),
  `weekLabel` ("Mar 9 – 15"), or `spanLabel`. Never show week numbers as dates; `weekNumber` is only for counting.
  Yearly things use `isNewYear` and real months (awards: `awards.isNominationsDay` / `isCeremonyDay`).
- **Two-year balance check**: `Game.balanceSim.renderYears` runs only on request (the button on tests.html, or
  `tests.html?years`); it takes about 5 minutes headless.
- **Pictures and fonts** live in `assets/` (`title-stage.jpg`, `backdrops/`, `venues/`, `portraits/`, `fonts/` with
  licenses) and are loaded by relative paths, which works from `file://`. Which venue painting goes with which tier and
  the portrait list are content in `js/content/art.js` (`venueSrc`, `portraitSrc`); screen backdrops are CSS classes
  (`.backdrop--today`, `--people`, `--songs`, `--map`, `--shop`, `--openmic`). The title screen's look and intro are in
  styles.css (`.title-screen--home`).
- **Look and feel (the "backstage" design system)**: each screen is drawn as a real object a band uses (day sheet,
  clipboard, wall planner, backstage passes, flyers, settlement sheet, green-bar printout, price tags, road map). Rules
  for keeping it consistent:
  - Colors, fonts, and sizes are variables at the top of styles.css (`--house`, `--case`, `--paper`, `--ink`, `--amber`,
    the spike-tape colors `--tape-show / -studio / -money / -job / -event`, `--font-body / -head / -hand / -logo`,
    `--size-xs` to `--size-4xl`). Use them; don't type new hex colors for UI.
  - Paper is the one bold thing: put `paper` on a document-like element and the text variables switch to ink inside it
    (pop-ups get the same through `.modal`). Everything else is a quiet `.panel` (road case).
  - Spike tape colors mean kinds of things: yellow shows and travel, blue studio and business, green money and session
    work, orange the day job, pink events. Reuse them when something new needs a kind color.
  - Fonts: Barlow (reading), Barlow Condensed (headings, numbers on readouts), Permanent Marker (only handwritten things),
    Russo One (only the chrome logo). Headings are sentence case, not uppercase labels.
  - Helpers: `Game.ui.helpers.ledMeter` (top bar meters; `balance.ui.ledSegments`), `artBanner` (a painting across the
    top of a panel; use with `.panel--art`).
  - Motion only where it means something, and every animation must stop under `prefers-reduced-motion` (a global rule
    at the bottom of styles.css; JavaScript animations check `matchMedia` like the gig crowd meter).
  - Screens that redraw often must not replay entrance animations: remember what was shown on `Game.app` (like
    `daySheetDay` and `titleIntroPlayed`).
- **Tour names**: a tour request can carry a `name` (optional; `manager.tourName` trims it, blank means none). It goes on
  the proposal (`m.data.name`), each booked show (`entry.tourName`), the show's finance record (`tourName`), and
  `state.tours` (every accepted tour: { id, name, cities, firstDay, lastDay, shows }, listed on Career).
  `manager.tourLabel(name, cities)` gives an unnamed tour a name from its cities. Tours need 3+ cities, with no most.
- **Portraits**: every person has `portrait` (an id from `Game.content.art.portraits`), picked by
  `Game.rules.people.portraitFor(state, n, firstName)` from the faces that suit the name (no dice roll; it avoids faces
  a current contact or bandmate has). Name groups are in `content/names.js` (`nameGroups`: women, men, anyone) and face
  groups in `content/art.js` (`portraitGroups`); a new first name needs a group, and a new portrait needs a group.
- **Tours after booking (`Game.rules.tours`)**: booked tour shows carry `entry.tourId`; a tour record is
  { id, name, cities, dates, firstDay, lastDay, shows, result }. `checkEnded` (in End Day) saves `tours.wrapUp` on the
  tour when its shows are done, and `lastDayReport.tourEnded` makes the `tourWrapUp` screen follow the gig result.
  Tour shirts: `state.tourMerch`, `tours.shirtSale`, sold in `merch.sellAtGig(..., tourId)`. Road mood:
  `tours.roadMood` from `travel.nightly` (numbers in `balance.traits.roadMood`). Posters: `tours.posterData` and
  `Game.ui.tourPoster`. Auto-booking skips an open tour proposal's dates (`manager.tourHoldDays`).
- **Screens test**: `js/tests/screens.test.js` opens every screen with a new career and with the late-career save.
  Add new screens to it. If the save format changes, regenerate `test-saves/late-career.json` and `.js`.
- **Streams and charts**: `Game.rules.streaming` (in `js/rules/streaming.js`). `songStreams` / `weekStreams` give stream counts
  (fans x streamsPerFan x quality x freshness x `boosts`: buzz, chart, live, promo, viral); `payFor(streams)` turns them into
  money. `weekly(state)` is the whole Sunday step (history, viral rolls, pay through the label split, `updateCharts`,
  `checkRecords`), called from `recording.payStreaming`. Songs keep `song.streams` and `song.chart`; releases keep `name`,
  `promo`, `records`, and `chart`; the charts and other acts live in `state.charts`. Use `releaseStats(state, rel)` for a
  release's numbers. Rules that add Inbox notes in a loop must collect them and add them after the loop
  (`booking.addInbox` copies the whole state, so objects picked up before it go stale).
- **Music tab**: the tab says "Music" but the screen id is still `'songs'` (`Game.ui.songs`, sections in `app.musicSection`:
  writing / releases / charts). A release's page is the `release` screen (`Game.ui.release`, `app.releaseId`); its actions are
  in `js/app/music.js` (`openRelease`, `closeRelease`, `releaseMusic` with `app.releaseDraft` { type, songIds, name, promo }).
  Release covers and promo names are content in `js/content/studios.js` (`Game.content.covers`, `Game.content.promos`).
- **The music scene (`Game.rules.scene`)**: 50 other bands in `state.scene.bands` (3 are rivals, `state.scene.rivals`),
  their shows on venue calendars (`state.scene.shows`), and rivals' records (`state.scene.releases`). The scene has its
  **own dice** (`state.scene.rngState`), so it never changes the game's other rolls. `scene.nightly` (in End Day, before
  booking replies) removes past shows, drifts the scene and moves rivals on Mondays, releases rivals' records, lets
  rivals grab unanswered opening slots, and `fill`s calendars (unlocked cities only, out to `manager.horizonDay`).
  - A night another band has is taken: `booking.dateProblem` asks `scene.takenProblem`. Anything that puts a show on the
    calendar because a venue offered it must call `scene.clearNight(s, venueId, day)` (bookFillIn, offers.bookShow,
    travel.addShow do); opening slots keep the headliner and set `show.playerOpens`.
  - Tickets are calendar entries `type: 'ticket'` (paid at purchase with `money.spend(..., 'tickets')`; `scene.buyTicket`,
    `cancelTicket`, and `attend` at End Day). Entry types are now `'action' | 'gig' | 'studio' | 'sessionWork' | 'travel' | 'ticket'`.
  - Charts: other acts' entries carry `bandId` (`scene.chartArtist`); rivals' records chart from `scene.weeklyStreams`
    (their 2 newest only), with spots saved by `scene.recordCharts`.
  - Awards: `awards.nominationsFor` returns `nominees` and your `chance` against them (`withRivals`, strength cubed);
    the ceremony picks one winner per category.
  - Tests that book specific nights clear `s.scene.shows` first (see booking.test.js); taken nights are tested in scene.test.js.
- **Going global**: countries are content in `js/content/countries.js` (outline points and label for the World map);
  international cities carry `countryId`, and flyable cities carry `world: { x, y }` for the World map. Kinds of leg come
  from `travel.legKind(from, to)` ('drive' | 'national' | 'international' | 'hop'); `legBlocks(from, to, state)` and
  `legGas(from, to, state)` need `state` for the band size and the private jet (`player.gear.jet`, `travel.hasJet`).
  Pass state everywhere you lay out or price travel. Jet lag is applied in `travelBlock` (and counted in `preview`).
  International cities open with `travel.bestNationalTour`: 2+ National cities in `stats.nationalTourCities` (set in `travel.afterShow` for any tour show). Saves run `travel.updateCityUnlocks` on load, so new cities open right away.
  Milestone 19 `goingGlobal` unlocks the jet (`merch.jetItem`). The Map screen has `app.mapView` ('home' | 'world').
  Auto-booking stays at home (`manager.rulesProblem`); tours, the Book screen, and big-show offers go abroad. Region buzz
  abroad is by country. Local bands abroad are added by `scene.addLocalBands` (their own dice), and other bands only
  play outside their own country if they're touring bands.
- **Setlists (`Game.rules.setlist`)**: running order matters. `setlist.parts(state, songIds, cityId)` gives the 'opener',
  'closer', and 'favorites' score parts (added in `gigs.scoreParts`); `bestOrder` arranges a set (suggested sets use it).
  The encore is `encoreSongId` on a show entry (or a planned open mic: the picker's set choice is `{ songIds,
  encoreSongId }`), passed to `playGig` as `options.encoreSongId`; `gig.encore` records it. The editor is shared:
  `Game.ui.setlistEditor` (html + bind with move/best/encore handlers). Keep set order wherever songIds are copied.
- **Tour Builder**: the `tourBuilder` screen (`js/ui/tourBuilder.js`, draft in `app.tourBuild`, actions in
  `js/app/tourBuilder.js`). `manager.requestBuiltTour` stores a tour request with `stops: [{ cityId, venueId }]`;
  `processTourRequests` plans it with `manager.planBuiltTour` (venue odds with fallbacks, then `planTour(..., venueFor)`).
  The proposal has `built: true` and `changes` (what the venues said). Map pins carry `data-city`.
- **One of each instrument**: `people.roleTakenBy(state, role)` ('you', a member id, or null) and `people.openRoles`;
  `inviteProblem` refuses a taken role. New people lean toward open roles (`people.pickRole`, `balance.people.openRoleWeight`).
  Tests that invite random contacts wrap the state in `Game.testOpenRole(s, personId)` (test-runner.js).
- **Calendar tour lines**: `tours.calendarSpans(state)` (manager tours from `state.tours`, plus self-booked trips with 3+
  shows) feeds `.cal__tour` strips in `Game.ui.calendar.cellHtml`.
- **The phone layout** (iPhone Safari and Chrome; screens up to `Game.files.phoneQuery`, 700 pixels wide):
  - `mobile.css` holds every phone rule. It's linked with that media query (`Game.files.writeCss`), so desktop never
    applies it. **Never put phone styles in styles.css**; the only phone hook there is `.m-only { display: none }`.
  - Phone-only markup carries `m-only` (hidden on desktop, shown on phones); desktop-only markup that phones hide
    carries `d-only`. Use paired spans for wording (`<span class="d-only">Click</span><span class="m-only">Tap</span>`).
  - `Game.ui.mobile` (js/ui/mobile.js): the slim stat bar (`barHtml`, `app.statsOpen`), the bottom tabs and More sheet
    (`navHtml`, `app.moreOpen`; drawn by `topbar.html` on every screen that has the top bar), `isPhone()`, the
    tap-to-explain bubble for `title` hints (`installHints`), `noticeToast` (a short pop-up copy of a new `app.notice`
    when it's scrolled out of sight), and `shareFile` (the share sheet for saves and pictures).
  - Every button on a phone is at least 40 pixels tall (44 for most: `--m-tap`). After phone changes, scan each screen for
    smaller `button`, `a`, `select`, and `[data-action]` elements.
  - The Calendar draws a week strip (`calendar.weekHtml`, `app.calendarWeek`, `day.calendarWeek`) that only phones show;
    the 4-week grid is hidden there. Setlists get press-and-hold drag on phones (`setlistEditor.bindTouch`).
  - Desktop must stay pixel-identical: take desktop screenshots of every screen before and after a phone change and
    compare them (they're byte-identical when nothing changed). Check phones with the preview's device emulation (375,
    390, and 430 wide): no sideways scrolling on any screen. Headless Chrome won't lay out narrower than about 500
    pixels, so don't trust its phone screenshots.
- **Record labels (`Game.rules.label`)**: 12 labels in `js/content/labels.js` (tier: indie / mid / major / shark, and a
  personality). All their numbers are in `balance.label`: tier ranges, and how each personality shapes them.
  - **Offers:** offers need a manager.
    - `offerCheck` runs each morning: Monday rolls, plus bidding-war joiners in `state.label.pending`.
    - `makeTerms` rolls an offer with the game's dice. Inbox messages are kind `labelOffer` with `data { labelId, terms,
      counter, cooled }`.
    - `nightly` (in End Day, before `offerCheck`) handles held records coming out, counter-offer answers, deadline
      reminders and misses, cooldowns, and rivals sniping lapsed offers (scene dice).
    - Your manager can search for a deal: `requestSearch` / `searchProblem` set `state.label.search` ({ askedDay,
      readyDay }). `processSearch` (run first in `offerCheck`) delivers an offer with `data.fromManager`. Turning that
      offer down sets `state.label.searchWaitUntil`: `booking.declineOffer` does it right away, and `nightly` does it
      for one that runs out.
  - **The deal:** the deal is `state.label.deal` (terms plus progress); ended deals go in `state.label.past`.
  - **Streaming:** releases carry `dealId`, and `streaming.weekly` splits money per release through
    `label.settleStreaming`. Always use `label.releaseDeal(state, rel)`, since older saves' legacy deal covers every
    release. `label.reachFor` is the stream boost.
  - **360 cut:** `label.gigCut` (in `gigs.playGig`, beside the manager's cut) and `label.merchCut` (in
    `merch.sellAtGig`).
  - **Studio and tours:** studio time under a deal is paid by the label (`label.payStudio`); tour support comes in
    `manager.acceptTour`.
  - **Releases:** go through `recording.release`:
    - `label.releaseProblem` applies the quality bar
    - `holdDays` handles shelving: the release gets `held: true` and a future day, and
      `recording.releaseEffects` runs when it comes out
    - `onRelease` counts records owed, flops, renewal, and the deal ending
  - **What deals open:** use `label.opens(state, 'topStudio' | 'national' | 'bigShows')`, never "is signed". Opened
    doors are kept in `state.label.opened`.
  - **The screens:**
    - the contract and comparison: `Game.ui.labelDeal`, with actions in `js/app/label.js`
    - the label panel on the Manager screen
    - `label.estimate`, `termRows`, and `managerTake` give what a contract means. When you add a term, add a row there.
    - Signing plays the `dealSigned` screen (`Game.ui.dealSigned`): one CSS timeline in styles.css ("Signing a record
      deal"). The contract drops, the signature draws, the stamp lands, and "Deal signed!" bursts with confetti. A tap
      finishes every animation; under reduced motion it shows the end. "See your deal" calls `app.leaveDealSigned`.
  - **Debug:** "Label offer" and "Label deadline today".
- **Walt's handbook and the Guide**:
  - **The text:** `js/content/handbook.js` holds `mentor` (the name is set once at the top), `pages(state)` for the
    welcome handbook, and `sections()` for the Guide. Every number in it is built from balance.js.
  - **Pieces:** each page or section is `{ id, title, note, body }`. A body piece is a paragraph string, `{ table }`,
    `{ list }`, or `{ tip }`.
  - **The screens:**
    - `handbook` (`app.handbookPage`; `openHandbook(from)`, `handbookGo`, `closeHandbook`)
    - `guide` (`app.guideSection`; `openGuide`, `guideGo`), with its actions in `js/app/guide.js`
    - `Game.ui.handbook.bodyHtml` draws the pieces. Tables with 3+ columns stack into cards on phones.
  - **When it shows:** a new career opens the handbook before Today.
  - **Tip cards:** the cards in `content/tutorial.js` are Walt's notes, with optional `phoneText`.
  - **Keep it true:** when a mechanic or number changes, update its Guide section (and the handbook page for core
    mechanics). The handbook test checks for broken text and a few key numbers.
- **Publishing**: the game is served by GitHub Pages from the `main` branch at
  https://miketempestini.github.io/band-rise/ (pushing to main updates it in about a minute).
  `.nojekyll` makes Pages serve the files as they are.
  **Before every publish, change the version tag in js/files.js** (see Script load order). Otherwise browsers can mix
  old saved copies of the scripts with the new stylesheet.
- **Readability**: text must reach a contrast of 4.5 to 1 against what's behind it (3 to 1 for big headings). Don't fade
  things with `opacity` to show they're locked, past, or unavailable: use a dashed edge, hatching, or a greyer
  background, and keep the words full strength.

## Saving

The whole game is one plain object (see "Saved game state" in Design.md). Saving means
storing that object in the browser's localStorage (key in `balance.save.storageKey`).
Keep the state plain data only: no functions, no DOM elements, nothing that can't go through `JSON.stringify`.
When you add a field to the state, add it in `Game.state.createNew`. Save checking compares against
it, so older saves missing the field will be refused. If that matters, bump `balance.save.version`
and add an upgrade step in save.js.
