// R13-12 – the ONE recap-existence rule, shared between the This-week screen and the App shell.
//
// The nav restructure moved the WeekRecapCard onto its own tab, which created a second consumer of
// "does a recap exist for the current week?": the screen (does the card render?) and the tab bar
// (does the This-week dot show?). Two hand-copies of that predicate is exactly how the two would
// drift – so the rule lives here as pure functions, and both surfaces read it.
//
// The predicate itself is R5-9/R9-18's, unchanged: a recap exists after every resolved
// NON-tournament week – never on week 0 (nothing to recap), never while a reveal is pending, and
// never on a tournament week (the flow's own cards cover that one). The DISMISSAL is not part of
// existence: dismissing silences the card for one week (module scope in ThisWeekScreen.vue), while
// the dot clears by VISITING the tab – two different acknowledgements over the same fact.
import type { Snapshot } from '../shared/protocol'

/** The three snapshot facts the rule reads – structural, so tests can hand in a plain object. */
export type RecapFacts = Pick<Snapshot, 'week' | 'pending' | 'events'>

/** Does a week recap exist for the snapshot's CURRENT week? */
export function recapExists(snap: RecapFacts | null | undefined): boolean {
  if (!snap || snap.week <= 0) return false
  if (snap.pending) return false
  return !snap.events.some((e) => e.type === 'tournament' && e.week === snap.week)
}

/** The This-week tab's accent dot: a FRESH recap is unseen. `lastSeenWeek` is the snapshot week
 *  at the player's last visit to the tab (per-career watermark, localStorage – the R9-21b news
 *  pattern; -1 = never visited). The dot shows while a recap exists for a week the tab has not
 *  been visited since, and clears the moment it is. */
export function thisWeekDotShows(exists: boolean, week: number, lastSeenWeek: number): boolean {
  return exists && week > lastSeenWeek
}
