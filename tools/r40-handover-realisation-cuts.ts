/**
 * r40-handover-realisation-cuts – ROUND 40 #4, the cuts the handover's BASE band is graded on.
 *
 * ⚠ THIS IS THE MEASUREMENT THE CUTS ARE, not an illustration of them (CLAUDE.md invariant 5). The
 * shipped `HANDOVER_BASE_CUTS` are p20/p80 of the distribution printed below, exactly the principle
 * the arrival cuts it replaces were chosen by (`docs/specs/childhood-prologue-build-2026-09.md` §8c:
 * p20/p80 of the fresh-fourteen distribution).
 *
 * ⚠⚠ AND IT WALKS THE SHIPPED FUNCTION, NOT A REPLICA. `tools/r40-span-and-realisation.ts` – the
 * probe that authorised the item – computed realisation inline and applied no head start, so its
 * numerator and denominator shared a baseline; the shipped `handoverRealisation` subtracts the
 * HEAD-STARTED build (what `createWorld` hands `childhoodArrival`) and divides by the potential ROLL.
 * Measuring the replica would have been CLAUDE.md's "prove the arm contains the reader" hazard in one
 * line, so this imports the engine's own function and hands it worlds.
 *
 * THE POPULATION IS THE ONE THAT HEARS THE SENTENCE: every childhood the SHIPPED CARD TABLE can
 * produce – four binary decisions at 8..11 settle the twelfth's face, which then offers two answers
 * of its own, so the reachable set is 2^4 x 2 = 32 runs. Walked rather than sampled, the same
 * enumeration `tests/prologue-handover.test.ts` walks. A fresh wizard career is NOT in it and could
 * not be: with no prologue the numerator is 0 by construction, so that distribution is a spike at
 * zero and has no quantiles to cut.
 *
 * ⚠ AND THE LOCAL OPEN QUESTIONS ARE NOT A SECOND DIMENSION – STRUCTURALLY, NOT BY MEASUREMENT.
 * `r40-span-and-realisation.ts` doubled its corpus by {declines, enters} at 11/12/13 and reported the
 * same span both ways. That conclusion is right and the doubling was never a test of it: `yearAt`
 * (src/prologue/run.ts) builds a year out of the CARD'S OWN pick and never reads `run.entries`, so an
 * entry can move the money and the weekend she played and cannot move the arrival by construction.
 * Doubling here would add 32 duplicates per seed and pretend they were samples.
 *
 * ⚠ THE WORLD IS BUILT CHEAPLY AND THE SUBSTITUTION IS PROVED, not assumed. `createWorld` builds a
 * cohort and a season of pre-history (~8 ms), which 128,000 samples cannot afford; `handoverRealisation`
 * reads `seed`, `profile`, `skills` and `potential` and nothing else, so a template world with those
 * four fields replaced is the same input. The first thing this prints is that identity against real
 * `createWorld` careers, and it EXITS NON-ZERO if it does not hold.
 *
 * ⚠ Synthetic seeds only; the owner's saves are read-only and never fixtures.
 *
 * Run: npx vite-node tools/r40-handover-realisation-cuts.ts [-- --seeds 2000]
 */
import { createWorld, startingSkills, type WorldState } from '../src/engine/world'
import { handoverBaseBand, handoverRealisation } from '../src/engine/world/coachMarket'
import { rollPotential } from '../src/engine/development'
import { childhoodArrival } from '../src/engine/childhood'
import { withHeadStart } from '../src/engine/world/player'
import { EMPTY_RUN, cardFor, chosenYears, withOrigin, withPick } from '../src/prologue/run'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { PrologueRun } from '../src/prologue/run'

const args = process.argv.slice(2)
const nSeeds = (() => {
  const i = args.indexOf('--seeds')
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : 2000
})()

const PROFILE = { ...DEFAULT_PROFILE, background: 'middle' as const }

/** ⭐ EVERY CHILDHOOD THE SHIPPED TABLE CAN PRODUCE – `tests/prologue-handover.test.ts`'s own walk,
 *  and it has to be a walk rather than a list of option ids: the TWELFTH has two faces and which one
 *  the player meets is DERIVED from years 5..11, so its answers can only be read off the run that
 *  reached it (`cardFor(12, run)`). */
const DECISION_AGES = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)
const RUNS: PrologueRun[] = (() => {
  const out: PrologueRun[] = []
  const step = (i: number, run: PrologueRun): void => {
    if (i === DECISION_AGES.length - 1) {
      for (const opt of cardFor(12, run).options ?? []) out.push(withPick(run, 12, opt.id))
      return
    }
    for (const opt of PROLOGUE_CARDS.find((c) => c.age === DECISION_AGES[i])?.options ?? []) {
      step(i + 1, withPick(run, DECISION_AGES[i], opt.id))
    }
  }
  step(0, withOrigin(EMPTY_RUN, 'middle'))
  return out
})()
const YEARS = RUNS.map((r) => chosenYears(r))

const TEMPLATE = createWorld('cuts-template', PROFILE, 'w')
function worldFor(seed: string, years: ReturnType<typeof chosenYears>): WorldState {
  const birth = startingSkills(seed, PROFILE)
  const born = withHeadStart(birth, PROFILE.birthMonth)
  return {
    ...TEMPLATE,
    seed,
    profile: PROFILE,
    skills: years.length > 0 ? childhoodArrival(born, years) : born,
    potential: rollPotential(seed, birth),
  }
}

// --- 0. the substitution, proved -----------------------------------------------------------------
let bad = 0
for (let i = 0; i < 25; i++) {
  const seed = `sub-${i}`
  for (const years of [YEARS[0], YEARS[YEARS.length - 1]]) {
    const real = createWorld(seed, PROFILE, 'p', { years: [...years], spentCents: 0 })
    const cheap = worldFor(seed, years)
    if (Math.abs(handoverRealisation(real) - handoverRealisation(cheap)) > 1e-12) bad++
    if (handoverBaseBand(real) !== handoverBaseBand(cheap)) bad++
  }
}
console.log(`\nTHE CHEAP WORLD IS THE REAL ONE: ${bad === 0 ? 'yes, 50 careers' : `NO – ${bad} mismatches`}`)
if (bad > 0) process.exit(1)

// --- 1. the distribution -------------------------------------------------------------------------
const all: number[] = []
for (let i = 0; i < nSeeds; i++) {
  for (const years of YEARS) all.push(handoverRealisation(worldFor(`cut-${i}`, years)))
}
all.sort((a, b) => a - b)
const q = (p: number) => all[Math.round(p * (all.length - 1))]
const pc = (x: number) => `${(x * 100).toFixed(1)}%`

console.log(`\nCORPUS: ${nSeeds} seeds x ${YEARS.length} runs of the shipped card table = ${all.length} childhoods\n`)
console.log('REALISATION AT FOURTEEN – what the nine years added, as a share of the room she was born with')
console.log(
  `  min ${pc(q(0))}   p05 ${pc(q(0.05))}   p20 ${pc(q(0.2))}   p50 ${pc(q(0.5))}   p80 ${pc(q(0.8))}   p95 ${pc(q(0.95))}   max ${pc(q(1))}`,
)
console.log(`\n⭐ THE CUTS – p20 / p80 of the above: ${pc(q(0.2))} / ${pc(q(0.8))}`)
console.log(`  as the shipped constants read them: ${q(0.2).toFixed(4)} / ${q(0.8).toFixed(4)}`)

// --- 2. does the sentence move? ------------------------------------------------------------------
// The number the whole item hangs on: a wider reading is worth nothing if the SENTENCE does not move
// with it. Cheapest childhood against dearest, on the same seed, through the shipped band.
let moved = 0
const N_PAIRS = Math.min(nSeeds, 200)
for (let i = 0; i < N_PAIRS; i++) {
  const seed = `cut-${i}`
  const rows = YEARS.map((years) => {
    const w = worldFor(seed, years)
    return { w, real: handoverRealisation(w) }
  })
  const cheap = rows.reduce((a, b) => (a.real <= b.real ? a : b))
  const dear = rows.reduce((a, b) => (a.real >= b.real ? a : b))
  if (handoverBaseBand(cheap.w) !== handoverBaseBand(dear.w)) moved++
}
console.log(`\n⭐ THE SENTENCE MOVES ON ${moved} of ${N_PAIRS} seeds (${((moved / N_PAIRS) * 100).toFixed(1)}%) – cheapest vs dearest`)

// --- 3. the shares, per band ---------------------------------------------------------------------
const CUTS = { below: q(0.2), ahead: q(0.8) }
const bandOf = (x: number) => (x < CUTS.below ? 'behind' : x > CUTS.ahead ? 'ahead' : 'level')
const n: Record<string, number> = { behind: 0, level: 0, ahead: 0 }
for (const x of all) n[bandOf(x)]++
console.log(
  `\nTHE SHARES at those cuts:  behind ${pc(n.behind / all.length)}   level ${pc(n.level / all.length)}   ahead ${pc(n.ahead / all.length)}`,
)
console.log('  ⚠ the middle has to hold MORE THAN HALF – `COACH_BASE_READS.level` says «most girls her age»')

// --- 4. the birth month is out of it -------------------------------------------------------------
let monthMoved = 0
for (let i = 0; i < 200; i++) {
  const seed = `month-${i}`
  // ⚠ EACH WORLD IS BUILT AT ITS OWN BIRTH MONTH, not merely relabelled – the head start is inside
  // `skills`, so a world that carries January's profile over December's build measures nothing.
  const years = YEARS[i % YEARS.length]
  const base = worldFor(seed, years)
  const janW = {
    ...base,
    profile: { ...PROFILE, birthMonth: 1 },
    skills: childhoodArrival(withHeadStart(startingSkills(seed, PROFILE), 1), years),
  }
  const decW = {
    ...base,
    profile: { ...PROFILE, birthMonth: 12 },
    skills: childhoodArrival(withHeadStart(startingSkills(seed, PROFILE), 12), years),
  }
  if (handoverBaseBand(janW) !== handoverBaseBand(decW)) monthMoved++
}
console.log(`\nTHE BIRTH MONTH moves the band on ${monthMoved} of 200 seeds – the arrival reading moved it on 43.4%`)
