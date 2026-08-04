// THE ENDINGS BENCH, AS A GATE. Small on purpose: the full `npm run bench:endings` is a
// twelve-minute Monte-Carlo and birpc's ack ceiling is sixty seconds, so what runs here is the
// smallest slice that can still catch the three things a refactor could silently break.
//
// It asserts BEHAVIOUR, not the printed numbers. Pinning "bankruptcy is 51.1%" would fail on the
// first legitimate economy tune and teach everybody to update the number without reading it; the
// rates live in docs/specs/endings-and-the-album.md with the date they were measured.
import { describe, it, expect, vi } from 'vitest'

vi.setConfig({ testTimeout: 240_000 })
import { PRESETS, POLICIES } from '../tools/econ-bench'
import { runToEnding, sweepGrace, TARGET_HORIZON_WEEKS } from '../tools/endings-bench'
import { ENDINGS } from '../src/engine/ending'

const working = PRESETS[1]
const wealthy = PRESETS[7]

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
    const cont = runToEnding(wealthy, 0, 'continue', POLICIES[1], true, H)
    const stop = runToEnding(wealthy, 0, 'stop', POLICIES[1], true, H)
    const college = runToEnding(wealthy, 0, 'college', POLICIES[1], true, H)
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
