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
import { TIERS, TIER_LADDER } from '../engine/season/calendar'
import { isCappedProTier, isCappedTier, tierAgeBlock } from '../engine/world'
import { weekRange } from '../shared/dates'
import { LADDER_POINTS_LABEL, type EntryCapUsage } from '../shared/protocol'
import type { LadderTrack, TierId } from '../engine/season/types'

export type TierStateKind = 'age-locked' | 'locked' | 'outgrown' | 'capped' | 'scheduled' | 'unscheduled'

// =================================================================================================
// ⚠ THE TWO-TYPE FEED (W2-LADDER §4, owner ruling 4). Visibility only: nothing here touches a gate.
// =================================================================================================
//
// The owner, 02.08: «мы должны сделать в рассписании так, чтобы игрок четко понимал что он может
// играть одно единственное для своей недели с некоторым пересечением тиров по году, чтобы не
// больше 2х типов турниров в год было, если она переросла J - вообще выводим... Если national
// доступен - показывать только их». At any moment the feed offers events of AT MOST TWO tier
// types: her WORKING rung and the ADJACENT one she is growing into.
//
// THE PAIR IS DERIVED FROM THE ENGINE'S OWN ORACLE, never from a band or a latch read here (task
// #77's resolution - third occurrence of visibility-vs-access, settled for the feed the way
// `engineOpen` settled it for the plaques):
//
//   working  = the highest rung `Snapshot.tierOpen` says is open to her AND THAT ACTUALLY HAS
//              TENNIS IN THE HORIZON. Bands overlap by design, so several rungs are usually open
//              at once - the highest PLAYABLE one is where she is actually climbing, and the ones
//              below it leave the feed however open they remain. That subsumes every rule this
//              module used to keep by hand: the points-outgrown filter,
//              R15-9's two latch rules, and the domestic collapse («Если national доступен -
//              показывать только их» - when National is the working rung, Local/Regional are
//              below the pair by construction).
//   adjacent = the next rung above it whose door has not closed for ever (an age-dead rung is
//              skipped: a nineteen-year-old's ladder steps from National straight to W15). A
//              rung she is merely too YOUNG for still shows - locked, "opens at 16" - because a
//              door she is walking towards is aspiration, not noise.
//
// The pair SLIDES as the oracle's verdicts change - {Local,Regional} -> {Regional,National} ->
// {National,J30} -> {J30,J60} -> ... - which is exactly the spec's "overlap across the year is
// how she transitions between them; the pair slides, the count never grows".
//
// ⚠ THE SUBSTITUTION RIDES INSIDE THE BUDGET, never as a third row (§4/§5): a week the pair leaves
// EMPTY - because the cap refused every pair event, or because the pair simply has nothing that
// week - shows the strongest OPEN, eligible below-pair event in its place: a J while she is young
// enough, the top open domestic rung after. So a week still reads as tennis rather than as a wall.
//
// ⚠ BOTH HALVES OF THIS RULE ARE THE GATE'S FINDINGS, NOT THE FIRST DESIGN (02.08, the owner's
// save at W38 '34 measured against the pre-wave build). The first shape read `working` as the
// highest OPEN rung full stop and substituted only on cap refusals, and on a real career that
// emptied the feed completely: the oracle opens W50/W75/WTA 125 to a 17-year-old at merged #61 -
// acceptance percentiles, honestly earned - while those rungs are rare (cadence 4/6/13) and had no
// event within her horizon. Nothing above them exists, so the pair collapsed to one eventless
// rung, and every rung where she actually plays sat below it: the pre-wave feed offered W15, J300,
// W35, J60 and W100 over the same weeks, the new one offered a single already-entered J60 and
// eight training weeks. That is precisely the failure the owner named when he approved the AER
// («игрок должен иметь возможность играть, если не w-серии то где-то еще, чтобы не скучал»), and
// the two-type budget must never be the thing that causes it. Hence: a rung with no tennis in the
// horizon cannot BE the working rung, and a week the pair leaves blank borrows from below.
//
// ⚠ R15-9's NATIONAL EXEMPTION IS SUPERSEDED by the later two-type ruling, and the cost is named
// rather than hidden: the national-rung brand deal's keep-condition reads her DOMESTIC top 30, and
// once her working pair is professional the Nationals that maintain that rank appear only as
// capped-week substitutes. A career deep in the W era will therefore let that deal lapse at
// renewal unless she is capped often enough to be offered Nationals - flagged in the wave report
// for the owner; the alternative (a third standing row) is exactly what ruling 4 forbids.
//
// ⚠ VISIBILITY, NEVER ACCESS. `entryStatus` / `tierOpenFor` are untouched: an ENTERED event always
// renders (the callers keep their entered-first arms), and a hidden tier she somehow holds an entry
// in still shows, because a committed week is the one card she must be able to act on (R10-3).

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

/** The feed's derived state for one snapshot: the at-most-two tier types, and the per-week AER
 *  substitutes riding inside that budget. Derived once per snapshot, consumed by both feed
 *  surfaces (the Season rows and the Calendar look-ahead), so the two cannot disagree. */
export interface FeedContext {
  /** [working, adjacent?] - adjacent absent only at the very top of the ladder */
  pair: readonly TierId[]
  /** event ids substituted INTO the budget on weeks the pro cap emptied */
  substitutes: ReadonlySet<string>
}

export function feedContext(input: {
  ageYears: number
  /** the engine's per-rung verdict (`Snapshot.tierOpen`); absent (old fixtures, no snapshot yet)
   *  means hide nothing - the safe direction, exactly as the old latch rule read undefined */
  tierOpen?: Partial<Record<TierId, boolean>> | null
  upcoming: readonly FeedEventFacts[]
}): FeedContext {
  const open = input.tierOpen
  if (!open) return { pair: [...TIER_LADDER], substitutes: new Set() }
  // THE WORKING RUNG IS THE HIGHEST OPEN ONE WITH TENNIS IN THE HORIZON. The fallback - the
  // highest open rung, whatever the calendar holds - is what a horizon with no events at all
  // (off-season, a long layoff) reads, and it keeps the pair defined at every week.
  const openRungs = TIER_LADDER.filter((t) => open[t])
  const scheduled = new Set(input.upcoming.map((e) => e.tier))
  const playable = openRungs.filter((t) => scheduled.has(t))
  const working = playable.length
    ? playable[playable.length - 1]
    : openRungs.length
      ? openRungs[openRungs.length - 1]
      : TIER_LADDER[0]
  const above = TIER_LADDER.slice(TIER_LADDER.indexOf(working) + 1)
  const adjacent = above.find((t) => tierAgeBlock(t, input.ageYears) !== 'old')
  const pair: TierId[] = adjacent ? [working, adjacent] : [working]

  const substitutes = new Set<string>()
  const byWeek = new Map<number, FeedEventFacts[]>()
  for (const e of input.upcoming) {
    const list = byWeek.get(e.week)
    if (list) list.push(e)
    else byWeek.set(e.week, [e])
  }
  for (const events of byWeek.values()) {
    // An ENTERED event of any rung already fills the week (`feedShows`' first arm), so a week she
    // is committed to never borrows - she has her tennis, and R10-3's committed card is the one
    // she must act on.
    if (events.some((e) => e.entered)) continue
    const pairEvents = events.filter((e) => pair.includes(e.tier))
    // ⚠ A CAP-REFUSED WEEK BORROWS. A MERELY EMPTY ONE DOES NOT (03.08, and this is a REVERSAL of
    // the same day's earlier floor - the owner's two rulings settled it in opposite directions and
    // the later one wins). The AER substitution is ruling 2: the tour's age rule refused her, so
    // the game owes her tennis somewhere else. Extending it to "the pair brought nothing this week"
    // was my own generalisation, written before ruling 9 - «пустые недели это нормально, она же не
    // может постоянно играть» - and it produced exactly what he called junk on his own W230 career:
    // at eighteen, WTA #27, four of the six cards in an eight-week horizon were borrowed W15s, a
    // J60 and a J30. A world #27 is not offered a $15k, and a feed that offers it reads as noise
    // rather than as choice. Blank weeks are the honest answer now that the planner's counter
    // states the season's whole supply out loud.
    const capRefused =
      pairEvents.length > 0 &&
      pairEvents.every((e) => TIERS[e.tier].track === 'wta' && e.ineligibleReason === 'capped')
    if (!capRefused) continue
    const fallback = events
      .filter((e) => !pair.includes(e.tier) && open[e.tier] === true && e.eligible)
      .sort((a, b) => TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))[0]
    if (fallback) substitutes.add(fallback.id)
  }
  return { pair, substitutes }
}

/** Does the feed show this event? The whole rule, one predicate, both consumers. */
export function feedShows(e: Pick<FeedEventFacts, 'id' | 'tier' | 'entered'>, ctx: FeedContext): boolean {
  return e.entered || ctx.pair.includes(e.tier) || ctx.substitutes.has(e.id)
}

/** THE PICK for a week that stacks several events into one slot: the entered one if any (she is IN
 *  it - R10-3's lesson), otherwise the highest rung. The Season rows and the Calendar markers both
 *  pick through this, because the old shape - a Map whose LAST write won - showed the WEAKEST tier
 *  of every stacked week (buildSeason sorts a week strongest-first, so last is weakest), which is
 *  exactly why the owner never saw a J300 in the feed: every J300 week also holds a denser rung,
 *  and the denser rung always overwrote it. */
export function preferredWeekEvent<E extends { tier: TierId; entered: boolean }>(events: readonly E[]): E | null {
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
  if (tier.enterPct !== undefined) {
    // The acceptance list. Never a points figure: the rungs above the on-ramp do not read one, and
    // quoting the `[0, MAX]` band they carry instead would be the "0+" this function exists to kill.
    clauses.push(
      acceptsRank !== undefined
        ? `the top ${acceptsRank} internationally`
        : `the top ${Math.round(tier.enterPct * 100)}% internationally`,
    )
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
  /** THIS RUNG'S ACCEPTANCE CUT (`Snapshot.tierAcceptance[id]`), or undefined for a rung that gates on
   *  points instead. The engine's own number, never re-derived – see `tierOpensWhen`. */
  acceptsRank?: number
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
  if (input.engineOpen !== true && bandPoints < minPoints) {
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
      pointsToEnter: minPoints,
      note: pointsLockNote(id, minPoints, bandPoints),
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
        `(age ${input.ageYears}). Not locked: a fresh allowance arrives next season.`,
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
        `she has used all ${used}. Not locked: a fresh allowance arrives next season, and the ` +
        `junior and national events stay open.`,
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
      proEntryCap: snap?.proEntryCap ?? { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER },
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
        // ...and her ITF junior total, for the one band denominated there (w15 - see itfPoints).
        itfPoints: snap?.ladders.itf.points ?? 0,
      }),
    )
  })
}
