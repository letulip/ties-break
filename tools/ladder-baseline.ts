// ⭐ P0 – THE FROZEN BASELINE. The whole career, measured once, so that everything P1-P6 changes has
// a number to be compared against instead of an impression.
//
//   npx vite-node tools/ladder-baseline.ts [--seeds N] [--weeks N] [--policy 0|1]
//                                          [--only 1,2,…] [--csv PATH] [--json PATH]
//
// THE OWNER'S OWN PREDICTION, and the reason this file exists (15.08, quoted in
// docs/plans/college-and-the-junior-ladder.md): «после этой правки у нас нужны будут отдельные
// перемеры карьер, потому что текущие прогрессы потеряют актуальность – скорость и продвижение точно
// упадут.»
//
// He is right, and FIVE changes in that plan all push the same way and compound. Ship them together
// and "it got slower" is unattributable. This tool is the thing that makes it attributable: if P1
// costs her four years, somebody has to be able to say FOUR.
//
// ⚠⚠ MEASUREMENT ONLY. It imports the engine and reads it. It patches no constant, not even in
// memory, and it touches nothing under src/. Every threshold it prints is read OUT of the engine
// (`ENDINGS`, `TIERS`, `BEST_N_BY_TRACK`, `TIER_LADDER`) rather than restated here, which is the
// property that lets a later phase point it at a CHANGED engine and get a comparable table without
// editing a line of it.
//
// ⚠ WHAT "COMPARABLE BY CONSTRUCTION" COST, in design terms, and it is worth stating because the
// temptation runs the other way:
//   * NO RUNG IS NAMED IN A LOOP. Everything iterates `TIER_LADDER`, so a phase that adds, removes
//     or re-orders a rung gets a table with that rung in it rather than a KeyError or a silent hole.
//   * NO AGE OR COUNT IS HARDCODED THAT THE ENGINE ALSO KNOWS. The fork age is `ENDINGS.forkAgeYears`,
//     the college rung is `RETIRED_COLLEGE_RUNG`, the counting book's width is
//     `BEST_N_BY_TRACK.wta` (eighteen today – the tool says "of N", never "of 18").
//   * THE MILESTONE AGES ARE THE ONE DELIBERATE EXCEPTION. 17 / 19 / 21 / 25 are this MEASUREMENT's
//     own axis, declared once in `RANK_AGES`, and they must NOT move between P0 and P6 or the diff
//     stops being a diff. They are the frozen column headers, not engine knobs.
//
// ⚠ DETERMINISM, AND THE SEED DERIVATION, SPELLED OUT because a later diff that measures noise is
// worse than no diff at all. There are exactly two entropy sources and both are named:
//   1. `openCareer(preset, index, policy)` (tools/econ-bench.ts) builds the seed string
//      `bench-<background>-<index>` and calls `createWorld(seed, profile)`.
//   2. `rngFromSeed(world.seed)` is the MAIN stream, and the only one that carries state.
// So (preset, index, policy, weeks) reproduces byte-identically, and the same seeds re-run against a
// CHANGED engine differ only by the change. Nothing here reads the wall clock or `Math.random`.
//
// ⚠ AND THE ROW'S IDENTITY IS `presetIndex:seedIndex`, NOT THE SEED STRING. The nine presets carry
// only THREE backgrounds, so `bench-working-0` names three different careers (self / budget / middle
// coach) that differ by profile and not by dice. `college-fork-2026-08.md` §6 records what keying on
// the seed string cost there: terciles of 49/6/35 instead of 30/30/30.
//
// ⚠ TWO ENGINE QUESTIONS ARE DELIBERATELY LEFT UNANSWERED, AND THE BASELINE IS DEFINED BY THAT:
//   * THE FORK AT NINETEEN IS NEVER ANSWERED. `tickWeek` has no ended-world early return and an open
//     fork blocks `advanceWeeks`, not the tick, so the career simply runs on – which is the
//     "continue" branch in everything but the recorded answer. Answering it would put a modelling
//     decision inside a measurement tool AND would diverge from `tools/college-fork.ts`, which is the
//     run §8's replication check is against.
//   * THE RETIREMENT OFFER IS NEVER ANSWERED EITHER. It is raised once (`resolveEndings` guards on
//     `retirementOffer === null`), so §7 reports WHEN THE QUESTION WAS PUT rather than a retirement.
//     A retirement in this table is therefore always one of the two that HAPPEN to her – bankruptcy
//     and the career-ending injury – and the plateau/age question is counted separately.
// Both are stable properties of the tool, so P6 inherits them and the diff stays honest.
import { writeFileSync } from 'node:fs'
import { openCareer, stepCareerWeek, POLICIES, PRESETS, zeroByTier, mean, median, type Preset } from './econ-bench'
import { kidAgeExact, kidAgeAt, kidPoints, tableSize } from '../src/engine/world'
// ⚠⚠ THE COLLEGE COLUMN BELOW IS A COUNTERFACTUAL SINCE 16.08.2026, NOT A READING OF THE SHIPPED
// GAME. The owner removed the rule that closed the college door on a result («Колледж – это
// независимая ветка карьеры … альтернативная»); in the game as it ships the third answer is on the
// fork card in 100% of careers. What this file prints is what the PRE-16.08 rule WOULD have done on
// this population, kept so the frozen battery's arms stay comparable on the dimension the
// junior-access phases moved most. `tools/retired-college-rule.ts` is the one definition of it.
import { RETIRED_COLLEGE_RUNG, retiredCollegeDoorOpen } from './retired-college-rule'
import { COLLEGE_OFFER, COLLEGE_TIERS, type CollegeOffer, type CollegeTier } from '../src/engine/collegeOffer'
import type { FamilyBackground } from '../src/shared/protocol'

/** ⚠ THE CHEAPEST PLACE OPEN TO HER – the one college column that means the same thing before and
 *  after the 17.08 rebuild. This battery never answers the fork, so it can report what a place would
 *  cost but never which one she took. */
function cheapestOpen(offer: CollegeOffer | null | undefined) {
  return offer?.quotes.find((q) => q.open) ?? null
}
import { computeCountingResults } from '../src/engine/world/snapshot'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import { ENDINGS } from '../src/engine/ending'
import { TIERS, TIER_LADDER, TIER_SHORT, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { CareerEndingType } from '../src/shared/protocol'

/** Her birth month, read off the profile `openCareer` builds every career from rather than restated.
 *  ⚠ IT IS THE SAME FOR ALL NINETY CAREERS, which is a property of the bench and not of the game:
 *  `openCareer` overrides only `background` and `coachTier`, so every row here is a 15-June girl. A
 *  phase that varies the birth date would have to say so – the relative-age effect is real in this
 *  engine (world/age.ts) and it is deliberately NOT a variable in this baseline. */
const BIRTH_MONTH = DEFAULT_PROFILE.birthMonth
/** Her exact age at a career week, on the one birth date this baseline uses. */
const ageAt = (week: number) => kidAgeExact(week, BIRTH_MONTH, 1)

// --- args -------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strOf = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}

/** THE FROZEN HORIZON: thirteen season blocks. `docs/plans/college-and-the-junior-ladder.md` asks for
 *  "14 → 26", and thirteen blocks is what delivers it on the shipped birth date.
 *
 *  ⚠ WEEK 0 IS NOT AGE 14, AND THE DIFFERENCE IS THE ENGINE'S OWN RULING (engine/world/age.ts, the
 *  owner 09.08: «Есть год рождения и дата. Это всё»). `START_AGE_YEARS` is the BAND; her age is
 *  `kidAgeExact`, and on `DEFAULT_PROFILE`'s 15 June birthday she is **13.58 at week 0** and 26.58 at
 *  week 676. So thirteen blocks contain every complete age band from 14 to 25, plus a part-band at
 *  each end – and §3 marks the two partial bands rather than averaging over them silently. */
const SEASONS = 13
const WEEKS = argOf('weeks', SEASONS * WEEKS_PER_YEAR)
/** seeds PER PRESET; n = SEEDS x PRESETS.length. Default 10 x 9 = 90, the n every figure this
 *  baseline is checked against was measured at. The brief's floor is n >= 90. */
const SEEDS = argOf('seeds', 10)
/** ⚠ `POLICIES[1]` – THE REBUILT POLICY, AND THE OLD ONE'S VERDICTS ARE ALL SUSPECT. `POLICIES[0]`
 *  (the grinder) is the file's reproducibility anchor and never plays the paid rungs at all: measured
 *  in `college-fork-2026-08.md` §3 it enters a W75 in 7 careers of 90 against the player arm's 84, so
 *  every ABSOLUTE verdict taken off it is a verdict about a parent who did not enter the tournaments.
 *  `the-wall-2026-08.md` §7 is the rebuild. Kept selectable because "the ladder is slow" and "the
 *  parent did not pay" are two claims and only a second arm tells them apart. */
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]
const ONLY = (() => {
  const i = args.indexOf('--only')
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null
})()
const wants = (s: string) => !ONLY || ONLY.has(s)
const CSV = strOf('csv')
const JSON_OUT = strOf('json')

/** THE FROZEN MILESTONE AGES – this measurement's own axis and the ONLY hardcoded numbers that are
 *  not read out of the engine. They are the column headers a later phase reports against, so they may
 *  not move: change them and P6's table stops being comparable with P0's, which is the one thing this
 *  file exists to guarantee. */
const RANK_AGES = [17, 19, 21, 25] as const
/** The age the counting book is read at – 19 is the fork, 21 is a full two seasons past it. Same
 *  rule as `RANK_AGES`: frozen, because a later phase reports against these columns and no others. */
const BOOK_AGES = [19, 21] as const
/** The age prize money is banked to. 19 = the fork (the plan's own column); 21 pairs with the book. */
const MONEY_AGES = [19, 21] as const
/** THE REPLICATION WINDOW for §8. 312 weeks (14→20) is the horizon `tools/college-fork.ts` and
 *  `docs/specs/college-fork-2026-08.md` were measured over; restricting this run's first-admission
 *  reads to the same window is what makes the two tables comparable instead of merely similar. */
const CHECK_WEEKS = 312

// --- formatting -------------------------------------------------------------------------------

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 118) => '-'.repeat(n)
function section(title: string): void {
  console.log(`\n${rule()}\n${title}\n${rule()}`)
}
const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (part: number, whole: number) => (whole === 0 ? '  – ' : `${((100 * part) / whole).toFixed(0)}%`)
const one = (x: number) => x.toFixed(1)
const meanOf = (xs: number[]) => (xs.length === 0 ? '–' : mean(xs).toFixed(1))
/** A rung label narrow enough for the 16-column matrix in §3. Derived from `TIER_SHORT` rather than
 *  listed, so a phase that adds a rung gets a column heading instead of a collision. */
const shortRung = (t: TierId) => {
  const s = TIER_SHORT[t].replace('WTA ', 'W')
  return s.length <= 6 ? s : s.slice(0, 3)
}

/** The order statistics anything continuous is reported with. A median cannot show SHAPE, and the
 *  later phases need shape: a change that moves p75 and leaves p25 alone is a different finding from
 *  one that moves the whole distribution, and only these can tell them apart. */
function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo)
}
export interface Dist {
  n: number
  min: number
  p25: number
  p50: number
  p75: number
  p90: number
  max: number
  mean: number
}
function dist(xs: number[]): Dist {
  if (xs.length === 0) return { n: 0, min: 0, p25: 0, p50: 0, p75: 0, p90: 0, max: 0, mean: 0 }
  return {
    n: xs.length,
    min: Math.min(...xs),
    p25: quantile(xs, 0.25),
    p50: median(xs),
    p75: quantile(xs, 0.75),
    p90: quantile(xs, 0.9),
    max: Math.max(...xs),
    mean: mean(xs),
  }
}
/** p25 / p50 / p75 in one cell, which is the minimum the brief asks for on anything continuous. */
const iqr = (d: Dist, f: (x: number) => string) => (d.n === 0 ? '–' : `${f(d.p25)} ${f(d.p50)} ${f(d.p75)}`)

// --- what one career yields --------------------------------------------------------------------

/** Everything measured on ONE career. Every field is a column some later phase reports against, and
 *  each carries the one line saying what it is FOR – see docs/specs/ladder-baseline-2026-08.md. */
export interface Row {
  /** the row's identity: `<presetIndex>:<seedIndex>`. NOT the seed – see the file header. */
  key: string
  seed: string
  preset: string

  // --- the ladder, as it admits her -----------------------------------------------------------
  /** total entries at each rung over the whole horizon. */
  entries: Record<TierId, number>
  /** career week of her FIRST entry at each rung – kept so §8 can restrict to the check window. */
  firstEntryWeek: Partial<Record<TierId, number>>
  /** her exact age that week. THE column P1 is expected to move most. */
  firstEntryAge: Partial<Record<TierId, number>>
  /** her WTA rank that week, RAW – i.e. including the no-points floor (#1601+ on today's table).
   *  Raw because `tools/college-fork.ts` reads it raw and §8 has to compare like with like. */
  firstEntryRankWta: Partial<Record<TierId, number>>
  /** whether that rank was a REAL ranking (she held professional points that week) – the honest
   *  denominator, and the difference between "#1608" and "unranked". */
  firstEntryRankedWta: Partial<Record<TierId, boolean>>
  /** her ITF rank that week: the junior rungs' own table, and the one P1's Accelerator keys on. */
  firstEntryRankItf: Partial<Record<TierId, number>>
  /** career week / age / WTA rank at her first COUNTING finish at each rung – a result that scored,
   *  which is the read `collegeStillOpen` makes and the line between "tried the tour" and "on it". */
  firstCountingWeek: Partial<Record<TierId, number>>
  firstCountingAge: Partial<Record<TierId, number>>
  firstCountingRankWta: Partial<Record<TierId, number>>
  /** ...and whether THAT rank was a real ranking. Same discipline as `firstEntryRankedWta`, and it
   *  matters most exactly where it is easiest to forget: a girl takes her first counting finish at a
   *  junior rung years before she holds a professional point, so the raw number there is the floor. */
  firstCountingRankedWta: Partial<Record<TierId, boolean>>

  // --- rank ------------------------------------------------------------------------------------
  /** her WTA rank at each frozen milestone age, RAW, plus whether it was a real ranking. */
  rankWtaAtAge: Record<number, number | null>
  rankedWtaAtAge: Record<number, boolean>
  /** her ITF rank at the same ages – she is still a junior at 17 and this is that table. */
  rankItfAtAge: Record<number, number | null>
  /** ⚠ AND WHETHER THE ITF NUMBER MEANS ANYTHING AT THAT AGE. No junior point can be earned from 18
   *  (the J rungs are shut on age), so a 21-year-old's ITF rank is the no-points floor of a table she
   *  left three years ago. Reported over the careers holding ITF points and counted otherwise. */
  rankedItfAtAge: Record<number, boolean>
  /** best (lowest) WTA rank ever held WHILE RANKED, and her exact age the week it fell. Null if she
   *  never held a professional ranking at all, which is a finding and not a hole. */
  careerHighWta: number | null
  careerHighWtaAge: number | null

  // --- entries, per age and per season ---------------------------------------------------------
  /** entries[ageInWholeYears][tier]. THE column P2's age caps move, and it must be per-AGE: the
   *  WTA rule is keyed to how old she is, while the engine's allowance WINDOW is the season block. */
  entriesByAge: Record<number, Record<TierId, number>>
  /** entries[seasonBlock][tier], seasonBlock = floor(week / 52). The window the caps reset on. */
  entriesBySeason: Record<number, Record<TierId, number>>
  /** the last age at which this career was still live (not ended), so §3 can report a mean over the
   *  careers that could actually have entered anything. */
  liveThroughAge: number

  // --- money -----------------------------------------------------------------------------------
  /** cumulative prize money booked by each frozen money age, and over the whole horizon. */
  prizeByAge: Record<number, number>
  prizeCareer: number

  // --- the counting book -------------------------------------------------------------------------
  /** her professional points, and how many of the window's slots are filled, at each book age. The
   *  width is `BEST_N_BY_TRACK.wta` and is printed as "of N" – never as "of 18". */
  bookPointsAtAge: Record<number, number>
  bookSlotsAtAge: Record<number, number>

  // --- the college door --------------------------------------------------------------------------
  collegeShutWeek: number | null
  collegeShutAge: number | null
  /** which rung's counting finish shut it – the rung the warning would have to sit on. */
  collegeShutTier: TierId | null
  /** was it open the week the fork was raised? */
  collegeOpenAtFork: boolean
  /** ⭐ AND WAS IT STILL OPEN A FULL SEASON LATER. `college-fork-2026-08.md` §3a found that three of
   *  its seven survivors lost the door within a month of the fork week – "the reported 8% is 4% plus a
   *  race condition". This column is that correction made objective instead of hand-counted. */
  collegeOpenAfterFork: boolean
  forkWeek: number | null
  forkAge: number | null

  // --- ⭐⭐ THE OFFER (v51, docs/specs/what-the-college-place-costs-2026-08.md) -----------------------
  /** ⚠ THIS BLOCK IS THE SHIPPED GAME AND THE FOUR COLUMNS ABOVE ARE THE COUNTERFACTUAL. They measure
   *  two different things and are deliberately kept side by side: the pre-16.08 rule (retired, kept so
   *  the frozen battery's arms stay comparable) versus what the third answer actually offers now.
   *
   *  `docs/specs/college-is-its-own-branch-2026-08.md` §3e turned "still open at the fork" into 100%
   *  by construction. These columns turn it back into a measurement of something real: not whether
   *  the ANSWER is there – it always is – but whether anybody offered to PAY for it, and how much. */
  /** the family this career was run on, so §6a can split the bill by background */
  background: FamilyBackground
  /** which programme offered, `null` = nobody did (walk-on), `undefined` = never reached the fork */
  /** ⚠ RE-AIMED 17.08: the TIER of the cheapest place open to her, not the funding band her record
   *  bought. `null` = no offer measured at all. */
  offerProgramme: CollegeTier | null | undefined
  offerAthleticShare: number | null
  offerNeedShare: number | null
  offerCostPerYearCents: number | null
  offerFamilyPerYearCents: number | null

  // --- survival ------------------------------------------------------------------------------------
  /** null ⇔ the career was still running at the horizon (RIGHT-CENSORED, and §7 says so). */
  endingType: CareerEndingType | null
  endingWeek: number | null
  endingAge: number | null
  /** first week `fundsCents < 0`, i.e. the debt spell that bankruptcy is the twelfth week of. */
  firstDebtWeek: number | null
  /** the age the retirement QUESTION was raised (never answered here – see the file header), and
   *  which reading raised it. */
  retirementAskAge: number | null
  retirementReason: 'age' | 'plateau' | null
}

const TRACK: 'wta' = 'wta'
/** The rungs at or above the one that shuts the college ending – read out of ENDINGS, never listed. */
const COLLEGE_CLOSERS: readonly TierId[] = TIER_LADDER.slice(TIER_LADDER.indexOf(RETIRED_COLLEGE_RUNG))

/** Is the finish she holds at this rung a COUNTING one – a result that scored, not a first-round
 *  exit? The identical test `collegeStillOpen` makes, spelled once so the two cannot disagree. */
function countsAt(bestFinishByTier: Partial<Record<TierId, number>>, t: TierId): boolean {
  const finish = bestFinishByTier[t]
  if (finish === undefined) return false
  if (finish >= TIERS[t].points.length - 1) return false
  return TIERS[t].points[finish] > 0
}

function runOne(preset: Preset, index: number, policy = POLICY, key = ''): Row {
  const { world, rng, seed } = openCareer(preset, index, policy)

  const entries = zeroByTier()
  const firstEntryWeek: Partial<Record<TierId, number>> = {}
  const firstEntryAge: Partial<Record<TierId, number>> = {}
  const firstEntryRankWta: Partial<Record<TierId, number>> = {}
  const firstEntryRankedWta: Partial<Record<TierId, boolean>> = {}
  const firstEntryRankItf: Partial<Record<TierId, number>> = {}
  const firstCountingWeek: Partial<Record<TierId, number>> = {}
  const firstCountingAge: Partial<Record<TierId, number>> = {}
  const firstCountingRankWta: Partial<Record<TierId, number>> = {}
  const firstCountingRankedWta: Partial<Record<TierId, boolean>> = {}

  const rankWtaAtAge: Record<number, number | null> = {}
  const rankedWtaAtAge: Record<number, boolean> = {}
  const rankItfAtAge: Record<number, number | null> = {}
  const rankedItfAtAge: Record<number, boolean> = {}
  for (const a of RANK_AGES) {
    rankWtaAtAge[a] = null
    rankedWtaAtAge[a] = false
    rankItfAtAge[a] = null
    rankedItfAtAge[a] = false
  }
  let careerHighWta: number | null = null
  let careerHighWtaAge: number | null = null
  // ⚠ THE CHEAP GATE ON AN EXPENSIVE READ. "Is she really ranked" is `kidPoints(world,'wta') > 0` -
  // a fold over the results ledger - and asking it 676 times a career x 90 careers is the difference
  // between a bench that finishes and one that does not. `kidRankWta` is a cached field and free, and
  // a career high can only be set on a week that IMPROVES it, so the fold is only paid on those weeks.
  let bestRawWta = Number.POSITIVE_INFINITY

  const entriesByAge: Record<number, Record<TierId, number>> = {}
  const entriesBySeason: Record<number, Record<TierId, number>> = {}
  let liveThroughAge = kidAgeAt(world, 0)

  const prizeByAge: Record<number, number> = {}
  for (const a of MONEY_AGES) prizeByAge[a] = 0
  const bookPointsAtAge: Record<number, number> = {}
  const bookSlotsAtAge: Record<number, number> = {}
  for (const a of BOOK_AGES) {
    bookPointsAtAge[a] = 0
    bookSlotsAtAge[a] = 0
  }

  let collegeShutWeek: number | null = null
  let collegeShutAge: number | null = null
  let collegeShutTier: TierId | null = null
  let collegeOpenAtFork = true
  let collegeOpenAfterFork = true
  let offer: CollegeOffer | null = null
  let forkWeek: number | null = null
  let forkAge: number | null = null
  let forkSeen = false
  let afterForkRead = false

  let endingType: CareerEndingType | null = null
  let endingWeek: number | null = null
  let endingAge: number | null = null
  let firstDebtWeek: number | null = null
  let retirementAskAge: number | null = null
  let retirementReason: 'age' | 'plateau' | null = null

  // The finance ledger is pruned to a 60-week trailing window, so the cumulative prize line has to be
  // folded week by week as it goes - `runCareer`'s own `seenWeeks` idiom, and the reason for the set.
  const seenWeeks = new Set<number>()
  let prizeCents = 0
  const seenAges = new Set<number>()
  const seenBookAges = new Set<number>()
  // ⚠ A `=== 0` SENTINEL WOULD HAVE BEEN A BUG HERE, and it is the exact shape of bug this whole
  // file exists to avoid: a career that has banked NOTHING by nineteen is a real row (four of ninety
  // in college-fork-2026-08.md §4a), and testing "have I recorded this yet" as "is it still zero"
  // would keep re-recording her until she finally earned something and then file THAT under "by 19".
  // Every once-only read in this loop is guarded by a set, not by its own value.
  const seenMoneyAges = new Set<number>()

  for (let i = 0; i < WEEKS; i++) {
    const weekOfEntry = world.week
    const ageAtEntry = kidAgeAt(world, weekOfEntry)
    const seasonBlock = Math.floor(weekOfEntry / WEEKS_PER_YEAR)
    const e = stepCareerWeek(world, rng, policy)

    // 1. ENTRIES – total, by age, by season block. Booked against the week the family COMMITTED,
    //    which is the week an entry allowance is spent from and therefore the week a cap would bite.
    for (const t of TIER_LADDER) {
      if (e[t] <= 0) continue
      entries[t] += e[t]
      entriesByAge[ageAtEntry] ??= zeroByTier()
      entriesByAge[ageAtEntry][t] += e[t]
      entriesBySeason[seasonBlock] ??= zeroByTier()
      entriesBySeason[seasonBlock][t] += e[t]
      if (firstEntryWeek[t] === undefined) {
        firstEntryWeek[t] = weekOfEntry
        // ⚠ THE AGE IS THE COMMIT WEEK'S AND THE RANK IS READ AFTER THE TICK, which is
        // `tools/college-fork.ts`'s exact reading and is replicated on purpose: §8 compares this
        // run's first-admission column against that spec's, and a one-week difference in where the
        // rank is read would put a spurious gap in the comparison. The drift is one week.
        firstEntryAge[t] = kidAgeExact(weekOfEntry, world.profile.birthMonth, world.profile.birthDay)
        firstEntryRankWta[t] = world.kidRankWta ?? tableSize(world, TRACK)
        firstEntryRankedWta[t] = kidPoints(world, TRACK) > 0
        firstEntryRankItf[t] = world.kidRank
      }
    }

    // 2. PRIZE MONEY, folded off the same per-week ledger the Money screen reads.
    for (const fw of world.financeWeeks) {
      if (seenWeeks.has(fw.week)) continue
      seenWeeks.add(fw.week)
      prizeCents += Math.max(0, fw.byCategory.prize ?? 0)
    }

    const ageNow = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    if (world.ending === null) liveThroughAge = Math.floor(ageNow)

    // 3. CAREER HIGH – see `bestRawWta` for why the expensive half is gated.
    const rawWta = world.kidRankWta ?? tableSize(world, TRACK)
    if (rawWta < bestRawWta) {
      bestRawWta = rawWta
      if (kidPoints(world, TRACK) > 0 && (careerHighWta === null || rawWta < careerHighWta)) {
        careerHighWta = rawWta
        careerHighWtaAge = ageNow
      }
    }

    // 4. THE FROZEN MILESTONE READS. First week she is at least this old, once each.
    for (const a of RANK_AGES) {
      if (seenAges.has(a) || ageNow < a) continue
      seenAges.add(a)
      rankWtaAtAge[a] = rawWta
      rankedWtaAtAge[a] = kidPoints(world, TRACK) > 0
      rankItfAtAge[a] = world.kidRank
      rankedItfAtAge[a] = kidPoints(world, 'itf') > 0
    }
    for (const a of MONEY_AGES) {
      if (seenMoneyAges.has(a) || ageNow < a) continue
      seenMoneyAges.add(a)
      prizeByAge[a] = prizeCents
    }
    for (const a of BOOK_AGES) {
      if (seenBookAges.has(a) || ageNow < a) continue
      seenBookAges.add(a)
      bookPointsAtAge[a] = kidPoints(world, TRACK)
      bookSlotsAtAge[a] = computeCountingResults(world, TRACK).length
    }

    // 5. THE FIRST COUNTING FINISH AT EACH RUNG.
    for (const t of TIER_LADDER) {
      if (firstCountingWeek[t] !== undefined) continue
      if (!countsAt(world.bestFinishByTier, t)) continue
      firstCountingWeek[t] = world.week
      firstCountingAge[t] = ageNow
      firstCountingRankWta[t] = rawWta
      firstCountingRankedWta[t] = kidPoints(world, TRACK) > 0
    }

    // 6. THE COLLEGE DOOR.
    if (collegeShutWeek === null && !retiredCollegeDoorOpen(world)) {
      collegeShutWeek = world.week
      collegeShutAge = ageNow
      for (const t of COLLEGE_CLOSERS) {
        if (countsAt(world.bestFinishByTier, t)) {
          collegeShutTier = t
          break
        }
      }
    }
    if (!forkSeen && ageNow >= ENDINGS.forkAgeYears) {
      forkSeen = true
      forkWeek = world.week
      forkAge = ageNow
      collegeOpenAtFork = retiredCollegeDoorOpen(world)
      // ⭐⭐ THE OFFER AS THE PLAYER IS SHOWN IT. Read off persisted state, never recomputed – the
      // engine measures it the week the fork is raised and this is the same object the card renders.
      offer = world.fork?.offer ?? null
    }
    // ⭐ A FULL SEASON PAST THE FORK – the "genuinely open" correction. See `collegeOpenAfterFork`.
    if (forkSeen && !afterForkRead && forkWeek !== null && world.week >= forkWeek + WEEKS_PER_YEAR) {
      afterForkRead = true
      collegeOpenAfterFork = collegeOpenAtFork && retiredCollegeDoorOpen(world)
    }

    // 7. SURVIVAL. The ending latches once; the debt spell is the warning phase before bankruptcy.
    if (firstDebtWeek === null && world.fundsCents < 0) firstDebtWeek = world.week
    if (endingType === null && world.ending) {
      endingType = world.ending.type
      endingWeek = world.ending.week
      endingAge = kidAgeExact(world.ending.week, world.profile.birthMonth, world.profile.birthDay)
    }
    if (retirementAskAge === null && world.retirementOffer) {
      retirementAskAge = kidAgeExact(world.retirementOffer.askedWeek, world.profile.birthMonth, world.profile.birthDay)
      retirementReason = world.retirementOffer.reason
    }
  }

  // A career that never reached the fork inside the horizon has no fork reading to report, and
  // `collegeOpenAfterFork` defaults true for the same reason `collegeOpenAtFork` does: it is only
  // ever consulted alongside `forkWeek !== null`.
  if (!afterForkRead) collegeOpenAfterFork = collegeOpenAtFork

  return {
    key,
    seed,
    preset: preset.label,
    entries,
    firstEntryWeek,
    firstEntryAge,
    firstEntryRankWta,
    firstEntryRankedWta,
    firstEntryRankItf,
    firstCountingWeek,
    firstCountingAge,
    firstCountingRankWta,
    firstCountingRankedWta,
    rankWtaAtAge,
    rankedWtaAtAge,
    rankItfAtAge,
    rankedItfAtAge,
    careerHighWta,
    careerHighWtaAge,
    entriesByAge,
    entriesBySeason,
    liveThroughAge,
    prizeByAge,
    prizeCareer: prizeCents,
    bookPointsAtAge,
    bookSlotsAtAge,
    collegeShutWeek,
    collegeShutAge,
    collegeShutTier,
    collegeOpenAtFork,
    collegeOpenAfterFork,
    background: preset.background,
    // ⚠ RE-AIMED FOR THE 17.08 REBUILD, NOT WIDENED. A tier is a PLACE with a price now and the
    // player picks one, so there is no single "the offer" to read at the fork – this battery never
    // answers the fork (its own header) and so never picks. It reports the CHEAPEST PLACE OPEN TO
    // HER, which is the one column that meant the same thing before and after: the least the college
    // branch can cost this career. `tools/college-price-probe.ts` is where the choice is measured.
    offerProgramme: forkSeen ? cheapestOpen(offer)?.tier ?? null : undefined,
    offerAthleticShare: cheapestOpen(offer)?.athleticShare ?? null,
    offerNeedShare: cheapestOpen(offer)?.needShare ?? null,
    offerCostPerYearCents: cheapestOpen(offer)?.costPerYearCents ?? null,
    offerFamilyPerYearCents: cheapestOpen(offer)?.familyPerYearCents ?? null,
    forkWeek,
    forkAge,
    endingType,
    endingWeek,
    endingAge,
    firstDebtWeek,
    retirementAskAge,
    retirementReason,
  }
}

// ================================================================================================
// THE RUN
// ================================================================================================

const N = PRESETS.length * SEEDS
const BOOK_SLOTS = BEST_N_BY_TRACK[TRACK]
section(
  `P0 – THE FROZEN BASELINE · ${PRESETS.length} presets x ${SEEDS} seeds = n ${N} careers · ` +
    `${WEEKS} weeks (${(WEEKS / WEEKS_PER_YEAR).toFixed(0)} season blocks) · policy "${POLICY.label}"`,
)
console.log(`  seeds        bench-<background>-<0..${SEEDS - 1}> x 9 presets; row identity <presetIndex>:<seedIndex>.`)
console.log(`               Entropy = createWorld(seed, profile) + rngFromSeed(world.seed) and nothing else.`)
console.log(`  engine       SHIPPED CONSTANTS THROUGHOUT – nothing is patched, in memory or otherwise.`)
console.log(
  `               forkAgeYears ${ENDINGS.forkAgeYears} · collegeClosedFromTier ${RETIRED_COLLEGE_RUNG} · ` +
    `counting window ${BOOK_SLOTS} slots · ${TIER_LADDER.length} rungs`,
)
const t0 = Date.now()
const rows: Row[] = []
for (let p = 0; p < PRESETS.length; p++) {
  for (let i = 0; i < SEEDS; i++) rows.push(runOne(PRESETS[p], i, POLICY, `${p}:${i}`))
}
console.log(`  horizon      her exact age runs ${one(ageAt(0))} → ${one(ageAt(WEEKS))}; week 0 is NOT age 14 (see the header).`)
console.error(`  ${rows.length} careers in ${((Date.now() - t0) / 1000).toFixed(0)}s`)

/** Did she hold a REAL professional ranking at that age – i.e. professional points, not the table's
 *  no-points floor. Every rank figure in this file is reported over this population and the rest are
 *  counted, because averaging the floor in invents a ranking for a girl who has none. */
const ranked = (r: Row, a: number) => r.rankedWtaAtAge[a]

// ================================================================================================
// 1. THE LADDER, AS IT ADMITS HER
// ================================================================================================

if (wants('1')) {
  section(`1. AGE AND RANK AT FIRST ADMISSION TO EVERY RUNG, AND AT THE FIRST COUNTING RESULT (n ${N})`)
  console.log(
    `  ${padE('rung', 9)}${pad('minAge', 7)}${pad('cut', 7)}${pad('reach', 9)}  | ` +
      `${pad('first entry: p25 p50 p75', 26)}${pad('rank then (ranked only)', 26)}${pad('unrk', 6)}  | ` +
      `${pad('first count: p25 p50 p75', 26)}${pad('rank then', 20)}`,
  )
  console.log(`  ${rule(140)}`)
  for (const t of TIER_LADDER) {
    const reached = rows.filter((r) => r.firstEntryWeek[t] !== undefined)
    const counted = rows.filter((r) => r.firstCountingWeek[t] !== undefined)
    const cut =
      TIERS[t].acceptsRank !== undefined
        ? `#${TIERS[t].acceptsRank}`
        : TIERS[t].enterPct !== undefined
          ? `${TIERS[t].enterPct}`
          : '–'
    const entryAges = dist(reached.map((r) => r.firstEntryAge[t]!))
    const entryRanks = dist(reached.filter((r) => r.firstEntryRankedWta[t]).map((r) => r.firstEntryRankWta[t]!))
    const unranked = reached.filter((r) => !r.firstEntryRankedWta[t]).length
    const countAges = dist(counted.map((r) => r.firstCountingAge[t]!))
    const countRanks = dist(counted.filter((r) => r.firstCountingRankedWta[t]).map((r) => r.firstCountingRankWta[t]!))
    console.log(
      `  ${padE(TIER_SHORT[t], 9)}${pad(TIERS[t].minAgeYears ?? '–', 7)}${pad(cut, 7)}${pad(`${reached.length}/${N}`, 9)}  | ` +
        `${pad(iqr(entryAges, one), 26)}${pad(reached.length === 0 ? '–' : entryRanks.n === 0 ? 'unranked' : iqr(entryRanks, (x) => `#${Math.round(x)}`), 26)}` +
        `${pad(unranked, 6)}  | ${pad(iqr(countAges, one), 26)}${pad(counted.length === 0 ? '–' : countRanks.n === 0 ? 'unranked' : `#${Math.round(countRanks.p50)}`, 20)}`,
    )
  }
  console.log(`\n  reach      = careers that ever ENTERED the rung inside the horizon.`)
  console.log(`  rank then  = her WTA rank the week of that first entry, over the careers HOLDING a professional ranking;`)
  console.log(`               "unrk" counts the careers that entered it with none. The no-points floor on today's table`)
  const floorSeen = rows.flatMap((r) => TIER_LADDER.filter((t) => r.firstEntryRankedWta[t] === false).map((t) => r.firstEntryRankWta[t]!))
  console.log(`               starts at #${floorSeen.length ? Math.min(...floorSeen) : 0}, so folding those in would invent a ranking for a girl who has none.`)
  console.log(`  first count= her first COUNTING finish there (a result that scored, not a first-round exit) – the read`)
  console.log(`               collegeStillOpen makes, so W75's own contribution to the college door is visible here.`)
}

// ================================================================================================
// 2. RANK
// ================================================================================================

if (wants('2')) {
  section(`2. RANK AT ${RANK_AGES.join(' / ')} AND THE CAREER HIGH (n ${N})`)
  console.log(`  ${padE('age', 8)}${pad('ranked', 10)}${pad('best', 9)}${pad('p25', 9)}${pad('median', 10)}${pad('p75', 9)}${pad('p90', 9)}${pad('worst', 9)}   |  ${pad('ITF median (n)', 14)}`)
  console.log(`  ${rule(100)}`)
  for (const a of RANK_AGES) {
    const g = rows.filter((r) => ranked(r, a))
    const d = dist(g.map((r) => r.rankWtaAtAge[a]!))
    const itfRanked = rows.filter((r) => r.rankedItfAtAge[a])
    const itf = dist(itfRanked.map((r) => r.rankItfAtAge[a]!))
    console.log(
      `  ${padE(a, 8)}${pad(`${g.length}/${N}`, 10)}` +
        (d.n === 0
          ? pad('– never ranked –', 55)
          : `${pad(`#${Math.round(d.min)}`, 9)}${pad(`#${Math.round(d.p25)}`, 9)}${pad(`#${Math.round(d.p50)}`, 10)}${pad(`#${Math.round(d.p75)}`, 9)}${pad(`#${Math.round(d.p90)}`, 9)}${pad(`#${Math.round(d.max)}`, 9)}`) +
        `   |  ${pad(itf.n === 0 ? 'unranked' : `#${Math.round(itf.p50)} (${itf.n})`, 14)}`,
    )
  }
  const high = rows.filter((r) => r.careerHighWta !== null)
  const hd = dist(high.map((r) => r.careerHighWta!))
  const ha = dist(high.map((r) => r.careerHighWtaAge!))
  console.log(
    `\n  ${padE('career high', 14)}${pad(`${high.length}/${N} ever ranked`, 20)}  ` +
      `best #${Math.round(hd.min)} · p25 #${Math.round(hd.p25)} · median #${Math.round(hd.p50)} · p75 #${Math.round(hd.p75)} · worst #${Math.round(hd.max)}`,
  )
  console.log(
    `  ${padE('  age it fell', 14)}${pad('', 20)}  ` +
      `min ${one(ha.min)} · p25 ${one(ha.p25)} · median ${one(ha.p50)} · p75 ${one(ha.p75)} · max ${one(ha.max)}`,
  )
  console.log(`\n  ranked  = careers holding professional POINTS at that age. A rank read off a girl with none is the`)
  console.log(`            table's no-points floor and means "unranked", so it is counted rather than averaged in.`)
  console.log(`  ITF     = the junior table, over the careers still holding junior POINTS at that age – and from 18 no
            junior point can be earned at all (the J rungs shut on age), so it empties out by design.
  ⚠ THE CAREER HIGH IS RIGHT-CENSORED BY THE HORIZON – she is still ${one(ageAt(WEEKS))} when the run stops.`)
}

// ================================================================================================
// 3. ENTRIES PER SEASON, BY RUNG AND BY AGE
// ================================================================================================

if (wants('3')) {
  section(`3. ENTRIES BY AGE AND BY RUNG (n ${N}) – the column P2's age caps move`)
  const ages = [...new Set(rows.flatMap((r) => Object.keys(r.entriesByAge).map(Number)))].sort((a, b) => a - b)
  const firstAge = Math.floor(ageAt(0))
  const lastAge = Math.floor(ageAt(WEEKS - 1))
  const entriesAt = (r: Row, a: number, t: TierId) => r.entriesByAge[a]?.[t] ?? 0
  const totalAt = (r: Row, a: number) => TIER_LADDER.reduce((s, t) => s + entriesAt(r, a, t), 0)
  console.log(
    `  ${padE('age', 6)}${pad('live', 7)}${pad('all', 8)}${pad('live', 8)}  | ` +
      TIER_LADDER.map((t) => pad(shortRung(t), 7)).join(''),
  )
  console.log(`  ${rule(60 + 7 * TIER_LADDER.length)}`)
  for (const a of ages) {
    const alive = rows.filter((r) => r.liveThroughAge >= a)
    const partial = a === firstAge || a === lastAge ? ' ⚠part' : ''
    console.log(
      `  ${padE(a + partial, 6)}${pad(alive.length, 7)}${pad(mean(rows.map((r) => totalAt(r, a))).toFixed(1), 8)}` +
        `${pad(alive.length ? mean(alive.map((r) => totalAt(r, a))).toFixed(1) : '–', 8)}  | ` +
        TIER_LADDER.map((t) => pad(mean(rows.map((r) => entriesAt(r, a, t))).toFixed(1), 7)).join(''),
    )
  }
  console.log(`\n  all  = mean entries that YEAR OF HER LIFE over all ${N} careers; live = over the careers not yet ended.`)
  console.log(`         The two diverge exactly as much as the careers die, so the gap IS the survival cost.`)
  console.log(`  ⚠ THE ⚠part BANDS ARE PART-YEARS. Week 0 is age ${one(ageAt(0))} and the horizon ends at ${one(ageAt(WEEKS))},`)
  console.log(`    so the first and last age bands are fractions of a year and their means are NOT annual rates.`)

  const seasons = [...new Set(rows.flatMap((r) => Object.keys(r.entriesBySeason).map(Number)))].sort((a, b) => a - b)
  const perSeason = seasons.map((s) =>
    mean(rows.map((r) => TIER_LADDER.reduce((acc, t) => acc + (r.entriesBySeason[s]?.[t] ?? 0), 0))),
  )
  console.log(`\n  PER SEASON BLOCK (the window an entry allowance resets on – floor(week/52), NOT her birthday):`)
  console.log(`  ${seasons.map((s, i) => `S${s} ${perSeason[i].toFixed(1)}`).join(' · ')}`)
  const totals = dist(rows.map((r) => TIER_LADDER.reduce((s, t) => s + r.entries[t], 0)))
  console.log(
    `  whole horizon: p25 ${totals.p25.toFixed(0)} · median ${totals.p50.toFixed(0)} · p75 ${totals.p75.toFixed(0)} ` +
      `(min ${totals.min} / max ${totals.max}) entries per career`,
  )
}

// ================================================================================================
// 4. MONEY
// ================================================================================================

if (wants('4')) {
  section(`4. PRIZE MONEY BANKED (n ${N})`)
  console.log(`  ${padE('by age', 10)}${pad('min', 12)}${pad('p25', 12)}${pad('median', 13)}${pad('p75', 13)}${pad('p90', 13)}${pad('max', 13)}${pad('mean', 13)}`)
  console.log(`  ${rule(100)}`)
  for (const a of MONEY_AGES) {
    const d = dist(rows.map((r) => r.prizeByAge[a]))
    console.log(
      `  ${padE(a, 10)}${pad(usd(d.min), 12)}${pad(usd(d.p25), 12)}${pad(usd(d.p50), 13)}${pad(usd(d.p75), 13)}${pad(usd(d.p90), 13)}${pad(usd(d.max), 13)}${pad(usd(d.mean), 13)}`,
    )
  }
  const c = dist(rows.map((r) => r.prizeCareer))
  console.log(
    `  ${padE('career', 10)}${pad(usd(c.min), 12)}${pad(usd(c.p25), 12)}${pad(usd(c.p50), 13)}${pad(usd(c.p75), 13)}${pad(usd(c.p90), 13)}${pad(usd(c.max), 13)}${pad(usd(c.mean), 13)}`,
  )
  console.log(`\n  ⚠ CAREER IS RIGHT-CENSORED at the horizon, and a career that ENDED early stops earning – so this`)
  console.log(`    column is "banked by ${one(ageAt(WEEKS))} or by the week the story stopped", not "lifetime earnings".`)
}

// ================================================================================================
// 5. THE COUNTING BOOK
// ================================================================================================

if (wants('5')) {
  section(`5. THE COUNTING BOOK – professional points and filled slots, of ${BOOK_SLOTS} (n ${N})`)
  console.log(`  ${padE('at age', 9)}${pad('points: min', 13)}${pad('p25', 9)}${pad('median', 10)}${pad('p75', 10)}${pad('max', 10)}  |  ${pad(`slots of ${BOOK_SLOTS}: min`, 17)}${pad('p25', 8)}${pad('median', 9)}${pad('p75', 8)}${pad('max', 8)}${pad('full', 8)}`)
  console.log(`  ${rule(118)}`)
  for (const a of BOOK_AGES) {
    const p = dist(rows.map((r) => r.bookPointsAtAge[a]))
    const s = dist(rows.map((r) => r.bookSlotsAtAge[a]))
    const full = rows.filter((r) => r.bookSlotsAtAge[a] >= BOOK_SLOTS).length
    console.log(
      `  ${padE(a, 9)}${pad(Math.round(p.min), 13)}${pad(Math.round(p.p25), 9)}${pad(Math.round(p.p50), 10)}${pad(Math.round(p.p75), 10)}${pad(Math.round(p.max), 10)}  |  ` +
        `${pad(s.min, 17)}${pad(s.p25.toFixed(0), 8)}${pad(s.p50.toFixed(0), 9)}${pad(s.p75.toFixed(0), 8)}${pad(s.max, 8)}${pad(`${full}/${N}`, 8)}`,
    )
  }
  console.log(`\n  The window's width is read from BEST_N_BY_TRACK.wta, never restated – a phase that re-sizes the book`)
  console.log(`  gets a table about the new width. "full" = careers with every slot filled at that age.`)
}

// ================================================================================================
// 6. THE COLLEGE DOOR
// ================================================================================================

if (wants('6')) {
  section(`6. THE COLLEGE DOOR (n ${N})`)
  const shut = rows.filter((r) => r.collegeShutWeek !== null)
  const reachedFork = rows.filter((r) => r.forkWeek !== null)
  const openAtFork = reachedFork.filter((r) => r.collegeOpenAtFork)
  const openAfter = reachedFork.filter((r) => r.collegeOpenAfterFork)
  const sd = dist(shut.map((r) => r.collegeShutAge!))
  const doorRow = (label: string, k: number, tail = '') =>
    console.log(`  ${padE(label, 34)}${pad(k, 4)} / ${N}   ${pad(pct(k, N), 5)}   ${tail}`)
  doorRow('door SHUT', shut.length, `mean age ${meanOf(shut.map((r) => r.collegeShutAge!))}, median ${one(sd.p50)}`)
  doorRow(`reached the fork (${ENDINGS.forkAgeYears}) inside horizon`, reachedFork.length)
  doorRow('still OPEN at the fork', openAtFork.length)
  doorRow('⭐ still open a FULL SEASON later', openAfter.length, '← the "genuinely open" number')
  console.log(`\n  WHICH RUNG SHUT IT`)
  for (const t of COLLEGE_CLOSERS) {
    const k = shut.filter((r) => r.collegeShutTier === t).length
    if (k === 0) continue
    console.log(`    ${padE(TIER_SHORT[t], 9)}${pad(k, 4)}   ${pct(k, shut.length)} of closures   at mean age ${meanOf(shut.filter((r) => r.collegeShutTier === t).map((r) => r.collegeShutAge!))}`)
  }
  console.log(`\n  THE AGE IT SHUTS – distribution over the ${shut.length} careers that lost it`)
  const buckets: [string, (a: number) => boolean][] = [
    ['under 16', (a) => a < 16],
    ['16 – 16.9', (a) => a >= 16 && a < 17],
    ['17 – 17.9', (a) => a >= 17 && a < 18],
    ['18 – 18.9', (a) => a >= 18 && a < 19],
    ['19+', (a) => a >= 19],
  ]
  for (const [label, test] of buckets) {
    const k = shut.filter((r) => test(r.collegeShutAge!)).length
    console.log(`    ${padE(label, 11)}${pad(k, 4)}  ${pad(pct(k, shut.length), 5)}  ${'#'.repeat(Math.round((40 * k) / Math.max(1, shut.length)))}`)
  }
  console.log(`\n    min ${one(sd.min)} · p25 ${one(sd.p25)} · median ${one(sd.p50)} · p75 ${one(sd.p75)} · p90 ${one(sd.p90)} · max ${one(sd.max)}`)
  console.log(`\n  ⚠ THE FORK-OPEN NUMBER ALONE OVERSTATES THE DOOR. A career can hold it on the fork week and lose it`)
  console.log(`    a fortnight later, which is why the season-later column is here: it is the same correction`)
  console.log(`    college-fork-2026-08.md §3a made by hand, made objective.`)

  // ================================================================================================
  // 6a. ⭐⭐ THE OFFER – WHAT THE THIRD ANSWER ACTUALLY COSTS (v51)
  // ================================================================================================
  //
  // ⚠ EVERYTHING ABOVE THIS LINE IS THE RETIRED RULE, AND EVERYTHING BELOW IT IS THE SHIPPED GAME.
  // The four columns above ask "would the pre-16.08 rule have shut the door" and are kept only so the
  // frozen battery's arms stay comparable. These ask the question the owner is actually deciding on:
  // the ANSWER is on the card in 100% of careers by his ruling – but is anybody offering to PAY for
  // it, and what is left for the family?
  const atFork = rows.filter((r) => r.offerProgramme !== undefined)
  if (atFork.length > 0) {
    console.log(`\n  ${rule(84)}`)
    console.log(`  6a. THE OFFER (v51) – the shipped game, not the counterfactual. n ${atFork.length} careers reaching the fork`)
    console.log(`  ${rule(84)}`)
    // ⚠ RE-AIMED 17.08 AND NOT LOOSENED. "Funded" used to mean `programme !== null`; a tier is a
    // PLACE now and every career is quoted one, so the walk-on is the career whose AWARD is zero –
    // which is what the old flag actually meant (nobody funded her). Same population, honest name.
    const funded = atFork.filter((r) => (r.offerAthleticShare ?? 0) > 0)
    console.log(`\n  ${padE('OFFERED A FUNDED PLACE', 34)}${pad(funded.length, 4)} / ${atFork.length}   ${pct(funded.length, atFork.length)}`)
    console.log(`  ${padE('walk-on (no programme funded her)', 34)}${pad(atFork.length - funded.length, 4)} / ${atFork.length}   ${pct(atFork.length - funded.length, atFork.length)}`)
    console.log(`\n  THE CHEAPEST PLACE OPEN TO HER, AND WHAT THE AWARD COVERS THERE`)
    console.log(`  ${padE('place', 12)}${pad('careers', 9)}${pad('share', 8)}${pad('athletic %', 12)}${pad('need %', 9)}${pad('family $/yr', 13)}`)
    console.log(`  ${rule(64)}`)
    for (const p of ['state', 'national', 'private', null] as (CollegeTier | null)[]) {
      const g = atFork.filter((r) => r.offerProgramme === p)
      if (g.length === 0) continue
      console.log(
        `  ${padE(p ?? 'walk-on', 12)}${pad(g.length, 9)}${pad(pct(g.length, atFork.length), 8)}` +
          `${pad(one(100 * mean(g.map((r) => r.offerAthleticShare ?? 0))), 12)}` +
          `${pad(one(100 * mean(g.map((r) => r.offerNeedShare ?? 0))), 9)}` +
          `${pad(usd(mean(g.map((r) => r.offerFamilyPerYearCents ?? 0))), 13)}`,
      )
    }
    // ⭐⭐ THE OWNER'S QUESTION, AS A TABLE. «едины для всех или тоже от достатка?» The athletic column
    // must be FLAT across the three rows or the merit-only property is broken in the shipped build;
    // the family column is where a background may legitimately show, and only through the need layer.
    console.log(`\n  ⭐⭐ BY FAMILY BACKGROUND – the athletic column must be FLAT, the bill may not be`)
    console.log(`  ${padE('background', 12)}${pad('careers', 9)}${pad('athletic %', 12)}${pad('need %', 9)}${pad('family $/yr', 13)}${pad('4 years', 13)}`)
    console.log(`  ${rule(70)}`)
    for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const g = atFork.filter((r) => r.background === b)
      if (g.length === 0) continue
      const perYear = mean(g.map((r) => r.offerFamilyPerYearCents ?? 0))
      console.log(
        `  ${padE(b, 12)}${pad(g.length, 9)}` +
          `${pad(one(100 * mean(g.map((r) => r.offerAthleticShare ?? 0))), 12)}` +
          `${pad(one(100 * mean(g.map((r) => r.offerNeedShare ?? 0))), 9)}` +
          `${pad(usd(perYear), 13)}${pad(usd(perYear * ENDINGS.collegeYears), 13)}`,
      )
    }
    const bill = dist(atFork.map((r) => (r.offerFamilyPerYearCents ?? 0) * ENDINGS.collegeYears))
    console.log(`\n  WHAT ${ENDINGS.collegeYears} YEARS COST THE FAMILY, over all ${atFork.length}`)
    console.log(`    min ${usd(bill.min)} · p25 ${usd(bill.p25)} · median ${usd(bill.p50)} · p75 ${usd(bill.p75)} · max ${usd(bill.max)}`)
    console.log(`    free rides: ${atFork.filter((r) => (r.offerFamilyPerYearCents ?? 0) === 0).length} of ${atFork.length}`)
    console.log(`\n  ⚠ EVERY CAREER HERE IS \`country: '${COLLEGE_OFFER.usCountryCode}'\` – the bench's own profile. A non-American faces the`)
    console.log(`    out-of-state sticker (${usd(COLLEGE_TIERS.national.costPerYearCents)}/yr vs ${usd(COLLEGE_TIERS.state.costPerYearCents)}) AND no need-based layer at all (34 CFR 668.33),`)
    console.log(`    so this table is the CHEAPEST the college branch can be. See the spec's §4.`)
  }
}

// ================================================================================================
// 7. SURVIVAL
// ================================================================================================

if (wants('7')) {
  section(`7. SURVIVAL – how careers end, and how long they run (n ${N})`)
  const kinds: (CareerEndingType | null)[] = [...new Set(rows.map((r) => r.endingType))]
  console.log(`  ${padE('ending', 14)}${pad('careers', 10)}${pad('share', 8)}${pad('age: min', 11)}${pad('p25', 8)}${pad('median', 9)}${pad('p75', 8)}${pad('max', 8)}`)
  console.log(`  ${rule(80)}`)
  for (const k of kinds) {
    const g = rows.filter((r) => r.endingType === k)
    if (k === null) {
      console.log(`  ${padE('still running', 14)}${pad(g.length, 10)}${pad(pct(g.length, N), 8)}   ⚠ RIGHT-CENSORED at the horizon (${one(ageAt(WEEKS))})`)
      continue
    }
    const d = dist(g.map((r) => r.endingAge!))
    console.log(
      `  ${padE(k, 14)}${pad(g.length, 10)}${pad(pct(g.length, N), 8)}${pad(one(d.min), 11)}${pad(one(d.p25), 8)}${pad(one(d.p50), 9)}${pad(one(d.p75), 8)}${pad(one(d.max), 8)}`,
    )
  }
  const ended = rows.filter((r) => r.endingType !== null)
  const bankrupt = rows.filter((r) => r.endingType === 'bankruptcy')
  const inDebt = rows.filter((r) => r.firstDebtWeek !== null)
  const asked = rows.filter((r) => r.retirementAskAge !== null)
  console.log(`\n  ended inside the horizon      ${pad(ended.length, 4)} / ${N}  ${pct(ended.length, N)}`)
  console.log(`  BANKRUPTCIES                  ${pad(bankrupt.length, 4)} / ${N}  ${pct(bankrupt.length, N)}` + (bankrupt.length ? `   median age ${one(dist(bankrupt.map((r) => r.endingAge!)).p50)}` : ''))
  console.log(`  ever in debt at all           ${pad(inDebt.length, 4)} / ${N}  ${pct(inDebt.length, N)}` + (inDebt.length ? `   median first red week ${dist(inDebt.map((r) => r.firstDebtWeek!)).p50.toFixed(0)}` : ''))
  console.log(`  RETIREMENT QUESTION RAISED    ${pad(asked.length, 4)} / ${N}  ${pct(asked.length, N)}` + (asked.length ? `   median age ${one(dist(asked.map((r) => r.retirementAskAge!)).p50)}` : ''))
  for (const reason of ['plateau', 'age'] as const) {
    const g = asked.filter((r) => r.retirementReason === reason)
    if (g.length) console.log(`      of which ${padE(reason, 10)}${pad(g.length, 4)}   at mean age ${meanOf(g.map((r) => r.retirementAskAge!))}`)
  }
  const lengths = dist(rows.map((r) => r.endingAge ?? ageAt(WEEKS)))
  console.log(`\n  CAREER LENGTH – her age when the story stopped, or the horizon for the ones still running`)
  console.log(`    min ${one(lengths.min)} · p25 ${one(lengths.p25)} · median ${one(lengths.p50)} · p75 ${one(lengths.p75)} · max ${one(lengths.max)}`)
  console.log(`\n  ⚠ THE RETIREMENT QUESTION IS NEVER ANSWERED BY THIS TOOL (see the file header), so it is counted as`)
  console.log(`    a QUESTION PUT, not as a retirement. Every ending above is one the career took on its own.`)
}

// ================================================================================================
// 8. THE CHECK – against docs/specs/college-fork-2026-08.md, over ITS window
// ================================================================================================

if (wants('8')) {
  section(`8. REPLICATION CHECK vs docs/specs/college-fork-2026-08.md (n ${N}, restricted to the first ${CHECK_WEEKS} weeks)`)
  console.log(`  That spec measured the SAME seeds and the SAME policy over ${CHECK_WEEKS} weeks. Restricting this run's reads to`)
  console.log(`  the same window is what makes the two comparable; a difference here is a bug in one of the two runs.`)
  console.log(`  ⚠ ITS "rank then" COLUMN FOLDS THE NO-POINTS FLOOR INTO THE MEAN, so this check reproduces that raw`)
  console.log(`    reading rather than §1's ranked-only one. The two differ only where a rung admits an unranked girl.\n`)
  console.log(`  ${padE('rung', 10)}${pad('reach', 9)}${pad('1st entry (mean)', 18)}${pad('rank then (raw mean)', 22)}${pad('1st count (mean)', 18)}`)
  console.log(`  ${rule(80)}`)
  const inWindow = (w: number | undefined) => w !== undefined && w < CHECK_WEEKS
  for (const t of TIER_LADDER) {
    const reached = rows.filter((r) => inWindow(r.firstEntryWeek[t]))
    const counted = rows.filter((r) => inWindow(r.firstCountingWeek[t]))
    console.log(
      `  ${padE(TIER_SHORT[t], 10)}${pad(`${reached.length}/${N}`, 9)}${pad(meanOf(reached.map((r) => r.firstEntryAge[t]!)), 18)}` +
        `${pad(reached.length ? `#${Math.round(mean(reached.map((r) => r.firstEntryRankWta[t]!)))}` : '–', 22)}` +
        `${pad(meanOf(counted.map((r) => r.firstCountingAge[t]!)), 18)}`,
    )
  }
  const shutIn = rows.filter((r) => r.collegeShutWeek !== null && r.collegeShutWeek < CHECK_WEEKS)
  const inBand = shutIn.filter((r) => r.collegeShutAge! >= 17 && r.collegeShutAge! < 18)
  console.log(`\n  college door shut inside the window   ${pad(shutIn.length, 4)} / ${N}   mean age ${meanOf(shutIn.map((r) => r.collegeShutAge!))}, median ${one(dist(shutIn.map((r) => r.collegeShutAge!)).p50)}`)
  console.log(`  of those, in the 17.0–17.9 band       ${pad(inBand.length, 4)} / ${shutIn.length}   ${pct(inBand.length, shutIn.length)}`)
  const forkIn = rows.filter((r) => r.forkWeek !== null && r.forkWeek < CHECK_WEEKS)
  console.log(`  still open at the fork                ${pad(forkIn.filter((r) => r.collegeOpenAtFork).length, 4)} / ${N}`)
  console.log(`  ...and still open a season later      ${pad(forkIn.filter((r) => r.collegeOpenAfterFork).length, 4)} / ${N}`)
  console.log(`\n  THE FIGURES THAT SPEC PUBLISHED, for the reader's convenience – NOT this run's output:`)
  console.log(`    W75 17.2 / #279 · W100 17.5 / #259 · WTA 125 17.8 / #218 · WTA 250 18.0 / #188`)
  console.log(`    86/90 closures at mean 17.3 · 92% inside 17.0–17.9 · 7/90 open at the fork, 4 of them genuinely`)
}

// --- dumps --------------------------------------------------------------------------------------

if (CSV) {
  const head: string[] = []
  const cols = [
    'key',
    'seed',
    'preset',
    ...TIER_LADDER.flatMap((t) => [`entries_${t}`, `firstEntryWeek_${t}`, `firstEntryAge_${t}`, `firstEntryRankWta_${t}`, `firstEntryRanked_${t}`, `firstCountingWeek_${t}`, `firstCountingAge_${t}`]),
    ...RANK_AGES.flatMap((a) => [`rankWta_${a}`, `rankedWta_${a}`, `rankItf_${a}`]),
    'careerHighWta',
    'careerHighWtaAge',
    ...MONEY_AGES.map((a) => `prizeCents_${a}`),
    'prizeCareerCents',
    ...BOOK_AGES.flatMap((a) => [`bookPoints_${a}`, `bookSlots_${a}`]),
    'collegeShutWeek',
    'collegeShutAge',
    'collegeShutTier',
    'collegeOpenAtFork',
    'collegeOpenAfterFork',
    'forkWeek',
    'endingType',
    'endingWeek',
    'endingAge',
    'firstDebtWeek',
    'retirementAskAge',
    'retirementReason',
    'liveThroughAge',
  ]
  head.push(cols.join(','))
  for (const r of rows) {
    head.push(
      [
        r.key,
        r.seed,
        `"${r.preset}"`,
        ...TIER_LADDER.flatMap((t) => [
          r.entries[t],
          r.firstEntryWeek[t] ?? '',
          r.firstEntryAge[t]?.toFixed(2) ?? '',
          r.firstEntryRankWta[t] ?? '',
          r.firstEntryRankedWta[t] ?? '',
          r.firstCountingWeek[t] ?? '',
          r.firstCountingAge[t]?.toFixed(2) ?? '',
        ]),
        ...RANK_AGES.flatMap((a) => [r.rankWtaAtAge[a] ?? '', r.rankedWtaAtAge[a], r.rankItfAtAge[a] ?? '']),
        r.careerHighWta ?? '',
        r.careerHighWtaAge?.toFixed(2) ?? '',
        ...MONEY_AGES.map((a) => r.prizeByAge[a]),
        r.prizeCareer,
        ...BOOK_AGES.flatMap((a) => [r.bookPointsAtAge[a], r.bookSlotsAtAge[a]]),
        r.collegeShutWeek ?? '',
        r.collegeShutAge?.toFixed(2) ?? '',
        r.collegeShutTier ?? '',
        r.collegeOpenAtFork,
        r.collegeOpenAfterFork,
        r.forkWeek ?? '',
        r.endingType ?? '',
        r.endingWeek ?? '',
        r.endingAge?.toFixed(2) ?? '',
        r.firstDebtWeek ?? '',
        r.retirementAskAge?.toFixed(2) ?? '',
        r.retirementReason ?? '',
        r.liveThroughAge,
      ].join(','),
    )
  }
  writeFileSync(CSV, head.join('\n'))
  console.log(`\n  csv → ${CSV}  (${rows.length} rows)`)
}

if (JSON_OUT) {
  // ⭐ THE SUMMARY, MACHINE-READABLE. P6 re-runs this tool against the changed engine and diffs two
  // of these files – which is the difference between "it got slower" and a number per column. The
  // shape is keyed by rung / age / ending so an added rung or a moved constant shows up as a new
  // key rather than as a silently shifted column.
  const summary = {
    tool: 'tools/ladder-baseline.ts',
    n: N,
    seedsPerPreset: SEEDS,
    presets: PRESETS.map((p) => p.label),
    policy: POLICY.id,
    weeks: WEEKS,
    engine: {
      forkAgeYears: ENDINGS.forkAgeYears,
      collegeClosedFromTier: RETIRED_COLLEGE_RUNG,
      countingSlotsWta: BOOK_SLOTS,
      tierLadder: TIER_LADDER,
    },
    ladder: Object.fromEntries(
      TIER_LADDER.map((t) => {
        const reached = rows.filter((r) => r.firstEntryWeek[t] !== undefined)
        const counted = rows.filter((r) => r.firstCountingWeek[t] !== undefined)
        return [
          t,
          {
            reach: reached.length,
            entriesMean: mean(rows.map((r) => r.entries[t])),
            firstEntryAge: dist(reached.map((r) => r.firstEntryAge[t]!)),
            firstEntryRankWtaRanked: dist(reached.filter((r) => r.firstEntryRankedWta[t]).map((r) => r.firstEntryRankWta[t]!)),
            firstEntryUnranked: reached.filter((r) => !r.firstEntryRankedWta[t]).length,
            firstCountingAge: dist(counted.map((r) => r.firstCountingAge[t]!)),
          },
        ]
      }),
    ),
    rank: Object.fromEntries(
      RANK_AGES.map((a) => [a, { ranked: rows.filter((r) => ranked(r, a)).length, wta: dist(rows.filter((r) => ranked(r, a)).map((r) => r.rankWtaAtAge[a]!)) }]),
    ),
    careerHigh: {
      everRanked: rows.filter((r) => r.careerHighWta !== null).length,
      rank: dist(rows.filter((r) => r.careerHighWta !== null).map((r) => r.careerHighWta!)),
      age: dist(rows.filter((r) => r.careerHighWtaAge !== null).map((r) => r.careerHighWtaAge!)),
    },
    entriesByAge: Object.fromEntries(
      [...new Set(rows.flatMap((r) => Object.keys(r.entriesByAge).map(Number)))]
        .sort((a, b) => a - b)
        .map((a) => [
          a,
          {
            live: rows.filter((r) => r.liveThroughAge >= a).length,
            all: mean(rows.map((r) => TIER_LADDER.reduce((s, t) => s + (r.entriesByAge[a]?.[t] ?? 0), 0))),
            byTier: Object.fromEntries(TIER_LADDER.map((t) => [t, mean(rows.map((r) => r.entriesByAge[a]?.[t] ?? 0))])),
          },
        ]),
    ),
    prize: {
      ...Object.fromEntries(MONEY_AGES.map((a) => [`by${a}`, dist(rows.map((r) => r.prizeByAge[a]))])),
      career: dist(rows.map((r) => r.prizeCareer)),
    },
    book: Object.fromEntries(
      BOOK_AGES.map((a) => [a, { points: dist(rows.map((r) => r.bookPointsAtAge[a])), slots: dist(rows.map((r) => r.bookSlotsAtAge[a])) }]),
    ),
    college: {
      shut: rows.filter((r) => r.collegeShutWeek !== null).length,
      shutAge: dist(rows.filter((r) => r.collegeShutWeek !== null).map((r) => r.collegeShutAge!)),
      byTier: Object.fromEntries(COLLEGE_CLOSERS.map((t) => [t, rows.filter((r) => r.collegeShutTier === t).length])),
      openAtFork: rows.filter((r) => r.forkWeek !== null && r.collegeOpenAtFork).length,
      openAfterFork: rows.filter((r) => r.forkWeek !== null && r.collegeOpenAfterFork).length,
    },
    survival: {
      byEnding: Object.fromEntries(
        [...new Set(rows.map((r) => r.endingType))].map((k) => [k ?? 'running', rows.filter((r) => r.endingType === k).length]),
      ),
      endAge: dist(rows.filter((r) => r.endingAge !== null).map((r) => r.endingAge!)),
      everInDebt: rows.filter((r) => r.firstDebtWeek !== null).length,
      retirementAsked: rows.filter((r) => r.retirementAskAge !== null).length,
      careerLength: dist(rows.map((r) => r.endingAge ?? ageAt(WEEKS))),
    },
  }
  writeFileSync(JSON_OUT, JSON.stringify(summary, null, 2))
  console.log(`\n  json → ${JSON_OUT}`)
}
