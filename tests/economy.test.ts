import { describe, it, expect, vi } from 'vitest'

// The 16-seed × 52-week calibration batches below sit at ~3s against vitest's 5s default – close
// enough that a busy run tips them over and the gate goes red on timing, not on a claim. Same
// generous file-level timeout the other batch files already use (tests/fatigue-bench.test.ts):
// these tests are deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import {
  ageAtWeek,
  createWorld,
  tickWeek,
  recomputeKidRank,
  financeWindow,
  STARTING_FUNDS_CENTS,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, GEAR_CATEGORIES, gearHitsUpTo } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { COACH_TIERS, coachWeeklyBandCents } from '../src/engine/coach'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground } from '../src/shared/protocol'

// Fixed calibration batch. 16 seeds so the mean is stable against the working-class sponsor's
// high variance (a single working season can swing several $k on sponsor luck – see below), while
// staying cheap.
const SEEDS = Array.from({ length: 16 }, (_, i) => `cal-${i + 1}`)

/** The season's physio/medical spend in cents (a positive number). Season-Life slice C layered
 *  injuries + physio ON TOP of the base economy; the owner's net-burn bands below were frozen
 *  BEFORE that layer, so the calibration excludes the 'physio' bucket (a stochastic medical tail
 *  – a single severe onset swings $3-6k) and keeps measuring what it always measured: the fixed
 *  base cashflow. The medical layer's own calibration lives in tests/injuries.test.ts + the bench. */
function physioSpendCents(world: WorldState): number {
  return -(financeWindow(world.financeWeeks, 0).byCategory.physio ?? 0)
}

/** The season's savings-interest income in cents (round-9 R9-1). Like the physio tail above,
 *  the interest layer landed AFTER the owner froze the burn bands – and it scales with the
 *  STARTING reserve (wealthy's 120k earns ~$3.7k/yr, dwarfing middle's), so leaving it in
 *  would warp the band comparison. The calibration adds it back and keeps measuring the fixed
 *  base cashflow it always measured. */
function interestEarnedCents(world: WorldState): number {
  return financeWindow(world.financeWeeks, 0).byCategory.interest ?? 0
}

/** The season's local-sponsor cameo income in cents (working-only; 0 for middle/wealthy). See the
 *  working-burn test below for why the calibration measures the burn BEFORE this gift. */
function sponsorIncomeCents(world: WorldState): number {
  return financeWindow(world.financeWeeks, 0).byCategory.sponsor ?? 0
}

/** Net funds lost over 52 weeks with NO tournaments entered (fixed costs only). A fresh career
 *  earns no ranking points, so the kid sits at the bottom of the field all year → rank > 30 →
 *  the product-sponsorship valve never fires. These are the owner's UNSPONSORED-kid bands.
 *
 *  ⚠ TAKES A COACH RUNG NOW – see CALIBRATION_TIER below for why it has to. */
function seasonBurnDollars(
  seed: string,
  background: FamilyBackground,
  opts: { excludeSponsor?: boolean } = {},
): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: CALIBRATION_TIER[background] })
  const rng = rngFromSeed(world.seed)
  const start = STARTING_FUNDS_CENTS[background]
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  const sponsor = opts.excludeSponsor ? sponsorIncomeCents(world) : 0
  return (start - world.fundsCents - physioSpendCents(world) + interestEarnedCents(world) + sponsor) / 100
}

function batchBurns(background: FamilyBackground, opts: { excludeSponsor?: boolean } = {}): number[] {
  return SEEDS.map((s) => seasonBurnDollars(s, background, opts))
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

// ⚠ RE-AIMED BY THE COACH LADDER – THE MECHANISM THAT MAKES THE THREE CELLS DIFFER MOVED, so this
// calibration had to move with it or stop measuring anything about class.
//
// Until now all three cells ran on the SAME coach setting (DEFAULT_PROFILE's `hired`) and the
// WEALTH CORRIDOR did the tiering: one $250-700/wk band × 0.75 / 1.00 / 1.25. The corridor has left
// coaching (docs/specs/coach-tiers.md §2), so holding the coach constant would now charge all three
// families the identical bill and the cells would differ only by income and gear. The rung is what
// tiers them now, so each family is calibrated on the rung it actually buys – the same three rungs
// tools/econ-bench.ts puts them on.
const CALIBRATION_TIER: Record<FamilyBackground, CoachTier> = {
  working: 'budget',
  middle: 'middle',
  wealthy: 'elite',
}

// ⚠ RE-BASED AGAIN (Round 2), and this time the WEALTHY cell flips back to a burn. Two knobs moved
// under it: hours went 4 -> 5 at the balanced plan (the owner's own 4/5/6), which raises every
// weekly bill by a quarter, and the wealth corridor went back ON coaching, which prices each family
// in its own market. Together they put an Elite coach in a premium academy at $750/wk against a
// wealthy family's $750/wk of parent income - so "premium everything must hurt" is back in the idle
// year for the family it was written about, rather than only in the playing season.
//
// The Round-1 note still stands for the other two, and it is worth keeping because it explains what
// the ORIGINAL bands were really measuring: they charged every family a coach the spec prices as
// ELITE (the old `hired` band's ~$475/wk midpoint), so a working family on $245/wk of parent income
// was billed $356/wk for coaching - 145% of its own income - in a year with no tournaments in it.
// That was the wall, measured, in a test that had been reporting it as a healthy $6.8k burn.
//
// Measured (same 16 seeds, sponsor-excluded for working), with the coaching line that produced it:
//   working · budget  $112/wk  burn mean -$5,667   spread -$6,670 .. -$4,798
//   middle  · middle  $250/wk  burn mean -$7,334   spread -$9,441 .. -$4,754
//   wealthy · elite   $750/wk  burn mean +$6,280   spread -$1,126 .. +$13,527
// The mean bands below are those windows with headroom; the per-seed tolerances are wider because
// the corridor roll now breathes on the coaching line every week, which it did not in Round 1.
//
// FOR THE OWNER, and please do not "fix" it by moving these numbers: an idle year is still a SAVING
// for the two families below the top, so the round-7 item-1d burn bands no longer discriminate
// between all three and are due a design decision rather than another re-pin. The bench is where
// the real question lives now - tools/econ-bench.ts walks each family up its own corridor and
// reports which rungs it survives.
const BANDS: Record<FamilyBackground, [number, number]> = {
  working: [-6_500, -4_800],
  middle: [-8_500, -6_000],
  wealthy: [4_500, 8_000],
}

/** Per-seed tolerance around each band. The corridor roll moves the coaching line every week, so a
 *  single season lands further from the batch mean than it did with a corridor-free bill. */
const SEED_SLACK: Record<FamilyBackground, number> = { working: 2_500, middle: 3_500, wealthy: 8_000 }

describe('economy calibration – 52-week net burn (no tournaments, unsponsored kid)', () => {
  it('the calibration kid really is unsponsored: rank stays well past the valve threshold', () => {
    const world = createWorld('cal-1', { ...DEFAULT_PROFILE, background: 'middle' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // No results earned → bottom of the field → far past the ≤30 half-price / ≤10 free thresholds.
    expect(world.kidRank).toBeGreaterThan(ECONOMY.sponsorship.halfPriceMaxRank)
  })

  it('working (budget coach) lands in the -$6.5k..-$4.8k band (batch mean, BEFORE the sponsor cameo)', () => {
    // The sponsor exclusion is UNCHANGED and its reasoning is untouched by the ladder. Working keeps
    // the need-based local sponsor, whose 6% × $500-1500 roll is worth ~$3.1k a season in
    // expectation with a ~$1.7k per-season spread – comparable to the entire measured figure. So a
    // sponsor-INCLUSIVE 16-seed batch mean is nowhere near converged and moves by more than $1k
    // whenever the main stream re-aligns. The band's own subject is the FIXED base cashflow (see the
    // physio / interest exclusions above), so the calibration measures exactly that.
    const burns = batchBurns('working', { excludeSponsor: true })
    const [lo, hi] = BANDS.working
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    // The cameo really is being excluded (the branch is exercised, not a no-op on this batch).
    expect(mean(batchBurns('working'))).toBeLessThan(mean(burns))
  })

  it('middle (middle coach) lands in the -$8.5k..-$6k band (mean, and every seed inside slack)', () => {
    const burns = batchBurns('middle')
    const [lo, hi] = BANDS.middle
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - SEED_SLACK.middle)
      expect(b).toBeLessThanOrEqual(hi + SEED_SLACK.middle)
    }
  })

  it('wealthy (elite coach) BURNS $4.5-8k in an idle year – premium everything hurts again', () => {
    // ⚠ THE SIGN FLIPPED BACK (Round 2). Round 12 had raised the wealthy income to $750/wk and this
    // cell became a break-even; Round 1 of the ladder made it a $8.3k saving, because an Elite coach
    // at four hours and no corridor was $480/wk. With the owner's 5 hours and his corridor, a
    // premium academy's Elite coach is $750/wk - exactly the family's weekly income - so the idle
    // year burns, which is what the round-7 "premium everything must hurt" always meant.
    const burns = batchBurns('wealthy')
    const [lo, hi] = BANDS.wealthy
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - SEED_SLACK.wealthy)
      expect(b).toBeLessThanOrEqual(hi + SEED_SLACK.wealthy)
    }
  })

  it('ordering: the top of the ladder burns, and the two rungs below it save', () => {
    // ⚠ RE-AIMED TWICE. The original read "working < middle, and wealthy no longer belongs in that
    // ordering" - round 12 had already broken the working < middle < wealthy chain by raising the
    // wealthy income, and what ordered the two survivors was the corridor on their shared coach
    // band. Round 1 of the ladder made it "income minus a rung's price". Round 2 restores the
    // corridor AND raises the hours, and the chain that comes out is a third thing again:
    //   middle  · middle  425/wk income − 250/wk coach   burn -$7,334   saves the MOST
    //   working · budget  245/wk income − 112/wk coach   burn -$5,667
    //   wealthy · elite   750/wk income − 750/wk coach   burn +$6,280   the only one that BURNS
    // Middle on top is not an accident: it buys the rung with the widest gap between what the family
    // earns and what its academy charges. And wealthy at the top of the market spends its whole
    // income on the coach alone, before a single trip - which is the design, stated as a number.
    const w = mean(batchBurns('working', { excludeSponsor: true }))
    const m = mean(batchBurns('middle'))
    const rich = mean(batchBurns('wealthy'))
    expect(m).toBeLessThan(w)
    expect(w).toBeLessThan(rich)
    expect(rich).toBeGreaterThan(0) // the only cell in the table that is a burn at all
  })
})

describe('product-sponsorship valve (round-7 amendment)', () => {
  // Force the kid to the very top with a big, in-window result (AI selection excludes the kid, so
  // this touches only the ranking, never the main stream). Then gear/stringing are covered.
  function topRankedBurn(seed: string, background: FamilyBackground): { burn: number; world: WorldState } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000 })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    const start = STARTING_FUNDS_CENTS[background]
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // physio + interest excluded for the same reason as seasonBurnDollars (and so the valve
    // delta compares gear subsidies, not medical luck or reserve size).
    return { burn: (start - world.fundsCents - physioSpendCents(world) + interestEarnedCents(world)) / 100, world }
  }

  it('a rank-≤10 middle kid burns ≥ $1.5k less over 52w than an unsponsored one', () => {
    const unsponsored = mean(batchBurns('middle'))
    const sponsored = mean(SEEDS.map((s) => topRankedBurn(s, 'middle').burn))
    expect(unsponsored - sponsored).toBeGreaterThanOrEqual(1_500)
  })

  it('subsidising gear never perturbs the main weekly stream (RNG discipline)', () => {
    // Same seed, same background; one kid is forced to rank ≤10 (gear free), the other is not.
    const plain = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    const sponsored = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    sponsored.results.push({ playerId: KID_ID, week: 0, points: 100_000 })
    recomputeKidRank(sponsored)
    const rngA = rngFromSeed('valve-rng')
    const rngB = rngFromSeed('valve-rng')
    for (let i = 0; i < 52; i++) {
      tickWeek(plain, rngA)
      tickWeek(sponsored, rngB)
    }
    // The valve reads the kid's rank but draws nothing from the main stream: cohort drift and the
    // AI field resolve identically in both worlds.
    expect(plain.cohort).toEqual(sponsored.cohort)
    expect(plain.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      sponsored.results.filter((r) => r.playerId !== KID_ID),
    )
    // ...but the sponsored kid spent less (gear covered), so she ends richer.
    expect(sponsored.fundsCents).toBeGreaterThan(plain.fundsCents)
  })

  it('emits the sponsor-covered gear events (still tagged, so the Money breakdown shows them)', () => {
    const { world } = topRankedBurn('cal-1', 'middle')
    const covered = world.events.filter(
      (e) => e.type === 'expense' && e.text.includes('covered by your racket sponsor'),
    )
    expect(covered.length).toBeGreaterThan(0)
    // covered line-items are $0 but still carry a gear/stringing category
    for (const e of covered) {
      expect(e.amountCents).toBe(0)
      expect(['gear', 'stringing']).toContain(e.category)
    }
  })
})

describe('gear cadence (round-7 a) – each category fires within its window', () => {
  const HORIZON = 520
  for (const background of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    for (const category of GEAR_CATEGORIES) {
      it(`${background}/${category}: gaps and prices stay inside the configured ranges`, () => {
        const line = ECONOMY.gear[category]
        const [cadLo, cadHi] = line.cadenceWeeks[background]
        const [prLo, prHi] = line.priceCents[background]
        const hits = gearHitsUpTo(`gear-cadence-${background}`, category, background, HORIZON)
        expect(hits.length).toBeGreaterThan(0)
        let prev = 0
        for (const h of hits) {
          const gap = h.week - prev
          expect(gap).toBeGreaterThanOrEqual(cadLo)
          expect(gap).toBeLessThanOrEqual(cadHi)
          expect(h.amountCents).toBeGreaterThanOrEqual(prLo)
          expect(h.amountCents).toBeLessThanOrEqual(prHi)
          prev = h.week
        }
      })
    }
  }

  it('gear schedules are deterministic and independent of the main stream / background choice', () => {
    // Same seed → same schedule every time (purpose-scoped sub-stream, re-derived from the seed).
    const a = gearHitsUpTo('det', 'rackets', 'middle', 200)
    const b = gearHitsUpTo('det', 'rackets', 'middle', 200)
    expect(a).toEqual(b)
    // A longer horizon is a strict prefix-superset: the (week, amount) pairs for the earlier weeks
    // never shift, so walking further ahead can't retroactively change a past purchase.
    const short = gearHitsUpTo('det', 'rackets', 'middle', 60)
    const long = gearHitsUpTo('det', 'rackets', 'middle', 200)
    expect(long.slice(0, short.length)).toEqual(short)
  })
})

// ---------------------------------------------------------------------------
// ⚠ RE-AIMED BY THE COACH LADDER (docs/specs/coach-tiers.md §2), AND THE FACT IS INVERTED
// ON PURPOSE. This block used to be "coaching wealth corridor": the weekly coaching bill was a
// band × ONE uniform roll from the private `seed:coachbg:week` sub-stream mapped into
// `wealthCorridor[background]`, and the tests asserted working < middle < wealthy per week.
//
// WHAT MOVED. The corridor came OFF coaching, because the coach TIER now states the family's price
// level explicitly and keeping both would charge the difference twice – a working family would pick
// Budget AND get a discount on it. So the ordering that used to be asserted here is now a bug, and
// the property that replaces it is its exact negation: the coaching bill is a MARKET RATE, the same
// number for every background, and what differs is who can pay it.
//
// WHAT DID NOT MOVE, and is why the third test below is untouched: the corridor was always a
// POST-draw multiply off a private sub-stream, so the MAIN weekly stream never depended on
// background. Removing it cannot have broken that, and the guard still proves it – it is simply
// proving something stronger now (no sub-stream roll to be background-dependent about either).
//
// The corridor itself is alive and asserted elsewhere, on the three bills that kept it: travel
// (tests/season/calendar.test.ts), medical (tests/injuries.test.ts C11) and the season planner's
// packages (tests/planner.test.ts P3).
// ---------------------------------------------------------------------------
// ⚠ RE-AIMED TWICE, AND IT IS BACK WHERE IT STARTED - WITH A BETTER REASON.
//
// Round 1 inverted this block. It had asserted working < middle < wealthy per week (the coaching
// bill × `wealthCorridor[background]` off one `seed:coachbg:week` roll), and I inverted it to
// "every background pays the same" on the argument that the coach TIER already says "poorer
// families buy cheaper coaches", so keeping the corridor charges the difference twice.
//
// Round 2 put it back, because the owner's model is better and is a DIFFERENT claim: the corridor
// is not a discount for being poor, it is THE MARKET SHE TRAINS IN. The same rung of coach costs
// different money in a working-class club, an ordinary academy and a premium one - the court, the
// city and the queue for that coach's time are different. A family does not get a cheaper Middle
// coach because it is poor; it hires the Middle coach its academy HAS. So the ordering below is
// asserted again, and the wealthy family paying MORE for the same rung is the point rather than a
// side effect.
//
// WHAT IS NEW SINCE THE ORIGINAL, and why this is not simply the old block restored: the tier is a
// second, independent dial. The corridor orders the three FAMILIES at one rung; the rung ladder
// orders the five RUNGS inside one family. Both are asserted here, and the bands' own ascent (which
// is what makes the second ordering hold) is pinned in tests/coachTiers.test.ts.
//
// The third test is untouched through both rounds, and that is the point of it: the corridor was
// always a POST-draw multiply on a private sub-stream, so the MAIN weekly stream never depended on
// background - taking it off could not break that and putting it back cannot either.
// ---------------------------------------------------------------------------
describe('the coaching bill is priced in the family\'s own market (the wealth corridor)', () => {
  const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

  // Tick one week and return the week-1 coaching bill in cents.
  function weekOneCoaching(seed: string, background: FamilyBackground, coachTier: CoachTier): number {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier })
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const bill = world.events.find((e) => e.week === 1 && e.category === 'coaching')
    expect(bill).toBeDefined()
    return -bill!.amountCents!
  }

  it('orders working < middle < wealthy for the SAME rung, per week, off the same roll', () => {
    // The corridors are disjoint (≤0.80 < 0.95..1.05 < 1.20≤) and the roll is shared, so the
    // ordering holds every week rather than only on average. Asserted at EVERY rung, because the
    // claim is that the whole ladder is priced in every market and not just the middle of it.
    for (const tier of COACH_TIERS) {
      const costs = BACKGROUNDS.map((bg) => weekOneCoaching('coach-market', bg, tier))
      expect(costs[0]).toBeLessThan(costs[1])
      expect(costs[1]).toBeLessThan(costs[2])
      // ...and each bill sits inside its rung's weekly envelope for ITS market.
      BACKGROUNDS.forEach((bg, i) => {
        const world = createWorld('coach-market', { ...DEFAULT_PROFILE, background: bg, coachTier: tier })
        const [lo, hi] = coachWeeklyBandCents(tier, ageAtWeek(1), world.plan, bg)
        expect(costs[i]).toBeGreaterThanOrEqual(lo)
        expect(costs[i]).toBeLessThanOrEqual(hi)
      })
    }
  })

  it('orders the RUNGS inside one market: self < budget < middle < high < elite', () => {
    // The second dial. Rung bands do not overlap between neighbours (self takes the middle of
    // $10-30/h, budget is $24-36, middle $40-60, high $64-96, elite $96-144), so a career on a
    // dearer rung really does pay more whatever coach it drew - which is what makes "which rung"
    // a decision rather than a lottery.
    for (const bg of BACKGROUNDS) {
      const costs = COACH_TIERS.map((tier) => weekOneCoaching(`rung-${bg}`, bg, tier))
      for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1])
    }
  })

  it('is deterministic: the same seed + market + rung always yields the same bill', () => {
    for (const tier of COACH_TIERS) {
      for (const bg of BACKGROUNDS) {
        expect(weekOneCoaching('coach-det', bg, tier)).toBe(weekOneCoaching('coach-det', bg, tier))
      }
    }
  })

  it('never perturbs the MAIN weekly stream: draw count + sequence are background-independent (52w)', () => {
    // UNCHANGED THROUGH BOTH ROUNDS. The bill is drawn with one main-stream `pickInt` and everything
    // with a decision behind it - rate, hours, corridor - is multiplied on afterwards, off pure
    // look-ups or private sub-streams. So the same seed must produce a byte-identical main-stream
    // sequence for every background.
    const capture = (background: FamilyBackground) => {
      const world = createWorld('coach-invariance', { ...DEFAULT_PROFILE, background })
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) tickWeek(world, rng)
      return draws
    }
    const [w, m, r] = BACKGROUNDS.map(capture)
    expect(m.length).toBe(w.length)
    expect(r.length).toBe(m.length)
    expect(w.join(',')).toBe(m.join(','))
    expect(r.join(',')).toBe(m.join(','))
  })
})
