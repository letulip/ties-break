// WHEN THE CURRENT COACHING ARRANGEMENT BEGAN – a LEAF (round 52 F1, 14.10).
//
// ⚠ WHY THESE TWO NAMES LEFT `world/coachMarket.ts`. Her feel for the coach (`world/coachFeel.ts`) needs the stint's
// age, and the life-beat hub needs her feel (the small-talk hunch). The hub CANNOT import `coachMarket.ts`:
// coachMarket -> endings -> lifeBeat is a runtime cycle that `tests/import-cycles.test.ts` refuses. So the tag and its
// one reader moved here, VERBATIM, to a module that imports a TYPE and nothing else; `coachMarket.ts`, `knock.ts` and
// `staffLetters.ts` import them from their owner, and `world.ts` re-exports `coachSinceWeek` from here (a frozen name
// whose owner changed – `tests/principles-a03-barrel-surface.test.ts` counts the names, not the file).

import type { WorldState } from './state'

/** THE TAG ON A COACH-CHANGE EVENT, and the only thing that identifies one. `milestoneKey` already
 *  exists on every event (it is what makes a milestone fire once), it is never pruned when the event
 *  is `keep`, and it needs no schema bump - the same trick the academy's offers use
 *  (`academy-in-<week>`). The week is in the key, so two hires can never collide.
 *
 *  A career migrated from a save written before this tag existed simply has no tagged events, and
 *  `coachSinceWeek` falls back to week 0 - "they have been together as long as anyone can remember",
 *  which is the right answer for a ledger with no record of a change. */
export const COACH_CHANGE_KEY = 'coach-since-'

/** WHEN THE CURRENT COACHING ARRANGEMENT BEGAN - the radar's "weeks together", derived rather than
 *  stored (docs/specs/skills-radar.md §2: no schema bump, no migration, no golden save).
 *
 *  Week 0 for a career that has never changed coach, and the week of the last hire or release
 *  otherwise. BOTH arms count: a new coach has to learn her, and so - as far as the ladder is
 *  concerned - does the parent who takes the court back, because what the rung buys is an eye, and
 *  the eye left with him. */
export function coachSinceWeek(world: WorldState): number {
  let since = 0
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(COACH_CHANGE_KEY) && e.week > since) since = e.week
  }
  return since
}
