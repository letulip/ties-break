// ⭐⭐⭐ ROUND 32 #3 – THE MULTIPLE ASKS ABOUT THE BRAND AND NOT ONLY ABOUT HER TENNIS.
//
// THE OWNER, off his own w933 career: «личный бренд в цене подрос с 250к до 1.8м, а доход у него 1800
// в неделю =))) что как-будто бы не очень соответствует стоимости. Надо как-то настроить этот момент.»
// Measured on that save before anything was proposed: fame 22.3, weekly gross $1,720, annual $89,428,
// multiple 18.23x (ceiling 20), worth $1,630,191. The arithmetic was internally consistent – every
// term of `brandMultipleX` read her TENNIS CAREER and none read the brand.
//
// HIS RULING, which is this file's specification: «её известность 22.3 – да, это ок, главное, чтобы
// ЭТА ИЗВЕСТНОСТЬ УЧАСТВОВАЛА В МЕХАНИЗМЕ, тогда мы увидим разницу на других карьерах.» And his
// standing one, which bounds it: «а что с этой цифрой не так? вроде бы как раз спонсорские
// коллаборации со спортсменами дают и не такое, кратно большее» – the ceiling is not to be cut.
//
// ⚠ WHAT THIS FILE HOLDS:
//   §1  the ramp's two ends – fame 0 is `unknownX`, fame `cap` is the rung's own `earningsMultipleX`;
//   §2  ⭐⭐⭐ THE TOP DOES NOT MOVE. At fame = cap the multiple is what it was before this wave, for
//       every career, and the proof is that the ramp lands on `baseX` there;
//   §3  ⭐⭐ FAME PARTICIPATES – two careers with IDENTICAL tennis records and different fame are worth
//       different money, which was impossible before this wave at any setting;
//   §4  the four career rungs are a PREMIUM ON TOP and are untouched – they still never fall, and
//       they still never see a title;
//   §5  the multiple CAN now fall, which overturns `world/brand.ts`' own shipped note, deliberately;
//   §6  the crossover: `maxX` is no longer what holds the top, and where it does bind;
//   §7  his w933 shape, MIRRORED and never derived from his save, reads single digits.
//
// ⚠⚠ HIS SAVES ARE READ-ONLY AND NOTHING HERE COMES OUT OF ONE. §7 builds a career with the same
// SHAPE as the row he reported – 14 professional seasons, one inside the top 20, 19 professional
// finals lost, a win rate in the high sixties, fame in the low twenties – out of this file's own
// fixtures. The save was read once, on the command line, to produce the control in
// docs/specs/brand-multiple-follows-fame-2026-08.md §2; no byte of it is in the repo.
//
// ⚠ MUTATION-VERIFIED – the log is at the foot of this file.
import { describe, it, expect } from 'vitest'
import {
  brandMultipleX,
  brandSignalsOf,
  brandWeeklyGrossCents,
  closeTournament,
  createWorld,
  fameAt,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  type BrandSignals,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const MERCH = 'merch-brand'
const BASE_X = shopItem(MERCH)!.earningsMultipleX!
const V = ECONOMY.business.merch.value
const CAP = ECONOMY.fame.cap

/** A world twelve weeks in, professional, solvent – `round30-brand-value.test.ts`' own `shopper`. */
function shopper(seed: string, weeks = 12): WorldState {
  const world = createWorld(seed)
  world.bestFinishByTier.wta250 = 3
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = 5_000_000_00
  return world
}

function parkAt(world: WorldState, week: number): WorldState {
  world.week = week
  return world
}

function proSeasons(world: WorldState, n: number, endRank: number, wins: number, losses: number): void {
  world.seasonHistory ??= []
  for (let i = 0; i < n; i++) {
    world.seasonHistory.push({
      seasonIndex: i,
      endRank,
      points: 0,
      wins,
      losses,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { points: 0, wins: 0, losses: 0 },
        wta: { endRank, points: 0, wins, losses },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    })
  }
}

function loseFinals(world: WorldState, tier: TierId, weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.finals.push(...weeks)
}

function winTitles(world: WorldState, tier: TierId, weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.titles.push(...weeks)
}

/** ⭐⭐ THE PRE-ROUND-32 MULTIPLE, THROUGH THE SHIPPED FUNCTION AND NOT A COPY OF THE OLD FORMULA.
 *  The base now ramps from `unknownX` to `baseX` across fame 0..cap, so asking `brandMultipleX` at
 *  fame = cap returns exactly what the flat base returned for the same career. That is what makes
 *  §2's claim checkable without a second worktree – and if the ramp ever stops landing on `baseX`
 *  there, every arm below that uses it reddens at once. */
const pre32 = (s: BrandSignals): number => brandMultipleX({ ...s, fame: CAP }, BASE_X)

/** the multiple of a bare signal set at a chosen fame – no world, which is what `BrandSignals` being
 *  a value object is for. */
// ⚠ `strength` MIRRORS `fame` HERE AND THAT IS THE HONEST READING FOR THIS FILE. Round 32 #4 gives
// the brand a second, slower stock and `brandMultipleX` still reads `fame`, so every arm below is
// unaffected by it – but a value object built by hand has to say what it means, and what these arms
// mean is «a career whose stock is exactly its fame», i.e. one sitting at its own peak.
const at = (fame: number, over: Partial<BrandSignals> = {}): number =>
  brandMultipleX({ fame, strength: fame, proSeasons: 0, topSeasons: 0, finalsLost: 0, roomSize: 0, winRate: 0, ...over }, BASE_X)

describe('round 32 #3 §1 – the base is a ramp and these are its two ends', () => {
  it('⭐⭐ a brand nobody has heard of is `unknownX`, and one the whole world knows is the rung own base', () => {
    expect(at(0), 'fame 0 – nothing behind it and nobody watching').toBe(V.unknownX)
    expect(at(CAP), 'fame at the cap – the ramp has arrived at the catalogue own number').toBe(BASE_X)
    // ⚠ AND THE TWO ENDS ARE NOT THE SAME NUMBER, which is the whole item: before this wave they
    // were, and an unknown's brand traded at the veteran's multiple.
    expect(V.unknownX).toBeLessThan(BASE_X)
  })

  it('⚠ it is monotone in fame and linear between them, so no fame is worth less than a smaller one', () => {
    let last = -Infinity
    for (let f = 0; f <= CAP; f += 0.5) {
      const x = at(f)
      expect(x, `fame ${f} is worth at least as much as the point below it`).toBeGreaterThanOrEqual(last)
      last = x
    }
    // the midpoint is the midpoint – a ramp bent into a curve would fail here while staying monotone
    expect(at(CAP / 2)).toBeCloseTo((V.unknownX + BASE_X) / 2, 10)
  })

  it('⚠⚠ and it cannot run past its own top, so the ceiling is unreachable through the ramp', () => {
    // `fameAt` already answers inside [0, cap], so this clamp cannot bite today. It is asserted
    // because the ONE thing this wave was forbidden to do is lift the top, and «no caller will ever
    // pass a bigger number» is not a proof of that.
    expect(at(CAP * 5), 'a fame past the cap is still the cap own multiple').toBe(at(CAP))
    expect(at(-10), '...and a negative one is still the floor').toBe(at(0))
  })
})

describe('round 32 #3 §2 – ⭐⭐⭐ THE TOP DOES NOT MOVE', () => {
  it('⭐⭐⭐ at fame = cap every career is priced exactly as it was before the wave', () => {
    // ⚠⚠ THE OWNER RULING THAT BOUNDS THIS WHOLE ITEM: «вроде бы как раз спонсорские коллаборации со
    // спортсменами дают и не такое, кратно большее.» The ceiling may not be cut. It is not cut, and
    // the reason is arithmetic rather than a promise: the ramp REACHES `baseX` at the cap, so the
    // multiple there is `baseX + ladder` – the pre-wave expression, term for term.
    const careers: [string, Partial<BrandSignals>][] = [
      ['nothing at all', {}],
      ['a few seasons', { proSeasons: 3, winRate: 0.7 }],
      ['his own shape', { proSeasons: 14, topSeasons: 1, finalsLost: 19, winRate: 0.682 }],
      ['a reign', { proSeasons: 12, topSeasons: 8, finalsLost: 12, winRate: 0.82 }],
      ['past every cap', { proSeasons: 40, topSeasons: 30, finalsLost: 60, winRate: 1 }],
    ]
    for (const [label, over] of careers) {
      const s: BrandSignals = { fame: CAP, strength: CAP, proSeasons: 0, topSeasons: 0, finalsLost: 0, roomSize: 0, winRate: 0, ...over }
      const ladder =
        V.seasonX * Math.min(s.proSeasons, V.seasonCapN) +
        V.topSeasonX * Math.min(s.topSeasons, V.topSeasonCapN) +
        V.finalX * Math.min(s.finalsLost, V.finalCapN) +
        V.winRateX * Math.min(1, Math.max(0, (s.winRate - V.winRateFrom) / (V.winRateTo - V.winRateFrom)))
      expect(brandMultipleX(s, BASE_X), `${label}: the pre-wave expression, to the cent`)
        .toBeCloseTo(Math.min(V.maxX, BASE_X + ladder), 10)
    }
  })

  it('⭐⭐ and the WORTH at the top is unchanged too, because the income never moved', () => {
    // The income is `perFamePointCents x fame² / famePivot` times the crowd tilt and round 32 did not
    // touch a character of it. So «the multiple is unchanged at the cap» IS «the worth is unchanged
    // at the cap», and the arm that keeps the income out of this wave is the one below: the weekly
    // gross does not read the career ladder at all.
    const quiet: BrandSignals = { fame: 40, strength: 40, proSeasons: 0, topSeasons: 0, finalsLost: 0, roomSize: 0, winRate: 0 }
    const decorated: BrandSignals = { ...quiet, proSeasons: 14, topSeasons: 8, finalsLost: 19, winRate: 0.9 }
    expect(brandWeeklyGrossCents(decorated), 'the ladder reaches the WORTH and never the income')
      .toBe(brandWeeklyGrossCents(quiet))
    expect(brandMultipleX(decorated, BASE_X), '...and the ladder really is live on this fixture')
      .toBeGreaterThan(brandMultipleX(quiet, BASE_X))
  })
})

describe('round 32 #3 §3 – ⭐⭐ HER FAME PARTICIPATES, which is what he asked for', () => {
  it('⭐⭐⭐ two careers with the SAME tennis record and different fame are worth different multiples', () => {
    // «главное, чтобы эта известность участвовала в механизме, тогда мы увидим разницу на других
    // карьерах.» ⚠⚠ THIS ARM WAS IMPOSSIBLE TO WRITE BEFORE ROUND 32 AT ANY SETTING: `brandMultipleX`
    // did not take fame, so an identical record forced an identical multiple by construction. If it
    // ever goes green on two equal multiples, the wave has been undone.
    const record: Partial<BrandSignals> = { proSeasons: 8, topSeasons: 2, finalsLost: 9, winRate: 0.72 }
    const unknown = at(5, record)
    const known = at(45, record)
    const famous = at(95, record)
    expect(known, 'the better-known brand is worth more per dollar it earns').toBeGreaterThan(unknown)
    expect(famous, '...and the household name more again').toBeGreaterThan(known)
    // ⚠ AND THE SPREAD IS WORTH HAVING rather than a rounding artefact – the shop rounds the number
    // it puts on the row, so a spread under a whole unit would be invisible to the player.
    expect(Math.round(famous) - Math.round(unknown)).toBeGreaterThanOrEqual(5)
  })

  it('⚠ ...and the fame it reads is the same stock the income reads, not a second number', () => {
    // The anti-vacuity direction: a wave that had introduced its own fame-like signal would pass the
    // arm above. This one reads `signals.fame`, which is `fameAt` – so a career whose fame the world
    // can SEE change (a fresh Slam) moves both halves at once.
    const W = 6 * WEEKS_PER_YEAR
    const quiet = parkAt(shopper('r32-3-fame-a'), W)
    const loud = parkAt(shopper('r32-3-fame-b'), W)
    winTitles(quiet, 'wta250', [W - 3])
    winTitles(loud, 'wta250', [W - 3])
    winTitles(loud, 'slam', [W - 2, W - 4])
    expect(fameAt(loud)).toBeGreaterThan(fameAt(quiet))
    expect(brandWeeklyGrossCents(brandSignalsOf(loud)), 'the income moved').toBeGreaterThan(
      brandWeeklyGrossCents(brandSignalsOf(quiet)),
    )
    expect(brandMultipleX(brandSignalsOf(loud), BASE_X), '...and so did the multiple').toBeGreaterThan(
      brandMultipleX(brandSignalsOf(quiet), BASE_X),
    )
  })
})

describe('round 32 #3 §4 – the four career rungs are a premium ON TOP and are untouched', () => {
  it('⭐⭐ the ladder is the same at every fame – the ramp adds, it does not scale', () => {
    // ⚠ THE DISCRIMINATING SHAPE. A wave that had multiplied the ladder by fame instead of adding a
    // fame base would satisfy §3 and fail here, and it would also leave an unknown trading at the
    // full `baseX` – which is the defect the owner was looking at.
    const record: Partial<BrandSignals> = { proSeasons: 6, topSeasons: 2, finalsLost: 5, winRate: 0.75 }
    for (const f of [0, 12, 37.5, 80, CAP]) {
      expect(at(f, record) - at(f), `at fame ${f} the ladder is worth the same premium`)
        .toBeCloseTo(at(CAP, record) - at(CAP), 10)
    }
  })

  it('⚠ a title still buys nothing on the ladder, so it is not priced twice THERE', () => {
    // Round 30 #23's M15 guard, kept. What a title buys is FAME, and fame is now the base – which is
    // deliberate and is the owner's own ruling. What it must never buy is a rung: the depth signal is
    // finals REACHED AND LOST, and a ladder that started counting titles would be the one-dial defect
    // coming back through the back door.
    const W = 6 * WEEKS_PER_YEAR
    const quiet = parkAt(shopper('r32-3-rung-a'), W)
    const decorated = parkAt(shopper('r32-3-rung-b'), W)
    winTitles(decorated, 'slam', [W - 2, W - 4])
    winTitles(decorated, 'wta1000', [W - 6])
    expect(pre32(brandSignalsOf(decorated)), 'the ladder read alone is blind to a title')
      .toBe(pre32(brandSignalsOf(quiet)))
  })
})

describe('round 32 #3 §5 – ⚠⚠ the multiple can now FALL, and that note in brand.ts is overturned', () => {
  it('⭐⭐⭐ a career that goes quiet loses multiple as well as income, and the fall compounds', () => {
    // `world/brand.ts` shipped with «AND THE MULTIPLE DOES NOT FALL, WHICH IS DELIBERATE». It falls
    // now, because the base is fame and fame decays – a business the world has stopped noticing is
    // smaller as well as poorer. The consequence is that a slump compounds, and this arm measures the
    // compounding rather than describing it: the same two weeks under the PRE-32 multiple fall less.
    const w = shopper('r32-3-slump')
    winTitles(w, 'slam', [2, 4])
    winTitles(w, 'wta1000', [3, 6, 9])
    const readAt = (): { mult: number; worth: number; pre: number } => {
      const s = brandSignalsOf(w)
      const income = brandWeeklyGrossCents(s) * WEEKS_PER_YEAR
      return { mult: brandMultipleX(s, BASE_X), worth: income * brandMultipleX(s, BASE_X), pre: income * pre32(s) }
    }
    const rng = rngFromSeed(`${w.seed}:walk`)
    const before = readAt()
    for (let i = 0; i < 2 * WEEKS_PER_YEAR; i++) {
      tickWeek(w, rng)
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
      w.fundsCents = 5_000_000_00
    }
    const after = readAt()
    expect(after.mult, 'the multiple itself fell, which it could not do before this wave')
      .toBeLessThan(before.mult)
    expect(after.worth / before.worth, 'and the worth fell further than the pre-32 arithmetic would have')
      .toBeLessThan(after.pre / before.pre)
  })

  it('⚠ the four rungs still ratchet – what fell is the base and nothing else', () => {
    // «A career that happened cannot un-happen» is still true of the ladder, which is the half of the
    // old note this wave did NOT overturn. Read at a held fame, a career that banks a season can only
    // go up.
    const s: BrandSignals = { fame: 30, strength: 30, proSeasons: 4, topSeasons: 1, finalsLost: 3, roomSize: 0, winRate: 0.7 }
    expect(brandMultipleX({ ...s, proSeasons: 5 }, BASE_X)).toBeGreaterThan(brandMultipleX(s, BASE_X))
    expect(brandMultipleX({ ...s, topSeasons: 2 }, BASE_X)).toBeGreaterThan(brandMultipleX(s, BASE_X))
    expect(brandMultipleX({ ...s, finalsLost: 4 }, BASE_X)).toBeGreaterThan(brandMultipleX(s, BASE_X))
    expect(brandMultipleX({ ...s, winRate: 0.8 }, BASE_X)).toBeGreaterThan(brandMultipleX(s, BASE_X))
  })
})

describe('round 32 #3 §6 – the crossover: maxX is no longer what holds the top', () => {
  it('⭐⭐⭐ the ceiling binds only near the top of the fame range, and never for a middling career', () => {
    // ⚠⚠ THE MEASUREMENT THE WAVE WAS ASKED FOR. Income goes as fame² and the multiple now rises with
    // fame, so the WORTH goes as fame³ until `maxX` binds – and where it binds decides whether the
    // curve's shape was chosen or inherited from a multiplication. The answer is that it binds only
    // in the last tenth of the range, and for a career maxed on all four rungs alone; what actually
    // holds the top is the ramp's own endpoint (§2). The number is in
    // docs/specs/brand-multiple-follows-fame-2026-08.md §5.
    const maxed: Partial<BrandSignals> = { proSeasons: 99, topSeasons: 99, finalsLost: 99, winRate: 1 }
    const bindsAt = (over: Partial<BrandSignals>): number | null => {
      for (let f = 0; f <= CAP; f += 0.05) if (at(f, over) >= V.maxX - 1e-9) return f
      return null
    }
    const maxedAt = bindsAt(maxed)
    expect(maxedAt, 'a maxed career does reach the ceiling').not.toBeNull()
    expect(maxedAt!, '...but only in the last tenth of the fame range').toBeGreaterThan(CAP * 0.9)
    expect(bindsAt({ proSeasons: 8, topSeasons: 2, finalsLost: 9, winRate: 0.72 }), 'and a middling career never does')
      .toBeNull()
  })
})

describe('round 32 #3 §7 – his own row, MIRRORED and not imported', () => {
  it('⭐⭐⭐ a career shaped like his w933 reads single digits and is worth hundreds of thousands', () => {
    // ⚠⚠ NOT HIS SAVE. His `~/Downloads` exports are read-only and nothing derived from one enters
    // the repo. This is a career built here with the same SHAPE as the row he reported – fourteen
    // professional seasons, one inside the top 20, nineteen professional finals lost, a win rate in
    // the high sixties – parked so the seasons have actually been played.
    const W = 15 * WEEKS_PER_YEAR
    const w = parkAt(shopper('r32-3-his-shape'), W)
    proSeasons(w, 13, 40, 22, 10)
    proSeasons(w, 1, 18, 24, 11)
    loseFinals(w, 'wta250', Array.from({ length: 19 }, (_, i) => W - 8 * (i + 1)))
    const s = brandSignalsOf(w)
    expect(s.proSeasons, 'the shape is the one he reported').toBe(14)
    expect(s.topSeasons).toBe(1)
    expect(s.finalsLost).toBe(19)
    expect(s.winRate).toBeGreaterThan(0.66)
    expect(s.winRate).toBeLessThan(0.7)

    // ⭐ THE TWO NUMBERS HE PUT SIDE BY SIDE. The multiple reads single digits – and it reads single
    // digits ON THE ROW as well, which is the number he actually sees, rounded whole at the boundary.
    const mult = brandMultipleX(s, BASE_X)
    expect(mult, 'well under the 20x ceiling it used to sit against').toBeLessThan(10)
    expect(pre32(s), '...and the pre-wave arithmetic on the same career was all but at the ceiling')
      .toBeGreaterThan(18)
    expect(Math.round(mult), 'so the shop row says a single-digit number of years').toBeLessThan(10)
    // ⚠ AND THE INCOME IS UNTOUCHED, which is the half of his sentence that was never wrong: this
    // wave moved the price of the business and not what it takes in.
    expect(brandWeeklyGrossCents(s)).toBe(
      Math.round(
        ((ECONOMY.business.merch.perFamePointCents * s.fame * s.fame) / ECONOMY.business.merch.famePivot) *
          Math.min(
            ECONOMY.business.merch.crowd.maxMult,
            Math.max(
              ECONOMY.business.merch.crowd.minMult,
              s.roomSize <= 0
                ? 1
                : Math.pow(s.roomSize / ECONOMY.business.merch.crowd.refRoom, ECONOMY.business.merch.crowd.exponent),
            ),
          ),
      ),
    )
  })

  it('⚠ and the shop row quotes the same single-digit number the shelf prices it at', () => {
    // One arithmetic, two surfaces. A screen saying «Worth 18 years of what it sells» over a row the
    // shelf prices at 9 is this repo's most-repeated defect, and it is what the owner was reading.
    const W = 15 * WEEKS_PER_YEAR
    const w = parkAt(shopper('r32-3-his-row'), W)
    proSeasons(w, 13, 40, 22, 10)
    proSeasons(w, 1, 18, 24, 11)
    loseFinals(w, 'wta250', Array.from({ length: 19 }, (_, i) => W - 8 * (i + 1)))
    const row = shopView(w).rows.find((r) => r.id === MERCH)!
    expect(row.earningsMultipleX).toBe(Math.round(brandMultipleX(brandSignalsOf(w), BASE_X)))
    expect(row.earningsMultipleX!).toBeLessThan(10)
  })
})

// =================================================================================================
// ⚠ MUTATION LOG – each applied alone to a green tree, run against THIS file AND
// `tests/round30-brand-value.test.ts` together, then reverted by restoring the exact pristine file.
// Counts are of distinct failing arms across both files; the arms named are this file's.
//
//  M1  `let x = baseX` – the ramp deleted, the pre-wave flat base restored
//        -> RED, 14 arms: §1 the first and second, §3 both, §5 the first, §6, §7 both, and six in
//           round30-brand-value. ⚠ §2 stays GREEN and that is correct: §2 asserts the top did NOT
//           move, and a mutation that restores the old behaviour everywhere cannot violate it.
//  M2  the ramp inverted – `(1 - known)`, so being famous makes the brand cheaper
//        -> RED, 15 arms: everything M1 reddened plus §2's first, which is the one that catches a
//           ramp landing somewhere other than `baseX` at the cap.
//  M3  `Math.min(1, ...)` dropped from the ramp
//        -> RED: §1's third arm ALONE – exactly what that arm exists for, since `fameAt` never hands
//           this function a number outside [0, cap] and no other arm can see the clamp.
//  M4  `Math.max(0, ...)` dropped
//        -> RED: §1's third arm alone, the other direction.
//  M5  `let x = baseX * known` – the base scaled instead of ramped, so it starts at 0 and not at
//        `unknownX`
//        -> RED, 6 arms: §1's first and second, and four in round30-brand-value including «the worth
//           FALLS during a live career». ⚠ §3 stays green, which is why §1's first arm pins the
//           FLOOR and not merely the direction.
//  M6  `unknownX: 14` in ECONOMY – the dial turned back to the pre-wave base
//        -> RED, 11 arms: §1's first, §3 both, §4's second, §7 both, and five in
//           round30-brand-value. The same defect as M1 reached through the constant.
//  M7  `const known = 1` – the ramp reading a constant instead of her fame
//        -> RED, 14 arms: §1's first and second, §3 both, §5's first, §6, §7 both, and six in
//           round30-brand-value.
// =================================================================================================
