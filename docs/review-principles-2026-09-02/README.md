---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-02
baseline: c6114b71561e39a042239dfcc179e7e6a3c8db66
---

# Ties Break project review – 2 September 2026

> Point-in-time audit of `origin/main` at `c6114b71`. Runtime code and tests remain authoritative;
> context packs route to that evidence. This review revisits the August findings and proposes work,
> but does not redefine shipped behaviour or override owner decisions.

## Executive verdict

Ties Break is in substantially better technical shape than it was on 23 August. The highest-risk
integration problems from the previous review were not merely renamed: structured injury facts,
typed worker replies, the engine/presentation dependency direction, dialog focus management,
protocol decomposition, persisted-state extraction and an explicit weekly phase recipe all landed
with focused guards. `world.ts` fell by about half while determinism, save migration and worker
ownership remained intact. No P0 or P1 runtime-correctness defect was found in this review.

The risk has moved rather than disappeared:

- **Truth and reproducibility are the immediate integrity problem.** `npm run check:tools` is red
  with nine TypeScript errors across six archival tools, while the normal `check` and CI gates do
  not run it. Several current routing documents contain false schema, symbol-owner, tool-count or
  e2e-count facts. The promised “edited legacy document must gain metadata” ratchet does not inspect
  edits at all.
- **Architecture is now locally uneven, not globally unsound.** Engine and protocol boundaries are
  healthy; the largest retrieval/ownership costs are `MoneyScreen`, `App` and `SeasonScreen`, plus
  comment-heavy engine modules. Another broad engine decomposition would have lower value than one
  or two measured UI extractions.
- **The distinctive product promise remains incomplete.** The college second act, endings, adult
  narrative knowledge and final-retirement agency improved. At the school fork and an earlier
  retirement scene, however, the parent can still decide against her expressed preference. No
  relationship, morale or burnout mechanic ships. More commercial/economy breadth should follow,
  not precede, one complete adult-agency and relationship beat.
- **The test estate is deep but its surrounding truth is weaker than its execution.** Four test
  layers, deterministic fixtures and architectural guards provide strong protection. Source-text
  tests remain a large parallel system; real-browser accessibility/device coverage is thin; CI
  repeats typechecking and deliberately chooses verbose unit output.
- **Context volume is now a first-class delivery cost.** Documentation is approximately 1.78
  million estimated tokens and source comments are growing faster than the code in several core
  modules. The answer is not deletion or arbitrary quotas: it is generated volatile facts, compact
  default reports, explicit exception decisions and one current route to each body of truth.

The recommended sequence is therefore: restore trustworthy gates and routes; reduce context output;
extract one proven UI ownership seam; tighten test responsibilities; then deliver one visible adult
agency beat. Do not start a framework rewrite, generic relationship engine or repository-wide
comment purge.

## Scope, method and confidence

Three independent review lanes covered:

1. DRY/KISS/YAGNI/SOLID, module ownership and the previous architecture findings;
2. product promise, plot, interaction design, career mechanics and the previous product findings;
3. tests, documentation, tooling, CI and token/context costs.

The review began at [the context index](../context-index.md), used the relevant context packs, then
checked claims against narrow code/test evidence. It compared the current tree with the
[23 August review](../review-principles-2026-08-23/README.md), the
[28 August audit](../rounds/AUDIT-2026-08-28.md) and subsequent round records. Focused agent runs
covered 228 tests across architecture and product surfaces; the final verification section records
the repository-level gates.

Severity means:

| Level | Meaning in this review |
| --- | --- |
| P0 | Release/data-integrity blocker or invariant breach |
| P1 | Current truth, reproducibility or core product-promise failure that should lead the next wave |
| P2 | Material maintainability, experience or coverage risk with a safe bounded response |
| P3 | Opportunistic simplification or explicit owner decision; not a cleanup mandate |

Effort uses **XS** (under one focused day), **S** (1–2 days), **M** (3–5 days), **L** (1–2 weeks)
and **XL** (3+ weeks plus design/calibration). These are focused-effort sizes, not calendar promises.

## Change map and present scale

The project has continued to grow while paying down major boundary debt.

| Measure | 23 August | 2 September | Interpretation |
| --- | ---: | ---: | --- |
| Production TS/Vue files | 189 | 235 | Product breadth and decomposition both grew |
| Production lines | 91,941 | 113,083 | About 23% growth in ten days |
| Test/e2e TS files | 247 | 360 | Protection grew faster than production file count |
| Test/e2e lines | 96,020 | 137,616 | Golden fixtures contribute heavily but do not explain all growth |
| Top-level tool files | 136 | 176 | Bench/probe surface expanded; reproducibility did not keep pace |
| Markdown documents | about 265 | 345 audit inputs | Retrieval cost is now material |
| Estimated documentation tokens | about 1.30m | about 1.79m | More than a one-session corpus; routing quality matters |
| `world.ts` lines | 4,269 | 2,075 | The risky hub extraction succeeded |
| `world/` modules | 27 | 47 | Stable owners were separated without hiding the weekly recipe |
| Mounted component test files | 56 | about 108 | Strong movement away from source-only UI confidence |
| Source-reading test files | about 90 | about 106–108 | Still growing despite the raw-slice ratchet |
| Engine/world barrel importers | about 320 | 446 | Compatibility is useful, but the retrieval fan-in remains high |

The context audit is green, yet its delta report says 17 source files newly exceed budget and 36
grew. This is useful evidence, not a failure by itself. The largest live production owners include
`economy.ts` (4,731 lines), `style.ts` (4,267), `MoneyScreen.vue` (3,079), `SeasonScreen.vue` (2,636),
`HomeScreen.vue` (2,562), `migrations.ts` (2,344), `calendar.ts` (2,182), `MatchViewer.vue` (2,151),
`offers.ts` (2,111), `world.ts` (2,075), `TournamentFlow.vue` (2,023), `App.vue` (1,795),
`snapshot.ts` (1,774) and the offer protocol module (1,193).

Size alone is not the finding. `migrations.ts`, tuned tables and editorial pools can be cohesive
large owners. The actionable cases are surfaces where independent state machines or unrelated
decisions change together and force large retrieval cones.

## Previous-result fix matrix

### August roadmap R2-01 to R2-18

| Item | Status now | Evidence and remaining work |
| --- | --- | --- |
| R2-01 college event typing | **Fixed** | Tuition is a negative `expense` in category `tuition` in `src/engine/world/college.ts` |
| R2-02 structured injury report | **Fixed** | `Snapshot.injuryReport` is projected from facts; `InjuryStopDialog` no longer parses English |
| R2-03 sim/NUL guards | **Fixed** | Real runner flags and scoped tracked-text guards are exercised by focused tests |
| R2-04 truth/freshness | **Regressed / partial** | Structural audits improved, but current route facts are stale and edited legacy docs evade classification |
| R2-05 typed worker replies | **Fixed** | `ReplyFor` mapping, generic request path and runtime mismatch rejection are centralized |
| R2-06 engine/presentation direction | **Fixed** | Direction is clean and guarded by `tests/engine-viz-direction.test.ts` |
| R2-07 blocking-dialog focus | **Fixed for named dialogs** | Fork, retirement, injury and confirm share focus entry/trap/restoration and Escape policy |
| R2-08 watermark consolidation | **Fixed** | App uses the shared watermark primitive across the named career marks |
| R2-09 protocol split | **Fixed** | The public barrel is small and domain modules own protocol types |
| R2-10 state and weekly phases | **Fixed** | State/schema lives in `world/state.ts`; `tickWeek` is an explicit seven-step recipe |
| R2-11 UI state owners | **Partial** | Day crossing and MatchViewer playback/audio landed; Money/App/Season remain mixed owners |
| R2-12 source/docs/tools lifecycle | **Partial, with two regressions** | Pin, decision, registry and map guards landed; full tools typecheck is red and doc-edit ratchet is ineffective |
| R2-13 multi-week advance | **Shipped, then deliberately narrowed** | Owner retained acceleration only for long injury layoffs; do not re-file generic skipping as an automatic fix |
| R2-14 reasonable-player/sponsor arms | **Partial** | A human-readable player policy exists; sponsor/business paths are absent from the integrated release arm |
| R2-15 college role/competition | **Role fixed; body semantics deferred** | College is clearly a compact second act; its competition rows deliberately cost no condition/body |
| R2-16 adult agency | **Partial** | Final retirement is hers; school fork and earlier retirement still let the parent overrule her preference |
| R2-17 relationship promise | **Open** | No persistent relationship, morale or burnout mechanic ships |
| R2-18 adult narrative knowledge | **Mostly fixed** | Shared stage/fact licences, college birthday band and independent-living language landed |

### Corrections and owner decisions that must remain closed

- The previous Stats tile concern was refuted by screenshot evidence; it is not a current finding.
- Weather was already wired and was never dormant; do not remove it based on stale comments.
- Ordinary multi-week skipping was playtested and declined. Measure decision density before reopening
  it; do not treat the existence of weekly presses as permission to reverse the product decision.
- The exhibition/friendly sandbox is owner-approved. Its placement and nondeterministic seed remain a
  P3 product decision, not an unowned defect.
- Large comments, migrations and tuned tables are not automatically waste. Preserve active reasoning
  and append-only history; compress settled chronology when touching the owning block.

## DRY, KISS, YAGNI and SOLID

### Scorecard

| Principle | Assessment | Current evidence | Recommendation |
| --- | --- | --- | --- |
| DRY | **Good, with route/view exceptions** | Domain owners, typed protocol facts and shared stage/dialog helpers removed major duplication | Fix the few proven view duplicates and eliminate parallel current-truth tables |
| KISS | **Strong macro, mixed local** | Explicit worker switch and weekly recipe remain readable; three SFCs carry too many local state machines | Extract only stable owners; avoid service/event/framework layers |
| YAGNI | **Improved** | No speculative relationship engine or universal view-model layer was added | Decide dormant seams explicitly; build one complete relationship beat before a generic score |
| SRP | **Strong engine/protocol; weak UI hubs** | State, phases, snapshot and protocol have clear owners; Money/App/Season mix several responsibilities | One child/composable at a time, protected by behaviour tests |
| OCP | **Appropriate** | Explicit maps/switches make commands and tuned rules auditable | Do not replace explicit domain variation with plugin registries |
| LSP | **Healthy / low relevance** | Composition and discriminated unions dominate; no fragile subtype hierarchy was found | Continue preferring unions and narrow data contracts |
| ISP | **Materially improved** | Protocol domains and request-specific replies reduced broad consumers | Preserve the compatibility barrel, but import narrow owners in new internal code |
| DIP | **Strong** | Engine no longer depends on visualization and UI commands cross a typed worker boundary | Keep neutral contracts neutral; no abstract service container is needed |

### DRY findings

The dangerous duplication from earlier rounds—tiebreak logic, tier decisions, injury inference and
stage wording—is gone or guarded. Remaining code duplication is small and concrete:

- `fundsShort` formatting repeats in `SeasonScreen.vue` and `CalendarScreen.vue`;
- coach/allocation ordering has a shared comparison concept but still appears in more than one place;
- `firstWeekOfMonth` in `src/shared/dates.ts` appears unused;
- current architecture/tool/test counts are manually repeated across routing documents even though
  generated inventories already exist.

Only the first two justify a helper, and only if their output contract is genuinely identical. The
larger DRY problem is **duplicated truth**, not duplicated syntax: a generated world-symbol map is
correct while its context wrapper is stale; the generated tools registry is correct while the
context index hard-codes old totals.

### KISS findings

The repository's simplest decisions remain the right ones:

- the Web Worker owns the simulation;
- commands are handled by an explicit switch;
- `tickWeek` visibly orders phases;
- migrations remain append-only;
- integer cents and purpose-scoped deterministic RNG stay direct;
- match records are generated before visualization.

Do not introduce repositories, dependency injection, an event bus, generic command handlers, a
universal dialog schema or a file per interface. The current KISS issue is local cognitive load:

- `MoneyScreen.vue` has a roughly 1,343-line script spanning four chapters, projections, draft shop
  state, confirmations and a large shop template;
- `App.vue` owns navigation reconciliation, week execution, reporting and overlay precedence;
- `SeasonScreen.vue` owns guides, confirmations, planner state, replay/practice and the sandbox.

These deserve narrow extraction because independent states already exist, not because the files
crossed an arbitrary line count.

### YAGNI findings

The project correctly deferred a hidden relationship simulation and retained explicit tuned data.
The next YAGNI pass should be a decision pass, not a deletion sweep:

| Surface | Present state | Decision |
| --- | --- | --- |
| Disabled Boy selector | Visible-disabled UI despite a girl-only domain type | Remove the pseudo-choice or commit to the feature; wording needs owner approval |
| Career handoff fields | Typed, dormant protocol seam | Keep only with a named near-term consumer; otherwise remove in a compatibility wave |
| Friendly sandbox | Owner-approved released surface | Decide whether it is a player feature or developer tool; do not silently delete |
| `firstWeekOfMonth` | Apparently unused pure helper | Remove after reference check; no architecture wave needed |
| Relationship state | Product promise, no implementation | Start with one deterministic preference/response/echo, not a general hidden meter |

### SOLID conclusion

SOLID is serving the project where it protects ownership boundaries, not as a score to maximize.
The strongest recent improvement is SRP/ISP at the engine-worker boundary. The best next application
is one stable UI owner. More interfaces or abstractions would reduce clarity without adding a second
consumer or protecting an architectural invariant.

## Architecture and code structure

### What is healthy

- `src/engine/world/state.ts` owns persisted state and schema version 69.
- `src/engine/world.ts` remains a compatibility facade and explicit orchestrator rather than the
  storage home for every concern.
- `tickWeek` is a visible seven-step recipe; extraction did not turn order into callback control flow.
- request/reply typing is correlated in `src/shared/protocol/messages.ts`; the worker client rejects
  runtime mismatches rather than trusting a broad union.
- match outcome and presentation dependency direction is guarded.
- MatchViewer playback/audio and day-crossing state gained focused owners.

These changes validate the repository's “extract a proven owner behind a compatible path” approach.
They do not justify accelerating into the remaining world seams solely because those seams exist.

### Current architecture findings

#### ARCH-34 — Money shop is the clearest SRP hotspot

**Priority / effort / risk:** P2 / M / medium UI-regression risk.

Extract a `MoneyShopTab.vue` that owns shop projection, drafts, confirmations and shop rendering.
Keep the screen/store boundary explicit; pass typed facts and emit domain actions. Do not rewrite
copy or create a generic commerce framework. Characterize projected totals, insufficient-funds
states, draft restoration and confirmation ordering before moving code.

#### ARCH-35 — App navigation and Season planner have stable seams

**Priority / effort / risk:** P2 / M each / medium.

First extract only `useResolvedWeekNavigation` from App: requested destination, blocked navigation,
career replacement and post-week reconciliation. App must retain one visible overlay-priority owner.
Separately move Season's planner controller and panel together; do not combine it with replay,
practice or sandbox decisions in the same wave.

#### ARCH-36 — Current symbol routing has two owners

**Priority / effort / risk:** P1 documentation / XS / low.

`tools/generated/world-symbol-map.md` points `WorldState` and `SAVE_SCHEMA_VERSION` at
`src/engine/world/state.ts`; `docs/context/engine-symbol-map.md` still says they live in
`world.ts`. Make the context page a short route to the checked generated map, or generate its table.
Do not maintain two hand-edited symbol maps.

#### ARCH-37 — Remaining world seams are opportunistic, not a new program

**Priority / effort / risk:** P3 / L if triggered / high parity risk.

Tournament reveal/finalization and college advancement are still sizeable blocks. Move either only
when a feature needs the same boundary, with fixed-seed parity over RNG position, entries, finance,
rankings, injuries, events and snapshots. Keep `world.ts` as the ordered facade; no callbacks from
extracted modules into it.

## Product, plot, design and mechanics

### Product assessment

The shipped career now has a coherent macro arc: childhood development, tour economics, school
fork, college second act or professional continuation, endings and epilogue. College has a clear
role as a deliberately compressed second act rather than a second full management game. The
narrative also knows more about age, residence and information source, so adult scenes are less
likely to speak from a parent's impossible point of view.

The product's strongest differentiator is still less complete than its economy. README pillar three
promises that the daughter is a person rather than an asset, while honestly admitting that morale,
relationship and burnout are not built. The final retirement scene now makes the decision hers, but
the school fork still gives the parent `Turn professional`, `Reserve college` and `Stop`; an earlier
retirement scene says she would rather stop while permitting one more forced year. That is a clear,
bounded place to deepen the product before adding more wealth/business breadth.

### Revisited product findings

| Area | Status | Current judgement |
| --- | --- | --- |
| Adult agency | **Partial, P1 product** | Final retirement is hers; fork and earlier retirement can contradict her stated preference |
| Quiet-week presses | **Partial by deliberate cut** | Long injury acceleration ships; ordinary stretches remain weekly by owner decision |
| College role | **Fixed** | Compact second act, four one-at-a-time years, visible call-up/championship loop |
| Reasonable-player balance | **Partial** | Human policy exists, but historic grinder/reach corridors and missing sponsor/business arms limit release claims |
| Dialog accessibility | **Named set fixed** | Semantic/focus behaviour landed; scrim inertness remains deliberately out of scope |
| Tuition semantics | **Fixed** | Negative expense/category tuition |
| College body cost | **Deferred product decision** | Friendly/call-up/league rows intentionally have no ordinary condition cost |
| Onboarding truth | **Open, P1 design** | Certainty, disabled gender choice, causal copy mismatch and broken heading reference remain |
| Private-life state | **Correctly not invented** | Strategic gap remains, but YAGNI guard has held |
| Adult narrative knowledge | **Mostly fixed** | Fact licences and stage predicates constrain domestic/independent lines |
| College repetition/money label | **Fixed** | One rule statement; signed movement is labelled Spent/Banked |
| Friendly sandbox | **Open by owner choice** | Released, unpersisted, no-cost/no-time and Date-seeded; clarify role when owner elects |
| Internal age vocabulary | **Fixed** | Runtime uses `lateCareer` |

### New and sharpened product findings

#### PROD-34 — Onboarding asks for trust before it has earned it

**Priority / effort / risk:** P1 design / S / no balance risk.

`OnboardingWizard.vue` still presents “real talent”/“anything is possible,” says play style shapes
strengths and training, exposes a disabled Boy choice, and references `ob-hero-title` without the
heading owning that ID. Starting skills do not use the selected profile/style, although style now
does affect surface affinity and coach fit. Nationality also affects college need aid but is not
explained at the choice.

Owner copy approval is required. The target is not more tutorial prose: every causal sentence should
map to a runtime rule, uncertainty should remain uncertainty, and unavailable choices should not be
presented as pseudo-controls. Acceptance includes a mounted accessible-name test and a short
copy-to-rule checklist.

#### PROD-35 — Published opponent truth still breaks close to the event

**Priority / effort / risk:** P1 product honesty / S or L depending on choice.

Far-out opponent churn was improved, but the existing preview study reports that a week-minus-one
opponent still differs from the actual bracket on 59.2% of measured cards. Two honest options exist:

1. **S:** withhold the opponent name until the draw the engine will consume is fixed;
2. **L:** persist the published draw and require tournament construction to consume it.

The persistent option affects saves and distributions, so it needs a schema migration, golden
fixture, deterministic replay and before/after bracket comparison. Do not keep showing a precise
name that is only a forecast.

#### PROD-36 — The next product-depth unit should be a complete agency beat

**Priority / effort / risk:** P1 product / L / medium-high save/narrative risk.

At the school fork, derive her preference from visible, deterministic career facts and show why.
Let the parent respond with support, objection or a financial boundary; do not let the parent select
her internal preference. Echo the response once later. Persist only the minimal facts the echo
actually consumes. The final-retirement scene is the interaction model.

Acceptance requires deterministic preference tests, old-save migration/golden coverage if anything
is persisted, route-distribution measurement and owner-approved copy. This precedes a relationship
score because it proves the input, reaction and later consequence first.

#### PROD-37 — Balance gates should describe plausible play

**Priority / effort / risk:** P2 / M / low harness risk, high tuning risk.

Promote the reasonable-player policy into release reporting for survival, pro reach, by-18/lifetime
top-100 and tail outcomes. Add sponsor-on/off and business-aware cells before making claims about the
expanded economy. Keep grinder paths as historical reproducibility anchors. A new result is evidence
for an owner ruling, not automatic permission to tune.

#### PROD-38 — Measure decision density before revisiting acceleration

**Priority / effort / risk:** P2 evidence / S measurement, M action / medium interaction risk.

Count presses per season, weeks between consequential choices and expired/missed decisions under a
representative player policy. Only if the evidence is poor should a bounded next-decision control
return, built on the existing stop list. It must produce the same main RNG/world state as individual
presses and stop before every response, entry, offer, finance crisis, birthday, injury, fork,
retirement or ending.

#### PROD-39 — College body cost needs a product ruling, not an incidental patch

**Priority / effort / risk:** P2 / S experiment, M implementation / medium balance risk.

The compact college loop currently treats call-ups and league play as friendly presentation rows
without ordinary condition cost; some league activity still feeds development through the weekly
college match count. If authenticity is worth the extra state consequence, run an A/B with measured
condition/development impact and preserve the compact one-click year. Otherwise document the zero-
body-cost abstraction as intentional and close the finding.

## Testing, documentation and tooling

### What is strong

- Unit, mounted component, serialized simulation and Playwright layers are all active.
- Golden saves cover every schema and migration discipline is mechanically guarded.
- Deterministic benches and fixed-seed tests protect measured mechanics.
- Engine purity, world-symbol map, decision index, source-pin ratchet and sim runner flags have
  focused guards.
- Mounted component coverage roughly doubled, directly addressing the previous overreliance on
  source-text UI assertions.
- The normal local `npm run check` includes documentation, types, unit/component tests and the
  production build; this correctly catches type-only export mistakes that `vue-tsc` alone misses.

### Current findings

#### QA-34 — The archival tools sweep is red but advertised as reproducible

**Priority / effort / risk:** P1 tooling integrity / S–M / low product risk.

`npm run check:tools` currently reports nine TypeScript errors across:

- `tools/birthday-pool.ts`;
- `tools/his-careers-brackets.ts`;
- `tools/market-probe.ts`;
- `tools/r29-item14-anger.ts`;
- `tools/r29-item14-read.ts`;
- `tools/r31-surface-kings.ts`.

The tools registry says archival probes remain reproducible, but neither the normal `check` script
nor CI invokes the full archival typecheck. Repair tools that are meant to remain runnable; clearly
classify frozen evidence that cannot be maintained. Add `tools:registry:check` to the normal gate.
Run `check:tools` after engine/API waves and on a scheduled/full integrity job if every-PR cost is
unreasonable.

#### QA-35 — The edited-document ratchet does not observe edits

**Priority / effort / risk:** P1 documentation governance / S / low.

The context index and audit comments promise that a materially edited grandfathered document must
gain metadata. `scripts/context-audit.mjs` stores only the legacy paths and checks membership; it has
no content hash or Git-diff signal. Any grandfathered file can change substantially and remain
legal. Store a SHA-256 per legacy file in the baseline and fail when its current hash changes while
metadata is still absent. Deletion or classification should remain one-way and non-failing.

#### QA-36 — Current routing facts are semantically stale despite a green audit

**Priority / effort / risk:** P1 retrieval integrity / S / low.

Known false current statements include:

- `docs/now-next-later.md` describes the save schema as v61; runtime is v69;
- `docs/context/saves-and-worker.md` has v69 but points its owner at `world.ts`;
- `docs/context/engine-symbol-map.md` also points state/version at `world.ts` while the checked
  generated map correctly points at `world/state.ts`;
- `docs/context-index.md` says 24 live/114 archival tools while the registry says 26/146;
- `e2e/README.md`, `docs/now-next-later.md` and `docs/specs/e2e-coverage.md` disagree about e2e and
  test-project counts;
- `CLAUDE.md` retains stale unit-suite file/runtime figures.

Prefer deleting volatile counts from prose or generating them. Extend `doc-facts` only for facts
whose accuracy changes a routing/action decision; do not turn every statistic into a brittle pin.

#### QA-37 — E2E CI is full-suite work under a smoke label

**Priority / effort / risk:** P2 tooling clarity / XS / low.

The CI comment and job name describe a one-spec smoke run, but the job executes unfiltered
`npm run test:e2e`. Rename it as the full suite or restore an intentional smoke selection. The
current suite lists 31 tests in 13 files, so current documentation should not quote older 25/30-test
figures.

#### QA-38 — Source-reading tests remain a second test language

**Priority / effort / risk:** P2 / M ongoing / low-medium migration risk.

The raw `indexOf` slice ratchet reduced the most fragile pattern to three baseline cases, but roughly
106–108 tests still read source. Require every new source test to declare one responsibility:
**policy**, **configuration** or **structure**. Reject UI behaviour assertions at review time; mounted
or browser tests should own those. When a feature moves, migrate its touched source pin instead of
starting a repository-wide conversion.

#### QA-39 — Browser coverage is narrow at the real-layout boundary

**Priority / effort / risk:** P2 / M / low code, moderate flake risk.

Playwright uses Chromium and a default 576×1280 viewport, with a focused 375-wide responsive spec.
No automated axe pass is recorded, and component geometry mocks cannot validate actual clipping,
focus obstruction or screen-reader naming. Add a small seeded accessibility/keyboard pass over the
blocking career states and one narrow-phone path. Avoid a broad pixel-baseline matrix.

#### QA-40 — CI spends tokens/time twice

**Priority / effort / risk:** P3 / XS / low.

CI runs forced `vue-tsc`, then `npm run build`, whose build script repeats typechecking. Keep the
explicit first typecheck and call `vite build` afterward, matching the local check's intent. Unit
shards use `--verbose`; use the quiet reporter by default and retain verbose reruns for failures.

## Token and context optimization

### Current context shape

`npm run context:audit` currently scans 345 Markdown inputs, about 106,101 lines and an estimated
1,792,850 tokens, including this review. The largest individual historical records include `round-29.md` (about 61k
estimated tokens), the append-only decisions archive (about 49k) and `round-30.md` (about 27k).
Those are valid history, but they must not sit on the default retrieval path.

Source comment characters also rose sharply in several core owners. `economy.ts` grew from roughly
187k to 300k comment characters; `migrations.ts` grew from about 90k to 121k. Much of that is useful
reasoning or compatibility history, so line/comment caps would reward deletion of evidence. The
problem is when current rules, old chronology, measurements and superseded alternatives are all
co-located without a retrieval hierarchy.

### Context principles

1. **One current route, many historical records.** The context index should link a compact current
   pack; dated reviews/rounds remain evidence, not required reading.
2. **Generate volatile facts.** Schema owner/version, tool inventory and world symbols already have
   machine sources. Link or render those rather than copying counts.
3. **Default to the exception.** Audit/check output should report totals, failures and the top five
   deltas by default; full inventories belong behind `--verbose` or JSON artifacts.
4. **Compress on touch, not by purge.** Keep the current invariant, failure signature, owner ruling
   and a link to chronology. Remove duplicated narration only while working in that owner.
5. **A warning needs a disposition.** At wave close, each newly over-budget/growing owner is marked
   split, compress-on-touch, measured exception or accepted data/history owner.
6. **Tests should fail quietly and explain narrowly.** Dot/summary output is the normal path; a
   focused verbose rerun supplies failure detail.

### Concrete context changes

| Change | Priority / effort | Acceptance |
| --- | --- | --- |
| Compact `context:audit` default | P2 / S | Totals, errors, top five deltas; full JSON/verbose retains all data |
| Add testing/tooling context pack | P2 / S | Context index gives one current route for gates, projects and tool classes |
| Generate/link volatile route facts | P1 / S | No hand-maintained duplicate symbol/tool/schema tables |
| Hash legacy unclassified docs | P1 / S | Edited grandfathered document fails until classified |
| Wave-close context disposition | P2 / process | Every new growth warning receives one recorded decision |
| Comment compression template | P2 / ongoing | Touched block retains invariant, failure signature, ruling and history link |
| Quiet CI defaults | P3 / XS | Green output is summary-sized; failure can be rerun verbose |

This report intentionally lives in one file. Splitting the same point-in-time argument into seven
chapters would add navigation and metadata without creating seven independent owners.

## Detailed proposal catalogue

### P-01 — Restore truth and reproducibility

**Priority / effort / risk:** P1 / M / low product risk.

Scope:

1. repair or explicitly freeze the six red archival tools;
2. add registry validation to the normal gate and schedule/full-run the archival typecheck;
3. hash grandfathered unclassified documents;
4. correct the known false current routes and replace repeated volatile counts with generated links;
5. align the e2e CI name/comment with what it actually runs.

Acceptance:

- `npm run check:tools`, `npm run tools:registry:check`, `npm run context:audit`,
  `node scripts/doc-facts.mjs` and `npm run map:world:check` are green;
- mutating a legacy unclassified doc makes the audit red;
- following the context index reaches the correct state owner, schema version, tool inventory and
  current test instructions without consulting a dated review.

### P-02 — Reduce default retrieval/output cost

**Priority / effort / risk:** P2 / S–M / low.

Make audit output compact, add the testing/tooling context route and require a wave-close disposition
for context deltas. Apply the four-part comment compression template only to touched blocks. Do not
rewrite the decisions archive, round records or migrations.

Acceptance: routine `check` output identifies action without emitting full inventories; a new
reviewer can choose the right test/tool command from one compact page; all history remains linked.

### P-03 — Extract Money shop ownership

**Priority / effort / risk:** P2 / M / medium.

Create one store-aware or explicitly fact/action-driven `MoneyShopTab.vue`—whichever produces the
smaller contract—covering projections, drafts, confirmations and shop UI. Preserve cents, labels,
focus and chapter navigation. Do not create a generic financial-panel framework.

Acceptance: mounted tests prove projection parity, funds refusal, draft lifecycle and confirmation
ordering; screen script/retrieval cone materially shrinks; `npm run check` passes.

### P-04 — Extract two UI state owners, separately

**Priority / effort / risk:** P2 / M each / medium.

First `useResolvedWeekNavigation` from App, preserving one overlay priority. Then Season planner
controller/panel, preserving store timing and event ordering. Each is independently revertible and
must land before the next begins.

Acceptance: mounted fake-store/fake-timer tests cover blocked navigation, career replacement,
post-week reconciliation, planner move/remove and overlay collisions; no duplicate state owner.

### P-05 — Ratchet test responsibilities and trim CI waste

**Priority / effort / risk:** P2 / M ongoing plus XS CI / low.

Classify source-reading tests, prevent new UI behaviour pins, migrate on touch, add a bounded seeded
axe/keyboard e2e pass, remove duplicate CI typechecking and quiet successful unit output.

Acceptance: every new source test states policy/configuration/structure; the named blocking states
pass real-browser keyboard/name checks at phone width; CI still catches a type-only re-export build
failure and emits materially less green output.

### P-06 — Repair onboarding truth and semantics

**Priority / effort / risk:** P1 design / S / low, owner wording decision required.

Correct the heading reference, remove the disabled pseudo-choice, make potential uncertain, describe
style only through rules it actually affects and disclose the relevant nationality/aid consequence.
Do not change shipped wording without explicit owner approval.

Acceptance: mounted accessible-name test; every causal line has a named runtime rule; no new choice
is implied without a mechanic.

### P-07 — Close the published-draw promise

**Priority / effort / risk:** P1 product / S withholding or L persistence / low or high.

Owner chooses between withholding the opponent name and persisting a published draw. The first is a
truthful presentation fix; the second is a new state contract. Do not mix it into tournament balance
work.

Acceptance: zero preview/bracket name mismatches across the chosen seeded corpus. Persistence also
requires migration, golden fixture, RNG/distribution parity analysis and old-save regression.

### P-08 — Make one adult decision hers

**Priority / effort / risk:** P1 product / L / medium-high.

Implement the school-fork preference/parent-response/later-echo beat described in PROD-36. Avoid a
generic relationship score. If a satisfying visible echo cannot be authored, stop after preference
and response rather than persisting invisible state.

Acceptance: deterministic rule and copy tests, owner narrative approval, migration/golden save if
persisted, distribution report and old-save replay.

### P-09 — Add one relationship echo only after P-08

**Priority / effort / risk:** P2 positioning / L / high design risk.

Let a small set of existing actions influence one partly observable response and one later callback.
Do not expose an optimizer number; repeated pressure must not be uniformly dominant. Update README
pillar three to exactly the shipped scope—or rescope the pillar if one meaningful beat cannot carry it.

Acceptance: one input → reaction → later consequence is visible and deterministic; old saves choose
a stable neutral/default history; ending/callback tests cover at least two contrasting responses.

### P-10 — Complete balance evidence before tuning

**Priority / effort / risk:** P2 / M plus sim time / low harness, high tuning.

Promote the reasonable-player arm, add sponsor/business cells and measure ordinary decision density.
Run a college body-cost A/B only after the product ruling. Keep every tuning change in its own
measured proposal with predicted and observed effects.

Acceptance: fixed-seed median/tails for survival and reach; sponsor-on/off comparison; sim files stay
under serialized task timeout; no tuning lands from an unexplained delta.

### P-11 — Resolve dormant/YAGNI surfaces

**Priority / effort / risk:** P3 / S decisions, variable implementation / low.

Owner decisions: disabled Boy control, career handoff fields and friendly sandbox role. Independently
remove the verified unused date helper. Preserve any surface with a named consumer or accepted player
purpose; delete declined paths with focused references/tests, not a bulk “dead code” wave.

## Dependency-aware roadmap

| Wave | Outcome | Included proposals | Stop/go gate | Focused effort |
| --- | --- | --- | --- | ---: |
| 0. Integrity | Trust current routes and reproducible tools | P-01 plus CI XS from P-05 | All advertised integrity commands green; context route spot-check clean | S–M |
| 1. Retrieval | Reduce recurring context and one proven UI cone | P-02, P-03 | Audit output smaller; Money behaviour parity; no new framework | 1–2 weeks |
| 2. UI/test ownership | Stabilize App/Season seams and source-test responsibilities | P-04, rest of P-05 | One state owner per seam; browser checks stable; source-test growth classified | 2–3 weeks |
| 3. Product truth | Repair first impression and opponent promise | P-06, P-07 | Owner approves wording/draw choice before implementation | S if withholding; L if persistence |
| 4. Distinctive promise | Deliver one adult preference/response/echo | P-08 | Prototype is understandable without a hidden score; save plan approved | L |
| 5. Depth and evidence | Add one relationship callback and representative balance gates | P-09, P-10 | Visible player value; deterministic old-save policy; measured release corridors | 2–4 weeks |
| 6. Opportunistic | Resolve dormant seams; move world code only when pulled by change | P-11, ARCH-37 | Named consumer or deletion decision; full parity for engine moves | As triggered |

### Why this order

```text
truth/tool integrity
  ├─> reliable context and release evidence
  └─> safe UI/test consolidation
          ├─> honest onboarding/draw presentation
          └─> adult preference + parent response
                    └─> one relationship echo
                              └─> broader relationship/economy tuning only if earned
```

Wave 0 prevents the team from acting on false instructions or irreproducible evidence. Waves 1–2
pay the most proven retrieval costs without reopening engine architecture. Wave 3 restores product
honesty at first contact and event preview. Waves 4–5 then spend design/save complexity on the
project's differentiator rather than another broad subsystem.

### Explicit non-goals

- no service layer, dependency-injection container, event bus or generic command framework;
- no repository-wide SFC, comment, CSS or source-test rewrite;
- no universal relationship/morale simulation before a complete authored beat;
- no hidden balance change bundled with UI or architecture work;
- no reintroduction of ordinary multi-week acceleration without measured evidence;
- no UI wording changes without owner instruction;
- no save-field addition without migration, golden fixture and old-save regression.

## Verification record

Focused review verification:

- architecture lane: 41 unit tests and 26 mounted tests passed; world-map and context checks passed;
- product lane: 161 tests across preview, endings and college suites passed;
- quality lane: context, doc-fact, source-pin, decision-index, tool-registry, world-map and sim/NUL
  guard checks passed;
- `npm run check:tools`: **failed as a finding**, with nine TypeScript errors in the six tools listed
  under QA-34.

Repository verification after adding this report:

- `npm run context:audit`: passed over 345 Markdown inputs;
- the typecheck, documentation facts, engine purity, source-pin ratchet, decision index and generated
  world-map stages of `npm run check`: passed;
- unit suite: 199 files / 3,869 tests passed; one test failed because ten **pre-existing untracked**
  `milf-*` images are byte-identical to tracked `lateCareer-*` images and are not registered in
  `docs/art-placeholders.md`. The review did not alter or classify those user-owned assets;
- `npm run test:component`: 106 files / 1,125 tests passed;
- `npx vite build`: passed; 353 modules transformed. The existing >500 kB chunk warning remains;
- `npm run check:tools`: failed with the nine independently reproduced errors under QA-34.

The full `npm run check` is therefore not green in the present dirty workspace, solely at the
placeholder-art assertion described above. Its post-unit component/build stages were run separately
and passed. This is intentionally reported as workspace state, not attributed to the review change.

## Final recommendation

Treat the August architecture program as largely successful and stop paying for it as though the
same emergency still exists. The next valuable unit is not “more decomposition.” It is a trustworthy
project surface: green advertised tools, one current route to facts, one smaller UI owner and one
adult choice that belongs to the daughter. That sequence improves maintainability and makes the
product more itself at the same time.
