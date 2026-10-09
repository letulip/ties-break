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
import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { LIFE_MOMENT_CONFIRM } from '../src/engine/world/lifeMomentCopy'
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
]

/** Why a string cannot be a seat key, or null. The same two laws every L3 net asserts per family: no message syntax, no context tag. */
export function unseatable(key: string): string | null {
  if (key === '') return 'is empty'
  if (/[{}\\]/.test(key)) return 'carries message syntax ({, } or \\) – read as a key it would be parsed, not looked up'
  if (/^[a-z][a-z0-9_-]{0,23}\|/.test(key)) return 'starts like a context tag (`word|`) – the tag would be split off the key'
  return null
}
