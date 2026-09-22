// WAVE 10 – THE WALKER ANSWERS THE RETIREMENT OFFER, AND THE ETERNAL JUNIOR GETS HER ENDING.
//
// The finding (the architect's review, 22.09, owner's «сделай в этой же волне»): a probe found
// three MANAGED careers sitting on junior rungs to age ~44 with no ending ever firing. Read out,
// the product was clean – `retirementDue` fires on AGE from `ENDINGS.askFromAgeYears`, track-free,
// the offer is a real STOP (`stops.add('retirement')`), and the final offer has one legal answer –
// but `tools/econ-bench.ts`'s walker never answered it, so NO bench career could end naturally and
// every corpus ending in that file's history is an injury, a bankruptcy, a college or a leaving.
// The fix is `Policy.answerRetirementOffers`, an OPT-IN («one more year» until the offer is final,
// then taken), absent on every historical arm so their published numbers keep reproducing.
//
// ⚠ EVERY CAREER HERE IS LIVED through the walker under test – the same `openCareer` +
// `stepCareerWeek` discipline as wave10-handover, on the finding's own cells.
//
// MUTATION-VERIFIED 22.09 (applied, RUN, reverted): the step's answer clause deleted → §A red both
// cases (cap reached, ending null); `offer.final` hardened to `true` (retire on the FIRST ask) →
// §A red on the ending's age – she would stop at 29 when the walk's own arithmetic says the final
// share arrives years later; §B is the arm that pins the DEFAULT unchanged.
import { describe, expect, it } from 'vitest'
import { dynastyBackgroundOf, dynastyHandoverOf } from '../src/engine/world'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, type Policy } from '../tools/econ-bench'

const CAP = 1600

function walk(presetIndex: number, seedIndex: number, policy: Policy, cap = CAP) {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, policy)
  let weeks = 0
  while (world.ending === null && weeks < cap) {
    stepCareerWeek(world, rng, policy)
    weeks += 1
  }
  return { world, weeks }
}

const ANSWERING: Policy = { ...POLICIES[1], answerRetirementOffers: true }

describe('wave 10 – the walker takes the door the engine was holding open', () => {
  it('⭐⭐⭐ the eternal junior ends NATURALLY now – the finding\'s own cell, closed end to end', () => {
    // p5/i1 under the managed policy is the probe's stuck career: junior rungs only, $0, no ending
    // in 1600 weeks. With the offer answered she gets the same door as everyone – age asks from 29,
    // «one more year» while it is a question, the final offer taken.
    const { world, weeks } = walk(5, 1, ANSWERING)
    expect(world.ending, `she has an ending now (${weeks} weeks)`).not.toBe(null)
    expect(weeks, 'inside the cap the probe could not close her under').toBeLessThan(CAP)
    expect(world.ending!.type, 'the natural machinery, not a crash').toBe('natural')
    // ⚠ THE PATIENT-PLAYER SHAPE, PINNED: «one more year» while it is a question. A walker that
    // retired on the FIRST ask would end her around week 800 with the count at zero – both bounds
    // exist for exactly that mutation, and both are loose enough to survive a share re-tune
    // (measured: week 1506, count 15).
    expect(weeks, 'she does not stop on the first ask').toBeGreaterThan(900)
    expect(world.oneMoreYearCount, 'the ordinary offers were answered, not skipped').toBeGreaterThan(0)
    // ...and the dynasty door reads her honestly: a junior story, a working home, no pro claims.
    const block = dynastyHandoverOf(world)
    expect(block.motherCareer.bestRank, 'a junior rank is not a WTA rank').toBe(null)
    expect(block.motherCareer.proTitles).toBe(0)
    expect(dynastyBackgroundOf(world.kidFundsCents)).toBe('working')
  })

  it('⭐⭐ ...and a pro career that used to hit the cap ends naturally too', () => {
    // p3/i1: the probe read it wealthy at the 1600-week cut. The offer answered, the career closes
    // on its own age instead of on the bench's belt.
    const { world, weeks } = walk(3, 1, ANSWERING)
    expect(world.ending, `ended (${weeks} weeks)`).not.toBe(null)
    expect(weeks).toBeLessThan(CAP)
    expect(['natural', 'plateau', 'injury']).toContain(world.ending!.type)
  })

  it('⭐⭐ §B – the historical arms are UNTOUCHED: the default walker still ignores the offer', () => {
    // The reproducibility pin, walked rather than read off a constant: under the plain managed
    // policy the same cell reaches offer age with the offer PENDING and no ending – which is
    // exactly the pre-fix behaviour every published bench number was measured under. 900 weeks is
    // age ~30: past `askFromAgeYears`, one ask at least, nowhere near the cap.
    const { world } = walk(5, 1, POLICIES[1], 900)
    expect(world.ending, 'no ending – the belt is doing the ending\'s job').toBe(null)
    expect(world.retirementOffer, 'the offer sits unanswered, as it always has on this arm').not.toBe(null)
  })
})
