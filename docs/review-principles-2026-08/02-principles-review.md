---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# DRY, KISS, YAGNI, and SOLID

## Scorecard

| Principle | Verdict | Main strength | Main weakness |
| --- | --- | --- | --- |
| DRY | Good, with dangerous boundary exceptions | Central `ECONOMY`, `TIERS`, money/date helpers, UI primitives | Rules duplicated between scoring/probability and engine/UI |
| KISS | Good at macro level, mixed in integration code | Explicit worker protocol, unions, small runtime dependency set | High-context orchestration, prose-heavy source, source-pin subsystem |
| YAGNI | Generally disciplined | No backend/analytics/ad SDK or generic service framework | Dormant future DTO/UI fields, unreachable art, throwaway tools |
| SRP | Mixed | Worker, DB, and many leaf engine modules are cohesive | `tickWeek`, protocol, large screens, and App own several concerns |
| OCP | Appropriate | Explicit data tables and unions make changes auditable | Wire changes are high-touch and behavior pins resist movement |
| LSP | Healthy / mostly inapplicable | Composition and discriminated unions; almost no inheritance | No meaningful class-substitution problem found |
| ISP | Weakest SOLID area | Leaf modules expose focused functions | One broad snapshot/protocol and 35 direct game-store consumers |
| DIP | Strong macro, mixed inside engine | Engine has no Vue/Pinia dependency | Runtime cycles and engine-to-visualization dependencies invert ownership |

## DRY: duplicate knowledge, not repeated syntax

### TB-01 — P1: tiebreak serving has two authoritative algorithms

`src/engine/match/scoring.ts:157-170` and `src/engine/match/liveProb.ts:13-26` contain byte-equivalent
`tbFlip`, `tiebreakServer`, and `tiebreakOpenerFrom` functions. `liveProb.ts` says it mirrors scoring
because of a former file-ownership rule. The scoring test at `tests/match/scoring.test.ts:148` does
not establish parity between the two consumers.

This is not harmless duplication. If a scoring correction changes only one copy, the match can
serve with one rotation while the displayed live probability assumes another. That violates the
game's “honest math” promise.

**Recommendation:** move the three pure functions to `engine/match/tiebreakServe.ts`, import them
from both consumers, and test arbitrary in-progress tiebreak states. This is a demonstrated shared
rule and deserves exactly one owner.

### TB-05 — P2: the UI owns a parallel eligibility classifier

`src/composables/tierState.ts:326-339` calls `entryBandTrack` the UI copy of the engine rule.
`tierState` at `:610-803` combines age, points, outgrown state, acceptance, junior/pro caps,
scheduling, and text. The engine owns the authoritative gate in
`src/engine/world/medical.ts:254-435` and its entry verdict after `:476`. Comments at
`tierState.ts:581-609` document earlier disagreements and the later `engineOpen` oracle.

The UI must explain policy, but it should not independently decide it. A card that says “open”
while `enterEvent` refuses—or says “locked” while the engine allows—is a user-facing correctness
bug.

**Recommendation:** project a neutral per-tier verdict into the snapshot: status/reason code,
threshold or cut, cap usage, outgrown state, and next eligible week. Keep English wording, card
layout, and calendar decoration in the UI. Do not move engine policy into a “shared UI” helper.

### Other useful consolidations

| Duplicate knowledge | Evidence | Minimal owner |
| --- | --- | --- |
| Eight-week horizon appears three times | `world/constants.ts:45`, `tierState.ts:812`, `SeasonScreen.vue:404` | Snapshot field or dependency-neutral constant |
| Career watermarks reimplement storage semantics | `inboxCue.ts:80-143`; `App.vue:272-286,517-668`; `TourBriefingDialog.vue:63-84` | Typed `useCareerWatermark` with explicit absent-value policy |
| Tournament odds/presentation repeated | `SeasonScreen.vue:229-411`; `CalendarScreen.vue:241-261` | Pure upcoming-event presentation model, not one mega-card |
| Allocation priority comparator repeated | `season/tournament.ts:849-853`; `world.ts:2178-2183` | Exported deterministic comparator |
| Country map and flag helper repeated | `OnboardingWizard.vue:53,193`; `KidScreen.vue:124,131`; three more components | `shared/countries.ts` |
| Match stats rows/template repeated | `TournamentFlow.vue:596-604,1062`; `PracticeFlow.vue:93-101,236` | Pure rows helper and small table component |
| Competition-rank assignment repeated | `season/ranking.ts:360+`; `season/fieldPros.ts:911+` | One rank assignment after caller-owned sort |
| Page-chapter segmented styling repeated | `StatsScreen.vue:387-393`; `MoneyScreen.vue:1265-1294`; `MoreScreen.vue:904-922` | Semantic `appearance="chapter"` on `SegmentedRow` |
| Component-test helpers repeated | `snapshotAfter` in eight tests; `fnv1a` in five; worker harness in four | A few focused test helpers |

The last row does not justify a giant test framework. Extract only stable fixture semantics and
leave scenario mutation local to each test.

### Intentional repetition to keep

- Explicit exceptions in `TIERS` and `ECONOMY` are tuned data, not algorithms. Defaults and
  inheritance would obscure balance.
- A protocol union and an explicit worker `switch` describe different responsibilities. They
  should remain visibly separate even after reply typing improves.
- Migration steps and golden fixtures are frozen historical behavior. Similar transformations must
  not be “cleaned up” across versions.
- Tiny `computed` projections and prop adapters are cheaper than a generic view-model framework.
- Persisted narration may intentionally preserve old wording. Do not globally reformat historical
  money text to satisfy DRY.

## KISS: explicit is good; globally entangled is not

The project uses a very good kind of simplicity at the top level:

- two production dependencies (Vue and Pinia);
- worker-owned mutable state;
- pure deterministic engine functions;
- discriminated messages rather than class hierarchies;
- an explicit serialized command queue;
- one append-only save migration chain.

KISS degrades when a simple change requires understanding several unrelated histories. The clearest
example is `tickWeek`: `src/engine/world.ts:2712-3290` is a 579-line ordered transaction spanning
season rollover, finance, body state, planning, tournament entry, development, life events, AI
draws, housekeeping, and endings. Its explicit order is valuable; its mixed scope is not.

The minimal design is not an event bus. Keep one readable recipe and extract cohesive phase
functions with narrow inputs/outputs. The top-level order and RNG sequence must remain obvious.

Historical incident essays are the other KISS problem. For example, `MatchViewer.vue:29-144`
contains more than 100 lines of prop history before current behavior, while weekly orchestration
contains multi-paragraph incident narratives. Keep a short current invariant and failure mode next
to code; put measurements, quotes, rejected attempts, and chronology in a dated decision/incident
document.

## YAGNI: remove promises that have no consumer

### Dormant contract surface

- `world/endings.ts:406-415,428-433` emits `childBorn` and `freshCapitalFork` while hard-coding no
  child. `protocol.ts:2781-2797` exposes them, but `EndingScreen.vue:124` consumes only
  `resumesWeek`; `tests/ending.test.ts:769-775` protects dead constants.
- `protocol.ts:1582-1596` reserves a `conduct` penalty with no producer.
- `protocol.ts:28-29` persists literal `gender: 'girl'`; onboarding presents a disabled
  “Boy / coming later” choice at `OnboardingWizard.vue:378-395`, but no gender behavior exists.
- `MatchViewer.vue:67-86` accepts weather temperature and describes it as not wired; tests protect
  the seam while the tournament flow cannot provide it.

Adding a union member or view field later is cheap. Carrying it now means more contracts, fixtures,
tests, copy, and product promises.

**Recommendation:** remove unconsumed ending handoff fields and the reserved `conduct` member until
behavior ships. Preserve the legacy gender field if migration cost outweighs value, but remove the
disabled future-choice affordance. Either complete weather in the next planned wave or remove the
partial hook and re-add it with the feature.

### Dormant repository surface

- Four exports appear unused within the repository:
  `CAREER_ENDING_PRIOR_SEVERITIES` and `ENDING_BLURB` in `engine/ending.ts`, `debtWarningText` in
  `world/endings.ts`, and `firstWeekOfMonth` in `shared/dates.ts`.
- 119 TypeScript tools are included in the main app typecheck, while only 18 have package-script
  entry points. `fork-birthday-probe.ts` and `match-clock-probe.ts` call themselves throwaway.
- Seven unreachable future-life WebP frames, about 400 KiB, remain under `public`; Vite excludes
  them from precache but still treats them as shipped files.

Verify there is no external API consumer before removing exports. Classify tools as supported
bench, reproducibility instrument, or archival scratch; move archive-only programs to an on-demand
tools typecheck. Keep original art in the master store and publish only reachable assets.

## SOLID without ceremony

### SRP

SRP is strong in `worker/sim.worker.ts`, `db/saves.ts`, and many engine leaves. It is mixed in
`world.ts`, `protocol.ts`, MatchViewer, SeasonScreen, HomeScreen, and App. Split by independent
reason-to-change—playback vs audio, command vs snapshot, watermarks vs overlay precedence—not by an
arbitrary line threshold.

### OCP

Explicit tables and discriminated unions are appropriate for a deterministic game. Adding a command
should remain a visible multi-site change. What should improve is type proof that all sites agree,
not the introduction of reflection or registries. Source-text behavior pins currently make internal
movement artificially “closed”; replace them with behavior tests when touching the feature.

### LSP

There is almost no inheritance and no material substitution failure. Adding interfaces or base
classes to improve an LSP score would violate KISS and YAGNI.

### ISP

`Snapshot` spans roughly 434 lines and 70 fields, and 35 components/composables import the global
game store directly. This creates broad compile and retrieval coupling. Modularize protocol types,
then make leaf dialogs accept narrow DTO props and emit events when already being changed. Screens
and App can remain store-aware containers. Do not force a whole-app rewrite.

### DIP

The macro dependency direction is excellent: no Vue, Pinia, component, or store import was found in
engine/worker/DB/shared code. Internal DIP is weaker because economy/calendar and two other groups
form runtime cycles, and engine match-presentation modules import from `viz`. The fixes are neutral
leaf modules and honest ownership, not service interfaces.

## Principle-level conclusion

The codebase does not need a “clean architecture” rewrite. It needs four precise moves:

1. one owner for correctness-sensitive rules;
2. acyclic neutral leaves for shared constants/contracts;
3. engine verdicts rather than UI policy replicas;
4. cohesive phase and view extraction behind existing behavior tests.

That combination improves all four requested principles without turning a solo game into an
> ⭐ **OWNER RULING, 18.08.2026 — narrowed.** Fix comments that are FACTUALLY WRONG about current
> behaviour; KEEP comments that record a decision and its reasoning, even when the decision is also in
> `docs/decisions.md`. The removal half of this finding conflicts with `CLAUDE.md`'s "preserve them
> verbatim" and with the 17.08 decision entry, which states that the reasoning deliberately stays in
> the file it governs. See PR-19 in `07-proposals-and-roadmap.md` for the full ruling.

enterprise framework.
