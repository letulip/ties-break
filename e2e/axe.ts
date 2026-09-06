// ⭐⭐⭐ THE ACCESSIBILITY SCANNER – axe-core, in the real browser, against WCAG 2 A and AA.
//
// T-09 (docs/review-principles-2026-09-05/06-tests-tooling.md): «real-browser accessibility is
// presence-only». The owner asked for this in those terms – «добавь пожалуйста, у нас приложение
// растет, нам нужна вся возможная уверенность в функционале.»
//
// ⚠⚠ WHAT THIS ADDS THAT `parity.spec.ts` CANNOT, said plainly, because two harnesses over the same
// ten screens invite «we already have that». Parity proves a control is PRESENT, VISIBLE and
// REACHABLE at four widths – its own header says so and says what it cannot see. It reads the
// accessibility TREE, so it is blind to every defect that lives in the tree's QUALITY: text at 3:1
// on its background, a button whose only name is an icon, a `role` that contradicts its element, a
// duplicate `id` an `aria-labelledby` then resolves to the wrong one of. All of those are present,
// visible and reachable. None of them is usable.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠⚠ THE ONE-COMMAND DEPENDENCY, AND IT IS NOT INSTALLED YET – READ THIS BEFORE FILING A BUG
// -------------------------------------------------------------------------------------------------
// `@axe-core/playwright` is not in `package.json` and not in `node_modules`. That is a deliberate,
// documented stop rather than an oversight, and the reason is `npm ci`:
//
//   `.github/workflows/ci.yml`'s `e2e` job runs `npm ci`, which REFUSES to run when `package.json`
//   names a dependency `package-lock.json` does not carry. Adding the package to one file without
//   the other therefore does not make this suite run in CI – it stops the whole `e2e` job before
//   the browser is even downloaded. The two files are updated together by one command, and that
//   command is an install:
//
//       npm i -D @axe-core/playwright        # 4.13.0; pulls axe-core 4.13.x. ~640 KiB, once.
//
// Until it is run, every axe test below SKIPS with that line in its annotation, `scripts/e2e.mjs`
// prints it on every run, and the rest of the e2e suite is untouched and green. The moment it IS
// run, both files move together, `npm ci` stays valid, and the CI job picks the tests up with NO
// workflow edit – the job runs `npm run test:e2e`, which is the whole suite.
//
// ⚠ THE SKIP IS THE HONEST FAILURE MODE HERE AND IT IS STILL A COMPROMISE. «A suite that starts red
// and gets an allowlist on day one teaches everyone to ignore it» – so does a suite that starts
// grey. The counterweight is that the skip is LOUD in three places (here, the spec's annotation,
// and the e2e runner's own output) and names the one command, on the pattern this repo already uses
// for the Chromium binary and for graphify's venv: print the install line rather than let a missing
// dependency look like a broken suite.
//
// ⚠ AND THE MEASUREMENT BELOW WAS TAKEN WITH THE PACKAGE PRESENT, not predicted. The baseline in
// `e2e/a11y-baseline.json` is a real reading from a real Chromium; `TB_AXE_MODULE` is how it was
// taken without writing into a shared `node_modules` (see below), and it is the same escape hatch
// anybody can use to re-take it before running the install.

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

// =================================================================================================
// THE RULE SETS – THE ONES THAT FIND REAL DEFECTS, NOT THE ONES THAT FIND THE MOST
// =================================================================================================
//
// ⚠ `wcag2a` + `wcag2aa` AND NOTHING ELSE, and the omissions are the decision. axe ships
// `best-practice` (opinions: heading order, landmark uniqueness, region), `wcag21aa`/`wcag22aa`
// (newer, and `target-size` alone would light up every icon button in the app on a judgement the
// owner has not made), and `experimental`. A first run that turns all of them on produces a number
// nobody can act on and a baseline that swallows the two or three findings that matter. Start with
// the ruleset that finds real defects; widen it deliberately, with the owner, once this one is at
// zero debt.
export const RULE_TAGS = ['wcag2a', 'wcag2aa'] as const

// =================================================================================================
// LOADING THE SCANNER
// =================================================================================================

/** The shape this file uses, written out rather than imported. A `import type` from a package that
 *  is not installed is a `vue-tsc` error, and `npm run check` runs `vue-tsc -b --force`. */
interface AxeNodeResult {
  target: unknown[]
  html: string
  failureSummary?: string
}
interface AxeViolation {
  id: string
  impact?: string | null
  help: string
  helpUrl: string
  nodes: AxeNodeResult[]
}
interface AxeBuilderLike {
  withTags(tags: string[]): AxeBuilderLike
  include(selector: string): AxeBuilderLike
  exclude(selector: string): AxeBuilderLike
  analyze(): Promise<{ violations: AxeViolation[] }>
}
type AxeBuilderCtor = new (args: { page: Page }) => AxeBuilderLike

export const INSTALL_LINE = 'npm i -D @axe-core/playwright'

/** Why the axe tests are skipping, in one sentence, or `null` when they are not. */
export const AXE_ABSENT_REASON =
  `@axe-core/playwright is not installed, so the WCAG scan cannot run. One command fixes it: ` +
  `${INSTALL_LINE} – it updates package.json AND package-lock.json together, which is what keeps ` +
  `\`npm ci\` (and therefore the CI e2e job) valid. See e2e/axe.ts's header for why this is not ` +
  `already committed.`

let cached: Promise<AxeBuilderCtor | null> | null = null

/**
 * The constructor, or `null` when the package is not there.
 *
 * ⚠ THE SPECIFIER IS A VARIABLE ON PURPOSE, AND IT IS NOT OBFUSCATION. `await import('@axe-core/
 * playwright')` written as a literal is a COMPILE error while the package is absent – TS2307, in
 * `vue-tsc -b --force`, which is inside `npm run check`. So the whole pre-push gate would go red on
 * a file whose entire job is to degrade gracefully when the package is missing. TypeScript does not
 * resolve a non-literal specifier, so the graceful path stays graceful. Delete the indirection the
 * day the dependency is declared.
 *
 * ⚠ `TB_AXE_MODULE` IS THE BOOTSTRAP, AND IT EXISTS BECAUSE OF THIS REPO'S LAYOUT. Agents work in
 * worktrees whose `node_modules` is a SYMLINK to the main checkout's, so an install here would
 * rewrite the owner's tree and produce a gate that is not this repo's gate. Pointing at an
 * extracted copy (`npm pack` into a scratch directory) takes the measurement without writing a byte
 * into a shared tree. It is not a mode anybody needs after the install line above has been run.
 */
export function axeBuilder(): Promise<AxeBuilderCtor | null> {
  cached ??= (async () => {
    const candidates = ['@axe-core/playwright', process.env.TB_AXE_MODULE]
    for (const specifier of candidates) {
      if (!specifier) continue
      try {
        const mod = (await import(specifier)) as { default?: AxeBuilderCtor; AxeBuilder?: AxeBuilderCtor }
        const ctor = mod.AxeBuilder ?? mod.default
        if (ctor) return ctor
      } catch {
        // the next candidate, or `null` – which is a skip and not a failure
      }
    }
    return null
  })()
  return cached
}

// =================================================================================================
// ONE SCAN
// =================================================================================================

/** A violation, flattened to the two things a baseline can be honest about: which rule, and how
 *  many elements it fired on. */
export interface Finding {
  rule: string
  impact: string
  nodes: number
  help: string
  /** The first few offending elements, so a red run names a place and not only a rule. */
  where: string[]
  /** axe's own summary for the first offending element – for `color-contrast` this carries the
   *  measured ratio and the two colours, which is what makes a baseline entry actionable rather
   *  than a rule name somebody has to re-measure. */
  detail: string
}

/** One surface's whole result. `surface` is the key the baseline is written against. */
export interface ScanResult {
  surface: string
  findings: Finding[]
}

function targetOf(node: AxeNodeResult): string {
  // axe's `target` is an array of selectors, one per frame depth; this app has no frames, so it is
  // one string – but it is typed loosely enough that a nested array is possible, hence the flatten.
  return node.target.flat(Infinity).join(' ')
}

/**
 * Run axe over the page as it stands.
 *
 * ⚠ `include` / `exclude` ARE THE DIALOG STORY. When an overlay is open, the app behind it is still
 * in the DOM – `dialogFocus.ts` says so in its own header: «it does not mark the rest of the app
 * inert … a MOUSE can still reach the page behind a dialog». So a full-page scan while a dialog is
 * up reports the SCREEN's debt again, attributed to the dialog. Scanning the dialog's own card is
 * the claim worth making, and it is the claim the caller asks for.
 */
export async function scan(
  page: Page,
  surface: string,
  options: { include?: string } = {},
): Promise<ScanResult> {
  const Builder = await axeBuilder()
  if (!Builder) throw new Error(AXE_ABSENT_REASON)

  let builder = new Builder({ page }).withTags([...RULE_TAGS])
  if (options.include) builder = builder.include(options.include)

  const { violations } = await builder.analyze()
  const findings: Finding[] = violations
    .map((v) => ({
      rule: v.id,
      impact: v.impact ?? 'unknown',
      nodes: v.nodes.length,
      help: v.help,
      where: v.nodes.slice(0, 4).map(targetOf),
      detail: (v.nodes[0]?.failureSummary ?? '').replace(/\s+/g, ' ').trim(),
    }))
    .sort((a, b) => a.rule.localeCompare(b.rule))

  record({ surface, findings })
  return { surface, findings }
}

// =================================================================================================
// THE RUN LOG – SO A BASELINE IS TRANSCRIBED FROM A MEASUREMENT, NEVER GUESSED AT
// =================================================================================================
//
// ⚠ ONE JSON OBJECT PER LINE, APPENDED. Playwright runs workers in separate PROCESSES, so a module
// level array would be one array per worker and the last writer would win. An append of a single
// line is the cheapest thing that survives that. `test-results/` is already gitignored (it holds
// traces and videos), so this is a run artefact and never a committed one.
const REPORT = resolve(fileURLToPath(new URL('../test-results/', import.meta.url)), 'a11y-findings.jsonl')

function record(result: ScanResult): void {
  try {
    mkdirSync(dirname(REPORT), { recursive: true })
    appendFileSync(REPORT, JSON.stringify(result) + '\n')
  } catch {
    // the log is a convenience for whoever re-takes the baseline; it must never fail a run
  }
}

// =================================================================================================
// THE BASELINE
// =================================================================================================

/** One debt entry: a rule that fires on a surface today, with a ceiling and a reason. */
export interface BaselineEntry {
  /** How many elements it fires on. A CEILING, in the shape of `scripts/pin-ratchet.mjs`. */
  nodes: number
  /** What it is, and what closing it would take. Required – an entry with no reason is a disable. */
  why: string
}

export type Baseline = Record<string, Record<string, BaselineEntry>>

interface BaselineFile {
  entries: Baseline
}

const BASELINE_PATH = fileURLToPath(new URL('./a11y-baseline.json', import.meta.url))

export function loadBaseline(): Baseline {
  const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as BaselineFile
  return parsed.entries
}

/** Every surface named in the baseline, so a stale entry can be reported by name. */
export function baselineSurfaces(baseline: Baseline): string[] {
  return Object.keys(baseline).sort()
}

/**
 * ⭐⭐ THE VERDICT, AND THE TWO WAYS IT GOES RED.
 *
 *  1. A rule with NO baseline entry for this surface – a new defect. Named, with the elements.
 *  2. A rule that fires on MORE elements than the entry allows – the debt grew.
 *
 * ⚠ IT DELIBERATELY DOES NOT GO RED WHEN THE DEBT SHRINKS, and the ratchet that catches THAT is a
 * separate test over the whole run (`no baseline entry is guarding nothing`). Failing a screen's own
 * test because somebody improved it would be the most direct way possible to teach people not to.
 */
export function unbaselinedFailures(result: ScanResult, baseline: Baseline): string[] {
  const allowed = baseline[result.surface] ?? {}
  const out: string[] = []
  for (const f of result.findings) {
    const entry = allowed[f.rule]
    if (!entry) {
      out.push(
        `${f.rule} (${f.impact}) on ${f.nodes} element(s): ${f.help}\n` +
          `      ${f.detail}\n` +
          `      at: ${f.where.join('\n      at: ')}\n` +
          `      This rule has no entry for "${result.surface}" in e2e/a11y-baseline.json. Fix it, ` +
          `or add an entry saying what it is and that it is debt.`,
      )
    } else if (f.nodes > entry.nodes) {
      out.push(
        `${f.rule} (${f.impact}) now fires on ${f.nodes} element(s); the baseline allows ` +
          `${entry.nodes}. The debt grew.\n      at: ${f.where.join('\n      at: ')}`,
      )
    }
  }
  return out
}
