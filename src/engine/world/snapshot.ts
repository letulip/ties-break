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
import { AD_CATEGORIES, activeAdDealIn, activeAdDeals, adBandFor, adFeeFor, hasLiveOffer, seasonLastWeek } from '../offers'
import { travelCoverShare } from '../academy'
import { buildDiarySnapshot, lastKidTitleOf } from '../diary'
import { buildKidLife, FRIENDS_WINDOW, nextAcademicYearStart, schoolEndWeek, schoolIsOver } from '../kidLife'
// v54 / round-23 #6b: the length of the course and the place she agreed to pay for. Both are leaves
// (`ending.ts` is a constants module; `collegeOffer.ts` imports nothing but types and `Rng`), so
// neither closes a cycle back into this file the way `world/college.ts` would.
import { ENDINGS } from '../ending'
import { chosenQuoteOf } from '../collegeOffer'
/** ⭐⭐⭐ ROUND 26 #6 – THE COLLEGE LEAGUE'S REVEAL RIDES ON `Snapshot.pending`. The edge points
 *  snapshot -> college, the same direction `./endings` -> `./college` already runs; college.ts
 *  deliberately imports `./ladder` rather than this module (its own TB-07 note) so there is no cycle
 *  to close here. */
import {
  callUpRevealMatches,
  callUpRevealOpen,
  callUpRubberId,
  collegeLeagueRevealMatches,
  collegeLeagueRevealOpen,
} from './college'
import { rngFromSeed } from '../rng'
import { COLLEGE_LEAGUE, COLLEGE_LEAGUE_ROUNDS, wonTheLeague } from '../collegeLeague'
import { NATIONAL_TEAM, NATIONS_CUP_AWARDS_NOTHING, callUpOpponent, nationFinishLabel } from '../nationalTeam'
import { axisReadings, buildRadar, buildTrainingRead } from '../radar'
import { previewEvent, eventCrowd, eventTemperature, ratedField } from '../season/preview'
import { FRESH_KIT } from '../equipment'
import type { RatedEntrant } from '../season/preview'
import { BEST_N_BY_TRACK, WINDOW_BY_TRACK, isCountingResult, windowFromWeek, windowSlots, windowedBestSum } from '../season/ranking'
import { isFieldProId, universeForTier } from '../season/fieldPros'
import { entrantNationAt, weekFieldExclusion } from '../season/tournament'
import { rivalConditions } from '../season/rival'
import type { AiPlayer, LadderTrack, RankingRow, SeasonEvent, TierId } from '../season/types'
import {
  type AdOfferTerms,
  type AdPortfolioRow,
  type ArrivalPreview,
  type CountingResult,
  type InjuryCircumstanceKind,
  type InjuryEntryRow,
  type InjuryReport,
  type LadderView,
  type PendingView,
  type Snapshot,
  type FullBracketMatch,
  type PendingBracketRound,
  type TierOpenMap,
  type TierRefusal,
  type StandingRow,
  type StopReason,
  type SeasonSupply,
  type UpcomingEvent,
  type WorldEvent,
} from '../../shared/protocol'
import {
  KID_ID,
  SNAPSHOT_EVENTS,
  SNAPSHOT_FINANCIAL_EVENTS,
  UPCOMING_WEEKS,
} from './constants'
import { financeWindow, financeSeries, seasonIndexOf, seasonStartWeek } from './ledger'
import { ageAtWeek, birthdayTurning, kidAgeAt, kidAgeYears, START_AGE_YEARS } from './age'
// ⭐ v48: the birthday popup's copy, assembled in the engine like every other dialog's.
import { birthdayHistory, buildBirthdayPrompt, giftNoun } from './birthday'
import { buildShootClashPrompt } from './shootClash'
// ⭐ round-18 #8: the tour's commitment rules, spelled out by the module that already enforces them.
import { buildTourBriefing } from './mandatory'
// W2-ENDINGS: the epilogue and the debt strip, built by the module that owns the latch.
import { buildDebtView, buildEndingView, physicalShareOf } from './endings'
import { finishLabel, stageLabel } from './labels'
import { entryCapUsage, proEntryCapUsage, isCappedProTier, isCappedTier } from './entryCaps'
import { alternateQueuePosition } from './ladder'
import { alternatePlacesOpen } from '../season/tournament'
import { acceptanceRank, activeLadderOf, fieldProsOf, hasOutgrown, homeWildCardPlace, inTrack, kidLadderRank, kidPoints, prevRankIn, rankIn, rankingFor, tierOpenFor, wtaEverCounted } from './ladder'
import { aiSelectionRanking } from './weekField'
export { activeLadderOf, wtaEverCounted }
import { arrivalStatus, entryStatus, layoffCovering, tierVerdict } from './medical'
import { eventById, vacationForWeek } from './bookings'
import { kidMatchPlayerFor } from './player'
import type { MatchPlayer } from '../match/types'
import { coachBilling, coachEdgeView, coachEntryLine, coachLadderNote, coachMarket, coachRoomNote, coachTravelsWithHer } from './coachMarket'
import { masseurRoomNote, masseurRungOf, masseurUnlocked, masseurWeeklyCents } from './masseur'
import { kitDealView, kitLineViews } from './kit'
import { shopView } from './shop'
import { copyByTrack, copyTrophyLedger, emptySeasonRecord, seasonWrapDue } from './milestones'
import { computeLossStreak, fallbackPlayer, flipScore, kidMatchesOf, kidMatchEvent } from './matchNews'
import { coachLoadViewOf, pendingKnock, radarViewOf } from './knock'
import { capstoneSeasonsOf, coachTravelFareFor, masseurTravelFareFor, sponsorStandingOf, travelCostFor } from './sponsors'
// Round 29 part four P7/P8 – the fame fold (zero draws, nothing persisted; see world/fame.ts).
import { fameAt } from './fame'
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

/**
 * ⭐ R2-02 – THE INJURY REPORT, BUILT FROM FACTS.
 *
 * ⚠ WHAT THIS REPLACES. `InjuryStopDialog` used to recover four domain facts by reading the news
 * feed's ENGLISH: `startsWith(RELEASE_LINE_PREFIX.injury)` to find the cancelled entries, a slice
 * plus a `replace` to get their names back out of the sentence, and a RAW literal
 * `startsWith('Entry refunded')` for the money. The file's own header records the same defect
 * biting once before – it matched `'Withdrew from '`, `releasedBy` split that sentence in two on
 * 05.08, and the one row whose job is to report what a layoff cost went blind for a week without
 * anything going red. That is the house's most-caught defect class (two sides asking different
 * functions about one question) wearing a copy editor's hat, and the only durable answer is that
 * the engine STATES the facts and the surface SPELLS them.
 *
 * ⚠ EVERY FIELD IS DERIVED, AND THE ONE THAT COULD NOT BE WAS MEASURED FIRST. `kind`/`oppName`/
 * `stage` come off the persisted `WorldEvent.match` (`retiredId === KID_ID` is the whole test –
 * the same field `travelHome` and the season plaque read); `stranded` is recomputed from
 * `world.entries` against the engine's own `layoffCovering` window; `refundCents` is a sum of
 * signed cents. Only `cancelled` needed the engine to write anything new, because `releaseEntry`
 * deletes the id from `world.entries`, from `seasonEntries.rows` and from both cap ledgers, and
 * raises no letter below the pro rungs – a probe on a real career found the two released
 * tournaments recorded NOWHERE but in prose, and the calendar could not name them either (30
 * candidate events in the layoff window, four of them the same rung at the same fee). Hence
 * `WorldEvent.entryRef`: one optional field, absent on every historical row, no migration, and
 * `SAVE_SCHEMA_VERSION` unmoved.
 *
 * ⚠ RNG: nothing here draws. It is arithmetic and array walks over state.
 */
export function buildInjuryReport(world: WorldState): InjuryReport | null {
  const injury = world.injury
  if (injury === null) return null
  // The layoff's OWN week, not "now": they are the same number on the week the report is read
  // (App.vue gates the dialog on `sinceWeek === week`), and this is the one that stays true.
  const onset = injury.sinceWeek

  // WHY, as far as the model knows – off the persisted fact, never off the news text. The weekly
  // roll leaves no record of the week's shape at all (training, travel, arrival, a family holiday –
  // `injuryVacationFactor` is nonzero), so 'off-court' is deliberately vague rather than lazy: the
  // same honesty rule the commentary and the diary are held to. Say only what the model knows.
  const retired = world.events.find((e) => e.week === onset && e.match?.retiredId === KID_ID) ?? null
  const rm = retired?.match ?? null
  const retiredEvent = rm ? eventById(world, rm.eventId) : null
  const kind: InjuryCircumstanceKind = retired === null ? 'off-court' : retired.friendly ? 'retired-friendly' : 'retired-match'

  // WHAT THE LAYOFF CANCELLED, and what came back with it. Both off `entryRef`, so the two halves
  // of one question are answered by ONE field instead of by two different sentences: the money
  // cannot be counted from rows the list does not name, and vice versa.
  const cancelled: InjuryEntryRow[] = []
  let refundCents = 0
  for (const e of world.events) {
    if (e.week !== onset || e.entryRef?.releasedBy !== 'injury') continue
    if (e.type === 'entry') cancelled.push({ id: e.entryRef.id, label: e.entryRef.label, week: e.entryRef.week })
    if ((e.amountCents ?? 0) > 0) refundCents += e.amountCents as number
  }

  // ⚠ AND THE OTHER HALF: "nothing cancelled" IS NOT "nothing lost". An entry whose list has already
  // closed cannot be withdrawn at all (`releaseEntry` refuses past `deadlineWeek`), so a layoff that
  // lands on or near the event week cancels NOTHING and she stays on the list: the fee is committed,
  // she does not appear, and the week resolves as a walkover. Recomputed from the entries she STILL
  // HOLDS against the engine's own window – not off `upcoming`, which the dialog used to read and
  // which stops at UPCOMING_WEEKS, so a layoff longer than the horizon hid its own last forfeits.
  const stranded: InjuryEntryRow[] = []
  for (const id of world.entries) {
    const e = eventById(world, id)
    if (!e || e.week < world.week || layoffCovering(world, e.week) === null) continue
    stranded.push({ id: e.id, label: TIERS[e.tier].label, week: e.week })
  }
  stranded.sort((a, b) => a.week - b.week)

  return {
    kind,
    ...(rm?.oppName ? { oppName: rm.oppName } : {}),
    // The round she had reached, when there IS a draw – a practice match has no bracket, so a stage
    // there would be a number dressed up as a fact.
    ...(rm && retiredEvent && kind === 'retired-match'
      ? { stage: stageLabel(rm.round, TIERS[retiredEvent.tier].drawSize), eventLabel: TIERS[retiredEvent.tier].label }
      : {}),
    cancelled,
    stranded,
    refundCents,
  }
}

export function upcomingEvents(world: WorldState): UpcomingEvent[] {
  const entered = new Set(world.entries)
  // The Season card's preview needs the standings and her match build ONCE for the whole list, not
  // once per card: both are the same for every event in the window, and rebuilding them per event
  // would be the expensive half of this function. Surface-specific scaling still happens per event
  // inside the preview, which is where it belongs.
  //
  // ⭐⭐ ROUND 31 #3 – AND THE ONE FOR THE NON-W CARDS IS NOW `aiSelectionRanking`, THE TABLE THE
  // BRACKET ITSELF SELECTS FROM, not `fullRanking`. It was the ITF table, which is not the table
  // any junior or domestic bracket has ever positioned candidates on (`deriveWeekField`'s
  // `aiRanking` is), and the two disagree about who is good: measured on the owner's w933 save, the
  // Spearman between standings position and actual rating is **0.11** on the ITF table against
  // **0.53** on this one. That is not a small difference in a heuristic, it is the difference
  // between a window that caps strength and one that does not - a Local Open card previewed a field
  // of mean rating 1829 and a mean age of 23.5 at a rung whose own comment calls it "the draw a kid
  // can genuinely win her first title in". See docs/specs/tier-ladder-and-band.md.
  const ranking = aiSelectionRanking(world)
  // ⭐ ...AND THE SECOND TABLE, WHICH IS WHERE **SHE** STANDS AMONG THEM. Per TRACK, memoised,
  // because that is what `computeShadowTournament` seeds her off (`rankingFor(world,
  // TIERS[event.tier].track)`) and what `overlayRanks` below prints opponent ranks from. Three
  // possible tables, at most three folds, and the card can no longer seed her from a table the
  // tournament does not use. ⚠ On the W track it resolves to the very table the W branch already
  // passes, so every W card is byte-identical.
  // ⭐ ...AND HER AT FULL CONDITION, WHICH IS THE **BAND'S** READING OF HER (round 31 #3). The field
  // on a card is previewed rested – `season/preview.ts`'s header argues that at length – and the band
  // is a statement about that field's level relative to hers, so it must not move because she was
  // tired the week he opened the screen. Measured: read at today's condition the band moved on 3 of
  // 24 tournaments over six weeks on the w933 save, against 0 of 24 before. ⚠ The RING is untouched
  // and still quotes her as she is. Built through the SAME composer, with one key overridden, so
  // nothing is inverted; memoised on (surface, is-the-coach-coming) because that is all it varies
  // by and a card would otherwise pay for a second composition it shares with its neighbours.
  const restedCache = new Map<string, MatchPlayer>()
  const kidAtRestFor = (surface: SeasonEvent['surface'], help: boolean): MatchPlayer => {
    const key = `${surface}:${help}`
    let p = restedCache.get(key)
    if (!p) {
      // ⚠ AND IN BRAND-NEW KIT, which is the same sentence one seam along – see `kitWear` on
      // `kidMatchPlayerFor`. Condition and wear are both weekly transients about her circumstances
      // rather than her level, the field is read at its best on exactly that argument, and measured
      // on the owner's w933 save the wear saw-tooth moved her rested rating by 7 points a week
      // against her skills' one. ⚠ The RING still quotes the racket she actually owns.
      p = kidMatchPlayerFor(
        { ...world, condition: ECONOMY.condition.max, kitWear: FRESH_KIT },
        surface,
        help,
      )
      restedCache.set(key, p)
    }
    return p
  }
  // ⭐ ...AND THE POPULATION THE **BAND** IS COUNTED OVER: the cohort rated rested on a surface,
  // strongest first (`ratedField`). The band stopped being a reading of this week's draw and became
  // a reading of the RUNG – see `tierExpectedField` in season/preview.ts and
  // docs/specs/tier-ladder-and-band.md §7 – and a rung's expected field is a fold over the whole
  // cohort, which every card of that surface shares. Memoised on (universe, surface) for the same
  // reason `ranking` is hoisted out of the loop: at most six folds against one per card, and the two
  // universes are genuinely different populations (a W card previews LIVE cohort ∪ field pros).
  const ratedCache = new Map<string, RatedEntrant[]>()
  const ratedFor = (universe: 'junior' | 'wta', surface: SeasonEvent['surface']): RatedEntrant[] => {
    const key = `${universe}:${surface}`
    let table = ratedCache.get(key)
    if (!table) {
      table = ratedField(universe === 'wta' ? wtaCtx!.universe : world.cohort, surface)
      ratedCache.set(key, table)
    }
    return table
  }
  const standingCache = new Map<LadderTrack, RankingRow[]>()
  const standingFor = (tier: TierId): RankingRow[] => {
    const track = TIERS[tier].track
    let table = standingCache.get(track)
    if (!table) {
      table = rankingFor(world, track)
      standingCache.set(track, table)
    }
    return table
  }
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
              // ⭐ THE REFUSAL'S OWN WORDS, round-17 #19. `cautionDetail`'s exact twin, and it exists
              // for the same reason: 'unavailable' is FIVE different refusals collapsed into one code
              // (suspension, the tier's age door, a booked vacation, exam week, off-season), and a
              // client holding only the code has to guess which. SeasonScreen guessed "Exams this
              // week" and printed it on a Junior Tour 30 shown to a twenty-year-old - a girl two
              // years past her last exam, refused for a reason that no longer exists in her life.
              // The engine already writes the true sentence for every arm; it was simply dropped
              // here. Carrying it costs one optional string and removes the guess at the root.
              ...(gate.detail !== undefined ? { ineligibleDetail: gate.detail } : {}),
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
                // ⭐ THE PREVIEW MUST PROMISE WHAT THE WEEK WILL DELIVER (owner, 15.08). The card is
                // read BEFORE she enters, and the helping now follows the fare, so a preview built
                // on the standing stance would show a junior card an edge the week never applies.
                kidMatchPlayerFor(world, e.surface, coachTravelFareFor(world, e) > 0),
                wtaExclusionFor(e),
                standingFor(e.tier),
                kidAtRestFor(e.surface, coachTravelFareFor(world, e) > 0),
                ratedFor('wta', e.surface),
              )
            : previewEvent(
                world,
                e,
                ranking,
                kidMatchPlayerFor(world, e.surface, coachTravelFareFor(world, e) > 0),
                undefined,
                standingFor(e.tier),
                kidAtRestFor(e.surface, coachTravelFareFor(world, e) > 0),
                ratedFor('junior', e.surface),
              ),
        // v21: the price the FAMILY pays, scholarship included – the planner has to quote what
        // entering will actually cost, and it is the same number chargeTravel will take.
        travelCostCents: travelCostFor(world, e),
        deadlineWeek: e.deadlineWeek,
        entryFeeCents: TIERS[e.tier].entryFeeCents,
        label: TIERS[e.tier].label,
        // ⭐ HER PRO ALLOWANCE FOR **THIS EVENT'S** SEASON (round-17 #2). Read at `e.week`, exactly
        // as `entryCap` above is and for the identical reason: the feed's horizon is eight weeks, so
        // from about week 44 it holds cards that belong to the NEXT season block. The card's chip was
        // printing `Snapshot.proEntryCap` - one number, read at `world.week` - so every one of those
        // cards announced "pro entries 16 / 16" against a season the event is not in, and the
        // allowance appeared to survive the new year. `proEntryCapUsage` self-resets by filtering
        // `proEntryWeeks` to `seasonStartWeek(week)`, so asking it about the EVENT's week is the
        // whole fix; nothing about the reset was ever broken.
        //
        // Only on the rungs the tour's rule counts, so the chip's own "which cards carry it" question
        // is answered by the engine's predicate rather than by a list in the screen.
        ...(isCappedProTier(e.tier) ? { proEntryCap: proEntryCapUsage(world, e.week) } : {}),
        // ⭐ AND THE JUNIOR ALLOWANCE, ON THE SAME TERMS (P2, act2-pro-tour.md §5's «the player sees
        // the budget»). The pro counter has ridden every W card since round-17 #2; the ITF one was
        // only ever visible on a card the cap had ALREADY refused, which is the fuel gauge that
        // lights up when the tank is empty - the exact shape round-16 #7 fixed one table up.
        //
        // ⚠ THE TWO FAMILIES ARE DISJOINT (`isCappedTier` / `isCappedProTier`), so no card can carry
        // both and neither predicate has to know about the other. Read at the EVENT's week for the
        // identical reason the pro one is: an eight-week horizon crosses her birthday, and after P2
        // her birthday is exactly where the allowance turns over.
        ...(isCappedTier(e.tier) ? { entryCap: entryCapUsage(world, e.week) } : {}),
        entered: isEntered,
        // A fatigued event is a CAUTION, not a block: she stays eligible. Only a HARD block
        // (point band, injured, unavailable, medical) removes eligibility.
        eligible: gate.level !== 'blocked',
        // ⭐ THE ALTERNATES LIST, ON THE CARD (18.08). Both numbers, so a parent can read "two places
        // open, you are first in line" before she commits - see `UpcomingEvent.alternateQueue`. The
        // queue is arithmetic; the open chairs are the field's own withdrawals, drawn once per event.
        alternateQueue: alternateQueuePosition(world, e.tier),
        alternatesOpen: alternatePlacesOpen(world.seed, e),
        // R10-13: the entry is COMMITTED (the list has closed) but the week has not started yet –
        // the only window in which cancelling costs the fee and frees the week. Every row here is
        // a FUTURE week by construction, so the closed list is the whole condition.
        cancellable: isEntered && world.week > e.deadlineWeek,
        // ⚠ SHE HAS PASSED THIS RUNG, AND IT IS NOT A LOCK (06.08). Carried BESIDE `eligible` rather
        // than inside `ineligibleReason`, which is where it used to live: the two are orthogonal now,
        // and the card has to be able to say "still yours, and beneath you" in one breath.
        ...(gate.outgrown ? { outgrown: true } : {}),
        // ⭐⭐ THE PLACE WAS A WILD CARD (round 21 #2b, and the marker is the half of it he asked for
        // by name: «а 8 wild card как раз можно как-то отмечать тоже и на карточку турнира тогда
        // пометку ставить "wild card"»).
        //
        // ⚠ IT SAYS SOMETHING TRUE ABOUT **THIS** CARD, WHICH IS WHY IT IS DERIVED HERE AND NOT
        // STORED. `homeWildCardPlace` is false the moment the acceptance list would have taken her
        // anyway, so the badge can never appear on a place she earned – the one way this marker
        // could become a lie. And it moves with her: a card that reads "wild card" in March reads
        // as an ordinary acceptance once she has climbed inside the cut, which is the honest
        // present tense of a list that is refolded every week.
        //
        // ⚠ ZERO PERSISTED BYTES AND NO SCHEMA BUMP. The host nation is a pure function of
        // `(seed, event.id)` and her rank is folded from the ledger, so this is derived at snapshot
        // time like `eligible` and `outgrown` beside it. Nothing to migrate, no golden fixture owed.
        ...(homeWildCardPlace(world, e.tier, e.id) ? { wildCard: true } : {}),
        // ⚠ `costsCollege` WAS SET HERE AND GOES WITH THE RULE IT REPORTED (owner, 16.08 – the record
        // is on the retired `ENDINGS.collegeClosedFromTier`). It was derived from `entryCostsCollege`
        // and never stored, so nothing about the save schema moves with it.
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
  //
  // ⚠⚠ AND THE WINDOW IS THE TRACK'S SINCE ROUND 23 (`WINDOW_BY_TRACK` – the owner's ruling on items
  // 12/13 that the DOMESTIC table counts this season, not a rolling 52 weeks). The filter below used
  // to be `world.week - r.week <= RESULTS_WINDOW`, i.e. `windowFromWeek(week, 'rolling52')` spelled
  // out by hand – correct while all three tables shared one window and silently wrong the moment one
  // of them stopped. This is the function whose stated contract is that a "plain slice would show
  // her a set of rows that does not add up to her own total, which is the one thing this function
  // must never do": `kidPoints` is folded at `WINDOW_BY_TRACK[track]` two files away, so borrowing
  // the WIDTH without the WINDOW would have produced exactly that – a domestic total of 200 over a
  // list of last season's rows adding to 430, and `LadderView.banked` firing the WTA minimum's
  // explanation on a domestic table where §VIII.A.2.b does not apply at all.
  const from = windowFromWeek(world.week, WINDOW_BY_TRACK[track])
  const inWindow = world.results.filter(inTrack(track))
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === KID_ID &&
        r.week <= world.week &&
        r.week >= from,
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
// ⚠ `kidLadderRank` MOVED DOWN TO ./ladder.ts (TB-07) – its notes went with it. It is a two-call
// composition of `kidPoints` and `rankIn`, both of which already live there, and while it lived HERE
// world/college.ts had to import it from the snapshot module to use it. That made a MUTATION module
// depend on the aggregate PROJECTION layer, which closed two runtime cycles at once
// (birthday → college → snapshot → birthday, and coachMarket → endings → college → snapshot →
// coachMarket), because snapshot imports birthday, endings and coachMarket to build its views.
// Deliberately NOT re-exported from here: a re-export would leave college importing this file and
// the cycles standing. Import it from ./ladder.

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

/**
 * ⭐⭐⭐ ROUND 26 #7 – THE FEED'S WINDOW, AND THE ONE PROMISE IT WAS SILENTLY BREAKING.
 *
 * The owner, having played four college years: «Реплеев этих матчей из п.6 нигде нет, ни в news
 * feed, ни в календаре».
 *
 * ⚠⚠ THE ROWS WERE THERE THE WHOLE TIME, WHICH IS WHY THIS IS A WINDOW FIX AND NOT A WRITER FIX.
 * MEASURED ON HIS OWN SAVE (`tennis-sim_alice-cfbv_w502.tsave`, v59, week 502): all eight College
 * League matches and all three Nations Cup rubbers are still in `world.events`, every one of them
 * `keep: true`, every one of them carrying its `match` record and its seed. `pruneEvents` had done
 * its job perfectly. What dropped them was THIS line: a positional `slice(-60)` over a 401-row
 * ledger. Inside the freeze a college week writes about one row, so at week 480 the sixty-row window
 * still reached back to week 273 and all eight were openable; the moment she graduated and the tour
 * started writing again the window collapsed to weeks 493-502 and held twenty income rows, thirty
 * expense rows, nine info rows and one milestone – ZERO matches. The feed he was looking at had ten
 * rows in it and not one of them was a match.
 *
 * ⚠ SO THE FIX IS THE ENGINE'S OWN WORD HONOURED ONE LAYER FURTHER OUT. `world/college.ts` writes
 * these rows `keep: true` under a comment that says exactly what the flag is for – «a week she is
 * still allowed to watch has to still be in the feed to open. Twelve rows at the very outside, over
 * a whole degree.» `pruneEvents` obeyed that; the snapshot did not, and the two together meant the
 * promise held in the save and failed on the screen.
 *
 * ⚠ MATCH ROWS ONLY, AND THE NARROWNESS IS DELIBERATE. `keep: true` is also carried by every
 * milestone, and pinning twenty-seven of those to the top of the news feed for the rest of a career
 * would be a product change nobody asked for. A kept row with a `match` on it is the one thing whose
 * whole purpose is to be RE-OPENED later, and it is bounded by construction: 39 kept rows in his
 * 502-week career, of which 11 carry a match, against a 21/0 split in a 570-week career with no
 * college in it. The cost is a dozen rows at the outside.
 *
 * ⚠ AND IT IS A UNION IN LEDGER ORDER, NOT AN APPEND. `world.events` is chronological and every
 * reader downstream assumes that (HomeScreen groups by week descending, `spanDigest` filters a week
 * window, `thisWeekScore` scans backwards); a tail with old rows stapled on would put week 324 after
 * week 502. The rows keep their positions and nothing is duplicated.
 */
function snapshotEvents(world: WorldState): WorldEvent[] {
  const window = world.events.length - SNAPSHOT_EVENTS
  if (window <= 0) return world.events.slice()
  const out: WorldEvent[] = []
  for (let i = 0; i < world.events.length; i++) {
    const e = world.events[i]
    if (i >= window || (e.keep === true && e.match !== undefined)) out.push(e)
  }
  return out
}

// The live view of an in-progress reveal (drives TournamentFlow). Lean: the revealed path, the
// current round's opponent + record, and the finale copy. Scorelines belong to the record and are
// never shown by the UI before a match has been watched/skipped.
export function pendingView(world: WorldState): PendingView | undefined {
  const p = world.pendingTournament
  // ⭐⭐⭐ ROUND 26 #6 – TWO SOURCES, ONE VIEW, AND THAT IS THE WHOLE OF HOW THE COLLEGE LEAGUE GETS
  // THE TOUR'S FLOW. The owner: «в чем проблема использовать наш флоу турниров полностью и дать
  // возможность игроку их смотреть и сопереживать? Я уже просил это сделать».
  //
  // ⚠⚠ IT IS A PROJECTION AND NOT A SECOND `pendingTournament`, which is what keeps round 24's law
  // and round 25's amateur line both intact. `world.pendingTournament` is still never written inside
  // the freeze – so `COLLEGE_REVEAL_REFUSAL` still guards a state that cannot occur – and there is
  // no `SeasonEvent` and no `TierId` anywhere near this, so `finalizeTournament`'s points table,
  // `prizeCentsFor` and `trophiesByTier` are unreachable from it by construction rather than by a
  // branch somebody has to remember. Everything downstream of `snapshot.pending` – TournamentFlow
  // mounting, the college bar standing down, `screenBusy` holding the popups, the global week bar's
  // resume press – then works with no change at all, because it was all written against this field.
  // ⭐⭐⭐ ROUND 27 #6 – THREE SOURCES NOW, STILL ONE VIEW. The tie takes the identical road the
  // championship took, and the order below is not load-bearing: `resumeFromCollege` pauses the year
  // on the first reveal it opens, and the two fixtures are two season weeks apart, so they can never
  // both be standing. It is written as a chain rather than as a branch on which week it is, because a
  // projection that depends on an argument made in another file is a projection waiting for that
  // argument to change.
  if (!p) return collegeLeaguePendingView(world) ?? callUpPendingView(world)
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
  // ⭐⭐ AND ON THE THREE DOMESTIC RUNGS THE FLAG IS HERS (round 23 #10, the owner: «я просил уже
  // как-то раз, чтобы local, Regional, national были все игроки с её домашним флагом»). This is the
  // ONLY place in the app a rival's flag is ever rendered - `TournamentFlow.vue` reads
  // `pending.opponent.nation` at its two VS plates and nothing else in `src/components` touches
  // `.nation` at all - so the rule needs exactly one reader, and it is written once in
  // `season/tournament.ts` where the whole argument for it lives (see `entrantNationAt`: a filter is
  // unfillable at every playable country, so the domestic ladder re-labels rather than re-deals).
  // `AiPlayer.nation` is untouched: the same girl carries her own flag at a J event next week.
  const oppNation = entrantNationAt(
    event.tier,
    world.cohort.find((c) => c.id === oppId)?.nation ?? '',
    world.profile.country,
  )
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
  // ⚠ THE GUARD MUST FOLD THE SAME TABLE `ranks` CAME FROM (round 23 #12/#13). `ranks` is built from
  // `rankingFor(world, track)`, which counts the domestic table season-to-date now; folding the
  // guard on the rolling window would print a NUMBER for an opponent the table itself has at the
  // tie floor - "unranked is not rank one" arriving from the third side. `WINDOW_BY_TRACK[track]` is
  // how the two stay one question. It does mean more Unranked opponents in the opening weeks of a
  // domestic season, which is the table honestly saying the season's race has not started - measured
  // in docs/rounds/round-23.md #12.
  const oppRankIn = (id: string): number | null =>
    isFieldProId(id) ||
    windowedBestSum(world.results, world.week, id, BEST_N_BY_TRACK[track], inTrack(track), WINDOW_BY_TRACK[track]) > 0
      ? (ranks.get(id) ?? null)
      : null

  return {
    eventId: p.eventId,
    tier: event.tier,
    // The rung's own draw, carried rather than re-derived – see `PendingView.drawSize` for the
    // screen-side constant this replaced and what it would have printed over a fixture with no draw.
    drawSize: tier.drawSize,
    surface: event.surface,
    // The weather plate on the live match. Same function the Season card quotes, so one tournament
    // has one day. VIEW ASSEMBLY ONLY - see the grep guard in tests/preview.test.ts.
    temperatureC: eventTemperature(world.seed, event),
    roundLabel: stageLabel(current.round, tier.drawSize),
    // ⭐ ROUND-21 #2: «Присутствие в потоке ... точно надо (если едет)». Asked ONCE, in the engine,
    // and carried - the same answer the running commentary and the week's story are given.
    coachTravelled: coachTravelsWithHer(world),
    ladder: track,
    // ⭐⭐⭐ ROUND 27 #6 – NOTHING STANDS WHERE THE TABLE'S NAME IS, BECAUSE THE TABLE HAS A NAME. The
    // pairing this field's docstring pins: `ladder` non-null, note null, in one literal.
    ladderNote: null,
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

/** ⭐⭐⭐ ROUND 26 #6 – THE CHAMPIONSHIP, AS THE FLOW SEES IT.
 *
 *  ⚠ EVERY FIELD IS EITHER A FACT OF THE RECORD OR A DELIBERATE NULL. The four the tour fills off
 *  `TIERS[event.tier]` – the rung, the ladder's name, the points and the crowd – have no answer for
 *  a student field, and each one says so in the way that is true of it rather than by borrowing a
 *  neighbour's: `tier` is null (there is no rung), `points` is 0 (nothing is awarded), `crowd` is 0
 *  (we do not model a student gate, and the screen omits the cell rather than dashing it).
 *
 *  ⚠ AND THE FINISH INDEX IS DERIVED FROM THE RUN, NOT INVENTED. `rounds - roundsWon` is 0 for the
 *  champion, 1 for the beaten finalist and so on, so `finishLabel` – the engine's own namer – writes
 *  «Champion» / «Runner-up» / «Semifinalist» with no second idea of what a round is called, and the
 *  flow's own `kidChampion` / `isRunnerUp` poster routing works unmodified. */
function collegeLeaguePendingView(world: WorldState): PendingView | undefined {
  if (!collegeLeagueRevealOpen(world)) return undefined
  const reveal = world.college!.leagueReveal!
  const run = world.college!.pendingLeague
  const matches = collegeLeagueRevealMatches(world)
  // Defensive, and it is the shape `pendingView`'s own `if (!event) return undefined` keeps: a
  // reveal whose rows are gone has nothing to walk, and a flow mounted over nothing is worse than no
  // flow. `resolveCollegeLeague` writes the rows and the reveal in the same call, so this is a
  // tripwire rather than a path.
  if (!run || matches.length === 0) return undefined
  const revealed = Math.min(reveal.revealed, matches.length)
  const drawSize = COLLEGE_LEAGUE.drawSize
  const surface = COLLEGE_LEAGUE.surface
  const finished = revealed >= matches.length
  const kidFinish = run.rounds - run.roundsWon
  const bracket: PendingBracketRound[] = matches.slice(0, revealed).map((m) => ({
    roundLabel: stageLabel(m.round, drawSize),
    oppName: formatShortName(m.oppName),
    kidWon: m.winnerId === KID_ID,
    score: m.score && m.bId === KID_ID ? flipScore(m.score) : m.score,
  }))
  const current = matches[Math.min(revealed, matches.length - 1)]
  return {
    // ⚠ THE REVEAL'S OWN ID AND NOT A MATCH'S. App.vue keys `tournamentHidden` off this, so it has to
    // be one value for the whole walk; it names no tier for `collegeLeagueMatchId`'s own reason.
    eventId: `college-w${reveal.week}`,
    tier: null,
    // ⚠ IT IS A DRAW OF EIGHT AND IT SAYS SO. The College League is a knockout, so the round names,
    // the strip's short stages and the coach's «three wins for the title» are all real here – see
    // `PendingView.drawSize`, where the Nations Cup's `null` is the case this number used to cover
    // by accident.
    drawSize: COLLEGE_LEAGUE.drawSize,
    surface,
    temperatureC: eventTemperature(world.seed, { id: `college-w${reveal.week}`, surface }),
    roundLabel: stageLabel(current.round, drawSize),
    // She is at a university and the family is not paying a coach – `collegeCoachFactor` is the
    // programme's staff, not a man on a fare. Nobody travelled with her, and the card says nothing.
    coachTravelled: false,
    // ⭐⭐⭐ ROUND 27 #4 – NO TABLE AT ALL, AND THE TYPE CAN SAY SO NOW. The owner: «на экране итогов
    // матча the College League написано Professional ranking – как будто нет».
    //
    // ⚠⚠ THIS LINE USED TO READ `'wta'` UNDER A COMMENT SAYING «the screen does not print it here»,
    // AND THE COMMENT WAS WRONG ABOUT A SCREEN IT DOES NOT OWN. The splash had an amateur branch;
    // the post-match BOX SCORE did not, and printed «… · Professional ranking» over a fixture that
    // awards nothing – `LADDER_LABEL.wta`, arriving from this literal. A view field chosen to be
    // harmless because one reader ignores it is a fact waiting for a second reader, which is what
    // `PendingView.ladder` exists to stop: it was added so no screen would invent the answer, and a
    // placeholder here is the engine inventing it instead.
    //
    // `null` is «none of the three», the same shape `tier: null` above carries for the rung, and it
    // is a fact about this competition rather than a default: `resolveCollegeLeague` writes no
    // result row and no cheque, so there is no table for a rank to be measured in.
    ladder: null,
    // ⭐⭐⭐ ROUND 27 #6 – AND THE WORDS THAT STAND IN ITS PLACE ARE THIS FIXTURE'S OWN. They used to
    // live in `TournamentFlow`'s `v-else`, which was correct while this was the only rungless
    // competition in the game and false the moment a second one arrived: a national squad is not a
    // student field. §5's ruling, applied one screen along – the engine states it, the screen prints
    // it.
    ladderNote: 'No ranking points and no prize money – a student field awards neither',
    // ⚠⚠ NULL ON BOTH SIDES, AND IT IS THE SAME RULING `PendingView.ladder` CARRIES READ FROM THE
    // OTHER END. Her professional rank is a number in a table this fixture is not played in, and the
    // student across the net has none at all; printing hers beside the other woman's blank would
    // invite exactly the cross-currency comparison the ladder split exists to stop.
    kidRank: null,
    opponent: {
      name: formatShortName(current.oppName),
      // ⚠ NO NATION, and `collegeLeagueOpponent` says why in as many words: a tie is her country
      // against another country and the shirt is the point of it; a student draw is not that.
      nation: '',
      rank: null,
      // ⚠ OFF THE FROZEN MATCH PLAYER, exactly as the tour's own opponent age is, and `undefined` on
      // a record saved before ages were composed – a blank, never a guess (`LEGACY_SNAPSHOT_AGE` is
      // the match engine's arithmetic fallback, not a fact about a person).
      ageYears: current.b.age !== undefined && Number.isFinite(current.b.age) ? Math.floor(current.b.age) : null,
    },
    kidMatch: revealed < matches.length ? current : undefined,
    bracket,
    // ⚠ EMPTY, AND IT IS AN HONEST EMPTY. `playCollegeLeague` composes her side of the draw and plays
    // only her matches – the other half of the bracket is never simulated – so there is no full draw
    // to show and `BracketTabs` correctly draws nothing rather than half a sheet.
    fullBracket: [],
    finished,
    kidChampion: wonTheLeague(run),
    tierLabel: COLLEGE_LEAGUE.label,
    // ⚠⚠ ZERO, AND IT IS THE CONSTRAINT RATHER THAN A PLACEHOLDER (round 25's ruling). A student
    // fixture paying WTA/ITF points would make four years of college a quiet ranking route and the
    // fork would stop being a real choice.
    points: 0,
    finishLabel: kidFinish <= 0 ? finishLabel(0) : finishLabel(Math.min(kidFinish, COLLEGE_LEAGUE_ROUNDS)),
    crowd: 0,
  }
}

/** ⭐⭐⭐ ROUND 27 #6 – THE NATIONS CUP TIE, AS THE FLOW SEES IT. The owner: «И опять на те же грабли:
 *  "Her country called this year…" во всплывашке сверху и матчи только постфактум … проводить этот
 *  турнир по обычному флоу турнира. А этот попап не нужен для этого флоу вообще.»
 *
 *  `collegeLeaguePendingView`'s twin, and every place the two differ is a place the two competitions
 *  differ – which is the whole reason this is a second function and not a parameter on that one:
 *
 *    THE RUNG        null on both. Neither is played for a tier and `callUpRubberId` names none.
 *    THE DRAW        null HERE, 8 there. A tie set is not a knockout: she plays the rubbers the
 *                    captain gives her, every one of them, and losing the first does not end her
 *                    week. So there is no bracket, no «N-player draw» and no title to cost wins.
 *    THE ROUND NAME  «Rubber 2 of 3» here against «Semifinal» there, and it comes off the record
 *                    rather than off `stageLabel`, which can only name a knockout stage.
 *    THE FINISH      HER NATION's placing, not hers. `rollCallUp` draws it flat and «nothing in that
 *                    expression reads `view`» – she can win every rubber and go home eleventh.
 *    THE FLAG        drawn. `collegeLeagueOpponent` says why the student draw has none in as many
 *                    words: «a tie is her country against another country and the shirt is the point
 *                    of it; a student draw is not that.»
 *
 *  ⚠ THE OPPONENT'S NATION IS RE-DERIVED AND NOT STORED, and that is the same trade `temperatureC`
 *  and `crowd` already make on this view. `WorldMatch` has no country field – `MatchPlayer` has none
 *  either, and giving it one would touch every match in the game to decorate three a year – so the
 *  shirt comes back off `seed:rubbers:<week>`, THE SAME sub-stream and the same call order
 *  `playCallUpRubbers` walked, re-derived at the call site and persisting nothing. Two derivations of
 *  one pure stream cannot disagree, no save field is added, and the frozen MAIN capture (41550 /
 *  e6b0c709) cannot see a sub-stream (CLAUDE.md invariant 2). */
function callUpPendingView(world: WorldState): PendingView | undefined {
  if (!callUpRevealOpen(world)) return undefined
  const reveal = world.college!.callUpReveal!
  const call = world.college!.pendingCallUp
  const matches = callUpRevealMatches(world)
  // Defensive, and it is `collegeLeaguePendingView`'s own tripwire: a reveal whose rows are gone has
  // nothing to walk, and a flow mounted over nothing is worse than no flow. `resolveCallUp` writes
  // the rows and the reveal in the same call, so this is a tripwire rather than a path.
  if (!call || matches.length === 0) return undefined
  const revealed = Math.min(reveal.revealed, matches.length)
  const surface = NATIONAL_TEAM.surface
  const current = matches[Math.min(revealed, matches.length - 1)]
  // THE WHOLE SIDE, IN THE ORDER IT WAS DRAWN – `tiesInTheWeek` opponents whether or not she played
  // them all, which is `playCallUpRubbers`' own post-draw discipline. Reading only the shirts.
  const rng = rngFromSeed(`${world.seed}:rubbers:${reveal.week}`)
  const nations: string[] = []
  for (let i = 0; i < NATIONAL_TEAM.tiesInTheWeek; i++) {
    nations.push(callUpOpponent(callUpRubberId(reveal.week, i), rng).nation)
  }
  const bracket: PendingBracketRound[] = matches.slice(0, revealed).map((m) => ({
    roundLabel: `Rubber ${m.round + 1}`,
    oppName: formatShortName(m.oppName),
    kidWon: m.winnerId === KID_ID,
    score: m.score && m.bId === KID_ID ? flipScore(m.score) : m.score,
  }))
  return {
    // ⚠ THE REVEAL'S OWN ID AND NOT A RUBBER'S. App.vue keys `tournamentHidden` off this, so it has
    // to be one value for the whole walk; it names no tier for `callUpRubberId`'s own reason.
    eventId: `nations-w${reveal.week}`,
    tier: null,
    drawSize: null,
    surface,
    temperatureC: eventTemperature(world.seed, { id: `nations-w${reveal.week}`, surface }),
    roundLabel: `Rubber ${current.round + 1} of ${matches.length}`,
    // She is at a university and the family is not paying a coach, and this week she is not even the
    // university's – she is her federation's. Nobody travelled with her, and the card says nothing.
    coachTravelled: false,
    // ⭐⭐⭐ ROUND 27 #4's WIDENING IS WHAT MAKES THIS LINE POSSIBLE. The tie is played in none of the
    // three tables (`engine/nationalTeam.ts`: no points, no cheque), and before §4 the type could not
    // say «neither» – so this fixture would have had to name one, exactly as the College League did
    // when it printed «Professional ranking» over a fixture that awards nothing.
    ladder: null,
    ladderNote: NATIONS_CUP_AWARDS_NOTHING,
    // ⚠⚠ NULL ON BOTH SIDES, the same ruling the championship's view carries: her professional rank
    // is a number in a table this week is not played in, and the woman across the net is a selected
    // senior with no row in ours at all. A real number opposite a blank invites a comparison that is
    // not there.
    kidRank: null,
    opponent: {
      name: formatShortName(current.oppName),
      // ⭐ THE SHIRT, AND HERE IT IS THE POINT OF THE WEEK – see the note over this function for why
      // it is re-derived. `''` is unreachable while `tiesInTheWeek` covers every stored rubber, and
      // is the same blank `flagEmoji` already renders for an unknown country.
      nation: nations[current.round] ?? '',
      rank: null,
      // ⚠ OFF THE FROZEN MATCH PLAYER, exactly as the tour's own opponent age is – `callUpOpponent`
      // draws her age out of `opponentAgeBand` because the serve-speed curve reads it, so a rubber
      // record saved since the college wave always has one.
      ageYears: current.b.age !== undefined && Number.isFinite(current.b.age) ? Math.floor(current.b.age) : null,
    },
    kidMatch: revealed < matches.length ? current : undefined,
    bracket,
    // ⚠ EMPTY, AND IT IS AN HONEST EMPTY – the championship's own reason, one competition along:
    // `playCallUpRubbers` plays HER rubbers and nobody else's, so the other six ties of the week were
    // never simulated and there is no full sheet to show.
    fullBracket: [],
    finished: revealed >= matches.length,
    // ⚠⚠ FALSE, ALWAYS, AND IT IS A FACT RATHER THAN A DEFAULT. `kidChampion` asks whether SHE won
    // the thing, and there is nothing here for her to win: the week's only placing belongs to her
    // nation and is drawn flat («nothing in that expression reads `view`»). Setting it from
    // `nationFinish === 1` would hang a champion's poster, with her name and her photograph on it,
    // on somebody else's result – which is the exact inversion the fixture exists to demonstrate.
    kidChampion: false,
    tierLabel: NATIONAL_TEAM.label,
    // ⚠⚠ ZERO, AND IT IS THE RULEBOOK RATHER THAN A PLACEHOLDER – research §0.4 / §5.5: the ranking
    // chart has no row for this competition at all.
    points: 0,
    // ⚠ HER NATION'S PLACING, NOT A ROUND SHE REACHED. `finishLabel` (the knockout namer) would have
    // to be handed an index this week does not have; `nationFinishLabel` is the fixture's own word
    // for its own outcome, and the poster prints it under her name with her rubbers in the strip
    // below – which is the honest split between what she did and what happened to her country.
    finishLabel: nationFinishLabel(call),
    // We do not model a national tie's gate any more than a student one's, and the screen omits the
    // cell rather than dashing it – see the splash's note on the crowd row.
    crowd: 0,
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
  // ⭐⭐⭐ THE ONE PLACE HER CONDITION BECOMES A WHOLE NUMBER, and it is a HOUSE RULE rather than a
  // detail of one spec (owner, 26.08 – the long goodbye §4a): «у нас в логике могут быть дробные
  // числа – это окей, а у пользователя целые в интерфейсе» · «пусть падает, но на фронт едет в
  // отображение округленное значение». Any number that crosses into `Snapshot` for a person to read
  // is whole; the fractions stay behind it. `Math.round` – half away from zero, «по правилам
  // математики».
  //
  // ⚠⚠ IT HAPPENS HERE, ONCE, AND NOT IN EACH COMPONENT. It used to be handed over raw and rounded
  // on the far side by `KidScreen` and `TournamentFlow` – two sides answering one question
  // separately, this repo's most-repeated defect class, with five OTHER readers of the same field
  // (`HomeScreen` twice, `PlanWeekSheet`, `SeasonScreen`, `WeekRecapCard`) rounding nothing at all.
  // While the engine's recovery was integer arithmetic that cost nothing; the long goodbye's fading
  // recovery base (world/medical.ts) makes `world.condition` genuinely fractional in the pro era, so
  // the third caller that forgot would have printed `73.41999999` on a screen. The boundary is the
  // place a component cannot get it wrong by omission.
  //
  // ⚠ THE ENGINE'S OWN COPY IS UNTOUCHED and must stay so: `world.condition` keeps the fraction, the
  // corridor keeps closing continuously, and every threshold the engine reads – the doctor's veto,
  // the tier caution floors, the injury door – still reads the real number. Rounding the MECHANIC
  // would deliver the fade as three visible jumps instead of a slope, which is the opposite of what
  // §4a is for. `tests/condition-boundary.test.ts` is the guard.
  const shownCondition = Math.round(world.condition)
  // Diary-1: the facts + the selected lines, assembled from a narrow view of the world. Selection
  // draws only from `seed:diary:*` / `seed:memory:*` sub-streams at SNAPSHOT time – zero MAIN
  // draws, so the frozen capture (41550 / e6b0c709) is untouched by construction.
  const diary = buildDiarySnapshot({
    seed: world.seed,
    week: world.week,
    ageYears: kidAgeAt(world, world.week),
    // Keep this structural instead of importing `inCollege`: college.ts already depends on this
    // projection module for ladder presentation, and the diary must not create a runtime cycle.
    inCollege: world.college !== null && world.week < world.college.untilWeek,
    schoolOver: schoolIsOver(world.week, world.profile.birthMonth),
    kidId: KID_ID,
    startAgeYears: START_AGE_YEARS,
    condition: shownCondition,
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
    // ⭐ ROUND-21 #2: the ONE predicate, asked here and carried – see `coachTravelsWithHer`.
    coachTravelled: coachTravelsWithHer(world),
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
    // the birthday week's scrap names her age while the dialog is up and gains the present
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
    // ⭐⭐⭐ ROUND 24 #5 – the week she leaves for college, in its two live states (see the field's
    // own doc in protocol.ts): the OPEN fork shows the prospective September the college answer
    // would book; the HOLD shows the booked one. Null everywhere else – enrolled, terminal ending
    // (a voided reservation never resurfaces), other answers, no fork yet.
    collegeDepartsWeek:
      world.ending === null && world.college === null && world.fork !== null
        ? world.fork.answer === null
          ? nextAcademicYearStart(world.fork.askedWeek)
          : world.fork.answer === 'college'
            ? (world.fork.departsWeek ?? null)
            : null
        : null,
    // ⭐ AD STEP 2 (§4a) – every running endorsement's shoot weeks, off each signed paper's own
    // frozen terms (`activeAdDeals` honours [fromWeek, untilWeek] and not a week further), so the
    // calendar's markers and the recovery `accrueCondition` actually charges can never name
    // different weeks. One row per live deal since the portfolio (P6); the brand rides along so a
    // row can say whose shoot a week is.
    adShoots: activeAdDeals(world.offers, world.week)
      .map((deal) => {
        const t = deal.terms as AdOfferTerms
        return { brand: t.brand, weeks: [...(t.shootWeeks ?? [])] }
      })
      .filter((r) => r.weeks.length > 0),
    // ⭐⭐ ROUND 29 PART FOUR P7/P8 – FAME, the accounted stock (world/fame.ts): results set the
    // floor, the lived shoot weeks multiply it, everything decays slowly, and NOTHING here is a
    // die. Rounded ONCE at this boundary – `condition`'s own rule, and the same ratchet
    // («у пользователя целые в интерфейсе»); no screen may round it again.
    fame: Math.round(fameAt(world)),
    // ⭐⭐ ROUND 29 PART FOUR P6/§8 – THE PORTFOLIO SHELF, one row per category in shelf order,
    // filled/open/closed, every number the engine's own. Empty before eighteen: no shelf for a
    // junior (`reviewAdOffer`'s own age gate, read through the same constant).
    adPortfolio: (() => {
      if (kidAgeAt(world, world.week) < ECONOMY.advertising.fromAgeYears) return []
      const standing = sponsorStandingOf(world)
      const band = adBandFor(standing)
      const rows: AdPortfolioRow[] = []
      for (const category of AD_CATEGORIES) {
        const deal = activeAdDealIn(world.offers, category, world.week)
        if (deal) {
          const t = deal.terms as AdOfferTerms
          rows.push({
            category,
            label: category === 'capstone' ? 'The capstone' : ECONOMY.advertising.categories[category].label,
            state: 'filled',
            brand: t.brand,
            cashCents: t.cashCents,
            termYears: Math.max(1, t.termYears ?? 1),
            untilWeek: deal.untilWeek ?? deal.week,
          })
          continue
        }
        if (category === 'capstone') {
          const held = capstoneSeasonsOf(world)
          const needed = ECONOMY.advertising.capstone.seasonsInTop10
          // The crowning row shows only once the shelf itself exists for her – any band open – so
          // the ladder's end is visible from the first professional rung, tenure counted plainly.
          if (band === null) continue
          rows.push(
            held >= needed
              ? { category, label: 'The capstone', state: 'open', openCashCents: ECONOMY.advertising.capstone.cashCents }
              : { category, label: 'The capstone', state: 'closed', seasonsInTop10: { held, needed } },
          )
          continue
        }
        const def = ECONOMY.advertising.categories[category]
        const fee = band === null ? null : adFeeFor(category, band)
        if (fee !== null) {
          rows.push({ category, label: def.label, state: 'open', openCashCents: fee })
        } else {
          // the weakest band whose cell is priced = the standing the category opens at
          const openIdx = def.feeCentsByBand.findIndex((c) => c !== null)
          rows.push({
            category,
            label: def.label,
            state: 'closed',
            opensAtRank: openIdx >= 0 ? ECONOMY.advertising.bands[openIdx].maxWtaRank : undefined,
          })
        }
      }
      return rows
    })(),
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
    condition: shownCondition,
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
          // v59: present only while the masseur has taken weeks off THIS layoff – the projection
          // mirrors the persisted shape, absent-for-none included.
          ...(world.injury.weeksSaved !== undefined ? { weeksSaved: world.injury.weeksSaved } : {}),
        }
      : null,
    // ⭐ R2-02: and WHAT IT DID, as facts. See `buildInjuryReport` for why the surface may no longer
    // reconstruct any of this from the sentences the engine wrote.
    injuryReport: buildInjuryReport(world),
    physioActive: world.physioActive,
    // v59, the travelling team steps 1+2 – the masseur card's facts, all derived: the flag, the
    // gate (the professional table's own one-way latch), the RUNG's flat weekly bill, his room
    // note (the plan's §4 sentence – '' when nobody is hired), the dial and the travel stance, and
    // what the booked trips would cost him a seat on (the coach billing's own as-if trick: priced
    // with the stance forced ON, because a price the switch's row quotes must not change the
    // moment the switch is flipped).
    masseurHired: world.masseurHired ?? false,
    masseurUnlocked: masseurUnlocked(world),
    masseurSalaryCents: masseurWeeklyCents(world),
    masseurNote: masseurRoomNote(world),
    masseurSessionsPerWeek: masseurRungOf(world).sessions,
    masseurTravels: world.masseurTravels ?? false,
    ...(() => {
      const asIf: WorldState = { ...world, masseurHired: true, masseurTravels: true }
      let masseurTravelFareCents = 0
      let masseurTravelTrips = 0
      for (const id of world.entries) {
        const e = eventById(world, id)
        if (!e || e.week < world.week) continue
        const fare = masseurTravelFareFor(asIf, e)
        if (fare > 0) {
          masseurTravelFareCents += fare
          masseurTravelTrips++
        }
      }
      return { masseurTravelFareCents, masseurTravelTrips }
    })(),
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
    // ⭐⭐ ROUND 29 #3 – THE SHOOT ON A TOURNAMENT WEEK. Same contract as the two prompts above and
    // for the same reason: non-null on exactly the weeks `shootClashOpen` is true, which is the
    // predicate `advanceRefusal` blocks on, so the card cannot be missing on a week the engine has
    // refused to tick. `buildShootClashPrompt` re-checks that predicate itself, so this is one call.
    shootClash: buildShootClashPrompt(world),
    // ⭐ round-18 #8 – THE TOUR'S COMMITMENT RULES, AS SENTENCES. Non-null on exactly the weeks
    // `mandatoryBindsRank` is true, which is a READ of the regime that has been enforced since v38 –
    // nothing new is decided here. Unlike the two prompts above this one does NOT stop the world: the
    // engine has nothing to wait for, so the shell shows it once per career off its own watermark and
    // the field stays non-null for the rest of the career (see App.vue's `showTourBriefing`, and the
    // note on `buildTourBriefing` for why the trigger is the crossing rather than the season boundary).
    tourBriefing: buildTourBriefing(world),
    events: snapshotEvents(world),
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
    // ⭐⭐ v63 – THE SHELF (docs/specs/the-shop-2026-08.md §2). Same rule as `kit` two lines up, and
    // the same reason: the screen never prices a rung, never applies a rate and never subtracts two
    // figures to find a loss. `shopView` does all three, once.
    shop: shopView(world),
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
    // ⭐⭐ WHY A SHUT RUNG IS SHUT (PR-09 / TB-05) – the third map in this family and the one that
    // stops the UI rebuilding the rule. `tierVerdict` asks the SAME `entryVerdict` the turnstile
    // asks, so a card and `enterEvent` cannot disagree by construction. Only refusals are written:
    // an open rung has no entry here, which is why this never restates `tierOpen` beside it.
    tierRefusal: Object.fromEntries(
      TIER_LADDER.map((t) => {
        const v = tierVerdict(world, t)
        if (v.level !== 'blocked' || !v.reason || v.reason === 'outgrown') return [t, undefined]
        return [
          t,
          {
            reason: v.reason,
            ...(v.detail !== undefined ? { detail: v.detail } : {}),
            ...(v.pointsToEnter !== undefined ? { pointsToEnter: v.pointsToEnter } : {}),
            ...(v.rankToEnter !== undefined ? { rankToEnter: v.rankToEnter } : {}),
            ...(v.entryCap !== undefined ? { entryCap: v.entryCap } : {}),
          },
        ]
      }).filter(([, r]) => r !== undefined),
    ) as Partial<Record<TierId, TierRefusal>>,
    // R15-9: THE ON-RAMP LATCHES, read-only, for the SLIDING TIER WINDOW - the calendar hides the
    // rungs a latch says she has definitively left behind (a copy, like every object on this
    // message: the snapshot must never be a live view of engine state). Surfacing widens the
    // snapshot only; the persisted v34 field and the entry gates are untouched.
    onRampCleared: { ...world.onRampCleared },
    coachId: world.coachId,
    coachMarket: coachMarket(world),
    coachBilling: coachBilling(world),
    coachRoomNote: coachRoomNote(world),
    coachEdge: coachEdgeView(world),
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
      // ⭐ ROUND-23 #6b – HER COLLEGE YEARS. `null` for a career that never took the place, which is
      // what keeps the tile's own default ("after school") the honest one for everybody else.
      //
      // ⚠ `studying` IS THE SPAN AND NOT A FLAG, spelled the way `inCollege` spells it. It is written
      // out structurally rather than imported for `snapshot.inCollege`'s own reason four hundred lines
      // up: `world/college.ts` depends on this module, so an import would close a runtime cycle.
      //
      // ⚠ THE PLACE COMES OFF THE OFFER SHE AGREED TO, through `chosenQuoteOf` – the single reader the
      // college bill and the fork card already share, so the campus her page names is the campus the
      // family is being billed for.
      college:
        world.college === null
          ? null
          : {
              studying: world.week < world.college.untilWeek,
              yearsDone: world.college.years.length,
              totalYears: ENDINGS.collegeYears,
              tier: chosenQuoteOf(world.fork?.offer)?.tier ?? null,
            },
      // ⭐ ROUND-23 #18 – what her own account holds. `?? 0` for the hand-built probe worlds that
      // predate v54, the discipline every optional world field on this view already keeps.
      kidFundsCents: world.kidFundsCents ?? 0,
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
    // ⭐ ROUND-19 #2 – ...AND WHETHER THAT RECAP IS STILL OWED THIS WEEK, as a snapshot field, for the
    // reason the three W2-ENDINGS fields below are: the wrap-up used to be gated on the `'season-end'`
    // STOP REASON, which dies with the advance that produced it – so answering the retirement offer
    // raised on that same week destroyed the summary behind it. Derived from `lastSeasonSummary` and
    // the week, both of which the world already holds; no persisted field and no migration.
    seasonWrapPrompt: seasonWrapDue(world),
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
      ? {
          askedWeek: world.fork.askedWeek,
          ageYears: kidAgeYears(world.fork.askedWeek, world.profile.birthMonth, world.profile.birthDay),
          // ⭐⭐ THE OFFER, STRAIGHT OFF PERSISTED STATE (v51). It is measured once, the week the fork
          // is raised, and it is not recomputed here – a snapshot that re-derived it would answer a
          // different question on the week a constant moved, and this one is money.
          //
          // ⚠ AND IT IS NOT `collegeOpen` COMING BACK, which is worth saying on this exact line
          // because this is where that flag used to sit. `collegeOpen` decided whether the card DREW
          // the third answer; the offer decides what the third answer SAYS. There is no value of it
          // that removes an answer: `offer.programme === null` still draws three, and still enrols
          // her – at the full price, as a walk-on. The owner's ruling of 16.08 is untouched.
          offer: world.fork.offer ?? null,
        }
      : null,
    retirementOffer: world.retirementOffer,
    // ⭐⭐⭐ ROUND 31 #9 – THE NUMBER THAT WAS ALREADY THERE AND NEVER SHOWN. The ending has read it
    // as a boolean since v62; three screens read it as a story now (the retirement card's rung, the
    // coach's line on a season card, her own line at the wrap). The full argument is on the field in
    // shared/protocol/snapshot.ts, and the arithmetic is `physicalShareOf`'s – called, not repeated.
    // ⚠ ZERO DRAWS, like everything else in this builder.
    physicalShare: physicalShareOf(world),
    // ⭐ THE LONG GOODBYE STEP 4 – the one piece of state her last word reads, and the retirement
    // card is drawn long before `buildEndingView` above has anything to return.
    oneMoreYearCount: world.oneMoreYearCount,
    college: world.college,
    careerTotals: world.careerTotals ?? { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
    ...(stopReasons && stopReasons.length > 0 ? { stopReasons } : {}),
    ...(pending ? { pending } : {}),
  }
}
