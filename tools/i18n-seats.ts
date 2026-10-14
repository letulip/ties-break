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
  MASSEUR_LOCKED_DETAIL,
  SPARRING_LOCKED_DETAIL,
  masseurRoomNote,
} from '../src/engine/world'
import { ENDING_BLURB } from '../src/engine/ending'
import { ALBUM_ARC, ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import { LIFE_MOMENT_CONFIRM } from '../src/engine/world/lifeMomentCopy'
import { EXPOSURE_ROW } from '../src/engine/spirit'
import { tournamentSummaryRef } from '../src/engine/world/tournamentClose'
import { trainFlavors, restFlavors } from '../src/engine/world/phaseFinance'
import { gear } from '../src/engine/economy/gear'
import { COLLEGE_TIER_NAME } from '../src/engine/collegeOffer'
import { HIREABLE_TIERS } from '../src/engine/coach'
import { BELOW_BEST_LADDER, ROOM_BANDS, TRAVEL_EDGE_LINE, coachBlurb, coachLoadNote, coachPlaqueLine, coachProfileNote, coachRoomArgument, coachRoomBand } from '../src/engine/world/coachMarket'
import { ECONOMY } from '../src/engine/economy'
import { RADAR_AXIS_LABEL } from '../src/engine/radar'
import { readFileSync } from 'node:fs'
import {
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
  PSYCHOLOGIST_LOCKED_DETAIL,
  PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
  PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
  PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
} from '../src/engine/world/psychologist'
import { certain, hasHole } from './copy-census-walk'
import { coachFormNote } from '../src/engine/world/form'
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

/** ⭐ RU-22 (11.10) – THE LABELS THE ECONOMY OWNS, off the real constant: every `label`, `blurb` and `note` text leaf of `ECONOMY` (the shop's assets, the kit grades per line, the vacation packages, the advertising
 *  trades, the staff rungs and the hitting partner's three notes). Walked, not listed – a fourth vacation package joins the seat by existing. The brand names the same object carries (`houses`, `brand`) are
 *  not under these three property names and are not looked up: a generated name is never passed through `t()`. */
function economyTexts(): string[] {
  const out = new Set<string>()
  const walk = (v: unknown, depth: number): void => {
    if (depth > 9 || v === null || typeof v !== 'object') return
    if (Array.isArray(v)) {
      for (const x of v) walk(x, depth + 1)
      return
    }
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if ((k === 'label' || k === 'blurb' || k === 'note') && typeof x === 'string') out.add(x)
      else walk(x, depth + 1)
    }
  }
  walk(ECONOMY, 0)
  return [...out]
}

/** ⭐ RU-22 (11.10) – THE COACH'S TRAINING READ, off the real source: `MOVE_POOL` (a sentence per skill, per how far the movement has got) and `FOG_POOL` (what he says while he cannot read her at all) are module-private
 *  tables of string literals in `engine/radar.ts` that no census rule reads (an array element is not a `text:` property) and that the week recap prints every week of a coached career. They are read as the SOURCE
 *  spells them – the quoted sentences inside those two declarations – because the tables are not exported and the engine is not touched for the sake of a seat; the unit net counts them (45 + 5) so a pool that
 *  grows or loses a line is a red here, not a silent English sentence. */
function radarTrainingLines(): string[] {
  const src = readFileSync('src/engine/radar.ts', 'utf8')
  const block = (open: string, close: string): string => {
    const from = src.indexOf(open)
    const to = from < 0 ? -1 : src.indexOf(close, from)
    if (from < 0 || to < 0) throw new Error(`radar.ts has no «${open}» block – the seat engine.text cannot enumerate the training read`)
    return src.slice(from, to)
  }
  const sentence = /'([^']+\.)'/g
  return uniq([...block('const MOVE_POOL', '\n}\n').matchAll(sentence), ...block('const FOG_POOL', '\n]').matchAll(sentence)].map((m) => m[1] as string))
}

/** The CERTAIN strings the census reads in one engine file, with no hole in them – for a file whose every sentence is shown as written (the radar's note pool, the kid tiles' friend lines). */
function censusSentences(file: string): string[] {
  return uniq(certain.filter((it) => it.file === file && !hasHole(it.text) && /\s/.test(it.text)).map((it) => it.text))
}

/** ⭐ RU-22 (11.10) – THE COACH'S TWO REMARKS ON HER FORM (`coachFormNote`, form.ts): returned string literals, which no census rule reads, written to the ledger as `c: { k: eye }` (L3-1). Read off the real function: a world with a coach,
 *  one match played long ago, and the two crossings the function tests – the sentences cannot drift from the engine because they ARE what it returns. */
function formEyeSentences(): string[] {
  const world = createWorld('ru22-form-eye')
  world.coachId = 'budget-1'
  world.week = 400
  world.seasonWins = 1
  const f = ECONOMY.form
  const good = coachFormNote(world, f.goodNoteAt - 1, f.goodNoteAt)
  const rust = coachFormNote(world, f.rustNoteAt + 1, f.rustNoteAt)
  if (good === null || rust === null) throw new Error('coachFormNote did not return both of its sentences for the crossings it tests – the seat form.eye cannot be enumerated')
  return [good, rust]
}

/** ⭐ r51 №2 (13.10) – THE MASSEUR'S ROOM NOTE, off the real function (`masseurRoomNote`, masseur.ts): four returned literals no census rule reads, which the snapshot hands to the Specialists tab as
 *  `masseurNote` and the tab draws through `engineText`. A hired masseur, then the three things the function tests in its own order – a layoff he is working on, a layoff he has bought no weeks back on, a recent
 *  save in the history – so the sentences cannot drift from the engine because they ARE what it returns. The two injury poses are the fields the function reads and nothing else (`weeksSaved`). */
function masseurRoomNotes(): string[] {
  const world = createWorld('r51-b3-room-note')
  world.masseurHired = true
  const fresh = masseurRoomNote(world)
  world.injuryHistory = [{ kind: 'strain', severity: 'minor', week: world.week, weeksOut: 2, weeksSaved: 1 }]
  const bought = masseurRoomNote(world)
  world.injuryHistory = []
  world.injury = { weeksSaved: 1 } as unknown as typeof world.injury
  const working = masseurRoomNote(world)
  world.injury = { weeksSaved: 0 } as unknown as typeof world.injury
  const onTheTable = masseurRoomNote(world)
  const all = [fresh, bought, working, onTheTable]
  if (new Set(all).size !== 4 || all.some((s) => s === '')) throw new Error('masseurRoomNote did not return four different sentences for the four states it tests – the seat engine.text cannot enumerate the room note')
  return all
}

/** ⭐ RU-23 (11.10) – THE COACH MARKET'S OWN PROSE, off the real functions: the sixteen bios (`coachBlurb` over the roster's portraits), the four rungs' load notes, the style profile (`coachProfileNote` over
 *  every rung and fit – the band is a function of the two – CUT at its dash by the engine's own splitter: four labels and four arguments, because the screen reads each half through the catalog and never a
 *  sentence it has already translated), the eleven sentences of the plaque (`coachPlaqueLine` over every state: two before the verdict, three placements at each of three tenures) and the travel line.
 *  Pure look-ups the screen calls, or strings the snapshot hands over, from a CLOSED set; the screen reads each through `engineText`. Walked, not listed: a seventeenth portrait or a fifth fit band joins
 *  the seat by existing. */
function coachMarketTexts(): string[] {
  const out = new Set<string>()
  for (const slot of ECONOMY.coach.roster) out.add(coachBlurb(slot.portrait))
  for (const tier of HIREABLE_TIERS) out.add(coachLoadNote(tier))
  for (const tier of HIREABLE_TIERS) {
    for (const fit of ['great', 'good', 'off'] as const) {
      const note = coachProfileNote(tier, fit)
      out.add(coachRoomBand(note))
      out.add(coachRoomArgument(note))
    }
  }
  // before the verdict: the reveal week is in the same season as the clock, or a season out (`seasonIndexOf` is the engine's own, so two weeks 10 and 120 apart are two seasons)
  out.add(coachPlaqueLine({ placement: null, week: 0, revealWeek: 10, seasonsTogether: 0 }))
  out.add(coachPlaqueLine({ placement: null, week: 0, revealWeek: 120, seasonsTogether: 0 }))
  for (const placement of ['upper', 'middle', 'lower'] as const) {
    for (const seasonsTogether of [1, 2, 3]) out.add(coachPlaqueLine({ placement, week: 200, revealWeek: 100, seasonsTogether }))
  }
  out.add(TRAVEL_EDGE_LINE)
  out.delete('')
  return [...out]
}

/** ⭐ RU-23 (11.10) – THE ROOM BANDS AND THE BELOW-BEST LADDER, as the engine writes them into refs (`{ k: text }`, no hole): the two parts of the long note's READ (the label and the argument – the engine joins
 *  them, `coachRead`), the four shorts Home's plate carries on a growing career (three of them are the label verbatim: one key, not two), and the three rungs of the ladder past her peak. Read off the real
 *  tables, never retyped. */
function coachRoomLines(): string[] {
  return [
    ...ROOM_BANDS.flatMap((row) => [row.label, row.note]),
    ...ROOM_BANDS.map((row) => row.short),
    ...BELOW_BEST_LADDER.map((rung) => rung.text),
  ]
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
  { id: 'form.eye', via: 'ref', writers: [{ file: 'src/engine/world/form.ts', needle: 'c: { k: eye }' }], groups: () => [{ home: 'src/engine/world/form.ts', keys: formEyeSentences() }] },
  // ── RU-22 (11.10): THE DISPLAY BOUNDARY'S ONE LOOK-UP ──────────────────────────────────────────────────────────────────
  // `engineText(english)` (src/i18n/index.ts) reads a label the ENGINE owns through the catalog by its own text: the shop's rows, the kit grades, the vacation packages, the advertising trades, the staff rungs and
  // the hitting partner's notes (all of `ECONOMY`), the coach's radar notes, the kid tiles' friend lines, the psychologist's four years. The dynamic call is `t(english)` in `words.ts`; the screens call
  // `engineText` and the strings below are what they hand it. A closed set, named from the real constants – an open one (a name, a free sentence) is never handed to it.
  {
    id: 'engine.text',
    via: 'call',
    sites: [{ file: 'src/i18n/words.ts', arg: 'english' }],
    groups: () => [
      { home: 'src/engine/economy.ts', keys: economyTexts().filter((k) => !ECONOMY.sparring.rungs.some((r) => r.note === k)) },
      { home: 'src/engine/economy/sparring.ts', keys: ECONOMY.sparring.rungs.map((r) => r.note) },
      { home: 'src/engine/radar.ts', keys: uniq([...censusSentences('src/engine/radar.ts'), ...radarTrainingLines(), ...Object.values(RADAR_AXIS_LABEL)]) },
      { home: 'src/engine/kidLife.ts', keys: censusSentences('src/engine/kidLife.ts') },
      // ⭐ r51 №2 (13.10) – THE SPECIALISTS TAB'S ENGINE SENTENCES BEYOND THE YEARS: the three locked lines (`engineText` in SupportStaffTab.vue), the masseur's four-state room note, and the three refusals that can
      // reach the year's-work note of a HIRED psychologist (the season, the joint decline, the not-ready one – the unhired and unknown-year refusals are thrown to a stale screen and never drawn)
      { home: 'src/engine/world/psychologist.ts', keys: [...Object.values(PSY_FOCUS_LABEL), ...Object.values(PSY_FOCUS_LINE), PSYCHOLOGIST_LOCKED_DETAIL, PSYCHOLOGIST_FOCUS_SEASON_REFUSAL, PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL, PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL] },
      { home: 'src/engine/world/masseur.ts', keys: [MASSEUR_LOCKED_DETAIL, ...masseurRoomNotes()] },
      { home: 'src/engine/world/sparring.ts', keys: [SPARRING_LOCKED_DETAIL] },
      { home: 'src/engine/world/coachMarket.ts', keys: coachMarketTexts() },
      { home: 'src/engine/collegeOffer.ts', keys: Object.values(COLLEGE_TIER_NAME) },
    ],
  },

  // ── RU-23 (11.10): THE ROOM NOTE, THE DECLINE NOTE'S FIXED ARMS AND HOME'S PLATE ─────────────────────────────────────────────
  // `coachRoomNoteRef` / `coachRoomShortRef` write `{ k: text }` for a band row (the text IS the key, no hole): the label and the argument of the long note, the short of Home's plate, and the decline ladder's
  // three rungs; the arms with a count are `cp` templates and need no seat. Four writers, one family.
  {
    id: 'coach.room',
    via: 'ref',
    writers: [
      { file: 'src/engine/world/coachMarket.ts', needle: 'return coachRead({ k: band.label }, { k: band.note })' },
      { file: 'src/engine/world/coachMarket.ts', needle: 'return band === null ? null : { k: band.short }' },
      { file: 'src/engine/world/coachMarket.ts', needle: 'const belowBestRef = (behind: number): CopyRef => ({ k: belowBestShort(behind) })' },
    ],
    groups: () => [{ home: 'src/engine/world/coachMarket.ts', keys: coachRoomLines() }],
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
          ...ALBUM_CORPUS.flatMap((o) => Object.values(o.voices).flat().flatMap((h) => [h.note, h.caption, h.line])),
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
