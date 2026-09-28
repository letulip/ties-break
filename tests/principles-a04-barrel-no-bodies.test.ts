// A-04 (a) / T6.5 – P4'S STOP-RULE STOPS BEING A REVIEW GATE AND BECOMES A MECHANICAL ONE.
//
// ⚠⚠ WHY THIS FILE EXISTS, AND IT IS THE WHOLE POINT OF THE FINDING. P4's acceptance
// (docs/review/proposals/P4-world-decomposition.md:88) asks for a `world.ts` with «no function
// bodies», and its stop-rule (`:75`) says «a PR adding a function body to world.ts fails review».
// A REVIEW is a person reading a diff, and the 26.09 lane measured what that is worth: the file grew
// from 1,892 lines (26.08) to 2,878 (26.09) with the rule on the books the whole time, and P4 was
// simultaneously recorded as ongoing, done and opportunistic. Nothing in `npm run check` could see
// it. This test is that sentence written where a machine reads it.
//
// ⚠ WHAT IT CLAIMS, EXACTLY: `src/engine/world.ts` declares no function-like node WITH A BODY –
// no `function`, no method, no arrow or function expression, at the top level or nested inside
// anything. That is P4's word «body», so an added one-liner is red wherever it is hidden.
//
// ⚠ AND WHAT IT DELIBERATELY DOES NOT CLAIM, because a pin whose sentence is wider than its
// evidence is how this repo has been lied to before:
//   * NOT a line, byte or token budget. The barrel keeps its imports, its re-export lines and its
//     layering comments, and it MUST stay free to grow a re-export line – every new engine module
//     adds one, and a pin that fired on that would be repaired by deleting the compatibility
//     surface, which is the opposite of what P4 wants. (The barrel's NAME LIST is A-03/T6.6's pin,
//     not this one's.)
//   * NOT a claim about `world/*.ts`. The bodies all live there now; that is the fix, not a defect.
//   * NOT a type-level claim: `type F = () => void` and an interface's method signature carry no
//     body and are not counted. The barrel's four re-exported types stay legal.
//
// ⚠ PARSED WITH THE REPO'S OWN `typescript`, NOT WITH A REGEX – the shape
// `docs/review-principles-2026-09-26/probes/barrel-usage.mjs` uses for the same reason: this file is
// three quarters comment (C14: 74.5 % of its tokens), and it QUOTES function declarations in its
// prose. A regex pin over it would count `finalizeTournament`'s obituary as a body and be repaired
// by deleting the obituary. An AST cannot see a comment at all.
//
// MUTATION ARM (named, per the wave's own rule): add `function __mutationArm(): void {}` to
// src/engine/world.ts and this file goes red naming it. Both outputs are quoted in T6.5's report.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const PATH = '../src/engine/world.ts'
const source = readFileSync(new URL(PATH, import.meta.url), 'utf8')
const sf = ts.createSourceFile('world.ts', source, ts.ScriptTarget.Latest, true)

// ⚠ THE KINDS ARE LISTED RATHER THAN ASKED FOR AS `ts.isFunctionLike`, and the reason is the pin's
// own sentence. `isFunctionLike` admits a function TYPE and a method SIGNATURE, neither of which
// carries a body – a barrel is allowed `type F = () => void` – while `isFunctionLikeDeclaration` is
// not on `typescript`'s public surface (TS2551 on it, measured). So: the eight node kinds that can
// hold executable code, and the `body` test below, which also keeps an overload signature legal.
const BODIED: ReadonlySet<ts.SyntaxKind> = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
  ts.SyntaxKind.ClassStaticBlockDeclaration,
])

/** Every node in the file that HAS A BODY of executable code, with the line it starts on. A
 *  signature (function type, method signature, overload) has no body and is not one. */
function bodiesIn(file: ts.SourceFile): { kind: string; name: string; line: number }[] {
  const found: { kind: string; name: string; line: number }[] = []
  const visit = (node: ts.Node): void => {
    if (BODIED.has(node.kind) && (node as ts.FunctionLikeDeclaration).body) {
      const named = (node as { name?: ts.Node }).name
      found.push({
        kind: ts.SyntaxKind[node.kind],
        name: named && ts.isIdentifier(named as ts.Node) ? (named as ts.Identifier).text : '<anonymous>',
        line: file.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      })
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(file, visit)
  return found
}

describe('A-04 · the world barrel holds no function bodies (P4 acceptance :88, stop-rule :75)', () => {
  it('⚠⚠ src/engine/world.ts declares ZERO function bodies – a new one fails here, not at review', () => {
    const bodies = bodiesIn(sf)
    const where = bodies.map((b) => `${b.name} (${b.kind}) at world.ts:${b.line}`)
    expect(
      where,
      `src/engine/world.ts holds ${bodies.length} function bodies. P4's stop-rule: new engine ` +
        'behaviour is a new or existing module under src/engine/world/ plus one barrel line.',
    ).toEqual([])
  })

  it('⭐ and it is still the barrel – the pin is about bodies, never about size', () => {
    // The other half of the sentence, said mechanically so the first `it` cannot be "fixed" by
    // emptying the file: what P4 keeps here permanently is the public surface and its layering
    // comment, and both are asserted PRESENT. A `world.ts` that had lost its re-exports would pass
    // the body pin and break hundreds of importers, and this is the case that notices.
    // ⚠ A FLOOR, NOT A COUNT, AND DELIBERATELY A LOW ONE. The exact barrel list is A-03 / T6.6's pin
    // (it freezes the NAMES); this case only has to make the body pin above unfixable-by-emptying. A
    // count here would go red on every honest re-export line, which is the failure mode the header
    // warns about – and it nearly did: the floor was written as `> 50` against the tree at move 2 and
    // move 3 took the import list to exactly 50 as the tick's imports left with the tick.
    const reExports = sf.statements.filter((st) => ts.isExportDeclaration(st) || ts.isExportAssignment(st))
    expect(reExports.length, 'the compatibility surface is still exported from here').toBeGreaterThan(25)
    const imports = sf.statements.filter(ts.isImportDeclaration)
    expect(imports.length, 'and imported back from the modules that own it').toBeGreaterThan(25)
    // ⚠ NO `export *` – P4's other structural rule (the barrel is an EXPLICIT list, so the surface
    // cannot grow by accident and A-03's freeze has something to compare against).
    expect(
      reExports.filter((st) => ts.isExportDeclaration(st) && !st.exportClause).length,
      'the barrel names every symbol it re-exports',
    ).toBe(0)
    // ...and the layering comment P4 leaves here for ever is still here.
    expect(source).toContain('THE LEDGER PRIMITIVES moved to world/ledger.ts (P4 extraction)')
  })
})
