// PROBE (A1 research, 21.09.2026) – the favourite's curve: what chance does the closed form give
// a stronger player, as a function of the attribute gap the cohort actually produces?
//
// Owner's observation driving it: «меня смущает наша статистика побед… глубина проходов и вылеты,
// особенно на одаренных карьерах». If the curve is too flat at the gaps our tour really contains,
// three symptoms follow at once: gifted careers exit early, small-tier grinding under-pays, and
// twelve R1 exits at the big draws become the better points bet (the wave-8 A1 inversion).
//
// Zero MAIN draws: worlds are created and read, never ticked.

import { createWorld } from '../src/engine/world'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { fastMatchProbability } from '../src/engine/match/engine'
import type { AiPlayer } from '../src/engine/season/types'

const overall = (p: AiPlayer): number => (p.serve + p.ret + p.composure + p.stamina) / 4

const SEEDS = ['a1-probe:1', 'a1-probe:2', 'a1-probe:3', 'a1-probe:4', 'a1-probe:5']

type Pair = { gap: number; p: number }
const pairs: Pair[] = []
const spreads: { top10: number; mid: number; tail: number }[] = []

for (const seed of SEEDS) {
  const w = createWorld(seed)
  const sorted = [...w.cohort].sort((a, b) => overall(b) - overall(a))
  const n = sorted.length
  spreads.push({
    top10: sorted.slice(0, 10).reduce((s, p) => s + overall(p), 0) / 10,
    mid: sorted.slice(Math.floor(n / 2) - 5, Math.floor(n / 2) + 5).reduce((s, p) => s + overall(p), 0) / 10,
    tail: sorted.slice(n - 20).reduce((s, p) => s + overall(p), 0) / 20,
  })
  // every ordered pair among a 40-player sample spread across the table
  const sample: AiPlayer[] = []
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 40))) sample.push(sorted[i])
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const a = rivalMatchPlayer(sample[i], 'hard')
      const b = rivalMatchPlayer(sample[j], 'hard')
      const p = fastMatchProbability(a, b, { surface: 'hard', tour: 'wta', seed: `${seed}:p:${i}:${j}` })
      pairs.push({ gap: overall(sample[i]) - overall(sample[j]), p })
    }
  }
}

// bucket by gap
const buckets = new Map<number, { sum: number; n: number; min: number; max: number }>()
for (const { gap, p } of pairs) {
  const k = Math.min(30, Math.round(gap / 2.5) * 2.5)
  const b = buckets.get(k) ?? { sum: 0, n: 0, min: 1, max: 0 }
  b.sum += p; b.n += 1; b.min = Math.min(b.min, p); b.max = Math.max(b.max, p)
  buckets.set(k, b)
}

console.log('== the cohort spread (overall 0-100, 5 worlds averaged) ==')
const avg = (f: (s: typeof spreads[0]) => number) => (spreads.reduce((s, x) => s + f(x), 0) / spreads.length).toFixed(1)
console.log(`top-10 ${avg(s => s.top10)} · mid-table ${avg(s => s.mid)} · tail-20 ${avg(s => s.tail)}`)
console.log('== favourite win probability by attribute gap ==')
for (const k of [...buckets.keys()].sort((x, y) => x - y)) {
  const b = buckets.get(k)!
  console.log(`gap ${String(k).padStart(4)}  p(win) mean ${(b.sum / b.n).toFixed(3)}  [${b.min.toFixed(3)}..${b.max.toFixed(3)}]  n=${b.n}`)
}
console.log(`pairs total: ${pairs.length}`)

// == ARM 2 – the comeback staircase, denominated in the game's own Elo ==
import { SKILL_LAW, coreForStanding, eloForStanding } from '../src/engine/season/fieldPros'

// ⚠⚠ BY IMPORT SINCE WAVE 8b T3, AND IT USED TO BE A COPY. This line read `const ELO_PER_CORE = 20.2`
// with the comment «SKILL_LAW.eloPerCore – the module's own measured rate», which is a second
// spelling of the rate the staircase is now denominated in: the day `SKILL_K`/`RALLY_K` move and the
// rate is re-measured, an instrument holding its own copy reports the OLD exchange rate about the NEW
// engine and nothing goes red. That is the drift CLAUDE.md's barrel lesson exists for, and the engine
// half of the same fix is `comebackMatchFactor` (src/engine/world/player.ts).
const ELO_PER_CORE = SKILL_LAW.eloPerCore
function standingForElo(elo: number): number {
  // invert eloForStanding numerically over 1..1600
  let lo = 1, hi = 1600
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (eloForStanding(mid) > elo) lo = mid
    else hi = mid
  }
  return hi
}

console.log('\n== the staircase in Elo (game rate: 20.2 Elo/core) ==')
for (const rank of [15, 31, 60]) {
  const core = coreForStanding(rank)
  const elo = eloForStanding(rank)
  console.log(`returner at #${rank}: core ${core.toFixed(1)}, Elo ${elo.toFixed(0)}`)
  for (const { factor } of [{ factor: 0.6 }, { factor: 0.8 }, { factor: 0.9 }]) {
    const eff = core * factor
    const dElo = (core - eff) * ELO_PER_CORE
    const effElo = elo - dElo
    const asRank = standingForElo(effElo)
    console.log(`  x${factor}: effective core ${eff.toFixed(1)}  -${dElo.toFixed(0)} Elo -> ~${effElo.toFixed(0)}  ≈ plays like #${asRank}`)
  }
}
console.log('\n== what the research plausibly meant, in the same denomination ==')
for (const dElo of [100, 150, 200, 250]) {
  const factorAt31 = (coreForStanding(31) - dElo / ELO_PER_CORE) / coreForStanding(31)
  console.log(`-${dElo} Elo on a #31 (core ${coreForStanding(31).toFixed(1)}) = factor x${factorAt31.toFixed(3)}`)
}

// =================================================================================================
// ⭐⭐⭐ ARM 3 – THE CEILING DISTRIBUTION (wave 8b T7a, «Алисину руку тоже давай», 21.09)
// =================================================================================================
//
// THE QUESTION. The owner's specimen career sat at WTA #7 with an overall(4) of 65.1 against a table
// that expects 67.4 at that chair, took 0 titles in a 82-12 season, and managed 1 title in six
// seasons from nineteen to twenty-four. So: CAN a career reach the head at all, and is the answer the
// same for all four girls?
//
// WHAT IS MEASURED. `rollPotential(seed, startingSkills(seed))` is her CEILING – rolled once at birth
// off `seed:potential` and never movable by any plan, coach or academy (`engine/radar.ts`'s own
// sentence). Its overall(4) is therefore the best she could EVER be, and the shares below are the
// share of careers whose ceiling clears three bars: the `tourElite` floor (67, `FIELD.tiers`), 70,
// and `SKILL_LAW.top` minus a shade (77 – the top of the tourElite band, which is where the world #1
// lives at 76.4).
//
// ⚠ IT IS A CEILING AND NOT AN OUTCOME, which is the whole reason it is the right arm to run FIRST:
// a career that cannot reach 67 in principle cannot be argued into the head by any amount of play,
// and one that can is a question about the RAMP rather than about the draw. The two arms are
// different questions and this one is cheap – no ticks, no MAIN draws, worlds are never created.
//
// ⚠ FAIRNESS AT ±1.5 pp, PER TEMPERAMENT, and the mechanism is worth stating before the number: the
// ceiling is drawn on `seed:potential` and the temperament on `seed:temperament`, two independent
// purpose-scoped sub-streams, so anything but a tie IS sampling noise. The arm is here to say so with
// a number rather than by reading the code.
import { rollPotential, SKILL_KEYS } from '../src/engine/development'
import { startingSkills } from '../src/engine/world/player'
import { temperamentFor, TEMPERAMENTS } from '../src/engine/spirit'
import { FIELD } from '../src/engine/season/fieldPros'
import type { PlayerProfile } from '../src/shared/protocol'

/** ⚠ 20,000 AND NOT THE BRIEF'S «≥4000», AND THE REASON IS THE CORRIDOR ITSELF. At 4,000 seeds the
 *  four voices hold ~1,000 each, and a share near 19% carries a standard error of
 *  sqrt(0.19 x 0.81 / 1000) = 1.24 pp – so a spread of 1.5 pp across four groups is INSIDE the noise
 *  and the ±1.5 pp read cannot conclude anything at that size. Measured at 4,000 the spread came out
 *  1.78 pp, which would have READ as unfair and was not: 20,000 takes the standard error to 0.55 pp
 *  and makes the corridor mean what it says. The cost is nothing – no world is created and no week is
 *  ticked. */
const CEILING_SEEDS = 20000
/** overall(4) – serve / ret / composure / stamina, the measure `coreForStanding` is built on.
 *  ⚠ NOT the five: `groundstrokes` is the style's wing and is no part of the professional table. */
const OVERALL_4 = ['serve', 'ret', 'composure', 'stamina'] as const
const BARS = [67, 70, 77] as const

// `startingSkills` ignores its profile argument entirely (see its signature), so the shape below is
// a type-satisfier and not a claim about any career.
const ANY_PROFILE = {} as PlayerProfile

const ceilings = new Map<string, number[]>(TEMPERAMENTS.map((t) => [t, [] as number[]]))
for (let i = 0; i < CEILING_SEEDS; i++) {
  const seed = `alice-ceiling-${i}`
  const potential = rollPotential(seed, startingSkills(seed, ANY_PROFILE))
  const overall = OVERALL_4.reduce((s, k) => s + potential[k], 0) / OVERALL_4.length
  ceilings.get(temperamentFor(seed))!.push(overall)
}

const pctOf = (xs: number[], bar: number): number => (100 * xs.filter((v) => v >= bar).length) / xs.length
const allCeilings = [...ceilings.values()].flat()

console.log(`\n== ARM 3 – the CEILING a career is born with, ${CEILING_SEEDS} seeds ==`)
console.log(`the bars: 67 = the tourElite floor (FIELD.tiers), 70, 77 = the top of that band`)
console.log(`SKILL_LAW.top (the world #1) is ${SKILL_LAW.top}; coreForStanding(#7) = ${coreForStanding(7).toFixed(1)}`)
console.log(`  ${'temperament'.padEnd(14)}${'n'.padStart(7)}${'median'.padStart(9)}${'max'.padStart(8)}${BARS.map((b) => `>=${b}`.padStart(9)).join('')}`)
for (const t of TEMPERAMENTS) {
  const xs = ceilings.get(t)!
  const sorted = [...xs].sort((a, b) => a - b)
  const med = sorted[Math.floor(sorted.length / 2)]
  console.log(
    `  ${t.padEnd(14)}${String(xs.length).padStart(7)}${med.toFixed(1).padStart(9)}${Math.max(...xs).toFixed(1).padStart(8)}` +
      BARS.map((b) => `${pctOf(xs, b).toFixed(1)}%`.padStart(9)).join(''),
  )
}
const sortedAll = [...allCeilings].sort((a, b) => a - b)
console.log(
  `  ${'ALL'.padEnd(14)}${String(allCeilings.length).padStart(7)}` +
    `${sortedAll[Math.floor(sortedAll.length / 2)].toFixed(1).padStart(9)}${Math.max(...allCeilings).toFixed(1).padStart(8)}` +
    BARS.map((b) => `${pctOf(allCeilings, b).toFixed(1)}%`.padStart(9)).join(''),
)
for (const bar of BARS) {
  const shares = TEMPERAMENTS.map((t) => pctOf(ceilings.get(t)!, bar))
  const spread = Math.max(...shares) - Math.min(...shares)
  // ⚠ THE NOISE FLOOR IS PRINTED BESIDE THE SPREAD, because «outside ±1.5 pp» is a sentence about a
  // sample and not about the game unless the reader can see how big a sample it is. One standard
  // error on a per-voice share, at the smallest of the four groups.
  const p = pctOf(allCeilings, bar) / 100
  const nPer = Math.min(...TEMPERAMENTS.map((t) => ceilings.get(t)!.length))
  const se = 100 * Math.sqrt((p * (1 - p)) / nPer)
  console.log(
    `  fairness at >=${bar}: spread ${spread.toFixed(2)} pp across the four voices – ` +
      `${spread <= 1.5 ? 'INSIDE' : 'OUTSIDE'} the ±1.5 pp corridor ` +
      `(1 s.e. on a voice's share = ${se.toFixed(2)} pp, so a spread under ~${(2 * se).toFixed(2)} pp is noise)`,
  )
}
console.log('  \u26a0\u26a0 AND THE MECHANISM SAYS THE ANSWER BEFORE THE NUMBER DOES: the ceiling is drawn on')
console.log('     `seed:potential` and the temperament on `seed:temperament` - two INDEPENDENT sub-streams -')
console.log('     so the four shares are four samples of ONE distribution, and anything but a tie is')
console.log('     sampling noise by construction. The arm exists to say that with a number.')
console.log(
  `  ⚠ the ceiling is the FULL band of every skill key (${SKILL_KEYS.length} of them); overall(4) is the four ` +
    `the professional table is built on.`,
)

// =================================================================================================
// ⭐⭐⭐ ARM 4 – THE TITLE EXPECTATION AT THE HEAD (wave 8b T7b)
// =================================================================================================
//
// THE QUESTION, in his specimen's terms: a career at overall(4) 65.1 held WTA #7 and took ZERO titles
// in a season she went 82-12 in. Is that the arithmetic or a defect?
//
// THE CLOSED FORM. A title is SIX consecutive wins in a 64-draw (five in a 32). Against a field drawn
// from the merged table's own cores, her per-match probability is `fastMatchProbability` at the gap –
// so the per-event title chance is the product over the rounds, and the season's expectation is that
// times the events she plays. Nothing here walks a career: the table's cores are `FIELD.tiers`' own,
// and the curve is §2's, measured at the top of this file.
//
// ⚠ IT IS AN UPPER BOUND ON HER SIDE OF THE DRAW and says so: the opponents get STRONGER each round
// in a seeded bracket, and this uses the band's own spread rather than modelling the seeding, so the
// true number is at or below the line below. That direction is the safe one for the question being
// asked («is zero titles plausible»).
const tourElite = FIELD.tiers.find((t) => t.id === 'tourElite')!
const [eliteLo, eliteHi] = tourElite.core
/** The cores she would meet in a 64-draw of the top storey, evenly spread across its own band. */
function drawCores(rounds: number): number[] {
  const out: number[] = []
  for (let r = 0; r < rounds; r++) {
    // round 1 is the bottom of the band, the final is the top – the seeding's own direction
    out.push(eliteLo + ((eliteHi - eliteLo) * r) / Math.max(1, rounds - 1))
  }
  return out
}
/** Her chance of beating a flat build `gap` core points below her, on the game's own rate. */
function pAtGap(gap: number): number {
  // the Elo form the whole table is denominated in: 400 * log10 odds, `SKILL_LAW.eloPerCore` per point
  return 1 / (1 + Math.pow(10, (-gap * SKILL_LAW.eloPerCore) / 400))
}
console.log('\n== ARM 4 – the closed-form TITLE expectation at the head ==')
console.log(`  the top storey's own band is core ${eliteLo}-${eliteHi} over ${tourElite.count} players (FIELD.tiers)`)
console.log(`  ${'her overall(4)'.padStart(16)}${'p(final round)'.padStart(16)}${'p(title, 64)'.padStart(14)}${'titles / 20 events'.padStart(20)}`)
for (const her of [65.1, 67.4, 70, 73, 76.4]) {
  const cores = drawCores(6)
  const pTitle = cores.reduce((p, c) => p * pAtGap(her - c), 1)
  console.log(
    `  ${her.toFixed(1).padStart(16)}${pAtGap(her - eliteHi).toFixed(3).padStart(16)}` +
      `${pTitle.toFixed(4).padStart(14)}${(pTitle * 20).toFixed(2).padStart(20)}`,
  )
}
console.log(
  '  ⚠ AND THE AI-vs-AI BRACKET RESOLVES BY A PROBABILISTIC DRAW, NOT ARGMAX – verified by reading\n' +
    '    src/engine/season/tournament.ts:1055-1056:\n' +
    "      const p = fastMatchProbability(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })\n" +
    '      const aWins = rng() < p\n' +
    '    The stronger player wins WITH PROBABILITY p and never by construction, so the head of the\n' +
    '    table is decided by the same curve her own matches are.',
)
