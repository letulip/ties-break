// THE MONEY DECOMPOSITION: why the career-long prize/spend ratio is a tenth when the top of the
// prize table pays $3,000,000.
//
// Run: `npm run bench:money` (add `--seeds N` to change the sample, `--no-verify` to skip the
// endings-bench cross-check, `--policy player` for the lever arm).
//
// ⚠ WHY THIS TOOL EXISTS. docs/specs/endings-and-the-album.md §6 measured the cumulative crossing at
// 0/180 = 0.0% and prize/spend at career end at a median of 8.0%. The owner read that and asked how
// it is possible when the prize money is huge and grows the further up the ladder you go. That is a
// fair question about a real number, and the honest answer is a DECOMPOSITION rather than a retune.
// This tool changes no engine constant. It re-plays the SAME 180 careers the endings bench measured
// and reports where the money is, where it is not, and what the denominator is made of.
//
// ⚠ AND THE FIRST THING IT FOUND IS THAT §6's FIGURE IS STALE. Re-measured at this branch's head the
// same 180 careers give a median of 12.4% (mean 12.1%, best 37.4%, 122/180 ever paid) rather than
// 8.0% / 7.6% / 22.9% / 136-180: §6 was written before the `feat/field-in-brackets` merge put derived
// professionals into the canonical W brackets, which changed who she meets and therefore what she
// wins. The CROSSING is 0/180 either way, so the conclusion is untouched. See
// docs/specs/money-decomposition-2026-08.md §2a.
//
// ⚠ THE POPULATION IS THE ENDINGS BENCH'S OWN, and it has to be or the answer is about a different
// game. `runToEnding` builds its slot-6 rows from BOTH retirement arms – `turnRows = [...arms[0],
// ...arms[1]]` – so at `--seeds 10` that is 9 presets x 10 seeds x 2 arms = 180 careers, the grinder
// policy, the fork answered "continue". This file re-plays exactly that and proves it: the `--verify`
// arm re-runs `runToEnding` on every cell and compares ending, ended week, prize and spend. If the
// four agree for all 180 the careers are the same careers, and the decomposition below is a
// decomposition OF the number that was published rather than of a lookalike.
import {
  PRESETS,
  POLICIES,
  openCareer,
  stepCareerWeek,
  mean,
  median,
  EXPENSE_CATS,
  INCOME_CATS,
  type Preset,
  type Policy,
} from './econ-bench'
import { runToEnding, FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, kidPoints, type WorldState } from '../src/engine/world'
import { rankingFor } from '../src/engine/world/ladder'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { CareerEndingType, WorldEventCategory } from '../src/shared/protocol'
import { seasonIndexOf } from '../src/engine/world/ledger'

/** The endings bench's own default is 20; its published §6 table is a 10-seed run (9 x 10 x 2 arms
 *  = the 180 it prints). We reproduce THAT, and the verify arm is what makes the claim checkable. */
export const SEEDS_PER_PRESET = 10
export const START_AGE_YEARS = 14
/** The first age at which any rung she can enter pays a cent: every W rung is `minAgeYears` 16+. */
export const PRO_AGE_YEARS = 16
/** Both retirement answers, exactly as the endings bench's slot-6 rows are built. */
export const RETIRE_ARMS = ['her-words', 'plays-on'] as const
export type RetireArm = (typeof RETIRE_ARMS)[number]

// --- per-career record ---------------------------------------------------------------------------

interface SeasonRow {
  /** 0-based 52-week block index; age = 14 + seasonIndex. */
  seasonIndex: number
  ageYears: number
  entriesByTier: Record<TierId, number>
  prizeByTier: Record<TierId, number>
  costByTier: Record<TierId, number>
  prizeCents: number
  /** every outflow booked in this season's weeks – the same universe careerTotals.spentCents sums. */
  spentCents: number
  /** every inflow booked in this season's weeks (prize + parent + sponsor + academy + interest). */
  earnedCents: number
  /** the best (lowest) professional rank she held at any week of this season. */
  bestWtaRank: number
}

export interface CareerMoney {
  seed: string
  preset: Preset
  retireArm: RetireArm
  ending: CareerEndingType | null
  endedWeek: number | null
  endedAge: number | null
  weeksPlayed: number
  seasons: SeasonRow[]

  prizeCents: number
  spentCents: number
  earnedCents: number

  /** the week the ledger first booked a `prize` line, and what the family had already spent by then */
  firstPrizeWeek: number | null
  spentAtFirstPrize: number | null
  /** career prize > career spend, ever. Expected null everywhere – that IS §6's headline. */
  cumulativeTurnWeek: number | null
  /** ALL income > all spend, ever. A different question, and the one the owner may be asking. */
  familyTurnWeek: number | null

  /** THE BEST PROFESSIONAL RANK THE CAREER EVER REACHED, on the merged W table – which since
   *  W2-FIELD2 carries the real points-to-rank curve, so this number IS a real-world rank.
   *
   *  ⚠ NULL UNTIL SHE HAS ACTUALLY PLAYED A PROFESSIONAL MAIN DRAW, and that guard is required
   *  rather than tidy. `kidRankWta` is defined for a fourteen-year-old who has never seen a W rung:
   *  she sits in the merged table on zero points, tied with every other pointless row, which reads
   *  as a rank in the mid-hundreds. Banded naively, a career that never played a W event at all
   *  lands in "#201-500" beside one that genuinely got there – so the bands would measure the
   *  tie-degenerate floor instead of an achievement. The signal used is her first cheque: every
   *  finish on a 32-draw W rung pays something (the smallest number in any table is w15's $130), so
   *  `prizeCents > 0` is exactly "she has completed a professional main draw". */
  peakWtaRank: number | null
  /** index into `seasons` of the season that best rank was set in. */
  peakSeasonIdx: number

  /** ⚠ THE FIRST WEEK SHE APPEARS ON THE PROFESSIONAL LIST AT ALL, and the number of professional
   *  main draws it cost her to get there (points-by-the-book-2026-08.md, correction 3).
   *
   *  It is `kidPoints(world, 'wta') > 0` and NOT `firstPrizeWeek`, because those two facts came
   *  apart the moment §VIII.A.2.b's minimum landed: every finish on a W rung pays a cheque, so
   *  `firstPrizeWeek` fires on her first completed main draw whatever it was worth, while a RANKING
   *  now needs points in three tournaments or ten points in one. The gap between the two is
   *  precisely what the correction added, so both are recorded and §7 prints them side by side.
   *
   *  The calibration target is `docs/research/real-ladder-pace.md` §6: a real woman's age at her
   *  first professional ranking point is **15.9-16.2**, from two independent cohort studies. */
  firstRankedWeek: number | null
  /** W main draws entered on or before `firstRankedWeek` – "how many events does a first ranking
   *  cost?". Counted off the same `entriesByTier` bookkeeping the rest of the file uses. */
  wDrawsAtFirstRanking: number

  /** ⚠ THE ANTI-GIFT READOUT, taken once at the last week she lived (points-by-the-book §0's own
   *  ship rule, and the failure mode the brief names: "measuring only her rank is how you fail to
   *  notice that everyone floated up"). Re-pricing the two entry rungs lifts every EARNED book in
   *  the world, not only hers – the 520 derived professionals are ISSUED their books by
   *  `fieldPros.ts` and cannot move, but the ~200 LIVE girls earn theirs on the same table she
   *  does. So: how many of them hold a ranking at all, and how many of them are inside the merged
   *  top 200 beside her. If her rank improves and these two move with it, the table deflated; if
   *  hers improves and these hold, she climbed. */
  liveRankedAtEnd: number
  liveTop200AtEnd: number

  /** whole-career spend and income by category, split at the age the tennis can first pay. */
  catsJunior: Record<WorldEventCategory, number>
  catsPro: Record<WorldEventCategory, number>

  entriesByTier: Record<TierId, number>
  prizeByTier: Record<TierId, number>
  /** HOW HER TOURNAMENTS ENDED, per rung, as a histogram over the finish index (0 = champion,
   *  `log2(drawSize)` = lost the opener). Added for `docs/specs/ladder-pace-2026-08.md`, whose
   *  calibration target is the owner's own complaint - "losing in the first or second match VERY
   *  often is very galling". A 32-draw exits 16 of its 32 players in round one and 8 more in round two, so
   *  75% of any field is out by the second match BY ARITHMETIC – the question is only whether OUR
   *  rate is worse than that floor, and that cannot be answered without measuring it.
   *
   *  ⚠ READ OFF THE DIARY, NOT OFF `world.results`, and that is required rather than stylistic. The
   *  kid's ranking row is AWARD-ONLY (`world.ts`: `if (points > 0) world.results.push(...)`), so at
   *  every rung whose table pays a first-round loser nothing – w15, w35, w100 – her R1 exits write
   *  no result row at all and a results-based count would silently measure only the rounds she
   *  survived. `closeTournament` is the sole writer of a `tournament` diary event and it stamps
   *  `finishIdx` on every one, win or lose. */
  finishByTier: Record<TierId, number[]>
  /** ⚠ THE PER-RUNG BILL, AND BOTH HALVES ARE EXACT RATHER THAN APPORTIONED. `entryFeeCents` is a
   *  flat per-tier constant charged by `enterEvent` at commit, so entries x fee is the fee to the
   *  cent. Travel is charged by `chargeTravel` in the EVENT'S OWN week, and the engine allows one
   *  event per week (`enterEvent` throws on a second), so the whole of a week's `travel` line
   *  belongs to the single rung she played that week. Nothing here is split pro-rata. */
  costByTier: Record<TierId, number>
}

function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}
/** The professional rungs, in ladder order – the ones a first RANKING can be earned on. */
const W_RUNGS: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
/** One bucket per finish index a rung's draw can produce, `log2(drawSize) + 1` of them. */
function zeroFinishByTier(): Record<TierId, number[]> {
  return Object.fromEntries(
    TIER_LADDER.map((t) => [t, new Array<number>(Math.round(Math.log2(TIERS[t].drawSize)) + 1).fill(0)]),
  ) as Record<TierId, number[]>
}
function zeroCats(): Record<WorldEventCategory, number> {
  const out = {} as Record<WorldEventCategory, number>
  for (const c of [...EXPENSE_CATS, ...INCOME_CATS]) out[c] = 0
  return out
}

/** ⚠ MIRRORS `answerWhateverIsOpen` + `answersRetirement` IN endings-bench.ts, which are private to
 *  that file. The duplication is deliberate and it is CHECKED rather than trusted: the `--verify`
 *  arm re-runs `runToEnding` over the same cells and compares the ending, the ended week and both
 *  money totals. A drift here shows up there as a mismatch count, not as a quietly different game.
 *  The college branch is absent because this arm always answers the fork "continue". */
function answerOpenQuestions(world: WorldState, retireArm: RetireArm): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    const { reason, final } = world.retirementOffer
    answerRetirement(world, final ? true : retireArm === 'her-words' && reason === 'plateau')
  }
}

/** Fold whatever is NEW in the pruned finance ledger into a sink, week by week.
 *
 *  ⚠ IT DIFFS PER CATEGORY RATHER THAN MARKING A WEEK "SEEN", because a week's row keeps growing
 *  after we first look at it: an entry fee is charged the week she COMMITS, prize money lands the
 *  week the draw resolves, and the coach bills in between. econ-bench's A4 watch can use a seen-set
 *  because it only asks "did a prize line appear"; a category decomposition cannot, and a seen-set
 *  here would silently drop every line booked after the first one in its week. */
function foldLedger(
  world: WorldState,
  seen: Map<number, Partial<Record<WorldEventCategory, number>>>,
  sink: (week: number, cat: WorldEventCategory, amountCents: number) => void,
): void {
  for (const fw of world.financeWeeks) {
    let row = seen.get(fw.week)
    if (!row) {
      row = {}
      seen.set(fw.week, row)
    }
    for (const [cat, amt] of Object.entries(fw.byCategory) as [WorldEventCategory, number][]) {
      const prev = row[cat] ?? 0
      if (amt !== prev) {
        sink(fw.week, cat, amt - prev)
        row[cat] = amt
      }
    }
  }
}

/** Play one career fourteen-to-the-floor and take it apart. Same opening, same policy, same weekly
 *  step and the same answers as `runToEnding`, plus the instrumentation §1-§7 need. */
export function decomposeCareer(preset: Preset, index: number, retireArm: RetireArm, policy: Policy = POLICIES[0]): CareerMoney {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const out: CareerMoney = {
    seed,
    preset,
    retireArm,
    ending: null,
    endedWeek: null,
    endedAge: null,
    weeksPlayed: 0,
    seasons: [],
    prizeCents: 0,
    spentCents: 0,
    earnedCents: 0,
    firstPrizeWeek: null,
    spentAtFirstPrize: null,
    cumulativeTurnWeek: null,
    familyTurnWeek: null,
    peakWtaRank: null,
    peakSeasonIdx: 0,
    firstRankedWeek: null,
    wDrawsAtFirstRanking: 0,
    liveRankedAtEnd: 0,
    liveTop200AtEnd: 0,
    catsJunior: zeroCats(),
    catsPro: zeroCats(),
    entriesByTier: zeroByTier(),
    prizeByTier: zeroByTier(),
    finishByTier: zeroFinishByTier(),
    costByTier: zeroByTier(),
  }

  const seasons = new Map<number, SeasonRow>()
  const seasonOf = (week: number): SeasonRow => {
    const idx = seasonIndexOf(week)
    let row = seasons.get(idx)
    if (!row) {
      row = {
        seasonIndex: idx,
        ageYears: START_AGE_YEARS + idx,
        entriesByTier: zeroByTier(),
        prizeByTier: zeroByTier(),
        costByTier: zeroByTier(),
        prizeCents: 0,
        spentCents: 0,
        earnedCents: 0,
        bestWtaRank: Number.MAX_SAFE_INTEGER,
      }
      seasons.set(idx, row)
    }
    return row
  }

  // WHICH RUNG PAID: the entry ledger, keyed by the week the draw is played on. `world.entries`
  // holds ids and `finalizeTournament` credits the cheque in the event's own week, so a prize delta
  // in week W belongs to whatever she was entered in for week W. One event a week is the engine's
  // own rule (`enterEvent` enforces it), so the mapping is unambiguous.
  const everEntered = new Set<string>()
  const tierPlayedOn = new Map<number, TierId>()
  const ledgerSeen = new Map<number, Partial<Record<WorldEventCategory, number>>>()

  for (let i = 0; i < FULL_CAREER_WEEKS && world.ending === null; i++) {
    const beforePrize = world.careerTotals.prizeCents
    stepCareerWeek(world, rng, policy)
    out.weeksPlayed = i + 1

    // new bookings -> the rung, the week it will be played on, and the entry fee it just cost
    for (const id of world.entries) {
      if (everEntered.has(id)) continue
      everEntered.add(id)
      const ev = world.season.find((e) => e.id === id)
      if (!ev) continue
      tierPlayedOn.set(ev.week, ev.tier)
      out.entriesByTier[ev.tier] += 1
      out.costByTier[ev.tier] += TIERS[ev.tier].entryFeeCents
      const evSeason = seasonOf(ev.week)
      evSeason.entriesByTier[ev.tier] += 1
      evSeason.costByTier[ev.tier] += TIERS[ev.tier].entryFeeCents
    }

    // the cheque, attributed to the rung that wrote it
    const prizeDelta = world.careerTotals.prizeCents - beforePrize
    if (prizeDelta > 0) {
      const tier = tierPlayedOn.get(world.week)
      if (tier) {
        out.prizeByTier[tier] += prizeDelta
        seasonOf(world.week).prizeByTier[tier] += prizeDelta
      }
      if (out.firstPrizeWeek === null) {
        out.firstPrizeWeek = world.week
        out.spentAtFirstPrize = world.careerTotals.spentCents
      }
    }

    // HOW THIS WEEK'S TOURNAMENT ENDED – the finish histogram behind §8's exit-rate table.
    // `closeTournament` is the only writer of a `tournament` diary event and stamps `finishIdx` on
    // every one, so this is her win-loss record read at its source. The rung comes from
    // `tierPlayedOn`, the same one-event-a-week mapping the cheque above is attributed through.
    for (const e of world.events) {
      if (e.week !== world.week || e.type !== 'tournament' || typeof e.finishIdx !== 'number') continue
      const tier = tierPlayedOn.get(world.week)
      if (!tier) continue
      const hist = out.finishByTier[tier]
      if (e.finishIdx >= 0 && e.finishIdx < hist.length) hist[e.finishIdx] += 1
    }

    // the category decomposition, off the ledger's own rows so a line lands in the week it moved
    foldLedger(world, ledgerSeen, (week, cat, amount) => {
      const bucket = START_AGE_YEARS + Math.floor(week / WEEKS_PER_YEAR) < PRO_AGE_YEARS ? out.catsJunior : out.catsPro
      bucket[cat] += Math.abs(amount)
      const row = seasonOf(week)
      if (amount < 0) row.spentCents += -amount
      else row.earnedCents += amount
      if (cat === 'prize') row.prizeCents += amount
      // the trip, billed to the one rung she played that week (see costByTier)
      if (cat === 'travel' && amount < 0) {
        const tier = tierPlayedOn.get(week)
        if (tier) {
          out.costByTier[tier] += -amount
          row.costByTier[tier] += -amount
        }
      }
    })

    // THE FIRST RANKING – see `firstRankedWeek`. Read through the engine's own `kidPoints`, so
    // whatever the ranking rules say this week is what this number means; nothing is re-spelled.
    if (out.firstRankedWeek === null && kidPoints(world, 'wta') > 0) {
      out.firstRankedWeek = world.week
      out.wDrawsAtFirstRanking = W_RUNGS.reduce((s, t) => s + out.entriesByTier[t], 0)
    }

    // her place in the professional table, tracked only once she has been paid at all – see peakWtaRank
    const row = seasonOf(world.week)
    if (world.careerTotals.prizeCents > 0) {
      const wta = world.kidRankWta ?? world.cohort.length + 1
      if (wta < row.bestWtaRank) row.bestWtaRank = wta
      if (out.peakWtaRank === null || wta < out.peakWtaRank) {
        out.peakWtaRank = wta
        out.peakSeasonIdx = row.seasonIndex
      }
    }

    if (out.cumulativeTurnWeek === null && world.careerTotals.prizeCents > world.careerTotals.spentCents) {
      out.cumulativeTurnWeek = world.week
    }
    if (out.familyTurnWeek === null && world.careerTotals.earnedCents > world.careerTotals.spentCents) {
      out.familyTurnWeek = world.week
    }

    answerOpenQuestions(world, retireArm)
  }

  // THE ANTI-GIFT READOUT – see `liveRankedAtEnd`. Taken once, at the last week she lived, because
  // it is O(cohort x results) and nothing about it needs a week-by-week series.
  {
    const merged = rankingFor(world, 'wta')
    const liveIds = new Set(world.cohort.map((p) => p.id))
    for (const r of merged) {
      if (!liveIds.has(r.playerId)) continue
      if (r.points > 0) out.liveRankedAtEnd++
      if (r.points > 0 && r.rank <= 200) out.liveTop200AtEnd++
    }
  }

  out.prizeCents = world.careerTotals.prizeCents
  out.spentCents = world.careerTotals.spentCents
  out.earnedCents = world.careerTotals.earnedCents
  out.seasons = [...seasons.values()].sort((a, b) => a.seasonIndex - b.seasonIndex)
  if (world.ending) {
    out.ending = world.ending.type
    out.endedWeek = world.ending.week
    out.endedAge = world.ending.ageYears
  }
  return out
}

// --- the population ------------------------------------------------------------------------------

export function runPopulation(seeds: number, presets: Preset[] = PRESETS, policy: Policy = POLICIES[0]): CareerMoney[] {
  const rows: CareerMoney[] = []
  for (const arm of RETIRE_ARMS) {
    for (const preset of presets) {
      for (let i = 0; i < seeds; i++) rows.push(decomposeCareer(preset, i, arm, policy))
    }
  }
  return rows
}

/** THE PROOF THAT THIS IS THE SAME GAME. Re-runs the endings bench's own `runToEnding` over every
 *  cell and compares the four facts that would move if the loops had drifted. */
export function verifyAgainstEndingsBench(rows: CareerMoney[], seeds: number, presets: Preset[]): { checked: number; mismatched: string[] } {
  const mismatched: string[] = []
  let checked = 0
  let k = 0
  for (const arm of RETIRE_ARMS) {
    for (const preset of presets) {
      for (let i = 0; i < seeds; i++) {
        const mine = rows[k++]
        const theirs = runToEnding(preset, i, 'continue', POLICIES[0], true, FULL_CAREER_WEEKS, arm)
        checked += 1
        if (
          mine.ending !== theirs.ending ||
          mine.endedWeek !== theirs.endedWeek ||
          mine.prizeCents !== theirs.prizeCents ||
          mine.spentCents !== theirs.spentCents
        ) {
          mismatched.push(
            `${mine.seed}/${arm}: mine ${mine.ending}@${mine.endedWeek} $${mine.prizeCents}/${mine.spentCents} ` +
              `vs theirs ${theirs.ending}@${theirs.endedWeek} $${theirs.prizeCents}/${theirs.spentCents}`,
          )
        }
      }
    }
  }
  return { checked, mismatched }
}

// --- printing ------------------------------------------------------------------------------------

function usd(cents: number): string {
  const d = Math.round(cents / 100)
  return `${d < 0 ? '-' : ''}$${Math.abs(d).toLocaleString('en-US')}`
}
function pad(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s
}
function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}
function ratio(num: number, den: number): string {
  return den === 0 ? '   –  ' : `${((100 * num) / den).toFixed(1)}%`
}
function ageOfWeek(week: number): number {
  return START_AGE_YEARS + Math.floor(week / WEEKS_PER_YEAR)
}
/** ...and the same thing to a decimal, because the calibration target for the first ranking is
 *  15.9-16.2 (real-ladder-pace.md §6) and a whole-year age cannot be compared against it. */
function exactAgeOfWeek(week: number): number {
  return START_AGE_YEARS + week / WEEKS_PER_YEAR
}

const BANDS: { label: string; lo: number; hi: number }[] = [
  { label: '#1-20', lo: 1, hi: 20 },
  { label: '#21-50', lo: 21, hi: 50 },
  { label: '#51-100', lo: 51, hi: 100 },
  { label: '#101-200', lo: 101, hi: 200 },
  { label: '#201-500', lo: 201, hi: 500 },
  { label: '#501+', lo: 501, hi: Number.MAX_SAFE_INTEGER },
]

const ENDING_ORDER: (CareerEndingType | null)[] = ['bankruptcy', 'stopped', 'college', 'injury', 'natural', 'plateau', null]

export function main(argv = process.argv.slice(2)): void {
  const seedsArg = argv.indexOf('--seeds')
  const seeds = seedsArg >= 0 ? Number(argv[seedsArg + 1]) : SEEDS_PER_PRESET
  const presetsArg = argv.indexOf('--presets')
  const presets = presetsArg >= 0 ? PRESETS.slice(0, Number(argv[presetsArg + 1])) : PRESETS
  // ⚠ THE SECOND ARM IS A LEVER, NOT A SECOND MEASUREMENT OF THE SAME THING. The published 180 are
  // the GRINDER, and docs/specs/rank-plateau.md §5 is the reason that matters here: a grinder plays
  // every week she can afford at mean condition 24.4 and takes the court at 0.71 of herself, and one
  // rule – do not enter below condition 70 – was measured as worth about fifty ranking places. Since
  // access to every paying rung above w100 is an ACCEPTANCE-RANK gate, fifty places is a money
  // question and not only a pride one. `--policy player` re-plays the identical seeds under
  // POLICIES[1] so the size of that lever is measured rather than argued.
  const policyArg = argv.indexOf('--policy')
  const policy = policyArg >= 0 ? (POLICIES.find((p) => p.id === argv[policyArg + 1]) ?? POLICIES[0]) : POLICIES[0]
  // `runToEnding` hard-codes POLICIES[0], so the cross-check is only meaningful on the grinder arm.
  const verify = !argv.includes('--no-verify') && policy === POLICIES[0]

  const t0 = Date.now()
  const rows = runPopulation(seeds, presets, policy)

  console.log('')
  console.log('THE MONEY DECOMPOSITION – why prize/spend is 8% when the table tops out at $3,000,000')
  console.log(
    `  ${presets.length} presets x ${seeds} seeds x ${RETIRE_ARMS.length} retirement arms = ${rows.length} careers ` +
      `· ${policy.label} policy · fork answered "continue" · fourteen to 38 (${FULL_CAREER_WEEKS} weeks max)`,
  )
  if (policy !== POLICIES[0]) {
    console.log(
      `  ⚠ THIS IS THE LEVER ARM, not the published population: reserve ${usd(policy.reserveCents)}, ` +
        `refuses to enter below condition ${policy.restFloor}, coach travels to events. Compare against the grinder run.`,
    )
  }
  console.log('')

  if (verify) {
    const v = verifyAgainstEndingsBench(rows, seeds, presets)
    console.log(
      `  CROSS-CHECK vs tools/endings-bench.ts runToEnding: ${v.checked - v.mismatched.length}/${v.checked} careers identical ` +
        `on (ending, ended week, prize, spend)`,
    )
    for (const m of v.mismatched.slice(0, 8)) console.log(`    MISMATCH ${m}`)
    console.log('')
  }

  const headline = rows.map((r) => (r.spentCents > 0 ? r.prizeCents / r.spentCents : 0))
  console.log(
    `  HEADLINE (the number being explained): prize/spend median ${(median(headline) * 100).toFixed(1)}% · ` +
      `mean ${(mean(headline) * 100).toFixed(1)}% · best ${(Math.max(...headline) * 100).toFixed(1)}%`,
  )
  console.log(
    `  cumulative crossing ${rows.filter((r) => r.cumulativeTurnWeek !== null).length}/${rows.length} · ` +
      `ever paid a cheque ${rows.filter((r) => r.prizeCents > 0).length}/${rows.length}`,
  )
  console.log('')

  // --- §1 THE NUMERATOR'S START -------------------------------------------------------------------
  console.log('  ══ 1. THE NUMERATOR STARTS LATE – what is already spent before the tennis can pay ══')
  console.log('')
  const paid = rows.filter((r) => r.firstPrizeWeek !== null)
  const never = rows.length - paid.length
  const firstWeeks = paid.map((r) => r.firstPrizeWeek!)
  const sunkShare = paid.map((r) => (r.spentCents > 0 ? r.spentAtFirstPrize! / r.spentCents : 0))
  console.log(`  careers ever paid a cheque      : ${paid.length}/${rows.length} (${never} never were, and their numerator is zero)`)
  console.log(
    `  first cheque                    : median week ${median(firstWeeks).toFixed(0)} (age ${ageOfWeek(median(firstWeeks))}) · ` +
      `earliest week ${Math.min(...firstWeeks)} (age ${ageOfWeek(Math.min(...firstWeeks))}) · latest week ${Math.max(...firstWeeks)} (age ${ageOfWeek(Math.max(...firstWeeks))})`,
  )
  console.log(
    `  spend already booked by then    : median ${usd(median(paid.map((r) => r.spentAtFirstPrize!)))} · mean ${usd(mean(paid.map((r) => r.spentAtFirstPrize!)))}`,
  )
  console.log(
    `  = share of the WHOLE-CAREER denominator spent before the first cheque: median ${(median(sunkShare) * 100).toFixed(1)}% · mean ${(mean(sunkShare) * 100).toFixed(1)}%`,
  )
  const juniorSpend = rows.map((r) => EXPENSE_CATS.reduce((s, c) => s + r.catsJunior[c], 0))
  console.log(
    `  spend at ages 14-15 alone (no rung she can enter pays a cent): median ${usd(median(juniorSpend))} = ` +
      `${(median(rows.map((r) => (r.spentCents > 0 ? EXPENSE_CATS.reduce((s, c) => s + r.catsJunior[c], 0) / r.spentCents : 0))) * 100).toFixed(1)}% of the denominator`,
  )
  console.log('')

  // --- §1b THE DENOMINATOR IS A FAMILY CHOICE -----------------------------------------------------
  //
  // ⚠ THE CHEQUE DOES NOT SCALE WITH THE WEALTH CORRIDOR AND EVERY BILL DOES. `finalizeTournament`
  // says so in as many words – "a working family and a wealthy one are handed the identical piece of
  // paper" – while coaching, travel and physio are all multiplied by the background. So the SAME
  // tennis produces the same numerator against nine different denominators, and the population
  // median is partly a statement about which preset sits in the middle of the bench.
  console.log('  ══ 1b. THE SAME TENNIS, NINE DENOMINATORS – prize does not scale with wealth, every bill does ══')
  console.log('')
  console.log('  ' + padEnd('preset', 30) + pad('n', 4) + pad('prize', 12) + pad('spend', 13) + pad('ratio', 8) + pad('coaching', 13) + pad('peak WTA', 10))
  for (const preset of presets) {
    const sub = rows.filter((r) => r.preset === preset)
    if (!sub.length) continue
    const peaks = sub.filter((r) => r.peakWtaRank !== null).map((r) => r.peakWtaRank!)
    console.log(
      '  ' +
        padEnd(preset.label.trim(), 30) +
        pad(String(sub.length), 4) +
        pad(usd(median(sub.map((r) => r.prizeCents))), 12) +
        pad(usd(median(sub.map((r) => r.spentCents))), 13) +
        pad(ratio(median(sub.map((r) => r.prizeCents)), median(sub.map((r) => r.spentCents))), 8) +
        // ⚠ COACHING IS TWO CATEGORIES SINCE v44 (docs/specs/split-the-bill-2026-08.md) - the coach's
        // labour and the court's hire. The column's claim is about the largest BILL in the game, so
        // it sums both and stays comparable with every figure this file has published.
        pad(
          usd(
            median(
              sub.map(
                (r) => r.catsJunior.coaching + r.catsPro.coaching + r.catsJunior.facility + r.catsPro.facility,
              ),
            ),
          ),
          13,
        ) +
        pad(peaks.length ? `#${median(peaks).toFixed(0)}` : 'never', 10),
    )
  }
  console.log('  (medians within the preset; ratio is median prize / median spend)')
  console.log('')

  // --- §2 BY ENDING TYPE --------------------------------------------------------------------------
  console.log('  ══ 2. BY ENDING – the 8% mixes a career that stopped at 17 with one that played to 38 ══')
  console.log('')
  console.log(
    '  ' +
      padEnd('ending', 13) +
      pad('n', 5) +
      pad('prize', 13) +
      pad('spend', 13) +
      pad('ratio', 8) +
      pad('peak WTA', 10) +
      pad('seasons', 9) +
      pad('end age', 9),
  )
  for (const type of ENDING_ORDER) {
    const sub = rows.filter((r) => r.ending === type)
    if (sub.length === 0) continue
    const ends = sub.filter((r) => r.endedAge !== null).map((r) => r.endedAge!)
    const peaks = sub.filter((r) => r.peakWtaRank !== null).map((r) => r.peakWtaRank!)
    console.log(
      '  ' +
        padEnd(type ?? '(no ending)', 13) +
        pad(String(sub.length), 5) +
        pad(usd(median(sub.map((r) => r.prizeCents))), 13) +
        pad(usd(median(sub.map((r) => r.spentCents))), 13) +
        pad(ratio(median(sub.map((r) => r.prizeCents)), median(sub.map((r) => r.spentCents))), 8) +
        pad(peaks.length ? `#${median(peaks).toFixed(0)}` : 'never', 10) +
        pad(median(sub.map((r) => r.seasons.length)).toFixed(0), 9) +
        pad(ends.length ? median(ends).toFixed(0) : '–', 9),
    )
  }
  console.log('  (every cell is a MEDIAN over that group; ratio is median prize / median spend)')
  console.log('')

  // --- §3 BY PEAK RANK BAND -----------------------------------------------------------------------
  console.log('  ══ 3. BY PEAK RANK – does a career peaking near real #45 run a cash-positive TENNIS year? ══')
  console.log('')
  console.log(
    '  ' +
      padEnd('peak band', 11) +
      pad('n', 5) +
      pad('career ratio', 14) +
      pad('PEAK-SEASON', 14) +
      pad('prize', 13) +
      pad('spend', 13) +
      pad('ratio', 8) +
      pad('+ve yrs', 9),
  )
  const banded: { label: string; sub: CareerMoney[] }[] = [
    ...BANDS.map((b) => ({ label: b.label, sub: rows.filter((r) => r.peakWtaRank !== null && r.peakWtaRank >= b.lo && r.peakWtaRank <= b.hi) })),
    { label: 'never W', sub: rows.filter((r) => r.peakWtaRank === null) },
  ]
  for (const { label: bandLabel, sub } of banded) {
    if (sub.length === 0) {
      console.log('  ' + padEnd(bandLabel, 11) + pad('0', 5) + '   – nobody reaches this band')
      continue
    }
    const peakSeasons = sub.map((r) => r.seasons.find((s) => s.seasonIndex === r.peakSeasonIdx)!).filter(Boolean)
    const pPrize = median(peakSeasons.map((s) => s.prizeCents))
    const pSpend = median(peakSeasons.map((s) => s.spentCents))
    // how many SEASONS anywhere in the population's careers were prize-positive on their own
    const posYears = sub.reduce((n, r) => n + r.seasons.filter((s) => s.prizeCents > s.spentCents).length, 0)
    const allYears = sub.reduce((n, r) => n + r.seasons.length, 0)
    console.log(
      '  ' +
        padEnd(bandLabel, 11) +
        pad(String(sub.length), 5) +
        pad(ratio(median(sub.map((r) => r.prizeCents)), median(sub.map((r) => r.spentCents))), 14) +
        pad(`age ${median(peakSeasons.map((s) => s.ageYears)).toFixed(0)}`, 14) +
        pad(usd(pPrize), 13) +
        pad(usd(pSpend), 13) +
        pad(ratio(pPrize, pSpend), 8) +
        pad(`${posYears}/${allYears}`, 9),
    )
  }
  console.log('  PEAK-SEASON = the 52-week block in which her best professional rank was set.')
  console.log('  "+ve yrs" = seasons anywhere in those careers whose PRIZE alone beat that season\'s whole spend.')
  console.log('  "never W" = never completed a professional main draw, so she never held a W ranking at all.')
  const bestSeasons = rows.flatMap((r) => r.seasons).filter((s) => s.prizeCents > s.spentCents)
  console.log(
    `  ACROSS THE WHOLE POPULATION: ${bestSeasons.length} of ${rows.reduce((n, r) => n + r.seasons.length, 0)} career-seasons had prize > that season's spend.`,
  )
  console.log('')

  // --- §4 WHERE THE MONEY IS NOT ------------------------------------------------------------------
  console.log('  ══ 4. WHERE THE MONEY IS NOT – which rungs she actually enters, and what they pay ══')
  console.log('')
  console.log(
    '  ' +
      padEnd('rung', 9) +
      pad('winner', 12) +
      pad('R1 loss', 10) +
      pad('entries', 9) +
      pad('careers ever', 14) +
      pad('at peak', 9) +
      pad('prize', 12) +
      pad('% of all', 10) +
      pad('entry+travel', 14) +
      pad('NET', 12),
  )
  const totalPrize = rows.reduce((s, r) => s + r.prizeCents, 0)
  let payingEntries = 0
  let deadEntries = 0
  let deadCost = 0
  for (const tier of TIER_LADDER) {
    const def = TIERS[tier]
    const entered = rows.filter((r) => r.entriesByTier[tier] > 0).length
    const allEntries = rows.reduce((s, r) => s + r.entriesByTier[tier], 0)
    const peakEntries = rows.reduce((s, r) => s + (r.seasons.find((x) => x.seasonIndex === r.peakSeasonIdx)?.entriesByTier[tier] ?? 0), 0)
    const prize = rows.reduce((s, r) => s + r.prizeByTier[tier], 0)
    const cost = rows.reduce((s, r) => s + r.costByTier[tier], 0)
    if (def.prizeCents) payingEntries += allEntries
    else {
      deadEntries += allEntries
      deadCost += cost
    }
    console.log(
      '  ' +
        padEnd(tier, 9) +
        pad(def.prizeCents ? usd(def.prizeCents[0]) : '–', 12) +
        pad(def.prizeCents ? usd(def.prizeCents[5]) : '–', 10) +
        pad((allEntries / rows.length).toFixed(1), 9) +
        pad(`${entered}/${rows.length}`, 14) +
        pad((peakEntries / rows.length).toFixed(1), 9) +
        pad(usd(prize / rows.length), 12) +
        pad(ratio(prize, totalPrize), 10) +
        pad(usd(cost / rows.length), 14) +
        pad(usd((prize - cost) / rows.length), 12),
    )
  }
  console.log('  entries / at peak / prize / entry+travel / NET are all PER CAREER means. "at peak" = the peak season alone.')
  console.log(
    `  RUNGS THAT PAY NOTHING AT ALL (no prizeCents table): ${(deadEntries / rows.length).toFixed(1)} entries per career of ` +
      `${((deadEntries + payingEntries) / rows.length).toFixed(1)} = ${ratio(deadEntries, deadEntries + payingEntries)} of every entry she ever makes, ` +
      `costing ${usd(deadCost / rows.length)} in entry fees and trips.`,
  )
  console.log('')

  // --- §5 SPEND BY CATEGORY -----------------------------------------------------------------------
  console.log('  ══ 5. WHAT EATS IT – spend by category, junior years and pro years apart ══')
  console.log('')
  console.log(
    '  ' +
      padEnd('category', 12) +
      pad('14-15 (junior)', 16) +
      pad('share', 9) +
      pad('16+ (pro-age)', 16) +
      pad('share', 9) +
      pad('whole career', 15) +
      pad('share', 9),
  )
  const jTot = mean(rows.map((r) => EXPENSE_CATS.reduce((s, c) => s + r.catsJunior[c], 0)))
  const pTot = mean(rows.map((r) => EXPENSE_CATS.reduce((s, c) => s + r.catsPro[c], 0)))
  for (const cat of EXPENSE_CATS) {
    const j = mean(rows.map((r) => r.catsJunior[cat]))
    const p = mean(rows.map((r) => r.catsPro[cat]))
    if (j === 0 && p === 0) continue
    console.log(
      '  ' +
        padEnd(cat, 12) +
        pad(usd(j), 16) +
        pad(ratio(j, jTot), 9) +
        pad(usd(p), 16) +
        pad(ratio(p, pTot), 9) +
        pad(usd(j + p), 15) +
        pad(ratio(j + p, jTot + pTot), 9),
    )
  }
  console.log(
    '  ' + padEnd('TOTAL', 12) + pad(usd(jTot), 16) + pad(ratio(jTot, jTot + pTot), 9) + pad(usd(pTot), 16) + pad(ratio(pTot, jTot + pTot), 9) + pad(usd(jTot + pTot), 15),
  )
  console.log('  (means over the whole population, in the week the money actually moved)')
  console.log('')

  // --- §6 THE OTHER RATIO -------------------------------------------------------------------------
  console.log('  ══ 6. THE OTHER RATIO – ALL income vs all spend, which is the FAMILY\'s question ══')
  console.log('')
  console.log(
    '  ' + padEnd('income line', 14) + pad('junior 14-15', 16) + pad('pro-age 16+', 16) + pad('whole career', 16) + pad('share', 9),
  )
  const incTotal = mean(rows.map((r) => INCOME_CATS.reduce((s, c) => s + r.catsJunior[c] + r.catsPro[c], 0)))
  for (const cat of INCOME_CATS) {
    const j = mean(rows.map((r) => r.catsJunior[cat]))
    const p = mean(rows.map((r) => r.catsPro[cat]))
    console.log('  ' + padEnd(cat, 14) + pad(usd(j), 16) + pad(usd(p), 16) + pad(usd(j + p), 16) + pad(ratio(j + p, incTotal), 9))
  }
  console.log('  ' + padEnd('TOTAL INCOME', 14) + pad('', 16) + pad('', 16) + pad(usd(incTotal), 16))
  console.log('')
  const famRatios = rows.map((r) => (r.spentCents > 0 ? r.earnedCents / r.spentCents : 0))
  console.log(
    `  income/spend over the career    : median ${(median(famRatios) * 100).toFixed(1)}% · mean ${(mean(famRatios) * 100).toFixed(1)}% · best ${(Math.max(...famRatios) * 100).toFixed(1)}%`,
  )
  const famTurn = rows.filter((r) => r.familyTurnWeek !== null)
  const famEnd = rows.filter((r) => r.earnedCents > r.spentCents)
  console.log(
    `  family EVER cumulatively ahead  : ${famTurn.length}/${rows.length} = ${((100 * famTurn.length) / rows.length).toFixed(1)}%` +
      (famTurn.length ? ` · median week ${median(famTurn.map((r) => r.familyTurnWeek!)).toFixed(0)} (age ${ageOfWeek(median(famTurn.map((r) => r.familyTurnWeek!)))})` : ''),
  )
  console.log(
    `  family ahead AT THE END         : ${famEnd.length}/${rows.length} = ${((100 * famEnd.length) / rows.length).toFixed(1)}%` +
      `  (net over the whole career: median ${usd(median(rows.map((r) => r.earnedCents - r.spentCents)))})`,
  )
  console.log('  ⚠ the "ever" row fires in week 1 for most careers – a parent wage arrives before the first bill,')
  console.log('    so it is the END row and the ratio above it that carry the meaning.')
  console.log(
    `  vs the TENNIS crossing (slot 6) : ${rows.filter((r) => r.cumulativeTurnWeek !== null).length}/${rows.length} = ` +
      `${((100 * rows.filter((r) => r.cumulativeTurnWeek !== null).length) / rows.length).toFixed(1)}%`,
  )
  console.log('')

  // --- §7 THE REAL-WORLD CHECK --------------------------------------------------------------------
  console.log('  ══ 7. THE #45 CHECK – what our model pays a season at real-equivalent #45 ══')
  console.log('')
  const near45 = rows.filter((r) => r.peakWtaRank !== null && r.peakWtaRank >= 30 && r.peakWtaRank <= 60)
  console.log(`  careers whose PEAK professional rank landed in #30-60: ${near45.length}/${rows.length}`)
  if (near45.length) {
    const ps = near45.map((r) => r.seasons.find((s) => s.seasonIndex === r.peakSeasonIdx)!).filter(Boolean)
    console.log(
      `  their peak season             : prize median ${usd(median(ps.map((s) => s.prizeCents)))} · ` +
        `best ${usd(Math.max(...ps.map((s) => s.prizeCents)))} · spend median ${usd(median(ps.map((s) => s.spentCents)))}`,
    )
    const entered = zeroByTier()
    for (const s of ps) for (const t of TIER_LADDER) entered[t] += s.entriesByTier[t]
    console.log(
      '  their peak season entries     : ' +
        TIER_LADDER.filter((t) => entered[t] > 0)
          .map((t) => `${t} ${(entered[t] / ps.length).toFixed(1)}`)
          .join(' · '),
    )
  }
  const ranked = rows.filter((r) => r.peakWtaRank !== null).sort((a, b) => a.peakWtaRank! - b.peakWtaRank!)
  const bestSeasonPrize = Math.max(...rows.flatMap((r) => r.seasons.map((s) => s.prizeCents)))
  if (ranked.length) {
    console.log(`  best peak rank anywhere       : #${ranked[0].peakWtaRank} (${ranked[0].seed}, ${ranked[0].retireArm})`)
    console.log(
      `  peak-rank distribution        : best #${ranked[0].peakWtaRank} · p10 #${median(ranked.slice(0, Math.max(1, Math.round(ranked.length / 5))).map((r) => r.peakWtaRank!)).toFixed(0)} · ` +
        `median #${median(ranked.map((r) => r.peakWtaRank!)).toFixed(0)} · worst #${ranked[ranked.length - 1].peakWtaRank}`,
    )
    // ⚠ THE DISTRIBUTION, NOT JUST THE BEST (points-economy-2026-08.md measurement 6). The owner's
    // framing of the whole question is "a CHANCE at the top", so a single best-of-180 cannot answer
    // it: one career at #90 and a conveyor delivering ninety of them are the same headline and
    // opposite games. Counted over the careers that ever held a professional rank at all.
    const reach = (n: number) => ranked.filter((r) => r.peakWtaRank! <= n).length
    console.log(
      `  careers reaching the top      : #10 ${reach(10)}/${rows.length} · #50 ${reach(50)}/${rows.length} · ` +
        `#100 ${reach(100)}/${rows.length} · #200 ${reach(200)}/${rows.length} · ` +
        `ever ranked ${ranked.length}/${rows.length}`,
    )
  }
  // --- §7b THE FIRST RANKING, AND WHO ELSE MOVED WITH HER -----------------------------------------
  //
  // Added by points-by-the-book (05.08). Two questions the file could not answer and the wave is
  // graded on: WHEN does a professional ranking arrive and what does it cost in draws (§VIII.A.2.b
  // changed both), and DID EVERYONE FLOAT UP (the gift failure re-pricing a rung invites).
  {
    const gotRanked = rows.filter((r) => r.firstRankedWeek !== null)
    console.log('')
    console.log('  ══ 7b. THE FIRST RANKING – when it arrives, what it costs, and who moved with her ══')
    console.log('')
    if (gotRanked.length) {
      const weeks = gotRanked.map((r) => r.firstRankedWeek!)
      console.log(
        `  careers that EVER hold a professional ranking : ${gotRanked.length}/${rows.length} = ` +
          `${((100 * gotRanked.length) / rows.length).toFixed(1)}%`,
      )
      console.log(
        `  age at first ranking          : median ${exactAgeOfWeek(median(weeks)).toFixed(2)} · ` +
          `earliest ${exactAgeOfWeek(Math.min(...weeks)).toFixed(2)} · latest ${exactAgeOfWeek(Math.max(...weeks)).toFixed(2)}` +
          '   (real 15.9-16.2, real-ladder-pace.md §6)',
      )
      console.log(
        `  W main draws it cost her      : median ${median(gotRanked.map((r) => r.wDrawsAtFirstRanking)).toFixed(1)} · ` +
          `mean ${mean(gotRanked.map((r) => r.wDrawsAtFirstRanking)).toFixed(1)} · ` +
          `worst ${Math.max(...gotRanked.map((r) => r.wDrawsAtFirstRanking))}`,
      )
      const paidFirst = gotRanked.filter((r) => r.firstPrizeWeek !== null)
      if (paidFirst.length) {
        console.log(
          `  ranking LAGS the first cheque : median ${median(paidFirst.map((r) => r.firstRankedWeek! - r.firstPrizeWeek!)).toFixed(1)} weeks` +
            '   (0 before the minimum existed – every W finish pays)',
        )
      }
    } else {
      console.log(`  careers that EVER hold a professional ranking : 0/${rows.length}`)
    }
    console.log(
      `  ⚠ ANTI-GIFT – LIVE girls ranked at career end : median ${median(rows.map((r) => r.liveRankedAtEnd)).toFixed(1)} of ~200 · ` +
        `inside the merged top 200: median ${median(rows.map((r) => r.liveTop200AtEnd)).toFixed(1)}`,
    )
    console.log('    (they earn on the same table she does; the 520 derived pros are ISSUED their books and cannot move.')
    console.log('     Her rank improving while these hold is a climb; all three rising together is a deflation.)')
  }
  // --- §8 HOW HER TOURNAMENTS END -----------------------------------------------------------------
  //
  // THE OWNER'S OWN COMPLAINT, MEASURED - "losing in the first or second match VERY often is very
  // galling".
  // The honest way to read this table is against its own arithmetic floor. A 32-draw eliminates 16
  // of 32 entrants in round one and 8 more in round two, so 75.0% of ANY field is gone by the second
  // match whoever is in it – that is not a difficulty setting, it is what a knockout is. The number
  // that carries meaning is the EXCESS over 75%, which is the part our calibration owns.
  console.log('  ══ 8. HOW HER TOURNAMENTS END – the R1/R2 exit rate, against a knockout\'s own floor ══')
  console.log('')
  console.log(
    '  ' + padEnd('rung', 9) + pad('draws', 8) + pad('R1 out', 10) + pad('R2 out', 10) + pad('out by R2', 11) +
      pad('floor', 8) + pad('excess', 9) + pad('QF+', 8) + pad('titles', 8),
  )
  // ⚠ `hist.slice(0, 4)` is "quarter-final or better" only while the draw is 32 (indices 0-3 are
  // champion / finalist / semi / quarter). Every W rung ships at drawSize 32 – see slam.drawSize for
  // the measured reason the majors did too – so this holds today and would need re-aiming the day a
  // 64- or 128-draw ships, at which point the QF+ column would silently start counting R16s.
  const exitRow = (label: string, tiers: TierId[]) => {
    let draws = 0
    let r1 = 0
    let r2 = 0
    let qf = 0
    let titles = 0
    let floorNum = 0
    for (const t of tiers) {
      const hist = rows.reduce((acc: number[], r) => acc.map((v, i) => v + r.finishByTier[t][i]), new Array<number>(Math.round(Math.log2(TIERS[t].drawSize)) + 1).fill(0))
      const n = hist.reduce((s, v) => s + v, 0)
      if (n === 0) continue
      const last = hist.length - 1
      draws += n
      r1 += hist[last]
      r2 += hist[last - 1] ?? 0
      qf += hist.slice(0, 4).reduce((s, v) => s + v, 0)
      titles += hist[0]
      // the floor is the draw's own arithmetic: half out in R1, a quarter more in R2
      floorNum += n * 0.75
    }
    if (draws === 0) return
    const outByR2 = r1 + r2
    console.log(
      '  ' + padEnd(label, 9) + pad(String(draws), 8) + pad(ratio(r1, draws), 10) + pad(ratio(r2, draws), 10) +
        pad(ratio(outByR2, draws), 11) + pad(ratio(floorNum, draws), 8) +
        pad(`${(100 * (outByR2 - floorNum) / draws >= 0 ? '+' : '')}${((100 * (outByR2 - floorNum)) / draws).toFixed(1)}pp`, 9) +
        pad(ratio(qf, draws), 8) + pad(ratio(titles, draws), 8),
    )
  }
  const W_RUNGS_ALL = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
  for (const t of W_RUNGS_ALL) exitRow(t, [t])
  exitRow('ALL W', W_RUNGS_ALL)
  exitRow('ITF jr', TIER_LADDER.filter((t) => TIERS[t].track === 'itf'))
  console.log('  "floor" = what a knockout of that draw size exits by round two with NO skill difference at all.')
  console.log('  "excess" = ours minus the floor. Positive = she loses early more often than a coin-flip field would.')
  console.log('')

  console.log(`  richest single SEASON anywhere: ${usd(bestSeasonPrize)}`)
  console.log(`  richest whole CAREER anywhere : ${usd(Math.max(...rows.map((r) => r.prizeCents)))}`)
  console.log(
    `  the ladder's own top rung entered: wta125 ${rows.filter((r) => r.entriesByTier.wta125 > 0).length}/${rows.length} careers · ` +
      `wta250 ${rows.filter((r) => r.entriesByTier.wta250 > 0).length} · wta500 ${rows.filter((r) => r.entriesByTier.wta500 > 0).length} · ` +
      `wta1000 ${rows.filter((r) => r.entriesByTier.wta1000 > 0).length} · slam ${rows.filter((r) => r.entriesByTier.slam > 0).length}`,
  )
  console.log('')
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  console.log('')
}

// ⚠ vite-node 3.2.4 strips the entry file from `process.argv` – the same guard, for the same measured
// reason, as econ-bench.ts and endings-bench.ts carry.
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('money-decomposition')) ||
  (process.env.npm_lifecycle_script ?? '').includes('money-decomposition') ||
  process.env.TB_BENCH_RUN === '1'
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) {
  main()
}
