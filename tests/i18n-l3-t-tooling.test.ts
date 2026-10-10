// L3-T (10.10) – THE TOOLING CLOSURE OF THE L3 LAYER. docs/specs/i18n-2026-10.md §4 (the pipeline as shipped), §8 row L3-T.
//
// WHAT THE WAVE DID. It touched no engine file, no save, no draw and no word of copy (invariant 4: not one string on a screen or in a table was edited); it paid the seven debts the L2/L3
// waves parked for the TOOLS, and each is held here by arms that can fail:
//   §1 the walker's `+`-fold          – `t('a long lede, ' + 'kept whole')` is ONE key, in a script and in a template; a `+` with anything else in it stays dynamic and listed
//   §2 the declared seats             – the registry (`tools/i18n-seats.ts`) is backed by the tree, names every dynamic call, and takes OUTSIDE_CATALOG.gifts 159 -> 0
//   §3 `--mark-landed` through a seat – an APPROVED row on a seat-only string flips, on a SCRATCH copy of a table; the same row with the seat stripped does not
//   §4 the score tail                 – the four kid-match keys keep their score hole last in any locale value; the table is held against the catalog AND the source
//   §5 the formatter-output row       – the APPROVED short-year row compiles into a pattern in `formats.ru.json`; `unmatched` falls by one; the gate holds the new file
// (The other two debts – the frozen-record capture and `tTransparent`'s context tag – live where their readers live: tests/component/identity-capture.test.ts, tests/helpers.test.ts.)
//
// ⚠ NO RUSSIAN IS WRITTEN HERE. Fixture Russian is ASCII stand-ins; the one real Russian (the short-year row) is READ from his table by its cells and compared with the generated file.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { globSync } from 'tinyglobby'
import { formatMessage, SOURCE_LOCALE } from '../src/shared/i18n'
import { weekLabel, weekYearLabel } from '../src/shared/dates'
import { BIRTHDAY_BANDS, BIRTHDAY_DAY_TOGETHER } from '../src/engine/world'
import { callKeys, callStats, certain, dynamicSites, likely, scanTs, scanVue } from '../tools/copy-census-walk'
import { lintFormats, lintRu, lintScoreTailTable, runGate, SCORE_TAIL_KEYS } from '../tools/i18n-check'
import { buildCatalog, checkSeat, parseCatalog, readCatalogText, seenLiterals, serializeCatalog } from '../tools/i18n-extract'
import type { Catalog } from '../tools/i18n-extract'
import { englishPattern, FORMAT_EXAMPLES, FORMATS_PATH, formatIndex, patternFromExample, serializeFormats } from '../tools/i18n-formats'
import { applyLanded, compile, listDocs, parseTables, planLanded, readRows, serializeRu } from '../tools/i18n-import'
import type { Live } from '../tools/i18n-import'
import { DECLARED_SEATS, unseatable } from '../tools/i18n-seats'
import type { Seat } from '../tools/i18n-seats'

const EN = { locale: SOURCE_LOCALE }
const scratch: string[] = []
function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tb-l3t-'))
  scratch.push(dir)
  return dir
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true })
})

const committedText = readCatalogText()!
const committed = parseCatalog(committedText)

// =================================================================================================
// §1 THE WALKER'S `+`-FOLD
// =================================================================================================
describe('§1 the walker folds `+` between plain literals into ONE key – and leaves everything else dynamic and listed', () => {
  const mark = { certain: certain.length, likely: likely.length, calls: callKeys.length, dynamic: callStats.dynamic, sites: dynamicSites.length }
  const restore = (): void => {
    certain.length = mark.certain
    likely.length = mark.likely
    callKeys.length = mark.calls
    callStats.dynamic = mark.dynamic
    dynamicSites.length = mark.sites
  }
  /** Scan a fixture, hand back what it added, and put the walker's global state back. */
  function scanned(run: () => void): { keys: string[]; dynamic: number; sites: string[]; likelyAdded: number } {
    try {
      run()
      return {
        keys: callKeys.slice(mark.calls).map((k) => k.key),
        dynamic: callStats.dynamic - mark.dynamic,
        sites: dynamicSites.slice(mark.sites).map((s) => s.arg),
        likelyAdded: likely.length - mark.likely,
      }
    } finally {
      restore()
    }
  }
  const ts = (source: string) => scanned(() => scanTs('src/composables/fixture-l3t.ts', source, 'composable', 0))
  const vue = (template: string) => scanned(() => scanVue('src/components/FixtureL3t.vue', `<template><div>${template}</div></template>`))

  it('TypeScript: a sentence split over lines with `+` is one key (the long-lede shape), with params, parentheses and template literals', () => {
    expect(ts("const a = t('A long lede that runs past the line width, ' + 'and is kept whole.')").keys).toEqual(['A long lede that runs past the line width, and is kept whole.'])
    expect(ts("const a = t(\n  'First half of a lede, ' +\n    'second half, ' +\n    'third.',\n)").keys).toEqual(['First half of a lede, second half, third.'])
    expect(ts("const a = t(('Week {0} of ' + '{1}'), [w, n])").keys).toEqual(['Week {0} of {1}'])
    expect(ts('const a = t(`Backtick one, ` + `backtick two`)').keys).toEqual(['Backtick one, backtick two'])
    expect(ts("const a = t('One ' + 'two ' + 'three ' + 'four')").keys).toEqual(['One two three four'])
    expect(ts("const a = t('A long lede that runs past the line width, ' + 'and is kept whole.')").dynamic, 'a folded call is a key, not a dynamic call').toBe(0)
  })

  it('TypeScript: the control – a single literal reads as it always did, and every `+` with a non-literal in it is still DYNAMIC, counted, and listed with its source', () => {
    expect(ts("const a = t('Just one literal')").keys).toEqual(['Just one literal'])
    for (const src of ["t('A ' + name)", "t(name + ' tail')", "t('A ' + (x ? 'b' : 'c'))", 't(`a${x}` + `b`)', "t('A ' + 1)", "t(count + 'x')"]) {
      const r = ts(`const a = ${src}`)
      expect(r.keys, src).toEqual([])
      expect(r.dynamic, src).toBe(1)
      expect(r.sites, src).toEqual([src.slice(2, -1)])
    }
    expect(ts("const a = t(variable)").sites).toEqual(['variable'])
    expect(ts('const a = t(0.5)').dynamic, 'a number is no key and no dynamic call').toBe(0)
  })

  it('Vue: the same fold in a template expression – and a literal that is a PART of a key is not also scanned as a plain string (L2-1 finding 1)', () => {
    const lede = 'The first half of a long lede, '
    const rest = 'and the second half of it.'
    const r = vue(`<p>{{ t('${lede}' + '${rest}') }}</p>`)
    expect(r.keys).toEqual([`${lede}${rest}`])
    expect(r.dynamic).toBe(0)
    expect(r.likelyAdded, 'both halves are >= 15 characters: scanned as plain strings they would land in LIKELY').toBe(0)
    expect(vue(`<button :title="t('Dismiss ' + 'this card')" />`).keys).toEqual(['Dismiss this card'])
    expect(vue("<p>{{ t('One ' + 'two ' + 'three', [n]) }}</p>").keys).toEqual(['One two three'])
  })

  it('Vue: the control – `t(\'A \' + name)` used to record the FRAGMENT «A » as a key; it is a dynamic call now, listed, and never a key', () => {
    const r = vue("<p>{{ t('A fragment of a sentence ' + name) }}</p>")
    expect(r.keys).toEqual([])
    expect(r.dynamic).toBe(1)
    expect(r.sites).toEqual(["'A fragment of a sentence ' + name"])
    expect(vue('<p>{{ t(someKey) }}</p>').sites).toEqual(['someKey'])
    expect(vue('<p>{{ t("Plain") }}</p>').keys, 'a plain literal call is unchanged').toEqual(['Plain'])
    expect(vue('<p>{{ t(`has ${hole} in it`) }}</p>').dynamic, 'a template with a hole is still a dynamic key').toBe(1)
  })

  it('the real tree is unchanged by the fold: no `t()` in src is a `+` chain today (the catalog the fold left is the committed one)', () => {
    expect(serializeCatalog(buildCatalog().catalog)).toBe(committedText)
  })
})

// =================================================================================================
// §2 THE DECLARED SEATS
// =================================================================================================
// the number of DISTINCT keys each seat reaches – every figure is one an earlier wave's net counts on its own (the provider is not asked to confirm itself)
const SEAT_KEYS: Record<string, number> = {
  'lifeBeat.optionLabel': 179, //   34 LIFE_BEAT_OPTIONS labels (L2-9b) + 145 distinct stance labels over 51 situations x 4 voices (L3-5 §6)
  'lifeBeat.replyDone': 2, //       `Let her finish` and `Proceed` – the two shipped words (invariant 4)
  'lifeBeat.promptConfirm': 1, //   `Proceed`
  'lifeMoment.confirm': 1, //       LIFE_MOMENT_CONFIRM
  'fridge.note': 115, //            7 pools: 50 + 27 + 8 + 6 + 8 + 8 + 8 (L3-5 §10)
  'birthday.gifts': 159, //         the gift catalogue (L3-4): labels, notes, repeat notes, asks, the means alternates
  'diary.pool': 95, //              95 static cells (L3-4 §2)
  'diary.debut': 4, //              the four opening-week lines
  'diary.weekNotes': 298, //        298 static cells of the 324-cell corpus (L3-4 §8)
  'diary.travel': 78, //            the travel notes + the coach's five
  'smallTalk.corpus': 820, //       204 openers + 612 replies + 4 shared second beats (L3-5 §6)
  'smallTalk.frames': 18, //        9 per presence
  'album.corpus': 472, //           456 cells + 16 arc cells (L3-6 §11)
  // ⚠ 10.10 – the LQA runner's four not-in-catalog keys and their whole families (L4-GATE row):
  'ledger.tournamentRow': 8, //     4 clause shapes x retired on/off, read off the REAL joiner – the first braced ref-seat keys
  'spirit.exposure': 1, //          EXPOSURE_ROW, written by identity (`text: EXPOSURE_ROW`)
  'finance.flavors': 26, //         14 coaching-week pool lines (both axes) + 12 gear tier flavors
  // ⭐ 10.10 (owner item 34) – the epilogue's paragraph, the sixth dynamic `t()` call:
  'ending.blurb': 9, //             ENDING_BLURB, one per `CareerEndingType` – a Record's values no census rule reads, drawn by `t(ENDING_BLURB[type])` on the last page
}

describe('§2 the declared seats – every dynamic key set the code asks for is named, from the real constants, and held against the tree', () => {
  const built = buildCatalog()

  it('the registry is well-formed: unique ids, a call seat names a site, a ref seat names a writer, every key set is non-empty', () => {
    const ids = DECLARED_SEATS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.sort()).toEqual(Object.keys(SEAT_KEYS).sort())
    for (const seat of DECLARED_SEATS) {
      if (seat.via === 'call') expect(seat.sites?.length ?? 0, seat.id).toBeGreaterThan(0)
      else expect(seat.writers?.length ?? 0, seat.id).toBeGreaterThan(0)
      expect(seat.groups().flatMap((g) => g.keys).length, seat.id).toBeGreaterThan(0)
    }
  })

  it('⭐ every seat is backed by the tree and seatable – and NO dynamic `t()` call in src is undeclared (the gate prints the number; this pins it at zero)', () => {
    expect(built.seatProblems).toEqual([])
    expect(built.undeclared).toEqual([])
    // ⭐ RE-AIMED 10.10 (owner item 34): 5 -> 6 – `t(ENDING_BLURB[type])` in EndingScreen, the sixth call, declared as the seat `ending.blurb` (below).
    expect(built.stats.dynamicCalls).toBe(6)
    expect(built.stats.dynamicDeclared).toBe(6)
    expect(built.stats.dynamicUndeclared).toBe(0)
    expect(dynamicSites.map((d) => `${d.file} ${d.arg}`).sort()).toEqual([
      'src/components/EndingScreen.vue ENDING_BLURB[type]',
      'src/components/LifeBeatDialog.vue option.label',
      'src/components/LifeBeatDialog.vue prompt.confirm',
      'src/components/LifeBeatDialog.vue replying.done',
      'src/components/LifeMomentOverlay.vue moment.confirm',
      'src/components/screens/CalendarScreen.vue fridgeNote',
    ])
  })

  it('each seat reaches exactly the number of keys the waves counted, and the committed catalog carries them wired, under the seat\'s id', () => {
    for (const seat of DECLARED_SEATS) {
      const keys = [...new Set(seat.groups().flatMap((g) => g.keys))]
      expect(keys.length, `${seat.id}: distinct keys`).toBe(SEAT_KEYS[seat.id])
      const missing = keys.filter((k) => !committed.keys[k]?.wrapped || !committed.keys[k]?.seat?.includes(seat.id))
      expect(missing, `${seat.id}: keys the committed catalog does not carry wired under this seat – run npm run i18n:extract`).toEqual([])
    }
    expect(Object.values(committed.keys).filter((e) => e.seat !== undefined).length, 'distinct keys reached by some seat').toBe(built.stats.seatKeys)
    expect(built.stats.seats).toBe(DECLARED_SEATS.length)
  })

  it('⭐ OUTSIDE_CATALOG.gifts 159 -> 0: the gift catalogue\'s strings ARE catalog keys now, homed on birthday.ts, wired through their seat – and without seats they are not there', () => {
    const gifts = new Set<string>()
    for (const gift of [...BIRTHDAY_BANDS.flatMap((b) => b.gifts), BIRTHDAY_DAY_TOGETHER]) {
      for (const f of ['label', 'note', 'again', 'ask'] as const) gifts.add(gift[f])
      for (const v of Object.values(gift.unlicensed ?? {})) if (v) gifts.add(v)
    }
    expect(gifts.size).toBe(159)
    for (const g of gifts) {
      expect(committed.keys[g]?.home, g).toEqual(['src/engine/world/birthday.ts'])
      expect(committed.keys[g]?.wrapped, g).toBe(true)
      expect(committed.keys[g]?.seat, g).toEqual(['birthday.gifts'])
    }
    const bare = buildCatalog({ seats: [] })
    // 159 gift keys + 34 of the 10.10 families (the 35th, one coaching line, the census already met) + the nine epilogue paragraphs (10.10, item 34 – a Record's values, no census rule reads them)
    // – every seat-only key the census cannot see. ⭐ RE-AIMED 10.10: 193 -> 202.
    expect(bare.catalog.count, 'the catalog the census alone sees').toBe(built.catalog.count - 202)
    expect([...gifts].filter((g) => bare.catalog.keys[g] !== undefined)).toEqual([])
  })

  it('a seat adds a HOME and a wire, never a second opinion: keys the census already met keep their areas; `Continue` gains the engine constant as a home', () => {
    const bare = buildCatalog({ seats: [] })
    for (const [k, e] of Object.entries(bare.catalog.keys)) expect(built.catalog.keys[k]?.area, k).toEqual(e.area)
    expect(committed.keys['Continue']?.home).toContain('src/engine/world/lifeMomentCopy.ts')
    expect(bare.catalog.keys['Continue']?.home).not.toContain('src/engine/world/lifeMomentCopy.ts')
    // every key the census had stays, with the same homes, plus at most the seat's own file
    for (const [k, e] of Object.entries(bare.catalog.keys)) for (const h of e.home) expect(built.catalog.keys[k]?.home, k).toContain(h)
  })

  it('the wired count rises by exactly the seat keys the census had not wired, and nothing else changed about a key but `wrapped`, `seat` and a home', () => {
    const bare = buildCatalog({ seats: [] })
    let flipped = 0
    for (const [k, e] of Object.entries(bare.catalog.keys)) {
      const now = built.catalog.keys[k]!
      if (!e.wrapped && now.wrapped) flipped++
      expect({ ...now, wrapped: undefined, seat: undefined, home: undefined }, k).toEqual({ ...e, wrapped: undefined, seat: undefined, home: undefined })
    }
    // 159 gifts + 34 of the 10.10 families + the nine epilogue paragraphs (10.10, item 34), as above – ⭐ RE-AIMED 10.10: 193 -> 202
    expect(built.stats.wrapped - bare.stats.wrapped).toBe(flipped + 202)
  })

  // ── the mutations: a fabricated seat, driven through the SAME code ──────────────────────────────────────────────────────────
  const fake = (over: Partial<Seat> = {}): Seat => ({
    id: 'fake.seat',
    via: 'call',
    sites: [{ file: 'src/components/Fake.vue', arg: 'thing.label' }],
    groups: () => [{ home: 'src/engine/world/fake.ts', keys: ['A fabricated label', 'Another fabricated label'] }],
    ...over,
  })
  const site = { file: 'src/components/Fake.vue', line: 3, arg: 'thing.label' }

  it('MUTATION 1: a call seat whose site the walker cannot find is STALE – reported, and it marks NOTHING', () => {
    const r = buildCatalog({ seats: [fake()], sites: [] })
    expect(r.seatProblems.map((p) => p.rule)).toEqual(['seat-stale'])
    expect(r.seatProblems[0]?.detail).toContain('thing.label')
    expect(r.catalog.keys['A fabricated label'], 'a stale seat enters nothing').toBeUndefined()
    // the control: the same seat, its site present
    const ok = buildCatalog({ seats: [fake()], sites: [site] })
    expect(ok.seatProblems).toEqual([])
    expect(ok.catalog.keys['A fabricated label']).toEqual({ home: ['src/engine/world/fake.ts'], area: ['engine'], wrapped: true, seat: ['fake.seat'] })
    expect(ok.undeclared).toEqual([])
  })

  it('MUTATION 2: a ref seat whose writer no longer says what the declaration says is STALE; with the text present it passes', () => {
    const ref = fake({ via: 'ref', sites: undefined, writers: [{ file: 'src/engine/world/fake.ts', needle: 'labelC: { k: gift.label }' }] })
    const gone = buildCatalog({ seats: [ref], sites: [], read: () => 'export const x = 1' })
    expect(gone.seatProblems.map((p) => p.rule)).toEqual(['seat-stale'])
    expect(gone.catalog.keys['A fabricated label']).toBeUndefined()
    const missingFile = buildCatalog({ seats: [ref], sites: [], read: () => null })
    expect(missingFile.seatProblems.map((p) => p.rule)).toEqual(['seat-stale'])
    const ok = buildCatalog({ seats: [ref], sites: [], read: () => 'labelC: { k: gift.label },' })
    expect(ok.seatProblems).toEqual([])
    expect(ok.catalog.keys['Another fabricated label']?.seat).toEqual(['fake.seat'])
  })

  it('MUTATION 3: a key that cannot be a seat key (message syntax, a context tag, empty) and an empty key set are reported by name', () => {
    for (const [bad, rule] of [['Has {a} hole', 'seat-unseatable'], ['Back\\slash', 'seat-unseatable'], ['nav|Stats', 'seat-unseatable'], ['', 'seat-unseatable']] as const) {
      const r = checkSeat(fake({ groups: () => [{ home: 'src/engine/world/fake.ts', keys: ['Fine', bad] }] }), [site])
      expect(r.problems.map((p) => p.rule), JSON.stringify(bad)).toEqual([rule])
    }
    expect(checkSeat(fake({ groups: () => [{ home: 'x.ts', keys: [] }] }), [site]).problems.map((p) => p.rule)).toEqual(['seat-empty'])
    for (const plain of ['Win | Lose', 'Draw|Seed', 'A plain sentence.', '1st|2nd']) expect(unseatable(plain), plain).toBeNull()
    // ⚠ 10.10 – the law SPLIT by seat kind, deliberately: a REF seat's key is a message by
    // construction (the ref carries `p`), and the joined tournament row is a braced key no static
    // walk can see. Braces stay fatal for a CALL seat; backslash, tag shape and empty for both.
    expect(unseatable('Has {a} hole', 'ref'), 'a braced REF key is lawful').toBeNull()
    const refSeat = fake({ via: 'ref', sites: undefined, writers: [{ file: 'src/engine/world/fake.ts', needle: 'k: row' }], groups: () => [{ home: 'src/engine/world/fake.ts', keys: ['{0} – {1} (+{2} pts)'] }] })
    expect(checkSeat(refSeat, [site], () => 'k: row').problems).toEqual([])
    for (const bad of ['Back\\slash', 'nav|Stats', '']) expect(unseatable(bad, 'ref'), JSON.stringify(bad)).not.toBeNull()
  })

  it('MUTATION 4: a dynamic call NO seat declares is counted, listed with its file and line, and is what the gate prints', () => {
    const r = buildCatalog({ seats: [fake()], sites: [site, { file: 'src/components/Other.vue', line: 9, arg: 'row.name' }] })
    expect(r.undeclared).toEqual([{ file: 'src/components/Other.vue', line: 9, arg: 'row.name' }])
    expect(r.stats.dynamicUndeclared).toBe(1)
    expect(r.stats.dynamicDeclared).toBe(1)
  })

  it('MUTATION 5: a seat flips a CERTAIN-but-unwrapped key to wired – and the same seat, stale, does not', () => {
    const bare = buildCatalog({ seats: [], sites: [] })
    const unwrapped = Object.entries(bare.catalog.keys).find(([k, e]) => !e.wrapped && unseatable(k) === null && e.home.length === 1)!
    const real = unwrapped[0]
    const seat = fake({ groups: () => [{ home: unwrapped[1].home[0]!, keys: [real] }] })
    expect(buildCatalog({ seats: [seat], sites: [site] }).catalog.keys[real]?.wrapped).toBe(true)
    expect(buildCatalog({ seats: [seat], sites: [] }).catalog.keys[real]?.wrapped, 'stale -> the key stays unwired').toBeUndefined()
  })

  it('THE GATE: a stale seat is a RED (`seat-stale`) and names the seat; the undeclared count is printed; the shipped tree is green', () => {
    const stale = runGate({ build: { seats: [fake()], sites: dynamicSites } })
    expect(stale.problems.filter((p) => p.rule === 'seat-stale').map((p) => p.where)).toEqual(['fake.seat'])
    const green = runGate()
    expect(green.problems).toEqual([])
    // ⭐ RE-AIMED 10.10 (owner item 34): 5 -> 6 – the epilogue's `t(ENDING_BLURB[type])`, declared as `ending.blurb`
    expect(green.lines.join('\n')).toMatch(/6 dynamic t\(\) calls: 6 declared, 0 unreadable/)
    // ⭐ RE-AIMED 10.10: 16 seats / 2,275 keys -> 17 / 2,284 (+ `ending.blurb`, nine keys)
    expect(green.lines.join('\n')).toMatch(/seats {5}17 declared \(tools\/i18n-seats\.ts\) reach 2284 catalog keys/)
  })
})

// =================================================================================================
// §3 --mark-landed THROUGH A SEAT
// =================================================================================================
describe('§3 `--mark-landed` flips a row whose key is reachable only through a declared seat – on a scratch copy, never on his tables', () => {
  const label = BIRTHDAY_BANDS[0]!.gifts[0]!.label
  const doc = 'ru-fixture-2026-10.md'
  const table = ['| id | source | English | Russian | note |', '| --- | --- | --- | --- | --- |', `| G1 | \`src/engine/world/birthday.ts:1\` | \`${label}\` | \`RU-STAND-IN\` | \`APPROVED\` 10.10 |`].join('\n')
  const live = (catalog: Catalog): Live => ({ catalog, seen: new Set() })

  it('the gift label joins its key (hinted on birthday.ts), compiles, and the row flips APPROVED -> LANDED in the scratch copy', () => {
    const dir = tmp()
    writeFileSync(join(dir, doc), `${table}\n`)
    const lv = live(committed)
    const compiled = compile(readRows([doc], dir).rows, lv)
    expect(compiled.outcomes.map((o) => o.disposition)).toEqual(['compiled'])
    expect(compiled.outcomes[0]?.key).toBe(label)
    const plan = planLanded(compiled, lv, Object.fromEntries(compiled.entries), dir)
    expect(plan.changes).toHaveLength(1)
    expect(plan.changes[0]?.after).toContain('`LANDED` 10.10')
    expect(plan.skipped).toEqual([])
    applyLanded(plan.changes, dir)
    expect(readFileSync(join(dir, doc), 'utf8')).toContain('`LANDED` 10.10')
  })

  it('⭐⭐ MUTATION: the same row with the seat stripped from the catalog (the state before L3-T) is SKIPPED – «no call site asks for the key yet» – so the flip is the seat\'s doing', () => {
    const dir = tmp()
    writeFileSync(join(dir, doc), `${table}\n`)
    const stripped: Catalog = { ...committed, keys: { ...committed.keys, [label]: { home: committed.keys[label]!.home, area: committed.keys[label]!.area } } }
    const lv = live(stripped)
    const compiled = compile(readRows([doc], dir).rows, lv)
    const plan = planLanded(compiled, lv, Object.fromEntries(compiled.entries), dir)
    expect(plan.changes).toEqual([])
    expect(plan.skipped.join('\n')).toContain('no call site asks for the key yet')
    expect(readFileSync(join(dir, doc), 'utf8')).toContain('`APPROVED` 10.10')
  })

  it('and the real tables are untouched by any of this (the arms write to a temp directory and the tables directory is read-only here)', () => {
    const rows = readRows(listDocs()).rows
    expect(rows.filter((r) => r.status === 'LANDED' && r.english === label)).toEqual([])
  })
})

// =================================================================================================
// §4 THE SCORE TAIL
// =================================================================================================
describe('§4 the score hole stays LAST in any locale value of the four kid-match keys', () => {
  const catalogOf = (keys: readonly string[]): Catalog => ({ format: 1, count: keys.length, keys: Object.fromEntries(keys.map((k) => [k, { home: ['src/engine/world/matchNews.ts'], area: ['engine'], wrapped: true }])) })
  const real = catalogOf(SCORE_TAIL_KEYS.map((k) => k.key))

  it('the table names exactly the keys the source spells with a trailing score hole – a FIFTH kid-match key must arrive here', () => {
    const fromSource = callKeys.filter((c) => c.file === 'src/engine/world/matchNews.ts' && c.via === 'cp' && /^\{0\}: \{1\} .* \{2\} \{3\}$/.test(c.key)).map((c) => c.key)
    expect([...new Set(fromSource)].sort()).toEqual(SCORE_TAIL_KEYS.map((k) => k.key).sort())
    expect(SCORE_TAIL_KEYS.length).toBe(4)
  })

  it('and it is held against the committed catalog: every named key is there and ends with its hole; a catalog that lost one, or a key that no longer ends in its hole, is red', () => {
    expect(lintScoreTailTable(committed)).toEqual([])
    const lost = lintScoreTailTable(catalogOf(SCORE_TAIL_KEYS.slice(1).map((k) => k.key)))
    expect(lost.map((p) => [p.rule, p.where])).toEqual([['score-tail-table', SCORE_TAIL_KEYS[0]!.key]])
    const moved = lintScoreTailTable(real, [{ key: SCORE_TAIL_KEYS[0]!.key, hole: 2 }])
    expect(moved.map((p) => p.rule)).toEqual(['score-tail-table'])
  })

  // fabricated ASCII values over the real keys' holes: `{0}: {1} X {2} {3}`
  const value = (k: string, tail: string): string => k.replace(' {3}', ` ${tail}`)
  const lint = (ru: Record<string, string>): string[] => lintRu(ru, real).filter((p) => p.rule === 'score-tail').map((p) => p.where)

  it('a value that keeps {3} last, once, is clean (the control – every red below is the mutation, not the fixture)', () => {
    const ru = Object.fromEntries(SCORE_TAIL_KEYS.map((k) => [k.key, value(k.key, '{3}').replace(/(\{1\}) .* (\{2\})/, '$1 STAND-IN $2')]))
    expect(lintRu(ru, real)).toEqual([])
  })

  it('MUTATION 1: a word after the score is red, and the message names the key', () => {
    const k = SCORE_TAIL_KEYS[0]!.key
    const bad = { [k]: '{0}: {1} STAND-IN {2} {3} tail' }
    expect(lint(bad)).toEqual([k])
    expect(lintRu(bad, real).find((p) => p.rule === 'score-tail')?.detail).toContain('END with {3}')
  })

  it('MUTATION 2: the score moved into the middle of the sentence is red', () => {
    const k = SCORE_TAIL_KEYS[1]!.key
    expect(lint({ [k]: '{0}: {3} {1} STAND-IN {2}' })).toEqual([k])
  })

  it('MUTATION 3: a trailing space, a trailing punctuation mark, a doubled score and a score ESCAPED into literal text are red – the plaque\'s split is `endsWith(score)` and nothing looser', () => {
    const k = SCORE_TAIL_KEYS[2]!.key
    for (const bad of ['{0}: {1} STAND-IN {2} {3} ', '{0}: {1} STAND-IN {2} ({3})', '{0}: {1} STAND-IN {2} {3} {3}', '{0}: {1} STAND-IN {2} \\{3\\}']) {
      expect(lint({ [k]: bad }), JSON.stringify(bad)).toEqual([k])
    }
    // a half-escaped score is not a message at all: the ICU rule already refuses it (and the score-tail rule never sees it)
    expect(lintRu({ [k]: '{0}: {1} STAND-IN {2} \\{3}' }, real).map((p) => p.rule)).toEqual(['icu'])
  })

  it('and the rule is the table\'s alone: any other key may put its last hole where the translator likes, and the real ru.json is clean', () => {
    const other = '{0}: {1} beat a different thing {2} {3}'
    const cat = catalogOf([other])
    expect(lintRu({ [other]: '{0}: {3} {1} STAND-IN {2}' }, cat).filter((p) => p.rule === 'score-tail')).toEqual([])
    expect(lintRu(JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>, committed)).toEqual([])
  })
})

// =================================================================================================
// §5 THE FORMATTER-OUTPUT ROW
// =================================================================================================
describe('§5 a row whose English is what a formatter prints compiles into a pattern in formats.ru.json', () => {
  const FIXTURE = (...rows: string[]): string => ['| English form | Russian form | Condition |', '| --- | --- | --- |', ...rows].join('\n')
  const rowsOf = (table: string) => parseTables('fixture.md', table).rows
  const live = (): Live => ({ catalog: committed, seen: seenLiterals })

  it('the registry is code-backed: each example IS the formatter\'s output for its documented sample, each part appears in it exactly once, and the ids and examples are unique', () => {
    expect(FORMAT_EXAMPLES.map((d) => d.example)).toEqual([weekLabel(13, 2031), weekYearLabel(26, 2033)])
    expect(FORMAT_EXAMPLES.map((d) => d.example)).toEqual(["W14 '31", 'W27 2033'])
    expect(new Set(FORMAT_EXAMPLES.map((d) => d.id)).size).toBe(FORMAT_EXAMPLES.length)
    expect(formatIndex().size).toBe(FORMAT_EXAMPLES.length)
    for (const d of FORMAT_EXAMPLES) for (const [name, token] of Object.entries(d.parts)) expect(d.example.match(new RegExp(`(?<![0-9])${token}(?![0-9])`, 'g'))?.length, `${d.id}.${name}`).toBe(1)
  })

  it('⭐ the declared parts are RIGHT: the English pattern renders back to the formatter over weeks before the epoch, season edges and a century turn', () => {
    const pad2 = (n: number): string => String(((n % 100) + 100) % 100).padStart(2, '0')
    const parts = (w: number, y: number): { week: number; year: number; yy: string } => {
      const inSeason = ((Math.floor(w) % 52) + 52) % 52 + 1
      const year = y + Math.floor(Math.floor(w) / 52)
      return { week: inSeason, year, yy: pad2(year) }
    }
    const [short, long] = FORMAT_EXAMPLES
    expect(englishPattern(short!)).toBe("W{week} '{yy}")
    expect(englishPattern(long!)).toBe('W{week} {year}')
    for (const w of [-60, -1, 0, 1, 13, 51, 52, 53, 103, 104, 1133]) {
      for (const y of [1999, 2031, 2099, 2100]) {
        expect(formatMessage(englishPattern(short!), parts(w, y), EN), `weekLabel(${w}, ${y})`).toBe(weekLabel(w, y))
        expect(formatMessage(englishPattern(long!), parts(w, y), EN), `weekYearLabel(${w}, ${y})`).toBe(weekYearLabel(w, y))
      }
    }
  })

  it('⭐ THE REAL ROW: the APPROVED short year compiles to a pattern read from his own cell; `unmatched` is 0; the committed formats.ru.json is exactly that', () => {
    const { rows } = readRows(listDocs())
    const row = rows.find((r) => r.english === "W14 '31" && r.status === 'APPROVED')!
    expect(row, 'the APPROVED short-year row is in his tables').toBeDefined()
    const compiled = compile(rows, live())
    const o = compiled.outcomes.find((x) => x.row === row)!
    expect(o.disposition).toBe('format')
    expect(o.format).toBe('dates.weekLabel')
    // re-derived here from the cell itself (no Russian is written in this file): his two numbers, swapped for the two named holes
    const expected = row.russian!.replace('14', '{week}').replace('31', '{yy}')
    expect(compiled.formats.get('dates.weekLabel')).toBe(expected)
    expect(expected).toContain('{week}')
    expect(expected).toContain('{yy}')
    // and the pattern renders BACK to his example for the sample week (the pattern is what he wrote, with holes)
    expect(formatMessage(expected, { week: 14, yy: '31' }, { locale: 'ru' })).toBe(row.russian)
    expect(compiled.outcomes.filter((x) => x.disposition === 'unmatched')).toEqual([])
    expect(compiled.formats.size).toBe(1)
    expect(serializeFormats(compiled.formats), 'run npm run i18n:import').toBe(readFileSync(FORMATS_PATH, 'utf8'))
    // ru.json did not move for it: a pattern is not a catalog key
    expect(serializeRu(compiled.entries)).toBe(readFileSync('src/i18n/ru.json', 'utf8'))
  })

  it('DRAFT rows that name a formatter example are PENDING (a live formatter), not pending-dead (drift)', () => {
    const draft = rowsOf(FIXTURE("| `W14 '31` | `STAND 14 · '31` | |", "| `W27 2033` | `STAND 27 · 2033` | |"))
    const outs = compile(draft, live()).outcomes
    expect(outs.map((x) => [x.disposition, x.format])).toEqual([['pending', 'dates.weekLabel'], ['pending', 'dates.weekYearLabel']])
  })

  it('MUTATION 1: his Russian that does not carry a part exactly once is `ambiguous-cell` with the reason, and compiles nothing', () => {
    const approved = (ru: string) => rowsOf(FIXTURE(`| \`W14 '31\` | \`${ru}\` | \`APPROVED\` |`))
    for (const [ru, why] of [['STAND 14 only', '«31» 0 time(s)'], ['STAND 14 · 31 · 31', '«31» 2 time(s)'], ['STAND 114 · 31', '«14» 0 time(s)'], ['STAND {14} · 31', 'brace']] as const) {
      const c = compile(approved(ru), live())
      expect(c.outcomes[0]?.disposition, ru).toBe('ambiguous-cell')
      expect(c.outcomes[0]?.why, ru).toContain(why)
      expect(c.formats.size, ru).toBe(0)
    }
    // the control: the same row with both numbers once
    const ok = compile(approved("STAND 14 · '31"), live())
    expect(ok.outcomes[0]?.disposition).toBe('format')
    expect(ok.formats.get('dates.weekLabel')).toBe("STAND {week} · '{yy}")
  })

  it('MUTATION 2: two APPROVED rows that disagree on one formatter compile to nothing and are both reported (the key rule, for patterns)', () => {
    const two = rowsOf(FIXTURE("| `W14 '31` | `ONE 14 · '31` | `APPROVED` |", "| `W14 '31` | `TWO 14 · '31` | `APPROVED` |"))
    const c = compile(two, live())
    expect(c.outcomes.map((x) => x.disposition)).toEqual(['conflict', 'conflict'])
    expect(c.formats.size).toBe(0)
    const agree = compile(rowsOf(FIXTURE("| `W14 '31` | `ONE 14 · '31` | `APPROVED` |", "| `W14 '31` | `ONE 14 · '31` | `APPROVED` |")), live())
    expect(agree.formats.get('dates.weekLabel')).toBe("ONE {week} · '{yy}")
  })

  it('MUTATION 3: the registry is what recognises a row – with no registry entry the same APPROVED row is `unmatched` drift again; a catalog KEY with that English wins over a format', () => {
    const row = rowsOf(FIXTURE("| `W14 '31` | `STAND 14 · '31` | `APPROVED` |"))
    expect(compile(row, { catalog: committed, seen: seenLiterals, formats: new Map() }).outcomes[0]?.disposition).toBe('unmatched')
    const withKey: Catalog = { ...committed, keys: { ...committed.keys, "W14 '31": { home: ['src/x.ts'], area: ['engine'] } } }
    const c = compile(row, { catalog: withKey, seen: seenLiterals })
    expect(c.outcomes[0]?.disposition).toBe('compiled')
    expect(c.formats.size).toBe(0)
  })

  it('MUTATION 4: `patternFromExample` is whole-number exact – 14 does not match inside 114 or 140, and the year is found beside the week', () => {
    const def = FORMAT_EXAMPLES[0]!
    expect(patternFromExample(def, "STAND 14 '31")).toEqual({ pattern: "STAND {week} '{yy}" })
    expect('error' in patternFromExample(def, "STAND 140 '31")).toBe(true)
    expect(patternFromExample(def, "'31 STAND 14")).toEqual({ pattern: "'{yy} STAND {week}" })
  })

  it('`--mark-landed` leaves a format row APPROVED and says why (no display shell reads the table yet)', () => {
    const dir = tmp()
    writeFileSync(join(dir, 'ru-fixture-2026-10.md'), `${FIXTURE("| `W14 '31` | `STAND 14 · '31` | `APPROVED` |")}\n`)
    const lv = live()
    const compiled = compile(readRows(['ru-fixture-2026-10.md'], dir).rows, lv)
    const plan = planLanded(compiled, lv, {}, dir)
    expect(plan.changes).toEqual([])
    expect(plan.skipped.join('\n')).toContain('no display shell consults formats.ru.json yet')
  })

  it('lintFormats: an orphan id, a dropped or invented part, a long dash and a pattern that does not parse are each red; the committed file is clean', () => {
    const dash = String.fromCharCode(0x2014)
    expect(lintFormats(JSON.parse(readFileSync(FORMATS_PATH, 'utf8')) as Record<string, string>)).toEqual([])
    expect(lintFormats({ 'dates.weekLabel': 'STAND {week} {yy}' })).toEqual([])
    expect(lintFormats({ 'dates.nowhere': 'x' }).map((p) => p.rule)).toEqual(['format-orphan'])
    expect(lintFormats({ 'dates.weekLabel': 'STAND {week}' }).map((p) => [p.rule, p.detail])).toEqual([['parity', expect.stringContaining('drops {yy}')]])
    expect(lintFormats({ 'dates.weekLabel': 'STAND {week} {yy} {extra}' }).map((p) => [p.rule, p.detail])).toEqual([['parity', expect.stringContaining('reads {extra}')]])
    expect(lintFormats({ 'dates.weekLabel': `STAND {week} ${dash} {yy}` }).map((p) => p.rule)).toEqual(['em-dash'])
    expect(lintFormats({ 'dates.weekLabel': 'STAND {week' }).map((p) => p.rule)).toEqual(['icu'])
  })

  it('THE GATE: a hand-edited formats.ru.json is `formats-stale` red; an untouched copy is green', () => {
    const dir = tmp()
    const path = join(dir, 'formats.ru.json')
    writeFileSync(path, readFileSync(FORMATS_PATH, 'utf8'))
    expect(runGate({ formatsPath: path }).problems).toEqual([])
    writeFileSync(path, readFileSync(FORMATS_PATH, 'utf8').replace('{yy}', '{yy}!'))
    expect(runGate({ formatsPath: path }).problems.map((p) => p.rule)).toEqual(['formats-stale'])
    writeFileSync(path, '{}\n')
    expect(runGate({ formatsPath: path }).problems.map((p) => p.rule)).toEqual(['formats-stale'])
    expect(runGate().lines.join('\n')).toMatch(/formats {3}1 formatter pattern\(s\) of 2 registered/)
  })

  it('formats.ru.json is NEVER shipped by the lazy glob (it matches ru.json / es.json by name), and nothing under src/ imports it yet', () => {
    const source = readFileSync('src/i18n/catalog.ts', 'utf8')
    const glob = /import\.meta\.glob<[^>]*>\(\s*'([^']+)'/.exec(source)?.[1]
    expect(glob).toBeTruthy()
    const matched = globSync(glob!, { cwd: 'src/i18n' })
    expect(matched).not.toContain('formats.ru.json')
    expect(globSync('./*.json', { cwd: 'src/i18n' }), 'the control: a sweep WOULD have shipped it').toContain('formats.ru.json')
    expect(readFileSync('src/i18n/index.ts', 'utf8')).not.toContain('formats.ru')
    expect(source).not.toContain('formats.ru')
  })
})
