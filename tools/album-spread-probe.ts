// ⭐⭐⭐ THE ALBUM'S AGE SPREAD, MEASURED – round 47 item 11.
//
//   npx vite-node tools/album-spread-probe.ts [--careers N] [--shop 0|1] [--weeks N]
//
// ⚠ WHY IT EXISTS. The owner, 18.09, off his finished career: the seven photographs are «6 детских и
// юношеских и 1 взрослая в конце» – six childhood pictures and one adult one at the end – and he
// would like a smoother spread over the periods, a few more pictures, and significant career-era
// events as candidates, naming the academy's construction. That is a CLAIM ABOUT A DISTRIBUTION, and
// the house rule is that a claim about a distribution is confirmed or refuted as a number before
// anything is designed on top of it. It is also the concrete shape of his own standing backlog item
// («Текущий слайдер из 7 не подходит для объемной и насыщенной карьеры»), so the measurement has to
// answer the bigger question too: what material EXISTS in the adult years for a page to be made of.
//
// WHAT IT MEASURES, over N walked careers:
//   1. THE SPREAD. Every album page's age, per slot – median, range, and the share of PAGES that
//      land before 18. That is his sentence, as a number.
//   2. THE INVENTORY. Every candidate a page could be built from, bucketed by era, whether the
//      shipped album uses it or not: every `Milestone` type, every asset purchase week (the academy
//      among them), every injury, every season close, the wedding, college. So «where are the adult
//      years starving» is answered from the save's own contents rather than from a guess.
//
// MEASUREMENT ONLY. Every tick, answer and purchase goes through the public engine commands the UI
// uses; `resumeMain` + `stepCareerWeek` is `tools/album-money-probe.ts`' own walk, and `buyAsset`
// draws on nothing. ZERO MAIN draws are added.
//
// ⚠ A CAREER DOES NOT ADVANCE ON `tickWeek` ALONE – it stalls at every pending decision. The drain
// below is `album-money-probe.ts`' `answerWhateverIsOpen`, verbatim, for the same reason.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, median, type Policy } from './econ-bench'
import { drainLifeBeatsTallied } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import {
  answerFork,
  answerRetirement,
  buyAsset,
  kidAgeAt,
  ownedAssets,
  pendingBirthday,
  shopItem,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { buildAlbum } from '../src/engine/world/album'
import { TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}

const CAREERS = argOf('careers', 18)
const WALK_WEEKS = argOf('weeks', 1_600)
const SHOP_ON = argOf('shop', 1) === 1
/** ⭐⭐ THE TWO ARMS, AND THE DEFAULT IS THE ORDINARY CAREER. `--long 1` says «one more year» to
 *  every retirement offer and stops only at the one that is not a question – the LONGEST career the
 *  rules allow, and the arm `tools/album-money-probe.ts` uses because it is the one that can afford
 *  an academy. `--long 0` retires at the first offer. The album's shape is different on the two and
 *  the difference is the whole point of measuring both: the pages at the END move with the career's
 *  length while the pages at the START cannot. */
const LONG_ARM = argOf('long', 1) === 1

/** `tools/album-money-probe.ts`' list, verbatim. */
function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainLifeBeatsTallied(world)
    answerFork(world, 'continue')
  }
  drainLifeBeatsTallied(world)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  if (world.retirementOffer !== null) {
    answerRetirement(world, LONG_ARM ? world.retirementOffer.final : true)
  }
}

/** ⭐ THE BUYER, and it is `album-money-probe.ts`' ARM 1 ladder cut to what this probe needs. The
 *  academy is the point: the owner named its construction as candidate material, and every bench in
 *  `tools/` except that one refuses to buy anything, so a walk with the shop off would measure an
 *  inventory in which no academy has ever been built. The float is arm 1's, for arm 1's reason – a
 *  fund deposit that clears first starves the ladder and the academy is never reached. */
const LADDER = [
  'house-first',
  'merch-brand',
  'car-sensible',
  'academy-land',
  'academy-courts',
  'academy-building',
  'academy-staff',
  'house-garden',
  'boat-launch',
  'house-villa',
]
const FLOAT_CENTS = 300_000_00

function shopWeek(world: WorldState): void {
  if (world.ending) return
  const held = new Set(ownedAssets(world).map((a) => a.id))
  for (const id of LADDER) {
    if (held.has(id)) continue
    const item = shopItem(id)
    if (!item) continue
    if (world.fundsCents - item.entryCents < FLOAT_CENTS) break
    try {
      buyAsset(world, id)
    } catch {
      /* not on the shelf this week – the same refusal the screen would print */
    }
    return
  }
}

function walk(presetIx: number, index: number): WorldState {
  const policy: Policy = POLICIES[1]
  const { world } = openCareer(PRESETS[presetIx], index, policy)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < WALK_WEEKS; i++) {
    if (SHOP_ON) shopWeek(world)
    stepCareerWeek(world, rng, policy)
    if (world.ending === null) answerWhateverIsOpen(world)
    if (world.ending !== null) break
  }
  return world
}

// =================================================================================================
// THE ERAS – named once, read by both halves of the report
// =================================================================================================
//
// ⚠ THE CUTS ARE THE GAME'S OWN AND NOT A TASTE. 13/14 is where a career starts (`START_AGE_YEARS`
// and the birthday that decides which); 18 is where school ends and the junior ladder runs out, and
// it is the line his own sentence draws («childhood and youth» against «adult»); 22 is where a
// college career would have come back. Above that is the professional life the album has one page
// for.
const ERAS: { label: string; from: number; to: number }[] = [
  { label: 'childhood  <14', from: 0, to: 13 },
  { label: 'junior   14-17', from: 14, to: 17 },
  { label: 'young    18-21', from: 18, to: 21 },
  { label: 'adult    22-25', from: 22, to: 25 },
  { label: 'late       26+', from: 26, to: 99 },
]

function eraOf(age: number): string {
  for (const e of ERAS) if (age >= e.from && age <= e.to) return e.label
  return ERAS[ERAS.length - 1].label
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}
function padL(s: string, n: number): string {
  return s.length >= n ? s : ' '.repeat(n - s.length) + s
}

// =================================================================================================
// THE WALK
// =================================================================================================

interface Career {
  world: WorldState
  label: string
  endAge: number
  /** per slot (1-7): the age the page's week falls in, or null on an empty / weekless page */
  slotAge: (number | null)[]
  slotEmpty: boolean[]
  /** ⭐⭐ THE FACE ON THE POLAROID, which is the thing he is actually counting. `AlbumPage.stage` is
   *  `portraitStage(ageAt(week))` and it picks the art file – so «six childhood and one adult» is a
   *  claim about THIS column and only derivatively about the ages above it. */
  slotStage: string[]
}

const careers: Career[] = []
for (let i = 0; i < CAREERS; i++) {
  // Spread the sample over the whole preset table rather than one family – the owner's career is one
  // point and the question is about the shape, not about his seed.
  const presetIx = i % PRESETS.length
  const world = walk(presetIx, 3 + Math.floor(i / PRESETS.length))
  const album = buildAlbum(world)
  careers.push({
    world,
    label: `${PRESETS[presetIx].background}/${3 + Math.floor(i / PRESETS.length)}`,
    endAge: world.ending ? world.ending.ageYears : kidAgeAt(world, world.week),
    slotAge: album.map((p) => (p.week === null ? null : kidAgeAt(world, p.week))),
    slotEmpty: album.map((p) => p.empty),
    slotStage: album.map((p) => p.stage),
  })
}

// =================================================================================================
// 1. THE SPREAD – his sentence as a number
// =================================================================================================

const SLOT_NAME = [
  'the beginning',
  'her first win',
  'the first cheque',
  'the best week',
  'the worst week',
  'the turn',
  'the last week',
]

console.log(`\n=== THE ALBUM'S AGE SPREAD – ${careers.length} careers, shop ${SHOP_ON ? 'on' : 'off'}, ${LONG_ARM ? 'LONG arm (one more year until the last offer)' : 'ORDINARY arm (retires at the first offer)'} ===`)
console.log(`careers ended at median age ${median(careers.map((c) => c.endAge))}, range ${Math.min(...careers.map((c) => c.endAge))}-${Math.max(...careers.map((c) => c.endAge))}\n`)
console.log('slot  name                median age   range      empty   dated   <18     era of the median')
for (let s = 0; s < 7; s++) {
  const ages = careers.map((c) => c.slotAge[s]).filter((a): a is number => a !== null)
  const empty = careers.filter((c) => c.slotEmpty[s]).length
  const under = ages.filter((a) => a < 18).length
  const med = ages.length ? median(ages) : NaN
  console.log(
    `  ${s + 1}   ${pad(SLOT_NAME[s], 20)}${padL(ages.length ? String(med) : '–', 8)}   ` +
      `${padL(ages.length ? `${Math.min(...ages)}-${Math.max(...ages)}` : '–', 7)}   ` +
      `${padL(String(empty), 5)}   ${padL(String(ages.length), 5)}   ` +
      `${padL(ages.length ? `${Math.round((100 * under) / ages.length)}%` : '–', 4)}    ` +
      `${ages.length ? eraOf(med) : '–'}`,
  )
}

// HIS SENTENCE. «Six childhood/youth and one adult at the end» – counted over the pages a player
// actually turns, i.e. every page with a date on it, and then per career so the claim can be read as
// a typical album rather than as a pooled average.
const allDated = careers.flatMap((c) => c.slotAge.filter((a): a is number => a !== null))
const under18 = allDated.filter((a) => a < 18).length
console.log(`\nPAGES WITH A DATE: ${allDated.length} of ${careers.length * 7}. Before 18: ${under18} (${Math.round((100 * under18) / allDated.length)}%).`)
const perCareerUnder = careers.map((c) => c.slotAge.filter((a) => a !== null && a < 18).length)
const perCareerDated = careers.map((c) => c.slotAge.filter((a) => a !== null).length)
console.log(`PER CAREER: median ${median(perCareerUnder)} of ${median(perCareerDated)} dated pages are before 18.`)
const byEra = new Map<string, number>()
for (const a of allDated) byEra.set(eraOf(a), (byEra.get(eraOf(a)) ?? 0) + 1)
console.log('\nWHERE THE PAGES LAND:')
for (const e of ERAS) {
  const n = byEra.get(e.label) ?? 0
  console.log(`  ${pad(e.label, 16)}${padL(String(n), 5)}  ${padL(`${Math.round((100 * n) / allDated.length)}%`, 5)}  ${'#'.repeat(Math.round((60 * n) / allDated.length))}`)
}

// =================================================================================================
// 1b. THE FACES – the column his sentence actually counts
// =================================================================================================
//
// ⚠ HIS «6 CHILDHOOD AND 1 ADULT» IS A CLAIM ABOUT PHOTOGRAPHS, NOT ABOUT AGES, and the two are not
// the same column: `AlbumPage.stage` is `portraitStage(age)`, whose bands are the owner's own five
// (jun <11 · young 11-16 · teen 17-22 · adult 23-30 · lateCareer 31+) and whose value picks the art
// file that is drawn. A page at 22 and a page at 23 are one year apart and are a DIFFERENT PICTURE.
const STAGES = ['jun', 'young', 'teen', 'adult', 'lateCareer']
const STAGE_BAND: Record<string, string> = {
  jun: '<11', young: '11-16', teen: '17-22', adult: '23-30', lateCareer: '31+',
}
console.log('\nTHE FACE ON EACH PAGE – `portraitStage`, which is the art that is drawn:')
console.log(`slot  name                ${STAGES.map((s) => padL(s, 12)).join('')}`)
for (let s = 0; s < 7; s++) {
  const counts = STAGES.map((st) => careers.filter((c) => c.slotStage[s] === st).length)
  console.log(`  ${s + 1}   ${pad(SLOT_NAME[s], 20)}${counts.map((n) => padL(n === 0 ? '·' : String(n), 12)).join('')}`)
}
const faceTally = new Map<string, number>()
for (const c of careers) for (const st of c.slotStage) faceTally.set(st, (faceTally.get(st) ?? 0) + 1)
console.log(`\nALL ${careers.length * 7} FACES:`)
for (const st of STAGES) {
  const n = faceTally.get(st) ?? 0
  console.log(`  ${pad(`${st} (${STAGE_BAND[st]})`, 20)}${padL(String(n), 5)}  ${padL(`${Math.round((100 * n) / (careers.length * 7))}%`, 5)}  ${'#'.repeat(Math.round((60 * n) / (careers.length * 7)))}`)
}
// ...and the same per career, which is what a player sees in one album.
const childFaces = careers.map((c) => c.slotStage.filter((s) => s === 'jun' || s === 'young' || s === 'teen').length)
console.log(`\nHIS SENTENCE, PER ALBUM: median ${median(childFaces)} of 7 faces are jun/young/teen (his «childhood and youth»); ${7 - median(childFaces)} are adult/lateCareer.`)
console.log(`  distribution of the child/youth count: ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `${k}:${childFaces.filter((n) => n === k).length}`).join(' ')}`)

// =================================================================================================
// 2. THE INVENTORY – what material each era actually holds
// =================================================================================================
//
// ⚠ EVERY CANDIDATE, WHETHER THE SHIPPED ALBUM USES IT OR NOT. The question is not «what does slot 4
// pick» but «if a page were wanted at 24, is there anything true to put on it».

interface Row {
  kind: string
  week: number
}

function candidatesOf(world: WorldState): Row[] {
  const rows: Row[] = []
  for (const m of world.milestones) rows.push({ kind: `milestone:${m.type}`, week: m.week })
  for (const h of world.injuryHistory) rows.push({ kind: 'injury:layoff', week: h.week - h.weeksOut })
  for (const s of world.seasonHistory) {
    rows.push({ kind: 'season:close', week: s.seasonIndex * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1 })
  }
  // ⭐ THE ASSETS, AND THE ACADEMY IS THE ONE HE NAMED. Every purchase week is in the save –
  // `OwnedAsset.boughtWeek` for the row, and `entries[]` for each top-up – so «the week the academy
  // was begun» and «the week it was finished» are both derivable facts today.
  for (const a of world.assets) {
    // ⚠ THE RUNG AND NOT THE FAMILY. «The academy» is four purchases – land, courts, building,
    // staff – and the owner named its CONSTRUCTION, which is a span with two ends. A family roll-up
    // would hide both of them behind one row.
    rows.push({ kind: `asset:${a.id}`, week: a.boughtWeek })
  }
  if (world.college) {
    rows.push({ kind: 'college:enrolled', week: world.college.fromWeek })
    if (world.college.doneWeek !== null) rows.push({ kind: 'college:done', week: world.college.doneWeek })
  }
  // ⭐ HER OWN LIFE – the wave's own layer. Each episode is a relationship with dated turns; the
  // wedding already reaches the album as a milestone, the rest of them do not reach it at all.
  for (const ep of world.loveEpisodes ?? []) {
    rows.push({ kind: 'life:episode-start', week: ep.sinceWeek })
    if (ep.endedWeek !== null) rows.push({ kind: 'life:episode-end', week: ep.endedWeek })
  }
  return rows
}

const inventory = new Map<string, Map<string, number>>()
const careersWith = new Map<string, number>()
for (const c of careers) {
  const kinds = new Set<string>()
  for (const r of candidatesOf(c.world)) {
    if (r.week < 0) continue
    const age = kidAgeAt(c.world, r.week)
    const era = eraOf(age)
    let row = inventory.get(r.kind)
    if (!row) inventory.set(r.kind, (row = new Map()))
    row.set(era, (row.get(era) ?? 0) + 1)
    kinds.add(r.kind)
  }
  for (const k of kinds) careersWith.set(k, (careersWith.get(k) ?? 0) + 1)
}

console.log(`\n=== THE CANDIDATE INVENTORY – every dateable fact in the save, by era ===`)
console.log(`(counts are ROWS over all ${careers.length} careers; «careers» is how many of the ${careers.length} hold at least one)\n`)
console.log(`${pad('candidate', 26)}${ERAS.map((e) => padL(e.label.split(/\s+/).pop()!, 9)).join('')}${padL('total', 8)}${padL('careers', 9)}`)
const kinds = [...inventory.keys()].sort()
for (const k of kinds) {
  const row = inventory.get(k)!
  const total = [...row.values()].reduce((a, b) => a + b, 0)
  console.log(
    `${pad(k, 26)}${ERAS.map((e) => padL(String(row.get(e.label) ?? 0), 9)).join('')}${padL(String(total), 8)}${padL(String(careersWith.get(k) ?? 0), 9)}`,
  )
}

// WHERE THE ADULT YEARS ARE STARVING – the same table folded to the one question that matters.
console.log(`\n=== ADULT-ERA MATERIAL (18+) – what a page after the juniors could be made of ===`)
const adultEras = ERAS.filter((e) => e.from >= 18).map((e) => e.label)
for (const k of kinds) {
  const row = inventory.get(k)!
  const adult = adultEras.reduce((a, e) => a + (row.get(e) ?? 0), 0)
  if (adult === 0) continue
  console.log(`  ${pad(k, 26)}${padL(String(adult), 6)} rows after 18`)
}

// =================================================================================================
// 3. COVERAGE – the number a PROPOSED page has to be judged on
// =================================================================================================
//
// ⚠ A PAGE IS ONLY WORTH ITS SLOT IF MOST CAREERS CAN FILL IT. Slot 3's empty face is the shipped
// precedent and it is deliberate; a page that is empty for four careers in five is a different
// thing, and the difference is a number rather than a taste. So for every candidate: how many of the
// careers hold at least one, and how old she is at the FIRST of them.
console.log(`\n=== COVERAGE AND AGE OF EACH CANDIDATE (first occurrence) ===`)
console.log(`${pad('candidate', 26)}${padL('careers', 9)}${padL('cover', 8)}${padL('med age', 9)}${padL('range', 10)}`)
const firstAges = new Map<string, number[]>()
for (const c of careers) {
  const firstByKind = new Map<string, number>()
  for (const r of candidatesOf(c.world)) {
    if (r.week < 0) continue
    const prev = firstByKind.get(r.kind)
    if (prev === undefined || r.week < prev) firstByKind.set(r.kind, r.week)
  }
  for (const [k, w] of firstByKind) {
    const list = firstAges.get(k) ?? []
    list.push(kidAgeAt(c.world, w))
    firstAges.set(k, list)
  }
}
for (const k of kinds) {
  const ages = firstAges.get(k) ?? []
  if (ages.length === 0) continue
  console.log(
    `${pad(k, 26)}${padL(String(ages.length), 9)}${padL(`${Math.round((100 * ages.length) / careers.length)}%`, 8)}` +
      `${padL(String(median(ages)), 9)}${padL(`${Math.min(...ages)}-${Math.max(...ages)}`, 10)}`,
  )
}

// =================================================================================================
// 4. THE ONE NO-COPY LEVER INSIDE THE SEVEN SLOTS, MEASURED RATHER THAN PROPOSED BLIND
// =================================================================================================
//
// ⚠ IT IS NOT SHIPPED AND IS NOT MEANT TO BE BY THIS PROBE. Five of the seven slots are pinned by
// their own sentences to a moment that cannot move – week 0, the EARLIEST title, the EARLIEST
// cheque, the break-even week, the last week. Slot 4 is the one with any freedom at all: «the
// highest rung she ever won on» is a MAXIMUM, and a career that reaches a rung wins it several
// times, so the tie among equal-highest titles is broken arbitrarily. `slotBestWeek` keeps the
// FIRST (`>` on the ladder index); the LAST is equally true of every word on the page. This measures
// what the album's spread would do if the tie broke the other way – and nothing here changes it.
const bestFirst: number[] = []
const bestLast: number[] = []
for (const c of careers) {
  let first: { week: number; tier: string } | null = null
  let last: { week: number; tier: string } | null = null
  for (const m of c.world.milestones) {
    if (m.type !== 'title' || !m.tier) continue
    if (first === null || TIER_LADDER.indexOf(m.tier) > TIER_LADDER.indexOf(first.tier as never)) {
      first = { week: m.week, tier: m.tier }
    }
    if (last === null || TIER_LADDER.indexOf(m.tier) >= TIER_LADDER.indexOf(last.tier as never)) {
      last = { week: m.week, tier: m.tier }
    }
  }
  if (first) bestFirst.push(kidAgeAt(c.world, first.week))
  if (last) bestLast.push(kidAgeAt(c.world, last.week))
}
console.log(`\n=== SLOT 4's TIE-BREAK, BOTH WAYS (measured, NOT shipped) ===`)
if (bestFirst.length) {
  console.log(`  shipped (earliest of the equal-highest rung): median age ${median(bestFirst)}, range ${Math.min(...bestFirst)}-${Math.max(...bestFirst)}`)
  console.log(`  the other way (latest of the same rung):      median age ${median(bestLast)}, range ${Math.min(...bestLast)}-${Math.max(...bestLast)}`)
  const movedLater = bestFirst.filter((a, i) => bestLast[i] > a).length
  console.log(`  it would move the page LATER on ${movedLater} of ${bestFirst.length} careers, by a median of ${median(bestFirst.map((a, i) => bestLast[i] - a))} years.`)
}
console.log('')
