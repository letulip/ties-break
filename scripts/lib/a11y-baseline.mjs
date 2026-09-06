// ⭐⭐ THE ACCESSIBILITY BASELINE'S ONE-WAY RATCHET, IN ONE PURE FUNCTION.
//
// `e2e/a11y-baseline.json` records the WCAG violations that were already in the app the day the scan
// landed (T-09, 06.09). Its own header says every entry is a DEBT and not a decision. A debt file has
// exactly one failure mode: nobody prunes it, the defects get fixed, the entries stay, and what began
// as a measured list of four real problems becomes an allowlist that would swallow the next four.
//
// `e2e/a11y.spec.ts` asserts the GROWTH direction – a violation with no entry fails the screen it is
// on, by name. It deliberately does not fail when a violation DISAPPEARS: failing somebody's screen
// because they improved it is the fastest way to teach them not to. So the SHRINK direction is
// checked once, over the whole run, and this is it.
//
// ⚠⚠ IT IS NOT A PLAYWRIGHT TEST, AND THAT IS A CORRECTION RATHER THAN A PREFERENCE. It was one
// first, and it was RACY: `scan()` appends a line per surface to `test-results/a11y-findings.jsonl`,
// and `playwright.config.ts` sets `fullyParallel: true`, so a TEST reading what the other tests
// wrote reads whatever has been flushed by then. Mutating `--ink-dim` to its fixed value made it
// fire and name TWO of the four stale entries; the file held all four moments later. A guard that is
// right most of the time is the worst kind, because it gets believed. Run from `scripts/e2e.mjs`
// after the suite exits, the log is complete by construction.
//
// ⚠ AND IT IS A PURE FUNCTION IN `scripts/lib/` SO IT CAN BE MUTATED WITHOUT A BROWSER. Two paths
// matter and both were watched: a fixed defect whose entry survives (it fires, naming the entry) and
// a run in which nothing changed (it says nothing). Neither needs Chromium to prove.

import { readFileSync } from 'node:fs'

/**
 * Which baseline entries no longer describe anything, given one run's findings.
 *
 * @param logPath      `test-results/a11y-findings.jsonl` – one JSON object per scanned surface.
 * @param baselinePath `e2e/a11y-baseline.json`.
 * @returns `null` when the question cannot be answered (no scan happened, so an empty log means "no
 *          measurement" and not "no violations"), otherwise the stale `surface / rule` keys.
 */
export function staleBaselineEntries(logPath, baselinePath) {
  let log
  try {
    log = readFileSync(logPath, 'utf8')
  } catch {
    return null // the scan did not run - see the axe warning in scripts/e2e.mjs
  }

  const scanned = log
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      // ⚠ A TORN LINE IS SKIPPED, NOT THROWN ON. Several Playwright workers append to this file. The
      // writes are one short line each and have never interleaved, but a bookkeeping artefact must
      // never be the thing that turns a green suite red.
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
  if (scanned.length === 0) return null

  const firing = new Set()
  const visited = new Set()
  for (const entry of scanned) {
    visited.add(entry.surface)
    for (const finding of entry.findings) firing.add(`${entry.surface} / ${finding.rule}`)
  }

  const { entries } = JSON.parse(readFileSync(baselinePath, 'utf8'))
  const stale = []
  for (const [surface, rules] of Object.entries(entries)) {
    // ⚠ ONLY SURFACES THIS RUN ACTUALLY VISITED. A surface the run never reached is not a fixed
    // defect; it is an unasked question, and reporting it as stale would delete an honest entry.
    if (!visited.has(surface)) continue
    for (const rule of Object.keys(rules)) {
      if (!firing.has(`${surface} / ${rule}`)) stale.push(`${surface} / ${rule}`)
    }
  }
  return stale
}
