// THE MANDATORY REGIME AND THE PENALTY LEDGER (W3-ACT2, act2-pro-tour.md §6).
//
// The owner's spec, verbatim canon: «10 штрафных очков за 52 недели -> отстранение на 4 недели.
// Источники: пропуск обязательного турнира, поздний отказ, неявка. Обязательные турниры только для
// топ-50: 4 Шлема, 1000-ки, шесть 500-к. Пропущенный обязательный турнир ЗАНИМАЕТ один из 16
// зачётных слотов нулём.» Every number is in ECONOMY.mandatory; everything here is logic that reads
// it, so the regime can be retuned without touching a line of this file.
//
// ⚠⚠ THE TOUR PUNISHES; THE GAME NEVER DOES. «Мы ни за что не наказываем» is a standing ruling and
// it is what SHAPES this file rather than a note about its tone. Three of the four rules it lands as
// are enforced here in exactly one place each (the fourth is the copy, which lives in the letters):
//
//   * ANNOUNCED BEFORE IT CAN BITE — `dueMandatoriesAt` fires at the entry DEADLINE, a week before
//     the event's own week, so the first thing that happens is a letter saying what she is about to
//     owe. Nothing in this file can charge a penalty the player was not told about first.
//   * AN OBLIGATION SHE COULD NOT MEET IS NOT AN OBLIGATION — `mandatoryBinds` asks whether she was
//     genuinely able to enter, and answers no for an injury, a suspension, an acceptance list that
//     refuses her, an age gate, and a week she had already committed. The real tour excuses a
//     medical withdrawal; a rule the game manufactured out of a fatigue floor would be a punishment
//     nobody chose, which is the thing the ruling forbids.
//   * THE PRICE IS ALWAYS NAMEABLE — `PenaltyReason` is a closed union and every row carries one, so
//     the inbox and the ledger can always say WHICH rule and HOW MANY points, and never merely that
//     something went wrong.
//
// ⚠ RNG: ZERO DRAWS, on any stream. Every function here is a filter over persisted state plus a
// comparison against the tier table, so the frozen MAIN capture (41550 / e6b0c709) cannot see this
// file. That is the same discipline `entryCaps.ts` keeps and for the same reason: an obligation is
// post-draw bookkeeping.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle — the shape `entryCaps.ts` and `ladder.ts` already use.

import { ECONOMY } from '../economy'
import { TIERS, WEEKS_PER_YEAR, isTierAgeOpen } from '../season/calendar'
import {
  raiseMandatoryDueLetter,
  raiseMandatoryPenaltyLetter,
  raiseSuspensionLetter,
} from '../offers'
import { addEvent, seasonStartWeek } from './ledger'
import { ageAtWeek } from './age'
import { acceptanceRank } from './ladder'
import { KID_ID } from './constants'
import type { PenaltyReason, PenaltyRow } from '../../shared/protocol'
import type { SeasonEvent, TierId } from '../season/types'
import type { WorldState } from '../world'

/** Is this rung one the tour obliges a top-50 player to turn up at, event by event? The Slams and
 *  the 1000s (ECONOMY.mandatory.perEventTiers). The 500s are a QUOTA and are handled separately —
 *  see `quotaShortfallAt` for why that is the real rule's own shape rather than a simplification. */
export function isMandatoryTier(tier: TierId): boolean {
  return ECONOMY.mandatory.perEventTiers.includes(tier)
}

/** Is she inside the standing the regime binds at all? Top-50 of the MERGED professional table —
 *  the table these rungs' own acceptance lists are denominated in.
 *
 *  ⚠ AND SHE HAS TO BE RANKED IN IT, not merely tied at the floor. Competition ranking gives every
 *  member of a tie the same number, and everybody without a counting W result ties at the bottom, so
 *  a girl who has never played a professional event can read as a number. The same `hasResults`
 *  guard the sponsor gates and the acceptance lists keep, for the same reason: you cannot be inside
 *  the world's top 50 if you have no world ranking. */
export function mandatoryBindsRank(world: WorldState): boolean {
  const ranked = world.results.some(
    (r) => r.playerId === KID_ID && r.points > 0 && r.tier !== undefined && TIERS[r.tier].track === 'wta',
  )
  if (!ranked) return false
  const rank = world.kidRankWta ?? Number.MAX_SAFE_INTEGER
  return rank <= ECONOMY.mandatory.maxRank
}

/** DOES THIS EVENT BIND HER — the whole gate, in one function, so no caller can answer it
 *  differently and no penalty can arrive from a rule the letter did not quote.
 *
 *  ⚠⚠ THE SECOND CLAUSE IS THE OWNER'S RULING AS CODE. An obligation she could not have met is not
 *  an obligation, so this returns false for every state in which entering was not actually open to
 *  her: injured (the real tour's own medical excuse), already serving a suspension, below the
 *  acceptance list, too young for the rung, or already committed to another tournament that week —
 *  she has one body, and `enterEvent` refuses a second entry in the same week, so obliging her to be
 *  in two draws would be obliging her to break a rule with a rule.
 *
 *  ⚠ WHAT IT DELIBERATELY DOES NOT ASK IS HER CONDITION. Being tired is a CHOICE the game warns
 *  about and never vetoes (`entryStatus`' caution level), and turning that into an excuse would make
 *  the regime toothless in exactly the weeks it is about. It would also invert the ruling: the tour
 *  would be lenient because the game had decided she was too tired, which is the game punishing her
 *  with one hand and forgiving her with the other. The condition FLOORS on these rungs were left at
 *  60 for the same reason — see ECONOMY.availability.minConditionToEnter. */
export function mandatoryBinds(world: WorldState, event: SeasonEvent): boolean {
  if (!isMandatoryTier(event.tier)) return false
  if (!mandatoryBindsRank(world)) return false
  if (world.injury !== null) return false
  if (isSuspendedAt(world, event.week)) return false
  if (!isTierAgeOpen(event.tier, ageAtWeek(event.week))) return false
  const accepts = acceptanceRank(world, event.tier)
  if (accepts !== undefined && (world.kidRankWta ?? Number.MAX_SAFE_INTEGER) > accepts) return false
  // One body, one week: an event she cannot enter because she is already entered somewhere that
  // week cannot oblige her. Her own entry in THIS event is the fulfilled case and is checked by the
  // caller, never here — this function answers "does it bind", not "did she do it".
  const committedElsewhere = world.season.some(
    (e) => e.week === event.week && e.id !== event.id && world.entries.includes(e.id),
  )
  return !committedElsewhere
}

// --- the ledger ---------------------------------------------------------------------------------

/** Her penalty points inside the rolling window ending at `week`. A filter, never a counter, for the
 *  same reason `proEntryWeeks` is a list of weeks: a total that has to be reset correctly is a total
 *  that will one day not be, and points that age out on their own are the gentlest possible version
 *  of this rule. */
export function penaltyPointsAt(world: WorldState, week: number): number {
  const from = week - ECONOMY.mandatory.windowWeeks
  return (world.penalties ?? [])
    .filter((p) => p.week > from && p.week <= week)
    .reduce((sum, p) => sum + p.points, 0)
}

/** Is she suspended in `week`? The tour's decision is persisted (`suspendedUntilWeek`) rather than
 *  re-derived, because it IS a decision taken at a moment: the ledger rolls, so a suspension
 *  recomputed from today's window would end early the week its tenth point aged out — which would
 *  make the sentence depend on when you asked. Inclusive of the last week. */
export function isSuspendedAt(world: WorldState, week: number): boolean {
  return world.suspendedUntilWeek !== null && week <= world.suspendedUntilWeek
}

/** How many weeks of the suspension are left at `week`, 0 when none. For the surfaces that have to
 *  say so out loud, so no screen re-derives the arithmetic. */
export function suspensionWeeksLeft(world: WorldState, week: number): number {
  if (!isSuspendedAt(world, week)) return 0
  return (world.suspendedUntilWeek ?? week) - week + 1
}

/** THE ONE WRITER. Appends a row and, if that takes her over the line, starts the suspension.
 *
 *  Returns the row plus whether it triggered, so the caller can write the letter that says so —
 *  the letter is the caller's job because the copy lives with the mail surface, and the RULE is this
 *  function's because a threshold checked in two places is a threshold that will disagree with
 *  itself. Idempotent on (week, reason, eventId): a week replayed twice cannot fine her twice.
 *
 *  ⚠ THE SUSPENSION RUNS FROM THE WEEK AFTER THE ONE THAT TRIGGERED IT. She was already at the
 *  tournament (or already not at it) when the tenth point landed; a ban that reached backwards into
 *  a week already played would be the game rewriting history, and a ban that started ON that week
 *  would collide with a run in progress. */
export function recordPenalty(
  world: WorldState,
  week: number,
  points: number,
  reason: PenaltyReason,
  eventId?: string,
): { row: PenaltyRow; suspended: boolean } | null {
  if (!Array.isArray(world.penalties)) world.penalties = []
  const already = world.penalties.some(
    (p) => p.week === week && p.reason === reason && p.eventId === eventId,
  )
  if (already) return null
  const row: PenaltyRow = { week, points, reason, ...(eventId ? { eventId } : {}) }
  world.penalties.push(row)
  const total = penaltyPointsAt(world, week)
  // Already serving one? The tour does not stack sentences — the points keep accruing and the next
  // one begins only after this has run its course, which is also what makes the ledger's rolling
  // window a real relief rather than a formality.
  if (total < ECONOMY.mandatory.suspensionAt || isSuspendedAt(world, week)) {
    return { row, suspended: false }
  }
  world.suspendedUntilWeek = week + ECONOMY.mandatory.suspensionWeeks
  // The slate is not wiped — the rolling window is what clears it — but the points that BOUGHT this
  // suspension must not buy a second one the following week. Marking them spent is the smallest
  // thing that says so, and it keeps the ledger a complete record of what she was charged for.
  for (const p of world.penalties) if (p.week <= week && !p.spent) p.spent = true
  return { row, suspended: true }
}

// --- what is due, and what was missed -----------------------------------------------------------

/** The mandatory events whose entry deadline falls in `week` — the moment the desk has to write,
 *  and the last moment she can still act. One week's worth, in calendar order.
 *
 *  ⚠ THE DEADLINE, NOT THE EVENT WEEK, AND THAT IS THE «announced before it can bite» RULE ITSELF.
 *  `SeasonEvent.deadlineWeek` is `week - 2`, so a letter written here reaches her while entering is
 *  still possible. A check at the event's own week could only ever be a receipt. */
export function dueMandatoriesAt(world: WorldState, week: number): SeasonEvent[] {
  return world.season
    .filter((e) => e.deadlineWeek === week && mandatoryBinds(world, e) && !world.entries.includes(e.id))
    .sort((a, b) => a.week - b.week || (a.id < b.id ? -1 : 1))
}

/** How many of the season's quota rung she actually PLAYED, counted the way the tour counts:
 *  participation, off the pro entry ledger rather than off results, because a first-round exit at a
 *  500 pays a nominal point and a withdrawal pays none — and both were weeks she committed to.
 *
 *  Scoped to the season containing `week`, the same `seasonStartWeek` arithmetic the entry caps use. */
export function quotaPlayedIn(world: WorldState, week: number): number {
  const from = seasonStartWeek(week)
  const tier = ECONOMY.mandatory.quotaTier
  const weeks = new Set(
    world.season.filter((e) => e.tier === tier && e.week >= from && e.week < from + WEEKS_PER_YEAR).map((e) => e.week),
  )
  return world.proEntryWeeks.filter((w) => w >= from && w < from + WEEKS_PER_YEAR && weeks.has(w)).length
}

/** How many events of the quota she fell short by, at the end of the season containing `week`. Zero
 *  when the regime does not bind her at all, which is most of a career.
 *
 *  ⚠ IT IS CAPPED BY WHAT THE CALENDAR OFFERED HER, not merely by the quota. A season in which the
 *  acceptance list only ever opened four 500s to her cannot owe six, and the same «an obligation she
 *  could not meet is not an obligation» rule that governs `mandatoryBinds` governs here. */
export function quotaShortfallAt(world: WorldState, week: number): number {
  if (!mandatoryBindsRank(world)) return 0
  const from = seasonStartWeek(week)
  const tier = ECONOMY.mandatory.quotaTier
  const accepts = acceptanceRank(world, tier)
  const offered = world.season.filter(
    (e) =>
      e.tier === tier &&
      e.week >= from &&
      e.week < from + WEEKS_PER_YEAR &&
      isTierAgeOpen(tier, ageAtWeek(e.week)) &&
      (accepts === undefined || (world.kidRankWta ?? Number.MAX_SAFE_INTEGER) <= accepts),
  ).length
  const owed = Math.min(ECONOMY.mandatory.quota, offered)
  return Math.max(0, owed - quotaPlayedIn(world, week))
}

// --- the settlement: the four moments the regime actually speaks ---------------------------------
//
// ⚠ FOUR CALL SITES AND NOT ONE MORE, each at a moment the player can name: the entry deadline (the
// warning), the event's own week (the skip), the two player verbs that pull out of a committed entry
// (the late withdrawal and the no-show), and the season boundary (the quota). Everything else about
// the regime is a read.

/** THE ONE CHARGE PATH. Records the row, writes the letter that names the rule and quotes the
 *  running total, puts a line in the feed, and - if this was the tenth point - writes the suspension
 *  notice too. Returns the points actually charged, 0 when the charge was a replay of one already
 *  made (a week re-ticked must not fine her twice). */
export function chargeMandatoryPenalty(
  world: WorldState,
  week: number,
  points: number,
  reason: PenaltyReason,
  event?: { id: string; tier: TierId },
): number {
  const charged = recordPenalty(world, week, points, reason, event?.id)
  if (!charged) return 0
  const running = penaltyPointsAt(world, week)
  const label = event ? TIERS[event.tier].label : undefined
  raiseMandatoryPenaltyLetter(world.offers, week, {
    reason,
    points,
    runningPoints: running,
    suspensionAt: ECONOMY.mandatory.suspensionAt,
    ...(event ? { tier: event.tier, eventId: event.id } : {}),
    ...(label ? { label } : {}),
  })
  // ⚠ THE FEED LINE NAMES THE PRICE AND NOTHING ELSE. It is a bill, not a verdict - see the ruling
  // at the head of this file. Short dash only, as all player-facing copy is.
  addEvent(world, {
    week,
    type: 'info',
    text:
      `Tour penalty: ${points} ${points === 1 ? 'point' : 'points'}` +
      `${label ? ` – ${label}` : ' – season commitment'}. ` +
      `${running} of ${ECONOMY.mandatory.suspensionAt} in the last 52 weeks.`,
  })
  if (charged.suspended && world.suspendedUntilWeek !== null) {
    raiseSuspensionLetter(
      world.offers,
      week,
      world.suspendedUntilWeek,
      running,
      ECONOMY.mandatory.suspensionAt,
    )
    addEvent(world, {
      week,
      type: 'info',
      text: `Tour suspension – ${ECONOMY.mandatory.suspensionWeeks} weeks, through week ${world.suspendedUntilWeek}.`,
    })
  }
  return points
}

/** THE WARNING, at every mandatory entry deadline falling in `world.week`. One letter per event,
 *  idempotent on the event id, and it fires BEFORE anything can be charged - which is the whole of
 *  «every obligation is announced in a letter before it can bite». */
export function settleMandatoryDeadlines(world: WorldState): void {
  for (const event of dueMandatoriesAt(world, world.week)) {
    raiseMandatoryDueLetter(
      world.offers,
      world.week,
      event,
      TIERS[event.tier].label,
      ECONOMY.mandatory.skipPoints,
    )
  }
}

/** THE SKIP, at the event's own week: she was bound, she never entered, and the deadline has passed.
 *
 *  ⚠ AND THIS IS WHERE THE ZERO GOES IN. The owner's spec is explicit that a skipped mandatory ALSO
 *  occupies one of her sixteen counted slots - the real rule, and crueller than the fine because it
 *  is levied in the currency she is actually playing for. It is written as an ordinary result row
 *  carrying `mandatoryMiss`, so the best-16 window she reads every week IS the enforcement surface
 *  and no parallel bookkeeping exists to disagree with it. */
export function settleMandatoryMisses(world: WorldState): void {
  const week = world.week
  for (const event of world.season) {
    if (event.week !== week) continue
    if (world.entries.includes(event.id)) continue
    if (!mandatoryBinds(world, event)) continue
    // The deadline has to have passed, or she has not missed anything yet.
    if (week <= event.deadlineWeek) continue
    // ⚠⚠ AND SHE MUST NOT BE CHARGED TWICE FOR ONE ABSENCE, which is the seam a LATE WITHDRAWAL
    // opens. `cancelEntry` charges 3 points the moment she pulls out of a closed list; by the
    // event's own week she is no longer in `world.entries`, so this loop would see an un-entered
    // mandatory and add a 2-point skip on top - two rules for one week she was not there. The tour
    // charges for the WORSE of the two, and it has already charged it, so any row already carrying
    // this event's id ends the matter. `recordPenalty` is idempotent per (week, reason, eventId);
    // this is the same guarantee across DIFFERENT reasons, and it is the one the player would
    // notice. Caught in-wave rather than by a letter arriving twice.
    if ((world.penalties ?? []).some((p) => p.eventId === event.id)) continue
    const charged = chargeMandatoryPenalty(world, week, ECONOMY.mandatory.skipPoints, 'skip', event)
    if (charged === 0) continue
    world.results.push({ playerId: KID_ID, week, points: 0, tier: event.tier, mandatoryMiss: true })
  }
}

/** THE SEASON'S COMMITMENT, settled once at the boundary week that ends it. One row for the whole
 *  shortfall rather than one per missing event, so the letter can state the arithmetic in a sentence
 *  («four of six played») instead of arriving twice. */
export function settleMandatoryQuota(world: WorldState, seasonEndWeek: number): void {
  const short = quotaShortfallAt(world, seasonEndWeek)
  if (short <= 0) return
  chargeMandatoryPenalty(
    world,
    seasonEndWeek,
    short * ECONOMY.mandatory.quotaShortfallPoints,
    'quota',
  )
}
