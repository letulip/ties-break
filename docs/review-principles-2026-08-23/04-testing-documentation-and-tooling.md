---
type: review
status: audit
area: testing-tooling
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Testing, documentation and tooling

## Verdict

The verification architecture is much stronger than in the first broad review. Four real layers now
exist: unit, mounted component, deterministic simulation and Playwright over a production build.
The normal gate also checks documentation structure, engine purity, the generated world map,
TypeScript, unit/component behaviour and the production build.

The principal weakness is no longer “not enough tests.” It is that several tests and documents do
not guard what their names claim, while the source-pin subsystem continues growing alongside the
better behaviour layers.

## Strengths to preserve

- Historical save fixtures and append-only migrations are proportionate to the product's long-lived
  local data.
- The worker's transactional/CAS/restart tests cover real integrity failure paths.
- Mounted tests expanded to 56 files and Playwright to 13 specs.
- Playwright exercises real build, worker, IndexedDB, import and service-worker seams rather than
  snapshotting incidental markup.
- Simulation remains weekly/on-demand in CI and is run locally during PR assembly; do not put its
  20+ minute two-core run back in every GitHub PR.
- `scripts/heavy-tests.mjs` is now the single source for heavy unit/sim file lists.
- `context:audit`, engine-purity and the generated 269-symbol world map pass on the reviewed commit.
- Quiet/sharded runners retain complete failure signal while reducing log/context volume.

## Findings

### QA-01 – P1 – The sim-serialization test no longer tests the real sim runner

`tests/sim-serialisation.test.ts:26-55` scans package scripts only when their command contains the
literal `vitest run`. `package.json` now routes `test:sim` and `test:sim:quiet` through
`scripts/sim.mjs`, where the critical flags actually live at `scripts/sim.mjs:80-85`.

The test therefore finds `test:all`, satisfies its non-vacuous assertion and remains green if
`--no-file-parallelism` or the dot reporter is removed from the real sim runner. That is the exact
red-with-all-tests-green failure the file claims to prevent.

**Fix:** export a pure sim-argument builder used by `runFile`, and test that function or the actual
spawn arguments. Do not return to parsing TypeScript/config source strings.

### QA-02 – P1 – The import-cycle guard is a binary file to Git and search tools

`tests/import-cycles.test.ts:71,135` contains two literal NUL bytes as map-key delimiters. `file`
classifies it as `data`, Git shows it as `Bin`, and normal `rg` reports a binary match or skips its
contents.

The detector itself is valuable and mutation/self checked. Its encoding is the defect.

**Fix:** use escaped source text such as `\0`/`\u0000`, or one printable `edgeKey` helper. Add a
cheap tracked-text NUL check scoped to known text extensions, preferably in an existing hygiene
script rather than a new subsystem.

### QA-03 – P1 – Context audit omits the repository's declared retrieval authority

`AGENTS.md` says `CLAUDE.md` carries the full invariant contract and wins on overlap. Yet
`scripts/context-audit.mjs:13-21,416-419` neither requires nor audits it. `CLAUDE.md` is about 5,000
estimated tokens and already contains stale unit-count/simulation-time statements.

**Fix:** add `CLAUDE.md` to required/linked inputs and give it a recurring size budget. Prefer
removing volatile counts/timings in favour of commands/owners. A compact testing/tooling context
pack would provide a better task route than reading the whole file for every test change.

### QA-04 – P1 – Current testing and narrative documents are machine-green but false

- `docs/specs/e2e-coverage.md:34-41` says 105 unit, 12 component, 9 sim and 12 e2e files; current
  inventory is 171, 56, 10 and 13.
- `e2e/README.md:11` hard-codes an obsolete test count.
- `.github/workflows/ci.yml:81-90` says one smoke spec, while `:118` runs the whole e2e suite.
- `docs/context/saves-and-worker.md:15-20` says v53 while runtime/fixtures are v59.
- `docs/now-next-later.md:26-42` says round 22 is live while main has merged round 25.
- `docs/decisions.md:2390-2407`, `docs/specs/birthday-and-gifts.md:198-202` and
  `src/shared/protocol.ts:1003-1009` say college birthdays do not pause or enter the ledger; current
  implementation/tests do both.
- `docs/plans/college-the-flow.md:14-15` says the flow is unbuilt.

Coverage-map tests check membership/links, not these numeric or semantic claims.

**Fix:** correct status/current truth, mark superseded plans/rulings rather than erasing them, and
delete or derive low-value point-in-time counts. Add only a few mechanically sourced facts; do not
try to make a general semantic-doc parser.

### QA-05 – P2 – Source-pin debt improved in kind, not volume

The repository has good central helpers in `tests/worldSource.ts` and a useful pin-hygiene test.
Mounted/component/e2e layers grew. A broad current query still finds about 86–90 source-reading test
files, 49 with raw `indexOf`/`lastIndexOf`, and hundreds of re-aim/re-pin annotations.

The existing hygiene rule prevents one class of widened negative component assertion. It does not
mechanically stop a missing-marker slice from returning `-1` and proving nothing.

**Policy:**

- retain source tests for dependency direction, no `Math.random`, legal/assets/configuration and
  runner flags;
- use one helper that throws if either source-region marker is absent;
- ratchet new raw marker slices rather than rewriting all historical tests;
- migrate copy/layout/interaction pins to mounted tests when their owning feature is touched;
- retire meta-infrastructure only as consumers disappear.

### QA-06 – P2 – CI spends output and CPU twice

Repository guidance prefers `test:quiet`, but CI runs verbose `npm test` at
`.github/workflows/ci.yml:75`. CI also runs forced `vue-tsc` at `:70`, then `npm run build` at `:79`,
whose package script typechecks again. The local `check` command correctly finishes with `vite
build` after its forced typecheck.

**Fix:** run the quiet unit wrapper in CI and call `vite build` after the forced typecheck. Keep
failure summaries and the separate parallel e2e job.

### QA-07 – P2 – Tools still lack a lifecycle

There are 136 top-level TS/MJS tools, while package scripts expose only the supported subset.
`tsconfig.app.json` includes every `tools/**/*.ts`, so archival probes tax the main typecheck.
`tools/match-clock-probe.ts` and `tools/fork-birthday-probe.ts` explicitly call themselves
throwaway but remain committed.

**Fix:** add a compact registry with class (supported bench / reproducibility instrument / archival
probe), command, owning spec and last-run date. Move archival tools to an on-demand tools tsconfig.
Delete only probes whose evidence is preserved and whose result is no longer reproducible/useful.

### QA-08 – P3 – Three conventional project signals remain absent

- No ESLint configuration or command.
- No unit/component coverage report.
- Version remains `0.1.0` with no release tags, changelog or visible build id.

These are not automatically defects in a solo MVP. Adopt them only at the smallest useful level:

1. correctness-oriented lint rules with demonstrated value (async misuse, Vue template errors,
   impossible fallthrough), avoiding a style-war ruleset;
2. report-only unit/component coverage first, with no threshold until the baseline is understood;
3. a release/build identifier and short changelog when external testers need reproducible bug
   reports.

## Recommended test responsibility map

| Question | Best owner |
| --- | --- |
| Pure scoring/economy/schema fact | Unit test |
| Vue state, focus, labels, conditional rendering | Mounted component test |
| Worker + IndexedDB + build/service-worker seam | Playwright production-build test |
| Career distribution or calibration | Serialized simulation/bench |
| Dependency direction, forbidden API, runner flag | Source/static test |
| Visual phone fit | Mounted geometry plus targeted real-browser/device check |

The aim is not a pyramid-shaped percentage. It is that each claim is tested at the lowest layer that
can actually observe it.

## Verification performed for this review

- `node scripts/context-audit.mjs --check --json` – pass; zero structural warnings.
- `node scripts/world-map.mjs --check` – pass; 269 symbols.
- engine-purity script – pass in the independent tooling review.
- Optional graph check reported the local graph absent, which is an expected optional state.

The full unit/component/build gate was intentionally deferred until the documentation set was
complete and the parallel review agents had stopped.
