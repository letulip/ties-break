# Spec — Bench multi-season horizon (Agent A, Wave 1)

**Branch:** `feat/bench-horizon` · **Worktree:** `/Users/letulip/Projects/Claude/tb-bench`
**Touches ONLY:** `tools/econ-bench.ts` and `tests/econ-bench.test.ts`. Nothing else.
**Depends on:** nothing (runs against current `main`, save schema v11). Independent of Slices B/C.

## Why
Today the bench answers "does a family go bankrupt in one 52-week season?". The owner wants the
**whole-horizon** picture: run the career forward to **first prize money (age 16)** and to a
**pro attempt (age 18)** and report, per family profile, the cumulative chance of surviving
(not going bankrupt) and the chance of reaching the target — so we can see "what the whole math
gives and what everyone's chances are."

## Scope of THIS slice
Horizon core only. Read `tools/econ-bench.ts` in full first; the line numbers below are hints from
a prior reading and may have drifted — anchor on the **symbol names**.

1. **Two horizons.** `START_AGE_YEARS = 14`, `ageYears = 14 + Math.floor(week / 52)`,
   `horizonWeeks = (targetAge - 14) * 52`.
   - `14→16` = **104 weeks** (2 seasons, "first prize money" proxy)
   - `14→18` = **208 weeks** (4 seasons, "pro" proxy)
   Replace the `SEASON_WEEKS = 52` constant with `HORIZONS = [{label:'14→16', weeks:104}, {label:'14→18', weeks:208}]` and iterate BOTH in `main`. (Player-facing/report copy uses the short dash "–"; the arrow "→" in a code label is fine, but keep any prose dashes short.)

2. **Carry state across seasons by continuing to tick the SAME world.** Do NOT recreate a world per
   season. Keep the single `createWorld(seed, profile)` and single `rngFromSeed(world.seed)` for the
   whole horizon; change the loop bound from `SEASON_WEEKS` to `horizonWeeks`. Carry is emergent:
   `fundsCents`, `kidRank`, the rolling 52-week `results` ledger, `bestFinishByTier`, and
   `lastSeasonSummary` all live on `WorldState`. Determinism: `(preset, index, horizon)` must
   reproduce byte-identically (same seed → same continued main stream).
   - Generalize `runSeason(preset, index)` → `runCareer(preset, index, horizonWeeks)`.

3. **Finance read MUST change — this is the correctness crux.**
   `financeWindow(world.financeWeeks, 0)` is WRONG past 60 weeks: `pruneFinanceWeeks` trims
   `financeWeeks` to a 60-week trailing window, so at horizon end only the last ~60 weeks survive.
   Instead **accumulate per season at each wrap**: a season wraps when `world.week % 52 === 49`
   (season-first off-season week; wraps land at weeks 49, 101, 153, 205). At each wrap call
   `financeWindow(world.financeWeeks, yearStartWeek)` for the just-finished 52-week block (a full
   year is always retained at its own wrap week since 52 < 60), and **sum** those per-year windows
   for the cumulative income/expense/net. Capture `world.lastSeasonSummary` at the SAME tick (it is
   overwritten yearly) for per-season endRank/points/wins/losses/fundsDelta.
   **Do NOT raise the engine's `FINANCE_WEEKS` from the bench** — fix it in the bench's read.

4. **Survival report per profile per horizon.** Cumulative bankruptcy-survival = fraction of the 30
   seeds with `weeksToBankrupt === null` over the FULL horizon. Extend the existing bankruptcy
   summary to a row like: `survived N/30 · median week-to-red = W` (median over the seeds that DID
   go red; "–" if none).

5. **Chance-to-reach (proxy).** Add a tracker `reachedWeek: number | null` = the first week a target
   is met. Since the engine models **no prize money** (tournaments award POINTS only; income =
   parent + local sponsor + gear subsidy), define the target against existing state:
   - `14→16`: `REACH_TARGET_MONEY` = national-tier eligibility → `kidPoints(world) >= 150`
     (equivalently `isTierEligible('national', kidPoints(world))`).

     > **⚠ RE-BASED 150 → 320 (chore/reach-and-art).** Eligibility stopped being an achievement:
     > after two `TIER_LADDER` re-spacings (9 → 12 → 16 rungs, each re-dividing `tierPhase` and
     > re-dealing the season) **270 of 270 careers clear 150 inside 104 weeks**, most by about week
     > 20 – a formality, not a measurement. 320 is the next milestone on the SAME axis, out of
     > National's own table: `points[0] + points[1]` = a National title plus a National final inside
     > the windowed best-6 (equivalently four Regional titles), and above J30's 250 floor. Measured
     > by `tools/reach-sweep.ts` (9 presets × 30 careers): **11–14 of 30 clear it in every preset**,
     > and the count is flat for any threshold in [319, 323] on the tightest preset – a plateau, not
     > a knife edge. The sweep is committed; re-run it before the next re-base. Full history in the
     > comment stack of `tests/econ-reach.test.ts`.
     >
     > **⚠ AND IT GOVERNS 14→16 ONLY.** `reachedTarget` keys on `targetAge`, so `targetAge >= 18`
     > takes the pro arm: 14→18 and 14→20 never read `REACH_TARGET_MONEY`. A report that says
     > re-basing it will un-saturate 14→18 is reading the wrong constant.
   - `14→18`: `REACH_TARGET_PRO` = `(hasResults && kidRank <= 50) || kidPoints >= 300`, where
     `hasResults` = the kid has ≥1 counting result. **The `hasResults` guard is REQUIRED:** without it
     the rank arm is degenerate — in the opening weeks the whole point-less field ties at dense-rank 1,
     so `kidRank <= 50` is trivially true from week 1 (the same dense-rank tie the `rankLabel`/Unranked
     polish addresses). Only count a pro-rank reach once she has a real ranking. The points arm
     (`kidPoints >= 300`) is unguarded (earned, not tie-degenerate).
   Report reach-rate (% of 30 seeds reaching within the horizon) + median reach week per profile.

6. **PROMINENT caveat** in `POLICY_HEADER` and the printed report: prize money is NOT modeled yet, so
   this bench measures **survival runway** (how long the family bankroll lasts) plus a **points/rank
   reach-rate proxy** — not earnings. Literal "first prize money" would require adding a payout
   income category to `finalizeTournament` first (out of scope for a measurement-only tool).

   > **⚠ DONE, AND THE CAVEAT IS GONE (31.07, task #17 / A2).** The payout income category this item
   > names as the blocker now exists — `finalizeTournament` credits `'prize'` off the finishing tier's
   > own `TierDef.prizeCents` table — so the bench prints the earnings it was standing in for. It also
   > gained a **third horizon, 14→20**, because the adult rungs open at 16/16/17 and the question is
   > unaskable inside 14→16, and an **A4 block per preset**: how many careers are ever paid at all,
   > and how many ever have a week whose cheque beats that week's costs. The reach targets in item 5
   > are deliberately unchanged, so every historical number in this file is still comparable.

7. **Plumbing.** Extend `SeedResult` with: `survived: boolean`, `reachedWeek: number | null`,
   `endRank: number`, `endPoints: number`, and `perSeason: { seasonYear: number; endRank: number;
   points: number; wins: number; losses: number; netCents: number }[]`. Update `renderPreset`,
   `POLICY_HEADER`, `toCsv`, and `main`'s iteration to cover both horizons and the new rows.
   (Leave `injuriesTotal`/`weeksInjured`/`physio` bucket OUT — see Deferred.)

8. **Off-by-one guard.** Assert the per-season capture fires exactly `(targetAge - 14)` times per run
   (2 for `14→16`, 4 for `14→18`); the final season's wrap (week 205) is inside the 208 bound.

## Explicitly DEFERRED to a post-B/C follow-up (OUT of scope here)
Condition/injury do not exist in the engine until Slices B/C merge. So this slice does **not** add:
availability-gate awareness in the entry policy, an `--injuries=off` flag, a "naive" max-train
policy variant, or the `'physio'` expense bucket. The entry policy stays the CURRENT one
(`isTierEligible` + `ENTRY_LOOKAHEAD`). A follow-up wires the gate once B is merged.

## TDD — extend `tests/econ-bench.test.ts`
Write tests FIRST, watch them fail, then implement. Cover at least:
- **Determinism:** `runCareer(preset, 0, 104)` twice → identical `SeedResult` (deep equal).
- **Per-season capture count:** a `14→18` run yields exactly 4 `perSeason` entries; `14→16` yields 2.
- **Finance-past-60 correctness:** the cumulative net for a `14→16` run equals the sum of the two
  per-year `financeWindow` folds, and is NOT equal to `financeWindow(financeWeeks, 0)` when the run
  exceeds 60 weeks (guards the pruning bug). Use a seed where spend accrues every year.
- **Reach tracker:** a profile that clears the target has `reachedWeek !== null` and
  `reachedWeek` is the FIRST week the predicate holds; one that never does has `null`.
- **Survival field:** `survived === (weeksToBankrupt === null)`.

## Gate (Definition of Done)
- `npx vue-tsc -b` → 0 errors. `npx vitest run` → all green. `npm run bench:econ` runs both horizons
  and prints the survival + reach rows with the caveat visible.
- Do NOT `git push`. Do NOT edit `docs/decisions.md`. Commit spec + code + tests on
  `feat/bench-horizon` with a clear message. Report the two horizons' survival% and reach% per
  profile in your final summary so the architect can gate.
