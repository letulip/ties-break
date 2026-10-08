// THE PSEUDO-LOCALE `xx` – wave L1b, spec §6. Layout breaks and unwrapped literals found by machine, before a
// single real translation exists.
//
//   buildPseudoCatalog(catalog)   every catalog key -> `⟦ the English, padded ~30% ⟧`, placeholders intact
//   expandText(text)              the same transform for TEXT ALREADY RENDERED (what a mounted test walks)
//
// WHY BRACKETS AND PADDING. Russian runs about a third longer than English, so a layout that only fits the
// English is a bug the owner's phone would find – the TourBriefingDialog lesson (a dismiss control 188 px off
// the screen on a blocking overlay). Padding with the string's OWN words keeps the glyph mix and the wrap
// opportunities realistic (a run of dots would never wrap). The brackets are the other half: under `xx` a
// string that reaches the screen WITHOUT them did not come through `t()` – a hardcode leak (spec §6).
//
// ⚠ TWO PATHS TO THE SCREEN, BOTH HERE. A wrapped string is looked up in the `xx` catalog like any language
// (`installPseudoLocale` in tests/component/pseudoloc.ts registers it through L1a's `registerCatalogLoader`).
// An UNWRAPPED string – nearly all of today's copy, until the L2 landings – never asks the catalog, so the
// overflow harness also transforms the DOM text it finds (`expandText`), which measures the real layout
// against +30% on every surface today. The per-batch full sweeps belong to the L2-n landings.
//
// ⚠ PURE AND DETERMINISTIC. No clock, no randomness; the same key always pads to the same text.
import { splitContext } from '../src/shared/i18n'
import type { Catalog } from './i18n-extract'

export const PSEUDO_LOCALE = 'xx'
export const PSEUDO_OPEN = '⟦'
export const PSEUDO_CLOSE = '⟧'
/** How much longer than the English the pad makes the string (Russian runs ~30% over). */
export const PSEUDO_GROWTH = 0.3

const PLACEHOLDER = /\\[{}\\#]|\{[A-Za-z0-9_]+\}/g

/** The visible English of a message with its placeholders and escapes removed – what a pad is measured against. */
function visibleLength(text: string): number {
  return text.replace(PLACEHOLDER, '').length
}

/** `pad` characters made of the string's own words (so it wraps like prose), starting with a space. */
function padFor(text: string): string {
  const need = Math.ceil(visibleLength(text) * PSEUDO_GROWTH)
  if (need <= 0) return ''
  const words = text.replace(PLACEHOLDER, ' ').split(/\s+/).filter((w) => /\p{L}/u.test(w))
  const pool = words.length > 0 ? words : ['xx']
  let pad = ''
  for (let i = 0; pad.length < need; i++) pad += ` ${pool[i % pool.length]}`
  return pad
}

/** The `xx` value for one catalog key. Placeholders and escapes pass through untouched, so it formats. */
export function pseudoLocalize(key: string): string {
  const text = splitContext(key).text
  return `${PSEUDO_OPEN}${text}${padFor(text)}${PSEUDO_CLOSE}`
}

export function buildPseudoCatalog(catalog: Catalog): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(catalog.keys)) out[key] = pseudoLocalize(key)
  return out
}

/** The same transform for text that has already been rendered (no placeholders left, no escapes to keep). */
export function expandText(rendered: string): string {
  const text = rendered.replace(/\s+/g, ' ').trim()
  return `${PSEUDO_OPEN}${text}${padFor(text)}${PSEUDO_CLOSE}`
}

export const isPseudo = (text: string): boolean => text.includes(PSEUDO_OPEN)
