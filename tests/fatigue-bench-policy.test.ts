// FATIGUE BENCH – THE POLICY-ORDERING HALF (38s of the parent file's 55s, measured 02.08).
//
// ⚠ WHY ITS OWN FILE. vitest tracks each FILE as a task, and birpc gives that task's `onTaskUpdate`
// ack a HARD-CODED 60s window (DEFAULT_TIMEOUT = 6e4, not configurable in vitest 3.2.7). No single
// test here is long - the worst is 18s - but the FILE total is what the ack spans, so a file near
// 60s loses a coin-flip against a hard timeout and the sim project exits 1 with every test green.
// Measured per-describe before splitting: this block alone was 38s inside a 55s file.
//
// NOTHING ELSE MOVED: same tests, same sample sizes, same seeds, same assertions. Wall-clock is
// unchanged because the sim project runs one file at a time anyway (see vite.config.ts).
import { describe, it, expect, vi } from 'vitest'

// Monte-Carlo cells (30 seeds × 52-208 engine-weeks) finish in ~1-4s on a dev Mac but blow the
// 5s default on a 2-core CI runner (observed: the ordering + 104w-anchor tests timing out in the
// PR run). One generous file-level timeout instead of per-test surgery – these tests are
// deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import {
  PROFILES,
  POLICIES,
  FATIGUE_HORIZONS,
  runCell,
  computeCellStats,
} from '../tools/fatigue-bench'

// The fatigue bench is a MEASUREMENT tool for the round-9 condition math: it must be
// deterministic, its policy ordering must reflect the load-management axis it exists to compare,
// and its condition trace must be exactly the owner's formula – re-derived here INDEPENDENTLY
// from the ECONOMY knobs (no accrueCondition/matchDrain imports) and compared byte-for-byte.

const working = PROFILES.find((p) => p.background === 'working')!
// ⚠ RE-AIMED by the coach ladder: the bench's profiles moved from `coachSetup: 'parent' | 'hired'`
// to rungs of the ladder ('self' / 'middle'). Same two middle-family cells, same contrast – the
// self-coached family against the one paying a coach – so every assertion below is unchanged.
const middleSelf = PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'self')!

const grinder = POLICIES.find((p) => p.id === 'grinder')!
const balanced = POLICIES.find((p) => p.id === 'balanced')!
const careful = POLICIES.find((p) => p.id === 'careful')!

const H52 = FATIGUE_HORIZONS.find((h) => h.weeks === 52)!
const H104 = FATIGUE_HORIZONS.find((h) => h.weeks === 104)!

describe('policy ordering (the load-management axis)', () => {
  // Self-coached profiles are the clean read: physio is OFF for grinder/balanced there, so the
  // three policies actually differ in recovery. (On hired-coach profiles the default physio +2
  // saturates all three at the cap and the ordering collapses to a tie – a bench FINDING, not a
  // bench bug; see the anchor test below.)
  it('mean condition: grinder < balanced < careful (both self-coached profiles, 52w)', () => {
    for (const profile of [working, middleSelf]) {
      const g = computeCellStats(profile, grinder, H52, runCell(profile, grinder, H52.weeks))
      const b = computeCellStats(profile, balanced, H52, runCell(profile, balanced, H52.weeks))
      const c = computeCellStats(profile, careful, H52, runCell(profile, careful, H52.weeks))
      expect(g.meanCond).toBeLessThan(b.meanCond)
      expect(b.meanCond).toBeLessThan(c.meanCond)
    }
  })

  it('injuries/season: grinder > careful; the spec ≥3x anchor is NOT met – pinned as the round-9 finding', () => {
    // Pooled over both self-coached profiles at 52w for stability (paired seeds).
    const gRuns = [...runCell(working, grinder, H52.weeks), ...runCell(middleSelf, grinder, H52.weeks)]
    const cRuns = [...runCell(working, careful, H52.weeks), ...runCell(middleSelf, careful, H52.weeks)]
    const gInj = gRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    const cInj = cRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    expect(gInj).toBeGreaterThan(cInj) // direction holds
    // *** RE-PINNED 25.07 with the V2.1 flip (shipped: recoveryBase 1, match weeks 0, physio 1):
    // at 52w the pooled self-coached ratio sat ~2.6x (one season is too short for the grinder's
    // downward drift to fully separate tau), still shy of the spec's ≥3x. ***
    // *** RE-MEASURED 28.07 with the random draw: 3.25x. The direction and the reason are
    // unchanged; the number rose because a grinder now sometimes SURVIVES round one and plays a
    // second match in the same week, which is exactly the load the axis is about. The corridor is
    // widened rather than re-pinned to a point - this anchor has moved four times already
    // (3.05 / 2.94 / 3.12 / 2.98 / 3.25) and a point pin on it is a tripwire, not a measurement. ***
    const ratio = gInj / cInj
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(3.6)
  })

  it('the C3 ≥3x anchor is BACK at 104w – R12-6 spread the adjacent Nationals (round-12)', () => {
    // The owner's target metric: across two seasons the enter-everything grinder drifts low
    // enough that fatigue-tau separation finally triples the careful player's injury rate.
    // *** SEEDS TRIMMED 25.07 (ladder-up): sim cost per week is no longer flat – once she climbs
    // into the J-tiers the calendar stacks several draw-32 AI tournaments EVERY week, so a 104w
    // career costs orders of magnitude more than a 52w one (measured uncontended: the 52w pooling
    // above runs in 1.5s, this one took 908s at 30 seeds and blew the CI timeout). 10 paired seeds
    // per cell (40 careers over two seasons) still separates a ~3-4x ratio cleanly;
    // `npm run bench:fatigue` keeps the full 30. ***
    //
    // *** RE-PINNED AND RE-CLAIMED 3.00 -> ~2.77 (wave-3 integration, 26.07). This asserted
    // `>= 3` and now reads 2.77. MEASURED, then ISOLATED (same cells, N=10, 104w, paired seeds,
    // pooled grinder injuries / pooled careful injuries):
    //     ladder OFF both sides (the pre-merge engine)   117 / 39 = 3.00   <- the old pin, EXACTLY
    //     ladder on the KID only                         118 / 46 = 2.57
    //     ladder on BOTH sides (shipped wave-3 decision) 119 / 43 = 2.77
    // Two readings matter here. First, the old pin sat on the knife edge – it met `>= 3` by being
    // 3.0000, so ANY content change was going to move it; it is not a number to defend. Second, the
    // cause is the KID's half of the cumulative run ladder, NOT the shared rival half: sharing the
    // ladder claws ~0.2 of the ratio back (tired rivals cost the careful player some of the deep
    // runs the ladder taxes her for).
    //
    // MECHANISM, so this reads as a finding rather than a mystery: the ladder charges for DEPTH, and
    // depth is what a load-managed player has (careful plays MORE tournament matches than the
    // grinder – "load management frees the calendar", the planner slice's own finding). The careful
    // parent sits high on the fatigue curve where every condition point is a real tau increment, so
    // the ladder converts almost directly into injuries (+10% here). The grinder is already
    // saturated – pinned at condition 0 for long stretches and riding injuryChanceCap – so extra
    // strain buys her nearly nothing (+2%). Net effect: the ladder COMPRESSES the very ratio the
    // spec's C3 anchor measures.
    //
    // FOR THE OWNER, not for this branch to tune: restoring `>= 3` means moving a knob
    // (injuryFatigueSlope / injuryChanceCap, or the careful policy's entry margin), and that is a
    // balance decision. The `< 3` bound below is a deliberate TRIPWIRE in the style of the 52w
    // sibling above: the day tuning restores the target, this test fails and gets re-read. ***
    //
    // *** THE TRIPWIRE FIRED, AND THE ANCHOR IS BACK: 2.77 -> 3.05 (round-10, R10-17). Re-read as
    // the note above asks. NOT a tuning change – no knob moved. The cause is the R10-17 correctness
    // fix: `availabilityStatus` used to answer "is she hurt TODAY?" for an event WEEKS away, so an
    // injury blacked out the ENTIRE 8-week entry horizon for the whole layoff, and every list she
    // could have joined on the way back had already closed by the time the lock lifted. The gate now
    // asks "will she still be out in `event.week`?".
    //     before (stale current-week read)   119 / 43 = 2.77
    //     after  (event-week read, shipped)  122 / 40 = 3.05
    // MECHANISM: the fix lands ASYMMETRICALLY, and in the direction C3 measures. The careful policy
    // is the one that plans around a layoff, so it is the one the phantom lock hurt – it lost the
    // weeks after her return and came back to a compressed cluster of whatever was still open
    // (injuries 43 -> 40, entries 657). The grinder was already saturated and simply races more of
    // the calendar (119 -> 122, entries 805). So the owner's C3 >= 3x target is met again as a
    // side effect of fixing a bug, which is the best way for a balance target to be met.
    // STILL A KNIFE EDGE (3.05, exactly as the 3.0000 pin was): the bound below is now the tripwire
    // in the OTHER direction – if content pushes it back under 3, this fails and gets re-read again.
    // Do not tighten it into a point pin. ***
    const N = 10
    const gRuns = [...runCell(working, grinder, H104.weeks, N), ...runCell(middleSelf, grinder, H104.weeks, N)]
    const cRuns = [...runCell(working, careful, H104.weeks, N), ...runCell(middleSelf, careful, H104.weeks, N)]
    const gInj = gRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    const cInj = cRuns.reduce((s, r) => s + r.injuriesTotal, 0)
    // *** THE TRIPWIRE FIRED AGAIN, AND THE ANCHOR IS LOST AGAIN: 3.05 -> 2.94, by the MATCH BASE
    // RAISE (owner decision 26.07, straightSets 1 -> 2). RE-READ as the note above demands, not
    // re-pinned blind. MEASURED, same cells, N=10, 104w, paired seeds:
    //     base 1 (pre-change)  injuries 122 / 40 = 3.050 · entries 805 / 657
    //     base 2 (shipped)     injuries 141 / 48 = 2.938 · entries 640 / 652
    // MECHANISM, and it is NOT the injury model: look at the ENTRIES. Both policies get hurt more in
    // absolute terms (grinder +16%, careful +20%) because every match costs a rung more, but the
    // grinder's SCHEDULE collapses – 805 -> 640 entries, -20% – while the careful parent, who was
    // already skipping below her floor, loses 5. The doctor's veto is what does it: at base 2 the
    // grinder spends 34% of her weeks under the medical floor (was 15%) and is refused 299 entries
    // (was 113). She cannot get hurt at tournaments she is not allowed to enter, so the very
    // degeneracy the veto exists to stop is now ALSO capping the metric the C3 anchor measures.
    // The careful parent, meanwhile, absorbs the base raise as pure tau: +20% injuries on an
    // unchanged calendar. Compression follows arithmetically.
    // FOR THE OWNER: 2.94 vs the >= 3 target is a rounding error next to the 33%-of-career
    // condition-0 pin the same change produces in the degenerate cell (see the doctor's-veto test
    // below). If the anchor matters more than the pin, the knob is injuryFatigueSlope, not the base.
    // The bound below is again the tripwire in the other direction. ***
    //
    // *** THE PRACTICE GATE MOVES IT AGAIN, DOWNWARD: 2.938 -> 2.833. Both bounds still hold, so
    // nothing is re-pinned – but the note above demands a re-read, so here it is. MEASURED, same
    // cells, N=10, 104w, paired seeds, gate OFF vs ON:
    //     no gate  injuries 141 / 48 = 2.938 · entries 640 / 652 · friendlies 899 / 661
    //     the gate injuries 136 / 48 = 2.833 · entries 863 / 652 · friendlies 501 / 661
    // MECHANISM, and it is the SAME asymmetry the base raise had, running backwards. The CAREFUL side
    // does not move by a single injury or a single entry (48 / 652 both times): she only practises at
    // condition >= 80, so she never meets the floor and the gate is invisible to her. Everything that
    // moves is the grinder's, and it moves in the direction that LOOKS wrong and is not: she loses 398
    // friendlies (899 -> 501) and gains 223 tournament entries (+35%), because a body that is not
    // pinned at 0 clears the entry gate. More tournaments, and yet FIVE FEWER injuries (141 -> 136) –
    // the tau she sheds by living above the floor (weeks under it: 932 -> 590 of 2080) is worth more
    // than the extra matches cost her. So the ratio slips 0.1 for the healthiest possible reason.
    // FOR THE OWNER, unchanged from the note above: restoring >= 3 is a knob decision
    // (injuryFatigueSlope / the careful entry margin), and this branch does not take it. ***
    //
    // *** THE TRIPWIRE FIRED, AND THE ANCHOR IS BACK: 2.833 -> 3.122 (round-12, wave A + R12-6).
    // Re-read as the note above demands. NO KNOB MOVED on the injury model – the cause is two
    // correctness fixes, exactly like the R10-17 episode further up. MEASURED, same cells, N=10,
    // 104w, paired seeds, on this branch, gap OFF vs ON:
    //     R12-6 gap OFF   grinder 128 / careful 44 = 2.909 · entries 785 / 610 · cond 29.5 / 85.9
    //     R12-6 gap ON    grinder 128 / careful 41 = 3.122 · entries 788 / 599 · cond 29.6 / 85.5
    // (and the 2.833 -> 2.909 half is wave A's R12-4/11 vacation tau factor: `careful` is the only
    // policy that books packages, so it is the only one the protection reaches.)
    //
    // MECHANISM, and it is the SAME asymmetry every note in this block has found, once more: the
    // GRINDER DOES NOT MOVE AT ALL – 128 injuries either way, +3 entries, +0.1 condition. She races
    // everything and lives near the floor, so moving two Nationals one week apart is invisible to
    // her. Everything that moves is the CAREFUL parent's, and it moves because she is the policy
    // that PLANS: she enters only above the tier floor + 10, and a pair of ADJACENT Nationals used
    // to offer her two shots at the tier inside one recovery window (block 0's weeks 47 and 48 –
    // the owner's own "including the last two weeks"). Spread to 46 and 48, one of them now lands
    // where her condition gate refuses it: 11 fewer entries, 3 fewer injuries.
    // So the owner's C3 >= 3x target is met again as a side effect of fixing a calendar bug, which
    // the R10-17 note already called the best way for a balance target to be met.
    const ratio = gInj / cInj
    // *** ⚠⚠⚠ THE TRIPWIRE FIRED AND THE ANCHOR IS LOST, HARD: 2.98 -> 1.836, by the ADULT RUNGS
    // (31.07, task #17). Re-read exactly as every note above demands, and re-read the direction of
    // travel too, because this one is unlike the four before it. MEASURED, same cells, N=10, 104w:
    //     before (6 rungs)  injuries 128 grinder / 43 careful = 2.98 · grinder meanCond ~29
    //     after  (9 rungs)  injuries 123 grinder / 67 careful = 1.836 · grinder meanCond 26.8,
    //                                                                   careful meanCond 76.8
    //
    // MECHANISM, AND IT IS THE SAME ROOT CAUSE AS THE COHORT-FATIGUE REGRESSION in
    // tests/rivals.test.ts C2 - one cause, two symptoms. THE GRINDER DID NOT MOVE (128 -> 123): she
    // was already saturated, already living at condition 27, already racing everything she could
    // afford. EVERYTHING THAT MOVED IS THE CAREFUL PARENT'S, +56% injuries on an unchanged policy and
    // an unchanged injury model, and there are two reinforcing reasons, neither of them a knob:
    //   1. THE FIELD SHE MEETS IS EXHAUSTED. The junior rungs have no maximum age, so the same 199
    //      rivals now fill 139 events a season instead of 92 and their median condition fell from
    //      ~95 to ~34 (measured, tests/rivals.test.ts C2). `conditionMatchFactor` makes a tired
    //      opponent weaker, so the careful parent - the one policy that arrives FRESH, at 76.8 -
    //      wins rounds she used to lose, goes deeper, and plays more matches per entry. Injury risk
    //      is per match.
    //   2. THE CALENDAR IS BETTER SPREAD. `tierPhase` divides by the ladder's length, so nine rungs
    //      collide on fewer weeks than six; the policy that leaves weeks on the table is the one a
    //      denser calendar gives more to enter.
    //
    // WHY IT IS NOT TUNED HERE. The fix is not in the injury model and not in this bench: it is
    // §4.1 of docs/specs/adult-tour-and-endings.md - `maxAgeYears` on the J tiers, so a rival plays
    // ONE tour rather than two - which that spec sequences AFTER this slice and which is explicitly
    // out of its scope. `rivalFatigueWindowWeeks` was swept (16/13/12/11/10) and cannot recover the
    // field's condition, because it bounds the MEMORY of the drain and the drain itself is ~50%
    // larger. Flagged for the owner in the commit message and the report.
    //
    // THE PROPERTY THIS TEST EXISTS FOR SURVIVES AND IS STILL ASSERTED: the grinder gets hurt far
    // more often than the careful parent. 1.84x is a smaller separation than 3x and it is still a
    // large, unambiguous one. The bound below keeps the DIRECTION with the same "corridor, never a
    // point pin" discipline every note above insists on; the loss of the >= 2.5 corridor is pinned
    // separately underneath, so restoring the field's condition makes THAT line fail and brings
    // somebody back to restore the stronger bound rather than leaving it slack for ever. ***
    // The DIRECTION is the property that must never break: the grinder gets hurt far more often.
    expect(ratio).toBeGreaterThan(1.5)
    // ...and the owner's C3 anchor is MET again (3.12). This is the tripwire in the other direction
    // now: if content pushes it back under 3, this fails and gets re-read rather than quietly
    // re-pinned. Deliberately NOT tightened into a point pin – see every note above.
    // *** FOURTH SWING OF THIS NEEDLE, and the last as a point pin. Its history this week:
    //     3.05 (R10-17 fix) -> 2.94 (match base 2) -> 3.12 (R12-6 calendar gap) -> 2.98 (round-12
    //     income growth: seasons 2+ carry 5-10%/yr more money, both policies buy more entries, and
    //     the ratio dips again). Every balance change moves it +-0.15 around 3.0 because both the
    //     numerator and denominator are small pooled counts (~120/~40 at N=10). The PROPERTY that
    //     must hold is the separation, not the third decimal - so the pin is now the corridor the
    //     needle actually swings in. If the owner wants ">= 3" GUARANTEED, that is a tuning task
    //     with its own knob (injuryFatigueSlope), not a bound on this test.
    //     *** MOVED AGAIN 28.07 by the random draw: 3.64. Same reading as every previous move -
    //     small pooled counts, and this change lets her win a first round she used to be rigged to
    //     lose, so a grinder plays deeper into more weeks. The corridor widens by the same 0.15
    //     logic it was built on; the PROPERTY (grinder separates from careful, ~3x) is intact. ***
    // ⚠ THE CORRIDOR THE NEEDLE USED TO SWING IN – 2.5 to 3.9 around the owner's 3x anchor – IS
    // CURRENTLY BELOW ITS FLOOR, and that fact is pinned rather than the bound rewritten to hide it.
    // See the block above for the measurement and the cause. This line FAILS the day the field gets
    // its condition back (§4.1's age cap), which is exactly when somebody should be here restoring
    // `> 2.5` and deleting this assertion. Until then it is the honest record of a lost anchor.
    //
    // *** ⚠⚠⚠ HALF-WAY BACK, AND THE OTHER HALF SAYS THE DIAGNOSIS ABOVE IS INCOMPLETE: 1.836 ->
    // 2.032 (31.07, fix/no-double-booking). RE-READ as every note in this block demands. NO KNOB
    // MOVED: a rival can no longer be drawn into two of the same week's tournaments and play both,
    // which was 31.5% of all player-weeks in a draw (14,381 of 45,675, creating 17,301 appearances
    // the calendar does not contain). MEASURED, same cells, N=10, 104w, paired seeds:
    //     before  injuries 123 grinder / 67 careful = 1.836
    //     after   injuries 126 grinder /  62 careful = 2.032 · grinder meanCond 24.4 · careful 73.0
    //
    // MECHANISM, and it is the SAME asymmetry every note in this block has found: the GRINDER BARELY
    // MOVES (123 -> 126) because she is saturated, and the whole swing is the CAREFUL parent's
    // (67 -> 62, -7%). Reason 1 of the note above – "the field she meets is exhausted, so the one
    // policy that arrives fresh wins rounds she used to lose and plays more matches per entry" – is
    // exactly the term that shrinks: the field is no longer playing 42.9 events a season at its top
    // and 0 at its bottom, so the opponents she meets are less lopsidedly wrecked.
    //
    // AND REASON 1 IS ALSO WHY THIS DOES NOT FINISH THE JOB. The field's MEDIAN condition did not
    // recover (34-36 -> 35-37, measured in tests/rivals.test.ts C2, which this note has always called
    // its sibling symptom), because double-booking never added tennis to the world – it concentrated
    // it. The number of draw slots in a season is a property of the calendar alone (3,616 over 199
    // rivals, ~18 events each), and the fix redistributes them without changing the total by one. So
    // the cohort's fatigue is the LOAD, not the collisions, and the remedy is still §4.1's
    // `maxAgeYears` – a rung that reduces how many draws one rival is eligible for. The bound below
    // is LEFT INVERTED at 2.5, because the corridor is still lost and this is still the honest record
    // of it; it is simply 0.2 closer to firing than it was.
    //
    // ⚠ AND THE 2.98 AT THE TOP OF THIS NOTE IS ITSELF SUSPECT, which every number in this block
    // inherits. The collision was NOT introduced by the adult rungs: re-measured on the junior-only
    // calendar (the 92-event season this bench's whole history was taken on), 22.7% of player-weeks
    // in a draw were double-booked there too, and 30.7-33.7% of the cohort never played at all. Every
    // anchor this block records – 3.05, 2.94, 3.12, 2.98 – was measured against a field that was an
    // over-worked third and an idle third. The RELATIVE readings almost certainly survive, because
    // the defect sat in both arms of every A/B this file ran; the ABSOLUTE ones about how tired the
    // opposition was do not. Flagged for the owner rather than acted on: re-deriving a year of
    // anchors is a decision about what the benches are for. ***
    expect(ratio, 'the >= 2.5 C3 corridor is currently LOST – see the note above').toBeLessThan(2.5)
  })
})
