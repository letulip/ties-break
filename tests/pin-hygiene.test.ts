// PIN HYGIENE — the source-pin helpers cannot be used the wrong way round.
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
// failure is a search that quietly answers a different question than the one asked — the `indexOf`
// slice returning −1, a grep scoped to `src/` that skipped `tests/`, a `sed` range that collapsed on
// its start line. Every one of those was documented somewhere too. The lesson each time was the same:
// make the wrong thing FAIL, not merely discouraged.
//
// So: any variable assigned from `componentLogic(...)` may never appear in a negative assertion.
// Use `componentFile()` — the .vue alone — when the claim is about that file itself.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TESTS = fileURLToPath(new URL('./', import.meta.url))

function testFiles(): string[] {
  return readdirSync(TESTS, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => `${TESTS}${f}`)
}

/** Names bound to a widened source in this file, e.g. `const viewer = componentLogic('...')`. */
function widenedBindings(src: string): string[] {
  return [...src.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*componentLogic\s*\(/g)].map((m) => m[1])
}

describe('source-pin helpers cannot be used the wrong way round', () => {
  it('no widened component source is ever used in a NEGATIVE assertion', () => {
    const offenders: string[] = []
    for (const file of testFiles()) {
      const src = readFileSync(file, 'utf8')
      const bound = widenedBindings(src)
      if (!bound.length) continue
      for (const name of bound) {
        // expect(<name>)...not.  — the shape that is wrong for a widened corpus.
        // ⚠ \b AFTER THE NAME IS LOAD-BEARING: without it `viewer` prefix-matches `viewerFile`, and
        // the guard reports the very binding that fixes the problem. (It did, first run.)
        const negative = new RegExp(`expect\\(\\s*${name}\\b[^)]*\\)[^\\n]*\\.not\\.`, 'g')
        const hits = src.match(negative)
        if (hits) offenders.push(`${file.split('/tests/')[1]}: ${hits[0].slice(0, 70)}`)
      }
    }
    expect(
      offenders,
      'use componentFile() (the .vue alone) for a negative claim — componentLogic() widens the text and will trip on a composable definition',
    ).toEqual([])
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
