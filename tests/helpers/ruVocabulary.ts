// THE ENGINE'S ENGLISH WORDS THAT HAVE A RUSSIAN READING – RU-22 (11.10), the carpet's ru arm.
//
// WHAT THE ARM ASKS. Every mounted surface of the xx carpet is mounted a fourth time under the REAL ru.json, and no text node or copy attribute of it may print – on its own, as a piece between
// the glue a composed row joins with – an English word the display boundary can read: a label of the economy (the shop, the kit grades, the vacation packages, the staff rungs, the radar's
// notes, the kid tiles' friend lines), or a word of one of the reader classes of `src/i18n/words.ts` (a stage, a finish, a surface, a tier's short name, a body part, a descriptor, an ordinal,
// a spelled number, a court row's clause …). A word that has no Russian reading yet is not in the vocabulary – the arm judges the boundary, not the translation (the catalog's own miss
// counter is that).
//
// ⚠ A NAME IS NEVER IN IT. `Local Open` is a tournament name and stays Latin (§9.5); `Local` – the tier's short word – is a vocabulary word, and the arm tells them apart by the piece: the whole piece
// «Local» (or «Local · …» cut at the glue) is the word, «Local Open» is a name. The brand marks of the kit (`Ashline Alloy`) are identity rows – their Russian equals their English – and are
// dropped from the vocabulary by that test, not by a list.
//
// ⚠ BUILT FROM THE COMMITTED CATALOG, NOT FROM THE CONSTANTS: the labels are the keys carrying the seat `engine.text` (`catalog.en.json` is held fresh by `npm run i18n:check`), and the class words
// come from the readers' own tables (`createWordReaders(...).vocabulary`), so a word added to a reader joins the arm by existing.
import { readFileSync } from 'node:fs'
import { translate, type RenderContext } from '../../src/shared/i18n'
import { createWordReaders } from '../../src/i18n/words'
import type { WordClass } from '../../src/i18n/wordHoles'
import { TIERS } from '../../src/engine/season/calendar'

type CatalogFile = { keys: Record<string, { seat?: string[] }> }

let cached: Map<string, string> | null = null

/** english -> its Russian reading, for every engine word the boundary can read and whose reading is not the English itself. */
export function engineVocabulary(): Map<string, string> {
  if (cached) return cached
  const ru = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
  const catalog = (JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as CatalogFile).keys
  const ctx: RenderContext = { locale: 'ru', lookup: (key) => ru[key] }
  const readers = createWordReaders((key, params) => translate(key, params, ctx))
  const out = new Map<string, string>()
  const add = (english: string, reading: string): void => {
    if (reading !== english && /[A-Za-z]/.test(english) && /\p{Script=Cyrillic}/u.test(reading)) out.set(english, reading)
  }
  for (const [key, entry] of Object.entries(catalog)) if (entry.seat?.includes('engine.text')) add(key, ru[key] ?? key)
  for (const [cls, words] of Object.entries(readers.vocabulary)) {
    for (const word of words) {
      add(word, readers.word(cls as WordClass, word))
      // a number or a tier is also drawn with a capital where it opens a line
      if (cls === 'count' || cls === 'countF') add(word.charAt(0).toUpperCase() + word.slice(1), readers.word(cls as WordClass, word.charAt(0).toUpperCase() + word.slice(1)))
    }
  }
  cached = out
  return out
}

/** The names that CONTAIN a vocabulary word and must never be read as that word: a tier's full label is a tournament's name (`Local Open`, `National Series`, `Grand Slam`) and stays Latin (§9.5). */
function nameLabels(): readonly string[] {
  const labels = [...(NAME_LABELS_CACHE ??= tierLabels())]
  return labels
}
let NAME_LABELS_CACHE: string[] | null = null
function tierLabels(): string[] {
  // read off the engine's own table, longest first so «World Tour 1000» is masked before «World Tour 100»
  return Object.values(TIERS)
    .map((tier) => tier.label)
    .sort((a, b) => b.length - a.length)
}

const MASK = '\u0000'
/** A run of Latin words (the glue between two Russian pieces is not Latin, so a dash or a bracket ends a run). */
const LATIN_RUN = /[A-Za-z0-9][A-Za-z0-9'’.&-]*(?: +[A-Za-z0-9][A-Za-z0-9'’.&-]*)*/g
/** A run longer than this is a sentence of untranslated prose, not an engine word dropped into a Russian line – a different defect, with its own nets. */
const MAX_RUN_WORDS = 4

/** A token that is not a word of anyone's vocabulary: a tier code (`W15`, `WT250`, `J30`), a figure, a sum. They may stand beside an engine word in one Latin run («W15 semi-final») without making the run prose. */
const CODE_OR_FIGURE = /^(?:[A-Z]{1,3}\d+|\d[\d.,%]*|[$€£]\S*)$/

/** The English vocabulary words a rendered piece of text prints raw: a Latin run that IS a word, a run that is a word beside tier codes and figures («W15 semi-final»), or a long label contained as written.
 *  Tier labels are masked first – a tournament's name is data. A run of other words around a vocabulary word (`Singles final`, `caption seven`) is untranslated PROSE, not an engine word dropped into a Russian
 *  line: that is a different defect with its own nets (the catalog's miss counter, the carpet's leak ledger), and an ordinary English word like `final` or `one` is not an engine word because it sits in it. */
export function rawWordsIn(text: string, vocabulary: ReadonlyMap<string, string>): string[] {
  const found = new Set<string>()
  let flat = text.replace(/\s+/g, ' ').trim()
  for (const word of vocabulary.keys()) if (word.length >= 14 && flat.includes(word)) found.add(word)
  for (const name of nameLabels()) flat = flat.split(name).join(MASK)
  for (const m of flat.matchAll(LATIN_RUN)) {
    if (!/[A-Za-z]/.test(m[0])) continue
    const tokens = m[0].split(' ')
    if (tokens.length > MAX_RUN_WORDS) continue
    const whole = m[0].replace(/[.,]+$/, '')
    if (vocabulary.has(whole)) {
      found.add(whole)
      continue
    }
    // a word (or a multi-word entry) with nothing but codes and figures around it
    for (let len = tokens.length - 1; len >= 1; len--) {
      for (let at = 0; at + len <= tokens.length; at++) {
        const candidate = tokens.slice(at, at + len).join(' ').replace(/[.,]+$/, '')
        const around = [...tokens.slice(0, at), ...tokens.slice(at + len)]
        if (vocabulary.has(candidate) && around.every((t) => CODE_OR_FIGURE.test(t))) found.add(candidate)
      }
    }
  }
  return [...found].sort()
}
