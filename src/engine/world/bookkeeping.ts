// ⭐ R2-10 STEP 2 – CLOSING THE BOOKS ON A RESOLVED WEEK: the rank recompute, the prunes and the
// rolling calendar.
//
// ⚠ THESE ARE SHARED BY THREE PATHS AND THEREFORE BELONG TO NONE OF THEM. A normal week closes
// inline from `tickWeek`'s last phase; a REVEAL week defers the same two steps to
// `finalizeTournament` (so the rank milestones keep their id order behind the kid's own match and
// summary events); and `skipEvent` runs them too, because a skipped event week has to close exactly
// like a normal non-playing one. Putting them inside the AI phase would have left the other two
// importing a phase – or, far worse, growing a second copy of the closing order.
//
// ⚠ `ensureSeason` CAME WITH `housekeep`, WHICH IS ITS ONLY WEEKLY CALLER, and is re-exported from
// `engine/world` under its historical name – `createWorld` and `seedWorldForV6` still call it, and
// the App's "New events on the calendar" marker is still the string emitted from here.
//
// ⚠ ZERO DRAWS, ON ANY STREAM. Pruning is filtering, the rank recompute is arithmetic over the
// ledger, and `buildSeason` runs on `${seed}:s<chunk>` – a calendar block is a pure function of the
// seed and the chunk index, which is what makes content free (see the note on `ensureSeason`).
import type { WorldEvent } from '../../shared/protocol'
import type { WorldState } from './state'
import { buildSeason } from '../season/calendar'
import { pruneEntryLetters } from '../offers'
import { EVENTS_CAP, EVENTS_ORDINARY_FLOOR, FINANCE_WEEKS, KID_ID, RESULTS_WINDOW, SEASON_CHUNK, SEASON_MIN_FUTURE } from './constants'
import { addEvent } from './ledger'
import { captureBreakEven } from './milestones'
import { recomputeKidRank } from './ladder'
import { prunePlannerBookings, pruneInternationalEntries } from './planner'

// --- rolling calendar --------------------------------------------------------
// Extend the season in whole deterministic year-blocks until at least
// SEASON_MIN_FUTURE weeks ahead are scheduled, then drop resolved (past) weeks and
// any entries pointing at events that no longer lie in the future.
export function ensureSeason(world: WorldState): void {
  // Round 5 item 23: notify the player when a NEW block of the calendar appears –
  // but not for the very first block a career/migration ever generates (nothing to
  // be "new" about a calendar the player has never seen yet).
  const hadSeason = world.season.length > 0
  const horizonChunk = Math.floor((world.week + SEASON_MIN_FUTURE) / SEASON_CHUNK)
  let maxWeek = world.week
  for (const e of world.season) if (e.week > maxWeek) maxWeek = e.week
  let coveredChunk = world.season.length ? Math.floor(maxWeek / SEASON_CHUNK) : -1
  while (coveredChunk < horizonChunk) {
    coveredChunk++
    const start = coveredChunk * SEASON_CHUNK
    world.season.push(...buildSeason(`${world.seed}:s${coveredChunk}`, start, SEASON_CHUNK, world.profile.background))
    if (hadSeason) addEvent(world, { week: world.week, type: 'info', text: 'New events on the calendar' })
  }
  world.season = world.season.filter((e) => e.week >= world.week).sort((a, b) => a.week - b.week)
  const future = new Set(world.season.filter((e) => e.week > world.week).map((e) => e.id))
  world.entries = world.entries.filter((id) => future.has(id))
}

// Step 5 of a resolved week: recompute the kid's rank vs the whole field and fire rank milestones.
// Shared by a normal tick (inline) and finalizeTournament (deferred for a reveal week).
export function recomputeRankAndMilestones(world: WorldState): void {
  world.prevKidRank = world.kidRank
  // All THREE "before" values, captured together, so no surface can diff across two tables.
  world.prevKidRankDomestic = world.kidRankDomestic ?? null
  world.prevKidRankWta = world.kidRankWta ?? null
  // ⚠ ONE WRITER, ONE MEANING. This used to rank with `computeRanking(results, week, ids)` and NO
  // track predicate - so it folded BOTH ladders into one table and wrote that into `kidRank`, while
  // `recomputeKidRank` wrote the ITF rank into the same field and `computeStandings` rendered the
  // ITF table. Whichever ran last won, so Home and the season wrap-up showed her combined-table
  // place (#4 on 604 points) while the Stats table showed her ITF row (#128 on 4) - the owner's
  // playtest finding, and four items on his list are this one bug wearing different clothes.
  //
  // The two-ladder slice removed `kidPoints`' default track for exactly this reason; this call site
  // survived because it reached for `computeRanking` directly instead. It now defers to the one
  // function that owns the caches, so the field cannot mean two things again.
  recomputeKidRank(world)
  // W2-ENDINGS: ...and the ONE milestone this step still fires. It lives here because this is the
  // step that runs on BOTH paths – inline on a normal week, deferred to finalizeTournament on a
  // reveal week – which is exactly the pair the crossing can land on (the cheque arrives at
  // finalize; the costs arrive on any week at all). Idempotent, so being reached twice is free.
  captureBreakEven(world)
  // Rank milestones ("top 10/50/1") intentionally removed: in the early season almost no one
  // has points, so the first result rockets her to a single-digit rank and all of them fire at
  // once (reads absurdly). A real "world" ranking belief system belongs to the world-news
  // feature (Phase 4+), not this placeholder cohort ranking.
}

// Step 6 of a resolved week: prune ledgers/feeds, roll the calendar forward.
export function housekeep(world: WorldState): void {
  pruneResults(world)
  pruneEvents(world)
  pruneFinanceWeeks(world)
  prunePlannerBookings(world)
  pruneInternationalEntries(world)
  // W2-LADDER §6: the tournament desk's receipts age out after a year; contracts never do.
  world.offers = pruneEntryLetters(world.offers, world.week)
  ensureSeason(world)
}

function pruneResults(world: WorldState): void {
  world.results = world.results.filter((r) => world.week - r.week <= RESULTS_WINDOW)
}

// ⚠ HER MATCHES ARE PRUNED LAST, AND THE RADAR IS WHY (31.07).
//
// `radarViewOf` builds the radar's whole evidence base by scraping `world.events` for her own
// competitive match records - and this function trims that feed BY COUNT, oldest-first. Those two
// facts together make an undocumented coupling with teeth: **every non-match row any feature adds
// permanently displaces one of her matches from the window `axisEvidence` measures over.** The
// offers slice found it the expensive way - one extra row per season pushed the radar's worst fog
// re-widening from 0.36 to 0.64 against a 0.5 bound - and designed around it rather than into it.
//
// Designing around it does not scale, because the pressure is not the new feature. Measured on a
// career that plays no tournaments at all, the retained feed is 217 expense + 168 income rows out
// of 400: the window the radar reads is **overwhelmingly bookkeeping**. Money rows accrue every
// single week of a career; her matches accrue only on the weeks she competes. Left alone, the
// arithmetic guarantees that the longer a career runs the less of her tennis the radar can see -
// which is the exact opposite of what a confidence model is supposed to do.
//
// So the budget is unchanged and only the ORDER OF SACRIFICE moves: milestones first (they always
// were), then her competitive matches, then everything else. The cap still bites at the same size,
// the feed is still bounded, and a feature that writes to the feed can no longer quietly cost the
// radar its evidence. A practice friendly is deliberately NOT protected - the radar ignores
// friendlies by design (R11-2), so protecting one would spend the budget on a row it will not read.
function isRadarEvidence(e: WorldEvent): boolean {
  return e.match !== undefined && !e.friendly && (e.match.aId === KID_ID || e.match.bId === KID_ID)
}

// ⚠⚠ ...AND THE ORDER OF SACRIFICE IS NOT ALLOWED TO REACH ZERO (fix/wallet-and-wrapup, 05.08).
//
// The paragraph above is still the rule and still right: an ordinary row is cheaper to lose than one
// of her matches. What it did not say is what happens when the protected class STOPS LEAVING ROOM,
// and the answer was measured on the owner's own save at week 412: 382 match rows + 18 kept
// milestones = 400 = the whole cap, `rest` empty, and therefore EVERY income and expense row of
// EVERY week deleted on the tick that wrote it. His week recap read «FINANCES · Income +$0 · Spent
// +$0» beside three real matches, and the Money screen's ledger tab had no transactions at all.
//
// The asymmetry is structural rather than accidental: ordinary rows are a FLOW (2-6 a week, for
// ever) and her matches are a STOCK, so absolute priority for the stock is not a preference between
// two competing classes – it is a guarantee that the flow reaches zero on a long enough career. The
// two ledger-side fixes in this wave (the recap's money, the wrap-up's best result) mean no SCREEN
// depends on this any more, but the feed still owns things nothing else records – the flavour lines,
// the ledger's individual transactions, the tournament summary the travel note quotes – and none of
// those is reconstructible from a per-category total. So the newest `EVENTS_ORDINARY_FLOOR` of them
// are off the table until her matches have been trimmed to their own share. See constants.ts.
function pruneEvents(world: WorldState): void {
  if (world.events.length <= EVENTS_CAP) return
  const kept = world.events.filter((e) => e.keep)
  const evidence = world.events.filter((e) => !e.keep && isRadarEvidence(e))
  const rest = world.events.filter((e) => !e.keep && !isRadarEvidence(e))
  const overflow = world.events.length - EVENTS_CAP
  // Ordinary rows go first, oldest-first, but only down to the floor.
  const sacrificeable = Math.max(0, rest.length - EVENTS_ORDINARY_FLOOR)
  const fromRest = Math.min(overflow, sacrificeable)
  let stillOver = overflow - fromRest
  // Then her matches, oldest-first as before.
  const fromEvidence = Math.min(stillOver, evidence.length)
  stillOver -= fromEvidence
  const evidenceTrimmed = evidence.slice(fromEvidence)
  // And only when trimming every match she has ever played is STILL not enough does the floor
  // itself give way – a career whose kept milestones alone approach the cap.
  const restTrimmed = rest.slice(fromRest + stillOver)
  world.events = [...kept, ...evidenceTrimmed, ...restTrimmed].sort((a, b) => a.id - b.id)
}

// Drop finance-ledger weeks older than the 60-week trailing window (retain week >= week - 59).
// Bounded by career length, not event volume, so it stays ≤ ~60 entries no matter the season.
function pruneFinanceWeeks(world: WorldState): void {
  world.financeWeeks = world.financeWeeks.filter((w) => w.week >= world.week - (FINANCE_WEEKS - 1))
}
