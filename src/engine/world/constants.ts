// THE SHARED IDS AND CAPS: the handful of constants more than one world module needs.
//
// ⚠ DEPENDENCY DIRECTION. This module imports NOTHING from the engine – it is the bottom of the
// world package's graph, which is exactly why the ids live here rather than in world.ts. A module
// that needs `KID_ID` can take it from a leaf instead of reaching back up into the integration core.
// The one import below is `import type`, erased at compile time, so that property still holds.
import type { WorldState } from '../world'

/** The kid's stable player id inside cohort/ranking/tournament space. */
export const KID_ID = 'kid'

/** W2-ENDINGS – THE COMMAND GUARD: a career that has ended has no next week, so a mutating PLAYER
 *  command must refuse rather than spend money for a girl who has retired. The engine re-validates
 *  every command because the worker is not the gate (CLAUDE.md invariant 1).
 *
 *  ⚠⚠ IT IS DEFINED HERE, AT THE BOTTOM OF THE GRAPH, AND `world/endings.ts` RE-EXPORTS IT. It was
 *  declared in `endings.ts`, which every command module imported it from – and that back edge is
 *  what made `endings.ts` unable to reach the entry rulebook. The college answer has to RELEASE her
 *  outstanding entries (round 24, §2d/#7), the refund rules live in `world/entries.ts` and nowhere
 *  else, and `entries.ts → endings.ts` closed the loop the moment `answerFork` imported them back.
 *  There were exactly two ways out: a second copy of the refund ladder inside `endings.ts`, or this
 *  two-line predicate moved to the leaf it always belonged in. `src/engine/world/*` had NO
 *  value-import cycles before this wave and still has none.
 *
 *  ⚠ ONLY `world/entries.ts` HAD TO BE REPOINTED, and the other seven callers deliberately still
 *  import it from `./endings` – they are edges INTO endings, which close nothing. Repointing them
 *  would be churn in files this wave has no other business in. */
export function guardNotEnded(world: WorldState): void {
  if (world.ending) throw new Error('This career has ended')
}

export const SEASON_MIN_FUTURE = 26 // always keep at least this many future weeks scheduled
export const SEASON_CHUNK = 52 // generate the calendar one deterministic year-block at a time
export const RESULTS_WINDOW = 52 // ranking window; results older than this never count → prunable
// ⚠ "oldest-first" is only half true and the missing half was a bug – see `pruneEvents` in world.ts.
// The trim runs in CLASS order (kept rows, then her competitive matches, then everything else) and
// oldest-first WITHIN a class, so a long enough career can evict a row written this week while
// keeping one from four seasons ago. `EVENTS_ORDINARY_FLOOR` below is what bounds that.
export const EVENTS_CAP = 400 // non-`keep` events beyond this are pruned, oldest-first within a class
/** THE ORDINARY NEWS FLOOR – how many of the newest non-match rows the feed may never sacrifice.
 *
 *  ⚠ IT EXISTS BECAUSE THE CAP WAS SPENT BY CLASS AND NOT BY AGE (fix/wallet-and-wrapup, owner's
 *  own save, week 412). `pruneEvents` gave her competitive matches absolute priority over every
 *  other row – and the two classes have completely different shapes. Ordinary rows are a FLOW:
 *  two to six every week, for ever. Her matches are a STOCK the pruner protected, so the protected
 *  class grew monotonically until it filled the cap on its own. In his save it had: 382 match rows
 *  plus 18 kept milestones is exactly 400, so `rest` was EMPTY on every tick and 100% of the money
 *  rows were evicted the instant they were written – including the ones the running tick had just
 *  written. It is not that old money was pruned; new money never survived its own week.
 *
 *  120 is ~30-40 ordinary weeks. It has to clear two floors that are stated elsewhere in this file:
 *  `SNAPSHOT_FINANCIAL_EVENTS` (50) transactions for the Money ledger tab, and enough weeks either
 *  side of them for the diary's own reads (the travel note looks up the week's tournament summary).
 *  What it costs is the far end of the radar's evidence window: her matches are now bounded at
 *  ~EVENTS_CAP − kept − 120 ≈ 265 rather than growing to the whole cap, which is still four-plus
 *  professional seasons and MORE than the "roughly the last year and a half" radar.ts describes
 *  itself as measuring over. Measured, not guessed – see docs/specs/wallet-and-wrapup.md. */
export const EVENTS_ORDINARY_FLOOR = 120
export const SNAPSHOT_EVENTS = 60 // events surfaced in a snapshot
export const FINANCE_WEEKS = 60 // trailing weeks of the per-category finance ledger retained (12w + a full 52w season)
// ⚠ IT IS NOT "cap-independent of `events`", WHICH IS WHAT THIS LINE USED TO CLAIM. The slice is
// `world.events.filter(e => e.amountCents !== undefined).slice(-50)` – a window ON the capped feed,
// independent only of the SNAPSHOT's own 60-event window. The claim mattered: it is why the Money
// screen's ledger tab was believed safe, and it emptied completely on the owner's save. It is the
// ordinary floor above that keeps this honest now, not this number.
export const SNAPSHOT_FINANCIAL_EVENTS = 50 // financial transactions surfaced to the ledger tab
export const UPCOMING_WEEKS = 8 // calendar horizon surfaced in a snapshot
