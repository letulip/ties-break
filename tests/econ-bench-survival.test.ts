import { describe, it, expect, vi } from 'vitest'

// ⚠ SPLIT OUT OF tests/econ-bench.test.ts (10.08) — MOVED, NOT REWRITTEN. Same move, same day and
// the same reason as tests/econ-reach-agree.test.ts: birpc gives a FILE's ack a hard 60s window
// (DEFAULT_TIMEOUT = 6e4, no path from vitest config), econ-bench read 58-60s, and a file at the
// wall loses a coin-flip to variance rather than to a defect. econ-reach-pro's header put it best:
// "56s on one run and 72s on the next: over the line, from variance alone."
//
// MEASURED BEFORE CUTTING, per test, and this describe is a clean seam rather than an arithmetic one:
//
//     survival flag and bankruptcy tracking   18.7 + 6.2 =  24.8 s   <- this file, one whole describe
//     the other seven describes                             33.0 s   <- stays in econ-bench
//                                                   total   57.8 s
//
// ⚠ SPLIT, NOT TRIMMED — same presets, same indices, same horizons, same assertions. Cutting seeds
// until a file fits buys speed with coverage, and scripts/sim.mjs's header says that trade is made
// deliberately and measured, never to dodge a timeout.
//
// ⚠ THE PATTERN IS WORTH NAMING RATHER THAN RE-DERIVING NEXT TIME. This is the fourth division in
// this family (econ-reach out of econ-bench, econ-reach-pro out of econ-reach, econ-reach-agree out
// of econ-reach, now this). The ceiling is FIXED and the work grows every wave, so files will keep
// arriving at it. The answer each time is the same and it is cheap: measure per test, find the seam,
// move a whole describe, change no assertion.

// Whole-horizon career replays are deterministic but SLOW, and they sit close enough to vitest's
// 5s default that a busy run tips them over - the gate then goes red on timing, not on a claim.
// Same generous file-level timeout econ-bench carries, same reason.
vi.setConfig({ testTimeout: 240_000 })
import { runCareer, PRESETS, HORIZONS, type SeedResult } from '../tools/econ-bench'

const H16 = HORIZONS.find((h) => h.weeks === 104)!
const H18 = HORIZONS.find((h) => h.weeks === 208)!

describe('survival flag and bankruptcy tracking', () => {
  it('survived === (weeksToBankrupt === null) across presets and horizons', () => {
    for (const preset of PRESETS) {
      for (const index of [0, 1]) {
        for (const h of [H16, H18]) {
          const r = runCareer(preset, index, h.weeks)
          expect(r.survived).toBe(r.weeksToBankrupt === null)
        }
      }
    }
  })

  it('weeksToBankrupt is null-or-in-range, and a red run has a negative peak deficit', () => {
    const results: SeedResult[] = PRESETS.flatMap((p) => [runCareer(p, 0, H16.weeks), runCareer(p, 1, H16.weeks)])
    for (const r of results) {
      if (r.weeksToBankrupt !== null) {
        expect(r.weeksToBankrupt).toBeGreaterThanOrEqual(0)
        expect(r.weeksToBankrupt).toBeLessThanOrEqual(H16.weeks)
        expect(r.peakDeficitCents).toBeLessThan(0)
      }
    }
  })
})
