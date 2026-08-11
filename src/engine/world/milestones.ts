// WHAT THE FAMILY KEEPS: the moments that are never pruned, and the season they add up to.
//
// Two things that are one thing. A milestone is a line the events feed must never lose (the events
// ledger is capped and pruned oldest-first; `keep` is what survives), and the season wrap-up is the
// once-a-year fold of every such line plus the ledgers into one summary the player is shown. They
// share the trophy ledger helpers and the season-history cap, so they share a file.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything at runtime comes from SIBLING leaves.
//
// ⚠ RNG: nothing here draws. The wrap-up folds persisted ledgers, so the frozen MAIN capture cannot
// notice this file.
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS, TIER_LADDER, TIERS } from '../season/calendar'
import { seasonYear } from '../../shared/dates'
import { milestoneKey } from '../diary'
import { schoolEndWeek, schoolIsOver } from '../kidLife'
import type { LadderTrack, TierId } from '../season/types'
import {
  LADDER_LABEL,
  LADDER_TRACKS,
  type Milestone,
  type SeasonEntryLedger,
  type SeasonTrackRow,
  type TierTrophies,
  type WorldEventCategory,
} from '../../shared/protocol'
import { addEvent, financeWindow, seasonIndexOf, seasonStartWeek } from './ledger'
import { KID_ID } from './constants'
import { finishLabel } from './labels'
import { activeLadderOf, entryCouldNotMove, kidPoints, rankIn } from './ladder'
import type { WorldState } from '../world'

// --- milestones (never pruned) -----------------------------------------------
export function fireMilestone(world: WorldState, key: string, text: string): void {
  if (world.events.some((e) => e.milestoneKey === key)) return
  addEvent(world, { week: world.week, type: 'milestone', text, keep: true, milestoneKey: key })
}

/** Diary-1 D10: remember a moment in the durable ledger. Idempotent per `milestoneKey` (a first
 *  can only happen once), SILENT (no event – the existing milestone events keep announcing), and
 *  pure state: zero draws on any stream, so no capture can ever move the frozen MAIN pins. */
export function captureMilestone(world: WorldState, m: Milestone): void {
  const key = milestoneKey(m)
  if (world.milestones.some((x) => milestoneKey(x) === key)) return
  world.milestones.push(m)
}

/** THE LAST DAY OF SCHOOL (W4-SCHOOL), as a moment the player is shown rather than a flag that flips.
 *
 *  THE OWNER'S RULING is that school ends – «Школа должна когда-то закончиться» – and the register of
 *  this game is that things happen to a family and get noticed. School evaporating quietly between
 *  two weeks would have been the wrong shape for the biggest change to her week since the career
 *  opened: from this September the mornings are hers, the exam fortnight never comes again, and the
 *  calendar draws a professional's day.
 *
 *  TWO SURFACES, ONE EVENT: the news feed keeps the line (`keep: true`, so the ledger's 400-row prune
 *  can never lose it) and the album's scroll keeps the row. Both are idempotent by key, so a replay,
 *  a reload or the v43 back-fill cannot double it.
 *
 *  ⚠ EXACTLY ONE WEEK, AND IT IS THE ONE `schoolEndWeek` NAMES – the 1 September on which she would
 *  have started a thirteenth grade. Not her birthday: «Конец школы – в конце учебного года.»
 *
 *  ZERO DRAWS on any stream: a comparison of two integers and two idempotent writes. The frozen MAIN
 *  capture (41550 / e6b0c709) cannot see it. */
export function markSchoolEnd(world: WorldState): void {
  if (world.week !== schoolEndWeek(world.profile.birthMonth)) return
  fireMilestone(world, 'school', 'School is behind her. From Monday the mornings are hers too.')
  captureMilestone(world, { type: 'school', week: world.week })
}

/** ⚠ THE TURN, CAPTURED THE WEEK IT HAPPENS AND NEVER RECONSTRUCTED (contract §9.4, and the wave
 *  brief put it in double capitals). The album's central page – slot 6 – is the week her cumulative
 *  prize money first passed her cumulative costs. The finance ledger keeps SIXTY WEEKS and the
 *  crossing may land in season seven, so at epilogue time the arithmetic behind the answer is
 *  already pruned out of the save. Either this row exists or the page is empty for everybody who
 *  earned it.
 *
 *  ⚠ AND IT IS PRIZE MONEY AGAINST COSTS, not income against costs. Parent wages, sponsor money,
 *  the academy grant and savings interest all cross the ledger as income; none of them is the tennis
 *  paying for itself, and §9.2 is about «the break-even the whole game is about». A family that
 *  merely stayed solvent has not turned – it has been subsidising her, which is the thesis, not the
 *  exception to it.
 *
 *  Idempotent through `captureMilestone` (identity is the type), pure state, zero draws – so it
 *  runs on the one step that fires on BOTH a normal week and a tournament week and cannot double. */
export function captureBreakEven(world: WorldState): void {
  // (a) THE WEEK that paid for itself. Common, and it is the beat a player actually feels - the
  //     owner watched his own career cross it at seventeen. Read off THIS week's row of the finance
  //     ledger, which is the only week guaranteed to still be in it.
  const thisWeek = world.financeWeeks.find((w) => w.week === world.week)
  if (thisWeek) {
    const prize = thisWeek.byCategory.prize ?? 0
    let costs = 0
    for (const [cat, amt] of Object.entries(thisWeek.byCategory) as [WorldEventCategory, number][]) {
      if (cat !== 'prize' && amt < 0) costs += -amt
    }
    if (prize > 0 && prize > costs) {
      captureMilestone(world, { type: 'break-even', week: world.week, kind: 'week' })
    }
  }
  // (b) THE CAREER. The one §9.2 asks slot 6 for, and the rare one.
  const t = world.careerTotals
  if (!t || t.prizeCents <= t.spentCents) return
  captureMilestone(world, { type: 'break-even', week: world.week, kind: 'career' })
}

/** R10-9: how many finished seasons the career history keeps (newest wins). 30 years of junior/
 *  pro career is far past the game's horizon – the cap exists so the save has a hard ceiling. */
export const SEASON_HISTORY_CAP = 30

// =================================================================================================
// THE TWO FOLDS THE WRAP-UP USED TO SCRAPE OUT OF THE EVENT FEED (fix/wallet-and-wrapup, 05.08)
// =================================================================================================
//
// The owner, season 2038, on a 44-19 record: the wrap-up card said «no tournaments played». It is
// the same defect R11-12a fixed for the season's MONEY eleven notes above, arriving through a
// different field – the money moved onto `financeWeeks` and the best-result fold was missed.
//
// ⚠ AND IT BITES MUCH EARLIER THAN THE MONEY DID, which is why it went unnoticed for so long: the
// feed does not go from right to empty, it DECAYS. Measured on tools/wallet-audit.ts, one greedy
// career: the wrap-up's best result is already wrong in season 3 (it printed "Semifinalist" over a
// real Champion, because the season's earliest tournament rows had been pruned while the later ones
// survived), wrong again in seasons 5, 6 and 7, and only becomes the owner's flat "no tournaments
// played" in season 8. A wrong-but-plausible finish is not something a playtest can catch.
//
// THE LEDGER THAT CAN ANSWER IT. `world.results` prunes on TIME (RESULTS_WINDOW = 52 weeks) and the
// wrap fires at yearStart + 49, so every row of the season it is about is inside the window BY
// CONSTRUCTION – no count, no cap, no career length that can take it away.

/** HER BEST FINISH OF THE SEASON, inverted out of the counting results the ledger holds.
 *
 *  A result row carries what the finish PAID and the tier it was paid at, and `TierDef.points` is
 *  indexed by finish and strictly decreasing on every rung – so a positive payout inverts to exactly
 *  one round, in that tier's own table. (`nextGoal.ts` reads the same inversion for the goal ladder.)
 *
 *  ⚠ WHAT IT CANNOT SEE, stated rather than papered over: the kid's result row is AWARD-ONLY
 *  (`finalizeTournament` pushes it only when `points > 0`), so a season of nothing but scoreless
 *  exits leaves no row at all. That is not the same fact as "she played no tournaments", and the
 *  caller tells the two apart with the season W-L, which is a running counter and cannot be pruned. */
function seasonBestFinish(world: WorldState, fromWeek: number, toWeek: number): number | null {
  let best: number | null = null
  for (const r of world.results) {
    if (r.playerId !== KID_ID || r.week < fromWeek || r.week >= toWeek) continue
    if (!r.tier || r.points <= 0) continue
    const finish = TIERS[r.tier].points.indexOf(r.points)
    if (finish < 0) continue
    if (best === null || finish < best) best = finish
  }
  return best
}

/** WHICH TABLE THE SEASON WAS PLAYED ON – the owner's own ask, 05.08: «на том же экране всегда
 *  показывается international, хотя мы уже давно там не играем. Это тоже надо как-то динамично
 *  делать в зависимости от текущего уровня турнира, ну или доминирующего в этом году.»
 *
 *  THE RULE: the track that carried the most COMPETITIVE MATCHES this season, ties broken by the
 *  points she earned on each, and by the ladder's own order last (the higher table wins a dead heat).
 *
 *  ⚠ MATCHES AND NOT ENTRIES, because matches are the fact the save actually keeps. `seasonRecord`
 *  is the per-track W-L (v28/v30), it is a running counter incremented at every finalize, it is
 *  reset by this very function one screen below – so at the moment it is read it describes exactly
 *  the season being wrapped, whatever the event feed has done with its rows. Counting ENTRIES would
 *  mean counting result rows, which are award-only and would silently under-count the rung she is
 *  losing openers at, i.e. precisely the rung a struggling professional plays most.
 *
 *  ⚠ AND A SEASON SHE DID NOT PLAY AT ALL falls back to `activeLadderOf` – the game's ONE answer to
 *  "which table is hers", the same one Home's chip, Stats and the Kid screen read. A year lost to
 *  injury does not demote a professional to the junior tour. */
/** The season's ranking points, TOLD APART BY TABLE – one fold, two callers (the dominant-track rule
 *  below and the per-track history row v46 banks), so the two can never disagree about what a season
 *  scored where.
 *
 *  ⚠ A ROW WITH NO TIER CONTRIBUTES NOTHING, deliberately. `SeasonResult.tier` is optional because
 *  pre-r5 kid results were written without it, and a row that cannot name its rung cannot name its
 *  table either – adding it to a bucket would be a guess, and adding it to all three would double-count
 *  the season. The tierless rows are pre-r5 only, so this is a statement about a corner of history and
 *  not about any season this build writes. */
function seasonPointsByTrack(world: WorldState, fromWeek: number, toWeek: number): Record<LadderTrack, number> {
  const pointsBy: Record<LadderTrack, number> = { domestic: 0, itf: 0, wta: 0 }
  for (const r of world.results) {
    if (r.playerId !== KID_ID || r.week < fromWeek || r.week >= toWeek) continue
    if (!r.tier) continue
    pointsBy[TIERS[r.tier].track] += r.points
  }
  return pointsBy
}

/** THE SEASON, ONE ROW PER TABLE (v46) – what the wrap-up banks into `SeasonHistoryEntry.byTrack`.
 *
 *  Read at the wrap and nowhere else, because every term is about to stop being readable: the points
 *  come off `world.results` (pruned to a rolling 52 weeks), the W-L off `world.seasonRecord` (reset by
 *  the wrap itself), and the ranks off the caches the wrap's own recompute has just settled.
 *
 *  ⚠ IT IS `emptySeasonRecord()`'s SHAPE PLUS TWO FIELDS, on purpose – see `SeasonTrackRow`. The W-L
 *  halves are literally copied out of `seasonRecord`, so the history row and the live tiles on the
 *  Stats screen are the same counters at two moments rather than two counts of one season. */
function seasonHistoryByTrack(
  world: WorldState,
  fromWeek: number,
  toWeek: number,
): Record<LadderTrack, SeasonTrackRow> {
  const pointsBy = seasonPointsByTrack(world, fromWeek, toWeek)
  const record = world.seasonRecord ?? emptySeasonRecord()
  const rows = {} as Record<LadderTrack, SeasonTrackRow>
  for (const track of LADDER_TRACKS) {
    const wl = record[track] ?? { wins: 0, losses: 0 }
    // "Unranked is not a number", per table – the same guard `rankInTrack` applies to the card.
    const endRank = kidPoints(world, track) > 0 ? rankIn(world, track) : undefined
    rows[track] = {
      points: pointsBy[track],
      wins: wl.wins,
      losses: wl.losses,
      ...(endRank === undefined ? {} : { endRank }),
    }
  }
  return rows
}

function dominantTrackOfSeason(world: WorldState, fromWeek: number, toWeek: number): LadderTrack {
  const pointsBy = seasonPointsByTrack(world, fromWeek, toWeek)
  const record = world.seasonRecord ?? emptySeasonRecord()
  // Lowest table first, so a strictly-greater test lets the HIGHER table win a dead heat. The order is
  // `LADDER_TRACKS`' own (see its note in protocol.ts) rather than a second copy of the ladder here.
  const order = LADDER_TRACKS
  let best: LadderTrack | null = null
  let bestMatches = 0
  for (const track of order) {
    const played = (record[track]?.wins ?? 0) + (record[track]?.losses ?? 0)
    if (played === 0) continue
    if (best === null || played > bestMatches || (played === bestMatches && pointsBy[track] >= pointsBy[best])) {
      best = track
      bestMatches = played
    }
  }
  return best ?? activeLadderOf(world)
}

// --- season wrap-up (Round 5 items 16/21; round-7 item 4) ---------------------
// Fires once, the moment the world ticks into a season year's first off-season week
// (see calendar.ts's isOffSeasonWeek). Season figures are read back off the EXISTING
// ledgers for the just-finished year, EXCEPT W-L which come from the running counters
// (round-7: "count as you go … don't parse text", so pruning can't lose them):
//  - season points / best finish: results + tournament events in range.
//  - W-L: world.seasonWins / seasonLosses (accumulated at finalizeTournament).
//  - rank vs season start: results ledger replayed at the year's first week (still
//    inside the 52-week ranking window, so nothing has been pruned away yet).
//  - money (spent / earned / net): the SAME financeWindow fold the Money screen reads,
//    over the SAME season window (see below).
// The same figures are stored as the structured `lastSeasonSummary` (v10) for the
// SeasonSummaryDialog, then the season counters reset for the year ahead.
//
// R11-12a – THE MONEY BUG (owner, 120k season 2: "spend 59740 … no wait, the final popup adds it
// up wrong: the wallet says 95507"). The season's money figures were a scrape of `world.events`:
//   1. `events` is CAPPED (EVENTS_CAP = 400, pruned oldest-first) and `housekeep` prunes it
//      IMMEDIATELY BEFORE this function runs – so from the first season the cap bites, the earliest
//      financial events of the year were simply not in the array any more. Measured on the bench's
//      120k/wealthy career: season 2 came out $885 light for exactly this reason. The per-category
//      `financeWeeks` ledger exists precisely because `events` cannot be trusted for money
//      (protocol.ts, FinanceWeek) – the Money screen was moved onto it and this fold was missed.
//   2. the window was `[yearStart, wrapWeek)` – it EXCLUDED the wrap-up week's own costs, which the
//      tick has already charged by the time this runs, while the Money screen's "This season"
//      window includes them (another $174–$381 a season on the same bench career).
//   3. and one figure was doing two jobs: the popup's single line is a NET delta, while the number
//      the owner was comparing it against – the wallet's donut centre – is GROSS SPEND. On that
//      same career the two are $47,371 and $73,316: both correct, neither the other. So the summary
//      now banks spend and income SEPARATELY, and the popup can show what the wallet shows.
// The fold is exhaustive over the ledger's categories by construction (financeWindow walks
// `byCategory`), so a NEW expense category can never be forgotten here again – there is no list to
// forget it from. Reconciled cent-for-cent against the wallet, and against the change in
// `fundsCents` itself, in tests/round11.test.ts.
export function maybeFireSeasonWrapUp(world: WorldState): void {
  if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) return
  // THE SEASON, IDENTIFIED BY ITS INDEX – and the year it is DISPLAYED as, derived from that index.
  // Everything below that names a season (the milestone key, the milestone text, the summary's
  // label, the history row and its dedup guard) reads one of these two, so they cannot disagree.
  //
  // ⚠ THE BUG THIS REPLACES (fix/world-trio). The label and the identity were the same value –
  // `weekYear(yearStart)`, the calendar year of the season's first Monday – and that value repeated:
  // 52 weeks is 364 days, so the opening Monday walked ~1.25 days earlier a year and stepped back
  // over New Year at season 5. weekYear(208) and weekYear(260) were BOTH 2035, so when season 5
  // wrapped, the `some(h => h.year === …)` guard below saw 2035 already banked (by season 4) and
  // dropped season 5's row on the floor. A whole season vanished from the Stats table at age 19.
  //
  // ⚠ AND THE CAUSE IS GONE TOO (wave/flags-grant): `shared/dates.ts` re-anchors each season to the
  // first Monday of its own year, so `weekYear` can no longer repeat. NOTHING HERE CHANGES, and that
  // is deliberate rather than laziness – there is no workaround in this function to unwind. It reads
  // `seasonIndexOf` for the identity and `seasonYear` for the label, which is what a season record
  // should be keyed on whatever the calendar underneath is doing. The paragraph above is now history
  // rather than a live hazard; it stays because it is why these two lines are two lines.
  const seasonIndex = seasonIndexOf(world.week)
  const displayYear = seasonYear(seasonIndex)
  const yearStart = seasonStartWeek(world.week)
  const wrapWeek = world.week

  const inRange = (w: number) => w >= yearStart && w < wrapWeek

  const seasonPoints = world.results
    .filter((r) => r.playerId === KID_ID && inRange(r.week))
    .reduce((sum, r) => sum + r.points, 0)

  // ⚠ OFF THE RESULTS LEDGER, NOT THE EVENT FEED (fix/wallet-and-wrapup) – see `seasonBestFinish`.
  // What stood here was `for (const e of world.events) ... e.type === 'tournament' && e.finishIdx`,
  // and `world.events` is capped at 400 rows by COUNT: on the owner's save the tournament summaries
  // of the whole season had been evicted, so a 44-19 year reported "no tournaments played".
  const bestFinish = seasonBestFinish(world, yearStart, wrapWeek)

  const wins = world.seasonWins
  const losses = world.seasonLosses

  // The season's money, off the pruning-proof per-category ledger, over the window that ENDS ON
  // the wrap-up week (inclusive – `financeWindow` has no upper bound and the ledger holds nothing
  // past the current week). That window is exactly what the Money screen's "This season" shows at
  // this moment, so the popup and the wallet agree by construction. The two remaining off-season
  // weeks (50, 51) still spend money and the wallet keeps counting them into the same 52-block –
  // a figure computed HERE cannot know them, and it should not: it describes the season played.
  const seasonMoney = financeWindow(world.financeWeeks, yearStart)
  const spentCents = seasonMoney.expenseCents
  const earnedCents = seasonMoney.incomeCents
  const fundsDeltaCents = seasonMoney.netCents

  // Season-Life slice C: weeks lost to injury inside [yearStart, wrapWeek). Derived from
  // injuryHistory (each entry spans [week - weeksOut, week)) + the current injury if she is
  // still out at the wrap – no extra persisted counter, so no schema bump.
  const overlap = (lo: number, hi: number) => Math.max(0, Math.min(hi, wrapWeek) - Math.max(lo, yearStart))
  let weeksInjured = 0
  for (const h of world.injuryHistory) weeksInjured += overlap(h.week - h.weeksOut, h.week)
  if (world.injury) weeksInjured += overlap(world.injury.sinceWeek, wrapWeek)

  // R12-S1 – "#89 ↓88 FROM #1" (owner's screenshots, BOTH careers, season 2). She did not start
  // season 2 ranked first; nobody did.
  //
  // THE BUG. This line used to be a REPLAY:
  //     computeRanking(world.results, yearStart, [...cohortIds(world), KID_ID])
  // – "rank everyone as they stood on the season's first week" – and the comment above it claimed
  // the data was still there ("still inside the 52-week ranking window, so nothing has been pruned
  // away yet"). That claim is false, and it is false by 49 weeks. The wrap fires at yearStart + 49,
  // and `pruneResults` keeps `world.week - r.week <= 52`, i.e. weeks from yearStart − 3 onward. The
  // ranking AT yearStart needs the 52 weeks BEFORE it – the whole season that earned her the rank
  // she carried in – and every one of them has already been pruned. So `computeRanking` ran over a
  // ledger holding almost nothing, virtually the entire field came out on 0 points, and competition
  // ranking gives every member of a tie the SAME rank: #1. Her "season start rank" was an artefact
  // of an empty table, and it read as a fall from the top of the world.
  //
  // It is not recoverable at wrap-up – the rows are gone – so it is CAPTURED instead, at the moment
  // it is true: the top of the tick into the season's first week (see tickWeek), from the rank she
  // carried in. Persisted, because a save can be closed mid-season (schema v17). null on a career
  // migrated from an older save mid-season, which every reader already handles as "not recorded".
  const startRank = world.seasonStartRank

  // R12-S2 (owner's screenshot): the row LABEL is already "Best result", so the value said
  // "best Champion". The value is the finish, and nothing else – "Champion" / "Runner-up" /
  // "Semifinalist". The no-tournaments phrasing is untouched: it is a sentence, not a finish.
  // Checked against every consumer: SeasonSummaryDialog's "Best result" row (the row this fixes),
  // the wrap-up milestone below (which reads as a bare clause between two others, and reads better
  // without the stray adjective), and the Stats season table – which never used this string at all,
  // it renders `bestFinish` through `finishLabel` itself. Summaries banked BEFORE this change keep
  // their stored wording, which is correct: a recap is a record of what was said.
  // ⚠ AND THERE ARE THREE ANSWERS NOW, NOT TWO. The result ledger is award-only, so "no counting
  // result" and "no tournaments played" are different facts about different seasons and the W-L
  // counters are what tell them apart. A girl who entered eight events and lost eight openers has
  // played tournaments; saying she has not is the same lie in a smaller font.
  const bestText =
    bestFinish !== null
      ? finishLabel(bestFinish)
      : wins + losses > 0
        ? 'no result that scored'
        : 'no tournaments played'
  const fundsSign = fundsDeltaCents >= 0 ? '+' : '-'
  const fundsText = `${fundsSign}$${Math.abs(Math.round(fundsDeltaCents / 100)).toLocaleString('en-US')}`

  // ⚠ THE RANK IS NAMED (30.07, fix/ranking-truth). This read a bare "rank #N" off `world.kidRank`,
  // which was a both-ladders fold at the time, so the popup and Home agreed with each other (#4) and
  // disagreed with the Stats table (#128) - the owner's «Rank #4 on the home tab and end of season
  // popup seems strange since in stats I can clearly see #128». `kidRank` is honestly the ITF rank
  // now, and saying so is what stops the number being read as the only rank she has: a fourteen-year-
  // old who has not left the country yet ends her season around #130 internationally and that is not
  // a disappointing result, it is an accurate one. `LADDER_LABEL.itf` so the wording matches the
  // screens exactly.
  // ⚠ AND "UNRANKED" IS NOT A NUMBER. Found in the browser, one screen apart: a working-class girl who
  // never left the country ended her season with the Stats International tab reading "Unranked" and
  // this popup reading "#127" - the owner's original complaint, in a new pair of clothes. #127 is the
  // dense rank of the whole 0-point tie group, which is the thing `rankLabel` exists to refuse to
  // print. So the popup says what the table says, and the rank move (a diff between two of these
  // non-numbers) is suppressed with it.
  //
  // ⚠⚠ ...AND THE TABLE IT NAMES IS THE ONE SHE PLAYED ON (fix/wallet-and-wrapup, 05.08). Both
  // paragraphs above were written when a career had two tables and the ITF one was the destination;
  // the professional table arrived a day later (1560d25) and this line was never widened, so a W50/
  // W75/W100 player with no junior point in the window read «Unranked internationally – she has not
  // played a Junior Tour event yet», which is a sentence about a fourteen-year-old printed at a
  // twenty-one-year-old professional. Her junior rank in the owner's save is #74 and she is #288 in
  // the world; neither of those numbers is "unranked", and the junior one is not her season.
  //
  // `dominantTrackOfSeason` is the answer, `rankIn` is her place in that table (the same cache every
  // rank surface reads) and `kidPoints > 0` is the unchanged "unranked is not a number" rule applied
  // to the right table instead of always to the junior one.
  const rankTrack = dominantTrackOfSeason(world, yearStart, wrapWeek)
  const rankInTrack = kidPoints(world, rankTrack) > 0 ? rankIn(world, rankTrack) : null
  // v45 – WHAT THE SEASON COULD NOT DO, folded here and CAPTURED at each commit. The honesty of it is
  // in two places, and both were found the hard way.
  //
  // ⚠ THE `fromWeek` TEST. The ledger has been counting since `fromWeek`; the season being wrapped
  // begins at `yearStart`. If the ledger opened LATER – the only way being a save migrated mid-season,
  // because every other opening is a wrap three weeks before a season starts – then it holds part of a
  // season, and a part is not this season's statistic. There is no honest repair: the judgement is
  // about the book she held on each entry week, and `pruneResults` deleted those books weeks ago. So
  // the field is OMITTED, the card shows no line, and the season after this one is the first that can.
  // A ZERO WOULD HAVE BEEN THE WRONG SILENCE: "0 could not move her ranking" is a claim – the good news
  // – and printing it over a season nobody counted is the class of defect that reported "no tournaments
  // played" over a 44-19 record.
  //
  // ⚠ AND IT IS JUDGED AGAINST `rankTrack`, WHICH IS THE TABLE THE CARD ITSELF NAMES. Judged instead
  // against `activeLadderOf` at entry time, this printed «Final national rank #3» over «13 could not
  // move her ranking» – and all thirteen were the domestic events that had made her third. One card,
  // two tables. `entryCouldNotMove` takes the table as an argument so that cannot recur.
  const ledger = world.seasonEntries
  const entryMirror =
    ledger && ledger.fromWeek <= yearStart
      ? {
          entered: ledger.rows.length,
          couldNotMove: ledger.rows.filter((r) => entryCouldNotMove(r, rankTrack)).length,
        }
      : null
  // ⚠ THE MOVEMENT ARROW IS ITF-ONLY, AND THAT IS A LIMIT RATHER THAN AN OVERSIGHT.
  // `seasonStartRank` (v17) is one persisted number and it is the ITF rank – widening it to three
  // tracks is a schema change, and it cannot be back-filled because the rank AT the season's first
  // week needs the 52 weeks before it, which `pruneResults` deleted 49 weeks ago (the whole reason
  // v17 exists). Subtracting an ITF start rank from a professional end rank is the cross-currency
  // subtraction `prevRankIn` exists to forbid, so on any other track the season simply reports where
  // she finished and no arrow. Logged in docs/specs/wallet-and-wrapup.md as the one thing left open.
  const rankMove =
    rankTrack !== 'itf' || startRank === null || rankInTrack === null || startRank === rankInTrack
      ? ''
      : startRank > rankInTrack
        ? ` (↑${startRank - rankInTrack} vs season start)`
        : ` (↓${rankInTrack - startRank} vs season start)`
  const rankText =
    rankInTrack !== null
      ? `${LADDER_LABEL[rankTrack]} rank #${rankInTrack}${rankMove}`
      : `Unranked – ${LADDER_LABEL[rankTrack].toLowerCase()}`
  fireMilestone(
    world,
    `season-wrap-${seasonIndex}`,
    `Season ${displayYear} wrap-up: ${rankText} · ` +
      `${seasonPoints} pts this season · ${bestText} · ${wins}-${losses} (W-L) · funds ${fundsText}`,
  )
  // W4-SCHOOL: the same beat, minus the thing she no longer has. The off-season is still the three
  // weeks the family gets back; what fills them at fourteen and at twenty-two is not the same list.
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: schoolIsOver(world.week, world.profile.birthMonth)
      ? 'Off-season: rest, family time, and the block where next year gets built.'
      : 'Off-season: rest, school, family time.',
  })

  world.lastSeasonSummary = {
    seasonYear: displayYear,
    endRank: world.kidRank,
    startRank,
    points: seasonPoints,
    wins,
    losses,
    bestResultText: bestText,
    fundsDeltaCents,
    spentCents,
    earnedCents,
    weeksInjured,
    // v21: what the scholarship was actually worth this season. It exists nowhere else – the travel
    // half is a discount on the travel line, not an income row, so no window fold can recover it.
    // Read HERE, at week 49, which is after the year's last trip and before the review resets it.
    academyCoveredCents: world.academy?.coveredCents ?? 0,
    // fix/wallet-and-wrapup: WHICH table the season was played on, and her place in THAT one. Banked
    // rather than re-derived by the dialog, because `seasonRecord` – the evidence – is reset three
    // lines below, and because a summary is a record of what was true at the wrap. Both OPTIONAL and
    // both defaulted by every reader, which is the `weeksInjured` precedent: no schema bump.
    rankTrack,
    rankInTrack,
    // v45: what the season could NOT do – omitted entirely when the ledger did not cover the season.
    ...(entryMirror === null ? {} : { entryMirror }),
  }
  // R10-9: the same figures also APPEND to the career history (the summary above is overwritten
  // every year). Guarded on the season INDEX, so a re-entry for a season already banked is a no-op –
  // the append is idempotent exactly like the wrap-up milestone, whose key is the same index. This
  // guard is where the dropped season died; an index makes the collision unrepresentable.
  if (!world.seasonHistory.some((h) => h.seasonIndex === seasonIndex)) {
    world.seasonHistory.push({
      seasonIndex,
      endRank: world.kidRank,
      points: seasonPoints,
      wins,
      losses,
      // v46 – ...AND THE SAME SEASON TOLD APART BY TABLE. The four figures above are one ITF rank and
      // three folds, which is why the Stats screen showed the identical row under all three tabs for
      // two rounds running: there was nothing else in the record to show. See `SeasonHistoryEntry.byTrack`.
      //
      // ⚠ BANKED HERE OR GONE, the `spentCents` argument at a different ledger. Every term is a read of
      // something that decays: the points come off `world.results`, which `pruneResults` trims to a
      // rolling 52 weeks; the W-L comes off `world.seasonRecord`, which THIS FUNCTION resets nine lines
      // below. At the wrap the whole season is still inside both, and a week later it is not.
      //
      // ⚠ AND THE RANK USES THE WRAP-UP'S OWN "UNRANKED IS NOT A NUMBER" RULE, per table. `rankIn` always
      // returns a number – the tie floor when nobody in the table holds a point – so it is asked only
      // where `kidPoints > 0`, exactly as `rankInTrack` above is. Omitted otherwise, and the reader
      // prints silence: a place in a table she was never in is the class of claim that put «Rank #4» on
      // Home against «#128» in Stats.
      byTrack: seasonHistoryByTrack(world, yearStart, wrapWeek),
      fundsDeltaCents,
      endFundsCents: world.fundsCents,
      ...(bestFinish === null ? {} : { bestFinish }),
      // W7: ...and what the year actually COST, gross, which the net above cannot say. The owner:
      // «было бы очень интересно где-то хранить всю историю затрат за карьеру по годам». Both
      // numbers are already computed twenty lines up for the summary popup; the summary is
      // overwritten every year and this list is not, so this is where a career's spending history
      // survives. It has to be banked HERE because the ledger it comes from
      // (`world.financeWeeks`) is pruned to a 60-week window - by the time a player asks about
      // season 1, season 1's rows are gone and no surface can recompute them.
      spentCents,
      earnedCents,
    })
    // Bounded: a career this long is beyond the game's horizon, but the save must never grow
    // without a ceiling. Oldest seasons drop out first.
    if (world.seasonHistory.length > SEASON_HISTORY_CAP) {
      world.seasonHistory = world.seasonHistory.slice(-SEASON_HISTORY_CAP)
    }
  }
  // D10: the season's closing rank joins the durable ledger – one row per season, keyed on the
  // same index as the wrap-up milestone and the history row, so all three name the same season.
  captureMilestone(world, { type: 'season-rank', week: wrapWeek, seasonIndex, rank: world.kidRank })
  // The season that just wrapped is banked in the summary – start the next one clean. The per-ladder
  // pair resets WITH the totals it decomposes: they are the same season's matches counted twice, so a
  // reset that moved only one of them would make the invariant (`seasonRecord` sums to the totals)
  // false for a whole year, and that invariant is what the Stats screen's two figures rest on.
  world.seasonWins = 0
  world.seasonLosses = 0
  world.seasonRecord = emptySeasonRecord()
  // v45: ...and the entry ledger with them, from THIS week rather than from the next season's first.
  // Weeks 50 and 51 still take entries – for events in the season ahead, which is the season this
  // ledger is now counting – and `fromWeek` here is three weeks before that season starts, so the
  // "began at or before the first week" test above passes for it. Resetting at week 52 instead would
  // drop the off-season's own entries on the floor.
  world.seasonEntries = emptySeasonEntries(wrapWeek)
}

/** A zeroed entry ledger, opened at a stated week. Three callers, exactly as `emptySeasonRecord` has:
 *  the season reset above, `createWorld`, and the v45 migration – which needs the same shape from the
 *  week the old save happens to be sitting on. */
export function emptySeasonEntries(fromWeek: number): SeasonEntryLedger {
  return { fromWeek, rows: [] }
}

/** A zeroed per-ladder W-L, spelled once. Two callers – the season reset above and `createWorld` –
 *  and a third in the migration, which needs the same shape from a different starting point.
 *
 *  ⚠ THREE BUCKETS SINCE v30, and widening it WAS a schema step rather than a free derivation. Every
 *  other consumer of `LadderTrack` in this file re-folds from the results ledger on the next tick and
 *  therefore needed no migration (`kidRankWta` is the neighbouring example); this one is a persisted
 *  running total that only resets at a season boundary, so a save written before the third rung
 *  existed would carry a two-key object into a three-key type – and `record[track].wins++` in
 *  `finalizeTournament` would throw on `undefined` the first time she won a W15 match. */
export function emptySeasonRecord(): Record<LadderTrack, { wins: number; losses: number }> {
  return { domestic: { wins: 0, losses: 0 }, itf: { wins: 0, losses: 0 }, wta: { wins: 0, losses: 0 } }
}

/** A history row's per-track trio, copied a level deep for the snapshot (v46) – `copyTrophyLedger`'s
 *  job on a smaller record, and the same hazard: the values are objects, so the `{ ...h }` the season
 *  history is spread with would hand the UI three records the world is still writing into. */
export function copyByTrack(rows: Record<LadderTrack, SeasonTrackRow>): Record<LadderTrack, SeasonTrackRow> {
  const out = {} as Record<LadderTrack, SeasonTrackRow>
  for (const track of LADDER_TRACKS) out[track] = { ...rows[track] }
  return out
}

/** A career with nothing in the cabinet yet: every tier present, both arrays empty (v31).
 *
 *  Built off TIER_LADDER rather than written out, so a tenth rung is a cabinet shelf the day it is
 *  added to the ladder and not the day somebody remembers this function - the exact drift the
 *  hand-written `emptySeasonRecord` above had to be patched for when `LadderTrack` gained `wta`.
 *
 *  EVERY TIER, ALWAYS, rather than a `Partial` filled in on first use: the screen draws all
 *  eighteen trophies from week 0 (locked ones blurred - the reveal is the reward), so "absent" and
 *  "empty" would have to mean the same thing to every reader anyway. Exported for the migration,
 *  which needs the identical shape. */
export function emptyTrophyLedger(): Record<TierId, TierTrophies> {
  const shelves = {} as Record<TierId, TierTrophies>
  for (const tier of TIER_LADDER) shelves[tier] = { titles: [], finals: [] }
  return shelves
}

/** The cabinet as the SNAPSHOT carries it: every tier, both arrays copied.
 *
 *  A level deeper than `{ ...world.bestFinishByTier }` next to it, and that is the point - these
 *  values are arrays, so a shallow spread would hand the UI the very `titles`/`finals` objects
 *  `finalizeTournament` pushes onto. The snapshot is a message across the worker boundary, never a
 *  live view of engine state.
 *
 *  Walks TIER_LADDER rather than the stored keys, so a save whose migration predates a new rung
 *  still reports every shelf the screen expects to draw. */
export function copyTrophyLedger(world: WorldState): Record<TierId, TierTrophies> {
  const shelves = emptyTrophyLedger()
  for (const tier of TIER_LADDER) {
    const row = world.trophiesByTier?.[tier]
    if (row) shelves[tier] = { titles: [...row.titles], finals: [...row.finals] }
  }
  return shelves
}

// labels: moved to world/labels.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// medical: moved to world/medical.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.
