// THE SHARED TEST HELPERS, PINNED – because merging near-identical helpers is how a source pin
// quietly stops seeing things.
//
// DRY-9 folded 32 local copies into tests/helpers/. Most of those copies were byte-identical, but
// two families were NOT, and in both the difference sits on the silent side of the ledger:
//
//   codeOf / scriptCodeOf – one strips `<!-- -->`, the other does not. Collapsing them would make
//                           several NEGATIVE source pins read LESS text than they read today, and a
//                           pin that stops seeing the thing it bans goes GREEN.
//   fnv1a / fnv1aHex      – one implementation, two return types. The pinned draw-sequence hashes
//                           depend on the bytes, so the hash itself gets a fixed vector here rather
//                           than being re-derived by the callers that trust it.
//
// A comment saying "do not merge these" would not have held – tests/pin-hygiene.test.ts exists for
// exactly that reason. This file makes the wrong merge FAIL.
import { describe, it, expect } from 'vitest'
import { codeOf, scriptCodeOf } from './helpers/source'
import { fnv1a, fnv1aHex } from './helpers/hash'

describe('codeOf and scriptCodeOf are two helpers on purpose', () => {
  const withHtml = ['const a = 1', '<!-- world.knock = 0 -->', 'const b = 2'].join('\n')

  it('both take out JS block and line comments', () => {
    for (const strip of [codeOf, scriptCodeOf]) {
      expect(strip('a /* gone */ b')).toBe('a  b')
      expect(strip('keep\n  // gone\nkeep2')).toBe('keep\n\nkeep2')
    }
  })

  it('codeOf ALSO takes out HTML comments – what a .vue pin needs', () => {
    expect(codeOf(withHtml)).not.toContain('world.knock')
    expect(codeOf('<div><!-- why --></div>')).toBe('<div></div>')
  })

  it('scriptCodeOf LEAVES HTML comments standing, and that is the whole point', () => {
    // ⚠ IF THIS EVER GOES GREEN WITH `codeOf` SUBSTITUTED IN, the two have been merged and every
    // negative pin routed through `scriptCodeOf` is now reading a smaller file than it thinks.
    // tests/knock.test.ts is the live example: `.not.toMatch(/world\.knock\s*=/)` over
    // src/worker/sim.worker.ts.
    expect(scriptCodeOf(withHtml)).toContain('world.knock = 0')
  })

  it('neither eats code that merely looks like a comment opener', () => {
    expect(scriptCodeOf('const url = "https://x/y"')).toBe('const url = "https://x/y"')
    expect(codeOf('const url = "https://x/y"')).toBe('const url = "https://x/y"')
  })
})

describe('fnv1a is one hash with two spellings', () => {
  it('holds a fixed vector, so a pinned draw-sequence hash cannot drift under its callers', () => {
    // The canonical FNV-1a 32-bit test vector.
    expect(fnv1aHex('')).toBe('811c9dc5')
    expect(fnv1aHex('a')).toBe('e40c292c')
    expect(fnv1aHex('foobar')).toBe('bf9cf968')
  })

  it('the hex form IS the numeric form, which is what let the two local copies merge', () => {
    for (const s of ['', 'a', '0.1234,0.5678', 'x'.repeat(1000)]) {
      expect(fnv1aHex(s)).toBe(fnv1a(s).toString(16).padStart(8, '0'))
    }
  })

  it('is not a constant function – the vectors above are not vacuous', () => {
    expect(fnv1a('a')).not.toBe(fnv1a('b'))
  })
})
