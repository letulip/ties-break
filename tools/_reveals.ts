// ⭐⭐⭐ THE REVEAL IS A QUESTION STANDING IN FRONT OF THE WEEK, AND A WALKER THAT DOES NOT ANSWER IT
// WEDGES. One helper, shared, because two spellings of «answer the open reveal» is how two benches
// come to disagree about whether a college year happened.
//
// ⚠⚠ WHY IT EXISTS, MEASURED (the college scene, 24.09). Round 26 #6 put the student championship
// through the tour's own flow (`CollegeLeagueReveal`, v60) and round 27 #6 did the same for the
// Nations Cup tie (`CollegeCallUpReveal`, v64). `resumeFromCollege` REFUSES to spend a year over an
// open one – that refusal is the feature – so a walker that presses «another year» without answering
// the reveal stops dead on the championship week. Measured on a fresh walk: the world stopped at week
// 324 (season week 12, the championship's own week) and SIXTEEN presses moved it zero weeks and
// banked zero years.
//
// ⚠⚠ AND IT HAD ALREADY ROTTED A SHIPPED INSTRUMENT, SILENTLY. `tools/college-year-content.ts` is the
// file round 24's championship item was measured in – «0.71 watchable matches per college year over
// 12 careers x 4 years» – and on 24.09 the same command printed **1 college year for 3 careers**,
// `min Infinity max -Infinity` over 0 full years, 0.00 watchable matches, and **exited 0**. Nothing
// in the gate could see it: `check:tools` typechecks every tool and nothing RUNS one, so an
// instrument can stop measuring what it claims to measure and the branch stays green.
//
// ⚠ IT GOES THROUGH THE PLAYER'S OWN DOORS – `skipTournament` («Skip all rounds») then
// `closeTournament` («Continue»), the two engine entry points `TournamentFlow` dispatches to for
// every competition in the game. That is what round 26 #6's «обычный флоу турнира» means, and a
// bench reaching for `skipCollegeLeagueRounds` directly would be a second road to the same state.
//
// ⚠ MEASUREMENT ONLY: it answers questions, it changes no constant and it writes no save.
import { callUpRevealOpen, closeTournament, collegeLeagueRevealOpen, skipTournament } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'

/** How many reveals this call answered – 0 on the overwhelming majority of weeks, which is why a
 *  caller can put it in a loop without thinking about it. The guard is a walker's seatbelt: two
 *  fixtures can be open in one college year (weeks 12 and 14) and never more, so a count that climbs
 *  past a dozen means the state is not closing and the caller wants to know rather than spin. */
export function drainReveals(world: WorldState): number {
  let answered = 0
  for (let guard = 0; guard < 12 && (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)); guard++) {
    skipTournament(world)
    closeTournament(world)
    answered += 1
  }
  return answered
}
