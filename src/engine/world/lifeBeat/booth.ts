// A-06 / T6.8 – `world/lifeBeat.ts` §10 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ booth: FLAT IN `world/lifeBeat/`, for the reason `leak.ts`'s header states in full…
// → docs/notes/life-beats/booth.md#boothts-header
import { ECONOMY } from '../../economy'
import { loveEpisodesOf } from '../loveEpisodes'
import { atOrAboveStageBar, boothPrivateLifeAt, newsStandingOf } from '../spotlight'
import type { LoveEpisode } from '../../../shared/protocol/narrative'
import type { TierId } from '../../season/types'
import type { WorldState } from '../state'

// 10. THE BOOTH – ⚠⚠ THE WEEK IT SAYS IT OUT LOUD (the spotlight, wave 6: T7) –
// `docs/plans/the-way-she-sounds-2026-09.md` C4, `docs/plans/life-wave-6-builder-2026-09.md`
// §2 T7, the window in `ECONOMY.spotlight.newsWindowWeeks`. §9 above is the week the WORLD
// finds out; this is the week a commentator fills a changeover with it, and the two are one
// system by the owner's own 10.09 ruling.
//
// owner (booth), 10.09: «личная жизнь спортсменов часто на виду, т.е. что-то вполне может быть и про частную жизнь»…
// ⚠⚠ booth: ZERO DRAWS, ON ANY STREAM, AND IT IS THE WAVE'S DESIGN RATHER THAN A LIMITATION
// ⚠⚠ booth: AND IT READS THE STAMPS WITHOUT RE-JUDGING THEM
// ⚠⚠ booth: WHERE IT RUNS IS THE ARCHITECT'S OWN QUESTION (ruling P's ⚠ to this task) – step 5 `playHerWeek`, the match in hand
// ⚠⚠ booth: AND THAT IS NOT A SECOND CLOCK
// ⚠ booth: A RUN SHE DOES NOT WATCH IS STILL A RUN THAT AIRED.
// → docs/notes/life-beats/booth.md#boothts-10--the-booth

/** ⭐⭐ WHAT THE BOOTH MAY TOUCH AT `week`, or null – the LICENCE, and a null here means the
 *  section writes nothing at all.
 *
 *  ⚠⚠ boothMentionDue: ITS OWN PREDICATE FOR `leakEligible`'s STATED REASON
 *  ⚠ boothMentionDue: A NEGATIVE AGE IS OUT TOO
 *  ⚠ boothMentionDue: MET BEFORE ENDED, AND IT IS TWO PASSES RATHER THAN ONE
 *  ⚠ boothMentionDue: THE EPISODE ORDER IS THE LIST'S OWN
 *  → docs/notes/life-beats/booth.md#boothmentiondue--what-the-booth-may-touch-at-week-or-null
 */
export function boothMentionDue(
  world: WorldState,
  week: number,
): { episode: LoveEpisode; kind: 'met' | 'ended' | 'divorced' } | null {
  const window = ECONOMY.spotlight.newsWindowWeeks
  /** Is a fact stamped at `at` still inside the window at `week`? ⚠ INCLUSIVE at the far edge –
   *  «a fact OLDER than `newsWindowWeeks` is never aired» – and closed at the near one. */
  const stillNews = (at: number): boolean => week - at >= 0 && week - at <= window
  for (const ep of loveEpisodesOf(world)) {
    if (ep.publicWeek === null || ep.airedMetWeek !== null) continue
    if (stillNews(ep.publicWeek)) return { episode: ep, kind: 'met' }
  }
  for (const ep of loveEpisodesOf(world)) {
    if (ep.publicWeek === null || ep.endedWeek === null || ep.airedEndedWeek !== null) continue
    // ⭐⭐⭐ v88 (the parting, wave 12 – T5) – AND THE WORLD NAMES IT WHERE IT ALREADY KNEW. A PURE
    // READ of the same row, on the same licence, in the same window: nothing about WHETHER the booth
    // speaks moves, only WHICH fact it has. ⚠ THE GATE IS UNTOUCHED AND THAT IS THE WHOLE OF §6 –
    // openness already decided whether the world ever knew of them (`publicWeek`, the leak's own
    // multipliers) and standing already decides whether it is spoken, so a quiet girl's quiet
    // divorce stays hers and a star's is news. This wave adds the words to that machinery, not a
    // dial – which is his ruling 1 answered by inheritance rather than by invention.
    if (stillNews(ep.endedWeek)) return { episode: ep, kind: ep.latchedWeek !== null ? 'divorced' : 'ended' }
  }
  return null
}

/** ⭐⭐⭐ THE WEEKLY BOOTH MENTION, and the ONE writer of `airedMetWeek` and `airedEndedWeek` in
 *  the engine. Called from `playHerWeek`'s play arm – see the §10 banner for why that step and
 *  not the life block's.
 *
 *  ⚠⚠ airBoothMention: `tier` IS THE EVENT SHE IS ABOUT TO PLAY, HANDED DOWN, AND IT IS WHAT MAKES THE STEP HONEST.
 *  ⚠ airBoothMention: REQUIRED AND NOT DEFAULTED
 *  ⚠⚠ airBoothMention: AND THE NEWS GATE DESCRIBES THE **LAST CLOSED WEEK**
 *  ⚠ airBoothMention: AT MOST ONE FACT A WEEK, BY CONSTRUCTION RATHER THAN BY A COUNTER
 *  → docs/notes/life-beats/booth.md#airboothmention--the-weekly-booth-mention--the-one-writer-of-airedmetweek
 */
export function airBoothMention(world: WorldState, tier: TierId): void {
  if (!atOrAboveStageBar(tier)) return
  // ⭐ D1 (14.09): the booth's «fame band that makes her news» is the STANDING now – both non-quiet
  // bands may be voiced (its own big-stage requirement already makes every mention an occasion).
  if (newsStandingOf(world) === 'quiet') return
  // ⚠⚠ ONE FACT A WEEK, AND IT IS A PROPERTY OF THE **WEEK** RATHER THAN OF THE CALL COUNT. The tick
  // reaches this line once a week today (one entered event, one play arm), so this guard fires for
  // nobody – which is exactly why it is here: «at most one fact per week» is a claim about the
  // world, and a claim that holds only because nobody calls twice is a claim the next caller breaks
  // in silence. Asked through `boothPrivateLifeAt`, the same read the snapshot ships, so «has the
  // booth spoken this week» has ONE spelling and the guard cannot drift from the packet.
  if (boothPrivateLifeAt(world, world.week) !== null) return
  const due = boothMentionDue(world, world.week)
  if (due === null) return
  // ⭐⭐⭐ THE STAMP IS THE ONCE-NESS – one assignment, and the fact can never be voiced again.
  //
  // ⚠ airBoothMention: v88 (wave 12 – T5): `'divorced'` STAMPS `airedEndedWeek`, THE SAME FIELD, and that is right rather than a shortcut.
  // → docs/notes/life-beats/booth.md#airboothmention--the-stamp-is-the-once-ness--one-assignment
  if (due.kind === 'met') due.episode.airedMetWeek = world.week
  else due.episode.airedEndedWeek = world.week
  // ⚠ AND NO FEED ROW, WHICH IS DELIBERATE AND NOT AN OMISSION. The exposure week's one legible row
  // is T3's (`EXPOSURE_ROW`, raised inside the spirit pass on the tick that prices this event), and
  // §3c's legibility law is «one row per week, not per event – the feed is not a ledger». A second
  // row here would print the same week twice, in two voices, one tick apart.
}
