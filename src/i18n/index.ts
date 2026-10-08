// THE UI'S ENTRY TO LOCALIZATION: `t()`, the CopyRef renderer, the miss counter (L1a).
//
//   t('Start a new career')                       – English renders itself, at the cost of one scan
//   t('Week {week} of {total}', { week, total })  – named params; arrays for positional
//   renderCopy(event.c)                           – a CopyRef the engine emitted, nested ones included
//
// The formatting is `src/shared/i18n.ts`'s; this file only supplies the reactive pieces – which locale
// is active, which catalog is loaded – and the session's miss counter.
//
// ⚠ THE MISS COUNTER IS PLAIN MODULE STATE, NOT A REF. It is bumped from inside a render (a missing
// key is found while the screen draws), and writing reactive state mid-render is how a component
// re-renders itself forever. Read it on demand: `missCount()` is ruling 4 («legacy English is not an
// acceptable visible fallback in Russian mode») as a number, and the L4 sweep asserts it is zero for
// the batches the owner has marked done. English never counts. `missedKeys()` names the distinct keys
// (capped) so a nonzero number can be chased.
import { locale, resetLocaleForTests, type Locale } from './locale'
import { catalogFor, resetCatalogsForTests } from './catalog'
import {
  renderCopyRef,
  translate,
  type CopyRef,
  type MessageParams,
  type MissReason,
  type RenderContext,
} from '../shared/i18n'

export { LOCALES, LOCALE_STORAGE_KEY, DEFAULT_LOCALE, isLocale, readStoredLocale, locale, needsLocaleChoice, localeSettled, setLocale, initLocale } from './locale'
export type { Locale } from './locale'
export { installCatalog, loadCatalog, registerCatalogLoader, catalogStatus, CATALOG_TIMEOUT_MS } from './catalog'
export type { Catalog } from './catalog'
export type { CopyRef, MessageParams } from '../shared/i18n'

const MISSED_KEYS_CAP = 500
let misses = 0
const missed = new Set<string>()

function countMiss(key: string, _why: MissReason): void {
  misses++
  if (missed.size < MISSED_KEYS_CAP) missed.add(key)
}

/** Misses since the page loaded (or the last reset): each time a key rendered in English under a non-English locale. */
export function missCount(): number {
  return misses
}

export function missedKeys(): string[] {
  return [...missed]
}

export function resetMisses(): void {
  misses = 0
  missed.clear()
}

function context(): RenderContext {
  // Both reads are reactive: a screen that calls `t` re-renders when the locale flips or a catalog arrives.
  const active = locale.value
  const catalog = catalogFor(active)
  return { locale: active, lookup: catalog ? (key) => catalog[key] : undefined, onMiss: countMiss }
}

export function t(key: string, params?: MessageParams): string {
  return translate(key, params, context())
}

export function renderCopy(ref: CopyRef): string {
  return renderCopyRef(ref, context())
}

/** For components that want the three in one destructure. */
export function useI18n(): { t: typeof t; renderCopy: typeof renderCopy; locale: typeof locale } {
  return { t, renderCopy, locale }
}

/** Back to a device that has never answered (or one that answered `stored`), with no catalogs and no misses. */
export function resetI18nForTests(stored: Locale | null = null): void {
  resetCatalogsForTests()
  resetLocaleForTests(stored)
  resetMisses()
}
