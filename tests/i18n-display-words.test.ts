// RU-22 (11.10) – THE DISPLAY BOUNDARY LOCALISES THE ENGINE-BORN WORDS. docs/localization/ru-display-words-2026-10.md, src/i18n/words.ts, src/i18n/wordHoles.ts.
//
// WHAT THIS FILE HOLDS. RU-21 listed the places where a Russian sentence receives an ENGLISH WORD from the code (a body part, the ladder's name, a finish, the set's ordinal, an age spelled out, the
// economy's own labels). The engine cannot be taught Russian (invariant 1; the words are stored in refs, which the digests and the twins hold byte for byte), so each word is read at the moment of showing:
// the formatter asks `RenderContext.words` once per Russian row, and `words.ts` reads the holes the table names. This file is the net under that boundary, in the order the claim is made:
//
//   §1 the hole table is a claim about the code, held against the catalog in both directions
//   §2 every word the engine can hand a hole has a reader, and every reader answers in Russian (the real ru.json)
//   §3 the messages the SCREENS format, with the params the screens pass: Russian, no engine word left, no row that falls back to English
//   §4 ENGLISH CANNOT REACH THE BOUNDARY – the hook is never asked under `en`, and the helpers return their input there
//   §5 played careers: every ref a career stores, rendered under the production context
//   §6 MUTATION ARMS – the hook off, the table cut, a catalog row deleted: each turns the same checks red
//   §7 the document's own claims (the rows, the counts) are pinned against the tree
//
// ⚠ NO CYRILLIC IS TYPED HERE (invariant 4, the booth wave's rule): every expectation is READ from ru.json by key or asks `\p{Script=Cyrillic}`; mutation arms use ASCII stand-ins.
// ⚠ A «LEAK» IS NOT «A LATIN LETTER»: a rival's surname, a tournament's name, a kit mark and a tier code are Latin by ruling (§9.5) and travel through holes no reader reads. A leak here is an ENGLISH WORD OF THE
// ENGINE'S VOCABULARY surviving in a Russian line (`tests/helpers/ruVocabulary.ts`) – the stage, the finish, the body part, the ordinal, the label – which is exactly what the boundary exists to prevent.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { formatMessage, pluralCategory, translate, type MessageParams, type MissReason, type RenderContext } from '../src/shared/i18n'
import { createWordReaders, type WordTables } from '../src/i18n/words'
import { HOLE_TABLE, NAMED_HOLES, type HoleRow, type WordClass } from '../src/i18n/wordHoles'
import { engineVocabulary, rawWordsIn } from './helpers/ruVocabulary'
import { engineText, engineWord, installCatalog, resetI18nForTests, setLocale, t } from '../src/i18n'
import { BODY_REGIONS } from '../src/engine/body'
import { SEVERITY_DESCRIPTOR } from '../src/engine/world/injury'
import { LADDER_LABEL, LADDER_POINTS_LABEL } from '../src/shared/protocol'
import { TIER_SHORT } from '../src/engine/season/calendar'
import { finishLabel, stageLabel } from '../src/engine/world/labels'
import { COLLEGE_LEAGUE } from '../src/engine/collegeLeague'
import { NATIONAL_TEAM } from '../src/engine/nationalTeam'
import { COACH_TIER_LABEL } from '../src/engine/coach'
import { ageInWords } from '../src/engine/world/age'
import { finishPhrase, gapInResultsNote } from '../src/composables/tierState'
import { entryFeeText } from '../src/composables/entryFee'
import { playBench, playCollege, vizEvents, vizMatches } from './helpers/l3-7-play'
import { buildCommentary } from '../src/viz/commentary'
import { toSnapshot } from '../src/engine/world'
import { collegeNote, schoolCutOffNote, type KidLifeWorldView } from '../src/engine/kidLife'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { seasonYear } from '../src/shared/dates'
import { kidAgeExact } from '../src/engine/world'
import type { CollegeTier } from '../src/shared/protocol'
import { isCopyRef, type CopyRef } from '../src/shared/i18n'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = (JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { wrapped?: true; ph?: string[][]; seat?: string[]; home?: string[] }> }).keys
const CYR = /\p{Script=Cyrillic}/u
const VOCAB = engineVocabulary()
/** §3c – the booth messages the commentary grid of tests/helpers/l3-7-play does not build (measured; each is covered by §3's cases) */
const NOT_REACHED_BY_THE_GRID: string[] = ['{0} shots, and {1} ends it {2}.']

interface Rig {
  ctx: RenderContext
  missing: Set<string>
  invalid: Set<string>
  /** how many times the hook was asked, and how many of those changed a param */
  hook: { asked: number; changed: number }
}
/** A Russian render context like the app's (`src/i18n/index.ts`): the catalog, a miss recorder, and the word hook – which can be switched off or handed a mutated table. */
function rig(opts: { catalog?: Readonly<Record<string, string>>; hook?: boolean; tables?: WordTables } = {}): Rig {
  const catalog = opts.catalog ?? RU
  const missing = new Set<string>()
  const invalid = new Set<string>()
  const onMiss = (key: string, why: MissReason): void => void (why === 'missing' ? missing : invalid).add(key)
  const plain: RenderContext = { locale: 'ru', lookup: (k) => catalog[k], onMiss }
  const readers = createWordReaders((key, params) => translate(key, params, plain), opts.tables)
  const hook = { asked: 0, changed: 0 }
  const words: RenderContext['words'] = (key, params) => {
    hook.asked++
    const next = readers.holes(key, params)
    if (next !== params) hook.changed++
    return next
  }
  return { ctx: { ...plain, words: opts.hook === false ? undefined : words }, missing, invalid, hook }
}

const holesOf = (key: string): number[] => [...new Set([...key.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])))].sort((a, b) => a - b)
const namesOf = (key: string): string[] => [...new Set([...key.matchAll(/\{([A-Za-z_]\w*)\}/g)].map((m) => m[1] as string))]

// ===============================================================================================================================================================================================
// §1 the table, held against the catalog
// ===============================================================================================================================================================================================
describe('§1 the hole table is a claim about the code, and the catalog holds it', () => {
  const rows: Array<{ cls: WordClass; row: HoleRow }> = (Object.keys(HOLE_TABLE) as WordClass[]).flatMap((cls) => HOLE_TABLE[cls].map((row) => ({ cls, row })))

  it('every message of the table is a catalog key with Russian, and every hole it names exists in that message', () => {
    const problems: string[] = []
    for (const { cls, row } of rows) {
      const [key, ...holes] = row
      if (CATALOG[key] === undefined) problems.push(`${cls}: «${key.slice(0, 70)}» is not a catalog key`)
      else if (RU[key] === undefined) problems.push(`${cls}: «${key.slice(0, 70)}» has no Russian`)
      const have = holesOf(key)
      for (const h of holes) if (!have.includes(h)) problems.push(`${cls}: «${key.slice(0, 70)}» has no hole {${h}}`)
    }
    for (const [key, hole, cls] of NAMED_HOLES) {
      if (CATALOG[key] === undefined) problems.push(`${cls}: «${key.slice(0, 70)}» is not a catalog key`)
      else if (RU[key] === undefined) problems.push(`${cls}: «${key.slice(0, 70)}» has no Russian`)
      if (!namesOf(key).includes(hole)) problems.push(`${cls}: «${key.slice(0, 70)}» has no hole {${hole}}`)
    }
    expect(problems).toEqual([])
  })

  it('no hole is claimed by two classes, and no row is listed twice', () => {
    const seen = new Map<string, WordClass>()
    const twice: string[] = []
    for (const { cls, row } of rows) {
      const [key, ...holes] = row
      for (const h of holes) {
        const id = `${key}#${h}`
        const was = seen.get(id)
        if (was !== undefined) twice.push(`${id.slice(0, 80)} is claimed by ${was} and ${cls}`)
        seen.set(id, cls)
      }
    }
    for (const [key, hole, cls] of NAMED_HOLES) {
      const id = `${key}#${hole}`
      const was = seen.get(id)
      if (was !== undefined) twice.push(`${id.slice(0, 80)} is claimed by ${was} and ${cls}`)
      seen.set(id, cls)
    }
    expect(twice).toEqual([])
  })

  it('the table is COMPLETE against the code: every `cp` template whose hole the census read as a word-class expression is in it (the dead legacy rows are exempt by name)', () => {
    // the census keeps, per hole, the source expressions seen there (catalog.en.json `ph`); these are the expressions that name one of the classes
    // [class, the expression, and – for an expression too short to mean anything alone – the one file it is read in]
    const RULES: Array<[WordClass, RegExp, string?]> = [
      ['round', /^(stage|event\.roundLabel|finishLabel\(.*\)|a\.finish|leagueExitLabel\(.*\)|kidFinish)$/],
      ['surface', /^(surface|event\.surface|a\.surface)$/],
      ['tier', /^short\(.*\)$/],
      ['part', /^(part|k\.part|knock\.part|injuredPart\(f\)|String\(f\.knockPart\)|f\.knockPart)$/],
      ['hurt', /^descriptor$/],
      ['kind', /^(f\.injured\?\.kind \?\? 'injury'|capitalise\(m\.kind \?\? 'an injury'\))$/],
      ['age', /^(capitalise\(ageWord\(.*\)\)|words)$/],
      ['ordinal', /^ordinal\(.*\)$/],
      ['league', /^(COLLEGE_LEAGUE\.label|NATIONAL_TEAM\.label)$/],
      ['eco', /^(item\.label|pkg\.label|ECONOMY\.equipment\.gradeCopy.*)$/],
      ['ecoLower', /^(chosen\.label\.toLowerCase\(\)|rung\.label\.toLowerCase\(\))$/],
      ['ladder', /LADDER_LABEL.*/],
      // RU-22 (booth): the commentary spells its counts in English (`numberWord(n)`, `Num(n)`), and the pooled lines receive them as the lambda's `n`
      ['count', /^(numberWord|Num)\(.*\)$/],
      ['count', /^n$/, 'src/viz/commentary.ts'],
      // ⭐ r49 №2 ф2 (12.10): an engine-baked week label – `weekLabel(...)` at the template, or the summary ref's `a.week` (`tournamentSummaryRef`)
      ['week', /^(weekLabel\(.*\)|a\.week)$/],
    ]
    // a hole claimed by the table under ANY class counts: the hint says «a word is here», the table says which kind
    const claimed = new Set(rows.flatMap(({ row }) => row.slice(1).map((h) => `${row[0]}#${h}`)))
    const missing: string[] = []
    for (const [key, entry] of Object.entries(CATALOG)) {
      if (!entry.ph || RU[key] === undefined || !entry.wrapped) continue
      entry.ph.forEach((exprs, hole) => {
        for (const x of exprs) for (const [cls, re, home] of RULES) if (re.test(x) && (home === undefined || entry.home?.includes(home)) && !claimed.has(`${key}#${hole}`)) missing.push(`${cls}: «${key.slice(0, 70)}» hole {${hole}} (${x})`)
      })
    }
    expect([...new Set(missing)], 'a message whose hole the census reads as an engine word is not in src/i18n/wordHoles.ts – add the row, or the Russian line prints an English word').toEqual([])
  })
})

// ===============================================================================================================================================================================================
// §2 the vocabulary: every word the engine can hand a hole is known to a reader, and every reader answers in Russian
// ===============================================================================================================================================================================================
describe('§2 the engine\'s vocabulary against the readers', () => {
  const plain: RenderContext = { locale: 'ru', lookup: (k) => RU[k] }
  const readers = createWordReaders((key, params) => translate(key, params, plain))
  const known = (cls: string): ReadonlySet<string> => new Set(readers.vocabulary[cls] ?? [])
  const src = (path: string): string => readFileSync(path, 'utf8')
  /** Every single-quoted word in a piece of source (no empty string in it – pairing would go out of step). */
  const quotedAll = (text: string): string[] => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1] as string).filter((w) => /[A-Za-z]/.test(w))
  /** The quoted words of the FIRST array literal in a line of source – split on the commas, so an empty string in it (`['', 'first']`) cannot put the quotes out of step. */
  const quoted = (text: string): string[] =>
    ((/=\s*\[(.*?)\]/.exec(text) ?? /\[(.*?)\]/.exec(text))?.[1] ?? '')
      .split(',')
      .map((x) => x.trim().replace(/^'|'$/g, ''))
      .filter((w) => /[A-Za-z]/.test(w))

  /** class -> the words the ENGINE (or a UI table the engine's words ride) can produce, read from the real constants – one assertion per class below. */
  const ENGINE_WORDS: Record<string, string[]> = {
    part: BODY_REGIONS.map((r) => r.part),
    hurt: [...Object.values(SEVERITY_DESCRIPTOR), 'niggle'],
    ladder: [...Object.values(LADDER_LABEL), ...Object.values(LADDER_LABEL).map((w) => w.toLowerCase())],
    ladderFull: Object.values(LADDER_LABEL),
    unit: Object.values(LADDER_POINTS_LABEL),
    tier: Object.values(TIER_SHORT).filter((w) => !/\d/.test(w)),
    coachTier: Object.values(COACH_TIER_LABEL),
    league: [COLLEGE_LEAGUE.label, NATIONAL_TEAM.label],
    count: [...Array.from({ length: 8 }, (_, i) => ageInWords(13 + i)), ...quoted(/const SPELLED_COUNTS[^\n]*/.exec(src('src/composables/declineVoice.ts'))?.[0] ?? '').map((w) => w.toLowerCase()), ...quoted(/\['', 'One'[^\]]*\]/.exec(src('src/components/OfferLetter.vue'))?.[0] ?? '').filter(Boolean).map((w) => w.toLowerCase()), ...quotedAll(/const NUMBER_WORD = \[([\s\S]*?)\] as const/.exec(src('src/viz/commentary.ts'))?.[1] ?? '')],
    ordinal: [...quoted(/const SET_ORDINAL[^\n]*/.exec(src('src/engine/world/matchNews.ts'))?.[0] ?? '').filter(Boolean), ...quotedAll(/const ORDINAL = \[(.*?)\]/.exec(src('src/viz/commentary.ts'))?.[1] ?? '')],
    seat: [...src('src/engine/world/sponsors.ts').matchAll(/chargeStaffFare\(.*,\s*'([^']+)'\)\s*$/gm)].map((m) => m[1] as string),
    court: [
      ...quotedAll(/const FACILITY_VENUE[\s\S]*?\n\}/.exec(src('src/engine/world/phaseFinance.ts'))?.[0] ?? '').filter((w) => !['working', 'middle', 'wealthy'].includes(w)),
      ...['COURT_WHEN_DEAR', 'COURT_WHEN_CHEAP', 'COURT_WHEN_SCHOOL', 'COURT_WHEN_FREE'].flatMap((n) => quotedAll(new RegExp(`const ${n} = \\[(.*)\\]`).exec(src('src/engine/world/phaseFinance.ts'))?.[1] ?? '')),
    ],
    round: [
      ...Array.from({ length: 7 }, (_, finish) => finishLabel(finish)),
      ...[2, 4, 8, 16, 32, 64, 128].map((size) => stageLabel(0, size)),
      stageLabel(1, 16),
    ].filter((w) => !/^Round of (8|2|4)$/.test(w)),
    phrase: Array.from({ length: 7 }, (_, finish) => finishPhrase(finish, 128)),
    surface: ['hard', 'clay', 'grass'],
  }

  for (const [cls, words] of Object.entries(ENGINE_WORDS)) {
    it(`${cls}: the engine's words are known to the reader, and none is left as English`, () => {
      expect(words.length, `${cls}: the engine words were read (an empty list would make this vacuous)`).toBeGreaterThan(0)
      // a draw of any other size is read by the generic row (`Round of {0}`), which is a pattern and not a word of the table
      const byPattern = (w: string): boolean => (cls === 'round' && /^Round of \d+$/.test(w) && !known(cls).has(w)) || (cls === 'phrase' && /^round of \d+$/.test(w))
      const unknown = [...new Set(words)].filter((w) => !known(cls).has(w) && !byPattern(w))
      expect(unknown, `${cls}: engine words the reader does not know – they would print as English inside a Russian line`).toEqual([])
      for (const w of new Set(words)) {
        const reading = readers.word(cls as WordClass, w)
        expect(CYR.test(reading), `${cls}: «${w}» reads «${reading}»`).toBe(true)
        expect(/[A-Za-z]/.test(reading), `${cls}: «${w}» reads «${reading}» – a Latin letter survived`).toBe(false)
      }
    })
  }

  it('every Russian word a reader returns is a catalog key of its own, in ru.json (nothing Russian is typed in code)', () => {
    const missing: string[] = []
    for (const [cls, words] of Object.entries(readers.vocabulary)) {
      for (const w of words) {
        const rec: string[] = []
        const probe = createWordReaders((key, params) => {
          rec.push(key)
          return translate(key, params, plain)
        })
        probe.word(cls as WordClass, w)
        for (const key of rec) if (CATALOG[key] === undefined || RU[key] === undefined) missing.push(`${cls}/${w}: ${key}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('the carpet\'s vocabulary is the readers\' tables plus the engine.text seat, and it is large enough to mean something', () => {
    expect(VOCAB.size).toBeGreaterThan(300)
    for (const english of ['Final', 'Semifinalist', 'knee', 'strain', 'second', 'Local', 'Daily', 'Takes half off the rust of a week without a match.', 'Staycation with friends'])
      expect(VOCAB.has(english), `«${english}» is in the vocabulary`).toBe(true)
    for (const name of ['Local Open', 'World Tour 500', 'Kestra Control', 'Court Basics'])
      expect(VOCAB.has(name), `«${name}» is a NAME and must never be in the vocabulary`).toBe(false)
  })
})

// ===============================================================================================================================================================================================
// §3 the messages the screens format, with the params the screens pass
// ===============================================================================================================================================================================================
interface Case {
  /** where the params come from – the call site */
  from: string
  key: string
  params: MessageParams
  /** the English word(s) the production render must NOT leave */
  words: string[]
}
const CASES: Case[] = [
  { from: 'SeasonSummaryDialog', key: 'Final {0} rank', params: ['professional'], words: ['professional'] },
  { from: 'SeasonSummaryDialog', key: '{0} could not move her {1} ranking', params: ['The coach', 'international'], words: ['international'] },
  { from: 'KidScreen', key: 'Her {0} rank counts her {1} best {2} results from the last 52 weeks. Full tables are on the Stats tab.', params: ['national', 'six', 'national'], words: ['national', 'six'] },
  { from: 'TournamentFlow', key: '{0} ranking', params: ['National'], words: ['National'] },
  { from: 'diary (stored ref)', key: 'Season {0}: #{1} {2}.', params: [2031, 12, 'international'], words: ['international'] },
  { from: 'weekAhead', key: 'Play {tier}', params: { tier: 'Local' }, words: ['Local'] },
  { from: 'weekAhead', key: '{tier} (outgrown)', params: { tier: 'Regional' }, words: ['Regional'] },
  { from: 'HomeScreen', key: '{tier}: reached, best finish {finish}', params: { tier: 'Regional', finish: 'Semifinalist' }, words: ['Regional', 'Semifinalist'] },
  { from: 'HomeScreen', key: '{n} levels hidden ({from} to {to}) – tap to show the whole ladder', params: { n: 5, from: 'National', to: 'Slam' }, words: ['National', 'Slam'] },
  { from: 'HomeScreen', key: '1 level hidden ({tier}) – tap to show the whole ladder', params: { tier: 'National' }, words: ['National'] },
  { from: 'SeasonScreen', key: 'supply|{code} {count}', params: { code: 'National', count: 3 }, words: ['National'] },
  { from: 'SeasonScreen', key: 'Also open to her: {0} – none scheduled in the next {1} weeks. Not locked, just rarer: keep watching the calendar.', params: ['Local, Regional', 8], words: ['Local', 'Regional'] },
  { from: 'ForkDialog', key: '{0} admits down to', params: ['Regional'], words: ['Regional'] },
  { from: 'KidScreen', key: 'First {0} title', params: ['Local'], words: ['Local'] },
  { from: 'tierState', key: 'Reach {required} {unit}', params: { required: 65, unit: 'national pts' }, words: ['national pts'] },
  { from: 'tierState', key: '{current} / {required} {unit}', params: { current: 12, required: 65, unit: 'international pts' }, words: ['international pts'] },
  { from: 'tierState', key: '{points} {unit} in one season', params: { points: 120, unit: 'professional pts' }, words: ['professional pts'] },
  { from: 'tierState', key: 'gate|{points} {unit}', params: { points: 120, unit: 'national pts' }, words: ['national pts'] },
  { from: 'tierState', key: '{tier} – locked: {more} more {unit} (she has {has} of {need}). {earned}', params: { tier: 'Regional Championship', more: 65, unit: 'national pts', has: 0, need: 65, earned: 'x' }, words: ['national pts'] },
  { from: 'nextGoal', key: 'Reach the {round} at the {event}', params: { round: 'semi-final', event: 'Regional Championship' }, words: ['semi-final'] },
  { from: 'nextGoal', key: 'Reach the {round} at the {event}', params: { round: 'round of 16', event: 'Regional Championship' }, words: ['round of 16'] },
  { from: 'nextGoal', key: 'Work on her {axis}', params: { axis: 'composure' }, words: ['composure'] },
  { from: 'StatsScreen', key: 'Next drop: {0}, {1} pts – leaves the window in {2} weeks.', params: ['WT250 semi-final', 40, 12], words: ['semi-final'] },
  { from: 'KnockDialog', key: 'Her {0}.', params: ['hip'], words: ['hip'] },
  { from: 'weekAction', key: 'Her {part} is waiting on your call – nothing moves until you answer.', params: { part: 'wrist' }, words: ['wrist'] },
  { from: 'diary memory (stored ref)', key: 'Out with the {0} – {1} weeks to go.', params: ['hamstring stress reaction', 3], words: ['hamstring', 'stress reaction'] },
  { from: 'diary memory (stored ref)', key: 'Out with the {injury} – back {week}.', params: { injury: 'lower back soreness', week: 'W12' }, words: ['lower back', 'soreness'] },
  { from: 'PrologueHandover', key: 'She is {age}', params: { age: 'fourteen' }, words: ['fourteen'] },
  { from: 'PrologueHandover', key: 'Where she is at {age}', params: { age: 'fourteen' }, words: ['fourteen'] },
  { from: 'RetirementDialog (ref)', key: '{0} more winters after this one, and then nobody asks her again.', params: ['Three'], words: ['Three'] },
  { from: 'RetirementDialog (ref)', key: '«{0} more winters after this one, and the last of them is not a question. I will tell you myself.»', params: ['Two'], words: ['Two'] },
  { from: 'CollegeYearCard', key: '{0} selectors read this result when they pick the squad.', params: ['the Nations Cup'], words: ['the Nations Cup'] },
  { from: 'HomeScreen', key: 'Play {fixture}', params: { fixture: 'the College League' }, words: ['the College League'] },
  { from: 'CollegeYearCard', key: 'She went out in the {0} – {1} matches, {2} wins.', params: ['Quarterfinal', 3, 2], words: ['Quarterfinal'] },
  { from: 'OfferLetter', key: 'Her deepest run of the year finished at {0}.', params: ['Semifinalist'], words: ['Semifinalist'] },
  { from: 'MoneyScreen', key: 'Buy the {0} for {1}? She plays with it from this week, and every replacement is billed at this level.', params: ['Club synthetic', '$40'], words: ['Club synthetic'] },
  { from: 'ShopPanel', key: 'You own nothing yet. The cheapest thing here is {0}, from {1}.', params: ['A savings deposit', '$1,000'], words: ['A savings deposit'] },
  { from: 'SupportStaffTab', key: 'Hire a masseur for {0} a week ({1})? You can end the arrangement any week, like the coach.', params: ['$300', 'twice a week'], words: ['twice a week'] },
  { from: 'SupportStaffTab', key: 'On retainer – {0}', params: ['the year goes on the big points – the head she takes into them.'], words: ['the year goes on the big points'] },
  { from: 'planner (stored ref)', key: 'Family vacation – {0}: +{1} condition.', params: ['Staycation with friends', 12], words: ['Staycation with friends'] },
  // ⚠ RE-AIMED 12.10 r49 №2 ф2 – the wiring round the pin was waiting for (spec :198): the week holes of these rows («W33 '31», «W4 '31») no longer pass through
  // untranslated – the `week` class (src/i18n/wordHoles.ts) re-spells them through the format registry; the Russian form is held in phase 2's home
  // (tests/component/i18n-r49-2-dates-display.test.ts, the engine-hole arm). The rows' own `words` arms are untouched (a week label was never a vocabulary word).
  { from: 'planner (stored ref)', key: 'Booked: {0} – {1}', params: ['Camping road-trip', "W33 '31"], words: ['Camping road-trip'] },
  { from: 'planner (stored ref)', key: 'Family vacation booked – {0} ({1})', params: ["W33 '31", 'Grandma\'s village'], words: ["Grandma's village"] },
  { from: 'sponsors (stored ref)', key: '{0} travel to {1} – one additional fare', params: ['Hitting partner', 'Regional Championship'], words: ['Hitting partner'] },
  { from: 'phaseFinance (stored ref)', key: '{0} – {1} h, {2}', params: ['Academy courts', 5, 'the busy hours'], words: ['Academy courts', 'the busy hours'] },
  { from: 'entries (stored ref)', key: 'Entered {0} – {1} ({2})', params: ['Local Open', "W4 '31", 'grass'], words: ['grass'] },
  { from: 'matchNews (stored ref)', key: '🩹 {0} retired hurt against {1} – she went off in the {2} set.', params: ['A. Berg', 'M. Larsen', 'third'], words: ['third'] },
  { from: 'commentary (stored ref)', key: '{0} breaks to take the {1} set.', params: ['A. Berg', 'second'], words: ['second'] },
  { from: 'ending (stored ref)', key: 'She went to college – {0}.', params: ['3 of 4 years on the scholarship'], words: ['years on the scholarship'] },
  { from: 'tournamentClose (stored ref)', key: '{0} prize money – {1}, less her {2}% share ({3})', params: ['World Tour 500', 'Quarterfinalist', 5, '$220'], words: ['Quarterfinalist'] },
  { from: 'tournamentClose (stored ref)', key: '{0}: she went out in the {1} – {2} matches, {3} wins. No prize money and no ranking points – a student field awards neither.', params: ['the College League', 'Semifinal', 3, 2], words: ['the College League', 'Semifinal'] },
  { from: 'tournamentClose (stored ref)', key: '{0}: her country called and there was no declining it. She played {1} rubbers and won {2}; the nation finished {3} of {4}. No prize money and no ranking points – there are none to award.', params: ['the Nations Cup', 3, 2, '5th', 16], words: ['the Nations Cup', '5th'] },
  // RU-22 (booth): the commentary's spelled counts – `numberWord(n)` lower case, `Num(n)` opened with a capital, and the pooled lines' `n`
  { from: 'commentary', key: '{0} saves {1} match points.', params: ['A. Berg', 'two'], words: ['two'] },
  { from: 'commentary', key: '{0} saves {1} set points and holds.', params: ['A. Berg', 'three'], words: ['three'] },
  { from: 'commentary', key: '{0} saves {1} break points and holds.', params: ['A. Berg', 'four'], words: ['four'] },
  { from: 'commentary', key: '{0} break points saved, and {1} holds on.', params: ['Two', 'A. Berg'], words: ['Two'] },
  { from: 'commentary', key: '{0} holds, {1} break points down.', params: ['A. Berg', 'five'], words: ['five'] },
  { from: 'commentary', key: '{0} deuces in this game. {1} is still serving.', params: ['Seven', 'A. Berg'], words: ['Seven'] },
  { from: 'commentary', key: '{0} times to deuce, and it is not over. {1} goes again.', params: ['Eight', 'A. Berg'], words: ['Eight'] },
  { from: 'commentary', key: '{0} deuces. {1} has still not held it.', params: ['Five', 'A. Berg'], words: ['Five'] },
  { from: 'commentary', key: '{0} games in a row for {1}.', params: ['Four', 'A. Berg'], words: ['Four'] },
  { from: 'commentary', key: '{0} games without reply for {1}.', params: ['Five', 'A. Berg'], words: ['Five'] },
  { from: 'commentary', key: '{0} games on the trot for {1}.', params: ['Six', 'A. Berg'], words: ['Six'] },
  { from: 'commentary', key: '{0} points in a row for {1}.', params: ['Nine', 'A. Berg'], words: ['Nine'] },
  { from: 'commentary', key: '{0} points without reply for {1}.', params: ['Twelve', 'A. Berg'], words: ['Twelve'] },
  { from: 'commentary', key: "{0} points in a row, all of them {1}'s.", params: ['Twenty', 'A. Berg'], words: ['Twenty'] },
  { from: 'commentary', key: '{0} shots, and it ends with a winner {1}.', params: ['Eleven', 'down the line'], words: ['Eleven'] },
  { from: 'commentary', key: '{0} shots, and {1} ends it {2}.', params: ['Twelve', 'A. Berg', 'cross-court'], words: ['Twelve'] },
  { from: 'commentary', key: '{0} shots, and {1} puts it away {2}.', params: ['Fourteen', 'A. Berg', 'through the middle'], words: ['Fourteen'] },
]

describe('§3 the messages the screens format', () => {
  for (const c of CASES) {
    it(`${c.from} – ${c.key.slice(0, 60)}`, () => {
      expect(CATALOG[c.key], 'the case names a real catalog key').toBeDefined()
      expect(RU[c.key], 'and it has Russian').toBeDefined()
      const ru = rig()
      const out = translate(c.key, c.params, ru.ctx)
      expect([...ru.invalid], `the Russian row falls back to English whole (a plural over a word hole?): «${out.slice(0, 120)}»`).toEqual([])
      expect(CYR.test(out), `Russian came out: «${out}»`).toBe(true)
      expect(/undefined|NaN|\[object|\{\w+\}/.test(out), `no unresolved hole in «${out}»`).toBe(false)
      for (const w of c.words) expect(out.includes(w), `«${w}» survived in «${out}»`).toBe(false)
      // the control: with the hook off the same message prints the English word, so the check above CAN fail
      const off = rig({ hook: false })
      const bare = translate(c.key, c.params, off.ctx)
      expect(c.words.some((w) => bare.includes(w)) || off.invalid.size > 0, `control: without the hook the message must show the engine word (or fall back): «${bare.slice(0, 120)}»`).toBe(true)
    })
  }

  it('the tier guide\'s goal sentences (`gapInResultsNote`) are whole messages: English byte-identical to the template they replaced, Russian without a left-over English finish', async () => {
    try {
      resetI18nForTests(null)
      // English first: the old template literal, rebuilt here from `finishPhrase` over the same grid the function walks
      const grid: Array<[number, number]> = [[10, 0], [38, 110], [138, 300], [250, 700], [65, 0], [20, 40], [500, 1200]]
      const english = grid.map(([gap, points]) => gapInResultsNote(gap, points))
      expect(english.filter((s) => s !== null).length, 'the grid reaches the function').toBeGreaterThan(3)
      for (const s of english) if (s !== null) expect(/^(one more |\d+ more )(title|final|semi-final|quarter-final|round of \d+)s? at /.test(s), `English shape «${s}»`).toBe(true)
      installCatalog('ru', RU)
      await setLocale('ru')
      const russian = grid.map(([gap, points]) => gapInResultsNote(gap, points))
      russian.forEach((s, i) => {
        if (s === null) return expect(english[i]).toBeNull()
        expect(CYR.test(s), `Russian: «${s}»`).toBe(true)
        expect(rawWordsIn(s, VOCAB), `«${s}»`).toEqual([])
        expect(/\b(more|title|final|semi-final|quarter-final|round of)\b/.test(s), `an English word of the sentence survived in «${s}»`).toBe(false)
      })
    } finally {
      resetI18nForTests(null)
    }
  })
})


describe('§3b the Kid screen\'s notes: the engine\'s sentences are exactly the shapes the reader matches', () => {
  /** a view for one week of one career (round23-kid-life.test.ts's builder, the fields the two notes read) */
  function view(week: number, over: Partial<KidLifeWorldView> = {}): KidLifeWorldView {
    const birthMonth = over.birthMonth ?? 6
    return {
      seed: 'ru22-notes', week, ageYears: Math.floor(kidAgeExact(week, birthMonth, 15)), seasonYear: seasonYear(Math.floor(week / WEEKS_PER_YEAR)), temperament: 'quiet', composure: 50,
      playStyle: 'all-court', birthMonth, injured: false, weeksAway: 0, lossStreak: 0, weeksSinceTitle: null, college: null, kidFundsCents: 0, kidSharePausedYears: 0, ownsBrand: false, ...over,
    } as KidLifeWorldView
  }
  const college = (over: Partial<NonNullable<KidLifeWorldView['college']>>): NonNullable<KidLifeWorldView['college']> =>
    ({ studying: false, yearsDone: 0, totalYears: ENDINGS.collegeYears, tier: 'state' as CollegeTier, ...over }) as NonNullable<KidLifeWorldView['college']>

  it('every sentence the engine can write for the notes is rendered in Russian by the boundary, with nothing English left', () => {
    const sentences: Array<[string, string]> = [['School – {0}', schoolCutOffNote(view(246, { birthMonth: 12 }))]]
    for (const tier of ['state', 'national', 'private', null] as const) {
      sentences.push(['College – {0}', collegeNote(view(400, { college: college({ studying: true, yearsDone: 1, tier }) }))])
      sentences.push(['College – {0}', collegeNote(view(400, { college: college({ studying: false, yearsDone: ENDINGS.collegeYears, tier }) }))])
      sentences.push(['College – {0}', collegeNote(view(400, { college: college({ studying: false, yearsDone: 1, tier }) }))])
      sentences.push(['College – {0}', collegeNote(view(400, { college: college({ studying: false, yearsDone: 2, tier }) }))])
    }
    expect(sentences.every(([, s]) => s !== ''), 'the engine writes all of them (an empty note would make a case vacuous)').toBe(true)
    for (const [key, sentence] of sentences) {
      const r = rig()
      const out = translate(key, [sentence], r.ctx)
      expect([...r.invalid], `«${sentence.slice(0, 60)}»`).toEqual([])
      expect([...r.missing], `a key the reader asks for that ru.json lacks`).toEqual([])
      expect(CYR.test(out), `Russian: «${out}»`).toBe(true)
      expect(/ she | the |years|year of|cut-off/.test(out), `an English word of the sentence survived in «${out}»`).toBe(false)
      expect(rawWordsIn(out, VOCAB), `«${out}»`).toEqual([])
    }
  })
})

// ===============================================================================================================================================================================================
// §3c the booth's counted sentences (seventeen messages of src/viz/commentary.ts)
// ===============================================================================================================================================================================================
describe('§3c the booth\'s counts: a number the code SPELLED in English is read by the boundary, three ways', () => {
  const BOOTH_FILE = 'src/viz/commentary.ts'
  const keysOf = (cls: WordClass): string[] => HOLE_TABLE[cls].map((row) => row[0]).filter((k) => CATALOG[k]?.home?.includes(BOOTH_FILE))
  const SPELLED = keysOf('count')
  const OPENING = keysOf('countOpen')
  const UNDER_PLURAL = keysOf('digits')
  const holeOf = (cls: WordClass, key: string): number => (HOLE_TABLE[cls].find((row) => row[0] === key)?.[1] as number | undefined) ?? -1
  /** the English count words the code can hand a hole, as one test for the Russian line (a name in the fixtures never contains one as a word) */
  const COUNT_WORD = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i
  const paramsFor = (key: string, word: string, hole: number): string[] => holesOf(key).map((h) => (h === hole ? word : h === 2 ? 'cross-court' : 'A. Berg'))

  it('the table holds the seventeen: eight spelled inside the sentence, three that open it, six under a plural of the row\'s own – and the document states the same numbers', () => {
    expect([SPELLED.length, OPENING.length, UNDER_PLURAL.length]).toEqual([8, 3, 6])
    const doc = readFileSync('docs/localization/ru-display-words-2026-10.md', 'utf8')
    const stated = /Booth count messages: \*\*(\d+)\*\* \((\d+) \/ (\d+) \/ (\d+)\)/.exec(doc)
    expect(stated, 'the document states the booth\'s count messages').not.toBeNull()
    expect(stated?.slice(1).map(Number)).toEqual([SPELLED.length + OPENING.length + UNDER_PLURAL.length, SPELLED.length, OPENING.length, UNDER_PLURAL.length])
  })

  it('the spelled word reads as the Russian numeral – lower case inside the sentence, the capital kept where it opens it – and a figure past twenty passes as written', () => {
    const on = rig()
    for (const key of SPELLED) {
      const hole = holeOf('count', key)
      const out = translate(key, paramsFor(key, 'Two', hole), on.ctx)
      expect(COUNT_WORD.test(out), `«${out}»`).toBe(false)
      expect(CYR.test(out), `«${out}»`).toBe(true)
      expect(translate(key, paramsFor(key, '24', hole), on.ctx), 'a figure is not a word').toContain('24')
    }
    for (const key of OPENING) {
      const hole = holeOf('countOpen', key)
      const out = translate(key, paramsFor(key, 'Four', hole), on.ctx)
      expect(COUNT_WORD.test(out), `«${out}»`).toBe(false)
      expect(out[0], `«${out}» opens with the numeral`).toBe(out[0]?.toUpperCase())
      expect(/^\p{Script=Cyrillic}/u.test(out), `«${out}» opens with a Russian word`).toBe(true)
      expect(translate(key, paramsFor(key, '24', hole), on.ctx), 'a figure is not a word').toContain('24')
    }
    expect([...on.invalid], 'no row fell back to English').toEqual([])
  })

  it('the six rows with a noun after the count put a four-branch plural over the digits, and every count from five to a hundred and eleven gets the noun\'s own form', () => {
    const on = rig()
    const spelledTo20 = ['five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
    const figures = ['21', '22', '23', '24', '25', '30', '101', '111']
    for (const key of UNDER_PLURAL) {
      const row = RU[key] as string
      const form = (cat: string): string => new RegExp(`${cat} \\{\\{0\\} ([^}]+)\\}`).exec(row)?.[1] ?? ''
      for (const cat of ['one', 'few', 'many', 'other']) expect(form(cat), `${key.slice(0, 40)}: the «${cat}» branch`).not.toBe('')
      // the noun is the row's own: the same four words for every digit, and the hole prints the figure
      for (const word of [...spelledTo20, ...figures]) {
        const figure = /^\d+$/.test(word) ? word : String(spelledTo20.indexOf(word) + 5)
        const out = translate(key, paramsFor(key, word, 0), on.ctx)
        expect(out.startsWith(`${figure} ${form(pluralCategory('ru', Number(figure)))}`), `${figure}: «${out}»`).toBe(true)
        expect(COUNT_WORD.test(out), `«${out}»`).toBe(false)
      }
    }
    expect([...on.invalid], 'no row fell back to English').toEqual([])
  })

  it('the sweep: every booth message the commentary really builds carries, at the claimed hole, a word the reader knows – and renders in Russian with no English count word', () => {
    const claim = new Map<string, { cls: WordClass; hole: number }>()
    for (const cls of ['count', 'countOpen', 'digits'] as const) for (const key of keysOf(cls)) claim.set(key, { cls, hole: holeOf(cls, key) })
    const plain: RenderContext = { locale: 'ru', lookup: (k) => RU[k] }
    const known = new Set(createWordReaders((key, params) => translate(key, params, plain)).vocabulary.count)
    const on = rig()
    const off = rig({ hook: false })
    const seen = new Map<string, number>()
    const problems: string[] = []
    let controlled = 0
    const visit = (ref: CopyRef): void => {
      const c = claim.get(ref.k)
      if (c) {
        seen.set(ref.k, (seen.get(ref.k) ?? 0) + 1)
        const given = String(ref.p?.[c.hole])
        if (!known.has(given.toLowerCase()) && !/^\d+$/.test(given)) problems.push(`${ref.k.slice(0, 60)}: hole ${c.hole} is «${given}» – not a word the reader knows`)
        const out = translate(ref.k, ref.p as MessageParams, on.ctx)
        if (COUNT_WORD.test(out) || !CYR.test(out)) problems.push(`${ref.k.slice(0, 60)}: «${out}»`)
        // the control: with the hook off the same ref prints the English word (or the plural falls back whole), so the check above CAN fail
        const bare = translate(ref.k, ref.p as MessageParams, off.ctx)
        if (COUNT_WORD.test(bare)) controlled++
      }
      for (const p of ref.p ?? []) if (isCopyRef(p)) visit(p)
    }
    for (const m of vizMatches()) for (const e of vizEvents()) for (const b of buildCommentary(m.match, m.nameA, m.nameB, e.event)) {
      if (b.leadC) visit(b.leadC)
      if (b.textC) visit(b.textC)
    }
    expect(problems).toEqual([])
    expect([...on.invalid], 'no row fell back to English').toEqual([])
    // not vacuous: the grid reaches most of the seventeen (the rest are named below), and the control saw English words come out without the hook
    expect([...seen.keys()].length, `the grid reached: ${[...seen.keys()].map((k) => k.slice(0, 30)).join(' | ')}`).toBeGreaterThanOrEqual(10)
    expect(controlled).toBeGreaterThan(20)
    const notReached = [...claim.keys()].filter((k) => !seen.has(k))
    expect(notReached.map((k) => k.slice(0, 70)), 'booth messages the grid does not reach (they are covered by §3 alone)').toEqual(NOT_REACHED_BY_THE_GRID)
  })

  it('MUTATION – a class cut from the table gives the English word back; the hook switched off gives it back too', () => {
    const cut = (drop: WordClass): WordTables => ({ holes: { ...HOLE_TABLE, [drop]: [] }, named: NAMED_HOLES })
    const spelled = SPELLED[0] as string
    const opening = OPENING[0] as string
    const plural = UNDER_PLURAL[0] as string
    expect(COUNT_WORD.test(translate(spelled, paramsFor(spelled, 'Two', holeOf('count', spelled)), rig({ tables: cut('count') }).ctx))).toBe(true)
    expect(COUNT_WORD.test(translate(opening, paramsFor(opening, 'Four', holeOf('countOpen', opening)), rig({ tables: cut('countOpen') }).ctx))).toBe(true)
    const noPlural = rig({ tables: cut('digits') })
    const out = translate(plural, paramsFor(plural, 'Nine', 0), noPlural.ctx)
    expect(COUNT_WORD.test(out) && noPlural.invalid.size > 0, `a plural over a word falls back to the English whole: «${out}»`).toBe(true)
    for (const [key, word, hole] of [[spelled, 'Two', holeOf('count', spelled)], [opening, 'Four', holeOf('countOpen', opening)], [plural, 'Nine', 0]] as const) {
      expect(COUNT_WORD.test(translate(key, paramsFor(key, word, hole), rig({ hook: false }).ctx)), key).toBe(true)
    }
  })
})

// ===============================================================================================================================================================================================
// §3d two unit words that lived in formatters (the fee pill, the weekly band)
// ===============================================================================================================================================================================================
describe('§3d the fee pill and the weekly band say their unit through the catalogue', () => {
  afterEach(() => resetI18nForTests(null))

  it('English: the strings the old code built, byte for byte', () => {
    resetI18nForTests(null)
    expect(entryFeeText(0)).toBe('no entry fee')
    expect(entryFeeText(4_000)).toBe('entry $40')
    expect(entryFeeText(100_000)).toBe('entry $1,000')
    expect(t('{0}/wk', ['$43-74'])).toBe('$43-74/wk')
  })

  it('Russian: the owner\'s two forms and the existing weekly unit, read by key – and no English unit is left', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    expect(entryFeeText(0)).toBe(RU['no entry fee'])
    expect(entryFeeText(4_000)).toBe((RU['entry {0}'] as string).replace('{0}', '$40'))
    expect(t('{0}/wk', ['$43-74'])).toBe((RU['{0}/wk'] as string).replace('{0}', '$43-74'))
    for (const out of [entryFeeText(0), entryFeeText(4_000), t('{0}/wk', ['$43-74'])]) {
      expect(CYR.test(out), out).toBe(true)
      expect(/\b(entry|fee|wk)\b/.test(out), `an English unit word in «${out}»`).toBe(false)
    }
  })
})

// ===============================================================================================================================================================================================
// §4 English cannot reach the boundary
// ===============================================================================================================================================================================================
describe('§4 English cannot reach the boundary', () => {
  it('under en the hook is never asked and the output is the message formatted over the raw params – for every case of §3', () => {
    let asked = 0
    const spy: RenderContext['words'] = (_key, params) => {
      asked++
      return params
    }
    for (const c of CASES) {
      const withHook = translate(c.key, c.params, { locale: 'en', words: spy })
      const without = translate(c.key, c.params, { locale: 'en' })
      const direct = formatMessage(c.key.replace(/^[a-z][a-z0-9_-]{0,23}\|/, ''), c.params, { locale: 'en' })
      expect(withHook).toBe(without)
      expect(without).toBe(direct)
    }
    expect(asked, 'the hook was asked ZERO times under English').toBe(0)
  })

  it('under a Russian catalog that lacks the row, the hook is not asked either (it runs only for a row that renders)', () => {
    let asked = 0
    const spy: RenderContext['words'] = (_key, params) => {
      asked++
      return params
    }
    const out = translate('Her {0}.', ['hip'], { locale: 'ru', lookup: () => undefined, words: spy })
    expect(out).toBe('Her hip.')
    expect(asked).toBe(0)
  })

  it('engineText and engineWord return their input untouched under en, for the whole vocabulary', () => {
    resetI18nForTests(null)
    for (const english of VOCAB.keys()) {
      expect(engineText(english)).toBe(english)
      expect(engineWord('round', english)).toBe(english)
    }
  })

  it('…and read the catalog under ru: a label with a row is Russian, a text with none renders as written', async () => {
    try {
      resetI18nForTests(null)
      installCatalog('ru', RU)
      await setLocale('ru')
      expect(engineText('A savings deposit')).toBe(RU['A savings deposit'])
      expect(engineText('Not a label of the economy')).toBe('Not a label of the economy')
      expect(engineWord('round', 'Semifinal')).toBe(RU.Semifinal)
      expect(engineWord('part', 'knee')).toBe(RU['body|knee'])
      expect(t('Her {0}.', ['knee'])).toBe(RU['Her {0}.']!.replace('{0}', RU['body|knee']!))
    } finally {
      resetI18nForTests(null)
    }
  })
})

// ===============================================================================================================================================================================================
// §5 played careers
// ===============================================================================================================================================================================================
describe('§5 played careers: every ref a career stores, rendered under the production context', () => {
  afterEach(() => resetI18nForTests(null))

  /** every CopyRef anywhere under a snapshot (the prompts, the news, the diary …) – nested ones included */
  function refsIn(v: unknown, out: CopyRef[], depth = 0): void {
    if (depth > 9 || v === null || v === undefined || typeof v !== 'object') return
    if (isCopyRef(v)) {
      out.push(v)
      return
    }
    if (Array.isArray(v)) {
      for (const x of v.slice(0, 80)) refsIn(x, out, depth + 1)
      return
    }
    for (const x of Object.values(v as Record<string, unknown>)) refsIn(x, out, depth + 1)
  }

  it('no ref falls back to English because its row is invalid, and no engine word of the vocabulary survives in a Russian line – and the hook really did work (a vacuous sweep is red)', () => {
    const refs: CopyRef[] = []
    const sample = (w: number, world: Parameters<typeof toSnapshot>[0]): void => {
      if (w % 11 === 3) refsIn(JSON.parse(JSON.stringify(toSnapshot(world))), refs)
    }
    const played = [playBench(0, 0, 420, sample), playBench(1, 1, 420, sample), playBench(3, 0, 420, sample), playBench(5, 2, 420, sample), playCollege('ru22-a', false), playCollege('ru22-b', true)]
    for (const p of played) {
      for (const r of p.rows) if (r.c && isCopyRef(r.c)) refs.push(r.c as CopyRef)
      refsIn(JSON.parse(JSON.stringify(toSnapshot(p.world))), refs)
    }
    expect(refs.length, 'the careers wrote refs').toBeGreaterThan(5000)
    const on = rig()
    const off = rig({ hook: false })
    const leaks = new Map<string, string>()
    let rawWithoutHook = 0
    for (const ref of refs) {
      const out = translate(ref.k, ref.p as MessageParams | undefined, on.ctx)
      const found = rawWordsIn(out, VOCAB)
      if (found.length > 0 && !leaks.has(ref.k)) leaks.set(ref.k, `${found.join(' | ')} – «${out.slice(0, 110)}»`)
      if (rawWordsIn(translate(ref.k, ref.p as MessageParams | undefined, off.ctx), VOCAB).length > 0) rawWithoutHook++
    }
    expect([...on.invalid], 'rows that would not render fall back to English whole').toEqual([])
    expect([...leaks.entries()].map(([k, v]) => `${k.slice(0, 70)} => ${v}`), 'engine words of the vocabulary left in a Russian line').toEqual([])
    expect(on.hook.changed, 'the hook rewrote the params of thousands of renders').toBeGreaterThan(1500)
    expect(rawWithoutHook, 'the control: without the hook the same refs DO print engine words (the check can fail)').toBeGreaterThan(1500)
  })
})

// ===============================================================================================================================================================================================
// §6 mutation arms
// ===============================================================================================================================================================================================
describe('§6 mutation arms – each turns a green check red', () => {
  const knee: CopyRef = { k: 'Injury: {0} {1} – out ~{2} wks.', p: ['knee', 'strain', 3] }
  const court: CopyRef = { k: '{0} – {1} h, {2}', p: ['Academy courts', 5, 'the busy hours'] }
  const leakOf = (ref: CopyRef, r: Rig): string[] => rawWordsIn(translate(ref.k, ref.p as MessageParams, r.ctx), VOCAB)

  it('the production rig renders both refs without an engine word', () => {
    expect(leakOf(knee, rig())).toEqual([])
    expect(leakOf(court, rig())).toEqual([])
  })

  it('MUTATION 1 – the hook switched off: both refs print English words', () => {
    expect(leakOf(knee, rig({ hook: false })).sort()).toEqual(['knee', 'strain'])
    expect(leakOf(court, rig({ hook: false })).sort()).toEqual(['Academy courts', 'the busy hours'])
  })

  it('MUTATION 2 – a class cut from the table: only that class\'s words come back', () => {
    const cut = (drop: WordClass): WordTables => ({ holes: { ...HOLE_TABLE, [drop]: [] }, named: NAMED_HOLES })
    expect(leakOf(knee, rig({ tables: cut('part') }))).toEqual(['knee'])
    expect(leakOf(knee, rig({ tables: cut('hurt') }))).toEqual(['strain'])
    expect(leakOf(court, rig({ tables: cut('court') })).sort()).toEqual(['Academy courts', 'the busy hours'])
  })

  it('MUTATION 3 – a word\'s catalog row deleted: that word reads English (and the miss is counted)', () => {
    const without = { ...RU }
    delete without['body|knee']
    const r = rig({ catalog: without })
    expect(leakOf(knee, r)).toEqual(['knee'])
    expect([...r.missing]).toEqual(['body|knee'])
  })

  it('MUTATION 4 – a row of the hole table pointing at the wrong hole reads the wrong param: the net catches a mis-aimed claim', () => {
    const shifted: WordTables = { holes: { ...HOLE_TABLE, part: HOLE_TABLE.part.map((row) => (row[0] === knee.k ? ([row[0], 2] as unknown as HoleRow) : row)) }, named: NAMED_HOLES }
    expect(leakOf(knee, rig({ tables: shifted }))).toContain('knee')
  })

  it('MUTATION 5 – the set of an engine word the reader does not know: an unknown word comes back as written, which the vocabulary arm cannot see – so it is a §2 failure, by name', () => {
    const plain: RenderContext = { locale: 'ru', lookup: (k) => RU[k] }
    const readers = createWordReaders((key, params) => translate(key, params, plain))
    expect(readers.word('part', 'tibia')).toBe('tibia')
    expect(new Set(readers.vocabulary.part).has('tibia')).toBe(false)
  })
})

// ===============================================================================================================================================================================================
// §7 the document's claims
// ===============================================================================================================================================================================================
describe('§7 the document\'s claims are pinned against the tree', () => {
  const doc = readFileSync('docs/localization/ru-display-words-2026-10.md', 'utf8')
  const rowsOfDoc = [...doc.matchAll(/^\| (RU22-WRD-[0-9A-Z]+) \| `((?:[^`\\]|\\.)+)` \| `([^`]+)` \|$/gm)].map((m) => ({ id: m[1] as string, key: (m[2] as string).replace(/\\\|/g, '|'), ru: m[3] as string }))

  it('every row of the document is a catalog key with exactly its Russian in ru.json, and the ids are unique', () => {
    expect(rowsOfDoc.length).toBeGreaterThan(80)
    const ids = new Set<string>()
    const problems: string[] = []
    for (const r of rowsOfDoc) {
      if (ids.has(r.id)) problems.push(`${r.id}: duplicated id`)
      ids.add(r.id)
      if (CATALOG[r.key] === undefined) problems.push(`${r.id}: «${r.key.slice(0, 60)}» is not a catalog key`)
      else if (RU[r.key] !== r.ru) problems.push(`${r.id}: ru.json carries «${(RU[r.key] ?? '').slice(0, 40)}», the document «${r.ru.slice(0, 40)}»`)
    }
    expect(problems).toEqual([])
  })

  it('the total the document states is the number of its rows (a count written in prose survives a full gate)', () => {
    const stated = /\| \*\*Total\*\* \| \*\*(\d+)\*\* \|/.exec(doc)
    expect(stated, 'the document states a total').not.toBeNull()
    expect(Number(stated?.[1])).toBe(rowsOfDoc.length)
  })

  it('every `t()` key the readers ask for has a row in the document or an older one in ru.json – none is a bare English fallback', () => {
    const plain: RenderContext = { locale: 'ru', lookup: (k) => RU[k] }
    const asked = new Set<string>()
    const probe = createWordReaders((key, params) => {
      asked.add(key)
      return translate(key, params, plain)
    })
    for (const [cls, words] of Object.entries(probe.vocabulary)) for (const w of words) probe.word(cls as WordClass, w)
    for (const english of ['3rd', '12th', '2 of 4 years on the scholarship', 'WT250 semi-final', 'round of 16', 'Round of 24', 'Local, Slam']) {
      probe.word('place', english)
      probe.word('span', english)
      probe.word('dropWhat', english)
      probe.word('phrase', english)
      probe.word('tierList', english)
      probe.word('round', english)
    }
    probe.word('ageYears', 'fourteen')
    const noRow = [...asked].filter((k) => RU[k] === undefined)
    expect(noRow, 'keys a reader asks for that ru.json does not carry').toEqual([])
    expect(asked.size).toBeGreaterThan(100)
  })
})
