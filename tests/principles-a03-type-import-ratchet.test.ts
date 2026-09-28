// A-P3-2 / T6.6 – THE OWNING MODULE IS THE RIGHT SPECIFIER, AND THE FLIP IS A RATCHET, NOT A SWEEP.
//
// ⚠⚠ THE RULE WHOSE PREMISE WENT STALE. `CLAUDE.md`'s P4 block tells an extracted module to import
// `WorldState` as `import type` from `../world` – the barrel – and the reason it gives is «type-only,
// erased at compile time, so no runtime cycle». That reason is sound and the specifier is not:
// `WorldState` is DECLARED in `src/engine/world/state.ts` (R2-10 step 1 moved it there), and
// `world.ts` itself reaches it with `import type { … WorldState } from './world/state'`. So the
// package's own modules route a type through a bodiless barrel to reach a declaration one directory
// over, and the 26.09 lane measured what that costs: it holds the type-only SCC at 107 files, so the
// layering report cannot say anything about layering (A-P3-2, `01-architecture.md:565`'s table).
//
// ⚠ WHY A RATCHET AND NOT A 48-FILE SWEEP – the architect's ruling. A churn commit across
// `src/engine/world/**` would collide with T6.8, which is splitting `lifeBeat.ts` into that same
// directory right now. So: the set that exists TODAY is grandfathered by path, a NEW one is an
// error, and each grandfathered file converts when it is next touched for its own reasons. The
// design is `scripts/context-audit.mjs`'s baseline block, whose header states the property this
// file keeps: «A baseline entry that DISAPPEARS never fails. Tightening must not require a
// co-ordinated commit, or the next person banks their new debt into the baseline instead of paying
// it.»
//
// ⚠ WHERE THIS LIVES AND WHY IT IS A TEST. `scripts/engine-purity.mjs` is the other engine-import
// gate, but its whole sentence is invariant 1 – «no vue, no pinia, no UI directory» – and widening it
// to carry P4's decomposition rule would make a gate say more than its name, which is the failure
// this repo has been bitten by (that script's own header records it ok'ing a hole for weeks). A test
// is a real gate here and not a shelf item: CI runs the `unit` project on every pull request, in the
// `unit-bulk` / `unit-heavy` jobs (`.github/workflows/ci.yml:141`).
//
// ⚠ WHAT IT CLAIMS:
//   1. No file under `src/engine/world/**` that is not on the baseline imports a TYPE from the
//      barrel. The specifier is RESOLVED, not matched, so a nested module's `'../../world'` counts
//      and `'./state'` never does.
//   2. No file under `src/engine/world/**` imports a VALUE from the barrel – a HARD rule with no
//      baseline, because the count is 0 today and that is the edge P4's type-only rule exists to
//      protect (`world.ts:51`: «What a leaf may never do is import `world.ts` itself»). A runtime
//      edge there is a cycle, and `tests/import-cycles.test.ts` is its other witness.
//   3. The ratchet is ONE-WAY, asserted on synthetic input rather than promised in this comment.
//
// ⚠ WHAT IT DOES NOT CLAIM: not that the baseline shrinks, not a count of anything, and nothing at
// all about `src/engine/*` leaves outside the package (`offers.ts`, `kidLife.ts`, `diary/*`) – those
// are A-P3-3's subject and the rule for them is «acyclic», which `import-cycles.test.ts` owns.
//
// MUTATION ARMS (named, both quoted in T6.6's report): adding
// `import type { WorldState } from '../world'` to `src/engine/world/draw.ts` – a module NOT on the
// baseline, because it already asks the owner – turns case 1 red naming it; removing it is green.
// And converting a grandfathered file (`src/engine/world/summer.ts`) to `'./state'` leaves case 1
// green, which is the one-way half demonstrated on the real tree as well as on case 3's synthetic.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'

/** THE BASELINE – every file under `src/engine/world/**` that reached through the barrel for a type
 *  on 28.09.2026, measured with the arm below rather than listed by hand. An entry ending in `/` is a
 *  DIRECTORY prefix.
 *
 *  ⚠ THE ONE PREFIX ENTRY IS DATED AND TEMPORARY. `src/engine/world/lifeBeat/` is being created
 *  module by module by T6.8 while this lands (kinds 11-13 committed within the hour), and every new
 *  kind module follows `CLAUDE.md`'s CURRENT wording, so a per-path baseline would go red on a
 *  colleague's next commit – and a gate that reddens somebody else's in-flight work is a gate that
 *  gets switched off. It comes off when T6.8 lands: replace this line with the kind modules' paths,
 *  or convert them, whichever the architect prefers. Three of them carry the import today
 *  (`booth.ts`, `forkPsyCopy.ts`, `leak.ts`). */
const GRANDFATHERED: readonly string[] = [
  'src/engine/world/lifeBeat/', // ⚠ dated prefix – see the note above; T6.8 is live in this directory
  'src/engine/world/age.ts', 'src/engine/world/album.ts', 'src/engine/world/albumBook.ts',
  'src/engine/world/assets.ts', 'src/engine/world/birthday.ts', 'src/engine/world/bookings.ts',
  'src/engine/world/brand.ts', 'src/engine/world/brandStrength.ts', 'src/engine/world/business.ts',
  'src/engine/world/coachMarket.ts', 'src/engine/world/college.ts', 'src/engine/world/constants.ts',
  'src/engine/world/create.ts', 'src/engine/world/endings.ts', 'src/engine/world/entries.ts',
  'src/engine/world/entryCaps.ts', 'src/engine/world/fame.ts', 'src/engine/world/fieldNews.ts',
  'src/engine/world/form.ts', 'src/engine/world/injury.ts', 'src/engine/world/kit.ts',
  'src/engine/world/knock.ts', 'src/engine/world/knockHistory.ts', 'src/engine/world/ladder.ts',
  'src/engine/world/ledger.ts', 'src/engine/world/lifeBeat.ts', 'src/engine/world/loveEpisodes.ts',
  'src/engine/world/mandatory.ts', 'src/engine/world/masseur.ts', 'src/engine/world/matchNews.ts',
  'src/engine/world/means.ts', 'src/engine/world/medical.ts', 'src/engine/world/milestones.ts',
  'src/engine/world/multiWeek.ts', 'src/engine/world/planner.ts', 'src/engine/world/psychologist.ts',
  'src/engine/world/reckoning.ts', 'src/engine/world/shootClash.ts', 'src/engine/world/shop.ts',
  'src/engine/world/snapshot.ts', 'src/engine/world/sparring.ts', 'src/engine/world/sponsors.ts',
  'src/engine/world/spotlight.ts', 'src/engine/world/staffLetters.ts', 'src/engine/world/summer.ts',
  'src/engine/world/tick.ts', 'src/engine/world/tournamentClose.ts',
]

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const BARREL = resolve(ROOT, 'src/engine/world.ts')
const PACKAGE = resolve(ROOT, 'src/engine/world')

const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]))

interface Reach {
  file: string
  line: number
  names: string[]
  kind: 'type' | 'value'
}

/** Every import or re-export inside the package whose specifier RESOLVES to the barrel. ⚠ Parsed and
 *  resolved, never grepped for `'../world'`: the package's modules quote import lines in their own
 *  banners (`world/tick.ts`'s says exactly this rule out loud), and a nested module spells the barrel
 *  `'../../world'`, which a literal match would miss in the one direction that matters. */
function reachesTheBarrel(): Reach[] {
  const out: Reach[] = []
  for (const abs of walk(PACKAGE).filter((f) => f.endsWith('.ts'))) {
    const sf = ts.createSourceFile(abs, readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) && !ts.isExportDeclaration(st)) continue
      if (!st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue
      const spec = st.moduleSpecifier.text
      if (!spec.startsWith('.')) continue
      const target = resolve(dirname(abs), spec)
      if (target !== BARREL && target !== BARREL.replace(/\.ts$/, '')) continue
      const clause = ts.isImportDeclaration(st) ? st.importClause : null
      const nb = clause?.namedBindings
      const els = nb && ts.isNamedImports(nb) ? [...nb.elements] : []
      const names = els.map((el) => (el.propertyName ?? el.name).text)
      // Type-only = `import type { … }` on the clause, or every named binding carrying its own
      // `type` keyword. A MIXED import is a value import: it emits a require at runtime.
      const typeOnly = Boolean(clause?.isTypeOnly || st.isTypeOnly || (els.length > 0 && els.every((el) => el.isTypeOnly)))
      out.push({
        file: relative(ROOT, abs),
        line: sf.getLineAndCharacterOfPosition(st.getStart()).line + 1,
        names,
        kind: typeOnly ? 'type' : 'value',
      })
    }
  }
  return out
}

/** The ratchet's arithmetic, in one place so case 3 can feed it synthetic input. MEMBERSHIP ONLY,
 *  which is what makes it one-way: a baseline entry with no matching file contributes nothing. */
const notGrandfathered = (files: readonly string[]): string[] =>
  files.filter((f) => !GRANDFATHERED.some((g) => (g.endsWith('/') ? f.startsWith(g) : f === g)))

describe('A-P3-2 · the world package reaches its own state module, and the barrel only by grandfather', () => {
  it('⚠⚠ a NEW `import type { … } from \'…/world\'` inside src/engine/world/** is an error', () => {
    const offenders = reachesTheBarrel().filter((r) => r.kind === 'type')
    const fresh = notGrandfathered([...new Set(offenders.map((r) => r.file))])
    const where = fresh.map((f) => {
      const r = offenders.find((o) => o.file === f)
      return `${f}:${r?.line} imports { ${r?.names.join(', ')} } from the barrel`
    })
    expect(
      where,
      'a module inside src/engine/world/ must import a type from the module that DECLARES it – ' +
        '`WorldState` is `./state`, one directory over – not from the barrel. The baseline in this ' +
        'file is the set that predates the rule; it is not a place to add to.',
    ).toEqual([])
  })

  it('⚠ and NOTHING inside the package imports a VALUE from the barrel – no baseline, ever', () => {
    // The hard half. A runtime edge from a leaf back to `world.ts` is the cycle P4's type-only rule
    // exists to prevent, and it is zero today, so it is asserted as zero and not grandfathered.
    const values = reachesTheBarrel().filter((r) => r.kind === 'value')
    expect(
      values.map((r) => `${r.file}:${r.line} { ${r.names.join(', ')} }`),
      'a value import of the barrel from inside the package is a runtime cycle – import the owning module',
    ).toEqual([])
  })

  it('⭐ the ratchet is ONE-WAY: a grandfathered file that converts or vanishes cannot fail it', () => {
    // ⚠ ASSERTED, NOT PROMISED IN A COMMENT. `scripts/context-audit.mjs`'s header says a
    // disappearing baseline entry must never fail, and the way it went wrong there is instructive:
    // that gate's comment claimed a property its code did not have, for two reviews running. So the
    // arithmetic is fed synthetic sets here and its direction is measured.
    expect(notGrandfathered([]), 'every grandfathered file converted at once: still green').toEqual([])
    expect(notGrandfathered(['src/engine/world/summer.ts']), 'one stays behind: still green').toEqual([])
    expect(
      notGrandfathered(['src/engine/world/lifeBeat/aNewKindModule.ts']),
      'a file under the dated prefix is covered by it, however new',
    ).toEqual([])
    expect(
      notGrandfathered(['src/engine/world/draw.ts']),
      'and a module NOT on the baseline is named the moment it reaches for the barrel',
    ).toEqual(['src/engine/world/draw.ts'])
  })
})
