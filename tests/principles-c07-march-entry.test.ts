import { describe, it, expect } from 'vitest'
import {
  COLLEGE_FREEZE_REFUSAL,
  answerFork,
  callUpRevealOpen,
  closeTournament,
  collegeLeagueRevealOpen,
  createWorld,
  decideKnock,
  enterEvent,
  entryStatus,
  pendingBirthday,
  pendingKnock,
  reachableSituations,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { resumeMain, type Rng } from '../src/engine/rng'
import { weekMonth } from '../src/shared/dates'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { answerBirthdayNeutral, drainLifeBeats } from './helpers/career'

// =================================================================================================
// ⭐⭐ C-07 (principles review of 26.09, docs/review-principles-2026-09-26/03-engine-leaves.md) –
// THE SMALL-TALK FACT `'march-entry-open'` CERTIFIED AN ENTRY THE COLLEGE FREEZE REFUSES.
//
// The fact (`SMALL_TALK_FACT['march-entry-open']`, world/lifeBeat.ts) holds when a March event lies
// ahead, she is not entered, the deadline has not passed and `entryStatus` is not `'blocked'`. Two
// corpus rows stand on it and both declare the `college` stage: R8 `alone-or-with-them` and R20
// `the-money-she-did-not-ask-about` (world/smallTalkCorpus.ts). Neither `entryStatus` nor
// `entryVerdict` has a college clause, and the door is shut somewhere else entirely – `enterEvent`
// opens with `guardNotEnded`, which throws `COLLEGE_FREEZE_REFUSAL` under the latch. The review
// measured the gate true on 24 of 95 college pause-weeks and `enterEvent` refusing all 24, so a card
// asked the parent about an entry nobody could make. The owner's ruling 3(a): the fact gains
// `!inCollege(world)`.
//
// ⚠⚠ THE ASSERTION IS THE ENGINE'S OWN REFUSAL AND NOT `inCollege`, which is what stops this file
// being a restatement of the one-line fix. Every asked week puts the gate's OWN March event through
// `enterEvent` on a clone and reads what the engine answers; the property is that the gate and the
// refusal are never both true on one week. A future wave that opened entries inside the freeze would
// keep this green by making the refusal stop happening, which is the correct behaviour for it to
// have – whereas a pin on `inCollege` would have to be edited by hand.
//
// ⚠ NEVER `world.ending`. The small-talk roll runs inside `resumeFromCollege`'s loop, which nulls
// `world.ending` before ticking, so an ending test would read false on exactly the weeks that matter.
// The honest predicate is `world.college`, which the freeze's own span carries.
//
// ⚠ AND THE SAMPLE IS PROVEN NON-VACUOUS BEFORE IT IS BELIEVED (CLAUDE.md: a null result is a claim).
// `marchEventOpen` below mirrors the fact MINUS the new clause – the probe's own mirror – so the run
// can state how many of its asked weeks the old gate would have fired on. Without that count a
// college walk that simply never opened a March window would pass this file while proving nothing.
//
// ⚠ MUTATION ARM: drop `!inCollege(world)` from `SMALL_TALK_FACT['march-entry-open']`
// (src/engine/world/lifeBeat.ts) and the first case goes red, naming the weeks on which the gate and
// the freeze refusal were both true.
//
// ⚠ RNG: nothing here adds a MAIN draw. `reachableSituations` is pure and zero-draw, and the walk is
// the fixture shape `tests/college-freeze.test.ts` already uses. The frozen capture (41550 /
// e6b0c709) is untouched; `tests/condition.test.ts` is not part of this task.
// =================================================================================================

/** The player's own two presses at a college reveal – «Skip all rounds», then the finale's
 *  «Continue» – so a press does not hang the year on an unanswered championship or Nations Cup tie.
 *  The shape is `tests/college-freeze.test.ts`'s `answerCollegeReveal`, verbatim in behaviour. */
function answerCollegeReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** One ordinary lived week: tick, close whatever the tick produced, answer what blocks. */
function live(world: WorldState, rng: Rng): void {
  tickWeek(world, rng)
  finishAnyReveal(world)
  if (pendingKnock(world)) decideKnock(world, 'rest')
  if (world.ending === null && pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
}

/** The review probe's recipe (`probes/c-march-entry-college.ts`): play to the fork, force it open,
 *  answer «college», then play the reserved gap out until the departure latches the freeze.
 *  ⚠ The funds are the same deliberate thumb `tests/college-freeze.test.ts` documents – four college
 *  years of base costs would otherwise bankrupt the family and measure the budget instead. */
function toCollege(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) live(world, rng)
  world.fork = { askedWeek: world.week, answer: null, offer: null }
  world.fundsCents = 500_000_00
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) live(world, rng)
  expect(world.ending?.type, 'the departure latched the college ending').toBe('college')
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  return { world, rng }
}

const TARGETS = ['alone-or-with-them', 'the-money-she-did-not-ask-about'] as const

/** Is R8 or R20 in the pool this week, for ANY voice – the gate as `rollSmallTalk` asks it. */
function gateTrueAtCollege(world: WorldState): boolean {
  return TEMPERAMENTS.some((t) =>
    reachableSituations(world, t, 'college').some((r) => (TARGETS as readonly string[]).includes(r.id)),
  )
}

/** The fact MINUS the new college clause, mirrored for the non-vacuity count only (the fact itself is
 *  not exported). ⚠ It must stay the pre-fix predicate: it is the thing this file proves the sample
 *  could have fired on, so re-aiming it at the fixed fact would make the guard vacuous. */
function marchEventOpen(world: WorldState) {
  return world.season.find(
    (e) =>
      weekMonth(e.week) === 3 &&
      e.week > world.week &&
      !world.entries.includes(e.id) &&
      world.week < e.deadlineWeek &&
      entryStatus(world, e).level !== 'blocked',
  )
}

interface Ask {
  week: number
  gate: boolean
  /** the event the pre-clause fact would have certified, if any */
  certified: string | null
  /** what `enterEvent` answered on a clone for that event */
  refusedByFreeze: boolean
}

/** Walk one seed into the freeze and ask on every PAUSE week the year allows (birthday, championship,
 *  call-up, life beat). ⚠ A biased sample and said so: inside the freeze a year passes per press, so
 *  there is no weekly ask to be had – it is the review's own sample and the only one the freeze has. */
function askCollegePauses(seed: string, presses: number): Ask[] {
  const { world, rng } = toCollege(seed)
  const out: Ask[] = []
  for (let press = 0; press < presses && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    answerCollegeReveal(world)
    if (world.ending?.type !== 'college') break
    const ev = marchEventOpen(world)
    let refusedByFreeze = false
    if (ev) {
      const clone = structuredClone(world)
      try {
        enterEvent(clone, ev.id)
      } catch (e) {
        refusedByFreeze = (e as Error).message === COLLEGE_FREEZE_REFUSAL
      }
    }
    out.push({ week: world.week, gate: gateTrueAtCollege(world), certified: ev?.id ?? null, refusedByFreeze })
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    drainLifeBeats(world)
  }
  return out
}

const SEEDS = ['c-march-0', 'c-march-1', 'c-march-2']
const PRESSES = 12

describe('C-07 · the March-entry fact and the college freeze', () => {
  const asks = SEEDS.flatMap((s) => askCollegePauses(s, PRESSES))

  it('the gate is never true on a week enterEvent refuses with the freeze sentence', () => {
    // the sample has to be able to fail before its pass means anything
    expect(asks.length, 'college pause-weeks asked').toBeGreaterThan(10)
    const couldHaveFired = asks.filter((a) => a.certified !== null && a.refusedByFreeze)
    expect(
      couldHaveFired.length,
      'weeks whose March window was open AND whose entry the freeze refuses – the pre-fix gate would have fired here',
    ).toBeGreaterThan(0)

    const violations = asks.filter((a) => a.gate && a.refusedByFreeze)
    expect(
      violations.map((a) => `week ${a.week} (${a.certified})`),
      'a week where the fact certifies a March entry and the engine refuses it with the freeze sentence',
    ).toEqual([])
  })

  it('R8 and R20 are still reachable off the freeze – the fix removes a stage, not the rows', () => {
    // ⚠ THE OTHER HALF OF ruling 3(a), and the reason it is one clause and not a deleted row. The
    // pair keeps its `independent` column: a girl who is not at college and has a March window open
    // can still bring either conversation. A fix that had killed the rows outright would pass the
    // case above and quietly empty two cells of the corpus.
    const { world } = toCollege('c-march-0')
    const off = structuredClone(world)
    off.college = null
    off.ending = null
    const ev = marchEventOpen(off)
    expect(ev, 'the walked world has a March window open somewhere ahead').toBeTruthy()
    const pool = TEMPERAMENTS.flatMap((t) => reachableSituations(off, t, 'independent').map((r) => r.id))
    for (const id of TARGETS) expect(pool, `${id} is reachable at independent`).toContain(id)
  })
})
