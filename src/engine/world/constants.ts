// THE SHARED IDS AND CAPS: the handful of constants more than one world module needs.
//
// ⚠ DEPENDENCY DIRECTION. This module imports NOTHING from the engine – it is the bottom of the
// world package's graph, which is exactly why the ids live here rather than in world.ts. A module
// that needs `KID_ID` can take it from a leaf instead of reaching back up into the integration core.

/** The kid's stable player id inside cohort/ranking/tournament space. */
export const KID_ID = 'kid'
