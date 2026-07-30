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
  localSponsorCents,
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
 *  earns no ranking points on EITHER ladder, so the kid sits at the bottom of both tables all year →
 *  national rank > 30 → the local sponsor's annual review pays her nothing. These are the owner's
 *  UNSPONSORED-kid bands. (Read "rank > 30" as the NATIONAL rank since 30.07: the sponsorship is a
 *  flat annual grant gated on the domestic table, not a share of a gear bill gated on the ITF one.)
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
  it('the calibration kid really is unsponsored: rank stays well past the sponsor threshold', () => {
    const world = createWorld('cal-1', { ...DEFAULT_PROFILE, background: 'middle' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // ⚠ RE-AIMED (30.07, tune/rank-numbers): reads the NATIONAL cache now, because that is the table
    // ECONOMY.sponsorship gates on. THE PROTECTED FACT IS UNCHANGED and it is the whole subject of
    // the bands below – this kid enters nothing all year, so she earns no points on EITHER ladder and
    // no sponsor money reaches her. The old line asserted the same thing against `world.kidRank`,
    // which was the right cache while the gate read the international table and is now simply the
    // wrong one to be asking. Both are still true; this is the one that guards the bands.
    expect(world.kidRankDomestic!).toBeGreaterThan(ECONOMY.sponsorship.maxRank)
    // ...so the annual review pays her nothing, which is what makes these the UNSPONSORED bands.
    expect(localSponsorCents(world.kidRankDomestic!)).toBe(0)
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

describe('the local sponsor (round-7 amendment, rebuilt 30.07)', () => {
  // ⚠ RE-AIMED, NOT WEAKENED (30.07, tune/rank-numbers). The three protected facts are the same
  // three this block has always guarded, and all three still hold:
  //   1. a kid who is doing well ends a season materially better off than one who is not, by at
  //      least $1.5k - the "painful but survivable" counter-force is worth real money;
  //   2. the sponsor relationship is VISIBLE in the ledger, under a category the Money screen reads,
  //      rather than a cost quietly shrinking;
  //   3. it draws nothing from the main weekly stream.
  //
  // WHAT MOVED IS THE MECHANISM UNDERNEATH THEM, and both halves of it were wrong:
  //   * THE TABLE. `ECONOMY.sponsorship` gated on `world.kidRank`, the INTERNATIONAL rank, for a
  //     reward that is by concept domestic. Measured over 120 seeds x 208 weeks it fired for nobody
  //     in any preset in any season (her ITF rank sits #89-#109 against a #30 gate; her NATIONAL
  //     rank sits #8-#18). It now reads the national table.
  //   * THE SHAPE. It was a PERCENTAGE off each gear line-item, and a gear bill runs through the
  //     wealth corridor - so the same rule paid the wealthy family $2,384 a season against the
  //     working family's $348. It is now a flat per-season grant, the same figure for everybody.
  // The full argument, including why an annual grant rather than a per-purchase cap, is on
  // ECONOMY.sponsorship in src/engine/economy.ts.
  //
  // AND THE FIXTURE GOES BACK TO A DOMESTIC RESULT. It pushed a tier-less row historically (which
  // `inTrack` reads as domestic) and was moved to `tier: 'j300'` on 30.07 to chase the ITF gate. Now
  // that the gate reads the national table, a domestic row is once again the right way to force the
  // state this block's name claims - stated explicitly as `tier: 'national'` this time rather than
  // relying on the tier-less default, so no future reader has to know that rule to follow it.
  function topRankedBurn(seed: string, background: FamilyBackground): { burn: number; world: WorldState } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    const start = STARTING_FUNDS_CENTS[background]
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // physio + interest excluded for the same reason as seasonBurnDollars (and so the delta compares
    // the sponsorship, not medical luck or reserve size).
    return { burn: (start - world.fundsCents - physioSpendCents(world) + interestEarnedCents(world)) / 100, world }
  }

  it('the flat grant is the SAME cheque for every background (it does not know the family is rich)', () => {
    // THE POINT OF THE REBUILD, asserted directly rather than inferred from a burn: one number, and
    // the wealth corridor cannot reach it. The old percentage valve failed exactly here.
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const { world } = topRankedBurn(`flat-${bg}`, bg)
      const paid = world.events
        .filter((e) => e.category === 'sponsor' && e.text.includes('backed her for the season'))
        .reduce((s, e) => s + (e.amountCents ?? 0), 0)
      expect(paid).toBe(ECONOMY.sponsorship.topSeasonCents)
    }
  })

  it('a national-rank-≤10 middle kid burns ≥ $1.5k less over 52w than an unsponsored one', () => {
    const unsponsored = mean(batchBurns('middle'))
    const sponsored = mean(SEEDS.map((s) => topRankedBurn(s, 'middle').burn))
    expect(unsponsored - sponsored).toBeGreaterThanOrEqual(1_500)
  })

  it('the sponsorship never perturbs the main weekly stream (RNG discipline)', () => {
    // Same seed, same background; one kid is forced to national rank 1, the other is not.
    const plain = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    const sponsored = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    sponsored.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(sponsored)
    const rngA = rngFromSeed('valve-rng')
    const rngB = rngFromSeed('valve-rng')
    for (let i = 0; i < 52; i++) {
      tickWeek(plain, rngA)
      tickWeek(sponsored, rngB)
    }
    // The review reads a rank cache and adds an event; it draws nothing. Cohort drift and the AI
    // field resolve identically in both worlds.
    expect(plain.cohort).toEqual(sponsored.cohort)
    expect(plain.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      sponsored.results.filter((r) => r.playerId !== KID_ID),
    )
    // ...but the sponsored kid banked the grant, so she ends richer.
    expect(sponsored.fundsCents).toBeGreaterThan(plain.fundsCents)
  })

  it('emits the sponsorship as a tagged income event (so the Money breakdown shows it)', () => {
    const { world } = topRankedBurn('cal-1', 'middle')
    const paid = world.events.filter((e) => e.category === 'sponsor' && e.text.includes('backed her for the season'))
    expect(paid.length).toBeGreaterThan(0)
    for (const e of paid) {
      expect(e.type).toBe('income')
      expect(e.amountCents).toBeGreaterThan(0)
      // It names the table it read. The whole failure mode being fixed here is a gate whose ladder
      // the player could not see, so the copy has to say which one.
      expect(e.text).toContain('National')
    }
  })

  it('...and the gear line-items are plain again – no line claims a sponsor covered it', () => {
    // The valve used to emit $0 / halved gear rows with " – covered by your racket sponsor" glued on.
    // That wording is gone with the mechanism; a family pays for its own kit and the sponsor's
    // contribution arrives once a year as money. Guards against the old copy drifting back in.
    const { world } = topRankedBurn('cal-2', 'wealthy')
    for (const e of world.events) {
      expect(e.text).not.toContain('covered by your racket sponsor')
      expect(e.text).not.toContain('sponsor covers half')
    }
  })

  it('the gate reads the NATIONAL table – an international-only result buys nothing', () => {
    // The regression that made this dead content, pinned. A kid who is #1 in the world and unranked
    // at home is not somebody a local shop has heard of; more to the point, the reverse is the case
    // this mechanic exists for and the two must not be confused again.
    const world = createWorld('gate-table', { ...DEFAULT_PROFILE, background: 'working' })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'j300' })
    recomputeKidRank(world)
    expect(world.kidRank).toBe(1) // top of the international table...
    expect(world.kidRankDomestic!).toBeGreaterThan(ECONOMY.sponsorship.maxRank) // ...nobody at home
    expect(localSponsorCents(world.kidRankDomestic!)).toBe(0)
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
