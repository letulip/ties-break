// THE SNAPSHOT: everything the UI is ever allowed to see, built fresh from the world on every
// command.
//
// ⚠ THIS IS THE WIRE CONTRACT. The worker owns the world and the UI owns nothing – it receives one
// of these and renders it. Every field here is DERIVED at build time (there is no incremental
// invalidation and no caching), which is what makes a stale screen structurally impossible: a
// snapshot is either the whole current truth or it does not exist. The cost of that is real and
// known – see docs/review/01-architecture.md on rebuilding the whole thing for a `setPlan`.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports `toSnapshot` with no runtime cycle. Everything at runtime comes from SIBLING leaves; this
// file was the LAST block extracted precisely because it consumes almost all of them (measured at 35
// call-backs into world.ts before the package existed, 0 after).
//
// ⚠ RNG: nothing here draws. Building a snapshot must never move the MAIN stream – tests pin that a
// snapshot taken mid-career does not advance the sequence a tick is walking.
import { ECONOMY } from '../economy'
import { TIERS, TIER_LADDER } from '../season/calendar'
import { seasonYear } from '../../shared/dates'
import { formatShortName } from '../../shared/format'
import { coachById, tierOf } from '../coach'
import { coachManagesLoad, coachWarnsEntry } from '../coachLoad'
import { buildKnockPrompt, knockGoverns, knockLive } from '../knock'
import { hasLiveOffer, seasonLastWeek } from '../offers'
import { travelCoverShare } from '../academy'
import { buildDiarySnapshot, lastKidTitleOf } from '../diary'
import { buildKidLife, FRIENDS_WINDOW, schoolEndWeek, schoolIsOver } from '../kidLife'
import { axisReadings, buildRadar, buildTrainingRead } from '../radar'
import { previewEvent, eventCrowd, eventTemperature } from '../season/preview'
import { BEST_N_BY_TRACK, isCountingResult, windowSlots, windowedBestSum } from '../season/ranking'
import { isFieldProId, universeForTier } from '../season/fieldPros'
import { weekFieldExclusion } from '../season/tournament'
import { rivalConditions } from '../season/rival'
import type { AiPlayer, LadderTrack, RankingRow, SeasonEvent, TierId } from '../season/types'
import {
  type ArrivalPreview,
  type CountingResult,
  type LadderView,
  type PendingView,
  type Snapshot,
  type FullBracketMatch,
  type PendingBracketRound,
  type TierOpenMap,
  type StandingRow,
  type StopReason,
  type SeasonSupply,
  type UpcomingEvent,
} from '../../shared/protocol'
import {
  KID_ID,
  RESULTS_WINDOW,
  SNAPSHOT_EVENTS,
  SNAPSHOT_FINANCIAL_EVENTS,
  UPCOMING_WEEKS,
} from './constants'
import { financeWindow, financeSeries, seasonIndexOf, seasonStartWeek } from './ledger'
import { ageAtWeek, birthdayTurning, kidAgeAt, kidAgeYears, START_AGE_YEARS } from './age'
// ⭐ v48: the birthday popup's copy, assembled in the engine like every other dialog's.
import { birthdayHistory, buildBirthdayPrompt, giftNoun } from './birthday'
// W2-ENDINGS: the epilogue and the debt strip, built by the module that owns the latch.
import { buildDebtView, buildEndingView } from './endings'
import { finishLabel, stageLabel } from './labels'
import { entryCapUsage, proEntryCapUsage } from './entryCaps'
import { acceptanceRank, activeLadderOf, fieldProsOf, fullRanking, hasOutgrown, inTrack, kidPoints, prevRankIn, rankIn, rankingFor, tierOpenFor, wtaEverCounted } from './ladder'
export { activeLadderOf, wtaEverCounted }
import { arrivalStatus, entryStatus } from './medical'
import { eventById, vacationForWeek } from './bookings'
import { kidMatchPlayerFor } from './player'
import { coachBilling, coachEntryLine, coachLadderNote, coachMarket, coachRoomNote } from './coachMarket'
import { kitDealView, kitLineViews } from './kit'
import { copyByTrack, copyTrophyLedger, emptySeasonRecord } from './milestones'
import { computeLossStreak, fallbackPlayer, flipScore, kidMatchesOf, kidMatchEvent } from './matchNews'
import { coachLoadViewOf, pendingKnock, radarViewOf } from './knock'
import { travelCostFor } from './sponsors'
import { summerDayCapacity } from './summer'
import type { WorldState } from '../world'

// --- snapshot ----------------------------------------------------------------

/** WHAT IS LEFT TO PLAY THIS SEASON, by rung - the planning counter (owner, 02.08: «мне кажется мы
 *  где-то можем сделать каунтер сколько доступных турниров и какого уровня у нас до конца года
 *  вообще осталось, это даст человеку возможность планировать»).
 *
 *  ⚠ IT IS NOT THE FEED, AND THAT IS THE POINT. `upcoming` is eight weeks long and passes through
 *  the two-type rule, so a player planning a season could see neither how much tennis remains nor
 *  which rungs it is on - the very thing that made an ordinary sparse tail read as "there is
 *  nothing left". This counts the WHOLE rest of the season and every rung the ENGINE opens to her,
 *  the rare ones included. Blank weeks are normal and expected (the owner: «пустые недели это
 *  нормально, она же не может постоянно играть» - roughly 20 events a year is one per fortnight,
 *  with more on offer than she can take); what a planner needs is the supply, so that resting is a
 *  choice she can see the cost of rather than a hole she fell into.
 *
 *  AVAILABLE means: ahead of this week, inside THIS season, entry list still open, and the engine's
 *  own gate says she may enter (`entryStatus` level != 'blocked' - a fatigue 'caution' is a week
 *  she can play, which is the same reading the boredom guard uses). Snapshot-only, derived, zero
 *  persistence and zero draws.
 *
 *  COST, MEASURED RATHER THAN ASSUMED (week 160, 60 calls): `toSnapshot` goes 11.3 -> 15.3 ms, so
 *  this asks the entry gate about ~40 events for ~4 ms. Paid once per command rather than per week
 *  of a fast-forward's inner loop, which is why the honest per-event gate is affordable here at
 *  all - and why it is asked about the EVENT's week (an injury layoff covering it) rather than
 *  today's condition, which by then will be whatever the player decides between now and then. */
export function seasonSupply(world: WorldState): SeasonSupply {
  const entered = new Set(world.entries)
  const lastWeek = seasonLastWeek(world.week)
  const byTier = new Map<TierId, { open: number; entered: number }>()
  for (const e of world.season) {
    if (e.week <= world.week || e.week > lastWeek) continue
    const isEntered = entered.has(e.id)
    // An entry already made is hers whatever the gate says now (R10-3: a committed week survives a
    // band crossing), so it is counted before the gate is asked.
    if (!isEntered) {
      if (world.week > e.deadlineWeek) continue
      if (entryStatus(world, e).level === 'blocked') continue
    }
    const row = byTier.get(e.tier) ?? { open: 0, entered: 0 }
    row.open += 1
    if (isEntered) row.entered += 1
    byTier.set(e.tier, row)
  }
  return {
    weeksLeft: Math.max(0, lastWeek - world.week),
    // Ladder order, strongest last, the one order every other surface reads (TIER_LADDER).
    rows: TIER_LADDER.filter((t) => byTier.has(t)).map((tier) => ({ tier, ...byTier.get(tier)! })),
  }
}

export function upcomingEvents(world: WorldState): UpcomingEvent[] {
  const entered = new Set(world.entries)
  // The Season card's preview needs the standings and her match build ONCE for the whole list, not
  // once per card: both are the same for every event in the window, and rebuilding them per event
  // would be the expensive half of this function. Surface-specific scaling still happens per event
  // inside the preview, which is where it belongs.
  const ranking = fullRanking(world)
  // ...and the W cards get the W world (living-field phase W, 01.08). A W-track preview must draw
  // from the population its bracket will actually be made of – LIVE cohort ∪ field pros, positioned
  // by the merged W standings – or the card would name a junior the professional draw does not
  // contain. Same lazy-once shape as `ranking` above, paid only on windows that actually show a W
  // card; `previewEvent`'s own contract is untouched, it is simply handed the professional
  // universe as the cohort (the parameter always WAS "who can be drawn").
  let wtaCtx: { universe: AiPlayer[]; ranking: RankingRow[]; conditions: Map<string, number> } | null = null
  const wtaWorldFor = (e: SeasonEvent) => {
    wtaCtx ??= {
      universe: universeForTier(e.tier, world.cohort, fieldProsOf(world)),
      ranking: rankingFor(world, 'wta'),
      conditions: rivalConditions(world.results, world.week),
    }
    return { seed: world.seed, week: world.week, cohort: wtaCtx.universe, results: world.results }
  }
  // ...and the card obeys the same week-exclusivity rule its own bracket will (W2-FIELD2 §8.2), or
  // it would name an opponent the higher rung has already taken. Computed HERE because only this
  // function holds `world.season`; `previewEvent`'s own contract stays a single event's worth of
  // inputs. Lazy per card and only on the W track — a J or domestic card never asks.
  const wtaExclusionFor = (e: SeasonEvent) =>
    weekFieldExclusion(e, world.season, wtaCtx!.universe, wtaCtx!.ranking, world.seed, wtaCtx!.conditions)
  // ...and the same argument for the COACH'S READ OF HER: it is one girl in one week, identical for
  // every card, and `coachLoadViewOf` walks the retained match window to get there. Once per snapshot,
  // null on a self-coached career because there is nobody to have an opinion.
  const coachTier = tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId))
  const coachLoad = coachManagesLoad(coachTier) ? coachLoadViewOf(world) : null
  return world.season
    .filter((e) => e.week > world.week && e.week <= world.week + UPCOMING_WEEKS)
    .sort((a, b) => a.week - b.week)
    .map((e) => {
      // Round-10 R10-5: ONE call, the same `entryStatus` enterEvent and advanceWeeks read, instead
      // of this function's own copy of the point band + a separate availability call. `eligible`
      // and `ineligibleReason` therefore describe exactly what enterEvent would do, by construction
      // rather than by two implementations happening to agree.
      //
      // NOTE the scope: this is the ENTRY verdict. It is NOT a verdict on `entered` – a list that
      // closed with her on it keeps her on it whatever her points did afterwards, so an entered
      // card must never be treated as a lock (see `cancellable`, and R10-3).
      const gate = entryStatus(world, e)
      const isEntered = entered.has(e.id)
      const reason =
        gate.level === 'blocked'
          ? {
              ineligibleReason: gate.reason as
                | 'locked'
                | 'injured'
                | 'unavailable'
                | 'medical'
                | 'capped',
              ...(gate.pointsToEnter !== undefined ? { pointsToEnter: gate.pointsToEnter } : {}),
              ...(gate.rankToEnter !== undefined ? { rankToEnter: gate.rankToEnter } : {}),
              // Per-EVENT figures, exactly like pointsToEnter: a card near the year boundary can
              // be judged against a different season's allowance than today's, so the number it
              // prints has to be the one the gate actually used.
              ...(gate.entryCap !== undefined ? { entryCap: gate.entryCap } : {}),
            }
          : gate.level === 'caution'
            ? { cautionReason: gate.reason as 'fatigued', cautionDetail: gate.detail }
            : {}
      // THE HIRED COACH'S OPINION on this trip (load slice §8). Independent of the gate above: he can
      // speak on an 'ok' card (his margin is scaled by what he believes about her stamina, so a good
      // one warns BEFORE the fatigue rule does) and he can stay quiet on a 'caution' one (a cheap coach
      // who thinks she is tough). That gap is the thing being sold, so the two are never merged.
      //
      // Computed here rather than inside `entryStatus` deliberately: `entryStatus` is the ENGINE's
      // verdict on whether she may enter, and this changes no verdict at all. It is somebody's view.
      //
      // ⚠ AND ONLY ON A CARD SHE COULD ACTUALLY ENTER. A test caught this: the advice was being attached to
      // HARD-BLOCKED cards too - a tier she has no points for, an exam week, a season whose entry cap she
      // has spent - so a coach was giving his view on a tournament that is not on offer. Worse, it made
      // "the advice never locks a card" unverifiable, because the card was already locked for its own
      // reasons and the two were indistinguishable on screen. He speaks about trips she can take.
      //
      // ⚠ AND SINCE 08.08 HE HAS A SECOND SUBJECT: THE LADDER, not only the body (the owner's ruling
      // on the ladder floor - having somewhere to play is the correct state of the world, what she
      // does with the week is the PLAYER's decision, and giving the coach a voice is how that
      // decision stops being blind). Precedence is BODY FIRST and it is not a coin toss: one of them
      // is about getting hurt and the other is about a wasted week. He says one thing, because a
      // card with two coach lines on it is a dialog, and he is a person.
      const bodySay =
        gate.level !== 'blocked' &&
        coachLoad !== null &&
        coachWarnsEntry(coachLoad, ECONOMY.availability.minConditionToEnter[e.tier])
          ? coachEntryLine(e.tier, world.condition)
          : null
      // The same "only about trips she can take" rule the body arm has always had, and the same
      // "nobody is being paid to have a view" one: a self-coached career hears nothing, from either.
      const ladderSay =
        bodySay === null && gate.level !== 'blocked' && coachLoad !== null
          ? coachLadderNote(world, e, coachTier)
          : null
      const say = bodySay ?? ladderSay
      const coachSay = say !== null ? { coachCaution: say } : {}
      return {
        id: e.id,
        week: e.week,
        tier: e.tier,
        surface: e.surface,
        // What the Season card can honestly say before she plays: her odds in round one against
        // the field as it stands TODAY, how strong that field is, and the (decorative) weather.
        // See season/preview.ts for what this estimate does and does not claim.
        preview:
          TIERS[e.tier].track === 'wta'
            ? previewEvent(
                wtaWorldFor(e),
                e,
                wtaCtx!.ranking,
                kidMatchPlayerFor(world, e.surface),
                wtaExclusionFor(e),
              )
            : previewEvent(world, e, ranking, kidMatchPlayerFor(world, e.surface)),
        // v21: the price the FAMILY pays, scholarship included – the planner has to quote what
        // entering will actually cost, and it is the same number chargeTravel will take.
        travelCostCents: travelCostFor(world, e),
        deadlineWeek: e.deadlineWeek,
        entryFeeCents: TIERS[e.tier].entryFeeCents,
        label: TIERS[e.tier].label,
        entered: isEntered,
        // A fatigued event is a CAUTION, not a block: she stays eligible. Only a HARD block
        // (point band, injured, unavailable, medical) removes eligibility.
        eligible: gate.level !== 'blocked',
        // R10-13: the entry is COMMITTED (the list has closed) but the week has not started yet –
        // the only window in which cancelling costs the fee and frees the week. Every row here is
        // a FUTURE week by construction, so the closed list is the whole condition.
        cancellable: isEntered && world.week > e.deadlineWeek,
        // ⚠ SHE HAS PASSED THIS RUNG, AND IT IS NOT A LOCK (06.08). Carried BESIDE `eligible` rather
        // than inside `ineligibleReason`, which is where it used to live: the two are orthogonal now,
        // and the card has to be able to say "still yours, and beneath you" in one breath.
        ...(gate.outgrown ? { outgrown: true } : {}),
        ...reason,
        ...coachSay,
      }
    })
}

/** R12-15/R12-3: the arrival verdict for the entered event on `world.week + 1` – the week the
 *  sticky bar's one button plays (tickWeek increments the week FIRST, so it is always `week + 1`,
 *  never today). Null when no entry sits there.
 *
 *  The DOCTOR's arm is downgraded to 'play' on purpose (see ArrivalPreview): his verdict is re-read
 *  on arrival against a condition that can only have RISEN by then (a tournament week accrues
 *  `matchWeekRecoveryBase` = 0, plus the physio and blackout bonuses, and nothing subtracts before
 *  step 2), so a 'medical' preview can be false by a point or two. Announcing a withdrawal that
 *  then does not happen would replace the old lie with a new one; the medical stop + toast already
 *  make the real thing loud. The layoff and the point band are pure state and cannot move, so those
 *  two ARE previewed. */
export function arrivalPreview(world: WorldState): ArrivalPreview | null {
  const next = world.week + 1
  const event = world.season.find((e) => e.week === next && world.entries.includes(e.id))
  if (!event) return null
  const status = arrivalStatus(world, event)
  const injured = status.verdict === 'injured'
  return {
    eventId: event.id,
    tier: event.tier,
    week: event.week,
    verdict: injured ? 'injured' : 'play',
    ...(injured && status.detail !== undefined ? { detail: status.detail } : {}),
    outgrown: status.outgrown,
  }
}

// The kid's counted best-6 results (round-5 item 1b): same window + sort as computeRanking,
// so their points sum equals the kid's standings points. Strongest first. `isCountingResult` is
// the same filter computeRanking applies, named rather than respelled – "counting" has to mean one
// thing in both places or this list and the standings total drift apart the moment a scoreless row
// reaches the kid's half of the ledger.
export function computeCountingResults(world: WorldState, track: LadderTrack = 'itf'): CountingResult[] {
  // TWO LADDERS: this list EXPLAINS a ranking, so it has to be the same table as the rank beside it.
  // Hence the track argument - `ladders[track].countingResults` pairs each list with its own rank,
  // and an empty ITF list is the honest reading of "unranked internationally".
  // The slice is the TRACK's window width (W2-LADDER §3): EIGHTEEN rows on the professional list,
  // six on the others - the list's sum must equal the rank beside it, and the rank counts best-N.
  //
  // ⚠ AND IT IS `windowSlots`, NOT `.slice(0, N)` (points-by-the-book, 05.08). The professional
  // window reserves eleven of its eighteen for Slams and 1000s, so "the counted results" and "the
  // best N results" stopped being the same list the day a player got into those draws - and this
  // list exists precisely to EXPLAIN the number beside it. A plain slice would show her a set of
  // rows that does not add up to her own total, which is the one thing this function must never do.
  // Sorted strongest-first afterwards, because `windowSlots` returns reserved rows first and a
  // player reads this list as a league table.
  const inWindow = world.results.filter(inTrack(track))
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === KID_ID &&
        r.week <= world.week &&
        world.week - r.week <= RESULTS_WINDOW,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
  return windowSlots(inWindow, BEST_N_BY_TRACK[track])
    .sort((a, b) => b.points - a.points || b.week - a.week)
    .map((r) => ({ week: r.week, tier: r.tier, points: r.points }))
}

/** BOTH TABLES, THE SAME SHAPE - the half of docs/specs/two-ladders.md the UI never got.
 *
 *  The spec designed two currencies with no exchange rate and then every screen kept showing ONE
 *  number called "rank" and ONE called "points", both read off the ITF table. So a career spent on
 *  the domestic rungs - which is most of a fourteen-year-old's career, and ALL of a working-class
 *  one's - showed a Stats table reading 4 points while she had 604, a Kid screen reading "No points
 *  yet", and a Home ladder asking her to "Reach 250 pts" it had already let her past. Three of the
 *  owner's 30.07 items are that.
 *
 *  A LadderView is therefore the unit the screens consume: one table's rank, points, standings and
 *  the results that earned them, in that table's own currency. Two of them, identically shaped, so a
 *  screen renders "a ladder" once instead of special-casing which one it has.
 *
 *  Pure derivation over the ledger the world already keeps - no persisted field, no schema bump, no
 *  migration, zero RNG draws. */
/** HER PLACE IN ONE TABLE, or null when she holds no counting result in it.
 *
 *  ⚠ ONE IMPLEMENTATION, TWO CONSUMERS, and the second one is why it was extracted (31.07): the
 *  tournament overlay prints her rank too, and it must print the SAME number the Home chip and the
 *  Stats tab are showing at that moment or the app contradicts itself on the one screen where the
 *  player is looking hardest. That is not automatic - on a reveal week the tick DEFERS the rank
 *  recompute to `finalizeTournament` (see step 5) while the week's AI results are already in the
 *  ledger, so a freshly-folded rank and the cached one legitimately differ by a place or two until
 *  she finishes her run. Reading the cache through one function is what makes the two agree by
 *  construction instead of by coincidence. */
/** ⚠ THE TEST IS HER POINTS, NOT THE LENGTH OF HER RESULTS LIST (points-by-the-book, 05.08), and
 *  the two came apart when §VIII.A.2.b's minimum landed. It used to ask `countingResults.length > 0`,
 *  which was the same question while every counting result paid something: a player with rows had
 *  points and a player without had neither. Two rules broke that equivalence – a `mandatoryMiss`
 *  zero is a counting row worth nothing, and a professional below the minimum has rows that do not
 *  put her on the list – and under either she would have read as a RANK on a total of zero, which is
 *  the "unranked is not a number" bug this function exists to prevent, arriving from the other side.
 *  Behaviour-identical on the domestic and ITF tables, where neither rule applies. */
export function kidLadderRank(world: WorldState, track: LadderTrack): number | null {
  return kidPoints(world, track) > 0 ? rankIn(world, track) : null
}

export function computeLadderView(world: WorldState, track: LadderTrack): LadderView {
  const counting = computeCountingResults(world, track)
  const points = kidPoints(world, track)
  // ⚠ WHAT §VIII.A.2.b IS WITHHOLDING, so a screen can say it (round-16 #3 – see `LadderView.banked`
  // for the owner's report and the measurement). The counted rows are the ones the list beside the
  // number already shows, so "banked" and "counting results" are folded from one array and cannot
  // drift; `rankableTotal` is the only thing between this sum and `points`, which is exactly the
  // gap the sentence has to explain. Absent whenever the two agree, which is every domestic row,
  // every ITF row, and every professional row past the minimum.
  const banked = counting.reduce((sum, r) => sum + r.points, 0)
  return {
    ...(points === 0 && banked > 0 ? { banked } : {}),
    // Her place a week ago IN THIS TABLE - see `prevKidRankDomestic` on WorldState for why both are
    // carried rather than one shared "previous rank".
    prevRank: prevRankIn(world, track),
    // UNRANKED IS NOT A NUMBER. With nobody holding a point the whole field ties at zero and
    // competition ranking hands every member of that tie the same place, so a point-less kid reads
    // as a single digit. The screens have always papered over that by asking `countingResults.length
    // > 0` themselves; making it null HERE means they cannot forget, and the two questions ("where
    // is she?" and "is she ranked at all?") stop being one field.
    rank: kidLadderRank(world, track),
    points,
    standings: computeStandings(world, track),
    countingResults: counting,
  }
}

// ⚠ AN ORPHANED DOC-COMMENT OPENER STOOD HERE ("Her cached place in `track`. The caches are the
// authority...") with no closing `*/` and no function under it – `rankIn` moved to world/ladder.ts
// in the P4 decomposition and left its half-sentence behind. It compiled only because the NEXT
// jsdoc's `*/` closed it, which meant that block's own text was silently swallowed too. Removed
// with the move below rather than left as a trap for the next reader; the real note lives on
// `rankIn` in world/ladder.ts, where the function is.

// wtaEverCounted / activeLadderOf: MOVED to world/ladder.ts (fix/wallet-and-wrapup, 05.08) and
// imported back below, re-exported here under their historical names so every existing
// `from '.../world/snapshot'` and `from '.../engine/world'` call site keeps working. They are
// ladder facts, and the season wrap-up (world/milestones.ts) needs the same one answer to "which
// table is hers" – but `snapshot.ts` imports `milestones.ts`, so reading it from here would have
// been a runtime cycle. Moving the rule DOWN the graph is the fix; a second copy of it in
// milestones.ts would have been exactly the drift `activeLadderOf` exists to prevent.

export function computeStandings(world: WorldState, track: LadderTrack = 'itf'): StandingRow[] {
  const full = rankingFor(world, track)
  // ⚠ AGE JOINS NAME AND NATION (R14 group E, the owner's «возраста девочек добавить в stats доп
  // колонкой»), and it is HER OWN – see `StandingRow.ageYears`. A rival's is the `ageYears` her cohort
  // row has carried since v20: drawn once per girl and advanced at each season boundary, the same
  // number `rivalMatchPlayer` hands the serve-speed curve. Not the band – `COHORT.ageBand` is the
  // RANGE the draw comes from, and nobody stores it.
  const meta = new Map<string, { name: string; nation: string; ageYears?: number }>()
  for (const p of world.cohort) meta.set(p.id, { name: p.name, nation: p.nation, ageYears: p.ageYears })
  // The W table's virtual rows carry real names and flags too (living-field phase W, 01.08) – the
  // fallback below would otherwise print "fp-141" the day the Stats screen grows its World Tour
  // tab. The table itself stays windowed exactly as every table always was (top 10 + around the
  // kid, built a few lines down), so ~500 rows cost the snapshot nothing.
  if (track === 'wta') {
    for (const p of fieldProsOf(world)) meta.set(p.id, { name: p.name, nation: p.nation, ageYears: p.ageYears })
  }
  // Full name so the UI can render "V. Last" for the kid like everyone else (formatShortName).
  // ⚠ AND HER AGE IS `kidAgeAt`, THE ONE CLOCK (ruling of 09.08) – off her birth date, so a December
  // girl reads 13 in the January her January-born rivals read 14. `ageAtWeek` would have printed the
  // band here and put the Stats table a year ahead of her own birthday note.
  meta.set(KID_ID, {
    name: `${world.profile.kidName} ${world.profile.kidLastName}`.trim(),
    nation: world.profile.country,
    ageYears: kidAgeAt(world, world.week),
  })
  const enrich = (r: RankingRow, gapBefore: boolean): StandingRow => {
    const m = meta.get(r.playerId) ?? { name: r.playerId, nation: '' }
    return {
      ...r,
      name: m.name,
      nation: m.nation,
      isKid: r.playerId === KID_ID,
      gapBefore,
      ...(m.ageYears === undefined ? {} : { ageYears: m.ageYears }),
    }
  }
  // Top 10 + a window around the kid, as *positions in `full`* rather than as slices
  // deduped by id – tracking the underlying index (not the rank number) is what lets
  // `gapBefore` below tell a genuine omission from a competition-ranking tie-skip,
  // which also jumps the rank number by more than 1 without anyone being left out.
  const kidIdx = full.findIndex((r) => r.playerId === KID_ID)
  const topEnd = Math.min(10, full.length)
  const aroundStart = kidIdx >= 0 ? Math.max(0, kidIdx - 2) : -1
  const aroundEnd = kidIdx >= 0 ? Math.min(full.length, kidIdx + 3) : -1
  const includedIdx: number[] = []
  for (let i = 0; i < topEnd; i++) includedIdx.push(i)
  for (let i = Math.max(aroundStart, topEnd); i < aroundEnd; i++) includedIdx.push(i)
  return includedIdx.map((idx, pos) => enrich(full[idx], pos > 0 && idx !== includedIdx[pos - 1] + 1))
}

// Any id -> short display name, for anyone who could appear in a bracket (kid or AI),
// not just the kid's own opponents (unlike `players`, which only snapshots those).
// Field pros resolve through the same derivation that drew them (living-field phase W, 01.08):
// the id encodes nothing, but fieldProsOf is season-stable and memoised, so a W draw's full
// bracket names its professionals as cheaply as the cohort array names the juniors.
export function playerShortName(world: WorldState, id: string): string {
  if (id === KID_ID) return formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  if (isFieldProId(id)) {
    const fp = fieldProsOf(world).find((p) => p.id === id)
    return formatShortName(fp?.name ?? id)
  }
  const ai = world.cohort.find((c) => c.id === id)
  return formatShortName(ai?.name ?? id)
}

// The live view of an in-progress reveal (drives TournamentFlow). Lean: the revealed path, the
// current round's opponent + record, and the finale copy. Scorelines belong to the record and are
// never shown by the UI before a match has been watched/skipped.
export function pendingView(world: WorldState): PendingView | undefined {
  const p = world.pendingTournament
  if (!p) return undefined
  const event = eventById(world, p.eventId)
  if (!event) return undefined
  const tier = TIERS[event.tier]
  const kidMatches = kidMatchesOf(p.result)
  const revealed = p.revealedRounds

  const bracket: PendingBracketRound[] = kidMatches.slice(0, revealed).map((m) => {
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    return {
      roundLabel: stageLabel(m.round, tier.drawSize),
      oppName: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      kidWon: m.winnerId === KID_ID,
      score: m.score && m.bId === KID_ID ? flipScore(m.score) : m.score,
    }
  })

  // Round 5 item 5: the FULL draw (every match, every player). During her run this is bounded
  // to the kid's played rounds (0..revealed-1; single elim, she plays every round until
  // eliminated) so later rounds stay spoiler-free. Round-7 (spectate): once her run is FINISHED
  // there are no spoilers left to protect, so the whole draw is exposed – every round through
  // the Final – letting the flow spectate the tournament to its conclusion past her exit.
  // `score` is always normalised to the WINNER's perspective (conventional "W d. L 6-4 ..."
  // reading) regardless of which bracket side (a/b) actually won – MatchRecord stores it
  // from side A's perspective, so it only needs flipping when B won.
  const lastRound = p.finished ? Math.max(...p.result.matches.map((m) => m.round)) : revealed - 1
  const fullBracket: FullBracketMatch[] =
    lastRound < 0
      ? []
      : p.result.matches
          .filter((m) => m.round <= lastRound)
          .map((m) => ({
            round: m.round,
            roundLabel: stageLabel(m.round, tier.drawSize),
            aId: m.aId,
            bId: m.bId,
            aName: playerShortName(world, m.aId),
            bName: playerShortName(world, m.bId),
            winnerId: m.winnerId,
            score: m.score && m.winnerId === m.bId ? flipScore(m.score) : m.score,
          }))

  // The round being presented: the next unrevealed match, or (finished) the last one played.
  const currentIdx = revealed < kidMatches.length ? revealed : kidMatches.length - 1
  const current = kidMatches[currentIdx]
  const oppId = current.aId === KID_ID ? current.bId : current.aId
  // ⚠ THE TABLE THIS TOURNAMENT IS ACTUALLY PLAYED ON – see `PendingView.ladder` for the owner's
  // report and what it cost. This line used to read `fullRanking(world)`, whose doc comment says
  // outright "THE table when only one is meant: the ITF one", so every rank the tournament overlay
  // printed came from the international table even when the trophy on the table paid national points.
  const track = tier.track
  const ranks = new Map(rankingFor(world, track).map((r) => [r.playerId, r.rank]))
  const oppNation = world.cohort.find((c) => c.id === oppId)?.nation ?? ''
  const oppAge = p.players[oppId]?.age
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)
  // UNRANKED IS NOT A NUMBER, for either girl, and it is the same rule `computeLadderView` applies to
  // the kid: with nobody holding a point in this table the whole field ties at zero and competition
  // ranking hands every member of that tie the same place. Asked of the OPPONENT too, because the two
  // numbers sit side by side on the VS card and a real "#3" against a tie-floor "#119" invites a
  // comparison that is not there.
  //
  // ⚠ TWO SOURCES, DELIBERATELY, AND THE ASYMMETRY IS THE CONSERVATIVE CHOICE. HER number comes
  // through `kidLadderRank`, i.e. off the same cache `ladders[track].rank` reads, so the overlay can
  // never print a different place for her than the screens behind it - the exact failure this branch
  // is about. The OPPONENT's is folded here because nothing caches it and nothing else prints it, so
  // it has nothing to disagree with. On a reveal week the two can be a place apart (the tick defers
  // the rank recompute to `finalizeTournament` while the week's AI results are already banked); a
  // one-place drift between two different players' numbers is invisible, whereas a drift in HERS
  // between two screens is the bug.
  // A FIELD PRO IS ALWAYS RANKED (living-field phase W, 01.08): her points are virtual, so the
  // ledger fold below would read 0 and print her "unranked" – on the very row the merged table
  // ranks her by. The earned-points guard exists to stop TIE-FLOOR ranks being printed for players
  // with nothing; a pro's standing row is never that, by construction (wtaPoints >= 1).
  const oppRankIn = (id: string): number | null =>
    isFieldProId(id) || windowedBestSum(world.results, world.week, id, BEST_N_BY_TRACK[track], inTrack(track)) > 0
      ? (ranks.get(id) ?? null)
      : null

  return {
    eventId: p.eventId,
    tier: event.tier,
    surface: event.surface,
    // The weather plate on the live match. Same function the Season card quotes, so one tournament
    // has one day. VIEW ASSEMBLY ONLY - see the grep guard in tests/preview.test.ts.
    temperatureC: eventTemperature(world.seed, event),
    roundLabel: stageLabel(current.round, tier.drawSize),
    ladder: track,
    kidRank: kidLadderRank(world, track),
    opponent: {
      name: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      nation: oppNation,
      rank: oppRankIn(oppId),
      // HOW OLD SHE IS (the owner: «и в турнирах перед матчем тоже можно показывать»), off the FROZEN
      // player rather than off today's cohort row – see `PendingView.opponent`. `rivalMatchPlayer` sets
      // `age` from her `ageYears` at composition, so this is her age on the day of the match; a reveal
      // frozen before that field existed has none, and the card prints nothing rather than a default
      // (LEGACY_SNAPSHOT_AGE is the match engine's fallback for arithmetic, not a fact about a person).
      ageYears: oppAge === undefined || !Number.isFinite(oppAge) ? null : Math.floor(oppAge),
    },
    // Only expose a record to watch while there is still an unrevealed round.
    kidMatch: revealed < kidMatches.length ? kidMatchEvent(world, event, current, p.players).match : undefined,
    bracket,
    fullBracket,
    finished: p.finished,
    kidChampion: kidFinish === 0,
    tierLabel: tier.label,
    points: tier.points[kidFinish] ?? 0,
    finishLabel: finishLabel(kidFinish),
    // The E brief's crowd. Its own `seed:crowd:` sub-stream, so reading it here costs the MAIN
    // stream nothing (the frozen 41550 / e6b0c709 capture is untouched by construction) and it is
    // the SAME figure the Season card printed while the event was still upcoming.
    crowd: eventCrowd(world.seed, event),
  }
}

/** ⭐ v48 – THE PRESENT, AS THREE FACTS THE DIARY CAN PRINT WITHOUT KNOWING WHAT A CATALOGUE IS.
 *
 *  Reads THIS week's row, which exists only once he has answered – so all three are the empty answer
 *  on every other week and on a birthday still waiting for him.
 *
 *  ⚠ THE REPEAT LOOKS BACKWARDS ONLY, and past THIS row rather than including it, or every present
 *  would be a repeat of itself. It is the field that pays for the owner's ruling that the catalogue
 *  may repeat (11.08: «вполне можно») «and the diary is expected to notice». */
function birthdayGiftFactsOf(world: WorldState): {
  birthdayGift: string | null
  birthdayWanted: boolean
  birthdayRepeatAge: number | null
} {
  const history = birthdayHistory(world)
  const today = history.find((b) => b.week === world.week)
  if (!today || today.given === null) return { birthdayGift: null, birthdayWanted: false, birthdayRepeatAge: null }
  const earlier = history.filter((b) => b.week < world.week && b.given === today.given)
  return {
    birthdayGift: giftNoun(today.given),
    birthdayWanted: today.given === today.asked,
    birthdayRepeatAge: earlier.length ? earlier[earlier.length - 1].age : null,
  }
}

export function toSnapshot(world: WorldState, stopReasons?: StopReason[]): Snapshot {
  const pending = pendingView(world)
  // Computed ONCE and shared by the snapshot field and the diary facts – two computations could
  // never disagree, but one is also cheaper and reads as the single decision it is.
  const lossStreak = computeLossStreak(world)
  // Diary-1: the facts + the selected lines, assembled from a narrow view of the world. Selection
  // draws only from `seed:diary:*` / `seed:memory:*` sub-streams at SNAPSHOT time – zero MAIN
  // draws, so the frozen capture (41550 / e6b0c709) is untouched by construction.
  const diary = buildDiarySnapshot({
    seed: world.seed,
    week: world.week,
    schoolOver: schoolIsOver(world.week, world.profile.birthMonth),
    kidId: KID_ID,
    startAgeYears: START_AGE_YEARS,
    condition: world.condition,
    fundsCents: world.fundsCents,
    injury: world.injury
      ? {
          kind: world.injury.kind,
          weeksRemaining: world.injury.weeksRemaining,
          totalWeeks: world.injury.totalWeeks,
        }
      : null,
    events: world.events,
    lossStreak,
    // ⚠ HER LADDER, NOT THE INTERNATIONAL ONE (31.07, fix/ladder-separation). This pair feeds exactly
    // one derivation - `rankClimbed` - and `rankClimbed` licenses three lines that say she "moved up
    // the table" plus the loss softener behind her face. It was `world.kidRank` / `world.prevKidRank`,
    // the ITF pair, on a career that is domestic for its whole first year or two: so "she moved up the
    // table" was a claim about a table she is not in, and the movement it read was mostly the tie floor
    // drifting as OTHER players' international results aged out of their 52-week windows. R13-2 already
    // fought this exact battle once - it added the `runPointsThisWeek > 0` licence because "rank is
    // RELATIVE, so she can climb on a zero-point week purely because rivals' results decayed ... other
    // people's ageing calendars, not her tennis" - and the earned-points guard cannot do its job while
    // the points are counted in one table and the climb read off the other.
    //
    // `activeLadderOf` is the same one answer Home's chip, the Kid screen and Stats all read.
    kidRank: rankIn(world, activeLadderOf(world)),
    // ⚠ ...AND SHE MUST ACTUALLY BE RANKED IN IT (W2-WINDOW, found by tests/ladder-separation.test.ts
    // S4 when the re-dealt calendar moved this seed's first result a week later). `rankIn` falls back
    // to the cached position, which survives a table's 52-week window emptying; `kidLadderRank` is the
    // nullable truth the ladder VIEW prints, and the two disagreed for exactly the weeks in which she
    // holds no counting result in her active table. The diary then said «she moved up the table» about
    // a table that was showing her a dash - a smaller version of the very bug the note above records.
    // Nulling the PREVIOUS half is the whole fix: `rankClimbed` is `prevKidRank !== null && kidRank <
    // prevKidRank`, so an unranked week can no longer claim a climb, and every ranked week is
    // untouched.
    prevKidRank:
      kidLadderRank(world, activeLadderOf(world)) === null
        ? null
        : prevRankIn(world, activeLadderOf(world)),
    pendingUnfinished: world.pendingTournament !== null && !world.pendingTournament.finished,
    // R13-2: the points her run AWARDED this week. finalizeTournament writes a kid row only when
    // points > 0, so a first-round exit leaves none – "> 0" is exactly "she won matches this
    // week", the licence behind the earned-climb softener and the good-loss diary lines.
    runPointsThisWeek: world.results
      .filter((r) => r.playerId === KID_ID && r.week === world.week)
      .reduce((s, r) => s + r.points, 0),
    milestones: world.milestones,
    vacationWeek: vacationForWeek(world, world.week) !== undefined,
    // W5: ...and WHICH holiday, for the frame that names it. The booking is still on file when its
    // story is told - `prunePlannerBookings` keeps four trailing weeks - and null on every other week.
    vacationPackageId: vacationForWeek(world, world.week)?.packageId ?? null,
    // W2: how hard the PLAYER worked her this week – the one fact about a training week that is his
    // decision rather than the world's, and the subject of the ordinary week's note.
    trainPct: world.plan.train,
    // W4: ...and the OTHER decision of his the week can be about. Read off the live knock only – an
    // undecided one is not doing anything to the week yet, it is stopping it, so `plainTraining` must
    // still hold for the week the knock arrived in (its note is about the training that caused it).
    //
    // ⚠ W6 MADE THAT SENTENCE TRUE. It was the intent and it only held while the knock was UNANSWERED:
    // the instant he chose, `knockLive` was already true on the ARRIVAL week, so week N's own story
    // started describing a decision that governs week N+1 – she was drawn at home, and captioned «A week
    // off the ankle», about a week she spent on court. `knockGoverns` is the same window the tick
    // actually charges (see its note: growWeek at 3b, rollKnock at 3c), so the frame and the words now
    // agree with the arithmetic instead of with each other.
    // ...and the one week a year that is about HER rather than about tennis.
    birthdayAge: birthdayTurning(world.week, world.profile.birthMonth, world.profile.birthDay),
    // ⭐ v48: ...AND WHAT HE GAVE HER FOR IT. Folded here rather than in the diary because the diary
    // is a reporter and owns no catalogue: it is handed a NOUN and a pair of booleans, and prints them.
    //
    // ⚠ ALL THREE ARE NULL/FALSE UNTIL HE ANSWERS, and the note completing on the answer is the point –
    // the birthday week's scrap says "She is sixteen today" while the dialog is up and gains the present
    // the moment he chooses one, which is the same week reading back richer rather than a second entry.
    ...birthdayGiftFactsOf(world),
    knockChoice: knockGoverns(world.knock, world.week) ? world.knock!.choice : null,
    knockPart: knockGoverns(world.knock, world.week) ? world.knock!.part : null,
  })
  // THE SKILLS RADAR'S VIEW OF HER, assembled ONCE and read twice - by the contour (`buildRadar`)
  // and by the Weekly Story's training line (`buildTrainingRead`). Hoisted rather than inlined
  // because the two readings MUST see the same girl: a second literal here would be a second place
  // for "which matches count" to drift, and the card and the radar would then disagree about how
  // much anybody can see, on the same screen, in the same week.
  const radarView = radarViewOf(world)
  // ...and the evidence fold behind BOTH of them, walked once. `axisEvidence` reads the whole
  // retained match window per axis, so asking the two builders independently would walk it eight
  // times a snapshot for one girl in one week.
  const radarReadings = axisReadings(radarView)
  return {
    schemaVersion: world.schemaVersion,
    careerId: world.careerId,
    seed: world.seed,
    week: world.week,
    // ⚠ HER AGE, NOT THE BAND'S (owner ruling 1, 09.08 - world/age.ts). THIS ONE LINE is what Home,
    // Kid, Stats, Money and Season all print, and it was an INLINED copy of `ageAtWeek` - which is why
    // a grep for the band's name did not find it. It said 16 from week 104 while her own birthday note
    // said «She is sixteen this week» at week 154: fifty weeks apart, both from the engine, and it was
    // the first thing the owner saw. One clock now, and `birthdayTurning` below reads the same one.
    ageYears: kidAgeAt(world, world.week),
    schoolEndsWeek: schoolEndWeek(world.profile.birthMonth),
    fundsCents: world.fundsCents,
    profile: world.profile,
    plan: world.plan,
    // ⚠ v47 – HOW MANY SESSIONS ONE DAY MAY HOLD IN THE WEEK THE PLAN IS ABOUT TO BE LIVED IN, carried
    // as DATA for exactly the reason `CalendarWeek.summer` and `.schoolOver` are: the plan tab may not
    // ask the engine, and `summerBlockWeek` is not a predicate a screen could re-derive – it refuses on
    // an injury, a booked family week, a tournament and a rested knock as well as on the calendar.
    //
    // ⚠ IT IS `week + 1`, NEVER TODAY, and the off-by-one is the same one `useCalendarWeek` documents:
    // `tickWeek` increments `world.week` at its first statement, so the week a press plays is always
    // the next one. A capacity read off today's week would put two dots on the last Sunday of the
    // holidays and one on the Monday she actually trains through.
    planDayCapacity: summerDayCapacity({ ...world, week: world.week + 1 } as WorldState),
    condition: world.condition,
    // injury is always null in slice B.
    // ⚠ `sinceWeek` IS CARRIED NOW (round-16 #19). It used to be dropped here as "persisted-only",
    // and that omission is what left the injury popup unable to ask its own question: the dialog had
    // to be told by a stop reason that an injury was fresh, and a stop reason only exists for the
    // duration of the advance that produced it. The retirement door never produces one at all
    // (`finalizeTournament` runs from the reveal's command), so it surfaced nothing. Explaining the
    // field is one number; the UI now reads `sinceWeek === week` and cannot be lied to about it.
    injury: world.injury
      ? {
          kind: world.injury.kind,
          severity: world.injury.severity,
          weeksRemaining: world.injury.weeksRemaining,
          totalWeeks: world.injury.totalWeeks,
          sinceWeek: world.injury.sinceWeek,
        }
      : null,
    physioActive: world.physioActive,
    // W4: the knock, and the question it is asking. Both DERIVED (the prompt's copy is assembled per
    // snapshot off `seed:knockread:<sinceWeek>`, its own sub-stream); only `world.knock` itself is
    // persisted, and only because `choice` is the player's decision.
    //
    // `knockPrompt` is non-null on exactly the weeks `pendingKnock` is true – the same predicate
    // `advanceWeeks` blocks on – so the dialog cannot be missing on a week the engine has stopped,
    // and cannot be up on a week it has not.
    knock: knockLive(world.knock, world.week) ? world.knock : null,
    knockPrompt: pendingKnock(world) ? buildKnockPrompt(world.knock!, world.seed, world.condition) : null,
    // ⭐ v48: HER BIRTHDAY, AND THE QUESTION IT ASKS. Same contract as `knockPrompt` above and for the
    // same reason: non-null on exactly the weeks `pendingBirthday` is non-null, which is the predicate
    // `advanceWeeks` blocks on, so the dialog cannot be missing on a week the engine has stopped.
    // `buildBirthdayPrompt` re-checks the predicate itself, so this is one call rather than two.
    birthdayPrompt: buildBirthdayPrompt(world),
    events: world.events.slice(-SNAPSHOT_EVENTS),
    // ⚠ THE DURABLE LEDGER, WHOLE, and it is here because the 60-event window above is exactly the
    // wrong source for it. Milestone EVENTS carry `keep: true` so they survive `pruneEvents` in the
    // world - but `slice(-60)` is positional, so a first title from four seasons ago falls out of the
    // SNAPSHOT the moment sixty newer rows exist, which is a couple of months of play. The Kid
    // screen's moments strip was reading the feed and therefore emptied itself permanently (owner,
    // 31.07: «в Important moments на экране профиля девочки вообще ничего не происходит»); its own
    // source comment had already diagnosed this and filed the fix as "a small engine ask" rather than
    // doing it. This is that ask. `world.milestones` is v18 state and never prunes, it is capped by
    // identity rather than by count (one row per first), and it is tiny - so it ships whole and no
    // surface has to reconstruct a durable fact from a volatile window ever again.
    milestones: world.milestones,
    // Category-accurate windows off the persisted ledger (immune to the 60-event cap). season
    // keeps the current MoneyScreen semantics: the current 52-week season block from its first week.
    finance: {
      window12w: financeWindow(world.financeWeeks, world.week - 11),
      // ONE definition of "this season" (seasonStartWeek), shared with the wrap-up summary – the
      // two used to spell the same arithmetic out separately, which is how they came to disagree.
      season: financeWindow(world.financeWeeks, seasonStartWeek(world.week)),
      // The same 12 weeks, un-folded, for the Home budget card's chart. Clamped at week 0 so a
      // young career charts the weeks it has actually lived instead of eleven empty bars. Today's
      // funds anchor the running balance, so the line's last point is the total printed above it.
      weekly12: financeSeries(
        world.financeWeeks,
        Math.max(0, world.week - 11),
        world.week,
        world.fundsCents,
      ),
    },
    // ⚠ A WINDOW ON THE CAPPED FEED, and it is the Money screen's ledger tab. It cannot come off
    // `financeWeeks`, which stores per-category TOTALS and has no individual transactions in it - so
    // this is the one money surface the prune order genuinely governs (see EVENTS_ORDINARY_FLOOR).
    financialEvents: world.events.filter((e) => e.amountCents !== undefined).slice(-SNAPSHOT_FINANCIAL_EVENTS),
    upcoming: upcomingEvents(world),
    seasonSupply: seasonSupply(world),
    // R12-15/R12-3: what next week's entered event will actually DO, so the one button that plays
    // that week stops promising a tournament the engine has already decided against.
    arrival: arrivalPreview(world),
    // Season planner (v13): the bookings the calendar renders, plus the short trailing window the
    // guardrail's consecutive-practice read needs (the calendar only ever looks at future weeks,
    // so the tail is invisible there). Prices are re-derivable by the UI from the same pure quote
    // functions the engine charges (economy.ts), so nothing else is needed on the wire.
    vacations: world.vacations.map((v) => ({ ...v })),
    practices: world.practices.map((p) => ({ ...p })),
    recoveryBuff: world.recoveryBuff ? { ...world.recoveryBuff } : null,
    // W3-KIT (v37): her three lines, each rung priced, her condition on each. The Money screen is the
    // shop window - the owner's own suggestion («может быть в ledger?») - and it reads the engine's
    // prices rather than multiplying a band itself.
    kit: kitLineViews(world),
    // ...AND THE DEAL THOSE LINES ARE UNDER (09.08): the brand, what is LEFT of the season's
    // allowance, and how long the contract runs. The quota was computed and never shown, so kit that
    // was free last week was charged this week with no warning - see `KitDealView`.
    kitDeal: kitDealView(world),
    academy: world.academy
      ? {
          coverShare: travelCoverShare(world.academy),
          sinceWeek: world.academy.sinceWeek,
          coveredCents: world.academy.coveredCents,
        }
      : null,
    // The ITF annual cap as it stands TODAY – what the Home ladder needs to tell a tier's state.
    // Derived at snapshot time from the persisted ledger, so it can never disagree with the gate.
    entryCap: entryCapUsage(world, world.week),
    // ...and the PRO allowance beside it (W2-LADDER §5): the planner prints the budget («pro
    // entries this season: N of M») and the tier ladder tells "capped" apart from "locked", both
    // off the engine's own count.
    proEntryCap: proEntryCapUsage(world, world.week),
    // THE ENGINE'S OWN VERDICT PER RUNG (see TierOpenMap in protocol.ts). `tierOpenFor` is the same
    // function `enterEvent` validates against, so a screen can no longer disagree with the gate.
    tierOpen: Object.fromEntries(TIER_LADDER.map((t) => [t, tierOpenFor(world, t)])) as TierOpenMap,
    // ...AND THE SAME DISCIPLINE FOR THE CEILING (06.08). `tierOpenFor` is the FLOOR alone now, so
    // "open" no longer distinguishes her working rung from one she has walked past – and a screen
    // that re-derived that from a point band would be the visibility-vs-access bug for the fourth
    // time (the J and W bands are `[0, MAX]` and cannot express it at all). One engine answer.
    tierOutgrown: Object.fromEntries(TIER_LADDER.map((t) => [t, hasOutgrown(world, t)])) as TierOpenMap,
    // ...AND THE POSITION EACH ACCEPTANCE LIST CUTS AT, for the rungs that have one. Same discipline
    // as `tierOpen` directly above: the screen asks the engine for the number rather than deriving a
    // share of a field it would have to be told the size of. Absent on every rung that gates on
    // points, which is what `acceptanceRank` returning undefined means.
    tierAcceptance: Object.fromEntries(
      TIER_LADDER.map((t) => [t, acceptanceRank(world, t)]).filter(([, r]) => r !== undefined),
    ) as Partial<Record<TierId, number>>,
    // R15-9: THE ON-RAMP LATCHES, read-only, for the SLIDING TIER WINDOW - the calendar hides the
    // rungs a latch says she has definitively left behind (a copy, like every object on this
    // message: the snapshot must never be a live view of engine state). Surfacing widens the
    // snapshot only; the persisted v34 field and the entry gates are untouched.
    onRampCleared: { ...world.onRampCleared },
    coachId: world.coachId,
    coachMarket: coachMarket(world),
    coachBilling: coachBilling(world),
    coachRoomNote: coachRoomNote(world),
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    standings: computeStandings(world),
    countingResults: computeCountingResults(world),
    // ALL THREE TABLES, and which one she is actually competing in. `kidRank`/`standings`/
    // `countingResults` above are the ITF ones and stay as aliases of `ladders.itf` so nothing that
    // reads them has to change; the pairing is pinned by a test, because two names for one fact is
    // how this bug started.
    //
    // THE THIRD IS BUILT EXACTLY LIKE THE OTHER TWO – same call, same argument, no special case –
    // which is the whole reason `LadderTrack` was widened rather than the adult rungs folded into
    // `itf`. Nothing here decides whether the player SEES it: the Stats and rank-help screens still
    // list two tabs by hand, because a fourteen-year-old with an empty professional table is noise
    // and the week it stops being noise is the handover at 19 (docs/specs/adult-tour-and-endings.md
    // §4), which is a slice of its own. The view exists and is correct from week 0 regardless.
    ladders: {
      domestic: computeLadderView(world, 'domestic'),
      itf: computeLadderView(world, 'itf'),
      wta: computeLadderView(world, 'wta'),
    },
    activeLadder: activeLadderOf(world),
    bestFinishByTier: { ...world.bestFinishByTier },
    // v31: THE CABINET. Copied a level deeper than its neighbour above, because its values are
    // arrays and a shallow spread would hand the UI the engine's own `titles`/`finals` - the same
    // objects `finalizeTournament` pushes onto. The snapshot is a message across the worker
    // boundary and must never be a live view of engine state.
    trophiesByTier: copyTrophyLedger(world),
    // v32: THE INBOX, copied one level deep for the same reason the cabinet above is - the snapshot
    // crosses the worker boundary and must never be a live view of engine state. `terms` is copied
    // too, because a screen holding the engine's own terms object could mutate the contract it is
    // rendering. (`Offer` is flat apart from `terms`, so two spreads is the whole of it.)
    offers: world.offers.map((o) => ({ ...o, terms: { ...o.terms } })),
    // ...AND THE DOT, DECIDED HERE. It asserts one FACT - an offer is open and its deadline has not
    // passed - exactly as the bell's dot asserts that the week put something in the feed. It is never
    // "unread": the engine cannot know what the player has looked at, and neither can this.
    offerOpen: hasLiveOffer(world.offers, world.week),
    // Round-8 (R6 debt): the running season W-L counters, already persisted since v10 –
    // surfacing them is derivation, not schema. THE TOTAL, both ladders; `seasonRecord` below is the
    // same matches told apart, and the two always agree because finalizeTournament writes both.
    seasonWins: world.seasonWins,
    seasonLosses: world.seasonLosses,
    seasonRecord: world.seasonRecord ?? emptySeasonRecord(),
    // The run of defeats behind her face, decided HERE and not in the UI: the engine holds the seed
    // (so the per-streak threshold is drawn once, off `seed:angry:<startWeek>`) and the FULL event
    // log (the snapshot only carries the trailing 60, which a long streak could outrun). Pure
    // derivation off state that already exists – no persisted field, no schema bump.
    lossStreak,
    diary,
    // HER LIFE OFF THE COURT (engine/kidLife.ts): the Personality / School / Friends tiles screen C
    // draws. Same discipline as the diary - derived at SNAPSHOT time off `seed:friends:*`
    // sub-streams, zero MAIN draws, so the frozen capture (41550 / e6b0c709) cannot move.
    life: buildKidLife({
      seed: world.seed,
      week: world.week,
      // HER age, the same one the header prints – the School tile already takes `birthMonth` below,
      // so a second clock here would have let one tile call her 14 while the one beside it said 13.
      ageYears: kidAgeAt(world, world.week),
      // The app's ONE definition of a season's display year (shared/dates.ts), so the school-year
      // arithmetic can never disagree with the year the rest of the game prints.
      seasonYear: seasonYear(seasonIndexOf(world.week)),
      playStyle: world.profile.playStyle,
      birthMonth: world.profile.birthMonth,
      injured: world.injury !== null,
      // HOW MUCH SHE HAS BEEN AWAY, off the persisted finance ledger rather than the capped event
      // feed: a week in which a travel bill was actually paid is a week the family was somewhere
      // else. A local event costs no travel and is therefore correctly NOT a week away.
      weeksAway: world.financeWeeks.filter(
        (w) => w.week > world.week - FRIENDS_WINDOW && w.week <= world.week && (w.byCategory.travel ?? 0) < 0,
      ).length,
      lossStreak: lossStreak?.losses ?? 0,
      // Her most recent title off the same walk the diary uses, so two surfaces cannot disagree
      // about when she last won something.
      weeksSinceTitle: (() => {
        const title = lastKidTitleOf(world.events)
        return title ? world.week - title.week : null
      })(),
    }),
    // THE SKILLS RADAR. Derived here and nowhere else, off `seed:read:*` / `seed:ceil:*` sub-streams
    // at SNAPSHOT time - zero MAIN draws, so the frozen capture (41550 / e6b0c709) is untouched by
    // construction. The true `skills` / `potential` go IN and never come out: the snapshot carries
    // an estimate and a haze, which is the whole point of the slice.
    radar: buildRadar(radarView, radarReadings),
    // ...AND THE SAME FOG, ONE STEP FURTHER ON: what came along this week, in words, for the Weekly
    // Story's Training card. Design D lists skill gains there; we may not, because a weekly delta
    // integrates into her exact build and the fog above would be decoration. Same sub-stream
    // discipline (`seed:train*`), same zero MAIN draws, and NOT ONE NUMBER on the way out.
    trainingRead: buildTrainingRead(radarView, radarReadings),
    lastSeasonSummary: world.lastSeasonSummary,
    // R10-9: the career's finished seasons, copied out (oldest first) for the Stats history table.
    // ⚠ ONE LEVEL DEEPER SINCE v46, exactly as `copyTrophyLedger` is and for the same reason: a row's
    // `byTrack` is an OBJECT, so a bare spread would hand the UI the very record the world is holding.
    // Absent stays absent – a row banked before v46 has no per-track figures and must not grow three
    // zeroed ones on its way through a snapshot (see the v45 -> v46 migration for why a zero is a lie
    // here and a blank is not).
    seasonHistory: world.seasonHistory.map((h) => ({ ...h, ...(h.byTrack ? { byTrack: copyByTrack(h.byTrack) } : {}) })),
    // W2-ENDINGS (v39). The epilogue and the three open questions, all as SNAPSHOT FIELDS rather
    // than as stop reasons. A stop reason is a property of the last advance and it is gone the next
    // time anything refreshes; the ending, the fork and the offer are permanent state that has to
    // survive a reload, which is the argument App.vue already makes for the knock prompt.
    ending: buildEndingView(world),
    debt: buildDebtView(world),
    fork: world.fork && world.fork.answer === null
      ? { askedWeek: world.fork.askedWeek, ageYears: kidAgeYears(world.fork.askedWeek, world.profile.birthMonth) }
      : null,
    retirementOffer: world.retirementOffer,
    college: world.college,
    careerTotals: world.careerTotals ?? { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
    ...(stopReasons && stopReasons.length > 0 ? { stopReasons } : {}),
    ...(pending ? { pending } : {}),
  }
}
