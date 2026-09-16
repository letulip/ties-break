// ⭐⭐⭐ ROUND 42 #19 – THE RETAINER FOLLOWS HER RANK, MEASURED WHERE THE PLAYER READS IT.
//
// THE OWNER: «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не существует», and then
// «у нас есть исследование и бенч, надо просто цифры проверить и актуализировать». His research
// (docs/research/team-economics-2026-09.md §1) sizes a head coach's retainer off THE PLAYER'S RANK;
// ours read the tier the parent chose and her age band, and never re-priced a signed man.
// docs/specs/elite-retainer-2026-09.md carries the predicted-vs-measured table.
//
// ⚠⚠ THIS FILE'S REAL SUBJECT IS FINDING 3.2, NOT THE RAISE. «The raise must hit ONLY the elite
// tail» is the constraint the whole change lives or dies by, and §2 below is it stated where a
// player would notice: a career with no counting professional result quotes the SAME INTEGER CENTS
// it quoted before the band existed. The engine-side proof that the same holds week after week over
// whole careers is `tools/r42-elite-retainer.ts` §5.
//
// ⚠ AND §3 IS HIS STANDING VISUAL RULE OF 14.09 («визуальную проверку на всех экранах надо тоже
// заложить в билдера в спеку при внесении правок») aimed at the one thing this item actually does to
// a screen: the coach's weekly figure grows a digit at the top of the table. $962 becomes $4,329.
//
// ⚠ MUTATION-VERIFIED – ⚠ COUNTS READ OFF THE RUNS AND NOT PREDICTED, each mutation applied alone
// and reverted (see the round-42 handoff for the transcript).
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING – round 26 #16's rule for every mounted case over ~1s.
vi.setConfig({ testTimeout: 30_000 })
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  coachBilling,
  coachRetainerBandOf,
  createWorld,
  openingCoachId,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { bandedRateCents, coachById, coachRateBandCents, coachRetainerBand, coachWeeklyCents, facilityRateCents, tierOf } from '../../src/engine/coach'
import { ageAtWeek } from '../../src/engine/world/age'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, assertInlineRowFits, setViewport, type Viewport } from './fits'

/** A coached professional career. `bestFinishByTier.w15 = 0` is the one-way door the pro surfaces
 *  gate on (`activeLadderOf === 'wta'`), the same handle `round42-team-budget.test.ts` uses. */
function proCareer(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'elite', background: 'wealthy' })
  world.bestFinishByTier.w15 = 0
  world.coachId = openingCoachId(world.seed, { ...world.profile, coachTier: 'elite' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 40; i++) tickWeek(world, rng)
  world.fundsCents = Math.max(world.fundsCents, 5_000_000_00)
  return world
}

/** …standing at `rank` in the professional table. The gate-probe idiom of
 *  `tests/round29p4-ad-portfolio.test.ts`: a counting W result, then the cache. `kidLadderRank`
 *  refuses to answer without the first half, which is «unranked is not a number» and not a quirk. */
function atRank(world: WorldState, rank: number): WorldState {
  world.results.push({ playerId: KID_ID, week: world.week, points: 2000, tier: 'w100' })
  world.kidRankWta = rank
  return world
}

async function mountMarket(snapshot: Snapshot): Promise<VueWrapper> {
  useGameStore().snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  await nextTick()
  return wrapper
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// 1 – THE BAND REACHES THE BILL, AND THE THREE RUNGS ARE THREE DIFFERENT NUMBERS
// =================================================================================================
describe('round 42 #19 – her rank re-prices her coach', () => {
  it('⭐⭐ a top-ten player, a top-hundred player and an unranked one pay three different retainers', () => {
    const unranked = proCareer('r42-19-unranked')
    const hundred = atRank(proCareer('r42-19-hundred'), 60)
    const ten = atRank(proCareer('r42-19-ten'), 5)

    expect(coachRetainerBandOf(unranked), 'no counting W result is the identity').toBe(1)
    expect(coachRetainerBandOf(hundred)).toBe(2)
    expect(coachRetainerBandOf(ten)).toBe(4.5)

    // ⚠ THE FIGURES ARE REBUILT FROM THE FUNCTIONS THAT BILL THEM, never read back off the snapshot
    // the component reads – the round-42 house rule for a money assertion.
    const quote = (w: WorldState, band: number): number => {
      const age = ageAtWeek(w.week)
      const coach = coachById(w.seed, age, w.coachId)!
      return coachWeeklyCents(bandedRateCents(coach.rateCents, age, tierOf(coach), band), w.plan, w.profile.background, tierOf(coach))
    }
    expect(coachBilling(unranked).weeklyCents).toBe(quote(unranked, 1))
    expect(coachBilling(hundred).weeklyCents).toBe(quote(hundred, 2))
    expect(coachBilling(ten).weeklyCents).toBe(quote(ten, 4.5))

    // Strictly ordered, and the court is why the steps are not exactly 2x and 4.5x: the band
    // multiplies his LABOUR and the hall is charged at the same price to all three.
    expect(coachBilling(hundred).weeklyCents).toBeGreaterThan(coachBilling(unranked).weeklyCents)
    expect(coachBilling(ten).weeklyCents).toBeGreaterThan(coachBilling(hundred).weeklyCents)
  })

  it('⭐ the band multiplies HIS LABOUR and not the hall – the coach line is exactly 4.5x', () => {
    const unranked = coachBilling(proCareer('r42-19-split'))
    const ten = coachBilling(atRank(proCareer('r42-19-split'), 5))

    // ⚠⚠ THE RATIO IS THE ASSERTION AND `facilityCents` CANNOT BE. The first draft of this arm
    // checked that the facility line was unchanged and it was a TAUTOLOGY, caught by mutating: the
    // facility half of `weeklyBillSplit` is computed from `facilityRateCents` and never from the
    // rate passed in, so it is unchanged whatever the band does to the rate – including the wrong
    // thing. Measured: banding the WHOLE rate (court included) left that draft 8/8 green while it
    // overcharged an elite 23+ family by ~$1,000 a week. The ratio is what tells the two apart,
    // because a court that rode the band would push the coach line ABOVE 4.5x.
    expect(ten.split.coachCents).toBeGreaterThan(0)
    expect(ten.split.coachCents / unranked.split.coachCents).toBeCloseTo(4.5, 3)
    expect(ten.split.facilityCents).toBe(unranked.split.facilityCents)
    // …and the v44 identity survives the raise (tests/split-the-bill.test.ts is its home).
    expect(ten.split.coachCents + ten.split.facilityCents).toBe(ten.split.totalCents)
  })
})

// =================================================================================================
// 2 – FINDING 3.2's HARD CONSTRAINT: THE MIDDLE DOES NOT MOVE
// =================================================================================================
describe('round 42 #19 – the raise cannot reach the mid game', () => {
  it('⭐⭐⭐ a career outside the professional top hundred quotes the same integer cents', async () => {
    // ⚠ #101 AND NOT «unranked»: the interesting boundary is a real professional one rung BELOW the
    // band, because an unranked career could be unchanged for the trivial reason that nothing reads
    // her at all. She holds a counting result, she has a rank, and the band still returns 1.
    const below = atRank(proCareer('r42-19-below'), 101)
    const none = proCareer('r42-19-below')
    expect(coachRetainerBandOf(below), '#101 is one rung outside the band').toBe(1)
    expect(coachBilling(below).weeklyCents).toBe(coachBilling(none).weeklyCents)
    expect(coachBilling(below).split.coachCents).toBe(coachBilling(none).split.coachCents)
    expect(coachBilling(below).weekRangeCents).toEqual(coachBilling(none).weekRangeCents)

    // …and the market she is shopping in quotes her the same prices too.
    const belowRows = toSnapshot(below).coachMarket.map((r) => r.weeklyCents)
    const noneRows = toSnapshot(none).coachMarket.map((r) => r.weeklyCents)
    expect(belowRows, 'the whole roster re-priced for a career the band does not reach').toEqual(noneRows)
    await nextTick()
  })

  it('⭐⭐⭐ the identity holds over the WHOLE ladder, not a sample of it', () => {
    // ⚠⚠ THIS ARM EXISTS BECAUSE THE BENCH'S COHORT PROOF CAME BACK A NULL. `tools/r42-elite-retainer.ts`
    // §5 partitions its corpus into «ever inside the band» and «never», and over 11.5 seasons the
    // econ-bench walk puts **36 of 36** careers inside it – so the never-column was 0/0 and its
    // «worst $0» was vacuously true. A measurement with an empty denominator is not a measurement,
    // and finding 3.2 is the constraint the whole item lives under, so the claim is made here
    // instead, where it does not depend on which careers a corpus happens to produce:
    //
    // for EVERY rung, EVERY age band, EVERY cent of every rate band, at EVERY rank outside the
    // table, the banded rate is the rate. Not close – the same integer.
    const ranks = [101, 150, 200, 564, 1000, null]
    const ages = [12, 14, 16, 17, 19, 22, 23, 28]
    // ⚠ THE FOUR HIRED RUNGS AND NOT `self`, AND THE REASON IS A REAL EDGE THIS SWEEP FOUND IN
    // `bandedRateCents` ITSELF, not a convenience. Its `Math.max(0, rate − court)` floor means a rate
    // BELOW its own court comes back as the court, and the bottom of the `self` band is below the
    // MIDDLE of the `self` band, which is what `facilityRateCents` returns. No caller can produce
    // that pair – a self-coached family passes `facilityRateCents(age, 'self')` itself, which is the
    // court exactly, and every hired rung's band low is above its own court (asserted over the whole
    // table in tests/split-the-bill.test.ts, and it is the constraint that pins `courtTierFactor`).
    // So the sweep runs the domain the engine can actually reach, and the `self` case is asserted
    // below at the one argument it is ever called with.
    const hired = ['budget', 'middle', 'high', 'elite'] as const
    let checked = 0
    for (const tier of hired) {
      for (const age of ages) {
        const [lo, hi] = coachRateBandCents(tier, age)
        for (const rate of [lo, Math.round((lo + hi) / 2), hi]) {
          for (const rank of ranks) {
            expect(bandedRateCents(rate, age, tier, coachRetainerBand(rank)), `${tier}/${age}/${rate}/${String(rank)}`).toBe(rate)
            checked++
          }
        }
      }
    }
    expect(checked, 'the sweep must actually have swept').toBe(hired.length * ages.length * 3 * ranks.length)
    // The self-coached family, at the one rate the till ever hands this function – and at EVERY
    // rank, inside the band as well as outside it. A parent who works free does not get dearer
    // because her daughter reached the top ten; there is no labour on that line to multiply.
    for (const age of ages) {
      const court = facilityRateCents(age, 'self')
      for (const rank of [...ranks, 1, 5, 10, 60, 100]) {
        expect(bandedRateCents(court, age, 'self', coachRetainerBand(rank)), `self/${age}/${String(rank)}`).toBe(court)
      }
    }
    // …and the mirror, so the sweep above cannot be passing because `bandedRateCents` is the identity
    // for everybody: inside the band it is NOT the rate, at every rung that hires a man.
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      const [, hi] = coachRateBandCents(tier, 19)
      expect(bandedRateCents(hi, 19, tier, coachRetainerBand(5))).toBeGreaterThan(hi)
      expect(bandedRateCents(hi, 19, tier, coachRetainerBand(60))).toBeGreaterThan(hi)
    }
  })

  it('⭐ …and the market DOES re-price for a career the band does reach', () => {
    // The mirror of the arm above, and the reason it is honest: if the roster were simply frozen,
    // the previous assertion would pass for the wrong reason.
    const ten = atRank(proCareer('r42-19-below'), 5)
    const none = proCareer('r42-19-below')
    const tenRows = toSnapshot(ten).coachMarket.map((r) => r.weeklyCents)
    const noneRows = toSnapshot(none).coachMarket.map((r) => r.weeklyCents)
    expect(tenRows).not.toEqual(noneRows)
    for (let i = 0; i < tenRows.length; i++) expect(tenRows[i]).toBeGreaterThan(noneRows[i])
  })
})

// =================================================================================================
// 3 – THE VISUAL SWEEP (his standing rule of 14.09), at the wave gate's parity widths
// =================================================================================================
//
// ⚠ WHAT THIS CAN AND CANNOT PROVE, said out loud, exactly as round 42 #23 says it: happy-dom has no
// layout engine, so `fits.ts` COMPUTES the boxes off the real cascade with a fitted glyph advance
// and is a FLOOR – it under-counts. A red verdict is always true; a green one says the row is not
// close. It is not a screenshot, and it is the instrument this repo gates on.
describe('round 42 #19 – the bigger figure still fits the screens that draw it', () => {
  const WIDE_900: Viewport = { width: 900, height: 1024 }
  const SWEEP: Viewport[] = [PHONE, TABLET, WIDE_900, DESKTOP]

  for (const vp of SWEEP) {
    it(`⭐ the payroll row holds a top-ten retainer at ${vp.width}x${vp.height}`, async () => {
      // ⚠ setViewport BEFORE the mount – a media query is evaluated on an element's FIRST
      // computed-style read and then cached (fits.ts's own trap).
      setViewport(vp)
      const world = atRank(proCareer(`r42-19-fit-${vp.width}`), 1)
      const wrapper = await mountMarket(toSnapshot(world))

      const rows = wrapper.findAll('.budget-seat')
      expect(rows.length, 'the coach at least').toBeGreaterThan(0)
      for (const row of rows) {
        const name = row.find('.seat-name').element
        const cost = row.find('.seat-cost').element
        assertInlineRowFits(row.element, [name, cost], vp, `the ${row.attributes('data-seat')} seat row at the top of the table`)
      }
      wrapper.unmount()
      document.body.innerHTML = ''
    })
  }
})
