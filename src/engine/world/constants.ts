// THE SHARED IDS AND CAPS: the handful of constants more than one world module needs.
//
// ⚠ DEPENDENCY DIRECTION. This module imports NOTHING from the engine – it is the bottom of the
// world package's graph, which is exactly why the ids live here rather than in world.ts. A module
// that needs `KID_ID` can take it from a leaf instead of reaching back up into the integration core.

/** The kid's stable player id inside cohort/ranking/tournament space. */
export const KID_ID = 'kid'

export const SEASON_MIN_FUTURE = 26 // always keep at least this many future weeks scheduled
export const SEASON_CHUNK = 52 // generate the calendar one deterministic year-block at a time
export const RESULTS_WINDOW = 52 // ranking window; results older than this never count → prunable
export const EVENTS_CAP = 400 // non-`keep` events beyond this are pruned oldest-first
export const SNAPSHOT_EVENTS = 60 // events surfaced in a snapshot
export const FINANCE_WEEKS = 60 // trailing weeks of the per-category finance ledger retained (12w + a full 52w season)
export const SNAPSHOT_FINANCIAL_EVENTS = 50 // financial transactions surfaced to the ledger, cap-independent of `events`
export const UPCOMING_WEEKS = 8 // calendar horizon surfaced in a snapshot
