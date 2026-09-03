// ⭐⭐⭐ ROUND 35 #14 – THE WEEK THE DRAW HAPPENS, WRITTEN DOWN.
//
// THE OWNER, 03.09: «на неделе перед турниром случилась жеребьевка, мне сказали "играем против №118
// шанс 71%", пошел турнир - соперник в первом раунде №76».
//
// The diagnosis is on `WorldState.drawnFirstRounds` and it is short: the draw was never stored, so
// every reader re-derived it from inputs that move every week. This module is the writer, and it has
// exactly one job – when a card names an opponent, that name becomes a fact.
//
// ⚠⚠ IT RECORDS WHAT THE CARD SAYS, IT DOES NOT COMPUTE A SECOND ANSWER. `makeEventPreviewer` is the
// Season card's OWN builder – the same tables, the same rested build, the same W context – and
// `preview.opponentId` is stored straight off it. That is the whole design decision in this file,
// and it is the cure for this repository's named recurring disease, two surfaces answering one
// question. A recorder that assembled its own ranking, its own condition map and its own standing
// table would be a second derivation that AGREES today, and agreeing is not identical: the card and
// the fact behind it would part on the first day somebody changed one of the two.
//
// ⚠ AND IT SPENDS THAT BUILDER ON THE DRAW WEEK ALONE, WHICH IS THE OTHER HALF OF WHY THE FACTORY
// EXISTS. The first cut called `upcomingEvents` outright, which previews the whole eight-week window:
// measured at 14.8 ms a call against 0.15 ms for the ranking folds inside it – the cost is per EVENT,
// and there are about twenty. Run twice a tick, that took `tests/condition.test.ts` from 9.2 s to
// 40.4 s and blew B1's 20 s timeout, which is a real regression and not a machine (the control tree
// ran the same file green in 9.2 s). A published draw concerns the handful of events one week out,
// so those are the only ones previewed.
//
// ⚠ ZERO DRAWS ON ANY STREAM. The preview is a pure reader; every purpose-scoped sub-stream inside it
// is created fresh at the call site, read and thrown away, exactly as on every snapshot the UI has
// ever built. The MAIN weekly stream is not touched, so the frozen capture (41550 / e6b0c709) cannot
// move – and it did not.
//
// ⚠ AND THE SUB-STREAM KEYS ARE DELIBERATELY NOT SPELLED OUT ABOVE. `tests/preview.test.ts` greps
// every `world/*.ts` for the weather's key and reddens on a literal match, because the day the
// simulation reads the decorative weather is the day it stops being free – see `eventCrowd` in
// season/preview.ts for the whole ruling. A file that only NAMES the key in prose would trip that
// guard for nothing, and weakening a grep guard to let a comment through is the wrong trade.
//
// ⚠ WRITE-ONCE. An event already in the table is never re-read and never overwritten, which is what
// makes the fact a fact: the recorder runs twice a week (see `tickWeek`) and a career is loaded and
// re-loaded, and none of that may move a published draw.
import type { WorldState } from './state'
import { DRAW_LEAD_WEEKS } from '../season/preview'
import { makeEventPreviewer } from './snapshot'

/** ⭐ THE WRITER. Every event whose draw is being SHOWN this week – `drawMade`, i.e. within
 *  `DRAW_LEAD_WEEKS` – and which is not already recorded, gets its first-round opponent stored.
 *
 *  ⚠⚠ AND ONLY THE EVENTS SHE HAS ENTERED, WHICH IS A NARROWING AND IS ARGUED FOR RATHER THAN
 *  ASSUMED. The first cut recorded every event one week out, on the reasoning that `drawMade` is not
 *  gated on entry so a name on an un-entered card is still a name on screen. Two things overturned it:
 *
 *    1. THE PRINCIPLE. A draw is made for a tournament she is IN. On a card for an event she did not
 *       enter there is no draw containing her at all – `drawnField` splices her into a field she will
 *       never stand in, so the girl it names is a HYPOTHETICAL («who you would meet if you were
 *       there»), and freezing a hypothetical freezes nothing. Entries close at the end of week − 2
 *       (`makeEvent`'s `deadlineWeek`), so by the week the name appears the question is already
 *       settled: she is in or she is not, and no reading of that card can change it.
 *    2. THE PRICE. Measured A/B against a worktree at this branch's head with the change absent,
 *       3 x 156 ticks: **1.58 s -> 3.40 s, a 2.16x weekly tick**. The events one week out average
 *       3.63 and the W rungs are the dear ones (`weekFieldExclusion` draws the higher rungs' fields
 *       to answer, 0.65-0.95 ms each against 0.20-0.25 ms for a junior or domestic rung). She enters
 *       at most ONE event a week, so this is the same fact for a tenth of the work.
 *
 *  ⚠ WHAT THE NARROWING GIVES UP, NAMED SO IT IS NOT DISCOVERED LATER: an un-entered card's name can
 *  still move within its one week on screen, if a reveal is finalised between two looks at it.
 *  Measured before any of this: **3 of 466** pre/post-finalize card pairs (tools/r35-draw-fact.ts).
 *  For an event she IS playing that number is now zero, which is the number the item is about.
 *
 *  ⚠ AND IT EARLY-OUTS BEFORE PAYING FOR ANYTHING. Building the previewer folds the standings and
 *  rates the cohort per surface; the week's window is checked against the table first, so a week with
 *  nothing new to record costs one pass over `world.season` and not one fold. Most weeks are that
 *  week.
 *
 *  ⚠ IDEMPOTENT AND ORDER-FREE: it writes only keys that are absent, so calling it twice in a tick,
 *  or on a save that has just been loaded, cannot move a byte. */
export function recordDrawnFirstRounds(world: WorldState): void {
  const due = world.season.filter(
    (e) =>
      e.week > world.week &&
      e.week - world.week <= DRAW_LEAD_WEEKS &&
      world.entries.includes(e.id) &&
      world.drawnFirstRounds?.[e.id] === undefined,
  )
  if (due.length === 0) return
  const table = (world.drawnFirstRounds ??= {})
  const previewer = makeEventPreviewer(world)
  for (const e of due) {
    // ⚠ A card can be showing a draw and still name nobody – she is not in her own bracket, or the
    // rung fields nobody this preview can rate. `EventPreview` says null there rather than inventing
    // a reading, and so does this: an absent key means «no draw was ever shown», which is exactly
    // right, and the next week cannot re-ask because the event has already arrived.
    const opponent = previewer.firstRound(e)
    if (opponent) table[e.id] = opponent.id
  }
}

/** ⭐ THE HOUSEKEEPING. A published draw is worth keeping until it has been played and no longer.
 *
 *  ⚠ THE CUT IS `event.week < world.week`, AND THE STRICT INEQUALITY IS LOAD-BEARING. Her own
 *  competition (`playHerWeek`, tick step 5) reads the table for an event AT `world.week`, so a rule
 *  that dropped the current week's rows would delete the promise on the very tick that has to keep
 *  it. Rows for events the calendar no longer holds go too – `ensureSeason` rolls the season
 *  forward and an id it has dropped can never be read again. */
export function pruneDrawnFirstRounds(world: WorldState): void {
  const table = world.drawnFirstRounds
  if (!table) return
  const live = new Map(world.season.map((e) => [e.id, e.week]))
  for (const id of Object.keys(table)) {
    const week = live.get(id)
    if (week === undefined || week < world.week) delete table[id]
  }
}
