// 11.10 (THE LAST AUTHORING WAVE, RU-21 part two) – THE SCREENS AND SCRIPTS RENDER UNDER THE COMPILED RUSSIAN, AND THE CENSUS OF WHAT IS LEFT IS A PIN.
// docs/localization/ru-engine-tails-2026-10.md (part two) and the `⚙ 11.10 agent-authored (бланкет)` section at the foot of each screen's table.
//
// WHY THIS FILE EXISTS. `npm run i18n:check` proves a Russian value PARSES and reads the holes its key reads. It cannot see the class this wave is most exposed to: a plural written over a hole that the call site
// hands in as a STRING (a money figure, a week label, `formatUnits()`, an English word from the code). The renderer does not throw into the player – it falls back to the WHOLE English sentence and counts a miss –
// so the row compiles, the gate is green, and a Russian screen quietly shows English. The wave puts a plural over 90 holes of 76 rows; every one of them was checked against its call site on 11.10 and the
// table below records the expression the site hands in. A hand edit that puts a plural over a hole NOT in the table goes red here, not in his playtest.
//
// ⚠ NO CYRILLIC IS TYPED HERE (the booth wave's rule): every expectation is read from ru.json, from the documents or from the catalogue; the mutation arms use ASCII stand-ins.
//
//   §1 the census: the catalogue keys without Russian are exactly seven, and they are named (two held paragraphs; five bare keys whose tagged twin lives in the same file)
//   §2 the wave's keys (the rows of its sections + the 53 scaffold cells filled in place): 681, and every value renders under the real ru.json – not invalid, not English, no hole left
//   §3 the plural holes of the wave are exactly the table of number-fed holes
//   §4 the table in RU-21 part two states the counts the documents hold
//   §5 the mutation arms: a plural over a hole outside the table, and one more key without a row, both go red
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { analyzeMessage, translate, type MissReason } from '../src/shared/i18n'
import { liveCorpora, readAllRows } from '../tools/i18n-corpus-join'
import { CATALOG_PATH, parseCatalog, seenLiterals } from '../tools/i18n-extract'
import { compile, listDocs, TABLES_DIR } from '../tools/i18n-import'
import { after } from './helpers/source'

const ROOT = resolve(__dirname, '..')
const RU = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/ru.json'), 'utf8')) as Record<string, string>
const CAT = JSON.parse(readFileSync(resolve(ROOT, CATALOG_PATH), 'utf8')) as { keys: Record<string, { home: string[]; area: string[] }> }
const CYR = /\p{Script=Cyrillic}/u

// ---- the wave's rows, found the way the importer finds them ------------------------------------------------------------------------------------------------------------------------------------------------
/** A row this wave wrote (the id of its family) … */
const FAMILY_ROW = /^\| RU21-(SHL|SEA|HOM|CLY|ALB|STA|ENS|PRF|MON|MTV|SAV|RET|ONB|FMT|DWN|DIA)-\d+ \|/
/** … or one of the 53 scaffold cells of the 10.10 №40 addition that it filled in place (the four ui-shell cells are L01, L02, L05 and RD01). */
const SCAFFOLD_ROW = /^\| (RU04-SW\d+|RU04-SP\d+|RU07-RH\d+|SPL-SC\d+|RU01-L0[125]|RU01-RD01) \|/

const docLines = new Map<string, string[]>()
const lineOf = (doc: string, line: number): string => {
  if (!docLines.has(doc)) docLines.set(doc, readFileSync(join(ROOT, TABLES_DIR, doc), 'utf8').split('\n'))
  return docLines.get(doc)![line - 1] ?? ''
}

interface Wave {
  /** key -> the compiled Russian */
  keys: Map<string, string>
  /** the wave's `QUESTION` rows: the English cell of each (never compiled) */
  parked: string[]
  /** how many compiled keys came from a scaffold cell */
  scaffold: number
}
function waveFromDocs(): Wave {
  const { rows } = readAllRows(listDocs(), TABLES_DIR, liveCorpora())
  const compiled = compile(rows, { catalog: parseCatalog(readFileSync(resolve(ROOT, CATALOG_PATH), 'utf8')), seen: seenLiterals })
  const keys = new Map<string, string>()
  const parked: string[] = []
  let scaffold = 0
  for (const o of compiled.outcomes) {
    const text = lineOf(o.row.doc, o.row.line)
    const own = FAMILY_ROW.test(text)
    const filled = SCAFFOLD_ROW.test(text)
    if (!own && !filled) continue
    if (o.disposition === 'compiled' && o.key !== undefined && o.value !== undefined) {
      keys.set(o.key, o.value)
      if (filled) scaffold++
    } else if (own && o.row.status === 'QUESTION') parked.push(o.row.english ?? '')
  }
  return { keys, parked, scaffold }
}
const WAVE = waveFromDocs()

// ---- §1 the census ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/** The catalogue keys without a Russian value – the census as a pure function, so a mutation arm can drive it. */
const withoutRussian = (ru: Readonly<Record<string, string>>): string[] => Object.keys(CAT.keys).filter((k) => ru[k] === undefined).sort()
// ⚠ RE-AIMED 11.10, the same day, twice: the five bare twins took their own ctx tags at the call
// sites (btn|Load, btn|Import, heading|Stats, recap|Training, poster|def./lost to) and the two held
// ending paragraphs settled by the owner's word – so the helpers that ENUMERATED the census died
// with it (noUnusedLocals refuses a list nobody reads), and §1 asserts the zero directly.

describe('§1 THE CENSUS – zero keys without Russian, and the road to zero is named', () => {
  it('⚠ RE-AIMED 11.10 TO ZERO: every catalogue key has a Russian value – the owner ruled both held paragraphs the same day («she agreed to one more»; «доделывай»)', () => {
    expect(withoutRussian(RU)).toEqual([])
  })

  it('the five one-time bare twins are resolved: the bare keys are gone and their tagged heirs carry Russian', () => {
    for (const heir of ['btn|Load', 'btn|Import', 'heading|Stats', 'recap|Training', 'poster|def.']) {
      expect(CAT.keys[heir], heir).toBeDefined()
      expect(RU[heir], `${heir} carries the parked Russian`).toBeDefined()
    }
    for (const dead of ['Load', 'Import', 'Stats', 'Training', 'def.']) expect(CAT.keys[dead], `${dead} died with its last caller`).toBeUndefined()
  })

  it('the parked Russian moved onto the tagged heirs the same day; the QUESTION rows left are the historic def. and round 49 №9\'s three', () => {
    // ⚠ RE-AIMED 11.10: Import and Stats re-pointed to btn|Import / heading|Stats and compile; def. died into the existing poster| pair.
    // ⚠ RE-AIMED 12.10 (round 49 №9, «убрать всю строку»): the one-more-year note left EndingScreen and its three keys
    // (`You said one more year`, `time.`, `times.`) died with their only caller – the rows stay in the table as the
    // owner's record, parked QUESTION the way the historic def. row is.
    expect([...WAVE.parked].sort()).toEqual(['You said one more year', 'def.', 'time.', 'times.'])
  })
})

// ---- §2 the wave renders ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('§2 THE WAVE – 681 keys, every value rendered under the real ru.json', () => {
  it('681 keys were added by this wave: 628 new rows and 53 scaffold cells', () => {
    expect(WAVE.keys.size).toBe(687) /* ⚠ 22.10 r53 N2: +4 – RU21-MON-122..125 (steps 2 and 3, the same four rows §4 counts). */ /* ⚠ 11.10: +2 – the Import/Stats rows re-pointed to their tagged heirs the same day. ⚠ 12.10 round 49 №9: −3 – the one-more-year note left EndingScreen; its three rows are parked QUESTION above. ⚠ 12.10 r50 №1: +1 – the pregnancy page's alt, RU21-ALB-16. ⚠ 12.10 r50 №5: +2 – the brand line's two keys, RU21-ENS-13/14 */
    expect(WAVE.scaffold).toBe(53)
  })

  it('every value renders for the numbers 1, 2, 5 and 21 (all three plural categories): never the English fallback, never a hole left over, Russian wherever the value has any', () => {
    const bad: string[] = []
    for (const [key, value] of WAVE.keys) {
      expect(RU[key], `${key}: the compiled value is the one in ru.json`).toBe(value)
      const shape = analyzeMessage(value)
      const counted = new Set([...shape.plurals, ...shape.selects].map((p) => p.name))
      for (const n of [1, 2, 5, 21]) {
        const params: Record<string, unknown> = {}
        for (const arg of shape.args) params[arg] = counted.has(arg) ? n : 'Xx'
        const missed: MissReason[] = []
        const out = translate(key, params, { locale: 'ru', lookup: (k) => RU[k], onMiss: (_k, why) => missed.push(why) })
        if (missed.length > 0) bad.push(`${key} (n=${n}): ${missed.join('/')}`)
        else if (/undefined|NaN|\[object|\{\w*\}/.test(out)) bad.push(`${key} (n=${n}): a hole left in «${out}»`)
        else if (CYR.test(value) && !CYR.test(out)) bad.push(`${key} (n=${n}): no Russian came out`)
      }
    }
    expect(bad.slice(0, 20), `${bad.length} value(s) that would not render`).toEqual([])
  })

  it('a counted noun inflects: for every plural over a hole the three categories one / few / many give three different strings or the same word by design (never an empty one)', () => {
    for (const [key, value] of WAVE.keys) {
      const shape = analyzeMessage(value)
      for (const p of shape.plurals) {
        const rendered = [1, 2, 5].map((n) => translate(key, Object.fromEntries(shape.args.map((a) => [a, a === p.name ? n : 'Xx'])), { locale: 'ru', lookup: (k) => RU[k] }))
        expect(rendered.every((s) => s.trim() !== ''), `${key}: ${p.name}`).toBe(true)
      }
    }
  })
})

// ---- §3 the plural holes ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/** [key, hole, the expression the call site hands in] – checked against the source on 11.10. All of them are counts (numbers). Add a row ONLY after reading the call site. */
const NUMBER_FED_HOLES: ReadonlyArray<readonly [key: string, hole: string, fedBy: string]> = [
  ['One of the {0} places this tournament holds for players of the host nation – she is outside the acceptance list.', '0', 'wildCardSlots'],
  ['Also open to her: {0} – none scheduled in the next {1} weeks. Not locked, just rarer: keep watching the calendar.', '1', 'UPCOMING_WEEKS'],
  ['{0} left to enter over {1} weeks', '0', 'supplyLine.total'],
  ['{0} left to enter over {1} weeks', '1', 'supplyLine.weeks'],
  ['{0} of them on the cards below', '0', 'supplyOnScreen'],
  ['Her condition going into this tournament: {0} percent', '0', 'condition'],
  ['Round of {0}', '0', 'remaining'],
  ['{0} wins for the title.', '0', 'wins'],
  ['Age {0}', '0', 'kidAge'],
  ['{n} weeks passed. Everything they raised is below.', 'n', 'n: weeksSpent.value'],
  ['Open – none in {weeks} weeks', 'weeks', 'weeks: input.horizonWeeks'],
  ['Opens at {age}', 'age', 'age: tier.minAgeYears'],
  ['Past this level – none in {weeks} weeks', 'weeks', 'weeks: input.horizonWeeks'],
  ['age {age}', 'age', 'tier.minAgeYears'],
  ['age {min}-{max}', 'max', 'max: tier.maxAgeYears'],
  ['{tier} is under-{n} – at {age} she has aged out of it.', 'age', 'age: input.ageYears'],
  ['{tier} – open to her, but none is scheduled in the next {weeks} weeks. This tier comes round less often than the others; it is not locked.', 'weeks', 'weeks: input.horizonWeeks'],
  ['{tier} – past this level but still hers to enter, but none is scheduled in the next {weeks} weeks. This tier comes round less often than the others; it is not locked.', 'weeks', 'weeks: input.horizonWeeks'],
  ['{tier} – she has used all {limit} of her international events for this year (age {age}). Not locked: a fresh allowance arrives on her next birthday.', 'limit', 'limit'],
  ['{tier} – the tour\'s age rule allows {limit} pro entries at {age} and she has used all {used}. Not locked: a fresh allowance arrives on her next birthday, and the junior and national events stay open.', 'age', 'age: input.ageYears'],
  ['{tier} – the tour\'s age rule allows {limit} pro entries at {age} and she has used all {used}. Not locked: a fresh allowance arrives on her next birthday, and the junior and national events stay open.', 'limit', 'limit'],
  [', {0} of them two sessions a day', '0', 'doubled'],
  ['{0} days off', '0', 'daysOff.value'],
  ['{0} sessions is her maximum – untick one to move it.', '0', 'PLAN_MAX_SESSIONS'],
  ['{0} sessions is her minimum – tick another before you take one away.', '0', 'PLAN_MIN_SESSIONS'],
  ['{0} sessions, {1} hours{2} – {3}.{4}', '0', 'sessions.value'],
  ['{0} sessions, {1} hours{2} – {3}.{4}', '1', 'hours.value'],
  ['{0} – {1} of {2} sessions', '2', 'capacity.value'],
  ['· injury risk −{0}% for {1} weeks', '1', 'ECONOMY.vacation.buffWeeks'],
  ['Every price below is {0} sessions a week – more sessions, more money.', '0', 'sessionsNow'],
  ['a week at her current plan – {0} over {1} weeks.', '1', 'billing.billedWeeks'],
  ['locked, {0} ranking points short', '0', 'r.lockedPoints'],
  ['{0} coaches', '0', 'rows.length'],
  ['{0} more trips', '0', 'b.travelJuniorTrips'],
  ['{0} pts short', '0', 'r.lockedPoints'],
  ['{0} trips', '0', 'b.travelTrips'],
  ['{0} years old · B-Day {1}', '0', 'ageYears'],
  ['They supply her {0}, and she enters at least {1} tournaments a season.', '1', 'kitDeal.minEventsPerSeason'],
  ['{0} good weeks', '0', 'rung.goodWeeks'],
  ['Built to order – about {0} months from the week it is ordered.', '0', 'months'],
  ['Built to order – about {0} weeks from the week it is ordered.', '0', 'row.buildWeeks'],
  ['Built to order – about {0} years from the week it is ordered.', '0', 'Math.round(months / 12)'],
  ['Order {0} for {1}? The money goes this week and it arrives in {2} weeks.', '2', 'p.buildWeeks'],
  ['Worth {0} years of what it sells', '0', 'row.earningsMultipleX (Math.round of brandMultipleX)'],
  ['{0} – {1} · {2} pts', '2', 'b.points'],
  ['Junior career – closed at {0}', '0', 'J_MAX_AGE + 1'],
  ['Next drop: {0}, {1} pts – leaves the window in 1 week.', '1', 'w.dropPts'],
  ['Next drop: {0}, {1} pts – leaves the window in {2} weeks.', '1', 'w.dropPts'],
  ['Next drop: {0}, {1} pts – leaves the window in {2} weeks.', '2', 'w.dropInWeeks'],
  ['The Junior Tour is under-{0}, so this table is hers for good – it cannot move again. Her live career is on the Pro tab.', '0', 'J_MAX_AGE + 1'],
  ['Weakest counted: {0} pts – a new result must beat it to raise the total.', '0', 'windowInfo.weakest'],
  ['{0} pts banked. A international ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '0', 'pts'],
  ['{0} pts banked. A international ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '1', 'RANKABLE_MIN.tournaments'],
  ['{0} pts banked. A international ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '2', 'RANKABLE_MIN.points'],
  ['{0} pts banked. A national ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '0', 'pts'],
  ['{0} pts banked. A national ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '1', 'RANKABLE_MIN.tournaments'],
  ['{0} pts banked. A national ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '2', 'RANKABLE_MIN.points'],
  ['{0} pts banked. A professional ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '0', 'pts'],
  ['{0} pts banked. A professional ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '1', 'RANKABLE_MIN.tournaments'],
  ['{0} pts banked. A professional ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.', '2', 'RANKABLE_MIN.points'],
  ['{0} lost finals', '0', 'finals'],
  ['{0} titles', '0', 'titles'],
  ['{0}, {1}: {2} times – {3}', '2', 'cell.count'],
  ['Age {0} – {1}', '1', 'the `to` of cp`Age ${from} – ${to}` (a number)'],
  ['Stopped: {weeks} week below zero – {left} before the money runs out for good.', 'weeks', 'weeks: d.weeks'],
  ['Stopped: {weeks} week below zero – {left} before the money runs out for good.', 'left', 'left'],
  ['Stopped: {weeks} weeks below zero – {left} before the money runs out for good.', 'weeks', 'weeks: d.weeks'],
  ['Stopped: {weeks} weeks below zero – {left} before the money runs out for good.', 'left', 'left'],
  ['Show {n} more levels', 'n', 'n: hidden'],
  ['{n} levels hidden ({from} to {to}) – tap to show the whole ladder', 'n', 'n: hidden (a count)'],
  ['{n} match weeks in a row', 'n', 'n: strain.streakWeeks'],
  ['{ladder} rank down {n} – now #{rank}', 'n', 'n: by = Math.abs(prevRank - rank)'],
  ['{ladder} rank up {n} – now #{rank}', 'n', 'n: by = Math.abs(prevRank - rank)'],
  ['{0} points played', '0', 'pointsPlayed.value'],
  ['Next {weeks} weeks', 'weeks', 'weeks'],
  ['Exams this week – no tournaments, but her {sessions} sessions stand.', 'sessions', 'sessions'],
  ['{sessions} sessions over {days} days – {doubled} of them two sessions a day.', 'sessions', 'sessions: x.sessions'],
  ['{sessions} sessions over {days} days – {doubled} of them two sessions a day.', 'days', 'days: x.trainingDays'],
  ['{sessions} sessions over {days} days – {doubled} of them two sessions a day.', 'doubled', 'doubled: x.doubled'],
  ['{sessions} sessions – {court} on court, {gym} in the gym.', 'sessions', 'sessions: x.sessions'],
  ['1 year spent, {0} left on the scholarship.', '0', 'c.totalYears - c.yearsDone'],
  ['Her country called – {0} of {1} rubbers won, and the nation finished {2}th.', '1', 'c.rubbersPlayed'],
  ['She went out in the {0} – 1 match, {1} wins.', '1', 'wins (a count)'],
  ['She went out in the {0} – {1} matches, 1 win.', '1', 'played (a count)'],
  ['She won it – 1 match, {0} wins.', '0', 'wins'],
  ['She won it – {0} matches, 1 win.', '0', 'played'],
  ['Year {0} of {1} is next – {2} spent', '2', 'c.yearsDone'],
  ['Year {0} of {1} under way – {2} spent', '2', 'c.yearsDone'],
  ['Out with the {0} – {1} week to go.', '1', 'f.injured?.weeksRemaining ?? 1'],
  ['Out with the {0} – {1} weeks to go.', '1', 'f.injured?.weeksRemaining ?? 1'],
]

const pluralPairs = (values: ReadonlyMap<string, string>): Set<string> => {
  const pairs = new Set<string>()
  for (const [key, value] of values) for (const p of [...analyzeMessage(value).plurals, ...analyzeMessage(value).selects]) pairs.add(`${key}\u0000${p.name}`)
  return pairs
}
/** The pairs the values carry that the table does not know – the pure function the mutation arm drives. */
const unfedPlurals = (values: ReadonlyMap<string, string>): string[] => {
  const known = new Set(NUMBER_FED_HOLES.map(([k, h]) => `${k}\u0000${h}`))
  return [...pluralPairs(values)].filter((p) => !known.has(p)).map((p) => p.replace('\u0000', '  { ') + ' …')
}

describe('§3 THE PLURAL HOLES – a plural only stands over a hole the call site hands in as a number', () => {
  it('the wave\'s plural holes are exactly the table: nothing new without a read of its call site, nothing in the table that no row uses any more', () => {
    expect(unfedPlurals(WAVE.keys), 'a plural / select over a hole that is not in NUMBER_FED_HOLES').toEqual([])
    const used = pluralPairs(WAVE.keys)
    const stale = NUMBER_FED_HOLES.filter(([k, h]) => !used.has(`${k}\u0000${h}`)).map(([k, h]) => `${k}  {${h}}`)
    expect(stale, 'table rows whose plural is gone from the value (delete them)').toEqual([])
    expect(NUMBER_FED_HOLES).toHaveLength(90)
  })

  it('every table row names a key of the catalogue and an expression', () => {
    for (const [key, hole, fedBy] of NUMBER_FED_HOLES) {
      expect(CAT.keys[key], key).toBeDefined()
      expect(RU[key], `${key} carries Russian`).toBeDefined()
      expect(hole.length, key).toBeGreaterThan(0)
      expect(fedBy.length, `${key}: the call site's expression is recorded`).toBeGreaterThan(0)
    }
  })
})

// ---- §4 the prose counts ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('§4 THE COUNTS IN RU-21 PART TWO are the documents\' counts', () => {
  const doc = readFileSync(join(ROOT, TABLES_DIR, 'ru-engine-tails-2026-10.md'), 'utf8')
  const part = after(doc, '## Part two – the screens and scripts')
  const stated = [...part.matchAll(/^\| .*?\(`RU21-([A-Z]+)`\) \| \[([^\]]+)\]\([^)]*\) \| (\d+) \|$/gm)].map((m) => ({ fam: m[1]!, file: m[2]!, rows: Number(m[3]) }))

  it('the table has the sixteen families', () => {
    expect(stated.map((s) => s.fam).sort()).toEqual(['ALB', 'CLY', 'DIA', 'DWN', 'ENS', 'FMT', 'HOM', 'MON', 'MTV', 'ONB', 'PRF', 'RET', 'SAV', 'SEA', 'SHL', 'STA'])
  })

  it('each family states the number of its rows in the document it names, and the sum is the 631 the table closes with', () => {
    let sum = 0
    for (const s of stated) {
      const lines = readFileSync(join(ROOT, TABLES_DIR, s.file), 'utf8').split('\n')
      const have = lines.filter((l) => l.startsWith(`| RU21-${s.fam}-`)).length
      expect(have, `${s.fam} in ${s.file}`).toBe(s.rows)
      sum += s.rows
    }
    // 631 → 632 at r50 №1 (12.10): the pregnancy page's alt, RU21-ALB-16 – run-verified
    // 632 → 634 at r50 №5 (12.10): the brand line's two rows, RU21-ENS-13/14 – run-verified
    // 634 → 638 at r53 steps 2 and 3 (21.10, re-aimed 22.10 by N2): RU21-MON-122..125 – the return-week line, the withdrawn-entries line, «Doctor said no», the W card's rung count – run-verified
    expect(sum).toBe(638)
    expect(part).toContain('**638**')
  })
})

// ---- §5 the mutation arms --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 THE ARMS BITE – the nets above are not vacuous', () => {
  it('a plural over a hole outside the table is reported (a stand-in plural on a key of the wave)', () => {
    const [key] = [...WAVE.keys.entries()].find(([, v]) => analyzeMessage(v).plurals.length === 0 && analyzeMessage(v).args.length > 0)!
    const mutated = new Map(WAVE.keys)
    const holes = analyzeMessage(WAVE.keys.get(key)!).args
    mutated.set(key, `{${holes[0]!}, plural, one {a} few {b} many {c} other {d}}`)
    expect(unfedPlurals(mutated)).toHaveLength(1)
    expect(unfedPlurals(new Map(WAVE.keys))).toHaveLength(0)
  })

  it('one more key without a row changes the census', () => {
    const [victim] = Object.keys(RU).filter((k) => WAVE.keys.has(k))
    const dropped = { ...RU }
    delete dropped[victim!]
    expect(withoutRussian(dropped)).toHaveLength(1) /* ⚠ 11.10: the census closed at ZERO when the owner ruled the two held paragraphs */
    expect(withoutRussian(RU)).toHaveLength(0)
  })
})
