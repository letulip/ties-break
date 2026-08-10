import { describe, it, expect, vi } from 'vitest'

// ⚠ SPLIT OUT OF tests/econ-reach.test.ts (10.08) — MOVED, NOT REWRITTEN, and it is the THIRD time
// this family has had to divide. econ-reach was split out of econ-bench (P6 (d)); econ-reach-pro was
// split out of econ-reach, and its header states the rule exactly: *"the ack spans the FILE, so a
// file near 60s loses a coin-flip against a hard timeout... econ-reach measured 56s on one run and
// 72s on the next: over the line, from variance alone."*
//
// IT CAME BACK BECAUSE THE FIXTURE MOVED. `econ-reach`'s 14→18 arm was re-pointed from `middleHigh`
// to `25k · middle · self-coached` (docs/specs/compound-cost-2026-08.md §9) so it would measure the
// tennis rather than the bank balance. The new cell's careers SURVIVE where the old cell's stopped
// entering, so more weeks are actually simulated and the file went to 64s. The fixture change was
// right and this is its bill.
//
// MEASURED BEFORE CUTTING, and the file divided at a seam rather than in half:
//
//     nine per-preset agreement tests   3.4–4.6 s each   33.1 s   <- this file
//     the case + the band (14→18)                        30.7 s   <- stays in econ-reach
//                                                total   63.8 s
//
// Two ~32 s files, each half the wall. ⚠ SPLIT, NOT TRIMMED – same tests, same five indices per
// preset, same assertions, same 104-week horizon. Cutting seeds until a file fits buys speed with
// coverage, and `scripts/sim.mjs`'s header says that trade is made deliberately and measured, never
// to dodge a timeout.
//
// WHY THIS HALF MOVED AND NOT THE OTHER. The name `econ-reach` is cited by nine documents and by the
// compound-cost spec's nine readings, all of which mean THE BAND. The tripwire keeps the name; the
// consistency check, which no document points at, takes the new one.

// Whole-horizon career replays are deterministic but SLOW, and they sit close enough to vitest's
// 5s default that a busy run tips them over - the gate then goes red on timing, not on a claim.
// Same generous file-level timeout econ-reach and the fatigue bench carry, same reason.
vi.setConfig({ testTimeout: 240_000 })
import {
  runCareer,
  openCareer,
  stepCareerWeek,
  PRESETS,
  HORIZONS,
  REACH_TARGET_MONEY,
} from '../tools/econ-bench'
import { kidPoints } from '../src/engine/world'

const H16 = HORIZONS.find((h) => h.weeks === 104)!

describe('reach tracker – the predicate and the replay agree (14→16, the domestic arm)', () => {
  it.each(PRESETS)('reachedWeek is the FIRST week the target predicate holds (14→16 = the domestic arm) – $label', (preset) => {
    // Independent replay of the SAME deterministic career: find the first week kidPoints crosses the
    // domestic reach proxy (>= REACH_TARGET_MONEY) and confirm runCareer recorded exactly that.
    // The DOMESTIC table, because that arm is denominated in domestic points – see reachedTarget,
    // whose 14→16 arm was reading the ITF one against it.
    // ⚠ THRESHOLD-AGNOSTIC BY CONSTRUCTION, which is why the 150 → 320 re-base left it alone: it
    // asserts that two readings of the same predicate AGREE, so it holds at any target, and it keeps
    // firing both branches at 320 (of these five careers per preset, some cross and some do not).
    for (const index of [0, 1, 2, 3, 4]) {
      const r = runCareer(preset, index, H16.weeks)
      const { world, rng } = openCareer(preset, index)
      let firstCross: number | null = null
      for (let i = 0; i < H16.weeks; i++) {
        stepCareerWeek(world, rng)
        if (firstCross === null && kidPoints(world, 'domestic') >= REACH_TARGET_MONEY) firstCross = world.week
      }
      expect(r.reachedWeek).toBe(firstCross)
    }
  })
})
