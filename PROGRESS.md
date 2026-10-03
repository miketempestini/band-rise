# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

### Session 8: Phase 7, events, tutorial, milestones, and the MVP finish line (2026-10-02)
- **Events** (`js/content/events.js`, `js/rules/events.js`): 10 early-game events (overtime offer, crackling amp,
  broken string, blog mention, car trouble, fill-in show, lesson request, roommate's party, sunny Saturday busking,
  bandmate wants more rehearsal). 28% chance each morning (about one every 3.5 days), weighted, with cooldowns.
  The first Friday's overtime offer is guaranteed (Design.md week 1). Shown as a card on Today with each choice's
  effects spelled out; unanswered events get their safe choice at End Day. Logged in the Inbox.
  Temporary effects: "Setbacks" part of the gig score (amp, string) and nightly energy loss (bus).
  Overtime: Saturday becomes a paid shift ($165, paid that night). Fill-in: a show booked tomorrow, no booking odds.
- **Milestones 1-5** with a 🏆 banner and +10 morale each (no feature locks; the old "Small rooms" banner is now
  milestone 4). **Career tab**: fame level with progress to the next, milestones reached and coming up, lifetime stats.
- **Tutorial**: 5 tip cards on days 1-3 (top bar, blocks, inbox/open mics, End Day, Calendar) that highlight what
  they talk about; Got it / Turn off tips; a switch in Settings.
- **Time savers**: "Skip to next commitment" (ends quiet days until a show/plan, event, new message, finished song,
  gig, or the weekly summary; then a "Skipped N days" summary) and "Repeat yesterday's evening".
- **"Three weeks in" card** after the week 3 wrap-up: your first real show countdown (or a nudge to book), and where
  you landed vs. Design.md's targets. Shown once; play continues.
- **Balance check** on tests.html (100 runs x 21 days, simple strategy). Results below under Known issues.
- **Visual pass**: friendlier palette (indigo, amber, teal, pink), rounded cards with chunky offset shadows,
  consistent spacing, tab icons, tabular numbers, rounded system fonts.
- **Published**: repo made public; GitHub Pages on at https://miketempestini.github.io/band-rise/ (from main).
- **Saves:** version 7. **Tests:** 174 passing (events.test.js, progress.test.js new) plus the balance check.

### Session 7b: Planning days ahead from the Calendar (2026-10-02)
- On the Calendar, the selected day (today or later, within the 4-week view) lists Morning/Afternoon/Evening with
  **Plan…**, **Change**, and **Clear**. Planning opens the same action picker as Today, titled with that day's date.
- Only knowable things are checked ahead (job blocks, shows, open mic nights for that weekday); energy and cash are
  checked on the day (Today flags it; if you end the day anyway it's skipped as free time).
- Planned tasks show on Today with a "Planned ahead" tag and can still be changed or cleared.
- Email a venue stays today-only. A show accepted into a planned block replaces the task (with a note).
  Undoing a day off removes tasks planned in its job blocks.
- Not built (owner chose "neither for now"): copying a day's plan to other days, clearing a whole day at once.
- Design.md has a new "Planning ahead" section. 155 tests passing (planning.test.js is new).

### Session 7: Phase 6, venues, booking, and the calendar (2026-10-02)
- **Venues** (`js/content/venues.js`): small rooms Corner Tap (45, $60 guarantee / door / cover night),
  The Back Room (60, $100 / door / cover night), Hollow Records in-store (40, **afternoon**, no pay);
  clubs The Basement and Velvet Lounge and the theater The Orpheum shown **locked** with their requirements.
- **Cover nights:** $50 flat, 5 covers only, unlock at reputation 5 + Musicianship 25 (**placeholders** in
  balance.js). Design.md's Money in row updated.
- **Book tab:** venues by tier with each requirement (✓/✗), booking window, deals, acceptance chance
  (50% + 3% x (rep - required) + Networking/4 % + venue relationship/5 %, 5-95%), expected crowd, pay estimate.
  Pick deal → date (taken dates struck out; day-job dates outlined in orange) → which block today to send it.
- **Email a venue** (Admin, 1 block, 5 energy): the request goes out at End Day; reply 1-3 days later. One open
  request per venue.
- **Inbox tab** (unread count on the tab and a banner on Today): a "yes" has Accept/Decline and an answer-by date
  (3 days, and before the show); a "no" is a note. Offers expire overnight.
- **Calendar tab:** 4-week grid (job, days off, shows, pending requests, today's plans). Click a day: take a
  workday off (vacation 14+ days ahead, sick today/tomorrow, skip), or manage a show (edit setlist, hire session
  players, cancel with the penalty shown first). Planned actions can't overwrite a show.
- **Job:** +1 standing per shift, sick -15 (unpaid), skip -25 (unpaid), vacation paid (10 a year, reset every
  52 weeks), warning below 25 (Today panel), fired at 0. **Look for work** (no job only): 50% for part-time
  Mon/Wed/Fri starting next Monday. Accepting an afternoon in-store on a workday asks how you'll take the day off.
- **Booked shows** play automatically (25 energy, a commitment; at 0 energy it's a no-show) with the gig result
  screen. Score adds the venue tier penalty and room fullness (+5 over 80% full, -5 under 25%); crowd capped at
  capacity. Pay: guarantee, door (crowd x ticket x share), or cover night, split with the band (`payShares`).
  Venue relationship +5 Solid+, -10 Rough.
- **Cancellations / no-shows** per Design.md (venue, reputation, bandmates, -5 morale; no-show bans 60 days).
- **Session players:** $75 each per show (refunded if let go), skill 40 (placeholder), tightness 50.
- **Unlock banners:** "Cover nights unlocked" and "Small rooms unlocked" (reputation 10), shown once on Today.
- **Navigation** moved to a row of tabs under the top bar (Today, Calendar, Inbox, Book, Songs, People, Settings).
- **Debug:** set reputation, "Next reply: Yes", "Replies now".
- **Saves:** version 6. **Tests:** 148 passing (booking.test.js and job.test.js are new).

### Session 6b: Skill bar fix (2026-10-02)
- The Stats panel's skill bars now show the skill level out of 100 (they used to show progress toward the
  next whole point, which looked wrong next to the numbers). Hover a bar for the exact value and how close
  it is to the next point.

### Session 6: Phase 5, people and the first bandmate (2026-10-02)
- **Person generator** (`js/rules/people.js`): name, role, skill (10 to 30 + Networking/2 + Reputation/2),
  reliability (40-95), ambition (10-90), one of six traits (Flaky +15 skill, Party Animal -20 reliability).
- **Meeting people:** Network rolls 30% + Networking/2 (32.5% at the start); open mics 20%. Contacts list holds 12;
  when full, the coldest *existing* contact drops off (the person you just met is protected, otherwise a
  full list would always drop the newcomer at relationship 20).
- **People screen** (People button in the top bar, with a red ! when someone wants to talk): band members and
  contacts with stats, trait (upside/downside/clashes), relationship bar; members also show satisfaction and
  this week's (or last week's) reasons. Invite shows exactly why it's blocked. Remove asks to confirm.
- **New actions** (person picker step): Jam (+8), Hang out ($15, +5 relationship, +5 morale, not "work"),
  Talk (members only, +15 satisfaction, once every 14 days). **Rehearse** (needs a band): $20, -15 energy,
  +1.5 Musicianship base, pick 1-4 songs (+12 tightness; x1.5 with a Workhorse there; half if nobody shows).
  Attendance rolls on reliability; Flaky also misses 25%.
- **Invite:** joins right away when relationship 50+ and reputation >= skill - 30. Every song -20 tightness
  (never below 0). The first member opens a **Name your band** screen (random suggestion + 🎲).
- **Gigs with a band:** band skill uses band musicianship (your Musicianship counted twice; Perfectionist +5);
  "Band traits" score part (+5 per Party Animal / Diva); tips split into shares (Diva 1.5); members get
  +8 relationship per gig.
- **Satisfaction** every Sunday per Design.md (+ Easygoing +2, Workhorse -3 with fewer than 2 rehearsals,
  Perfectionist -10 right after a Rough gig). Under 30: "We need to talk" (Today panel, People badge,
  Day results). Under 15: quits after the Sunday check, -10 morale. Relationships fade 1 a week without contact.
  The weekly summary has a **Band this week** panel.
- **Debug:** add random contact, set a person's relationship or satisfaction. The debug panel now folds up
  (click "Debug").
- **Saves:** version 5. **Tests:** 124 passing (people.test.js is new).

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
- **MVP playtest**: friends play the first 21 days from the link; compare with the balance check.
- **Balance decisions waiting on the owner** (see Known issues): bandmate odds, paid-show odds, cash.
- After the MVP (Design.md): recording and releasing, merch and the Shop, more events and offers (residency,
  opening slots), part-time job, milestones 6+, other cities and travel.

## Known issues / open decisions
- **Balance check (100 runs, first 21 days, not applied yet)** vs. Design.md's targets:
  - Cash avg $1,144 (range $1,050-1,295), target $400-900: **too high**. Partly the simulated player barely spends
    (no flyers, few hang outs) and takes overtime. Possible fix: no change until real playtests; or raise rent.
  - Fans avg 6.3 (4-10), target 6-15: on target, at the low edge.
  - Originals avg 1.6 (1-2): on target. Reputation avg 12.8 (8-17): on target.
  - Bandmates avg 0.4, target 1: **too low** (only 37% of runs get one). Suggested: people.inviteMinRelationship
    50 -> 40, or people.relationship.jam 8 -> 10.
  - Paid show booked or played by day 21: 69% of runs: **a bit low**. Suggested: venues.bookingBaseChance 0.50 -> 0.60.
- **Balance check:** at starting skills a cover open mic scores about 32 (22 to 42), so mostly Solid: about
  1 fan and +2 reputation a night. Two open mics a week reach reputation 10 in roughly 2.5 weeks, matching
  Design.md's first-three-weeks target.
- **Placeholders to tune:** cover night unlock (reputation 5, Musicianship 25), session player skill 40,
  club/theater guarantees ($250/$400/$2,000, inside Design.md's ranges).
- **Balance to watch:** small-room crowds are only about 15 at the start (0 fans), so rooms run under 25% full
  (-5) until you build fans. The door deal pays about $73-95 at Corner Tap vs. a $60 guarantee.
- **Balance to watch:** a new bandmate makes every song lose 20 tightness, and with only open mics there's no
  gig money yet, so "Earned gig money" only comes from tips. A low-ambition member is easy to keep happy; a
  high-ambition one (over 70 wants 2 gigs a week) will slowly sour until booked venues arrive in Phase 6.
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
