/**
 * injury-cause-probe – THREE INJURIES IN ONE SEASON AT HIGH CONDITION: tail, or a second door?
 *
 * The owner, 11.08 (round-16 item #13): one Olivia season took SIX weeks, then FOUR, then FOUR, and
 * she was at high condition throughout. `injuryTau` reads condition, so high condition is supposed to
 * mean low risk. Two hypotheses, and the triage doc (docs/specs/round16-triage.md §1) refuses to
 * argue them:
 *
 *   (a) the weekly `injuryTau` roll is behaving exactly as designed and the save is a bad-luck tail;
 *   (b) the in-match retirement hazard is ADDING injuries on top of it. `tools/injury-ratio-probe.ts`
 *       already measured the footprint once – careful-policy injuries went 24 -> 68 when retirement
 *       shipped – and the mechanism is that `retireHazard` reads `spentness`, which accumulates
 *       WITHIN a match, so it lands on whoever plays LONG matches. The careful parent plays long
 *       matches; the grinder loses her opener in ninety points and collects no hazard at all
 *       (docs/specs/match-retirement.md §4.1).
 *
 * The ratio probe cannot tell them apart because it counts injuries and an injury has no cause on it.
 * This one does, three ways, and reports all three so a disagreement is visible rather than averaged:
 *
 *   1. BY CAUSE. `onsetInjury` writes a different sentence for each door – "Injury: …" / "Bad news
 *      from the clinic: …" for the weekly roll, "She had to stop: …" / "She stopped, and this time it
 *      is serious: …" for the retirement (injury.ts, the owner's ruling of 10.08). Read off the news
 *      feed exactly the way the fatigue bench already reads its walkover and medical-withdrawal
 *      markers.
 *   2. CROSS-CHECKED AGAINST STATE, not only text. `MatchRecord.retiredId === KID_ID` on the week's
 *      match rows is the same fact with no copy in it. The two counters must agree; any week where
 *      they do not is printed.
 *   3. AGAINST THE MODEL'S OWN INTENT. `injuryTau(world)` is pure state and spends no draw on any
 *      stream, so it can be evaluated for the week the tick is ABOUT to roll and summed. Σ tau over
 *      her at-risk weeks IS the number of weekly-roll injuries the design predicts. Measured against
 *      it, hypothesis (a) is a yes/no rather than an opinion.
 *
 * ⚠ NO SCHEMA CHANGE AND NO ENGINE CHANGE. `InjuryCause` is private to `engine/world/injury.ts` and
 * `injuryHistory` rows carry no cause; putting one on them would be a save-schema move and the owner's
 * call, not this probe's. Everything here is a counter on the BENCH side reading state the world
 * already publishes. This file imports the engine read-only and changes no constant.
 *
 * ⚠ AND IT REPORTS PER SEASON, not per career, because that is the question. "Three in one season" is
 * a statement about a 52-week block, so the unit of observation is a season-year and the answer is the
 * shape of that distribution – not a mean.
 *
 * Run:  npx vite-node tools/injury-cause-probe.ts -- [--seeds 30] [--weeks 208] [--policy careful]
 */
// ⚠ MUST come before the dynamic import below, and a STATIC import of the bench would be a bug:
// fatigue-bench.ts self-runs its whole `main()` on import outside vitest. Same escape hatch and same
// reason as tools/injury-ratio-probe.ts and tools/points-curve.ts.
process.env.TB_BENCH_NO_AUTORUN = '1'
const { PROFILES, POLICIES, openFatigueCareer, stepFatigueWeek } = await import('./fatigue-bench')

import { ECONOMY } from '../src/engine/economy'
import { injuryTau, KID_ID } from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** The two doors, as `onsetInjury` writes them. Disjoint prefixes by construction – see the ⚠ block
 *  above `addEvent` in injury.ts, where the retirement's three sentences are kept apart from the
 *  weekly roll's three ON PURPOSE ("the same ankle, the same five weeks out, and one of them happened
 *  in a car park"). Every other `'injury'`-typed row (a walkover, a medical withdrawal) matches
 *  neither list and is correctly counted as no onset at all. */
const WEEK_ONSET_PREFIXES = ['Injury: ', 'Bad news from the clinic: ']
const RETIRE_ONSET_PREFIXES = ['She had to stop: ', 'She stopped, and this time it is serious: ']

type Cause = 'week' | 'retirement'

interface SeasonRow {
  profile: string
  policy: string
  seed: string
  seasonIndex: number
  /** mean post-week condition across the season's weeks – how fresh she really was. */
  meanCondition: number
  weekOnsets: number
  retireOnsets: number
  /** weeks she began healthy, i.e. weeks the occurrence roll could actually fire on. */
  atRiskWeeks: number
  /** Σ injuryTau over those weeks – the weekly roll's own prediction for this season. */
  expectedWeekOnsets: number
  matchesPlayed: number
  weeksOut: number
}

interface Disagreement {
  seed: string
  week: number
  textCause: Cause
  retiredRow: boolean
}

function n(x: number, w = 7, d = 2): string {
  return x.toFixed(d).padStart(w)
}

/** One career, week by week, with the cause of every onset recorded. */
function runCareer(
  profile: (typeof PROFILES)[number],
  policy: (typeof POLICIES)[number],
  index: number,
  horizonWeeks: number,
  disagreements: Disagreement[],
): SeasonRow[] {
  const { world, rng, seed } = openFatigueCareer(profile, policy, index)
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }

  const seasons = new Map<number, SeasonRow>()
  const rowFor = (week: number): SeasonRow => {
    const idx = Math.floor(week / WEEKS_PER_YEAR)
    let row = seasons.get(idx)
    if (!row) {
      row = {
        profile: profile.label,
        policy: policy.id,
        seed,
        seasonIndex: idx,
        meanCondition: 0,
        weekOnsets: 0,
        retireOnsets: 0,
        atRiskWeeks: 0,
        expectedWeekOnsets: 0,
        matchesPlayed: 0,
        weeksOut: 0,
      }
      seasons.set(idx, row)
    }
    return row
  }
  const weeksInSeason = new Map<number, number>()

  for (let i = 0; i < horizonWeeks; i++) {
    // THE PREDICTION, taken BEFORE the tick and at week+1 on purpose – the same trick, and the same
    // justification, as the bench's own rival sample. `tickWeek` increments the week FIRST and reaches
    // `rollInjury` at step 1c, before `accrueCondition` and before this week's result rows exist, so
    // every input `injuryTau` reads (condition, results, entries, vacations, knock, kit) still holds
    // the value the roll will see. The week number is the one thing that has not moved yet, so it is
    // moved here and put back. `injuryTau` is pure and spends no draw on any stream – the file header
    // in injury.ts says so in as many words – so this cannot perturb the career.
    const atRisk = world.injury === null
    let tau = 0
    if (atRisk) {
      world.week += 1
      tau = injuryTau(world)
      world.week -= 1
    }
    const firstEventId = world.nextEventId

    const f = stepFatigueWeek(world, rng, policy, plannerState)

    const row = rowFor(f.week)
    weeksInSeason.set(row.seasonIndex, (weeksInSeason.get(row.seasonIndex) ?? 0) + 1)
    row.meanCondition += f.condition
    row.matchesPlayed += f.matchScores.length
    if (f.injured) row.weeksOut += 1
    if (atRisk) {
      row.atRiskWeeks += 1
      row.expectedWeekOnsets += tau
    }

    if (!f.injuryOnset) continue

    // ⚠ THE WINDOW IS THE BENCH'S OWN. Event ids are monotonic and nothing prunes a row inside its
    // own week, so `id >= firstEventId` is exactly "emitted by this tick".
    const fresh = world.events.filter((ev) => ev.id >= firstEventId)
    const onsetRow = fresh.find(
      (ev) =>
        ev.type === 'injury' &&
        (WEEK_ONSET_PREFIXES.some((p) => ev.text.startsWith(p)) || RETIRE_ONSET_PREFIXES.some((p) => ev.text.startsWith(p))),
    )
    const textCause: Cause =
      onsetRow && RETIRE_ONSET_PREFIXES.some((p) => onsetRow.text.startsWith(p)) ? 'retirement' : 'week'
    // The same fact with no copy in it: a match row this week that says SHE stopped. Covers the
    // tournament and the practice friendly alike – both persist `retiredId` on the event's match.
    const retiredRow = fresh.some((ev) => ev.match?.retiredId === KID_ID)
    if ((textCause === 'retirement') !== retiredRow) {
      disagreements.push({ seed, week: f.week, textCause, retiredRow })
    }
    if (textCause === 'retirement') row.retireOnsets += 1
    else row.weekOnsets += 1
  }

  for (const [idx, weeks] of weeksInSeason) seasons.get(idx)!.meanCondition /= weeks
  return [...seasons.values()]
}

/** Distribution of a per-season count: how many seasons saw 0, 1, 2, 3, 4+ of it. */
function histogram(counts: number[]): number[] {
  const h = [0, 0, 0, 0, 0]
  for (const c of counts) h[Math.min(c, 4)] += 1
  return h
}

function printBand(label: string, rows: SeasonRow[]): void {
  if (rows.length === 0) {
    console.log(`  ${label.padEnd(30)}  (no seasons)`)
    return
  }
  const seasons = rows.length
  const sum = (f: (r: SeasonRow) => number) => rows.reduce((s, r) => s + f(r), 0)
  const week = sum((r) => r.weekOnsets)
  const ret = sum((r) => r.retireOnsets)
  const exp = sum((r) => r.expectedWeekOnsets)
  const total = week + ret
  console.log(
    `  ${label.padEnd(30)} ${String(seasons).padStart(7)} ${n(sum((r) => r.meanCondition) / seasons, 8, 1)} ` +
      `${n(week / seasons, 9, 3)} ${n(ret / seasons, 9, 3)} ${n(total / seasons, 9, 3)} ` +
      `${n(total === 0 ? 0 : (100 * ret) / total, 8, 1)}% ${n(exp / seasons, 9, 3)}`,
  )
}

function printDistribution(label: string, rows: SeasonRow[]): void {
  const totals = rows.map((r) => r.weekOnsets + r.retireOnsets)
  const weekOnly = rows.map((r) => r.weekOnsets)
  const h = histogram(totals)
  const hw = histogram(weekOnly)
  const n3 = totals.filter((c) => c >= 3).length
  const n3w = weekOnly.filter((c) => c >= 3).length
  console.log(`\n${label} – ${rows.length} season-years`)
  console.log(`                        0        1        2        3       4+     P(>=3)`)
  console.log(
    `  injuries (all)   ${h.map((x) => String(x).padStart(8)).join(' ')}   ${n((100 * n3) / Math.max(1, rows.length), 6, 1)}%`,
  )
  console.log(
    `  weekly roll only ${hw.map((x) => String(x).padStart(8)).join(' ')}   ${n((100 * n3w) / Math.max(1, rows.length), 6, 1)}%`,
  )
  const worst = [...totals].sort((a, b) => b - a)[0] ?? 0
  console.log(`  worst season observed: ${worst} injuries`)
}

function main(): void {
  const args = process.argv.slice(2)
  const seeds = Number(args[args.indexOf('--seeds') + 1]) || 30
  const horizon = Number(args[args.indexOf('--weeks') + 1]) || 208
  const policyArg = args.indexOf('--policy') >= 0 ? args[args.indexOf('--policy') + 1] : 'careful'
  const policy = POLICIES.find((p) => p.id === policyArg)!
  // The two profiles the 104w anchor and the ratio probe both use, so this measurement sits beside
  // theirs rather than beside a new population.
  const profiles = [
    PROFILES.find((p) => p.background === 'working' && p.coachTier === 'self')!,
    PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'self')!,
  ]

  console.log(
    `\ninjury-cause-probe · ${seeds} seeds × ${profiles.length} profiles · ${horizon} weeks ` +
      `(${(horizon / WEEKS_PER_YEAR).toFixed(0)} seasons each) · policy '${policy.id}'\n`,
  )

  const disagreements: Disagreement[] = []
  const rows: SeasonRow[] = []
  for (const profile of profiles) {
    for (let i = 0; i < seeds; i++) rows.push(...runCareer(profile, policy, i, horizon, disagreements))
  }

  // ── 1. THE SPLIT ────────────────────────────────────────────────────────────
  console.log(`INJURIES PER SEASON, BY THE DOOR THEY CAME IN BY`)
  console.log(`  band                          seasons  meanCond    weekly  retired     total  retired%  predicted`)
  printBand('ALL', rows)
  printBand('mean condition >= 80', rows.filter((r) => r.meanCondition >= 80))
  printBand('mean condition 70-79', rows.filter((r) => r.meanCondition >= 70 && r.meanCondition < 80))
  printBand('mean condition 40-69', rows.filter((r) => r.meanCondition >= 40 && r.meanCondition < 70))
  printBand('mean condition < 40', rows.filter((r) => r.meanCondition < 40))
  console.log(
    `\n  'predicted' = Σ injuryTau over her at-risk weeks – what the WEEKLY roll alone is designed to\n` +
      `  deliver. Compare it with the 'weekly' column, never with 'total': the retirement is a second\n` +
      `  door and the weekly model has never claimed to account for it.`,
  )

  // ── 2. THE DISTRIBUTION, WHICH IS THE OWNER'S ACTUAL QUESTION ───────────────
  const high = rows.filter((r) => r.meanCondition >= 70)
  printDistribution('AT HIGH CONDITION (season mean >= 70)', high)
  printDistribution('EVERY SEASON MEASURED', rows)

  // ── 3. PREDICTED vs MEASURED, on the weekly roll alone ──────────────────────
  const sum = (f: (r: SeasonRow) => number, rs: SeasonRow[] = rows) => rs.reduce((s, r) => s + f(r), 0)
  const atRisk = sum((r) => r.atRiskWeeks)
  const expected = sum((r) => r.expectedWeekOnsets)
  const observed = sum((r) => r.weekOnsets)
  // Poisson-ish s.e. on the count of a rare per-week event.
  const se = Math.sqrt(expected)
  console.log(`\nTHE WEEKLY ROLL, PREDICTED vs MEASURED (CLAUDE.md invariant 4)`)
  console.log(`  at-risk weeks (she began the week healthy) : ${atRisk}`)
  console.log(`  Σ injuryTau over them  – PREDICTED onsets  : ${expected.toFixed(1)}  (1 s.e. ≈ ${se.toFixed(1)})`)
  console.log(`  weekly-cause onsets    – MEASURED          : ${observed}`)
  console.log(`  deviation                                  : ${((observed - expected) / se).toFixed(2)} s.e.`)
  console.log(`  mean realised tau                          : ${(expected / atRisk).toFixed(5)} /wk`)

  // ── 4. THE RETIREMENT, AGAINST ITS OWN SHIPPED CALIBRATION ──────────────────
  const matches = sum((r) => r.matchesPlayed)
  const retired = sum((r) => r.retireOnsets)
  console.log(`\nTHE RETIREMENT, AGAINST ITS OWN SHIPPED CALIBRATION`)
  console.log(`  her matches played                         : ${matches}`)
  console.log(`  retirement onsets                          : ${retired}   (${((100 * retired) / Math.max(1, matches)).toFixed(2)}% of her matches)`)
  console.log(`  docs/specs/match-retirement.md §4 target    : 1.39% of her matches`)

  // ── 5. THE TWO COUNTERS AGREEING ────────────────────────────────────────────
  console.log(`\nCROSS-CHECK – the news line and the match row must name the same cause`)
  if (disagreements.length === 0) {
    console.log(`  ${sum((r) => r.weekOnsets + r.retireOnsets)} onsets, 0 disagreements.`)
  } else {
    console.log(`  ⚠ ${disagreements.length} DISAGREEMENTS:`)
    for (const d of disagreements.slice(0, 20)) {
      console.log(`    seed ${d.seed} week ${d.week}: text says ${d.textCause}, retiredId row ${d.retiredRow ? 'present' : 'absent'}`)
    }
  }

  // ── 6. THE KNOBS, FOR THE RECORD ────────────────────────────────────────────
  const a = ECONOMY.availability
  console.log(`\nTHE KNOBS THIS MEASURES`)
  console.log(`  injuryBaseChance ${a.injuryBaseChance} · injuryFatigueSlope ${a.injuryFatigueSlope} · cap ${a.injuryChanceCap}`)
  console.log(`  injuryPlayingMultiplier ${a.injuryPlayingMultiplier} · injuryVacationFactor ${a.injuryVacationFactor}`)
  console.log(`  nominal tau at condition 100 (zero fatigue, before every multiplier): ${a.injuryBaseChance}`)
}

main()
