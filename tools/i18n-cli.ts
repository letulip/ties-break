// THE I18N COMMAND LINE – one entry for the three commands (wave L1b).
//
//   npm run i18n:extract [-- --dry]                regenerate src/i18n/catalog.en.json
//   npm run i18n:import  [-- --dry] [-- --verbose]   compile the owner's tables into src/i18n/ru.json + src/i18n/formats.ru.json (L3-T) + the report
//   npm run i18n:import  -- --mark-landed [doc.md …] [--dry]   HIS write-back: APPROVED -> LANDED for rows proven live
//   npm run i18n:check                             the gate that runs inside `npm run check`
//
// Scratch copies (tests, a rehearsal): `--tables <dir>` `--catalog <file>` `--ru <file>` `--formats <file>`.
//
// ⚠ ONE ENTRY FILE, ON PURPOSE. vite-node does not tell a module whether it is the entry, so a per-file
// «if run directly» guard is impossible; the libraries (`i18n-extract`, `i18n-import`, `i18n-check`) have no
// side effects beyond the walker's scan, and this file is the only place a command line is read.
import { readFileSync, writeFileSync } from 'node:fs'
import { runGate } from './i18n-check'
import { buildCatalog, CATALOG_PATH, parseCatalog, seenLiterals, writeCatalog } from './i18n-extract'
import { FORMATS_PATH, serializeFormats } from './i18n-formats'
import { applyLanded, compile, listDocs, planLanded, readRows, readRu, renderReport, RU_PATH, TABLES_DIR, writeRu } from './i18n-import'

const args = process.argv.slice(2)
const cmd = args[0]
const flag = (name: string): boolean => args.includes(name)
const value = (name: string): string | undefined => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

if (cmd === 'extract') {
  const { catalog, stats, seatProblems } = buildCatalog()
  const path = value('--catalog') ?? CATALOG_PATH
  if (!flag('--dry')) writeCatalog(catalog, path)
  console.log(`${flag('--dry') ? 'would write' : 'wrote'} ${path}: ${stats.keys} keys from ${stats.certainStrings} CERTAIN strings + ${stats.callSites} call sites (${stats.wrapped} wired, ${stats.multiHome} on several files, ${stats.dynamicCalls} dynamic t() calls: ${stats.dynamicDeclared} declared, ${stats.dynamicUndeclared} unreadable; ${stats.seats} declared seats reach ${stats.seatKeys} keys)`)
  for (const p of seatProblems) console.log(`  RED ${p.rule} @ ${p.seat}: ${p.detail}`)
  if (seatProblems.length > 0) process.exitCode = 1
} else if (cmd === 'import') {
  const dir = value('--tables') ?? TABLES_DIR
  const catalog = parseCatalog(readFileSync(value('--catalog') ?? CATALOG_PATH, 'utf8'))
  const ruPath = value('--ru') ?? RU_PATH
  const explicit = args.filter((a) => a.endsWith('.md')).map((a) => a.split('/').pop() ?? a)
  const { rows, stats } = readRows(listDocs(dir), dir)
  const live = { catalog, seen: seenLiterals }
  const compiled = compile(rows, live)
  if (flag('--mark-landed')) {
    const ru = readRu(ruPath) ?? {}
    const plan = planLanded(compiled, live, ru, dir, explicit.length > 0 ? explicit : undefined)
    for (const c of plan.changes) console.log(`${c.doc}:${c.line}\n  - ${c.before}\n  + ${c.after}`)
    for (const s of plan.skipped) console.log(`skipped ${s}`)
    if (!flag('--dry')) applyLanded(plan.changes, dir)
    console.log(`${flag('--dry') ? 'would flip' : 'flipped'} ${plan.changes.length} row(s) APPROVED -> LANDED, ${plan.skipped.length} skipped`)
  } else {
    for (const l of renderReport(compiled, stats, live, { verbose: flag('--verbose') })) console.log(l)
    const formatsPath = value('--formats') ?? FORMATS_PATH
    if (!flag('--dry')) {
      writeRu(compiled.entries, ruPath)
      writeFileSync(formatsPath, serializeFormats(compiled.formats))
    }
    console.log(`${flag('--dry') ? 'would write' : 'wrote'} ${ruPath}: ${compiled.entries.size} entries; ${formatsPath}: ${compiled.formats.size} formatter pattern(s)`)
  }
} else if (cmd === 'check') {
  const { lines, problems } = runGate()
  for (const l of lines) console.log(l)
  for (const p of problems) console.log(`  RED ${p.rule} @ ${p.where}: ${p.detail}`)
  if (problems.length > 0) process.exitCode = 1
} else {
  console.error('usage: i18n-cli.ts extract | import [--mark-landed] | check')
  process.exitCode = 2
}
