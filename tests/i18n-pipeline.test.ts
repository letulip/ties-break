// THE L1b PIPELINE'S UNIT NETS – the extractor, the importer, the gate and the pseudo-locale (spec §4, §6).
//
// Every rule of `npm run i18n:check` is a pure function over plain data, so each is driven here with a
// FABRICATED mutation and watched going red – a gate no test has seen fail is not known to be a gate. The
// real tree is touched in exactly three places: the committed catalog's shape, the glob proof, and the
// importer's first read of his tables (that the two record files are never among them).
//
// ⚠ NO RUSSIAN PRODUCT COPY IS WRITTEN HERE. Fixture Russian is bracketed stand-ins or the owner's own
// APPROVED wording, read back from his rows – never new wording (invariant 4).
//
// ⚠ MUTATION ARMS (watched red; outputs in the wave report):
//   1. `{0}` dropped from a Russian value                 -> `parity` goes red.
//   2. a literal touched in a scratch catalog copy        -> `catalog-stale` goes red.
//   3. a record file handed to the reader                 -> `assertNoRecords` throws / `record-file` goes red.
//   4. an em dash in a Russian value                      -> `em-dash` goes red.
//   5. the `few` branch missing from a plural             -> `plural` goes red.
//   6. a dead APPROVED row                                -> `unmatched` (drift), never compiled.
//   7. `foreign-surface` check removed                    -> «Stats» joins the screen heading and the trap test goes red.
//   8. `normKey` back to the consumed-leader regexp       -> `{n}{letter}` stays a leftover and `{0}` stays text: 11.10 arms 1 and 2 go red.
//   9. the pending class off / its DRAFT test dropped / «blank» widened to any null cell -> 11.10 arm 3 goes red (three separate mutations, each watched).
//  10. (11.10, the corpus joiner) the album voice looked up by POSITION instead of by name / a gift resolved by id alone, across bands / a missing coordinate answered with its
//      neighbour instead of an orphan -> the coordinate, orphan and independent-oracle arms of «the corpus joiner» go red (each watched; the three outputs are in the commit's report).
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { globSync } from 'tinyglobby'
import { analyzeMessage, splitContext } from '../src/shared/i18n'
import { normKey } from '../tools/copy-text'
import { callKeys, callStats, certain, dynamicSites, likely, scanTs, scanVue } from '../tools/copy-census-walk'
import { catalogImportsInSrc, lintCatalogKeys, lintRu, requiredPluralCategories, runGate } from '../tools/i18n-check'
import { buildCatalog, CATALOG_PATH, diffCatalogs, keyFromCensusText, parseCatalog, readCatalogText, seenLiterals, serializeCatalog } from '../tools/i18n-extract'
import type { Catalog } from '../tools/i18n-extract'
import {
  adaptPlaceholders,
  applyLanded,
  assertNoRecords,
  compile,
  indexCatalog,
  listDocs,
  literalOf,
  parseTables,
  planLanded,
  readRows,
  RECORD_FILES,
  serializeRu,
  splitRow,
  TABLES_DIR as TABLES_DIR_REAL,
} from '../tools/i18n-import'
import type { Live } from '../tools/i18n-import'
import { buildPseudoCatalog, expandText, pseudoLocalize } from '../tools/i18n-pseudoloc'
import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { BIRTHDAY_BANDS } from '../src/engine/world/birthday'
import { MOTHERHOOD_WORDS, VOICE_LINES } from '../src/engine/diary/weekNotes'
import {
  bandOfHeading,
  CORPUS_DOCS,
  englishFor,
  HOMES,
  joinCorpora,
  liveCorpora,
  liveStrings,
  numberWord,
  parseAlbumDoc,
  parseGiftsDoc,
  parseWeekNotesDoc,
  readAllRows,
  renderCorpusReport,
} from '../tools/i18n-corpus-join'
import type { Corpora } from '../tools/i18n-corpus-join'

const scratch: string[] = []
function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tb-i18n-'))
  scratch.push(dir)
  return dir
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true })
})

function catalogOf(keys: Record<string, { home: string[]; wrapped?: true }>): Catalog {
  const out: Catalog['keys'] = {}
  for (const [k, v] of Object.entries(keys)) out[k] = { area: ['screens'], ...v }
  return { format: 1, count: Object.keys(out).length, keys: out }
}
const fixtureCatalog = catalogOf({
  'Tennis & trips': { home: ['src/components/EndingScreen.vue'] },
  Stats: { home: ['src/components/screens/StatsScreen.vue'] },
  'Ties Break': { home: ['src/components/SplashScreen.vue', 'src/components/screens/MoreScreen.vue'] },
  'Week {0} of {1}': { home: ['src/components/HerWeekTab.vue'] },
  'Centre Court': { home: ['src/engine/world/venues.ts'] },
})
const live = (seen: string[] = []): Live => ({ catalog: fixtureCatalog, seen: new Set(seen.map(normKey)) })

const TABLE = (...rows: string[]): string => ['| id | source | English | Russian | note |', '| --- | --- | --- | --- | --- |', ...rows].join('\n')
const rowsOf = (table: string) => parseTables('fixture.md', table).rows

// =================================================================================================
// THE PARSER – his tables are data, and ambiguity goes to the report
// =================================================================================================

describe('the table parser reads cells conservatively', () => {
  it('splits on unescaped pipes only, and trims the edges', () => {
    expect(splitRow('| a | `x \\| y` | c |')).toEqual(['a', '`x \\| y`', 'c'])
  })

  it('a literal is ONE backticked span (an annotation may follow) or plain text – anything else is null', () => {
    expect(literalOf('`Close`').text).toBe('Close')
    expect(literalOf('`Which settings` (tab group name)').text).toBe('Which settings')
    expect(literalOf('`Новая история` · `APPROVED` 07.10').text).toBe('Новая история')
    expect(literalOf('Aboard').text).toBe('Aboard')
    expect(literalOf('`Play` / `Sound, animations`').text, 'two spans are not one literal').toBeNull()
    expect(literalOf('`Stats` screen / navigation').text, 'a description around a span is not a literal').toBeNull()
    expect(literalOf('').text).toBeNull()
  })

  it('finds the English and Russian columns by header, in every shape the tables use', () => {
    const idSource = rowsOf(TABLE('| R1 | `src/App.vue:353` | `Home` | `Дом` | note |'))
    expect(idSource[0]).toMatchObject({ english: 'Home', russian: 'Дом', hint: 'src/App.vue' })

    const pairs = rowsOf(['| English | Russian | English | Russian |', '| --- | --- | --- | --- |', '| Aboard | На борту | Ashore | На берегу |'].join('\n'))
    expect(pairs.map((r) => [r.english, r.russian])).toEqual([['Aboard', 'На борту'], ['Ashore', 'На берегу']])

    const sourceOnly = rowsOf(['| source | Russian draft |', '| --- | --- |', '| `one year ago` | `год назад` |'].join('\n'))
    expect(sourceOnly[0]).toMatchObject({ english: 'one year ago', russian: 'год назад' })

    const cyrillic = rowsOf(['| English | Русский черновик |', '| --- | --- |', '| `Back` | `Назад` |'].join('\n'))
    expect(cyrillic[0]).toMatchObject({ english: 'Back', russian: 'Назад' })
  })

  it('a glossary and a table with no English column are counted, not read as replacements', () => {
    const glossary = parseTables('g.md', ['| English concept | Preferred Russian | Notes |', '| --- | --- | --- |', '| Home | `Дом` | `APPROVED`; section name |'].join('\n'))
    expect(glossary.rows).toHaveLength(0)
    expect(glossary.stats).toMatchObject({ glossary: 1, replacement: 0 })
    expect(glossary.stats.skippedStatus, 'the APPROVED token inside it is SHOWN, not dropped').toHaveLength(1)

    const noEnglish = parseTables('n.md', ['| field | Russian draft |', '| --- | --- |', '| intro | `Привет` |'].join('\n'))
    expect(noEnglish.rows).toHaveLength(0)
    expect(noEnglish.stats).toMatchObject({ noEnglish: 1, unclassifiedRows: 1 })

    const malformed = parseTables('m.md', TABLE('| R1 | `a` | `B` |'))
    expect(malformed.stats.malformedRows).toBe(1)
  })

  it('a row is APPROVED only when a backticked token says so – in the status column, a note, or after the Russian', () => {
    const status = rowsOf(['| id | English | Russian | status |', '| --- | --- | --- | --- |', '| R1 | `Home` | `Дом` | `APPROVED` |'].join('\n'))
    expect(status[0]?.status).toBe('APPROVED')
    const note = rowsOf(TABLE('| R1 | `src/A.vue:1` | `Wealthy` | `Обеспеченная семья` | `APPROVED` 07.10 (spec) |'))
    expect(note[0]?.status).toBe('APPROVED')
    const inline = rowsOf(['| surface | English | Russian draft |', '| --- | --- | --- |', '| x | `Dynasty` | `Династия` · `APPROVED` 08.10 (his pick) |'].join('\n'))
    expect(inline[0]).toMatchObject({ status: 'APPROVED', russian: 'Династия' })
    const quiet = rowsOf(TABLE('| R1 | `src/A.vue:1` | `Back` | `Назад` | the owner approved this in chat |'))
    expect(quiet[0]?.status, 'prose is not a status').toBe('DRAFT')
    const both = rowsOf(TABLE('| R1 | `src/A.vue:1` | `Back` | `Назад` | `DRAFT` then `APPROVED` |'))
    expect(both[0]?.status, 'two tokens on one row is AMBIGUOUS, and ambiguous goes to the report').toBe('AMBIGUOUS')
  })

  it('a ruled-Latin row is Russian == English with the §9.5 / Latin mark; the same equality unmarked is not ruled', () => {
    const ruled = rowsOf(['| English | Russian | note |', '| --- | --- | --- |', '| `Centre Court` | `Centre Court` | reverted to source 07.10 (§9.5) |', '| `Plain` | `Plain` | nothing |'].join('\n'))
    expect(ruled.map((r) => r.ruledLatin)).toEqual([true, false])
  })
})

// =================================================================================================
// THE JOIN AND THE DISPOSITIONS
// =================================================================================================

describe('compile – English joins, the location breaks ties, and APPROVED/LANDED always compile (DRAFT only under the 11.10 blanket, QUESTION never)', () => {
  it('an APPROVED row on a live key compiles; DRAFT and QUESTION never do (the per-row читка regime – `--approved-only`)', () => {
    const rows = rowsOf(
      TABLE(
        '| R1 | | `Tennis & trips` | `Теннис и поездки` | `APPROVED` 08.10 |',
        '| R2 | | `Tennis & trips` | `другое` | |',
        '| R3 | | `Tennis & trips` | `ещё` | `QUESTION` |',
      ),
    )
    // ⭐ RE-AIMED 11.10 (the blanket ruling): the law below is the читка regime, so the arm names it – the default compile now takes DRAFT rows too (next arm)
    const out = compile(rows, live(), { includeDrafts: false })
    expect([...out.entries]).toEqual([['Tennis & trips', 'Теннис и поездки']])
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['compiled', 'pending', 'pending'])
  })

  it('⭐ THE BLANKET (owner 11.10, «всё должно быть переведено, кроме имён и названий»): by default a DRAFT row compiles as written, a QUESTION row still never does, and two rows that disagree are a conflict', () => {
    const draft = rowsOf(TABLE('| R2 | | `Tennis & trips` | `другое` | |', '| R3 | | `Tennis & trips` | `ещё` | `QUESTION` |'))
    const out = compile(draft, live())
    expect([...out.entries]).toEqual([['Tennis & trips', 'другое']])
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['compiled', 'pending'])
    // an APPROVED row and a DRAFT row on one key that disagree compile NOTHING and say so (neither is more right) – the same law as before, now reachable by a DRAFT
    const clash = rowsOf(TABLE('| R1 | | `Tennis & trips` | `Теннис и поездки` | `APPROVED` 08.10 |', '| R2 | | `Tennis & trips` | `другое` | |'))
    const c = compile(clash, live())
    expect([...c.entries]).toEqual([])
    expect(c.outcomes.map((o) => o.disposition)).toEqual(['conflict', 'conflict'])
  })

  it('⚠ THE TRAP: «Stats» is live only as a screen heading, so the nav row (App.vue) is foreign-surface, not joined', () => {
    const nav = compile(rowsOf(TABLE('| RU01-N04 | `src/App.vue:353` | `Stats` | `Рейтинг` | `APPROVED` |')), live(['Stats']))
    expect(nav.entries.size, 'joining by text alone would attach the nav ruling to the heading').toBe(0)
    expect(nav.outcomes[0]).toMatchObject({ disposition: 'foreign-surface' })
    expect(nav.outcomes[0]?.why).toContain('StatsScreen.vue')
    const heading = compile(rowsOf(TABLE('| RU07-1 | `src/components/screens/StatsScreen.vue:9` | `Stats` | `Статистика` | `APPROVED` |')), live())
    expect([...heading.entries]).toEqual([['Stats', 'Статистика']])
  })

  it('two keys behind one English (a context tag) are picked apart by the hint, else reported as needing a tag', () => {
    const tagged = catalogOf({ 'nav|Stats': { home: ['src/App.vue'] }, 'heading|Stats': { home: ['src/components/screens/StatsScreen.vue'] } })
    const lv: Live = { catalog: tagged, seen: new Set() }
    const withHint = compile(rowsOf(TABLE('| R | `src/App.vue:353` | `Stats` | `Рейтинг` | `APPROVED` |')), lv)
    expect([...withHint.entries]).toEqual([['nav|Stats', 'Рейтинг']])
    const noHint = compile(rowsOf(TABLE('| R | | `Stats` | `Рейтинг` | `APPROVED` |')), lv)
    expect(noHint.entries.size).toBe(0)
    expect(noHint.outcomes[0]).toMatchObject({ disposition: 'ambiguous-key' })
    expect(noHint.outcomes[0]?.why).toContain('needs a context tag')
  })

  it('⭐ 10.10 – a row NAMES a tagged key outright (`undo\\|Cancel`): the exact key joins, an unknown tagged name is drift, the text pool is never consulted', () => {
    // The first chat-ok batch wrote `undo|Cancel` and the join read it as a literal nobody asks for:
    // the index strips the tag, the row side did not, and a hint cannot split two keys in one file.
    const tagged = catalogOf({ Cancel: { home: ['src/components/ConfirmDialog.vue'] }, 'undo|Cancel': { home: ['src/components/screens/SeasonScreen.vue'] } })
    const lv: Live = { catalog: tagged, seen: new Set() }
    const named = compile(rowsOf(TABLE('| R | | `undo\\|Cancel` | `Отменить` | `APPROVED` |')), lv)
    expect([...named.entries]).toEqual([['undo|Cancel', 'Отменить']])
    const unknown = compile(rowsOf(TABLE('| R | | `undo\\|Nothing` | `нет такого` | `APPROVED` |')), lv)
    expect(unknown.entries.size).toBe(0)
    expect(unknown.outcomes[0]).toMatchObject({ disposition: 'unmatched' })
  })

  it('⭐ 10.10 – a hint may ride an annotation: a three-column table cannot grow a hint cell without tripping the malformed-row rule', () => {
    const tagged = catalogOf({ 'nav|Stats': { home: ['src/App.vue'] }, 'heading|Stats': { home: ['src/components/screens/StatsScreen.vue'] } })
    const lv: Live = { catalog: tagged, seen: new Set() }
    const annotated = compile(rowsOf(['| English | Russian |', '| --- | --- |', '| `Stats` (`src/App.vue`) | `Рейтинг` · `APPROVED` |'].join('\n')), lv)
    expect([...annotated.entries]).toEqual([['nav|Stats', 'Рейтинг']])
    const widened = rowsOf(['| English | Russian |', '| --- | --- |', '| `Stats` | `Рейтинг` · `APPROVED` | `src/App.vue` |'].join('\n'))
    expect(widened, 'the extra cell is the malformed-row rule, and it skips the row whole').toEqual([])
  })

  it('⚠ DRIFT IS VISIBLE: a dead APPROVED row is `unmatched`; one whose literal is live in source is `waiting`', () => {
    const rows = rowsOf(TABLE('| R1 | | `This sentence is nowhere` | `Нигде` | `APPROVED` |', '| R2 | | `Dynasty` | `Династия` | `APPROVED` |'))
    const out = compile(rows, live(['Dynasty']))
    expect(out.entries.size).toBe(0)
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['unmatched', 'waiting'])
  })

  it('identity rows: a ruled-Latin name compiles when a key asks for it and is exempt (never drift) when none does', () => {
    const rows = rowsOf(
      ['| English | Russian | note |', '| --- | --- | --- |', '| `Centre Court` | `Centre Court` | (§9.5) |', '| `Larkfield Tennis` | `Larkfield Tennis` | Latin by §9.5 |', '| `Ties Break` | `Ties Break` | `APPROVED` product mark |'].join('\n'),
    )
    const out = compile(rows, live())
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['compiled', 'exempt-latin', 'compiled'])
    expect(out.prov.get('Centre Court')?.identity).toBe(true)
    expect(out.prov.get('Ties Break')?.identity).toBe(true)
    expect(out.outcomes.filter((o) => o.disposition === 'unmatched')).toHaveLength(0)
  })

  it('two approved rows that disagree on one key compile to nothing and are both reported', () => {
    const rows = rowsOf(TABLE('| R1 | | `Tennis & trips` | `Раз` | `APPROVED` |', '| R2 | | `Tennis & trips` | `Два` | `APPROVED` |'))
    const out = compile(rows, live())
    expect(out.entries.size).toBe(0)
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['conflict', 'conflict'])
  })

  it('the same English on several files is flagged (a report, never a failure)', () => {
    const out = compile(rowsOf(TABLE('| R | `src/components/SplashScreen.vue:35` | `Ties Break` | `Ties Break` | `APPROVED` |')), live())
    expect(out.outcomes[0]).toMatchObject({ disposition: 'compiled' })
    expect(out.outcomes[0]?.multiSurface).toEqual(['src/components/SplashScreen.vue', 'src/components/screens/MoreScreen.vue'])
  })

  it('his placeholders become the key\'s by position, and a Russian that invents or drops one is caught', () => {
    expect(adaptPlaceholders('Week {n} of {total}', 'Неделя {n} из {total}', 'Week {0} of {1}')).toEqual({ value: 'Неделя {0} из {1}' })
    expect(adaptPlaceholders('Week *N* of *M*', 'Неделя *M* из *N*', 'Week {0} of {1}')).toEqual({ value: 'Неделя {1} из {0}' })
    expect(adaptPlaceholders('{n} weeks', '{n, plural, one{# неделя} few{# недели} many{# недель} other{# недели}}', '{0} weeks')).toEqual({
      value: '{0, plural, one{# неделя} few{# недели} many{# недель} other{# недели}}',
    })
    expect(adaptPlaceholders('Week {n}', 'Неделя {x}', 'Week {0}')).toHaveProperty('error')
    expect(adaptPlaceholders('Week {n}', 'Неделя', 'Week {0} of {1}')).toHaveProperty('error')
  })

  it('serializes sorted, one entry per line, and an empty set as {}', () => {
    expect(serializeRu(new Map([['b', 'Б'], ['a', 'А']]))).toBe('{\n  "a": "А",\n  "b": "Б"\n}\n')
    expect(serializeRu(new Map())).toBe('{}\n')
  })
})

// =================================================================================================
// THE RECORD FILES – never read
// =================================================================================================

describe('⚠ the two record files are skipped, and a record that sneaks in goes red', () => {
  // ⚠ NAMED HERE, NOT READ BACK FROM `RECORD_FILES`: a loop over the importer's own list is vacuous the moment
  // that list is emptied (the first version of this block stayed green with the list emptied – found by
  // mutating the product code). These are the spec's §4 names, and they must be real files.
  const RECORDS = ['ru-main-delta-2-2026-10.md', 'ru-family-voice-pass-2026-10.md']

  it('the importer\'s skip list IS those two files, they exist, and its file list holds neither and holds the rest', () => {
    expect([...RECORD_FILES].sort()).toEqual([...RECORDS].sort())
    for (const r of RECORDS) expect(existsSync(join('docs/localization', r)), `${r} must exist under that name`).toBe(true)
    const docs = listDocs()
    for (const r of RECORDS) expect(docs, r).not.toContain(r)
    expect(docs.length).toBeGreaterThan(50)
    expect(docs).toContain('ru-ui-shell-2026-09.md')
  })

  it('MUTATION: handing a record file to the reader throws, by bare name or by path', () => {
    for (const r of RECORDS) {
      expect(() => readRows([r])).toThrow(/record file/)
      expect(() => assertNoRecords([`docs/localization/${r}`])).toThrow(/record file/)
    }
  })

  it('MUTATION: a tables directory missing a record file by its name makes the gate red (a rename must not turn the skip off)', () => {
    const empty = tmp()
    const { problems } = runGate({ tablesDir: empty })
    expect(problems.filter((p) => p.rule === 'record-file').map((p) => p.where).sort()).toEqual([...RECORDS].sort())
  })
})

// =================================================================================================
// --mark-landed, on a scratch copy
// =================================================================================================

describe('--mark-landed flips APPROVED -> LANDED only for rows that are wired AND carried by ru.json', () => {
  const body = TABLE(
    '| R1 | `src/components/EndingScreen.vue:1` | `Tennis & trips` | `Теннис и поездки` | `APPROVED` 08.10 |',
    '| R2 | `src/components/SplashScreen.vue:1` | `Ties Break` | `Ties Break` | `APPROVED` product mark |',
    '| R3 | `src/components/screens/StatsScreen.vue:1` | `Stats` | `Статистика` | |',
  )
  const wiredCatalog = catalogOf({
    'Tennis & trips': { home: ['src/components/EndingScreen.vue'], wrapped: true },
    'Ties Break': { home: ['src/components/SplashScreen.vue'] },
    Stats: { home: ['src/components/screens/StatsScreen.vue'] },
  })

  it('flips the wired row, leaves the unwired APPROVED and the DRAFT alone, and is idempotent', () => {
    const dir = tmp()
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${body}\n`)
    const lv: Live = { catalog: wiredCatalog, seen: new Set() }
    const read = () => readRows(['ru-fixture-2026-10.md'], dir).rows
    const ru = { 'Tennis & trips': 'Теннис и поездки', 'Ties Break': 'Ties Break' }

    const plan = planLanded(compile(read(), lv), lv, ru, dir)
    expect(plan.changes).toHaveLength(1)
    expect(plan.changes[0]?.before).toContain('`APPROVED` 08.10')
    expect(plan.changes[0]?.after).toContain('`LANDED` 08.10')
    expect(plan.skipped.join('\n')).toContain('«Ties Break» – no call site asks for the key yet')

    applyLanded(plan.changes, dir)
    const after = readFileSync(join(dir, 'ru-fixture-2026-10.md'), 'utf8')
    expect(after).toContain('`LANDED` 08.10')
    expect(after).toContain('`APPROVED` product mark')
    expect(after.split('\n').filter((l) => l.includes('Статистика'))[0]).not.toMatch(/LANDED|APPROVED/)

    const again = planLanded(compile(read(), lv), lv, ru, dir)
    expect(again.changes, 'a LANDED row is not flipped twice').toHaveLength(0)
  })

  it('a row ru.json does not carry is skipped, whatever the catalog says', () => {
    const dir = tmp()
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${body}\n`)
    const lv: Live = { catalog: wiredCatalog, seen: new Set() }
    const rows = readRows(['ru-fixture-2026-10.md'], dir).rows
    const plan = planLanded(compile(rows, lv), lv, {}, dir)
    expect(plan.changes).toHaveLength(0)
    expect(plan.skipped.join('\n')).toContain('ru.json does not carry this row')
  })
})

// =================================================================================================
// THE GATE'S RULES, EACH WATCHED RED
// =================================================================================================

describe('lintRu – the rules of npm run i18n:check, each driven by a fabricated mutation', () => {
  const catalog = catalogOf({
    'Week {0} of {1}': { home: ['a.vue'] },
    '{0} weeks': { home: ['a.vue'] },
    Close: { home: ['a.vue'] },
  })
  const rules = (ru: Record<string, string>) => lintRu(ru, catalog).map((p) => p.rule)
  const PLURAL = '{0, plural, one{# неделя} few{# недели} many{# недель} other{# недели}}'

  it('a clean file is clean (the control: every red below is the mutation, not the fixture)', () => {
    expect(rules({ 'Week {0} of {1}': 'Неделя {0} из {1}', '{0} weeks': PLURAL, Close: 'Закрыть' })).toEqual([])
  })

  it('MUTATION 1: a dropped {0} is parity red; an invented {2} is parity red', () => {
    expect(rules({ 'Week {0} of {1}': 'Неделя {1}' })).toEqual(['parity'])
    expect(rules({ 'Week {0} of {1}': 'Неделя {0} из {1} и {2}' })).toEqual(['parity'])
  })

  it('MUTATION 4: an em dash in a Russian value is red', () => {
    expect(rules({ Close: 'Закрыть — всё' })).toEqual(['em-dash'])
  })

  it('MUTATION 5: a plural missing `few` is red, and the message names the category', () => {
    const lacking = '{0, plural, one{# неделя} many{# недель} other{# недели}}'
    expect(rules({ '{0} weeks': lacking })).toEqual(['plural'])
    expect(lintRu({ '{0} weeks': lacking }, catalog)[0]?.detail).toContain('few')
  })

  it('an orphan (a key the catalog does not hold) and a syntax error are red', () => {
    expect(rules({ 'Not a key': 'x' })).toEqual(['orphan'])
    expect(rules({ Close: 'Закрыть {' })).toEqual(['icu'])
    expect(rules({ Close: '{0, plural, one{x}}' })).toEqual(['icu'])
  })

  it('Russian requires one, few, many and other', () => {
    expect(requiredPluralCategories('ru')).toEqual(['few', 'many', 'one', 'other'])
  })

  it('a catalog key that does not format is a source bug and red', () => {
    expect(lintCatalogKeys(catalogOf({ 'fine {0}': { home: ['a.vue'] }, 'broken }': { home: ['a.vue'] } })).map((p) => p.where)).toEqual(['broken }'])
  })
})

describe('the gate, end to end on scratch copies of the shipped files', () => {
  it('MUTATION 2: a literal touched in a catalog copy without regenerating makes catalog-stale red', () => {
    const dir = tmp()
    const original = readCatalogText()!
    expect(original).toContain('"Choose your language"')
    writeFileSync(join(dir, 'catalog.en.json'), original.replace('"Choose your language"', '"Choose your language now"'))
    const { problems } = runGate({ catalogPath: join(dir, 'catalog.en.json') })
    const stale = problems.find((p) => p.rule === 'catalog-stale')
    expect(stale, 'a reworded literal must not pass').toBeTruthy()
    expect(stale?.detail).toMatch(/\+1 added, -1 removed/)
  })

  it('the control: an untouched copy of the shipped catalog and ru.json passes every rule', () => {
    const dir = tmp()
    writeFileSync(join(dir, 'catalog.en.json'), readCatalogText()!)
    writeFileSync(join(dir, 'ru.json'), readFileSync('src/i18n/ru.json', 'utf8'))
    expect(runGate({ catalogPath: join(dir, 'catalog.en.json'), ruPath: join(dir, 'ru.json') }).problems).toEqual([])
  })

  it('MUTATION 4 through the gate: an em dash edited into a copy of ru.json is red, and so is the staleness', () => {
    const dir = tmp()
    const ru = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
    const first = Object.keys(ru)[0]!
    ru[first] = `${ru[first]} —`
    writeFileSync(join(dir, 'ru.json'), `${JSON.stringify(ru, null, 2)}\n`)
    const rules = runGate({ ruPath: join(dir, 'ru.json') }).problems.map((p) => p.rule)
    expect(rules).toContain('em-dash')
    expect(rules).toContain('ru-stale')
  })

  it('MUTATION 6 through the gate: a dead APPROVED row in his tables is reported and compiles to nothing', () => {
    const dir = tmp()
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${TABLE('| R1 | | `A sentence that is nowhere in the game` | `Нигде` | `APPROVED` |')}\n`)
    for (const r of RECORD_FILES) writeFileSync(join(dir, r), '# record\n')
    const rows = readRows(listDocs(dir), dir).rows
    const out = compile(rows, { catalog: parseCatalog(readCatalogText()!), seen: new Set() })
    expect(out.outcomes[0]).toMatchObject({ disposition: 'unmatched' })
    expect(out.entries.size).toBe(0)
  })
})

// =================================================================================================
// ⭐ THE CORPUS JOINER (11.10) – his COORDINATE tables (album, gifts, the week-note grid) carry no English column; the live corpus answers
// with the English at each coordinate, and the pair rides the importer's own compile.
// =================================================================================================
//
// ⚠ THE FIXTURES ARE MINIATURES. The corpora below are four-line stand-ins with the REAL shapes (voices, bands, stages, an `unlicensed` arm), the documents are the
// real documents' tables in miniature, and the Russian is bracketed stand-ins – no product copy is written here. What is read from the real tree (last arm) is read back from
// the real documents by an ORACLE THAT IS NOT THE JOINER (a plain line split), so «the joiner agrees with itself» cannot pass for «it joined the right cell».
// ⚠ THIS BLOCK SITS BEFORE «THE CATALOG» ON PURPOSE. The 08.10 twin-key case further down scans a fake `fixtures/twin.vue` into the walker's process-wide state, and any gate run on the
// shipped catalog AFTER it reads `Step {step} of {count}` as drifted (a second home) – measured 11.10 when this block first sat at the foot of the file. Order is the whole fix.
describe('the corpus joiner – coordinates join by position, orphans are named, conflicts refuse, empty cells wait', () => {
  const MINI: Corpora = {
    album: {
      occasions: [
        {
          id: 'first-court',
          // ⚠ the live order is the REVERSE of the document's (deep, sunny against his sunny, deep) on purpose: a join by position would cross them, a join by name cannot
          voices: {
            deep: { note: 'She stood at the fence.', caption: 'She watched.', line: 'She watched first.' },
            sunny: { note: 'First day on court.', caption: 'She asked.', line: 'Can I?' },
          },
        },
      ],
      arc: { open: { sunny: { note: 'Easy to talk to.', line: 'Not all of her.' } } },
    },
    gifts: {
      day: { id: 'day', label: 'Just the day', note: 'No present.', again: 'Same again.', ask: 'One day only.', short: 'the day' },
      bands: [
        { from: 0, to: 14, gifts: [{ id: 'bicycle', label: 'A bicycle', note: 'For school.', again: 'We gave one.', ask: 'On her list.', short: 'the bicycle' }] },
        {
          from: 22,
          to: 28,
          gifts: [{ id: 'neverbuy', label: 'A painting', note: 'She has the money.', again: 'One already hangs.', ask: 'A photo at midnight.', short: 'the painting', unlicensed: { note: 'She stands at that window.' } }],
        },
      ],
      college: { from: 0, to: 99, gifts: [] },
    },
    weekNotes: {
      staged: { sunny: { grind: { school: 'Hard week.', college: 'Called between lectures.' }, freshBody: { school: 'I feel good.' } } },
      exams: { sunny: 'Papers first.' },
      birthday: { sunny: { school: '{0} today. Save me the corner piece.' } },
      offSeason: { sunny: { college: 'No matches for a while.' } },
      motherhood: { sunny: { announced: 'Still in her coat.', birth: 'We are all here.' } },
      bereaved: { sunny: 'She rang more often.' },
      divorced: { sunny: 'She rang about the court.' },
      fork: { sunny: { with: 'She thanked us.', against: 'She said fine.' } },
    },
  }

  const miniCatalog = (): Catalog => {
    const keys: Record<string, { home: string[]; wrapped?: true }> = {}
    const ls = liveStrings(MINI)
    for (const k of ls.album) keys[k] = { home: [HOMES.album], wrapped: true }
    for (const k of ls.gifts) keys[k] = { home: [HOMES.gifts], wrapped: true }
    for (const k of ls['week-notes']) keys[k] = { home: [HOMES.weekNotes], wrapped: true }
    keys['Best ranking: #{0}'] = { home: [HOMES.albumFacts], wrapped: true }
    return catalogOf(keys)
  }
  const miniLive = (extraCatalog: Catalog = miniCatalog()): Live => ({ catalog: extraCatalog, seen: new Set(['the day', 'the bicycle', 'the painting'].map(normKey)) })

  const T = (header: string, ...rows: string[]): string[] => [header, header.replace(/[^|]+/g, ' --- '), ...rows, '']
  const ALBUM_DOC = [
    '# fixture album', '',
    '### A1 · `first-court` · first time on court', '',
    ...T('| voice | note | caption | line |', '| `sunny` | `[ru] sunny note` | `[ru] sunny caption` | `[ru] sunny line` |', '| `deep` | `[ru] deep note` | `[ru] deep caption` | |'),
    '### A9 · `ghost` · an occasion the live corpus does not have', '',
    ...T('| voice | note | caption | line |', '| `sunny` | `[ru] ghost note` | `[ru] ghost caption` | `[ru] ghost line` |'),
    '### Arc towards `open`', '',
    ...T('| birth voice | note | line |', '| `sunny` | `[ru] arc note` | `[ru] arc line` |'),
    '### A34 · `the-line` · facts', '',
    ...T('| source fact | Russian line |', "| mother's full name | localized name display order; never parse the finished English name |", '| `Best ranking: #{rank}` | `[ru] Best №{rank}` |'),
    '## 3. Voice key', '',
    ...T('| runtime voice | Russian editorial cue |', '| `sunny` | movement |'),
  ].join('\n')

  const GIFTS_DOC = [
    '## 2. Shared non-object option', '', '### `day` – from age sixteen', '',
    ...T('| field | Russian draft |', '| label | `[ru] day label` |', '| short | `[ru] day short` |', '| event | `[ru] day event` |'),
    '## 3. Through fourteen', '', '### `bicycle`', '',
    ...T('| field | Russian draft |', '| label | `[ru] bike label` |', '| note | `[ru] bike note` |', '| event | `[ru] bike event` |'),
    '## 10. Ages twenty-two to twenty-eight', '', '### `neverbuy`', '',
    ...T('| field | licensed/plenty | unlicensed means |', '| label | `[ru] nb label` | same |', '| note | `[ru] nb note` | `[ru] nb note unlicensed` |', '| ask | `[ru] nb ask` | `[ru] nb ask unlicensed` |'),
    '## 7. Age eighteen – the threshold', '', '### `bankcard`', '',
    ...T('| field | Russian draft |', '| label | `[ru] bank label` |'),
  ].join('\n')

  const WEEKS_DOC = [
    '## 2. Sunny voice – rectangular moments', '',
    ...T('| moment | school | college |', '| grind | `[ru] grind school` | `[ru] grind college` |', '| fresh body | `[ru] fresh school` | `[ru] fresh college` |'),
    '## 3. Sunny voice – scoped moments', '',
    ...T('| moment/stage | Russian draft |', '| exams, school | `[ru] exams` |', '| birthday, school | `[ru] {N} today, save me a piece` |', '| off-season, college | `[ru] off-season` |'),
    '## 12. Motherhood voice layer', '',
    ...T('| voice | announced | birth |', '| sunny | `[ru] announced` | `[ru] birth` |'),
    '## 13. Bereavement and divorce', '',
    ...T('| state | sunny |', '| bereaved | `[ru] bereaved` |', '| divorced | `[ru] divorced` |'),
    '## 14. Fork aftermath', '',
    ...T('| voice | parent went with her want | parent went against her want |', '| sunny | `[ru] with` | `[ru] against` |'),
    '## 11. Core-matrix completion ledger', '',
    ...T('| voice | rectangular cells | total |', '| sunny | 32 | 37 |'),
  ].join('\n')

  /** A scratch tables directory holding the given corpus documents under their real names. */
  function docsDir(docs: Partial<Record<'album' | 'gifts' | 'week-notes', string>> = { album: ALBUM_DOC, gifts: GIFTS_DOC, 'week-notes': WEEKS_DOC }): string {
    const dir = tmp()
    for (const [family, text] of Object.entries(docs)) writeFileSync(join(dir, CORPUS_DOCS[family as keyof typeof CORPUS_DOCS]), `${text}\n`)
    return dir
  }
  const joined = (corpora: Corpora = MINI, docs?: Partial<Record<'album' | 'gifts' | 'week-notes', string>>) => {
    const dir = docsDir(docs)
    const j = joinCorpora(listDocs(dir), dir, corpora)
    return { j, c: compile(j.rows, miniLive()) }
  }

  it('the parser reads a coordinate from the heading, the row label and the column header – nothing is counted by position in the file', () => {
    const album = parseAlbumDoc('a.md', ALBUM_DOC)
    expect(album.cells.map((c) => c.coord)).toContain('A1 first-court · deep · caption')
    expect(album.cells.map((c) => c.coord)).toContain('arc open · sunny · line')
    expect(album.tables, 'two voice tables + the arc table + the fact table are read; the voice key is left alone').toBe(4)
    expect(album.ignored).toBe(1)
    const gifts = parseGiftsDoc('g.md', GIFTS_DOC)
    expect(gifts.cells.map((c) => c.coord)).toContain('gift neverbuy [Ages twenty-two to twenty-eight] · unlicensed note')
    const weeks = parseWeekNotesDoc('w.md', WEEKS_DOC, MINI)
    expect(weeks.cells.map((c) => c.coord)).toEqual(expect.arrayContaining(['sunny · fresh body · college', 'sunny · exams · school', 'motherhood sunny · birth', 'bereaved · sunny', 'fork sunny · against']))
    expect(weeks.ignored, 'the completion ledger shares a header cell with the motherhood table and is NOT one').toBe(1)
    expect(numberWord('twenty-two')).toBe(22)
    expect(numberWord('fourteen')).toBe(14)
    expect(numberWord('purple')).toBeNull()
    expect(bandOfHeading('9. Ages nineteen to twenty-one')).toEqual({ kind: 'range', from: 19, to: 21 })
    expect(bandOfHeading('11. Age twenty-nine and later')).toEqual({ kind: 'range', from: 29, to: 'open' })
    expect(bandOfHeading('3. Through fourteen')).toEqual({ kind: 'range', from: 0, to: 14 })
    expect(bandOfHeading('12. College birthday band')).toEqual({ kind: 'college' })
    expect(bandOfHeading('8. Verification through eighteen')).toBeNull()
  })

  it('each cell joins to the English AT ITS COORDINATE, and compile writes his words verbatim – by voice NAME, not by the order of his rows', () => {
    const { j, c } = joined()
    // the doc lists sunny before deep; the live corpus is keyed by name, so a reordering on either side cannot cross them
    expect(c.entries.get('First day on court.')).toBe('[ru] sunny note')
    expect(c.entries.get('She stood at the fence.')).toBe('[ru] deep note')
    expect(c.entries.get('She watched.')).toBe('[ru] deep caption')
    expect(c.entries.get('Easy to talk to.')).toBe('[ru] arc note')
    expect(c.entries.get('Not all of her.')).toBe('[ru] arc line')
    expect(c.entries.get('A bicycle')).toBe('[ru] bike label')
    expect(c.entries.get('A painting')).toBe('[ru] nb label')
    expect(c.entries.get('She stands at that window.'), 'the unlicensed arm is its own key').toBe('[ru] nb note unlicensed')
    expect(c.entries.get('She has the money.'), 'and the base note is its own').toBe('[ru] nb note')
    expect(c.entries.get('Hard week.')).toBe('[ru] grind school')
    expect(c.entries.get('I feel good.'), '«fresh body» is the code\'s `freshBody`').toBe('[ru] fresh school')
    expect(c.entries.get('Papers first.')).toBe('[ru] exams')
    expect(c.entries.get('No matches for a while.')).toBe('[ru] off-season')
    expect(c.entries.get('Still in her coat.')).toBe('[ru] announced')
    expect(c.entries.get('We are all here.')).toBe('[ru] birth')
    expect(c.entries.get('She rang more often.')).toBe('[ru] bereaved')
    expect(c.entries.get('She rang about the court.')).toBe('[ru] divorced')
    expect(c.entries.get('She thanked us.')).toBe('[ru] with')
    expect(c.entries.get('She said fine.')).toBe('[ru] against')
    expect(c.entries.get('Best ranking: #{0}'), 'the source-fact table: an ordinary pair; his named hole becomes the key\'s').toBe('[ru] Best №{0}')
    expect(j.cells['album-facts'], 'the fact «mother\'s full name» is a note about a display, not a sentence').toBe(1)
  })

  it('⭐ MUTATION ARM – a coordinate the live corpus no longer has is a NAMED corpus-orphan and no entry: an id that died, a voice that went, a band that moved (never the neighbour)', () => {
    const control = joined()
    // the control: the occasion «ghost» and the 18-band are not in the miniature, so they are the two orphans of the unmutated fixture
    expect(control.j.orphans.filter((o) => o.kind === 'moved').map((o) => o.coord)).toEqual(expect.arrayContaining(['A9 ghost · sunny · note', 'gift bankcard [Age eighteen – the threshold] · label']))
    expect(control.c.entries.has('First day on court.')).toBe(true)
    // the id dies: the whole occasion's cells become orphans, and ONLY orphans – the neighbouring (live) occasion is untouched
    const noOccasion = joined({ ...MINI, album: { ...MINI.album, occasions: [{ id: 'renamed-court', voices: MINI.album.occasions[0]!.voices }] } })
    expect(noOccasion.c.entries.has('First day on court.'), 'a renamed id must not keep its old words').toBe(false)
    expect(noOccasion.j.orphans.some((o) => o.coord === 'A1 first-court · sunny · note' && /not in ALBUM_CORPUS/.test(o.why)), 'named, with the reason').toBe(true)
    // the voice goes: only that voice's cells orphan; the other voice still joins
    const noDeep = joined({ ...MINI, album: { ...MINI.album, occasions: [{ id: 'first-court', voices: { sunny: MINI.album.occasions[0]!.voices.sunny! } }] } })
    expect(noDeep.c.entries.has('She stood at the fence.')).toBe(false)
    expect(noDeep.c.entries.get('First day on court.')).toBe('[ru] sunny note')
    expect(noDeep.j.orphans.filter((o) => o.coord.startsWith('A1 first-court · deep')).map((o) => o.kind), 'all three registers of the vanished voice – the empty one too: there is nothing left to wait for').toEqual(['moved', 'moved', 'moved'])
    // the band moves (0-14 becomes 0-13): the section «Through fourteen» finds no band and its gift is an orphan, not the college's or the next band's
    const movedBand = joined({ ...MINI, gifts: { ...MINI.gifts, bands: [{ ...MINI.gifts.bands[0]!, to: 13 }, MINI.gifts.bands[1]!] } })
    expect(movedBand.c.entries.has('A bicycle')).toBe(false)
    expect(movedBand.j.orphans.some((o) => o.coord.startsWith('gift bicycle') && /no live birthday band/.test(o.why))).toBe(true)
    // the stage goes: a rectangular week-note cell whose stage the live moment lacks is an orphan
    const noCollege = joined({ ...MINI, weekNotes: { ...MINI.weekNotes, staged: { sunny: { grind: { school: 'Hard week.' }, freshBody: MINI.weekNotes.staged.sunny!.freshBody! } } } })
    expect(noCollege.c.entries.has('Called between lectures.')).toBe(false)
    expect(noCollege.j.orphans.some((o) => o.coord === 'sunny · grind · college')).toBe(true)
    // and an orphan never reaches ru.json's serialisation
    expect(serializeRu(noOccasion.c.entries)).not.toContain('sunny note')
  })

  it('a Russian-only field (the gift `event`) is a russian-only orphan; a live field no key asks for (the gift `short`) is `waiting`; neither compiles', () => {
    const { j, c } = joined()
    const events = j.orphans.filter((o) => o.kind === 'russian-only' && /«event»/.test(o.why))
    expect(events.map((o) => o.coord)).toEqual(['gift day [Shared non-object option] · event', 'gift bicycle [Through fourteen] · event'])
    const shorts = c.outcomes.filter((o) => o.row.coord?.endsWith('· short'))
    expect(shorts.map((o) => o.disposition), 'the English is live in source, no call site asks for it – the importer\'s own `waiting`').toEqual(['waiting'])
    expect(c.entries.has('the day')).toBe(false)
  })

  it('the three-column gift tables: `same` keeps the base words (no cell), a cell is the live `unlicensed` arm, and an arm the live gift lacks is an orphan', () => {
    const cells = parseGiftsDoc('g.md', GIFTS_DOC).cells.map((c) => c.coord)
    expect(cells, '`same` says the arm keeps the base words: it produces no cell').not.toContain('gift neverbuy [Ages twenty-two to twenty-eight] · unlicensed label')
    expect(cells).toContain('gift neverbuy [Ages twenty-two to twenty-eight] · unlicensed note')
    const { j, c } = joined()
    expect(c.entries.get('She stands at that window.')).toBe('[ru] nb note unlicensed')
    expect(c.entries.get('A photo at midnight.'), 'the base ask is its own cell and its own key').toBe('[ru] nb ask')
    const arm = j.orphans.find((o) => o.coord.endsWith('unlicensed ask'))
    expect(arm, 'the doc gives an unlicensed ask the miniature gift does not have: named, never attached to the base ask').toMatchObject({ kind: 'russian-only' })
    expect(arm?.why).toMatch(/no unlicensed «ask» arm/)
    expect(c.entries.get('One already hangs.'), 'no «again» row in the doc: the live string simply waits, it is not invented').toBeUndefined()
  })

  it('an EMPTY Russian cell is `pending` – his column waiting – and neither an orphan nor an entry', () => {
    const { j, c } = joined()
    const blank = c.outcomes.find((o) => o.row.coord === 'A1 first-court · deep · line')
    expect(blank).toMatchObject({ disposition: 'pending' })
    expect(c.entries.has('She watched first.')).toBe(false)
    expect(j.orphans.some((o) => o.coord === 'A1 first-court · deep · line')).toBe(false)
  })

  it('his `{N}` hole becomes the key\'s `{0}` – the spelling of a hole moves, no word does – and a second hole is never guessed', () => {
    const { c } = joined()
    expect(c.entries.get('{0} today. Save me the corner piece.')).toBe('[ru] {0} today, save me a piece')
    expect(englishFor('{0} today.', '[ru] {N} сегодня')).toBe('{N} today.')
    expect(englishFor('{0} today.', '[ru] {0} сегодня'), 'his Russian already spells the key\'s own hole').toBe('{0} today.')
    expect(englishFor('{0} of {1}', '[ru] {a} из {b}'), 'two holes: the position is not guessed – the importer will name what it cannot map').toBe('{0} of {1}')
    expect(englishFor('plain', '[ru] plain')).toBe('plain')
    expect(englishFor('plain', null)).toBe('plain')
  })

  it('⚠ A CORPUS CELL NEVER OVERWRITES: against another row for the same key it is a CONFLICT on both, and the key compiles nowhere', () => {
    const dir = docsDir({ album: ALBUM_DOC })
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${TABLE(`| R1 | | \`First day on court.\` | \`[ru] another hand\` | |`)}\n`)
    const rows = readAllRows(listDocs(dir), dir, MINI).rows
    const c = compile(rows, miniLive())
    const mine = c.outcomes.filter((o) => o.key === 'First day on court.')
    expect(mine.map((o) => [o.row.doc, o.disposition])).toEqual([['ru-fixture-2026-10.md', 'conflict'], [CORPUS_DOCS.album, 'conflict']])
    expect(c.entries.has('First day on court.'), 'neither is more right: the key compiles nowhere').toBe(false)
    // the same cell, agreeing, is not a conflict
    const agree = compile(readAllRows(listDocs(dir), dir, MINI).rows.filter((r) => r.doc !== 'ru-fixture-2026-10.md'), miniLive())
    expect(agree.entries.get('First day on court.')).toBe('[ru] sunny note')
  })

  it('⚠ THE GATE ITSELF: a corpus cell against a table row for the same live string is `conflict` red, both rows named – through the real catalog and the real corpora', () => {
    const dir = docsDir({ album: ALBUM_DOC })
    const real = ALBUM_CORPUS[1]! // first-court (the-line is first)
    expect(real.id).toBe('first-court')
    const realDoc = ALBUM_DOC.replace('`[ru] sunny note`', '`[ru] cell`')
    writeFileSync(join(dir, CORPUS_DOCS.album), `${realDoc}\n`)
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${TABLE(`| R1 | | \`${real.voices.sunny.note}\` | \`[ru] table\` | |`)}\n`)
    const rules = runGate({ tablesDir: dir, ruPath: join(dir, 'ru.json') }).problems.filter((p) => p.rule === 'conflict')
    expect(rules.map((p) => p.where).sort()).toEqual([`${CORPUS_DOCS.album}:${realDoc.split('\n').findIndex((l) => l.includes('[ru] cell')) + 1}`, 'ru-fixture-2026-10.md:3'].sort())
  })

  it('the hint guards the surface: the same text on ANOTHER surface\'s key is `foreign-surface`, reported and not attached', () => {
    const cat = catalogOf({ 'First day on court.': { home: ['src/components/OtherScreen.vue'] } })
    const dir = docsDir({ album: ALBUM_DOC })
    const j = joinCorpora(listDocs(dir), dir, MINI)
    const c = compile(j.rows, { catalog: cat, seen: new Set() })
    const o = c.outcomes.find((x) => x.row.coord === 'A1 first-court · sunny · note')
    expect(o?.disposition).toBe('foreign-surface')
    expect(c.entries.has('First day on court.')).toBe(false)
  })

  it('a recognised table whose row does not match its header is an `unreadable` orphan; the rest of the table still joins', () => {
    const doc = ['### A1 · `first-court`', '', ...T('| voice | note | caption | line |', '| `sunny` | `[ru] n` | `[ru] c` |', '| `deep` | `[ru] dn` | `[ru] dc` | `[ru] dl` |')].join('\n')
    const { j, c } = joined(MINI, { album: doc })
    expect(j.orphans.map((o) => [o.kind, o.line])).toEqual([['unreadable', 5]])
    expect(c.entries.get('She stood at the fence.')).toBe('[ru] dn')
    expect(c.entries.has('First day on court.')).toBe(false)
  })

  it('⚠ A HEADING THAT DRIFTED IS LOUD: a recognised table whose address is gone (no occasion id, no gift id, no voice) is `unreadable` orphans row by row – never a family gone quiet', () => {
    const album = joined(MINI, { album: ['### First court (no id any more)', '', ...T('| voice | note | caption | line |', '| `sunny` | `[ru] a` | `[ru] b` | `[ru] c` |')].join('\n') })
    expect(album.j.orphans.map((o) => [o.kind, o.why])).toEqual([['unreadable', expect.stringMatching(/names no occasion/)]])
    expect(album.c.entries.size).toBe(0)
    const gifts = joined(MINI, { gifts: ['## 3. Through fourteen', '', '### bicycle', '', ...T('| field | Russian draft |', '| label | `[ru] a` |', '| note | `[ru] b` |')].join('\n') })
    expect(gifts.j.orphans.map((o) => o.kind)).toEqual(['unreadable', 'unreadable'])
    expect(gifts.j.orphans[0]?.why).toMatch(/names no gift/)
    const weeks = joined(MINI, { 'week-notes': ['## 2. Sunny – rectangular moments', '', ...T('| moment | school | college |', '| grind | `[ru] a` | `[ru] b` |')].join('\n') })
    expect(weeks.j.orphans.map((o) => o.kind)).toEqual(['unreadable'])
    expect(weeks.j.orphans[0]?.why).toMatch(/names no voice/)
    expect(weeks.c.entries.size, 'nothing was joined by guessing a voice').toBe(0)
  })

  it('the report: a line per family, identical reasons grouped, every orphan NAMED, his Russian shown on --verbose, and the words «the gate does not fail on it» in the open', () => {
    const { j, c } = joined()
    const text = renderCorpusReport(j, c, MINI).join('\n')
    expect(text).toMatch(/corpus-orphan: \d+ \(moved \d+, russian-only \d+, unreadable 0\) – REPORTED ONLY, the gate does not fail on it/)
    expect(text).toContain('2 × gifts · russian-only · the live gift has no «event» field')
    expect(text).toContain('3 × album · moved · occasion «ghost» is not in ALBUM_CORPUS')
    expect(text).toContain('A9 ghost · sunny · caption')
    for (const family of ['album', 'album-facts', 'gifts', 'week-notes']) expect(text, family).toMatch(new RegExp(`^  ${family}\\s+\\d+\\s+\\d+`, 'm'))
    expect(text).not.toContain('his Russian for')
    expect(renderCorpusReport(j, c, MINI, { verbose: true }).join('\n')).toContain('his Russian for ru-album-corpus-2026-10.md:')
  })

  it('readAllRows reads his tables FIRST and the joiner after; a document the joiner names but the list omits is not read; a record file still throws', () => {
    const dir = docsDir({ album: ALBUM_DOC })
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${TABLE('| R1 | | `Stats` | `[ru] Stats` | |')}\n`)
    const all = readAllRows(listDocs(dir), dir, MINI)
    expect(all.rows[0]?.doc).toBe('ru-fixture-2026-10.md')
    expect(all.rows.some((r) => r.doc === CORPUS_DOCS.album)).toBe(true)
    expect(readAllRows(['ru-fixture-2026-10.md'], dir, MINI).rows.every((r) => r.doc === 'ru-fixture-2026-10.md'), 'a corpus doc absent from the list is not read').toBe(true)
    expect(() => readAllRows([RECORD_FILES[0]!], dir, MINI)).toThrow(/record file/)
  })

  it('THE GATE: a corpus document gone from the tables directory is `corpus-file` red; the corpus-orphan count is PRINTED and does not fail the gate', () => {
    const empty = tmp()
    const bare = runGate({ tablesDir: empty }).problems.filter((p) => p.rule === 'corpus-file').map((p) => p.where)
    expect(bare.sort()).toEqual(Object.values(CORPUS_DOCS).sort())
    const dir = tmp()
    writeFileSync(join(dir, 'catalog.en.json'), readCatalogText()!)
    writeFileSync(join(dir, 'ru.json'), readFileSync('src/i18n/ru.json', 'utf8'))
    const gate = runGate({ catalogPath: join(dir, 'catalog.en.json'), ruPath: join(dir, 'ru.json') })
    expect(gate.problems, 'the shipped tree, orphans and all, is green').toEqual([])
    const text = gate.lines.join('\n')
    expect(text).toMatch(/corpus-orphan: \d+ \(moved \d+, russian-only \d+, unreadable \d+\) – REPORTED ONLY, the gate does not fail on it/)
    expect(text).toMatch(/corpus joiner – his coordinate tables/)
  })

  it('⭐ THE REAL TREE: every cell of his three documents is accounted for, only the gift `event` is russian-only, and four independently-read coordinates carry exactly his words', () => {
    const corpora = liveCorpora()
    const { rows, corpus } = readAllRows(listDocs(), TABLES_DIR_REAL, corpora)
    const compiled = compile(rows, { catalog: parseCatalog(readCatalogText()!), seen: seenLiterals })
    // the accounting identity: a cell is joined, waiting for his column, waiting for a call site, refused by a guard, or NAMED as an orphan – none is dropped
    for (const f of ['album', 'album-facts', 'gifts', 'week-notes'] as const) {
      const mine = compiled.outcomes.filter((o) => o.row.corpus === f)
      expect(mine.length + corpus.orphans.filter((o) => o.family === f).length, `${f}: cells = rows + orphans`).toBe(corpus.cells[f])
    }
    expect(compiled.outcomes.filter((o) => o.row.corpus !== undefined && o.disposition === 'conflict')).toEqual([])
    expect(corpus.orphans.filter((o) => o.kind === 'russian-only').every((o) => o.family === 'gifts' && /«event»/.test(o.why))).toBe(true)
    // a FLOOR, not today's number (the English walks; the gate prints the rest): the joiner has not gone quiet on a family
    const joinedBy = (f: string): number => compiled.outcomes.filter((o) => o.row.corpus === f && o.disposition === 'compiled').length
    expect(joinedBy('album')).toBeGreaterThanOrEqual(400)
    expect(joinedBy('gifts')).toBeGreaterThanOrEqual(150)
    expect(joinedBy('week-notes')).toBeGreaterThanOrEqual(180)
    expect(joinedBy('album-facts')).toBeGreaterThanOrEqual(1)

    // THE ORACLE: a plain line split over the real documents, never the joiner's parser
    const ru = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
    const cellsOf = (doc: string, heading: RegExp, row: RegExp): string[] => {
      const lines = readFileSync(join(TABLES_DIR_REAL, doc), 'utf8').split('\n')
      const at = lines.findIndex((l) => heading.test(l))
      expect(at, `${doc}: ${heading}`).toBeGreaterThanOrEqual(0)
      const line = lines.slice(at + 1).find((l) => row.test(l))
      expect(line, `${doc}: ${heading} -> ${row}`).toBeDefined()
      return (line ?? '').replace(/^\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s+\|\s+/).map((c) => c.trim().replace(/^`|`$/g, ''))
    }
    // album: first-court · sunny · note/caption/line and deep · note
    const court = ALBUM_CORPUS.find((o) => o.id === 'first-court')!
    const sunny = cellsOf(CORPUS_DOCS.album, /^### A1 · `first-court`/, /^\| `sunny` \|/)
    expect([ru[court.voices.sunny.note], ru[court.voices.sunny.caption], ru[court.voices.sunny.line]]).toEqual([sunny[1], sunny[2], sunny[3]])
    expect(ru[court.voices.deep.note]).toBe(cellsOf(CORPUS_DOCS.album, /^### A1 · `first-court`/, /^\| `deep` \|/)[1])
    // the arc: open · deep
    const arc = cellsOf(CORPUS_DOCS.album, /^### Arc towards `open`/, /^\| `deep` \|/)
    expect([ru[ALBUM_ARC.open.deep.note], ru[ALBUM_ARC.open.deep.line]]).toEqual([arc[1], arc[2]])
    // gifts: the 0-14 band's bicycle label/ask, and neverbuy's unlicensed note (the third column)
    const bike = BIRTHDAY_BANDS.find((b) => b.from === 0 && b.to === 14)!.gifts.find((g) => g.id === 'bicycle')!
    expect(ru[bike.label]).toBe(cellsOf(CORPUS_DOCS.gifts, /^### `bicycle`/, /^\| label \|/)[1])
    expect(ru[bike.ask]).toBe(cellsOf(CORPUS_DOCS.gifts, /^### `bicycle`/, /^\| ask \|/)[1])
    const never = BIRTHDAY_BANDS.find((b) => b.from === 22 && b.to === 28)!.gifts.find((g) => g.id === 'neverbuy')!
    expect(ru[never.unlicensed!.note!]).toBe(cellsOf(CORPUS_DOCS.gifts, /^### `neverbuy`/, /^\| note \|/)[2])
    // the week-note grid: sunny · grind · every stage, and the motherhood table's sunny · announced, and the fork's quiet arm
    const grind = cellsOf(CORPUS_DOCS['week-notes'], /^## \d+\. Sunny voice – rectangular moments/, /^\| grind \|/)
    expect(['school', 'after-school', 'college', 'independent'].map((st) => ru[VOICE_LINES.sunny.grind[st as 'school'] as string])).toEqual(grind.slice(1))
    expect(ru[MOTHERHOOD_WORDS.sunny.announced]).toBe(cellsOf(CORPUS_DOCS['week-notes'], /^## \d+\. Motherhood voice layer/, /^\| sunny \|/)[1])
  })
})

// =================================================================================================
// THE CATALOG
// =================================================================================================

describe('the committed catalog', () => {
  const text = readCatalogText()!
  const catalog = parseCatalog(text)

  it('has the shape L2 builds on: sorted keys, files not lines, count honest, byte-for-byte what the extractor writes', () => {
    const keys = Object.keys(catalog.keys)
    expect(catalog.count).toBe(keys.length)
    expect(keys.length).toBeGreaterThan(3000)
    expect(keys).toEqual([...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)))
    for (const k of keys.slice(0, 400)) {
      // `seat` (L3-T, 10.10): the declared seats that can hand the key to the code – additive, so the format stays 1
      expect(Object.keys(catalog.keys[k]!).every((f) => ['home', 'area', 'ph', 'wrapped', 'seat'].includes(f))).toBe(true)
      for (const h of catalog.keys[k]!.home) expect(h, 'a home is a file, never a line').toMatch(/^src\/[^:]+$/)
    }
    expect(serializeCatalog(buildCatalog().catalog), 'run npm run i18n:extract').toBe(text)
  })

  it('every key formats with the renderer\'s own parser', () => {
    expect(lintCatalogKeys(catalog)).toEqual([])
  })

  it('the call sites L1a wrapped are keys, marked wired', () => {
    for (const k of ['Choose your language', 'You can change this later in Settings.', 'English', 'Russian', 'Language']) {
      expect(catalog.keys[k]?.wrapped, k).toBe(true)
    }
  })

  it('diffCatalogs names what appeared, went and changed', () => {
    const next: Catalog = { ...catalog, keys: { ...catalog.keys } }
    delete next.keys['Choose your language']
    next.keys['A brand new sentence'] = { home: ['src/x.vue'], area: ['screens'] }
    next.keys['English'] = { ...catalog.keys['English']!, home: ['src/other.vue'] }
    expect(diffCatalogs(catalog, next)).toEqual({ added: ['A brand new sentence'], removed: ['Choose your language'], changed: ['English'] })
  })

  it('a hole becomes {0}, {1} in order, and a literal brace is escaped the way the formatter reads it', () => {
    expect(keyFromCensusText('Won ${…} of ${…} sets')).toEqual({ key: 'Won {0} of {1} sets', arity: 2 })
    expect(keyFromCensusText('Press {Enter} or \\ now')).toEqual({ key: 'Press \\{Enter\\} or \\\\ now', arity: 0 })
    expect(analyzeMessage(keyFromCensusText('Press {Enter} or \\ now').key).args, 'the escaped key formats').toEqual([])
  })

  it('indexCatalog joins a key by its English text, tag stripped and holes collapsed', () => {
    const idx = indexCatalog(catalogOf({ 'nav|Stats': { home: ['a'] }, 'Won {0} of {1}': { home: ['b'] } }))
    expect(idx.get(normKey('Stats'))).toEqual(['nav|Stats'])
    expect(idx.get(normKey('Won {n} of {m}'))).toEqual(['Won {0} of {1}'])
  })
})

describe('⚠ the catalog is NEVER shipped', () => {
  it('the lazy-load glob in catalog.ts matches ru.json and es.json by name and cannot match catalog.en.json', () => {
    const source = readFileSync('src/i18n/catalog.ts', 'utf8')
    const glob = /import\.meta\.glob<[^>]*>\(\s*'([^']+)'/.exec(source)?.[1]
    expect(glob, 'the glob moved – re-point this pin at the new spelling').toBeTruthy()
    // Vite 7 resolves import.meta.glob with tinyglobby; this runs the same engine over the real directory.
    const matched = globSync(glob!, { cwd: 'src/i18n' }).sort()
    expect(matched, 'a locale file by name').toContain('ru.json')
    expect(matched).not.toContain('catalog.en.json')
    expect(matched.every((f) => /^(?:ru|es)\.json$/.test(f))).toBe(true)
    // The control: a SWEEP would have shipped it – so the test can fail.
    expect(globSync('./*.json', { cwd: 'src/i18n' })).toContain('catalog.en.json')
  })

  it('nothing under src/ imports it', () => {
    expect(catalogImportsInSrc()).toEqual([])
  })

  it('and the generator writes it where the glob does not look', () => {
    expect(CATALOG_PATH).toBe('src/i18n/catalog.en.json')
  })
})

// =================================================================================================
// THE WALKER: the call sites, on fixtures
// =================================================================================================

describe('the walker reads t() and cp`` call sites as keys, and the holes\' source text', () => {
  const mark = { certain: certain.length, likely: likely.length, calls: callKeys.length, dynamic: callStats.dynamic, sites: dynamicSites.length }
  const restore = (): void => {
    certain.length = mark.certain
    likely.length = mark.likely
    callKeys.length = mark.calls
    callStats.dynamic = mark.dynamic
    dynamicSites.length = mark.sites // L3-T: the sites the declared seats are held against
  }

  it('TypeScript: cp`` builds the key {0}, {1}; t(\'…\') is the literal; t(variable) is counted as dynamic', () => {
    try {
      scanTs('src/engine/fixture-l1b.ts', "const a = cp`Rain washed out ${name}'s practice on ${day}`\nconst b = t('Week {0} of {1}', [w, n])\nconst c = t(someKey)\nconst d = t(0.5)", 'engine', 0)
      const found = callKeys.slice(mark.calls)
      expect(found.map((k) => [k.via, k.key])).toEqual([['cp', "Rain washed out {0}'s practice on {1}"], ['t', 'Week {0} of {1}']])
      expect(found[0]?.holes).toEqual(['name', 'day'])
      expect(callStats.dynamic - mark.dynamic, 't(someKey) is dynamic; t(0.5) is a number').toBe(1)
    } finally {
      restore()
    }
  })

  it('Vue: a template call is a key, and a text run keeps each mustache\'s source expression', () => {
    try {
      scanVue('src/components/FixtureL1b.vue', '<template><div><p>{{ t("Hello {0}", [n]) }}</p><p>Week {{ week }} of {{ total }}</p></div></template>')
      expect(callKeys.slice(mark.calls).map((k) => k.key)).toEqual(['Hello {0}'])
      const item = certain.slice(mark.certain).find((i) => i.text.startsWith('Week'))
      expect(item?.holes).toEqual(['week', 'total'])
      expect(keyFromCensusText(item!.text).key).toBe('Week {0} of {1}')
    } finally {
      restore()
    }
  })
})

// =================================================================================================
// THE PSEUDO-LOCALE
// =================================================================================================

describe('the xx pseudo-locale', () => {
  const catalog = parseCatalog(readCatalogText()!)
  const pseudo = buildPseudoCatalog(catalog)

  it('covers every key; each value is bracketed and formats with the same arguments as its key', () => {
    expect(Object.keys(pseudo)).toHaveLength(catalog.count)
    for (const [key, value] of Object.entries(pseudo)) {
      expect(value.startsWith('⟦') && value.endsWith('⟧'), key).toBe(true)
      expect(analyzeMessage(value).args, key).toEqual(analyzeMessage(splitContext(key).text).args)
    }
  })

  it('pads long strings by about 30% with the string\'s own words, keeps placeholders, strips the context tag, is deterministic', () => {
    const key = 'nav|Rain washed out {0}\'s practice, so we stayed home'
    const value = pseudoLocalize(key)
    expect(value).toContain('{0}')
    expect(value).not.toContain('nav|')
    const visible = (s: string): number => s.replace(/\{0\}/g, '').length
    expect(visible(value) / visible(splitContext(key).text)).toBeGreaterThan(1.3)
    expect(pseudoLocalize(key)).toBe(value)
  })

  it('expandText works on rendered text: whitespace collapsed, bracketed, longer', () => {
    const out = expandText('  Tap   to start  ')
    expect(out.startsWith('⟦Tap to start')).toBe(true)
    expect(out.length).toBeGreaterThan('Tap to start'.length * 1.3)
  })
})


// =================================================================================================
// ⭐⭐ L2-1 FINDINGS 1 + 2 (08.10), FIXED BY THE ARCHITECT – the regression arms.
// =================================================================================================
describe('08.10 – the twin-key bug and the header classifier', () => {
  it('a template t() literal is a KEY once, never also a plain scanned string (finding 1)', () => {
    const before = { certain: certain.length, calls: callKeys.length }
    scanVue('fixtures/twin.vue', `<template><p>{{ t('Step {step} of {count}', { step, count }) }}</p></template>`)
    const newCalls = callKeys.slice(before.calls)
    const newCertain = certain.slice(before.certain)
    expect(newCalls.map((c) => c.key), 'the call key is recorded exactly once').toEqual(['Step {step} of {count}'])
    expect(
      newCertain.filter((c) => c.text.includes('Step')),
      'no plain-string twin of the key (the escaped-brace twin blocked the editorial join)',
    ).toEqual([])
  })

  it('an «English title» header is an English column, and `source` is not misread (finding 2)', () => {
    const table = [
      '| id | source | English title | Russian title |',
      '| --- | --- | --- | --- |',
      "| T01 | `OnboardingTour.vue:96` | `You are the parent` | `Вы – родитель` |",
    ].join('\n')
    const { rows } = parseTables('fixture-tour.md', table)
    expect(rows).toHaveLength(1)
    expect(rows[0].english, 'the English comes from the English-titled column, not from `source`').toBe(
      'You are the parent',
    )
  })
})

// =================================================================================================
// ⭐⭐ 11.10 – THE normKey BUG AND THE EMPTY RUSSIAN CELL – the regression arms.
// Fixture Russian is a bracketed stand-in (`[ru] …`): these arms are about the JOIN and the CLASS, never about wording.
// =================================================================================================
describe('11.10 – normKey meets every hole of a run, and an empty Russian DRAFT cell is pending', () => {
  const holes = catalogOf({
    'Seat {0}{1}': { home: ['src/engine/world/albumBook.ts'] },
    '🩹 {0} retired hurt at the {1}{2}.': { home: ['src/engine/world/worldNews.ts'] },
    'Won {0} of {1}': { home: ['src/components/HerWeekTab.vue'] },
    'Aged {0}': { home: ['src/components/screens/ProfileScreen.vue'] },
    'Tennis & trips': { home: ['src/components/EndingScreen.vue'] },
    Stats: { home: ['src/components/screens/StatsScreen.vue'] },
    'Centre Court': { home: ['src/engine/world/venues.ts'] },
  })
  const lv: Live = { catalog: holes, seen: new Set() }

  it('⭐ ARM 1 – TWO HOLES IN A ROW: `{n}{letter}` and `{tier}{when}` are two holes each, not one hole and a leftover (the old regexp swallowed the second hole\'s leader) – and each row joins its key', () => {
    expect(normKey('Seat {n}{letter}')).toBe('Seat ¤¤')
    expect(normKey('{tier}{when}')).toBe('¤¤')
    expect(normKey('a {x}{y}{z} b')).toBe('a ¤¤¤ b')
    expect(normKey('{{ a }}{{ b }}')).toBe('¤¤')
    // the thing the leader character was FOR: a source `${…}` run is still one hole each, never two-and-a-half
    expect(normKey('Won ${a}${b}')).toBe('Won ¤¤')
    expect(normKey('Won ${a}{b}')).toBe('Won ¤¤')
    // through the importer's own index, to the key the code asks for
    const index = indexCatalog(holes)
    expect(index.get(normKey('Seat {n}{letter}'))).toEqual(['Seat {0}{1}'])
    expect(index.get(normKey('🩹 {rivalName} retired hurt at the {tier}{when}.'))).toEqual(['🩹 {0} retired hurt at the {1}{2}.'])
    // …and the whole row compiles, his holes re-pointed by position (the second row names them in another order on purpose)
    const out = compile(rowsOf(TABLE('| R1 | | `Seat {n}{letter}` | `[ru] Seat {n}{letter}` | |', '| R2 | | `🩹 {rivalName} retired hurt at the {tier}{when}.` | `[ru] {when}{tier}{rivalName}` | |')), lv)
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['compiled', 'compiled'])
    expect([...out.entries]).toEqual([['Seat {0}{1}', '[ru] Seat {0}{1}'], ['🩹 {0} retired hurt at the {1}{2}.', '[ru] {2}{1}{0}']])
  })

  it('⭐ ARM 2 – A NUMBERED HOLE (`{0}`) IN HIS ENGLISH CELL normalises too: it met no key at all before, whatever the catalog held', () => {
    expect(normKey('Aged {0}')).toBe('Aged ¤')
    expect(normKey('Won {0} of {1}')).toBe('Won ¤ of ¤')
    expect(normKey('{12} left')).toBe('¤ left')
    // the two spellings of one sentence meet, and a brace that is not a whole hole stays text
    expect(normKey('Aged {n}')).toBe(normKey('Aged {0}'))
    expect(normKey('Aged {0.5x}')).toBe('Aged {0.5x}')
    const index = indexCatalog(holes)
    expect(index.get(normKey('Won {0} of {1}'))).toEqual(['Won {0} of {1}'])
    const out = compile(rowsOf(TABLE('| R1 | | `Aged {0}` | `[ru] Aged {0}` | |')), lv)
    expect(out.outcomes[0]).toMatchObject({ disposition: 'compiled', key: 'Aged {0}' })
    expect(out.entries.get('Aged {0}')).toBe('[ru] Aged {0}')
  })

  it('⭐ ARM 3 – AN EMPTY RUSSIAN CELL: on a DRAFT it is `pending` (his column is waiting, not a defect); on an APPROVED / LANDED row it stays `ambiguous-cell` (a status with no translation); a cell with something unclean in it is still `ambiguous-cell`', () => {
    const rows = rowsOf(
      TABLE(
        '| R1 | | `Tennis & trips` | | |',
        '| R2 | | `Tennis & trips` | | `APPROVED` |',
        '| R3 | | `Stats` | | `LANDED` |',
        '| R4 | | `Centre Court` | `[a]` / `[b]` | |',
        '| R5 | | `Stats` | | `QUESTION` |',
      ),
    )
    expect(rows.map((r) => r.russianBlank), 'empty is not the same as unclean – the parser tells them apart').toEqual([true, true, true, false, true])
    const out = compile(rows, lv)
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['pending', 'ambiguous-cell', 'ambiguous-cell', 'ambiguous-cell', 'pending'])
    expect(out.outcomes[0]).toMatchObject({ disposition: 'pending', key: 'Tennis & trips' })
    expect(out.outcomes[1]?.why, 'the reason names the empty cell and the status that contradicts it').toMatch(/empty .*APPROVED/)
    expect(out.outcomes[2]?.why).toMatch(/empty .*LANDED/)
    expect(out.outcomes[3]?.why, 'an unclean cell keeps the old reason').toContain('not one clean literal')
    expect(out.entries.size, 'a waiting column compiles nothing').toBe(0)
    // a formatter row (`W14 '31`) takes the same road: DRAFT + empty -> pending (with its format), APPROVED + empty -> ambiguous-cell
    const fmt = compile(rowsOf(TABLE("| R1 | | `W14 '31` | | |", "| R2 | | `W14 '31` | | `APPROVED` |")), lv)
    expect(fmt.outcomes.map((o) => [o.disposition, o.format])).toEqual([['pending', 'dates.weekLabel'], ['ambiguous-cell', 'dates.weekLabel']])
    expect(fmt.formats.size).toBe(0)
    // the join's own verdicts still come first: an empty cell does not hide a dead English (drift), and the читка regime reads the DRAFT as pending exactly as before
    expect(compile(rowsOf(TABLE('| R1 | | `This sentence is nowhere` | | |')), lv).outcomes[0]?.disposition).toBe('unmatched')
    expect(compile(rowsOf(TABLE('| R1 | | `Tennis & trips` | | |')), lv, { includeDrafts: false }).outcomes[0]?.disposition).toBe('pending')
  })
})
