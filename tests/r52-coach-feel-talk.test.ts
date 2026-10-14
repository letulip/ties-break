// ROUND 52 F4 (14.10) – THE THIRD CHANNEL OF HER FEEL FOR THE COACH: THREE SMALL-TALK SITUATIONS GATED BY IT.
//
// The owner, 14.10: «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь
// от ребенка для принятия решения». He chose this channel («Отдельный разговор – редкая беседа о тренере её голосом… самый живой») and set its register: «не "всё плохо"
// а "я пока не очень поняла" или "вроде нормально, но"». The plate on her screen (F2) and the week notes (F3) already say it; THIS file pins the conversation.
//
// WHAT WAS WRITTEN: R67 `the-thing-that-makes-sense` (good-news, fact `coach-feel-warm`), R68 `practice-feels-different` (observation, `coach-feel-unsure`) and R69
// `the-thing-she-cannot-name` (worry, `coach-feel-cold`), appended LAST after R66, at school, after-school and independent – never college. The three facts live in the hub's
// `SMALL_TALK_FACT` and read `coachFeel(world)`, the primitive the tile and the notes read. Her answers move nothing (ruling V2).
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
import { coachFeel } from '../src/engine/world/coachFeel'
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
  }, 240_000)
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
      if (row.answer === undefined) row.answer = 'more'
    }
  }
  return { coachedWeeks, conversations, hits, draws, next3: [base(), base(), base()] }
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
  }, BIG ? 3_000_000 : 240_000)
})

// =================================================================================================
// F. ZERO MAIN DRAWS, ZERO EFFECTS
// =================================================================================================

describe('round 52 F4 F – the rows tap no MAIN draw and their answers move nothing', () => {
  it('⭐⭐ the same played career with and without the three rows taps the same number of MAIN draws and ends on the same next three', () => {
    const live = SMALL_TALK_SITUATIONS as unknown as SmallTalkSituation[]
    const withRows = play(5, 0, 104)
    const removed = live.splice(live.length - 3, 3)
    let without: Played
    try {
      expect(removed.map((s) => s.id), 'the three that were taken out').toEqual([...ROWS])
      without = play(5, 0, 104)
    } finally {
      live.push(...removed)
    }
    expect(SMALL_TALK_SITUATIONS.slice(-3).map((s) => s.id), 'and they are back, in order').toEqual([...ROWS])
    expect(withRows.draws, 'the tick tapped MAIN at all (anti-vacuity)').toBeGreaterThan(1000)
    expect(withRows.conversations, 'and she talked, so the facts were asked').toBeGreaterThan(0)
    expect(withRows.draws, 'MAIN draws with the three rows').toBe(without.draws)
    expect(withRows.next3, 'and the stream\'s next three').toEqual(without.next3)
  }, 240_000)

  it('⭐ answering any of the three with any stance moves neither the bond, nor her spirit, nor the coach pair the gauge reads', () => {
    // The real roll must raise the row, so the answer is about a real conversation. The other situations are taken out of the catalogue for the walk (and put back, in order):
    // the roll then raises the one row whose fact is true on the first week the chance lets her talk, and the walk is a few dozen weeks and not a few thousand.
    const live = SMALL_TALK_SITUATIONS as unknown as SmallTalkSituation[]
    const others = live.splice(0, live.length - 3)
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
      live.unshift(...others)
    }
    expect(SMALL_TALK_SITUATIONS.length, 'the catalogue is whole again').toBeGreaterThanOrEqual(68)
    expect(SMALL_TALK_SITUATIONS.slice(-3).map((s) => s.id), 'and in order').toEqual([...ROWS])
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
  }, 240_000)
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
    expect(SMALL_TALK_SITUATIONS.slice(-3).map((s) => s.id), 'appended LAST, in the document\'s order').toEqual([...ROWS])
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
