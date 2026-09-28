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

  // ===============================================================================================
  // ⚠⚠ T6.11, 28.09 – THE ORDER WAS THE FAILURE THE HEADER DESCRIBES, AND THESE ARE ITS ARMS
  // ===============================================================================================
  //
  // The case above («neither eats code that merely looks like a comment opener») was the right
  // question asked of one shape. Asked of three more, both strippers failed: they ran `BLOCK` FIRST,
  // so a `/*` inside a `//` line, a regex or a STRING opened a block comment that ran to the next
  // close and deleted the code between. Measured over 1,355 files before the fix: **85 files in which
  // `codeOf()` deleted code a comment-aware strip keeps, 183,115 non-whitespace characters.**
  //
  // ⭐ THE OLD ORDER IS WRITTEN OUT HERE ON PURPOSE. A reader who "simplifies" the scanner back to two
  // regexes meets the measurement instead of discovering it a wave later, which is the device
  // `tests/import-cycles.test.ts` ARM 5 uses for the same defect in its own copy of this strip.
  const BLOCK_FIRST = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '')
  const LINE_FIRST = (s: string) =>
    s.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

  it('⭐⭐⭐ a path glob in a line comment does not eat the code under it', () => {
    // THE LIVE CASE. This codebase writes `world/*` and `public/images/**` in prose, and a glob puts a
    // slash immediately before a star. `src/engine/world/lifeBeat.ts` carried exactly this shape and
    // it cost `tests/import-cycles.test.ts` the ability to see a planted import cycle.
    const src = [
      '// nine other `world/*` modules already take this edge',
      "const banned = 'amountCents'",
      '/** a later doc */',
      'const after = 1',
    ].join('\n')
    expect(BLOCK_FIRST(src), '⚠ the old order deletes the declaration').not.toContain('amountCents')
    expect(codeOf(src), 'the scanner keeps it').toContain("const banned = 'amountCents'")
    expect(scriptCodeOf(src)).toContain("const banned = 'amountCents'")
    // ...and the comment itself is still gone, which is what the helper is FOR.
    expect(codeOf(src)).not.toContain('nine other')
  })

  it('⭐⭐ a block comment closing on a `//` line – the case the obvious swap would break', () => {
    // ⚠ WHY THE FIX IS A SCANNER AND NOT `LINE` BEFORE `BLOCK`. Swapping them fixes the case above and
    // breaks this one: the line pass takes the comment's terminator with the line, and the block then
    // runs on to the next close exactly as before. Measured: the swap still disagrees with the scanner
    // on 41 files, and in all 41 it is the swap that eats – `tests/offers.test.ts` by 34,596 characters.
    const src = [
      '/* a note',
      '// and the close is on this line */',
      "const banned = 'amountCents'",
      '/** a later doc */',
      'const after = 1',
    ].join('\n')
    expect(LINE_FIRST(src), '⚠ the swap deletes the declaration here').not.toContain('amountCents')
    expect(codeOf(src), 'the scanner keeps it').toContain("const banned = 'amountCents'")
  })

  it('⭐⭐ a comment opener inside a STRING is not an opener – no regex order can know that', () => {
    const src = ["const marker = '/*'", "const banned = 'amountCents'", '/** a later doc */'].join('\n')
    expect(BLOCK_FIRST(src)).not.toContain('amountCents')
    expect(LINE_FIRST(src)).not.toContain('amountCents')
    expect(codeOf(src), 'only one left-to-right pass keeps it').toContain("const banned = 'amountCents'")
    // the marker string itself survives too – it is a string, not a comment
    expect(codeOf(src)).toContain("const marker = '/*'")
  })

  it('⚠⚠ the change is MONOTONE: a trailing comment is still KEPT, so no pin reads less', () => {
    // ⚠ THIS IS THE PROPERTY THAT MADE THE CHANGE SAFE TO MAKE, and it is deliberate rather than
    // accidental. The old `LINE` regex was anchored `^\s*`, so it only ever removed WHOLE-LINE
    // comments; an earlier draft of the scanner removed trailing ones too and that is the one
    // direction that makes a negative pin WEAKER. Measured after the fix: 0 of 1,355 files lose a
    // single character, 188,106 come back. A new red is therefore a real hole, never a re-calibration.
    const trailing = "const x = 1 // note about world/*\nconst y = 2"
    expect(codeOf(trailing), 'the trailing comment stays').toContain('// note about world/*')
    // ...and it still cannot open a block comment, which is the whole of the fix
    expect(codeOf(`${trailing}\n/** doc */\nconst z = 3`)).toContain('const y = 2')
    // a WHOLE-LINE comment goes, indentation and all – unchanged from the regex it replaces
    expect(codeOf('a\n   // gone\nb')).toBe('a\n\nb')
  })

  it('⚠ `codeOf` treats `<!--` as markup, not as text inside a string', () => {
    // The one place the fix is not a pure recovery of JS code: `<!-- -->` inside a quoted string used
    // to be removed wherever it appeared, and is now kept, because a string is a string. Same monotone
    // direction (text comes back), and `scriptCodeOf` still never treats it as a comment at all.
    expect(codeOf('const s = "<!-- kept -->"')).toBe('const s = "<!-- kept -->"')
    expect(codeOf('<div><!-- gone --></div>')).toBe('<div></div>')
    expect(scriptCodeOf('<div><!-- kept --></div>')).toBe('<div><!-- kept --></div>')
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
