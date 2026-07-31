// WHAT DOES THE GRID ACTUALLY DRAW? — and this bench has been re-aimed once, on 31.07.
//
// IT WAS BUILT TO ANSWER "how often does the grid draw AT ALL". The owner updated the app, saw the
// new coloured donut on Family Budget (same wave) and did NOT see the new calendar; `weekGridFor`
// returned null unless every day of the week was one of court / gym / rest / match, and every other
// week fell back to the day strip the first calendar wave shipped. This bench measured that share
// and the answer was the reason the boundary went: 26.2% of weeks - better than one in four - drew
// the other, plainer thing.
//
// ⚠ THE BOUNDARY IS GONE (owner: «очень даже должна [рисоваться], никакой разницы. Просто содержание
// сетки будет другим»), so the old question now has a constant answer: 100%. What is worth measuring
// instead is the MIX - how often a player meets each KIND of week, and therefore how much of the new
// content is on screen in an ordinary career. A week type that turns up in 0.1% of weeks is a week
// type nobody will ever see, which is a design fact rather than a bug, and it is better known than
// guessed at.
import { createWorld, tickWeek, toSnapshot, enterEvent } from '../src/engine/world'
import { calendarWeekFor } from '../src/composables/weekDays'
import { bandFor, weekGridFor } from '../src/composables/weekGrid'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { weekDayNumbers } from '../src/shared/dates'
import type { Snapshot } from '../src/shared/protocol'

const SEEDS = 12
const WEEKS = 156

let entered = 0
let total = 0
let emptyColumns = 0
const byKind = new Map<string, number>()

function bump(k: string) {
  byKind.set(k, (byKind.get(k) ?? 0) + 1)
}

for (let s = 0; s < SEEDS; s++) {
  const seed = `grid-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:bench`)
  for (let w = 0; w < WEEKS; w++) {
    const snap = toSnapshot(world) as Snapshot
    // Enter whatever is on offer, the way a playing parent does - otherwise the bench measures a
    // career that never travels, which is exactly the case the grid used to be best at.
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
    const kinds = new Set(week.days.map((d) => d.kind))
    bump(kinds.size === 1 ? [...kinds][0] : 'training mix')
    // ...and the property the boundary used to guarantee by refusing to draw: no column of any week
    // is ever blank. A silent empty column is what a badly added band or arc would look like.
    const grid = weekGridFor(week, fresh.ageYears, weekDayNumbers(week.week), fresh.seed)
    for (const day of grid) if (day.blocks.length === 0) emptyColumns++
    tickWeek(world, rng)
  }
}

console.log(`entries made: ${entered}`)
console.log(`careers=${SEEDS}  weeks each=${WEEKS}  weeks looked at=${total}  bands seen: ${bandFor(14)}`)
console.log(`\nTHE GRID DRAWS ON 100% OF WEEKS. What it draws:\n`)
for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${k}`)
}
console.log(`\nempty columns anywhere in ${total * 7} days drawn: ${emptyColumns}`)
