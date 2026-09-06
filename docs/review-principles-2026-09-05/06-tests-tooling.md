---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-05
baseline: 98e3560b
---

# Tests, tooling and CI – 5 September 2026 review

## Verdict

The test estate is telling the truth. Every one of the eight cheap gates is green at `98e3560b`, including `check:tools`, which the 2 September review found red with nine errors and outside every gate; it is now inside `npm run check` and a CI step of its own. Of 5,556 `it`/`test` blocks in 365 files, zero are assertion-free (three regex hits were test names containing "it ("); no test uses real time or `Math.random` (the 22 `Math.random` hits are pins that forbid it); every engine, composable and shared module is reached by some test, and every one of the 68 components is mounted, directly or through a parent. No P0 was found: no gate returns green on a defect I could reproduce by reading.

The three things that matter most:

1. **The helper behind nine negative source pins returns `''` instead of throwing** (`tests/worldSource.ts:109-114`). Seven of the nine sites guard themselves with `not.toBe('')`; one does not, and two test files carry local copies of the same shape. This is the `indexOf → -1` family the 24 August migration was meant to close, one door over.
2. **The marker helpers that closed that family are themselves untested.** `tests/helpers.test.ts` covers `codeOf`, `scriptCodeOf` and `fnv1a`; no test anywhere asserts that `region`/`at`/`lineAt` throw on an absent marker, which is the only property that makes 176 migrated pins honest.
3. **Budget by structure.** Thirty files in the `unit` bulk pool declare per-test budgets of 60–300 s inside a pool whose per-file ceiling is birpc's unraisable 60 s, and ten module-level lazy caches (the `walkedCache` pattern) are built by whichever test arrives first, none under `beforeAll`. Nothing here is red today; it is the shape that produced every "green tests, exit 1" incident in the ledger.

The 2 September findings in this area: QA-34 (`check:tools`) fixed; QA-36 (routing facts) fixed; QA-37 (e2e label) fixed; QA-35 (edit ratchet), QA-40 (double typecheck, verbose output) still open; QA-38 (source pins) and QA-39 (real-browser a11y) unchanged in substance.

## Method

**Read in full:** `CLAUDE.md`; `package.json`; the four `tsconfig*.json`; the `test:` block of `vite.config.ts` (lines 254-460); `playwright.config.ts`; `.github/workflows/{ci,simulation,deploy}.yml`; `.githooks/*`; `.gitlab-ci.yml`; `.gitignore`; `.github/pull_request_template.md`; the code of every script in `scripts/` that the gates run (`context-audit`, `doc-facts`, `engine-purity`, `pin-ratchet`, `decision-index`, `world-map`, `tools-registry`, `schema-ladder`, `heavy-tests`, `units`, `sim`, `e2e`, `lib/stall`); `tests/helpers/source.ts`; `tests/worldSource.ts`; `tests/pin-hygiene.test.ts`; `tests/sim-serialisation.test.ts`; `tests/helpers.test.ts`; `tests/goldenSaves.test.ts` (head); `tests/component/{fits.ts,a11y-sweep,mount-smoke}`; `e2e/parity.spec.ts` in full; `e2e/coverage-map.spec.ts`; `e2e/careerAt.ts` (head); the SCREENS and JOURNEYS blocks and §12 of `docs/specs/e2e-coverage.md`; the two "deliberate break" records in `docs/rounds/round-36.md` (201-240, 776-800); the 2 September review's testing section and P-01/P-05.

**Ran, one at a time, each to a file with the exit code appended inside the command** (scratch: `…/scratchpad/rv36-T/gate-*.log`): `context:audit`, `doc:facts`, `pins:check`, `decisions:check`, `map:world:check`, `tools:registry:check`, `node scripts/engine-purity.mjs`, `check:tools`. All eight `EXIT=0`. Also `npx playwright test --list` (no browser, no server: 62 tests in 15 files, `playwright-list.log`), `npm ls --depth=0`, `npm outdated` and `npx --yes depcheck` (read-only; depcheck was fetched into the npx cache, nothing written to `node_modules`).

**Scripted** (`rv36-T/inventory.mjs`, output `inventory.txt`; `pinsample.mjs` → `pin-sample.txt`; `debug.mjs` for two verification passes): it-blocks with zero `expect`/`assert` (call-paren matching with string awareness; comments stripped with `^[ \t]*//`, the first version used `^\s*//`, which eats preceding blank lines and shifted line numbers – fixed and re-run before any number below was written); assertion-kind counts; per-file pin/mounted/behavioural classification; determinism patterns; inline and file-level timeouts; module-level `let` and lazy caches; module coverage via import resolution plus the `engine/world` barrel mapped through `tools/generated/world-symbol-map.md` and transitive reach through `src` imports; component mount coverage direct and via parent; three hygiene blind-spot scans. Every line number cited was re-read from the file after the fix.

**Not covered and why:** no suite, build or bench was run (the performance lane owns every heavy run); `tools/**` only as far as `check:tools` and the registry; `src/` only where a test's claim needed the source read (`multiWeek.ts:314`, `App.vue:1881`); per-test cost is never asserted here, only structure.

## Findings

| ID | Severity | Effort | Location | One-line summary |
| --- | --- | --- | --- | --- |
| T-01 | P1 | S | `tests/worldSource.ts:109-114`; `tests/round23-retirement-news.test.ts:202-203`; `tests/coach-voice.test.ts:60-62`; `tests/relative-age.test.ts:402-404` | `worldFunction`/`engineModuleFunction` return `''` on an absent function; one negative pin and two local helpers of the same shape go green under a rename |
| T-02 | P1 | XS | `tests/helpers.test.ts:20-63`; `tests/helpers/source.ts:101-171` | The marker helpers' throw-on-absent behaviour – the property 176 migrated pins rest on – has no test |
| T-03 | P1 | S | `scripts/context-audit.mjs:19-20` vs `:679-689`; `tools/generated/context-baseline.json` | The "edited legacy document must gain metadata" ratchet still inspects membership only (QA-35 open) |
| T-04 | P2 | XS | `tests/component/birthday-dialog.test.ts`; `tests/component/{a11y-sweep,round21-popup-order}.test.ts`; `src/engine/world/multiWeek.ts:314` | Two blocking overlays, `BirthdayDialog` and `KnockDialog`, lack the mandated 375x667 dismiss assertion |
| T-05 | P2 | M | 30 `unit`-bulk files (table below); 10 lazy caches (table below); `tests/match/calibration.test.ts:146-152` | Budget by structure: per-test budgets of 60–300 s in the pool with a 60 s per-file wall; first-consumer-pays caches; one wall-clock assertion in the weekly cron |
| T-06 | P2 | S | `.github/workflows/ci.yml:101,125,138,152`; `deploy.yml:51,55`; `package.json:9,11,51` | CI typechecks twice per job and runs the unit shards `--verbose` against CLAUDE.md's own advice (QA-40 open) |
| T-07 | P2 | S | `tests/pin-hygiene.test.ts:50`; `tests/screen-i-live-match.test.ts:170,280,520,681,1163` | The hygiene guard cannot see a negative assertion on a binding *derived* from `componentLogic` – five live instances |
| T-08 | P2 | M | 80 of 365 test files; 93 pin `style.css`; sample in `rv36-T/pin-sample.txt` | Source pins remain a second test language: 1,876 it-blocks in pin-carrying files vs 1,335 in mounted files; 4 of 30 sampled would pass against a deleted feature; six rename-fragile pins named |
| T-09 | P2 | S | `e2e/parity.spec.ts`; `e2e/responsive.spec.ts:275,388`; `docs/specs/e2e-coverage.md` §12 D1 | Real-browser accessibility is presence-only: no axe pass, no keyboard/focus-trap pass over the overlays D1 lists as still roleless (QA-39 partial) |
| T-10 | P3 | XS | `scripts/tools-registry.mjs:234`; `ci.yml:161-163`; `.gitlab-ci.yml:1-7,46-51` | Stale prose inside gates: "on-demand sweep", "31 tests in 13 files", and a GitLab mirror that no longer mirrors |
| T-11 | P3 | XS | `package.json:53,56`; `tools/precache-delta.mjs:61`; `ci.yml:57`; no `engines`/`.nvmrc` | Script and dependency hygiene: an identical script pair, one undeclared import, Node 22 in CI vs 26.5 locally, five majors behind |
| T-12 | P3 | XS | `tsconfig.app.json:10-14`; `tsconfig.node.json:10-12`; `tsconfig.e2e.json:21-25` | Strictness stops at `strict` + unused checks; no `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`; `tsconfig.node.json` skips the unused checks |
| T-13 | P3 | – | repository root | No ESLint/Prettier – and the honest evidence says the benefit would be small; no tool recommended |

### T-01 – P1 – `worldFunction` returns `''` on an absent function, and one negative pin plus two local copies rely on it

**What.** `tests/worldSource.ts:109-114`:

```ts
function moduleFunction(src: string, name: string): string {
  const at = src.indexOf(`function ${name}`)
  if (at < 0) return ''
  const end = src.indexOf('\n}', at)
  return end < 0 ? src.slice(at) : src.slice(at, end + 2)
}
```

This is the source behind `worldFunction()` and `engineModuleFunction()`. Nine tests bind their result and then make a `.not.` assertion on it (scan I in `inventory.txt`, de-duplicated in `hygiene-unique.txt`). Seven guard themselves first (`expect(fn).not.toBe('')` at `tests/r2-13-advance-span.test.ts:564,1008`, `tests/round10.test.ts:350`, `tests/round11.test.ts:264,494`, `tests/college-freeze.test.ts:415`, `tests/match/rival-retirement.test.ts:126`), and `tests/age-caps.test.ts:290` is guarded by a positive `toContain` on the line before. One is not:

```ts
// tests/round23-retirement-news.test.ts:202-203
const src = engineModuleFunction('world/matchNews', 'rivalRetirementNews')
expect(src).not.toMatch(/\brng\b|Math\.random|rngFromSeed|pickInt|pickOne/)
```

Rename `rivalRetirementNews` – or move it and change its declaration shape – and `src` becomes `''`, `.not.toMatch` passes, and the pin that says "this writer draws nothing" is satisfied by an empty string. Two test files carry a local helper of the same shape: `tests/coach-voice.test.ts:60-62` (`renderedTemplate` returns `''` when `<template>` is absent, and the file then makes claims about what the template contains) and `tests/relative-age.test.ts:402-404` (`body()` returns `''` when `function ${name}(` is absent).

**Why it matters.** This is the exact mechanism `tests/helpers/source.ts` was written to close – its own error text (`source.ts:184-187`) says "as a raw `indexOf` the region would have SILENTLY WIDENED … and the pin would still be green" – except here the region silently *empties* rather than widens, which turns every negative claim into a tautology. CLAUDE.md's gotcha list names the family; `worldSource.ts` predates the helper and was not migrated to it.

**Proposed response.** Re-aim, never delete: make `moduleFunction` throw the same `markerError` the marker helpers throw (or delegate to `at()`), so an absent function is a red test naming the function. The seven explicit `not.toBe('')` guards then become harmless redundancy. Fold `coach-voice.test.ts:60-62` and `relative-age.test.ts:402-404` onto the shared helper. Prove it by mutation: rename `rivalRetirementNews` locally, run `npx vitest run tests/round23-retirement-news.test.ts`, watch it go red *before* the fix is believed.

**Risk.** Low. A throwing helper can only turn a currently-vacuous green into a red that names a real rename; the seven guarded sites already assert the same thing.

### T-02 – P1 – The marker helpers' throwing behaviour is untested

**What.** `tests/helpers/source.ts:101-171` exports `at`, `lastAt`, `region`, `regionToLast`, `regions`, `after`, `before`, `lineAt`; each throws on an absent marker, and `regionToLast:127-132` additionally throws on an inverted region. `tests/helpers.test.ts` has eight `it` blocks (`:23,30,35,43,50,57,63`) – all about `codeOf`/`scriptCodeOf`/`fnv1a`. A repository-wide search for `toThrow` near `region|marker|lineAt|regionToLast|lastAt|at(` finds one hit, and it is `tests/season/prehistory.test.ts:234`, about `enterEvent`. Nothing asserts that `region('x', 'absent', 'y')` throws.

**Why it matters.** The 24 August migration moved 176 raw slices onto these helpers on the strength of one property: "every one of them THROWS on an absent marker" (CLAUDE.md, gotchas). That property has no mutation-verified guard. A future edit that makes `at()` return `-1` for "compatibility" would re-open all 176 pins at once and nothing would say so. The `pins:check` ratchet (`scripts/pin-ratchet.mjs`) forbids new raw slices; it does not verify the helpers it points people at.

**Proposed response.** One `describe` in `tests/helpers.test.ts`: each helper throws on an absent start marker, on an absent end marker, and `regionToLast` on an inverted pair; plus the positive case that a present marker yields the expected slice. Mutation-verify by temporarily returning `-1` from `at()`.

**Risk.** None; additive.

### T-03 – P1 – The edited-document ratchet still does not observe edits

**What.** `scripts/context-audit.mjs:19-20` (header): "an existing unclassified document needs metadata when materially edited. Classify old files only when touched." The implementation, `:679-689`:

```js
const legacyUnclassified = new Set(baseline?.unclassifiedDocs ?? [])
const newlyUnclassified = baseline ? unclassified.filter((file) => !legacyUnclassified.has(file)) : []
```

Membership only. `tools/generated/context-baseline.json` is dated `2026-08-24` and grandfathers 135 paths (`gate-context-audit.log`: "135 unclassified"). A grandfathered file can be rewritten end to end and the audit stays green; the 2 September review (QA-35) said exactly this, and the code is unchanged.

**Why it matters.** The gate's own comment promises a property it does not enforce; that is the definition of a gate that lies, if only by its documentation. The routing-fact fixes that did land (QA-36) show the mechanism works when the machine owns the fact.

**Proposed response.** The previous review's design still fits: store a content hash per grandfathered path in the baseline; fail when the hash changes *and* the file still has no frontmatter; deletion or classification stays non-failing and one-way. `--update-baseline` re-hashes. Effort S, and it is P-01 item 3 of the previous review, not new scope.

**Risk.** A hash ratchet reddens the first edit to any of 135 files; that is the intended cost, and the fix is four frontmatter lines.

### T-04 – P2 – `BirthdayDialog` and `KnockDialog` have no 375x667 dismiss assertion

**What.** CLAUDE.md (gotchas, the round-20 #3 entry): "any dialog you add or lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667 viewport". The helper exists: `tests/component/fits.ts:427` (`measureDialog`) and `:483` (`assertDismissReachable`), used by 22 component files. Mapping the 13 overlay components in `src/components/` (`*Dialog.vue`, `*Sheet.vue`) to files that both mount them and call either helper: ten are covered (`ConfirmDialog` ×3 files, `ForkDialog` ×7, `InjuryStopDialog` ×2, `RetirementDialog` ×2, `CollegeDoneDialog`, `InboxSheet`, `PlanWeekSheet`, `SeasonSummaryDialog`, `ShootClashDialog`, `TourBriefingDialog`), three are not: `BirthdayDialog`, `KnockDialog`, `RankHelpDialog`. The mounts that exist for the first two – `tests/component/birthday-dialog.test.ts`, `a11y-sweep.test.ts`, `round21-popup-order.test.ts` – contain zero `setViewport(`, zero `measureDialog(`, zero `assertDismissReachable(`. Both are blocking: `src/engine/world/multiWeek.ts:314` lists `'knock'` and `'birthday'` in `ADVANCE_REFUSALS`, and `App.vue:1880-1881` says the birthday popup "fires ALWAYS". `RankHelpDialog` is informational and is not mounted directly by any test (it is reached only via a parent).

**Why it matters.** The rule exists because a blocking dialog that outgrows a phone stops a career; the ledger records it happening twice. The two dialogs without the guard are two of the seven that block the advance.

**Proposed response.** Add one `assertDismissReachable` arm each to `birthday-dialog.test.ts` and an existing `KnockDialog` mount, at `PHONE` (`fits.ts:54`), and prove each by the too-tall mutation the gotcha demands. XS.

**Risk.** None beyond the two arms possibly going red on today's copy – which would be the finding.

### T-05 – P2 – Budget by structure: raised budgets in the bulk pool, first-consumer-pays caches, one wall-clock assertion

**What (timeouts).** 136 raised or inline budgets across 60 files (`inventory.txt` §D). The `unit` project's contention budget is `vite.config.ts:344` (`testTimeout: 20_000`); the per-file wall is birpc's 60 s (`vite.config.ts:258-264`, `scripts/heavy-tests.mjs:31-35`). Thirty files in the **bulk** pool – not in `HEAVY_UNIT_FILES` (`heavy-tests.mjs:165-290`, 13 entries), so they share the parallel pool – declare a per-test budget at or above that wall:

| budget | form | unit-bulk files |
| ---: | --- | --- |
| 300 s | `vi.setConfig` | `ad-offer`, `round24-academy-letters`, `round28-sponsor-cut`, `round29-kid-cut-base`, `round29p2-ad-ladder`, `round29p4-ad-portfolio`, `round29p5-business` |
| 240 s | `vi.setConfig` | `r2-13-advance-span`, `round11`, `round26-span-gate` |
| 240 s | inline `}, 240_000)` | `college-league` (21 tests), `college-second-act` (22, 60–240 s), `college-departure` (4), `round26-college-flow` (3) |
| 180 s | `vi.setConfig` | `conveyor` |
| 120 s | `vi.setConfig` | `academy-notice`, `academy`, `plan`, `round29p3-manager-commission`, `season-mirror` |
| 120 s | inline | `college-freeze` (7), `round27-call-up-flow` (2), `round34-reachable-ceiling` (1) |
| 90 s | inline | `ending` (5) |
| 60 s | `vi.setConfig` / inline / `{timeout}` | `dual-universe-bench`; `sim-worker-pipeline` (7), `sim-worker-rng` (5), `worker-reply-correlation` (2), `dev-fast-forward` (2); `blocking-overlay:201` |

The other 30 files with raised budgets are where they belong: 11 `sim` files at 240 s (serialised, `scripts/sim.mjs:84`), 6 `unit-heavy` (one process each, `scripts/units.mjs:186-190`), 17 `component` files at 30–120 s. The full per-file list is `rv36-T/timeouts-per-file.txt` and §D of `inventory.txt`.

**What (caches).** Ten module-level lazy caches, every one built on first call by whichever test arrives first, none under `beforeAll` (`inventory.txt` §E, each site re-read):

| file:line | cache | built by |
| --- | --- | --- |
| `tests/college-league.test.ts:148-152` | `walkedCache` | `SEEDS.map(walkFourYears)` – six four-year walks |
| `tests/round27-call-up-flow.test.ts:128-138` | `walkedCache` | `atCollege` + `walkTheFreeze` per seed |
| `tests/round26-span-gate.test.ts:69-80` | `WALK` | a 208-week walk with knock/fork answering |
| `tests/round29-kid-cut-base.test.ts:118-130` | `cached` | a 32-year walk |
| `tests/component/college-second-act.test.ts:205-215` | `walked` | 60 ticks with reveal finishing |
| `tests/component/round26-college-card.test.ts:180` | `walked` | as above |
| `tests/component/round27-college-season.test.ts:99-100` | `frozen` (`??=`) | `atCollegeWithBookings` |
| `tests/component/round34-week-stack.test.ts:104-115` | `CACHE` | up to 30 ticks searching for a stacked week |
| `tests/component/round35-ui.test.ts:416-427` | `WALK_CACHE` | a replayable tick count |
| `tests/component/week-recap-kid-share.test.ts:109-120` | `cached` | a 14-year walk |

Consumers read the cached world in place (`college-league.test.ts:461` `const world = walked()[0]`); I found no consumer mutating one, so order-dependence is a risk, not a defect. The one `readdirSync(fixtures/saves)` in a test (`tests/goldenSaves.test.ts:17`) is at module level and generates one `it` per fixture (`:45-46`), which is the right shape.

**What (wall clock).** `tests/match/calibration.test.ts:146-152`: `'runs 10,000 simulateMatch calls in under 3 seconds'` measured with `performance.now()`. It lives in the `sim` project, i.e. the weekly cron, whose red run files a `sim-health` Issue by itself (`simulation.yml:125-137`). CLAUDE.md records this exact assertion going 3 s → 16 s under contention.

**Why it matters.** None of this is red today and none of it is measured here. It is the structure every recorded "every test green, exit 1" incident shared: a file that holds a core past 60 s in the parallel pool. A 240 s per-test budget in the bulk pool is a budget the runner cannot honour – birpc will time the *file* out at 60 s first – so the number documents intent, not a ceiling. The lazy caches put the whole walk inside the first consumer's budget and make that consumer's cost depend on test order.

**Proposed response.** (a) Hand the performance lane this list; any bulk file it measures near 40 s solo goes into `HEAVY_UNIT_FILES` by the existing rule (`heavy-tests.mjs:160-164`). (b) Move each lazy cache under `beforeAll` with an explicit `hookTimeout`, so the walk's cost is named and paid once, before any `it` starts its clock. (c) Turn the calibration timing into a recorded measurement with a generous ceiling, or move it to the bench tools, so a slow Monday runner does not file an Issue. All re-aims; nothing deleted.

**Risk.** (a) and (b) change wall-clock only if a file was already near the wall; (c) removes one assertion from the cron and replaces it with a number in the log.

### T-06 – P2 – CI typechecks twice per job and stays verbose (QA-40 open)

**What.** `.github/workflows/ci.yml:101` `npx vue-tsc -b --force`, then `:125` `npm run build`, and `package.json:9` `"build": "vue-tsc -b && vite build"` – a second `vue-tsc -b` (incremental, the mode the comment at `ci.yml:99-100` says has hidden real errors). Same pair in `deploy.yml:51,55`. The local gate does not do this: `package.json:11` ends `… && vue-tsc -b --force && npm run check:tools && … && vite build`. The unit shards run `node scripts/units.mjs --only=bulk --verbose` (`ci.yml:138`) and `--only=heavy --verbose` (`:152`), while `CLAUDE.md:9-14` says "PREFER `test:quiet`: 5.6k chars of output vs 29k". `deploy.yml:54` runs `npm test` (= `units.mjs --verbose`, `package.json:51`), the whole unit suite in one job, the shape `ci.yml:109-119` measured at 15 minutes and split.

**Why it matters.** Two typechecks per job is minutes of metered runner time for no additional truth (the second one is the *less* trustworthy mode). Verbose output only matters when a run is red, and `units.mjs:200` already prints the failing run's full output on failure.

**Proposed response.** In `ci.yml` and `deploy.yml`, replace `npm run build` with `npx vite build` after the forced typecheck, mirroring `check`. Drop `--verbose` from the two shard steps; keep it available for a manual re-run. Consider sharding `deploy.yml`'s unit run the way `ci.yml` does. XS each; S together with the measurement.

**Risk.** None to correctness – the forced typecheck still runs first in every job.

### T-07 – P2 – `pin-hygiene` cannot see a negative assertion on a binding derived from `componentLogic`

**What.** `tests/pin-hygiene.test.ts:35-36` finds `const X = componentLogic(...)`, and `:50` searches for `expect(\s*X\b[^)]*\)[^\n]*\.not\.` – the bound name itself, on one line. A region cut from it under a new name escapes. Five live instances, all in `tests/screen-i-live-match.test.ts`, where `viewer`/`transport` are `componentLogic` bindings: `:170 expect(defaults, …).not.toContain('mode')`, `:280 expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}/)`, `:520 expect(options, …).not.toContain("value: 'skip'")`, `:681 expect(markup).not.toContain('Skip tournament')`, `:1163 expect(propsBlock, …).not.toContain(`. Today each cuts a region (`<style>`, the props block, the template) that a composable cannot contain, so none is a false pass; the guard simply does not know that.

**Why it matters.** The guard's own second test (`pin-hygiene.test.ts:61-64`) exists to prove the rule is not vacuous. A rule that is bypassed by `const cut = region(logic, …)` is one rename away from vacuous in the other direction: the next derived negative might be on a region a composable *does* contain.

**Proposed response.** Extend `widenedBindings` transitively: any `const Y = …X…` where `X` is widened makes `Y` widened, then apply the same negative-assertion scan. Mutation-verify with a `const cut = logic; expect(cut).not.toContain('x')` fixture. S.

**Risk.** The extension may flag the five sites above; each is then either re-pointed at `componentFile` or annotated, per the gotcha's own rule.

### T-08 – P2 – Source pins remain a second test language

**What.** Per-file classification (`inventory.txt` §B): 11 files are source-pin only, 10 mix pins with mounted tests, 59 mix pins with behavioural engine tests, 111 are mounted only, 174 behavioural only. So 80 of 365 files carry a source pin, and the it-blocks in those files (1,876) outnumber the it-blocks in mounted files (1,335). 93 test files read `style.css` – the round-36 responsive wave added CSS pins by the dozen (`docs/rounds/round-36.md:538-549, 801-822`), each mutation-verified, but each a pin on a stylesheet's text. The estate reads source through the helpers (`worldSource`/`engineModuleSource`/`componentLogic`/`componentFile` in 75 files) and strips comments in 15 of them via `codeOf`/`scriptCodeOf` (`tests/helpers/source.ts:39-52`; zero local copies remain).

A deterministic sample of 30 `it` blocks from pin-carrying files (`rv36-T/pin-sample.txt`), classified by reading each:

| class | count | examples |
| --- | ---: | --- |
| proves behaviour (engine call or mount) | 21 | `round10:302`, `college-freeze:201`, `coach-edge-card:563`, `redesign-home:88`, `r2-13-advance-span:301` |
| proves text exists (guarded; fails loudly if the text goes) | 5 | `paper-note:58` (indexOf guarded `>-1`), `prize-money:161`, `round11-view:89` (positive half), `world-trio:359`, `ui-control-system:163` |
| could pass against a deleted feature (negative-only half) | 4 | `ladder-separation:333` (`not.toMatch(/snapshot.kidRank/)` over four files), `a11y-banner-names:46-49` (a nameless `Dismiss` is "back" – passes if the banner is gone), `unranked-sentinel:78-85` (`not.toContain('?? world.cohort.length + 1')`), `round11-view:90` (`not.toContain('surface-dot')`) |

Five pins that break on a pure rename with no behaviour change:

1. `tests/prize-money.test.ts:161-162` – `expect(decl).toBe('export function prizeCentsFor(tier: TierId, finish: number): number {')`: rename the parameter `finish` and it is red.
2. `tests/screen-i-live-match.test.ts:274` – `toContain("import Card from './ui/Card.vue'")`: move `Card.vue` one directory, red.
3. `tests/round13-nav.test.ts:466` – `toContain("const WEEK_SEEN_PREFIX = 'tb:lastSeenThisWeek'")`: rename the constant (the storage key unchanged), red.
4. `tests/world-trio.test.ts:360` – `toMatch(/import \{[^}]*\bweekLabel\b[^}]*\} from '\.\.\/shared\/dates'/)`: the P4 decomposition moving that import into `world/` is red.
5. `tests/sim-serialisation.test.ts:138` – `toContain("'--project', 'unit'")`: `units.mjs` switching to `'--project=unit'` is red.
6. `tests/round11-view.test.ts:89` – `toContain('<SurfaceMark :surface="ev.surface"')`: renaming the loop variable `ev` is red.

**Why it matters.** The previous review said "a large parallel system" and asked for each new source test to declare one responsibility (policy / configuration / structure). No mechanism for that landed; the pin count moved sideways while mounted coverage grew. Over-specified pins are the ones that cost the P4 wave 17 breakages.

**Proposed response.** Bounded, on touch, as the previous review said: when a pin breaks, re-aim it as behaviour where a mount or engine call exists; where it must stay a pin, declare its responsibility in the `it` name or a one-line tag and prefer a marker `region` over a full-line literal. For the four negative-only pins above, add the positive half (the count or the presence) so deletion cannot satisfy them – `tests/college-league.test.ts:467-472` shows the house pattern ("the count first, and a mutation arm is why"). M, spread over waves.

**Risk.** Migration risk on touch only.

### T-09 – P2 – Real-browser accessibility is presence-only (QA-39 partial)

**What.** The parity harness (`e2e/parity.spec.ts`) is a strong presence instrument – role-and-name tokens plus painted assets at 375/768/900/1280 (`:156-163`), after opening every disclosure (`:590-607`), with arrival anchors and a 15-token floor (`:651`). It is not an accessibility pass: no axe/`@axe-core/playwright` in the tree (`npm ls`), no focus-trap or Escape check in a real browser. Keyboard reaches the browser in exactly two tests, `e2e/responsive.spec.ts:275` and `:388` (a stacked week by keyboard and by arrow). `docs/specs/e2e-coverage.md` §12 D1 still lists eight overlays as roleless `div`s with the focus composable a "two-line adoption" away; `tests/component/r2-07-dialog-shell.test.ts` covers four of them in happy-dom, which has no layout or focus model (`fits.ts` header, `parity.spec.ts:11-14`).

**Why it matters.** The blocking overlays are where a keyboard or screen-reader user can be stranded; the mounted layer proves the ARIA attributes exist, not that focus lands and stays.

**Proposed response.** One bounded spec: seed `pro`, raise each blocking overlay the journey helpers already know how to reach (`e2e/journey.ts` `answerOpeningKnock`, `dismissTourBriefing`), assert `getByRole('dialog')` is focused, Tab stays inside, Escape follows the documented policy. Under ten tests, chromium only, inside the existing `e2e` job. Skip a pixel matrix and a broad axe sweep, as the previous review also said.

**Risk.** Moderate flake risk in focus assertions; keep them behind the one retry the config already allows (`playwright.config.ts:59`).

### T-10 – P3 – Stale prose inside gates

**What.** `scripts/tools-registry.mjs:234`: `"tsconfig.tools.json is missing – the on-demand sweep has nowhere to run"` – it has not been on demand since 02.09 (`tsconfig.tools.json:13-19`). `ci.yml:161-163`: "The suite itself measured 31 tests in 13 files … (02.09)" – `npx playwright test --list` says 62 tests in 15 files; the figure is dated, so it is a chronicle rather than a lie, but it sits in the paragraph that justifies the job's shape. `.gitlab-ci.yml:1-7` says "mirrors the GitHub workflows … same gates as GitHub", and its `test` job (`:46-51`) runs forced typecheck + `npm test` + component + build – none of the seven doc gates, no `check:tools`, no e2e (the last two are declared exceptions at `:12-29`; the doc gates are not). Memory says GitLab is not pushed to, so this is a document that would mislead only if that changed.

**Proposed response.** Three one-line edits; for GitLab either list the gates it skips or run `npm run check` there. XS.

### T-11 – P3 – Script and dependency hygiene

**What.** `package.json:53` `"test:sim": "node scripts/sim.mjs"` and `:56` `"test:sim:quiet": "node scripts/sim.mjs"` are identical (the split mirrors `test`/`test:quiet`, `:51,55`, where the flag differs). `npx --yes depcheck`: `playwright` is imported by `tools/precache-delta.mjs:61` (`import { chromium } from 'playwright'`) and is not a declared dependency – it resolves only because `@playwright/test` hoists it; `virtual:pwa-register` is the expected plugin virtual module. `npm ls --depth=0`: 2 dependencies, 12 devDependencies, no lint/format packages; `package-lock.json` lockfileVersion 3, no second lockfile. `npm outdated`: majors behind – `pinia` 3→4, `vite` 7→8, `vitest` 3→5, `typescript` 5.9→7.0, `@types/node` 24→26; minors – `@playwright/test` 1.63, `@vue/test-utils` 2.5, `happy-dom` 20.14, `vue` 3.5.42, `vue-tsc` 3.3.11. CI pins `node-version: 22` in all four jobs (`ci.yml:57,135,149,193`, `deploy.yml:46`, `simulation.yml:117`); this machine runs Node 26.5.0; there is no `engines` field and no `.nvmrc`. Every dependency is used by more than one script except `sharp` (`scripts/gen-icons.mjs`, `optimize-art.mjs`) and `fake-indexeddb` (tests only) – both legitimate. Secrets: no `secrets.*` reference anywhere in `.github/workflows/`; `deploy.yml:30-33` uses the OIDC `id-token: write` permission for Pages, which is the right shape; no `.env*` file in the tree; `.gitignore:1-6` covers `node_modules`, `dist/`, `dist-sw/`, `dev-dist/`, `*.local`. `prepare` (`package.json:61`) wires `.githooks` via `core.hooksPath`; both hooks (`post-checkout`, `post-merge`, byte-identical) only rebuild the graph and exit 0 when the binary is absent.

**Proposed response.** Delete the duplicate `test:sim:quiet` or make it differ; add `"engines": { "node": ">=22" }` and a `.nvmrc` of `22` so the local/CI split is declared; declare `playwright` as a devDependency or import `chromium` from `@playwright/test` in `precache-delta.mjs`. Majors are a separate, owner-scheduled decision – `vitest` 5 in particular touches the birpc behaviour every runner script is built around.

### T-12 – P3 – Strictness stops at `strict`

**What.** `tsconfig.app.json:10-14`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `skipLibCheck: true`; no `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. `tests/**` is inside the app project (`:29`), so tests and `src` share one strictness – good. `tsconfig.tools.json:23` extends the app config, so `check:tools` is the same strictness – good. `tsconfig.e2e.json:21-25` repeats the same set. `tsconfig.node.json:10-12` (scripts, `vite.config.ts`) has `strict` but not the unused checks. Evidence of what the missing flags would touch: 38 non-null `!` postfixes in `src`, 28 `as any` and 25 `@ts-ignore`/`@ts-expect-error` across `src`+`tests`.

**Proposed response.** `noImplicitOverride` is free. `noUncheckedIndexedAccess` is the one that would catch real bugs in table lookups (`TIERS`, ladders) and is a measured migration, not a flag flip; try it on `tsconfig.tools.json` first, where a red is cheap. Opportunistic.

### T-13 – P3 – No ESLint or Prettier, and no tool recommended

**What.** There is no `.eslintrc*`, `eslint.config.*`, `.prettierrc*` or `stylelint` config, and no such package in `npm ls`. The honest sample of what a linter would have caught: `console.log(` in `src`: 0; `debugger`: 0; loose `==`: 8 grep hits, the first three all inside comments (`src/shared/protocol/events.ts:403`, `competition.ts:39`, `src/engine/match/liveProb.ts:30`); unused imports and locals are already compile errors (`tsconfig.app.json:11-12`). What remains is `as any` (28) and `@ts-ignore`/`@ts-expect-error` (25) across `src`+`tests`, which a `no-explicit-any` rule would surface and the project's "boring TypeScript" style already discourages.

**Cost.** A rule set to agree on, a config every agent must read, and one more gate whose red is usually cosmetic. **Benefit.** Small, per the numbers above. The project favours few tools; the evidence supports that here. If anything, a Prettier `--check` would remove formatting churn from diffs, but the codebase's comment style (long, deliberate, columnar) is exactly what a formatter fights. Recommendation: nothing now; revisit if the `as any` count grows.

## Coverage tables

### Engine, composable and shared modules (152 under `src/engine/**`, `src/composables/**`, `src/shared/**`)

Method: every `from '…'`, `import('…')`, `vi.mock('…')` in `tests/**/*.ts` resolved relative to the test file; named imports from `engine/world` mapped to their owner through `tools/generated/world-symbol-map.md` (390 symbols); transitive reach computed over `src` imports from directly imported modules; `engineModuleSource('x')`/`worldSource()` counted as "pinned". Output: `inventory.txt` §G.

| reach | modules |
| --- | ---: |
| imported directly by a test | 104 |
| reached only through the `engine/world` barrel (a symbol it owns is imported from the barrel) | 17 |
| reached only transitively (some directly-tested module imports it; no test names it) | 31 |
| no importer under `tests/**`, direct or via barrel or via src | **0** |

The 17 barrel-only modules – all also covered by `worldSource()` pins: `world/birthday.ts` (29 importing tests), `world/state.ts` (34), `world/entries.ts` (78), `world/knock.ts` (25), `world/multiWeek.ts` (6), `world/brand.ts`, `world/kit.ts`, `world/album.ts`, `world/phaseObligations.ts`, `world/phaseFinance.ts`, `world/market.ts`, `world/fame.ts`, `world/shootClash.ts`, `world/business.ts`, `world/brandStrength.ts`, `world/means.ts`, `world/knockHistory.ts`. This is the barrel working as designed, not a gap.

The 31 transitive-only modules – the honest "no test names this module" list, by size: `shared/protocol/offers.ts` (1,235 lines), `engine/diary/weekNotes.ts` (811), `engine/diary/pool.ts` (779), `shared/protocol/competition.ts` (756), `shared/protocol/events.ts` (749), `shared/protocol/snapshot.ts` (744), `engine/diary/travelNotes.ts` (671), `shared/protocol/career.ts` (620), `engine/diary/travelHome.ts` (555), `engine/world/phaseAiWeek.ts` (520, pinned), `shared/protocol/narrative.ts` (509), `engine/world/phaseHerWeek.ts` (431, pinned), `shared/protocol/profile.ts` (380), `shared/protocol/messages.ts` (340), `composables/matchReadout.ts` (327), `engine/diary/facts.ts` (233), `composables/playbackClock.ts` (228), `composables/matchAudio.ts` (197), `shared/protocol/ladder.ts` (196), `composables/dayCrossSweep.ts` (182), `engine/world/bookkeeping.ts` (171, pinned), `shared/protocol/health.ts` (155), `engine/diary/words.ts` (134), `engine/season/names.ts` (120), `composables/dialogFocus.ts` (113), `composables/matchStatTable.ts` (64), `engine/world/bookings.ts` (57, pinned), `composables/coachingBudget.ts` (54), `composables/scrollReset.ts` (52), `composables/tourBriefing.ts` (39), `composables/seasonEntries.ts` (28). The `shared/protocol/*` entries are type modules reached through the `shared/protocol` index (tests import the index); the `engine/diary/*` and `engine/world/phase*` entries are reached through `engine/diary` and `engine/world` respectively, and the phase files are also `worldSource()`-pinned. The composables are reached by mounting their components. Nothing here is untested; six composables (`dialogFocus`, `dayCrossSweep`, `playbackClock`, `matchAudio`, `matchReadout`, `matchStatTable`) have no test that calls them by name.

### Components (68 `.vue` under `src/`)

| mounted | count |
| --- | ---: |
| directly by a `tests/component/**` file | 48 |
| only through a parent that is mounted | 20 |
| never mounted | **0** |

The 20 via-parent, largest first: `BracketTabs.vue` (576 lines), `MatchControls.vue` (355, also source-pinned), `PracticeFlow.vue` (311), `SeasonHistoryTable.vue` (272), `ui/PaperNote.vue` (216), `MatchScene.vue` (178), `ui/ProgressRing.vue`, `ui/ConfettiBurst.vue`, `MuteButton.vue`, `HouseholdStrip.vue`, `ui/IconButton.vue`, `ui/Polaroid.vue`, `ui/WeatherPlate.vue`, `RankHelpDialog.vue`, `ui/PrimaryPill.vue`, `ui/AppIcon.vue`, `CountingResultsTable.vue`, `ui/ScreenShell.vue`, `ui/SurfaceMark.vue`, `ui/Eyebrow.vue`. Caveat: "via parent" is a static import-graph claim; a parent test that stubs its children renders nothing of them. `BracketTabs`, `PracticeFlow` and `SeasonHistoryTable` are the three worth a direct mount.

### e2e – screens and surfaces × flows (62 tests, 15 files, `playwright-list.log`)

| screen / surface | reached by (spec: test) | flows exercised | not exercised |
| --- | --- | --- | --- |
| `HomeScreen` | smoke; week-advance ×3; persistence ×2; tournament; tournament-entry; sponsor-inbox; storage-recovery ×3; responsive:35; seeded-careers ×6; parity (station + rail guards) | boot, advance, stop reasons, reload, entry echo, contract echo, presence at 4 widths | – |
| `ThisWeekScreen` | week-advance; tournament; responsive:171; parity | arrival after a resolved week, 375 fit, presence | practice planning from here |
| `MoneyScreen` | week-advance:92; tournament; sponsor-inbox; responsive (Bills, shelf); parity (station + shop door + one shelf) | ledger fed by the tick, contract lands, sub-tab fit, presence | a purchase, History chapter, brand naming, fund units |
| `MoreScreen` | save-file ×2; onboarding-tour:156,176; parity | export/import, tour re-ask, presence | settings toggles' effects, dev fast-forward |
| `SeasonScreen` | tournament-entry; responsive ×3; parity (station + stacked-week room + pager guards) | enter an event, keyboard/arrow paging, presence | withdraw, Plan-week sheet, vacation, friendly seed |
| `CalendarScreen` | tournament-entry (third reader); parity | entry echo, presence | entering through its own takeover |
| `StatsScreen` | parity | presence | ladder switch behaviour |
| `TrophiesScreen` | parity (and `park()` visits it in every parity walk) | presence | cabinet interactions |
| `KidScreen` | parity | presence | – (read-only by design) |
| `CoachMarketScreen` | parity | presence | hiring, masseur, coach travel |
| `MatchViewer` | parity room (`junior`, "Watch match") | presence at 4 widths | playback controls, skip, replay |
| `TournamentFlow` (reveal/play) | tournament; persistence:58 | reveal, play out, pause survives reload | withdraw mid-event |
| Prologue / onboarding wizard | prologue ×2; smoke | nine cards, handover, first card is a scene | the alternative paths |
| `OnboardingTour` | onboarding-tour ×6 | show, step, dismiss, no-return, interrupted, tab change ends it | – |
| `KnockDialog` | every seeded walk via `answerOpeningKnock` (journey.ts) | answered as a step | asserted as a flow (rest vs push consequences) |
| `TourBriefingDialog` | every seeded walk via `dismissTourBriefing` | dismissed as a step | its content |
| `InboxSheet` / `OfferLetter` | sponsor-inbox | sign a kit letter | decline, other letter types |
| `EndingScreen` | seeded-careers:133 (`ending`) | boots into the epilogue | reaching an ending by play |
| `BirthdayDialog`, `ForkDialog`, `RetirementDialog`, `InjuryStopDialog`, `ShootClashDialog`, `CollegeDoneDialog`, `PlanWeekSheet`, `RankHelpDialog` | – | – | **not reached by any e2e test** |
| Storage recovery screen | storage-recovery ×3 | unopenable DB, retry, damaged autosave | – |
| Service worker / offline | offline ×2 (`chromium-sw` project) | boot offline, art precached | update flow |
| Coverage map itself | coverage-map ×3 | the doc matches the tree | – |

Fixtures used: `fresh`, `junior`, `pro`, `sinking`, `broke`, `ending` (`e2e/fixtures/*.tsave`, seeded at a fixed `Date.UTC(2026, 7, 8, …)`, `e2e/careerAt.ts:58`). The college second act, the school fork, retirement, injury stop, birthday and the shoot clash have no browser test; all have mounted tests.

### Inline-timeout list

See T-05 for the 30 bulk-pool files by budget; the complete 136-entry list with line numbers is `inventory.txt` §D (scratch), and the per-file summary is `timeouts-per-file.txt`. The other budget carriers: `sim` – 11 files at 240 s (`vi.setConfig`); `unit-heavy` – `economy` 240 s, `endings-bench` 240 s, `college-birthday` 120 s, `kidLife` `{timeout: 30_000}`, `radar`/`radar-read`/`radar-training` 30 s inline; `component` – 16 files at 30–60 s via `vi.setConfig`, `match-viewer-parity:360` 120 s inline.

### Shared-cache list

The ten sites are tabulated in T-05. Summary: 10 instances, 0 under `beforeAll`, 0 with an explicit hook budget, 0 consumers found mutating the cached value.

## Gate inventory

| gate | enforces | false-negative mode | tested itself? | runs in CI? |
| --- | --- | --- | --- | --- |
| `scripts/context-audit.mjs --check` | required context files exist; frontmatter statuses valid; canonical docs well-formed and one per area; correction pairs superseded; broken local links; size budgets of the 8 recurring files; age-grid contradictions vs `calendar.ts`; new unclassified docs vs baseline | edits to the 135 grandfathered docs (T-03); source-size budgets are "warnings, never a failure" (`:757`); `newlyOver`/`growing` never fail (`:779-786`); link check skips fenced blocks by design | no | yes (`ci.yml:66`) and first in `check` |
| `scripts/doc-facts.mjs` | `SAVE_SCHEMA_VERSION` in `state.ts` equals the sentence in `docs/context/saves-and-worker.md`; newest `docs/rounds/round-N.md` equals the live-wave line in `now-next-later.md` | the two facts only; a doc that removes the sentence is caught (`:39,57`) | no | yes (`:71`) |
| `scripts/engine-purity.mjs` | no `from 'vue' \| 'pinia' \| '@vue/…' \| 'vue-router'` in `src/engine`, `worker`, `db`, `shared` (`:14-15`) | dynamic `import('vue')` and `require` are not matched; a comment containing the string fails loudly (false positive, safe direction) | twin in `tests/engine-viz-direction.test.ts:45` (same zones, different direction) | yes (`:72`) |
| `scripts/pin-ratchet.mjs` | no new `.slice(… indexOf …)` in `tests/` beyond a 3-entry baseline | `indexOf` result held in a variable then sliced (`:30-34`, declared and deliberate); `substring`/`substr`; `.search()`; the `moduleFunction` shape (T-01) | no | not in `ci.yml`; in `check` (`package.json:11`) |
| `scripts/decision-index.mjs --check` | the generated area→current-entry table in `docs/decisions.md` matches the dated headings | an entry whose heading matches no area keyword is filed `general` silently (`:111-114`); dating is by heading only | no | not in `ci.yml`; in `check` |
| `scripts/world-map.mjs --check` | `tools/generated/world-symbol-map.md` matches the barrel's real owners (TypeScript AST) | none found; it is AST-based | no | yes (`:93`) |
| `scripts/tools-registry.mjs --check` | `tools/README.md` matches the tree; `tsconfig.app.json`'s `tools/` list equals the live set; `tsconfig.tools.json` exists | live-ness is command/instrument/imported-by-tests/sibling-import (`:118-132`); a tool imported only from `scripts/` or `e2e/` via a non-`../tools/` path is archival | no | yes (`:98`) |
| `scripts/schema-ladder.mjs --require` | a branch at main's schema version has a byte-identical migration step for that version | needs `origin/main`; `--require` makes a missing ref fail (`:78`); step extraction is brace-walked (`:55-69`) | no | yes (`:85-86`), CI-only by design |
| `check:tools` (`tsconfig.tools.json`) | all of `tools/**/*.ts` typechecks under the app project's strictness | none; green now (`gate-check-tools.log` EXIT=0) | – | yes (`:108`) |
| `vue-tsc -b --force` | app, node, e2e projects | the second, incremental run inside `build` (T-06) | – | yes, twice (`:101`, `:125`) |
| `scripts/units.mjs` + `lib/stall.mjs` | unit project in two shards; a non-zero exit with no `N failed` line is retried once as a stall (`stall.mjs:42-48`) | a stall twice still exits 1 (`units.mjs:196-206`) – no green-on-red path found; "stalled" is inferred from reporter text only | `tests/sim-serialisation.test.ts:121-140` reads its source for the unit flags; `classify()` itself untested | yes (`:138`, `:152`) |
| `scripts/sim.mjs` | sim project one file at a time, `--no-file-parallelism --reporter=dot` (`:84`) | same stall inference | `tests/sim-serialisation.test.ts:93-119` parses the argv | weekly cron + dispatch (`simulation.yml:105-106,120`) |
| `scripts/e2e.mjs` | Chromium present; ports 4173/4174 free; then `playwright test` | the port list is regex-parsed from `playwright.config.ts` (`:46`), throws if none found | no | yes (`:205`) |
| `scripts/heavy-tests.mjs` | one declaration of the heavy lists for config and both runners | a file listed in neither pool is bulk by default | `tests/sim-serialisation.test.ts` indirectly | – |
| PR checklist job (`ci.yml:20-33`) | no unticked `- [ ]` box in the PR body | a ticked box is trusted (`pull_request_template.md` says so) | – | yes |
| `tests/pin-hygiene.test.ts` | no `componentLogic` binding in a `.not.` assertion; the rule is in use; the old name is gone | derived bindings (T-07) | mutation-verified per CLAUDE.md; no test of the guard's regex | in the unit suite |
| `tests/goldenSaves.test.ts` | one fixture per schema version 0…70, each migrates and satisfies invariants | none found; one `it` per file | – | in `unit-heavy` |
| `e2e/coverage-map.spec.ts` | the screens table equals `src/components/screens/`; every spec is in the journeys table; every mechanic cites an existing spec doc | a row's *decision* is free text (`:76`) | – | in `e2e` |
| `e2e/parity.spec.ts` | same role/name tokens and painted assets at 375/768/900/1280 for 10 screens + 4 rooms, minus two container-bounded exemptions, each with four guard tests | see below | the deliberate break is a recorded manual procedure (`round-36.md:201-240, 776-800`), not an arm in the suite | in `e2e` |
| `.githooks/post-checkout`, `post-merge` | rebuild the code graph in the background | exit 0 when the binary is absent (`:9`) | – | local only; wired by `prepare` |

**On the parity harness specifically.** It proves that at each of four exact widths and one height the same multiset of `{role, accessible name}` tokens for 22 roles (`:329-352`) and the same set of image/mask/background assets (`:498-542`) is reachable after every disclosure is opened, for one career state per station; a station that fails to arrive fails at its anchor (`:1544-1547`) and a near-empty fingerprint fails the 15-token floor (`:651`, `:1552-1557`). The two exemptions are containers, not name lists (`:383`, `:403`); each has four guard tests, and the ones that matter for "can a control disappear unnoticed" are `:981-1031` (the rail dashboard holds no interactive role and no focusable element, checked twice) and `:1286-1355` (a pager holds exactly `Back`/`Next` and nothing else, and no pager exists outside a week row). The subtraction is once-per-token (`:412-422`), so a control that exists both inside the dashboard and elsewhere is not swallowed. **What can still disappear unnoticed:** anything at a width that is not one of the four – a `@media (min-width: 901px) and (max-width: 1279px)` rule hiding a control would pass; anything in a career branch no station walks (`:44-46`, stated); a text block or `group`/`region`/`status` node, since those roles are not fingerprinted; a control clipped by overflow but still in the tree. **The sensitivity control** is not present in the suite: it is the recorded manual mutation (hide `.diary-tool` at ≥1024 → `BREAK_EXIT=1` naming five tokens; re-run at phase 3 against `.strip-more`), reverted and checksummed. Would it catch a regression today? For the shape it was aimed at – a control hidden at a tested width – yes, by construction of `missingFrom` (`:655-666`); for the gap widths, no. A permanent, cheap sensitivity arm is possible: inject a `<style>` hiding one known control at 1280 via `page.addStyleTag` and assert the walk names it – that turns the ledger's procedure into a test.

## Since the 2 September review

| finding | status now | evidence |
| --- | --- | --- |
| QA-34 `check:tools` red, outside every gate | **Fixed** | `gate-check-tools.log` EXIT=0; `package.json:11` includes `npm run check:tools`; `ci.yml:108`; `tsconfig.tools.json:13-19` records the fix |
| QA-35 edited-document ratchet does not observe edits | **Open** | `context-audit.mjs:19-20` still promises it; `:679-689` still checks membership; baseline dated 2026-08-24 (T-03) |
| QA-36 false routing facts | **Fixed** | schema and live wave are machine-owned (`doc-facts.mjs:32-62`, "ok – schema v70, live wave round 36"); `docs/context/saves-and-worker.md:15` names `world/state.ts`; `docs/context-index.md:52` no longer quotes tool counts; no e2e count survives in `e2e/README.md`, `now-next-later.md` or `e2e-coverage.md` (grep for `N tests`: none) |
| QA-37 e2e "smoke" label | **Fixed** | job renamed `e2e` (`ci.yml:186`), comment corrected (`:155-183`); the dated "31 tests in 13 files" remains as chronicle (T-10) |
| QA-38 source pins a second language | **Unchanged** | 80 pin-carrying files, 1,876 it-blocks; no responsibility classification mechanism landed (T-08) |
| QA-39 real-browser a11y thin | **Partial** | the parity harness is a real-browser presence pass at four widths (new, strong); no axe, no focus pass; D1 still lists eight roleless overlays (T-09) |
| QA-40 CI double typecheck, verbose shards | **Open** | `ci.yml:101` + `:125`; `deploy.yml:51` + `:55`; `--verbose` at `:138,152` (T-06) |
| P-01 acceptance "mutating a legacy unclassified doc makes the audit red" | **Not met** | same as QA-35 |
| P-05 "CI still catches a type-only re-export build failure and emits materially less green output" | **First half holds, second not** | forced `vue-tsc -b` first in every job; output unchanged |

## What is good

- **The runner scripts never launder a red.** `scripts/lib/stall.mjs:42-48` classifies a non-zero exit with no `N failed` line as a stall and retries once; `units.mjs:196-206` and `sim.mjs:136-148` still set `exitCode = 1` on a second stall and print the failing output. No path was found where a red run reports green.
- **The gate order fails on its cheapest step.** `package.json:11` and `ci.yml:66-108` run seven seconds-long doc gates before the typecheck, and `ci.yml:36-52` gives every job a ceiling with the measurement that sized it.
- **`tests/sim-serialisation.test.ts:93-140`** is a gate on the gates: it parses every `vitest run` invocation in `package.json` and the argv arrays inside the runner scripts, so a script that runs the sim project without `--no-file-parallelism` or without `--reporter=dot` is a unit failure, and `:111-119` proves the rule is not passing by proxy.
- **`tests/goldenSaves.test.ts:34-46`** – one fixture per schema version 0…70, one `it` per fixture, `readdirSync` at module level so a missing fixture is a named failure, not a shorter loop.
- **`tests/college-league.test.ts:467-472`** – "the count first, and a mutation arm is why": the house pattern that makes a `.every()` unable to pass on an empty array, written down where it is used.
- **`tests/helpers/source.ts`** – one comment stripper with two deliberate variants and a header (`:1-28`) that explains why merging them would make pins read less; `tests/helpers.test.ts:20-46` guards that they still differ.
- **The parity harness's own anti-vacuity** – derived screen list (`parity.spec.ts:168-171`, `:673-683`), arrival anchors before every measurement, a fingerprint floor, container-bounded exemptions each with an "is doing real work" test (`:1033-1068`, `:1459-1506`), and the honest half of the pager ruling asserted as a biconditional at four widths (`:1399-1457`).
- **`e2e/careerAt.ts`** seeds IndexedDB inside the database-creation transaction with a fixed timestamp (`:58`), so every browser test starts from bytes the engine wrote and no e2e test depends on the clock.
- **`tsconfig.e2e.json:28-48`** – the "dependency-free or not at all" rule for what a spec may import, enforced by TS6307 rather than by review.
- **`tests/component/fits.ts`** – a floor model that under-counts and never over-counts (`:27-33`), so a red is always true and a green depends only on the height cap; 22 files use it.
- **Zero vacuous tests, zero real randomness, zero real time** in 5,556 blocks – the numbers in the Method section, verified by script and re-read.
