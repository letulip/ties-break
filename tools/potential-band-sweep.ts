/**
 * potential-band-sweep – WHAT IS `ECONOMY.development.potentialBand` WORTH, AND WHO ELSE READS IT?
 *
 * The owner, 11.08, having looked at a career whose serve can gain 1.3 more points in its entire
 * remaining life: «по полосе неси числа пожалуйста». So this brings numbers, and it ships nothing.
 *
 * ⚠ MEASUREMENT ONLY. Every arm patches `ECONOMY.development.potentialBand` in place and restores
 * it in a `finally` – the same move `tools/skill-ceiling.ts` §4 and `tools/fatigue-bench.ts` make on
 * the live ECONOMY object. `ECONOMY` is `as const`, i.e. deeply readonly to the COMPILER and an
 * ordinary mutable object at RUNTIME; a harness that sweeps a shipped constant has to say so once
 * and out loud. No constant, no test bound and no engine behaviour is changed by this file.
 *
 * ⚠ THE OWNER'S SAVES ARE PERSONAL. `--save` reads one through the game's own import door
 * (`decodeExportFile`), exactly as tools/round15-read.ts does, and NOTHING is committed from it:
 * no fixture, no path, no career. Only the aggregate placement quoted in docs/specs/ leaves.
 *
 * THE FOUR QUESTIONS, in the order that decides how expensive the change is:
 *
 *   §0 DOES THE FIELD SHARE THE BAND? If it does, moving it moves the whole world and every
 *      calibration goes with it. If it does not, the band is a difficulty knob against a fixed
 *      field. This is measured, not reasoned about: the same seed is built under two bands and the
 *      cohort and the professional table are hashed on both sides.
 *   §1 THE DISTRIBUTION OF HER HEADROOM, per variant. Deciles, not means – the complaint is about
 *      the BOTTOM. And the per-skill MINIMUM as well as the total, because "nothing to play for" is
 *      a DEAD WING, not a low average.
 *   §2 WHAT IT DOES TO HER CAREER. Full careers 14->38, identical seeds across arms.
 *   §3 THE CEILING DISTRIBUTION IN THE FIELD TABLE'S OWN CURRENCY – the number `fieldPros.ts`'s top
 *      storey was derived from, so the blast radius can be priced rather than guessed.
 *   §4 A REAL CAREER, PLACED (optional, `--save`) – where an actual save's roll sits in that
 *      distribution, and what each variant would have made of the SAME luck.
 *   §5 WHAT BREAKS – the suite's own guard windows re-run under each band, printed against the
 *      window the test pins. Nothing is re-pinned: the point is to price a re-pin before buying it.
 *
 * Run:
 *   npx vite-node tools/potential-band-sweep.ts -- [--rolls 20000] [--seeds 8]
 *                                                 [--only 0,1,2,3,5] [--save /path/x.tsave]
 */
import { readFileSync } from 'node:fs'
import {
  openCareer,
  stepCareerWeek,
  runCareer as benchRunCareer,
  PRESETS,
  POLICIES,
  type Preset,
  type Policy,
} from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import {
  answerFork,
  answerRetirement,
  createWorld,
  startingSkills,
  tickWeek,
  seasonIndexOf,
  type WorldState,
} from '../src/engine/world'
import { withHeadStart } from '../src/engine/world/player'
import { kidAgeExact } from '../src/engine/world/age'
import { rngFromSeed } from '../src/engine/rng'
import { decodeExportFile } from '../src/engine/saveCodec'
import { SKILL_KEYS, relativeAgeHeadStart, rollPotential, type KidSkills } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { COHORT } from '../src/engine/season/cohort'
import { FIELD, fieldProsFor } from '../src/engine/season/fieldPros'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type PlayerProfile } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const ROLLS = argOf('rolls', 20000)
const CAREER_SEEDS = argOf('seeds', 8)
const NOACTION_WEEKS = argOf('drift-weeks', 208)
const onlyArg = args.indexOf('--only') >= 0 ? (args[args.indexOf('--only') + 1] ?? '') : ''
const ONLY = new Set(onlyArg.split(',').filter(Boolean))
const wants = (section: string): boolean => ONLY.size === 0 || ONLY.has(section)
const SAVES: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save') SAVES.push(args[++i])

// -------------------------------------------------------------------------------------------------
// THE VARIANTS
// -------------------------------------------------------------------------------------------------

interface Variant {
  label: string
  band: [number, number]
  /** why it is on the page – printed with the table so a reader never has to ask */
  why: string
}

/** ⚠ `[10, 20]` IS THE ONE NOBODY ASKED FOR, AND IT IS THE CONTROL THE OTHER FIVE NEED. Its mean is
 *  15 – EXACTLY the shipped band's – so it changes the SPREAD and nothing else. If the complaint is
 *  "the bottom of the distribution has nothing to play for", this variant answers it without making
 *  a single career better on average; if the numbers say the median has to move too, this is the arm
 *  that proves it. Every other variant confounds "raise the floor" with "raise everyone". */
const VARIANTS: Variant[] = [
  { label: 'baseline  [4, 26]', band: [4, 26], why: 'as shipped' },
  { label: 'floor+3   [7, 26]', band: [7, 26], why: 'half a floor lift – is the cheap half enough?' },
  { label: 'floor+6   [10, 26]', band: [10, 26], why: 'the asked floor lift' },
  { label: 'spread    [10, 20]', band: [10, 20], why: 'MEAN-PRESERVING (15, as shipped): variance only' },
  { label: 'top+14    [4, 40]', band: [4, 40], why: 'the asked ceiling lift' },
  { label: 'both      [10, 40]', band: [10, 40], why: 'both' },
]

/** Patch the live band, run, and put it back whatever happens. The array is mutated ELEMENTWISE
 *  rather than replaced, because `ECONOMY.development.potentialBand` is destructured by identity in
 *  `rollPotential` and a replaced array would leave any captured reference pointing at the old one. */
function withBand<T>(band: readonly [number, number], fn: () => T): T {
  const d = ECONOMY.development as unknown as { potentialBand: [number, number] }
  const lo = d.potentialBand[0]
  const hi = d.potentialBand[1]
  d.potentialBand[0] = band[0]
  d.potentialBand[1] = band[1]
  try {
    return fn()
  } finally {
    d.potentialBand[0] = lo
    d.potentialBand[1] = hi
  }
}

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
function pctl(xs: readonly number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}
function mean(xs: readonly number[]): number {
  return xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length
}
function share(xs: readonly boolean[]): number {
  return xs.length === 0 ? NaN : (100 * xs.filter(Boolean).length) / xs.length
}
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function f1(x: number): string {
  return Number.isFinite(x) ? x.toFixed(1) : '   –'
}
function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}
function rule(n = 108): string {
  return '='.repeat(n)
}
/** The FIELD table's own currency: `power()` is the mean of FOUR (the cohort has no groundstroke),
 *  so every comparison against `FIELD.tiers[].core` has to drop the fifth attribute or it is
 *  comparing two different rulers. Same rule as tools/skill-ceiling.ts. */
function meanFour(s: KidSkills): number {
  return (s.serve + s.ret + s.composure + s.stamina) / 4
}
function meanFive(s: KidSkills): number {
  return SKILL_KEYS.reduce((a, k) => a + s[k], 0) / SKILL_KEYS.length
}

/** FNV-1a over a number stream, quantised to 1e-6 so a hash means "these are the same numbers" and
 *  not "these floats printed the same". Used only to compare two runs of the SAME code. */
function hashNumbers(xs: Iterable<number>): string {
  let h = 0x811c9dc5
  for (const x of xs) {
    const q = String(Math.round(x * 1e6))
    for (let i = 0; i < q.length; i++) {
      h ^= q.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    h ^= 0x2c
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function cohortHash(w: WorldState): string {
  return hashNumbers(
    w.cohort.flatMap((p) => [
      p.serve,
      p.ret,
      p.composure,
      p.stamina,
      p.growth,
      p.ageYears,
      p.potential.serve,
      p.potential.ret,
      p.potential.composure,
      p.potential.stamina,
    ]),
  )
}

/** ⚠ `wtaPoints`, NOT `points` – and the first cut of this line said `points`, which `FieldPro` does
 *  not have. vite-node strips types, so it ran: every pro contributed `NaN` to that column and the
 *  professional table was compared on five fields instead of six. Only `vue-tsc -b --force` ever sees
 *  this class of error, which is why CLAUDE.md insists the gate runs it. */
function fieldHash(w: WorldState): string {
  const pros = fieldProsFor(w.seed, seasonIndexOf(w.week), w.cohort.map((p) => p.name))
  return hashNumbers(
    pros.flatMap((p) => [p.serve, p.ret, p.composure, p.stamina, p.groundstrokes, p.wtaPoints, p.ageYears]),
  )
}

// =================================================================================================
// §0  DOES THE FIELD SHARE THE BAND?  – the question that prices the change
// =================================================================================================

function section0(): void {
  console.log(`\n${rule()}`)
  console.log('§0  DOES THE FIELD SHARE THE BAND? – established FIRST, because it decides the blast radius')
  console.log(rule())

  console.log(`
  THE STATIC ANSWER, from the only three populations in the game:

    population            ceiling model                                        reads ECONOMY.development.potentialBand?
    ------------------------------------------------------------------------------------------------------------------
    THE KID               rollPotential(): start + U(${ECONOMY.development.potentialBand[0]}, ${ECONOMY.development.potentialBand[1]}), once at birth          YES – and it is the ONLY reader in src/
    THE JUNIOR COHORT     makeJunior():    start + U(${COHORT.potentialBand[0]}, ${COHORT.potentialBand[1]}) per attribute,          NO – its own COHORT.potentialBand,
      (199 rivals)                         times a hidden growth multiplier 0.5..1.5        plus COHORT.ageCurve, in season/cohort.ts
    THE PROFESSIONALS     fieldProsFor():  growth 1, potential = where she stands.          NO – inert. A pro's strength is a
      (${FIELD.size} chairs)                    Her arc is a POINTS arc, not a skill arc.        percentile draw from FIELD.tiers[].core

  The two bands were never one number wearing two hats: the cohort's is [${COHORT.potentialBand[0]}, ${COHORT.potentialBand[1]}] and has been since v20,
  and season/cohort.ts's own header says why ("most juniors never become anything"). ⚠ AND THAT IS A
  COMMENT, so it is verified below by construction rather than believed.
`)

  const seed = 'band-field-probe'
  const profile: PlayerProfile = { ...DEFAULT_PROFILE }
  // ⚠ A COPY, NOT THE LIVE ARRAY. `withBand` mutates `ECONOMY.development.potentialBand` ELEMENTWISE,
  // so a reference to it would silently read [10, 40] inside the probe arm and print the wrong header.
  const baseline: [number, number] = [ECONOMY.development.potentialBand[0], ECONOMY.development.potentialBand[1]]
  const probe: [number, number] = [10, 40]

  // --- (a) AT BIRTH -------------------------------------------------------------------------
  const a = withBand(baseline, () => {
    const w = createWorld(seed, profile)
    return { cohort: cohortHash(w), field: fieldHash(w), pot: { ...w.potential }, skills: { ...w.skills } }
  })
  const b = withBand(probe, () => {
    const w = createWorld(seed, profile)
    return { cohort: cohortHash(w), field: fieldHash(w), pot: { ...w.potential }, skills: { ...w.skills } }
  })

  console.log(`  (a) AT BIRTH – same seed "${seed}", band [${baseline[0]}, ${baseline[1]}] vs [${probe[0]}, ${probe[1]}]:\n`)
  console.log(`      ${padEnd('what', 34)}${pad(`[${baseline[0]}, ${baseline[1]}]`, 12)}${pad(`[${probe[0]}, ${probe[1]}]`, 12)}   verdict`)
  const row = (label: string, x: string, y: string): void =>
    console.log(`      ${padEnd(label, 34)}${pad(x, 12)}${pad(y, 12)}   ${x === y ? 'IDENTICAL' : 'MOVED'}`)
  row('cohort hash (199 juniors)', a.cohort, b.cohort)
  row(`field-pro hash (${FIELD.size} pros)`, a.field, b.field)
  row('her START build', hashNumbers(SKILL_KEYS.map((k) => a.skills[k])), hashNumbers(SKILL_KEYS.map((k) => b.skills[k])))
  row('her CEILING', hashNumbers(SKILL_KEYS.map((k) => a.pot[k])), hashNumbers(SKILL_KEYS.map((k) => b.pot[k])))
  console.log(
    `\n      her ceiling, mean-of-five: ${meanFive(a.pot).toFixed(2)} -> ${meanFive(b.pot).toFixed(2)}` +
      `   (+${(meanFive(b.pot) - meanFive(a.pot)).toFixed(2)})`,
  )

  // --- (b) AFTER A NO-ACTION CAREER ----------------------------------------------------------
  // The field's SKILLS are driven by driftCohort off the MAIN weekly stream. If the band leaked into
  // that anywhere, a run of the same length under two bands would diverge. A no-action run isolates
  // the world's own clock from anything the player does.
  const drift = (band: readonly [number, number]): string =>
    withBand(band, () => {
      const w = createWorld(seed, profile)
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < NOACTION_WEEKS && w.ending === null; i++) {
        if (w.fork !== null && w.fork.answer === null) answerFork(w, 'continue')
        if (w.retirementOffer !== null) answerRetirement(w, false)
        tickWeek(w, rng)
      }
      return cohortHash(w)
    })
  const da = drift(baseline)
  const db = drift(probe)
  console.log(`\n  (b) AFTER ${NOACTION_WEEKS} NO-ACTION WEEKS – she enters nothing, the world runs its own clock:\n`)
  row('cohort hash after drift', da, db)

  // --- (c) AFTER A REAL CAREER ---------------------------------------------------------------
  // The stronger claim, and the one the owner actually cares about: she PLAYS, wins more under the
  // wider band, and the field still does not get better at tennis. If this diverges, the band is
  // reaching the world through her results and the blast radius is not small.
  const played = (band: readonly [number, number]): { cohort: string; rank: number; prize: number } =>
    withBand(band, () => {
      const { world, rng } = openCareer(PRESETS[5], 0, POLICIES[1])
      for (let i = 0; i < NOACTION_WEEKS && world.ending === null; i++) {
        if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
        if (world.retirementOffer !== null) answerRetirement(world, false)
        stepCareerWeek(world, rng, POLICIES[1])
      }
      return { cohort: cohortHash(world), rank: world.kidRank, prize: world.careerTotals.prizeCents }
    })
  const pa = played(baseline)
  const pb = played(probe)
  console.log(`\n  (c) AFTER ${NOACTION_WEEKS} PLAYED WEEKS – she enters, wins, and moves the standings:\n`)
  row('cohort hash after a real career', pa.cohort, pb.cohort)
  console.log(
    `      ${padEnd('her ITF rank / prize', 34)}${pad(`#${pa.rank} ${money(pa.prize)}`, 12)}` +
      `${pad(`#${pb.rank} ${money(pb.prize)}`, 12)}   <- SHE moves; they do not`,
  )

  console.log(`
  ⚠ THE SECOND-ORDER COUPLING THAT DOES EXIST, so nobody reads the hashes as "nothing changes":
    (1) THE STANDINGS MOVE, because she does. Nobody gets better at tennis, but a better career takes
        places off people, and every rung's entrant window is a PERCENTILE of a table she is in.
    (2) THE CALIBRATION IS DERIVED FROM THE BAND, ON PAPER. season/fieldPros.ts sets its top storey's
        core band to [${FIELD.tiers[0].core[0]}, ${FIELD.tiers[0].core[1]}] and says why in as many words: "20,000 rolls ... p50 63.2 · p90 68.8 ·
        p99 73.2 · max 80.8 ... the storey's top sits at the midpoint of those two, core 77". That is
        a DESIGN-TIME read of rollPotential, not a runtime one – so widening the band does not move a
        single pro, but it DOES invalidate the argument for where the world #1 was put. §3 restates
        that distribution under every variant, which is exactly what has to be re-argued.
`)
}

// =================================================================================================
// §1  THE DISTRIBUTION OF HER HEADROOM
// =================================================================================================
//
// ⚠ THE HEADROOM IS INDEPENDENT OF THE START, WHICH IS WHAT MAKES THIS A PAIRED COMPARISON.
// `rollPotential` is `start[k] + lo + u_k (hi - lo)` where u_k is the k-th draw off `seed:potential`
// – so a seed's five u's are FIXED, and every variant is the same girl's luck priced on a different
// scale. No variance is spent on re-rolling the population between arms.

interface HeadroomRow {
  /** total over the five skills */
  total: number
  /** the WORST wing – the one the owner is looking at when he says there is nothing to play for */
  min: number
  /** wings under 5 points: a skill whose entire remaining career is a rounding error */
  deadWings: number
  /** her ceiling in the FIELD table's currency (mean of four) */
  core: number
}

function rollRows(band: readonly [number, number], n: number): HeadroomRow[] {
  return withBand(band, () => {
    const out: HeadroomRow[] = []
    for (let i = 0; i < n; i++) {
      const seed = `band-sweep-${i}`
      const start = startingSkills(seed, DEFAULT_PROFILE)
      const pot = rollPotential(seed, start)
      const heads = SKILL_KEYS.map((k) => pot[k] - start[k])
      out.push({
        total: heads.reduce((a, b) => a + b, 0),
        min: Math.min(...heads),
        deadWings: heads.filter((h) => h < 5).length,
        core: meanFour(pot),
      })
    }
    return out
  })
}

function section1(): Map<string, HeadroomRow[]> {
  console.log(`\n${rule()}`)
  console.log('§1  THE DISTRIBUTION OF HER HEADROOM – deciles, because the complaint is about the BOTTOM')
  console.log(rule())
  console.log(`\n  ${ROLLS.toLocaleString('en-US')} rolls per variant, IDENTICAL seeds across arms (the same girl's luck, priced differently).`)
  console.log(`  TOTAL HEADROOM = the sum over her five skills of (ceiling - start): every point she can ever add.\n`)

  const rows = new Map<string, HeadroomRow[]>()
  for (const v of VARIANTS) rows.set(v.label, rollRows(v.band, ROLLS))

  const DECILES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  console.log(`  (a) TOTAL HEADROOM, five skills together – deciles\n`)
  console.log(`  ${padEnd('variant', 20)}${DECILES.map((d) => pad(d === 0 ? 'min' : d === 1 ? 'max' : `p${Math.round(d * 100)}`, 7)).join('')}${pad('mean', 8)}`)
  for (const v of VARIANTS) {
    const xs = rows.get(v.label)!.map((r) => r.total)
    console.log(`  ${padEnd(v.label, 20)}${DECILES.map((d) => pad(f1(pctl(xs, d === 1 ? 0.9999 : d)), 7)).join('')}${pad(f1(mean(xs)), 8)}`)
  }

  console.log(`\n  (b) THE WORST WING – min over the five skills. THIS is the "her serve can gain 1.3 points" number.\n`)
  console.log(`  ${padEnd('variant', 20)}${DECILES.map((d) => pad(d === 0 ? 'min' : d === 1 ? 'max' : `p${Math.round(d * 100)}`, 7)).join('')}${pad('mean', 8)}`)
  for (const v of VARIANTS) {
    const xs = rows.get(v.label)!.map((r) => r.min)
    console.log(`  ${padEnd(v.label, 20)}${DECILES.map((d) => pad(f1(pctl(xs, d === 1 ? 0.9999 : d)), 7)).join('')}${pad(f1(mean(xs)), 8)}`)
  }

  console.log(`\n  (c) THE SHARES – the shape of the bottom, said as a probability\n`)
  const SHARES: Array<[string, (r: HeadroomRow) => boolean]> = [
    ['total headroom under 30 pts', (r) => r.total < 30],
    ['total headroom under 40 pts', (r) => r.total < 40],
    ['total headroom under 50 pts', (r) => r.total < 50],
    ['>=1 DEAD WING (a skill under 5)', (r) => r.deadWings >= 1],
    ['>=2 dead wings', (r) => r.deadWings >= 2],
    ['>=3 dead wings', (r) => r.deadWings >= 3],
    ['worst wing under 8 pts', (r) => r.min < 8],
    ['ceiling core over 73 (p99 today)', (r) => r.core > 73],
    ['ceiling core over 77 (world #1)', (r) => r.core > 77],
  ]
  console.log(`  ${padEnd('variant', 20)}${SHARES.map((s) => pad(s[0].slice(0, 9), 10)).join('')}`)
  console.log(`  ${padEnd('', 20)}${SHARES.map((_, i) => pad(`(${i + 1})`, 10)).join('')}`)
  for (const v of VARIANTS) {
    const rs = rows.get(v.label)!
    console.log(`  ${padEnd(v.label, 20)}${SHARES.map(([, f]) => pad(`${share(rs.map(f)).toFixed(1)}%`, 10)).join('')}`)
  }
  console.log(`\n  legend:`)
  SHARES.forEach(([label], i) => console.log(`    (${i + 1}) ${label}`))
  console.log(`\n  ⚠ A DEAD WING IS THE UNIT OF THE COMPLAINT. A career with 45 total points of headroom split`)
  console.log(`    5/5/5/25/5 is not the same career as one split 9/9/9/9/9, and only the second one has five`)
  console.log(`    things to train. The band's FLOOR is the only dial that touches this; its top cannot.`)
  return rows
}

// =================================================================================================
// §2  WHAT IT DOES TO HER CAREER
// =================================================================================================

interface CareerRow {
  winRate: number
  matches: number
  bestWtaRank: number | null
  bestItfRank: number
  bestRung: TierId | null
  titles: number
  prizeCents: number
  peakMeanFive: number
  peakCore: number
  /** share of her OWN headroom she actually realised – the model's honesty check */
  realised: number
  endedAge: number | null
  ending: string | null
}

function runCareer(preset: Preset, index: number, policy: Policy): CareerRow {
  const { world, rng } = openCareer(preset, index, policy)
  const start: KidSkills = { ...world.skills }
  const potential: KidSkills = { ...world.potential }
  const peak: KidSkills = { ...world.skills }
  let peakMeanFive = meanFive(world.skills)
  let peakCore = meanFour(world.skills)
  let bestWtaRank: number | null = null
  let bestItfRank = world.kidRank

  for (let i = 0; i < FULL_CAREER_WEEKS && world.ending === null; i++) {
    // The endings bench's own `sweepGrace` trick: a career that dies of money at seventeen measures
    // the family's bank balance, not the ceiling. Every arm gets the same defusal, so the comparison
    // is about the band and nothing else.
    world.debtSinceWeek = null
    stepCareerWeek(world, rng, policy)
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    // `plays-on`: one more year to everything until the game stops asking. An arm measuring a GROWTH
    // curve has to, or half the careers stop before the curve does.
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    for (const k of SKILL_KEYS) if (world.skills[k] > peak[k]) peak[k] = world.skills[k]
    const m = meanFive(world.skills)
    if (m > peakMeanFive) {
      peakMeanFive = m
      peakCore = meanFour(world.skills)
    }
    if (world.kidRank < bestItfRank) bestItfRank = world.kidRank
    // Guarded on having been PAID – money-decomposition's rule against the point-less dense-rank-1 tie.
    if (world.careerTotals.prizeCents > 0) {
      const wta = world.kidRankWta ?? world.cohort.length + 1
      if (bestWtaRank === null || wta < bestWtaRank) bestWtaRank = wta
    }
  }

  // Wins over the WHOLE career come off `seasonHistory` plus the live season – never off `results`,
  // which `pruneResults` keeps to a rolling 52 weeks (tools/winrate-read.ts's own rule).
  let wins = world.seasonWins
  let losses = world.seasonLosses
  for (const s of world.seasonHistory) {
    wins += s.wins
    losses += s.losses
  }

  let titles = 0
  let bestRung: TierId | null = null
  for (const t of Object.values(world.trophiesByTier ?? {})) {
    const row = t as { titles?: number[] }
    titles += row?.titles?.length ?? 0
  }
  for (const t of TIER_LADDER) if (world.bestFinishByTier[t] !== undefined) bestRung = t

  let realisedSum = 0
  for (const k of SKILL_KEYS) {
    const head = potential[k] - start[k]
    realisedSum += head > 0 ? Math.min(1, Math.max(0, (peak[k] - start[k]) / head)) : 1
  }

  return {
    winRate: (100 * wins) / Math.max(1, wins + losses),
    matches: wins + losses,
    bestWtaRank,
    bestItfRank,
    bestRung,
    titles,
    prizeCents: world.careerTotals.prizeCents,
    peakMeanFive,
    peakCore,
    realised: realisedSum / SKILL_KEYS.length,
    endedAge: world.ending ? kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) : null,
    ending: world.ending?.type ?? null,
  }
}

/** The two cells the owner's own careers are shaped like (tools/two-cells.ts's arms): the working
 *  family that self-coaches, and the middle family that hires. Both walked to age 38. */
const CELLS: Array<{ label: string; preset: Preset }> = [
  { label: '8k  · working · self-coached', preset: PRESETS[0] },
  { label: '25k · middle  · middle coach', preset: PRESETS[5] },
]

function section2(): void {
  console.log(`\n${rule()}`)
  console.log('§2  WHAT IT DOES TO HER CAREER – full careers 14->38, identical seeds across arms')
  console.log(rule())
  console.log(`\n  ${CAREER_SEEDS} seeds per cell per variant, "${POLICIES[1].label}" policy (someone actually managing it),`)
  console.log(`  bankruptcy defused every week and every retirement offer refused until the game stops asking.\n`)

  for (const cell of CELLS) {
    console.log(`  ${'-'.repeat(104)}`)
    console.log(`  ${cell.label}`)
    console.log(`  ${'-'.repeat(104)}`)
    console.log(
      `  ${padEnd('variant', 20)}${pad('peak skill', 11)}${pad('d skill', 9)}${pad('realised', 10)}` +
        `${pad('win rate', 10)}${pad('best W', 9)}${pad('median W', 10)}${pad('paid', 7)}` +
        `${pad('titles', 8)}${pad('prize (median)', 16)}${pad('best rung', 11)}`,
    )
    let baseSkill = NaN
    for (const v of VARIANTS) {
      const rows = withBand(v.band, () => {
        const out: CareerRow[] = []
        for (let i = 0; i < CAREER_SEEDS; i++) out.push(runCareer(cell.preset, i, POLICIES[1]))
        return out
      })
      const skill = mean(rows.map((r) => r.peakMeanFive))
      if (Number.isNaN(baseSkill)) baseSkill = skill
      const ranked = rows.filter((r) => r.bestWtaRank !== null).map((r) => r.bestWtaRank as number)
      const rungs: Record<string, number> = {}
      for (const r of rows) if (r.bestRung) rungs[r.bestRung] = (rungs[r.bestRung] ?? 0) + 1
      const topRung = [...TIER_LADDER].reverse().find((t) => rungs[t]) ?? null
      console.log(
        `  ${padEnd(v.label, 20)}${pad(skill.toFixed(2), 11)}` +
          `${pad((skill - baseSkill >= 0 ? '+' : '') + (skill - baseSkill).toFixed(2), 9)}` +
          `${pad(`${(100 * mean(rows.map((r) => r.realised))).toFixed(1)}%`, 10)}` +
          `${pad(`${mean(rows.map((r) => r.winRate)).toFixed(1)}%`, 10)}` +
          `${pad(ranked.length ? `#${Math.min(...ranked)}` : '–', 9)}` +
          `${pad(ranked.length ? `#${pctl(ranked, 0.5).toFixed(0)}` : '–', 10)}` +
          `${pad(`${ranked.length}/${rows.length}`, 7)}` +
          `${pad(mean(rows.map((r) => r.titles)).toFixed(1), 8)}` +
          `${pad(money(pctl(rows.map((r) => r.prizeCents), 0.5)), 16)}` +
          `${pad(topRung ?? '–', 11)}`,
      )
    }
    console.log()
  }
}

// =================================================================================================
// §3  THE CEILING IN THE FIELD TABLE'S OWN CURRENCY – what has to be re-argued
// =================================================================================================

function section3(rows: Map<string, HeadroomRow[]> | null): void {
  console.log(`\n${rule()}`)
  console.log('§3  THE CEILING DISTRIBUTION IN THE FIELD TABLE\'S CURRENCY – the number fieldPros.ts derives from')
  console.log(rule())
  console.log(`
  season/fieldPros.ts puts the world #1 at core ${FIELD.tiers[0].core[1]} and argues it FROM this distribution: "a world #1
  above the MAX is a backdrop nobody can ever climb; a world #1 at the p99 is one every good career
  equals. So the storey's top sits at the midpoint of those two". Move the band and that midpoint
  moves – no pro changes, but the sentence stops being true.
`)
  const src = rows ?? new Map(VARIANTS.map((v) => [v.label, rollRows(v.band, ROLLS)]))
  console.log(
    `  ${padEnd('variant', 20)}${pad('p50', 9)}${pad('p90', 9)}${pad('p99', 9)}${pad('max', 9)}` +
      `${pad('midpoint(p99,max)', 20)}${pad('vs shipped 77', 15)}`,
  )
  for (const v of VARIANTS) {
    const cores = src.get(v.label)!.map((r) => r.core)
    const p99 = pctl(cores, 0.99)
    const mx = Math.max(...cores)
    const mid = (p99 + mx) / 2
    console.log(
      `  ${padEnd(v.label, 20)}${pad(f1(pctl(cores, 0.5)), 9)}${pad(f1(pctl(cores, 0.9)), 9)}` +
        `${pad(f1(p99), 9)}${pad(f1(mx), 9)}${pad(f1(mid), 20)}` +
        `${pad(`${mid - FIELD.tiers[0].core[1] >= 0 ? '+' : ''}${(mid - FIELD.tiers[0].core[1]).toFixed(1)}`, 15)}`,
    )
  }
  console.log(`\n  ⚠ READ THE LAST COLUMN AS THE PRICE OF THE VARIANT. A row near zero costs nothing in`)
  console.log(`    fieldPros.ts; a row well above it means the top storey has to be re-derived and every`)
  console.log(`    number that hangs off it (entrant bands, the points curve, the W-rung cuts) re-measured.`)
}

// =================================================================================================
// §5  WHAT BREAKS – the shipped guards, re-run under each band WITHOUT touching them
// =================================================================================================
//
// ⚠ THE GUARDS ARE REPRODUCED, NOT EDITED AND NOT RE-PINNED. Both windows below are copied out of
// tests/econ-reach.test.ts – the same preset, the same horizon, the same 30 indices, the same
// predicate (`reachedWeek !== null`) – and printed against the test's own pinned band. Nothing here
// imports vitest and nothing here writes to a test file: the point is to tell the owner what a
// variant would COST in re-pinning before he buys it, and a measurement that re-pins the thing it
// measures cannot do that.
//
// These two are the only tight NUMERIC windows in the suite that a ceiling change can reach. Every
// other test that names `potential` sets it as a literal fixture (radar, academy, coachTiers,
// match-bonus) and is therefore band-blind by construction; `tests/relative-age.test.ts`'s
// `potentialBand` guard is about COHORT.potentialBand [1, 22], which no variant here touches.

interface Guard {
  file: string
  what: string
  /** the pinned window the test asserts, and the value recorded when it was last re-pointed */
  window: [number, number]
  anchor: number
  run: () => number
}

function guards(): Guard[] {
  const working = PRESETS.find((p) => p.background === 'working' && p.coachTier === 'self')!
  const middleSelf = PRESETS.find((p) => p.background === 'middle' && p.coachTier === 'self')!
  return [
    {
      file: 'tests/econ-reach.test.ts',
      what: '14->18 pro proxy (middle·self, top-50 once ranked), of 30',
      window: [7, 21],
      anchor: 13,
      run: () =>
        Array.from({ length: 30 }, (_, i) => runCareerReach(middleSelf, i, 208)).filter((r) => r !== null).length,
    },
    {
      file: 'tests/econ-reach.test.ts',
      what: '14->16 domestic door (working·self, 250 pts), of 30',
      window: [4, 20],
      anchor: 11,
      run: () =>
        Array.from({ length: 30 }, (_, i) => runCareerReach(working, i, 104)).filter((r) => r !== null).length,
    },
  ]
}

/** econ-bench's own `runCareer`, reduced to the one field the guards read. Kept as a named wrapper
 *  so the import is obviously the SHIPPED runner and not a re-implementation of it. */
function runCareerReach(preset: Preset, index: number, weeks: number): number | null {
  return benchRunCareer(preset, index, weeks).reachedWeek
}

function section5(): void {
  console.log(`\n${rule()}`)
  console.log('§5  WHAT BREAKS – the shipped guard windows, re-run under each band (nothing re-pinned)')
  console.log(rule())
  for (const g of guards()) {
    console.log(`\n  ${g.file} · ${g.what}`)
    console.log(`  pinned window [${g.window[0]}, ${g.window[1]}], anchored at ${g.anchor}\n`)
    console.log(`  ${padEnd('variant', 20)}${pad('measured', 10)}${pad('vs anchor', 11)}   verdict`)
    for (const v of VARIANTS) {
      const n = withBand(v.band, g.run)
      const inWindow = n >= g.window[0] && n <= g.window[1]
      console.log(
        `  ${padEnd(v.label, 20)}${pad(n, 10)}${pad(`${n - g.anchor >= 0 ? '+' : ''}${n - g.anchor}`, 11)}   ` +
          `${inWindow ? 'inside the window' : '⚠ RED – outside the pinned window'}`,
      )
    }
  }
  console.log(`
  ⚠ AND THE ANCHORS THAT ARE NOT TESTS. These are DOCUMENTED MEASUREMENTS – nothing goes red, but a
  variant makes each of them a lie until it is re-run:

    src/engine/season/fieldPros.ts  the derivation of the top storey's core [67, 77] quotes
                                    "p50 63.2 · p90 68.8 · p99 73.2 · max 80.8" as its argument.  §3
    tools/world-turnover.ts         ANCHORS: p90 career core 68.8 · p99 73.2 · max talent 80.8.    §3
    tools/field-quality.ts          prints KID CEILING p50/p90/p99/max on every run.               §3
    tools/skill-ceiling.ts          §4's dial table already carries a 'potentialBand hi 26 -> 40'
                                    arm; a shipped change makes its BASELINE row the new one.      §2
    tools/ladder-walk.ts            "rollPotential's own p99 is ~73 mean-of-four" sets the walk's
                                    ceiling for the whole ladder trace.                            §3
    docs/specs/skill-model-audit-2026-08.md   §8's dial ranking and §11's row 1 are stated against
                                    the shipped band; its P6 finding (+7.25 skill moved the best
                                    rank #203 -> #139) is the same arm as top+14 here.             §2
`)
}

// =================================================================================================
// §4  HER OWN CAREER, PLACED – optional, reads a personal save through the game's import door
// =================================================================================================

async function section4(paths: string[]): Promise<void> {
  console.log(`\n${rule()}`)
  console.log('§4  A REAL CAREER, PLACED IN THE DISTRIBUTION – read locally, never committed')
  console.log(rule())
  console.log(`
  ⚠ THE ONE ARITHMETIC TRAP IN READING A SAVE FOR THIS. Her ceiling is rolled off her BIRTH build,
  never the head-started one (development.ts: "Being born in January must not make her able to get
  BETTER, only to be further along right now"). So \`potential[k] - startingSkills(...)\` is the TRUE
  roll, and \`potential[k] - withHeadStart(...)\` – the number a screen would show – understates it by
  exactly \`relativeAgeHeadStart(birthMonth)\` on every skill. Both are printed.
`)
  for (const path of paths) {
    const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
    const birth = startingSkills(w.seed, w.profile)
    const shown = withHeadStart(birth, w.profile.birthMonth)
    const bump = relativeAgeHeadStart(w.profile.birthMonth)
    console.log(`\n  career at week ${w.week}, age ${kidAgeExact(w.week, w.profile.birthMonth, w.profile.birthDay).toFixed(1)}, head start ${bump >= 0 ? '+' : ''}${bump.toFixed(2)}\n`)
    console.log(
      `  ${padEnd('skill', 16)}${pad('birth', 8)}${pad('shown', 8)}${pad('now', 8)}${pad('ceiling', 9)}` +
        `${pad('TRUE roll', 11)}${pad('u in band', 11)}${VARIANTS.map((v) => pad(v.label.split(' ')[0], 10)).join('')}`,
    )
    const [lo, hi] = ECONOMY.development.potentialBand
    let trueTotal = 0
    for (const k of SKILL_KEYS) {
      const trueRoll = w.potential[k] - birth[k]
      trueTotal += trueRoll
      const u = (trueRoll - lo) / (hi - lo)
      console.log(
        `  ${padEnd(k, 16)}${pad(f1(birth[k]), 8)}${pad(f1(shown[k]), 8)}${pad(f1(w.skills[k]), 8)}` +
          `${pad(f1(w.potential[k]), 9)}${pad(f1(trueRoll), 11)}${pad(u.toFixed(3), 11)}` +
          `${VARIANTS.map((v) => pad(f1(v.band[0] + u * (v.band[1] - v.band[0])), 10)).join('')}`,
      )
    }
    console.log(
      `  ${padEnd('TOTAL', 16)}${pad('', 8)}${pad('', 8)}${pad('', 8)}${pad('', 9)}${pad(f1(trueTotal), 11)}${pad('', 11)}` +
        `${VARIANTS.map((v) => {
          const t = SKILL_KEYS.reduce((a, k) => {
            const u = (w.potential[k] - birth[k] - lo) / (hi - lo)
            return a + v.band[0] + u * (v.band[1] - v.band[0])
          }, 0)
          return pad(f1(t), 10)
        }).join('')}`,
    )
    // Where that total sits in the population, per variant.
    console.log(`\n  her percentile in ${ROLLS.toLocaleString('en-US')} rolls, per variant:`)
    for (const v of VARIANTS) {
      const totals = rollRows(v.band, Math.min(ROLLS, 20000)).map((r) => r.total)
      const hers = SKILL_KEYS.reduce((a, k) => {
        const u = (w.potential[k] - birth[k] - lo) / (hi - lo)
        return a + v.band[0] + u * (v.band[1] - v.band[0])
      }, 0)
      const below = totals.filter((t) => t < hers).length
      const worstWing = Math.min(
        ...SKILL_KEYS.map((k) => {
          const u = (w.potential[k] - birth[k] - lo) / (hi - lo)
          return v.band[0] + u * (v.band[1] - v.band[0])
        }),
      )
      console.log(
        `    ${padEnd(v.label, 20)} total ${pad(f1(hers), 6)}  = p${pad(((100 * below) / totals.length).toFixed(0), 3)}` +
          `   worst wing ${pad(f1(worstWing), 6)}`,
      )
    }
  }
}

// -------------------------------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\npotential-band-sweep · shipped band [${ECONOMY.development.potentialBand[0]}, ${ECONOMY.development.potentialBand[1]}] · ${ROLLS.toLocaleString('en-US')} rolls · ${CAREER_SEEDS} career seeds`)
  console.log(`variants: ${VARIANTS.map((v) => v.label.trim()).join('  ·  ')}`)
  for (const v of VARIANTS) console.log(`   ${padEnd(v.label, 20)} ${v.why}`)

  if (wants('0')) section0()
  let rows: Map<string, HeadroomRow[]> | null = null
  if (wants('1')) rows = section1()
  if (wants('2')) section2()
  if (wants('3')) section3(rows)
  if (wants('5')) section5()
  if (SAVES.length && wants('4')) await section4(SAVES)

  // ⚠ THE HARNESS'S OWN GUARD. Every arm restores what it patched in a `finally`; this proves it
  // rather than trusting it, because a sweep that leaks a constant into a later section publishes
  // numbers nobody can reproduce.
  const [lo, hi] = ECONOMY.development.potentialBand
  console.log(`\n  band on exit: [${lo}, ${hi}] ${lo === 4 && hi === 26 ? '– restored, as shipped' : '⚠⚠ NOT RESTORED'}`)
  if (lo !== 4 || hi !== 26) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
