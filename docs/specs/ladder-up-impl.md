# Spec — Ladder-up implementation: J-levels + cohort pre-history

**Branch:** `feat/ladder-up` · **Worktree:** `/Users/letulip/Projects/Claude/tb-ladder` (off main `ca686ff`)
Builds on the owner data recorded in `docs/specs/ladder-up.md` (read it first). Fictional analogues
only. Player copy: short dash "–", no Cyrillic in player-facing strings (owner's copy rule).

## Why both halves ship together
J-level entrant fields are selected from AI ranking percentiles. In year 1 every AI starts at 0
points, so a "top international field" is currently indistinguishable from a local one — the owner
saw the symptom (R9-2: a Regional/National running in week 1 with a zero-point field; R8-9: a
National champion missing from the top-10). Waking the J-tiers without meaningful rankings would
multiply that bug. Hence one slice.

## Part A — cohort pre-history
**Goal:** on a fresh career the AI cohort already has a season of results behind it, so rankings are
real from week 1; the KID stays unranked (0 points — the `rankLabel` "Unranked" behavior must not
regress).

- Generate at `createWorld` from a purpose-scoped sub-stream `rngFromSeed(seed + ':prehistory')` —
  never the main weekly stream (B1/C1 freezes must stay byte-identical).
- **Recommended shape (verify before committing to it):** write synthetic `SeasonResult` rows for
  cohort players at NEGATIVE weeks `[-51, -1]`, so the existing rolling-52 window
  (`windowedBestSum` over `[week-51, week]`) includes them at week 0 and they age out naturally
  across the first year — no new fields, no new decay logic. **Check first** that nothing assumes
  `week >= 0` (pruning/housekeep, finance, any `Math.max(0, …)`); if something does, say so and pick
  the alternative (a `priorPoints` baseline on `AiPlayer` consumed by `computeRanking`), documenting
  why.
- Distribution: a realistic pyramid — a few strong players with several counting results, a long
  tail with one or two. Strength should CORRELATE with the player's existing skill attributes so the
  table is coherent (a 0.9-skill AI shouldn't sit at rank 190).
- **Expected fallout, all deliberate:** the kid now starts ranked LAST rather than #1 (the dense-tie
  artifact disappears — this is the fix, not a regression). Re-pin every test that asserted the old
  start state, one comment per re-pin explaining it. Entry gating is points-based, so tier access is
  unaffected by design — verify that.

## Part B — the J-level family
Replace the inert `itf` tier with a family (real ladder: J500/J300/J200/J100/J60/J30, where
**J30+J60 = 75% of all events**). Ship three levels now; the rest is content later:

| id | label (fictional) | draw | entry | travel band | everyNWeeks | notes |
|---|---|---|---|---|---|---|
| `j30` | Junior Tour 30 | 32 | $200 | $900-2000 | **2** | the dense entry level |
| `j60` | Junior Tour 60 | 32 | $250 | $1100-2400 | **3** | dense |
| `j300` | Junior Tour 300 | 32 | $400 | $1600-3200 | **13** | rare, prestige |

- Points arrays scale with the level (j30 ≈ the current `itf` array; j60 ~1.5×; j300 ~2.5×) — pick
  concrete numbers and justify them in a comment against the existing local/regional/national ladder.
- **Overlapping `enterPointBand`s** so there is always somewhere to go (the owner's core requirement):
  national stays `[150, MAX]`; j30 opens around national's mid-range and stays open; j60 above it;
  j300 highest. Design the overlaps so no gap exists at any point total ≥ 150, and document the
  ladder as a comment table.
- **Age gate 13+**: the tier is unavailable below 13 (our start is 14, so open immediately) — add it
  as a tier field or an availability check, whichever is cleaner; note it for the childhood prologue.
- **NO prize money** at any J-level (real: juniors pay to play) — this is the "invest without knowing
  the return" thesis at full strength. Do NOT add prize income anywhere.
- Travel is international: it flows through the existing `wealthCorridor` scaling untouched.
- **Type ripple (TierId is a union):** extending it touches `ECONOMY.availability.minConditionToEnter`,
  `ECONOMY.condition.tierMatchFatigue` (J-levels are the most draining: extrapolate above national),
  `bestFinishByTier`, the Home season strip, `TierGuide.vue`, and the per-tier split in
  `tools/econ-bench.ts`. Sweep them all; the compiler will help.
- **Removing `itf`:** grep the fixtures/golden saves and every `Record<TierId, …>` first. It is inert
  (never scheduled) so nothing should reference it, but if any persisted data does, keep an alias or
  migrate rather than break the corpus.
- Also densify `national` in the season's second half (owner R9-20: 4/year is too sparse for a kid
  who has outgrown regional) — a modest bump, justified in a comment.

## Gates + measurement
- `npx vue-tsc -b --force` 0 · `npx vitest run` all green · `npm run build` clean · `npm run check`.
- B1/C1 main-stream freezes byte-identical; golden-save LOAD corpus green; schema bump only if the
  chosen pre-history shape genuinely needs persistence (prefer none).
- **Re-run BOTH benches** (`npm run bench:econ`, `npm run bench:fatigue`) and report: entries/season
  and the per-tier split (does the calendar stay full after outgrowing regional?), travel burn (the
  international bands bite — does 8k still survive?), condition/injury shifts from the denser
  calendar, and where the kid's start rank lands. Flag anything that argues for the pending tuning
  pass rather than fixing it here.
