// ⭐⭐ FAME – round 29 part four P7/P8, the first implementation of
// docs/specs/fame-and-the-shoots-2026-08.md.
//
// «нам важны разные спонсоры и их появление как можно раньше в плане фотосессий и их количества –
// это прямой рычаг известности. Можно попробовать для этого какую-то измеримую механику и четкий
// механизм сделать.» – and his «здесь полностью согласен» on the spec's shape: THE FLOOR IS EARNED
// ON COURT AND THE SHOOTS MULTIPLY IT. A champion who never shoots is still famous (Świątek is not
// famous for photo shoots); a face with no results has nothing for the photographs to multiply.
//
// ⚠⚠ FAME IS AN ACCOUNTED STOCK, NEVER A ROLL – the spec's §3 in code. It is a pure fold over
// records the world already persists and never prunes:
//
//   * TITLES, dated – `trophiesByTier[tier].titles` (weeks, append-only, schema v31);
//   * LOST SLAM FINALS, dated – the same ledger's `finals` at 'slam';
//   * TOP-10 SEASONS – `seasonHistory[].byTrack.wta.endRank` ≤ 10, per finished season;
//   * SHOOT WEEKS ALREADY LIVED – `AdOfferTerms.shootWeeks` on SIGNED letters (absolute career
//     weeks, frozen at signature – the spec's §2: «a fold over world.offers, no new bookkeeping»).
//
// There is no `Rng` argument anywhere in this file, no clock, no `Math.random` and no persisted
// field: fame is re-derived from the career's own history on every read, so a load cannot drift it
// and RNG input-independence (the permanent law, capture 41550 / e6b0c709) is not merely respected
// but UNREACHABLE – there is no die for a player's choice to move. `tests/round29p5-business.test.ts`
// proves the zero-draw claim on a ticked world rather than trusting this header.
//
// ⚠ AND IT DECAYS, SLOWLY – every contribution halves on `ECONOMY.fame.halfLifeWeeks` (two
// seasons). Decay is what makes fame a lever rather than a rank by another name (spec §3): a reign
// stays famous through itself and fades over four to six seasons after, which is «a rolling
// memory, not a trophy».
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { TierId } from '../season/types'
import type { AdOfferTerms } from '../../shared/protocol'
import type { WorldState } from '../world'

/** How much of a step survives `delta` weeks after the event – 1 fresh, half at the half-life,
 *  never negative and never amplifying (an event in the future contributes nothing: it has not
 *  happened, and fame is an account of what has). */
function decayAt(deltaWeeks: number): number {
  if (deltaWeeks < 0) return 0
  return Math.pow(0.5, deltaWeeks / ECONOMY.fame.halfLifeWeeks)
}

/** ⭐ THE FLOOR – what the court earned, decayed to `week`, clamped to the cap. Zero for a career
 *  the world has not noticed, which is every junior and most of the tour: the fame ladder starts
 *  at the professional tiers because the world does not read junior draws. */
export function fameFloorOf(world: WorldState, week: number): number {
  const F = ECONOMY.fame
  let floor = 0
  for (const [tier, step] of Object.entries(F.titleFloor) as [TierId, number][]) {
    const shelf = world.trophiesByTier?.[tier]
    if (!shelf) continue
    for (const w of shelf.titles) floor += step * decayAt(week - w)
  }
  // the one runner-up plate the world remembers – `finals` means she LOST the final (the trophy
  // ledger's own contract), so a Slam title never counts twice.
  for (const w of world.trophiesByTier?.slam?.finals ?? []) floor += F.slamFinalFloor * decayAt(week - w)
  // Seasons ended inside a band the world notices, decaying from each season's own wrap – the wrap
  // fires on the season's last week, so the date is the row's own identity and nothing new is
  // stored. ⚠ BEST MATCHING BAND ONLY, once per season: `academy.reputationBands`' own rule, so a
  // top-10 season is a top-10 season and never also a top-20 one.
  // ⚠⚠ AS SHIPPED THE LADDER HAS ONE RUNG AND THIS IS THE OLD `top10SeasonFloor` LINE EXACTLY – see
  // the constant's header, and round 30 #24 for the question a second rung would answer.
  for (const row of world.seasonHistory ?? []) {
    const endRank = row.byTrack?.wta?.endRank
    if (endRank == null) continue
    const band = F.seasonEndBands.find((b) => endRank <= b.maxEndRank)
    if (!band) continue
    floor += band.add * decayAt(week - (row.seasonIndex + 1) * WEEKS_PER_YEAR)
  }
  return Math.min(F.cap, floor)
}

/** ⭐ THE SHOOT WEEKS SHE HAS ACTUALLY LIVED, strictly before `week` – the spec's «shoots
 *  completed». A week still ahead is a promise, not a photograph; and a week the college freeze
 *  swallowed lapsed silently (`AdOfferTerms.shootWeeks`' own contract – «мы ни за что не
 *  наказываем» applies to contracts too), so it bought no fame either. */
export function completedShootWeeks(world: WorldState, week: number): number[] {
  const out: number[] = []
  const c = world.college
  for (const offer of world.offers ?? []) {
    if (offer.kind !== 'ad' || offer.state !== 'signed') continue
    for (const w of (offer.terms as AdOfferTerms).shootWeeks ?? []) {
      if (w >= week) continue
      if (c && w >= c.fromWeek && w < c.untilWeek) continue
      out.push(w)
    }
  }
  return out
}

/** ⭐ THE MULTIPLIER – 1 with no shoots, each lived shoot week adding `shootStep` (decayed on the
 *  same half-life as the floor), capped at `shootMultCap`. The player's lever, exactly as the spec
 *  splits the two sources: the floor is nobody's to choose and this is the thing he buys with her
 *  condition and her winters. */
export function fameShootMultOf(world: WorldState, week: number): number {
  const F = ECONOMY.fame
  let steps = 0
  for (const w of completedShootWeeks(world, week)) steps += decayAt(week - w)
  return Math.min(F.shootMultCap, 1 + F.shootStep * steps)
}

/** ⭐⭐ FAME, 0–100 – the floor times the shoot multiplier, capped. FRACTIONAL: the house rule is
 *  «round the display, not the logic», so the one rounding happens at the snapshot boundary
 *  (`toSnapshot`), exactly as `condition` does it. Pure: reads the world, writes nothing, draws
 *  nothing. */
export function fameAt(world: WorldState, week = world.week): number {
  return Math.min(ECONOMY.fame.cap, fameFloorOf(world, week) * fameShootMultOf(world, week))
}
