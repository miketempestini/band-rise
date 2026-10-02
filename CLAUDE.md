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
  state.js        Builds a brand-new game state (the save data shape).
  content/        Fixed game data that never gets saved: actions, venues, cities, events, names...
  rules/          One file per game system (energy.js, gigs.js, booking.js...). Plain functions.
  ui/             One file per screen (title.js, today.js, calendar.js...). Draw only.
  tests/          test-runner.js plus one test file per system (rng.test.js, gigs.test.js...).
```

## Script load order

Files must load in this order, because later files use things earlier files define:

1. `js/balance.js`
2. `js/rng.js`
3. `js/content/*.js`
4. `js/state.js`
5. `js/rules/*.js`
6. `js/ui/*.js` (game page only)
7. `js/main.js` or start-up code (game page only, when it exists)

`tests.html` loads 1 to 5, then `js/tests/test-runner.js`, then each `*.test.js` file.
When you add a new file, add its `<script>` tag to **both** `index.html` and `tests.html`
(UI files only go in `index.html`).

## Writing tests

```js
Game.test('what this checks, in plain words', function (t) {
  t.equal(actual, expected, 'optional note');
  t.ok(somethingTrue, 'optional note');
});
```

Use a fixed seed in tests so results are the same every run.

## Saving (for later phases)

The whole game is one plain object (see "Saved game state" in Design.md). Saving means
storing that object in the browser's localStorage. Keep the state plain data only:
no functions, no DOM elements, nothing that can't go through `JSON.stringify`.
