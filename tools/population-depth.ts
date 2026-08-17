// IS A 1,600-STRONG FIELD ENOUGH? – the population question, answered by the shape of the table
// rather than by an opinion.
//
//   npx vite-node tools/population-depth.ts [--seeds N] [--season N]
//
// THE QUESTION (owner, round 21): «хватает ли нам мира в 1600 для полноты или надо шире делать
// население?»
//
// ⚠ THE QUESTION IS NOT "IS 1,600 THE RIGHT NUMBER OF WOMEN". It is the right number for the table we
// model – `docs/research/real-ladder-pace.md` §3b reads the live WTA singles list ending at **#1531**,
// ~1,550 women holding a ranking, and a denominator flat for over a decade. `FIELD.size` is 1,600 and
// `docs/specs/population-1600-2026-08.md` is the wave that put it there ON THAT EVIDENCE.
//
// THE QUESTION IS WHETHER THE BOTTOM OF OUR TABLE HAS ENOUGH PEOPLE IN IT FOR THE BOTTOM RUNGS TO
// BEHAVE, and that is a different question with a different denominator. Our W15 is the entry rung of
// a real circuit whose population is in the THOUSANDS – the ITF World Tennis Tour is not the WTA list,
// and a real W15 acceptance list is full of women who hold no WTA ranking at all
// (`docs/research/ranking-points-by-tier.md` §4c-A2: at W15 Brasov all 15 direct acceptances and all
// 56 qualifying entries held WTA rankings – i.e. the QUALIFYING draw alone is bigger than our main
// draw). So this file measures four things and lets them decide:
//
//   1. HOW MANY ROWS HOLD A RANKING at all, ours against the sourced real figure.
//   2. HOW DEEP THE POINTS CURVE GOES, ours against the real anchors already recorded in research.
//   3. ⭐ WHERE THE POPULATION RUNS OUT RELATIVE TO THE RUNGS – the lowest table position any rung
//      ever draws from, and therefore how many professionals are in NOBODY's draw, ever.
//   4. ⭐ THE SLOTS-PER-PLAYER ARITHMETIC – how many W main-draw chairs a season contains against how
//      many people are eligible for them. That is the number that says whether the bottom of the
//      table is a living circuit or a list.
//
// ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
import { createWorld } from '../src/engine/world'
import { FIELD, fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, buildSeason } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = argOf('seeds', 8)
const SEASON = argOf('season', 8)

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 108) => '-'.repeat(n)
const section = (t: string) => console.log(`\n${rule()}\n${t}\n${rule()}`)
const median = (xs: number[]) => {
  if (!xs.length) return 0
  const a = [...xs].sort((x, y) => x - y)
  const m = a.length >> 1
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

const W_RUNGS = TIER_LADDER.filter((t) => TIERS[t].track === 'wta') as TierId[]

console.log(`POPULATION DEPTH – FIELD.size = ${FIELD.size} derived professionals, ${SEEDS} worlds at season ${SEASON}`)

// =================================================================================================
section('1. HOW MANY ROWS HOLD A RANKING')
{
  const worlds = Array.from({ length: SEEDS }, (_, s) => createWorld(`popdepth-${s}`))
  const sizes = worlds.map((w) => {
    const pros = fieldProsFor(w.seed, SEASON, w.cohort.map((p) => p.name))
    const merged = mergedWtaRanking([], pros)
    return { merged: merged.length, pointed: merged.filter((r) => r.points > 0).length, cohort: w.cohort.length }
  })
  console.log(`\n  derived professionals            ${pad(FIELD.size, 8)}`)
  console.log(`  live cohort (juniors)            ${pad(median(sizes.map((s) => s.cohort)), 8)}`)
  console.log(`  merged W table rows              ${pad(median(sizes.map((s) => s.merged)) + sizes[0].cohort, 8)}   (field + cohort)`)
  console.log(`  ...of which hold a POINT         ${pad(median(sizes.map((s) => s.pointed)), 8)}   – every derived pro does, by Math.max(1, ...)`)
  console.log(
    `\n  ⭐ AGAINST REALITY: the live WTA singles list ends at #1531 and ~1,550 women hold a ranking` +
      `\n  (docs/research/real-ladder-pace.md §3b, sourced, and flat for over a decade). ${FIELD.size} is that number.` +
      `\n  ⚠ SO THE WTA TABLE IS THE RIGHT SIZE AND THAT IS NOT WHAT THE QUESTION IS ABOUT. See §3-§4.`,
  )
}

// =================================================================================================
section('2. HOW DEEP THE POINTS CURVE GOES')
{
  const marks = [1, 10, 50, 100, 150, 300, 500, 700, 1000, 1300, 1531, 1600]
  const rows: Record<number, number[]> = {}
  for (const m of marks) rows[m] = []
  for (let s = 0; s < SEEDS; s++) {
    const w = createWorld(`popdepth-${s}`)
    const merged = mergedWtaRanking([], fieldProsFor(w.seed, SEASON, w.cohort.map((p) => p.name)))
    for (const m of marks) {
      const r = merged.filter((x) => x.rank <= m).at(-1)
      if (r) rows[m].push(r.points)
    }
  }
  console.log(`\n  ${padE('place', 10)}${marks.map((m) => pad('#' + m, 8)).join('')}`)
  console.log(`  ${padE('OURS', 10)}${marks.map((m) => pad(Math.round(median(rows[m])), 8)).join('')}`)
  // ⚠ THE REAL ROW IS QUOTED FROM RESEARCH, NEVER FROM OUR OWN MEASUREMENTS – `acceptance-cuts-2026-08.md`
  // §0 finding 2 records what restating a repo number as external evidence costs. These are the anchors
  // fieldPros.ts's own calibration box cites (real curve #1 ~10500 · #10 4000 · #50 1400 · #100 850 ·
  // #150 520 · #300 190 · #500 75) plus the live-2026 tail it names (#700 59 · #1000 22).
  const real: Partial<Record<number, number>> = { 1: 10500, 10: 4000, 50: 1400, 100: 850, 150: 520, 300: 190, 500: 75, 700: 59, 1000: 22 }
  console.log(`  ${padE('REAL', 10)}${marks.map((m) => pad(real[m] ?? '–', 8)).join('')}`)
  console.log(
    `\n  ⚠ the REAL row is the anchor set already recorded in fieldPros.ts's calibration box and in` +
      `\n  docs/research/real-ladder-pace.md – quoted, not re-derived here, and never from our own runs.`,
  )
}

// =================================================================================================
section('3. ⭐ WHERE THE POPULATION RUNS OUT RELATIVE TO THE RUNGS')
{
  const w = createWorld('popdepth-0')
  const merged = mergedWtaRanking([], fieldProsFor(w.seed, SEASON, w.cohort.map((p) => p.name)))
  const total = merged.length + w.cohort.length
  console.log(`\n  merged table = ${total} rows. A rung's entrantPctBand is a SHARE of it, so:\n`)
  console.log(
    `  ${padE('rung', 10)}${padE('band', 16)}${pad('opens at #', 12)}${pad('floor at #', 12)}` +
      `${pad('draw', 7)}${pad('candidates', 12)}${pad('accepts', 9)}`,
  )
  let deepest = 0
  for (const t of W_RUNGS) {
    const [lo, hi] = TIERS[t].entrantPctBand
    const a = Math.round(lo * total)
    const b = Math.round(hi * total)
    deepest = Math.max(deepest, b)
    console.log(
      `  ${padE(t, 10)}${padE(`[${lo}, ${hi}]`, 16)}${pad('#' + Math.max(1, a), 12)}${pad('#' + b, 12)}` +
        `${pad(TIERS[t].drawSize, 7)}${pad(b - a, 12)}${pad(TIERS[t].acceptsRank ? '#' + TIERS[t].acceptsRank : 'open', 9)}`,
    )
  }
  console.log(
    `\n  ⭐ THE DEEPEST BAND FLOOR IN THE GAME IS #${deepest} OF ${total}. Every professional below it is in` +
      `\n  NOBODY'S DRAW, EVER – ${total - deepest} people (${((100 * (total - deepest)) / total).toFixed(0)}% of the table) who exist only as depth: they change what a` +
      `\n  book is worth and which acceptance cut bites, and they never play. That is the shipped design` +
      `\n  and fieldPros.ts states it in as many words ("The 1,080 new professionals are pure TABLE DEPTH...` +
      `\n  They are not in anybody's draw"). The question is whether it is ENOUGH, not whether it is honest.`,
  )
}

// =================================================================================================
section('4. ⭐ THE SLOTS-PER-PLAYER ARITHMETIC – is the bottom of the table a circuit or a list?')
{
  const counts: Record<string, number[]> = {}
  for (let s = 0; s < SEEDS; s++) {
    const evs = buildSeason(`popdepth-cal-${s}`, SEASON * WEEKS_PER_YEAR, WEEKS_PER_YEAR)
    const per: Record<string, number> = {}
    for (const e of evs) per[e.tier] = (per[e.tier] ?? 0) + 1
    for (const t of TIER_LADDER) {
      counts[t] ??= []
      counts[t].push(per[t] ?? 0)
    }
  }
  const w = createWorld('popdepth-0')
  const total = FIELD.size + w.cohort.length
  console.log(`\n  ${padE('rung', 10)}${pad('events/season', 15)}${pad('draw', 7)}${pad('CHAIRS/season', 15)}${pad('candidates', 12)}${pad('chairs per candidate', 22)}`)
  let wChairs = 0
  for (const t of W_RUNGS) {
    const n = median(counts[t] ?? [0])
    const chairs = n * TIERS[t].drawSize
    wChairs += chairs
    const [lo, hi] = TIERS[t].entrantPctBand
    const cand = Math.round((hi - lo) * total)
    console.log(
      `  ${padE(t, 10)}${pad(n, 15)}${pad(TIERS[t].drawSize, 7)}${pad(chairs, 15)}${pad(cand, 12)}${pad((chairs / Math.max(1, cand)).toFixed(2), 22)}`,
    )
  }
  console.log(`  ${padE('ALL W', 10)}${pad('', 15)}${pad('', 7)}${pad(wChairs, 15)}${pad(total, 12)}${pad((wChairs / total).toFixed(2), 22)}`)
  console.log(
    `\n  ⭐ ${(wChairs / total).toFixed(2)} W main-draw chairs per professional per season, over the WHOLE table.` +
      `\n  ⚠ A REAL PROFESSIONAL AT THIS LEVEL PLAYS ON THE ORDER OF 20 EVENTS A YEAR (docs/research/` +
      `\n  ranking-points-by-tier.md §2 counts the ITF's own per-year participation limits in that band).` +
      `\n  Read the two together: that ratio is what says whether widening the population would give the` +
      `\n  bottom rungs more life or simply lengthen a list nobody is drawn from.`,
  )
  console.log(
    `\n  ⚠⚠ AND THE HONEST CAVEAT ON THIS BLOCK: our calendar is sized for ONE PLAYER'S SEASON, not for a` +
      `\n  tour's. `+`\`buildSeason\` places the events SHE can enter; the field's own results are simulated only` +
      `\n  where she is (fieldPros.ts: "a pro's canonical results change nothing about her"). So the ratio` +
      `\n  above is a statement about the CALENDAR's size relative to the population, and the population is` +
      `\n  the half of it that is cheap to change.`,
  )
}

// =================================================================================================
section('5. WHAT WIDENING WOULD COST – the knob, and what reads it')
{
  console.log(`\n  FIELD.size is a plain constant and the field is DERIVED (zero persisted bytes, no schema,`)
  console.log(`  no migration, no golden save). Widening is a one-line change PLUS whatever reads the size:\n`)
  console.log(`    * every rung's \`entrantPctBand\` is a SHARE of the merged table, so a bigger table moves`)
  console.log(`      EVERY band's absolute floor and opening position – that is the whole mechanism of the`)
  console.log(`      population-1600 wave (its own note: "The band did not have to move; the table had to be`)
  console.log(`      the size the share was always written for").`)
  console.log(`    * the acceptance cuts are ABSOLUTE ranks and do NOT move, so widening makes every cut`)
  console.log(`      bite a smaller SHARE of the world while biting the same rank.`)
  console.log(`    * the sponsor derivation reads the field size (fieldPros.ts's own #500 note flags it).`)
  console.log(`    * a new storey needs a points band continuous with the one above it, or the curve kinks.`)
  console.log(`\n  ⚠ AND THE MEASURED TRAP FROM LAST TIME, which any widening must not repeat: the first cut of`)
  console.log(`  population-1600 stepped the core bands down TWO instead of FIVE and took Spearman(skill,`)
  console.log(`  points) from 0.888 to 0.818. The 50% storey overlap is what the correspondence is MADE of.`)
}
