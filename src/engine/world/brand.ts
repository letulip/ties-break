// ⭐⭐⭐ THE BRAND – round 30 #23 and #24, and it is TWO functions of ONE signal set.
//
// THE OWNER, 30.08, on being shown that a convex income curve hands a $250,000 rung an ~$8.7M peak
// valuation: «а что с этой цифрой не так? вроде бы как раз спонсорские коллаборации со спортсменами
// дают и не такое, а кратно большее.» He is right and the research agrees with him – Sugarpova
// peaked at a $20M valuation, the RF mark is estimated at ~$27M, and Federer's ~3% of On peaked near
// $500M (docs/research/player-brands-and-what-they-are-worth.md §7b/§7c). ⚠ SO THERE WAS NEVER A
// CONFLICT BETWEEN THE TWO SIZING CRITERIA – only a wrong belief that $8.7M was an overshoot.
//
// AND HIS ACTUAL INSTRUCTION, which is bigger than the number: «Давай математику и динамику оценим и
// станет понятно всё. У нас есть её профессионализм, сколько играет, сколько выигрывает, как глубоко
// проходит и вся остальная информация… Всё это можно использовать в расчете так или иначе.»
//
// ⭐⭐ THE SHAPE, AND IT IS THE REPAIR THE PREVIOUS PASS COULD NOT FIND. Income and worth used to be
// ONE dial: `worth = 16 x a year of income`, so nothing could move one without moving the other by
// exactly the same proportion. They are now two functions over the same signals, and the split is
// finding §5.1 of the research written as arithmetic:
//
//   * INCOME IS CURRENT FORM. It is fame – the decaying fold over titles, lost Slam finals, seasons
//     ended in band and lived shoot weeks – and it goes UP AND DOWN with her. A season with no
//     titles is a season the brand sells less.
//   * THE MULTIPLE IS THE ACCUMULATED CAREER. How long she played, how high she finished, how deep
//     she went, how often she won. «BRAND VALUE FOLLOWS THE ACCUMULATED STOCK, NOT CURRENT FORM» is
//     §5.1's first finding verbatim (Sugarpova expanded through a doping ban; EleVen survived
//     thirteen years of decline), and an accumulated stock is exactly what a buyer's multiple is:
//     what he will pay PER DOLLAR of what the thing earns, which is a judgement about durability and
//     not about this week.
//
// ⚠⚠ SO THE WORTH FALLS IN-CAREER AND THAT IS THE POINT (the owner, correcting the argument for it:
// «но это уже будет после завершения игры, по сути нас это не очень интересует, разве нет?» – the
// post-retirement decline is out of frame and NOTHING here models it). What is in frame is the slump
// the player actually sits through: a season lost to injury, a year with no title, fame decaying
// while she is not winning. Income is convex in fame, so those falls are felt harder than they used
// to be, and `tools/brand-dynamics.ts` measures how often they happen inside a live career.
//
// ⚠ AND THE MULTIPLE DOES NOT FALL, WHICH IS DELIBERATE AND IS NOT A RATCHET SMUGGLED IN. A career
// that happened cannot un-happen: twelve seasons on tour are twelve seasons on tour in the year she
// is hurt. The FALL lives in the income, where the player can feel it and act on it; the multiple is
// the part of the story that is already written.
//
// ⭐⭐⭐ WHY THIS FILE EXISTS AT ALL, AND IT IS THE FOUNDATION NOTE (the owner: «по сути этот мерч
// бренд это фундамент для этого слоя» – the collaboration layer). Everything below is arithmetic on
// THE BRAND'S OWN ECONOMICS, with no idea who owns it: `brandSignalsOf` reads the career,
// `brandWeeklyGrossCents` and `brandMultipleX` price a WHOLE brand, and `brandGrossWorthCents`
// multiplies the two. OWNERSHIP is applied one file up, in `world/assets.ts`, where the owned row
// lives – and today the family owns all of it, so the boundary is a multiplication by one that is
// never written down.
//
// ⚠⚠ THAT BOUNDARY IS A DOOR AND NOT A HINGE, AND NO FIELD IS ADDED FOR IT. A partner buying into
// her brand is a share on the owned row and a single `x share` where the two functions cross into
// `assets.ts`; it is not a second income model beside this one. Adding the field TODAY would be a
// dead field, which is the same disease as a dead guard – so the seam is here and the door is not
// hung. See docs/specs/brand-worth-and-income-2026-08.md §6 for which of the three future shapes
// this accommodates cheaply and which one needs different machinery.
//
// ⚠⚠ ZERO DRAWS ON ANY STREAM, AND THE SAME PROOF `world/fame.ts` CARRIES. There is no `Rng`
// argument in this file, no clock, no `Math.random` and no persisted field: every number below is
// re-derived from records the career already keeps and never prunes, so a load cannot drift it and
// the frozen MAIN capture (41550 / e6b0c709) cannot see it. A valuation is a fold over history.
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { fameAt } from './fame'
import type { TierId } from '../season/types'
import type { WorldState } from '../world'

/** ⭐⭐ EVERYTHING THE BRAND KNOWS ABOUT THE CAREER, in one read. His own list, in his own order:
 *  «её профессионализм, сколько играет, сколько выигрывает, как глубоко проходит».
 *
 *  ⚠ IT IS A VALUE OBJECT AND NOT A CACHE. Nothing stores it, `brandSignalsOf` rebuilds it on every
 *  read, and the two pricing functions below take it rather than a world – which is what lets a
 *  bench sweep a hypothetical career without building one, and what keeps the pricing testable
 *  without a ticked world behind it. */
export interface BrandSignals {
  /** the fame stock, fractional, at the week asked for – `world/fame.ts`, unrounded. */
  fame: number
  /** ⭐ «СКОЛЬКО ИГРАЕТ» – finished seasons that carry a WTA end-rank, i.e. seasons she spent as a
   *  professional. ⚠ A season with no recorded WTA rank counts NOTHING and is not counted as a bad
   *  one: «not recorded» is not «unranked», which is `academyReputationOf`'s own distinction and the
   *  season mirror's before it. */
  proSeasons: number
  /** ⭐⭐ «ОНА ЖЕ ТОП-20 В МИРЕ» – seasons ended inside `value.topEndRank`, counted once each. This is
   *  round 30 #24's claim carried into the WORTH as well as into the fame floor: a career built on
   *  quarter- and semi-finals is a real career and a buyer can see it in the standings. */
  topSeasons: number
  /** ⭐⭐ «КАК ГЛУБОКО ПРОХОДИТ» – finals REACHED AND LOST at a professional tier, dated in the trophy
   *  ledger (`TierTrophies.finals`, whose contract is that a title never appears here too).
   *
   *  ⚠⚠ THIS IS THE DEEP-RUN SIGNAL THE PREVIOUS PASS SAID DID NOT EXIST, and the correction is
   *  narrow: round 30 #24 concluded «TierTrophies stores titles and finals and NOTHING BELOW a
   *  final», which is true and which stops a QUARTER-final being counted. It does not stop a FINAL
   *  being counted, and the fame floor reads `finals` only at 'slam' – so every lost final from w15
   *  to wta1000 is a dated professional result that nothing in the game has ever read. It is read
   *  here, and only into the multiple: what she WON is already priced into the income through fame,
   *  and pricing it twice would be one dial wearing two hats again. */
  finalsLost: number
  /** ⭐ «СКОЛЬКО ВЫИГРЫВАЕТ» – her career win rate ON THE WTA TRACK, 0..1, over finished seasons.
   *  ⚠ THE WTA TRACK AND NOT THE FOLD: `SeasonHistoryEntry.wins` adds all three tables together, so
   *  a junior season of easy wins would read as professional form. `byTrack.wta` is the professional
   *  record and is the only one a brand should be able to see – the same rule that keeps junior
   *  draws out of the fame floor. 0 when she has played no professional match at all. */
  winRate: number
}

/** ⭐⭐ THE CAREER, READ. Pure: reads the world, writes nothing, draws nothing.
 *
 *  ⚠ `week` IS TAKEN AND NOT ASSUMED, exactly as `fameAt` takes it, because the shelf quotes «one
 *  more week of holding» by asking the same question at `week + 1` (`assetWorthCents`' own
 *  `weekOffset`). Everything except fame is week-independent by construction – a season that has
 *  been banked stays banked – so only the fame term moves, which is the fall the player feels. */
export function brandSignalsOf(world: WorldState, week = world.week): BrandSignals {
  const V = ECONOMY.business.merch.value
  let proSeasons = 0
  let topSeasons = 0
  let wins = 0
  let losses = 0
  for (const row of world.seasonHistory ?? []) {
    const wta = row.byTrack?.wta
    if (!wta || wta.endRank == null) continue
    proSeasons++
    if (wta.endRank <= V.topEndRank) topSeasons++
    wins += wta.wins
    losses += wta.losses
  }
  let finalsLost = 0
  // ⚠ THE PROFESSIONAL TIERS ARE `titleFloor`'S OWN KEY SET and are not re-listed here. That list IS
  // the game's definition of «a tier the world notices» (world/fame.ts: «the world does not read
  // junior draws»), and a second copy of it would be free to drift away from the first.
  for (const tier of Object.keys(ECONOMY.fame.titleFloor) as TierId[]) {
    finalsLost += world.trophiesByTier?.[tier]?.finals.length ?? 0
  }
  const played = wins + losses
  return {
    fame: fameAt(world, week),
    proSeasons,
    topSeasons,
    finalsLost,
    winRate: played > 0 ? wins / played : 0,
  }
}

/** ⭐⭐⭐ WHAT A WHOLE BRAND TAKES IN THIS WEEK, in cents, before anybody owns it – §7e's convex
 *  curve, and the shape is FORCED rather than chosen.
 *
 *  THE TWO CONSTRAINTS, and there is exactly one family of curves through both (research §7e):
 *    * THE BOTTOM IS ALREADY RIGHT AND WAS DELIBERATELY CALIBRATED. At the fame a family holds the
 *      week it can first afford the brand, the old linear dial yielded 6.0% a year on its $250,000
 *      against the index fund's 7% – `ECONOMY.business.merch`'s own stated anchor, confirmed live by
 *      `tools/merch-fame-vs-rank.ts`. A flat multiplier would break the end that is right.
 *    * THE TOP IS 3–13x UNDER THE RESEARCHED BAND. A top full own-brand nets on the order of
 *      $0.5M–$2M a year (§7d, a derivation from Sugarpova's $20M valuation and EleVen's $5–12M
 *      turnover); the linear dial paid $156k a year at fame 100.
 *
 *  Hold the anchor, reach the band, and what is left is convex. This is the simplest member, pivoted
 *  on the anchor itself, so it is IDENTICAL at `famePivot` by construction and diverges above it.
 *
 *  ⚠ AND IT IS WHY THE IN-CAREER FALL BITES HARDER NOW: a third off her fame is more than half off
 *  her brand's income. That is the asset behaving like an asset, and it is measured rather than
 *  hoped for – `tools/brand-dynamics.ts` counts the seasons inside a LIVE career in which the worth
 *  fell, which is the only fall the game is in frame for. */
export function brandWeeklyGrossCents(signals: BrandSignals): number {
  const M = ECONOMY.business.merch
  return Math.round((M.perFamePointCents * signals.fame * signals.fame) / M.famePivot)
}

/** ⭐⭐⭐ WHAT A BUYER PAYS PER DOLLAR OF WHAT IT EARNS – the multiple, EARNED rather than constant.
 *
 *  ⚠⚠ THIS FUNCTION IS THE WHOLE DECOUPLING. While the multiple was a constant, worth was income
 *  wearing a bigger number and no signal could reach one without reaching the other in the same
 *  proportion. Here the career's own durability moves it, and fame does not appear at all – so two
 *  careers at IDENTICAL fame are worth different money, which is the thing the old model could not
 *  express: a girl who was famous for one enormous season is not the asset a girl who was top-20 for
 *  eight years is, however loud the two seasons sounded.
 *
 *  ⚠ THE BAND IS NARROW ON PURPOSE AND THE SCALE LIVES IN THE INCOME. `baseX` is the multiple a brand
 *  with nothing behind it earns and `maxX` is the ceiling; the research's own band is wide, thin and
 *  a choice (Beckham's DRJB ~10.9x profit, the Nadal academy ~31x – §5.4), so the sizing criterion is
 *  ours: hold the day-one «fair on the day they can afford it» reading that round 30 #9 measured,
 *  and let the spread between a flash and a reign be the item. See
 *  docs/specs/brand-worth-and-income-2026-08.md for predicted vs measured.
 *
 *  ⚠⚠ `baseX` IS THE RUNG'S OWN `earningsMultipleX` AND IS PASSED IN RATHER THAN READ HERE, so the
 *  catalogue keeps exactly one number saying «this rung is priced on its earnings, and this is where
 *  that pricing starts». A copy of it in `ECONOMY.business.merch.value` would be a second home for
 *  one fact and would be free to drift from the row the shop actually sells.
 *
 *  Pure arithmetic on a value object: no world, no clock, no draw. */
export function brandMultipleX(signals: BrandSignals, baseX: number): number {
  const V = ECONOMY.business.merch.value
  let x = baseX
  x += V.seasonX * Math.min(signals.proSeasons, V.seasonCapN)
  x += V.topSeasonX * Math.min(signals.topSeasons, V.topSeasonCapN)
  x += V.finalX * Math.min(signals.finalsLost, V.finalCapN)
  // ⚠ THE WIN-RATE TERM IS A SHARE OF A WINDOW AND NOT A RATE TIMES A WEIGHT, so a career that loses
  // more than it wins earns nothing here and is never charged for it – «мы ни за что не наказываем»
  // read against a signal that is below its window for most of a climbing career.
  const span = V.winRateTo - V.winRateFrom
  const over = Math.min(1, Math.max(0, (signals.winRate - V.winRateFrom) / span))
  x += V.winRateX * over
  return Math.min(V.maxX, x)
}

/** ⭐⭐ WHAT A WHOLE BRAND IS WORTH, in cents, before anybody owns it: a year of what it takes in,
 *  times the multiple the career has earned. The two functions above, joined – and the only place
 *  they are joined, so a screen and a valuation cannot disagree about what a brand is worth.
 *
 *  ⚠ NO FLOOR HERE. The mark's floor is a share of what the FAMILY PAID (`businessValueFloorShare`),
 *  which is a fact about the owned row and not about the brand, so it is applied at the ownership
 *  boundary in `world/assets.ts` where the row is. */
export function brandGrossWorthCents(signals: BrandSignals, baseX: number): number {
  return Math.round(brandWeeklyGrossCents(signals) * WEEKS_PER_YEAR * brandMultipleX(signals, baseX))
}
