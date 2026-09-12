// THE v62 SWEEP – one of the three corpus walks `tests/goldenSaves.test.ts` used to make in one
// process. tests/goldenSavesCorpus.ts holds the fixture enumeration and the whole argument for why
// there are three files; the describe name below is the ORIGINAL one, so every full test name here
// is byte-identical to the name the single file produced.

import { describe, it, expect } from 'vitest'
import { migrateSave } from '../src/engine/migrations'
import { physicalMean, SKILL_CEILING_MAX } from '../src/engine/development'
import { FILES, load } from './goldenSavesCorpus'

describe('golden saves corpus', () => {
  // ⭐⭐⭐⭐ v62 – EVERY SAVE THIS GAME HAS EVER WRITTEN COMES BACK WITH A PEAK, AND IT IS AT LEAST THE
  // BODY IT IS CARRYING. `peakPhysical` (the long goodbye step 1) is a RUNNING MAXIMUM, so the one
  // thing that can never be true of it is that it sits below her current physical mean – a save that
  // loaded like that would tell step 2 she is at more than 100% of her own peak, i.e. that the
  // decline runs backwards. The v62 migration reconstructs the value rather than defaulting it, and
  // this is the corpus-scale check on that: sixty-three fixtures, every historical shape the ladder
  // has ever produced, through the real loader.
  //
  // ⚠⚠ AND WHAT IT CANNOT DO IS STATED RATHER THAN IMPLIED, because the corpus has one blind spot
  // here: the DEEPEST fixture in it is week 333 – she is 19 – so no golden save has ever reached
  // `declineStart` and the reconstruction's divisor is 1 on every one of them. Mutation-verified in
  // both directions: seeding half her build fails this on v0.json, and INVERTING the divisor
  // (`* shareLeft` for `/ shareLeft`) passes it, which is exactly the hole. So this case is the
  // loader-side FLOOR – every historical shape survives the ladder and comes back with a usable
  // number – and the reconstruction's accuracy is measured where a career can actually be old, on
  // walked careers of 33 / 38 / 41 in tests/peak-physical.test.ts. Neither can do the other's job.
  //
  // ⚠ ONE TEST PER FIXTURE – P-14, for the reason written out above the v61 sweep. This one was the
  // slowest test in the file (6.3 s of 19.0 s, and 10.2 s on the review's machine).
  it.each(FILES)('⭐⭐⭐⭐ v62: %s carries a peak physical, and it is never below her build', (file) => {
    const migrated = migrateSave(load(file))
    expect(typeof migrated.peakPhysical, `${file}: no stored peak`).toBe('number')
    expect(Number.isFinite(migrated.peakPhysical), `${file}: the peak is not a real number`).toBe(true)
    // A hundredth of tolerance for the floating-point walk the reconstruction does, and no more.
    expect(migrated.peakPhysical, `${file}: the peak is BELOW her current body`)
      .toBeGreaterThanOrEqual(physicalMean(migrated.skills) - 0.01)
    expect(migrated.peakPhysical, `${file}: the peak is above anything this engine can produce`)
      .toBeLessThanOrEqual(SKILL_CEILING_MAX)
  })
})
