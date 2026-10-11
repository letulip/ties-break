// RU-23 (11.10) – THE COACH MARKET'S ROOM, DECLINE AND PLATE NOTES RIDE AS COPYREFS BESIDE THE ENGLISH. docs/localization/ru-profile-coaching-2026-10.md (the RU-23 section), docs/specs/i18n-2026-10.md §3.2.
//
// WHAT THE WAVE DID. `coachRoomNote`, `coachDeclineNote` and `coachRoomShort` – the three sentences the market list and Home print about her room and her decline – are now built as `CopyRef`s
// (`coachRoomNoteRef`, `coachDeclineNoteRef`, `coachRoomShortRef`) and the string beside each is that ref rendered in English. A note is a READ: a label, `ROOM_NOTE_SEP` and an argument (`coachRead`), the
// arguments whole sentences with the rank move and the clause about what is left as nested refs. They ride the snapshot as `*C` fields (class (b): derived at snapshot time, persisted nowhere – no schema
// move). Not a draw moved (invariant 2) and not a character of English changed (invariant 4): the twin (tests/i18n-l3-7-twin.test.ts) holds the digests, this file holds the reason.
//
//   §1 the key law            – the cp keys of coachMarket.ts that no old save can hold are exactly the committed list (and the join's dash is the splitter's)
//   §2 the oracle             – the pre-ref builders, pasted from the tree before the wave, against the refs: every arm, every form (1 / many), every phase of the season
//   §3 the English            – the snapshot carries a ref exactly where it carries a string, and the string IS the ref rendered in English; the reads split where the splitter splits them
//   §4 the Russian            – every ref under the real ru.json: no miss, no English word left, the right plural at every count, the label where the bold goes
//   §5 the seats              – the keys the readers ask for are catalog keys, wired, with a Russian row; the pools the screen reads through `engineText` have a reading for each of their sentences
//   §6 purity                 – the notes read a world and write nothing, and take no draw
//   §7 the mutations          – a row removed, a ref that is not a read, a separator that moved: each goes red
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { allTemplateKeys } from '../src/engine/migrations/reverseMatch'
import { renderCopyRef, translate, SOURCE_LOCALE, type CopyRef, type MissReason, type RenderContext } from '../src/shared/i18n'
import { createWordReaders } from '../src/i18n/words'
import { createWorld, toSnapshot } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import {
  BELOW_BEST_LADDER,
  READ_JOIN_KEY,
  ROOM_BANDS,
  ROOM_NOTE_SEP,
  coachDeclineNote,
  coachDeclineNoteRef,
  coachDeclineShort,
  coachDeclineShortRef,
  coachRead,
  coachReadParts,
  coachRoomArgument,
  coachRoomBand,
  coachRoomBandOf,
  coachRoomNote,
  coachRoomNoteRef,
  coachRoomShort,
  coachRoomShortRef,
  declinePhaseOf,
  declineRead,
  type DeclineRead,
} from '../src/engine/world/coachMarket'
import { physicalMean } from '../src/engine/development'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'
import { COACH_CLASS_B_KEYS } from './helpers/ru23-coach-keys'

const ROOT = resolve(__dirname, '..')
const EN = { locale: SOURCE_LOCALE }
const RU = JSON.parse(readFileSync(join(ROOT, 'src/i18n/ru.json'), 'utf8')) as Record<string, string>
const CATALOG = (JSON.parse(readFileSync(join(ROOT, 'src/i18n/catalog.en.json'), 'utf8')) as { keys: Record<string, { wrapped?: true; seat?: string[] }> }).keys
const TABLE = new Set(allTemplateKeys())
const en = (c: CopyRef): string => renderCopyRef(c, EN)

/** A Russian render context like the app's (`src/i18n/index.ts`): the real catalog, a miss recorder, the word hook. A mutated catalog can be handed in to prove the net bites. */
function ruRig(catalog: Readonly<Record<string, string>> = RU): { render: (c: CopyRef) => string; missing: Set<string>; invalid: Set<string> } {
  const missing = new Set<string>()
  const invalid = new Set<string>()
  const onMiss = (key: string, why: MissReason): void => void (why === 'missing' ? missing : invalid).add(key)
  const plain: RenderContext = { locale: 'ru', lookup: (k) => catalog[k], onMiss }
  const readers = createWordReaders((key, params) => translate(key, params, plain))
  const ctx: RenderContext = { ...plain, words: readers.holes }
  return { render: (c) => renderCopyRef(c, ctx), missing, invalid }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// the fixtures: past-peak careers under the test's own hand (r40-last-winter's shapes), and growing ones
// ---------------------------------------------------------------------------------------------------------------------------------------------
const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = { domestic: { ...EMPTY_ROW }, itf: { ...EMPTY_ROW }, wta: { ...EMPTY_ROW, endRank: wtaRank } } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}
function worldAt(opts: { ageYears: number; share: number; seasons: SeasonHistoryEntry[]; seasonWeek: number }): WorldState {
  const world = createWorld('ru23-coach-market', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.week = Math.round((opts.ageYears - 14) * WEEKS_PER_YEAR) + opts.seasonWeek
  world.peakPhysical = physicalMean(world.skills) / opts.share
  world.seasonHistory = opts.seasons
  return world
}
/** The histories that decide the arm: nothing to compare, a year that fell by 57 and by 1, a career best above, and a fall by one place from the best. */
const HISTORIES: Record<string, SeasonHistoryEntry[]> = {
  none: [season(20, 125)],
  fell57: [season(19, 68), season(20, 125)],
  fell1: [season(19, 124), season(20, 125)],
  below105: [season(16, 20), season(20, 125)],
  below1: [season(16, 124), season(20, 125)],
  both: [season(16, 20), season(19, 68), season(20, 125)],
}
const AGES = [30, 33, 36, 39, 41, 43]
const SHARES = Array.from({ length: 25 }, (_, i) => 0.96 - i * 0.02)
const SEASON_WEEKS = [0, 20, 51]

/** every past-peak world of the sweep, with its read – the ones the engine speaks for */
function declineWorlds(): { world: WorldState; read: DeclineRead; label: string }[] {
  const out: { world: WorldState; read: DeclineRead; label: string }[] = []
  for (const age of AGES)
    for (const share of SHARES)
      for (const [name, seasons] of Object.entries(HISTORIES))
        for (const seasonWeek of SEASON_WEEKS) {
          const world = worldAt({ ageYears: age, share, seasons, seasonWeek })
          const read = declineRead(world)
          if (read !== null) out.push({ world, read, label: `age ${age} share ${share.toFixed(2)} ${name} week+${seasonWeek}` })
        }
  return out
}
const DECLINE = declineWorlds()

// ---------------------------------------------------------------------------------------------------------------------------------------------
// the oracle: the builders as they stood on the tree before the refs (999d2ea7), pasted – the strings the player has always read
// ---------------------------------------------------------------------------------------------------------------------------------------------
const placesOld = (n: number): string => `${n} ${n === 1 ? 'place' : 'places'}`
function legacyDeclineNote(read: DeclineRead): string {
  const { seasons, yearMove, belowBest } = read
  const left =
    read.lastWinter !== null
      ? read.lastWinter === 1
        ? 'her last winter is the next one'
        : `her last winter is ${read.lastWinter} seasons away`
      : `her body has about ${seasons} more ${seasons === 1 ? 'season' : 'seasons'} in it`
  const note =
    yearMove !== null && yearMove > 0
      ? `down ${placesOld(yearMove)} on the year, and ${left}.`
      : belowBest !== null && belowBest > 0
        ? `${placesOld(belowBest)} below her best season, and ${left}.`
        : `${left}, and no coach buys that back.`
  return `Past her peak${ROOM_NOTE_SEP}${note}`
}
type Variant = 'fell' | 'below' | 'seasons'
const LEGACY_ROTATION: Record<'early' | 'mid' | 'late', readonly Variant[]> = { early: ['fell', 'below', 'seasons'], mid: ['seasons'], late: ['below', 'fell', 'seasons'] }
function legacyVariant(variant: Variant, read: DeclineRead): string | null {
  switch (variant) {
    case 'fell':
      return read.yearMove !== null && read.yearMove > 0 ? `She's down ${placesOld(read.yearMove)}` : null
    case 'below': {
      if (read.belowBest === null || read.belowBest <= 0) return null
      for (let i = BELOW_BEST_LADDER.length - 1; i >= 0; i--) if (read.belowBest >= BELOW_BEST_LADDER[i]!.from) return BELOW_BEST_LADDER[i]!.text
      return BELOW_BEST_LADDER[0]!.text
    }
    case 'seasons':
      return read.lastWinter !== null
        ? `Past her peak${ROOM_NOTE_SEP}${read.lastWinter === 1 ? 'her last winter is next' : `her last winter is ${read.lastWinter} seasons away`}`
        : `Past her peak${ROOM_NOTE_SEP}about ${read.seasons} ${read.seasons === 1 ? 'season' : 'seasons'} left`
  }
}
function legacyShort(world: WorldState, read: DeclineRead): string {
  for (const variant of LEGACY_ROTATION[declinePhaseOf(world.week)]) {
    const text = legacyVariant(variant, read)
    if (text !== null) return text
  }
  return legacyVariant('seasons', read)!
}

/** a growing career: the pre-ref band row and short */
function growingWorlds(): WorldState[] {
  const out: WorldState[] = []
  for (const seed of ['ru23-g1', 'ru23-g2', 'ru23-g3']) {
    for (const weeks of [0, 30, 120, 300, 520, 800]) {
      const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
      world.week = weeks
      // a growing career has its skills moved toward its ceiling by the sweep of this fixture, so every band is met
      for (const share of [0.05, 0.3, 0.6, 0.8, 0.95]) {
        const w = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
        w.week = weeks
        for (const k of Object.keys(w.skills) as (keyof typeof w.skills)[]) w.skills[k] = w.skills[k] + (w.potential[k] - w.skills[k]) * share
        out.push(w)
      }
      out.push(world)
    }
  }
  return out
}
const GROWING = growingWorlds()

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1 the key law
// ---------------------------------------------------------------------------------------------------------------------------------------------
function cpKeysOf(file: string): string[] {
  const sf = ts.createSourceFile(file, readFileSync(join(ROOT, file), 'utf8'), ts.ScriptTarget.Latest, true)
  const keys: string[] = []
  const go = (n: ts.Node): void => {
    if (ts.isTaggedTemplateExpression(n) && n.tag.getText() === 'cp') {
      const tpl = n.template
      if (ts.isNoSubstitutionTemplateLiteral(tpl)) keys.push(tpl.text)
      else {
        let k = tpl.head.text
        tpl.templateSpans.forEach((s, i) => {
          k += `{${i}}${s.literal.text}`
        })
        keys.push(k)
      }
    }
    ts.forEachChild(n, go)
  }
  go(sf)
  return keys
}

describe('§1 the key law – the cp keys of coachMarket.ts that no old save can hold are exactly the committed list', () => {
  const found = [...new Set(cpKeysOf('src/engine/world/coachMarket.ts'))]
  const outside = found.filter((k) => !TABLE.has(k)).sort()

  it('COACH_CLASS_B_KEYS is exactly the keys the file spells that the frozen v92 table does not hold – no more, no fewer', () => {
    expect([...COACH_CLASS_B_KEYS].sort()).toEqual(outside)
  })

  it('and none of the listed keys is secretly a sentence of the table (a stored row\'s key must never be re-spelled here)', () => {
    for (const k of COACH_CLASS_B_KEYS) expect(TABLE.has(k), k).toBe(false)
  })

  it('every listed key is a wired catalog key (extract is fresh) and has its Russian row', () => {
    for (const k of COACH_CLASS_B_KEYS) {
      expect(CATALOG[k]?.wrapped, `${JSON.stringify(k)} is not a wired catalog key – run npm run i18n:extract`).toBe(true)
      expect(RU[k], `${JSON.stringify(k)} has no Russian row`).toBeTruthy()
    }
  })

  it('⭐ the dash of the join is the splitter\'s: the separator is a PARAM of `read|{0}{1}{2}`, so the one constant both cut and join on cannot drift from a key', () => {
    expect(ROOM_NOTE_SEP).toBe(' – ')
    expect(READ_JOIN_KEY).toBe('read|{0}{1}{2}')
    const ref = coachRead({ k: 'Label' }, { k: 'argument.' })
    expect(ref.p?.[1], 'the separator rides as a param').toBe(ROOM_NOTE_SEP)
    expect(en(ref)).toBe(`Label${ROOM_NOTE_SEP}argument.`)
    expect(coachRoomBand(en(ref)), 'the splitter cuts what the joiner joined').toBe('Label')
    expect(coachRoomArgument(en(ref))).toBe('argument.')
  })

  it('the label every decline read opens with is one key, `Past her peak`, and the band rows\' labels are the ladder\'s own', () => {
    expect(COACH_CLASS_B_KEYS).toContain('Past her peak')
    expect(ROOM_BANDS.map((r) => r.label)).toEqual(['Huge potential', 'Still room to grow', 'Close to her ceiling', 'At her ceiling'])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §2 the oracle
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§2 the oracle – the refs render, in English, the strings the pre-ref builders wrote', () => {
  it('the sweep is real: every arm, both forms of a count, and every phase of the season is met', () => {
    expect(DECLINE.length, 'the sweep reached past-peak careers').toBeGreaterThan(300)
    const read = DECLINE.map((d) => d.read)
    expect(new Set(read.map((r) => r.yearMove !== null && r.yearMove > 0)), 'the year-on-year arm is both on and off').toEqual(new Set([true, false]))
    expect(read.some((r) => r.yearMove === 1), 'a fall of one place (the singular)').toBe(true)
    expect(read.some((r) => r.belowBest === 1), 'one place below her best (the singular)').toBe(true)
    expect(read.some((r) => r.seasons === 1), 'one season of body (the singular)').toBe(true)
    expect(read.some((r) => r.seasons > 1), 'several seasons of body').toBe(true)
    expect(read.some((r) => r.lastWinter === 1), 'the next winter is her last').toBe(true)
    expect(read.some((r) => r.lastWinter !== null && r.lastWinter > 1), 'her last winter is further off').toBe(true)
    expect(new Set(DECLINE.map((d) => declinePhaseOf(d.world.week))), 'all three thirds of the season').toEqual(new Set(['early', 'mid', 'late']))
  })

  it('⭐ the long decline note: every world of the sweep', () => {
    for (const { world, read, label } of DECLINE) {
      expect(coachDeclineNote(world), label).toBe(legacyDeclineNote(read))
      expect(en(coachDeclineNoteRef(world)!), label).toBe(legacyDeclineNote(read))
    }
  })

  it('⭐ Home\'s short plate: the rotation\'s pick, every world of the sweep', () => {
    for (const { world, read, label } of DECLINE) {
      expect(coachDeclineShort(world), label).toBe(legacyShort(world, read))
      expect(en(coachDeclineShortRef(world)!), label).toBe(legacyShort(world, read))
      expect(coachRoomShort(world), `${label}: the plate past the peak is the decline's`).toBe(legacyShort(world, read))
    }
  })

  it('⭐ the room note past her peak IS the decline note (round 38 #7b), and while she grows it is the band row\'s label, the dash and its argument', () => {
    for (const { world, read, label } of DECLINE) expect(coachRoomNote(world), label).toBe(legacyDeclineNote(read))
    let bands = new Set<number>()
    for (const world of GROWING) {
      if (declineRead(world) !== null) continue
      const index = coachRoomBandOf(world)
      if (index === null) {
        expect(coachRoomNote(world)).toBe('')
        expect(coachRoomNoteRef(world)).toBeNull()
        expect(coachRoomShortRef(world)).toBeNull()
        continue
      }
      bands.add(index)
      const row = ROOM_BANDS[index]!
      expect(coachRoomNote(world)).toBe(`${row.label}${ROOM_NOTE_SEP}${row.note}`)
      expect(coachRoomShort(world)).toBe(row.short)
      expect(en(coachRoomShortRef(world)!)).toBe(row.short)
    }
    expect([...bands].sort(), 'the sweep met all four rungs of the ladder').toEqual([0, 1, 2, 3])
    bands = new Set()
  })

  it('a growing career has no decline ref, and a past-peak one has no band: exactly one read at a time', () => {
    for (const world of GROWING) if (declineRead(world) === null) expect(coachDeclineNoteRef(world)).toBeNull()
    for (const { world } of DECLINE) {
      expect(coachDeclineNoteRef(world)).not.toBeNull()
      expect(coachReadParts(coachRoomNoteRef(world) ?? undefined)?.label.k, 'the label of a decline read').toBe('Past her peak')
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §3 the snapshot
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§3 the English – the snapshot carries a ref exactly where it carries a string, and the string is the ref rendered', () => {
  const sample = [...DECLINE.filter((_, i) => i % 61 === 0).map((d) => d.world), ...GROWING.filter((_, i) => i % 5 === 0)]

  it('the three refs of `coachNotesC` are present exactly where their strings are non-empty (null otherwise), and render to them', () => {
    expect(sample.length).toBeGreaterThan(20)
    for (const world of sample) {
      const snap = toSnapshot(world)
      for (const [text, c] of [
        [snap.coachRoomNote, snap.coachNotesC.room],
        [snap.coachDeclineNote, snap.coachNotesC.decline],
        [snap.coachRoomShort, snap.coachNotesC.short],
      ] as const) {
        expect(c !== null, `the ref is present iff the string is non-empty ("${text}")`).toBe(text !== '')
        if (c !== null) expect(en(c)).toBe(text)
      }
    }
  })

  it('a read splits into its two parts, and the parts are the splitter\'s: label = coachRoomBand, argument = coachRoomArgument, joined by the dash', () => {
    for (const world of sample) {
      const snap = toSnapshot(world)
      const parts = coachReadParts(snap.coachNotesC.room ?? undefined)
      if (snap.coachRoomNote === '') {
        expect(parts).toBeNull()
        continue
      }
      expect(parts, `"${snap.coachRoomNote}" is a read`).not.toBeNull()
      expect(en(parts!.label)).toBe(coachRoomBand(snap.coachRoomNote))
      expect(`${en(parts!.label)}${ROOM_NOTE_SEP}${en(parts!.tail)}`).toBe(snap.coachRoomNote)
      expect(coachRoomArgument(snap.coachRoomNote)).toBe(en(parts!.tail))
    }
  })

  it('the refs are JSON: a save-free wire value (structured clone cannot lose a field, and a stored byte would be a schema move)', () => {
    for (const world of sample) {
      const snap = toSnapshot(world)
      for (const c of Object.values(snap.coachNotesC)) if (c !== null) expect(JSON.parse(JSON.stringify(c))).toEqual(c)
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §4 the Russian
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§4 the Russian – every ref of the sweep under the real ru.json', () => {
  const refs = new Map<string, CopyRef>()
  for (const { world } of DECLINE) {
    for (const c of [coachDeclineNoteRef(world), coachDeclineShortRef(world), coachRoomNoteRef(world), coachRoomShortRef(world)]) if (c !== null) refs.set(JSON.stringify(c), c)
  }
  for (const world of GROWING) for (const c of [coachRoomNoteRef(world), coachRoomShortRef(world)]) if (c !== null) refs.set(JSON.stringify(c), c)

  it('the sweep is wide: a few dozen distinct refs', () => {
    expect(refs.size).toBeGreaterThan(40)
  })

  it('⭐ no miss, no invalid row, not a Latin letter, no hole left open', () => {
    const rig = ruRig()
    for (const c of refs.values()) {
      const out = rig.render(c)
      expect(out, JSON.stringify(c)).not.toMatch(/[A-Za-z]/)
      expect(out, JSON.stringify(c)).not.toMatch(/[{}]|undefined|NaN/)
      expect(out, JSON.stringify(c)).toMatch(/\p{Script=Cyrillic}/u)
    }
    expect([...rig.missing], 'keys a Russian render asked for and ru.json lacks').toEqual([])
    expect([...rig.invalid], 'rows that would not render').toEqual([])
  })

  it('⭐ the label is where the bold goes: every Russian read cuts at the first dash into the label and an argument, and a decline read opens with «Пик позади»', () => {
    const rig = ruRig()
    const ladder = ['Огромный потенциал', 'Ещё есть куда расти', 'Близко к потолку', 'У своего потолка']
    for (const c of refs.values()) {
      const parts = coachReadParts(c)
      if (parts === null) continue
      const label = rig.render(parts.label)
      const tail = rig.render(parts.tail)
      const whole = rig.render(c)
      expect(whole, 'the whole is the label, the dash and the argument').toBe(`${label}${ROOM_NOTE_SEP}${tail}`)
      expect(coachRoomBand(whole), 'the splitter finds the label the engine joined').toBe(label)
      expect([...ladder, 'Пик позади']).toContain(label)
      expect(tail, 'an argument is a sentence').toMatch(/[.]$|[а-я]$/)
    }
  })

  it('the plural at every count – the rank move (accusative after «на»), the seasons (genitive after «около», nominative verb phrase after «до последнего межсезонья»)', () => {
    const rig = ruRig()
    const gap = (n: number): string => rig.render(n === 1 ? { k: 'gap|1 place' } : { k: 'gap|{0} places', p: [n] })
    expect([1, 2, 3, 4, 5, 11, 12, 14, 21, 22, 25, 57, 101, 111, 122].map(gap)).toEqual([
      '1 место', '2 места', '3 места', '4 места', '5 мест', '11 мест', '12 мест', '14 мест', '21 место', '22 места', '25 мест', '57 мест', '101 место', '111 мест', '122 места',
    ])
    const body = (n: number): string => rig.render(n === 1 ? { k: 'her body has about 1 more season in it' } : { k: 'her body has about {0} more seasons in it', p: [n] })
    expect([1, 2, 3, 5, 11, 21, 22, 25].map(body)).toEqual([
      'у организма осталось около 1 сезона', 'у организма осталось около 2 сезонов', 'у организма осталось около 3 сезонов', 'у организма осталось около 5 сезонов',
      'у организма осталось около 11 сезонов', 'у организма осталось около 21 сезона', 'у организма осталось около 22 сезонов', 'у организма осталось около 25 сезонов',
    ])
    const winter = (n: number): string => rig.render(n === 1 ? { k: 'her last winter is the next one' } : { k: 'her last winter is {0} seasons away', p: [n] })
    expect([1, 2, 3, 5, 21].map(winter)).toEqual([
      'следующее межсезонье станет последним', 'до последнего межсезонья осталось 2 сезона', 'до последнего межсезонья осталось 3 сезона', 'до последнего межсезонья осталось 5 сезонов',
      'до последнего межсезонья остался 21 сезон',
    ])
    const short = (n: number): string => rig.render(n === 1 ? { k: 'about 1 season left' } : { k: 'about {0} seasons left', p: [n] })
    expect([1, 2, 5, 21].map(short)).toEqual(['осталось около 1 сезона', 'осталось около 2 сезонов', 'осталось около 5 сезонов', 'осталось около 21 сезона'])
    expect(rig.missing.size).toBe(0)
  })

  it('a whole decline read, word for word, in each of its three arms', () => {
    const rig = ruRig()
    const place = (n: number): CopyRef => (n === 1 ? { k: 'gap|1 place' } : { k: 'gap|{0} places', p: [n] })
    const body: CopyRef = { k: 'her body has about {0} more seasons in it', p: [3] }
    const label: CopyRef = { k: 'Past her peak' }
    expect(rig.render(coachRead(label, { k: 'down {0} on the year, and {1}.', p: [place(57), body] }))).toBe('Пик позади – за год опустилась на 57 мест, и у организма осталось около 3 сезонов.')
    expect(rig.render(coachRead(label, { k: '{0} below her best season, and {1}.', p: [place(1), body] }))).toBe('Пик позади – на 1 место ниже своего лучшего сезона, и у организма осталось около 3 сезонов.')
    expect(rig.render(coachRead(label, { k: '{0}, and no coach buys that back.', p: [{ k: 'her last winter is {0} seasons away', p: [2] }] }))).toBe(
      'Пик позади – до последнего межсезонья осталось 2 сезона, и никакой тренер этого не вернёт.',
    )
    expect(rig.render({ k: "She's down {0}", p: [place(57)] })).toBe('Она опустилась на 57 мест')
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §5 the seats
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 the seats – the keys the readers ask for are catalog keys, wired, with a Russian row', () => {

  it('coach.room: the eight halves of the ladder, the short of its first rung and the three rungs below her best – each wired under the seat, each read', () => {
    const keys = [...new Set([...ROOM_BANDS.flatMap((r) => [r.label, r.note]), ...ROOM_BANDS.map((r) => r.short), ...BELOW_BEST_LADDER.map((r) => r.text)])]
    expect(keys.length).toBe(12)
    for (const k of keys) {
      expect(CATALOG[k]?.seat, k).toContain('coach.room')
      expect(CATALOG[k]?.wrapped, k).toBe(true)
      expect(RU[k], k).toBeTruthy()
    }
  })

  it('the three shorts that are their own labels share ONE key with it (one row, never two that could drift)', () => {
    for (const i of [1, 2, 3]) expect(ROOM_BANDS[i]!.short).toBe(ROOM_BANDS[i]!.label)
    expect(ROOM_BANDS[0]!.short).not.toBe(ROOM_BANDS[0]!.label)
  })

  it('engine.text carries the coach market\'s pools: 16 bios, 4 load notes, 8 halves of the profile, 11 plaque sentences, the travel line – and every one has Russian', () => {
    const catalog = JSON.parse(readFileSync(join(ROOT, 'src/i18n/catalog.en.json'), 'utf8')) as { keys: Record<string, { home: string[]; seat?: string[] }> }
    const homed = Object.entries(catalog.keys).filter(([, e]) => e.seat?.includes('engine.text') && e.home.includes('src/engine/world/coachMarket.ts'))
    expect(homed.length, '16 + 4 + 8 + 11 + 1').toBe(40)
    for (const [k] of homed) expect(RU[k], k).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §6 purity
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§6 purity – the notes read a world and write nothing, and take no draw', () => {
  it('six calls on a past-peak world leave every byte of it where it was (the MAIN stream\'s position included)', () => {
    const { world } = DECLINE[Math.floor(DECLINE.length / 2)]!
    const before = JSON.stringify(world)
    for (let i = 0; i < 2; i++) {
      coachRoomNoteRef(world)
      coachDeclineNoteRef(world)
      coachRoomShortRef(world)
    }
    expect(JSON.stringify(world)).toBe(before)
    expect('rngMain' in world, 'the world carries its stream position, so the comparison above would see a draw').toBe(true)
  })

  it('the same world gives the same ref twice (deterministic – a screen re-derives it on every snapshot)', () => {
    for (const { world } of DECLINE.filter((_, i) => i % 97 === 0)) {
      expect(coachRoomNoteRef(world)).toEqual(coachRoomNoteRef(world))
      expect(coachRoomShortRef(world)).toEqual(coachRoomShortRef(world))
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §7 the mutations
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§7 the mutations – each of these must turn the net red, and does', () => {
  const anyDecline = (): CopyRef => coachRoomNoteRef(DECLINE[0]!.world)!

  it('M1 – a Russian row removed: the render falls back to English, the miss is counted, and the Latin-letter predicate §4 uses sees it', () => {
    const gone = { ...RU }
    delete gone['Past her peak']
    const rig = ruRig(gone)
    const out = rig.render(anyDecline())
    expect(out).toMatch(/[A-Za-z]/)
    expect([...rig.missing]).toContain('Past her peak')
    // the control: the real catalogue renders clean
    expect(ruRig().render(anyDecline())).not.toMatch(/[A-Za-z]/)
  })

  it('M2 – the join row removed: the whole falls back, and the Russian label and argument still come out of their own rows', () => {
    const gone = { ...RU }
    delete gone[READ_JOIN_KEY]
    const rig = ruRig(gone)
    rig.render(anyDecline())
    expect([...rig.missing]).toContain(READ_JOIN_KEY)
  })

  it('M3 – a ref that is not a read is not taken apart (an older worker\'s note, a plate that is one sentence, a join with another dash)', () => {
    expect(coachReadParts(undefined)).toBeNull()
    expect(coachReadParts({ k: 'Huge potential' })).toBeNull()
    expect(coachReadParts({ k: READ_JOIN_KEY, p: [{ k: 'a' }, ' - ', { k: 'b' }] }), 'a hyphen is not the engine\'s separator').toBeNull()
    expect(coachReadParts({ k: READ_JOIN_KEY, p: ['a', ROOM_NOTE_SEP, { k: 'b' }] }), 'a part that is not a ref').toBeNull()
    expect(coachReadParts(coachRead({ k: 'a' }, { k: 'b' }))).not.toBeNull()
  })

  it('M4 – a plural row of the wrong shape (a «много» form where the Russian wants «несколько») changes the strings §4 pins', () => {
    const mutated = { ...RU, 'gap|{0} places': '{0, plural, one {{0} место} few {{0} мест} many {{0} мест} other {{0} места}}' }
    const rig = ruRig(mutated)
    expect(rig.render({ k: 'gap|{0} places', p: [3] })).toBe('3 мест')
    expect(ruRig().render({ k: 'gap|{0} places', p: [3] })).toBe('3 места')
  })
})
