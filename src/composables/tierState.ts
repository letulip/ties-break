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
//   'age-locked'  the tier's age window does not contain her – she is younger than `minAgeYears`
//                 (the junior tour is 13+, the adult rungs 16/16/17), or since §4.1 OLDER than
//                 `maxAgeYears` (the junior tour is U18). ⚠ ONE KIND, TWO OPPOSITE SENTENCES: the
//                 planner's job is the same either way (not enterable, nothing to say about
//                 scheduling), but "Opens at 13" and "Under-19" are a countdown and a closed door,
//                 so `tierState` branches on `tierAgeBlock` to pick the words.
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
import { TIERS, TIER_LADDER, hasAcceptanceList } from '../engine/season/calendar'
import { isCappedProTier, isCappedTier, tierAgeBlock } from '../engine/world'
import { UPCOMING_WEEKS } from '../engine/world/constants'
import { weekRange } from '../shared/dates'
import { LADDER_POINTS_LABEL, LADDER_TRACKS, type EntryCapUsage, type TierRefusal } from '../shared/protocol'
import type { LadderTrack, TierId } from '../engine/season/types'

export type TierStateKind = 'age-locked' | 'locked' | 'outgrown' | 'capped' | 'scheduled' | 'unscheduled'

// =================================================================================================
// ⚠ THE SLIDING WINDOW (act2-pro-tour.md §11, owner ruling 11 – «всё так, да»). It REPLACES the
// two-type feed rule that stood here, and the replacement is a demotion: this module no longer
// decides anything.
// =================================================================================================
//
// THE RULE, in one line: THE FEED SHOWS EXACTLY WHAT IS INSIDE THE WINDOW, and the window is every
// rung the ENGINE holds open. Nothing is filtered here any more, because nothing needs to be – a
// rung she has passed CLOSES (`tierOutgrown` in engine/world/ladder.ts: a rung's ceiling is the
// floor of the rung three above, read in that rung's own currency), so the junk goes away as a
// class instead of being hidden card by card.
//
// ⚠ WHAT THIS RETIRES, AND WHY IT IS NOT A WEAKENING. Ruling 4 asked for «не больше 2х типов
// турниров», and the pair rule implemented it by PICKING two rungs out of however many the engine
// opened – which is the same shape of mistake as filtering an outgrown card: the UI compensating
// for a ladder with no ceiling. Ruling 11 fixes the ladder instead, and the owner's own worked
// example is the spec («Local 0-100, Regional 80-180, National 150-250, J30 = National + 0-100 …
// цифры примерные, я хочу показать логику скользящего окна»). Measured (§11.1): two-rung windows
// carry 2.6-5.1 playable weeks of eight and half of them are too thin; three-rung windows carry
// 5.2-6.0 through the middle. So the window is THREE rungs wide and widens to four at the top,
// which is his own answer («50 + 75 + 100 + 125, когда какой-то совсем перерастает - добавляем
// новый, а старый уходит»). Every case the pair rule pinned still holds, and holds by construction:
//   * «если она переросла J - вообще выводим» – the J rungs close when the W ones open;
//   * «Если national доступен - показывать только их» – Local closes when the international door
//     does, and Regional when J60 opens, so the domestic family collapses upward on its own;
//   * R15-9's two latch rules – subsumed the same way, one storey down.
//
// ⚠ AND THE FLOOR THE PAIR RULE NEEDED IS RETIRED WITH IT, RE-AIMED RATHER THAN DELETED. That rule
// had to say "a rung with no tennis in the horizon cannot BE the working rung", because reading
// `working` as the highest open rung pointed the feed at an eventless top of the ladder and emptied
// it (measured 02.08 on the owner's save at W38 '34: one already-entered J60 and eight training
// weeks). A window cannot fail that way – three or four rungs are live at once, and the rare top
// ones are live BESIDE the dense ones they slide out of rather than instead of them. The guard the
// finding earned lives in tests/tier-window.test.ts and is re-pointed at the window: an open rung
// with no events in the horizon must never cost her the rungs that do have them.
//
// ⚠⚠ THE AER SUBSTITUTION IS RETIRED INTO THE WINDOW, AND IT COULD NOT HAVE SURVIVED AS CODE. It
// borrowed «the strongest OPEN, eligible event from outside the pair» on a week the pro cap emptied
// (ruling 2, §5) – and under the window "open" and "inside" are the SAME SET by construction, so
// the borrow's source is empty and every line of it was unreachable. Deleting unreachable code is
// not the interesting part; what replaces the RULING is:
//
//   THE WINDOW ITSELF IS THE BOREDOM GUARD NOW. The pro cap binds at 16 and 17 only
//   (`proPerYearByAge` 12 / 16, unlimited from 18), and at those ages the window still carries the
//   junior rungs beside the professional one – {j60, j300, w15}, then {j300, w15, w35}. A capped
//   W week therefore still offers her the J events on it, from inside the window, with no borrowing
//   at all. That is «если не w-серии то где-то еще» satisfied by the ladder rather than patched by
//   the feed, and it is a stronger answer: the fallback is a rung she can actually ENTER, where the
//   borrowed card was only ever guaranteed to be visible.
//
//   ⚠ AND IT HAS A KNOWN CORNER, MEASURED AND REPORTED RATHER THAN PATCHED (tools/boredom-guard.ts,
//   the receipt in the wave report). A seventeen-year-old already inside W50's acceptance list has
//   an all-professional window – {w15, w35, w50} – and a capped week there has no junior fallback
//   inside the window. It needs the maximal-grinder profile to exist at all (at a sane appetite the
//   cap is never exhausted: 0 refusals over 12 careers x 260 weeks), and the guard exits 1 on any
//   violation so the red stays loud.
//
// A merely EMPTY week still borrows nothing – ruling 9, «пустые недели это нормально» – which is
// the 03.08 reversal, and it is now the only rule there is about an empty week.
//
// ⚠ R15-9's NATIONAL EXEMPTION STAYS SUPERSEDED, and the cost is smaller than it was: the
// national-rung brand deal's keep-condition reads her DOMESTIC top 30, and National now closes when
// J300 opens rather than surviving as a capped-week substitute. A career deep in the W era will let
// that deal lapse at renewal. Flagged in the wave report for the owner; the alternative (pinning a
// rung open for a sponsor's sake) would put the junk back.
//
// ⚠ VISIBILITY, NEVER ACCESS – still true, and now in the other direction. This module reads the
// engine's verdict and never re-derives it; an ENTERED event always renders (the callers keep their
// entered-first arms), because a committed week is the one card she must be able to act on (R10-3).

/** What the feed rule needs to know about one upcoming event. A structural subset of
 *  `UpcomingEvent`, so the pure tests can build rows without the whole preview payload. */
export interface FeedEventFacts {
  id: string
  week: number
  tier: TierId
  entered: boolean
  eligible: boolean
  ineligibleReason?: string
}

/** The feed's derived state for one snapshot: the rungs inside the window, and the per-week AER
 *  substitutes riding inside it. Derived once per snapshot, consumed by both feed surfaces (the
 *  Season rows and the Calendar look-ahead), so the two cannot disagree. */
export interface FeedContext {
  /** EVERY RUNG THE ENGINE HOLDS OPEN, ladder order – what may be OFFERED. Since 06.08 that is every
   *  rung she has reached, the ones beneath her included: the lower bound stopped refusing, so a week
   *  whose only event is a rung she has outgrown is a week she can play rather than an empty one.
   *  Never a pick made here. */
  rungs: readonly TierId[]
  /** ...AND THE WORKING WINDOW INSIDE IT – the open rungs she has NOT walked past. This is what the
   *  old `rungs` used to be, and the two had to come apart on 06.08 because they answer different
   *  questions: `rungs` is "may this card render at all", `working` is "which rungs is her career
   *  ABOUT". The Home strip's collapse (the owner, 05.08: hide everything irrelevant behind the
   *  ellipsis) is denominated in the second one; the feed is denominated in the first, or removing
   *  the wall would have put the empty weeks straight back. */
  working: readonly TierId[]
}

// =================================================================================================
// ⚠⚠ AND THE TABLE SHE HAS LEFT (round-21 #5, backlog #84's last open half). The owner, for the
// SECOND time: «И мне всё ещё показывают local чемпионаты в ленте у обоих» - "у обоих" being both of
// his careers, so it is not one save's quirk.
// =================================================================================================
//
// HE IS RIGHT AND THE WINDOW CANNOT REACH IT, which is why this is a rule of its own rather than a
// bug in one above. MEASURED on a built world (tests/tier-window.test.ts, "the table she has left"):
// a twenty-two-year-old with a six-hundred-point professional book is offered
// `local, regional, national` beside `w100, wta125, wta250`, and `national` is inside her WORKING
// window as well - i.e. on the Home strip, as a rung her career is supposedly about.
//
// THE MECHANISM, and both halves are the ladder working exactly as written:
//   * `tierOpenFor` is `tierFloorOpen` alone since 06.08, and Local's floor is ZERO domestic points.
//     There is no book so empty that Local closes. It is open on week 0 and open for ever.
//   * the CEILING that used to collapse the domestic family upward - «Local closes when the
//     international door does» - is `tierOutgrown`, which asks whether the rung THREE ABOVE is open
//     TO HER TODAY, age included. Past eighteen J30/J60/J300 are age-shut for good, so the three
//     rungs above Local, Regional and National are permanently unopenable and the domestic three
//     never close again. HomeScreen's strip already documents this exact hole and works around it
//     with an ellipsis; the feed had no such collapse and printed the cards.
//
// SO THE FEED ASKS THE ONE QUESTION THE WINDOW CANNOT: WHICH TABLE IS HERS. `Snapshot.activeLadder`
// is the engine's own answer (`activeLadderOf` in engine/world/ladder.ts - professional from the
// first counting W result and permanently so), and a rung pays into ONE table (`TIERS[t].track`). A
// Local Open pays domestic points; a professional cannot spend them.
//
// ⚠ ONE TABLE OF SLACK, AND THE SEAM IS THE WHOLE REASON FOR IT. A hard "only her own table" would
// be wrong twice over: it would hide J30 from a domestic girl - the rung that is her only way ONTO
// the ITF table (`entryBandTrack`: a table's bottom rung is opened by the table below it) - and it
// would strip a girl on her first counting W15 of the J300s she is still visibly playing, which is
// the boredom failure the owner has ruled against twice. So the rule is "not more than one table
// below hers", and one table below is always still offered. Walked out, that is the whole of it:
//     active domestic -> everything (a fresh career must see its own ladder AND the door above it)
//     active itf      -> everything (she still holds a domestic book and the J rungs read her ITF
//                        rank; nothing is behind her yet)
//     active wta      -> ITF and professional; the DOMESTIC three go, and only they.
//
// ⚠ VISIBILITY, NEVER ACCESS - the module's own rule, and this obeys it rather than bending it. The
// 06.08 ruling was that the lower bound must not REFUSE («не надо нижнего предела вообще, пусть
// играет»), and it still does not: `entryStatus` is untouched, a Local remains enterable, an ENTERED
// Local still renders (`feedShows`'s first arm), and every finish she earned on the domestic rungs
// stays on the Home ladder's own chips. What changes is what the feed OFFERS her unasked.
//
// ⚠ AND IT CAN NEVER EMPTY THE FEED. If the filter takes everything - which needs a career whose
// only open rungs are two tables beneath her, i.e. nothing this engine produces - the unfiltered set
// comes back. Same discipline `working` already keeps one line down, and for the same reason: "the
// table below is behind her" and "nothing is hers" are not the same sentence.

/** How many tables BELOW her active one a rung may still be offered from. One – the seam. */
const FEED_TABLE_SLACK = 1

/** Drop the rungs that pay into a table she is more than `FEED_TABLE_SLACK` tables past. Total: an
 *  absent verdict, a bottom-table career and an empty result all return the input untouched. */
function paysIntoHerTables(
  rungs: readonly TierId[],
  active: LadderTrack | null | undefined,
): readonly TierId[] {
  if (!active) return rungs
  const floor = LADDER_TRACKS.indexOf(active) - FEED_TABLE_SLACK
  if (floor <= 0) return rungs
  const kept = rungs.filter((t) => LADDER_TRACKS.indexOf(TIERS[t].track) >= floor)
  return kept.length ? kept : rungs
}

export function feedContext(input: {
  ageYears: number
  /** the engine's per-rung verdict (`Snapshot.tierOpen`); absent (old fixtures, no snapshot yet)
   *  means hide nothing - the safe direction, exactly as the old latch rule read undefined */
  tierOpen?: Partial<Record<TierId, boolean>> | null
  /** ...and the engine's CEILING verdict (`Snapshot.tierOutgrown`); absent means "nothing is behind
   *  her", so `working` degenerates to `rungs` and every pre-06.08 caller reads exactly as it did. */
  tierOutgrown?: Partial<Record<TierId, boolean>> | null
  /** WHICH TABLE IS HERS (`Snapshot.activeLadder`, the engine's `activeLadderOf`). Absent means
   *  "do not judge the table" - the same safe direction an absent `tierOpen` already takes, so every
   *  hand-built fixture written before round-21 #5 reads exactly as it did. */
  activeLadder?: LadderTrack | null
  upcoming: readonly FeedEventFacts[]
}): FeedContext {
  const open = input.tierOpen
  if (!open) return { rungs: [...TIER_LADDER], working: [...TIER_LADDER] }
  // THE WINDOW IS THE ORACLE'S ANSWER, VERBATIM. Every arm the old pair rule needed - pick the
  // working rung, find the adjacent one, fall back when the horizon is empty - existed to
  // manufacture a width the ladder did not have. The ladder has it now (`tierOutgrown`), so there
  // is nothing left to decide: what is open is what is offered.
  //
  // ⚠ EXCEPT THE AGE DOOR, AND ROUND-17 #19 IS THE BILL FOR ASSUMING THE LADDER CARRIED IT. The
  // sentence above used to list "skip an age-dead door" among the arms it had deleted, and `ageYears`
  // was left on the input, accepted and never read. It does not carry it: `tierOpenFor` is
  // `tierFloorOpen`, and for j30 that is `onRampOpen('itf')` - A LATCH on points crossed once and
  // never re-examined. So `tierOpen.j30` stays true for ever and the feed offered a Junior Tour 30
  // to a twenty-year-old, on the owner's own save. The engine's turnstile refused it correctly the
  // whole time (`availabilityStatus`), which is exactly what made it a card that could not be
  // entered rather than a career-breaking bug - and exactly why nothing caught it.
  //
  // ⚠ 'old' ONLY, NEVER 'young'. A rung she has AGED OUT of can never open again, so its card is
  // dead furniture; a rung she is too YOUNG for opens on a birthday, and the feed is also how she
  // learns what is out there ("a locked rung is aspiration" - see `tierState`). Hiding those would
  // be the empty-weeks regression the 06.08 ruling was about.
  //
  // ⚠ AND READING TODAY'S AGE FOR AN EIGHT-WEEK HORIZON IS SAFE IN THIS DIRECTION, which is why it
  // needs no per-event age. Age is monotone in the week, so a rung she has already aged out of today
  // is aged out for every week in the horizon: this can hide a card that is dead later, and never a
  // card that is live.
  //
  // ⚠ AND THE TABLE FILTER RIDES HERE, ON THE OPEN SET, so BOTH answers inherit it: a rung she can
  // no longer be paid for is neither offered by the feed nor named on the Home strip. See the block
  // above for why it is one table of slack and not a hard cut.
  const rungs = paysIntoHerTables(
    TIER_LADDER.filter((t) => open[t] && tierAgeBlock(t, input.ageYears) !== 'old'),
    input.activeLadder,
  )
  const past = input.tierOutgrown
  // ⚠ AND THE WORKING WINDOW IS THE SAME ORACLE MINUS ITS CEILING, never a second derivation. An
  // ALL-outgrown answer would be a row with nothing in it, so it falls back to the whole open set:
  // "everything is behind her" and "nothing is hers" are not the same sentence, and the second one
  // is the one a blank strip would say.
  const working = past ? rungs.filter((t) => !past[t]) : rungs
  return { rungs, working: working.length ? working : rungs }
}

/** Does the feed show this event? The whole rule, one predicate, both consumers. */
export function feedShows(e: Pick<FeedEventFacts, 'id' | 'tier' | 'entered'>, ctx: FeedContext): boolean {
  return e.entered || ctx.rungs.includes(e.tier)
}

/** THE PICK for a week that stacks several events into one slot. Three tiebreaks, in this order:
 *  the ENTERED one (she is IN it - R10-3's lesson), then one she may actually ENTER, then the
 *  highest rung. The Season rows and the Calendar markers both pick through this, because the old
 *  shape - a Map whose LAST write won - showed the WEAKEST tier of every stacked week (buildSeason
 *  sorts a week strongest-first, so last is weakest), which is exactly why the owner never saw a
 *  J300 in the feed: every J300 week also holds a denser rung, and the denser rung always overwrote
 *  it.
 *
 *  ⚠ THE MIDDLE TIEBREAK IS NEW (05.08) AND IT IS A SECOND OWNER REPORT, ON THE SAME SHAPE AS THE
 *  OUTGROWN-ENTRY ONE: «у меня сейчас там висит 5 w-серий подряд, т.е. я вообще 5 недель не могу
 *  нигде играть, хотя j30, j60, j300 мне вполне доступны. Вместо этого я вижу 5 карточек с
 *  недоступными турнирами.» His professional allowance was spent (the AER, §5), so five weeks of W
 *  cards refused him - while the J events sitting on those same weeks, which ruling 2's boredom
 *  guard deliberately re-opens when the allowance runs out, were never shown. The pick asked only
 *  which rung was TALLER, never which one she could walk into, so the taller blocked card won every
 *  time. MEASURED before the change (tools/dead-week-probe.ts, 54 careers, 8 seasons): of the weeks
 *  whose card refused her for a spent allowance, 16% (grinder) and 38% (player) had an enterable
 *  event on the same week that this function was hiding - "w35 hid j60", "w15 hid j30", "w50 hid
 *  j300". The rest is supply rather than display and is NOT fixed here; see the probe's own header.
 *
 *  ⚠ AND A WEEK WHERE NOTHING IS ENTERABLE STILL SHOWS ITS TALLEST CARD. The feed is also how she
 *  learns what is out there - a locked rung is aspiration (see `tierState`) - so this reorders a
 *  stacked week and never empties one.
 *
 *  ⚠⚠ THE LADDER TIEBREAK IS WHAT «LEAD WITH THE MORE RELEVANT TOURNAMENT» MEANS, and on 06.08 it
 *  became load-bearing rather than cosmetic. The lower bound stopped refusing, so a week now
 *  routinely stacks several ENTERABLE rungs where it used to stack one - and the third tiebreak is
 *  the whole of what keeps her W75 in front of the Local sitting on the same week. It needed no
 *  fourth clause, and a "prefer the rung she has not outgrown" clause would have been WRONG: at
 *  nineteen the junior rungs are age-shut, so `tierOutgrown`'s age clause leaves Local NOT outgrown
 *  while W15 is - and that clause would have led with the club draw over the professional event.
 *  Height IS relevance on this ladder; outgrown-ness is not, and is only correlated with it.
 *  MEASURED on the change: docs/specs/ladder-floor-2026-08.md §2. */
export function preferredWeekEvent<E extends { tier: TierId; entered: boolean; eligible: boolean }>(
  events: readonly E[],
): E | null {
  let best: E | null = null
  for (const e of events) {
    if (!best) {
      best = e
      continue
    }
    if (e.entered !== best.entered) {
      if (e.entered) best = e
      continue
    }
    // ...then ACTIONABLE over merely tall. An entered card never reaches this line, so a committed
    // week is untouched by it - `eligible` is the ENTRY verdict and says nothing about a list that
    // closed with her on it (R10-3, and see `UpcomingEvent.eligible`'s own note).
    if (e.eligible !== best.eligible) {
      if (e.eligible) best = e
      continue
    }
    if (TIER_LADDER.indexOf(e.tier) > TIER_LADDER.indexOf(best.tier)) best = e
  }
  return best
}

/**
 * THE TABLE A RUNG'S ENTRY THRESHOLD IS COUNTED IN – the UI's copy of `entryStatus`'s own on-ramp
 * rule (world.ts): the bottom rung of a table is opened by the table BELOW it, because a player
 * cannot hold a ranking in a table she has never played in. So j30 (itf's on-ramp) reads her
 * DOMESTIC standing, w15 (wta's on-ramp) reads her ITF JUNIOR standing, and the domestic rungs
 * read their own table. Written per TRACK, exactly like the engine's arm, so a fourth table would
 * inherit the rule instead of needing a fourth label fix (docs/specs/two-ladders.md §4b).
 *
 * The acceptance rungs above the on-ramps (j60/j300/w35/w100) never carry a points threshold –
 * their gate is a rank cut – so for them this answer is never printed; it is still the honest one.
 */
export function entryBandTrack(id: TierId): Extract<LadderTrack, 'domestic' | 'itf'> {
  const track = TIERS[id].track
  return track === 'wta' ? 'itf' : 'domestic'
}

/**
 * The ONE wording for a point lock – shared, but the NUMBER always comes from the caller.
 *
 * ⚠ AND IT NAMES ITS CURRENCY (30.07, fix/ranking-truth). It used to read "Reach 250 pts", which is
 * two-thirds of a sentence: there are two point tables and this threshold is denominated in the
 * NATIONAL one. See `TierStateInput.points` below for the bug that cost.
 *
 * ⚠ THE CURRENCY IS THE TIER'S OWN (01.08, chore/w1-quick-wins, round-15's find). "Denominated in
 * the NATIONAL one" above was true of every rung that existed when it was written and became a lie
 * with W15, whose band is ITF junior points – the hardcoded label then printed "58 / 120 national
 * pts" on a W15 lock chip: domestic numerator, domestic label, ITF threshold. The caller now names
 * the tier and the label comes off `entryBandTrack` + `LADDER_POINTS_LABEL`, never a spelled-out
 * string – and the CALLER must supply `points` from that same table (see the two call sites).
 *
 * That split is deliberate and was learned the hard way in the browser: a Season card's lock is the
 * ENGINE's verdict on that specific event (`UpcomingEvent.pointsToEnter`), while the Home ladder's is
 * this module's read of the band against her displayed points. Having the card print the ladder's
 * verdict let a stale snapshot show "🔒 Open – on the calendar" on a card the engine had locked –
 * two sources of truth for one sentence, which is the exact class of bug R10-5 was about. So: every
 * surface keeps its own authoritative number and they all borrow the same words.
 */
export function pointsLockNote(tier: TierId, pointsToEnter: number, points?: number): string {
  const unit = LADDER_POINTS_LABEL[entryBandTrack(tier)]
  // A FRACTION WHEN THE CALLER KNOWS WHERE SHE STANDS. "112 / 250 pts" answers both halves of the
  // player's question in one glance - what opens this, and how far off is she - where "Reach 250 pts"
  // answered only the first and left the second on a screen she had to go and find.
  if (points === undefined) return `Reach ${pointsToEnter} ${unit}`
  return `${points} / ${pointsToEnter} ${unit}`
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
  // ⚠ A RANGE WHEN THE RUNG HAS AN END (§4.1), because "age 13" for a tier she will be thrown out of
  // at 19 is a half-truth on the one surface whose entire job is to state the gate. Still derived
  // from `TIERS`, so a re-priced cap re-words itself; still starts with `age ${minAgeYears}`, so the
  // clause reads the same way and every caller that greps for it still finds it.
  if (tier.minAgeYears !== undefined) {
    clauses.push(
      tier.maxAgeYears !== undefined
        ? `age ${tier.minAgeYears}-${tier.maxAgeYears}`
        : `age ${tier.minAgeYears}`,
    )
  }
  const [minPoints] = tier.enterPointBand
  // ⚠ "HAS AN ACCEPTANCE LIST" IS ONE QUESTION WITH TWO FIELDS BEHIND IT (W2-FIELD2), which is why
  // this asks the predicate rather than a field. The ITF and domestic rungs carry a SHARE
  // (`enterPct`) of a table that is a population artefact; the W rungs carry the real tour's own
  // ABSOLUTE cut (`acceptsRank`), because their table models real ranks now. Reading `enterPct`
  // directly here would have silently dropped the acceptance clause from every W rung's note - they
  // would have fallen through to the points branch below, whose band is `[0, MAX]`, and printed
  // nothing at all.
  if (hasAcceptanceList(id)) {
    // The acceptance list. Never a points figure: the rungs above the on-ramp do not read one, and
    // quoting the `[0, MAX]` band they carry instead would be the "0+" this function exists to kill.
    // The LIVE number wins when the caller has one (it is what the engine would actually apply);
    // the static fallbacks say the same thing in whichever unit the rung is written in.
    const fallback =
      tier.acceptsRank !== undefined
        ? `the top ${tier.acceptsRank} internationally`
        : `the top ${Math.round(tier.enterPct! * 100)}% internationally`
    clauses.push(acceptsRank !== undefined ? `the top ${acceptsRank} internationally` : fallback)
  } else if (minPoints > 0) {
    // The band's OWN currency (01.08): this clause fires for the domestic rungs and both on-ramps,
    // and w15's band is ITF junior points – "age 16 and 120 national pts" was the same wrong-label
    // bug pointsLockNote had, one sentence over.
    clauses.push(`${minPoints} ${LADDER_POINTS_LABEL[entryBandTrack(id)]}`)
  }
  // Local: no age gate, no floor. "Open from the start" rather than "0 pts" – a threshold of zero is
  // not a threshold, and printing one invites the player to look for progress against it.
  if (clauses.length === 0) return 'open from the start'
  return clauses.join(' and ')
}

/** How a finish READS in a sentence. `finishLabel` gives "Semifinalist", which is a person; a gap is
 *  measured in events, so this gives "semi-final". Same index convention (0 = the title).
 *
 *  ⚠ EXPORTED FOR THE "NEXT GOAL" LADDER (composables/nextGoal.ts), which names the same rounds in
 *  the same sentence shape - "Reach the semi-final at the Regional Championship" beside this file's
 *  "one more semi-final at Regional Championship". Two spellings of "the round after a quarter-final"
 *  is exactly the drift every shared-vocabulary note in this codebase is about. */
export function finishPhrase(finish: number, drawSize: number): string {
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
  /** ⚠ SHE HAS PASSED THIS RUNG, AND IT IS ORTHOGONAL TO `kind` (06.08). It rides BESIDE the kind
   *  rather than being one, because since the lower bound stopped refusing an outgrown rung is
   *  'scheduled' or 'unscheduled' – open, enterable, and beneath her all at once – and folding that
   *  into `kind` would break `isTierOpen` and put a padlock back on a tournament she may enter. The
   *  engine's own answer (`Snapshot.tierOutgrown`), never re-derived from a band here: the J and W
   *  bands are `[0, MAX]` and cannot express it at all. */
  outgrown?: boolean
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
  /** the PRO AER allowance (W2-LADDER §5), the junior cap's parallel one table up – read for the W
   *  rungs exactly as `entryCap` is read for the J rungs, and never for both at once: the two
   *  families are disjoint (`isCappedTier` / `isCappedProTier`). */
  proEntryCap: EntryCapUsage
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
  /** THE ENGINE'S CEILING VERDICT (`Snapshot.tierOutgrown[id]`) – "she is past this level", which
   *  since 06.08 is a label rather than a refusal. Undefined for the pure callers that predate it,
   *  and then the band arm below answers as it always did (which is exactly right for them: it is
   *  the only ceiling a caller with no oracle can know about). */
  engineOutgrown?: boolean
  /** THIS RUNG'S ACCEPTANCE CUT (`Snapshot.tierAcceptance[id]`), or undefined for a rung that gates on
   *  points instead. The engine's own number, never re-derived – see `tierOpensWhen`. */
  acceptsRank?: number
  /** ⭐⭐ THE ENGINE'S REFUSAL FOR THIS RUNG (`Snapshot.tierRefusal[id]`), or undefined when the rung
   *  is open - and undefined ALSO for a caller that has no world to ask, which is why every arm that
   *  reads it falls back to the live band rather than to "open". It is the same `entryVerdict` the
   *  turnstile runs, asked about a rung instead of a tournament (`tierVerdict`, world/medical.ts), so
   *  a card and `enterEvent` cannot disagree about whether a rung is shut.
   *
   *  ⚠ IT IS THE RUNG'S BASELINE and carries no per-event door, so a NAMED tournament can be more
   *  permissive than this and never less. A card explains the rule; it does not promise a wild card at
   *  a tournament it cannot name. */
  refusal?: TierRefusal
  /** her place in the INTERNATIONAL table, or null when she holds no counting result there. Only the
   *  acceptance-list lock reads it, and only to finish the sentence "it takes the top 100 – she is
   *  #128", which is the same sentence `entryStatus` writes on an individual event's card. */
  itfRank?: number | null
  /** HER ITF JUNIOR POINTS - her windowed best-6 in the INTERNATIONAL table (01.08, round-15's
   *  find). Only the w15 band arm reads it: W15's threshold is denominated THERE (`entryBandTrack`),
   *  and comparing/printing her domestic total against it was the "58 / 120 national pts" chip.
   *  Optional for the pure callers that predate it - a wta rung then reads 0, which is the safe
   *  direction (locked with an honest label) for a caller that did not say where she stands. */
  itfPoints?: number
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

  // ⚠ THE AGE LOCK HAS TWO ENDS SINCE §4.1, AND THEY ARE OPPOSITE KINDS OF NEWS. "Opens at 13" is a
  // countdown - a rung she is walking towards. "Aged out" is a door that has shut behind her, and
  // printing the OPENING sentence for it would tell a nineteen-year-old that the Junior Tour opens
  // at 13, which is both absurd and cruel. Same one `kind`, because the planner's job is identical
  // either way (the rung is not enterable and has nothing to say about scheduling); different
  // sentence, because the player's job is not.
  const ageBlock = tierAgeBlock(id, input.ageYears)
  if (ageBlock === 'old') {
    return {
      id,
      kind: 'age-locked',
      note: `Under-${tier.maxAgeYears! + 1}`,
      // No `tierOpensWhen` here on purpose: every clause it can write is a condition she could still
      // meet, and none of them is true any more. The tooltip states the rule and her age against it.
      title: `${tier.label} is under-${tier.maxAgeYears! + 1} – at ${input.ageYears} she has aged out of it.`,
    }
  }
  if (ageBlock === 'young') {
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
  // ⭐⭐ A LOCK THAT IS NOT A GAP (round 28 #12 Part 0, docs/specs/the-calendar-she-can-reach-
  // 2026-08.md). Every arm below prices a lock as a DISTANCE - "N more points", "opens in the top
  // N" - because until the Play Down family existed every lock WAS one. Those refusals are the
  // opposite: they fire because she is too GOOD for the rung, so there is no threshold to walk
  // towards and the arithmetic below prints a sentence that is false in both directions. Measured
  // on the owner's save at 26, WTA #110, with Part 0's engine closure in place and this arm absent:
  // Local Open read «locked: 0 more national pts (she has 0 of 0)» and Regional «65 more national
  // pts», which IS round 28 #12's second fault, surviving the engine fix by being re-derived here.
  //
  // ⚠ AND IT WAS ALREADY WRONG ONE TABLE UP, WHICH IS HOW IT GOT PAST REVIEW ONCE. The same shape
  // has been showing a top-150 professional «World Tour 15 - locked: 120 more international pts (she
  // has 0 of 120)» since the Play Down rule shipped (15.08): her junior book aged out years ago and
  // the number is unreachable and irrelevant. One arm fixes both, because it is the same defect.
  //
  // ⚠ THE TEST IS THE SHAPE OF THE VERDICT, NOT A LIST OF REASONS. A refusal carrying neither
  // `pointsToEnter` nor `rankToEnter` is exactly "a lock with no distance", so a future rule of this
  // kind inherits the right copy instead of needing this comment again - and the sentence printed is
  // the ENGINE's own (`playDownRefusalDetail`), never one rebuilt here, which is the whole discipline
  // `refusal` was added for (PR-09 / TB-05).
  //
  // ⭐ `kind` IS 'outgrown' AND NOT 'locked', deliberately: a padlock promises something to unlock,
  // and there is nothing. `isTierOpen` is false either way, so no surface offers her the rung.
  if (
    input.refusal?.reason === 'locked' &&
    input.refusal.pointsToEnter === undefined &&
    input.refusal.rankToEnter === undefined
  ) {
    return {
      id,
      kind: 'outgrown',
      outgrown: true,
      note: 'Outgrown',
      title: input.refusal.detail ?? `${tier.label} – she is past this level.`,
    }
  }
  // ⚠ THE BAND IS COMPARED IN ITS OWN CURRENCY (01.08, round-15's find). `input.points` is her
  // DOMESTIC total, and that is the right ruler for the domestic rungs and for j30's on-ramp - but
  // W15's band is ITF JUNIOR points (`entryBandTrack`), and holding her domestic 58 against its ITF
  // 120 produced both a wrong verdict (a lock the engine may not agree with) and a wrong chip
  // ("58 / 120 national pts"). The numerator, the comparison, the note and the title all read the
  // ONE number below, so they cannot mix tables among themselves.
  //
  // ⚠⚠ AND THE WHOLE BAND ARM YIELDS TO THE ENGINE'S VERDICT (task #77, W2-LADDER - the third
  // occurrence of visibility-vs-access, closed from the last direction it could still fire). The
  // oracle used to win only when it said FALSE (the arm below this block); when it said TRUE the
  // live band could still call the rung locked - and the on-ramps made that a real disagreement,
  // because their openness is a LATCH ("crossed once") while the band is a rolling window whose
  // evidence deletes itself. A girl whose junior book had aged out read "68 / 120 international
  // pts" on a W15 the engine held open for her. `engineOpen === true` therefore short-circuits
  // every band verdict: locked and outgrown can only be said about a rung the engine has not
  // already opened. Pure callers that predate the oracle (engineOpen undefined) keep the live
  // band, exactly as before.
  const bandTrack = entryBandTrack(id)
  const bandPoints = bandTrack === 'itf' ? (input.itfPoints ?? 0) : input.points
  // ⭐⭐ PR-09 / TB-05 – THE ENGINE DECIDES, THIS FILE SPEAKS. When `Snapshot.tierRefusal` carries a
  // verdict for this rung, it settles whether the rung is locked and WHY; the sentence below is still
  // written here, because wording, card layout and calendar decoration are the UI's job and policy is
  // not. When it is absent - a pure caller, an older test, a bench with no world - the live band
  // answers exactly as it always did, so nothing that predates the projection changes.
  //
  // ⚠ THIS IS THE LAST HALF OF THE RULE THIS FILE OWNED. `engineOpen` already settled "may she"; what
  // it could not say was "why not", so the threshold, the currency (`entryBandTrack`) and the
  // comparison stayed here as copies. Copies are what shipped the four defects the projection's own
  // note lists - including the W15 that read "68 / 120 international pts" on a rung the engine held
  // open, which is the very line this arm prints.
  const bandLocked = input.engineOpen !== true && bandPoints < minPoints
  const locked = input.refusal !== undefined ? input.refusal.reason === 'locked' : bandLocked
  if (locked) {
    // WHERE THE MISSING POINTS ARE EARNED, by table. The domestic sentence is the one this arm has
    // always said; the international one is its exact mirror for the w15 on-ramp - the J rungs are
    // the only events that pay the currency that band is counted in. Prose in a table rather than
    // derived from TIERS: "Local, Regional and National" are the player's short names, not the
    // catalogue's labels, and LADDER_LABEL supplies the currency word either way.
    const earnedAt: Record<'domestic' | 'itf', string> = {
      domestic: 'National points come from Local, Regional and National events.',
      itf: 'International points come from Junior Tour events.',
    }
    return {
      id,
      kind: 'locked',
      // ⚠ THE ENGINE'S NUMBER WHEN IT HAS ONE. It carries `pointsToEnter` for a DOMESTIC rung it
      // locked; an acceptance-list rung is refused on a rank instead, and there the band's own
      // threshold is still the honest thing to print beside her points.
      pointsToEnter: input.refusal?.pointsToEnter ?? minPoints,
      note: pointsLockNote(id, input.refusal?.pointsToEnter ?? minPoints, bandPoints),
      // THE LONG FORM CARRIES THE PLAN. The chip has room for the fraction; the tooltip has room for
      // what the fraction would take, and for the one sentence that says which of the two point
      // tables this threshold is even counted in.
      // The gap-in-results plan is DOMESTIC arithmetic (gapInResultsNote reads the domestic rungs
      // only - the two ladders have no exchange rate), so an ITF-denominated gap states the table
      // and stops rather than offering a plan priced in the wrong currency.
      title:
        `${tier.label} – locked: ${minPoints - bandPoints} more ${LADDER_POINTS_LABEL[bandTrack]} ` +
        `(she has ${bandPoints} of ${minPoints})` +
        `${bandTrack === 'domestic' && gapInResultsNote(minPoints - bandPoints, bandPoints) ? ` – ${gapInResultsNote(minPoints - bandPoints, bandPoints)}` : ''}` +
        `. ${earnedAt[bandTrack]}`,
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
  // (`bandPoints`, like the floor above: a ceiling is denominated in the same table as its floor.
  // Identical reads for every rung this arm can fire on - only the domestic rungs have a real
  // ceiling, and there bandPoints IS input.points.)
  if (input.engineOpen !== true && bandPoints > maxPoints) {
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
        `(age ${input.ageYears}). Not locked: a fresh allowance arrives on her next birthday.`,
    }
  }
  // The PRO cap's arm (W2-LADDER §5), in the same slot for the same reason - and its copy NAMES
  // THE RULE, per the owner's transparency ruling: it is the tour's age rule, it is this season's,
  // and the sentence says what stays open so "capped" can never read as "nothing to play".
  if (isCappedProTier(id) && input.proEntryCap.remaining <= 0) {
    const { used, limit } = input.proEntryCap
    return {
      id,
      kind: 'capped',
      entryCap: input.proEntryCap,
      note: `Tour age rule – ${used} of ${limit}`,
      title:
        `${tier.label} – the tour's age rule allows ${limit} pro entries at ${input.ageYears} and ` +
        `she has used all ${used}. Not locked: a fresh allowance arrives on her next birthday, and ` +
        `the junior and national events stay open.`,
    }
  }
  // She can enter it. The only question left is whether the calendar has one.
  //
  // ⚠ ...AND WHETHER SHE HAS WALKED PAST IT (06.08). Both open states carry the flag, and the COPY
  // changes with it rather than the kind: "Open – she is past this level" is a true sentence about a
  // rung she may still enter, and it is the sentence the ladder needs so that a player reading three
  // open domestic rungs under an open W50 can tell which one the game thinks is hers.
  const outgrown = input.engineOutgrown === true
  const nextWeek = input.upcoming
    .filter((e) => e.tier === id)
    .reduce<number | null>((best, e) => (best === null || e.week < best ? e.week : best), null)
  if (nextWeek !== null) {
    return {
      id,
      kind: 'scheduled',
      nextWeek,
      ...(outgrown ? { outgrown } : {}),
      note: outgrown ? 'Past this level – still open' : 'Open – on the calendar',
      // The DATE, not the week number: R11-6 owns week-number rendering, and a date needs no
      // in-season/absolute decision to be correct.
      title: outgrown
        ? `${tier.label} – she is past this level, and it is still hers to enter: next one ${weekRange(nextWeek)}. The stronger rung on a week takes the card.`
        : `${tier.label} – open to her, next one ${weekRange(nextWeek)}`,
    }
  }
  return {
    id,
    kind: 'unscheduled',
    ...(outgrown ? { outgrown } : {}),
    note: outgrown ? `Past this level – none in ${input.horizonWeeks} weeks` : `Open – none in ${input.horizonWeeks} weeks`,
    title:
      `${tier.label} – ${outgrown ? 'past this level but still hers to enter' : 'open to her'}, but none is scheduled in the next ${input.horizonWeeks} weeks. ` +
      `This tier comes round less often than the others; it is not locked.`,
  }
}

/** True when the tier is enterable right now – the two "open" states, whatever the calendar says.
 *  The predicate a surface should ask when it wants "can she play here at all". */
export function isTierOpen(state: TierState): boolean {
  return state.kind === 'scheduled' || state.kind === 'unscheduled'
}

// ⚠ THE HORIZON IS `UPCOMING_WEEKS`, IMPORTED – it used to be `HORIZON_WEEKS = 8` right here, with
// a comment saying it mirrored the engine's constant. A comment is not a link: the engine could have
// moved its horizon and this copy would have gone on saying eight, and the Season screen held a
// THIRD hand-copied eight of its own. `snapshot.upcoming` carries `week > current && week <=
// current + UPCOMING_WEEKS`, so that constant is not "a number the UI also happens to use" – it is
// the definition of what this module can see, and there is nothing here to name it a second time.

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
      horizonWeeks: UPCOMING_WEEKS,
      // No snapshot yet = nothing spent and nothing to say; the age gate/point band answer first.
      entryCap: snap?.entryCap ?? { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER },
      proEntryCap: snap?.proEntryCap ?? { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER },
    }
    // ...plus the engine's own verdict per rung, so the readout cannot invite her into an event
    // `enterEvent` will refuse (see `engineOpen`), and the engine's own acceptance cut for the rungs
    // that have one, so the locked plaque can name the list rather than describe a mood about it.
    return TIER_LADDER.map((id) =>
      tierState(id, {
        ...input,
        engineOpen: snap?.tierOpen?.[id],
        // ...and the engine's CEILING beside its floor (06.08). Two verdicts, because since the
        // lower bound stopped refusing they are two different facts about one rung.
        engineOutgrown: snap?.tierOutgrown?.[id],
        // ⭐⭐ ...AND WHY, WHICH IS THE HALF THIS FILE USED TO REBUILD (PR-09 / TB-05, 19.08).
        // `engineOpen` has said "may she" since W2-LADDER; the reason, the threshold and the currency
        // stayed here as copies of engine rules, and copies are what shipped the four defects the
        // projection's note lists. Absent for an OPEN rung, and absent for a caller with no snapshot -
        // both of which fall back to the live band, exactly as before.
        refusal: snap?.tierRefusal?.[id],
        acceptsRank: snap?.tierAcceptance?.[id],
        itfRank: snap?.ladders.itf.rank ?? null,
        // ...and her ITF junior total, for the one band denominated there (w15 - see itfPoints).
        itfPoints: snap?.ladders.itf.points ?? 0,
      }),
    )
  })
}
