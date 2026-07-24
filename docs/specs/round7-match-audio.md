# Round-7 spec (part 2): match, audio and season UI

Branch: `feat/round5-season-ux`, worktree `tb-r5-season`. Part 2 of Round-7 (part 1 was the
economy pass). Scope: match-viewer timing/sound, audio identity + haptics, and several
Season/tournament UI fixes. Out of scope and deliberately untouched here: `src/engine/economy.ts`
and the Money/Home economy work (part 1), and `docs/decisions.md` / `docs/plan.md` /
`docs/rounds/` (owned by a later docs agent). Owner item numbers below match his list.

Deferred (NOT implemented, recorded for a doc): **item 20** (per-day calendar detail screens)
→ Phase 4.

---

## 1. Music license

`public/music/README.md` (new) records `theme.mp3` as **"Clean Sound"** from Pixabay
(<https://pixabay.com/music/acoustic-group-clean-sound-131373/>), Pixabay Content License. A
short cross-reference note was added to `public/sounds/README.md` so provenance is discoverable
from both folders; the existing owner-recorded-SFX note there is kept verbatim.

## 2. MediaSession metadata (`src/audio/music.ts`)

`setupMediaSession()` / `updateMediaSessionState()`, both fully feature-detected
(`'mediaSession' in navigator`, `typeof MediaMetadata !== 'undefined'`) so desktop/test paths
are no-ops. Installed once from `start()` (a real gesture is guaranteed by then):

- `navigator.mediaSession.metadata` = title **"Ties Break"**, artist **"Ace Parent"**, artwork
  `${BASE_URL}logos/logo-tb-line-light.webp` (512×512, image/webp).
- Action handlers `play`/`pause` drive the music mute toggle (`setMusicMuted(false/true)`) — the
  `<audio>` element is started/stopped by `applyTarget()` as a side effect.
- `playbackState` reflects the persisted **mute** (not the transient match-duck), updated on
  `start()` and `setMusicMuted()`.

The phone's notification-shade player now shows the game identity + logo instead of a bare
`theme.mp3`, and its play/pause buttons map to Music on/off.

## Audio balance — SFX master gain (`src/audio/sfx.ts`)

Match SFX were too loud against the 0.30 background music, so the menu→match transition jumped in
loudness. New single owner knob `SFX_MASTER = 0.40` scales the whole SFX bus (one constant, like
economy.ts); per-key **voice** levels (`KEY_VOICE`, default 0.85) set only the balance between
sounds. `volumeFor(key)` = `voice × master`, clamped [0,1], applied where each `<audio>` is
created. Effective levels land on the owner's targets, all under the 0.30 music: `hit` 0.26
(frequent → quietest), `out`/`ooh`/`oohApplause`/`applauseShort` 0.34, `applauseFinal` 0.40,
`takeYourSeats` 0.32, `click` 0.25 (unchanged), `clickSoft` 0.18 (now softer than click). The
sounds README note was updated to match. Verified in the built preview: a rally's `hit` element
reports `volume ≈ 0.26`, sitting under the restored 0.30 menu music on match exit.

## 10. Matches breathe — quiet gaps in the timeline (`src/viz/timeline.ts`)

New silent, static **`gap`** timeline event kind (`src/viz/types.ts`) — timing only, no cues.
The viewer holds the court on the trailing point's index for the gap's duration; a `gap` matches
no `completeEvent` branch and `currentFlight()` returns null for it, so it is naturally silent.

New constants: `POINT_END_GAP = 0.15`, `GAME_END_GAP = 0.5`, `SET_END_GAP = 0.9`. Emitted after
the qualifying event, **before the next point-start**:

- a `POINT_END_GAP` after **every** point-end,
- a `GAME_END_GAP` after each game-end,
- a `SET_END_GAP` after each set-end,
- all suppressed on the match's **final point** (no next point-start; match-end's own 2.0s beat
  already separates it) — the same "not on the last point" rule the change-ends beat uses. The
  change-ends beat is unchanged and now sits after the game/set gap.

Tests (`tests/viz/timeline.test.ts`): the two full-sequence tests assert the exact new gap events
and ordering; a new `describe` block asserts the tiny/game/set gap durations + positions, gap
suppression on the final point, no gaps in skip mode, and that gaps never coincide with a shot.
The reel-length duration bands were re-centred **260→290s (full)** and **100→120s (key)** — the
same kind of legitimate re-centre round-4 did (240→260) for the change-ends beat. Measured across
the 50 fixed seeds post-change: full ∈ [229.9, 275.2], key ∈ [76.2, 107.5] for the reel subset;
290s@1× = 145s@2× (~2.4 min), inside the owner's 2–3.5 min target. Floors and structural
assertions are unchanged.

## 11. take-your-seats timing (`src/components/MatchViewer.vue`)

`SEATS_PREROLL_MS` 1500 → **3600** (the recorded clip is ~3.5 s), so the match no longer starts
over the top of it. Applies at ×1/×2 (the speeds that play the cue); ×4 unchanged (no cue, clock
starts immediately). Hardcoded to the clip length.

## 12. `out` call frequency (`src/components/MatchViewer.vue`)

Single `out.mp3` kept (no new files — the earlier "3 variants" commit was already reverted). The
old every-3rd counter is replaced by a **deterministic-per-match** intermittent rule at ×1 only
(×2/×4 already drop `out`): a small RNG `rngFromSeed(match.result.seed + ':outcall')`, re-created
each `resetPlayback()`. An out/net point increments a counter; when it reaches a 3–5 threshold the
`out` call fires and a fresh 3–5 threshold is drawn. Result: ~1 in 3–5 out/net points, identical on
replay.

## 14. Applause finale (fix the double-applause)

New prop `suppressEndApplause` on MatchViewer (default false): when true the match-end applause is
skipped entirely. Rule:

- **Kid eliminated earlier:** her last (losing) match plays its normal short applause at match-end;
  the sad finale screen plays **nothing**.
- **Kid played the final:** the final's MatchViewer is passed `suppressEndApplause` (silent at its
  end); the finale screen plays `applauseFinal` **once** for champion **or** runner-up.

TournamentFlow: the finale watcher now fires `applauseFinal` when `kidChampion || isRunnerUp`. The
old `lastRoundWatched` double-fire hack and the `watched` param on `showResult()` were removed.

## 15. Highlight the round label (`MatchViewer` + CSS)

New optional `stageLabel` prop renders an **accent pill (accent bg, dark text)** over the top-left
of the court (`.viewer-court` positioning wrapper + `.viewer-stage`). TournamentFlow's replay
viewer passes `pending.roundLabel`; the now-redundant plain pill in the replay card head was
removed (the "To result →" link stays, right-aligned).

## 16. No Pause button in live watch (`MatchViewer`)

Live mode drops Play/Pause entirely (matches autoplay and are short). Replay mode keeps its single
"Watch again". Mode/speed selects stay in both. The now-dead `togglePlay()` / `playPauseLabel`
were removed (project runs `noUnusedLocals`).

## 17. Under-court labels use short names both sides

Root-cause fix in `src/engine/world.ts`: `kidMatchPlayer().name` is now the full `"First Last"`
(was first-name-only), so `formatShortName` under the court yields "V. Martin" for the kid exactly
as it already did for the opponent. This also makes the readout tables consistent (both full).
Safe: no test pins the kid match-player name; the news event text uses its own
`kidName + kidLastName` short form; golden saves only assert migration invariants. Covers all three
MatchViewer embeddings (tournament, Season replay, friendly) from one point. The Home-screen
surname (part 1) was left untouched.

## 18. Season "Watch" button icon (`SeasonScreen` + CSS)

The this-week bracket's `▶` glyph (layout-breaking) is replaced by `public/icons/play.svg`,
CSS-mask-tinted to follow text colour (`.watch-play-icon`, same technique as the tab icons). Only
on SeasonScreen — the News "Watch" keeps its glyph per the owner.

## 19. Full draw becomes a real bracket (`TournamentFlow` + CSS)

The collapsible "Full draw" is replaced by an inline visual **bracket**: one column per revealed
round (R32…F short labels), each match a two-row cell (short names, winner bolded/accent, score
winner-perspective), the kid's path highlighted (accent border + tinted cell, kid's name always
accent). Columns left→right show progression, later (shorter) columns centre vertically; the row
scrolls horizontally when wide and stays readable at 375 px. Shown inline between rounds (`post`)
and at the `finale` — never over the pre-match card or during a replay, and never a collapsible
that closes the flow.

## 13. Haptics (`src/audio/haptics.ts` + `sfx.ts` + `MoreScreen`)

New `haptics.ts`: `vibrate(ms=8)` over `navigator.vibrate`, feature-detected (`supportsHaptics()`),
no-op otherwise; on/off persisted to `localStorage 'tb-haptics-off'` (default ON where supported).
The existing delegated click handler in `sfx.ts` now also fires `vibrate()` for
`button.primary, .tab-btn, .sfx-watch` presses (same throttle window as the click cue; every
haptic-eligible element already matches the existing hit/soft selectors, so the early-return can't
skip it). A "Haptics" switch sits next to Sound/Music on the More screen (with a "not supported on
this device" hint when unavailable).

## 21. "Closed W40" wording (`SeasonScreen`)

The calendar event pill reads **"Closed W{n}"** once `week > deadlineWeek`, else "closes W{n}"
(past tense once the window has shut).

---

## Gates

- `npx vue-tsc -b` → 0 errors.
- `npx vitest run` → 308 passed (304 baseline + 4 new timeline gap tests).
- `npm run build` → 0 errors.
- Live-verified at 375 px, sound ON (`npm run preview -- --port 4470`) — see the handoff report.

## Conflicts / notes

- **Duration-band re-centre (item 10):** raising the ceilings (260→290, 100→120) is a numeric
  re-centre to match a deliberate timing change, not a weakening — the product guarantee (2–3.5 min
  at 2×) still holds and the gap events are asserted strictly. Precedent: round-4's 240→260.
- **item 17 touched `src/engine/world.ts`** (`kidMatchPlayer` name) — this is a name/display change,
  not economy work, and is the cleanest single-point fix. Flagged for visibility since it is an
  engine file.
- `finalMatch` prop on MatchViewer is now moot on the final (superseded by `suppressEndApplause`)
  but kept as a documented, defaulted prop; no call site passes it anymore.
