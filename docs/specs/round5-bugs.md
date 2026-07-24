# Round 5 – owner bug list (spec)

Branch `fix/round5-bugs`. Twelve owner items. Engine changes are TDD; determinism is the
hard constraint (golden-save shape, the 520-week identity run, and the load-time RNG replay
in `sim.worker.ts:restoreRng` which re-ticks a fresh probe world, so **the per-week MAIN-stream
draw count must never depend on player input _or_ family background**).

`pickInt(rng, lo, hi)` consumes **exactly one** `rng()` call regardless of the range, which is the
lever every "same draw count" argument below rests on.

---

## 1. Ranking transparency (the owner's "points bug" — not a bug)

Ranking is a rolling 52-week best-6 (`src/engine/season/ranking.ts`). Nothing is wrong; the
*perception* is. Three parts:

**(a) Summary-event delta.** In `finalizeTournament` (world.ts) diff the kid's windowed best-6
sum *before* and *after* pushing the new result:

- new helper `windowedBestSum(results, currentWeek, playerId)` in `ranking.ts` — the exact
  quantity `computeRanking` assigns as a player's `points` (windowed, best-6, summed). Tested to
  agree with `computeRanking`.
- `delta = after − before`. Appended clause via pure `rankingDeltaSuffix(points, delta)`:
  - `delta === points` (nothing displaced, kid had < 6 counted) → no suffix.
  - `0 < delta < points` (a counted result was displaced) → ` (ranking total +{delta})`.
  - `delta === 0` (below the 6th best) → ` (does not improve best 6)`.
- Summary text: `… – {finishLabel} (+{points} pts){suffix}`.

**(b) Kid screen "Counting results (best 6)".** New `Snapshot.countingResults: CountingResult[]`
(`{week, tier?, points}`), the kid's windowed best-6 (same sort as ranking). To carry the tier,
`SeasonResult` gains an optional `tier?: TierId`, **set only on kid results** in
`finalizeTournament` (AI results don't need it; `computeRanking` ignores it; old saves simply
lack it → tier shows `—`). Rendered as a table on `KidScreen`. The list sum always equals the
kid's standings points because both are `windowedBestSum(after)`.

**(c) Tests** (`tests/season/ranking.test.ts`): displaced → `delta = new − displaced`; below-6th
→ `delta = 0`; `windowedBestSum === computeRanking` points (sum shown = standings points); plus
`rankingDeltaSuffix` unit table.

## 2. W1 "Entries closed" on a fresh career

`buildSeason` placed the first local at week 1 (`deadlineWeek = week−2 = −1`), already-closed at
career start. Fix: for the first season block only (`fromWeek === 0`) floor the placement window
at week `MIN_FIRST_EVENT_WEEK = 3`, so the earliest deadline is week 1. Later chunks unchanged.
This only shifts events that were below week 3; the makeEvent RNG order is unchanged (weeks move,
surface/travel draws don't), so counts/determinism hold. Test: fresh season → every
`deadlineWeek ≥ 1` and every `week ≥ 3`.

UI (`SeasonScreen`): an upcoming event whose deadline passed **and** the kid is not entered shows a
muted `Entries closed W{deadlineWeek}` pill instead of a disabled Enter button.

## 3. Condition bar → 10 segments, red→yellow→green

`HomeScreen` condition bar: 10 segments (was 5), static **8/10** placeholder, per-segment
`hsl` gradient hue `0→120` across the filled segments. `title="Phase 4"` unchanged (Phase-4 wires
the real value).

## 4. Remove Restart from MatchViewer live mode

Drop the `Restart` button from the live-mode control row (keep mode/speed + Play/Pause). Replay
mode keeps its single `Watch again ↻`. The `restart()` function stays (Watch-again uses it).

## 5. Sound toggle → explicit two-state switch

`MoreScreen` sound control becomes a real switch: an ON/OFF track + knob + `ON`/`OFF` label, not a
bare button. `role="switch"`, `aria-checked` bound to state.

## 6. Sound audit — root cause + app-wide init

**Root cause of total silence:** the mp3s exist and are served, but `initSfx()` (which flips the
`audioEnabled` gate) was wired **only** to the MatchViewer Play/Restart handlers. Matches AUTOPLAY
on mount (`resetPlayback(true)`), and every route into a viewer (tabs, "Watch match", "Play match")
reaches it without calling `initSfx`, so `audioEnabled` stayed `false` and **every `playSfx` was a
silent no-op** — the whole app was mute unless the user manually toggled Play/Pause inside a viewer.

**Fix** (`src/audio/sfx.ts` + `main.ts`): `installGlobalSfx()` adds ONE delegated `document` click
listener that (1) calls `initSfx()` on the first user gesture anywhere, and (2) plays a quiet
(`click` key volume 0.25) sfx when the click hits `button.primary, .tab-btn, .option-pill`,
throttled ≥ 80 ms. Per-key volume map keeps `click` at 0.25 while others stay 0.5. The explicit
`playSfx('click')` calls inside MatchViewer's togglePlay/restart are removed (the delegated listener
covers those primary buttons — no double click).

## 7. Standings truncation with ellipsis

`SeasonScreen` standings: `computeStandings` already returns top-10 + 5-around-kid deduped. Render
an ellipsis row `…` between two consecutive rows whose dense-rank jumps by > 1 (only ever happens
between the top-10 block and the around-kid block; within a contiguous index slice dense ranks
step by 0 or 1). No snapshot shape change.

## 8. News match rows (owner layout)

`HomeScreen` news: a match row becomes two lines — line 1 `V. Martin vs S. Everts` (both short),
line 2 the kid-perspective score — with a right-aligned `Watch` (no ▶ glyph). Built from `e.match`
(`formatShortName(oppName)`, `flipScore` when the kid is side B).

## 9. Match stats table — short names + ranks

`TournamentFlow` post-match box score: caption + table header use short names on **both** sides
(`oppName` was full → `formatShortName`), and each player's current rank shows under their name
(`kidRank` + the opponent rank captured at pre-match time — `pending.opponent.rank` before the
reveal advances the pointer). `MatchViewer` gains optional `rankA/rankB` (null → hidden) rendered
under the final-stats headers; the friendly (KidScreen) passes `[kidRank, null]` (Top seed has no
rank → hidden), the TournamentFlow inline viewer passes both real ranks.

## 10. Class-flavored expenses (mini-rebalance)

`resolveBaseCosts`: background range factor `working ×0.8 / middle ×1.0 / wealthy ×1.25` applied
**after** the expense `pickInt` (the draw is unchanged; only the result scales). Flavor lists become
background-aware via one `pickInt` selection (draw count invariant regardless of list length):
- working: train list swaps `Video session…` → `Group clinic at the public courts`.
- wealthy: rest pool gains `Physio session`, `Massage & recovery`.
- middle: unchanged (byte-identical to before — the 520-week identity run uses middle).

RNG discipline extended: a new test asserts cohort drift is identical across all three backgrounds
(same seed) and an ordering test asserts working < middle < wealthy expense for the same base draw.

## 11. README

Soften the reference-game line: drop the named title + "anti-version" wording, keep a neutral hint
("inspired by the genre's mobile career sims – built as the honest version"). En dash per house
style.

## 12 / 29. Owner jpeg sources + Kid portrait

**No jpeg files exist anywhere in the worktree** (`find` over art-src/ + public/images/ finds only
the mirrored `.png` sources and the served `.webp`). Item 12's rename is a no-op — reported, nothing
to rename. `scripts/optimize-art.mjs` is still updated to walk `.png/.jpg/.jpeg`, **prefer a jpeg
source over a png** when both map to the same webp target (jpegs are smaller), and move all sources
to `art-src/` — future-proofing for when the owner's jpegs actually land.

Item 29: the Kid portrait (`fem-euro-brunnet-jun-norm-fs8.webp`, 512×512, **76.3 KB** — already
under the 120 KB target, no re-encode) gets explicit `width/height` + `decoding="async"` on the
`<img>` to kill the late-decode layout shift.
