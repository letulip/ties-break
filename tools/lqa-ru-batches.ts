// THE OWNER'S BATCHES, AS THE LQA ZERO-GATE READS THEM (L4-3).
//
// A batch is the doc a row of his tables came from, named as the importer's report names it (`ru-` and the date stripped). The gate
// (tools/lqa-ru-report.ts `evaluateGate`) needs four facts per batch – its name, how many rows carry a clean English cell, how many of
// those he has APPROVED / LANDED / ruled, and the catalog keys the rows resolve to – and this module is the only place they are derived,
// so the report tool stays dependency-free and the CLI (`tools/lqa-ru.ts`, which runs on import) stays untested glue.
import { coverageByBatch, type Compiled } from './i18n-import'
import type { GateBatch } from './lqa-ru-report'

/** The batch name for a table doc: `ru-onboarding-2026-10.md` -> `onboarding` (the importer report's own spelling). */
export function batchName(doc: string): string {
  return doc.replace(/^ru-|-20\d\d-\d\d\.md$/g, '')
}

export function knownBatches(compiled: Compiled): GateBatch[] {
  const counts = coverageByBatch(compiled)
  const batches: GateBatch[] = []
  for (const [doc, c] of counts) {
    const keys = new Set<string>()
    for (const o of compiled.outcomes) if (o.row.doc === doc && o.key !== undefined) keys.add(o.key)
    batches.push({ name: batchName(doc), rows: c.rows, approved: c.approved, keys: [...keys] })
  }
  return batches.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}
