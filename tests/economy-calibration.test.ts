// THE THREE BURN CELLS – the working / middle / wealthy bands and the precondition that makes them
// the UNSPONSORED bands. tests/economyCalibration.ts holds the batch, the walk and the frozen
// numbers, and carries the whole argument for why there are three files; the describe name below is
// the ORIGINAL one, so every full test name here is byte-identical to the name the single file
// produced.

import { describe, it, expect, vi } from 'vitest'

// The 16-seed × 52-week calibration batches below sit at ~3s against vitest's 5s default – close
// enough that a busy run tips them over and the gate goes red on timing, not on a claim. Same
// generous file-level timeout the other batch files already use (tests/fatigue-bench.test.ts):
// these tests are deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import { createWorld, tickWeek, localSponsorCents } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { batchBurns, mean, BANDS, SEED_SLACK } from './economyCalibration'

describe('economy calibration – 52-week net burn (no tournaments, unsponsored kid)', () => {
  it('the calibration kid really is unsponsored: rank stays well past the sponsor threshold', () => {
    const world = createWorld('cal-1', { ...DEFAULT_PROFILE, background: 'middle' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // ⚠ RE-AIMED (30.07, tune/rank-numbers): reads the NATIONAL cache now, because that is the table
    // ECONOMY.sponsorship gates on. THE PROTECTED FACT IS UNCHANGED and it is the whole subject of
    // the bands below – this kid enters nothing all year, so she earns no points on EITHER ladder and
    // no sponsor money reaches her. The old line asserted the same thing against `world.kidRank`,
    // which was the right cache while the gate read the international table and is now simply the
    // wrong one to be asking. Both are still true; this is the one that guards the bands.
    expect(world.kidRankDomestic!).toBeGreaterThan(ECONOMY.sponsorship.maxRank)
    // ...so the annual review pays her nothing, which is what makes these the UNSPONSORED bands.
    expect(localSponsorCents(world.kidRankDomestic!)).toBe(0)
  })

  it('working (budget coach) lands in the -$6.5k..-$4.8k band (batch mean, BEFORE the sponsor cameo)', () => {
    // The sponsor exclusion is UNCHANGED and its reasoning is untouched by the ladder. Working keeps
    // the need-based local sponsor, whose 6% × $500-1500 roll is worth ~$3.1k a season in
    // expectation with a ~$1.7k per-season spread – comparable to the entire measured figure. So a
    // sponsor-INCLUSIVE 16-seed batch mean is nowhere near converged and moves by more than $1k
    // whenever the main stream re-aligns. The band's own subject is the FIXED base cashflow (see the
    // physio / interest exclusions above), so the calibration measures exactly that.
    const burns = batchBurns('working', { excludeSponsor: true })
    const [lo, hi] = BANDS.working
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    // ⚠ RE-AIMED 10.08 (fix/sponsor-need), NOT WEAKENED – SAME TWO QUANTITIES, AND THE RELATION
    //   BETWEEN THEM IS NOW THE STRONGER CLAIM. This read `toBeLessThan`, on the note "the branch is
    //   exercised, not a no-op on this batch", and that was true only because the cameo paid EVERY
    //   working family EVERY week whatever its balance. `ECONOMY.sponsor.eligible` is gone: the gate
    //   is need now (`sponsorNeedMet`), and this calibration career is the textbook family that has
    //   none of it. She enters nothing all year, so she pays fixed costs only, so her balance never
    //   drops within `runwayWeeks` weeks of her court – she opens on 104 weeks of it and rises.
    //
    //   So the exclusion is a no-op HERE, by design, and equality is what says so. And because cameo
    //   income can never be negative, `mean(inclusive) === mean(exclusive)` over the batch is not a
    //   weaker statement than the old inequality – it proves EVERY seed banked EXACTLY ZERO, where
    //   the old line only proved that at least one banked something.
    //
    //   This block is titled "unsponsored kid" and the case above it asserts that against the ANNUAL
    //   GRANT. This is the same claim against the CAMEO – the mechanism that made the title a
    //   half-truth for the whole of this file's life.
    expect(mean(batchBurns('working'))).toBe(mean(burns))
  })

  it('middle (middle coach) lands in the -$8.5k..-$6k band (mean, and every seed inside slack)', () => {
    const burns = batchBurns('middle')
    const [lo, hi] = BANDS.middle
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - SEED_SLACK.middle)
      expect(b).toBeLessThanOrEqual(hi + SEED_SLACK.middle)
    }
  })

  // ⚠⚠⚠ RE-AIMED BY ROUND 41 P1, AND THE SIGN FLIPPED A THIRD TIME – **A FINDING FOR THE OWNER,
  // NOT A RE-TUNE.** The full decomposition, the control and the two levers that are his are in
  // tests/economyCalibration.ts's `BANDS` block; in one line: his own two rulings of 12.09 (uniform
  // gear prices, and the corridor stopping at `high`) take this cell from a **+$6,280 burn to a
  // -$4,917 saving**, of which the corridor half is 70%. The ORDERING below it is untouched.
  it('wealthy (elite coach) now SAVES ~$4.9k in an idle year – ⚠ premium everything stopped hurting', () => {
    // ⚠ THE HISTORY IS KEPT because it is what makes the third flip legible. Round 12 had raised the
    // wealthy income to $750/wk and this cell became a break-even; Round 1 of the ladder made it a
    // $8.3k saving, because an Elite coach at four hours and no corridor was $480/wk. Round 2
    // restored the corridor and raised the hours, so a premium academy's Elite coach was $750/wk -
    // exactly the family's weekly income - and the idle year burned, which is what the round-7
    // "premium everything must hurt" always meant. ROUND 41 P1 takes the corridor off that rung: the
    // same coach is $800/wk for EVERY family now, the family's own gear fell to the uniform rung
    // price, and $750/wk of income no longer loses the race. The principle is not refuted; it is
    // un-funded, and the fix (if he wants one) is on the income or the elite rate, not here.
    const burns = batchBurns('wealthy')
    const [lo, hi] = BANDS.wealthy
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - SEED_SLACK.wealthy)
      expect(b).toBeLessThanOrEqual(hi + SEED_SLACK.wealthy)
    }
  })
})
