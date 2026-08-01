<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P6 – Quick-wins wave (money format, dev fast-forward, sim CI, theme sync)
One-line: One branch bundling five small mechanical fixes – a single cents-in money formatter replacing 15 local copies, MoneyScreen reading STARTING_FUNDS_CENTS from the engine, the dev fast-forward gated to DEV builds and taught to respect the knock/tournament blocking contract, `test:sim` exiting 0 on green before Monday's cron, and the PWA theme colors synced to the app's real background.

**Priority:** Tier 3 – quick wins · **Effort:** M (0.5-2d) · **Risk:** low

## Why (problem)

Five confirmed, cheap, certain defects (review README.md:16 calls for exactly this sweep):

**(a) Money formatting is re-implemented 15 times in 13 components, with a live unit trap** (review 02-code-quality.md, HIGH, adversarially confirmed). Verified by grep at b7a9358:
- `formatSigned(cents)` byte-identical ×4: WeekRecapCard.vue:229, SeasonSummaryDialog.vue:37, SeasonHistoryTable.vue:51, MoneyScreen.vue:100.
- `formatDollars(cents)` ×7: TierGuide.vue:31, PlanWeekSheet.vue:40 (variant: `'free'` for 0), InjuryStopDialog.vue:67, CalendarScreen.vue:234, CoachMarketScreen.vue:51, SeasonScreen.vue:72, SeasonHistoryTable.vue:56 (variant: sign-preserving).
- `formatFunds(cents)` ×2: MoneyScreen.vue:95, HomeScreen.vue:321.
- Inline copies ×2: OfferLetter.vue:100, InboxSheet.vue:39.
- **The trap:** MoneyScreen.vue:105 declares `formatDollars(dollars: number)` taking **dollars**, while seven same-named siblings take **cents**. One code move between screens away from a ×100 display bug – in the game whose pillar is honest economics.
`src/shared/format.ts` exists (21 lines, name/rank helpers only), so the shared-helper home is already established.

**(b) MoneyScreen hand-copies an engine constant.** MoneyScreen.vue:91-93: `STARTING_BUDGET = { wealthy: 120_000, middle: 25_000, working: 8_000 }` with a "must match src/engine/world.ts STARTING_FUNDS_CENTS" comment. The constant is exported at world.ts:445-449. Retune the engine and the Money screen silently lies. Bundle impact of importing it is nil: PracticeFlow.vue:22 and BracketTabs.vue:23 already import `KID_ID`/`flipScore` from `engine/world`, so world.ts is already in the UI chunk.

**(c) The `▶▶ 52 (dev)` button ships in production and bypasses the engine's blocking contract** (review 01-architecture.md:28, 55). MoreScreen.vue:345 calls `game.tick(52)` with no `import.meta.env.DEV` gate (no `.DEV` usage exists anywhere in src/ – only BASE_URL). The worker's `tick` handler (sim.worker.ts:80-85) loops raw `tickWeek`, skipping `advanceWeeks`' hard guards (world.ts:4782 `pendingTournament`, world.ts:4791 `pendingKnock`). Consequences in the engine itself: with a pending tournament open, tickWeek:4488-4492 skips `recomputeRankAndMilestones`/`housekeep`/`maybeFireSeasonWrapUp` every subsequent week, and tickWeek:4398 can overwrite an unresolved reveal with a new `computeShadowTournament` – the exact "weeks just got skipped" failure the W4 knock slice exists to prevent (world.ts:4783-4791).

**(d) `npm run test:sim` exits 1 with all 60 tests passing** (review 07-testing-tooling.md, HIGH; reproduced twice on an idle 10-core Mac: `Test Files 3 passed, Tests 60 passed, Errors 1 error`, `[vitest-worker]: Timeout calling "onTaskUpdate"` fired during econ-bench.test.ts at ~64s). Mechanism: birpc's hard-coded 60s RPC timeout (node_modules/birpc: `DEFAULT_TIMEOUT = 6e4`, not configurable in vitest 3.2.7) fires when the fork's event loop stays blocked in synchronous Monte-Carlo past a pending `onTaskUpdate` ack. The weekly workflow (.github/workflows/simulation.yml:38, cron Mondays 04:00 UTC, first run 03.08) runs exactly this command on a 2-core runner – red-on-green from day one, on the job guarding the match model. The sim project (vite.config.ts:195-201) sets no `fileParallelism`; the culprit file's reach-tracker describe (tests/econ-bench.test.ts:201-331) alone is ~40s. GitLab (.gitlab-ci.yml) runs the unit project only – calibration currently has no reliable automated execution anywhere.

**(e) Manifest/theme-color drift** (review 05-ux-ui-pwa.md:44, 77). vite.config.ts:67-68 (`theme_color`/`background_color`) and index.html:10 say `#0f172a`; the app's real background is `--bg: #0a0e13` (style.css:54, the darker palette landed 28.07). Android status-bar tint and the install splash flash the old slate. Three copies of one color, no test pinning them together – the exact failure class tests/design-tokens.test.ts was built to close.

## What (proposed change)

One branch (`chore/p6-quick-wins`), five commits, zero schema/RNG impact:

1. **New `src/shared/money.ts`** exporting exactly two helpers with the unit in the name: `formatCents(cents): string` ("$1,234" / "-$1,234") and `formatCentsSigned(cents): string` ("+$1,234" / "-$1,234"), bodies byte-identical to today's formatFunds/formatSigned. All 15 sites convert; every local formatter is deleted; the dollars-in `formatDollars` (MoneyScreen.vue:105) dies with (b). A sibling module rather than growing format.ts: format.ts is name/rank display, money.ts carries the one-contract cents rule in its filename and doc header, and a grep for "money" finds it. A DRY gate test keeps the copies from coming back.
2. **MoneyScreen imports `STARTING_FUNDS_CENTS`** from `engine/world` and renders it via `formatCents`; the hand copy and its "must match" comment are deleted.
3. **Dev fast-forward:** the button gets `v-if="isDev"` (`const isDev = import.meta.env.DEV`), AND the worker `tick` handler checks `pendingTournament || pendingKnock(world)` before every tickWeek – defense in depth: the button vanishes from prod builds, and no caller of the `tick` command (now or future) can tick through an open decision. Not chosen: stripping the `tick` case from prod bundles – conditional protocol arms are invisible complexity for the same guarantee the 2-line guard gives.
4. **test:sim:** split the reach-tracker describe out of econ-bench.test.ts into `tests/econ-reach.test.ts` (no sim file stays near 60s), convert its whole-PRESETS loops to `it.each` (the fork's event loop yields between presets, so no single test body blocks 40s+ on a slow runner), add the new file to `HEAVY_SIM_FILES`, and set `fileParallelism: false` on the sim project (on the 2-core weekly runner the main process keeps a core, so acks flow). Verify by `workflow_dispatch` before Monday. **GitLab parity decision: calibration stays GitHub-only**, documented in .gitlab-ci.yml – the working rule is run-locally-and-paste-numbers (simulation.yml:17-20), GitLab's role is PR-gate mirror + Pages, and a second scheduler doubles the red-on-green surface while burning quota minutes on a report nobody reads there.
5. **Theme sync:** `#0f172a` → `#0a0e13` in vite.config.ts:67-68 and index.html:10, plus a pin in tests/design-tokens.test.ts tying all three copies to style.css's `--bg`. `src/viz/courtRenderer.ts:51` (`BG = '#0f172a'`) is deliberately untouched – that is the match-scene canvas backdrop, a design choice, not app chrome.

## How (implementation sketch)

Branch off origin/main (GitHub only, PR, owner merges – per repo discipline). Order below is TDD order per item.

**(a) + (b) money module** (one commit, they share MoneyScreen):
1. Write `tests/money-format.test.ts` first, three describes:
   - Behavioral: `formatCents` / `formatCentsSigned` exact strings – `formatCents(123456) === '$1,235'`, `formatCents(-123456) === '-$1,235'`, `formatCents(0) === '$0'`, `formatCents(-49) === '$0'` (the -0 edge), `formatCentsSigned(0) === '+$0'`, grouping at 120_000_00 → `'$120,000'`.
   - DRY gate (project idiom, cf. tests/design-tokens.test.ts): scan `src/components/**`, `src/App.vue`, `src/composables/**`, `src/stores/**` and assert no file matches `/function format(Dollars|Signed|Funds)/` and none contains the money idiom `100).toLocaleString`. (Verified safe: the three non-money `toLocaleString` sites – TournamentFlow.vue:233 crowd, KidScreen.vue:171 points, MoreScreen.vue:62 date – don't divide by 100. world.ts:980/3259/4092 stay out of scope: engine feed text, persisted in saves, pinned elsewhere.)
   - MoneyScreen pins: contains `STARTING_FUNDS_CENTS` imported from `../../engine/world`; does NOT contain `STARTING_BUDGET` or a `120_000` literal.
2. Create `src/shared/money.ts` (two functions, 8 lines + header stating the contract: cents in, whole dollars out, en-US grouping). Run the behavioral tests green.
3. Convert sites mechanically:
   - Delete local fns, import from shared/money: WeekRecapCard.vue:229, SeasonSummaryDialog.vue:37, SeasonHistoryTable.vue:51+56 (`formatSigned`→`formatCentsSigned`, its sign-preserving `formatDollars`→`formatCents`), MoneyScreen.vue:95+100 (`formatFunds`→`formatCents` incl. template), HomeScreen.vue:321 (+ line 304 caller), TierGuide.vue:31, InjuryStopDialog.vue:67, CoachMarketScreen.vue:51, SeasonScreen.vue:72, CalendarScreen.vue:234 (all `formatDollars`→`formatCents` incl. template call sites).
   - PlanWeekSheet.vue:40: replace body with one-line local `const feeLabel = (c: number) => c === 0 ? 'free' : formatCents(c)` (the 'free' word is this sheet's copy, not a money contract) and rename its 5 template calls.
   - OfferLetter.vue:100 `dollars` arrow fn and InboxSheet.vue:39 inline expression → `formatCents`.
   - MoneyScreen.vue:91-93+105+112: delete `STARTING_BUDGET`, the comment, and `formatDollars(dollars)`; `startingBudget` computed becomes `formatCents(STARTING_FUNDS_CENTS[game.snapshot.profile.background])`; drop the now-unused `FamilyBackground` type import at line 52 (tsconfig runs noUnusedLocals).
   - MoneyScreen.vue:88 `physioCostLabel` stays as-is (composite `$lo-hi/wk` range label, no grouping, cents division visible in place) – note this in the commit message.
4. Re-aim three source pins to the new name, with the project's RE-AIMED annotation: tests/coach-market.test.ts:33 (`formatDollars(r.overBudgetCents)`), tests/academy.test.ts:303 (`formatDollars(row.event.travelCostCents)`), tests/calendar-screen.test.ts:665 (`entry {{ formatDollars(marker.entryFeeCents) }}`). tests/round13-nav.test.ts:286 (App.vue must NOT contain `formatFunds`) stays satisfied untouched.

**(c) dev fast-forward** (one commit):
5. Write `tests/dev-fast-forward.test.ts` first (source pins, the layer this lives in): MoreScreen.vue's ▶▶ button carries `v-if="isDev"` and the file declares `const isDev = import.meta.env.DEV`; sim.worker.ts imports `pendingKnock` and the `tick` case contains the guard before `tickWeek`.
6. sim.worker.ts:80-85 – add `pendingKnock` to the world.ts import (exported at world.ts:2075) and change the loop:
```ts
for (let i = 0; i < msg.weeks; i++) {
  if (world.pendingTournament || pendingKnock(world)) break
  tickWeek(world, rng)
}
```
   Break, not throw: the returned snapshot carries the pending state, so the UI mounts the tournament flow / knock dialog exactly as after `advance` – self-explanatory in dev, invariant-safe everywhere. Entry-blocked calls tick zero weeks. RNG: zero draw changes inside any tick; fewer ticks is safe because `restoreRng` (sim.worker.ts:64-69) replays by `world.week` count.
7. MoreScreen.vue:345 – wrap in `v-if="isDev"`. Template stays em-dash/Cyrillic-free (tests/week-scene.test.ts:573 pin).

**(d) test:sim** (one commit):
8. Create `tests/econ-reach.test.ts`: move describe econ-bench.test.ts:201-331 **verbatim** (its comment blocks carry owner decisions and RE-PIN history – they move, not vanish), plus the `vi.setConfig({ testTimeout: 240_000 })` header and the needed imports (`runCareer, openCareer, stepCareerWeek, PRESETS, HORIZONS, REACH_TARGET_MONEY, REACH_PRO_RANK, REACH_PRO_POINTS` from `../tools/econ-bench`; `kidPoints` from `../src/engine/world`) and the local consts it uses (`working`, `workingCoached`, `wealthy`, `H16`, `H18`). Add a two-line header noting the split and why (birpc 60s, this file's ~40s).
9. Inside the moved describe, convert the two outer `for (const preset of PRESETS)` loops (old lines 207, 313) to `it.each(PRESETS)` – same assertions per preset, each test body now seconds not tens of seconds.
10. vite.config.ts – add `'**/tests/econ-reach.test.ts'` to `HEAVY_SIM_FILES` (line 47-51; this both excludes it from the unit project at line 169 and includes it in sim at line 200), and set the sim project to `test: { name: 'sim', include: HEAVY_SIM_FILES, fileParallelism: false }` with a 3-line comment citing the birpc mechanism and the 2-core runner.
11. .gitlab-ci.yml – add a comment block: calibration is scheduled on GitHub only (simulation.yml); GitLab mirrors the PR gate + Pages; the guard for model changes remains run-`test:sim`-locally-and-paste (simulation.yml:17-20).
12. Verify: `npm run test:sim; echo $?` twice locally → 0 both times; `npm test` file/test counts unchanged for the unit project; push branch and trigger `workflow_dispatch` of Simulation calibration against the branch → green run before Monday's 04:00 UTC cron.

**(e) theme sync** (one commit):
13. Add a describe to tests/design-tokens.test.ts first: extract the hex from `/--bg:\s*(#[0-9a-f]{6})/` in src/style.css, then assert index.html contains `<meta name="theme-color" content="<hex>"` and vite.config.ts contains `theme_color: '<hex>'` and `background_color: '<hex>'`. Red at #0f172a.
14. Edit vite.config.ts:67-68 and index.html:10 to `#0a0e13`. Green. courtRenderer.ts:51 untouched.

## Test plan

TDD order as numbered above – every edit lands behind a failing test written first:
- `tests/money-format.test.ts` (behavioral + DRY gate + MoneyScreen pins) drives (a)+(b); the three re-aimed pins (coach-market:33, academy:303, calendar-screen:665) go red on rename and green on re-aim, proving they still watch the same facts.
- `tests/dev-fast-forward.test.ts` drives (c). `pendingKnock`/`advanceWeeks` behavior itself is already covered by the knock suite (tests/knock.test.ts) – this wave adds no engine behavior, only refuses to bypass it.
- (d) is proven by execution, not assertion: two consecutive local `test:sim` runs exiting 0, then a green `workflow_dispatch` run of simulation.yml on the branch. Unit project (`npm run check`) must show identical test counts (the moved describe was never in it – HEAVY_SIM_FILES excluded econ-bench already).
- design-tokens describe drives (e).
- **Golden saves / schema: untouched.** No engine state, no protocol shape, no draw on any stream changes; `SAVE_SCHEMA_VERSION` stays 34, no new fixture, goldenSaves.test.ts must pass unmodified. The frozen MAIN capture (41550 / e6b0c709) suites (knock/injuries/condition/travel-home/trophy-podium) must pass unmodified – they are the proof no draw moved.
- Full local gate: `npm run check` + `npm run test:sim` green; `vite build` output eyeballed once in preview for the money screens (Money, Home header, Season, Calendar, Coach market, Tier guide, offer letter) – strings must be pixel-identical.

## Acceptance criteria

- [ ] `src/shared/money.ts` exists with exactly `formatCents` and `formatCentsSigned`; grep for `function formatDollars|function formatSigned|function formatFunds` in src/components returns nothing; grep for `100).toLocaleString` in src/components, src/App.vue, src/composables, src/stores returns nothing.
- [ ] No component-local money formatter remains at the 15 listed sites; rendered money strings are byte-identical (behavioral tests pin the exact formats, incl. `+$0` and the `-49` cents edge).
- [ ] MoneyScreen renders starting budget from `STARTING_FUNDS_CENTS` (world.ts:445); the `STARTING_BUDGET` copy and dollars-in `formatDollars` are gone.
- [ ] Production build (`vite build` without DEV) contains no `▶▶ 52 (dev)` button; dev build still shows it.
- [ ] Worker `tick` never executes `tickWeek` while `pendingTournament` or `pendingKnock(world)` holds – entry and mid-loop.
- [ ] `npm run test:sim` exits 0 twice consecutively on a dev machine, and a `workflow_dispatch` run of Simulation calibration is green before the first Monday cron (03.08).
- [ ] Reach-tracker coverage moved, not lost: every assertion from econ-bench.test.ts:201-331 exists in tests/econ-reach.test.ts, and the file is in `HEAVY_SIM_FILES` (runs in sim, excluded from unit).
- [ ] .gitlab-ci.yml documents the GitHub-only calibration decision; no new GitLab job.
- [ ] index.html:10, manifest `theme_color` and `background_color` all read `#0a0e13`, and tests/design-tokens.test.ts fails if any of the three drifts from style.css `--bg`.
- [ ] `npm run check` green; golden-save suite and the frozen-capture suites pass with zero modifications.

## Risks & alternatives

- **String drift in money output.** Mitigated: shared bodies are copied byte-for-byte from formatFunds/formatSigned; behavioral tests pin exact outputs including edge cases; visual spot-check on build.
- **(d) may still flake on the 2-core runner** if a single career-replay test exceeds ~60s of blocked event loop there (GH cores are slower than the M-series that measured ~40s for the whole describe). The `it.each` conversion caps single-test block time at one preset's cost; `fileParallelism: false` keeps the main process responsive. Final arbiter is the dispatch run; fallback is splitting the H18 loop per horizon into further `it.each` cases – same assertions, finer grain. Runner-up alternatives, rejected for this wave: vitest major upgrade (the birpc timeout may have become configurable upstream – unverified, and a version bump under 91 test files is not a quick win); `fileParallelism: false` alone (does not explain or fix the idle-10-core repro, where contention was absent).
- **(a) runner-up:** extend src/shared/format.ts instead of a sibling money.ts. Rejected in 2 sentences: format.ts's charter is name/rank display and money's one-contract rule deserves a filename that states the unit; either way the DRY gate is the real protection.
- **(c) semantics change in dev:** fast-forward now stops at a reveal/knock instead of blasting through – intended, since blasting through corrupts rank/housekeeping state (world.ts:4488-4492) and produces bogus dev worlds. If the owner wants a true blast-through, that is an explicit engine-level dev command with its own rules, not a silent bypass. Runner-up: strip the `tick` protocol arm from prod builds – rejected, conditional protocol surface for no added safety over the guard.
- **Pin re-aims** must carry the RE-AIMED annotation convention (334 precedents in tests/) so the archaeology survives.
- **(e)** deliberately does not touch src/viz/courtRenderer.ts:51 – flag to the owner separately if the court backdrop should also adopt the new palette (a design call, not a sync).

## Dependencies

None – independent of all other proposals. Coexists with the review's Tier 1/2 items (endings, RNG persistence): nothing here touches schema, draws, or world.ts structure. One branch for the whole wave per the repo's one-branch-per-wave discipline; PR to GitHub origin; owner merges.
