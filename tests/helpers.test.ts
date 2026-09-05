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
import { after, at, before, codeOf, lastAt, lineAt, region, regionToLast, regions, scriptCodeOf } from './helpers/source'
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

// =================================================================================================
// THE MARKER HELPERS THROW – T-02, 05.09 review. The property 176 migrated pins rest on.
// =================================================================================================
//
// WHY THIS EXISTS. On 24.08 every raw `src.slice(src.indexOf(a), src.indexOf(b))` in tests/ – 176 of
// them – was migrated onto these eight helpers, and the whole case for that migration was ONE
// sentence, quoted in CLAUDE.md's gotchas and in scripts/pin-ratchet.mjs's header: «every one of
// them THROWS on an absent marker». Two of the 176 had been lying at the time, one reading 59,944 of
// HomeScreen.vue's 126,815 characters.
//
// ⚠ AND NOTHING TESTED IT. Before this block there was not one `toThrow` on `at` / `lastAt` /
// `region` / `regionToLast` / `regions` / `after` / `before` / `lineAt` anywhere in tests/. An edit
// that made `at()` return -1 «for compatibility» would have re-opened all 176 pins at once, silently
// and in the direction where every one of them stays green: `slice(start, -1)` runs to the end of the
// file, a positive `toContain` finds its needle somewhere else, and a `.not.` trips only by luck.
// `npm run pins:check` forbids a NEW raw slice; it cannot notice the helpers it points people at
// turning into raw slices themselves.
//
// So each helper is asserted three ways: it throws on an absent marker, the message NAMES the marker
// that went missing (a red nobody can act on costs an afternoon), and – the anti-vacuity half – it
// returns the right region when the marker IS there, because a helper that threw unconditionally
// would satisfy every `toThrow` above and nothing else.
describe('the marker helpers throw on an absent marker – the property the pin estate rests on', () => {
  const SRC = ['const a = 1', 'const b = 2', 'const c = 3'].join('\n')

  it('at / lastAt throw instead of returning -1, and name the marker', () => {
    expect(() => at(SRC, 'const zzz')).toThrow(/not found/)
    expect(() => at(SRC, 'const zzz')).toThrow(/const zzz/)
    expect(() => lastAt(SRC, 'const zzz')).toThrow(/not found/)
    // ...and find it when it is there. `at` is the first occurrence, `lastAt` the last – the two are
    // different helpers because the ordering pins that use them mean different things.
    const twice = 'X marker Y marker Z'
    expect(at(twice, 'marker')).toBe(2)
    expect(lastAt(twice, 'marker')).toBe(11)
  })

  it('⚠ the -1 an ordering pin swallows: `at` cannot be less than every real index', () => {
    // The second shape source.ts's header names: `expect(a.indexOf(X)).toBeLessThan(a.indexOf(Y))`
    // PASSES when X is the marker that went missing, because -1 is less than every real index. Six
    // such assertions were migrated to `at()`. This is why that migration was not cosmetic.
    expect(SRC.indexOf('const zzz')).toBe(-1)
    expect(SRC.indexOf('const zzz')).toBeLessThan(SRC.indexOf('const b')) // the claim that stopped being made
    expect(() => at(SRC, 'const zzz')).toThrow() // ...and the same claim, now unable to pass
  })

  it('region throws on an absent START and on an absent END, separately', () => {
    expect(() => region(SRC, 'const zzz', 'const c')).toThrow(/marker not found – 'const zzz'/)
    expect(() => region(SRC, 'const a', 'const zzz')).toThrow(/end marker not found – 'const zzz'/)
    // The end-marker message says where the start WAS, so the reader knows which half rotted.
    expect(() => region(SRC, 'const a', 'const zzz')).toThrow(/the start marker 'const a' was found at 0/)
    expect(region(SRC, 'const a', 'const c')).toBe('const a = 1\nconst b = 2\n')
  })

  it('...and region looks for its end AFTER the start, so it can never come back empty', () => {
    // source.ts's ONE deliberate semantic change, asserted rather than described: the raw form
    // searched from position 0 and could pick an EARLIER occurrence, yielding an empty region – the
    // other half of the same silent failure. Searching forward can only widen, never narrow.
    const src = 'END and then START and then END'
    // ⚠ THE INDICES SIT ON THEIR OWN LINES ON PURPOSE. Written as one expression this is the exact
    // shape `npm run pins:check` forbids, and the ratchet is right not to try to tell an
    // illustration from a pin – it caught this line the first time it ran. Same demonstration, and
    // the -1 (here a 0) still cannot reach a slice bound unnoticed.
    const rawStart = src.indexOf('START')
    const rawEnd = src.indexOf('END') // 0 – the EARLIER occurrence, which is the whole problem
    expect(src.slice(rawStart, rawEnd), 'the raw form yields an empty region').toBe('')
    expect(region(src, 'START', 'END')).toBe('START and then ')
  })

  it('regionToLast throws on either marker AND on an inverted pair', () => {
    expect(() => regionToLast(SRC, 'const zzz', 'const c')).toThrow(/marker not found/)
    expect(() => regionToLast(SRC, 'const a', 'const zzz')).toThrow(/end marker not found/)
    expect(() => regionToLast('END middle START', 'START', 'END')).toThrow(/the region is inverted, so the pin is aimed wrong/)
    // The `<template>` … `</template>` shape it was written for: the LAST end, not the first.
    expect(regionToLast('A mid A tail A', 'mid', 'A')).toBe('mid A tail ')
  })

  it('regions returns [] for an absent START – zero occurrences is an ANSWER – and throws on an unclosed one', () => {
    // The one deliberate difference from `region`, and it is load-bearing:
    // `expect(cssBodies('.surface-dot')).toEqual([])` is a real assertion ("that rule is gone").
    expect(regions('a { x } b { y }', '.gone {', '}')).toEqual([])
    expect(regions('a { x } b { y }', '{', '}')).toEqual(['{ x ', '{ y '])
    // An OPENED region with no close is the widening half – unguarded in all three hand-written
    // copies this helper replaced.
    expect(() => regions('a { x } b { y', '{', '}')).toThrow(/end marker not found/)
  })

  it('after / before / lineAt throw rather than slicing from -1', () => {
    expect(() => after(SRC, 'const zzz')).toThrow(/not found/)
    expect(() => before(SRC, 'const zzz')).toThrow(/not found/)
    expect(() => lineAt(SRC, 'const zzz')).toThrow(/not found/)
    expect(after(SRC, 'const b')).toBe('const b = 2\nconst c = 3')
    expect(before(SRC, 'const b')).toBe('const a = 1\n')
    expect(lineAt(SRC, 'const b')).toBe('const b = 2')
    // ...and the last line of a file has no '\n' to stop at, which is its own branch.
    expect(lineAt(SRC, 'const c')).toBe('const c = 3')
  })

  it('⚠ every helper that throws also WORKS – the toThrow arms above are not passing on a broken helper', () => {
    // If any helper were changed to throw unconditionally, every assertion in this describe except
    // this one would still pass. This is the arm that says the eight of them still cut regions.
    expect(at(SRC, 'const b')).toBe(12)
    expect(lastAt(SRC, 'const b')).toBe(12)
    expect(region(SRC, 'const a', 'const b')).toBe('const a = 1\n')
    expect(regionToLast(SRC, 'const a', 'const c')).toBe('const a = 1\nconst b = 2\n')
    expect(regions(SRC, 'const ', ' =')).toHaveLength(3)
    expect(after(SRC, 'const c')).toBe('const c = 3')
    expect(before(SRC, 'const a')).toBe('')
    expect(lineAt(SRC, 'const a')).toBe('const a = 1')
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
