# Band Rise — Game Design Doc (First Pass)

Oct 1, 2026 · @Mike

## How to read this doc

Every number here is a starting guess, meant to be tuned once the game is playable. Formulas are written as plain math, and "day" always means one in-game day. Calls I made on your behalf are collected under Open questions at the end.

## Pitch and name

You're a broke musician with a day job, one beat-up instrument, and a calendar full of empty evenings. Every day you spend three blocks of time: grind at work for rent, practice, write, meet people, or play wherever will have you. Small choices stack up: a good open mic leads to a contact, the contact becomes your drummer, the band books a real room, and one day the music pays more than the job. There's no win screen. The question is how far you can get, from open-mic regular to touring act to arena headliner with a mansion in the hills, and how cleanly you get there before you quit your day job.

| Name | Why it works |
| --- | --- |
| **Don't Quit Your Day Job** (recommended) | Names the core tension. The job is your lifeline and your trap, and quitting is the biggest moment in the game. |
| Gig Economy | Short, punny, and about both gigs and money. Easy to say on LinkedIn. |
| Open Mic to Arena | Tells the whole arc in four words. |
| Band Rise | The current placeholder. Clear, but generic. |

Before going public, do a quick search to make sure the name isn't already taken by another game.

## The daily loop

A normal day should take 15 to 40 seconds of real time, and a day with nothing to decide can be skipped in one click.

1. **Check in.** The top bar shows cash, energy, morale, reputation, the date, and days until rent. The inbox shows anything new: venue replies, offers, events.
2. **Look at today.** The day has three blocks: Morning, Afternoon, Evening. Anything already booked (day job, a gig, studio time) is filled in and locked.
3. **Fill the open blocks.** Click an empty block and pick an action. Each action card shows its cost in money and energy and what it should do, like "+2 to 3 Musicianship".
4. **Answer offers (optional).** Accept or decline before they expire: a gig invite, an overtime shift, a bandmate's request.
5. **End the day.** Each block plays out in order with a one-line result. Gigs get their own result screen.
6. **Overnight.** Energy recovers, bills come due, skills and buzz drift, new messages arrive.
7. **Sunday night wrap-up.** A summary of money in and out, fans gained, and anything that needs attention next week.

## How the systems connect

&#91;embedded content: core loop · 4 steps, a brake, and starter fuel\]

Each day turns this wheel a little: actions grow your act, shows turn that into fans and money, and those pay for the next round. The shaded box is the brake. The day job is the starter fuel you eventually drop.

## Time and calendar

Each day has three blocks, the week runs Monday to Sunday, and you can see and book 4 weeks ahead at the start.

### Blocks

- Three blocks a day: Morning, Afternoon, Evening.
- Most actions take one block. Travel and some tour days take more (see Travel).
- A block left empty at End Day counts as free time: +5 energy, nothing else. So you never have to fill every block.

### The day job

- Starts full-time: Monday to Friday, Morning and Afternoon. These blocks are pre-filled and locked.
- One workday (two blocks) is a shift. It pays $110, paid Friday night, so $550 a week.
- **Job standing** (0 to 100, starts at 60) is how your boss sees you. Work a shift: +1. Call in sick: -15. Skip without calling: -25. Below 25 you get a warning. At 0 you're fired.
- **Vacation:** 10 days a year, paid. Request at least 14 days ahead and there's no standing penalty. This is the main tool for a first out-of-town show. Calling in sick is only possible for today or tomorrow (or for a booked show, decided when you accept it).
- **Going part-time:** unlocks at reputation 20 and standing 50+. Shifts become Monday, Wednesday, Friday ($330 a week), starting next Monday. Until Monday, a "Never mind" button cancels the change (unless you've booked something during work hours since).
- **Quitting:** allowed any time. A confirm screen shows your last 4 weeks of music income next to your weekly bills. Takes effect next Monday and frees every job block. Music income means gig pay, tips, merch, streaming, and session work (not the day job, overtime, loans, or event money). Quitting is milestone 11 (+15 morale).
- **Getting a job back:** a "Look for work" action. Each try has a 50% chance to land a part-time job starting the next week.

### How far ahead you can book

- Start: 4 weeks.
- After the Manager milestone: 12 weeks, which is what tours need.
- Each venue tier also has its own booking window (see Venues).

### Planning ahead

- From the Calendar, any free block on today or a later day (within the 4-week view) can get a planned task, using the same action picker as Today. It's optional.
- Only what's knowable is checked when planning: job blocks, booked shows, and open mic nights for that day. Energy and cash are checked on the day itself: Today flags a task that won't fit, and if you end the day anyway it's skipped as free time.
- When the day comes, the task is already on Today (marked "Planned ahead") and can be changed or cleared.
- Emailing a venue doesn't take a block: it's sent right away from the Book screen, costs 5 energy, and you can email as many venues as you like in a day.
- A show booked into a block with a planned task replaces the task. Undoing a day off removes tasks planned in its job blocks.

### Conflicts and double-booking

- One commitment per block. The calendar won't let you put a second one in a taken block.
- You can book a gig or studio time over a job block. The game warns you first: you'll need a vacation day (if 14+ days out) or to call in sick.

### Cancellations and no-shows

| What happens | Venue relationship | Reputation | Bandmates' satisfaction |
| --- | --- | --- | --- |
| Cancel 7+ days ahead | -10 | 0 | 0 |
| Cancel under 7 days ahead | -20 | -3 | -5 |
| No-show | -40, banned for 60 days | -8 | -10 |

A no-show happens automatically when you can't make it: you're in another city, you're at 0 energy, or the gig needs more band members than you have.

### Travel

- Every city has a distance: Near is 1 block each way, Mid is 2 blocks, Far is a full day (3 blocks).
- Booking an out-of-town gig books the travel blocks for you: the blocks right before the show, and right after it. Example: a Near gig on Saturday means travel Saturday afternoon, play Saturday evening, drive back Sunday morning.
- Each travel block costs 15 energy. Gas is half the round trip for each one-way leg, paid as you set off. A hotel is $80 a night (one price for the whole band) for every night away.
- If the trip touches work hours, accepting asks how you'll take those days off (vacation, sick, or skip).
- While you're away you can only Practice, Write, Rest, Post online, or Talk. Hometown things (open mics, studio, networking, hometown shows) wait until you're back.
- If you can't leave (0 energy when it's time to go, or the trip needs a van you don't have), every show on that trip is a no-show.
- Out-of-town open mics: no email and no odds. Sign up for one of its nights (1 to 14 days ahead) from the Book screen, and the travel is booked.

### Weekly rhythm

- Friday night: payday.
- Sunday night: rent and living costs are due, then the weekly summary.

## Economy

You start with $500 and save about $150 a week if you spend nothing on music, so every purchase is a real choice until music income can cover the $400 weekly bills.

### Starting position

- Cash: $500.
- Weekly bills, due Sunday: rent $275 plus living costs $125, so $400.
- Full-time day job: $550 a week.

### Money in

| Source | How it pays | Starting numbers | Unlocks at |
| --- | --- | --- | --- |
| Day job | Per shift, paid Friday | $110 a shift | Start |
| Overtime | Event offer for a Saturday shift | $165 | Start (random) |
| Open mic tip jar | Small random amount, by result | Rough $0–5, Solid $0–20, Great $10–30, Legendary $20–40 | Start |
| Gig, guarantee | A venue's flat fee, no matter who shows up. Not something you can book: only fill-ins (and residencies) pay it | $50 to $100 small rooms, $200 to $500 clubs | Fill-in events, residencies |
| Gig, door deal | Your share of ticket sales | 70% of $8 tickets in small rooms | Small rooms |
| T-shirts | Sold at gigs from stock you bought | Cost $8, sell for $20 | First paid gig |
| CDs | Sold at gigs from stock you bought | Cost $3, sell for $10 | First EP |
| Streaming | Every Sunday, per released song | Formula below | First release |
| Cover gig | "Cover night" at Corner Tap or The Back Room: flat fee per gig booked, no matter who shows up. 5 songs, covers only | $50 | Reputation 5 and Musicianship 25 (placeholders) |

### Money out

| Cost | Price | Notes |
| --- | --- | --- |
| Rent and living | $400 a week | Goes up with housing upgrades (see Progression) |
| Instrument upgrades | $400, $1,500, $5,000 | +5, +10, +15 to gig score |
| Rehearsal room | $20 a block | Needed once you have a band |
| Studio time | $75, $250, $1,000 a block | Demo, Pro, Top studio |
| Home recording setup | $300 once | Free to use, but caps recording quality at 40 |
| Promotion | $20 to $500 | See Audience |
| Going out to network | $15 a time | Drinks at bars and venues |
| Gas | $40, $80, $150 round trip | Near, Mid, Far cities |
| Hotel | $80 a night | Out-of-town stays |
| Van | Beater $1,500 (lasts 10 out-of-town shows), Used $3,000 (30 shows), New $12,000 (never breaks down) | Needed for Far cities with a band, and for tours. A worn-out van gets you home, then it's gone |
| Merch stock | $200 for 25 shirts, $150 for 50 CDs | Paid up front |
| Production | $500 to $5,000 a show | Sound and lights at theaters and bigger |
| Surprise bills | $40 to $300 | Random events like a broken string or car trouble |

### Splitting money with the band

- Gig pay is split equally between you and every member who played. You keep one share.
- As the leader, you pay the band's costs: rehearsal room, studio, promotion, gas.
- Merch and streaming money stay with you, since you own the songs and the stock.

### Merch sales at a gig

Each person in the crowd has a small chance to buy each item you have in stock: 1% on a Rough night, 3% Solid, 6% Great, 9% Legendary (double at Hollow Records). Sales stop when stock runs out. This includes open mics. Stock is bought in the Shop.

### Streaming

```latex
\text{weekly pay per song} = \text{total fans} \times 0.02 \times \frac{\text{recording quality}}{100} \times \text{freshness}
```

Freshness starts at 1 and drops 3% a week after release (x 0.97 each week), never below 0.3. Streaming is paid on Sunday night before the bills. Example: 500 fans and 3 new songs at quality 50 pay about $15 a week. Later, 10,000 fans and 20 older songs at quality 70 pay about $1,400 a week.

### Going broke

There's no game over. If you can't pay Sunday's bills, you take a soft setback instead (details in Open questions).

Take a small load from Mom and Dad for $1,000 every time your balance falls below 0. There is no limit on how far into debt the player can go: Mom and Dad keep lending $1,000 at a time whenever needed. If the player is in debt, they are limited from taking certain actions, such as upgrading their house. If the player debt remains greater than $3,000 for more than 5 weeks, the game is ended, with the message of "You went broke, had to sell your guitar, and move back into your parent's house. Maybe this music thing is more of a hobby for you." and presents the player with the option to return to the title screen to start a new game.&#32;

## Skills

Five skills from 0 to 100 drive almost every result. They grow fast early, slow down later, and slip if you ignore them for two weeks.

**Starting skills:** at New career, after picking a name and instrument, the player spends 50 points across the five skills on a skills page. Each skill gets 0 to 30 points, and all 50 must be spent before starting. Helpers: Suggested build (the "Suggested build" column below), Randomize, Reset, and -5/-1/+1/+5 buttons. The instrument's +3 bonus is added on top.

| Skill | Suggested build | Grows from | What it affects |
| --- | --- | --- | --- |
| Musicianship | 20 | Practice, Rehearse, playing live | Gig score, recording quality |
| Performance | 10 | Playing live | Gig score, merch sales |
| Songwriting | 10 | Write | How fast songs get written and how good they are |
| Promotion | 5 | Promote, releasing music | Buzz from promo and releases |
| Networking | 5 | Going out, playing live | Who you meet, how good they are, booking odds |

**Starting instrument** (each also sings): Guitar gives +3 Performance, Keys +3 Songwriting, Bass +3 Networking. You fill that role in the band, so you'll recruit for the others.

### How skills grow

```latex
\text{gain} = \text{base} \times \left(1 - \frac{\text{skill}}{120}\right) \times \text{morale multiplier} \times \text{energy multiplier}
```

| Action | Base gain |
| --- | --- |
| Practice | +3 Musicianship |
| Rehearse (band) | +1.5 Musicianship |
| Play live | +3 Performance, +1 Musicianship, +1 Networking |
| Write | +2 Songwriting |
| Network | +2 Networking |
| Promote | +2 Promotion |

- Morale multiplier: 0.75 below 30, 1.0 from 30 to 70, 1.25 above 70.
- Energy multiplier: 0.5 when you're Tired (energy under 25), otherwise 1.
- Example: Practice at Musicianship 20 gives +2.5. At 80 it gives +1.
- The game stores decimals but shows whole numbers, with a bar showing the level out of 100 (hover for progress toward the next point).

### Rust

A skill above 30 that you haven't used in 14 days loses 1 point a week until you use it again. A rust icon appears at 10 days as a warning.

### What skills unlock

Skills never lock content directly. They raise your results, results raise reputation, and reputation unlocks venues, cities, and better bandmates. That keeps one clear number for the player to chase.

## Energy and morale

Energy limits what you can do today; morale limits how well you do it over weeks. Together they make "do everything every day" a losing plan.

### Energy (0 to 100, starts at 100)

- Overnight: +50, up to 100. Each empty block: +5. The Rest action: +25.
- Under 25 you're **Tired**: skill gains are halved and gigs score 10 lower.
- You can't start an optional action you don't have the energy for. Commitments (job, gigs, studio) happen anyway. If one drops you to 0, you're **Exhausted**: next morning you only recover +30, and morale drops 10.

| Action | Energy cost |
| --- | --- |
| Day job (per block) | 20 |
| Play a gig | 25 |
| Studio session | 20 |
| Practice, Rehearse | 15 |
| Play an open mic | 15 |
| Travel (per block) | 15 |
| Write, Network, Hang out | 10 |
| Promote, Admin (book studio), each venue email | 5 |
| Rest | gives back 25 |

A workday plus an evening gig costs 65, and you get 50 back overnight. You can do that about three days in a row before you show up Tired.

### Morale (0 to 100, starts at 60)

| Raises morale | Change | Lowers morale | Change |
| --- | --- | --- | --- |
| Legendary gig | +15 | Can't pay the bills | -15 |
| Milestone reached | +10 | Exhausted | -10 |
| Full day off (no job, no work actions) | +10 | Bandmate quits | -10 |
| Great gig | +8 | Rough gig | -8 |
| Finish a song | +5 | Cancel a gig | -5 |
| Hang out with a friend or bandmate | +5 | Each day-job shift | -2 |
| Rest | +5 |  |  |

- Every Sunday, morale moves 3 points toward a resting level: 50 at the start, higher with better housing.
- The job alone wears you down: a full-time week costs 10 morale, more than the drift gives back. Music is what lifts you.
- Morale changes your skill gains (see Skills) and your gig score: -5 below 30, +5 above 70.
- Below 15 you're **Burned out**: Write and Practice give no skill until morale is back above 25. The game nudges you to rest or hang out.

## People and bandmates

You meet people by going out. Each has a few stats and one personality trait, and keeping a band together means keeping them paid, busy, and getting along.

### Meeting people

- **Network** at a place (open mic, bar, music store, a venue on show night): chance to meet someone new = 30% + Networking / 2. That's 32% at the start and 60% at Networking 60.
- Playing an open mic also has a 20% chance to meet someone.
- A new person's skill is random between 10 and (30 + Networking / 2 + Reputation / 2). Better connections bring better players.
- Contacts list holds 12 people. When it's full, the coldest contact drops off.

### What each person has

| Stat | Range | What it does |
| --- | --- | --- |
| Role | Guitar, Bass, Drums, Keys, Vocals | The slot they fill in a band |
| Skill | 0 to 100 | Adds to band musicianship |
| Reliability | 0 to 100 | Chance they show up to rehearsal |
| Ambition | 0 to 100 | How hard they want to push: how many gigs, how big the rooms |
| Trait | One of six | Personality quirk (table below) |
| Relationship | 0 to 100, starts at 20 | How well they know and like you |
| Satisfaction | 0 to 100, starts at 70 | Band members only: how happy they are in the band |

### Traits

| Trait | Upside | Downside | Clashes with |
| --- | --- | --- | --- |
| Workhorse | +50% tightness from rehearsals | Unhappy with fewer than 2 rehearsals a week | Flaky |
| Easygoing | Satisfaction drifts up 2 a week | None | No one |
| Perfectionist | +5 to band musicianship | -10 satisfaction after a Rough gig | Party Animal |
| Party Animal | +5 gig score (crowd energy) | Reliability -20 | Perfectionist |
| Diva | +5 gig score | Wants 1.5 shares of gig pay | Another Diva |
| Flaky | Usually skilled (+15 when created) | Misses 25% of rehearsals | Workhorse |

### Building a relationship

- Jam together (1 block): +8. Hang out (1 block, $15): +5, and +5 morale for you. Play a gig together: +8.
- Relationships fade 1 point a week when you don't interact.
- To **invite** someone into the band, you need relationship 50+ and reputation at least (their skill - 30). Good players want a band that's going somewhere.

### Band rules

- Up to 4 members besides you.
- Solo you can play open mics and small rooms. Clubs and bigger need 3+ people on stage: a real 3-piece band to book (session players don't count), and 3 on stage on the night (session players can cover a missing member, or it's a no-show).
- Band musicianship = the average skill of everyone, with your Musicianship counted twice.
- When someone joins, every song's tightness drops 20 while they learn it.
- **Session players**: hire a fill-in for one booked show at $75. No relationship needed. Each counts as a skill-40 player (placeholder) in band musicianship and knows every song at tightness 50, pulling the set's tightness toward 50.

### Satisfaction (checked every Sunday)

| Reason | Change |
| --- | --- |
| Earned gig money this week | +3 |
| Gigs matched their ambition (see below) | +3 |
| At least one rehearsal this week | +2 |
| Great or Legendary gig | +4 |
| No gig in 14 days, and ambition over 50 | -5 |
| Rough gig | -3 |
| Each clashing bandmate | -3 |
| You cancelled a gig | -5, right away |

Ambition under 40 wants a gig every 2 weeks. Ambition 40 to 70 wants one a week. Over 70 wants two a week.

- Below 30 they message you: "We need to talk." A **Talk** action (1 block) gives +15, once every 2 weeks per person.
- Below 15 they quit at the end of the week. You keep any gigs booked that week, but may need a session player.
- You can remove a member any time. Everyone else loses 5 satisfaction, and you lose 5 morale.

## Songs and catalog

Songs are the band's product: you write them, rehearse them until they're tight, then record and release them to turn them into fans and income.

### Covers and originals

- You start with 5 covers you can already play. Covers have a fixed quality of 50.
- Covers win a crowd but build less of an identity: fans gained from covers count at 0.75x, from originals at 1.25x.
- Only originals can be recorded and released.
- Cover titles are generic and made up ("that bar-band classic"), to stay clear of real song names.&#32;

### Writing

- Each Write block adds progress to the song you're working on. It's done at 100.
- Progress per block = 12 + Songwriting / 5. Co-writing with a bandmate (relationship 40+) adds their skill / 10.
- A first song takes about 8 blocks. At Songwriting 60, about 5.
- When the song finishes, its quality is rolled:

```latex
\text{quality} = 15 + 0.6 \times \text{Songwriting} + \text{random}(0, 25) + 5 \text{ if morale} > 70 + \frac{\text{co-writer skill}}{10}
```

- At Songwriting 10 that's 21 to 46. At 60 it's 51 to 76. Early originals are often weaker than covers on purpose: covers draw a crowd, originals build a fan base.
- Quality shows as 1 to 5 stars (every 20 points is a star). The player names each song, or takes a random title.

### Tightness (how well the band knows a song)

- 0 to 100 per song. A new original starts at 30. Covers start at 60.
- Practice alone: +10 to one song, or "Practice all songs": +1 to every song (and none of them fade). Rehearse with the band ($20 room): +12 to up to 4 songs. Playing it live: +10.
- Not played or rehearsed in 7 days: -3 a week, never below 20.
- New member joins: -20 on every song.

### Setlists

| Show type | Songs in the set | Cover limit |
| --- | --- | --- |
| Open mic | 2 | Any |
| Small room | 6 | Any |
| Club | 10 | Any |
| Theater | 14 | 2 |
| Arena or festival | 18 | 2 |

You need enough songs to fill the set before you can book it. The game suggests your best set and you can swap songs before the show.

### Recording

- Book studio time 10 to 28 days ahead (an Admin action, from the Book screen). One song per block, up to 3 blocks per booking, paid per block on the day. Cancelling is free. With the home setup, "Record at home" works in any free block, no booking.
- Re-recording a song keeps the better recording. Only originals can be recorded.

| Studio | Cost | Quality bonus | Needs |
| --- | --- | --- | --- |
| Home setup | $300 once, then free | Capped at 40 | First recording milestone |
| Demo studio | $75 a block | +0 | Nothing |
| Pro studio | $250 a block | +10 | Reputation 40 |
| Top studio | $1,000 a block | +20 | Label deal |

```latex
\text{recording quality} = 0.5 \times \text{song quality} + 0.25 \times \text{band musicianship} + 0.25 \times \text{tightness} + \text{studio bonus}
```

### Releasing

- Release a Single (1 recorded song), an EP (3 to 5), or an Album (8 to 12), instantly from the Songs screen.
- Buzz on release, in every city where you have fans: (average recording quality / 10) x size bonus. Size bonus is 1 for a Single, 1.5 for an EP, 2 for an Album.
- New fans on release, per city: that city's fans x 5% x (average recording quality / 50).
- Streaming money starts the next Sunday. CDs unlock with your first EP.
- A release within 4 weeks of the last one gets half the buzz, so spamming singles doesn't pay.

## Venues, booking and geography

You start in one hometown with seven venues across four tiers. Other cities open up as your reputation grows.

### Venue tiers (hometown)

| Tier | Hometown venues | Capacity | Needs | Book ahead | Pay | Ticket |
| --- | --- | --- | --- | --- | --- | --- |
| 0. Open mic | The Rusty Nail (Tue), Bean There Cafe (Thu) | No cap | Nothing | Sign up that day | Tip jar | Free |
| 1. Small room | Corner Tap (45), The Back Room (60), Hollow Records in-store (40) | 40 to 60 | Reputation 10 | 7 to 14 days | 70% of door (a $50 to $100 flat fee only for fill-ins and residencies) | $8 |
| 2. Club | The Basement (200), Velvet Lounge (300) | 150 to 300 | Reputation 30, 3+ on stage | 14 to 28 days | 75% of door ($200 to $500 flat for fill-ins and residencies) | $12 |
| 3. Theater | The Orpheum (1,200) | 800 to 1,500 | Reputation 60, a release | 28 to 56 days | 80% of door ($2,000+ flat for residencies) | $25 |
| 4. Arena or festival | Bigger cities only | 5,000+ | Reputation 85, a label | Offers only | $20,000+ | $45 |

Hollow Records is the odd one out: it pays nothing, but merch sells at double the normal rate, and its in-store shows are in the afternoon (so on a weekday they clash with the day job). Venues are made-up names.

### Booking a show

- **Email a venue** (no block, 5 energy, as many as you like): pick the city, the venue, a date inside its window, and a deal: a share of the door, or a cover night or in-store where the venue has one. Venues can't be booked for a flat fee (owner's change). Out of town, each date shows the trip it would take.
- Before you send, the screen shows your odds and the expected crowd:

```latex
\text{chance} = 50\% + 3\% \times (\text{reputation} - \text{required}) + \frac{\text{Networking}}{4}\% + \frac{\text{venue relationship}}{5}\%
```

- The chance is kept between 5% and 95%. Example: reputation 12 for a room that needs 10, Networking 9: about 58%.
- The answer arrives 1 to 3 days later in the inbox. A yes puts the show on your calendar.
- One open request per venue at a time.
- **Venue relationship** (-50 to 100, starts at 0): +5 after a Solid or better show, -10 after a Rough one. Cancellation penalties are in Time and calendar.

### Offers that come to you

- **Fill-in:** "A band dropped out. Can you play tomorrow?" Short notice, no booking odds, a quick reputation boost.
- **Opening slot:** play a club to a touring band's crowd (60-90% of the room). A $50 to $150 flat fee and a 6-song set, with no 3-on-stage rule. New fans come from their crowd at half the normal rate. From reputation 10, the chance of an offer each morning is 1% + reputation / 20 % + Networking / 40 % (about 2.5% a day at reputation 20 and Networking 20).&#32;
- **Residency**: a contract for a weekly night at one venue (4 weeks at the venue's guarantee), offered on Mondays by a venue that likes you (relationship 15+) once you're at reputation 20+. Regulars come back: the crowd never drops below half the room. Before signing you can make one counter-offer: a different night, up to 25% more or less money, or 3 to 6 weeks. Each change lowers the chance they agree (a different night -10%, each 1% more money -2%, each week of difference -5%; plus venue relationship / 2 %). The answer comes the next morning; if it's no, the original terms can still be signed.
- **Session work:** once your Musicianship is 40+ and reputation 20+, a band may ask you to sit in on their recording (4% chance each morning, one offer at a time, answer within 2 days). It's 3 studio sessions of one block each, spread over 2 to 4 days in the next 3 to 10 days, never during work hours. Each session pays a flat $100 to $200 (a round $10, set by the offer), costs 20 energy, and gives +1.5 Musicianship. At 0 energy you miss a session (no pay). The band releases the song 2 to 6 weeks after your last session; if you played every session, you get 10% of its streaming money every Sunday (their fans (1,000 to 5,000) x $0.02 x song quality (50 to 80) / 100 x freshness, about $3 to $4 a week per song). You can cancel the remaining sessions from the Calendar (you lose the pay and the share, nothing else).

### Geography

| Region | Travel each way | Unlocks at | Notes |
| --- | --- | --- | --- |
| Hometown | None | Start | All tiers 0 to 3 |
| Near cities (2) | 1 block | Reputation 25 | Day trips |
| Mid cities (2) | 2 blocks | First Near show and reputation 40 | Usually an overnight |
| Far cities (4+) | A full day | Reputation 50 and a van | Needs vacation days or no day job |
| National cities | Flights | Manager and a label | Arenas and festivals |
| International cities | Flights | After first major nationwide tour | Mix of clubs, arenas, theaters, and festivals |

Each city keeps its own fans, buzz, an open mic , and 2 to 4 venues. Each city also has a fan ceiling: 50,000 for the hometown, 20,000 to 40,000 for nearby cities, up to 500,000 for big national cities.

| City | Region | Fan ceiling | Open mic | Venues |
| --- | --- | --- | --- | --- |
| Millbrook (hometown) | Hometown | 50,000 | The Rusty Nail (Tue), Bean There Cafe (Thu) | See Venue tiers |
| Harlow Falls | Near | 30,000 | The Lantern Room (Wed) | The Copper Pint (50), Mill Street Hall (55), The Depot (club, 220) |
| Cedar Junction | Near | 25,000 | Junction Coffee Co. (Fri) | Railyard Tavern (45), The Gray Fox (60), Signal House (club, 180) |
| Port Ellery | Mid | 50,000 | Harbor Lights Cafe (Mon) | The Rusty Anchor (60), Lighthouse Ballroom (club, 300), Tidewater Club (club, 200) |
| Ashford Springs | Mid | 45,000 | Springhouse Coffee (Wed) | The Wine Cellar (50), The Avalon (club, 250), Brickworks (club, 180) |
| Redstone | Far | 80,000 | Red Rock Coffee (Tue) | The Dusty Saloon (60), The Forge (club, 300), Redstone Grand (theater, 1,000) |
| Lake Varden | Far | 70,000 | Loon Cafe (Thu) | The Boathouse (50), Pinewood Hall (club, 250), The Lyric (theater, 900) |
| Bellmont City | Far | 100,000 | Night Owl Lounge (Mon) | Back Alley Bar (60), Neon Garden (club, 300), Union Station Club (club, 200), The Palace (theater, 1,500) |
| Sable Bay | Far | 90,000 | Driftwood Cafe (Fri) | The Surf Shack (45), Pier 9 (club, 250), Bayfront Theater (theater, 1,200) |
| New Halston | National | 500,000 | The Velvet Mic (Tue) | Club Meridian, The Halston Theater, Halston Arena |
| Crescent City | National | 400,000 | Moonlight Coffee (Thu) | The Crescent Club, Crescent Theater, Crescent Arena |
| Kingsport | National | 350,000 | Dockside Mic (Wed) | The Kingsway, Royal Theater, Kingsport Coliseum |
| Lindenberg | International | 500,000 | Cafe Linde (Tue) | The Linden Cellar, Lindenberg Concert Hall, Lindenberg Arena |
| Port Aurelia | International | 450,000 | Aurelia Beach Bar (Fri) | Club Solana, Teatro Aurelia, Aurelia Stadium |
| Valmora | International | 400,000 | Valmora Lounge (Thu) | The Blue Door, Valmora Opera House, Valmora Festival Grounds |

Out of town, small rooms, clubs, and theaters book for a share of the door (cover nights and in-stores are hometown only), and theaters need a release. Opening slots, residencies, and fill-ins stay in the hometown. National and International cities are locked until the manager, label, and flights arrive.

### Tours

- A tour is 3+ out-of-town shows within 10 days. It needs a van, plus vacation days or no day job.
- Back-to-back cities chain travel and show in one day where the distance allows: if your next out-of-town show is within 2 days (or there's no time to go home in between), you drive straight on from city to city. A city-to-city leg uses the longer of the two cities' distances.
- Road fatigue: from day 5 on the road, morale drops 3 a day. Bandmates gain 2 satisfaction per tour show.

## Audience, buzz and reputation

Each city tracks fans (people who stick around) and buzz (how hot you are right now). Fans grow slowly and stay; buzz spikes and fades. Reputation is one industry-wide number that unlocks things.

### Fans (per city, starts at 0)

```latex
\text{new fans from a gig} = \text{crowd} \times \text{conversion rate} \times \text{originals factor} \times \left(1 - \frac{\text{city fans}}{\text{city ceiling}}\right)
```

- Conversion rate depends on the gig result (see Gig resolution).
- Originals factor: 0.75 for an all-cover set, 1.25 for all originals, in between for a mix.
- The last part slows growth as a city fills up, so no city maxes out quickly.
- Fractions round randomly: 1.4 new fans means 1 fan, with a 40% chance of a second.
- Fans only fade if you go quiet: no show or release in a city for 30 days costs 2% of that city's fans per week.

### Buzz (per city, 0 to 100)

- Fades 2 points a day.
- Raised by gigs (see Gig resolution), promotion, releases, and lucky events like a blog mention.
- Buzz grows your crowds (below). It's the main reason to promote the week before a show.

### Crowd size

```latex
\text{expected crowd} = \text{city fans} \times \left(8\% + \frac{\text{buzz}}{5}\%\right) + \text{foot traffic} \times \left(0.5 + \frac{\text{buzz}}{100}\right)
```

- Foot traffic is the venue's walk-in crowd: open mic 30, small room 30, club 40, theater 60, arena 200.
- The actual crowd is the expected crowd times a random 0.85 to 1.15, capped at capacity.
- The booking screen shows this as a range, like "Expected crowd: 22 to 30".

### Reputation (0 to 100, starts at 0)

- Unlocks venues, cities, bandmates, and offers. Never fades on its own.
- Changes after each gig (base values in Gig resolution), multiplied by (1 + venue tier x 0.5). Bigger rooms count for more.
- Gains shrink as you climb: multiply any gain by (1 - reputation / 110). Losses are not reduced.
- You outgrow rooms: once small rooms are unlocked (reputation 10), open mics give half the reputation. Gigs more than one tier below the highest tier you've unlocked give no reputation at all (at reputation 30, open mics give none; at 60, small rooms give none). Losses still count. Reputation is meant to be hard to gain, so growing it means bigger rooms and, later, other cities.
- A release adds average recording quality / 20.
- Cancellations and no-shows cost reputation (see Time and calendar).

### Promotion

| Action | Cost | Effect | Unlocks at |
| --- | --- | --- | --- |
| Post online | Free, 1 block | +1 to +5 hometown buzz (1 + Promotion / 20) | Start |
| Hang flyers | $20, 1 block | +3 buzz in one city | Start |
| Social ads | $50 | +8 buzz in one city | First release |
| Big campaign | $150 | +15 buzz in up to 3 cities, plus fans equal to 1% of each | Reputation 40 |
| Press and radio push | $500 | +10 buzz in every city with fans, +2 reputation | Manager |

Paid promotion effects are multiplied by (1 + Promotion / 100), so the skill matters more as budgets grow.

## Gig resolution

A gig is one score built from visible parts plus a small, visible slice of luck. The result screen shows every part, so the player always knows why a night went well or badly.

### The score

```latex
\text{score} = 0.35 \times \text{band musicianship} + 0.25 \times \text{Performance} + 0.20 \times \text{avg song quality} + 0.20 \times \text{avg tightness} + \text{modifiers} + \text{luck}
```

| Modifier | Change |
| --- | --- |
| Instrument tier | +0, +5, +10, +15 |
| Tired | -10 |
| Morale | -5 below 30, +5 above 70 |
| Party Animal or Diva in the band | +5 each |
| Room more than 80% full | +5 |
| Room less than 25% full (not open mics) | -5 |
| Venue tier (bigger rooms expect more) | 0, -3, -6, -10, -15 for tiers 0 to 4 |
| Luck | Random -10 to +10 |

- Solo, band musicianship is just your Musicianship.
- **Bad-luck protection:** after two Rough results in a row, luck can't go below 0 on the next gig.
- Sanity check: a first open mic with covers scores about 22 to 42, so mostly Solid, sometimes Rough. A mid-game band at skills around 50 lands in Great most nights.

### Results

| Result | Score | Fan conversion | Buzz | Reputation (base) |
| --- | --- | --- | --- | --- |
| Rough | Under 25 | 0% | -5 | -1 |
| Solid | 25 to 44 | 8% | +2 | +2 |
| Great | 45 to 64 | 15% | +5 | +3 |
| Legendary | 65+ | 25% | +10 | +5 |

Morale, merch, and venue relationship effects of each result are in their own sections.

### The result screen

1. Headline: "Great night at The Back Room!"
2. Crowd: "38 of 60" with a simple fill bar.
3. Score breakdown: a bar split into labeled parts, like Band skill +24, Stage presence +6, Songs +10, Tightness +11, Tired -10, Luck +3.
4. What you got: cash, new fans, buzz, reputation, morale, merch sold.
5. One tip when something hurt, like "You were tired. Rest the day before a show."

No rhythm minigame. The real decisions happen before the show (setlist, rest, rehearsal, promotion), and the result screen is the payoff. A 2 to 3 second crowd meter animation is enough drama.

## Progression milestones and fame levels

Milestones unlock new actions and screens, so the game keeps handing the player new things to do. Fame levels give one simple "how far did I get" title to brag about.

### Milestones

| # | Milestone | Trigger | Unlocks |
| --- | --- | --- | --- |
| 1 | First open mic | Play an open mic | Networking at venues, Contacts screen |
| 2 | First original | Finish writing a song | Song catalog, setlist editing |
| 3 | First bandmate | Someone accepts your invite | Band name, Rehearse, Jam |
| 4 | Small rooms | Reputation 10 | Email a venue, tier 1 venues |
| 5 | First paid gig | Play a tier 1 show | Session players, T-shirt stock |
| 6 | First recording | Record a song | Release action, home recording setup |
| 7 | First release | Release a single or EP | Streaming income, social ads, CDs (with an EP) |
| 8 | Part-time | Reputation 20 and job standing 50+ | Option to go part-time |
| 9 | Full band | 3+ on stage | Clubs (tier 2) |
| 10 | On the road | Reputation 25 | Near cities, travel |
| 11 | Quit the day job | You choose to quit | Every weekday block, +15 morale |
| 12 | Wheels | Buy a van | Far cities, tours |
| 13 | First tour | 3+ out-of-town shows in 10 days | Bigger opening slots |
| 14 | Manager | Reputation 50 and 2,000 fans | Auto-booking, 12-week calendar, press push. Manager takes 15% of gig pay |
| 15 | Theater | Reputation 60 and a release | Tier 3 venues |
| 16 | Label offer | Reputation 65 and 10,000 fans | A cash advance ($10,000 to $50,000), Top studio, national cities. The label keeps 80% of streaming until the advance is paid back |
| 17 | Awards season | Every December | Nominations from your releases and fans. A win adds reputation |
| 18 | Arena | Reputation 85 and 100,000 fans | Arena and festival offers |

### Housing (the lifestyle ladder)

| Home | Weekly cost | Morale resting level | Extra |
| --- | --- | --- | --- |
| Starter apartment | $400 | 50 | None |
| Nicer apartment | $700 | 55 | None |
| House | $1,500 | 60 | Free home studio |
| Mansion in the hills | $5,000 | 65 | Bragging rights |
| Vacation Home | $4,000 | 75 | Can not be primary residence. Unlocks after House is unlocked&#32;&#32; |

Moving costs 4 weeks of the new rent up front. Higher costs are deliberate: success brings bigger bills.

### Fame levels (by total fans across all cities)

| Fame level | Total fans |
| --- | --- |
| Bedroom Musician | 0 |
| Open Mic Regular | 10 |
| Local Act | 100 |
| Hometown Heroes | 1,000 |
| Regional Draw | 5,000 |
| Touring Act | 25,000 |
| Rising Star | 100,000 |
| National Headliner | 500,000 |
| Arena Act | 2,000,000 |
| Legend | 10,000,000 |

A later feature: a shareable career card (fame level, days played, fans, songs, biggest show) made for sharing with other players.

## Vertical slice: the first three weeks

The first 21 in-game days should take 10 to 15 minutes and end with one bandmate, one original song, and the first paid gig on the calendar.

**Setup (under a minute):** title screen, then New career: enter a name and pick Guitar, Keys, or Bass, then spend 50 skill points. You start on a Monday with $500, energy 100, morale 60, and a full-time job.

### Week 1: Get on stage

| Day | What happens | Player's choice | Feeling |
| --- | --- | --- | --- |
| Mon | Tutorial cards point at the top bar and calendar. The job fills morning and afternoon. Inbox: The Rusty Nail has an open mic every Tuesday. | Evening: Practice (suggested) or Write | "Okay, I get it." |
| Tue | First open mic, 2 covers. Likely Solid: about 15 to 20 people, 1 new fan, a few dollars in tips. 20% chance to meet someone. | Which 2 covers | First applause |
| Wed | Free evening. | Start the first song (about 14% done) | Building something |
| Thu | Bean There Cafe open mic, or go out to network at Corner Tap ($15). Networking may introduce Dana, a drummer. | Play or meet people | First contact |
| Fri | Payday, +$550. Event: the boss offers a Saturday shift for $165. | Extra money or a free Saturday | First real trade-off |
| Sat to Sun | 6 free blocks (3 if you took the shift). Write, practice, jam with Dana, or rest. Sunday: -$400 and the weekly summary. | How to use the weekend | Tight, but hopeful |

### Week 2: Make it yours

| Day | What happens | Player's choice | Feeling |
| --- | --- | --- | --- |
| Mon to Tue | The first original finishes around day 9. Quality is revealed, most likely 2 or 3 stars. | Name the song | Mixed pride: it's rough, but it's yours |
| Tue | Open mic with 1 original and 1 cover. More fans than last week, because originals count for more. | Play the new song or play it safe | A little risk |
| Any day | If the player stacks job, extra actions, and a show, they arrive Tired. The result screen shows "Tired -10" in the breakdown. | None, it's a lesson | A sting, but the reason is clear |
| Random | Event: your amp starts crackling. Pay $60 to fix it, or play on with -3 for a week. | Spend or risk it | Money squeeze |
| Weekend | Jam with Dana again (relationship around 45). A second contact may appear, such as Theo, a perfectionist bassist. | Who to invest time in | Choosing your people |

### Week 3: Make it real

| Day | What happens | Player's choice | Feeling |
| --- | --- | --- | --- |
| Early week | Reputation passes 10. Milestone: "Small rooms unlocked." | None | A door opens |
| Same day | Email The Back Room for a Saturday 12+ days out. The screen shows about 58% odds and an expected crowd of 15 to 22. | Which date; 70% of the door or a cover night | Nervous about the odds |
| 2 days later | Reply arrives. A yes goes on the calendar. A no suggests trying Corner Tap. | Try again or wait | Relief or a setback |
| Mid week | Dana's relationship reaches 50. Invite her to the band, and she says yes. Name the band. Rehearse unlocks, and every song drops 20 tightness. | Band name | "We're a band now." |
| Rest of week | With a show on the calendar, flyers, posts, and rehearsals suddenly matter. | Promote, rehearse, or save money | Something to work toward |
| Sunday | Weekly summary, then an end-of-slice card: "Your first real show is in 12 days." | Keep playing | Anticipation |

### Where the player should land

| Measure | Target range at day 21 |
| --- | --- |
| Cash | $400 to $900 |
| Fans | 6 to 15 |
| Songs | 1 or 2 originals, plus 5 covers |
| Band | You plus 1 |
| Reputation | 10 to 13 |
| Calendar | First paid gig booked |

**Wins the slice should deliver:** first applause, first fan, first original, first yes from a venue, first bandmate.

**Losses it should deliver:** rent wiping out most of a week's savings, a Tired show going Rough, a declined booking, a contact drifting away.

## Biggest design risks

Four risks could make the game stop being fun. Each has fixes already built into the systems above.

### 1. Snowballing: once you're big, nothing matters

- Skills and reputation grow slower the higher they get.
- Each city has a fan ceiling, so growth means going to new places.
- Costs climb with success: more bandmates to pay, a manager's 15%, production costs, housing, and a label that keeps most streaming money until it's paid back.
- Bigger rooms are harder to impress (venue tier penalty) and have more at stake.
- Fans fade if you stop showing up.

### 2. Boredom: every Tuesday is the same open mic

- A new milestone roughly every 15 to 20 minutes early on, each adding a new action or screen.
- An event deck of about 25 events, roughly one every 3 to 4 days, and most of them are choices.
- Each stage changes the kind of decision: evenings and money early, people management with a band, logistics on tour, business deals with a label.
- A "Skip to next commitment" button for quiet stretches.

### 3. Hidden randomness: "I lost and don't know why"

- Odds and expected crowds are shown before you commit.
- Luck is one visible slice of the score breakdown, capped at plus or minus 10.
- Costs are never random.
- Bad-luck protection after two Rough shows.
- Every bad result comes with one plain tip.

### 4. Calendar tedium: too many clicks per week

- The job and booked commitments fill themselves in.
- Empty blocks are allowed, so End Day never needs a full calendar.
- "Repeat yesterday's evening" and saved week templates.
- A Plan Week view that sets all 7 evenings at once (tasks that need a pick get a sensible default), plus up to 5 saved week templates.
- The manager auto-books shows later in the game.
- Goal: 1 to 3 real decisions per day.

## Data model

One plain JavaScript object holds everything about a player's game, and saving is just storing that object in the browser. Fixed game content (actions, venues, events) lives in separate files that never get saved.

### Ground rules for the build

- **State vs. content.** State is what changes and gets saved (cash, songs, people). Content is the fixed rulebook (what each action does, every venue, every event).
- **Rules are plain functions.** For example, endDay(state) returns the new state plus a log of what happened. The screens only draw the state. This makes the game easy to test and easy to rebalance.
- **One balance file.** Every number in this doc lives in one place, so tuning never means hunting through code.
- **Repeatable randomness.** The save stores a random seed, so reloading can't re-roll a bad result.
- **Saving.** Auto-save to the browser's local storage after every End Day. Plus Export and Import buttons that download or load a save file, so progress survives a cleared browser or a new computer. Each save carries a version number for future updates.
- **No build step.** Use plain script tags and one global Game object, not JavaScript modules. Modules may refuse to load when you open index.html straight from your computer.

### Saved game state

```javascript
const state = {
  version: 1,
  seed: 123456,              // for repeatable randomness
  day: 0,                    // 0 = Monday of week 1
  player: {
    name: '', instrument: 'guitar',            // 'guitar' | 'keys' | 'bass'
    cash: 500, energy: 100, morale: 60, reputation: 0,
    skills: { musicianship: 20, performance: 10, songwriting: 10, promotion: 5, networking: 5 },
    skillLastUsed: { musicianship: 0, performance: 0, songwriting: 0, promotion: 0, networking: 0 },
    job: { status: 'full', standing: 60, vacationDaysLeft: 10 },  // 'full' | 'part' | 'none'
    loanOwed: 0,
    housing: 'starter',
    gear: { instrumentTier: 0, homeStudio: false, van: false },
    merchStock: { shirts: 0, cds: 0 },
    badLuckStreak: 0
  },
  band: { name: null, memberIds: [], formedDay: null },
  people: {
    // id: { id, name, role, skill, reliability, ambition, trait,
    //       relationship, satisfaction, status: 'contact' | 'member' | 'former',
    //       metDay, lastSeenDay }
  },
  songs: {
    // id: { id, title, isCover, progress, quality, tightness, lastPlayedDay,
    //       recording: { quality, day } or null, releaseId }
  },
  releases: [],              // { id, type: 'single' | 'ep' | 'album', songIds, day }
  cities: {
    // id: { id, fans, buzz, unlocked, lastActivityDay }
  },
  venues: {
    // id: { id, relationship, bannedUntilDay, pendingRequestId }
  },
  schedule: {
    // day number: { morning: entryId, afternoon: entryId, evening: entryId }
  },
  entries: {
    // id: { id, day, block, type: 'job' | 'gig' | 'studio' | 'rehearsal' | 'travel' | 'action',
    //       actionId, venueId, songIds, personIds, deal, status }
  },
  inbox: [],                 // { id, day, kind: 'offer' | 'event' | 'reply' | 'info',
                             //   templateId, data, expiresDay, resolved }
  milestones: {},            // milestoneId: day reached
  ledger: [],                // one entry per week: { week, income: {...}, costs: {...} }
  stats: { gigsPlayed: 0, bestResult: null, biggestCrowd: 0, totalEarned: 0 }
};
```

### Content files (fixed, not saved)

| File | What's in it |
| --- | --- |
| balance.js | Every tunable number in this doc |
| actions.js | Each action: name, blocks, energy, money, requirements, effects |
| venues.js | Each venue: city, name, tier, capacity, requirements, booking window, deals, foot traffic, ticket price |
| cities.js | Each city: name, distance, fan ceiling, unlock rule |
| events.js | Each event: how likely, when it can happen, text, choices and their effects |
| milestones.js | Triggers and what each one unlocks |
| traits.js | The six personality traits |
| names.js | Name lists for people, songs, and cover titles |

## Screens

Sixteen screens, most of them panels around one main Today view. The vertical slice needs the first twelve.

| # | Screen | What it shows | What you do there | In the slice? |
| --- | --- | --- | --- | --- |
| 1 | Title | Game name, Continue, New career, Import save | Start or continue | Yes |
| 2 | New career | Name and instrument, then a skills page to spend 50 starting points | Confirm | Yes |
| 3 | Today (main hub) | Top bar (cash, energy, morale, reputation, date, days to rent), three block cards, inbox preview | Fill blocks, End Day | Yes |
| 4 | Action picker | Available actions with cost, energy, and expected effect. Locked ones are greyed out with the reason | Pick an action | Yes |
| 5 | Day results | One line per block, plus overnight changes | Continue | Yes |
| 6 | Gig result | Crowd, score breakdown, rewards, one tip | Continue | Yes |
| 7 | Weekly summary | Money in and out, fans, reputation change, warnings | Continue | Yes |
| 8 | Inbox | Offers, replies, and events, with choices and expiry dates | Accept or decline | Yes |
| 9 | Calendar | A 4-week grid with everything booked | Book, cancel, open an item | Yes |
| 10 | Booking | Venues by city and tier, requirements, odds, expected crowd, deal choice | Send a request | Yes |
| 11 | People | Contacts and band, stats, relationship, satisfaction with reasons | Jam, hang out, invite, talk, remove | Yes |
| 12 | Songs | Catalog, quality, tightness, recordings, setlist editor | Write, set the list, record, release | Yes, basic |
| 13 | Shop | Gear, merch stock, van, housing | Buy | No |
| 14 | Map | Cities, fans and buzz in each | Plan travel | No |
| 15 | Career | Milestones, fame level, lifetime stats, career card | Share | No |
| 16 | Settings and saves | Export, import, reset | Manage saves | Partly (export and import) |

Visual style: simple and cartoonish, with details to come. Until then, plain colored panels and placeholder icons are fine.

## Open questions

I made these calls to keep moving. Each one is easy to change.

- [ ] **Going broke.** No game over. The first missed rent triggers a family loan, paid back at $50 a week. A second miss while the loan is open moves you to a friend's couch: $100 a week, but morale can't go above 50. Or should going broke end the run?
  - [ ] Answer: There is no limit on how far into debt the player can go: Mom and Dad keep lending $1,000 at a time whenever needed. If the player is in debt, they are limited from taking certain actions, such as upgrading their house. If the player debt remains greater than $3,000 for more than 5 weeks, the game is ended, with the message of "You went broke, had to sell your guitar, and move back into your parent's house. Maybe this music thing is more of a hobby for you." and presents the player with the option to return to the title screen to start a new game.
- [ ] **Cities.** Made-up names, or real cities with made-up venues? Real cities feel grounded; made-up ones avoid looking like real businesses.
  - [ ] Lets do made up city names with made up venues. Easier to modify and mimic.
- [ ] **Rival bands.** Left out for now. Should they come later, competing for the same bookings?
  - [ ] Leave out for now.
- [ ] **Starting instruments.** Guitar, Keys, or Bass, each also singing. Add Drums?
  - [ ] Guitar , keys, and bass as outlined in this doc are the only starting instruments.
- [ ] **Name.** Don't Quit Your Day Job, Gig Economy, or keep Band Rise?
  - [ ] Band Rise
- [ ] **Pace.** One in-game week should take about 3 to 5 minutes. Does that feel right?
  - [ ] Sounds good
- [ ] **Art direction.** Simple and cartoonish, details to come from you.
  - [ ] Simple and cartoonish for now. This game will be lots of admin screens and reading and selection boxes, less about characters interacting with spaces and enviornments.
