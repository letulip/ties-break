// THE ORDERING CELL – the heaviest single arm of the burn calibration, in a process of its own.
// tests/economyCalibration.ts holds the batch, the walk and the frozen numbers, and carries the
// whole argument for why there are three files; the describe name below is the ORIGINAL one, so the
// full test name here is byte-identical to the name the single file produced.
//
// ⚠ WHY THIS ONE CASE IS A FILE. It re-walks ALL THREE batches – 48 careers of 52 real weeks – so
// it is three sevenths of the calibration's whole cost in a single `it`: 7.93 s solo against the
// 6.57 s that the four behaviour describes cost together, and the 05.09 review already had it as
// the slowest test in the file at 12.7 s quiet / 21.4 s contended
// (docs/review-principles-2026-09-05/04-performance.md). Left beside the three cells it re-walks it
// would have made one shard of ~18.8 s where there are now two of 10.76 s and 8.00 s, which is the
// seam that does not move the number.
//
// ⚠ AND IT IS NOT MEMOISED ONTO THE CELLS NEXT DOOR, which was the other remedy on the table. The
// three batches here are deliberately re-walked rather than read out of a cache the band tests
// filled: a shared batch would couple this claim to the ORDER those tests ran in, and the claim is
// about what the three families do, not about what three earlier assertions happened to leave
// behind. Re-walking is what makes it stand alone – which is also what lets it stand in its own
// file. Cheaper is not the same as independent.

import { describe, it, expect, vi } from 'vitest'

// The 16-seed × 52-week calibration batches below sit at ~3s against vitest's 5s default – close
// enough that a busy run tips them over and the gate goes red on timing, not on a claim. Same
// generous file-level timeout the other batch files already use (tests/fatigue-bench.test.ts):
// these tests are deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import { batchBurns, mean } from './economyCalibration'

describe('economy calibration – 52-week net burn (no tournaments, unsponsored kid)', () => {
  it('ordering: the top of the ladder burns, and the two rungs below it save', () => {
    // ⚠ RE-AIMED TWICE. The original read "working < middle, and wealthy no longer belongs in that
    // ordering" - round 12 had already broken the working < middle < wealthy chain by raising the
    // wealthy income, and what ordered the two survivors was the corridor on their shared coach
    // band. Round 1 of the ladder made it "income minus a rung's price". Round 2 restores the
    // corridor AND raises the hours, and the chain that comes out is a third thing again:
    //   middle  · middle  425/wk income − 250/wk coach   burn -$7,334   saves the MOST
    //   working · budget  245/wk income − 112/wk coach   burn -$5,667
    //   wealthy · elite   750/wk income − 750/wk coach   burn +$6,280   the only one that BURNS
    // Middle on top is not an accident: it buys the rung with the widest gap between what the family
    // earns and what its academy charges. And wealthy at the top of the market spends its whole
    // income on the coach alone, before a single trip - which is the design, stated as a number.
    //
    // ⚠⚠⚠ RE-AIMED A THIRD TIME BY ROUND 41 P1 (12.09), AND **THE ORDERING IS THE HALF THAT DID NOT
    // MOVE.** Measured on the same batch after his two rulings: middle -8,039 < working -5,667 <
    // wealthy -4,917 – the chain above holds cell for cell, and the sentence about WHY middle sits
    // on top is unchanged. What broke is the last line: the wealthy cell is no longer a burn, so
    // «the only one that BURNS» has no member. Its $11,197 swing decomposes as gear -$3,309 and the
    // corridor fade -$7,888 (tests/economyCalibration.ts's `BANDS` block carries the control and
    // both arms). **THIS IS A FINDING AWAITING HIS WORD, NOT A RE-TUNE** – the two levers that could
    // restore the burn are the wealthy income and the elite rate band, and neither was touched. The
    // line is inverted rather than deleted precisely so that a re-tune of either goes RED here and
    // is re-pinned deliberately.
    //
    // ⭐⭐⭐ AND IT DID, WITHIN THE DAY. THE INVERSION IS SPENT – THE LAST LINE IS RESTORED (12.09,
    // the owner, choosing between the two levers above):
    //
    //     «единая элит-полка вверх - верно»
    //
    // He took the ELITE RATE BAND and raised it to a single shelf: `ECONOMY.coach.hourlyRateCents.elite`
    // × 1.25, the midpoint of the wealthy corridor P1 retired, so the uniform price everybody now pays
    // is exactly what the wealthy family used to pay. THE RE-PIN IS THE POINT OF THE INVERSION – this
    // line went red on his retune and is being re-aimed deliberately, which is the whole reason P1
    // inverted it instead of deleting it. Measured on the same batch, the same 16 seeds:
    //
    //   middle  · middle  -$8,039   saves the MOST – unmoved to the cent, its rung kept the corridor
    //   working · budget  -$5,667   unmoved to the cent, same reason
    //   wealthy · elite   **+$2,970**   the only one that BURNS, again
    //
    // ⚠ THE CHAIN ABOVE IS UNTOUCHED FOR THE THIRD TIME and the sentence about why middle sits on
    // top still stands: the only thing that moved is the wealthy cell's SIGN, back to where round 7's
    // «premium everything must hurt» put it. The decomposition, the prediction (+$2,971, missed by
    // $1.06) and his ruling in full are in tests/economyCalibration.ts's `BANDS` block and
    // docs/specs/one-market-2026-09.md §3.
    const w = mean(batchBurns('working', { excludeSponsor: true }))
    const m = mean(batchBurns('middle'))
    const rich = mean(batchBurns('wealthy'))
    expect(m).toBeLessThan(w)
    expect(w).toBeLessThan(rich)
    expect(rich, '⚠ the wealthy cell BURNS again – his «единая элит-полка вверх», 12.09').toBeGreaterThan(0)
  })
})
