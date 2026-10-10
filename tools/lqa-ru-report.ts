// THE LQA MISS REPORT – the pure half of `npm run lqa:ru` (L4-3, spec §6 «Runtime misses», §8 L4-3).
//
// WHAT IT TURNS INTO NUMBERS. Ruling 4 of the owner's contract (01.10): legacy English is not an acceptable visible fallback in
// Russian mode. `src/i18n`'s miss counter counts each render-time lookup that fell back to English under a non-English locale;
// the runner (e2e/lqa/) reads it after every screen it visits and writes one `RouteRecord` per route part. This module is
// everything that happens to those records afterwards: the per-route, per-AREA summary, the markdown, and the ZERO-GATE.
//
// ⚠ DEPENDENCY-FREE ON PURPOSE (no import, type or value). `tsconfig.e2e.json` is a composite project that must list every file
// it imports, and its own header says the rule is «dependency-free or not at all»; the Playwright specs import the record
// types from here, so this file has to be a leaf. The catalog and the importer's batches arrive as ARGUMENTS – the CLI
// (`tools/lqa-ru.ts`) reads them – which also makes every function below testable on synthetic data.
//
// ⚠ WHAT A «MISS» IS AND IS NOT (said once, here, because the report would otherwise be misread). The counter counts LOOKUPS, so
// a component that re-renders ten times counts a missing key ten times: `misses` is therefore a pressure gauge, not a head count of
// sentences a player saw. The honest unit is the DISTINCT KEY, which is why every table below is in distinct keys and why the
// top-20 ranks by the number of SCREENS a key was missed on (the translation that retires the most English first), not by raw count.
// And a key the walk never reached is not «translated», it is UNSEEN – the report counts what the routes rendered, and says so.

export type Verdict = 'driven' | 'partial' | 'gap'

/** One screen (or one state of a screen) the runner stood on, and what the counter said about it. */
export interface VisitRecord {
  label: string
  misses: number
  keys: string[]
  /** The distinct-key set hit its ceiling during this visit: `keys` is a floor. */
  capped: boolean
  /** Small measured facts about the page itself (viewport, horizontal overflow, html lang …) – never copy. */
  facts?: Record<string, string | number | boolean>
}

/** What one Playwright test writes: a route of RU-14's matrix, or a part of one (a route may take several seeded careers). */
export interface RouteRecord {
  route: number
  /** `a`, `b` … – parts of one route are merged by `route`. */
  part: string
  title: string
  verdict: Verdict
  /** Why it is not `driven`, or what it drove – one sentence. */
  why: string
  visits: VisitRecord[]
  notes: string[]
}

export const AREA_UNLISTED = '(not in the catalog)'

/** The rows of RU-14's acceptance matrix, in the report's own words. A route's parts (a career, a width) keep their own titles in the per-part list. */
export const ROUTE_NAMES: Readonly<Record<number, string>> = {
  1: 'New career, 5 to 13',
  2: 'School and junior tour',
  3: 'Move-out and college',
  4: 'Adult tour',
  5: 'The ending',
  6: 'Old .tsave',
  7: 'Phone / accessibility (375 and 320)',
  8: 'PWA / offline',
}
export const TOP_N = 20

export interface CatalogEntryLike {
  area: string[]
}
export type CatalogIndex = Readonly<Record<string, CatalogEntryLike | undefined>>

export interface AreaRow {
  area: string
  /** Distinct missed keys of this area on the route. A key that belongs to several areas counts in each of them. */
  missed: number
  /** Keys of the area in the catalog – the denominator, so a row reads «45 of 697». */
  catalog: number
}

export interface TopKey {
  key: string
  /** How many of the route's visits missed this key. */
  screens: number
  areas: string[]
}

export interface RouteSummary {
  route: number
  title: string
  verdict: Verdict
  why: string
  parts: string[]
  /** `a – <what that part walked>` for each part, for the per-route listing. */
  partTitles: string[]
  screens: number
  misses: number
  distinct: number
  capped: boolean
  byArea: AreaRow[]
  /** Keys the route asked for that the catalog does not know – a seam the extractor missed, named so it can be chased. */
  unlisted: string[]
  top: TopKey[]
  visits: { label: string; misses: number; distinct: number; capped: boolean }[]
  notes: string[]
}

const VERDICT_ORDER: Record<Verdict, number> = { driven: 0, partial: 1, gap: 2 }

/** The worst verdict wins: a route is only `driven` when every part was. */
function worst(a: Verdict, b: Verdict): Verdict {
  return VERDICT_ORDER[a] >= VERDICT_ORDER[b] ? a : b
}

export function catalogAreaTotals(catalog: CatalogIndex): Map<string, number> {
  const totals = new Map<string, number>()
  for (const entry of Object.values(catalog)) {
    for (const area of entry?.area ?? []) totals.set(area, (totals.get(area) ?? 0) + 1)
  }
  return totals
}

function areasOf(key: string, catalog: CatalogIndex): string[] {
  const a = catalog[key]?.area
  return a && a.length > 0 ? a : [AREA_UNLISTED]
}

function byAreaRows(keys: Iterable<string>, catalog: CatalogIndex, totals: Map<string, number>): AreaRow[] {
  const counts = new Map<string, number>()
  for (const key of keys) for (const area of areasOf(key, catalog)) counts.set(area, (counts.get(area) ?? 0) + 1)
  return [...counts.entries()]
    .map(([area, missed]) => ({ area, missed, catalog: totals.get(area) ?? 0 }))
    .sort((x, y) => y.missed - x.missed || (x.area < y.area ? -1 : 1))
}

export function summarizeRoute(records: readonly RouteRecord[], catalog: CatalogIndex, totals = catalogAreaTotals(catalog)): RouteSummary {
  const first = records[0]
  if (!first) throw new Error('summarizeRoute: no records')
  const distinct = new Set<string>()
  const screensPerKey = new Map<string, number>()
  let misses = 0
  let capped = false
  let verdict: Verdict = 'driven'
  const why = new Set<string>()
  const visits: RouteSummary['visits'] = []
  const notes: string[] = []
  for (const r of records) {
    verdict = worst(verdict, r.verdict)
    if (r.why.length > 0) why.add(r.why)
    notes.push(...r.notes)
    for (const v of r.visits) {
      misses += v.misses
      capped = capped || v.capped
      visits.push({ label: `${r.part}: ${v.label}`, misses: v.misses, distinct: new Set(v.keys).size, capped: v.capped })
      for (const key of new Set(v.keys)) {
        distinct.add(key)
        screensPerKey.set(key, (screensPerKey.get(key) ?? 0) + 1)
      }
    }
  }
  const top = [...screensPerKey.entries()]
    .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
    .slice(0, TOP_N)
    .map(([key, screens]) => ({ key, screens, areas: areasOf(key, catalog) }))
  return {
    route: first.route,
    title: ROUTE_NAMES[first.route] ?? first.title,
    verdict,
    why: [...why].join(' | '),
    parts: records.map((r) => r.part),
    partTitles: records.map((r) => `${r.part} – ${r.title}`),
    screens: visits.length,
    misses,
    distinct: distinct.size,
    capped,
    byArea: byAreaRows(distinct, catalog, totals),
    unlisted: [...distinct].filter((k) => !catalog[k]).sort(),
    top,
    visits,
    notes,
  }
}

export interface ReportMeta {
  generatedAt: string
  build: string
  ruKeys: number
  catalogKeys: number
}

export interface GateBatch {
  /** The batch's name as the owner reads it (`onboarding`, the doc minus `ru-` and the date). */
  name: string
  /** Rows with a clean English cell. */
  rows: number
  /** Of those, rows the owner has APPROVED / LANDED / ruled. */
  approved: number
  /** The catalog keys the batch's rows resolve to. */
  keys: string[]
}

export interface GateBatchVerdict {
  name: string
  known: boolean
  /** The owner's marks say the batch is complete: every row APPROVED / LANDED / ruled. */
  done: boolean
  rows: number
  approved: number
  keysInBatch: number
  /** Keys of the batch the routes rendered in English – each one is a ruling-4 violation. */
  hits: string[]
}

export interface GateVerdict {
  /** `--gate` was passed. */
  armed: boolean
  /** Armed with no batch to assert on – nothing was checked, and the verdict says so. */
  vacuous: boolean
  pass: boolean
  batches: GateBatchVerdict[]
  lines: string[]
}

export const DISARMED: GateVerdict = { armed: false, vacuous: false, pass: true, batches: [], lines: [] }

/** THE ZERO-GATE: for the batches the owner has marked done, no key of the batch may have rendered in English on any route. */
export function evaluateGate(requested: readonly string[], known: readonly GateBatch[], records: readonly RouteRecord[]): GateVerdict {
  const missed = new Set<string>()
  for (const r of records) for (const v of r.visits) for (const k of v.keys) missed.add(k)
  const lines: string[] = []
  if (requested.length === 0) {
    const complete = known.filter((b) => b.rows > 0 && b.approved === b.rows).map((b) => b.name)
    lines.push('zero-gate: ARMED VACUOUSLY – no batch was named, so nothing was asserted (exit 0 by construction, not by achievement).')
    lines.push(complete.length === 0 ? '  no batch is complete in the owner\'s tables today (every batch still has rows outside APPROVED / LANDED / ruled).' : `  batches complete in his tables, nameable now: ${complete.join(', ')}`)
    return { armed: true, vacuous: true, pass: true, batches: [], lines }
  }
  const verdicts: GateBatchVerdict[] = []
  for (const name of requested) {
    const batch = known.find((b) => b.name === name)
    if (!batch) {
      verdicts.push({ name, known: false, done: false, rows: 0, approved: 0, keysInBatch: 0, hits: [] })
      continue
    }
    const done = batch.rows > 0 && batch.approved === batch.rows
    const hits = done ? batch.keys.filter((k) => missed.has(k)).sort() : []
    verdicts.push({ name, known: true, done, rows: batch.rows, approved: batch.approved, keysInBatch: batch.keys.length, hits })
  }
  let pass = true
  for (const v of verdicts) {
    if (!v.known) {
      pass = false
      lines.push(`zero-gate: RED – «${v.name}» is not a batch (a batch is a table doc minus its \`ru-\` prefix and date).`)
    } else if (!v.done) {
      pass = false
      lines.push(`zero-gate: RED – «${v.name}» is not marked done: ${v.approved} of ${v.rows} rows are APPROVED / LANDED / ruled (the gate arms only batches the owner has completed).`)
    } else if (v.hits.length > 0) {
      pass = false
      lines.push(`zero-gate: RED – «${v.name}» is done (${v.approved}/${v.rows} rows) and ${v.hits.length} of its ${v.keysInBatch} keys still rendered in English: ${v.hits.slice(0, 10).join(' | ')}${v.hits.length > 10 ? ' …' : ''}`)
    } else {
      lines.push(`zero-gate: green – «${v.name}» is done (${v.approved}/${v.rows} rows) and none of its ${v.keysInBatch} keys rendered in English on any route.`)
    }
  }
  return { armed: true, vacuous: false, pass, batches: verdicts, lines }
}

export interface FullReport {
  meta: ReportMeta
  routes: RouteSummary[]
  total: { distinct: number; misses: number; byArea: AreaRow[] }
  gate: GateVerdict
}

export function buildReport(records: readonly RouteRecord[], catalog: CatalogIndex, meta: ReportMeta, gate: GateVerdict = DISARMED): FullReport {
  const totals = catalogAreaTotals(catalog)
  const ids = [...new Set(records.map((r) => r.route))].sort((a, b) => a - b)
  const routes = ids.map((id) =>
    summarizeRoute(
      records.filter((r) => r.route === id).sort((a, b) => (a.part < b.part ? -1 : 1)),
      catalog,
      totals,
    ),
  )
  const all = new Set<string>()
  let misses = 0
  for (const r of records) {
    for (const v of r.visits) {
      misses += v.misses
      for (const k of v.keys) all.add(k)
    }
  }
  return { meta, routes, total: { distinct: all.size, misses, byArea: byAreaRows(all, catalog, totals) }, gate }
}

const pad = (v: string | number, w: number): string => String(v).padEnd(w)

function areaTable(rows: readonly AreaRow[]): string[] {
  if (rows.length === 0) return ['_no key rendered in English on this route._']
  return ['| area | distinct keys missed | of the area in the catalog |', '| --- | ---: | ---: |', ...rows.map((r) => `| ${r.area} | ${r.missed} | ${r.catalog === 0 ? '–' : r.catalog} |`)]
}

export function renderMarkdown(report: FullReport): string {
  const out: string[] = []
  const { meta } = report
  out.push('# LQA runner – the Russian miss report', '')
  out.push(`Generated ${meta.generatedAt} from build \`${meta.build}\`. \`src/i18n/ru.json\` holds ${meta.ruKeys} of ${meta.catalogKeys} catalog keys, so nearly everything a route renders falls back to English – that is the honest first reading, and the table below is what the translation still owes, by area.`, '')
  out.push('**How to read it.** A *miss* is one render-time lookup that fell back to English under `ru` (ruling 4 as a number). The counter counts lookups, so a re-rendering component counts its key every time: `misses` is a pressure gauge, and the honest unit is the *distinct key*. A key the walk never reached is **unseen**, not translated – the report covers what the routes rendered.', '')
  out.push('## Routes', '')
  out.push('| # | route | verdict | screens | misses | distinct keys |', '| ---: | --- | --- | ---: | ---: | ---: |')
  for (const r of report.routes) out.push(`| ${r.route} | ${r.title} | ${r.verdict} | ${r.screens} | ${r.misses} | ${r.distinct}${r.capped ? ' (floor – a visit hit the cap)' : ''} |`)
  out.push('', `All routes together: **${report.total.distinct}** distinct keys rendered in English, ${report.total.misses} lookups.`, '')
  out.push('## All routes – distinct missed keys by catalog area', '', ...areaTable(report.total.byArea), '')
  for (const r of report.routes) {
    out.push(`## Route ${r.route} – ${r.title}`, '')
    out.push(`Verdict: **${r.verdict}**${r.why ? ` – ${r.why}` : ''}`, '')
    out.push(`Parts: ${r.partTitles.join('; ')}. ${r.screens} screens visited, ${r.misses} misses, ${r.distinct} distinct keys.`, '')
    out.push('Screens visited:', '', ...r.visits.map((v) => `- ${v.label} – ${v.misses} misses, ${v.distinct} distinct${v.capped ? ' (capped)' : ''}`), '')
    out.push('Distinct missed keys by area:', '', ...areaTable(r.byArea), '')
    if (r.unlisted.length > 0) out.push(`Keys asked for that the catalog does not know (${r.unlisted.length}): ${r.unlisted.slice(0, 12).map((k) => `\`${k.replace(/`/g, "'")}\``).join(', ')}`, '')
    if (r.top.length > 0) {
      out.push(`Top ${r.top.length} keys (by screens missed on):`, '')
      r.top.forEach((t, i) => out.push(`${i + 1}. \`${t.key.replace(/`/g, "'").replace(/\n/g, ' ')}\` – ${t.screens} screen(s) – ${t.areas.join(', ')}`))
      out.push('')
    }
    if (r.notes.length > 0) out.push('Notes:', '', ...r.notes.map((n) => `- ${n}`), '')
  }
  out.push('## The zero-gate', '')
  out.push(...(report.gate.armed ? report.gate.lines : ['not armed (`npm run lqa:ru -- --gate <batch…>` arms it).']), '')
  return out.join('\n')
}

/** The console table the CLI prints after a run. */
export function renderConsole(report: FullReport): string[] {
  const lines = [`${pad('route', 40)}${pad('verdict', 9)}${pad('screens', 9)}${pad('misses', 9)}distinct`]
  for (const r of report.routes) lines.push(`${pad(`${r.route} ${r.title}`.slice(0, 38), 40)}${pad(r.verdict, 9)}${pad(r.screens, 9)}${pad(r.misses, 9)}${r.distinct}${r.capped ? '+' : ''}`)
  lines.push(`${pad('all routes', 40)}${pad('', 9)}${pad('', 9)}${pad(report.total.misses, 9)}${report.total.distinct}`)
  return lines
}
