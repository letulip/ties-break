# Phase 1 spec: match engine

Contract file: `src/engine/match/types.ts` — do not modify it; if it seems wrong, report instead.
Evidence base: [../research/03-match-engine-math.md](../research/03-match-engine-math.md).
Approach: **TDD** — write the test file(s) for your work package first, from the test lists below, then implement until green. Do not weaken or delete listed assertions; add more if you see gaps.

Ground rules (all packages):
- Pure TypeScript, zero new dependencies, no DOM/IndexedDB imports in `src/engine/**`.
- No `Math.random()` anywhere in the engine — RNG is always passed in (`src/engine/rng.ts`).
- Style: match existing `src/engine/*.ts` (plain exported functions, sparse comments only for non-obvious constraints).
- Commands: `npx vitest run tests/match/<yourfile>.test.ts` for your tests, `npx vue-tsc -b` must pass with zero errors, `npx vitest run` (full suite) must stay green.
- Touch ONLY the files listed for your package. Never edit package.json, configs, or other packages' files.

---

## Package A — scoring state machine

Files: `src/engine/match/scoring.ts`, `tests/match/scoring.test.ts`.

Rules of tennis implemented (best-of-3 only):
- Game: first to 4+ points with margin ≥ 2 (deuce/advantage emerge from the margin rule over raw counters).
- Set: first to 6 games with margin ≥ 2; at 6-6 a tiebreak decides the set 7-6.
- Tiebreak: first to 7+ points with margin ≥ 2.
- Match: first to 2 sets; a 3rd set is a full set with a tiebreak at 6-6.
- Serve: alternates every game. Tiebreak serve pattern: the player due to serve serves point 1, then serves alternate every two points (S, OO, SS, OO, ...). The set after a tiebreak is opened by the player who did NOT serve the tiebreak's first point (the tiebreak counts as one game for rotation).

API (all operating on `MatchScore` from types.ts):

```ts
export function createScore(firstServer?: Side): MatchScore          // sets = [{a:0,b:0}]
export function awardPoint(score: MatchScore, winner: Side): void    // mutates; throws if score.winner !== null
export function contextOf(score: MatchScore, pointNumber: number): PointContext
export function formatScore(score: MatchScore): string
```

`contextOf` semantics (computed BEFORE the point is played):
- `breakPoint`: regular game (not tiebreak) and the receiver wins the game if they win this point.
- `setPointFor` / `matchPointFor`: side S if S winning this point wins the current set / the match. Compute by probing: clone the score (`structuredClone`), `awardPoint(clone, S)`, inspect the result — do not duplicate the win-condition logic.
- If both sides can't simultaneously be at set point on one point, value is the single side or null; matchPoint implies setPoint for the same side.

`formatScore`: completed + current sets as `a-b` joined by spaces, then current game if any points played: regular games in tennis terms (`0 15 30 40 Ad` — e.g. `30-15`, `40-40`, `Ad-40`, `40-Ad`), tiebreak as `TB 3-2`. Examples that must hold exactly:
- new match: `0-0`
- after A wins 1 point: `0-0 15-0`
- deuce reached (3-3 raw): `0-0 40-40`; A advantage (4-3): `0-0 Ad-40`
- A leads a set 6-4 and 2-1 in games, 30-30: `6-4 2-1 30-30`
- tiebreak at 6-6, A 3-2 up: `6-4 6-6 TB 3-2`

Required tests (`tests/match/scoring.test.ts`):
1. Game won at 4-0 and 4-2 raw points; game NOT over at 4-3 (advantage); deuce cycle 40-40 → Ad → 40-40; game from advantage.
2. Set won 6-4; 5-5 goes to 7-5; 6-6 enters tiebreak (`inTiebreak` true).
3. Tiebreak won 7-3 → set recorded as 7-6; tiebreak continues past 6-6 until margin 2 (e.g. 8-6).
4. Serve alternates every game; tiebreak serve pattern for the first 8 TB points equals S,O,O,S,S,O,O,S (relative to TB opener); the set after the TB opens with the opposite player to the TB opener.
5. `breakPoint` true at raw 0-3, 1-3, 2-3 and receiver-advantage; false at 3-3, at server game point, and always false inside a tiebreak.
6. Set point and match point detection: e.g. serving at 5-4 40-30 in set 2 after winning set 1 → `setPointFor` and `matchPointFor` both = server; set point inside a tiebreak at 6-5.
7. Match ends at 2 sets (winner set, sets array has completed sets only... note: in `MatchScore.sets` the in-progress set is last; on match end the array holds exactly the completed sets); `awardPoint` after the match throws.
8. A 1-1 set score leads to a 3rd set; 3rd-set 6-6 plays a tiebreak.
9. `formatScore` exact-string cases listed above.

---

## Package B — point probability model + closed-form math

Files: `src/engine/match/point.ts`, `src/engine/match/closedForm.ts`, `tests/match/point.test.ts`, `tests/match/closedForm.test.ts`.

### point.ts

```ts
export const TOUR_AVG_P: Record<Tour, number> = { atp: 0.63, wta: 0.57 }
export const SURFACE_SERVE_BONUS: Record<Surface, number> = { hard: 0, grass: 0.015, clay: -0.015 }
const SKILL_K = 0.0016          // p shift per skill point
const BASE_CLAMP: [number, number] = [0.42, 0.82]
const FINAL_CLAMP: [number, number] = [0.30, 0.90]
const BIG_POINT_MAX_PENALTY = 0.03
const MOMENTUM_BONUS = 0.015
const MOMENTUM_MIN_STREAK = 3
const FATIGUE_START = 120       // point number
const FATIGUE_RATE = 0.0003     // per point past start, scaled by (1 - stamina/100)
const FATIGUE_CAP = 0.03

export interface Streak { side: Side; length: number }

export function basePServe(server: MatchPlayer, receiver: MatchPlayer, opts: MatchOptions): number
// = TOUR_AVG_P[tour] + (server.serve - 50) * SKILL_K - (receiver.ret - 50) * SKILL_K
//   + SURFACE_SERVE_BONUS[surface], clamped to BASE_CLAMP

export function modifiedPServe(
  base: number,
  server: MatchPlayer,
  receiver: MatchPlayer,
  ctx: PointContext,
  streak: Streak | null,
): number
```

`modifiedPServe` applies, in order:
1. **Momentum** (skip if streak null or length < MOMENTUM_MIN_STREAK): +MOMENTUM_BONUS if streak.side === ctx.server else −MOMENTUM_BONUS.
2. **Big point** (Klaassen–Magnus: servers underperform on break points): if `ctx.breakPoint`, subtract `(1 - server.composure / 100) * BIG_POINT_MAX_PENALTY`.
3. **Fatigue**: if `ctx.pointNumber > FATIGUE_START`, subtract `min(FATIGUE_CAP, (pointNumber - FATIGUE_START) * FATIGUE_RATE * (1 - server.stamina / 100))` and add the same expression computed with the receiver's stamina (a tired returner helps the server).
4. Clamp to FINAL_CLAMP.

Required tests (`tests/match/point.test.ts`):
1. Two 50-skill players, hard, ATP → exactly 0.63; WTA → 0.57; grass +0.015; clay −0.015.
2. Monotonic: raising server.serve raises p; raising receiver.ret lowers p; symmetric magnitude (SKILL_K per point).
3. Base clamp holds at skill extremes (serve 100 vs ret 0 and vice versa).
4. Big point: composure 100 → no penalty; composure 0 → exactly 0.03 off on a break point; no penalty when not a break point.
5. Momentum: streak length 2 → no effect; length 3 with streak.side === server → +0.015; streak against server → −0.015.
6. Fatigue: none at point 120; at point 220 with stamina 0 both sides → net 0 (server −, receiver + cancel); server stamina 0 vs receiver stamina 100 at point 220 → −min(0.03, 100·0.0003) = −0.03; cap respected.
7. Final clamp: pathological stacking stays within [0.30, 0.90].

### closedForm.ts

iid Markov formulas (see research 03; q = 1−p throughout):

```ts
export function pGame(p: number): number
// p^4 (1 + 4q + 10q^2) + 20 (pq)^3 * p^2 / (1 - 2pq)

export function pTiebreak(pA: number, pB: number): number
// Probability side A wins a tiebreak it OPENS (serves point 1).
// DP with memo over (aPoints, bPoints); server of point n (1-based, n = a+b+1):
// n=1 -> A; then pairs alternate (n=2,3 -> B; n=4,5 -> A; ...).
// Terminal: a >= 7 && a-b >= 2 -> 1; b >= 7 && b-a >= 2 -> 0.
// At 6-6 use the closed form: D = pA*qB / (pA*qB + qA*pB)
//   (from 6-6 serves alternate in one-point-each blocks; A must win a block 2-0).

export function pSet(pA: number, pB: number, firstServer?: Side): number
// Probability side A wins the set; DP over (aGames, bGames), server of game n alternates
// from firstServer (default 0). Game win prob: pGame(pA) when A serves, 1 - pGame(pB) when B serves.
// Terminal: 6+ games with margin >= 2; at 6-6: pTiebreak opened by the player due to serve
// (if B opens the TB, A's win prob is 1 - pTiebreak(pB, pA)).

export function pMatchBo3(pA: number, pB: number): number
// s = pSet(pA, pB); return s^2 * (1 + 2 * (1 - s)).
// Valid because set-win probability is independent of who serves first (verified by test 3).
```

Required tests (`tests/match/closedForm.test.ts`):
1. `pGame` reference values ±0.002: 0.55→0.623, 0.60→0.736, 0.65→0.830, 0.70→0.901, 0.75→0.949; pGame(0.5)=0.5; pGame(1)=1; pGame(0)=0.
2. Symmetry: pTiebreak(p, p) = 0.5 ± 1e-9; pSet(p, p) = 0.5 ± 1e-9; pMatchBo3(p, p) = 0.5 ± 1e-9.
3. Serve-order independence (Newton–Keller): |pSet(pA, pB, 0) − pSet(pA, pB, 1)| < 1e-9 for several (pA, pB) pairs.
4. Edge amplification (research values): pMatchBo3(0.65, 0.62) ∈ [0.640, 0.655]; pMatchBo3(0.63, 0.62) ∈ [0.545, 0.560]; pMatchBo3(0.70, 0.60) ∈ [0.88, 0.90].
5. Monotonicity: pMatchBo3 strictly increases in pA and decreases in pB across a grid.
6. Complement: pMatchBo3(pA, pB) + pMatchBo3(pB, pA) = 1 ± 1e-9.

---

## Package C — match loop + calibration (after A and B merge)

Files: `src/engine/match/engine.ts`, `tests/match/engine.test.ts`, `tests/match/calibration.test.ts`.

```ts
export function simulateMatch(a: MatchPlayer, b: MatchPlayer, opts: MatchOptions): MatchResult
export function fastMatchProbability(a: MatchPlayer, b: MatchPlayer, opts: MatchOptions): number
// closed-form: pMatchBo3(basePServe(a,b,opts), basePServe(b,a,opts)) — no RNG, for world fast-sim
```

`simulateMatch` loop: `rngFromSeed(opts.seed)`; `createScore(opts.firstServer)`; per point: build `PointContext` via `contextOf`, compute p via `basePServe` + `modifiedPServe` (momentum only if `opts.momentum !== false`), draw `rng()`, decide winner (rng() < p → server wins), update streak, stats and log (with `scoreAfter: formatScore(score)` AFTER `awardPoint`), until `score.winner !== null`. Stats per types.ts; `longestPointStreak` per side over the whole match.

Required tests (`tests/match/engine.test.ts`):
1. Determinism: same players + same seed → `deepEqual` MatchResult (twice); different seed → different log.
2. Result integrity: winner has exactly 2 set wins; every completed set is a legal tennis score (6-0..6-4, 7-5, 7-6); `totalPoints === log.length`; log's last entry's `scoreAfter` matches the final score; stats consistency: `servePointsWon ≤ servePointsPlayed`, both sides' `servePointsPlayed` sum to totalPoints, `pointsWon` sums to totalPoints, `breakPointsSaved ≤ breakPointsFaced`.
3. `pServe` in every log entry within [0.30, 0.90]; entries flagged `breakPoint` have server p reduced vs a comparable non-big point when composure < 100 (compare via a low-composure vs perfect-composure run... simplest: assert log entries where breakPoint && server has composure 0 have pServe strictly below basePServe result for that matchup, momentum aside — construct with momentum: false).
4. `fastMatchProbability` for equal 50-skill players = 0.5 ± 1e-9.

Required tests (`tests/match/calibration.test.ts`) — fixed seeds, so results are deterministic; Monte Carlo sizes chosen to keep full-suite runtime < 10 s:
1. Hold rate bands (10k matches, mirror 50-skill players, hard): ATP hold ∈ [0.74, 0.84]; WTA ∈ [0.60, 0.72]. (Compute hold rate from logs: service games won / service games played.)
2. Fairness: equal players, momentum on, 20k matches → side A wins ∈ [0.48, 0.52].
3. Closed-form vs Monte Carlo: craft skills so basePServe gives exactly (0.65, 0.62) (serve 62.5 and serve 43.75, both ret 50, ATP hard); |MC(50k) − pMatchBo3| < 0.015.
4. Momentum bounded: equal players, |winRate(momentum on) − winRate(momentum off)| < 0.02 (20k each).
5. Composure matters but bounded: composure 0 vs composure 100 (otherwise mirror 50s), 20k matches → the composed player wins ∈ (0.50, 0.60).
6. Performance: 10,000 simulateMatch calls complete < 3 s (use `performance.now()`).
7. Match length sanity: mean totalPoints of ATP mirror matches ∈ [120, 220].

---

## Reporting

Each package returns: what was built, test count, full-suite + typecheck status, and a list of any spec ambiguities/conflicts found (report them — do not resolve unilaterally).
