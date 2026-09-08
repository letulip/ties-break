/**
 * r40-childhood-compounding – ROUND 40 #6, «Вариант B: compound, not sum», measured before any dial
 * moves (CLAUDE.md invariant 5).
 *
 * ⚠⚠ THE FIRST QUESTION IS NOT «HOW STRONG IS THE COMPOUNDING» BUT «IS THERE ANY», and it has an
 * answer that can be read off the code before it is measured. `foldYears` carries a habit between
 * years – `carry = habitCarry*carry + (1-habitCarry)*(joy*coordination)` – and each year's quality
 * blends this year's own work with it. That IS a channel from one year into the next. But it is a
 * LINEAR one: with `joy = 1` (no card in the shipped table asks for more practice than a child that
 * age can take, so `burn` is 0 on every reachable run) the whole fold reduces to
 *
 *     quality = Σ_j [ w_j·share·taught_j + E_j ] · c_j        where E_j = Σ_{k>j} w_k·(1-share)·(1-habitCarry)·habitCarry^(k-1-j)
 *
 * – a SUM of per-year terms, each depending on that year's own decision and on nothing else. So the
 * childhood's decisions cannot reinforce one another today whatever the dials say, and «three years
 * of private coaching after a club year» is worth exactly «three years of private coaching» plus «a
 * club year». Part 1 measures that claim rather than asserting it: it rebuilds all 32 reachable runs
 * from single-decision deltas and prints the residual.
 *
 * Part 2 sweeps the two dials the channel is made of (`coordinationShare`, `habitCarry`) and prints,
 * for each setting, the three numbers a candidate has to satisfy at once:
 *   * the ARRIVAL SPAN across the 32 runs – round 40 #5 re-measured it at 2.44 points;
 *   * the MEDIAN ANCHOR – `childhoodWalk(medianChildhood()).level` must still be exactly 0.000, or an
 *     ordinary prologue stops handing the game the girl `startingSkills` has always produced;
 *   * the reference childhoods, which `tests/childhood.test.ts` pins to twelve places.
 *
 * ⚠ Synthetic seeds only; the owner's saves are read-only and never fixtures.
 *
 * Run: npx vite-node tools/r40-childhood-compounding.ts [-- --seeds 4000]
 */
import {
  appetiteAt,
  CHILDHOOD,
  CHILDHOOD_AGES,
  childhoodArrival,
  childhoodWalk,
  devotedChildhood,
  medianChildhood,
  neglectedChildhood,
  type ChildhoodYear,
} from '../src/engine/childhood'
import { SKILL_KEYS } from '../src/engine/development'
import { startingSkills } from '../src/engine/world/player'
import { EMPTY_RUN, cardFor, chosenYears, withOrigin, withPick, pickAt, yearsSoFar } from '../src/prologue/run'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { PrologueRun } from '../src/prologue/run'

const args = process.argv.slice(2)
const nSeeds = (() => {
  const i = args.indexOf('--seeds')
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : 4000
})()

const PROFILE = { ...DEFAULT_PROFILE, background: 'middle' as const }

/** THE DIALS, WRITTEN THROUGH. `CHILDHOOD` is a `const` object, not a frozen one, so a probe can set
 *  it – and every reader takes it at call time, so the whole module moves together. ⚠ Restored after
 *  every sweep row, and part 1 re-asserts the shipped values before it prints. */
type Dials = { coordinationShare: number; habitCarry: number }
const SHIPPED: Dials = { coordinationShare: CHILDHOOD.coordinationShare, habitCarry: CHILDHOOD.habitCarry }
function setDials(d: Dials): void {
  const w = CHILDHOOD as unknown as Record<string, number>
  w.coordinationShare = d.coordinationShare
  w.habitCarry = d.habitCarry
}

// =================================================================================================
// THE POPULATION – every childhood the shipped card table can produce
// =================================================================================================
// Four binary decisions at 8..11 settle which FACE of the twelfth the player meets, and that face
// offers two answers of its own: 2^4 x 2 = 32 runs. Walked rather than listed, exactly as
// `tools/r40-handover-realisation-cuts.ts` and `tests/prologue-handover.test.ts` walk it, because
// an option id alone cannot say which face it belongs to.
const DECISION_AGES = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)
const RUNS: PrologueRun[] = (() => {
  const out: PrologueRun[] = []
  const step = (i: number, run: PrologueRun): void => {
    if (i === DECISION_AGES.length - 1) {
      for (const opt of cardFor(12, run).options ?? []) out.push(withPick(run, 12, opt.id))
      return
    }
    for (const opt of PROLOGUE_CARDS.find((c) => c.age === DECISION_AGES[i])?.options ?? []) {
      step(i + 1, withPick(run, DECISION_AGES[i], opt.id))
    }
  }
  step(0, withOrigin(EMPTY_RUN, 'middle'))
  return out
})()

/** WHICH ARM EACH DECISION TOOK, as «the dearer of the two», read off the card the run actually met
 *  rather than off a list of ids – the twelfth's two faces have different option ids. */
function dearMask(run: PrologueRun): boolean[] {
  return DECISION_AGES.map((age) => {
    const card = cardFor(age, run)
    const picked = pickAt(age, run)
    const opts = card.options ?? []
    const dearest = opts.reduce((a, b) => ((a.costCents ?? 0) >= (b.costCents ?? 0) ? a : b))
    return picked?.id === dearest.id
  })
}
const MASKS = RUNS.map(dearMask)
const YEARS = RUNS.map((r) => chosenYears(r))
const DEAR_COUNT = MASKS.map((m) => m.filter(Boolean).length)

const SEEDS = Array.from({ length: nSeeds }, (_, i) => startingSkills(`r40g-${i}`, PROFILE))
const meanOf = (s: Record<string, number>) => SKILL_KEYS.reduce((n, k) => n + s[k], 0) / SKILL_KEYS.length

/** The mean attribute at fourteen for one childhood, averaged over the corpus – post-clamp, which is
 *  the number the balance spec's §2 table is written in. */
function arrivalMean(years: readonly ChildhoodYear[]): number {
  let total = 0
  for (const born of SEEDS) total += meanOf(childhoodArrival(born, years) as unknown as Record<string, number>)
  return total / SEEDS.length
}

/** ROUND 40 #5's OWN METHOD, kept separate because it is a different quantity: the per-seed span
 *  between the cheapest and dearest run she could have had, averaged over seeds. */
function pairedSpan(list: readonly (readonly ChildhoodYear[])[]): number {
  let total = 0
  for (const born of SEEDS) {
    let lo = Infinity
    let hi = -Infinity
    for (const years of list) {
      const m = meanOf(childhoodArrival(born, years) as unknown as Record<string, number>)
      lo = Math.min(lo, m)
      hi = Math.max(hi, m)
    }
    total += hi - lo
  }
  return total / SEEDS.length
}

const f = (n: number, d = 3) => n.toFixed(d).padStart(d + 4)

// =================================================================================================
// PART 1 – IS TODAY'S SPAN COMPOUNDING OR ADDITION?
// =================================================================================================
setDials(SHIPPED)
console.log(`\nDIALS AS SHIPPED: coordinationShare ${CHILDHOOD.coordinationShare} · habitCarry ${CHILDHOOD.habitCarry}`)
console.log(`CORPUS: ${RUNS.length} reachable runs of the shipped card table x ${nSeeds} seeds\n`)

console.log('=== PART 1 – DOES A CONSISTENT CHILDHOOD BEAT ITS OWN COUNT OF DEAR YEARS? ===\n')

const levels = YEARS.map((y) => childhoodWalk(y).level)
const allCheapIdx = DEAR_COUNT.indexOf(0)

/** ⭐⭐ THE MODEL'S OWN ADDITIVITY, MEASURED AWAY FROM THE FORK. A run's twelfth arm is not one year:
 *  `readTwelfth` decides which FACE of the twelfth the player meets from the years 5..11, and the two
 *  faces sell different years (0.2/0.1 against 0.7/0.6 on the cheap arm). So the shipped table's
 *  residual mixes two things. This arm holds the twelfth's pair fixed and varies only the five
 *  decisions, which is the model asked on its own. */
const FIXED = {
  quiet: [
    { age: 5, share: 0.35, teaching: 0.1 },
    { age: 6, share: 0.65, teaching: 0.35 },
    { age: 7, share: 0.7, teaching: 0.4 },
  ],
  pairs: [
    { age: 8, cheap: [0.6, 0.3], dear: [0.95, 0.95] },
    { age: 9, cheap: [0.6, 0.25], dear: [0.85, 1] },
    { age: 10, cheap: [0.7, 0.5], dear: [0.8, 0.5] },
    { age: 11, cheap: [0.5, 0.25], dear: [1, 1] },
    { age: 12, cheap: [0.2, 0.1], dear: [0.8, 0.65] },
  ],
} as const
/** the shipped table with ONE face of the twelfth, and the thirteenth mirroring it (`sameAsLastYear`) */
function fixedTable(mask: readonly boolean[]): ChildhoodYear[] {
  const out: ChildhoodYear[] = FIXED.quiet.map((y) => ({
    age: y.age,
    practice: y.share * appetiteAt(y.age),
    teaching: y.teaching,
    focus: 'general' as const,
  }))
  for (const [i, p] of FIXED.pairs.entries()) {
    const [share, teaching] = mask[i] ? p.dear : p.cheap
    out.push({ age: p.age, practice: share * appetiteAt(p.age), teaching, focus: 'general' })
  }
  const twelfth = mask[4] ? FIXED.pairs[4].dear : FIXED.pairs[4].cheap
  out.push({ age: 13, practice: twelfth[0] * appetiteAt(13), teaching: twelfth[1], focus: 'general' })
  return out
}
const FIXED_MASKS: boolean[][] = Array.from({ length: 32 }, (_, m) =>
  Array.from({ length: 5 }, (_, i) => ((m >> i) & 1) === 1),
)
function additiveResidual(levelOf: (mask: readonly boolean[]) => number, masks: readonly (readonly boolean[])[]): number {
  const base = levelOf(masks.find((m) => m.every((x) => !x))!)
  const solo = [0, 1, 2, 3, 4].map((i) => levelOf(masks.find((m) => m.filter(Boolean).length === 1 && m[i])!) - base)
  let worst = 0
  for (const m of masks) {
    let predicted = base
    for (let i = 0; i < 5; i++) if (m[i]) predicted += solo[i]
    worst = Math.max(worst, Math.abs(predicted - levelOf(m)))
  }
  return worst
}
const modelResidual = additiveResidual((m) => childhoodWalk(fixedTable(m)).level, FIXED_MASKS)

// The additive prediction over the SHIPPED table, where the twelfth's arm changes with the face.
const soloDelta = DECISION_AGES.map((_, i) => {
  const idx = MASKS.findIndex((m) => m.filter(Boolean).length === 1 && m[i])
  return levels[idx] - levels[allCheapIdx]
})
let worstResidual = 0
for (let r = 0; r < RUNS.length; r++) {
  let predicted = levels[allCheapIdx]
  for (let i = 0; i < DECISION_AGES.length; i++) if (MASKS[r][i]) predicted += soloDelta[i]
  worstResidual = Math.max(worstResidual, Math.abs(predicted - levels[r]))
}
// ⚠⚠ THE PRECONDITION OF THE WHOLE ARGUMENT, CHECKED RATHER THAN ASSUMED. The model has exactly one
// nonlinearity – `joy = 1 - strainCost·burn`, and `burn` only accumulates when a year asks for MORE
// practice than a child that age can take. No arm of the shipped table does, so joy is 1 everywhere
// and the fold is linear. If a future card ever sells more than an appetite, this line moves first.
const joys = YEARS.flatMap((y) => childhoodWalk(y).years.map((r) => r.joy))
console.log(`joy over every year of every reachable run: min ${Math.min(...joys)}, max ${Math.max(...joys)}`)
console.log('  ⚠ the model\'s ONLY nonlinearity is the strain term, and no card in the table reaches it.\n')

console.log('EVERY RUN AGAINST A PURELY ADDITIVE MODEL built from its own single-decision deltas')
console.log(`  the MODEL, one face of the twelfth, 32 masks:  worst residual ${modelResidual.toExponential(2)} points`)
console.log(`  the SHIPPED TABLE, all 32 reachable runs:      worst residual ${worstResidual.toExponential(2)} points`)
console.log('  ⭐ the first number is the answer to «do the choices compound»: they do not – the habit')
console.log('     channel carries a year forward LINEARLY, so the childhood is a SUM of its years.')
console.log('  ⚠ the second is not compounding either: it is the TWELFTH\'S FORK. Which face the player')
console.log('     meets is derived from 5..11, and the two faces sell different years.')

// how the fork lands – which face each run met, and what its arms are worth
const faceOf = RUNS.map((r) => ((cardFor(12, r).options ?? [])[0]?.id === 'let-her-stop' ? 'tired' : 'wants-more'))
const nTired = faceOf.filter((x) => x === 'tired').length
console.log(`  the face census: tired on ${nTired} of ${RUNS.length} runs, wants-more on ${RUNS.length - nTired}`)

console.log('\nthe same question by count – every run with k dear years, best against worst')
console.log('   k   runs      min      max     span      mean')
for (let k = 0; k <= DECISION_AGES.length; k++) {
  const idx = levels.map((_, i) => i).filter((i) => DEAR_COUNT[i] === k)
  if (idx.length === 0) continue
  const xs = idx.map((i) => levels[i])
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  console.log(
    `  ${String(k).padStart(2)}  ${String(idx.length).padStart(5)}  ${f(Math.min(...xs))}  ${f(Math.max(...xs))}  ${f(Math.max(...xs) - Math.min(...xs))}  ${f(mean)}`,
  )
}
console.log('  ⚠ the spread inside a count is POSITIONAL (a dear year at 12 outweighs one at 8, and')
console.log('    the year at 13 is the twelfth again) – it is not a premium for consistency.')

// ⚠ ROUND 40 #5's OWN CORPUS, RE-EXAMINED. It built the twelfth from a fixed pair of ids –
// 'let-her-stop' against 'give-her-the-year' – which belong to DIFFERENT faces, and `pickAt` returns
// null for an id the drawn face does not carry. A run that answers the twelfth with the other face's
// id therefore hands `childhoodWalk` a SEVEN-year childhood, not a nine-year one.
const ITEM_FIVE_YEARS: ChildhoodYear[][] = (() => {
  const PAIRS: readonly (readonly [number, string, string])[] = [
    [8, 'municipal', 'club'],
    [9, 'group', 'one-to-one'],
    [10, 'stay-home', 'enter'],
    [11, 'ordinary-school', 'sports-school'],
    [12, 'let-her-stop', 'give-her-the-year'],
  ]
  const out: ChildhoodYear[][] = []
  for (let mask = 0; mask < 32; mask++) {
    let run = withOrigin(EMPTY_RUN, 'middle')
    for (const [i, [age, cheap, dear]] of PAIRS.entries()) run = withPick(run, age, (mask >> i) & 1 ? dear : cheap)
    out.push(yearsSoFar(run))
  }
  return out
})()
{
  const short = YEARS.filter((y) => y.length < 9).length
  const itemFiveShort = ITEM_FIVE_YEARS.filter((y) => y.length < 9).length
  console.log(`\n  this enumeration's runs that are short of nine years: ${short} of 32`)
  console.log(`  round 40 #5's fixed-id enumeration, same check:        ${itemFiveShort} of 32`)
  console.log('  ⚠ #5 answered the twelfth with a pair of ids from DIFFERENT faces, and `pickAt` returns')
  console.log('    null for an id the drawn face does not carry – so half its rows are SEVEN-year')
  console.log('    childhoods measured against a seven-year median, not the runs a player can walk.')
}

// THE CONSISTENCY QUESTION IN ITS PUREST FORM, away from the card table: the same nine year-values,
// arranged consistently and arranged alternately. Under a compounding channel the block wins.
const HI = { practice: 0.95, teaching: 0.95 }
const LO = { practice: 0.45, teaching: 0.15 }
const build = (hi: readonly boolean[]): ChildhoodYear[] =>
  CHILDHOOD_AGES.map((age, i) => ({
    age,
    practice: (hi[i] ? HI.practice : LO.practice) * appetiteAt(age),
    teaching: hi[i] ? HI.teaching : LO.teaching,
    focus: 'general' as const,
  }))
const BLOCK = [false, false, false, false, true, true, true, true, true]
const ALTERN = [false, true, false, true, false, true, true, false, true]
const FLIPPED = [true, true, true, true, true, false, false, false, false]
console.log('\nthe same five dear years, arranged three ways (nine synthetic years, one multiset)')
for (const [name, arr] of [['late block', BLOCK], ['alternating', ALTERN], ['early block', FLIPPED]] as const) {
  console.log(`  ${name.padEnd(12)} level ${f(childhoodWalk(build(arr)).level)}`)
}
console.log('  ⚠ they differ, and every point of the difference is WHICH YEARS were dear, not whether')
console.log('    the dear years were adjacent – see the residual above.')

// =================================================================================================
// PART 2 – THE SWEEP
// =================================================================================================
console.log('\n=== PART 2 – WHAT THE TWO DIALS OF THE CHANNEL ACTUALLY BUY ===\n')
console.log('  share = coordinationShare (how much of a year is its OWN work; the rest is habit)')
console.log('  carry = habitCarry (how much of last year\'s habit survives into this one)\n')
console.log(
  '  share  carry | card span | card span | model span |  cards/ | median | devoted | neglected |  worst',
)
console.log(
  '               |  (paired) |  (means)  |  (nglct-dev)| model % |  level |  level  |   level   | residual',
)

type Row = { d: Dials; paired: number; means: number; model: number; ratio: number; median: number; devoted: number; neglected: number; residual: number }
const rows: Row[] = []
// ⚠ `coordinationShare = 1` IS THE CHANNEL SWITCHED OFF – no year reads the habit at all – and it is
// in the sweep as the bound rather than as a candidate: it says what the whole channel is worth.
const SHARES = [0.4, 0.5, 0.6, 0.7, 0.8, 1]
const CARRIES = [0.3, 0.45, 0.6, 0.75, 0.9]
for (const share of SHARES) {
  for (const carry of CARRIES) {
    const d = { coordinationShare: share, habitCarry: carry }
    setDials(d)
    const ls = YEARS.map((y) => childhoodWalk(y).level)
    const lo = ls.indexOf(Math.min(...ls))
    const hi = ls.indexOf(Math.max(...ls))
    const means = arrivalMean(YEARS[hi]) - arrivalMean(YEARS[lo])
    const paired = pairedSpan(YEARS)
    const model = arrivalMean(devotedChildhood()) - arrivalMean(neglectedChildhood())
    // the additive residual again, at this setting
    const solo = DECISION_AGES.map((_, i) => {
      const idx = MASKS.findIndex((m) => m.filter(Boolean).length === 1 && m[i])
      return ls[idx] - ls[allCheapIdx]
    })
    let res = 0
    for (let r = 0; r < RUNS.length; r++) {
      let p = ls[allCheapIdx]
      for (let i = 0; i < DECISION_AGES.length; i++) if (MASKS[r][i]) p += solo[i]
      res = Math.max(res, Math.abs(p - ls[r]))
    }
    const row: Row = {
      d,
      paired,
      means,
      model,
      ratio: (means / model) * 100,
      median: childhoodWalk(medianChildhood()).level,
      devoted: childhoodWalk(devotedChildhood()).level,
      neglected: childhoodWalk(neglectedChildhood()).level,
      residual: res,
    }
    rows.push(row)
    const mark = share === SHIPPED.coordinationShare && carry === SHIPPED.habitCarry ? ' <- SHIPPED' : ''
    console.log(
      `  ${share.toFixed(2)}   ${carry.toFixed(2)} |   ${f(paired)}  |   ${f(means)}  |   ${f(model)}   |  ${row.ratio.toFixed(1).padStart(5)}% | ${row.median.toFixed(3).padStart(6)} | ${f(row.devoted)} |  ${f(row.neglected)} | ${res.toExponential(1)}${mark}`,
    )
  }
}
setDials(SHIPPED)

console.log('\n⚠ THE ANCHOR THAT DISQUALIFIES A ROW HOWEVER GOOD ITS SPAN: `median level` must read')
console.log('  exactly 0.000 – an ordinary prologue hands the game the girl `startingSkills` has')
console.log('  always produced. `devoted level` must read exactly the swing (2.400) for the same reason.')

const bad = rows.filter((r) => Math.abs(r.median) > 1e-12 || Math.abs(r.devoted - CHILDHOOD.swingPoints) > 1e-12)
console.log(`  rows that break either anchor: ${bad.length} of ${rows.length}`)

// =================================================================================================
// PART 3 – WHAT THE HABIT CHANNEL IS DOING TODAY, decision by decision
// =================================================================================================
// It does not make the decisions reinforce one another (part 1). What it DOES do is carry a year
// forward: part of what a club year buys is bought in the years after it. That share is the honest
// measure of the channel's strength, and it is what a dial would move.
console.log('\n=== PART 3 – HOW MUCH OF A DECISION IS ALREADY PAID IN THE YEARS AFTER IT ===\n')
const WEIGHT = (age: number) => {
  let total = 0
  for (const a of CHILDHOOD_AGES) total += appetiteAt(a)
  return appetiteAt(age) / total
}
const taughtOf = (t: number) => CHILDHOOD.teachingFloor + (1 - CHILDHOOD.teachingFloor) * t
console.log('  share  carry |   age 8    age 9   age 10   age 11   age 12  (the echo, as a share of what the decision is worth)')
for (const share of [0.4, 0.5, 0.6, 0.7, 0.8]) {
  for (const carry of [0.3, 0.6, 0.9]) {
    setDials({ coordinationShare: share, habitCarry: carry })
    const base = childhoodWalk(fixedTable([false, false, false, false, false])).quality
    const cells: string[] = []
    for (const [i, p] of FIXED.pairs.entries()) {
      const mask = [false, false, false, false, false]
      mask[i] = true
      const total = childhoodWalk(fixedTable(mask)).quality - base
      // the year's OWN term: `weight * coordinationShare * coordination * taught`, and for the
      // twelfth the thirteenth mirrors it (`sameAsLastYear`), so its own term is counted twice
      let own =
        WEIGHT(p.age) * share * (p.dear[0] * taughtOf(p.dear[1]) - p.cheap[0] * taughtOf(p.cheap[1]))
      if (p.age === 12) {
        own += WEIGHT(13) * share * (p.dear[0] * taughtOf(p.dear[1]) - p.cheap[0] * taughtOf(p.cheap[1]))
      }
      cells.push(`${((1 - own / total) * 100).toFixed(1)}%`.padStart(8))
    }
    console.log(`  ${share.toFixed(2)}   ${carry.toFixed(2)} |${cells.join(' ')}`)
  }
}
setDials(SHIPPED)
console.log('  ⭐ AS SHIPPED (0.60/0.60) 38.9% of what a club year at eight buys is paid in the years')
console.log('     AFTER it – the channel is not weak, it is LINEAR. And the echo falls with age: the')
console.log('     twelfth\'s own decision is only 12.8% echo, because there is nowhere left for it to go.')
console.log('  ⚠ carry 0.90 WEAKENS the channel rather than strengthening it – `(1 - habitCarry)` is')
console.log('    what a year folds INTO the habit, so a stickier habit absorbs less of the new year.')

// ⭐⭐ THE MECHANISM BEHIND PART 2, PROVED RATHER THAN TOLD. Every year's contribution to the whole
// childhood is closed-form under `joy = 1` (see the header): its own term plus its echo into the
// years after it. The three quiet years at 5..7 are the SAME on all 32 runs – the player never
// chooses them – so any dial that moves value into the echo channel moves it toward years nobody
// picked, and the card table's reach falls with it. ⚠ The decomposition is checked against
// `childhoodWalk().quality` before it is believed, and the probe exits non-zero if it does not sum.
console.log('\n  what share of the whole childhood the three UNCHOSEN years (5, 6, 7) own')
console.log('  share  carry | unchosen share | reconstruction error')
for (const share of [0.4, 0.6, 0.8, 1]) {
  for (const carry of [0.6]) {
    setDials({ coordinationShare: share, habitCarry: carry })
    const years = medianChildhood()
    let unchosen = 0
    let total = 0
    for (const [j, y] of years.entries()) {
      const c = Math.min(1, y.practice / appetiteAt(y.age))
      let echo = 0
      for (let k = j + 1; k < years.length; k++) {
        echo += WEIGHT(years[k].age) * (1 - share) * (1 - carry) * Math.pow(carry, k - 1 - j)
      }
      const value = WEIGHT(y.age) * share * c * taughtOf(y.teaching) + c * echo
      total += value
      if (y.age <= 7) unchosen += value
    }
    const err = Math.abs(total - childhoodWalk(years).quality)
    console.log(`  ${share.toFixed(2)}   ${carry.toFixed(2)} |         ${((unchosen / total) * 100).toFixed(1)}% | ${err.toExponential(1)}`)
    if (err > 1e-12) {
      console.log('  ⚠⚠ the decomposition does not reconstruct the walk – the arm is wrong, not the model')
      process.exit(1)
    }
  }
}
setDials(SHIPPED)

console.log('\nTHE SHIPPED ROW, in the units the round is arguing in')
const ship = rows.find((r) => r.d.coordinationShare === SHIPPED.coordinationShare && r.d.habitCarry === SHIPPED.habitCarry)!
console.log(`  arrival span across the 32 reachable runs:              ${ship.paired.toFixed(3)} points`)
console.log(`  the same span over round 40 #5's own corpus:            ${pairedSpan(ITEM_FIVE_YEARS).toFixed(3)} points  – #5 reported 2.44`)
console.log(`  the model's own span (neglected <-> devoted):           ${ship.model.toFixed(3)} points  – §8c quotes 4.28`)
console.log(`  the cards therefore reach:                             ${((ship.paired / ship.model) * 100).toFixed(1)}% of it  – §8c's finding 1 says 44%`)
