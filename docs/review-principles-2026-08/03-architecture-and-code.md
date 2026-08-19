---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Architecture and code structure

## Architectural verdict

The macro architecture is release-worthy and should be protected:

```text
Vue screens / Pinia store
          │ typed commands and snapshots
          ▼
worker client ── generation/restart discipline
          │
          ▼
simulation worker ── clone → execute → persist → commit
          │                         │
          ▼                         ▼
deterministic engine            IndexedDB saves
```

`sim.worker.ts:194-209` mutates a candidate, persists it, then swaps committed memory/revision.
Queue serialization and per-task error isolation are at `:649-674`. `worker/client.ts:95-155`
rejects dead-generation pending calls, ignores late replies, and disposes a wedged worker. Save
records and career metadata use one CAS transaction (`db/saves.ts:232-339`), and autosave reads can
fall back across two checksummed generations (`:501-530`).

These are meaningful improvements over the old audit. They deserve regression tests and should not
be destabilized by a broad rewrite.

## TB-02 — P1: economy/calendar is a proven runtime cycle

`engine/economy.ts:17` imports `WEEKS_PER_YEAR` from `season/calendar.ts`. Calendar imports runtime
`ECONOMY` back from economy at `calendar.ts:11`. `economy.ts:419-425` records the real browser
failure: reading the calendar constant during object initialization threw a temporal-dead-zone
error while Vitest stayed green, so the table hard-codes `52`. Economy still reads the imported
constant in a function at `:2603-2605`.

`shared/dates.ts:55-57` already owns the neutral `WEEKS_IN_SEASON = 52`.

**Correction:** make the shared dates leaf the sole runtime owner. Both economy and calendar import
it; calendar can compatibility-re-export `WEEKS_PER_YEAR`. Add a browser/build-level import smoke
test if the existing production build does not exercise initialization. No interface is needed for
a number.

## TB-07 — P2: two more runtime strongly connected components

### Coach, cohort, development

`engine/coach.ts:37-40` imports `SURNAMES` from `season/cohort`; cohort imports
`relativeAgeHeadStart` from development; development imports coach functions. The modules therefore
load as a cycle even though surname data is neutral.

**Correction:** extract names and surname selection to `engine/season/names.ts`, used by coach and
cohort. This removes the reverse edge at a cohesive seam.

### World mutation depends on aggregate projection

`world/college.ts:39` imports `kidLadderRank` from `world/snapshot.ts`. That helper is only a small
composition of ladder functions already available to college. Snapshot in turn imports birthday,
endings, coach market, and sponsors; those modules reach college through other paths. The result
includes `birthday → college → snapshot → birthday` and
`coachMarket → endings → college → snapshot → coachMarket`.

**Correction:** move `kidLadderRank` into the ladder domain and import it from both snapshot and
college. Mutation modules should not depend on the aggregate projection layer.

Resolve cycles before decomposing more hubs; otherwise a file split improves appearance without
improving dependency direction.

## TB-06 — P2: command and reply types are not correlated

`shared/protocol.ts:3358-3438` defines `ToWorker`, while `:3443-3465` separately defines `ToUI`.
`worker/client.ts:131-157` returns `Promise<ToUI>` for every request. Store callers manually narrow:
`stores/game.ts:215-245` checks for `snapshot`; export silently returns for an unexpected success at
`:526-537`; peek returns `null` at `:551-562`.

The protocol proves that messages are valid individually but not that a command received a legal
reply. A worker regression can compile and leave stale UI without a hard failure.

**Correction:** introduce a command-to-success-reply map and a generic client request, or expose a
small typed client grouped into mutations, queries, and persistence. Centralize snapshot application
with an assertion on unexpected success. Keep the worker's explicit exhaustive switch.

## Engine and presentation dependency direction

`engine/match/rally.ts` calls itself pure presentation but imports viz contracts and runtime
`COURT`; `engine/match/matchStats.ts` imports `AnnotatedMatch` and `matchDurationSeconds` from viz;
`engine/match/serveSpeed.ts` imports a viz point type. `viz/types.ts` then imports engine match
types. Outcomes remain separate in practice, but the structure allows core engine tasks to reach
presentation time/court concerns.

Two coherent choices exist:

1. move neutral point/timeline contracts, court geometry, and clock arithmetic to a shared leaf; or
2. move the explicitly presentation-only rally/stats/serve-speed modules under `viz/match`.

The second is semantically honest if no outcome code consumes them. Either choice is better than an
interface layer that preserves the same cycle.

## Snapshot sufficiency and UI policy

The worker remains authoritative and revalidates commands, so direct UI imports are not a security
bypass. They are a cohesion and change-risk issue. Examples:

- `composables/tierState.ts` imports calendar catalogues and world gates, then reconstructs entry
  policy;
- `PlanWeekSheet.vue:24-135` imports store, economy, coach, world, and calendar to rebuild quotes,
  affordability, caution, medical, and layoff gates;
- Home reads `ECONOMY` thresholds to construct warnings;
- SeasonScreen directly imports match, world, calendar, tournament, RNG, and economy modules.

For command-affecting UI, snapshots or explicit worker queries should supply structured reason codes
and quoted values. The UI should own wording and layout. Presentation-only sandbox and replay code
may keep pure engine imports where doing so does not duplicate authority.

## `world.ts`: improved facade, remaining hub

The decomposition from roughly 5,500 to 3,589 lines is real progress. The broad re-export block at
`world.ts:139-303` also protects around a hundred established imports, so deleting it in one wave
would create noise without value.

Two responsibilities remain oversized:

- `WorldState` at `:412-787` is a 376-line flattened schema covering unrelated persisted domains;
- `tickWeek` at `:2712-3290` is the weekly transaction and deterministic phase order.

Recommended shape:

```text
engine/world.ts                 compatibility facade + public orchestration
engine/world/state.ts           schema version, WorldState composition, initialization types
engine/world/tick.ts            visible ordered weekly recipe
engine/world/seasonBoundary.ts  rollover and yearly transitions
engine/world/bodyWeek.ts        condition/injury/planner phase
engine/world/competitionWeek.ts tour context, kid event, AI fields
engine/world/developmentWeek.ts growth, school, life events
```

Start with functions in the same file if necessary, characterize phase order/RNG, then move them.
Do not create callbacks from extracted modules back into `world.ts`; that would conceal the same
coupling. A type-only state split must not imply a save-format migration.

Keep the facade for compatibility, but require new engine code to import the owning leaf. Migrate
production UI deep imports opportunistically, not in a mechanical all-repo sweep.

## Protocol decomposition

`shared/protocol.ts` is 3,466 lines, about 120 exports, and mixes player/profile types, finance,
calendar/health, offers, career endings, a 70-field snapshot, transport unions, and runtime display
helpers. It also imports engine types while engine modules import protocol types. Type-only edges are
erased, but the conceptual ownership remains circular.

Safe first split:

```text
shared/protocol/index.ts        compatibility exports only
shared/protocol/commands.ts     worker requests
shared/protocol/responses.ts    success/error replies and reply map
shared/protocol/snapshot.ts     aggregate UI projection
shared/protocol/profile.ts      setup and stable identity DTOs
shared/protocol/events.ts       calendar, health, finance event DTOs
shared/protocol/career.ts       endings, offers, sponsors, career DTOs
```

Use `export type { ... } from` for types; the production build is the guard against accidental
runtime re-exports. Prefer cohesive 300–800-line modules over one-interface files. Keep the old
import path as a facade until consumers naturally migrate.

## Large UI composition roots

### MatchViewer

The 2,612-line file owns playback/visibility timing, audio cues, canvas state, commentary and shout
policy, controls, accessibility readout, and retirement handling. Extract:

- `useMatchPlayback` as the **single** requestAnimationFrame/visibility/time owner;
- `useMatchAudioCues` for sound policy;
- presentational `MatchControls` and `MatchCommentaryLog` children;
- a court canvas wrapper only if it can remain a pure renderer.

Never introduce multiple playback clocks.

### SeasonScreen

The 2,392-line screen owns event feed, tournament facts, planner confirmations, practice, exhibition,
and large styles. Extract the event presentation model first, then `useSeasonPlanner`, and move the
exhibition sandbox to its own section/component. Keep the screen as the store-aware container.

### App, Home, Money, onboarding

- App should keep centralized overlay precedence but move navigation and per-career watermark
  persistence into focused composables.
- Home should project focused card models rather than import tuning facts in each card.
- Money can divide tab panels/history/kit into children without creating a generic finance renderer.
- Onboarding can use step components and shared country/budget data; do not invent a general wizard
  engine for one wizard.

Leaf dialogs can gradually accept narrow props and emit commands. Screens and App do not need to be
store-free simply to satisfy a rule.

## Large files that should not be split mechanically

- `economy.ts`: first fix its cycle and compress historical prose. Its central tuning table is a
  valuable single source. If ownership later demands it, separate coherent training/travel/gear/
  career config and reassemble one stable API.
- `season/calendar.ts`: separate tier catalogue data from deterministic generation only after the
  cycle is gone; never make one file per tier.
- `migrations.ts`: retain chronological order. At most group release eras behind one registry when
  navigation becomes painful; never DRY old migrations together.
- `viz/commentary.ts`: curated voice benefits from co-location. Split by a demonstrated narrative
  ownership seam, not by tokens.
- `sim.worker.ts`: its explicit switch and serial queue are one auditable boundary.

## Architectural strengths to preserve

- no `Math.random()` use in the engine;
- persisted RNG state and purpose-scoped substreams;
- no UI access to mutable `WorldState`;
- match outcome and visualization separation in behavior;
- cents-based finance and shared money formatting;
- transactional save/CAS and autosave fallback;
- v0–v52 migrations and golden fixtures;
- strict TypeScript with no `as any` or `@ts-ignore` found in `src`;
- a deliberately small runtime dependency surface.
