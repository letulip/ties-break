---
type: review
status: audit
area: architecture
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# DRY, KISS, YAGNI, SOLID, architecture and code

## Principle scorecard

| Principle | Verdict | Why |
| --- | --- | --- |
| DRY | Good core, weak at view/domain boundaries | Central tuning and scoring are explicit; injury reporting, App watermarks and a few projections still maintain parallel truths |
| KISS | Strong macro design, mixed integration | Worker + pure engine + snapshot is simple; huge orchestration/SFC owners and string parsing make local work harder than the product requires |
| YAGNI | Mostly disciplined, with visible future seams | No speculative service framework; dormant protocol/UI/art promises and private-life state-first planning remain |
| SRP | Mixed | DB/worker and many engine leaves are cohesive; `tickWeek`, protocol, App and large screens have multiple state owners |
| OCP | Appropriate | Explicit unions/tables are auditable; additions are high-touch at protocol/store boundaries |
| LSP | Healthy / mostly inapplicable | Composition and discriminated unions dominate; inheritance is not the problem |
| ISP | Weakest SOLID area | The protocol/store/view boundary exposes broad unions and makes screens pull engine helpers or reconstruct facts |
| DIP | Strong macro, mixed internally | Engine is independent of Vue/Pinia; engine match-presentation code still imports `viz`, and projection boundaries are incomplete |

## Findings

### ARCH-01 – P1 – Injury reporting interprets prose as a data contract

`src/components/InjuryStopDialog.vue:59-80` searches the broad event feed to infer whether an injury
came from a retirement. At `:92-117` it identifies released entries by an English prefix and removes
an English suffix. At `:132-135` it treats any same-week line starting `Entry refunded` as the
injury refund.

The comments and `tests/component/injury-cancelled-row.test.ts:8-20` record that this already broke
when the engine changed one sentence. Importing a shared prefix reduced one spelling mismatch; it did
not remove the UI's responsibility for interpreting prose.

**Consequence:** copy editing can silently change financial/cancellation facts on a blocking player
report. The UI must retrieve events, upcoming entries and engine word fragments to answer one
question.

**Minimal change:** derive an `injuryReport` beside `toSnapshot`, containing structured
circumstance, cancelled entries, forfeited entries and refund cents. It is a view DTO, so it need not
be persisted. The component remains responsible for wording and layout.

### ARCH-02 – P1 – Integration hubs are growing faster than their decomposition

`WorldState` still begins at `src/engine/world.ts:491`; `tickWeek` now spans
`src/engine/world.ts:3108-3789`. It orders season rollover, sponsorship/staff, finance, college,
body/planner, fields, the player's event, development, injury, birthdays, school, AI tournaments,
rankings, housekeeping and endings.

`protocol.ts` now combines domain DTOs, diary (`src/shared/protocol.ts:2374-2618`), the 500-line
Snapshot beginning at `:3259`, commands at `:3842` and replies at `:3937`.

**Consequence:** feature work converges on two high-conflict files and agents must load unrelated
domains. The earlier decomposition reduced cycles but did not yet change where new integration code
lands.

**Minimal change:** keep a visible ordered `tickWeek` recipe, but extract cohesive phases with named
inputs/outputs and no runtime callbacks into `world.ts`. Split stable protocol seams behind the
existing barrel. Do not create a phase registry, event bus or one-interface files.

### ARCH-03 – P2 – Commands are not correlated with legal replies

`src/worker/client.ts:131-157` returns `Promise<ToUI>` for every request. The store then repeats
manual narrowing, for example `src/stores/game.ts:215-246`; an unexpected successful reply simply
does not update the snapshot. `takeOk` narrows error vs success, not command vs success kind.

**Consequence:** a worker replying with the wrong success variant compiles and can leave stale UI.
Adding a command requires coordinated edits without a type-level proof of the reply pair.

**Minimal change:** add a request-type-to-success-reply map and generic `ReplyFor<R>`, or small typed
client methods if they read more clearly. Centralize snapshot application so an impossible success
throws in development/tests. Keep the explicit worker switch.

### ARCH-04 – P2 – Engine/presentation dependency direction is still inverted

- `src/engine/match/matchStats.ts:23-29` imports an annotated visualization type and runtime clock
  function from `viz`.
- `src/engine/match/rally.ts:7-18` imports visualization contracts and runtime `COURT`.
- `src/engine/match/serveSpeed.ts:33` imports a visualization point type.

There is no current runtime SCC, and match outcomes remain independent. The problem is ownership:
presentation-only rally/stats/clock concepts are placed under the engine while depending on `viz`.

**Minimal change:** either move neutral presentation contracts/clock arithmetic to a shared leaf, or
move explicitly presentation-only rally/stats/speed annotation under `viz/match`. Add one dependency
test. Do not introduce interfaces between every match module.

### ARCH-05 – P2 – App owns repeated storage state machines

`src/composables/inboxCue.ts` already exposes a failure-tolerant generic `useWatermark`. App still
manually implements this-week, trophy, season-wrap, injury, college-done and tour marks, with raw
`localStorage` reads/writes across `src/App.vue:250-289`, `:517-595`, `:635-676`, `:1076-1098` and
`:1203-1222`.

**Consequence:** missing-key semantics, career switching and storage failure handling drift. New
features keep adding another watcher/key/ref group to the shell, which is now 1,521 lines.

**Minimal change:** migrate the existing families to the generic hook with explicit missing-value
policy; add one small boolean/identity adapter if needed. Preserve the semantic difference between
“unknown means already seen” and “unknown means must be shown.” Extract storage behaviour, not
overlay precedence.

### ARCH-06 – P2 – Calendar has an independent state owner hidden inside a screen

`CalendarScreen.vue` is 1,359 lines. Its script owns screen orchestration, grid projection, event
modal state and a timer/lifecycle-driven irreversible day-cross sweep
(`src/components/screens/CalendarScreen.vue:103-384`). Its 1,079-line source test pins timer and skip
implementation strings (`tests/calendar-screen.test.ts:968-1001`).

**Minimal change:** extract only `useDayCrossSweep`, owning crossed/held/running state, timers,
watch/unmount, run and skip. Convert the animation assertions to a mounted fake-timer test. Keep the
calendar grid and event card in the screen.

### ARCH-07 – P2 – Diary repeats life-stage rules and uses a misleading fact name

The same “family-home vs independent” predicate is repeated in
`src/engine/diary/pool.ts:82-84`, `weekNotes.ts:154-158` and `travelNotes.ts:15-17`.
`WeekClaims.athome` is documented as physically at home at `weekNotes.ts:78-79,118-122`, while the
adjacent life-stage comment admits it only means “not travelling” at `:154-155`.

**Consequence:** future adult lines can license household observation from a travel fact, and every
editorial pool owns the same age-stage test.

**Minimal change:** share a domain-named life-stage voice predicate beside `diaryLifeStageFor`, and
rename the travel fact/claim toward `notTravellingWeek` or `noTournamentJourney`. Keep the fridge's
college-aware “living away” meaning separate.

### ARCH-08 – P2 – Small proven duplicates remain, but broad abstraction would be worse

- Event priority still repeats the same tier-index ordering in
  `src/engine/season/tournament.ts:715` and `src/engine/world/coachMarket.ts:1284`.
- `fundsShort` remains local in both Season and Calendar despite their shared event-card facts
  (`SeasonScreen.vue:720`, `CalendarScreen.vue:252`).
- Verified global CSS blocks such as `.onboarding-dots` and the old `.breakdown-*` rows remain in
  `src/style.css:979` and `:3139-3234` without a current DOM consumer; donut rules in the same region
  are live and must be retained.

Extract the two demonstrated domain rules and delete CSS only in mounted/screenshot-checked batches.
Do not build a tournament-card mega-component or a generic sorting framework.

### ARCH-09 – P3 – A few future/dead seams still enlarge the supported surface

- `conduct` remains reserved in `src/shared/protocol.ts:1691` with no producer.
- Three handoff fields are deliberately dormant, documented at
  `src/shared/protocol.ts:3141-3158`; the owner has explicitly left the YAGNI decision open.
- Onboarding renders a disabled Boy choice for post-v1 work at
  `src/components/OnboardingWizard.vue:377-395`.
- `firstWeekOfMonth` is exported only from `src/shared/dates.ts:254` with no repository consumer.
- Seven future-life art frames and four superseded sleepy frames remain shipped under `public`; the
  cache excludes them, but their lifecycle is “parked by owner,” not accidental.

Treat these as owner/product decisions, not an automatic deletion batch. The cheapest unambiguous
removal is the unused date export after an external API check. The disabled future-choice UI should
be removed even if the legacy save literal remains.

## SOLID interpretation for this codebase

SOLID does not require more classes here. The project correctly uses functions, explicit records
and discriminated unions. The useful applications are:

- **SRP:** identify state owners (weekly order, playback clock, day-cross sweep, watermarks), not a
  file-count target.
- **OCP:** typed maps and explicit switches should make additions fail loudly; dynamic registration
  would reduce auditability.
- **LSP:** no material issue because inheritance is nearly absent.
- **ISP:** split retrieval-heavy protocol domains while preserving one public import path.
- **DIP:** engine outcomes depend on neutral domain types; UI receives structured verdicts rather
  than interpreting prose or rebuilding decisions.

## Large files that should not be split mechanically

- `economy.ts`: one measured tuning surface. Resolve ownership/cycles, then split catalogue from
  algorithms only if change history proves it useful.
- `calendar.ts`: catalogue and deterministic construction are related; do not split by tier.
- `migrations.ts`: chronological append-only history is an audit feature.
- `viz/commentary.ts` and diary phrase tables: editorial consistency is a real cohesion boundary.
- `world/injury.ts`: cohesive at about 500 lines.
- `world/medical.ts`: if touched, recovery/accrual (`:70-209`) is the one honest seam from ranked
  availability/entry gates (`:224-886`).
