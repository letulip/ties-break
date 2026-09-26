// =================================================================================================
// ⭐⭐⭐ B-01 / T2.3 – THE COLLEGE YEAR PAUSES FOR A BLOCKING BEAT (the owner's ruling 2a, 26.09)
// =================================================================================================
//
// `resumeFromCollege` ticks up to fifty-two weeks in ONE command and the life rolls run every one of
// those weeks (`resolveBodyAndPlanner` has no `inCollege` guard – only the knock is suppressed at
// college). It paused for a call-up reveal, a championship reveal and her birthday, and for nothing
// else: a `met` or an `ended` raised in April was walked past and surfaced in December, worded as
// news, with its own break-up card queued behind it.
//
// MEASURED by `docs/review-principles-2026-09-26/probes/b-college-beats.ts` over 16 careers – 8 with
// the fork forced at week 60 (this file's own recipe) and 8 walked to the real fork at 19:
//
//     college year-calls: 217; calls that ticked past >=1 unanswered BLOCKING beat: 23;
//     by kind {"met":15,"ended":10}
//
// The owner's standing ruling for this loop is «IT COLLECTS, IT DOES NOT HALT» (`world.ts`, round 24)
// and the birthday was its one explicit exception. Ruling 2(a) of 26.09 makes the blocking beat the
// second, on the birthday's own argument: a beat is HER SPEAKING, so a loop that outran one would
// answer her by walking away – the worker's own sentence for why `▶▶ 52` stops for it.
//
// ⚠⚠ WHY THE CORPUS HERE IS FOUR CAREERS AND NOT THE PROBE'S SIXTEEN, AND THE NUMBER IS A BUDGET
// RATHER THAN A PREFERENCE. The real-fork arm walks 520 weeks per seed before college even opens,
// which is where 18 of the 23 passed rows live and also most of the probe's ~100 s; that arm is the
// PROBE's job and the probe is run as this task's proof (before: 23 of 217; after: 0 of 217, quoted
// in the wave report). What lives here, in the suite, is the same measure over the forced-fork
// careers – the arm every other college file walks. MEASURED: one career costs ~1.5 s to open at
// college and ~3.1 s to walk its four academic years, so eight of them read 45 s solo, which is past
// this repo's own line (`scripts/heavy-tests.mjs`: ~32 s in-pool, and CI runs ~1.9x local). Four is
// ~23 s, and the file is in `HEAVY_UNIT_FILES` so it owns its process.
//
// ⚠ THE FOUR ARE A PREFIX OF THE SEED LIST AND NOT A SELECTION. Two of them hold blocking beats
// inside a college year (measured: 3 passed rows before the fix, `met@178` on `b01-1` and
// `met@233` + `ended@261` on `b01-3`); picking seeds BY that outcome is how a corpus stops being
// able to fail, so the list is cut from the end. Block B pins the count in BOTH directions so it
// cannot pass by holding no beats at all.
//
// ⚠ MUTATION ARMS, each named at its case: remove the pause from `resumeFromCollege` (block B), and
// remove the entry read (block A).
import { describe, expect, it } from 'vitest'
import {
  LIFE_BEAT_BLOCKING,
  lifeLogOf,
  openQuestions,
  pendingBirthday,
  pendingLifeBeat,
  resumeFromCollege,
  type WorldState,
} from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { drainLifeBeats } from './helpers/career'
import { answerBirthday, answerCollegeReveal, openedAtCollege } from './collegeBirthdayFixtures'

// Four careers each walk sixty weeks to a forced fork, a year to the September departure and then
// four academic years. Deterministic but slow, and the suite runs many files in parallel – the same
// generous file-level timeout every college file carries, for the same reason.
import { vi } from 'vitest'
vi.setConfig({ testTimeout: 240_000 })

const SEEDS = ['b01-0', 'b01-1', 'b01-2', 'b01-3']

/** The probe's own measure, per year-call: blocking rows raised INSIDE the year, still unanswered,
 *  whose week is BEFORE the week the call stopped on. A row dated the stopping week itself is the
 *  pause – it is the question the press handed back, not one it walked past. */
function passedRows(world: WorldState, from: number, to: number): string[] {
  return lifeLogOf(world)
    .filter((r) => r.answer === null && LIFE_BEAT_BLOCKING[r.kind] && r.week > from && r.week < to)
    .map((r) => `${r.kind}@${r.week}`)
}

type Walk = {
  calls: number
  passed: string[]
  pausedOnBeat: number
  latchedAtPause: number
  yearsBanked: number
}

/** The probe's loop, as a walk: press the year, read the measure, then answer everything the player
 *  would have answered (the reveal, the cake, her card) and press again. */
function walkCollege(seed: string): Walk {
  const { world, rng } = openedAtCollege(seed, 6, 15)
  const out: Walk = { calls: 0, passed: [], pausedOnBeat: 0, latchedAtPause: 0, yearsBanked: 0 }
  for (let guard = 0; guard < 24 && world.ending?.type === 'college'; guard++) {
    const from = world.week
    const banked = world.college!.years.length
    const stops = resumeFromCollege(world, rng)
    out.calls++
    out.passed.push(...passedRows(world, from, world.week))
    if (stops.includes('life')) {
      out.pausedOnBeat++
      // ⚠ THE RE-LATCH IS THE HALF THAT MAKES THE PAUSE RNG-SAFE: the year is NOT banked, the latch
      // goes back on with the SAME year's end under it, and `pendingYearStart` holds the opening
      // measurements for the press that finishes it – the birthday's own mechanism since round 24.
      if ((world.college!.pendingYearStart ?? null) !== null) out.latchedAtPause++
      expect(pendingLifeBeat(world), `${seed}: 'life' was reported with no card standing`).not.toBeNull()
      expect(world.college!.years.length, `${seed}: a paused year is not a banked year`).toBe(banked)
    }
    answerCollegeReveal(world)
    if (pendingBirthday(world) !== null) answerBirthday(world)
    drainLifeBeats(world)
  }
  out.yearsBanked = world.college!.years.length
  return out
}

// =================================================================================================
// A. THE ENTRY READ – a card standing at the rest state is not something a press may walk over
// =================================================================================================
describe('B-01 A – the year refuses to start over an unanswered blocking row', () => {
  it('⚠⚠ a blocking row at the rest state returns `life` with ZERO ticks, and answering it frees the press', () => {
    // ⚠ THE ROW IS PUSHED BY HAND, which is the shape `tests/r2-13-advance-span.test.ts`'s own
    // refusal table uses for this member: one unanswered blocking row on the record IS the pending
    // state, by design – there is no second boolean to set. The walked half is block B.
    //
    // ⚠ AND IT HAS A SURFACE, which is what makes this a pause and not a soft-lock: a beat raised
    // inside the resumable college latch has had a dialog since wave 3 T2
    // (`tests/component/wave3-life-beat-freeze.test.ts` mounts it over the freeze's own card), and
    // `answerLifeBeat` is its exit. The same press works the moment she has been answered.
    //
    // ⚠ MUTATION ARM: delete the `openQuestions` read at `resumeFromCollege`'s entry → the press
    // spends a year over her card, and the first expectation below reads `[]`.
    const { world, rng } = openedAtCollege('b01-entry', 6, 15)
    expect(pendingLifeBeat(world), 'the fixture hands back a rest state with nothing standing').toBeNull()
    const at = world.week
    const banked = world.college!.years.length
    world.lifeLog.push({ week: at, kind: 'fork-opinion', detail: 'tour', answer: null })

    // ⚠ THE READ IS THE OWNER'S LIST AND NOT A SECOND COPY OF IT, asserted on the same world before
    // the press: the latch itself LEADS `openQuestions` here, because the college ending is an
    // 'ending' – and this loop is the one command that CLEARS an ending rather than pausing for one.
    // That is why the pause set is a named filter over the owner and not the owner's head.
    const open = openQuestions(world)
    expect(open[0], "the latch leads the owner's list, and the loop's job is to clear it").toBe('ending')
    expect(open, 'and her card is standing behind it').toContain('life')

    const stops = resumeFromCollege(world, rng)

    expect(stops, 'the press names her card').toContain('life')
    expect(world.week, 'and not one week moved').toBe(at)
    expect(world.college!.years.length, 'and no year was banked').toBe(banked)
    expect(world.ending?.type, 'the latch is still on, so the epilogue can still ask').toBe('college')
    expect(world.college!.pendingYearStart ?? null, 'a refusal is not a paused year').toBeNull()

    // ...and the same click works the moment she has been answered – the half that proves the
    // refusal is a pause in the player's hands and not a dead end.
    drainLifeBeats(world)
    expect(pendingLifeBeat(world), 'her card is answered').toBeNull()
    const spent = resumeFromCollege(world, rng)
    expect(world.week, 'the year is spent, from the week the refusal stood on').toBeGreaterThan(at)
    expect(spent, 'and the press reports something other than her card').not.toContain('life')
  })

})

// =================================================================================================
// B. THE WALK – the probe's measure, both ways
// =================================================================================================
describe('B-01 B – no college year-call ticks past an unanswered blocking row', () => {
  it('⚠⚠ four careers, every academic year pressed: ZERO passed rows, and the pauses are real', () => {
    // ⚠ MUTATION ARM: remove the `COLLEGE_PAUSES` read from the loop in `resumeFromCollege` → the
    // passed list fills again (measured 3 rows over this corpus before the fix, 6 over eight careers
    // and 23 over the probe's sixteen) and `pausedOnBeat` drops to 0.
    const walks = SEEDS.map((seed) => ({ seed, walk: walkCollege(seed) }))
    const passed = walks.flatMap(({ seed, walk }) => walk.passed.map((r) => `${seed} ${r}`))
    const calls = walks.reduce((n, w) => n + w.walk.calls, 0)
    const paused = walks.reduce((n, w) => n + w.walk.pausedOnBeat, 0)
    const latched = walks.reduce((n, w) => n + w.walk.latchedAtPause, 0)

    expect(passed, 'a year-call walked past her card').toEqual([])

    // ⚠⚠ AND THE COUNT IN THE OTHER DIRECTION, because «zero passed» is what a corpus with no beats
    // in it also reads. The walk has to have MET the state it is asserting about.
    expect(calls, 'the corpus really pressed the years').toBeGreaterThan(24)
    expect(paused, 'at least one year really paused on her card').toBeGreaterThan(0)
    expect(latched, 'every pause re-latched through `pendingYearStart`').toBe(paused)
    for (const { seed, walk } of walks) {
      expect(walk.yearsBanked, `${seed}: the four years were still spent, pauses and all`).toBe(4)
    }
  })

  it('⚠ a paused year is the SAME year continued – it lands on the boundary it opened against', () => {
    // The pause may not move the academic boundary: `pendingYearStart` is read back rather than
    // re-measured, so a year paused for her card finishes where the first press said it would.
    const { world, rng } = openedAtCollege('b01-boundary', 6, 15)
    const opened = world.week
    let guard = 0
    while (guard++ < 12 && world.college!.years.length === 0) {
      resumeFromCollege(world, rng)
      answerCollegeReveal(world)
      if (pendingBirthday(world) !== null) answerBirthday(world)
      drainLifeBeats(world)
    }
    expect(world.college!.years, 'one year is banked').toHaveLength(1)
    expect(world.week, 'and it is exactly a year long, however many presses it took').toBe(opened + WEEKS_PER_YEAR)
    expect(world.college!.pendingYearStart ?? null, 'a banked year leaks no start into the next one').toBeNull()
  })
})
