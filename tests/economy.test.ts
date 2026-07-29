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

// ⚠ ALL THREE BANDS RE-BASED, AND THE SIGN FLIPPED. Burn > 0 means net burn; negative means the
// household saves while she does not play. Every band below is now negative, and that is
// arithmetic rather than a retune: the OLD calibration charged every family a coach the spec
// prices as ELITE (the `hired` band's ~$475/wk midpoint), so a working family on $245/wk of parent
// income was being billed $356/wk for coaching – 145% of its own income – in a year with no
// tournaments in it. That was the wall, measured. On the ladder that family buys Budget at $120/wk
// and its idle year turns over.
//
// Measured (same 16 seeds, sponsor-excluded), with the coaching line that produced it:
//   working · budget  coaching $6,240/yr   burn mean -$5,441   spread -$5,638 .. -$5,265
//   middle  · middle  coaching $10,400/yr  burn mean -$9,393   spread -$9,761 .. -$9,028
//   wealthy · elite   coaching $24,960/yr  burn mean -$8,305   spread -$9,122 .. -$7,464
// The bands are those windows with about $1k of headroom, pinned so the knobs cannot drift
// unnoticed in either direction – the same treatment the round-12 and round-13 income re-bases got.
//
// FOR THE OWNER, and please do not "fix" it by moving these numbers: an IDLE year is now a saving
// for all three families, so the round-7 item-1d burn bands no longer discriminate between them and
// are due a design decision rather than another re-pin. What they were really measuring – "premium
// everything must hurt" – had already moved to the PLAYING season in round 12 (see the wealthy note
// below), and the bench is where it now lives: tools/econ-bench.ts still bankrupts a 25k family that
// buys a Middle coach and plays a full schedule, 113 careers out of 120 over 14→18.
const BANDS: Record<FamilyBackground, [number, number]> = {
  working: [-6_500, -4_500],
  middle: [-10_500, -8_500],
  wealthy: [-9_500, -7_000],
}

describe('economy calibration – 52-week net burn (no tournaments, unsponsored kid)', () => {
  it('the calibration kid really is unsponsored: rank stays well past the valve threshold', () => {
    const world = createWorld('cal-1', { ...DEFAULT_PROFILE, background: 'middle' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // No results earned → bottom of the field → far past the ≤30 half-price / ≤10 free thresholds.
    expect(world.kidRank).toBeGreaterThan(ECONOMY.sponsorship.halfPriceMaxRank)
  })

  it('working (budget coach) lands in the -$6.5k..-$4.5k band (batch mean, BEFORE the sponsor cameo)', () => {
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

  it('middle (middle coach) lands in the -$10.5k..-$8.5k band (mean and every seed)', () => {
    const burns = batchBurns('middle')
    const [lo, hi] = BANDS.middle
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    // middle has no sponsor income → tight spread → every seed is in-band too.
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo)
      expect(b).toBeLessThanOrEqual(hi)
    }
  })

  it('wealthy (elite coach) lands in the -$9.5k..-$7k band at the $750/wk income', () => {
    // The round-12 reading survives the ladder intact: at $750/wk the wealthy family out-earns its
    // idle spend, and "premium everything must hurt" lives in the PLAYING season, where the bench
    // measures $243k of gross expense over 14→18. What the ladder changed is only the size of the
    // saving – Elite at $480/wk is cheaper than the old $250-700 band × the 1.2-1.3 corridor was.
    const burns = batchBurns('wealthy')
    const [lo, hi] = BANDS.wealthy
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - 3_000) // measured spread + headroom, still bounded
      expect(b).toBeLessThanOrEqual(hi + 3_000)
    }
  })

  it('ordering: the idle year now sorts by (income − coach price), not by the corridor', () => {
    // ⚠ RE-AIMED, AND THE CHAIN IS DIFFERENT BECAUSE THE MECHANISM IS. The old assertion was
    // "working < middle, and wealthy no longer belongs in that ordering" – round 12 had already
    // broken the original working < middle < wealthy chain by raising the wealthy income, and what
    // ordered the two remaining families was the wealth corridor on their shared coach band.
    //
    // With the corridor off coaching, an idle year is income minus a rung's price, so THAT is what
    // the ordering now reads. Measured (sponsor-excluded, so the working cell is the stable figure
    // its own band is measured on):
    //   working · budget  245/wk income − 120/wk coach   burn -$5,441   saves the LEAST
    //   wealthy · elite   750/wk income − 480/wk coach   burn -$8,305
    //   middle  · middle  425/wk income − 200/wk coach   burn -$9,393   saves the MOST
    // Middle on top is not an accident and is worth stating: it buys the rung with the widest gap
    // between what the family earns and what the coach charges. Wealthy sits below it because its
    // gear, travel-free though this year is, is priced for a family that buys everything premium.
    const w = mean(batchBurns('working', { excludeSponsor: true }))
    const m = mean(batchBurns('middle'))
    const rich = mean(batchBurns('wealthy'))
    expect(m).toBeLessThan(rich)
    expect(rich).toBeLessThan(w)
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
describe('the coaching bill is a market rate (the wealth corridor came OFF it)', () => {
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

  it('charges every background the SAME bill for the same rung (this is the inverted assertion)', () => {
    for (const tier of COACH_TIERS) {
      const costs = BACKGROUNDS.map((bg) => weekOneCoaching('coach-market', bg, tier))
      expect(costs[1]).toBe(costs[0])
      expect(costs[2]).toBe(costs[0])
      // ...and it lands inside the rung's own weekly band (hourly band × the hours the plan buys).
      const world = createWorld('coach-market', { ...DEFAULT_PROFILE, coachTier: tier })
      const [lo, hi] = coachWeeklyBandCents(tier, ageAtWeek(1), world.plan)
      expect(costs[0]).toBeGreaterThanOrEqual(lo)
      expect(costs[0]).toBeLessThanOrEqual(hi)
    }
  })

  it('orders the RUNGS instead: self < budget < middle < high < elite, off the same draw', () => {
    // The bands are not disjoint (self $10-30/h overlaps budget $24-36/h), so this is not an
    // ordering of bands – it is an ordering of the SAME uniform draw mapped through each of them.
    // `pickInt` is monotone in both endpoints, and every band's lo and hi increase up the ladder,
    // so the ordering holds PER WEEK rather than only on average. Same argument the old corridor
    // test made from disjointness, made from monotonicity instead.
    for (const seed of ['rung-a', 'rung-b', 'rung-c']) {
      const costs = COACH_TIERS.map((tier) => weekOneCoaching(seed, 'middle', tier))
      for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1])
    }
  })

  it('is deterministic: the same seed + rung always yields the same bill', () => {
    for (const tier of COACH_TIERS) {
      expect(weekOneCoaching('coach-det', 'middle', tier)).toBe(weekOneCoaching('coach-det', 'middle', tier))
    }
  })

  it('never perturbs the MAIN weekly stream: draw count + sequence are background-independent (52w)', () => {
    // UNCHANGED FROM THE CORRIDOR ERA. The bill was always drawn with one main-stream `pickInt`
    // and scaled afterwards; now it is drawn with one main-stream `pickInt` and multiplied by
    // hours. Either way the same seed must produce a byte-identical main-stream sequence for
    // every background.
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
