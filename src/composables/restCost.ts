// ⭐⭐ ROUND 29 #1 – WHAT A WEEK OFF COSTS HER RANKING, SAID BEFORE THE WEEK IS BOOKED.
//
// The owner, on week 23 of '44: «у меня в ленте был Шлем и не подал заявку, девушка была exhausted,
// я выбрал отпуск, отдохнул, вернулся – а шлема в ленте нет! Текущее место 116 (минус 11) показывает.
// После победы w500 снова появился. Это не очень хороший паттерн.» His complaint is not the rank cut
// – that is the tour's rule and it stands. It is that a decision he took REMOVED CONTENT and nothing
// said so until afterwards.
//
// =================================================================================================
// WHAT WAS MEASURED FIRST, because two different mechanisms produce that sentence and they want
// different words. 12 careers x 624 weeks, the shipped predicates (`toSnapshot`, `feedContext`,
// `feedShows`, `preferredWeekEvent`), so the probe could not disagree with the screen:
//
//   140 Slam cards left the feed.
//   134 (95.7%)  THE SLAM'S OWN WEEK HAD PASSED – the eight-week horizon simply moved on.
//     3 ( 2.1%)  `tierOpen.slam` went false, i.e. HER RANK CROSSED THE ACCEPTANCE CUT. Two of the
//                three are clean crossings of the cut of 112: 92 -> 128 and 105 -> 130, both in a
//                SINGLE week. That is his «116 (минус 11)» exactly.
//     3          other.
//
// AND THE REST ITSELF IS NOT WHAT MOVED HER. 58 forks, taken from weeks where the Slam card was on
// screen and her rank was within 40 places of the cut, each run three ways for four weeks from one
// world: BOOK A FAMILY WEEK / IDLE / PLAY THE POLICY. The rung's verdict was IDENTICAL in all three
// arms in all 58 (`closed after rest = 1, after idle = 1, after play = 1`), and the rank differences
// between rest and idle were small and unsigned – noise from a diverged world, not a penalty for
// resting. The decay is a CALENDAR fact: a counted result leaves the 52-week window on its own.
//
// SO THE HONEST SENTENCE IS NOT "resting will drop your rank". It is the two things that are true
// at the moment he decides, both already on the Snapshot and neither of them a forecast:
//
//   1. WHAT THAT WEEK IS DEFENDING – the counted result exactly 52 weeks behind it, which is the
//      slot the week would replace. It leaves her ranking whether she plays or not; a week away is
//      the choice to put nothing in its place. (Same arithmetic as SeasonScreen's `defendingPts`
//      badge, which is where the idea and the owner's «window of points opportunity» come from.)
//   2. WHERE SHE STANDS AGAINST A CUT that is currently deciding what her feed shows.
//
// =================================================================================================
// ⚠ NOTHING HERE TOUCHES THE GATE. `tierOpen`, `acceptanceRank` and every entry rule are read, never
// written. This module is a sentence.
//
// ⚠ AND IT IS A COMPOSABLE-SHAPED PURE FUNCTION rather than a store-backed one: it takes the
// Snapshot and a week, so the sheet, a test and any later surface all ask it the same way.

import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import type { TierId } from '../engine/season/types'
import type { Snapshot } from '../shared/protocol'

/** The rolling ranking window, in weeks – `ranking.ts WINDOW_WEEKS`. Spelled here because the
 *  defending slot is "this week, one window ago" and the two must be the same number. */
const WINDOW_WEEKS = 52

/**
 * HOW CLOSE TO A CUT COUNTS AS "NEAR IT", in places.
 *
 * ⚠ MEASURED, NOT PICKED. The two clean rank crossings in the probe above moved her by 36 places
 * (92 -> 128) and 25 places (105 -> 130) in one week, so a margin that would have warned him in
 * either case has to be at least 36. 40 covers both with a place to spare and still says nothing at
 * all to a girl ranked 5th about a cut of 112, which is the noise this threshold exists to prevent.
 */
export const GATE_NEAR_PLACES = 40

export interface RestGate {
  tier: TierId
  /** the rung's own name – `TIERS[tier].label`, never a re-spelling */
  label: string
  /** the acceptance list as a position (`Snapshot.tierAcceptance`) */
  cut: number
  /** her place in THAT RUNG'S OWN TABLE, which is not always her active one */
  rank: number
  /** how many places inside the cut she is standing, 0 = level with it */
  margin: number
}

export interface RestCost {
  /** the counted result one window behind the week being rested, in her active table's currency */
  defendingPts: number
  /** the highest rung she is currently inside the cut of, near it, and can still see. Null when no
   *  rung is close enough to be worth a sentence. */
  gate: RestGate | null
}

/**
 * WHAT RESTING `week` COSTS, or null when there is nothing true to say.
 *
 * ⚠ THE TRIGGER IS THE DEFENDING SLOT, and that is deliberate rather than incidental: a week that
 * defends nothing costs her ranking nothing, so a note on it would be furniture on every booking.
 * The gate clause RIDES on that trigger; it is never the whole of the note, because "you are near a
 * cut" on a week she is not defending is a fact about her career and not about this decision.
 */
export function restCostFor(snap: Snapshot | null | undefined, week: number): RestCost | null {
  if (!snap) return null
  const active = snap.ladders[snap.activeLadder]
  const defendingPts =
    active.countingResults.find((c) => c.week === week - WINDOW_WEEKS)?.points ?? 0
  if (defendingPts <= 0) return null
  return { defendingPts, gate: nearestGate(snap) }
}

/** The rung worth naming: it has an acceptance list, it has an event she can still see in the
 *  eight-week horizon, she is INSIDE its cut today, and she is inside it by no more than
 *  `GATE_NEAR_PLACES`. Highest such rung wins – the ladder's own order, the same tiebreak
 *  `preferredWeekEvent` uses for a stacked week. */
function nearestGate(snap: Snapshot): RestGate | null {
  const inHorizon = new Set(snap.upcoming.map((e) => e.tier))
  let best: RestGate | null = null
  for (const tier of TIER_LADDER) {
    if (!inHorizon.has(tier)) continue
    const cut = snap.tierAcceptance[tier]
    if (cut === undefined) continue
    // ⚠ THAT RUNG'S OWN TABLE, NOT HER ACTIVE ONE. An acceptance cut is read against the table the
    // rung pays into (`ladder.ts meetsAcceptanceCut`), and two-ladders.md forbids comparing a place
    // in one table with a cut in another. A rung whose table she holds no place in is skipped.
    const rank = snap.ladders[TIERS[tier].track].rank
    if (rank === null || rank > cut) continue
    const margin = cut - rank
    if (margin > GATE_NEAR_PLACES) continue
    best = { tier, label: TIERS[tier].label, cut, rank, margin }
  }
  return best
}

/** The note itself, as the two sentences the sheet renders. Kept beside the rule so the copy and the
 *  numbers cannot be assembled two different ways on two surfaces. */
export function restCostLines(cost: RestCost): string[] {
  const lines = [
    `She is defending ${cost.defendingPts} pts from that week, and a week away banks nothing in their place.`,
  ]
  if (cost.gate) {
    lines.push(
      cost.gate.margin === 0
        ? `At #${cost.gate.rank} she is level with the ${cost.gate.label} cut of ${cost.gate.cut} – a rung that closes takes its tournaments off the feed.`
        : `At #${cost.gate.rank} she is ${cost.gate.margin} places inside the ${cost.gate.label} cut of ${cost.gate.cut} – a rung that closes takes its tournaments off the feed.`,
    )
  }
  return lines
}
