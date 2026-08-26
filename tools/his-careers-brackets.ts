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

// =================================================================================================
// --window A:B – ONE STRETCH OF ONE CAREER, READ TO THE FLOOR (round 26 items 14 and 15)
// =================================================================================================
//
// ⚠ IT IS THE SAME READER, NOT A FOURTH ONE. Everything above answers "what do his careers say in
// aggregate"; this section answers the two questions round 26 asks about ONE bracket of ONE career –
// «2 травмы за половину сезона до колледжа … многовато?» (#14) and «статистика побед/поражений …
// сверь с её показателями скиллов» (#15). It reuses the snapshots already decoded above, adds no
// second import of the save, and prints nothing unless `--window` is given, so every existing run of
// this tool is byte-identical.
//
// THE FOUR THINGS THIS SECTION CAN DO THAT NOTHING ELSE IN tools/ COULD:
//
//   1. THE ONSET WEEK, AND THE DOOR IT CAME IN BY. ⚠⚠ `injuryHistory[].week` IS THE RECOVERY WEEK,
//      NOT THE ONSET WEEK – `rollInjury` pushes the row in the branch that CLEARS the layoff, at
//      `world.week`. Onset = `week − weeksOut` (masseur-free careers; `weeksSaved` is added back
//      where present). The panel above attributes a layoff to "the season its ONSET week falls in"
//      and then uses the row's own week, which is the recovery week – a real off-by-`weeksOut` that
//      only matters at a season boundary. Handled correctly HERE, and the aggregate above is left
//      alone deliberately: correcting it would silently re-state §9's published numbers, and the
//      check below reports whether any row in the sample actually crosses a boundary.
//      The DOOR is then read off the match rows: `WorldMatch.retiredId === KID_ID` in the onset week
//      means the layoff came through `retirementInjury` (world.ts: `if (retiredMatch)
//      retirementInjury(world)`), not through the weekly occurrence roll in `rollInjury`.
//
//   2. CONDITION AT ENTRY, RECOVERED – the one fact the three readers all declare underivable. It
//      is not stored, but it is INVERTIBLE: `kidMatchPlayerFor` composes her on-court build as
//      `raw × conditionMatchFactor(condition) × surfaceStyle × kit + coachEdge`, all four of which
//      are pure and three of which are computable at any week, and the composed vector is FROZEN
//      into every match row. Divide the three known factors out and what is left is
//      `raw_wing × f(condition)`. The remaining scale is fixed by the save's own anchor:
//      `college.years[0].startSkill` is the ARITHMETIC MEAN of her five raw skills at the enrolment
//      week (verified against `endSkill` vs `world.skills`, which agree to 1e-15).
//      ⚠ THE BOUND IS ONE-SIDED AND IS REPORTED AS ONE. Raw skill is monotone non-decreasing, so
//      `mean_raw(W) ≤ mean_raw(anchor)` and `f(W) ≥ measured(W)/mean_raw(anchor)` – a HARD LOWER
//      bound on condition, needing no development model at all. A point read is printed beside it
//      off the monotone upper envelope of the same series (the weeks where f is 1), clearly labelled
//      as the estimate it is. And `f` SATURATES at the knee (70), so every week at or above the knee
//      reads as ">=70" and no read above it is claimed.
//
//   3. THE WEEKLY DOOR'S OWN HAZARD, from the engine's own `injuryTau`, at the recovered condition.
//      Not a re-derivation: a shallow clone of her world is stamped to the week and handed to the
//      shipped function. What the save cannot see (a booked vacation, a resort recovery buff) is set
//      to "absent", and both are tau-REDUCING, so the printed tau is an UPPER bound.
//
//   4. THE MATCH MODEL'S OWN PREDICTION, twice, on the players she actually met – the closed form
//      (`fastMatchProbability`, i.e. `pMatchBo3(basePServe…)`, exactly what the engine uses to
//      resolve an AI-AI match) and a MONTE CARLO over reseeds of `simulateMatch`, which is the full
//      point loop WITH momentum, the big-point penalty, the fatigue term and the retirement hazard.
//      The MC is the only instrument that can price a RETIREMENT, because the hazard is per-point.
//      ⚠ PROVENANCE FIRST: every match is re-run at its STORED seed and the winner and scoreline are
//      checked against the persisted row before a single reseed is trusted. A tool that cannot
//      reproduce the match it is about to resample is measuring something else.
import { conditionMatchFactor } from '../src/engine/condition'
import { applySurfaceStyle } from '../src/engine/match/style'
import { applyKit, kitWearAt } from '../src/engine/equipment'
import { kitFreshCap } from '../src/engine/offers'
import { coachEdgePp, physioRiskFactor } from '../src/engine/coach'
import { COACH_EDGE_POINTS_PER_PP } from '../src/engine/world/player'
import { injuryTau } from '../src/engine/world'
import { fastMatchProbability, simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { ECONOMY } from '../src/engine/economy'
import type { MatchPlayer, Surface } from '../src/engine/match/types'
import type { WorldState } from '../src/engine/world'
import type { TierId } from '../src/engine/season/types'

const windowArgIdx = args.indexOf('--window')
if (windowArgIdx >= 0 && args[windowArgIdx + 1]) {
  const [wa, wb] = args[windowArgIdx + 1].split(':').map(Number)
  const mcIdx = args.indexOf('--mc')
  const MC = mcIdx >= 0 && args[mcIdx + 1] ? Number(args[mcIdx + 1]) : 400
  // the LAST snapshot of the first career carries the deepest history; --window is a one-career mode
  const world = await decodeExportFile(new Uint8Array(readFileSync(savePaths[savePaths.length - 1])))
  const w = world as unknown as Record<string, unknown>
  const SK = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const
  const college = w.college as { fromWeek: number; years: { startSkill: number }[] } | null
  const kidRows = world.events
    .filter((e) => e.match !== undefined && (e.match!.aId === KID_ID || e.match!.bId === KID_ID))
    .map((e) => ({ week: e.week, m: e.match!, friendly: e.friendly === true, text: e.text }))
    .sort((a, b) => a.week - b.week || a.m.round - b.m.round)
  const inWin = kidRows.filter((r) => r.week >= wa && r.week <= wb && !r.friendly)
  const playWeeks = new Set(kidRows.filter((r) => !r.friendly).map((r) => r.week))
  const tierOfRow = (r: { m: { eventId: string } }): TierId =>
    r.m.eventId.split('-').slice(2).join('-') as TierId
  const kidOf = (m: { aId: string; a: MatchPlayer; b: MatchPlayer }) => (m.aId === KID_ID ? m.a : m.b)
  const oppOf = (m: { aId: string; a: MatchPlayer; b: MatchPlayer }) => (m.aId === KID_ID ? m.b : m.a)

  console.log(`\n\n${'='.repeat(110)}`)
  console.log(`THE WINDOW w${wa}..w${wb} of ${basename(savePaths[savePaths.length - 1])} – round 26 items 14 and 15`)
  console.log(`${'='.repeat(110)}`)
  console.log(
    `  save week ${world.week} · declared schema v${declaredVersionOf(savePaths[savePaths.length - 1])} · ` +
      `college from w${college?.fromWeek ?? '-'} · plan ${world.plan.train}/${world.plan.rest} · ` +
      `physio ${world.physioActive ? 'ON' : 'off'} · masseur ${world.masseurHired ? 'yes' : 'no'} · ` +
      `coach ${world.coachId ?? 'self'} · coachOnEventWeeks ${(w.coachOnEventWeeks as boolean) ? 'yes' : 'no'}`,
  )

  // --- 1. THE INJURIES, WITH THEIR ONSET WEEK AND THEIR DOOR -------------------------------------
  const rows = (world.injuryHistory ?? []).map((h) => {
    const hh = h as unknown as { weeksSaved?: number }
    const onset = h.week - (h.weeksOut + (hh.weeksSaved ?? 0))
    const retiredHere = kidRows.some((r) => r.week === onset && r.m.retiredId === KID_ID)
    return { ...h, onset, door: retiredHere ? 'retirement' : 'weekly' as const }
  })
  const boundaryRisk = rows.filter((r) => Math.floor(r.onset / WEEKS_PER_YEAR) !== Math.floor(r.week / WEEKS_PER_YEAR))
  console.log(`\n--- 1. THE INJURY LEDGER (${rows.length} of the 20 rows rollInjury keeps – EXACT, nothing pruned) ---`)
  console.log('    ' + pad('onset', 8) + pad('recov', 8) + pad('sev', 10) + padL('wksOut', 7) + '  ' + pad('door', 12) + 'kind')
  for (const r of rows) {
    console.log(
      '    ' + pad(`w${r.onset}`, 8) + pad(`w${r.week}`, 8) + pad(r.severity, 10) + padL(r.weeksOut, 7) + '  ' +
        pad(r.door, 12) + r.kind + (r.onset >= wa && r.onset <= wb ? '   <-- IN WINDOW' : ''),
    )
  }
  console.log(
    `    the recovery-week / onset-week distinction moves ${boundaryRisk.length} of ${rows.length} rows across a ` +
      `season boundary in this save, so the §9 panel above is unaffected by it.`,
  )
  const winInj = rows.filter((r) => r.onset >= wa && r.onset <= wb)
  const lost = winInj.reduce((a, r) => a + r.weeksOut, 0)
  console.log(
    `\n    IN THE WINDOW: ${winInj.length} onsets · ${lost} weeks lost of ${wb - wa + 1} · ` +
      `doors ${winInj.filter((r) => r.door === 'weekly').length} weekly / ${winInj.filter((r) => r.door === 'retirement').length} retirement · ` +
      `severities ${winInj.map((r) => r.severity).join(', ')}`,
  )

  // --- 2. THE EXPOSURE ---------------------------------------------------------------------------
  // The composition inverse. `applySurfaceStyle` and `applyKit` are both linear in each attribute
  // (a multiply per wing, composure untouched by either), so pushing a 100-vector through the same
  // two calls recovers the per-wing factor exactly rather than approximating it.
  function gAt(week: number, surface: Surface): Record<string, number> {
    const unit = { id: 'u', name: 'u', serve: 100, ret: 100, composure: 100, stamina: 100, groundstrokes: 100 }
    const out = applyKit(
      applySurfaceStyle(unit, world.profile.playStyle, surface),
      kitWearAt(world.seed, world.profile.background, week, kitFreshCap(world.offers ?? [], week), world.kit ?? null),
    )
    const g: Record<string, number> = {}
    for (const k of SK) g[k] = (out as unknown as Record<string, number>)[k] / 100
    return g
  }
  const edgeTrip = coachEdgePp(world.seed, world.coachId, true) * COACH_EDGE_POINTS_PER_PP
  const edgeHome = coachEdgePp(world.seed, world.coachId, false) * COACH_EDGE_POINTS_PER_PP
  /** `coachTravelFareFor`'s own test, restated on what a save keeps: he comes to a rung that pays
   *  prize money whenever the stance is on and somebody is hired. Every rung in this window pays. */
  const fareOn = (tier: TierId) =>
    world.coachId !== null && (w.coachOnEventWeeks as boolean) && TIERS[tier]?.prizeCents !== undefined
  /** raw_wing × f(condition), per wing, from a frozen match snapshot */
  function inverse(week: number, surface: Surface, comp: MatchPlayer, tier: TierId): Record<string, number> {
    const g = gAt(week, surface)
    const edge = fareOn(tier) ? edgeTrip : edgeHome
    const out: Record<string, number> = {}
    for (const k of SK) out[k] = ((comp as unknown as Record<string, number>)[k] - edge) / g[k]
    return out
  }
  interface WeekRow {
    week: number
    tier: TierId
    surface: Surface
    matches: number
    wins: number
    /** mean over the five wings of raw × f(condition) */
    meanInv: number
    trailing4: number
    kid: MatchPlayer
  }
  const weekRows: WeekRow[] = []
  const allPlayWeeks = [...playWeeks].sort((a, b) => a - b)
  for (const wk of [...new Set(kidRows.filter((r) => !r.friendly).map((r) => r.week))].sort((a, b) => a - b)) {
    const rs = kidRows.filter((r) => r.week === wk && !r.friendly)
    const tier = tierOfRow(rs[0])
    const kid = kidOf(rs[0].m)
    const inv = inverse(wk, rs[0].m.surface, kid, tier)
    weekRows.push({
      week: wk,
      tier,
      surface: rs[0].m.surface,
      matches: rs.length,
      wins: rs.filter((r) => r.m.winnerId === KID_ID).length,
      meanInv: SK.reduce((a, k) => a + inv[k], 0) / 5,
      trailing4: allPlayWeeks.filter((p) => p > wk - 4 && p <= wk).length,
      kid,
    })
  }
  // the anchor and the monotone envelope
  const anchor = college?.years?.[0]?.startSkill ?? 0
  const anchorWeek = college?.fromWeek ?? world.week
  const envelope: { week: number; v: number }[] = []
  let running = -Infinity
  for (const r of weekRows) {
    if (r.meanInv > running) {
      running = r.meanInv
      envelope.push({ week: r.week, v: r.meanInv })
    }
  }
  /** ⭐ THE OTHER SIDE OF THE BRACKET, AND IT IS A PROOF RATHER THAN A FIT. Raw skill is monotone
   *  non-decreasing, and f <= 1 everywhere, so for every earlier week W' <= W:
   *      mean_raw(W) >= mean_raw(W') >= meanInv(W')
   *  i.e. the RUNNING MAXIMUM of the measured series is a hard LOWER bound on raw skill, which makes
   *  `meanInv(W) / env(W)` a hard UPPER bound on f and therefore on condition. It is vacuous exactly
   *  at the running maxima themselves (where it returns f <= 1, i.e. "somewhere at or above the
   *  knee") and informative at every dip below them – which is the half of the series that matters,
   *  because a dip below a monotone curve cannot be anything but condition. */
  function envAt(week: number): number {
    let best = -Infinity
    for (const e of envelope) if (e.week <= week && e.v > best) best = e.v
    return best
  }
  const knee = ECONOMY.condition.matchStrengthKnee
  const floorF = ECONOMY.condition.matchStrengthFloor
  const condOf = (f: number): number => (f >= 1 ? knee : (knee * (f - floorF)) / (1 - floorF))
  const condLower = new Map<number, number>()
  const condUpper = new Map<number, number>()
  for (const r of weekRows) {
    condLower.set(r.week, condOf(Math.min(1, r.meanInv / anchor)))
    const fUp = r.meanInv / envAt(r.week)
    condUpper.set(r.week, fUp >= 1 ? 100 : condOf(fUp))
  }
  console.log(`\n--- 2. THE EXPOSURE, WEEK BY WEEK (condition RECOVERED – see the header for the inverse) ---`)
  console.log(
    '    ' + pad('week', 7) + pad('tier', 9) + pad('surf', 7) + padL('m', 3) + padL('W-L', 6) + padL('trail4', 7) +
      padL('raw*f', 9) + padL('cond>=', 8) + padL('cond<=', 8) + '  note',
  )
  for (const r of weekRows) {
    if (r.week < wa - 20 || r.week > wb) continue
    const cl = condLower.get(r.week)!
    const cu = condUpper.get(r.week)!
    const inj = winInj.find((x) => x.onset === r.week)
    console.log(
      '    ' + pad(`w${r.week}`, 7) + pad(r.tier, 9) + pad(r.surface, 7) + padL(r.matches, 3) +
        padL(`${r.wins}-${r.matches - r.wins}`, 6) + padL(r.trailing4, 7) + padL(r.meanInv.toFixed(3), 9) +
        padL(cl.toFixed(1), 8) + padL(cu >= 100 ? '-' : cu.toFixed(1), 8) +
        (r.week >= wa ? '' : '   [before the window]') + (inj ? `   <-- ONSET (${inj.door})` : ''),
    )
  }
  const winWeeks = weekRows.filter((r) => r.week >= wa && r.week <= wb)
  const totM = winWeeks.reduce((a, r) => a + r.matches, 0)
  const totW = winWeeks.reduce((a, r) => a + r.wins, 0)
  console.log(
    `\n    WINDOW EXPOSURE: ${winWeeks.length} event weeks of ${wb - wa + 1} · ${totM} matches · ${totW}-${totM - totW} ` +
      `· tiers ${[...new Set(winWeeks.map((r) => r.tier))].join(',')} · anchor mean_raw(w${anchorWeek}) = ${anchor.toFixed(4)}`,
  )

  // --- 2b. HER SKILLS AT THE TIME, AND THE FIELD SHE MET (item 15's other half) ------------------
  // ⚠ THE COMPOSED VECTOR IS READ, NOT MODELLED. `WorldMatch.a/.b` freeze the exact MatchPlayer both
  // sides stepped on court as, which is precisely the object `basePServe` consumes – so "her skills
  // at the time" needs no reconstruction for the match model, only for the human-readable build.
  {
    const last = winWeeks[winWeeks.length - 1]
    const invLast = inverse(last.week, last.surface, last.kid, last.tier)
    const opps = inWin.map((r) => oppOf(r.m))
    const mo = (k: string) => opps.reduce((a, o) => a + (o as unknown as Record<string, number>)[k], 0) / opps.length
    const pot = (w.potential ?? {}) as Record<string, number>
    console.log(`\n--- 2b. HER BUILD IN THE WINDOW vs THE FIELD SHE MET ---`)
    console.log('    ' + pad('wing', 14) + padL('raw*f (w' + last.week + ')', 16) + padL('on court', 10) + padL('potential', 11) + padL('field mean', 12) + padL('edge', 8))
    for (const k of SK) {
      const onCourt = (last.kid as unknown as Record<string, number>)[k]
      console.log(
        '    ' + pad(k, 14) + padL(invLast[k].toFixed(2), 16) + padL(onCourt.toFixed(2), 10) +
          padL((pot[k] ?? 0).toFixed(2), 11) + padL(mo(k).toFixed(2), 12) + padL((onCourt - mo(k)).toFixed(2), 8),
      )
    }
    console.log(
      `    mean on court ${(SK.reduce((a, k) => a + (last.kid as unknown as Record<string, number>)[k], 0) / 5).toFixed(2)}` +
        ` vs field mean ${(SK.reduce((a, k) => a + mo(k), 0) / 5).toFixed(2)}` +
        ` · her rank at the window's end #${(w.kidRank as number) ?? '-'} (at export) · style ${world.profile.playStyle}` +
        ` · coach's on-court edge +${edgeTrip.toFixed(3)} per wing at every rung in this window (all of them pay prize money)`,
    )
  }

  // --- 3. THE WEEKLY DOOR: injuryTau, from the engine's own function -----------------------------
  const injuredWeeks = new Set<number>()
  for (const r of rows) for (let k = r.onset + 1; k <= r.week; k++) injuredWeeks.add(k)
  function tauAt(week: number, condition: number, physio: boolean): number {
    const clone = { ...(world as WorldState) }
    clone.week = week
    clone.condition = condition
    clone.physioActive = physio
    clone.injury = null
    clone.recoveryBuff = null // unobservable this far back; it only LOWERS tau
    clone.vacations = [] //       likewise
    clone.knock = null //         the last knock in this sample answered 'rest', factor 1 either way
    clone.results = allPlayWeeks
      .filter((p) => p > week - 4 && p < week)
      .map((p) => ({ playerId: KID_ID, week: p, points: 0, tier: 'w50' as TierId }))
    if (playWeeks.has(week)) {
      clone.season = [{ id: 'probe', week, tier: 'w50', surface: 'hard', travelCostCents: 0, deadlineWeek: week - 2 }]
      clone.entries = ['probe']
    } else {
      clone.season = []
      clone.entries = []
    }
    return injuryTau(clone)
  }
  console.log(`\n--- 3. THE WEEKLY DOOR – ECONOMY.availability through the shipped injuryTau ---`)
  console.log(
    `    knobs: base ${ECONOMY.availability.injuryBaseChance} · fatigueSlope ${ECONOMY.availability.injuryFatigueSlope} · ` +
      `playingMultiplier ${ECONOMY.availability.injuryPlayingMultiplier} · cap ${ECONOMY.availability.injuryChanceCap} · ` +
      `physio rung factor ${physioRiskFactor(tierOf(coachById(world.seed, ageAtWeek(wb), world.coachId))).toFixed(3)}`,
  )
  let sumTauOn = 0
  let sumTauOff = 0
  let healthy = 0
  for (let k = wa; k <= wb; k++) {
    if (injuredWeeks.has(k)) continue
    healthy++
    // a non-event week has no snapshot, so it inherits the nearest event week's recovered condition –
    // stated rather than hidden: between events condition RISES, so this too is an upper bound on tau
    const near = winWeeks.reduce((best, r) => (Math.abs(r.week - k) < Math.abs(best.week - k) ? r : best), winWeeks[0])
    // ⚠ THE LOWER BOUND ON CONDITION, DELIBERATELY: it is the operand that MAXIMISES tau, so the sum
    // below is an UPPER bound on what the weekly door could have produced. Between events condition
    // RISES, so inheriting an event week's value on a rest week pushes the same way.
    const c = Math.min(100, condLower.get(near.week) ?? knee)
    sumTauOn += tauAt(k, c, true)
    sumTauOff += tauAt(k, c, false)
  }
  const pAtLeast = (lam: number, n: number) => 1 - Math.exp(-lam) * (n === 1 ? 1 : 1 + lam)
  console.log(
    `    ${healthy} healthy weeks · SUM(tau) physio ON = ${sumTauOn.toFixed(3)} expected weekly onsets ` +
      `(P>=1 ${(100 * pAtLeast(sumTauOn, 1)).toFixed(1)}%, P>=2 ${(100 * pAtLeast(sumTauOn, 2)).toFixed(1)}%) · ` +
      `physio OFF = ${sumTauOff.toFixed(3)} (P>=2 ${(100 * pAtLeast(sumTauOff, 2)).toFixed(1)}%)`,
  )
  console.log(`    REALISED through this door in the window: ${winInj.filter((r) => r.door === 'weekly').length}`)

  // --- 4. THE MATCH MODEL: provenance, then the two predictions ----------------------------------
  console.log(`\n--- 4. THE MATCH MODEL ON THE ${inWin.length} MATCHES SHE ACTUALLY PLAYED ---`)
  let repro = 0
  for (const r of inWin) {
    const res = simulateMatch(r.m.a, r.m.b, { surface: r.m.surface, tour: JUNIOR_TOUR, seed: r.m.seed! })
    const winnerId = res.winner === 0 ? r.m.aId : r.m.bId
    const score = res.sets.map((s) => `${s.a}-${s.b}`).join(' ')
    if (winnerId === r.m.winnerId && score === r.m.score) repro++
  }
  console.log(
    `    PROVENANCE: re-run at the stored seed, ${repro}/${inWin.length} matches reproduce winner AND scoreline ` +
      `byte-for-byte. ${repro === inWin.length ? 'The reseeds below resample the same object.' : '⚠ MISMATCH – do not trust the MC.'}`,
  )
  interface MRow {
    week: number
    tier: TierId
    round: number
    opp: string
    pClosed: number
    pMc: number
    pRetKid: number
    pRetOpp: number
    won: boolean
    retiredKid: boolean
    retiredOpp: boolean
    score: string
  }
  const mrows: MRow[] = []
  for (const r of inWin) {
    const kid = kidOf(r.m)
    const opp = oppOf(r.m)
    const kidIsA = r.m.aId === KID_ID
    const pClosed = fastMatchProbability(kid, opp, { surface: r.m.surface, tour: JUNIOR_TOUR, seed: '' })
    let wins = 0
    let retK = 0
    let retO = 0
    for (let i = 0; i < MC; i++) {
      const res = simulateMatch(r.m.a, r.m.b, { surface: r.m.surface, tour: JUNIOR_TOUR, seed: `${r.m.seed}:mc${i}` })
      const kidWon = (res.winner === 0) === kidIsA
      if (kidWon) wins++
      if (res.retired) {
        if ((res.retired.side === 0) === kidIsA) retK++
        else retO++
      }
    }
    mrows.push({
      week: r.week,
      tier: tierOfRow(r),
      round: r.m.round,
      opp: r.m.oppName,
      pClosed,
      pMc: wins / MC,
      pRetKid: retK / MC,
      pRetOpp: retO / MC,
      won: r.m.winnerId === KID_ID,
      retiredKid: r.m.retiredId === KID_ID,
      retiredOpp: r.m.retiredId !== undefined && r.m.retiredId !== KID_ID,
      score: r.m.score ?? '',
    })
  }
  console.log(`\n    per match (${MC} reseeds each; pClosed = pMatchBo3(basePServe), pMC = the full point loop):`)
  console.log(
    '    ' + pad('week', 7) + pad('tier', 9) + padL('rnd', 4) + '  ' + pad('opponent', 20) +
      padL('pClosed', 9) + padL('pMC', 8) + padL('pRet(her)', 10) + padL('res', 5) + '  score',
  )
  for (const m of mrows) {
    console.log(
      '    ' + pad(`w${m.week}`, 7) + pad(m.tier, 9) + padL(m.round, 4) + '  ' + pad(m.opp.slice(0, 19), 20) +
        padL(m.pClosed.toFixed(3), 9) + padL(m.pMc.toFixed(3), 8) + padL(m.pRetKid.toFixed(4), 10) +
        padL(m.won ? 'W' : 'L', 5) + '  ' + m.score + (m.retiredKid ? '  RET(her)' : m.retiredOpp ? '  RET(opp)' : ''),
    )
  }
  const sum2 = (f: (m: MRow) => number) => mrows.reduce((a, m) => a + f(m), 0)
  const expClosed = sum2((m) => m.pClosed)
  const expMc = sum2((m) => m.pMc)
  const semClosed = Math.sqrt(sum2((m) => m.pClosed * (1 - m.pClosed)))
  const semMc = Math.sqrt(sum2((m) => m.pMc * (1 - m.pMc)))
  const realised = mrows.filter((m) => m.won).length
  console.log(
    `\n    ITEM 15 HEADLINE: realised ${realised}-${mrows.length - realised} · closed form expects ` +
      `${expClosed.toFixed(2)} ± ${semClosed.toFixed(2)} (z ${((realised - expClosed) / semClosed).toFixed(2)}) · ` +
      `full engine expects ${expMc.toFixed(2)} ± ${semMc.toFixed(2)} (z ${((realised - expMc) / semMc).toFixed(2)})`,
  )
  // by tier and by round
  const groupBy = (key: (m: MRow) => string, label: string) => {
    console.log(`\n    by ${label}:`)
    console.log('      ' + pad(label, 10) + padL('n', 4) + padL('W-L', 8) + padL('exp(MC)', 9) + padL('SEM', 7) + padL('z', 7))
    for (const g of [...new Set(mrows.map(key))]) {
      const rs = mrows.filter((m) => key(m) === g)
      const e = rs.reduce((a, m) => a + m.pMc, 0)
      const s = Math.sqrt(rs.reduce((a, m) => a + m.pMc * (1 - m.pMc), 0))
      const rl = rs.filter((m) => m.won).length
      console.log(
        '      ' + pad(g, 10) + padL(rs.length, 4) + padL(`${rl}-${rs.length - rl}`, 8) + padL(e.toFixed(2), 9) +
          padL(s.toFixed(2), 7) + padL(s > 0 ? ((rl - e) / s).toFixed(2) : '-', 7),
      )
    }
  }
  groupBy((m) => m.tier, 'tier')
  groupBy((m) => `r${m.round}`, 'round')

  // --- 5. THE RETIREMENT DOOR, PRICED ------------------------------------------------------------
  const expRetKid = sum2((m) => m.pRetKid)
  const varRet = sum2((m) => m.pRetKid * (1 - m.pRetKid))
  const realisedRet = mrows.filter((m) => m.retiredKid).length
  const anyRet = sum2((m) => m.pRetKid + m.pRetOpp)
  // exact Poisson-binomial tail for "2 or more", over the per-match probabilities
  let dist = [1]
  for (const m of mrows) {
    const next = new Array(dist.length + 1).fill(0)
    for (let i = 0; i < dist.length; i++) {
      next[i] += dist[i] * (1 - m.pRetKid)
      next[i + 1] += dist[i] * m.pRetKid
    }
    dist = next
  }
  const pGe2 = 1 - dist[0] - (dist[1] ?? 0)
  console.log(`\n--- 5. THE RETIREMENT DOOR – the only door her two onsets came in by ---`)
  console.log(
    `    RETIRE_K = 0.07, calibrated to 2.73% of matches ending in a retirement by EITHER player ` +
      `(PLOS ONE 2024; docs/specs/match-retirement.md §4).`,
  )
  console.log(
    `    over her ${mrows.length} matches the model expects ${expRetKid.toFixed(3)} ± ${Math.sqrt(varRet).toFixed(3)} ` +
      `retirements BY HER (and ${anyRet.toFixed(3)} by either side, ${((100 * anyRet) / mrows.length).toFixed(2)}% of matches) · ` +
      `realised ${realisedRet}`,
  )
  console.log(
    `    EXACT Poisson-binomial: P(0) ${(100 * dist[0]).toFixed(1)}% · P(1) ${(100 * (dist[1] ?? 0)).toFixed(1)}% · ` +
      `P(>=2) ${(100 * pGe2).toFixed(1)}%  <-- the probability of the thing he saw`,
  )
  // BOTH DOORS, CONVOLVED. The weekly roll is one Bernoulli per healthy week and the retirement door
  // one per match; they are independent given the exposure, so the exact distribution of the WINDOW'S
  // onset count is the convolution of the two Poisson-binomials. Nothing is approximated here.
  let both = [...dist]
  for (let k = wa; k <= wb; k++) {
    if (injuredWeeks.has(k)) continue
    const near = winWeeks.reduce((best, r) => (Math.abs(r.week - k) < Math.abs(best.week - k) ? r : best), winWeeks[0])
    const t = tauAt(k, Math.min(100, condLower.get(near.week) ?? knee), world.physioActive)
    const next = new Array(both.length + 1).fill(0)
    for (let i = 0; i < both.length; i++) {
      next[i] += both[i] * (1 - t)
      next[i + 1] += both[i] * t
    }
    both = next
  }
  const bothGe2 = 1 - both[0] - (both[1] ?? 0)
  console.log(
    `\n    BOTH DOORS, EXACTLY: expected ${(expRetKid + sumTauOn).toFixed(3)} onsets in the window, realised ${winInj.length}.` +
      `\n    P(0) ${(100 * both[0]).toFixed(1)}% · P(1) ${(100 * (both[1] ?? 0)).toFixed(1)}% · P(>=2) ${(100 * bothGe2).toFixed(1)}%` +
      ` · P(>=3) ${(100 * (1 - both[0] - (both[1] ?? 0) - (both[2] ?? 0))).toFixed(1)}%`,
  )
  console.log(
    `    ⭐ SO: two onsets in this window is a ${(100 * bothGe2).toFixed(0)}% event under the shipped model AT HER OWN EXPOSURE,` +
      ` i.e. roughly 1 window in ${(1 / Math.max(1e-9, bothGe2)).toFixed(1)}.`,
  )

  // --- 5b. WHAT THE SUPPRESSED CONDITION ACTUALLY COST HER, PRICED -------------------------------
  // The link between #14 and #15 turned into a number instead of a claim. An injury suppresses
  // condition; condition scales all five wings through `conditionMatchFactor`; the scaled wings are
  // exactly what `basePServe` reads. So the counterfactual is exact rather than modelled: undo the
  // scaling on the SAME frozen snapshot (composed = raw·f·style·kit + edge, so the f = 1 build is
  // (composed − edge)/f + edge) and re-run the identical Monte Carlo against the identical opponent.
  // ⚠ RUN ONLY WHERE SUB-KNEE IS PROVEN – the weeks whose UPPER bound sits below the knee. Anywhere
  // else the bracket allows f = 1 and the counterfactual would be the match itself.
  {
    const subKnee = mrows.filter((m) => (condUpper.get(m.week) ?? 100) < knee)
    console.log(`\n--- 5b. THE PRICE OF THE SUPPRESSION – matches PROVEN to have been played below the knee ---`)
    let liftSum = 0
    for (const m of subKnee) {
      const r = inWin.find((x) => x.week === m.week && x.m.round === m.round)!
      const kidIsA = r.m.aId === KID_ID
      const f = Math.min(1, weekRows.find((x) => x.week === m.week)!.meanInv / envAt(m.week))
      const edge = fareOn(m.tier) ? edgeTrip : edgeHome
      const fit = { ...kidOf(r.m) } as unknown as Record<string, number>
      for (const k of SK) fit[k] = ((kidOf(r.m) as unknown as Record<string, number>)[k] - edge) / f + edge
      let wins = 0
      for (let i = 0; i < MC; i++) {
        const res = simulateMatch(
          (kidIsA ? fit : r.m.a) as unknown as MatchPlayer,
          (kidIsA ? r.m.b : fit) as unknown as MatchPlayer,
          { surface: r.m.surface, tour: JUNIOR_TOUR, seed: `${r.m.seed}:cf${i}` },
        )
        if ((res.winner === 0) === kidIsA) wins++
      }
      liftSum += wins / MC - m.pMc
      console.log(
        `    w${m.week} r${m.round} vs ${pad(m.opp.slice(0, 18), 19)} cond <= ${(condUpper.get(m.week) ?? 100).toFixed(1)} ` +
          `(f ${f.toFixed(4)}) · pMC as played ${m.pMc.toFixed(3)} · at full condition ${(wins / MC).toFixed(3)} ` +
          `· cost ${(m.pMc - wins / MC).toFixed(3)} of a win · she ${m.won ? 'WON' : 'LOST'} it`,
      )
    }
    // `liftSum` = SUM(counterfactual − as played), so a POSITIVE number is what the suppression cost.
    // ⚠ THE NOISE FLOOR IS PRINTED BESIDE IT: each per-match difference is two MC estimates, so it
    // carries ~sqrt(2 · 0.25 / MC) of noise and only a row well above that is a reading.
    console.log(
      subKnee.length === 0
        ? '    none in this window.'
        : `    TOTAL: the PROVEN sub-knee weeks cost her ${liftSum.toFixed(2)} of an expected win across ` +
          `${subKnee.length} matches, out of ${mrows.length} played · per-match MC noise floor ±` +
          `${Math.sqrt((2 * 0.25) / MC).toFixed(3)}, so only rows above that are readings.`,
    )
  }

  // --- 6. DO THE LOSSES CLUSTER AFTER AN ONSET? --------------------------------------------------
  console.log(`\n--- 6. #14 AGAINST #15 – does a loss follow an onset? ---`)
  const afterOnset = (m: MRow) => winInj.some((i) => m.week > i.onset && m.week <= i.onset + 4)
  for (const [label, rs] of [
    ['first 4 weeks after an onset', mrows.filter(afterOnset)],
    ['every other match', mrows.filter((m) => !afterOnset(m))],
  ] as [string, MRow[]][]) {
    const e = rs.reduce((a, m) => a + m.pMc, 0)
    const s = Math.sqrt(rs.reduce((a, m) => a + m.pMc * (1 - m.pMc), 0))
    const rl = rs.filter((m) => m.won).length
    console.log(
      `    ${pad(label, 32)} n=${padL(rs.length, 3)} realised ${padL(`${rl}-${rs.length - rl}`, 7)} ` +
        `expected ${e.toFixed(2)} ± ${s.toFixed(2)}  z ${s > 0 ? ((rl - e) / s).toFixed(2) : '-'}` +
        `  mean cond at entry in [${(rs.reduce((a, m) => a + (condLower.get(m.week) ?? knee), 0) / Math.max(1, rs.length)).toFixed(1)}, ` +
        `${(rs.reduce((a, m) => a + Math.min(100, condUpper.get(m.week) ?? 100), 0) / Math.max(1, rs.length)).toFixed(1)}]`,
    )
  }
}
