// WHEN IS THE FAMILY POOREST? — the measurement the investor's terms must be picked against.
//
// The design rests on one rule: «terms are worst exactly when the need is greatest», which is what
// makes the offer arrive at the wrong moment. That rule needs a NEED CURVE before any percentage can
// be chosen, the same way PUSH_TOLERANCE was measured over 263 knocks rather than guessed.
//
// What it answers:
//   * the trough - the lowest the family's balance ever gets, and the WEEK it happens
//   * how long they spend under a working-family cushion
//   * how many careers go under at all, and how many never recover
//   * and, now that the adult tour pays: does prize money arrive before or after the trough?
//
// The econ bench reports END funds per preset, which is the wrong question for this: a career can
// finish comfortable having been one bad season from stopping.
import { createWorld, tickWeek, toSnapshot, enterEvent } from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import type { FamilyBackground, Snapshot } from '../src/shared/protocol'

const SEEDS = 20
const WEEKS = 312 // 14 -> 20, the horizon the adult tour is measured on
const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

interface Row {
  background: FamilyBackground
  troughCents: number
  troughWeek: number
  weeksUnderZero: number
  firstPrizeWeek: number | null
  endCents: number
}

const rows: Row[] = []

for (const background of BACKGROUNDS) {
  for (let s = 0; s < SEEDS; s++) {
    const seed = `need-${background}-${s}`
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
    const rng = rngFromSeed(`${seed}:bench`)
    let trough = Infinity
    let troughWeek = 0
    let under = 0
    let firstPrize: number | null = null

    for (let w = 0; w < WEEKS; w++) {
      const snap = toSnapshot(world) as Snapshot
      // A parent who enters what she is eligible for - the same policy the grid-visibility bench
      // uses, so "the family is stretched" means stretched by playing, not by sitting at home.
      for (const e of snap.upcoming) {
        if (e.entered) continue
        try {
          enterEvent(world, e.id)
        } catch {
          /* ineligible or unaffordable: the parent could not have entered either */
        }
      }
      tickWeek(world, rng)
      const funds = world.fundsCents
      if (funds < trough) {
        trough = funds
        troughWeek = world.week
      }
      if (funds < 0) under++
      if (firstPrize === null) {
        const paid = world.events.some((e) => e.category === 'prize' && (e.amountCents ?? 0) > 0)
        if (paid) firstPrize = world.week
      }
    }
    rows.push({
      background,
      troughCents: trough,
      troughWeek,
      weeksUnderZero: under,
      firstPrizeWeek: firstPrize,
      endCents: world.fundsCents,
    })
  }
}

function pct(xs: number[], p: number): number {
  const a = [...xs].sort((x, y) => x - y)
  return a[Math.min(a.length - 1, Math.floor((a.length - 1) * p))]
}
const $ = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

console.log(`seeds per background=${SEEDS}  weeks=${WEEKS} (14 -> 20)\n`)
console.log('background   trough (p10 / median / p90)              trough week   weeks under 0   first prize')
for (const background of BACKGROUNDS) {
  const g = rows.filter((r) => r.background === background)
  const t = g.map((r) => r.troughCents)
  const tw = g.map((r) => r.troughWeek)
  const u = g.map((r) => r.weeksUnderZero)
  const fp = g.map((r) => r.firstPrizeWeek).filter((x): x is number => x !== null)
  console.log(
    `${background.padEnd(11)} ${$(pct(t, 0.1)).padStart(10)} / ${$(pct(t, 0.5)).padStart(10)} / ${$(pct(t, 0.9)).padStart(10)}` +
      `   median w${String(pct(tw, 0.5)).padStart(4)}` +
      `   median ${String(pct(u, 0.5)).padStart(3)}` +
      `   ${fp.length}/${g.length} careers, median w${fp.length ? pct(fp, 0.5) : '-'}`,
  )
}

console.log('\nDOES THE MONEY ARRIVE BEFORE OR AFTER THE TROUGH?')
for (const background of BACKGROUNDS) {
  const g = rows.filter((r) => r.background === background && r.firstPrizeWeek !== null)
  const after = g.filter((r) => r.firstPrizeWeek! > r.troughWeek).length
  console.log(
    `  ${background.padEnd(9)} first prize lands AFTER the trough in ${after}/${g.length} careers` +
      (g.length ? ` (${((after / g.length) * 100).toFixed(0)}%)` : ''),
  )
}
