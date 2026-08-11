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
  /** ⚠ THE NUMBER THE OWNER ACTUALLY FEELS, and it is not the one above. `weeksOut` counts the
   *  weeks of THIS season she spent injured – so a layoff that straddles the season boundary is
   *  split across two rows, which is right for "how much of that season did she lose" and wrong for
   *  "how long was the injury". These two carry the LAYOFFS THEMSELVES, attributed to the season the
   *  onset landed in: `weeksOutOnsetWeek` / `weeksOutOnsetRetire` sum `totalWeeks` per door. The
   *  owner's «6-4-4» is three of these, not three of the above. */
  weeksOutOnsetWeek: number
  weeksOutOnsetRetire: number
}

/** One onset, kept whole – the length distribution is the finding this round is about, and a mean
 *  cannot show that a third of retirements cost 3+ weeks. */
interface Onset {
  cause: Cause
  severity: string
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
  onsets: Onset[],
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
        weeksOutOnsetWeek: 0,
        weeksOutOnsetRetire: 0,
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
    // `stepFatigueWeek` already hands back the onset whole – severity plus the weeks-out that was
    // actually rolled (post-physio scaling, which is what she serves). Kept per onset rather than
    // summed: the finding this round is about is the SHAPE of that distribution.
    if (f.injuryOnset) {
      onsets.push({ cause: textCause, severity: f.injuryOnset.severity, weeksOut: f.injuryOnset.weeksOut })
      if (textCause === 'retirement') row.weeksOutOnsetRetire += f.injuryOnset.weeksOut
      else row.weeksOutOnsetWeek += f.injuryOnset.weeksOut
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
      `${n(total === 0 ? 0 : (100 * ret) / total, 8, 1)}% ${n(exp / seasons, 9, 3)} ` +
      `${n(sum((r) => r.weeksOut) / seasons, 9, 2)} ${n(sum((r) => r.weeksOutOnsetWeek) / seasons, 8, 2)} ` +
      `${n(sum((r) => r.weeksOutOnsetRetire) / seasons, 8, 2)}`,
  )
}

/** THE CONSEQUENCE, NOT THE COUNT (round-16 item #13, the owner's ruling of 11.08: «RETIRE_K
 *  оставляем как есть … 3 мощные травмы 6-4-4 недели подряд одна за одной – это слишком»). The rate
 *  is not what he objected to; the length of the layoffs it hands out is. So the length distribution
 *  is reported per door, whole, with the two thresholds his sentence names: 3+ weeks (the band that
 *  produced his 4s) and 6+ weeks (his 6). */
function printLayoffLengths(onsets: Onset[]): void {
  console.log(`\nHOW LONG A LAYOFF LASTS, BY THE DOOR IT CAME IN BY – the CONSEQUENCE, not the rate`)
  console.log(`  door           onsets   mean wks    median   >= 3 wks   >= 6 wks   >= 8 wks    worst`)
  for (const cause of ['week', 'retirement'] as Cause[]) {
    const rows = onsets.filter((o) => o.cause === cause).map((o) => o.weeksOut)
    if (rows.length === 0) {
      console.log(`  ${cause.padEnd(14)} ${String(0).padStart(6)}   (none)`)
      continue
    }
    const sorted = [...rows].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const share = (p: (w: number) => boolean) => (100 * rows.filter(p).length) / rows.length
    console.log(
      `  ${cause.padEnd(14)} ${String(rows.length).padStart(6)} ${n(rows.reduce((s, w) => s + w, 0) / rows.length, 10, 2)} ` +
        `${String(median).padStart(9)} ${n(share((w) => w >= 3), 9, 1)}% ${n(share((w) => w >= 6), 9, 1)}% ` +
        `${n(share((w) => w >= 8), 9, 1)}% ${String(sorted[sorted.length - 1]).padStart(8)}`,
    )
  }
  console.log(`\n  severity mix, as the two tables draw it:`)
  console.log(`  door           minor   moderate      major     severe`)
  for (const cause of ['week', 'retirement'] as Cause[]) {
    const rows = onsets.filter((o) => o.cause === cause)
    if (rows.length === 0) continue
    const sh = (s: string) => (100 * rows.filter((o) => o.severity === s).length) / rows.length
    console.log(
      `  ${cause.padEnd(14)} ${n(sh('minor'), 6, 1)}% ${n(sh('moderate'), 9, 1)}% ${n(sh('major'), 9, 1)}% ${n(sh('severe'), 9, 1)}%`,
    )
  }
  console.log(
    `\n  ⚠ 'mean wks' is the layoff SERVED, after the physio recovery factor – it is what she loses,\n` +
      `  not what the band nominally rolled, so it reads a little short of the table's own mean.`,
  )
}

/** ⚠ AND THE FAILURE MODE ON THE OTHER SIDE. A retirement that costs nothing stops being an event:
 *  if the whole distribution collapses onto one week the door becomes a shrug and #18's dialog is a
 *  popup about nothing. This prints the share of retirements that still cost her a tournament week
 *  or more, so "it went too far" is visible in the same table as "it went far enough". */
function printStillMatters(onsets: Onset[]): void {
  const ret = onsets.filter((o) => o.cause === 'retirement')
  if (ret.length === 0) return
  const share = (p: (o: Onset) => boolean) => (100 * ret.filter(p).length) / ret.length
  console.log(`\nDOES THE RETIREMENT DOOR STILL READ AS A REAL EVENT?`)
  console.log(`  she is back the following week (1 wk)      : ${n(share((o) => o.weeksOut === 1), 6, 1)}%`)
  console.log(`  she misses at least one more week (2+ wks) : ${n(share((o) => o.weeksOut >= 2), 6, 1)}%`)
  console.log(`  a real layoff (3+ wks)                     : ${n(share((o) => o.weeksOut >= 3), 6, 1)}%`)
  console.log(`  the one that changes a season (8+ wks)     : ${n(share((o) => o.weeksOut >= 8), 6, 1)}%`)
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
  // ⚠ AND THE SAME QUESTION IN WEEKS, WHICH IS THE ONE HE ASKED. «3 мощные травмы 6-4-4 недели» is a
  // statement about 14 weeks, not about the number 3 – a season of three one-week niggles is a
  // different season from a season of three six-week layoffs, and the count above cannot tell them
  // apart. Layoffs are attributed to the season the ONSET landed in, so the three numbers he named
  // would appear here as one season carrying 14.
  const lost = rows.map((r) => r.weeksOutOnsetWeek + r.weeksOutOnsetRetire)
  const pctAtLeast = (k: number) => (100 * lost.filter((w) => w >= k).length) / Math.max(1, lost.length)
  console.log(
    `  weeks lost (layoffs opened this season): mean ${n(lost.reduce((s, w) => s + w, 0) / Math.max(1, lost.length), 5, 2)}  ` +
      `P(>=6wk) ${n(pctAtLeast(6), 5, 1)}%  P(>=10wk) ${n(pctAtLeast(10), 5, 1)}%  ` +
      `P(3+ injuries AND >=10wk) ${n((100 * rows.filter((r) => r.weekOnsets + r.retireOnsets >= 3 && r.weeksOutOnsetWeek + r.weeksOutOnsetRetire >= 10).length) / Math.max(1, rows.length), 5, 1)}%`,
  )
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
  const onsets: Onset[] = []
  const rows: SeasonRow[] = []
  for (const profile of profiles) {
    for (let i = 0; i < seeds; i++) rows.push(...runCareer(profile, policy, i, horizon, disagreements, onsets))
  }

  // ── 1. THE SPLIT ────────────────────────────────────────────────────────────
  console.log(`INJURIES PER SEASON, BY THE DOOR THEY CAME IN BY`)
  console.log(
    `  band                          seasons  meanCond    weekly  retired     total  retired%  predicted   wksLost  wkDoor   retDoor`,
  )
  printBand('ALL', rows)
  printBand('mean condition >= 80', rows.filter((r) => r.meanCondition >= 80))
  printBand('mean condition 70-79', rows.filter((r) => r.meanCondition >= 70 && r.meanCondition < 80))
  printBand('mean condition 40-69', rows.filter((r) => r.meanCondition >= 40 && r.meanCondition < 70))
  printBand('mean condition < 40', rows.filter((r) => r.meanCondition < 40))
  console.log(
    `\n  'predicted' = Σ injuryTau over her at-risk weeks – what the WEEKLY roll alone is designed to\n` +
      `  deliver. Compare it with the 'weekly' column, never with 'total': the retirement is a second\n` +
      `  door and the weekly model has never claimed to account for it.\n` +
      `  'wksLost' = weeks of THIS season spent injured (a straddling layoff is split). 'wkDoor'/'retDoor'\n` +
      `  = the layoffs OPENED this season, whole, per door – those two need not sum to 'wksLost'.`,
  )

  // ── 1b. THE CONSEQUENCE, WHICH IS WHAT ROUND 16 CHANGED ─────────────────────
  printLayoffLengths(onsets)
  printStillMatters(onsets)

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
  // ⚠ THE TWO TABLES, PRINTED SIDE BY SIDE, because since round 16 the door decides which one is
  // read and a reader of this output must not have to guess which produced the mix above.
  const show = (label: string, bands: typeof a.severityBands) => {
    let prev = 0
    const parts = bands.map((b) => {
      const p = b.cum - prev
      prev = b.cum
      return `${b.severity} ${(100 * p).toFixed(1)}% ${b.weeksLo}-${b.weeksHi}w`
    })
    const mean = bands.reduce((s, b, i) => s + (b.cum - (i === 0 ? 0 : bands[i - 1].cum)) * ((b.weeksLo + b.weeksHi) / 2), 0)
    console.log(`  ${label.padEnd(24)} ${parts.join(' · ')}   [nominal mean ${mean.toFixed(2)} wk]`)
  }
  show('severityBands (week)', a.severityBands)
  show('retirementSeverityBands', a.retirementSeverityBands)
}

main()
