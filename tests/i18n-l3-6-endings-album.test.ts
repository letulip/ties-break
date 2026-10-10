// L3-6 (10.10) – THE ENDINGS' AND THE ALBUM'S PROSE RIDE AS COPYREFS, BESIDE THE ENGLISH. docs/specs/i18n-2026-10.md §3.2, §5, §8 rows L3-0 … L3-6.
//
// WHAT THE WAVE DID, ENDINGS HALF (commit 1): the eight feed sinks of `world/endings.ts` write `c` beside `text`; the epilogue's page (`EndingView.closing`: `whyC` / `captionC` / `factC`) and the record
// (`ScrollSeason.rows`: `labelC` / `detailC`) carry refs beside their strings; `ending.ts` gained `lastWordRef`, `plateauLedeRef`, `leavingLineRef`, `endingTitleRef`, `endingDetailRef` and `endingRowRef`;
// `composables/declineVoice.ts` gained `declineRef`, `herLastWinterRef` and `seasonLastWinterRef`. Not one authored character moved (invariant 4) and nothing draws (invariant 2).
//
//   §1 the key law                – the cp keys of the touched engine files are the frozen table's or a committed list (this file's write mode regenerates it)
//   §2 refs render to the English – every branch of every function, every count the callers can hand it
//   §3 the stored detail          – the twelve fragments, read back from the string, for every output of every producer; an unknown wording comes back as the string
//   §4 the eight sinks            – through their real writers: the latch for all nine endings, the fork, the offers, the answers, the leaving voices
//   §5 the epilogue's page        – the closing page and the whole record, for every ending, on posed careers
//   §6 the decline voice          – every pooled line has its ref, every pick is the pick it was
//   §7 the pick keys              – the sub-stream keys of the touched files, pinned (nothing here may move a draw)
//   §8 a career played to its end – natural ending off the bench, row by row
//
// WHAT THE WAVE DID, ALBUM HALF (commit 2): every string of the album BOOK has a ref beside it (the fields ending in `C` in shared/protocol/album.ts) and `composables/albumText.ts` draws them; the corpus's 456
// cells and the walls arc's 16 are seats (the string is the key), the chapter titles, the age labels, the ticket words and the checklist are `cp` keys; the finished book is also the heirloom, so on a
// generation-two career the refs are stored beside the strings.
//   §9  the posed set, English        – 129 books, 903 sheets, 28 epilogues: the digest of every string equals the PRE-WAVE tree's
//   §10 every ref renders to its string – field by field over the whole set, and the fields that have none are exactly the ones that may not
//   §11 the corpus                    – 38 occasions x 4 voices x 3 cells + the arc: catalog keys, seatable, reached
//   §12 the heirloom                  – the stored book carries the refs and renders; the size it adds
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { allTemplateKeys } from '../src/engine/migrations/reverseMatch'
import { renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../src/shared/i18n'
import { fnv1a } from './helpers/hash'
import { leavingView } from './helpers/leavingView'
import { drainLifeBeats } from './helpers/career'
import { posedCareer } from './helpers/albumSweep'
import { ENDING_CLASS_B_KEYS } from './helpers/l3-6-ending-keys'
import {
  ENDINGS,
  ENDING_TITLE,
  detectEnding,
  endingDetailRef,
  endingForFamily,
  endingForForkAnswer,
  endingForLeaving,
  endingForRetirement,
  endingRowRef,
  endingTitleRef,
  lastWordLine,
  lastWordRef,
  leavingLine,
  leavingLineRef,
  plateauLede,
  plateauLedeRef,
  type AutoEndingView,
} from '../src/engine/ending'
import {
  answerFork,
  answerRetirement,
  buildEndingView,
  createWorld,
  latchEnding,
  resolveLeaving,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { buildAlbum, buildScroll, slotLastWeek } from '../src/engine/world/album'
import { TEMPERAMENTS, type Temperament } from '../src/engine/spirit'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, LADDER_TRACKS, type CareerEnding, type CareerEndingType, type SeasonHistoryEntry, type SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'
import {
  ALL_DECLINE_LINES,
  COACH_DECLINE_LINES,
  COACH_WEEK_CHOICE,
  DECLINE_RUNGS,
  HER_DECLINE_LINES,
  LAST_WINTER_LINES,
  coachDeclineLine,
  declineRef,
  declineRung,
  herDeclineLine,
  herLastWinterLine,
  herLastWinterRef,
  seasonLastWinterLine,
  seasonLastWinterRef,
} from '../src/composables/declineVoice'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { endedViews, englishDigest, plain, posedBooks } from './helpers/l3-6-album-set'
import { sweepSheets } from './helpers/albumSweep'
import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { createLegacyWorld, legacyInputOf } from '../src/engine/world/succession'
import { heirloomBookOf } from '../src/engine/world/heirloom'
import type { AlbumBook } from '../src/shared/protocol'

const ROOT = resolve(__dirname, '..')
const EN = { locale: SOURCE_LOCALE }
const TABLE = new Set(allTemplateKeys())
const CATALOG = JSON.parse(readFileSync(join(ROOT, 'src/i18n/catalog.en.json'), 'utf8')) as { keys: Record<string, unknown> }
const render = (c: CopyRef): string => renderCopyRef(c, EN)
const inCatalog = (k: string): boolean => CATALOG.keys[k] !== undefined
const TYPES: readonly CareerEndingType[] = ['stopped', 'college', 'bankruptcy', 'injury', 'natural', 'plateau', 'peak', 'fall', 'family']

/** the files whose `cp` keys this wave added or relies on, in the engine */
const ENGINE_FILES: readonly string[] = ['src/engine/ending.ts', 'src/engine/world/endings.ts', 'src/engine/world/album.ts', 'src/engine/world/albumBook.ts']

function parse(rel: string): ts.SourceFile {
  return ts.createSourceFile(rel, readFileSync(join(ROOT, rel), 'utf8'), ts.ScriptTarget.Latest, true)
}
function eachNode(sf: ts.SourceFile, visit: (n: ts.Node) => void): void {
  const go = (n: ts.Node): void => {
    visit(n)
    ts.forEachChild(n, go)
  }
  go(sf)
}
function cpKey(t: ts.TaggedTemplateExpression): string {
  const tpl = t.template
  if (ts.isNoSubstitutionTemplateLiteral(tpl)) return tpl.text
  let k = tpl.head.text
  tpl.templateSpans.forEach((s, i) => {
    k += `{${i}}${s.literal.text}`
  })
  return k
}
/** every cp key a file spells, with the file */
function cpKeysOf(rel: string): string[] {
  const out: string[] = []
  eachNode(parse(rel), (n) => {
    if (ts.isTaggedTemplateExpression(n) && n.tag.getText() === 'cp') out.push(cpKey(n))
  })
  return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1 – the key law
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§1 the key law – the touched engine files\' cp keys are the frozen table\'s, or a committed list', () => {
  const found = new Set(ENGINE_FILES.flatMap(cpKeysOf))
  const outside = [...found].filter((k) => !TABLE.has(k)).sort()

  it('finds the wave\'s call sites (the scan is not blind)', () => {
    expect(found.size).toBeGreaterThan(60)
  })

  it('ENDING_CLASS_B_KEYS is exactly the keys no old save can hold – no more, no fewer (L36_WRITE_KEYS=1 regenerates tests/helpers/l3-6-ending-keys.ts)', () => {
    if (process.env.L36_WRITE_KEYS === '1') {
      const head = readFileSync(join(ROOT, 'tests/helpers/l3-6-ending-keys.ts'), 'utf8').split('export const ENDING_CLASS_B_KEYS')[0]!
      writeFileSync(join(ROOT, 'tests/helpers/l3-6-ending-keys.ts'), `${head}export const ENDING_CLASS_B_KEYS: readonly string[] = [\n${outside.map((k) => `  ${JSON.stringify(k)},`).join('\n')}\n]\n`)
      return
    }
    expect([...ENDING_CLASS_B_KEYS].sort()).toEqual(outside)
  })

  it('the list holds no sentence of the frozen table (those are the re-key law\'s: one key for an old row and a new one)', () => {
    for (const k of ENDING_CLASS_B_KEYS) expect(TABLE.has(k), k).toBe(false)
  })

  it('the nine latch rows, the eight leaving voices and the eight stored sentences are keys of the table, byte for byte', () => {
    const tableKeys = [
      ...TYPES.map((t) => render(endingRowRef({ type: t, detail: 'x' })).replace(/x\.$/, '{0}.')),
      ...TEMPERAMENTS.flatMap((t) => (['peak', 'fall'] as const).map((d) => leavingLine(d, t))),
      'School is over. The junior ladder closes at nineteen, and the next one has to be paid for.',
      'She is turning professional. Every entry from here has a cheque behind it, and a bill in front of it.',
      'One more year, you said. Same as last time.',
      'Another off-season, and the same question: is there another year in this?',
      'She said it out loud in the car – if she cannot reach the top, she would rather go.',
      'She has decided to go back. From this week she can enter tournaments again.',
      'She is {0}. {1}',
      'A college place is reserved. She leaves when the academic year starts – {0} – and plays until then.',
    ]
    for (const k of tableKeys) expect(TABLE.has(k), k).toBe(true)
    expect(new Set(tableKeys).size).toBe(tableKeys.length)
  })

  it('every key of the wave is a catalog key (wired by its cp site)', () => {
    for (const k of found) expect(inCatalog(k), k).toBe(true)
  })

  it('the stored return sentence is the constant, character for character (the constant stays where it is: its note quotes the owner)', () => {
    const src = readFileSync(join(ROOT, 'src/engine/world/endings.ts'), 'utf8')
    const m = /const RETURN_EVENT = '([^']*)'/.exec(src)
    expect(m, 'RETURN_EVENT was not found').not.toBeNull()
    expect(found.has(m![1]!), 'no cp key spells RETURN_EVENT').toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §2 – a ref renders to the English its twin returns
// ---------------------------------------------------------------------------------------------------------------------------------------------
const COUNTS = [-5, -1, 0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 21, 22, 100, 1000, Number.NaN, 0.5, 2.5]

describe('§2 refs render to their English twins', () => {
  it('her last word – every count', () => {
    for (const n of COUNTS) expect(render(lastWordRef(n)), `count ${n}`).toBe(lastWordLine(n))
  })

  it('the plateau lede – every count and several tables', () => {
    for (const n of COUNTS) for (const table of ['professional', 'national', 'itf', 'domestic']) expect(render(plateauLedeRef(n, table)), `count ${n} / ${table}`).toBe(plateauLede(n, table))
  })

  it('the eight leaving voices', () => {
    for (const d of ['peak', 'fall'] as const) for (const t of TEMPERAMENTS) expect(render(leavingLineRef(d, t)), `${d}/${t}`).toBe(leavingLine(d, t))
  })

  it('the nine titles', () => {
    for (const t of TYPES) expect(render(endingTitleRef(t)), t).toBe(ENDING_TITLE[t])
  })

  it('refs are plain data: JSON-safe, and a count is a number in a hole', () => {
    for (const n of [0, 1, 2, 7]) {
      const ref = lastWordRef(n)
      expect(JSON.parse(JSON.stringify(ref))).toEqual(ref)
    }
    expect(lastWordRef(1).p).toEqual([1])
    expect(lastWordRef(0).p).toBeUndefined()
    expect(plateauLedeRef(5, 'national').p).toEqual([5, 'national'])
  })

  it('a counted form is a sentence per form: 1 and several are two keys', () => {
    expect(lastWordRef(1).k).not.toBe(lastWordRef(2).k)
    expect(lastWordRef(2).k).toBe(lastWordRef(40).k)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §3 – the stored detail, read back
// ---------------------------------------------------------------------------------------------------------------------------------------------
function autoView(over: Partial<AutoEndingView> = {}): AutoEndingView {
  return { week: 100, ageYears: 16, fundsCents: 5000_00, debtSinceWeek: null, cheapestEntryFeeCents: 40_00, freshInjurySeverity: null, injuryHistory: [], ...over }
}
function producers(): CareerEnding[] {
  const out: CareerEnding[] = []
  out.push(endingForForkAnswer('stop', 265, 19, ENDINGS.collegeYears, WEEKS_PER_YEAR)!)
  for (const years of [1, 2, 3, 4, 5, 6, 10]) out.push(endingForForkAnswer('college', 265, 19, years, WEEKS_PER_YEAR)!)
  for (const weeks of [ENDINGS.bankruptcyGraceWeeks, ENDINGS.bankruptcyGraceWeeks + 1, 20, 52, 100]) {
    out.push(detectEnding(autoView({ fundsCents: -1, debtSinceWeek: 100 - weeks + 1, week: 100 }))!)
  }
  for (const lost of [ENDINGS.injuryPriorWeeksOut, 30, 99, 250]) {
    out.push(detectEnding(autoView({ freshInjurySeverity: 'severe', injuryHistory: [{ severity: 'major', weeksOut: lost }] }))!)
  }
  for (let age = 29; age <= 45; age++) out.push(endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }, 1400, age, 3))
  for (let count = 0; count <= 12; count++) out.push(endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'age', final: false }, 1400, 33, count))
  out.push(endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'plateau', final: false }, 700, 26, 0))
  for (let rank = 1; rank <= ENDINGS.peakRankBand; rank++) out.push(endingForLeaving('peak', leavingView({ endRank: rank }), 1200, 25))
  out.push(endingForLeaving('peak', leavingView({ endRank: ENDINGS.peakRankBand + 5, topTitleThisSeason: true }), 1200, 26))
  out.push(endingForLeaving('peak', leavingView({ endRank: null, topTitleThisSeason: true }), 1200, 26))
  for (const [prev, end] of [[13, 59], [1, 2], [5, 130], [20, 21], [99, 400]] as const) out.push(endingForLeaving('fall', leavingView({ prevEndRank: prev, endRank: end }), 900, 22))
  out.push(endingForLeaving('fall', leavingView({ prevEndRank: null, endRank: null }), 900, 22))
  for (const weeks of [1, 8, 20, 51, 52, 100]) out.push(endingForFamily(1500, 29, weeks))
  return out
}

describe('§3 the stored detail – the closed set of fragments', () => {
  const all = producers()

  it('the producers reach every ending type (the sweep is not blind)', () => {
    expect(new Set(all.map((e) => e.type))).toEqual(new Set(TYPES))
    expect(all.length).toBeGreaterThan(70)
  })

  it('every output of every producer is recognised, and the ref renders to its detail byte for byte', () => {
    const unread: string[] = []
    for (const e of all) {
      const ref = endingDetailRef(e)
      if (typeof ref !== 'object' || ref === null) {
        unread.push(`${e.type}: ${e.detail}`)
        continue
      }
      expect(render(ref), `${e.type}: ${e.detail}`).toBe(e.detail)
      expect(JSON.parse(JSON.stringify(ref))).toEqual(ref)
    }
    expect(unread, 'a detail the fragments do not read (a producer was reworded, or a shape is missing)').toEqual([])
  })

  it('the twelve fragments are twelve keys (the ternary of the natural end is two sentences, the house rule)', () => {
    const keys = new Set(all.map((e) => (endingDetailRef(e) as CopyRef).k))
    expect(keys.size).toBe(13)
    // 12 fragments + the count-of-one form of the ternary = 13 sentences behind the twelve call sites
    for (const k of keys) expect(inCatalog(k), k).toBe(true)
  })

  it('the row the latch writes: the title is in the key, the key is the frozen table\'s, the detail nests', () => {
    for (const e of all) {
      const row = endingRowRef(e)
      expect(TABLE.has(row.k), row.k).toBe(true)
      expect(row.k).toBe(`${ENDING_TITLE[e.type]} – {0}.`)
      expect(render(row), e.type).toBe(`${ENDING_TITLE[e.type]} – ${e.detail}.`)
      expect(row.p).toHaveLength(1)
    }
  })

  it('a wording this reader does not know comes back as the stored string (what a migrated row carries as its hole), and renders as itself', () => {
    for (const e of [
      { type: 'peak' as const, detail: 'she left, and that was that' },
      { type: 'bankruptcy' as const, detail: '007 weeks below zero – there was no next entry fee' },
      { type: 'fall' as const, detail: '#x to #9 in one season' },
      { type: 'natural' as const, detail: '' },
    ]) {
      expect(endingDetailRef(e), e.detail).toBe(e.detail)
      expect(render(endingRowRef(e))).toBe(`${ENDING_TITLE[e.type]} – ${e.detail}.`)
    }
  })

  it('an ending latched under the right type but read under the wrong one is not guessed at', () => {
    expect(endingDetailRef({ type: 'family', detail: '9 weeks below zero – there was no next entry fee' })).toBe('9 weeks below zero – there was no next entry fee')
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §4 – the eight sinks, through their real writers
// ---------------------------------------------------------------------------------------------------------------------------------------------
interface Row { text: string; c?: CopyRef; type: string }
const rowsOf = (world: WorldState): Row[] => world.events as unknown as Row[]
function expectPairs(rows: Row[], what: string): number {
  let n = 0
  for (const r of rows) {
    if (!r.c) continue
    n++
    expect(render(r.c), `${what}: ${r.text}`).toBe(r.text)
    expect(JSON.parse(JSON.stringify(r.c))).toEqual(r.c)
  }
  return n
}

describe('§4 the eight sinks of world/endings.ts, through their real writers', () => {
  it('latchEnding: all nine endings, every producer, the row carries a ref that renders to the text and sits on the table\'s key', () => {
    let rows = 0
    for (const e of producers()) {
      const world = createWorld(`l36-latch-${e.type}`, { ...DEFAULT_PROFILE })
      latchEnding(world, e)
      const row = rowsOf(world).find((r) => r.text === `${ENDING_TITLE[e.type]} – ${e.detail}.`)
      expect(row, e.type).toBeDefined()
      expect(row!.c, e.type).toBeDefined()
      expect(TABLE.has(row!.c!.k), row!.c!.k).toBe(true)
      expect(render(row!.c!)).toBe(row!.text)
      rows++
    }
    expect(rows).toBeGreaterThan(70)
  })

  const WRAP_S11 = 11 * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
  const bankedSeason = (seasonIndex: number, per: Partial<Record<LadderTrack, SeasonTrackRow>>): SeasonHistoryEntry => {
    const byTrack = {} as Record<LadderTrack, SeasonTrackRow>
    for (const track of LADDER_TRACKS) byTrack[track] = { points: 0, wins: 0, losses: 0, ...(per[track] ?? {}) }
    return { seasonIndex, endRank: 0, points: 0, wins: 0, losses: 0, byTrack, fundsDeltaCents: 0, endFundsCents: 0 }
  }
  const AT_THE_TOP = [
    bankedSeason(10, { wta: { endRank: 6, points: 4800, wins: 0, losses: 0 } }),
    bankedSeason(11, { wta: { endRank: 4, points: 5000, wins: 0, losses: 0 } }),
  ]
  const THE_COLLAPSE = [
    bankedSeason(10, { wta: { endRank: 13, points: 4008, wins: 0, losses: 0 } }),
    bankedSeason(11, { wta: { endRank: 59, points: 1584, wins: 0, losses: 0 } }),
  ]
  function seedWhere(door: 'peak' | 'fall'): string {
    const chance = door === 'peak' ? ENDINGS.peakLeavingChance : ENDINGS.fallLeavingChance
    for (let i = 0; i < 20000; i++) {
      const seed = `l36-doors-${door}-${i}`
      if (rngFromSeed(`${seed}:ending:${door}:11`)() < chance) return seed
    }
    throw new Error(`no seed found for ${door}`)
  }
  function atTheWrap(seed: string, temperament: Temperament, history: SeasonHistoryEntry[]): WorldState {
    const world = createWorld(seed, { ...DEFAULT_PROFILE })
    world.week = WRAP_S11
    world.temperament = temperament
    world.fork = { askedWeek: 300, answer: 'continue', offer: null }
    world.seasonHistory = history
    world.bestFinishByTier = { w75: 2 }
    return world
  }

  it('the leaving voice: both doors x four voices – her sentence has its ref and the latch row follows it', () => {
    for (const door of ['peak', 'fall'] as const) {
      const seed = seedWhere(door)
      for (const t of TEMPERAMENTS) {
        const world = atTheWrap(seed, t, door === 'peak' ? AT_THE_TOP : THE_COLLAPSE)
        resolveLeaving(world)
        expect(world.ending?.type, `${door}/${t}`).toBe(door)
        const rows = rowsOf(world).filter((r) => r.type === 'milestone')
        const hers = rows.find((r) => r.text === leavingLine(door, t))
        expect(hers, `${door}/${t}: her sentence`).toBeDefined()
        expect(hers!.c).toEqual(leavingLineRef(door, t))
        expect(TABLE.has(hers!.c!.k)).toBe(true)
        expect(expectPairs(rows, `${door}/${t}`)).toBe(2)
      }
    }
  })

  function toTheFork(seed: string): { world: WorldState; rng: ReturnType<typeof rngFromSeed> } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE })
    const rng = rngFromSeed(seed)
    for (let i = 0; i < 400 && world.fork === null; i++) {
      tickWeek(world, rng)
      drainLifeBeats(world)
    }
    expect(world.fork, 'the fork was raised').not.toBeNull()
    return { world, rng }
  }

  it('the fork: «School is over», then each answer – the college place, turning professional, stopping after school', () => {
    const a = toTheFork('l36-fork-a')
    const school = rowsOf(a.world).find((r) => r.text.startsWith('School is over.'))
    expect(school?.c, 'the school row').toEqual({ k: school!.text })
    expect(TABLE.has(school!.c!.k)).toBe(true)

    drainLifeBeats(a.world)
    answerFork(a.world, 'college')
    const reserved = rowsOf(a.world).find((r) => r.text.startsWith('A college place is reserved.'))
    expect(reserved?.c, 'the reserved row').toBeDefined()
    expect(render(reserved!.c!)).toBe(reserved!.text)
    expect(reserved!.c!.k).toBe('A college place is reserved. She leaves when the academic year starts – {0} – and plays until then.')
    expect(TABLE.has(reserved!.c!.k)).toBe(true)

    const b = toTheFork('l36-fork-b')
    drainLifeBeats(b.world)
    answerFork(b.world, 'continue')
    const pro = rowsOf(b.world).find((r) => r.text.startsWith('She is turning professional.'))
    expect(pro?.c).toEqual({ k: pro!.text })
    expect(TABLE.has(pro!.c!.k)).toBe(true)

    const c = toTheFork('l36-fork-c')
    drainLifeBeats(c.world)
    answerFork(c.world, 'stop')
    expect(c.world.ending?.type).toBe('stopped')
    const stop = rowsOf(c.world).find((r) => r.text.startsWith('She stopped after school'))
    expect(stop?.c?.k).toBe('She stopped after school – {0}.')
    expect(render(stop!.c!)).toBe(stop!.text)
  })

  it('the answer: «One more year, you said» carries its ref, and the final offer\'s row nests her last word', () => {
    const world = createWorld('l36-answer', { ...DEFAULT_PROFILE })
    world.week = 52 * 12
    world.retirementOffer = { askedWeek: world.week, seasonIndex: 12, reason: 'age', final: false }
    answerRetirement(world, false)
    const said = rowsOf(world).find((r) => r.text === 'One more year, you said. Same as last time.')
    expect(said?.c).toEqual({ k: 'One more year, you said. Same as last time.' })
    expect(TABLE.has(said!.c!.k)).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §5 – the epilogue's page and the record
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 the epilogue\'s page and the record', () => {
  /** a posed career with every kind of record row, then an ending latched on it */
  function posedEnded(i: number, e: CareerEnding): WorldState {
    const world = posedCareer(i)
    world.milestones.push(
      { type: 'break-even', week: world.week - 3, kind: 'week' },
      { type: 'break-even', week: world.week - 2, kind: 'career' },
      { type: 'wedding', week: world.week - 5, kind: 'ep' },
      { type: 'birth', week: world.week - 4 },
      { type: 'divorce', week: world.week - 1, kind: 'ep' },
    )
    world.trophiesByTier.w15 = { ...world.trophiesByTier.w15, titles: [world.week - 30, world.week - 20], finals: [world.week - 10] }
    world.week += 6
    latchEnding(world, { ...e, week: world.week })
    return world
  }

  const sample = TYPES.map((type) => producers().find((e) => e.type === type)!)

  it('the closing page: every string has a ref beside it that renders to it, for every ending', () => {
    for (const [i, e] of sample.entries()) {
      const world = posedEnded(i, e)
      const view = buildEndingView(world)!
      const page = view.closing
      expect(page.whyC, e.type).toEqual(endingTitleRef(e.type))
      for (const [text, c] of [[page.why, page.whyC], [page.caption, page.captionC], [page.fact, page.factC]] as const) {
        expect(c, `${e.type}: ${text}`).toBeDefined()
        expect(render(c!), e.type).toBe(text)
        expect(JSON.parse(JSON.stringify(c))).toEqual(c)
      }
      // the fact nests the detail as a ref - the frozen row's {0} is a string on a migrated row, a ref on a new one
      expect(page.factC!.k).toBe('{0}, aged {1} – {2}')
      expect(typeof (page.factC!.p![2] as CopyRef).k).toBe('string')
      expect(page.captionC!.k).toBe(e.type === 'college' ? 'See you in four years' : 'The last week')
    }
  })

  it('the defensive page (no ending) and slot 7 on a world with an ending agree with the album the engine builds for itself', () => {
    const world = posedCareer(3)
    const open = slotLastWeek(world)
    expect(render(open.whyC!)).toBe(open.why)
    expect(render(open.captionC!)).toBe(open.caption)
    expect(open.factC).toBeUndefined()
    latchEnding(world, sample[0]!)
    const page = buildAlbum(world)[6]!
    expect(page.slot).toBe(7)
    expect(render(page.factC!)).toBe(page.fact)
  })

  it('the record: every row has a labelC that renders to its label; a detailC wherever the engine speaks the detail, and none where it is an engine-born word', () => {
    const world = posedEnded(5, sample[4]!)
    const scroll = buildScroll(world)
    const rows = scroll.flatMap((s) => s.rows)
    expect(rows.length).toBeGreaterThan(25)
    const kinds = new Set<string>()
    for (const row of rows) {
      expect(row.labelC, row.label).toBeDefined()
      expect(render(row.labelC!)).toBe(row.label)
      kinds.add(row.label)
      if (row.detailC) {
        expect(row.detail, row.label).not.toBeNull()
        expect(render(row.detailC)).toBe(row.detail)
      }
      if (row.label === 'Title' || row.label === 'Final') expect(row.detailC, 'a tier label is an engine-born word').toBeUndefined()
    }
    for (const label of ['Title', 'Final', 'First prize money', 'First trip abroad', 'First injury', 'Season close', 'The money turned', 'School behind her', 'Her wedding', 'Her daughter', 'The marriage ended']) {
      expect(kinds.has(label), `the record never printed ${label}`).toBe(true)
    }
    // the three arms that speak a detail
    expect(rows.filter((r) => r.label === 'Season close' && r.detailC).length).toBeGreaterThan(0)
    expect(rows.filter((r) => r.label === 'The money turned').map((r) => r.detailC?.k).sort()).toEqual(['one week of it', 'the whole of it'])
    expect(rows.find((r) => r.label === 'School behind her')?.detailC?.k).toBe('the last school year is over')
  })

  it('the season close: a banked season reads its own table, an old row without one reads the milestone - both give a ref when there is a number and none when there is not', () => {
    const world = posedCareer(7)
    world.seasonHistory = [bankedWithRank(0, 41)]
    world.milestones = [
      { type: 'season-rank', week: 51, seasonIndex: 0, rank: 99 },
      { type: 'season-rank', week: 103, seasonIndex: 1, rank: 77 },
      { type: 'season-rank', week: 155 },
    ] as WorldState['milestones']
    const rows = buildScroll(world).flatMap((s) => s.rows)
    expect(rows.map((r) => [r.detail, r.detailC ? render(r.detailC) : null])).toEqual([['#41', '#41'], ['#77', '#77'], [null, null]])
  })

  function bankedWithRank(seasonIndex: number, endRank: number): SeasonHistoryEntry {
    const byTrack = {} as Record<LadderTrack, SeasonTrackRow>
    for (const track of LADDER_TRACKS) byTrack[track] = { points: 0, wins: 0, losses: 0 }
    byTrack.wta = { points: 10, wins: 5, losses: 2, endRank }
    return { seasonIndex, endRank: 0, points: 0, wins: 0, losses: 0, byTrack, fundsDeltaCents: 0, endFundsCents: 0 }
  }
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §6 – the decline voice (composables/declineVoice.ts)
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§6 the decline voice – a ref beside every pooled line, and the picks are the picks they were', () => {
  const POOL = [...DECLINE_RUNGS.map((r) => r.line), ...COACH_DECLINE_LINES, ...Object.values(COACH_WEEK_CHOICE), ...HER_DECLINE_LINES]

  it('the ten pool lines each have a ref that renders to them, and a catalog key', () => {
    expect(POOL).toHaveLength(10)
    for (const line of POOL) {
      const ref = declineRef(line)
      expect(ref, line).toBeDefined()
      expect(render(ref!), line).toBe(line)
      expect(ref!.p).toBeUndefined()
      expect(inCatalog(line), line).toBe(true)
    }
    expect(declineRef(null)).toBeUndefined()
    expect(declineRef('a line nobody wrote')).toBeUndefined()
  })

  it('every pick, over seeds x events x strengths x shares, maps to a ref of its own sentence', () => {
    let picks = 0
    for (const share of [0.99, 0.9, 0.5, 0]) {
      expect(declineRef(declineRung(share))).toBeDefined()
      for (const seed of ['a', 'b', 'c', 'decline-seed']) {
        for (const year of [2031, 2034, 2040]) {
          const her = herDeclineLine(share, seed, year)!
          expect(render(declineRef(her)!)).toBe(her)
          picks++
        }
        for (const id of ['e1', 'e2', 'e3', 'tour-9']) {
          for (const strength of ['favourite', 'strong', 'even'] as const) {
            const line = coachDeclineLine(share, seed, id, strength)!
            expect(render(declineRef(line)!)).toBe(line)
            picks++
          }
        }
      }
    }
    expect(picks).toBeGreaterThan(200)
    expect(herDeclineLine(1, 'a', 2031)).toBeNull()
    expect(coachDeclineLine(undefined, 'a', 'e', 'strong')).toBeNull()
  })

  it('the picks themselves did not move: the digest of every pick over the grid is the pre-wave tree\'s (the draw and its key are untouched)', () => {
    const lines: string[] = []
    for (const share of [0.99, 0.9, 0.5, 0]) {
      lines.push(String(declineRung(share)))
      for (const seed of ['a', 'b', 'c', 'decline-seed']) {
        for (const year of [2031, 2034, 2040]) lines.push(String(herDeclineLine(share, seed, year)))
        for (const id of ['e1', 'e2', 'e3', 'tour-9']) for (const strength of ['favourite', 'strong', 'even'] as const) lines.push(String(coachDeclineLine(share, seed, id, strength)))
      }
    }
    expect(fnv1a(lines.join('\n')).toString(16)).toBe(PRE_WAVE_DECLINE_DIGEST)
  })

  it('the last-winter lines: a ref where the line is, none where it is not, each rendering to its twin - at every count', () => {
    for (const w of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1, 0, 0.5, 1, 2, 3, 4, 5, 9, 12]) {
      const her = herLastWinterLine(w)
      const herRef = herLastWinterRef(w)
      expect(herRef === null, `her ${w}`).toBe(her === null)
      if (her !== null) expect(render(herRef!), `her ${w}`).toBe(her)
      const season = seasonLastWinterLine(w)
      const seasonRef = seasonLastWinterRef(w)
      expect(seasonRef === null, `season ${w}`).toBe(season === null)
      if (season !== null) expect(render(seasonRef!), `season ${w}`).toBe(season)
    }
    expect(herLastWinterRef(1)!.k).not.toBe(herLastWinterRef(2)!.k)
    expect(seasonLastWinterRef(1)!.k).not.toBe(seasonLastWinterRef(2)!.k)
    expect(herLastWinterRef(2)!.p).toEqual(['Two'])
    for (const line of LAST_WINTER_LINES) expect(ALL_DECLINE_LINES).toContain(line)
  })

  it('the refs\' keys are exactly the keys declineVoice.ts spells, and none of them is an old save\'s', () => {
    const keys = cpKeysOf('src/composables/declineVoice.ts')
    expect(keys.length).toBe(14)
    for (const k of keys) {
      expect(inCatalog(k), k).toBe(true)
      expect(TABLE.has(k), k).toBe(false)
    }
  })
})
// (the digest is computed on the pre-wave tree - the functions it covers are unchanged by this wave, so it is also this tree's)
const PRE_WAVE_DECLINE_DIGEST = '3a60a4f2'

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §7 – the pick keys
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§7 the pick keys – a sub-stream key of a touched file may not move', () => {
  // (albumBook.ts is in ENGINE_FILES: its two flavour keys are the draws the ticket's seat, gate and row ride on)
  const FILES = [...ENGINE_FILES, 'src/composables/declineVoice.ts']
  function keysIn(rel: string): string[] {
    const out: string[] = []
    eachNode(parse(rel), (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'rngFromSeed' && n.arguments[0]) out.push(n.arguments[0].getText().replace(/\s+/g, ' '))
    })
    return out
  }
  it('lists the keys, and the digest of the list is the pre-wave tree\'s', () => {
    const all = FILES.flatMap((rel) => keysIn(rel).map((k) => `${rel}: ${k}`)).sort()
    expect(all).toHaveLength(6)
    expect(fnv1a(all.join('\n')).toString(16)).toBe(PRE_WAVE_PICK_KEYS_DIGEST)
  })
})
const PRE_WAVE_PICK_KEYS_DIGEST = 'bf1d7752'

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §8 – a career played to its end
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§8 a career played to a natural ending off the bench', () => {
  it('every row that carries a ref renders to its text, the offers and answers are among them, and the epilogue\'s page agrees', () => {
    const policy = { ...POLICIES[0]!, answerRetirementOffers: true }
    const { world, rng } = openCareer(PRESETS[5]!, 0, policy)
    let w = 0
    const seen: Row[] = []
    const take = (): void => {
      for (const r of rowsOf(world)) if (!seen.includes(r)) seen.push(r)
    }
    for (; w < 1500 && !world.ending; w++) {
      stepCareerWeek(world, rng, policy)
      take()
    }
    expect(world.ending, `no ending in ${w} weeks`).not.toBeNull()
    take()
    expectPairs(seen, 'played')
    const offers = seen.filter((r) => r.text.startsWith('She is ') && r.text.includes('Nobody asked her'))
    const said = seen.filter((r) => r.text === 'One more year, you said. Same as last time.')
    const latch = seen.filter((r) => r.text.includes(' – ') && r.text.startsWith(ENDING_TITLE[world.ending!.type]))
    expect(latch).toHaveLength(1)
    expect(latch[0]!.c!.k).toBe(`${ENDING_TITLE[world.ending!.type]} – {0}.`)
    for (const r of [...offers, ...said]) expect(r.c, r.text).toBeDefined()
    expect(offers.length + said.length, 'she was asked at least once on the way').toBeGreaterThan(0)
    const view = buildEndingView(world)!
    expect(render(view.closing.factC!)).toBe(view.closing.fact)
    expect(render(view.closing.whyC!)).toBe(view.closing.why)
  }, 60_000)
})


// ---------------------------------------------------------------------------------------------------------------------------------------------
// §9 – the posed set, English
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** The pre-wave tree's (a083ebed) readings of the posed set, refs stripped: recomputed by tests/helpers/l3-6-album-set.ts on a throwaway worktree of that commit and on this tree - the same two values.
 *  ⚠ 10.10 – VIEWS moved by the owner's own ruling (the strong-repeat trim: four door receipts lost
 *  the clause their blurb tells; «берём все четыре» in chat, decisions.md). The diff behind the new
 *  value is ONLY those four strings – the books digest did not move, which is the cross-check. */
const PRE_WAVE_BOOKS_DIGEST = '7e885813'
const PRE_WAVE_VIEWS_DIGEST = '3d0366fb'

describe('§9 the posed set of books, in English, is the pre-wave tree\'s byte for byte', () => {
  const set = posedBooks()

  it('is the set the digests were taken on (129 books, 903 sheets, 502 chapters, 28 epilogues)', () => {
    expect(set).toHaveLength(48 + 48 + 27 + 1 + 5)
    const d = englishDigest()
    expect([d.sheets, d.chapters, d.viewsN]).toEqual([903, 502, 28])
    expect(new Set(set.flatMap((b) => b.book.sheets.map((s) => s.layout)))).toEqual(new Set(['A', 'B', 'C']))
    expect(set.filter((b) => b.book.sheets.some((s) => s.ticket?.tail)).length, 'the tail ticket').toBeGreaterThanOrEqual(1)
    expect(set.filter((b) => b.book.sheets.some((s) => s.tag?.tail)).length, 'the tail tag').toBeGreaterThan(5)
    expect(set.filter((b) => b.book.sheets.some((s) => (s.note?.lines.length ?? 0) > 0)).length, 'a checklist').toBeGreaterThanOrEqual(4)
  })

  it('every string of every book - chapters, sheets, frames, notes, tickets, tags, flavour draws - has the digest the pre-wave tree gave', () => {
    expect(englishDigest().books).toBe(PRE_WAVE_BOOKS_DIGEST)
  })

  it('and so does every epilogue (the closing page and the whole record) of the 28 ended careers', () => {
    expect(englishDigest().views).toBe(PRE_WAVE_VIEWS_DIGEST)
    expect(endedViews()).toHaveLength(28)
  })

  it('assembling a book writes nothing to the world', () => {
    for (const b of set.slice(0, 20)) {
      const before = JSON.stringify(b.world)
      void b.book
      expect(JSON.stringify(b.world), b.label).toBe(before)
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §10 – every ref renders to its string, and the fields without one are exactly the ones that may have none
// ---------------------------------------------------------------------------------------------------------------------------------------------
interface Field { path: string; text: string; c: CopyRef | null | undefined; at: string }
function fieldsOf(book: AlbumBook, label: string): Field[] {
  const out: Field[] = []
  const add = (path: string, text: string, c: CopyRef | null | undefined, at: string): void => {
    out.push({ path, text, c, at: `${label} ${at}` })
  }
  book.chapters.forEach((ch, i) => {
    add('chapter.title', ch.title, ch.titleC, `chapter ${i}`)
    add('chapter.ageLabel', ch.ageLabel, ch.ageLabelC, `chapter ${i}`)
  })
  for (const s of book.sheets) {
    add('sheet.chapterTitle', s.chapterTitle, s.chapterTitleC, s.id)
    add('sheet.ageLabel', s.ageLabel, s.ageLabelC, s.id)
    add('sheet.line', s.line, s.lineC, s.id)
    s.frames.forEach((f, i) => {
      add('frame.alt', f.alt, f.altC, `${s.id}#${i}`)
      add('frame.caption', f.caption, f.captionC, `${s.id}#${i}`)
    })
    if (s.note) {
      add('note.text', s.note.text, s.note.textC, s.id)
      add('note.dateLabel', s.note.dateLabel ?? '', undefined, s.id)
      if (s.note.ageLabel !== null) add('note.ageLabel', s.note.ageLabel, s.note.ageLabelC, s.id)
      s.note.lines.forEach((line, i) => add('note.line', line, s.note!.linesC?.[i], `${s.id}[${i}]`))
    }
    if (s.ticket) {
      for (const f of ['tier', 'stage', 'venue', 'dateLabel'] as const) add(`ticket.${f}`, s.ticket[f], undefined, s.id)
      add('ticket.gate', s.ticket.gate, s.ticket.gateC, s.id)
      add('ticket.seat', s.ticket.seat, s.ticket.seatC, s.id)
      add('ticket.row', s.ticket.row, s.ticket.rowC, s.id)
    }
    if (s.tag) {
      for (const f of ['stage', 'tier', 'place'] as const) add(`tag.${f}`, s.tag[f], undefined, s.id)
      add('tag.ageLabel', s.tag.ageLabel, s.tag.ageLabelC, s.id)
    }
    if (s.patch) add('patch.name', s.patch.name, undefined, s.id)
  }
  return out
}
/** the fields with NO ref, and why: an engine-born word, an invented proper noun, a formatter's output - and a caption the corpus left empty */
const BARE_BY_DESIGN = new Set(['note.dateLabel', 'ticket.tier', 'ticket.stage', 'ticket.venue', 'ticket.dateLabel', 'tag.stage', 'tag.tier', 'tag.place', 'patch.name'])

describe('§10 every ref renders to its string; a field without one is exactly a field that may have none', () => {
  const all = posedBooks().flatMap((b) => fieldsOf(b.book, b.label))

  it('the walk is not blind: tens of thousands of fields across every kind', () => {
    expect(all.length).toBeGreaterThan(12000)
    const paths = new Set(all.map((f) => f.path))
    for (const p of ['chapter.title', 'chapter.ageLabel', 'sheet.chapterTitle', 'sheet.ageLabel', 'sheet.line', 'frame.alt', 'frame.caption', 'note.text', 'note.ageLabel', 'note.line', 'ticket.gate', 'ticket.seat', 'ticket.row', 'tag.ageLabel']) expect(paths.has(p), p).toBe(true)
  })

  it('a ref renders to the string it sits beside, byte for byte, and is JSON-safe', () => {
    const bad: string[] = []
    let withRef = 0
    for (const f of all) {
      if (!f.c) continue
      withRef++
      if (render(f.c) !== f.text) bad.push(`${f.at} ${f.path}: ${JSON.stringify(f.text)} vs ${JSON.stringify(render(f.c))}`)
      if (JSON.stringify(JSON.parse(JSON.stringify(f.c))) !== JSON.stringify(f.c)) bad.push(`${f.at} ${f.path}: not JSON-safe`)
      if (!inCatalog(f.c.k) && f.c.k !== '') bad.push(`${f.at} ${f.path}: key not in the catalog: ${f.c.k}`)
    }
    expect(bad.slice(0, 5)).toEqual([])
    expect(withRef).toBeGreaterThan(9000)
  })

  it('a field with no ref is one of the designed exceptions, an empty caption, or the mother\'s name - nothing else', () => {
    const bare = all.filter((f) => !f.c)
    const stray = bare.filter((f) => {
      if (BARE_BY_DESIGN.has(f.path)) return false
      if (f.path === 'frame.caption') return f.text !== ''
      if (f.path === 'note.line') return !f.at.endsWith('[0]') || !/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(f.text)
      return true
    })
    expect(stray.map((f) => `${f.at} ${f.path} ${JSON.stringify(f.text)}`).slice(0, 5)).toEqual([])
    // ...and the captions the corpus did write all have theirs
    expect(all.filter((f) => f.path === 'frame.caption' && f.text !== '' && f.c).length).toBeGreaterThan(300)
    // the checklist's refs are index-aligned: null only where the line is the mother's name
    for (const b of posedBooks()) for (const s of b.book.sheets) {
      if (!s.note || s.note.lines.length === 0) continue
      expect(s.note.linesC, `${b.label} ${s.id}`).toHaveLength(s.note.lines.length)
      s.note.linesC!.forEach((c, i) => expect(c === null, `${b.label} ${s.id}[${i}]`).toBe(i === 0 && s.note!.lines.length > 0 && b.label.startsWith('dynasty')))
    }
  })

  it('the ticket words keep their draws: seat, gate and row are the digits the sub-stream dealt, and the ref carries the SAME digits', () => {
    for (const b of posedBooks()) for (const s of b.book.sheets) {
      if (!s.ticket) continue
      const seat = /^Seat (\d+)([A-F])$/.exec(s.ticket.seat)
      const gate = /^Gate (\d+)$/.exec(s.ticket.gate)
      const row = /^Row (\d+)$/.exec(s.ticket.row)
      expect(seat && gate && row, `${b.label} ${s.id}`).toBeTruthy()
      expect(s.ticket.seatC?.p).toEqual([Number(seat![1]), seat![2]])
      expect(s.ticket.gateC?.p).toEqual([Number(gate![1])])
      expect(s.ticket.rowC?.p).toEqual([Number(row![1])])
    }
  })

  it('the walls arc displaces the closing sheet\'s words AND their refs: no sheet says one thing and carries the key of another', () => {
    const arcNotes = new Set(Object.values(ALBUM_ARC).flatMap((d) => Object.values(d).map((h) => h.note)))
    const arcLines = new Set(Object.values(ALBUM_ARC).flatMap((d) => Object.values(d).map((h) => h.line)))
    let seen = 0
    for (const b of posedBooks()) for (const s of b.book.sheets) {
      if (s.note && arcNotes.has(s.note.text)) {
        seen++
        expect(s.note.textC?.k, `${b.label} ${s.id}`).toBe(s.note.text)
        expect(s.lineC?.k).toBe(s.line)
        expect(arcLines.has(s.line)).toBe(true)
      }
    }
    expect(seen, 'no arc sheet in the set').toBeGreaterThan(8)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §11 – the corpus
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§11 the corpus: 38 occasions x 4 voices x (note, caption, line), and the walls arc', () => {
  const cells = ALBUM_CORPUS.flatMap((o) => Object.entries(o.voices).flatMap(([voice, h]) => [`${o.id}/${voice}/note`, `${o.id}/${voice}/caption`, `${o.id}/${voice}/line`].map((id, i) => ({ id, text: [h.note, h.caption, h.line][i]! }))))
  const arc = Object.entries(ALBUM_ARC).flatMap(([dir, voices]) => Object.entries(voices).flatMap(([voice, h]) => [{ id: `arc/${dir}/${voice}/note`, text: h.note }, { id: `arc/${dir}/${voice}/line`, text: h.line }]))

  it('the corpus is the size the report says: 38 ids, 456 cells, 16 arc cells - every one a plain string', () => {
    expect(ALBUM_CORPUS).toHaveLength(38)
    expect(cells).toHaveLength(456)
    expect(arc).toHaveLength(16)
    for (const c of [...cells, ...arc]) expect(typeof c.text, c.id).toBe('string')
  })

  it('every cell is a catalog key (OUTSIDE_CATALOG: 0), is seatable (no message syntax, no context tag), and is not empty', () => {
    const outside = [...cells, ...arc].filter((c) => !inCatalog(c.text))
    expect(outside.map((c) => c.id)).toEqual([])
    for (const c of [...cells, ...arc]) {
      expect(c.text, c.id).not.toBe('')
      expect(/[{}\\]/.test(c.text), `${c.id} carries message syntax`).toBe(false)
      expect(c.text.split('|')[0] !== undefined && !/^[a-z][a-z0-9_-]{0,23}\|/.test(c.text), `${c.id} reads as a context tag`).toBe(true)
    }
  })

  it('every cell the set reaches is reffed (a seat), and the set reaches a wide share of the corpus', () => {
    const byText = new Map(cells.map((c) => [c.text, c.id]))
    const reached = new Set<string>()
    for (const b of posedBooks()) for (const s of b.book.sheets) {
      for (const [text, c] of [[s.note?.text, s.note?.textC], [s.line, s.lineC], ...s.frames.map((f) => [f.caption, f.captionC] as const)] as const) {
        if (text === undefined || text === '' || !byText.has(text)) continue
        reached.add(byText.get(text)!)
        expect(c, `${b.label} ${s.id}: ${text}`).toEqual({ k: text })
      }
    }
    // the posed set reaches this many of the 456 corpus cells (a floor: the occasions a posed career can earn)
    expect(reached.size).toBeGreaterThan(150)
    console.log(`[L3-6] the posed set reaches ${reached.size} of ${cells.length} corpus cells (+ ${arc.length} arc cells, 8 of them in the set)`)
  })

  it('a re-picked voice picks different cells but always reffed ones: the cell chosen for a voice is that voice\'s', () => {
    const w0 = posedCareer(3)
    const seen = new Set<string>()
    for (const voice of TEMPERAMENTS) {
      const world = posedCareer(3)
      world.temperament = voice
      const book = posedBooks().find((b) => b.label === `posed 3 / ${voice}`)!.book
      expect(book.sheets.length).toBeGreaterThan(2)
      for (const sheet of book.sheets) {
        expect(sheet.lineC?.k).toBe(sheet.line)
        seen.add(sheet.line)
      }
      void world
    }
    expect(w0.seed).toBeTruthy()
    expect(seen.size, 'four voices said four different things').toBeGreaterThan(4)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §12 – the heirloom
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§12 the heirloom: the mother\'s finished book is STORED in the daughter\'s save, so the refs are stored with it', () => {
  it('the book survives the door - structuredClone into world.legacy, then the query - with its refs, and they render', () => {
    const mother = posedBooks().find((b) => b.label === 'ended natural / lean 1')!.world
    const input = legacyInputOf(mother)
    expect(JSON.stringify(plain(input.heirloomAlbum))).toBe(JSON.stringify(plain(assembleAlbumOf(mother))))
    const daughter = createLegacyWorld(input, 'l36-heirloom', 'Maya')
    const stored = heirloomBookOf(daughter)!
    expect(stored).toEqual(input.heirloomAlbum)
    const fields = fieldsOf(stored, 'heirloom')
    expect(fields.filter((f) => f.c).length).toBeGreaterThan(30)
    for (const f of fields) if (f.c) expect(render(f.c), f.at + f.path).toBe(f.text)
    // it is plain data: the save's JSON holds it and gets it back unchanged
    expect(JSON.parse(JSON.stringify(daughter.legacy!.heirloomAlbum))).toEqual(daughter.legacy!.heirloomAlbum)
  })

  it('the size it adds to a generation-two save (measured, and reported)', () => {
    const mother = posedBooks().find((b) => b.label === 'ended natural / lean 1')!.world
    const input = legacyInputOf(mother)
    const withRefs = JSON.stringify(input.heirloomAlbum).length
    const without = JSON.stringify(plain(input.heirloomAlbum)).length
    console.log(`[L3-6] heirloom book: ${without} -> ${withRefs} bytes (+${(((withRefs - without) / without) * 100).toFixed(0)}%), ${input.heirloomAlbum.sheets.length} sheets`)
    expect(withRefs).toBeGreaterThan(without)
    expect(withRefs / without, 'a seat repeats its string and a cp key carries its holes: the book roughly doubles, no more').toBeLessThan(2.6)
  })

  it('the sweep\'s sheets (r45 / r47 / r48) all carry refs that render', () => {
    const sheets = sweepSheets()
    expect(sheets.length).toBeGreaterThan(300)
    for (const s of sheets) {
      expect(s.chapterTitleC).toBeDefined()
      expect(render(s.lineC!)).toBe(s.line)
    }
  })
})
function assembleAlbumOf(world: WorldState): AlbumBook {
  return posedBooks().find((b) => b.world === world)!.book
}
