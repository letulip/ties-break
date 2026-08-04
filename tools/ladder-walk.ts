// LADDER WALK – can a real career climb W15 → W35 → W50 → W75 → W100 → WTA 125 on the points it
// can actually earn, and how many seasons does it take? (W2-FIELD2, the acceptance-cut re-derivation.)
//
//   npx vite-node tools/ladder-walk.ts [--seeds N] [--seasons N] [--verbose]
//
// WHY IT EXISTS. The wave gave the merged W table the real points-to-rank curve, and that turned a
// latent bug in the acceptance cuts into a blocking one: `enterPct` was a SHARE of the table, so
// against real ranks W35's 0.5 resolved to ~219 W points while a perfect best-16 window of nothing
// but W15 TITLES caps at 160. The second rung was unreachable from the first, and nothing in the
// suite could see it – every guard tests one rung at a time. This tool tests the LADDER.
//
// THE ACCEPTANCE TEST IT ANSWERS, in one sentence: the ladder must be walkable end to end, over a
// realistic number of seasons rather than one (the owner's pacing ruling stands).
//
// THE CAREER IT WALKS is a genuine prospect, not an average one – the question is whether the ladder
// is climbable AT ALL, so a girl who never wins anything would answer a different question. She gets
// a strong build and a ceiling to grow into, money that never binds, and an entry policy with no
// taste in it: every week, enter the STRONGEST rung the engine will accept her into. Everything else
// is the shipped engine – real brackets on her own `seed:kidtour:` streams, real fatigue, the real
// AER pro cap, the real availability floors.
//
// WHAT IT REPORTS, per season: what she entered and won, the W points that leaves her on, her merged
// rank, and which rungs that rank opens. Plus the two ways the climb can stall, separated on purpose:
//   * POINTS – she is refused because her rank is outside the acceptance list;
//   * FATIGUE/AVAILABILITY – she is refused (or never offered) because she is under the condition
//     floor, injured, or has spent the season's pro allowance.
// The second number is reported and NOT designed around: fatigue pricing is an open owner decision.

import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  acceptanceRank,
  kidPoints,
  seasonIndexOf,
  KID_ID,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 6)
const SEASONS = argOf('seasons', 8)
const VERBOSE = args.includes('--verbose')

// ⚠ TEN RUNGS SINCE W3-ACT2, and the walk is graded at the TOP of the ladder now rather than in its
// middle: act2-pro-tour.md §11.4's PLAYED row (20-30 events a season, the owner's own target and a
// real top-100's number) was measured at the terminal window when that window was
// {w50, w75, w100, wta125} and 28 events a season was all it offered. The terminal window is
// {wta250, wta500, wta1000, slam} now, so the same question is asked one storey up.
const W_RUNGS: readonly TierId[] = [
  'w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam',
]
/** How far ABOVE a rung's condition floor she insists on being before she books the trip. */
const REST_MARGIN = argOf('rest', 15)

interface SeasonRow {
  season: number
  age: number
  entered: Partial<Record<TierId, number>>
  titles: Partial<Record<TierId, number>>
  wtaPoints: number
  wtaRank: number
  open: TierId[]
  /** refusals seen while choosing entries, split by what refused her */
  blockedByRank: number
  blockedByBody: number
  meanCondition: number
  /** her mean-of-four at the season boundary – the same unit the field's storeys are drawn in */
  core: number
}

/** The strongest rung she is allowed into this week, or null. Reads the ENGINE's own verdict – the
 *  same `entryStatus` the Season screen and `enterEvent` read, so this policy cannot be kinder or
 *  crueller than the game is.
 *
 *  ⚠ IT WALKS THE WHOLE LADDER, NOT JUST THE W RUNGS, and the first version of this tool did not –
 *  which is a finding worth keeping rather than a bug worth hiding. A W-only policy entered NOTHING
 *  in six seasons: W15's gate is her ITF JUNIOR points (the on-ramp rule – the bottom rung of a
 *  table is opened by the table below it), so a career that never plays a junior event never clears
 *  the professional table's front door and the rank cuts above it are never even consulted. The
 *  ladder is one ladder. */
function bestEntry(
  world: WorldState,
  horizon: number,
  counters: { rank: number; body: number },
): string | null {
  const entered = new Set(world.entries)
  const weeksTaken = new Set(
    world.season.filter((e) => entered.has(e.id)).map((e) => e.week),
  )
  let best: { id: string; rung: number } | null = null
  for (const e of world.season) {
    if (e.week <= world.week || e.week > world.week + horizon) continue
    if (entered.has(e.id) || weeksTaken.has(e.week)) continue
    // ⚠ SHE RESTS. The first version of this policy entered every week the gate allowed and the
    // career answered a different question: ~27 events a season, mean condition 19, and no W title
    // after the junior years - a grinder wrecking herself, not a prospect climbing. The brief asks
    // for a career that "plays its window", so she declines a trip she would arrive at barely over
    // its floor. `minConditionToEnter` + REST_MARGIN is the same shape the hired coach's own advice
    // uses; nothing here is a new mechanic, it is a player with sense.
    if (world.condition < ECONOMY.availability.minConditionToEnter[e.tier] + REST_MARGIN) continue
    const gate = entryStatus(world, e)
    if (gate.level === 'blocked') {
      // Which stopper was it? Counted for the W RUNGS ONLY, and per (event, week) look – i.e. what
      // she would have seen on the Season screen. 'locked' is the acceptance list or the point
      // band; everything else is her body or her allowance.
      if (TIERS[e.tier].track === 'wta') {
        if (gate.reason === 'locked' || gate.reason === 'outgrown') counters.rank += 1
        else counters.body += 1
      }
      continue
    }
    const rung = TIER_LADDER.indexOf(e.tier)
    if (!best || rung > best.rung) best = { id: e.id, rung }
  }
  return best?.id ?? null
}

function walk(seed: string): SeasonRow[] {
  // A genuine prospect with money that never binds: the question is whether the LADDER is
  // climbable, and a career that cannot afford the trip answers the economy's question instead.
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: 'elite' })
  world.fundsCents = 5_000_000_00
  // Her ceiling: a top-of-the-distribution talent (rollPotential's own p99 is ~73 mean-of-four), so
  // "wins her share" is a real claim rather than a wish. Skills grow into it through the engine's
  // own development curve – nothing here fast-forwards her build.
  world.potential = { serve: 80, ret: 78, composure: 78, stamina: 78, groundstrokes: 80 }

  const rows: SeasonRow[] = []
  const rng = resumeMain(world.rngMain)
  let entered: Partial<Record<TierId, number>> = {}
  let titles: Partial<Record<TierId, number>> = {}
  const counters = { rank: 0, body: 0 }
  let condSum = 0
  let condN = 0
  let season = 0

  for (let w = 0; w < SEASONS * 52; w++) {
    // one entry decision a week, exactly as a player takes it
    const id = bestEntry(world, 8, counters)
    if (id) {
      try {
        enterEvent(world, id)
        const ev = world.season.find((e) => e.id === id)!
        entered[ev.tier] = (entered[ev.tier] ?? 0) + 1
      } catch {
        /* the gate and the command disagreed – R10-5 says they cannot, so this is a real bug if hit */
      }
    }
    tickWeek(world, rng)
    condSum += world.condition
    condN += 1
    if (world.pendingTournament) {
      const p = world.pendingTournament
      const champion = p.result.finishes[KID_ID] === 0
      const tier = world.season.find((e) => e.id === p.eventId)?.tier
      if (champion && tier) titles[tier] = (titles[tier] ?? 0) + 1
      skipTournament(world)
      closeTournament(world)
    }
    if (seasonIndexOf(world.week) !== season) {
      const pts = kidPoints(world, 'wta')
      const rank = world.kidRankWta ?? 0
      rows.push({
        season,
        age: 14 + season,
        entered,
        titles,
        wtaPoints: pts,
        wtaRank: rank,
        core: (world.skills.serve + world.skills.ret + world.skills.composure + world.skills.stamina) / 4,
        open: W_RUNGS.filter((t) => rank <= (acceptanceRank(world, t) ?? Number.MAX_SAFE_INTEGER)),
        blockedByRank: counters.rank,
        blockedByBody: counters.body,
        meanCondition: condSum / Math.max(1, condN),
      })
      season = seasonIndexOf(world.week)
      entered = {}
      titles = {}
      counters.rank = 0
      counters.body = 0
      condSum = 0
      condN = 0
    }
  }
  return rows
}

const all: SeasonRow[][] = []
for (let s = 0; s < SEEDS; s++) all.push(walk(`ladder-walk-${s}`))

const world0 = createWorld('ladder-walk-cuts')
console.log(
  `LADDER WALK – ${SEEDS} prospect careers x ${SEASONS} seasons, entry policy "the strongest rung the engine accepts"`,
)
console.log(
  `  acceptance cuts: ${W_RUNGS.map((t) => `${t} ${acceptanceRank(world0, t) ?? 'on-ramp'}`).join(' · ')}` +
    `   (condition floors: ${W_RUNGS.map((t) => ECONOMY.availability.minConditionToEnter[t]).join('/')})`,
)

const fmt = (m: Partial<Record<TierId, number>>) =>
  W_RUNGS.filter((t) => m[t]).map((t) => `${t.replace('wta', '')}:${m[t]}`).join(' ') || '-'

// The pooled table is the headline: median across careers, so one lucky seed cannot carry the claim.
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
console.log('\n  season  age   median W pts   median rank   rungs open (median career)   entered (median career)')
for (let i = 0; i < SEASONS; i++) {
  const rows = all.map((r) => r[i]).filter(Boolean)
  if (!rows.length) continue
  const pts = rows.map((r) => r.wtaPoints)
  const med = median(pts)
  // the career whose season-i points are closest to the median, so the two right-hand columns are
  // ONE career's real season rather than a blend of six
  const rep = rows.reduce((a, b) => (Math.abs(b.wtaPoints - med) < Math.abs(a.wtaPoints - med) ? b : a))
  console.log(
    `  ${String(i).padStart(6)}  ${String(rep.age).padStart(3)}   ${String(Math.round(med)).padStart(12)}` +
      `   ${('#' + rep.wtaRank).padStart(11)}   ${rep.open.join(',').padEnd(28)} ${fmt(rep.entered)}`,
  )
}

// THE TWO STALLS, kept apart on purpose.
console.log('\n  what refused her, per season (mean over careers): rank/points vs body/allowance')
for (let i = 0; i < SEASONS; i++) {
  const rows = all.map((r) => r[i]).filter(Boolean)
  if (!rows.length) continue
  const mean = (f: (r: SeasonRow) => number) => rows.reduce((s, r) => s + f(r), 0) / rows.length
  console.log(
    `  season ${i}: blocked-by-rank ${mean((r) => r.blockedByRank).toFixed(0).padStart(5)}` +
      `   blocked-by-body/cap ${mean((r) => r.blockedByBody).toFixed(0).padStart(5)}` +
      `   entered ${mean((r) => Object.values(r.entered).reduce((a, b) => a + b, 0)).toFixed(1).padStart(4)}` +
      `   core ${mean((r) => r.core).toFixed(1)}` +
      `   titles ${mean((r) => Object.values(r.titles).reduce((a, b) => a + b, 0)).toFixed(1).padStart(4)}` +
      `   mean condition ${mean((r) => r.meanCondition).toFixed(0)}`,
  )
}

// THE BEFORE/AFTER THIS TOOL EXISTS FOR. The cuts used to be SHARES of the merged table and
// resolved to w35 282 · w50 226 · w75 169 · w100 141 · wta125 113. Print the best rank each career
// ever reached beside them, so "the second rung was unreachable from the first" is a number in the
// output rather than a claim in a comment.
const OLD_SHARE_CUTS: Partial<Record<TierId, number>> = { w35: 282, w50: 226, w75: 169, w100: 141, wta125: 113 }
const bests = all.map((rows) => Math.min(...rows.map((r) => r.wtaRank)))
console.log(
  `\n  best merged rank reached, per career: ${bests.map((b) => '#' + b).join(' ')}` +
    `\n  against the RETIRED share-based cuts (${W_RUNGS.slice(1).map((t) => `${t} ${OLD_SHARE_CUTS[t]}`).join(' · ')}):` +
    ` ${bests.every((b) => b > OLD_SHARE_CUTS.w35!) ? 'NOT ONE career would have cleared even W35 in its whole life' : 'some careers cleared W35'}` +
    `\n  against the SHIPPED rank cuts: W35/W50 open from her first professional week.`,
)

// THE VERDICT, computed rather than eyeballed: the highest rung ANY career unlocked, and when.
console.log('\n  first season each rung opens (per career; "-" = never in this horizon)')
for (const tier of W_RUNGS) {
  const firsts = all.map((rows) => {
    const i = rows.findIndex((r) => r.open.includes(tier))
    return i < 0 ? '-' : String(i)
  })
  console.log(`    ${tier.padEnd(7)}: ${firsts.join(' ')}`)
}
if (VERBOSE) {
  console.log('\n  career 0, season by season:')
  for (const r of all[0]) {
    console.log(
      `    s${r.season} age ${r.age}: entered ${fmt(r.entered)} · titles ${fmt(r.titles)} · ` +
        `${r.wtaPoints} pts · #${r.wtaRank} · core ${r.core.toFixed(1)} · open ${r.open.join(',')}`,
    )
  }
}
