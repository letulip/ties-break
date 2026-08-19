// DOES THE CARD'S TABLE EVER DIFFER FROM THE LATCHED ONE – the walk `tests/season-mirror.test.ts`
// cites and has been re-aimed by six times.
//
//     npx vite-node tools/mirror-probe.ts [--seeds golden-v45,other,...] [--wraps 49,101,153,...]
//
// ⚠⚠ THIS FILE EXISTS BECAUSE THE TEST NAMED IT AND IT WAS NOT THERE. `season-mirror.test.ts` cites
// `tools/mirror-probe.ts` twice (once as `tools/_mirrorprobe.ts`) as the measurement behind five of
// its six re-aims. Neither path was ever in the tree – a false source citation of exactly the class
// the August review calls TB-10, sitting inside the file whose own discipline is "prove it before
// you re-aim it". Written 19.08 rather than deleting the citation, because the walk is genuinely
// needed every time the engine moves and somebody has clearly been doing it by hand each time.
//
// WHAT IT ANSWERS. The test asserts that a season wrap judges entries against the table THE CARD
// NAMES (`lastSeasonSummary.rankTrack` – where she played and finished ranked) and not against
// `activeLadderOf` (the latch, which can already have reached a higher storey). Its red says:
// "no wrap on this seed separates the card's table from the latched one – the distinction this file
// exists for may be gone", and its own instruction for that red is:
//
//     "Do not answer that red by widening the search; answer it by asking whether `rankTrack` still
//      means anything separate from `activeLadderOf`."
//
// So this walks EVERY wrap of SEVERAL careers and reports where the two diverge. One seed going
// quiet is a fixture that drifted; every seed going quiet is a finding about the engine.
//
// ⚠ MEASUREMENT ONLY – it drives the engine exactly as the test's own `walkNear` does (same profile,
// same funds, same plan, same entry loop, same skip/close), so a divergence it reports is one the
// test would find. It changes no constant.
import { createWorld, enterEvent, tickWeek, skipTournament, closeTournament, activeLadderOf, type WorldState } from '../src/engine/world'
import { planFromWeek } from '../src/engine/plan'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS, TIER_LADDER } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const args = process.argv.slice(2)
const listOf = (name: string, fallback: string): string[] => {
  const i = args.indexOf(`--${name}`)
  return (i >= 0 && args[i + 1] ? args[i + 1] : fallback).split(',')
}
const SEEDS = listOf('seeds', 'golden-v45,mirror-b,mirror-c,mirror-d,mirror-e')
const WRAPS = listOf('wraps', '49,101,153,205,257,309,361').map(Number)

/** The test's own `walkNear`, verbatim in behaviour – if these two ever part, this tool is lying. */
function walkNear(weeks: number, seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.fundsCents = 500_000_00
  world.plan = planFromWeek([['general', 'general'], ['general', 'general'], ['general'], [], [], [], []])
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < weeks; w++) {
    const byRung = [...world.season].sort(
      (a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
    )
    for (const e of byRung) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      try {
        enterEvent(world, e.id)
      } catch {
        /* gated */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

console.log(`\nSEASON MIRROR – card's table vs the latch, ${SEEDS.length} seeds x ${WRAPS.length} wraps`)
console.log(`(wrap offset is ${WEEKS_PER_YEAR - OFF_SEASON_WEEKS}; '=' agrees with itself, '≠' is a divergence)\n`)

let diverging = 0
let measured = 0
for (const seed of SEEDS) {
  const cells: string[] = []
  for (const week of WRAPS) {
    const w = walkNear(week, seed)
    const card = w.lastSeasonSummary?.rankTrack
    if (!card) {
      cells.push(`w${week}:—`)
      continue
    }
    const active = activeLadderOf(w)
    measured += 1
    if (card !== active) {
      diverging += 1
      cells.push(`w${week}: ≠ ${card}/${active}`)
    } else {
      cells.push(`w${week}: = ${card}`)
    }
  }
  console.log(`  ${seed.padEnd(12)} ${cells.join('   ')}`)
}

console.log(`\n  wraps measured: ${measured}   DIVERGING: ${diverging}`)
if (diverging === 0) {
  console.log(
    `\n  ⚠⚠ NOT ONE WRAP DIVERGES ON ANY SEED. That is the finding the test warns about, not a fixture\n` +
      `  to repoint: it says \`rankTrack\` may no longer mean anything separate from \`activeLadderOf\`.\n` +
      `  It belongs in a spec and in front of the owner, NOT in a widened search list.`,
  )
} else {
  console.log(
    `\n  ⭐ THE DISTINCTION IS ALIVE – ${diverging} of ${measured} wraps separate the two tables. A seed whose\n` +
      `  own wraps all agree is a FIXTURE that drifted; re-point the test at a seed that still diverges,\n` +
      `  and do not touch an assertion to do it.`,
  )
}
