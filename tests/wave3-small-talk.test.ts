// =================================================================================================
// WAVE 3, T8 – TIER-1 SMALL TALK: THE WEEK SHE COMES WITH SOMETHING SMALL
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T8, constants in `ECONOMY.life` (§4's last row),
// the ruling in `docs/specs/who-she-is-2026-09.md` §5b (tier 1) and V2 («tier-1 replies move
// nothing – texture, never economy»).
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts SHAPES, never wording: every sentence it reaches is a
// DRAFT for the owner (CLAUDE.md invariant 4), so what is pinned is «four voices, three subjects,
// twelve different lines», «no price in any of them», «one quoted span», never a string.
//
// =================================================================================================
// ⚠⚠ AND READ §H FIRST: TIER 1 IS BUILT AND DORMANT (the owner's deferral, 11.09.2026)
// =================================================================================================
//
// Everything in §A–§G below tests code that SHIPS and STAYS – the hazard by band, the season cap, the
// subject derivation, the constants, the option table and her eighteen drafted lines. What does NOT
// ship in THIS STEP is the one line that would RAISE the beat: the owner ruled it off after T8
// landed («вариант 3»), because §5b prices tier 1 «soft – answerable, never lost» while the brief's
// «standard machinery (pause, queue, re-validation)» is tier 2's HARD pause – and a soft beat needs a
// surface. T15 is the step that builds one and turns the raise back on; §H is the guard that holds
// the interim state, and it carries the second ruling too: NO AGE GATE when it lands.
//
// ⚠ SO EVERY CASE BELOW CALLS `rollSmallTalk` DIRECTLY. That was already true when T8 wrote them –
// they were never walked-career cases – so the deferral moved no assertion in §A–§G, only the call
// site in `world/phaseHerWeek.ts`. The one pin that DID read the call site is
// `tests/spirit.test.ts`'s ordered call-order gap, re-aimed there with its own ⚠ note.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back. The count is what the
// mutation actually reddened, because a mutation that reddens the WRONG case is as much a finding as
// one that reddens nothing.
// =================================================================================================
//
//   ARM 1   ⚠⚠ THE ZERO-DRAW SHORT-CIRCUIT. The band clause hoisted out of the gate and turned into
//           a comparison – `smallTalkEligible` ending `return true` so `rollSmallTalk` draws and
//           then compares against a chance of 0 (draw-and-discard on a silent home).
//           4 RED · §B «⭐⭐ a STRAINED home derives no stream at all – not one, not discarded: the
//           gate returned before any key existed: expected [ Array(1) ] to deeply equal []», «a COLD
//           home ...: expected [ 'zero-draw-cold:life:smalltalk:200' ] to deeply equal []», «...over
//           a WHOLE SEASON: strained: 52 weeks, not one key: expected [ …(52) ] to deeply equal []»,
//           and §A «strained: expected true to be false».
//           ⚠ AND §B's POSITIVE CONTROLS STAYED GREEN THROUGHOUT, which is what makes «no keys» a
//           statement about the gate rather than about a broken recorder.
//
//   ARM 1b  ⚠ THE ANTI-VACUITY ARM FOR THE WHOLE FILE – `rollSmallTalk`'s body short-circuited to
//           `return` on its first line, so nothing anywhere reaches a stream or raises a row.
//           14 RED across §A, §B, §C, §D, §E, §F and §G – including §B's own positive control («⭐ a
//           close home that MISSES takes exactly one draw: expected [] to deeply equal [ Array(1) ]»),
//           §D's «and the cap really is reached – the sweep could have failed: expected 0 to be
//           greater than 0», §E's «close measured 0: expected 0 to be greater than 0.04» and §F's
//           «the season had at least one of them: expected 0 to be greater than 0».
//
//   ARM 2   ⚠⚠ THE V2 PIN'S OWN ARM, AND IT IS THE RULED HEART OF THE STEP. One reply given a price:
//           `{ id: 'more', label: 'Ask her to say more', bond: 1 }` in `LIFE_BEAT_OPTIONS`.
//           3 RED · §C «⚠⚠ close/more: a tier-1 reply moved the standing: expected 81 to be 80»,
//           «every reply priced zero – ruling V2: expected [ 1, +0, +0 ] to deeply equal [ +0, +0,
//           +0 ]» and «all three are free: expected 2 to be 3».
//           ⚠ The other two replies stayed green under it, which is exactly why §C sweeps ALL THREE
//           rather than asserting «the beat did not move bond» once.
//
//   ARM 2b  the same, on the LAST option instead of the first (`easy` given `bond: -1`)
//           3 RED · §C «⚠⚠ close/easy: a tier-1 reply moved the standing: expected 79 to be 80»,
//           «every reply priced zero – ruling V2: expected [ +0, +0, -1 ] ...» and «all three are
//           free: expected 2 to be 3». Recorded separately because ARM 2 alone would not have proven
//           the sweep reaches past its first element.
//
//   ARM 3   the season filter dropped from `smallTalkThisSeason` – `seasonIndexOf(row.week) ===
//           season` removed, so last season's conversations still count against this one.
//           2 RED · §D «⚠ four from LAST season do not cap this one: none of them is THIS season:
//           expected 4 to be +0» and «the mixed log ...: three of her own, this season: expected 7
//           to be 3»
//
//   ARM 4   the KIND filter dropped from `smallTalkThisSeason` – every `lifeLog` row counted.
//           2 RED · §D «⚠⚠ the counter counts HER SMALL TALK and not her life: but not one of them
//           is small talk: expected 4 to be +0» and «the mixed log ...: expected 5 to be 3»
//
//   ARM 5   the cap clause deleted from `smallTalkEligible`.
//           3 RED · §D «⭐⭐ never a fifth in one season ...: small-talk-sweep-5: expected 6 to be
//           less than or equal to 4», «a capped season derives no stream at all: and the gate
//           refuses: expected true to be false» and «the fourth closes the season: expected true to
//           be false»
//
//   ARM 6   the pending-queue clause deleted from `smallTalkEligible`.
//           1 RED · §A «⭐ nothing new while something is still waiting: a pending row refuses:
//           expected true to be false»
//
//   ARM 7   `smallTalkSubjectFor` collapsed onto one subject (`return 'question'` always).
//           ⚠⚠ FIRST RUN: **1 RED ONLY**, and that is a FINDING rather than a pass. §G's «the row
//           records the subject her week licensed» expected `smallTalkSubjectFor(register)` – an
//           equality comparing the code under test WITH ITSELF, so the mutation moved both sides and
//           the case stayed green. That is the «two arms compared to each other» defect this wave
//           has already caught once. The expectation became the literal `EXPECTED_SUBJECT` table
//           below and the arm was RE-RUN: **2 RED** · §G «a heavy week brings a worry: expected
//           'question' to be 'worry'» and «bright: the subject: expected 'question' to be 'joy'».
//
//   ARM 8   `ANSWER_EVENT['small-talk']` given three feed lines instead of `null` – i.e. tier 1
//           writing a feed row after all.
//           1 RED · §C «⚠ tier 1 leaves its trace in the log and nowhere else: expected 2 to be 1»
//           ⚠ The POSITIVE CONTROL in the same case («and a `'met'` answer really does write one»)
//           stayed green under it, which is what stops the negative assertion passing because
//           `addEvent` was never reachable at all.
//
//   ARM 9   ⚠⚠ THE DORMANCY ARM – the deferral's own net, and the one the next wave will trip. The
//           call site RESTORED: `rollSmallTalk(world)` put back in `world/phaseHerWeek.ts`
//           immediately after `deliverKnownPartner(world)`, with its import.
//           4 RED · §H «⚠⚠ NO PRODUCTION PATH CALLS THE ROLL: tier 1 is deferred: no file under
//           src/ may raise it: expected [ 'engine/world/phaseHerWeek.ts' ] to deeply equal []»,
//           §H «⚠⚠ ...and a WALKED career raises not one `small-talk` row: dormant-1: a walked season
//           may not produce tier 1: expected [ { week: 1, …(3) }, …(2) ] to deeply equal []» (weeks
//           1, 14 and 15, `detail: 'question'`, answered `'more'` by the drain), §H «⚠ ...the
//           anti-vacuity control: still none after the walk: expected [ { week: 1, …(3) }, …(2) ] to
//           deeply equal []», and tests/spirit.test.ts's call-order gap «only the private life's two
//           weekly calls separate them: expected [ 'rollArrival(world)', …(2) ] to deeply equal
//           [ 'rollArrival(world)', …(1) ]».
//           ⚠ AND THE OTHER 121 CASES OF THE TWO FILES STAYED GREEN under it, which is the statement
//           §A–§G make about themselves: they call the roll DIRECTLY, so they are indifferent to
//           whether the engine also calls it – exactly what lets tier 1 be switched on later without
//           re-writing one of them.
//
// ⚠⚠ AND A WORD ON WHY §B IS A KEY COUNT AND NOT AN ALIGNMENT COMPARISON, inherited whole from T3's
// own finding (tests/wave3-arrival.test.ts §B, ARM 2b): every key in this wave carries its own week,
// so a discarded draw cannot shift any other week's value and «two worlds differing only in an
// ineligible week produce identical later verdicts» stays GREEN under the very draw-and-discard
// mutation it would be written to catch. The honest net is a COUNT of the keys the gate reached,
// held in an array the code under test cannot see, WITH a positive control.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave3-arrival.test.ts's own shape, verbatim. Every call is
// delegated to the real `rngFromSeed`, so the numbers this file measures are the engine's own; the
// mock exists only so §B can COUNT the keys the gate reached. Hoisted, because `vi.mock`'s factory is
// lifted above the imports.
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

// ⚠ v74 DEFERRAL (§H): the filesystem reader and the walk. `readdirSync`/`readFileSync` are
// spirit.test.ts's own whole-tree reader, and `tickWeek` + `resumeMain` are how a career is really
// walked – §H's claim is that the ENGINE raises nothing, which only a real tick can say.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  answerLifeBeat,
  buildLifeBeatPrompt,
  createWorld,
  tickWeek,
  lifeBeatHeading,
  lifeBeatListenFollowUp,
  lifeBeatSaid,
  lifeLogOf,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  raiseLifeBeat,
  rollSmallTalk,
  smallTalkChanceFor,
  smallTalkEligible,
  smallTalkSubjectFor,
  smallTalkThisSeason,
  LIFE_BEAT_OPTIONS,
  SMALL_TALK_SUBJECTS,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf, moodRegisterOf, spiritBandOf } from '../src/engine/spirit'
import type { BondBand, LifeBeatRecord, MoodRegister } from '../src/shared/protocol'

const LIFE = ECONOMY.life
const OPTIONS = LIFE_BEAT_OPTIONS['small-talk']
const BANDS: readonly BondBand[] = ['close', 'steady', 'strained', 'cold']
const REGISTERS: readonly MoodRegister[] = ['bright', 'level', 'low']
const WEEKS_IN_SEASON = 52
/** `src/`, for §H's whole-tree reader. ⚠ `import.meta.url` is legal here – this file runs in the
 *  UNIT project (node), never under happy-dom, where the URL scheme would throw at collect time. */
const SRC_ROOT = fileURLToPath(new URL('../src/', import.meta.url))

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The lowest `bond` that still reads as this band, found by ASKING THE LADDER rather than by
 *  re-deriving its cut points – the delivery file's own helper, for its own reason: `bondBandOf` is
 *  the one reader of those numbers and a second transcription of them is a place to drift. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** ...and the same trick on the Mood ladder: the first spirit value that reads as this register. */
function spiritFor(register: MoodRegister): number {
  for (let s = 0; s <= 100; s += 0.1) {
    if (moodRegisterOf(spiritBandOf(Math.round(s * 10) / 10)) === register) return Math.round(s * 10) / 10
  }
  throw new Error(`no spirit value reads as ${register}`)
}

/** A career parked at `week`, at a known band and a known register, with an empty life.
 *  ⚠ A REAL `createWorld` rather than a cast, so the profile, the seed and the temperament are the
 *  engine's own – wave3-arrival's `careerAt`, extended with the two numbers this beat reads. */
function careerAt(seed: string, week: number, band: BondBand, register: MoodRegister = 'level'): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.bond = bondFor(band)
  world.spirit = spiritFor(register)
  return world
}

/** One roll on a career whose log has been emptied, so a sweep measures the CHANCE rather than the
 *  queue filling up after the first success. Returns the row if she came with something. */
function rollFresh(world: WorldState, week: number): LifeBeatRecord | null {
  world.week = week
  world.lifeLog = []
  rollSmallTalk(world)
  return world.lifeLog[0] ?? null
}

/** An already-answered row of any kind – the shape §D needs to prove the counter is not a `length`.
 *  ⚠ ANSWERED ON PURPOSE: an unanswered row is the QUEUE, and the queue clause would refuse the roll
 *  before the cap clause was ever asked, which would make §D's cases pass for the wrong reason. */
function answeredRow(week: number, kind: LifeBeatRecord['kind'], detail: string): LifeBeatRecord {
  return { week, kind, detail, answer: 'x' }
}

/** The first week this career's own dice MISS on, at this band – a positive control that is FOUND
 *  rather than assumed. */
function firstMiss(world: WorldState, from: number): number {
  for (let w = from; w < from + 400; w++) if (rollFresh(world, w) === null) return w
  throw new Error('no miss found')
}

/** ...and the first it HITS on. */
function firstHit(world: WorldState, from: number): number {
  for (let w = from; w < from + 2000; w++) if (rollFresh(world, w) !== null) return w
  throw new Error('no hit found')
}

const SWEEP_SEEDS = Array.from({ length: 40 }, (_, i) => `small-talk-sweep-${i}`)

/** ⚠⚠ THE MAPPING WRITTEN OUT, AND IT IS WRITTEN OUT FOR A MEASURED REASON. §G's row case first
 *  expected `smallTalkSubjectFor(register)` – an equality comparing the code with ITSELF, which
 *  stayed GREEN under ARM 7 (the function collapsed onto one subject) while §G's literal case went
 *  red alone. That is the «two arms compared to each other» defect this wave has already caught once,
 *  so the expectation is a table of its own and every case reads it. */
const EXPECTED_SUBJECT: Record<MoodRegister, string> = { bright: 'joy', level: 'question', low: 'worry' }

// =================================================================================================
// A. THE GATE – the queue, the two live bands, and the two silent ones
// =================================================================================================
describe('wave 3 T8 A – when she may come with something', () => {
  it('⭐ the two live bands and the two silent ones, off the constants themselves', () => {
    expect(smallTalkChanceFor('close'), 'close').toBe(LIFE.smallTalkPerWeek.close)
    expect(smallTalkChanceFor('steady'), 'steady').toBe(LIFE.smallTalkPerWeek.steady)
    // ⚠ THE READING THAT MATTERS, and it is stated rather than transcribed: the two distant bands are
    // ZERO, and close is strictly the busier of the two live ones.
    expect(smallTalkChanceFor('strained'), 'strained is silent').toBe(0)
    expect(smallTalkChanceFor('cold'), 'cold is silent').toBe(0)
    expect(smallTalkChanceFor('close')).toBeGreaterThan(smallTalkChanceFor('steady'))
    expect(smallTalkChanceFor('steady')).toBeGreaterThan(0)
  })

  it('⭐ eligibility follows the band: close and steady may, strained and cold may not', () => {
    for (const band of BANDS) {
      const world = careerAt(`gate-${band}`, 200, band)
      expect(smallTalkEligible(world), `${band}`).toBe(smallTalkChanceFor(band) > 0)
    }
  })

  it('⭐ nothing new while something is still waiting – the queue is the gate', () => {
    const world = careerAt('gate-pending', 200, 'close')
    raiseLifeBeat(world, 'small-talk', 'worry')
    expect(pendingLifeBeat(world), 'the fixture really is waiting').not.toBeNull()
    expect(smallTalkEligible(world), 'a pending row refuses').toBe(false)
    // ...and over a whole season of asking, not one more row lands behind it.
    for (let w = 200; w < 200 + WEEKS_IN_SEASON; w++) {
      world.week = w
      rollSmallTalk(world)
    }
    expect(lifeLogOf(world).length, '⭐ nothing new while something is still waiting').toBe(1)
    // THE POSITIVE CONTROL: answer it, and the very same loop is busy again.
    drainLifeBeats(world)
    expect(pendingLifeBeat(world), 'the queue is empty now').toBeNull()
    let more = 0
    for (let w = 200; w < 200 + WEEKS_IN_SEASON; w++) {
      world.week = w
      world.lifeLog = [world.lifeLog![0]]
      rollSmallTalk(world)
      if (world.lifeLog!.length > 1) {
        more++
        world.lifeLog![1] = { ...world.lifeLog![1], answer: 'x' }
      }
    }
    expect(more, 'and the same loop with the queue clear is busy – the sweep could have failed').toBeGreaterThan(0)
  })
})

// =================================================================================================
// B. ⚠⚠ ZERO DRAWS WHERE THE CHANCE IS ZERO – THE LOAD-BEARING RULE, AND ITS HONEST NET
// =================================================================================================
//
// ⚠⚠ THE SHAPE IS T3's FINDING INHERITED, NOT A PREFERENCE. `tests/wave3-arrival.test.ts` §B records
// that the alignment comparison the brief originally asked for CANNOT FAIL in this wave – the key
// carries its week, so a discarded draw shifts nothing – and that the honest net is a COUNT of the
// keys the code reached. `rngKeys` above is that count, held in an array the code under test cannot
// see, and the last case in this section is the POSITIVE CONTROL that makes «no keys» mean the gate
// returned rather than the recorder being broken.
describe('wave 3 T8 B – a silent home takes ZERO draws', () => {
  beforeEach(() => {
    rngKeys.length = 0
  })

  /** The life-layer keys reached since the last reset. ⚠ Filtered, because `createWorld` legitimately
   *  derives `:temperament` and a dozen others – this section is a claim about THIS wave's streams. */
  function lifeKeys(): string[] {
    return rngKeys.filter((k) => k.includes(':life:'))
  }

  it('⭐⭐ a STRAINED home derives no stream at all – not one, not discarded', () => {
    const world = careerAt('zero-draw-strained', 200, 'strained')
    rngKeys.length = 0
    rollSmallTalk(world)
    expect(lifeKeys(), 'the gate returned before any key existed').toEqual([])
  })

  it('⭐⭐ a COLD home derives no stream at all', () => {
    const world = careerAt('zero-draw-cold', 200, 'cold')
    rngKeys.length = 0
    rollSmallTalk(world)
    expect(lifeKeys(), 'the gate returned before any key existed').toEqual([])
  })

  it('⭐⭐ ...and neither of them does over a WHOLE SEASON of weeks', () => {
    // The single-week cases above could pass on a gate that refuses one particular week. This is the
    // same claim over 52 of them, on both silent bands.
    for (const band of ['strained', 'cold'] as BondBand[]) {
      const world = careerAt(`zero-draw-season-${band}`, 0, band)
      rngKeys.length = 0
      for (let w = 200; w < 200 + WEEKS_IN_SEASON; w++) {
        world.week = w
        rollSmallTalk(world)
      }
      expect(lifeKeys(), `${band}: 52 weeks, not one key`).toEqual([])
      expect(lifeLogOf(world), `${band}: and not one row`).toEqual([])
    }
  })

  it('⭐ a close home that MISSES takes exactly one draw, on the small-talk key and nothing else', () => {
    // ⚠⚠ THE POSITIVE CONTROL for the three cases above: the same call on a LIVE band DOES reach a
    // stream, so «no keys» up there is a property of the gate and not of the recorder.
    const world = careerAt('zero-draw-eligible', 0, 'close')
    const week = firstMiss(world, 200)
    world.week = week
    world.lifeLog = []
    rngKeys.length = 0
    rollSmallTalk(world)
    expect(lifeKeys()).toEqual([`${world.seed}:life:smalltalk:${week}`])
    expect(lifeLogOf(world), 'and it really was a miss').toEqual([])
  })

  it('⭐ a close home that HITS takes exactly one draw too – the subject is DERIVED, never drawn', () => {
    const world = careerAt('zero-draw-hit', 0, 'close')
    const week = firstHit(world, 200)
    world.week = week
    world.lifeLog = []
    rngKeys.length = 0
    rollSmallTalk(world)
    expect(lifeKeys(), 'one key on a hit, exactly as on a miss').toEqual([
      `${world.seed}:life:smalltalk:${week}`,
    ])
    expect(lifeLogOf(world).length, 'and it really was a hit').toBe(1)
    // ⚠ AND NO OTHER `:life:` KEY EXISTS ON THIS TREE. `seed:life:ends:*` is WAVE 4's and may not be
    // created early (brief §3); the arrival's three are the other file's.
    expect(lifeKeys().some((k) => k.includes(':ends:')), 'wave 4 has not started early').toBe(false)
  })
})

// =================================================================================================
// C. ⚠⚠ THE V2 PIN – EVERY REPLY IS PRICED ZERO, AND THE BEAT LEAVES THE LEDGER ALONE
// =================================================================================================
//
// «Tier-1 replies move nothing – small talk is texture, never economy, and the delta table stays the
// big beats'» (who-she-is §5b, ruling V2, 09.09). This is the ruled heart of the step, so it is
// asserted through the ENGINE COMMAND on a REAL raised row – never against the table alone, which
// would only be re-reading the literal a mutation would have edited.
describe('wave 3 T8 C – a tier-1 reply moves nothing', () => {
  /** A career with a small-talk beat genuinely raised BY THE ROLL, at a band that can raise one. */
  function withBeat(seed: string, band: BondBand, register: MoodRegister = 'level'): WorldState {
    const world = careerAt(seed, 0, band, register)
    const week = firstHit(world, 200)
    world.week = week
    world.lifeLog = []
    rollSmallTalk(world)
    expect(pendingLifeBeat(world), `${seed}: the fixture really raised one`).not.toBeNull()
    return world
  }

  it('⭐⭐⭐ bond is byte-identical before and after EVERY one of her parent\'s replies', () => {
    for (const band of ['close', 'steady'] as BondBand[]) {
      for (const option of OPTIONS) {
        const world = withBeat(`v2-${band}-${option.id}`, band)
        const before = world.bond
        const spiritBefore = world.spirit
        answerLifeBeat(world, option.id)
        expect(world.bond, `⚠⚠ ${band}/${option.id}: a tier-1 reply moved the standing`).toBe(before)
        // ⚠ AND NOTHING ELSE OF HERS EITHER – §4a.2's split: life moves spirit, his words move bond.
        expect(world.spirit, `${band}/${option.id}: and her weather is not his to move`).toBe(spiritBefore)
        // ⚠⚠ THE ANTI-VACUITY HALF. «Bond did not move» is free on a beat that was never answered,
        // so the row has to show the answer it was given.
        expect(lifeLogOf(world)[0].answer, `${band}/${option.id}: something really was answered`).toBe(option.id)
        expect(pendingLifeBeat(world), `${band}/${option.id}: and the queue is empty`).toBeNull()
      }
    }
  })

  it('⚠ the sweep above really walks THREE replies, and every one of them is a literal zero', () => {
    // The control for the loop's own reach: a sweep over one option would pass ARM 2 and miss ARM 2b.
    expect(OPTIONS.length, '2–3 replies, §5b').toBeGreaterThanOrEqual(2)
    expect(OPTIONS.length).toBeLessThanOrEqual(3)
    expect(OPTIONS.map((o) => o.bond), 'every reply priced zero – ruling V2').toEqual(OPTIONS.map(() => 0))
    expect(new Set(OPTIONS.map((o) => o.id)).size, 'three ids').toBe(OPTIONS.length)
    expect(new Set(OPTIONS.map((o) => o.label)).size, 'three different sentences').toBe(OPTIONS.length)
  })

  it('⚠ the harness\'s own free answer drains it, and the number it was measuring does not move', () => {
    // END TO END THROUGH `tools/_lifeBeats.ts` – the path `npm run e2e:fixtures` and forty benches
    // take. `drainLifeBeats` THROWS if a kind has no bond-neutral answer, so this is also the T6b pin
    // met on a live row rather than on the table.
    const world = withBeat('v2-drain', 'close')
    const before = world.bond
    expect(pendingLifeBeatOptions(world)!.filter((o) => o.bond === 0).length, 'all three are free').toBe(
      OPTIONS.length,
    )
    const cleared = drainLifeBeats(world)
    expect(cleared, 'the helper answered the row').toBe(1)
    expect(world.bond, '⚠⚠ a walk that never asked the player put nothing on the scale').toBe(before)
    expect(lifeLogOf(world)[0].answer, 'and something really was answered').not.toBeNull()
  })

  it('⚠ tier 1 leaves its trace in the log and nowhere else – no feed row, with the control beside it', () => {
    // ⚠⚠ A NEGATIVE ASSERTION MUST FIRST PROVE ITS TARGET EXISTS. «No feed row» is free if
    // `addEvent` were unreachable from `answerLifeBeat` at all, so the POSITIVE CONTROL is in the
    // same case: a `'met'` row answered through the identical command DOES write one.
    const world = withBeat('v2-no-feed', 'close')
    const before = world.events.length
    answerLifeBeat(world, OPTIONS[0].id)
    expect(world.events.length, '⚠ tier 1 leaves its trace in the log and nowhere else').toBe(before)
    expect(lifeLogOf(world)[0].answer, 'and the row really was answered').toBe(OPTIONS[0].id)

    const control = careerAt('v2-no-feed-control', 200, 'close')
    control.loveEpisodes = [{ id: 'p:1', sinceWeek: 190, endedWeek: null, knownWeek: 195, wants: 'open', partnerId: 'p:1' }]
    raiseLifeBeat(control, 'met', 'p:1')
    const controlBefore = control.events.length
    answerLifeBeat(control, 'wary')
    expect(control.events.length, 'and a `met` answer really does write one').toBe(controlBefore + 1)
  })
})

// =================================================================================================
// D. ⚠⚠ THE CAP – FOUR A SEASON, COUNTED OFF THE LOG, AND COUNTED CORRECTLY
// =================================================================================================
//
// The log is the counter (who-she-is §5b line item 6: «caps without new state»). Two filters, and
// both of them are load-bearing: `lifeLog` also holds `'fork-opinion'` and `'met'` rows and is never
// pruned, so a `length` would cap her on the wrong thing and a season-blind count would cap her for
// life.
describe('wave 3 T8 D – four a season, and the counter counts the right rows', () => {
  /** Walk one season, answering every small-talk beat the week it is raised (which is what the queue
   *  makes a player do), and hand back the rows it produced. */
  function walkSeason(world: WorldState, from: number): LifeBeatRecord[] {
    for (let w = from; w < from + WEEKS_IN_SEASON; w++) {
      world.week = w
      rollSmallTalk(world)
      const pending = pendingLifeBeat(world)
      if (pending !== null) answerLifeBeat(world, OPTIONS[0].id)
    }
    return lifeLogOf(world).filter((r) => r.kind === 'small-talk' && r.week >= from && r.week < from + WEEKS_IN_SEASON)
  }

  it('⭐⭐ never a fifth in one season, over forty careers of asking – and the cap really binds', () => {
    let capped = 0
    for (const seed of SWEEP_SEEDS) {
      const world = careerAt(`cap-${seed}`, 0, 'close')
      const rows = walkSeason(world, 4 * WEEKS_IN_SEASON)
      expect(rows.length, `${seed}: never a fifth in one season`).toBeLessThanOrEqual(LIFE.smallTalkCapPerSeason)
      if (rows.length === LIFE.smallTalkCapPerSeason) capped++
    }
    // ⚠⚠ THE ANTI-VACUITY HALF, AND THE WHOLE REASON THE SWEEP IS FORTY CAREERS: «never more than
    // four» is free on a mechanism that never reaches four. Some of these seasons have to.
    expect(capped, 'and the cap really is reached – the sweep could have failed').toBeGreaterThan(0)
  })

  it('⭐⭐ a capped season derives no stream at all – the cap is a short-circuit too', () => {
    const world = careerAt('cap-zero-draw', 160, 'close')
    world.lifeLog = Array.from({ length: LIFE.smallTalkCapPerSeason }, (_, i) =>
      answeredRow(160 + i, 'small-talk', 'question'),
    )
    expect(smallTalkThisSeason(world), 'the fixture really is at the cap').toBe(LIFE.smallTalkCapPerSeason)
    expect(smallTalkEligible(world), 'and the gate refuses').toBe(false)
    rngKeys.length = 0
    rollSmallTalk(world)
    expect(rngKeys.filter((k) => k.includes(':life:')), 'and a capped season derives no stream at all').toEqual([])
    // THE POSITIVE CONTROL: one row short of the cap, the identical call DOES reach a stream.
    world.lifeLog = world.lifeLog!.slice(0, LIFE.smallTalkCapPerSeason - 1)
    rngKeys.length = 0
    rollSmallTalk(world)
    expect(rngKeys.filter((k) => k.includes(':life:')).length, 'one short of the cap is busy').toBe(1)
  })

  it('⚠⚠ the counter counts HER SMALL TALK and not her life – other kinds do not cap it', () => {
    // ⚠ THE NAIVE COUNT IS A `length`, AND THIS IS THE CASE IT FAILS. Four answered rows of the OTHER
    // two kinds, all inside this season, all in the same never-pruned log.
    const world = careerAt('cap-other-kinds', 160, 'close')
    world.lifeLog = [
      answeredRow(161, 'met', 'p:1'),
      answeredRow(162, 'met', 'p:2'),
      answeredRow(163, 'fork-opinion', 'college'),
      answeredRow(164, 'fork-opinion', 'tour'),
    ]
    expect(world.lifeLog.length, 'a naive length would already be at the cap').toBe(LIFE.smallTalkCapPerSeason)
    expect(smallTalkThisSeason(world), 'but not one of them is small talk').toBe(0)
    expect(smallTalkEligible(world), 'so she may still come with something').toBe(true)
    let hits = 0
    for (let w = 160; w < 160 + WEEKS_IN_SEASON; w++) {
      world.week = w
      rollSmallTalk(world)
      const pending = pendingLifeBeat(world)
      if (pending !== null) {
        hits++
        answerLifeBeat(world, OPTIONS[0].id)
      }
    }
    expect(hits, '⚠⚠ the counter counts HER SMALL TALK and not her life').toBeGreaterThan(0)
  })

  it('⚠ four from LAST season do not cap this one', () => {
    const world = careerAt('cap-last-season', 4 * WEEKS_IN_SEASON, 'close')
    // Four of them, all small talk, all answered, all in the season before this one.
    world.lifeLog = Array.from({ length: LIFE.smallTalkCapPerSeason }, (_, i) =>
      answeredRow(3 * WEEKS_IN_SEASON + i, 'small-talk', 'question'),
    )
    expect(smallTalkThisSeason(world), 'none of them is THIS season').toBe(0)
    expect(smallTalkEligible(world), 'so the new season starts clear').toBe(true)
    let hits = 0
    for (let w = 4 * WEEKS_IN_SEASON; w < 5 * WEEKS_IN_SEASON; w++) {
      world.week = w
      rollSmallTalk(world)
      if (pendingLifeBeat(world) !== null) {
        hits++
        answerLifeBeat(world, OPTIONS[0].id)
      }
    }
    expect(hits, '⚠ four from LAST season do not cap this one').toBeGreaterThan(0)
    // ...and the season boundary really did fall between the two blocks.
    expect(smallTalkThisSeason(world), 'the new season counts only its own').toBe(hits)
  })

  it('⚠ the mixed log – last season\'s four, this season\'s other kinds, and three of her own', () => {
    // The three filters at once, which is the shape a real career actually has.
    const world = careerAt('cap-mixed', 4 * WEEKS_IN_SEASON + 30, 'close')
    world.lifeLog = [
      ...Array.from({ length: 4 }, (_, i) => answeredRow(3 * WEEKS_IN_SEASON + i, 'small-talk', 'joy')),
      answeredRow(4 * WEEKS_IN_SEASON + 1, 'met', 'p:1'),
      answeredRow(4 * WEEKS_IN_SEASON + 2, 'fork-opinion', 'tour'),
      ...Array.from({ length: 3 }, (_, i) => answeredRow(4 * WEEKS_IN_SEASON + 10 + i, 'small-talk', 'worry')),
    ]
    expect(smallTalkThisSeason(world), 'three of her own, this season').toBe(3)
    expect(smallTalkEligible(world), 'one short of the cap – still busy').toBe(true)
    world.lifeLog.push(answeredRow(4 * WEEKS_IN_SEASON + 20, 'small-talk', 'question'))
    expect(smallTalkThisSeason(world), 'and now four').toBe(LIFE.smallTalkCapPerSeason)
    expect(smallTalkEligible(world), 'the fourth closes the season').toBe(false)
  })
})

// =================================================================================================
// E. THE CORRIDOR – wide, non-flaky; ⚠ the exact medians are T11's bench and not this file's
// =================================================================================================
describe('wave 3 T8 E – how often she comes, at each live band', () => {
  /** The measured share of weeks that raise a row, over the sweep seeds, with the log emptied each
   *  week so the queue and the cap cannot colour the hazard. */
  function share(band: BondBand, weeks: number): number {
    let hits = 0
    let asked = 0
    for (const seed of SWEEP_SEEDS) {
      const world = careerAt(`corridor-${band}-${seed}`, 0, band)
      for (let w = 200; w < 200 + weeks; w++) {
        asked++
        if (rollFresh(world, w) !== null) hits++
      }
    }
    return hits / asked
  }

  it('⭐ close lands near its 8% and steady near its 4% – a WIDE corridor, not a measurement', () => {
    const close = share('close', 60)
    const steady = share('steady', 60)
    // ⚠ DELIBERATELY WIDE (roughly half to double the table value). This case exists to catch a
    // wiring defect – the wrong band read, the chance inverted, the comparison flipped – and not to
    // measure the design. T11's census bench is what measures it.
    expect(close, `close measured ${close}`).toBeGreaterThan(LIFE.smallTalkPerWeek.close / 2)
    expect(close, `close measured ${close}`).toBeLessThan(LIFE.smallTalkPerWeek.close * 2)
    expect(steady, `steady measured ${steady}`).toBeGreaterThan(LIFE.smallTalkPerWeek.steady / 2)
    expect(steady, `steady measured ${steady}`).toBeLessThan(LIFE.smallTalkPerWeek.steady * 2)
    expect(close, 'and a close home is the busier of the two').toBeGreaterThan(steady)
  })

  it('⭐ and the two silent bands are silent over the same sweep', () => {
    expect(share('strained', 60), 'strained').toBe(0)
    expect(share('cold', 60), 'cold').toBe(0)
  })
})

// =================================================================================================
// F. DETERMINISM – same seed, same week, same verdict
// =================================================================================================
describe('wave 3 T8 F – the verdict is the seed and the week', () => {
  it('⭐ two identical careers agree on every week of a season, and the week is what decides', () => {
    const a = careerAt('determinism', 0, 'close')
    const b = careerAt('determinism', 0, 'close')
    const verdictsA: boolean[] = []
    const verdictsB: boolean[] = []
    for (let w = 200; w < 200 + WEEKS_IN_SEASON; w++) {
      verdictsA.push(rollFresh(a, w) !== null)
      verdictsB.push(rollFresh(b, w) !== null)
    }
    expect(verdictsB, 'same seed, same week, same verdict').toEqual(verdictsA)
    // ⚠ THE ANTI-VACUITY HALF: two lists of 52 identical `false`s would also be equal.
    expect(verdictsA.filter(Boolean).length, 'the season had at least one of them').toBeGreaterThan(0)
    expect(verdictsA.filter((v) => !v).length, 'and at least one week without').toBeGreaterThan(0)
  })

  it('⭐ a different seed is a different career – the key really carries the seed', () => {
    const one = careerAt('determinism-seed-a', 0, 'close')
    const two = careerAt('determinism-seed-b', 0, 'close')
    const a: boolean[] = []
    const b: boolean[] = []
    for (let w = 200; w < 200 + 260; w++) {
      a.push(rollFresh(one, w) !== null)
      b.push(rollFresh(two, w) !== null)
    }
    expect(b, 'two seeds, two lives').not.toEqual(a)
  })
})

// =================================================================================================
// G. THE SUBJECT, THE CARD AND THE POOL – shapes only, never a sentence (invariant 4)
// =================================================================================================
describe('wave 3 T8 G – what she came with, and how the card is assembled', () => {
  it('⭐ what she comes with is her week\'s own register, and the three are three', () => {
    expect(smallTalkSubjectFor('low'), 'a heavy week brings a worry').toBe(EXPECTED_SUBJECT.low)
    expect(smallTalkSubjectFor('bright'), 'a bright week brings something good').toBe(EXPECTED_SUBJECT.bright)
    expect(smallTalkSubjectFor('level'), 'an ordinary week brings the question').toBe(EXPECTED_SUBJECT.level)
    expect(new Set(REGISTERS.map(smallTalkSubjectFor)).size, 'three registers, three subjects').toBe(3)
    expect([...SMALL_TALK_SUBJECTS].sort(), 'and the roster is total').toEqual(
      [...new Set(REGISTERS.map(smallTalkSubjectFor))].sort(),
    )
  })

  it('⭐ the row records the subject her week licensed, on each of the three registers', () => {
    for (const register of REGISTERS) {
      const world = careerAt(`subject-${register}`, 0, 'close', register)
      const week = firstHit(world, 200)
      world.week = week
      world.lifeLog = []
      rollSmallTalk(world)
      const row = lifeLogOf(world)[0]
      expect(row.kind, `${register}: the kind`).toBe('small-talk')
      // ⚠ AGAINST THE LITERAL TABLE AND NOT AGAINST `smallTalkSubjectFor` – see `EXPECTED_SUBJECT`.
      expect(row.detail, `${register}: the subject`).toBe(EXPECTED_SUBJECT[register])
      // ⚠ THE CARD'S FRAME AND HER LINE ARE ABOUT THE SAME SMALL THING – the correspondence the
      // §3c note claims «by construction», asserted rather than assumed.
      const prompt = buildLifeBeatPrompt(world)!
      expect(prompt.heading, `${register}: the frame is the assembler's own`).toBe(
        lifeBeatHeading('small-talk', register, bondBandOf(world.bond!)),
      )
      expect(prompt.said, `${register}: and so is her line`).toBe(
        lifeBeatSaid('small-talk', row.detail, world.temperament!, register, bondBandOf(world.bond!)),
      )
      expect(prompt.listenFollowUp, `${register}: no listen detour on tier 1`).toBeNull()
      expect(prompt.options.map((o) => o.id), `${register}: her parent's three`).toEqual(OPTIONS.map((o) => o.id))
    }
  })

  it('⭐⭐ four voices x three subjects are twelve different lines – no silent fallback between them', () => {
    const lines = TEMPERAMENTS.flatMap((voice) =>
      SMALL_TALK_SUBJECTS.map((subject) => lifeBeatSaid('small-talk', subject, voice, 'level', 'close')),
    )
    expect(new Set(lines).size, 'twelve drafts, none of them shared').toBe(TEMPERAMENTS.length * SMALL_TALK_SUBJECTS.length)
    for (const line of lines) {
      // The two shape rules the week-note pins enforce for the whole corpus.
      expect((line.match(/"/g) ?? []).length, `one quoted span: ${line}`).toBe(2)
      // ⚠ CASE-FOLDED, because every frame in the corpus OPENS with `She` – the rule is that the
      // narration around the quotation names her, not that it does so in lower case.
      // ⚠ `split` AND NOT `slice(0, indexOf('"'))`: a raw `indexOf` slice returns -1 on an absent
      // marker and silently WIDENS to the whole string, which is the defect `npm run pins:check`
      // ratchets against (CLAUDE.md's own gotcha). `split` on a line with no quote yields the line,
      // which is the honest reading here and is caught by the quoted-span count one line up anyway.
      expect(line.split('"')[0].toLowerCase(), `the narration names her: ${line}`).toContain('she')
      expect(line, `no em-dash: ${line}`).not.toContain('—')
    }
  })

  it('⚠ the band decides whether tier 1 happens, never how it sounds', () => {
    // ⚠ THE READING WORTH STATING: unlike `'met'`, this pool has no flat rung, because the beat
    // cannot reach a home that would need one. So her line is the same at every band.
    for (const voice of TEMPERAMENTS) {
      const said = BANDS.map((band) => lifeBeatSaid('small-talk', 'worry', voice, 'level', band))
      expect(new Set(said).size, `${voice}: one line, whatever the band`).toBe(1)
    }
    // ...and the frame follows the Mood ladder instead, which is three different frames.
    const headings = REGISTERS.map((r) => lifeBeatHeading('small-talk', r, 'close'))
    expect(new Set(headings).size, 'a frame per register').toBe(3)
    for (const band of BANDS) {
      expect(lifeBeatHeading('small-talk', 'level', band), `${band}: the bond ladder is not this card's axis`).toBe(
        headings[1],
      )
    }
  })

  it('⚠ a row whose subject is not one of the three is refused rather than guessed', () => {
    expect(() => lifeBeatSaid('small-talk', 'nonsense', 'quiet', 'level', 'close')).toThrow(/no subject/)
    expect(lifeBeatListenFollowUp('small-talk', 'worry', 'quiet', 'close'), 'and there is no detour').toBeNull()
  })

  it('⚠⚠ NO PRICE AND NO CENTS IN ANY WORD THE PLAYER SEES – rule 4, on every line of this step', () => {
    const words = [
      ...TEMPERAMENTS.flatMap((v) => SMALL_TALK_SUBJECTS.map((s) => lifeBeatSaid('small-talk', s, v, 'level', 'close'))),
      ...REGISTERS.map((r) => lifeBeatHeading('small-talk', r, 'close')),
      ...OPTIONS.map((o) => o.label),
    ]
    for (const line of words) {
      expect(line, `a price in: ${line}`).not.toMatch(/[$€£]|\bcents?\b|\bdollars?\b|\d/)
    }
  })
})

// =================================================================================================
// H. ⚠⚠ THE DORMANCY GUARD – TIER 1 IS DECLARED AND DELIBERATELY NEVER RAISED
// =================================================================================================
//
// ⚠⚠ THE OWNER'S RULING, 11.09.2026 – «ВАРИАНТ 3»: THE RAISE REVERTED, THE ENGINE KEPT. Everything
// above this section tests code that is FINISHED and STAYS – the hazard by band, the season cap, the
// subject derivation, the constants, the option table and her eighteen drafted lines. What does not
// ship in this step is the single line in `world/phaseHerWeek.ts` that would RAISE the beat.
//
// WHY, IN THE OWNER'S TERMS. `docs/specs/who-she-is-2026-09.md` §5b's tier table prices tier 1
// «soft – answerable, never lost». The wave-3 brief asked for it «through the standard machinery
// (pause, queue, re-validation)» – which is TIER 2's HARD pause. T8's builder found the drift and
// correctly flagged it, then shipped the pause; and because `bond` starts at 70 (`steady`, a live
// band) the beat fired from week 0 on every career and BLOCKED THE WEEK, breaking 136 walked
// fixtures. A soft beat needs a surface that does not stop the week, and a beat with no surface may
// not be raised at all – which is this step.
//
// ⚠⚠ AND THE STEP THAT TURNS IT BACK ON IS NAMED: T15. The same day, the owner asked for «вариант 2»
// written out in the spec and folded into this wave – §5b's SOFT BLOCK CONCRETIZED amendment, whose
// build order is T15 of the wave-3 brief: a per-kind `blocking` flag, `pendingLifeBeat` narrowed to
// blocking rows, a Home card that opens the SAME dialog, and a 3-week derived TTL. So §H is not
// «tier 1 is cancelled» – it is the interim state held honestly, and T15's own stated fallback if
// the soft path resists («T15 reverts to вариант 3's state without touching T1-T8»).
//
// ⚠ THE SECOND RULING, RECORDED HERE BECAUSE THIS IS WHERE T15 WILL LOOK: NO AGE GATE.
// «She talks at any age» – a child bringing a parent a worry, a joy or a question is natural at any
// age, and tier 1 is TEXTURE rather than part of the romance layer. When it is switched on it must
// NOT inherit the arrival's sixteenth-birthday gate.
//
// ⚠⚠ AND THE SHAPE OF THIS GUARD IS NOT INVENTED – IT IS THE ONE THIS REPO HAS ALREADY PROVEN.
// Wave 1 shipped `ECONOMY.spirit.attachmentLift` declared and not read, deliberately, with a guard
// asserting precisely that (tests/spirit.test.ts); when wave 3's T4 wired it the guard went RED and
// was re-aimed with its ⚠ note. T15 does the same to this one: it is written to fail on exactly that
// commit, and a red here is tier 1 being switched on, not a defect. ⚠ WHAT T15 MUST NOT DO IS DELETE
// IT – the re-aim is «raised through the SOFT path and never through a pause», which is a claim this
// file will still want to make afterwards.
describe('wave 3 T8 H – tier 1 is BUILT AND DORMANT (owner\'s deferral, 11.09)', () => {
  /** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – spirit.test.ts's own reader,
   *  and the same reason: this is a claim about the whole production tree, not about one file. */
  function srcFiles(dir = SRC_ROOT, prefix = ''): [string, string][] {
    const out: [string, string][] = []
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
      else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
    }
    return out
  }

  /** Source with every comment removed – block first, then line. ⚠ LOAD-BEARING HERE: the deferral is
   *  EXPLAINED in prose at the call site and in `ECONOMY.life`, and a pin that tripped on the
   *  explanation would be repaired by deleting the explanation, which is the wrong repair. */
  function codeOnly(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  }

  it('⚠⚠ NO PRODUCTION PATH CALLS THE ROLL – the raise is what was deferred', () => {
    // ⚠⚠ THIS IS THE MUTATION TARGET. Restore `rollSmallTalk(world)` in `world/phaseHerWeek.ts` and
    // this line goes red naming the file (ARM 9 in the ledger at the head of this file). The call
    // text is matched rather than the bare name, because the barrel legitimately re-exports the name
    // and the module legitimately declares it – and neither of those raises a beat.
    const callers = srcFiles()
      .filter(([, text]) => codeOnly(text).includes('rollSmallTalk(world)'))
      .map(([path]) => path)
    expect(callers, 'tier 1 is deferred: no file under src/ may raise it').toEqual([])
    // ...and the half that makes «no caller» a DEFERRAL rather than a deletion: the name reaches
    // exactly two files – the module that declares it, and the barrel that re-exports it.
    const named = srcFiles()
      .filter(([, text]) => /\brollSmallTalk\b/.test(codeOnly(text)))
      .map(([path]) => path)
      // ⚠ SORTED HERE AND NOT AT THE READER: `srcFiles` walks a directory before its sibling FILE
      // (`engine/world/` precedes `engine/world.ts`), which is a fact about `readdirSync` and not
      // about this claim. A pin that encoded the walk order would go red on an unrelated new module.
      .sort()
    expect(named, 'declared and exported, and nothing more').toEqual(['engine/world.ts', 'engine/world/lifeBeat.ts'])
    // ...and it is still a real function with its real constants behind it, inherited whole by the
    // wave that switches it on.
    expect(typeof rollSmallTalk, 'the engine is kept, only its call site is not').toBe('function')
    expect(LIFE.smallTalkPerWeek, 'the hazard table stands').toEqual({ close: 0.08, steady: 0.04, strained: 0, cold: 0 })
    expect(LIFE.smallTalkCapPerSeason, 'and the season cap').toBe(4)
    expect(OPTIONS.length, 'and her parent still has three free replies waiting').toBe(3)
  })

  it('⚠⚠ ...and a WALKED career raises not one `small-talk` row, over a whole season', () => {
    // The behavioural half. `close` is the MOST generous band (8%/wk), re-pinned every week so the
    // engine's own drift cannot quietly walk her out of it – under the raise this is ~4 rows a season
    // and the cap is reached, which is why the arm reddens here loudly rather than probabilistically.
    // ⚠ THE DRAIN STAYS IN THE LOOP: `'met'` still raises and still blocks, and a walk that stopped
    // on it would be measuring the wrong thing.
    for (const seed of ['dormant-1', 'dormant-2', 'dormant-3', 'dormant-4']) {
      const world = createWorld(seed)
      const rng = resumeMain(world.rngMain)
      const close = bondFor('close')
      for (let w = 0; w < WEEKS_IN_SEASON; w++) {
        world.bond = close
        tickWeek(world, rng)
        drainLifeBeats(world)
      }
      const rows = lifeLogOf(world).filter((r) => r.kind === 'small-talk')
      expect(rows, `${seed}: a walked season may not produce tier 1`).toEqual([])
    }
  })

  it('⚠ ...and the walk above really COULD have raised one – the anti-vacuity control', () => {
    // «No rows» is free on a career the beat could never have reached. So the same fixture, at the
    // same band, is handed to the roll DIRECTLY and it raises – which is what makes the case above a
    // statement about the missing call site rather than about a gate that refuses everything.
    const world = createWorld('dormant-1')
    const rng = resumeMain(world.rngMain)
    const close = bondFor('close')
    for (let w = 0; w < WEEKS_IN_SEASON; w++) {
      world.bond = close
      tickWeek(world, rng)
      drainLifeBeats(world)
    }
    expect(lifeLogOf(world).filter((r) => r.kind === 'small-talk'), 'still none after the walk').toEqual([])
    world.bond = close
    expect(smallTalkEligible(world), 'the gate would have said yes on this very world').toBe(true)
    const hit = firstHit(world, world.week)
    world.week = hit
    world.lifeLog = []
    rollSmallTalk(world)
    expect(lifeLogOf(world).map((r) => r.kind), 'called directly, the engine still raises it').toEqual(['small-talk'])
  })
})
