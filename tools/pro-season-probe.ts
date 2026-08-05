// THE PROFESSIONAL PAIR - the acceptance bench for docs/specs/fatigue-reprice-2026-08.md.
//
//   npx vite-node tools/pro-season-probe.ts [--seeds N] [--seasons N] [--plan light|balanced|grind]
//                                           [--policy pair|greedy] [--vac elite|two-small|none]
//
// WHY IT EXISTS. The re-price is graded on four numbers that all describe ONE season - the owner's
// «КАЖДАЯ ВТОРАЯ НЕДЕЛЯ в году БЕЗ ПРОПУСКОВ ВООБЩЕ» season (spec §1) - and the shipped fatigue
// bench cannot see it. Its matrix is a JUNIOR career (14->18 on the domestic and J rungs), so it
// measures the era the spec explicitly does NOT move; the professional season it does move is on
// the W rungs, three seasons later, behind an acceptance ladder a parallel wave is re-deriving
// under us. This probe measures the BODY at the professional schedule and nothing else:
//
//   PLAYED         events committed per season (spec §6.1 - the pair's own count, not the ladder's)
//   SEASON SHAPE   condition at the off-season door (wk 49) and at the next season's first week
//                  (spec §6.2: 45-50, then >= 90 after the blackout weeks + the family week)
//   INJURY         % of seasons carrying >= 1 onset, at THAT schedule (spec §6.4: 46-54%)
//   A W35 TITLE    what the run costs and what she comes home at (spec §6.3: 70-78%)
//
// ⚠ THE ACCEPTANCE LIST IS DELIBERATELY BYPASSED, AND THAT IS THE POINT OF THE TOOL. It stamps an
// elite W book (`stampProBook`, the boredom-guard idiom) so `entryStatus` can never refuse her on
// RANK, and it tops her funds up so it can never refuse her on money. What a W week costs her BODY
// does not depend on which rungs she is allowed to enter, so every number here survives the
// acceptance-cut wave landing on top of it. Which rungs she may ENTER is a different question with
// its own bench (tools/ladder-walk.ts, on the field2 base) and this tool does not answer it.
//
// ⚠ SHE ARRIVES AT SIXTEEN WITH NO JUNIOR MILEAGE, on purpose. The probe ticks weeks 0..(52*2)
// with no entries at all, so the professional seasons it measures start from a clean 100 and the
// season SHAPE is the re-price's arithmetic rather than a leftover junior deficit. A career that
// carries junior wear into the pro era is the fatigue bench's question.
//
// MEASUREMENT ONLY: every entry, tick, booking and commit goes through the same public engine
// commands the UI uses. No engine number is written from here.
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  bookVacation,
  isBlackoutWeek,
  mandatoryBinds,
  isSuspendedAt,
  recomputeKidRank,
  seasonIndexOf,
  tournamentRunStrain,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
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

// ⚠ THE THREE INJURY KNOBS ARE PATCHABLE FROM THE CLI (spec §5 asks for a re-calibration SECOND,
// after the fatigue re-price is measured, and a re-calibration is a sweep). Patching the LIVE
// ECONOMY object is the fatigue bench's own `withScenario` idiom: `as const` is compile-time only,
// every feedback loop stays real, and nothing is written back to the file. Omitted = shipped value.
const KNOBS = ECONOMY.availability as unknown as {
  injuryBaseChance: number
  injuryFatigueSlope: number
  injuryPlayingMultiplier: number
}
KNOBS.injuryBaseChance = argOf('injBase', KNOBS.injuryBaseChance)
KNOBS.injuryFatigueSlope = argOf('injSlope', KNOBS.injuryFatigueSlope)
KNOBS.injuryPlayingMultiplier = argOf('injPlay', KNOBS.injuryPlayingMultiplier)

// ⚠ AND THE THREE RECOVERY KNOBS OF ISSUE #83, ON THE SAME CLI TERMS (fatigue-injury-audit-2026-08.md
// §3). The owner's own round-2 list is three questions about recovery – the weekly rate, the vacation
// table, and whether the two of them STACK – and «measure each in isolation» is not answerable without
// being able to move exactly one of them at a time.
//
//   --recovery N    ECONOMY.condition.recoveryBase (shipped 8; his list asks about 7)
//   --vacScale X    every package's conditionGain x X (0 = the table switched off entirely)
//   --noStack       the STACKING arm: a booked vacation week forfeits the weekly recovery ladder, so
//                   the package gain is all she gets that week. Nothing in the engine does this – it
//                   is the counterfactual the question needs, and it is bench-local by construction
//                   (see the note where it is applied).
const CONDITION = ECONOMY.condition as unknown as { recoveryBase: number }
CONDITION.recoveryBase = argOf('recovery', CONDITION.recoveryBase)
const VAC_SCALE = argOf('vacScale', 1)
if (VAC_SCALE !== 1) {
  for (const pkg of ECONOMY.vacation.packages as unknown as { conditionGain: number }[]) {
    pkg.conditionGain = Math.round(pkg.conditionGain * VAC_SCALE)
  }
}
const NO_STACK = args.includes('--noStack')

const SEEDS = argOf('seeds', 12)
/** Professional seasons measured, from her sixteenth year on (age 16, 17, 18 ...). */
const SEASONS = argOf('seasons', 3)
/** The plan slider. `light` (60/40) is the spec's own reference player: its §3 arithmetic reads
 *  "base 1 + the rest-slider bonus 2", which is this preset. */
const PLAN = argStr('plan', 'light') as 'grind' | 'balanced' | 'light'
/** pair = the spec's design (one played week, one rest week); greedy = the upper bound, every week
 *  the engine will take her. The pair is what §1 specifies; greedy says what the body would allow. */
const POLICY = argStr('policy', 'pair') as 'pair' | 'greedy'
/** The off-season reset under test (spec §4): «1 большим или парой небольших отпусков». */
const VACATION = argStr('vac', 'elite') as 'elite' | 'two-small' | 'none'
/** ⚠ THE PHYSIO RETAINER IS THE ONE AXIS THAT DECIDES WHETHER §6.2 READS AS PASSED, so it is a
 *  flag rather than a default. `conditionBonusPerWeek` is 1 on EVERY week, played or rested, which
 *  is +52 a season - and the spec's own §3 arithmetic ("a rest week returns 3 today: base 1 + the
 *  rest-slider bonus 2") counts no retainer at all. So `off` is the SPEC'S reference player and the
 *  number §6.2's 45-50 band was written about; `on` is what an elite-coached career actually
 *  carries, and it arrives at the off-season door roughly a season's worth of retainer higher.
 *  Both are reported in the wave, because they are two honest answers to two different questions. */
const PHYSIO = argStr('physio', 'off') as 'on' | 'off'
/** Weeks between the START of one event and the next she will enter. 2 = every second week. */
const PAIR_GAP = POLICY === 'pair' ? 2 : 1
/** Her first professional season starts here: age 16 is the earliest `minAgeYears` on any W rung. */
const PRO_START_WEEK = 2 * WEEKS_PER_YEAR

// ⚠ TEN RUNGS SINCE W3-ACT2. The probe's own question is unchanged - what a professional SCHEDULE
// costs the body - but the schedule it can now reach is the act-3 one, which is the whole point of
// re-running it: §11.3 predicted, and the pre-wave probe measured, 11.3 events a season at the
// terminal window because the top of the ladder had run out of tennis.
const W_RUNGS: readonly TierId[] = [
  'w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam',
]

interface SeasonRow {
  season: number
  age: number
  /** committed runs (a walkover / medical withdrawal is not one) */
  played: number
  matches: number
  entriesByTier: Partial<Record<TierId, number>>
  meanCondition: number
  /** condition at the season WRAP (offset 49) - the door of the off-season, spec §6.2's 45-50 */
  atOffSeasonDoor: number
  /** condition at the LAST off-season week (offset 51), after the blackout weeks + the family week */
  afterOffSeason: number
  /** ...and what she opens the next season on (offset 0 of the next year) - the >= 90 number.
   *  Filled in from the FOLLOWING row's `firstWeek`, which is why the probe walks one season more
   *  than it reports: this number is a fact about a week that belongs to the next season. */
  opensNextSeasonAt: number
  /** condition at this season's own opening week (offset 0) */
  firstWeek: number
  injuryOnsets: number
  weeksInjured: number
  /** the deepest trough of the season - the "did the re-price merely move the floor" read */
  trough: number
  /** ⚠ THE MANDATORY REGIME'S OWN RECEIPT (W3-ACT2 §6). This probe is the only tool in the repo that
   *  puts a career at the TOP of the merged table for whole seasons, which is exactly the standing
   *  the regime binds - so it is the only place the question "is the regime survivable at the volume
   *  a body can actually carry" can be measured rather than argued. */
  penaltyPoints: number
  suspendedWeeks: number
  mandatoriesDue: number
}

/** Keep her book elite so every gate but her BODY stands open - see the header. Re-stamped twice a
 *  season because the counting window rolls; the rows are hers alone, so nothing about the cohort
 *  or the calendar moves. */
function stampProBook(world: WorldState): void {
  world.results = world.results.filter((r) => r.playerId !== KID_ID)
  world.results.push({ playerId: KID_ID, week: world.week, points: 1500, tier: 'national' })
  for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
  // A W book big enough to sit at the top of the merged table whatever the acceptance cuts resolve
  // to - the share-based cuts of this base and the absolute-rank cuts landing after it alike.
  // ⚠ THE BOOK HAD TO GROW WITH THE LADDER (W3-ACT2). Against the real points-to-rank curve the
  // merged table carries, 4 x 900 = 3,600 points is roughly world #12 - which clears every W rung
  // and the WTA 250, and MISSES a 1000's #65 and a Slam's #104 by nothing at all while being
  // nowhere near the top-10 the biggest fields are drawn from. The probe's contract is that
  // `entryStatus` can never refuse her on RANK (see the header), so the book is sized to sit at the
  // head of the table: 8 x 1,800 is ~14,400, past the derived #1 on ~10,700.
  for (let i = 0; i < 8; i++) world.results.push({ playerId: KID_ID, week: world.week, points: 1800, tier: 'wta1000' })
  recomputeKidRank(world)
}

/** The strongest rung the engine will accept her into, inside the pair's rhythm. Reads the ENGINE's
 *  own `entryStatus`, so this policy can be neither kinder nor crueller than the game is; a fatigue
 *  CAUTION is entered on purpose (the owner's «the parent may push, the game warns»), a BLOCK never
 *  is. */
function nextEntry(world: WorldState, lastPlayWeek: number): string | null {
  const entered = new Set(world.entries)
  const weeksTaken = new Set(world.season.filter((e) => entered.has(e.id)).map((e) => e.week))
  let best: { id: string; rung: number } | null = null
  for (const e of world.season) {
    if (e.week <= world.week || e.week > world.week + 8) continue
    if (entered.has(e.id) || weeksTaken.has(e.week)) continue
    if (e.week < lastPlayWeek + PAIR_GAP) continue
    if (entryStatus(world, e).level === 'blocked') continue
    const rung = TIER_LADDER.indexOf(e.tier)
    if (!best || rung > best.rung) best = { id: e.id, rung }
  }
  return best?.id ?? null
}

/** The off-season family week (spec §4). ONE big package, or a pair of small ones back-to-back -
 *  the two shapes the owner named - booked into the blackout weeks, which is exactly where the UI
 *  offers them. Booked one week ahead, like every planner command. */
function bookOffSeason(world: WorldState, target: number, booked: Set<number>): void {
  const offset = target % WEEKS_PER_YEAR
  const firstOff = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49
  if (VACATION === 'none') return
  const want =
    VACATION === 'elite'
      ? offset === firstOff + 1
        ? 'elite'
        : null
      : offset === firstOff || offset === firstOff + 1
        ? 'staycation'
        : null
  if (!want) return
  try {
    bookVacation(world, target, want)
    booked.add(target)
  } catch {
    /* not plannable - the week was not on the table */
  }
}

// ⚠ THE `--noStack` ARM, AND WHY IT SUPPRESSES THE KNOBS RATHER THAN SUBTRACTING AFTERWARDS.
// `accrueCondition` clamps at 100, so "add the weekly ladder, then take it back off" is NOT the same
// world as "never add it": on a week that clamps, the subtraction lands below where the un-stacked
// week would have. Zeroing the three recovery knobs for the duration of the tick is exact - the
// vacation's own gain is applied by `resolveVacation`, which reads none of them - and it is restored
// immediately, so no other week in the run can see it.
const RECOVERY_KNOBS = ECONOMY.condition as unknown as {
  recoveryBase: number
  blackoutBonus: number
  restRecoveryBonus: { minRest: number; bonus: number }[]
}
function tickMaybeUnstacked(world: WorldState, rng: ReturnType<typeof resumeMain>, isVacationWeek: boolean): void {
  if (!NO_STACK || !isVacationWeek) {
    tickWeek(world, rng)
    return
  }
  const saved = {
    base: RECOVERY_KNOBS.recoveryBase,
    blackout: RECOVERY_KNOBS.blackoutBonus,
    slider: RECOVERY_KNOBS.restRecoveryBonus,
  }
  RECOVERY_KNOBS.recoveryBase = 0
  RECOVERY_KNOBS.blackoutBonus = 0
  RECOVERY_KNOBS.restRecoveryBonus = []
  try {
    tickWeek(world, rng)
  } finally {
    RECOVERY_KNOBS.recoveryBase = saved.base
    RECOVERY_KNOBS.blackoutBonus = saved.blackout
    RECOVERY_KNOBS.restRecoveryBonus = saved.slider
  }
}

function probe(seed: string): SeasonRow[] {
  // A genuine professional: money never binds (the economy has its own bench) and her build is
  // top-of-distribution, so the runs she plays reach real DEPTH - the cumulative ladder and the
  // per-match surcharge are only felt as often as she survives rounds.
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: 'elite' })
  world.potential = { serve: 80, ret: 78, composure: 78, stamina: 78, groundstrokes: 80 }
  world.plan = { ...WEEK_PLAN_PRESETS[PLAN] }
  world.physioActive = PHYSIO === 'on'
  const rng = resumeMain(world.rngMain)

  // The junior years, ticked WITHOUT entries: she arrives at sixteen fresh (see the header). One
  // tick short of the boundary, so the measured seasons start on their own offset-0 week.
  for (let w = 0; w < PRO_START_WEEK - 1; w++) {
    world.fundsCents = 5_000_000_00
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }

  // ⚠ ONE SEASON MORE THAN IS REPORTED. The «opens the next season at» number (spec §6.2) is a fact
  // about a week that belongs to the FOLLOWING season, so the last walked season is a donor for the
  // one before it and is dropped from the output rather than half-reported.
  const rows: SeasonRow[] = []
  let lastPlayWeek = -PAIR_GAP
  /** every week this probe successfully booked a family week into – the `--noStack` arm's input */
  const bookedVacationWeeks = new Set<number>()
  for (let s = 0; s <= SEASONS; s++) {
    const row: SeasonRow = {
      season: seasonIndexOf(world.week + 1),
      age: 14 + seasonIndexOf(world.week + 1),
      played: 0,
      matches: 0,
      entriesByTier: {},
      meanCondition: 0,
      atOffSeasonDoor: 0,
      afterOffSeason: 0,
      opensNextSeasonAt: 0,
      firstWeek: 0,
      injuryOnsets: 0,
      weeksInjured: 0,
      trough: ECONOMY.condition.max,
      penaltyPoints: 0,
      suspendedWeeks: 0,
      mandatoriesDue: 0,
    }
    let condSum = 0
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      world.fundsCents = 5_000_000_00
      if (world.week % 26 === 0) stampProBook(world)
      const target = world.week + 1
      bookOffSeason(world, target, bookedVacationWeeks)
      const id = nextEntry(world, lastPlayWeek)
      if (id) {
        try {
          const ev = world.season.find((e) => e.id === id)!
          enterEvent(world, id)
          row.entriesByTier[ev.tier] = (row.entriesByTier[ev.tier] ?? 0) + 1
          lastPlayWeek = ev.week
        } catch {
          /* the gate and the command disagreed - R10-5 says they cannot, so this is a real bug */
        }
      }
      const wasInjured = world.injury !== null
      row.mandatoriesDue += world.season.filter(
        (e) => e.deadlineWeek === world.week + 1 && mandatoryBinds(world, e) && !world.entries.includes(e.id),
      ).length
      const penaltiesBefore = (world.penalties ?? []).length
      tickMaybeUnstacked(world, rng, bookedVacationWeeks.has(target))
      for (const pen of (world.penalties ?? []).slice(penaltiesBefore)) row.penaltyPoints += pen.points
      if (isSuspendedAt(world, world.week)) row.suspendedWeeks += 1
      if (world.injury !== null) {
        row.weeksInjured += 1
        if (!wasInjured) row.injuryOnsets += 1
      }
      if (world.pendingTournament) {
        const p = world.pendingTournament
        row.played += 1
        row.matches += p.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID).length
        skipTournament(world)
        closeTournament(world)
      }
      condSum += world.condition
      row.trough = Math.min(row.trough, world.condition)
      const offset = world.week % WEEKS_PER_YEAR
      if (offset === 0) row.firstWeek = world.condition
      if (offset === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) row.atOffSeasonDoor = world.condition
      if (offset === WEEKS_PER_YEAR - 1) row.afterOffSeason = world.condition
    }
    row.meanCondition = condSum / WEEKS_PER_YEAR
    rows.push(row)
  }
  for (let i = 0; i + 1 < rows.length; i++) rows[i].opensNextSeasonAt = rows[i + 1].firstWeek
  return rows.slice(0, SEASONS)
}

// --- the W35 title, read straight off the engine ------------------------------------------------
// The spec's headline number (§2, §6.3): five matches, two of them three-setters, the run the owner
// reads off the screen. `tournamentRunStrain` is the engine's own composition (per-match surcharge +
// scoreline + the family's cumulative ladder), so this line cannot drift from what the game charges.
const TITLE_RUN = [{ score: '6-3 6-4' }, { score: '6-4 3-6 6-4' }, { score: '6-2 6-3' }, { score: '7-5 4-6 6-3' }, { score: '6-4 6-4' }]
const titleCost = (tier: TierId) => tournamentRunStrain(tier, TITLE_RUN)

const all: SeasonRow[][] = []
for (let s = 0; s < SEEDS; s++) all.push(probe(`pro-pair-${s}`))

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const flat = all.flat()

console.log(
  `THE PROFESSIONAL PAIR - ${SEEDS} careers x ${SEASONS} seasons from age 16, policy "${POLICY}" ` +
    `(gap ${PAIR_GAP}w), plan ${PLAN} ${WEEK_PLAN_PRESETS[PLAN].train}/${WEEK_PLAN_PRESETS[PLAN].rest}, ` +
    `off-season vacation "${VACATION}", physio ${PHYSIO}` +
    (VAC_SCALE !== 1 ? `, vacation gains x${VAC_SCALE}` : '') +
    (NO_STACK ? ', NO-STACK (a family week forfeits the weekly recovery ladder)' : ''),
)
console.log(
  `  knobs under test: recoveryBase ${ECONOMY.condition.recoveryBase} · W surcharges ` +
    `${W_RUNGS.map((t) => ECONOMY.condition.tierMatchFatigue[t]).join('/')} · ladder W ` +
    `[${ECONOMY.condition.runFatigueLadderWta.join(',')}] · injury base ${ECONOMY.availability.injuryBaseChance} ` +
    `+ slope ${ECONOMY.availability.injuryFatigueSlope}/pt x ${ECONOMY.availability.injuryPlayingMultiplier} playing`,
)
console.log(
  `  a rest week returns ${ECONOMY.condition.recoveryBase} + slider ` +
    `${WEEK_PLAN_PRESETS[PLAN].rest >= 40 ? 2 : WEEK_PLAN_PRESETS[PLAN].rest >= 25 ? 1 : 0}` +
    `${PHYSIO === 'on' ? ` + ${ECONOMY.physio.conditionBonusPerWeek} physio (EVERY week, played or not)` : ''}` +
    ` (+${ECONOMY.condition.blackoutBonus} on a blackout week)`,
)

console.log('\n  A TITLE RUN (5 matches, two of them 3-setters) - cost, and what she comes home at:')
for (const tier of W_RUNGS) {
  const cost = titleCost(tier)
  console.log(
    `    ${tier.padEnd(7)} ${String(cost).padStart(3)} condition -> home at ${String(100 - cost).padStart(3)}%` +
      (tier === 'w35' ? '   <- spec §6.3 target 70-78%' : ''),
  )
}

console.log('\n  season   age   played  matches   mean cond   wk49 door   wk51   opens next   onsets  wks out  trough')
for (let i = 0; i < SEASONS; i++) {
  const rows = all.map((r) => r[i]).filter(Boolean)
  if (rows.length === 0) continue
  const f = (get: (r: SeasonRow) => number, d = 1) => mean(rows.map(get)).toFixed(d)
  console.log(
    `  ${String(i).padStart(6)}   ${String(rows[0].age).padStart(3)}   ${f((r) => r.played).padStart(6)}` +
      `   ${f((r) => r.matches).padStart(7)}   ${f((r) => r.meanCondition, 0).padStart(9)}` +
      `   ${f((r) => r.atOffSeasonDoor, 0).padStart(9)}   ${f((r) => r.afterOffSeason, 0).padStart(4)}` +
      `   ${f((r) => r.opensNextSeasonAt, 0).padStart(10)}   ${f((r) => r.injuryOnsets, 2).padStart(6)}` +
      `   ${f((r) => r.weeksInjured).padStart(7)}   ${f((r) => r.trough, 0).padStart(6)}`,
  )
}

const prevalence = (100 * flat.filter((r) => r.injuryOnsets > 0).length) / flat.length
const byTier = new Map<TierId, number>()
for (const r of flat) for (const [t, n] of Object.entries(r.entriesByTier)) byTier.set(t as TierId, (byTier.get(t as TierId) ?? 0) + n)

console.log('\n  THE FIVE ACCEPTANCE NUMBERS (docs/specs/fatigue-reprice-2026-08.md §6)')
console.log(`    1. PLAYED per season          ${mean(flat.map((r) => r.played)).toFixed(1).padStart(6)}   target 20-30`)
console.log(
  `    2. at the off-season door     ${mean(flat.map((r) => r.atOffSeasonDoor)).toFixed(0).padStart(6)}   target 45-50` +
    `\n       opens the next season at   ${mean(flat.map((r) => r.opensNextSeasonAt)).toFixed(0).padStart(6)}   target >= 90`,
)
console.log(`    3. home from a W35 title      ${String(100 - titleCost('w35')).padStart(6)}%  target 70-78%`)
console.log(`    4. season injury prevalence   ${prevalence.toFixed(0).padStart(6)}%  target 46-54%`)
console.log(
  `    entries by tier: ${[...byTier.entries()]
    .sort((a, b) => TIER_LADDER.indexOf(a[0]) - TIER_LADDER.indexOf(b[0]))
    .map(([t, n]) => `${t} ${(n / flat.length).toFixed(1)}`)
    .join(' · ')}`,
)
console.log(
  // W4-SCHOOL: a season's blackout weeks are now an age question. The probe's own player is a
  // schoolgirl for three of its four seasons, so this reports the SCHOOL-AGE season, which is the
  // one the acceptance numbers above were written against.
  `    blackout weeks a season: ${Array.from({ length: WEEKS_PER_YEAR }, (_, w) => w).filter((w) => isBlackoutWeek(w, false)).length}` +
    ` · W rung ages: ${W_RUNGS.map((t) => `${t} ${TIERS[t].minAgeYears}+`).join(' ')}`,
)

// ⚠ THE MANDATORY REGIME, MEASURED AT THE ONLY STANDING IT BINDS (W3-ACT2, act2-pro-tour.md §6).
// This probe stamps her to the head of the merged table for every week it walks, so the regime is
// live throughout - which is the harshest possible reading of it and therefore the honest one. What
// it answers is the question the owner's own ruling forces: a regime that suspends her whatever she
// does is not «a price she chose to pay», it is a punishment with extra steps.
console.log('\n  THE MANDATORY REGIME (act2-pro-tour.md §6) at this schedule')
console.log(
  `    obligations that fell due per season   ${mean(flat.map((r) => r.mandatoriesDue)).toFixed(1).padStart(6)}` +
    `   (${ECONOMY.mandatory.perEventTiers.join(' + ')} bind the top ${ECONOMY.mandatory.maxRank}, ` +
    `plus ${ECONOMY.mandatory.quota} of the ${ECONOMY.mandatory.quotaTier}s)`,
)
console.log(
  `    penalty points charged per season      ${mean(flat.map((r) => r.penaltyPoints)).toFixed(1).padStart(6)}` +
    `   suspension at ${ECONOMY.mandatory.suspensionAt} inside ${ECONOMY.mandatory.windowWeeks} weeks`,
)
console.log(
  `    weeks suspended per season             ${mean(flat.map((r) => r.suspendedWeeks)).toFixed(1).padStart(6)}` +
    `   seasons carrying a suspension: ${((100 * flat.filter((r) => r.suspendedWeeks > 0).length) / flat.length).toFixed(0)}%`,
)
