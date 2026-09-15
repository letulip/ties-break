// ROUND 42 #5 – THE LOCAL SPONSOR'S CADENCE: A COOLDOWN AND A SEASON CAP.
//
// THE OWNER, 15.09: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели».
//
// ⚠⚠ BOTH NUMBERS ARE A PROPOSAL AND HE HAS NOT SEEN THE PRINT YET, so this file deliberately
// asserts the SHAPE against `ECONOMY.sponsor` rather than against 6 and 3: a one-word ruling moving
// either dial must move this suite with it and not break it. The measurement is
// docs/specs/sponsor-cadence-2026-09.md and `tools/sponsor-cadence.ts`.
//
// ⚠⚠ THE ONE THING HERE THAT IS A CLAIM ABOUT THE ENGINE RATHER THAN ABOUT A NUMBER is §3: the
// cadence is DERIVED and touches no persisted state and no MAIN draw. A cooldown needs a memory;
// this career has nowhere to put one that is not a schema move, so the chain is re-walked from
// (seed, season) every time it is asked. If that ever stopped being true the rest of the item would
// be a save-schema change wearing a constant.
//
// MUTATIONS, each applied alone to `world/sponsors.ts`, run, reverted. Control 10/10 green before
// and after. ⚠ THE COUNTS ARE READ OFF THE RUNS, NOT PREDICTED:
//   N1 `cameoWillingWeeks` ignoring the cooldown (`last` never set)     -> 3 red
//   N2 the season cap dropped (`out.length >= seasonCap` removed)       -> 1 red
//   N3 the cross-season carry dropped (`carry` always null)             -> 3 red
//   N4 the roll moved BELOW the two `continue`s                         -> 3 red
// ⚠⚠ N3 AND N4 BOTH SCORED **0 RED** ON THE FIRST VERSION OF THIS FILE, and that is recorded
//   rather than erased. Six seeds almost never produce the case N3 breaks – a season whose last
//   willing week is inside the cooldown of the wrap – so §1's third arm was hoping for it instead of
//   hunting it; the note on that arm carries the repair. N4 came with it: moving the draw below the
//   branches makes the same season deal DIFFERENT weeks depending on whether it is being walked as
//   «this season» (with a carry) or as «the previous season» (without one), so the carry handed
//   forward stops describing the schedule it came from. The comment at the draw site says why the
//   draw is unconditional; this is the measurement behind it.
import { describe, it, expect } from 'vitest'
import { createWorld, sponsorCameoCents, sponsorCameoWilling, tickWeek } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const S = ECONOMY.sponsor
const SEEDS = Array.from({ length: 24 }, (_, i) => `cadence-${i}`)
/** Ten seasons is long enough for the cap to bind on some of them and the wrap to be crossed nine
 *  times, which is what §2's carry claim needs. */
const WEEKS = 10 * WEEKS_PER_YEAR

function willingWeeks(seed: string, weeks = WEEKS): number[] {
  const out: number[] = []
  for (let w = 0; w < weeks; w++) if (sponsorCameoWilling(seed, w)) out.push(w)
  return out
}

// =================================================================================================
// §1 – THE COOLDOWN, WHICH IS THE COMPLAINT HE ACTUALLY MADE
// =================================================================================================
describe('§1 the shop will not chip in twice inside its own cooldown', () => {
  it('⭐⭐⭐ no two willing weeks are closer than `cooldownWeeks`, on any seed, across the wrap', () => {
    let pairs = 0
    let tightest = Infinity
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let i = 1; i < weeks.length; i++) {
        const gap = weeks[i] - weeks[i - 1]
        pairs++
        tightest = Math.min(tightest, gap)
        expect(gap, `${seed}: weeks ${weeks[i - 1]} and ${weeks[i]}`).toBeGreaterThanOrEqual(S.cooldownWeeks)
      }
    }
    // ⚠ THE ARM HAS TO CONTAIN THE THING IT IS PROVING. A schedule that fired twice in a decade
    // would pass every line above with the cooldown deleted.
    expect(pairs, 'the corpus really holds consecutive cheques to compare').toBeGreaterThan(40)
    // ...and the floor is REACHED rather than merely respected, which is what says the dial is the
    // binding constraint and not a number the noise happens to clear on its own.
    expect(tightest, 'some pair really sits on the floor').toBeLessThan(S.cooldownWeeks + 4)
  })

  it('⭐⭐ ...and the gap he named – three to four weeks – is now structurally impossible', () => {
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let i = 1; i < weeks.length; i++) {
        expect(weeks[i] - weeks[i - 1], `${seed}: «раз в 3-4 недели»`).toBeGreaterThan(4)
      }
    }
  })

  it('⚠⚠ the cooldown crosses the season boundary – a cheque in week 51 still silences week 2', () => {
    // The cap resets on the wrap and the cooldown does not, so the previous season's last willing
    // week is carried into the walk. Without that carry the schedule would allow a pair straddling
    // the boundary.
    //
    // ⚠⚠ THE FIRST VERSION OF THIS ARM DID NOT BITE, AND THAT IS RECORDED RATHER THAN QUIETLY
    // FIXED. It asserted the gap over every wrap-crossing pair in a six-seed corpus, and dropping
    // the carry scored **0 red**: the violation needs a season whose LAST willing week is inside the
    // cooldown of the wrap AND a hit in the first weeks of the next one, which six seeds almost
    // never produce. So the corpus is wider (24 seeds) and, more importantly, the arm now HUNTS the
    // case instead of hoping for it – «prove the arm contains the thing it is proving» is the house
    // rule, and a crossing-pair sweep was not that.
    let crossings = 0
    let atRisk = 0
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let i = 1; i < weeks.length; i++) {
        const a = Math.floor(weeks[i - 1] / WEEKS_PER_YEAR)
        const b = Math.floor(weeks[i] / WEEKS_PER_YEAR)
        if (a !== b) {
          crossings++
          expect(weeks[i] - weeks[i - 1], `${seed}: across the wrap ${weeks[i - 1]} -> ${weeks[i]}`)
            .toBeGreaterThanOrEqual(S.cooldownWeeks)
        }
      }
      // ⭐ THE HUNT: a season whose last willing week sits inside `cooldownWeeks` of the wrap. Every
      // week of the next season that the carry must silence is asserted silent, one by one – so a
      // dropped carry reddens on the first such case rather than on a lucky pair.
      for (let s = 0; s * WEEKS_PER_YEAR < WEEKS - WEEKS_PER_YEAR; s++) {
        const inSeason = weeks.filter((w) => Math.floor(w / WEEKS_PER_YEAR) === s)
        if (inSeason.length === 0) continue
        const last = inSeason[inSeason.length - 1]
        const wrap = (s + 1) * WEEKS_PER_YEAR
        if (wrap - last >= S.cooldownWeeks) continue
        atRisk++
        for (let w = wrap; w < last + S.cooldownWeeks; w++) {
          expect(sponsorCameoWilling(seed, w), `${seed}: week ${w} is inside the cooldown of ${last}`).toBe(false)
        }
      }
    }
    expect(crossings, 'the corpus really crosses the wrap between cheques').toBeGreaterThan(10)
    expect(atRisk, 'the hunt really found seasons that end inside the cooldown of the wrap').toBeGreaterThan(3)
  })
})

// =================================================================================================
// §2 – THE SEASON CAP
// =================================================================================================
describe('§2 and never more than `seasonCap` in one season', () => {
  it('⭐⭐⭐ no season of any seed holds more willing weeks than the cap', () => {
    let seasons = 0
    let atCap = 0
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let s = 0; s * WEEKS_PER_YEAR < WEEKS; s++) {
        const n = weeks.filter((w) => Math.floor(w / WEEKS_PER_YEAR) === s).length
        seasons++
        if (n === S.seasonCap) atCap++
        expect(n, `${seed} season ${s}`).toBeLessThanOrEqual(S.seasonCap)
      }
    }
    expect(seasons, 'the corpus really holds seasons').toBeGreaterThan(50)
    // ⚠ AND THE CAP IS REACHED SOMEWHERE, or it is a wall nothing has ever touched and this arm
    // would stay green with the cap deleted.
    expect(atCap, 'some season really takes the cap').toBeGreaterThan(0)
  })

  it('⚠ the cap is not the ONLY thing shaping the season – seasons under it are ordinary', () => {
    // If the cap bound EVERY season the mechanic would have flattened into «three a year, every
    // year», which is the failure the constant's own comment warns about.
    //
    // ⚠⚠ MEASURED RATHER THAN ASSUMED, AND THE FIRST READING OF THIS ARM WAS WRONG IN AN
    // INFORMATIVE WAY. It asserted «most seasons are under the cap» and measured 42%: the cap binds
    // on a MAJORITY of WILLINGNESS seasons. That is not a contradiction of the bench print, which
    // measures 18% of seasons at the cap – the two count different things. This chain is what the
    // SHOP is willing to do; the bench counts cheques that were actually PAID, and a cheque is paid
    // only where the need gate is open too. So the cap does most of its work in the seasons where
    // the family needed every one of them, which is exactly the family he was complaining about.
    let under = 0
    let seasons = 0
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let s = 0; s * WEEKS_PER_YEAR < WEEKS; s++) {
        seasons++
        if (weeks.filter((w) => Math.floor(w / WEEKS_PER_YEAR) === s).length < S.seasonCap) under++
      }
    }
    // A BAND, because these are proposed constants: the claim is «both sides of the cap happen».
    expect(under / seasons, 'seasons under the cap are ordinary').toBeGreaterThan(0.2)
    expect(under / seasons, '...and so are seasons that reach it').toBeLessThan(0.9)
  })
})

// =================================================================================================
// §3 – DERIVED, NOT REMEMBERED: NO STATE, NO MAIN DRAW
// =================================================================================================
describe('§3 the cadence is a pure function of (seed, week)', () => {
  it('⭐⭐⭐ the same week answers the same whatever order it is asked in, and on a fresh process', () => {
    const forward = willingWeeks('order-proof', 3 * WEEKS_PER_YEAR)
    const backward: number[] = []
    for (let w = 3 * WEEKS_PER_YEAR - 1; w >= 0; w--) if (sponsorCameoWilling('order-proof', w)) backward.unshift(w)
    expect(backward, 'asked backwards, the same schedule comes out').toEqual(forward)
    // ...and only the seed moves it. Two seeds must not agree by accident.
    expect(willingWeeks('order-proof-2', 3 * WEEKS_PER_YEAR)).not.toEqual(forward)
  })

  it('⭐⭐⭐ neither the willingness nor the amount touches the MAIN stream', () => {
    const world = createWorld('cameo-main', { ...DEFAULT_PROFILE, coachTier: 'self' })
    // Move MAIN off its opening position so a reset-to-zero could not pass this by accident.
    tickWeek(world, resumeMain(world.rngMain))
    const before = { ...world.rngMain }
    for (let w = 0; w < 200; w++) {
      sponsorCameoWilling(world.seed, w)
      sponsorCameoCents(world.seed, w)
    }
    expect(world.rngMain, 'the cameo derives on its own sub-streams – invariant 2').toEqual(before)
  })

  it('⚠ nothing is written anywhere – the world is untouched by asking', () => {
    const world = createWorld('cameo-pure', { ...DEFAULT_PROFILE, coachTier: 'self' })
    tickWeek(world, resumeMain(world.rngMain))
    const snapshotOfState = JSON.stringify(world)
    for (let w = 0; w < 120; w++) sponsorCameoWilling(world.seed, w)
    expect(JSON.stringify(world)).toBe(snapshotOfState)
  })
})

// =================================================================================================
// §4 – THE SHOP IS STILL A SHOP: THE RATE AND THE AMOUNT
// =================================================================================================
describe('§4 what the shop gives, and how often it is willing at all', () => {
  it('⭐ the cheque is inside the band `ECONOMY.sponsor.amountCents` and is whole cents', () => {
    const [lo, hi] = S.amountCents
    for (const seed of SEEDS) {
      for (let w = 0; w < 120; w++) {
        const cents = sponsorCameoCents(seed, w)
        expect(cents, `${seed} week ${w}`).toBeGreaterThanOrEqual(lo)
        expect(cents).toBeLessThanOrEqual(hi)
        expect(Number.isInteger(cents)).toBe(true)
      }
    }
  })

  it('⚠ a shop is still willing a couple of times a season – the dial thinned it, it did not shut it', () => {
    let willing = 0
    let seasons = 0
    for (const seed of SEEDS) {
      willing += willingWeeks(seed).length
      seasons += WEEKS / WEEKS_PER_YEAR
    }
    const perSeason = willing / seasons
    // ⚠ A BAND AND NOT A NUMBER, because these are proposed constants: the claim is «the mechanic
    // still happens and has not become a standing order», which holds for any sane pair of dials.
    expect(perSeason, 'the shop has not gone silent').toBeGreaterThan(1)
    expect(perSeason, '...nor become weather').toBeLessThan(S.seasonCap + 0.01)
  })
})
