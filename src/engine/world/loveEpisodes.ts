// THE ATTACHMENT RECORD, AS TWO QUESTIONS ASKED OF A LIST – the private life's episodes, and who is
// there right now.
//
// ⭐⭐ AND SINCE v75 (wave 4, T2) THERE IS ALSO ONE WRITER HERE, WHICH IS A CHANGE OF CHARACTER AND SO
// IS SAID OUT LOUD. This module held nothing but derivations for two waves; `endEpisode` below is the
// first line in it that moves a byte. It is here rather than in `world/lifeBeat.ts` because it is the
// mirror of `activeEpisode` – the selector answers «is someone there NOW» by reading `endedWeek`, and
// the writer is the ONE place that field is ever set – and a writer parked away from the reading it
// invalidates is how two spellings of «over» get born. The HAZARD that decides whether it is called
// stays in `lifeBeat.ts` §8, beside the arrival's, because that is a question about the week and not
// about the list.
//
// ⚠⚠ DEPENDENCY DIRECTION, AND IT IS THE WHOLE REASON THIS FILE EXISTS (wave 3, T4 – 11.09). These
// two selectors were declared in `world/lifeBeat.ts` when T1 shipped them, which was the right home
// while the only readers were the beat machinery and the arrival hazard. T4 gives `engine/spirit.ts`
// a reader too – `accrueSpirit` walks toward `baseline + attachmentLift` while the slot is full –
// and `lifeBeat.ts` imports `applyBondDelta`, `bondBandOf`, `moodRegisterOf`, `spiritBandOf`,
// `temperamentFor` and `temperamentOpenness` from `../spirit` at RUNTIME. So `spirit.ts ->
// lifeBeat.ts` would have closed a value-import loop, and `src/engine/world/*` has had none.
//
// The same two ways out `world/constants.ts` records for `guardNotEndedForGood`, and the same
// choice: a second copy of the derivation inside `spirit.ts`, or the derivation moved to a leaf both
// modules can read. A second copy is unthinkable here in particular – `activeEpisode` IS the whole
// of «is someone in her life right now», and two spellings of it is the `temperamentFor` defect one
// layer down. So it moved, VERBATIM, comments and all, and `world/lifeBeat.ts` now imports it back.
//
// ⚠ THE ONE IMPORT BELOW IS `import type`, erased at compile time, so this module is the bottom of
// the graph in `world/constants.ts`'s own sense: it reaches nothing at runtime and everything may
// reach it. `engine/spirit.ts` already imports three `world/*` leaves this way (`age`, `bookings`,
// `ledger`); this is the fourth.
//
// ⚠ NOTHING ABOUT EITHER FUNCTION CHANGED IN THE MOVE. The tail reading, the `?? []` courtesy and
// the ruling behind both are the text they arrived with; `tests/wave3-love-episodes.test.ts` §A is
// their net and it did not move either – it imports them from the `engine/world` barrel, which
// re-exports them from here under the same two names.
import type { LoveEpisode } from '../../shared/protocol/narrative'
import type { WorldState } from '../world'

/** ⭐⭐ v74 (the private life, wave 3) – EVERY ATTACHMENT THIS CAREER HAS LIVED, in the order it
 *  lived them. Append-only and never pruned: the census and the album both read the whole life
 *  later, and a row dropped for tidiness is a biography with a hole in it – `lifeLogOf`'s own rule.
 *
 *  ⚠ THE `?? []` IS THE SAME COURTESY `lifeLogOf` EXTENDS and for the same reason: v74 makes the
 *  field required and back-fills `[]`, so no SAVE reaching this line can be missing it, but probe
 *  worlds hand-built in tests are not saves and predate every field they do not set. */
export function loveEpisodesOf(world: WorldState): readonly LoveEpisode[] {
  return world.loveEpisodes ?? []
}

/** ⭐⭐⭐ THE ACTIVE ATTACHMENT, DERIVED AND NEVER STORED – the LAST row, and only if it is still
 *  open; null when nobody is there. This function is the whole of «is someone in her life right now»:
 *  there is no `world.partner` slot and there must never be one.
 *
 *  ⚠⚠ EPISODES RATHER THAN A SLOT IS THE 09.09 RE-CUT (review find #5), and this signature is where
 *  it is paid for. A romance that begins AND ENDS before the parent ever knew must survive save and
 *  reload intact and surface later as one honest late row; a stored «current partner» would have
 *  been overwritten out of existence the next time someone appeared. So the list keeps everything
 *  and the CURRENT one is a question asked of it, which cannot desync from the rows it reads.
 *
 *  ⚠⚠ THE TAIL DECIDES, AND IT IS A RULING (architect, 11.09) rather than a reading. The brief's
 *  prose said «the LAST row with `endedWeek === null`» while the brief's own enumerated test list
 *  said «open row then ended row -> null», and on the shape `[open, ended]` those two disagree. The
 *  builder implemented the prose; this is the reversal, on three grounds.
 *
 *  1. The divergence is UNREACHABLE. Rows are appended in calendar order and the arrival hazard
 *     refuses to draw while this is non-null (T3's eligibility), so only the TAIL can ever be open.
 *     On every state the sim can actually produce, the two readings return the same row.
 *  2. On unreachable data the tail reading FAILS SAFE and the scan fails STUCK. A row mis-ended by
 *     some future bug leaves the scan pinned non-null for the rest of the career – no arrival ever
 *     again, a permanent +5 baseline lift, and no error anywhere to say so. The tail reading lets
 *     the cooldown run and the career recover.
 *  3. Where prose and an enumerated list disagree, the list is the more specific statement.
 *
 *  ⚠ NOTHING IS LOST FROM THE RECORD EITHER WAY, which is what makes this cheap: the archive is
 *  `loveEpisodes` itself and every row stays in it. This function answers only «is someone there
 *  NOW». `pendingLifeBeat` (world/lifeBeat.ts) takes the FIRST unanswered row for the opposite and
 *  equally deliberate reason – a queue that answered its newest entry first would lose the oldest.
 *
 *  ⚠ IT READS `endedWeek` AND NEVER `knownWeek`. Whether the parent has been TOLD is a different
 *  question from whether someone is there, and conflating them would make a private girl single.
 *
 *  ⭐⭐ AND SINCE T4 IT IS ALSO THE SWITCH UNDER SPIRIT'S EFFECTIVE BASELINE (§1b): `accrueSpirit`
 *  walks toward `baseline + attachmentLift` for exactly as long as this returns a row, and toward a
 *  flat `baseline` the week it stops. That is «lifts a little and stays lifted» said once – there is
 *  no bump anywhere, and the lift arrives and leaves through the standing return rule alone. */
export function activeEpisode(world: WorldState): LoveEpisode | null {
  const last = loveEpisodesOf(world).at(-1) ?? null
  return last !== null && last.endedWeek === null ? last : null
}

/** ⭐⭐⭐ v75 (the private life, wave 4 – T2) – IT ENDS. The ONE writer of `endedWeek` in the engine,
 *  and the whole of what an ending IS: a week written onto the row that was open.
 *
 *  ⚠⚠ THE ROW STAYS. NOTHING IS NULLED AND NOTHING IS PRUNED, and that is the ruling rather than an
 *  implementation detail – `loveEpisodesOf`'s own append-only law read from the other end. The album
 *  and the census read a whole life back seasons later, so an attachment that is over is a row with a
 *  second date on it, never a row that stopped existing. `knownWeek`, `wants` and both ids are left
 *  exactly as they were: whether the parent was ever told is a FACT about the past and an ending does
 *  not un-tell it, and wave 4's told-late scene (T4) is built by reading those two dates against each
 *  other. A step that tidied `knownWeek` to null here would delete the scene.
 *
 *  ⚠⚠ AND THE ACTIVE SLOT EMPTIES BY ITSELF, WHICH IS WHY THIS FUNCTION IS FOUR LINES. `activeEpisode`
 *  is DERIVED – read its own ⚠⚠ notes above – so writing the date is the whole of «she is single
 *  again»: the selector goes null on the same tick, `arrivalEligible`'s clause 2 opens, its clause 3
 *  (the cooldown, shipped dormant in wave 3 and LIVE from this commit) starts counting from this very
 *  week, and `accrueSpirit`'s effective baseline drops back to the flat one by the same reading. Not
 *  one of those four is written here, and none of them can desync from this date, because none of
 *  them is stored.
 *
 *  ⚠ IT ENDS THE **ACTIVE** ROW AND NEVER A NAMED ONE, so «which attachment is over» has exactly one
 *  spelling in this layer and it is the same one «is someone there» has. A future caller that wanted
 *  to end some older row would be asking a question this layer does not have – rows are appended in
 *  calendar order and only the tail can ever be open (`arrivalEligible` clause 2 is what makes that
 *  true), so there is never a second candidate.
 *
 *  ⚠ NOTHING TO END IS A QUIET NO-OP RATHER THAN A THROW, on `deliverKnownPartner`'s own precedent
 *  one module over: the weekly tick asks its questions of whatever world it is handed, and a probe
 *  world or a career that never met anybody is not an error condition. The CALLER gates first
 *  (`endsEligible`, world/lifeBeat.ts §8) so that an ineligible week takes zero draws; this line is
 *  the second lock on the same door and costs nothing.
 *
 *  ⚠ IT WRITES `endedWeek` AND **NOTHING ELSE ANYWHERE**. The spirit shock is T3's, the `'ended'` beat
 *  is T4's and the feed row is T5's – that commit order is the design, not a staging convenience, and
 *  a spirit or `lifeLog` line appearing in this function is the red flag it was written to make
 *  visible. */
export function endEpisode(world: WorldState, week: number): void {
  const open = activeEpisode(world)
  if (open === null) return
  open.endedWeek = week
}

/** ⭐⭐ v74 (wave 3, T6) – THE ATTACHMENT THE PARENT HAS ACTUALLY BEEN TOLD ABOUT, or null. The
 *  active one, and only once its `knownWeek` has arrived.
 *
 *  ⚠⚠ TWO QUESTIONS, NOT ONE, AND THIS IS THE SECOND OF THEM. `activeEpisode` answers «is someone
 *  there»; this answers «does he know». They are deliberately different for as long as the lag lasts
 *  – spirit's baseline is already lifted while this still returns null, which is the design saying
 *  the parent sees a lighter week before he is told why (who-she-is §2a). Conflating them would make
 *  a private girl single, which is the warning `activeEpisode`'s own note ends on.
 *
 *  ⚠ IT ASKS THE ACTIVE ROW AND NOT THE LIST, so «not ended» keeps ONE spelling in this module. The
 *  reading that follows is the one T6 delivers on and the one `DiaryFacts.partnerKnown` carries: an
 *  attachment that ended before the parent ever heard of it surfaces through wave 4's endings copy,
 *  not through a fact that says somebody is there now.
 *
 *  ⚠ THE WEEK IS A PARAMETER RATHER THAN `world.week`, for `kidAgeAt`'s own reason one layer up: the
 *  album and the memory card ask about weeks that are seasons behind, and a selector that could only
 *  answer «today» would have to be re-derived at every one of them. */
export function knownPartner(world: WorldState, week: number): LoveEpisode | null {
  const open = activeEpisode(world)
  if (open === null || open.knownWeek === null) return null
  return open.knownWeek <= week ? open : null
}
