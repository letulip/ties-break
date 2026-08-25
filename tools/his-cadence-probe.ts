// HIS OWN CADENCE, REPLAYED (detail/injury-arms, arm 1). The owner's pushback: under the old
// weekly arithmetic his careful style kept condition high – his saves prove it. Recovery variant C
// (pro base 5) changed the arithmetic. This probe encodes HIS style as a policy, validates it
// against his own measured landscape under base 8 FIRST (the instrument must measure the man
// before it measures the man in a new world), then replays it under shipped base 5 and the
// softening candidate base 6.
//
// THE POLICY IS HIS SAVES', not a taste – every parameter below is a derived statistic from
// tools/his-cadence-read.ts (20 snapshots, 5 careers, read-only law):
//   plan 75/25 · physio ON · hired coach (middle -> elite at maturity) · NO masseur
//   potential ~63 / skills ~61 at maturity · ~27-29 events a season at the mature cadence
//   rest gaps: 25% back-to-back, 45% two-week pairs, 30% three-plus
//   ~6 vacation-billed weeks a season (he takes the rescue whenever the game offers it)
// CONDITION AT ENTRY IS NOT IN ANY SAVE (no historical condition series exists), so the two
// thresholds below (T1 = fresh enough for back-to-back, T0 = fit enough to play at all) are
// CALIBRATED: chosen so the encoded policy reproduces his measured events/season, gap mix and
// injury landscape under base 8 within Poisson noise – and then NEVER touched across arms.
//
// The skeleton is tools/pro-season-probe.ts's own (funds topped up so money never binds, one
// donor season beyond the last reported) with one deliberate departure: NO stamped book. A #1
// stamp closes the low W rungs his mature windows still play (w15-w100), because his girls sit
// mid-table – so the probe walks a REAL career under his policy from week 0 and measures the
// mature seasons at his snapshots' own age, her rank earned through the same on-ramps his
// careers climbed. MEASUREMENT ONLY: every entry, tick and booking goes through the public
// engine commands. No engine number is written from here.
//
//   npx vite-node tools/his-cadence-probe.ts [--seeds N] [--seasons N] [--proRecovery 8|6|5]
//     [--t0 N] [--t1 N] [--minGap N] [--rescue N] [--masseur] [--plan balanced|grind|light]
//
//   --minGap raises the floor under BOTH gap rules – the "extra rest" lever of the arm's last
//   question (what would his cadence need to hold his old condition under base 5).
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  bookVacation,
  seasonIndexOf,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY, recommendVacationPackage } from '../src/engine/economy'
import { TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { SKILL_KEYS } from '../src/engine/development'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const argStr = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

// The recovery base under test – the whole point of the probe. Shipped = 5 (variant C); 8 is the
// world his saves were played in (every save predates 22.08); 6 is the softening candidate.
const CONDITION = ECONOMY.condition as unknown as { proPhaseRecoveryBase: number }
CONDITION.proPhaseRecoveryBase = argOf('proRecovery', CONDITION.proPhaseRecoveryBase)

const SEEDS = argOf('seeds', 16)
const SEASONS = argOf('seasons', 3)
// ⚠⚠ THESE THREE DEFAULTS WERE 55 / 80 / ECONOMY.practice.rescueCondition (80) UNTIL 24.08 AND
// THAT WAS A REPRODUCIBILITY DEFECT, not a taste: §7's base-8 column was produced at 92 / 72 / 65,
// its own prose says so, and running this file AS COMMITTED reproduced none of it – 1.33 onsets a
// season against §7's 0.92, 28.9 events against 25.0, 10.7 vacation packages against 6.7, and a
// back-to-back share of 49% against his measured 25%. The looser T1 lets her take a second week
// whenever she is above 80, which is most weeks, so the instrument played a cadence that is not his.
// Restored to the validated triple, which now reproduces §7 to every digit (0.92 ±0.13 / 2.35 ±0.44
// / 1.42 / 25.0 ±0.4 / 64.7 / 6.7 / 29-56-14 / 83.8 ±0.4 / 9.9 ±0.4 / trough 40 / 63% prevalence /
// 31-11-1-1). Verified 24.08, docs/specs/the-injury-landscape-2026-08.md §9.
/** fit enough to enter at all (a two-week pair) – calibrated, see the header */
const T0 = argOf('t0', 72)
/** fresh enough to take a back-to-back week – calibrated, see the header */
const T1 = argOf('t1', 92)
/** the extra-rest lever: a floor under the gap whatever her condition says */
const MIN_GAP = argOf('minGap', 1)
/** he takes the rescue whenever the game offers it – the shipped offer knob, like the bench's
 *  balanced planner. 0 switches the habit off. */
// ⚠ 65, NOT `ECONOMY.practice.rescueCondition` (80): the shipped offer knob is when the GAME offers
// a package, and calibrating against his own saves says he takes one at 65, not at every dip below
// 80. At 80 the probe books 10.7 packages a season against his measured 6.0.
const RESCUE = argOf('rescue', 65)
const MASSEUR = args.includes('--masseur')
const PLAN = argStr('plan', 'balanced') as 'grind' | 'balanced' | 'light'
/** Seasons LIVED (entering, under his policy) before the measured window opens. His mature
 *  snapshots are seasons 7-12 of real careers, so the probe walks a real career to the same age:
 *  no stamped book – the pro-season-probe's #1 stamp closes exactly the low W rungs (w15-w100)
 *  his mature windows still play, because his girls sit mid-table, not at the head of it. Her
 *  rank here is EARNED through the same on-ramps his careers climbed. */
const PRE_SEASONS = argOf('preSeasons', 8)

interface SeasonRow {
  season: number
  played: number
  matches: number
  wins: number
  entriesByTier: Partial<Record<TierId, number>>
  meanCondition: number
  atOffSeasonDoor: number
  opensNextSeasonAt: number
  firstWeek: number
  injuryOnsets: number
  bySeverity: Record<'minor' | 'moderate' | 'major' | 'severe', number>
  weeksSubKnee: number
  weeksInjured: number
  trough: number
  vacationsBooked: number
  restWeeks: number
  /** gap (weeks since the previous committed play week) of each played event this season */
  gaps: number[]
  skillMeanEnd: number
}

/** HIS VACATION HABIT, both halves, extracted verbatim so tools/his-careers-dose.ts can replay the
 *  SAME rule on a world loaded from his saves rather than keep a copy of it: the off-season family
 *  week (one elite package a year, the shipped UI offer), and the rescue he takes whenever the game
 *  makes it (condition below the offer knob -> the cheapest package that returns her to the shipped
 *  target). Returns true when a package was actually booked. */
export function bookHisVacation(world: WorldState, target: number, offSeasonBooked: Set<number>): boolean {
  const offset = target % WEEKS_PER_YEAR
  const year = Math.floor(target / WEEKS_PER_YEAR)
  if (offset === WEEKS_PER_YEAR - OFF_SEASON_WEEKS + 1 && !offSeasonBooked.has(year)) {
    try {
      bookVacation(world, target, 'elite')
      offSeasonBooked.add(year)
      return true
    } catch {
      /* not plannable */
    }
    return false
  }
  if (RESCUE > 0 && world.condition < RESCUE && world.injury === null) {
    const id = recommendVacationPackage({
      seed: world.seed,
      week: target,
      background: world.profile.background,
      condition: world.condition,
      fundsCents: world.fundsCents,
      budgetCents: world.fundsCents,
      targetCondition: ECONOMY.practice.rescueTargetCondition,
    })
    if (id) {
      try {
        bookVacation(world, target, id)
        return true
      } catch {
        /* not plannable */
      }
    }
  }
  return false
}

/** HIS entry rule: the strongest rung the engine will accept, committed near the deadline (so the
 *  condition he reads is close to the condition she plays at), gated by how fresh she is:
 *  condition >= T1 allows a back-to-back week, >= T0 allows the two-week pair, below T0 she rests.
 *  `MIN_GAP` floors both. Reads the engine's own `entryStatus` – a CAUTION is entered (the parent
 *  may push), a BLOCK never is. The track is never filtered: which rungs are on offer is her
 *  earned book's business, exactly as in his careers (the junior rungs close behind her as she
 *  outgrows them, the W window sits where her rank puts it). */
export function nextEntry(world: WorldState, lastPlayWeek: number): string | null {
  const gapRequired = Math.max(MIN_GAP, world.condition >= T1 ? 1 : world.condition >= T0 ? 2 : 99)
  if (gapRequired > 90) return null
  const entered = new Set(world.entries)
  const weeksTaken = new Set(world.season.filter((e) => entered.has(e.id)).map((e) => e.week))
  let best: { id: string; rung: number } | null = null
  for (const e of world.season) {
    if (e.week <= world.week || e.deadlineWeek > world.week + 1) continue
    if (entered.has(e.id) || weeksTaken.has(e.week)) continue
    if (e.week < lastPlayWeek + gapRequired) continue
    if (entryStatus(world, e).level === 'blocked') continue
    const rung = TIER_LADDER.indexOf(e.tier)
    if (!best || rung > best.rung) best = { id: e.id, rung }
  }
  return best?.id ?? null
}

function probe(seed: string): SeasonRow[] {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: 'elite' })
  // HIS girls, not the reprice's superstar: the POTENTIAL his saves show (mean ~63); her skills
  // start where every career starts and GROW through the lived seasons, like his did.
  world.potential = { serve: 64, ret: 62, composure: 63, stamina: 62, groundstrokes: 64 }
  world.plan = { ...WEEK_PLAN_PRESETS[PLAN] }
  world.physioActive = true
  if (MASSEUR) {
    // `masseurHired` is all the engine reads (masseurWorksThisWeek / resolveMasseur); the unlock
    // latch is a snapshot-side presentation fact, not world state.
    world.masseurHired = true
  }
  const rng = resumeMain(world.rngMain)

  const rows: SeasonRow[] = []
  let lastPlayWeek = -99
  const offSeasonBooked = new Set<number>()
  for (let s = 0; s <= PRE_SEASONS + SEASONS; s++) {
    const row: SeasonRow = {
      season: seasonIndexOf(world.week + 1),
      played: 0,
      matches: 0,
      wins: 0,
      entriesByTier: {},
      meanCondition: 0,
      atOffSeasonDoor: 0,
      opensNextSeasonAt: 0,
      firstWeek: 0,
      injuryOnsets: 0,
      bySeverity: { minor: 0, moderate: 0, major: 0, severe: 0 },
      weeksSubKnee: 0,
      weeksInjured: 0,
      trough: ECONOMY.condition.max,
      vacationsBooked: 0,
      restWeeks: 0,
      gaps: [],
      skillMeanEnd: 0,
    }
    let condSum = 0
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      world.fundsCents = 5_000_000_00
      const target = world.week + 1
      // HIS vacation habit, both halves: the off-season family week (one elite package a year, the
      // shipped UI offer), and the rescue he takes whenever the game makes it (condition below the
      // offer knob -> the cheapest package that returns her to the shipped target).
      if (bookHisVacation(world, target, offSeasonBooked)) row.vacationsBooked++
      const id = nextEntry(world, lastPlayWeek)
      if (id) {
        try {
          const ev = world.season.find((e) => e.id === id)!
          enterEvent(world, id)
          row.entriesByTier[ev.tier] = (row.entriesByTier[ev.tier] ?? 0) + 1
          row.gaps.push(ev.week - lastPlayWeek)
          lastPlayWeek = ev.week
        } catch {
          /* the gate and the command disagreed - R10-5 says they cannot */
        }
      }
      if (world.condition < ECONOMY.condition.matchStrengthKnee) row.weeksSubKnee += 1
      tickWeek(world, rng)
      if (world.pendingTournament) {
        const p = world.pendingTournament
        row.played += 1
        for (const m of p.result.matches) {
          if (m.aId !== KID_ID && m.bId !== KID_ID) continue
          row.matches += 1
          if (m.winnerId === KID_ID) row.wins += 1
        }
        skipTournament(world)
        closeTournament(world)
      } else {
        row.restWeeks += 1
      }
      // ⚠ ONSETS ARE COUNTED AFTER THE RUN COMMITS, NOT AFTER THE TICK, and the order is the whole
      // point: the RETIREMENT door (79% of the careful landscape's feed, spec §1) opens inside
      // `finalizeTournament` – a probe that reads `world.injury` between tick and close is blind to
      // it. `sinceWeek === world.week` is the onset marker the fatigue bench uses; note that
      // tools/pro-season-probe.ts still counts the old way, so ITS absolute onset rates are
      // weekly-door-only (its K comparisons stand – the lever moves only that door).
      if (world.injury !== null) {
        row.weeksInjured += 1
        if (world.injury.sinceWeek === world.week) {
          row.injuryOnsets += 1
          row.bySeverity[world.injury.severity] += 1
        }
      }
      condSum += world.condition
      row.trough = Math.min(row.trough, world.condition)
      const off2 = world.week % WEEKS_PER_YEAR
      if (off2 === 0) row.firstWeek = world.condition
      if (off2 === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) row.atOffSeasonDoor = world.condition
    }
    row.meanCondition = condSum / WEEKS_PER_YEAR
    row.skillMeanEnd = SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0) / SKILL_KEYS.length
    rows.push(row)
  }
  for (let i = 0; i + 1 < rows.length; i++) rows[i].opensNextSeasonAt = rows[i + 1].firstWeek
  // The measured window is the MATURE seasons (his snapshots' own age), the last walked season
  // is the opensNext donor, and the junior/rise seasons are lived but not reported.
  return rows.slice(PRE_SEASONS, PRE_SEASONS + SEASONS)
}

// ⚠ THE POLICY IS NOW IMPORTABLE, and the sweep below is guarded so importing it does not run one.
// Same escape hatch tools/fatigue-bench.ts gives tools/points-curve.ts and tools/rehab-lever.ts:
// tools/his-careers-dose.ts replays HIS entry rule (`nextEntry` + the vacation habit above) on a
// world LOADED FROM HIS SAVES rather than on a walked career, and it must be the SAME rule, not a
// copy of it. Set TB_BENCH_NO_AUTORUN before importing; never when running this probe.
if (!process.env.VITEST && !process.env.TB_BENCH_NO_AUTORUN) main()

function main(): void {
const all: SeasonRow[][] = []
for (let s = 0; s < SEEDS; s++) all.push(probe(`his-cadence-${s}`))
const flat = all.flat()

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const semOf = (xs: number[]) => {
  const m = mean(xs)
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1)
  return Math.sqrt(v / xs.length)
}

console.log(
  `HIS OWN CADENCE – ${SEEDS} careers x ${SEASONS} pro seasons, plan ${PLAN} ` +
    `${WEEK_PLAN_PRESETS[PLAN].train}/${WEEK_PLAN_PRESETS[PLAN].rest}, physio on, ` +
    `T1(back-to-back)=${T1} T0(pair)=${T0} minGap=${MIN_GAP} rescue<${RESCUE} masseur=${MASSEUR ? 'on' : 'off'}` +
    `\n  proPhaseRecoveryBase ${CONDITION.proPhaseRecoveryBase} · recoveryBase ${ECONOMY.condition.recoveryBase}` +
    ` · knee ${ECONOMY.condition.matchStrengthKnee}` +
    ` · TB_REHAB_F=${process.env.TB_REHAB_F ?? '1'} TB_SUBKNEE_K=${process.env.TB_SUBKNEE_K ?? '0'}`,
)

console.log('\n  season  played  matches  wins   meanCond  wk49door  opensNext  onsets  wksOut  trough  vac  rest')
for (let i = 0; i < SEASONS; i++) {
  const rows = all.map((r) => r[i]).filter(Boolean)
  const f = (get: (r: SeasonRow) => number, d = 1) => mean(rows.map(get)).toFixed(d)
  console.log(
    `  ${String(i).padStart(6)}  ${f((r) => r.played).padStart(6)}  ${f((r) => r.matches).padStart(7)}` +
      `  ${f((r) => r.wins).padStart(4)}  ${f((r) => r.meanCondition, 0).padStart(9)}  ${f((r) => r.atOffSeasonDoor, 0).padStart(8)}` +
      `  ${f((r) => r.opensNextSeasonAt, 0).padStart(9)}  ${f((r) => r.injuryOnsets, 2).padStart(6)}` +
      `  ${f((r) => r.weeksInjured).padStart(6)}  ${f((r) => r.trough, 0).padStart(6)}  ${f((r) => r.vacationsBooked).padStart(3)}` +
      `  ${f((r) => r.restWeeks).padStart(4)}`,
  )
}

const gaps = flat.flatMap((r) => r.gaps).filter((g) => g > 0 && g <= 26)
const gapShare = (pred: (g: number) => boolean) => ((100 * gaps.filter(pred).length) / Math.max(1, gaps.length)).toFixed(0)
const totalMatches = flat.reduce((a, r) => a + r.matches, 0)
const totalOnsets = flat.reduce((a, r) => a + r.injuryOnsets, 0)
const sev = (['minor', 'moderate', 'major', 'severe'] as const).map((s) => flat.reduce((a, r) => a + r.bySeverity[s], 0))

console.log('\n  THE LANDSCAPE AT HIS CADENCE (pooled per-season, the his-saves comparison row)')
console.log(
  `    events/season ${mean(flat.map((r) => r.played)).toFixed(1)} ± ${semOf(flat.map((r) => r.played)).toFixed(1)}` +
    ` · matches/season ${mean(flat.map((r) => r.matches)).toFixed(1)}` +
    ` · gap mix 1w ${gapShare((g) => g === 1)}% / 2w ${gapShare((g) => g === 2)}% / >=3w ${gapShare((g) => g >= 3)}%` +
    ` (mean ${mean(gaps).toFixed(2)}w)`,
)
console.log(
  `    onsets/season ${mean(flat.map((r) => r.injuryOnsets)).toFixed(2)} ± ${semOf(flat.map((r) => r.injuryOnsets)).toFixed(2)}` +
    ` · weeks lost/season ${mean(flat.map((r) => r.weeksInjured)).toFixed(2)} ± ${semOf(flat.map((r) => r.weeksInjured)).toFixed(2)}` +
    ` · inj/100m ${((100 * totalOnsets) / Math.max(1, totalMatches)).toFixed(2)}` +
    ` · severity mi/mo/ma/se ${sev.join('/')}`,
)
console.log(
  `    mean condition ${mean(flat.map((r) => r.meanCondition)).toFixed(1)} ± ${semOf(flat.map((r) => r.meanCondition)).toFixed(1)}` +
    ` · weeks below knee(70)/season ${mean(flat.map((r) => r.weeksSubKnee)).toFixed(1)} ± ${semOf(flat.map((r) => r.weeksSubKnee)).toFixed(1)}` +
    ` · trough ${mean(flat.map((r) => r.trough)).toFixed(0)}` +
    ` · at the off-season door ${mean(flat.map((r) => r.atOffSeasonDoor)).toFixed(0)}` +
    ` · opens next ${mean(flat.map((r) => r.opensNextSeasonAt)).toFixed(0)}`,
)
console.log(
  `    vacations booked/season ${mean(flat.map((r) => r.vacationsBooked)).toFixed(1)}` +
    ` · rest weeks/season ${mean(flat.map((r) => r.restWeeks)).toFixed(1)}` +
    ` · season prevalence ${((100 * flat.filter((r) => r.injuryOnsets > 0).length) / flat.length).toFixed(0)}%` +
    ` · end skill mean ${mean(flat.map((r) => r.skillMeanEnd)).toFixed(2)}`,
)
const byTier = new Map<TierId, number>()
for (const r of flat) for (const [t, n] of Object.entries(r.entriesByTier)) byTier.set(t as TierId, (byTier.get(t as TierId) ?? 0) + (n ?? 0))
console.log(
  `    entries by tier: ${[...byTier.entries()]
    .sort((a, b) => TIER_LADDER.indexOf(a[0]) - TIER_LADDER.indexOf(b[0]))
    .map(([t, n]) => `${t} ${(n / flat.length).toFixed(1)}`)
    .join(' · ')}`,
)
}
