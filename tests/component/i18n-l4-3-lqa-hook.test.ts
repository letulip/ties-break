// L4-3 – THE LQA RUNNER'S WINDOW HOOK: READ-ONLY, FLAGGED, AND ABSENT FROM A PLAYER'S BUNDLE (src/i18n/lqa.ts, src/main.ts).
//
// The hook exists so a browser run can ask the miss counter «what rendered in English on this screen». Three claims make it safe to
// have in the repo, and each is an arm below:
//   1. it READS the counter faithfully (count, distinct keys, the cap reported as `capped`) and its only write is clearing that counter;
//   2. it changes nothing a player or the engine could see – not the locale, not the catalogs, not the document language;
//   3. nothing but the LQA build can install it: `main.ts` reaches the module through ONE dynamic import behind the build-time flag, and
//      no other file in src/ imports it (so a player's bundle, built without the flag, has neither the hook nor the import).
// MUTATION ARMS (watched red): (a) `take` without `resetMisses()` -> the «take clears» arm; (b) `capped` pinned to false -> the cap arm;
// (c) the hook calling `setLocale` -> the «read-only» arm; (d) a static `import './i18n/lqa'` added to main.ts -> the guard arm.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { installCatalog, locale, missCount, missedKeys, resetI18nForTests, setLocale, t, MISSED_KEYS_CAP } from '../../src/i18n'
import { installLqaHook, type LqaHook } from '../../src/i18n/lqa'

const ROOT = resolve(__dirname, '../..')
const read = (path: string): string => readFileSync(resolve(ROOT, path), 'utf8')

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(resolve(ROOT, dir))) {
    const rel = `${dir}/${name}`
    if (statSync(resolve(ROOT, rel)).isDirectory()) walk(rel, out)
    else if (/\.(ts|vue)$/.test(name)) out.push(rel)
  }
  return out
}

describe('the hook reads the miss counter', () => {
  let target: Record<string, unknown>
  let hook: LqaHook
  beforeEach(async () => {
    resetI18nForTests()
    installCatalog('ru', { Home: 'x' })
    await setLocale('ru')
    target = {}
    hook = installLqaHook(target as unknown as Window)
  })
  afterEach(() => resetI18nForTests())

  it('is installed on the window it is handed, under the one name the runner reads', () => {
    expect(target.__tbLqa).toBe(hook)
  })

  it('peek is the counter as it stands: a lookup that falls back to English is one miss and one distinct key; a translated key is neither', () => {
    t('Home')
    t('Season')
    t('Season')
    expect(hook.peek()).toEqual({ count: 2, keys: ['Season'], capped: false })
    expect(missCount()).toBe(2) // the hook and the module agree
  })

  it('take reads and CLEARS – one screen at a time', () => {
    t('Season')
    expect(hook.take().count).toBe(1)
    expect(hook.peek()).toEqual({ count: 0, keys: [], capped: false })
    expect(missedKeys()).toEqual([])
  })

  it('a read that hit the distinct-key ceiling says so: the numbers are a floor, and the runner must not present them as exact', () => {
    for (let i = 0; i < MISSED_KEYS_CAP + 40; i++) t(`key ${i}`)
    const read = hook.peek()
    expect(read.keys).toHaveLength(MISSED_KEYS_CAP)
    expect(read.count).toBe(MISSED_KEYS_CAP + 40)
    expect(read.capped).toBe(true)
  })

  it('reports the locale and the document language it finds, and writes neither', async () => {
    expect(hook.locale()).toBe('ru')
    expect(hook.htmlLang()).toBe('ru') // setLocale('ru') stamped <html lang>: the LIVE half of RU-13C, asserted where the runner reads it
    hook.take()
    hook.reset()
    hook.peek()
    expect(locale.value).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    await setLocale('en')
    expect(hook.htmlLang()).toBe('en')
    expect(hook.locale()).toBe('en')
  })
})

describe('only the LQA build can install it', () => {
  const main = read('src/main.ts')

  it('main.ts reaches the module through a dynamic import, on the line of the build-time flag, and nowhere else', () => {
    const lines = main.split('\n').filter((l) => l.includes('i18n/lqa'))
    const code = lines.filter((l) => !l.trim().startsWith('//'))
    expect(code).toHaveLength(1)
    expect(code[0]).toMatch(/^if \(import\.meta\.env\.VITE_TB_LQA === 'on'\) void import\('\.\/i18n\/lqa'\)\.then\(\(m\) => m\.installLqaHook\(\)\)$/)
  })

  it('no other source file imports the hook – a static import anywhere would put it in a player\'s bundle', () => {
    const importers = walk('src').filter((f) => f !== 'src/main.ts' && f !== 'src/i18n/lqa.ts' && /from\s+['"][^'"]*i18n\/lqa['"]|import\(\s*['"][^'"]*i18n\/lqa['"]/.test(read(f)))
    expect(importers).toEqual([])
  })

  it('the switch is declared beside its sibling and the LQA config is the only thing that sets it', () => {
    expect(read('src/vite-env.d.ts')).toMatch(/readonly VITE_TB_LQA\?: string/)
    const setters = ['playwright.config.ts', 'playwright.lqa.config.ts', 'vite.config.ts', 'package.json'].filter((f) => /VITE_TB_LQA\s*[:=]/.test(read(f)))
    expect(setters).toEqual(['playwright.lqa.config.ts'])
  })

  it('the hook module imports nothing that can WRITE the locale or a catalog', () => {
    const src = read('src/i18n/lqa.ts').replace(/\/\/.*$/gm, '')
    expect(src).not.toMatch(/setLocale|installCatalog|registerCatalogLoader|loadCatalog|localStorage/)
  })
})
