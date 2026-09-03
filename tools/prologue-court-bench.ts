// THE CHILDHOOD ON A COURT – phase 12's bench (`npm run bench:court`).
//
// Invariant 5: a balance change ships with a bench run and a spec recording predicted vs measured.
// The spec is docs/specs/childhood-on-court-2026-09.md and every number in it is this file's output.
//
// THE DEFECT IT MEASURES, in the owner's own words: at a Local Open she was drawn as «a ninth child
// out of STARTING_SKILL_BAND, with no connection to the childhood», so «a player who paid for the
// club, one-to-one hours and the sports school watches her play exactly like a neglected girl».
//
// ⚠ AND THE CONTROL HE ASKED FOR BY NAME. Phase 3 justified drawing the eight opponents from the
// FOURTEEN-year-old band on the grounds that `basePServe` reads only the DIFFERENCE between two
// players – true, but it holds only while she is drawn from that band too. Once her build comes from
// a partial childhood she may sit systematically below them, and a ten-year-old's tournament becomes
// a guaranteed first-round exit. §3 below is that measurement: her finish distribution at each of
// 10, 11, 12 and 13, on both roads, and the field's own standard beside hers.
//
// ⚠ THE TWO ROADS ARE THE CARD TABLE'S, NOT HAND-BUILT YEARS. `LIGHT` and `CARRIED` are the same
// pair every prologue test walks, so this bench and the suite are talking about one childhood.
import {
  CHILDHOOD,
  childhoodWalk,
  devotedChildhood,
  medianChildhood,
  neglectedChildhood,
  type ChildhoodYear,
} from '../src/engine/childhood'
import { SKILL_KEYS, STARTING_SKILL_BAND } from '../src/engine/development'
import { KID_ID } from '../src/engine/world'
import { PROLOGUE_CARDS, TOURNAMENT_ANSWER } from '../src/prologue/cards'
import { LOCAL_POOL, localPool, playLocalOpen, prologueEntrant } from '../src/prologue/pool'
import { EMPTY_RUN, withEntry, withOrigin, withPick, yearsLivedBy, type PrologueRun } from '../src/prologue/run'
import type { MatchPlayer } from '../src/engine/match/types'

const SEEDS = Number(process.env.SEEDS ?? 2000)
const AGES = [10, 11, 12, 13]

const LIGHT: Record<number, string> = { 8: 'municipal', 9: 'group', 10: 'stay-home', 11: 'ordinary-school', 12: 'let-her-stop' }
const CARRIED: Record<number, string> = { 8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year' }

/** A run walked as far as the card at `age` – picks for every decision card up to it, and this
 *  year's tournament question answered «enter». That is the state the screen is in when it fills the
 *  queue, so `yearsLivedBy(run, age)` here is the list the shipped `kidAt` passes. */
function runTo(road: Record<number, string>, age: number): PrologueRun {
  let run = withOrigin(EMPTY_RUN, 'middle')
  for (const card of PROLOGUE_CARDS) {
    if (card.age > age) break
    if (card.options) run = withPick(run, card.age, road[card.age])
    if (card.tournament) run = withEntry(run, card.age, TOURNAMENT_ANSWER.enter)
  }
  return run
}

function yearsAt(road: Record<number, string>, age: number): ChildhoodYear[] {
  return yearsLivedBy(runTo(road, age), age)
}

function meanOf(p: MatchPlayer): number {
  let total = 0
  for (const k of SKILL_KEYS) total += p[k]
  return total / SKILL_KEYS.length
}

function fixed(x: number, n = 2): string {
  return x.toFixed(n)
}

// =================================================================================================
// §1 THE FORMULA – what the level reads at every length of childhood, before and after
// =================================================================================================
//
// The BEFORE arm is reconstructed from public exports rather than from a second checkout: the old
// level was `swing * (q_soFar - qMedian_FULL) / (qDevoted_FULL - qMedian_FULL)`, and every term of
// that is on `childhoodWalk`'s own result. So one run prints both arms and they cannot drift apart.

const Q_MEDIAN_FULL = childhoodWalk(medianChildhood()).quality
const Q_DEVOTED_FULL = childhoodWalk(devotedChildhood()).quality
const DENOM = Q_DEVOTED_FULL - Q_MEDIAN_FULL

function levelBefore(years: readonly ChildhoodYear[]): number {
  return (CHILDHOOD.swingPoints * (childhoodWalk(years).quality - Q_MEDIAN_FULL)) / DENOM
}

console.log('=== §1 THE LEVEL, BY HOW MANY YEARS SHE HAS LIVED ===')
console.log(`swingPoints = ${CHILDHOOD.swingPoints}   (a devoted FULL childhood, on every attribute)`)
console.log('')
console.log('the engine`s own three reference childhoods, truncated year by year:')
console.log('  years  age  neglected(before -> after)  median(before -> after)  devoted(before -> after)')
const REFERENCE: Record<string, ChildhoodYear[]> = {
  neglected: neglectedChildhood(),
  median: medianChildhood(),
  devoted: devotedChildhood(),
}
for (let n = 1; n <= 9; n++) {
  const cells = Object.values(REFERENCE).map((full) => {
    const years = full.slice(0, n)
    return `${fixed(levelBefore(years)).padStart(6)} ->${fixed(childhoodWalk(years).level).padStart(6)}`
  })
  console.log(`  ${String(n).padStart(5)}  ${String(4 + n).padStart(3)}  ${cells.join('   ')}`)
}
console.log('')
console.log('the two ROADS the card table can actually produce, at each weekend age:')
console.log('  age  years  light(before -> after)  carried(before -> after)   gap(before -> after)')
for (const age of AGES) {
  const light = yearsAt(LIGHT, age)
  const carried = yearsAt(CARRIED, age)
  const gapBefore = levelBefore(carried) - levelBefore(light)
  const gapAfter = childhoodWalk(carried).level - childhoodWalk(light).level
  console.log(
    `  ${age}  ${String(light.length).padStart(5)}  ` +
      `${fixed(levelBefore(light)).padStart(6)} ->${fixed(childhoodWalk(light).level).padStart(6)}   ` +
      `${fixed(levelBefore(carried)).padStart(6)} ->${fixed(childhoodWalk(carried).level).padStart(6)}   ` +
      `${fixed(gapBefore).padStart(6)} ->${fixed(gapAfter).padStart(6)}`,
  )
}

// =================================================================================================
// §2 THE BUILD SHE PLAYS ON – the level after the band clamp, which is what a court sees
// =================================================================================================
//
// ⚠ THE CLAMP EATS SOME OF THE SWING AND THE HONEST NUMBER IS THIS ONE, not §1's. A girl already
// born at the top of an axis cannot be raised past the top of what this game says a fourteen-year-old
// is (`childhoodArrival`), so the realised gap is smaller than the formula's and shrinks as the
// childhood grows. §1 is the model; §2 is the court.

console.log('')
console.log('=== §2 HER BUILD, AFTER THE BAND CLAMP – mean of the five attributes ===')
console.log(`  ${SEEDS} seeds, the same born girl on both roads`)
console.log('  age  born   light   carried   realised gap   (formula gap)')
const realisedGap: Record<number, number> = {}
for (const age of AGES) {
  const light = yearsAt(LIGHT, age)
  const carried = yearsAt(CARRIED, age)
  let born = 0
  let lo = 0
  let hi = 0
  for (let i = 0; i < SEEDS; i++) {
    const seed = `court-${i}`
    born += meanOf(prologueEntrant(seed, KID_ID, 'Vera Novak', age))
    lo += meanOf(prologueEntrant(seed, KID_ID, 'Vera Novak', age, light))
    hi += meanOf(prologueEntrant(seed, KID_ID, 'Vera Novak', age, carried))
  }
  born /= SEEDS
  lo /= SEEDS
  hi /= SEEDS
  realisedGap[age] = hi - lo
  const formulaGap = childhoodWalk(carried).level - childhoodWalk(light).level
  console.log(
    `  ${age}  ${fixed(born)}  ${fixed(lo)}   ${fixed(hi)}     ${fixed(hi - lo).padStart(5)}          ${fixed(formulaGap)}`,
  )
}

// =================================================================================================
// §3 ⚠⚠ THE CONTROL – IS THE FIELD STILL THE RIGHT FIELD FOR HER?
// =================================================================================================

console.log('')
console.log('=== §3 THE CONTROL – her finish distribution, by age and road ===')
console.log(`  ${SEEDS} seeds per cell. finish 0 = the title, 3 = a first-round exit.`)
console.log('  final = she lost the final; semi = she lost the semi-final; R1exit = she lost her first match.')
console.log('  age  road      title   final    semi    R1exit   mean wins')

type Tally = { title: number; final: number; semi: number; exit: number; wins: number }

function playRoad(age: number, road: Record<number, string> | null): Tally {
  const years = road ? yearsAt(road, age) : []
  const t: Tally = { title: 0, final: 0, semi: 0, exit: 0, wins: 0 }
  for (let i = 0; i < SEEDS; i++) {
    const seed = `court-${i}`
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', age, years)
    const open = playLocalOpen(seed, kid, age)
    if (open.finish === 0) t.title++
    else if (open.finish === 1) t.final++
    else if (open.finish === 2) t.semi++
    else t.exit++
    t.wins += open.wins
  }
  return t
}

const pct = (n: number) => `${((100 * n) / SEEDS).toFixed(1)}%`
const tallies: Record<string, Tally> = {}
for (const age of AGES) {
  for (const [name, road] of [
    ['neglected', LIGHT],
    ['devoted  ', CARRIED],
  ] as const) {
    const t = playRoad(age, road)
    tallies[`${age}:${name.trim()}`] = t
    console.log(
      `  ${age}  ${name}  ${pct(t.title).padStart(6)}  ${pct(t.final).padStart(6)}  ` +
        `${pct(t.semi).padStart(6)}  ${pct(t.exit).padStart(6)}    ${(t.wins / SEEDS).toFixed(2)}`,
    )
  }
}

console.log('')
console.log('  the same table as ONE number per cell – the share of weekends she wins at least one match:')
console.log('  age  neglected  devoted  swing')
for (const age of AGES) {
  const n = tallies[`${age}:neglected`]
  const d = tallies[`${age}:devoted`]
  const anyWin = (t: Tally) => (100 * (SEEDS - t.exit)) / SEEDS
  console.log(
    `  ${age}    ${anyWin(n).toFixed(1)}%     ${anyWin(d).toFixed(1)}%    ${(anyWin(d) - anyWin(n)).toFixed(1)}pp`,
  )
}

// =================================================================================================
// §4 THE FIELD – «are the eight strong for ten?»
// =================================================================================================
//
// The eight children are drawn from `STARTING_SKILL_BAND`, which is the FOURTEEN-year-old band. This
// is the arm that says whether that is still fair once she stops being a bare draw from it: her mean
// against the field's, and against the seven who actually make the cut (the weakest of the eight is
// bumped when she enters).

console.log('')
console.log('=== §4 HER STANDARD AGAINST THE FIELD SHE MEETS ===')
console.log(`  the band: ${SKILL_KEYS.map((k) => `${k} ${STARTING_SKILL_BAND[k][0]}-${STARTING_SKILL_BAND[k][1]}`).join(', ')}`)
console.log(`  pool size ${LOCAL_POOL.size}; she takes the last place and the weakest child is bumped`)
console.log('  age  road       her    field(8)   drawn(7)   her rank in the draw of 8 (1 = strongest)')
for (const age of AGES) {
  for (const [name, road] of [
    ['neglected', LIGHT],
    ['devoted  ', CARRIED],
  ] as const) {
    const years = yearsAt(road, age)
    let her = 0
    let field = 0
    let drawn = 0
    let rank = 0
    for (let i = 0; i < SEEDS; i++) {
      const seed = `court-${i}`
      const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', age, years)
      const pool = localPool(seed, age)
      const cut = pool.slice(0, LOCAL_POOL.size - 1)
      her += meanOf(kid)
      field += pool.reduce((s, p) => s + meanOf(p), 0) / pool.length
      drawn += cut.reduce((s, p) => s + meanOf(p), 0) / cut.length
      rank += 1 + cut.filter((p) => meanOf(p) > meanOf(kid)).length
    }
    console.log(
      `  ${age}  ${name}  ${fixed(her / SEEDS)}   ${fixed(field / SEEDS)}      ${fixed(drawn / SEEDS)}      ${(rank / SEEDS).toFixed(2)}`,
    )
  }
}

console.log('')
console.log('=== §5 THE DEGENERACY CHECK – no age may be a foregone conclusion ===')
let worst = ''
for (const age of AGES) {
  for (const name of ['neglected', 'devoted']) {
    const t = tallies[`${age}:${name}`]
    const exit = (100 * t.exit) / SEEDS
    const title = (100 * t.title) / SEEDS
    const verdict = exit >= 80 || title >= 80 ? 'DEGENERATE' : 'ok'
    if (verdict !== 'ok') worst = `${age}/${name}`
    console.log(`  ${age} ${name.padEnd(10)} R1 exit ${exit.toFixed(1)}%, title ${title.toFixed(1)}%  -> ${verdict}`)
  }
}
console.log(worst ? `  ⚠ DEGENERATE CELL: ${worst}` : '  no cell is degenerate at the 80% line')
console.log('')
console.log(`  realised build gap, ten -> thirteen: ${fixed(realisedGap[10])} -> ${fixed(realisedGap[13])}`)
