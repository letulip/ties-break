/**
 * his-careers-brackets – the owner's five careers read as CONSECUTIVE SNAPSHOT PAIRS, and as an
 * exact per-season panel (detail/measure-his-careers, owner ask 24.08: «померять дозу травм на
 * моделировании моих сейвов»).
 *
 * ⚠ READ-ONLY LAW, inherited verbatim from tools/injury-saves-read.ts and tools/his-cadence-read.ts:
 * the saves are personal, handed in on the command line, read through the game's own import door
 * (`decodeExportFile`, i.e. the real `migrateSave` path), and NEVER copied, committed or fixtured.
 * The repo keeps only the DERIVED statistics, recorded in
 * docs/specs/the-injury-landscape-2026-08.md §9.
 *
 * ⚠ IT DOES NOT REPEAT WHAT THE TWO EXISTING READERS ALREADY ANSWER. `injury-saves-read` owns the
 * per-save landscape row; `his-cadence-read` owns the entry cadence, the gap histogram, the
 * vacation rate and the era-true rate over exact intervals. This tool answers the one question
 * neither can: what a PAIR of consecutive snapshots of one career brackets – a real stretch of his
 * play with a known start and a known end – and what an EXACT per-season panel says about the
 * onset rate once the era and the engine version are both controlled for.
 *
 * WHAT IS GENUINELY DERIVABLE HERE, and why each source is exact:
 *   - `seasonHistory` IS NEVER PRUNED (measured: every save carries rows from seasonIndex 0). Each
 *     row is exact for matches (wins+losses), end rank, points and the season's funds delta.
 *   - `injuryHistory` prunes at 20 rows; the deepest career in this sample holds 11, so EVERY onset
 *     of every career is present with its week, severity, weeksOut and kind. The tool asserts this
 *     rather than assuming it, and degrades to a floor if a future save exceeds the cap.
 *   - `careerTotals` (prizeCents, earnedCents, spentCents, weeksLostToInjury) is monotone.
 *   - the ERA gate is the one variant C uses: `activeLadderOf(world) === 'wta'`, which latches on
 *     `bestFinishByTier` (a never-pruned career high-water mark) and is therefore a ONE-WAY DOOR.
 *     A career reads 'wta' from her first counting W-series result to the end of the game.
 *   - the ENGINE the weeks were played on is stamped by the save's own DECLARED SCHEMA VERSION,
 *     read out of the export header before any migration – tighter than a file mtime, because the
 *     version is what the writing engine believed about itself.
 *
 * WHAT IS NOT DERIVABLE – stated rather than invented:
 *   - CONDITION AT ENTRY, and any condition series: no save holds one. `world.condition` at the
 *     snapshot is a single point sample per save, reported as such (and it is a BIASED sample: he
 *     exports when he exports).
 *   - the exact week the pro era opened, on careers whose byTrack rows predate v46. Reported as a
 *     bracket [floor, ceiling] with the evidence for each end, and onsets inside the bracket are
 *     counted separately instead of being assigned.
 *   - entry TIERS beyond each snapshot's 52-week results window, vacations beyond its 60-week
 *     finance window – the same two holes his-cadence-read declares.
 *
 * Run: npx vite-node tools/his-careers-brackets.ts -- --save /path/a.tsave [--save ...]
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import { activeLadderOf, KID_ID } from '../src/engine/world'
import { coachById, tierOf } from '../src/engine/coach'
import { ageAtWeek } from '../src/engine/world'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { RESULTS_WINDOW } from '../src/engine/world/constants'

const args = process.argv.slice(2)
const savePaths: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePaths.push(args[++i])
if (savePaths.length === 0) {
  console.error('usage: npx vite-node tools/his-careers-brackets.ts -- --save /path/a.tsave [...]')
  process.exit(1)
}

const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

/** THE ENGINE STAMP. Dates of the schema bumps this sample spans, and of the two balance changes
 *  that split the sample's physics – read off `git log -S"SAVE_SCHEMA_VERSION = N"` and
 *  `git log -S"recoveryBase: 8"` / `-S"proPhaseRecoveryBase"` on 24.08. A save DECLARES its version
 *  in the export header, so the version dates the engine that wrote it. */
const VERSION_DATE: Record<number, string> = {
  21: '2026-07-2x', 34: '2026-07-31', 36: '2026-08-02', 40: '2026-08-04', 43: '2026-08-05',
  45: '2026-08-08', 46: '2026-08-10', 47: '2026-08-10', 48: '2026-08-11', 49: '2026-08-15',
  50: '2026-08-16', 51: '2026-08-16', 52: '2026-08-17', 53: '2026-08-19', 54: '2026-08-20',
}
/** `recoveryBase` 5 -> 8 shipped 02.08 (commit 8060f11, the week reprice). The first schema version
 *  that can only have been written after it is v40 (04.08); v36 straddles the same day. */
const FIRST_REPRICED_VERSION = 40
/** Recovery variant C (`proPhaseRecoveryBase` 5) shipped 22.08 (commit da69482) – AFTER the newest
 *  version in this sample (v54, 20.08). No week of his play is a variant-C week. */
const FIRST_VARIANT_C_VERSION = 55

/** the sample's own engine timeline, printed so no reader has to trust the labels below */
function versionTimeline(versions: number[]): string {
  return [...new Set(versions)]
    .sort((a, b) => a - b)
    .map((v) => `v${v} (${VERSION_DATE[v] ?? 'undated'}, ${engineOf(v)})`)
    .join(' · ')
}

function declaredVersionOf(path: string): number {
  const buf = readFileSync(path)
  return buf.readUInt32BE(8)
}
function engineOf(v: number): string {
  if (v >= FIRST_VARIANT_C_VERSION) return 'C'
  return v >= FIRST_REPRICED_VERSION ? 'base8' : v === 36 ? 'base?' : 'pre8'
}

interface Snap {
  career: string
  path: string
  week: number
  version: number
  ladder: string
  plan: string
  physio: boolean
  masseur: boolean
  coachTier: string
  condition: number
  kidRank: number
  prizeCents: number
  earnedCents: number
  spentCents: number
  weeksLostTotal: number
  injuryRows: { week: number; severity: string; weeksOut: number; kind: string }[]
  injuryPruned: boolean
  activeInjury: string | null
  /** KID result rows in the 52-week window, with tier */
  resultWeeks: { week: number; tier: string }[]
  vacationWeeks: number[]
  financeFrom: number
  seasons: Map<number, { endRank: number; points: number; wins: number; losses: number; wtaPoints: number | null }>
  inCollege: { fromWeek: number; untilWeek: number } | null
}

const snaps: Snap[] = []
for (const path of savePaths) {
  const world = await decodeExportFile(new Uint8Array(readFileSync(path)))
  const w = world as unknown as Record<string, unknown>
  const name = basename(path).replace('.tsave', '').replace('tennis-sim_', '')
  const seasons = new Map<number, { endRank: number; points: number; wins: number; losses: number; wtaPoints: number | null }>()
  for (const s of world.seasonHistory ?? []) {
    seasons.set(s.seasonIndex, {
      endRank: s.endRank,
      points: s.points,
      wins: s.wins,
      losses: s.losses,
      wtaPoints: s.byTrack ? s.byTrack.wta.points : null,
    })
  }
  const college = w.college as { fromWeek: number; untilWeek: number } | null | undefined
  snaps.push({
    career: name.replace(/_w\d+$/, ''),
    path,
    week: world.week,
    version: declaredVersionOf(path),
    ladder: activeLadderOf(world),
    plan: `${world.plan.train}/${world.plan.rest}`,
    physio: world.physioActive,
    masseur: world.masseurHired ?? false,
    coachTier: world.coachId === null ? 'self' : tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)),
    condition: world.condition,
    kidRank: (w.kidRank as number) ?? 0,
    prizeCents: world.careerTotals?.prizeCents ?? 0,
    earnedCents: world.careerTotals?.earnedCents ?? 0,
    spentCents: world.careerTotals?.spentCents ?? 0,
    weeksLostTotal: world.careerTotals?.weeksLostToInjury ?? 0,
    injuryRows: (world.injuryHistory ?? []).map((h) => ({
      week: h.week,
      severity: h.severity,
      weeksOut: h.weeksOut,
      kind: h.kind,
    })),
    injuryPruned: (world.injuryHistory ?? []).length >= 20,
    activeInjury: world.injury ? `${world.injury.severity}/${world.injury.weeksRemaining}w` : null,
    resultWeeks: world.results
      .filter((r) => r.playerId === KID_ID)
      .map((r) => ({ week: r.week, tier: r.tier as string }))
      .sort((a, b) => a.week - b.week),
    vacationWeeks: (world.financeWeeks ?? []).filter((f) => (f.byCategory.vacation ?? 0) < 0).map((f) => f.week),
    financeFrom: (world.financeWeeks ?? []).length > 0 ? world.financeWeeks[0].week : world.week,
    seasons,
    inCollege: college ? { fromWeek: college.fromWeek, untilWeek: college.untilWeek } : null,
  })
}
snaps.sort((a, b) => (a.career === b.career ? a.week - b.week : a.career.localeCompare(b.career)))
const careers = [...new Set(snaps.map((s) => s.career))]

console.log(
  'ENGINE TIMELINE OF THE SAMPLE (declared schema version -> date it shipped -> the recovery physics\n' +
    '  it implies; recoveryBase 5->8 shipped 02.08, proPhaseRecoveryBase 5 (variant C) shipped 22.08):\n  ' +
    versionTimeline(snaps.map((s) => s.version)),
)

// --- the never-pruned assertion ------------------------------------------------
const deepest = Math.max(...snaps.map((s) => s.injuryRows.length))
console.log(
  `INJURY LEDGERS ARE EXACT IN THIS SAMPLE: the deepest career holds ${deepest} of the 20 rows ` +
    `rollInjury keeps, so every onset of every career is present with its week, severity, weeksOut ` +
    `and kind${snaps.some((s) => s.injuryPruned) ? ' – EXCEPT the flagged ones below, which are floors' : ''}.`,
)

// --- the pro-era boundary, as a bracket with its evidence -----------------------
/** floor  = the latest week we can prove she was still a junior (last season with byTrack evidence
 *           of NO W activity, or 0 when there is none)
 *  ceiling = the earliest week we can prove she was already professional (a W-track result row, or
 *            the first byTrack season showing W points) */
interface Era {
  floorWeek: number
  ceilWeek: number
  floorWhy: string
  ceilWhy: string
}
function eraOf(c: string): Era {
  const mine = snaps.filter((s) => s.career === c)
  let ceil = Infinity
  let ceilWhy = 'never'
  // (a) direct: a W-track result row inside some 52-week window
  for (const s of mine) {
    for (const r of s.resultWeeks) {
      if (TIERS[r.tier as keyof typeof TIERS]?.track === 'wta' && r.week < ceil) {
        ceil = r.week
        ceilWhy = `W-track result w${r.week} (${r.tier})`
      }
    }
  }
  // (b) byTrack: the first banked season with W points. Its END week is the proof.
  let floor = 0
  let floorWhy = 'no byTrack evidence (rows predate v46, which back-fills nothing)'
  const allSeasons = new Map<number, number | null>()
  for (const s of mine) for (const [i, r] of s.seasons) if (!allSeasons.has(i) || allSeasons.get(i) === null) allSeasons.set(i, r.wtaPoints)
  const idx = [...allSeasons.keys()].sort((a, b) => a - b)
  for (const i of idx) {
    const p = allSeasons.get(i)
    if (p === null || p === undefined) continue
    if (p > 0) {
      const end = (i + 1) * WEEKS_PER_YEAR - 1
      if (end < ceil) {
        ceil = end
        ceilWhy = `byTrack season ${i} banked ${p} W points -> pro by w${end}`
      }
      break
    }
    floor = (i + 1) * WEEKS_PER_YEAR - 1
    floorWhy = `byTrack season ${i} banked 0 W points -> still junior at w${floor}`
  }
  // the ladder latch at the FIRST snapshot is direct evidence too
  const first = mine[0]
  if (first.ladder !== 'wta' && first.week > floor) {
    floor = first.week
    floorWhy = `activeLadderOf = '${first.ladder}' at w${first.week} (the latch had not fired)`
  }
  return { floorWeek: floor, ceilWeek: ceil === Infinity ? mine[mine.length - 1].week : ceil, floorWhy, ceilWhy }
}
const eras = new Map(careers.map((c) => [c, eraOf(c)]))

console.log('\n=== THE ERA GATE (the one variant C uses: activeLadderOf === "wta", a ONE-WAY latch on')
console.log('    bestFinishByTier, which is never pruned – she is professional from her first counting')
console.log('    W-series result to the end of the game) ===')
for (const c of careers) {
  const e = eras.get(c)!
  const last = snaps.filter((s) => s.career === c).slice(-1)[0]
  console.log(
    `  ${pad(c, 12)} junior through w${padL(e.floorWeek, 4)} · professional by w${padL(e.ceilWeek, 4)}` +
      ` · ladder at the last snapshot (w${last.week}) = ${last.ladder}`,
  )
  console.log(`      floor: ${e.floorWhy}`)
  console.log(`      ceil : ${e.ceilWhy}`)
}

// --- the per-season panel (exact) ----------------------------------------------
console.log('\n=== THE EXACT PER-SEASON PANEL (seasonHistory is never pruned; onsets from the full')
console.log('    injury ledger; a layoff is attributed to the season its ONSET week falls in) ===')
console.log(
  '  ' + pad('career', 12) + padL('seas', 5) + padL('weeks', 10) + padL('era', 5) + padL('eng', 6) +
    padL('W-L', 8) + padL('pts', 7) + padL('endRank', 8) + padL('onsets', 7) + padL('mi/mo/ma/se', 13) +
    padL('wksOut', 7) + '  injuries',
)
interface SeasonRow {
  career: string
  season: number
  /** PROVEN era: 'jr' only while the ladder latch demonstrably had not fired, 'pro' only from the
   *  earliest proof that it had, '?' for the gap the pruning leaves in between. */
  era: 'jr' | 'pro' | '?'
  /** the convention his-cadence-read (DI2) uses: pro from the earliest PROOF week, junior before it
   *  – the unassigned band counted as junior. Kept beside `era` so the two readings can be compared
   *  rather than silently merged. */
  eraCeil: 'jr' | 'pro'
  /** engine that played the season: 'base8' post-reprice (02.08), 'pre8' before it, 'base?' on the
   *  reprice day itself. `bound` is true when only an UPPER bound is available (the season predates
   *  the career's first snapshot, so nothing dates its start). */
  engine: string
  engineBoundOnly: boolean
  college: boolean
  plan: string
  physio: boolean
  /** the season's REAL length in weeks / 52 – the last season of a career is a part-season, and a
   *  part-season counted as 1.0 would dilute every rate it lands in. */
  seasonFraction: number
  matches: number
  onsets: number
  weeksOut: number
  sev: Record<string, number>
}
const panel: SeasonRow[] = []
for (const c of careers) {
  const mine = snaps.filter((s) => s.career === c)
  const last = mine[mine.length - 1]
  const e = eras.get(c)!
  const allInj = new Map<number, { week: number; severity: string; weeksOut: number; kind: string }>()
  for (const s of mine) for (const r of s.injuryRows) allInj.set(r.week, r)
  const allSeasons = new Map<number, { endRank: number; points: number; wins: number; losses: number }>()
  for (const s of mine) for (const [i, r] of s.seasons) allSeasons.set(i, r)
  const lastSeason = Math.floor(last.week / WEEKS_PER_YEAR)
  for (let i = 0; i <= lastSeason; i++) {
    const a = i * WEEKS_PER_YEAR
    const b = Math.min(last.week, (i + 1) * WEEKS_PER_YEAR - 1)
    const rows = [...allInj.values()].filter((r) => r.week >= a && r.week <= b)
    const sev: Record<string, number> = { minor: 0, moderate: 0, major: 0, severe: 0 }
    for (const r of rows) sev[r.severity] = (sev[r.severity] ?? 0) + 1
    const era: 'jr' | 'pro' | '?' = b <= e.floorWeek ? 'jr' : a >= e.ceilWeek ? 'pro' : '?'
    const sh = allSeasons.get(i)
    // OVERLAP, not containment: the freeze opens mid-season, and a season half of which she spent
    // at college is not a season of professional play.
    const inCollege = !!(last.inCollege && b >= last.inCollege.fromWeek && a <= last.inCollege.untilWeek)
    // THE ENGINE STAMP. A save's declared version dates the engine that last WROTE it, so a season
    // played inside a bracket [A,B] was played on B's engine – both ends are dated. A season BEFORE
    // the career's first snapshot has only an upper bound: nothing in the file dates its start.
    const holder = mine.find((s) => s.week >= b) ?? last
    const boundOnly = holder === mine[0]
    panel.push({
      career: c,
      season: i,
      era,
      eraCeil: b < e.ceilWeek ? 'jr' : 'pro',
      engine: engineOf(holder.version),
      engineBoundOnly: boundOnly,
      college: inCollege,
      plan: holder.plan,
      physio: holder.physio,
      seasonFraction: (b - a + 1) / WEEKS_PER_YEAR,
      matches: sh ? sh.wins + sh.losses : 0,
      onsets: rows.length,
      weeksOut: rows.reduce((x, r) => x + r.weeksOut, 0),
      sev,
    })
    console.log(
      '  ' + pad(c, 12) + padL(i, 5) + padL(`${a}-${b}`, 10) + padL(era, 5) +
        padL(`${boundOnly ? '<=' : ''}${engineOf(holder.version)}`, 8) +
        padL(sh ? `${sh.wins}-${sh.losses}` : inCollege ? 'college' : '-', 8) +
        padL(sh ? sh.points : '-', 7) + padL(sh ? sh.endRank : '-', 8) + padL(rows.length, 7) +
        padL(`${sev.minor}/${sev.moderate}/${sev.major}/${sev.severe}`, 13) +
        padL(rows.reduce((x, r) => x + r.weeksOut, 0), 7) + '  ' +
        rows.map((r) => `w${r.week}:${r.severity[0]}${r.weeksOut}:${r.kind}`).join(' '),
    )
  }
}

// --- the consecutive-pair brackets ---------------------------------------------
console.log('\n=== THE CONSECUTIVE-PAIR BRACKETS – each row is a real stretch of his play with a known')
console.log('    start and a known end (the find: two snapshots of one career bracket what he entered,')
console.log('    what she won, which injuries landed and how long she was out) ===')
for (const c of careers) {
  const mine = snaps.filter((s) => s.career === c)
  console.log(`\n  ${c}`)
  console.log(
    '    ' + pad('bracket', 16) + padL('wks', 5) + padL('seas', 6) + padL('eng', 7) + padL('onsets', 7) +
      padL('mi/mo/ma/se', 13) + padL('wksOut', 7) + padL('entries', 8) + padL('rank', 11) +
      padL('prize', 16) + padL('vac', 5) + '  staff / plan',
  )
  for (let i = 1; i < mine.length; i++) {
    const a = mine[i - 1]
    const b = mine[i]
    const rows = b.injuryRows.filter((r) => r.week > a.week && r.week <= b.week)
    const oldestKept = b.injuryRows.length > 0 ? b.injuryRows[0].week : b.week
    const exact = !b.injuryPruned || oldestKept <= a.week
    const sev: Record<string, number> = { minor: 0, moderate: 0, major: 0, severe: 0 }
    for (const r of rows) sev[r.severity] = (sev[r.severity] ?? 0) + 1
    // entries inside the bracket: the union of the two 52-week results windows, clipped. HONEST
    // ABOUT THE HOLE – a bracket longer than 52 weeks has weeks no window retained.
    const seen = new Set<number>()
    const tiers = new Map<string, number>()
    for (const s of [a, b]) {
      for (const r of s.resultWeeks) {
        if (r.week <= a.week || r.week > b.week || seen.has(r.week)) continue
        seen.add(r.week)
        tiers.set(r.tier, (tiers.get(r.tier) ?? 0) + 1)
      }
    }
    // ⚠ HOW MUCH OF THE BRACKET THE ENTRY COLUMN CAN SEE AT ALL. `pruneResults` keeps a rolling 52
    // weeks per snapshot, so the two windows are [w-51, w] each; anything between them was deleted
    // years before the question was asked. Counted as a UNION of weeks, not as a span – the earlier
    // span form silently claimed full coverage of a 217-week college bracket.
    const covered = new Set<number>()
    for (const s of [a, b]) {
      for (let wk = Math.max(a.week + 1, s.week - (RESULTS_WINDOW - 1)); wk <= Math.min(b.week, s.week); wk++) covered.add(wk)
    }
    const windowCover = covered.size
    const vac = new Set<number>()
    for (const s of [a, b]) for (const v of s.vacationWeeks) if (v > a.week && v <= b.week) vac.add(v)
    const dSeasons = (b.week - a.week) / WEEKS_PER_YEAR
    const college = b.inCollege && a.week >= b.inCollege.fromWeek - 1 && b.week <= b.inCollege.untilWeek
    console.log(
      '    ' + pad(`w${a.week}->w${b.week}`, 16) + padL(b.week - a.week, 5) + padL(dSeasons.toFixed(1), 6) +
        padL(`${engineOf(a.version)}>${engineOf(b.version)}`, 7) +
        padL(`${exact ? '' : '>='}${rows.length}`, 7) +
        padL(`${sev.minor}/${sev.moderate}/${sev.major}/${sev.severe}`, 13) +
        padL(b.weeksLostTotal - a.weeksLostTotal, 7) +
        padL(`${seen.size}${windowCover < b.week - a.week ? '*' : ''}`, 8) +
        padL(`${a.kidRank}->${b.kidRank}`, 11) +
        padL(money(b.prizeCents - a.prizeCents), 16) +
        padL(`${vac.size}${windowCover < b.week - a.week ? '*' : ''}`, 5) + '  ' +
        `${a.plan}${a.plan === b.plan ? '' : `->${b.plan}`} phys ${a.physio ? 'on' : 'off'}${a.physio === b.physio ? '' : b.physio ? '->on' : '->off'}` +
        ` coach ${a.coachTier}${a.coachTier === b.coachTier ? '' : `->${b.coachTier}`}${college ? '  [COLLEGE FREEZE]' : ''}`,
    )
    if (tiers.size > 0) {
      console.log(
        '      tiers seen: ' + [...tiers.entries()].sort((x, y) => y[1] - x[1]).map(([t, n]) => `${t} ${n}`).join(' · ') +
          (windowCover < b.week - a.week
            ? `   * only ${windowCover} of ${b.week - a.week} bracket weeks are inside a retained 52w results window`
            : ''),
      )
    }
    if (rows.length > 0) console.log('      injuries: ' + rows.map((r) => `w${r.week} ${r.severity} ${r.weeksOut}w ${r.kind}`).join(' · '))
  }
  const first = mine[0]
  const last = mine[mine.length - 1]
  console.log(
    `    CAREER TOTAL w0->w${last.week}: ${last.injuryRows.length} onsets, ${last.weeksLostTotal} weeks lost, ` +
      `prize ${money(last.prizeCents)}, earned ${money(last.earnedCents)}, rank ${last.kidRank}, ` +
      `ladder ${last.ladder}, condition at export ${first.condition}..${last.condition}` +
      `${last.inCollege ? `, COLLEGE w${last.inCollege.fromWeek}-w${last.inCollege.untilWeek}` : ''}`,
  )
}

// --- the aggregate: his real injury landscape, at both eras ---------------------
function agg(rows: SeasonRow[], label: string): void {
  const seasons = rows.reduce((a, r) => a + r.seasonFraction, 0)
  const onsets = rows.reduce((a, r) => a + r.onsets, 0)
  const weeksOut = rows.reduce((a, r) => a + r.weeksOut, 0)
  const matches = rows.reduce((a, r) => a + r.matches, 0)
  const sev = { minor: 0, moderate: 0, major: 0, severe: 0 } as Record<string, number>
  for (const r of rows) for (const k of Object.keys(sev)) sev[k] += r.sev[k] ?? 0
  // Poisson SEM on the rate: sqrt(onsets)/seasons
  const sem = Math.sqrt(onsets) / Math.max(1, seasons)
  console.log(
    '  ' + pad(label, 42) + padL(seasons.toFixed(1), 8) + padL(onsets, 8) +
      padL(`${(onsets / Math.max(0.01, seasons)).toFixed(2)} ±${sem.toFixed(2)}`, 14) +
      padL((weeksOut / Math.max(0.01, seasons)).toFixed(2), 9) +
      padL(matches, 8) + padL(matches > 0 ? ((100 * onsets) / matches).toFixed(2) : '-', 10) +
      padL(`${sev.minor}/${sev.moderate}/${sev.major}/${sev.severe}`, 13),
  )
}
console.log('\n=== HIS REAL INJURY LANDSCAPE, BY ERA AND BY ENGINE (season-panel rows, exact) ===')
console.log(
  '  ' + pad('cell', 42) + padL('seasons', 8) + padL('onsets', 8) + padL('per season', 14) +
    padL('wksOut/s', 9) + padL('matches', 8) + padL('inj/100m', 10) + padL('mi/mo/ma/se', 13),
)
console.log('  -- the three numbers already in the spec, re-derived on the full 21-save sample --')
agg(panel, 'DI §2 cut: every career, era and engine')
agg(panel.filter((r) => r.eraCeil === 'jr'), 'DI2 §7 cut: junior (pro from the proof week)')
agg(panel.filter((r) => r.eraCeil === 'pro'), 'DI2 §7 cut: professional')
console.log('  -- the same split read CONSERVATIVELY (the pruning gap left unassigned) --')
agg(panel.filter((r) => r.era === 'jr'), 'proven junior')
agg(panel.filter((r) => r.era === 'pro'), 'proven professional')
agg(panel.filter((r) => r.era === '?'), 'unassignable (evidence pruned)')
console.log('  -- the cut this fuller sample adds: era AND engine AND playing --')
const proPlaying = (r: SeasonRow) => r.eraCeil === 'pro' && !r.college && r.engine === 'base8' && !r.engineBoundOnly
agg(panel.filter(proPlaying), 'pro · post-reprice (base 8) · playing')
agg(panel.filter((r) => proPlaying(r) && r.plan === '75/25'), '  of which plan 75/25')
agg(panel.filter((r) => proPlaying(r) && r.plan !== '75/25'), '  of which plan 85/15 (his own harsh arm)')
agg(panel.filter((r) => proPlaying(r) && r.physio), '  of which physio ON')
agg(panel.filter((r) => proPlaying(r) && !r.physio), '  of which physio OFF')
agg(panel.filter((r) => r.college), 'the college freeze (alice, weeks 266-474)')
agg(panel.filter((r) => r.engine === 'pre8' || r.engine === 'base?'), 'pre-reprice weeks (naomi only)')
console.log('  -- per career --')
for (const c of careers) agg(panel.filter((r) => r.career === c), `  ${c} – all seasons`)

console.log('\n  CONDITION AT EXPORT (a POINT sample per save, not a trajectory – no save holds a series;')
console.log('  and a biased one: he exports when he exports):')
console.log(
  '    ' + snaps.map((s) => `${s.career.split('-')[0]}w${s.week}:${s.condition}`).join(' ') +
    `\n    mean ${(snaps.reduce((a, s) => a + s.condition, 0) / snaps.length).toFixed(1)} over ${snaps.length} snapshots`,
)
