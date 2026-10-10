// L3-5 (10.10) – THE LIFE BEATS RIDE THE SNAPSHOT AS COPYREFS BESIDE THE ENGLISH, AND THEIR FEED ROWS CARRY `c`. docs/specs/i18n-2026-10.md §3.2, §5, §8 rows L3-0..L3-5.
//
// WHAT THE WAVE DID. A life-beat prompt is CLASS (b): `lifeBeatPromptFor` assembles it at SNAPSHOT TIME off the row's stamped facts (kind, detail, the frame and the spouse's line the raise
// stamped, the world's voice and bond) and nothing about it is stored – so the move is the diary's, not the ledger's: the engine writes a CopyRef BESIDE each English string
// (`LifeBeatPrompt.headingC` / `saidC`, `LifeBeatFollowUp.saidC`, `SoftBeatInvite.cardC`), the dialog and the Home card draw `eventText({ text, c })`, no schema moves and NO COPY IS AUTHORED
// (invariant 4: not one pool cell, heading or corpus string was edited). Nearly every string is a SEAT – a pool cell whose English IS its key, and which the census already reads (the copy leaves
// `lifeBeat/*Copy.ts`, the hub's SCREAMING tables, the whole 51-situation corpus). Exactly two prompt lines are COMPOSED, and both are `{0} {1}` over seats and sentences, never a product
// in the catalog: small talk's frame joined to its opener, and the announcement's pool line joined to how long they have been together (nine whole sentences, one per shape of the span).
// The TWELVE feed sinks that wrote `text` alone (the answer row, the kept news, the ending, the divorce, the leak, the key, the pause, the birth, the loss, the wedding) write `c` beside it with
// the frozen v92 table's own keys – three constants moved into their kind's copy LEAF so the census sees them (the A-06 direction: a kind's copy is a leaf the hazard imports).
//
// WHAT THIS FILE HOLDS, section by section:
//   §1 the key law for class (b)       – tests/helpers/l3-5-life-keys.ts is exactly what the life files spell that no old save can hold: the nine span sentences and the `{0} {1}` join
//   §2 her line                        – `lifeBeatSaidRef` renders to `lifeBeatSaid` over EVERY reachable (kind x voice x register x bond x wants x stage x frame x line), keys all in the catalog
//   §3 the headings                    – every heading any axis can produce is a catalog key (10J's heard headings and 10K's headline frame included)
//   §4 her replies                     – every follow-up paragraph of the 51 situations x 4 voices x 3 stances and of the fork's continuation has its seat
//   §5 the span sentence               – `engagedWithTogetherRef` renders to `engagedWithTogether` for every week from 0 to 5,200
//   §6 the 51-situation corpus         – the counts, and that every opener / shared beat / label / reply is a catalog key (OUTSIDE_CATALOG for this family: 0)
//   §7 the sinks' sentences            – every constant a sink's seat can hold is a key of the frozen table AND of the catalog (the L3-1 net's §1b walks the same pools as a seat law)
//   §8 played careers                  – the pre-wave tree's digest of every string a player was shown (two boosted 300-week careers, answers rotated), every ref rendering to its text
//   §9 the pick keys                   – the sub-stream seed keys of the life files, as a list: this wave adds none and moves none
//   §10 the fridge notes               – UI-side, picked by a local hash: the pools are catalog keys, the pick is byte-stable, the cadence rows are pinned
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { allTemplateKeys } from '../src/engine/migrations/reverseMatch'
import { renderCopyRef, SOURCE_LOCALE, splitContext, type CopyRef } from '../src/shared/i18n'
import type { BondBand, DiaryLifeStage, LifeBeatKind, MoodRegister } from '../src/shared/protocol'
import type { Temperament } from '../src/engine/spirit'
import {
  ENDS_READS,
  ENDS_REGISTERS,
  FORK_STOP_DRIVERS,
  FORK_WANTS,
  LIFE_BEAT_BLOCKING,
  PARTNER_WANTS,
  SMALL_TALK_FRAMES,
  SMALL_TALK_SITUATIONS,
  SPOUSE_VIEW_OCCASIONS,
  endedKeptRow,
  lifeBeatFollowUps,
  lifeBeatHeading,
  lifeBeatSaid,
  lifeBeatSaidRef,
  metKeptRow,
  presenceOf,
  type HeardRead,
} from '../src/engine/world/lifeBeat'
import type { EndsRead, EndsRegister } from '../src/engine/world/lifeBeat/endedCopy'
import { PSY_COUNSEL, PSY_REGISTERS } from '../src/engine/world/lifeBeat/forkPsyCopy'
import { LEGACY_SMALL_TALK_SUBJECTS, SMALL_TALK_CARD } from '../src/engine/world/lifeBeat/smallTalkCopy'
import { SPOUSE_VIEW_CARD, SPOUSE_VIEW_SAID } from '../src/engine/world/lifeBeat/spouseViewCopy'
import { engagedWithTogether, engagedWithTogetherRef } from '../src/engine/world/lifeBeat/weddingCopy'
import { LEAK_EVENT } from '../src/engine/world/lifeBeat/leakCopy'
import { LOSS_HER_LINE, PAUSE_EVENT } from '../src/engine/world/lifeBeat/pregnancyCopy'
import { OWN_KEY_CARD, OWN_KEY_ROW } from '../src/engine/world/lifeBeat/ownKeyCopy'
import { divorcedKeptRow } from '../src/engine/world/lifeBeat/divorcedCopy'
import { buildLifeBeatPrompt, buildSoftBeatInvite, createWorld, raiseLifeBeat } from '../src/engine/world'
import { LIFE_CLASS_B_KEYS } from './helpers/l3-5-life-keys'
import { fnv1a } from './helpers/hash'
import { playLife } from './helpers/l3-5-life-play'
import {
  AWAY_NOTE_CHANCE,
  COLD_AWAY_NOTES,
  EXAM_NOTES,
  FRIDGE_NOTES,
  INDEPENDENT_NOTES,
  INDEPENDENT_TRIP_NOTES,
  STRAINED_AWAY_NOTES,
  TRIP_NOTES,
  fridgeNoteFor,
  type NoteMood,
} from '../src/composables/fridgeNote'

const ROOT = resolve(__dirname, '..')
const EN = { locale: SOURCE_LOCALE }
const TABLE = new Set(allTemplateKeys())
const CATALOG = JSON.parse(readFileSync(join(ROOT, 'src/i18n/catalog.en.json'), 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const render = (c: CopyRef): string => renderCopyRef(c, EN)
const inCatalog = (k: string): boolean => CATALOG.keys[k] !== undefined
const keysOf = (c: CopyRef, acc: string[] = []): string[] => {
  acc.push(c.k)
  for (const p of c.p ?? []) if (p !== null && typeof p === 'object') keysOf(p, acc)
  return acc
}

const VOICES: readonly Temperament[] = ['sunny', 'fiery', 'quiet', 'deep']
const BONDS: readonly BondBand[] = ['close', 'steady', 'strained', 'cold']
const REGISTERS: readonly MoodRegister[] = ['bright', 'level', 'low']
const STAGES: readonly DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']
const KINDS = Object.keys(LIFE_BEAT_BLOCKING) as LifeBeatKind[]

/** the life files: the hub, every kind module, the corpus */
const LIFE_FILES: readonly string[] = [
  'src/engine/world/lifeBeat.ts',
  ...readdirSync(join(ROOT, 'src/engine/world/lifeBeat'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => `src/engine/world/lifeBeat/${f}`),
]
const parsed = LIFE_FILES.map((rel) => ({ rel, sf: ts.createSourceFile(rel, readFileSync(join(ROOT, rel), 'utf8'), ts.ScriptTarget.Latest, true) }))
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

/** every string a seat can hold must be a valid key: braces and backslashes are message syntax, a `|` tag would be read as a context */
function expectSeatable(s: string): void {
  expect(/[{}\\]/.test(s), `a seat string carries message syntax: ${s}`).toBe(false)
  expect(splitContext(s).ctx, `a seat string reads as a context tag: ${s}`).toBeNull()
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1 – the key law for class (b)
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§1 the key law – the life files\' cp keys are a list, and only the three milestone sentences are the frozen table\'s', () => {
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
    expect(found.size, 'distinct cp keys in the life files').toBeGreaterThan(8)
  })

  it('tests/helpers/l3-5-life-keys.ts is EXACTLY the keys these files spell that no old save can hold – no more, no fewer', () => {
    const expected = [...found.keys()].filter((k) => !TABLE.has(k)).sort()
    if (process.env.L35_WRITE_KEYS === '1') {
      // the WRITE MODE (L3-4's): the header stays, the list is rewritten from the scan – a deliberate act, never a side effect of a plain run
      const path = join(ROOT, 'tests/helpers/l3-5-life-keys.ts')
      const head = readFileSync(path, 'utf8').split('export const LIFE_CLASS_B_KEYS')[0]!
      writeFileSync(path, `${head}export const LIFE_CLASS_B_KEYS: readonly string[] = [\n${expected.map((k) => `  ${JSON.stringify(k)},`).join('\n')}\n]\n`)
      return
    }
    expect([...LIFE_CLASS_B_KEYS].sort(), 'regenerate the list, or write the key the table already has').toEqual(expected)
  })

  it('the list is the nine span sentences and the join – and every one is in the English catalog and WIRED', () => {
    expect(LIFE_CLASS_B_KEYS.length).toBe(10)
    expect(LIFE_CLASS_B_KEYS.filter((k) => k.startsWith('They have been together for ')).length).toBe(9)
    expect(LIFE_CLASS_B_KEYS).toContain('{0} {1}')
    const missing = LIFE_CLASS_B_KEYS.filter((k) => CATALOG.keys[k]?.wrapped !== true)
    expect(missing, 'run npm run i18n:extract').toEqual([])
  })

  it('the only life-file keys the frozen table HOLDS are the three milestone sentences – the birth (pregnancy.ts), the wedding day (wedding.ts) and the divorce (ended.ts)', () => {
    const inTable = [...found.entries()].filter(([k]) => TABLE.has(k))
    expect(inTable.map(([k]) => k).sort()).toEqual([
      'Her daughter was born this week. The family has somebody new in it.',
      'Her wedding day. The family was there, whatever had been said about it.',
      'The marriage ended. We had no say in it, only in what we said next.',
    ])
    const home: Record<string, string> = { 'Her daughter': 'pregnancy', 'Her wedding': 'wedding', 'The marriage': 'ended' }
    for (const [k, files] of inTable) expect([...files], k).toEqual([`src/engine/world/lifeBeat/${home[Object.keys(home).find((p) => k.startsWith(p))!]}.ts`])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §2 – her line
// ---------------------------------------------------------------------------------------------------------------------------------------------
interface SaidCase {
  kind: LifeBeatKind
  detail: string
  voice: Temperament
  register: MoodRegister
  bond: BondBand
  wants: 'open' | 'private'
  stage: DiaryLifeStage
  driver: (typeof FORK_STOP_DRIVERS)[number]
  endsRegister: EndsRegister
  frame: string | undefined
  line: number | undefined
}
const BASE: Omit<SaidCase, 'kind' | 'detail' | 'voice'> = { register: 'level', bond: 'close', wants: 'open', stage: 'school', driver: 'own', endsRegister: 'told-now', frame: undefined, line: undefined }

/** every reachable argument tuple of `lifeBeatSaid`, by kind – only the axes a kind READS are varied (the others are fixed to the standing default), and a tuple the function refuses is skipped */
function* saidCases(): Generator<SaidCase> {
  for (const voice of VOICES) {
    for (const s of SMALL_TALK_SITUATIONS) {
      if (s.voices[voice] === undefined) continue
      for (const stage of s.stages) for (const frame of [undefined, ...SMALL_TALK_FRAMES[presenceOf(stage)].map((f) => f.id)]) yield { ...BASE, kind: 'small-talk', detail: `${s.subject}:${s.id}`, voice, stage, frame }
    }
    for (const subject of LEGACY_SMALL_TALK_SUBJECTS) for (const stage of STAGES) yield { ...BASE, kind: 'small-talk', detail: subject, voice, stage }
    for (const want of FORK_WANTS) for (const register of REGISTERS) for (const bond of BONDS) for (const driver of FORK_STOP_DRIVERS) yield { ...BASE, kind: 'fork-opinion', detail: want, voice, register, bond, driver }
    for (const bond of BONDS) for (const wants of PARTNER_WANTS) for (const stage of STAGES) yield { ...BASE, kind: 'met', detail: 'p:1', voice, bond, wants, stage }
    for (const bond of BONDS) for (const endsRegister of ENDS_REGISTERS) for (const stage of STAGES) yield { ...BASE, kind: 'ended', detail: 'p:1', voice, bond, endsRegister, stage }
    for (const kind of ['engaged', 'expecting', 'bereavement', 'divorced'] as const) for (const bond of BONDS) yield { ...BASE, kind, detail: 'p:1', voice, bond }
  }
  for (const driver of FORK_STOP_DRIVERS) yield { ...BASE, kind: 'fork-counsel', detail: driver, voice: 'sunny' }
  for (const reg of PSY_REGISTERS) if (PSY_COUNSEL[reg] !== null) for (const driver of FORK_STOP_DRIVERS) yield { ...BASE, kind: 'fork-psy', detail: `${reg}:${driver}`, voice: 'sunny' }
  for (const occasion of SPOUSE_VIEW_OCCASIONS) for (const line of [undefined, ...SPOUSE_VIEW_SAID[occasion].map((_, i) => i)]) yield { ...BASE, kind: 'spouse-view', detail: occasion, voice: 'sunny', line }
  yield { ...BASE, kind: 'own-key', detail: 'own-key', voice: 'sunny' }
  yield { ...BASE, kind: 'return-plan', detail: 'x', voice: 'sunny' }
}

describe('§2 her line – the ref renders to the line over every reachable tuple, and every key is in the catalog', () => {
  const walked: Record<string, number> = {}
  const keysSeen = new Set<string>()
  const failures: string[] = []
  const composed = new Set<string>()
  for (const c of saidCases()) {
    let said: string
    try {
      said = lifeBeatSaid(c.kind, c.detail, c.voice, c.register, c.bond, c.wants, c.stage, c.driver, c.endsRegister, c.frame, c.line)
    } catch {
      continue
    }
    walked[c.kind] = (walked[c.kind] ?? 0) + 1
    const ref = lifeBeatSaidRef(c.kind, c.detail, c.voice, c.stage, c.frame, said)
    if (render(ref) !== said) failures.push(`${c.kind} ${c.detail} ${c.voice}: ${JSON.stringify(ref)} renders ${JSON.stringify(render(ref))}`)
    for (const k of keysOf(ref)) keysSeen.add(k)
    if (ref.p !== undefined) composed.add(ref.k)
  }

  it('walks every kind of beat (the sweep is not blind)', () => {
    expect(Object.keys(walked).sort()).toEqual([...KINDS].sort())
    expect(walked['small-talk'], 'small talk: 51 situations x their voices x their stages x (the row\'s own frame or none + the presence\'s nine) + the three legacy subjects x 4 voices x 4 stages').toBe(4728)
    expect(walked['fork-opinion']).toBe(3 * 4 * 3 * 4 * 3)
  })

  it('every ref renders to the English line it sits beside (0 mismatches)', () => {
    expect(failures.slice(0, 5)).toEqual([])
  })

  it('the ONLY composed line is small talk\'s frame + opener: `{0} {1}` over two seats – every other line is one seat, the string being its own key', () => {
    expect([...composed]).toEqual(['{0} {1}'])
    const seat = lifeBeatSaidRef('fork-opinion', 'tour', 'sunny', 'school', undefined, 'any line')
    expect(seat).toEqual({ k: 'any line' })
  })

  it('every key a line can carry is in the English catalog (OUTSIDE_CATALOG for her lines: 0) and is seatable', () => {
    const outside = [...keysSeen].filter((k) => !inCatalog(k))
    expect(outside, 'a line the owner\'s row cannot join').toEqual([])
    for (const k of keysSeen) if (k !== '{0} {1}') expectSeatable(k)
    expect(keysSeen.size, 'distinct keys behind her lines (frames, openers, pool cells, the join)').toBeGreaterThan(300)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §3 – the headings
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§3 the headings – every one any axis can produce is a catalog key (the prompt writes it as its own seat)', () => {
  const headings = new Set<string>()
  const heardCells: Array<HeardRead | null> = [null, ...VOICES.flatMap((voice) => PARTNER_WANTS.map((wants) => ({ voice, wants })))]
  for (const kind of KINDS)
    for (const register of REGISTERS)
      for (const bond of BONDS)
        for (const endsRegister of ENDS_REGISTERS)
          for (const read of ENDS_READS as readonly EndsRead[])
            for (const heard of heardCells)
              for (const fromHeadline of [false, true]) {
                try {
                  headings.add(lifeBeatHeading(kind, register, bond, endsRegister, read, heard, fromHeadline))
                } catch {
                  /* an axis tuple the kind refuses */
                }
              }

  it('the sweep reaches every kind\'s frame, the heard variants and the headline frame', () => {
    expect(headings.size, 'distinct headings').toBeGreaterThan(40)
  })

  it('every heading is a catalog key and seatable', () => {
    const outside = [...headings].filter((h) => !inCatalog(h))
    expect(outside).toEqual([])
    for (const h of headings) expectSeatable(h)
  })

  it('the three soft cards (tier 1\'s, the spouse\'s, the key\'s) are catalog keys and seatable – the Home card draws `cardC`, the seat of the very string beside it', () => {
    for (const card of [SMALL_TALK_CARD, SPOUSE_VIEW_CARD, OWN_KEY_CARD]) {
      expect(inCatalog(card), card).toBe(true)
      expectSeatable(card)
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §4 – her replies
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§4 her replies – each follow-up paragraph has its seat, over the 51 situations and the fork\'s continuation', () => {
  it('small talk: every situation x voice x stance carries a ref per paragraph that renders to it (the shared second beat included)', () => {
    let paragraphs = 0
    let shared = 0
    const outside: string[] = []
    for (const s of SMALL_TALK_SITUATIONS)
      for (const voice of VOICES) {
        if (s.voices[voice] === undefined) continue
        const ups = lifeBeatFollowUps('small-talk', `${s.subject}:${s.id}`, voice, 'close')
        expect(ups.length, `${s.id} ${voice}`).toBe(3)
        for (const up of ups) {
          expect(up.saidC, `${s.id} ${voice} ${up.optionId} carries refs`).toBeDefined()
          expect(up.saidC!.length).toBe(up.said.length)
          up.said.forEach((line, i) => {
            expect(render(up.saidC![i]!), `${s.id} ${voice}`).toBe(line)
            expect(up.saidC![i], 'a paragraph is one seat').toEqual({ k: line })
            if (!inCatalog(line)) outside.push(line)
            paragraphs++
          })
          if (up.said.length === 2) shared++
        }
      }
    expect(outside, 'a reply the owner\'s row cannot join').toEqual([])
    expect(paragraphs, '612 replies + the 4 shared second beats across the three stances of their columns').toBe(612 + 4 * 3)
    expect(shared, 'the four `story` columns, three stances each').toBe(12)
  })

  it('the fork\'s continuation (HER_CONTINUATION): a seat per voice x want, only where she speaks in her own voice', () => {
    let n = 0
    for (const voice of VOICES)
      for (const want of FORK_WANTS)
        for (const bond of BONDS) {
          const ups = lifeBeatFollowUps('fork-opinion', want, voice, bond)
          const own = bond === 'close' || bond === 'steady'
          expect(ups.length, `${voice} ${want} ${bond}`).toBe(own ? 1 : 0)
          for (const up of ups) {
            expect(up.optionId).toBe('listen')
            expect(up.saidC).toEqual([{ k: up.said[0]! }])
            expect(inCatalog(up.said[0]!)).toBe(true)
            n++
          }
        }
    expect(n).toBe(4 * 3 * 2)
  })

  it('every other kind offers no reply (and so no refs)', () => {
    for (const kind of KINDS) {
      if (kind === 'small-talk' || kind === 'fork-opinion') continue
      expect(lifeBeatFollowUps(kind, 'x', 'sunny', 'close'), kind).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §5 – the span sentence
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 the announcement\'s span sentence – nine whole sentences, one per shape', () => {
  it('the ref renders to `engagedWithTogether` for every week from 0 to 5,200 (a hundred years), and adds nothing when there is nothing to add', () => {
    const keys = new Set<string>()
    for (let w = 0; w <= 5200; w++) {
      const ref = engagedWithTogetherRef({ k: 'POOL' }, w)
      expect(render(ref), `week ${w}`).toBe(engagedWithTogether('POOL', w))
      expect(ref.k.startsWith('{0} '), 'joined to the pool line by `{0} {1}`').toBe(true)
      for (const k of keysOf(ref)) keys.add(k)
    }
    keys.delete('POOL')
    keys.delete('{0} {1}')
    expect([...keys].sort()).toEqual(LIFE_CLASS_B_KEYS.filter((k) => k.startsWith('They have been together for ')).sort())
    expect(engagedWithTogetherRef({ k: 'POOL' }, null)).toEqual({ k: 'POOL' })
  })

  it('a counted form is a whole sentence per form (the house rule): 1 month / months, 1 year / years, with and without the months over', () => {
    const k = (w: number): string => (engagedWithTogetherRef({ k: 'X' }, w).p![1] as CopyRef).k
    expect(k(0)).toBe('They have been together for less than a month.')
    expect(k(5)).toBe('They have been together for 1 month.')
    expect(k(9)).toBe('They have been together for {0} months.')
    expect(k(52)).toBe('They have been together for 1 year.')
    expect(k(57)).toBe('They have been together for 1 year and 1 month.')
    expect(k(70)).toBe('They have been together for 1 year and {0} months.')
    expect(k(104)).toBe('They have been together for {0} years.')
    expect(k(109)).toBe('They have been together for {0} years and 1 month.')
    expect(k(120)).toBe('They have been together for {0} years and {1} months.')
  })
})

describe('§5b the announcement\'s PROMPT, through the real assembly – the pool line is what `withRefs` finds once the span\'s suffix is taken off', () => {
  /** a real world with one love episode `d` weeks deep and the announcement raised on it */
  function announced(d: number, bond: number) {
    const world = createWorld(`l35-engaged-${d}-${bond}`)
    world.week = 1400
    world.bond = bond
    world.loveEpisodes = [{ id: 'p:1', sinceWeek: world.week - d, endedWeek: null, knownWeek: world.week - d + 2, wants: 'open', partnerId: 'p:1', publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: null }]
    raiseLifeBeat(world, 'engaged', 'p:1')
    return world
  }

  it('over durations of every shape and both registers (her own voice at a close bond, the dry card at a cold one): the heading is its own seat, her line\'s ref renders to it, and the sentence is the span\'s', () => {
    let n = 0
    for (const bond of [70, 5]) {
      for (const d of [0, 5, 9, 52, 57, 70, 104, 109, 120, 700, 2600]) {
        const prompt = buildLifeBeatPrompt(announced(d, bond))!
        expect(prompt.kind).toBe('engaged')
        expect(prompt.headingC).toEqual({ k: prompt.heading })
        expect(render(prompt.saidC!), `${d} weeks @ bond ${bond}`).toBe(prompt.said)
        expect(prompt.saidC!.k, 'pool line joined to the span\'s sentence').toBe('{0} {1}')
        expect((prompt.saidC!.p![0] as CopyRef).p, 'the pool line is one seat').toBeUndefined()
        expect(prompt.said.endsWith(engagedWithTogether('', d).trim()), 'the suffix is the span\'s').toBe(true)
        expect(inCatalog((prompt.saidC!.p![0] as CopyRef).k), 'and the pool line is a catalog key').toBe(true)
        n++
      }
    }
    expect(n).toBe(22)
  })

  it('the soft entrance rides the same decorator: tier 1\'s card carries `cardC` and the prompt behind it carries its refs', () => {
    const world = createWorld('l35-soft')
    world.week = 700
    world.bond = 70
    raiseLifeBeat(world, 'small-talk', 'worry', undefined, undefined)
    const invite = buildSoftBeatInvite(world)
    expect(invite, 'a legacy small-talk row is soft and live').not.toBeNull()
    expect(invite!.cardC).toEqual({ k: invite!.card })
    expect(render(invite!.prompt.saidC!)).toBe(invite!.prompt.said)
    expect(invite!.prompt.headingC).toEqual({ k: invite!.prompt.heading })
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §6 – the 51-situation corpus
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** Corpus strings the CATALOG does not carry, by family. The whole corpus file is a census copy home, so this is 0 – and it can only fall. */
const OUTSIDE_CATALOG = { openers: 0, labels: 0, replies: 0, shared: 0 } as const

describe('§6 the 51-situation corpus', () => {
  const openers = new Set<string>()
  const labels = new Set<string>()
  const replies = new Set<string>()
  const shared = new Set<string>()
  let columns = 0
  for (const s of SMALL_TALK_SITUATIONS)
    for (const voice of VOICES) {
      const col = s.voices[voice]
      if (col === undefined) continue
      columns++
      openers.add(col.opener)
      if (col.shared !== undefined) shared.add(col.shared)
      for (const stance of ['invite', 'respond', 'space'] as const) {
        labels.add(col.branches[stance].label)
        replies.add(col.branches[stance].said)
      }
    }

  it('is 51 situations in 204 voice columns: 204 openers, 612 replies, 4 shared second beats (the corpus header\'s own numbers)', () => {
    expect(SMALL_TALK_SITUATIONS.length).toBe(51)
    expect(columns).toBe(204)
    expect(openers.size).toBe(204)
    expect(replies.size).toBe(612)
    expect(shared.size).toBe(4)
    expect(labels.size, 'distinct stance labels').toBe(145)
  })

  it('every opener, label, reply and shared beat is a catalog key and seatable (OUTSIDE_CATALOG for the corpus: 0)', () => {
    const outside = (set: ReadonlySet<string>): number => [...set].filter((s) => !inCatalog(s)).length
    expect({ openers: outside(openers), labels: outside(labels), replies: outside(replies), shared: outside(shared) }).toEqual(OUTSIDE_CATALOG)
    for (const s of [...openers, ...labels, ...replies, ...shared]) expectSeatable(s)
  })

  it('the frame pool is 18 seats (9 per presence), each a catalog key – the `{0} {1}` join never makes the (frame x opener) product a key', () => {
    const lines = [...SMALL_TALK_FRAMES.roof, ...SMALL_TALK_FRAMES.away].map((f) => f.line)
    expect(lines.length).toBe(18)
    for (const l of lines) {
      expect(inCatalog(l), l).toBe(true)
      expectSeatable(l)
    }
    expect(Object.keys(CATALOG.keys).filter((k) => lines.some((l) => k.startsWith(l) && k.length > l.length + 1 && k.includes('" ')))).toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §7 – the sinks' sentences
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** the string literals under `const NAME = …` in a life file (a table's every cell) */
function literalsOf(rel: string, name: string): string[] {
  const out: string[] = []
  const { sf } = parsed.find((p) => p.rel === rel)!
  eachNode(sf, (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) {
      const go = (m: ts.Node): void => {
        if (ts.isStringLiteral(m) || ts.isNoSubstitutionTemplateLiteral(m)) out.push(m.text)
        ts.forEachChild(m, go)
      }
      go(n.initializer)
    }
  })
  return out
}

describe('§7 every sentence a sink\'s seat can hold is a key of the frozen v92 table AND of the English catalog', () => {
  const heard: Array<HeardRead | null> = [null, ...VOICES.flatMap((voice) => PARTNER_WANTS.map((wants) => ({ voice, wants })))]
  const sentences = new Set<string>()
  // the answer feed (ANSWER_EVENT, every kind's lines) and the news the delivery writes (MET_EVENT x 2, ENDED_*), read from the hub's tables
  for (const name of ['ANSWER_EVENT', 'MET_EVENT', 'MET_EVENT_HEARD', 'ENDED_NOW_EVENT', 'ENDED_LATE_EVENT', 'ENDED_EVENT_HEARD'])
    for (const s of literalsOf('src/engine/world/lifeBeat.ts', name)) if (s.includes(' ')) sentences.add(s)
  for (const band of BONDS) for (const wants of PARTNER_WANTS) for (const h of heard) sentences.add(metKeptRow(band, wants, h))
  for (const register of ENDS_REGISTERS) for (const read of ENDS_READS) for (const h of heard) sentences.add(endedKeptRow(register, read, h))
  sentences.add(divorcedKeptRow())
  sentences.add(OWN_KEY_ROW)
  sentences.add(PAUSE_EVENT)
  // the birth milestone: `BIRTH_EVENT` stays in pregnancy.ts with its note, and its ref is the same sentence spelt as a `cp` key
  const birth = literalsOf('src/engine/world/lifeBeat/pregnancy.ts', 'BIRTH_EVENT')
  for (const s of birth) sentences.add(s)
  for (const s of Object.values(LEAK_EVENT)) sentences.add(s)
  for (const cell of Object.values(LOSS_HER_LINE)) if (cell !== null) for (const s of [cell.told, cell.untold]) sentences.add(s)

  it('the pools were found (the sweep is not blind): 28 answer lines, the kept rows, the leak\'s two, the key, the pause, the birth, the loss lines', () => {
    expect(literalsOf('src/engine/world/lifeBeat.ts', 'ANSWER_EVENT').filter((s) => s.includes(' ')).length).toBe(28)
    expect(sentences.size).toBeGreaterThan(50)
  })

  it('the birth milestone: the constant and the `cp` key beside it are one sentence (the call site is what makes it a catalog key)', () => {
    expect(birth).toEqual(['Her daughter was born this week. The family has somebody new in it.'])
    const keys: string[] = []
    eachNode(parsed.find((p) => p.rel === 'src/engine/world/lifeBeat/pregnancy.ts')!.sf, (n) => {
      if (ts.isTaggedTemplateExpression(n) && n.tag.getText() === 'cp') keys.push(cpKey(n))
    })
    expect(keys).toEqual(birth)
  })

  it('every one is a key of the frozen v92 table (a stored row migrated from an old save lands on the SAME key)', () => {
    expect([...sentences].filter((s) => !TABLE.has(s))).toEqual([])
  })

  it('every one is a key of the English catalog (the three constants moved into their copy leaves so the census reads them) and seatable', () => {
    expect([...sentences].filter((s) => !inCatalog(s))).toEqual([])
    for (const s of sentences) expectSeatable(s)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §8 – played careers: the strings a player was shown, byte for byte the pre-wave tree's; every ref renders to its text
// ---------------------------------------------------------------------------------------------------------------------------------------------
/** per career: the digest of every string the player was shown (prompts, replies, cards – the English only), captured on the PRE-WAVE tree (0b60a1b3, a throwaway worktree) by the same
 *  driver: `tests/helpers/l3-5-life-play.ts`. Boosted life events, 300 weeks, every pending beat answered by rotating the offered options. */
const PRE_WAVE_STRINGS: Record<string, string> = { '5/0': 'cb62362', '0/1': '665c9a8d' }
/** and the bench's MAIN stream, three draws on from the last week of each career, from the same pre-wave runs – the wave draws nothing, and the next draws prove the position is the pre-wave one */
const PRE_WAVE_NEXT3: Record<string, number[]> = {
  '5/0': [0.18923983839340508, 0.10872006509453058, 0.37577401218004525],
  '0/1': [0.5724380605388433, 0.42566752806305885, 0.06560832215473056],
}
/** the MAIN stream's persisted position after those 300 weeks, from the same pre-wave run – the wave draws nothing */
let played: Record<string, ReturnType<typeof playLife>> | null = null
const careers = (): Record<string, ReturnType<typeof playLife>> => (played ??= { '5/0': playLife(5, 0, 300, true), '0/1': playLife(0, 1, 300, true) })

describe('§8 played careers', () => {
  it('⭐ PICK-STABILITY: the strings of both boosted careers hash to the pre-wave tree\'s digests – no pick key, draw count, pool order or answer set moved', () => {
    for (const [tag, run] of Object.entries(careers())) {
      const bytes = JSON.stringify(run.strings)
      expect(fnv1a(bytes).toString(16), `career ${tag}, ${bytes.length} bytes`).toBe(PRE_WAVE_STRINGS[tag])
    }
  })

  it('⭐ RNG DISCIPLINE: the MAIN stream\'s next three draws after 300 weeks are the pre-wave tree\'s – input-independence holds, the wave drew nothing', () => {
    for (const [tag, run] of Object.entries(careers())) expect(run.next3, `career ${tag}`).toEqual(PRE_WAVE_NEXT3[tag])
  })

  it('every string the player was shown carries a ref that renders to it (100%, 0 mismatches), and the sweep reached the cards, the replies and the headings', () => {
    const fields = new Set<string>()
    let total = 0
    for (const run of Object.values(careers())) {
      for (const p of run.pairs) {
        expect(p.c, `${p.f} ${JSON.stringify(p.text)} has no ref`).toBeDefined()
        expect(render(p.c!), p.f).toBe(p.text)
        for (const k of keysOf(p.c!)) expect(inCatalog(k), `${p.f}: ${k}`).toBe(true)
        fields.add(p.f)
        total++
      }
    }
    expect([...fields].sort()).toEqual(['card', 'followUp', 'heading', 'said'])
    expect(total).toBeGreaterThan(200)
  })

  it('every row an ANSWER wrote was read the moment it was written (an ordinary row is pruned sixty weeks on): it carries `c`, which renders to its `text`, and its key is the frozen table\'s', () => {
    let rows = 0
    const kinds = new Set<string>()
    for (const run of Object.values(careers())) {
      for (const r of run.answerRows) {
        expect(r.c, `${r.kind}: ${r.text}`).toBeDefined()
        expect(render(r.c!)).toBe(r.text)
        expect(TABLE.has(r.c!.k), r.c!.k).toBe(true)
        kinds.add(r.kind)
        rows++
      }
    }
    expect(rows, 'the careers answered beats that write a feed row').toBeGreaterThan(3)
    expect(kinds.size).toBeGreaterThan(1)
  })

  it('every feed row a life sink wrote carries `c`, and every row\'s `c` renders to its `text` (the kept news, the ending)', () => {
    let life = 0
    let withC = 0
    for (const run of Object.values(careers())) {
      for (const e of run.world.events) {
        if (e.c) expect(renderCopyRef(e.c, EN), `${e.week}: ${e.text}`).toBe(e.text)
        if (e.lifeKind !== undefined) {
          life++
          if (e.c) withC++
        }
      }
    }
    expect(life, 'life rows were written').toBeGreaterThan(5)
    expect(withC, 'and each carries its ref').toBe(life)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §9 – the pick keys
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§9 the pick keys – the sub-streams the life files draw on (this wave adds none, moves none)', () => {
  const keys: string[] = []
  for (const { rel, sf } of parsed) {
    eachNode(sf, (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'rngFromSeed' && n.arguments[0]) keys.push(`${rel.replace('src/engine/world/', '')}::${n.arguments[0].getText().replace(/\s+/g, ' ')}`)
    })
  }
  it('are exactly the list the pre-wave tree held (a sorted list, so a moved key or a new draw is a diff)', () => {
    expect(fnv1a(keys.sort().join('\n')).toString(16), `${keys.length} keys`).toBe(PICK_KEYS_DIGEST)
  })
})
/** the digest of the sorted `rngFromSeed(...)` argument texts of every life file, computed by this very scan on the PRE-WAVE tree (0b60a1b3): the new tree must give the same */
const PICK_KEYS_DIGEST = 'feef4fb8'

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §10 – the fridge notes
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§10 the fridge notes – UI-side, a local hash, never the engine\'s dice', () => {
  const pools: Record<string, readonly string[]> = {
    FRIDGE_NOTES,
    INDEPENDENT_NOTES,
    STRAINED_AWAY_NOTES,
    COLD_AWAY_NOTES,
    EXAM_NOTES,
    TRIP_NOTES,
    INDEPENDENT_TRIP_NOTES,
  }
  const all = Object.values(pools).flat()

  it('seven pools, 115 lines, every one a catalog key and seatable – OUTSIDE_CATALOG for the fridge: 0 (the composable is a census copy home since this wave)', () => {
    expect(Object.values(pools).map((p) => p.length)).toEqual([50, 27, 8, 6, 8, 8, 8])
    expect(all.length).toBe(115)
    expect(all.filter((s) => !inCatalog(s))).toEqual([])
    for (const s of all) expectSeatable(s)
  })

  it('⭐ PICK-STABILITY: the pick over 3 seeds x 104 weeks x 3 moods x 4 stages x 5 bands hashes to the pre-wave tree\'s digest (the file this wave did not touch, pinned so a pool reorder or a changed hash key is a diff)', () => {
    const rows: Array<string | null> = []
    for (const seed of ['alpha', 'bench-3-0', 'a-real-seed'])
      for (let week = 0; week < 104; week++)
        for (const mood of ['home', 'exam', 'trip'] as NoteMood[])
          for (const stage of ['school', 'after-school', 'college', 'independent'] as DiaryLifeStage[])
            for (const band of [null, 'close', 'steady', 'strained', 'cold'] as const) rows.push(fridgeNoteFor(seed, week, mood, stage, band))
    expect(fnv1a(JSON.stringify(rows)).toString(16), `${rows.length} picks`).toBe(FRIDGE_DIGEST)
    expect(rows.filter((r) => r === null).length, 'the silent slots of the away cadence').toBeGreaterThan(0)
  })

  it('the cadence rows (AWAY_NOTE_CHANCE) are the ruled ladder', () => {
    expect(AWAY_NOTE_CHANCE).toEqual({ close: 0.75, steady: 0.55, strained: 0.3, cold: 0.12 })
  })

  it('the screen reads the picked line through `t()` – a dynamic seat, the engine\'s own literal looked up as a key – and nothing else about the pick moved', () => {
    const screen = readFileSync(join(ROOT, 'src/components/screens/CalendarScreen.vue'), 'utf8')
    expect(screen).toContain('{{ t(fridgeNote) }}')
    expect(screen).toContain('fridgeNoteFor(snap.seed, week.week')
  })
})
/** the digest of the sweep above, computed by the same loop on the PRE-WAVE tree (0b60a1b3) – `composables/fridgeNote.ts` is byte-identical on both */
const FRIDGE_DIGEST = 'd8b65413'
