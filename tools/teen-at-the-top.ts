// AN EIGHTEEN-YEAR-OLD AT #2 – how often does our professional table do that, and is the rate fair?
//
//   npx vite-node tools/teen-at-the-top.ts [--seeds N] [--seasons N] [--seed S --season N]
//
// THE QUESTION (owner, round 21): «Увидел там в таблице лидеров 18 летнюю барышню на #2 в
// professional лишнее, не очень понимаю как такое возможно вообще.»
//
// She is real, she is a FIELD PRO and not a cohort girl, and the SHAPE is plausible: the sport has
// produced top-3 teenagers. `docs/research/real-ladder-pace.md` §1c has the sourced fast tail –
// Andreeva career-high **#5 at 18y76d**, Sharapova **#1 at 18y125d** – and notes that seven of the
// nine youngest top-10 entries ever predate the 1995 Age Eligibility Rule, i.e. the young tail was
// deliberately truncated and is now RARE rather than impossible.
//
// SO THE QUESTION IS NOT "CAN THIS HAPPEN" BUT "AT WHAT RATE", and that is what this file measures.
// A rate is the only thing that can tell a fair tail apart from an over-generous model, and it is
// measurable here for free: `fieldProsFor` is a PURE FUNCTION of (seed, seasonIndex), so a thousand
// world-seasons of the professional table cost no career simulation at all.
//
// ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant. The counterfactual arm in
// §4 re-scores MEASURED ROWS under an alternative `career.tenure.debutFloor` – it never re-runs the engine under
// a changed rule, so nothing here can be mistaken for a shipped behaviour and the rows stay valid if
// the owner picks a different number. Same discipline as `tools/college-fork.ts`.
import { createWorld } from '../src/engine/world'
import { FIELD, careerArc, tenureRamp, fieldProsFor, type FieldPro } from '../src/engine/season/fieldPros'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strOf = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const SEEDS = argOf('seeds', 60)
const SEASONS = argOf('seasons', 12)
/** print the head of ONE named world-season, for reading a specific screenshot back */
const ONE_SEED = strOf('seed')
const ONE_SEASON = argOf('season', 0)

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 104) => '-'.repeat(n)
const section = (t: string) => console.log(`\n${rule()}\n${t}\n${rule()}`)
const pct = (part: number, whole: number) => (whole === 0 ? '  –  ' : `${((100 * part) / whole).toFixed(2)}%`)
const core4 = (p: FieldPro) => (p.serve + p.ret + p.composure + p.stamina) / 4

/** The head of the professional table for one world-season, best first.
 *
 *  ⚠ THE FIELD ALONE, AND THAT IS THE RIGHT DENOMINATOR FOR THIS QUESTION. `mergedWtaRanking`
 *  interleaves the LIVE cohort's earned rows, but the cohort is 199 juniors whose whole table tops
 *  out three storeys below `tourElite` – nobody live is near the head of a fresh world, and the
 *  owner's #2 is an `fp-` id. Folding a cohort in would add rows that cannot reach the ranks being
 *  counted and would only make the denominator noisy. */
function head(seed: string, season: number): FieldPro[] {
  return [...fieldProsFor(seed, season, [])].sort((a, b) => b.wtaPoints - a.wtaPoints)
}

// =================================================================================================
if (ONE_SEED) {
  section(`THE HEAD OF ONE WORLD – seed "${ONE_SEED}", season ${ONE_SEASON}`)
  const rows = head(ONE_SEED, ONE_SEASON)
  console.log(
    `\n  ${padE('rank', 6)}${padE('id', 8)}${padE('name', 22)}${pad('age', 4)}${pad('pts', 8)}` +
      `${padE('  storey', 14)}${pad('core', 7)}${pad('arc', 7)}${pad('base', 8)}`,
  )
  rows.slice(0, 20).forEach((p, i) => {
    const arc = careerArc(p.ageYears)
    console.log(
      `  ${padE('#' + (i + 1), 6)}${padE(p.id, 8)}${padE(p.name, 22)}${pad(p.ageYears, 4)}${pad(p.wtaPoints, 8)}` +
        `  ${padE(p.strengthTier, 12)}${pad(core4(p).toFixed(1), 7)}${pad(arc.toFixed(3), 7)}` +
        `${pad(Math.round(p.wtaPoints / arc), 8)}`,
    )
  })
  console.log(
    `\n  "base" = her points with the career arc divided out – what the CHAIR is worth before her age` +
      `\n  is applied. Read the two columns together: that is the whole mechanism.`,
  )
}

// =================================================================================================
section(`1. THE RATE – how often is a player aged 18 or under at the head of the table?`)
// n = SEEDS x SEASONS world-seasons. Each is an independent fold of the same pure function.
interface Tally { top1: number; top3: number; top10: number; top50: number; top50count: number; top10count: number }
const u19: Tally = { top1: 0, top3: 0, top10: 0, top50: 0, top50count: 0, top10count: 0 }
const u20: Tally = { top1: 0, top3: 0, top10: 0, top50: 0, top50count: 0, top10count: 0 }
const ageAtRank: number[][] = [[], [], []] // top1 / top10 / top50 age pools
const allAges: number[] = []
let worldSeasons = 0

for (let s = 0; s < SEEDS; s++) {
  for (let season = 0; season < SEASONS; season++) {
    const rows = head(`teen-top-${s}`, season)
    worldSeasons += 1
    for (const p of rows) allAges.push(p.ageYears)
    const t50 = rows.slice(0, 50)
    const t10 = rows.slice(0, 10)
    const t3 = rows.slice(0, 3)
    ageAtRank[0].push(rows[0].ageYears)
    for (const p of t10) ageAtRank[1].push(p.ageYears)
    for (const p of t50) ageAtRank[2].push(p.ageYears)
    for (const [band, tally] of [[18, u19], [19, u20]] as [number, Tally][]) {
      if (rows[0].ageYears <= band) tally.top1 += 1
      if (t3.some((p) => p.ageYears <= band)) tally.top3 += 1
      if (t10.some((p) => p.ageYears <= band)) tally.top10 += 1
      if (t50.some((p) => p.ageYears <= band)) tally.top50 += 1
      tally.top10count += t10.filter((p) => p.ageYears <= band).length
      tally.top50count += t50.filter((p) => p.ageYears <= band).length
    }
  }
}

console.log(`\n  n = ${SEEDS} seeds x ${SEASONS} seasons = ${worldSeasons} independent world-seasons of a ${FIELD.size}-strong field\n`)
console.log(`  ${padE('', 34)}${pad('aged <= 18', 14)}${pad('aged <= 19', 14)}`)
const row = (label: string, a: number, b: number, denom: number) =>
  console.log(`  ${padE(label, 34)}${pad(pct(a, denom), 14)}${pad(pct(b, denom), 14)}`)
row('world-seasons whose #1 is a teen', u19.top1, u20.top1, worldSeasons)
row('...with a teen in the TOP 3', u19.top3, u20.top3, worldSeasons)
row('...with a teen in the TOP 10', u19.top10, u20.top10, worldSeasons)
row('...with a teen in the TOP 50', u19.top50, u20.top50, worldSeasons)
console.log(
  `\n  mean teens IN the top 10   ${(u19.top10count / worldSeasons).toFixed(2)} aged <=18` +
    `   ·   ${(u20.top10count / worldSeasons).toFixed(2)} aged <=19`,
)
console.log(
  `  mean teens IN the top 50   ${(u19.top50count / worldSeasons).toFixed(2)} aged <=18` +
    `   ·   ${(u20.top50count / worldSeasons).toFixed(2)} aged <=19`,
)

// =================================================================================================
section(`2. IS THE HEAD YOUNGER THAN THE FIELD? – the base rate the §1 numbers must be read against`)
const share = (xs: number[], band: number) => pct(xs.filter((a) => a <= band).length, xs.length)
console.log(`\n  ${padE('population', 30)}${pad('n', 10)}${pad('mean age', 11)}${pad('<= 18', 10)}${pad('<= 19', 10)}`)
const ageRow = (label: string, xs: number[]) =>
  console.log(
    `  ${padE(label, 30)}${pad(xs.length, 10)}${pad((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2), 11)}` +
      `${pad(share(xs, 18), 10)}${pad(share(xs, 19), 10)}`,
  )
ageRow(`the whole field (${FIELD.size} chairs)`, allAges)
ageRow('the top 50', ageAtRank[2])
ageRow('the top 10', ageAtRank[1])
ageRow('the #1 chair', ageAtRank[0])
console.log(
  `\n  ⭐ IF THE HEAD'S SHARE MATCHES THE FIELD'S, THE ARC IS DOING NOTHING AND YOUTH IS NEITHER` +
    `\n  REWARDED NOR PUNISHED AT THE TOP – the teens at the head are simply the teens in the world.`,
)

// =================================================================================================
section(`3. WHY – the two numbers that decide it, printed rather than argued`)
console.log(`\n  a) THE CHAIR'S STOREY IS FIXED FOR EVER AND ITS CORE IS DRAWN ONCE PER CAREER.`)
console.log(`     FIELD.tiers[0] = tourElite: ${FIELD.tiers[0].count} chairs, core ${JSON.stringify(FIELD.tiers[0].core)}, points ${JSON.stringify(FIELD.tiers[0].pts)}, gamma ${FIELD.tiers[0].gamma}.`)
console.log(`     So a chair that drew a near-max core is a top-3 chair WHOEVER IS SITTING IN IT.`)
console.log(`\n  b) AGE OWNS THE DECLINE; WHAT SHE HAS BANKED IS OWNED BY TENURE (changed 19.08).`)
console.log(`     careerArc(age) – flat to the peak, then the body:`)
console.log(`       ${[16, 17, 18, 19, 20, 21, 22, 26, 28, 30, 34].map((a) => `${a}:${careerArc(a).toFixed(2)}`).join('  ')}`)
console.log(`     tenureRamp(seasons on tour) – the climb, from FIELD.career.tenure:`)
console.log(`       ${[0, 1, 2, 3, 4].map((n) => `${n}:${tenureRamp(n).toFixed(2)}`).join('  ')}`)
console.log(
  `\n  ⭐ THE CONSEQUENCE, AND IT IS THE OPPOSITE OF WHAT THIS FILE FOUND IN ROUND 21. A debutante now` +
    `\n  CLIMBS into a chair instead of inheriting it: she holds ${(100 * tenureRamp(0)).toFixed(0)}% of it in her first season and all of` +
    `\n  it by her ${FIELD.career.tenure.fullFrom}th. Because debutAge is ${JSON.stringify(FIELD.career.debutAge)}, A SIXTEEN-YEAR-OLD IS ALWAYS IN HER DEBUT` +
    `\n  SEASON – so the rule lands on exactly the population the owner objected to, and it lands on the` +
    `\n  CAUSE (she has not played the tennis yet) rather than on the correlate (she is young).` +
    `\n\n  ⚠ THE RAMP IS NORMALISED BY THE POPULATION'S OWN MEAN in fieldProsFor, so it changes the table's` +
    `\n  SHAPE and never its LEVEL. Unnormalised it deflated the field ~10% and handed the kid a` +
    `\n  professional rung she had not earned (tests/unranked-sentinel.test.ts caught it).`,
)

// =================================================================================================
section(`4. THE KNOB, SIZED – re-scoring the SAME rows under a different tenure floor`)
// ⚠ A PREDICATE OVER MEASURED ROWS. Every pro's base book is `wtaPoints / careerArc(age)`, exactly
// invertible because the arc is the last multiplicative term applied to it (`makeFieldPro`) apart
// from the jitter, which is age-independent and therefore rides along unchanged. So an alternative
// floor is scored by dividing out the shipped arc and multiplying in the candidate one – no engine
// re-run, no constant moved, and the same 1,600 people in the same chairs.
function rampWith(floor: number, shippedTenure: number): number {
  // ⚠ RECOVER `k` – how far through the climb she is – FROM THE SHIPPED RAMP rather than carrying
  // her debut season around: tenureRamp is linear in k, so k = (shipped - floor) / (1 - floor) at
  // the shipped floor, and the candidate's value at the same k is floor' + (1 - floor') * k. That
  // keeps this a RE-SCORE of measured rows, which is what the file's ⚠ header promises.
  const shippedFloor = FIELD.career.tenure.debutFloor
  const k = shippedFloor >= 1 ? 1 : Math.max(0, Math.min(1, (shippedTenure - shippedFloor) / (1 - shippedFloor)))
  return floor + (1 - floor) * k
}


const CANDIDATES = [FIELD.career.tenure.debutFloor, 0.4, 0.15, 0.0]
console.log(`\n  ${padE('tenure floor', 16)}${pad('s0', 9)}${pad('s1', 9)}${pad('teen(<=18) in top 3', 21)}${pad('in top 10', 12)}${pad('in top 50 (mean n)', 20)}`)
for (const floor of CANDIDATES) {
  let t3 = 0
  let t10 = 0
  let n50 = 0
  for (let s = 0; s < SEEDS; s++) {
    for (let season = 0; season < SEASONS; season++) {
      // ⚠ RE-RUN THE PERMUTATION, NOT A RE-SCORE OF THE POINTS. Since 19.08 tenure does not enter a
      // row's VALUE at all - `fieldProsFor` keeps the calibrated books and lets tenure decide only
      // who holds which one INSIDE HER OWN STOREY. So the honest counterfactual is that same
      // permutation under a different floor, and it is done here exactly as the engine does it.
      // (The older arm divided tenure out of the points; there is no longer any tenure in there to
      // divide out, and it would have quietly measured nothing.)
      const field = fieldProsFor(`teen-top-${s}`, season, [])
      const rows: { age: number; pts: number }[] = []
      for (const tier of FIELD.tiers) {
        const group = field.filter((q) => q.strengthTier === tier.id)
        if (!group.length) continue
        // ⚠ FROM `chairBook`, NEVER FROM `wtaPoints`: the field handed back here is ALREADY permuted,
        // so re-deriving the order from its points permutes a permuted table. That mistake measured
        // 0.92% against the shipped field's 3.25% before it was caught.
        const books = group.map((q) => q.chairBook).sort((a, b) => b - a)
        group
          .map((q, i) => ({ q, i, merit: q.chairBook * rampWith(floor, q.tenure) }))
          .sort((a, b) => b.merit - a.merit || a.i - b.i)
          .forEach((o, rank) => rows.push({ age: o.q.ageYears, pts: books[rank] }))
      }
      rows.sort((a, b) => b.pts - a.pts)
      if (rows.slice(0, 3).some((p) => p.age <= 18)) t3 += 1
      if (rows.slice(0, 10).some((p) => p.age <= 18)) t10 += 1
      n50 += rows.slice(0, 50).filter((p) => p.age <= 18).length
    }
  }
  const tag = floor === FIELD.career.tenure.debutFloor ? '  <- SHIPPED' : ''
  console.log(
    `  ${padE(floor.toFixed(2), 16)}${pad(floor.toFixed(2), 9)}${pad(rampWith(floor, tenureRamp(1)).toFixed(2), 9)}` +
      `${pad(pct(t3, worldSeasons), 21)}${pad(pct(t10, worldSeasons), 12)}${pad((n50 / worldSeasons).toFixed(2), 20)}${tag}`,
  )
}
console.log(
  `\n  ⚠ THE FLOOR NO LONGER MOVES THE TABLE'S LEVEL, AND THAT IS NEW (19.08). This warning used to` +
    `\n  read that the arc's four numbers were tuned to hold the population's mean multiplier at 0.9067,` +
    `\n  so any change owed a re-run of bench:world --arc-probe. That was true of \`ageRampFloor\`, which` +
    `\n  was applied raw. \`tenureRamp\` is DIVIDED BY THE POPULATION'S OWN MEAN in fieldProsFor, so the` +
    `\n  level is restored by construction whatever this floor is, and only the SHAPE moves.` +
    `\n  The raw mean is still printed below, because the calibration being automatic is a claim that` +
    `\n  should be visible rather than trusted - what it must NOT do is drift with the floor.`,
)
console.log(`\n  ${padE('tenure floor', 16)}${pad('raw mean over the population', 38)}${pad('drift vs shipped', 20)}`)
{
  const meanFor = (floor: number) => {
    let sum = 0
    let n = 0
    for (let s = 0; s < SEEDS; s++) {
      for (let season = 0; season < SEASONS; season++) {
        for (const p of fieldProsFor(`teen-top-${s}`, season, [])) {
          sum += rampWith(floor, p.tenure)
          n += 1
        }
      }
    }
    return sum / n
  }
  const base = meanFor(FIELD.career.tenure.debutFloor)
  for (const floor of CANDIDATES) {
    const m = meanFor(floor)
    console.log(
      `  ${padE(floor.toFixed(2), 16)}${pad(m.toFixed(4), 38)}${pad(`${(100 * (m / base - 1)).toFixed(2)}%`, 20)}` +
        (floor === FIELD.career.tenure.debutFloor ? '  <- SHIPPED' : ''),
    )
  }
}

// =================================================================================================
section(`5. AND WHAT THE CHAIR ITSELF IS – the top 3's storey, in every world measured`)
{
  const storeys: Record<string, number> = {}
  for (let s = 0; s < SEEDS; s++) {
    for (let season = 0; season < SEASONS; season++) {
      for (const p of head(`teen-top-${s}`, season).slice(0, 3)) {
        storeys[p.strengthTier] = (storeys[p.strengthTier] ?? 0) + 1
      }
    }
  }
  console.log(`\n  storey of the top-3 chairs: ${Object.entries(storeys).map(([k, v]) => `${k} ${v}`).join(' · ')}   (of ${3 * worldSeasons})`)
  console.log(
    `  ⚠ ALL ONE STOREY IS THE EXPECTED READING and not a defect: 'tourElite' is 64 chairs of ${FIELD.size} and the` +
      `\n  points bands are disjoint before the arc, so the head of the table is always drawn from it.`,
  )
}

// A world the owner can recognise: createWorld gives the same cohort names the game uses, so a run
// with his own seed reproduces the table he is reading off the screen.
if (!ONE_SEED) {
  const w = createWorld('teen-top-example')
  console.log(
    `\n  (to read a specific screenshot back: --seed <world seed> --season <n>. Cohort names are not` +
      `\n   needed for the head – the top of the table is field pros, and ${w.cohort.length} live juniors hold no` +
      `\n   points near it.)`,
  )
}
