/**
 * r38-ceiling-dials – WHAT `plateauRate` AND THE FIT SPAN ARE WORTH, IN REALISED CEILING.
 *
 * Round 38. The owner, 07.09, on C3 turning out to be C1's lever seen from the other side: «нет
 * варианта, что они и дальше гармонично сотрудничают до абсолютного потолка», and on the fit: «вопрос
 * в том, как его показать?» – answered by the measurement that it IS shown and is worth 12%.
 * And: «Я принесу замеры – давай, да».
 *
 * ⚠ MEASUREMENT ONLY. Every arm patches `ECONOMY.development.ageCurve.plateauRate` and
 * `ECONOMY.coach.fitFactor` in place and restores them in a `finally` – the move
 * `tools/potential-band-sweep.ts` and `tools/skill-ceiling.ts` §4 document. Nothing ships from here.
 *
 * ⚠ THE ARITHMETIC IS `skill-ceiling.ts` §1's, DELIBERATELY: `growWeek` is
 * `skill += rate x (ceiling - skill) x luck`, so the share of her own headroom that can EVER arrive is
 * `1 - prod(1 - rate)` over the weeks she has. That is exact rather than simulated, which is what
 * makes a sweep of two dials across sixteen setups cheap enough to read in one table.
 *
 * Run: npx vite-node tools/r38-ceiling-dials.ts
 */
import { ECONOMY } from '../src/engine/economy'
import { ageFactor, trainFactor } from '../src/engine/development'
import { coachFactor } from '../src/engine/coach'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WeekPlan } from '../src/shared/protocol'
import type { StyleFit } from '../src/engine/coach'

const START_AGE = 14
const padR = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const pct = (n: number) => (100 * n).toFixed(1) + '%'

type RateTier = Parameters<typeof coachFactor>[0]
interface Setup { label: string; tier: RateTier; fit: StyleFit; train: number; matches: number }

/** The four the owner's three routes actually name, plus the floor and the ceiling of the ladder. */
const SETUPS: Setup[] = [
  { label: 'nonsense: self, light, no racing', tier: 'self', fit: 'off', train: 60, matches: 0 },
  { label: 'route 1: self, but run well', tier: 'self', fit: 'great', train: 85, matches: 2 },
  { label: 'route 2: middle coach, great fit', tier: 'middle', fit: 'great', train: 80, matches: 1 },
  { label: 'route 2 mismatched: middle, off', tier: 'middle', fit: 'off', train: 80, matches: 1 },
  { label: 'route 3: elite coach, great fit', tier: 'elite', fit: 'great', train: 85, matches: 2 },
  { label: 'the yardstick: elite+great+grind', tier: 'elite', fit: 'great', train: 85, matches: 3 },
]

function weeklyRate(s: Setup, age: number): number {
  const d = ECONOMY.development
  const plan: WeekPlan = { train: s.train, rest: 100 - s.train }
  return (
    ageFactor(age) *
    trainFactor(plan) *
    coachFactor(s.tier, s.fit) *
    (1 + Math.min(s.matches, d.matchBonusCap) * d.matchBonus)
  )
}

/** The share of her own headroom that can EVER arrive, walked to 38. */
function realisedEver(s: Setup): number {
  let remaining = 1
  for (let w = 0; w < (38 - START_AGE) * WEEKS_PER_YEAR; w++) {
    remaining *= 1 - weeklyRate(s, START_AGE + w / WEEKS_PER_YEAR)
  }
  return 1 - remaining
}

interface Arm { label: string; plateauRate?: number; fitGreat?: number; fitOff?: number }

function withArm<T>(a: Arm, fn: () => T): T {
  const c = ECONOMY.development.ageCurve as unknown as { plateauRate: number }
  const f = ECONOMY.coach.fitFactor as unknown as Record<string, number>
  const p = c.plateauRate, g = f.great, o = f.off
  if (a.plateauRate !== undefined) c.plateauRate = a.plateauRate
  if (a.fitGreat !== undefined) f.great = a.fitGreat
  if (a.fitOff !== undefined) f.off = a.fitOff
  try { return fn() } finally { c.plateauRate = p; f.great = g!; f.off = o! }
}

const SHIPPED = ECONOMY.development.ageCurve.plateauRate
// ⚠ THE LABEL IS BUILT FROM THE LIVE CONSTANTS, not from literals. The first draft spelled the fit
// span out by hand and went on printing «1.05/0.94» after the span had shipped at 1.25/0.75 – a
// caption lying about the row underneath it, which is this repo's most-repeated defect in miniature.
const SHIPPED_FIT = ECONOMY.coach.fitFactor as unknown as Record<string, number>
const ARMS: Arm[] = [
  { label: `SHIPPED (plateau ${SHIPPED}, fit ${SHIPPED_FIT.great}/${SHIPPED_FIT.off})` },
  { label: 'plateau x2   (0.0018)', plateauRate: 0.0018 },
  { label: 'plateau x3   (0.0027)', plateauRate: 0.0027 },
  { label: 'plateau x5   (0.0045)', plateauRate: 0.0045 },
  { label: 'fit span 1.15/0.85', fitGreat: 1.15, fitOff: 0.85 },
  { label: 'fit span 1.25/0.75', fitGreat: 1.25, fitOff: 0.75 },
  { label: 'plateau x3 + fit 1.15/0.85', plateauRate: 0.0027, fitGreat: 1.15, fitOff: 0.85 },
  { label: 'plateau x3 + fit 1.25/0.75', plateauRate: 0.0027, fitGreat: 1.25, fitOff: 0.75 },
]

console.log('WHAT THE TWO DIALS ARE WORTH, in the share of her own headroom that can EVER arrive.')
console.log('The arithmetic is skill-ceiling.ts §1: 1 - prod(1 - rate) over the weeks she has, to 38.')
console.log()
console.log(padR('arm', 30) + SETUPS.map((s) => padL(s.label.split(':')[0]!.slice(0, 9), 11)).join('') + padL('SPREAD', 9))
for (const arm of ARMS) {
  const vals = withArm(arm, () => SETUPS.map(realisedEver))
  const spread = Math.max(...vals) - Math.min(...vals)
  console.log(padR(arm.label, 30) + vals.map((v) => padL(pct(v), 11)).join('') + padL(pct(spread), 9))
}
console.log()
console.log('columns, in full:')
for (const s of SETUPS) console.log(`  ${s.label.split(':')[0]!.padEnd(10)} ${s.label}`)
console.log()
console.log('⚠ SPREAD is the distance between the best-run and the worst-run career. The owner asked for')
console.log('  «40% if the player does nonsense, close to 100% if it is run well»; the shipped row is')
console.log('  where that stands today.')
