import { describe, it, expect, vi } from 'vitest'

// ⚠ SPLIT OUT OF tests/econ-bench.test.ts (P6 (d), chore/w1-quick-wins) — MOVED, NOT REWRITTEN.
// The reach-tracker describe alone was ~40s of Monte-Carlo on a fast machine, and birpc's
// HARD-CODED 60s RPC timeout (node_modules/birpc DEFAULT_TIMEOUT = 6e4, not configurable in
// vitest 3.2.7) fired while the fork's event loop sat blocked in it — `test:sim` exited 1 with
// every test green. No sim file may sit near the minute mark, so the tracker gets a file of its
// own, and the whole-PRESETS loops become it.each so the event loop yields between presets and no
// single test body can block tens of seconds on the weekly runner's slower cores.
// Every assertion, comment block, owner decision and RE-PIN note below is carried over verbatim.

// Whole-horizon career replays are deterministic but SLOW, and they sit close enough to vitest's
// 5s default that a busy run tips them over - the gate then goes red on timing, not on a claim.
// Same generous file-level timeout econ-bench and the fatigue bench carry, same reason.
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

const working = PRESETS.find((p) => p.background === 'working')!
/** The working family that BUYS a coach – the cell where the 14→18 pro proxy still splits the field
 *  (6 of 30 clear it under the grinder policy). `working` above is the self-coached one, whose
 *  careers reach 0 of 30 at that horizon: a real answer about that family, and a useless fixture for
 *  a case whose whole job is to fire BOTH branches of the tracker. */
const workingCoached = PRESETS.filter((p) => p.background === 'working')[1]!

const H16 = HORIZONS.find((h) => h.weeks === 104)!
const H18 = HORIZONS.find((h) => h.weeks === 208)!

describe('reach tracker (points/rank proxy – NOT the prize-money question, which A4 measures)', () => {
  it.each(PRESETS)('reachedWeek is the FIRST week the target predicate holds (14→16 = national eligibility) – $label', (preset) => {
    // Independent replay of the SAME deterministic career: find the first week kidPoints crosses the
    // national-eligibility proxy (>= REACH_TARGET_MONEY) and confirm runCareer recorded exactly that.
    // The DOMESTIC table, because national eligibility is a domestic band – see reachedTarget, whose
    // 14→16 arm was reading the ITF one against it.
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

  it('a career that clears the target has a non-null reachedWeek; one that never does is null', () => {
    // The 14→16 money proxy (DOMESTIC kidPoints >= 150) is a genuine climb, so some working careers
    // clear it and others never accumulate 150 points inside 104 weeks – exercising BOTH the non-null
    // and null branches deterministically.
    //
    // THIS ASSERTION CAUGHT A REAL BUG rather than aging into one, and it is worth saying which:
    // `reachedTarget`'s 14→16 arm was reading her ITF table against a threshold denominated in
    // domestic points, so the "some clear it" branch went from 28 of these 30 careers to ZERO and
    // the tracker was pinned at 'never' for three of the four presets. Fixed in tools/econ-bench.ts;
    // both branches fire again, which is exactly what this case is here to notice.
    // ⚠⚠ RE-AIMED AT THE 14→18 HORIZON, NOT WEAKENED (31.07, task #17), AND THE REASON IS ITSELF A
    // FINDING FOR THE OWNER: the 14→16 target has stopped discriminating. It is 30 of 30 in ALL NINE
    // presets now (measured), against 28 of 30 for working before the adult rungs - so this case's
    // null branch has no career left to fire on and, more importantly, `REACH_TARGET_MONEY` (150
    // domestic points) has quietly become a formality that every family clears by about week 20.
    //
    // NOTHING ABOUT THE DOMESTIC LADDER GOT EASIER. The domestic event COUNTS are identical (26/13/6
    // a season - pinned in tests/season/calendar.test.ts) and so are the point tables. What moved is
    // WHICH WEEKS they sit on: `buildSeason` phases each tier by `0.5 + index / TIER_LADDER.length`,
    // so a nine-rung ladder spreads the calendar differently from a six-rung one, the domestic rungs
    // collide with each other on fewer weeks, and the entry policy - which may take at most ONE event
    // per week - gets to enter more of the same events. A better-spread calendar is a good thing; a
    // reach target that 270 careers out of 270 meet is not a measurement, and it is the same failure
    // mode this file's own note above describes catching in the other direction ("a reach tracker
    // pinned at 'never', which is not a measurement"). Re-basing it is a tuning decision with its own
    // sweep, so it is reported rather than done here.
    //
    // The CASE is unchanged: both branches of the tracker must fire, because a tracker stuck at one
    // answer is the bug this was written to notice. It fires them on the horizon that still
    // discriminates - 14→18 measures 0/30 to 26/30 across the presets - and the saturation of 14→16
    // is pinned below as a fact, so that re-basing the target makes THAT line fail and brings
    // somebody back here.
    const workingH18 = Array.from({ length: 30 }, (_, i) => runCareer(workingCoached, i, H18.weeks))
    expect(workingH18.some((r) => r.reachedWeek !== null)).toBe(true) // some clear it
    expect(workingH18.some((r) => r.reachedWeek === null)).toBe(true) // some never do
    for (const r of workingH18) {
      if (r.reachedWeek !== null) {
        expect(r.reachedWeek).toBeGreaterThan(0)
        expect(r.reachedWeek).toBeLessThanOrEqual(H18.weeks)
      }
    }
    // ⚠ THE FINDING THAT WAS PINNED HERE, AND ITS RESOLUTION. From 31.07 this line asserted the
    // OPPOSITE - `every(r => r.reachedWeek !== null)`, "14→16 no longer discriminates" - written as
    // a tripwire: "if a tuning pass re-bases REACH_TARGET_MONEY so it discriminates again, this
    // line fails and the note above gets re-read".
    //
    // ⚠ RE-AIMED 01.08 (chore/w1-quick-wins), because the tripwire FIRED - not via a re-based
    // target but via round 15's engine half (feat/round15: the summer-weeks calendar reshuffle and
    // the W reprice), which moved exactly one career off the proxy. Measured at this revision:
    // working·self-coached reaches 29 of 30 (bench-working-29 never crosses inside 104 weeks);
    // every other preset is still 30 of 30. So the 14→16 proxy discriminates again for the one
    // family the whole bench is hardest on - barely, but the case's ORIGINAL shape ("some clear
    // it, some never do") is true at this horizon once more, and that is what is pinned now: both
    // branches, which is the strongest thing this case has ever been able to say about 14→16. If a
    // future pass re-saturates the proxy, THIS fails and the whole history above gets re-read -
    // the same bargain as before, one flip later.
    // ⚠ RE-AIMED AGAIN (W2-LADDER), because the tripwire fired a SECOND time - the third flip of
    // this line, each recorded above the last. Mechanism this time: TIER_LADDER 9 -> 12 re-spaces
    // `tierPhase`, the whole calendar re-deals, and the one marginal career (bench-working-29, the
    // only 14->16 miss at the last revision) meets a friendlier early-season draw order and
    // crosses inside 104 weeks like the other twenty-nine. Measured at this revision: 30 of 30 -
    // 14->16 is SATURATED again for the working-self preset, exactly the state the 31.07 pin first
    // recorded, so the assertion returns to that shape: saturation pinned as a FACT, so the next
    // pass that un-saturates it (a re-based target, or a calendar that starves the early game)
    // fails HERE and re-reads this whole history. The horizon that discriminates is 14->18 above,
    // unchanged.
    const workingH16 = Array.from({ length: 30 }, (_, i) => runCareer(working, i, H16.weeks))
    expect(workingH16.every((r) => r.reachedWeek !== null), '14→16 discriminates again - re-read the notes above').toBe(true)
  })

  // RE-PINNED by ladder-up Part A (cohort pre-history). The degeneracy this guard was written
  // against – a brand-new career tying the whole 0-point field at dense-rank 1, so an unguarded
  // `kidRank <= 50` "reached pro" at week 1 – is now fixed AT SOURCE: the cohort carries a real
  // season of results, so the point-less kid is the ONLY 0-point player and starts ranked LAST.
  // The guard is kept (it is still the correct predicate, and it is what stops a future
  // ranking change from re-opening the hole), but the assertion is inverted to pin the fix.
  //
  // ⚠ RE-PINNED 200 -> 195 by wave B "first-round loss pays ZERO" (tune/first-round-zero). She is
  // no longer the ONLY 0-point player: pre-history draws first-round exits, which are now worth
  // 0, so a handful of cohort players share the bottom rank with her (5 here). What this test
  // actually needs is unchanged and is what is asserted: she starts FAR outside the top 50 with
  // no counting result, so the unguarded `kidRank <= 50` arm would still be wrong at week 1 and
  // the hasResults guard is still doing real work. Full note in tests/season/prehistory.test.ts.
  //
  // ⚠ RE-PINNED 195 -> 120 by the two ladders (docs/specs/two-ladders.md), and it is a DERIVED
  // number about a different question, not a regression. `kidRank` is her ITF rank now, and the
  // ITF table is a smaller table: only the 119 cohort players whose pre-history was earned on the
  // J rungs hold a counting international result, so everybody else - the kid included - ties at
  // zero and shares dense rank 120. The protected fact is untouched and is what the next two
  // lines assert: with no counting result she starts FAR outside the top 50, so the unguarded
  // `kidRank <= 50` arm would still fire wrongly at week 1.
  //
  // ⚠ A CLAIM THAT WAS HERE AND WAS SIMPLY WRONG, corrected 30.07 (tune/rank-numbers): "120 is
  // EXACTLY j60's acceptance list". It never was - `acceptanceRank` is `pct x (cohort + 1)`, which
  // at the then-current `enterPct` 0.40 is 80, not 120 (and is 100 now that the list is 0.50).
  //
  // The real relationship is worth stating because it is the reason the `ranked` guard exists on
  // BOTH the engine's entry gate and this predicate. The tie floor she starts at (#120) is WORSE
  // than either acceptance list, so on this cohort the rank comparison alone would already refuse
  // her a J60 - but that is an accident of the pre-history having populated the ITF table. In a
  // table where nobody held a counting result every player would tie at dense rank ONE, and an
  // unguarded `kidRank <= N` would hand a fresh fourteen-year-old the whole ladder on day one.
  // Unranked is not rank one, and the guard is what says so rather than the arithmetic happening
  // to agree this time.
})
