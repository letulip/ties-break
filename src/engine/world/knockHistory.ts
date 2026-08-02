// THE KNOCK'S RECORD: the capped history of every knock she has had, and the one writer that
// closes one out.
//
// ⚠ WHY ITS OWN FILE. Two callers need `retireKnock`, and they are in different modules: the knock
// flow retires one when it expires, and the injury roll retires one when a real injury supersedes
// it. Leaving it with either would have made the other import upward into world.ts. It is a leaf.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import; nothing here draws on any RNG stream.
import type { WorldState } from '../world'

/** How many retired knocks the world keeps. Enough for the thread (`pushedParts` reads it) and the
 *  cooldown, small enough that it is never the reason a save grows. */
export const KNOCK_HISTORY_MAX = 16

/** File the current knock away. `brokeDown` marks the ones that turned into a real injury.
 *
 *  An UNDECIDED knock retires as `rest`, which is the conservative reading and is only reachable
 *  through `rollInjury` (an injury landing on the same week the knock arrived, before he could
 *  answer): he never sent her back out, so the record must not say he did – `pushedParts` would put
 *  that part on the thread for ever on the strength of a decision nobody made. */
export function retireKnock(world: WorldState, brokeDown = false): void {
  const k = world.knock
  if (!k) return
  world.knockHistory.push({
    part: k.part,
    sinceWeek: k.sinceWeek,
    untilWeek: Math.max(k.untilWeek, world.week),
    choice: k.choice ?? 'rest',
    ...(brokeDown ? { brokeDown: true as const } : {}),
  })
  if (world.knockHistory.length > KNOCK_HISTORY_MAX) {
    world.knockHistory.splice(0, world.knockHistory.length - KNOCK_HISTORY_MAX)
  }
  world.knock = null
}
