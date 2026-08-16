// ⭐⭐ THE COLLEGE RULE AS IT STOOD UNTIL 16.08.2026 – KEPT HERE, IN THE BENCHES, AND NOWHERE ELSE.
//
// The owner removed the rule from the game that day: «collegeClosedFromTier – так ведь нет же там
// никакой связи с w75, мы же всё узнали. Колледж – это независимая ветка карьеры с отдельным
// функционалом и турнирами, альтернативная.» `ENDINGS.collegeClosedFromTier`, `collegeDoorOpen`,
// `collegeStillOpen` and `entryCostsCollege` are gone from `src/`, and the record of why is on the
// retired constant in `src/engine/ending.ts`.
//
// ⚠ SO WHY DOES IT SURVIVE HERE AT ALL? Because six measurement tools print a college column, and
// P0's frozen battery is a FOUR-COLUMN comparison whose whole value is that every column measures
// the same thing. Deleting the column would make the four arms incomparable on the one dimension the
// junior-access phases moved most; leaving each tool to re-derive the rule would put six copies of a
// deleted rule in the repo, which is how a definition drifts. One definition, named for what it is.
//
// ⚠⚠ AND IT IS A COUNTERFACTUAL NOW, NEVER A MEASUREMENT OF THE SHIPPED GAME. Whatever a bench
// prints off this reads *"had the pre-16.08 rule still been in force, it would have fired here"*. In
// the game as it ships **the college answer is on the fork card in 100% of careers, unconditionally,
// and nothing measured below can change that number.** Any report quoting a figure from here has to
// carry that sentence with it.
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

/** The rung the retired rule named. It was the owner's own marker from round-17 #6 and it never
 *  moved: `ENDINGS.collegeClosedFromTier = 'w75'`. */
export const RETIRED_COLLEGE_RUNG: TierId = 'w75'

/** The rungs at or above it – what the retired rule could see. */
export const RETIRED_COLLEGE_CLOSERS: readonly TierId[] = TIER_LADDER.slice(
  TIER_LADDER.indexOf(RETIRED_COLLEGE_RUNG),
)

/** ⚠ THE TEST, VERBATIM AS P4 LEFT IT: a result at or above the rung that got PAST THE OPENING ROUND.
 *  `bestFinishByTier` holds the smallest (best) finish index, and `points.length - 1` is the girl who
 *  lost her first match – so `finish < rounds - 1` is "she won a match there". The 13.08 ruling is
 *  why it reads the finish and not the points («чини дверь по набранному результату, а не по
 *  единице»): `w75.points` ends in a nominal 1 for the wooden spoon, and that single point had been
 *  shutting the door on 12 of 25 sampled closures. */
export function retiredCollegeDoorOpen(world: WorldState): boolean {
  for (const tier of Object.keys(world.bestFinishByTier) as TierId[]) {
    const finish = world.bestFinishByTier[tier]
    if (finish === undefined) continue
    if (TIER_LADDER.indexOf(tier) < TIER_LADDER.indexOf(RETIRED_COLLEGE_RUNG)) continue
    if (finish < TIERS[tier].points.length - 1) return false
  }
  return true
}
