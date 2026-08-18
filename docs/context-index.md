---
type: context-index
status: current
area: project
canonical: true
last-reviewed: 2026-08-03
---

# Ties Break context index

## Current truth

- The canonical router for project knowledge: links and short authority rules, not duplicated specs.
- Code and tests define shipped behavior. Packs route to that evidence; they do not replace it.
- [The August roadmap](plans/roadmap-2026-08.md) gives delivery ordering. ⚠ Its schema numbers and
  "already done" notes are planning-time and the runtime is far past them – take ordering from it,
  state from the code. The older [strategy plan](plan.md) still helps positioning; its phase
  ordering is superseded.
- Review trees are dated audits: a finding is not current merely for appearing in one – check
  whether later work landed.
- Documents without governance metadata are unclassified: candidate context until code or a test
  confirms them.
- **The tour age grid is stated ONCE in prose**, at
  [college is its own branch §0a](specs/college-is-its-own-branch-2026-08.md); the constants it
  describes are `TIERS[*].minAgeYears` / `maxAgeYears` and `ECONOMY.entryCap.proPerYearByAge`. It was
  restated in a dozen specs and drifted until two documents disagreed in front of the owner, twice.
  Link to it; never copy it.

## Authority order

When sources disagree, use this order and record material conflicts:

1. Current executable code and passing tests for shipped behavior.
2. This index and the canonical context packs for routing and maintained invariants.
3. [Owner decisions](decisions.md) and the current dated roadmap for product intent and ordering.
4. Feature specifications for acceptance criteria and design intent.
5. Research for external evidence and calibration inputs.
6. Review reports, round notes, and superseded plans as historical evidence.

A lower source can justify changing a higher one; it never silently overrides it.

## Task router

| Task | Read first | Primary code | Focused tests |
| --- | --- | --- | --- |
| Saves, imports, migrations, worker recovery | [Saves and worker](context/saves-and-worker.md) | `src/db`, `src/engine/save*`, `src/engine/migrations.ts`, `src/worker` | `goldenSaves`, `saveCodec`, `saves`, `storage-recovery`, worker tests |
| Match rules, rankings, RNG, balance | [Simulation and balance](context/simulation-and-balance.md) | `src/engine/match`, `src/engine/season`, `src/engine/rng.ts`, `src/engine/world*` | match, ranking, RNG, world and simulation tests |
| Money, progression, fatigue, injury | [Economy and progression](context/economy-and-progression.md) | `src/engine/economy.ts`, development/condition/injury/coach modules | economy, condition, injury, coach and bench tests |
| Screens, components, accessibility, PWA | [UI and design](context/ui-and-design.md) | `src/App.vue`, `src/components`, `src/composables`, `src/style.css`, `vite.config.ts` | screen, design-token, UI-control and PWA tests |
| Pitch, daughter agency, story, endings | [Product and narrative](context/product-and-narrative.md) | `src/engine/world/endings.ts`, `EndingScreen.vue`, protocol/world state, diary, milestones | `ending`, `college-*`, diary, event and week-story tests; psyche has none – it has no runtime |
| Delivery sequence | [Roadmap](plans/roadmap-2026-08.md) then [launch plan](plans/launch-plan-2026-08.md) | The wave named by the plan | The wave's specified gate plus `npm run check` |
| Funding and commercial scenarios | [Funding routes and cost model](funding-and-roadmap.md) | Not runtime code | Recheck assumptions and source dates before external use |
| Architecture or quality audit | Relevant context packs, then dated reviews | Verify every claim against current code | Reproduce findings; do not inherit old severity blindly |

## Document classes

| Location | Default interpretation |
| --- | --- |
| `docs/context/` | Small canonical routing packs; maintain with code changes |
| `docs/specs/` | Feature intent and acceptance criteria; current only when metadata says so |
| `docs/plans/` | Dated execution plans; newer explicit plans supersede older ordering |
| `docs/research/` | Evidence and calibration inputs; verify source dates before reuse |
| `docs/review/`, `docs/review-codex/` | Point-in-time audits, never automatic current truth |
| `docs/rounds/` | Historical implementation and QA notes |
| `docs/design/` | Visual reference; production components and tokens remain authoritative |

## Metadata contract

Governed documents use small YAML frontmatter:

```yaml
---
type: context-pack
status: current
area: saves
canonical: true
last-reviewed: 2026-08-03
---
```

Use `current`, `draft`, `reference`, `audit`, `historical`, or `superseded` for `status`.
Superseded documents must name `superseded-by`. Only one document may be canonical for an area.
Canonical documents must begin their body with a concise `Current truth` section.

## Retrieval budget

For a normal implementation task:

1. Read `AGENTS.md` and the relevant row above.
2. Read one context pack.
3. Search for the named symbols and tests.
4. Open only relevant ranges; broaden when evidence is insufficient.
5. Read decisions or reviews only when the question is why, risk or prior intent.

No hard file-count limit: correctness wins. Every additional read must answer a live question
rather than provide background.

