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
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { globSync } from 'tinyglobby'
import { analyzeMessage, splitContext } from '../src/shared/i18n'
import { normKey } from '../tools/copy-text'
import { callKeys, callStats, certain, dynamicSites, likely, scanTs, scanVue } from '../tools/copy-census-walk'
import { catalogImportsInSrc, lintCatalogKeys, lintRu, requiredPluralCategories, runGate } from '../tools/i18n-check'
import { buildCatalog, CATALOG_PATH, diffCatalogs, keyFromCensusText, parseCatalog, readCatalogText, serializeCatalog } from '../tools/i18n-extract'
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
} from '../tools/i18n-import'
import type { Live } from '../tools/i18n-import'
import { buildPseudoCatalog, expandText, pseudoLocalize } from '../tools/i18n-pseudoloc'

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

describe('compile – English joins, the location breaks ties, and only APPROVED/LANDED ever compiles', () => {
  it('an APPROVED row on a live key compiles; DRAFT and QUESTION never do', () => {
    const rows = rowsOf(
      TABLE(
        '| R1 | | `Tennis & trips` | `Теннис и поездки` | `APPROVED` 08.10 |',
        '| R2 | | `Tennis & trips` | `другое` | |',
        '| R3 | | `Tennis & trips` | `ещё` | `QUESTION` |',
      ),
    )
    const out = compile(rows, live())
    expect([...out.entries]).toEqual([['Tennis & trips', 'Теннис и поездки']])
    expect(out.outcomes.map((o) => o.disposition)).toEqual(['compiled', 'pending', 'pending'])
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
