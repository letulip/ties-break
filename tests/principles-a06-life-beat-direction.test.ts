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
// ⚠⚠ THAT CAUSE IS CLOSED, AND THE PARAGRAPH ABOVE IS NOW A CHRONICLE RATHER THAN A REASON (T6.10,
// 28.09). T6.9 taught `engineModuleSource` to RECURSE (`8ea19c22`), so the arm quoted below – a key
// parked in `world/lifeBeat/copy/` – now reddens `tests/life-beat-keys.test.ts` instead of slipping past
// it. The architect wrote the same stale premise into CLAUDE.md and has corrected it there. WHAT THE
// FLATNESS CASE RESTS ON NOW: the package is flat because that is the DECOMPOSITION'S SHAPE and the
// forward rule made mechanical – a new beat KIND is a new module here, which is also the premise the line
// ceiling above is written on – and NOT because a reader cannot see deeper. The assertion is kept and its
// failure message says «the package grew a directory», which is the thing it can still honestly observe.
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
// ⚠⚠ T6.10 (28.09) – THE SECOND HALF OF THE DIRECTION, AND IT LIVES IN `world.ts` RATHER THAN HERE.
// T6.8 moved the two hazard sections that reference nothing (§9 the leak, §10 the booth) and could
// NOT move the other seven, and the reason it measured is the whole of this note: a hazard section
// needs the hub at RUNTIME (`raiseLifeBeat`, `kidAgeNow`, `hasBeatFor`, `lifeStageOf`,
// `latchedEpisode`), so if the hub ALSO re-exports the hazard's names for the barrel's sake there is
// an edge hub → kind on top of the edge kind → hub, and `tests/import-cycles.test.ts` refuses it:
//
//     cycle over 2 modules:
//         src/engine/world/lifeBeat.ts       -> src/engine/world/lifeBeat/_arm.ts  { armRollBereavement }
//         src/engine/world/lifeBeat/_arm.ts  -> src/engine/world/lifeBeat.ts       { raiseLifeBeat }
//
// The way through costs one import line: **`src/engine/world.ts` takes a hazard module's names from
// the KIND MODULE, never from the hub.** The edge becomes world.ts → kind → hub, and the hub reaches
// `world.ts` only through `import type`, which TypeScript erases. So the rule this file now states
// per module is CLAUDE.md's own line – «a hazard's names are re-exported by `src/engine/world.ts`
// directly from the kind module, never through the hub» – and the test below reads it off both files
// rather than trusting the sentence.
//
// ⚠ A «HAZARD MODULE» IS DETECTED, NOT LISTED: it is a package module the hub does not IMPORT. A copy
// leaf is a module the hub calls, so the hub imports it and the direction is settled by the case
// above; a hazard exists for the barrel and for `world/phaseHerWeek.ts`, and the hub has no business
// reaching it at all. Detection rather than a list is deliberate – a name list is the thing that goes
// stale on the next kind, which is the failure A-06 is about.
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
//     * «the hub re-exports NO hazard module, and the barrel takes their names direct» (T6.10, 28.09).
//       ARM: one hazard name back on a hub re-export line, placed INSIDE the hub's import block where the
//       old comment stripper was blind - `export { rollBereavement } from './lifeBeat/bereavement'` at
//       line 235, with `bereavement.ts` importing `kidAgeNow` and `raiseLifeBeat` back. TWO cases of this
//       file went red, which is the arm doing double duty:
//           ⭐⭐⭐ the hub re-exports NO hazard module, and the barrel takes their names direct - T6.10
//           world/lifeBeat.ts re-exports ./lifeBeat/bereavement - a hazard module's names come off the
//           BARREL, not off the hub (CLAUDE.md, the life-beat rule)
//           ⭐⭐⭐ no kind module both imports the hub and is reached by it - the cycle A-06 is about
//           world/lifeBeat/bereavement.ts: the hub exports it, and it imports the hub back -
//           { import { kidAgeNow, raiseLifeBeat } }
//       ⚠⚠ AND `tests/import-cycles.test.ts` STAYED GREEN ON IT - exit 0, 6 tests passed - on a textbook
//       2-cycle, in all THREE positions tried (end of file, at the section banner, inside the import
//       block). The reason is the comment-stripper hole measured at `codeOnly` above: that file cannot see
//       either half of this edge. ⭐ It is also why the SECOND case above only fires since T6.10 fixed the
//       strip order - with the old order it fired from the end of the file and nowhere a builder would
//       actually put the line. Reverted; `git status` clean afterwards.
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
 *  a sentence must never count as a dependency (the cycle test's own reasoning).
 *
 *  ⚠⚠ LINE COMMENTS GO FIRST, AND THE ORDER IS A MEASURED BUG FIX (T6.10, 28.09) RATHER THAN A STYLE
 *  CHOICE. The usual spelling strips BLOCK comments first and line comments second. On this corpus that
 *  loses real code: a line comment that mentions a path GLOB in backticks - «world» then a slash then a
 *  star, or the same with «.ts» after it, or an images path with two stars - puts a slash immediately
 *  before a star, which the block-comment matcher reads as an OPENER. It then runs lazily forward to the
 *  next star-slash, which is the end of the next JSDoc, and everything in between is deleted - imports
 *  and exports included. Stripping line comments first removes the phantom opener before the block
 *  matcher can see it.
 *
 *  MEASURED ACROSS `src/` on 28.09: the block-first order loses **122 runtime import/export edges in 24
 *  files** - ALL of `world/lifeBeat/leak.ts`' 8, ALL of `booth.ts`' 6, ALL of `bereavement.ts`' 4, ALL of
 *  `world/state.ts`' 9, ALL of `world/phaseObligations.ts`' 18, and 16 of the hub`s 39: its whole import
 *  block, swallowed by a line-129 comment naming nine other package modules with a glob, running to a
 *  JSDoc close on line 248.
 *
 *  ⚠⚠ AND THE SAME HOLE IS IN `tests/import-cycles.test.ts`, WHICH IS THE JUDGE OF THIS ARCHITECTURE.
 *  Reported to the architect rather than fixed here, because that file belongs to another task this
 *  wave. What it costs is written into the ARM below: a hub re-export of a kind module, with that module
 *  importing the hub, is a textbook 2-cycle and the cycle test stays **GREEN** on it - three positions
 *  tried. So on this package THIS file is the guard, and not that one. */
function codeOnly(text: string): string {
  return text.replace(/^[ \t]*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
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
// T6.10 – THE BARREL'S SIDE OF THE SAME ARROW
// =================================================================================================

/** A HAZARD MODULE: a package module the hub does not import. Detected rather than listed – see the
 *  header. A copy leaf is imported by the hub; a hazard is not, and the hub must not reach it at all. */
function hazardModules(): string[] {
  return kindModules().filter((name) => !hubReach(name).imports)
}

/** Every name one module declares with `export` – functions, consts, types, interfaces. The set the
 *  barrel could possibly be carrying on that module's behalf. */
function exportedNames(text: string): string[] {
  const out: string[] = []
  for (const m of codeOnly(text).matchAll(/^export (?:function|const|type|interface|class|let) ([A-Za-z0-9_]+)/gm)) out.push(m[1])
  return out
}

/** For every name `src/engine/world.ts` imports off a `./world/lifeBeat…` specifier, WHICH specifier
 *  it came in on. The barrel's import list is one statement per module, so this is the whole answer to
 *  «where does the barrel think this name lives». */
function barrelSpecifiers(): Map<string, string[]> {
  const text = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
  const out = new Map<string, string[]>()
  for (const edge of runtimeEdges(text)) {
    if (!edge.spec.startsWith('./world/lifeBeat')) continue
    // ⚠ MATCHED, NOT SLICED BETWEEN TWO `indexOf` CALLS. `scripts/pin-ratchet.mjs` is right to refuse
    // that shape even here: a clause with no brace list would make `indexOf` return -1 and the slice
    // would silently WIDEN to the whole clause. A match yields nothing on a default import, which is
    // the honest answer - it carries no named binding for the barrel to mis-route.
    const list = /\{([^}]*)\}/.exec(edge.clause)?.[1] ?? ''
    for (const raw of list.split(',')) {
      const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]
      if (!name) continue
      out.set(name, [...(out.get(name) ?? []), edge.spec])
    }
  }
  return out
}

// =================================================================================================
// THE CEILINGS – RED-FIRST, AND A CEILING RATHER THAN AN EQUALITY ON PURPOSE
// =================================================================================================
//
// ⚠ NOT AN EXACT COUNT. The hub legitimately gains a line when a kind gains a sentence; an equality
// would go red on an honest commit and teach the next person to bump the number. A ceiling can only be
// breached by the file GROWING BACK, which is the failure A-06 is about. Measured: **8,109 lines / 223
// top-level declarations** at W6's head, **6,486 / 167** after T6.8's thirteen moves, with 1,990 lines
// living in thirteen kind modules.
//
// ⚠ TIGHTENED 28.09 BY T6.10, which moved SEVEN hazard sections in two passes – §16 the death, §15 the
// weight, §11 the wedding, §8 the end, §7 tier-1 small talk, then §13 the independent life and §14 the
// pregnancy once the sibling imports blocking them were found and split. ⭐ ALL NINE of A-06's
// zero-inbound hazard sections are now kind modules. Measured on the LAST commit of the task: **4,707
// lines / 129 declarations**, against 8,109 / 223 at W6's head, with 4165 lines living in 20 modules under
// `world/lifeBeat/`.
//
// ⚠ THE NUMBER IS THE ONE `wc -l` PRINTS ON THE LAST COMMIT, not on the last span-move – the banner lines
// each MOVED TO note leaves behind are honest hub lines too, and a note quoting the cheaper figure would
// be CLAUDE.md's «a count written in PROSE survives a full gate» inside this file – it already cost T6.10
// one corrective commit. The ceilings leave ~143 lines and 5 declarations of honest slack and no more,
// because the forward rule is that a new beat KIND is a new module rather than a new section here.
//
// ⚠ WHAT THE HUB STILL HOLDS, AND WHY IT IS NOT DEBT: the queue (§1), her want at the fork (§2), the copy
// pools and round 42's situation layer (§3, §3c-2, §3f, §3k), raising and answering (§4), the arrival (§5),
// the delivery (§6) and the spouse's opinion surface (§12). Every one of those either IS the hub's job or
// has inbound references from it – §3c-2 has eight, all from §3k's prompt assembly – which is P4's own rule
// producing the right answer rather than a shortfall.
const LINE_CEILING = 4850
const DECL_CEILING = 134

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
    // ⚠ RE-AIMED 28.09 BY T6.10, NOT WEAKENED. It used to read «at least one kind module the hub only
    // RE-EXPORTS», which was T6.8's shape: the hub carried the two zero-reference hazards' names for
    // the barrel. That shape cannot hold for a hazard that needs the hub at runtime – it IS the cycle
    // (see the header) – so the second direction now ends at `world.ts` instead of at the hub: a kind
    // module the hub does not reach AT ALL, whose names the barrel takes from the module itself. Same
    // claim, one link further along, and the case below is what makes it a rule rather than an example.
    expect(hazardModules(), 'at least one hazard module – one the hub does not import').not.toEqual([])
    const carried = barrelSpecifiers()
    expect(
      hazardModules().filter((name) =>
        exportedNames(kindSource(name)).some((n) => (carried.get(n) ?? []).includes(`./world/lifeBeat/${name.replace(/\.ts$/, '')}`)),
      ),
      'at least one hazard module whose names `world.ts` takes DIRECTLY',
    ).not.toEqual([])
  })

  it('⭐⭐⭐ the hub re-exports NO hazard module, and the barrel takes their names direct – T6.10', () => {
    // ⚠⚠ THE TWO HALVES ARE ONE RULE AND BOTH ARE HERE ON PURPOSE. (a) the hub must not reach a
    // hazard module, because a hazard imports the hub and the pair is the cycle `tests/import-cycles`
    // refuses; (b) the names must still be ON the barrel under their historical spelling, taken from
    // the kind module – otherwise «no cycle» would be satisfiable by the names quietly disappearing,
    // and hundreds of files import them from `engine/world`.
    const carried = barrelSpecifiers()
    const offenders: string[] = []
    for (const name of hazardModules()) {
      const stem = name.replace(/\.ts$/, '')
      const reach = hubReach(name)
      if (reach.reexports) {
        offenders.push(
          `world/lifeBeat.ts re-exports ./lifeBeat/${stem} – a hazard module's names come off the BARREL, not off the hub (CLAUDE.md, the life-beat rule)`,
        )
      }
      for (const n of exportedNames(kindSource(name))) {
        const specs = carried.get(n) ?? []
        if (specs.includes('./world/lifeBeat')) {
          offenders.push(`world.ts imports ${n} from './world/lifeBeat' – it is declared in world/lifeBeat/${name}`)
        }
        if (specs.length && !specs.includes(`./world/lifeBeat/${stem}`)) {
          offenders.push(`world.ts imports ${n} from ${specs.join(' + ')} – expected './world/lifeBeat/${stem}'`)
        }
      }
    }
    expect(offenders, offenders.length ? `\n${offenders.join('\n')}\n` : '').toEqual([])
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

  it('⭐⭐ the package is FLAT – a directory here is the decomposition losing its shape', () => {
    // ⚠⚠ RE-AIMED 28.09 BY T6.10, AND THE REASON CHANGED WHILE THE ASSERTION DID NOT. This case used to
    // say «a nested module would leave T3.9's key inventory blind», and it was true until T6.9 made the
    // source readers recurse (`8ea19c22`): a key one directory deeper now reddens
    // `tests/life-beat-keys.test.ts` on its own. What the case stands on now is A-06's own shape – twenty
    // kind modules, one level, one glob, and the forward rule «a new beat KIND is a new module HERE»,
    // which is also the premise the line ceiling is written on. A directory under this package means a
    // grouping nobody ruled, and it is cheaper to refuse than to discover.
    // ⚠ NOT WEAKENED AND NOT DELETED: same assertion, same subject, an honest message instead of a stale
    // one. The header keeps the old cause as a chronicle, marked closed.
    const dirs = packageEntries().filter((e) => e.dir).map((e) => e.name)
    expect(
      dirs,
      'the package grew a directory – src/engine/world/lifeBeat/ is FLAT, one module per beat kind',
    ).toEqual([])
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
