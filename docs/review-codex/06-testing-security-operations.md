# Testing, Security, Performance, and Operations Review

## Validation results

| Check | Result | Interpretation |
|---|---|---|
| `npm run check` | Passed | Type checking, 88 test files / 1,935 tests, and production build succeeded. |
| `npm run test:sim` | Failed process status | All 3 files / 60 assertions passed, but Vitest reported an unhandled worker timeout and exited 1. |
| Production dependency audit | 0 findings | `npm audit --omit=dev --audit-level=moderate` found no production dependency vulnerability. |
| Full dependency audit | 1 high | Transitive `brace-expansion` denial-of-service advisory in the PWA/build tool chain; a fix is available. |
| Live smoke check | Passed exercised flow | Desktop/mobile onboarding and Home produced no observed console errors; this was not a complete playthrough. |

The deterministic engine test volume is impressive. The gate is not yet trustworthy because a suite can report all assertions passing and still fail at the process level.

## Test portfolio

### Strengths

- 1,935 fast tests cover a broad set of engine rules, migrations, economy paths, rounds, and UI contracts.
- Simulation tests exercise longer statistical behavior rather than only hand-picked examples.
- Strict type checking and a production build are part of the main check command.
- Deterministic seeds and purpose-separated randomness make failures reproducible.
- Save and migration behavior receives more attention than typical prototype code.

### Gaps

- There is no Vue Test Utils/jsdom/happy-dom component environment and no Playwright or Cypress suite.
- About 46 test files read source text, and there are roughly 1,755 `toContain`/`toMatch` assertions. Some are legitimate data assertions, but many UI tests prove strings/classes exist rather than that the rendered interaction works.
- No test currently catches focus leaks, inert-background failures, safe-area collision, narrow calendar wrapping, browser back behavior, or the shipped developer action.
- There is no explicit coverage report or risk-to-test map.
- Several written balance targets exist only in docs, not as executable distribution thresholds.

## P1 — The simulation test command is not a reliable gate

`npm run test:sim` completed all 60 assertions but exited nonzero after `[vitest-worker]: Timeout calling "onTaskUpdate"`. This reproduces the exact class of worker problem that configuration comments say was solved. A red process cannot be waived because its test summary is green; CI and release automation will correctly treat it as failure.

First reduce the suite to the smallest file/worker configuration that triggers the timeout. Then choose one of:

- run long simulations in a single Vitest pool with sufficient event-loop headroom;
- move statistical simulations to a deterministic standalone Node harness and emit machine-readable thresholds;
- partition by process at the package-script/CI level rather than inside one unstable worker pool.

Keep the short behavioral suite independent, so a long simulation infrastructure failure cannot hide ordinary regressions.

## Release test matrix to add

### Persistence and concurrency

- Restore a named/older save, close immediately, restart, and verify the restored revision.
- Send two mutations concurrently and verify serialized revisions and unique autosave generations.
- Inject quota/transaction failure and prove no hidden world mutation commits.
- Open two clients at different revisions and prove the stale client cannot write.
- Crash the worker with pending calls, recover it, and reject late old-worker replies.
- Import corrupt, truncated, oversized, and adversarial compressed saves.

### Career/gameplay

- Run full careers across a documented seed set and assert finishability.
- Track survival, solvency, injury, dropout, rank, academy-offer, and retirement distributions by family background and strategy.
- Verify speedrun and ordinary-play time-compression paths converge on equivalent domain results.
- Add intended invariants for recovery costs instead of preserving a known defect.
- Test every terminal state and the end-to-new-career loop once implemented.

### Rendered UX

- Use Playwright plus axe at four viewport classes.
- Exercise focus entry/restoration, keyboard trapping, Escape, inert background, and destructive actions.
- Test installed-PWA/offline loading with cold audio cache.
- Add screenshot checks only for a small number of stable layout anchors; do not snapshot every screen.

## Dependency and supply-chain review

Production runtime dependencies audited clean at the time of review. The full audit found a high-severity `brace-expansion` advisory through build/PWA packages such as Workbox/glob/minimatch. It is a developer/build-time denial-of-service path, not evidence that shipped game saves or remote players can trigger it. Apply the available lockfile update, rerun checks, and keep Dependabot/Renovate-style update PRs small.

Pin a supported Node and npm version through `engines` and optionally `.nvmrc`/Volta. CI should use `npm ci`, run the audit as a separately visible job, and preserve the generated build manifest for release diagnosis.

## Save/import security

The highest-risk input surface is the local `.tsave` importer:

- validation is shallow after migration;
- compressed and expanded sizes are unbounded;
- full nested array/object bounds are not enforced;
- global state can be touched before restoration is completely proven.

Add schema validation, byte limits, decompression limits, candidate-state commit, and fuzz cases. Avoid alarming language: this is primarily a corrupt-file and local resource-exhaustion risk because the app has no remote import channel.

## Privacy and data ownership

No telemetry, account, or remote backend is a meaningful privacy strength. Saves contain personal-profile-like data including name, location, and exact birthday and can be exported unencrypted. Make “stored on this device” and “export files are readable game data” explicit in onboarding/settings. Provide a privacy note even if the answer is simply that no data is transmitted.

## Build and asset operations

The production build invokes art-optimization logic that can move source masters. A build should be repeatable and read-only with respect to source assets. Split this into an explicit `art:ingest` or `art:optimize` authoring command; make `build` consume already prepared assets and fail with a clear message if they are missing.

Project notes say high-resolution masters may exist only on one workstation and that Git is not their backup. That is a material continuity risk. Store masters in private object storage or an appropriate LFS/media system with versioning and restoration drills.

## Performance and offline behavior

Observed production artifacts include approximately:

- main JavaScript: 370.58 kB raw / 126.49 kB gzip;
- worker JavaScript: 161.54 kB raw;
- CSS: 118.32 kB raw / 21.70 kB gzip;
- PWA precache: 117 entries / 2.47 MB;
- public assets: about 11 MB; built distribution: about 14 MB.

These are acceptable for an art-led offline game but deserve budgets. The main bundle includes all screens and some direct engine rule imports; route/screen lazy loading would reduce startup work. Snapshot projection repeats ranking/ladder calculations. RNG restoration grows linearly with saved weeks. Measure before micro-optimizing, but fix the latter two because they are also architectural clarity issues.

Audio files total roughly 3.1 MB and are excluded from precache/runtime caching patterns, so offline sound depends on prior browser caching. Add bounded CacheFirst/runtime caching with versioned names, or clearly exclude audio from the offline promise.

## Repository and release operations

Before a public release, add:

- a standalone license matching the intended source-available terms;
- `SECURITY.md` with a private reporting route and support policy;
- a short contributor/development guide;
- a release checklist covering save compatibility, full-career completion, offline install/update, and rollback;
- structured save-schema and game-version release notes.

This review was not a formal penetration test, legal opinion, or production load test.
