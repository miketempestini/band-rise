# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

### Session 14b: Manager and touring upgrades (2026-10-04)
- **Why:** a two-year touring simulation (one-off, not in the repo; 10 runs with and 10 without a manager) found:
  - No tour made the player money: about -$2,260 per tour, -$1,070 per single out-of-town show.
  - Out-of-town crowds averaged only about 38 people, since nearly all fans are at home.
  - Flat $1,000 theater production was more than the whole door.
  - With a 3-piece band you kept about 20% of the door but paid all the travel and production.
  - The manager was clearly worth the 15%: about $291,000 your share over two years vs $17,500 without, because a
    manager opens up hometown theaters. That comparison flatters the manager (the no-manager sim never books theaters
    or travels).
- **What changed (owner's picks):**
  - **Daily posts:** with a manager, every night +1 buzz in every city with fans, and +3 more in focus cities (an
    out-of-town show in the next 2 weeks). Free, part of the cut.
  - **Tour ads:** tour proposals offer ads per city: Posters $150 (+20 buzz), Local $500 (+35 buzz, +50 fans), Full
    $1,500 (+50 buzz, +200 fans). Paid on booking, they land a week before the show and hold the city's buzz until
    then. The proposal shows crowd and pay with and without ads, live, as you pick.
  - **Word of mouth on tour:** tour shows win 50% more new fans and give +10 buzz to the next city on the route. Any
    out-of-town show gives +3 buzz to the other cities in its region.
  - **Production scales with the show:** 25% of the show's pay, up to $1,000 (theater) or $5,000 (arena).
  - **Bandmates split gas, flights, and hotels** by their pay shares; only your share comes out of your cash.
- The two-year balance check's simulated player now buys Local ads on its tours when cash allows.
- **Saves:** version 14. **Tests:** 297 passing.

### Session 14: Phase 13, lifestyle and legacy (2026-10-04)
- **Housing ladder** (Shop → Housing): Starter $400 / Nicer $700 / House $1,500 / Mansion $5,000 a week, with morale
  resting at 50 / 55 / 60 / 65.
  - Moving (up or down) costs 4 weeks of the new home up front.
  - The House gives a free home studio.
  - Sunday bills, the quit screen, and Today all use the real weekly bills.
- **Vacation Home**: a second home. It unlocks after you've lived in the House, costs $16,000 up front plus $4,000 a
  week on top, and raises the morale resting level to 75. It can be sold (no refund).
- **Debt block**: while you owe Mom and Dad, you can't move up or buy the vacation home (`debt.blockedActions`); moving
  down and selling still work.
- **Fame**: your level is in the top bar (⭐ under your name). The Career screen has the full 10-level ladder
  (reached ✓, current highlighted, fans needed for the next).
- **Career card** (Career screen): a 1200×630 image drawn on a canvas, saved as band-rise-card-YYYY-MM-DD.png with
  "Save as image". It shows:
  - name, band, instrument, and home
  - fame level, fans, days and weeks played
  - original songs and releases
  - biggest show (venue, city, crowd, date)
  - milestones, reputation, and the start and current dates

  Gigs now remember your biggest show.
- **Visual pass**:
  - Every screen now has the same header (title left, "← Back" right).
  - Settings got the top bar and tabs (it had none) and the standard header.
  - Emoji were removed from screen titles (Map, Manager, Day job, Residency contract, Skipped days).
  - Untitled panels got titles (Day job, Manager).
  - The Stats panel shows your home.
- **Saves:** version 13. **Tests:** 293 passing (housing.test.js new).

### Session 13b: Real calendar dates (2026-10-04)
- Owner's change: every date is a real date with a month name, not a week number. A career starts Monday, January 5,
  2026; real years and leap years follow.
- **Where dates show now:**
  - top bar: "Sun, Jan 25, 2026"
  - Calendar: cells show the day of the month, with the month on the 1st; the pager reads "January 5 – February 1"
  - every message and Inbox card: "Saturday, March 14"
  - Book screen date buttons and trips: "Sat, Mar 14"
  - Plan week buttons: "Feb 2 – 8"
  - weekly wrap-up: "Week of Jan 12 – 18"
  - quit screen rows, contract dates, and the tour start list
  - export file names: band-rise-2026-03-14.json
- **Career screen:** shows the start date, days played, and **weeks played**.
- **Yearly things follow real years:**
  - vacation days reset on January 1
  - the "new fans this year" count starts January 1
  - awards: nominations on the first Monday of December, the ceremony on the last Saturday of December
- Saved games didn't change: dates come from the day number.
- **Tests:** 286 passing (calendar.test.js new; the awards and vacation tests now use real dates).

### Session 13: Phase 12, the big time (2026-10-04)
- **Manager** (milestone 14: reputation 50 and 2,000 fans): Rita Vance offers by Inbox (again 8 weeks after a no).
  - Takes 15% of gig pay before the band split.
  - New **Manager screen** (from Book) with "Let them go".
  - **12-week calendar**: shown 4 weeks at a time; every booking follows the 4-week (or 12-week) horizon.
  - **Auto-booking** by your rules (cities, venue sizes, nights, shows a week). Monday emails; "yes" replies are booked for
    you when they need no time off.
  - **Tours on request**: pick cities and a venue size; a proposal arrives 5 days later. It has one show per city, nearest
    first, 5+ weeks out, with crowd and pay estimates, travel, hotels, production, and net. Accept books everything
    with chained travel; decline scraps it. Needs a van.
- **Big campaign** (reputation 40, $150): pick up to 3 cities in the picker; +15 buzz (boosted by Promotion) and +1% fans.
- **Press and radio push** ($500, manager): +10 buzz everywhere you have fans, +2 reputation, once every 2 weeks.
- **Theaters** (milestone 15) and **production**: $1,000 a theater show, $5,000 an arena show, festivals none.
- **Label** (milestone 16: reputation 65 and 10,000 fans): Northbound Records.
  - Advance: $10,000 + $2 a fan, up to $50,000. Signing also opens the Top studio and, with a manager, National cities.
  - Keeps 80% of streaming until the advance is paid back.
- **Flights** to National cities: 2 blocks each way, $300 a person each way.
- **Arenas and festivals** (milestone 18: reputation 85 and 100,000 fans, plus a label): Monday offers only.
  - Arena: its flat fee, 18 songs, $5,000 production.
  - Festival: $5,000 to $15,000, 8-song afternoon slot, its own crowd.
  - Three new festivals, one in each National city.
- **Awards season** (milestone 17 with the first nomination): nominations the Monday of week 48, ceremony the Saturday
  of week 52. Song of the Year, Record of the Year, Breakout Act; win odds shown; +5 reputation a win.
- **Debug**: + fans, manager/label/arena/festival offers, award nominations, awards night.
- Fixed during testing: auto-booking first only looked 14+ days out, which missed small rooms (they book 7 to 14 days
  out); it now follows each venue's window.
- **Saves:** version 12. **Tests:** 282 passing (bigtime.test.js new). Short balance checks unchanged.
- **Two-year balance check** (new, on request; 10 runs, 728 days). Results:
  - Cash: $2,600 at day 90, $4,500 at day 180, **$71,000 at day 365, $152,000 at day 545, $242,000 at day 728**.
  - Manager around day 163; quit the day job ~195; first theater ~200; first tour ~243; label ~244.
  - Arenas and festivals: never (fans plateau around 50,000, half the 100,000 needed).
  - Reputation hits 100 in every run.
  - Last 8 weeks: $6,400 a week in (gig pay $4,000, streaming $2,200) against $2,800 out (production $1,900,
    rent $400). Every run has 85 weeks of costs saved.
  - **Verdict: money stops mattering once theaters arrive (around day 200)**: from then on cash only goes up.

### Session 12b: Door deals only (2026-10-04)
- Owner's change: venues can't be booked for a flat fee anymore. Emailing a venue offers a share of the door, plus cover
  nights (Corner Tap, The Back Room) and in-stores (Hollow Records) where a venue has them. A venue's flat fee is still
  what it pays for fill-in events and residencies (and opening slots keep their own fee).
- Balance check: day 21 unchanged; day 90 cash about $2,850 (was $2,680), since the door pays more as crowds grow.
- **Tests:** 265 passing.

### Session 12: Phase 11, on the road (2026-10-04)
- **14 made-up cities** (cities.js), each with its own fans, buzz, fan ceiling, and open mic:
  - Near: Harlow Falls, Cedar Junction. Mid: Port Ellery, Ashford Springs.
  - Far: Redstone, Lake Varden, Bellmont City, Sable Bay.
  - National (locked): New Halston, Crescent City, Kingsport. International (locked): Lindenberg, Port Aurelia, Valmora.
- **Venues:** every city has an open mic plus 2 to 4 venues with made-up names, listed in a new table in Design.md.
  Fan ceilings and venue fees live in balance.js.
- **Unlocks:** Near at reputation 25 (milestone 10); Mid at reputation 40 plus a Near show; Far at reputation 50 plus a
  van. Mid and Far get a banner. National and International show what they need (manager/label, a nationwide tour).
- **Travel**: accepting an out-of-town show books its travel around it.
  - Each one-way leg is the blocks right before the show and right after it (Near 1, Mid 2, Far 3).
  - Shows within 2 days of each other (or too close to go home) chain into one trip, city to city.
  - Gas is half the round trip per leg; a hotel is $80 for each night away; each travel block costs 15 energy.
  - Workdays the trip touches need days off (asked on Accept).
  - While away you can only Practice, Write, Rest, Post online, or Talk.
  - At 0 energy when it's time to leave (or without a van the trip needs), every show on the trip is a no-show.
  - Cancelling a show rebuilds the trip and gives back days off.
- **Book screen**: a tab per city; each date shows its trip (legs, gas, hotel nights, energy, days off).
  Out-of-town open mics are a quick sign-up (no email, no odds).
- **Emailing a venue (owner's change)**: no block needed. It's sent right away, costs 5 energy, and you can email as many
  venues as you like. The "Email a venue" action is gone.
- **Vans** (Shop, from milestone 10): Beater $1,500 (10 out-of-town shows), Used $3,000 (30), New $12,000 (never breaks).
  A worn-out van gets you home, then breaks down for good. Needed for Far cities with a band, and for tours.
- **Tours**: 3+ out-of-town shows within 10 days need a van; bandmates +2 satisfaction per tour show; road fatigue
  -3 morale a day from day 5 away.
- **Fans fade** 2% a week in any city with no show or release for 30 days (Sunday night). Gigs and releases never push a
  city past its fan ceiling.
- **Map tab**: ring map (Millbrook, then Near, Mid, Far), your van, and a card per city (travel, gas, fans out of the
  ceiling, buzz, venues, what's needed). "Book here" opens that city on the Book screen.
- **Milestones 10 (On the road), 12 (Wheels), 13 (First tour)** are live.
- **Saves:** version 11. **Tests:** 264 passing (road.test.js new). Balance checks still email venues the way a player
  would (now without using a block); the simulated player doesn't travel yet.

### Session 11: Phase 10, the day job arc (2026-10-04)
- **Day job screen** (click Job in the Stats panel, or 💼 Day job on the Calendar): schedule, pay, standing, vacation days.
- **Going part-time** at reputation 20 and job standing 50+: Monday, Wednesday, Friday ($330 a week), starting next
  Monday. The Calendar shows the new schedule right away. Days off that aren't needed anymore are dropped (vacation days
  given back).
- **Quitting**: a confirm screen with your last 4 finished weeks of music income next to each week's bills, the average,
  your bills now, the job pay you'd give up, and a plain verdict ("Music covers about 30% of your bills..."). The job ends
  next Monday; this week's shifts are still paid.
- **"Never mind"** cancels a part-time or quit change before Monday (owner's pick). It's refused if you've since booked
  something during work hours.
- **Milestones 8 (Part-time, +10 morale) and 11 (Quit the day job, +15 morale)** are live.
- **Session work** (numbers approved and added to Design.md):
  - Offers arrive in the Inbox once Musicianship is 40+ and reputation 20+ (4% a morning, one at a time).
  - Each job is 3 sessions over 2 to 4 days, 3 to 10 days out, never in work hours. Each session pays $100-200, costs 20
    energy, and gives +1.5 Musicianship.
  - The band releases the song 2-6 weeks later; play every session and you get 10% of its streaming every Sunday as
    "Session credits". A release note lands in the Inbox.
  - Sessions show on Today and the Calendar; cancel the rest of a job from the Calendar.
- **Plan week** (🗓️ on the Calendar): the 7 evenings of this week or any of the next 3.
  - Pick a task for each and "Apply to all 7 evenings". Default picks: loosest song, suggested set, closest contact,
    writing alone. "Change picks…" opens the normal picker. Evenings that can't be set are listed with why.
  - **Week templates**: save a week's evenings under a name (up to 5; the same name replaces) and apply to any week. A
    saved pick that no longer works falls back to the default.
- **Debug:** "Session work offer" and "Release session songs".
- **Balance check (90 days)**: the simulated player now goes part-time as soon as it can (around day 37) and takes
  session work (about 2 jobs by day 90). Day 90: cash about $2,600 (was $3,500), reputation about 60 (was 55), first
  club show still around day 69.
- **Saves:** version 10. **Tests:** 242 passing (dayjob.test.js new).

### Session 10c: Rules review clean-up (2026-10-04)
A check of the whole project against CLAUDE.md, then fixes for everything found (owner's OK; "built ahead" items left as they are).
No gameplay numbers changed: the balance checks give the same results as before.
- **Numbers moved into balance.js:**
  - Every event's numbers (`balance.events.<eventId>`: weights, costs, amounts, how long effects last, which weekday).
  - Each venue's flat fee (`balance.venues.guarantees`), and which setlist size each venue tier uses (`setlist` on each tier).
  - Opening slot details: club tier, fee rounded to $5. Residency details: Monday offers, preferred nights
    (Thursday first), rate steps (5%, rounded to $5), counter-offer reply and keep-open days.
  - Screen limits (`balance.ui`): player name length, the ±5 skill buttons, how many milestones and upcoming shows to list.
- **On-screen text built from balance.js**, so it can't go out of date. This covers:
  - trait descriptions, studio blurbs, milestone triggers, and the tutorial's rent
  - "reply in 1 to 3 days", "Clubs open at reputation 30", "under 4 weeks", Workhorse x1.5, co-writer skill / 10
  - streaming $0.02 and 3%, "two Rough nights", "at 0 you're fired", "today or tomorrow"
  - action descriptions (open mic songs, studio notice, look-for-work odds)
- **Rules moved out of screens:**
  - `money.maxPayBack`, `money.sundaysUntilGameOver` (Today and the weekly summary shared this), `money.weekTotals`
  - `recording.streamingEstimate` (the Songs screen no longer builds a pretend Sunday)
  - `offers.rateOptions` (the contract's rate list; `termsProblem` now only accepts a rate from that list)
  - `job.undoDayOffProblem` / `job.undoDayOff` / `job.dayOffNeeded`, and `booking.blockContents` (what's in a calendar block)
  - `actions.pickedSongsProblem` (the picker's confirm button), `career.canAdjust` (the skill page's +/- buttons)
- **Small fixes along the way:**
  - Cancelling a show no longer gives back a day off that a studio session that same day still needs.
  - Undo day off now also stays locked when a studio session is booked on that day's job blocks.
- **Tests:** 223 passing (review.test.js new, 22 tests). These cover:
  - cancelling studio time and shows
  - residency and opening-slot offers arriving, offer expiry, and declining
  - 5 band-life events and the cover nights banner
  - the debug shortcuts, song-name uniqueness, and the browser save check
  - every rule moved out of the screens
- **Left as is (owner's call):** small extras that weren't asked for:
  - the Career screen's later milestones and lifetime stats
  - Today's "Coming up" panel and the Job and Vacation rows on the Stats panel
  - "Band this week" on the weekly summary, and the cover nights banner
  - club and theater fees set early

### Session 10b: Reputation made harder to gain (2026-10-04)
- All three suggestions applied (owner's call): gains shrink faster (x (1 - reputation / 110), was 150); open mics give
  half once small rooms unlock; gigs more than one tier below your highest unlocked tier give no reputation (clubs
  unlocked: no reputation from open mics; theaters unlocked: none from small rooms). Losses still count in full.
  The gig result explains it ("You've outgrown open mics..."). Design.md updated.
- Balance check after the change: reputation at day 21 averages 11.9 (73% of runs on target, was 47%); reputation 30
  around day 47 (was 38); first headlining club show around day 69 (was 64, 98% of runs); reputation at day 90 averages
  55 (38-69), was 87 (63-100).

### Session 10: Phase 9, a bigger band and the club circuit (2026-10-04)
- **Bigger band**: up to 4 bandmates (from Phase 5); clashes checked between every pair (tested).
- **Clubs**: The Basement and Velvet Lounge need reputation 30 and a real 3-piece band to book (session players don't
  count, owner's call); 10-song sets. On the night a club also needs 3 on stage: session players can cover a missing
  member, otherwise it's a no-show. Today warns ahead of time.
- **Co-writing**: Write's second step offers "Write alone" or a bandmate with relationship 40+; they add skill/10 to each
  block's progress, and the best co-writer adds skill/10 to the finished song's quality (shown on the reveal).
- **Opening slots** (Inbox): from reputation 10, 1% + reputation/20 % + Networking/40 % a day. Club, 3-10 days out,
  $50-150, headliner's crowd (60-90% of the room), fans at half rate, 6-song set, no 3-on-stage rule.
- **Residency contracts** (Inbox → Review contract): offered on Mondays by a venue with relationship 15+ (reputation 20+).
  4 weekly nights at the venue's guarantee; crowd never below half the room. Sign as offered, or make one counter-offer
  (night, ±25% rate, 3-6 weeks) with the odds shown first; the answer arrives next morning; a no leaves the original
  terms signable.
- **Milestone 9: Full band** (3 on stage), +10 morale.
- **8 band-life events**: argument, side project, bigger share (they take 1.5 shares from then on), gear stolen, sick before
  a show (session player covers), noise complaint, song idea (+15 progress), late-night hang.
- **Balance check, days 22-90** (50 runs) added to tests.html; the simulated player now grows the band, co-writes, writes
  toward a 10-song set, takes opening slots and residencies, and books clubs. Results under Known issues.
- **Saves:** version 9. **Tests:** 200 passing (band.test.js new).

### Session 9: Phase 8, recording, releases, and merch (2026-10-03)
- **Studio time** (Book screen, new Studio section): Demo ($75/block), Pro ($250, +10, reputation 40), Top ($1,000,
  +20, needs a label: shown locked). Book 10-28 days ahead (owner's change from 2), 1-3 blocks on one day, one
  original per block, using an Admin block today; sessions land on the Calendar at End Day and are commitments
  (20 energy, paid per block on the day). Job blocks need a day off (vacation/sick/skip). Cancel is free.
- **Home setup** ($300 in the Shop after the first recording): "Record at home" action in any free block, free,
  capped at quality 40.
- **Recording quality** = 0.5 x song quality + 0.25 x band musicianship + 0.25 x tightness + studio bonus. Better take
  kept. Songs screen shows recording quality, studio, and release.
- **Releases** (Songs screen, instant): Single/EP/Album with a preview; buzz (avg quality/10 x 1/1.5/2, halved within
  4 weeks of the last release) and fans (city fans x 5% x avg/50) in every city with fans; reputation + avg/20.
- **Streaming** every Sunday night (before bills): total fans x 0.02 x quality/100 x freshness (x0.97 a week, min 0.3).
  Its own "Streaming" line in the weekly summary; Songs screen shows next Sunday's estimate.
- **Shop tab**: T-shirts (25 for $200, after the first paid gig), CDs (50 for $150, after the first EP), home setup.
- **Merch sales** at every gig (open mics too): 1/3/6/9% per person per item by result, double at Hollow Records, stops
  when stock runs out ("sold out!"), all yours. Gig result and weekly summary show it.
- **Social ads** ($50, +8 buzz x (1 + Promotion/100)) unlock with the first release.
- **Milestones 6 (First recording) and 7 (First release)**, +10 morale each.
- **Debug:** "Record next session", "+1 week streaming".
- Fixed during testing: Today and the Calendar assumed every booking request was a venue email (crashed on a studio
  booking).
- **Saves:** version 8. **Tests:** 186 passing (recording.test.js new); balance check unchanged.

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
- **Suggested fixes from the two-year check (not applied, owner to decide):**
  1. ~~Build the housing ladder~~ (done in Phase 13). Re-run the two-year check to see how much it soaks up (the simulated
     player doesn't move house yet: teach it to, then compare).
  2. Make theaters pay less or cost more: production by size (for example $3,000 at a 1,200-seat theater), or a 70% door
     share instead of 80%. A full Orpheum pays about $24,000 a night today.
  3. Slow reputation at the top: the press push gives +52 reputation a year. Try +1, a 4-week wait, or the same
     "smaller gains near the top" rule gigs use. Every run maxes out at 100.
  4. Make 100,000 fans reachable: fans plateau near 50,000 because the hometown fills up (50,000 ceiling) and
     out-of-town fans grow slowly. Options: bigger fan gains on tours and from releases out of town, or a lower bar
     for the Arena milestone (for example 60,000).
  5. Bandmates could cost a weekly retainer once you're big (or ask for bigger shares), so a larger band costs more.
- Phase 13 candidates from Design.md: Shop gear (instrument upgrades, housing), International cities (after a "major
  nationwide tour"), milestone 13's reward (bigger opening slots).
- Promotion (flyers, social ads) still only reaches the hometown; the Big campaign and press push reach other cities.

## Known issues / open decisions
- **Touring profit after the manager and touring upgrades hasn't been measured yet.** The re-run of the touring
  simulation was stopped before it finished (owner's call). Re-run it to check that tours now pay and the manager is
  still worth 15%.
- **Money stops mattering by mid-year 1** (see the two-year check above and the suggested fixes in What's next).
- **The two-year balance check is slow** (about 5 minutes headless, longer in a browser tab), so it only runs on request.
- **Auto-booking only books "yes" replies that need no time off work.** Other replies wait in the Inbox for you.
- **Trips that have started are fixed**: cancelling a show mid-trip keeps the travel as planned (you still drive the route).
- **Chaining is simple**: a city-to-city leg uses the longer of the two cities' distances (there's no real map distance).
- **Out-of-town reputation follows the usual "outgrown" rule**: at reputation 30+ an out-of-town open mic gives no
  reputation (it's for fans).
- **Session credits are small by design** (about $3-4 a week per song). They matter after several jobs. Watch them
  once real playtests show how many offers a player takes.
- **Quitting early leaves no fallback but Look for work**: going back to full-time isn't in Design.md.
- **Plan week only covers evenings** (as Design.md says). Weekend mornings and afternoons are still planned one at a time.
- **90-day balance check (after the reputation change):** reputation 30 around day 47; first headlining club show around
  day 69; reputation at day 90 about 55 (38-69), so a few runs reach theater level (60) by day 90 while fans are still
  only ~150. Watch this when other cities arrive (they'll be the main way to keep growing reputation).
  Cash builds to about $3,500 by day 90 (the simulated player barely spends).
- **Players may stall before clubs**: clubs need 10-song sets, and nothing in the game says so until you look at Book.
  Worth a tip or a Today hint later.
- **Streaming is small early on by design**: at ~100 fans an EP pays about $2 a week. It only matters with hundreds of
  fans, matching Design.md's example (500 fans, 3 songs, $15).
- **Early recordings are weak**: a first original (quality ~35) with low tightness records at about 30 at the Demo
  studio. Rehearsing a song before recording it helps the most (tightness is a quarter of the score).
- **Balance check (100 runs, first 21 days)** vs. Design.md's targets. The owner chose not to apply the suggested changes below (2026-10-04):
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
  club/theater guarantees ($250/$400/$2,000, inside Design.md's ranges; now in balance.venues.guarantees).
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
- Design.md still has no numbers for the cover gig unlock (reputation and musicianship; placeholders in balance.js).
- Not decided: whether or how family loans get paid back automatically (for now only by hand with Pay back).
- Far travel is stored as 3 blocks each way ("a full day").
