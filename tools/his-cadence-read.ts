/**
 * his-cadence-read – the owner's ENTRY CADENCE, read out of his own saves (detail/injury-arms,
 * owner ask 23.08: replay HIS style under recovery variant C).
 *
 * ⚠ READ-ONLY LAW (injury-saves-read.ts's own): saves are personal, handed in on the command line,
 * read through the game's import door (`decodeExportFile`), NEVER copied, committed or fixtured.
 * The repo keeps the DERIVED statistics printed here, recorded in
 * docs/specs/the-injury-landscape-2026-08.md §7 – never the careers.
 *
 * WHAT IS GENUINELY DERIVABLE, and from where – each save is a WorldState, so history is bounded
 * by the engine's own pruning; multiple snapshots per career widen the coverage:
 *   - play weeks + tiers:  `world.results` (KID rows, 52-week rolling window per snapshot) – the
 *                          entry cadence: events/season, rest gaps between events, tier mix.
 *   - play weeks, deeper:  `world.events` match rows (cap 400, her matches pruned LAST, so the
 *                          match feed reaches years back on a played career) – gaps only, no tier.
 *   - vacations:           `world.financeWeeks` 'vacation' rows (60-week window per snapshot).
 *   - onsets/weeks lost:   `injuryHistory` rows carry `week`; `careerTotals.weeksLostToInjury` is
 *                          monotone (v40) – snapshot DELTAS of the same career are exact for weeks
 *                          lost and exact for onsets while the interval is inside the 20-row prune
 *                          reach (flagged '>=' when it is not).
 *   - era boundary:        first `seasonHistory` row whose `byTrack.wta` shows any activity.
 *
 * WHAT IS NOT DERIVABLE – stated rather than invented (the ask's own law):
 *   - CONDITION AT ENTRY: no historical condition series exists anywhere in a save. The condition
 *     threshold his style respected is therefore CALIBRATED (his-cadence-probe validates the
 *     encoded policy against his measured landscape under base 8), never read.
 *   - vacations beyond each 60-week finance window; entry TIERS beyond each 52-week results window.
 *
 * Run: npx vite-node tools/his-cadence-read.ts -- --save /path/a.tsave [--save /path/b.tsave ...]
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import { activeLadderOf, KID_ID } from '../src/engine/world'
import { coachById, tierOf } from '../src/engine/coach'
import { ageAtWeek } from '../src/engine/world'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const args = process.argv.slice(2)
const savePaths: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePaths.push(args[++i])
if (savePaths.length === 0) {
  console.error('usage: npx vite-node tools/his-cadence-read.ts -- --save /path/a.tsave [...]')
  process.exit(1)
}

const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

interface Snap {
  career: string
  week: number
  ladder: string
  plan: string
  physio: boolean
  masseur: boolean
  /** KID play weeks in the results window, ascending, with tier (52w reach) */
  resultWeeks: { week: number; tier: string }[]
  /** distinct weeks holding a non-friendly KID match event (the deep feed), ascending */
  matchWeeks: number[]
  /** weeks with a vacation expense in the finance ledger (60w reach) */
  vacationWeeks: number[]
  financeFrom: number
  injuryRows: { week: number; weeksOut: number }[]
  injuryPruned: boolean
  weeksLostTotal: number
  /** per-season wins+losses off seasonHistory (exact, never pruned) */
  seasonMatches: Map<number, number>
  /** first season index with any WTA-track activity, or null.
   *  ⚠ AN ARTIFACT-PRONE READ: rows banked before schema v46 carry no `byTrack` and none can be
   *  invented, so on an old career this reads as "the first season banked after v46 shipped", not
   *  the true pro debut. `firstWtaResultWeek` below is the honest floor. */
  firstProSeason: number | null
  /** earliest week in the results window holding a W/WTA-track tier – direct evidence the pro era
   *  had begun by then, immune to the byTrack migration artifact */
  firstWtaResultWeek: number | null
  coachTier: string
  potentialMean: number
  skillsMean: number
}

const snaps: Snap[] = []
for (const path of savePaths) {
  const world = await decodeExportFile(new Uint8Array(readFileSync(path)))
  const name = basename(path).replace('.tsave', '').replace('tennis-sim_', '')
  const career = name.replace(/_w\d+$/, '')
  const resultWeeks = world.results
    .filter((r) => r.playerId === KID_ID)
    .map((r) => ({ week: r.week, tier: r.tier as string }))
    .sort((a, b) => a.week - b.week)
  const matchWeeks = [
    ...new Set(
      world.events
        .filter((e) => e.match !== undefined && !e.friendly && (e.match.aId === KID_ID || e.match.bId === KID_ID))
        .map((e) => e.week),
    ),
  ].sort((a, b) => a - b)
  const fw = world.financeWeeks ?? []
  const vacationWeeks = fw.filter((w) => (w.byCategory.vacation ?? 0) < 0).map((w) => w.week)
  const seasonMatches = new Map<number, number>()
  let firstProSeason: number | null = null
  for (const s of world.seasonHistory ?? []) {
    seasonMatches.set(s.seasonIndex, s.wins + s.losses)
    const wta = s.byTrack?.wta
    if (wta && (wta.points > 0 || wta.wins + wta.losses > 0) && firstProSeason === null) firstProSeason = s.seasonIndex
  }
  const mean = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0) / Object.values(o).length
  const wtaWeeks = resultWeeks.filter((r) => TIERS[r.tier as keyof typeof TIERS]?.track === 'wta').map((r) => r.week)
  snaps.push({
    career,
    week: world.week,
    ladder: activeLadderOf(world),
    plan: `${world.plan.train}/${world.plan.rest}`,
    physio: world.physioActive,
    masseur: world.masseurHired ?? false,
    resultWeeks,
    matchWeeks,
    vacationWeeks,
    financeFrom: fw.length > 0 ? fw[0].week : world.week,
    injuryRows: (world.injuryHistory ?? []).map((h) => ({ week: h.week, weeksOut: h.weeksOut })),
    injuryPruned: (world.injuryHistory ?? []).length >= 20,
    weeksLostTotal: world.careerTotals?.weeksLostToInjury ?? 0,
    seasonMatches,
    firstProSeason,
    firstWtaResultWeek: wtaWeeks.length > 0 ? wtaWeeks[0] : null,
    coachTier: tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)),
    potentialMean: mean(world.potential as unknown as Record<string, number>),
    skillsMean: mean(world.skills as unknown as Record<string, number>),
  })
}
snaps.sort((a, b) => (a.career === b.career ? a.week - b.week : a.career.localeCompare(b.career)))

// --- per-snapshot table --------------------------------------------------------
console.log('PER SNAPSHOT (each save carries its own pruned windows)')
console.log(
  pad('save', 18) + padL('week', 6) + padL('ladder', 9) + padL('plan', 7) + padL('phys', 5) + padL('mass', 5) +
    padL('coach', 8) + padL('resWin evts', 12) + padL('ev/season', 10) + padL('matchFeed span', 15) + padL('pot', 5) + padL('skill', 6),
)
for (const s of snaps) {
  const rw = s.resultWeeks
  const span = rw.length > 1 ? rw[rw.length - 1].week - rw[0].week : 0
  const perSeason = span > 0 ? ((rw.length - 1) * WEEKS_PER_YEAR) / span : 0
  const mw = s.matchWeeks
  console.log(
    pad(`${s.career}_w${s.week}`, 18) + padL(s.week, 6) + padL(s.ladder, 9) + padL(s.plan, 7) +
      padL(s.physio ? 'on' : 'off', 5) + padL(s.masseur ? 'yes' : 'no', 5) + padL(s.coachTier, 8) + padL(rw.length, 12) +
      padL(perSeason.toFixed(1), 10) + padL(mw.length > 0 ? `${mw[0]}..${mw[mw.length - 1]}` : '-', 15) +
      padL(s.potentialMean.toFixed(0), 5) + padL(s.skillsMean.toFixed(0), 6),
  )
  if (args.includes('--tiers')) {
    const t = new Map<string, number>()
    for (const r of rw) t.set(r.tier, (t.get(r.tier) ?? 0) + 1)
    console.log('    tiers: ' + [...t.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '))
  }
}

// --- the cadence, pooled with dedupe -------------------------------------------
// Overlapping windows of one career see the same weeks; dedupe by (career, week) so a week is
// counted once however many snapshots retained it.
const careers = [...new Set(snaps.map((s) => s.career))]
const gapHist = new Map<number, number>()
let pooledPlayWeeks = 0
let pooledSpan = 0
const tierCount = new Map<string, number>()
let vacWeeks = 0
let vacSpan = 0
for (const c of careers) {
  const mine = snaps.filter((s) => s.career === c)
  // deep feed: the union of match-event weeks + results weeks = every play week any snapshot kept
  const play = [...new Set(mine.flatMap((s) => [...s.matchWeeks, ...s.resultWeeks.map((r) => r.week)]))].sort(
    (a, b) => a - b,
  )
  pooledPlayWeeks += play.length
  if (play.length > 1) pooledSpan += play[play.length - 1] - play[0]
  for (let i = 1; i < play.length; i++) {
    // a gap across two disjoint snapshot windows is a fact about pruning, not about rest – cap the
    // histogram read at gaps that fit inside one results window
    const g = play[i] - play[i - 1]
    if (g <= 26) gapHist.set(g, (gapHist.get(g) ?? 0) + 1)
  }
  const tierSeen = new Set<string>()
  for (const s of mine) {
    for (const r of s.resultWeeks) {
      const key = `${r.week}`
      if (tierSeen.has(key)) continue
      tierSeen.add(key)
      tierCount.set(r.tier, (tierCount.get(r.tier) ?? 0) + 1)
    }
  }
  // vacations: dedupe finance windows the same way
  const vac = [...new Set(mine.flatMap((s) => s.vacationWeeks))]
  const covered = new Set<number>()
  for (const s of mine) for (let w = s.financeFrom; w <= s.week; w++) covered.add(w)
  vacWeeks += vac.length
  vacSpan += covered.size
}
console.log('\nTHE CADENCE (pooled, deduped by career+week; gaps read only inside one snapshot window)')
console.log(
  `  play weeks retained ${pooledPlayWeeks} over ${(pooledSpan / WEEKS_PER_YEAR).toFixed(1)} seasons of span` +
    ` -> events/season ${((pooledPlayWeeks / Math.max(1, pooledSpan)) * WEEKS_PER_YEAR).toFixed(1)}`,
)
const gaps = [...gapHist.entries()].sort((a, b) => a[0] - b[0])
const gapTotal = gaps.reduce((a, [, n]) => a + n, 0)
const gapSum = gaps.reduce((a, [g, n]) => a + g * n, 0)
console.log(
  `  rest gap between events: mean ${(gapSum / Math.max(1, gapTotal)).toFixed(2)}w over ${gapTotal} gaps · ` +
    `histogram ${gaps.map(([g, n]) => `${g}w:${n}`).join(' ')}`,
)
console.log(
  `  share back-to-back (gap 1w) ${((100 * (gapHist.get(1) ?? 0)) / Math.max(1, gapTotal)).toFixed(0)}%` +
    ` · gap 2w ${((100 * (gapHist.get(2) ?? 0)) / Math.max(1, gapTotal)).toFixed(0)}%` +
    ` · gap >=3w ${((100 * gaps.filter(([g]) => g >= 3).reduce((a, [, n]) => a + n, 0)) / Math.max(1, gapTotal)).toFixed(0)}%`,
)
console.log(
  `  tier mix (52w results windows only): ${[...tierCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t} ${n}`)
    .join(' · ')}`,
)
console.log(
  `  vacations: ${vacWeeks} vacation-billed weeks over ${(vacSpan / WEEKS_PER_YEAR).toFixed(1)} seasons of finance window` +
    ` -> ${((vacWeeks / Math.max(1, vacSpan)) * WEEKS_PER_YEAR).toFixed(1)}/season`,
)
console.log('  CONDITION AT ENTRY: not in any save (no historical condition series exists) – NOT derivable, calibrated instead.')

// --- era split + snapshot deltas ----------------------------------------------
/** The pro boundary: the EARLIEST evidence wins – a W-track result week seen in any snapshot's
 *  52-week window (direct, artifact-free) vs the byTrack season (which on an old career only says
 *  when v46 started recording). Reported per career so the spec can cite it. */
function proBoundaryOf(c: string): number {
  const mine = snaps.filter((s) => s.career === c)
  const byTrackSeason = mine.map((s) => s.firstProSeason).find((x) => x !== null)
  const byTrackWeek = byTrackSeason !== null && byTrackSeason !== undefined ? byTrackSeason * WEEKS_PER_YEAR : Infinity
  const evidence = Math.min(...mine.map((s) => s.firstWtaResultWeek ?? Infinity))
  return Math.min(byTrackWeek, evidence)
}

console.log('\nPER CAREER: the pro-era boundary and the snapshot-delta injury read')
for (const c of careers) {
  const mine = snaps.filter((s) => s.career === c)
  const last = mine[mine.length - 1]
  const pro = proBoundaryOf(c)
  console.log(
    `  ${c}: pro era from week <=${Number.isFinite(pro) ? pro : 'never'} ` +
      `(byTrack says season ${mine.map((s) => s.firstProSeason).find((x) => x !== null) ?? 'n/a'}, earliest W-track result w${
        Math.min(...mine.map((s) => s.firstWtaResultWeek ?? Infinity))
      }), ${mine.length} snapshots to w${last.week}, weeksLost total ${last.weeksLostTotal}`,
  )
  for (let i = 1; i < mine.length; i++) {
    const a = mine[i - 1]
    const b = mine[i]
    const rows = b.injuryRows.filter((r) => r.week > a.week && r.week <= b.week)
    const oldestKept = b.injuryRows.length > 0 ? b.injuryRows[0].week : b.week
    const exact = !b.injuryPruned || oldestKept <= a.week
    const dSeasons = (b.week - a.week) / WEEKS_PER_YEAR
    const dLost = b.weeksLostTotal - a.weeksLostTotal
    let dMatches = 0
    for (const [si, m] of b.seasonMatches) if (!a.seasonMatches.has(si)) dMatches += m
    console.log(
      `    w${a.week}->w${b.week} (${dSeasons.toFixed(1)}s): onsets ${exact ? '' : '>='}${rows.length}` +
        ` (${(rows.length / dSeasons).toFixed(2)}/season), weeksLost +${dLost} (${(dLost / dSeasons).toFixed(2)}/season)` +
        `, banked matches +${dMatches}`,
    )
  }
}

// --- the era-true injury rate (the validation target for his-cadence-probe) ----
// Pool ONLY the intervals whose onset count is exact, split at each career's pro boundary week.
let proOnsets = 0
let proSeasons = 0
let proLost = 0
let jrOnsets = 0
let jrSeasons = 0
let jrLost = 0
for (const c of careers) {
  const mine = snaps.filter((s) => s.career === c)
  const proWeek = proBoundaryOf(c)
  // interval 0: career start (week 0) -> first snapshot, exact while the first snapshot's history
  // is unpruned (a career's first 20 onsets are all still there)
  const intervals: { a: number; b: number; onsets: number; lost: number; exact: boolean }[] = []
  const first = mine[0]
  intervals.push({
    a: 0,
    b: first.week,
    onsets: first.injuryRows.length,
    lost: first.weeksLostTotal,
    exact: !first.injuryPruned,
  })
  for (let i = 1; i < mine.length; i++) {
    const a = mine[i - 1]
    const b = mine[i]
    const rows = b.injuryRows.filter((r) => r.week > a.week && r.week <= b.week)
    const oldestKept = b.injuryRows.length > 0 ? b.injuryRows[0].week : b.week
    intervals.push({
      a: a.week,
      b: b.week,
      onsets: rows.length,
      lost: b.weeksLostTotal - a.weeksLostTotal,
      exact: !b.injuryPruned || oldestKept <= a.week,
    })
  }
  for (const iv of intervals) {
    if (!iv.exact) continue
    // an interval straddling the boundary is split pro-rata on WEEKS for the lost column and by
    // onset week (we have each onset's week) for the onset column
    const mineSnap = mine.find((s) => s.week === iv.b)!
    const rowsIn = mineSnap.injuryRows.filter((r) => r.week > iv.a && r.week <= iv.b)
    const proW = Math.max(0, iv.b - Math.max(iv.a, proWeek))
    const jrW = iv.b - iv.a - proW
    const proO = iv.a >= proWeek ? iv.onsets : rowsIn.filter((r) => r.week >= proWeek).length
    jrOnsets += iv.onsets - proO
    proOnsets += proO
    proSeasons += proW / WEEKS_PER_YEAR
    jrSeasons += jrW / WEEKS_PER_YEAR
    proLost += iv.b - iv.a > 0 ? (iv.lost * proW) / (iv.b - iv.a) : 0
    jrLost += iv.b - iv.a > 0 ? (iv.lost * jrW) / (iv.b - iv.a) : 0
  }
}
console.log('\nERA-TRUE RATES over the EXACT intervals only (the his-cadence-probe validation target):')
console.log(
  `  junior era: ${jrOnsets} onsets / ${jrSeasons.toFixed(1)} seasons = ${(jrOnsets / Math.max(0.01, jrSeasons)).toFixed(2)}/season` +
    ` · weeks lost ${(jrLost / Math.max(0.01, jrSeasons)).toFixed(2)}/season`,
)
console.log(
  `  pro era:    ${proOnsets} onsets / ${proSeasons.toFixed(1)} seasons = ${(proOnsets / Math.max(0.01, proSeasons)).toFixed(2)}/season` +
    ` · weeks lost ${(proLost / Math.max(0.01, proSeasons)).toFixed(2)}/season`,
)
