# Spec — Rivals become real: AI fatigue + derived play styles

**Branch:** `feat/rival-life` · **Worktree:** `/Users/letulip/Projects/Claude/tb-rivals`
(based on `refactor/ai-substream` @ 89cebb6 — AI tournaments now run on `seed:aitour:eventId`,
so AI outcomes may shift freely without moving the MAIN weekly stream.)
Player copy: short dash "–", no Cyrillic in player-facing strings.

## Why
Two asymmetries, both owner-approved to fix:

1. **Fatigue.** The kid has a full between-match condition system (drains per match + tier
   surcharge + the cumulative run ladder, recovers with time, scales her match strength, feeds
   injury risk). The cohort has NONE — only an in-match fatigue term off the static `stamina`
   stat. A rival can win a five-match J300 run and arrive at next week's event perfectly fresh.
   The cumulative run-fatigue slice makes this WORSE: deep runs now grind only the player.
2. **Style.** `PlayStyle` is the player's single build choice and (with the surface slice) now
   interacts with the court. The cohort has no style at all, so surface only ever cuts one way.

## Hard constraint: derive, never store
`world.cohort` is PERSISTED inside saves and `generateCohort` draws attributes sequentially —
adding a stored field would cost a schema bump AND shift every subsequent attribute for all 199
players (a full cohort re-roll). Both halves below are therefore **pure derivations from data the
world already holds**: no new WorldState fields, no schema bump, no new RNG draws.

## Part A — rival fatigue (derived from the results ledger)
The ledger already tells us everything: `SeasonResult { playerId, week, points, tier? }` — one row
per tournament result. `points` maps back through `TIERS[tier].points` to a finish index, and the
finish index gives **how many matches she played** (champion = log2(drawSize) matches, first-round
exit = 1, etc.). So:

- `rivalCondition(world, playerId, week)` — a pure function:
  - walk that player's recent results (a bounded window — the drain decays to nothing well inside
    the existing 52-week retention, so cap the scan);
  - for each, reconstruct matches played from `points` + `tier`, and apply the SAME drain math the
    kid uses: `matchDrain` per match + tier surcharge + the cumulative run ladder
    (`ECONOMY.condition.runFatigueLadder`) — reuse `tournamentRunStrain`-shaped logic rather than
    re-deriving it, so the two can never drift apart;
  - apply the same time-based recovery (`recoveryBase` per elapsed week; rivals have no plan
    slider, no physio and no vacations — that asymmetry is fine and is exactly the player's edge);
  - clamp to the same bounds.
  - **Tier is optional on AI rows** (`tier?`) — handle the legacy/missing case explicitly rather
    than crashing or silently treating it as free.
- Apply it where the AI `MatchPlayer` is built for a tournament, scaling attributes through the
  SAME condition→strength curve the kid uses (`matchStrengthKnee` / `matchStrengthFloor`), so one
  rule governs everybody.
- Do NOT give rivals injuries, physio, vacations or a doctor's veto — out of scope, and their
  absence is a deliberate player advantage.

## Part B — derived play styles
`styleOf(player: AiPlayer): PlayStyle` — a pure function of existing attributes (ranges at
generation: serve 30-60, ret 30-60, composure 25-70, stamina 30-70):
- serve clearly above ret → `serve-first`
- ret and stamina both high → `counterpuncher`
- serve and ret both high → `aggressive`
- otherwise → `all-court`
Pick concrete thresholds, document them, and assert the resulting distribution over a generated
cohort is sane (every style represented, none swallowing the field — report the histogram).

Then feed style + surface through `applySurfaceStyle(player, style, surface)` — the reusable pure
function from the `feat/surface-style` slice. **That slice is still in flight**: if the function is
not present on your base, implement Part B against a local equivalent with the SAME signature and
say so clearly in your report, so the two merge into one implementation rather than two.

## Composition
Rival `MatchPlayer` = base attributes → surface/style modifier → condition factor, applied exactly
once, in the same order as the kid's. Put it in ONE helper both paths call.

## Tests
- A rival who just won a five-match run is measurably weaker next week than an identical rival who
  did not play; after enough quiet weeks they converge again.
- Reconstruction correctness: a known (tier, points) round-trips to the right match count for every
  tier, champion and first-round exit included; a row with no `tier` is handled.
- Style distribution over a real generated cohort: every style present, plausible spread.
- Determinism: same seed → same everything (pure functions, zero draws).
- The frozen MAIN-stream pins stay byte-identical (read current values from the files) — this slice
  adds no draws. AI RESULTS will shift; re-pin any outcome-pinned test deliberately, one comment each.
- No schema bump; golden-save LOAD corpus green.

## Gates + measurement
`npx vue-tsc -b --force` 0 · `npx vitest run` all green · `npm run build` clean · `npm run check`.
Re-run `npm run bench:econ` (and `bench:fatigue` if not prohibitively slow) and report the
competitive effect: does the kid's win rate rise now that rivals tire? Does a deep run by a rival
show up as a soft week for whoever meets her next? Any degenerate cell (a rival pinned at the
floor all season)?
