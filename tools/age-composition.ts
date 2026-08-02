/**
 * AGE COMPOSITION + FIELD LOAD – the measurement §4.1 of docs/specs/adult-tour-and-endings.md is
 * actually about: is a J-tier field juniors, and is a W-tier field adults?
 *
 * MEASUREMENT ONLY. It changes nothing and it perturbs nothing: every entrant replay builds its
 * OWN `rngFromSeed(seed:aitour:<event.id>)`, exactly as `runAiTournament` does, so watching a
 * career cannot alter it. Same replay technique as tools/rival-fatigue-audit.ts, which documents
 * why the three inputs are reproducible from the world BEFORE the tick.
 *
 * WHAT IT REPORTS, pooled over seeds:
 *   1. AGE DISTRIBUTION PER TIER of the selected fields – mean age, min/max, and the share of the
 *      draw aged 19+ (the juniors' overflow) and aged <16 (the adults' underflow). This is the
 *      composition check: before the cap a J300 draw and a W15 draw are the same people.
 *   2. FIELD LOAD – events per rival per season, the share of the cohort that NEVER plays, and the
 *      cohort's median derived condition. The three numbers §4.1 asks for before and after.
 *
 * Run:  npx vite-node tools/age-composition.ts
 *       npx vite-node tools/age-composition.ts -- --weeks 104 --seeds 8
 */

import { createWorld, tickWeek, skipTournament, closeTournament, KID_ID } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { computeRanking } from '../src/engine/season/ranking'
import { rivalConditions } from '../src/engine/season/rival'
import { selectEntrants, isEntrantBand } from '../src/engine/season/tournament'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'

const argv = process.argv.slice(2)
const flag = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : fallback
}
const WEEKS = flag('weeks', 104)
const SEEDS = flag('seeds', 8)

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const median = (xs: number[]): number => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

interface TierStat {
  ages: number[]
  over18: number
  under16: number
  draws: number
  /** entrants selected from OUTSIDE the tier's own percentile window, i.e. the backfill fired.
   *  ⚠ THE NUMBER THE AGE CAP PUTS AT RISK, and the reason it is measured rather than assumed.
   *  `selectEntrants` reaches outside the band whenever the band cannot fill the draw, and the cap
   *  intersects every J band with "eighteen or under" - so a prestige rung whose window is the top
   *  quarter of a table whose top skews OLD can quietly become a draw of whoever is young enough.
   *  tests/ladder.test.ts L6 asserts this share is zero on a fresh cohort. */
  outOfBand: number
}

const perTier = new Map<TierId, TierStat>()
for (const t of TIER_LADDER) perTier.set(t, { ages: [], over18: 0, under16: 0, draws: 0, outOfBand: 0 })

const medians: number[] = []
const eventsPerRival: number[] = []
const neverPlayedShare: number[] = []

for (let s = 0; s < SEEDS; s++) {
  const world = createWorld(`agecomp-${s}`)
  const rng = rngFromSeed(world.seed)
  const ids = world.cohort.map((p) => p.id)
  const ageOf = new Map(world.cohort.map((p) => [p.id, p.ageYears]))
  const appearances = new Map<string, number>()

  for (let i = 0; i < WEEKS; i++) {
    const w = world.week + 1
    // The engine derives `aiRanking` at the top of the tick, before any of the week's own rows are
    // appended – so deriving it here, before the tick, is byte-identical to the engine's own.
    const aiRanking = computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      w,
      6, // the mixed AI-selection ambience keeps the junior window - see world.ts aiRanking
      ids,
    )
    for (const e of world.season) {
      if (e.week !== w) continue
      const aiRng = rngFromSeed(`${world.seed}:aitour:${e.id}`)
      const stat = perTier.get(e.tier)!
      stat.draws++
      const posOf = new Map<string, number>()
      aiRanking.forEach((r, idx) => posOf.set(r.playerId, idx))
      for (const p of selectEntrants(e, world.cohort, aiRanking, aiRng, rivalConditions(world.results, w))) {
        // ages advance at the season boundary, so read the LIVE row rather than the opening snapshot
        stat.ages.push(p.ageYears)
        if (p.ageYears > 18) stat.over18++
        if (p.ageYears < 16) stat.under16++
        const pct = ((posOf.get(p.id) ?? aiRanking.length - 1) + 1) / aiRanking.length
        if (!isEntrantBand(e.tier, pct)) stat.outOfBand++
        appearances.set(p.id, (appearances.get(p.id) ?? 0) + 1)
      }
    }
    const conds = rivalConditions(world.results, w)
    medians.push(median(world.cohort.map((p) => conds.get(p.id) ?? ECONOMY.condition.max)))

    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  void ageOf
  const seasons = WEEKS / 52
  eventsPerRival.push(mean(ids.map((id) => (appearances.get(id) ?? 0) / seasons)))
  neverPlayedShare.push(ids.filter((id) => !appearances.has(id)).length / ids.length)
}

console.log(`\nAGE COMPOSITION – ${SEEDS} seeds x ${WEEKS} weeks (${WEEKS / 52} seasons)\n`)
console.log('tier    draws   entrants   meanAge   min   max   share 19+   share <16   outOfBand')
for (const t of TIER_LADDER) {
  const st = perTier.get(t)!
  if (!st.ages.length) {
    console.log(`${t.padEnd(7)} ${String(st.draws).padStart(5)}          0        –     –     –           –           –           –`)
    continue
  }
  const n = st.ages.length
  console.log(
    `${t.padEnd(7)} ${String(st.draws).padStart(5)} ${String(n).padStart(10)} ` +
      `${mean(st.ages).toFixed(2).padStart(9)} ${String(Math.min(...st.ages)).padStart(5)} ` +
      `${String(Math.max(...st.ages)).padStart(5)} ${((100 * st.over18) / n).toFixed(1).padStart(10)}% ` +
      `${((100 * st.under16) / n).toFixed(1).padStart(10)}% ` +
      `${((100 * st.outOfBand) / n).toFixed(1).padStart(10)}%`,
  )
}

console.log(`\nFIELD LOAD (the three numbers §4.1 asks for)`)
console.log(`  median cohort condition   ${median(medians).toFixed(1)}  (min over weeks ${Math.min(...medians)})`)
console.log(`  events per rival / season ${mean(eventsPerRival).toFixed(2)}`)
console.log(`  share of rivals never playing ${(100 * mean(neverPlayedShare)).toFixed(1)}%`)
