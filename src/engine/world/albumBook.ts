// THE ALBUM BOOK: the career's whole story, assembled on demand (docs/specs/the-album-2026-09.md).
//
// This is the spec's §8 step 1 – the engine half. Chapters from the lived bands plus the prologue's
// own trace (v84), representatives selected from ledgers the save never prunes, every frame resolved
// to a picture by the §4 ladder, the corpus's handwriting in her parent's voice, tickets and tags
// from real facts, and the arc on the closing sheet. The screens that render the book landed on this
// same branch first, against `src/components/album/albumWire.ts` – a declared stand-in for THIS
// module – so the shapes here are that contract satisfied, not a second design.
// `shared/protocol/album.ts` carries them, and since 19.09 it is the only declaration: the stand-in's
// importers are re-pointed at the protocol barrel and the file is deleted. It went home unchanged –
// the two shapes were identical to the field on the day they were joined.
//
// ⚠⚠ ON DEMAND, NEVER IN THE WEEKLY SNAPSHOT – his §8b ruling: «Сборка альбома – по требованию, не
// в недельном снимке». `assembleAlbum` is served by the worker's `album` query when the section
// opens; `toSnapshot` never calls it, so it costs every tick nothing.
//
// ⚠⚠ A PURE READ WITH ONE NAMED SUB-STREAM FAMILY. Nothing here mutates the world and nothing draws
// on MAIN: the only randomness is `seed:album:flavour:*` – the антураж (seat, gate, row, barcode,
// the fictional venue and club-patch names of §8b), his ruling 6 («антураж рисуем», generation «не
// принципиально») taken with the architect's «из сида, чтобы не мигал»: the same book reopens
// identical. The frozen MAIN capture (41550 / e6b0c709) cannot see this file.
//
// ⚠⚠ THE WORDS ARE THE CORPUS's, NEVER THIS FILE's. Every note, caption and line comes out of
// `ALBUM_CORPUS` / `ALBUM_ARC` (generated from docs/specs/album-corpus-2026-09.md – the owner's
// document, all drafts until his pass), selected by occasion id and her BIRTH temperament – the fog
// law is lifted for the album (spec ruling 8) and the voice bibles read birth alone. What this file
// adds in words is marked ⚠ DRAFT at each table: the five chapter headings (spec §9 – his), the
// image alts, and the ticket flavour vocabulary.
//
// ⚠ DEPENDENCY DIRECTION – `world/album.ts`'s own header, kept: `WorldState` is a TYPE-ONLY import,
// values come from sibling leaves and from `shared/`, and no art BUILDER is imported anywhere. The
// frame's `art` is a base-relative PATH the engine spells (the protocol field's own note says who
// prefixes `BASE_URL`), and `tests/albumBook.test.ts` sweeps every path the assembly can emit
// against the files on disk – the same ground truth `tests/portrait-bands.test.ts` holds the art
// layer's spelling to, which is what keeps the two spellings from drifting apart.
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import type { TierId } from '../season/types'
import { weekSpan } from '../../shared/dates'
import { paintedStemFor, portraitStage } from '../../shared/avatarEmotion'
import { finishedTheCourse } from '../../shared/avatarEmotion'
import type { PortraitEmotion } from '../../shared/avatarEmotion'
import type {
  AlbumBook,
  AlbumChapter,
  AlbumDoodle,
  AlbumFrame,
  AlbumLayout,
  AlbumNote,
  AlbumSheetModel,
  AlbumTag,
  AlbumTicket,
  AlbumTierStep,
  Milestone,
  PrologueTrace,
  TravelHomeMood,
  TravelHomeScene,
} from '../../shared/protocol'
import { ENDINGS } from '../ending'
import { temperamentFor, type Temperament } from '../spirit'
import { pickInt, rngFromSeed } from '../rng'
import { kidAgeAt } from './age'
import { finishLabel } from './labels'
import {
  ALBUM_ARC,
  ALBUM_CORPUS,
  type AlbumArcDirection,
  type AlbumBand,
  type AlbumHand,
  type AlbumOccasion,
} from './albumCorpus'
import type { WorldState } from '../world'

// =================================================================================================
// §1 THE MOOD TABLE – the whole of it, in one place (his ruling, 19.09, spec §7)
// =================================================================================================
//
// «настроение выводим из вехи (титул → радость, травма → восстановление, у нас их несколько
// разных, в т.ч. на week results)» – RULED, and the injury row carries his own sentence for why it
// is `rehab` and never `injury`: «альбом помнит, как она вставала, а не как падала». Nothing is
// stored – the mood is a function of the occasion, exactly as the ruling asks. Keyed on the CORPUS
// ids, total over them minus the four whose picture is never a band portrait (the closers and the
// wedding resolve to their own paintings at the ladder's top rung and carry a fallback row anyway).
//
// ⚠ THE PRECEDENT ROWS FOLLOW `MEMORY_EMOTION` (engine/diary/facts.ts) WHERE THE TWO SHARE A KIND:
// school and international are `norm` there for written-down reasons and are `norm` here for the
// same ones. Rows with no precedent – the prologue's four, the buys, the super-rares, the season
// variants – are the builder's picks, cheap to move, and none of them is a word on a screen.
export const ALBUM_MOOD: Record<string, PortraitEmotion> = {
  'first-court': 'happy',
  'first-tournament': 'serious',
  'first-win': 'happy',
  'first-cup': 'happy',
  'first-title': 'happy',
  'title-step-up': 'happy',
  'title-after-injury': 'happy',
  'title-last': 'serious',
  'first-final': 'serious',
  'final-lost': 'serious',
  'season-first': 'norm',
  'season-best': 'happy',
  'season-held': 'norm',
  'season-down': 'sad',
  /** RULED: the comeback, never the fall – «альбом помнит, как она вставала, а не как падала» */
  injury: 'rehab',
  'injury-return': 'rehab',
  'first-prize': 'happy',
  'first-international': 'norm',
  'break-even': 'happy',
  'school-done': 'norm',
  wedding: 'happy',
  'first-house': 'happy',
  brand: 'happy',
  'academy-land': 'serious',
  'academy-courts': 'serious',
  'academy-built': 'happy',
  'lifetime-sponsor': 'happy',
  'top-tier-title': 'happy',
  'years-at-the-top': 'happy',
  graduated: 'happy',
  farewell: 'serious',
  retired: 'happy',
}

/** WHICH ONE-MOMENT PAINTING AN OCCASION HAS – the §4 ladder's TOP rung, as painting STEMS under
 *  `images/fem-euro-brunnet/`. The bride goes through `paintedStemFor` instead (band fallback – the
 *  wave-7 wiring: a wedding at thirty-one shows the band's own `norm`, never a 404). ⚠ `funeral`
 *  and the two `pregnant-*` paintings are on disk and reachable from NO row here: the world holds
 *  no death and no pregnancy, and the album does not invent one. */
const EVENT_STEM: Partial<Record<string, string>> = {
  'first-court': 'jun-training',
  graduated: 'adult-graduated',
  farewell: 'lateCareer-farewell',
  retired: 'lateCareer-retired',
}

/** The paintings' home – ONE spelling in this module, swept against the files on disk by
 *  `tests/albumBook.test.ts` exactly as the art layer's own spelling is swept by
 *  `tests/portrait-bands.test.ts`; the disk is the ground truth both must match. */
const PAINTING_DIR = 'images/fem-euro-brunnet/'
function paintingPath(stem: string): string {
  return `${PAINTING_DIR}fem-euro-brunnet-${stem}.webp`
}

/** THE TRAVEL RUNG's projection of the mood onto the twelve painted journey scenes.
 *
 *  ⚠ `rehab` RETURNS NULL AND THAT IS THE RULING, NOT A GAP. An injury frame at an away event would
 *  otherwise resolve to a sad journey home – the fall – and his sentence is that the album
 *  remembers her getting up, so the injury frames skip the journey and land on the rehab portrait.
 *  Everything without a journey face of its own travels `sleepy` – the owner's own original travel
 *  word, the neutral face of a long trip home. */
function travelMoodOf(mood: PortraitEmotion): TravelHomeMood | null {
  if (mood === 'happy') return 'happy'
  if (mood === 'sad') return 'sad'
  if (mood === 'rehab' || mood === 'injury') return null
  return 'sleepy'
}

/** The journey's mode – антураж, not a fact, and NOT a draw: the week number picks one of the four
 *  painted scenes, so the same frame reopens on the same picture without touching any stream. */
const TRAVEL_SCENES: readonly TravelHomeScene[] = ['airport', 'plane', 'bus', 'car']

// =================================================================================================
// §2 THE FILE's OWN WORDS – all ⚠ DRAFT, tabled for his pass (invariant 4)
// =================================================================================================

/** ⚠ DRAFT – the five chapter headings are HIS (spec §9: «Названия пяти глав … – его»). These are
 *  placeholders in the mockup's own register (its list had six names for five bands; the five kept
 *  are the ones that map). */
export const ALBUM_CHAPTER_TITLES: Record<AlbumBand, string> = {
  prologue: 'The beginning',
  young: 'Growing up',
  teen: 'The breakthrough',
  adult: 'The tour',
  lateCareer: 'The final chapter',
}

/** ⚠ DRAFT – the image alts, one per KIND of picture rather than per occasion: an alt describes
 *  what is DRAWN, and thirty-two rewordings of «her portrait» would be thirty-two more strings for
 *  his pass with nothing in them. */
const ALT_DRAFT = {
  portrait: 'Her, that week',
  travel: 'The journey home',
  'jun-training': 'Her first days on a court',
  bride: 'Her wedding day',
  'adult-graduated': 'Graduation day',
  'lateCareer-farewell': 'Her farewell match',
  'lateCareer-retired': 'The day after the last match',
} as const

/** ⚠ DRAFT – the ticket vocabulary (`Gate 3`, `Seat 14B`, `Row 14` – the mockup's own register) and
 *  the two fictional-name pools §8b asks for («нужен маленький пул вымышленных имён, тянутый из
 *  сида»). Every name is invented; none is constructible into a real venue, club or organisation. */
const TICKET_WORDS = { gate: 'Gate', seat: 'Seat', row: 'Row', age: 'Age' } as const
const VENUE_POOL: readonly string[] = [
  'Centre Court',
  'Court One',
  'The River Court',
  'Garden Arena',
  'Harbour Stadium',
  'The Old Clay',
] as const
const PATCH_POOL: readonly string[] = [
  'Rivermouth Tennis',
  'Northfield Club',
  'Harbour Lane Tennis',
  'Old Mill Courts',
  'Cedar Park Tennis',
  'Whitegate Club',
] as const

// =================================================================================================
// §3 CANDIDATES – the corpus's 32 occasions, resolved against ledgers the save never prunes
// =================================================================================================
//
// The registry is `ALBUM_CORPUS` (generated from the owner's document): each occasion declares its
// KIND (the §5 thirds rule's «род событий»), the BANDS it may appear in, and a GATE this file
// resolves. docs/specs/album-corpus-2026-09.md writes each gate's source in words; this section is
// those sentences as code, one resolver per family.

interface AlbumCandidate {
  /** the career week, or null for a prologue moment (the childhood is before week 0) */
  week: number | null
  /** her age at the moment – the trace's own age for prologue rows */
  ageYears: number
  occasion: AlbumOccasion
  /** the tournament the ticket/tag names, where one exists */
  tier?: TierId
  /** finish index for the ticket's stage word (0 = champion), where one exists */
  finish?: number
  /** higher wins a place; ties resolve to the earlier week */
  priority: number
  /** a closer is guaranteed its frame and exempt from the caps – the ruled closing frames */
  closer?: boolean
}

const TOP_RANK = 10
const TOP_STREAK_YEARS = 4

const OCCASION = new Map(ALBUM_CORPUS.map((o) => [o.id, o]))
function occasionOf(id: string): AlbumOccasion {
  const row = OCCASION.get(id)
  if (!row) throw new Error(`no occasion '${id}' in ALBUM_CORPUS – the selector and the corpus have drifted`)
  return row
}

function wrapWeekOf(seasonIndex: number): number {
  return seasonIndex * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1
}

function candidate(
  world: WorldState,
  id: string,
  week: number,
  priority: number,
  extra: Partial<Pick<AlbumCandidate, 'tier' | 'finish' | 'closer'>> = {},
): AlbumCandidate {
  return { week, ageYears: kidAgeAt(world, week), occasion: occasionOf(id), priority, ...extra }
}

/** The titles – four occasions for thirteen rows (§4 of the corpus doc: «the fourteenth only if it
 *  is about something»). */
function titleCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const titles = world.milestones.filter((m) => m.type === 'title').sort((a, b) => a.week - b.week)
  if (titles.length === 0) return out
  // A5 first-of-kind
  out.push(candidate(world, 'first-title', titles[0].week, 80, { tier: titles[0].tier, finish: 0 }))
  // A6 tier-above-every-previous-title – each true step up is its own candidate
  let best = TIER_LADDER.indexOf(titles[0].tier ?? 'local')
  for (const m of titles.slice(1)) {
    const rung = TIER_LADDER.indexOf(m.tier ?? 'local')
    if (rung > best) {
      out.push(candidate(world, 'title-step-up', m.week, 66, { tier: m.tier, finish: 0 }))
      best = rung
    }
  }
  // A7 first-title-after-a-layoff – the first title row after the first layoff ended
  const firstReturn = world.injuryHistory[0]?.week
  if (firstReturn !== undefined) {
    const after = titles.find((m) => m.week >= firstReturn)
    if (after) out.push(candidate(world, 'title-after-injury', after.week, 72, { tier: after.tier, finish: 0 }))
  }
  // A8 last-title-of-the-career – «only reachable on a finished career» (the corpus's own §4 note)
  if (world.ending) {
    const last = titles[titles.length - 1]
    out.push(candidate(world, 'title-last', last.week, 61, { tier: last.tier, finish: 0 }))
  }
  return out
}

function finalCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const finals = world.milestones.filter((m) => m.type === 'final').sort((a, b) => a.week - b.week)
  if (finals.length === 0) return out
  out.push(candidate(world, 'first-final', finals[0].week, 45, { tier: finals[0].tier, finish: 1 }))
  // A10 final-with-no-title-that-week – result-known: she lost it
  const titleWeeks = new Set(world.milestones.filter((m) => m.type === 'title').map((m) => m.week))
  for (const m of finals.slice(1)) {
    if (!titleWeeks.has(m.week)) out.push(candidate(world, 'final-lost', m.week, 18, { tier: m.tier, finish: 1 }))
  }
  return out
}

function seasonCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const closes = world.milestones
    .filter((m) => m.type === 'season-rank' && m.rank !== undefined)
    .sort((a, b) => a.week - b.week)
  let bestRank = Infinity
  let prevRank: number | null = null
  for (const [i, m] of closes.entries()) {
    const rank = m.rank!
    if (i === 0) {
      out.push(candidate(world, 'season-first', m.week, 44))
    } else if (rank < bestRank) {
      out.push(candidate(world, 'season-best', m.week, 40))
    } else if (prevRank !== null && rank > prevRank) {
      out.push(candidate(world, 'season-down', m.week, 20))
    } else {
      out.push(candidate(world, 'season-held', m.week, 12))
    }
    bestRank = Math.min(bestRank, rank)
    prevRank = rank
  }
  return out
}

function bodyCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const first = world.milestones.find((m) => m.type === 'injury')
  if (first) out.push(candidate(world, 'injury', first.week, 53))
  // A16 the week the layoff ended, derived – there is no milestone for it. The LONGEST layoff's
  // return is the representative; the others are bulk.
  let longest: { week: number; weeksOut: number } | null = null
  for (const h of world.injuryHistory) {
    if (longest === null || h.weeksOut > longest.weeksOut) longest = { week: h.week, weeksOut: h.weeksOut }
  }
  for (const h of world.injuryHistory) {
    out.push(candidate(world, 'injury-return', h.week, h.week === longest?.week ? 52 : 25))
  }
  return out
}

function onceCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const rows: Array<[Milestone['type'], string, number]> = [
    ['prize', 'first-prize', 70],
    ['international', 'first-international', 65],
    ['school', 'school-done', 62],
  ]
  for (const [type, id, priority] of rows) {
    const m = world.milestones.find((row) => row.type === type)
    if (m) out.push(candidate(world, id, m.week, priority, { tier: m.tier }))
  }
  // A19 break-even – the CAREER crossing, captured the week it happened because it cannot be
  // reconstructed afterwards. The common week-crossing is bulk the representatives rule prunes.
  const crossed = world.milestones.find((m) => m.type === 'break-even' && m.kind === 'career')
  if (crossed) out.push(candidate(world, 'break-even', crossed.week, 75))
  // A21 the wedding – per EPISODE, so a second marriage reaches the occasion again
  for (const m of world.milestones.filter((row) => row.type === 'wedding')) {
    out.push(candidate(world, 'wedding', m.week, 90))
  }
  return out
}

function assetCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const houses = world.assets.filter((a) => a.id.startsWith('house-')).sort((a, b) => a.boughtWeek - b.boughtWeek)
  if (houses[0]) out.push(candidate(world, 'first-house', houses[0].boughtWeek, 58))
  const byId: Array<[string, string, number]> = [
    ['merch-brand', 'brand', 57],
    ['academy-land', 'academy-land', 56],
    ['academy-courts', 'academy-courts', 55],
    ['academy-building', 'academy-built', 54],
  ]
  for (const [assetId, id, priority] of byId) {
    const row = world.assets.find((a) => a.id === assetId)
    if (row) out.push(candidate(world, id, row.boughtWeek, priority))
  }
  return out
}

/** ⭐ THE SUPER-RARES – his 19.09 addition. Each DISPLACES an ordinary representative rather than
 *  raising the cap: they enter the same fixed budget at the top of the priority order.
 *
 *  ⚠ SOURCES VERIFIED, AS THE TASK ASKS, AND ONE HALF-CORRECTED: the top step's win is GATED on
 *  `bestFinishByTier` (the corpus doc's own source clause) and DATED off `trophiesByTier` – the
 *  spec named the former, which is a high-water mark holding a finish index and NO week, so it can
 *  corroborate the win and cannot date it; the titles ledger (v31) keeps the weeks. The streak
 *  reads `seasonHistory`'s per-track ranks (v46); rows banked before v46 carry none and honestly
 *  cannot join a streak. The lifetime deal reads the offers ledger, which is never pruned. */
function rareCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const topTier = TIER_LADDER[TIER_LADDER.length - 1]
  const slamWeeks = world.trophiesByTier[topTier]?.titles ?? []
  if (world.bestFinishByTier[topTier] === 0 && slamWeeks.length > 0) {
    out.push(candidate(world, 'top-tier-title', slamWeeks[0], 100, { tier: topTier, finish: 0 }))
  }
  let streak = 0
  let streakEnd: number | null = null
  for (const row of world.seasonHistory) {
    const rank = row.byTrack?.wta?.endRank
    if (rank !== undefined && rank <= TOP_RANK) {
      streak += 1
      if (streak >= TOP_STREAK_YEARS) streakEnd = row.seasonIndex
    } else {
      streak = 0
    }
  }
  if (streakEnd !== null) out.push(candidate(world, 'years-at-the-top', wrapWeekOf(streakEnd), 98))
  for (const o of world.offers) {
    if (o.state !== 'signed') continue
    if ('lifetime' in o.terms && o.terms.lifetime === true) {
      out.push(candidate(world, 'lifetime-sponsor', o.decidedWeek ?? o.week, 96))
      break
    }
  }
  return out
}

/** THE CLOSERS – ruled 19.09 and checked by his own eyes on the paintings: `graduated` where a
 *  college happened (the FULL course – `finishedTheCourse` is the shared predicate, so a leaver
 *  gets no graduation frame on any surface); the final chapter's last-match frame is `farewell`;
 *  the book's very last frame is `retired`. The farewell pair exists only once the career has
 *  ENDED – a live album (the Home memory card's door) simply ends at the current chapter. */
function closerCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const college = world.college
  if (college?.doneWeek != null && finishedTheCourse(college.years.length, ENDINGS.collegeYears)) {
    out.push(candidate(world, 'graduated', college.doneWeek, 1000, { closer: true }))
  }
  if (world.ending) {
    out.push(candidate(world, 'farewell', world.ending.week, 1000, { closer: true }))
    out.push(candidate(world, 'retired', world.ending.week, 1000, { closer: true }))
  }
  return out
}

/** CHAPTER 1's MOMENTS – the ruled path (а): «Первый раз на корте, первый турнир и/или победа»,
 *  read off the v84 trace at assembly time and derived nowhere else. One frame per weekend at most,
 *  the most specific occasion winning: the cup outranks the win outranks the plain first weekend. */
function prologueCandidates(trace: PrologueTrace): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const pickAges = Object.keys(trace.picks)
    .map(Number)
    .sort((a, b) => a - b)
  if (pickAges.length > 0) {
    out.push({ week: null, ageYears: pickAges[0], occasion: occasionOf('first-court'), priority: 80 })
  }
  const firstOpen = trace.opens[0]
  const firstWin = trace.opens.find((o) => o.wins > 0)
  const firstCup = trace.opens.find((o) => o.finish === 0)
  const taken = new Set<string>()
  const push = (row: (typeof trace.opens)[number] | undefined, id: string, priority: number) => {
    if (!row) return
    const key = `${row.age}:${row.index}`
    if (taken.has(key)) return
    taken.add(key)
    out.push({ week: null, ageYears: row.age, occasion: occasionOf(id), priority })
  }
  push(firstCup, 'first-cup', 76)
  push(firstWin, 'first-win', 74)
  push(firstOpen, 'first-tournament', 72)
  return out.sort((a, b) => a.ageYears - b.ageYears)
}

// =================================================================================================
// §4 SELECTION – representatives per chapter: 1–3 sheets by density, no kind over a third
// =================================================================================================

/** A chapter's frame budget: three sheets of the splits below – the ruled «1-3 страницы на каждую
 *  главу», so the whole book tops out around fifteen sheets. */
const MAX_CHAPTER_FRAMES = 8

/** How a chapter's n frames sit on its 1–3 sheets. The opener (layout A or C) draws two frames at
 *  most; the ordinary `B` sheet draws up to three. No sheet is ever empty by construction – his
 *  «пустых листов не бывает». */
const SHEET_SPLITS: Record<number, readonly number[]> = {
  1: [1],
  2: [2],
  3: [1, 2],
  4: [2, 2],
  5: [2, 3],
  6: [2, 2, 2],
  7: [2, 2, 3],
  8: [2, 3, 3],
}

/** The §5 thirds rule over the chapter's selection: with n frames picked, no corpus KIND may hold
 *  more than max(1, floor(n / 3)) of them – equal to or stricter than «ни один род не занимает
 *  больше трети её листов» at every n, and the floor of one keeps a two-frame chapter from being
 *  two injuries. The guard against the measured adult bulk: 248 season closes and 127 layoffs
 *  against 95 titles, which selection on «significance» alone would ride into the injury ward.
 *  Closers are exempt: the ruled closing frames are not a «род» crowding anything out. */
function groupCapOf(n: number): number {
  return Math.max(1, Math.floor(n / 3))
}

function selectRepresentatives(candidates: AlbumCandidate[], budget: number): AlbumCandidate[] {
  // one frame per week: a title and its cheque in one week are one moment, and the higher priority
  // names it. Closers keep their own weeks even where they collide – farewell and retired share the
  // ending week BY DESIGN (two scenes, two places), and a prologue moment has no week to collide on.
  const byWeek = new Map<number, AlbumCandidate>()
  const keep: AlbumCandidate[] = []
  for (const c of candidates) {
    if (c.closer || c.week === null) {
      keep.push(c)
      continue
    }
    const seat = byWeek.get(c.week)
    if (!seat || c.priority > seat.priority) byWeek.set(c.week, c)
  }
  const closers = keep.filter((c) => c.closer)
  const ordinary = [...keep.filter((c) => !c.closer), ...byWeek.values()].sort(
    (a, b) => b.priority - a.priority || (a.week ?? -1) - (b.week ?? -1),
  )

  const picked: AlbumCandidate[] = [...closers]
  const room = () => budget - picked.length
  // greedy under the widest cap the rule can allow (the budget's own third), then tightened: the
  // honest cap depends on the final count, so the pass repeats with it until nothing moves (the cap
  // only shrinks – this terminates)
  let cap = groupCapOf(budget)
  for (let pass = 0; pass < 4; pass++) {
    for (const c of ordinary) {
      if (room() <= 0) break
      if (picked.includes(c)) continue
      const held = picked.filter((p) => !p.closer && p.occasion.kind === c.occasion.kind).length
      if (held >= cap) continue
      picked.push(c)
    }
    const honest = groupCapOf(picked.length)
    if (honest >= cap) break
    cap = honest
    for (const kind of new Set(picked.filter((p) => !p.closer).map((p) => p.occasion.kind))) {
      const members = picked
        .filter((p) => !p.closer && p.occasion.kind === kind)
        .sort((a, b) => b.priority - a.priority)
      for (const extra of members.slice(cap)) picked.splice(picked.indexOf(extra), 1)
    }
  }
  return picked.sort((a, b) => (a.week ?? -1) - (b.week ?? -1) || a.ageYears - b.ageYears || closerRank(a) - closerRank(b))
}

/** farewell is the last match and retired is the book's very last frame – ruled – so the two
 *  closers that share the ending week order themselves; everything else ties at zero. */
function closerRank(c: AlbumCandidate): number {
  if (c.occasion.id === 'retired') return 2
  if (c.occasion.id === 'farewell') return 1
  return 0
}

// =================================================================================================
// §5 FRAMES – week + occasion, resolved by the §4 ladder: event painting, travel, portrait
// =================================================================================================

/** Was `week` an away week? The two entry ledgers are persisted for the life of the career and
 *  never pruned (v15 / v36) – `events` and `results` both forget, these do not. Domestic rungs are
 *  home soil and never appear in either. */
function awayWeek(world: WorldState, week: number): boolean {
  return world.internationalEntryWeeks.includes(week) || world.proEntryWeeks.includes(week)
}

function frameArtFor(world: WorldState, c: AlbumCandidate): { art: string; alt: string } {
  const stage = portraitStage(c.ageYears)
  // rung 1 – the event painting, where the occasion has one. The bride resolves through
  // `paintedStemFor` (the wave-7 wiring): band fallback, never a 404.
  if (c.occasion.id === 'wedding') {
    const stem = paintedStemFor(stage, 'bride')
    return { art: paintingPath(stem), alt: stem.endsWith('bride') ? ALT_DRAFT.bride : ALT_DRAFT.portrait }
  }
  const eventStem = EVENT_STEM[c.occasion.id]
  if (eventStem) {
    return { art: paintingPath(eventStem), alt: ALT_DRAFT[eventStem as keyof typeof ALT_DRAFT] ?? ALT_DRAFT.portrait }
  }
  const mood = ALBUM_MOOD[c.occasion.id] ?? 'norm'
  // rung 2 – the journey, on an away week whose mood has a journey face
  if (c.week !== null && awayWeek(world, c.week)) {
    const travelMood = travelMoodOf(mood)
    if (travelMood) {
      const scene = TRAVEL_SCENES[c.week % TRAVEL_SCENES.length]
      return { art: paintingPath(`travel-${travelMood}-${scene}`), alt: ALT_DRAFT.travel }
    }
  }
  // rung 3 – the band portrait at her age that week, in the ruled mood
  return { art: paintingPath(paintedStemFor(stage, mood)), alt: ALT_DRAFT.portrait }
}

function frameOf(world: WorldState, c: AlbumCandidate, voice: Temperament): AlbumFrame {
  const { art, alt } = frameArtFor(world, c)
  return { art, alt, caption: c.occasion.voices[voice].caption }
}

// =================================================================================================
// §6 THE ANTУРАЖ – the one named sub-stream family, and every drawn thing on a sheet
// =================================================================================================

/** Per sheet, off `seed:album:flavour:<sheet id>` – re-derived at the call site, persisting
 *  nothing, MAIN untouched (invariant 2). The same sheet of the same career always deals the same
 *  seat, which is «из сида, чтобы не мигал» satisfied at zero cost. */
function flavourFor(seed: string, sheetId: string) {
  const rng = rngFromSeed(`${seed}:album:flavour:${sheetId}`)
  const seat = `${TICKET_WORDS.seat} ${pickInt(rng, 1, 32)}${'ABCDEF'[pickInt(rng, 0, 5)]}`
  const gate = `${TICKET_WORDS.gate} ${pickInt(rng, 1, 9)}`
  const row = `${TICKET_WORDS.row} ${pickInt(rng, 1, 32)}`
  const venue = VENUE_POOL[pickInt(rng, 0, VENUE_POOL.length - 1)]
  const bars: number[] = []
  for (let i = 0; i < 12; i++) bars.push(pickInt(rng, 1, 4))
  const doodle = pickInt(rng, 0, 5)
  return { seat, gate, row, venue, bars, doodle }
}

/** The childhood club's fictional name – §8b's pool, drawn ONCE per career on the flavour family's
 *  own key so every opener wears the same patch («стабилен при перечитывании, товарных знаков не
 *  задевает»). */
function patchFor(seed: string): string {
  const rng = rngFromSeed(`${seed}:album:flavour:patch`)
  return PATCH_POOL[pickInt(rng, 0, PATCH_POOL.length - 1)]
}

const DOODLES: readonly AlbumDoodle[] = ['trophy', 'heart', 'sun', 'smile', 'globe', 'plane']
/** A doodle that fits the sheet's lead occasion where one obviously does; the flavour picks
 *  otherwise. Decoration, never a fact. */
const DOODLE_BY_KIND: Partial<Record<string, AlbumDoodle>> = {
  title: 'trophy',
  rare: 'trophy',
  international: 'plane',
  wedding: 'heart',
  prologue: 'smile',
}

function ageLabelOf(age: number): string {
  return `${TICKET_WORDS.age} ${age}`
}

/** ⭐⭐ THE RANK'S STEP ON THE APP'S OWN FOUR-STEP RAMP – spec §4's «Цвет билета и бирки несёт ранг:
 *  чем выше ступень, тем насыщеннее», and the ONE place that decision is made.
 *
 *  ⚠⚠ A `Record<TierId, …>` AND NOT A PREDICATE CHAIN, which is the whole reason it is a table: the
 *  ladder has grown twice already (W2-LADDER's six W rungs, W3-ACT2's top four) and a
 *  `track === 'itf' ? … : …` would have absorbed each new rung silently into whatever branch it
 *  happened to fall through. This shape makes a seventeenth rung a COMPILE error, which is the only
 *  kind of totality worth having. `tests/albumBook.test.ts` walks `TIER_LADDER` and proves two things
 *  about it: every rung has a step, and the steps never go DOWN as the ladder goes up – which is §4's
 *  sentence, restated as something a machine can fail.
 *
 *  ⚠ THE GROUPING IS THE LADDER'S OWN FAMILIES, not four equal slices of sixteen. Each step is a
 *  thing a career can be IN for years, and the boundaries are the ladder's own handovers:
 *
 *    budget  local · regional · national    – the domestic ladder (`track: 'domestic'`), where she
 *                                             starts and where an adult who is not good enough stays
 *    middle  j30 · j60 · j300               – the junior international tour (`track: 'itf'`), no
 *                                             prize money: the «invest without knowing the return» years
 *    high    w15 … w100                     – `W_SERIES`, the adult ITF rungs, where the cheque is an
 *                                             insult but it is a cheque
 *    elite   wta125 … slam                  – the tour proper, the mandatory regime's home
 *
 *  ⚠ AND THE COLOURS ARE NOT HERE, WHICH IS THE POINT OF SHIPPING A STEP. `AlbumTierStep`'s note
 *  names the four `--tier-*` tokens; the engine may not know a hex. */
export const ALBUM_TIER_STEP: Record<TierId, AlbumTierStep> = {
  local: 'budget',
  regional: 'budget',
  national: 'budget',
  j30: 'middle',
  j60: 'middle',
  j300: 'middle',
  w15: 'high',
  w35: 'high',
  w50: 'high',
  w75: 'high',
  w100: 'high',
  wta125: 'elite',
  wta250: 'elite',
  wta500: 'elite',
  wta1000: 'elite',
  slam: 'elite',
}

function ticketOf(c: AlbumCandidate, flavour: ReturnType<typeof flavourFor>): AlbumTicket {
  return {
    tier: TIERS[c.tier!].label,
    step: ALBUM_TIER_STEP[c.tier!],
    stage: c.finish === undefined ? '' : finishLabel(c.finish),
    venue: flavour.venue,
    dateLabel: c.week === null ? '' : weekSpan(c.week),
    gate: flavour.gate,
    seat: flavour.seat,
    row: flavour.row,
    bars: flavour.bars,
  }
}

function tagOf(c: AlbumCandidate, flavour: ReturnType<typeof flavourFor>): AlbumTag {
  return {
    stage: c.finish === undefined ? '' : finishLabel(c.finish),
    tier: TIERS[c.tier!].label,
    step: ALBUM_TIER_STEP[c.tier!],
    place: flavour.venue,
    ageLabel: ageLabelOf(c.ageYears),
  }
}

// =================================================================================================
// §7 SHEETS AND CHAPTERS
// =================================================================================================

/** ⚠ THE ALTERNATION, AS BUILT, AND THE READING DOCUMENTED BECAUSE THE SPEC's TWO CLAUSES CANNOT
 *  BOTH BIND THE SAME SEQUENCE. §3 says the opener is A or C and «последующие – обычные (раскладка
 *  B)»; it also says «Раскладки чередуются, повторение подряд запрещено». A three-sheet chapter is
 *  opener-B-B under the first clause, which the second read over ALL sheets would forbid – so the
 *  no-repeat rule is enforced where it can bind: over the OPENERS. Consecutive chapters alternate
 *  A and C, and the B run inside a chapter is what «обычные» means. Flagged in the build report. */
function openerLayoutOf(chapterPosition: number): AlbumLayout {
  return chapterPosition % 2 === 0 ? 'A' : 'C'
}

function noteOf(c: AlbumCandidate, hand: AlbumHand): AlbumNote {
  return {
    text: hand.note,
    dateLabel: c.week === null ? null : weekSpan(c.week),
    ageLabel: ageLabelOf(c.ageYears),
    lines: [],
  }
}

interface BuiltChapter {
  band: AlbumBand
  candidates: AlbumCandidate[]
}

function sheetsOf(world: WorldState, chapter: BuiltChapter, chapterIndex: number, voice: Temperament): AlbumSheetModel[] {
  const { band, candidates } = chapter
  const split = SHEET_SPLITS[Math.min(candidates.length, MAX_CHAPTER_FRAMES)]
  const title = ALBUM_CHAPTER_TITLES[band]
  const ages = candidates.map((c) => c.ageYears)
  const ageFrom = Math.min(...ages)
  const ageTo = Math.max(...ages)
  const chapterAgeLabel =
    ageFrom === ageTo ? ageLabelOf(ageFrom) : `${TICKET_WORDS.age} ${ageFrom} – ${ageTo}`
  const patch = patchFor(world.seed)
  const sheets: AlbumSheetModel[] = []
  let at = 0
  for (const [index, take] of split.entries()) {
    const own = candidates.slice(at, at + take)
    at += take
    const layout: AlbumLayout = index === 0 ? openerLayoutOf(chapterIndex - 1) : 'B'
    const id = `${band}-${index + 1}`
    const flavour = flavourFor(world.seed, id)
    const lead = own[0]
    // the sheet speaks for its lead frame – EXCEPT the closing sheet, whose words are A32's own
    // (the corpus's §5: «this is what the closing sheet says»): farewell may lead it chronologically,
    // and the book's last word is still the handing over, not the last match.
    const speaker = own.find((c) => c.occasion.id === 'retired') ?? lead
    const hand = speaker.occasion.voices[voice]
    // the sheet's own tournament fact, if it holds one – an honest sheet carries no invented trip.
    // A fact WITH a finish (a title, a final) makes the better pass than a cheque or an entry.
    const facts = own.filter((c) => c.tier !== undefined)
    const tournament = facts.find((c) => c.finish !== undefined) ?? facts[0] ?? null
    sheets.push({
      id,
      layout,
      chapterIndex,
      chapterTitle: title,
      ageLabel: chapterAgeLabel,
      frames: own.map((c) => frameOf(world, c, voice)),
      note: noteOf(lead, hand),
      line: hand.line,
      ticket: layout === 'B' && tournament ? ticketOf(tournament, flavour) : null,
      tag: layout === 'C' && tournament ? tagOf(tournament, flavour) : null,
      patch: layout === 'A' ? patch : null,
      doodles: [DOODLE_BY_KIND[lead.occasion.kind] ?? DOODLES[flavour.doodle]],
    })
  }
  return sheets
}

/** Which band chapter a career week belongs to. Career ages start at 13, so `portraitStage` can
 *  never answer `jun` here; the prologue chapter is built from the trace, never from a week. */
function bandOfAge(age: number): AlbumBand {
  const stage = portraitStage(age)
  return stage === 'jun' ? 'young' : stage
}

// =================================================================================================
// §8 THE ASSEMBLY
// =================================================================================================

/** ⭐⭐ THE BOOK, WHOLE – a pure read of the world, assembled when the section opens.
 *
 *  Chapters: 1 = the prologue (exists iff the v84 trace is non-null AND holds a frame-worthy
 *  moment), then the lived bands, each existing iff it earned at least one frame – «сколько прошла,
 *  столько и покажем», no empty chapters and no empty sheets, ever. A wizard career honestly starts
 *  at the bands; a career that stopped at nineteen never grows an adult chapter.
 *
 *  ⚠ ZERO DRAWS outside `seed:album:flavour:*`, ZERO writes anywhere: two calls on the same world
 *  return deep-equal books, flavour included, and the world is byte-identical after (the unit suite
 *  pins both). */
export function assembleAlbum(world: WorldState): AlbumBook {
  // the parent's hand is keyed on WHO SHE IS – birth, the voice bibles' own rule (the corpus's §2);
  // the arc is where the walls' drift gets its say, on the closing sheet alone
  const voice = world.temperament ?? temperamentFor(world.seed)

  const pool = [
    ...titleCandidates(world),
    ...finalCandidates(world),
    ...seasonCandidates(world),
    ...bodyCandidates(world),
    ...onceCandidates(world),
    ...assetCandidates(world),
    ...rareCandidates(world),
    ...closerCandidates(world),
  ]

  const chapters: BuiltChapter[] = []
  if (world.prologueTrace) {
    const moments = prologueCandidates(world.prologueTrace)
    if (moments.length > 0) chapters.push({ band: 'prologue', candidates: moments.slice(0, MAX_CHAPTER_FRAMES) })
  }
  for (const band of ['young', 'teen', 'adult', 'lateCareer'] as const) {
    const own = pool.filter((c) => {
      if (c.week === null) return false
      if (bandOfAge(c.ageYears) !== band) return false
      // the occasion's own band list is a corpus constraint: handwriting exists only for the bands
      // the document declared, and a frame with no words is not built (the corpus doc's §4)
      return c.occasion.bands.includes(band)
    })
    if (own.length === 0) continue
    const picked = selectRepresentatives(own, MAX_CHAPTER_FRAMES)
    if (picked.length > 0) chapters.push({ band, candidates: picked })
  }

  const sheets: AlbumSheetModel[] = []
  const chapterRows: AlbumChapter[] = []
  for (const [i, chapter] of chapters.entries()) {
    const own = sheetsOf(world, chapter, i + 1, voice)
    chapterRows.push({
      index: i + 1,
      title: ALBUM_CHAPTER_TITLES[chapter.band],
      ageLabel: own[0].ageLabel,
      sheetCount: own.length,
      firstSheet: sheets.length,
    })
    sheets.push(...own)
  }

  // ⭐ THE ARC – on the closing sheet, DISPLACING the retired sheet's note and line when the lean
  // moved (the corpus's §5: «this document writes nothing for the never-drifted case. That is not
  // an omission; it is the ruling» – the other eight careers keep A32's own words). The direction
  // is the OPEN axis's lean, the engine's own sign: positive is the armable direction – toward the
  // pole she was not born on – which for the walls machinery means she came OUT (`wallsGrowable`'s
  // note in engine/spirit.ts); negative means she drew in.
  //
  // ⚠⚠ AND THE REG-ONLY CAREER IS REACHABLE, WHICH THE SILENT CONDITION USED TO HIDE. Traced through
  // the only writer (`driftWalls`, engine/spirit.ts) on 20.09, because a branch that looks reachable
  // and is not – or the reverse – is this repo's oldest defect family. The pass visits both axes with
  // ONE set of inputs (`kicked`, `retained`, `herself`, and the same three per-week steps); the ONLY
  // thing that differs between them is `wallsGrowable(birth, axis)`, and it enters in exactly one
  // branch – «beyond her baseline», `value += w.growthPerWeek`. So:
  //
  //   * KICKS move both axes by the same `risePerWeek` and REPAIR walks both back by the same
  //     `repairPerWeek`, from the same start – a career that only ever suffered or healed carries
  //     `open === reg` at every week, which is precisely what his own nine saves showed
  //     (§4b: `{open: 43, reg: 43}`, then `{open: 66, reg: 66}`, and `{0, 0}` on the other eight);
  //   * the growth branch is the one that can move ONE axis, and it needs the axis to be growable.
  //     `wallsGrowable` is `openness === 'private'` for `open` and `intensity === 'intense'` for
  //     `reg`, so the two disagree for exactly the two mixed girls: `fiery` (open + intense) grows on
  //     `reg` alone, `quiet` (private + steady) on `open` alone.
  //
  // `quiet` therefore lands in the condition below and is written for. **`fiery` does not**: a fiery
  // girl on a caring bond whose parent bought the psychologist and held the `'herself'` focus becomes
  // measurably steadier – `{open: 0, reg: +x}` – and takes the ordinary closing sheet. That is a
  // quarter of all births, and it is not a rounding case: she is the girl the whole walls model was
  // built for. `tests/albumBook.test.ts` reaches the state through the REAL `driftWalls` rather than
  // by posing a lean, so this paragraph cannot rot into a story about an impossible branch.
  //
  // ⚠ IT IS DOCUMENTED AND NOT FIXED HERE, ON PURPOSE. The fix is two sentences per voice on the
  // regulation axis – «была резкой, стала ровной» and its opposite – and corpus sentences are the
  // owner's, never an agent's (invariant 4). Until he writes them the honest behaviour is the one
  // below: say nothing rather than tell a fiery girl's parent she opened up. Carried to spec §9.
  const lean = world.wallsLean ?? { open: 0, reg: 0 }
  const direction: AlbumArcDirection | null = lean.open === 0 ? null : lean.open > 0 ? 'open' : 'reserved'
  if (world.ending && direction && sheets.length > 0) {
    const closing = sheets[sheets.length - 1]
    const arc = ALBUM_ARC[direction][voice]
    sheets[sheets.length - 1] = {
      ...closing,
      note: closing.note ? { ...closing.note, text: arc.note } : { text: arc.note, dateLabel: null, ageLabel: null, lines: [] },
      line: arc.line,
    }
  }

  return { chapters: chapterRows, sheets }
}
