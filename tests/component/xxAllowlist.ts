// THE SHARED `xx` ALLOWLIST – wave L4-2 (spec §6, «numbers, names, the product mark»). ONE module, read by the
// carpet (`xxCarpet.ts`) and by anything after it, seeded from what the eleven L2 arms and the L3 nets each wrote
// for themselves. Three kinds of entry, and the difference between them is the whole point:
//
//   SHAPES   a regular expression, and ONLY for something that is not a word: a week label, a date, a money figure,
//            a rank, a bare number, a tier code, the product mark. A shape never matches a name or a heading.
//   WORDS    an exact string the ENGINE writes and a screen prints raw – the surface ids `hard clay grass carpet`.
//   LEAVES   everything the snapshot (or an engine table) CARRIES, taken as exact string values – never a pattern.
//
// ⚠ NO NAME-SHAPED PATTERNS (L2-5 finding 2, applied to L2-4 at L2-6 step 0). A «First Last» regex swallowed
// `Season Planner`, a «Word» regex any one-word heading, a tier-prefix regex everything beginning `Local` or `Pro` –
// a capitalised UNWRAPPED heading passed three arms in three shapes. A name is allowed because the snapshot carries it
// (a LEAF), never because it is capitalised. The L2 arms matched by SUBSTRING of the snapshot's JSON; this module is
// stricter on purpose – a leak is engine-born when it EQUALS a leaf, or when it is nothing but leaves and punctuation
// glue (` · `, ` – `, `, `). Frame copy with a name in it («Congratulations, Vera!») is neither, and is reported.
//
// ⚠ THE SIZE IS PRINTED, not argued: `allowlistSize()` is in the carpet's report, so a list that only ever grows shows.
import { formatShortName } from '../../src/shared/format'
import { TIERS, TIER_SHORT } from '../../src/engine/season/calendar'
import { COACH_TIER_LABEL } from '../../src/engine/coach'
import { RADAR_AXIS_LABEL } from '../../src/engine/radar'
import { COLLEGE_LEAGUE, leagueExitLabel } from '../../src/engine/collegeLeague'
import { COLLEGE_TIER_NAME } from '../../src/engine/collegeOffer'
import { ECONOMY } from '../../src/engine/economy'
import { NATIONAL_TEAM } from '../../src/engine/nationalTeam'
import { MASSEUR_LOCKED_DETAIL } from '../../src/engine/world/masseur'
import { PSYCHOLOGIST_LOCKED_DETAIL, PSY_FOCUS_LABEL, PSY_FOCUS_LINE } from '../../src/engine/world/psychologist'
import { SPARRING_LOCKED_DETAIL } from '../../src/engine/world/sparring'
import { LADDER_LABEL } from '../../src/shared/protocol'
import { DEFAULT_ALLOW } from './pseudoloc'

const MONTH = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'

/** Shapes, each with the arm that first needed it. DEFAULT_ALLOW (numbers/punctuation, the product mark, `ITF 25k`, `W14`) comes first. */
export const SHAPES: readonly RegExp[] = [
  ...DEFAULT_ALLOW,
  // week labels – `weekLabel` / `weekOnly` / `weekRange` (shared/dates.ts, RU-13D's formatters): L2-3, L2-4, L2-6, L2-7, L2-10, L2-11
  /^W\d+(?: \d{4}| ['’]\d{2})?$/,
  /^· W\d+$/,
  /^W\d+(?:-\d+)?(?: · .+)?$/,
  /^W\d+ ['’]\d{2} \((?:last week|\d+ weeks? left)\)$/,
  // dates – `monthLabel`, the week range, a locale date-time on a save row: L2-3, L2-4, L2-6b, L2-11
  new RegExp(`^${MONTH}[a-z]* \\d+(?: ?[–-] ?(?:[A-Za-z]+ )?\\d+)?(?:, \\d{4})?$`),
  new RegExp(`^${MONTH} ['’]\\d\\d$`),
  /^\d{2} [A-Z][a-z]{2},? \d{2}:\d{2}$/,
  // money and its compact form, the physio band, a price span: L2-3, L2-6, L2-10 (`formatCentsCompact`)
  /^[−+-]?\$[\d,.]+[KMB]?$/,
  /^\$\d+-\d+\/wk$/,
  /^\$[\d,.]+ – \$[\d,.]+$/,
  // ranks, counts, ranges, percentages, degrees, the dashes and glue a table prints: L2-4, L2-6, L2-7
  /^#\d+$/, /^\d+°?$/, /^\d+(?:\.\d+)?%$/, /^\d+(?:-\d+)+$/, /^\d+–\d+$/, /^\d{4}$/, /^[\d,.]+$/,
  /^[—–-]$/, /^\?$/, /^%$/, /^·$/, /^…$/, /^\+\d+$/, /^x\d+$/, /^\d+x'\d\d$/,
  // a version tag on a save row: L2-11
  /^v\d+$/,
  // the fee pill – `entryFeeLabel` (shared/money.ts): an English formatter with no catalog row, ruled once for Season and Calendar at L2-4
  /^(?:entry \$[\d,.]+|no entry fee)$/,
  // the court-surface chip the formatters print as a bare id is a WORD (below), not a shape
]

/** Exact words the ENGINE writes and a screen prints raw (court surfaces are ids, not copy). Compared case-insensitively. */
export const WORDS: readonly string[] = ['hard', 'clay', 'grass', 'carpet']

/** The engine tables screens read straight from – their values are engine words exactly as a snapshot's are. */
const TABLES: readonly unknown[] = [
  Object.values(TIERS).map((tier) => tier.label),
  TIER_SHORT,
  LADDER_LABEL,
  COACH_TIER_LABEL,
  RADAR_AXIS_LABEL,
  // the staff tab and the planner read their menus straight from the economy (L2-5, L2-6's corpus)
  ECONOMY.vacation,
  ECONOMY.masseur,
  ECONOMY.psychologist,
  ECONOMY.sparring,
  MASSEUR_LOCKED_DETAIL,
  PSYCHOLOGIST_LOCKED_DETAIL,
  SPARRING_LOCKED_DETAIL,
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
  // the college card and the fork name their places, the league's exit stage and the call-up's competition from the engine (L2-10)
  COLLEGE_TIER_NAME,
  COLLEGE_LEAGUE.label,
  NATIONAL_TEAM.label,
  [0, 1, 2, 3].map((roundsWon) => leagueExitLabel({ roundsWon, rounds: 3 } as Parameters<typeof leagueExitLabel>[0])),
]

/** Every string value anywhere under `value` – the leaves. Keys are not leaves: a field NAME is never on a screen. */
function collect(value: unknown, into: Set<string>): void {
  if (typeof value === 'string') {
    const s = value.replace(/\s+/g, ' ').trim()
    if (s) into.add(s)
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, into)
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collect(v, into)
  }
}

/** Pictographs, joiners, flags (regional indicators are NOT pictographic) and spaces: decoration at either end of a string, never part of its words. */
const GLYPHS = /^[\p{Extended_Pictographic}\p{Regional_Indicator}‍️\s]+|[\p{Extended_Pictographic}\p{Regional_Indicator}‍️\s]+$/gu
/** Glue characters a composed row leaves dangling at an end («Alice Martin ·», «– Orla»). */
const EDGE_GLUE = /^[\s·–—|,;:-]+|[\s·–—|,;:-]+$/g
const trimGlyphs = (s: string): string => s.replace(GLYPHS, '').replace(EDGE_GLUE, '').trim()
/** Where a composed row joins two things. A leaf may itself contain these («Quarterfinal – C. Ostergaard»), so the matcher below tries every cut. */
const GLUE_AT = /\s(?:[·|–—-])\s|,\s|\s·|·\s|[;:()/]\s?/g

export interface EngineWords {
  leaves: Set<string>
  /** how many leaves, for the report */
  size: number
}

/** The engine's words for ONE surface: the snapshot and any props the test hands the component, plus the tables, plus short forms of every full name. */
export function engineWords(sources: readonly unknown[], extra: readonly string[] = []): EngineWords {
  const raw = new Set<string>()
  for (const s of sources) collect(s, raw)
  for (const t of TABLES) collect(t, raw)
  for (const e of extra) raw.add(e.replace(/\s+/g, ' ').trim())
  // `formatShortName` shapes a full name the snapshot carries («P. Mansouri»): derived, so it is an engine word too
  for (const leaf of Array.from(raw)) {
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(leaf)) raw.add(formatShortName(leaf))
  }
  // a leaf is also known without its decoration: the feed prints «<glyph> text», the snapshot holds «text» – or the other way round
  const leaves = new Set<string>(raw)
  for (const leaf of raw) leaves.add(trimGlyphs(leaf))
  // and a «label – note» leaf is drawn as TWO boxes by a template (the coach row: the label, then «– the note»), so each side of a dash/dot cut is
  // a leaf too. Dashes and dots only – a comma cut would absolve «Congratulations» out of «Congratulations, Vera!»
  for (const leaf of raw) {
    for (const m of leaf.matchAll(/\s[–—·-]\s/g)) {
      const at = m.index ?? 0
      for (const side of [leaf.slice(0, at), leaf.slice(at + m[0].length)]) if (trimGlyphs(side).length > 2) leaves.add(trimGlyphs(side))
    }
  }
  return { leaves, size: leaves.size }
}

const isShape = (text: string): boolean => SHAPES.some((re) => re.test(text))
const isWord = (text: string): boolean => WORDS.includes(text.toLowerCase())

/** `text` is covered when it is one engine word / shape, or it can be cut at the glue into two covered halves (every cut tried: a leaf may contain glue). */
function covered(words: EngineWords, text: string, memo: Map<string, boolean>): boolean {
  const t = trimGlyphs(text)
  if (t === '') return true
  const hit = memo.get(t)
  if (hit !== undefined) return hit
  let ok = words.leaves.has(t) || isShape(t) || isWord(t)
  if (!ok) {
    for (const m of t.matchAll(GLUE_AT)) {
      const at = m.index ?? 0
      if (at === 0) continue
      if (covered(words, t.slice(0, at), memo) && covered(words, t.slice(at + m[0].length), memo)) {
        ok = true
        break
      }
    }
  }
  memo.set(t, ok)
  return ok
}

/** True when `text` carries nothing the screen wrote: it IS an engine word, or only engine words, shapes and glue. */
export function isEngineBorn(words: EngineWords, text: string): boolean {
  const whole = trimGlyphs(text.replace(/\s+/g, ' '))
  if (whole.length < 2) return false // a single letter is «in» every snapshot and proves nothing
  return covered(words, whole, new Map())
}

/** What the list holds, for the report: shapes, exact words, and the engine tables' leaves. */
export function allowlistSize(): { shapes: number; words: number; tableLeaves: number } {
  const t = new Set<string>()
  collect(TABLES, t)
  return { shapes: SHAPES.length, words: WORDS.length, tableLeaves: t.size }
}
