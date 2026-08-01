<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P9 – Quality Infrastructure Wave: component tests, lint, coverage, asset diet, release discipline

One-line: Gives the UI layer its first mounted tests, the repo its first linter and coverage report, cuts ~1MB off the PWA install, gives audio an offline story, and ties versions/tags/CHANGELOG/build-id to the save schema – six hygiene items, one wave, zero engine changes.

**Priority:** Tier 4 – platform hygiene · **Effort:** L (2-5d) · **Risk:** low

## Why (problem)

Six verified gaps, all review-confirmed and re-checked against the code at `b7a9358`:

1. **No Vue component is ever mounted.** package.json devDeps (package.json:27-37) contain no @vue/test-utils, happy-dom or jsdom; the vitest environment is `node` (vite.config.ts:117). The entire UI – MatchViewer.vue (2,235 lines), all 10 screens – is guarded by regex pins over SFC source text; 45 of 73 root test files call `readFileSync` on source, and 334 `RE-AIMED`/`RE-PINNED` annotations record the maintenance tax (review 07 HIGH + MEDIUM). tests/screen-i-live-match.test.ts:53 pins the prose comment `REPLACES the point log`; line 64 pins exact attribute order. A thrown error in a screen's `setup()` passes the whole suite and both CI gates.
2. **No linter.** The only static gate is strict vue-tsc (review 07 MEDIUM, review 02 LOW). This proposal ran a real dry run (ESLint 9 + typescript-eslint recommended + eslint-plugin-vue flat/essential, from a scratch install, repo untouched) over src/ tools/ scripts/ tests/: **7 problems (6 errors, 1 warning)** – including one genuine bug-class catch, `vue/return-in-computed-property` at WeekRecapCard.vue:106 (a `switch` on `s.kind` with no default – implicit `undefined` the day a new scene kind is added). Four of the six errors are deliberate `_`-prefixed unused args that an `argsIgnorePattern` config absorbs. Adoption cost is a 15-minute diff, and it only stays that cheap while the codebase is this clean.
3. **No coverage measurement.** With world.ts at 5,521 lines and diary.ts at 2,814, which branches the 2,054 tests reach has never been measured (review 07 MEDIUM).
4. **GitLab CI never runs calibration.** .gitlab-ci.yml's test job runs `npm test` = the unit project only; the sim project (HEAVY_SIM_FILES, vite.config.ts:47-51) runs solely in .github/workflows/simulation.yml. Nobody has written down whether that asymmetry is a decision or an accident (review 07 MEDIUM).
5. **Install bloat and no audio cache.** Precache is 3.43MB, of which the five icon PNGs are 1,244K measured on disk (pwa-512 516K, maskable-512 358K, logo-lucia-app 209K, pwa-192 85K, apple-180 75K) – more than all app code (review 06 MEDIUM, vite.config.ts:77). `logo-lucia-app.png` has **zero consumers** in src/ or index.html (grep) – it precaches for nothing. Meanwhile theme.mp3 (2.5MB) and sounds/ (472K) have no cache story at all: mp3 is absent from globPatterns (vite.config.ts:77) and the only runtime route matches `/images/*.webp` (vite.config.ts:101-112) – music silently re-fetches and dies offline (review 06 LOW).
6. **Zero release discipline.** Version 0.1.0 across 542 commits, no git tags, no CHANGELOG, no build id anywhere; the More screen's About table (MoreScreen.vue:466-488) shows save schema and seed but nothing a bug reporter could quote to name a build (review 08 MEDIUM). The only version that moves is `SAVE_SCHEMA_VERSION = 34` (world.ts:177).

## What (proposed change)

Six sub-packages under one branch (per the one-branch-per-wave CI-minutes rule):

- **(a) Component test layer.** Third vitest project `component` (happy-dom + @vue/test-utils), five seed tests aimed at review-found bug classes: dialog focus/Escape (P8's spec), money-format rendering (P6's guard), App.vue badge watermarks, store error surfacing, MatchViewer mode switching. Explicit rule: **no DOM snapshot tests** – the source-pin corpus already demonstrates what volume-brittleness costs (review 07 MEDIUM); snapshots are the same failure with more surface. Chosen over jsdom: happy-dom is faster, vitest-first, and MatchViewer's null-ctx guard (MatchViewer.vue:520) means no canvas polyfill is needed.
- **(b) ESLint flat config**, correctness-only, aligned with "boring TS" (docs/decisions.md:37): typescript-eslint recommended + vue flat/essential, `no-console` (src only), `no-explicit-any`, and **deliberately zero formatting/ordering rules** – `vue/attributes-order` or Prettier would invalidate source pins that match attribute order (tests/screen-i-live-match.test.ts:64). Wired into `npm run check` and both CI test jobs.
- **(c) Coverage, report-only.** @vitest/coverage-v8 over unit+component projects, **no thresholds** – first make the engine/UI asymmetry visible (engine high, components 0% today), then argue about floors.
- **(d) Documented decision: calibration stays GitHub-only.** GitLab CI minutes are quota-rationed by the project's own working rules; simulation.yml already runs weekly + on dispatch. Write the decision where it lives instead of leaving the asymmetry ambiguous. Runner-up (if the owner wants a net): a path-filtered GitLab job on src/engine/match/** – not proposed now.
- **(e) Asset diet.** Palette-quantize the icons inside scripts/gen-icons.mjs (sharp is already the pipeline). **Measured on the real five files with the repo's own sharp: 1,244K → 326K (-74%)**, visually clean at 512px. Delete the consumer-less public/logo-lucia-app.png. Add a `CacheFirst` runtime route for mp3 with expiration and range-request support; keep mp3 out of precache.
- **(f) Release discipline.** Version policy tied to SAVE_SCHEMA_VERSION, git tags per deployed wave, CHANGELOG.md seeded from the merge history, `__BUILD_ID__` (git SHA + date via Vite define) rendered in More → About, and a small mechanical test that stops a schema bump landing without release paperwork.

## How (implementation sketch)

**Cross-cutting invariants first:** no engine file is touched; MAIN-stream draw count is untouched (frozen capture 41550/e6b0c709 suites must stay green as proof); `SAVE_SCHEMA_VERSION` stays 34 (world.ts:177) so **no migration and no new golden fixture**.

**(a) Component project**
1. `npm i -D @vue/test-utils happy-dom` (majors compatible with vitest ^3.2).
2. vite.config.ts: append a third project `{ extends: true, test: { name: 'component', include: ['tests/component/**/*.test.ts'], environment: 'happy-dom' } }`. `extends: true` inherits the root `vue()` plugin, which is what compiles SFCs – the sim project's no-extends warning (vite.config.ts:196-199) explains the trap.
3. **Critical:** add `'tests/component/**'` to the unit project's `exclude` (vite.config.ts:169) – the root `include: ['tests/**/*.test.ts']` (vite.config.ts:118) would otherwise pull the new files into the node-env unit project and fail on `document`.
4. Seams, no new fixture formats: worker is created lazily (`ensureWorker`, src/worker/client.ts:15-17), so mounting with a pre-filled store spawns nothing; tests that dispatch actions `vi.mock` `src/worker/client.ts` and stub `request` with canned protocol replies. Store state = real Pinia (`createPinia` + `setActivePinia`) with `game.snapshot` built exactly as unit tests already build worlds: `createWorld(seed, profile)` (world.ts:3987) + `tickWeek(world, rngFromSeed(world.seed))` (world.ts:4171) + `toSnapshot(world)` (world.ts:5259). Deterministic, no JSON blobs.
5. Five seed files, each named for the bug class it guards:
   - `tests/component/dialog-a11y.test.ts` – mount ConfirmDialog.vue (today a plain div, ConfirmDialog.vue:19; review 05 MEDIUM): `role="dialog"`, `aria-modal`, initial focus, Escape emits `cancel`, overlay click-self cancels. This file is **P8's executable spec** – red until P8 merges.
   - `tests/component/money-render.test.ts` – mount MoneyScreen + WeekRecapCard with a snapshot of known `fundsCents`; assert the rendered dollar strings equal the shared/format.ts contract output. Kills the `formatDollars(cents)` vs `formatDollars(dollars)` x100 trap (MoneyScreen.vue:105 vs six cents-taking siblings, review 02 HIGH). Lands red-then-green with P6.
   - `tests/component/app-badges.test.ts` – mount App.vue with the mocked client: the seen-watermark pattern (4 copies: App.vue:220-234 Season, 242-261 This-week, ~397-442 News, ~444-502 Trophies, review 02 MEDIUM) – dot shows when a fresh event outruns the stored watermark, clears on tab visit, keys are per-career (`weekSeenKey()`, App.vue:242). Behavior-pinning, green immediately; survives the review's proposed `useSeenWatermark` extraction unchanged – that is the point.
   - `tests/component/store-error-surfacing.test.ts` – mock `request` to reject, drive MoreScreen's import path, assert the failure is user-visible. Today only 4 of 10 screens render `game.error` (funnel at stores/game.ts:41-51; HomeScreen.vue:589 is one; review 05 MEDIUM). To give the test a green target, include the review's own 5-line fix: render `game.error` once in App.vue in the existing toast idiom with `aria-live="assertive"` (review 05 recs 3-4). If another accepted proposal owns error centralization, drop the App.vue edit here and co-land the test there.
   - `tests/component/match-viewer-modes.test.ts` – mount MatchViewer (`mode='replay'`) on a `simulateMatch`+`annotateMatch` fixture (the exact recipe of MatchReplay.vue:10-27, seeded). happy-dom's `getContext` returning null is safe: `render()` early-returns (MatchViewer.vue:520) and mount guards it (737-741). Drive `viewMode` through its computed control (MatchViewer.vue:1137-1139): assert `skip` jumps to the finished box score (`resetPlayback` skip arm, 709-711), switching back restarts playback state, and commentary beats never render ahead of `displayedPointIndex` – the invariant the source pin at screen-i-live-match.test.ts:49 can only pin as text.
6. package.json: `"test:component": "vitest run --project component"`; extend `"check"` to `vitest run --project unit --project component`; add the step to ci.yml (after `npm test`) and .gitlab-ci.yml's test job (seconds of quota).

**(b) ESLint**
1. `npm i -D eslint typescript-eslint eslint-plugin-vue`.
2. Root `eslint.config.mjs`: `tseslint.configs.recommended` + `pluginVue.configs['flat/essential']`; `.vue` files get `parserOptions.parser = tseslint.parser`. Rule deltas: `no-console: 'error'` (off for tools/**, scripts/**, they log by design), `@typescript-eslint/no-explicit-any: 'error'` (src is already clean, review 02), `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'` (house convention: `_profile` world.ts:612, `_priority` commentary.ts:586), `vue/multi-word-component-names: 'off'` (Card/Eyebrow/Polaroid in src/components/ui are deliberate kit names). **No stylistic or ordering rules, no Prettier** – autoformat would churn attribute order and whitespace that 45 source-pin test files match against.
3. Baseline is measured, not estimated: 7 problems at b7a9358 under exactly this config; after the `^_` pattern, the real cleanup is three lines – WeekRecapCard.vue:106 gets an explicit exhaustive return, tests/art/preload.test.ts:141 loses its console call (or gets a scoped disable with reason), tests/pwa-update.test.ts:56 drops a stale disable directive.
4. `"lint": "eslint src tools scripts tests"`, added to `"check"`, ci.yml and .gitlab-ci.yml. Fix-on-save: one paragraph in docs/decisions.md – editor `fixAll.eslint` on save is safe **because** no formatting rules exist; that is a property to preserve, not an accident.

**(c) Coverage**
1. `npm i -D @vitest/coverage-v8` (same minor as vitest).
2. `"coverage": "vitest run --project unit --project component --coverage"` – the sim project is excluded on purpose: 143s of Monte-Carlo CPU adds no branch insight.
3. vite.config.ts `test.coverage`: `provider: 'v8'`, include `src/**`, exclude tools/tests. No thresholds, not in CI – report-only. Paste the first run's headline table (engine vs components vs stores) into the PR; expect engine files high and every .vue at 0% until (a) grows – that asymmetry is the finding, in numbers.

**(d) GitLab sim decision**
One dated entry in docs/decisions.md + a header paragraph in .gitlab-ci.yml: calibration runs on GitHub only (simulation.yml, weekly + dispatch); GitLab's job is Pages deploy honesty on the unit gate; rationale is the CI-minutes quota and zero added signal from duplicating a deterministic statistical sweep. Note the runner-up (path filter on src/engine/match/**) so the door is visibly open, not forgotten.

**(e) Icons + audio**
1. scripts/gen-icons.mjs: add one `quantize(buf)` helper – `sharp(buf).png({ palette: true, quality: 80, effort: 10 })` – and pipe the returns of `roundedSquareIcon` (gen-icons.mjs:51), `maskableIcon` (:69) and `circleIcon` (:87) through it. Run `npm run icons`.
2. Expected sizes, measured on these exact files: pwa-512 516K→130K, maskable-512 358K→92K, pwa-192 85K→27K, apple-180 75K→23K; total icon share 1,244K→~271K after step 3.
3. `git rm public/logo-lucia-app.png` – zero references in src/ or index.html; its master is art-src/logo-lucia-app.png (gen-icons.mjs:33-37), which gen-icons reads and .gitignore protects. Precache drops ~3.43MB → ~2.5MB.
4. vite.config.ts runtimeCaching (beside the images route, :101-112): pattern `/\/(music|sounds)\/.*\.mp3$/`, handler `CacheFirst`, `cacheName: 'tb-audio-v1'`, `expiration: { maxEntries: 30, maxAgeSeconds: 60*60*24*60 }`, `cacheableResponse: { statuses: [0, 200] }`, and `rangeRequests: true` – Safari fetches `<audio>` via Range requests and will stall on a cached response without the range plugin. globPatterns (:77) stays mp3-free: 2.5MB must never enter install. The sfx HEAD probe (src/audio/sfx.ts:137) is unaffected – routes match GET. Re-encoding theme.mp3 320→128kbps (~2.5MB→~1.0MB) is flagged as a separate owner ear-check, not done in this wave.

**(f) Release discipline**
1. Policy entry in docs/decisions.md: minor bump per merged wave; any `SAVE_SCHEMA_VERSION` bump forces a version bump + a CHANGELOG entry naming the new schema and its migration; annotated tag `vX.Y.Z` on every main merge that deploys.
2. CHANGELOG.md (Keep-a-Changelog shape), seeded retroactively: `git log --merges --first-parent --format='%ad %s'` over the 542 commits – one-branch-per-wave means merges enumerate the waves – hand-edited to wave-level entries. Going forward: one entry per wave PR, written in the PR itself.
3. Build id: in vite.config.ts, `define: { __BUILD_ID__: JSON.stringify(sha + ' ' + date) }` with `execSync('git rev-parse --short HEAD')` in try/catch (fallback `'dev'` – CI checkouts have git, a tarball build must not die). Declare the global in src/vite-env.d.ts. Render one `Build` row in MoreScreen's About table (MoreScreen.vue:466-488), beside the existing `Save schema` row (:474-477).
4. `tests/release.test.ts` (house-style mechanical net): parse CHANGELOG.md, assert the top entry's version equals package.json `version` and mentions `schema v` + `SAVE_SCHEMA_VERSION` imported from world.ts. A schema bump without paperwork now fails a unit test, exactly like a bump without a golden fixture already does (goldenSaves.test.ts).

## Test plan

TDD order, with what proves each step:

1. **(a) harness red-first:** commit `tests/component/mount-sanity.test.ts` (mount ConfirmDialog, assert message renders) before the config change – `vitest run --project component` fails (no project); after deps + project land, green. Then prove isolation: `vitest run --project unit` file/test counts unchanged from the branch base (review 07 baseline: 88 files / 1,994 tests) – the unit project did not swallow tests/component/**.
2. **Seed tests in dependency order:** match-viewer-modes and app-badges first (pin current behavior, green now); store-error-surfacing red → App.vue strip → green; money-render and dialog-a11y land red as executable specs and go green with P6/P8 respectively (co-merge with those branches, never left red on main).
3. **(b)** config + 3-line cleanup in one commit; `npm run lint` exits 0; CI step green in the same PR run.
4. **(c)** one `npm run coverage` run; report generated, wall time < 60s (sim excluded), numbers pasted in PR.
5. **(e)** `npm run icons`; assert on-disk sizes within ~10% of the measured targets; `npm run build`; inspect dist/sw.js manifest – total ≤ 2.6MB, no logo-lucia-app.png entry; manual offline check: play theme once online, go offline, it still plays (range-cached), art route behavior unchanged.
6. **(f)** `tests/release.test.ts` red until CHANGELOG seeded, then green; build once with git and once with `PATH` stripped of git (fallback `'dev'`); More screen shows the Build row.
7. **Regression proof of the invariants:** goldenSaves.test.ts green (schema untouched); the frozen-capture suites (tests/knock.test.ts:126, tests/injuries.test.ts:55, tests/condition.test.ts, tests/travel-home.test.ts:396) green – zero MAIN-stream draws added, by construction and by test.

## Acceptance criteria

- [ ] vitest resolves three projects (unit, sim, component); unit counts unchanged; component suite < 30s wall locally.
- [ ] Five seed component tests exist under tests/component/, run under happy-dom, and contain zero DOM-snapshot assertions.
- [ ] `game.error` from a failed MoreScreen import is user-visible (App-level strip with `aria-live="assertive"`), proven by a mounted test.
- [ ] `npm run lint` exits 0; eslint.config.mjs contains no formatting/attribute-order rules; lint runs in `check`, ci.yml and .gitlab-ci.yml.
- [ ] WeekRecapCard.vue:106's computed has an explicit exhaustive return (the dry run's one real hit, fixed).
- [ ] `npm run coverage` emits a v8 report over src/ with no thresholds; first-run numbers recorded in the PR description.
- [ ] docs/decisions.md + .gitlab-ci.yml header record the calibration-stays-GitHub decision with the quota rationale.
- [ ] The five icons total ≤ 350K on disk; public/logo-lucia-app.png is deleted; dist/sw.js precache total ≤ 2.6MB.
- [ ] Runtime cache `tb-audio-v1` (CacheFirst, 60d, maxEntries 30, rangeRequests) exists; mp3 still absent from globPatterns; theme plays offline after one online play.
- [ ] More → About shows a Build row fed by `__BUILD_ID__`; a gitless build falls back to `dev` without failing.
- [ ] CHANGELOG.md exists with retroactive wave entries; version/tag policy written in decisions.md; tests/release.test.ts green.
- [ ] goldenSaves.test.ts and all four frozen-capture suites green; `SAVE_SCHEMA_VERSION` still 34.

## Risks & alternatives

- **happy-dom is not a browser.** Focus containment and Escape semantics are approximations; the dialog test asserts attributes and emitted events, not native traversal. Real-browser smoke (Playwright) is deliberately out of scope – noted as the eventual next rung, not smuggled in.
- **MatchViewer is the riskiest mount** (rAF loop, sfx, canvas). Mitigations verified in code: null-ctx guard (MatchViewer.vue:520, 737-741), visibility listener feature-guarded (:727). If sfx construction throws under happy-dom, stub src/audio/sfx.ts in that one test. Contained to one file.
- **Mounting all of App.vue** for the badges test is heavy; fallback is review 02's own `useSeenWatermark` extraction plus a shallow mount – the test's assertions survive either shape.
- **Lint config drift:** pin majors (eslint 9, typescript-eslint 8, eslint-plugin-vue current); the probe parsed all 48 SFCs and 75 TS files cleanly at these versions.
- **Icon quality:** quality-80 palette verified visually at 512px here; owner eyeballs the installed icon once, the knob is a single number in gen-icons.mjs.
- **Range caching is the classic silent-audio footgun** – acceptance requires the offline playback check, not route presence.
- **Runner-ups:** jsdom (slower, same fidelity class) behind happy-dom; Prettier/Biome rejected – formatting churn would invalidate much of the 45-file source-pin corpus for zero correctness gain; coverage thresholds now rejected – measure first, gate later; GitLab path-filtered sim job kept as the documented alternative to the "GitHub-only" decision.

## Dependencies

- **P6** (money formatting consolidation into shared/format.ts): `money-render.test.ts` asserts its contract – co-lands red→green with P6.
- **P8** (accessible dialog shell): `dialog-a11y.test.ts` is its executable spec – green only with P8.
- Everything else – the component harness itself, the other three seed tests, and sub-packages (b) through (f) – has no dependency and can merge first, in any order.
