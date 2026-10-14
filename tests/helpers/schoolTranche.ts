// ROUND 51 (CONTINUATION, 14.10) – THE FIXTURES THE SCHOOL-YEARS SMALL-TALK POOL TESTS SHARE.
//
// Builder E1 (`tests/round51-school-observation-pool.test.ts`) and builder E2
// (`tests/round51-school-curiosity-goodnews-pool.test.ts`) ask the same question of different rows – «does the real draw
// hand a school-age girl, and a girl just out of school, this row?» – and they ask it of the same kind of career, walked the
// same way. A third sibling followed (`tests/round51-school-worry-decision-pool.test.ts`, builder E3, seed prefix `r51-e3-`). The walk was first pasted from round 51 №17's story test into
// E1's file; a second paste into E2's would have been the second LOCAL copy of one body, which is the shape T5.14 RULE B
// refuses for its five merged families (`tests/principles-t514-merged-families.test.ts`) – so the body has one home, here, and
// each file keeps only what is its own: the row ids, the subject it counts, and the seed prefix that names its careers.
//
// ⚠ THE SEED PREFIX STAYS AT THE CALL SITE, for the reason `tests/helpers/career.ts` gives: a seed is not boilerplate, it IS
// the fixture. E1's careers are `r51-e1-<i>` and E2's are `r51-e2-<i>`; a shared default would walk the same worlds in both
// files and every «drawn at least once» claim would be made about one set of careers twice.
//
// ⚠ A FRESH world with nothing earned, as round 43's fixtures built it: no match played, no result, no open entry – the
// career on which `played-recently` (R14, R34) and `beat-her-conqueror` (R52) stay false, so «reachable» in these tests means
// reachable with nothing earned. ⚠ It DOES have a coach from the first week (`coach-employed` is true on it, so R48 is
// reachable): builder E2 found that when a «not reachable» arm came back red, and the tests do not pose it away.
//
// ⚠ NO `import.meta.url` in here, and no filesystem: the file is read by the `unit` project only, but it follows the
// helper directory's own rule so that a component suite may borrow it one day.
import { createWorld, kidAgeExact, lifeLogOf, rollSmallTalk, TEMPERAMENTS, type Temperament, type WorldState } from '../../src/engine/world'
import { bondBandOf } from '../../src/engine/spirit'
import { diaryLifeStageFor } from '../../src/engine/diary/facts'
import { schoolIsOver } from '../../src/engine/kidLife'
import type { BondBand, DiaryLifeStage } from '../../src/shared/protocol'

/** The bond value the ladder itself reads as `band` – ask the ladder, do not hard-code a number (round 43's rule). */
export function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** A fresh world with a close bond, the posed voice and an empty life log. Only the voice is posed. */
export function careerAt(seed: string, voice: Temperament): WorldState {
  const world = createWorld(seed)
  world.bond = bondFor('close')
  world.temperament = voice
  world.lifeLog = []
  return world
}

/** The life stage the draw itself would read at `week` – the school years, then after-school, and so on. */
export function stageAt(world: WorldState, week: number): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(week, world.profile.birthMonth),
    false,
  )
}

/** One conversation as the engine stored it (`<subject>:<situation id>`), and the stage she was in. */
export interface Said {
  detail: string
  stage: DiaryLifeStage
  /** The week it was raised. ROUND 52 F4 (14.10): added so a sibling can match a conversation to what it observed that week. */
  week: number
}

/** A career walked week by week, answering every row the moment it is raised – the parent the bench models, and the only
 *  one whose cadence is the shipped one (a live soft row blocks the next). */
/** ROUND 52 F4 (14.10): `observe` is called every week, BEFORE the roll, with the world exactly as the roll will read it. The coach-feel test uses it to record her feel at the moment a
 *  coach-feel situation is drawn – the only honest way to ask "was the fact true when it was drawn", since a roll changes the log and the next week changes the world. Optional, so
 *  every earlier caller walks exactly the walk it walked. */
export function walk(world: WorldState, weeks: number, observe?: (world: WorldState, week: number) => void): Said[] {
  const out: Said[] = []
  for (let w = 0; w < weeks; w++) {
    world.week = w
    const before = lifeLogOf(world).length
    const stage = stageAt(world, w)
    if (observe !== undefined) observe(world, w)
    rollSmallTalk(world)
    const log = world.lifeLog ?? []
    if (log.length === before) continue
    const row = log[log.length - 1]
    out.push({ detail: row.detail, stage, week: w })
    row.answer = 'more'
  }
  return out
}

/** How many careers a pool test walks. */
export const SCHOOL_CAREERS = 120
/** Sixteen years: the school years end near week 620 and after-school runs to her twenty-second birthday. */
export const SCHOOL_WEEKS = 52 * 16

/** Every career's conversations, the four voices in turn. UNCACHED – a file memoises the result itself, because the walk
 *  is the slow part of a pool test and a module-level cache here would be shared by nothing (each test file is its own
 *  isolate). */
export function walkCareers(seedPrefix: string): Said[][] {
  const out: Said[][] = []
  for (let i = 0; i < SCHOOL_CAREERS; i++) {
    out.push(walk(careerAt(`${seedPrefix}${i}`, TEMPERAMENTS[i % TEMPERAMENTS.length]), SCHOOL_WEEKS))
  }
  return out
}
