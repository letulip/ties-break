// L3-4 (10.10) – THE DIARY RIDES THE SNAPSHOT AS COPYREFS BESIDE THE ENGLISH. docs/specs/i18n-2026-10.md §3.2, §5, §8 rows L3-0..L3-4.
//
// WHAT THE WAVE DID. The diary is CLASS (b): `buildDiarySnapshot` assembles its lines at SNAPSHOT TIME from state that already exists and nothing about a line is stored
// (the milestone ledger behind the Memory card holds a type, a tier, a kind, a season and a rank – no prose). So the move is the L3-3 briefing's, not the ledger's: the engine
// writes a CopyRef BESIDE each English line (`photoLineC`, `greetingC`, `conditionNoteC`, `memory.lineC` / `whenLabelC`, `birthdayPrompt.headingC` / `askC` / `options[i].labelC` /
// `noteC`), the screen draws `eventText({ text, c })`, no schema moves, and no copy is authored (invariant 4: no `text:` template was edited – a function cell's `ref` is written
// BESIDE its `text`, and a static cell's key is the seat `{ k: text }`). The ONE stored diary sentence – the birthday gift's feed row – is the frozen table's own key.
//
// WHAT THIS FILE HOLDS, section by section:
//   §1 the key law for class (b)      – the list in tests/helpers/l3-4-diary-keys.ts is exactly what the class-(b) files spell, and only the gift row is the table's
//   §2 the seats and what they can hold – every static corpus string is a valid key; the measured number of them the catalog extractor cannot see yet (L3-T)
//   §3 the function cells             – every cell with a hole has a ref, and its ref renders to its text over the whole domain of its holes
//   §4 the greeting                   – its four refs are the keys HomeScreen's clock table already asks for
//   §5 the birthday prompt and row    – headings, the four rows, the gift event row for every gift
//   §6 played careers                 – every converted line carries a ref that renders to it; and THE PICK-STABILITY DIGEST (the strings of two 150-week careers, captured on the
//                                       pre-wave tree 054a73a2, byte for byte – a changed sub-stream key, draw count or pool order moves it)
//   §7 the pick keys                  – the sub-stream seed keys of the class-(b) files, as a list: this wave adds NONE
//   §8 the week-note corpus           – the 324 authored cells, counted by structure: static / function, every one with its key
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { allTemplateKeys } from '../src/engine/migrations/reverseMatch'
import { renderCopyRef, SOURCE_LOCALE, splitContext, type CopyRef } from '../src/shared/i18n'
import { DIARY_CLASS_B_KEYS } from './helpers/l3-4-diary-keys'
import { fnv1a } from './helpers/hash'
import { COACH_TRIP_NOTES, DEBUT_LINES, DIARY_POOL, GREETINGS, MEMORY_LINES, TRAVEL_NOTES, WEEK_NOTES, greetingRef, selectMemory } from '../src/engine/diary'
import {
  BEREAVED_WORDS,
  BIRTHDAY_LINES,
  BIRTHDAY_REFS,
  DIVORCED_WORDS,
  EXAM_LINES,
  FORK_AFTERMATH_WORDS,
  MOTHERHOOD_WORDS,
  OFF_SEASON_LINES,
  VOICE_LINES,
} from '../src/engine/diary/weekNotes'
import { TIERS, tierFromLabel } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { DiaryFacts, Milestone, MilestoneType } from '../src/shared/protocol'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { BIRTHDAY_BANDS, BIRTHDAY_DAY_TOGETHER, birthdayOptions, chooseGift, createWorld, decideKnock, pendingBirthday, pendingKnock, tickWeek, toSnapshot } from '../src/engine/world'
import { birthdayHeading, birthdayHeadingLine } from '../src/engine/world/birthday'
import { rngFromSeed } from '../src/engine/rng'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

const ROOT = resolve(__dirname, '..')
const EN = { locale: SOURCE_LOCALE }
const TABLE = new Set(allTemplateKeys())
const CATALOG = JSON.parse(readFileSync(join(ROOT, 'src/i18n/catalog.en.json'), 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const render = (c: CopyRef): string => renderCopyRef(c, EN)

/** The files whose strings reach the snapshot as the diary's class-(b) copy. */
const CLASS_B_FILES: readonly string[] = [
  'src/engine/diary.ts',
  'src/engine/world/birthday.ts',
  ...readdirSync(join(ROOT, 'src/engine/diary')).filter((f) => f.endsWith('.ts')).map((f) => `src/engine/diary/${f}`),
]
const parsed = CLASS_B_FILES.map((rel) => ({ rel, sf: ts.createSourceFile(rel, readFileSync(join(ROOT, rel), 'utf8'), ts.ScriptTarget.Latest, true) }))
const eachNode = (sf: ts.SourceFile, visit: (n: ts.Node) => void): void => {
  const go = (n: ts.Node): void => {
    visit(n)
    ts.forEachChild(n, go)
  }
  go(sf)
}
const cpKey = (t: ts.TaggedTemplateExpression): string => {
  const tpl = t.template
  if (ts.isNoSubstitutionTemplateLiteral(tpl)) return tpl.text
  let k = tpl.head.text
  tpl.templateSpans.forEach((s, i) => {
    k += `{${i}}${s.literal.text}`
  })
  return k
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1 – the key law for class (b)
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§1 the key law – the diary\'s cp keys are a list, and only the gift row is the frozen table\'s', () => {
  const found = new Map<string, Set<string>>()
  for (const { rel, sf } of parsed) {
    eachNode(sf, (n) => {
      if (ts.isTaggedTemplateExpression(n) && n.tag.getText() === 'cp') {
        const k = cpKey(n)
        found.set(k, (found.get(k) ?? new Set()).add(rel))
      }
    })
  }

  it('finds the wave\'s call sites (the scan is not blind)', () => {
    expect(found.size, 'distinct cp keys in the class-(b) files').toBeGreaterThan(40)
  })

  it('tests/helpers/l3-4-diary-keys.ts is EXACTLY the keys these files spell that no old save can hold – no more, no fewer', () => {
    const expected = [...found.keys()].filter((k) => !TABLE.has(k)).sort()
    if (process.env.L34_WRITE_KEYS === '1') {
      // the WRITE MODE (how L3-2's matrix is captured): the header stays, the list is rewritten from the scan – a deliberate act, never a side effect of a plain run
      const path = join(ROOT, 'tests/helpers/l3-4-diary-keys.ts')
      const head = readFileSync(path, 'utf8').split('export const DIARY_CLASS_B_KEYS')[0]!
      writeFileSync(path, `${head}export const DIARY_CLASS_B_KEYS: readonly string[] = [\n${expected.map((k) => `  ${JSON.stringify(k)},`).join('\n')}\n]\n`)
      return
    }
    expect([...DIARY_CLASS_B_KEYS].sort(), 'regenerate the list, or write the key the table already has').toEqual(expected)
  })

  it('the only class-(b)-file keys the frozen table HOLDS are the two sentences of the gift row, and they live in birthday.ts', () => {
    const inTable = [...found.entries()].filter(([k]) => TABLE.has(k))
    expect(inTable.map(([k]) => k).sort()).toEqual(['Her birthday. No parcel – just the day, kept clear for each other.', 'Her birthday. {0}, opened before the cake.'])
    for (const [, files] of inTable) expect([...files]).toEqual(['src/engine/world/birthday.ts'])
  })

  it('a context tag appears once: the greeting\'s `Good night`, the key HomeScreen\'s clock table asks for', () => {
    expect([...found.keys()].filter((k) => splitContext(k).ctx !== null)).toEqual(['greeting|Good night'])
  })

  it('every one of them is in the English catalog and WIRED (an extractor-visible call site asks for it)', () => {
    const missing = DIARY_CLASS_B_KEYS.filter((k) => CATALOG.keys[k]?.wrapped !== true)
    expect(missing, 'run npm run i18n:extract').toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §2 – the seats: `{ k: text }`, where the string IS the key
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** every distinct string of the BIRTHDAY catalogue (RU-09A): labels, notes, repeat notes, asks and the means-licence alternates */
function giftStrings(): string[] {
  const out = new Set<string>()
  for (const gift of [...BIRTHDAY_BANDS.flatMap((b) => b.gifts), BIRTHDAY_DAY_TOGETHER]) {
    for (const f of ['label', 'note', 'again', 'ask'] as const) out.add(gift[f])
    for (const v of Object.values(gift.unlicensed ?? {})) if (v) out.add(v)
  }
  return [...out]
}
const poolStatics = (): string[] => DIARY_POOL.map((p) => p.text).filter((t): t is string => typeof t === 'string')
const weekStatics = (): string[] => WEEK_NOTES.map((n) => n.text).filter((t): t is string => typeof t === 'string')
const travelStatics = (): string[] => [...TRAVEL_NOTES.map((n) => n.text), ...COACH_TRIP_NOTES]

/** Strings a seat can hold that the CATALOG does not carry yet, by corpus – a MEASURED number, and the standing debt of the dynamic seats (L3-T: «the extractor's dynamic-seat
 *  declaration»): the census reads `text:` properties and a handful of named homes, so a corpus kept in a plain array or a `label:` field is invisible to it. The ref is a key all the
 *  same; the owner's row for it waits («the literal is live in source but no call site asks for it yet»). It can only fall – a number that rises is a seat nobody declared. */
const OUTSIDE_CATALOG = { pool: 0, debut: 0, weekNotes: 0, travel: 0, gifts: 159 } as const
// (`DEBUT_LINES` is EXPORTED for exactly this reason: the census reads an exported top-level const whose name ends LINES / WORDS / NOTES as a known copy home – rule (b) in
//  tools/copy-census-walk.ts – so exporting the corpus brings its strings into the catalog with no tool change. Part 2 exported `VOICE_LINES`, `EXAM_LINES`, `BIRTHDAY_LINES`,
//  `OFF_SEASON_LINES`, `BEREAVED_WORDS`, `DIVORCED_WORDS`, `FORK_AFTERMATH_WORDS` and `COACH_TRIP_NOTES` for the same reason: 156 week-note strings and the coach's five were outside the
//  catalog before. The gift catalogue's names (`BANDS`) match no such rule: 159 stay out.)

describe('§2 the seats – every static string is a valid key, and the number the catalog cannot see yet is measured', () => {
  it('no corpus string carries a brace or a backslash (a seat is `{ k: text }`, and `k` is read as a message: such a character would be syntax)', () => {
    for (const s of [...poolStatics(), ...DEBUT_LINES, ...weekStatics(), ...travelStatics(), ...giftStrings()]) expect(/[{}\\]/.test(s), s).toBe(false)
  })

  it('the pool holds 105 cells: 95 static, 6 with a hole, 4 deliberate silences', () => {
    expect(DIARY_POOL.length).toBe(105)
    expect(poolStatics().length).toBe(95)
    expect(DIARY_POOL.filter((p) => typeof p.text === 'function').length).toBe(6)
    expect(DIARY_POOL.filter((p) => p.text === null).length).toBe(4)
  })

  it('the strings outside the catalog, by corpus (L3-T\'s debt – it can only fall)', () => {
    const outside = (list: readonly string[]): number => new Set(list.filter((s) => CATALOG.keys[s] === undefined)).size
    expect({ pool: outside(poolStatics()), debut: outside(DEBUT_LINES), weekNotes: outside(weekStatics()), travel: outside(travelStatics()), gifts: outside(giftStrings()) }).toEqual(OUTSIDE_CATALOG)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §3 – the function cells: a ref beside every text, rendering to it over the whole domain of its holes
// ---------------------------------------------------------------------------------------------------------------------------------------------
const TIER_IDS = Object.keys(TIERS) as TierId[]

describe('§3 the pool\'s function cells', () => {
  const cells = DIARY_POOL.filter((p) => typeof p.text === 'function')
  const ages = [null, 13, 14, 15, 16, 17, 18, 19, 20, 21, 27, 33]
  const facts = (over: Partial<DiaryFacts>): DiaryFacts => over as unknown as DiaryFacts

  it('every function cell has a ref (a cell without one would print English under every language)', () => {
    for (const c of cells) expect(c.ref, String(c.text)).toBeTypeOf('function')
    expect(cells.length).toBe(6)
  })

  it('and every ref renders to its text: the birthday cells over every age word, the trip over every tier, the layoff over every kind and week count', () => {
    let n = 0
    for (const c of cells) {
      const text = c.text as (f: DiaryFacts) => string
      const domain: DiaryFacts[] = []
      for (const a of ages) domain.push(facts({ birthdayAge: a }))
      for (const t of [null, ...TIER_IDS]) domain.push(facts({ resultTier: t }))
      for (const kind of ['ankle soreness', 'stress fracture', 'shoulder strain'])
        for (const w of [0, 1, 2, 3, 12]) domain.push(facts({ injured: { kind, weeksRemaining: w, totalWeeks: 12 } as DiaryFacts['injured'] }), facts({ injured: null }))
      for (const f of domain) {
        // a cell reads only the holes it names; the others are undefined in this partial fact – so run each cell only where it can run, as the engine does (its licence)
        let said: string
        try {
          said = text(f)
        } catch {
          continue
        }
        expect(render(c.ref!(f)), String(text)).toBe(said)
        n++
      }
    }
    expect(n, 'the sweep rendered a real number of cases').toBeGreaterThan(100)
  })

  it('the layoff line spells a counted form as a whole sentence per form (the house rule)', () => {
    const cell = cells.find((c) => String(c.text).includes('Out with the'))!
    const one = cell.ref!(facts({ injured: { kind: 'ankle soreness', weeksRemaining: 1, totalWeeks: 4 } as DiaryFacts['injured'] }))
    const many = cell.ref!(facts({ injured: { kind: 'ankle soreness', weeksRemaining: 3, totalWeeks: 4 } as DiaryFacts['injured'] }))
    expect(one.k).toBe('Out with the {0} – {1} week to go.')
    expect(many.k).toBe('Out with the {0} – {1} weeks to go.')
  })
})

describe('§3 the memory cards', () => {
  const m = (type: MilestoneType, over: Partial<Milestone> = {}): Milestone => ({ type, week: 30, ...over })

  it('every memory line has a ref, and it renders to its text over every tier (and none), kind, season and rank', () => {
    let n = 0
    for (const cell of MEMORY_LINES) {
      expect(cell.ref, `${cell.type}: ${cell.text(m(cell.type))}`).toBeTypeOf('function')
      const domain: Milestone[] = []
      for (const tier of [undefined, ...TIER_IDS]) domain.push(m(cell.type, { tier }))
      for (const kind of [undefined, 'ankle soreness', 'wrist sprain']) domain.push(m(cell.type, { kind }))
      for (const [seasonIndex, rank] of [[0, 1], [3, 42], [9, 400], [undefined, undefined]] as const) domain.push(m(cell.type, { seasonIndex, rank }))
      for (const start of [2027, 2031]) for (const mm of domain) {
        expect(render(cell.ref!(mm, start)), `${cell.type}`).toBe(cell.text(mm, start))
        n++
      }
    }
    expect(MEMORY_LINES.length).toBe(11)
    expect(n).toBeGreaterThan(400)
  })

  it('selectMemory: the card carries the line\'s ref; "one year ago" has a ref and a week label does not; the opening week\'s line is a seat', () => {
    const kidAgeAt = (): number => 14
    const milestones: Milestone[] = [{ type: 'title', week: 10, tier: TIER_IDS[0] }, { type: 'injury', week: 20, kind: 'ankle soreness' }]
    const seen = { anniversary: 0, plain: 0, debut: 0 }
    for (let week = 2; week < 140; week++) {
      const card = selectMemory(milestones, week, 'l3-4-seed', kidAgeAt, 2027)
      expect(card).not.toBeNull()
      expect(card!.lineC, `week ${week}`).toBeDefined()
      expect(render(card!.lineC!), `week ${week}`).toBe(card!.line)
      if (card!.kind === 'anniversary') {
        seen.anniversary++
        expect(card!.whenLabelC).toBeDefined()
        expect(render(card!.whenLabelC!)).toBe(card!.whenLabel)
      } else {
        seen.plain++
        expect(card!.whenLabelC, 'a week label is a formatter\'s output, not copy').toBeUndefined()
      }
      if (card!.kind === 'debut') {
        seen.debut++
        expect(card!.lineC).toEqual({ k: card!.line })
        expect(DEBUT_LINES).toContain(card!.line)
      }
    }
    expect(seen.anniversary, 'the sweep reached an anniversary').toBeGreaterThan(0)
    expect(seen.debut, 'and the opening week\'s card').toBeGreaterThan(0)
  })
})

describe('§3 the week notes\' function cells', () => {
  const cells = WEEK_NOTES.filter((n) => typeof n.text === 'function')
  const shorts = [...BIRTHDAY_BANDS.flatMap((b) => b.gifts), BIRTHDAY_DAY_TOGETHER].map((g) => g.short)

  it('26 cells have a hole, every one has a ref, and every ref renders to its text over a seeded sweep of the holes\' domains (age words, gift nouns, repeat ages, knock parts, injury kinds)', () => {
    expect(cells.length).toBe(26)
    for (const c of cells) expect(c.ref, String(c.text)).toBeTypeOf('function')
    const rng = rngFromSeed('l3-4-week-note-sweep')
    const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]!
    const ages = [null, 13, 14, 15, 16, 17, 18, 19, 20, 21, 27, 33]
    const kinds = ['ankle soreness', 'wrist sprain', 'knee strain', 'lower back spasm', 'stress fracture', 'an unnamed thing']
    let n = 0
    for (let i = 0; i < 400; i++) {
      const f = {
        birthdayAge: pick(ages),
        birthdayGift: pick([...shorts, null, '']),
        birthdayRepeatAge: pick([null, 14, 15, 16, 17, 22]),
        knockPart: pick(['ankle', 'wrist', 'lower back', 'shoulder', null]),
        injured: pick([null, ...kinds.map((kind) => ({ kind, weeksRemaining: 3, totalWeeks: 6 }))]),
      } as unknown as DiaryFacts
      for (const c of cells) {
        expect(render(c.ref!(f)), String(c.text)).toBe((c.text as (x: DiaryFacts) => string)(f))
        n++
      }
    }
    expect(n).toBe(26 * 400)
  })

  it('the eight birthday notes: BIRTHDAY_REFS is BIRTHDAY_LINES, cell for cell', () => {
    for (const voice of Object.keys(BIRTHDAY_LINES) as Array<keyof typeof BIRTHDAY_LINES>) {
      for (const stage of ['school', 'after-school'] as const) {
        for (const age of [null, 14, 15, 17]) {
          const f = { birthdayAge: age } as unknown as DiaryFacts
          expect(render(BIRTHDAY_REFS[voice][stage](f)), `${voice}/${stage}`).toBe((BIRTHDAY_LINES[voice][stage] as (x: DiaryFacts) => string)(f))
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §4 – the greeting
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§4 the greeting', () => {
  it('its four refs render to the four words, and `Good night` is the context-tagged key HomeScreen\'s clock table asks for', () => {
    for (const g of GREETINGS) expect(render(greetingRef(g)), g).toBe(g)
    expect(greetingRef('Good night').k).toBe('greeting|Good night')
    for (const k of ['Good morning', 'Good afternoon', 'Good evening', 'greeting|Good night']) expect(CATALOG.keys[k]?.home, k).toContain('src/components/screens/HomeScreen.vue')
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §5 – the birthday prompt and the gift row
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 the birthday – heading, rows, the gift event row', () => {
  it('the heading: the old signature and the new pick agree for every age and seed, and the ref renders to the line', () => {
    let n = 0
    for (const seed of ['a', 'b', 'bench-x-0', 'l3-4', 'seed-5', 'q']) {
      for (let age = 13; age <= 40; age++) {
        const line = birthdayHeadingLine(seed, age)
        expect(line.text, `${seed}/${age}`).toBe(birthdayHeading(seed, age))
        expect(render(line.c), `${seed}/${age}`).toBe(line.text)
        n++
      }
    }
    expect(n).toBe(168)
  })

  it('the four rows: every gift of every band, held or not, under every means licence – labelC and noteC are the keys of the very strings printed', () => {
    const gifts = [...BIRTHDAY_BANDS.flatMap((b) => b.gifts), BIRTHDAY_DAY_TOGETHER]
    let rows = 0
    for (const held of [[], gifts.map((g) => g.id)]) {
      for (const means of [null, 'tight', 'comfortable', 'moneyed'] as const) {
        for (const o of birthdayOptions(gifts, held, means)) {
          expect(o.labelC, o.id).toEqual({ k: o.label })
          expect(o.noteC, o.id).toEqual({ k: o.note })
          expect(render(o.labelC!)).toBe(o.label)
          expect(render(o.noteC!)).toBe(o.note)
          rows++
        }
      }
    }
    expect(rows, 'a real sweep').toBe(gifts.length * 8)
    expect(gifts.length, '45 gifts and the day').toBe(46)
  })

  it('a real prompt: heading, ask and four rows each carry a ref that renders to them; the ref names no option and marks none', () => {
    const { world } = birthdayWorld('l3-4-prompt', 1)
    const p = toSnapshot(world).birthdayPrompt!
    expect(p).not.toBeNull()
    expect(render(p.headingC!)).toBe(p.heading)
    expect(p.askC).toEqual({ k: p.ask })
    expect(render(p.askC!)).toBe(p.ask)
    expect(p.options).toHaveLength(4)
    for (const o of p.options) {
      expect(render(o.labelC!)).toBe(o.label)
      expect(render(o.noteC!)).toBe(o.note)
    }
    // the 11.08 rule, structurally: no field of the prompt names which row answers the ask
    expect(Object.keys(p).sort()).toEqual(['age', 'ask', 'askC', 'heading', 'headingC', 'options', 'week'])
  })

  it('the gift event row: every option of four consecutive birthdays on two careers – text unchanged, the ref renders to it, and the key is the frozen table\'s', () => {
    const keysSeen = new Set<string>()
    let rows = 0
    for (const seed of ['l3-4-gift-a', 'l3-4-gift-b']) {
      let state = birthdayWorld(seed, 1)
      for (let birthday = 0; birthday < 4; birthday++) {
        const prompt = toSnapshot(state.world).birthdayPrompt!
        for (const o of prompt.options) {
          const fork = JSON.parse(JSON.stringify(state.world)) as typeof state.world
          chooseGift(fork, o.id)
          const row = fork.events[fork.events.length - 1]!
          expect(row.text.startsWith('Her birthday.'), row.text).toBe(true)
          expect(row.c, row.text).toBeDefined()
          expect(render(row.c!), 'the ref renders to the stored text').toBe(row.text)
          expect(TABLE.has(row.c!.k), row.c!.k).toBe(true)
          // the L3-0 readers net's verdict for `diary/facts.ts` (`tierFromLabel(e.text)` on a tournament summary): this row is an `info` row and no tier label opens it
          expect(row.type, row.text).toBe('info')
          expect(tierFromLabel(row.text), row.text).toBeUndefined()
          keysSeen.add(row.c!.k)
          rows++
        }
        // answer with the second row and move to the next birthday, so the gift memory (held / repeat notes) is exercised
        chooseGift(state.world, prompt.options[1]!.id)
        state = birthdayWorld(seed, 1, state.world)
      }
    }
    expect(rows).toBe(32)
    expect([...keysSeen].sort(), 'both table sentences are reached (the day appears from sixteen)').toEqual(['Her birthday. No parcel – just the day, kept clear for each other.', 'Her birthday. {0}, opened before the cake.'])
  })
})

/** A career ticked to its next pending birthday (born 15 June, self-coached, as tests/component/birthday-dialog.test.ts does it). */
function birthdayWorld(seed: string, _n: number, from?: ReturnType<typeof createWorld>): { world: ReturnType<typeof createWorld> } {
  const world = from ?? createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = rngFromSeed(`${world.seed}:l3-4:${world.week}`)
  for (let i = 0; i < 120 && pendingBirthday(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  if (pendingBirthday(world) === null) throw new Error('the fixture never reached a birthday')
  return { world }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §6 – played careers: every converted line has its ref, and the strings are the pre-wave tree's byte for byte
// ---------------------------------------------------------------------------------------------------------------------------------------------
interface Rec { [k: string]: unknown }
function play(presetIdx: number, policyIdx: number, weeks: number): { recs: Rec[]; checked: Record<string, number> } {
  const policy = POLICIES[policyIdx]!
  const { world, rng } = openCareer(PRESETS[presetIdx]!, 0, policy)
  const recs: Rec[] = []
  const checked: Record<string, number> = {}
  const check = (field: string, text: string | null | undefined, c: CopyRef | undefined, mustCarry = true): void => {
    if (text === null || text === undefined) return
    if (!c) {
      if (mustCarry) throw new Error(`week ${world.week}: ${field} ${JSON.stringify(text)} has no ref`)
      return
    }
    expect(render(c), `${field} week ${world.week}`).toBe(text)
    checked[field] = (checked[field] ?? 0) + 1
  }
  for (let w = 0; w < weeks; w++) {
    const snap = toSnapshot(world)
    const d = snap.diary
    const rec: Rec = {
      w: world.week,
      photoLine: d.photoLine,
      greeting: d.greeting,
      conditionNote: d.conditionNote,
      travelNote: d.travelNote,
      coachNote: d.coachNote,
      weekNote: d.weekNote,
      memory: d.memory ? { line: d.memory.line, whenLabel: d.memory.whenLabel, kind: d.memory.kind } : null,
    }
    check('photoLine', d.photoLine, d.photoLineC)
    check('greeting', d.greeting, d.greetingC)
    check('conditionNote', d.conditionNote, d.conditionNoteC)
    check('travelNote', d.travelNote, d.travelNoteC)
    check('weekNote', d.weekNote, d.weekNoteC)
    check('coachNote', d.coachNote, d.coachNoteC)
    if (d.memory) {
      check('memory.line', d.memory.line, d.memory.lineC)
      check('memory.whenLabel', d.memory.whenLabel, d.memory.whenLabelC, d.memory.whenLabel === 'one year ago')
    }
    const bp = snap.birthdayPrompt
    if (bp) {
      rec.birthday = { heading: bp.heading, ask: bp.ask, options: bp.options.map((o) => ({ id: o.id, label: o.label, note: o.note })) }
      check('birthday.heading', bp.heading, bp.headingC)
      check('birthday.ask', bp.ask, bp.askC)
      for (const o of bp.options) {
        check('birthday.label', o.label, o.labelC)
        check('birthday.note', o.note, o.noteC)
      }
      chooseGift(world, bp.options[Math.floor(world.week / 52) % bp.options.length]!.id)
      const last = world.events[world.events.length - 1]!
      rec.birthdayEvent = last.text
      check('birthday.event', last.text, last.c)
    }
    recs.push(rec)
    stepCareerWeek(world, rng, policy)
  }
  return { recs, checked }
}

describe('§6 played careers', () => {
  // captured on the PRE-WAVE tree (054a73a2, a throwaway worktree) by the same loop: careers 5/0 and 0/1, 150 weeks, 102,977 bytes of canonical JSON
  const PRE_WAVE_DIGEST = 0xaea42fda
  // played once, on first use, INSIDE a test – a ref that drifts from its text must fail a test by name, not take the whole file down at collection
  let played: Array<ReturnType<typeof play>> | null = null
  // careers 5/0 and 0/1 are the DIGEST's pair (captured on the pre-wave tree); 5/1 is a third, played for the families the first two never reach – the coach travels with her only there
  const careersPlayed = (): Array<ReturnType<typeof play>> => (played ??= [play(5, 0, 150), play(0, 1, 150), play(5, 1, 150)])

  it('every converted line of 450 played weeks (three careers) carries a ref that renders to it (and the sweep reached each family)', () => {
    const total: Record<string, number> = {}
    for (const { checked } of careersPlayed()) for (const [k, v] of Object.entries(checked)) total[k] = (total[k] ?? 0) + v
    for (const f of ['photoLine', 'greeting', 'conditionNote', 'travelNote', 'weekNote', 'coachNote', 'memory.line', 'birthday.heading', 'birthday.ask', 'birthday.label', 'birthday.note', 'birthday.event']) {
      expect(total[f], `${f} was exercised`).toBeGreaterThan(0)
    }
  })

  it('⭐ PICK-STABILITY: the diary strings of both careers hash to the pre-wave tree\'s digest – no pick key, draw count or pool order moved', () => {
    const joined = careersPlayed().slice(0, 2).map((c) => JSON.stringify(c.recs)).join('\n')
    expect(fnv1a(joined), `bytes ${joined.length}`).toBe(PRE_WAVE_DIGEST)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §7 – the pick keys: the sub-streams the class-(b) files draw on. This wave adds none and moves none.
// ---------------------------------------------------------------------------------------------------------------------------------------------
const PICK_KEYS: readonly string[] = [
  'src/engine/diary.ts::`${seed}:diary:${week}:memory`',
  'src/engine/diary.ts::`${seed}:greet:${facts.week}`',
  'src/engine/diary.ts::`${seed}:memory:debut:${week}`',
  'src/engine/diary/pool.ts::`${seed}:diary:${facts.week}:${surface}`',
  'src/engine/diary/travelHome.ts::`${args.seed}:travelmood:${args.week}`',
  'src/engine/diary/travelHome.ts::`${seed}:travel:${week}`',
  'src/engine/diary/travelNotes.ts::`${seed}:coachtrip:${week}`',
  'src/engine/diary/travelNotes.ts::`${seed}:travelnote:${travel.week}`',
  'src/engine/diary/weekNotes.ts::`${seed}:weeknote:${facts.week}`',
  'src/engine/diary/weekNotes.ts::`${seed}:weeknote:entry`',
  'src/engine/world/birthday.ts::`${seed}:birthday:${age}:heading`',
  'src/engine/world/birthday.ts::`${seed}:birthday:${age}`',
  'src/engine/world/birthday.ts::`${seed}:birthday:cycle:${bandKey(band)}`',
]

describe('§7 the pick keys', () => {
  it('the class-(b) files construct exactly these sub-streams (a new rngFromSeed here is a new draw: decide it, in a wave that is allowed to)', () => {
    const found: string[] = []
    for (const { rel, sf } of parsed) {
      eachNode(sf, (n) => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'rngFromSeed' && n.arguments[0]) found.push(`${rel}::${n.arguments[0].getText()}`)
      })
    }
    expect(found.sort()).toEqual([...PICK_KEYS].sort())
  })

  it('and none of those files reads the wall clock or a global dice', () => {
    for (const { rel, sf } of parsed) {
      const src = sf.getFullText().split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
      expect(/Math\.random\(|new Date\(|Date\.now\(/.test(src), rel).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §8 – the week-note corpus: 324 authored cells (docs/localization/ru-diary-week-notes-corpus-2026-10.md: 148 core + 44 special + 132 explicit)
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§8 the 324 cells', () => {
  const leaves = (o: unknown): unknown[] => (typeof o === 'object' && o !== null ? Object.values(o as Record<string, unknown>).flatMap(leaves) : [o])

  it('counted by structure: the voice matrix 128, exams 4, birthdays 8, off-season 8 (148), the special states 28 + 4 + 4 + 8 (44), and 132 explicit rows', () => {
    expect(leaves(VOICE_LINES)).toHaveLength(128)
    expect(leaves(EXAM_LINES)).toHaveLength(4)
    expect(leaves(BIRTHDAY_LINES)).toHaveLength(8)
    expect(leaves(OFF_SEASON_LINES)).toHaveLength(8)
    expect(leaves(MOTHERHOOD_WORDS)).toHaveLength(28)
    expect(leaves(BEREAVED_WORDS)).toHaveLength(4)
    expect(leaves(DIVORCED_WORDS)).toHaveLength(4)
    expect(leaves(FORK_AFTERMATH_WORDS)).toHaveLength(8)
    expect(WEEK_NOTES.length - (148 + 44), 'explicit rows').toBe(132)
    expect(WEEK_NOTES.length).toBe(324)
  })

  it('CONVERSION COVERAGE: 324 of 324 – 298 static cells (the seat `{ k: text }`) and 26 function cells (a ref of their own), none left unconverted, none forced', () => {
    const fn = WEEK_NOTES.filter((n) => typeof n.text === 'function')
    const st = WEEK_NOTES.filter((n) => typeof n.text === 'string')
    expect([st.length, fn.length]).toEqual([298, 26])
    expect(fn.every((n) => typeof n.ref === 'function')).toBe(true)
    expect(st.every((n) => n.ref === undefined), 'a static cell carries no ref: its key is itself').toBe(true)
    expect(new Set(st.map((n) => n.text)).size, 'the 298 static strings are distinct (a duplicate would be one key for two cells)').toBe(298)
  })

  it('the pool shapes the pick walks are unchanged: 105 photo / condition cells, 73 travel scraps, 5 coach lines, 324 week notes', () => {
    expect([DIARY_POOL.length, TRAVEL_NOTES.length, COACH_TRIP_NOTES.length, WEEK_NOTES.length]).toEqual([105, 73, 5, 324])
  })
})
