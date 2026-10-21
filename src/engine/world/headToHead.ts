// ⭐ ROUND 53 · STEP 6 – THE RECORD BETWEEN HER AND THE GIRL ACROSS THE NET (round 17 #22, priced
// 12.08, the owner's word 21.10: «добавим что недорого»).
//
// A PURE READ OF `world.events`, derived at snapshot time and persisting nothing – no schema move, no
// draw. The booth and the preview say what it finds (`viz/commentary.ts`, `viz/preview.ts`); this
// file only counts.
//
// ⚠ THE RECORD IS «AS FAR AS THE FEED REMEMBERS», and that is the whole honesty clause. `world.events`
// is count-capped (`EVENTS_CAP`, `pruneEvents` in bookkeeping.ts) and her competitive matches go
// oldest-first once the cap bites, so on a long career the first meetings with a girl she has known
// for years are gone and the head-to-head starts at the oldest match still in the feed. The copy is
// written to say only things that stay true of a TRUNCATED record («she has never beaten her» is the
// one claim a cut-off start can make false, and only for a career longer than the feed – a trade the
// owner priced «недорого» on 21.10).
//
// ⚠ EXACT SHORT-NAME MATCH, as the brief states: the key is `formatShortName(match.oppName)`, the same
// spelling `PendingView.opponent.name` carries. A spelling that differs at all is a different girl
// here. Two cohort players who share a short name would be merged – the id would be sharper, but the
// feed row stores the display name and the pending view hands the screen the same short spelling.
//
// ⚠ PRACTICE ROWS ARE NOT MEETINGS (`friendly`): a hit-out against a sandbox partner is not a result
// either of them carries into a draw. The CURRENT tournament's own rows are skipped too (`skipEventId`)
// – a bracket never pairs the same two girls twice, so any row of this event is a different opponent,
// but the guard keeps the count honest if a row for the match on deck was already written.
import { formatShortName } from '../../shared/format'
import type { HeadToHead } from '../../shared/protocol/competition'
import { KID_ID } from './constants'
import type { WorldState } from './state'

/** How far back «this year» reaches: a rolling 52 weeks, the calendar's own season length. */
const YEAR_WEEKS = 52

export function headToHead(world: WorldState, opponentShortName: string, skipEventId?: string): HeadToHead | null {
  let meetings = 0
  let wins = 0
  let recent = 0
  let lastWeek = -1
  let lastWon = false
  let lastSets: number | null = null
  for (const e of world.events) {
    const m = e.match
    if (!m || e.friendly) continue
    if (skipEventId !== undefined && m.eventId === skipEventId) continue
    if (formatShortName(m.oppName) !== opponentShortName) continue
    meetings++
    const won = m.winnerId === KID_ID
    if (won) wins++
    if (world.week - e.week < YEAR_WEEKS) recent++
    // events are kept in id order, which is write order; `>=` so two rows in one week keep the later
    if (e.week >= lastWeek) {
      lastWeek = e.week
      lastWon = won
      // a retirement's scoreline is partial by construction (MatchRecord.retiredId), so it says nothing
      // about how many sets the meeting went
      lastSets = m.retiredId === undefined && m.score ? m.score.trim().split(/\s+/).length : null
    }
  }
  if (meetings === 0) return null
  return { meetings, wins, losses: meetings - wins, lastWeek, lastWon, lastSets, recent }
}
