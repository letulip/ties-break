// ⭐⭐⭐ THE COLLEGE SCENARIO, OWNED ONCE – W5's T5.11 (26.09), findings H-07 / F-01 / F-02.
//
// ⚠⚠ THE COUNT THAT DECIDED THIS FILE'S SHAPE, MEASURED RATHER THAN QUOTED. H-07 names `atCollege`
// ×8 as lead 1's target. It is not the biggest copy in this corner, and the bigger one is the reason
// this file exists:
//
//   `function finishAnyReveal(`    17 definitions in tests/ – 16 byte-identical, 1 drifted
//   `function answerCollegeReveal(` 11 definitions in tests/ – ALL ELEVEN byte-identical
//                                   (+1 under the name `answerTheReveal`, identical body, and
//                                    +1 under `answerAnyCollegeReveal`, which has DRIFTED)
//   the press loop that uses them   63 loops in 19 files; its commonest body is 15 copies
//   `function atCollege(`            8 definitions – and FOUR distinct bodies, not H-07's one
//
// ⚠⚠ AND THE PRICE OF THE COPIES IS ON THE RECORD THREE TIMES, WHICH IS WHY THIS IS NOT TIDYING.
// Each of these walks has had to be taught a NEW PAUSE three times: the championship at round 26, the
// Nations Cup tie at round 27, and her card under ruling 2(a) in W2 – five commits, thirty-odd files,
// once per copy. Two copies say so in their own headers, and they are the two to read before touching
// this file: `tests/college-birthday.test.ts:596-605` («which is the third time this walk has been
// taught to answer a new pause») and `tests/round27-call-up-flow.test.ts:127-133` («IT ANSWERED THREE
// OF THE YEAR'S QUESTIONS AND NOT HER CARD … MEASURED as five red cases in this file»). A fourth pause
// is a matter of when, not whether; from here it is one edit.
//
// ⚠ WHAT DOES **NOT** LIVE HERE. The seed, the press BUDGET and the loop's own stop condition stay at
// every call site – `career.ts`'s header rules the first and the same reasoning covers the other two:
// a budget is what a case is claiming («four years is four years»), and the 63 loops stop on eleven
// different conditions because they are asking eleven different questions. This module owns ONE PRESS
// and the answering, which is the part that was identical eleven times over.
import { expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  answerFork,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  closeTournament,
  collegeLeagueRevealOpen,
  callUpRevealOpen,
  pendingBirthday,
  measureCollegeOffer,
  type WorldState,
} from '../../../src/engine/world'
import { resumeMain, type Rng } from '../../../src/engine/rng'
import { WEEKS_PER_YEAR } from '../../../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import { drainLifeBeats, answerBirthdayNeutral } from '../career'

/** A tour reveal, walked out round by round – the 16-copy body, verbatim.
 *
 *  ⚠ `revealTournamentRound` AND NOT `skipTournament`, and the difference is dice rather than style:
 *  revealing plays the bracket a round at a time, skipping resolves it whole. The one local copy that
 *  skips (`tests/component/round26-world-alive.test.ts:82`) therefore walks a DIFFERENT career and
 *  keeps its own body; it carries a dated note saying so, so that the next sweep does not fold it in
 *  here on the strength of the name. */
export function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

// ⚠⚠ THE CHRONICLE BELOW IS THE ELEVEN COPIES' OWN, MOVED VERBATIM AND NOT PARAPHRASED, and the way
// it arrives here is itself the finding: the round-26 and round-27 re-aims were retold SEVEN different
// ways across the eleven definitions – four files share one wording, three share a second, and five
// more each wrote their own. The two canonical blocks are kept below, byte for byte from
// `tests/college-departure.test.ts` (the four-file majority) and from the round-27 note that five of
// the seven retellings already share word for word. The retellings are gone, not the record.
//
/** ⭐⭐⭐ ROUND 26 #6 RE-AIM – THE PRESS THAT ANSWERS THE CHAMPIONSHIP. `resumeFromCollege` now PAUSES
 *  the year on the College League week the way it already pauses on her birthday, because the owner
 *  had been told about the tournament instead of shown it. So every walk here answers the reveal the
 *  way the player does – «Skip all rounds», then the finale's «Continue», which are `skipTournament`
 *  and `closeTournament` dispatched at the college reveal. Nothing measured below moved; the walk
 *  answers one more question and its press ceiling grows by one a year. The full note is in
 *  tests/college-league.test.ts, and the flow itself in tests/round26-college-flow.test.ts. */
/** ⭐⭐⭐ ROUND 27 #6 RE-AIM – IT ANSWERS THE NATIONS CUP TIE TOO, AND IT IS NOT A WEAKENING.
 *  ⚠ IT USED TO CLAIM: «a college year has exactly one pause the flow owns – the championship»
 *  (`answerLeagueReveal`, round 26 #6). That is why it read `collegeLeagueRevealOpen` alone.
 *  ⚠ WHY IT MOVED: the call-up used to resolve inside the tick and report itself in a toast – the
 *  owner's «матчи только постфактум». It now pauses the year and is walked in `TournamentFlow` like
 *  the championship, so a walk that answered only one of the two would hang on the other. The
 *  predicate is widened and the name says what it covers; the ASSERTIONS below are untouched, and
 *  `skipTournament` / `closeTournament` are still the player's own two presses. */
/** ⚠ AND THE GUARD CLAUSE IS NOT DECORATION. Without it this function skips whatever bracket happens
 *  to be standing, which inside a college year is a different thing from answering the year's own
 *  question. `answerAnyCollegeReveal` (`tests/round27-call-up-flow.test.ts:102`) is the one copy that
 *  dropped it, deliberately – that file drives the tie from outside the guard – so it stays local and
 *  carries a dated note saying so. */
export function answerCollegeReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}

/**
 * ⭐⭐⭐ ONE PRESS OF THE COLLEGE YEAR, WITH EVERY PAUSE ANSWERED – the walk this file exists for.
 *
 * Returns `resumeFromCollege`'s own stop list, so a case can still read what the press stopped on.
 *
 * ⚠ THE ORDER OF THE FOUR IS THE ORDER THE FIFTEEN COPIES USE, and it is not arbitrary: the press
 * first (it is what raises the questions), then the year's reveal, then the cake, then her card. A
 * `drainLifeBeats` moved above the reveal would answer a beat the reveal's own resolution had not yet
 * raised, and the pressed year would differ.
 *
 * ⚠ `pendingBirthday(world) !== null` IS KEPT AS A GUARD rather than folded into
 * `answerBirthdayNeutral`, because that helper THROWS on a kind with no zero-delta option and a bare
 * call on a world with no cake standing is not the same no-op.
 */
export function pressCollegeYear(world: WorldState, rng: Rng): string[] {
  const stops = resumeFromCollege(world, rng)
  answerCollegeReveal(world)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  return stops
}

/**
 * ⭐⭐⭐ A CAREER THAT WAS REALLY PLAYED TO THE FORK AND REALLY ANSWERED «college» – never a hand-built
 * snapshot. `tickWeek` is total (only `advanceWeeks` halts), so the opener closes any reveal it
 * produces and keeps going, exactly as `tests/college-freeze.test.ts` walks one.
 *
 * ⚠ THE ONE THUMB ON THE SCALE, and it is `college-freeze.test.ts`'s: four years is 208 weeks of base
 * costs, and a career that went bankrupt inside them would be measuring the family budget.
 *
 * ⚠⚠ ADDED FOR v74 (wave 3, T8 – 11.09), AND THE FIXTURE MOVED, NOT THE ASSERTION: tier-1 small talk
 * raises an answerable `lifeLog` row from week 0, and `answerFork` refuses while ANY row is
 * unanswered, so the opener threw before it reached a case. Bond-neutral drain.
 *
 * ⚠ ROUND 24 #5: the answer RESERVES – the walk to the September departure is what latches the college
 * ending now (the gap semantics are pinned in `tests/college-departure.test.ts`).
 *
 * ⚠ THE BOUND IS SPELLED `WEEKS_PER_YEAR + 2` AND THE LITERAL `54` IT REPLACES IS THE SAME NUMBER –
 * checked, not assumed (`WEEKS_PER_YEAR` is `WEEKS_IN_SEASON` = 52). Four of the eight copies wrote it
 * one way and four the other; one spelling is the point of this file and neither career moved.
 *
 * ⚠⚠ SEVEN OF THE EIGHT COPIES MIGRATE HERE AND THE EIGHTH DELIBERATELY DOES NOT.
 * `tests/component/round26-world-alive.test.ts:91` differs on TWO counts, and both are dice rather
 * than style: it clamps the wallet at the top of every tick (its cases read one world over and over),
 * and its local `finishAnyReveal` SKIPS the bracket where this one reveals it round by round. Either
 * one alone would make it a different career. Folding it in behind an option would have hidden that
 * behind a default, which is the shape H-07's own migration rule forbids – so it keeps its body and
 * carries a dated note naming the difference.
 */
export function atCollege(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  drainLifeBeats(world)
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}
