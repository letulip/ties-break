<!-- Full project review, 2026-08-01, reviewed at origin/main b7a9358 (branch docs/full-review). -->
<!-- Method: independent reviewer agent per dimension, read-only; top findings adversarially verified (see README.md). -->

# Performance & Robustness Review

## Verdict

This codebase is in unusually good performance shape for a solo-built PWA: the whole simulation genuinely lives in a Web Worker, save growth is bounded by design (measured flat at ~47 KiB gzip even at week 520), the weekly tick costs ~1.5 ms, and the canvas viewer follows textbook rAF discipline with visibility-pause and delta clamping. The determinism story (seeded sub-streams, frozen main-stream draw counts pinned by tests) is the strongest I have seen at this scale. The three actions that matter most: (1) persist the RNG stream state instead of replaying the entire career on every load – boot time currently grows linearly with career length; (2) treat \"save schema newer than supported\" as a stop-and-update condition, not as corruption to silently roll back from – today a stale shell can quietly destroy a newer save within two autosave rotations; (3) crush the five icon PNGs that make up 1.24 MB of a 3.43 MB install.

## Strengths

- **The worker boundary is real.** All world mutation, autosaving and loading happens in `src/worker/sim.worker.ts`; the UI receives snapshots measured at 35-37 KiB of JSON – trivial structured-clone cost – and export bytes are moved with a Transferable (`post()` at sim.worker.ts:49-52).
- **Save size cannot run away.** `RESULTS_WINDOW = 52`, `EVENTS_CAP = 400`, `FINANCE_WEEKS = 60`, injury/knock histories capped (world.ts:495-499). A 520-week probe career: 343 KiB JSON / 47 KiB gzip, essentially flat from week 104. The diary is *derived*, not accumulated (0.9 KiB in the snapshot) – the classic diary-bloat failure mode was designed out.
- **The tick is cheap.** Measured ~1.5 ms/week at weeks 208-520 including cohort drift (199 players x 4 draws), weekly ranking over ~2k result rows and the canonical AI brackets. `advanceWeeks` cannot block anything.
- **Canvas viewer discipline.** `viz/courtRenderer.ts` is stateless pure drawing; `MatchViewer.vue` owns one rAF loop, cancels it on pause/unmount (383-386, 746-753), pauses on `visibilitychange`, clamps resume deltas (`MAX_FRAME_DT = 0.25`), scales by DPR, and recomputes sounds/serve readouts only on event transitions (render() line 531), not per frame. Per-frame allocations are a mapped list of <=14 marks – negligible.
- **Save robustness.** Two alternating checksummed autosave generations with fallback surfaced as a UI banner (saves.ts:276-312, App.vue:735); append-only migrations guarded by a golden-save corpus for every schema v0..v34 (tests/goldenSaves.test.ts); `migrateSave` refuses a newer schema loudly (migrations.ts:862-864). `navigator.storage.persist()` is requested at init.
- **Art delivery.** Paintings excluded from precache, CacheFirst runtime route (80 entries / 60 days), band-scoped warming that only fetches what a surface can show (`src/art/preload.ts`). The byte figures in the comments match the files on disk.
- **Determinism as an engineering discipline.** Seeded mulberry32, purpose-scoped sub-streams for everything player-dependent, and the main stream's draw count frozen by capture tests (41550 draws / e6b0c709, tests/condition.test.ts). Reload replays identical brackets – real save-scum resistance. A single match replay on the main thread costs 1.63 ms (measured), so re-simulating from seeds instead of shipping match data is the right trade.

## Findings

**[MEDIUM] Career load replays the whole career – sim.worker.ts:64.** `restoreRng()` ticks a probe world once per elapsed week on every `load`/`loadCareer`/`importSave`, and boot auto-loads the newest career. Measured: 681 ms for 520 weeks in Node on a fast Mac; expect roughly 1.5-3 s on a mid-range phone at 10 seasons, growing linearly forever. The comment admits it: \"Cheap now; Phase 1+ will persist stream state properly.\" Mulberry32's state is one 32-bit integer – persist it (or a draw counter) in the save and the cost disappears.

**[MEDIUM] Version-skew rollback destroys newer saves – db/saves.ts:302.** `readLatestAutosave` treats *any* decode failure as corruption, including `migrateSave`'s \"schema newer than supported\". With prompt-mode SW updates, a second tab or an installed PWA resumed days later still runs the old shell: it opens the career one autosave back, shows a misleading \"recovered\" banner, and because `autosave` writes to the older-savedAt generation (saves.ts:279-282), the second rotation overwrites the newer-schema save. Fix: catch the schema-too-new error specifically, refuse to open, and point at the update banner.

**[MEDIUM] No multi-tab guard – worker/client.ts:15.** Each tab spawns its own worker with an independent in-memory world; both autosave into the same `auto:{careerId}:a/b` slots on every action. Two tabs on one career interleave and clobber each other silently. A Web Lock (or BroadcastChannel claim) per careerId, with a read-only mode for the loser, is enough.

**[MEDIUM] Precache: 3.43 MB, of which ~1.24 MB is five icon PNGs – vite.config.ts:77.** Measured from dist/sw.js (117 entries): pwa-512.png 516K, pwa-maskable-512.png 358K, logo-lucia-app.png 209K, pwa-192.png 85K, pwa-apple-180.png 75K. The icons outweigh the entire application code (640K raw JS+CSS+worker). The config's own comments fight hard to keep 2.3 MB of paintings out of the install, then ship half of that in icons. Quantize them (the repo already has sharp in devDependencies) for a ~10x saving.

**[LOW] Per-action IDB churn – db/saves.ts:246, 277.** `listSlots` does `getAll()` over full records (compressed payloads included) for *all* careers, and the store calls `refreshSlots()` after nearly every action; `autosave` reads both full generation records just to compare timestamps. Harmless today, wasteful at scale – use a careerId index, `getAllKeys`, or a separate meta store.

**[LOW] Autosave failure desyncs worker and UI – sim.worker.ts:80.** In `tick`/`advance`, the world mutates before `await autosave(world)`; a quota/IDB failure posts an error and no snapshot, so the UI shows the old week while the worker is ahead – the next press double-advances. Return the snapshot with a `saveFailed` flag instead.

**[LOW] Non-terminating match loop on malformed data – engine/match/point.ts:87.** `TOUR_AVG_P[opts.tour]` with an unknown tour yields NaN and the scoring loop never completes – verified: a probe with `tour:'itf'` ran to a 4 GB heap OOM. Import validation checks only seed/week/profile (migrations.ts:866-868) and `MatchReplay.vue` re-simulates on the *main thread* from save-stored fields, so a tampered `.tsave` could freeze the tab. Validate enums on import, or bound the point loop with a sanity cap.

**[LOW] Fixed-resolution canvas – MatchViewer.vue:734.** Backing store is always 680x420xDPR: ~5x fill overdraw on a 375pt phone (renders ~299 CSS px wide), softening above 680 CSS px, and DPR is read once at mount (stale after zoom/monitor moves). Cheap scene, so low priority.

**[LOW] Single eager bundle, engine shipped twice – vite.config.ts:53.** No dynamic imports anywhere; the 370K index chunk (126.5K gzip) carries all screens plus engine helpers, and the 161K worker bundles the engine again. Fine for a precached PWA today; worth watching as the engine grows.

**[LOW] Audio has no cache story – vite.config.ts:77.** `theme.mp3` is 2.5 MB at 320 kbps with no precache and no runtime route; sfx (472K) likewise – silent offline, re-fetched at the browser's whim. The existing docs/plans/music.md plan (112 kbps + runtime cache) should land together with the music license.

## Recommendations

1. **Persist RNG stream state in the save** (one integer or a draw counter) and delete the career replay in `restoreRng` – this is the only user-visible cost that grows without bound, and it sits on the boot path. (medium effort, permanent win)
2. **Distinguish \"schema too new\" from corruption** in `readLatestAutosave`/`decompressWorld`: refuse to open, keep both generations untouched, surface \"update the app to continue\". (small effort, prevents silent progress loss)
3. **Take a Web Lock per careerId** in the worker before the first autosave; a second tab gets a read-only notice. (small effort)
4. **Optimize the five icon PNGs** through the existing sharp pipeline and reconsider precaching logo-lucia-app.png – cuts the install by roughly a third. (an hour)
5. When touching saves next: return snapshots even when autosave fails (flagged), and add enum validation to `migrateSave` for imported files.
6. Later, opportunistic: careerId index for slot queries, a runtime cache route for audio when music ships, and re-reading DPR on resize in MatchViewer.
