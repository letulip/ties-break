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

// =================================================================================================
// ⭐⭐⭐ ARM 5 – THE EFFECTIVE PLAYER AGAINST THE RAW SHEET (21.09, his «три руки по пункту 2»)
// =================================================================================================
//
// WHY. ARM 4 priced titles off her RAW overall(4) and the retraction at the top of
// docs/research/the-unclosable-head-2026-09.md says what that cost: the specimen banks ~26% of the
// 1000s she enters while her raw sheet prices a title at 0.0008 a draw. Something between the sheet
// and the court is worth a lot of core points, and this arm measures HOW MANY.
//
// ⚠ IT IS A TRANSFER CURVE AND NOT A CAREER. The skills are handed in rather than walked to, because
// the question is what `kidMatchPlayerFor` DOES to a build – condition, spirit, surface x style, kit.
// A walked career would answer a different question (arm 7's) and would hide this one inside it.
import { kidMatchPlayerFor } from '../src/engine/world/player'
// ⚠ FROM ITS OWN MODULE, NOT THE `engine/world` BARREL – the barrel re-exports it through a cycle
// that leaves it `undefined` at module-eval time in a vite-node script, which is a null arm wearing a
// crash rather than a number.
import { DEFAULT_PROFILE } from '../src/shared/protocol/profile'

const RAW = { serve: 69.2, ret: 70.3, composure: 55.3, stamina: 65.7, groundstrokes: 74.2 }
const rawOverall = (RAW.serve + RAW.ret + RAW.composure + RAW.stamina) / 4
const effOverall = (p: { serve: number; ret: number; composure: number; stamina: number }) =>
  (p.serve + p.ret + p.composure + p.stamina) / 4

console.log('\n== ARM 5 – what the COURT does to the SHEET (the specimen build, raw overall ' + rawOverall.toFixed(1) + ') ==')
console.log(`  ${'condition'.padStart(11)}${'spirit'.padStart(9)}${'effective'.padStart(11)}${'delta core'.padStart(12)}${'= Elo'.padStart(9)}${'p(title,64)'.padStart(13)}`)
for (const [condition, spirit] of [[100, 85], [90, 75], [90, 50], [75, 75], [60, 60]] as const) {
  const p = kidMatchPlayerFor(
    { seed: 'arm5', profile: DEFAULT_PROFILE, condition, week: 520, skills: RAW, spirit },
    'hard',
  )
  const eff = effOverall(p)
  const cores = drawCores(6)
  const pTitle = cores.reduce((acc, c) => acc * pAtGap(eff - c), 1)
  console.log(
    `  ${String(condition).padStart(11)}${String(spirit).padStart(9)}${eff.toFixed(1).padStart(11)}` +
      `${(eff - rawOverall >= 0 ? '+' : '') + (eff - rawOverall).toFixed(1).padStart(11)}` +
      `${((eff - rawOverall) * SKILL_LAW.eloPerCore).toFixed(0).padStart(9)}${pTitle.toFixed(4).padStart(13)}`,
  )
}

// =================================================================================================
// ⭐⭐⭐ ARM 6 – THE SLAM AGAINST THE 1000: WHO IS ACTUALLY IN THE DRAW (21.09)
// =================================================================================================
//
// HIS QUESTION: one Slam at 19 and none in the five years after, against FOURTEEN WTA1000 titles over
// the same stretch. Two candidate causes were named – the extra round, and the field. This arm reads
// the field, because the tier table answers it without a single walked career.
import { TIERS } from '../src/engine/season/calendar'
import { isEntrantBand } from '../src/engine/season/tournament'

console.log('\n== ARM 6 – the two draws, from the tier table itself ==')
for (const id of ['slam', 'wta1000'] as const) {
  const t = TIERS[id]
  console.log(
    `  ${id.padEnd(9)} draw ${String(t.drawSize).padStart(3)} (${Math.log2(t.drawSize)} rounds) · ` +
      `${t.anchorWeeks?.length ?? 0} a season · accepts to #${t.acceptsRank} · AI band [${t.entrantPctBand[0]}, ${t.entrantPctBand[1]}]`,
  )
}
// how many of the table's very best are CANDIDATES for each draw, at a merged table of ~1800 rows
for (const tableRows of [1600, 1800, 2000]) {
  const topsIn = (id: 'slam' | 'wta1000') => {
    let n = 0
    for (let rank = 1; rank <= 30; rank++) if (isEntrantBand(id, (rank - 1) / tableRows)) n++
    return n
  }
  console.log(
    `  table ${tableRows} rows: of the world's top 30, the SLAM field may contain ${topsIn('slam')}, ` +
      `the 1000 field ${topsIn('wta1000')} (the 1000's band opens at ${TIERS.wta1000.entrantPctBand[0]})`,
  )
}
console.log('  ⚠ the lower edge is DELIBERATE – the owner\'s hard cuts of 16.08 («пусть остануться жесткие')
console.log('    отсечки», docs/specs/the-acceptance-tail-2026-08.md): a top-20 skips the smaller rungs.')
console.log(`  ${'her overall'.padStart(13)}${'p(title, 1000: 6 rds)'.padStart(23)}${'p(title, slam: 7 rds)'.padStart(23)}${'ratio'.padStart(9)}`)
for (const her of [65.1, 68, 70, 73]) {
  const p1000 = drawCores(6).reduce((acc, c) => acc * pAtGap(her - c), 1)
  const pSlam = drawCores(7).reduce((acc, c) => acc * pAtGap(her - c), 1)
  console.log(
    `  ${her.toFixed(1).padStart(13)}${p1000.toFixed(4).padStart(23)}${pSlam.toFixed(4).padStart(23)}` +
      `${(p1000 / pSlam).toFixed(2).padStart(9)}x`,
  )
}
console.log('  ⚠ THIS IS THE ROUND-COUNT HALF ONLY, on one shared band. The FIELD half is the table above:')
console.log('    a 1000 draw may not contain the players the slam draw must.')

// =================================================================================================
// ⭐⭐⭐ ARM 6b – THE DRAW SHE ACTUALLY MEETS, AND WHY ARM 4's TABLE WAS THE WRONG FIELD
// =================================================================================================
//
// ARM 5 found the court does NOT add core points: at condition 100 and a high spirit the effective
// build is 64.9 against a raw 65.1. So the factor-of-350 between arm 4's model (0.0007 a draw) and
// the specimen's measured cabinet (~26% of entered 1000s) is NOT in the player. It is in the FIELD
// arm 4 assumed: it drew every opponent from `FIELD.tiers.tourElite` (core 67–77, the top 64 chairs).
// A 1000's draw is not that. It is a PERCENTILE BAND of the merged table – [0.006, 0.2] – and the
// cores across that band come from `coreForStanding`, which is the same law the table is built on.
//
// ⚠ THIS SECTION REPLACES ARM 4's NUMBERS FOR ANY QUESTION ABOUT A REAL EVENT. Arm 4 remains a true
// statement about a hypothetical all-elite draw, and nothing else.
const TABLE_ROWS = 1800 // the merged universe's own order of magnitude (calendar.ts's wta250 note)

/** The cores of a seeded bracket drawn from a tier's OWN entrant band: round 1 is the weakest
 *  quarter of the band, the final the strongest player it may contain. */
function bandDrawCores(id: 'slam' | 'wta1000', rounds: number): number[] {
  const [lo, hi] = TIERS[id].entrantPctBand
  const bestRank = Math.max(1, Math.round(lo * TABLE_ROWS) + 1)
  const worstRank = Math.max(bestRank + 1, Math.round(hi * TABLE_ROWS))
  const out: number[] = []
  for (let r = 0; r < rounds; r++) {
    // the seeding's direction: the field she meets narrows toward the band's best, log-spaced in
    // rank exactly as `eloForStanding` interpolates
    const t = r / Math.max(1, rounds - 1)
    const rank = Math.round(Math.exp(Math.log(worstRank) + t * (Math.log(bestRank) - Math.log(worstRank))))
    out.push(coreForStanding(rank))
  }
  return out
}

console.log('\n== ARM 6b – the field she ACTUALLY meets, from each tier\'s own entrant band ==')
for (const id of ['slam', 'wta1000'] as const) {
  const rounds = Math.log2(TIERS[id].drawSize)
  const cores = bandDrawCores(id, rounds)
  console.log(`  ${id.padEnd(9)} rounds ${rounds}: opponent cores ${cores.map((c) => c.toFixed(1)).join(' → ')}`)
}
console.log(`  ${'her overall'.padStart(13)}${'p(title, 1000)'.padStart(16)}${'p(title, slam)'.padStart(16)}${'per season (8 + 4)'.padStart(20)}`)
for (const her of [63, 65.1, 67, 70]) {
  const p1000 = bandDrawCores('wta1000', 6).reduce((acc, c) => acc * pAtGap(her - c), 1)
  const pSlam = bandDrawCores('slam', 7).reduce((acc, c) => acc * pAtGap(her - c), 1)
  console.log(
    `  ${her.toFixed(1).padStart(13)}${p1000.toFixed(3).padStart(16)}${pSlam.toFixed(3).padStart(16)}` +
      `${(8 * p1000).toFixed(2)} × 1000 + ${(4 * pSlam).toFixed(2)} × slam`.padStart(20),
  )
}
console.log('  ⚠ the ratio to check against the specimen: she banked 14 x 1000 and 1 slam over six seasons.')
