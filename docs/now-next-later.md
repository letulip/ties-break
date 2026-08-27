---
type: plan
status: current
area: delivery
canonical: true
last-reviewed: 2026-08-27
---

# Now / next / later

## Current truth

- **This is the only current delivery document.** The August [roadmap](plans/roadmap-2026-08.md) and
  [launch plan](plans/launch-plan-2026-08.md) are `superseded` and kept as history: they schedule
  save-schema work in the v35–v39 range, and `SAVE_SCHEMA_VERSION` – which DECLARES itself in
  `src/engine/world/state.ts` since the decomposition, re-exported through the `world` barrel – is
  long past it (v61). Take neither ordering nor state from them.
- **Nothing on this page is a new priority.** Every line is transcribed from [the owner's dated
  log](decisions.md) or from a [round ledger](rounds/README.md) and names its source. A line with no
  source does not belong here.
- **State is read from the code and the ledgers, never copied here.** The schema number is the
  constant; what shipped is the ledger box with the place it landed written in it.
- **An item is done when its box is ticked with WHERE** – [`rounds/README.md`](rounds/README.md),
  §"Keeping this true". Nothing enforces that mechanically, which is why this page routes to the
  ledgers rather than restating them.

## Now

⚙ THE LIVE WAVE IS ROUND 27 – this line is machine-checked against the newest ledger in
`docs/rounds/` by `scripts/doc-facts.mjs`; edit the number only by shipping a ledger.

**Round 27 is OPEN – the college mini-round** ([round-27.md](rounds/round-27.md), 27.08). Eleven
observations from two afternoons of his own play, collected on his ask. ⭐ Four were answered by
reading rather than building and two of those found the shipped behaviour was already what he wanted;
one is REOPENED because round 26 measured a neighbouring problem and fixed that instead. ⚠ **Nothing
in it is built yet, and the order is not free**: item 9 (are careers three years ahead of the
development model's own anchor?) decides whether item 3 is a fix or a symptom, so the wave waits on
one measurement. The argument lives in
[college-the-last-mile-2026-08.md](specs/college-the-last-mile-2026-08.md).

**Round 26 has LANDED** – [round-26.md](rounds/round-26.md), merged 26.08 as
[#106](https://github.com/letulip/ties-break/pull/106). Thirteen college observations from a career
played through all four years, captured 24.08; **FOUR of them were reopened on a second pass** (#1,
#2, #4, #10 – this line said «three» until 26.08), and #14–#18 were added as he played and watched.
Every box in that ledger is ticked with where it landed. ⚠ Two things it leaves open by decision
rather than by omission: the injury dose awaits his own play, and the calendar still shows no past
matches at all.

**Rounds 24 and 25 have landed** – [round-24.md](rounds/round-24.md) (the college flow: the freeze
defect, the Home shell, the College League, the academic year, the birthdays) and
[round-25.md](rounds/round-25.md) (the masseur and his dial, the shoot weeks, recovery variant C,
the team's prize share, the sim corridors, the git hygiene). Both ledgers were written 23.08 from
the plans, specs and commit bodies – two days after the fact, which is itself recorded in them.

⚙ **26.08 – TWO WAVES ARE PICKED AND ORDERED, and this is the first time this page has had a queue.**

1. **`wave/the-long-goodbye` – RUNNING.** [the-long-goodbye-2026-08.md](specs/the-long-goodbye-2026-08.md).
   His Federer question turned into a rework of how a career ends: the trigger leaves the birthday and
   reads a share of her own peak physical (**55%**, his ruling, which puts the ceiling at Federer's 41),
   the recovery corridor fades with the body every year, and the final offer stops being a question
   with one legal answer and becomes her own line. Step 1 of 4 is building.
2. **The shop – QUEUED BEHIND IT.** [the-shop-2026-08.md](specs/the-shop-2026-08.md), slice 1 only:
   the tab, static prices, buy / own / sell. ⚠ **Its own wave and its own branch, started only once
   the ending wave has landed** – his word, and the house's one-branch-per-wave rule.

⚠ **Everything else waits on play, by his own decision 26.08: «Остальное надо уже щупать».** Both
specs above carry open questions he has deliberately left open until he has felt the thing – the
injury dose, the plateau offer, whether the academy comes early.

**What is genuinely NOW is nothing until the owner picks it.** The backlog carries states on every
row ([backlog/README.md](backlog/README.md) – Now / Next / Later / Parked / Rejected) and **Now is
deliberately empty**: it is assigned by the owner's pick, not by a sweep. The R2 programme
([backlog/the-r2-programme.md](backlog/the-r2-programme.md)) is the one approved-and-launched set –
**waves A and B have shipped, waves C and D are running** (23–24.08), and the one-page mirror of
what survives them is [backlog/WHAT-IS-LEFT.md](backlog/WHAT-IS-LEFT.md).

⚠ Older entries below this line are kept as the page's own history; where a round has since been
ledgered, the ledger wins.

- ~~**No spec for round 22's two balance changes**~~ – the tenure ramp and the live professional
  table. Still open at the time of writing and still owed by invariant 4; carried as a row in
  [backlog/the-quality-rig.md](backlog/the-quality-rig.md) rather than here.
  ([round-22.md](rounds/round-22.md), "What is still open".)

## Next – named, and nothing has to be decided first

Each of these is already diagnosed in writing and none is waiting on a ruling.

- ~~Round 18 items 1–3~~ – **shipped 13.08 in `c07e2a1`** («round-18 #1, #2, #3: the coach surfaces,
  on the screen he meant»), six days BEFORE this page listed them as open: the 54px margin is back on
  Home, the picker's `.cm-art` floor is `ROUND-18 #2` in `style.css`, and the landing-tab rule is
  `ROUND-18 #3` in `CoachMarketScreen.vue`. The round-18 ledger's `[!]` boxes were the stale source –
  the same failure as the three items struck below. (Corrected 23.08, backlog sweep.)
- **Round 16 #8, kit wearing on holiday** – asked three times, never built – and **#20, keeping the
  screen awake during a match**, where no code exists at all (no `wakeLock` reference in `src/`).
  ([round-16.md](rounds/round-16.md).)
- **Round 8 #1, the in-tournament player card** – untouched since 25.07 and the oldest open item in
  the folder. ([rounds/README.md](rounds/README.md), the round-8 row.)

⚠ **Three items were listed on this page on 19.08 that had already shipped, and all three are
removed.** Two were transcribed out of the 18.08 decision entry's "four things found on the way"
without being checked against the tree, and one out of a round ledger whose boxes had rotted. That is
the failure this page's own "Current truth" rule exists to prevent: a source was named, and the
source was stale. **Naming a source is not the same as checking one.**

- ~~Fourteen birthdays a career are never announced~~ – **fixed in `b93e178`**; a birthday the
  calendar cannot place is carried by the first career week past it. Re-measured 19.08:
  `tools/birthday-age-read.ts` reads *"birthday never fired: before 43, after 0"*.
- ~~Wild cards: the door admits, the calendar shows shut~~ – **fixed in `b93e178`**, in the same
  commit as the birthdays, and listed here under *Later* as still needing his word. `tierOpenFor`
  now scans her own season and asks `homeWildCardPlace` itself; the temporary exemption in
  `tests/ladder-floor.test.ts` is removed and the strict assertion is back.
- ~~Round 21 #1 and #9~~ – **both shipped on 15.08 in `ac5ea3d`**, four days before they were written
  here as open. The import confirm names the career it replaces and is mounted-tested
  (`tests/component/round21-dialogs.test.ts`); the popup-order rule is `popupMayShow` /
  `screenBusy`, with injury and ending the only interrupts. The round-21 ledger's boxes were the
  stale source and are now ticked.

## Later – needs the owner's word, not an engineer's

- **One tier label is still the sport's own term** – `label: 'Grand Slam'`, while `CLAUDE.md`'s
  invariant says tournament and organisation names are fictional because ITF/WTA/ATP are trademarks.
  ⚠ Corrected 24.08: the `WTA 125/250/500/1000` rungs this line named have been
  `World Tour 125/250/500/1000` in `src/engine/season/calendar.ts` since his own 18.08 instruction,
  so one word is all that is flagged. ([round-22.md](rounds/round-22.md), #15–16.)
- **The balance methodology of the review's chapter 04** – distributions not anecdotes, median plus
  tails, corrections separated from tuning – is written up and **not adopted**; it is his call.
  ([balance-methodology-proposal-2026-08-19.md](plans/balance-methodology-proposal-2026-08-19.md).)
- **The dormant `HandoffView` fields** – confirmed dormant, left standing with a dated note.
  ([round-22.md](rounds/round-22.md), #9–14.)
- **Round 14 #17, the difficulty wrapper** – needs a ruling, not a build.
  ([rounds/README.md](rounds/README.md), the round-14 row.)
- **Round 17 #15, why pay a coach, and #22, rivals in commentary** – both `[>]`: measured and priced,
  waiting on his word. ([round-17.md](rounds/round-17.md).)
- **Round 16 #10 – `key` / `full` should drive the match, not only the text** – explicitly left
  alone. ([round-16.md](rounds/round-16.md).)

## What this page will not do

It does not restate a ledger, count open items, or carry a schema number: all three go stale between
the day they are written and the day they are read, which is what happened to the two plans it
replaces. Route from here, then read the state from the ledger box or the constant.
