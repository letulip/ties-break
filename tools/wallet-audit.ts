// THE WALLET AUDIT - what the money screens PRINT against what the durable ledgers HOLD.
//
//   npx vite-node tools/wallet-audit.ts [--weeks N] [--seed S] [--from N] [--verbose]
//
// WHY IT EXISTS. The owner played into season 8 (week 412) and the wallet read zero on every
// screen except Home: «Что-то сломалось в кошельке в конце сезона, не видно вообще никаких доходов
// ни на каком экране, кроме Home. В турнирах пишут ноль, в week recap тоже, в самом ledger на
// вкладке расходов вообще нет транзакций.» The same wrap-up card said "no tournaments played" over
// a 44-19 record. Neither is a money bug: `financeWeeks`, `careerTotals` and `results` are all
// correct in his save. It is a READ bug, and this tool measures it.
//
// WHAT IT MEASURES, per week and per season, on a real greedy career. Every row prints what the
// SHIPPED code answers beside what the PRE-FIX code would have answered, so the tool is both the
// reproduction and the regression watch:
//   * the composition of `world.events` - kept / radar-evidence / ordinary - against EVENTS_CAP;
//   * what WeekRecapCard shows for the week (the durable `snapshot.finance.weekly12` row) against
//     the old fold of `snapshot.events`;
//   * how many transactions the Money screen's ledger tab is handed (`snapshot.financialEvents`);
//   * at every wrap-up, the BANKED best result against what `world.results` can prove she did and
//     against the old scrape of the event feed;
//   * and which ladder the wrap-up's rank line names against the one she actually played on.
//
// THE MECHANISM IT IS POINTED AT. `pruneEvents` used to trim BY CLASS and not by age: every ordinary
// row went before the first kid match did. Ordinary rows are a FLOW (2-6 every week, for ever) and
// her match rows are a STOCK the pruner protected, so the protected class grew monotonically until
// it filled the cap on its own. From that week on `rest` was empty on every single tick and 100% of
// the money rows were evicted the moment they were written - including the ones the running tick had
// just written. It was not that old money got pruned; new money never survived its own week. There
// is an ordinary-news floor now (EVENTS_ORDINARY_FLOOR) and the money screens are off the feed
// entirely; this tool is what says both are still true a decade into a career.
//
// MEASUREMENT ONLY: every entry, tick and reveal goes through the same public engine commands the
// UI uses, and every "what the screen shows" figure is read off a real `toSnapshot`.
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  toSnapshot,
  seasonIndexOf,
  seasonStartWeek,
  kidPoints,
  recomputeKidRank,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { EVENTS_CAP, SNAPSHOT_FINANCIAL_EVENTS } from '../src/engine/world/constants'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { seasonYear } from '../src/shared/dates'
import { finishLabel } from '../src/engine/world/labels'
import type { LadderTrack, TierId } from '../src/engine/season/types'
import type { Snapshot, WorldEvent } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const argStr = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const WEEKS = argOf('weeks', 9 * WEEKS_PER_YEAR) // nine seasons - the owner is in his eighth
const FROM = argOf('from', 0) // first week to print a row for
const SEED = argStr('seed', 'wallet-audit')
const VERBOSE = args.includes('--verbose')

// `isRadarEvidence` is private to world.ts; this is its definition, restated so the audit can
// classify the feed the same way the pruner does. If the two ever disagree the numbers below stop
// meaning anything, so it is spelled out rather than approximated.
const isEvidence = (e: WorldEvent): boolean =>
  e.match !== undefined && !e.friendly && (e.match.aId === KID_ID || e.match.bId === KID_ID)

/** THE LEGACY WeekRecapCard FINANCES card, kept as the BUG'S OWN WITNESS: a scrape of the
 *  snapshot's event window, which is what the card folded until fix/wallet-and-wrapup. */
function legacyRecapMoney(snap: Snapshot): { incomeCents: number; expenseCents: number } {
  const weekEvents = snap.events.filter((e) => e.week === snap.week)
  return {
    incomeCents: weekEvents.filter((e) => e.type === 'income').reduce((s, e) => s + (e.amountCents ?? 0), 0),
    expenseCents: weekEvents.filter((e) => e.type === 'expense').reduce((s, e) => s + (e.amountCents ?? 0), 0),
  }
}

/** WHAT THE CARD READS NOW, verbatim: the week's row of the durable per-category ledger, which the
 *  snapshot already carries as a dense series for the Home budget chart. */
function recapCardMoney(snap: Snapshot): { incomeCents: number; expenseCents: number } {
  const row = snap.finance.weekly12.find((p) => p.week === snap.week)
  return { incomeCents: row?.incomeCents ?? 0, expenseCents: row?.expenseCents ?? 0 }
}

/** `maybeFireSeasonWrapUp`'s best-result scrape, verbatim: the capped, class-pruned event feed. */
function wrapUpBestFinishFromEvents(world: WorldState, fromWeek: number, toWeek: number): number | null {
  let best: number | null = null
  for (const e of world.events) {
    if (e.week < fromWeek || e.week >= toWeek) continue
    if (e.type === 'tournament' && e.finishIdx !== undefined) {
      if (best === null || e.finishIdx < best) best = e.finishIdx
    }
  }
  return best
}

/** THE DURABLE ANSWER: her counting results for the season, inverted through the tier's own points
 *  table. `world.results` prunes on TIME (52 weeks) and the wrap fires at yearStart + 49, so every
 *  row of the season it is about is still there by construction. */
function bestFinishFromResults(world: WorldState, fromWeek: number, toWeek: number): number | null {
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

/** WHICH TABLE SHE ACTUALLY PLAYED ON THIS SEASON - counted off the same result rows. */
function seasonTrackTally(world: WorldState, fromWeek: number, toWeek: number): Record<LadderTrack, number> {
  const tally: Record<LadderTrack, number> = { domestic: 0, itf: 0, wta: 0 }
  for (const r of world.results) {
    if (r.playerId !== KID_ID || r.week < fromWeek || r.week >= toWeek) continue
    if (!r.tier) continue
    tally[TIERS[r.tier].track]++
  }
  return tally
}

// --- the driver ----------------------------------------------------------------------------------
// A greedy strongest-first career, one entry a week, funds kept solvent so the wallet gate can
// never be the reason she stays home. This is the boredom-guard idiom and it is the only way to
// reach professional VOLUME - the thing every long test in the suite is missing.
const world = createWorld(SEED)
const rng = rngFromSeed(world.seed)
const strongestFirst = [...TIER_LADDER].reverse() as TierId[]

interface WeekRow {
  week: number
  kept: number
  evidence: number
  rest: number
  total: number
  legacyIncome: number
  legacyExpense: number
  cardIncome: number
  cardExpense: number
  ledgerRows: number
  financialEvents: number
  matchRows: number
}
const rows: WeekRow[] = []
interface SeasonRow {
  seasonIndex: number
  year: number
  scrapeFinish: number | null
  bankedBestText: string
  resultsFinish: number | null
  wins: number
  losses: number
  tally: Record<LadderTrack, number>
  legacyRankText: string
  bankedTrack: LadderTrack
  bankedRank: number | null
  playedTrack: LadderTrack
  playedRank: number | null
  feedTotal: number
  feedRest: number
}
const seasons: SeasonRow[] = []

for (let i = 0; i < WEEKS; i++) {
  // ⚠ CAPTURED BEFORE THE TICK: `maybeFireSeasonWrapUp` runs inside `tickWeek` and resets
  // `seasonRecord` as its last act, so reading it after the wrap tick returns zeroes. The wrap
  // fires on the first off-season week and nothing is played in one, so this IS the season's record.
  const record = world.seasonRecord
  const recordBefore: Record<LadderTrack, number> = {
    domestic: (record?.domestic.wins ?? 0) + (record?.domestic.losses ?? 0),
    itf: (record?.itf.wins ?? 0) + (record?.itf.losses ?? 0),
    wta: (record?.wta.wins ?? 0) + (record?.wta.losses ?? 0),
  }
  world.fundsCents = Math.max(world.fundsCents, 5_000_00)
  if (world.condition >= 30) {
    for (const tier of strongestFirst) {
      const e = world.season.find(
        (x) =>
          x.tier === tier &&
          x.deadlineWeek >= world.week &&
          x.deadlineWeek - world.week <= 2 &&
          !world.entries.includes(x.id) &&
          !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
      )
      if (!e) continue
      try {
        enterEvent(world, e.id)
        break
      } catch {
        /* the gate said no - try the rung below */
      }
    }
  }
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }

  // THE WRAP-UP WEEK, read the moment the engine has written it (the tick above fired it).
  if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) {
    const seasonIndex = seasonIndexOf(world.week)
    const yearStart = seasonStartWeek(world.week)
    const tally = seasonTrackTally(world, yearStart, world.week)
    const snap = toSnapshot(world)
    const summary = world.lastSeasonSummary!
    // THE LADDER SHE ACTUALLY PLAYED ON, counted from the per-track MATCH record so it is the same
    // unit the engine's own rule uses. `tally` below is the per-track count of RESULT ROWS, which is
    // a different (award-only) measure and is printed beside it.
    const played = (Object.keys(recordBefore) as LadderTrack[]).reduce((a, b) =>
      recordBefore[b] > recordBefore[a] ? b : a,
    )
    seasons.push({
      seasonIndex,
      year: seasonYear(seasonIndex),
      scrapeFinish: wrapUpBestFinishFromEvents(world, yearStart, world.week),
      bankedBestText: summary.bestResultText,
      resultsFinish: bestFinishFromResults(world, yearStart, world.week),
      wins: summary.wins,
      losses: summary.losses,
      tally,
      // The pre-fix rank line, as the bug's own witness.
      legacyRankText:
        kidPoints(world, 'itf') > 0 ? `International #${world.kidRank}` : 'Unranked internationally',
      bankedTrack: summary.rankTrack ?? 'itf',
      bankedRank: summary.rankInTrack ?? null,
      playedTrack: played,
      playedRank: snap.ladders[played].rank,
      feedTotal: world.events.length,
      feedRest: world.events.filter((e) => !e.keep && !isEvidence(e)).length,
    })
  }

  const snap = toSnapshot(world)
  const card = recapCardMoney(snap)
  const legacy = legacyRecapMoney(snap)
  rows.push({
    week: world.week,
    kept: world.events.filter((e) => e.keep).length,
    evidence: world.events.filter((e) => !e.keep && isEvidence(e)).length,
    rest: world.events.filter((e) => !e.keep && !isEvidence(e)).length,
    total: world.events.length,
    legacyIncome: legacy.incomeCents,
    // `legacyRecapMoney` sums the engine's signed-negative expense rows; `cardExpense` is a
    // magnitude off `financeSeries`. Negated here so the two columns are the same unit.
    legacyExpense: -legacy.expenseCents,
    cardIncome: card.incomeCents,
    cardExpense: card.expenseCents,
    ledgerRows: world.financeWeeks.filter((f) => f.week === world.week).length,
    financialEvents: snap.financialEvents.length,
    matchRows: snap.events.filter((e) => e.week === snap.week && e.type === 'match').length,
  })
}
recomputeKidRank(world)

// --- the report ----------------------------------------------------------------------------------
const money = (cents: number) => `$${(cents / 100).toFixed(0)}`
console.log(`WALLET AUDIT - seed '${SEED}', ${WEEKS} weeks, greedy strongest-first entries`)
console.log(`EVENTS_CAP = ${EVENTS_CAP}\n`)

console.log('THE FEED, and how its three classes divide the cap:')
console.log('  week | kept  evid  rest  total | card in/out         | legacy scrape       | ledgerTx | match rows')
for (const r of rows) {
  if (r.week < FROM) continue
  if (!VERBOSE && r.week % 13 !== 0 && r.rest !== 0) continue
  const flag = r.legacyIncome !== r.cardIncome || r.legacyExpense !== r.cardExpense ? '  <- FEED LIES' : ''
  console.log(
    `  ${String(r.week).padStart(4)} | ${String(r.kept).padStart(4)} ${String(r.evidence).padStart(5)} ` +
      `${String(r.rest).padStart(5)} ${String(r.total).padStart(5)} | ` +
      `${(money(r.cardIncome) + ' / ' + money(-r.cardExpense)).padEnd(19)} | ` +
      `${(money(r.legacyIncome) + ' / ' + money(r.legacyExpense)).padEnd(19)} | ` +
      `${String(r.financialEvents).padStart(8)} | ${r.matchRows}${flag}`,
  )
}

const firstZeroRest = rows.find((r) => r.rest === 0)
const firstEmptyLedgerTab = rows.find((r) => r.financialEvents === 0 && r.week > 0)
// The card now reads the ledger, so the interesting quantity is how far the LEGACY fold has drifted
// from it – i.e. how wrong the screen would be if anyone put it back on the feed.
const drifted = rows.filter((r) => r.legacyIncome !== r.cardIncome || r.legacyExpense !== r.cardExpense)

console.log('\n(A) THE WALLET')
console.log(`  weeks where the legacy event-feed fold drifts from the durable ledger: ${drifted.length} of ${rows.length}`)
if (drifted[0]) {
  console.log(
    `  first at week ${drifted[0].week} (${weekName(drifted[0].week)}): feed would say ` +
      `${money(drifted[0].legacyIncome)} / ${money(-drifted[0].legacyExpense)}, ledger says ` +
      `${money(drifted[0].cardIncome)} / ${money(-drifted[0].cardExpense)}`,
  )
}
// The floors are only meaningful once the feed is FULL - a week-3 career has four events in it.
const saturated = rows.filter((r) => r.kept + r.evidence >= EVENTS_CAP - 150)
if (firstZeroRest) {
  console.log(
    `  first week the ordinary class is COMPLETELY evicted: ${firstZeroRest.week} ` +
      `(${weekName(firstZeroRest.week)}) - kept ${firstZeroRest.kept} + evidence ${firstZeroRest.evidence} ` +
      `= ${firstZeroRest.kept + firstZeroRest.evidence} of ${EVENTS_CAP}`,
  )
} else {
  console.log(
    `  the ordinary class NEVER empties (the floor holds) - min rest over the ${saturated.length} ` +
      `saturated weeks: ${Math.min(...saturated.map((r) => r.rest))}`,
  )
}
console.log(
  firstEmptyLedgerTab
    ? `  first week the Money ledger tab is handed ZERO transactions: ${firstEmptyLedgerTab.week} (${weekName(firstEmptyLedgerTab.week)})`
    : `  the Money ledger tab always has transactions - min over the saturated weeks: ` +
      `${Math.min(...saturated.map((r) => r.financialEvents))} of ${SNAPSHOT_FINANCIAL_EVENTS}`,
)

console.log('\n(B) THE SEASON WRAP-UP - best result')
console.log('  season | year | BANKED (shipped)   | results-ledger     | events-scrape      | W-L')
for (const s of seasons) {
  const scrape = s.scrapeFinish === null ? 'no tournaments played' : finishLabel(s.scrapeFinish)
  const truth = s.resultsFinish === null ? 'no counting result' : finishLabel(s.resultsFinish)
  const flag = s.bankedBestText !== truth ? '   <- BANKED WRONG' : scrape !== truth ? '   (feed would lie)' : ''
  console.log(
    `  ${String(s.seasonIndex).padStart(6)} | ${s.year} | ${s.bankedBestText.padEnd(18)} | ${truth.padEnd(18)} | ` +
      `${scrape.padEnd(18)} | ${String(s.wins).padStart(2)}-${String(s.losses).padEnd(2)}${flag}`,
  )
}

console.log('\n(C) THE SEASON WRAP-UP - the rank line')
console.log('  season | year | played dom/itf/wta | BANKED (shipped)      | legacy line')
for (const s of seasons) {
  const banked = s.bankedRank === null ? `Unranked – ${s.bankedTrack}` : `${s.bankedTrack} #${s.bankedRank}`
  const flag = s.bankedTrack !== s.playedTrack ? '   <- WRONG TABLE' : ''
  console.log(
    `  ${String(s.seasonIndex).padStart(6)} | ${s.year} | ` +
      `${String(s.tally.domestic).padStart(3)}/${String(s.tally.itf).padStart(3)}/${String(s.tally.wta).padStart(3)}        | ` +
      `${banked.padEnd(21)} | ${s.legacyRankText}${flag}`,
  )
}

function weekName(week: number): string {
  return `W${(week % WEEKS_PER_YEAR) + 1} ${seasonYear(seasonIndexOf(week))}`
}
