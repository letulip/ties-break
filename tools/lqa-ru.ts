// THE LQA RUNNER'S COMMAND LINE (L4-3) – `npm run lqa:ru`.
//
//   npm run lqa:ru                          drive RU-14's eight routes under tb-locale=ru, read the miss counter after every screen,
//                                           write lqa-out/lqa-ru-report.md + .json and print the per-route table
//   npm run lqa:ru -- --gate                arm the ZERO-GATE with no batch named: it says so, asserts nothing, exits 0
//   npm run lqa:ru -- --gate onboarding …   assert that no key of each named batch rendered in English on any route – and refuse a batch
//                                           the owner has not completed (every row APPROVED / LANDED / ruled in his tables)
//   npm run lqa:ru -- --skip-run            re-aggregate the route files of the last run (no browser) – the report and the gate only
//   npm run lqa:ru -- --out <dir>           where the route files and the report live (default lqa-out/, gitignored)
//
// ⚠ AN ON-DEMAND INSTRUMENT, NOT PART OF `npm run check` AND NOT PART OF `test:e2e`. It builds the app twice (the LQA hook compiled in,
// `VITE_TB_LQA=on`) and drives a real Chromium; the gate it would join is already ~7 minutes. Its product is a report, and its exit
// code says only whether the INSTRUMENT worked (Playwright ran, every route left a record) and whether an armed gate is green – a
// route that stopped early is `partial` in the report, not a failed run.
//
// ⚠ «MARKED BY THE OWNER» IS READ FROM HIS OWN TABLES, NOT FROM A FLAG A BUILDER CAN SET. A batch is a table doc minus `ru-` and its date
// (the importer's own naming); it is done when every row with a clean English cell is APPROVED, LANDED or ruled. `--gate onboarding` on a
// batch that is not done is RED with the count, so a name typed on a command line cannot manufacture a green. Today no batch is done:
// the gate arms vacuously-safely and says so.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CATALOG_PATH, parseCatalog, seenLiterals } from './i18n-extract'
import { compile, listDocs, readRows, readRu, TABLES_DIR } from './i18n-import'
import { knownBatches } from './lqa-ru-batches'
import { buildReport, DISARMED, evaluateGate, renderConsole, renderMarkdown, type GateVerdict, type RouteRecord } from './lqa-ru-report'

const args = process.argv.slice(2)
const flag = (name: string): boolean => args.includes(name)
const value = (name: string): string | undefined => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

/** The batch names after `--gate`, up to the next flag. */
function gateBatches(): string[] {
  const i = args.indexOf('--gate')
  if (i < 0) return []
  const out: string[] = []
  for (const a of args.slice(i + 1)) {
    if (a.startsWith('--')) break
    out.push(a)
  }
  return out
}

function readRecords(dir: string): RouteRecord[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => /^route-.*\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as RouteRecord)
}

function git(...a: string[]): string {
  const r = spawnSync('git', a, { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : ''
}

function main(): number {
  const out = resolve(value('--out') ?? 'lqa-out')
  mkdirSync(out, { recursive: true })
  let playwrightStatus = 0
  if (!flag('--skip-run')) {
    for (const f of readdirSync(out)) if (/^route-.*\.json$/.test(f) || /^lqa-ru-report\./.test(f)) rmSync(`${out}/${f}`)
    const run = spawnSync('npx', ['playwright', 'test', '-c', 'playwright.lqa.config.ts'], { stdio: 'inherit', env: { ...process.env, LQA_OUT: out } })
    playwrightStatus = run.status ?? 1
  }
  const records = readRecords(out)
  if (records.length === 0) {
    console.error('lqa:ru: no route left a record – the run did not get as far as a screen (see the Playwright output above).')
    return 1
  }
  const catalog = parseCatalog(readFileSync(CATALOG_PATH, 'utf8'))
  const ru = readRu() ?? {}
  const { rows } = readRows(listDocs(TABLES_DIR), TABLES_DIR)
  const compiled = compile(rows, { catalog, seen: seenLiterals })
  let gate: GateVerdict = DISARMED
  if (flag('--gate')) gate = evaluateGate(gateBatches(), knownBatches(compiled), records)
  const sha = git('rev-parse', '--short', 'HEAD') || 'unknown'
  const dirty = git('status', '--porcelain', '--', 'src', 'e2e', 'tools', 'playwright.lqa.config.ts') ? '+dirty' : ''
  const report = buildReport(records, catalog.keys, { generatedAt: new Date().toISOString(), build: `${sha}${dirty}`, ruKeys: Object.keys(ru).length, catalogKeys: Object.keys(catalog.keys).length }, gate)
  writeFileSync(`${out}/lqa-ru-report.json`, `${JSON.stringify({ ...report, records }, null, 2)}\n`)
  writeFileSync(`${out}/lqa-ru-report.md`, `${renderMarkdown(report)}\n`)
  for (const line of renderConsole(report)) console.log(line)
  for (const line of gate.lines) console.log(line)
  console.log(`report: ${out}/lqa-ru-report.md  (+ .json)`)
  const incomplete = report.routes.filter((r) => r.verdict !== 'driven')
  if (incomplete.length > 0) console.log(`not fully driven: ${incomplete.map((r) => `${r.route} (${r.verdict})`).join(', ')} – the reasons are in the report`)
  if (playwrightStatus !== 0) {
    console.error(`lqa:ru: Playwright exited ${playwrightStatus} – the instrument itself failed (a precondition, not a route's verdict).`)
    return 1
  }
  return gate.pass ? 0 : 1
}

process.exitCode = main()
