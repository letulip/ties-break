// THE DECLARED SEATS – L3-T (10.10), the extractor's registry of keys it can never READ but the code really ASKS for.
//
// WHAT A SEAT IS. A key is the English literal itself (spec §3.1), so some code asks for a string without ever writing it at the call site:
//   · a CALL seat – a screen reads a label off the snapshot and looks it up, `t(option.label)`. The walker counts such a call (`callStats.dynamic`) and lists where it is
//     (`dynamicSites`), but it cannot say which strings reach it.
//   · a REF seat – the engine writes `c: { k: line }` beside a corpus string (L3-1 … L3-7); the string IS its own key, and the screen draws `eventText({ text, c })`.
// Until now neither could mark a key `wrapped`, and `--mark-landed` flips only wrapped keys: an APPROVED row on a seat-only string compiled into ru.json, rendered, and
// stayed APPROVED forever (L2-9b's finding). A string no census rule reads (the gift catalogue's `BANDS`, 159 strings) was not even a catalog key.
//
// WHAT THIS FILE IS. The one place that names each seat's KEY SET, and the places it is read:
//   · `groups()` is CODE – it imports the real constants (`LIFE_BEAT_OPTIONS`, `ALBUM_CORPUS`, `FRIDGE_NOTES` …) and walks them, so not one English string is retyped
//     here. A key set that is retyped is a key set that drifts from the engine in the dark; this one cannot.
//   · a group is the strings of ONE home file – the catalog entry's `home` is the file that holds the string, as it is for every other key.
//   · a CALL seat names the dynamic site(s) it is read at (`file` + the argument's source); a REF seat names the writer(s) – a file and the exact text of the ref it writes.
//     `tools/i18n-extract.ts` holds each declaration against the tree: a site the walker did not find, or a writer whose file no longer says what the declaration says, is a
//     STALE seat – the gate goes red and the seat marks nothing. A declaration nobody checks is worse than none: `--mark-landed` would flip a row for a string no code asks for.
//   · the reverse (a dynamic call NO seat declares) is counted and printed by the gate and pinned at zero by tests/i18n-l3-t-tooling.test.ts.
//
// ⚠ NOT EVERY L3 SEAT IS HERE, AND THE ONES MISSING ARE NAMED (spec §8, L3-T): the hub's own pools (headings, the pool cells of the announcement kinds), the named-constant sinks of
// L3-1 (`c: { k: CONSTANT }` on a ledger row), the commentary pools of L3-7 and the typed-error sentences. They are catalog keys already (the census reads their homes), so they
// are visible to the translator; what they lack is the `wrapped` flag, which the day an editorial batch for them is approved is one entry here. A seat is declared when a wave
// has an enumeration of it that a net proves – the five call sites and the corpora below each have one.
//
// ⚠ A SEAT KEY MUST BE SEATABLE: no `{`, `}` or `\` (they would be read as message syntax) and no context-tag prefix (`nav|…` would be split off). The L3 nets assert it per family;
// `unseatable()` asserts it for the registry, so a pool line that grows a brace is a gate RED here and not a silent English-forever string at runtime.
import {
  BIRTHDAY_BANDS,
  BIRTHDAY_DAY_TOGETHER,
  LIFE_BEAT_OPTIONS,
  SMALL_TALK_FRAMES,
  SMALL_TALK_SITUATIONS,
  SMALL_TALK_STANCES,
  TEMPERAMENTS,
  buildSoftBeatInvite,
  createWorld,
  lifeBeatFollowUps,
  raiseLifeBeat,
} from '../src/engine/world'
import { ENDING_BLURB } from '../src/engine/ending'
import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { LIFE_MOMENT_CONFIRM } from '../src/engine/world/lifeMomentCopy'
import { EXPOSURE_ROW } from '../src/engine/spirit'
import { tournamentSummaryRef } from '../src/engine/world/tournamentClose'
import { trainFlavors, restFlavors } from '../src/engine/world/phaseFinance'
import { gear } from '../src/engine/economy/gear'
import { COACH_TRIP_NOTES, DEBUT_LINES, DIARY_POOL, TRAVEL_NOTES, WEEK_NOTES } from '../src/engine/diary'
import {
  COLD_AWAY_NOTES,
  EXAM_NOTES,
  FRIDGE_NOTES,
  INDEPENDENT_NOTES,
  INDEPENDENT_TRIP_NOTES,
  STRAINED_AWAY_NOTES,
  TRIP_NOTES,
} from '../src/composables/fridgeNote'

/** The strings of one home file. */
export interface SeatGroup {
  /** Repo-relative file that HOLDS these strings – the catalog entry's `home`. */
  home: string
  keys: readonly string[]
}

export interface Seat {
  /** A stable id, written into the catalog entry (`seat: […]`) so the catalog diff shows how a key is asked for. */
  id: string
  /** `call`: a dynamic `t(expr)` in a screen. `ref`: the engine writes `c: { k }` beside a corpus string. */
  via: 'call' | 'ref'
  /** CALL seats: where it is read – the file and the first argument's source, exactly as the walker lists it (`dynamicSites`). */
  sites?: readonly { file: string; arg: string }[]
  /** REF seats: where the engine writes the ref – the file, and text that file must still contain. A staleness probe; the proof is the wave's own net. */
  writers?: readonly { file: string; needle: string }[]
  /** Every string the seat can be handed, grouped by the file that holds it. Built from the real constants. */
  groups: () => readonly SeatGroup[]
}

const LIFE = 'src/engine/world/lifeBeat.ts'
const TALK = 'src/engine/world/smallTalkCorpus.ts'
const DIALOG = 'src/components/LifeBeatDialog.vue'

const uniq = (list: readonly string[]): string[] => [...new Set(list)]

/** The corpus' voice columns, every situation x every temperament that speaks it. */
function talkColumns(): { opener: string; shared: string | undefined; labels: string[]; replies: string[] }[] {
  const out: { opener: string; shared: string | undefined; labels: string[]; replies: string[] }[] = []
  for (const s of SMALL_TALK_SITUATIONS) {
    for (const voice of TEMPERAMENTS) {
      const col = s.voices[voice]
      if (col === undefined) continue
      out.push({ opener: col.opener, shared: col.shared, labels: SMALL_TALK_STANCES.map((st) => col.branches[st].label), replies: SMALL_TALK_STANCES.map((st) => col.branches[st].said) })
    }
  }
  return out
}

/** Every `done` label a follow-up card can print: read off the engine's own `lifeBeatFollowUps` over the whole corpus, so a third label would be found, not forgotten. */
function doneLabels(): string[] {
  const out = new Set<string>()
  for (const s of SMALL_TALK_SITUATIONS) {
    for (const voice of TEMPERAMENTS) {
      if (s.voices[voice] === undefined) continue
      for (const f of lifeBeatFollowUps('small-talk', `${s.subject}:${s.id}`, voice, 'close')) out.add(f.done)
    }
  }
  return [...out]
}

/** The Proceed the engine puts on a card: read off a REAL prompt, assembled by the engine's own builder (the soft invite of a small-talk row – the shape L3-5's net uses). */
function promptConfirms(): string[] {
  const world = createWorld('l3t-seat-confirm')
  world.week = 700
  world.bond = 70
  raiseLifeBeat(world, 'small-talk', 'worry', undefined, undefined)
  const invite = buildSoftBeatInvite(world)
  if (invite === null) throw new Error('the engine did not build a soft invite for a raised small-talk row – the prompt.confirm seat cannot be enumerated')
  return [invite.prompt.confirm]
}

/** Every distinct string of the BIRTHDAY catalogue (RU-09A): labels, notes, repeat notes, asks and the means-licence alternates. L3-4's net counts the same set. */
function giftStrings(): string[] {
  const out = new Set<string>()
  for (const gift of [...BIRTHDAY_BANDS.flatMap((b) => b.gifts), BIRTHDAY_DAY_TOGETHER]) {
    for (const f of ['label', 'note', 'again', 'ask'] as const) out.add(gift[f])
    for (const v of Object.values(gift.unlicensed ?? {})) if (v) out.add(v)
  }
  return [...out]
}

const str = (v: unknown): string[] => (typeof v === 'string' ? [v] : [])

/** The eight whole-sentence spellings of the tournament summary row, read off the REAL joiner
 *  (10.10, the LQA runner's four not-in-catalog keys): `tournamentSummaryRef` renumbers the clause
 *  holes when it joins, so the stored key is none of the authored cp templates – it is the joined
 *  sentence, the same spelling the frozen v92 table reverse-matches. The param VALUES never reach
 *  the key, so dummies are fine; what matters is driving every branch pair. */
function tournamentRowKeys(): string[] {
  const base = { tier: 'T', surface: 'S', week: 'W', kid: 'K', finish: 'F' }
  const shapes = [
    { points: 10, delta: 10, bestN: 6, notRanked: false }, // full points – no clause
    { points: 10, delta: 0, bestN: 6, notRanked: true }, // banked – not yet ranked
    { points: 10, delta: 0, bestN: 6, notRanked: false }, // does not improve best N
    { points: 10, delta: 5, bestN: 6, notRanked: false }, // partial – ranking total
  ]
  const out = new Set<string>()
  for (const shape of shapes) for (const retired of [false, true]) out.add(tournamentSummaryRef({ ...base, ...shape, retired }).k)
  return [...out]
}

/** Every coaching-week and gear flavor a finance row can store as its own key (`c: { k: flavor }`):
 *  the pools are look-ups the walker cannot evaluate, so the seat runs the real functions over both
 *  axes and reads the real gear table. */
function financeFlavorKeys(): { coaching: string[]; gear: string[] } {
  const coaching = new Set<string>()
  for (const bg of ['working', 'middle', 'wealthy'] as const) {
    for (const line of trainFlavors(bg)) coaching.add(line)
    for (const schoolOver of [false, true]) for (const line of restFlavors(bg, schoolOver)) coaching.add(line)
  }
  return { coaching: [...coaching], gear: uniq(Object.values(gear).flatMap((line) => Object.values(line.flavor))) }
}

export const DECLARED_SEATS: readonly Seat[] = [
  // ── the five dynamic `t()` calls (L2-9b, L2-10b, L3-5) ──────────────────────────────────────────────────────────────────────
  {
    id: 'lifeBeat.optionLabel',
    via: 'call',
    sites: [{ file: DIALOG, arg: 'option.label' }],
    groups: () => [
      { home: LIFE, keys: uniq(Object.values(LIFE_BEAT_OPTIONS).flatMap((list) => list.map((o) => o.label))) },
      { home: TALK, keys: uniq(talkColumns().flatMap((c) => c.labels)) },
    ],
  },
  { id: 'lifeBeat.replyDone', via: 'call', sites: [{ file: DIALOG, arg: 'replying.done' }], groups: () => [{ home: LIFE, keys: doneLabels() }] },
  { id: 'lifeBeat.promptConfirm', via: 'call', sites: [{ file: DIALOG, arg: 'prompt.confirm' }], groups: () => [{ home: LIFE, keys: promptConfirms() }] },
  {
    id: 'lifeMoment.confirm',
    via: 'call',
    sites: [{ file: 'src/components/LifeMomentOverlay.vue', arg: 'moment.confirm' }],
    groups: () => [{ home: 'src/engine/world/lifeMomentCopy.ts', keys: [LIFE_MOMENT_CONFIRM] }],
  },
  {
    id: 'fridge.note',
    via: 'call',
    sites: [{ file: 'src/components/screens/CalendarScreen.vue', arg: 'fridgeNote' }],
    groups: () => [{ home: 'src/composables/fridgeNote.ts', keys: [...FRIDGE_NOTES, ...INDEPENDENT_NOTES, ...STRAINED_AWAY_NOTES, ...COLD_AWAY_NOTES, ...EXAM_NOTES, ...TRIP_NOTES, ...INDEPENDENT_TRIP_NOTES] }],
  },
  // ── the sixth dynamic call (10.10, owner item 34) ─────────────────────────────────────────────────────────────────────────
  // THE EPILOGUE'S PARAGRAPH: `ENDING_BLURB` is a Record of nine sentences, values no census rule reads (a Record literal is not a copy-dom), so they were not catalog keys until a
  // screen asked for one. `EndingScreen.vue` does – `t(ENDING_BLURB[type])` – and the nine are walked from the real constant, not retyped. Total over `CareerEndingType`, so a tenth ending
  // joins this seat by existing (the four total records already make the compiler ask for its line).
  {
    id: 'ending.blurb',
    via: 'call',
    sites: [{ file: 'src/components/EndingScreen.vue', arg: 'ENDING_BLURB[type]' }],
    groups: () => [{ home: 'src/engine/ending.ts', keys: Object.values(ENDING_BLURB) }],
  },

  // ── the refs the engine writes beside a corpus string (L3-4, L3-5, L3-6) ───────────────────────────────────────────────────
  // THE GIFT CATALOGUE (L3-4's debt): `BANDS` matches no census rule, so its 159 strings were not keys. Entering them here is what takes OUTSIDE_CATALOG.gifts to 0.
  { id: 'birthday.gifts', via: 'ref', writers: [{ file: 'src/engine/world/birthday.ts', needle: 'labelC: { k: gift.label }' }], groups: () => [{ home: 'src/engine/world/birthday.ts', keys: giftStrings() }] },
  { id: 'diary.pool', via: 'ref', writers: [{ file: 'src/engine/diary/pool.ts', needle: 'c: { k: pick.text }' }], groups: () => [{ home: 'src/engine/diary/pool.ts', keys: DIARY_POOL.flatMap((p) => str(p.text)) }] },
  { id: 'diary.debut', via: 'ref', writers: [{ file: 'src/engine/diary.ts', needle: 'lineC: { k: line }' }], groups: () => [{ home: 'src/engine/diary.ts', keys: [...DEBUT_LINES] }] },
  { id: 'diary.weekNotes', via: 'ref', writers: [{ file: 'src/engine/diary/weekNotes.ts', needle: 'c: { k: text }' }], groups: () => [{ home: 'src/engine/diary/weekNotes.ts', keys: WEEK_NOTES.flatMap((n) => str(n.text)) }] },
  {
    id: 'diary.travel',
    via: 'ref',
    writers: [
      { file: 'src/engine/diary/travelNotes.ts', needle: 'c: { k: pick.text }' },
      { file: 'src/engine/diary/travelNotes.ts', needle: 'c: { k: pick }' },
    ],
    groups: () => [{ home: 'src/engine/diary/travelNotes.ts', keys: [...TRAVEL_NOTES.flatMap((n) => str(n.text)), ...COACH_TRIP_NOTES] }],
  },
  {
    id: 'smallTalk.corpus',
    via: 'ref',
    writers: [
      { file: LIFE, needle: 'k: column.opener' },
      { file: LIFE, needle: 'saidC: said.map((k) => ({ k }))' },
    ],
    groups: () => {
      const cols = talkColumns()
      return [{ home: TALK, keys: uniq(cols.flatMap((c) => [c.opener, ...(c.shared === undefined ? [] : [c.shared]), ...c.replies])) }]
    },
  },
  {
    id: 'smallTalk.frames',
    via: 'ref',
    writers: [{ file: LIFE, needle: 'k: smallTalkFrameOf(' }],
    groups: () => [{ home: LIFE, keys: [...SMALL_TALK_FRAMES.roof, ...SMALL_TALK_FRAMES.away].map((f) => f.line) }],
  },
  {
    id: 'album.corpus',
    via: 'ref',
    writers: [{ file: 'src/engine/world/albumBook.ts', needle: 'const selfKey = (text: string): CopyRef => ({ k: text })' }],
    groups: () => [
      {
        home: 'src/engine/world/albumCorpus.ts',
        keys: uniq([
          ...ALBUM_CORPUS.flatMap((o) => Object.values(o.voices).flatMap((h) => [h.note, h.caption, h.line])),
          ...Object.values(ALBUM_ARC).flatMap((d) => Object.values(d).flatMap((h) => [h.note, h.line])),
        ]),
      },
    ],
  },

  // ── the LQA runner's four not-in-catalog keys and their whole families (10.10) ─────────────────────────────────────────────
  // THE JOINED TOURNAMENT ROW: `joinCopy` renumbers holes, so the runtime key is a sentence no static walk can see – a REF seat
  // key MAY carry holes (the ref's own `p` fills them; `unseatable` splits by seat kind, below).
  {
    id: 'ledger.tournamentRow',
    via: 'ref',
    writers: [{ file: 'src/engine/world/tournamentClose.ts', needle: "return joinCopy('', parts)" }],
    groups: () => [{ home: 'src/engine/world/tournamentClose.ts', keys: tournamentRowKeys() }],
  },
  // THE EXPOSURE ROW: written by identity (`text: EXPOSURE_ROW`), an identifier the walker cannot read – and the identity law
  // (state.ts: the feed matches `e.text === EXPOSURE_ROW`) is exactly why the string must never fork from its key.
  {
    id: 'spirit.exposure',
    via: 'ref',
    writers: [{ file: 'src/engine/spirit.ts', needle: 'c: { k: EXPOSURE_ROW }' }],
    groups: () => [{ home: 'src/engine/spirit.ts', keys: [EXPOSURE_ROW] }],
  },
  // THE FINANCE FLAVORS: a coaching week's pool pick and a gear line's tier flavor, both stored as `c: { k: flavor }`.
  {
    id: 'finance.flavors',
    via: 'ref',
    writers: [
      { file: 'src/engine/world/phaseFinance.ts', needle: 'c: { k: flavor },' },
      { file: 'src/engine/world/phaseFinance.ts', needle: 'return covered > 0 && payer ? cp`${flavor} – on ${payer}` : { k: flavor }' },
    ],
    groups: () => [
      { home: 'src/engine/world/phaseFinance.ts', keys: financeFlavorKeys().coaching },
      { home: 'src/engine/economy/gear.ts', keys: financeFlavorKeys().gear },
    ],
  },
]

/** Why a string cannot be a seat key, or null. The laws split by seat kind since 10.10: a CALL seat's
 *  string reaches `t(expr)` bare, so a hole in it would be parsed with no params to fill it – but a
 *  REF seat's key is a message by construction (the ref carries `p`), and the joined tournament row
 *  is exactly a braced key no static walk can see. Backslashes and context-tag shapes stay banned for
 *  both: they change what the LOOKUP sees, whatever fills the holes. */
export function unseatable(key: string, via: 'call' | 'ref' = 'call'): string | null {
  if (key === '') return 'is empty'
  if (/[\\]/.test(key)) return 'carries a backslash – read as a key it would be unescaped, not looked up'
  if (via === 'call' && /[{}]/.test(key)) return 'carries message syntax ({ or }) – a call seat hands it to t() bare, parsed with no params'
  if (/^[a-z][a-z0-9_-]{0,23}\|/.test(key)) return 'starts like a context tag (`word|`) – the tag would be split off the key'
  return null
}
