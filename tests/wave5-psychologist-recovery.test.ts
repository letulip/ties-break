// =================================================================================================
// WAVE 5, T4 – «BACK ON HER FEET»: THE RECOVERY SLOPE, THE WEEKS HE WORKED, AND THE RECEIPT
// =================================================================================================
//
// `docs/plans/life-wave-5-builder-2026-09.md` §2 T4, the ruled numbers from
// `docs/specs/the-psychologists-year-2026-09.md` §2 («+2 / +3 / +4 per week by rung»), and the
// architect's `docs/plans/life-wave-5-rulings-2026-09.md` – ruling C (the counter and the receipt's
// test) and ruling F (the tail of `accrueSpirit` belongs to T7, so the term goes at the HEAD).
//
// ⚠⚠ WHAT T4 IS, SAID ONCE. A SUMMAND ON THE RETURN RATE, and nothing else: no second curve, no
// taper, no «recovering» flag, no second target – `accrueSpirit`'s own ⚠⚠ note names all four as the
// same mistake and they stay refused. What the focus buys is that the standing weekly walk is
// `returnPerWeek[intensity] + recoverySlope[rung]` wide instead of `returnPerWeek[intensity]` wide,
// through the same `stepToward` clamp and the same tenths rounding, on the weeks he worked.
//
// ⚠⚠ EVERY LADDER BELOW IS WRITTEN AS LITERALS, which is wave-4's own defence of its shock file and
// the reason it is repeated rather than referenced: an expectation built out of
// `ECONOMY.psychologist.recoverySlope` would FOLLOW the constant wherever a mutation put it, and the
// arm would stay green on both sides of the move. The only arithmetic here that reads a constant is
// the line that proves two spellings of the same rung agree.
//
// ⚠ THE RECEIPT'S SENTENCE IS A DRAFT (CLAUDE.md invariant 4). Nothing below asserts its prose: the
// pins assert IDENTITY between the row the engine wrote and the exported constant, so the
// архитектор's вычитка moves the draft and the test moves with it.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ⚠ EIGHT MUTATIONS, RUN 13.09.2026, CONTROL GREEN FIRST (181 then 182 passed over the five files
//   below) AND EVERY ONE UNDONE BY THE INVERSE STRING EDIT – never `git checkout` – with
//   `spirit.ts`'s md5 asserted back to pristine after every one. The discriminating set is this file
//   plus tests/spirit.test.ts, tests/wave4-spirit-shock.test.ts,
//   tests/wave5-psychologist-seat.test.ts and tests/wave5-psychologist-schema.test.ts.
//
//   ⚠⚠ THE COUNTS BELOW ARE MEASURED, AND THREE OF THE SEVEN CAME IN UNDER THEIR PREDICTION. Where
//   that happened the measurement is what is written and the reason is written beside it, because a
//   prediction that was wrong about a NET is a fact about the net rather than about the arm.
//
//     ARM 1  6 RED (12 predicted)   ARM 2  3 RED (2 before the net grew; 6 predicted)
//     ARM 3  8 RED (4 predicted)    ARM 4  2 RED (3 predicted)    ARM 5  5 RED (3 predicted)
//     ARM 6  ⚠ 0 RED – A TRUE NULL, AND THE ARM WAS THE THING THAT WAS WRONG (see below)
//     ARM 6b 2 RED – the replacement, aimed at a property nothing else held
//     ARM 7  5 RED (5 predicted – the only one that came in where it was called)
//
//   ARM 1  the slope term deleted – `rate` is `returnPerWeek[intensity]` again, the tree exactly as
//          wave 4 left it. **6 RED where 12 were predicted** · §A's two rung ladders, §C's landing
//          case and its in-step counter case, §D's exactly-half pair and §E's isolation. ⚠ THE MISS
//          IS INSTRUCTIVE: §D's three NEGATIVE cases (never-hired, under-half, laundering) all say
//          «nothing was printed», and deleting the slope prints nothing either – so a net built to
//          refuse a false receipt cannot see a missing mechanic. The positive cases are the ones
//          carrying this arm, which is the argument for §A's literal ladders existing at all.
//
//   ARM 2  ⚠⚠ THE LANDING WEEK PUT BACK IN – `shock.week >= world.week` weakened away, i.e. «the
//          slope applies while a shock is LIVE», which is what ruling C said before the architect's
//          own refinement. **2 RED where 6 were predicted**, and the miss was STRUCTURAL and was
//          REPAIRED rather than merely recorded: every fixture in §D stamped the mark on `week − 1`
//          and began walking the week AFTER, so there was no landing week inside those walks for the
//          mutation to count. §D therefore gained «THE WHOLE SHOCK, FROM THE WEEK IT LANDED», whose
//          ladder opens on the landing week – the case the arm proved was missing. **RE-RUN ON THE
//          GROWN NET: 3 RED**, the third being that new case. ⭐ That is the arm's whole value: it
//          did not find a defect in the code, it found a hole in the net.
//
//   ARM 3  the counter incremented on EVERY live week rather than on the worked ones – the two
//          predicates pulled apart, which is the shape ruling C's refinement exists to make
//          unrepresentable. **8 RED where 4 were predicted** · the extra reds are §D's positive
//          cases, whose SPANS are read against the counter, and §C's landing case reading an opened
//          counter where there should be none. ⭐ The over-count is the healthy direction: one edit,
//          two instruments (weeks and receipts), and both saw it.
//
//   ARM 4  `weeks >= 1` dropped from `recoveryReceiptEarned`. **2 RED where 3 were predicted** ·
//          §C's land-and-clear case and §D's boundary table. ⚠ THE THIRD PREDICTION WAS SIMPLY WRONG
//          ABOUT THE ARITHMETIC and the correction is worth keeping: §D's never-hired case does NOT
//          go red, because a shock nobody worked has `weeks = 0` against a span above zero and
//          `0 * 2 >= span` is already false. **`weeks >= 1` is load-bearing at a span of ZERO and
//          nowhere else**, which is exactly what §C's land-and-clear case is built to be.
//
//   ARM 5  the receipt printed at the clear unconditionally (the test dropped). **5 RED where 3
//          were predicted** · the three «nothing was printed» cases plus the two that count rows,
//          which see a SECOND receipt appear where there should be one.
//
//   ARM 6  the receipt read AFTER `world.spiritShock = null` (the two statements swapped).
//          ⚠⚠ **0 RED – A TRUE NULL, AND THE ARM WAS THE THING THAT WAS WRONG.** It is recorded
//          rather than quietly replaced, on wave-4's ARM 10 precedent («a green arm is a claim about
//          the MUTATION until you have read what it actually changed»). What it changed: nothing.
//          The receipt reads the CAPTURED LOCAL `shock`, not `world.spiritShock`, so the local still
//          points at the record after the field is nulled and the order of those two statements is
//          genuinely free. ⭐ THE ARM EARNED ITS KEEP ANYWAY: `accrueSpirit` carried a comment
//          asserting the opposite («read BEFORE the nulling, the only order that works»), and a
//          comment that contradicts its own code is the defect this codebase keeps paying for. The
//          note now says what is true, and names the thing that IS load-bearing – the counter living
//          on the record rather than in a variable the function throws away (ARM 3's ground).
//
//   ARM 6b THE REPLACEMENT, aimed at a property nothing else in the file held: the receipt stamped
//          on `shock.week` – the week the mark LANDED – instead of `world.week`, the week it came
//          off. A plausible off-by-a-whole-recovery that puts the sentence in the feed beside the
//          break-up it is supposed to be the end of. **2 RED** · §D's row case (which reads the
//          stamp against the week the walk saw the mark come off) and §D's whole-shock case.
//
//   ARM 7  the slope read from the DEFAULT rung rather than the family's (`recoverySlope[defaultRung]`
//          hard-coded). **5 RED, as predicted** · §A's rung-0 and rung-2 ladders on both intensities.
//          ⚠ RUNG 1 IS GREEN UNDER IT BY CONSTRUCTION, which is the reason §A walks all three rungs
//          instead of «the default and one other».
//
// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, wave 4's and T2's §B apparatus, verbatim. Every
// call is delegated to the real `rngFromSeed`, so any number this file measures is the engine's own;
// the mock exists only so §B can COUNT the keys the pass reached. Hoisted, because `vi.mock`'s
// factory is lifted above the imports.
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { createHash } from 'node:crypto'
import {
  accrueSpirit,
  recoveryReceiptEarned,
  temperamentFor,
  RECOVERY_RECEIPT,
  TEMPERAMENTS,
  type Temperament,
} from '../src/engine/spirit'
import { createWorld, psychologistRungOf, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { isBlackoutWeek } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { birthdayTurning } from '../src/engine/world/age'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

// -------------------------------------------------------------------------------------------------
// FIXTURES – wave 4's shock doctrine, and the seat poked rather than hired
// -------------------------------------------------------------------------------------------------

/** Does `week` fire NO row of the perturbation table for this girl? `tests/wave4-spirit-shock.test.ts`'s
 *  `quietWeek`, transcribed for its own reason: every expectation below is a LITERAL, so the weeks it
 *  is read on have to be weeks where the shock and the seat are the only things that happened. */
function quietWeek(world: WorldState, w: number): boolean {
  const over = schoolIsOver(w, world.profile.birthMonth)
  return !isBlackoutWeek(w, over) && birthdayTurning(w, world.profile.birthMonth, world.profile.birthDay) === null
}

/** The first week at or after `from` that opens a `run`-week stretch firing no perturbation row.
 *  ⚠ THROWS rather than returning a week it did not find – the marker helpers' own discipline: a
 *  fixture that silently hands back a noisy run makes every literal below a lie about what it read. */
function quietRunFrom(world: WorldState, from: number, run: number): number {
  for (let w = from; w < from + 900; w++) {
    let ok = true
    for (let k = 0; k < run; k++) if (!quietWeek(world, w + k)) { ok = false; break }
    if (ok) return w
  }
  throw new Error(`no ${run}-week quiet run after ${from}`)
}

/**
 * A girl carrying a shock from LAST week, on a quiet run, with the seat in whatever state the case
 * is about.
 *
 * ⚠⚠ THE SHOCK IS POKED AND THE ROLL IS NOT UNDER TEST HERE, which is wave 3's and wave 4's shared
 * fixture doctrine read the right way round: `rollEnds` writing the mark is
 * tests/wave4-spirit-shock.test.ts §C's claim and is walked there through the hazard's own dice.
 * What T4 adds is arithmetic ON a mark, so the mark is posed and the arithmetic is walked.
 *
 * ⚠ `shock.week` IS `week − 1` ON PURPOSE: the landing week is the one week the slope must NOT apply
 * (the one predicate, §C), so a fixture that stamped the current week would silently measure a
 * different claim in every case that is not about the landing week.
 */
function carrying(
  seed: string,
  temperament: Temperament,
  spirit: number,
  seat: { hired: boolean; rung?: 0 | 1 | 2; focus?: 'recovery' | 'coolhead' | null },
  run = 22,
): { world: WorldState; week: number } {
  const world = createWorld(seed)
  world.temperament = temperament
  const week = quietRunFrom(world, 400, run)
  world.week = week
  world.spirit = spirit
  world.spiritShock = { week: week - 1, kind: 'breakup' }
  world.psychologistHired = seat.hired
  if (seat.rung !== undefined) world.psychologistRung = seat.rung
  world.psychologistFocus = seat.focus ?? null
  return { world, week }
}

/** Walk `weeks` ticks of the weekly rule and hand back the spirit ladder, the weeks the mark was
 *  live, and every receipt row the walk produced. */
function walk(world: WorldState, from: number, weeks: number) {
  const spirit: number[] = []
  const live: boolean[] = []
  for (let k = 0; k < weeks; k++) {
    world.week = from + k
    accrueSpirit(world)
    spirit.push(world.spirit)
    live.push(world.spiritShock !== null)
  }
  return { spirit, live, receipts: world.events.filter((e) => e.text === RECOVERY_RECEIPT) }
}

/** Walk the shock to its clear with the payroll driven week by week, and report what the receipt
 *  machinery saw. ⚠ The counter is read off the mark BEFORE the clear nulls it, which is the only
 *  place it can be read from outside the pass. */
function walkToClear(world: WorldState, from: number, hired: (k: number) => boolean, limit = 22) {
  for (let k = 0; k < limit; k++) {
    world.week = from + k
    world.psychologistHired = hired(k)
    const before = world.spiritShock
    accrueSpirit(world)
    if (before !== null && world.spiritShock === null) {
      return {
        clearedAt: from + k,
        span: from + k - before.week,
        weeks: before.weeks ?? 0,
        receipts: world.events.filter((e) => e.text === RECOVERY_RECEIPT),
        world,
      }
    }
  }
  throw new Error('the shock never cleared inside the quiet run')
}

// =================================================================================================
// A. ⭐⭐⭐ THE SLOPE – +2 / +3 / +4 A WEEK BY RUNG, ON TOP OF HER OWN RETURN RATE
// =================================================================================================
//
// ⚠⚠ THE SEAT-EMPTY LADDERS ARE WAVE 4's OWN, TRANSCRIBED, and that is the control arm the brief asks
// for said in numbers rather than in prose: «with the seat empty the whole recovery is byte-identical
// to wave-4's». tests/wave4-spirit-shock.test.ts §D measured `48 53 58 63 68 70…` for a steady girl
// and `38 41 44 47 50 53 56 59 62 65 68 70` for an intense one, from a lifted 75 through the shock;
// these start from the post-shock value instead of walking the shock again, so the first entry is the
// week AFTER the one that file's ladder opens on.
describe('wave 5 T4 A – the recovery slope, by rung and by intensity', () => {
  it('⭐ the table is the spec’s: +2 / +3 / +4, one number per rung, and it is RULED rather than proposed', () => {
    expect(ECONOMY.psychologist.recoverySlope).toEqual([2, 3, 4])
    // ...and the ladder is strictly monotone in the rung, which is the property T10's grid measures
    // on weeks-under-the-knee and the masseur §4 law re-prices the rung for. If the arithmetic could
    // not produce it, the grid would be measuring a ladder that does not exist.
    const slope = ECONOMY.psychologist.recoverySlope
    expect(slope[0], 'each rung is faster than the one below').toBeLessThan(slope[1])
    expect(slope[1]).toBeLessThan(slope[2])
    // ...and one number per rung of the roster, so no rung can be sold without a speed.
    expect(slope.length).toBe(ECONOMY.psychologist.rungs.length)
  })

  it('⭐⭐⭐ A STEADY GIRL – the seat-empty ladder is wave 4’s, and each rung walks her home faster', () => {
    // The four ladders, from the same 48 on the same quiet run. Every number a literal.
    const LADDER: Record<string, number[]> = {
      empty: [53, 58, 63, 68, 70, 70, 70],
      rung0: [55, 62, 69, 70, 70, 70, 70], // 5 + 2
      rung1: [56, 64, 70, 70, 70, 70, 70], // 5 + 3
      rung2: [57, 66, 70, 70, 70, 70, 70], // 5 + 4
    }
    const empty = carrying('t4-steady-empty', 'sunny', 48, { hired: false })
    expect(walk(empty.world, empty.week, 7).spirit, '⚠⚠ THE CONTROL: byte for byte wave 4’s own return rule')
      .toEqual(LADDER.empty)
    for (const rung of [0, 1, 2] as const) {
      const { world, week } = carrying(`t4-steady-${rung}`, 'sunny', 48, { hired: true, rung, focus: 'recovery' })
      expect(walk(world, week, 7).spirit, `rung ${rung}`).toEqual(LADDER[`rung${rung}`])
    }
  })

  it('⭐⭐⭐ AN INTENSE GIRL – the same three steps on a 3-a-week return, where the ladder is long enough to read', () => {
    const LADDER: Record<string, number[]> = {
      empty: [41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 70, 70],
      rung0: [43, 48, 53, 58, 63, 68, 70, 70, 70, 70, 70, 70], // 3 + 2
      rung1: [44, 50, 56, 62, 68, 70, 70, 70, 70, 70, 70, 70], // 3 + 3
      rung2: [45, 52, 59, 66, 70, 70, 70, 70, 70, 70, 70, 70], // 3 + 4
    }
    const empty = carrying('t4-intense-empty', 'deep', 38, { hired: false })
    expect(walk(empty.world, empty.week, 12).spirit, '⚠⚠ THE CONTROL: byte for byte wave 4’s own return rule')
      .toEqual(LADDER.empty)
    for (const rung of [0, 1, 2] as const) {
      const { world, week } = carrying(`t4-intense-${rung}`, 'deep', 38, { hired: true, rung, focus: 'recovery' })
      const walked = walk(world, week, 12)
      expect(walked.spirit, `rung ${rung}`).toEqual(LADDER[`rung${rung}`])
      // ⚠ AND THE MARK COMES OFF SOONER, which is what the ladder is FOR – the receipt's own claim
      // measured as a week count rather than taken from the sentence.
      expect(walked.live.indexOf(false), `rung ${rung}: the first week the mark is off`)
        .toBeLessThan(LADDER.empty.indexOf(70))
    }
  })

  it('⭐⭐ IT IS THE RATE AND NEVER THE TARGET – the slope cannot carry her one tenth past her baseline', () => {
    // ⚠⚠ THE DIFFERENCE BETWEEN A FASTER RETURN AND A SECOND MECHANIC, as a case rather than as a
    // comment. One point under the bar, at the fastest rung: the standing `stepToward` clamp caps the
    // step at the GAP, so she lands exactly on 70 and the other six points of the rung-2 rate are
    // simply not spent.
    const { world, week } = carrying('t4-clamp', 'sunny', 69, { hired: true, rung: 2, focus: 'recovery' })
    world.week = week
    accrueSpirit(world)
    expect(world.spirit, 'a 9-wide step into a 1-wide gap still lands on 70').toBe(70)
    // ...and from the baseline itself, a held focus moves nothing at all.
    const settled = carrying('t4-clamp-settled', 'sunny', 70, { hired: true, rung: 2, focus: 'recovery' })
    settled.world.week = settled.week
    accrueSpirit(settled.world)
    expect(settled.world.spirit, 'nothing to walk back from, nothing bought').toBe(70)
  })

  it('⚠ EVERY OTHER FOCUS IS THE EMPTY SEAT for this pass – the slot’s opportunity cost, made arithmetic', () => {
    // The spec's «focus effects never stack – one focus per year is the whole point». A family paying
    // the top rung for a DIFFERENT year gets wave 4's recovery exactly.
    const EMPTY = [53, 58, 63, 68, 70, 70, 70]
    for (const focus of ['coolhead', null] as const) {
      const { world, week } = carrying(`t4-other-${focus}`, 'sunny', 48, { hired: true, rung: 2, focus })
      expect(walk(world, week, 7).spirit, `focus ${focus}: the standing rule and nothing else`).toEqual(EMPTY)
    }
  })
})

// =================================================================================================
// B. ⚠⚠ ZERO DRAWS – the slope is pure arithmetic, proven with a key COUNTER and a positive control
// =================================================================================================
//
// The wave-4 §0.1 law: a stream-alignment test on per-week keys holds by construction and proves
// nothing. What proves it is a counter the code cannot see, plus a control that says the counter
// works. T2 §B built this shape for the seat; this is the same instrument aimed at the pass.
describe('wave 5 T4 B – the recovery focus takes ZERO draws, on any stream', () => {
  it('⭐⭐ a whole shock walked to its clear, at every rung, on no stream at all', () => {
    for (const rung of [0, 1, 2] as const) {
      const { world, week } = carrying(`t4-zero-${rung}`, 'deep', 38, { hired: true, rung, focus: 'recovery' })
      rngKeys.length = 0 // `createWorld` and the quiet-run search legitimately derive; this is about the pass.
      const walked = walk(world, week, 12)
      expect(walked.receipts.length, 'the arm really ran to a clear and printed').toBe(1)
      expect(rngKeys, `rung ${rung}: the slope, the counter and the receipt on no stream`).toEqual([])
    }
  })

  it('⭐⭐ ...and the INELIGIBLE weeks derive nothing either – the short-circuit, not just the quiet path', () => {
    // ⚠ THE HALF THE COUNT-KEYS LAW IS ACTUALLY ABOUT: a pass that drew only when it was eligible
    // would pass the case above and still make a career's stream position depend on who was hired.
    const states: { hired: boolean; focus: 'recovery' | 'coolhead' | null }[] = [
      { hired: false, focus: null },
      { hired: false, focus: 'recovery' },
      { hired: true, focus: null },
      { hired: true, focus: 'coolhead' },
    ]
    for (const seat of states) {
      const { world, week } = carrying(`t4-zero-off-${seat.hired}-${seat.focus}`, 'sunny', 48, { hired: seat.hired, rung: 1, focus: seat.focus })
      rngKeys.length = 0
      walk(world, week, 7)
      expect(rngKeys, `hired=${seat.hired} focus=${seat.focus}`).toEqual([])
    }
  })

  it('⭐⭐ THE POSITIVE CONTROL – `temperamentFor`, the one draw this module has ever owned, IS counted', () => {
    // ⚠⚠ WITHOUT THIS THE TWO CASES ABOVE ARE UNFALSIFIABLE. The control is deliberately a function of
    // `engine/spirit.ts` itself, reached through the very import the recorder replaces – so a mock
    // that had stopped seeing this module's stream would fail HERE rather than pass everywhere.
    rngKeys.length = 0
    temperamentFor('t4-control')
    expect(rngKeys, 'the recorder can see this module draw').toEqual(['t4-control:temperament'])
    // ...and `accrueSpirit` reaches the same function on a world with no temperament, which is the
    // ONE key the weekly pass has ever been able to produce – proof the counter is watching the pass
    // and not merely the module.
    const world = createWorld('t4-control-pass')
    delete (world as Partial<WorldState>).temperament
    world.week = quietRunFrom(world, 400, 2)
    rngKeys.length = 0
    accrueSpirit(world)
    expect(rngKeys, 'the courtesy read, and nothing the focus added').toEqual([`${world.seed}:temperament`])
  })
})

// =================================================================================================
// C. ⚠⚠ THE ONE PREDICATE – the landing week is not worked, and the counter counts what the term spent
// =================================================================================================
//
// The architect's refinement to ruling C, and it is ONE predicate rather than two because the two
// sentences («the slope applies while a shock is live» and «the counter counts the weeks it applied»)
// name different sets. The landing week is the difference and it matters twice: the return runs off
// LAST week's value, before this week's shock lands (the 09.09 ORDER FIX), and a shock can land and
// clear inside one week.
describe('wave 5 T4 C – the week a shock lands is not a week anybody worked', () => {
  it('⚠⚠ THE LANDING WEEK: no slope, no count – she is under her line for something that has not happened yet', () => {
    // ⚠ THE FIXTURE STAMPS THE SHOCK ON **THIS** WEEK, which is what `rollEnds` does four calls
    // earlier in the same tick. A girl already at 60 for other reasons, with the top rung held.
    const world = createWorld('t4-landing')
    world.temperament = 'sunny'
    const week = quietRunFrom(world, 400, 4)
    world.week = week
    world.spirit = 60
    world.spiritShock = { week, kind: 'breakup' }
    world.psychologistHired = true
    world.psychologistRung = 2
    world.psychologistFocus = 'recovery'
    accrueSpirit(world)
    // 60 returns 5 toward 70 and then takes the steady shock: 65 − 22 = 43. WITH the slope it would
    // have been 69 − 22 = 47 – a real speed-up of a recovery from something else entirely.
    expect(world.spirit, 'her own return rate, and not one point of his').toBe(43)
    expect(world.spiritShock?.weeks, '⭐ and the counter never opened – absent, not zero').toBeUndefined()
    // ...and from the NEXT week it is his to work, which is what makes the case above a boundary and
    // not a switch that is simply off.
    world.week = week + 1
    accrueSpirit(world)
    expect(world.spirit, 'her 5 plus the top rung’s 4, from 43').toBe(52)
    expect(world.spiritShock?.weeks, 'the first week he is credited with').toBe(1)
  })

  it('⚠⚠ LAND AND CLEAR IN ONE WEEK: the span is 0, and NOTHING is printed for it', () => {
    // ⚠⚠ THE WORLD THE `weeks >= 1` GUARD EXISTS FOR, and it is posed rather than walked because the
    // route to it is narrow – MEASURED here rather than asserted: a steady girl needs to be at 95 or
    // more when the mark lands (94 returns to 89 and 89 − 22 = 67, one point under the bar), and an
    // INTENSE girl cannot reach it on a quiet week at all, because 100 returns to 97 and 97 − 34 = 63.
    // Without the guard `0 * 2 >= 0` is true and the receipt prints for work nobody did.
    const world = createWorld('t4-land-and-clear')
    world.temperament = 'sunny'
    const week = quietRunFrom(world, 400, 4)
    world.week = week
    world.spirit = 95
    world.spiritShock = { week, kind: 'breakup' }
    world.psychologistHired = true
    world.psychologistRung = 2
    world.psychologistFocus = 'recovery'
    accrueSpirit(world)
    expect(world.spirit, '95 returns to 90 and the shock takes it to exactly the bar').toBe(68)
    expect(world.spiritShock, 'so it lands and clears inside one tick').toBeNull()
    expect(world.events.filter((e) => e.text === RECOVERY_RECEIPT), '⭐ and nobody is thanked for it').toEqual([])
    // ...the neighbouring world that does NOT clear, so the case above is a boundary and not a world
    // that happens to be quiet.
    const under = createWorld('t4-land-and-clear-under')
    under.temperament = 'sunny'
    under.week = quietRunFrom(under, 400, 4)
    under.spirit = 94
    under.spiritShock = { week: under.week, kind: 'breakup' }
    accrueSpirit(under)
    expect(under.spirit, 'one point lower and the mark stays on').toBe(67)
    expect(under.spiritShock, 'the mark survives its own setting tick, as wave 4 pinned').not.toBeNull()
  })

  it('⚠⚠ THE COUNTER COUNTS EXACTLY THE WEEKS THE TERM WAS SPENT – asserted week by week, not at the end', () => {
    // ⚠⚠ THE CLAIM THE «ONE PREDICATE» SHAPE IS FOR. A total at the clear could be right while the two
    // conditions disagreed about which weeks; this reads BOTH instruments on every tick, from a world
    // whose payroll goes on and off under the mark.
    const { world, week } = carrying('t4-in-step', 'deep', 38, { hired: false, rung: 1, focus: 'recovery' })
    const paid = [false, true, true, false, true]
    let expected = 0
    for (let k = 0; k < paid.length; k++) {
      world.week = week + k
      world.psychologistHired = paid[k]
      const before = world.spirit
      accrueSpirit(world)
      if (paid[k]) expected++
      // the step she actually took says whether the term was spent: 3 alone, 6 with rung 1's slope
      expect(world.spirit - before, `week +${k}: the step`).toBe(paid[k] ? 6 : 3)
      expect(world.spiritShock?.weeks ?? 0, `week +${k}: the counter`).toBe(expected)
    }
  })

  it('⚠ THE RUNG THE SLOPE READS IS THE RUNG THE BILL READS – two spellings, one roster', () => {
    // ⚠ THE ONE PLACE THIS FILE DOES ARITHMETIC OFF A CONSTANT, and it is here because the two
    // spellings genuinely are two: `recoverySlope` is an ARRAY indexed by the roster position and
    // `psychologistRungOf` hands back the roster ROW. A mutation that read the slope from the default
    // rung, or off by one, is what this refuses.
    for (const rung of [0, 1, 2] as const) {
      const world = createWorld(`t4-rung-${rung}`)
      world.psychologistRung = rung
      expect(psychologistRungOf(world), 'the bill reads this person').toBe(ECONOMY.psychologist.rungs[rung])
      expect(ECONOMY.psychologist.recoverySlope[rung], 'and the slope reads that person’s speed')
        .toBe([2, 3, 4][rung])
    }
  })
})

// =================================================================================================
// D. ⭐⭐ THE RECEIPT – «he worked it», and the code that checks exactly that
// =================================================================================================
//
// Ruling C: the sentence prints iff `weeks >= 1 && weeks * 2 >= world.week - shock.week`. The half
// this section is really about is the one the ruling rejected the cheap proxy over: a parent who
// fires him for the shock and re-hires at the clear must read differently from one who paid
// throughout, and the proxy (`psychologistFocusSeason` plus «on the payroll today») cannot tell them
// apart.
describe('wave 5 T4 D – the receipt counts the weeks he actually worked', () => {
  it('⭐⭐⭐ HELD FOR EXACTLY HALF PRINTS; ONE WEEK LESS PRINTS NOTHING – the same girl, the same shock', () => {
    // ⚠⚠ AN ADJACENT PAIR, WALKED RATHER THAN POSED, and adjacency is what makes it a boundary: the
    // only thing that differs is the week the parent hired him.
    const half = walkToClear(
      carrying('t4-half', 'deep', 38, { hired: false, rung: 2, focus: 'recovery' }).world,
      quietRunFrom(createWorld('t4-half'), 400, 22),
      (k) => k >= 3,
    )
    expect({ span: half.span, weeks: half.weeks }, 'three weeks of a six-week mark – exactly half')
      .toEqual({ span: 6, weeks: 3 })
    expect(half.receipts.length, '⭐ the bar is «at least half», so half prints').toBe(1)

    const under = walkToClear(
      carrying('t4-under', 'deep', 38, { hired: false, rung: 2, focus: 'recovery' }).world,
      quietRunFrom(createWorld('t4-under'), 400, 22),
      (k) => k >= 4,
    )
    expect({ span: under.span, weeks: under.weeks }, 'three weeks of a seven-week mark – under half')
      .toEqual({ span: 7, weeks: 3 })
    expect(under.receipts, '⭐ and one week later, nothing is claimed').toEqual([])
  })

  it('⚠⚠ FIRE-AND-RE-HIRE CANNOT MANUFACTURE IT – the hole ruling C exists to close', () => {
    // The parent lets him go the week the mark lands and puts him back on the payroll at the clear.
    // The cheap proxy reads TRUE on this world – a focus is set and he is on the payroll today – and
    // the counter reads 1 against a span of ten.
    const week = quietRunFrom(createWorld('t4-launder'), 400, 22)
    const out = walkToClear(
      carrying('t4-launder', 'deep', 38, { hired: false, rung: 2, focus: 'recovery' }).world,
      week,
      (k) => k >= 9,
    )
    expect(out.receipts, '⭐⭐ nothing is printed for a year nobody paid for').toEqual([])
    // ...and the proxy the ruling rejected really would have printed, which is what makes this case
    // about the MECHANISM rather than about a world that happens to be quiet.
    expect(out.world.psychologistHired, 'he IS on the payroll at the clear').toBe(true)
    expect(out.world.psychologistFocus, 'and the year IS set to recovery').toBe('recovery')
    expect(out.weeks * 2, `${out.weeks} weeks doubled is under the ${out.span}-week span`).toBeLessThan(out.span)
  })

  it('⭐⭐⭐ THE WHOLE SHOCK, FROM THE WEEK IT LANDED – the span the receipt is read against, walked', () => {
    // ⚠⚠ THIS CASE WAS ADDED BECAUSE A MUTATION SAID THE SECTION NEEDED IT, which is the only reason
    // worth adding a case for. ARM 2 (the landing week counted) came in at 2 RED where 6 were
    // predicted, and the miss was structural: every other fixture here stamps the mark on `week − 1`
    // and starts walking the week AFTER, so there is no landing week inside the walk for the mutation
    // to count. The receipt's span arithmetic was therefore never once measured against a shock this
    // file had watched arrive.
    //
    // An intense girl at 60 – under her line for something else – takes the ending on week w:
    //
    //   w    stepToward(60, 70, 3) = 63, then −34            ->  29   (the landing week: NO slope)
    //   w+1  29 + 3 + 4 (rung 2)                             ->  36
    //   w+2..w+6  the same seven-wide step                   ->  43 50 57 64 70 – the bar at w+6
    //
    // span = 6, weeks = 6 (w+1 … w+6, and never w), 12 >= 6, so the receipt prints.
    const world = createWorld('t4-from-the-landing')
    world.temperament = 'deep'
    const week = quietRunFrom(world, 400, 12)
    world.week = week
    world.spirit = 60
    world.spiritShock = { week, kind: 'breakup' }
    world.psychologistHired = true
    world.psychologistRung = 2
    world.psychologistFocus = 'recovery'
    const walked = walk(world, week, 8)
    expect(walked.spirit, 'the landing week at her own rate, then his').toEqual([29, 36, 43, 50, 57, 64, 70, 70])
    expect(walked.receipts.length, 'and the year is credited').toBe(1)
    expect(walked.receipts[0].week - week, 'the mark came off six weeks after it landed').toBe(6)
  })

  it('⚠ A SHOCK NOBODY WORKED PRINTS NOTHING, and the counter never opens at all', () => {
    const { world, week } = carrying('t4-never', 'deep', 38, { hired: false })
    const walked = walk(world, week, 12)
    expect(walked.live.indexOf(false), 'the mark really did come off inside the walk').toBeGreaterThan(0)
    expect(walked.receipts, 'nothing was bought, so nothing is claimed').toEqual([])
  })

  it('⭐⭐ THE BAR ITSELF – `recoveryReceiptEarned`, over the table ruling C wrote', () => {
    // ⚠ THE ENGINE'S OWN PREDICATE, asked directly, so the boundary is pinned once at the arithmetic
    // rather than five times through worlds that have to be built to land on it.
    const at = (weeks: number | undefined, span: number) =>
      recoveryReceiptEarned({ week: 100, kind: 'breakup', ...(weeks === undefined ? {} : { weeks }) }, 100 + span)
    expect(at(undefined, 0), 'a shock that predates the counter, cleared on its own week').toBe(false)
    expect(at(0, 6), 'a focus that was never held').toBe(false)
    expect(at(undefined, 6), '...and absent reads the same as zero').toBe(false)
    expect(at(3, 6), '⭐ exactly half').toBe(true)
    expect(at(3, 7), '⭐ one week short of half').toBe(false)
    expect(at(4, 7), 'over half').toBe(true)
    expect(at(6, 6), 'every week of it').toBe(true)
    expect(at(1, 0), '⚠ a one-week span he did work – the only span-0 world the guard lets through').toBe(true)
  })

  it('⭐⭐ THE ROW – one line, no figure, at the clear week, and it is the exported draft', () => {
    const { world, week } = carrying('t4-row', 'deep', 38, { hired: true, rung: 2, focus: 'recovery' })
    const before = world.events.length
    const walked = walk(world, week, 12)
    expect(walked.receipts.length, 'exactly one, at the clear and not once a week').toBe(1)
    const row = walked.receipts[0]
    // ⚠⚠ RULE 5 OF THE WAVE-3 LAWS – a life beat is never a purchase. No `amountCents`, so nothing
    // reaches `accrueFinance`, and no figure in the sentence.
    expect(row.amountCents, 'no cents on it').toBeUndefined()
    expect(row.category, 'and no ledger category – it is not a bill').toBeUndefined()
    expect(row.text, '⚠ INVARIANT 4: identity with the constant, never the prose').toBe(RECOVERY_RECEIPT)
    expect(row.text, 'no digits in a receipt').not.toMatch(/[0-9]/)
    expect(row.text, 'the short dash only').not.toContain('—')
    expect(row.week, 'stamped on the week the mark came off').toBe(walked.live.indexOf(false) + week)
    // ⚠⚠ AND IT IS NOT A `'life'` ROW – MEASURED, NOT PREFERRED. `tests/wave4-life-row-stamp.test.ts`
    // §A is a LAW («no `'life'` row leaves this layer without a kind») enforced at every write site
    // in the world module set, and the kinds it admits are `LIFE_BEAT_ROW_KINDS` = met / ended. This
    // receipt has no life-beat kind and must not invent one (the wave brief's §0.5 binds the shape of
    // `lifeBeat.ts`), so it takes the tree's own precedent for a row that is about the layer but is
    // not a beat: `answerLifeBeat`'s `'info'` row, pinned in that same file as «deliberately NOT a
    // life row, and therefore deliberately unstamped». `resolveMasseurReturn` – the other seat's
    // no-cents receipt – is the same idiom one seat over.
    expect(row.type, 'an info row, like the masseur’s own receipt').toBe('info')
    expect(row.lifeKind, 'and it carries no life-beat kind, because it is not one').toBeUndefined()
    expect(world.events.length - before, 'one row and no other').toBe(1)
  })
})

// =================================================================================================
// E. ⚠⚠ THE CONTROL ARM IN CODE – a WALKED CAREER, key by key, with the seat empty
// =================================================================================================
//
// The brief's own words: «with the seat empty the whole recovery is byte-identical to wave-4's – the
// control arm in code, not only in the bench». §A says it in spirit ladders; this says it over a real
// career's whole world, which is the only place a key nobody thought about can show up.
//
// ⚠ THE WALK IS THE FROZEN CORPUS'S OWN (`tools/econ-bench`, `openCareer` + `stepCareerWeek`) – the
// same apparatus `tests/coachTravelEdgeFixtures.ts` uses, so what is walked here is a career the
// engine really produces rather than a probe world with a week counter.
describe('wave 5 T4 E – with the seat empty, a walked career is byte-identical, key by key', () => {
  /** Every top-level key of a world, hashed – `tools/frozen-key-diff.ts`'s own instrument. */
  function keyHashes(world: WorldState): Record<string, string> {
    const record = world as unknown as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const key of Object.keys(record).sort()) {
      out[key] = createHash('sha256').update(JSON.stringify(record[key] ?? null)).digest('hex').slice(0, 12)
    }
    return out
  }

  /**
   * Open a career, walk it in, park a mark on her, and walk on with the seat in a given state –
   * hashing every top-level key AFTER EVERY WEEK.
   *
   * ⚠⚠ THE TRAJECTORY AND NOT THE END STATE, AND THAT IS A MEASURED CORRECTION RATHER THAN A
   * PREFERENCE. The first shape of this pin hashed the final world, `tools/frozen-key-diff.ts`'s own
   * instrument – and it went red saying `spirit` had NOT moved between an idle seat and a working
   * one. It had not: spirit RETURNS TO ITS BASELINE, so twenty weeks after a shock both arms are
   * sitting on the same 70 and a final-state hash cannot see that one of them got there four weeks
   * sooner. A converging quantity hides its own history from a terminal diff, which is worth writing
   * down because the frozen corpus is diffed exactly that way and would be blind to the same defect.
   */
  function career(seat: (world: WorldState) => void, weeks = 20): { weekly: Record<string, string>[]; world: WorldState } {
    const { world, rng } = openCareer(PRESETS[0], 0, POLICIES[1])
    for (let w = 0; w < 120; w++) stepCareerWeek(world, rng, POLICIES[1])
    world.spirit = 40
    world.spiritShock = { week: world.week, kind: 'breakup' }
    seat(world)
    const weekly: Record<string, string>[] = []
    for (let w = 0; w < weeks; w++) {
      stepCareerWeek(world, rng, POLICIES[1])
      weekly.push(keyHashes(world))
    }
    return { weekly, world }
  }

  /** Which top-level keys differ between two walks, at ANY week of them. */
  function movedKeys(a: Record<string, string>[], b: Record<string, string>[], skip: string[] = []): string[] {
    const out = new Set<string>()
    for (let w = 0; w < a.length; w++) {
      for (const key of Object.keys(a[w])) {
        if (!skip.includes(key) && a[w][key] !== b[w][key]) out.add(key)
      }
    }
    return [...out].sort()
  }

  // ⚠ 60 s, NOT THE 20 s DEFAULT, AND IT IS THE NEIGHBOURS' OWN IDIOM RATHER THAN A WEAKENING:
  // tests/wave4-spirit-shock.test.ts carries `}, 60_000)` on every case that walks the engine.
  // These three open a real career and step it through `stepCareerWeek` – 280 walked weeks for the
  // pair of arms – and the first gate run of this commit blew the default under contention (48 unit
  // tests timed out across 33 files, ZERO assertion failures, on a machine at load 28). The budget
  // moves; not one assertion does.
  it('⭐⭐⭐ AN EMPTY SEAT AND AN ABSENT ONE ARE THE SAME PROGRAM – every key, every week, twenty weeks', () => {
    // ⚠⚠ THE HONEST CONTROL AVAILABLE IN ONE TREE. «Byte-identical to wave-4's» cannot be measured
    // against wave-4's tree from inside this one – so it is measured against the world SHAPE wave 4
    // had: the three seat fields DELETED, which is what a v75 save carries and what the `??`
    // courtesies in `shockBeingWorked` exist for. If T4's term could fire on a career with no seat,
    // these two walks would diverge on some week.
    const SEAT = ['psychologistHired', 'psychologistFocus', 'psychologistRung']
    const empty = career(() => {})
    const absent = career((world) => {
      for (const key of SEAT) delete (world as unknown as Record<string, unknown>)[key]
    })
    expect(movedKeys(empty.weekly, absent.weekly, SEAT), '⚠⚠ a career with no psychologist in it walks identically')
      .toEqual([])
    expect(SEAT.filter((k) => k in absent.weekly[0]), 'the absent arm really was absent').toEqual([])
    expect(Object.keys(empty.weekly[0]).length, 'and the sweep really saw a populated world').toBeGreaterThan(50)
    // ...and the walk really carried a shock through, so the identity above is a claim about the
    // recovery and not about two worlds where nothing happened.
    expect(empty.world.spiritShock, 'the mark came off inside the walk').toBeNull()
  }, 60_000)

  it('⭐⭐⭐ THE ISOLATION – a HIRED seat on the recovery year moves FOUR keys and no others', () => {
    // ⚠⚠ BOTH ARMS PAY THE SAME SALARY, which is what makes this about the SLOPE rather than about
    // the seat: hired with no year chosen is a legal state (the first pick is free and is still
    // available), so the bill, the funds and the finance ledger are identical on both sides and the
    // only thing that differs is the term T4 added. ⚠ `psychologistFocus` is skipped because it IS
    // the difference between the arms rather than a consequence of it.
    const idle = career((world) => {
      world.psychologistHired = true
      world.psychologistRung = 2
      world.psychologistFocus = null
    })
    const working = career((world) => {
      world.psychologistHired = true
      world.psychologistRung = 2
      world.psychologistFocus = 'recovery'
    })
    expect(movedKeys(idle.weekly, working.weekly, ['psychologistFocus']), '⭐⭐ the whole footprint of «Back on her feet», named')
      .toEqual([
        'events', // the receipt row
        'nextEventId', // ...and the id it took
        'spirit', // the faster walk home
        'spiritShock', // which comes off sooner, and carries the counter while it is on
      ])
    // ...and the positive control for that negative: the arm really did print, so «four keys» is a
    // measurement of a walk that did something rather than of two quiet worlds.
    expect(working.world.events.filter((e) => e.text === RECOVERY_RECEIPT).length, 'the walked career cleared and printed').toBe(1)
    expect(idle.world.events.filter((e) => e.text === RECOVERY_RECEIPT), '...and the idle seat printed nothing').toEqual([])
  }, 60_000)

  it('⚠ ALL FOUR TEMPERAMENTS WALK THE EMPTY SEAT’S OWN LADDER – the control, over the whole roster', () => {
    // ⚠ §A reads two of the four because the intensity axis has two poles; this reads all four, so a
    // term that fired on one bucket and not another cannot hide behind a representative.
    for (const t of TEMPERAMENTS) {
      const intense = t === 'fiery' || t === 'deep'
      const { world, week } = carrying(`t4-roster-${t}`, t, intense ? 38 : 48, { hired: false })
      const walked = walk(world, week, 6)
      const rate = intense ? 3 : 5
      const start = intense ? 38 : 48
      expect(walked.spirit, `${t}: her own rate and nothing else`)
        .toEqual([0, 1, 2, 3, 4, 5].map((k) => Math.min(70, start + rate * (k + 1))))
    }
  }, 60_000)
})
