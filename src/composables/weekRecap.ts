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

// =================================================================================================
// W5 — THE HANDLE THAT TURNS IT OFF
// =================================================================================================
//
// The owner asked for the story on all 52 weeks and, in the same message, offered the valve himself:
// «Если нужно - можем сделать отдельную ручку для их отключения в настройках.» Then, when asked
// whether 52 of them would become a chore: «А если это будет отключаемая опция - вообще нет проблем,
// спидраннеры ликуют.» So this is part of the answer rather than a hedge against a bad one.
//
// -------------------------------------------------------------------------------------------------
// WHAT "OFF" MEANS, and it is the whole design of the switch
// -------------------------------------------------------------------------------------------------
//
// OFF STOPS THE STORY OPENING ITSELF. It does NOT stop the story existing, and it must not:
//
//   * `recapExists` is untouched and is not allowed to read this. It answers a question about the
//     WEEK ("is there a resolved week to tell the story of"), and a preference is not a fact about a
//     week. Threading it through would make the predicate mean two things at once, and the dot, the
//     card and the route all read that predicate.
//   * The This-week tab keeps the card, on every week, for ever. Home keeps its door into it (the
//     "next tournament" card's tap target) and the tab's own accent dot keeps firing, so a player who
//     turned the automatic page off can still walk to any week's story deliberately and can still SEE
//     that there is one waiting. That is the difference between a valve and the game hiding something.
//   * What goes away is exactly the beat the design added in W1 – «Конец недели (игровой тик) → D.
//     Weekly Story» – i.e. the navigation App.vue performs at the end of a tick. Nothing else.
//
// A speedrunner therefore gets what he was promised: tick, tick, tick, no page in the way. And he has
// lost no content – it is all one tap away on a tab that tells him when it is fresh.
//
// -------------------------------------------------------------------------------------------------
// ⚠ WHY IT IS `localStorage` AND NOT THE SAVE, which is a schema question and deserves an answer
// -------------------------------------------------------------------------------------------------
//
// A per-career save is the wrong home for "I do not like popups". Three reasons, in order of weight:
//
//  1. IT IS NOT A FACT ABOUT THE CAREER. Every field in the save is something that happened to her –
//     her skills, her ledger, her injuries, the milestones. This is a fact about the PERSON HOLDING
//     THE PHONE, and it would be wrong the moment he started a second career: he would have to switch
//     it off again for a daughter he has not met yet.
//  2. IT WOULD COST A SCHEMA BUMP AND A MIGRATION for a boolean the engine may never read. The save
//     is at v26 with a migration ladder behind it and golden-save tests over it; adding a preference
//     to that ladder means every old save has to be told what it prefers.
//  3. THE APP ALREADY HAS THREE OF EXACTLY THIS, and they work: sound, music and haptics are plain
//     localStorage flags read and written by pure functions, on their own keys, defaulting ON, usable
//     before any career is loaded (src/audio/sfx.ts, music.ts, haptics.ts). This is the fourth, and
//     copying their shape is what makes it obvious to the next reader.
//
// AND IT LIVES HERE, in the module that already owns the other two halves of this rule (does a story
// exist; does the dot show). One import, three questions, and the answers cannot drift apart. It also
// keeps the flag out of the engine by construction: nothing under src/engine imports a composable.
//
// DEFAULT ON. This is the feature, not an opt-in – the absence of the key means the story opens.

const AUTO_OPEN_OFF_KEY = 'tb-week-story-off'

function readOff(): boolean {
  try {
    return localStorage.getItem(AUTO_OPEN_OFF_KEY) === '1'
  } catch {
    return false // storage unavailable (private mode, tests, ...) – default to ON
  }
}

let autoOpenOff = readOff()

/** Has the player turned the automatic page off? The story still EXISTS – see the note above. */
export function isWeekStoryAutoOpenOff(): boolean {
  return autoOpenOff
}

/** Set it, and remember it. Never throws: a session where storage is blocked still honours the
 *  switch, it just forgets by the next launch. */
export function setWeekStoryAutoOpenOff(value: boolean): void {
  autoOpenOff = value
  try {
    localStorage.setItem(AUTO_OPEN_OFF_KEY, value ? '1' : '0')
  } catch {
    // storage unavailable – the toggle still works for this session, just will not persist
  }
}

/** THE DOOR'S OWN PREDICATE: should the end of a week take the player to its story?
 *
 *  Kept as a function rather than inlined at App.vue's watcher so the rule is stated once, next to the
 *  existence rule it composes with, and so a test can hold the two apart – "the story exists AND the
 *  page does not open itself" is precisely the state the switch is for, and it is easy to break by
 *  accident from either side. */
export function storyOpensItself(snap: RecapFacts | null | undefined): boolean {
  return recapExists(snap) && !isWeekStoryAutoOpenOff()
}

// --- THE ONE-SHOT NAVIGATION HOLD ------------------------------------------------------------
//
// Owner, 01.08: «Фикс Play it and watch обязателен - он должен вести на пре-матч экран». The button
// on the Season screen advances the week and then opens PracticeFlow, whose first phase IS the
// pre-match card - but App.vue's post-advance watcher fired first and switched the tab (to the
// story, or failing that to Home), unmounting the Season screen together with the flow it had just
// opened. The player pressed "Play it and watch →" and watched nothing: he landed on the week
// recap, every time.
//
// So a screen that is about to advance the week AND open its own takeover on the result may claim
// the post-advance beat, ONCE. The hold suppresses BOTH switches - the story's and the Home
// fallback - because either one unmounts the claimant. It does not touch `recapExists`,
// `storyOpensItself` or the This-week dot: the story still exists, still marks itself fresh, and is
// still one tap away; the only thing held is the navigation, for one advance.
//
// ⚠ MODULE STATE, LIKE `autoOpenOff` ABOVE, AND ONE-SHOT BY CONSTRUCTION. `consume` reads and
// clears in one move, so a hold can never outlive the single watcher pass it was set for - except
// when the advance never lands at all (a knock blocks it before the tick), in which case the
// claimant clears its own stale hold right after the advance returns. Both sides of that contract
// are pinned in tests/round13-nav.test.ts.
let postAdvanceNavHeld = false

/** Claim the next post-advance navigation. Call ONLY right before `game.advance`, and pair it with
 *  a `consumePostAdvanceNav()` after the advance returns, to clear a hold a blocked week left. */
export function holdPostAdvanceNav(): void {
  postAdvanceNavHeld = true
}

/** Read-and-clear. True exactly once per hold. */
export function consumePostAdvanceNav(): boolean {
  const held = postAdvanceNavHeld
  postAdvanceNavHeld = false
  return held
}
