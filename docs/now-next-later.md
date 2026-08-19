---
type: plan
status: current
area: delivery
canonical: true
last-reviewed: 2026-08-19
---

# Now / next / later

## Current truth

- **This is the only current delivery document.** The August [roadmap](plans/roadmap-2026-08.md) and
  [launch plan](plans/launch-plan-2026-08.md) are `superseded` and kept as history: they schedule
  save-schema work in the v35–v39 range, and `SAVE_SCHEMA_VERSION` in `src/engine/world.ts` is long
  past it. Take neither ordering nor state from them.
- **Nothing on this page is a new priority.** Every line is transcribed from [the owner's dated
  log](decisions.md) or from a [round ledger](rounds/README.md) and names its source. A line with no
  source does not belong here.
- **State is read from the code and the ledgers, never copied here.** The schema number is the
  constant; what shipped is the ledger box with the place it landed written in it.
- **An item is done when its box is ticked with WHERE** – [`rounds/README.md`](rounds/README.md),
  §"Keeping this true". Nothing enforces that mechanically, which is why this page routes to the
  ledgers rather than restating them.

## Now

**`wave/round22` is the live wave, and it has no ledger.** Its items exist only in its commit
subjects – `git log --oneline origin/main..wave/round22`. The rounds folder's own rule is that a
round gets its file on the day it is triaged; this one did not get one. **Closing that gap is the
first thing on this page**, and it needs the owner's own numbering, not an inference from commit
messages. (Source: [`rounds/README.md`](rounds/README.md) §"Keeping this true" step 6, against the
absence of a `round-22.md` in that folder.)

## Next – named, and nothing has to be decided first

Each of these is already diagnosed in writing and none is waiting on a ruling.

- **Fourteen birthdays a career are never announced.** Dates 1–6 January and 31 December fall in the
  gap between the last career week of one season and the first of the next. Her age is right; the
  note and the gift are lost – and the tool that reported "0 lost" skips exactly those cases.
  ([decisions.md](decisions.md), 18.08, "four things found on the way" item 2.)
- **Round 18 items 1–3, all `[!]`** – three re-reports of one miss (round 17 #14): the coach plaque's
  text alignment on the main screen, the spacing beside the coach pictures in the picker, and tapping
  a chosen coach's plaque to reach the coach list. ([round-18.md](rounds/round-18.md).)
- **Round 16 #8, kit wearing on holiday** – asked three times, never built – and **#20, keeping the
  screen awake during a match**, where no code exists at all. ([round-16.md](rounds/round-16.md).)
- **Round 21 #1 and #9** – a dialog confirming intent before a save is loaded, and the fork popup
  that covers the interface the moment the final match ends. ([round-21.md](rounds/round-21.md).)
- **Round 8 #1, the in-tournament player card** – untouched since 25.07 and the oldest open item in
  the folder. ([rounds/README.md](rounds/README.md), the round-8 row.)

## Later – needs the owner's word, not an engineer's

- **Wild cards: the door admits, the calendar shows shut.** `entryStatus` has a fourth door
  (`homeWildCardPlace`) that `tierOpenFor` knows nothing about. Pre-existing and verified by control;
  the fix is the calendar learning the same door, which changes what is on screen, so it is his call.
  ([decisions.md](decisions.md), 18.08, "four things found on the way" item 4.)
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
