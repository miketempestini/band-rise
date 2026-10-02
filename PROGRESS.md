# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

### Session 1: Project setup (2026-10-02)
- `CLAUDE.md` with tech and architecture rules for every future session.
- `index.html` + `styles.css`: placeholder title screen that says "Band Rise".
- `js/balance.js`: every tunable number from Design.md, grouped by system.
- `js/rng.js`: seeded random number generator (mulberry32) with `next`, `range`, `int`, `chance`, `pick`.
- `js/state.js`: `Game.state.createNew(seed)` builds a fresh game state matching Design.md's data model.
  Adds one field not in Design.md: `rngState`, the generator's current position (`seed` stays as the starting seed).
- Empty folders ready: `js/rules/`, `js/ui/`, `js/content/`.
- `tests.html` + `js/tests/test-runner.js`: a small test page with no libraries. 4 tests for the random generator, all passing.
- Git repo with `.gitignore` and first commit.

No gameplay yet.

## What's next
- Decide the first build phase. The vertical slice (first three weeks, Design.md) needs screens 1 to 12.
  A sensible first phase: Title + New career screens, then the Today screen with blocks and End Day.

## Known issues / open decisions
- Design.md has no numbers yet for these (they're `null` in balance.js):
  - Cover gig unlock: how much reputation and musicianship.
  - Session work offers: required musicianship and reputation, how many studio blocks, streaming share.
- Going broke: balance.js follows the **answer** in Design.md's Open questions ($1,000 family loans,
  $5,000 max debt, game over after more than 5 weeks above $3,000 debt). The original proposal
  ($50/week loan payback, friend's couch) was left out. Also not decided: whether or how loans get paid back.
- Far travel is stored as 3 blocks each way ("a full day").
- The design file is named `Design.md` (not `DESIGN.md`). Links use that spelling.
