// R11-5a – ONE rule for "what is this tier's state for her right now", shared by every surface
// that shows it (the Home season ladder, the Season calendar's lock labels + its open-tier note).
//
// THE BUG THIS FIXES IS A SENTENCE, NOT A RULE. The owner reported he could enter a J30 but "not
// national", and that national "unlocked" after a J30 title. By the entry bands that is impossible:
// national is [150, ∞) and j30 is [180, ∞), so j30 is a strict SUBSET of national – if she can enter
// a J30 she can always enter a National. What he actually hit is CALENDAR DENSITY: j30 runs every 2
// weeks (~26 a season), national every 13 weeks + 2 second-half extras = 6 a season. There was no
// national scheduled inside the horizon, and every surface said the same thing about that as it said
// about a tier she was genuinely short of points for: a muted dash.
//
// So the states are now told apart, in words:
//   'age-locked'  the junior tour is 13+ and she is younger (kept wired for the childhood prologue)
//   'locked'      she is BELOW enterPointBand[0] – "Reach N pts", the one real lock
//   'outgrown'    her windowed points are past enterPointBand[1] (unchanged behaviour)
//   'capped'      she has spent this YEAR's allowance of international entries (the ITF annual
//                 entry cap) – blocked, but only until the season turns
//   'scheduled'   she can enter it AND one is on the calendar – the week is named
//   'unscheduled' she can enter it and NOTHING is on the calendar – say exactly that
//
// 'capped' is a FOURTH thing the muted dash used to hide, and the one most likely to be misread as
// permanent: a parent who has used all fourteen must not conclude the tier is shut. So it is a
// state of its own, it prints the count she spent, and its long form says the allowance returns.
//
// Presentation only: every input is already on the Snapshot and every threshold is read from the
// engine's own TIERS catalogue. No engine helper was added and nothing here re-derives a band.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import { isCappedTier, isTierAgeOpen } from '../engine/world'
import { weekRange } from '../shared/dates'
import type { EntryCapUsage } from '../shared/protocol'
import type { TierId } from '../engine/season/types'

export type TierStateKind = 'age-locked' | 'locked' | 'outgrown' | 'capped' | 'scheduled' | 'unscheduled'

/**
 * The ONE wording for a point lock – shared, but the NUMBER always comes from the caller.
 *
 * That split is deliberate and was learned the hard way in the browser: a Season card's lock is the
 * ENGINE's verdict on that specific event (`UpcomingEvent.pointsToEnter`), while the Home ladder's is
 * this module's read of the band against her displayed points. Having the card print the ladder's
 * verdict let a stale snapshot show "🔒 Open – on the calendar" on a card the engine had locked –
 * two sources of truth for one sentence, which is the exact class of bug R10-5 was about. So: every
 * surface keeps its own authoritative number and they all borrow the same words.
 */
export function pointsLockNote(pointsToEnter: number): string {
  return `Reach ${pointsToEnter} pts`
}

export interface TierState {
  id: TierId
  kind: TierStateKind
  /** 'locked' only: the tier's entry threshold, for "Reach N pts". */
  pointsToEnter?: number
  /** 'capped' only: the season allowance behind the verdict, for "N of M". */
  entryCap?: EntryCapUsage
  /** 'scheduled' only: the week of the next event of this tier inside the horizon. */
  nextWeek?: number
  /** Short player-facing state line. Never names the tier – every caller has already said it. */
  note: string
  /** The long form, for a title/tooltip: same verdict, room for the date. */
  title: string
}

/** Everything the rule needs, all of it already on the Snapshot. Kept as a plain input (rather than
 *  the Snapshot itself) so the rule is a pure function a test can call with three numbers. */
export interface TierStateInput {
  ageYears: number
  /** her windowed ranking points – the same figure the Home card and the entry band read */
  points: number
  /** the snapshot's calendar horizon (`upcoming`), which is what "scheduled soon" MEANS here */
  upcoming: readonly { tier: TierId; week: number }[]
  /** how many weeks that horizon covers, so the copy can state its own length honestly */
  horizonWeeks: number
  /** the ITF annual entry cap for the CURRENT season, straight off the snapshot – the engine's own
   *  count, never re-derived here (the same discipline `pointsToEnter` is under). */
  entryCap: EntryCapUsage
}

/**
 * The state of one tier for one kid, at one moment. Pure.
 *
 * Precedence is deliberate and matches the engine's entry gate: the AGE gate first (it is not
 * about points at all), then the point band (the hard, permanent headline), and only then the
 * calendar. A tier she cannot enter has nothing to say about scheduling.
 */
export function tierState(id: TierId, input: TierStateInput): TierState {
  const tier = TIERS[id]
  const [minPoints, maxPoints] = tier.enterPointBand

  if (!isTierAgeOpen(id, input.ageYears)) {
    return {
      id,
      kind: 'age-locked',
      note: `Opens at ${tier.minAgeYears}`,
      title: `${tier.label} – opens at age ${tier.minAgeYears}`,
    }
  }
  if (input.points < minPoints) {
    return {
      id,
      kind: 'locked',
      pointsToEnter: minPoints,
      note: pointsLockNote(minPoints),
      title: `${tier.label} – locked: reach ${minPoints} pts to enter (she has ${input.points})`,
    }
  }
  if (input.points > maxPoints) {
    return {
      id,
      kind: 'outgrown',
      note: 'Outgrown',
      title: `${tier.label} – outgrown: she is past this level`,
    }
  }
  // The tier is hers on points. Has she any of the year's international allowance left?
  // Ranked AFTER the permanent locks (a tier she cannot enter at all has nothing to say about how
  // many entries she has left) and BEFORE the calendar, because a scheduled event she may not take
  // must never read "Open – on the calendar". Mirrors the engine's own precedence: band, then
  // availability, and the cap sits in availability (world.ts availabilityStatus).
  if (isCappedTier(id) && input.entryCap.remaining <= 0) {
    const { used, limit } = input.entryCap
    return {
      id,
      kind: 'capped',
      entryCap: input.entryCap,
      note: `Year limit – ${used} of ${limit}`,
      title:
        `${tier.label} – she has used all ${limit} of her international events for this year ` +
        `(age ${input.ageYears}). Not locked: a fresh allowance arrives next season.`,
    }
  }
  // She can enter it. The only question left is whether the calendar has one.
  const nextWeek = input.upcoming
    .filter((e) => e.tier === id)
    .reduce<number | null>((best, e) => (best === null || e.week < best ? e.week : best), null)
  if (nextWeek !== null) {
    return {
      id,
      kind: 'scheduled',
      nextWeek,
      note: 'Open – on the calendar',
      // The DATE, not the week number: R11-6 owns week-number rendering, and a date needs no
      // in-season/absolute decision to be correct.
      title: `${tier.label} – open to her, next one ${weekRange(nextWeek)}`,
    }
  }
  return {
    id,
    kind: 'unscheduled',
    note: `Open – none in ${input.horizonWeeks} weeks`,
    title:
      `${tier.label} – open to her, but none is scheduled in the next ${input.horizonWeeks} weeks. ` +
      `This tier comes round less often than the others; it is not locked.`,
  }
}

/** True when the tier is enterable right now – the two "open" states, whatever the calendar says.
 *  The predicate a surface should ask when it wants "can she play here at all". */
export function isTierOpen(state: TierState): boolean {
  return state.kind === 'scheduled' || state.kind === 'unscheduled'
}

/** The snapshot's own horizon: `upcoming` carries `week > current && week <= current + 8`
 *  (world.ts UPCOMING_WEEKS). Named here so the copy above and the calendar agree on "soon". */
export const HORIZON_WEEKS = 8

/** Every rung's state, ladder order, off the live snapshot. The store read lives here so the two
 *  screens consume one computed instead of each rebuilding the input. */
export function useTierStates(): ComputedRef<TierState[]> {
  const game = useGameStore()
  return computed<TierState[]>(() => {
    const snap = game.snapshot
    const input: TierStateInput = {
      ageYears: snap?.ageYears ?? 0,
      // Same source the Home player card already uses for her point total.
      points: snap?.standings.find((r) => r.isKid)?.points ?? 0,
      upcoming: snap?.upcoming ?? [],
      horizonWeeks: HORIZON_WEEKS,
      // No snapshot yet = nothing spent and nothing to say; the age gate/point band answer first.
      entryCap: snap?.entryCap ?? { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER },
    }
    return TIER_LADDER.map((id) => tierState(id, input))
  })
}
