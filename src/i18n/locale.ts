// THE LOCALE IS APP STATE, NEVER CAREER STATE (spec §3.4, L1a).
//
// The chosen language lives with the other device preferences – sound, music, haptics, the week's
// story, the calendar sweep – and is the SAME object as they are: one plain localStorage flag
// (`tb-locale`) behind pure functions, readable before any career loads, switchable at any time.
// ⚠ IT IS NEVER WRITTEN INTO A SAVE and the worker never sees it: nothing in `src/engine`,
// `src/worker` or `src/db` imports this directory (`tests/i18n-purity.test.ts`), and
// `tests/i18n-twin.test.ts` shows the same seed ticking identically under `en` and `ru`. A
// preference that followed a player into the engine would be a fairness bug – invariant 2, applied to
// language.
//
// TWO ENTRY POINTS, ONE PREFERENCE (ruled 07.10): the first-run prompt (`LocalePrompt`, shown before
// the app on a device that has never answered) and the More switcher by the save controls. Both call
// `setLocale`, so there is exactly one way to change the answer.
//
// ⚠ `choice` AND `active` ARE TWO THINGS. `choice` is what the player answered (null = never asked,
// which is the whole definition of «first run»); `active` is the locale the screen renders in. They
// differ for the length of a catalog load: the answer is only committed once the language is ready to
// show, so the prompt stays up (rather than the screen going blank) until it is, and a returning
// Russian player boots into Russian without a flash of English. The newest request wins (`latest`),
// so a second tap during a slow load is never ignored – the prompt is always answerable.
import { computed, ref } from 'vue'
import { loadCatalog } from './catalog'

export const LOCALE_STORAGE_KEY = 'tb-locale'
export const LOCALES = ['en', 'ru'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

const HTML_LANG: Record<Locale, string> = { en: 'en', ru: 'ru' }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** The stored answer, or null – no storage, a private-mode throw and an unknown value all read as «never asked». */
export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Private mode / blocked storage: the answer holds for this session and the prompt asks again next launch.
  }
}

const choice = ref<Locale | null>(readStoredLocale())
const active = ref<Locale>(DEFAULT_LOCALE)
let latest = 0

/** The locale the screen renders in. */
export const locale = computed(() => active.value)
/** True on a device that has never answered – the first-run prompt's only condition. */
export const needsLocaleChoice = computed(() => choice.value === null)
/** True once the answered language is the one being rendered (false only while its catalog loads). */
export const localeSettled = computed(() => choice.value !== null && active.value === choice.value)

function applyDocumentLang(next: Locale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[next]
}

/** Answer (or change) the language. Resolves once it is the one on screen; the newest call wins. */
export async function setLocale(next: Locale): Promise<void> {
  const mine = ++latest
  await loadCatalog(next)
  if (mine !== latest) return
  active.value = next
  choice.value = next
  writeStoredLocale(next)
  applyDocumentLang(next)
}

/** Boot: render in the stored answer. Never writes storage, and resolves at once for English. */
export async function initLocale(): Promise<void> {
  const stored = choice.value
  if (stored === null || stored === active.value) return
  const mine = ++latest
  await loadCatalog(stored)
  if (mine !== latest) return
  active.value = stored
  applyDocumentLang(stored)
}

/** A device as it is at page load: `stored` is what storage held (null = never asked), and English is on
 *  screen until `initLocale` has loaded the stored language – exactly the boot sequence. */
export function resetLocaleForTests(stored: Locale | null = null): void {
  latest++
  choice.value = stored
  active.value = DEFAULT_LOCALE
}
