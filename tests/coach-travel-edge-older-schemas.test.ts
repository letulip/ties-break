// THE FROZEN CAREERS, THE RUNGS BELOW – v61 down to v57 (the title, corrected 18.09: P5/v49's rungs left for -deepest-schemas at the third cut).
//
// ⚠ THE BOTTOM OF ONE LADDER, NOT A SECOND ONE (the file list, corrected 18.09 at the fourth
// cut). tests/coach-travel-edge.test.ts holds the live hashes; -recent-schemas holds v82 – v77,
// -prior-schemas v76 – v71, -mid-schemas v69 – v62, this file v61 – v57, and -deepest-schemas
// v56 down to P5/v49. All of them read the same `careerHashAtSchema` out of
// tests/coachTravelEdgeFixtures.ts, where the eighteen constants, the walk and the per-key protocol
// live, and all of them carry the ORIGINAL describe name deliberately unchanged – a chain is only
// append-only if every rung below the top still reproduces, and these five are five of those rungs.
//
// ⚠ WHY THERE IS MORE THAN ONE FILE – the 62,889 ms CI stall with all 43 tests green, the
// measurement that put 98.5 % of the cost in ONE describe, and why cutting the behaviour off it
// would not have been enough – is in the fixtures module's header; the 12.09 cut that made the
// third file is in tests/coach-travel-edge-mid-schemas.test.ts's. Nothing was trimmed on the way
// across either one: same walk, same 156 weeks, same constants, same test names.
//
// ⚠ AND THIS FILE WAS THE NEXT ONE TO CROSS – FULFILLED at the third cut (16.09):
// -deepest-schemas is the file this paragraph priced, five rungs each, ~10 s a file, exactly as
// computed below. Kept as the record of a prediction that held.
// It was not cut on 12.09 because it did not need to be – 19.47 / 19.48 / 19.80 s solo across three
// runs, which is 43.6 s at this ladder's 2.24x, 73 % of birpc's window and a 1.38x stretch from it.
// It has ten cases at ~1.95 s each and no describe left to move, so the cut, when it comes, is the
// same arithmetic seam the mid file was born from: five rungs each, ~10 s a file. Do that before
// trimming a walk from any of them.

import { describe, it, expect } from 'vitest'
import {
  careerHashAtSchema,
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
})
