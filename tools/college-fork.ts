// THE COLLEGE FORK – who actually still has the third answer at nineteen, and what a MONEY threshold
// would have to be worth to replace the rung that deletes it.
//
//   npx vite-node tools/college-fork.ts [--seeds N] [--weeks N] [--only 1,2,3,4] [--csv PATH]
//
// THE QUESTION (owner, 14.08): «да, по колледжу надо комбо и понять устройство этого механизма и
// допуска в реальности. Сколько игроков из волны растущих реально идут в колледж, сколько реально
// доходят до w75 до этого момента, насколько корректна наша лестница в текущий момент вообще?»
//
// The first half of that is research (docs/research/college-and-the-junior-exit.md). This file is the
// second half and only the second half: **our own ladder, measured, with an n**. It answers "how far
// up does our kid actually get, when, and what has she banked by the time the game asks her" – and it
// prints the DISTRIBUTIONS rather than a median, because the combo the owner approved needs two
// numbers that SEPARATE populations, and a median cannot show whether a line separates anything.
//
// ⚠ MEASUREMENT ONLY. This tool changes no engine constant and patches nothing – not even in memory,
// which is the one thing it does differently from `tools/acceptance-cuts.ts`. `ENDINGS.
// collegeClosedFromTier` carries an owner ruling in its own comment; the combo is a PROPOSAL scored
// against the shipped world, and every candidate threshold below is evaluated as a PREDICATE OVER
// MEASURED ROWS, never by re-running the engine under a changed rule. So nothing here can be mistaken
// for a shipped behaviour, and the rows stay valid if he picks different numbers.
//
// ⚠ IT BUILDS ON `docs/specs/acceptance-cuts-2026-08.md` §5 RATHER THAN RE-DERIVING IT. That spec
// (15.08) already measured the closure itself – 50 of 54 careers, mean age 17.2, W75 causing 76% –
// on this same policy and horizon. What is NEW here is everything the closure is being compared
// AGAINST: the money she has actually banked by the fork, her rank at the fork, and the two of them
// crossed against the career's eventual outcome. §1 and §2 reproduce the closure on a larger n so
// that the new columns have a baseline in the same run; they are not an independent finding.
//
// ⚠ THE STRENGTH LABEL IS DELIBERATELY NOT READ AT NINETEEN. Careers are split into terciles by their
// END rank at the horizon (age 20) – i.e. by what happened AFTER the fork. A threshold read at 19 is
// then being scored against a future it does not know, which is the only honest way to ask "does this
// line separate the girl the tour is working out for from the girl it is not". Splitting by rank at
// 19 and then testing a rank line at 19 would be a tautology with a table around it.
//
// ⚠ INPUT-INDEPENDENCE (CLAUDE.md invariant 2) is why the same seeds can be read many ways: nothing
// this file does touches the world's dice, so every cut of the same 90 rows is the same 90 careers.
import { writeFileSync } from 'node:fs'
import { openCareer, stepCareerWeek, POLICIES, PRESETS, zeroByTier, mean, median, type Preset } from './econ-bench'
import { collegeStillOpen, kidAgeExact, kidPoints, tableSize, tierFloorOpen } from '../src/engine/world'
import { ENDINGS } from '../src/engine/ending'
import { TIERS, TIER_LADDER, TIER_SHORT, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// --- args ------------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strOf = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
/** seeds PER PRESET. n = SEEDS x PRESETS.length careers. Default 10 x 9 = 90. */
const SEEDS = argOf('seeds', 10)
/** 312 = fourteen to twenty – the econ bench's third horizon, and the only one that passes the fork
 *  at 19 AND leaves a season on the far side of it to read the outcome from. */
const WEEKS = argOf('weeks', 312)
const ONLY = (() => {
  const i = args.indexOf('--only')
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null
})()
const wants = (s: string) => !ONLY || ONLY.has(s)
const CSV = strOf('csv')
/** `--policy 0` = the grinder (the file's reproducibility anchor, and the arm that never plays the
 *  paid rungs). Default 1 = the rebuilt model of a reasonable parent, which is the arm every question
 *  in this file is about. Offered because "the door is shut" and "the parent entered pro events" are
 *  two claims and only a second arm can tell them apart. */
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]

// --- helpers ---------------------------------------------------------------------------------------

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 112) => '-'.repeat(n)
function section(title: string): void {
  console.log(`\n${rule()}\n${title}\n${rule()}`)
}
const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (part: number, whole: number) => (whole === 0 ? '  – ' : `${((100 * part) / whole).toFixed(0)}%`)
/** mean of the entries that exist – "over the careers that got there", never over n. */
const meanOf = (xs: number[]) => (xs.length === 0 ? '–' : mean(xs).toFixed(1))

/** The order statistics a threshold argument actually needs. A median cannot show separation; these
 *  can, because a line that separates two populations sits in the GAP between one's p75 and the
 *  other's p25 and a line that catches everyone does not. */
function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo)
}
interface Dist {
  n: number
  min: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  max: number
  mean: number
}
function dist(xs: number[]): Dist {
  if (xs.length === 0) return { n: 0, min: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, max: 0, mean: 0 }
  return {
    n: xs.length,
    min: Math.min(...xs),
    p10: quantile(xs, 0.1),
    p25: quantile(xs, 0.25),
    p50: median(xs),
    p75: quantile(xs, 0.75),
    p90: quantile(xs, 0.9),
    max: Math.max(...xs),
    mean: mean(xs),
  }
}

/** The rungs at or above the one that shuts the college ending today. */
const COLLEGE_CLOSERS: readonly TierId[] = TIER_LADDER.slice(TIER_LADDER.indexOf(ENDINGS.collegeClosedFromTier))
/** The rungs that carry an acceptance door at all – the two units of `acceptanceRank`. */
const GATED: readonly TierId[] = TIER_LADDER.filter(
  (t) => TIERS[t].acceptsRank !== undefined || TIERS[t].enterPct !== undefined,
)

// =================================================================================================
// ONE CAREER
// =================================================================================================

interface Row {
  /** ⚠ THE ROW'S IDENTITY IS THE PRESET PLUS THE INDEX, NOT THE SEED, and this is a real trap rather
   *  than a style note. `openCareer` builds `bench-<background>-<index>`, and the nine presets carry
   *  only THREE backgrounds – so `bench-working-0` names three different careers (self / budget /
   *  middle coach), which differ by profile and not by dice. Keying a band on the seed string
   *  silently folds three rows into one and the terciles come out 49/6/35 instead of 30/30/30. Caught
   *  on the first full run of this file; the wrong split is what made it visible. */
  key: string
  seed: string
  preset: string
  entries: Record<TierId, number>
  /** her exact age the first week she committed to an event of this rung */
  firstEntryAge: Partial<Record<TierId, number>>
  /** her WTA rank the week she first committed to this rung – "at what rank does the rung admit her",
   *  which is the question a ladder is for and is NOT the same as the rung's own cut. `null` where she
   *  held no WTA ranking at all that week, which is the honest reading for every junior rung and is
   *  NOT the same as "ranked last": the table's own size would print as a rank and read as one. */
  firstEntryRank: Partial<Record<TierId, number | null>>
  /** her age the first week the acceptance CUT alone stopped refusing her (age gate not consulted) */
  cutClearedAge: Partial<Record<TierId, number>>
  /** her age the first week `bestFinishByTier` held a COUNTING finish at this rung – the read
   *  `collegeStillOpen` actually makes, per rung, so W75's own contribution is visible. */
  firstCountingAge: Partial<Record<TierId, number>>

  // --- the door ---
  collegeShutWeek: number | null
  collegeShutAge: number | null
  collegeShutTier: TierId | null
  collegeOpenAtFork: boolean

  // --- the fork, read the week she turns nineteen ---
  forkWeek: number | null
  forkRankWta: number
  forkPointsWta: number
  forkRankItf: number
  /** every cent of prize money booked from week 0 to the fork – the MONEY arm's candidate quantity */
  forkPrizeCents: number
  /** prize booked in the 52 weeks ending at the fork – the annual shape a real eligibility cap has */
  forkPrizeYearCents: number
  /** everything the family spent to get her there, over the same window – the honest denominator for
   *  "is the tennis paying for itself", which is what "professional" means outside a rulebook */
  forkSpendCents: number
  /** ⭐ TRAVEL + ENTRY ALONE, cumulative to the fork. The real eligibility rule is written against
   *  "actual and necessary expenses" of COMPETING – not against coaching, gear or physio – so this is
   *  the only expense line a money threshold modelled on it may be compared to. */
  forkCompeteCostCents: number
  forkFundsCents: number
  /** the highest rung she had taken a counting finish at by the fork, or null */
  forkBestTier: TierId | null
  /** ⭐ WHEN A MONEY LINE WOULD ACTUALLY FIRE. Her age the week cumulative prize first crossed each
   *  candidate M – because a threshold that shuts the door at the same age the rung does buys the
   *  player nothing, and that is the first thing to check about it, not the last. */
  prizeCrossAge: Record<number, number | null>
  /** the same for the RESULT arm: her age the first week her WTA rank was better than each candidate
   *  R. A rank line only means "the tour is not working out" if she is BELOW it at 19 having been
   *  above it earlier, or never above it at all. */
  rankCrossAge: Record<number, number | null>
  /** prize and travel+entry folded into 52-week seasons from week 0 (index 0 = age 14). */
  prizeBySeason: number[]
  competeBySeason: number[]

  // --- the outcome, at the horizon (age 20) – the future the fork is trying to predict ---
  endRankWta: number
  endPointsWta: number
  endPrizeCents: number
}

/** The candidate lines every table below is scored against, declared once so the sweep, the crossing
 *  ages and the combo cannot drift apart. Money in cents. */
const MONEY_LINES = [5_000_00, 10_000_00, 15_000_00, 20_000_00, 30_000_00, 50_000_00, 75_000_00, 100_000_00]
const RANK_LINES = [150, 200, 250, 300, 400, 500, 700, 1000]

function runOne(preset: Preset, index: number, policy = POLICY, key = ''): Row {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const entries = zeroByTier()
  const firstEntryAge: Partial<Record<TierId, number>> = {}
  const firstEntryRank: Partial<Record<TierId, number | null>> = {}
  const cutClearedAge: Partial<Record<TierId, number>> = {}
  const firstCountingAge: Partial<Record<TierId, number>> = {}
  let collegeShutWeek: number | null = null
  let collegeShutAge: number | null = null
  let collegeShutTier: TierId | null = null
  let collegeOpenAtFork = true
  let forkSeen = false
  let forkWeek: number | null = null
  let forkRankWta = 0
  let forkPointsWta = 0
  let forkRankItf = 0
  let forkPrizeCents = 0
  let forkPrizeYearCents = 0
  let forkSpendCents = 0
  let forkCompeteCostCents = 0
  let forkFundsCents = 0
  let forkBestTier: TierId | null = null
  const prizeCrossAge: Record<number, number | null> = Object.fromEntries(MONEY_LINES.map((m) => [m, null]))
  const rankCrossAge: Record<number, number | null> = Object.fromEntries(RANK_LINES.map((r) => [r, null]))
  /** ⭐ THE SPORT'S OWN RULE, AS THE SPORT WROTE IT: per YEAR, not per life. Prize and competing costs
   *  folded into 52-week blocks from week 0, so `[i]` is her season from age 14+i. They are seasons
   *  and not calendar years, and the tables below say so rather than pretending otherwise. */
  const prizeBySeason: number[] = []
  const competeBySeason: number[] = []

  // The ledger is pruned to a 60-week trailing window, so the cumulative line has to be folded week
  // by week as it goes – `runCareer`'s own `seenWeeks` idiom, and the reason this loop keeps a set.
  const seenWeeks = new Set<number>()
  let prizeCents = 0
  let spendCents = 0
  let competeCents = 0
  const prizeByWeek = new Map<number, number>()

  for (let i = 0; i < WEEKS; i++) {
    const weekOfEntry = world.week
    const e = stepCareerWeek(world, rng, policy)
    for (const t of TIER_LADDER) {
      if (e[t] <= 0) continue
      entries[t] += e[t]
      if (firstEntryAge[t] === undefined) {
        firstEntryAge[t] = kidAgeExact(weekOfEntry, world.profile.birthMonth)
        firstEntryRank[t] = world.kidRankWta ?? null
      }
    }
    for (const fw of world.financeWeeks) {
      if (seenWeeks.has(fw.week)) continue
      seenWeeks.add(fw.week)
      const prize = Math.max(0, fw.byCategory.prize ?? 0)
      prizeCents += prize
      if (prize > 0) prizeByWeek.set(fw.week, (prizeByWeek.get(fw.week) ?? 0) + prize)
      const season = Math.floor(fw.week / WEEKS_PER_YEAR)
      while (prizeBySeason.length <= season) {
        prizeBySeason.push(0)
        competeBySeason.push(0)
      }
      prizeBySeason[season] += prize
      for (const [cat, v] of Object.entries(fw.byCategory)) {
        if (v === undefined || v >= 0) continue
        spendCents += -v
        if (cat === 'travel' || cat === 'entry') {
          competeCents += -v
          competeBySeason[season] += -v
        }
      }
    }
    const ageNow = kidAgeExact(world.week, world.profile.birthMonth)
    for (const m of MONEY_LINES) if (prizeCrossAge[m] === null && prizeCents >= m) prizeCrossAge[m] = ageNow
    for (const r of RANK_LINES) {
      if (rankCrossAge[r] === null && typeof world.kidRankWta === 'number' && world.kidRankWta <= r) rankCrossAge[r] = ageNow
    }
    for (const t of GATED) {
      if (cutClearedAge[t] === undefined && tierFloorOpen(world, t)) {
        cutClearedAge[t] = kidAgeExact(world.week, world.profile.birthMonth)
      }
    }
    // The per-rung counting finish, read exactly as `collegeStillOpen` reads it: a finish index
    // better than the opening round, on a rung whose points table pays for it.
    for (const t of TIER_LADDER) {
      if (firstCountingAge[t] !== undefined) continue
      const finish = world.bestFinishByTier[t]
      if (finish === undefined) continue
      if (finish >= TIERS[t].points.length - 1) continue
      if (TIERS[t].points[finish] > 0) firstCountingAge[t] = kidAgeExact(world.week, world.profile.birthMonth)
    }
    if (collegeShutWeek === null && !collegeStillOpen(world)) {
      collegeShutWeek = world.week
      collegeShutAge = kidAgeExact(world.week, world.profile.birthMonth)
      for (const t of COLLEGE_CLOSERS) {
        const finish = world.bestFinishByTier[t]
        if (finish === undefined) continue
        if (finish >= TIERS[t].points.length - 1) continue
        if (TIERS[t].points[finish] > 0) {
          collegeShutTier = t
          break
        }
      }
    }
    if (!forkSeen && kidAgeExact(world.week, world.profile.birthMonth) >= ENDINGS.forkAgeYears) {
      forkSeen = true
      forkWeek = world.week
      collegeOpenAtFork = collegeStillOpen(world)
      forkRankWta = world.kidRankWta ?? tableSize(world, 'wta')
      forkPointsWta = kidPoints(world, 'wta')
      forkRankItf = world.kidRank
      forkPrizeCents = prizeCents
      forkSpendCents = spendCents
      forkCompeteCostCents = competeCents
      forkFundsCents = world.fundsCents
      let yearPrize = 0
      for (const [w, v] of prizeByWeek) if (w > world.week - WEEKS_PER_YEAR) yearPrize += v
      forkPrizeYearCents = yearPrize
      for (const t of [...TIER_LADDER].reverse()) {
        const finish = world.bestFinishByTier[t]
        if (finish === undefined) continue
        if (finish >= TIERS[t].points.length - 1) continue
        if (TIERS[t].points[finish] > 0) {
          forkBestTier = t
          break
        }
      }
    }
  }

  return {
    key,
    seed,
    preset: preset.label,
    entries,
    firstEntryAge,
    firstEntryRank,
    cutClearedAge,
    firstCountingAge,
    collegeShutWeek,
    collegeShutAge,
    collegeShutTier,
    collegeOpenAtFork,
    forkWeek,
    forkRankWta,
    forkPointsWta,
    forkRankItf,
    forkPrizeCents,
    forkPrizeYearCents,
    forkSpendCents,
    forkCompeteCostCents,
    forkFundsCents,
    forkBestTier,
    prizeCrossAge,
    rankCrossAge,
    prizeBySeason,
    competeBySeason,
    endRankWta: world.kidRankWta ?? tableSize(world, 'wta'),
    endPointsWta: kidPoints(world, 'wta'),
    endPrizeCents: prizeCents,
  }
}

// =================================================================================================
// THE RUN
// =================================================================================================

const N = PRESETS.length * SEEDS
section(
  `THE COLLEGE FORK – ${PRESETS.length} presets x ${SEEDS} seeds = n ${N} careers, ${WEEKS} weeks ` +
    `(14→${14 + Math.round(WEEKS / WEEKS_PER_YEAR)}), policy "${POLICY.label}"`,
)
console.log(`  shipped constants throughout – nothing is patched. collegeClosedFromTier = ${ENDINGS.collegeClosedFromTier}, forkAgeYears = ${ENDINGS.forkAgeYears}`)
const t0 = Date.now()
const rows: Row[] = []
for (let p = 0; p < PRESETS.length; p++) for (let i = 0; i < SEEDS; i++) rows.push(runOne(PRESETS[p], i, POLICY, `${p}:${i}`))
console.error(`  ${rows.length} careers in ${((Date.now() - t0) / 1000).toFixed(0)}s`)

// =================================================================================================
// 1. THE LADDER, AS IT ADMITS HER
// =================================================================================================

/** Her mean WTA rank the week a rung first admitted her, over the careers that HELD one – and the
 *  count that did not, spelled out. An unranked girl entering a J60 is the normal case, not a hole in
 *  the data, and averaging the table's size into it would invent a rank for her. */
function rankedAtEntry(reached: Row[], t: TierId): string {
  const ranked = reached.map((r) => r.firstEntryRank[t]).filter((x): x is number => typeof x === 'number')
  if (ranked.length === 0) return reached.length ? 'unranked' : '–'
  const head = `#${Math.round(mean(ranked))}`
  return ranked.length === reached.length ? head : `${head}(${ranked.length})`
}

if (wants('1')) {
  section(`1. AT WHAT AGE AND RANK DOES EACH RUNG FIRST ADMIT HER (n ${N})`)
  console.log(
    `  ${padE('rung', 9)}${pad('minAge', 7)}${pad('cut', 7)}  ${pad('reach', 9)}  ${pad('cut ok', 7)}${pad('1st entry', 10)}${pad('rank then', 10)}${pad('1st count', 10)}  shuts college?`,
  )
  console.log(`  ${rule(104)}`)
  for (const t of TIER_LADDER) {
    const reached = rows.filter((r) => r.entries[t] > 0)
    const cut =
      TIERS[t].acceptsRank !== undefined ? `#${TIERS[t].acceptsRank}` : TIERS[t].enterPct !== undefined ? `${TIERS[t].enterPct}` : '–'
    const shuts = COLLEGE_CLOSERS.includes(t) ? `⚠ YES` : ''
    console.log(
      `  ${padE(TIER_SHORT[t], 9)}${pad(TIERS[t].minAgeYears ?? '–', 7)}${pad(cut, 7)}  ` +
        `${pad(`${reached.length}/${N}`, 9)}  ` +
        `${pad(meanOf(rows.map((r) => r.cutClearedAge[t]).filter((x): x is number => x !== undefined)), 7)}` +
        `${pad(meanOf(reached.map((r) => r.firstEntryAge[t]!)), 10)}` +
        `${pad(rankedAtEntry(reached, t), 10)}` +
        `${pad(meanOf(rows.map((r) => r.firstCountingAge[t]).filter((x): x is number => x !== undefined)), 10)}  ${shuts}`,
    )
  }
  console.log(`\n  reach     = careers that ever entered the rung.        cut ok    = mean age the acceptance cut alone stopped refusing her.`)
  console.log(`  1st entry = mean age of her first entry there.          rank then = her mean WTA rank that week, over the`)
  console.log(`              careers that HELD one – "unranked" means none did, and "(k)" means only k of them did.`)
  console.log(`  1st count = mean age of her first COUNTING finish (a win, not a first-round loss) – the read collegeStillOpen makes.`)
}

// =================================================================================================
// 2. HOW MANY REACH W75, AND BY WHEN
// =================================================================================================

if (wants('2')) {
  section(`2. W75 AND THE DOOR (n ${N})`)
  const w75Entered = rows.filter((r) => r.entries.w75 > 0)
  const w75Counting = rows.filter((r) => r.firstCountingAge.w75 !== undefined)
  const anyAbove = rows.filter((r) => COLLEGE_CLOSERS.some((t) => r.entries[t] > 0))
  const shut = rows.filter((r) => r.collegeShutWeek !== null)
  const openAtFork = rows.filter((r) => r.collegeOpenAtFork)
  console.log(`  ever entered a W75                  ${pad(w75Entered.length, 4)} / ${N}   ${pct(w75Entered.length, N)}   first entry at mean age ${meanOf(w75Entered.map((r) => r.firstEntryAge.w75!))}`)
  console.log(`  ever WON a match at W75             ${pad(w75Counting.length, 4)} / ${N}   ${pct(w75Counting.length, N)}   first counting finish at mean age ${meanOf(w75Counting.map((r) => r.firstCountingAge.w75!))}`)
  console.log(`  ever entered ANY rung W75 or above  ${pad(anyAbove.length, 4)} / ${N}   ${pct(anyAbove.length, N)}`)
  console.log(`  college door SHUT                   ${pad(shut.length, 4)} / ${N}   ${pct(shut.length, N)}   at mean age ${meanOf(shut.map((r) => r.collegeShutAge!))}, median ${median(shut.map((r) => r.collegeShutAge!)).toFixed(1)}`)
  console.log(`  still OPEN at the fork (19)         ${pad(openAtFork.length, 4)} / ${N}   ${pct(openAtFork.length, N)}`)

  console.log(`\n  WHICH RUNG SHUT IT`)
  for (const t of COLLEGE_CLOSERS) {
    const k = shut.filter((r) => r.collegeShutTier === t).length
    if (k === 0) continue
    console.log(`    ${padE(TIER_SHORT[t], 8)}${pad(k, 4)}   ${pct(k, shut.length)} of closures`)
  }

  console.log(`\n  THE AGE THE DOOR SHUTS – distribution over the ${shut.length} careers that lost it`)
  const ages = shut.map((r) => r.collegeShutAge!)
  const buckets: [string, (a: number) => boolean][] = [
    ['under 16', (a) => a < 16],
    ['16 – 16.9', (a) => a >= 16 && a < 17],
    ['17 – 17.9', (a) => a >= 17 && a < 18],
    ['18 – 18.9', (a) => a >= 18 && a < 19],
    ['19+     ', (a) => a >= 19],
  ]
  for (const [label, test] of buckets) {
    const k = ages.filter(test).length
    console.log(`    ${padE(label, 11)}${pad(k, 4)}  ${pad(pct(k, shut.length), 5)}  ${'#'.repeat(Math.round((40 * k) / Math.max(1, shut.length)))}`)
  }
  const d = dist(ages)
  console.log(`\n    min ${d.min.toFixed(1)} · p10 ${d.p10.toFixed(1)} · p25 ${d.p25.toFixed(1)} · median ${d.p50.toFixed(1)} · p75 ${d.p75.toFixed(1)} · p90 ${d.p90.toFixed(1)} · max ${d.max.toFixed(1)}`)
}

// =================================================================================================
// 3/4. THE TWO THRESHOLDS THE COMBO NEEDS
// =================================================================================================

/** ⚠ STRENGTH IS READ AFTER THE FORK, NEVER AT IT – see the header. Terciles of END rank at 20, keyed
 *  on the ROW rather than on the seed (see `Row.key`). */
const byEnd = [...rows].sort((a, b) => a.endRankWta - b.endRankWta)
const third = Math.floor(rows.length / 3)
const TOP = new Set(byEnd.slice(0, third).map((r) => r.key))
const WEAK = new Set(byEnd.slice(byEnd.length - third).map((r) => r.key))
const band = (r: Row) => (TOP.has(r.key) ? 'top' : WEAK.has(r.key) ? 'weak' : 'mid')
const BANDS: ('top' | 'mid' | 'weak')[] = ['top', 'mid', 'weak']
const of = (b: string) => rows.filter((r) => band(r) === b)

/** A second, ABSOLUTE cut of the same rows, because a tercile is a share and cannot say whether the
 *  populations are far apart or merely ordered. These bands are rank ranges, so a compressed cohort
 *  shows up as one crowded band instead of as three tidy thirds. */
const ABS_BANDS: [string, (r: Row) => boolean][] = [
  ['≤ #150', (r) => r.endRankWta <= 150],
  ['#151–200', (r) => r.endRankWta > 150 && r.endRankWta <= 200],
  ['#201–300', (r) => r.endRankWta > 200 && r.endRankWta <= 300],
  ['#301+', (r) => r.endRankWta > 300],
]

if (wants('3')) {
  section(`3. WHAT SHE HAS BANKED BY NINETEEN – the MONEY arm's number (n ${N})`)
  console.log(`  careers split into terciles by their END WTA rank at 20 – i.e. by the future the fork cannot see.`)
  console.log(`  ${padE('band', 7)}${pad('n', 4)}${pad('end rank', 10)}${pad('rank @19', 10)}  |  prize banked by 19: ${pad('min', 9)}${pad('p10', 9)}${pad('p25', 9)}${pad('median', 10)}${pad('p75', 10)}${pad('p90', 10)}${pad('max', 11)}`)
  console.log(`  ${rule(140)}`)
  for (const b of BANDS) {
    const g = of(b)
    const p = dist(g.map((r) => r.forkPrizeCents))
    console.log(
      `  ${padE(b, 7)}${pad(g.length, 4)}${pad(`#${Math.round(median(g.map((r) => r.endRankWta)))}`, 10)}` +
        `${pad(`#${Math.round(median(g.map((r) => r.forkRankWta)))}`, 10)}  |  ${pad('', 21)}` +
        `${pad(usd(p.min), 9)}${pad(usd(p.p10), 9)}${pad(usd(p.p25), 9)}${pad(usd(p.p50), 10)}${pad(usd(p.p75), 10)}${pad(usd(p.p90), 10)}${pad(usd(p.max), 11)}`,
    )
  }
  const all = dist(rows.map((r) => r.forkPrizeCents))
  console.log(
    `  ${padE('ALL', 7)}${pad(rows.length, 4)}${pad('', 20)}  |  ${pad('', 21)}` +
      `${pad(usd(all.min), 9)}${pad(usd(all.p10), 9)}${pad(usd(all.p25), 9)}${pad(usd(all.p50), 10)}${pad(usd(all.p75), 10)}${pad(usd(all.p90), 10)}${pad(usd(all.max), 11)}`,
  )

  console.log(`\n  THE SAME MONEY, AS THE LAST TWELVE MONTHS ONLY (the shape a real eligibility cap has – per year, not per life)`)
  console.log(`  ${padE('band', 7)}${pad('min', 9)}${pad('p10', 9)}${pad('p25', 9)}${pad('median', 10)}${pad('p75', 10)}${pad('p90', 10)}${pad('max', 11)}`)
  for (const b of [...BANDS, 'ALL']) {
    const g = b === 'ALL' ? rows : of(b)
    const p = dist(g.map((r) => r.forkPrizeYearCents))
    console.log(`  ${padE(b, 7)}${pad(usd(p.min), 9)}${pad(usd(p.p10), 9)}${pad(usd(p.p25), 9)}${pad(usd(p.p50), 10)}${pad(usd(p.p75), 10)}${pad(usd(p.p90), 10)}${pad(usd(p.max), 11)}`)
  }

  console.log(`\n  AND WHAT IT COST TO EARN IT – "professional" outside a rulebook means the tennis pays for itself`)
  console.log(`  ${padE('band', 7)}${pad('spend by 19', 13)}${pad('prize by 19', 13)}${pad('prize/spend', 12)}${pad('funds @19', 12)}`)
  for (const b of [...BANDS, 'ALL']) {
    const g = b === 'ALL' ? rows : of(b)
    const sp = median(g.map((r) => r.forkSpendCents))
    const pr = median(g.map((r) => r.forkPrizeCents))
    console.log(
      `  ${padE(b, 7)}${pad(usd(sp), 13)}${pad(usd(pr), 13)}${pad(`${((100 * pr) / Math.max(1, sp)).toFixed(0)}%`, 12)}${pad(usd(median(g.map((r) => r.forkFundsCents))), 12)}`,
    )
  }

  console.log(`\n  AND AGAINST THE ONLY EXPENSES A REAL ELIGIBILITY RULE COUNTS – travel + entry fees, nothing else`)
  console.log(`  ${padE('band', 10)}${pad('travel+entry', 14)}${pad('prize by 19', 13)}${pad('prize – costs', 15)}${pad('over expenses?', 16)}`)
  for (const b of [...BANDS, 'ALL']) {
    const g = b === 'ALL' ? rows : of(b)
    const cc = median(g.map((r) => r.forkCompeteCostCents))
    const pr = median(g.map((r) => r.forkPrizeCents))
    const over = g.filter((r) => r.forkPrizeCents > r.forkCompeteCostCents).length
    console.log(`  ${padE(b, 10)}${pad(usd(cc), 14)}${pad(usd(pr), 13)}${pad(usd(pr - cc), 15)}${pad(`${over}/${g.length}`, 16)}`)
  }

  console.log(`\n  THE HISTOGRAM – careers by prize banked at the fork, so the shape is visible rather than summarised`)
  const cuts = [0, 5_000_00, 10_000_00, 20_000_00, 40_000_00, 80_000_00, 160_000_00, Infinity]
  for (let i = 0; i < cuts.length - 1; i++) {
    const inBucket = rows.filter((r) => r.forkPrizeCents >= cuts[i] && r.forkPrizeCents < cuts[i + 1])
    const label = cuts[i + 1] === Infinity ? `${usd(cuts[i])}+` : `${usd(cuts[i])} – ${usd(cuts[i + 1])}`
    const mix = BANDS.map((b) => `${b[0]}${inBucket.filter((r) => band(r) === b).length}`).join(' ')
    console.log(`    ${padE(label, 22)}${pad(inBucket.length, 4)}  ${pad(pct(inBucket.length, N), 5)}  ${padE('#'.repeat(Math.round((40 * inBucket.length) / N)), 42)}${mix}`)
  }

  console.log(`\n  THE SAME ROWS BY ABSOLUTE OUTCOME – a tercile is a share and cannot show whether the bands are FAR apart`)
  console.log(`  ${padE('end rank at 20', 16)}${pad('n', 4)}${pad('rank @19', 10)}${pad('prize p25', 11)}${pad('median', 11)}${pad('p75', 11)}${pad('door open @19', 15)}`)
  for (const [label, test] of ABS_BANDS) {
    const g = rows.filter(test)
    if (g.length === 0) {
      console.log(`  ${padE(label, 16)}${pad(0, 4)}`)
      continue
    }
    const p = dist(g.map((r) => r.forkPrizeCents))
    console.log(
      `  ${padE(label, 16)}${pad(g.length, 4)}${pad(`#${Math.round(median(g.map((r) => r.forkRankWta)))}`, 10)}` +
        `${pad(usd(p.p25), 11)}${pad(usd(p.p50), 11)}${pad(usd(p.p75), 11)}${pad(`${g.filter((r) => r.collegeOpenAtFork).length}/${g.length}`, 15)}`,
    )
  }
}

if (wants('4')) {
  section(`4. WHERE THE RANK LINE SITS – the RESULT arm's number (n ${N})`)
  console.log(`  "the tour is not working out" has to be a rank at 19 that the weak band is BELOW and the top band is ABOVE.`)
  console.log(`  ${padE('band', 7)}${pad('n', 4)}  rank at 19: ${pad('best', 8)}${pad('p10', 8)}${pad('p25', 8)}${pad('median', 9)}${pad('p75', 9)}${pad('p90', 9)}${pad('worst', 9)}   |  ${pad('pts @19', 9)}${pad('end rank', 10)}`)
  console.log(`  ${rule(124)}`)
  for (const b of [...BANDS, 'ALL']) {
    const g = b === 'ALL' ? rows : of(b)
    const p = dist(g.map((r) => r.forkRankWta))
    console.log(
      `  ${padE(b, 7)}${pad(g.length, 4)}  ${pad('', 12)}${pad(`#${Math.round(p.min)}`, 8)}${pad(`#${Math.round(p.p10)}`, 8)}${pad(`#${Math.round(p.p25)}`, 8)}` +
        `${pad(`#${Math.round(p.p50)}`, 9)}${pad(`#${Math.round(p.p75)}`, 9)}${pad(`#${Math.round(p.p90)}`, 9)}${pad(`#${Math.round(p.max)}`, 9)}   |  ` +
        `${pad(Math.round(median(g.map((r) => r.forkPointsWta))), 9)}${pad(`#${Math.round(median(g.map((r) => r.endRankWta)))}`, 10)}`,
    )
  }

  console.log(`\n  DOES A RANK LINE SEPARATE THEM? – per candidate line R, who is BELOW it at 19 (= door stays open)`)
  console.log(`  ${padE('R', 8)}${pad('all', 10)}${pad('top band', 12)}${pad('mid band', 12)}${pad('weak band', 12)}   separation (weak% – top%)`)
  for (const R of RANK_LINES) {
    const below = (g: Row[]) => g.filter((r) => r.forkRankWta > R).length
    const topPct = (100 * below(of('top'))) / Math.max(1, of('top').length)
    const weakPct = (100 * below(of('weak'))) / Math.max(1, of('weak').length)
    console.log(
      `  ${padE(`#${R}`, 8)}${pad(`${below(rows)} (${pct(below(rows), N)})`, 10)}` +
        `${pad(`${below(of('top'))} (${topPct.toFixed(0)}%)`, 12)}${pad(`${below(of('mid'))}`, 12)}${pad(`${below(of('weak'))} (${weakPct.toFixed(0)}%)`, 12)}   ${pad((weakPct - topPct).toFixed(0), 4)} pts`,
    )
  }

  console.log(`\n  AND THE MONEY LINE, THE SAME WAY – per candidate M, who has banked LESS than M by 19 (= door stays open)`)
  console.log(`  ${padE('M', 12)}${pad('all', 12)}${pad('top band', 12)}${pad('mid band', 12)}${pad('weak band', 12)}   separation (weak% – top%)`)
  for (const M of MONEY_LINES) {
    const under = (g: Row[]) => g.filter((r) => r.forkPrizeCents < M).length
    const topPct = (100 * under(of('top'))) / Math.max(1, of('top').length)
    const weakPct = (100 * under(of('weak'))) / Math.max(1, of('weak').length)
    console.log(
      `  ${padE(usd(M), 12)}${pad(`${under(rows)} (${pct(under(rows), N)})`, 12)}` +
        `${pad(`${under(of('top'))} (${topPct.toFixed(0)}%)`, 12)}${pad(`${under(of('mid'))}`, 12)}${pad(`${under(of('weak'))} (${weakPct.toFixed(0)}%)`, 12)}   ${pad((weakPct - topPct).toFixed(0), 4)} pts`,
    )
  }

  console.log(`\n  ⭐ WHEN WOULD EACH LINE ACTUALLY FIRE? – the first question about a threshold, not the last.`)
  console.log(`     A money line that shuts the door at the same age the RUNG does has replaced one constant with another.`)
  console.log(`     Shipped: the door shuts at mean age ${meanOf(rows.filter((r) => r.collegeShutAge !== null).map((r) => r.collegeShutAge!))} in ${rows.filter((r) => r.collegeShutWeek !== null).length}/${N} careers.`)
  console.log(`  ${padE('money line M', 14)}${pad('ever crossed', 14)}${pad('age at crossing', 17)}   |   ${padE('rank line R', 13)}${pad('ever better', 13)}${pad('age first better', 18)}`)
  for (let i = 0; i < Math.max(MONEY_LINES.length, RANK_LINES.length); i++) {
    const M = MONEY_LINES[i]
    const R = RANK_LINES[i]
    const mAges = M === undefined ? [] : rows.map((r) => r.prizeCrossAge[M]).filter((x): x is number => x !== null)
    const rAges = R === undefined ? [] : rows.map((r) => r.rankCrossAge[R]).filter((x): x is number => x !== null)
    console.log(
      `  ${padE(M === undefined ? '' : usd(M), 14)}${pad(M === undefined ? '' : `${mAges.length}/${N}`, 14)}${pad(meanOf(mAges), 17)}   |   ` +
        `${padE(R === undefined ? '' : `#${R}`, 13)}${pad(R === undefined ? '' : `${rAges.length}/${N}`, 13)}${pad(meanOf(rAges), 18)}`,
    )
  }

  console.log(`\n  THE COMBO – open at the fork iff (prize < M) OR (rank at 19 worse than R). Shipped rule is the last row.`)
  console.log(`  ${padE('M', 12)}${padE('R', 8)}${pad('open', 12)}${pad('top band', 12)}${pad('mid band', 12)}${pad('weak band', 12)}`)
  for (const [M, R] of [
    [10_000_00, 400],
    [15_000_00, 400],
    [20_000_00, 400],
    [20_000_00, 300],
    [30_000_00, 400],
    [30_000_00, 300],
    [50_000_00, 300],
  ] as [number, number][]) {
    const open = (g: Row[]) => g.filter((r) => r.forkPrizeCents < M || r.forkRankWta > R).length
    console.log(
      `  ${padE(usd(M), 12)}${padE(`#${R}`, 8)}${pad(`${open(rows)} (${pct(open(rows), N)})`, 12)}` +
        `${pad(`${open(of('top'))} (${pct(open(of('top')), of('top').length)})`, 12)}${pad(`${open(of('mid'))}`, 12)}${pad(`${open(of('weak'))} (${pct(open(of('weak')), of('weak').length)})`, 12)}`,
    )
  }
  const shippedOpen = rows.filter((r) => r.collegeOpenAtFork)
  console.log(
    `  ${padE('SHIPPED', 12)}${padE(`${TIER_SHORT[ENDINGS.collegeClosedFromTier]}+`, 8)}${pad(`${shippedOpen.length} (${pct(shippedOpen.length, N)})`, 12)}` +
      `${pad(`${shippedOpen.filter((r) => band(r) === 'top').length} (${pct(shippedOpen.filter((r) => band(r) === 'top').length, of('top').length)})`, 12)}` +
      `${pad(`${shippedOpen.filter((r) => band(r) === 'mid').length}`, 12)}` +
      `${pad(`${shippedOpen.filter((r) => band(r) === 'weak').length} (${pct(shippedOpen.filter((r) => band(r) === 'weak').length, of('weak').length)})`, 12)}`,
  )

  console.log(`\n  THE ENTRY THAT COSTS IT – which rung's entry the warning would have to sit on, under the SHIPPED rule`)
  const shut = rows.filter((r) => r.collegeShutTier !== null)
  for (const t of COLLEGE_CLOSERS) {
    const k = shut.filter((r) => r.collegeShutTier === t).length
    if (k === 0) continue
    const ages = shut.filter((r) => r.collegeShutTier === t).map((r) => r.collegeShutAge!)
    console.log(`    ${padE(TIER_SHORT[t], 8)}${pad(k, 4)} closures  ${pad(pct(k, shut.length), 5)}   at mean age ${meanOf(ages)}`)
  }
}

// =================================================================================================
// 5. THE RULE THE SPORT ITSELF USED – and it is a PER-YEAR rule, which changes the answer
// =================================================================================================

if (wants('5')) {
  section(`5. SCORED AGAINST REALITY'S OWN HISTORICAL RULE (n ${N})`)
  console.log(`  NCAA Bylaw 12.1.2.4.2, before it was repealed, let a prospective college TENNIS player keep prize`)
  console.log(`  money up to $10,000 PER CALENDAR YEAR before full-time enrolment, plus, above that line, per-event`)
  console.log(`  amounts not exceeding her actual and necessary expenses. Sourced in`)
  console.log(`  docs/research/college-and-the-junior-exit.md §1b. Two things follow that a cumulative line cannot see:`)
  console.log(`  the rule is ANNUAL, and it forgives the cost of competing. Both are measured here.`)
  console.log(`\n  ⚠ SEASONS, NOT CALENDAR YEARS. The engine has no calendar-year fold, so these are 52-week blocks`)
  console.log(`     from week 0 – season i is her year from age 14+i. Named honestly rather than relabelled.`)

  const seasonsToFork = Math.ceil((ENDINGS.forkAgeYears - 14) * 1) // 5 seasons: ages 14→19
  console.log(`\n  5a. PRIZE PER SEASON, and what share of each season clears the $10,000 line`)
  console.log(`  ${padE('season', 10)}${padE('age', 8)}${pad('median prize', 14)}${pad('p75', 12)}${pad('max', 13)}${pad('over $10k', 12)}${pad('over $10k + costs', 19)}`)
  for (let s = 0; s < seasonsToFork; s++) {
    const vals = rows.map((r) => r.prizeBySeason[s] ?? 0)
    const over = rows.filter((r) => (r.prizeBySeason[s] ?? 0) > 10_000_00).length
    const overFull = rows.filter((r) => (r.prizeBySeason[s] ?? 0) > 10_000_00 + (r.competeBySeason[s] ?? 0)).length
    const d = dist(vals)
    console.log(
      `  ${padE(s, 10)}${padE(`${14 + s}→${15 + s}`, 8)}${pad(usd(d.p50), 14)}${pad(usd(d.p75), 12)}${pad(usd(d.max), 13)}` +
        `${pad(`${over}/${N}`, 12)}${pad(`${overFull}/${N}`, 19)}`,
    )
  }

  console.log(`\n  5b. ⭐ WHEN WOULD THE SPORT'S OWN RULE HAVE FIRED?`)
  // ⚠ CAPPED AT THE FORK, and the cap is the point. The rule is about money taken BEFORE enrolment, so
  // a season that ends after nineteen cannot be what shut a door that is asked about at nineteen.
  // Without the cap this loop reaches season 5 (age 19→20) and reports a rule "firing" at twenty.
  const firstOverAge = (r: Row, withCosts: boolean): number | null => {
    for (let s = 0; s < Math.min(r.prizeBySeason.length, seasonsToFork); s++) {
      const line = 10_000_00 + (withCosts ? (r.competeBySeason[s] ?? 0) : 0)
      if ((r.prizeBySeason[s] ?? 0) > line) return 14 + s + 1 // she crosses it during the season, credited at its end
    }
    return null
  }
  for (const [label, withCosts] of [
    ['$10,000 in a season (the bare cap)', false],
    ['$10,000 + that season\'s travel & entry (the cap AS WRITTEN)', true],
  ] as [string, boolean][]) {
    const ages = rows.map((r) => firstOverAge(r, withCosts)).filter((x): x is number => x !== null)
    console.log(`    ${padE(label, 60)}  fires in ${pad(`${ages.length}/${N}`, 8)}  by age ${meanOf(ages)} (median ${ages.length ? median(ages).toFixed(1) : '–'})`)
  }
  const shutAges = rows.filter((r) => r.collegeShutAge !== null).map((r) => r.collegeShutAge!)
  console.log(`    ${padE('OUR RULE – a won match at W75 or above', 60)}  fires in ${pad(`${shutAges.length}/${N}`, 8)}  by age ${meanOf(shutAges)} (median ${median(shutAges).toFixed(1)})`)

  console.log(`\n  5c. AND THE POST-APRIL-2026 RULE, WHICH IS THE ONE IN FORCE`)
  console.log(`     "Athletes of all sports will be permitted to accept prize money without restrictions ahead of`)
  console.log(`      college enrollment" (Brantmeier/Joint settlement, filed 28.04.2026). Under that rule the door`)
  console.log(`      never closes on money at all: ${N}/${N} careers keep it, and the only remaining gate is whether`)
  console.log(`      a roster place is offered – which this engine does not model.`)
}

if (CSV) {
  const head = [
    'key,seed,preset,band,forkWeek,forkRankWta,forkPointsWta,forkRankItf,forkPrizeCents,forkPrizeYearCents,forkSpendCents,forkCompeteCostCents,forkFundsCents,forkBestTier,collegeShutAge,collegeShutTier,collegeOpenAtFork,endRankWta,endPointsWta,endPrizeCents,w75Entries,firstW75Age',
  ]
  for (const r of rows) {
    head.push(
      [
        r.key,
        r.seed,
        `"${r.preset}"`,
        band(r),
        r.forkWeek ?? '',
        r.forkRankWta,
        r.forkPointsWta,
        r.forkRankItf,
        r.forkPrizeCents,
        r.forkPrizeYearCents,
        r.forkSpendCents,
        r.forkCompeteCostCents,
        r.forkFundsCents,
        r.forkBestTier ?? '',
        r.collegeShutAge?.toFixed(2) ?? '',
        r.collegeShutTier ?? '',
        r.collegeOpenAtFork,
        r.endRankWta,
        r.endPointsWta,
        r.endPrizeCents,
        r.entries.w75,
        r.firstEntryAge.w75?.toFixed(2) ?? '',
      ].join(','),
    )
  }
  writeFileSync(CSV, head.join('\n'))
  console.log(`\n  csv → ${CSV}  (${rows.length} rows)`)
}
