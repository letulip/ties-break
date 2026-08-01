# Code Quality and Engineering Principles Review

## Verdict

The codebase is far better than its largest files suggest. It is strict, deterministic, heavily tested, and notably free of fashionable infrastructure. Its main quality problem is accumulated policy: too much product history and too many rules live in central files, while tests often freeze source text instead of proving behavior. KISS has held at the dependency level but weakened inside the implementation; DRY is good for core formulas and weak for orchestration and presentation conventions.

## Scale observed

| Area | Approximate lines |
|---|---:|
| Engine source | 18,343 |
| Vue components | 19,349 |
| Composables | 3,002 |
| Shared source | 2,156 |
| Tests | 38,606 |
| Product/design docs | 13,269 |

Largest production files include `world.ts` (~5,293), the global stylesheet (~3,637), `diary.ts` (~2,814), `MatchViewer.vue` (~2,215), and several screens between ~1,600 and ~1,800 lines. Roughly half of `world.ts`, and a majority of `economy.ts` and `protocol.ts`, are comment-like lines. Many are useful, but many act as a permanent decision log inside executable code.

## KISS

### What is simple in the good sense

- Only Vue and Pinia are runtime dependencies.
- Rules are mostly plain TypeScript functions and records, not inheritance hierarchies.
- The worker protocol makes mutations explicit.
- One global CSS system and a modest component primitive set produce a coherent product.
- No backend, login, analytics, router, or state-sync library was added without product need.
- TypeScript enables strict mode, unused checks, and fallthrough protection.

### Where simplicity has become hidden complexity

- `world.ts` is an implicit application framework containing many lifecycles and projections.
- `protocol.ts` is simultaneously command contract, full snapshot schema, and shared domain vocabulary.
- Restoring RNG by replaying every week looks implementation-simple but creates time and compatibility complexity.
- A ref-only navigation model now carries custom back/origin state without platform history.
- The production build performs asset-management side effects; building is no longer a read-only compilation operation.
- Extensive historical comments make the current rule harder to identify than a shorter rationale plus linked decision record.

The KISS response is not “use fewer modules.” It is to make concurrency, persistence, and domain ownership explicit while removing accidental policies from central paths.

## DRY

### Strong reuse

- Finance and tier helpers centralize important formulas.
- Purpose-separated RNG prevents ad-hoc randomness.
- Date, rank, surface, and tournament concepts have shared types/helpers.
- UI primitives such as cards, screen shells, icon buttons, segmented rows, and stat rows establish a useful base.
- The engine generally computes outcomes in one authoritative place.

### Material repetition

- The Pinia store contains roughly 33 variants of `request -> copy error/snapshot -> refresh`. A typed mutation helper with an explicit refresh policy would remove error-handling drift while retaining named public actions.
- Snapshot generation recomputes ladder and ranking derivations several times in the same projection. Compute a `views` object once and reuse it.
- Modal-looking overlays independently reimplement backdrop, card, close, and continuation behavior without one semantic dialog primitive.
- Date and currency formatting is split across hand-written English dates, `en-GB`, `en-US`, and repeated dollar formatters. One locale-aware display module should own this.
- Same-role segmented choices are rebuilt in planning, settings, week, and market views without consistent `aria-pressed` semantics.
- Weather presentation has a shared component but is reimplemented in Season.

Not every repeated button should be abstracted. Deduplicate behavior, invariants, and semantics; allow local markup when it improves clarity.

## SOLID and separation of concerns

- **Single responsibility:** good in many leaf rule modules; poor in `world.ts`, `protocol.ts`, the worker, and the largest screen components.
- **Open/closed:** data-driven tournaments, styles, surfaces, offers, and diary facts are extensible. Large switches and snapshot surfaces make command additions broad changes.
- **Liskov substitution:** not a major concern in this function-oriented codebase.
- **Interface segregation:** the UI consumes one very large snapshot rather than feature-shaped read models. Split projections internally before considering wire-level fragmentation.
- **Dependency inversion:** the worker directly owns browser storage and global mutable state, making failure injection difficult. Pass storage and clock/random adapters into command execution in tests; keep production assembly small.

## YAGNI

Dependency restraint is excellent. The less successful form of YAGNI is speculative or retired product history left in code and docs. Several comments describe phases, prior balancing decisions, and removed controls; documentation describes both implemented and unimplemented states inaccurately. Move durable rationale to short architecture decision records and delete obsolete implementation narration during touched refactors.

## Correctness debt hidden as documentation

One recovery path contains a known underpayment bug that comments and tests intentionally preserve while the medical path is correct. A test that pins a known defect is useful only as a temporary characterization test. Put both paths behind one calculation helper, correct the result, and turn the regression test into the intended invariant.

Comments also contradict current reality—for example tour step counts, age/birth assumptions, and implementation status. A stale comment next to business logic is more dangerous than no comment.

## Tooling and repository hygiene

Missing controls are notable for a project of this size:

- No ESLint, Prettier/Biome, or style lint configuration.
- No rendered component/browser accessibility test environment.
- No coverage gate or tracked behavioral coverage map.
- No `engines` constraint for Node/package manager reproducibility.
- No standalone `LICENSE`, `SECURITY.md`, or `CONTRIBUTING.md`.
- Source-available terms appear in the README but are not represented by a formal license file.

Add controls in this order: rendered smoke tests, one formatter, a small high-signal lint ruleset, Node/package-manager pinning, then coverage reporting. Do not begin with hundreds of style rules.

## Comments and documentation policy

Keep comments for:

- why an invariant exists;
- why an apparently simpler implementation is unsafe;
- units, bounds, and compatibility obligations;
- citations or links to a decision record.

Remove comments that narrate obvious code, list old phase numbers, preserve authorship conversation, or restate tests. Each rule should have one current description; history belongs in Git or an ADR.

## Refactoring sequence

1. Add behavioral tests for restore, concurrent commands, save failure, cross-tab revision, and worker restart.
2. Introduce serialized/revisioned command execution without moving domain rules.
3. Make state-plus-metadata persistence atomic.
4. Consolidate store mutations, formatters, and dialog semantics.
5. Extract snapshot projections and lifecycle command handlers as pure functions.
6. Split large Vue files only along stable state-machine or feature boundaries.
7. Remove obsolete comments and source-string tests as rendered tests replace them.

This order protects the game's strongest asset—its accumulated deterministic behavior—while reducing the cost of future change.
