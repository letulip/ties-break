// L4-3 – THE LQA MISS REPORT AND THE ZERO-GATE, ON SYNTHETIC ROUTES (tools/lqa-ru-report.ts, tools/lqa-ru-batches.ts).
//
// The runner (`npm run lqa:ru`) is a browser instrument and is not in `npm run check`; what IS in it is everything that happens to its
// output. These nets say what the report counts, how it ranks, and – the part with teeth – when the zero-gate may go green: only for
// a batch the owner has COMPLETED, and only if no key of that batch rendered in English on any route. Each arm below is a statement
// that fails if its function is mutated (the comment beside it says which line).
import { describe, expect, it } from 'vitest'
import { AREA_UNLISTED, TOP_N, buildReport, catalogAreaTotals, evaluateGate, renderConsole, renderMarkdown, summarizeRoute, type CatalogIndex, type GateBatch, type RouteRecord } from '../tools/lqa-ru-report'
import { batchName, knownBatches } from '../tools/lqa-ru-batches'
import { compile, listDocs, readRows, TABLES_DIR } from '../tools/i18n-import'
import { parseCatalog, seenLiterals, CATALOG_PATH } from '../tools/i18n-extract'
import { readFileSync } from 'node:fs'

const CATALOG: CatalogIndex = {
  Season: { area: ['screens'] },
  Calendar: { area: ['screens'] },
  'Rest it': { area: ['screens', 'lifebeat'] },
  'Week {0}': { area: ['scripts'] },
  Continue: { area: ['screens'] },
}

const visit = (label: string, keys: string[], misses = keys.length, capped = false) => ({ label, misses, keys, capped })
const record = (over: Partial<RouteRecord> & Pick<RouteRecord, 'route' | 'visits'>): RouteRecord => ({
  part: 'a',
  title: `route ${over.route}`,
  verdict: 'driven',
  why: '',
  notes: [],
  ...over,
})

describe('summarizeRoute – distinct keys by catalog area', () => {
  const route = record({
    route: 2,
    visits: [visit('Home', ['Season', 'Calendar', 'Week {0}', 'Not a key']), visit('Season', ['Season', 'Rest it'], 5)],
  })
  const s = summarizeRoute([route], CATALOG)

  it('counts a key once per route however many screens missed it, and a key of two areas in each', () => {
    expect(s.distinct).toBe(5) // Season, Calendar, Week {0}, Not a key, Rest it
    expect(s.misses).toBe(4 + 5)
    const area = Object.fromEntries(s.byArea.map((a) => [a.area, a.missed]))
    expect(area).toEqual({ screens: 3, scripts: 1, lifebeat: 1, [AREA_UNLISTED]: 1 }) // screens: Season, Calendar, Rest it
  })

  it('shows the denominator, so a row reads «3 of 4»', () => {
    const totals = catalogAreaTotals(CATALOG)
    expect(totals.get('screens')).toBe(4)
    expect(s.byArea.find((a) => a.area === 'screens')?.catalog).toBe(4)
  })

  it('ranks the top keys by the SCREENS that missed them, then by name; the cap is TOP_N', () => {
    expect(s.top[0]).toEqual({ key: 'Season', screens: 2, areas: ['screens'] })
    expect(s.top.slice(1).every((t) => t.screens === 1)).toBe(true)
    const many = record({ route: 3, visits: [visit('big', Array.from({ length: 60 }, (_, i) => `k${String(i).padStart(2, '0')}`))] })
    expect(summarizeRoute([many], {}).top).toHaveLength(TOP_N)
  })

  it('merges the parts of a route, takes the worst verdict, and keeps a capped floor visible', () => {
    const a = record({ route: 4, part: 'a', verdict: 'driven', why: 'one', visits: [visit('x', ['Season'])] })
    const b = record({ route: 4, part: 'b', verdict: 'partial', why: 'stopped', visits: [visit('y', ['Calendar'], 9, true)] })
    const merged = summarizeRoute([a, b], CATALOG)
    expect(merged.verdict).toBe('partial')
    expect(merged.parts).toEqual(['a', 'b'])
    expect(merged.capped).toBe(true)
    expect(merged.why).toBe('one | stopped')
  })

  it('reads «unlisted» for a key the catalog does not know – a seam the extractor missed, surfaced, never dropped', () => {
    expect(s.byArea.some((a) => a.area === AREA_UNLISTED && a.missed === 1)).toBe(true)
  })
})

describe('the report and its renderings', () => {
  const records = [record({ route: 1, visits: [visit('splash', ['Season'])] }), record({ route: 2, verdict: 'partial', why: 'the college year card is a gap', visits: [visit('Home', ['Calendar'])] })]
  const report = buildReport(records, CATALOG, { generatedAt: '2026-10-10T00:00:00.000Z', build: 'abc1234', ruKeys: 10, catalogKeys: 5496 })

  it('totals the routes and names every verdict in the markdown', () => {
    expect(report.total.distinct).toBe(2)
    const md = renderMarkdown(report)
    expect(md).toContain('| 1 | New career, 5 to 13 | driven | 1 | 1 | 1 |')
    expect(md).toContain('| 2 | School and junior tour | partial | 1 | 1 | 1 |')
    expect(md).toContain('a – route 1') // a part keeps its own title in the per-route listing
    expect(md).toContain('the college year card is a gap')
    expect(md).toContain('10 of 5496 catalog keys')
  })

  it('the report is plain English – the instrument writes no copy and the markdown holds no Cyrillic', () => {
    expect(/[\u0400-\u04FF]/.test(renderMarkdown(report))).toBe(false)
    expect(renderConsole(report).join('\n')).toContain('all routes')
  })
})

describe('the zero-gate', () => {
  const batches: GateBatch[] = [
    { name: 'onboarding', rows: 4, approved: 4, keys: ['Season', 'Continue'] },
    { name: 'money', rows: 4, approved: 3, keys: ['Calendar'] },
  ]
  const records = [record({ route: 1, visits: [visit('Home', ['Season', 'Week {0}'])] })]

  it('armed with no batch named it is VACUOUS: green, and it says it asserted nothing', () => {
    const g = evaluateGate([], batches, records)
    expect(g).toMatchObject({ armed: true, vacuous: true, pass: true })
    expect(g.lines.join('\n')).toMatch(/ARMED VACUOUSLY/)
    expect(g.lines.join('\n')).toContain('onboarding') // a complete batch is nameable, so it is offered
  })

  it('with only unfinished batches in his tables, nothing is nameable and the vacuous gate says so', () => {
    const g = evaluateGate([], [batches[1]!], records)
    expect(g.lines.join('\n')).toMatch(/no batch is complete/)
  })

  it('a batch he has not completed is RED even when none of its keys rendered – a name typed on a command line cannot manufacture a green', () => {
    const g = evaluateGate(['money'], batches, [record({ route: 1, visits: [visit('Home', [])] })])
    expect(g.pass).toBe(false)
    expect(g.lines.join('\n')).toMatch(/not marked done: 3 of 4 rows/)
  })

  it('a completed batch whose key rendered in English is RED and names the key', () => {
    const g = evaluateGate(['onboarding'], batches, records)
    expect(g.pass).toBe(false)
    expect(g.batches[0]?.hits).toEqual(['Season'])
    expect(g.lines.join('\n')).toMatch(/1 of its 2 keys still rendered in English: Season/)
  })

  it('a completed batch none of whose keys rendered is green – the keys OTHER batches own do not count against it', () => {
    const g = evaluateGate(['onboarding'], batches, [record({ route: 1, visits: [visit('Home', ['Week {0}', 'Calendar'])] })])
    expect(g.pass).toBe(true)
    expect(g.lines.join('\n')).toMatch(/green/)
  })

  it('an unknown batch is RED (a typo does not pass)', () => {
    expect(evaluateGate(['onbording'], batches, records).pass).toBe(false)
  })
})

describe('the batches, read from his real tables', () => {
  const catalog = parseCatalog(readFileSync(CATALOG_PATH, 'utf8'))
  const { rows } = readRows(listDocs(TABLES_DIR), TABLES_DIR)
  const known = knownBatches(compile(rows, { catalog, seen: seenLiterals }))

  it('a batch is a table doc minus its prefix and date, the importer report\'s own spelling', () => {
    expect(batchName('ru-onboarding-2026-10.md')).toBe('onboarding')
    expect(batchName('ru-life-beats-fork-2026-10.md')).toBe('life-beats-fork')
  })

  it('every batch has rows, never more approved than rows, a unique name, and keys that are catalog keys', () => {
    expect(known.length).toBeGreaterThan(20)
    expect(new Set(known.map((b) => b.name)).size).toBe(known.length)
    for (const b of known) {
      expect(b.rows, b.name).toBeGreaterThan(0)
      expect(b.approved, b.name).toBeLessThanOrEqual(b.rows)
      for (const k of b.keys) expect(catalog.keys[k], `${b.name}: ${k}`).toBeDefined()
    }
  })
})
