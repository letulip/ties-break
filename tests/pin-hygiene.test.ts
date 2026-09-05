// PIN HYGIENE – the source-pin helpers cannot be used the wrong way round.
//
// WHY THIS FILE EXISTS. `componentLogic()` returns an SFC PLUS every composable it imports, so a pin
// keeps covering the whole component however far it is decomposed. That widening is correct for a
// POSITIVE claim ("this logic exists somewhere in the component") and silently WRONG for a negative
// one: `expect(componentLogic(x)).not.toContain('setFoo')` will fail the moment `setFoo` is DEFINED
// in one of the composables, on a definition the assertion was never talking about.
//
// It is not hypothetical. It fired within minutes of the helper being introduced: the
// screen-i-live-match pin "MatchViewer seeds its refs from the getters – and imports no setter"
// broke because the widened text now included `matchDefaults.ts`, where `setMatchSpeedDefault`
// lives. The pin was right; the source was wrong.
//
// ⚠ A DOC COMMENT WAS NOT ENOUGH, which is the whole argument for this file. This repo's recurring
// failure is a search that quietly answers a different question than the one asked – the `indexOf`
// slice returning −1, a grep scoped to `src/` that skipped `tests/`, a `sed` range that collapsed on
// its start line. Every one of those was documented somewhere too. The lesson each time was the same:
// make the wrong thing FAIL, not merely discouraged.
//
// So: any variable assigned from `componentLogic(...)` may never appear in a negative assertion.
// Use `componentFile()` – the .vue alone – when the claim is about that file itself.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TESTS = fileURLToPath(new URL('./', import.meta.url))

// ⚠ THIS FILE IS NOT SCANNED, AND THE EXEMPTION IS ONE FILE WIDE. The derived-binding half below is
// proved on a FIXTURE – a string that spells out `const viewer = componentLogic(…)` and a negative
// assertion on a region cut from it – and the scanner reads raw text, so the guard would otherwise
// report its own anti-vacuity arm as an offender. This file carries no source pin of its own; every
// other `.test.ts` in the tree is read, including the ones added tomorrow.
const SELF = 'pin-hygiene.test.ts'

function testFiles(): string[] {
  return readdirSync(TESTS, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.test.ts') && !f.endsWith(SELF))
    .map((f) => `${TESTS}${f}`)
}

/** Names bound to a widened source in this file, e.g. `const viewer = componentLogic('...')`. */
function widenedBindings(src: string): string[] {
  return [...src.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*componentLogic\s*\(/g)].map((m) => m[1])
}

// =================================================================================================
// ⚠⚠ AND ONE LEVEL FURTHER – T-07, 05.09. A REGION CUT OFF A WIDENED SOURCE IS STILL WIDENED.
// =================================================================================================
//
// THE HOLE, MEASURED. The scan below looks for `expect( <bound name> …).not.`, i.e. the BOUND NAME
// itself, on one line. `const cut = region(viewer, 'a', 'b'); expect(cut).not.toContain('x')` walks
// straight past it – the negative assertion is on `cut`, and `cut` is not a name this guard had ever
// heard of. Four live instances on 05.09, all in `tests/screen-i-live-match.test.ts`, where a
// `<style>` block, an options table, a props block and a `withDefaults` object were each cut off a
// `componentLogic` binding and then asserted against negatively.
//
// ⚠ NONE OF THE FOUR WAS A FALSE PASS, and that is the reason to close it NOW rather than after one
// is. Each cut a region – `<style scoped>`, `defineProps<{ … }>`, a const table – that a composable
// happens not to be able to contain, so the guard's silence was luck rather than judgement. The next
// derived negative is one `region(logic, …)` away from being on text a composable CAN contain, and
// the failure would be the one this whole file exists to stop: a `.not.` that trips on a definition
// it was never talking about.
//
// ⚠ ONE LEVEL, DELIBERATELY, AND ONE LINE. `const Y = <anything naming a widened X>` makes Y widened;
// Y's own derivations are not chased. Following the chain to arbitrary depth is a dataflow analysis
// written in a regular expression, which is exactly the family of "a search that quietly answers a
// different question" this file's header is about. One level covers every real shape here (a helper
// call, a `region`, a regex `exec`) and cannot be wrong about what it claims.
function derivedBindings(src: string, widened: string[]): string[] {
  if (!widened.length) return []
  const known = new Set(widened)
  const mentionsWidened = new RegExp(`\\b(?:${widened.join('|')})\\b`)
  const out: string[] = []
  for (const m of src.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n]*)/g)) {
    const name = m[1]
    if (known.has(name) || out.includes(name)) continue
    if (mentionsWidened.test(m[2])) out.push(name)
  }
  return out
}

/** `expect(<name> …).not.` on one line – the shape that is wrong for a widened corpus.
 *  ⚠ \b AFTER THE NAME IS LOAD-BEARING: without it `viewer` prefix-matches `viewerFile`, and the
 *  guard reports the very binding that fixes the problem. (It did, first run.) */
function negativeUses(src: string, name: string): string[] {
  return src.match(new RegExp(`expect\\(\\s*${name}\\b[^)]*\\)[^\\n]*\\.not\\.`, 'g')) ?? []
}

describe('source-pin helpers cannot be used the wrong way round', () => {
  it('no widened component source is ever used in a NEGATIVE assertion, directly or one helper away', () => {
    const offenders: string[] = []
    for (const file of testFiles()) {
      const src = readFileSync(file, 'utf8')
      const bound = widenedBindings(src)
      if (!bound.length) continue
      const derived = derivedBindings(src, bound)
      for (const name of [...bound, ...derived]) {
        const via = bound.includes(name) ? '' : ' (cut from a widened source)'
        for (const hit of negativeUses(src, name)) {
          offenders.push(`${file.split('/tests/')[1]}: ${hit.slice(0, 70)}${via}`)
        }
      }
    }
    expect(
      offenders,
      'use componentFile() (the .vue alone) for a negative claim – componentLogic() widens the text and will trip on a composable definition, and a region CUT from it is just as wide',
    ).toEqual([])
  })

  it('⚠ ...and the derived half is not vacuous: the detector finds a one-level derivation', () => {
    // The arm the extension itself needs, on a fixture rather than on the tree – a rule whose only
    // witness is "the tree is clean today" cannot tell a working rule from a broken regex.
    const fixture = [
      "const viewer = componentLogic('components/MatchViewer.vue')",
      "const viewerFile = componentFile('components/MatchViewer.vue')",
      "const cut = region(viewer, 'defineProps<{', '}>(),')",
      "expect(cut).not.toContain('setMatchSpeedDefault')",
    ].join('\n')
    expect(widenedBindings(fixture), 'the direct binding').toEqual(['viewer'])
    expect(derivedBindings(fixture, ['viewer']), 'the region cut from it – and NOT viewerFile').toEqual(['cut'])
    expect(negativeUses(fixture, 'cut'), 'the negative assertion on the derived name').toHaveLength(1)
    // ...and the honest form is left alone, which is the half that says the rule is not simply
    // flagging everything.
    expect(derivedBindings("const ok = region(viewerFile, 'a', 'b')", ['viewer'])).toEqual([])
    expect(negativeUses(fixture, 'viewer'), 'no direct negative in the fixture').toHaveLength(0)
  })

  it('...and the rule is not vacuous: componentLogic IS in use somewhere', () => {
    const users = testFiles().filter((f) => widenedBindings(readFileSync(f, 'utf8')).length > 0)
    expect(users.length, 'no test binds componentLogic – this guard would pass trivially').toBeGreaterThan(0)
  })

  it('the ambiguous old name is gone, so it cannot be reintroduced by habit', () => {
    // `componentSource` did not say which question it answered, and the wrong one was picked first
    // time out. If it ever comes back, this fails and points at the two names that do say.
    const helper = readFileSync(`${TESTS}worldSource.ts`, 'utf8')
    expect(helper).not.toMatch(/export function componentSource\b/)
    expect(helper).toMatch(/export function componentLogic\b/)
    expect(helper).toMatch(/export function componentFile\b/)
  })
})
