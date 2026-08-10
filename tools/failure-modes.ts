/**
 * failure-modes – CAN SHE ACTUALLY FAIL, or are we building a world where she only ever goes up?
 *
 * The owner, 10.08: «Меня больше интересует какова вероятность, что наша "чемпионка" будет лажать и
 * сливать матчи и никуда не проходить? что у нас на эту тему в модели заложено? Это возможно вообще
 * или мы пока делаем мир, где "она точно двигается вверх"?»
 *
 * A mean cannot answer that. `bench:fatigue` reports the average career and the average career is
 * fine; the question is about the TAIL. So this prints DISTRIBUTIONS – deciles and explicit
 * "share of careers where X" – for the five things that can go wrong, each measured rather than
 * asserted:
 *
 *   1. SHE LOSES. Win rate per career, and the share of committed runs that were ONE match – a
 *      first-round exit, which since wave B pays exactly zero points.
 *   2. SHE FALLS. `endRank` against `bestRank`: how far below her own peak she finishes. This is
 *      the direct read on "does a career ever go backwards", because a rank is a place among rivals
 *      and the 52-week window expires what she does not defend.
 *   3. SHE BREAKS. Injuries and weeks lost.
 *   4. THE FAMILY RUNS OUT. `survived` / `weeksToBankrupt`.
 *   5. SHE NEVER ARRIVES. Share of careers that finish unranked or outside a given place.
 *
 * ⚠ AND THE ONE STRUCTURAL FACT THIS TOOL EXISTS TO CHECK, because it is the honest answer to the
 * owner's "или мы пока делаем мир, где она точно двигается вверх": `growWeek` applies
 * `declineFactor(ageYears)`, which is 0 below `declineStart`. Her BUILD therefore cannot get worse
 * before that age – only grow more slowly. Everything that can go down before then is RELATIVE (the
 * field grows too), or an interruption (injury, money, the doctor). Whether that is enough drama is
 * a design question; this tool is how it gets answered with numbers.
 *
 * ⚠ MEASUREMENT ONLY. Imports the bench and the engine read-only, changes no constant.
 *
 * Run:  npx vite-node tools/failure-modes.ts -- [--seeds 30] [--weeks 208] [--policy balanced]
 */
// ⚠ Before the dynamic import: fatigue-bench.ts self-runs its whole sweep on a static import.
// See tools/points-curve.ts and tools/injury-ratio-probe.ts for the same guard.
// `export {}` makes this a module, which is what licenses the top-level await below. Unlike
// injury-ratio-probe.ts this file imports nothing statically, so without it tsc refuses the await.
export {}
process.env.TB_BENCH_NO_AUTORUN = '1'
const { PROFILES, POLICIES, runCell } = await import('./fatigue-bench')

/** Only the fields this probe reads. */
interface Run {
  wins: number
  losses: number
  matchesPlayed: number
  runsCommitted: number
  runDepthCounts: number[]
  injuriesTotal: number
  weeksInjured: number
  survived: boolean
  weeksToBankrupt: number | null
  bestRank: number | null
  endRank: number
  endPoints: number
  entries: number
}

function q(xs: number[], p: number): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}

function n(x: number, w = 6, d = 1): string {
  return x.toFixed(d).padStart(w)
}

function share(xs: boolean[]): string {
  return `${((100 * xs.filter(Boolean).length) / xs.length).toFixed(0).padStart(3)}%`
}

/** One distribution line: worst / p10 / median / p90 / best. */
function spread(label: string, xs: number[], d = 1): void {
  console.log(
    `    ${label.padEnd(34)} ${n(q(xs, 0), 7, d)} ${n(q(xs, 0.1), 7, d)} ${n(q(xs, 0.5), 7, d)} ${n(q(xs, 0.9), 7, d)} ${n(q(xs, 0.999), 7, d)}`,
  )
}

function main(): void {
  const args = process.argv.slice(2)
  const seeds = Number(args[args.indexOf('--seeds') + 1]) || 30
  const horizon = Number(args[args.indexOf('--weeks') + 1]) || 208
  const policyId = args.includes('--policy') ? args[args.indexOf('--policy') + 1] : 'balanced'
  const policy = POLICIES.find((p) => p.id === policyId)!

  console.log(
    `\nfailure-modes · ${seeds} seeds per profile · ${horizon} weeks (14 -> ${14 + Math.round(horizon / 52)}) · policy "${policyId}" (the default player)\n`,
  )

  for (const profile of PROFILES) {
    const runs = runCell(profile, policy, horizon, seeds) as unknown as Run[]
    const label = `${profile.background} · ${profile.coachTier === 'self' ? 'self-coached' : profile.coachTier + ' coach'}`
    console.log(`  ${'='.repeat(84)}`)
    console.log(`  ${label}   (n=${runs.length})`)
    console.log(`  ${'='.repeat(84)}`)
    console.log(`                                          worst     p10  median     p90    best`)

    // 1. SHE LOSES.
    const winRate = runs.map((r) => (100 * r.wins) / Math.max(1, r.wins + r.losses))
    // A committed run of exactly ONE match is a first-round exit. Wave B: it pays zero.
    const r1Share = runs.map((r) => (100 * (r.runDepthCounts[1] ?? 0)) / Math.max(1, r.runsCommitted))
    spread('win rate, %', winRate)
    spread('runs that were ONE match, %', r1Share)

    // 2. SHE FALLS. endRank against her own peak.
    const ranked = runs.filter((r) => r.bestRank !== null)
    const fall = ranked.map((r) => r.endRank - (r.bestRank as number))
    spread('finished BELOW her own peak, places', fall, 0)

    // 3. SHE BREAKS.
    spread('injuries over the horizon', runs.map((r) => r.injuriesTotal), 0)
    spread('weeks lost to injury', runs.map((r) => r.weeksInjured), 0)

    // 5. WHERE SHE ENDED.
    spread('end rank', runs.map((r) => r.endRank), 0)

    // The explicit shares – the shape of the tail, said as a probability.
    console.log(`    ${'─'.repeat(78)}`)
    console.log(`    careers that LOST more than they won            ${share(runs.map((r) => r.wins < r.losses))}`)
    console.log(`    careers whose R1-exit share is over a third     ${share(r1Share.map((x) => x > 33))}`)
    console.log(`    careers finishing 10+ places below their peak   ${share(fall.map((x) => x >= 10))}`)
    console.log(`    careers finishing 50+ places below their peak   ${share(fall.map((x) => x >= 50))}`)
    console.log(`    careers that never got ranked at all            ${share(runs.map((r) => r.bestRank === null))}`)
    console.log(`    careers with a season-plus off court (13+ wks)  ${share(runs.map((r) => r.weeksInjured >= 13))}`)
    console.log(`    THE FAMILY WENT BROKE                           ${share(runs.map((r) => !r.survived))}`)
    console.log()
  }

  console.log(`  ⚠ READ THE "BELOW HER OWN PEAK" LINE AS THE ANSWER TO "does a career go backwards".`)
  console.log(`    Her BUILD cannot: growWeek's declineFactor is 0 until declineStart, so before that age`)
  console.log(`    she never gets worse at tennis, only slower at improving. Everything above is either`)
  console.log(`    RELATIVE (the cohort grows too, and the conveyor brings new girls every season) or an`)
  console.log(`    INTERRUPTION (injury weeks, the doctor's floor, money). Those are the only two ways`)
  console.log(`    down that exist today.`)
}

main()
