# Phase 3 spec: the living world (cohort, calendar, ranking)

Goal: the Season tab becomes real — a yearly tournament calendar with entries and deadlines, a cohort of ~200 AI juniors with a rolling ranking, weeks that resolve into structured events feeding News (stories) and Money (ledger). Owner Q&A items 4, 5, 12 are binding here.

Ground rules as in the phase1 spec. Economy numbers stay in whole cents. All world randomness flows from the world RNG stream (deterministic replay preserved: **the RNG draw count per week must not depend on player input** — where player choices alter simulation paths, draw from purpose-scoped sub-RNGs seeded as `rngFromSeed(world.seed + ':' + tag)` instead of the main stream).

## Package L — pure engine (no worker/UI)

Files: `src/engine/season/types.ts` (contract — L authors it EXACTLY as below), `src/engine/season/calendar.ts`, `src/engine/season/cohort.ts`, `src/engine/season/ranking.ts`, `src/engine/season/tournament.ts`, `tests/season/*.test.ts`.

```ts
// types.ts (verbatim contract; M and N import from here)
import type { MatchPlayer, Surface } from '../match/types'

export type TierId = 'local' | 'regional' | 'national' | 'itf' // itf locked in Phase 3
export interface TierDef {
  id: TierId
  label: string
  drawSize: 8 | 16 | 32
  entryFeeCents: number
  travelCostCents: [number, number] // [min,max], drawn per event instance
  points: number[] // by finish: [W, F, SF, QF, R16?, R32?] length matches rounds+1
  everyNWeeks: number
}
export interface SeasonEvent {
  id: string // `${year}-w${week}-${tier}`
  week: number // absolute world week
  tier: TierId
  surface: Surface
  travelCostCents: number
  /** entries close at the END of week - 2 */
  deadlineWeek: number
}
export interface AiPlayer extends MatchPlayer {
  nation: string // ISO-2
  /** hidden growth multiplier 0.5..1.5; real development lands in Phase 4 */
  growth: number
}
export interface RankingRow { playerId: string; points: number; rank: number }
export interface MatchRecord {
  round: number // 0 = first round
  aId: string
  bId: string
  winnerId: string
  /** engine seed IF the user's kid played (replayable); AI-AI matches sim via closed form */
  seed?: string
  score?: string // final scoreline for kid matches, e.g. "6-4 3-6 7-6"
}
export interface TournamentResult {
  eventId: string
  matches: MatchRecord[]
  /** playerId -> finish index into TierDef.points (0 = champion) */
  finishes: Record<string, number>
}
```

- `calendar.ts`: `TIERS: Record<TierId, TierDef>` — local: draw 8, every 2w, entry $40, travel $60–120, points [30,18,10,5]; regional: draw 16, every 4w, entry $75, travel $150–400, points [80,48,28,14,6]; national: draw 32, every 13w, entry $120, travel $400–900, points [200,120,70,35,15,6]; itf: locked (present in TIERS, `everyNWeeks: 0`). `buildSeason(seedStr, fromWeek, weeks): SeasonEvent[]` — deterministic from a season sub-RNG; surfaces weighted hard 50 / clay 35 / grass 15; no two events the same week; local events avoid national weeks.
- `cohort.ts`: `generateCohort(seedStr, size = 199): AiPlayer[]` — names from a 40+ pool × surname pool, nations weighted toward tennis countries, skills at age-14 bands: serve/ret 30–60, composure 25–70, stamina 30–70, growth 0.5–1.5. `driftCohort(cohort, rng)`: tiny weekly drift (+0..0.05 per skill scaled by growth, clamp 0–100) — placeholder until Phase 4.
- `ranking.ts`: results carry `{playerId, week, points}`; `computeRanking(results, currentWeek)`: rolling 52-week window, **best 6** results per player, dense ranks, ties → more recent best result wins. Pure and total (every cohort member + the kid appear; zero-point players ranked after pointed ones, stable order).
- `tournament.ts`: `selectEntrants(event, cohort, ranking, rng)`: AI enter by rank percentile bands per tier (top ~25% aim national, next regional, rest local), fill to drawSize (the kid, when entered, takes a slot; overflow → lowest-ranked bumped). `runTournament(event, entrants, kid | null, worldSeed, rng): TournamentResult` — single-elimination, seeding 1/2 split by ranking; kid matches: `simulateMatch` with seed `` `${worldSeed}:${event.id}:r${round}` `` (store seed + score in the MatchRecord); AI-AI: `fastMatchProbability` + one rng draw.

Required tests (`tests/season/`): calendar determinism + structure (52-week span: 26 local / 13 regional / 4 national, deadlines = week-2, no same-week collisions); cohort determinism, bands respected, drift bounded; ranking window (results at week 1 vanish at week 54), best-6 (7 results → weakest ignored), tie-break, full coverage; tournament: bracket sizes, every match has a winner, finishes consistent with the bracket, kid's matches carry seed+score and are reproducible (re-run simulateMatch with the stored seed → same winner), entrant selection respects percentile bands, total points awarded per event = sum over finishes of TierDef.points.

## Package M — worker integration (after L and K1)

Files: `src/engine/world.ts` (v6), `src/engine/migrations.ts`, `src/shared/protocol.ts`, `src/worker/sim.worker.ts`, `src/stores/game.ts`, `tests/world.test.ts` (extend), `tests/events.test.ts` (new).

- `WorldState` v6 adds: `cohort: AiPlayer[]`, `results: {playerId, week, points}[]`, `season: SeasonEvent[]` (rolling: always ≥ 26 future weeks generated), `entries: string[]` (eventIds), `events: WorldEvent[]`, `nextEventId: number`. Migration v<6: generate cohort/season from the save's seed, wrap old `log` strings as `info` events (keep `log` field dropped — Snapshot switches to events).
- `WorldEvent = { id, week, type: 'info'|'expense'|'income'|'entry'|'match'|'tournament'|'milestone', text: string, amountCents?: number, match?: MatchRecord & {eventId, oppName}, keep?: boolean }`. Cap: last 400 events, but `keep: true` (milestones: first title, first national win, rank milestones 100/50/10/1) never pruned.
- Week resolution order (replaces the old log lines; same weekly base-cost logic, now emitted as an `expense` event): base costs → if an entered event is THIS week: charge travel (expense event), `runTournament`, emit per-round `match` events for the kid + one `tournament` summary event (+points into `results`; milestone events when earned) → `driftCohort` → AI tournaments for events the kid skipped (points for AI) → ranking recompute (store kid's rank in world for cheap access) → prune events.
- Entries: `enterEvent(eventId)` — validates deadline not passed, funds ≥ entry fee, not already entered; charges the fee immediately (expense event; refunded by `withdrawEvent` before the deadline). Both emit `entry` events.
- Advance: `{type:'advance', weeks: 1|4}` → ticks up to N weeks, stopping EARLY (before ticking further) when: the kid has an entered event that week (stop AFTER resolving it), a deadline for any affordable regional+ event falls within the next week, or funds crossed below zero. Response carries `stopReason?: 'tournament'|'deadline'|'funds'`.
- Snapshot additions: `careerId` (from K1), `events` (last 60), `upcoming: SeasonEvent[]` (next 8 weeks, with `entered` flags), `kidRank: number`, `standings: RankingRow[]` (top 10 + 5 around the kid, deduped), `stopReason?`.
- Replays (Q&A 12): kid `match` events keep the engine seed + both players' skill snapshots (`MatchPlayer` copies) so `simulateMatch` + `annotateMatch` reproduce the match on demand. No AnnotatedMatch is ever persisted.
- RNG discipline: cohort drift and AI tournaments draw from the MAIN weekly stream (fixed draw pattern per week — iterate ALL scheduled events each week whether or not the kid entered, AI selection always runs); kid-dependent branches use event-scoped seeds only. Extend the determinism test: two worlds, same seed, different entry choices → `driftCohort` outcomes identical week by week.
- Tests: migration v5→v6 (old log becomes info events; cohort/season generated); entry validation (deadline, funds, refund); week with a tournament produces match/tournament/expense events and ranking points; advance(4) stops on tournament week with `stopReason: 'tournament'`; events cap prunes but `keep` survives; determinism as above.

## Package N — UI (after M and K2)

Files: `src/components/screens/SeasonScreen.vue` (rewrite), `src/components/screens/HomeScreen.vue` (This-week + News sections only), `src/components/screens/MoneyScreen.vue` (rewrite), `src/components/TournamentCard.vue` + `src/components/StandingsTable.vue` (new, if useful), `src/components/MatchReplay.vue` (new: takes a kid match event → rebuilds AnnotatedMatch → MatchViewer), `src/App.vue` (advance-bar: "▶▶ 4" uses `{type:'advance'}` and surfaces stopReason as a toast/hint), `src/style.css` (append).

- **Season**: next-8-weeks list — event cards (tier label + surface chip + week, entry fee + travel estimate, deadline chip "closes W{n}", Enter/Withdraw behind ConfirmDialog with the fee named; Enter disabled with reason when past deadline / insufficient funds / already that week). "My entries" strip. Standings card: top 10 + around-the-kid rows, kid highlighted (accent), rank movement arrow vs last week if cheap. ITF tier chip visible but locked ("unlocks later").
- **Tournament week**: when the latest events contain this week's tournament — bracket card: rounds with the kid's path highlighted, per-match score lines; kid's matches get "Watch" → MatchReplay (result is already committed — the replay is optional cinema, exactly Q&A 12).
- **Home**: This-week card shows the entered event (or "no event – training week"); News = non-financial events (info/entry/match/tournament/milestone; milestones get 🏆 and stay pinned at top of their week group).
- **Money**: ledger from financial events grouped by week, signed amounts, running balance line; funds big number stays on top.
- Console clean; live-verify entering an event, advancing into it (stop + toast), watching a replay, ledger correctness at 375 px.

## Reporting
Per package: files, terse behavior notes, gate status (typecheck / full suite / build), measured numbers where relevant (L: ranking distribution sanity; M: save size at week 100 with cohort), spec conflicts (report, don't resolve).
