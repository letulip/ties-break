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
  createWorld,
  lifeLogOf,
  reachableSituations,
  rollSmallTalk,
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
import { SMALL_TALK_SUBJECT_WEIGHT } from '../src/engine/world/lifeBeat'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf, moodRegisterOf, spiritBandOf } from '../src/engine/spirit'
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
      const ceiling = SMALL_TALK_SITUATIONS.filter((s) => s.voice === voice && s.stages.includes(stage))
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
 *  season's own rules. K5 names the entry and the reason instead of scoring it. */
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
  console.log('   ⚠ IT MEASURES THE SHIPPED CATALOGUE. The fourteen rebuilt situations of the corpus')
  console.log('   spec are DRAFTS with the owner and are not in `SMALL_TALK_SITUATIONS`, so every cell')
  console.log('   below is expected to fail today – this row is the BEFORE of that rebuild, not a bug.\n')
  console.log(`   ${pad('subject', 12)}${STAGES.map((s) => padL(s, 15)).join('')}`)
  let failures = 0
  for (const subject of SMALL_TALK_SUBJECTS) {
    const cells: string[] = []
    for (const stage of STAGES) {
      const counts = TEMPERAMENTS.map(
        (v) => SMALL_TALK_SITUATIONS.filter((s) => s.voice === v && s.subject === subject && s.stages.includes(stage)).length,
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
// K5 – THE UNREACHABLE SET
// =================================================================================================
//
// ⚠ TWO QUESTIONS IN ONE ROW, and the second is the one a gate typo hides behind. (1) STRUCTURAL:
// does the entry declare a stage at all, and does it carry an opener FRAME for every stage it
// declares – a situation drawn at a stage it has no line for does not fall back, it THROWS inside
// the snapshot (`smallTalkOpener`). (2) OBSERVED: did the K2 sweep, across every voice, every
// register and every stage a real calendar walks through, ever actually draw it.

function k5(drawn: Set<string>): number {
  console.log('\n=== K5 · THE UNREACHABLE SET ===')
  let bad = 0
  for (const s of SMALL_TALK_SITUATIONS) {
    const key = `${s.subject}:${s.id}/${s.voice}`
    const notes: string[] = []
    if (s.stages.length === 0) notes.push('declares no stage')
    for (const stage of s.stages) {
      const frame = stage === 'school' || stage === 'after-school' ? s.opener.roof : s.opener.away
      if (frame === undefined) notes.push(`no frame for ${stage}`)
    }
    if (!drawn.has(key)) notes.push(s.fact === null ? 'NEVER DRAWN in the sweep' : `never drawn (gated on ${s.fact})`)
    if (notes.length > 0) {
      bad++
      console.log(`   ⚠ ${pad(key, 42)}${notes.join(' · ')}`)
    }
  }
  if (bad === 0) console.log('   ✅ every situation in the catalogue was drawn by some career in the sweep')
  console.log(`   ${SMALL_TALK_SITUATIONS.length} situations in the catalogue · ${drawn.size} drawn in the sweep`)
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
  const k5bad = k5(posed.drawn)
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
