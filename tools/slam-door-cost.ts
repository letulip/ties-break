// THE SLAM DOOR AT #104 – what the twenty-four places we do not model actually cost a career.
//
//   npx vite-node tools/slam-door-cost.ts [--seeds N] [--seasons N] [--verbose]
//
// THE QUESTION (owner, round 21): «На #116 про позиции перестали пускать на Шлем, это нормально?
// У нас сетка 128 вроде.»
//
// THE ARITHMETIC IS EXACT AND IT IS THE RULEBOOK'S OWN, which is why this tool measures a COST and
// does not propose a fix. `docs/research/ranking-points-by-tier.md` §4-D: a 2026 Grand Slam main draw
// of 128 is **104 direct acceptances + 16 qualifiers + 8 wild cards**. `TIERS.slam.acceptsRank` is
// 104 and `TIERS.slam.drawSize` is 128, so the two numbers in his question are BOTH right and they
// are not the same number. What we do not model is the other 24 places: no qualifying event, no wild
// cards. So ranks #105-#128 – women who in the real sport have a route in – are simply refused.
//
// ⚠ THIS TOOL DOES NOT BUILD QUALIFYING AND MUST NOT BE READ AS A STEP TOWARDS IT. It answers one
// question with a number: how many careers arrive in that band, and how long do they sit in it. The
// design question it feeds is the one the owner already DEFERRED – see
// `docs/specs/the-acceptance-tail-2026-08.md`, whose §4 is the same shape of argument one rung up
// ("every rung of ours is a cliff") and whose ruling («пусть остануться жесткие отсечки») stands.
//
// ⚠ MEASUREMENT ONLY. Imports the engine read-only, patches no constant, ships no fixture, reads no
// save.
//
// THE ARM. The career profile is `tools/ladder-walk.ts`'s, deliberately and unchanged: wealthy family,
// elite coach, funds that never bind, potential at the p99 of `rollPotential`. That is the arm that
// asks "is the ladder climbable" rather than "can this family afford it", and it is the only arm in
// which a meaningful number of careers reach the band at all – a median career never gets near #128,
// so measuring the door on one would report a zero that means "nobody knocked", not "the door is
// cheap". Stated here so the n is read as what it is: the strong tail of the population.
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  kidPoints,
  KID_ID,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 12)
const SEASONS = argOf('seasons', 10)
const VERBOSE = args.includes('--verbose')
/** see `bestEntry` – the professional-calendar arm, on by default. `--ladder-walk-policy` restores
 *  the arm whose whole-ladder greed farms domestic titles, kept so the two can be printed together. */
const PRO_FIRST = !args.includes('--ladder-walk-policy')

/** THE BAND: the places a 128-draw holds that our direct-acceptance line refuses. Both ends read off
 *  the shipped tier definition rather than typed, so a move of either number re-aims this tool. */
const DIRECT = TIERS.slam.acceptsRank ?? 104
const DRAW = TIERS.slam.drawSize
const BAND_LO = DIRECT + 1
const BAND_HI = DRAW

const W_RUNGS: readonly TierId[] = [
  'w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam',
]
const REST_MARGIN = argOf('rest', 15)

/** ⚠⚠ THE POLICY IS THE WEAKEST AXIS IN THIS FILE AND THE FIRST RUN PROVED IT, WHICH IS WHY THERE
 *  ARE TWO ARMS. `tools/ladder-walk.ts`'s policy – "the strongest rung the engine accepts this week"
 *  – walked 14 careers x 12 seasons and put **not one of them inside #105-#128**; the best merged
 *  rank any of them reached was #199, and the per-career title census says why: the median career
 *  won **50-80 `local` titles**. A domestic event BURNS THE WEEK (`weeksTaken` below), so a policy
 *  that takes a Local Open because no W event happens to fall inside its eight-week horizon is
 *  actively spending the professional calendar on a table that pays into `domestic`. That is the
 *  same shape as the owner's own round-21 Q3 – winning at rungs that pay nothing – arriving here as
 *  an artefact of the INSTRUMENT rather than of the game.
 *
 *  ⚠ AND IT IS AN ALREADY-RECORDED DIVERGENCE, NOT A NEW FINDING. `docs/specs/real-vs-bench-2026-08.md`
 *  §3.1 measures the bench's default policy leaving $67,000-$120,000 of income unbooked against a
 *  human-played career on the same tree, and §1b names `wta250` as a rung the bench enters ~0 times.
 *  A bench that under-plays the professional calendar cannot answer a question about a professional
 *  acceptance line, so `--pro-first` is the arm this tool's §2 is read from.
 *
 *  `--pro-first` (default ON): once she holds a W ranking point, ONLY W-track events are considered.
 *  Before that the whole ladder is walked, because it has to be – W15's gate is her ITF JUNIOR book
 *  (the on-ramp rule), so a career that never plays a junior event never clears the professional
 *  table's front door at all. That is `ladder-walk.ts`'s own recorded finding and it is preserved. */
function bestEntry(world: WorldState, horizon: number): string | null {
  const entered = new Set(world.entries)
  const weeksTaken = new Set(world.season.filter((e) => entered.has(e.id)).map((e) => e.week))
  const professional = PRO_FIRST && kidPoints(world, 'wta') > 0
  let best: { id: string; rung: number } | null = null
  for (const e of world.season) {
    if (e.week <= world.week || e.week > world.week + horizon) continue
    if (entered.has(e.id) || weeksTaken.has(e.week)) continue
    if (professional && TIERS[e.tier].track !== 'wta') continue
    if (world.condition < ECONOMY.availability.minConditionToEnter[e.tier] + REST_MARGIN) continue
    if (entryStatus(world, e).level === 'blocked') continue
    const rung = TIER_LADDER.indexOf(e.tier)
    if (!best || rung > best.rung) best = { id: e.id, rung }
  }
  return best?.id ?? null
}

interface Career {
  seed: string
  /** her merged-W rank at the end of every week she held one, in week order */
  ranks: { week: number; rank: number }[]
  bestRank: number
  titles: Partial<Record<TierId, number>>
}

function walk(seed: string): Career {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: 'elite' })
  world.fundsCents = 5_000_000_00
  world.potential = { serve: 80, ret: 78, composure: 78, stamina: 78, groundstrokes: 80 }

  const rng = resumeMain(world.rngMain)
  const ranks: { week: number; rank: number }[] = []
  const titles: Partial<Record<TierId, number>> = {}
  let bestRank = Number.MAX_SAFE_INTEGER

  for (let w = 0; w < SEASONS * 52; w++) {
    const id = bestEntry(world, 8)
    if (id) {
      try {
        enterEvent(world, id)
      } catch {
        /* the gate and the command disagreed – R10-5 says they cannot */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      const p = world.pendingTournament
      const tier = world.season.find((e) => e.id === p.eventId)?.tier
      if (p.result.finishes[KID_ID] === 0 && tier) titles[tier] = (titles[tier] ?? 0) + 1
      skipTournament(world)
      closeTournament(world)
    }
    // ⚠ A RANK ONLY EXISTS ONCE SHE HOLDS A POINT. `world.kidRankWta` is a dense rank over a table
    // whose tail all ties on zero, so reading it before her first counting result reports the whole
    // zero-tie's shared place and not a standing. Same guard `kidLadderRank` carries.
    if (kidPoints(world, 'wta') > 0) {
      const r = world.kidRankWta ?? 0
      if (r > 0) {
        ranks.push({ week: world.week, rank: r })
        if (r < bestRank) bestRank = r
      }
    }
  }
  return { seed, ranks, bestRank: bestRank === Number.MAX_SAFE_INTEGER ? 0 : bestRank, titles }
}

const careers: Career[] = []
for (let s = 0; s < SEEDS; s++) careers.push(walk(`slam-door-${s}`))

// -------------------------------------------------------------------------------------------------
const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 100) => '-'.repeat(n)
const section = (t: string) => console.log(`\n${rule()}\n${t}\n${rule()}`)
const median = (xs: number[]) => {
  if (!xs.length) return 0
  const a = [...xs].sort((x, y) => x - y)
  const m = a.length >> 1
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

console.log(
  `SLAM DOOR COST – ${SEEDS} prospect careers x ${SEASONS} seasons (wealthy · elite coach · p99 potential)` +
    `\n  entry policy: ${PRO_FIRST ? 'PRO-FIRST (W-track only once she holds a W point)' : "ladder-walk's whole-ladder greed"}`,
)
console.log(
  `  the door: TIERS.slam.acceptsRank = ${DIRECT} direct acceptances into a drawSize ${DRAW}.` +
    `  THE BAND WE REFUSE = #${BAND_LO}-#${BAND_HI} (${BAND_HI - BAND_LO + 1} places).`,
)

// =================================================================================================
section(`1. WHAT THE BAND IS WORTH IN POINTS – the size of the step she has to take`)
// The merged table is a pure function of (seed, season), so this reads the world's own curve rather
// than a career's. Five worlds, the same season index the careers above end on.
{
  const rows: number[][] = []
  for (let s = 0; s < 5; s++) {
    const w = createWorld(`slam-door-curve-${s}`)
    const pros = fieldProsFor(w.seed, SEASONS, w.cohort.map((p) => p.name))
    const merged = mergedWtaRanking([], pros)
    const at = (r: number) => merged.find((x) => x.rank <= r && x.rank + 0 >= 0 && x.rank === r)?.points
      ?? merged.filter((x) => x.rank <= r).at(-1)?.points ?? 0
    rows.push([at(65), at(BAND_HI), at(DIRECT), at(120), at(200), at(300)])
  }
  const col = (i: number) => Math.round(median(rows.map((r) => r[i])))
  console.log(`\n  points held at each place of the merged W table (median of 5 worlds, season ${SEASONS}):`)
  console.log(`    #300 ${pad(col(5), 6)}   #200 ${pad(col(4), 6)}   #${BAND_HI} ${pad(col(1), 6)}` +
    `   #120 ${pad(col(3), 6)}   #${DIRECT} ${pad(col(2), 6)}   #65 ${pad(col(0), 6)}`)
  console.log(
    `\n  ⭐ crossing the door is worth ${pad(col(2) - col(1), 5)} points – #${BAND_HI} to #${DIRECT}.` +
      `  For scale, a WTA 250 title pays ${TIERS.wta250.points[0]} and a WTA 125 title ${TIERS.wta125.points[0]}.`,
  )
  console.log(`\n  WHAT ELSE THE BAND IS OUTSIDE OF – every W rung's own acceptance line:`)
  for (const t of W_RUNGS) {
    const a = TIERS[t].acceptsRank
    if (a === undefined) continue
    const inBandLo = BAND_LO <= a
    const inBandHi = BAND_HI <= a
    const verdict = inBandHi ? 'open to the whole band' : inBandLo ? `open only to #${BAND_LO}-#${a}` : 'SHUT to the whole band'
    console.log(`    ${TIERS[t].label.padEnd(18)} accepts top ${pad(a, 4)}   ${verdict}`)
  }
}

// =================================================================================================
section(`2. HOW MANY CAREERS ARRIVE IN #${BAND_LO}-#${BAND_HI}, AND FOR HOW LONG`)
{
  const inBand = (r: number) => r >= BAND_LO && r <= BAND_HI
  let everInBand = 0
  let crossed = 0
  let peakedInBand = 0
  const dwell: number[] = []
  const waits: number[] = []
  const bests: number[] = []

  for (const c of careers) {
    bests.push(c.bestRank || 0)
    const weeks = c.ranks.filter((x) => inBand(x.rank)).length
    if (weeks > 0) {
      everInBand += 1
      dwell.push(weeks)
      const first = c.ranks.find((x) => inBand(x.rank))!
      const out = c.ranks.find((x) => x.week > first.week && x.rank <= DIRECT)
      if (out) {
        crossed += 1
        waits.push(out.week - first.week)
      }
    }
    // "stalled there" = her career-best rank is IN the band: she got that far and no further, over
    // the whole horizon. The strongest statement this measurement can make about the door.
    if (c.bestRank && inBand(c.bestRank)) peakedInBand += 1
  }

  console.log(`\n  careers whose BEST rank ever reached the band or better   ${pad(careers.filter((c) => c.bestRank && c.bestRank <= BAND_HI).length, 3)} / ${careers.length}`)
  console.log(`  careers that ever HELD a rank inside #${BAND_LO}-#${BAND_HI}          ${pad(everInBand, 3)} / ${careers.length}`)
  console.log(`  ...of those, careers that later crossed #${DIRECT}          ${pad(crossed, 3)} / ${everInBand}`)
  console.log(`  ⭐ careers whose CAREER BEST IS INSIDE THE BAND (stalled)  ${pad(peakedInBand, 3)} / ${careers.length}`)
  console.log(`\n  weeks held inside the band, per career that entered it:  median ${pad(median(dwell), 4)}  ·  max ${pad(dwell.length ? Math.max(...dwell) : 0, 4)}`)
  console.log(`  weeks from FIRST entering the band to first crossing #${DIRECT}: median ${pad(median(waits), 4)}  ·  max ${pad(waits.length ? Math.max(...waits) : 0, 4)}`)
  console.log(`\n  career-best merged rank, every career: ${bests.map((b) => (b ? '#' + b : '–')).sort((a, b) => Number(String(a).replace('#', '')) - Number(String(b).replace('#', ''))).join(' ')}`)
  if (VERBOSE) {
    console.log('\n  per career:')
    for (const c of careers) {
      const w = c.ranks.filter((x) => inBand(x.rank)).length
      console.log(`    ${c.seed.padEnd(16)} best #${pad(c.bestRank, 4)}   weeks in band ${pad(w, 4)}   titles ${JSON.stringify(c.titles)}`)
    }
  }
}

// =================================================================================================
section(`3. ⭐ HIS OWN PROPOSAL, EVALUATED – "raz u nas net kvaly, mozhet prosto brat +16 iz tablicy"`)
// THE PROPOSAL (owner, round 21): since we model no qualifying, fold the 16 qualifying places into
// the direct-acceptance cut – `slam.acceptsRank` 104 -> 120 – and make the 8 wild cards a visible
// mechanism with a marker on the tournament card.
//
// ⚠ EVALUATED, NOT SHIPPED. Nothing below moves a constant; every candidate is scored as a PREDICATE
// OVER THE MEASURED RANK SERIES above, which is what makes the rows survive him picking a different
// number. Same discipline as tools/college-fork.ts.
{
  const CANDIDATES = [DIRECT, 112, 120, DRAW]
  console.log(
    `\n  the rulebook's own three permitted configurations (docs/research/ranking-points-by-tier.md §4-D:` +
      `\n  direct 104/108/112 · qualifiers 16/12/8 · wild cards 8, and only WC=8 is fixed) plus his 120.\n`,
  )
  console.log(
    `  ${padE('cut', 8)}${pad('what it models', 34)}${pad('careers refused', 17)}${pad('median wks refused', 20)}${pad('max wks', 9)}`,
  )
  for (const cut of CANDIDATES) {
    const refusedWeeks: number[] = []
    let refusedCareers = 0
    for (const c of careers) {
      const n = c.ranks.filter((x) => x.rank > cut && x.rank <= DRAW).length
      if (n > 0) {
        refusedCareers += 1
        refusedWeeks.push(n)
      }
    }
    const label =
      cut === DIRECT ? 'direct acceptances only (SHIPPED)'
        : cut === 112 ? 'direct 112 / qual 8 – the third config'
          : cut === 120 ? 'direct 104 + the 16 qualifiers  <- HIS'
            : 'direct + qualifiers + wild cards'
    console.log(
      `  ${padE('#' + cut, 8)}${pad(label, 34)}${pad(`${refusedCareers}/${careers.length}`, 17)}` +
        `${pad(median(refusedWeeks), 20)}${pad(refusedWeeks.length ? Math.max(...refusedWeeks) : 0, 9)}`,
    )
  }
  console.log(
    `\n  ⚠⚠ THE ONE THING THE PROPOSAL COLLIDES WITH, AND IT IS ARITHMETIC RATHER THAN TASTE:` +
      `\n  \`TIERS.wta500.acceptsRank\` is already ${TIERS.wta500.acceptsRank}. At 120 a GRAND SLAM becomes exactly as easy to` +
      `\n  enter as a WTA 500 – the ladder's top three cuts would read 1000 #${TIERS.wta1000.acceptsRank} · slam #120 · 500 #${TIERS.wta500.acceptsRank},` +
      `\n  i.e. the hardest draw in the game shares a door with the rung two storeys below it. That is not a` +
      `\n  reason to refuse the proposal; it is the second number it drags with it, and it is the owner's.`,
  )
  console.log(
    `\n  ⭐ AND WHAT THE SAME ARGUMENT IMPLIES FOR EVERY OTHER RUNG – he should be told, not discover it:` +
      `\n  a Slam is NOT the only draw with qualifying. Research §4c-B prints the published composition of a` +
      `\n  32-draw W event: direct acceptances 13-17 (W15) / 16-20 (W35-W100), qualifiers 8, wild cards 4,` +
      `\n  junior-reserved 3 at W15. So a real W75 admits only 16-20 of its 32 off the acceptance list, and` +
      `\n  our \`selectEntrants\` fills all 32 from one pool.` +
      `\n  ⚠ BUT THE "+16" ARGUMENT DOES NOT TRANSFER, because the W rungs have no threshold to add to:` +
      `\n  §4-A reads the 2026 ITF WTT Regulations as ONE "System of Merit" ordering with NO cut anywhere in` +
      `\n  it – an unranked player is not refused a W75, she is placed at the BOTTOM of the acceptance list.` +
      `\n  So at the W rungs the honest version of his idea is not a bigger number, it is THE SOFT TAIL – the` +
      `\n  design he already deferred on 16.08. The Slam is the one rung where "+16" is even expressible,` +
      `\n  because it is the one rung whose regulation states a COUNT.`,
  )
  console.log(
    `\n  ⚠ THE WILD-CARD HALF IS A SEPARATE MECHANIC AND IS NOT DESIGNED HERE. It needs three decisions` +
      `\n  he has not been asked for yet: WHO gets one (host-nation? a name the tour wants? a returning` +
      `\n  mother?), WHETHER SHE can ever receive one and on what evidence, and what the card says. It also` +
      `\n  needs a purpose-scoped RNG sub-stream if it rolls at all (never MAIN – input-independence is` +
      `\n  permanent law). Flagged with its cost, not sketched.`,
  )
}

console.log(
  `\n⚠ CROSS-REFERENCE: docs/specs/the-acceptance-tail-2026-08.md – the owner deferred the soft-tail` +
    `\n  question on 16.08 («пусть остануться жесткие отсечки»). This is the same question at the slam's` +
    `\n  door, and nothing here changes that ruling.`,
)
