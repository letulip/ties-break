// ROUND 44 – WHAT THE PAYROLL TAKES OFF THE DECLINE
// (docs/specs/the-decline-and-the-seats-2026-09.md §4, `ECONOMY.development.declineCare`)
//
// THE OWNER, 17.09: «все эти специалисты должны его если не тормозить, то хотя бы сглаживать, а
// может у кого-то и тормозить даже немного.»
//
// ⚠⚠ WHAT THIS FILE IS FOR, AND IT IS NOT «the constants are 0.25 / 0.1667 / 0.08». Those are a
// BALANCE decision and they move when a bench re-measures them; a test that pinned them would go red
// on every honest retune and teach the next reader to edit it without thinking. What is pinned here
// is the set of properties the feature is SOLD on, each of which would be a defect if it stopped
// holding:
//
//   A. THE IMMORTALITY BOUND. No set of constants anybody can write makes the shield reach zero, so
//      a fully-staffed career always still ages. The spec's own first pass/fail question, asserted
//      against ABSURD values rather than against the shipped ones – which is the only way to test a
//      claim about «any constants».
//   B. INERTNESS. A call with no `care`, a career with nobody working, and composure, all read
//      EXACTLY 1 – the property that makes every shipped career byte-identical.
//   C. THE DERIVATION. The two seat constants ARE the `ageWeight` ladder's own steps, so a wave that
//      retunes those weights reddens here and has to decide rather than drift.
//   D. THE LADDER. Each rung of each seat measurably beats the one below – the masseur spec's §4 law
//      («each rung must MEASURABLY beat the one below or the dial is decoration»), asked of the new
//      channel so a veteran's correct play is never «drop to the cheapest rung».
//   E. THE STAND-DOWNS. A seat that is not PAID for absorbs nothing – «you paid and you cannot tell»
//      read backwards, through the real `growAndLive` rather than through the pure function.
//
// ⚠ RNG: NOTHING HERE DRAWS ANYTHING NEW. `growWeek` spends exactly one pull off `seed:growth:<week>`
// whatever `care` holds, in the same position before the per-skill loop, so the frozen MAIN capture
// (41550 / e6b0c709) cannot move – and `growAndLive`'s own MAIN budget is `driftCohort`'s four, which
// this file does not touch.
import { describe, it, expect } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import {
  ageWeightOf,
  coachMaintenanceSeasonPct,
  declineCareShieldOf,
  growWeek,
  isPhysicalSkill,
  PHYSICAL_SKILL_KEYS,
  SKILL_KEYS,
  type AgeCurveBounds,
  type DeclineCare,
  type KidSkills,
} from '../src/engine/development'
import { coachFactor } from '../src/engine/coach'
import { createWorld } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { rngFromSeed } from '../src/engine/rng'
import { WEEK_PLAN_PRESETS } from '../src/shared/protocol'

const CARE = ECONOMY.development.declineCare
const RAW = ECONOMY.development.ageWeight as Record<string, number>
/** well past any `declineStart` the engine can resolve, so the decline branch is live */
const BOUNDS: AgeCurveBounds = { plateauStart: 23, declineStart: 29 }
const BUILD: KidSkills = { serve: 66, ret: 59, composure: 78, stamina: 61, groundstrokes: 63 }
const SELF_RATE = coachFactor('self', ECONOMY.coach.selfFit)
const ELITE_RATE = coachFactor('elite', 'great')

const care = (over: Partial<DeclineCare> = {}): DeclineCare => ({
  masseurConditionBonus: null,
  sparringDriftCut: null,
  coachRate: SELF_RATE,
  ...over,
})

/** ONE WEEK OF THE SHIPPED FUNCTION, past the peak – `ageFactor` is 0 there, so the whole gain term
 *  is zero and what comes back is `skills - loss`. The bench (`tools/r44-decline-seats.ts`) walks the
 *  same way and for the same reason: a test that re-typed the arithmetic could not catch a wiring
 *  defect, which is the whole class of bug this feature could have. */
function week(over: { care?: DeclineCare; coachRate?: number } = {}, age = 33): KidSkills {
  return growWeek({
    skills: BUILD,
    potential: BUILD,
    ageYears: age,
    plan: WEEK_PLAN_PRESETS.balanced,
    coach: null,
    playStyle: 'all-court',
    matchesThisWeek: 0,
    seed: 'r44-care',
    week: 1,
    bounds: BOUNDS,
    coachFactorOverride: over.coachRate ?? SELF_RATE,
    care: over.care,
  })
}

/** ⚠⚠ MUTATES THE TABLE AND PUTS IT BACK IN A `finally`. Section A's claim is about ANY constants,
 *  so it cannot be tested against the shipped ones – it has to move them. */
function withCare<T>(masseur: number, sparring: number, coach: number, body: () => T): T {
  const before = { m: CARE.masseur.topRungShare, s: CARE.sparring.topRungShare, k: CARE.coachMaintenanceTop }
  CARE.masseur.topRungShare = masseur
  CARE.sparring.topRungShare = sparring
  CARE.coachMaintenanceTop = coach
  try {
    return body()
  } finally {
    CARE.masseur.topRungShare = before.m
    CARE.sparring.topRungShare = before.s
    CARE.coachMaintenanceTop = before.k
  }
}

const topMasseur = Math.max(...ECONOMY.masseur.rungs.map((r) => r.conditionBonusPerWeek))
const topSparring = ECONOMY.sparring.rungs.reduce((best, r) => Math.min(best, r.driftCut), 1)

// =================================================================================================
// A. THE IMMORTALITY BOUND – the spec's first pass/fail question, and it is STRUCTURAL
// =================================================================================================
describe('round 44 A – no set of constants stops her ageing', () => {
  it('⭐⭐ the shield is strictly positive at every absurd value, so the loss is never zero', () => {
    const fullTeam = care({ masseurConditionBonus: topMasseur, sparringDriftCut: topSparring, coachRate: ELITE_RATE })
    // ⚠ 1 AND 5 ARE PAST THE DESIGN'S OWN RANGE ON PURPOSE. The claim is «no constants», and a grid
    // that stopped at a plausible number would only be testing the plausible ones.
    for (const share of [0.5, 0.9, 0.99, 1, 5, 1e6]) {
      withCare(share, share, share, () => {
        for (const k of PHYSICAL_SKILL_KEYS) {
          const shield = declineCareShieldOf(k, fullTeam)
          expect(shield, `${k} at share ${share} still lets some of the loss through`).toBeGreaterThan(0)
          expect(shield, `${k} at share ${share} never AMPLIFIES the decline`).toBeLessThanOrEqual(1)
        }
      })
    }
  })

  it('⭐⭐ ...and the walked consequence: a fully staffed veteran is still below her peak', () => {
    const fullTeam = care({ masseurConditionBonus: topMasseur, sparringDriftCut: topSparring, coachRate: ELITE_RATE })
    withCare(0.99, 0.99, 0.99, () => {
      const after = week({ care: fullTeam, coachRate: ELITE_RATE })
      for (const k of PHYSICAL_SKILL_KEYS) {
        expect(after[k], `${k} still fell this week`).toBeLessThan(BUILD[k])
      }
    })
  })
})

// =================================================================================================
// B. INERTNESS – what makes every shipped career byte-identical
// =================================================================================================
describe('round 44 B – nobody on the payroll changes nothing', () => {
  it('reads exactly 1 with no `care` at all, on every skill including composure', () => {
    for (const k of SKILL_KEYS) expect(declineCareShieldOf(k, undefined)).toBe(1)
  })

  it('⭐ reads exactly 1 for COMPOSURE even under a full team – it is not in the decline branch', () => {
    const fullTeam = care({ masseurConditionBonus: topMasseur, sparringDriftCut: topSparring, coachRate: ELITE_RATE })
    expect(isPhysicalSkill('composure'), 'the predicate is the one home for this answer').toBe(false)
    expect(declineCareShieldOf('composure', fullTeam)).toBe(1)
  })

  it('reads exactly 1 with nobody working and the parent on the court', () => {
    for (const k of PHYSICAL_SKILL_KEYS) expect(declineCareShieldOf(k, care())).toBe(1)
  })

  it('⭐⭐ `growWeek` is BYTE-IDENTICAL with `care` omitted and with an empty team', () => {
    expect(week({})).toEqual(week({ care: care() }))
  })

  it('⭐ a coach WORSE than the parent buys nothing – the clamp at zero, not a special case', () => {
    const off = coachFactor('budget', 'off')
    expect(off, 'a mismatched budget coach really is below the parent').toBeLessThan(SELF_RATE)
    for (const k of PHYSICAL_SKILL_KEYS) expect(declineCareShieldOf(k, care({ coachRate: off }))).toBe(1)
  })
})

// =================================================================================================
// C. THE DERIVATION – the seat constants ARE the `ageWeight` ladder's own steps
// =================================================================================================
describe('round 44 C – the two seat constants are derived, not typed', () => {
  it('names two attributes that exist, are PHYSICAL, and are not the same one', () => {
    for (const name of [CARE.masseur.skill, CARE.sparring.skill]) {
      expect(SKILL_KEYS, `${name} is a real attribute`).toContain(name)
      expect(isPhysicalSkill(name as never), `${name} is one the decline actually touches`).toBe(true)
    }
    expect(CARE.masseur.skill).not.toBe(CARE.sparring.skill)
  })

  it('⭐⭐ the masseur moves stamina exactly ONE RUNG down the ageWeight ladder, to the return', () => {
    expect(CARE.masseur.topRungShare).toBeCloseTo(1 - RAW.ret / RAW.stamina, 4)
  })

  it('⭐⭐ the partner moves the return exactly ONE RUNG down, to the groundstrokes', () => {
    expect(CARE.sparring.topRungShare).toBeCloseTo(1 - RAW.groundstrokes / RAW.ret, 4)
  })

  it('⭐⭐⭐ ...so no seat can make its attribute the SLOWEST-ageing one – the serve stays last to go', () => {
    // The shielded EFFECTIVE weight of each seat's attribute, against the unshielded serve.
    const masseurEff = ageWeightOf('stamina') * declineCareShieldOf('stamina', care({ masseurConditionBonus: topMasseur }))
    const partnerEff = ageWeightOf('ret') * declineCareShieldOf('ret', care({ sparringDriftCut: topSparring }))
    expect(masseurEff, 'a massaged veteran still loses her legs faster than her serve').toBeGreaterThan(ageWeightOf('serve'))
    expect(partnerEff, 'a drilled return still goes faster than the serve').toBeGreaterThan(ageWeightOf('serve'))
    // ...and each lands exactly on the rung below, which is the sentence the constant spells.
    expect(masseurEff).toBeCloseTo(ageWeightOf('ret'), 3)
    expect(partnerEff).toBeCloseTo(ageWeightOf('groundstrokes'), 3)
  })

  it('⭐ the psychologist has no row at all – composure is already out of the decline branch', () => {
    expect(Object.keys(CARE).sort()).toEqual(['coachMaintenanceTop', 'masseur', 'sparring'])
  })
})

// =================================================================================================
// D. THE LADDER – each rung measurably beats the one below (the masseur spec's §4 law)
// =================================================================================================
describe('round 44 D – the rung dial is not decoration on this channel either', () => {
  it('⭐⭐ the masseur: three rungs, strictly increasing shield, top rung at exactly the constant', () => {
    const shields = ECONOMY.masseur.rungs.map((r) =>
      declineCareShieldOf(CARE.masseur.skill as never, care({ masseurConditionBonus: r.conditionBonusPerWeek })),
    )
    for (let i = 1; i < shields.length; i++) {
      expect(shields[i], `rung ${i} absorbs strictly more than rung ${i - 1}`).toBeLessThan(shields[i - 1])
    }
    expect(shields[shields.length - 1]).toBeCloseTo(1 - CARE.masseur.topRungShare, 10)
  })

  it('⭐⭐ the hitting partner: same, off `1 - driftCut`, which is the quantity that ASCENDS with price', () => {
    const shields = ECONOMY.sparring.rungs.map((r) =>
      declineCareShieldOf(CARE.sparring.skill as never, care({ sparringDriftCut: r.driftCut })),
    )
    for (let i = 1; i < shields.length; i++) {
      expect(shields[i], `rung ${i} absorbs strictly more than rung ${i - 1}`).toBeLessThan(shields[i - 1])
    }
    expect(shields[shields.length - 1]).toBeCloseTo(1 - CARE.sparring.topRungShare, 10)
  })

  it('⭐ each seat touches ITS OWN attribute and no other', () => {
    const m = care({ masseurConditionBonus: topMasseur })
    const s = care({ sparringDriftCut: topSparring })
    for (const k of PHYSICAL_SKILL_KEYS) {
      expect(declineCareShieldOf(k, m) < 1, `masseur on ${k}`).toBe(k === CARE.masseur.skill)
      expect(declineCareShieldOf(k, s) < 1, `partner on ${k}`).toBe(k === CARE.sparring.skill)
    }
  })

  it('⭐⭐ the coach touches ALL FOUR and scales with the rung, self at exactly nothing', () => {
    // ⚠ RUN INSIDE `withCare` AT A FIXED TERM, which is now a matter of keeping the arithmetic below
    // independent of the shipped dial rather than of reaching a held row at all. `coachMaintenanceTop`
    // shipped at 0 until 17.09 and this block was the only thing that could tell a working ladder
    // from a deleted one; the row is live since §7 and the probe stays, because `1 - PROBE` on the
    // last line is an exact claim about the top of the scale and a retune of the constant should not
    // be able to reach it. The shipped VALUE is asserted separately below.
    const PROBE = 0.08
    const ladder = [
      SELF_RATE,
      coachFactor('budget', 'good'),
      coachFactor('middle', 'good'),
      coachFactor('high', 'good'),
      coachFactor('elite', 'good'),
      ELITE_RATE,
    ]
    withCare(CARE.masseur.topRungShare, CARE.sparring.topRungShare, PROBE, () => {
      for (const k of PHYSICAL_SKILL_KEYS) {
        const shields = ladder.map((rate) => declineCareShieldOf(k, care({ coachRate: rate })))
        expect(shields[0], 'the parent on the court buys exactly nothing').toBe(1)
        for (let i = 2; i < shields.length; i++) {
          expect(shields[i], `${k}: rung ${i} absorbs at least as much as rung ${i - 1}`).toBeLessThanOrEqual(shields[i - 1])
        }
        expect(shields[shields.length - 1], `${k}: elite+great is the top of the scale`).toBeCloseTo(1 - PROBE, 10)
        expect(shields[shields.length - 1], `${k}: the ladder really moved`).toBeLessThan(1)
      }
    })
  })

  it('⭐⭐⭐ ...and the SHIPPED value of that term is the swept 0.08, which is §7\'s ruling', () => {
    // ⚠ THE ONE PLACE A SHIPPED CONSTANT IS PINNED IN THIS FILE, and it moved 0 -> 0.08 on 17.09.
    // It was pinned at ZERO while the row was held for the owner's ruling, so that a wave could not
    // quietly turn it on; he ruled (docs/specs/the-decline-and-the-seats-2026-09.md §7) and the
    // sweep chose the number rather than anybody's taste – `npm run bench:decline` §2s, at the
    // derived seat scale, takes the SMALLEST coach term meeting four criteria fixed before the run:
    //
    //     coach   absorbed   gap      seasons   coach alone   win prob.   verdict
    //     0.04       14.7%   +1.87      1.11          0.27       +1.54 pp  C4 fails
    //     0.06       16.3%   +2.08      1.24          0.40       +1.86 pp  C4 fails
    //     0.08       17.9%   +2.29      1.36          0.54       +2.19 pp  ⭐ the smallest that meets all four
    //     0.20       27.7%   +3.54      2.11          1.37       +4.30 pp  C3 fails
    //
    // ⚠ SO THIS LINE IS STILL A GATE AND NOT A RECORD: a wave that retunes it has to come past the
    // sweep, because the four criteria are what chose it and «it felt about right» is not one of them.
    expect(CARE.coachMaintenanceTop, 'see spec §7 and re-run `npm run bench:decline` before changing this').toBe(0.08)
    // ⭐⭐ AND THE DEFECT §4 CALLED «CLOSE TO A DEFECT» IS CLOSED, ASSERTED THROUGH THE SHIPPED
    // CONSTANT RATHER THAN THROUGH A PROBE: past `declineStart` `ageFactor` returns 0, so an elite
    // coach used to multiply zero and a family paying elite money for a twenty-eight-year-old bought
    // her tennis literally nothing. This is the line that says it buys something now.
    for (const k of PHYSICAL_SKILL_KEYS) {
      expect(declineCareShieldOf(k, care({ coachRate: ELITE_RATE })), `${k}: an elite coach still absorbs nothing`)
        .toBeLessThan(1)
    }
    // ...and the parent on the court still buys exactly nothing, which is the other end of the same
    // scale and is what keeps the row a PAYROLL term rather than a free gift to every career.
    for (const k of PHYSICAL_SKILL_KEYS) {
      expect(declineCareShieldOf(k, care({ coachRate: SELF_RATE })), `${k}: the self-coached arm is not free of it`).toBe(1)
    }
  })
})

// =================================================================================================
// E. THE STAND-DOWNS – a seat that is not PAID for absorbs nothing, through the shipped phase
// =================================================================================================

/** A veteran, posed. ⚠ THE SEATS ARE POKED AND THE HIRE IS NOT UNDER TEST HERE – `hireMasseur`'s
 *  gate, its refusals and its ledger row are the seats' own files. `round42-v78-schema.test.ts`'s
 *  `posed` shape, one wave along. */
function veteran(seed: string): ReturnType<typeof createWorld> {
  const world = createWorld(seed)
  // past the shipped `declineStart` of 29, by a comfortable margin
  world.week = Math.round(19 * 52)
  world.skills = { ...BUILD }
  world.potential = { ...BUILD }
  return world
}

function walkOne(world: ReturnType<typeof createWorld>, away = false): KidSkills {
  const rng = rngFromSeed(`${world.seed}:walk`)
  world.week += 1
  growAndLive(world, rng, away)
  return { ...world.skills }
}

describe('round 44 E – the bill and the shield are the same week', () => {
  it('⭐⭐ a hired masseur absorbs some of the decline through the real `growAndLive`', () => {
    const bare = walkOne(veteran('r44-e1'))
    const hired = veteran('r44-e1')
    hired.masseurHired = true
    hired.masseurSessionsPerWeek = ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions
    const staffed = walkOne(hired)
    expect(staffed.stamina, 'his hands really do reach the shipped tick').toBeGreaterThan(bare.stamina)
    expect(staffed.stamina, '...and she still lost something').toBeLessThan(BUILD.stamina)
    expect(staffed.serve, 'and he touches nothing else').toBe(bare.serve)
  })

  it('⭐⭐⭐ a hitting partner who does not travel absorbs NOTHING on an away week', () => {
    const pose = () => {
      const w = veteran('r44-e2')
      w.sparringHired = true
      w.sparringRung = 2
      w.sparringTravels = false
      return w
    }
    const home = walkOne(pose(), false)
    const away = walkOne(pose(), true)
    const bare = walkOne(veteran('r44-e2'))
    expect(home.ret, 'at home he cuts the return\'s decline').toBeGreaterThan(bare.ret)
    expect(away.ret, '⭐ away, the family pays no fare and receives nothing').toBe(bare.ret)
  })

  it('⭐⭐ ...and a fare buys the away week back, which is exactly what the switch sells', () => {
    const pose = (travels: boolean) => {
      const w = veteran('r44-e3')
      w.sparringHired = true
      w.sparringRung = 2
      w.sparringTravels = travels
      return w
    }
    const grounded = walkOne(pose(false), true)
    const travelling = walkOne(pose(true), true)
    expect(travelling.ret).toBeGreaterThan(grounded.ret)
  })

  it('⭐⭐ `growAndLive` still spends nothing new on MAIN – the phase\'s draw budget is unmoved', () => {
    // `driftCohort` is this phase's only MAIN consumer and takes four per cohort player. The care
    // block is four predicates and two lookups, so the count cannot move: assert it by DRAW POSITION
    // rather than by reading the comment that says so.
    const count = (staffedWorld: boolean): number => {
      const world = veteran('r44-e4')
      if (staffedWorld) {
        world.masseurHired = true
        world.sparringHired = true
        world.sparringTravels = true
      }
      let pulls = 0
      const inner = rngFromSeed(`${world.seed}:main`)
      const rng = () => {
        pulls++
        return inner()
      }
      world.week += 1
      growAndLive(world, rng, false)
      return pulls
    }
    expect(count(true)).toBe(count(false))
  })
})

// =================================================================================================
// F. THE MARKET QUOTE – what the card says a rung is worth to a body past its peak
// =================================================================================================
//
// ⚠⚠ THIS SECTION EXISTS BECAUSE THE ROW GOING LIVE TURNED A TRUE SENTENCE INTO A FALSE ONE, and
// the previous builder named it in the spec before it could happen (§6e). `coachSeasonUplift` prices
// a rung by the HEADROOM it takes, `ageFactor` returns 0 past `declineStart`, so both of its arms
// are zero for a veteran and the coach market quoted an elite coach «+0.0-0.0% a season» to a
// twenty-nine-year-old. While `coachMaintenanceTop` was 0 that was the truth. It is not any more:
// the rung holds points she would otherwise lose, and `coachMaintenanceSeasonPct` is what the card
// adds so that the number under the sentence it already said is the number the engine will pay.
//
// ⚠ NO STRING WAS ADDED AND NONE MAY BE (invariant 4). §6e drafts a second band – «what this rung
// holds on to» – and that is a new sentence and the owner's call. What is pinned here is arithmetic.
describe('round 44 F – the season quote stops calling a veteran\'s coach worthless', () => {
  const quote = (over: { ageYears?: number; weeks?: number; coachRate?: number } = {}): number =>
    coachMaintenanceSeasonPct({
      ageYears: over.ageYears ?? 31,
      weeks: over.weeks ?? 52,
      coachRate: over.coachRate ?? ELITE_RATE,
      bounds: BOUNDS,
    })

  it('⭐⭐ is EXACTLY zero while the whole horizon is short of her declineStart – junior cards cannot move', () => {
    // The whole era this market is mostly used in, proven rather than reasoned about: `declineFactor`
    // is 0 below the door and this term is its product, so the addition cannot move a junior quote by
    // a float. Walked at the ages the card is actually read at.
    // ⚠ THE LAST ROW IS THE BOUNDARY AND IT IS «A SEASON SHORT», NOT «A WEEK SHORT» – and that is a
    // measured correction to this case's first draft, which asserted 0 at `declineStart - 0.02` and
    // MEASURED 0.153. It was right and the assertion was wrong: the quote is over the NEXT 52 weeks,
    // so a card read eleven months before the door is quoting a season that mostly lies past it. The
    // case below is the one that says so on purpose.
    for (const ageYears of [12, 16, 20, 24, BOUNDS.declineStart - 1.01]) {
      expect(quote({ ageYears }), `age ${ageYears}: a junior card moved`).toBe(0)
    }
  })

  it('⭐ ...and a card read in the last year before the door quotes only the part past it', () => {
    // The consequence of quoting a HORIZON rather than an instant, asserted rather than left to be
    // rediscovered: the season a twenty-eight-and-a-half-year-old is being sold is half a decline.
    const straddling = quote({ ageYears: BOUNDS.declineStart - 0.5 })
    expect(straddling, 'the horizon does not reach past the door at all').toBeGreaterThan(0)
    expect(straddling, 'a straddling season is quoted at a whole one').toBeLessThan(quote({ ageYears: BOUNDS.declineStart }))
  })

  it('⭐⭐⭐ ...and is strictly positive past it, which is the «+0.0-0.0% a season» lie closed', () => {
    expect(quote(), 'an elite coach is still worth nothing to a thirty-one-year-old').toBeGreaterThan(0)
    // ⚠ AND IT IS A SHARE OF THE SEASON'S LOSS RATHER THAN A SECOND NUMBER INVENTED HERE. At a share
    // of 0.99 the quote is very nearly the whole season's decline – that is the ceiling the shipped
    // row is a small fraction of – so this line says the quote is READ OFF `declineCareShieldOf` and
    // is bounded by the loss it shields. A term computed independently would not be.
    const ceiling = withCare(CARE.masseur.topRungShare, CARE.sparring.topRungShare, 0.99, () => quote())
    expect(quote(), 'the quote exceeds the whole of the loss it is a share of').toBeLessThan(ceiling)
    expect(quote() / ceiling, 'the shipped row is not a SMALL share of the season').toBeLessThan(0.25)
  })

  it('⭐ the parent on the court is still quoted exactly nothing, at any age', () => {
    // The other end of the same scale, and it is what keeps this a PAYROLL term: a self-coached
    // career must not be handed a maintenance quote it is not paying anybody for.
    for (const ageYears of [20, 31, 38]) {
      expect(quote({ ageYears, coachRate: SELF_RATE }), `age ${ageYears}`).toBe(0)
    }
  })

  it('⭐ the dial is not decoration on the quote either – a dearer rung quotes more', () => {
    const ladder = [
      coachFactor('budget', 'good'),
      coachFactor('middle', 'good'),
      coachFactor('high', 'good'),
      coachFactor('elite', 'good'),
      ELITE_RATE,
    ]
    const quotes = ladder.map((coachRate) => quote({ coachRate }))
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i], `rung ${i} quotes less than rung ${i - 1}`).toBeGreaterThanOrEqual(quotes[i - 1])
    }
    expect(quotes[quotes.length - 1], 'the ladder really moved').toBeGreaterThan(quotes[0])
  })

  it('⭐ and it quotes the WEEKS she buys, exactly as the growth arm does', () => {
    // `coachedWeeks` is the horizon less the weeks he stands down, and the owner's ruling of 08.08
    // is that the quote follows it – «he was being shown a number the game had no intention of
    // paying». Half a season of coaching may not be quoted at a season's worth.
    expect(quote({ weeks: 26 }), 'a half season is quoted at a whole one').toBeLessThan(quote())
    expect(quote({ weeks: 26 })).toBeGreaterThan(0)
    expect(quote({ weeks: 0 })).toBe(0)
  })
})
