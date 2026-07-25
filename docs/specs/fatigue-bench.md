# Spec — fatigue/injury bench (owner ask 25.07: "стенд с симулятором усталости/травм для сезона и динамики")

**Lands on:** `fix/round8-ui` AFTER the round-9 packs (it exercises the NEW condition math).
**New tool:** `tools/fatigue-bench.ts` + `npm run bench:fatigue` + `tests/fatigue-bench.test.ts`.
Headless vite-node over the REAL engine (same pattern as econ-bench; money stays econ-bench's
job — here only physio spend crosses over). Deterministic: (profile, policy, seed index, horizon)
reproduces byte-identically.

## Matrix
- **Profiles:** 8k working·self, 25k middle·self, 25k middle·hired, 120k wealthy·hired.
- **Policies** (the load-management axis — this is what the bench exists to compare):
  - `grinder` — plan 85/15, enters EVERYTHING eligible+affordable (ignores the fatigue caution).
  - `balanced` — plan 75/25, same entry rule (the default player).
  - `careful` — plan 60/40, physio always ON, skips entry while condition < tier floor + 10,
    rests until recovered.
- **Horizons:** 52w (one season), 104w (14→16), 208w (14→18). 30 seeds per cell.

## Metrics per cell (mean ± spread)
- **Condition dynamics:** mean weekly condition; % of weeks in bands `<40 / 40-69 / ≥70`;
  end-of-season condition per season; deepest trough.
- **Injuries:** injuries/season (by severity split), weeks lost/season, walkovers, physio spend,
  caution-entries (entered while fatigued below the tier floor).
- **Coupling teeth:** kid match-win % per policy (the careful player should convert her freshness
  edge — quantifies the new 0.55/70 curve), matches played, best rank reached.
- **Sanity anchors:** balanced ≈ real junior prevalence (~0.5-1.1 injuries/season, minors
  dominating); grinder ≥ 3× careful on injuries (mirrors the C3 Monte-Carlo).

## Dynamics output
- `--csv <path>`: weekly time-series per run (week, condition, injuredFlag, tierPlayed,
  matchesThisWeek) — for plotting the season curve.
- Terminal: a compact per-cell ASCII sparkline of the mean weekly condition (52 chars per season
  row) so the shape is visible without leaving the shell.

## Tests (TDD)
- Determinism (same cell → deep-equal).
- Ordering: grinder mean condition < balanced < careful; injuries/season grinder > careful (≥3×).
- Formula spot-check: replay one seed's weekly condition trace against an independent
  re-computation from the owner's math (+2 base, slider bonus 0/1/2 on match-free weeks, +2
  physio, +1 blackout, per-match drains with TB/tier rules) — byte-equal trace.
- The bench makes NO engine changes; B1/C1 invariance freezes untouched.

## Report format (for the architect's gate + the owner)
One table per horizon: profile × policy → mean cond / %<40 / inj/season / weeks lost / win% /
caution-entries. Plus the balanced-vs-anchors line and any cell where the new math produces
something degenerate (condition pinned at 0 or 100, injury spirals, unplayable calendars).

## Factorial grid (owner 25.07 scope extension: unbundle the axes)
On top of the three headline policies: plan {85/15, 75/25, 60/40} × entry {enter-all,
floor-respecting (+10)} × physio {on, off} = 12 cells per profile, 104w, 10 seeds/cell (reduced
from 30 for runtime; the reduction is logged in the output). Each grid cell also reports the
MONEY coupling – planFactor-scaled coaching spend, physio spend, end-of-horizon funds – so the
effort↔wallet↔condition triangle is visible in one table. Policies are DATA
(`Policy`/`gridPolicies()` in tools/fatigue-bench.ts): a future axis is a new field, never a
code fork.

## V2 scenario (owner 25.07, after the baseline report)
V2 = recoveryBase only on match-free weeks + physio conditionBonusPerWeek 2 → 1. The engine
grew ONE knob for it – `ECONOMY.condition.matchWeekRecoveryBase`. The bench patches the LIVE
ECONOMY (`withScenario`), runs full sections per scenario, restores the values, and closes
with a delta block. Determinism holds per scenario.

## V2 + V2.1 SHIPPED (owner verdict 25.07 "V2 хорош" + "все чуть ниже к концу сезона")
The ENGINE DEFAULTS are now the full V2.1 set: recoveryBase 1 (free-week ladder 1/2/3),
matchWeekRecoveryBase 0, physio bonus 1. The affected condition/round-9 pins (B2/B3/B4,
R9-10/R9-14) were re-pinned deliberately; the draw-count invariance freezes stayed green
untouched. Bench scenarios since the flip: `baseline` = shipped knobs (full: headline + grid +
PROJ), `v2` = the previous candidate patched back (recoveryBase 2; headline + PROJ – the audit
trail of the V2.1 decision), `legacy` = the original round-9 values 2/2/2 (headline only).
endSeason metrics read wk49 (the wrap, BEFORE the off-season restore) and wk51 (after the 3
blackout weeks); the owner target: wk49 lands ~60-85 by policy and blackout weeks + a
pre-season package restore to ~95-100. The INJURY PANEL calibrates all three policies against
docs/research/injury-stats-by-age.md (juniors 46-54%/season, ~0.5-1.1 inj/season minors-heavy,
weeks lost 1.0-2.3/yr, heavy-load teen-peak ~95% prevalence as the grinder analog) using REAL
per-season prevalence (share of seed-seasons with ≥1 onset).

## Practice model (owner rule 25.07)
Practice drain = max(1, local-scoreline drain − 1) → flat 1 in the projection (locals are
mostly 1-2 scoreline drains); the REAL engine mechanic will grade off scorelines. Week-type
recovery semantics: tournament week = 0 base · practice week keeps the base but FORFEITS the
slider bonus · free week = base + slider. Owner's vision: (almost) every week has ≥1 game by
choice.

## Planner projection (PROJ – not a simulation)
On top of the V2 traces: practices (−1 condition, court $30-80 × corridor; grinder every
eligible empty week / balanced every other / careful only at condition ≥ 80) and vacations
(careful books below 60 the cheapest package clearing 80; balanced one sea week per season in
the off-season; grinder never). Package boosts are the owner's ladder (staycation +12 … elite
+30); package PRICES are bench ASSUMPTIONS – docs/specs/season-planner.md does not exist in the
repo yet; swap the numbers in tools/fatigue-bench.ts `PLANNER` when it lands. Injuries are a
deterministic expected-value integral of the tau formula over the projected fatigue. Blind
spots (printed in the output): no result/calendar feedback, practices affect neither skills nor
the overuse counter, midpoint prices, no bookings on exam weeks.

## Not modeled yet – re-run required
FRIENDLY MATCHES and VACATIONS (season-planner slice) are not in the engine. The PROJ section
above is arithmetic, not mechanics; the grid (and the headline matrix) MUST be re-run when the
real mechanics land.
