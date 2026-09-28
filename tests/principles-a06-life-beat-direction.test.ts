// =================================================================================================
// A-06 · THE LIFE BEAT PACKAGE'S **DIRECTION** – THE HUB IMPORTS LEAVES, AND NOTHING IMPORTS BACK
// (T6.8 of docs/plans/principles-fix-builder-2026-09.md; the finding is A-06 in
//  docs/review-principles-2026-09-26/01-architecture.md)
// =================================================================================================
//
// WHAT THIS GUARDS, AND WHY DIRECTION IS THE THING THAT CAN BREAK SILENTLY. `world/lifeBeat.ts` grew
// 0 → 8,109 lines in 17 days and is being split by beat kind. A-06's own argument is that the split
// has exactly one rule that matters: **the hub imports copy leaves, and a moved module never imports
// the hub back**. Get that backwards in one file and `tests/import-cycles.test.ts` goes red – which
// is good – but the tell arrives as a 60-module strongly-connected component in another suite,
// naming files this wave never touched. This file says the same thing at the point of the decision,
// per module, with the reason in the failure message.
//
// ⚠⚠ AND THE SECOND HALF IS THE ONE NOBODY WOULD FIND. `tests/worldSource.ts`' `engineModuleSource`
// reads `<name>.ts` PLUS every `<name>/*.ts` – **FLAT, it does not recurse**. T3.9's sub-stream key
// inventory (`tests/life-beat-keys.test.ts`) reads this module through it, and CLAUDE.md invariant 2
// makes a key part of every existing career: rename one and every career's deaths and conceptions
// are re-dealt from a different sequence with NOTHING going red. A kind module parked at
// `world/lifeBeat/copy/smallTalk.ts` would be invisible to that reader, so every key in it would
// leave the inventory **while the inventory stayed green** – the silent re-deal, arriving through a
// directory layout rather than through a rename. So: the package is FLAT, mechanically, and the
// reader is checked against each module's own text rather than trusted.
//
// ⭐ WHICH ASSERTIONS ARE RED-FIRST AND WHICH ARE FORWARD GUARDS – said plainly, because this repo
// has had three vacuous probes in one week and every one of them was a guard with nothing to look at:
//
//   RED-FIRST (they fail on the pre-split tree, for a real reason – the hub is the monolith A-06
//   measured and the package does not exist):
//     * «the hub has come down below its ceiling» – 8,109 lines / 223 declarations before.
//     * «the package exists, and the split went in BOTH directions» – at least one module whose
//       names the hub IMPORTS (a copy leaf) and at least one whose names the hub only RE-EXPORTS
//       (a kind the barrel carries but the hub does not call).
//     * «`engineModuleSource` sees every module» – vacuous over an empty package, so it is asserted
//       against the module list rather than against a count.
//
//   FORWARD GUARDS (green on the pre-split tree because there is nothing to break yet; each one was
//   ARMED BY HAND on 28.09 and both outputs are quoted here rather than promised):
//     * «no module both imports the hub and is reached by it». ARM: a module that imports
//       `raiseLifeBeat` from the hub – §16's own real dependency – while the hub re-exports its name.
//       This test:
//           world/lifeBeat/_arm.ts: the hub exports it, and it imports the hub back – { import { raiseLifeBeat } }
//       and `tests/import-cycles.test.ts` named the same pair independently:
//           cycle over 2 modules:
//               src/engine/world/lifeBeat.ts -> src/engine/world/lifeBeat/_arm.ts  { { armRollBereavement } }
//               src/engine/world/lifeBeat/_arm.ts -> src/engine/world/lifeBeat.ts  { { raiseLifeBeat } }
//       Reverted; `git status` clean afterwards.
//     * «the package is flat». ARM: `world/lifeBeat/copy/armNested.ts` holding
//       `rngFromSeed(\`${seed}:life:arm-nested:${week}\`)`. This test:
//           subdirectories under src/engine/world/lifeBeat/: expected [ 'copy' ] to deeply equal []
//       and `tests/life-beat-keys.test.ts` stayed **GREEN** with that key nowhere in its inventory –
//       the silent re-deal reproduced rather than quoted. Reverted; `git status` clean afterwards.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { engineModuleSource } from './worldSource'

const ENGINE = new URL('../src/engine/', import.meta.url)
/** The hub, relative to `src/engine/` – the same name `engineModuleSource` takes. */
const MODULE = 'world/lifeBeat'

/** Comments stripped first: this file's own prose, and the hub's, name module paths in sentences, and
 *  a sentence must never count as a dependency (the cycle test's own reasoning). */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
}

// =================================================================================================
// ⚠⚠ THE EDGE PARSER – AND WHY IT IS **NOT** `tests/import-cycles.test.ts`' REGEX, WHICH WAS THE
// FIRST THING TRIED (measured 28.09, and the measurement is the reason this block is here)
// =================================================================================================
//
// That file's `FROM` is `^[ \t]*(?:import|export)[ \t]+(type[ \t]+)?…([\s\S]*?)from[ \t]*['"]…['"]`.
// The clause is DOT-ALL and lazy, so a match may START on a line that is not an import at all and run
// forward, across thousands of lines, to the first `from '…'` it can reach. Run against the hub on
// the day the wedding's copy moved, it reported three of the four edges with the WRONG clause:
//
//     { whole: "export function lifeLogOf(world: WorldState): readonly LifeB…", spec: "./lifeBeat/weddingCopy" }
//     { whole: "export function divorcedKeptRow(): string {\n  return DIVORCE…", spec: "./lifeBeat/leak" }
//
// For the cycle detector that is harmless in the direction it cares about – it collects the SPEC, and
// a spec is still a real target – but this guard's whole question is which DIRECTION the edge runs,
// and the direction is read off the keyword the match starts on. A parser that thinks the hub
// «exports» `weddingCopy` because a `export function` fifty screens up borrowed its specifier would
// have silently passed the one shape this file exists to refuse. So the edges are read per STATEMENT:
// a line that opens an `import`/`export`, plus the lines of a multi-line brace list, and nothing else.
//
// ⚠ THIS IS A FINDING ABOUT `tests/import-cycles.test.ts` AND IT IS IN THE WAVE'S REPORT rather than
// fixed here: the same dot-all clause can also SWALLOW the import lines it runs across, so an edge
// between two of them is never emitted. Nothing in this module set loses an edge that way today (the
// hub's own imports all sit above its first `export function`), which is why it is a report and not a
// red file – but it is a hole in the judge of the architecture, and it is not this task's to close.

/** One runtime edge: the keyword it was declared with, the clause, and the specifier. */
interface Edge {
  kind: 'import' | 'export'
  clause: string
  spec: string
}

const OPENS = /^[ \t]*(import|export)[ \t]/
const SPEC = /from[ \t]*['"]([^'"]+)['"]/
const TYPE_ONLY = /^[ \t]*(?:import|export)[ \t]+type[ \t]/

/** Every runtime `import`/`export … from` edge out of one source text, read per STATEMENT rather than
 *  by a dot-all regex – see the block above. `import type` is dropped: TypeScript erases it, so it
 *  costs nothing at runtime and `tests/import-cycles.test.ts` deliberately does not count it either. */
function runtimeEdges(text: string): Edge[] {
  const lines = codeOnly(text).split('\n')
  const out: Edge[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!OPENS.test(lines[i])) continue
    // A multi-line brace list is the ONE statement that spans lines: `{` opens on the first line and
    // the specifier arrives with the `}`. Anything else is this line or is not an edge at all.
    let stmt = lines[i]
    if (stmt.includes('{') && !stmt.includes('}')) {
      for (let j = i + 1; j < lines.length && j < i + 60; j++) {
        stmt += `\n${lines[j]}`
        if (lines[j].includes('}')) {
          i = j
          break
        }
      }
    }
    const spec = SPEC.exec(stmt)
    if (!spec) continue // `export function …`, `export const …`, a bare re-export – not an edge
    if (TYPE_ONLY.test(stmt)) continue
    out.push({
      kind: /^[ \t]*import\b/.test(stmt) ? 'import' : 'export',
      clause: stmt.slice(0, spec.index).trim().replace(/\s+/g, ' '),
      spec: spec[1],
    })
  }
  return out
}

function hubSource(): string {
  return readFileSync(new URL(`${MODULE}.ts`, ENGINE), 'utf8')
}

/** The package's entries, or an empty list before it exists – the pre-split tree is not an error. */
function packageEntries(): { name: string; dir: boolean }[] {
  try {
    return readdirSync(new URL(`${MODULE}/`, ENGINE), { withFileTypes: true }).map((e) => ({
      name: e.name,
      dir: e.isDirectory(),
    }))
  } catch {
    return []
  }
}

/** Every `world/lifeBeat/*.ts` module, by file name, sorted. */
function kindModules(): string[] {
  return packageEntries()
    .filter((e) => !e.dir && e.name.endsWith('.ts'))
    .map((e) => e.name)
    .sort()
}

function kindSource(name: string): string {
  return readFileSync(new URL(`${MODULE}/${name}`, ENGINE), 'utf8')
}

/** How the hub reaches one kind module at RUNTIME: `import` (it calls the module's names),
 *  `export` (the barrel carries them and the hub does not call them), both, or neither. */
function hubReach(name: string): { imports: boolean; reexports: boolean } {
  const stem = name.replace(/\.ts$/, '')
  const mine = runtimeEdges(hubSource()).filter((e) => e.spec === `./lifeBeat/${stem}`)
  return {
    imports: mine.some((e) => e.kind === 'import'),
    reexports: mine.some((e) => e.kind === 'export'),
  }
}

// =================================================================================================
// THE CEILINGS – RED-FIRST, AND A CEILING RATHER THAN AN EQUALITY ON PURPOSE
// =================================================================================================
//
// ⚠ NOT AN EXACT COUNT. The hub legitimately gains a line when a kind gains a sentence; an equality
// would go red on an honest commit and teach the next person to bump the number. A ceiling can only be
// breached by the file GROWING BACK, which is the failure A-06 is about. Measured: **8,109 lines / 223
// top-level declarations** at W6's head, **6,486 / 167** after T6.8's thirteen moves, with 1,990 lines
// living in thirteen kind modules. The ceilings leave ~300 lines of honest slack and no more, because
// the forward rule is that a new beat KIND is a new module rather than a new section here.
const LINE_CEILING = 6800
const DECL_CEILING = 175

/** Top-level declarations in one file – column-0 `function` / `const` / `type` / `interface` …,
 *  exported or not. The same shape `grep -cE` gives, so the number in the header is checkable. */
function declCount(text: string): number {
  return (text.match(/^(?:export )?(?:function|const|type|interface|class|let) /gm) ?? []).length
}

describe('A-06 – world/lifeBeat is a hub with kind modules, and the arrows all point one way', () => {
  it('⭐⭐⭐ the hub itself has come down below its ceiling', () => {
    const src = hubSource()
    const lines = src.split('\n').length - 1
    expect(lines, `world/lifeBeat.ts is ${lines} lines – the hub keeps the queue, raising and answering, the prompt and the presence law, and a beat KIND is its own module`).toBeLessThanOrEqual(LINE_CEILING)
    expect(declCount(src), 'world/lifeBeat.ts top-level declarations').toBeLessThanOrEqual(DECL_CEILING)
  })

  it('⭐⭐ the package exists, and the split went in both directions', () => {
    const modules = kindModules()
    expect(modules.length, 'src/engine/world/lifeBeat/*.ts – the kind modules').toBeGreaterThan(0)
    const reach = modules.map((name) => ({ name, ...hubReach(name) }))
    // A COPY LEAF: the hub calls its names, so the hub imports it. This is the direction A-06 says
    // the per-kind copy sections take.
    expect(
      reach.filter((r) => r.imports).map((r) => r.name),
      'at least one copy leaf the hub imports',
    ).not.toEqual([])
    // A KIND THE BARREL ONLY CARRIES: the hub re-exports its names under their historical spelling
    // and never calls them – `world.ts`'s import list does not move, and the hub does not grow a
    // dependency on the kind. This is the hazard direction.
    expect(
      reach.filter((r) => r.reexports).map((r) => r.name),
      'at least one kind module the hub only re-exports',
    ).not.toEqual([])
  })

  it('⭐⭐⭐ no kind module both imports the hub and is reached by it – the cycle A-06 is about', () => {
    const offenders: string[] = []
    for (const name of kindModules()) {
      const back = runtimeEdges(kindSource(name)).filter((e) => e.spec === '../lifeBeat')
      const reach = hubReach(name)
      if (back.length && (reach.imports || reach.reexports)) {
        offenders.push(
          `world/lifeBeat/${name}: the hub ${reach.imports ? 'imports' : 'exports'} it, and it imports the hub back – { ${back.map((e) => e.clause).join(' | ')} }`,
        )
      }
    }
    expect(offenders, offenders.length ? `\n${offenders.join('\n')}\n` : '').toEqual([])
  })

  it('⭐⭐ the package is FLAT – a nested module would leave T3.9\'s key inventory blind', () => {
    // ⚠ THE REASON IS IN THE HEADER AND IT IS NOT STYLE. `engineModuleSource` globs `<name>/*.ts`
    // without recursing, so a `rngFromSeed` key in a subdirectory silently leaves the inventory that
    // exists to stop a silent re-deal.
    const dirs = packageEntries().filter((e) => e.dir).map((e) => e.name)
    expect(dirs, 'subdirectories under src/engine/world/lifeBeat/').toEqual([])
  })

  it('⭐⭐⭐ engineModuleSource reads the hub AND every kind module', () => {
    // The proof that T3.9's key pin survived the split: it reads this module through the same
    // helper, so a module the helper cannot see is a stream the inventory cannot see.
    const seen = engineModuleSource(MODULE)
    const modules = kindModules()
    expect(modules.length, 'nothing to read – see the previous test').toBeGreaterThan(0)
    for (const name of modules) {
      expect(seen, `engineModuleSource('${MODULE}') does not carry ${name}`).toContain(
        `// ==== src/engine/${MODULE}/${name} ====`,
      )
      // Not just the marker: the module's own first declaration has to be in there too.
      const first = kindSource(name).match(/^export (?:function|const|type|interface) ([A-Za-z0-9_]+)/m)
      expect(first, `${name} exports nothing – a kind module the hub cannot reach`).not.toBeNull()
      expect(seen, `engineModuleSource lost ${name}'s body`).toContain(first![0])
    }
  })
})
