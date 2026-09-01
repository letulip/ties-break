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
// ⭐ ROUND 32 #5 – the band a signed letter was written at, read off the cheque the paper states.
// `offers.ts` does not import this file (it reaches `world/ledger` and stops), so the edge is a
// straight one and not a cycle.
import { adBandOfTerms } from '../offers'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { TierId } from '../season/types'
import type { AdOfferTerms } from '../../shared/protocol'
import type { WorldState } from '../world'

/** How much of a step survives `delta` weeks after the event – 1 fresh, half at the half-life,
 *  never negative and never amplifying (an event in the future contributes nothing: it has not
 *  happened, and fame is an account of what has). */
// ⭐ EXPORTED SINCE ROUND 30 #23 (30.08) so `world/brand.ts` can decay the crowd ledger on the SAME
// half-life rather than keeping a second copy of this curve. One definition, many readers – the rule
// `world/business.ts` states and the one a copied three-line decay would quietly break the day the
// half-life is retuned.
export function decayAt(deltaWeeks: number): number {
  if (deltaWeeks < 0) return 0
  return Math.pow(0.5, deltaWeeks / ECONOMY.fame.halfLifeWeeks)
}

/** ⭐⭐ ROUND 32 #5 – HOW MUCH OF A DELIVERED SHOOT'S OWN FAME SURVIVES `delta` WEEKS, on the
 *  CAMPAIGN's half-life rather than the title's. Same curve, shorter memory: «мало кто смотрит
 *  журналы 2 годичной давности», and a championship is recited in every broadcast for years while a
 *  campaign is one season's wallpaper.
 *
 *  ⚠ A SECOND CURVE AND NOT A SECOND COPY OF THE FIRST. `decayAt` is the title clock and this is the
 *  campaign clock; they are two facts about the world, so they are two constants and one shape. */
export function shootFloorDecayAt(deltaWeeks: number): number {
  if (deltaWeeks < 0) return 0
  return Math.pow(0.5, deltaWeeks / ECONOMY.fame.shootFloorHalfLifeWeeks)
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
  // ⭐⭐⭐ ROUND 32 #5 – AND THE COLLABORATIONS SHE HAS ACTUALLY DELIVERED, on the same ledger as a
  // title (docs/specs/collaborations-as-early-fame-2026-08.md). The owner: «на раннем этапе
  // коллаборации нам должны помочь, они станут хорошим рычагом роста известности».
  //
  // ⚠⚠ ADDED HERE AND NOT MULTIPLIED BELOW, WHICH IS THE ITEM. `fameShootMultOf` reads the same
  // weeks and still multiplies – both survive on his ruling («давай, да»), the add being the early
  // rung and the multiplier the late one. A multiplier cannot lift a career with nothing to
  // multiply, and that career – top 20, no titles – is exactly the one he asked the lever for.
  //
  // ⚠ BY THE BAND OF THE DEAL THAT ASKED FOR THE WEEK, never flat: «глобальный дом это не локальный
  // ретейнер». And on the CAMPAIGN's own half-life, which is shorter than a title's – what lasts is
  // carried by brand STRENGTH (`world/brandStrength.ts`), so there is no permanent residue here and
  // therefore no unbounded term needing a cap picked out of the air.
  for (const shoot of completedShootsByBand(world, week)) {
    floor += (F.shootFloorByBand[shoot.band] ?? 0) * shootFloorDecayAt(week - shoot.week)
  }
  return Math.min(F.cap, floor)
}

/** ⭐ THE SHOOT WEEKS SHE HAS ACTUALLY LIVED, strictly before `week` – the spec's «shoots
 *  completed». A week still ahead is a promise, not a photograph; and a week the college freeze
 *  swallowed lapsed silently (`AdOfferTerms.shootWeeks`' own contract – «мы ни за что не
 *  наказываем» applies to contracts too), so it bought no fame either. */
export function completedShootWeeks(world: WorldState, week: number): number[] {
  const out: number[] = []
  for (const offer of world.offers ?? []) {
    if (offer.kind !== 'ad' || offer.state !== 'signed') continue
    for (const w of shootWeeksLived(world, offer.terms as AdOfferTerms, week)) out.push(w)
  }
  return out
}

/** ⭐ ONE LETTER'S SHOOT WEEKS THAT WERE ACTUALLY LIVED, strictly before `week` – the predicate the
 *  two folds above share so a delivered shoot cannot mean one thing to the multiplier and another to
 *  the floor. ⚠ Extracted verbatim by round 32 #5; not a rule change. */
function shootWeeksLived(world: WorldState, terms: AdOfferTerms, week: number): number[] {
  const c = world.college
  const out: number[] = []
  for (const w of terms.shootWeeks ?? []) {
    if (w >= week) continue
    if (c && w >= c.fromWeek && w < c.untilWeek) continue
    out.push(w)
  }
  return out
}

/** ⭐⭐ ROUND 32 #5 – THE SAME WEEKS, EACH CARRYING THE BAND OF THE DEAL THAT BOUGHT IT.
 *
 *  ⚠ THE FILTER IS `completedShootWeeks`' OWN, not a second copy of it – a week still ahead is a
 *  promise and a week the college freeze swallowed lapsed silently, and both rules have to mean the
 *  same thing in the floor as they do in the multiplier or one delivered shoot would be two
 *  different facts. This walks the offers a second time only because it needs the LETTER as well as
 *  the week; the predicate lives in one place and is called from both.
 *
 *  ⚠ SIGNED LETTERS ONLY, so a refused campaign buys nothing and an expired offer buys nothing –
 *  the fame ledger reads what happened, never what was proposed. */
export function completedShootsByBand(world: WorldState, week: number): { week: number; band: number }[] {
  const out: { week: number; band: number }[] = []
  for (const offer of world.offers ?? []) {
    if (offer.kind !== 'ad' || offer.state !== 'signed') continue
    const terms = offer.terms as AdOfferTerms
    const band = adBandOfTerms(terms)
    for (const w of shootWeeksLived(world, terms, week)) out.push({ week: w, band })
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

/** ⭐⭐⭐ ROUND 32 #4 – EVERY WEEK ON WHICH FAME CAN GO UP, deduplicated and sorted.
 *
 *  ⚠⚠ IT EXISTS BECAUSE FAME IS PIECEWISE-DECAYING, AND THAT IS THE WHOLE ARGUMENT. Every term of
 *  the floor and of the multiplier is a fixed step faded by `decayAt` / `shootFloorDecayAt`, both of
 *  which are strictly decreasing in the gap – so between two of these dates fame can only FALL, and
 *  a maximum of fame over any span is attained ON one of them (or at the span's own end). That is
 *  what lets `world/brandStrength.ts` find the best she has ever been by asking O(records)
 *  questions instead of O(weeks) ones, EXACTLY rather than on a grid.
 *
 *  ⚠ A SHOOT DATES AT `w + 1`, NOT AT `w` – `completedShootWeeks`' own «strictly before `week`»
 *  rule, so the week a photograph is taken is the week AFTER it that first pays for it. Off by one
 *  here would put the maximum a week early and quietly under-read every stock built on shoots.
 *
 *  ⚠ IT LISTS DATES AND PRICES NOTHING. The steps are `fameAt`'s to apply, so a retune of any rung
 *  moves the answer without moving this list – and a source of fame added tomorrow has to be added
 *  here too, which is the one coupling this function has and is stated so it is not discovered.
 *
 *  Pure: reads the world, writes nothing, draws nothing. */
export function fameEventWeeks(world: WorldState): number[] {
  const seen = new Set<number>()
  for (const tier of Object.keys(ECONOMY.fame.titleFloor) as TierId[]) {
    for (const w of world.trophiesByTier?.[tier]?.titles ?? []) seen.add(w)
  }
  for (const w of world.trophiesByTier?.slam?.finals ?? []) seen.add(w)
  for (const row of world.seasonHistory ?? []) {
    if (row.byTrack?.wta?.endRank == null) continue
    seen.add((row.seasonIndex + 1) * WEEKS_PER_YEAR)
  }
  for (const offer of world.offers ?? []) {
    if (offer.kind !== 'ad' || offer.state !== 'signed') continue
    for (const w of (offer.terms as AdOfferTerms).shootWeeks ?? []) seen.add(w + 1)
  }
  return [...seen].sort((a, b) => a - b)
}

/** ⭐⭐ FAME, 0–100 – the floor times the shoot multiplier, capped. FRACTIONAL: the house rule is
 *  «round the display, not the logic», so the one rounding happens at the snapshot boundary
 *  (`toSnapshot`), exactly as `condition` does it. Pure: reads the world, writes nothing, draws
 *  nothing. */
export function fameAt(world: WorldState, week = world.week): number {
  return Math.min(ECONOMY.fame.cap, fameFloorOf(world, week) * fameShootMultOf(world, week))
}
