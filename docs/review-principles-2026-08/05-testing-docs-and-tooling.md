---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Testing, documentation, and tooling

## Testing verdict

The suite is deep and product-aware: about 3,500 test declarations, 42 mounted-component files,
separate deterministic simulation work, E2E smoke specs, source-policy guards, migration fixtures,
and a full production build gate. Save compatibility, RNG discipline, worker transaction behavior,
and balance evidence justify a test corpus roughly as large as production code.

The cost is that implementation text itself has become a second test interface.

## TB-09 — P2: source inspection is a parallel test architecture

At least 59 tests visibly read source for assertions; 77 use `readFileSync` more broadly. Depending
on helper definition, the count reaches 83. `tests/worldSource.ts` concatenates `world.ts` and every
`world/*.ts` file because earlier decomposition invalidated file-local pins. Its SFC helpers exist
for the same reason. `tests/pin-hygiene.test.ts` then scans tests to police these readers.

Representative problems:

- `tests/round13-nav.test.ts:66-100,137-165` parses literal tabs, mount strings, and absence of old
  placeholders instead of mounting navigation behavior;
- `tests/round12.test.ts:503` asserts an identifier occurrence count;
- a slice between moved markers can return `-1` and silently swallow the remaining file, creating a
  false green;
- splitting `world.ts` does not reduce source-pin retrieval because `worldSource` concatenates all
  the pieces.

Some source tests are exactly right. `tests/money-format.test.ts:50-116` enforces a static policy
against local money formatters; no-`Math.random`, forbidden dependency, licensed asset, and required
runner-flag checks also describe source structure as the behavior.

**Policy:**

- allow new source pins only for static architecture/policy that is costly or impossible to prove
  behaviorally;
- require marker helpers to fail if either marker is absent;
- convert high-churn navigation, Calendar, MatchViewer, and copy/layout pins to mounted behavior
  when those features are next touched;
- delete helpers only as the last consumer disappears.

This is an incremental migration, not a purge.

## Test infrastructure DRY

Exact repeat uses now justify a few helpers:

- `snapshotAfter` in eight mounted tests;
- `fnv1a` in five engine tests;
- the worker `send` harness in four worker tests;
- comment-stripping `codeOf` in seven source tests;
- `mountSeason` in three tests.

Create focused `tests/helpers/career.ts`, `workerHarness.ts`, and `source.ts` modules. Preserve local
scenario construction; a universal fixture builder would hide the very preconditions tests need to
show.

## Heavy test configuration has two truths

The authoritative simulation file list is at `vite.config.ts:106-124`, then parsed from TypeScript
source with a regex in `scripts/sim.mjs:74-80`. Unit-heavy files appear at
`vite.config.ts:161-178` and are duplicated manually in `scripts/units.mjs:107-123`. A rename can
omit, duplicate, or unexpectedly parallelize an expensive file.

Move both lists to one small importable MJS or JSON module and share one glob-to-file normalizer
between Vite and runners. Preserve serialization, sharding, retry/stall handling, and quiet output:
the birpc wall is measured, not speculative complexity.

## TB-03 — P1: canonical context is materially stale

The low-token retrieval route currently directs agents to false present state:

- runtime `SAVE_SCHEMA_VERSION` is 52 at `engine/world.ts:393`, but
  `context/saves-and-worker.md:15-18` says v45 and flags its own drift;
- `context/simulation-and-balance.md:20` says v36;
- `context/economy-and-progression.md:20-21` says bankruptcy is the only stop reason and refers to
  v37/v38 as reserved;
- `context/product-and-narrative.md:17` says complete endings/epilogue are absent, while
  `world/endings.ts:393-425` builds the ending view and `EndingScreen.vue` ships it;
- `context-index.md:17,51` routes delivery work to August roadmap/launch documents that plan schema
  v35 onward, while runtime is v52;
- README still labels the project “Concept / planning phase” beside a mature live MVP;
- CLAUDE carries obsolete source/test/graph counts.

The packs were last reviewed on August 3; 146 documents changed after that date. Yet
`npm run context:audit --check --json` passes with zero warnings because it validates structure,
links, metadata, and budgets, not semantic truth.

**Correction:**

1. refresh the five context packs from current code/tests;
2. replace dated delivery routes with one compact current “now / next / later” document;
3. mark obsolete roadmap/launch documents historical or superseded;
4. remove volatile counts and schema numbers from canonical prose where they add no routing value,
   or derive/check them mechanically;
5. run `context:audit` in CI, while acknowledging it cannot prove semantic freshness;
6. add a review trigger when schema/endings/major routes change without the relevant pack changing.

The retrieval system is useful; stale canonical compression is more dangerous than no compression
because it is confidently wrong.

## Conflicting “current” specifications

Both the original and corrected acceptance-cuts specs are `current`; the same is true for original
and corrected junior-access specs. The corrected junior document explicitly says the prior
measurement is superseded. The audit rejects duplicate `canonical: true` documents for one exact
area but does not reject current `-corrected` pairs or newly unclassified prose.

Mark pre-change measurements `audit` or `superseded`, add `superseded-by`, and retain one current
mechanic-state document per domain. Extend the audit to flag original/`-corrected` pairs both marked
current and reject newly added unclassified documents. Do not try to reclassify the entire history
in one wave.

## Source comments are a stale specification layer

Examples verified against current behavior:

- `protocol.ts:21-22` says `playStyle` only weights future growth, while
  `development.ts:409-416` uses it for current coach fit/growth;
- `protocol.ts:36-38` calls birth month cosmetic/future, while `world.ts:2495` and
  `world/age.ts:82-104` use it in simulation;
- `world.ts:430-431` calls cohorts a Phase-4 placeholder though the conveyor is implemented in
  `season/cohort.ts:280-304`;
- `OnboardingWizard.vue:82-86` calls Coach Market a later slice although its screen is live.

`docs/decisions.md:2042-2058` records rulings copied out of Vue comments without consistently
removing the source histories. The result is two or more present-tense truths.

Adopt a touch-as-you-go rule:

- source keeps the current invariant, reason, and failure mode in one to four lines;
- source may link one decision/spec ID;
- incident chronology, owner quotes, benchmark tables, and rejected alternatives live in docs;
- when a ruling moves to the decision archive, remove or rewrite the old narrative at its source.

Do not run a bulk comment purge; rationale around determinism, migrations, and non-obvious browser
failures is valuable.

## Decision archive and document lifecycle

`docs/decisions.md` is 2,150 lines and roughly 40.9k estimated tokens. It is useful as an append-only
archive but not as a low-context current-decision interface. Add a compact area index with decision
IDs and statuses. Split bodies into ADRs only if actual ownership/search needs it; copying each body
to another index would make DRY worse.

Of 243 Markdown files, only 105 have frontmatter; 138 are unclassified and 68 say current, including
47 current specs. Going forward, every new document should declare lifecycle metadata. Historical
cleanup should be bounded by active retrieval paths rather than performed wholesale.

## Tool lifecycle and typecheck cost

There are about 119 TypeScript tools but only 18 package-script entry points, and
`tsconfig.app.json` includes all `tools/**/*.ts`. Investigation programs therefore become permanent
main-typecheck and retrieval surface.

Add a compact tools registry with:

| Class | Meaning | Required metadata |
| --- | --- | --- |
| Supported bench | Regular product/balance command | Package command, owner/spec, expected runtime |
| Repro instrument | Preserves evidence for a decision/bug | Linked decision, seed/data, last verified |
| Archival scratch | One-off investigation, not a gate | Reason retained or deletion date |

Move archive-only tools to `tsconfig.tools.json` or delete truly disposable probes. Keep balance and
save reproducibility instruments; they are part of product evidence even if run infrequently.

## CI and static hygiene

- `npm run check` correctly runs context audit, forced TypeScript, unit tests, component tests, and
  the production build. `vue-tsc` alone is not sufficient because type re-export mistakes can fail
  only in Vite production build.
- The main GitHub workflow manually runs typecheck/tests/component/build and currently omits the
  context audit. Align it with the intended gate or run `npm run context:audit` explicitly.
- TypeScript's unused-local checks do not find unused exports. A periodic exported-symbol audit is
  reasonable; do not add a mandatory dependency without evaluating its signal/noise.
- If adding ESLint, focus on correctness and dependency boundaries. A formatting-rule campaign
  would generate high churn and little product value.

## Tooling strengths to preserve

- Graph tooling was adopted only after a measured comparison showed grep wins impact work and graph
  queries help orientation; this is good YAGNI.
- Quiet unit output saves thousands of tokens without reducing signal.
- Simulation serialization and stall diagnostics answer a real 60-second task-ack limitation.
- Context audit gives useful structural guarantees even though it cannot establish semantics.
- Build plus mounted tests catch failures that source pins and `vue-tsc` alone can miss.
