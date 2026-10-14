// ROUND 52 F4 (14.10) – THE THIRD CHANNEL OF HER FEEL FOR THE COACH: THREE SMALL-TALK SITUATIONS GATED BY IT.
//
// The owner, 14.10: «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь
// от ребенка для принятия решения». He chose this channel («Отдельный разговор – редкая беседа о тренере её голосом… самый живой») and set its register: «не "всё плохо"
// а "я пока не очень поняла" или "вроде нормально, но"». The plate on her screen (F2) and the week notes (F3) already say it; THIS file pins the conversation.
//
// WHAT WAS WRITTEN: R67 `the-thing-that-makes-sense` (good-news, fact `coach-feel-warm`), R68 `practice-feels-different` (observation, `coach-feel-unsure`) and R69
// `the-thing-she-cannot-name` (worry, `coach-feel-cold`), appended LAST after R66, at school, after-school and independent – never college. The three facts live in the hub's
// `SMALL_TALK_FACT` and read `coachFeel(world)`, the primitive the tile and the notes read. Her answers move nothing (ruling V2).
// ⭐ ROUND 52 H2 (14.10) adds R70–R75 – the same three sides at half a year and at a year together, behind a window of weeks together – and sections J–Q at the END of this file pin them; A–I below are F4's and still about R67–R69.
//
// ⚠⚠ WHAT THIS FILE CHECKS, AND WHAT IT CHECKS AGAINST
//   A  each fact is true for exactly its steps and false for `too-early`, nobody employed and college – asked through `reachableSituations`, the only road a fact has
//      into the pool (the table itself is module-private), over a grid of poses that reaches all SIX steps (and asserts it did);
//   B  the stage × voice grid: the row is in the pool at school / after-school / independent and at no other, in all four voices;
//   C  PARITY: the facts agree with `coachFeel` (the unit) and with the snapshot's `coachFeel` (what the tile shows) on the same world;
//   D  THE REAL DRAW: the shipped `rollSmallTalk` over 36 careers walked for 24 years, her feel recorded the moment before each roll – a drawn coach-feel row had its fact true;
//   E  PLAYED, COACHED CAREERS: the econ-bench walk with the real tick, and HOW OFTEN a player meets one per coached year (printed with R52_F4_REPORT=1; R52_F4_SCALE=big
//      is the one-off measurement quoted in the spec);
//   F  ZERO MAIN DRAWS and zero effects: the same played career with and without the three rows taps the same MAIN draws, and answering moves nothing the gauge reads;
//   G  the copy rules (the coach is never pronoun-ed, no «today», no «!», no digit, no long dash, no result, no skill claim), uniqueness in the whole corpus;
//   H  no line is also a string elsewhere in src/ (the catalogue joins by English text); I  the Russian is there.
//
// ⚠ NO CYRILLIC IN THIS FILE'S SOURCE LINES except in comments and titles, by the house rule for source: the Russian lives in `ru.json`, fed by
// `docs/localization/ru-small-talk-situations-c-2026-10.md` §35–§38, and §I only asks that it is THERE.
//
// ⚠ THE FIXTURES ARE `tests/helpers/schoolTranche.ts` (the walk and the career), now with an optional observer – a pasted copy of the walk is what T5.14 RULE B refuses.
// The poses are this file's own: a founding coach on the payroll, her level posed at the extremes the F1 tests use.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – each arm run in the shared checkout on a backup-and-restore, the file compared byte for byte (cmp) and by sha256 prefix afterwards.
// -------------------------------------------------------------------------------------------------
//   ARM 0  THE SHIPPED TREE: 19 tests green (npx vitest run --project unit tests/r52-coach-feel-talk.test.ts).
//   M1  FACT MAPPING – `coach-feel-cold` also true for `unsure` (src/engine/world/lifeBeat.ts, one step added on the table line): 2 RED of the 7 cases in A–C – the grid
//       («the row is in the pool exactly when her feel is on its side») and the parity case. lifeBeat.ts 0b1e839061ef9338 → 0b1e839061ef9338.
//   M2  STAGE LIST – R69 also listed at `college` (src/engine/world/smallTalkCorpus.ts): 3 RED of 28 – A's roster/stages case, B's stage x voice grid, and
//       round44-corpus-roundtrip's «every row's subject, stages and fact are the document's». smallTalkCorpus.ts c35eaa560ff261e0 → c35eaa560ff261e0.
//   M3  COLLEGE CLAUSE – `if (inCollege(world)) return false` removed from `coachFeelIs`: 1 RED of the 5 cases of A (the college case: the fact must be false in college, true again with it cleared); the other four stay green.
//   ARM F  the A/B of §F is the control for the draw: the same played career with the three rows spliced out of the catalogue (put back, in order, in a finally) taps the same MAIN draws and ends on the same next three.
//   ARM 4  THE DIGEST FAMILIES, measured against the PARENT (d54bb6d0, a detached worktree with node_modules linked; the rows are absent there: has-rows 0). At the parent ONLY i18n-l3-7-twin
//          is red (2 tests – F1's twin-snapshot leaves, already named in the round record); coach-travel-edge x4 files and succession-s1-start-year are GREEN, and PICK-STABILITY
//          (i18n-l3-5-life-beats, careers 5/0) is GREEN. On this tree the same files go red because a coached career's small-talk pool is three rows longer and a situation is picked by
//          position: coach-travel-edge 3, coach-travel-edge-late-schemas 8, -prior-schemas 3, -recent-schemas 10, succession-s1-start-year 3, PICK-STABILITY 1 (career 5/0: '1692c8b6' where
//          the pin holds '41e7bb05'), plus the twin's 2 as before = 30 tests in 7 files. NOT re-stamped here; the architect re-stamps them once, at the close-out, on the final tree.
//   MEASURED (the tree this file ships with, R52_F4_REPORT=1)
//       walk D: 36 careers x 1248 weeks, close bond, level posed -8 / 0 / +8: 864 coached years, 2849 conversations (556 school, 481 after-school, 1812 independent), 71 coach-feel
//       draws – warm 23 (6 / 6 / 11), unsure 35 (9 / 9 / 17), cold 13 (1 / 2 / 10) by school / after-school / independent – every one with its fact true at the roll.
//       played E (R52_F4_SCALE=big): 7 presets with a coach x 6 careers x 312 weeks: 252 coached years, 304 conversations (1.21 a coached year), 13 coach-feel (warm 4, unsure 5,
//       cold 4) = 0.052 a coached year, about one in nineteen, 4.3% of conversations. The spec's addendum carries the reading and the lever.
// -------------------------------------------------------------------------------------------------
import { readdirSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  answerLifeBeat,
  coachSinceWeek,
  createWorld,
  hireCoach,
  lifeLogOf,
  reachableSituations,
  rollSmallTalk,
  SMALL_TALK_FACTS,
  SMALL_TALK_SITUATIONS,
  TEMPERAMENTS,
  toSnapshot,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { COACH_FEEL } from '../src/engine/chemistry'
import {
  COACH_TALK_HALF_YEAR_FROM_WEEK,
  COACH_TALK_HALF_YEAR_UNTIL_WEEK,
  COACH_TALK_YEAR_FROM_WEEK,
  COACH_TALK_YEAR_UNTIL_WEEK,
  coachFeel,
} from '../src/engine/world/coachFeel'
import type { SmallTalkSituation } from '../src/engine/world/lifeBeat'
import { DEFAULT_PROFILE, type CoachFeel, type DiaryLifeStage } from '../src/shared/protocol'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { openCareer, POLICIES, PRESETS, stepCareerWeek } from '../tools/econ-bench'
import { bondFor, careerAt, walk } from './helpers/schoolTranche'

/** The three rows, in the order the document appends them. */
const ROWS = ['the-thing-that-makes-sense', 'practice-feels-different', 'the-thing-she-cannot-name'] as const
type RowId = (typeof ROWS)[number]
/** Which side of the scale each row is about: its fact, its subject, the `coachFeel` steps that make the fact true. */
const SIDE: Record<RowId, { fact: string; subject: string; steps: readonly CoachFeel[] }> = {
  'the-thing-that-makes-sense': { fact: 'coach-feel-warm', subject: 'good-news', steps: ['seems-good', 'good'] },
  'practice-feels-different': { fact: 'coach-feel-unsure', subject: 'observation', steps: ['unsure'] },
  'the-thing-she-cannot-name': { fact: 'coach-feel-cold', subject: 'worry', steps: ['seems-off', 'off'] },
}
/** The stages every row lists. NOT college: the coach does not work in college weeks. */
const LISTED: readonly DiaryLifeStage[] = ['school', 'after-school', 'independent']
const ALL_STAGES: readonly DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']
const STEPS: readonly CoachFeel[] = ['too-early', 'unsure', 'seems-good', 'seems-off', 'good', 'off']
const REPORT = process.env.R52_F4_REPORT === '1'
const BIG = process.env.R52_F4_SCALE === 'big'
// ⚠⚠ THE PER-TEST BUDGETS IN THIS FILE ARE GONE 14.10 (ROUND 52 F5 – the closing check's catch, `tests/sim-serialisation.test.ts`: birpc's reporter window is 60 s, so a budget above it is
// never spent – it only turns a readable «Test timed out» into an opaque `Timeout calling "onTaskUpdate"` stall with every test green). Four read 240 s: the D walk, E's default arm and F's two.
// MEASURED SOLO 14.10 (unit project, `--reporter=verbose`, 1-min load 3.1): D 0.36 s, E 0.93 s, F 0.85 s and 0.02 s – the whole file 3.9 s wall. At T5.3's strictest factor on record (x3.1, the
// two-core runner) the slowest is 2.9 s, so NOTHING WAS CUT AND NOTHING PROMOTED: the project default (`vite.config.ts` `testTimeout`) applies, and a restated 60 would only be a constant that cannot
// follow its source. The one number that stays is E's `BIG` arm – `R52_F4_SCALE=big` is the spec's opt-in measurement and no gate runs it.

// -------------------------------------------------------------------------------------------------
// FIXTURES – a founding coach on the payroll, and her level posed
// -------------------------------------------------------------------------------------------------

const SEEDS = ['r52-f4-a', 'r52-f4-b', 'r52-f4-c', 'r52-f4-d', 'r52-f4-e']
/** Weeks together: inside the «too early» window, at its edge, and well past it. */
const WEEKS = [3, 8, 14, 30, 60, 100]
/** The chemistry level at both extremes, the clear band and the quiet one – a gauge that speaks (|level| >= 3, F1b) is what makes the confident steps reachable. */
const LEVELS = [-12, -6, -2, 0, 2, 6, 12]

function coachedWorld(seed: string, voice: Temperament): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.temperament = voice
  world.lifeLog = []
  if (world.coachId === null) throw new Error('this profile is supposed to start with a coach on the payroll')
  return world
}

/** Pose the founding pair at `week` weeks together with level `chem`, and read her feel. */
function pose(world: WorldState, week: number, chem: number): CoachFeel {
  world.week = week
  world.coachPairs[world.coachId as string] = { chem, phase: 0, standing: 0 }
  const feel = coachFeel(world)
  if (feel === null) throw new Error('a coached world reads a feel')
  return feel
}

/** Every pose of the grid, handed to `visit` with the world already posed (the world is REUSED between poses – do not keep it). */
function sweep(voice: Temperament, visit: (world: WorldState, step: CoachFeel, where: string) => void): void {
  for (const seed of SEEDS) {
    const world = coachedWorld(seed, voice)
    for (const week of WEEKS) {
      for (const chem of LEVELS) {
        const step = pose(world, week, chem)
        visit(world, step, `${seed}/${voice} week ${week} chem ${chem} -> ${step}`)
      }
    }
  }
}

/** The first pose of the grid whose step is one of `steps`, as a fresh world for `voice`. */
function worldReading(voice: Temperament, steps: readonly CoachFeel[]): WorldState {
  for (const seed of SEEDS) {
    for (const week of WEEKS) {
      for (const chem of LEVELS) {
        const world = coachedWorld(seed, voice)
        if (steps.includes(pose(world, week, chem))) return world
      }
    }
  }
  throw new Error(`no pose of the grid reads ${steps.join(' / ')} for ${voice}`)
}

const has = (world: WorldState, id: RowId, voice: Temperament, stage: DiaryLifeStage): boolean =>
  reachableSituations(world, voice, stage).some((s) => s.id === id)

// =================================================================================================
// A. THE FACTS – true for exactly their steps
// =================================================================================================

describe('round 52 F4 A – each fact is true for exactly its steps', () => {
  it('⭐⭐⭐ the roster carries the three names, and the rows carry them as their fact, subject and stages', () => {
    for (const id of ROWS) {
      expect(SMALL_TALK_FACTS, `${SIDE[id].fact} is in the roster`).toContain(SIDE[id].fact)
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      expect(s.fact, `${id}: fact`).toBe(SIDE[id].fact)
      expect(s.subject, `${id}: subject`).toBe(SIDE[id].subject)
      expect([...s.stages].sort(), `${id}: stages – school, after-school and independent, and NOT college`).toEqual([...LISTED].sort())
    }
  })

  it('⭐⭐⭐ over the grid of poses: the row is in the pool exactly when her feel is on its side – all six steps reached, each fact true AND false somewhere', () => {
    const seen = new Map<CoachFeel, number>()
    const yes: Record<RowId, number> = { 'the-thing-that-makes-sense': 0, 'practice-feels-different': 0, 'the-thing-she-cannot-name': 0 }
    const no: Record<RowId, number> = { 'the-thing-that-makes-sense': 0, 'practice-feels-different': 0, 'the-thing-she-cannot-name': 0 }
    sweep('sunny', (world, step, where) => {
      seen.set(step, (seen.get(step) ?? 0) + 1)
      for (const id of ROWS) {
        const want = SIDE[id].steps.includes(step)
        expect(has(world, id, 'sunny', 'school'), `${where}: ${id}`).toBe(want)
        if (want) yes[id]++
        else no[id]++
      }
    })
    // ⚠ ANTI-VACUITY: the grid reached every step of the scale, and every fact was both true and false somewhere – «true exactly for its steps» about a grid that never
    // produced `too-early` or a clear `off` would be a claim about half the scale.
    expect([...seen.keys()].sort(), 'the grid reached all six steps').toEqual([...STEPS].sort())
    for (const id of ROWS) {
      expect(yes[id], `${id}: true somewhere`).toBeGreaterThan(0)
      expect(no[id], `${id}: false somewhere`).toBeGreaterThan(0)
    }
  })

  it('⭐ `too-early` has no row at all: a bare career in its first weeks together is handed none of the three', () => {
    const world = coachedWorld('r52-f4-bare', 'deep')
    expect(pose(world, 3, 0), 'week three is inside the window').toBe('too-early')
    for (const stage of ALL_STAGES) for (const id of ROWS) expect(has(world, id, 'deep', stage), `${stage}: ${id}`).toBe(false)
  })

  it('⭐ nobody employed: the fact is false on every side and at every stage – and true again while she has the coach (the control)', () => {
    const world = worldReading('quiet', ['good'])
    for (const id of ROWS) expect(has(world, id, 'quiet', 'school'), `control – ${id} while employed`).toBe(SIDE[id].steps.includes('good'))
    hireCoach(world, null)
    expect(world.coachId, 'the parent took the court back').toBeNull()
    for (const stage of ALL_STAGES) for (const id of ROWS) expect(has(world, id, 'quiet', stage), `${stage}: ${id}`).toBe(false)
  })

  it('⭐ college: the clause is the FACT\'s own – with `world.college` set the three are false at the stages they list, and the same world reads true with it cleared', () => {
    // `inCollege` reads `world.college !== null && world.week < world.college.untilWeek` and nothing else, so a span is all the pose needs.
    for (const [steps, voice] of [[['good'], 'sunny'], [['unsure'], 'fiery'], [['off'], 'deep']] as const) {
      const world = worldReading(voice, steps)
      const id = ROWS.find((r) => SIDE[r].steps.includes(steps[0] as CoachFeel)) as RowId
      expect(has(world, id, voice, 'school'), `${voice}: control – ${id} without college`).toBe(true)
      world.college = { fromWeek: 0, untilWeek: 1_000_000 } as unknown as WorldState['college']
      for (const stage of LISTED) for (const r of ROWS) expect(has(world, r, voice, stage), `${voice}/${stage}: ${r} in college`).toBe(false)
      world.college = null
      expect(has(world, id, voice, 'school'), `${voice}: ${id} again once college is cleared`).toBe(true)
    }
  })
})

// =================================================================================================
// B. THE STAGE × VOICE GRID
// =================================================================================================

describe('round 52 F4 B – the stage and voice grid', () => {
  it('⭐⭐ with its fact true a row is in the pool at school, after-school and independent and at NO other stage, in all four voices – and with the fact false it is in none', () => {
    for (const voice of TEMPERAMENTS) {
      for (const id of ROWS) {
        const on = worldReading(voice, SIDE[id].steps)
        for (const stage of ALL_STAGES) expect(has(on, id, voice, stage), `${voice}/${stage}: ${id} with its fact true`).toBe(LISTED.includes(stage))
        const other = ROWS.find((r) => r !== id && !SIDE[r].steps.some((s) => SIDE[id].steps.includes(s))) as RowId
        const off = worldReading(voice, SIDE[other].steps)
        for (const stage of ALL_STAGES) expect(has(off, id, voice, stage), `${voice}/${stage}: ${id} while her feel is on the side of ${other}`).toBe(false)
      }
    }
  })
})

// =================================================================================================
// C. PARITY – the facts, the unit and the tile are one answer
// =================================================================================================

describe('round 52 F4 C – the facts agree with `coachFeel` and with what the tile shows', () => {
  it('⭐⭐ on twelve poses the snapshot\'s `coachFeel` IS `coachFeel(world)`, and the pool follows that step', () => {
    let checked = 0
    const steps = new Set<CoachFeel>()
    for (const [seed, week, chem] of [
      ['r52-f4-a', 3, 0], ['r52-f4-a', 14, 6], ['r52-f4-b', 30, -6], ['r52-f4-b', 60, 12], ['r52-f4-c', 100, -12], ['r52-f4-c', 14, 2],
      ['r52-f4-d', 8, -2], ['r52-f4-d', 30, 0], ['r52-f4-e', 60, 6], ['r52-f4-e', 100, -6], ['r52-f4-a', 100, 0], ['r52-f4-b', 14, -2],
    ] as const) {
      const world = coachedWorld(seed, 'sunny')
      const step = pose(world, week, chem)
      const tile = toSnapshot(world).coachFeel
      expect(tile, `${seed} w${week} chem ${chem}: the tile and the unit`).toBe(step)
      steps.add(step)
      for (const id of ROWS) expect(has(world, id, 'sunny', 'school'), `${seed} w${week} chem ${chem}: ${id} under the tile's ${tile}`).toBe(SIDE[id].steps.includes(tile as CoachFeel))
      checked++
    }
    expect(checked).toBe(12)
    expect(steps.size, 'the twelve poses read more than one step, or parity is a claim about one').toBeGreaterThanOrEqual(3)
  })
})

// =================================================================================================
// D. THE REAL DRAW – the shipped roll, over many careers, her feel read the moment before each roll
// =================================================================================================

interface Draw {
  id: RowId
  stage: DiaryLifeStage
  feel: CoachFeel | null
}
const WALK_CAREERS = 36
/** Twenty-four years: school, after-school, and the independent years (the 22nd birthday) well inside the walk. */
const WALK_WEEKS = 52 * 24
const LEVEL_OF_CAREER = [-8, 0, 8]

let drawMemo: { draws: Draw[]; conversations: Record<string, number>; coachedYears: number } | null = null
function drawn(): { draws: Draw[]; conversations: Record<string, number>; coachedYears: number } {
  if (drawMemo !== null) return drawMemo
  const draws: Draw[] = []
  const conversations: Record<string, number> = {}
  let coachedWeeks = 0
  for (let i = 0; i < WALK_CAREERS; i++) {
    const world = careerAt(`r52-f4-walk-${i}`, TEMPERAMENTS[i % TEMPERAMENTS.length]!)
    if (world.coachId === null) throw new Error('a fresh world is supposed to have a coach from the first week')
    world.coachPairs[world.coachId] = { chem: LEVEL_OF_CAREER[i % LEVEL_OF_CAREER.length]!, phase: 0, standing: 0 }
    const feels = new Map<number, CoachFeel | null>()
    const said = walk(world, WALK_WEEKS, (w, week) => {
      feels.set(week, coachFeel(w))
      if (w.coachId !== null) coachedWeeks++
    })
    for (const s of said) {
      conversations[s.stage] = (conversations[s.stage] ?? 0) + 1
      const id = ROWS.find((r) => s.detail === `${SIDE[r].subject}:${r}`)
      if (id !== undefined) draws.push({ id, stage: s.stage, feel: feels.get(s.week) ?? null })
    }
  }
  drawMemo = { draws, conversations, coachedYears: coachedWeeks / 52 }
  return drawMemo
}

describe('round 52 F4 D – the shipped draw hands her a coach-feel row only while her feel is on its side', () => {
  it('⭐⭐⭐ every draw of the three had its fact true at the moment of the roll, at a stage the row lists – and each row, and the independent years, were really reached', () => {
    const { draws, conversations, coachedYears } = drawn()
    const per: Record<string, Record<string, number>> = {}
    for (const d of draws) {
      expect(d.feel, `${d.id} at ${d.stage}: her feel when it was drawn`).not.toBeNull()
      expect(SIDE[d.id].steps, `${d.id}: drawn while her feel was ${d.feel}`).toContain(d.feel)
      expect(LISTED, `${d.id}: drawn at ${d.stage}`).toContain(d.stage)
      per[d.id] = per[d.id] ?? {}
      per[d.id]![d.stage] = (per[d.id]![d.stage] ?? 0) + 1
    }
    if (REPORT) {
      // eslint-disable-next-line no-console
      console.info(`R52_F4_REPORT walk ${JSON.stringify({ careers: WALK_CAREERS, weeks: WALK_WEEKS, coachedYears, conversations, draws: draws.length, per })}`)
    }
    // ⚠ ANTI-VACUITY: a draw of nothing proves nothing. Every stage was walked, every row drawn, and the independent years among the draws.
    for (const stage of LISTED) expect(conversations[stage] ?? 0, `${stage}: conversations walked`).toBeGreaterThan(100)
    expect(conversations.college ?? 0, 'a career with no college fork never walks the college stage').toBe(0)
    for (const id of ROWS) expect(draws.filter((d) => d.id === id).length, `${id} drawn at least once`).toBeGreaterThan(0)
    expect(draws.filter((d) => d.stage === 'independent').length, 'the independent years reached a coach-feel row').toBeGreaterThan(0)
  })
})

// =================================================================================================
// E. PLAYED, COACHED CAREERS – the real tick, and how often a player meets one
// =================================================================================================

interface Played {
  coachedWeeks: number
  conversations: number
  hits: Record<RowId, number>
  draws: number
  next3: number[]
  /** ROUND 52 H2: how many of the conversations were one of the six stint rows (R70–R75). */
  stintHits: number
}
/** One econ-bench career walked with the real tick, the parent answering every small talk the moment it is raised (`schoolTranche.walk`'s own arm) and draining any blocking beat. */
function play(presetIdx: number, index: number, weeks: number): Played {
  const policy = POLICIES[0]!
  const { world, rng: base } = openCareer(PRESETS[presetIdx]!, index, policy)
  let draws = 0
  const rng = (): number => {
    draws++
    return base()
  }
  const hits: Record<RowId, number> = { 'the-thing-that-makes-sense': 0, 'practice-feels-different': 0, 'the-thing-she-cannot-name': 0 }
  let coachedWeeks = 0
  let conversations = 0
  let stintHits = 0
  let seen = 0
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(world, rng, policy)
    drainLifeBeats(world)
    if (world.coachId !== null) coachedWeeks++
    const log = lifeLogOf(world)
    for (; seen < log.length; seen++) {
      const row = log[seen]!
      if (row.kind !== 'small-talk') continue
      conversations++
      const id = ROWS.find((r) => row.detail === `${SIDE[r].subject}:${r}`)
      if (id !== undefined) hits[id]++
      if (STINT_ROWS.some((r) => row.detail === `${STINT[r].subject}:${r}`)) stintHits++
      if (row.answer === undefined) row.answer = 'more'
    }
  }
  return { coachedWeeks, conversations, hits, draws, next3: [base(), base(), base()], stintHits }
}

describe('round 52 F4 E – how often a played, coached career meets one', () => {
  it('the walk has a denominator, and the rate per coached year is measured (R52_F4_REPORT=1 prints it; R52_F4_SCALE=big is the spec\'s measurement)', () => {
    // presets with a coach on the payroll from the start: every tier but `self`
    const presets = BIG ? [1, 2, 4, 5, 6, 7, 8] : [5]
    const careers = BIG ? 6 : 2
    const weeks = BIG ? 312 : 104
    const total = { coachedWeeks: 0, conversations: 0, hits: { 'the-thing-that-makes-sense': 0, 'practice-feels-different': 0, 'the-thing-she-cannot-name': 0 } as Record<RowId, number> }
    for (const p of presets) {
      for (let i = 0; i < careers; i++) {
        const r = play(p, i, weeks)
        total.coachedWeeks += r.coachedWeeks
        total.conversations += r.conversations
        for (const id of ROWS) total.hits[id] += r.hits[id]
      }
    }
    const years = total.coachedWeeks / 52
    const perYear = Object.fromEntries(ROWS.map((id) => [id, Math.round((1000 * total.hits[id]) / years) / 1000]))
    const all = ROWS.reduce((n, id) => n + total.hits[id], 0)
    if (REPORT) {
      // eslint-disable-next-line no-console
      console.info(`R52_F4_REPORT played ${JSON.stringify({ presets, careers, weeks, coachedYears: Math.round(years * 10) / 10, conversations: total.conversations, perCoachedYear: Math.round((1000 * total.conversations) / years) / 1000, hits: total.hits, hitsPerCoachedYear: perYear, anyPerCoachedYear: Math.round((1000 * all) / years) / 1000 })}`)
    }
    expect(total.coachedWeeks, 'coached weeks walked').toBeGreaterThan(weeks)
    expect(total.conversations, 'conversations walked').toBeGreaterThan(0)
  }, BIG ? 3_000_000 : undefined)
})

// =================================================================================================
// F. ZERO MAIN DRAWS, ZERO EFFECTS
// =================================================================================================

describe('round 52 F4 F – the rows tap no MAIN draw and their answers move nothing', () => {
  it('⭐⭐ the same played career with and without the three rows taps the same number of MAIN draws and ends on the same next three', () => {
    const live = SMALL_TALK_SITUATIONS as unknown as SmallTalkSituation[]
    const withRows = play(5, 0, 104)
    // ⚠ RE-AIMED 14.10 (r52, builder H2): the three are no longer the LAST three – R70–R75 follow them – so they are found by id and put back where they stood.
    const at = live.findIndex((s) => s.id === ROWS[0])
    const removed = live.splice(at, 3)
    let without: Played
    try {
      expect(removed.map((s) => s.id), 'the three that were taken out').toEqual([...ROWS])
      without = play(5, 0, 104)
    } finally {
      live.splice(at, 0, ...removed)
    }
    expect(SMALL_TALK_SITUATIONS.slice(at, at + 3).map((s) => s.id), 'and they are back, in order').toEqual([...ROWS])
    expect(withRows.draws, 'the tick tapped MAIN at all (anti-vacuity)').toBeGreaterThan(1000)
    expect(withRows.conversations, 'and she talked, so the facts were asked').toBeGreaterThan(0)
    expect(withRows.draws, 'MAIN draws with the three rows').toBe(without.draws)
    expect(withRows.next3, 'and the stream\'s next three').toEqual(without.next3)
  })

  it('⭐ answering any of the three with any stance moves neither the bond, nor her spirit, nor the coach pair the gauge reads', () => {
    // The real roll must raise the row, so the answer is about a real conversation. The other situations are taken out of the catalogue for the walk (and put back, in order):
    // the roll then raises the one row whose fact is true on the first week the chance lets her talk, and the walk is a few dozen weeks and not a few thousand.
    const live = SMALL_TALK_SITUATIONS as unknown as SmallTalkSituation[]
    // ⚠ RE-AIMED 14.10 (r52, builder H2): everything but the three is taken out – the rows before them AND R70–R75 after them – and put back in order.
    const at = live.findIndex((s) => s.id === ROWS[0])
    const tail = live.splice(at + 3)
    const head = live.splice(0, at)
    const raised: { id: RowId; json: string }[] = []
    try {
      expect(live.map((s) => s.id), 'only the three are left in the catalogue').toEqual([...ROWS])
      for (const [id, chem] of [['the-thing-that-makes-sense', 12], ['practice-feels-different', 0], ['the-thing-she-cannot-name', -12]] as const) {
        const world = coachedWorld(`r52-f4-answer-${id}`, 'sunny')
        world.bond = bondFor('close')
        let found = false
        for (let w = 14; w < 1500 && !found; w++) {
          pose(world, w, chem)
          const before = lifeLogOf(world).length
          rollSmallTalk(world)
          const log = lifeLogOf(world)
          if (log.length === before) continue
          if (log[log.length - 1]!.detail === `${SIDE[id].subject}:${id}`) found = true
          else log[log.length - 1]!.answer = 'easy'
        }
        expect(found, `${id}: the real roll raised it`).toBe(true)
        raised.push({ id, json: JSON.stringify(world) })
      }
    } finally {
      live.unshift(...head)
      live.push(...tail)
    }
    expect(SMALL_TALK_SITUATIONS.length, 'the catalogue is whole again').toBeGreaterThanOrEqual(74)
    expect(SMALL_TALK_SITUATIONS.slice(at, at + 3).map((s) => s.id), 'and in order').toEqual([...ROWS])
    for (const { id, json } of raised) {
      for (const stance of ['more', 'view', 'easy'] as const) {
        const world = JSON.parse(json) as WorldState
        const bond = world.bond
        const spirit = JSON.stringify(world.spirit)
        const pairs = JSON.stringify(world.coachPairs)
        answerLifeBeat(world, stance)
        expect(world.bond, `${id}/${stance}: bond`).toBe(bond)
        expect(JSON.stringify(world.spirit), `${id}/${stance}: spirit`).toBe(spirit)
        expect(JSON.stringify(world.coachPairs), `${id}/${stance}: the coach pair`).toBe(pairs)
      }
    }
  })
})

// =================================================================================================
// G. THE COPY RULES
// =================================================================================================

function copyLines(): { where: string; text: string; label: boolean }[] {
  const lines: { where: string; text: string; label: boolean }[] = []
  for (const id of ROWS) {
    const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
    if (s === undefined) throw new Error(`${id}: not in the catalogue`)
    for (const voice of TEMPERAMENTS) {
      const col = s.voices[voice]!
      lines.push({ where: `${id}/${voice}/opener`, text: col.opener, label: false })
      for (const stance of ['invite', 'respond', 'space'] as const) {
        lines.push({ where: `${id}/${voice}/${stance}/label`, text: col.branches[stance].label, label: true })
        lines.push({ where: `${id}/${voice}/${stance}`, text: col.branches[stance].said, label: false })
      }
    }
  }
  return lines
}

describe('round 52 F4 G – the three keep the addendum\'s rules', () => {
  it('the sweep has something to sweep – 3 rows x 4 voices x (opener, 3 labels, 3 replies)', () => {
    expect(copyLines().length).toBe(3 * 4 * 7)
  })

  it('⭐⭐ the coach is never pronoun-ed: a line that names the coach carries no third-person pronoun at all, and no masculine pronoun stands anywhere (R15-7)', () => {
    const pronoun = /\b(he|she|him|her|his|hers|himself|herself|they|them|their|theirs|themselves)\b/i
    let namingTheCoach = 0
    for (const { where, text } of copyLines()) {
      expect(/\b(he|his|him|himself)\b/i.test(text), `${where}: masculine pronoun in «${text}»`).toBe(false)
      if (!/coach/i.test(text)) continue
      namingTheCoach++
      expect(pronoun.test(text), `${where}: a third-person pronoun beside the coach in «${text}»`).toBe(false)
    }
    expect(namingTheCoach, 'the lines that name the coach exist – the rule is not vacuous').toBeGreaterThan(8)
  })

  it('no «today», no exclamation mark, no digit, no long dash', () => {
    const rules: [string, RegExp][] = [['today', /\btoday\b/i], ['exclamation mark', /!/], ['digit', /\d/], ['long dash', /—/]]
    for (const { where, text } of copyLines()) for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
  })

  it('⭐ the gate licenses a FEELING: no result, no skill claim, no money, no injury – doubt and never a verdict («не "всё плохо"»)', () => {
    const rules: [string, RegExp][] = [
      // `lose` is deliberately not in the list: «so I wouldn't lose it» is misplacing a note, and a result is spelled won / lost / beat / score
      ['a result', /\b(won|win|wins|lost|loses|beat|beaten|score|ranking|trophy)\b/i],
      ['a skill claim', /\b(improv\w*|progress\w*|stronger|weaker|learned|learnt|mastered|got better|getting better)\b/i],
      ['money', /\b(money|pay|paid|cost|costs|price|afford|fee|fees)\b/i],
      ['injury or fatigue', /\b(injur\w*|hurt|ache|aches|pain|tired|exhausted|sore)\b/i],
      ['a verdict on the coach', /\b(bad|terrible|awful|useless|hate|hates|wrong|worst|rubbish)\b/i],
    ]
    for (const { where, text } of copyLines()) for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
  })

  it('every opener and reply is unique in the WHOLE corpus – no exact duplicate against any other situation', () => {
    const seen = new Map<string, number>()
    const bump = (s: string): void => void seen.set(s, (seen.get(s) ?? 0) + 1)
    for (const s of SMALL_TALK_SITUATIONS) {
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]
        if (col === undefined) continue
        bump(col.opener)
        if (col.shared !== undefined) bump(col.shared)
        for (const stance of ['invite', 'respond', 'space'] as const) bump(col.branches[stance].said)
      }
    }
    for (const { where, text, label } of copyLines()) {
      if (label) continue
      expect(seen.get(text), `${where}: «${text}» appears elsewhere in the corpus`).toBe(1)
    }
  })

  it('the shape: three labels the same in all four voices, no second beat, four voices, and a branch carries a label and a line and NOTHING ELSE (no effect)', () => {
    for (const id of ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      expect(Object.keys(s.voices).sort(), `${id}: four voices`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const stance of ['invite', 'respond', 'space'] as const) {
        expect(new Set(TEMPERAMENTS.map((v) => s.voices[v]!.branches[stance].label)).size, `${id}/${stance}: one label for the four voices`).toBe(1)
      }
      for (const voice of TEMPERAMENTS) {
        expect(s.voices[voice]!.shared, `${id}/${voice}: no second beat`).toBeUndefined()
        for (const stance of ['invite', 'respond', 'space'] as const) {
          expect(Object.keys(s.voices[voice]!.branches[stance]).sort(), `${id}/${voice}/${stance}: label and said only`).toEqual(['label', 'said'])
        }
      }
    }
    // ⚠ RE-AIMED 14.10 (r52, builder H2): «appended LAST» became “three rows, then the six stint rows” – R70–R75 follow R69.
    expect(SMALL_TALK_SITUATIONS.slice(-9, -6).map((s) => s.id), 'appended after R66, in the document\'s order, with R70–R75 after them').toEqual([...ROWS])
  })
})

// =================================================================================================
// H. NO LINE COLLIDES WITH ANOTHER STRING IN src/
// =================================================================================================

describe('round 52 F4 H – no new line is also a string somewhere else in src/', () => {
  function sourceText(): { file: string; text: string }[] {
    const root = new URL('../src/', import.meta.url)
    const out: { file: string; text: string }[] = []
    for (const rel of readdirSync(root, { recursive: true }) as string[]) {
      if (!/\.(ts|vue)$/.test(rel)) continue
      if (rel === 'engine/world/smallTalkCorpus.ts') continue
      out.push({ file: rel, text: readFileSync(new URL(rel, root), 'utf8') })
    }
    return out
  }

  it('⭐⭐ none of the 57 new strings appears in any other source file', () => {
    const files = sourceText()
    expect(files.length, 'source files scanned').toBeGreaterThan(200)
    expect(files.some((f) => f.file === 'engine/world/albumCorpus.ts'), 'the file that collided in round 51 is in the scan').toBe(true)
    let checked = 0
    for (const { where, text } of copyLines()) {
      const bare = text.replace(/^"/, '').replace(/"$/, '')
      const escaped = bare.replace(/'/g, "\\'")
      checked++
      for (const f of files) expect(f.text.includes(bare) || f.text.includes(escaped), `${where}: «${bare}» is also in src/${f.file}`).toBe(false)
    }
    // 12 openers + 36 replies + 9 distinct labels = 57, and the labels are checked once per voice here (the sweep walks every column)
    expect(checked, 'the strings checked (every column of every row)').toBe(3 * 4 * 7)
  })
})

// =================================================================================================
// I. THE RUSSIAN IS THERE
// =================================================================================================

describe('round 52 F4 I – every new English line has its Russian in ru.json', () => {
  const ru = JSON.parse(readFileSync(new URL('../src/i18n/ru.json', import.meta.url), 'utf8')) as Record<string, string>

  it('⭐⭐ 57 keys, each with a Russian value that is Cyrillic, has no Latin letter, wears the guillemets on a spoken line, and never puts a past-tense masculine verb on the coach', () => {
    const keys = new Map<string, boolean>()
    for (const { text, label } of copyLines()) keys.set(text, label)
    expect(keys.size, '12 openers + 36 replies + 9 distinct labels').toBe(57)
    for (const [key, label] of keys) {
      const value = ru[key]
      expect(value, `no Russian for «${key}»`).toBeTypeOf('string')
      expect(value, `the Russian of «${key}» is the English`).not.toBe(key)
      expect(/[Ѐ-ӿ]/.test(value!), `«${value}» has no Cyrillic letter`).toBe(true)
      expect(/[A-Za-z]/.test(value!), `«${value}» still holds a Latin letter`).toBe(false)
      expect(/[!\d—]/.test(value!), `«${value}» holds an exclamation mark, a digit or a long dash`).toBe(false)
      if (!label) expect(value!.startsWith('«') && value!.endsWith('»'), `«${value}» does not wear the guillemets`).toBe(true)
      // R15-7 in Russian: the noun «тренер» carries no sex, but a past-tense verb that follows it as its subject does («тренер сказал»). The cheap honest check is adjacency.
      expect(/тренер\S*\s+\S*(ал|ил|ел|ул|ыл|ял|ёл)(\s|[.,;:–]|$)/i.test(value!), `«${value}»: a past-tense verb right after the coach`).toBe(false)
    }
  })
})

// =================================================================================================
// ROUND 52 H2 (14.10) – THE STINT ROWS R70–R75: HALF A YEAR AND A YEAR TOGETHER
// =================================================================================================
// The owner, 14.10: «на тему смол-тока – нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше поменять».
// Six more situations about the coach – half a year ×3 (R70 good-news, R71 observation, R72 worry) and a year together ×3 (R73 good-news, R74 and R75 decisions) – each behind ONE SIDE of her feel
// AND the stint's age. The sides are R67–R69's; the windows are in weeks together: half a year [24, 44), a year [48, ∞). The facts live in the leaf `world/coachFeel.ts` (`coachFeelStintFacts`), which the
// hub spreads into `SMALL_TALK_FACT` handing it `inCollege`. THE MECHANISM THAT RAISES THEM AT THE CHECKPOINT WEEKS (12 / 32 / 56) IS THE NEXT ITEM'S: until it lands they come up in ordinary small talk.
//
//   J  each fact is true for exactly its side AND its window: a grid that reaches all six steps and crosses every window edge on every side, the stint counted from the LAST hire, nobody employed, college;
//   K  the stage × voice grid: the row is in the pool at school / after-school / independent and at no other, in all four voices, and only with its fact true;
//   L  PARITY: the six agree with `coachFeel` and with the tile, and (inside the windows) with R67–R69's three facts – the two spellings of the sides are held together here;
//   M  THE REAL ROLL: the shipped `rollSmallTalk` raises a stint row only inside its window, on its side, and raising one moves nothing (ruling V2);
//   N  ZERO MAIN DRAWS; O the copy rules, with the age said in words that match the window; P no line is a string elsewhere in src/; Q the Russian is there.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER OF H2 – each arm run in the shared checkout on a backup-and-restore of ONE file (src/engine/world/coachFeel.ts), compared by cmp and sha256 afterwards: a28ca7c71394f967 before and after, every arm.
// -------------------------------------------------------------------------------------------------
//   ARM 0  THE SHIPPED TREE: 41 tests green in this file (npx vitest run --project unit tests/r52-coach-feel-talk.test.ts) – F4's 19 are A–I, H2's 22 are J–R.
//   H-M1  `COACH_TALK_HALF_YEAR_UNTIL_WEEK` 44 → 48: 5 RED of 40 (the file held 40 tests when the arms ran; R, the rate measurement, came after and mutates nothing) – the design's-numbers case, the grid, the re-hire case, the parity-with-the-tile case and the long-stint roll.
//   H-M2  `coach-feel-cold-year` also reads `unsure` (COLD_SIDE plus a step): 7 RED – the grid, the re-hire case, the stage × voice grid, both parity cases and the two M cases that read the draw.
//   H-M3  `COACH_TALK_YEAR_FROM_WEEK` 48 → 44: 5 RED – the same five as H-M1 (the halves would overlap).
//   H-M4  the college clause removed (`if (world.coachId === null) return false`): 1 RED – the nobody-employed-or-college case; the other 39 stay green.
//   H-M5  the upper edge off by one (`weeks > until` for `weeks >= until`): 4 RED – the grid, the re-hire case, the tile parity case and the long-stint roll.
//   H-M6  the lower edge off by one (`weeks <= from` for `weeks < from`): 6 RED – the grid, the re-hire case, the college case, the stage × voice grid and both parity cases.
//   CONTROL FOR THE DIGEST PINS – with the six facts forced false (`return false` at the head of the read) the 13 digest-family files (coach-travel-edge x10, i18n-l3-7-twin, succession-s1-start-year,
//   i18n-l3-5-life-beats) are green, 141 tests; with them live 30 tests in 7 files are red: coach-travel-edge 3, -late-schemas 8, -prior-schemas 3, -recent-schemas 10, i18n-l3-7-twin 2,
//   succession-s1-start-year 3, PICK-STABILITY in i18n-l3-5-life-beats 1 (career 5/0). NOT re-stamped here – the architect re-stamps them once, on the final tree.
// -------------------------------------------------------------------------------------------------

const STINT_ROWS = [
  'half-a-year-and-it-fits',
  'half-a-year-and-still-unsure',
  'months-in-and-still-waiting',
  'a-year-and-she-would-not-swap',
  'a-year-and-she-still-does-not-know',
  'a-year-in-we-need-to-talk',
] as const
type StintId = (typeof STINT_ROWS)[number]
type Side = 'warm' | 'unsure' | 'cold'
const SIDES: readonly Side[] = ['warm', 'unsure', 'cold']
const SIDE_STEPS: Record<Side, readonly CoachFeel[]> = { warm: ['seems-good', 'good'], unsure: ['unsure'], cold: ['seems-off', 'off'] }
/** ⚠ THE WINDOWS ARE THE DESIGN'S OWN NUMBERS, WRITTEN OUT ON PURPOSE: a test that read the constants back would pass for any value. [from, until) in weeks together. */
const HALF_WINDOW: readonly [number, number] = [24, 44]
const YEAR_WINDOW: readonly [number, number] = [48, Number.POSITIVE_INFINITY]
const STINT: Record<StintId, { fact: string; subject: string; side: Side; window: readonly [number, number] }> = {
  'half-a-year-and-it-fits': { fact: 'coach-feel-warm-half', subject: 'good-news', side: 'warm', window: HALF_WINDOW },
  'half-a-year-and-still-unsure': { fact: 'coach-feel-unsure-half', subject: 'observation', side: 'unsure', window: HALF_WINDOW },
  'months-in-and-still-waiting': { fact: 'coach-feel-cold-half', subject: 'worry', side: 'cold', window: HALF_WINDOW },
  'a-year-and-she-would-not-swap': { fact: 'coach-feel-warm-year', subject: 'good-news', side: 'warm', window: YEAR_WINDOW },
  'a-year-and-she-still-does-not-know': { fact: 'coach-feel-unsure-year', subject: 'decision', side: 'unsure', window: YEAR_WINDOW },
  'a-year-in-we-need-to-talk': { fact: 'coach-feel-cold-year', subject: 'decision', side: 'cold', window: YEAR_WINDOW },
}
/** R67–R69's twin of each stint row: the same side, no window. */
const FIRST_IMPRESSION_OF = (id: StintId): RowId => ROWS[SIDES.indexOf(STINT[id].side)] as RowId
const inWindow = (id: StintId, weeksTogether: number): boolean => weeksTogether >= STINT[id].window[0] && weeksTogether < STINT[id].window[1]
const stintTrue = (id: StintId, weeksTogether: number, step: CoachFeel): boolean => inWindow(id, weeksTogether) && SIDE_STEPS[STINT[id].side].includes(step)
const hasRow = (world: WorldState, id: string, voice: Temperament, stage: DiaryLifeStage): boolean => reachableSituations(world, voice, stage).some((s) => s.id === id)
/** Weeks the grid poses: both sides of every window edge (23|24, 43|44, 47|48), the checkpoints (32, 56) and the early weeks. 100 is the furthest F4's grid trusts the roster for. */
const STINT_WEEKS = [3, 8, 14, 23, 24, 30, 32, 43, 44, 47, 48, 56, 60, 100]

function stintSweep(voice: Temperament, visit: (world: WorldState, step: CoachFeel, weeksTogether: number, where: string) => void): void {
  for (const seed of SEEDS) {
    const world = coachedWorld(seed, voice)
    for (const week of STINT_WEEKS) {
      for (const chem of LEVELS) {
        const step = pose(world, week, chem)
        visit(world, step, world.week - coachSinceWeek(world), `${seed}/${voice} week ${week} chem ${chem} -> ${step}`)
      }
    }
  }
}

/** The first pose of the grid where the stint fact of `id` is `want`; when `want` is false the week is INSIDE the window and only the side is wrong, so the window is not what made it false. */
function stintWorld(voice: Temperament, id: StintId, want: boolean): WorldState {
  for (const seed of SEEDS) {
    const world = coachedWorld(seed, voice)
    for (const week of STINT_WEEKS) {
      for (const chem of LEVELS) {
        const step = pose(world, week, chem)
        if (want ? stintTrue(id, week, step) : inWindow(id, week) && !SIDE_STEPS[STINT[id].side].includes(step)) return world
      }
    }
  }
  throw new Error(`no pose of the grid makes ${STINT[id].fact} ${want}`)
}

describe('round 52 H2 J – each stint fact is true for exactly its side AND its window', () => {
  it('⭐⭐⭐ the roster carries the six names; the rows carry them as fact, subject and stages; and they are the last six rows, in the document\'s order', () => {
    for (const id of STINT_ROWS) {
      expect(SMALL_TALK_FACTS, `${STINT[id].fact} is in the roster`).toContain(STINT[id].fact)
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      expect(s.fact, `${id}: fact`).toBe(STINT[id].fact)
      expect(s.subject, `${id}: subject`).toBe(STINT[id].subject)
      expect([...s.stages].sort(), `${id}: stages – school, after-school and independent, and NOT college`).toEqual([...LISTED].sort())
    }
    expect(SMALL_TALK_SITUATIONS.slice(-6).map((s) => s.id), 'appended LAST, after R69, in the document\'s order').toEqual([...STINT_ROWS])
    expect(new Set(SMALL_TALK_FACTS).size, 'no name twice in the roster').toBe(SMALL_TALK_FACTS.length)
  })

  it('⭐⭐ the windows are the design\'s numbers: 24 / 44 / 48, no ceiling on the year, every edge a feel-period boundary, the checkpoints (32 and 56) inside and the halves never overlapping', () => {
    expect([COACH_TALK_HALF_YEAR_FROM_WEEK, COACH_TALK_HALF_YEAR_UNTIL_WEEK, COACH_TALK_YEAR_FROM_WEEK]).toEqual([24, 44, 48])
    expect(COACH_TALK_YEAR_UNTIL_WEEK, 'the year is a floor').toBe(Number.POSITIVE_INFINITY)
    for (const w of [24, 32, 44, 48, 56]) expect(w % COACH_FEEL.periodWeeks, `week ${w} is a feel-period boundary (her doubt is redrawn there)`).toBe(0)
    expect(32 >= COACH_TALK_HALF_YEAR_FROM_WEEK && 32 < COACH_TALK_HALF_YEAR_UNTIL_WEEK, 'the half-year checkpoint is inside its window').toBe(true)
    expect(56 >= COACH_TALK_YEAR_FROM_WEEK && 56 < COACH_TALK_YEAR_UNTIL_WEEK, 'the year checkpoint is inside its window').toBe(true)
    expect(COACH_TALK_HALF_YEAR_UNTIL_WEEK <= COACH_TALK_YEAR_FROM_WEEK, '«months» and «a year» are never both true').toBe(true)
  })

  it('⭐⭐⭐ over the grid: the row is in the pool exactly when her feel is on its side AND the stint is inside its window – all six steps reached, each fact true and false somewhere, every window edge crossed on every side', () => {
    const seen = new Set<CoachFeel>()
    const yes = new Map<StintId, number>()
    const no = new Map<StintId, number>()
    const sidesAt = new Map<number, Set<Side>>()
    stintSweep('sunny', (world, step, weeks, where) => {
      seen.add(step)
      for (const side of SIDES) if (SIDE_STEPS[side].includes(step)) sidesAt.set(weeks, (sidesAt.get(weeks) ?? new Set<Side>()).add(side))
      for (const id of STINT_ROWS) {
        const want = stintTrue(id, weeks, step)
        expect(hasRow(world, id, 'sunny', 'school'), `${where}: ${id}`).toBe(want)
        const tally = want ? yes : no
        tally.set(id, (tally.get(id) ?? 0) + 1)
      }
    })
    // ⚠ ANTI-VACUITY: the grid reached every step, every fact was both true and false, and – the point of a WINDOW test – every edge week (the last week outside and the first inside, at both ends of both
    // windows) was posed on all three sides. A bound moved by a week then flips a pose that exists.
    expect([...seen].sort(), 'the grid reached all six steps').toEqual([...STEPS].sort())
    for (const id of STINT_ROWS) {
      expect(yes.get(id) ?? 0, `${id}: true somewhere`).toBeGreaterThan(0)
      expect(no.get(id) ?? 0, `${id}: false somewhere`).toBeGreaterThan(0)
    }
    for (const w of [23, 24, 43, 44, 47, 48]) expect([...(sidesAt.get(w) ?? [])].sort(), `week ${w}: all three sides were posed on the edge`).toEqual(['cold', 'unsure', 'warm'])
  })

  it('⭐⭐ the stint is counted from the LAST hire: let go and hired back at week 100, week 124 is twenty-four weeks together (a half-year row) and week 148 is forty-eight (a year row) – and the founding stint reads the other way', () => {
    const rehired = coachedWorld('r52-h2-hire', 'sunny')
    const coach = rehired.coachId as string
    rehired.week = 100
    hireCoach(rehired, null)
    hireCoach(rehired, coach)
    expect(rehired.coachId, 'hired back').toBe(coach)
    expect(coachSinceWeek(rehired), 'the stint restarted at the hire').toBe(100)
    const founding = coachedWorld('r52-h2-hire', 'sunny')
    const tally = { halfOnRehired: 0, yearOnRehired: 0, yearOnFounding: 0, halfOnFounding: 0 }
    for (const week of [123, 124, 130, 143, 144, 147, 148, 160]) {
      for (const chem of LEVELS) {
        const stepR = pose(rehired, week, chem)
        const stepF = pose(founding, week, chem)
        for (const id of STINT_ROWS) {
          expect(hasRow(rehired, id, 'sunny', 'school'), `re-hired, week ${week} chem ${chem} -> ${stepR}: ${id} (${week - 100} weeks together)`).toBe(stintTrue(id, week - 100, stepR))
          expect(hasRow(founding, id, 'sunny', 'school'), `founding, week ${week} chem ${chem} -> ${stepF}: ${id} (${week} weeks together)`).toBe(stintTrue(id, week, stepF))
          if (stintTrue(id, week - 100, stepR)) tally[STINT[id].window === HALF_WINDOW ? 'halfOnRehired' : 'yearOnRehired']++
          if (stintTrue(id, week, stepF)) tally[STINT[id].window === HALF_WINDOW ? 'halfOnFounding' : 'yearOnFounding']++
        }
      }
    }
    expect(tally.halfOnRehired, 'a re-hired stint meets half-year rows').toBeGreaterThan(0)
    expect(tally.yearOnRehired, 'and year rows once forty-eight weeks old').toBeGreaterThan(0)
    expect(tally.yearOnFounding, 'the founding stint is a year old throughout').toBeGreaterThan(0)
    expect(tally.halfOnFounding, 'and never in a half-year window again').toBe(0)
  })

  it('⭐ nobody employed or at college: false on every side and every week – and true again with the coach back or college cleared (the controls)', () => {
    for (const id of STINT_ROWS) {
      const world = stintWorld('deep', id, true)
      expect(hasRow(world, id, 'deep', 'school'), `${id}: control – true with a coach and no college`).toBe(true)
      world.college = { fromWeek: 0, untilWeek: 1_000_000 } as unknown as WorldState['college']
      for (const stage of LISTED) for (const r of STINT_ROWS) expect(hasRow(world, r, 'deep', stage), `${id}/${stage}: ${r} in college`).toBe(false)
      world.college = null
      expect(hasRow(world, id, 'deep', 'school'), `${id}: true again once college is cleared`).toBe(true)
      hireCoach(world, null)
      for (const stage of ALL_STAGES) for (const r of STINT_ROWS) expect(hasRow(world, r, 'deep', stage), `${id}/${stage}: ${r} with nobody employed`).toBe(false)
    }
  })
})

describe('round 52 H2 K – the stage and voice grid', () => {
  it('⭐⭐ with its fact true a stint row is in the pool at school, after-school and independent and at NO other stage, in all four voices – and with the fact false (inside the window, wrong side) it is in none', () => {
    for (const voice of TEMPERAMENTS) {
      for (const id of STINT_ROWS) {
        const on = stintWorld(voice, id, true)
        for (const stage of ALL_STAGES) expect(hasRow(on, id, voice, stage), `${voice}/${stage}: ${id} with its fact true`).toBe(LISTED.includes(stage))
        const off = stintWorld(voice, id, false)
        for (const stage of ALL_STAGES) expect(hasRow(off, id, voice, stage), `${voice}/${stage}: ${id} inside its window on the wrong side`).toBe(false)
      }
    }
  })
})

describe('round 52 H2 L – the six agree with `coachFeel`, with the tile, and with R67–R69\'s sides', () => {
  it('⭐⭐ the snapshot\'s `coachFeel` IS `coachFeel(world)`, the stint age is `coachSinceWeek`\'s, and the pool follows both', () => {
    let checked = 0
    const steps = new Set<CoachFeel>()
    for (const [seed, week, chem] of [
      ['r52-f4-a', 24, 6], ['r52-f4-a', 43, -6], ['r52-f4-b', 44, 12], ['r52-f4-b', 48, 0], ['r52-f4-c', 30, -12], ['r52-f4-c', 100, 6],
      ['r52-f4-d', 56, -2], ['r52-f4-d', 32, 0], ['r52-f4-e', 47, 12], ['r52-f4-e', 60, -12], ['r52-f4-a', 23, 0], ['r52-f4-b', 14, -6],
    ] as const) {
      const world = coachedWorld(seed, 'sunny')
      const step = pose(world, week, chem)
      expect(toSnapshot(world).coachFeel, `${seed} w${week} chem ${chem}: the tile and the unit`).toBe(step)
      expect(coachFeel(world), 'and the unit is the unit').toBe(step)
      const weeks = world.week - coachSinceWeek(world)
      for (const id of STINT_ROWS) expect(hasRow(world, id, 'sunny', 'school'), `${seed} w${week} chem ${chem}: ${id} under ${step}`).toBe(stintTrue(id, weeks, step))
      steps.add(step)
      checked++
    }
    expect(checked).toBe(12)
    expect(steps.size, 'the twelve poses read more than one step, or parity is a claim about one').toBeGreaterThanOrEqual(3)
  })

  it('⭐⭐ the two spellings of the sides agree: inside its window a stint row is reachable exactly when R67–R69\'s row for the same side is – over the whole grid', () => {
    // The hub spells the three sides inline for R67–R69 and the leaf spells them for R70–R75. A step added to one and not the other would let the first-impression row and the half-year row disagree
    // about what «warm» is for the same girl on the same week.
    let compared = 0
    let inside = 0
    for (const voice of ['sunny', 'fiery'] as const) {
      stintSweep(voice, (world, _step, weeks, where) => {
        for (const id of STINT_ROWS) {
          if (!inWindow(id, weeks)) continue
          inside++
          expect(hasRow(world, id, voice, 'school'), `${where}: ${id} against ${FIRST_IMPRESSION_OF(id)}`).toBe(has(world, FIRST_IMPRESSION_OF(id), voice, 'school'))
          compared++
        }
      })
    }
    expect(compared, 'something was compared').toBeGreaterThan(300)
    expect(inside).toBe(compared)
  })
})

// =================================================================================================
// M. THE REAL ROLL – the shipped `rollSmallTalk`, the catalogue cut down to the six
// =================================================================================================

describe('round 52 H2 M – the shipped roll hands her a stint row only inside its window, on its side, and answering moves nothing', () => {
  /** Run `body` with the catalogue cut to the six stint rows (everything before them and after them taken out), and put back in order. */
  function withOnlyStintRows<T>(body: () => T): T {
    const live = SMALL_TALK_SITUATIONS as unknown as SmallTalkSituation[]
    const at = live.findIndex((s) => s.id === STINT_ROWS[0])
    const tail = live.splice(at + 6)
    const head = live.splice(0, at)
    try {
      expect(live.map((s) => s.id), 'only the six are left in the catalogue').toEqual([...STINT_ROWS])
      return body()
    } finally {
      live.unshift(...head)
      live.push(...tail)
    }
  }
  const CHEM_OF: Record<Side, number> = { warm: 12, unsure: 0, cold: -12 }

  it('⭐⭐⭐ each of the six is really raised by the roll, on a pose where its fact is true – and only it', () => {
    const raised: { id: StintId; json: string }[] = []
    withOnlyStintRows(() => {
      for (const id of STINT_ROWS) {
        let found = false
        for (let n = 0; n < 120 && !found; n++) {
          const world = coachedWorld(`r52-h2-roll-${id}-${n}`, 'sunny')
          world.bond = bondFor('close')
          const weeks = STINT[id].window[1] === Number.POSITIVE_INFINITY ? [48, 130] : [24, 43]
          for (let w = weeks[0]!; w <= weeks[1]! && !found; w++) {
            const step = pose(world, w, CHEM_OF[STINT[id].side])
            const before = lifeLogOf(world).length
            rollSmallTalk(world)
            const log = lifeLogOf(world)
            if (log.length === before) continue
            expect(log[log.length - 1]!.detail, `${id}: week ${w} (${step}) raised something else`).toBe(`${STINT[id].subject}:${id}`)
            expect(stintTrue(id, w, step), `${id}: raised on week ${w} while her feel was ${step}`).toBe(true)
            found = true
            raised.push({ id, json: JSON.stringify(world) })
          }
        }
        expect(found, `${id}: the real roll raised it`).toBe(true)
      }
    })
    expect(raised.length).toBe(6)
    for (const { id, json } of raised) {
      for (const stance of ['more', 'view', 'easy'] as const) {
        const world = JSON.parse(json) as WorldState
        const bond = world.bond
        const spirit = JSON.stringify(world.spirit)
        const pairs = JSON.stringify(world.coachPairs)
        answerLifeBeat(world, stance)
        expect(world.bond, `${id}/${stance}: bond`).toBe(bond)
        expect(JSON.stringify(world.spirit), `${id}/${stance}: spirit`).toBe(spirit)
        expect(JSON.stringify(world.coachPairs), `${id}/${stance}: the coach pair`).toBe(pairs)
      }
    }
  })

  it('⭐⭐ over a long stint, on each side, the roll raises a half-year row only on weeks 24 to 43 and a year row only from week 48 – and raises some of each', () => {
    const tally = { half: 0, year: 0 }
    withOnlyStintRows(() => {
      for (const side of SIDES) {
        for (let n = 0; n < 40; n++) {
          const world = coachedWorld(`r52-h2-long-${side}-${n}`, 'fiery')
          world.bond = bondFor('close')
          for (let w = 3; w <= 130; w++) {
            const step = pose(world, w, CHEM_OF[side])
            const before = lifeLogOf(world).length
            rollSmallTalk(world)
            const log = lifeLogOf(world)
            if (log.length === before) continue
            const row = log[log.length - 1]!
            const id = STINT_ROWS.find((r) => row.detail === `${STINT[r].subject}:${r}`)
            if (id !== undefined) {
              expect(stintTrue(id, w, step), `${id}: raised on week ${w} while her feel was ${step}`).toBe(true)
              tally[STINT[id].window === HALF_WINDOW ? 'half' : 'year']++
            }
            row.answer = 'easy'
          }
        }
      }
    })
    expect(tally.half, 'half-year rows were raised').toBeGreaterThan(0)
    expect(tally.year, 'year rows were raised').toBeGreaterThan(0)
  })

  it('the real walk: over 36 careers x 24 years every stint row drawn had its fact true at the roll (her feel read the moment before), inside its window and at a stage it lists', () => {
    const draws: { id: StintId; stage: DiaryLifeStage; feel: CoachFeel | null; weeks: number }[] = []
    for (let i = 0; i < WALK_CAREERS; i++) {
      const world = careerAt(`r52-h2-walk-${i}`, TEMPERAMENTS[i % TEMPERAMENTS.length]!)
      if (world.coachId === null) throw new Error('a fresh world is supposed to have a coach from the first week')
      world.coachPairs[world.coachId] = { chem: LEVEL_OF_CAREER[i % LEVEL_OF_CAREER.length]!, phase: 0, standing: 0 }
      const seenAt = new Map<number, { feel: CoachFeel | null; weeks: number }>()
      const said = walk(world, WALK_WEEKS, (w, week) => void seenAt.set(week, { feel: coachFeel(w), weeks: w.week - coachSinceWeek(w) }))
      for (const s of said) {
        const id = STINT_ROWS.find((r) => s.detail === `${STINT[r].subject}:${r}`)
        if (id !== undefined) draws.push({ id, stage: s.stage, feel: seenAt.get(s.week)?.feel ?? null, weeks: seenAt.get(s.week)?.weeks ?? -1 })
      }
    }
    for (const d of draws) {
      expect(d.feel, `${d.id}: her feel when it was drawn`).not.toBeNull()
      expect(stintTrue(d.id, d.weeks, d.feel as CoachFeel), `${d.id}: drawn at ${d.weeks} weeks together while her feel was ${d.feel}`).toBe(true)
      expect(LISTED, `${d.id}: drawn at ${d.stage}`).toContain(d.stage)
    }
    const per = Object.fromEntries(STINT_ROWS.map((id) => [id, draws.filter((d) => d.id === id).length]))
    if (REPORT) {
      // eslint-disable-next-line no-console
      console.info(`R52_H2_REPORT walk ${JSON.stringify({ careers: WALK_CAREERS, weeks: WALK_WEEKS, draws: draws.length, per })}`)
    }
    expect(draws.length, 'the walk drew some stint row at all (anti-vacuity)').toBeGreaterThan(0)
  })
})

// =================================================================================================
// N. ZERO MAIN DRAWS
// =================================================================================================

describe('round 52 H2 N – the six rows tap no MAIN draw', () => {
  it('⭐⭐ the same played career with and without the six rows taps the same number of MAIN draws and ends on the same next three', () => {
    const live = SMALL_TALK_SITUATIONS as unknown as SmallTalkSituation[]
    const withRows = play(5, 0, 104)
    const removed = live.splice(live.length - 6, 6)
    let without: Played
    try {
      expect(removed.map((s) => s.id), 'the six that were taken out').toEqual([...STINT_ROWS])
      without = play(5, 0, 104)
    } finally {
      live.push(...removed)
    }
    expect(SMALL_TALK_SITUATIONS.slice(-6).map((s) => s.id), 'and they are back, in order').toEqual([...STINT_ROWS])
    expect(withRows.draws, 'the tick tapped MAIN at all (anti-vacuity)').toBeGreaterThan(1000)
    expect(withRows.conversations, 'and she talked, so the facts were asked').toBeGreaterThan(0)
    expect(withRows.draws, 'MAIN draws with the six rows').toBe(without.draws)
    expect(withRows.next3, 'and the stream\'s next three').toEqual(without.next3)
  })
})

// =================================================================================================
// O. THE COPY RULES
// =================================================================================================

function stintLines(): { where: string; text: string; label: boolean }[] {
  const lines: { where: string; text: string; label: boolean }[] = []
  for (const id of STINT_ROWS) {
    const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
    if (s === undefined) throw new Error(`${id}: not in the catalogue`)
    for (const voice of TEMPERAMENTS) {
      const col = s.voices[voice]!
      lines.push({ where: `${id}/${voice}/opener`, text: col.opener, label: false })
      for (const stance of ['invite', 'respond', 'space'] as const) {
        lines.push({ where: `${id}/${voice}/${stance}/label`, text: col.branches[stance].label, label: true })
        lines.push({ where: `${id}/${voice}/${stance}`, text: col.branches[stance].said, label: false })
      }
    }
  }
  return lines
}

describe('round 52 H2 O – the six keep the addendum\'s rules', () => {
  it('the sweep has something to sweep – 6 rows x 4 voices x (opener, 3 labels, 3 replies)', () => {
    expect(stintLines().length).toBe(6 * 4 * 7)
  })

  it('⭐⭐ the coach is never pronoun-ed: a line that names the coach carries no third-person pronoun at all, and no masculine pronoun stands anywhere (R15-7)', () => {
    const pronoun = /\b(he|she|him|her|his|hers|himself|herself|they|them|their|theirs|themselves)\b/i
    let namingTheCoach = 0
    for (const { where, text } of stintLines()) {
      expect(/\b(he|his|him|himself)\b/i.test(text), `${where}: masculine pronoun in «${text}»`).toBe(false)
      if (!/coach/i.test(text)) continue
      namingTheCoach++
      expect(pronoun.test(text), `${where}: a third-person pronoun beside the coach in «${text}»`).toBe(false)
    }
    expect(namingTheCoach, 'the lines that name the coach exist – the rule is not vacuous').toBeGreaterThan(20)
  })

  it('no «today», no exclamation mark, no digit, no long dash', () => {
    const rules: [string, RegExp][] = [['today', /\btoday\b/i], ['exclamation mark', /!/], ['digit', /\d/], ['long dash', /—/]]
    for (const { where, text } of stintLines()) for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
  })

  it('⭐ the gate licenses a FEELING: no result, no skill claim, no money, no injury – doubt and never a verdict («не "всё плохо"»)', () => {
    const rules: [string, RegExp][] = [
      // `won` is a whole word: «won't» is a contraction and trips it, which is how a fiery line first read «a result»
      ['a result', /\b(won|win|wins|lost|loses|beat|beaten|score|ranking|trophy)\b/i],
      ['a skill claim', /\b(improv\w*|progress\w*|stronger|weaker|learned|learnt|mastered|got better|getting better)\b/i],
      ['money', /\b(money|pay|paid|cost|costs|price|afford|fee|fees)\b/i],
      ['injury or fatigue', /\b(injur\w*|hurt|ache|aches|pain|tired|exhausted|sore)\b/i],
      ['a verdict on the coach', /\b(bad|terrible|awful|useless|hate|hates|wrong|worst|rubbish)\b/i],
    ]
    for (const { where, text } of stintLines()) for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
  })

  it('⭐⭐ the age is said in words that match the window: the half-year rows say «months» or «half a year» and never «a year»; the year rows say «a year» and never «months»', () => {
    for (const id of STINT_ROWS) {
      const half = STINT[id].window === HALF_WINDOW
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
      for (const voice of TEMPERAMENTS) {
        const opener = s.voices[voice]!.opener
        expect(half ? /\b(months?|half a year)\b/i.test(opener) : /\ba (whole )?year\b/i.test(opener), `${id}/${voice}: the opener names the stint's age in words «${opener}»`).toBe(true)
      }
      for (const { where, text } of stintLines().filter((l) => l.where.startsWith(`${id}/`))) {
        if (half) expect(/\byear\b/i.test(text.replace(/half a year/gi, '')), `${where}: «year» in a half-year row «${text}»`).toBe(false)
        else expect(/\b(month|months|half a year)\b/i.test(text), `${where}: months in a year row «${text}»`).toBe(false)
      }
    }
  })

  it('every opener and reply is unique in the WHOLE corpus – no exact duplicate against any other situation', () => {
    const seen = new Map<string, number>()
    const bump = (s: string): void => void seen.set(s, (seen.get(s) ?? 0) + 1)
    for (const s of SMALL_TALK_SITUATIONS) {
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]
        if (col === undefined) continue
        bump(col.opener)
        if (col.shared !== undefined) bump(col.shared)
        for (const stance of ['invite', 'respond', 'space'] as const) bump(col.branches[stance].said)
      }
    }
    for (const { where, text, label } of stintLines()) {
      if (label) continue
      expect(seen.get(text), `${where}: «${text}» appears elsewhere in the corpus`).toBe(1)
    }
  })

  it('the shape: three labels the same in all four voices, no second beat, four voices, and a branch carries a label and a line and NOTHING ELSE (no effect)', () => {
    for (const id of STINT_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
      expect(Object.keys(s.voices).sort(), `${id}: four voices`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const stance of ['invite', 'respond', 'space'] as const) {
        expect(new Set(TEMPERAMENTS.map((v) => s.voices[v]!.branches[stance].label)).size, `${id}/${stance}: one label for the four voices`).toBe(1)
      }
      for (const voice of TEMPERAMENTS) {
        expect(s.voices[voice]!.shared, `${id}/${voice}: no second beat`).toBeUndefined()
        for (const stance of ['invite', 'respond', 'space'] as const) {
          expect(Object.keys(s.voices[voice]!.branches[stance]).sort(), `${id}/${voice}/${stance}: label and said only`).toEqual(['label', 'said'])
        }
      }
    }
  })
})

// =================================================================================================
// P. NO LINE COLLIDES WITH ANOTHER STRING IN src/
// =================================================================================================

describe('round 52 H2 P – no stint line is also a string somewhere else in src/', () => {
  it('⭐⭐ none of the 114 new strings appears in any other source file', () => {
    const root = new URL('../src/', import.meta.url)
    const files: { file: string; text: string }[] = []
    for (const rel of readdirSync(root, { recursive: true }) as string[]) {
      if (!/\.(ts|vue)$/.test(rel) || rel === 'engine/world/smallTalkCorpus.ts') continue
      files.push({ file: rel, text: readFileSync(new URL(rel, root), 'utf8') })
    }
    expect(files.length, 'source files scanned').toBeGreaterThan(200)
    expect(files.some((f) => f.file === 'engine/world/albumCorpus.ts'), 'the file that collided in round 51 is in the scan').toBe(true)
    let checked = 0
    for (const { where, text } of stintLines()) {
      const bare = text.replace(/^"/, '').replace(/"$/, '')
      const escaped = bare.replace(/'/g, "\\'")
      checked++
      for (const f of files) expect(f.text.includes(bare) || f.text.includes(escaped), `${where}: «${bare}» is also in src/${f.file}`).toBe(false)
    }
    expect(checked, 'the strings checked (every column of every row)').toBe(6 * 4 * 7)
  })
})

// =================================================================================================
// Q. THE RUSSIAN IS THERE
// =================================================================================================

describe('round 52 H2 Q – every new English line has its Russian in ru.json', () => {
  const ru = JSON.parse(readFileSync(new URL('../src/i18n/ru.json', import.meta.url), 'utf8')) as Record<string, string>

  it('⭐⭐ 114 keys, each with a Russian value that is Cyrillic, has no Latin letter, wears the guillemets on a spoken line, and never puts a past-tense masculine verb on the coach', () => {
    const keys = new Map<string, boolean>()
    for (const { text, label } of stintLines()) keys.set(text, label)
    expect(keys.size, '24 openers + 72 replies + 18 distinct labels').toBe(114)
    for (const [key, label] of keys) {
      const value = ru[key]
      expect(value, `no Russian for «${key}»`).toBeTypeOf('string')
      expect(value, `the Russian of «${key}» is the English`).not.toBe(key)
      expect(/[Ѐ-ӿ]/.test(value!), `«${value}» has no Cyrillic letter`).toBe(true)
      expect(/[A-Za-z]/.test(value!), `«${value}» still holds a Latin letter`).toBe(false)
      expect(/[!\d—]/.test(value!), `«${value}» holds an exclamation mark, a digit or a long dash`).toBe(false)
      if (!label) expect(value!.startsWith('«') && value!.endsWith('»'), `«${value}» does not wear the guillemets`).toBe(true)
      // R15-7 in Russian, as F4's section I: the noun «тренер» carries no sex, but a past-tense verb that follows it as its subject does («тренер сказал»).
      expect(/тренер\S*\s+\S*(ал|ил|ел|ул|ыл|ял|ёл)(\s|[.,;:–]|$)/i.test(value!), `«${value}»: a past-tense verb right after the coach`).toBe(false)
      // and the parent is never gendered either: «ты знал» / «ты сказал» would name the parent's sex
      expect(/(^|[\s«(])ты\s+\S*(ал|ил|ел|ул|ыл|ял|ёл)(\s|[.,;:–»]|$)/i.test(value!), `«${value}»: a masculine past tense after «ты»`).toBe(false)
    }
  })
})

// =================================================================================================
// R. HOW OFTEN A PLAYED, COACHED CAREER MEETS A STINT ROW – the measurement the spec's addendum quotes
// =================================================================================================

describe('round 52 H2 R – how often a played, coached career meets a stint row', () => {
  it('the walk has a denominator, and the rate per coached year is measured (R52_F4_REPORT=1 prints it; R52_F4_SCALE=big is the spec\'s measurement)', () => {
    // the econ-bench presets with a coach on the payroll from the start, as F4's E; the rows come up in ordinary small talk, with no checkpoint mechanism yet
    const presets = BIG ? [1, 2, 4, 5, 6, 7, 8] : [5]
    const careers = BIG ? 6 : 2
    const weeks = BIG ? 312 : 104
    const total = { coachedWeeks: 0, conversations: 0, stintHits: 0, firstImpressionHits: 0 }
    for (const p of presets) {
      for (let i = 0; i < careers; i++) {
        const r = play(p, i, weeks)
        total.coachedWeeks += r.coachedWeeks
        total.conversations += r.conversations
        total.stintHits += r.stintHits
        total.firstImpressionHits += ROWS.reduce((n, id) => n + r.hits[id], 0)
      }
    }
    const years = total.coachedWeeks / 52
    const per = (n: number): number => Math.round((1000 * n) / years) / 1000
    if (REPORT) {
      // eslint-disable-next-line no-console
      console.info(`R52_H2_REPORT played ${JSON.stringify({ presets, careers, weeks, coachedYears: Math.round(years * 10) / 10, conversations: total.conversations, stintHits: total.stintHits, stintPerCoachedYear: per(total.stintHits), firstImpressionHits: total.firstImpressionHits, firstImpressionPerCoachedYear: per(total.firstImpressionHits), anyCoachFeelPerCoachedYear: per(total.stintHits + total.firstImpressionHits) })}`)
    }
    expect(total.coachedWeeks, 'coached weeks walked').toBeGreaterThan(weeks)
    expect(total.conversations, 'conversations walked').toBeGreaterThan(0)
  })
})
