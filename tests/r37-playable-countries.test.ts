// ⭐⭐ THE COUNTRY IS CHECKED AGAINST THE LIST, AND THE LIST IS ONE EDIT WIDE.
//
// The owner, 06.09: «country проверяется на форму, а не по списку – мне кажется это надо исправить,
// у меня в планах было расширить список стран вообще». Two claims live in that sentence and this
// file pins both, because the second is the one that decides how much the first costs him later.
//
// 1. THE GATE. `profileShapeError` asked whether the value LOOKED like an ISO 3166-1 alpha-2 code,
//    so `'ZZ'` opened a career and every surface that prints her passport fell back to a bare `ZZ`
//    and a pair of stray regional indicators. It now asks `shared/countries.ts` whether the code is
//    one the game offers.
//
// 2. THE GROWTH. Adding a country is one line in `shared/countries.ts` plus its English name in
//    `composables/countries.ts`, and NOTHING ELSE – so the list below is walked in BOTH directions,
//    which is what `composables/countries.ts`'s own header has always warned about: «a name here
//    with no code to pick it is unreachable, and a code with no name falls back to the bare two
//    letters». Those two sentences are the two arms.
//
// ⚠ AND THE SPLIT ITSELF IS PINNED. The codes had to cross into `src/shared` for the engine to be
// able to ask, and invariant 1 runs one way only: `src/shared` may not import `src/composables`.
// `scripts/engine-purity.mjs` bans vue/pinia in the framework-free zones and would NOT have seen a
// plain `../composables/countries` import, so the sweep at the bottom of this file is the arm that
// would.
//
// ⚠ MUTATION-VERIFIED. What each mutation reddened is written above the block it belongs to.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  PLAYABLE_COUNTRIES,
  isPlayableCountry,
  type PlayableCountry,
} from '../src/shared/countries'
import { COUNTRIES, COUNTRY_NAMES, POPULAR_COUNTRIES, flagEmoji } from '../src/composables/countries'
import { DEFAULT_PROFILE, profileShapeError } from '../src/shared/protocol'

// =================================================================================================
// 1. THE GATE – A COUNTRY THE GAME DOES NOT OFFER IS NOT A CAREER
// =================================================================================================
//
// MUTATION-VERIFIED: `profileShapeError`'s country check put back to the old `ALPHA2.test(...)`
// shape rule -> the four well-formed-but-unplayable rows go red on the sentence, and the two
// malformed rows stay green, which is the split that shows the gate really moved from the SHAPE to
// the LIST rather than merely getting stricter.
describe('E-06 / round 37 – the country is checked against the playable list', () => {
  const refused: { what: string; code: unknown }[] = [
    { what: "'ZZ' – the review's own escapee, a well-formed code no country owns", code: 'ZZ' },
    { what: "'AA'", code: 'AA' },
    { what: "'XK' – a real-world code this game does not offer", code: 'XK' },
    { what: "'MX' – a real country, simply not on the list", code: 'MX' },
    { what: "'us' – the right country in the wrong case", code: 'us' },
    { what: "'USA' – three letters", code: 'USA' },
    { what: "'' – nothing chosen at all", code: '' },
    { what: 'a number', code: 12 },
    { what: 'null', code: null },
  ]

  it.each(refused)('$what is refused', ({ code }) => {
    expect(profileShapeError({ ...DEFAULT_PROFILE, country: code })).toBe(`Unknown country: ${String(code)}`)
  })

  it('...and every country the game DOES offer opens a career', () => {
    for (const code of PLAYABLE_COUNTRIES) {
      expect(profileShapeError({ ...DEFAULT_PROFILE, country: code }), code).toBeNull()
    }
  })

  it('`isPlayableCountry` is total over unknown, like the validator that calls it', () => {
    for (const value of [undefined, null, 12, {}, [], ['US'], 'ZZ', '']) {
      expect(isPlayableCountry(value), String(value)).toBe(false)
    }
    expect(isPlayableCountry('US')).toBe(true)
  })
})

// =================================================================================================
// 2. THE GROWTH – ONE EDIT PLUS ITS NAME, IN BOTH DIRECTIONS
// =================================================================================================
//
// MUTATION-VERIFIED: `SE: 'Sweden'` deleted from `COUNTRY_NAMES` -> «SE is playable and has no
// English name» goes red naming the code (and `vue-tsc` fails first, on the missing key). A
// `ZW: 'Zimbabwe'` added to `COUNTRY_NAMES` with no code beside it -> «ZW has an English name but no
// code to pick it» goes red naming the name. `COUNTRIES` re-declared as its own array literal in
// `composables/countries.ts` -> the «one array» arm goes red.
describe('⭐ adding a country is ONE edit plus its name – and a red test if the name is forgotten', () => {
  it('every playable code has an English name', () => {
    for (const code of PLAYABLE_COUNTRIES) {
      const name = COUNTRY_NAMES[code]
      expect(
        typeof name === 'string' && name.length > 0,
        `${code} is playable and has no English name – add it to COUNTRY_NAMES in composables/countries.ts`,
      ).toBe(true)
      // ...and it is a NAME, not the code echoed back, which is what every call site falls back to.
      expect(name, `${code}'s name is just its code`).not.toBe(code)
    }
  })

  it('every playable code has a flag, and the flag is that code', () => {
    for (const code of PLAYABLE_COUNTRIES) {
      const flag = flagEmoji(code)
      const points = [...flag]
      expect(points.length, `${code} does not render as a flag`).toBe(2)
      for (const glyph of points) {
        const cp = glyph.codePointAt(0)!
        expect(cp, `${code} draws ${glyph}, which is not a regional indicator`).toBeGreaterThanOrEqual(0x1f1e6)
        expect(cp, `${code} draws ${glyph}, which is not a regional indicator`).toBeLessThanOrEqual(0x1f1ff)
      }
      // The pair really spells the code – a flag is derived, so this is what makes "derived" a fact.
      const spelled = points.map((g) => String.fromCharCode(g.codePointAt(0)! - 0x1f1e6 + 65)).join('')
      expect(spelled, `${code}'s flag spells ${spelled}`).toBe(code)
    }
  })

  it('every English name has a playable code to pick it', () => {
    for (const code of Object.keys(COUNTRY_NAMES)) {
      expect(
        isPlayableCountry(code),
        `${code} («${COUNTRY_NAMES[code]}») has an English name but no code to pick it, so it is unreachable`,
      ).toBe(true)
    }
    // Both directions together are the real claim: the two files hold the SAME set.
    expect(new Set(Object.keys(COUNTRY_NAMES))).toEqual(new Set<string>(PLAYABLE_COUNTRIES))
  })

  it('there is ONE array of codes, and the view helper re-exports it rather than copying it', () => {
    // `COUNTRIES` is the historical public name and 24 call sites still read it; it must be the
    // shared list itself, or the drift this whole split exists to prevent comes straight back.
    expect(COUNTRIES).toBe(PLAYABLE_COUNTRIES as readonly string[])
    expect(COUNTRIES.length).toBe(24)
    // ...and the nine POPULAR tiles stay a shortcut into that same list, never a different one.
    for (const code of POPULAR_COUNTRIES) {
      expect(PLAYABLE_COUNTRIES as readonly string[], `${code} is a tile but not playable`).toContain(code)
    }
  })

  it('the codes are well-formed alpha-2 and there are no duplicates', () => {
    for (const code of PLAYABLE_COUNTRIES) expect(code, `${code} is not an alpha-2 code`).toMatch(/^[A-Z]{2}$/)
    expect(new Set<string>(PLAYABLE_COUNTRIES).size).toBe(PLAYABLE_COUNTRIES.length)
  })

  it('the type and the array are the same list, so the compiler checks what this file checks', () => {
    // If `PlayableCountry` ever widened to `string` the `Record<PlayableCountry, string>` on
    // COUNTRY_NAMES would stop catching a forgotten name, and only the runtime arms above would be
    // left. This line stops compiling if it does.
    const each: Record<PlayableCountry, true> = Object.fromEntries(
      PLAYABLE_COUNTRIES.map((c) => [c, true]),
    ) as Record<PlayableCountry, true>
    expect(Object.keys(each).length).toBe(PLAYABLE_COUNTRIES.length)
  })
})

// =================================================================================================
// 3. INVARIANT 1 – THE DEPENDENCY RUNS UI -> SHARED AND NEVER BACK
// =================================================================================================
//
// MUTATION-VERIFIED: `import { COUNTRY_NAMES } from '../composables/countries'` added to
// `src/shared/countries.ts` -> red, naming the file and the line.
describe('invariant 1 – the framework-free zones do not import the view helpers', () => {
  const ZONES = ['src/shared', 'src/engine', 'src/worker', 'src/db']

  function files(dir: string): string[] {
    const out: string[] = []
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) out.push(...files(p))
      else if (/\.ts$/.test(name)) out.push(p)
    }
    return out
  }

  it('no file under src/shared, src/engine, src/worker or src/db imports src/composables', () => {
    const offenders: string[] = []
    let scanned = 0
    for (const zone of ZONES) {
      for (const file of files(zone)) {
        scanned += 1
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            if (/from\s+['"][^'"]*composables\//.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`)
          })
      }
    }
    // The sweep can see something – a zero-file walk would pass this test without testing anything.
    expect(scanned, 'the zones were not walked').toBeGreaterThan(50)
    expect(offenders, 'the dependency runs the other way (CLAUDE.md invariant 1)').toEqual([])
  })
})
