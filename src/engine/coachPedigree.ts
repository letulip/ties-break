/** ⭐⭐ ROUND 53 №2 (21.10) – FAMOUS NAMES: SOME ELITE COACHES HAVE A PAST (docs/specs/coach-pay-ladder-2026-10.md §3.4).
 *
 *  A leaf: pure in (seed, coachId, tier), no world, no UI. A former champion of a big tournament or a former
 *  world number one stands on the top of the market, costs +50% of his LABOUR over everything else (the court is
 *  not his to inflate) and gives something back, one trade each – his chemistry, her ceiling, her sponsors' phone,
 *  or the top hitting partner's door.
 *
 *  ⚠⚠ ITS OWN SUB-STREAM, `${seed}:coach:pedigree:${id}`, three draws drawn unconditionally (presence, kind,
 *  trade). `buildCoachRoster` draws on `${seed}:coaches` and is not touched: every roster a career has already met
 *  keeps its names, rates and manners to the byte, with the pedigree off or on (`tests/round53-coach-pedigree.test.ts`
 *  digests it). Nothing here persists: the stream is re-derived at every call site, so «who is famous» is a fact
 *  of the seed and a release does not change it. Zero MAIN draws. Names and titles stay FICTIONAL (CLAUDE.md). */
import { rngFromSeed } from './rng'
import type { CoachTier } from '../shared/protocol'

export type PedigreeKind = 'slam-winner' | 'former-no1'
export type PedigreeTrade = 'chemistry' | 'ceiling' | 'sponsors' | 'sparring'

export interface CoachPedigree {
  kind: PedigreeKind
  trade: PedigreeTrade
}

/** THE NUMBERS, in one place (measured: spec §4.3). */
export const COACH_PEDIGREE = {
  /** one elite slot in four has a past – a draw, so a market of four elite slots holds none in ~32% of careers */
  chance: 0.25,
  /** +50% on his labour, on top of the band ladder – `marketLabourCentsFor` is the one place that applies it */
  labourFactor: 1.5,
  /** chemistry: the pair starts one band warmer (phase), and every GAINING week counts 1.25× */
  chemistryStartPhase: 0.25,
  chemistryGainFactor: 1.25,
  /** ceiling: her potential reads this many points higher in the growth step while he is in the chair */
  ceilingPoints: 2,
  /** sponsors: the arrival bar is raised by 1 / 0.75 (a cadence of three weeks in four) and the fee by 1.2 */
  sponsorCadenceFactor: 0.75,
  sponsorFeeFactor: 1.2,
} as const

const KINDS: readonly PedigreeKind[] = ['slam-winner', 'former-no1']
const TRADES: readonly PedigreeTrade[] = ['chemistry', 'ceiling', 'sponsors', 'sparring']

/** null for a non-elite coach and for 3 in 4 elite ones. Pure; the stream is the only draw. */
export function coachPedigree(seed: string, coachId: string, tier: CoachTier): CoachPedigree | null {
  if (tier !== 'elite') return null
  const rng = rngFromSeed(`${seed}:coach:pedigree:${coachId}`)
  const present = rng() < COACH_PEDIGREE.chance
  const kind = KINDS[Math.min(KINDS.length - 1, Math.floor(rng() * KINDS.length))]
  const trade = TRADES[Math.min(TRADES.length - 1, Math.floor(rng() * TRADES.length))]
  return present ? { kind, trade } : null
}
