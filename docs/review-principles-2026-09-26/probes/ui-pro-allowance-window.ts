// Lane E (26.09 review) – what the Season header's "Pro entries this season: N of M" counts.
//
// The header (src/components/screens/SeasonScreen.vue:782-786, title at :1386) says the number is
// "this season" and that "a fresh allowance arrives when the season turns". The engine's number is
// `proEntryCapUsage(world, world.week)` (snapshot.ts:2127), which counts `proEntryWeeks` whose
// `kidAgeAt` equals her age now – a birthday-to-birthday window (entryCaps.ts:285-296).
//
// This probe reads the committed golden saves (real careers, migrated to the current schema), and for
// every one where the header would render (limit < MAX_SAFE_INTEGER) prints: the snapshot's used/limit,
// the entries inside the current SEASON, and the entries inside the current AGE-YEAR. Then it reads the
// engine's own allowance for each of the next 60 weeks and reports where the count resets. Read-only: it imports engine code and writes nothing.
//
// Run from the repo root of a checkout at 03d92221:
//   npx vite-node docs/review-principles-2026-09-26/probes/ui-pro-allowance-window.ts
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateSave } from '../../../src/engine/migrations'
import {
  toSnapshot,
  seasonStartWeek,
  kidAgeAt,
  proEntryCapUsage,
  type WorldState,
} from '../../../src/engine/world'

const dir = resolve(process.cwd(), 'tests/fixtures/saves')
const files = readdirSync(dir).filter((f) => /^v\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
let shown = 0
for (const f of files) {
  let world: WorldState
  try {
    world = migrateSave(JSON.parse(readFileSync(resolve(dir, f), 'utf8'))) as WorldState
  } catch {
    continue
  }
  const snap = toSnapshot(world)
  const cap = snap.proEntryCap
  if (!cap || cap.limit >= Number.MAX_SAFE_INTEGER) continue
  const week = world.week
  const season0 = seasonStartWeek(week)
  const age = kidAgeAt(world, week)
  const weeks = world.proEntryWeeks ?? []
  const inSeason = weeks.filter((w) => w >= season0 && w <= week).length
  const inAgeYear = weeks.filter((w) => kidAgeAt(world, w) === age).length
  shown++
  console.log(
    `${f}: week ${week}, age ${age}, header "Pro entries this season: ${cap.used} of ${cap.limit}"` +
      ` | entries this SEASON (from w${season0}) = ${inSeason} | entries this AGE-YEAR = ${inAgeYear}`,
  )
  // Project forward WITHOUT ticking: `proEntryCapUsage(world, w)` is the engine's own answer for the
  // allowance in force at week w given the entries booked so far, so reading it week by week shows
  // where the displayed count falls – at the season turn, or at the birthday.
  const events: string[] = []
  let prevUsed = cap.used
  let prevAge = age
  let prevSeason = season0
  for (let w = week + 1; w <= week + 60; w++) {
    const a = kidAgeAt(world, w)
    const ss = seasonStartWeek(w)
    const used = proEntryCapUsage(world, w).used
    if (ss !== prevSeason) events.push(`w${w}: SEASON turns – allowance used ${prevUsed} -> ${used}`)
    if (a !== prevAge) events.push(`w${w}: BIRTHDAY (${prevAge} -> ${a}) – allowance used ${prevUsed} -> ${used}`)
    prevUsed = used
    prevAge = a
    prevSeason = ss
  }
  for (const e of events) console.log(`   ${e}`)
}
console.log(`fixtures where the header renders: ${shown} of ${files.length}`)
