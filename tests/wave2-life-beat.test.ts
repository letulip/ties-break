// =================================================================================================
// WAVE 2 – THE REACTION SURFACE. The beat machinery, the proving beat, and every net's own mutation.
// =================================================================================================
//
// The wave's runbook (docs/plans/wave-2-the-reaction-surface-runbook-2026-09.md) §6, clause by
// clause. Its standing duty – written in after the wave-1 review found mutation-verification
// happening silently – is that EVERY ARM IS RECORDED, in the masseur's «eight arms, eight catches»
// format. So each block below names what was broken and what went red, and the record is here
// rather than in a commit message nobody re-reads:
//
//   ARM  1  `beatBacked: 2` -> `2.5`                     the equality gate, RED (bond 71.5 vs 72)
//   ARM  2  the two answers priced the same (`-2` -> `2`) the equality gate, RED (delta 0, wanted 4)
//   ARM  3  `'life'` moved BELOW `'fork'` in ADVANCE_REFUSALS  the refusal order, RED (life leads)
//   ARM  4  the `pendingLifeBeat` line deleted from `advanceRefusal`  the block, RED (time moved)
//   ARM  5  `answerFork`'s refusal line deleted           the refusal pin, RED (the fork answered)
//   ARM  6  `pendingLifeBeat` returns the LAST unanswered row  the queue, RED (row 2 answered first)
//   ARM  7  `deep`'s `stop`/`low` line = `fiery`'s        the completeness pin, RED (voice collision)
//   ARM  8  the flat pool returned at `steady` bond       the channel pin, RED (her voice lost)
//   ARM  9  `spirit` added to `forkWantWeights`' temperament-free signature – see block F: the FENCE
//           is asserted on the SOURCE, and the arm is a temperament term added to the maths
//   ARM 10  `answerLifeBeat` given an `amountCents`       the no-cents pin, RED (money moved)
//
// ⚠⚠ RE-AIMED TWICE FOR v74 (wave 3, T6 – 11.09), AND BOTH RE-AIMS CARRY THEIR OWN ARM. (a)
// `LIFE_BEAT_OPTIONS` became a `Record<LifeBeatKind, …>`, so every pin here reads `FORK_OPTIONS` –
// see its own note below for what moved and why; wave 2's ARM 1 (`beatBacked` 2 -> 2.5) was RE-RUN
// against the re-aimed file and went RED on four cases, «back / press / listen, as ruled: expected
// [ 2.5, -2, +0 ] to deeply equal [ 2, -2, +0 ]», so the pin bites exactly as it did. (b)
// `walkToFork` now drains beats that are not the fork's, because wave 3 can raise one inside the
// walk – three cases were RED before the drain with «That is not one of the answers this beat
// offered», and `atTheFork`'s own assertion was passing on the wrong row. See `drainOtherBeats`.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It writes no wording of its own and changes none: every string it
// asserts on comes out of the engine's own pools, which are DRAFTS for the owner (invariant 4). The
// shape rules are asserted; the sentences are his.
import { describe, expect, it, vi } from 'vitest'
import {
  advanceWeeks,
  answerFork,
  answerLifeBeat,
  buildBirthdayPrompt,
  buildLifeBeatPrompt,
  chooseGift,
  closeTournament,
  createWorld,
  decideKnock,
  drawForkWant,
  forkWantOf,
  forkWantWeights,
  lifeBeatSaid,
  lifeBeatListenFollowUp,
  lifeLogOf,
  pendingBirthday,
  pendingKnock,
  pendingLifeBeat,
  skipTournament,
  tickWeek,
  ADVANCE_REFUSALS,
  FORK_UNHEARD_REFUSAL,
  FORK_WANTS,
  FORK_WANT_ANSWER,
  LIFE_BEAT_OPTIONS,
  TEMPERAMENTS,
  type ForkWant,
  type WorldState,
} from '../src/engine/world'
import { resumeMain, type Rng } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { SPIRIT_BANDS, bondBandOf, moodRegisterOf, spiritBandOf } from '../src/engine/spirit'
import { engineModuleSource } from './worldSource'
import { region } from './helpers/source'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type BondBand, type LifeBeatKind, type MoodRegister } from '../src/shared/protocol'

// Several blocks walk a real career to its fork (242 weeks). Deterministic but slow, and the suite
// runs many files in parallel – the same generous file-level timeout r2-13 and round11 carry.
vi.setConfig({ testTimeout: 240_000 })

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** A world plus the MAIN generator the WORKER would drive it with. ⚠ `resumeMain(world.rngMain)` and
 *  NOT `rngFromSeed(seed)`: the persisted position only moves when the draws go through the pair on
 *  the world, so a fixture drawing off a detached generator would leave `rngMain.n` at 0 for ever and
 *  every identity in block F would be vacuous. r2-13's own fixture, for its own reason. */
function career(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  return { world, rng: resumeMain(world.rngMain) }
}

/** ⚠⚠ RE-AIMED FOR v74 (wave 3, T6 – 11.09), AND THE RE-AIM IS A REAL FINDING RATHER THAN A TIDY-UP.
 *
 *  WHAT MOVED: wave 3's arrival hazard rolls every eligible week from her sixteenth (week ~104), and
 *  T6 delivers the news on `knownWeek` – so a `'met'` beat can now be raised INSIDE this 242-week
 *  walk, ahead of the fork-opinion row this file is about. `walkToFork` drains reveals and knocks for
 *  exactly that reason and had nothing to drain a beat with, because in wave 2 no beat could fire
 *  before the fork.
 *
 *  WHAT IT COST BEFORE THE FIX, measured: three cases went RED with «That is not one of the answers
 *  this beat offered» – `answerLifeBeat(world, 'back')` was answering a `'met'` row, because the
 *  queue is FIFO and the met row came first. And `atTheFork`'s own «she has said what she wants» was
 *  passing on the WRONG ROW, which is the worse half: the fixture had started lying before anything
 *  failed.
 *
 *  ⚠ THE DRAIN IS BOND-NEUTRAL ON PURPOSE. It answers with the option whose delta is ZERO, so a beat
 *  this file never meant to live cannot move the number every block below measures. Asserted rather
 *  than assumed – `neutralAnswerFor` throws if a kind has no such option, because a silently missing
 *  zero row would make every bond assertion in this file wrong by an unknown amount. */
function neutralAnswerFor(kind: LifeBeatKind): string {
  const free = LIFE_BEAT_OPTIONS[kind].find((o) => o.bond === 0)
  if (!free) throw new Error(`${kind} has no bond-neutral answer – this fixture cannot drain it without moving the number`)
  return free.id
}

/** Tick until the tick that opens the fork – which is the tick that raises her opinion of it. Reveals
 *  are resolved, knocks answered and OTHER KINDS OF BEAT drained on the way, so none of them becomes
 *  the thing under test; the family is kept solvent so a career about the fork is not also a career
 *  about bankruptcy. NOTHING is injected: the fork is the engine's, and so is the row in front of it. */
function walkToFork(world: WorldState, rng: Rng): void {
  for (let i = 0; i < 400 && world.fork === null; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    drainOtherBeats(world)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    world.season = []
  }
  if (pendingKnock(world)) decideKnock(world, 'rest')
  drainOtherBeats(world)
}

/** Every pending beat that is NOT the fork's own, answered neutrally. ⚠ IT STOPS AT A
 *  `'fork-opinion'` ROW – that row is the subject of this file and answering it here would delete
 *  the thing every block below is about. */
function drainOtherBeats(world: WorldState): void {
  for (let guard = 0; guard < 50; guard++) {
    const row = pendingLifeBeat(world)
    if (row === null || row.kind === 'fork-opinion') return
    answerLifeBeat(world, neutralAnswerFor(row.kind))
  }
  throw new Error('a beat queue that will not drain')
}

/** A career standing exactly where wave 2 exists to be measured: the fork is open, her opinion of it
 *  is on the record and unanswered, and nothing else about the week is interesting. */
function atTheFork(seed: string): { world: WorldState; rng: Rng } {
  const c = career(seed)
  walkToFork(c.world, c.rng)
  expect(c.world.fork, `${seed}: the fixture reached its fork`).not.toBeNull()
  expect(c.world.fork!.answer, 'and it is unanswered').toBeNull()
  // ⚠ RE-AIMED (v74): «not null» was true of ANY beat once wave 3 could raise one inside the walk,
  // so the pending row is now named. A `'met'` row standing here would be a fixture about the wrong
  // conversation, and it would pass the old assertion.
  expect(pendingLifeBeat(c.world), 'and she has said what she wants').not.toBeNull()
  expect(pendingLifeBeat(c.world)!.kind, 'and it is HER OPINION OF THE FORK that is waiting').toBe('fork-opinion')
  return c
}

/** ⚠⚠ RE-AIMED FOR v74 (wave 3, T6 – 11.09), AND NOT DELETED, NARROWED OR WEAKENED.
 *
 *  WHAT MOVED: `LIFE_BEAT_OPTIONS` was a FLAT `readonly {id,label,bond}[]` – the wave-2 tree had one
 *  beat kind, so a list and a table were the same object. T6 adds `'met'` and restructures it to
 *  `Record<LifeBeatKind, readonly {…}[]>`.
 *
 *  WHY IT HAD TO: a `'met'` answer set is NOT a fork-opinion answer set. «Tell her we are behind her»
 *  is a sentence about a decision she asked the parent to weigh in on; the `'met'` beat asks nothing
 *  of him, so its four answers are reactions with their own ids, their own labels and their own
 *  deltas. A flat list shared between the two kinds would have offered a girl's «there is someone»
 *  the fork's three buttons – which is exactly the defect the per-kind record makes a compile error.
 *
 *  WHAT THIS FILE ASSERTS IS UNCHANGED. Every pin below reads the FORK'S OWN three, under the same
 *  assertions, in the same order, with the same literals – `back / press / listen` and `[2, -2, 0]`
 *  are still pinned as ruled numbers, and the labels still name no want. The only edit is the one
 *  character of indexing that says WHICH beat's answers a wave-2 pin is about, and TypeScript refuses
 *  the key if the kind is ever renamed, so the re-aim cannot silently point at nothing. The `'met'`
 *  set has its own pins, in `tests/wave3-delivery.test.ts`. */
const FORK_OPTIONS = LIFE_BEAT_OPTIONS['fork-opinion']

/** A world with a beat pending and NOTHING else – no fork, no career walked. For the copy and queue
 *  blocks, where a 242-week walk would buy nothing but minutes. */
function withBeats(seed: string, details: ForkWant[]): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.lifeLog = details.map((detail, i) => ({ week: world.week + i, kind: 'fork-opinion' as const, detail, answer: null }))
  return world
}

// =================================================================================================
// A. THE REVERT-THE-REACTION EQUALITY GATE (§6.1) – the wave's own «done when»
// =================================================================================================
//
// ⚠ AN EQUALITY TEST AND NOT A BENCH. The design says so in as many words: «same seed, answer A vs
// answer B – `bond` differs by exactly the table, deterministically; an equality test, no SEM.» A
// reaction whose effect had to be measured with a standard error would be a reaction the player
// could not feel, which is the opposite of what this wave ships.
describe('wave 2 A – reverting the reaction moves the number by exactly the table', () => {
  it('⭐⭐ back / press / listen land the table\'s own three deltas, and nothing else moves', () => {
    // The three arms are the SAME WORLD, so the only variable is the answer.
    const arms = FORK_OPTIONS.map((option) => {
      const world = withBeats('w2-equality', ['tour'])
      const before = { bond: world.bond, spirit: world.spirit, funds: world.fundsCents }
      answerLifeBeat(world, option.id)
      return { option, world, before }
    })

    for (const { option, world, before } of arms) {
      expect(world.bond - before.bond, `${option.id} is worth exactly its row`).toBe(option.bond)
      // ⚠ AND THE FENCE, ASSERTED ON EVERY ARM: his words move `bond` ALONE. No spirit, no money.
      expect(world.spirit, `${option.id} moves no spirit`).toBe(before.spirit)
      expect(world.fundsCents, `${option.id} moves no money`).toBe(before.funds)
    }

    // ⚠⚠ AND THE TABLE ITSELF IS PINNED AS LITERALS, which the three assertions above deliberately
    // cannot do: they read `option.bond`, so they move WITH a retune and catch a mis-WIRED option
    // rather than a mis-typed constant. These three numbers are RULED (09.09, build plan §3.4 – «his
    // reaction options ... Bond +2 / −2 / 0») and not bench proposals, so a change to one of them is
    // a change to a ruling and has to come through this line.
    expect(FORK_OPTIONS.map((o) => o.bond), 'back / press / listen, as ruled').toEqual([2, -2, 0])
    expect(
      [ECONOMY.bond.delta.forkWithHerWant, ECONOMY.bond.delta.forkAgainstHerWant],
      'and the deed\'s own two, also ruled (§3.5)',
    ).toEqual([3, -4])

    // ...and the GAP between the two opinions is the whole of what «reverting the reaction» means.
    const backed = arms.find((a) => a.option.id === 'back')!
    const pressed = arms.find((a) => a.option.id === 'press')!
    expect(backed.world.bond - pressed.world.bond, 'the same week, answered two ways').toBe(
      ECONOMY.bond.delta.beatBacked - ECONOMY.bond.delta.beatPressed,
    )
    // ARM 1: `beatBacked` 2 -> 2.5 – RED here (`bond` 71.5 against the expected 72).
    // ARM 2: `beatPressed` −2 -> 2 – RED on the gap (0 against the expected 4).
  })

  it('⚠ ...and saying nothing really is nothing – the row a player could otherwise learn to avoid', () => {
    const world = withBeats('w2-listen', ['stop'])
    const before = world.bond
    answerLifeBeat(world, 'listen')
    expect(world.bond, 'listening is a real answer at exactly zero').toBe(before)
    expect(lifeLogOf(world)[0].answer, 'and it is recorded as one').toBe('listen')
  })

  it('⭐⭐ THE DEED IS PRICED SEPARATELY FROM THE WORDS – +3 with her want, −4 against it', () => {
    // «A parent can disagree out loud and then do as she asked» – so the two deltas are measured on
    // the SAME career, in both orders, and neither can be reconstructed from the other.
    const base = atTheFork('w2-deed')
    const want = forkWantOf(base.world)!
    expect(FORK_WANTS, 'she wants one of the three').toContain(want)

    // The four corners: (backed / pressed) x (did as she asked / did not).
    const other = FORK_WANTS.find((w) => w !== want)!
    const corners: { say: string; answer: ForkWant; expected: number }[] = [
      { say: 'back', answer: want, expected: ECONOMY.bond.delta.beatBacked + ECONOMY.bond.delta.forkWithHerWant },
      { say: 'back', answer: other, expected: ECONOMY.bond.delta.beatBacked + ECONOMY.bond.delta.forkAgainstHerWant },
      { say: 'press', answer: want, expected: ECONOMY.bond.delta.beatPressed + ECONOMY.bond.delta.forkWithHerWant },
      { say: 'press', answer: other, expected: ECONOMY.bond.delta.beatPressed + ECONOMY.bond.delta.forkAgainstHerWant },
    ]
    for (const corner of corners) {
      const arm = atTheFork('w2-deed')
      const before = arm.world.bond
      answerLifeBeat(arm.world, corner.say)
      answerFork(arm.world, FORK_WANT_ANSWER[corner.answer])
      expect(arm.world.bond - before, `${corner.say} then ${corner.answer} (she wanted ${want})`).toBe(corner.expected)
    }
    // ⚠ AND THE FOUR ARE FOUR DIFFERENT NUMBERS, which is what «separate on purpose» has to mean:
    // if the words and the deed collapsed into one row, two of these corners would coincide.
    const totals = new Set(corners.map((c) => c.expected))
    expect(totals.size, 'the words and the deed are not one number wearing two names').toBe(4)
  })
})

// =================================================================================================
// B. THE PRECEDENCE PIN (§6.2) – the birthday leads the beat, the beat leads the fork
// =================================================================================================
describe('wave 2 B – where the beat sits, and what that means on a week that is two things', () => {
  it("'life' sits after 'birthday' and before 'fork' in BOTH lists that order a week", () => {
    // ⚠ TWO LISTS, TWO DIFFERENT QUESTIONS, AND THIS WAVE NEEDS THEM TO AGREE. `STOP_PRECEDENCE`
    // orders reasons that all fired on ONE week (round11.test.ts pins the sandwich there);
    // `ADVANCE_REFUSALS` orders the mutually-exclusive states in which the advance will not start,
    // and it is the one that decides WHICH question the shell puts in front of the player when two
    // of them block at once. The fork-opinion beat is raised on the fork's own opening tick, so this
    // pair is live together by construction rather than by coincidence.
    expect(ADVANCE_REFUSALS.indexOf('birthday')).toBeLessThan(ADVANCE_REFUSALS.indexOf('life'))
    expect(ADVANCE_REFUSALS.indexOf('life')).toBeLessThan(ADVANCE_REFUSALS.indexOf('fork'))
    expect(STOP_PRECEDENCE.indexOf('birthday')).toBeLessThan(STOP_PRECEDENCE.indexOf('life'))
    expect(STOP_PRECEDENCE.indexOf('life')).toBeLessThan(STOP_PRECEDENCE.indexOf('fork'))
    // ARM 3: `'life'` moved below `'fork'` in ADVANCE_REFUSALS – RED here.
  })

  it('⭐⭐ A WEEK HOLDING BOTH A BIRTHDAY AND A BEAT SURFACES THE BIRTHDAY FIRST', () => {
    // Both BLOCK, so the week is handed back one question at a time and the ORDER is the whole
    // contract: a birthday is a DATE and cannot be moved, a beat is something she has said and it
    // can wait a week without becoming untrue.
    //
    // ⚠ THE BIRTHDAY IS THE ENGINE'S – walked to, not injected (r2-13's own recipe: the default
    // profile is born 15 June and her first birthday is marked in week 23).
    const { world, rng } = career('w2-collision')
    // ⚠⚠ RE-AIMED FOR v74 (wave 3, T8 – 11.09), AND THE FIXTURE MOVED, NOT THE ASSERTION. This walk
    // was a bare `tickWeek` loop, which was complete while no beat could fire before the fork at
    // week ~241. T8 raises tier-1 small talk from week 0 at up to 8%/wk, so `'life'` was already
    // pending when the advance below ran and `advanceWeeks` refused at ENTRY – the case read
    // `['life']` for a beat that has nothing to do with what it is about. `drainOtherBeats` is this
    // file's own answer to exactly that (it is what `walkToFork` does, and what T6 added for the
    // `'met'` row); it stops at a `'fork-opinion'` row, so the subject of this file is untouched.
    while (world.week < 22) {
      drainOtherBeats(world)
      tickWeek(world, rng)
    }
    drainOtherBeats(world)
    expect(advanceWeeks(world, rng, 1), 'the tick reaches her birthday').toEqual(['birthday'])
    expect(pendingBirthday(world), 'and the question is up').not.toBeNull()

    // ...and now she says something in the same week. One row, unanswered.
    world.lifeLog.push({ week: world.week, kind: 'fork-opinion', detail: 'tour', answer: null })
    expect(pendingLifeBeat(world), 'the week is now two questions').not.toBeNull()

    // THE ASSERTION: the birthday is what the advance names, and no week is bought.
    const before = world.week
    expect(advanceWeeks(world, rng, 4), 'the birthday leads').toEqual(['birthday'])
    expect(world.week, 'and nothing ticked behind either of them').toBe(before)

    // ⚠ AND THE SECOND QUESTION IS GENUINELY STILL WAITING, which is what makes «leads» an ordering
    // rather than a swallow: the birthday did not answer her by being answered first.
    expect(pendingLifeBeat(world), 'her row is untouched under the birthday').not.toBeNull()

    // Answer the birthday through the engine's own command, and the beat is what is left standing.
    chooseGift(world, buildBirthdayPrompt(world)!.options[0].id)
    expect(pendingBirthday(world), 'the birthday is answered').toBeNull()
    expect(advanceWeeks(world, rng, 4), 'and now she is the reason').toEqual(['life'])
    expect(world.week, 'still nothing ticked').toBe(before)

    // Answer her, and time moves again.
    answerLifeBeat(world, 'listen')
    advanceWeeks(world, rng, 1)
    expect(world.week, 'a week was finally bought').toBeGreaterThan(before)
  })
})

// =================================================================================================
// C. THE REFUSAL PIN (§6.3) – he hears her out first, and the ENGINE is what says so
// =================================================================================================
describe('wave 2 C – `answerFork` refuses while her row is unanswered', () => {
  it('⭐⭐⭐ the most expensive click in the game will not run until she has been answered', () => {
    const { world } = atTheFork('w2-refusal')
    // THE REFUSAL, with its own sentence – pinned through the exported constant and not a spelling,
    // on `COLLEGE_REVEAL_REFUSAL`'s precedent.
    expect(() => answerFork(world, 'continue')).toThrow(FORK_UNHEARD_REFUSAL)
    expect(() => answerFork(world, 'college')).toThrow(FORK_UNHEARD_REFUSAL)
    expect(() => answerFork(world, 'stop')).toThrow(FORK_UNHEARD_REFUSAL)
    expect(world.fork!.answer, 'and not one of the three got through').toBeNull()
    // ⚠ THE CAREER IS UNTOUCHED BY A REFUSED COMMAND: no route resolved, no bond moved.
    expect(world.ageCurve, 'the route was not decided behind her back').toBeUndefined()

    // ...and answering the beat UNLOCKS it. One command, and the fork takes an answer.
    answerLifeBeat(world, 'listen')
    expect(() => answerFork(world, 'continue')).not.toThrow()
    expect(world.fork!.answer, 'the fork is answered').toBe('continue')
    // ARM 5: the refusal line deleted from `answerFork` – RED here (the first `toThrow` passes
    // nothing and `world.fork.answer` reads 'continue' three assertions early).
  })

  it('⚠ ...and the block is the engine\'s, not the dialog\'s – no week ticks past her either', () => {
    const { world, rng } = atTheFork('w2-refusal-block')
    const before = world.week
    // ⚠ BOTH REASONS ARE LIVE ON THIS WEEK BY CONSTRUCTION (the fork's opening tick raises her row),
    // and the refusal names the one the player must answer FIRST.
    expect(advanceWeeks(world, rng, 4), 'she is the reason, not the fork').toEqual(['life'])
    expect(world.week, 'zero ticks – a refusal, not a halt').toBe(before)
    answerLifeBeat(world, 'back')
    // ⚠⚠ RE-AIMED BY v74 T17 (11.09), NOT WEAKENED – and the ⚠ note names exactly what moved. When
    // the want she stated is `'stop'`, answering her raises `'fork-counsel'` (the coach's read,
    // blocking), which is ALSO a `'life'` reason – so on a stopping career this line read `['life']`
    // a second time. The claim of this case is «the block is the ENGINE'S, not the dialog's», i.e.
    // that nothing ticks past a life row, and that claim is unchanged: the life queue is walked to
    // its end and the fork is what is left standing. ⚠ ON A `college` OR `tour` WANT THIS HELPER DOES
    // NOTHING AT ALL and the line below reads precisely as it did before T17, which is the ruling's
    // own boundary. ⚠ It is also `drainOtherBeats`, the file's existing helper, so the bond-neutral
    // rule is not re-typed here.
    drainOtherBeats(world)
    expect(advanceWeeks(world, rng, 4), 'and now the fork is').toEqual(['fork'])
    expect(world.week, 'still zero ticks').toBe(before)
    // ARM 4: the `pendingLifeBeat` line deleted from `advanceRefusal` – RED here (the first
    // `advanceWeeks` returns ['fork'] and her row is stepped past in silence).
  })

  it('⚠ a career whose fork was raised before v73 answers it with nothing standing in front', () => {
    // The migration's own promise, asserted: it back-fills `[]` and invents no opinion, so a career
    // already holding an open fork is refused nothing and charged no congruence delta – «nobody
    // asked her, so nobody can have overruled her».
    const { world } = atTheFork('w2-legacy')
    world.lifeLog = []
    const before = world.bond
    expect(() => answerFork(world, 'stop')).not.toThrow()
    expect(world.bond, 'no congruence delta with an opinion nobody has').toBe(before)
  })
})

// =================================================================================================
// D. THE QUEUE PIN (§6.4) – two rows resolve one at a time, in order, none lost
// =================================================================================================
describe('wave 2 D – the record IS the queue', () => {
  it('⭐⭐ two pending rows are answered one dialog at a time, in lifeLog order', () => {
    const world = withBeats('w2-queue', ['college', 'stop'])
    expect(lifeLogOf(world).length, 'two rows are waiting').toBe(2)

    // The dialog asks about the FIRST of them, and says so in the copy it hands over.
    const first = buildLifeBeatPrompt(world)!
    expect(first.week, 'the first row is the one on screen').toBe(lifeLogOf(world)[0].week)
    expect(first.said, 'and it is the first row\'s want being spoken').toBe(
      lifeBeatSaid('fork-opinion', 'college', world.temperament, moodRegisterOf(spiritBandOf(world.spirit)), bondBandOf(world.bond)),
    )

    answerLifeBeat(world, 'back')
    expect(lifeLogOf(world)[0].answer, 'the first row took the answer').toBe('back')
    expect(lifeLogOf(world)[1].answer, 'and the second is untouched').toBeNull()

    // ...and the SECOND is now the one on screen. Nothing was lost and nothing was merged.
    const second = buildLifeBeatPrompt(world)!
    expect(second.week, 'the queue advanced by exactly one').toBe(lifeLogOf(world)[1].week)
    answerLifeBeat(world, 'press')
    // ⚠⚠ RE-AIMED BY v74 T17 (11.09), NOT WEAKENED. The second row here is a `'stop'`, so answering
    // it raises the coach's counsel BEHIND it – a third row, unanswered, by design. The claim is
    // «two pending rows are answered one at a time, in lifeLog order, and none is lost», and it is
    // asserted on HER TWO ROWS rather than on the whole log, which is what the claim was always
    // about. The counsel is then named explicitly, so a row appearing here can never be a silent
    // extra.
    expect(
      lifeLogOf(world).filter((r) => r.kind === 'fork-opinion').map((r) => r.answer),
      'both answered, in the order they were raised',
    ).toEqual(['back', 'press'])
    expect(lifeLogOf(world).map((r) => r.kind), '...and the third row is the counsel T17 raises on a stop').toEqual([
      'fork-opinion',
      'fork-opinion',
      'fork-counsel',
    ])
    drainOtherBeats(world)
    expect(buildLifeBeatPrompt(world), 'and the queue is empty').toBeNull()
    expect(pendingLifeBeat(world)).toBeNull()
    // ARM 6: `pendingLifeBeat` re-pointed at the LAST unanswered row – RED here (the answers come
    // back as [null, 'back'] and the first row is answered second).
  })

  it('⚠ an option the beat never offered is refused engine-side, and the row stays pending', () => {
    const world = withBeats('w2-stale', ['tour'])
    expect(() => answerLifeBeat(world, 'shout')).toThrow(/not one of the answers/)
    expect(pendingLifeBeat(world), 'a stale dialog cannot clear a row').not.toBeNull()
    expect(() => answerLifeBeat(world, '')).toThrow()
  })

  it('⚠ answering when nothing is waiting is an error, not a silent no-op', () => {
    const world = createWorld('w2-empty', DEFAULT_PROFILE)
    expect(() => answerLifeBeat(world, 'back')).toThrow(/No life beat is waiting/)
  })

  it('⚠⚠ AN ANSWER IS NEVER A PURCHASE – no `amountCents`, no price, no line in Money', () => {
    const world = withBeats('w2-no-cents', ['tour'])
    const before = world.fundsCents
    const weeksBefore = world.financeWeeks.length
    answerLifeBeat(world, 'back')
    expect(world.fundsCents, 'the wallet is untouched').toBe(before)
    expect(world.financeWeeks.length, 'and nothing folded into the ledger').toBe(weeksBefore)
    const row = world.events[world.events.length - 1]
    expect(row.amountCents, 'the event carries no amount at all').toBeUndefined()
    // ...and no price in the WORDS either, which is the half a missing field cannot guarantee.
    expect(row.text, row.text).not.toMatch(/\$|\d/)
    // ARM 10: `addEvent(..., { amountCents: -1 })` in `answerLifeBeat` – RED here on three lines.
  })
})

// =================================================================================================
// E. THE VOICE PINS (§6.5) – kind x temperament x register completeness, and the two shape rules
// =================================================================================================
//
// ⚠ THE SHAPE RULES ARE THE WEEK NOTES' OWN, extended to this wave's pools (voice bibles, «How she
// speaks»). They are re-stated here rather than imported because tests/week-notes.test.ts holds them
// as local constants; the two spellings are checked against each other by neither, and the rules are
// four lines long.
const ONE_SPAN = /"[^"]*"/g
const narrationOf = (t: string): string => t.replace(ONE_SPAN, ' ')

describe('wave 2 E – her voice at the beat', () => {
  /** Every line the beat can ever print, with the reading that produced it. */
  const everyLine: { line: string; where: string }[] = []
  for (const voice of TEMPERAMENTS) {
    for (const want of FORK_WANTS) {
      for (const band of SPIRIT_BANDS) {
        for (const bond of ['close', 'steady', 'strained', 'cold'] as BondBand[]) {
          everyLine.push({
            line: lifeBeatSaid('fork-opinion', want, voice, moodRegisterOf(band), bond),
            where: `${voice}/${want}/${band}/${bond}`,
          })
        }
      }
      // 10.09 – the continuations walk the same sweeps: same journal, same shape rules, same
      // dash/Cyrillic/number law. Their own completeness and null-halves are the dedicated case.
      const continued = lifeBeatListenFollowUp('fork-opinion', want, voice, 'close')
      if (continued !== null) everyLine.push({ line: continued, where: `${voice}/${want}/continuation` })
    }
  }

  it('⭐⭐ COMPLETENESS: every kind x temperament x register x want has a line of its own', () => {
    // §5b's line item 3, verbatim: «a test walking beatKind x temperament x register that FAILS on a
    // missing variant, so a `quiet` girl can never silently receive a `fiery` girl's line as a
    // fallback.» The walk is above; this asserts what it found.
    for (const { line, where } of everyLine) expect(line.length, where).toBeGreaterThan(0)

    // ⚠⚠ AND NO VOICE MAY BORROW ANOTHER'S LINE. At `close`/`steady` the four temperaments must be
    // four different sentences for the same want and the same register – a collision here is exactly
    // the silent fallback the pin exists to forbid.
    for (const want of FORK_WANTS) {
      for (const register of ['bright', 'level', 'low'] as MoodRegister[]) {
        const spoken = TEMPERAMENTS.map((v) => lifeBeatSaid('fork-opinion', want, v, register, 'close'))
        expect(new Set(spoken).size, `${want}/${register}: four voices, four lines`).toBe(TEMPERAMENTS.length)
      }
    }
    // ARM 7: `deep`'s `stop`/`low` line replaced with `fiery`'s – RED here (3 of 4 unique).
  })

  it('⭐⭐ THE FLAT POOL IS THE ONE LEGAL SHARED FALLBACK, AND ONLY AT strained/cold', () => {
    // «At a `strained` or `cold` bond the four voices collapse into one shared pool ... the point is
    // that the player cannot tell which of the four voices this is any more.» Both halves are asserted
    // – that it collapses there, and that it does NOT collapse anywhere else.
    for (const want of FORK_WANTS) {
      for (const register of ['bright', 'level', 'low'] as MoodRegister[]) {
        for (const closed of ['strained', 'cold'] as BondBand[]) {
          const flat = TEMPERAMENTS.map((v) => lifeBeatSaid('fork-opinion', want, v, register, closed))
          expect(new Set(flat).size, `${want}/${register}/${closed}: one voice, or none`).toBe(1)
        }
        // ...and the same reading at a home that is not closed is HERS.
        const open = lifeBeatSaid('fork-opinion', want, 'quiet', register, 'steady')
        expect(open, `${want}/${register}: a steady home still hears her`).not.toBe(
          lifeBeatSaid('fork-opinion', want, 'quiet', register, 'strained'),
        )
      }
    }
    // ⚠ AND THE FLAT LINE IS SHORTER THAN THE VOICE IT REPLACES, which is the loss made measurable:
    // «one to four words, then the parent's own sentence carries the rest».
    for (const want of FORK_WANTS) {
      const hers = lifeBeatSaid('fork-opinion', want, 'sunny', 'level', 'close')
      const flat = lifeBeatSaid('fork-opinion', want, 'sunny', 'level', 'cold')
      expect(quotedSpanOf(flat).length, `${want}: what she says at a cold home`).toBeLessThan(quotedSpanOf(hers).length)
    }
    // ARM 8: `speaksInHerOwnVoice` returning true for 'strained' – RED here (four lines, not one).
  })

  it('⚠ SHAPE RULE 1: at most ONE quoted span per line, or the strip below is unsafe', () => {
    for (const { line, where } of everyLine) expect((line.match(ONE_SPAN) ?? []).length, where).toBeLessThanOrEqual(1)
  })

  it('⚠ SHAPE RULE 2: the narration outside her quotation names her', () => {
    for (const { line, where } of everyLine) {
      expect((line.match(ONE_SPAN) ?? []).length, `${where}: she really does speak`).toBe(1)
      expect(narrationOf(line), where).toMatch(/\bshe\b/i)
    }
  })

  it('⚠ the narration stays the parent\'s journal – third person, no address, no first person', () => {
    for (const { line, where } of everyLine) {
      const narration = narrationOf(line)
      expect(narration, where).not.toMatch(/(?<!-)\byou\b/i)
      expect(narration, where).not.toMatch(/(?<!-)\byour\b/i)
      expect(narration, where).not.toMatch(/\bI\b/)
      expect(narration, where).not.toMatch(/\bme\b/i)
      expect(narration, where).not.toMatch(/\bmine\b/i)
      expect(narration, where).not.toMatch(/\bwe\b/i)
    }
  })

  it('⚠ ...and the strip is load-bearing – she really does speak in the first person inside it', () => {
    const firstPerson = everyLine.filter(({ line }) => /\bI\b|\bmy\b/.test(quotedSpanOf(line)))
    expect(firstPerson.length, 'if no line used a first person, the rules above would prove nothing').toBeGreaterThan(10)
  })

  it('⭐⭐ 10.09 – LISTENING EARNS MORE OF HER: the continuation pool, complete, hers, closed to a closed home', () => {
    // The owner's editorial ruling made mechanical: «Say nothing, and let her talk» must be
    // followed by her actually talking – in HER voice, so the pool walks like the first one, and
    // NEVER at strained/cold, because the flat pool's silence staying silent is that pool's point.
    const seen: string[] = []
    for (const want of FORK_WANTS) {
      const four = TEMPERAMENTS.map((v) => lifeBeatListenFollowUp('fork-opinion', want, v, 'close'))
      for (const [i, line] of four.entries()) {
        const where = `${TEMPERAMENTS[i]}/${want} continuation`
        expect(line, where).not.toBeNull()
        expect((line!.match(ONE_SPAN) ?? []).length, where).toBe(1)
        expect(narrationOf(line!), where).toMatch(/\bshe\b/i)
        seen.push(line!)
      }
      expect(new Set(four).size, `${want}: four voices, four continuations`).toBe(TEMPERAMENTS.length)
      for (const closed of ['strained', 'cold'] as BondBand[]) {
        expect(
          lifeBeatListenFollowUp('fork-opinion', want, 'sunny', closed),
          `${want}/${closed}: the silence stays silent`,
        ).toBeNull()
      }
      expect(
        lifeBeatListenFollowUp('fork-opinion', want, 'quiet', 'steady'),
        `${want}: a steady home still hears her`,
      ).not.toBeNull()
    }
    // The corpus rules hold here too: short dash only, no Cyrillic, no number in any word of hers.
    for (const t of seen) {
      expect(t).not.toMatch(/—/)
      expect(t).not.toMatch(/[Ѐ-ӿ]/)
      expect(t).not.toMatch(/\d/)
    }
    // ...and the engine's binding for the detour exists: the option the continuation hangs off.
    expect(FORK_OPTIONS.some((o) => o.id === 'listen'), 'the listen option the prompt binds to').toBe(true)
    // ARM 13: quiet/stop continuation replaced with fiery's – RED (four voices, four continuations).
    // ARM 14: `speaksInHerOwnVoice` ignored by the follow-up – RED (the silence stays silent).
  })

  it('short dash only, no Cyrillic, and no number anywhere in any word the beat prints', () => {
    const everyWord = [
      ...everyLine.map((l) => l.line),
      ...FORK_OPTIONS.map((o) => o.label),
      ...everyHeading(),
    ]
    for (const t of everyWord) {
      expect(t, t).not.toContain('—')
      expect(t, t).not.toMatch(/[Ѐ-ӿ]/)
      // ⚠ THE DIALOG NEVER EXPOSES A NUMBER (the wave's fence): no bond meter grows a first pixel
      // here, and no price either.
      expect(t, t).not.toMatch(/\d|\$/)
    }
  })

  it('⚠ the three option labels are RESPONSES and never her choices', () => {
    // The shape the design fixed: back her want / press the other way / listen and say nothing. The
    // labels name no want, so a button can never become a second way of reading her answer off the
    // screen – and «press the other way» stays honest when there are two other ways.
    expect(FORK_OPTIONS.map((o) => o.id)).toEqual(['back', 'press', 'listen'])
    for (const option of FORK_OPTIONS) {
      expect(option.label.length, option.id).toBeGreaterThan(0)
      for (const want of ['college', 'tour', 'stop']) {
        expect(option.label.toLowerCase(), `${option.id} names no want`).not.toContain(want)
      }
    }
    expect(new Set(FORK_OPTIONS.map((o) => o.label)).size, 'three different sentences').toBe(3)
  })
})

/** The quotation itself – what she actually said, with the parent's frame taken off. */
function quotedSpanOf(line: string): string {
  return (line.match(ONE_SPAN) ?? [''])[0]
}

/** Every heading the beat can print, read THROUGH the engine rather than re-listed here – one per
 *  Mood register, since the heading is the parent's frame and carries his reading of the week. */
function everyHeading(): string[] {
  return SPIRIT_BANDS.map((band) => {
    const world = withBeats(`w2-heading-${band}`, ['tour'])
    // The lowest spirit that still reads as this band, found by asking the ladder rather than by
    // re-deriving its cut points – `spiritBandOf` is the ONE reader of them.
    for (let s = 0; s <= 100; s += 0.1) {
      if (spiritBandOf(Math.round(s * 10) / 10) === band) {
        world.spirit = Math.round(s * 10) / 10
        break
      }
    }
    return buildLifeBeatPrompt(world)!.heading
  })
}

// =================================================================================================
// G. THE SCHEMA MOVE (§4) – the three-part law, on this wave's own rung
// =================================================================================================
describe('wave 2 G – v73, the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    // ⚠ RE-AIMED AT v74 (11.09, the private life's wave 3 took the next rung – `loveEpisodes`), NOT
    // LOOSENED, and on `tests/spirit.test.ts`'s own precedent one version down, verbatim. This case
    // is about v73's OWN RUNG – that the move happened and left a fixture of ITS OWN SHAPE behind –
    // and never about the ladder's head, which moves with every wave. So the head is asserted as a
    // FLOOR and the two claims that actually belong to this rung (the fixture says 73, and it carries
    // the key 73 added) are asserted exactly as before. The head's own guard – «a bump forces a new
    // golden save» – lives in tests/goldenSaves.test.ts and is the only place that should ever name a
    // number that changes.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(73)
    const v73 = JSON.parse(readFileSync(`${SAVES}/v73.json`, 'utf8'))
    expect(v73.schemaVersion).toBe(73)
    expect(v73.lifeLog, 'and the fixture carries the key this version added').toEqual([])
  })

  it('⭐⭐ back-fills an EMPTY life, which is exactly true rather than a bargain with a pruned log', () => {
    const v72 = JSON.parse(readFileSync(`${SAVES}/v72.json`, 'utf8'))
    expect(v72.lifeLog, 'the older shape genuinely has no such key').toBeUndefined()
    const migrated = migrateSave(JSON.parse(JSON.stringify(v72)))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.lifeLog, 'a career that predates the layer has lived no beats').toEqual([])
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here.
    //
    // ⚠⚠ RE-AIMED AT v74 (11.09, wave 3's `loveEpisodes`), NOT WEAKENED, AND THIS ONE HAD TO BE –
    // `migrateSave` always walks to the LADDER'S HEAD, so the moment the head moved past 73 the
    // migrated payload stopped being a v73 save and the direct equality could never hold again. The
    // claim is unchanged and is made where it stays true: the v73 FIXTURE and the migrated v72
    // CONVERGE at the head, byte for byte, which is «the fixture is the migration's own output»
    // carried one rung forward. A hand edit to either file still goes red here, which is the whole
    // point of the line; v73's own shape is pinned by the case above (`schemaVersion` 73, `lifeLog`
    // present), and v74's own «produced by the real migration» equality lives at its own rung in
    // tests/wave3-love-episodes.test.ts.
    expect(migrateSave(JSON.parse(readFileSync(`${SAVES}/v73.json`, 'utf8')))).toEqual(migrated)
  })

  it('is idempotent, and never overwrites a life a save already has', () => {
    const v72 = JSON.parse(readFileSync(`${SAVES}/v72.json`, 'utf8'))
    const once = migrateSave(JSON.parse(JSON.stringify(v72)))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // ⚠⚠ THE EXPECTATION IS FROZEN BEFORE THE CALL, and that is the entire point of these two lines.
    // Written the obvious way – `expect(migrateSave(lived).lifeLog).toEqual(lived.lifeLog)` – this case
    // CANNOT FAIL: `migrateSave` mutates its payload in place, so both sides of the comparison are the
    // same object and the assertion compares it with itself. It shipped that way with wave 2 and was
    // caught on 11.09 when wave 3's builder wrote the identical shape one rung up and its mutation arm
    // (the step's `??=` rewritten as `=`) came back GREEN. Copying the rows first is what gives the
    // assertion something the migration cannot reach.
    // ⚠ THE HOUSE LAW THIS IS AN INSTANCE OF: an assertion about something being PRESERVED must hold a
    // copy the code under test cannot touch – the sibling of «a negative assertion must first prove its
    // target exists», which cost two vacuous guards in wave 2.
    const kept = [{ week: 9, kind: 'fork-opinion', detail: 'stop', answer: 'back' }]
    const lived = { ...JSON.parse(JSON.stringify(v72)), schemaVersion: 72, lifeLog: JSON.parse(JSON.stringify(kept)) }
    expect(migrateSave(lived).lifeLog, 'a life already on the record is kept whole').toEqual(kept)
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    const v72 = JSON.parse(readFileSync(`${SAVES}/v72.json`, 'utf8'))
    const before = JSON.stringify(v72.rngMain)
    expect(JSON.stringify(migrateSave(JSON.parse(JSON.stringify(v72))).rngMain)).toBe(before)
  })
})

// =================================================================================================
// F. INPUT-INDEPENDENCE (§6.6) – ⚠⚠ INVARIANT 2's STRONGEST FORM, AND IT IS NOT OPTIONAL
// =================================================================================================
describe('wave 2 F – the player\'s answer may never move the world\'s dice', () => {
  it('⭐⭐⭐ a career that answers every beat and one that never does draw the IDENTICAL MAIN sequence', () => {
    // THE LAW, over the surface this wave adds. Two arms on one seed, walked identically to the
    // fork; one of them then answers her and plays on, the other is left standing at the stop.
    const answered = atTheFork('w2-independence')
    const untouched = atTheFork('w2-independence')
    expect(JSON.stringify(answered.world), 'the two arms start identical').toBe(JSON.stringify(untouched.world))
    expect(answered.world.rngMain.n, 'and they really drew on MAIN getting here').toBeGreaterThan(0)

    // ⚠ THE WANT IS BYTE-STABLE ACROSS BOTH, which is the half the stream identity cannot show: it is
    // drawn on `seed:life:fork:<seasonIndex>` – (seed, calendar) and never a choice – so the arm that
    // is about to be played differently was already going to want the same thing.
    expect(forkWantOf(answered.world), 'the same girl wants the same thing').toBe(forkWantOf(untouched.world))

    // Answering costs NOTHING on MAIN – the answer is arithmetic and a row.
    const atTheStop = { ...answered.world.rngMain }
    answerLifeBeat(answered.world, 'back')
    answerFork(answered.world, 'continue')
    expect(answered.world.rngMain, 'no answer takes a MAIN draw').toEqual(atTheStop)
    expect(untouched.world.rngMain, 'and the arm left standing is where it was').toEqual(atTheStop)

    // ...and the two arms diverge in exactly the places a decision is allowed to reach, and nowhere
    // else. `ageCurve` is `answerFork`'s own write and rides on its own sub-stream (`seed:decline`).
    const keyOf = (w: WorldState, k: string): string => JSON.stringify((w as unknown as Record<string, unknown>)[k])
    const differences = Object.keys(answered.world).filter((k) => keyOf(answered.world, k) !== keyOf(untouched.world, k))
    expect(differences.sort(), 'a decision moves the record, the standing and the route – nothing else').toEqual(
      ['ageCurve', 'bond', 'events', 'fork', 'lifeLog', 'nextEventId'].sort(),
    )
  })

  it('⭐⭐ ...and the same holds between two DIFFERENT answers, played on for a season', () => {
    // The stronger arm: both careers are played, and only the answer differs. If a reaction could
    // re-roll the world, this is where it would show.
    const backed = atTheFork('w2-independence-2')
    const pressed = atTheFork('w2-independence-2')
    answerLifeBeat(backed.world, 'back')
    answerFork(backed.world, 'continue')
    answerLifeBeat(pressed.world, 'press')
    answerFork(pressed.world, 'continue')
    for (let i = 0; i < 8; i++) {
      advanceWeeks(backed.world, backed.rng, 1)
      advanceWeeks(pressed.world, pressed.rng, 1)
    }
    expect(backed.world.week, 'both arms spent the same weeks').toBe(pressed.world.week)
    expect(backed.world.rngMain, 'the register AND the draw count are the same either way').toEqual(pressed.world.rngMain)
    expect(backed.world.results, 'so she played the same tennis against the same field').toEqual(pressed.world.results)
    expect(backed.world.bond, 'and the only thing that differs is what he said').not.toBe(pressed.world.bond)
  })

  it('⚠⚠ THE FENCE: temperament is not a term in the want\'s weighting, and cannot become one', () => {
    // who-she-is §3, verbatim: «No fork want. Her college/tour want at the fork stays on its own draw
    // – temperament colours HOW she says it, never WHAT she wants. Otherwise temperament becomes a
    // career script.»
    //
    // ⚠⚠ THIS IS ASSERTED THREE WAYS, because the interesting failure is a term ADDED LATER and a
    // behavioural check alone would only catch it if the seed happened to flip.
    //
    // 1. BEHAVIOURAL: the same reading gives the same weights, whoever she is. There is no
    //    temperament argument to vary, which is the point – the walk below varies the girl by
    //    varying nothing, and gets one answer.
    const weights = forkWantWeights(0.5, 70, 70)
    expect(Object.keys(weights).sort()).toEqual([...FORK_WANTS].sort())

    // 2. THE DRAW IS (seed, season, standing, spirit, bond) AND NOTHING ELSE. Two worlds with the
    //    same seed and the same three readings want the same thing whatever their birth trait is –
    //    asserted over all four temperaments, since `drawForkWant` cannot even be handed one.
    const wanted = TEMPERAMENTS.map(() => drawForkWant('w2-fence', 4, 0.5, 70, 70))
    expect(new Set(wanted).size, 'one seed, one season, one reading – one want').toBe(1)

    // 3. SOURCE: the maths half of this module names no temperament at all. A term added to the
    //    weighting has to come through this line.
    // ⚠ THROUGH `region` AND NEVER A RAW `indexOf` SLICE: a raw slice does not fail when a marker
    // rots – `indexOf` returns −1, the region silently WIDENS to almost the whole file, and a pin
    // that then reads the copy table would pass on `sunny` alone. `region` throws on either marker.
    // ⚠⚠ THE END MARKER MOVED IN v74 T17 (11.09) AND THE REGION IS NARROWER, NOT WEAKER. T17 put
    // `forkStopDriverOf` between the weights and `forkStandingOf`, so the old span swallowed it – and
    // the pin is a SUBSTRING check, which made the word «quietly» in the driver's own doc comment a
    // temperament hit («quiet»). The region now ends at the driver's type declaration, so it is
    // exactly the weighting function, which is what the claim was always about; the driver is swept
    // by its own region directly below, so nothing lost cover.
    const source = engineModuleSource('world/lifeBeat')
    const maths = region(source, 'export function forkWantWeights', 'export type ForkStopDriver')
    expect(maths.length, 'the region really was cut').toBeGreaterThan(100)
    expect(maths, 'and it is the maths half, not the copy half').not.toContain('HER_LINE')
    for (const trait of [...TEMPERAMENTS, 'temperament', 'Temperament']) {
      expect(maths, `the want's maths names no ${trait}`).not.toContain(trait)
    }
    // ARM 9: `temperament === 'fiery' ? 2 : 1` folded into `forkWantWeights` – RED on 3.

    // 4. ⭐⭐⭐ v74 T17 – AND THE SAME CUT OVER THE DRIVER, which is the fence one level in. The driver
    //    is derived from spirit and bond alone and is spent on WORDING; a temperament term in it
    //    would not script her career, but a temperament term is not what it reads, and the wall is
    //    worth having on both halves of a function pair that share their inputs.
    const driver = region(source, 'export function forkStopDriverOf', 'const DRIVER_TOTAL')
    expect(driver.length, 'the driver region really was cut').toBeGreaterThan(50)
    for (const trait of [...TEMPERAMENTS, 'temperament', 'Temperament']) {
      expect(driver, `the driver names no ${trait} either`).not.toContain(trait)
    }
  })

  it('⚠ the three leans point the ruled way – worn leans stop, close dares more, standing wants the tour', () => {
    // The RULING of 09.09, asserted as three inequalities rather than as three numbers, so the bench
    // may retune `FORK_WANT_TILT` without this going red for the wrong reason.
    const flat = forkWantWeights(0.5, ECONOMY.spirit.baseline, ECONOMY.bond.start)
    expect(forkWantWeights(0.5, 20, ECONOMY.bond.start).stop, 'a worn-down girl leans stop').toBeGreaterThan(flat.stop)
    expect(forkWantWeights(0.5, ECONOMY.spirit.baseline, 95).tour, 'a close one dares more').toBeGreaterThan(flat.tour)
    expect(forkWantWeights(1, 70, 70).tour, 'a girl who climbed wants the tour').toBeGreaterThan(flat.tour)
    expect(forkWantWeights(0, 70, 70).college, '...and one who did not wants the place').toBeGreaterThan(flat.college)
    // ⚠ AND NO READING EVER DRIVES A WANT TO ZERO – every want stays common for every girl, which is
    // the anti-stereotype guard §3 asks for, applied to a want.
    //
    // ⚠⚠ RE-AIMED BY v74 T17 (11.09) FROM `>= 1` TO `> 0`, AND THE RULING IS WHAT MOVED, NOT THE
    // BAR'S INTENT. The claim this sweep makes is «no reading drives a want to zero», and it is
    // unchanged. What is gone is the accident that used to carry it: `stop` was `lean(worn)` and
    // every lean floors at 1.0, so P(stop) could never fall below ~22% at ANY state – the owner met
    // exactly that in play, at eighteen, on a healthy girl in a close home. `stop` is now
    // `ECONOMY.life.forkStop.floor + …`, whose floor is ε > 0 and never zero: the Barty tail stays a
    // feature and is priced for an eighteen-year-old's rarity. ⚠ `college` and `tour` are untouched
    // and still ≥ 1, which the case they are asserted in (`tests/wave3-stop-want.test.ts` §A) holds
    // byte-for-byte against the old formulae. ⚠ A FLOOR OF 0 MAKES THIS LINE RED, which is the whole
    // reason it is a `> 0` rather than a deleted assertion (ARM 17d there).
    for (const standing of [0, 0.5, 1]) {
      for (const spirit of [0, 50, 100]) {
        for (const bond of [0, 70, 100]) {
          const w = forkWantWeights(standing, spirit, bond)
          for (const want of FORK_WANTS) expect(w[want], `${standing}/${spirit}/${bond} ${want}`).toBeGreaterThan(0)
          expect(w.college, `${standing}/${spirit}/${bond}: college is untouched and still leans`).toBeGreaterThanOrEqual(1)
          expect(w.tour, `${standing}/${spirit}/${bond}: tour is untouched and still leans`).toBeGreaterThanOrEqual(1)
        }
      }
    }
  })
})
