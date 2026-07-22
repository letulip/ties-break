# Phase 2 spec: match visualization

Contract: `src/viz/types.ts` (+ Phase 1 types in `src/engine/match/types.ts`) — do not modify either; report if wrong.
Evidence: [../research/03-match-engine-math.md](../research/03-match-engine-math.md) (rally length/direction data).
Approach: **TDD** for all pure modules (Packages D, E). Ground rules identical to Phase 1 spec (no new deps, no Math.random in engine/viz logic, `npx vue-tsc -b` clean, full `npx vitest run` green, touch only your files).

Design principle: the engine's `MatchResult.log` is authoritative for WHO wins each point. Rally generation is presentation — it must be consistent with the recorded winner, deterministic from the match seed, and never influence outcomes.

---

## Package D — rally generation + live win probability

Files: `src/engine/match/rally.ts`, `src/engine/match/liveProb.ts`, `tests/match/rally.test.ts`, `tests/match/liveProb.test.ts`.

### rally.ts

```ts
export function annotateMatch(result: MatchResult, a: MatchPlayer, b: MatchPlayer, opts: MatchOptions): AnnotatedMatch
```

Replays the log through the Phase-1 scoring FSM (`createScore`/`awardPoint`) to know, per point: pre-point game counters (→ `deuceCourt` = even sum of game points, tiebreaks included), and whether the point ended a game/set (`gameEnd`/`setEnd`; a set end implies gameEnd; tiebreak end counts as both). `winProbA` comes from liveProb (below), computed on the post-point score; after the final point it must be exactly 1 or 0.

Rally generation per point — RNG: `rngFromSeed(opts.seed + '#' + pointNumber)` so rallies are independent of the outcome RNG and stable:

1. **Serves.** First serve lands in with FIRST_SERVE_IN = 0.62. Miss → `serve1` shot with result 'out'/'net' (85%/15%), then a second serve. If the RECEIVER won the point: double fault with conditional probability DF_GIVEN_RECEIVER_WIN = 0.07 → `serve2` also faults, rally ends (`doubleFault: true`, 2 shots). If the SERVER won: ace with conditional probability ACE_GIVEN_SERVER_WIN = base 0.10 (atp) / 0.06 (wta), ×1.5 on grass, ×0.6 on clay — rally is the single in-serve (`ace: true`; an ace off a second serve is allowed and rarer naturally via the 0.62 gate).
2. **Rally length** (shots INCLUDING serves; only for non-ace, non-DF points): sample target from front-loaded buckets — {2-3: 38%, 4-5: 27%, 6-8: 20%, 9-12: 10%, 13-18: 5%} (uniform inside a bucket), then clay: +1 shot, grass: −1 (min 2). **Parity fix-up**: the last shot's hitter is forced — result 'winner' → hit by the point winner; result 'net'/'out' → hit by the loser. Choose ending type first: WINNER_ENDING = 0.30 (else error: out 70% / net 30%), then adjust target length by +1 if its parity puts the wrong player on the final shot (hitters strictly alternate: shot i is by server if i is odd, receiver if even — serve faults excepted, they repeat the server and don't advance the alternation).
3. **Placements** (all coordinates jittered uniformly within their zone; landings must satisfy the geometry tests):
   - Serve target box: y-half of the RECEIVER, `|y| ∈ (0, serviceLine)`; deuce court → x > 0 for a side-1 receiver, x < 0 for side-0 (mirrored for ad court). Direction weights T 40% / wide 40% / body 20%: T → `|x| ∈ (0, 0.55)`, body → `(0.9, 2.2)`, wide → `(3.0, 4.0)`. In-serve bounce depth `|y| ∈ (3.2, 6.2)`.
   - Rally shots: direction cross 60% / middle 20% / line 20%. Landing halves: cross → x-half opposite the hitter's previous position, line → same half, middle → `|x| < 1.4`; depth `|y| ∈ (6.5, 11.5)` toward the opponent, with winners deeper/wider: winner bounce `|y| ∈ (9.0, 11.6)` or near sideline `|x| ∈ (3.2, 4.05)`.
   - Errors: 'out' → beyond a line by 0.15–1.2 m (long: `|y| ∈ (11.9, 13.0)`, or wide: `|x| ∈ (4.2, 5.3)` with y in-range); 'net' → `y = 0`, x anywhere reachable. Faulted serves: 'out' → past the service line or wide of the box by 0.1–0.8 m.
   - Every 'in'/'winner' bounce must be INSIDE the singles court on the correct side (and inside the service box for serves).

### liveProb.ts

```ts
export function matchWinProbability(score: MatchScore, pA: number, pB: number): number
```

Side A's probability of winning the match from an arbitrary in-progress `MatchScore` (server = `score.server`), exact via DP, composed of: current-game win prob from raw counters (deuce closed form `p²/(1−2pq)` region), current-set win prob from game counters with serve alternation, tiebreak-from-state where relevant (reusing the 6-6 closed form), and best-of-3 layer from set wins. Decided match → 1 or 0. Use memoization; no simulation.

### Required tests

`tests/match/rally.test.ts`:
1. Determinism: `annotateMatch` twice on the same result → deep-equal.
2. Winner consistency: for 20 varied matches, every rally's implied winner (last shot 'winner' → hitter; 'net'/'out' → other side) === `entry.winner`; hitters alternate correctly (serve faults repeat the server).
3. Ace/DF legality: `ace` only on server-won points with a 1-in-shot rally; `doubleFault` only on receiver-won points with exactly 2 fault shots; over 50 matches both occur at least once and rates are sane (aces/servicePoints ∈ (0.01, 0.15), df/servicePoints ∈ (0.01, 0.10)).
4. Geometry: every 'in'/'winner' bounce inside the correct court half (and correct service box for serves, matching `deuceCourt` side); every 'out' outside; every 'net' at y = 0.
5. Length distribution over 100 ATP hard matches: share of rallies (excl. DF) with ≤ 4 shots ∈ [0.50, 0.75]; ≥ 9 shots ∈ [0.03, 0.20]; mean length clay > mean length grass (same seeds).
6. Flags: `gameEnd`/`setEnd` counts match the result's games/sets; `deuceCourt` is true on every game's first point.

`tests/match/liveProb.test.ts`:
1. Fresh match, equal p → 0.5 ± 1e-9; equals `pMatchBo3(pA, pB)` ± 1e-9 for unequal p too.
2. `winProbA` after the last point is exactly the indicator of A winning (across 10 matches).
3. Monotone sanity: holding a match point → prob > 0.9 for the holder; down a set at equal p → prob < 0.5; up a break in set 3 at 4-3, equal p → > 0.5.
4. Never NaN / outside [0, 1] across every point of 20 simulated matches (annotate integration).

---

## Package E — playback timeline + court renderer

Files: `src/viz/timeline.ts`, `src/viz/geometry.ts`, `src/viz/courtRenderer.ts`, `tests/viz/timeline.test.ts`, `tests/viz/geometry.test.ts`.

### timeline.ts (pure, fully testable)

```ts
export function buildTimeline(match: AnnotatedMatch, mode: ViewMode): Timeline
```

Timings at speed 1 (constants exported for tests): point-start 0.5 s; shot flight: serves 0.55 s, rally shots 0.42 s; point-end 0.5 s (0.9 s if breakPoint/setPointFor/matchPointFor); game-end +0.7 s; set-end +1.6 s; match-end 2.0 s. Events are strictly sequential (`t` non-decreasing, each `t` = previous `t + duration`).
- `full`: every point.
- `key`: only points where entry.breakPoint || setPointFor || matchPointFor || gameEnd || setEnd || tiebreak — plus always the final point.
- `skip`: no point events; just match-end.

### geometry.ts

```ts
export interface Viewport { width: number; height: number }
export function courtToCanvas(p: CourtPoint, vp: Viewport): { x: number; y: number }
export function canvasCourtRect(vp: Viewport): { x: number; y: number; width: number; height: number } // singles rect in px
```
Portrait orientation: court vertical (net horizontal across the middle), side 0 at the bottom. The drawable court area (doubles width × full length) fits the viewport preserving aspect with an 8% outer margin (out-balls land visibly outside the lines). Linear mapping, y-down canvas: court +y (side 1) maps to canvas top.

### courtRenderer.ts

Stateless draw functions over `CanvasRenderingContext2D` (no rAF loops here — the Vue component owns the clock):

```ts
export interface SceneState {
  match: AnnotatedMatch
  pointIndex: number
  /** shot currently in flight and its 0..1 progress; null between shots */
  flight: { shotIndex: number; progress: number } | null
  /** recent bounce marks to render (position + age 0..1 + result) */
  marks: { p: CourtPoint; age: number; result: ShotResult }[]
}
export function drawScene(ctx: CanvasRenderingContext2D, vp: Viewport, scene: SceneState): void
```

Visuals (colors from the app palette; read via ctx fill styles, hardcode the hex from src/style.css): surface tint by `opts.surface` (hard `#2d5a8e`-ish, clay `#b0603c`-ish, grass `#3a7d44`-ish, all darkened toward the app bg), white court lines 1.5 px, ball = accent `#d9f24f` dot with a short fading trail, flight path = quadratic Bezier from the hitter's position (previous bounce, or the server's baseline spot for serves) to the shot bounce with a modest control-point lift; bounce marks: 'in' small accent ring, 'winner' filled accent, 'out'/'net' danger `#f2664f` ✕, fading with age. Two player dots on their baselines, x eased toward the ball. Score strip is NOT drawn on canvas (the Vue layer renders tables around it).

### Required tests

`tests/viz/timeline.test.ts`:
1. Events strictly sequential; duration = last t + last duration; per-point event order is point-start → shots (rally order) → point-end (+ game/set flags where the annotation says so).
2. `full` covers every point index exactly once; `key` ⊆ `full`, includes every BP/SP/MP/tiebreak/game-end point and the final point; `skip` has only match-end.
3. Duration bands using real simulated matches (fixed seeds, ATP mirror 50s): `full` ∈ [100, 470] s at speed 1 (mean match ≈ 167 points × ≈1.5-2 s floor; the UI defaults to 2× speed, landing full playback in the owner's 2-3.5 min target); `key` ∈ [15, 90] s.
4. Point-end duration is the long variant exactly on big points.

`tests/viz/geometry.test.ts`:
1. Aspect preserved: a court meter maps to equal px on x and y (± float eps) for tall, wide and square viewports.
2. Net center maps to the viewport center x, mid-height y; side-0 baseline maps BELOW the net line (canvas y greater).
3. The full doubles rect + margin fits inside the viewport for 300×500 and 800×400.
4. Round-trip: corners of the singles court map inside `canvasCourtRect` (± 1 px).

---

## Package F — match viewer UI (after D + E)

Files: `src/components/MatchViewer.vue`, edit `src/App.vue` (add section), edit `src/style.css` (append component styles only).

An "Exhibition match" section in the app (below Career, above Saves): seed input + "Play match" button generates two WTA players (fixed demo skill blocks: "Vera" 58/55/42/61 vs "Top seed" 63/60/70/65, clay) — `simulateMatch` + `annotateMatch` run inline (one match is microseconds; the career world will use the worker, an exhibition doesn't need it). Renders `MatchViewer`.

MatchViewer contract:
- Props: `match: AnnotatedMatch`. Canvas (portrait, ~340×520 max, responsive down to mobile) + controls row: mode select (Full / Key points / Skip), speed (1× / 2× / 4×), Play/Pause, Restart. A disabled "Shout 📣" button with title "Coming in Phase 6".
- Playback: rAF loop advancing a clock by `dt × speed`, walking the Timeline; between events idle. On mode change → rebuild timeline, restart. `skip` → jump straight to the end state.
- Around the canvas, «таблички» style: score line (from the current point's `scoreAfter`), serve indicator, a win-probability bar (side A share, accent fill) updated per point from `winProbA`, and a live mini stats table (points won, aces, DFs, breaks) computed up to the current point. On match end: final score + full stats table.
- rAF must stop when playback ends or component unmounts (no leaked loops); page must stay clean of console errors.

No unit tests required for F (component); the gate is a browser verification pass. Keep all game math out of the component — it only consumes D/E outputs.

---

## Reporting

Each package returns: files, test counts, full-suite + typecheck status, measured numbers (D: ace/df rates, rally-length shares; E: full/key durations for the fixture match), and spec ambiguities (report, don't resolve).
