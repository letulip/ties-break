---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-05
baseline: 98e3560b
---

# Performance – 5 September 2026 review

## Verdict

The app is fast where the player feels it. On a 4× CPU-throttled 375×812 phone emulation the first
control is tappable 302 ms after navigation, every screen switch costs 20–63 ms of main-thread work
with zero long tasks, and a week advance costs 112–126 ms of main-thread work end to end (engine,
autosave, snapshot, render). The 100-week heap check is flat (5.9 → 6.4 → 6.4 MB after GC), the
listener count is constant under screen cycling, and the engine's week cost does not grow with
career depth (5.3 ms/week at week 52, 6.4 ms/week at week 516).

The three biggest costs, ranked by what the player feels:

1. **The week-advance wait is 3.4 s, and 97 % of it is the designed day-cross sweep, not compute.**
   `Brisk 3s` (dayCross.ts:73) runs before the worker is even asked; the engine plus boundary is
   ~50–125 ms of it. This is an owner setting with a "Tap anywhere to skip" affordance, so it is
   reported, not indicted.
2. **`toSnapshot` is the dominant compute per command: 13–24 ms, 2–4× the week tick itself (5–7 ms),
   and it runs after every mutation** – enter an event, set a plan, buy a racket. It recomputes the
   rankings and re-selects entrants for every upcoming event from scratch on each call
   (ranking.ts:323/441, tournament.ts:499, preview.ts:304/320). Memoising per week is a pure-function
   cache with no determinism or schema risk.
3. **The offline install is 16.1 MiB and its guard measures a smaller number than it ships.** The
   built precache is 356 unique entries / 16,495 KiB; the ceiling test in
   tests/round29p2-offline-install.test.ts:69 measures `public/` alone (15,330 KiB) against 16,384 KiB
   – 6.4 % headroom, and the hashed bundles it excludes are already 1,160 KiB. 758 KB of that install
   is recoverable losslessly from four PNG icons.
   **⭐ THE ICON HALF IS FIXED, SAME DAY, `44343fc7`.** The five PNG icons went **1,070,098 →
   316,181 bytes** and the service worker's precache went with them: **16,495 → 15,755 KiB
   (16.11 → 15.39 MiB), 356 unique entries either way.** Re-verified here against a fresh
   `vite build` at 20318e65 – workbox prints `precache 362 entries (15754.29 KiB)`, which parses to
   356 unique URLs and 16,132,854 bytes on disk. The guard half of this finding stands and matters
   more now, not less: the number the phone actually downloads has crossed the 16,384 KiB line the
   test enforces on a smaller set – **111 KiB above it before the fix, 629 KiB below it after** –
   and the test still measures neither number. See §A, rows marked FIXED.

## Where the time goes

Ordered by what the player feels most. "abs" = absolute wall-clock on this machine under the stated
load (not portable); "rel" = a within-run comparison that is robust to background load.

| # | operation | measured | dominant cause (file:line) | remedy | expected gain (basis) | effort | risk |
|---|---|---|---|---|---|---|---|
| 1 | Week advance, tap → week story on screen | 3,388 ms desktop / 3,420 ms mobile 4× (med of 10, abs, load 4.2–5.1); main-thread task inside it 47–68 ms desktop, 112–126 ms mobile (rel) | `DAY_CROSS_PACE.brisk` = 3,000 ms + 620 ms per beat day, `src/composables/dayCross.ts:73`, played by `CalendarScreen.vue:306` before `game.advance` fires | None to the design – it is the owner's setting (Brisk/Gentle) with a skip on tap (`CalendarScreen.vue:334`, note at :500). Worth knowing: engine + autosave + snapshot + render are < 4 % of the wait | – | – | Wording/design is his; do not touch |
| 2 | Any command's worker round trip (advance, enterEvent, setPlan, buyAsset…) | per command in the worker, pro fixture: `structuredClone(world)` 2.3 ms + `compressWorld` 6.2 ms + **`toSnapshot` 13.0 ms hot / 22–28 ms cold** (med, n=50–200, abs, load 3.5–6.0) vs the week tick 6.4 ms (rel: snapshot is 2–4× the tick) | `toSnapshot` rebuilds `rankingFor(world, track)` (`world/ladder.ts:88` → `computeRanking` `season/ranking.ts:441` → `windowedBestSum` :323 over ~2,200 result rows × 200 players) and, for each of the ~22 `upcoming` events, `previewEvent` (`world/snapshot.ts:421`) → `selectEntrants` (`season/tournament.ts:499`) + `ratedField`/`tierExpectedField` (`season/preview.ts:304/320`). Profile: ranking.ts 15.4 %, tournament.ts 14.8 %, preview.ts 14.7 % of a snapshot-only run; snapshot.ts itself 3.2 % | Cache the derived tables per `(world.week, world.results.length, cohort revision)` on the world – the same home `refreshDerivedRankCaches` (`world/ladder.ts:173`) already uses – so a plan change or a purchase reuses the tables the last tick built; keep `previewEvent` pure and memoise its per-event result keyed on `(event.id, world.week)` for events past `DRAW_LEAD_WEEKS` | 10–15 ms per command (≈ 60–75 % of toSnapshot; basis: the three files' 45 % share plus the `rankingFor` calls at snapshot.ts:356/371/733/918 all recompute the same table). Prove with `PROBE_ARM=snapshot` before/after: med 13.0 → ≤ 5 ms hot | S–M | Determinism: none if the cache key includes everything the table reads (results, week, cohort, fieldSeasonPoints); a stale key would show as a rank drift in `tests/goldenSaves` and the e2e parity spec. No schema change if the cache is not persisted |
| 3 | ~~Offline install size~~ **FIXED 44343fc7** | 16,495 KiB precache, 356 unique entries (workbox build output + `stat`, abs) → **15,755 KiB, 356 entries** after the fix | `globPatterns` `vite.config.ts:213`; PNG icons uncompressed: `pwa-512.png` 529 KB, `pwa-maskable-512.png` 367 KB, `pwa-192.png` 87 KB, `pwa-apple-180.png` 77 KB | Re-encode the four icons losslessly in `scripts/gen-icons.mjs` (sharp `.png({ compressionLevel: 9, effort: 10 })`) | −758 KB (1,060 → 302 KB, measured with sharp on this tree, pixel-identical); `du public/*.png` proves it | XS | None (bytes only); update the numbers in the vite.config note |
| 3′ | **What actually shipped, 16:09** | five icons **1,070,098 → 316,181 B** (−753,917 B = −736 KiB, −70.5 %); `public/` on disk 16,104 → 15,364 KiB; precache 16.11 → 15.39 MiB | the diagnosis above was one argument short: every builder in `scripts/gen-icons.mjs` ended in a bare `.png()` – sharp's default truecolour encoder – over a photograph whose alpha plane measured constant 255 | `encode()` helper: `removeAlpha()` on the four square icons + `.png({ palette: true, colours: 256, quality: 100, effort: 10 })` | delivered −736 KiB against a predicted −758 KB; ratchet `tests/pwa-icon-weight.test.ts` (mutation-verified) | XS, done | palette, not lossless: mean visible-pixel error 1.15/255, worst pixel 36; the favicon keeps its circular alpha through tRNS |
| 4 | Install-size guard | `public/`-only 15,330 KiB vs 16,384 KiB ceiling (6.4 % headroom) while the shipped precache is 16,495 KiB. **After 44343fc7: 14,594 KiB measured (10.9 % headroom) against 15,755 KiB shipped – the gap the finding is about is unchanged at ~1,165 KiB** | `tests/round29p2-offline-install.test.ts:69-71` sums `public/` and excludes the hashed bundles (1,160 KiB) | Measure the built manifest (parse `dist/sw.js` after `vite build`, or add the bundle bytes) and restate the ceiling against the number the phone downloads; the vite.config note (12,256 KiB) is also stale by 4.2 MB since audio and the shop art joined | Honest guard; no bytes saved | XS | The ceiling is an owner ruling (29.08) – restate, do not raise silently |
| 5 | First boot on a phone | tap-to-start at 302 ms, FCP/LCP 132 ms, 1 long task of 58 ms; tap → Home 306 ms with one 104–119 ms long task (mobile 4×, min/med of 3, abs) | one 632 kB / 213 kB-gzip main chunk, no code splitting (0 `import(`, 0 `defineAsyncComponent`); `@vue` 72.7 kB, components 330 kB; boot script time 65 ms mobile | Optional: split `MatchViewer`+`MatchControls`+`viz/commentary` (~30 kB) and `OnboardingWizard`+`prologue/*` (~39 kB) behind `defineAsyncComponent` | ≤ 10 % of boot script time (~7 ms mobile; basis: their 11 % byte share); not worth a wave on its own | S | The precache would gain two more entries; the e2e parity spec fingerprints controls, not chunks |
| 6 | Match playback at ×4 | main thread 17 % busy desktop, 71 % busy under 4× throttle (30 s window, 0 long tasks, rel); style recalc is the largest slice desktop (1,890 of 5,212 ms) | per-frame rAF clock in `MatchViewer.vue` (playback clock section :267) re-rendering the court/score/momentum each frame at 120 Hz | Nothing urgent – no frame exceeded 50 ms even throttled. If a real low-end phone drops frames, throttle the readout updates to the ~8 Hz the file already describes for the serve-speed span (:256) | Up to 2/3 of the style work; measure `styleMs` in the 30 s window | S | Visual only; playback timings are diegetic (`viz/matchClock.ts`) and must not move |
| 7 | Two extra worker round trips per advance | `refreshSlots()` + `refreshCareers()` after every `advance`/`tick` (`stores/game.ts:237-240`); `listSlots` does `getAll()` over every save record including payloads (`db/saves.ts:394`) | design leftover: slot lists refresh on every mutation although only the autosave rotation changed | Read `careers` meta only, or `getAllKeys` + `get` of the two autosave slots; refresh slot lists when More is opened | ~2 IDB reads of 80–160 KB per advance; small today (one career), grows with saves | XS | None; UI only |
| 8 | `npm run check` wall time | **421.8 s = 7 min 02 s, all 12 steps exit 0** (quiet, 20318e65, §E). The unit project is **367.5 s = 87 %** of it; typecheck 7.7 s, check:tools 2.7 s, build 2.9 s, test:component 39.5 s, seven doc gates 1.5 s | **219 s of the unit project's 367 s is thirteen files run one vitest process at a time** while nine cores idle (`scripts/units.mjs`); the same 231 files in one pool take 154.9 s | Bounded concurrency for the heavy loop, derived from `os.availableParallelism()` so a two-core CI runner keeps today's strict serialisation – P-13 | heavy tail 219 → ~80 s, `check` 422 → ~285 s (basis: each heavy shard is 8–25 s solo against birpc's 60 s wall) | S | The serialisation exists to dodge a documented CI failure; the guard is that every shard's own printed seconds must stay under ~30 s |

Already fast – leave alone:

- Engine week tick: 5.3–6.4 ms/week median across week 0–516, flat with career depth; a 52-week
  dev tick is 179–240 ms end to end in the browser including autosave and render.
- The load path: sha256 + gunzip + parse + `migrateSave` = 2.5 ms for a 466 kB world; `migrateSave`
  0.6–0.8 ms; the O(1) resume claim holds.
- The transport: `structuredClone(snapshot)` 0.41 ms, snapshot 97 kB / 5,517 nodes; the deep-reactive
  wrap costs 1.4 ms per full traversal. The boundary is healthy; the cost is upstream in derivation.
- Match simulation: 0.10 ms per match, 1.19 M points/s; the viewer's whole prep (simulate, annotate,
  timeline, commentary, stats) is 3.3 ms, commentary 0.7 ms of it. `TournamentFlow.vue:679`
  re-simulating on the UI thread is fine at this cost.
- Screens: every switch under 20 ms of task time on desktop, under 65 ms at 4× throttle, 91–348 DOM
  nodes, zero long tasks, no listener or heap growth over 15 cycles.
- The service worker: second visit tappable at 91–110 ms desktop / 156–158 ms mobile; 356 entries
  precache in ~4.2 s from localhost.
- The light doc gates: seven scripts, 2.0 s together, compact output (context:audit 110 lines).

## Method

**⚠ WHICH COMMIT EACH NUMBER WAS TAKEN AT – THE TREE MOVED UNDER THIS REPORT.** No section here is
all one revision, so read the provenance before quoting a number.

| section | commit | when | note |
|---|---|---|---|
| A. Bundle, B. Engine, C. Worker boundary, D. Browser | **98e3560b** | 08:44–09:24, 5 Sept | the review branch before the owner's second pass |
| E. Tests and gates | **20318e65** | 17:14–17:33, 5 Sept | re-measured on a quiet machine; §E's own table gives the load per step |
| the icon rows inside A (marked in place) | **44343fc7** | 16:09, 5 Sept | the fix that landed after A was written |

Between 15:57 and 17:00 the owner's round-36 second pass landed eight commits – seven fixes plus one
delivery fix (`44343fc7`) – and the review branch merged `round/36` head `919105e7` at 17:09 as
`20318e65`. The diff `98e3560b..919105e7` is 32 files: `src/App.vue`, three components, one new
component and one new composable, `src/shared/dates.ts`, `+232` lines of `src/style.css`, the five
PNG icons, `scripts/gen-icons.mjs` and 20 test files. **Nothing under `src/engine/`, `src/worker/`
or `src/db/` moved**, so B and C stand as taken. A and D do not: the UI chunk, the CSS chunk and the
component byte table all grew or shrank with that diff, and the icons shrank by 736 KiB. **Do not
quote an A-section byte count as today's** – the icon rows are corrected in place below, and the
rest is a reading of 98e3560b.

- Machine: Apple M4 (10 cores), 16 GB, macOS 26.5.1, Node v26.5.0, Chromium via `@playwright/test`
  1.62.1 headless. Four other review lanes were reading the same machine throughout; load average
  ranged 3.5–6.0 (recorded per block below). One measured contention spike (load 6.0) doubled the
  first `pro` repeat (11.45 ms/week vs 6.4–6.8 on the other three) – the classic signature, so
  every headline is given as min and median across repeats, and within-run comparisons are marked
  "rel".
- Worktree `wt-rv36` at 98e3560b; nothing under src/tests/tools/scripts/e2e/docs was changed except
  this file. Builds went to the scratch directory via `--outDir`; probes live in scratch.
- Scratch: `…/scratchpad/rv36-P/` – `build.log`, `build-nosw.log`, `dist/`, `dist-nosw/`,
  `dist-gate/`, `sme.json` + `sme.log` (source-map-explorer, run with `npx --yes`, needed
  `--no-border-checks` for the worker map), `probe-engine.ts` (vite-node; arms fresh / junior / pro
  / golden / match / boundary / snapshot), `prof/<arm>/*.cpuprofile` + `prof-*.txt`
  (`analyze-prof.mjs`), `engine-*.log`, `boundary.log`, `probe-browser.mjs` + `browser-desktop-run1.log`,
  `browser-desktop-heap.log`, `browser-mobile.log`, `browser-sw.log` (`summarize-browser.mjs`),
  `diag-devtick.mjs`, `gate-light.log`, `gate-heavy.sh` + `gate-heavy.log` + `gate-*.out`,
  `unit.json` + `unit.log` (`analyze-unit.mjs`), `preview-5841.log`, `preview-5842.log`.
- Scratch, second pass (§E only): `…/scratchpad/rv36-P2/` – `gate-round2.sh` + `gate2.log` +
  `g2-*.out` (every `check` step timed on its own at 20318e65), `unit2.json` + `unit2.log`,
  `analyze-unit2.mjs`, `verbose-volume.mjs`, `dist-g2/` (the build the precache was re-parsed from).
  No server was started on this pass and none is running; ports 5836 and 5711 belong to other
  processes and were not touched.
- Servers: `vite preview` on 5841 (dist built with `VITE_TB_SW=off`, as the e2e harness does for
  eleven of its twelve specs) and 5842 (the ordinary dist with the service worker). Both killed at
  the end; port 5836 untouched.
- Careers: the e2e fixtures `pro` (week 412, the heavy-state screens), `junior` (week 120, boots
  into a knock and a tournament) and the golden `v70.json` (week 333). No personal saves.
- Engine probe: the same driver the benches use (`tools/econ-bench.ts` `stepCareerWeek`, policy
  `player`), decisions resolved the way a player would (`advanceRefusal` → knock rest, birthday
  first gift, tournament skip/close, fork continue). Profiles with `node --cpu-prof` through
  `node_modules/vite-node/vite-node.mjs`; profile line numbers are the transformed file's, so hot
  functions are cited by name at their source line.
- Browser probe: Playwright + CDP (`Emulation.setCPUThrottlingRate 4`, `Performance.getMetrics`,
  `HeapProfiler.collectGarbage` + `Runtime.getHeapUsage`), `PerformanceObserver` for LCP, FCP and
  long tasks installed by an init script, careers seeded through the same IndexedDB init-script
  mechanism as `e2e/careerAt.ts`. The phase wall-clock includes a two-frame + 60 ms settle, so
  "task ms" is the honest per-screen cost.
- Could not measure: the worker's own heap (Playwright exposes no CDP session for a dedicated
  worker; the page heap was measured) and the IndexedDB transaction alone (measured end to end
  inside the dev tick instead). The golden `v70` career is in college (`ending.type = 'college'`),
  so it could not be ticked; the e2e `pro` fixture served as the deep career. ~~The unit gate's real
  sharded wall time (`scripts/units.mjs`) separately from the JSON run~~ – **measured on the second
  pass: 367.5 s, and both shapes are in §E side by side.** What §E could not settle is why two tests
  recorded durations above the 20 s ceiling and still passed (§E, "Two readings I could not
  reconcile"), and the CI-side numbers – every §E figure is this 10-core Mac; CI's two cores run
  this project at roughly 1.9× per its own calibration, and nothing here was run on a runner.

## A. Bundle

Build: `vite build --sourcemap` 5.5 s wall (383 modules; load 5.7). `EXIT=0`.

| asset | raw bytes | gzip bytes | note |
|---|---|---|---|
| assets/index-BtHyoSOl.js | 632,244 | 212,408 | the whole UI, one chunk |
| assets/sim.worker-Crubabpk.js | 366,802 | 118,014 | the engine, parsed off-thread |
| assets/index-C2IO66pC.css | 184,984 | 32,127 | all SFC styles + style.css |
| assets/workbox-window.prod.es5-….js | 5,809 | 2,438 | |
| sw.js | 31,686 | 10,012 | precache manifest inline |
| workbox-2fbc6a65.js | 15,116 | 5,239 | |
| index.html | 904 | 540 | |
| **JS total** | **1,051,657** | **348,111** | main-thread at boot: 638 kB raw / 215 kB gzip |

Code splitting: none. `git grep "import("` and `defineAsyncComponent` over `src/` return nothing;
Vite emits exactly two application chunks (UI + worker). Vite's own >500 kB warning fires on the
UI chunk.

Top modules by bytes (source-map-explorer, `--no-border-checks`):

| UI chunk (632,244 B) | bytes | % | worker chunk (366,802 B) | bytes | % |
|---|---|---|---|---|---|
| node_modules/@vue/runtime-core | 42,514 | 6.7 | src/engine/economy.ts | 20,134 | 5.5 |
| src/components/screens/MoneyScreen.vue | 33,039 | 5.2 | src/engine/diary/pool.ts | 17,148 | 4.7 |
| src/components/screens/SeasonScreen.vue | 24,895 | 3.9 | src/engine/world/birthday.ts | 16,097 | 4.4 |
| src/components/screens/HomeScreen.vue | 21,509 | 3.4 | src/engine/world/snapshot.ts | 15,855 | 4.3 |
| src/engine/economy.ts | 19,754 | 3.1 | src/engine/diary/weekNotes.ts | 15,829 | 4.3 |
| src/components/OnboardingWizard.vue | 18,181 | 2.9 | src/engine/migrations.ts | 15,091 | 4.1 |
| src/components/OfferLetter.vue | 18,076 | 2.9 | src/engine/offers.ts | 11,799 | 3.2 |
| node_modules/@vue/reactivity | 17,299 | 2.7 | src/engine/diary/travelNotes.ts | 11,260 | 3.1 |
| src/components/TournamentFlow.vue | 16,132 | 2.6 | src/engine/world.ts | 11,203 | 3.1 |
| src/components/screens/MoreScreen.vue | 13,885 | 2.2 | src/engine/radar.ts | 9,899 | 2.7 |
| src/prologue/cards.ts | 12,921 | 2.0 | src/engine/season/calendar.ts | 8,252 | 2.2 |
| src/viz/commentary.ts | 12,553 | 2.0 | src/engine/world/coachMarket.ts | 7,952 | 2.2 |
| src/components/screens/CoachMarketScreen.vue | 12,385 | 2.0 | src/engine/world/college.ts | 7,822 | 2.1 |
| src/components/MatchViewer.vue | 12,035 | 1.9 | src/engine/world/sponsors.ts | 7,315 | 2.0 |
| src/App.vue | 11,771 | 1.9 | src/worker/sim.worker.ts | 6,369 | 1.7 |

By directory, UI chunk: `src/components` 52.1 %, `src/composables` 11.7 %, `@vue` 11.5 %,
`src/engine` 9.4 % (44 engine files, 59 kB, shipped to the UI thread as well – `economy.ts`,
`season/calendar.ts`, `match/*` for the viewer's re-simulation), `src/viz` 3.9 %, `src/prologue`
3.3 %, `pinia` 0.7 %.

`public/` (copied verbatim into dist): 16,104 KiB. **⭐ 15,364 KiB since `44343fc7` (−740 KiB,
`du -sk public`) – every byte of the change is in the five PNGs, marked in the rows below.**

| type | files | KiB |
|---|---|---|
| webp | 267 | 11,112 |
| mp3 | 25 | 2,981 (theme.mp3 2,524 – 135 s at 152 kbps; 24 match cues 472) |
| png | 5 | 1,045 (four PWA icons 1,035) → **309 after `44343fc7`; the five icons are 316,181 B** |
| woff2 | 3 | 98 |
| svg | 50 | 94 |
| md + txt | 7 | 23 – READMEs and OFL licences, shipped and precached by no route (`images/README.md` is even in dist) |

Largest 15 files, **at 98e3560b**. ⭐ The three PNGs in this list moved on `44343fc7`:
`pwa-512.png` **516 → 146.8 KiB**, `pwa-maskable-512.png` **358 → 105.1**, `pwa-192.png`
**85 → 27.9**. The first two are still the second and third largest files in `public/` (the biggest
webp is 100 KiB); `pwa-192.png` drops out of the list, and `music/theme.mp3` is now 17× the next
file rather than 5×:
`music/theme.mp3` 2,524 KiB; `pwa-512.png` 516; `pwa-maskable-512.png` 358; then
`images/fields/*.webp` at 84–100 KiB each (wta250-venue-2 100, w15-venue-2 98, wta250-venue-1 96,
wta500-venue-2 91, wta125-venue-1 90, w15-venue-1 90, w100-venue-1 89, w35-venue-1 86,
w15-venue-3 86, w75-venue-2 85, wta250-grass-1 84) and `pwa-192.png` 85. Art by set:
fields 7,324 KiB, fem-euro-brunnet 3,492, shop 1,164, weeks 1,128, trophies 816, coaches 196,
sponsors 48.

Service-worker precache (`dist/sw.js`, workbox `generateSW`): the build reports **362 entries /
16,494.80 KiB**; parsed, that is **356 unique URLs = 16,495 KiB (16.1 MiB)** – six entries appear
twice with identical revisions (`ball.svg`, `favicon.png`, `pwa-192.png`, `pwa-512.png`,
`pwa-apple-180.png`, `pwa-maskable-512.png`: `includeAssets` at vite.config.ts:150 and the
`**/*.{png,svg}` glob both match them; workbox de-duplicates identical url+revision pairs, so the
cost is nil). By type: webp 267 / 11,112 KiB; mp3 25 / 2,982; png 5 unique / 1,045; js 3 / 981;
css 181; woff2 99; svg 51 / 97. First-visit install measured at 4.2 s from localhost; on the
3 Mbit/s the vite.config note assumes, 16.1 MiB is ~45 s, not the ~35 s the note still says.

**⭐ RE-MEASURED AT 20318e65 AFTER `44343fc7`** (fresh `vite build --outDir …/dist-g2`, manifest
parsed the same way): the build now reports **362 entries / 15,754.29 KiB**, parsing to **356 unique
URLs = 15,755 KiB (15.39 MiB)**, `png 5 unique / 309 KiB`. The −740 KiB is entirely the icons; the
six duplicate entries, the type mix and the entry count are unchanged. At 3 Mbit/s the install is
now ~43 s rather than ~45 s – the note in vite.config.ts is still stale by more than the icons were
worth, which is what P-02 is about.

Findings:

- **P-01 (P2, XS) – ✅ FIXED THE SAME DAY, `44343fc7` (owner's round-36 second pass, 16:09).** The
  finding as written: *the four PWA icons are stored uncompressed: 1,060 KB, re-encoded losslessly by
  sharp to 302 KB on this tree. `scripts/gen-icons.mjs` already uses sharp; add `.png({
  compressionLevel: 9, effort: 10 })`. Proof: `stat` on the four files and the precache total.*
  It is kept because the fix is only legible next to it. **What landed, and what it measured:**
  the cause was one missing argument – every builder in `scripts/gen-icons.mjs` ended in a bare
  `.png()`, sharp's default truecolour encoder, over a photograph whose alpha plane measured
  constant 255 on all four square icons. The shipped remedy is an `encode()` helper doing
  `removeAlpha()` plus `.png({ palette: true, colours: 256, quality: 100, effort: 10 })` – a palette
  rather than the lossless route this finding predicted:

  | file | before | after |
  |---|---|---|
  | `public/pwa-512.png` | 528,653 | **150,332** |
  | `public/pwa-maskable-512.png` | 366,605 | **107,641** |
  | `public/pwa-192.png` | 87,438 | **28,525** |
  | `public/pwa-apple-180.png` | 77,270 | **25,627** |
  | `public/favicon.png` (the fifth, which this finding missed) | 10,132 | **4,056** |
  | **total** | **1,070,098 B** | **316,181 B** (−753,917 B = −736 KiB, −70.5 %) |

  Measured against the built output rather than against `public/`: **the service worker's precache
  went 16.11 MB → 15.39 MB, 740 KB saved, 356 entries either way.** `tests/pwa-icon-weight.test.ts`
  is the ratchet and is mutation-verified. Two notes for the record: the finding named four icons
  and there were five, and it predicted a *lossless* 302 KB where the palette route delivered 316 KB
  with a mean visible-pixel error of 1.15/255 – so the prediction was 4 % optimistic and the wrong
  kind of encoder, and it still pointed at the right file and the right byte count.
- **P-02 (P2, XS)** The install ceiling guards `public/` (15,330 KiB, 6.4 % under 16,384) while the
  phone downloads 16,495 KiB; the vite.config note still says 12,256 KiB / 313 entries and ~35 s.
  Measure the built manifest and restate. Owner ruling (29.08) sets the ceiling, so restate rather
  than raise.
- **P-03 (P3, XS)** Seven README/licence files (23 KiB) ship and precache. Exclude `**/*.{md,txt}`
  from `public/` at build time (a Vite `publicDir` copy filter or moving the OFL texts into the
  About screen's assets). Cosmetic; keep the licences reachable.
- **P-04 (P3, S)** No code splitting; the UI chunk is 213 kB gzip and 65 ms of script at 4×
  throttle. Splitting the match viewer and the onboarding/prologue would move ~11 % of bytes off
  the boot path. Low value while boot is 302 ms; not a wave.

## B. Engine

Driver: `stepCareerWeek` (entries by the `player` policy + `tickWeek` + close the tournament),
decisions resolved between weeks; one arm per fixture; ms per week. Load 3.5–6.0 (per log).

| arm | weeks | n | min | med | p95 | max | sum | tournament weeks med (n) | plain weeks med | bare `advanceWeeks(1)` med |
|---|---|---|---|---|---|---|---|---|---|---|
| fresh career | 0 → 52 | 52 | 2.72 | 5.35 | 11.73 | 13.06 | 305 ms | 6.27 (26) | 5.10 | 4.25 |
| junior fixture | 120 → 172 | 52 | 2.64 | 5.29 | 11.96 | 18.75 | 301 ms | 6.06 (17) | 4.51 | 4.08 |
| pro fixture | 412 → 516 | 104 | 2.39 | 6.43 | 12.00 | 23.67 | 716 ms | 7.26 (52) | 5.78 | 3.88 |
| pro, first 52 vs weeks 53+ | | 52 / 52 | | 6.78 / 6.26 | 15.69 / 10.37 | | | | | |

Repeats (pro, 52 weeks, three more runs; the second ran under a load spike to 6.0): week med
6.43 / 11.45 / 6.77 / 6.71 → **min 6.43, median 6.74 ms/week**; bare advance 3.88 / 8.56 / 3.91 /
3.67; `toSnapshot` ×50 after the run 25.03 / 27.96 / 22.65 / 22.18 → **min 22.2, median 23.8 ms**;
`toSnapshot` alone, warmed, ×200: **med 13.04, p95 24.1, max 103.7 ms** (the max is a GC pause).

Career-depth scaling: no O(n²). `world.results` is a pruned window (2,234 rows at week 412,
2,207 at 516), `world.events` is capped at 400, the cohort is 199; the week cost moves from 5.3 to
6.4 ms between week 52 and 516 (+20 %) and the second 52 weeks of the pro run are cheaper than the
first. The golden v70 fixture is in college and cannot be ticked; `pro` at 412–516 is the deep arm.

Load path (pro, 466 kB JSON): `JSON.parse` 1.7 ms, `migrateSave` 0.8 ms, `refreshDerivedRankCaches`
10.0 ms (the one derivation paid at load). Golden v70 (571 kB pretty-printed): parse 1.1,
migrate 0.01 ms (already current).

Top 15 functions by self time, pro arm (2,880 ms sampled, engine 65 %; vite-node's transform
6.3 % and idle 7.1 % are the harness):

| self ms | % | function | source |
|---|---|---|---|
| 178.4 | 6.2 | `windowedBestSum` | src/engine/season/ranking.ts:323 |
| 154.8 | 5.4 | (filter callback inside `windowedBestSum`) | ranking.ts:323–340 |
| 115.0 | 4.0 | `selectEntrants` | src/engine/season/tournament.ts:499 |
| 84.6 | 2.9 | (garbage collector) | – |
| 68.3 | 2.4 | `assignCompetitionRanks` | ranking.ts:376 |
| 61.1 | 2.1 | `isCountingResult` | ranking.ts:64 |
| 53.6 | 1.9 | `tierExpectedField` | src/engine/season/preview.ts:320 |
| 50.5 | 1.8 | (map callback inside `selectEntrants`) | tournament.ts:499+ |
| 50.1 | 1.7 | `ratedField` | preview.ts:304 |
| 42.1 | 1.5 | `win` | src/engine/match/closedForm.ts:20 |
| 37.6 | 1.3 | `rankingFor` | src/engine/world/ladder.ts:88 |
| 36.8 | 1.3 | `pctOf` (closure in `selectEntrants`) | tournament.ts:499+ |
| 41.1 | 1.4 | `Script` (vite-node module eval) | node:vm |
| 51.8 | 1.8 | (program) | – |
| 203.3 | 7.1 | (idle) | – |

By file: ranking.ts 570 ms 19.8 %, tournament.ts 372 ms 12.9 %, preview.ts 190 ms 6.6 %,
ladder.ts 104 ms 3.6 %, rival.ts 76 ms, rng.ts 60 ms, match/closedForm.ts 57 ms, fieldPros.ts 50 ms;
snapshot.ts itself 1.5 %. The fresh arm ranks the same three files first (ranking 20.7 %,
tournament 11.4 %, preview 7.0 %). A snapshot-only profile (`PROBE_ARM=snapshot`, 4,324 ms sampled)
puts ranking.ts at 15.4 %, tournament.ts 14.8 %, preview.ts 14.7 % – the same functions, which is
how the week tick and `toSnapshot` came to share one remedy (row 2 above).

Match (WTA best-of-three, mid-50s skills, 300 matches after a 20-match warm-up):

| phase | med | mean | max | note |
|---|---|---|---|---|
| `simulateMatch` | 0.10 ms | 0.13 | 1.11 | 160.7 points/match, **1.19 M points/s** |
| `annotateMatch` (rally.ts) | 2.14 | 2.29 | 6.01 | the viewer's biggest step |
| `buildTimeline('full')` | 0.05 | 0.08 | 0.51 | |
| `buildCommentary` | 0.69 | 0.88 | 2.77 | 16 beats/match; **25.5 % of viewer prep**, 0.8 % of the match arm's profile |
| `computeMatchStats` | 0.05 | 0.09 | 1.10 | |
| whole viewer prep | 3.26 | 3.45 | 10.52 | matches `TournamentFlow.vue:679` |

The existing gate `tests/match/calibration.test.ts:150` (10,000 matches under 3 s) has ~2.3×
headroom at 1.3 s equivalent on this machine.

Findings:

- **P-05 (P1 leads the next wave, S–M)** `toSnapshot` at 13–24 ms per command dominates every
  round trip (row 2). Cache the ranking tables and the per-event previews per week; measure with
  `PROBE_ARM=snapshot` (target ≤ 5 ms hot) and `PROBE_ARM=pro` (week + snapshot).
- **P-06 (P3, S)** `windowedBestSum` filters and sorts the whole `results` array per player per
  call (ranking.ts:323); `computeRanking` calls it for each of 200 players, so one table is
  200 × 2,200 row visits. A single pass bucketing results by player (a `Map<playerId, rows>` built
  once per table) removes the quadratic factor. Gain: most of ranking.ts's 20 % of the tick;
  determinism-safe if the per-player sort stays `points desc, week desc`. Prove with the pro arm's
  `bare advanceWeeks(1)` median (3.9 ms).
- **P-07 (P3, XS)** The bulk-load derivation `refreshDerivedRankCaches` is 8–10 ms per load;
  fine, but it is the same table as P-05 – one cache serves both.

## C. Worker boundary

Measured in node (same code paths: `compressWorld` replicated with `CompressionStream` +
`crypto.subtle`, `structuredClone` as the `postMessage` proxy), pro fixture unless stated.

| quantity | pro (w412) | junior (w120) | golden v70 (w333, college) |
|---|---|---|---|
| world JSON | 466,313 B, 74 keys, 28,703 nodes | 319,705 B | 360,088 B |
| snapshot JSON | **97,403 B, 88 top-level keys (protocol declares 90), 5,517 nodes** | 79,981 B / 4,207 | 60,951 B / 3,528 |
| biggest snapshot fields | offers 16.5 kB (71), upcoming 14.7 kB (22), shop 13.4 kB, events 12.8 kB (60), financialEvents 6.3 kB (50), ladders 6.2 kB, coachMarket 5.5 kB (16) | upcoming 20.4 kB (29) | shop 13.3 kB |
| `toSnapshot` (×100) | 13.4 ms med | 18.8 | 2.8 (no live season) |
| `structuredClone(world)` (×100) | 2.31 ms | 1.75 | 1.86 |
| `structuredClone(snapshot)` (×100) | **0.41 ms** | 0.30 | 0.25 |
| `JSON.stringify(snapshot)` | 0.26 ms | 0.18 | 0.15 |
| `compressWorld` (encode + gzip + sha256, ×10) | 6.16 ms → 82,486 B payload (17.7 % of JSON) | 4.02 → 57,097 B | 5.10 → 66,853 B |
| load (sha256 + gunzip + parse + migrate, ×10) | 2.51 ms | 1.51 | 1.93 |
| full read, plain object | 0.08 ms | 0.06 | 0.05 |
| full read through `reactive()` (first / second pass) | 1.50 / 1.41 ms | 1.17 / 1.09 | 0.99 / 0.99 |

Posts per command: exactly one `SnapshotReply` per message (`snapshotMsg`, sim.worker.ts:125),
whatever `weeks` the `advance` or `tick` carried – the loop inside `advanceWeeks`/`tick` never
posts. After every advance the store additionally sends `listSlots` and `listCareers`
(`stores/game.ts:237-240`), so the player's tap is three round trips, and `listSlots` is a
`getAll()` over every save record with payloads (`db/saves.ts:394`).

What the db layer writes: one `SaveRecord` of ~82 KB gzip + 32 B sha256 + meta, and a `careers`
row, in one transaction with a CAS on the revision (`runAutosaveTx`, saves.ts). End to end in the
browser, a 52-week dev tick – 52 ticks + one autosave + one snapshot + render – is 179–240 ms
desktop, 206–251 ms at 4× throttle.

The UI holds the snapshot deep-reactive: Pinia options state (`state: () => ({ snapshot: … })`,
game.ts:79) wraps it in `reactive()`. Measured cost of that choice: 1.4 ms per full traversal of
the pro snapshot, and screens read slices, not the whole. `shallowRef` would save at most ~1 ms
per snapshot – not worth the churn.

Findings:

- **P-08 (P2, XS)** Drop the two list refreshes from the advance path or make `listSlots` read
  keys only (row 7). Measure: worker messages per advance 3 → 1; IDB bytes read per advance.
- **P-09 (verified, no action)** The boundary the 2 September review called healthy is healthy in
  numbers: 97 kB / 0.4 ms to clone, 6 ms to make durable, 2.5 ms to load. The cost lives in
  `toSnapshot`'s derivation (P-05), not in the wire.

## D. Browser

Production dist served by `vite preview`; careers seeded through the e2e IndexedDB mechanism;
three repetitions, min/med. Long tasks are ≥ 50 ms entries from `PerformanceObserver`. Load
4.0–5.1 during these runs.

Boot (pro fixture, no service worker, `dist-nosw` on :5841):

| metric | desktop 1280×900 (min/med) | mobile 375×812, CPU 4× (min/med) |
|---|---|---|
| TTFB | 2 / 3 ms | 1 / 3 ms |
| DOMContentLoaded | 43 / 51 | 111 / 114 |
| load | 50 / 55 | 116 / 120 |
| FCP | 52 / 60 | 128 / 132 |
| LCP | 132 / 148 | 128 / 132 |
| 'Tap to start' visible | **200 / 207** | **301 / 302** |
| script time to that control | 15 / 16 ms | 65 / 66 ms |
| task time to that control | 48 / 50 ms | 183 / 192 ms |
| long tasks during boot | 0 | 1 (56 / 58 ms) |
| tap → Home visible (wall / task) | 181 / 192 ms, task 81 / 98 | 283 / 306 ms, task 202 / 227 |
| long tasks tap → Home | 0 (one 54 ms once in 5 runs) | 1 (104 / 119 ms) |
| DOM nodes on Home | 348 | 325 |

Screens (task ms per switch, min/med; every one had zero long tasks in both modes):

| screen (real tab / door name) | desktop task | mobile 4× task | DOM nodes | route |
|---|---|---|---|---|
| Season | 16 / 17 | 61 / 62 | 252 | bar |
| Calendar | 10 / 12 | 38 / 39 | 171 | bar |
| Home | 8 / 8 | 25 / 26 | 320 (297 mobile) | bar |
| Stats | 8 / 9 | 27 / 29 | 313 | bar |
| Trophies | 13 / 14 | 44 / 44 | 309 | bar |
| Money (`Family budget` door) | 16 / 17 | 62 / 63 | 160 | Home |
| Money › Shop | 6 / 7 | 19 / 20 | 91 | segment |
| Money › History | 6 / 7 | 24 / 24 | 311 | segment |
| More (`Settings` door) | 6 / 8 | 20 / 23 | 118 | Home |

(There is no bottom-bar tab called Money, Shop or More: the bar is Season / Calendar / Home /
Stats / Trophies; Money and More are doors on Home, the shop is a segment of Money.)

10-week advance (pro, week 412 → 422, one run per mode; each tap measured to the first response –
week story, tournament splash or dialog – then the follow-up taps settled separately):

| | desktop | mobile 4× |
|---|---|---|
| tap → response, min / med / max of 10 | 3,378 / 3,388 / 3,406 ms | 3,409 / 3,420 / 3,428 ms |
| main-thread task inside that window | 47–68 ms | 112–164 ms |
| long tasks | 0 | 0 |
| settle (wrap-up `Continue`, `Proceed to Home`, stop notice) | 262–550 ms | 304–621 ms |

The 3.4 s is `DAY_CROSS_PACE.brisk` (3,000 ms sweep + 620 ms hold per beat day) played before the
worker is asked; `Gentle` is 5,000 + 900. The store's own work per advance is the 50–160 ms of task
time above.

Match (junior fixture, `Watch match`, then `Quadruple speed`):

| | desktop | mobile 4× |
|---|---|---|
| `Watch match` → court on screen | 117 ms (task 31) | 220 ms (task 137, one 69 ms long task) |
| 30 s of ×4 playback: task / script / style / layout | 5,212 / 271 / 1,890 / 291 ms (17.4 % busy) | 21,243 / 587 / 546 / – ms (70.6 % busy) |
| long tasks in those 30 s | 0 | 0 |
| rAF rate | 119.9 fps (headless 120 Hz) | 119.9 fps |
| DOM nodes | 442 | 417 |

Heap (page isolate, `collectGarbage` then `getHeapUsage`, min of 3 readings; weeks advanced with
the `▶▶ 52 (dev)` button in More › Saves, decisions answered):

| | after boot (w412) | after +50 weeks (w492) | after +100 weeks (w543) |
|---|---|---|---|
| desktop used heap | 5.9 MB | 6.4 MB | 6.4 MB |
| mobile used heap | 5.9 MB | 6.4 MB | 6.4 MB |
| listeners / DOM nodes (desktop) | 48 / 320 | 52 / 288 | 52 / 277 |
| 52-week dev tick wall (desktop / mobile) | 179 / 206 ms | 240 / 251 ms | 212 / 237 ms |

Screen cycling (Season, Home, Calendar, Home, Stats, Home, Trophies, Home, Money, Home, More,
Home – 15 cycles): used heap 3.9 → 4.6 → 5.3 → 5.8 → 5.9 MB at cycles 0/1/5/10/15, listeners 48
throughout, `Nodes` 707 throughout (identical on mobile). The growth flattens and GC returns it;
no leak. (`JSEventListeners` climbed to 251 during the first screen tour because the tour also
mounted the Money/History/Shop panels once; it returns to 48 after GC.)

Service worker (ordinary dist on :5842): first visit, `Tap to start` at 216 ms desktop / 307
mobile while the worker installs 356 entries in ~4.2 s from localhost; reloads served by the
worker: tappable at 91–110 ms desktop, 156–158 ms mobile (FCP 24–36 / 60–64 ms), 34 requests.

Findings:

- **P-10 (P3, S)** Match playback at ×4 keeps the main thread 71 % busy under 4× throttle (row 6).
  No frame drops were observed here; this is the one place a genuinely slow phone would show them.
  Measure on the owner's device before spending anything.
- **P-11 (verified, no action)** No leak: heap flat over 100 weeks and 15 screen cycles; listener
  count constant.
- **P-12 (P3, XS)** The boot's one long task on mobile (104–119 ms, tap → Home) is the first
  Home render plus the tour briefing dialog; below the 200 ms responsiveness line, nothing to do.

## E. Tests and gates

**⚠ EVERY NUMBER IN THIS SECTION WAS RE-TAKEN AT 20318e65 ON A QUIET MACHINE**, 17:14–17:23 on
5 September, ambient load 3.99 before the chain started and `pgrep -lf "vitest|vite-node|playwright"`
empty. The section the predecessor lane left behind was measured at 98e3560b between 09:09 and 09:24
with four other review lanes on the machine, and two of its readings were contention rather than
cost – both are kept below as the control, because the pair is the finding. Script and raw output:
`…/scratchpad/rv36-P2/gate-round2.sh` → `gate2.log`, `g2-*.out`, `unit2.json` + `unit2.log`.
Every exit code below was echoed by the command into a file and read back from the file, never
through a pipe and never from a background notification.

`npm run check` = context:audit → doc-facts → engine-purity → pins:check → decisions:check →
map:world:check → tools:registry:check → `vue-tsc -b --force` → check:tools → `node
scripts/units.mjs` → test:component → `vite build`. Each step timed on its own:

| step | wall (quiet, 20318e65) | exit | output | 98e3560b under load |
|---|---|---|---|---|
| context:audit | 0.5 s | 0 | 110 lines / 9.3 kB (compact default with a `--verbose` hint) | 0.6 s |
| doc-facts | 0.0 s | 0 | 1 line | 0.1 s |
| engine-purity | 0.1 s | 0 | 1 line | 0.1 s |
| pins:check | 0.2 s | 0 | 7 lines | 0.2 s |
| decisions:check | 0.1 s | 0 | 5 lines | 0.2 s |
| map:world:check | 0.4 s | 0 | 5 lines | 0.5 s |
| tools:registry:check | 0.2 s | 0 | 5 lines | 0.3 s |
| `vue-tsc -b --force` | **7.7 s** | 0 | – | 10.1 s |
| *(control, not in `check`)* a second `vue-tsc -b`, what CI's `npm run build` repeats | 0.4 s | 0 | incremental, `.tsbuildinfo` warm | 0.5 s |
| check:tools (`vue-tsc -p tsconfig.tools.json`) | 2.7 s | 0 | 4 lines | 3.2 s |
| **`node scripts/units.mjs`** | **367.5 s** | **0** | **15 lines / 646 bytes** | 238.9 s *(a different shape – see below – and exit 1)* |
| test:component | **39.5 s** | **0** | 1,296 lines / 94.3 kB | **81.2 s, exit 1, four timeouts** |
| `vite build` | 2.9 s | 0 | 29 lines | 3.3 s |
| **`npm run check`, total** | **421.8 s = 7 min 02 s** | 0 | | |

The unit project is **87 % of the gate** (367.5 of 421.8 s). Everything else together – seven doc
gates, two typechecks, the component suite and the production build – is 54 s.

**Steps that repeat work.** Four, and only one of them is worth money:

1. **The unit project is run in two shapes and the gate takes the dear one.** `scripts/units.mjs`
   runs a `bulk` pass with the 13 `HEAVY_UNIT_FILES` excluded, then those 13 **one vitest process at
   a time**. Measured here, same tree, same machine, minutes apart: bulk **149 s** for 216 files /
   4,217 tests, then the 13 heavy files for **219 s** (25, 8, 12, 10, 15, 14, 20, 19, 14, 25, 21, 18,
   18 s – the script prints each). 149 + 219 = 368 s, and the script agreed: `unit: green in 367s`.
   The **same 231 files in one pool take 154.9 s** (`npx vitest run --project unit`, exit 0, quiet).
   So the serialisation costs **213 s – 2.4× the run** – and nine of ten cores idle for 219 s of
   every gate by construction. It is not waste: the headers of `scripts/units.mjs` and
   `scripts/heavy-tests.mjs` document five separate incidents in which a heavy file crossed birpc's
   unraisable 60 s reporter wall, and every one of them was **CI's two cores**. The bar is a
   two-core runner; the local machine has ten. See P-13.
2. **`check:tools` typechecks `src` a second time.** `tsconfig.app.json` includes `src/**`,
   `tests/**` and 33 named `tools/*.ts` files; `tsconfig.tools.json` includes all 185 of `tools/`,
   and 181 of them import from `../src/`. So the second program re-reads the engine, and 33 files sit
   in both. Cost of the whole repeat: **2.7 s.** Recorded so nobody re-derives it – see P-19.
3. **`vue-tsc -b --force` (7.7 s) then `vite build` (2.9 s)** parse the same graph with two different
   tools. Unavoidable locally. CI adds a third pass by calling `npm run build` after its own forced
   `vue-tsc`; the control above prices that repeat at **0.4 s** on a warm `.tsbuildinfo`.
4. **`tests/goldenSaves.test.ts` walks the golden corpus three times** – once spread over 71
   per-fixture tests, then twice more inside two single `it`s. See P-14.

### The unit project

One invocation, JSON reporter, every file in one pool, quiet machine, 20318e65:
**231 files, 4,574 tests, 4,574 passed, 0 failed, wall 154.9 s, exit 0.** Sum of test durations
1,191 s across the pool, so the pool is getting ~7.7× parallel speed-up on a 10-core box.

The number the owner actually pays is the **gate** shape, not this one: **`node scripts/units.mjs`
= 367.5 s.** The 2 September note that `check` is «~7 minutes (429 s on a quiet machine)» reproduces
almost exactly at **421.8 s**.

**The 20 slowest tests.** The unit project's per-test ceiling is `testTimeout: 20_000`
(vite.config.ts:344). Flagged **AT RISK** at 8 s – a test past 8 s has under 2.5× of headroom, and
this project's own measurements put the pool's contention penalty at **1.6–2.9×** (heavy-tests.mjs
measured ×2.9 on 26.08 and ×2.06 on 02.09; the two runs here read ×1.6). The 20 s ceiling has
already fired twice on green code: `goldenSaves` on 27.08 (red four times on `check`, zero assertion
failures) and `prologue-handover > the same girl, raised two ways` on CI on 02.09.

| # | quiet | contended | file :: test |
|---|---|---|---|
| 1 | **16.1 s** ⚠ | 23.7 s | `tests/kidLife.test.ts` :: a real career – the Snapshot carries all three tiles, and they change between 14 and 17 |
| 2 | **12.7 s** ⚠ | 21.4 s | `tests/economy.test.ts` :: economy calibration – 52-week net burn … ordering: the top of the ladder burns |
| 3 | **11.7 s** ⚠ | 17.1 s | `tests/season-mirror.test.ts` :: the season mirror – captured at entry, never reconstructed |
| 4 | **11.0 s** ⚠ | 14.7 s | `tests/blocking-overlay.test.ts` :: ⭐⭐ the two clocks became one – round-17 #7 is closed |
| 5 | **10.8 s** ⚠ | 19.6 s | `tests/radar-read.test.ts` :: radar – the estimate does not shimmer |
| 6 | **10.5 s** ⚠ | 14.5 s | `tests/plan.test.ts` :: §2 a career saved under the old single-number plan reads back as itself |
| 7 | **10.2 s** ⚠ | 16.1 s | `tests/goldenSaves.test.ts` :: ⭐⭐⭐⭐ v61: no migrated save carries a college quote's `open` flag |
| 8 | **10.2 s** ⚠ | 18.0 s | `tests/goldenSaves.test.ts` :: ⭐⭐⭐⭐ v62: every migrated save carries a peak physical |
| 9 | **10.1 s** ⚠ | 16.5 s | `tests/round27-call-up-flow.test.ts` :: #6 the invitation is posted before the tie, and it is exact |
| 10 | **9.2 s** ⚠ | 12.1 s | `tests/radar.test.ts` :: radar – the fog is an honest claim |
| 11 | **9.1 s** ⚠ | 13.4 s | `tests/round26-world-speaks.test.ts` :: round 26 #5b – the prize row says where the missing money went |
| 12 | **9.1 s** ⚠ | 14.6 s | `tests/economy.test.ts` :: … working (budget coach) lands in the band |
| 13 | **8.6 s** ⚠ | 11.8 s | `tests/endings-bench.test.ts` :: the endings bench – the pinned N is the one the sweep supports |
| 14 | **8.5 s** ⚠ | 13.9 s | `tests/college-league.test.ts` :: the floor – every college year holds a student tournament |
| 15 | **8.5 s** ⚠ | 12.2 s | `tests/season/domestic-nation.test.ts` :: round 23 #10 – the VS card is where he actually reads it |
| 16 | 7.6 s | 11.4 s | `tests/travel-home.test.ts` :: ui/travel-set – her first trip abroad is a trip abroad, and it happens once |
| 17 | 7.2 s | 15.9 s | `tests/coach-load.test.ts` :: the escalation ladder – a cheaper coach interrupts you MORE |
| 18 | 7.2 s | – | `tests/prologue-handover.test.ts` :: ⭐⭐ the same girl, raised two ways *(the test CI timed out on, 02.09)* |
| 19 | 7.2 s | – | `tests/round26-span-gate.test.ts` :: round 26 #1 – a quiet stretch offers NOTHING |
| 20 | 6.9 s | 15.9 s | `tests/college-birthday.test.ts` :: ROUND 26 #4 – the wallet does not touch it |

**15 of the 4,574 tests are over 8 s on a quiet machine. Under the contention of four review lanes
the same suite had 46.** Over 4 s: 64 quiet, 125 contended. Over 1 s: 302 quiet, 417 contended.
That spread *is* the risk: nothing in this list is slow because of a defect, and every one of them
is one busy machine away from the ceiling.

⚠ **Two readings I could not reconcile, recorded rather than smoothed over.** In the contended run
`kidLife`'s top test measured **23.7 s** and `economy`'s **21.4 s** – both above the 20 s ceiling –
and both were reported **passed**. So the recorded duration and the enforcement of the ceiling do
not line up exactly, and I did not establish the mechanism (both are long synchronous engine walks;
the two tests the ceiling *has* killed are the same shape). Treat 20 s as a soft edge, not a wall,
and treat the 8 s line as the real one.

**The 10 slowest files** (quiet; every one of these is test time – the gap column is zero
everywhere but one file, see the collect phase below):

| file | wall | tests | n | in `HEAVY_UNIT_FILES`? |
|---|---|---|---|---|
| `tests/college-birthday.test.ts` | 42.4 s | 42.4 s | 18 | yes |
| `tests/economy.test.ts` | 41.5 s | 41.5 s | 37 | yes |
| `tests/coach-travel-edge.test.ts` | 38.6 s | 38.6 s | 13 | yes |
| `tests/travel-home.test.ts` | 31.9 s | 31.9 s | 33 | yes |
| `tests/coach-travel-edge-older-schemas.test.ts` | 31.9 s | 31.9 s | 10 | yes |
| `tests/goldenSaves.test.ts` | 31.0 s | 31.0 s | 75 | yes |
| `tests/ladder-floor.test.ts` | 30.1 s | 30.1 s | 28 | yes |
| `tests/season-mirror.test.ts` | 25.9 s | 25.9 s | 16 | **no** |
| `tests/viz/commentary.test.ts` | 25.0 s | 25.0 s | 42 | **no** |
| `tests/round23-kid-share.test.ts` | 23.7 s | 23.7 s | 14 | **no** |

(Then `round26-world-speaks` 23.7 s, `college-second-act` 22.9 s and
`round34-reachable-ceiling` 22.6 s – also not on the heavy list. `heavy-tests.mjs` names
`season-mirror`, `viz/commentary`, `round23-kid-share`, `college-second-act` and
`round26-world-speaks` in its 26.08 sweep and then deliberately did **not** promote them, because the
in-pool ranking that produced them "described this laptop rather than CI". That call stands; the
files are listed here so the next reader does not think they were missed.)

**The collect phase is not a cost here, with one exception that is a whole file.** Across 231 files
the total gap between file wall and the sum of its test durations is **22.3 s**, the median is
**0.0 s**, and **one file accounts for 22.0 s of it**: `tests/round34-reachable-ceiling.test.ts`,
22.0 s of a 22.6 s wall. It is not collect – it is a single synchronous `beforeAll` at
`tests/round34-reachable-ceiling.test.ts:390` that walks **five coach rungs × 780 weeks of
`tickWeek`** before the file's 15 tests run. The same file read a 31.2 s gap of a 32.2 s wall in the
contended run. That work appears in **no** slowest-test list, is attributed to no test by the
reporter, and no per-test timeout covers it. See P-15.

**test:component: 39.5 s, exit 0, 126 files / 1,459 tests, all green.** Vitest's own phase
accounting (summed across workers): transform 5.28 s, collect 65.82 s, tests 242.90 s, environment
17.23 s, prepare 4.97 s – so **collect is 20 % of the CPU this project burns**, which is what
mounting real SFCs with `css: true` costs.

⚠ **And the predecessor's red component run was contention, not a defect – confirmed.** At 09:18,
with four lanes on the machine, `test:component` took **81.2 s and exited 1** with **four failures,
every one of them `Error: Test timed out in 5000ms`, zero assertion failures**, in
`prologue-handover`, `round21-school-cutoff` (×2) and `round35-shop`. All four pass here in a run
that is **2.1× faster overall**. This is the exact shape CLAUDE.md's contention note describes, and
the reason it bites the component project rather than the unit project is P-16.

Context volume (context:audit, this tree): 357 Markdown files, 115,411 lines, ~1,955,992 tokens –
up from ~1,792,850 on 2 September (+9 %); the largest single documents remain `round-29.md` (~61k
tokens), `decisions.md` (~49k) and now `round-34.md` (~41k). **Re-read at 20318e65 hours later:
362 files, 117,550 lines, ~2,016,681 tokens** – the corpus crossed two million on the same day,
and the five files and ~61k tokens between the two readings are this review's own five documents.

Findings:

- **P-13 (P1, S) – the unit gate spends 219 s of its 367 s running thirteen files one at a time on a
  ten-core machine, and that is the single biggest number in `npm run check`.** Measured on the
  same tree, minutes apart: bulk 149 s (216 files, 4,217 tests) + the 13 `HEAVY_UNIT_FILES` at 8–25 s
  each, strictly serially, 219 s = 367 s; the same 231 files in one pool, 154.9 s, exit 0. The
  serialisation is **not** waste – `scripts/units.mjs` and `scripts/heavy-tests.mjs` document five
  incidents of birpc's unraisable 60 s reporter wall, and every one of them was **CI's two cores**.
  The change: give `run()` in `scripts/units.mjs` a **bounded concurrency** for the heavy loop –
  `Math.max(1, Math.floor(os.availableParallelism() / 3))`, so a 2-core runner keeps today's strict
  serialisation (1) and a 10-core Mac runs 3 at a time. Nothing about the bulk pass, the retry, the
  stall classifier or the file lists moves. Expected: heavy tail 219 s → ~80 s, unit gate 367 → ~230 s,
  `check` 422 → ~285 s. **Prove it with the numbers the script already prints:** every heavy shard's
  own seconds must stay under ~30 s (the wall is 60 s, and 25 s is today's worst), `unit: green in
  Ns` three runs in a row, and zero `stalled` classifications. If any shard crosses 30 s, the divisor
  is wrong and the honest answer is the one heavy-tests.mjs gives: fewer workers per core, measured.
- **P-14 (P2, S) – `tests/goldenSaves.test.ts` walks the golden corpus three times, and two of those
  walks are billed to a single `it` each.** The file is 31.0 s quiet over 75 tests. Of that, the 71
  per-fixture tests are **10.6 s** (median 8 ms each) and the two `⭐⭐⭐⭐ v61` / `⭐⭐⭐⭐ v62` sweeps at
  `tests/goldenSaves.test.ts:189` and `:223` are **20.4 s – 66 % of the file, in two tests** – because
  each does its own `for (const file of FILES) migrateSave(load(file))` over all 71 fixtures. Those
  two tests are #7 and #8 in the slowest-test table, and this is the file the 20 s ceiling has already
  killed (27.08, red four times on `check` with zero assertion failures). The change: migrate the
  corpus **once** – `const MIGRATED = FILES.map((f) => [f, migrateSave(load(f))] as const)` beside
  `FILES` at :17 – and have all three consumers read it. Prove with the two sweeps' durations in a
  `--reporter=json` run (10.2 s each → under 0.5 s) and the file's solo wall from `units.mjs`'s own
  print (18 s → ~7 s). Note it moves ~10 s from test time into collect, which is the right side of
  the ceiling but not free: check the file's `gap` column afterwards.
- **P-15 (P2, XS) – 22.0 s of `tests/round34-reachable-ceiling.test.ts`'s 22.6 s is one synchronous
  `beforeAll` that no timeout guards and no report attributes.** The hook at
  `tests/round34-reachable-ceiling.test.ts:390` walks five coach rungs × 780 weeks of `tickWeek`
  before the file's 15 tests start. It is the only file in 231 whose collect/hook gap exceeds 0.5 s,
  it read 31.2 s under contention, and it appears in no slowest-test list because vitest attributes
  hook time to no test. By the project's own bar – *"a file near 40 s in-pool locally is past birpc's
  unraisable 60 s window at CI's ~1.9×, so the line sits at ~32 s in-pool"*, `scripts/heavy-tests.mjs`
  – its 32.2 s in-pool reading is **on that line**. The change: add
  `'tests/round34-reachable-ceiling.test.ts'` to `HEAVY_UNIT_FILES` in `scripts/heavy-tests.mjs`, with
  the same comment shape as the entries above it. Prove with the method that file prescribes:
  `TB_UNIT_SKIP_HEAVY=1 npx vitest run --project unit --reporter=json` for the in-pool number and one
  solo run for the ratio. (Do this **after** P-13, or it lengthens the serial tail it is meant to
  protect.)
- **P-16 (P2, XS) – the component project has no `testTimeout`, so it runs at vitest's default 5 s
  while the unit project has 20 s, and that is why contention reddens `test:component` first.** The
  project literal at `vite.config.ts:442-455` sets `name`, `include`, `environment` and `css` and
  nothing else. Under four lanes the gate failed with four `Test timed out in 5000ms` and zero
  assertion failures; the same four pass at well under a second on a quiet machine. Mounting an SFC
  with `css: true` through the real cascade is exactly the work that stretches under load – vitest's
  own accounting puts 20 % of this project's CPU in collect. The change: add a measured `testTimeout`
  to that project literal, and carry the same reasoning the unit project's 20 s already carries at
  `vite.config.ts:336-344` (*"what 5000ms actually enforced was 'no test may be unlucky'"* – the
  identical argument, one project over). Prove it by re-running `npm run test:component` with three
  agents working: today it goes red on timing, after it should not, and the slowest component test's
  own duration (0.44 s quiet) says how much headroom was bought.
- **P-17 (P3, XS) – every mounted component that plays a sound opens a real TCP connection to
  `127.0.0.1:3000`, and the failures are 37 % of the component gate's output.** `src/audio/sfx.ts:155`
  does `await fetch(url, { method: 'HEAD', cache: 'no-store' })` as an existence probe; under
  happy-dom the base URL is `http://localhost:3000/`, so the probe becomes a socket. Measured: **18
  `AggregateError` blocks (`connect ECONNREFUSED ::1:3000` / `connect ETIMEDOUT 127.0.0.1:3000`)
  occupying 474 of the run's 1,296 output lines**, from 17 distinct component test files. The app
  itself is fine – `probe()` catches and records the file as failed – so this is log noise plus a
  connect attempt per mount, and it gets slower, not faster, when something *is* listening on 3000.
  The change: alias `src/audio/sfx.ts` to a stub in the component project's existing `resolve.alias`
  block (`vite.config.ts:435-441`, which already stubs `virtual:pwa-register` the same way). Prove
  with `npm run test:component 2>&1 | grep -c AggregateError`: 18 → 0, and the output back to ~820
  lines.
- **P-18 (P3, XS) – `--verbose` in CI buys nothing on a green run and ~571 KiB of log on a red one.**
  `.github/workflows/ci.yml:138/152` pass `--verbose` to `scripts/units.mjs`, which selects vitest's
  `default` reporter instead of `dot`. But `once()` in that script runs the child with
  `stdio: ['ignore','pipe','pipe']` and **buffers the output, printing it only when the shard fails or
  stalls** – so on green both reporters produce the identical 15 lines / 646 bytes measured above.
  On a red bulk shard the buffer is echoed in full: derived from the 4,217 bulk test names in
  `unit2.json` at the default reporter's line shape, that is **~571 KiB** (whole project ~618 KiB)
  of passing-test lines ahead of a failure section the `dot` reporter prints anyway. The change: drop
  `--verbose` from both `ci.yml` lines. Prove with the byte size of the CI job log on a deliberately
  reddened shard.
- **P-19 (P3, XS – recorded, not recommended) – `check:tools` typechecks `src` a second time, and it
  costs 2.7 s.** `tsconfig.app.json` includes `src/**`, `tests/**` and 33 named `tools/*.ts`;
  `tsconfig.tools.json` includes all 185 `tools/*.ts`, of which 181 import `../src/`. Removing the 33
  duplicated names from `tsconfig.app.json`'s `include` is an XS change and would save a fraction of a
  second; making `tsconfig.tools.json` a project reference would save more and is a build-graph change
  for 2.7 s of a 422 s gate. **Neither is worth doing** – this entry exists so the next reader
  who spots the overlap does not spend an afternoon re-deriving its price. Prove, if ever wanted, with
  `vue-tsc -p tsconfig.app.json --listFiles | wc -l` before and after.
- **P-20 (verified, no action) – the gate's headline number is honest.** The 2 September claim that
  `check` is «~7 minutes (429 s on a quiet machine)» reproduces at **421.8 s** at 20318e65, and every
  one of the 12 steps exits 0. Neither red reading from the earlier lane survived a quiet re-run:
  `test:component` 81.2 s / exit 1 → **39.5 s / exit 0**, and the whole-project JSON run 238.9 s /
  exit 1 (every test green – the all-green-non-zero shape `scripts/lib/stall.mjs` is written about)
  → **154.9 s / exit 0**. Both were the machine, exactly as CLAUDE.md's contention note predicts,
  and neither is a defect in the branch.

## Since the 2 September review

| claim (2 September) | status now | evidence |
|---|---|---|
| CI repeats typechecking (QA-40): forced `vue-tsc` then `npm run build` typechecks again | **Still true, but cheap.** `.github/workflows/ci.yml:101` runs `npx vue-tsc -b --force`, `:125` runs `npm run build` = `vue-tsc -b && vite build`. Locally `check` calls `vite build` directly | The repeat is incremental: 10.1 s forced, 0.5 s second run on a warm `.tsbuildinfo`. The fix (call `vite build` in CI) is still XS; the saving is ~1 s of runner time, not a minute |
| Unit shards use `--verbose`; quiet by default | **Still true in CI, and it costs nothing until something goes red.** `ci.yml:138/152` run `node scripts/units.mjs --only=bulk\|heavy --verbose`; local `test:quiet` is the dot reporter | **Measured on a green gate run: 15 lines / 646 bytes, and the reporter flag does not change it** – `once()` in `scripts/units.mjs` buffers the child with `stdio: ['ignore','pipe','pipe']` and prints one verdict line per shard, echoing the buffer only on a failure or a stall. On a **red** shard the flag is the whole cost: derived from the 4,217 bulk test names in `unit2.json` at the default reporter's line shape, **~571 KiB** of passing-test lines (whole project ~618 KiB, mean 138 B/test) ahead of a failure section `dot` prints anyway. See P-18. ⚠ The CLAUDE.md figure «5.6k chars vs 29k» does not reproduce on a green run at this commit – on the evidence it described a run that echoed a shard's buffer, and neither number is the green-run volume |
| Context volume is a first-class delivery cost (~1.79 M tokens) | **Grew 9 %** to ~1.96 M tokens / 357 files | `context:audit` output above; the compact default report (110 lines) recommended then has landed |
| The engine/protocol boundary is healthy | **Confirmed with numbers** | Snapshot 97 kB, 0.41 ms to clone, one post per command, 6 ms to make durable, 2.5 ms to load; the cost is `toSnapshot`'s derivation (P-05), upstream of the boundary |
| `check` is ~7 minutes (429 s on a quiet machine, scripts/e2e.mjs header) | **Confirmed to within 2 %: 421.8 s = 7 min 02 s**, all 12 steps exit 0, at 20318e65 on a quiet machine (ambient load 3.99, nothing else running) | The per-step table in §E sums to 421.8 s. **The unit project is 367.5 s of it – 87 %**; the other eleven steps together are 54.3 s. Of the unit project's own 367.5 s, **219 s is thirteen files running one at a time** (P-13), which is the only step in the gate where a change is worth minutes rather than seconds |

## What is good

- The engine is bounded by construction: results windowed to ~2,200 rows, events capped at 400,
  cohort 199 – the week tick is 5.3 ms at week 52 and 6.4 ms at week 516, and a 52-week dev tick is
  179–240 ms in the browser with autosave and render included.
- The load path is O(1) as promised in v35: 2.5 ms for sha256 + gunzip + parse + migrate of a
  466 kB world; `migrateSave` 0.6–0.8 ms on a current save.
- The boundary is cheap: one 97 kB snapshot per command, 0.41 ms to clone, 5,517 nodes; the UI's
  deep-reactive wrap costs 1.4 ms per full traversal and screens read slices.
- The UI is light: 91–348 DOM nodes per screen, every switch under 20 ms of task time on desktop
  and under 65 ms at 4× throttle, zero long tasks on every screen in both modes.
- No leak: heap 5.9 → 6.4 → 6.4 MB after GC over 100 weeks, listeners 48 → 52, `Nodes` constant
  over 15 screen cycles.
- Boot: tappable at 200 ms desktop / 302 ms mobile-throttled cold, 91–110 / 156–158 ms from the
  service worker; FCP and LCP coincide at 132 ms on mobile.
- The match engine: 0.10 ms per match, 1.19 M points/s; the calibration gate has 2.3× headroom.
- The doc gates are cheap and quiet: seven scripts, 2.0 s, 110 lines for the largest.
- The precache is revision-keyed and de-duplicated; a second visit makes 34 requests and none for
  art.
