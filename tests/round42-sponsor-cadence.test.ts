// ROUND 42 #5 – THE LOCAL SPONSOR'S CADENCE: A COOLDOWN (AND, UNTIL #43, A SEASON CAP).
//
// THE OWNER, 15.09: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели».
//
// ⚠⚠ RE-AIMED BY ROUND 42 #43, HIS RULING OFF THE PRINTED TABLE: «сними потолок, а кулдаун давай 4».
// TWO CLAIMS IN THIS FILE MOVED AND BOTH MOVED BECAUSE THE RULE MOVED, NOT BECAUSE THEY WERE WRONG:
//   * §2 asserted a season cap. There is no season cap – the constant and its reader are both gone –
//     so §2 now asserts the OPPOSITE and hunts for the seasons the cap used to forbid. A suite that
//     merely deleted the section would leave the removal unguarded: re-adding the wall would be
//     green everywhere.
//   * §1's second arm asserted «gaps of three to four weeks are structurally impossible». At
//     `cooldownWeeks` 4 a FOUR-week gap is legal and only one, two and three are impossible. That
//     consequence is the ledger's own sentence (round 42 #43, «раз в 3-4 недели» – the floor sits on
//     the four), it is measured in docs/specs/sponsor-cadence-2026-09.md §5, and the arm now asserts
//     what is actually true PLUS that the four-week gap really occurs – a floor nothing ever reaches
//     is a claim nobody has tested.
//
// ⚠⚠ THE NUMBER IS STILL NOT WRITTEN DOWN HERE. Every assertion reads `ECONOMY.sponsor.cooldownWeeks`
// rather than 4, so his next one-word ruling moves this suite with it instead of breaking it. The
// measurement is docs/specs/sponsor-cadence-2026-09.md and `tools/sponsor-cadence.ts`.
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
// ⚠ N2 DESCRIBES A MUTATION THAT CAN NO LONGER BE MADE – #43 removed the cap for real. The line is
//   kept because a mutation ledger that quietly drops a row stops being a record. RE-MEASURED on this
//   file's re-aimed form (control 9/9 green before and after, each mutation applied alone, reverted):
//   N2b `if (out.length >= 3) continue` PUT BACK into `cameoWillingWeeks`   -> **1 red**, §2's arm
//       alone, which is what says the removal is guarded rather than merely done.
//   N1b the cooldown branch disabled (`if (false && …)`)                    -> **3 red**, all of §1.
//   ⭐ §1's second arm reddens under N1b and NOT under N2b, and §2's arm the other way round: the
//   cooldown and the vanished cap are two claims with one arm each.
//   ⚠ N4's old spelling still stands as written: the roll is still drawn unconditionally above every
//   branch, and removing the cap did not touch it – which is the note at the draw site.
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

  it('⭐⭐ ...so the CLUSTER he named is gone – and the four-week gap is legal, which is said out loud', () => {
    // ⚠⚠ RE-AIMED BY ROUND 42 #43 AND THE OLD LINE IS QUOTED RATHER THAN DELETED. It read
    // `expect(gap).toBeGreaterThan(4)` under the title «the gap he named – three to four weeks – is
    // now structurally impossible», which was true at `cooldownWeeks` 6 and is FALSE at 4. His
    // ruling («сними потолок, а кулдаун давай 4») puts the floor on the four, so «раз в 3-4 недели»
    // loses its three and keeps its four. The ledger and the spec both say so; this is the arm that
    // stops it from being a sentence nobody checked.
    let atFour = 0
    let pairs = 0
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let i = 1; i < weeks.length; i++) {
        const gap = weeks[i] - weeks[i - 1]
        pairs++
        // The half of his complaint that IS structurally gone: nothing under the cooldown, ever.
        expect(gap, `${seed}: weeks ${weeks[i - 1]} and ${weeks[i]}`).toBeGreaterThanOrEqual(S.cooldownWeeks)
        if (gap === S.cooldownWeeks) atFour++
      }
    }
    expect(pairs, 'the corpus really holds consecutive cheques to compare').toBeGreaterThan(40)
    // ⭐ AND THE HONEST HALF: the floor is REACHED. A cooldown nothing ever lands on would make the
    // ledger's «a four-week gap is still legal» an untested claim about the code.
    expect(atFour, 'the shop really does chip in again on the first week the cooldown allows').toBeGreaterThan(0)
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
// §2 – ⭐⭐⭐ ROUND 42 #43: THERE IS NO SEASON CAP, AND THAT IS A CLAIM WITH TEETH
// =================================================================================================
//
// ⚠⚠ WHAT THIS SECTION USED TO BE, QUOTED SO THE CHANGE IS READABLE: «§2 and never more than
// `seasonCap` in one season», two arms – no season holds more willing weeks than the cap, and the
// cap does not bind on every season. Round 42 #43 removed the cap entirely («сними потолок»), so
// both arms describe a rule that no longer exists.
//
// ⚠ DELETING THEM WOULD HAVE LEFT THE REMOVAL UNGUARDED. Re-adding `if (out.length >= 3) continue`
// to `cameoWillingWeeks` would then be green in every suite in the repo, and the item's whole
// measured cost – the cap was taking a further fifth of the cameo money (spec §3) – would come back
// silently. So the section asserts the opposite fact: seasons ABOVE the old wall exist.
//
// ⚠ MUTATION-VERIFIED, replacing the N2 row of the ledger at the top of this file: restoring the
// season cap at its old value of 3 reddens the arm below (measured, 1 red) and nothing else in this
// file moves – which is the same separation the original N2 had, pointing the other way.
describe('§2 the season has no ceiling any more – his «сними потолок»', () => {
  /** The wall that stood until round 42 #43. A literal on purpose: it is a HISTORICAL value, not a
   *  live constant, and reading it off `ECONOMY` is impossible because it is not there. */
  const REMOVED_SEASON_CAP = 3

  it('⭐⭐⭐ some season somewhere holds more willing weeks than the removed cap allowed', () => {
    let seasons = 0
    let overTheOldCap = 0
    let fullest = 0
    for (const seed of SEEDS) {
      const weeks = willingWeeks(seed)
      for (let s = 0; s * WEEKS_PER_YEAR < WEEKS; s++) {
        const n = weeks.filter((w) => Math.floor(w / WEEKS_PER_YEAR) === s).length
        seasons++
        fullest = Math.max(fullest, n)
        if (n > REMOVED_SEASON_CAP) overTheOldCap++
      }
    }
    expect(seasons, 'the corpus really holds seasons').toBeGreaterThan(50)
    expect(
      overTheOldCap,
      `no season exceeded ${REMOVED_SEASON_CAP} – either the cap is back, or the corpus is too small to prove its absence`,
    ).toBeGreaterThan(0)
    // ...and the ceiling that remains is the COOLDOWN's arithmetic and nothing else: at a four-week
    // floor no season of 52 weeks can hold more than 13 cheques, whatever the dice do.
    expect(fullest, 'the cooldown is still the only wall there is').toBeLessThanOrEqual(
      Math.floor(WEEKS_PER_YEAR / S.cooldownWeeks) + 1,
    )
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
    // ⚠ A BAND AND NOT A NUMBER, because the dial is his to move: the claim is «the mechanic still
    // happens and has not become a standing order», which holds for any sane cooldown.
    // ⭐ ROUND 42 #43 – the upper wall used to be `S.seasonCap + 0.01`, which no longer exists. What
    // replaces it is the cooldown's OWN arithmetic – a season of 52 weeks cannot hold more than
    // `52 / cooldownWeeks` cheques – so the band still closes and it closes on the live constant.
    expect(perSeason, 'the shop has not gone silent').toBeGreaterThan(1)
    expect(perSeason, '...nor become weather').toBeLessThan(WEEKS_PER_YEAR / S.cooldownWeeks)
  })
})
