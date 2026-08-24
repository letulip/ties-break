---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Token and context optimization

## Executive answer

The largest direct savings do not come from adding Obsidian, embeddings, or another knowledge
system. They come from making the repository's existing retrieval contract trustworthy and reducing
the amount of unrelated material pulled by one symbol.

Prioritize, in order:

1. correct the canonical context packs;
2. compress historical prose in production source;
3. break runtime cycles so module splits create real dependency boundaries;
4. split only the three genuine integration hubs—protocol, weekly lifecycle, and large SFCs;
5. retire behavior-shaped source pins as touched;
6. preserve quiet/targeted verification and add small generated inventories.

This optimizes both humans and AI agents. It also reduces merge conflicts and stale truth, so the
benefit is not tied to one model or tokenizer.

## What “token optimization” means here

There are four different costs:

| Cost | Current cause | Desired property |
| --- | --- | --- |
| Discovery | Many current/unclassified docs, stale routes | One trustworthy path to current truth |
| Retrieval | High-context hubs and broad facades | A symbol's owning module plus a small context pack |
| Reasoning | Historical narrative mixed with live invariants | Current behavior is visually distinct from archaeology |
| Verification | Source-text pins and verbose/repeated commands | Smallest behavioral gate with quiet failure-focused output |

Reducing physical lines alone can worsen all four costs if it hides behavior in generic layers or
scatters one concept over micro-files.

## Measured hot spots

Comment percentages are approximate physical-line classifications; rough tokens are characters/4.

| File | Lines | Rough tokens | Approx. comment lines | Decision |
| --- | ---: | ---: | ---: | --- |
| `engine/world.ts` | 3,589 | 58,963 | 58% | Split state and tick phases after cycles are removed |
| `shared/protocol.ts` | 3,466 | 56,349 | 69% | Split stable transport/type domains behind a barrel |
| `engine/economy.ts` | 2,612 | 47,584 | 75% | Compress history first; retain central tuning API |
| `engine/season/calendar.ts` | 2,152 | 38,241 | 76% | Fix cycle; optionally separate catalogue from algorithms |
| `MatchViewer.vue` | 2,612 | 35,522 | about 40–48% | Extract playback/audio and presentational children |
| `SeasonScreen.vue` | 2,392 | 32,070 | substantial | Extract event projection, planner, and exhibition |
| `HomeScreen.vue` | 2,240 | 28,693 | substantial | Extract card view models/children when touched |
| `migrations.ts` | 1,585 | 24,855 | 58% | Keep chronological; read/edit only current tail |
| `viz/commentary.ts` | 1,584 | 21,838 | data-heavy | Keep unless narrative ownership produces a real seam |
| `App.vue` | 1,355 | 22,183 | 53% | Extract watermarks/navigation; keep overlay precedence |

`style.css` adds about 37,939 rough tokens and has verified dead blocks. It deserves an orphan cleanup
followed by ordered imports, but it is less likely to enter engine reasoning context than protocol or
world.

## 1. Repair the retrieval contract

The repository already has the right low-token idea: start at `docs/context-index.md`, read one
context pack, use `rg` for a symbol, and open narrow ranges. The system fails today because the
compressed truth is stale.

### Proposed current-truth shape

```text
AGENTS.md                       short invariants and verification contract
CLAUDE.md                       full retrieval/invariant reference
docs/context-index.md           task → one pack + code/test entry symbols
docs/context/*.md               current facts only, each within existing budget
docs/now-next-later.md          one current delivery view
docs/decisions.md               append-only archive
docs/decision-index.md          area → active decision IDs/status only
docs/specs, plans, research     lifecycle-labelled evidence/history
```

Canonical packs should avoid facts that can be obtained cheaply from one symbol, such as the exact
schema number, file/test counts, or graph node count, unless an audit checks them. Prefer “schema
version is owned by `SAVE_SCHEMA_VERSION` in …” over copying `52` into five files.

### Freshness trigger

Add a small audit mapping rather than semantic AI automation:

| Changed owner | Required review target |
| --- | --- |
| Save version/migration registry | saves-and-worker pack |
| Ending state/view | product-and-narrative pack |
| `ECONOMY` top-level sections | economy-and-progression pack |
| tier/season topology | simulation-and-balance pack |
| top-level routes/screens | UI pack and context index |

This cannot prove prose is correct, but it prevents silent high-impact drift.

## 2. Compress production comments without losing reasoning

The code contains valuable rationale but often preserves the entire path to a decision: owner
quotes, old values, failed rounds, measurements, alternative wording, and repeated warnings. In the
four engine hubs, comments are the majority of physical lines.

Use a simple two-layer rule:

```ts
// Invariant: a medical withdrawal must equal a normal match-free week's recovery.
// Keep zero RNG draws. Evidence: DEC-CONDITION-12.
```

The linked decision/incident contains the chronology, before/after tables, quotations, and rejected
attempts. A source reader then sees the current contract immediately, while deeper rationale remains
available on demand.

### Safe process

1. Do not mass-delete comments.
2. Start with a file already being changed.
3. For each long block, identify the one current invariant and failure mode.
4. Move only dated/history material to an existing or new decision note.
5. Link the decision ID from source.
6. Run the narrow behavior/source-policy tests; source pins may require intentional migration.
7. Track comment bytes/lines as an informational trend, never a hard quality gate.

`protocol.ts`, `world.ts`, `economy.ts`, `calendar.ts`, and MatchViewer are the first five targets.
Even a conservative touch-based reduction can remove hundreds of thousands of characters from
frequently loaded context without deleting executable logic.

## 3. Make splits reduce dependency cones

A file split helps only when consumers can import one part without loading/reasoning about the rest.
Resolve the cycles in the architecture chapter first.

### Protocol: split now

Target cohesive modules of roughly 300–800 lines:

- commands;
- responses and request/reply map;
- snapshot aggregate;
- profile/planning;
- events/finance;
- ladder/tournaments;
- offers/sponsors;
- career/endings.

Keep `shared/protocol.ts` or `shared/protocol/index.ts` as a compatibility facade. New code imports
the owner; existing consumers migrate when touched. Type-only re-exports must use `export type`.

### World: split phases, preserve recipe

Move schema/type ownership and cohesive phases, but keep this readable in one place:

```ts
advanceSeasonBoundary(...)
resolveWeeklyCommitments(...)
resolveBodyAndPlanner(...)
const tour = buildWeekCompetitionContext(...)
resolveKidEventWeek(...)
resolveDevelopmentWeek(...)
resolveAiWeek(...)
finalizeNormalWeek(...)
```

Explicit order is an audit feature. Avoid a generic hook/event framework, dependency container, or
phase registry. Characterize RNG state, ledger, condition, entries, rankings, events, and snapshot
before and after extraction.

### Large SFCs: one state owner per subsystem

- MatchViewer: one playback clock composable and one audio policy composable. Children receive
  narrow display props. Never split the clock across components.
- SeasonScreen: one planner composable; event rows and exhibition are children. Keep store access in
  the screen container.
- App: one overlay precedence owner; extract navigation and career watermarks only.
- Home/Money/onboarding: extract stable panels/view models as they receive feature work.

Vue extraction reduces tokens only if logic moves out of the parent script. A child that still
imports the global store and all engine helpers simply moves the retrieval problem.

## 4. Treat broad barrels as compatibility, not discovery

`engine/world.ts` re-exports many leaf functions and production UI imports the broad facade from 16
files. Keep it to avoid a noisy rewrite, but document it as legacy compatibility. New engine code
deep-imports the owning leaf; production UI should prefer snapshot/view helpers and migrate direct
world imports when touched.

Add a small ownership map to the context pack or generated inventory:

```text
entry eligibility → engine/world/medical.ts
ending projection → engine/world/endings.ts
coach market      → engine/world/coachMarket.ts
snapshot          → engine/world/snapshot.ts
weekly lifecycle  → engine/world.ts (then world/tick.ts)
```

This saves more retrieval than a graph dump because it answers the common “where is current
behavior?” question directly.

## 5. Reduce source-pin context amplification

`tests/worldSource.ts` deliberately concatenates the facade and all world modules, so a test looking
for one spelling can retrieve the whole family. Mounted tests now provide a migration path.

For each touched source pin, classify it:

| Class | Keep? | Example |
| --- | --- | --- |
| Architecture invariant | Yes | no `Math.random`, forbidden imports |
| Build/tool contract | Yes | serialized sim flags, asset provenance |
| User behavior | Convert | tab navigation, opening/closing flows |
| Copy/layout | Usually convert | visible labels, progress rows |
| Identifier/count/absence | Remove or replace | exact occurrences, former placeholder absence |

Behavior tests are often shorter in retrieved context because they load a narrow fixture and assert
observable state instead of scanning multiple source files plus pin-hygiene helpers.

## 6. Keep command output small and intentional

Existing `test:quiet` and dot-reported serialized simulations are good token optimization. Extend
the same discipline:

- during work, run one Vitest file/project;
- summarize failures by test and error, never paste a full successful log;
- run `npm run check` once at delivery;
- keep graph output to the queried node/edge neighborhood;
- generate inventories as files or JSON only when consumed, not in every prompt;
- avoid reading complete diffs, docs, source directories, or test logs unless the task is explicitly
  corpus-wide.

CI can retain detailed artifacts while terminal output remains failure-focused.

## 7. Add small, cheap generated navigation aids

Do not generate embeddings for an 83k-line codebase before simpler aids fail. Useful generated
artifacts are:

- top files by lines/bytes and change frequency;
- import cycles and high-degree modules;
- document lifecycle/freshness report;
- supported tools registry;
- source-pin inventory by purpose;
- current schema/fixture range;
- area-to-owner symbol map.

Keep these under `docs/generated/` or command output, clearly marked generated and non-canonical.
The canonical packs should link only the relevant command, not embed the full report.

## 8. Size budgets: warnings, not design rules

Suggested review triggers:

| Surface | Warning trigger | Review question |
| --- | ---: | --- |
| TS module | 1,000 physical lines or 20k chars of comments | More than one reason to change? |
| Vue SFC script | 800 lines | Multiple state owners or independently testable panels? |
| Canonical context pack | Existing 6.5k-char budget | Can a fact become a symbol/link? |
| Decision index | 8k chars | Is it copying bodies instead of routing? |
| New source-reading test | Every addition | Is static structure actually the behavior? |

Files may exceed the warning with a written reason: migrations, curated commentary, and tuning
catalogues are legitimate exceptions. A hard line cap would incentivize micro-files and worse
retrieval.

## Proposed sequencing and expected effect

| Wave | Work | Context effect |
| --- | --- | --- |
| 0 | Refresh canonical packs and mark superseded docs | Stops false/duplicate retrieval immediately |
| 1 | Fix three runtime cycles and tiebreak duplicate | Creates true leaves and one rule owner |
| 2 | Protocol command/response/snapshot split | Shrinks the most common cross-layer context cone |
| 3 | Comment compression in touched hubs | Removes historical text from frequent source reads |
| 4 | Tick phase extraction plus source-pin migration | Narrows weekly mechanic changes without hiding order |
| 5 | MatchViewer/Season/App focused extractions | Narrows UI work and mounted fixtures |
| 6 | CSS/tool/dead-surface cleanup | Reduces residual repo and build noise |

Do not claim a fixed percentage token saving before measuring actual task traces. Instead, sample a
stable set of tasks—add a worker command, change tier eligibility copy, tune one condition rule,
modify match playback—and record files/characters retrieved before and after each wave.

## Do we need Obsidian or a vector database?

Not yet. Obsidian can be a pleasant personal editor for the Markdown already in the repo, but it
does not make stale notes true, reduce source coupling, or automatically select the correct runtime
evidence. A second metadata/index system would currently duplicate `context-index`, frontmatter,
and Git history.

Reconsider semantic search only when:

- lifecycle metadata and canonical routes are trustworthy;
- grep/symbol/graph navigation has a measured miss rate;
- a real corpus-wide research workflow repeatedly needs semantic recall;
- generated indexes can be rebuilt deterministically and never become a competing source of truth.

For current scale and a solo workflow, disciplined Markdown plus code-aware search is simpler,
cheaper, and more auditable.

## Success criteria

- canonical context no longer states old schema/endings/roadmap facts;
- no production runtime import cycles in the reviewed SCCs;
- scoring and probability share one tiebreak-serving owner;
- protocol consumers can import commands/replies/snapshot without unrelated domains;
- a weekly-mechanics task does not require the full `worldSource` corpus unless it tests policy;
- source comments clearly distinguish current invariant from linked history;
- no new behavior-shaped source pin is added;
- sampled tasks show smaller retrieved character/file counts with unchanged behavior and build.
