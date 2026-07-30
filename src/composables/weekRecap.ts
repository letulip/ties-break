// R13-12 – the ONE recap-existence rule, shared between the This-week screen and the App shell.
//
// The nav restructure moved the WeekRecapCard onto its own tab, which created a second consumer of
// "does a recap exist for the current week?": the screen (does the card render?) and the tab bar
// (does the This-week dot show?). Two hand-copies of that predicate is exactly how the two would
// drift – so the rule lives here as pure functions, and both surfaces read it.
//
// The predicate itself is R5-9/R9-18's: a recap exists after every RESOLVED week – never on week 0
// (nothing to recap) and never while a reveal is pending. The DISMISSAL is not part of existence:
// dismissing silences the card for one week (module scope in ThisWeekScreen.vue), while the dot
// clears by VISITING the tab – two different acknowledgements over the same fact.
//
// --- W4: THE TOURNAMENT WEEK GETS ITS STORY BACK, AND IT COMES HOME WITH HER ----------------------
//
// The owner, 30.07, twice in one playtest: «увидел экран week recap для прошедшего турнира, но уже,
// получается через неделю. Я предлагаю ставить week recap сразу после турнира, как будто домой
// едем.» and «после турнира не появился week recap».
//
// ⚠ THE EXCLUSION THAT USED TO BE HERE, AND WHY IT IS GONE. This function ended with
//
//     return !snap.events.some((e) => e.type === 'tournament' && e.week === snap.week)
//
// – no story on any week carrying a `tournament` event – and it was written when the recap card was
// a block at the bottom of Home, reachable only by scrolling. Two takeovers wanted the same tick
// then: `TournamentFlow` is a full-screen overlay that owns the whole week (splash, every round, the
// finale), and a card that had already appeared under it was the week being reported twice, in the
// wrong order, by two surfaces. Excluding the week was the cheap way to keep them apart.
//
// IT IS NOT NEEDED ANY MORE, because the story is no longer a block that appears – it is a SCREEN
// the shell routes to, and a route can be TIMED. `snap.pending` is exactly the fact "the flow still
// owns this week": it is set by the tick that reaches the tournament, it survives the finale
// (`finished: true`, so the celebration is a real snapshot) and it is cleared by `closeTournament` –
// the finale's own Continue. So the second clause already says everything the first one was for, one
// beat later and at the moment the owner asked for: the flow finishes, the pending clears, and the
// week's story opens as the car pulls out of the car park. App.vue's `pending` watcher is the door.
//
// WHAT THIS MAKES TRUE ELSEWHERE, and it is the reason the change pays for itself twice: the journey
// -home painting (`diary.facts.travelHomeScene`) was pushed to the week AFTER the tournament ONLY
// because of the clause above – a picture of the drive back could not be shown on the week she drove
// back. It sits on the tournament week now. See `travelHomeSceneFor` in engine/diary.ts.
import type { Snapshot } from '../shared/protocol'

/** The two snapshot facts the rule reads – structural, so tests can hand in a plain object.
 *  (`events` is still in the type: the shape is `Snapshot`'s and every consumer passes a whole
 *  snapshot, so narrowing it would only make the callers' lives harder.) */
export type RecapFacts = Pick<Snapshot, 'week' | 'pending' | 'events'>

/** Does a week recap exist for the snapshot's CURRENT week? */
export function recapExists(snap: RecapFacts | null | undefined): boolean {
  if (!snap || snap.week <= 0) return false
  return !snap.pending
}

/** The This-week tab's accent dot: a FRESH recap is unseen. `lastSeenWeek` is the snapshot week
 *  at the player's last visit to the tab (per-career watermark, localStorage – the R9-21b news
 *  pattern; -1 = never visited). The dot shows while a recap exists for a week the tab has not
 *  been visited since, and clears the moment it is. */
export function thisWeekDotShows(exists: boolean, week: number, lastSeenWeek: number): boolean {
  return exists && week > lastSeenWeek
}
