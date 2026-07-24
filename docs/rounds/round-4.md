# Round 4 – quick fixes + viz polish + sound wiring (17 items)

Round 4 predates the itemized owner-numbered Q&A format round 3 and round 5 got in
`docs/decisions.md` – there's no single transcribed list with the owner's own item numbers to quote
here, only the shipped scope recorded in `docs/specs/round4-quick.md`, `docs/specs/round4-viz.md`,
and the sound-wiring follow-up commit. Titles below are Claude's descriptive summaries of that
shipped scope, English (no Russian source phrasing survives for this round), grouped by the branch
that shipped them. All 17 landed – round 4 closed clean, nothing deferred.

## `fix/quick-round4` (9 items) – `docs/specs/round4-quick.md`

- [x] **Save schema v7**: `profile.kidLastName` + `world.prevKidRank`, append-only migration
      → `src/engine/migrations.ts`, commit `c2bdd04`.
- [x] **Golden saves corpus v0–v7** + guard test (a schema bump fails until a new fixture lands)
      → `tests/fixtures/saves/`, `tests/goldenSaves.test.ts`.
- [x] **Weekly parent income** before base costs (wealthy $800 / middle $450 / working $200)
      → `world.ts` `PARENT_INCOME_CENTS`, green ledger row on Money.
- [x] **Surnames + short names**: `SURNAMES`/`pickSurname` pool, onboarding last-name input + dice,
      `formatShortName` ("V. Martin") used everywhere in standings/news
      → `src/engine/season/cohort.ts`, `src/shared/format.ts`.
- [x] **PWA update prompt**: `registerType: 'prompt'` + `UpdateBanner`
      → `src/pwa.ts`, `App.vue`.
- [x] **News strictly newest-first** (within a week too, milestones still pinned) + click-to-replay
      → `HomeScreen.vue`, `MatchReplay.vue`.
- [x] **Sticky header** with a larger, tappable week+funds pill
      → `.app-header { position: sticky }` in `style.css`.
- [x] **Home player card real data**: `#rank`, movement vs `prevKidRank`, season points
      → `HomeScreen.vue` player card.
- [x] **WebP art pipeline**: `sharp` + `scripts/optimize-art.mjs`, PNG sources moved to `art-src/`
      → `npm run art`.

## `feat/viz-polish` (5 items) – `docs/specs/round4-viz.md`

- [x] **Server highlight**: accent pulse ring on the serving dot + an ends-labels row under the
      canvas
      → `src/viz/courtRenderer.ts`, `MatchViewer.vue`.
- [x] **Players run onto the court**: eased per-frame movement, chasing the ball mid-rally,
      recovering to baseline between shots
      → `MatchViewer.vue` `updatePlayers()`.
- [x] **Real side changes**: `computeEndsSwaps()` implementing the actual ITF change-of-ends rule
      (odd local games-in-set, every 6 tiebreak points), `change-ends` timeline beat
      → `src/viz/timeline.ts`.
- [x] **Replay controls**: `mode: 'live' | 'replay'` prop, single "Watch again ↻" in replay mode,
      pinned circular ✕ close on `MatchReplay`
      → `MatchViewer.vue`, `MatchReplay.vue`.
- [x] **Sound framework scaffold**: `src/audio/sfx.ts` (7-key manifest, lazy-load, silent no-op with
      zero files present, `localStorage['tb-muted']`), More-screen Sound toggle
      → wiring (which keys fire on which timeline events) landed with this scaffold; the real mp3s
      and 3 extra keys came in the two follow-up items below.

## Sound-wiring follow-up (3 items) – commit `67efacb`

- [x] **`grunt` layered onto `hit`** every 3rd shot (both players)
      → superseded by the round-5/round-6 sound rewiring onto the owner's own recordings (see
      round-5.md item 6 and round-6.md's "owner sound set rewiring"), but this is where sound
      first went from silent scaffold to actually audible.
- [x] **`out`/miss sound** replaces the generic bounce cue when a shot's result is `out`/`net`
      → same rewiring lineage as above; the *key* (`out`) survived into the current manifest,
      the specific mp3 behind it was later swapped for the owner's own cut.
- [x] **`gasp` on a converted break point** (point-end where `entry.breakPoint && winner !== server`)
      → same lineage; the *behavior* (a distinct cue for break conversions) survived as `ooh` in the
      current manifest, the clip itself changed. `click` was also wired into
      Play/Restart/Watch-again + the mode/speed selects in this same commit (it existed in the
      manifest since the scaffold item above but had no call site until here).
