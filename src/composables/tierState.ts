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
import { LADDER_POINTS_LABEL, type EntryCapUsage } from '../shared/protocol'
import type { TierId } from '../engine/season/types'

export type TierStateKind = 'age-locked' | 'locked' | 'outgrown' | 'capped' | 'scheduled' | 'unscheduled'

/**
 * The ONE wording for a point lock – shared, but the NUMBER always comes from the caller.
 *
 * ⚠ AND IT NAMES ITS CURRENCY (30.07, fix/ranking-truth). It used to read "Reach 250 pts", which is
 * two-thirds of a sentence: there are two point tables and this threshold is denominated in the
 * NATIONAL one. See `TierStateInput.points` below for the bug that cost.
 *
 * That split is deliberate and was learned the hard way in the browser: a Season card's lock is the
 * ENGINE's verdict on that specific event (`UpcomingEvent.pointsToEnter`), while the Home ladder's is
 * this module's read of the band against her displayed points. Having the card print the ladder's
 * verdict let a stale snapshot show "🔒 Open – on the calendar" on a card the engine had locked –
 * two sources of truth for one sentence, which is the exact class of bug R10-5 was about. So: every
 * surface keeps its own authoritative number and they all borrow the same words.
 */
export function pointsLockNote(pointsToEnter: number, points?: number): string {
  // A FRACTION WHEN THE CALLER KNOWS WHERE SHE STANDS. "112 / 250 pts" answers both halves of the
  // player's question in one glance - what opens this, and how far off is she - where "Reach 250 pts"
  // answered only the first and left the second on a screen she had to go and find.
  if (points === undefined) return `Reach ${pointsToEnter} ${LADDER_POINTS_LABEL.domestic}`
  return `${points} / ${pointsToEnter} ${LADDER_POINTS_LABEL.domestic}`
}

/**
 * WHEN THIS RUNG OPENS, in the player's words – "age 13 and the top 100 internationally".
 *
 * ⚠ THE OWNER ASKED FOR THIS BACK (31.07): «когда открываются турниры разных типов? Что-то раньше
 * было в интерфейсе видно и понятно, а теперь не очень. Давай может тоже на плашке с замочком
 * напишем когда открываются?» – and he is describing a real regression rather than a preference. The
 * two-ladder slice moved J60 and J300 onto an ITF-rank acceptance list and left their
 * `enterPointBand` at `[0, MAX]`, and every surface that explained a gate by reading a band then said
 * one of two useless things about them: the Home ladder's plaque said "Not on the list yet" (a state,
 * not a condition), and the tour guide's opens-at column said **"0+"**, which is not merely vague –
 * it is the opposite of true about the two hardest rungs in the game.
 *
 * ⚠ AND IT IS DERIVED, WHICH IS THE WHOLE POINT. A hand-written table of "J60 opens at…" is exactly
 * the bug being fixed, one release later: `enterPct` has already been re-picked twice (0.40 → 0.50,
 * 0.25 → 0.40), J30's floor has moved 150 → 250, and the acceptance CUT is not even a constant –
 * `acceptanceRank` is `enterPct × (cohort + 1)`, so it follows the population as well as the tuning.
 * Every clause below is read off `TIERS[id]`, so a rung whose gate is re-tuned re-words itself.
 *
 * `acceptsRank` is the engine's own live cut (`Snapshot.tierAcceptance`). Absent, the sentence falls
 * back to the SHARE, which is what the gate is denominated in anyway and is still exactly true.
 */
export function tierOpensWhen(id: TierId, acceptsRank?: number): string {
  const tier = TIERS[id]
  const clauses: string[] = []
  if (tier.minAgeYears !== undefined) clauses.push(`age ${tier.minAgeYears}`)
  const [minPoints] = tier.enterPointBand
  if (tier.enterPct !== undefined) {
    // The acceptance list. Never a points figure: the rungs above the on-ramp do not read one, and
    // quoting the `[0, MAX]` band they carry instead would be the "0+" this function exists to kill.
    clauses.push(
      acceptsRank !== undefined
        ? `the top ${acceptsRank} internationally`
        : `the top ${Math.round(tier.enterPct * 100)}% internationally`,
    )
  } else if (minPoints > 0) {
    clauses.push(`${minPoints} ${LADDER_POINTS_LABEL.domestic}`)
  }
  // Local: no age gate, no floor. "Open from the start" rather than "0 pts" – a threshold of zero is
  // not a threshold, and printing one invites the player to look for progress against it.
  if (clauses.length === 0) return 'open from the start'
  return clauses.join(' and ')
}

/** How a finish READS in a sentence. `finishLabel` gives "Semifinalist", which is a person; a gap is
 *  measured in events, so this gives "semi-final". Same index convention (0 = the title). */
function finishPhrase(finish: number, drawSize: number): string {
  switch (finish) {
    case 0:
      return 'title'
    case 1:
      return 'final'
    case 2:
      return 'semi-final'
    case 3:
      return 'quarter-final'
    default:
      return `round of ${Math.min(2 ** finish, drawSize)}`
  }
}

/** The DOMESTIC rungs whose entry band currently holds `points` - the events she could actually go and
 *  play. Read off the catalogue, never a hand-kept list, so a tuning change cannot strand this. */
function openDomesticRungs(points: number): TierId[] {
  return TIER_LADDER.filter((id) => {
    const t = TIERS[id]
    if (t.track !== 'domestic') return false
    const [lo, hi] = t.enterPointBand
    return points >= lo && points <= hi
  })
}

/**
 * THE GAP, SAID IN TOURNAMENTS INSTEAD OF IN POINTS. Returns null when there is nothing useful to say.
 *
 * ⚠ WHY THIS EXISTS, and it is the owner's own framing. He asked (item 26) for the J30 floor to be
 * replaced by "win a National", because a points threshold was not telling him anything he could act
 * on. Asked which he wanted, he answered: «это было на обсуждение, мне главное, чтобы было наглядно и
 * однозначно» - the requirement is that the gate be LEGIBLE and UNAMBIGUOUS, and the mechanism is ours
 * to choose.
 *
 * So the threshold KEEPS the gating - it is continuous, it moves every week, and it never tells a girl
 * with three National semi-finals that she has achieved nothing - and this sentence supplies the thing
 * a bare number could not: what she would have to go and do. "138 national pts to go - about two more
 * semi-finals at Regional Championship" is arithmetic a parent can plan a season around.
 *
 * Every value comes from the TIERS catalogue, so this can never quote a points table the engine does
 * not actually pay. It reads the DOMESTIC rungs only: these gaps are denominated in national points,
 * and the two ladders have no exchange rate (docs/specs/two-ladders.md) - a sentence that offered a
 * Junior Tour result as a way to close a national-points gap would quietly merge the two currencies,
 * which is the one thing that ruling forbids.
 */
export function gapInResultsNote(gap: number, points: number): string | null {
  if (gap <= 0) return null
  // Strongest open rung first: it is the one she would actually travel to, and it pays the most per
  // trip.
  for (const id of [...openDomesticRungs(points)].reverse()) {
    const t = TIERS[id]
    // FEWEST TRIPS, then the EASIEST finish that still needs that many. The second half matters more
    // than it looks: at 110 points, National's 40-point gap is closed by one Regional title (80) and
    // equally by one Regional final (48), and telling a parent to go and win the thing when reaching
    // the final would do is advice that is true and unkind. Ties on trip count therefore break toward
    // the LOWEST finish, which is the highest index in this array.
    let best: { finish: number; n: number } | null = null
    for (let finish = 0; finish < t.points.length; finish++) {
      const value = t.points[finish]
      if (value <= 0) continue // a first-round exit pays nothing (wave B) and closes no gap
      const n = Math.ceil(gap / value)
      // Only say it when it is a plan rather than a life sentence. Beyond three trips the honest answer
      // is the next rung down, which the outer loop reaches on its own.
      if (n > 3) continue
      if (!best || n < best.n || (n === best.n && finish > best.finish)) best = { finish, n }
    }
    if (best) {
      const phrase = finishPhrase(best.finish, t.drawSize)
      return best.n === 1 ? `one more ${phrase} at ${t.label}` : `${best.n} more ${phrase}s at ${t.label}`
    }
  }
  return null
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
  /** HER NATIONAL POINTS - her windowed best-6 in the DOMESTIC table, and nothing else.
   *
   *  ⚠ THE BUG THIS COMMENT EXISTS FOR (30.07, fix/ranking-truth). `useTierStates` fed this from
   *  `snapshot.standings`, which is the ITF table. But EVERY rung's `enterPointBand` is denominated in
   *  domestic points - engine/season/calendar.ts draws its own ladder diagram against "domestic pts →"
   *  and the engine's `entryStatus` reads `kidPoints(world, 'domestic')` for all six rungs, the J30
   *  on-ramp included. So this compared one currency against another's thresholds.
   *
   *  What the owner saw on his Home screen, with 604 national points and 4 international ones:
   *  Local "Open" and NOT outgrown (4 is under its 85 ceiling), Regional "Reach 65 pts", National
   *  "Reach 150 pts", J30 "Reach 250 pts" - every one of them wrong, and the engine meanwhile letting
   *  her enter all four. His «Tournaments wrong current active active», and the confusion behind «No
   *  points visualisation for local-regional-national is super-strange».
   *
   *  The reason it was easy to get wrong is worth keeping: `snapshot.standings` is the obvious place to
   *  find "her points", and it is the right answer to a DIFFERENT question. Hence `Snapshot.ladders`,
   *  which makes the caller name the table it means. */
  points: number
  /** the snapshot's calendar horizon (`upcoming`), which is what "scheduled soon" MEANS here */
  upcoming: readonly { tier: TierId; week: number }[]
  /** how many weeks that horizon covers, so the copy can state its own length honestly */
  horizonWeeks: number
  /** the ITF annual entry cap for the CURRENT season, straight off the snapshot – the engine's own
   *  count, never re-derived here (the same discipline `pointsToEnter` is under). */
  entryCap: EntryCapUsage
  /** THE ENGINE'S OWN VERDICT for this rung (`Snapshot.tierOpen`), or undefined for the pure callers
   *  that predate it. When it says false, this rule reports locked and does not argue.
   *
   *  ⚠ WHY A RULE THAT USED TO BE COMPLETE NEEDS AN ORACLE. `enterPointBand` WAS the one entry rule,
   *  and this function implemented it faithfully. The two-ladder slice moved J60 and J300 onto her
   *  ITF RANK POSITION and left their bands at `[0, MAX]` - so `points < minPoints` is never true for
   *  them and this said "Unlocked - enter your first!" about events `enterEvent` refuses. Found by
   *  playing the game, not by a test: every guard on the entry rule watches the ENGINE, and this is
   *  the UI's copy of it. The rule is not re-derived here any more; it is asked. */
  engineOpen?: boolean
  /** THIS RUNG'S ACCEPTANCE CUT (`Snapshot.tierAcceptance[id]`), or undefined for a rung that gates on
   *  points instead. The engine's own number, never re-derived – see `tierOpensWhen`. */
  acceptsRank?: number
  /** her place in the INTERNATIONAL table, or null when she holds no counting result there. Only the
   *  acceptance-list lock reads it, and only to finish the sentence "it takes the top 100 – she is
   *  #128", which is the same sentence `entryStatus` writes on an individual event's card. */
  itfRank?: number | null
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
      // ⚠ THE WHOLE CONDITION, not just the clause that happens to be binding today. An age-locked
      // J30 also wants 250 national points, and a plaque that mentions only the birthday tells a
      // twelve-year-old she is one year from the Junior Tour when she is a year AND a domestic
      // career from it. The chip has room for the nearest gate; the tooltip has room for all of it.
      title: `${tier.label} – opens at ${tierOpensWhen(id, input.acceptsRank)}`,
    }
  }
  if (input.points < minPoints) {
    return {
      id,
      kind: 'locked',
      pointsToEnter: minPoints,
      note: pointsLockNote(minPoints, input.points),
      // THE LONG FORM CARRIES THE PLAN. The chip has room for the fraction; the tooltip has room for
      // what the fraction would take, and for the one sentence that says which of the two point
      // tables this threshold is even counted in.
      title:
        `${tier.label} – locked: ${minPoints - input.points} more ${LADDER_POINTS_LABEL.domestic} ` +
        `(she has ${input.points} of ${minPoints})` +
        `${gapInResultsNote(minPoints - input.points, input.points) ? ` – ${gapInResultsNote(minPoints - input.points, input.points)}` : ''}` +
        `. National points come from Local, Regional and National events.`,
    }
  }
  // ⚠ OUTGROWN COMES BEFORE THE ENGINE FALLBACK, and it did not used to (30.07, fix/ranking-truth).
  //
  // Seen in the browser the moment `points` started arriving in the right currency: a girl with 110
  // national points read "Local · 🔒 Not on the list yet". Local has no list - it is a club draw with a
  // points CEILING of 85, and she is past it. She had OUTGROWN it, which is the opposite of a lock.
  //
  // The mechanism: for a domestic rung `tierOpenFor` is nothing but the band, so `engineOpen === false`
  // on a domestic rung can ONLY mean "below the floor" (caught above) or "past the ceiling" (here). The
  // fallback below was written for the J rungs, whose bands are [0, MAX] and whose real gate is an
  // acceptance list the band cannot express - and its copy says exactly that. Reaching it for a
  // domestic rung put an international sentence on a local tournament.
  //
  // It was invisible before only because this rule was being fed her ITF points, which are ~0 all
  // through the early game, so `points > maxPoints` was never true and the case never arose.
  if (input.points > maxPoints) {
    return {
      id,
      kind: 'outgrown',
      note: 'Outgrown',
      title: `${tier.label} – outgrown: she is past this level`,
    }
  }
  // In band and STILL refused: an ITF rung she is not high enough in the table for. The band cannot
  // express this - see `engineOpen` above - so the engine's answer wins.
  //
  // ⚠ AND IT SAYS WHEN IT OPENS (31.07, the owner's «напишем когда открываются»). "Not on the list
  // yet" is a STATE, and the plaque next to it on the Regional rung has been printing a condition
  // with progress against it ("112 / 250 national pts") for a release. This is the same plaque and it
  // was answering a different question - which is precisely why the ladder stopped being legible when
  // the top two rungs moved onto an acceptance list. `acceptsRank` is the engine's own cut, so the
  // number here can never quote a list the gate does not use.
  if (input.engineOpen === false) {
    const standing =
      input.itfRank != null ? ` – she is #${input.itfRank}` : ' – she has no international ranking yet'
    return {
      id,
      kind: 'locked',
      note: input.acceptsRank !== undefined ? `Opens in the top ${input.acceptsRank}` : 'Not on the list yet',
      title:
        `${tier.label} – opens at ${tierOpensWhen(id, input.acceptsRank)}. Entry here is an ` +
        `acceptance list read off her international ranking${standing}.`,
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
      // HER NATIONAL POINTS - the currency every rung's entry band is written in. This used to read
      // `snap.standings.find(r => r.isKid).points`, the ITF table, and compared it against domestic
      // thresholds; see `TierStateInput.points` for what that showed the owner.
      points: snap?.ladders.domestic.points ?? 0,
      upcoming: snap?.upcoming ?? [],
      horizonWeeks: HORIZON_WEEKS,
      // No snapshot yet = nothing spent and nothing to say; the age gate/point band answer first.
      entryCap: snap?.entryCap ?? { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER },
    }
    // ...plus the engine's own verdict per rung, so the readout cannot invite her into an event
    // `enterEvent` will refuse (see `engineOpen`), and the engine's own acceptance cut for the rungs
    // that have one, so the locked plaque can name the list rather than describe a mood about it.
    return TIER_LADDER.map((id) =>
      tierState(id, {
        ...input,
        engineOpen: snap?.tierOpen?.[id],
        acceptsRank: snap?.tierAcceptance?.[id],
        itfRank: snap?.ladders.itf.rank ?? null,
      }),
    )
  })
}
