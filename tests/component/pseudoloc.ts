// THE `xx` HARNESS FOR MOUNTED TESTS – wave L1b, spec §6. A language the app can be switched to, and the two
// sweeps that need nothing but a mounted tree: overflow under +30% text, and hardcode leaks.
//
//   await installPseudoLocale()      `xx` becomes a catalog (every catalog.en.json key bracketed and padded)
//                                    and the active locale, through L1a's registerCatalogLoader / setLocale
//   expandRendered(root)             pad the text that is ALREADY on screen and did not come through t()
//   hardcodeLeaks(root)              the text under `root` that carries no bracket – an unwrapped literal
//
// ⚠ WHY TWO PATHS TO THE SAME TRANSFORM. A wrapped string asks the catalog and comes back bracketed. An
// unwrapped one (nearly all of today's copy) never asks, so under `xx` it stays plain English – that is
// exactly what `hardcodeLeaks` reports – and for the OVERFLOW measure `expandRendered` pads it in the DOM so the
// layout is judged against +30% on every surface today, not only on the handful already wrapped. The full
// per-batch sweeps belong to the L2-n landings; this is the mechanism and its proof.
//
// ⚠ NOTHING HERE WRITES RUSSIAN. The catalog `xx` is built from the English keys alone.
import { readFileSync } from 'node:fs'
import { registerCatalogLoader, setLocale } from '../../src/i18n'
import type { Locale } from '../../src/i18n'
import { buildPseudoCatalog, expandText, isPseudo, PSEUDO_LOCALE } from '../../tools/i18n-pseudoloc'
import type { Catalog } from '../../tools/i18n-extract'

let cached: Record<string, string> | null = null
export function pseudoCatalog(): Record<string, string> {
  cached ??= buildPseudoCatalog(JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as Catalog)
  return cached
}

/** Register `xx` with the catalog loader and switch the app to it. `Locale` is the shipped union (en | ru), so
 *  the cast is the one place a test says «this is a language the type does not know» – deliberately. */
export async function installPseudoLocale(): Promise<void> {
  registerCatalogLoader(PSEUDO_LOCALE, () => Promise.resolve(pseudoCatalog()))
  await setLocale(PSEUDO_LOCALE as Locale)
}

/** What the spec's §6 allowlist names: numbers, the product mark, tier codes. Names are passed per screen. */
export const DEFAULT_ALLOW: readonly RegExp[] = [
  /^[\d\s.,:;%$€£+−–\-/·#×()'’]+$/u,
  /^(?:Ties Break|Ace Parent)$/,
  /^(?:ITF|WTA|ATP)(?: [A-Z]?\d+k?)?$/,
  /^[WMT]\d+$/,
  // ⚠ 10.10 – the Russian AUTONYM (owner: «English / Русский»): a language names itself on the
  // first-run prompt, raw by DESIGN – a `t()` here would be wrong, the prompt shows before any
  // choice exists. The one lawful Cyrillic literal on an English screen.
  /^Русский$/,
]

const COPY_ATTRS = ['title', 'aria-label', 'placeholder', 'alt']
const hasLetters = (s: string): boolean => /\p{L}/u.test(s)

interface Piece {
  text: string
  set: (next: string) => void
}

/** Every player-visible piece of text under `root`: text nodes (not script/style) and the four copy attributes. */
function pieces(root: Element): Piece[] {
  const out: Piece[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text
    if (node.parentElement && /^(?:SCRIPT|STYLE)$/.test(node.parentElement.tagName)) continue
    out.push({ text: node.nodeValue ?? '', set: (next) => void (node.nodeValue = next) })
  }
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const attr of COPY_ATTRS) {
      const value = el.getAttribute(attr)
      if (value) out.push({ text: value, set: (next) => el.setAttribute(attr, next) })
    }
  }
  return out
}

/** Pad every unwrapped piece of copy under `root` to the pseudo form; returns how many it reached. */
export function expandRendered(root: Element, allow: readonly RegExp[] = DEFAULT_ALLOW): number {
  let reached = 0
  for (const p of pieces(root)) {
    const text = p.text.trim()
    if (!hasLetters(text) || isPseudo(text) || allow.some((re) => re.test(text))) continue
    p.set(expandText(text))
    reached++
  }
  return reached
}

/** The text under `root` that is neither bracketed nor allowlisted: copy that did not come through `t()`. */
export function hardcodeLeaks(root: Element, allow: readonly RegExp[] = DEFAULT_ALLOW): string[] {
  const leaks: string[] = []
  for (const p of pieces(root)) {
    const text = p.text.replace(/\s+/g, ' ').trim()
    if (!hasLetters(text) || isPseudo(text) || allow.some((re) => re.test(text))) continue
    leaks.push(text)
  }
  return leaks
}
