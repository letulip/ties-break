// ROUND 34 #15 – DOES THE INCOME FIGURE ON THE SAVINGS ROW FALL WHEN MONEY IS TAKEN OUT?
//
//   npx vite-node tools/r34-savings-income.ts
//
// HIS WORDS: «Сумма дохода на savings меняется вниз если деньги вывести. Мне кажется она не должна
// меняться, просто новое поступление будет меньше»
//
// ⚠ THE REPRODUCTION COMES BEFORE THE FIX, and the first thing it has to settle is WHICH figure he
// is looking at. The savings card carries three numbers that could be read as "income":
//
//   RATE      `rateLine` – «Gains about 3% a season». A RATE, and a rate has no reason to move.
//   BRINGS IN `incomeCents` – «Brings in $N a week right now». Zero on a deposit: `assetWeeklyIncome-
//             Cents` answers only for the merch brand and the academy's stages.
//   CHANGE    `changeCents` – «+$N since they bought it (P%)». `valueCents - paidCents`.
//
// So this walk prints all three either side of a withdrawal, off the SHIPPED `shopView`, and lets
// the numbers say which one he saw move.
import { buyAsset, createWorld, sellAsset, shopView, tickWeek, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { formatCents } from '../src/shared/money'

const SEED = 'r34-15'
const STAKE_CENTS = 100_000_00
const YEARS = 10

function row(world: WorldState) {
  const r = shopView(world).rows.find((x) => x.id === 'deposit')
  if (!r) throw new Error('no deposit row')
  return r
}

function line(world: WorldState, when: string): void {
  const r = row(world)
  console.log(
    [
      when.padEnd(26),
      `week ${String(world.week).padStart(4)}`,
      `worth ${formatCents(r.valueCents ?? 0).padStart(12)}`,
      `paid ${formatCents(r.paidCents ?? 0).padStart(12)}`,
      `CHANGE ${formatCents(r.changeCents ?? 0).padStart(11)}`,
      `${String(r.changePct).padStart(4)}%`,
      `brings in ${formatCents(r.incomeCents).padStart(7)}`,
      `rate ${String(r.annualRatePct).padStart(2)}%`,
      `wallet ${formatCents(world.fundsCents).padStart(13)}`,
    ].join('  '),
  )
}

const world = createWorld(SEED)
const rng = rngFromSeed(world.seed)
world.fundsCents = 1_000_000_00
buyAsset(world, 'deposit', STAKE_CENTS)
line(world, 'opened')

for (let y = 0; y < YEARS; y++) {
  for (let w = 0; w < 52; w++) tickWeek(world, rng)
}
line(world, `after ${YEARS} years`)

const beforeChange = row(world).changeCents ?? 0
const beforeValue = row(world).valueCents ?? 0
const takeOut = Math.round(beforeValue / 2)

sellAsset(world, 'deposit', takeOut)
line(world, `took out ${formatCents(takeOut)}`)

const afterChange = row(world).changeCents ?? 0

console.log('')
console.log('THE VERDICT')
console.log(`  the gain the card showed after ${YEARS} years   : ${formatCents(beforeChange)}`)
console.log(`  the same figure, one withdrawal later    : ${formatCents(afterChange)}`)
console.log(`  it moved by                             : ${formatCents(afterChange - beforeChange)}`)
console.log(
  afterChange === beforeChange
    ? '  -> the sum describes what the holding EARNED, and a withdrawal does not rewrite it.'
    : '  -> the sum is recomputed from the balance that is LEFT, which is the defect he reported:\n' +
      `     the family is not poorer (the ${formatCents(takeOut)} is in the wallet), but the card now says they` +
      `\n     earned ${formatCents(afterChange)} when they earned ${formatCents(beforeChange)}.`,
)

// ...and one more tick, to answer the other half of his sentence: is the NEW income smaller?
const valueBefore = row(world).valueCents ?? 0
tickWeek(world, rng)
const valueAfter = row(world).valueCents ?? 0
console.log('')
console.log(`  the week's own accrual on the halved balance      : ${formatCents(valueAfter - valueBefore)}`)
console.log('  («просто новое поступление будет меньше» – which is what the engine already does)')
