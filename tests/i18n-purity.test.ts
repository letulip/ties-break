// THE LOCALIZATION RIG'S IMPORT GRAPH (wave L1a, spec §3.3–§3.4): the engine never meets the locale.
//
// Three edges, one file, because they are one claim – «the language is UI state, the core is data»:
//   1. NOTHING under src/engine, src/worker, src/db or src/shared imports `src/i18n` (the reactive
//      locale, `t()`, the catalogs). CLAUDE.md invariant 1 already bans Vue from those zones;
//      `scripts/engine-purity.mjs` carries the same edge for `npm run check`, and this pin proves the
//      script's list and the directory agree.
//   2. `src/shared/i18n.ts` – the framework-free core both halves may import – imports NOTHING: no Vue,
//      no Pinia, not even another file of ours, and touches no storage, clock, randomness or DOM.
//   3. NO `Intl.NumberFormat` / `toLocale*String` in the core or the UI layer (owner, 07.10, spec §9.6:
//      money and numbers keep ONE form across locales). `Intl.PluralRules` is the only Intl in use.
// Plus one coupling the harness depends on: the e2e seed carries the same storage key the app reads.
//
// ⚠ EVERY SLICE GOES THROUGH tests/helpers/source.ts – `codeOf` strips the prose (this directory's own
// headers quote the very names the pins ban), and the markers are the throwing helpers, never a raw
// `indexOf`. The detector is proved on synthetic sources first, so a pin that scans nothing is red.
//
// ⚠ MUTATION ARMS (watched red; outputs in the wave report):
//   1. src/engine/world/tick.ts gains `import { locale } from '../../i18n'` -> edge 1 goes red.
//   2. src/shared/i18n.ts gains `import { ref } from 'vue'` -> edge 2 goes red.
//   3. src/i18n/locale.ts gains `new Intl.NumberFormat()` -> edge 3 goes red.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { codeOf, lineAt } from './helpers/source'
import { LOCALE_STORAGE_KEY } from '../src/i18n'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')
const I18N_DIR = join(SRC, 'i18n')
const ZONES = ['engine', 'worker', 'db', 'shared'].map((z) => join(SRC, z))

function filesUnder(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) filesUnder(full, out)
    else if (/\.(ts|vue|mjs|js)$/.test(name)) out.push(full)
  }
  return out
}

/** Every module specifier a source imports: `from 'x'`, bare `import 'x'`, dynamic `import('x')`. */
function specifiersOf(source: string): string[] {
  const found: string[] = []
  for (const m of codeOf(source).matchAll(/(?:\bfrom|\bimport)\s*\(?\s*['"]([^'"]+)['"]/g)) found.push(m[1]!)
  return found
}

/** Does `source` (living at `file`) import something inside `src/i18n`? */
function importsI18nLayer(source: string, file: string): string[] {
  return specifiersOf(source).filter((spec) => {
    if (!spec.startsWith('.')) return /^(@\/|src\/)i18n(\/|$)/.test(spec)
    const target = resolve(dirname(file), spec)
    return target === I18N_DIR || target.startsWith(I18N_DIR + sep)
  })
}

describe('the detector itself (a pin that scans nothing is red)', () => {
  const at = join(SRC, 'engine', 'x.ts')
  it('flags the UI layer, however it is spelled', () => {
    expect(importsI18nLayer("import { t } from '../i18n'", at)).toHaveLength(1)
    expect(importsI18nLayer("import { t } from '../i18n/index'", at)).toHaveLength(1)
    expect(importsI18nLayer("export { locale } from '../i18n/locale'", at)).toHaveLength(1)
    expect(importsI18nLayer("import '../i18n/catalog'", at)).toHaveLength(1)
    expect(importsI18nLayer("const m = await import('../i18n')", at)).toHaveLength(1)
  })
  it('lets the framework-free core through, and ignores prose', () => {
    expect(importsI18nLayer("import { cp } from '../shared/i18n'", at)).toHaveLength(0)
    expect(importsI18nLayer("import { cp } from './i18n'", join(SRC, 'shared', 'y.ts'))).toHaveLength(0)
    expect(importsI18nLayer("// import { t } from '../i18n'\nconst a = 1", at)).toHaveLength(0)
    expect(importsI18nLayer("/* import { t } from '../i18n' */", at)).toHaveLength(0)
  })
})

describe('edge 1: no framework-free zone imports src/i18n', () => {
  const files = ZONES.flatMap((zone) => filesUnder(zone))
  it('the scan covers the real zones', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(files.some((f) => f.endsWith(join('shared', 'i18n.ts')))).toBe(true)
    expect(files.some((f) => f.endsWith(join('engine', 'world.ts')))).toBe(true)
  })
  it('none of them reaches the UI half of the language layer', () => {
    const offenders = files.flatMap((file) =>
      importsI18nLayer(readFileSync(file, 'utf8'), file).map((spec) => `${relative(ROOT, file)} imports ${spec}`),
    )
    expect(offenders).toEqual([])
  })
  it('and the machine gate lists the directory too (scripts/engine-purity.mjs)', () => {
    const line = lineAt(readFileSync(join(ROOT, 'scripts', 'engine-purity.mjs'), 'utf8'), 'const UI_DIRS')
    expect(line).toContain('|i18n)')
  })
})

describe('edge 2: the core is a leaf with no side effects', () => {
  const core = codeOf(readFileSync(join(SRC, 'shared', 'i18n.ts'), 'utf8'))
  it('imports nothing at all – no Vue, no Pinia, no sibling module', () => {
    expect(core).not.toMatch(/^\s*import\b/m)
    expect(core).not.toMatch(/\brequire\s*\(/)
    expect(core).not.toMatch(/from\s+['"]/)
    expect(core).not.toMatch(/\b(vue|pinia)\b/)
  })
  it('touches no storage, DOM, clock or randomness – the locale is a parameter, never ambient', () => {
    for (const banned of [/\blocalStorage\b/, /\bsessionStorage\b/, /\bdocument\b/, /\bwindow\b/, /\bMath\.random\b/, /\bDate\b/, /\bperformance\b/]) {
      expect(core, `shared/i18n.ts must not match ${banned}`).not.toMatch(banned)
    }
  })
  it('holds no module state the locale could live in (the only `let`s are inside functions)', () => {
    expect(core).not.toMatch(/^let\s/m)
  })
})

describe('edge 3: no number or money formatting in the language layer (spec §9.6)', () => {
  const layer = [join(SRC, 'shared', 'i18n.ts'), ...filesUnder(I18N_DIR)]
  it('the scan covers the core and the UI layer', () => {
    expect(layer.length).toBeGreaterThanOrEqual(4)
  })
  it('no Intl.NumberFormat and no toLocale*String', () => {
    for (const file of layer) {
      const code = codeOf(readFileSync(file, 'utf8'))
      expect(code, `${relative(ROOT, file)}`).not.toMatch(/NumberFormat|toLocale\w*String|Intl\.DateTimeFormat|Intl\.RelativeTimeFormat/)
    }
  })
  it('the UI layer draws no dice and reads no clock', () => {
    for (const file of filesUnder(I18N_DIR)) {
      const code = codeOf(readFileSync(file, 'utf8'))
      expect(code, `${relative(ROOT, file)}`).not.toMatch(/\bMath\.random\b|\bnew Date\b|\bDate\.now\b/)
    }
  })
  it('Intl.PluralRules is the one Intl the core uses', () => {
    const core = codeOf(readFileSync(join(SRC, 'shared', 'i18n.ts'), 'utf8'))
    expect([...core.matchAll(/\bIntl\.(\w+)/g)].map((m) => m[1]).every((name) => name === 'PluralRules' || name === 'LDMLPluralRule')).toBe(true)
    expect(core).toMatch(/new Intl\.PluralRules\(/)
  })
})

describe('the e2e harness answers the language question with the key the app reads', () => {
  it('playwright.config.ts and e2e/careerAt.ts both seed LOCALE_STORAGE_KEY', () => {
    expect(LOCALE_STORAGE_KEY).toBe('tb-locale')
    const config = readFileSync(join(ROOT, 'playwright.config.ts'), 'utf8')
    const seed = readFileSync(join(ROOT, 'e2e', 'careerAt.ts'), 'utf8')
    expect(lineAt(config, "name: 'tb-locale'")).toContain(`'${LOCALE_STORAGE_KEY}'`)
    expect(lineAt(seed, "storage: { 'tb-locale'")).toContain(`'${LOCALE_STORAGE_KEY}': 'en'`)
  })
})
