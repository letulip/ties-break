// THE FROZEN CAREERS, THE DEEPEST RUNGS – v56 down to P5/v49.
//
// ⚠ WHY THIS FILE EXISTS: birpc, for the third time in this family. Its parent
// (tests/coach-travel-edge-older-schemas.test.ts) measured **57 s** on round 42's two-core PR runner
// against birpc's unraisable 60 s window – it passed, with three seconds of margin, which is a coin
// and not a margin. Its own header had already computed this seam before the pressure arrived:
// «five rungs each, ~10 s a file». This is those five. Nothing was trimmed: same walk, same
// 156 weeks, same constants, same test names, same describe name.
//
// ⚠⚠ AND THE OPEN QUESTION ABOVE THIS CUT IS THE ONE WORTH READING FIRST (round 42, 16.09). These
// deep rungs isolate exactly one thing – the key-set difference between rung N and N−1 – which is a
// property of the MIGRATION DEFINITIONS and not of the engine: an engine change moves the live hash
// and every rung together, so the live pin already catches it. What they uniquely catch is somebody
// EDITING A SHIPPED MIGRATION, and nothing else in this repo catches that mechanically
// (`goldenSaves` proves the forward direction, `migrations.test.ts` tests steps in isolation,
// `scripts/schema-ladder.mjs` only compares version numbers against main and is not in `check`).
// ⭐ So they are load-bearing today and they are the wrong instrument for the job: a pin over the
// shipped migration bodies would make the same claim in milliseconds, and deriving the peel list
// FROM the migration would make the coupling a construction instead of a 57-second proof. That is a
// design decision for the owner; until he rules it, do not delete a rung.
import { describe, it, expect } from 'vitest'
import {
  careerHashAtSchema,
  PRE_V50,
  PRE_V51,
  PRE_V52,
  PRE_V55,
  PRE_V56,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {

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
