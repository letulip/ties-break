// ⭐⭐ A PROPORTIONAL LADDER OF EXCLUSION – the owner's own model for who plays a 250, swept before
// anything is proposed.
//
// **Verbatim (17.08):** «в моем понимании на 250й серии верхушки (топ 100) особо быть не должно, т.к.
// они все заняты на 1000+ и еще несколько 500 в год, и на 500, соответственно, должно быть тоже
// возможно выжить… Причем пропорционально.»
//
// So he wants the two heads to move AS A PAIR – the higher the rung, the smaller the slice of the top
// that is absent from it – rather than one door on one rung. Today only `wta250` carries a head
// (`acceptsFromRank: 64`, round 21 #4) and everything above it carries none.
//
// ⚠⚠ WHAT THE REAL MECHANISM IS, AND A DOOR IS NOT IT. In the sport the top are absent from a 250
// because they are PLAYING SOMETHING ELSE that week – it is CALENDAR OCCUPANCY, not an entry rule.
// We already ship that idea for HER (`MANDATORY_SLOTS`: four Slams and seven WTA 1000s bind her
// counting book), but the field professionals have no schedule at all: `fieldProsFor` derives a
// population, never a season, so there is nothing to be busy with. **A rank door is the proxy we can
// afford, and this tool measures the proxy rather than pretending it is the mechanism.** The honest
// version is a field-side calendar, which is its own wave.
//
//     npx vite-node tools/head-ladder-sweep.ts [--seeds 4] [--weeks 520] [--runs 200]
//
// WHAT IT PRINTS, per rung and per candidate ladder:
//   * the field's mean core strength,
//   * the share of the draw STRONGER than the reference build (his «86 ракетка с хорошими статами»),
//   * P(past R1) and P(QF+) for that one FIXED build, replayed into the real field.
// The shipped state (250 head 64, everything above open) is one of the rows, so the table says what
// today already buys before it says what a change would.
//
// ⚠ MEASUREMENT ONLY. It patches `TierDef.acceptsFromRank` IN MEMORY and restores it – the same A/B
// idiom `tools/big-rung-odds.ts --head-sweep` uses – and touches nothing under `src/`. No constant is
// proposed here: the owner picks the row.
//
// ⚠ THE BUILD IS FIXED ACROSS EVERY ROW AND THAT IS THE WHOLE POINT. If the player moved with the
// setting, a rung getting "easier" could just be a weaker entrant, which is the confound
// `tools/slam-difficulty.ts` was written to settle for the wild cards.

import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'
import type { MatchPlayer } from '../src/engine/match/types'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { universeForTier, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { buildDraw, kidSeedIndexIn, runTournament, selectEntrants } from '../src/engine/season/tournament'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { cohortIds, fieldProsOf, inTrack, rankingFor } from '../src/engine/world/ladder'
import { KID_ID } from '../src/engine/world/constants'
import { createWorld, tickWeek } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = numOf('seeds', 4)
const WEEKS = numOf('weeks', 520)
const RUNS = numOf('runs', 200)

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const core4 = (s: { serve: number; ret: number; composure: number; stamina: number }) =>
  (s.serve + s.ret + s.composure + s.stamina) / 4
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/** The rungs the ladder is about, plus the two either side so the SHAPE is visible – his acceptance
 *  test is that the win rates fall smoothly from the 125 up to the Slam rather than dipping. */
const RUNGS: TierId[] = ['wta125', 'wta250', 'wta500', 'wta1000', 'slam']

/** ⭐ THE CANDIDATE LADDERS. «Пропорционально» means the two move together, so a row is a PAIR, and
 *  the pair is always monotone – a 500's head can never sit above a 250's, or the smaller event would
 *  be admitting people the bigger one refuses, which is the exact inversion round 21 #4 fixed one
 *  rung down (`wta125` 180 → 210 against `wta250`'s 200).
 *
 *  ⚠ `null` IS "NO HEAD", NOT ZERO – `acceptsFromRank` is `number | undefined` and the OFF arm has to
 *  clear it rather than set it to a falsy number, or the rung reads "the top 0 are elsewhere" and the
 *  filter silently admits everybody while claiming to be on. */
const LADDERS: Array<{ label: string; wta250: number | null; wta500: number | null }> = [
  { label: 'pre-round-21 (both open)', wta250: null, wta500: null },
  { label: 'SHIPPED TODAY (250 only)', wta250: 64, wta500: null },
  { label: '250 #64 · 500 #24', wta250: 64, wta500: 24 },
  { label: '250 #64 · 500 #32', wta250: 64, wta500: 32 },
  { label: '250 #80 · 500 #32', wta250: 80, wta500: 32 },
  { label: '250 #100 · 500 #40', wta250: 100, wta500: 40 },
  { label: '250 #100 · 500 #50', wta250: 100, wta500: 50 },
  { label: '250 #128 · 500 #64', wta250: 128, wta500: 64 },
]

/** One world, ticked, so the merged table and the professional population are the real ones. */
function ticked(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < WEEKS; w++) {
    tickWeek(world, rng)
    if (world.pendingTournament) world.pendingTournament = null
  }
  return world
}

/** ⭐ HIS REFERENCE PLAYER – «мы говорим о 86 ракетке с хорошими статами». Rather than invent a build,
 *  this READS the professional actually standing at #86 in this world and replays HER. So "a #86 with
 *  good stats" is the population's own #86, not a number somebody chose, and it moves with the world
 *  instead of drifting away from it. */
function referenceAt(world: WorldState, rank: number): { player: AiPlayer; rank: number } | null {
  const table = rankingFor(world, 'wta')
  const row = table.find((r) => r.rank >= rank)
  if (!row) return null
  const pool = universeForTier('wta250', world.cohort, fieldProsOf(world))
  const who = pool.find((p) => p.id === row.playerId)
  return who ? { player: who, rank: row.rank } : null
}

interface Cell {
  fieldCore: number[]
  stronger: number[]
  pastR1: number
  qfPlus: number
  n: number
}

function measure(world: WorldState, tier: TierId, who: AiPlayer, tag: string): Cell {
  const pros = fieldProsOf(world)
  const selRanking: RankingRow[] = mergedWtaRanking(
    computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.wta,
      cohortIds(world),
      inTrack('wta'),
    ),
    pros,
  )
  const seedRanking = rankingFor(world, 'wta')
  const cell: Cell = { fieldCore: [], stronger: [], pastR1: 0, qfPlus: 0, n: 0 }
  const rounds = Math.log2(TIERS[tier].drawSize)
  for (let i = 0; i < RUNS; i++) {
    const ev: SeasonEvent = {
      id: `head-${tier}-${i}`,
      week: world.week,
      // The surface is swept rather than picked, so no single court favours or punishes the build.
      surface: (['hard', 'clay', 'grass'] as const)[i % 3],
      tier,
      travelCostCents: 0,
      deadlineWeek: world.week,
    }
    const universe = universeForTier(tier, world.cohort, pros)
    // ⚠ THE REFERENCE PLAYER IS REMOVED FROM THE UNIVERSE SHE IS SPLICED INTO, or she can be drawn
    // as an entrant AND spliced as the protagonist – the same player twice in one draw, which
    // `runTournament` would then resolve against herself.
    const entrants = selectEntrants(
      ev,
      universe.filter((p) => p.id !== who.id),
      selRanking,
      rngFromSeed(`headsweep:${tier}:${tag}:sel:${i}`),
    )
    const fresh = new Map<string, number>()
    const field: MatchPlayer[] = entrants.map((x) =>
      rivalMatchPlayer(x, ev.surface, fresh.get(x.id) ?? ECONOMY.condition.max),
    )
    const me = rivalMatchPlayer(who, ev.surface, ECONOMY.condition.max)
    const idx = kidSeedIndexIn(field, seedRanking, who.id)
    const res = runTournament(ev, field, me, world.seed, rngFromSeed(`headsweep:${tier}:${tag}:run:${i}`), idx)
    const f = res.finishes[me.id]
    if (f === undefined) continue
    cell.n++
    if (f < rounds) cell.pastR1++
    if (f <= 3) cell.qfPlus++
    if (i < 40) {
      const drawn = buildDraw(ev, field, me, idx, rngFromSeed(`headsweep:${tier}:${tag}:draw:${i}`))
      const mine = core4(me)
      cell.fieldCore.push(mean(drawn.map(core4)))
      cell.stronger.push(drawn.filter((x) => core4(x) > mine).length / drawn.length)
    }
  }
  return cell
}

const worlds = Array.from({ length: SEEDS }, (_, i) => ticked(`headsweep-${i}`))

console.log('')
console.log(`HEAD LADDER SWEEP · ${SEEDS} worlds x ${WEEKS} weeks · ${RUNS} bracket replays per rung per ladder`)
console.log('  the reference build is the professional STANDING at #86 in each world – his «86 ракетка»,')
console.log('  read from the population rather than invented, and FIXED across every row of a column.')
console.log('  ⚠ a rank door is a PROXY for calendar occupancy, which is what really empties a 250. See the header.')
console.log('')

const refs = worlds.map((w) => referenceAt(w, 86))
refs.forEach((r, i) => {
  console.log(`  world ${i}: reference = #${r?.rank ?? '–'} core ${r ? core4(r.player).toFixed(1) : '–'}`)
})
console.log('')

const was: Partial<Record<TierId, number | undefined>> = {
  wta250: TIERS.wta250.acceptsFromRank,
  wta500: TIERS.wta500.acceptsFromRank,
}

try {
  for (const ladder of LADDERS) {
    TIERS.wta250.acceptsFromRank = ladder.wta250 ?? undefined
    TIERS.wta500.acceptsFromRank = ladder.wta500 ?? undefined
    console.log('-'.repeat(104))
    console.log(`${ladder.label}    (250 head ${ladder.wta250 ?? 'open'} · 500 head ${ladder.wta500 ?? 'open'})`)
    console.log('-'.repeat(104))
    console.log(`  ${padE('rung', 10)}${pad('field core', 12)}${pad('% stronger', 12)}${pad('P(past R1)', 12)}${pad('P(QF+)', 10)}`)
    for (const tier of RUNGS) {
      const cells = worlds.map((w, i) => (refs[i] ? measure(w, tier, refs[i]!.player, `w${i}-${ladder.label}`) : null))
      const live = cells.filter((c): c is Cell => c !== null && c.n > 0)
      if (!live.length) {
        console.log(`  ${padE(tier, 10)}${pad('–', 12)}`)
        continue
      }
      const fc = mean(live.flatMap((c) => c.fieldCore))
      const st = mean(live.flatMap((c) => c.stronger))
      const n = live.reduce((a, c) => a + c.n, 0)
      const past = live.reduce((a, c) => a + c.pastR1, 0)
      const qf = live.reduce((a, c) => a + c.qfPlus, 0)
      console.log(
        `  ${padE(tier, 10)}${pad(fc.toFixed(1), 12)}${pad(`${(100 * st).toFixed(0)}%`, 12)}` +
          `${pad(`${((100 * past) / n).toFixed(1)}%`, 12)}${pad(`${((100 * qf) / n).toFixed(1)}%`, 10)}`,
      )
    }
    console.log('')
  }
} finally {
  TIERS.wta250.acceptsFromRank = was.wta250
  TIERS.wta500.acceptsFromRank = was.wta500
}

console.log(`  ⚠ restored: wta250.acceptsFromRank = ${TIERS.wta250.acceptsFromRank}, wta500 = ${TIERS.wta500.acceptsFromRank}`)
console.log('')
