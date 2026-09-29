// =================================================================================================
// T6.9 · THE SOURCE READERS RETURN THE MODULE SET THEY PROMISE – RECURSIVELY, OR THEY SAY SO
// (T6.9 of docs/plans/principles-fix-builder-2026-09.md; the readers are `tests/worldSource.ts`)
// =================================================================================================
//
// WHAT THIS GUARDS, AND WHY IT IS A TEST RATHER THAN A COMMENT. `worldSource()` and
// `engineModuleSource()` both read a directory with `readdirSync(...).filter(f => f.endsWith('.ts'))`,
// which DOES NOT RECURSE. From the commit T6.8 created `src/engine/world/lifeBeat/` with thirteen
// kind modules, `worldSource()` returned 63 of the module set's 77 files while its own header still
// called itself «the whole module set» – so twenty-one consumers, and every `worldFunction` caller
// behind them, silently read a corpus narrower than the one they name.
//
// ⚠⚠ THE TWO MEASURED CONSEQUENCES, so this file is read as a receipt and not as hygiene:
//
//   · `tests/wave5-psy-counsel.test.ts`' «no new `type: 'life'` write site anywhere in the engine»
//     counted 8 sites before the leak section moved and 7 after. The write site had not gone
//     anywhere; the SWEEP had. T6.8 re-aimed that one case to `engineSource()` – correctly, its own
//     title claims engine-wide scope – which fixed the case and left the READER broken for everyone
//     else.
//   · `tests/life-beat-keys.test.ts` – T3.9's inventory, the guard against CLAUDE.md invariant 2's
//     SILENT RE-DEAL – reads `engineModuleSource('world/lifeBeat')`. Armed by hand on 28.09: a module
//     at `world/lifeBeat/copy/armNested.ts` holding `rngFromSeed(\`${seed}:life:arm-nested:${week}\`)`
//     left that file at **14 passed, exit 0**, with the key nowhere in its inventory. With the
//     recursion in place the same arm reddens: «world/lifeBeat: the key set moved: expected [ …(21) ]
//     to deeply equal [ …(20) ] + "${seed}:life:arm-nested:${week}"». The silent re-deal reproduced
//     and then closed, rather than quoted.
//
// ⭐ WHY THE ASSERTION IS AN EQUALITY AGAINST A SECOND WALK AND NOT A COUNT. A number would be a pin
// on today's tree that the next honest module breaks, and «13 modules» in a test is the count-in-prose
// failure one layer down. So the readers' own file list is compared with an INDEPENDENT recursive walk
// (`readdirSync(dir, { recursive: true })` – a different mechanism, not the reader's own loop asserting
// itself), and the claim is set equality: every file the tree holds, nothing the tree does not.
//
// ⚠ AND THE POSITIVE CONTROL COMES FIRST, because a recursion guard over a FLAT tree cannot fail:
// with no package anywhere under `src/engine/` every assertion here would pass against the old flat
// reader too. So the corpus is asserted to contain a nested module at all. If a wave legitimately
// flattens the last package, this reddens with that sentence and is re-aimed in one reviewed line –
// which is the point: it says out loud that the guard has nothing to look at.
import { describe, expect, it } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { diarySource, engineModuleSource, engineSource, homeSource, worldSource } from './worldSource'

const ENGINE = fileURLToPath(new URL('../src/engine/', import.meta.url))

/** Every `.ts` under `dir`, relative to it, found by `readdirSync`'s OWN recursion – deliberately a
 *  different mechanism from the reader's hand-written walk, so neither can hide the other's gap. */
function everyTs(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .map((p) => p.split('\\').join('/'))
    .filter((p) => p.endsWith('.ts'))
    .sort()
}

/** The per-file markers a reader emitted, in the `src/engine/<path>` spelling it writes them in. */
function markersOf(source: string): string[] {
  return [...source.matchAll(/^\/\/ ==== src\/engine\/(\S+) ====$/gm)].map((m) => m[1]).sort()
}

/** Which engine modules have a package directory beside them today – `<name>.ts` next to `<name>/`. */
function packagedModules(): string[] {
  const out: string[] = []
  const walk = (rel: string): void => {
    for (const entry of readdirSync(join(ENGINE, rel), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const name = rel ? `${rel}/${entry.name}` : entry.name
      try {
        if (statSync(join(ENGINE, `${name}.ts`)).isFile()) out.push(name)
      } catch {
        // a directory with no module file beside it – `match/`, `season/` – is not a package
      }
      walk(name)
    }
  }
  walk('')
  return out.sort()
}

describe('T6.9 – the engine source readers return the whole module set, however deep it goes', () => {
  it('⭐⭐⭐ the corpus really holds a nested module – a recursion guard over a flat tree cannot fail', () => {
    // ⚠ THE POSITIVE CONTROL, and see the header: without this line every assertion below would pass
    // against the FLAT reader this task replaced, which is the «unable to fail» family wearing a
    // recursion guard's clothes. `world/lifeBeat/` is the package T6.8 created.
    const nested = everyTs(ENGINE).filter((p) => p.split('/').length > 2)
    expect(
      nested.length,
      'no `.ts` sits two directories under src/engine/ – nothing here can distinguish a recursive reader from a flat one',
    ).toBeGreaterThan(0)
    expect(packagedModules(), 'the engine modules that have a package beside them').not.toEqual([])
  })

  it('⭐⭐⭐ worldSource() carries every `.ts` under src/engine/world/, and nothing else', () => {
    const expected = everyTs(join(ENGINE, 'world')).map((p) => `world/${p}`)
    expect(markersOf(worldSource()), 'the files worldSource() marked up').toEqual(expected)
  })

  it('⭐⭐⭐ engineModuleSource() carries every `.ts` of every packaged module', () => {
    for (const name of packagedModules()) {
      const expected = everyTs(join(ENGINE, name)).map((p) => `${name}/${p}`)
      expect(markersOf(engineModuleSource(name)), `engineModuleSource('${name}')`).toEqual(expected)
      // Not just the marker line: the module's own text has to be in there, which is the half a
      // marker-only check cannot see (tests/principles-a06-life-beat-direction.test.ts' own device).
      for (const rel of everyTs(join(ENGINE, name))) {
        const body = engineModuleSource(name)
        expect(body, `engineModuleSource('${name}') lost ${rel}'s body`).toContain(
          `// ==== src/engine/${name}/${rel} ====\n`,
        )
      }
    }
  })

  it('⭐⭐ diarySource() is engineModuleSource(\'diary\') and inherits the same recursion', () => {
    // It has always been that one call and nothing else – there is no second copy of the walk here to
    // drift – so this pins the delegation rather than re-measuring the walk. `src/engine/diary/` is
    // flat today; it no longer has to stay that way for the pins over it to be honest.
    expect(diarySource()).toBe(engineModuleSource('diary'))
  })

  it('⭐⭐ engineSource() is the whole layer, and the module readers are subsets of it', () => {
    const layer = markersOf(engineSource())
    expect(layer, 'every `.ts` under src/engine/').toEqual(everyTs(ENGINE))
    for (const marker of markersOf(worldSource())) {
      expect(layer, `the layer must contain ${marker}`).toContain(marker)
    }
  })

  it('⭐⭐ homeSource() resolves a document\'s engine home through the module set', () => {
    // The third shape of the same hole – a home a DOCUMENT spells. The strings-roundtrip tables say
    // `src/engine/world/lifeBeat.ts`, and T6.8 moved the copy sections one directory deeper; both
    // files went red with the string shipping unmoved. See `tests/worldSource.ts`' note on the claim
    // this trades («this FILE» -> «this MODULE SET») – it is a real loss of precision, taken on
    // purpose.
    expect(homeSource('src/engine/world/lifeBeat.ts')).toBe(engineModuleSource('world/lifeBeat'))
    // ⚠ AND A MODULE WITH NO PACKAGE IS THE OLD SINGLE-FILE READ, byte for byte – the widening only
    // happens where a split actually happened.
    expect(homeSource('src/engine/spirit.ts')).toBe(engineModuleSource('spirit'))
    expect(markersOf(homeSource('src/engine/spirit.ts')), 'spirit.ts has no package').toEqual([])
    // A home outside `src/engine/` is that file and nothing more – the `#OBJECT.field` homes and the
    // composables the tables also name must not start reading a module set.
    expect(homeSource('src/composables/identityCopy.ts')).toContain('DYNASTY_COPY')
    expect(markersOf(homeSource('src/composables/identityCopy.ts')), 'not an engine module').toEqual([])
  })
})
