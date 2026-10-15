// ROUND 52 J6 (15.10) – THE OWNER'S TWO WINDOW RULINGS ON HER TALK ABOUT THE COACH.
//
// The owner, 15.10, two questions on his review sheet and his two answers, verbatim:
//   R71      «реплика говорит «полгода», но окно факта открыто с 24-й по 43-ю неделю, а обязательная точка — 32-я (почти восемь месяцев).»  –  «Точку на 28-ю нед.»
//   R73–R75  ««год» доступен с 48-й недели без верхней границы. Может ли R73–R75 выпасть в обычном small talk спустя два-три года с тем же тренером?»  –  «Окно 48–63 нед.»
// So the half-year checkpoint is week 28 (it was 32), the half-year window is weeks together [24, 32) (it was [24, 44)) and the year window is [48, 64) (it was [48, no end)); the first-impression
// checkpoint (12) and the year checkpoint (56) stay. No string changed, in either language, and nothing here draws from MAIN.
//
// ⚠⚠ WHAT THIS FILE CHECKS, AND AGAINST WHAT. Every window below is the RULING WRITTEN OUT, as a literal in this file (a test that read the constants back passes for any value); the code under test is
// asked through its own questions – `reachableSituations` (the lottery's pool, which holds the one spelling of her side, the stint's age, college and her voice), the real `rollSmallTalk`, the
// real tick of a played career – never through a second copy of the window test.
//   A  THE NUMBERS: the checkpoints 12 / 28 / 56, the windows [24, 32) and [48, 64), the rows table keyed 12 / 28 / 56, every edge a multiple of the feel period, the checkpoints' four weeks inside their windows;
//   B  THE LOTTERY'S OWN REACHABILITY: over every voice, every stage the rows list, every week of a founding stint and of a re-hired one, and a chemistry grid that reaches all three sides, a half-year row is
//      in the pool on weeks together 24 to 31 and on NO other, a year row on 48 to 63 and on no other – and on each edge week of each window all three sides are reachable (the window is really open);
//   C  THE CHECKPOINT TALKS LAND ON THEIR OWN FOUR WEEKS: with the ordinary lottery shut, the real roll raises a first-impression talk on weeks 12 to 15, the half-year talk on 28 to 31 and the year talk on 56 to 59 of
//      a fresh stint and on no other week, for every voice and every side;
//   D  PLAYED, COACHED CAREERS (the real tick): no stint row outside its window with the checkpoints live and with them emptied, and the MEASUREMENT of the spec's J6 addendum – rows of the six stint situations per
//      coached year, split into the checkpoint's own four weeks and everything else (R52_J6_REPORT=1 prints it; R52_J6_SCALE=big is the spec's cohort; R52_J6_BEFORE=1 counts against the 14.10 windows,
//      for a run on the parent commit).
//
// ⚠ NO CYRILLIC IN THIS FILE'S SOURCE LINES except comments: no player-facing string is read or written here, the rows exist (F4 / H2) and are looked up by id.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER OF J6 – each arm run by a script that backs up the two source files (src/engine/world/coachFeel.ts, src/engine/world/lifeBeat/smallTalk.ts), changes ONE thing, runs the listed
// test files (unit project, json reporter), restores both and compares the sha256 prefix: coachFeel.ts 6aabb427fb01f896 and smallTalk.ts 7a5da2560628fdfa before and after, every arm (cmp as well).
// ARM 0, the shipped tree: 208 tests green in the ten files of J6's gate (this file's 5, the checkpoint file's 26, the silence file's 19, the feel-talk file's 41 and five more).
//   J6-M1  the half-year checkpoint back at 32 (the array AND the rows key)   29 RED of 91 over four files – this file's A and C; the checkpoint file 19 (A, B, C, D); the silence file 8 (J1 A, J1 E, J1b F);
//          the feel-talk file 0 (its windows are untouched by the checkpoint week)
//   J6-M2  the half-year window back at 44 (COACH_TALK_HALF_YEAR_UNTIL_WEEK)   8 RED of 72 over three files – this file's A and B (both stints); the feel-talk file 5 (the numbers, the grid, the re-hire case,
//          the tile parity, the long-stint roll); the checkpoint file 0. ⚠ C and D stay green here: the window's close is invisible to the checkpoint mechanism and to a 156-week cohort, which is why
//          B, the reachability sweep, is the arm that holds it
//   J6-M3  the year window back to no ceiling (COACH_TALK_YEAR_UNTIL_WEEK = infinity)   10 RED of 72 over three files – this file's A, B (both stints) and D (a played career raised a year row past week 63);
//          the feel-talk file 6 (the same five and the real walk); the checkpoint file 0
// -------------------------------------------------------------------------------------------------
import { describe, expect, it } from 'vitest'

import {
  coachSinceWeek,
  createWorld,
  hireCoach,
  lifeLogOf,
  rollSmallTalk,
  smallTalkEligible,
  smallTalkThisSeason,
  TEMPERAMENTS,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { COACH_FEEL } from '../src/engine/chemistry'
import { ECONOMY } from '../src/engine/economy'
import {
  COACH_TALK_CHECKPOINTS,
  COACH_TALK_HALF_YEAR_FROM_WEEK,
  COACH_TALK_HALF_YEAR_UNTIL_WEEK,
  COACH_TALK_YEAR_FROM_WEEK,
  COACH_TALK_YEAR_UNTIL_WEEK,
  coachFeel,
  coachTalkCheckpointAt,
} from '../src/engine/world/coachFeel'
import { reachableSituations } from '../src/engine/world/lifeBeat'
import { COACH_TALK_CHECKPOINT_ROWS } from '../src/engine/world/lifeBeat/smallTalk'
import { smallTalkSituationIdOf } from '../src/engine/world/lifeBeat/smallTalkCopy'
import { DEFAULT_PROFILE, type CoachFeel, type DiaryLifeStage } from '../src/shared/protocol'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { openCareer, POLICIES, PRESETS, stepCareerWeek } from '../tools/econ-bench'
import { bondFor } from './helpers/schoolTranche'

const REPORT = process.env.R52_J6_REPORT === '1'
const BIG = process.env.R52_J6_SCALE === 'big'
/** A run against the PARENT commit: count against the 14.10 windows (half a year [24, 44), a year [48, no end), the half-year checkpoint at 32) and assert nothing about them. */
const BEFORE = process.env.R52_J6_BEFORE === '1'

// -------------------------------------------------------------------------------------------------
// THE RULING AND THE ROWS, WRITTEN OUT
// -------------------------------------------------------------------------------------------------
const FIRST_ROWS: readonly string[] = ['the-thing-that-makes-sense', 'practice-feels-different', 'the-thing-she-cannot-name']
const HALF_ROWS: readonly string[] = ['half-a-year-and-it-fits', 'half-a-year-and-still-unsure', 'months-in-and-still-waiting']
const YEAR_ROWS: readonly string[] = ['a-year-and-she-would-not-swap', 'a-year-and-she-still-does-not-know', 'a-year-in-we-need-to-talk']
type Group = 'first' | 'half' | 'year'
const groupOf = (id: string): Group | null => (FIRST_ROWS.includes(id) ? 'first' : HALF_ROWS.includes(id) ? 'half' : YEAR_ROWS.includes(id) ? 'year' : null)
/** The ruling: [from, until) in weeks together. */
const HALF_WINDOW: readonly [number, number] = [24, 32]
const YEAR_WINDOW: readonly [number, number] = [48, 64]
/** One feel period, written out: a checkpoint's window is [cp, cp + 4). */
const PERIOD = 4
/** Chemistry levels that between them put her feel on every one of the six steps (H2 / H3's own poses); the SIDE is always read back through the pool, never assumed from the level. */
const CHEMS = [12, 6, 0, -6, -12]
const STAGES: readonly DiaryLifeStage[] = ['school', 'after-school', 'independent']
const byNumber = (a: number, b: number): number => a - b

// -------------------------------------------------------------------------------------------------
// FIXTURES (the shapes of tests/r52-coach-talk-checkpoints.test.ts)
// -------------------------------------------------------------------------------------------------
type Row = NonNullable<WorldState['lifeLog']>[number]

/** A coached world: the founding coach on the payroll, a close bond, an empty life log. `since` > 0 re-hires the same coach at that week, so the stint starts there. */
function coached(seed: string, voice: Temperament, since = 0): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.temperament = voice
  world.lifeLog = []
  world.bond = bondFor('close')
  if (world.coachId === null) throw new Error('this profile is supposed to start with a coach on the payroll')
  if (since > 0) {
    const coach = world.coachId
    world.week = since
    hireCoach(world, null)
    hireCoach(world, coach)
  }
  return world
}

/** Pose the week and the pair's level, and read her feel. */
function pose(world: WorldState, week: number, chem: number): CoachFeel {
  world.week = week
  world.coachPairs[world.coachId as string] = { chem, phase: 0, standing: 0 }
  const feel = coachFeel(world)
  if (feel === null) throw new Error('a coached world reads a feel')
  return feel
}

/** The ordinary lottery SHUT: top this season's tally up to the cap with answered legacy rows that name no situation, so any row raised that week is a checkpoint's. */
function shutLottery(world: WorldState): void {
  world.lifeLog ??= []
  while (smallTalkThisSeason(world) < ECONOMY.life.smallTalkCapPerSeason) world.lifeLog.push({ week: world.week, kind: 'small-talk', detail: 'worry', answer: 'easy' })
  if (smallTalkEligible(world)) throw new Error('the lottery is supposed to be shut by the cap')
}

/** Pose the week, shut the lottery, run the REAL roll, and return the row it raised (or null). */
function rollWeek(world: WorldState, week: number, chem: number): Row | null {
  pose(world, week, chem)
  shutLottery(world)
  const before = lifeLogOf(world).length
  rollSmallTalk(world)
  const log = lifeLogOf(world)
  return log.length > before ? log[log.length - 1]! : null
}

/** Run `body` with the checkpoints emptied (the lottery alone), and put them back. In place: the array is the module's own. */
function withoutCheckpoints<T>(body: () => T): T {
  const live = COACH_TALK_CHECKPOINTS as unknown as number[]
  const saved = live.splice(0, live.length)
  try {
    return body()
  } finally {
    live.splice(0, live.length, ...saved)
  }
}

// =================================================================================================
// A. THE NUMBERS
// =================================================================================================
describe('round 52 J6 A – the ruling\'s numbers, written out', () => {
  it('⭐⭐⭐ checkpoints 12 / 28 / 56, half a year [24, 32), a year [48, 64): every edge a multiple of the feel period, the checkpoints\' four weeks inside their windows, the rows keyed by the same weeks', () => {
    if (BEFORE) return
    expect(COACH_FEEL.periodWeeks, 'the period the ruling counts in').toBe(PERIOD)
    expect([...COACH_TALK_CHECKPOINTS], 'the half-year checkpoint is 28 (was 32); 12 and 56 stay').toEqual([12, 28, 56])
    expect([COACH_TALK_HALF_YEAR_FROM_WEEK, COACH_TALK_HALF_YEAR_UNTIL_WEEK], 'half a year: [24, 32) (was [24, 44))').toEqual([...HALF_WINDOW])
    expect([COACH_TALK_YEAR_FROM_WEEK, COACH_TALK_YEAR_UNTIL_WEEK], 'a year: [48, 64) (was [48, no end))').toEqual([...YEAR_WINDOW])
    expect(Number.isFinite(COACH_TALK_YEAR_UNTIL_WEEK), 'the year has a ceiling now').toBe(true)
    for (const w of [24, 28, 32, 48, 56, 64]) expect(w % PERIOD, `week ${w} is a feel-period boundary (her doubt is redrawn there)`).toBe(0)
    expect(28 >= HALF_WINDOW[0] && 28 + PERIOD <= HALF_WINDOW[1], 'the half-year checkpoint and its four weeks are inside its window – the window ends where they do').toBe(true)
    expect(56 >= YEAR_WINDOW[0] && 56 + PERIOD <= YEAR_WINDOW[1], 'the year checkpoint and its four weeks are inside its window').toBe(true)
    expect(Object.keys(COACH_TALK_CHECKPOINT_ROWS).map(Number).sort(byNumber), 'the rows table is keyed by the checkpoint weeks').toEqual([12, 28, 56])
    expect([...(COACH_TALK_CHECKPOINT_ROWS[12] ?? [])]).toEqual(FIRST_ROWS)
    expect([...(COACH_TALK_CHECKPOINT_ROWS[28] ?? [])], 'week 28 holds the half-year rows (R70 to R72)').toEqual(HALF_ROWS)
    expect([...(COACH_TALK_CHECKPOINT_ROWS[56] ?? [])]).toEqual(YEAR_ROWS)
    const edges: [number, number | null][] = [[26, null], [27, null], [28, 28], [31, 28], [32, null], [35, null], [36, null]]
    for (const [together, want] of edges) expect(coachTalkCheckpointAt(together), `weeks together ${together}`).toBe(want)
  })
})

// =================================================================================================
// B. THE LOTTERY'S OWN REACHABILITY
// =================================================================================================
describe('round 52 J6 B – the lottery\'s pool: a half-year row only on weeks 24 to 31, a year row only on weeks 48 to 63', () => {
  interface Reach {
    half: Set<number>
    year: Set<number>
    /** per week together: which sides (index into the group's rows: 0 warm, 1 unsure, 2 cold) were in the pool somewhere on the grid */
    halfSides: Map<number, Set<number>>
    yearSides: Map<number, Set<number>>
    posed: number
  }

  /** Every week of a stint `since` weeks old at the start, up to `lastAge`, in every voice, at every stage the rows list, on a chemistry grid reaching all six steps: which weeks of the stint have a half-year or a year row in the pool. */
  function reach(since: number, lastAge: number): Reach {
    const out: Reach = { half: new Set(), year: new Set(), halfSides: new Map(), yearSides: new Map(), posed: 0 }
    for (const voice of TEMPERAMENTS) {
      const world = coached(`r52-j6-reach-${voice}-${since}`, voice, since)
      for (let age = 0; age <= lastAge; age++) {
        for (const chem of CHEMS) {
          pose(world, since + age, chem)
          for (const stage of STAGES) {
            out.posed++
            for (const s of reachableSituations(world, voice, stage)) {
              const g = groupOf(s.id)
              if (g === 'half') {
                out.half.add(age)
                out.halfSides.set(age, (out.halfSides.get(age) ?? new Set<number>()).add(HALF_ROWS.indexOf(s.id)))
              } else if (g === 'year') {
                out.year.add(age)
                out.yearSides.set(age, (out.yearSides.get(age) ?? new Set<number>()).add(YEAR_ROWS.indexOf(s.id)))
              }
            }
          }
        }
      }
    }
    return out
  }
  const range = (from: number, until: number): number[] => Array.from({ length: until - from }, (_, i) => from + i)

  for (const [label, since, lastAge] of [['the founding stint', 0, 160], ['a stint re-hired at week 100', 100, 100]] as const) {
    it(`⭐⭐⭐ ${label}: a half-year row is in the pool on exactly weeks together 24 to 31 and a year row on exactly 48 to 63 – on no week before, and on none after – and all three sides are reachable on each edge week`, () => {
      if (BEFORE) return
      const r = reach(since, lastAge)
      expect(r.posed, 'the grid was posed (anti-vacuity)').toBeGreaterThan(5000)
      expect([...r.half].sort(byNumber), 'the weeks together on which a half-year row is reachable').toEqual(range(HALF_WINDOW[0], HALF_WINDOW[1]))
      expect([...r.year].sort(byNumber), 'the weeks together on which a year row is reachable').toEqual(range(YEAR_WINDOW[0], YEAR_WINDOW[1]))
      for (const age of [HALF_WINDOW[0], HALF_WINDOW[1] - 1]) expect([...(r.halfSides.get(age) ?? [])].sort(byNumber), `half-year edge week ${age}: warm, unsure and cold`).toEqual([0, 1, 2])
      for (const age of [YEAR_WINDOW[0], YEAR_WINDOW[1] - 1]) expect([...(r.yearSides.get(age) ?? [])].sort(byNumber), `year edge week ${age}: warm, unsure and cold`).toEqual([0, 1, 2])
    })
  }
})

// =================================================================================================
// C. THE CHECKPOINT TALKS LAND ON THEIR OWN FOUR WEEKS
// =================================================================================================
describe('round 52 J6 C – the half-year talk lands on weeks 28 to 31 of a stint', () => {
  it('⭐⭐⭐ with the lottery shut, the real roll raises the first-impression talk on weeks 12 to 15, the half-year talk on 28 to 31 and the year talk on 56 to 59 – every voice, every side – and on no other week', () => {
    if (BEFORE) return
    const raisedAt: Record<Group, Set<number>> = { first: new Set(), half: new Set(), year: new Set() }
    let stray = 0
    let rolls = 0
    for (const voice of TEMPERAMENTS) {
      for (const chem of CHEMS) {
        const world = coached(`r52-j6-cp-${voice}-${chem}`, voice)
        for (let age = 0; age <= 100; age++) {
          world.lifeLog = []
          const row = rollWeek(world, age, chem)
          rolls++
          if (row === null) continue
          const g = groupOf(smallTalkSituationIdOf(row.detail) ?? '')
          if (g === null) stray++
          else raisedAt[g].add(age)
        }
      }
    }
    expect(rolls, 'the roll ran on every week of every stint (anti-vacuity)').toBe(TEMPERAMENTS.length * CHEMS.length * 101)
    expect(stray, 'nothing but a checkpoint talk was raised with the lottery shut').toBe(0)
    expect([...raisedAt.first].sort(byNumber), 'first impression').toEqual([12, 13, 14, 15])
    expect([...raisedAt.half].sort(byNumber), 'half a year: the owner\'s week 28, and the three after it').toEqual([28, 29, 30, 31])
    expect([...raisedAt.year].sort(byNumber), 'a year').toEqual([56, 57, 58, 59])
  })
})

// =================================================================================================
// D. PLAYED, COACHED CAREERS – NO ROW OUTSIDE ITS WINDOW, AND THE MEASUREMENT
// =================================================================================================
interface StintRow {
  /** weeks together at the week the row was raised */
  age: number
  group: 'half' | 'year'
}
interface Run {
  rows: StintRow[]
  coachedWeeks: number
}

/** One econ-bench career walked with the real tick, the parent answering a card the week it is raised (H3's `answers` arm). */
function play(presetIdx: number, index: number, weeks: number): Run {
  const policy = POLICIES[0]!
  const { world, rng } = openCareer(PRESETS[presetIdx]!, index, policy)
  const rows: StintRow[] = []
  let coachedWeeks = 0
  let seen = 0
  for (let i = 0; i < weeks; i++) {
    stepCareerWeek(world, rng, policy)
    drainLifeBeats(world)
    if (world.coachId !== null) coachedWeeks++
    const log = lifeLogOf(world)
    for (; seen < log.length; seen++) {
      const row = log[seen]!
      if (row.kind !== 'small-talk') continue
      row.answer = 'more'
      const group = groupOf(smallTalkSituationIdOf(row.detail) ?? '')
      if (group === 'half' || group === 'year') rows.push({ age: row.week - coachSinceWeek(world), group })
    }
  }
  return { rows, coachedWeeks }
}

describe('round 52 J6 D – played, coached careers: no stint row outside its window, and the lottery rows per coached year', () => {
  // The cohort of H3's one-off run (7 presets that start with a coach x 6 careers x 312 weeks) at R52_J6_SCALE=big, and the gate arm (preset 5, 2 careers, 156 weeks) otherwise.
  const PRESET_IDS = BIG ? [1, 2, 4, 5, 6, 7, 8] : [5]
  const CAREERS_EACH = BIG ? 6 : 2
  const WEEKS = BIG ? 312 : 156
  const HALF: readonly [number, number] = BEFORE ? [24, 44] : [HALF_WINDOW[0], HALF_WINDOW[1]]
  const YEAR: readonly [number, number] = BEFORE ? [48, Number.POSITIVE_INFINITY] : [YEAR_WINDOW[0], YEAR_WINDOW[1]]
  const HALF_CP = BEFORE ? 32 : 28
  const YEAR_CP = 56

  function summarise(runs: Run[]): Record<string, unknown> {
    const t = {
      coachedYears: 0,
      half: { total: 0, inCheckpointWindow: 0 },
      year: { total: 0, inCheckpointWindow: 0 },
      outsideWindows: 0,
      ageHistogram: { half: {} as Record<string, number>, year: {} as Record<string, number> },
    }
    for (const run of runs) {
      t.coachedYears += run.coachedWeeks / 52
      for (const row of run.rows) {
        const [from, until] = row.group === 'half' ? HALF : YEAR
        const cp = row.group === 'half' ? HALF_CP : YEAR_CP
        t[row.group].total++
        if (row.age >= cp && row.age < cp + PERIOD) t[row.group].inCheckpointWindow++
        if (row.age < from || row.age >= until) t.outsideWindows++
        const bucket = String(Math.floor(row.age / PERIOD) * PERIOD)
        t.ageHistogram[row.group][bucket] = (t.ageHistogram[row.group][bucket] ?? 0) + 1
      }
    }
    const per = (n: number): number => Math.round((10000 * n) / Math.max(t.coachedYears, 1e-9)) / 10000
    return {
      coachedYears: Math.round(t.coachedYears * 10) / 10,
      halfRows: t.half.total,
      halfRowsInCheckpointWindow: t.half.inCheckpointWindow,
      halfRowsOrdinary: t.half.total - t.half.inCheckpointWindow,
      halfOrdinaryPerCoachedYear: per(t.half.total - t.half.inCheckpointWindow),
      yearRows: t.year.total,
      yearRowsInCheckpointWindow: t.year.inCheckpointWindow,
      yearRowsOrdinary: t.year.total - t.year.inCheckpointWindow,
      yearOrdinaryPerCoachedYear: per(t.year.total - t.year.inCheckpointWindow),
      rowsOutsideTheirWindows: t.outsideWindows,
      ageHistogram: t.ageHistogram,
    }
  }

  it('⭐⭐⭐ no R70 to R75 row outside its window, with the checkpoints live and with them emptied – and the lottery rows per coached year (R52_J6_REPORT=1 prints them)', () => {
    const cohort: [number, number][] = PRESET_IDS.flatMap((p) => Array.from({ length: CAREERS_EACH }, (_, i): [number, number] => [p, i]))
    const on = cohort.map(([p, i]) => play(p, i, WEEKS))
    const off = withoutCheckpoints(() => cohort.map(([p, i]) => play(p, i, WEEKS)))
    const a = summarise(on)
    const b = summarise(off)
    if (REPORT) {
      // eslint-disable-next-line no-console
      console.info(`R52_J6_REPORT ${JSON.stringify({ before: BEFORE, presets: PRESET_IDS, careersEach: CAREERS_EACH, weeks: WEEKS, windows: { half: HALF, year: YEAR === undefined ? null : [YEAR[0], YEAR[1] === Number.POSITIVE_INFINITY ? 'inf' : YEAR[1]] }, checkpointsLive: a, checkpointsEmptied: b })}`)
    }
    expect(a.coachedYears as number, 'the cohort was coached (anti-vacuity)').toBeGreaterThan(0)
    if (BEFORE) return
    expect(a.rowsOutsideTheirWindows, 'live: no half-year row outside weeks together [24, 32), no year row outside [48, 64)').toBe(0)
    expect(b.rowsOutsideTheirWindows, 'the lottery alone: the same').toBe(0)
    expect((a.halfRowsInCheckpointWindow as number) + (a.yearRowsInCheckpointWindow as number), 'the mechanism is live in a played career: a checkpoint talk was raised (anti-vacuity)').toBeGreaterThan(0)
  }, BIG ? 3_000_000 : undefined)
})
