// ⭐ r49 №2 (12.10) – THE DISPLAY TWIN OF `shared/dates.ts`: the five month-bearing date formatters,
// spelled in the player's language. The owner's round-49 item 2: «Даты остались на английском,
// возможно не только в альбоме».
//
// THE SEAM. `shared/dates.ts` is engine-importable and CANNOT call `t()` (CLAUDE.md invariant 1;
// the l2-11 purity case pins it) – so the engine keeps writing English, and the screen re-spells the
// date at the moment of showing, the same boundary `words.ts` and `albumText.ts` draw. Every function
// here exports the SAME name with the SAME signature as its shared twin:
//
//   · under `en` it DELEGATES, byte for byte – invariant 4 holds by construction;
//   · under any other locale it builds the RU-13D forms (docs/localization/ru-formatters-countries-2026-10.md)
//     from `weekSpanParts` – the week's days as NUMBERS, never a parsed string – with every Russian
//     word read through the CATALOG: the genitive month rides the RU21-FMT `Month {day}` keys, the
//     axis abbreviation its own `mon|…` key, so the translator sees and edits every word and none is
//     typed here (words.ts's law). Under the `xx` probe the same calls return bracketed pseudo, which
//     is how the carpet proves a date went through the catalog.
//
// ⭐ r49 №2 PHASE 2 (12.10) – the WEEK-ONLY labels joined: `weekLabel`, `weekYearLabel` and
// `seasonWeekRange` ride the FORMAT REGISTRY (`./formats`, the one reader of `formats.ru.json` –
// his cells compiled to patterns, spec :198's wiring round), re-exported here so callers keep one
// display-module home; `weeksLeftBracket` cannot be a pattern (Russian pluralises both the noun and
// the verb) and goes the phase-1 way, catalog `t()`-keys. `localizedWeekLabel` (also `./formats`)
// is the week twin of `localizedDateSpanLabel` below, for labels the engine baked into strings.
// ⚠ NO IMPORT CYCLE: `./index` does not import this module; callers import both, which is fine.
// `./words` reads `localizedWeekLabel` from the LEAF (`./formats`), never from here – this module
// imports `./index`, and words → dates → index → words would be the cycle the leaf exists to avoid.
import { locale } from './locale'
import { t } from './index'
import { weekYearLabel } from './formats'
import {
  birthDateLabel as birthDateLabelEn,
  daysInBirthMonth,
  monthLabel as monthLabelEn,
  weekDateLine as weekDateLineEn,
  weekRange as weekRangeEn,
  weekSpan as weekSpanEn,
  weekSpanParts,
  weeksLeftBracket as weeksLeftBracketEn,
} from '../shared/dates'

export { localizedWeekLabel, seasonWeekRange, weekLabel, weekYearLabel } from './formats'

/** The twelve `Month {day}` keys (RU21-FMT-01..24 compiled «{day} января» …) as LITERAL `t()` calls,
 *  one per entry – words.ts's law: the extractor recognises a call by the literal, so every entry is
 *  a key the translator sees; a `t(dynamic)` would be invisible to the catalog. `day` may be one day
 *  («3») or a collapsed range («3–9»), which is why the hole is a string. */
const MONTH_DAY: readonly ((day: number | string) => string)[] = [
  (day) => t('January {day}', { day }),
  (day) => t('February {day}', { day }),
  (day) => t('March {day}', { day }),
  (day) => t('April {day}', { day }),
  (day) => t('May {day}', { day }),
  (day) => t('June {day}', { day }),
  (day) => t('July {day}', { day }),
  (day) => t('August {day}', { day }),
  (day) => t('September {day}', { day }),
  (day) => t('October {day}', { day }),
  (day) => t('November {day}', { day }),
  (day) => t('December {day}', { day }),
]

/** The twelve axis abbreviations («янв.» … «дек.», his RU-13D list :41-46), tagged `mon|` so the
 *  three-letter English token stays a key spelling and never a word of any reader class. */
const MONTH_TAG: readonly (() => string)[] = [
  () => t('mon|Jan'),
  () => t('mon|Feb'),
  () => t('mon|Mar'),
  () => t('mon|Apr'),
  () => t('mon|May'),
  () => t('mon|Jun'),
  () => t('mon|Jul'),
  () => t('mon|Aug'),
  () => t('mon|Sep'),
  () => t('mon|Oct'),
  () => t('mon|Nov'),
  () => t('mon|Dec'),
]

/** «{day} июня» – day(s) + month in the genitive, through the catalog. `month` is 0-11. */
function dayMonth(month: number, day: number | string): string {
  return MONTH_DAY[month]!(day)
}

/** "12 June" / «12 июня» – her birth date. Same clamping as the shared twin, so the two can never
 *  name different dates for the same stored pair. */
export function birthDateLabel(birthMonth: number, birthDay: number): string {
  if (locale.value === 'en') return birthDateLabelEn(birthMonth, birthDay)
  const m = Math.max(1, Math.min(12, Math.round(birthMonth)))
  const d = Math.max(1, Math.min(daysInBirthMonth(m), Math.round(birthDay)))
  return dayMonth(m - 1, d)
}

/** "Jan '31" / «янв. ’31» – the chart axis. The abbreviation is his RU-13D row verbatim; the year is
 *  the week's Monday's calendar year, two digits, behind the typographic ’ his row spells. */
export function monthLabel(week: number, startYear?: number): string {
  if (locale.value === 'en') return monthLabelEn(week, startYear)
  const p = weekSpanParts(week, startYear)
  return `${MONTH_TAG[p.startMonth]!()} ’${String(((p.startYear % 100) + 100) % 100).padStart(2, '0')}`
}

/** "Jun 3 – Jun 9" / «3–9 июня» – the week's span, no year. Russian COLLAPSES a same-month week
 *  (RU-13D: the English never does – the fixed-width header row is an English-layout reason); across
 *  months both get their genitive: «27 января – 2 февраля». */
export function weekSpan(week: number, startYear?: number): string {
  if (locale.value === 'en') return weekSpanEn(week, startYear)
  const p = weekSpanParts(week, startYear)
  if (p.startMonth === p.endMonth && p.startYear === p.endYear) return dayMonth(p.startMonth, `${p.startDay}–${p.endDay}`)
  return `${dayMonth(p.startMonth, p.startDay)} – ${dayMonth(p.endMonth, p.endDay)}`
}

/** "W27 2033 · Jun 3 – Jun 9" / «Неделя 27 · 2033 · 3–9 июня» – the Home/Calendar header line. The
 *  week half IS `weekYearLabel` (the registry's `dates.weekYearLabel` – phase 2 retired the catalog
 *  key `W{week} {year}` that stood in for it: one home per fact), joined to the span exactly as the
 *  shared line joins its own halves. */
export function weekDateLine(week: number, startYear?: number): string {
  if (locale.value === 'en') return weekDateLineEn(week, startYear)
  return `${weekYearLabel(week, startYear)} · ${weekSpan(week, startYear)}`
}

/** "Jan 6–12, 2031" / «6–12 января 2031 года» – the self-contained range. The year tail is one key
 *  (`{span}, {year}` – exactly how the English composes), so «года» is the translator's word; a
 *  cross-year span carries its first year bare inside the span, as the RU-13D row spells:
 *  «29 декабря 2031 – 4 января 2032 года». */
export function weekRange(week: number, startYear?: number): string {
  if (locale.value === 'en') return weekRangeEn(week, startYear)
  const p = weekSpanParts(week, startYear)
  const span =
    p.startYear !== p.endYear
      ? `${dayMonth(p.startMonth, p.startDay)} ${p.startYear} – ${dayMonth(p.endMonth, p.endDay)}`
      : p.startMonth !== p.endMonth
        ? `${dayMonth(p.startMonth, p.startDay)} – ${dayMonth(p.endMonth, p.endDay)}`
        : dayMonth(p.startMonth, `${p.startDay}–${p.endDay}`)
  return t('{span}, {year}', { span, year: p.endYear })
}

/** "(14 weeks left)" / «(осталось 14 недель)» – the remaining-term bracket (round 41 #14). NOT a
 *  registry pattern on purpose: the Russian pluralises the noun AND the verb («осталась 1 неделя» /
 *  «осталось 14 недель», his rows), which a one-sample pattern cannot carry – so the three branches
 *  the shared twin builds are three catalog keys, ICU plural on the counted one, every word the
 *  translator's (phase 1's way). The `left <= 0` boundary and the `=== 1` split are the SHARED
 *  twin's own branches, restated so each English byte stays a literal key the extractor sees. */
export function weeksLeftBracket(untilWeek: number, atWeek: number): string {
  if (locale.value === 'en') return weeksLeftBracketEn(untilWeek, atWeek)
  const left = untilWeek - atWeek
  if (left <= 0) return t('(last week)')
  return left === 1 ? t('(1 week left)') : t('({weeks} weeks left)', { weeks: left })
}

/** The ONE shape the engine bakes into an album `dateLabel` – `weekSpan`'s English, which always
 *  names both months (`albumBook.ts`). Anchored, so a sentence that merely contains a date never
 *  matches. */
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const SPAN_LABEL = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}) – (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})$/

/** ⭐ r49 №2 – AN ENGINE-EMITTED «Jun 3 – Jun 9», re-spelled at display (`albumText.ts`). The album's
 *  `dateLabel` is baked into the snapshot by `albumBook.ts`, so the string itself travels; this parses
 *  the ONE rigid shape the engine writes and re-renders it through the month keys. An unparseable
 *  label (an older save, a shape this function was never told about) passes through UNCHANGED – never
 *  throw, never miss-count: a date the catalog cannot re-spell is still a date. */
export function localizedDateSpanLabel(label: string): string {
  if (locale.value === 'en') return label
  const m = SPAN_LABEL.exec(label)
  if (!m) return label
  const sm = MON3.indexOf(m[1] as (typeof MON3)[number])
  const em = MON3.indexOf(m[3] as (typeof MON3)[number])
  if (sm === em) return dayMonth(sm, `${m[2]}–${m[4]}`)
  return `${dayMonth(sm, m[2])} – ${dayMonth(em, m[4])}`
}
