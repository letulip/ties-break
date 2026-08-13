// THE ENDINGS BENCH, AS A GATE. Small on purpose: the full `npm run bench:endings` is a
// TWENTY-EIGHT-minute Monte-Carlo (measured 13.08 at the default 20 seeds – this line said "twelve"
// from when SEEDS_PER_PRESET was 10 and the field was a third of its size) and birpc's ack ceiling
// is sixty seconds, so what runs here is the smallest slice that can still catch the three things a
// refactor could silently break.
//
// It asserts BEHAVIOUR, not the printed numbers. Pinning "bankruptcy is 51.1%" would fail on the
// first legitimate economy tune and teach everybody to update the number without reading it; the
// rates live in docs/specs/endings-and-the-album.md with the date they were measured.
//
// ⚠ AND SINCE 13.08 IT GATES EVERY PULL REQUEST AGAIN. It had been filed into the `sim` project -
// which is the WEEKLY calibration job, not the gate - because it drives careers, and the sentence
// above is exactly why that was the wrong shelf: a behaviour regression test whose only reader is a
// cron nobody opens is not a gate. It went red on clean `main` and stayed red. It is now in
// HEAVY_UNIT_FILES: `scripts/units.mjs` gives it a process of its own, which is the serialisation
// the sim project was giving it, at 12.2 s of gate time. See that script's THE FILE THAT CAME BACK.
import { describe, it, expect, vi } from 'vitest'

vi.setConfig({ testTimeout: 240_000 })
import { PRESETS, POLICIES } from '../tools/econ-bench'
import { runToEnding, sweepGrace, TARGET_HORIZON_WEEKS } from '../tools/endings-bench'
import { ENDINGS } from '../src/engine/ending'

const working = PRESETS[1]
const wealthy = PRESETS[7]
/** ⚠ THE FORK TEST'S OWN CAREER, AND THE CHOICE IS A MEASUREMENT RATHER THAN A TASTE (13.08).
 *
 *  It used to be `wealthy` under the player policy, picked for exactly one reason – a rich,
 *  well-managed family reliably survives to nineteen, so all three answers are reachable. That
 *  reason stopped holding the day round-17 #6 gave the college answer a PRECONDITION: measured, that
 *  cell takes a counting W75-or-above result at SEVENTEEN in five seeds out of five (four at W75,
 *  one at W100), so by the fork the scholarship is no longer a door she can walk through and
 *  `answerFork` throws before a single assertion runs. The test did not weaken – it exploded, which is the better failure – but it
 *  exploded on a BALANCE FACT NOBODY HAD STATED, which is why the fact is now asserted below.
 *
 *  This cell is the widest margin on the board, from the college-door sweep the bench now prints:
 *  over ten seeds at this horizon it reaches the fork 10/10 and finds the door still open 10/10,
 *  and in 8 of the 10 the door has not shut by TWENTY either. A self-coached middle-class family
 *  grinds the calendar without ever putting a scoring W75 result on the board before nineteen. */
const steady = PRESETS[3]

describe('the endings bench', () => {
  it('is DETERMINISTIC – the same preset and seed produce the same career, twice', () => {
    const a = runToEnding(working, 0, 'continue', POLICIES[0], true, TARGET_HORIZON_WEEKS)
    const b = runToEnding(working, 0, 'continue', POLICIES[0], true, TARGET_HORIZON_WEEKS)
    expect(a.ending).toBe(b.ending)
    expect(a.endedWeek).toBe(b.endedWeek)
    expect(a.spentCents).toBe(b.spentCents)
    expect(a.debtSpells).toEqual(b.debtSpells)
  })

  it('⚠ the fork REALLY forks – the same seed goes three different ways', () => {
    // ⚠ THE HORIZON HAS TO CLEAR HER BIRTHDAY, not the band boundary. The fork fires the week the
    // GIRL turns nineteen, and `DEFAULT_PROFILE` is a June girl - so she reaches it around week 282,
    // twenty-two weeks past the fifth season boundary. A 260-week horizon stopped short of it and
    // this test failed on a mechanism that was working perfectly.
    const H = TARGET_HORIZON_WEEKS + 2 * 52
    const cont = runToEnding(steady, 0, 'continue', POLICIES[0], true, H)

    // ⚠ THE PRECONDITION IS ASSERTED, NOT ASSUMED – and that is the whole repair. Three ways needs
    // three LEGAL answers, and since round-17 #6 the college answer is only legal while
    // `collegeStillOpen` holds. When this test rotted it rotted silently on exactly that: the fact
    // that its career still had the door was true when it was written, written down nowhere, and
    // read by nothing. Both arms of the check carry their own message because they are different
    // failures – "she never got to the fork" is an economy change, "the door was shut" is a ladder
    // or ranking change – and the next person deserves to be told which one happened.
    //
    // The three arms are identical up to the fork week (the arm only decides the ANSWER), so
    // reading the door off `cont` is reading it for all three.
    expect(
      cont.collegeOpenAtFork,
      `${steady.label} no longer REACHES the fork at nineteen (ending: ${cont.ending} at week ${cont.endedWeek}). ` +
        `This test needs a career that gets there; re-pick the cell from the bench's college-door table.`,
    ).not.toBeNull()
    expect(
      cont.collegeOpenAtFork,
      `${steady.label} reaches the fork with the SCHOLARSHIP ALREADY SPENT – a counting ` +
        `${cont.collegeShutTier} finish at age ${cont.collegeShutAge} (week ${cont.collegeShutWeek}) closed it. ` +
        `The college answer is therefore illegal for this career and 'three different ways' cannot be tested ` +
        `on it. Do NOT relax the assertion below: re-pick the cell from the bench's college-door table, ` +
        `which reports exactly this.`,
    ).toBe(true)

    const stop = runToEnding(steady, 0, 'stop', POLICIES[0], true, H)
    const college = runToEnding(steady, 0, 'college', POLICIES[0], true, H)
    expect(stop.ending).toBe('stopped')
    expect(college.wentToCollege).toBe(true)
    // continue is the only answer that leaves the story with a next week at this horizon
    expect(cont.ending).not.toBe('stopped')
  })

  it('⚠ the pinned N is the one the sweep supports, and the sweep still says so', () => {
    // The claim docs/specs/endings-and-the-album.md §3 defends: at the shipped N, survival over the
    // 14→18 window sits inside career-outcome-targets.md's 60-80% band, and a much SHORTER window
    // would push it out. Two presets is a thin sample, so the assertion is the DIRECTION - a shorter
    // grace can only ever bankrupt more careers - which is what makes the sweep's shape meaningful.
    const rows = [working, wealthy].flatMap((p) =>
      [0, 1, 2].map((i) => runToEnding(p, i, 'continue', POLICIES[0], false, TARGET_HORIZON_WEEKS)),
    )
    const swept = sweepGrace(rows, [4, ENDINGS.bankruptcyGraceWeeks, 24], 'debtSpellsInHorizon')
    expect(swept[0].rate).toBeGreaterThanOrEqual(swept[1].rate)
    expect(swept[1].rate).toBeGreaterThanOrEqual(swept[2].rate)
  })
})
