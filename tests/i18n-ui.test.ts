// THE UI LAYER – src/i18n/ (wave L1a): the reactive locale, `t()`, the CopyRef renderer, the miss
// counter, the lazy catalogs and the preference's persistence.
//
// ⚠ NO RUSSIAN PRODUCT COPY IS WRITTEN HERE. Catalog values are bracketed stand-ins (`[ru] …`) except
// where a case is about the Russian PLURAL machinery, which uses the style guide's own «неделя» table.
//
// ⚠ MUTATION ARMS (watched red; outputs in the wave report):
//   1. `countMiss` made a no-op -> the miss-counter cases go red (ruling 4 would read zero forever).
//   2. `setLocale` stops writing storage -> the persistence and relaunch cases go red.
//   3. `setLocale` stops honouring the newest request -> the «second tap wins» case goes red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CATALOG_TIMEOUT_MS,
  LOCALE_STORAGE_KEY,
  catalogStatus,
  initLocale,
  installCatalog,
  locale,
  localeSettled,
  missCount,
  missedKeys,
  needsLocaleChoice,
  readStoredLocale,
  registerCatalogLoader,
  renderCopy,
  resetI18nForTests,
  setLocale,
  t,
  useI18n,
} from '../src/i18n'
import { cp } from '../src/shared/i18n'
import { computed } from 'vue'

// This runner has no `localStorage` (Node's experimental global is an own property holding
// `undefined`), so the file supplies the browser's own object – the same shim, the same reason, as
// tests/component/setup.ts's `installMemoryStorage`, which is scoped to the component project.
const backing = new Map<string, string>()
let storageMode: 'ok' | 'throws' = 'ok'
beforeEach(() => {
  backing.clear()
  storageMode = 'ok'
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => {
        if (storageMode === 'throws') throw new Error('SecurityError')
        return backing.has(k) ? backing.get(k)! : null
      },
      setItem: (k: string, v: string) => {
        if (storageMode === 'throws') throw new Error('QuotaExceededError')
        backing.set(k, String(v))
      },
      removeItem: (k: string) => void backing.delete(k),
      clear: () => backing.clear(),
    },
  })
  resetI18nForTests()
})
afterEach(() => {
  vi.useRealTimers()
})

/** A catalog that arrives when the test says so. The promise exists BEFORE the loader is asked for it –
 *  `loadCatalog` calls the loader a microtask later, so a `release` captured inside the loader would still
 *  be a no-op at the moment a test wants to call it. */
function gatedCatalog(): { loader: () => Promise<Record<string, string>>; release: (c: Record<string, string>) => void } {
  let release: (c: Record<string, string>) => void = () => {}
  const gate = new Promise<Record<string, string>>((resolve) => (release = resolve))
  return { loader: () => gate, release }
}

describe('English costs nothing', () => {
  it('a device that has never answered renders English and has not been asked', () => {
    expect(locale.value).toBe('en')
    expect(needsLocaleChoice.value).toBe(true)
    expect(t('Start a new career')).toBe('Start a new career')
    expect(missCount()).toBe(0)
  })

  it('t fills params in English; the key is the whole catalog', () => {
    expect(t('Week {week} of {total}', { week: 3, total: 52 })).toBe('Week 3 of 52')
    expect(t('nav|Stats')).toBe('Stats')
    expect(missCount()).toBe(0)
  })

  it('answering English is one call, needs no catalog, and leaves the miss counter at zero', async () => {
    await setLocale('en')
    expect(locale.value).toBe('en')
    expect(needsLocaleChoice.value).toBe(false)
    expect(catalogStatus('en')).toBe('idle')
    expect(t('Home')).toBe('Home')
    expect(missCount()).toBe(0)
  })

  it('useI18n hands out the same functions', () => {
    const api = useI18n()
    expect(api.t('Home')).toBe('Home')
    expect(api.renderCopy(cp`Hello ${'Emma'}`)).toBe('Hello Emma')
    expect(api.locale.value).toBe('en')
  })
})

describe('a locale with no catalog file yet (today\'s Russian) renders English and COUNTS it', () => {
  it('every key is a miss: English text, one count per render, distinct keys listed', async () => {
    await setLocale('ru')
    expect(locale.value).toBe('ru')
    expect(catalogStatus('ru')).toBe('absent')
    expect(t('Start a new career')).toBe('Start a new career')
    expect(t('Start a new career')).toBe('Start a new career')
    expect(t('Home')).toBe('Home')
    expect(missCount()).toBe(3)
    expect(missedKeys().sort()).toEqual(['Home', 'Start a new career'])
  })

  it('switching back to English stops the counting', async () => {
    await setLocale('ru')
    t('Home')
    expect(missCount()).toBe(1)
    await setLocale('en')
    t('Home')
    t('Start a new career')
    expect(missCount()).toBe(1)
  })

  it('a CopyRef counts per key – the nested ones included', async () => {
    await setLocale('ru')
    expect(renderCopy(cp`Rain washed out ${cp`the ${'hitting'} session`}`)).toBe('Rain washed out the hitting session')
    expect(missCount()).toBe(2)
  })
})

describe('a loaded catalog renders, ICU plurals included', () => {
  it('translates, falls back per key, and re-renders from the catalog the moment it is installed', async () => {
    registerCatalogLoader('ru', async () => ({
      Home: '[ru] Home',
      'Next {weeks} weeks': 'Вперёд на {weeks, plural, one{# неделю} few{# недели} many{# недель} other{# недели}}',
    }))
    await setLocale('ru')
    expect(catalogStatus('ru')).toBe('ready')
    expect(t('Home')).toBe('[ru] Home')
    expect(t('Next {weeks} weeks', { weeks: 1 })).toBe('Вперёд на 1 неделю')
    expect(t('Next {weeks} weeks', { weeks: 5 })).toBe('Вперёд на 5 недель')
    expect(t('Next {weeks} weeks', { weeks: 22 })).toBe('Вперёд на 22 недели')
    expect(missCount()).toBe(0)
    expect(t('Away')).toBe('Away')
    expect(missCount()).toBe(1)
  })

  it('is reactive: a computed over t() flips with the locale and with a late catalog', async () => {
    const label = computed(() => t('Home'))
    expect(label.value).toBe('Home')
    installCatalog('ru', { Home: '[ru] Home' })
    await setLocale('ru')
    expect(label.value).toBe('[ru] Home')
    await setLocale('en')
    expect(label.value).toBe('Home')
    // the catalog arrives AFTER the player already asked for the language (the late-chunk case)
    resetI18nForTests()
    await setLocale('ru')
    expect(label.value).toBe('Home')
    installCatalog('ru', { Home: '[ru] late' })
    expect(label.value).toBe('[ru] late')
  })

  it('a catalog entry that will not render is a counted miss and shows English', async () => {
    installCatalog('ru', { Hello: 'Привет {name' })
    await setLocale('ru')
    expect(t('Hello')).toBe('Hello')
    expect(missCount()).toBe(1)
  })
})

describe('the preference is app state: one localStorage flag, never a save', () => {
  it('the answer is written under `tb-locale` and read back', async () => {
    await setLocale('ru')
    expect(backing.get(LOCALE_STORAGE_KEY)).toBe('ru')
    expect(readStoredLocale()).toBe('ru')
    await setLocale('en')
    expect(backing.get(LOCALE_STORAGE_KEY)).toBe('en')
  })

  it('an unknown stored value reads as «never asked»', () => {
    backing.set(LOCALE_STORAGE_KEY, 'klingon')
    expect(readStoredLocale()).toBeNull()
    backing.set(LOCALE_STORAGE_KEY, '')
    expect(readStoredLocale()).toBeNull()
  })

  it('a private-mode browser (storage throws) still answers for the session, and never throws', async () => {
    storageMode = 'throws'
    expect(readStoredLocale()).toBeNull()
    await expect(setLocale('ru')).resolves.toBeUndefined()
    expect(locale.value).toBe('ru')
    expect(needsLocaleChoice.value).toBe(false)
  })

  it('a relaunch with a stored Russian boots into Russian, and is not settled until its catalog is', async () => {
    backing.set(LOCALE_STORAGE_KEY, 'ru')
    resetI18nForTests(readStoredLocale())
    const { loader, release } = gatedCatalog()
    registerCatalogLoader('ru', loader)
    expect(needsLocaleChoice.value).toBe(false)
    expect(locale.value).toBe('en')
    expect(localeSettled.value).toBe(false)
    const booting = initLocale()
    expect(localeSettled.value).toBe(false)
    release({ Home: '[ru] Home' })
    await booting
    expect(localeSettled.value).toBe(true)
    expect(locale.value).toBe('ru')
    expect(t('Home')).toBe('[ru] Home')
    // booting never writes the preference
    expect(backing.get(LOCALE_STORAGE_KEY)).toBe('ru')
  })

  it('English is settled the instant a stored English is read – the common launch has no blank frame', () => {
    backing.set(LOCALE_STORAGE_KEY, 'en')
    resetI18nForTests(readStoredLocale())
    expect(needsLocaleChoice.value).toBe(false)
    expect(localeSettled.value).toBe(true)
  })
})

describe('the prompt is always answerable: the newest request wins, and a hung chunk cannot hold the screen', () => {
  it('a second tap during a slow load is honoured – English can never be locked out', async () => {
    const { loader, release } = gatedCatalog()
    registerCatalogLoader('ru', loader)
    const first = setLocale('ru')
    const second = setLocale('en')
    await second
    expect(locale.value).toBe('en')
    expect(readStoredLocale()).toBe('en')
    release({ Home: '[ru] Home' })
    await first
    // the superseded request landed late and changed nothing
    expect(locale.value).toBe('en')
    expect(readStoredLocale()).toBe('en')
  })

  it('a chunk that never arrives costs CATALOG_TIMEOUT_MS, then the language is on screen in English, counted', async () => {
    vi.useFakeTimers()
    const { loader, release } = gatedCatalog()
    registerCatalogLoader('ru', loader)
    const pending = setLocale('ru')
    await vi.advanceTimersByTimeAsync(CATALOG_TIMEOUT_MS - 1)
    expect(locale.value).toBe('en')
    await vi.advanceTimersByTimeAsync(2)
    await pending
    expect(locale.value).toBe('ru')
    expect(t('Home')).toBe('Home')
    expect(missCount()).toBe(1)
    // …and when the chunk finally lands, the screen is in Russian without another tap
    release({ Home: '[ru] Home' })
    await vi.advanceTimersByTimeAsync(0)
    expect(t('Home')).toBe('[ru] Home')
  })

  it('a loader that fails is `failed`, English is shown, and the next ask retries it', async () => {
    registerCatalogLoader('ru', () => Promise.reject(new Error('offline')))
    await setLocale('ru')
    expect(catalogStatus('ru')).toBe('failed')
    expect(t('Home')).toBe('Home')
    registerCatalogLoader('ru', async () => ({ Home: '[ru] Home' }))
    await setLocale('en')
    await setLocale('ru')
    expect(catalogStatus('ru')).toBe('ready')
    expect(t('Home')).toBe('[ru] Home')
  })
})
