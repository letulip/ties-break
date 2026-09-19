/**
 * THE SMALL-TALK CORPUS BENCH – K1…K5 (docs/specs/small-talk-corpus-2026-09.md §P2.6, round 43 #8).
 *
 * Run:  npx vite-node tools/small-talk-corpus-bench.ts [--seeds 240] [--conversations 40]
 *
 * WHAT HIS COMPLAINT WAS. «Она пришла 2 раза подряд с *the players I've been watching barely talk
 * about winning*… они точно не должны так часто повторяться, иначе в чём смысл.» The ledger's own
 * arithmetic says even a 44-entry uniform catalogue leaves a 40-conversation career ~59% odds of ONE
 * adjacent duplicate, so «the catalogue is thin» was never the whole of it: what makes a back-to-back
 * repeat a GUARANTEE rather than bad luck is that the draw excluded nothing said before.
 *
 * THE FIVE READINGS, §P2.6's own list:
 *   K1  the WEIGHTED pool size per (voice × stage × register) – not the raw count. A cell holding
 *       six situations behind one heavily-weighted subject is not a six-situation cell.
 *   K2  the adjacent-repeat rate over a 40-conversation career, WITH and WITHOUT the exclusion.
 *       ⭐ THIS IS THE ACCEPTANCE TEST and it is the one number his complaint is about.
 *   K3  the repeat-within-last-three rate, same two arms.
 *   K4  the per-subject × stage floor, as a pass/fail table.
 *   K5  the UNREACHABLE SET – any situation no career can ever draw, which is how a gate typo hides.
 *       ⭐ Since wave 7 T9 it reads the posed sweep PLUS K5b's real-career arm – walked, ticking
 *       careers (half through college) on the house drain recipe – because the posed walk can reach
 *       neither the `college` stage nor a second season's calendar, and was reporting that blindness
 *       as the corpus's own (round 44 §13's backlog item).
 *
 * ⚠⚠ THE TWO ARMS ARE THE SAME ENGINE, AND THE DIFFERENCE IS ONE LINE OF BOOKKEEPING RATHER THAN A
 * RE-IMPLEMENTED DRAW. Both arms call the shipped `rollSmallTalk` on a real `createWorld` career.
 * The B arm leaves the raised row exactly as the engine wrote it. The A arm rewrites the row's
 * `detail` to its SUBJECT HALF – the legacy shape, no colon – which is precisely what a pre-#8(a)
 * career looked like to the draw: `withoutRecentSituations` matches on the stored `'<subject>:<id>'`
 * string, a bare `'worry'` equals no situation, nothing is banned, and the pool it returns is the
 * reachable set unchanged. ⚠ AND THE ARM IS NOT TAKEN ON TRUST: `assertArmA` re-asks the engine's own
 * exclusion on every A-arm roll and fails the run if it ever narrows anything. A null arm that
 * quietly contains the change is the failure mode CLAUDE.md names, and this is the cheap check for it.
 * ⚠ THE GATES ARE IDENTICAL IN BOTH ARMS BY CONSTRUCTION – `smallTalkThisSeason` and `liveSoftBeat`
 * read `kind`, `week` and `answer`, never `detail`, so the season cap and the one-at-a-time rule
 * behave the same in A and B and the two arms produce the same NUMBER of conversations per career.
 *
 * ⚠ THE PARENT IN THIS BENCH ALWAYS ANSWERS. A raised row is live for three weeks and blocks the
 * next one (`smallTalkEligible`), so a bench that never answered would measure a parent who ignores
 * her – it would thin the cadence in BOTH arms equally, but it would not be a career anybody plays.
 *
 * ⚠ ZERO DRAWS ON MAIN, here and in the engine it drives: `rollSmallTalk` takes no `Rng` and derives
 * three purpose-scoped sub-streams off (seed, week). The frozen capture cannot see this bench.
 */
import {
  answerFork,
  answerLifeBeat,
  answerRetirement,
  callUpRevealOpen,
  closeTournament,
  collegeLeagueRevealOpen,
  createWorld,
  lifeLogOf,
  liveSoftBeat,
  pendingBirthday,
  pendingLifeBeat,
  reachableSituations,
  resumeFromCollege,
  rollSmallTalk,
  skipTournament,
  withoutRecentSituations,
  kidAgeExact,
  KID_ID,
  SMALL_TALK_SITUATIONS,
  SMALL_TALK_SUBJECTS,
  TEMPERAMENTS,
  type SmallTalkSituation,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { drainLifeBeats, DRAIN_ANSWER } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import { resumeMain } from '../src/engine/rng'
import { SMALL_TALK_SUBJECT_WEIGHT } from '../src/engine/world/lifeBeat'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf, moodRegisterOf, spiritBandOf, temperamentFor } from '../src/engine/spirit'
import { diaryLifeStageFor } from '../src/engine/diary/facts'
import { schoolIsOver } from '../src/engine/kidLife'
import type { BondBand, DiaryLifeStage, MoodRegister } from '../src/shared/protocol'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const SEEDS = argOf('seeds', 240)
const CONVERSATIONS = argOf('conversations', 40)
/** K5b's walked careers (wave 7 T9). 24 = 8 per background, every second one through college. */
const REAL_CAREERS = argOf('real', 24)

const REGISTERS: readonly MoodRegister[] = ['bright', 'level', 'low']
const STAGES: readonly DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']
/** His floor, §P2.5: «3–4 reachable per subject at each active stage». The pass mark is the bottom
 *  of his own range, so a cell at 3 passes and a cell at 2 is named. */
const SUBJECT_FLOOR = 3

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`
const pad = (s: string, n: number): string => s.padEnd(n)
const padL = (s: string, n: number): string => s.padStart(n)

/** The lowest `bond` that still reads as this band – the small-talk tests' own helper, and for their
 *  own reason: ASK the ladder rather than re-derive its cut points here. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** ...and the same trick for the mood register the subject weights are keyed on. */
function spiritFor(register: MoodRegister): number {
  for (let s = 0; s <= 100; s += 0.5) if (moodRegisterOf(spiritBandOf(s)) === register) return s
  throw new Error(`no spirit value reads as ${register}`)
}

// =================================================================================================
// K1 – THE WEIGHTED POOL SIZE
// =================================================================================================
//
// ⚠ «WEIGHTED» IS THE WHOLE POINT OF THE ROW, and the number reported is the INVERSE SIMPSON INDEX
// of the per-situation probability – 1/Σp², i.e. «how many EQUALLY LIKELY situations does this cell
// effectively hold». A cell with six situations behind `story` and one behind `worry` at the level
// register does not hold seven; it holds whatever the weights leave of them. The raw count is
// printed beside it so the gap is visible rather than inferred.
//
// ⚠ IT IS COMPUTED WITH EVERY COMPETITIVE FACT TRUE – the CEILING of the cell. The fact-gated
// situations are the ones a given week may not be able to offer, so the floor (facts all false) is
// printed too: a cell whose two numbers differ a lot is a cell whose variety is on loan from her
// results, which is exactly the kind of thing a corpus review should be able to see.

function probabilityOf(pool: readonly SmallTalkSituation[], register: MoodRegister): Map<string, number> {
  const out = new Map<string, number>()
  const weights = SMALL_TALK_SUBJECT_WEIGHT[register]
  // The engine's own two steps: the subject is drawn over the subjects that SURVIVED, then the
  // situation uniformly inside it (`drawSmallTalkSubject` + the `pickInt` under it).
  const live = SMALL_TALK_SUBJECTS.filter((s) => pool.some((r) => r.subject === s))
  const total = live.reduce((sum, s) => sum + weights[s], 0)
  for (const subject of live) {
    const inSubject = pool.filter((r) => r.subject === subject)
    for (const s of inSubject) out.set(`${s.subject}:${s.id}`, weights[subject] / total / inSubject.length)
  }
  return out
}

function effectiveSize(pool: readonly SmallTalkSituation[], register: MoodRegister): number {
  const p = probabilityOf(pool, register)
  let sum = 0
  for (const v of p.values()) sum += v * v
  return sum === 0 ? 0 : 1 / sum
}

function k1(): void {
  console.log('\n=== K1 · THE WEIGHTED POOL SIZE PER (voice × stage × register) ===')
  console.log('   eff = 1/Σp² (equally-likely situations the cell effectively holds); raw = the count')
  console.log('   ceiling = every competitive fact TRUE · floor = every competitive fact FALSE\n')
  console.log(
    `   ${pad('voice', 8)}${pad('stage', 14)}${pad('register', 10)}${padL('raw', 5)}${padL('eff', 7)}${padL('raw-', 6)}${padL('eff-', 7)}`,
  )
  for (const voice of TEMPERAMENTS) {
    for (const stage of STAGES) {
      const ceiling = SMALL_TALK_SITUATIONS.filter((s) => s.voices[voice] !== undefined && s.stages.includes(stage))
      const floor = ceiling.filter((s) => s.fact === null)
      for (const register of REGISTERS) {
        console.log(
          `   ${pad(voice, 8)}${pad(stage, 14)}${pad(register, 10)}${padL(String(ceiling.length), 5)}` +
            `${padL(effectiveSize(ceiling, register).toFixed(2), 7)}` +
            `${padL(String(floor.length), 6)}${padL(effectiveSize(floor, register).toFixed(2), 7)}`,
        )
      }
    }
  }
}

// =================================================================================================
// K2 / K3 – THE TWO REPEAT RATES, A vs B
// =================================================================================================

interface Walk {
  /** Every situation she brought, oldest first, as the stored `'<subject>:<id>'` detail. */
  details: string[]
  /** How wide the reachable set was on each of those weeks, BEFORE the exclusion narrowed it. */
  pools: number[]
  /** How many of them fell through to the legacy generic opener (no situation at all). */
  legacy: number
}

/** ⭐⭐ A CAREER WITH A TEAM AND A RESULT SHEET, because three of the four competitive gates are
 *  UNREACHABLE on a girl who plays nobody, and a bench measuring the corpus on an empty feed would
 *  report a catalogue two-thirds smaller than the one a player meets. Posed, never ticked – the walk
 *  moves `world.week` by hand, so nothing here is a simulated season:
 *
 *    `coach-employed`       one line – she has a coach from her fourteenth year, like everyone.
 *    `played-recently`      a competitive match every other week, which is a working tour year.
 *    `beat-her-conqueror`   the strictest gate in the catalogue, and posing it is the only way to
 *                           see it at all: every 30 weeks an opponent who has beaten her exactly
 *                           four times and never lost, and then loses.
 *
 *  ⚠ `march-entry-open` IS DELIBERATELY NOT POSED, and it is the one honest hole in this sweep. It
 *  reads the live season calendar («a March event, still enterable, whose deadline has not passed»),
 *  and the walk advances the WEEK without ticking, so the calendar it would have to read is a single
 *  frozen season. Posing one would mean hand-building an entry list, which is a second copy of the
 *  season's own rules. K5 names the entry and the reason instead of scoring it.
 *  ⭐ WAVE 7 T9 CLOSED THE HOLE FROM THE OTHER SIDE: the real-career arm (K5b below) walks TICKING
 *  careers whose calendars regenerate every season, so the gate is measured there rather than posed
 *  here – this walk stays exactly what it was, the A/B instrument for K2/K3. */
function poseCareerFacts(world: WorldState, weeks: number): void {
  world.coachId = 'coach-1'
  let id = 1_000
  const push = (week: number, opponent: string, won: boolean): void => {
    world.events.push({
      id: id++,
      week,
      type: 'match',
      text: 'a match',
      match: {
        round: 0,
        aId: KID_ID,
        bId: opponent,
        winnerId: won ? KID_ID : opponent,
        eventId: `e-${week}`,
        surface: 'hard',
        oppName: 'Opp',
        a: { id: KID_ID, name: KID_ID, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 },
        b: { id: opponent, name: opponent, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 },
      },
    })
  }
  for (let w = 2; w < weeks; w += 2) push(w, `field-${w % 97}`, w % 3 !== 0)
  // ...and the conqueror pattern: four losses to one name inside the previous 8 weeks, then a win.
  for (let w = 30; w < weeks; w += 30) {
    const name = `conqueror-${w}`
    for (let k = 4; k >= 1; k--) push(w - 2 * k, name, false)
    push(w, name, true)
  }
  world.events.sort((a, b) => a.week - b.week)
}

/** ⚠ THE A ARM'S POSITIVE CONTROL. With every stored small-talk row wearing the legacy shape the
 *  engine's own exclusion must narrow NOTHING – if it ever does, the «without» arm secretly contains
 *  the change and every number below is a comparison of B with B. */
function assertArmA(world: WorldState, reachable: readonly SmallTalkSituation[]): void {
  if (withoutRecentSituations(world, reachable).length !== reachable.length) {
    throw new Error('ARM A IS NOT NULL – the exclusion narrowed a pool it could not see')
  }
}

/** How long a career this walk is allowed. `createWorld` stands her at 13.6, so week 0 is `school`,
 *  ~250 is `after-school` and ~470 onward `independent` – walking from 0 is what makes this the
 *  ten-season career his complaint came from, rather than a slice of one stage. */
const WALK_WEEKS = 52 * 25

/** One career, walked week by week until it has had `CONVERSATIONS` of them (or run out of weeks).
 *  `exclusion` false rewrites each raised row to the legacy shape, which is the pre-#8(a) draw. */
function walkCareer(seed: string, voice: Temperament, register: MoodRegister, exclusion: boolean, posed: boolean): Walk {
  const world = createWorld(seed)
  world.temperament = voice
  world.bond = bondFor('close')
  world.spirit = spiritFor(register)
  world.lifeLog = []
  if (posed) poseCareerFacts(world, WALK_WEEKS)
  const out: Walk = { details: [], pools: [], legacy: 0 }
  for (let w = 0; w < WALK_WEEKS && out.details.length < CONVERSATIONS; w++) {
    world.week = w
    const before = lifeLogOf(world).length
    const reachable = reachableSituations(world, voice, stageAt(world, w))
    if (!exclusion) assertArmA(world, reachable)
    rollSmallTalk(world)
    const log = world.lifeLog ?? []
    if (log.length === before) continue
    const row = log[log.length - 1]
    out.details.push(row.detail)
    out.pools.push(reachable.length)
    if (!row.detail.includes(':')) out.legacy++
    // The parent answers – see the header. The id is a shipped small-talk option (`invite`).
    row.answer = 'more'
    if (!exclusion) row.detail = row.detail.split(':')[0]
  }
  return out
}

function stageAt(world: WorldState, week: number): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(week, world.profile.birthMonth),
    world.college !== null && week < world.college.untilWeek,
  )
}

/** Did any two ADJACENT conversations name the same situation. ⚠ Legacy rows (a bare subject) are
 *  not counted as a repeat of each other: they are the generic opener, which is a different defect
 *  and is reported as `legacy` instead. */
function adjacentRepeat(details: readonly string[]): boolean {
  for (let i = 1; i < details.length; i++) {
    if (details[i].includes(':') && details[i] === details[i - 1]) return true
  }
  return false
}

/** ...and the same question over a window of three – «did she bring this again within two others». */
function repeatWithin(details: readonly string[], window: number): boolean {
  for (let i = 1; i < details.length; i++) {
    if (!details[i].includes(':')) continue
    for (let k = 1; k <= window - 1 && i - k >= 0; k++) if (details[i] === details[i - k]) return true
  }
  return false
}

interface Cell {
  careers: number
  conversations: number
  legacy: number
  adjacent: number
  withinThree: number
  distinct: number
  /** ⭐⭐ THE ACCEPTANCE COUNTERS, AND THEY ARE PER **PAIR** RATHER THAN PER CAREER, which is what
   *  makes them a test rather than an impression. `withoutRecentSituations` never empties the pool,
   *  so on a week whose reachable set holds ONE situation nothing can stop her repeating it – there
   *  is nothing else she could honestly have brought, and «fixing» it would mean the generic opener,
   *  which is worse. So the question is asked of the draws where an alternative EXISTED:
   *
   *    `pairs`      adjacent pairs whose later draw had a pool of 2 or more;
   *    `pairsBad`   how many of those named the same situation twice running.
   *
   *  ⭐ ON THE B ARM `pairsBad` MUST BE ZERO, and it is zero by construction rather than by luck:
   *  with a pool of ≥2 the ban on the previous situation always leaves something, so it always
   *  holds. On the A arm the same number is the size of the defect being removed. `triples` is the
   *  identical question for K3, whose window of three needs a pool of three. */
  pairs: number
  pairsBad: number
  triples: number
  triplesBad: number
}

function emptyCell(): Cell {
  return {
    careers: 0,
    conversations: 0,
    legacy: 0,
    adjacent: 0,
    withinThree: 0,
    distinct: 0,
    pairs: 0,
    pairsBad: 0,
    triples: 0,
    triplesBad: 0,
  }
}

function fold(cell: Cell, walk: Walk): void {
  cell.careers++
  cell.conversations += walk.details.length
  cell.legacy += walk.legacy
  const adjacent = adjacentRepeat(walk.details)
  const inThree = repeatWithin(walk.details, 3)
  if (adjacent) cell.adjacent++
  if (inThree) cell.withinThree++
  cell.distinct += new Set(walk.details.filter((d) => d.includes(':'))).size
  for (let i = 1; i < walk.details.length; i++) {
    if (!walk.details[i].includes(':')) continue
    if (walk.pools[i] >= 2) {
      cell.pairs++
      if (walk.details[i] === walk.details[i - 1]) cell.pairsBad++
    }
    if (walk.pools[i] >= 3) {
      cell.triples++
      if (walk.details[i] === walk.details[i - 1] || (i >= 2 && walk.details[i] === walk.details[i - 2])) {
        cell.triplesBad++
      }
    }
  }
}

function k2k3(posed: boolean): { a: Cell; b: Cell; drawn: Set<string>; poolHist: Map<number, number> } {
  const a = emptyCell()
  const b = emptyCell()
  const drawn = new Set<string>()
  const poolHist = new Map<number, number>()
  for (let i = 0; i < SEEDS; i++) {
    const voice = TEMPERAMENTS[i % TEMPERAMENTS.length]
    const register = REGISTERS[i % REGISTERS.length]
    const seed = `corpus-${i}`
    for (const [arm, cell] of [
      [false, a],
      [true, b],
    ] as const) {
      const walk = walkCareer(seed, voice, register, arm, posed)
      fold(cell, walk)
      if (arm) {
        for (const d of walk.details) if (d.includes(':')) drawn.add(`${d}/${voice}`)
        for (const n of walk.pools) poolHist.set(n, (poolHist.get(n) ?? 0) + 1)
      }
    }
  }
  return { a, b, drawn, poolHist }
}

function reportCell(name: string, c: Cell): void {
  console.log(
    `   ${pad(name, 22)}${padL(pct(c.adjacent / c.careers), 9)}${padL(pct(c.withinThree / c.careers), 11)}` +
      `${padL((c.conversations / c.careers).toFixed(1), 9)}${padL((c.distinct / c.careers).toFixed(1), 10)}` +
      `${padL((c.legacy / c.careers).toFixed(2), 9)}` +
      `${padL(`${c.pairsBad}/${c.pairs}`, 13)}${padL(`${c.triplesBad}/${c.triples}`, 13)}`,
  )
}


// =================================================================================================
// K4 – THE PER-SUBJECT × STAGE FLOOR
// =================================================================================================

function k4(): number {
  console.log('\n=== K4 · THE PER-SUBJECT × STAGE FLOOR (his: 3–4 reachable per subject per stage) ===')
  console.log(`   a cell is the situations ONE girl of that voice can reach; pass mark ${SUBJECT_FLOOR}`)
  console.log('   ⚠ ROUND 44 LANDED THE CORPUS: the 43 situations of the spec ARE in')
  console.log('   `SMALL_TALK_SITUATIONS` now, four voices each, so this table is the AFTER of the')
  console.log('   rebuild. A cell still under the floor is a real gap and not a pending transcription.\n')
  console.log(`   ${pad('subject', 12)}${STAGES.map((s) => padL(s, 15)).join('')}`)
  let failures = 0
  for (const subject of SMALL_TALK_SUBJECTS) {
    const cells: string[] = []
    for (const stage of STAGES) {
      const counts = TEMPERAMENTS.map(
        (v) => SMALL_TALK_SITUATIONS.filter((s) => s.voices[v] !== undefined && s.subject === subject && s.stages.includes(stage)).length,
      )
      const worst = Math.min(...counts)
      const best = Math.max(...counts)
      if (worst < SUBJECT_FLOOR) failures++
      cells.push(padL(`${worst}–${best} ${worst < SUBJECT_FLOOR ? 'FAIL' : 'pass'}`, 15))
    }
    console.log(`   ${pad(subject, 12)}${cells.join('')}`)
  }
  return failures
}

// =================================================================================================
// K5b – THE REAL-CAREER ARM (round 44 §13's backlog item, built in wave 7 T9)
// =================================================================================================
//
// ⚠⚠ WHY IT EXISTS: builder 1's K5 run reported the college/independent gated rows (R8, R17, R20,
// then R44) unreachable, and round 44 §13 named the suspect before this pass so it would not be
// re-derived – «tickWeek alone does not advance a career, it stalls at every pending decision».
// The POSED walk above is even further from a career than that: it moves `world.week` BY HAND and
// never ticks, so `world.college` stays null for ever (no career can reach the `college` stage),
// and the season calendar is frozen at birth (no March entry ever opens again, so
// `march-entry-open` dies with season 0). The rows themselves were measured LIVE at 91% of college
// weeks – it was the instrument that could not see them.
//
// ⚠ THE FIX IS THE WORKING RECIPE, NOT A NEW WALK: `openCareer` + `stepCareerWeek` + the drain
// (`tools/_lifeBeats`), the same one `tools/wedding-bench.ts` walks on – and for the college years
// `resumeFromCollege` presses in `tests/college-birthday.test.ts`'s own shape (the named donor),
// because `stepCareerWeek` on a latched world would tick PAST the freeze instead of through it.
//
// ⚠ WHAT THIS ARM MAY CLAIM: which columns a REAL career can draw, and how often the four named
// rows are REACHABLE on the weeks the instrument can ask. Ticked weeks are asked weekly; the
// college freeze runs a year per press, so inside it the ask happens only on PAUSE weeks
// (birthday / championship / call-up / life beat) – a real sample, and a BIASED one, said so.
// The posed arm keeps K1–K4 exactly as measured; this arm feeds K5 and nothing else.

/** The four rows round 44 §10 names, id -> its own catalogue row (subject and gate read off it). */
const K5_TARGET_IDS = [
  'alone-or-with-them',
  'the-week-with-nothing-in-it',
  'the-money-she-did-not-ask-about',
  'the-two-quiet-days',
] as const

/** The engine's own stage read, mirrored WITH the `fromWeek` clause (`lifeStageAt`,
 *  world/lifeBeat.ts – not exported): a week before the freeze began must not read `college`. */
function realStageAt(world: WorldState, week: number): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(week, world.profile.birthMonth),
    world.college !== null && week >= world.college.fromWeek && week < world.college.untilWeek,
  )
}

interface TargetCount {
  weeks: number
  reachable: Record<string, number>
}
const emptyTargetCount = (): TargetCount => ({
  weeks: 0,
  reachable: Object.fromEntries(K5_TARGET_IDS.map((t) => [t, 0])),
})

interface RealWalk {
  seed: string
  voice: Temperament
  askedCollege: boolean
  reachedCollege: boolean
  endedType: string | null
  walkEnd: number
  /** every small-talk row the ENGINE raised, as `'subject:id'` details with their weeks */
  rows: { detail: string; week: number; stage: DiaryLifeStage }[]
  /** weekly asks on TICKED weeks, by stage (college weeks cannot be asked weekly – see below) */
  ticked: Partial<Record<DiaryLifeStage, TargetCount>>
  /** asks on college PAUSE weeks – the biased sample the freeze allows */
  collegePauses: TargetCount
  collegeWeeks: number
}

/** Answer the live soft row so the surface stays free – the file's own header law («the parent in
 *  this bench always answers»), with the registry's statable answer. */
function answerSoftRow(world: WorldState): void {
  const soft = liveSoftBeat(world)
  if (soft !== null && pendingLifeBeat(world) === null) answerLifeBeat(world, DRAIN_ANSWER[soft.kind])
}

function sampleTargets(world: WorldState, voice: Temperament, stage: DiaryLifeStage, into: TargetCount): void {
  into.weeks++
  const pool = reachableSituations(world, voice, stage)
  for (const t of K5_TARGET_IDS) if (pool.some((s) => s.id === t)) into.reachable[t]++
}

const K5_REAL_WEEKS = WALK_WEEKS // the posed arm's own 25 years, so the two sweeps are comparable

function walkRealCareer(presetIndex: number, index: number, askedCollege: boolean): RealWalk {
  const preset = PRESETS.filter((p, i) => PRESETS.findIndex((q) => q.background === p.background) === i)[presetIndex]
  const policy = POLICIES[1]
  const { world } = openCareer(preset, index, policy)
  const rng = resumeMain(world.rngMain)
  const voice = world.temperament ?? temperamentFor(world.seed)
  const out: RealWalk = {
    seed: world.seed,
    voice,
    askedCollege,
    reachedCollege: false,
    endedType: null,
    walkEnd: 0,
    rows: [],
    ticked: {},
    collegePauses: emptyTargetCount(),
    collegeWeeks: 0,
  }
  let lastPauseSampled = -1
  let stale = 0
  let prevWeek = -1
  for (let guard = 0; guard < K5_REAL_WEEKS + 400 && world.week < K5_REAL_WEEKS; guard++) {
    // ⚠ THE INSTRUMENT MUST NOT SPIN SILENTLY – a walk that stops moving is the round-44 defect
    // wearing a guard counter, so three stationary iterations are a throw, not a shrug.
    if (world.week === prevWeek && ++stale > 3) throw new Error(`${world.seed}: the walk stalled at week ${world.week}`)
    if (world.week !== prevWeek) stale = 0
    prevWeek = world.week

    if (world.ending?.type === 'college') {
      out.reachedCollege = true
      resumeFromCollege(world, rng)
      if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) {
        skipTournament(world)
        closeTournament(world)
      }
      if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
      drainLifeBeats(world)
      answerSoftRow(world)
      // the pause week is a real college week the instrument can ask on – sampled once
      if (world.ending?.type === 'college' && world.week !== lastPauseSampled) {
        lastPauseSampled = world.week
        sampleTargets(world, voice, 'college', out.collegePauses)
      }
      continue
    }

    stepCareerWeek(world, rng, policy)
    if (world.ending === null) {
      if (world.fork !== null && world.fork.answer === null) {
        drainLifeBeats(world)
        answerFork(world, askedCollege ? 'college' : 'continue')
      }
      drainLifeBeats(world)
      if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
      if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
      answerSoftRow(world)
    }
    const stage = realStageAt(world, world.week)
    const cell = (out.ticked[stage] ??= emptyTargetCount())
    sampleTargets(world, voice, stage, cell)
    // ⚠ widened: the tick can LATCH college inside `stepCareerWeek`, which the narrowing above
    // cannot see – a college latch loops back to the press branch, anything else ends the walk.
    const endType: string | null = world.ending?.type ?? null
    if (endType !== null && endType !== 'college') break
  }
  out.endedType = world.ending?.type ?? null
  out.walkEnd = world.week
  if (world.college !== null) {
    out.collegeWeeks = Math.max(0, Math.min(world.college.untilWeek, world.week) - world.college.fromWeek)
  }
  for (const row of lifeLogOf(world)) {
    if (row.kind !== 'small-talk') continue
    out.rows.push({ detail: row.detail, week: row.week, stage: realStageAt(world, row.week) })
  }
  return out
}

function k5RealArm(careers: number): { drawn: Set<string>; walks: RealWalk[] } {
  const drawn = new Set<string>()
  const walks: RealWalk[] = []
  for (let i = 0; i < careers; i++) {
    // rotate the three backgrounds; every second career asks for college at the fork
    const walk = walkRealCareer(i % 3, Math.floor(i / 3), i % 2 === 0)
    walks.push(walk)
    for (const r of walk.rows) if (r.detail.includes(':')) drawn.add(`${r.detail}/${walk.voice}`)
  }
  console.log('\n=== K5b · THE REAL-CAREER ARM (round 44 §13 – the instrument healed) ===')
  const reached = walks.filter((w) => w.reachedCollege)
  console.log(
    `   ${walks.length} careers on the working recipe (stepCareerWeek + the drain; the freeze via ` +
      `resumeFromCollege presses) · ${reached.length} reached college · voices {${TEMPERAMENTS.map(
        (t) => `${t} ${walks.filter((w) => w.voice === t).length}`,
      ).join(', ')}}`,
  )
  const stageWeeks = new Map<string, number>()
  for (const w of walks) {
    for (const [stage, cell] of Object.entries(w.ticked)) {
      stageWeeks.set(stage, (stageWeeks.get(stage) ?? 0) + cell.weeks)
    }
  }
  console.log(
    `   ticked weeks by stage: ${[...stageWeeks.entries()].map(([s, n]) => `${s} ${n}`).join(' · ')} · ` +
      `college weeks lived ${walks.reduce((s, w) => s + w.collegeWeeks, 0)} (askable only at ${walks.reduce(
        (s, w) => s + w.collegePauses.weeks,
        0,
      )} pause weeks – a biased sample, said so)`,
  )
  const stageRows = new Map<string, number>()
  for (const w of walks) for (const r of w.rows) stageRows.set(r.stage, (stageRows.get(r.stage) ?? 0) + 1)
  console.log(
    `   small-talk rows the engine raised, by stage: ${[...stageRows.entries()].map(([s, n]) => `${s} ${n}`).join(' · ')} · ` +
      `${drawn.size} distinct situation/voice keys drawn`,
  )
  console.log('   the four rows round 44 §10 named, in this arm:')
  for (const id of K5_TARGET_IDS) {
    const s = SMALL_TALK_SITUATIONS.find((x) => x.id === id)
    const drawnCollege = walks.reduce((n, w) => n + w.rows.filter((r) => r.detail.endsWith(`:${id}`) && r.stage === 'college').length, 0)
    const drawnIndep = walks.reduce((n, w) => n + w.rows.filter((r) => r.detail.endsWith(`:${id}`) && r.stage === 'independent').length, 0)
    const indep = walks.reduce(
      (acc, w) => {
        const cell = w.ticked.independent
        if (cell) {
          acc.weeks += cell.weeks
          acc.hit += cell.reachable[id]
        }
        return acc
      },
      { weeks: 0, hit: 0 },
    )
    const pauses = walks.reduce(
      (acc, w) => {
        acc.weeks += w.collegePauses.weeks
        acc.hit += w.collegePauses.reachable[id]
        return acc
      },
      { weeks: 0, hit: 0 },
    )
    console.log(
      `     ${pad(id, 34)} gate ${pad(String(s?.fact), 18)} drawn: college ${drawnCollege}, independent ${drawnIndep} · ` +
        `reachable: ${pauses.weeks ? pct(pauses.hit / pauses.weeks) : '–'} of ${pauses.weeks} college pause-weeks, ` +
        `${indep.weeks ? pct(indep.hit / indep.weeks) : '–'} of ${indep.weeks} independent weeks`,
    )
  }
  return { drawn, walks }
}

// =================================================================================================
// K5 – THE UNREACHABLE SET
// =================================================================================================
//
// ⚠ TWO QUESTIONS IN ONE ROW, and the second is the one a gate typo hides behind. (1) STRUCTURAL:
// does the entry declare a stage at all, and does the voice column it is keyed under carry a spoken
// payload. ⭐ ROUND 44 RETIRED THE THIRD STRUCTURAL QUESTION – «does it carry an opener FRAME for
// every stage it declares» – because there is no per-row frame left to be missing: the payload is
// one string for both distances and the scene comes from `SMALL_TALK_FRAMES`, which is total over
// presence. What replaced it is the EMPTY-PAYLOAD read below, which is the same question about the
// thing that can still be absent. (2) OBSERVED: did the sweep ever actually draw it – since wave 7
// T9 the observed half is the POSED sweep **plus the real-career arm** (K5b), because the posed
// walk structurally cannot reach `college` or a second season's calendar and was reporting its own
// blindness as the corpus's.

function k5(drawn: Set<string>, drawnReal: Set<string>): number {
  console.log('\n=== K5 · THE UNREACHABLE SET (posed sweep ∪ real careers) ===')
  let bad = 0
  let columns = 0
  for (const s of SMALL_TALK_SITUATIONS) {
    for (const voice of TEMPERAMENTS) {
      const column = s.voices[voice]
      if (column === undefined) continue
      columns++
      const key = `${s.subject}:${s.id}/${voice}`
      const notes: string[] = []
      if (s.stages.length === 0) notes.push('declares no stage')
      if (column.opener.trim().length === 0) notes.push('empty payload')
      if (!drawn.has(key) && !drawnReal.has(key)) {
        notes.push(s.fact === null ? 'NEVER DRAWN in either arm' : `never drawn (gated on ${s.fact})`)
      }
      if (notes.length > 0) {
        bad++
        console.log(`   ⚠ ${pad(key, 48)}${notes.join(' · ')}`)
      }
    }
  }
  if (bad === 0) console.log('   ✅ every situation in the catalogue was drawn by some career in the sweep')
  const onlyReal = [...drawnReal].filter((k) => !drawn.has(k)).length
  console.log(
    `   ${SMALL_TALK_SITUATIONS.length} situations · ${columns} voice columns in the catalogue · ` +
      `${drawn.size} drawn posed · ${drawnReal.size} drawn in real careers (${onlyReal} of them invisible to the posed walk)`,
  )
  return bad
}

// =================================================================================================

function armTable(label: string, posed: boolean): { a: Cell; b: Cell; drawn: Set<string>; poolHist: Map<number, number> } {
  const run = k2k3(posed)
  console.log(`\n=== K2 · THE ADJACENT-REPEAT RATE (the acceptance test) · K3 · WITHIN THE LAST THREE ===`)
  console.log(`   ${label}`)
  console.log(
    `   ${pad('arm', 22)}${padL('K2 adj', 9)}${padL('K3 in-3', 11)}${padL('convs', 9)}${padL('distinct', 10)}` +
      `${padL('legacy', 9)}${padL('adj|pool≥2', 13)}${padL('in3|pool≥3', 13)}`,
  )
  reportCell('A · no exclusion', run.a)
  reportCell('B · last-two excluded', run.b)
  console.log(
    `   ⭐ K2 careers with ≥1 adjacent repeat: ${pct(run.a.adjacent / run.a.careers)} → ` +
      `${pct(run.b.adjacent / run.b.careers)}`,
  )
  console.log(
    `   ⭐ K2 ACCEPTANCE – adjacent pairs whose later draw HAD an alternative (pool ≥ 2): ` +
      `${run.a.pairsBad}/${run.a.pairs} → ${run.b.pairsBad}/${run.b.pairs}` +
      `  ${run.b.pairsBad === 0 ? '✅ zero' : '❌'}`,
  )
  console.log(
    `   K3 careers with a repeat inside three: ${pct(run.a.withinThree / run.a.careers)} → ` +
      `${pct(run.b.withinThree / run.b.careers)}`,
  )
  console.log(
    `   K3 ACCEPTANCE – draws with a pool of 3 or more: ` +
      (run.b.triples === 0
        ? `⚠ VACUOUS – no draw on this catalogue ever had three to choose from`
        : `${run.a.triplesBad}/${run.a.triples} → ${run.b.triplesBad}/${run.b.triples}` +
          `  ${run.b.triplesBad === 0 ? '✅ zero' : '❌'}`),
  )
  const hist = [...run.poolHist.entries()].sort((x, y) => x[0] - y[0])
  const total = hist.reduce((sum, [, n]) => sum + n, 0)
  console.log(
    `   pool she was drawn from, per conversation: ` +
      hist.map(([n, c]) => `${n}→${pct(c / total)}`).join('  '),
  )
  return run
}

function main(): void {
  console.log('THE SMALL-TALK CORPUS BENCH – round 43 #8, spec §P2.6')
  console.log(
    `seeds ${SEEDS} · target ${CONVERSATIONS} conversations/career · cap ${ECONOMY.life.smallTalkCapPerSeason}/season` +
      ` · chance ${ECONOMY.life.smallTalkPerWeek.close}/wk at a close bond`,
  )
  k1()
  const posed = armTable('POSED CAREER – a coach, a match every other week, the conqueror pattern', true)
  const bare = armTable('BARE CAREER – no coach, no matches: only the ungated half of the catalogue', false)
  const k4fails = k4()
  // ⚠ `--real 0` skips the walked arm (minutes, not seconds) and K5 then reads exactly as it did
  // before wave 7 T9 – posed sweep only, blindness included.
  const real = REAL_CAREERS > 0 ? k5RealArm(REAL_CAREERS) : { drawn: new Set<string>(), walks: [] }
  const k5bad = k5(posed.drawn, real.drawn)
  const k2pass = posed.b.pairsBad === 0 && bare.b.pairsBad === 0
  const k3den = posed.b.triples + bare.b.triples
  console.log(
    `\nVERDICT · K2 ${k2pass ? 'PASS' : 'FAIL'} (zero adjacent repeats wherever an alternative existed)` +
      ` · K3 ${k3den === 0 ? 'VACUOUS on this catalogue' : posed.b.triplesBad + bare.b.triplesBad === 0 ? 'PASS' : 'FAIL'}` +
      ` · K4 ${k4fails === 0 ? 'PASS' : `${k4fails} cell(s) under the floor`}` +
      ` · K5 ${k5bad === 0 ? 'PASS' : `${k5bad} situation(s) flagged`}`,
  )
}

main()
