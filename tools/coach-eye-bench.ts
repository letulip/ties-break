/**
 * coach-eye-bench – THE EYE, MEASURED BEFORE IT IS BUILT (docs/specs/coach-as-the-eye.md §5).
 *
 * The spec's proposed durable coach value is the EYE: every season the plan is AIMED at one wing
 * (the v47 ticks – `aimWeights` renormalises a pure week to ×5 on the chosen skill), and the aim's
 * quality is bounded by how accurately the girl's REMAINING HEADROOM is read. The truth is fogged
 * (`CEILING_FLOOR_HALF = 4`, centre drift 0.6) and each rung reads it at its own accuracy
 * (`COACH_ACCURACY`: self ±3.36 permanent → elite ±0.00). This bench runs the loop before anything
 * is built and answers the spec's own ship rules.
 *
 * THREE WAYS TO CHOOSE THE SEASON'S AIM, same seeds, aim policy the only difference:
 *
 *   ORACLE   the expressible aim that captures the most TRUE remaining headroom
 *            (`world.potential[k] - world.skills[k]`), re-decided each season.
 *   EYE(t)   one arm per rung: the aim the rung's own degraded read believes has the most room.
 *            The read is the ENGINE'S OWN misreading machinery, end to end: `radarViewOf(world)`
 *            with the arm's tier substituted, through `buildRadar` – `shownSkill`'s fixed-direction
 *            career error scaled by `bandFor(confidence)`, and the ceiling band with its drifted,
 *            floored haze. Believed room = midpoint of the drawn ceiling band minus the shown value,
 *            which is literally the picture that tier's radar puts on screen.
 *   UNAIMED  the shipped default – a General week, all aim weights 1 – which
 *            what-money-buys-2026-08.md found to be the best strategy today.
 *
 * ⚠ THE WORLD IS SELF-COACHED IN EVERY ARM. The spec's ship rule 4 is "same seeds, aim-policy the
 * only difference", so the tier names the EYE that chooses the aim, never a hire: hiring would move
 * the development multiplier, the physio, the bill and the whole economy with it, and §6 of
 * what-money-buys already measured that bundle. The tier's bill is priced ARITHMETICALLY in §4
 * (the same full-attendance `careerBill` fold what-money-buys §0b used), so "net of the bill" is
 * answered without letting the bill touch the careers.
 *
 * ⚠ THE AIM SURFACE IS THE SHIPPED ONE, and it cannot say every wing's name. `SESSION_AIM` maps
 * rally→groundstrokes, fitness→stamina, matchplay→composure – three wings at ×5 – but serve and
 * return only exist as a PAIR (`serve: ['serve','ret']`, ×2.5 each): no legal week aims at the
 * serve alone. Every policy here therefore chooses among the four expressible pure weeks by
 * headroom CAPTURED (Σ aim[k]·room[k]), which is the honest translation of "aim at the wing with
 * the most room" onto the surface the player actually holds. The bench counts how often the
 * pairing forces the oracle off the single best wing (§0 prints the vectors; §1 the divergence).
 *
 * ⚠ MEASUREMENT ONLY. No shipped constant is touched, nothing under src/ moves, no schema changes.
 * The plan is driven through the worker's own `setPlan` semantics – `planShapeError` then
 * `planFromWeek` – so every arm's input is a week the player could tick. RNG: the aim decision
 * reads `buildRadar`, whose draws are purpose-scoped sub-streams created fresh and thrown away;
 * the plan write is pure state. §R proves the frozen MAIN capture (41550 / e6b0c709) holds under
 * an aim-laden year, pairwise against the unaimed run and against the documented pin.
 *
 * Run:
 *   npx vite-node tools/coach-eye-bench.ts                          # 3 cells × 7 arms × 30 seeds
 *   npx vite-node tools/coach-eye-bench.ts -- --seeds 8             # a fast look
 *   npx vite-node tools/coach-eye-bench.ts -- --cells working      # one background
 */
import { writeFileSync } from 'node:fs'
import { openCareer, stepCareerWeek, POLICIES, type Policy, type Preset } from './econ-bench'
import {
  answerFork,
  answerRetirement,
  createWorld,
  radarViewOf,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { buildRadar, COACH_ACCURACY, bandFor, TRAINING_FOG_FLOOR, type RadarWorldView } from '../src/engine/radar'
import { SKILL_KEYS, aimWeights, rollPotential, type SkillKey } from '../src/engine/development'
import { planFromWeek, planShapeError, sessionDays, sessionsForPlan } from '../src/engine/plan'
import { startingSkills } from '../src/engine/world/player'
import { kidAgeExact } from '../src/engine/world/age'
import { kidPoints } from '../src/engine/world/ladder'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import {
  COACH_TIERS,
  coachCorridorMid,
  coachHoursForPlan,
  coachRateBandCents,
  coachWeeklyCents,
  facilityRateCents,
} from '../src/engine/coach'
import { rngFromSeed } from '../src/engine/rng'
import {
  WEEK_PLAN_PRESETS,
  type CoachTier,
  type FamilyBackground,
  type PlayerProfile,
  type SessionKind,
} from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 30)
const DUMP = args.indexOf('--dump') >= 0 ? (args[args.indexOf('--dump') + 1] ?? '') : ''
const cellsArg = args.indexOf('--cells') >= 0 ? (args[args.indexOf('--cells') + 1] ?? '') : ''
const CELLS: FamilyBackground[] = cellsArg
  ? (cellsArg.split(',').filter(Boolean) as FamilyBackground[])
  : ['working', 'middle', 'wealthy']
/** To 22 and a bit past it: a June birthday reaches her 22nd around week 438, so 460 covers the
 *  age-22 snapshot in every arm while keeping the run at a third of a full career. */
const HORIZON_WEEKS = argOf('horizon', 460)

/** `player`, like every figure in what-money-buys – so the tables read against §6 directly. */
const POLICY: Policy = POLICIES[1]

// -------------------------------------------------------------------------------------------------
// small helpers (the house style of econ-bench/what-money-buys, kept locally tiny)
// -------------------------------------------------------------------------------------------------
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function rule(n = 112): string {
  return '='.repeat(n)
}
function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}
function pctl(xs: readonly number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}
function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}
function shareOf(hits: number, of: number): string {
  return of === 0 ? '   –' : `${((100 * hits) / of).toFixed(1)}%`
}
const W_RUNGS: TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')

// -------------------------------------------------------------------------------------------------
// the aim surface – exactly what a player can tick, nothing else
// -------------------------------------------------------------------------------------------------

/** The four PURE weeks the plan grid can point somewhere. `general` is deliberately absent from the
 *  choice set: the best single aim always captures at least as much room as the all-ones week
 *  (5·max ≥ Σ because the max is never below the mean), so a policy that could pick General never
 *  would – and the UNAIMED arm is that week, run as its own control. */
const AIM_KINDS = ['serve', 'rally', 'fitness', 'matchplay'] as const
type AimKind = (typeof AIM_KINDS)[number]

/** The balanced preset's five session days – the exact layout `planWeek` expands the shipped
 *  default to, so an aimed week and the default differ in KIND and in nothing else: same five
 *  days, same volume, same `train` projection, same bill, same knock chance. */
const BALANCED_DAYS = new Set(sessionDays(sessionsForPlan(WEEK_PLAN_PRESETS.balanced.train)))

function pureWeek(kind: SessionKind): SessionKind[][] {
  const out: SessionKind[][] = []
  for (let d = 0; d < 7; d++) out.push(BALANCED_DAYS.has(d) ? [kind] : [])
  return out
}

const GENERAL_WEEK = pureWeek('general')

/** What each pure week multiplies each wing by – the engine's own arithmetic, not a re-derivation:
 *  rally/fitness/matchplay land ×5 on one wing, serve lands ×2.5 on the serve AND the return. */
const AIM_VECTOR: Record<AimKind, Record<SkillKey, number>> = Object.fromEntries(
  AIM_KINDS.map((k) => [k, aimWeights(pureWeek(k))]),
) as Record<AimKind, Record<SkillKey, number>>

/** The worker's `setPlan`, minus the RPC: validate the shape the way the engine re-validates a
 *  player command, then project. This is the public surface the season planner drives. */
function applyWeek(world: WorldState, week: SessionKind[][]): void {
  const bad = planShapeError(week)
  if (bad) throw new Error(`Week plan: ${bad}`)
  world.plan = planFromWeek(week)
}

/** The aim that captures the most room, over the four expressible weeks. Room below zero is no
 *  room: `growWeek` cannot take points away, so a believed-overfull wing scores nothing rather
 *  than negative. Ties fall to the earlier kind, deterministically, same in every arm. */
function bestAim(room: Record<SkillKey, number>): AimKind {
  let best: AimKind = AIM_KINDS[0]
  let bestScore = -1
  for (const kind of AIM_KINDS) {
    let score = 0
    for (const k of SKILL_KEYS) score += AIM_VECTOR[kind][k] * Math.max(0, room[k])
    if (score > bestScore) {
      bestScore = score
      best = kind
    }
  }
  return best
}

/** ...and the single wing with the most room, for counting how often the serve/ret PAIRING forces
 *  the expressible choice off the literal "wing with the largest headroom". */
function bestWing(room: Record<SkillKey, number>): SkillKey {
  let best: SkillKey = SKILL_KEYS[0]
  for (const k of SKILL_KEYS) if (room[k] > room[best]) best = k
  return best
}

function trueRoom(world: WorldState): Record<SkillKey, number> {
  const out = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) out[k] = world.potential[k] - world.skills[k]
  return out
}

/**
 * WHAT THE TIER'S EYE BELIEVES, through the game's own read path and nothing else.
 *
 * `radarViewOf(world)` is the exact view `toSnapshot` hands `buildRadar`; substituting the tier is
 * the one edit, and it means "the radar this family would be looking at had that rung been on the
 * court from week one" – same tenure, same match evidence, same career, sharper cap. The believed
 * room per wing is the midpoint of the drawn ceiling band minus the shown estimate: the number a
 * player would read straight off that radar. `buildRadar` clamps the band's low edge to the shown
 * value, so the belief is never negative – like the screen, it never claims she has gone backwards.
 */
function believedRoom(world: WorldState, tier: CoachTier): Record<SkillKey, number> {
  const view: RadarWorldView = { ...radarViewOf(world), coachTier: tier }
  const axes = buildRadar(view)
  const out = {} as Record<SkillKey, number>
  for (const a of axes) out[a.key] = (a.ceilingLo + a.ceilingHi) / 2 - a.shownValue
  return out
}

// -------------------------------------------------------------------------------------------------
// the arms
// -------------------------------------------------------------------------------------------------

interface Arm {
  id: string
  kind: 'unaimed' | 'oracle' | 'eye'
  tier?: CoachTier
}

const ARMS: Arm[] = [
  { id: 'unaimed', kind: 'unaimed' },
  { id: 'oracle', kind: 'oracle' },
  ...COACH_TIERS.map((tier): Arm => ({ id: `eye-${tier}`, kind: 'eye', tier })),
]

interface AgeSnap {
  skillSum: number
  rank: number | null
  rung: number
  prizeCents: number
}

interface Career {
  cell: FamilyBackground
  arm: string
  index: number
  /** the TRUE roll, Σ potential − startingSkills – the talent measure §2's terciles split on */
  headroom: number
  byAge: Map<number, AgeSnap>
  skillSumEnd: number
  prizeEndCents: number
  endedEarly: string | null
  seasons: number
  /** seasons where this arm's choice matched what the TRUTH would have chosen at the same state */
  agreedWithTruth: number
  /** seasons where the truth's expressible choice was NOT the literal largest-headroom wing –
   *  the serve/ret pairing showing up as a real surface gap */
  pairingForcedOff: number
  chose: Record<AimKind, number>
}

function headroomOf(seed: string, profile: PlayerProfile): number {
  const start = startingSkills(seed, profile)
  const potential = rollPotential(seed, start)
  return SKILL_KEYS.reduce((a, k) => a + (potential[k] - start[k]), 0)
}

function runCareer(cell: FamilyBackground, arm: Arm, index: number): Career {
  // ⚠ coachTier 'self' in EVERY arm – the tier lives in the eye, not in the world (see the header).
  const preset: Preset = { label: `${cell} · self`, background: cell, coachTier: 'self' }
  const { world, rng, seed } = openCareer(preset, index, POLICY)

  const byAge = new Map<number, AgeSnap>()
  const chose: Record<AimKind, number> = { serve: 0, rally: 0, fitness: 0, matchplay: 0 }
  let seasons = 0
  let agreedWithTruth = 0
  let pairingForcedOff = 0
  let rungSoFar = -1

  for (let w = 0; w < HORIZON_WEEKS && world.ending === null; w++) {
    // THE SEASON'S AIM, re-decided every year – the loop the spec calls the whole design. Decided
    // BEFORE the week runs, off exactly the state the player would be looking at.
    if (world.week % WEEKS_PER_YEAR === 0) {
      if (arm.kind === 'unaimed') {
        applyWeek(world, GENERAL_WEEK)
      } else {
        const truth = trueRoom(world)
        const truthAim = bestAim(truth)
        // The pairing gap, counted at the oracle's own decisions: the wing with the literal
        // largest headroom vs the wing family the surface let the aim land on.
        const wing = bestWing(truth)
        const truthTargets = new Set<SkillKey>(
          truthAim === 'serve' ? ['serve', 'ret'] : truthAim === 'rally' ? ['groundstrokes'] : truthAim === 'fitness' ? ['stamina'] : ['composure'],
        )
        if (!truthTargets.has(wing)) pairingForcedOff++
        const aim = arm.kind === 'oracle' ? truthAim : bestAim(believedRoom(world, arm.tier!))
        if (aim === truthAim) agreedWithTruth++
        chose[aim]++
        seasons++
        applyWeek(world, pureWeek(aim))
      }
    }

    // birthday snapshots, at the top of the week exactly as what-money-buys captures them
    const age = Math.floor(kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay))
    if (!byAge.has(age)) {
      const rank = typeof world.kidRankWta === 'number' && kidPoints(world, 'wta') > 0 ? world.kidRankWta : null
      byAge.set(age, {
        skillSum: SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0),
        rank,
        rung: rungSoFar,
        prizeCents: world.careerTotals.prizeCents,
      })
    }

    const entered = stepCareerWeek(world, rng, POLICY)
    for (let i = 0; i < W_RUNGS.length; i++) if (entered[W_RUNGS[i]] > 0 && i > rungSoFar) rungSoFar = i
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  }

  return {
    cell,
    arm: arm.id,
    index,
    headroom: headroomOf(seed, world.profile),
    byAge,
    skillSumEnd: SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0),
    prizeEndCents: world.careerTotals.prizeCents,
    endedEarly: world.ending?.type ?? null,
    seasons,
    agreedWithTruth,
    pairingForcedOff,
    chose,
  }
}

// -------------------------------------------------------------------------------------------------
// §R  RNG HYGIENE – the frozen capture, pairwise, under an aim-laden year
// -------------------------------------------------------------------------------------------------

/** The documented measurement of what a bench-working-0 year costs the MAIN stream
 *  (tests/condition.test.ts REF) – an informational pin since v35, quoted here to prove the aim
 *  policy is invisible to it. */
const FROZEN = { count: 41550, hash: 'e6b0c709' }

function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function captureYear(aim: 'none' | 'oracle' | 'eye-elite'): { count: number; hash: string } {
  const world = createWorld('bench-working-0')
  const base = rngFromSeed(world.seed)
  const draws: number[] = []
  const tapped = () => {
    const v = base()
    draws.push(v)
    return v
  }
  for (let i = 0; i < 52; i++) {
    if (world.week % WEEKS_PER_YEAR === 0) {
      if (aim === 'oracle') applyWeek(world, pureWeek(bestAim(trueRoom(world))))
      else if (aim === 'eye-elite') applyWeek(world, pureWeek(bestAim(believedRoom(world, 'elite'))))
    }
    tickWeek(world, tapped)
  }
  return { count: draws.length, hash: fnv1a(draws.map((d) => d.toString()).join(',')) }
}

function sectionR(): boolean {
  console.log(`\n${rule()}`)
  console.log('§R  RNG HYGIENE – aim policy is player input and must not move the MAIN stream')
  console.log(rule())
  const none = captureYear('none')
  const oracle = captureYear('oracle')
  const elite = captureYear('eye-elite')
  console.log(`\n  ${padEnd('arm', 26)}${pad('draws', 8)}${pad('hash', 10)}`)
  for (const [label, c] of [
    ['no plan touched', none],
    ['oracle-aimed season', oracle],
    ['elite-eye-aimed season', elite],
  ] as const) {
    console.log(`  ${padEnd(label, 26)}${pad(c.count, 8)}${pad(c.hash, 10)}`)
  }
  const ok =
    none.count === FROZEN.count &&
    none.hash === FROZEN.hash &&
    oracle.count === FROZEN.count &&
    oracle.hash === FROZEN.hash &&
    elite.count === FROZEN.count &&
    elite.hash === FROZEN.hash
  console.log(
    ok
      ? `\n  ✓ all three tap the identical MAIN sequence and match the documented capture (${FROZEN.count} / ${FROZEN.hash}).`
      : `\n  ⚠⚠ CAPTURE MOVED – the aim policy touched the MAIN stream. Do not trust the sweep below.`,
  )
  return ok
}

// -------------------------------------------------------------------------------------------------
// §4's bill – the same full-attendance arithmetic what-money-buys §0b prints, cut at an age
// -------------------------------------------------------------------------------------------------
function billToAge(tier: CoachTier, bg: FamilyBackground, toAge: number): number {
  const plan = WEEK_PLAN_PRESETS.balanced
  let total = 0
  for (let w = 0; w < (toAge - 14) * WEEKS_PER_YEAR; w++) {
    const ageYears = 14 + w / WEEKS_PER_YEAR
    const [lo, hi] = coachRateBandCents(tier, ageYears)
    total +=
      tier === 'self'
        ? Math.round(facilityRateCents(ageYears, tier) * coachHoursForPlan(plan) * coachCorridorMid(bg))
        : coachWeeklyCents((lo + hi) / 2, plan, bg)
  }
  return total
}

// -------------------------------------------------------------------------------------------------
// the sweep and its tables
// -------------------------------------------------------------------------------------------------

function snapAt(c: Career, age: number): AgeSnap | undefined {
  return c.byAge.get(age)
}

function armLabel(id: string): string {
  return id === 'unaimed' ? 'unaimed (shipped default)' : id === 'oracle' ? 'ORACLE (true headroom)' : id
}

function main(): void {
  console.log(rule())
  console.log('COACH-EYE BENCH – oracle vs fogged-per-tier vs unaimed, aim policy the only difference')
  console.log(rule())
  console.log(`\n  ${CELLS.length} cells × ${ARMS.length} arms × ${SEEDS} seeds, weeks 0..${HORIZON_WEEKS} (to age ~22), policy '${POLICY.id}'`)
  console.log(`  aim vectors (the shipped surface): rally ×5 groundstrokes · fitness ×5 stamina · matchplay ×5 composure`)
  console.log(`  · serve ×2.5 serve AND ×2.5 return (the pair – no legal week aims at either alone)`)
  console.log(`  permanent read error by rung (bandFor(COACH_ACCURACY)): ${COACH_TIERS.map((t) => `${t} ±${bandFor(COACH_ACCURACY[t]).toFixed(2)}`).join(' · ')}`)
  console.log(`  the game's own visibility floor (TRAINING_FOG_FLOOR): ${TRAINING_FOG_FLOOR} points`)

  const rngOk = sectionR()

  // ---- run everything -----------------------------------------------------------------------
  const rows: Career[] = []
  for (const cell of CELLS) {
    for (const arm of ARMS) {
      const t0 = Date.now()
      for (let i = 0; i < SEEDS; i++) rows.push(runCareer(cell, arm, i))
      console.log(`  ran ${cell} · ${padEnd(arm.id, 11)} ${SEEDS} careers in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
    }
  }

  const byKey = new Map<string, Career>()
  for (const r of rows) byKey.set(`${r.cell}:${r.arm}:${r.index}`, r)
  const get = (cell: FamilyBackground, arm: string, i: number): Career => byKey.get(`${cell}:${arm}:${i}`)!

  // ---- §1 the tables ---------------------------------------------------------------------------
  for (const AGE of [18, 22]) {
    console.log(`\n${rule()}`)
    console.log(`§1  AT ${AGE} – realised skill, rank, rung, prize, per arm (ship rules 1 and 2, and the RESULTS question)`)
    console.log(rule())
    for (const cell of CELLS) {
      console.log(`\n  ${cell} background, ${SEEDS} seeds, paired`)
      console.log(
        `  ${padEnd('arm', 26)}${pad('skills', 9)}${pad('Δ unaim', 9)}${pad('Δ oracle', 9)}${pad('rank p50', 9)}` +
          `${pad('ranked', 8)}${pad('rung', 7)}${pad('wta250+', 9)}${pad('prize p50', 12)}${pad('vs unaim', 11)}`,
      )
      const unaimed = Array.from({ length: SEEDS }, (_, i) => get(cell, 'unaimed', i))
      const oracle = Array.from({ length: SEEDS }, (_, i) => get(cell, 'oracle', i))
      for (const arm of ARMS) {
        const cs = Array.from({ length: SEEDS }, (_, i) => get(cell, arm.id, i))
        const snaps = cs.map((c) => snapAt(c, AGE)).filter((s): s is AgeSnap => s !== undefined)
        const skills = snaps.map((s) => s.skillSum)
        const dUn = mean(cs.map((c, i) => (snapAt(c, AGE)?.skillSum ?? NaN) - (snapAt(unaimed[i], AGE)?.skillSum ?? NaN)).filter((x) => !Number.isNaN(x)))
        const dOr = mean(cs.map((c, i) => (snapAt(c, AGE)?.skillSum ?? NaN) - (snapAt(oracle[i], AGE)?.skillSum ?? NaN)).filter((x) => !Number.isNaN(x)))
        const ranked = snaps.filter((s) => s.rank !== null)
        const prizes = snaps.map((s) => s.prizeCents)
        const dPrize = mean(cs.map((c, i) => (snapAt(c, AGE)?.prizeCents ?? NaN) - (snapAt(unaimed[i], AGE)?.prizeCents ?? NaN)).filter((x) => !Number.isNaN(x)))
        console.log(
          `  ${padEnd(armLabel(arm.id), 26)}${pad(mean(skills).toFixed(1), 9)}${pad(dUn >= 0 ? `+${dUn.toFixed(2)}` : dUn.toFixed(2), 9)}` +
            `${pad(dOr.toFixed(2), 9)}${pad(ranked.length ? `#${pctl(ranked.map((s) => s.rank!), 0.5)}` : '–', 9)}` +
            `${pad(`${ranked.length}/${snaps.length}`, 8)}${pad(mean(snaps.map((s) => s.rung)).toFixed(2), 7)}` +
            `${pad(shareOf(snaps.filter((s) => s.rung >= W_RUNGS.indexOf('wta250')).length, snaps.length), 9)}` +
            `${pad(money(pctl(prizes, 0.5)), 12)}${pad(money(Math.round(dPrize)), 11)}`,
        )
      }
    }
    console.log(`\n  rung = mean index into [${W_RUNGS.join(', ')}] of the strongest rung entered by ${AGE} (-1 = none)`)
  }

  // ---- §1b do the RESULTS separate? Paired, because the means drown in tournament variance -------
  console.log(`\n${rule()}`)
  console.log(`§1b  RESULTS, PAIRED – does a better aim buy rank, rung or prize? (the layer-1/layer-2 question)`)
  console.log(rule())
  const duels: Array<[string, string]> = [
    ['unaimed', 'oracle'],
    ['eye-self', 'eye-elite'],
    ['unaimed', 'eye-elite'],
  ]
  console.log(
    `\n  ${padEnd('duel (b vs a)', 24)}${padEnd('cell', 9)}${pad('Δrank@22', 10)}${pad('b/w/t', 9)}${pad('Δrung@22', 10)}` +
      `${pad('b/w/t', 9)}${pad('Δprize@18', 12)}${pad('b/w/t', 9)}${pad('Δprize@22', 12)}${pad('b/w/t', 9)}`,
  )
  for (const [a, b] of duels) {
    for (const cell of CELLS) {
      const dRank: number[] = []
      const dRung: number[] = []
      const dP18: number[] = []
      const dP22: number[] = []
      let rankB = 0
      let rankW = 0
      let rungB = 0
      let rungW = 0
      let p18B = 0
      let p18W = 0
      let p22B = 0
      let p22W = 0
      for (let i = 0; i < SEEDS; i++) {
        const sa = snapAt(get(cell, a, i), 22)
        const sb = snapAt(get(cell, b, i), 22)
        if (sa && sb) {
          if (sa.rank !== null && sb.rank !== null) {
            dRank.push(sb.rank - sa.rank)
            if (sb.rank < sa.rank) rankB++
            else if (sb.rank > sa.rank) rankW++
          }
          dRung.push(sb.rung - sa.rung)
          if (sb.rung > sa.rung) rungB++
          else if (sb.rung < sa.rung) rungW++
          dP22.push(sb.prizeCents - sa.prizeCents)
          if (sb.prizeCents > sa.prizeCents) p22B++
          else if (sb.prizeCents < sa.prizeCents) p22W++
        }
        const ea = snapAt(get(cell, a, i), 18)
        const eb = snapAt(get(cell, b, i), 18)
        if (ea && eb) {
          dP18.push(eb.prizeCents - ea.prizeCents)
          if (eb.prizeCents > ea.prizeCents) p18B++
          else if (eb.prizeCents < ea.prizeCents) p18W++
        }
      }
      const t = (n: number, better: number, worse: number) => `${better}/${worse}/${n - better - worse}`
      console.log(
        `  ${padEnd(`${b} vs ${a}`, 24)}${padEnd(cell, 9)}${pad(mean(dRank).toFixed(0), 10)}${pad(t(dRank.length, rankB, rankW), 9)}` +
          `${pad(mean(dRung) >= 0 ? `+${mean(dRung).toFixed(2)}` : mean(dRung).toFixed(2), 10)}${pad(t(dRung.length, rungB, rungW), 9)}` +
          `${pad(money(Math.round(mean(dP18))), 12)}${pad(t(dP18.length, p18B, p18W), 9)}` +
          `${pad(money(Math.round(mean(dP22))), 12)}${pad(t(dP22.length, p22B, p22W), 9)}`,
      )
    }
  }
  console.log(`\n  Δrank negative = b ranks better; b/w/t = pairs where b is better / worse / tied on that axis.`)

  // ---- §2 the ladder question: do the tiers separate? -------------------------------------------
  console.log(`\n${rule()}`)
  console.log(`§2  THE LADDER, READ AS A LADDER – paired gaps between adjacent arms (skill points at 18 / at 22)`)
  console.log(rule())
  const ladder = ['unaimed', 'eye-self', 'eye-budget', 'eye-middle', 'eye-high', 'eye-elite', 'oracle']
  for (const cell of CELLS) {
    console.log(`\n  ${cell}: ${padEnd('step', 24)}${pad('Δ@18', 8)}${pad('b/w/t', 10)}${pad('Δ@22', 8)}${pad('b/w/t', 10)}`)
    for (let s = 1; s < ladder.length; s++) {
      const lo = ladder[s - 1]
      const hi = ladder[s]
      const d18: number[] = []
      const d22: number[] = []
      let b18 = 0
      let w18 = 0
      let b22 = 0
      let w22 = 0
      for (let i = 0; i < SEEDS; i++) {
        const a = snapAt(get(cell, hi, i), 18)?.skillSum
        const b = snapAt(get(cell, lo, i), 18)?.skillSum
        if (a !== undefined && b !== undefined) {
          d18.push(a - b)
          if (a > b) b18++
          else if (a < b) w18++
        }
        const a2 = snapAt(get(cell, hi, i), 22)?.skillSum
        const b2 = snapAt(get(cell, lo, i), 22)?.skillSum
        if (a2 !== undefined && b2 !== undefined) {
          d22.push(a2 - b2)
          if (a2 > b2) b22++
          else if (a2 < b2) w22++
        }
      }
      console.log(
        `  ${padEnd(`${lo} → ${hi}`, 30)}${pad(mean(d18) >= 0 ? `+${mean(d18).toFixed(2)}` : mean(d18).toFixed(2), 8)}${pad(`${b18}/${w18}/${d18.length - b18 - w18}`, 10)}` +
          `${pad(mean(d22) >= 0 ? `+${mean(d22).toFixed(2)}` : mean(d22).toFixed(2), 8)}${pad(`${b22}/${w22}/${d22.length - b22 - w22}`, 10)}`,
      )
    }
  }
  console.log(`\n  A step is player-noticeable at ~${TRAINING_FOG_FLOOR} points (TRAINING_FOG_FLOOR – the radar's own notch).`)

  // ---- §2b what the eyes actually chose ---------------------------------------------------------
  console.log(`\n${rule()}`)
  console.log(`§2b  THE EYES AT WORK – agreement with the truth's choice, and what each arm aimed at`)
  console.log(rule())
  console.log(`\n  ${padEnd('arm', 13)}${pad('agree w/ truth', 15)}${pad('serve', 8)}${pad('rally', 8)}${pad('fitness', 9)}${pad('matchplay', 10)}`)
  for (const arm of ARMS.filter((a) => a.kind !== 'unaimed')) {
    const cs = rows.filter((r) => r.arm === arm.id)
    const seasons = cs.reduce((a, c) => a + c.seasons, 0)
    const agree = cs.reduce((a, c) => a + c.agreedWithTruth, 0)
    const tot = (k: AimKind) => cs.reduce((a, c) => a + c.chose[k], 0)
    console.log(
      `  ${padEnd(arm.id, 13)}${pad(shareOf(agree, seasons), 15)}${pad(tot('serve'), 8)}${pad(tot('rally'), 8)}${pad(tot('fitness'), 9)}${pad(tot('matchplay'), 10)}`,
    )
  }
  const oracleRows = rows.filter((r) => r.arm === 'oracle')
  const forced = oracleRows.reduce((a, c) => a + c.pairingForcedOff, 0)
  const oracleSeasons = oracleRows.reduce((a, c) => a + c.seasons, 0)
  console.log(
    `\n  Surface gap, measured at the oracle's own decisions: in ${forced} of ${oracleSeasons} seasons (${shareOf(forced, oracleSeasons).trim()})`,
  )
  console.log(`  the single largest-headroom wing was NOT inside the chosen week's targets – the serve/ret`)
  console.log(`  pairing (×2.5 each, never ×5 one of them) is the one aim the shipped grid cannot say.`)

  // ---- §3 wasted points, and does the waste scale with talent -----------------------------------
  console.log(`\n${rule()}`)
  console.log(`§3  WHAT THE BLINDNESS COSTS – oracle's skills minus the arm's, by TRUE-headroom tercile (§2a of the spec)`)
  console.log(rule())
  for (const AGE of [18, 22]) {
    console.log(`\n  at ${AGE}:  ${padEnd('arm', 13)}${pad('all', 8)}${pad('modest T1', 11)}${pad('middle T2', 11)}${pad('prodigy T3', 12)}${pad('T3−T1', 8)}`)
    for (const armId of ['unaimed', 'eye-self', 'eye-budget', 'eye-middle', 'eye-high', 'eye-elite']) {
      const all: number[] = []
      const byT: number[][] = [[], [], []]
      for (const cell of CELLS) {
        const hs = Array.from({ length: SEEDS }, (_, i) => get(cell, 'oracle', i).headroom)
        const cut1 = pctl(hs, 1 / 3)
        const cut2 = pctl(hs, 2 / 3)
        for (let i = 0; i < SEEDS; i++) {
          const o = snapAt(get(cell, 'oracle', i), AGE)?.skillSum
          const a = snapAt(get(cell, armId, i), AGE)?.skillSum
          if (o === undefined || a === undefined) continue
          const waste = o - a
          all.push(waste)
          const h = hs[i]
          byT[h < cut1 ? 0 : h < cut2 ? 1 : 2].push(waste)
        }
      }
      console.log(
        `  ${padEnd('', 8)}${padEnd(armId, 13)}${pad(mean(all).toFixed(2), 8)}${pad(mean(byT[0]).toFixed(2), 11)}` +
          `${pad(mean(byT[1]).toFixed(2), 11)}${pad(mean(byT[2]).toFixed(2), 12)}${pad((mean(byT[2]) - mean(byT[0])).toFixed(2), 8)}`,
      )
    }
  }
  console.log(`\n  T1/T2/T3 = terciles of the TRUE roll (Σ potential − startingSkills) inside each cell, pooled across cells.`)
  console.log(`  §2a of the spec claims T3−T1 > 0: a prodigy mis-aimed must waste more than a modest girl.`)

  // ---- §4 net of the bill ------------------------------------------------------------------------
  console.log(`\n${rule()}`)
  console.log(`§4  NET OF THE BILL – the eye's own gain priced at the rung's full-attendance bill (what-money-buys §0b arithmetic)`)
  console.log(rule())
  console.log(`\n  Gain = this eye's arm minus the SELF eye's arm (self-coaching reads the same radar at ±3.36 for free).`)
  for (const cell of CELLS) {
    console.log(`\n  ${cell}:`)
    console.log(
      `  ${padEnd('rung', 9)}${pad('bill to 18', 12)}${pad('Δskill@18', 11)}${pad('$/pt @18', 11)}${pad('bill to 22', 12)}` +
        `${pad('Δskill@22', 11)}${pad('$/pt @22', 11)}${pad('Δprize@22', 12)}${pad('prize − bill', 14)}`,
    )
    for (const tier of COACH_TIERS.filter((t) => t !== 'self')) {
      const bill18 = billToAge(tier, cell, 18) - billToAge('self', cell, 18)
      const bill22 = billToAge(tier, cell, 22) - billToAge('self', cell, 22)
      const dS = (age: number): number =>
        mean(
          Array.from({ length: SEEDS }, (_, i) => {
            const a = snapAt(get(cell, `eye-${tier}`, i), age)?.skillSum
            const b = snapAt(get(cell, 'eye-self', i), age)?.skillSum
            return a !== undefined && b !== undefined ? a - b : NaN
          }).filter((x) => !Number.isNaN(x)),
        )
      const dPrize = mean(
        Array.from({ length: SEEDS }, (_, i) => {
          const a = snapAt(get(cell, `eye-${tier}`, i), 22)?.prizeCents
          const b = snapAt(get(cell, 'eye-self', i), 22)?.prizeCents
          return a !== undefined && b !== undefined ? a - b : NaN
        }).filter((x) => !Number.isNaN(x)),
      )
      const s18 = dS(18)
      const s22 = dS(22)
      console.log(
        `  ${padEnd(tier, 9)}${pad(money(bill18), 12)}${pad(s18 >= 0 ? `+${s18.toFixed(2)}` : s18.toFixed(2), 11)}` +
          `${pad(s18 > 0.005 ? money(Math.round(bill18 / s18)) : 'BUYS NOTHING', 11)}${pad(money(bill22), 12)}` +
          `${pad(s22 >= 0 ? `+${s22.toFixed(2)}` : s22.toFixed(2), 11)}${pad(s22 > 0.005 ? money(Math.round(bill22 / s22)) : 'BUYS NOTHING', 11)}` +
          `${pad(money(Math.round(dPrize)), 12)}${pad(money(Math.round(dPrize - bill22)), 14)}`,
      )
    }
  }
  console.log(`\n  ⚠ The bill is the eye's HYPOTHETICAL price – the careers themselves never pay it (self-coached`)
  console.log(`  worlds in every arm), so the gain column is the eye's marginal product, clean of the physio,`)
  console.log(`  the development multiplier and the travel squeeze §6 of what-money-buys already measured.`)

  // ---- fine print --------------------------------------------------------------------------------
  // Ended-early BY ARM, because the one confound the aim could smuggle in is the knock's location
  // tilt: an aimed week loads different joints (never a different knock RATE), so if aimed careers
  // ended hurt more often than General ones the skill tables above would be survivor-biased.
  const early = rows.filter((r) => r.endedEarly !== null)
  const earlyByArm = ARMS.map((a) => `${a.id} ${rows.filter((r) => r.arm === a.id && r.endedEarly !== null).length}`).join(' · ')
  console.log(`\n${rule()}`)
  console.log(`fine print: ${rows.length} careers; ${early.length} ended before the horizon (all: ${[...new Set(early.map((r) => r.endedEarly))].join('/')})`)
  console.log(`  by arm: ${earlyByArm}`)
  console.log(`  RNG capture ${rngOk ? 'HELD' : '⚠ MOVED'}`)
  console.log(rule())
  if (DUMP) {
    const dump = rows.map((r) => ({
      cell: r.cell,
      arm: r.arm,
      index: r.index,
      headroom: r.headroom,
      endedEarly: r.endedEarly,
      seasons: r.seasons,
      agreedWithTruth: r.agreedWithTruth,
      pairingForcedOff: r.pairingForcedOff,
      chose: r.chose,
      byAge: Object.fromEntries(r.byAge),
    }))
    writeFileSync(DUMP, JSON.stringify(dump))
    console.log(`  per-career rows written to ${DUMP}`)
  }
  if (!rngOk) process.exitCode = 1
}

main()
