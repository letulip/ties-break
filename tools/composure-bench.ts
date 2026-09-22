/**
 * composure-bench – round 42 #34: what is a point of NERVE actually worth?
 *
 * ⚠ WHY IT EXISTS (owner, 15.09: «давай бенч по composure заведём в раунд отдельным пунктом», and
 * then «давай посмотрим на бенч сначала, потом решим»). Item 32's audit of two real careers found
 * the rating prices nerve at +1 per +5 of the wing – against +42 for groundstrokes – and could not
 * resolve any residual beyond it: the high-nerve career beat its own prediction by +1.8pp over 217
 * matches, which is 0.6σ. Two careers cannot see an effect that small, so the wing gets a
 * controlled measurement instead of an argument.
 *
 * ⭐ THE PAIRED DESIGN, and it is the whole reason the numbers below are readable. Every arm plays
 * THE SAME SEEDS against THE SAME opponent; the only thing that differs between two rows is the one
 * wing. So the difference between two rows is the wing's effect and nothing else – no seed noise, no
 * opponent noise, no re-drawn world. (`docs/specs/rank-plateau.md`'s lesson, applied before the fact
 * rather than after: predict, then measure the thing you predicted, on an arm that can only differ
 * by the change.)
 *
 * ⚠ BOTH ENGINES ARE REPORTED, because the game uses two and this question lives in the gap between
 * them. `fastMatchProbability` is the CLOSED form (the curve the rating and the event card quote);
 * `simulateMatch` is the point loop the kid's own matches run through, where nerve is spent per
 * break point. If nerve is worth anything, it is worth it in the SECOND column and not the first –
 * that is what `nerveAndLegs`' own note in match/point.ts says it is for.
 *
 * ZERO RNG DISCIPLINE: every draw is `rngFromSeed`/`simulateMatch` on a purpose-scoped key private
 * to this bench (`composure:*`). Nothing here touches MAIN and the tool never constructs a World.
 *
 * Run:
 *   npx vite-node tools/composure-bench.ts [--sims N] [--wing composure|stamina|both]
 */
import { fastMatchProbability, simulateMatch } from '../src/engine/match/engine'
import { ratingOf } from '../src/engine/match/rating'
import { fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { ECONOMY } from '../src/engine/economy'
// ⭐ WAVE 10 T8: wave 9's own term, asked rather than re-typed – the ceiling a mother climbs into.
import { motherhoodPoiseOf } from '../src/engine/development'
import type { MatchOptions, MatchPlayer, Tour } from '../src/engine/match/types'

const argv = process.argv.slice(2)
const num = (flag: string, dflt: number): number => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : dflt
}
const str = (flag: string, dflt: string): string => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? String(argv[i + 1]) : dflt
}
const SIMS = num('--sims', 1200)
const WING = str('--wing', 'all')

const TOUR: Tour = 'wta'
const OPTS: MatchOptions = { surface: 'hard', tour: TOUR, seed: '' }
const pct = (x: number): string => (100 * x).toFixed(1).padStart(5)
const pp = (x: number): string => `${x >= 0 ? '+' : ''}${(100 * x).toFixed(1)}pp`

// ⚠ ALL FIVE, NOT JUST THE CHEAP TWO. The question «what is nerve worth» is only answerable next to
// what the OTHER wings are worth, measured the same way on the same builds – otherwise «+0.6pp» has
// no scale. `--wing all` is the default for exactly that reason.
type Wing = 'serve' | 'ret' | 'composure' | 'stamina' | 'groundstrokes'
const WINGS: Wing[] = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes']

/** A build the game could really deal: the two audited careers sit at core 62–68 with one wing out. */
function build(id: string, core: number, over: Partial<MatchPlayer> = {}): MatchPlayer {
  return {
    id,
    name: id,
    serve: core,
    ret: core,
    composure: core,
    stamina: core,
    groundstrokes: core,
    age: 22,
    ...over,
  }
}

interface Cell {
  /** matches won, of `SIMS` */
  wins: number
  /** completed sets that went to a third */
  deciders: number
  decidersWon: number
  /** 7-6 sets, both sides */
  tiebreaks: number
  tiebreaksWon: number
  /** her own serve, under pressure */
  bpFaced: number
  bpSaved: number
  /** the other girl's serve, under pressure */
  bpEarned: number
  bpConverted: number
  closed: number
  rating: number
}

/** Play one cell: the same `SIMS` seeds every time, so two cells differ only by the build. */
function play(a: MatchPlayer, b: MatchPlayer, key: string): Cell {
  const cell: Cell = {
    wins: 0,
    deciders: 0,
    decidersWon: 0,
    tiebreaks: 0,
    tiebreaksWon: 0,
    bpFaced: 0,
    bpSaved: 0,
    bpEarned: 0,
    bpConverted: 0,
    closed: fastMatchProbability(a, b, OPTS),
    rating: ratingOf(a, 'hard', TOUR),
  }
  for (let i = 0; i < SIMS; i++) {
    // ⚠ THE SEED CARRIES THE PAIRING AND NOT THE ARM. `key` names the opponent and the sim index –
    // never the wing's value – so every arm meets an identical sequence of matches.
    const res = simulateMatch(a, b, { ...OPTS, seed: `composure:${key}:${i}` })
    const won = res.winner === 0
    if (won) cell.wins++
    if (res.sets.length >= 3) {
      cell.deciders++
      if (won) cell.decidersWon++
    }
    for (const set of res.sets) {
      if (Math.max(set.a, set.b) === 7 && Math.min(set.a, set.b) === 6) {
        cell.tiebreaks++
        if (set.a > set.b) cell.tiebreaksWon++
      }
    }
    cell.bpFaced += res.stats[0].breakPointsFaced
    cell.bpSaved += res.stats[0].breakPointsSaved
    cell.bpEarned += res.stats[1].breakPointsFaced
    cell.bpConverted += res.stats[1].breakPointsFaced - res.stats[1].breakPointsSaved
  }
  return cell
}

function row(label: string, c: Cell, ref: Cell | null): string {
  const win = c.wins / SIMS
  const delta = ref === null ? '' : pp(win - ref.wins / SIMS).padStart(8)
  return (
    `  ${label.padEnd(16)} ${String(c.rating).padStart(5)}  ${pct(c.closed)}%  ${pct(win)}%${delta}   ` +
    `${pct(c.decidersWon / Math.max(1, c.deciders))}% (${String(c.deciders).padStart(4)})  ` +
    `${pct(c.tiebreaksWon / Math.max(1, c.tiebreaks))}% (${String(c.tiebreaks).padStart(4)})  ` +
    `${pct(c.bpSaved / Math.max(1, c.bpFaced))}%  ${pct(c.bpConverted / Math.max(1, c.bpEarned))}%`
  )
}

const HEAD =
  '  arm               rating  closed    loop   delta   deciding sets     tiebreak sets    BP saved  BP won'

// -------------------------------------------------------------------------------------------------
// 0. THE ARM IS PROVEN BEFORE IT IS TRUSTED.
// -------------------------------------------------------------------------------------------------
// The house law, both directions: «set the constant to an absurd value and watch the output move; if
// it does not, the arm is wrong before the hypothesis is». Nerve at 0 against nerve at 100, one
// build, one opponent – if THIS does not move, nothing below means anything.
function sectionZero(): void {
  console.log('\n=== 0. THE ARM, PROVEN – the same build at composure 0 and at 100 ===')
  console.log(HEAD)
  const opp = build('opp', 62)
  const floor = play(build('me', 62, { composure: 0 }), opp, 'proof')
  const ceil = play(build('me', 62, { composure: 100 }), opp, 'proof')
  console.log(row('composure 0', floor, null))
  console.log(row('composure 100', ceil, floor))
  const moved = Math.abs(ceil.wins - floor.wins) / SIMS
  console.log(
    `  => the extreme arm moves the loop by ${pp(moved)}` +
      `${moved < 0.005 ? '  ⚠⚠ THE WING IS INERT AT THE EXTREMES – read everything below with that' : ''}`,
  )
}

// -------------------------------------------------------------------------------------------------
// A. THE WING, ISOLATED – one build, one opponent, the wing swept in the range a career can reach.
// -------------------------------------------------------------------------------------------------
function sectionA(wing: Wing): void {
  console.log(`\n=== A. ${wing.toUpperCase()}, ISOLATED – core 62 against core 62, the wing alone moved ===`)
  console.log(HEAD)
  const opp = build('opp', 62)
  let ref: Cell | null = null
  for (const value of [42, 52, 62, 72, 82]) {
    const cell = play(build('me', 62, { [wing]: value } as Partial<MatchPlayer>), opp, `iso:${wing}`)
    if (value === 42) ref = cell
    console.log(row(`${wing} ${value}`, cell, ref))
  }
}

// -------------------------------------------------------------------------------------------------
// B. THE TWO REAL BUILDS – the audited careers, with their own nerve moved +/-20.
// -------------------------------------------------------------------------------------------------
// ⚠ Round 42 #32's own two girls, entered as the builds they actually are (their skills as read off
// the saves, rounded), because a flat build is not what the game deals. The opponent is the SAME in
// every row: the professional standing at rank 20, built the way a real bracket builds her.
function sectionB(wing: Wing): void {
  // The professional standing, built the way a real bracket builds it (skill-gap-odds' own path):
  // `fieldProsFor` deals the field, `mergedWtaRanking` orders it, `rivalMatchPlayer` puts a girl on
  // court. Nothing here is a hand-made opponent.
  const pros = fieldProsFor('composure-bench', 0)
  const table = mergedWtaRanking([], pros)
  const byId = new Map(pros.map((pro) => [pro.id, pro]))
  const at = (rank: number): MatchPlayer => {
    const row = table[Math.min(table.length - 1, Math.max(0, rank - 1))]
    const pro = byId.get(row.playerId)
    if (!pro) throw new Error(`no pro behind rank ${rank}`)
    return rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
  }
  const opponents: [string, MatchPlayer][] = [
    ['vs #20', at(20)],
    ['vs #80', at(80)],
  ]
  const builds: [string, MatchPlayer][] = [
    ['big-shot build', build('alice', 0, { serve: 68, ret: 70, composure: 52, stamina: 65, groundstrokes: 73 })],
    ['nerve build', build('zoe', 0, { serve: 65, ret: 58, composure: 78, stamina: 60, groundstrokes: 63 })],
  ]
  for (const [oppLabel, opp] of opponents) {
    console.log(`\n=== B. THE AUDITED BUILDS ${oppLabel} – ${wing} moved +/-20 on each ===`)
    console.log(HEAD)
    for (const [label, base] of builds) {
      let ref: Cell | null = null
      for (const shift of [-20, 0, 20]) {
        const value = Math.max(0, Math.min(100, (base[wing] as number) + shift))
        const cell = play({ ...base, [wing]: value }, opp, `real:${label}:${oppLabel}`)
        if (shift === -20) ref = cell
        console.log(row(`${label} ${shift >= 0 ? '+' : ''}${shift}`, cell, ref))
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// THE PRICE LIST – what +20 of each wing buys, in the loop, on a build the game really deals.
// -------------------------------------------------------------------------------------------------
function priceList(): void {
  const pros = fieldProsFor('composure-bench', 0)
  const table = mergedWtaRanking([], pros)
  const byId = new Map(pros.map((pro) => [pro.id, pro]))
  const at = (rank: number): MatchPlayer => {
    const row = table[Math.min(table.length - 1, Math.max(0, rank - 1))]
    const pro = byId.get(row.playerId)
    if (!pro) throw new Error(`no pro behind rank ${rank}`)
    return rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
  }
  const builds: [string, MatchPlayer][] = [
    ['big-shot', build('alice', 0, { serve: 68, ret: 70, composure: 52, stamina: 65, groundstrokes: 73 })],
    ['nerve', build('zoe', 0, { serve: 65, ret: 58, composure: 78, stamina: 60, groundstrokes: 63 })],
  ]
  for (const [rank, opp] of [[20, at(20)], [80, at(80)]] as [number, MatchPlayer][]) {
    console.log(`\n=== PRICE LIST vs #${rank} – what +20 of ONE wing buys, in the loop ===`)
    console.log('  build      wing            rating   +rating    loop    +loop    BP saved   deciding sets')
    for (const [label, base] of builds) {
      const ref = play(base, opp, `price:${label}:${rank}`)
      console.log(
        `  ${label.padEnd(10)} ${'(as dealt)'.padEnd(15)} ${String(ref.rating).padStart(5)}        -   ` +
          `${pct(ref.wins / SIMS)}%       -    ${pct(ref.bpSaved / Math.max(1, ref.bpFaced))}%   ` +
          `${pct(ref.decidersWon / Math.max(1, ref.deciders))}%`,
      )
      for (const wing of WINGS) {
        const value = Math.max(0, Math.min(100, (base[wing] as number) + 20))
        const cell = play({ ...base, [wing]: value }, opp, `price:${label}:${rank}`)
        console.log(
          `  ${''.padEnd(10)} ${`${wing} +20`.padEnd(15)} ${String(cell.rating).padStart(5)}  ` +
            `${String(cell.rating - ref.rating).padStart(7)}   ${pct(cell.wins / SIMS)}%  ` +
            `${pp(cell.wins / SIMS - ref.wins / SIMS).padStart(7)}    ` +
            `${pct(cell.bpSaved / Math.max(1, cell.bpFaced))}%   ` +
            `${pct(cell.decidersWon / Math.max(1, cell.deciders))}%`,
        )
      }
    }
  }
}

// =================================================================================================
// ⭐⭐⭐ WAVE 10 T8 – THE POISE ROOM AT MATCH GRAIN (wave 9's unmeasured arm, his «не возражаю»)
// =================================================================================================
//
// docs/plans/life-wave-10-builder-2026-09.md §2 T8, and the spec's §8 row 6. Wave 9's T5 gave a
// mother ROOM rather than a bonus – `motherhoodPoiseOf` raises her composure CEILING by
// `returnPoiseCeiling` per child, capped at `returnPoiseMax` – and its twins measured the margin she
// actually climbs into at **+0.495 of composure**. What wave 9 could NOT say is what that margin is
// worth in a match, and its own report carried the line as an unmeasured arm.
//
// ⚠⚠ THE PREDICTION IS `point.ts`'s OWN LAW, SCALED, AND IT IS WRITTEN HERE BEFORE THE RUN: the price
// list above prices +20 of composure, so +0.495 is 1/40th of that step and the plan's forecast is
// ≈ +0.1 pp on pressure points – texture, below career-grain noise at N=168. A bench that printed
// only what it found would let the ledger be filled in from whatever came out.
//
// ⚠ IT IS THE SAME PAIRED DESIGN AS EVERY OTHER ARM IN THIS FILE: the same seeds, the same opponent,
// one number different between two rows. So the difference between them is the margin and nothing
// else.
//
// ⚠ AND IT ASKS THE LOOP, NOT THE CURVE. `ratingOf` rounds, so a margin this small can round to zero
// in the closed form while still being spent on break points – which is exactly the gap
// `nerveAndLegs`' own note says the loop exists to see.
function motherhoodArm(): void {
  const margin = motherhoodPoiseOf(1)
  console.log('\n=== WAVE 10 T8 – WHAT A MOTHER\'S ROOM IS WORTH IN A MATCH ===')
  console.log(
    `  wave 9's twins measured the margin she climbs into at +0.495 composure; one child's CEILING is\n` +
      `  +${margin} (\`motherhoodPoiseOf(1)\`), and the ceiling is room rather than a gift.\n` +
      `  predicted: ≈ +0.1 pp on pressure points – texture, below career-grain noise at N=168.`,
  )
  console.log('  build      composure       rating    loop    +loop     BP saved   BP won   deciders')
  const builds: [string, MatchPlayer][] = [
    ['big-shot', build('alice', 0, { serve: 68, ret: 70, composure: 52, stamina: 65, groundstrokes: 73 })],
    ['nerve', build('zoe', 0, { serve: 65, ret: 58, composure: 78, stamina: 60, groundstrokes: 63 })],
  ]
  const pros = fieldProsFor('composure-bench', 0)
  const table = mergedWtaRanking([], pros)
  const byId = new Map(pros.map((pro) => [pro.id, pro]))
  const at = (rank: number): MatchPlayer => {
    const row = table[Math.min(table.length - 1, Math.max(0, rank - 1))]
    const pro = byId.get(row.playerId)
    if (!pro) throw new Error(`no pro behind rank ${rank}`)
    return rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
  }
  for (const [rank, opp] of [[20, at(20)], [80, at(80)]] as [number, MatchPlayer][]) {
    console.log(`  — vs #${rank} —`)
    for (const [label, base] of builds) {
      const ref = play(base, opp, `t8:${label}:${rank}`)
      // ⚠ THE MEASURED MARGIN AND THE WHOLE CEILING, both: the first is what wave 9's twins really
      // reached, the second is what the room allows if she spends all of it. Two rows, because
      // «what she got» and «what she could get» are different questions and the ledger wants both.
      for (const [name, delta] of [['+0.495 (measured)', 0.495], [`+${margin} (the ceiling)`, margin]] as [string, number][]) {
        const cell = play({ ...base, composure: base.composure + delta }, opp, `t8:${label}:${rank}`)
        console.log(
          `  ${label.padEnd(10)} ${name.padEnd(15)} ${String(cell.rating).padStart(5)}   ` +
            `${pct(cell.wins / SIMS)}%  ${pp(cell.wins / SIMS - ref.wins / SIMS).padStart(7)}     ` +
            `${pct(cell.bpSaved / Math.max(1, cell.bpFaced))}%   ` +
            `${pct(cell.bpConverted / Math.max(1, cell.bpEarned))}%   ` +
            `${pct(cell.decidersWon / Math.max(1, cell.deciders))}%`,
        )
      }
      console.log(
        `  ${''.padEnd(10)} ${'(as dealt)'.padEnd(15)} ${String(ref.rating).padStart(5)}   ` +
          `${pct(ref.wins / SIMS)}%        -     ` +
          `${pct(ref.bpSaved / Math.max(1, ref.bpFaced))}%   ` +
          `${pct(ref.bpConverted / Math.max(1, ref.bpEarned))}%   ` +
          `${pct(ref.decidersWon / Math.max(1, ref.deciders))}%`,
      )
    }
  }
}

console.log(
  `composure-bench – ${SIMS} simulated matches per cell, hard court, both girls at full condition.\n` +
    'closed = fastMatchProbability (the curve the rating quotes) · loop = simulateMatch (the point\n' +
    'engine her own matches run through) · delta = against the first row of the block.',
)
sectionZero()
// ⭐ THE PRICE LIST FIRST – every wing, the same +/-20 on the same two builds against the same two
// opponents, so the five numbers can be read against each other in one place. The per-wing sections
// follow for the mechanism (break points, deciding sets, tiebreaks).
if (WING === 'all') priceList()
// ⭐ WAVE 10 T8 – beside the price list, because the margin is only readable against what +20 buys.
if (WING === 'all' || WING === 'composure') motherhoodArm()
for (const wing of (WING === 'all' ? WINGS : [WING as Wing])) {
  sectionA(wing)
  sectionB(wing)
}
