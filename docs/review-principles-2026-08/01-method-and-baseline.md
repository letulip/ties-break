---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Method and measured baseline

## Scope

This was a fresh, read-only review of the whole repository on a branch created from `main`. Three
independent passes covered DRY/KISS, SOLID/module boundaries, and YAGNI/testing/docs. The primary
pass cross-checked their evidence, inspected the product/mechanics surface, measured file and
comment size, and compared canonical prose with runtime code.

The review evaluated:

- architecture, dependency direction, state ownership, saves, and determinism;
- KISS, DRY, YAGNI, and the useful parts of SOLID for functional TypeScript;
- product concept, plot/agency, match and career mechanics, and scope honesty;
- testing strategy, CI, developer tools, and documentation lifecycle;
- token/context usage, oversized files, retrieval cones, and safe decomposition seams.

It did not play every career path, run a new statistical balance campaign, audit every artwork
visually, or perform a penetration test. Mechanics findings requiring balance changes must be
validated by the relevant bench before implementation.

## Baseline

| Area | Files | Physical lines | Notes |
| --- | ---: | ---: | --- |
| Production TypeScript/Vue | 180 | 83,106 | Excludes the global stylesheet |
| All `src` including CSS | 181 | 87,113 | About 4.9 MB of text |
| Engine | 75 | 38,486 | Includes 26 extracted `world/*` modules |
| Components | 53 | 27,258 | Several large store-aware composition roots |
| Composables | 22 | 5,060 | Useful UI policy/view seams, one parallel gate |
| TypeScript tests | 205 | 83,223 | Roughly the same LOC as production TS/Vue |
| Mounted component tests | 42 | — | A major improvement over the previous review |
| E2E specs | 13 | 2,598 | Separate smoke path |
| Tools | 122 TypeScript/MJS | 42,924 | Many reproducibility probes and benches |
| Markdown documents | 243 | 71,004 | Context audit estimates roughly 1.21M tokens |

Raw `tests/` size is dominated by 53 historical save generations plus current fixtures. That is
intentional compatibility evidence, not a candidate for token-driven deletion.

## Approximate source composition

A line classifier found about 40,427 comment lines in 87,113 `src` lines (46%). A separate lexical
pass estimated about 3.38 MB of 4.91 MB as comments. Both are deliberately rough: Vue templates,
block comments, markup, and strings make tokenizer-independent counting imprecise. The conclusion
is directional, not billing-grade: comments are a first-order part of the retrieval budget.

## Largest production files

Rough tokens below use characters divided by four. They are for relative planning only.

| File | Lines | Rough tokens | Interpretation |
| --- | ---: | ---: | --- |
| `src/engine/world.ts` | 3,589 | 58,963 | Mixed persisted state, facade, lifecycle, and weekly transaction |
| `src/shared/protocol.ts` | 3,466 | 56,349 | Many domains plus snapshot and transport in one public module |
| `src/engine/economy.ts` | 2,612 | 47,584 | Mostly cohesive tuning table and history; do not split mechanically |
| `src/engine/season/calendar.ts` | 2,152 | 38,241 | Coherent catalogue plus algorithms; a narrower safe seam exists |
| `src/components/MatchViewer.vue` | 2,612 | 35,522 | Playback, audio, canvas, commentary, controls, and template |
| `src/components/screens/SeasonScreen.vue` | 2,392 | 32,070 | Calendar, planner, confirmations, practice, and exhibition |
| `src/components/screens/HomeScreen.vue` | 2,240 | 28,693 | Dashboard cards, warnings, navigation, and presentation policy |
| `src/engine/migrations.ts` | 1,585 | 24,855 | Intentionally chronological compatibility history |
| `src/viz/commentary.ts` | 1,584 | 21,838 | Curated narrative data; size alone is not a split signal |
| `src/components/screens/MoneyScreen.vue` | 1,642 | 20,901 | Several finance panels in one screen |

`src/style.css` is 4,007 lines and roughly 37,939 tokens. It contains live tokens/primitives and
verified obsolete onboarding and finance rules, so deletion and ordered stylesheet extraction are
both warranted—but only after mounted/visual checks.

## Dependency and graph evidence

`npm run graph:check` passed and refreshed a graph with 10,871 nodes and 28,351 edges. The largest
semantic hubs include `rngFromSeed` (degree 367), `createWorld` (339), `tickWeek` (325), `toSnapshot`
(204), and `WorldState` (191). High degree is not automatically a defect: these are expected
integration points. It does show where changes and retrieval fan out.

## Severity model

- **P0 — Critical:** credible risk of broad save loss, nondeterministic outcomes, or an unusable
  release. None found.
- **P1 — High:** core honesty/correctness risk, proven production failure mode, or canonical truth
  that materially misdirects work.
- **P2 — Medium:** substantial maintainability, architecture, scope, test, or retrieval cost.
- **P3 — Low:** bounded hygiene or future hardening with little current user harm.

## Evidence rules and limitations

- Runtime behavior came from code and tests; plans were not treated as implementation.
- Exact duplicates were distinguished from intentional domain data repetition.
- Large files were judged by responsibility and dependency cone, not a line limit.
- SOLID was applied to module boundaries and contracts, not used as a demand for classes.
- Token estimates do not predict an exact model's cache, tokenizer, or billing.
- File:line references are accurate at the baseline commit and may move later.

## Progress since the previous audit

The earlier review correctly identified risks that are now resolved or substantially improved:

- the worker now applies changes to a candidate, persists, then commits memory and revision;
- restart generation tokens reject stale calls and late responses;
- persisted RNG and migration/golden-save discipline are mature;
- complete endings and an epilogue UI exist;
- `world.ts` fell from roughly 5,500 lines to 3,589 with 26 focused modules;
- mounted component tests are now a real UI gate;
- shared money helpers and several reusable UI primitives removed earlier duplication.

Those wins are evidence that incremental, behavior-protected refactoring works in this repository.
