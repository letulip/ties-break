// ROUND 52 H3 (14.10) – THE STINT CHECKPOINTS: HER TALK ABOUT THE COACH ARRIVES ON ITS OWN AT WEEKS 12 / 32 / 56 OF A COACHING STINT.
//
// The owner, 14.10: «на тему смол-тока – нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше поменять».
// F4 wrote R67–R69 (first impression) and H2 R70–R75 (half a year, a year together) as ORDINARY small talk, so a stint met them on a lottery (the H2 measurement: R70/R71 did not drop once in 36
// careers). H3 is the mechanism: on a week whose weeks-together `w` is in [cp, cp + 4) for cp in 12 / 32 / 56 and whose talk has not been said in THIS stint, `rollSmallTalk` raises the checkpoint's row
// BEFORE it asks the lottery (src/engine/world/lifeBeat/smallTalk.ts `raiseCoachCheckpointTalk`; the weeks and the window test are in the leaf src/engine/world/coachFeel.ts).
//
// ⚠⚠ WHAT THIS FILE CHECKS, AND AGAINST WHAT
//   A  THE NUMBERS ARE THE DESIGN'S, WRITTEN OUT HERE (a test that read the constants back passes for any value): 12 / 32 / 56, each a multiple of the feel period, 32 and 56 inside their H2 windows, the window
//      one period long; and each checkpoint's three row ids are the corpus's own rows with the facts of their side and window;
//   B  each checkpoint raises the right row for each side, in all four voices, on the week it opens; the window's edges (the week before, the week it closes) are silent;
//   C  DEFERRAL AND SKIP: a week another beat holds, she tries again the next (a live card, a pending beat); four held weeks and the checkpoint is skipped for good;
//   D  NEVER TWICE per checkpoint per stint (a row the lottery raised inside the window counts, one raised before it does not); a RE-HIRE restarts the three; nobody employed – nothing;
//   E  THE GATES: strained / cold bond – she does not confide (the tile and the notes still speak); college; `too-early` (the checkpoint is moved onto a week that IS too early, with a control one week later);
//   F  THE EXEMPTIONS: the season cap and the weekly die do not bind a due talk (the same world with the checkpoints emptied stays silent); the pick takes NO gate die, NO subject draw and NO situation
//      draw (a key recorder, wave3-small-talk's shape) and keeps the frame draw on its own key; MAIN is untouched;
//   G  THE CONTROL: with the checkpoints emptied a long walk is the pre-H3 roll; with them live the first place the two logs differ is always a checkpoint row on a checkpoint week of some stint;
//   H  PLAYED CAREERS (the real tick): MAIN draws identical with and without the mechanism, and the MEASUREMENT of the spec's addendum (R52_H3_REPORT=1 prints it; R52_H3_SCALE=big is the spec's run).
//
// ⚠ NO CYRILLIC IN THIS FILE'S SOURCE LINES except comments: no player-facing string is read or written here, the rows exist (H2/F4) and are looked up by id.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – each arm run by a script that backs the file up, changes ONE anchor, runs this file (unit project, dot reporter), restores it and compares the sha256 prefix. The three files
// (coachFeel.ts, smallTalk.ts and this one) were byte-identical before and after the whole run: 382d5065eefea476 / d5b08a5f31ba6953 / 9e5863277c163af9. ARM 0, the shipped tree: 26 tests green.
// -------------------------------------------------------------------------------------------------
//   M1  checkpoint 32 -> 30 (coachFeel.ts)                                        18 RED – A's numbers and every case that poses week 32
//   M2  window upper edge, `<` -> `<=` (coachFeel.ts)                              4 RED – A's edge table, B's window, C's skip-for-good, F's cap case
//   M3  window lower edge, `>=` -> `>` (coachFeel.ts)                             15 RED – A, B (all three), C, D, E
//   M4  the window twice as long (coachFeel.ts)                                    4 RED – A, B's window, C's skip-for-good, F's cap case
//   M5  the bond clause removed                                                    1 RED – E's strained / cold case (the only test with a bond that forbids it)
//   M6  the live-card guard removed (only `pendingLifeBeat` left)                  1 RED – C's live-card deferral
//   M7  the pending-beat guard removed (only `liveSoftBeat` left)                  2 RED – C's pending-beat deferral and the skip-for-good
//   M8  the said-check removed (a checkpoint is always due in its window)          2 RED – D's never-twice and the lottery-counts case
//   M9  the stint start ignored (`from = cp`)                                      1 RED – D's re-hire restart
//   M10 the row's week ignored (any row ever counts as said)                       3 RED – D's before-the-window case, the restart, and one more
//   M11 any small-talk row counts as said                                         14 RED – the shut-lottery legacy rows would count, so nearly every raise goes silent
//   M12 the pick by id from the catalogue, bypassing `reachableSituations`         4 RED – B's sides, E's college, E's too-early, the stage case
//   M13 a gate die drawn before the pick                                          17 RED – the die refuses most seeds, and F's key recorder names it
//   M14 the hook moved AFTER the lottery's gate (the cap binds it)                15 RED – every case with the lottery shut
//   M15 the table: checkpoint 32's cold row replaced by the year row                3 RED – A's table, B's sides, and one more
//   M16 the ORDINARY roll touched (skips weeks divisible by 7)                     2 RED – G's control against the frozen pre-H3 roll, both arms of it. ⚠ This arm was GREEN in the first
//       draft: the control compared live against emptied on the same mutated tree, so both arms carried the mutation. The frozen `legacyRoll` is what fixed it.
//   M17 the frame set by hand instead of drawn                                     1 RED – F's frame-and-keys case
//   M18 the hook swallows the week when it cannot raise (`return true` on no row)  1 RED – G's college arm (the lottery must still run where no talk can be raised)
//   M19 the recency veto removed                                                   1 RED – D's «she does not repeat what she said one or two conversations ago»
//   M20 the veto looks only at her latest conversation (width 1 for 2)             1 RED – the same case, at the second row back
// -------------------------------------------------------------------------------------------------
import { describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, wave3-small-talk.test.ts's own shape: every call is delegated to the real `rngFromSeed`, and keys are kept ONLY while a test switches `spy.on` (a played career derives
// millions of them). Hoisted, because `vi.mock`'s factory is lifted above the imports.
const spy = vi.hoisted(() => ({ on: false, keys: [] as string[] }))
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      if (spy.on) spy.keys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import {
  coachSinceWeek,
  createWorld,
  hireCoach,
  LIFE_BEAT_BLOCKING,
  lifeLogOf,
  rollSmallTalk,
  SMALL_TALK_SITUATIONS,
  smallTalkEligible,
  smallTalkThisSeason,
  TEMPERAMENTS,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { COACH_FEEL } from '../src/engine/chemistry'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { pickInt } from '../src/engine/rng'
import { bondBandOf, moodRegisterOf, spiritBandOf } from '../src/engine/spirit'
import {
  COACH_TALK_CHECKPOINTS,
  COACH_TALK_HALF_YEAR_FROM_WEEK,
  COACH_TALK_HALF_YEAR_UNTIL_WEEK,
  COACH_TALK_YEAR_FROM_WEEK,
  COACH_TALK_YEAR_UNTIL_WEEK,
  coachFeel,
  coachTalkCheckpointAt,
} from '../src/engine/world/coachFeel'
import {
  drawSmallTalkFrame,
  lifeStageOf,
  presenceOf,
  raiseLifeBeat,
  reachableSituations,
  SMALL_TALK_SUBJECT_WEIGHT,
  smallTalkDetailFor,
  voiceOf,
  withoutRecentSituations,
} from '../src/engine/world/lifeBeat'
import { COACH_TALK_CHECKPOINT_ROWS, coachTalkCheckpointDue, smallTalkChanceFor } from '../src/engine/world/lifeBeat/smallTalk'
import { SMALL_TALK_SUBJECTS, smallTalkSituationIdOf, smallTalkSubjectFor } from '../src/engine/world/lifeBeat/smallTalkCopy'
import { DEFAULT_PROFILE, type BondBand, type CoachFeel, type DiaryLifeStage } from '../src/shared/protocol'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { openCareer, POLICIES, PRESETS, stepCareerWeek } from '../tools/econ-bench'
import { bondFor, stageAt, walk } from './helpers/schoolTranche'

const REPORT = process.env.R52_H3_REPORT === '1'
const BIG = process.env.R52_H3_SCALE === 'big'

// -------------------------------------------------------------------------------------------------
// THE DESIGN'S OWN NUMBERS AND ROWS, WRITTEN OUT
// -------------------------------------------------------------------------------------------------
const DESIGN_CHECKPOINTS = [12, 32, 56] as const
type Cp = (typeof DESIGN_CHECKPOINTS)[number]
/** One feel period, written out: a checkpoint's window is [cp, cp + 4). */
const WINDOW = 4
type Side = 'warm' | 'unsure' | 'cold'
const SIDES: readonly Side[] = ['warm', 'unsure', 'cold']
const SIDE_STEPS: Record<Side, readonly CoachFeel[]> = { warm: ['seems-good', 'good'], unsure: ['unsure'], cold: ['seems-off', 'off'] }
const sideOf = (feel: CoachFeel | null): Side | null => SIDES.find((s) => feel !== null && SIDE_STEPS[s].includes(feel)) ?? null
const TALK: Record<Cp, Record<Side, { id: string; subject: string; fact: string }>> = {
  12: {
    warm: { id: 'the-thing-that-makes-sense', subject: 'good-news', fact: 'coach-feel-warm' },
    unsure: { id: 'practice-feels-different', subject: 'observation', fact: 'coach-feel-unsure' },
    cold: { id: 'the-thing-she-cannot-name', subject: 'worry', fact: 'coach-feel-cold' },
  },
  32: {
    warm: { id: 'half-a-year-and-it-fits', subject: 'good-news', fact: 'coach-feel-warm-half' },
    unsure: { id: 'half-a-year-and-still-unsure', subject: 'observation', fact: 'coach-feel-unsure-half' },
    cold: { id: 'months-in-and-still-waiting', subject: 'worry', fact: 'coach-feel-cold-half' },
  },
  56: {
    warm: { id: 'a-year-and-she-would-not-swap', subject: 'good-news', fact: 'coach-feel-warm-year' },
    unsure: { id: 'a-year-and-she-still-does-not-know', subject: 'decision', fact: 'coach-feel-unsure-year' },
    cold: { id: 'a-year-in-we-need-to-talk', subject: 'decision', fact: 'coach-feel-cold-year' },
  },
}
const detailOf = (cp: Cp, side: Side): string => `${TALK[cp][side].subject}:${TALK[cp][side].id}`
const idsOf = (cp: Cp): readonly string[] => SIDES.map((s) => TALK[cp][s].id)
const ALL_IDS: readonly string[] = DESIGN_CHECKPOINTS.flatMap((cp) => idsOf(cp))
const idOfDetail = (detail: string): string => smallTalkSituationIdOf(detail) ?? ''
/** Which checkpoint a stored detail is a talk of, or null. */
const cpOfDetail = (detail: string): Cp | null => DESIGN_CHECKPOINTS.find((cp) => idsOf(cp).includes(idOfDetail(detail))) ?? null
/** The pair's chemistry level that leans a feel to each side (H2 M's own poses; the SIDE is always read back from her real feel, never assumed from the level). */
const CHEM_LEANS = [12, 6, 0, -6, -12]

// -------------------------------------------------------------------------------------------------
// FIXTURES
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

/** ⚠ THE LOTTERY SHUT: top this season's small-talk tally up to the cap with answered legacy rows, so `smallTalkEligible` is false and ANY row raised that week is the checkpoint's. The rows name no situation
 *  (no colon), so they are in nobody's checkpoint, and they are answered, so they hold no card live. */
function shutLottery(world: WorldState): void {
  world.lifeLog ??= []
  while (smallTalkThisSeason(world) < ECONOMY.life.smallTalkCapPerSeason) world.lifeLog.push({ week: world.week, kind: 'small-talk', detail: 'worry', answer: 'easy' })
  if (smallTalkEligible(world)) throw new Error('the lottery is supposed to be shut by the cap')
}

/** Pose the week, optionally shut the lottery, run the REAL roll, and return the row it raised (or null). */
function rollWeek(world: WorldState, week: number, chem: number, shut = true): Row | null {
  pose(world, week, chem)
  if (shut) shutLottery(world)
  const before = lifeLogOf(world).length
  rollSmallTalk(world)
  const log = lifeLogOf(world)
  return log.length > before ? log[log.length - 1]! : null
}

/** The side her feel is on at the world's current week and pair. */
const sideNow = (world: WorldState): Side => {
  const side = sideOf(coachFeel(world))
  if (side === null) throw new Error('her feel is on no side here')
  return side
}

/** Run `body` with the checkpoints replaced by `list` (with `rows` as the table entry of each added week), and put everything back. In place: the arrays are the module's own. */
function withCheckpoints<T>(list: readonly number[], body: () => T, rows: Record<number, readonly string[]> = {}): T {
  const live = COACH_TALK_CHECKPOINTS as unknown as number[]
  const table = COACH_TALK_CHECKPOINT_ROWS as unknown as Record<number, readonly string[]>
  const saved = live.splice(0, live.length, ...list)
  const added: number[] = []
  for (const [cp, ids] of Object.entries(rows)) {
    table[Number(cp)] = ids
    added.push(Number(cp))
  }
  try {
    return body()
  } finally {
    live.splice(0, live.length, ...saved)
    for (const cp of added) delete table[cp]
  }
}

const BLOCKING_KIND = (Object.keys(LIFE_BEAT_BLOCKING) as (keyof typeof LIFE_BEAT_BLOCKING)[]).find((k) => LIFE_BEAT_BLOCKING[k]) as Row['kind']

// =================================================================================================
// A. THE NUMBERS
// =================================================================================================
describe('round 52 H3 A – the checkpoints are the design\'s numbers and the rows are the corpus\'s', () => {
  it('⭐ 12 / 32 / 56, each a multiple of the feel period, 32 and 56 inside their H2 windows, the window one period long', () => {
    expect([...COACH_TALK_CHECKPOINTS], 'the owner-approved design numbers').toEqual([...DESIGN_CHECKPOINTS])
    expect(COACH_FEEL.periodWeeks, 'the period the design counts in').toBe(WINDOW)
    for (const cp of COACH_TALK_CHECKPOINTS) expect(cp % COACH_FEEL.periodWeeks, `${cp} is a multiple of the feel period (her feel was just re-read)`).toBe(0)
    expect(COACH_TALK_HALF_YEAR_FROM_WEEK <= 32 && 32 + WINDOW <= COACH_TALK_HALF_YEAR_UNTIL_WEEK, '32 and its whole window sit inside the half-year window').toBe(true)
    expect(COACH_TALK_YEAR_FROM_WEEK <= 56 && 56 + WINDOW <= COACH_TALK_YEAR_UNTIL_WEEK, '56 and its whole window sit inside the year window').toBe(true)
    const edges: [number, number | null][] = [[0, null], [11, null], [12, 12], [15, 12], [16, null], [31, null], [32, 32], [35, 32], [36, null], [55, null], [56, 56], [59, 56], [60, null], [1000, null]]
    for (const [together, want] of edges) expect(coachTalkCheckpointAt(together), `weeks together ${together}`).toBe(want)
  })

  it('⭐ the table names, per checkpoint, the three corpus rows of its fact – warm, unsure, cold – and none of them lists college', () => {
    expect(Object.keys(COACH_TALK_CHECKPOINT_ROWS).map(Number).sort((a, b) => a - b), 'one entry per checkpoint').toEqual([...DESIGN_CHECKPOINTS])
    for (const cp of DESIGN_CHECKPOINTS) {
      expect([...(COACH_TALK_CHECKPOINT_ROWS[cp] ?? [])], `checkpoint ${cp}: the table`).toEqual(SIDES.map((s) => TALK[cp][s].id))
      for (const side of SIDES) {
        const hits = SMALL_TALK_SITUATIONS.filter((s) => s.id === TALK[cp][side].id)
        expect(hits.length, `${TALK[cp][side].id} is in the corpus once`).toBe(1)
        expect(hits[0]!.fact, `${TALK[cp][side].id}: its fact`).toBe(TALK[cp][side].fact)
        expect(hits[0]!.subject, `${TALK[cp][side].id}: its subject`).toBe(TALK[cp][side].subject)
        expect(hits[0]!.stages, `${TALK[cp][side].id}: never college`).not.toContain('college')
      }
    }
  })
})

// =================================================================================================
// B. EACH CHECKPOINT, EACH SIDE, EVERY VOICE – AND THE WINDOW'S EDGES
// =================================================================================================
describe('round 52 H3 B – the right row, on the right weeks', () => {
  it('⭐⭐⭐ each checkpoint raises the row of her real side, in every voice, on the week it opens – with the lottery shut, so nothing else could have spoken', () => {
    const cell = new Map<string, number>()
    for (const voice of TEMPERAMENTS) {
      for (const cp of DESIGN_CHECKPOINTS) {
        for (const chem of CHEM_LEANS) {
          for (const tag of ['a', 'b']) {
            const world = coached(`r52-h3-b-${tag}-${voice}-${cp}-${chem}`, voice)
            const row = rollWeek(world, cp, chem)
            const side = sideNow(world)
            const where = `${voice} cp ${cp} chem ${chem} (${coachFeel(world)})`
            expect(row, `${where}: a row was raised`).not.toBeNull()
            expect(row!.detail, `${where}: the row of her side`).toBe(detailOf(cp, side))
            expect(row!.kind).toBe('small-talk')
            expect(row!.week, `${where}: raised on the week it opened`).toBe(cp)
            expect(row!.answer, `${where}: waiting for her parent`).toBeNull()
            expect(typeof row!.frame, `${where}: carries a frame like every small-talk row`).toBe('string')
            cell.set(`${cp}/${side}`, (cell.get(`${cp}/${side}`) ?? 0) + 1)
          }
        }
      }
    }
    // ⚠ ANTI-VACUITY: all nine cells (three checkpoints x three sides) were reached by the grid
    for (const cp of DESIGN_CHECKPOINTS) for (const side of SIDES) expect(cell.get(`${cp}/${side}`) ?? 0, `cell ${cp}/${side} was reached`).toBeGreaterThan(0)
  })

  it('⭐⭐ the talk is due on the four weeks from the checkpoint and on no other: the week before is silent and so is the week the window has closed', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      for (let w = cp - 3; w <= cp + 6; w++) {
        const world = coached(`r52-h3-win-${cp}-${w}`, 'sunny')
        const row = rollWeek(world, w, 12)
        const open = w >= cp && w < cp + WINDOW
        expect(row !== null, `checkpoint ${cp}, week ${w}`).toBe(open)
        if (row !== null) expect(cpOfDetail(row.detail), `week ${w}: a row of checkpoint ${cp}`).toBe(cp)
      }
    }
  })

  it('⭐ a stint that began LATER meets the same weeks together (a re-hired coach, after-school and independent): the checkpoint is counted from the stint, in the stages the rows list', () => {
    const seen: DiaryLifeStage[] = []
    for (const stage of ['school', 'after-school', 'independent'] as const) {
      // the first week from which the whole stint (60 weeks) stays at this stage
      const probe = coached(`r52-h3-stage-${stage}`, 'deep')
      let since = -1
      for (let w = 1; w < 1300 && since < 0; w++) if (stageAt(probe, w) === stage && stageAt(probe, w + 60) === stage) since = w
      expect(since, `a stint can sit wholly in ${stage}`).toBeGreaterThan(0)
      for (const cp of DESIGN_CHECKPOINTS) {
        const world = coached(`r52-h3-stage-${stage}`, 'deep', since)
        expect(coachSinceWeek(world), 'the stint began at the hire').toBe(since)
        const row = rollWeek(world, since + cp, 12)
        expect(row, `${stage}: checkpoint ${cp} (week ${since + cp}, ${coachFeel(world)})`).not.toBeNull()
        expect(row!.detail, `${stage}: checkpoint ${cp}`).toBe(detailOf(cp, sideNow(world)))
        expect(lifeStageOf(world), 'the stage the roll read').toBe(stage)
        expect(rollWeek(coached(`r52-h3-stage-${stage}`, 'deep', since), since + cp - 1, 12), `${stage}: ${cp} - 1`).toBeNull()
      }
      seen.push(stage)
    }
    expect(seen.length, 'all three stages the rows list were walked').toBe(3)
  })
})

// =================================================================================================
// C. DEFERRAL AND SKIP
// =================================================================================================
describe('round 52 H3 C – blocked, she tries again; after the window, never', () => {
  it('⭐⭐ a live card holds the week: it is live for three weeks, so the talk lands the first week after it expires – the checkpoint week + 2 for a card raised the week before', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-live-${cp}`, 'fiery')
      world.lifeLog!.push({ week: cp - 1, kind: 'small-talk', detail: 'worry', answer: null })
      expect(rollWeek(world, cp, 12), `${cp}: held by the live card`).toBeNull()
      expect(rollWeek(world, cp + 1, 12), `${cp}: still held`).toBeNull()
      const landed = rollWeek(world, cp + 2, 12)
      expect(landed, `${cp}: the card has expired`).not.toBeNull()
      expect(landed!.detail, `${cp}: her side`).toBe(detailOf(cp, sideNow(world)))
      expect(landed!.week, `${cp}: two weeks late`).toBe(cp + 2)
    }
  })

  it('⭐⭐ a pending beat holds the week the same way, and answering it frees the next', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-pend-${cp}`, TEMPERAMENTS[1]!)
      world.lifeLog!.push({ week: cp, kind: BLOCKING_KIND, detail: 'x', answer: null })
      expect(rollWeek(world, cp, 12), `${cp}: held`).toBeNull()
      expect(rollWeek(world, cp + 1, 12), `${cp}: still held`).toBeNull()
      world.lifeLog![0]!.answer = 'x'
      const landed = rollWeek(world, cp + 2, 12)
      expect(landed?.detail, `${cp}: freed`).toBe(detailOf(cp, sideNow(world)))
    }
  })

  it('⭐⭐⭐ four held weeks and the checkpoint is skipped FOR GOOD – every free week after it is silent, and the NEXT checkpoint still comes', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-skip-${cp}`, 'deep')
      world.lifeLog!.push({ week: cp, kind: BLOCKING_KIND, detail: 'x', answer: null })
      for (let w = cp; w < cp + WINDOW; w++) expect(rollWeek(world, w, 12), `${cp}: week ${w} held`).toBeNull()
      world.lifeLog![0]!.answer = 'x'
      const next = DESIGN_CHECKPOINTS.find((c) => c > cp)
      const until = next ?? cp + 40
      for (let w = cp + WINDOW; w < until; w++) expect(rollWeek(world, w, 12), `${cp}: week ${w}, free but late`).toBeNull()
      expect(lifeLogOf(world).filter((r) => r.kind === 'small-talk' && cpOfDetail(r.detail) === cp), `${cp}: never said`).toHaveLength(0)
      if (next !== undefined) {
        const row = rollWeek(world, next, 12)
        expect(row === null ? null : cpOfDetail(row.detail), `the next checkpoint (${next}) is not skipped`).toBe(next)
      }
    }
  })
})

// =================================================================================================
// D. NEVER TWICE, A NEW STINT RESTARTS, NOBODY EMPLOYED
// =================================================================================================
describe('round 52 H3 D – once per checkpoint per stint', () => {
  it('⭐⭐ never twice: after it was said, every other week of the window is silent', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-once-${cp}`, 'sunny')
      const first = rollWeek(world, cp, 12)
      expect(first, `${cp}: said`).not.toBeNull()
      first!.answer = 'more'
      expect(coachTalkCheckpointDue(world), `${cp}: nothing is owed now`).toBeNull()
      for (let w = cp + 1; w < cp + WINDOW; w++) expect(rollWeek(world, w, 12), `${cp}: week ${w}, after the answer`).toBeNull()
    }
  })

  it('⭐⭐ a row the lottery raised INSIDE the window counts as said; one raised BEFORE the window does not', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const inside = coached(`r52-h3-in-${cp}`, 'fiery')
      inside.lifeLog!.push({ week: cp + 1, kind: 'small-talk', detail: detailOf(cp, 'cold'), answer: 'more' })
      expect(rollWeek(inside, cp + 2, 12), `${cp}: said by the lottery at ${cp + 1} (any of the three counts)`).toBeNull()
      const before = coached(`r52-h3-before-${cp}`, 'fiery')
      // the checkpoint's own row raised BEFORE the window, then two other conversations: it is out of her last two, so only the `from` rule can decide
      before.lifeLog!.push({ week: cp - 3, kind: 'small-talk', detail: detailOf(cp, 'warm'), answer: 'more' })
      before.lifeLog!.push({ week: cp - 2, kind: 'small-talk', detail: 'worry', answer: 'more' })
      before.lifeLog!.push({ week: cp - 1, kind: 'small-talk', detail: 'worry', answer: 'more' })
      const row = rollWeek(before, cp, 12)
      expect(row, `${cp}: a row at ${cp - 1} is not this checkpoint's talk`).not.toBeNull()
      expect(row!.week).toBe(cp)
    }
  })

  it('⭐⭐⭐ she does not repeat what she said one or two conversations ago: the determined row is refused while it is among her last two – and comes the week it is not (the owner\'s round-43 law)', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-recent-${cp}`, 'deep')
      pose(world, cp, 12)
      const mine = detailOf(cp, sideNow(world))
      // the lottery is shut FIRST, so the filler rows sit below the one that matters: the very row she is owed is then her LATEST conversation, raised two weeks BEFORE the window
      // (earlier than the stint's cp, so it does not count as the checkpoint's talk – only the recency memory can refuse it)
      shutLottery(world)
      world.lifeLog!.push({ week: cp - 2, kind: 'small-talk', detail: mine, answer: 'more' })
      expect(rollWeek(world, cp, 12, false), `${cp}: the latest conversation was this very one`).toBeNull()
      // one other conversation on top of it: still among her last two
      world.lifeLog!.push({ week: cp, kind: 'small-talk', detail: 'worry', answer: 'more' })
      expect(rollWeek(world, cp + 1, 12, false), `${cp}: one conversation back`).toBeNull()
      // a second one: it has left her last two, and the checkpoint is still open
      world.lifeLog!.push({ week: cp + 1, kind: 'small-talk', detail: 'worry', answer: 'more' })
      const row = rollWeek(world, cp + 2, 12, false)
      expect(row?.detail, `${cp}: two conversations back – said`).toBe(mine)
      expect(row?.week).toBe(cp + 2)
    }
  })

  it('⭐⭐⭐ a new stint restarts all three: the rows of the old stint stay in the log and fall behind the new start', () => {
    const world = coached('r52-h3-restart', 'sunny')
    const old = rollWeek(world, 12, 12)
    expect(old, 'the first stint was told').not.toBeNull()
    old!.answer = 'more'
    expect(rollWeek(world, 13, 12), 'and once is once').toBeNull()
    const coach = world.coachId as string
    world.week = 40
    hireCoach(world, null)
    expect(coachTalkCheckpointDue(world), 'released: nobody to talk about').toBeNull()
    hireCoach(world, coach)
    expect(coachSinceWeek(world), 'the stint restarted at the hire').toBe(40)
    expect(rollWeek(world, 40 + 11, 12), 'eleven weeks into the new stint').toBeNull()
    const again = rollWeek(world, 40 + 12, 12)
    expect(again, 'twelve weeks into the new stint: her first impression of THIS coach').not.toBeNull()
    expect(cpOfDetail(again!.detail)).toBe(12)
    expect(again!.week).toBe(52)
    again!.answer = 'more'
    const half = rollWeek(world, 40 + 32, 12)
    expect(half === null ? null : cpOfDetail(half.detail), 'and half a year into it').toBe(32)
  })

  it('⭐ nobody employed: no talk, whatever the week – and the same world with the coach back speaks (the control)', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-nobody-${cp}`, 'deep')
      const coach = world.coachId as string
      expect(rollWeek(world, cp, 12), `${cp}: control – with the coach`).not.toBeNull()
      const empty = coached(`r52-h3-nobody-${cp}`, 'deep')
      hireCoach(empty, null)
      empty.week = cp
      shutLottery(empty)
      const before = lifeLogOf(empty).length
      rollSmallTalk(empty)
      expect(lifeLogOf(empty).length, `${cp}: nobody employed`).toBe(before)
      expect(coachTalkCheckpointDue(empty), `${cp}: nothing due`).toBeNull()
      expect(coach).toBeTruthy()
    }
  })
})

// =================================================================================================
// E. THE GATES: BOND, COLLEGE, TOO EARLY
// =================================================================================================
describe('round 52 H3 E – when she does not bring it up', () => {
  it('⭐⭐⭐ at a strained or cold bond she does not confide, on any week of any window – and at steady and close she does (the controls)', () => {
    const tally: Record<string, number> = { strained: 0, cold: 0, steady: 0, close: 0 }
    for (const band of ['strained', 'cold', 'steady', 'close'] as const satisfies readonly BondBand[]) {
      for (const cp of DESIGN_CHECKPOINTS) {
        for (let w = cp; w < cp + WINDOW; w++) {
          const world = coached(`r52-h3-bond-${band}-${cp}-${w}`, 'fiery')
          world.bond = bondFor(band)
          const row = rollWeek(world, w, 12, false)
          const live = band === 'steady' || band === 'close'
          if (live) expect(row !== null && cpOfDetail(row.detail) === cp, `${band}: checkpoint ${cp}, week ${w}`).toBe(true)
          else expect(row, `${band}: checkpoint ${cp}, week ${w}`).toBeNull()
          if (row !== null) tally[band] = (tally[band] ?? 0) + 1
        }
      }
    }
    expect(tally.strained! + tally.cold!, 'a strained or cold bond raised nothing').toBe(0)
    expect(tally.steady! + tally.close!, 'a steady or close one raised every window week').toBe(2 * DESIGN_CHECKPOINTS.length * WINDOW)
  })

  it('⭐⭐ in college she brings up no coach – and does again once college is cleared (the control)', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-college-${cp}`, 'sunny')
      world.college = { fromWeek: 0, untilWeek: 1_000_000 } as unknown as WorldState['college']
      expect(rollWeek(world, cp, 12), `${cp}: in college`).toBeNull()
      world.college = null
      expect(rollWeek(world, cp, 12), `${cp}: college cleared`).not.toBeNull()
    }
  })

  it('⭐⭐ `too-early` is on no side: a checkpoint moved onto a week that IS too early raises nothing – and the same one moved a few weeks later (the control) does', () => {
    const FIRST = TALK[12]
    const rows = { 3: SIDES.map((s) => FIRST[s].id), 8: SIDES.map((s) => FIRST[s].id) }
    withCheckpoints(
      [3, 8],
      () => {
        const early = coached('r52-h3-early', 'deep')
        expect(pose(early, 3, 0), 'week 3 with a quiet gauge reads too early').toBe('too-early')
        expect(rollWeek(early, 3, 0), 'too early – nothing').toBeNull()
        const later = coached('r52-h3-early', 'deep')
        expect(pose(later, 8, 0), 'week 8 does not').not.toBe('too-early')
        const row = rollWeek(later, 8, 0)
        expect(row, 'control: the same checkpoint at week 8').not.toBeNull()
        expect(row!.detail).toBe(detailOf(12, sideNow(later)))
      },
      rows,
    )
    expect([...COACH_TALK_CHECKPOINTS], 'the checkpoints were put back').toEqual([...DESIGN_CHECKPOINTS])
  })
})

// =================================================================================================
// F. THE EXEMPTIONS AND THE DRAWS
// =================================================================================================
describe('round 52 H3 F – it is not chatter: no cap, no die; and it draws nothing it should not', () => {
  it('⭐⭐⭐ the season cap does not bind a due talk (the lottery is shut and the talk still comes); the same world a week outside the window stays silent', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-cap-${cp}`, 'sunny')
      pose(world, cp, 12)
      shutLottery(world)
      expect(smallTalkEligible(world), 'the cap holds the lottery').toBe(false)
      expect(smallTalkThisSeason(world)).toBeGreaterThanOrEqual(ECONOMY.life.smallTalkCapPerSeason)
      const row = rollWeek(world, cp, 12)
      expect(row === null ? null : cpOfDetail(row.detail), `${cp}: said past the cap`).toBe(cp)
      const outside = coached(`r52-h3-cap-out-${cp}`, 'sunny')
      expect(rollWeek(outside, cp + WINDOW, 12), `${cp}: a capped week outside the window`).toBeNull()
    }
  })

  it('⭐⭐⭐ the weekly die does not bind it either: on a seed whose gate die FAILS that week the talk still comes – and with the checkpoints emptied the same world is silent', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      let seed = ''
      for (let n = 0; n < 200 && seed === ''; n++) {
        const world = coached(`r52-h3-die-${cp}-${n}`, 'deep')
        if (rngFromSeed(`${world.seed}:life:smalltalk:${cp}`)() >= ECONOMY.life.smallTalkPerWeek.close) seed = world.seed
      }
      expect(seed, `${cp}: a seed whose die fails at week ${cp}`).not.toBe('')
      const on = coached(`${seed}`, 'deep')
      expect(smallTalkEligible(on), 'the lottery is OPEN – it is only its die that fails').toBe(true)
      const row = rollWeek(on, cp, 12, false)
      expect(row === null ? null : cpOfDetail(row.detail), `${cp}: said although the die failed`).toBe(cp)
      const off = coached(`${seed}`, 'deep')
      withCheckpoints([], () => expect(rollWeek(off, cp, 12, false), `${cp}: without the mechanism the same week is silent`).toBeNull())
    }
  })

  it('⭐⭐⭐ the pick is determined: no gate die, no subject draw, no situation draw – only the frame, on its own key – and the frame is the one `drawSmallTalkFrame` would pick; MAIN is not touched', () => {
    for (const cp of DESIGN_CHECKPOINTS) {
      const world = coached(`r52-h3-keys-${cp}`, 'fiery')
      pose(world, cp, 12)
      shutLottery(world)
      const wantFrame = drawSmallTalkFrame(world, presenceOf(lifeStageOf(world)))
      const main = JSON.stringify(world.rngMain)
      spy.keys.length = 0
      spy.on = true
      try {
        rollSmallTalk(world)
      } finally {
        spy.on = false
      }
      const keys = [...spy.keys]
      const row = lifeLogOf(world)[lifeLogOf(world).length - 1]!
      expect(cpOfDetail(row.detail), `${cp}: the talk was raised`).toBe(cp)
      expect(keys.filter((k) => k.includes(':life:smalltalk:')), `${cp}: no gate die, no subject, no situation`).toEqual([])
      expect(keys.filter((k) => k === `${world.seed}:smalltalk:frame:${cp}`), `${cp}: the frame draw, once, on its own key`).toHaveLength(1)
      expect(row.frame, `${cp}: the frame the shipped draw picks`).toBe(wantFrame)
      expect(JSON.stringify(world.rngMain), `${cp}: MAIN is where it was`).toBe(main)
    }
  })

  it('⭐ the control for the recorder: the lottery\'s own pick DOES derive the gate die, the subject and the situation – so an empty list above means something', () => {
    // find a seed whose gate die passes at the week, with no checkpoint in play (week 100, founding stint)
    let found = false
    for (let n = 0; n < 400 && !found; n++) {
      const world = coached(`r52-h3-ctl-${n}`, 'deep')
      world.week = 100
      pose(world, 100, 12)
      spy.keys.length = 0
      spy.on = true
      try {
        rollSmallTalk(world)
      } finally {
        spy.on = false
      }
      if (lifeLogOf(world).length > 0) {
        found = true
        const keys = [...spy.keys]
        expect(keys.some((k) => k === `${world.seed}:life:smalltalk:100`), 'the gate die').toBe(true)
        expect(keys.some((k) => k.includes(':life:smalltalk:subject:')), 'the subject draw').toBe(true)
        expect(keys.some((k) => k.includes(':life:smalltalk:situation:')), 'the situation draw').toBe(true)
      }
    }
    expect(found, 'some seed passed its die at week 100').toBe(true)
  })
})

// =================================================================================================
// G. THE CONTROL: WITH THE CHECKPOINTS EMPTIED THE ROLL IS THE PRE-H3 ONE; WITH THEM LIVE THE LOGS FIRST DIFFER AT A CHECKPOINT
// =================================================================================================
describe('round 52 H3 G – the ordinary roll is untouched', () => {
  const RESTARTS = [100, 300]
  const WALK_WEEKS = 520
  const CAREERS = 24

  /** One walked career (the schoolTranche walk: every row answered the week it is raised), the same coach hired back at the RESTARTS weeks, the pair's level posed by the career's number. */
  function walked(i: number, roll?: (w: WorldState) => void, college = false): { log: Row[]; coach: string } {
    const world = coached(`r52-h3-ctl-walk-${i}`, TEMPERAMENTS[i % TEMPERAMENTS.length]!)
    const coach = world.coachId as string
    world.coachPairs[coach] = { chem: CHEM_LEANS[i % CHEM_LEANS.length]!, phase: 0, standing: 0 }
    if (college) world.college = { fromWeek: 0, untilWeek: 1_000_000 } as unknown as WorldState['college']
    walk(
      world,
      WALK_WEEKS,
      (w, week) => {
        if (RESTARTS.includes(week)) {
          hireCoach(w, null)
          hireCoach(w, coach)
        }
      },
      roll,
    )
    return { log: JSON.parse(JSON.stringify(lifeLogOf(world))) as Row[], coach }
  }

  it('⭐⭐⭐ the first place the two logs differ is always a checkpoint talk on a checkpoint week of some stint – before it they are the same bytes', () => {
    let diverged = 0
    let identical = 0
    let rowsOn = 0
    for (let i = 0; i < CAREERS; i++) {
      const on = walked(i).log
      const off = withCheckpoints([], () => walked(i).log)
      rowsOn += on.length
      const n = Math.min(on.length, off.length)
      let at = -1
      for (let k = 0; k < n && at < 0; k++) if (JSON.stringify(on[k]) !== JSON.stringify(off[k])) at = k
      if (at < 0 && on.length !== off.length) at = n
      if (at < 0) {
        identical++
        continue
      }
      diverged++
      const row = on[at]!
      const where = `career ${i}: first difference at row ${at} (week ${row.week}, ${row.detail})`
      expect(cpOfDetail(row.detail), `${where}: a checkpoint talk`).not.toBeNull()
      const starts = [0, ...RESTARTS]
      const stint = Math.max(...starts.filter((s) => s <= row.week))
      expect(coachTalkCheckpointAt(row.week - stint), `${where}: on a checkpoint week of the stint that began at ${stint}`).toBe(cpOfDetail(row.detail))
      if (at < off.length) expect(off[at]!.week, `${where}: the control arm had nothing earlier`).toBeGreaterThanOrEqual(row.week)
    }
    expect(diverged, 'the mechanism changed some careers (anti-vacuity)').toBeGreaterThan(CAREERS / 2)
    expect(rowsOn, 'the walk has rows').toBeGreaterThan(CAREERS)
    expect(diverged + identical).toBe(CAREERS)
  })

  /** ⭐⭐⭐ THE PRE-H3 ROLL, FROZEN – `rollSmallTalk`'s body as it stood at edad1908, before the checkpoint hook, written against the same exported primitives (the gate, the die, the pool, the subject draw, the
   *  situation draw, the frame). It is the CONTROL, not a second implementation: its only job is to say what the ordinary roll did the day before the mechanism, so that «byte-identical outside the
   *  checkpoints» is a comparison with something and not with itself. ⚠ If the ordinary roll is changed on purpose, update THIS copy in the same commit – and notice that you are doing so. */
  function legacyRoll(world: WorldState): void {
    if (!smallTalkEligible(world)) return
    const chance = smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start))
    if (rngFromSeed(`${world.seed}:life:smalltalk:${world.week}`)() >= chance) return
    const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
    const reachable = withoutRecentSituations(world, reachableSituations(world, voiceOf(world), lifeStageOf(world)))
    if (reachable.length === 0) {
      raiseLifeBeat(world, 'small-talk', smallTalkSubjectFor(register))
      return
    }
    const live = SMALL_TALK_SUBJECTS.filter((s) => reachable.some((r) => r.subject === s))
    const weights = SMALL_TALK_SUBJECT_WEIGHT[register]
    const total = live.reduce((sum, s) => sum + weights[s], 0)
    let roll = rngFromSeed(`${world.seed}:life:smalltalk:subject:${world.week}`)() * total
    let subject = live[live.length - 1]!
    for (const s of live) {
      roll -= weights[s]
      if (roll < 0) {
        subject = s
        break
      }
    }
    const pool = reachable.filter((s) => s.subject === subject)
    const at = pickInt(rngFromSeed(`${world.seed}:life:smalltalk:situation:${world.week}`), 0, pool.length - 1)
    const frame = drawSmallTalkFrame(world, presenceOf(lifeStageOf(world)))
    raiseLifeBeat(world, 'small-talk', smallTalkDetailFor(pool[at]!.subject, pool[at]!.id), undefined, frame)
  }

  it('⭐⭐⭐ with the checkpoints emptied the shipped roll IS the pre-H3 roll: 24 careers x 520 weeks, row for row and frame for frame (the control arm)', () => {
    let rows = 0
    for (let i = 0; i < CAREERS; i++) {
      const shipped = withCheckpoints([], () => walked(i).log)
      const frozen = walked(i, legacyRoll).log
      expect(shipped, `career ${i}`).toEqual(frozen)
      rows += shipped.length
    }
    expect(rows, 'ordinary small talk was raised (anti-vacuity)').toBeGreaterThan(CAREERS * 20)
  })

  it('⭐⭐ and with them LIVE the first difference from that roll is a checkpoint talk – the control sees the mechanism (anti-vacuity for the arm above)', () => {
    let differ = 0
    for (let i = 0; i < CAREERS; i++) if (JSON.stringify(walked(i).log) !== JSON.stringify(walked(i, legacyRoll).log)) differ++
    expect(differ, 'the live roll differs from the pre-H3 one in most careers').toBeGreaterThan(CAREERS / 2)
  })

  it('⭐⭐ in college, where a checkpoint talk can never be raised, even the LIVE roll is the pre-H3 roll – the hook swallows no ordinary week', () => {
    let rows = 0
    for (let i = 0; i < 8; i++) {
      const live = walked(i, undefined, true).log
      expect(live, `career ${i} in college`).toEqual(walked(i, legacyRoll, true).log)
      expect(live.some((r) => cpOfDetail(r.detail) !== null), `career ${i}: no coach talk in college`).toBe(false)
      rows += live.length
    }
    expect(rows, 'ordinary small talk was raised in college (anti-vacuity)').toBeGreaterThan(8 * 20)
  })
})

// =================================================================================================
// H. PLAYED CAREERS – MAIN IDENTITY AND THE MEASUREMENT
// =================================================================================================
interface Wk {
  w: number
  since: number
  coached: boolean
  band: BondBand
  stage: DiaryLifeStage
  college: boolean
}
interface Played {
  reads: Wk[]
  rows: { week: number; detail: string }[]
  /** every life-log row of every kind, for the diagnosis of a window that was not talked in */
  all: { week: number; kind: string; detail: string }[]
  draws: number
  next3: number[]
}

/** One econ-bench career walked with the real tick. `answers`: the parent answers a card the week it is raised (the walk's own arm; a live card then blocks nothing) – otherwise the card lives its three
 *  weeks unanswered and blocks the week. The bond band is read BEFORE the step: the roll reads last week's settled value. */
function playCareer(presetIdx: number, index: number, weeks: number, answers: boolean): Played {
  const policy = POLICIES[0]!
  const { world, rng: base } = openCareer(PRESETS[presetIdx]!, index, policy)
  let draws = 0
  const rng = (): number => {
    draws++
    return base()
  }
  const reads: Wk[] = []
  const rows: { week: number; detail: string }[] = []
  const all: { week: number; kind: string; detail: string }[] = []
  let seen = 0
  for (let i = 0; i < weeks; i++) {
    const band = bondBandOf(world.bond ?? ECONOMY.bond.start)
    stepCareerWeek(world, rng, policy)
    drainLifeBeats(world)
    reads.push({ w: world.week, since: coachSinceWeek(world), coached: world.coachId !== null, band, stage: lifeStageOf(world), college: world.college != null })
    const log = lifeLogOf(world)
    for (; seen < log.length; seen++) {
      const row = log[seen]!
      all.push({ week: row.week, kind: row.kind, detail: row.detail })
      if (row.kind !== 'small-talk') continue
      rows.push({ week: row.week, detail: row.detail })
      if (answers) row.answer = 'more'
    }
  }
  return { reads, rows, all, draws, next3: [base(), base(), base()] }
}

interface Win {
  cp: Cp
  /** weeks of the window the career was coached, at a bond that lets her confide, outside college */
  eligible: number
  strainedOrCold: number
  college: number
  /** weeks after the checkpoint at which a row of that checkpoint was raised, or null */
  talkedAfter: number | null
  side: Side | null
  /** only for a window with an eligible week and NO talk: the bands, the stages and every row near it – the evidence for why */
  ctx: string | null
}
interface Stint {
  since: number
  maxTogether: number
  wins: Win[]
}

/** The stints of one played career with a window record per checkpoint (only windows the career lived to the end of). */
function stintsOf(p: Played): Stint[] {
  const out: Stint[] = []
  const bySince = new Map<number, Wk[]>()
  for (const r of p.reads) if (r.coached) bySince.set(r.since, [...(bySince.get(r.since) ?? []), r])
  for (const [since, reads] of bySince) {
    const maxTogether = Math.max(...reads.map((r) => r.w - since))
    const wins: Win[] = []
    for (const cp of DESIGN_CHECKPOINTS) {
      if (maxTogether < cp + WINDOW - 1) continue
      const inWin = reads.filter((r) => r.w - since >= cp && r.w - since < cp + WINDOW)
      const eligible = inWin.filter((r) => (r.band === 'steady' || r.band === 'close') && !r.college && r.stage !== 'college').length
      const strainedOrCold = inWin.filter((r) => r.band === 'strained' || r.band === 'cold').length
      const college = inWin.filter((r) => r.college || r.stage === 'college').length
      const talk = p.rows.find((row) => row.week >= since + cp && row.week < since + cp + WINDOW && idsOf(cp).includes(idOfDetail(row.detail)))
      const side = talk === undefined ? null : SIDES.find((s) => TALK[cp][s].id === idOfDetail(talk.detail)) ?? null
      const ctx =
        eligible > 0 && talk === undefined
          ? JSON.stringify({ since, cp, bands: inWin.map((r) => r.band), stages: inWin.map((r) => r.stage), lastTwoBefore: p.rows.filter((r) => r.week < since + cp).slice(-2).map((r) => `${r.week}:${r.detail}`), rows: p.all.filter((r) => r.week >= since + cp - 4 && r.week <= since + cp + WINDOW).map((r) => `${r.week}:${r.kind}:${r.detail}`) })
          : null
      wins.push({ cp, eligible, strainedOrCold, college, talkedAfter: talk === undefined ? null : talk.week - (since + cp), side, ctx })
    }
    out.push({ since, maxTogether, wins })
  }
  return out
}

/** Coach-feel talks (any of the nine rows) per coached year in the first two years of every stint. */
function talksFirstTwoYears(p: Played): { talks: number; years: number } {
  let talks = 0
  let weeks = 0
  for (const s of stintsOf(p)) {
    const mine = p.reads.filter((r) => r.coached && r.since === s.since && r.w - s.since < 104)
    weeks += mine.length
    talks += p.rows.filter((row) => row.week >= s.since && row.week - s.since < 104 && ALL_IDS.includes(idOfDetail(row.detail))).length
  }
  return { talks, years: weeks / 52 }
}

describe('round 52 H3 H – played, coached careers: MAIN is the same with and without the mechanism, and the measurement', () => {
  // R52_H3_CAREERS / R52_H3_WEEKS widen the one-off measurement without the 312-week cost (the spec's sides table used 24 careers x 70 weeks per preset, parent arm `answers`, R52_H3_NOOFF=1: no control arm).
  const ONE_OFF = BIG || process.env.R52_H3_CAREERS !== undefined
  const PRESET_IDS = ONE_OFF ? [1, 2, 4, 5, 6, 7, 8] : [5]
  const CAREERS_EACH = Number(process.env.R52_H3_CAREERS ?? (BIG ? 6 : 2))
  const WEEKS = Number(process.env.R52_H3_WEEKS ?? (BIG ? 312 : 156))
  const PARENT_ARMS = process.env.R52_H3_ARMS === 'answers' ? [true] : [true, false]
  const NO_OFF = process.env.R52_H3_NOOFF === '1'

  it('⭐⭐⭐ zero MAIN draws: a played career taps the same MAIN draws, and ends on the same next three, with the checkpoints live and emptied – in both parent arms', () => {
    for (const answers of [true, false]) {
      for (const p of PRESET_IDS) {
        for (let i = 0; i < CAREERS_EACH; i++) {
          const on = playCareer(p, i, WEEKS, answers)
          const off = withCheckpoints([], () => playCareer(p, i, WEEKS, answers))
          expect(on.draws, `preset ${p} career ${i} (answers ${answers}): MAIN draws`).toBe(off.draws)
          expect(on.next3, `preset ${p} career ${i} (answers ${answers}): the next three`).toEqual(off.next3)
          expect(on.draws, 'the career drew from MAIN at all (anti-vacuity)').toBeGreaterThan(WEEKS)
        }
      }
    }
  }, ONE_OFF ? 3_000_000 : undefined)

  it('⭐⭐⭐ the measurement: how many stints get all three talks, how late, how often per coached year, which sides, and why the rest did not (R52_H3_REPORT=1 prints it; R52_H3_SCALE=big is the spec\'s run)', () => {
    const report: Record<string, unknown> = {}
    for (const answers of PARENT_ARMS) {
      const arm = answers ? 'answers' : 'ignores'
      const on: Played[] = []
      const off: Played[] = []
      for (const p of PRESET_IDS) {
        for (let i = 0; i < CAREERS_EACH; i++) {
          on.push(playCareer(p, i, WEEKS, answers))
          if (!NO_OFF) off.push(withCheckpoints([], () => playCareer(p, i, WEEKS, answers)))
        }
      }
      const stints = on.flatMap((p) => stintsOf(p))
      const long = stints.filter((s) => s.maxTogether >= 60)
      const allThree = (s: Stint): boolean => s.wins.length === 3 && s.wins.every((w) => w.talkedAfter !== null)
      const cohort = long.filter((s) => s.wins.length === 3 && s.wins.every((w) => w.eligible > 0))
      const wins = long.flatMap((s) => s.wins)
      const eligibleWins = wins.filter((w) => w.eligible > 0)
      const talked = eligibleWins.filter((w) => w.talkedAfter !== null)
      const deferral: Record<string, number> = {}
      for (const w of talked) deferral[String(w.talkedAfter)] = (deferral[String(w.talkedAfter)] ?? 0) + 1
      const sides: Record<string, Record<string, number>> = {}
      for (const cp of DESIGN_CHECKPOINTS) {
        sides[String(cp)] = { warm: 0, unsure: 0, cold: 0 }
        for (const w of wins) if (w.cp === cp && w.side !== null) sides[String(cp)]![w.side]!++
      }
      const missesByDesign = wins.filter((w) => w.eligible === 0 && w.talkedAfter === null)
      const unexplained = eligibleWins.filter((w) => w.talkedAfter === null)
      const first = (list: Played[]): { talks: number; years: number } => list.map((p) => talksFirstTwoYears(p)).reduce((a, b) => ({ talks: a.talks + b.talks, years: a.years + b.years }), { talks: 0, years: 0 })
      const a = first(on)
      const b = first(off)
      const per = (x: { talks: number; years: number }): number => Math.round((1000 * x.talks) / Math.max(x.years, 1e-9)) / 1000
      const share = (n: number, d: number): number => Math.round((1000 * n) / Math.max(d, 1)) / 1000
      report[arm] = {
        careers: on.length,
        weeks: WEEKS,
        stints: stints.length,
        stintsAtLeast60: long.length,
        allThreeOfAtLeast60: share(long.filter(allThree).length, long.length),
        cohortSteadyClose: cohort.length,
        allThreeOfCohort: share(cohort.filter(allThree).length, cohort.length),
        windows: wins.length,
        windowsWithAnEligibleWeek: eligibleWins.length,
        windowsTalked: talked.length,
        windowCoverage: share(talked.length, eligibleWins.length),
        deferralWeeksAfterCheckpoint: deferral,
        talkedWindowsDeferred: share(talked.filter((w) => (w.talkedAfter ?? 0) > 0).length, talked.length),
        sidesByCheckpoint: sides,
        windowsMissedByDesignStrainedOrCold: missesByDesign.filter((w) => w.strainedOrCold > 0).length,
        windowsMissedByDesignCollege: missesByDesign.filter((w) => w.strainedOrCold === 0 && w.college > 0).length,
        windowsMissedUnexplained: unexplained.length,
        unexplainedContexts: unexplained.slice(0, 12).map((w) => w.ctx),
        talksPerCoachedYearFirstTwoYearsOn: per(a),
        talksPerCoachedYearFirstTwoYearsOff: NO_OFF ? null : per(b),
        coachedYearsFirstTwoYears: Math.round(a.years * 10) / 10,
      }
      // the gate: the mechanism is live in played careers, and it is not a no-op
      expect(long.length, `${arm}: stints that reached 60 weeks`).toBeGreaterThan(0)
      expect(eligibleWins.length, `${arm}: windows a talk could land in`).toBeGreaterThanOrEqual(3)
      if (!NO_OFF) expect(a.talks, `${arm}: more coach talks in the first two years with the mechanism than without`).toBeGreaterThan(b.talks)
      // every checkpoint talk raised in a played career is on a checkpoint week, at a stage the rows list
      for (const p of on) {
        for (const row of p.rows) {
          const cp = cpOfDetail(row.detail)
          if (cp === null) continue
          const wk = p.reads.find((r) => r.w === row.week)
          expect(wk?.stage, `${arm}: a coach talk at week ${row.week}`).not.toBe('college')
        }
      }
    }
    if (REPORT) {
      // eslint-disable-next-line no-console
      console.info(`R52_H3_REPORT ${JSON.stringify({ presets: PRESET_IDS, careersEach: CAREERS_EACH, weeks: WEEKS, report })}`)
    }
  }, ONE_OFF ? 3_000_000 : undefined)
})
