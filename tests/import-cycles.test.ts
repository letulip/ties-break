// NO RUNTIME IMPORT CYCLES IN src/ – the mechanical guard for TB-02 and TB-07.
//
// ⚠ WHY THIS EXISTS, AND WHY IT IS A SOURCE TEST RATHER THAN A BEHAVIOUR ONE. A runtime import cycle
// does not fail a normal test; it fails the BROWSER, and only sometimes. economy.ts and
// season/calendar.ts imported each other for months. Reading the calendar's `WEEKS_PER_YEAR` while
// ECONOMY's object literal was still initialising threw "Cannot access 'WEEKS_PER_YEAR' before
// initialization" and took the whole app down – and the suite stayed GREEN throughout, because
// vitest resolves modules in a different order than the browser does. It was found by loading the
// real app, and the workaround was a hard-coded `52` with a comment telling the next person not to
// touch it. That is the failure this file is here to make impossible to reintroduce: a cycle is a
// property of the SOURCE, so the source is where it can be checked deterministically.
//
// Two more were closed with it (TB-07): coach → season/cohort → development → coach, and a
// nine-module component of world/* that hung entirely off one edge – world/college.ts, a MUTATION
// module, importing `kidLadderRank` from world/snapshot.ts, the aggregate PROJECTION layer.
//
// ⚠ `import type` IS NOT A CYCLE. TypeScript erases it at compile time, so a type-only edge costs
// nothing at runtime and is deliberately NOT counted here – world/*.ts all import `WorldState` as
// `import type` from ../world by design (see CLAUDE.md). Counting those would make this test demand
// a decomposition the architecture explicitly does not want.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'
import { stripComments } from './helpers/source'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

// =================================================================================================
// ⚠⚠ THE EDGE PARSER READS ONE STATEMENT AT A TIME – T6.9, 28.09, AND THE DOT-ALL REGEX IT REPLACES
// IS QUOTED HERE BECAUSE THIS FILE IS THE ARCHITECTURE'S JUDGE
// =================================================================================================
//
// WHAT WAS HERE, AND IT WAS HERE FROM THE DAY THE FILE WAS WRITTEN:
//
//     const FROM = /^[ \t]*(?:import|export)[ \t]+(type[ \t]+)?(?![\w$]*[ \t]*=)([\s\S]*?)from[ \t]*['"]([^'"]+)['"]/gm
//
// The clause `([\s\S]*?)` is DOT-ALL and LAZY, so a match may START on a line that is not an import at
// all and run forward – across thousands of lines – to the first `from '…'` it can reach. Two defects
// come out of that one clause, and T6.8 measured the first of them on `world/lifeBeat.ts` the day the
// wedding's copy moved:
//
//   1. MISATTRIBUTION. Three of the hub's four edges were reported with the WRONG statement:
//          { whole: "export function lifeLogOf(world: WorldState): readonly LifeB…", spec: "./lifeBeat/weddingCopy" }
//      Harmless while you only want the SPEC – a spec is a real target whoever borrowed it – and fatal
//      the moment anything reads DIRECTION off the keyword the match began on. A-06's whole argument
//      («the hub imports copy leaves, hazards import the hub, never the reverse») is a direction
//      argument, and `tests/principles-a06-life-beat-direction.test.ts` had to write its own
//      per-statement parser rather than reuse this one. That is a fork in the judge of the
//      architecture, and this is the half that gets fixed instead of forked around.
//
//   2. A DROPPED EDGE. The clause can also SWALLOW a statement it runs across – and an edge inside a
//      swallowed span is never emitted at all, because `lastIndex` resumes past it. It needs a `from`
//      the regex cannot finish: `from` at the end of a line, or a `'from'` STRING that hands it a
//      closing quote to eat. Both are quoted, with counts, in T6.9's report and armed in the cases at
//      the foot of this file. T6.8 checked the tree and nothing lost an edge on 28.09 (the hub's
//      imports all sit above its first `export function`), which is why it arrived as a report – but a
//      judge that CAN go blind is not a judge, and the repository's own edge count is asserted
//      unchanged across this change so the fix cannot have cost anything.
//
// ⭐ THE APPROACH IS `tests/principles-a06-life-beat-direction.test.ts`' – READ, NOT REINVENTED. A
// statement is the line that opens it, plus the continuation lines of a specifier list, and it NEVER
// extends across a line that opens the next statement. That one boundary is what closes (2); refusing
// to start on a declaration (`export function`, `export const`, `export type X =`) is what closes (1).

/** A line that OPENS an `import`/`export` statement – the only place an edge can begin. The keyword
 *  needs whitespace after it, exactly as the old `FROM` required, so `import.meta.env` is not one. */
const OPENS = /^[ \t]*(?:import|export)[ \t]/
/** …and the openers that begin a DECLARATION, which can never carry a `from` specifier. This is the
 *  misattribution fix: `export function lifeLogOf(…)` is not a statement that borrows a later spec,
 *  it is not an edge at all. ⚠ `export type X =` is an alias and belongs here; `export type { X }
 *  from …` is a re-export and does NOT (it is caught as type-only below). */
const DECLARES =
  /^[ \t]*export[ \t]+(?:default\b|(?:async[ \t]+)?(?:function|const|let|var|class|interface|enum|namespace|declare|abstract)\b|type[ \t]+[A-Za-z0-9_$]+[ \t]*[=<])/
/** The specifier, wherever inside the statement it sits. ⚠ `\s*` AND NOT `[ \t]*`, which is ARM 2's
 *  own lesson paid rather than restated: `from` at the end of a line is exactly the shape that made
 *  the dot-all clause run past a whole statement, and a reader that also cannot cross that newline
 *  would drop the same edge for the same reason. The statement is bounded, so `\s` cannot wander. */
const SPEC = /from\s*['"]([^'"]+)['"]/
/** `import type …` / `export type { … } from …` – TypeScript erases both, so neither is a runtime
 *  edge. The old parser captured the modifier in a group; the statement can simply be asked. */
const TYPE_ONLY = /^[ \t]*(?:import|export)[ \t]+type[ \t]/
/** side-effect-only `import 'x'` – still a runtime edge */
const BARE = /^[ \t]*import[ \t]*['"]([^'"]+)['"]/gm

/** One runtime edge out of one statement: the clause before the specifier, and the specifier. */
interface Edge {
  typeOnly: boolean
  clause: string
  spec: string
}

/**
 * Every `import`/`export` STATEMENT in one source text, as text, in source order.
 *
 * ⚠ THE EXTENSION RULES ARE THE WHOLE POINT, so they are spelled out rather than left to the loop:
 * a statement grows past its first line only while it is genuinely unfinished – a specifier list that
 * has not closed, or a line ending on `from` – and it STOPS at a line that opens the next statement
 * or at a blank line. A closed `{ … }` with no `from` is a local `export { a, b }` and stops there.
 */
export function importStatements(text: string): string[] {
  const lines = text.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!OPENS.test(lines[i]) || DECLARES.test(lines[i])) continue
    let stmt = lines[i]
    let end = i
    while (!SPEC.test(stmt)) {
      // a specifier list that CLOSED without a `from` – `export { a, b }` re-exports nothing outward
      if (stmt.includes('}') && !/\bfrom\b/.test(stmt)) break
      // …and a statement that never opened a list and does not end on `from` cannot continue at all
      if (!stmt.includes('{') && !/\bfrom[ \t]*$/.test(stmt)) break
      // ⚠ THE BOUND IS A RUNAWAY GUARD AND NOT A LIMIT ON HONEST CODE – it was 40 and ARM 3 caught
      // it: `src/worker/sim.worker.ts`' first import list is **53 lines**, and a bound of 40 silently
      // dropped that edge and six more. The real boundary is the next statement, one line down.
      if (end + 1 >= lines.length || end - i >= 200) break
      // ⚠⚠ THE LINE THAT CLOSES THE DROPPED-EDGE HOLE: a statement never swallows the next one.
      // ⚠ AND IT IS THE ONLY STOP. A blank-line stop was tried and ARM 3 refused it: `runtimeGraph`
      // blanks line comments before parsing, and this codebase writes them INSIDE its import lists,
      // so «stop at a blank line» cuts a real statement in half.
      if (OPENS.test(lines[end + 1])) break
      end++
      stmt += `\n${lines[end]}`
    }
    i = end
    out.push(stmt)
  }
  return out
}

// =================================================================================================
// ⚠⚠ THE COMMENT STRIP IS A SCANNER AND NOT TWO REGEXES – T6.9 second pass, 28.09, AND THIS DEFECT
// SAT UNDER EVERY MEASUREMENT THIS FILE HAS EVER MADE
// =================================================================================================
//
// WHAT WAS HERE: `.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')` – block comments
// first, then whole-line comments – at three sites.
//
// ⚠ IT WAS FOUND THE ONLY WAY THIS COULD BE FOUND: another builder planted a real 2-cycle
// (`export { rollBereavement } from './lifeBeat/bereavement'` in the hub, and that module imports the
// hub back) and **this file stayed GREEN, exit 0, 6 tests passed.** Three positions were tried; only
// one at end-of-file reddened anything.
//
// THE CAUSE IS UPSTREAM OF THE PARSER. This codebase writes path globs in prose – `` `world/*` ``
// appears in a `//` line nine times, `` `world/*.ts` `` eight, `public/images/**` more – and a glob
// puts a SLASH IMMEDIATELY BEFORE A STAR. Run the block matcher first and that `/*` is an OPENER: it
// runs to the next `*/`, which is the close of the next JSDoc, and everything between is deleted.
// Measured on `src/engine/world/lifeBeat.ts`: the opener is line 129
// (`// also the edge nine other \`world/*\` modules already take for THIS predicate…`) and the match
// runs to line 247 – **10,469 characters, the hub's entire import block**.
//
// ⚠⚠ THE SIZE OF IT, because a judge that cannot see an edge cannot refuse a cycle. Same parser, only
// the strip changed: **1651 -> 1728 resolved runtime edges, 77 RECOVERED ACROSS 17 FILES** (326 source
// files, 28.09 – ⚠ the absolute totals move with the tree, the +77 / 17 did not across two measurements
// an hour apart, and the per-file figures below are the ones worth reading):
// `world/phaseObligations.ts` +17, the hub **19 -> 30**, `lifeBeat/leak.ts` **0 -> 7, it was ENTIRELY
// invisible**, `lifeBeat/bereavement.ts` 0 -> 3, `lifeBeat/booth.ts` 0 -> 3, `world/summer.ts` +7,
// `world/kit.ts` +6, `art/feedArt.ts` +7. Nothing was ever INVENTED by the bad strip – it only ate –
// so no cycle this file ever reported was false; it simply could not see these 77 edges.
//
// ⭐ WHY A SCANNER AND NOT THE SWAP. Swapping the two `.replace` calls fixes the live case, and on
// this tree it is byte-for-byte what the scanner produces (measured: 0 edges differ). It is still not
// CORRECT, and the case it moves the failure to is a real one – a block comment whose closing `*/`
// sits on a line beginning with `//` loses its terminator to the line pass, and the block then runs
// to the NEXT `*/`, eating code exactly as before. Both fixtures are asserted at the foot of this
// file. A third case only the scanner survives: `/*` or `*/` inside a STRING. So the strip is one
// left-to-right pass that knows what a comment IS – the same reasoning `tests/helpers/source.ts`
// applies to its two strippers, taken one step further because this file's verdict is a cycle.
//
// ⚠ DIFFERENCES FROM THE OLD STRIP, both in the safe direction: a TRAILING `code // note` comment is
// now removed too (the old regex only took whole-line ones), which can only drop a phantom, and
// newlines inside a block comment are KEPT, so `^`-anchored matching still sees one statement per
// line instead of two joined ones. Measured: 0 resolved edges turn on either.
//
// ⚠ AND IT IS DELIBERATELY NOT REGEX-AWARE. A regex literal holding an unescaped `/*` inside a
// character class would fool it, and telling a regex literal from a division needs a real parser. The
// tree holds none today (the scanner agrees with the swap on all 325 files, and the swap is not
// regex-aware either), so the honest position is: this is a lexer for comments, strings and
// templates, and that is the whole of what it claims.
// ⚠⚠ AND THE LEXER ITSELF NOW LIVES IN `tests/helpers/source.ts` – T6.11, the same day. It was a
// SECOND COPY of the house strip, and F-03 / T5.14's rule bites hardest here: the thing that would
// drift between two copies is **the definition of a comment**, which is exactly what both instruments
// were wrong about, in two different ways, inside one wave. One lexer with a parameter is one
// definition; two lexers differing in one behaviour are two definitions that agree today.
//
// ⚠ WHY THIS CALL SITE PASSES `newlines: true` AND `codeOf` PASSES `false`, said here so the flag has
// a reason rather than a value: the parser below is `^`-ANCHORED, one statement per line. With the
// newlines dropped, an inline block comment BETWEEN two import statements joins them into a single
// line and the second import stops being seen at all – the dropped-edge defect arriving through the
// strip instead of through the regex. `codeOf`'s 26 pins are calibrated to the collapsing form, so it
// keeps it. `tests/helpers.test.ts` pins both readings of one input.
//
// ⚠ `html: false` HOLDS THE JUDGE'S READING STILL. This file never treated `<!-- -->` as a comment,
// so an import-shaped line inside a `.vue` template comment has always counted as an edge here.
// Changing that would move the graph, and the unification's whole safety claim is that it does not:
// the resolved edge set is identical before and after, measured both ways. Whether it SHOULD change is
// a separate question, and it is in the report rather than in this commit.
export function codeOnly(text: string): string {
  return stripComments(text, { html: false, newlines: true })
}

/** Every `import`/`export … from` edge in one source text, read per statement. */
export function importEdges(text: string): Edge[] {
  const out: Edge[] = []
  for (const stmt of importStatements(text)) {
    const spec = SPEC.exec(stmt)
    if (!spec) continue // `export { a, b }`, `import x = require('y')`, a bare import – not this shape
    out.push({
      typeOnly: TYPE_ONLY.test(stmt),
      clause: stmt.slice(0, spec.index).trim().replace(/\s+/g, ' '),
      spec: spec[1],
    })
  }
  return out
}

function walk(dir: string, keep: (name: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, keep, out)
    else if (keep(name)) out.push(full)
  }
  return out
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  return walk(dir, (name) => name.endsWith('.ts') || name.endsWith('.vue'), out)
}

/** ⚠ THE KEY IS A JSON PAIR AND NOT A DELIMITED STRING, and R2-03 is why – see the NUL-byte test at
 *  the bottom of this file. `JSON.stringify([a, b])` is injective over a pair of strings without
 *  needing a byte that "cannot appear in a path", which is the reasoning that put two literal NUL
 *  bytes in this file's own source in the first place. */
function edgeKey(from: string, to: string): string {
  return JSON.stringify([from, to])
}

/** Relative specifiers only – a package cannot close a cycle back into src/. '' when unresolvable. */
function resolveSpec(from: string, spec: string): string {
  if (!spec.startsWith('.')) return ''
  const base = resolve(dirname(from), spec)
  for (const cand of [base, base + '.ts', base + '.vue', join(base, 'index.ts')]) {
    try {
      if (statSync(cand).isFile()) return cand
    } catch { /* not this one */ }
  }
  return ''
}

/** The runtime dependency graph of one tree. ⚠ `dir` AND `strip` ARE PARAMETERS SO THE JUDGE CAN BE
 *  PUT IN FRONT OF A KNOWN CYCLE – see ARM 4. Defaults are the real ones, so every caller that asks
 *  about `src/` asks exactly what it always asked. */
function runtimeGraph(
  dir: string = SRC,
  strip: (text: string) => string = codeOnly,
): { edges: Map<string, Set<string>>; what: Map<string, string> } {
  const edges = new Map<string, Set<string>>()
  const what = new Map<string, string>()
  for (const file of sourceFiles(dir)) {
    // Comments are stripped FIRST: this file and several engine modules name the old cycle edges in
    // prose ("used to import WEEKS_PER_YEAR from season/calendar.ts"), and a comment must never
    // count as a dependency.
    // ⚠⚠ THROUGH THE SCANNER SINCE 28.09, NOT TWO REGEXES – it was two, block-first, and that strip
    // deleted the hub's whole import block and 77 edges besides. The header on `codeOnly` has the
    // measurement and why the obvious swap is not the fix.
    const text = strip(readFileSync(file, 'utf8'))
    const deps = new Set<string>()
    for (const { typeOnly, clause, spec } of importEdges(text)) {
      if (typeOnly) continue // erased at compile time – not a runtime edge
      const target = resolveSpec(file, spec)
      if (target) {
        deps.add(target)
        what.set(edgeKey(file, target), clause.slice(0, 80))
      }
    }
    for (const [, spec] of text.matchAll(BARE)) {
      const target = resolveSpec(file, spec)
      if (target) deps.add(target)
    }
    edges.set(file, deps)
  }
  return { edges, what }
}

/** Every strongly-connected component of size > 1 (plus any self-import). Tarjan, iterative – the
 *  graph is small but a recursive walk over ~180 modules is a stack risk for no benefit. */
function cycles(edges: Map<string, Set<string>>): string[][] {
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: string[] = []
  const found: string[][] = []
  let counter = 0

  for (const root of edges.keys()) {
    if (index.has(root)) continue
    const work: Array<[string, Iterator<string>]> = []
    index.set(root, counter); low.set(root, counter++); stack.push(root); onStack.add(root)
    work.push([root, (edges.get(root) ?? new Set()).values()])
    while (work.length) {
      const [node, it] = work[work.length - 1]
      const step = it.next()
      if (!step.done) {
        const next = step.value
        if (!index.has(next)) {
          index.set(next, counter); low.set(next, counter++); stack.push(next); onStack.add(next)
          work.push([next, (edges.get(next) ?? new Set()).values()])
        } else if (onStack.has(next)) {
          low.set(node, Math.min(low.get(node)!, index.get(next)!))
        }
        continue
      }
      work.pop()
      if (work.length) {
        const parent = work[work.length - 1][0]
        low.set(parent, Math.min(low.get(parent)!, low.get(node)!))
      }
      if (low.get(node) === index.get(node)) {
        const comp: string[] = []
        let w: string
        do { w = stack.pop()!; onStack.delete(w); comp.push(w) } while (w !== node)
        if (comp.length > 1 || (edges.get(node)?.has(node) ?? false)) found.push(comp.sort())
      }
    }
  }
  return found
}

describe('runtime import cycles', () => {
  it('src/ has no runtime import cycle – TB-02 and TB-07 stay closed', () => {
    const { edges, what } = runtimeGraph()
    const rel = (p: string) => relative(resolve(SRC, '..'), p)
    const report = cycles(edges).map((comp) => {
      const inside = comp.flatMap((a) =>
        [...edges.get(a)!]
          .filter((b) => comp.includes(b))
          .map((b) => `      ${rel(a)} -> ${rel(b)}  { ${what.get(edgeKey(a, b)) ?? ''} }`),
      )
      return `  cycle over ${comp.length} modules:\n${inside.join('\n')}`
    })
    expect(report, report.length ? `\n${report.join('\n\n')}\n` : '').toEqual([])
  })

  // ⚠ THE GUARD ABOVE IS ONLY WORTH ITS RUNTIME IF IT CAN FAIL, and "no cycles found" looks
  // identical whether the detector works or is quietly matching nothing. So the parser is checked
  // against a known cycle rather than trusted: these are the three edges TB-02/TB-07 removed, and
  // the type-only edge that must NOT be counted.
  it('the detector counts value imports and ignores `import type`', () => {
    const seen = (src: string) =>
      importEdges(src).map(({ typeOnly, spec }) => (typeOnly ? `type:${spec}` : `value:${spec}`))

    expect(seen(`import { WEEKS_PER_YEAR } from './season/calendar'`)).toEqual(['value:./season/calendar'])
    expect(seen(`import { SURNAMES } from './season/cohort'`)).toEqual(['value:./season/cohort'])
    expect(seen(`import { kidLadderRank } from './snapshot'`)).toEqual(['value:./snapshot'])
    // erased at compile time – the world/* modules rely on this being ignored
    expect(seen(`import type { WorldState } from '../world'`)).toEqual(['type:../world'])
    // a `type` SPECIFIER inside a value import is still a runtime edge
    expect(seen(`import { coachFactor, type Coach } from './coach'`)).toEqual(['value:./coach'])
    // re-exports carry runtime dependencies too – cohort.ts re-exports the name pools
    expect(seen(`export { FIRST_NAMES, SURNAMES } from './names'`)).toEqual(['value:./names'])
    expect(seen(`export type { LadderTrack } from './types'`)).toEqual(['type:./types'])
  })

  // ===============================================================================================
  // ⚠⚠ THE TWO DEFECTS OF THE DOT-ALL REGEX, AS FIXTURES – T6.9, 28.09
  // ===============================================================================================
  //
  // ⭐ WHY THE OLD REGEX IS WRITTEN OUT IN EACH ARM RATHER THAN DESCRIBED. This file is the judge of
  // the architecture's direction argument, and «the parser was improved» is not a measurement. Each
  // arm runs BOTH parsers over the same fixture and asserts the difference, so a reader who reverts
  // the per-statement reader «to simplify» meets the number that says why it was replaced. It is the
  // device `tests/wave4-life-row-stamp.test.ts` uses for its own `[^{}]*` pattern one file over.
  const DOT_ALL =
    /^[ \t]*(?:import|export)[ \t]+(type[ \t]+)?(?![\w$]*[ \t]*=)([\s\S]*?)from[ \t]*['"]([^'"]+)['"]/gm
  const dotAll = (src: string) =>
    [...src.matchAll(DOT_ALL)].map(([, , clause, spec]) => ({
      whole: clause.trim().replace(/\s+/g, ' ').slice(0, 60),
      spec,
    }))

  it('⭐⭐⭐ ARM 1 – a non-import line no longer borrows the next statement\'s specifier', () => {
    // The shape T6.8 measured on `world/lifeBeat.ts`: a declaration sits above a re-export, and the
    // dot-all clause starts on the DECLARATION and runs forward to the re-export's specifier. The
    // reported edge then says the hub «exports» a module because a function fifty screens up borrowed
    // its path – and direction is the one thing A-06's split is argued on.
    const fixture = [
      `export function lifeLogOf(world: WorldState): readonly LifeBeatRow[] {`,
      `  return world.lifeLog`,
      `}`,
      `export { weddingRow } from './lifeBeat/weddingCopy'`,
    ].join('\n')
    // the old parser, quoted: ONE match, and it is attributed to the function (the capture begins
    // after the keyword, so the clause reads `function lifeLogOf…` – T6.8's own report shows the same
    // text with the `export` still on it, which is the whole match rather than the clause group)
    expect(dotAll(fixture)).toEqual([
      { whole: 'function lifeLogOf(world: WorldState): readonly LifeBeatRow[', spec: './lifeBeat/weddingCopy' },
    ])
    // the new one: the declaration is not a statement that can carry a specifier, and the re-export
    // is reported as itself
    expect(importEdges(fixture)).toEqual([
      { typeOnly: false, clause: 'export { weddingRow }', spec: './lifeBeat/weddingCopy' },
    ])
  })

  it('⭐⭐⭐ ARM 2 – an edge inside a swallowed span is emitted instead of lost', () => {
    // ⚠⚠ THIS IS THE ARM THAT MATTERS, and it is a DROPPED edge rather than a mislabelled one: the
    // clause needs a `from` it cannot finish, and then it runs past the statement that owns it. Two
    // independent shapes do that, and both are legal source somebody can write today.
    //
    // (a) `from` AT THE END OF A LINE. `from[ \t]*['"]` cannot cross a newline, so the regex
    //     backtracks past `./alpha` entirely and takes `./beta` as ITS specifier – `lastIndex`
    //     resumes after `'./beta'` and the alpha edge is never emitted by anything.
    const brokenLine = [`import { a } from`, `  './alpha'`, `import { b } from './beta'`].join('\n')
    expect(dotAll(brokenLine).map((e) => e.spec), 'the old parser sees ONE edge where there are two').toEqual([
      './beta',
    ])
    expect(importEdges(brokenLine).map((e) => e.spec), 'both edges, in source order').toEqual([
      './alpha',
      './beta',
    ])

    // (b) A `'from'` STRING HANDS IT A CLOSING QUOTE TO EAT. `label: 'from'` gives the regex
    //     `from` + `'` + «everything up to the next quote» + `'`, so the match ends INSIDE the import
    //     line below it, with a garbage specifier that `resolveSpec` discards – and the real edge is
    //     gone with it. A copy string is a normal thing for this codebase to hold.
    const fromString = [
      `export const LABELS = {`,
      `  payer: 'from',`,
      `}`,
      `import { travelCostFor } from './sponsors'`,
    ].join('\n')
    expect(dotAll(fromString).map((e) => e.spec), 'the garbage specifier, and no sponsors edge').toEqual([
      ',\n}\nimport { travelCostFor } from ',
    ])
    expect(importEdges(fromString), 'the real edge, attributed to the import').toEqual([
      { typeOnly: false, clause: 'import { travelCostFor }', spec: './sponsors' },
    ])
  })

  it('⚠⚠ ARM 3 – the live edge set: nothing real is lost, and what IS dropped is a phantom', () => {
    // ⚠⚠ THE REGRESSION CONTROL FOR THE TWO ARMS ABOVE, and the only one of the three that is about
    // the real tree. A better parser that quietly emitted FEWER edges would be a bug wearing a
    // cleanup's clothes, so the whole edge SET is compared rather than a count – and it earned its
    // keep twice on the day it was written: a 40-line statement bound dropped seven real edges
    // (`sim.worker.ts`' import list is 53 lines) and a blank-line stop cut statements whose lists hold
    // a line comment. Both were found here and fixed, not reasoned about.
    //
    // ⭐⭐ AND THE MEASUREMENT DID NOT COME OUT «IDENTICAL», WHICH IS A FINDING AND NOT A WEAKENING.
    // ⚠⚠ RE-TAKEN 28.09 AFTER THE STRIP FIX, BECAUSE THE FIRST NUMBERS WERE READ THROUGH THE HOLE:
    // «1601 -> 1599» was a true statement about two BLINDFOLDED readings, 77 edges missing from each
    // arm. With the scanner in place: **1730 resolved runtime edges by the dot-all regex, 1728 by the
    // statement reader, 0 added** – and the conclusion is UNCHANGED, the same two edges drop for the
    // same reason. The two it drops are the dot-all clause's THIRD defect, and it is
    // the worst-directed of the three for this file – a PHANTOM runtime edge invented out of a
    // type-only import, because the match began on a line ABOVE it and so the `(type[ \t]+)?` group
    // came back empty:
    //
    //     engine/economy.ts     -> engine/season/types.ts   began on "export interface AdCategoryDef {"
    //     engine/season/rival.ts -> engine/match/types.ts    began on "export { applySurfaceStyle }"
    //
    // Both lines are `import type { … } from '…'` in the source. This file's own header says «`import
    // type` IS NOT A CYCLE … counting those would make this test demand a decomposition the
    // architecture explicitly does not want» – so the old set was wrong about them, and a judge that
    // can invent an edge can invent a cycle.
    //
    // ⚠ SO THE CLAIM IS NOT «the sets are equal». It is: every edge the statement reader drops comes
    // from a statement that really is type-only, asserted against that statement's own text. A reader
    // that starts dropping a VALUE edge reddens here with the edge named.
    const { edges } = runtimeGraph()
    const legacy = new Map<string, Set<string>>()
    for (const file of sourceFiles(SRC)) {
      // ⚠ BOTH ARMS READ THE SAME CORPUS, through the scanner – see the case's own header for why the
      // first numbers had to be thrown away and re-taken.
      const text = codeOnly(readFileSync(file, 'utf8'))
      const deps = new Set<string>()
      for (const [, typeMod, , spec] of text.matchAll(DOT_ALL)) {
        if (typeMod) continue
        const target = resolveSpec(file, spec)
        if (target) deps.add(target)
      }
      for (const [, spec] of text.matchAll(BARE)) {
        const target = resolveSpec(file, spec)
        if (target) deps.add(target)
      }
      legacy.set(file, deps)
    }
    const rel = (p: string) => relative(resolve(SRC, '..'), p)
    const flatten = (g: Map<string, Set<string>>) =>
      [...g].flatMap(([from, tos]) => [...tos].map((to) => `${rel(from)} -> ${rel(to)}`)).sort()
    const before = flatten(legacy)
    const after = flatten(edges)
    // ⚠ NOT VACUOUS: the graph has to have been built at all, by both parsers.
    expect(before.length, 'the old parser found no edges – the arm is empty').toBeGreaterThan(500)
    expect(after.length, `edges: dot-all ${before.length} -> per-statement ${after.length}`).toBeGreaterThan(500)
    // Nothing the statement reader finds is a surprise to the old one, so no phantom arrives with it.
    expect(after.filter((e) => !before.includes(e)), 'edges only the new parser sees').toEqual([])
    // ...and every edge it drops is a type-only import, proven against the source that carries it.
    for (const [from, tos] of legacy) {
      for (const to of tos) {
        if (edges.get(from)?.has(to)) continue
        const text = codeOnly(readFileSync(from, 'utf8'))
        const owner = importStatements(text).filter((stmt) => {
          const spec = SPEC.exec(stmt)
          return spec !== null && resolveSpec(from, spec[1]) === to
        })
        expect(owner.length, `${rel(from)} -> ${rel(to)}: no statement in the source owns this edge`).toBe(1)
        expect(
          TYPE_ONLY.test(owner[0]),
          `⚠⚠ ${rel(from)} -> ${rel(to)} was dropped and it is NOT a type-only import – that is a bug in the statement reader, not a cleanup: ${JSON.stringify(owner[0])}`,
        ).toBe(true)
      }
    }
  })

  // ===============================================================================================
  // ⚠⚠ ARM 4 – THE ONE ASSERTION THAT SAYS THE JUDGE STILL JUDGES (T6.9 second pass, 28.09)
  // ===============================================================================================
  //
  // ⭐⭐⭐ WHY AN EDGE-SET COMPARISON IS NOT ENOUGH, said plainly because it is the lesson of this whole
  // task. ARM 3 proves the parser adds no phantom and loses no value edge. It cannot tell you the file
  // can still REFUSE A CYCLE – it compares two readings of the same corpus, and if the corpus is wrong
  // both readings are wrong together. Both of T6.9's defects were found by somebody planting a real
  // cycle and getting a green run; neither was found by a count. So the judge is put in front of a
  // cycle it must find.
  const FIXTURE = fileURLToPath(new URL('fixtures/import-cycle/', import.meta.url))
  /** The strip that was here until 28.09: block comments first, then whole-line comments. */
  const blockFirst = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
  /** The obvious fix, and not the one that shipped – see the header on `codeOnly`. */
  const lineFirst = (t: string) => t.replace(/^[ \t]*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('⭐⭐⭐ ARM 4 – a real 2-module cycle is found, and the OLD strip could not see it', () => {
    // ⚠ `strip` OMITTED means «whatever this file really uses», which is the point of the second
    // assertion below – see its note.
    const named = (strip?: (t: string) => string) =>
      cycles((strip === undefined ? runtimeGraph(FIXTURE) : runtimeGraph(FIXTURE, strip)).edges).map((comp) =>
        comp.map((p) => relative(FIXTURE, p)).sort().join(' <-> '),
      )
    // ⚠ NOT VACUOUS: the fixture directory has to have been read at all.
    expect(sourceFiles(FIXTURE).map((p) => relative(FIXTURE, p)).sort()).toEqual(['hub.ts', 'leaf.ts'])
    // THE MEASUREMENT. With the strip this file shipped until today the cycle is INVISIBLE –
    expect(named(blockFirst), '⚠ the old strip: the re-export is inside the span it deletes').toEqual([])
    // – and with the one this file actually uses it is named. ⚠ NO STRIP ARGUMENT, DELIBERATELY: this
    // asks `runtimeGraph`'s own default, so a strip quietly reverted here reddens THIS line by name
    // rather than leaving a case that only ever compares two strips it was handed.
    expect(named(), 'the judge finds the cycle the fixture holds').toEqual(['hub.ts <-> leaf.ts'])
    // ...and the failure message a builder would actually see carries the clause, which is the half
    // that makes a red actionable rather than a puzzle.
    const { edges, what } = runtimeGraph(FIXTURE)
    const hub = join(FIXTURE, 'hub.ts')
    const leaf = join(FIXTURE, 'leaf.ts')
    expect(what.get(edgeKey(hub, leaf)), 'the hub -> leaf edge names its own statement').toBe('export { leafValue }')
    expect(what.get(edgeKey(leaf, hub)), 'and the leaf -> hub edge names its own').toBe('import { hubValue }')
    expect(edges.get(hub)?.has(leaf)).toBe(true)
    expect(edges.get(leaf)?.has(hub)).toBe(true)
  })

  it('⚠⚠ the shared lexer is used here with `newlines: true`, and an edge is what the flag costs', () => {
    // ⚠ THE FLAG IS PINNED AT ITS CALL SITE, in this file's own units. `tests/helpers/source.ts` owns
    // the lexer now (T6.11) and `codeOf` passes `newlines: false`; this file must pass `true`, because
    // the parser is `^`-anchored. With the newlines dropped, an INLINE comment between two import
    // statements joins them into one line and the second edge is never emitted – the dropped-edge
    // defect ARM 2 is about, arriving through the strip instead of through the regex.
    const inline = ["import { a } from './a' /* note", "   more */ import { b } from './b'"].join('\n')
    expect(importEdges(codeOnly(inline)).map((e) => e.spec), 'both edges, as this file reads it').toEqual([
      './a',
      './b',
    ])
    expect(
      importEdges(stripComments(inline, { html: false, newlines: false })).map((e) => e.spec),
      '⚠ and what flipping the flag would cost: one edge, silently',
    ).toEqual(['./a'])
  })

  it('⚠⚠ ARM 5 – neither regex ORDER is correct, which is why the strip is a scanner', () => {
    // ⭐ THE QUESTION THE SWAP DOES NOT ANSWER. Swapping the two `.replace` calls fixes the live case
    // and is byte-identical to the scanner on all 325 files of `src/` today. It is still not correct,
    // and these three fixtures are the reason – each is legal source, and each order gets one wrong.
    const specs = (t: string) => importEdges(t).map((e) => e.spec)

    // (a) THE LIVE CASE: a `//` line holding a path glob. `world/*` is a slash before a star, so the
    //     block matcher opens there and runs to the JSDoc's close, taking the import with it.
    const glob = [
      '// nine other `world/*` modules already take this edge',
      "import { rollBereavement } from './lifeBeat/bereavement'",
      '/** a later doc */',
      'export const x = 1',
    ].join('\n')
    expect(specs(blockFirst(glob)), 'block-first EATS the import').toEqual([])
    expect(specs(lineFirst(glob)), 'line-first survives it').toEqual(['./lifeBeat/bereavement'])
    expect(specs(codeOnly(glob)), 'and so does the scanner').toEqual(['./lifeBeat/bereavement'])

    // (b) THE MIRROR CASE, which is what the swap costs: a block comment whose closing `*/` sits on a
    //     line that BEGINS with `//`. The line pass deletes the terminator, so the block then runs to
    //     the next `*/` and eats the import – the same failure, from the other side.
    const mirror = [
      '/* a note',
      '// and the close is on this line */',
      "import { a } from './alpha'",
      '/** a later doc */',
      'export const y = 1',
    ].join('\n')
    expect(specs(lineFirst(mirror)), '⚠ line-first EATS the import here').toEqual([])
    expect(specs(blockFirst(mirror)), 'block-first survives this one').toEqual(['./alpha'])
    expect(specs(codeOnly(mirror)), 'and the scanner survives both').toEqual(['./alpha'])

    // (c) AND THE CASE NEITHER ORDER CAN GET RIGHT: a `/*` inside a STRING. No ordering of two
    //     regexes knows what a string is, which is the whole argument for one left-to-right pass.
    const inString = [
      "const marker = '/*'",
      "import { b } from './beta'",
      '/** a later doc */',
      'export const z = marker',
    ].join('\n')
    expect(specs(blockFirst(inString)), 'block-first eats it').toEqual([])
    expect(specs(lineFirst(inString)), 'line-first eats it too').toEqual([])
    expect(specs(codeOnly(inString)), 'only the scanner keeps the edge').toEqual(['./beta'])

    // ...and the scanner still removes what a strip is FOR: prose that names an edge it does not take.
    // This is the property the whole strip exists for (see `runtimeGraph`'s own note).
    const prose = [
      "// used to import WEEKS_PER_YEAR from './season/calendar'",
      '/* and this paragraph mentions',
      "   import { X } from './ghost'",
      '*/',
      "import { real } from './real'",
    ].join('\n')
    expect(specs(codeOnly(prose)), 'a comment is never a dependency').toEqual(['./real'])
  })

  // ⚠⚠ R2-03 – NO NUL BYTE IN TRACKED SOURCE TEXT, AND THIS FILE IS WHY THE CHECK EXISTS.
  //
  // Two literal NUL bytes lived on lines 71 and 135 of THIS file from the day it was written: the
  // `what` map's composite key was `${file}\0${target}`, a byte chosen because it cannot occur in a
  // path.
  //
  // ⚠ THE REVIEW SAID THEY NEUTERED THE GUARD AND THEY DID NOT – that half was mutation-tested and
  // did not reproduce. One genuine value edge added to `src/engine/world/ledger.ts`
  // (`import { inCollege } from './college'`) turned the cycle test RED, exit 1, naming a
  // 13-module component and the offending edge with its import clause – so the detector, and the
  // NUL-keyed map that prints the clause, both worked exactly as written.
  //
  // ⚠⚠ THE HARM WAS SOMEWHERE ELSE AND IT IS SPECIFIC TO A GUARD. Git classifies a blob holding a
  // NUL as BINARY, so every edit to this file arrived in review as `Binary files a/… and b/… differ`
  // and `tests/import-cycles.test.ts | Bin 8049 -> 8050 bytes`. Measured, not assumed: appending one
  // newline produced exactly those two lines and zero diff hunks. A file whose changes cannot be
  // read is a file whose weakening cannot be caught – and the whole point of an architecture guard
  // is that somebody notices when it stops guarding.
  //
  // So the key is a JSON pair now (`edgeKey`), and the byte cannot come back anywhere in the code
  // trees. Scoped to source EXTENSIONS deliberately: art, fonts and fixtures legitimately hold NULs
  // and are none of this test's business.
  it('no source file in the code trees contains a NUL byte – a guard git calls binary is unreviewable', () => {
    const ROOT = resolve(SRC, '..')
    const TEXT_EXT = ['.ts', '.tsx', '.vue', '.mjs', '.cjs', '.js', '.json', '.css', '.html']
    const trees = ['src', 'tests', 'scripts', 'tools', 'e2e'].filter((d) => {
      try {
        return statSync(join(ROOT, d)).isDirectory()
      } catch {
        return false
      }
    })
    const files = trees.flatMap((d) => walk(join(ROOT, d), (name) => TEXT_EXT.some((e) => name.endsWith(e))))
    // ⚠ NOT VACUOUS: the walk has to actually reach the trees. 669 files on 24.08.
    expect(files.length, 'the walk found no source files at all').toBeGreaterThan(300)
    // `readFileSync` as a BUFFER – decoding to a string first would not lose the byte, but the
    // comparison a reader expects is on the bytes, and this is a claim about bytes.
    const offenders = files
      .filter((f) => readFileSync(f).includes(0))
      .map((f) => relative(ROOT, f))
    expect(offenders, 'these files hold a NUL byte, so git treats their diffs as binary').toEqual([])
  })
})
