/**
 * form-g-sweep – ROUND 43 ITEM B: HOW FAR INTO THE CLAMPS `G` LETS A REAL CAREER TRAVEL.
 * docs/specs/the-form-and-the-sparring-2026-09.md §10b, and the owner of 17.09: «что предлагаешь,
 * давай попробуем. Важно не переборщить», then «меряй».
 *
 * ⚠⚠ WHY THIS IS A SEPARATE FILE AND NOT A FLAG ON `form-bench`. `form-bench` fits `K` against the
 * ruled corridor and prices the CLAMPS; §10b then found that the corridor prices a place no career
 * visits – p5/p95 of −4.0/+1.9 against clamps at ±10 and 0.0% of weeks within a point of one. The
 * question this file answers is the other half and it needs a different denominator: not «what is a
 * point of form worth at the clamp» but «how far in does she actually get, and what is THAT worth».
 * Every figure below is therefore LIVED – read off the career's own trace, never off ±10.
 *
 * ⚠ `K` IS NOT SWEPT HERE AND MUST NOT BE. The owner ruled the [0.5, 4] pp corridor and `K` is its
 * fitted consequence (O1, 16.09); `G` is how far form travels, `K` is what a point of it is worth.
 * A file that moved both would be unable to say which one did anything.
 *
 * WHAT IT MEASURES:
 *
 *   §0 THE ARM, PROVEN. An ABSURD `G` against the shipped one, on the census itself. If the lived
 *      band does not move, nothing below means anything (CLAUDE.md: «set the constant to an absurd
 *      value and watch the output move; if it does not, the arm is wrong before the hypothesis is»).
 *   §1 THE SWEEP. One census per candidate `G`: the lived p5/p95 of `form`, the share of weeks
 *      within one point of a clamp, the share AT a clamp, and the extremes any career reached.
 *   §2 THE LIVED pp SWING. What the p5→p95 band of each arm is worth in realised match win rate,
 *      against the field a professional career meets – the number §10b calls «0.5–0.7 pp» on the
 *      shipped arm, as against the 1.64 pp the mechanism can reach clamp-to-clamp.
 *
 * ⚠⚠ THE SELECTION RULE IS THE OWNER'S «не переборщить» MADE MEASURABLE AND IT IS PRINTED, NOT
 * ASSUMED: the largest `G` at which NO career reaches a clamp. Form pinned at a clamp stops being a
 * signal and becomes a shelf – it is the rail, not a destination.
 *
 * ⚠ THE ARMS DIVERGE AND THAT IS THE POINT RATHER THAN A FLAW. `G` moves form, form moves composure,
 * composure moves results – so each arm walks its own careers from the same seeds. This is the LIVE
 * arm and it is the honest one here, unlike §10c's rung table, where the confound was the WALLET
 * (a salary buys fewer tournaments). `G` costs nothing, so no wallet moves between these rows.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law).
 *
 * ⚠ ZERO RNG DISCIPLINE: §2's draws are `simulateMatch` on a purpose-scoped key private to this
 * bench (`gsweep:*`); §0–§1 walk real careers through the engine's own loop and take no draw of
 * their own. Nothing here touches MAIN.
 *
 * Run:  npm run bench:gsweep
 *       npx vite-node tools/form-g-sweep.ts -- --gains 1.5,2.25,3,4 --seeds 2 --weeks 624
 */
import { simulateMatch } from '../src/engine/match/engine'
import { fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { MatchOptions, MatchPlayer, Tour } from '../src/engine/match/types'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

const argv = process.argv.slice(2)
const num = (flag: string, dflt: number): number => {
  const i = argv.indexOf(`--${flag}`)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : dflt
}
const list = (flag: string, dflt: number[]): number[] => {
  const i = argv.indexOf(`--${flag}`)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1].split(',').map(Number) : dflt
}
const SIMS = num('sims', 1200)
const SEEDS = num('seeds', 2)
const WEEKS = num('weeks', 624)
const GAINS = list('gains', [1.5, 2.25, 3.0])

const TOUR: Tour = 'wta'
const OPTS: MatchOptions = { surface: 'hard', tour: TOUR, seed: '' }
const F = ECONOMY.form
/** ⚠ THE ONE CAST IN THE FILE, and it is named so a reader can see exactly which key moves.
 *  `ECONOMY` is `as const` for the app's benefit; a sweep has to write the dial it is sweeping. */
type MutableGain = { gain: number }
const FORM_KNOB = ECONOMY.form as unknown as MutableGain
const SHIPPED_GAIN = F.gain

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`
const padL = (s: string | number, n: number): string => String(s).padStart(n)
const padR = (s: string | number, n: number): string => String(s).padEnd(n)
const quantile = (xs: number[], q: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}

// =================================================================================================
// THE CENSUS WALK – one arm, all careers, nobody hired
// =================================================================================================
interface Census {
  gain: number
  all: number[]
  p5: number
  p95: number
  min: number
  max: number
  nearClamp: number
  atClamp: number
  clampCareers: number
  careers: number
}

/** ⚠ NO SEAT AND NO POKE. §10b's census is the no-seat arm and this has to be comparable to it; the
 *  sparring partner cuts the RHYTHM channel and `G` is the RESULTS channel's dial, so mixing them
 *  would put two levers on one number. */
function census(gain: number): Census {
  FORM_KNOB.gain = gain
  const all: number[] = []
  let clampCareers = 0
  let careers = 0
  for (let p = 0; p < PRESETS.length; p++) {
    for (let i = 0; i < SEEDS; i++) {
      const preset = PRESETS[p]
      const policy = POLICIES[1]
      const { world, rng } = openCareer(preset, i, policy)
      let reached = false
      for (let w = 0; w < WEEKS; w++) {
        stepCareerWeek(world, rng, policy)
        const f = world.form ?? 0
        all.push(f)
        if (Math.abs(f) >= F.max) reached = true
      }
      careers++
      if (reached) clampCareers++
    }
  }
  const nearClamp = all.filter((x) => Math.abs(x) >= F.max - 1).length / all.length
  const atClamp = all.filter((x) => Math.abs(x) >= F.max).length / all.length
  return {
    gain,
    all,
    p5: quantile(all, 0.05),
    p95: quantile(all, 0.95),
    min: Math.min(...all),
    max: Math.max(...all),
    nearClamp,
    atClamp,
    clampCareers,
    careers,
  }
}

// =================================================================================================
// THE MATCH ARM – what a band of form is worth, against the field she really meets
// =================================================================================================
function build(id: string, core: number, over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id, name: id, serve: core, ret: core, composure: core, stamina: core, groundstrokes: core, age: 22, ...over }
}

/** `form-bench`'s own §B path, quoted rather than re-derived so the two files' pp are comparable. */
function proAt(rank: number): MatchPlayer {
  const pros = fieldProsFor('form-bench', 0)
  const table = mergedWtaRanking([], pros)
  const byId = new Map(pros.map((p) => [p.id, p]))
  const row = table[Math.min(table.length - 1, Math.max(0, rank - 1))]
  const pro = byId.get(row.playerId)
  if (!pro) throw new Error(`no pro behind rank ${rank}`)
  return rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
}

function winRate(a: MatchPlayer, b: MatchPlayer, key: string): number {
  let wins = 0
  for (let i = 0; i < SIMS; i++) {
    if (simulateMatch(a, b, { ...OPTS, seed: `gsweep:${key}:${i}` }).winner === 0) wins++
  }
  return wins / SIMS
}

/** ⚠ `K` IS READ, NEVER SWEPT. The composure a given form is played at is `form x K` and this file
 *  moves only what `form` is – so the reader here is the shipped one, spelled the way the engine
 *  spells it. */
function atForm(core: number, form: number): MatchPlayer {
  return build('me', core, { composure: Math.max(0, core + form * F.reader) })
}

// =================================================================================================
function main(): void {
  console.log('=== ROUND 43 ITEM B – the `G` sweep, and the lived band it buys ===')
  console.log(`    ${PRESETS.length * SEEDS} careers x ${WEEKS} weeks (${(WEEKS / WEEKS_PER_YEAR).toFixed(1)} seasons each), no seat hired.`)
  console.log(`    shipped G = ${SHIPPED_GAIN}; K = ${F.reader} and is NOT swept (O1's corridor is the ruling).`)
  console.log(`    clamps ±${F.max}; reversion ${F.revertPerWeek}/wk; drift ${F.driftPerWeek}/wk past ${F.rustAfterWeeks} wk; floor ${F.rustFloor}.`)

  // -----------------------------------------------------------------------------------------------
  console.log('\n=== §0  THE ARM, PROVEN – if the census does not move, nothing below means anything ===')
  const ship = census(SHIPPED_GAIN)
  const absurd = census(SHIPPED_GAIN * 10)
  console.log(`  G = ${padL(SHIPPED_GAIN, 5)}   lived [p5, p95] = [${ship.p5.toFixed(1)}, ${ship.p95.toFixed(1)}]   at a clamp ${pct(ship.atClamp)}`)
  console.log(`  G = ${padL(SHIPPED_GAIN * 10, 5)}   lived [p5, p95] = [${absurd.p5.toFixed(1)}, ${absurd.p95.toFixed(1)}]   at a clamp ${pct(absurd.atClamp)}`)
  const moved = Math.abs(absurd.p95 - ship.p95) + Math.abs(absurd.p5 - ship.p5)
  console.log(`  => the absurd arm moves the lived band by ${moved.toFixed(1)} points${moved < 0.5 ? '   ⚠⚠ THE ARM IS INERT' : '   – the dial is live'}`)

  // -----------------------------------------------------------------------------------------------
  console.log('\n=== §1  THE SWEEP – where a career actually lives, per candidate G ===')
  console.log(
    `  ${padR('G', 7)}${padL('p1', 7)}${padL('p5', 7)}${padL('median', 8)}${padL('p95', 7)}${padL('p99', 7)}${padL('min', 7)}${padL('max', 7)}` +
      `${padL('within 1', 10)}${padL('at clamp', 10)}${padL('careers at a clamp', 20)}`,
  )
  const arms: Census[] = []
  for (const g of GAINS) {
    const c = g === SHIPPED_GAIN ? ship : census(g)
    arms.push(c)
    console.log(
      `  ${padR(g.toFixed(2) + (g === SHIPPED_GAIN ? '*' : ''), 7)}${padL(quantile(c.all, 0.01).toFixed(1), 7)}${padL(c.p5.toFixed(1), 7)}` +
        `${padL(quantile(c.all, 0.5).toFixed(1), 8)}${padL(c.p95.toFixed(1), 7)}${padL(quantile(c.all, 0.99).toFixed(1), 7)}` +
        `${padL(c.min.toFixed(1), 7)}${padL(c.max.toFixed(1), 7)}${padL(pct(c.nearClamp), 10)}${padL(pct(c.atClamp), 10)}` +
        `${padL(`${c.clampCareers} of ${c.careers}`, 20)}`,
    )
  }
  console.log('  (* = shipped)')

  // -----------------------------------------------------------------------------------------------
  console.log('\n=== §2  THE LIVED pp SWING – p5 to p95, against the field she really meets ===')
  console.log(`    ${SIMS} paired sims a cell; the SAME seeds down every column, so only the band moves.`)
  console.log('')
  const core = 62
  const opps: [string, MatchPlayer][] = [
    ['peer', build('opp', core)],
    ['w20', proAt(20)],
    ['w60', proAt(60)],
    ['w150', proAt(150)],
  ]
  console.log(
    `  ${padR('G', 7)}${padR('lived band', 16)}${padR('composure span', 17)}${padL('peer', 9)}${padL('#20', 9)}${padL('#60', 9)}${padL('#150', 9)}${padL('widest', 10)}`,
  )
  const swings: number[] = []
  for (const c of arms) {
    const cells: number[] = []
    for (const [key, opp] of opps) {
      const lo = winRate(atForm(core, c.p5), opp, key)
      const hi = winRate(atForm(core, c.p95), opp, key)
      cells.push(Math.abs(hi - lo))
    }
    const widest = Math.max(...cells)
    swings.push(widest)
    console.log(
      `  ${padR(c.gain.toFixed(2) + (c.gain === SHIPPED_GAIN ? '*' : ''), 7)}${padR(`[${c.p5.toFixed(1)}, ${c.p95.toFixed(1)}]`, 16)}` +
        `${padR(`${((c.p95 - c.p5) * F.reader).toFixed(1)} points`, 17)}` +
        cells.map((x) => padL((100 * x).toFixed(2), 9)).join('') +
        `${padL((100 * widest).toFixed(2) + 'pp', 10)}`,
    )
  }

  // -----------------------------------------------------------------------------------------------
  console.log('\n=== THE SELECTION RULE – the largest G at which NO career reaches a clamp ===')
  const clean = arms.filter((c) => c.clampCareers === 0)
  if (clean.length === 0) {
    console.log('  ⚠⚠ EVERY SWEPT ARM REACHES A CLAMP. Nothing here satisfies the rule; report it and')
    console.log('     recommend the largest arm that does not – there is none in this set.')
  } else {
    const pick = clean[clean.length - 1]
    const i = arms.indexOf(pick)
    console.log(`  G = ${pick.gain} – lived [${pick.p5.toFixed(1)}, ${pick.p95.toFixed(1)}], worst career ${pick.min.toFixed(1)}/${pick.max.toFixed(1)},`)
    console.log(`  ${pct(pick.nearClamp)} of weeks within one point of a clamp, ${pick.clampCareers} of ${pick.careers} careers at one, lived swing ${(100 * swings[i]).toFixed(2)}pp.`)
    const dirty = arms.filter((c) => c.clampCareers > 0)
    if (dirty.length > 0) console.log(`  (refused above it: ${dirty.map((c) => `G=${c.gain} (${c.clampCareers} careers at a clamp)`).join(', ')})`)
    else console.log('  (no swept arm reached a clamp – the ceiling of this sweep is not the ceiling of the rule)')
  }
  FORM_KNOB.gain = SHIPPED_GAIN
}

main()
