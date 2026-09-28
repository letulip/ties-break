// A-02 / T6.7 – THE UI IMPORTS THE OWNING MODULE, AND THE RULE IS A RATCHET BECAUSE THE BYTES WERE
// MEASURED AND THEY ARE NOT THERE.
//
// ⚠⚠ THIS GATE EXISTS BECAUSE THE FIX A-02 PROPOSED WAS MEASURED AND REFUSED, WHICH IS THE OPPOSITE
// OF THE USUAL ORDER, SO THE NUMBERS BELONG HERE. A-02 (`01-architecture.md:205`) asked for the 17
// UI runtime imports of `engine/world` to be repointed at their owning modules AND for a gate to hold
// the line, on the argument that the barrel drags 28,275 B of dead album corpus into the UI chunk.
// T6.7 built the repoint arm in a worktree at `e99956ed` and measured it (`npx vite build`, then
// `node scripts/install-size.mjs`, 18 files / 19 barrel import lines / 36 owning-module lines):
//
//     main chunk    707,351 → 707,345 B   (−6 B, and +45 B GZIPPED: 238,225 → 238,270)
//     worker chunk  663,952 → 663,952 B   hash D9jZhF4G unchanged, byte-identical
//     install       16,212 → 16,212 KiB   361 precache entries, 172 KiB of headroom, unchanged
//
// The repoint was therefore NOT shipped – a churn commit across 18 files that makes the download
// LARGER buys nothing – and the null result has two measured causes, both recorded in
// `docs/now-next-later.md`:
//
//   1. The 28,275 B were already collected by W3's T3.1 (`58ccb8f6`). Taken the way
//      `world/albumBook.ts:327-335` says to take it – counting the sentences `ALBUM_CORPUS` itself
//      holds, not a pair transcribed into a comment – **0 of 424 are in the main chunk and 424 of 424
//      are in the worker's**, which is the positive control that makes the 0 a measurement.
//   2. ⭐ The barrel cannot cost bytes, because it does not ship. Per-module attribution of the main
//      chunk's own source map puts `src/engine/world.ts` at **0 B of 707,351** – it is bodiless
//      (`principles-a04-barrel-no-bodies.test.ts`) and side-effect-free, so rollup erases it and
//      resolves each re-export to its owning module at build time. The 235-module composition of the
//      chunk is IDENTICAL with the barrel spelling and with the owning-module spelling; only the
//      minifier's identifier allocation moves, which is where the −6 B came from.
//
// ⚠ SO WHY A GATE AT ALL, WHEN THE FIX WAS REFUSED. Because the rule is no longer a bytes argument
// and does not need one. `CLAUDE.md`'s P4 block: «It is a frozen public surface... A symbol born in
// `world/*` is imported FROM ITS OWNING MODULE; the barrel carries only frozen names», and T6.6 froze
// that surface. The files below are non-conforming under a rule that landed this same wave, and a rule
// with no mechanism is the «кто вспомнит?» failure this project refuses. This is the activation: a NEW
// UI runtime import of the barrel is an error; today's set is grandfathered by path and converts when
// its file is next touched for its own reasons.
//
// ⚠ WHERE IT LIVES, AND THE PRECEDENT IS EXPLICIT. `scripts/engine-purity.mjs` is the other
// engine-import gate and A-02's proposal offered it this rule, but its whole sentence is invariant 1 –
// «no vue, no pinia, no UI directory» – and its own header records it ok'ing a hole for weeks. The
// ruling in `principles-a03-type-import-ratchet.test.ts` was to keep the sibling rule OUT of that
// script rather than make a gate say more than its name, and this follows it. A test is a real gate
// here: CI runs the `unit` project on every pull request (`.github/workflows/ci.yml`).
//
// ⚠⚠ RESOLVED SPECIFIERS, NEVER A SUBSTRING, AND THIS ONE IS NOT STYLE. `'../engine/world/constants'`
// CONTAINS `'../engine/world'`, so a substring gate calls the CONVERTED file an offender and the
// ratchet runs backwards – it would punish exactly the move it exists to ask for. Two pins in the tree
// already have that shape, aimed at files that import nothing from the engine at all
// (`tests/calendar-screen.test.ts:831`, `tests/trophy-podium.test.ts:339`, both
// `not.toContain('engine/world')`); they are correct about the files they read and they are not a
// model for a package-wide rule. Here every specifier is PARSED and RESOLVED against
// `src/engine/world.ts`.
//
// WHAT IT CLAIMS:
//   1. No file in A-02's seven UI zones that is not on the baseline imports a VALUE from the barrel.
//   2. A TYPE-ONLY import of the barrel from the UI stays allowed, for ever and with no grandfather –
//      A-02's proposal says so («type-only stays allowed») and it is erased at compile time, so it
//      moves no byte and adds no runtime edge.
//   3. The ratchet is ONE-WAY, asserted on synthetic input rather than promised in this comment.
//   4. No baseline entry is a directory prefix.
//   0. And the scanner has a non-empty denominator, so none of the above can pass by reading nothing.
//
// WHAT IT DOES NOT CLAIM: not that the baseline shrinks; not that the barrel is absent from the main
// chunk (that is a build fact, re-measurable with the arm above, and no unit test should assert on
// `dist/`); nothing about `src/stores`, which engine-purity's UI_DIRS lists but A-02's rule does not
// name and which imports no barrel name today – widening this sentence past the finding it enforces
// is the failure the header just described.
//
// MUTATION ARMS (all three run on the real tree at T6.7, both outputs quoted in the report):
//   A. `import { KID_ID } from '../engine/world'` added to `src/composables/weekAhead.ts` – a UI file
//      NOT on the baseline – turns case 1 red naming it; removing it is green.
//   B. converting a grandfathered file (`src/components/BracketTabs.vue` → `'../engine/world/constants'`)
//      leaves case 1 green – the one-way half, demonstrated on the real tree as well as on case 3.
//   C. `import type { WorldState } from '../engine/world'` in that same non-grandfathered UI file
//      leaves case 1 green – case 2's claim, demonstrated on the real tree.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { regions } from './helpers/source'

/** A-02's proposal item 2, verbatim: «no file under `components`, `composables`, `viz`, `prologue`,
 *  `art`, `audio` or `App.vue` imports `engine/world` at runtime». */
const ZONES: readonly string[] = [
  'src/components', 'src/composables', 'src/viz', 'src/prologue', 'src/art', 'src/audio', 'src/App.vue',
]

/** THE BASELINE – every file in those zones that imported a VALUE from the barrel on 28.09.2026,
 *  measured with the scanner below rather than listed by hand. **Exact paths only, and the arithmetic
 *  cannot express anything else** – the ruling in `principles-a03-type-import-ratchet.test.ts` is that
 *  «a dated prefix in a one-way ratchet is a hole that closes on its own schedule rather than on a
 *  measurement», and case 4 says it mechanically.
 *
 *  ⚠ A-02 counted 17; this is 18, and the difference is not drift in the rule. `ShopPanel.vue` did not
 *  exist when the review was taken – T6.3 extracted it out of `MoneyScreen.vue` earlier in this same
 *  wave, carrying `ASSET_NAME_MAX_CHARS` with it. The set is re-measured, never quoted.
 *
 *  ⚠ NOT ASSERTED, ON PURPOSE: that this equals today's offender set. It is allowed to be larger, for
 *  ever – see case 3. */
const GRANDFATHERED: readonly string[] = [
  'src/components/BracketTabs.vue',
  'src/components/ChildhoodPrologue.vue',
  'src/components/CollegeYearCard.vue',
  'src/components/NextTournamentPanel.vue',
  'src/components/PlanWeekSheet.vue',
  'src/components/PracticeFlow.vue',
  'src/components/SeasonHistoryTable.vue',
  'src/components/ShopPanel.vue',
  'src/components/TournamentFlow.vue',
  'src/components/screens/HomeScreen.vue',
  'src/components/screens/MoneyScreen.vue',
  'src/components/screens/MoreScreen.vue',
  'src/components/screens/SeasonScreen.vue',
  'src/components/screens/ThisWeekScreen.vue',
  'src/composables/buildInfo.ts',
  'src/composables/matchReadout.ts',
  'src/composables/tierState.ts',
  'src/composables/weekDays.ts',
]

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const BARREL = resolve(ROOT, 'src/engine/world.ts')
const SCRIPT_OPEN = 'lang="ts">'

const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]))

/** Every `.ts` and `.vue` file in A-02's seven zones. A zone that is a FILE (`src/App.vue`) counts as
 *  itself, which is why this does not just walk directories. */
function uiFiles(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = []
  for (const zone of ZONES) {
    const abs = resolve(ROOT, zone)
    const paths = statSync(abs).isDirectory() ? walk(abs) : [abs]
    for (const p of paths.filter((f) => f.endsWith('.ts') || f.endsWith('.vue'))) {
      out.push({ file: relative(ROOT, p), text: readFileSync(p, 'utf8') })
    }
  }
  return out
}

/** The script bodies a parser should see: a `.ts` file whole, a `.vue` file's `<script … lang="ts">`
 *  blocks (both spellings in the tree end in that marker, and six of the 95 SFCs are the non-`setup`
 *  form). ⚠ Cut with `regions` from `tests/helpers/source.ts`, never a raw `indexOf` – CLAUDE.md's
 *  rule and the reason it exists: a `-1` from the raw form widens the region to the whole file while
 *  the pin stays green. `regions` answers `[]` for an absent start marker, which for a `.vue` would
 *  mean READING NO IMPORTS AT ALL, so that case throws here rather than passing quietly. */
function scriptsOf(file: string, text: string): string[] {
  if (!file.endsWith('.vue')) return [text]
  const bodies = regions(text, SCRIPT_OPEN, '</script>').map((b) => b.slice(SCRIPT_OPEN.length))
  if (bodies.length === 0) {
    throw new Error(`${file}: no <script … ${SCRIPT_OPEN} block – the scanner would read this SFC as importing nothing`)
  }
  return bodies
}

interface Reach {
  file: string
  names: string[]
  kind: 'type' | 'value'
}

interface Census {
  reaches: Reach[]
  files: number
  vueFiles: number
  statements: number
}

/** Every import or re-export in the UI zones whose specifier RESOLVES to `src/engine/world.ts`.
 *  Takes its input so case 2 and case 3 can feed it synthetic files. */
function scan(files: { file: string; text: string }[]): Census {
  const reaches: Reach[] = []
  let statements = 0
  for (const { file, text } of files) {
    const abs = resolve(ROOT, file)
    for (const body of scriptsOf(file, text)) {
      const sf = ts.createSourceFile(abs, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
      for (const st of sf.statements) {
        if (!ts.isImportDeclaration(st) && !ts.isExportDeclaration(st)) continue
        if (!st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue
        statements += 1
        const spec = st.moduleSpecifier.text
        if (!spec.startsWith('.')) continue
        const target = resolve(dirname(abs), spec)
        if (target !== BARREL && target !== BARREL.replace(/\.ts$/, '')) continue
        const clause = ts.isImportDeclaration(st) ? st.importClause : null
        const nb = clause?.namedBindings
        const exportEls = ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)
          ? [...st.exportClause.elements]
          : []
        const els = nb && ts.isNamedImports(nb) ? [...nb.elements] : exportEls
        // Type-only = `import type { … }` on the statement, or every named binding carrying its own
        // `type` keyword. ⚠ A MIXED import is a VALUE import – it emits a runtime edge, and two of
        // the baseline's files are exactly that shape (`… , type PracticeCaution }`).
        const statementTypeOnly = clause?.isTypeOnly || (ts.isExportDeclaration(st) && st.isTypeOnly)
        const typeOnly = Boolean(statementTypeOnly || (els.length > 0 && els.every((el) => el.isTypeOnly)))
        reaches.push({
          file,
          names: els.map((el) => (el.propertyName ?? el.name).text),
          kind: typeOnly ? 'type' : 'value',
        })
      }
    }
  }
  return {
    reaches,
    files: files.length,
    vueFiles: files.filter((f) => f.file.endsWith('.vue')).length,
    statements,
  }
}

/** The ratchet's arithmetic, in one place so case 3 can feed it synthetic input. MEMBERSHIP ONLY,
 *  which is what makes it one-way: a baseline entry with no matching file contributes nothing.
 *  ⚠ EXACT EQUALITY, NOT `startsWith` – see case 4. */
const notGrandfathered = (files: readonly string[]): string[] =>
  files.filter((f) => !GRANDFATHERED.includes(f))

describe('A-02 · the UI imports the owning module, and the barrel only by grandfather', () => {
  it('⭐ the scanner has a non-empty denominator – no claim below can pass by reading nothing', () => {
    // ⚠ THE ONE ASSERTION THAT MAKES THE OTHERS MEAN ANYTHING. On 28.09 an A/B in this repo reported
    // IDENTICAL because both arms ran zero test files; a gate that walks zero files reports «no
    // offenders» in exactly the same words as a gate that walks the tree. Lower bounds, not equalities,
    // so deleting a component cannot redden it.
    const c = scan(uiFiles())
    expect(c.files, 'files scanned in A-02\'s seven UI zones').toBeGreaterThan(100)
    expect(c.vueFiles, 'of them SFCs, whose script block is cut with the marker helpers').toBeGreaterThan(80)
    expect(c.statements, 'import/re-export statements parsed').toBeGreaterThan(500)
    // And the scanner can SEE a barrel reach – asserted on synthetic input, because the day the
    // baseline finally empties this must not become a vacuous green.
    const synthetic = scan([{ file: 'src/composables/synthetic.ts', text: "import { KID_ID } from '../engine/world'\n" }])
    expect(synthetic.reaches.map((r) => `${r.file} ${r.kind} { ${r.names.join(', ')} }`)).toEqual([
      'src/composables/synthetic.ts value { KID_ID }',
    ])
  })

  it('⚠⚠ a NEW runtime `import { … } from \'…/engine/world\'` in the UI is an error', () => {
    const offenders = scan(uiFiles()).reaches.filter((r) => r.kind === 'value')
    const fresh = notGrandfathered([...new Set(offenders.map((r) => r.file))])
    const where = fresh.map((f) => {
      const r = offenders.find((o) => o.file === f)
      return `${f} imports { ${r?.names.join(', ')} } from the barrel`
    })
    expect(
      where,
      'a UI file imports a value from `engine/world` – import it from the module that OWNS it ' +
        '(`node scripts/world-map.mjs <symbol>` names it). The baseline in this file is the set that ' +
        'predates the rule; it is not a place to add to, and T6.7 measured that converting it frees ' +
        'no bytes, so convert a file when you are in it for another reason.',
    ).toEqual([])
  })

  it('⭐ a TYPE-ONLY import of the barrel from the UI stays allowed – A-02\'s own exemption', () => {
    // Erased at compile time: no runtime edge, no byte. `src/db/saves.ts:4` is this shape outside the
    // UI zones and is the reason A-02's verification named a route that does not exist at runtime.
    // ⚠ Synthetic, because no UI file has this shape today – and a claim about a shape the tree does
    // not hold can only be asserted on input the test supplies.
    const c = scan([
      { file: 'src/composables/synthetic.ts', text: "import type { WorldState } from '../engine/world'\n" },
      { file: 'src/components/Synthetic.vue', text: '<script setup lang="ts">\nimport { type WorldState } from \'../engine/world\'\n</script>\n' },
    ])
    expect(c.reaches.map((r) => r.kind), 'both spellings of type-only').toEqual(['type', 'type'])
    expect(
      notGrandfathered([...new Set(c.reaches.filter((r) => r.kind === 'value').map((r) => r.file))]),
      'a type-only reach is not an offender, and no grandfather is needed for one',
    ).toEqual([])
  })

  it('⭐ the ratchet is ONE-WAY: a grandfathered file that converts or vanishes cannot fail it', () => {
    expect(notGrandfathered([]), 'every grandfathered file converted at once: still green').toEqual([])
    expect(notGrandfathered(['src/components/BracketTabs.vue']), 'one stays behind: still green').toEqual([])
    expect(
      notGrandfathered(['src/composables/weekAhead.ts']),
      'and a UI file NOT on the baseline is named the moment it reaches for the barrel',
    ).toEqual(['src/composables/weekAhead.ts'])
  })

  it('⭐⭐ and NO entry is a directory – the hole that would close on its own schedule', () => {
    expect(
      GRANDFATHERED.filter((g) => g.endsWith('/') || !/\.(ts|vue)$/.test(g)),
      'every baseline entry is one .ts or .vue file – a directory prefix is not a grandfather',
    ).toEqual([])
    expect(
      notGrandfathered(['src/components/screens/ANewScreen.vue']),
      'a new screen is NOT covered by the fact that its siblings are grandfathered',
    ).toEqual(['src/components/screens/ANewScreen.vue'])
  })
})
