// THE FROZEN CAREERS, THE RUNGS BELOW – v61 down to P5/v49.
//
// ⚠ THE OTHER HALF OF ONE LADDER, NOT A SECOND ONE. tests/coach-travel-edge.test.ts holds the live
// hashes and v62 – v67; this file holds every rung beneath them. Both read the same
// `careerHashAtSchema` out of tests/coachTravelEdgeFixtures.ts, where the eighteen constants, the
// walk and the per-key protocol live, and both carry the ORIGINAL describe name deliberately
// unchanged – a chain is only append-only if every rung below the top still reproduces, and these
// ten are those rungs.
//
// ⚠ WHY THERE ARE THREE FILES – the 62,889 ms CI stall with all 43 tests green, the measurement
// that put 98.5 % of the cost in ONE describe, and why cutting the behaviour off it would not have
// been enough – is in the fixtures module's header. Nothing was trimmed on the way across: same
// walk, same 156 weeks, same constants, same test names.

import { describe, it, expect } from 'vitest'
import {
  careerHashAtSchema,
  PRE_V50,
  PRE_V51,
  PRE_V52,
  PRE_V55,
  PRE_V56,
  PRE_V57,
  PRE_V58,
  PRE_V59,
  PRE_V60,
  PRE_V61,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
  it('⭐⭐ v61: rolling ONLY the schema back to 60 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 26 #2's SECOND PASS DID TO THESE THREE CAREERS, as an identity – and
    // v61 is the first version here that REMOVES a field (`CollegeQuote.open`) rather than adding
    // one, so what this asks is whether the removed field ever lived in an ordinary tour career. It
    // did not: it is nested inside `fork.offer.quotes`, week 156 is 32 weeks short of the fork, and
    // `walkFrozenCareer` asserts `world.fork === null` rather than assuming it. If the deletion, the
    // migration or `answerFork`'s new cheapest-place lookup had reached a career that never went to
    // college, THIS case would be red beside the freeze.
    // ⚠ NO KEY IS DROPPED HERE, exactly as in v60's rollback and for the same reason: the field that
    // moved is nested, so the top-level serialisation is unchanged.
    expect(careerHashAtSchema(5, 0, 60), '25k · middle coach · grinder').toBe(PRE_V61.middleGrinder)
    expect(careerHashAtSchema(8, 0, 60), '120k · elite coach · grinder').toBe(PRE_V61.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 60), '8k · self-coached · player').toBe(PRE_V61.selfTravelling)
  })

  it('⭐⭐ v60: rolling ONLY the schema back to 59 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 26 #6 DID TO THESE THREE CAREERS, as an identity. The championship's
    // reveal, the year's pause on it and the amateur `pendingView` arm all live behind a college
    // state that is null here and a latch these careers never wear – asserted in `walkFrozenCareer`,
    // not assumed. If the pause, the entry guard or the new snapshot arm had leaked into an ordinary
    // 156-week tour career, THIS case would be red beside the freeze, which is the one signal a
    // whole-world hash cannot otherwise give.
    // ⚠ NO KEY IS DROPPED HERE, unlike v59's rollback: v60's field is nested inside `CollegeState`.
    expect(careerHashAtSchema(5, 0, 59), '25k · middle coach · grinder').toBe(PRE_V60.middleGrinder)
    expect(careerHashAtSchema(8, 0, 59), '120k · elite coach · grinder').toBe(PRE_V60.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 59), '8k · self-coached · player').toBe(PRE_V60.selfTravelling)
  })

  it('⭐⭐ v59: rolling the schema back to 58 – and dropping the keys v59 added – reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE MASSEUR DID TO THESE THREE CAREERS, as an identity. The hire is
    // pro-career gated and no bench policy takes it, so `masseurHired` is false here (asserted in
    // `walkFrozenCareer`) and every effect sits behind `masseurWorksThisWeek`, which a false flag
    // shuts – step 2's dial and stance included: the rung bill and cadence need the hire, the fare
    // and the tour relief need the stance, and both stand on their written defaults (also asserted
    // there). If the salary, the condition bonus, the rehab cadence, the fare or the relief had
    // leaked into a career that never hired him, THIS case would be red beside the freeze – the one
    // signal a whole-world hash cannot otherwise give. Unlike every earlier rollback this drops
    // KEYS as well as a number, because v59 added three: see `careerHashAtSchema`.
    expect(careerHashAtSchema(5, 0, 58), '25k · middle coach · grinder').toBe(PRE_V59.middleGrinder)
    expect(careerHashAtSchema(8, 0, 58), '120k · elite coach · grinder').toBe(PRE_V59.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 58), '8k · self-coached · player').toBe(PRE_V59.selfTravelling)
  })

  it('⭐⭐ v58: rolling ONLY the schema back to 57 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 24 #5 DID TO THESE THREE CAREERS, as an identity. The ask moved to
    // `schoolEndWeek` – week 242 for these careers, 86 weeks past this freeze's horizon (the old
    // birthday ask was ≈283) – so the fork is still never raised here (`walkFrozenCareer` asserts
    // it), no reservation is written and the departure step returns at its first guard every week.
    // If the earlier ask, the hold or the departure had leaked into an ordinary 156-week career,
    // THIS case would be red beside the freeze – the one signal a whole-world hash cannot give.
    expect(careerHashAtSchema(5, 0, 57), '25k · middle coach · grinder').toBe(PRE_V58.middleGrinder)
    expect(careerHashAtSchema(8, 0, 57), '120k · elite coach · grinder').toBe(PRE_V58.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 57), '8k · self-coached · player').toBe(PRE_V58.selfTravelling)
  })

  it('⭐⭐ v57: rolling ONLY the schema back to 56 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE COLLEGE BIRTHDAY DID TO THESE THREE CAREERS, as an identity. The pause,
    // the persisted year-opening and the opened guard all live behind a college state that is null
    // here and a latch these careers never wear – asserted in `walkFrozenCareer`, not assumed. The
    // three TOUR birthdays inside each career are the case this wave was most required not to move,
    // and if any of `pendingBirthday`'s, `chooseGift`'s or `markBirthday`'s tour behaviour had
    // shifted one byte, THIS case would be red beside the freeze – which is the one signal a
    // whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 56), '25k · middle coach · grinder').toBe(PRE_V57.middleGrinder)
    expect(careerHashAtSchema(8, 0, 56), '120k · elite coach · grinder').toBe(PRE_V57.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 56), '8k · self-coached · player').toBe(PRE_V57.selfTravelling)
  })

  it('⭐⭐ v56: rolling ONLY the schema back to 55 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 24'S STUDENT CHAMPIONSHIP DID TO THESE THREE CAREERS, as an identity.
    // The fixture fires on `COLLEGE_LEAGUE.seasonWeek` inside the college freeze and the earned
    // call-up reads a field that only exists there, so neither is reachable at week 156 – asserted in
    // `walkFrozenCareer`, not assumed. If either had leaked into an ordinary career, THIS case would
    // be red beside the freeze, which is the one signal a whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 55), '25k · middle coach · grinder').toBe(PRE_V56.middleGrinder)
    expect(careerHashAtSchema(8, 0, 55), '120k · elite coach · grinder').toBe(PRE_V56.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 55), '8k · self-coached · player').toBe(PRE_V56.selfTravelling)
  })

  it('⭐⭐ v55: rolling ONLY the schema back to 54 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 24'S FREEZE FIXES DID TO THESE THREE CAREERS, as an identity. The
    // three rules – the entry release at the fork, `resumeFromCollege`'s refusal on an open reveal,
    // and `tickWeek`'s `inCollege` gate – all live inside the college freeze, and `walkFrozenCareer`
    // asserts below that neither `world.fork` nor `world.college` is reachable at week 156. If any of
    // them had leaked into an ordinary career, THIS case would be red beside the freeze, which is the
    // one signal a whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 54), '25k · middle coach · grinder').toBe(PRE_V55.middleGrinder)
    expect(careerHashAtSchema(8, 0, 54), '120k · elite coach · grinder').toBe(PRE_V55.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 54), '8k · self-coached · player').toBe(PRE_V55.selfTravelling)
  })

  it('⭐⭐ v52: rolling ONLY the schema back to 51 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE COLLEGE CHOICE DID TO THESE THREE CAREERS, as an identity. All three
    // freeze hashes moved and all three roll back exactly, so the change is one number and not three
    // different careers. If the new `ForkState.offer` shape or the college match-play term had
    // reached any of these worlds, this case would be red beside the freeze.
    expect(careerHashAtSchema(5, 0, 51), '25k · middle coach · grinder').toBe(PRE_V52.middleGrinder)
    expect(careerHashAtSchema(8, 0, 51), '120k · elite coach · grinder').toBe(PRE_V52.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 51), '8k · self-coached · player').toBe(PRE_V52.selfTravelling)
  })

  it('⭐⭐ v51: rolling ONLY the schema back to 50 reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THIS WAVE DID TO THESE THREE CAREERS, as an identity. All three freeze
    // hashes moved, which on any previous wave would have meant three different careers; here it
    // means one different number. If v51's offer or its tuition line had reached any of these worlds,
    // this case would be red beside the freeze – which is the one signal a whole-world hash cannot
    // otherwise give.
    expect(careerHashAtSchema(5, 0, 50), '25k · middle coach · grinder').toBe(PRE_V51.middleGrinder)
    expect(careerHashAtSchema(8, 0, 50), '120k · elite coach · grinder').toBe(PRE_V51.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 50), '8k · self-coached · player').toBe(PRE_V51.selfTravelling)
  })

  it('⭐⭐ P5: rolling ONLY the schema back to 49 reproduces the old hashes byte for byte', () => {
    // The per-key diff, as an identity rather than a comparison. If P5 had reached any of these
    // careers through anything but `SAVE_SCHEMA_VERSION`, this would be red – and it would be red
    // beside a green freeze, which is precisely the signal a whole-world hash cannot otherwise give.
    expect(careerHashAtSchema(5, 0, 49), '25k · middle coach · grinder').toBe(PRE_V50.middleGrinder)
    expect(careerHashAtSchema(8, 0, 49), '120k · elite coach · grinder').toBe(PRE_V50.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 49), '8k · self-coached · player').toBe(PRE_V50.selfTravelling)
  })
})
