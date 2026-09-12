// THE COLLEGE-BIRTHDAY APPARATUS – the walk to the fork, the presses through the freeze, and the
// four wordings the cases argue over.
//
// ⚠⚠ WHY THIS EXISTS (12.09, wave 3, PR #135 – the fifth red `unit-heavy`). `tests/college-birthday
// .test.ts` was one 781-line file and it had grown onto birpc's unraisable 60 s RPC window. MEASURED
// SOLO before anything was touched, one vitest process, `--project unit --reporter=json`, THREE runs
// on a quiet machine (load 2.1-4.5):
//
//     college-birthday   18 cases   26.41 / 26.05 / 26.10 s   -> x2.24 = 58.4 s   AT THE WALL
//
// The house factor is 2.24x (tests/coachTravelEdgeFixtures.ts measured it on its own 62,889 ms
// stall), so this file was projecting 58.4 s onto a 60 s window – a coin flip on every run, and the
// all-green-non-zero exit `scripts/units.mjs`'s header is written about. It was already alone in its
// process from `scripts/heavy-tests.mjs`, so the FILE was the unit and the file had to be cut,
// exactly as radar's was on 11.08 and coach-travel-edge's on 31.08 and again today.
//
// ⚠ THE SEAM IS THE OWNER'S SECOND PASS, AND THE TOPICAL SEAM WOULD NOT HAVE DONE IT. MEASURED per
// describe on the same runs:
//
//     ROUND 26 #4 – a college wish may not assume a wallet she has not got   21.05 s    8 cases
//     the other four describes                                                5.37 s   10 cases
//
// **79.7 % of the file is ONE describe**, so lifting the four cheap describes out buys 5.4 s of the
// 58.4 s that stalls and leaves a file at four fifths of what already stalled – the trade
// fatigue-bench-policy spent two weeks proving is not a cut. The seam therefore runs THROUGH that
// describe, along the boundary the describe itself already draws: its own banner at what was line
// 703, «ROUND 26 #4, SECOND PASS – THE WISH BESIDE THE BICYCLE IS ABOUT THE BICYCLE», where the
// owner corrected the first pass – and the describe's two passes cost 10.53 s each, to the
// hundredth. Solo, same invocation, after the cut:
//
//     college-birthday        15.67 s  14 cases  the four walked describes + the FIRST pass (the
//                                                means arms, the gift band, his own save walked to
//                                                the real fork)
//     college-birthday-wish   10.78 s   4 cases  the SECOND pass (the bicycle's own wish, its
//                                                means-blindness, the four different dialogs, the
//                                                predicate that stays put)
//
// ⚠ AND THE SHORTFALL WAS CONTROLLED FOR RATHER THAN POCKETED, as 27.08's cut demands – except that
// here there is no shortfall to explain, and that is the check passing rather than being skipped.
// 15.67 + 10.78 = 26.45 s against 26.05 s for the file they replaced: 18 cases before and 18 after,
// every one walking its own careers, so nothing could have gone missing without the sum FALLING.
// The +0.40 s is the JIT warm-up the first case of a file pays, now paid twice. The larger half
// projects to 35.1 s on the runner that stalled – a 1.7x unlucky stretch from the wall.
//
// ⚠ NOT ONE SEED, WEEK COUNT, WALLET OR ASSERTION MOVED, and no test name changed either: all 18 full
// names are a BYTE-IDENTICAL MULTISET to the one file's, checked mechanically rather than by eye,
// because the new file keeps the ORIGINAL describe name.
//
// ⚠⚠ AND THE WALK DID NOT SPLIT WITH THE CASES, which is why this module exists rather than a second
// copy of `collegeBirthdays` in each half. Both halves render college birthdays off the SAME sixty
// lived weeks, the same forced fork, the same September departure and the same per-birthday wallet
// override – and `openedAtCollege`'s thumb on the scale (the funds top-up, the drained life beats,
// the answered reveals) is the one piece here that must never have two truths: a fixture that
// differed by a week between the halves would move the ask on one side and nobody could say why.
// That is the hand-maintained second copy `scripts/heavy-tests.mjs` exists to make impossible.
//
// ⚠ THE 120 s PER-TEST CONFIG IS NOT HERE, DELIBERATELY. `vi.setConfig` is per FILE, so each test
// file carries its own copy with the note round 26 #16 wrote for it. A config set in an imported
// module would silently cover neither.

import { expect } from 'vitest'
import {
  skipTournament,
  callUpRevealOpen,
  collegeLeagueRevealOpen,
  answerFork,
  chooseGift,
  closeTournament,
  createWorld,
  decideKnock,
  pendingBirthday,
  pendingKnock,
  resumeFromCollege,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { resumeMain, type Rng } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { drainLifeBeats } from './helpers/career'

/** ⭐⭐⭐ ROUND 26 #6 RE-AIM – THE PRESS THAT ANSWERS THE CHAMPIONSHIP. `resumeFromCollege` now
 *  PAUSES on the College League week the way it pauses on her birthday, because the owner's
 *  complaint was that the year reported the tournament and ticked on past it. So every walk here
 *  answers the reveal the way the player does – «Skip all rounds», then the finale's «Continue» –
 *  which is `skipTournament` + `closeTournament` dispatched at the college reveal. Nothing this
 *  suite MEASURES moved: the same birthdays, the same pauses, the same banked years.
 *  The full note is in tests/college-league.test.ts. */
/** ⭐⭐⭐ ROUND 27 #6 RE-AIM – IT ANSWERS THE NATIONS CUP TIE TOO, AND IT IS NOT A WEAKENING.
 *  ⚠ IT USED TO CLAIM: «a college year has exactly one pause the flow owns – the championship»
 *  (`answerLeagueReveal`, round 26 #6). That is why it read `collegeLeagueRevealOpen` alone.
 *  ⚠ WHY IT MOVED: the call-up used to resolve inside the tick and report itself in a toast – the
 *  owner's «матчи только постфактум». It now pauses the year and is walked in `TournamentFlow` like
 *  the championship, so a walk that answered only one of the two would hang on the other. The
 *  predicate is widened and the name says what it covers; the ASSERTIONS below are untouched, and
 *  `skipTournament` / `closeTournament` are still the player's own two presses. */
export function answerCollegeReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}


export function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** Any pending birthday, answered with the one option EVERY birthday offers – the day together is
 *  never spent and never filtered (see `birthdayOffer`), so this is always a legal answer. */
export function answerBirthday(world: WorldState): number {
  const age = pendingBirthday(world)
  expect(age, 'the fixture called answerBirthday with nothing pending').not.toBeNull()
  chooseGift(world, 'day')
  return age!
}

/** A career REALLY at the fork: sixty lived weeks with every knock, reveal and tour birthday
 *  answered on the way – so the only question standing when college opens is the one this file is
 *  about. The funds top-up is the one thumb on the scale every college suite puts there (four years
 *  is 208 weeks of base costs; a career that went bankrupt mid-freeze would measure the budget). */
export function openedAtCollege(seed: string, birthMonth: number, birthDay: number): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth, birthDay, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (pendingBirthday(world) !== null) answerBirthday(world)
    // ⚠⚠ ADDED FOR v74 (wave 3, T8 – 11.09), AND THE FIXTURE MOVED, NOT THE ASSERTION. Tier-1 small
    // talk raises an answerable `lifeLog` row from week 0, and `answerFork` refuses while ANY row is
    // unanswered, so this opener threw before it reached a case. `drainLifeBeats` answers with the
    // option priced ZERO – a walk that never meant to price a beat moves no number below.
    drainLifeBeats(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: null }
  // ⚠ ROUND 24 #5: the answer RESERVES; the walk to the September departure is what latches the
  // college ending now. Reveals cannot arise (nothing is entered) and a birthday inside the gap is
  // an ordinary tour birthday – answered below if the departure happens to rest on one.
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (world.ending === null && pendingBirthday(world) !== null) answerBirthday(world)
    drainLifeBeats(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  // A birth date near 1 September can put a birthday IN the departure week itself – that one is the
  // gap's own tour birthday, answered here so the fixture hands back the rest state this file's
  // cases have always started from.
  if (pendingBirthday(world) !== null) answerBirthday(world)
  return { world, rng }
}

// =================================================================================================
// ROUND 26 #4 – THE FOUR WORDINGS THE CASES ARGUE OVER, and the walk that renders them.
// =================================================================================================

export const FARES = 'She has been looking up fares home at two in the morning and booking none.'
export const NO_FARES = 'The journey home is four hundred miles and she has never once asked us to book it.'
/** ⭐ ROUND 26 #4, SECOND PASS – the bicycle's own wish, and the one it replaced. Both are literals
 *  on purpose: the second exists so the assertions can tell them apart. */
export const BIKE_ASK = 'Everyone there has a bicycle. She walks, and she has mentioned it twice.'
export const OLD_BIKE_ASK = 'She has counted the minutes she spends walking between buildings. It is a lot.'

/** Every college birthday of one career, rendered, with the household wallet forced on the day. */
export function collegeBirthdays(seed: string, walletCents: number, kidCents: number) {
  const { world, rng } = openedAtCollege(seed, 6, 15)
  const prompts: Array<{ age: number; ask: string; ids: string[]; labels: string[] }> = []
  for (let guard = 0; guard < 24 && world.ending?.type === 'college'; guard++) {
    resumeFromCollege(world, rng)
    // ⚠ ADDED AT THE ROUND-26 COLLECT: this walk was written on a branch where the year paused
    // only for the cake. Another branch of the SAME round taught it to pause for the championship
    // too, and a walk answering one pause but not the other stalls on the first league week - it
    // read 0 college birthdays where four happen. The helper is B's; the call is the merge.
    answerCollegeReveal(world)
    if (pendingBirthday(world) === null) continue
    // ⚠ SET ON THE BIRTHDAY WEEK ITSELF, both purses, because the claim is about what the
    // household has ON THE DAY and four college years of base costs move it.
    world.fundsCents = walletCents
    world.kidFundsCents = kidCents
    const prompt = toSnapshot(world).birthdayPrompt!
    prompts.push({
      age: prompt.age,
      ask: prompt.ask,
      ids: prompt.options.map((o) => o.id),
      labels: prompt.options.map((o) => o.label),
    })
    answerBirthday(world)
  }
  return prompts
}
