// ⭐ r49 №2 phase 2 (12.10) – THE FORMAT REGISTRY'S ONE READER. `src/i18n/formats.ru.json` is compiled
// from his table rows by `tools/i18n-formats.ts` (spec docs/specs/i18n-2026-10.md:198: «the round that
// wires RU-13D's display shells reads the table» – this is that round), and this module is the only
// place in `src` that imports it: the week-only labels, which carry no words of their own – every
// Russian word in a pattern is HIS cell's, compiled, never typed here.
//
// ⚠ WHY A LEAF AND NOT `./dates` ITSELF. The display twin (`./dates`) imports `t` from `./index`,
// and `./index` builds the word readers from `./words` – so a value import of `./dates` from
// `./words` (the `week` hole class needs `localizedWeekLabel`) would close the cycle
// words → dates → index → words, which `tests/import-cycles.test.ts` refuses. This module imports
// only leaves (`./locale`, `../shared/i18n`, `../shared/dates`, the registry file), so both
// `./dates` (which re-exports everything here – callers keep ONE display-module home) and `./words`
// can read it. `tests/i18n-l3-t-tooling.test.ts` §5 pins the single-reader fact.
//
// ⚠ UNDER THE `xx` PROBE the registry has no table of its own and these fill the ru patterns: the
// output is the pattern's shape («Нед. 14 · ’31»), which is how the carpet tells a label that went
// through the registry from a hardcoded one – the week shapes in `tests/component/xxAllowlist.ts`
// are the registry's forms since this wave, and an English `W14 '31` under a non-English locale is
// a leak again.
import { locale } from './locale'
import { formatMessage } from '../shared/i18n'
import patterns from './formats.ru.json'
import {
  WEEKS_IN_SEASON,
  seasonYear,
  seasonWeekRange as seasonWeekRangeEn,
  weekLabel as weekLabelEn,
  weekYearLabel as weekYearLabelEn,
} from '../shared/dates'

/** One registry pattern, filled. The pattern is gated (`lintFormats`: parity, ICU, freshness), so a
 *  throw cannot be reached off a committed file – the catch keeps a hand-broken dev copy from taking
 *  a screen down, the same manner `translateAt` falls back to English on an invalid row. */
function fill(id: keyof typeof patterns, params: Record<string, string | number>, en: string): string {
  try {
    return formatMessage(patterns[id], params, { locale: locale.value })
  } catch {
    return en
  }
}

/** The two facts every week label is built from – `weekParts`'s own arithmetic (total modulo +
 *  `seasonYear`), restated because the shared pair is private; the `en` delegations in the exports
 *  are what keep the two honest (`tests/component/i18n-r49-2-dates-display.test.ts`). */
function weekParts(week: number, startYear?: number): { inSeason: number; year: number } {
  const w = Math.floor(week)
  const inSeason = ((w % WEEKS_IN_SEASON) + WEEKS_IN_SEASON) % WEEKS_IN_SEASON + 1
  return { inSeason, year: seasonYear(Math.floor(w / WEEKS_IN_SEASON), startYear) }
}

const pad2 = (year: number): string => String(((year % 100) + 100) % 100).padStart(2, '0')

/** "W14 '31" / «Нед. 14 · ’31» – the compact week label (`dates.weekLabel`, APPROVED 07.10). */
export function weekLabel(week: number, startYear?: number): string {
  if (locale.value === 'en') return weekLabelEn(week, startYear)
  const p = weekParts(week, startYear)
  return fill('dates.weekLabel', { week: p.inSeason, yy: pad2(p.year) }, weekLabelEn(week, startYear))
}

/** "W27 2033" / «Неделя 27 · 2033» – the full-year header form (`dates.weekYearLabel`). */
export function weekYearLabel(week: number, startYear?: number): string {
  if (locale.value === 'en') return weekYearLabelEn(week, startYear)
  const p = weekParts(week, startYear)
  return fill('dates.weekYearLabel', { week: p.inSeason, year: p.year }, weekYearLabelEn(week, startYear))
}

/** "W1-10" / «Нед. 1–10» – season-relative offsets, never absolute weeks (`dates.seasonWeekRange`). */
export function seasonWeekRange(fromOffset: number, toOffset: number): string {
  if (locale.value === 'en') return seasonWeekRangeEn(fromOffset, toOffset)
  return fill('dates.seasonWeekRange', { a: fromOffset + 1, b: toOffset + 1 }, seasonWeekRangeEn(fromOffset, toOffset))
}

/** The ONLY two shapes the engine bakes a week label in – `weekLabel`'s and `weekYearLabel`'s
 *  English. Anchored, so a sentence that merely contains one never matches (`localizedDateSpanLabel`'s
 *  manner, src/i18n/dates.ts). */
const SHORT_LABEL = /^W(\d+) '(\d{2})$/
const LONG_LABEL = /^W(\d+) (\d{4})$/

/** ⭐ AN ENGINE-EMITTED «W14 '31» / «W27 2033», re-spelled at display. The engine keeps writing
 *  English (the law – `shared/dates.ts` cannot reach a locale), so a label that travels as a STRING
 *  – the diary memory's `whenLabel`, a `t()` hole of a stored ref (`src/i18n/wordHoles.ts`, class
 *  `week`) – is parsed from its one rigid shape and re-rendered through the registry pattern. An
 *  unparseable label (a bare «W8», «one year ago», an already-Russian form) passes through
 *  UNCHANGED – never throw, never miss-count: a label the registry cannot re-spell is still a label. */
export function localizedWeekLabel(label: string): string {
  if (locale.value === 'en') return label
  const short = SHORT_LABEL.exec(label)
  if (short) return fill('dates.weekLabel', { week: Number(short[1]), yy: short[2]! }, label)
  const long = LONG_LABEL.exec(label)
  if (long) return fill('dates.weekYearLabel', { week: Number(long[1]), year: Number(long[2]) }, label)
  return label
}
