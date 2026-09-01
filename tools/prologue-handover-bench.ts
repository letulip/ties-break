// THE HANDOVER BENCH – the prologue's phase 4, measured (docs/specs/childhood-prologue-money-2026-09.md).
//
// Three things, and the first one is the reason the other two exist:
//
//   PART A – THE CARD TABLE'S OWN NUMBERS. Every childhood the shipped table can produce, walked:
//   32 runs, their costs, and the two constants `ECONOMY.prologue` is pinned to. Printed first so
//   the rest is measured against something the reader can check by hand.
//
//   PART B – THE RESERVE. What each background opens on across those 32 runs, against the flat
//   $8k / $25k / $120k the game has always used.
//
//   PART C – THE COACH'S READ. Which of the three bands a fresh career draws, and whether the
//   childhood can move it. The whole design of `handoverRoomBand` rests on the answer to the second
//   question being NO.
//
// ⚠ NO TICK IS RUN. `createWorld` is called (that is the thing under measurement) and nothing is
// advanced, so the MAIN stream is never drawn on and the frozen capture cannot move.
import { createWorld, prologueCoachTier, STARTING_FUNDS_CENTS } from '../src/engine/world'
import { handoverRoomBand } from '../src/engine/world/coachMarket'
import { ECONOMY, prologueFundsCents } from '../src/engine/economy'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { EMPTY_RUN, cardFor, chosenYears, spentCents, withOrigin, withPick, type PrologueRun } from '../src/prologue/run'
import { DEFAULT_PROFILE, type FamilyBackground } from '../src/shared/protocol'

const BACKGROUNDS: readonly FamilyBackground[] = ['working', 'middle', 'wealthy']
const DECISION_AGES = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)
const SEEDS = 2000

/** Every childhood the table can produce: four binary decisions at 8..11 settle the twelfth's face,
 *  and the face offers two answers of its own. */
function everyRun(origin: FamilyBackground = 'middle'): PrologueRun[] {
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
  step(0, withOrigin(EMPTY_RUN, origin))
  return out
}

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const runs = everyRun()
const spends = runs.map(spentCents).sort((a, b) => a - b)
const q = (p: number) => spends[Math.min(spends.length - 1, Math.floor(p * spends.length))]

console.log('=== PART A – what the nine cards can cost ===')
console.log(`runs: ${runs.length}`)
console.log(`cheapest ${money(spends[0])}   median ${money(q(0.5))}   dearest ${money(spends[spends.length - 1])}`)
console.log(`p25 ${money(q(0.25))}   p75 ${money(q(0.75))}`)
console.log(
  `reference (midpoint of the range) ${money((spends[0] + spends[spends.length - 1]) / 2)}` +
    `   pinned ${money(ECONOMY.prologue.referenceSpendCents)}`,
)
console.log(
  `swing (half the spread) ${money((spends[spends.length - 1] - spends[0]) / 2)}` +
    `   pinned ${money(ECONOMY.prologue.spendSwingCents)}`,
)

console.log('\n=== PART B – the reserve she starts the game with ===')
console.log('background   flat      min       median    max')
for (const bg of BACKGROUNDS) {
  const funds = everyRun(bg).map((r) => prologueFundsCents(bg, spentCents(r))).sort((a, b) => a - b)
  console.log(
    `${bg.padEnd(12)} ${money(STARTING_FUNDS_CENTS[bg]).padEnd(9)} ${money(funds[0]).padEnd(9)} ` +
      `${money(funds[Math.floor(funds.length / 2)]).padEnd(9)} ${money(funds[funds.length - 1])}`,
  )
}

console.log('\n=== PART B2 – the rung she arrives on ===')
const rungs: Record<string, number> = {}
for (const run of runs) {
  const rung = prologueCoachTier(chosenYears(run))
  rungs[rung] = (rungs[rung] ?? 0) + 1
}
console.log(Object.entries(rungs).map(([k, n]) => `${k} ${n}/${runs.length}`).join('   '))

console.log(`\n=== PART C – the coach's read, over ${SEEDS} seeds ===`)
const cheapest = runs.reduce((a, b) => (spentCents(a) <= spentCents(b) ? a : b))
const dearest = runs.reduce((a, b) => (spentCents(a) >= spentCents(b) ? a : b))
const arm = (run: PrologueRun) => ({ years: chosenYears(run), spentCents: spentCents(run) })
for (const [name, run] of [['cheapest', cheapest], ['dearest', dearest]] as const) {
  const tally: Record<string, number> = {}
  for (let i = 0; i < SEEDS; i++) {
    const band = handoverRoomBand(createWorld(`bench-${i}`, DEFAULT_PROFILE, 'b', arm(run)))
    tally[band] = (tally[band] ?? 0) + 1
  }
  const line = ['Close to her ceiling', 'Still room to grow', 'Huge potential']
    .map((b) => `${b} ${(((tally[b] ?? 0) / SEEDS) * 100).toFixed(1)}%`)
    .join('   ')
  console.log(`${name.padEnd(9)} ${line}`)
}
let moved = 0
for (let i = 0; i < SEEDS; i++) {
  const a = handoverRoomBand(createWorld(`bench-${i}`, DEFAULT_PROFILE, 'b', arm(cheapest)))
  const b = handoverRoomBand(createWorld(`bench-${i}`, DEFAULT_PROFILE, 'b', arm(dearest)))
  if (a !== b) moved++
}
console.log(`the childhood moves the band on ${((moved / SEEDS) * 100).toFixed(1)}% of seeds`)
