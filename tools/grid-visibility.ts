// HOW OFTEN DOES THE GRID ACTUALLY DRAW? — owner, 31.07: he updated the app, sees the new coloured
// donut on Family Budget (same wave) and does NOT see the new calendar.
//
// The grid is deliberately bounded: `weekGridFor` returns null unless EVERY day of the week is one
// of court / gym / rest / match (`isOrdinaryWeek`), and those weeks keep the day strip the first
// calendar wave shipped. That boundary is the owner's own - «для тех, где нет отпусков, чемпионатов
// и поездок» - so a week away, on holiday, in an exam blackout, in the off-season or laid up shows
// the old drawing BY DESIGN.
//
// What was never measured is the SHARE. If an ordinary week is rare, the feature is bounded into
// near-invisibility and the boundary needs rethinking rather than defending.
import { createWorld, tickWeek, toSnapshot, enterEvent } from '../src/engine/world'
import { calendarWeekFor } from '../src/composables/weekDays'
import { isOrdinaryWeek } from '../src/composables/weekGrid'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import type { Snapshot } from '../src/shared/protocol'

const SEEDS = 12
const WEEKS = 156

let ordinary = 0
let entered = 0
let total = 0
const byReason = new Map<string, number>()

function bump(k: string) {
  byReason.set(k, (byReason.get(k) ?? 0) + 1)
}

for (let s = 0; s < SEEDS; s++) {
  const seed = `grid-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:bench`)
  for (let w = 0; w < WEEKS; w++) {
    const snap = toSnapshot(world) as Snapshot
    // Enter whatever is on offer, the way a playing parent does - otherwise the bench measures a
    // career that never travels, which is exactly the case the grid is best at and would flatter it.
    for (const e of snap.upcoming) {
      if (e.entered) continue
      try {
        enterEvent(world, e.id)
        entered++
      } catch {
        /* ineligible: fine, the parent could not have entered either */
      }
    }
    const fresh = toSnapshot(world) as Snapshot
    const week = calendarWeekFor(fresh, fresh.week + 1)
    total++
    if (isOrdinaryWeek(week.days)) {
      ordinary++
      bump('ordinary (the grid draws)')
    } else {
      const kinds = new Set(week.days.map((d) => d.kind))
      bump([...kinds].sort().join('+'))
    }
    tickWeek(world, rng)
  }
}

console.log(`entries made: ${entered}`)
console.log(`careers=${SEEDS}  weeks each=${WEEKS}  weeks looked at=${total}`)
console.log(`\nTHE GRID DRAWS ON ${((ordinary / total) * 100).toFixed(1)}% OF WEEKS\n`)
console.log('what the other weeks are:')
for (const [k, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${k}`)
}
