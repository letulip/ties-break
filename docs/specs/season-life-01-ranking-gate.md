# Spec: Season Life — slice 1: ranking eligibility band + bench v2

Branch: `feat/ranking-gate` (worktree `tb-season`, off `feat/econ-breakdown-bench`).
Architect: Fable. Implementer: subagent, strict TDD. Gate: architect.

## Why (owner, 2026-07-24)

Players (owner included) enter every affordable tournament — the sim must GATE that, not assume
self-restraint. Slice 1 of the Phase-4 "Season Life" system: a **ranking eligibility band per tier**.
This one gate does three jobs: (a) self-limits over-entry (a low-ranked kid can't enter big tiers,
a top kid outgrows small ones), (b) couples the economy to the career ladder (climbing unlocks
bigger/pricier events → the path toward a PRO shot), (c) makes the bench's entry count realistic
(~15-20/yr per the research, ITF ≤20) so its burn numbers match real play.

Real-world grounding (docs/research/junior-economics.md): newcomers start at J30/J60 and climb;
high grades require ranking; top juniors effectively age/rank out of the lowest events.

## The band — ranking works in BOTH directions (owner's refinement)

A tier is not a floor, it's a **window `[bestRank, worstRank]`** on the kid's DENSE rank (1 = best,
larger = worse; a brand-new kid sits at `cohort.length + 1`, i.e. the very bottom):

> eligible for a tier ⇔ `band.bestRank <= kidRank <= band.worstRank`

- You can't enter a tier until you're **good enough** (`kidRank <= worstRank`).
- You're **graduated out** of a tier once you're **too good** (`kidRank < bestRank`).
- Bands OVERLAP, so there are windows where two tiers are open at once, then the lower one closes.

Provisional thresholds (in a ~200 cohort; **bench-tunable — the whole point of bench v2**):

| Tier | band `[bestRank, worstRank]` | reading |
|---|---|---|
| local | `[41, ∞]` | open to everyone at the bottom; graduates out at top-40 |
| regional | `[11, 130]` | opens at rank 130; graduates out at top-10 |
| national | `[1, 40]` | opens at top-40; never graduates (top tier for now) |
| itf | (locked; never scheduled) | n/a |

Use a large sentinel (`Number.MAX_SAFE_INTEGER`) for local's open bottom. Ladder walk this produces:
new kid (~rank 201) → **local only** → climb to 130 → **local+regional** → climb to 40 → national
opens, local closes → **regional+national** → climb to 10 → **national only**.

**Invariant (must hold): there is ALWAYS at least one eligible tier for any rank** — local's
`worstRank = ∞` keeps the bottom open, national's `bestRank = 1` keeps the top open. Add a test.

## Changes

### 1. TierDef gains the band (calendar.ts)
Add `enterRankBand: [number, number]` to `TierDef` + each `TIERS` entry (values above). itf gets a
band too (harmless; it's never scheduled).

### 2. Pure eligibility helper (world.ts, exported)
```ts
export function isTierEligible(tier: TierId, kidRank: number): boolean
// band = TIERS[tier].enterRankBand; return band[0] <= kidRank && kidRank <= band[1]
```
Pure, no world/RNG. The bench and tests call it directly.

### 3. enterEvent enforcement (world.ts)
After the deadline/funds/duplicate checks, reject an ineligible entry with a CLEAR, direction-aware
error:
- too-low (`kidRank > worstRank`): `Not ranked high enough for <Tier> (reach #<worstRank>)`
- graduated (`kidRank < bestRank`): `You've outgrown <Tier> (rank #<kidRank>)`

### 4. Snapshot surfaces eligibility (protocol.ts + upcomingEvents)
`UpcomingEvent` gains:
```ts
/** the kid's current rank meets this tier's band (both directions) */
eligible: boolean
/** why not, for the UI lock label; absent when eligible */
ineligibleReason?: 'locked' | 'outgrown'
```
Populate in `upcomingEvents` from `isTierEligible(e.tier, world.kidRank)` (+ which side failed).
NOTE: this is snapshot-only — **no persisted-state change, so NO SAVE_SCHEMA_VERSION bump.**

### 5. UI (SeasonScreen.vue + wherever `upcoming` renders entry actions)
An ineligible event renders locked: greyed row, a small lock label ("Reach #130" for locked /
"Outgrown" for outgrown), and the enter/Watch-entry action disabled. Keep it lightweight; match the
existing this-week / calendar styling. Player-facing copy uses the short dash `–`.

### 6. Bench v2 (tools/econ-bench.ts)
- Entry policy must respect eligibility: in the entry loop, skip events where
  `!isTierEligible(e.tier, world.kidRank)` (BEFORE the affordability check) — otherwise enterEvent
  now throws. (Entry policy is now "every ELIGIBLE, affordable event".)
- Add an **entries-per-season counter** to `SeedResult`: total entered + a per-tier breakdown
  (`{ local, regional, national }`). Render a line per preset: `entries N/season (L.. R.. N..)`.
- Re-run. Expected: entry count drops from ~50 toward the realistic ~15-25, and travel+entry fall
  accordingly (this is the reconciliation with the owner's lived 25k result). Report the new table.

## Invariants / constraints
- **RNG identity**: eligibility is a pure rank check — it changes NO main-stream draw. The kid's
  entry choices already never affect the cohort draw count; this only narrows which events the kid
  MAY enter. The cohort-drift / identity guard must stay green.
- **No schema bump** (nothing new persisted).
- Do NOT touch `docs/decisions.md`. Do NOT `git push`. Work only in `tb-season`. Short dash `–` only
  in player-facing copy.

## Tests (TDD — write first)
- `isTierEligible`: in-band true; below `bestRank` (too good) false; above `worstRank` (not good
  enough) false; boundaries inclusive.
- Ladder invariant: for every rank 1..(cohort.length+1) at least one tier is eligible.
- Overlap: some rank yields local+regional both eligible; some yields regional+national both.
- `enterEvent` throws the right message for a too-low rank and for a graduated (too-good) rank; still
  succeeds when eligible.
- `upcomingEvents` sets `eligible`/`ineligibleReason` correctly for a low-ranked and a top-ranked kid.
- Bench: entries-per-season is counted; a low-ranked start enters only local early (a spot check).
- Identity/cohort-drift guard still green.

## Gate (architect)
`npx vue-tsc -b` = 0 · `npx vitest run` all green (+ new tests) · `npm run build` clean · dash sweep ·
`npm run bench:econ` re-run pasted (new entry counts) · browser spot-check: a fresh (bottom-ranked)
career shows regional/national locked on the Season screen, local enterable.

## NOT in this slice (later Season-Life slices)
Fatigue/injury/physio, coach tiers + coach-travel, explicit income valves (incl. the owner's
club-barter valve: work at a local club → compensates coaching, no cash), qualifying draws /
wildcards as eligibility escape hatches, blogs/online-presence/fans (backlog). Keep scope to the
ranking band + bench counter.
