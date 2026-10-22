# Band Rise: Progress Log

A running log of what's built, what's next, and known issues. Update at the end of every session.

## What's built

### Session 14w: Bigger merch orders (2026-10-22)
- **Order sizes:** T-shirts, CDs, and tour shirts now have five order sizes each in the Shop, at the same price per
  item. Buttons too big for your cash are greyed out.

  | Item | Order sizes |
  | --- | --- |
  | T-shirts | 25 ($200), 125 ($1,000), 250 ($2,000), 625 ($5,000), 1,250 ($10,000) |
  | CDs | 50 ($150), 200 ($600), 500 ($1,500), 1,500 ($4,500), 3,500 ($10,500) |
  | Tour shirts | 25 ($250), 100 ($1,000), 250 ($2,500), 500 ($5,000), 1,000 ($10,000) |
- **Where the sizes live:** `balance.merch.orderPacks`; `merch.buy(state, itemId, packs)` and
  `tours.buyShirts(state, packs)`.
- **Tests:** 401 passing (bigger-order checks added). **Version tag:** `v25-2026-10-22f`.

### Session 14v: The signing moment (2026-10-22)
- **The moment:** signing a record deal now plays a full-screen sequence, about 5 seconds:
  1. the lights go down
  2. the contract slams onto the desk (the label's name in its ink, your advance, royalty, records owed, and masters)
  3. your name is written across the signature line in marker, stroke by stroke (long names shrink to fit)
  4. the label's stamp comes down and the room shakes
  5. "Deal signed!" explodes out of a burst of light with confetti, then your advance and "See your deal"
- **Skipping:** a tap jumps to the end. Under reduced motion it shows the end right away.
- **Code:** `js/ui/dealSigned.js` and the "Signing a record deal" styles.
- **Checks:** desktop and phone (390). **Version tag:** `v25-2026-10-22e`.

### Session 14u: Ask your manager to find a record deal (2026-10-22)
- **Asking:** whenever you have a manager and no deal (for example after buying out), the Manager screen has "Ask Rita to
  find a record deal".
- **The offer:** it lands in your Inbox in 1 to 2 weeks, from a label that would sign you. It's never a shark, and
  usually from the biggest tier you qualify for. It works even in the weeks after a deal when labels aren't calling.
- **Turning it down:** declining that offer (or letting it run out) means waiting 4 weeks before you can ask again. The
  button shows the date, and the offer and its contract say so up front.
- **Saves:** version 25 (two new fields, filled in for older saves). The late-career test save was upgraded.
- **Tests:** 401 passing (2 new). **Version tag:** `v25-2026-10-22a`.

### Session 14t: Record labels (2026-10-22)
- **Why:** labels were a stub. One label made the same offer to everyone, and the advance was paid back in days late
  in a career. Now a deal is the biggest business decision in the game.
- **The labels:** 12 labels in four tiers, each with a personality that shapes its terms:
  - **Indie:** Porchlight, Lantern Hill, Cassette Club, Static Bloom
  - **Mid-size:** Northbound, Riverbend, Neon Harbor
  - **Major:** Monolith, Crown & Anchor, Sunset Global
  - **Sharks:** Goldtooth, Fast Lane
- **The terms**, mixed differently in every offer:
  - advance and royalty
  - reach (more streams and fans on the deal's records) and a push (fans in every city you can play)
  - free promo and tour support
  - costs charged back to you
  - records owed (EPs or albums) with deadlines and penalties (a fine, a lower royalty, or one more record)
  - creative control (approval with a quality bar, or shelving)
  - masters (yours, coming back after a few years, or theirs forever)
  - a 360 cut of shows and merch
  - renewal options
  - the buyout
  - getting dropped (2 strikes), except sharks, which never let go
- **Offers:**
  - **Who:** only with a manager; each tier has its own reputation and fans bar.
  - **When:** on Mondays, more often when you're hot. Sharks circle when you're desperate.
  - **Bidding wars:** up to 3 offers at once, with a side-by-side comparison.
  - **Negotiating:** one counter-offer (up to 2 asks, with live odds).
  - **Declining:** that label waits 8 to 16 weeks. Let an offer run out and a rival may sign instead.
- **The contract:** every term in plain words, rated Good, Fair, or Harsh.
  - **The estimate:** what the deal means at your fans, shows, and writing pace, compared with staying independent.
  - **Your manager's take:** it names the worst clauses (like "At your pace a record takes 15 weeks; they want one
    every 10").
- **Under a deal:**
  - **The Manager screen:** a label panel with records delivered, the next deadline, strikes, what you still owe,
    royalties, and the buyout.
  - **Releases:** the release form shows the label's rules.
  - **Reminders:** they come before each deadline.
  - **Finances:** it shows the label's share, its 360 cut, and what it paid.
- **What labels open:** any deal opens the Top studio; a mid-size or major label the National cities (or reputation
  75); a major arena and festival offers (or a Top 10 on a smaller label, or reputation 90 and 250,000 fans). They stay
  open.
- **Rivals:** they sign with labels too, and get a streaming push.
- **Other changes:**
  - Milestone 16 is now "Record deal" (signing).
  - The Guide has a full Record labels section.
- **Saves:** version 24. An old Northbound deal carries on as it was (80% of streaming pays back the rest, nothing
  owed, free to leave). The late-career test save now has a past indie deal and a current Crown & Anchor deal.
- **How deals rate** (from offers rolled for test players):
  - **Early (reputation 52):** indies are mostly good.
  - **Mid-career (reputation 60):** mid-size labels are mostly good, penny-pinchers poor, sharks harsh.
  - **Late:** most deals cost money, but bring reach and fans.
- **Two-year balance check** (10 runs, a simple player who signs the offer with the best numbers):
  - **Signing:** every run signed a label, on day 166 on average (just after hiring the manager).
  - **Sharks:** 3 of 10 signed a shark. The simple player only compares money and ignores the traps, so the bait works.
  - **Getting dropped:** 6 runs were dropped by a mid-size label for missing album deadlines, then signed elsewhere.
  - **Money:** still stops mattering by year 2 (9 of 10 runs; this was already a known issue).
  - **Arenas:** no run reached one (fans end around 64,000, under the 100,000 needed).
- **Tests:** 399 passing (20 new label tests). The screens test opens offers, the contract, a counter-offer, the
  comparison, and the label panel with both saves. **Version tag:** `v24-2026-10-22k`.

### Session 14s: Walt's welcome handbook and the Guide (2026-10-22)
- **Why:** new players didn't know what to do, or why things happened. Morale is the clearest example: Rest gave
  "+5 morale" with no word on what morale does.
- **The mentor:** Walt Ferris, a retired touring musician who runs the guitar shop in Millbrook (portrait p02). His
  name is set in one place in `js/content/handbook.js`.
- **The welcome handbook:** 11 short pages shown after the skills page on every new career, before the first day.
  - **Topics:**
    1. the goal
    2. how a day works
    3. energy
    4. morale (what it changes, and what raises and lowers it)
    5. money and debt
    6. skills
    7. fans, buzz, and reputation (with what each reputation level unlocks)
    8. songs and tightness
    9. playing shows (the score and the four results)
    10. the band
    11. a suggested first week
  - **Moving around:** Back / Next and "Skip the handbook". On a phone, Back and Next stay at the bottom of the
    screen.
- **The Guide** (Settings → Guide, or More → Settings on a phone):
  - 25 sections covering every mechanic, from energy and morale to the label, awards, the scene, and going global
  - a contents list (on the left on a computer, a grid at the top on a phone)
  - previous / next buttons
  - "Read the welcome handbook again"
- **Cheat sheets:** the real numbers in tables, all built from balance.js, so they stay true when numbers change.
  Tables with 3+ columns stack into cards on phones.
- **Tip cards:** the first-days tips are rewritten as Walt's notes that say why, signed "— Walt", with phone wording
  on phones.
- **Checks:**
  - **Tests:** 382 passing (4 new: readable text with no broken numbers, key numbers match balance.js, the player's
    name is escaped, and the open, skip, and close flow). The screens test opens every handbook page and Guide
    section with both saves.
  - **Phone (375):** no sideways scrolling and no small buttons on any page or section.
- **Saves and rules:** no save or rule changes. **Version tag:** `v23-2026-10-22c`.

### Session 14r: A phone layout (2026-10-21)
- **What it is:** the whole game now plays in a phone browser (iPhone Safari and Chrome, held upright). Every screen
  and feature works. Screens up to 700 pixels wide get the phone layout; iPads and computers keep the desktop design.
- **Desktop is unchanged:** all the phone styles live in a separate stylesheet (`mobile.css`) that only phone-sized
  screens load. Proof: screenshots of 20 screens, with a new career and with the late-career save, at 1440 and 1024
  pixels wide, taken before and after. All 80 match to the byte.
- **The frame:**
  - **Top:** a slim bar (cash, energy, morale, date). Tap it for reputation, rent, fame, and debt (with Pay back).
  - **Bottom:** tabs for Today, Calendar, Inbox (with the unread count), and Book, plus More. More opens a sheet with
    Map, Music, People, Shop, Finances, Career, Manager (once hired), and Settings.
- **Screens:**
  - one column everywhere, with thumb-sized buttons (at least 40 pixels, most 44) and text boxes that don't make the
    iPhone zoom in
  - pop-ups fill the screen
  - Today puts the day sheet and End Day first
  - the Music catalog becomes song cards
  - wide tables scroll inside their own box
  - the World map is drawn larger and swipes sideways
- **Calendar:** one week at a time on phones. ‹ › or a swipe changes the week. Colored dots show each day's bookings,
  with the tour line across them. Tap a day to plan it below.
- **Touch:**
  - tap a greyed-out button to see why in a small bubble
  - press and hold a setlist song to drag it
  - the Tour Builder adds stops by tapping
  - when a message lands at the top of a long screen, a copy pops up above the bottom tabs for 4 seconds
- **Saves:**
  - Export opens the iPhone share sheet (AirDrop, Files, Messages); Import opens Files.
  - "Save as image" shares the career card and tour posters.
  - Settings explains that the phone and the computer keep separate saves.
- **Checked on emulated phones** (375, 390, and 430 pixels wide):
  - no screen scrolls sideways (31 screens and pop-ups, with both saves)
  - no button under 40 pixels
- **Played through by tapping:**
  - planned a day and ended it
  - booked a show
  - planned from the week strip
  - dragged a setlist song
  - built and sent a tour
  - bought a ticket
  - released a single
  - exported a save (share sheet)
- **Files:** new `mobile.css`, `js/ui/mobile.js`, `js/tests/mobile.test.js`. Small hooks in topbar, calendar,
  setlistEditor, songs, today, tourBuilder, map, settings, careerCard, tourPoster, and core.
- **Saves:** no save format change.
- **Tests:** 378 passing (2 new: the week strip rule, and the phone tabs reaching every screen).
  **Version tag:** `v23-2026-10-21j`.

### Session 14q: One of each instrument in the band (2026-10-20)
- **The rule:** a band has one guitar, one bass, one drums, one keys, and one vocals, and you count as your own
  instrument.
  - You can't invite a second player of your instrument, or of a member's.
  - To swap, remove the member first.
  - The People screen lists each spot (yours, a member's, or open), and the invite button says why when it's refused.
- **Meeting people:** people you meet are now 3 times as likely to play something your band still needs, so building a
  band doesn't stall on duplicate guitarists.
- **Simulated player:** it jams with contacts who play a missing instrument. Balance is unchanged: a 3-piece band by
  day 41 and the first club show by day 66 in every run.
- **Existing saves:** a band that already has two of the same instrument keeps them. The rule only stops new invites.
- **Tests:** 376 passing (2 new). Older tests that build bands from random contacts now give each invite an open
  instrument (`Game.testOpenRole`). **Version tag:** `v23-2026-10-20f`.

### Session 14p: Tour lines on the Calendar (2026-10-20)
- **The line:** a booked tour shows on the Calendar as a solid yellow line from its first show to its last, so you can
  see at a glance how long the band is on the road.
  - The tour's name runs along the line where it starts (and at the start of each week's row), and hovering shows its
    dates.
  - Rounded ends mark the start and the finish.
- **Which tours:** the manager's tours and the Tour Builder's, plus tours you booked yourself (a trip with 3+ shows).
  The rule is `Game.rules.tours.calendarSpans`.
- **Tests:** 374 passing (1 new). **Version tag:** `v23-2026-10-20e`.

### Session 14o: Setlist strategy and the Tour Builder (2026-10-20)
- **Running order matters:**
  - **Opener and closer:** opening and closing with one of the set's strongest songs is +3 each. In sets of 4 or more,
    a weak opener or closer is -2.
  - **Crowd favorites:** charted or viral songs are +1 each, up to +2, and +1 more in a city where lots of fans know
    the words.
  - **On the gig score:** these show as "Opener", "Closer", and "Crowd favorites", with new tips for a weak opener or
    closer.
- **The setlist editor** (the Calendar's show card, and the open mic's set step in the picker):
  - drag songs (or use ↑ ↓) and "Best order"
  - a live line ("Set order: Opener +3 · Closer +3 · Crowd favorites +3 = +9 on the gig score")
  - an **Encore** pick
- **Suggested sets** now come out in the best order.
- **The encore:** after a Great or Legendary night the band plays it: +15% new fans (+30% with a crowd favorite) and
  +3 buzz, shown on the result screen. It never changes the score.
- **The Tour Builder** (Manager → Open the Tour Builder):
  - **Stops:** drag cities from the Home and World maps (or click a city chip or a map pin) onto tour stops. It starts
    with 3, and you can add more.
  - **Venues:** pick the venue in each city (with size, capacity, and chance), and optionally a name and an earliest
    week.
  - **The manager:** contacts every venue with its normal odds. A "no" is swapped for another room in that city, or
    the stop is dropped.
  - **Routing and dates:** the manager routes the tour for travel and fits the dates.
  - **The proposal:** it says what the venues said, then works like any tour proposal (ads, estimate, accept).
- **Also fixed:** the gig result screen always said "Millbrook now …" for new fans, even out of town. It now names the
  show's city.
- **Balance (90-day check):** a sensible player who uses the best order does a little better.
  - Reputation 30 comes on day 44 (46 before).
  - Fans at day 90 are 244 (209 before).
  - Paid shows by day 21 are booked in 81% of runs (73% before).
- **Checked in the preview:**
  - **Tour Builder:** a chip dragged onto a stop, a World map pin click, sending a 4-city tour (2 abroad), and the
    proposal arriving with every venue's answer and dates.
  - **Setlists:** Best order took a set from +4 to +9, and an open mic was planned with an encore.
  - **Testing note:** the automated mouse can't do the browser's built-in drag and drop, so the drop was tested with
    real drag events.
- **Saves:** version 23 (the encore is optional, so no upgrade needed). **Tests:** 373 passing. A new
  `setlist.test.js` has 5 tests and a new `tourbuilder.test.js` has 4; the screens test opens the Tour Builder and the
  setlist editor. The version tag is `v23-2026-10-20d`.

### Session 14n: Fix: unlocking the new cities (2026-10-20)
- **The problem (reported by the owner):** there seemed to be no way to unlock the new National and International
  cities.
  - International cities only counted tours planned by the manager. Tours you booked yourself, show by show, never
    counted, and neither did any tour from before tours were recorded.
  - New cities in an update stayed locked until the next End Day, even when you qualified. Their Map card showed a
    "Book here" button that led to a greyed-out tab.
- **The fix:**
  - **Any tour counts:** international cities open after tour shows in 2 different National cities, whether you booked
    the tour or the manager did. A tour is 3+ out-of-town shows in 10 days. The locked card names the National cities
    you've already played on tour.
  - **Credit for older saves:** they get credit for the National cities they've already played.
  - **Unlocks on load:** a save opens any city you qualify for as soon as it loads. A card you qualify for that's still
    waiting says it opens at the end of today.
- **Saves:** version 22. **Tests:** 364 passing. **Version tag:** `v22-2026-10-20c`.

### Session 14m: Going global: more cities, a World map, and a private jet (2026-10-20)
- **More cities:**
  - 3 more National cities: Ironridge, Marlow Bay (with a beach festival), and Duskfield. Each has an open mic, a club,
    a theater, and an arena.
  - 12 more International cities, making 15 in 5 made-up countries:
    - Nordhavia: Lindenberg, Askerholm, Frostvik
    - Solvara: Port Aurelia, Santa Liora, Ventamar
    - Veronesse: Valmora, Castellune, Bellarosa
    - Kaigara: Akarumi, Tsukiyama, Hoshiro
    - Kestara: Port Kiara, Sundara Falls, Vellmore
  - Every international city has an open mic, a club, and a theater. Capitals have arenas (Akarumi Dome holds 40,000),
    and Solvara and Kaigara have festivals.
  - Capitals hold 800,000 fans and the others 300,000 to 600,000, so Legend (10M fans) is now reachable.
- **Unlocking:** international cities open after a finished tour that played 2 or more National cities, with a banner
  and an Inbox note. The locked cards say how close you are.
- **Flights:**
  - National: 2 blocks and $300 a person (as before).
  - International: 3 blocks and $1,200 a person.
  - Short hops inside a country: 1 block and $250 a person.
  - Jet lag: -15 energy per flight to another country, shown in the trip preview.
- **The private jet:** $1,500,000 in the Shop after the new milestone 19, Going global (your first show abroad).
  - Flights cost $2,000 at home and $6,000 abroad for the whole band, 1 block faster.
  - Jet lag is halved (-7).
  - Trips not yet started are re-planned when you buy it.
- **The World map:** a "World map" toggle on the Map screen draws a paper world map with every country's coastline,
  city pins (sized by fans, hollow while locked), and dashed flight paths from Millbrook. City cards are grouped by
  country.
- **Booking abroad:**
  - **Book screen:** city tabs are grouped (home, then each country) once the world is open.
  - **Manager tours:** they can go abroad and keep each country's cities together.
  - **Offers:** arena and festival offers can come from abroad.
  - **Auto-booking:** stays at home.
- **Scene abroad:** each country has 3 local bands (15 in all), so venues abroad have calendars and tickets. Smaller
  bands only play in their own country; touring bands and rivals play anywhere.
- **Country buzz:** a show abroad gives +3 buzz to the other cities in that country.
- **Saves:** version 21 adds the new cities, venues, local bands, and the jet field to older saves.
  - **Late-career test save:** regenerated. The world opened naturally from its National tours, it played an arena
    show abroad (milestone 19 on day 1108) and "The Around the World Tour" (5 cities in Nordhavia and Veronesse), and
    it owns the jet.
- **Bug fixed while building:** the save generator renamed every tour, which wiped tour names set on purpose.
- **Tests:** 363 passing. A new `global.test.js` has 10 tests, and the screens test now opens the World map and Book
  abroad. The version tag is `v21-2026-10-20b`.

### Session 14l: The music scene, rivals, and seeing shows (2026-10-20)
- **50 other bands** (made-up names in `js/content/scene.js`) with reputation, fans, and skills like yours.
  - **Sizes:** a pyramid of 24 small-room bands, 14 club bands, 7 theater bands, and 2 arena bands, spread over
    every city (more in Millbrook and the big cities).
  - **Touring:** bands of reputation 60+ play anywhere.
  - **Weekly change:** every Monday the scene drifts a little.
  - **Names never clash:** a scene band with your band's name takes a spare name.
- **3 rivals from Millbrook** climb with you. One stays a step behind, one even, one a step ahead (reputation and
  fans, closing 30% of the gap each Monday).
  - **Records:** they release an EP or album every 3 to 6 months, and 35% of the time one drops a record the same
    week as yours (an Inbox note). Their records chart from real streams, but only their 2 newest.
  - **Opening slots:** a 20% chance each night that a rival grabs one you haven't answered. Declined or expired ones go
    to a rival too.
  - **Awards:** they're nominated against you.
  - **Career:** a new Rivals panel puts you side by side: fame, fans, reputation, latest record, best chart spot this
    year, awards, and next show.
- **Venue calendars:** every small room, club, theater, and arena has other bands' shows booked (busiest on Fridays
  and Saturdays). They're filled for the cities you've unlocked, as far ahead as you can book.
  - A night another band has is **taken** for you.
  - Offers from a venue (opening slots, residencies, arenas, festivals, fill-ins, tours) move other bands out of the
    way.
  - Opening slots are now on real club shows and name the headliner ("Open for The Paper Wolves").
- **Seeing a show:** each venue flyer on Book lists its next 3 shows with a **Ticket** button.
  - **Price:** $8 for a small room, $12 a club, $25 a theater, $45 an arena. Paid when you buy, no refunds.
  - **Calendar:** it books the evening (pink tape on Today and the Calendar), and you can give it away from the
    Calendar.
  - **The night:** -10 energy, Networking +3, a little Musicianship and Performance, +2 morale, and a chance to meet
    someone (better in bigger rooms).
  - **Where:** Millbrook when you're home, or another city while you're there on a trip.
- **Charts:** the "other acts" are now scene bands (bigger hits go to bigger bands), and rivals are marked on the
  charts.
- **Awards are head to head:** up to 5 nominees per category (you, rivals with a record or new fans that year, and
  the biggest bands). One winner, picked by strength cubed, so the best usually wins. The nominations show who you're
  up against and your chance.
- **Balance:**
  - **Speed:** at first, taken nights made the simulated player's bookings much worse, and the 21-day check took 4
    times as long. Calendars now fill only for unlocked cities and only as far as you can book, which keeps saves
    small.
  - **Simulated player:** like a sensible player, it now tries Fridays and Saturdays at both small rooms (and both
    clubs).
  - **Results:** paid shows booked by day 21 in 73% of runs (74% before), and the first club show by day 90 in every
    run (day 67, the same as before). The 21-day check now takes about 12 seconds (7 before).
  - **Two-year check (before → after):**
    - Milestones barely moved: manager day 164 → 167, first theater day 200 → 208, label day 240 → 255.
    - Late-game gig pay is down about a quarter ($6,785 → $4,969 a week), because auto-booking finds fewer free nights.
      Streaming is unchanged.
    - Cash at the end of year two: $376k → $281k. Money still stops mattering by year two, so this helps a little.
- **Edge case fixed:** a ticket for a show in a city you're visiting on a trip no longer blocks changes to that trip.
- **Saves:** version 20. Older saves get a scene, with rivals placed at their level, calendars filled, and the chart's
  other acts turned into scene bands. The late-career test save is regenerated: each rival has 10 records, all three
  reached #1, and they've won 3 awards between them.
- **Tests:** 353 passing. A new `scene.test.js` has 15 tests, and the screens test now opens Today, the Calendar, and
  Book with a ticket. The version tag is `v20-2026-10-20a`.

### Session 14k: Real streams, charts, and the Music tab (2026-10-20)
- **Streams are real numbers now.** Every released song gets a weekly stream count each Sunday, and money is streams x
  $0.004.
  - **Boosts:** buzz (up to +25%), a chart spot (+2% at #40 up to +30% at #1), live shows (+5% each time the song is
    played that week, up to +30%), the release-week push, and going viral.
  - **Viral:** 1% a week for songs of quality 50+, then x4, x3, x2, x1.5, with a banner and an Inbox note.
  - **History:** each song keeps 26 weeks of history and its all-time total.
- **Records:** Gold and Platinum, for a single at 1M and 5M streams and an EP or album at 5M and 25M. Each comes with a
  banner and an Inbox note.
- **Charts every Sunday:** a Top 40 singles chart and a Top 20 albums chart against made-up acts whose songs rise,
  fall, arrive, and fade.
  - Each entry shows last week's spot, peak, weeks on the chart, and streams.
  - Chart moments (first entry, first Top 10, first #1, and the same for albums) give a banner and are listed on Career.
  - A Top 10 that year helps award nominations a little (+0.1).
- **Releases have names and a push.**
  - An EP or album can be named (blank means it's named after its first track).
  - Each gets a record-sleeve cover.
  - Release week can include a playlist pitch ($500), a radio push ($1,500), or a music video ($4,000).
- **The Songs tab is now Music**, with three sections:
  - **Writing:** the notebook, plus the catalog with a Streams column (this week, a trend line, and the total).
  - **Releases:** a discography of sleeves with Gold and Platinum stickers, and the release form with a name box and push
    choice. Clicking a sleeve opens its **release page**: totals, last week, best week, chart spot and peak, records
    and progress to the next one, a week-by-week bar chart, and the tracklist with each song's streams.
  - **Charts:** both charts on paper sheets, with your entries highlighted and clickable.
- **Elsewhere:** the weekly summary has a "Music this week" panel, and Career has "Charts and records".
- **Money stays about the same:** checked against the old formula in a two-year run.
  - Weekly streaming money came out at 0.96 to 1.02 times the old amount (streams per fan tuned from 4.5 to 3.6).
  - The first chart entry came around day 440 (#32, about 40,000 fans), and all 3 releases went Gold.
- **Saves:** version 19. Older saves get release names, and past streams are estimated for songs already out. The charts
  fill in on the next Sunday. The late-career test save is regenerated with named EPs, records, and #1s.
- **Bug found in testing and fixed:** two records won in the same week (for example Gold and Platinum together) were
  announced but only one was kept, so the other was announced again a week later. A new test covers it. Also fixed: a
  brand-new release's week-by-week chart drew one giant bar, and the fan count in the release message now has commas.
- **Tests:** 337 passing (11 new streaming tests, and the screens test opens every Music section and release page).
  The version tag is `v19-2026-10-20c`.

### Session 14j: Code health, tour extras, matching faces (2026-10-20)
- **Code health:**
  - `js/main.js` (992 lines) is split into `js/app/`. `core.js` holds the state, screens, saving, and the End Day
    flow, and 9 files add each area's actions.
  - The Book screen's studio section moved to `js/ui/studio.js`.
  - **One file list (`js/files.js`)** for both pages, with **one version tag** (change it before publishing). A new
    file only needs adding there, and the tests load exactly what the game loads.
  - A new **screens test** opens every screen with a new career and with the late-career save. A version-tag test
    checks that the tag matches the save version.
- **Action picker:** actions you can do now come first; unavailable ones (with their reasons) are at the bottom.
- **Faces match names:** first names are grouped (usually given to women, to men, or to anyone), and faces come from
  the matching group plus the androgynous faces. There are 8 new portraits (20 in all). Save version 18 re-matches
  everyone in older saves.
- **Auto-booking no longer clashes with tour proposals:** it skips an open proposal's dates, plus 2 days either side.
- **Tours got four extras:**
  - **Poster:** a shareable day-glo gig poster on a canvas, opened from Career's Tours list and the wrap-up.
  - **Tour shirts:** 25 for $250 in the Shop while a tour is coming up. They sell for $30 on that tour at 1.5 times
    the rate, and leftovers go for $10 after.
  - **Wrap-up:** a settlement sheet after the last show (shows, crowd, money after costs, best night, fans per city),
    with a gold record if the tour made money. It can be reopened from Career, where finished tours show a gold or
    black record and tours still ahead show an outline.
  - **Road mood by trait:**
    - Party Animal: +2 every night
    - Easygoing: −2 from the 4th night
    - everyone else: −1 from the 8th night
    These show on the People screen as one added-up line.
- **Late-career test save regenerated** (save version 18) with 15 named tours and wrap-ups (11 made money), and faces
  that match names. Checked end to end:
  - bought tour shirts and played through a tour
  - the shirts sold out
  - the wrap-up appeared with a gold record
- **Tests:** 326 passing (tours, portraits, auto-booking, picker order, version tag, and every screen). The version
  tag is `v18-2026-10-20a`.

### Session 14i: Tour names and tours of any size (2026-10-19)
- **Name your tours:** "Ask for a tour" on the Manager screen has an optional name box (up to 40 characters).
  - A blank name means no name; an unnamed tour goes by its cities ("Tour of Harlow Falls, Cedar Junction, and Port Ellery").
  - Where the name shows:
    - the manager's note while planning
    - the Inbox proposal ("Tour proposal: The Neon Highway Tour, 11 shows")
    - each show on the Calendar and Today ("Part of The Neon Highway Tour")
    - Finances' show-by-show list (the trip group is labeled with the name)
    - a new **Tours** list on the Career screen (every tour you booked, with its dates and how many shows, and whether
      it's coming up, happening now, or done)
- **Any number of cities:** a tour needs 3 or more (it was 2 to 8) with no limit. Cities that won't fit in your calendar
  are left out of the plan with the reason. Tested with all 11 travel cities: 11 shows planned.
- **Saves:** version 17 adds `state.tours`; older saves (including the late-career test save) upgrade with an empty list.
- **Bug fixed:** the Manager screen's Auto-booking panel closed too early, so its venue sizes, nights, and "At most"
  spilled outside it. Fixed, and "At most [2] shows a week" now sits on one line.
- **Tests:** 314 passing (3 new: names carried through, no most cities, save upgrade). Version tag `2026-10-19d`.

### Session 14h: Late-career test save (2026-10-19)
- **`test-saves/late-career.json`**: a save for testing new features. Import it from the title screen or Settings.
  - **Who:** Alex Rivera (guitar) with three bandmates. It's July 18, 2029, about three and a half years in.
  - **Money:** $4.6 million, no debt, no day job.
  - **Standing:** reputation 100, about 1.1 million fans, "National Headliner" fame.
  - **Business:** a manager and a label deal, with the label advance paid off.
  - **Progress:** all 18 milestones, 4 awards won, arenas and festivals played.
  - **Places:** all 12 cities you can travel to are open. The 3 international cities aren't built yet.
  - **Lifestyle:** the mansion and the vacation home, the new van, a home studio, and 100 shirts and 200 CDs.
  - **Songs:** 23 playable songs, several releases, and shows already booked ahead.
  - **How it was made:** the balance check's "sensible player" played about 2.5 years. Debug tools then filled every
    open city to its fan ceiling, added a few arena offers, and finished extra songs. The player then played on and
    bought upgrades through the normal rules. All inbox messages are marked read.
  - It's save version 16, so future versions upgrade it automatically when it loads.
- **Bug fixed:** an arena or festival offer whose date had passed made the whole Inbox screen crash, because it tried
  to draw a trip for a past date. Answered and expired offers no longer show a trip, and the trip preview now reports
  "No trip can be planned" instead of breaking. **Tests:** 311 passing (1 new).
- **Inbox safety net:** the owner found the Inbox wouldn't open with lots of messages. The cause was the crash above:
  a long career always has an old arena or festival offer. The Inbox now draws each message on its own (`safeMessageHtml`),
  so if one can't be drawn it shows "This message couldn't be shown" and the rest still open. Checked with 1,050
  messages over a further 200 simulated days: nothing failed, and the screen takes about 45 milliseconds to draw.
  The version tag in index.html is now `2026-10-19c`.
- **Found while making it:** the balance check's sim player stops writing at 14 songs, but arenas need an 18-song set.
  So in the simulations, every arena offer expired. Real players who write more songs aren't affected. The sim could
  keep writing to 18 once arenas are possible.

### Session 14g: Readability sweep (2026-10-19)
- **Why some text was hard to read:** after the redesign went live, browsers could mix old saved copies of the
  scripts with the new stylesheet, which put dark ink text on dark panels. Every file in index.html now carries a
  version tag (`?v=...`), so a new publish always loads together. Change the tag before each publish (see CLAUDE.md).
- **A contrast check of every screen** (late and early game, pop-ups, setup screens) measured each bit of text against
  what's behind it. Fixed every spot under 4.5 to 1:
  - unread-count light
  - green and orange inks on paper
  - Guest passes (deeper blue)
  - price-tag inks
  - locked deals, locked cities, and locked price tags (dashed or greyed instead of faded)
  - past days on the Calendar and in Plan week (hatched instead of faded)
  - unavailable choices in the action picker and on events (hatched; the reason stays full strength)
  - inactive tabs (greyer tape instead of see-through)
  - a slightly darker shade over screen backdrops
  The check now finds no problem spots.

### Session 14f: Backstage redesign (2026-10-19)
- **The whole game got a new look**, built with the frontend-design skill. Each screen is drawn as a real thing a
  working band uses. Paper is the bold part; everything around it is a quiet dark road-case panel.
  - **Top bar:** a road-case lid with LED meters for energy and morale (amber when tired, red when burned out).
  - **Tabs:** a mixing desk's scribble strip, with names in marker on white tape and a lit amber light on the screen
    you're on. No more emoji.
  - **Today:** a day sheet taped down with gaffer tape. Plans are written in marker, free time is pencil grey, and
    pointing at a row highlights it. The previous day is an older sheet with red check marks, upcoming shows are
    day-glo gig posters, banners are paper slips, and tips are sticky notes. It sits in front of the rehearsal room.
  - **Pop-ups:** the action picker and day readout are clipboards.
  - **Calendar:** a paper wall planner (today circled in red pen) with an index card for the selected day.
  - **People:** laminated backstage passes (Band or Guest) with portraits.
  - **Book:** venue flyers under a painting of each venue size.
  - **Gig result:** the venue painting behind an LED crowd counter, then the result stamped on.
  - **Songs:** a notebook page and a cassette tracklist.
  - **Inbox:** paper slips with colored tape by kind.
  - **Weekly summary:** a settlement sheet signed in pen with your name.
  - **Finances:** the show-by-show list is printed on green-bar computer paper.
  - **Shop:** manila price tags.
  - **Map:** a folded road map with push pins.
  - **Career:** gold records for milestones.
  - **New career:** an open mic sign-up sheet.
- **Spike tape** colors are the color code for kinds of things everywhere: yellow shows, blue studio and business,
  green money and session work, orange the day job, pink events.
- **Fonts** (saved in `assets/fonts/`, free licenses, work offline): Barlow, Barlow Condensed, Permanent Marker, and
  Russo One for the logo.
- **New art** (23 paintings made with Figma, kept in a Figma file called "Band Rise art"):
  - 6 venue sizes (open mic, small room, club, theater, arena, festival)
  - 5 backdrops (rehearsal room, bedroom studio, backstage hallway, highway, merch table)
  - 12 portraits
  All are shrunk to about 3.4 MB in total.
- **Portraits:** every person now has one (`people.portraitFor`, no dice roll, avoids repeats among people you know).
  Save version 16 gives people in older saves a face.
- **Under the hood:**
  - styles.css is rewritten around named colors and fonts. Paper switches the text colors to ink by itself.
  - The old Phase 7 overrides and dead rules are gone.
  - Every animation stops under "reduce motion", including the crowd counter.
  - The career card uses the new colors and fonts.
- **Tests:** 310 passing (3 new portrait tests).

### Session 14e: Epic title screen (2026-10-14)
- **Concert background:** the title screen now sits on a painted 80s-poster picture
  (`assets/title-stage.jpg`, made with Figma's image generator). A rock star seen from behind holds a guitar up to a
  packed arena under colored light beams. The title and buttons sit on the right; on narrow windows they're centered.
- **Chrome title:** "BAND / RISE" uses the font Russo One (saved in `assets/fonts/`, free license, works offline),
  slanted, with a chrome gradient, a pink edge and glow, a black drop shadow, and a shine that sweeps across now and
  then. Only the title uses this font.
- **Intro (about 2 seconds, CSS only):**
  - the stage fades and zooms in with flickering lights
  - the title slams in, the tagline fades up, and the buttons rise one by one
  - clicking anywhere skips it
  - it plays once per page load (`Game.app.titleIntroPlayed`)
  - computers set to "reduce motion" skip it
  - afterwards the stage drifts slowly and the light behind the star breathes
- No rule changes. **Tests:** 307 passing.

### Session 14d: Finances tab (2026-10-04)
- **New 💰 Finances tab**, with filters for last week, last month, and last 3 months. It shows:
  - **Summary cards:** money in, money out, net, cash now, and any debt or label advance still owed.
  - **Show money (the whole band):** ticket sales and show fees, then who got them: the manager, each bandmate by
    name, and you, plus tips (yours and the band's).
  - **Your money in and out** by category: day job, gig pay, tips, merch sales, streaming, session work, loans;
    rent, merch cost, studio, promotion and ads, travel and hotels (your part), production, gear and vans,
    moving, and surprise costs.
  - **Covered by others:** each bandmate's part of gas and hotels, and what the label kept from streaming.
  - **Top earners and costs:** bars with percentages.
  - **Week by week:** a bar chart of the last 13 weeks, money in vs. out.
  - **Show by show:** each gig's ticket sales, manager, band, you, merch, production, and net. Out-of-town trips and
    tours are grouped, with their travel and a trip net.
- **Under the hood:** money is tracked from now on (`state.finances`, kept for 92 days). Category names moved to
  `js/content/finance.js`, shared with the weekly wrap-up.
- **Saves:** version 15. **Tests:** 307 passing (finances.test.js new).

### Session 14c: End Day stays on Today (2026-10-04)
- Owner's change: ending a day no longer switches to the Day results screen. You stay on Today.
- **Previous day box:** the empty space on the left of the dashboard now holds this box:
  - cash change (and cash now), energy and morale before → after
  - up to 5 big moments: a gig (result, crowd, fans) or a no-show, milestones, songs finished, new Inbox messages,
    people met, bandmates joining or leaving, and loans
  - clicking it opens the full readout (every block and everything overnight) as a pop-up; Escape or Close returns
- **Still shown:** the gig result (on gig days), song reveals, and the weekly wrap-up (Sunday).
- **Layout:** three columns on wide windows. On narrower windows (under 1200px), the box sits above the day's plan.
- **Under the hood:** the summary is saved with the day (`lastDayReport.summary`, built by `Game.rules.day.summary`).
  Old saves show the overnight lines instead.
- **Tests:** 300 passing (day summary tests in day.test.js).

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
- **Learning the game (ideas, not built):** a "How to play" button on the title screen that opens the Guide before
  starting a career, and short Walt notes the first time each big system unlocks (first venue email, first recording,
  the manager).
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
- Phase 13 candidates from Design.md: Shop gear (instrument upgrades, housing), milestone 13's reward (bigger opening
  slots). (International cities are done: Session 14m.)
- Ideas for abroad: higher ticket prices or hotel costs in some countries, and auto-booking abroad if it's wanted.
- Promotion (flyers, social ads) still only reaches the hometown; the Big campaign and press push reach other cities.

## Known issues / open decisions
- **The label estimate is rough.** It's based on your fans now, your recent shows, and a typical writing pace. Late in a
  career almost every deal costs streaming money: a label's value there is its reach, fans, and the doors it opens. The
  balance check's simple player signs sharks when their advance looks big; a player who reads the ratings and Rita's
  take shouldn't.
- **The balance check's player misses album deadlines** (it releases EPs on a 12-week rhythm), so it gets dropped
  often. Teach it to write toward an album when it signs an albums-only deal.
- **The phone layout has only been tested on emulated phones.** Try it on a real iPhone in Safari and Chrome after
  publishing. Real-device checks still to do:
  - the share sheet for Export and "Save as image"
  - the home-indicator spacing at the bottom
  - press-and-hold setlist drag
  - Safari's moving toolbar
- **Rivals copy your level closely** (they aim for your reputation and fans, plus or minus a little), so they never
  pull far ahead or fall far behind. If that feels too tidy, give them a little random luck each year.
- **Late in a career, your songs and your rivals' records fill most of the charts.** Other bands mostly sit lower down.
- **The scene adds a little time to every End Day** (the saved game is bigger). Fine in play; the balance checks take
  longer.
- **A huge act fills the singles chart.** Late in a big career, your own songs can take the top 15 spots, because the
  other acts' #1 sits around 1.2M streams a week. That's realistic, but if it feels too easy, the other acts' levels
  could grow with your fame. The simulated player never buys a release-week push, so promo's effect on money isn't in
  the balance check yet.
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
