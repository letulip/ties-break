# Round-4 spec: viz polish (owner round-4 items 8, 10, 11, 12-framework)

Branch: `feat/viz-polish`. Scope is presentation only — no engine (`src/engine/**`) or
rally-generation (`src/engine/match/rally.ts`) changes. Builds on Phase 2's contract in
`docs/specs/phase2-match-viz.md`; this doc only records what round-4 adds/changes on top
of it. Per the owner's instruction for this round, the viz contract
(`src/viz/types.ts`, `src/viz/timeline.ts`) is mine to extend — existing test assertions
are extended, never weakened.

## 0. Pre-existing spec conflict found (report, not resolved here)

`docs/specs/phase2-match-viz.md` §"geometry.ts" says: *"Portrait orientation: court
vertical (net horizontal across the middle), side 0 at the bottom."* The shipped
implementation (`src/viz/geometry.ts`, `src/viz/courtRenderer.ts`, `tests/viz/geometry.test.ts`,
and `MatchViewer.vue`'s `CSS_W=680 / CSS_H=340` canvas) is **landscape** — court runs
horizontally, side 0 on the left — per a later "Package H" reorientation referenced in a
`MatchViewer.vue` comment. The doc was never updated. This round builds against the
shipped (landscape) geometry; the doc mismatch is unrelated to round-4 scope and is
flagged for the owner to reconcile the phase2 doc, not fixed here.

## 1. Server highlight

- `courtRenderer.SceneState` gains `serverSide?: Side | null` and `time?: number`
  (timeline-clock seconds, for pulse phase). `drawPlayers` draws a stroked accent ring
  around the serving side's dot, radius/alpha breathing on `sin(time * 4.2)` — a subtle
  pulse, not a blink.
- `MatchViewer.vue`: a new row directly under the canvas (`.ends-labels`) shows both
  players' short names on their **current physical sides** (left/right, accounting for
  ends swaps — see §3), appending `· serving` to whichever name is currently serving.
  Driven by the same `liveServer` ref already used for the "Serving: …" pill, updated
  every frame from the active point (so it changes exactly on point boundaries).
- Short name = the player's full `name` if ≤ 12 chars, else its first word. This is a
  cosmetic truncation rule invented for this row only (the engine has no first/last-name
  split); not a spec conflict, just documented here since the spec said "short names"
  without defining the rule.

## 2. Players run onto the court

- `SceneState` gains `players?: [CourtPoint, CourtPoint]` (index = match `Side`, in the
  **fixed physics frame** — side 0 always `y<0` / side 1 always `y>0`, independent of any
  ends swap; see §3 for how that frame gets mapped to the canvas). courtRenderer stays
  stateless: it only draws whatever positions it's handed. All easing state
  (`playerPos`) lives in `MatchViewer.vue`, alongside the other per-frame mutable state
  (`marks`, `cursor`, `clock`) it already owns.
- Per frame, for each side: if a shot is currently in flight, the shot's hitter
  (`shot.by`) eases toward their own baseline center (recovering after the strike); the
  **other** side eases toward `shot.bounce` (running to reach the incoming ball — this is
  "chasing the ball" for the whole rally, not just on their own hit). Between shots
  (point-start / point-end / game-end / set-end / change-ends beats) both sides ease
  toward baseline center. This is a concrete reading of the spec's one-line description
  ("the hitter moves toward their hit position, then recovers…"), which under-specifies
  what the *other* player does mid-flight — documented here as the resolved rule, not
  escalated as a conflict.
- Easing: exponential smoothing per frame, `pos += (target - pos) * min(1, dt * 6)`,
  where `dt` is timeline-seconds elapsed this frame (already speed-scaled, so movement
  speeds up with playback speed exactly like the ball does). Pure lerp, no velocity/mass
  — matches "smooth, no physics."

## 3. Real side changes

- New pure function `computeEndsSwaps(points: AnnotatedPoint[]): EndsState` in
  `src/viz/timeline.ts` (`EndsState = { swappedDuring: boolean[]; changeEndsAfter: boolean[] }`).
  Rule (verified against the ITF change-of-ends rule): a **local** games-in-set counter
  resets to 0 at every set boundary; ends swap whenever that counter is odd (1, 3, 5…) —
  "carried across set boundaries by the same rule" means exactly this: the same
  odd/even test re-applies fresh in the next set, no cross-set carry arithmetic needed
  (a set's last game already swaps automatically when its total is odd; when the total
  is even, the next set's first game swaps instead, which the same reset-and-reapply
  rule produces for free). A concluded tiebreak always lands on an odd local game index
  (a breaker only starts at 6-6 = 12 games played), so it always swaps ends too, for the
  same reason. During an **unfinished** tiebreak, an independent counter fires an extra
  swap every 6 combined points, per the ITF tiebreak rule; if the tiebreak's final point
  happens to coincide with a multiple of 6, only the (already-true) end-of-game rule
  fires for it — no double toggle.
  - `changeEndsAfter[i]` is suppressed on the match's very last point index — no
    "changing ends" beat plays after the match is already over.
- `buildTimeline` calls `computeEndsSwaps` once per build and, for any point index with
  `changeEndsAfter[i]`, emits a `change-ends` event (new `TimelineEventKind` member,
  `src/viz/types.ts`) right after that point's `point-end`/`game-end`/`set-end`, before
  the next `point-start` (or `match-end`). Duration = new exported constant
  `CHANGE_ENDS = 0.9` s (matches the existing "big point-end" beat length, kept as its
  own named constant since it's a conceptually different beat).
- Visual mapping: `SceneState` gains `endsSwapped?: boolean`. Because a tennis court is
  point-symmetric about the net center, only the *dynamic* elements (bounce marks, ball
  flight, player dots) need `(x, y) → (−x, −y)` mirroring when swapped — lines/background
  are unchanged. `MatchViewer.vue` reads `swappedDuring[scenePointIndex]` each frame into
  a reactive ref that both feeds the canvas scene and drives the `.ends-labels` row's
  left/right assignment.
- During the beat (`currentEvent.kind === 'change-ends'`), `SceneState.changingEnds`
  is set and `courtRenderer` draws a small rounded "Changing ends" pill centered on the
  canvas.

## 4. Replay controls

- `MatchViewer.vue` gains `mode?: 'live' | 'replay'` prop (default `'live'`, so the
  existing "Friendly match" call site in `SeasonScreen.vue` needs no change — it's given
  `mode="live"` anyway for explicitness). `MatchReplay.vue` passes `mode="replay"`.
- In `'replay'` mode the Play/Pause + Restart buttons are replaced by a single "Watch
  again ↻" button that calls the existing `restart()` (rebuild timeline, autoplay from
  the top) — always enabled, exactly replacing what Restart did while also serving as
  Play. Mode/speed selects and the disabled "Shout" button are unchanged in both modes
  (not mentioned for removal).
- `MatchReplay.vue`'s close affordance becomes a pinned circular `✕` button
  (`.replay-close`, `position: absolute; top/right`) on the card, clearly visible instead
  of the previous small text link.

## 5. Sound framework

- `src/audio/sfx.ts`: manifest of 7 keys (`hit`, `bounce`, `point`, `game`, `set`, `win`,
  `click`) mapped to `` `${import.meta.env.BASE_URL}sounds/<key>.mp3` ``. `playSfx(key)`
  is a fire-and-forget call:
  - No-ops entirely until `initSfx()` has been called at least once — and `initSfx()` is
    only ever called from a real click handler (`togglePlay`/`restart` in
    `MatchViewer.vue`), never on mount. This satisfies "no autoplay before first user
    gesture" literally: the very first auto-played watch-through on mount is silent;
    sound engages once the user actually presses a playback control. Documented here as
    the resolved reading of "init on first Play press", not escalated.
  - Existence is probed with a quiet `fetch(url, { method: 'HEAD' })` before ever handing
    the URL to an `Audio` element. A `fetch` 404 doesn't print to devtools console (unlike
    an `<audio src>` 404, which does) — this is *why* the probe exists: it keeps the
    console clean with zero mp3 files present, per the gate, without any console
    suppression trick. A failed/missing key is cached in a `Set` and never retried or
    logged.
  - `muted` is a plain boolean mirrored to `localStorage['tb-muted']` ('1'/'0'); reading
    it does not require `initSfx()` (no audio-node creation involved), so the More-screen
    toggle works immediately regardless of whether any match has ever played.
  - Volume fixed at 0.5 per spec.
- `MatchViewer.vue` wiring: `hit` when a `shot` timeline event *starts* (tracked via a
  `lastRenderedEvent` reference comparison in the per-frame `render()`, so it fires once
  per shot, not once per frame); `bounce` when that `shot` event *completes*; `point` /
  `game` / `set` / `win` when the corresponding `point-end` / `game-end` / `set-end` /
  `match-end` events complete. `click` is defined in the manifest and
  `public/sounds/README.md` but intentionally left unwired here — the round-4 item's
  wiring list only names hit/bounce/point/game/set/win, so no call site was invented for
  it (owner can wire it to UI buttons in a follow-up).
- `src/components/screens/MoreScreen.vue`: new "Sound" section with an on/off row backed
  by `isMuted()`/`setMuted()`.
- `public/sounds/README.md`: lists the 7 expected filenames and the lazy-load/no-console-spam
  contract for whoever drops the real mp3s in.

## Gates

`npx vue-tsc -b` exit 0; full `npx vitest run` green (timeline tests extended with
`computeEndsSwaps` unit coverage + a `change-ends` insertion/ordering test in the full
event stream — existing assertions kept, not weakened); `npm run build` exit 0;
live-verify at 375px width via `npm run preview`.
