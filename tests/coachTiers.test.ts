import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  COACH_TIERS,
  COACH_TIER_LABEL,
  coachAgeBand,
  coachFactor,
  coachHoursForPlan,
  coachIncludesPhysio,
  coachRateBandCents,
  coachStyleFit,
  coachWeeklyBandCents,
  coachWeeklyCostCents,
} from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { ageAtWeek, createWorld, tickWeek } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type PlayStyle } from '../src/shared/protocol'

// THE COACH LADDER (docs/specs/coach-tiers.md). Five rungs replacing a boolean, priced per hour by
// age, billed for as many hours as the training split buys, and read against the game she plays.
//
// The hard constraint this slice was written under, and the reason the tests below open with it:
// the weekly coaching bill must still spend EXACTLY ONE main-stream draw, in the same position the
// old expense pickInt held, or the frozen MAIN capture (tests/condition.test.ts, 41550 draws /
// e6b0c709) moves. B1/B1b there are the capture itself; this file guards the property that keeps
// it true through every rung, age and plan the ladder can produce.

const PLAY_STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']

/** The week-1 coaching bill in cents for one (seed, rung, plan). */
function weekOneBill(seed: string, tier: CoachTier, train = 75): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
  world.plan = { train, rest: 100 - train }
  const rng = rngFromSeed(world.seed)
  tickWeek(world, rng)
  const bill = world.events.find((e) => e.week === 1 && e.category === 'coaching')
  expect(bill).toBeDefined()
  return -bill!.amountCents!
}

describe('RNG discipline – one draw, whatever the ladder does', () => {
  it('spends exactly the same main-stream draws for every rung, age band and plan (52w)', () => {
    // The draw COUNT must not depend on the tier (which band is drawn from), the age (which row of
    // the band table), or the plan (how many hours the drawn rate is multiplied by). Everything
    // after the pickInt is arithmetic, so all of these must produce a byte-identical sequence.
    const capture = (tier: CoachTier, train: number) => {
      const world = createWorld('ladder-invariance', { ...DEFAULT_PROFILE, coachTier: tier })
      world.plan = { train, rest: 100 - train }
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) tickWeek(world, rng)
      return draws.join(',')
    }
    const reference = capture('self', 75)
    for (const tier of COACH_TIERS) {
      for (const train of [60, 75, 85, 100]) {
        expect(capture(tier, train), `${tier} @ train ${train}`).toBe(reference)
      }
    }
  })

  it('draws the RATE, not the bill – so the plan can scale it without touching the stream', () => {
    // Same seed, same rung, three plans: one draw produced one rate, and the three bills are that
    // rate times three different hour counts. Recovering the rate from each bill must agree.
    const rates = [60, 75, 85].map((train) => weekOneBill('rate-recovery', 'middle', train) / coachHoursForPlan({ train, rest: 100 - train }))
    expect(Math.abs(rates[0] - rates[1])).toBeLessThan(1) // within the Math.round of the bill
    expect(Math.abs(rates[2] - rates[1])).toBeLessThan(1)
  })
})

describe('hours – the training split feeds the bill, not just the development rate', () => {
  it('anchors the three plan presets on 3 / 4 / 6 sessions', () => {
    expect(coachHoursForPlan(WEEK_PLAN_PRESETS.light)).toBe(3)
    expect(coachHoursForPlan(WEEK_PLAN_PRESETS.balanced)).toBe(4)
    expect(coachHoursForPlan(WEEK_PLAN_PRESETS.grind)).toBe(6)
  })

  it('is monotone across the slider and clamped outside it', () => {
    let prev = -Infinity
    for (let train = 50; train <= 110; train += 5) {
      const h = coachHoursForPlan({ train, rest: 100 - train })
      expect(h).toBeGreaterThanOrEqual(prev)
      prev = h
    }
    // Below the lightest preset and above the heaviest, the ladder holds rather than running off.
    expect(coachHoursForPlan({ train: 0, rest: 100 })).toBe(3)
    expect(coachHoursForPlan({ train: 100, rest: 0 })).toBe(6)
  })

  it('doubles the bill from light to grind – the dial the old planFactor never really turned', () => {
    // The retired `planFactor` ran 0.91 at train 60 to 1.06 at 85: a 16% spread on a slider that
    // doubles her development. Hours make it a real dial.
    const light = weekOneBill('hours-dial', 'middle', 60)
    const grind = weekOneBill('hours-dial', 'middle', 85)
    expect(grind / light).toBeCloseTo(2, 5)
  })
})

describe('rates – the owner\'s per-hour ladder, by age', () => {
  it('bands ascend up the ladder at every age, in both endpoints', () => {
    // Ascending lo AND hi is what makes the per-week rung ordering hold off a single uniform draw
    // (pickInt is monotone in both), which the market-rate test in economy.test.ts leans on.
    for (const age of [14, 17, 25]) {
      for (let i = 1; i < COACH_TIERS.length; i++) {
        const [prevLo, prevHi] = coachRateBandCents(COACH_TIERS[i - 1], age)
        const [lo, hi] = coachRateBandCents(COACH_TIERS[i], age)
        expect(lo).toBeGreaterThan(prevLo)
        expect(hi).toBeGreaterThan(prevHi)
      }
    }
  })

  it('rises with the age band, and holds level past the peak', () => {
    expect(coachAgeBand(14)).toBe(0)
    expect(coachAgeBand(16)).toBe(0)
    expect(coachAgeBand(17)).toBe(1)
    expect(coachAgeBand(22)).toBe(1)
    expect(coachAgeBand(23)).toBe(2)
    expect(coachAgeBand(34)).toBe(2) // 29+ is maintenance, not a fourth row
    for (const tier of COACH_TIERS) {
      const dev = coachRateBandCents(tier, 14)
      const pro = coachRateBandCents(tier, 19)
      const peak = coachRateBandCents(tier, 25)
      expect(pro[0]).toBeGreaterThan(dev[0])
      expect(peak[0]).toBeGreaterThan(pro[0])
    }
  })

  it('reproduces the spec\'s weekly table at four hours: $120 / $200 / $320 / $480', () => {
    // docs/specs/coach-tiers.md §2 converts his 12-16 per-hour row at "x4 h/wk". The midpoint of
    // each band IS his figure, so the balanced plan (4 sessions) bills exactly his table.
    const balanced = WEEK_PLAN_PRESETS.balanced
    const midWeekly = (tier: CoachTier) => {
      const [lo, hi] = coachWeeklyBandCents(tier, 14, balanced)
      return (lo + hi) / 2 / 100
    }
    expect(midWeekly('budget')).toBe(120)
    expect(midWeekly('middle')).toBe(200)
    expect(midWeekly('high')).toBe(320)
    expect(midWeekly('elite')).toBe(480)
    // ...and self sits below Budget, which is where the spec puts the parent's rung.
    expect(midWeekly('self')).toBeLessThan(midWeekly('budget'))
  })

  it('every drawn bill lands inside its rung\'s weekly band', () => {
    for (const tier of COACH_TIERS) {
      for (const train of [60, 75, 85]) {
        const [lo, hi] = coachWeeklyBandCents(tier, ageAtWeek(1), { train, rest: 100 - train })
        const bill = weekOneBill(`band-${tier}-${train}`, tier, train)
        expect(bill).toBeGreaterThanOrEqual(lo)
        expect(bill).toBeLessThanOrEqual(hi)
      }
    }
    expect(coachWeeklyCostCents(50_00, WEEK_PLAN_PRESETS.balanced)).toBe(200_00)
  })
})

describe('fit and development – what the rung is worth', () => {
  it('keeps the pre-ladder multipliers as the ladder\'s ends', () => {
    // 0.82 was `coachParent`, 1.15 was `coachHired`. Pinning them here is what stops the spread
    // widening by accident: Phase 4's "roughly a factor of two between the laziest and the most
    // committed setup" was measured against exactly these two numbers.
    expect(ECONOMY.coach.developmentFactor.self).toBe(0.82)
    expect(ECONOMY.coach.developmentFactor.elite).toBe(1.15)
  })

  it('climbs the ladder with shrinking steps – Elite is a luxury, not an optimisation', () => {
    const f = ECONOMY.coach.developmentFactor
    const steps = COACH_TIERS.slice(1).map((t, i) => f[t] - f[COACH_TIERS[i]])
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeLessThan(steps[i - 1])
    // ...while the price climbs the other way: each rung costs more than the last, by more.
    const price = COACH_TIERS.map((t) => coachWeeklyCostCents((coachRateBandCents(t, 14)[0] + coachRateBandCents(t, 14)[1]) / 2, WEEK_PLAN_PRESETS.balanced))
    for (let i = 1; i < price.length; i++) expect(price[i]).toBeGreaterThan(price[i - 1])
  })

  it('gives every play style a great fit somewhere, and reads off her own style', () => {
    for (const style of PLAY_STYLES) {
      const fits = COACH_TIERS.map((t) => coachStyleFit(t, style))
      expect(fits).toContain('great')
    }
    // Elite is great for all four: what a former tour player buys is that there is nothing she
    // cannot coach. A big serve is the expensive build – nothing below High can teach one.
    for (const style of PLAY_STYLES) expect(coachStyleFit('elite', style)).toBe('great')
    expect(coachStyleFit('self', 'serve-first')).toBe('off')
    expect(coachStyleFit('budget', 'serve-first')).toBe('off')
    expect(coachStyleFit('middle', 'serve-first')).toBe('off')
    expect(coachStyleFit('high', 'serve-first')).toBe('great')
  })

  it('keeps the fit pill smaller than one rung of the ladder', () => {
    // Fit must be a reason to prefer one affordable coach over another, never a reason to buy up a
    // rung: a Budget coach who is great for her should just edge a Middle coach who is wrong for
    // her, and nothing wider than that.
    expect(coachFactor('budget', 'great')).toBeGreaterThan(coachFactor('middle', 'off'))
    expect(coachFactor('budget', 'great')).toBeLessThan(coachFactor('middle', 'good'))
    expect(ECONOMY.coach.fitFactor.good).toBe(1)
  })

  it('treats every rung but self-coached as a hire, for the physio default', () => {
    expect(coachIncludesPhysio('self')).toBe(false)
    for (const tier of COACH_TIERS.filter((t) => t !== 'self')) expect(coachIncludesPhysio(tier)).toBe(true)
    expect(createWorld('physio-self', { ...DEFAULT_PROFILE, coachTier: 'self' }).physioActive).toBe(false)
    expect(createWorld('physio-hire', { ...DEFAULT_PROFILE, coachTier: 'high' }).physioActive).toBe(true)
  })
})

describe('v22 migration – the rung closest to what the career was paying', () => {
  /** A minimal v21 save carrying the pre-ladder profile shape. */
  function v21(coachSetup: 'parent' | 'hired', background: 'working' | 'middle' | 'wealthy', train = 75) {
    return {
      schemaVersion: 21,
      careerId: 'c-v21',
      seed: 'coach-migrate',
      week: 30,
      fundsCents: 500_00,
      profile: {
        kidName: 'Vera',
        kidLastName: 'Martin',
        gender: 'girl',
        country: 'US',
        background,
        coachSetup,
        playStyle: 'all-court',
        birthMonth: 6,
      },
      plan: { train, rest: 100 - train },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 120,
      prevKidRank: null,
      pendingTournament: null,
      bestFinishByTier: {},
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
      financeWeeks: [],
      condition: 100,
      injury: null,
      injuryHistory: [],
      physioActive: true,
      vacations: [],
      practices: [],
      recoveryBuff: null,
      seasonHistory: [],
      internationalEntryWeeks: [],
      seasonStartRank: null,
      milestones: [],
      skills: { serve: 50, ret: 50, composure: 50, stamina: 50 },
      potential: { serve: 70, ret: 70, composure: 70, stamina: 70 },
      academy: null,
    }
  }

  it('lands a parent-coached career on `self`, whatever it was nominally being billed', () => {
    // The correction the migration comment argues for: priced literally, the old `parent` band
    // ($120-400/wk × the corridor) matches a PAID Middle or High coach, because it was a catch-all
    // base cost with a coach-sized number on it rather than a coach's fee. What that family bought
    // was no coach, and `self` is the only rung that sells it.
    for (const bg of ['working', 'middle', 'wealthy'] as const) {
      expect(migrateSave(v21('parent', bg)).profile.coachTier).toBe('self')
    }
  })

  it('lands a hired career on the rung nearest its old weekly bill, which depends on who paid it', () => {
    // The old bill was wealth-corridor scaled and the new one is not, so the same setting really
    // was charging these three families different amounts:
    //   working  $475 × 0.75 = $356/wk   middle  $475/wk   wealthy  $475 × 1.25 = $594/wk
    // against the ladder's own weekly prices at balanced (4 h): budget 120, middle 200, high 320,
    // elite 480. Nobody is migrated onto `self` – a career that was paying for a coach keeps one.
    expect(migrateSave(v21('hired', 'working')).profile.coachTier).toBe('high')
    expect(migrateSave(v21('hired', 'middle')).profile.coachTier).toBe('elite')
    expect(migrateSave(v21('hired', 'wealthy')).profile.coachTier).toBe('elite')
    for (const bg of ['working', 'middle', 'wealthy'] as const) {
      expect(migrateSave(v21('hired', bg)).profile.coachTier).not.toBe('self')
    }
  })

  it('drops the pre-ladder field and is idempotent', () => {
    const migrated = migrateSave(v21('hired', 'middle'))
    expect('coachSetup' in migrated.profile).toBe(false)
    // Re-migrating an already-v22 save must not re-derive (and cannot, with the old field gone).
    const twice = migrateSave(JSON.parse(JSON.stringify(migrated)))
    expect(twice.profile.coachTier).toBe(migrated.profile.coachTier)
  })
})

describe('player-facing copy', () => {
  it('carries no Cyrillic and no em dash', () => {
    for (const label of Object.values(COACH_TIER_LABEL)) {
      expect(label).not.toMatch(/[Ѐ-ӿ]/)
      expect(label).not.toContain('—')
    }
    // ...and the onboarding chooser's own copy, read off the component.
    const wizard = readFileSync(fileURLToPath(new URL('../src/components/OnboardingWizard.vue', import.meta.url)), 'utf8')
    const options = wizard.slice(wizard.indexOf('const COACH_OPTIONS'), wizard.indexOf('const PLAY_STYLES'))
    expect(options).not.toMatch(/[Ѐ-ӿ]/)
    expect(options).not.toContain('—')
  })
})
