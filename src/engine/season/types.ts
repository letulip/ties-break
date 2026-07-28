// types.ts (verbatim contract; M and N import from here)
import type { MatchPlayer, Surface } from '../match/types'

/** The playable ladder. The domestic rungs (`local` → `regional` → `national`) hand over to the
 *  junior international tour (`j30` → `j60` → `j300`); the inert `itf` placeholder was replaced by
 *  that family in the ladder-up slice. J500/J200/J100 analogues are content for later. */
export type TierId = 'local' | 'regional' | 'national' | 'j30' | 'j60' | 'j300'
export interface TierDef {
  id: TierId
  label: string
  drawSize: 8 | 16 | 32
  entryFeeCents: number
  travelCostCents: [number, number] // [min,max], drawn per event instance
  points: number[] // by finish: [W, F, SF, QF, R16?, R32?] length matches rounds+1
  everyNWeeks: number
  /** EXTRA events of this tier placed inside the season's SECOND half, on top of the
   *  `floor(weeks / everyNWeeks)` evenly-spaced ones (R9-20 national densification). */
  secondHalfBonus?: number
  /** R12-6: the smallest allowed distance, in weeks, between two events OF THIS TIER. Absent (or 1)
   *  means adjacency is fine, which is the historical behaviour and the right one for the dense
   *  entry rungs. 2 means "never on consecutive weeks".
   *
   *  It exists because `secondHalfBonus` places its extras by their own even spread, with no idea
   *  where the base cadence already put one – so R9-20's two extra Nationals could land right next
   *  to a base-cadence National. The owner hit it twice in one season, once on the season's final
   *  two weeks. A per-tier knob rather than a rule, so which rungs care is an explicit table
   *  somebody can read and retune, not something to re-derive from `everyNWeeks`. */
  minGapWeeks?: number
  /** Minimum age in years to enter. Absent = no age gate. The junior tour opens at 13; our
   *  detailed sim starts at 14, so it never bites today – it is here for the childhood prologue. */
  minAgeYears?: number
  /** AI entrant-selection WINDOW on standings PERCENTILE (`(position + 1) / fieldSize`, 0 = best):
   *  a cohort player is a candidate for this tier's draws iff her percentile sits inside it.
   *  Windows OVERLAP for the same reason `enterPointBand` does – a junior plays several rungs at
   *  once – and every window is deliberately wider than the tier's `drawSize` so the field still
   *  moves week to week. Because a percentile is derived from ORDINAL POSITION, the candidate
   *  COUNT is a constant of the window (a permutation cannot change it), which is what keeps the
   *  per-week main-stream draw count independent of results and of player input. */
  entrantPctBand: [number, number]
  /** ranking eligibility WINDOW `[minPoints, maxPoints]` on the kid's EARNED ranking points
   *  (her windowed best-6 sum – an absolute measure of achievement, not a competition position).
   *  Eligible ⇔ `minPoints <= kidPoints <= maxPoints`: a tier opens once she has earned enough
   *  (`kidPoints >= minPoints`) and graduates her out once she has outgrown it (`kidPoints > maxPoints`).
   *  Bands overlap so two tiers can be open at once. Local's `minPoints` is 0 so a fresh (0-point)
   *  kid always starts at the bottom; national's `maxPoints` is a large sentinel so the top never closes. */
  enterPointBand: [number, number]
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
  /** hidden growth multiplier 0.5..1.5 – how fast she closes on her ceiling */
  growth: number
  /** her age in whole years, advanced at each season boundary (v20). Until Phase 4 the cohort had
   *  no age at all: everybody grew at the same rate for ever, which is why the top ten reached 71.6
   *  by the time the kid was 23 and the ladder could never be caught. */
  ageYears: number
  /** her ceiling, per attribute (v20). Same idea as the kid's: growth is a share of the distance
   *  still to go, so a rival approaches her limit and stops. The BAND is wide on purpose - most of
   *  a junior cohort never becomes anything, and a field where everyone is a future champion is
   *  the same rising tide with extra steps. */
  potential: { serve: number; ret: number; composure: number; stamina: number }
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
