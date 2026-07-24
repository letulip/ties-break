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
