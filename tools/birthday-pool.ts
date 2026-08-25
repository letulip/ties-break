/**
 * birthday-pool – ROUND 26 #9a. HOW MANY GIFTS THERE ARE, HOW MANY SHE CAN REACH, AND HOW OFTEN THE
 * SAME ONE COMES ROUND AGAIN.
 *
 * The owner, 24.08: «Just a day together на день рождения случается подозрительно часто. Сколько у
 * нас вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не
 * так часто?» – an impression, and this file is the distribution that either confirms or refutes it.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, writes no save. It reads
 * `birthdayOffer` / `BIRTHDAY_BANDS` and the world's own `birthdays` record and nothing this round
 * introduced, so it runs unchanged on an arm with the fix reverted – which is the only thing that
 * makes a before/after here worth anything (CLAUDE.md: a null result needs the same provenance
 * check as a positive one).
 *
 *   npx vite-node tools/birthday-pool.ts                    (census + 12 tour + 12 college careers)
 *   npx vite-node tools/birthday-pool.ts -- --careers 24
 *   npx vite-node tools/birthday-pool.ts -- --census        (the catalogue arithmetic alone, instant)
 */
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import { buildBirthdayPrompt, chooseGift, pendingBirthday, resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { BIRTHDAY_BANDS, BIRTHDAY_COLLEGE_BAND, BIRTHDAY_DAY_TOGETHER, birthdayOffer } from '../src/engine/world/birthday'
import { inCollege } from '../src/engine/world/college'
import { meansOfCents, MEANS_BANDS } from '../src/engine/world/means'
import { ENDINGS } from '../src/engine/ending'
import type { Rng } from '../src/engine/rng'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const CAREERS = numOf('careers', 12)
const CENSUS_ONLY = args.includes('--census')
const POLICY = POLICIES[1]
const WALK_CAP = 900

const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const pct = (a: number, b: number) => (b === 0 ? '   –' : `${((100 * a) / b).toFixed(0)}%`)
const money = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`

function section(title: string): void {
  console.log(`\n${'='.repeat(100)}\n${title}\n${'='.repeat(100)}`)
}

// =================================================================================================
// 1. THE CENSUS – pure arithmetic over the catalogue, no career needed
// =================================================================================================
//
// MATERIAL_OPTIONS is 3 and is not exported; it is re-derived here from a real offer so this file
// cannot disagree with the engine about how many rows a dialog holds.
const probe = birthdayOffer('census', 20, [], false)
const ROWS = probe.options.length
const MATERIAL = ROWS - 1

function choose(n: number, k: number): number {
  if (k > n) return 0
  let out = 1
  for (let i = 0; i < k; i++) out = (out * (n - i)) / (i + 1)
  return Math.round(out)
}

function census(): void {
  section(`1. THE CATALOGUE – ${ROWS} rows per dialog, ${MATERIAL} of them material plus the day`)
  const allIds = new Set<string>([BIRTHDAY_DAY_TOGETHER.id])
  console.log(`  ${padE('band', 16)}${pad('gifts', 6)}${pad('subsets', 9)}${pad('P(on screen)', 14)}   ids`)
  console.log(`  ${'-'.repeat(96)}`)
  for (const band of BIRTHDAY_BANDS) {
    const n = band.gifts.length
    for (const g of band.gifts) allIds.add(g.id)
    const label = band === BIRTHDAY_COLLEGE_BAND ? 'college' : `${band.from}-${band.to}`
    console.log(
      `  ${padE(label, 16)}${pad(n, 6)}${pad(choose(n, MATERIAL), 9)}${pad(`${((100 * MATERIAL) / n).toFixed(0)}%`, 14)}   ${band.gifts.map((g) => g.id).join(', ')}`,
    )
  }
  console.log(`  ${'-'.repeat(96)}`)
  console.log(`  distinct gift ids in the whole catalogue (the day included): ${allIds.size}`)
  console.log(`  the day together is on EVERY dialog by ruling – P(on screen) = 100% at every age`)
}

// =================================================================================================
// 2. THE CAREER WALK
// =================================================================================================
interface BirthdayRow {
  career: string
  age: number
  week: number
  atCollege: boolean
  /** the four ids the dialog printed, in the order it printed them */
  options: string[]
  askedId: string
  given: string
  fundsCents: number
  kidFundsCents: number
}

/** Answer the birthday the way the dialog is answered, and record exactly what it printed.
 *  ⚠ THE PROMPT IS BUILT BEFORE `chooseGift`, because `chooseGift` pushes the row that would change
 *  what `giftsAlreadyGiven` sees – the same ordering `buildBirthdayPrompt` itself depends on. */
function answerIfBirthday(world: WorldState, career: string, out: BirthdayRow[], pick: (ids: string[]) => string): boolean {
  if (pendingBirthday(world) === null) return false
  const prompt = buildBirthdayPrompt(world)!
  const ids = prompt.options.map((o) => o.id)
  // The ask is deliberately NOT on the wire (owner: «не помечай»), so it is re-derived here off the
  // same sub-stream the engine uses – measurement, not a surface.
  const { askedId } = birthdayOffer(world.seed, prompt.age, (world.birthdays ?? []).map((b) => b.given).filter((g): g is string => g !== null), inCollege(world))
  const given = pick(ids)
  out.push({
    career,
    age: prompt.age,
    week: world.week,
    atCollege: inCollege(world),
    options: ids,
    askedId,
    given,
    fundsCents: world.fundsCents,
    kidFundsCents: world.kidFundsCents ?? 0,
  })
  chooseGift(world, given)
  return true
}

/** A tour career, walked from fourteen until it ends or the cap. Never answers the college fork. */
function walkTour(preset: (typeof PRESETS)[number], i: number, out: BirthdayRow[]): void {
  const { world, rng } = openCareer(preset, i, POLICY)
  const career = `tour-${preset.background}-${i}`
  for (let w = 0; w < WALK_CAP; w++) {
    answerIfBirthday(world, career, out, (ids) => ids[0])
    // ⚠ 'continue' AND NOT 'tour'. `ForkAnswer` is `continue | college | stop`; an unrecognised
    // string is not refused by `answerFork`, it simply never matches the continue arm, and every
    // career in the first draft of this file ended 'stopped' at week 243 – five birthdays each.
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    stepCareerWeek(world, rng, POLICY)
    if (world.ending) break
  }
}

/** ...and one that takes the scholarship, so the college band is measured on the years she is in it. */
function walkCollege(preset: (typeof PRESETS)[number], i: number, out: BirthdayRow[]): boolean {
  const { world, rng } = openCareer(preset, i, POLICY)
  const career = `coll-${preset.background}-${i}`
  let forked = false
  for (let w = 0; w < WALK_CAP && !forked; w++) {
    answerIfBirthday(world, career, out, (ids) => ids[0])
    if (world.ending && world.ending.type !== 'college') return false
    if (world.fork !== null && world.fork.answer === null) {
      answerFork(world, 'college')
      forked = true
      break
    }
    stepCareerWeek(world, rng, POLICY)
  }
  if (!forked) return false
  // the answer reserves; walk the gap to the September departure
  for (let gapW = 0; gapW < 54 && world.ending === null; gapW++) {
    answerIfBirthday(world, career, out, (ids) => ids[0])
    stepCareerWeek(world, rng, POLICIES[0])
  }
  // the year pauses on her birthday week – press, answer, press again
  for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    answerIfBirthday(world, career, out, (ids) => ids[0])
  }
  return true
}

function recurrence(rows: BirthdayRow[], title: string): void {
  section(title)
  if (!rows.length) {
    console.log('  no birthdays recorded')
    return
  }
  const careers = [...new Set(rows.map((r) => r.career))]
  console.log(`  ${careers.length} careers, ${rows.length} birthdays, ages ${Math.min(...rows.map((r) => r.age))}-${Math.max(...rows.map((r) => r.age))}`)

  // --- how often each id is ON SCREEN ------------------------------------------------------------
  const seen = new Map<string, number>()
  for (const r of rows) for (const id of r.options) seen.set(id, (seen.get(id) ?? 0) + 1)
  console.log(`\n  ON SCREEN – share of the ${rows.length} dialogs each row appeared in`)
  console.log(`  ${'-'.repeat(96)}`)
  for (const [id, n] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${padE(id, 16)}${pad(n, 6)}${pad(pct(n, rows.length), 7)}`)
  }

  // --- the same four rows twice running -----------------------------------------------------------
  let consecutiveIdentical = 0
  let consecutivePairs = 0
  const runOfDay: number[] = []
  const perCareerRepeat: number[] = []
  for (const c of careers) {
    const mine = rows.filter((r) => r.career === c).sort((a, b) => a.week - b.week)
    for (let i = 1; i < mine.length; i++) {
      consecutivePairs++
      const a = [...mine[i - 1].options].sort().join('|')
      const b = [...mine[i].options].sort().join('|')
      if (a === b) consecutiveIdentical++
    }
    // the longest run of birthdays that offered the identical four
    let best = mine.length ? 1 : 0
    let run = 1
    for (let i = 1; i < mine.length; i++) {
      const a = [...mine[i - 1].options].sort().join('|')
      const b = [...mine[i].options].sort().join('|')
      run = a === b ? run + 1 : 1
      if (run > best) best = run
    }
    runOfDay.push(best)
    // how many of her birthdays offered a row she had already been OFFERED before
    const held = new Set<string>()
    let repeats = 0
    for (const r of mine) {
      if (r.options.some((id) => held.has(id))) repeats++
      for (const id of r.options) held.add(id)
    }
    perCareerRepeat.push(mine.length ? repeats / mine.length : 0)
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  console.log(`\n  REPETITION`)
  console.log(`  ${'-'.repeat(96)}`)
  console.log(`  back-to-back birthdays offering the IDENTICAL four rows: ${consecutiveIdentical}/${consecutivePairs}  ${pct(consecutiveIdentical, consecutivePairs)}`)
  console.log(`  longest run of identical dialogs in one career:          mean ${mean(runOfDay).toFixed(1)}, worst ${Math.max(...runOfDay)}`)
  console.log(`  birthdays offering at least one row seen before:         ${(100 * mean(perCareerRepeat)).toFixed(0)}% of a career's birthdays`)

  // --- the ask ------------------------------------------------------------------------------------
  const asked = new Map<string, number>()
  for (const r of rows) asked.set(r.askedId, (asked.get(r.askedId) ?? 0) + 1)
  console.log(`\n  WHAT SHE ASKED FOR`)
  console.log(`  ${'-'.repeat(96)}`)
  for (const [id, n] of [...asked.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${padE(id, 16)}${pad(n, 6)}${pad(pct(n, rows.length), 7)}`)
  }
}

function wallets(rows: BirthdayRow[]): void {
  section('4. THE WALLET AT EACH BIRTHDAY – round 26 #4, what the copy is allowed to assume')
  const coll = rows.filter((r) => r.atCollege)
  const show = (label: string, xs: BirthdayRow[]) => {
    if (!xs.length) {
      console.log(`  ${padE(label, 22)} none`)
      return
    }
    const sums = xs.map((r) => r.fundsCents + r.kidFundsCents).sort((a, b) => a - b)
    const q = (p: number) => sums[Math.min(sums.length - 1, Math.floor(p * sums.length))]
    console.log(
      `  ${padE(label, 22)}n=${pad(xs.length, 4)}   min ${pad(money(sums[0]), 12)}   p25 ${pad(money(q(0.25)), 12)}   median ${pad(money(q(0.5)), 12)}   p75 ${pad(money(q(0.75)), 12)}   max ${pad(money(sums[sums.length - 1]), 12)}`,
    )
  }
  show('every birthday', rows)
  show('college birthdays', coll)
  show('18 and over', rows.filter((r) => r.age >= 18))
  console.log(`\n  the wallet is family + her own account (world.fundsCents + world.kidFundsCents)`)
  // ⚠ AND THE BAND TALLY, which is the number that says whether a hardship line is dead content or
  // a line most careers will read. `meansOfCents` is the engine's own predicate, not a copy of it.
  const tally = (xs: BirthdayRow[]) => {
    const b = { tight: 0, comfortable: 0, moneyed: 0 }
    for (const r of xs) b[meansOfCents(r.fundsCents + r.kidFundsCents)]++
    return b
  }
  const all = tally(rows)
  const cb = tally(coll)
  console.log(
    `  means bands (tight <= ${money(MEANS_BANDS.tightAtOrBelowCents)}, moneyed >= ${money(MEANS_BANDS.moneyedAtOrAboveCents)}):`,
  )
  console.log(
    `    every birthday     tight ${pad(all.tight, 4)} ${pad(pct(all.tight, rows.length), 5)}   comfortable ${pad(all.comfortable, 4)} ${pad(pct(all.comfortable, rows.length), 5)}   moneyed ${pad(all.moneyed, 4)} ${pad(pct(all.moneyed, rows.length), 5)}`,
  )
  console.log(
    `    college birthdays  tight ${pad(cb.tight, 4)} ${pad(pct(cb.tight, coll.length), 5)}   comfortable ${pad(cb.comfortable, 4)} ${pad(pct(cb.comfortable, coll.length), 5)}   moneyed ${pad(cb.moneyed, 4)} ${pad(pct(cb.moneyed, coll.length), 5)}`,
  )
}

// =================================================================================================
const t0 = Date.now()
census()
if (!CENSUS_ONLY) {
  const tour: BirthdayRow[] = []
  for (let k = 0; k < CAREERS; k++) walkTour(PRESETS[k % PRESETS.length], k, tour)
  const coll: BirthdayRow[] = []
  let taken = 0
  for (let k = 0; taken < CAREERS && k < CAREERS * 4; k++) {
    if (walkCollege(PRESETS[k % PRESETS.length], 1000 + k, coll)) taken++
  }
  if (taken < CAREERS) console.log(`\n  ⚠ only ${taken} careers reached the college fork`)
  recurrence(tour, '2. A TOUR CAREER – every birthday from fourteen to the end')
  recurrence(coll.filter((r) => r.atCollege), '3. THE COLLEGE BAND – the four birthdays spent in a hall of residence')
  wallets([...tour, ...coll])
  console.log(`\n  (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}
