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
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS, TIER_LADDER } from '../season/calendar'
import { seasonYear } from '../../shared/dates'
import { milestoneKey } from '../diary'
import type { LadderTrack, TierId } from '../season/types'
import { LADDER_LABEL, type Milestone, type TierTrophies } from '../../shared/protocol'
import { addEvent, financeWindow, seasonIndexOf, seasonStartWeek } from './ledger'
import { KID_ID } from './constants'
import { finishLabel } from './labels'
import { kidPoints } from './ladder'
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
  const t = world.careerTotals
  if (!t || t.prizeCents <= t.spentCents) return
  captureMilestone(world, { type: 'break-even', week: world.week })
}

/** R10-9: how many finished seasons the career history keeps (newest wins). 30 years of junior/
 *  pro career is far past the game's horizon – the cap exists so the save has a hard ceiling. */
export const SEASON_HISTORY_CAP = 30

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
  // `weekYear(yearStart)`, the calendar year of the season's first Monday – and that value repeats:
  // 52 weeks is 364 days, so the opening Monday walks ~1.25 days earlier a year and steps back over
  // New Year at season 5. weekYear(208) and weekYear(260) are BOTH 2035, so when season 5 wrapped,
  // the `some(h => h.year === …)` guard below saw 2035 already banked (by season 4) and dropped
  // season 5's row on the floor. A whole season vanished from the Stats table at age 19.
  const seasonIndex = seasonIndexOf(world.week)
  const displayYear = seasonYear(seasonIndex)
  const yearStart = seasonStartWeek(world.week)
  const wrapWeek = world.week

  const inRange = (w: number) => w >= yearStart && w < wrapWeek

  const seasonPoints = world.results
    .filter((r) => r.playerId === KID_ID && inRange(r.week))
    .reduce((sum, r) => sum + r.points, 0)

  let bestFinish: number | null = null
  for (const e of world.events) {
    if (!inRange(e.week)) continue
    if (e.type === 'tournament' && e.finishIdx !== undefined) {
      if (bestFinish === null || e.finishIdx < bestFinish) bestFinish = e.finishIdx
    }
  }

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
  const rankMove =
    startRank === null || startRank === world.kidRank
      ? ''
      : startRank > world.kidRank
        ? ` (↑${startRank - world.kidRank} vs season start)`
        : ` (↓${world.kidRank - startRank} vs season start)`

  // R12-S2 (owner's screenshot): the row LABEL is already "Best result", so the value said
  // "best Champion". The value is the finish, and nothing else – "Champion" / "Runner-up" /
  // "Semifinalist". The no-tournaments phrasing is untouched: it is a sentence, not a finish.
  // Checked against every consumer: SeasonSummaryDialog's "Best result" row (the row this fixes),
  // the wrap-up milestone below (which reads as a bare clause between two others, and reads better
  // without the stray adjective), and the Stats season table – which never used this string at all,
  // it renders `bestFinish` through `finishLabel` itself. Summaries banked BEFORE this change keep
  // their stored wording, which is correct: a recap is a record of what was said.
  const bestText = bestFinish === null ? 'no tournaments played' : finishLabel(bestFinish)
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
  const rankedItf = kidPoints(world, 'itf') > 0
  const rankText = rankedItf ? `${LADDER_LABEL.itf} rank #${world.kidRank}${rankMove}` : `Unranked internationally`
  fireMilestone(
    world,
    `season-wrap-${seasonIndex}`,
    `Season ${displayYear} wrap-up: ${rankText} · ` +
      `${seasonPoints} pts this season · ${bestText} · ${wins}-${losses} (W-L) · funds ${fundsText}`,
  )
  addEvent(world, { week: world.week, type: 'info', text: 'Off-season: rest, school, family time.' })

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
