// THE ENGINE NEVER IMPORTS THE PRESENTATION LAYER – invariant 1's OTHER half, and R2-06's spine.
//
// ⚠ WHY THIS EXISTS WHEN `scripts/engine-purity.mjs` ALREADY RUNS IN `npm run check`. That script
// enforces invariant 1 against PACKAGES: `vue`, `pinia`, `@vue/*`, `@vueuse/*`, `vue-router`. It is
// blind to the layer boundary INSIDE `src/`, and `src/viz` is neither vue nor pinia – so for the
// whole life of that gate three engine modules imported presentation contracts, a runtime clock and
// a court geometry out of `src/viz`, and both the script and the PR template's «No Vue/Pinia imports
// into engine modules» checkbox reported green. R2-06 / ARCH-04 is that gap, and this file closes it:
//
//   src/engine/match/matchStats.ts:23  import type { AnnotatedMatch }   from '../../viz/types'
//   src/engine/match/matchStats.ts:29  import { matchDurationSeconds }  from '../../viz/matchClock'
//   src/engine/match/rally.ts:8-17     import type { Rally, Shot, … }   from '../../viz/types'
//   src/engine/match/rally.ts:18       import { COURT }                 from '../../viz/types'
//   src/engine/match/serveSpeed.ts:33  import type { AnnotatedPoint }   from '../../viz/types'
//
// Those five are gone. This test is what stops them growing back, because nothing else would notice:
// there is no runtime CYCLE in them (`tests/import-cycles.test.ts` was green throughout), the match
// outcomes never depended on `viz`, and the app builds and runs perfectly with the arrow backwards.
// A direction fault is invisible to every gate that measures behaviour. It needs a gate that
// measures DIRECTION.
//
// ⚠⚠ AND IT COUNTS `import type`, WHICH IS EXACTLY WHERE THIS TEST DIVERGES FROM
// `tests/import-cycles.test.ts` – on purpose, and the two are answering different questions.
// That file asks "can this deadlock a browser at module-init time?", so a type edge is correctly
// ignored: TypeScript erases it and it cannot deadlock anything. THIS file asks "who owns this
// concept?", and a type edge answers that question just as loudly as a value edge – four of the
// five faults above were `import type`, and `AnnotatedPoint` reaching into the engine's serve model
// is the same inverted ownership whether or not a byte survives compilation. `engine-purity.mjs`
// made the same call for the same reason: "Type-only imports are banned too: `import type` erases at
// runtime, but an engine type reaching into a component's shape is the same coupling one refactor
// later."
//
// ⚠ THE FIX SHAPE THIS GUARD ASSUMES, so a reader who trips it knows where to go. A presentation
// CONTRACT both sides need (the rally/court vocabulary, `COURT` itself) belongs in a neutral leaf –
// `src/shared/matchViz.ts`, which `src/viz/types.ts` re-exports so no consumer moved. A module that
// is presentation and only presentation (the box score) belongs under `src/viz/match/`. What must
// never happen again is the third option: leaving it in the engine and importing `viz`.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve, sep } from 'node:path'

const ROOT = fileURLToPath(new URL('../', import.meta.url))

/** The framework-free zones invariant 1 names, and the same four `scripts/engine-purity.mjs` walks. */
const ENGINE_ZONES = ['src/engine', 'src/worker', 'src/db', 'src/shared']

/**
 * THE PRESENTATION SURFACE. `src/viz` is the one R2-06 is about and the only one that was ever
 * violated; the rest are here because the rule is the same rule and holding them costs nothing –
 * measured on 24.08, the four engine zones import ZERO files from any of these, so this list is a
 * ratchet on a clean baseline rather than a wish. `src/App.vue`, `src/main.ts` and `src/pwa.ts` are
 * named as files because they sit loose at the root of `src/`.
 */
const PRESENTATION = [
  'src/viz',
  'src/components',
  'src/composables',
  'src/stores',
  'src/audio',
  'src/art',
  'src/App.vue',
  'src/main.ts',
  'src/pwa.ts',
]

/** `import … from 'x'` / `export … from 'x'`, `type` modifier captured but NOT used to skip – see
 *  the header. Non-greedy to the first `from`, dot-all so a multi-line brace list is one match. */
const FROM = /^[ \t]*(?:import|export)[ \t]+(type[ \t]+)?(?![\w$]*[ \t]*=)([\s\S]*?)from[ \t]*['"]([^'"]+)['"]/gm
/** side-effect-only `import 'x'` – a dependency with no names on it is still a dependency */
const BARE = /^[ \t]*import[ \t]*['"]([^'"]+)['"]/gm

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.ts') || name.endsWith('.vue')) out.push(full)
  }
  return out
}

/** Relative specifiers only – a package cannot be one of our own layers. '' when unresolvable. */
function resolveSpec(from: string, spec: string): string {
  if (!spec.startsWith('.')) return ''
  const base = resolve(dirname(from), spec)
  for (const cand of [base, base + '.ts', base + '.vue', join(base, 'index.ts')]) {
    try {
      if (statSync(cand).isFile()) return cand
    } catch {
      /* not this one */
    }
  }
  return ''
}

/** Every specifier a file depends on, TYPE EDGES INCLUDED, as `{ spec, clause, typeOnly }`. */
export function specifiersOf(text: string): Array<{ spec: string; clause: string; typeOnly: boolean }> {
  // Comments are stripped FIRST. This file, `matchStats.ts` and `rally.ts` all NAME the removed
  // edges in prose – the header above quotes five of them verbatim – and a comment must never count
  // as a dependency. That is not hypothetical here: without this strip, this test fails on itself.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
  const out: Array<{ spec: string; clause: string; typeOnly: boolean }> = []
  for (const [, typeMod, clause, spec] of code.matchAll(FROM)) {
    const flat = clause.trim().replace(/\s+/g, ' ')
    out.push({ spec, clause: flat.length > 80 ? `${flat.slice(0, 77)}...` : flat, typeOnly: Boolean(typeMod) })
  }
  for (const [, spec] of code.matchAll(BARE)) out.push({ spec, clause: '(side effect)', typeOnly: false })
  return out
}

/** Is `file` inside one of `zones` (a directory prefix or an exact file)? */
function inside(file: string, zones: string[]): boolean {
  const rel = relative(ROOT, file).split(sep).join('/')
  return zones.some((z) => rel === z || rel.startsWith(z + '/'))
}

function offenders(): string[] {
  const found: string[] = []
  for (const zone of ENGINE_ZONES) {
    for (const file of walk(join(ROOT, zone))) {
      for (const { spec, clause, typeOnly } of specifiersOf(readFileSync(file, 'utf8'))) {
        const target = resolveSpec(file, spec)
        if (!target || !inside(target, PRESENTATION)) continue
        const from = relative(ROOT, file).split(sep).join('/')
        const to = relative(ROOT, target).split(sep).join('/')
        found.push(`  ${from}  ->  ${to}   ${typeOnly ? 'import type' : 'import'} ${clause}`)
      }
    }
  }
  return found.sort()
}

describe('engine → presentation dependency direction (R2-06 / ARCH-04)', () => {
  it('no file in the engine zones imports anything from the presentation layer', () => {
    const found = offenders()
    expect(
      found,
      found.length
        ? '\nThe engine is importing the presentation layer. The arrow only goes the other way.\n' +
            `${found.join('\n')}\n\n` +
            '  A contract both sides need goes in a neutral leaf (src/shared/matchViz.ts is the one\n' +
            '  R2-06 made; src/viz/types.ts re-exports it so no consumer has to move). A module that is\n' +
            '  presentation and nothing else goes under src/viz/. Do NOT add an interface layer, and do\n' +
            '  NOT add an exception here – an architecture guard with an allow-list is a comment.\n'
        : '',
    ).toEqual([])
  })

  // ⚠ THE GUARD ABOVE IS ONLY WORTH ITS RUNTIME IF IT CAN FAIL, and "no offenders found" looks
  // identical whether the scanner works or is quietly matching nothing. Three separate ways it could
  // be vacuous, each checked rather than trusted: the walk finds no files, the parser sees no
  // imports, or the classifier calls a viz path clean.
  it('the walk actually reaches the engine, and the engine actually has imports', () => {
    const files = ENGINE_ZONES.flatMap((z) => walk(join(ROOT, z)))
    // 99 files across the four zones on 24.08 (engine 80, shared 15, worker 2, db 2) – the floor
    // is a vacuity check, not a budget, so it sits well under the count rather than beside it.
    expect(files.length, 'the walk found no engine source at all').toBeGreaterThan(60)
    const edges = files.reduce((n, f) => n + specifiersOf(readFileSync(f, 'utf8')).length, 0)
    expect(edges, 'the parser found no imports anywhere in the engine').toBeGreaterThan(300)
  })

  it('the scanner counts a viz import – value AND type – and the five R2-06 removed are its fixtures', () => {
    const seen = (src: string) => specifiersOf(src).map((s) => `${s.typeOnly ? 'type' : 'value'}:${s.spec}`)

    // The exact five lines this wave removed, verbatim from the pre-R2-06 sources.
    expect(seen(`import type { AnnotatedMatch } from '../../viz/types'`)).toEqual(['type:../../viz/types'])
    expect(seen(`import { matchDurationSeconds } from '../../viz/matchClock'`)).toEqual(['value:../../viz/matchClock'])
    expect(seen(`import { COURT } from '../../viz/types'`)).toEqual(['value:../../viz/types'])
    expect(seen(`import type { AnnotatedPoint } from '../../viz/types'`)).toEqual(['type:../../viz/types'])
    expect(seen(`import type {\n  AnnotatedMatch,\n  Shot,\n} from '../../viz/types'`)).toEqual(['type:../../viz/types'])
    // ...and the shapes that must still be seen, so nothing sneaks in wearing a different syntax.
    expect(seen(`export { COURT } from '../../viz/types'`)).toEqual(['value:../../viz/types'])
    expect(seen(`export type { Rally } from '../../viz/types'`)).toEqual(['type:../../viz/types'])
    expect(seen(`import '../../viz/preview'`)).toEqual(['value:../../viz/preview'])
    // A comment naming the forbidden edge is prose, not a dependency – this very file is full of them.
    expect(seen(`// import { COURT } from '../../viz/types'`)).toEqual([])
    expect(seen(`/* import { COURT } from '../../viz/types' */`)).toEqual([])
    // A package is not one of our layers.
    expect(seen(`import { ref } from 'vue'`)).toEqual(['value:vue'])
  })

  it('the classifier puts src/viz inside the presentation surface and src/shared outside it', () => {
    expect(inside(join(ROOT, 'src/viz/types.ts'), PRESENTATION), 'src/viz is not being checked').toBe(true)
    expect(inside(join(ROOT, 'src/viz/match/matchStats.ts'), PRESENTATION), 'src/viz/match escaped').toBe(true)
    expect(inside(join(ROOT, 'src/App.vue'), PRESENTATION), 'the shell escaped').toBe(true)
    // The neutral leaf is the SANCTIONED destination – if this ever reads true, the fix is illegal.
    expect(inside(join(ROOT, 'src/shared/matchViz.ts'), PRESENTATION), 'the neutral leaf is not neutral').toBe(false)
    expect(inside(join(ROOT, 'src/engine/match/rally.ts'), PRESENTATION)).toBe(false)
    // ⚠ A PREFIX MATCH IS NOT A PATH MATCH: 'src/art' must not swallow a hypothetical 'src/artefacts'.
    expect(inside(join(ROOT, 'src/artefacts/thing.ts'), PRESENTATION), 'the prefix test is textual').toBe(false)
  })
})
