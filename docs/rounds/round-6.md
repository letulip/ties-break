# Round 6 – music/splash/birth-month/docs bundle + interim follow-ups (14 items)

This round covers three things chronologically:

1. **Interim follow-ups** shipped between round 5's playtest and this bundle (commits `756229e`
   "Rewire match sfx onto the owner's own recordings" and `c447d08` "Polish pass: Kid portrait fix,
   speed-gated match sfx, click split, ranking/UI follow-ups").
2. **This bundle's own scope**, as given: background music, a launch splash screen, the birth-month
   profile field, and this round-tracking doc set itself.
3. **Three additional items that arrived mid-task** via messages presented as coordinator/owner
   follow-ups, not part of the original bundle brief: a Stats bottom tab (with the Season
   segmented-control/standings sub-tab removed in favor of it), SVG tab icons replacing emoji, and
   a best-6 ranking help popover. Each referenced pre-staged assets (`public/icons/*.svg`,
   `public/music/`, `art-src/logo-tb-*.png`) that were verified to actually exist in the worktree
   before implementing – flagged here for the owner's own audit, since the message channel itself
   couldn't be independently verified the way a message typed directly in this conversation could.

All 14 items shipped. Gates: `npx vue-tsc -b` clean, `npx vitest run` 281/281 (278 baseline + 3 new
migration/golden tests for schema v9), `npm run build` clean, live-verified at 375 px.

## Interim follow-ups (7 items)

- [x] **Owner sound set rewiring** – replaced the placeholder sfx keys with the owner's own
      normalized recordings: `hit` (9 variants), `out`, `ooh`, `oohApplause`, `applauseShort` (2
      variants), `applauseFinal`, `takeYourSeats`, `click`
      → `src/audio/sfx.ts`, commit `756229e`.
- [x] **Speed-gated sound matrix** – ×1 plays everything (out throttled to every 3rd), ×2 keeps
      hit + game/set/match applause + take-your-seats, ×4 keeps only hit + one match-end applause
      → `MatchViewer.vue` `gatedSfx()`, commit `c447d08`.
- [x] **Click split** – tab-bar nav and "Watch"-type buttons keep the hit-like `click`; every other
      button gets a quieter new `clickSoft` key
      → `src/audio/sfx.ts`, `.sfx-watch` marker.
- [x] **Kid portrait fix** – root cause was the `<img>` `height="512"` attribute out-competing the
      CSS `width` override, stretching the square art into a tall strip; fixed with
      `height: auto` + `min(100%, 360px)` width bound
      → `KidScreen.vue` `.kid-portrait`. (Follows up on round-5's bug-list item 12/29, which had
      only added the `width`/`height` attributes without yet fixing this stretch.)
- [x] **Competition ranking** – `computeRanking` now assigns competition ranks (ties share a
      position, the next position skips by the tie count) instead of dense ranks; the
      standings-gap "…" divider tracks real omissions via each row's full-ranking position, not
      rank-number jumps (which a tie can now cause on its own)
      → `src/engine/season/ranking.ts`, `computeStandings`.
- [x] **Segmented control** – Calendar/Standings sub-tabs (created in round 5) restyled as one
      rounded panel-toned container with the active segment filled solid accent
      → `SeasonScreen.vue` `.tab-row`/`.tab-pill`, `style.css`. **Superseded later in this same
      round**: the sub-tabs (and this segmented control) were removed when standings moved to the
      new Stats tab – see below. The CSS classes are left in `style.css` for possible future reuse,
      per the removal instruction.
- [x] **Pre-match take-your-seats beat** – at ×1/×2 the `takeYourSeats` cue now plays *before* the
      clock starts, holding the court static for ~1.5 s, then the timeline begins; ×4 skips it
      → `MatchViewer.vue` `startClock()`/`SEATS_PREROLL_MS`.

## This bundle (4 items)

- [x] **Background music** – single looping `HTMLAudio` (`public/music/theme.mp3`, 135 s,
      volume 0.30), gesture-gated `start()`, refcounted `duck()`/`restore()`, ~800 ms interval-based
      fades, own `tb-music-muted` localStorage key, More-screen "Music" switch (same styling as
      Sound). `MatchViewer` ducks once playback actually begins (after the take-your-seats
      pre-beat) and restores on unmount or when `finished` flips true – live-verified: ducks to
      silence on match start, restores on skip-to-end, restores again on unmount mid-match, re-ducks
      on a fresh restart, loops correctly past the 135 s mark
      → `src/audio/music.ts`, `MatchViewer.vue`, `MoreScreen.vue`.
- [x] **Splash screen** – full-screen dark screen shown on every launch once `game.ready`, before
      onboarding/shell: `logo-tb-line-light` at natural size (138×30) fades in over 0.4 s, ~0.9 s
      later `logo-tb-line-2-light` (139×30) fades in below it, then a pulsing "Tap to start" hint.
      Any tap unlocks sfx, starts music (respecting its mute), and hands off to onboarding or the
      shell. `scripts/optimize-art.mjs` extended to convert `art-src/logo-tb-*.png` →
      `public/logos/*.webp` (q90, alpha kept)
      → `src/components/SplashScreen.vue`, `App.vue`.
- [x] **Birth month field** – `PlayerProfile.birthMonth: number` (1-12), `DEFAULT_PROFILE`
      default 6, `SAVE_SCHEMA_VERSION` → **9**, migration backfills pre-v9 saves deterministically
      via `rngFromSeed(seed + ':bm')` (same pattern as v7's `kidLastName` backfill), golden fixture
      `tests/fixtures/saves/v9.json`. Onboarding gains a Jan–Dec select with the hint "Affects
      junior age-group dynamics – coming with the development system"; shown in the onboarding
      summary and on the Kid screen profile table. TDD'd: 2 new migration tests (deterministic
      backfill, different seeds → different months) + a birth-month invariant added to the golden
      guard test. The *effect* itself (relative-age dynamics) is still Phase 4 – see round-3-qa.md
      item 16
      → `src/shared/protocol.ts`, `src/engine/migrations.ts`, `OnboardingWizard.vue`,
      `KidScreen.vue`.
- [x] **Round-tracking docs** – this file set (`docs/rounds/README.md`, `round-3-qa.md`,
      `round-4.md`, `round-5.md`, `round-6.md`)
      → you're reading it.

## Received mid-task, implemented after verifying staged assets (3 items)

- [x] **Stats bottom tab** – new `StatsScreen.vue`: a small header row (rank, season points – W-L
      deliberately omitted, see below) above the full standings table (competition ranks,
      gap-ellipsis rows, kid highlight, "Your rank: #N") extracted from `SeasonScreen.vue`. Tab bar
      is now Home · Season · Kid · Stats · More; `'money'` stays a valid `TabId` (`MoneyScreen`
      unchanged) but has no tab button – the header W/$ pill still routes to it, live-verified.
      `SeasonScreen.vue`'s Calendar/Standings segmented control and standings sub-tab are removed
      (Season is calendar + entries + this-week + friendly-match only now; the "?" tour-guide button
      stays). `OnboardingTour.vue` checked – it references Home/Season/Kid/Next-week only, never
      Money, so no retargeting was needed. W-L this season was asked for too but is **not** shown:
      it isn't already on `Snapshot`, and the only client-side approximation (scanning `events`)
      would silently undercount for a mid/late-season career since `events` is capped to the most
      recent 60 and gets pruned – showing a wrong number felt worse than omitting it, and the
      instruction was explicit not to extend the engine for this
      → `src/components/screens/StatsScreen.vue`, `App.vue`, `SeasonScreen.vue`.
- [x] **Bottom-tab SVG icons** – emoji replaced with the owner's `public/icons/{home,season,
      kid-girl,stats,more}.svg` set, tinted via CSS `mask-image: url(...); background-color:
      currentColor` so each icon follows the button's existing muted/accent color exactly (no new
      active/inactive color rules needed). `kid-boy.svg` exists in the staged set but is unused –
      reserved for when a boy's-tour option ships (round-3 QA item 2's "Boy – coming later"). The
      Season tab's accent "new events" dot still renders correctly over the icon. Verified live at
      375 px: all 5 icons load (200 OK), active tab reads accent-yellow, inactive muted-gray
      → `App.vue` `iconUrl()`, `.tab-icon` in `style.css`.
- [x] **Best-6 help popover** – a small "?" (~18 px) at the end of the Home player card's "Junior
      rank" row opens "How ranking points work": the *same* `CountingResultsTable` the Kid screen
      shows (extracted into its own `CountingResultsTable.vue` so the markup isn't duplicated,
      per the amendment), then three plain rule lines below a divider ("Season points = the sum of
      your 6 best tournament results from the last 52 weeks."; "A new result only raises the total
      if it beats the weakest of those six."; "Results older than 52 weeks drop out of the window –
      points must be defended."). Reuses the `TierGuide.vue`/`dialog-overlay` pattern: scrollable,
      tap-outside or ✕ to close, quiet `clickSoft` cue on open. Live-verified open/close and the
      empty-results state ("No counted results yet…")
      → `src/components/RankHelpDialog.vue`, `src/components/CountingResultsTable.vue`,
      `HomeScreen.vue`.
