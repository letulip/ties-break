/**
 * ladder-vs-targets – DID SHE EARN IT? The measured ladder against the July targets.
 *
 * The owner, 12.08, after a career he loved – «очень радовался её победам и смотрел матчи с
 * замиранием (то, ради чего по моему мнению делается игра)» – and then the question that matters:
 * «она должна была вообще сюда дойти с таким сетапом?» She is p0.7 on total headroom
 * (docs/specs/potential-band-2026-08.md §4), she has climbed w75 -> wta500, and a Grand Slam is next.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only. NO shipped constant is patched by this file at
 * all – not even temporarily – so there is no `finally` to check: the whole tool runs against the
 * engine exactly as it ships. Nothing is read from, derived from, or written about a personal save.
 *
 * THE THREE QUESTIONS:
 *
 *   §1 WHAT RANK DOES OUR SLAM ACTUALLY ACCEPT? `TIERS.slam.drawSize` is 32, which reads as "the top
 *      32 in the world" and is four times more exclusive than a real major. But the DOOR is a
 *      different number from the DRAW, and §1 traces both: the tier constants, the runtime candidate
 *      counts the bands resolve to on the table as it is TODAY, and then the ranks that actually
 *      walked through, per season, over the careers of §2. ⚠ The answer is #104 of an 1,800-row
 *      table, and NOBODY in 160 full careers reaches it - so the door is not the binding constraint.
 *   §2 THE LADDER AGAINST THE JULY TARGETS. docs/specs/career-outcome-targets.md, agreed 26.07, in
 *      BOTH of the bases that page demands (conditional on reaching the horizon, and of all starts).
 *      ⚠ Its "Slam-level <1%" row does not say whether it means ENTERING or CONTENDING, so both are
 *      measured and reported separately.
 *   §3 IS A p0.7 CAREER REACHING wta500 TYPICAL OR LUCKY? Conditioned on talent: the bottom decile of
 *      total headroom against the same ladder.
 *
 * HOW A CAREER IS RUN, and every clause of it is a choice worth naming:
 *   - full career, 14 -> 38 (`FULL_CAREER_WEEKS`), stopping at whatever ending arrives;
 *   - the `player` policy (someone actually managing it) – the same arm potential-band-sweep §3 uses;
 *   - ⚠ BANKRUPTCY IS **NOT** DEFUSED. potential-band-sweep defuses it because it is measuring a
 *     growth curve; this file is measuring the targets page, and that page's first row IS the
 *     bankruptcy rate. A defused run would answer the wrong question twice over;
 *   - the fork at nineteen is answered `continue` and every retirement offer is refused until the
 *     game stops asking, so the TENNIS filter is measured without the player's own exit choices
 *     folded into it. "She quit of her own accord" is therefore NOT measured here – see §2's note.
 *
 * Run:
 *   npx vite-node tools/ladder-vs-targets.ts -- [--seeds 25] [--talent-seeds 15] [--only 1,2,3]
 *                                              [--policy player|grinder]
 *
 * `--only 1` builds no career at all and answers in under a second; everything else is a full-career
 * sweep. `--policy grinder` is the control arm of §3e - it is what tells a ceiling in the WORLD apart
 * from a ceiling in the bench's own entry policy, and the answer is that the careful manager is
 * already the better one.
 */
import {
  openCareer,
  stepCareerWeek,
  PRESETS,
  POLICIES,
  type Preset,
  type Policy,
} from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, createWorld, seasonIndexOf, type WorldState } from '../src/engine/world'
import { fieldProsOf, kidPoints, rankingFor, tableSize } from '../src/engine/world/ladder'
import { autoEndingViewOf, cheapestEntryFeeCents } from '../src/engine/world/endings'
import { bankruptcyDue } from '../src/engine/ending'
import { startingSkills } from '../src/engine/world/player'
import { kidAgeExact } from '../src/engine/world/age'
import { universeForTier } from '../src/engine/season/fieldPros'
import { isEntrantBand } from '../src/engine/season/tournament'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, isTierAgeOpen } from '../src/engine/season/calendar'
import { SKILL_KEYS, rollPotential } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type CareerEnding, type PlayerProfile } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 25)
const TALENT_SEEDS = argOf('talent-seeds', 15)
/** how deep to scan for bottom-decile seeds in §3. Pure arithmetic – no world is built. */
const TALENT_SCAN = argOf('talent-scan', 4000)
const onlyArg = args.indexOf('--only') >= 0 ? (args[args.indexOf('--only') + 1] ?? '') : ''
const ONLY = new Set(onlyArg.split(',').filter(Boolean))
const wants = (section: string): boolean => ONLY.size === 0 || ONLY.has(section)
/** ⚠ THE MANAGER IS AN ARM, NOT A CONSTANT. The default is `player` (someone actually managing it) –
 *  the same arm potential-band-sweep §3 uses – and `--policy grinder` is the control that tells a
 *  ceiling in the WORLD apart from a ceiling in the bench's own entry policy. Unknown ids fall back
 *  to `player` rather than throwing, because this is the arm every default run wants. */
const policyArg = args.indexOf('--policy') >= 0 ? args[args.indexOf('--policy') + 1] : 'player'
const POLICY: Policy = POLICIES.find((p) => p.id === policyArg) ?? POLICIES[1]

// -------------------------------------------------------------------------------------------------
// the four cells – background x coach, matching tools/fatigue-bench.ts's PROFILES rung for rung
// -------------------------------------------------------------------------------------------------
const CELLS: Array<{ label: string; preset: Preset }> = [
  { label: '8k   · working · self-coached', preset: PRESETS[0] },
  { label: '25k  · middle  · self-coached', preset: PRESETS[3] },
  { label: '25k  · middle  · middle coach', preset: PRESETS[5] },
  { label: '120k · wealthy · elite coach', preset: PRESETS[8] },
]

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function rule(n = 110): string {
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
function shareOf(hits: number, of: number): string {
  return of === 0 ? '   –' : `${((100 * hits) / of).toFixed(1)}%`
}

// -------------------------------------------------------------------------------------------------
// TALENT, as an exact POPULATION percentile rather than a sample one
// -------------------------------------------------------------------------------------------------
//
// `rollPotential` is `start[k] + lo + u_k·(hi - lo)` off the `seed:potential` sub-stream, so total
// headroom is `5·lo + (hi - lo)·Σu` with `Σu` an Irwin-Hall(5) variate. The percentile is therefore
// the exact CDF and not a rank among the seeds that happened to be run – the same derivation
// docs/specs/potential-band-2026-08.md §4 used to place the owner's own career at p0.7.
//
// ⚠ THE CEILING IS ROLLED OFF THE BIRTH BUILD, NOT THE HEAD-STARTED ONE (world.ts's own ⚠, and the
// arithmetic trap that spec §4 names): `potential[k] - startingSkills(...)` is the TRUE roll, and
// `potential[k] - withHeadStart(...)` understates it by `relativeAgeHeadStart(birthMonth)` on every
// skill. This function reads `startingSkills`, so it is the true one.
function irwinHall5CDF(s: number): number {
  if (s <= 0) return 0
  if (s >= 5) return 1
  const C = [1, 5, 10, 10, 5, 1]
  let sum = 0
  for (let k = 0; k <= Math.floor(s); k++) sum += (k % 2 === 0 ? 1 : -1) * C[k] * (s - k) ** 5
  return sum / 120
}

/** Total headroom of the career this seed produces – every point she can ever add, over five skills. */
function headroomOf(seed: string, profile: PlayerProfile): number {
  const start = startingSkills(seed, profile)
  const potential = rollPotential(seed, start)
  return SKILL_KEYS.reduce((a, k) => a + (potential[k] - start[k]), 0)
}

/** Her place in the talent distribution the model can produce, in percent. Exact. */
function headroomPercentile(headroom: number): number {
  const [lo, hi] = ECONOMY.development.potentialBand
  const sumU = (headroom - SKILL_KEYS.length * lo) / (hi - lo)
  return 100 * irwinHall5CDF(sumU)
}

function profileFor(preset: Preset): PlayerProfile {
  return { ...DEFAULT_PROFILE, background: preset.background, coachTier: preset.coachTier }
}
/** `openCareer`'s own seed string, re-derived so §3 can pick indices before building any world. */
function seedFor(preset: Preset, index: number): string {
  return `bench-${preset.background}-${index}`
}

// -------------------------------------------------------------------------------------------------
// ONE CAREER
// -------------------------------------------------------------------------------------------------

/** A Slam entry, captured at the moment the door admitted her. */
interface SlamEntry {
  week: number
  season: number
  age: number
  /** her WTA rank as `entryStatus` read it – i.e. the number the acceptance cut compared to 104 */
  rank: number
}

interface Career {
  cell: string
  index: number
  headroom: number
  headroomPct: number
  weeks: number
  ending: string | null
  /** the family went under and stayed under – the targets page's first row */
  bankrupt: boolean
  /** ...and whether it happened inside the 14->18 window that row is denominated in */
  bankruptBy18: boolean
  /** never went bankrupt and never quit – the BASE every tennis figure below is conditional on */
  reachedHorizon: boolean
  entriesByTier: Record<TierId, number>
  /** best (lowest) WTA rank ever held while actually holding a professional point */
  bestWta: number | null
  /** the fattest her best-18 professional book ever got – the ranking's own currency, so a bench
   *  career and a real one can be compared without going through the rank curve twice */
  peakWtaPoints: number
  bestFinishSlam: number | undefined
  slamEntries: SlamEntry[]
  titles: number
  prizeCents: number
}

function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

function runCareer(cell: string, preset: Preset, index: number, policy: Policy): Career {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const entriesByTier = zeroByTier()
  const slamEntries: SlamEntry[] = []
  let bestWta: number | null = null
  let peakWtaPoints = 0
  let weeks = 0

  for (; weeks < FULL_CAREER_WEEKS && world.ending === null; weeks++) {
    // ⚠ CAPTURED BEFORE THE STEP. `stepCareerWeek` enters, then ticks, and the tick is what moves the
    // rank caches – so the rank the DOOR read is this one, not the one left behind afterwards. It is
    // exactly `rankIn(world, 'wta')`'s value at the moment `entryStatus` compared it to `acceptsRank`.
    const rankBefore = world.kidRankWta
    const entered = stepCareerWeek(world, rng, policy)
    for (const t of TIER_LADDER) entriesByTier[t] += entered[t]
    if (entered.slam > 0) {
      slamEntries.push({
        week: world.week,
        season: seasonIndexOf(world.week),
        age: kidAgeExact(world.week, world.profile.birthMonth),
        rank: rankBefore ?? tableSize(world, 'wta'),
      })
    }
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    // Guarded on having been PAID – money-decomposition's rule against the point-less dense-rank-1
    // tie, and the same guard potential-band-sweep's own career arm carries.
    //
    // ⚠ `typeof === 'number'`, AND THE OBVIOUS `!== null` WAS A LATENT BUG THAT ONLY `vue-tsc` SAW.
    // `WorldState.kidRankWta` is `number | undefined`, never null – so `!== null` admits `undefined`,
    // `bestWta = undefined` would then latch (the next week's `bestWta === null` reads false and
    // `undefined < bestWta` reads false, so nothing can ever overwrite it) and every rung predicate
    // downstream would silently score that career as unranked. It never fired, because
    // `recomputeKidRank` writes the field on every tick and the prize guard cannot pass before then,
    // but it is exactly the class vite-node cannot catch: types are stripped at runtime.
    const wtaRank = world.kidRankWta
    if (world.careerTotals.prizeCents > 0 && typeof wtaRank === 'number') {
      if (bestWta === null || wtaRank < bestWta) bestWta = wtaRank
    }
    const pts = kidPoints(world, 'wta')
    if (pts > peakWtaPoints) peakWtaPoints = pts
  }

  let titles = 0
  for (const t of Object.values(world.trophiesByTier ?? {})) {
    titles += (t as { titles?: number[] })?.titles?.length ?? 0
  }
  // ⚠ READ AFTER THE LOOP AND THROUGH AN ANNOTATED LOCAL. The loop's own condition is
  // `world.ending === null`, so inside the body TypeScript narrows the property to `null` and keeps
  // that narrowing across the `stepCareerWeek` call that actually sets it - `world.ending?.type` in
  // there is `never`. Asking once, out here, is both correct and the honest place: whether a career
  // ended is a fact about the finished run.
  //
  // AND THE 14->18 WINDOW READS THE ENDING'S OWN WEEK (`CareerEnding.week`), not `world.week` - the
  // targets page's first row is denominated in that window and the ending knows when it happened.
  const endingRow: CareerEnding | null = world.ending
  const ending = endingRow?.type ?? null
  const bankrupt = ending === 'bankruptcy'
  const bankruptBy18 = bankrupt && (endingRow?.week ?? Number.MAX_SAFE_INTEGER) <= 4 * WEEKS_PER_YEAR
  const headroom = headroomOf(seed, world.profile)
  return {
    cell,
    index,
    headroom,
    headroomPct: headroomPercentile(headroom),
    weeks,
    ending,
    bankrupt,
    bankruptBy18,
    // "Reaching the horizon" = the family did not go bankrupt and she did not quit
    // (career-outcome-targets.md's own definition). `stopped` is the fork answered `stop`, which this
    // arm never answers – it is listed so a future arm that DOES answer it inherits the rule.
    reachedHorizon: !bankrupt && ending !== 'stopped' && ending !== 'college',
    entriesByTier,
    bestWta,
    peakWtaPoints,
    bestFinishSlam: world.bestFinishByTier.slam,
    slamEntries,
    titles,
    prizeCents: world.careerTotals.prizeCents,
  }
}

// -------------------------------------------------------------------------------------------------
// THE RUNGS – one predicate per row of the targets page, plus the two readings of "Slam-level"
// -------------------------------------------------------------------------------------------------

interface Rung {
  label: string
  /** the July target as the page WRITES it, or '–' on the rows the page sets none for. A string and
   *  not a pair of numbers on purpose: two of these carry a '?' because the target is ambiguous, and
   *  a range parsed into bounds would quietly launder that away. */
  target: string
  hit: (c: Career) => boolean
}

/** A 32-draw's rounds are R32·R16·QF·SF·F, and `finishes[loser] = rounds - round`, so a
 *  quarter-finalist's stored finish is 3 (`finishLabel(3)` is literally 'Quarterfinalist').
 *  "QF or better" is therefore `<= 3`. */
const SLAM_QF = 3

const RUNGS: Rung[] = [
  { label: 'entered ANY W-tour event', target: '–', hit: (c) => TIER_LADDER.some((t) => TIERS[t].track === 'wta' && c.entriesByTier[t] > 0) },
  { label: 'saw the pro contour (a W15)', target: '50-65%', hit: (c) => c.entriesByTier.w15 > 0 },
  { label: 'lives from tennis (top-250)', target: '15-25%', hit: (c) => c.bestWta !== null && c.bestWta <= 250 },
  { label: 'a real star (top-100)', target: '3-6%', hit: (c) => c.bestWta !== null && c.bestWta <= 100 },
  { label: 'Slam-level A: ENTERED a Slam', target: '<1% ?', hit: (c) => c.slamEntries.length > 0 },
  { label: 'Slam-level B: QF+ at a Slam', target: '<1% ?', hit: (c) => c.bestFinishSlam !== undefined && c.bestFinishSlam <= SLAM_QF },
  { label: '   (for scale) Slam SF or better', target: '–', hit: (c) => c.bestFinishSlam !== undefined && c.bestFinishSlam <= 2 },
  { label: '   (for scale) Slam CHAMPION', target: '–', hit: (c) => c.bestFinishSlam === 0 },
]

// =================================================================================================
// §1  WHAT RANK DOES OUR SLAM ACTUALLY ACCEPT?
// =================================================================================================

function section1(careers: Career[] | null): void {
  console.log(`\n${rule()}`)
  console.log('§1  THE SLAM\'S DOOR – the draw is 32, and the door is not the draw')
  console.log(rule())

  // --- 1a. the constants, read from the shipped table ------------------------------------------
  console.log(`\n  1a. THE TOP OF THE LADDER AS SHIPPED (src/engine/season/calendar.ts)\n`)
  console.log(
    `  ${padEnd('rung', 10)}${pad('draw', 6)}${pad('minAge', 8)}${pad('acceptsRank', 13)}` +
      `${pad('entrantPctBand', 17)}${pad('entry fee', 12)}${pad('R1 prize', 12)}`,
  )
  for (const t of TIER_LADDER) {
    const d = TIERS[t]
    if (d.track !== 'wta') continue
    const prize = d.prizeCents ? d.prizeCents[d.prizeCents.length - 1] : 0
    console.log(
      `  ${padEnd(t, 10)}${pad(d.drawSize, 6)}${pad(d.minAgeYears ?? '–', 8)}${pad(d.acceptsRank ?? '–', 13)}` +
        `${pad(`[${d.entrantPctBand[0]}, ${d.entrantPctBand[1]}]`, 17)}${pad(money(d.entryFeeCents), 12)}${pad(money(prize), 12)}`,
    )
  }

  // --- 1b. what the band resolves to on the table AS IT IS TODAY --------------------------------
  //
  // The bands are SHARES and `acceptsRank` is an ABSOLUTE rank, so the two answer differently when
  // the field's size moves – and it has moved. Measured rather than quoted: build a real world, let
  // it reach the professional weeks, and count.
  console.log(`\n  1b. WHAT THE TWO NUMBERS RESOLVE TO ON THE TABLE AS IT IS TODAY\n`)
  const probe: WorldState = createWorld('bench-probe-0', profileFor(PRESETS[0]))
  const pros = fieldProsOf(probe)
  const merged = rankingFor(probe, 'wta')
  const universe = universeForTier('slam', probe.cohort, pros)
  console.log(`  live cohort ${probe.cohort.length} + derived professionals ${pros.length} = merged W table ${merged.length} rows`)
  console.log(`  tableSize(world, 'wta') = ${tableSize(probe, 'wta')}`)
  console.log()
  console.log(`  ${padEnd('rung', 10)}${pad('draw', 6)}${pad('band ceiling', 14)}${pad('rows in band', 14)}${pad('of-age in band', 16)}${pad('acceptsRank', 13)}`)
  const posOf = new Map<string, number>()
  merged.forEach((r, i) => posOf.set(r.playerId, i))
  const total = merged.length
  for (const t of TIER_LADDER) {
    const d = TIERS[t]
    if (d.track !== 'wta') continue
    const inBand = universe.filter((p) => isEntrantBand(t, ((posOf.get(p.id) ?? total - 1) + 1) / total))
    const ofAge = inBand.filter((p) => isTierAgeOpen(t, p.ageYears))
    console.log(
      `  ${padEnd(t, 10)}${pad(d.drawSize, 6)}${pad(d.entrantPctBand[1], 14)}${pad(inBand.length, 14)}${pad(ofAge.length, 16)}${pad(d.acceptsRank ?? '–', 13)}`,
    )
  }

  // --- 1c. the one zero in a ladder that runs $40 to $1,000 --------------------------------------
  //
  // Round-17 #28 wants to explain `slam.entryFeeCents = 0` on the card rather than change it, so what
  // the acceptance path actually does with a zero has to be established rather than assumed. Three
  // readers, all of them checked here:
  //   * `enterEvent` – `if (world.fundsCents < fee) throw`. With fee 0 that is `funds < 0`, so a
  //     family under water still cannot enter. The fee is waived; solvency is not.
  //   * `travelCostFor` – untouched. A major is the most expensive trip on the calendar.
  //   * `cheapestEntryFeeCents` – scans the WHOLE visible calendar, not the rungs she can enter, so
  //     the moment a major is on it this returns 0 for everybody. It feeds `bankruptcyDue`'s second
  //     clause, and that clause is INERT at any value: it fires only on `funds >= cheapest`, and it
  //     is reached only when `funds < 0`, while a fee can never be negative.
  console.log(`\n  1c. THE ZERO ENTRY FEE – what the acceptance path does with it\n`)
  const feeProbe = createWorld('bench-fee-0', profileFor(PRESETS[0]))
  const feesOnCalendar = feeProbe.season.map((e) => TIERS[e.tier].entryFeeCents)
  const slamsOnCalendar = feeProbe.season.filter((e) => e.tier === 'slam').length
  console.log(`  visible calendar at week ${feeProbe.week}: ${feeProbe.season.length} events, ${slamsOnCalendar} of them majors`)
  console.log(`  cheapestEntryFeeCents(world) = ${money(cheapestEntryFeeCents(feeProbe))}` +
    `   (cheapest NON-slam fee on the same calendar: ${money(Math.min(...feesOnCalendar.filter((f) => f > 0)))})`)
  console.log(`  bankruptcyDue's second clause needs funds >= cheapest, and it is only reached with funds < 0,`)
  console.log(`  so a zero here changes nothing: the two clauses collapse onto each other. Checked:`)
  for (const funds of [-1_00, 0, 500_00]) {
    const view = { ...autoEndingViewOf(feeProbe), fundsCents: funds, debtSinceWeek: funds < 0 ? feeProbe.week - 52 : null }
    console.log(
      `    funds ${padEnd(money(funds), 10)} cheapest ${padEnd(money(view.cheapestEntryFeeCents), 6)}` +
        ` -> bankruptcyDue ${bankruptcyDue(view) ? 'TRUE' : 'false'}` +
        `   enterEvent affordability (funds >= 0): ${funds >= TIERS.slam.entryFeeCents ? 'passes' : 'REFUSES'}`,
    )
  }
  console.log(
    `  the trip is still hers: slam travel ${money(TIERS.slam.travelCostCents[0])}-${money(TIERS.slam.travelCostCents[1])}` +
      `, against a first-round cheque of ${money(TIERS.slam.prizeCents![TIERS.slam.prizeCents!.length - 1])}`,
  )

  // --- 1d. the ranks that actually walked in -----------------------------------------------------
  if (!careers) {
    console.log(`\n  1d. skipped (run §2 for the careers this section reads).`)
    return
  }
  const entries = careers.flatMap((c) => c.slamEntries)
  console.log(`\n  1d. THE RANKS THAT ACTUALLY WALKED IN – ${entries.length} Slam entries over ${careers.length} careers\n`)
  if (!entries.length) {
    console.log(`  none.`)
    return
  }
  const bySeason = new Map<number, SlamEntry[]>()
  for (const e of entries) {
    const list = bySeason.get(e.season) ?? []
    list.push(e)
    bySeason.set(e.season, list)
  }
  console.log(`  ${padEnd('season', 8)}${pad('age', 6)}${pad('entries', 9)}${pad('best rank in', 14)}${pad('median', 9)}${pad('WORST rank in', 15)}`)
  for (const s of [...bySeason.keys()].sort((a, b) => a - b)) {
    const list = bySeason.get(s)!
    const ranks = list.map((e) => e.rank)
    const ages = list.map((e) => e.age)
    console.log(
      `  ${padEnd(`s${s}`, 8)}${pad((ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1), 6)}${pad(list.length, 9)}` +
        `${pad(`#${Math.min(...ranks)}`, 14)}${pad(`#${pctl(ranks, 0.5)}`, 9)}${pad(`#${Math.max(...ranks)}`, 15)}`,
    )
  }
  const allRanks = entries.map((e) => e.rank)
  console.log(
    `\n  ALL SEASONS   best #${Math.min(...allRanks)}   p50 #${pctl(allRanks, 0.5)}   p90 #${pctl(allRanks, 0.9)}   WORST #${Math.max(...allRanks)}` +
      `   (the shipped cut is #${TIERS.slam.acceptsRank})`,
  )
  console.log(`  entries at a rank OUTSIDE the top 32 (what the draw implies): ${allRanks.filter((r) => r > 32).length} of ${allRanks.length} (${shareOf(allRanks.filter((r) => r > 32).length, allRanks.length)})`)
  console.log(`  entries at a rank OUTSIDE the top 104 (what the door says):   ${allRanks.filter((r) => r > 104).length} of ${allRanks.length}`)
  const withSlam = careers.filter((c) => c.slamEntries.length > 0)
  console.log(
    `\n  careers that entered at least one Slam: ${withSlam.length} of ${careers.length} (${shareOf(withSlam.length, careers.length)});` +
      ` median Slam entries per such career ${pctl(withSlam.map((c) => c.slamEntries.length), 0.5)}` +
      `, of a possible 4 a season`,
  )
  console.log(
    `  their talent: median p${pctl(withSlam.map((c) => c.headroomPct), 0.5).toFixed(1)}` +
      `, worst p${Math.min(...withSlam.map((c) => c.headroomPct)).toFixed(1)}` +
      `, best p${Math.max(...withSlam.map((c) => c.headroomPct)).toFixed(1)} of total headroom`,
  )
  const firsts = withSlam.map((c) => c.slamEntries[0])
  console.log(
    `  at her FIRST Slam: median rank #${pctl(firsts.map((e) => e.rank), 0.5)}, median age ${pctl(firsts.map((e) => e.age), 0.5).toFixed(1)}`,
  )
}

// =================================================================================================
// §2  THE LADDER AGAINST THE JULY TARGETS
// =================================================================================================

function reportLadder(title: string, careers: Career[]): void {
  const all = careers.length
  const horizon = careers.filter((c) => c.reachedHorizon)
  console.log(`\n  ${'-'.repeat(104)}`)
  console.log(`  ${title}   (${all} careers, ${horizon.length} reached the horizon)`)
  console.log(`  ${'-'.repeat(104)}`)
  console.log(
    `  ${padEnd('rung', 32)}${pad('July target', 13)}${pad('of horizon', 13)}${pad('of all starts', 15)}${pad('n', 6)}`,
  )
  // ⚠ THE TARGET ROW IS DENOMINATED IN A WINDOW: "Family did not go bankrupt, **14->18**". The
  // whole-career figure is printed under it because a family that survives to eighteen and folds at
  // twenty-two is a different story, and neither number is the other one.
  console.log(
    `  ${padEnd('solvent through 14->18', 32)}${pad('60-80%', 13)}${pad('–', 13)}` +
      `${pad(shareOf(careers.filter((c) => !c.bankruptBy18).length, all), 15)}${pad(careers.filter((c) => !c.bankruptBy18).length, 6)}`,
  )
  console.log(
    `  ${padEnd('  ...and over the WHOLE career', 32)}${pad('–', 13)}${pad('–', 13)}` +
      `${pad(shareOf(careers.filter((c) => !c.bankrupt).length, all), 15)}${pad(careers.filter((c) => !c.bankrupt).length, 6)}`,
  )
  for (const r of RUNGS) {
    const inHorizon = horizon.filter(r.hit).length
    const inAll = careers.filter(r.hit).length
    console.log(
      `  ${padEnd(r.label, 32)}${pad(r.target, 13)}${pad(shareOf(inHorizon, horizon.length), 13)}` +
        `${pad(shareOf(inAll, all), 15)}${pad(inAll, 6)}`,
    )
  }
  const endings: Record<string, number> = {}
  for (const c of careers) endings[c.ending ?? 'ran out of horizon'] = (endings[c.ending ?? 'ran out of horizon'] ?? 0) + 1
  console.log(`  endings: ${Object.entries(endings).map(([k, v]) => `${k}=${v}`).join('  ')}`)
  const wta = careers.map((c) => c.bestWta).filter((r): r is number => r !== null)
  console.log(
    `  best WTA rank: ranked ${wta.length}/${all}` +
      (wta.length ? `, best #${Math.min(...wta)}, median #${pctl(wta, 0.5)}` : '') +
      `   median career prize ${money(pctl(careers.map((c) => c.prizeCents), 0.5))}`,
  )
  const pts = careers.map((c) => c.peakWtaPoints)
  console.log(
    `  peak best-18 book: median ${pctl(pts, 0.5)} pts, p90 ${pctl(pts, 0.9)}, best ${Math.max(...pts)}` +
      `   (the ranking's own currency – the door at #104 is what this has to buy)`,
  )

  // ...AND THE SAME CAREERS READ AGAINST THE LADDER'S OWN DOORS, which is the owner's question in his
  // own units: "she has climbed w75 -> wta500" is a statement about `acceptsRank`, not about #250.
  // Two columns, because they are two different facts: a door she CLEARED is a rank she held, and a
  // rung she ENTERED is a week she spent there.
  console.log(`\n  ${padEnd('the ladder\'s own doors', 32)}${pad('accepts', 9)}${pad('ever cleared', 14)}${pad('ever entered', 14)}`)
  for (const t of TIER_LADDER) {
    const d = TIERS[t]
    if (d.track !== 'wta') continue
    const accepts = d.acceptsRank
    const cleared = accepts === undefined ? all : careers.filter((c) => c.bestWta !== null && c.bestWta <= accepts).length
    const entered = careers.filter((c) => c.entriesByTier[t] > 0).length
    console.log(
      `  ${padEnd(`  ${t}`, 32)}${pad(accepts === undefined ? 'on-ramp' : `#${accepts}`, 9)}` +
        `${pad(accepts === undefined ? '–' : shareOf(cleared, all), 14)}${pad(shareOf(entered, all), 14)}`,
    )
  }
}

function runCells(seedsPerCell: number, pick?: (preset: Preset) => number[]): Career[] {
  const out: Career[] = []
  for (const cell of CELLS) {
    const indices = pick ? pick(cell.preset) : Array.from({ length: seedsPerCell }, (_, i) => i)
    for (const i of indices) out.push(runCareer(cell.label, cell.preset, i, POLICY))
  }
  return out
}

function section2(): Career[] {
  console.log(`\n${rule()}`)
  console.log('§2  THE LADDER AGAINST THE JULY TARGETS (docs/specs/career-outcome-targets.md, 26.07)')
  console.log(rule())
  console.log(`
  ${SEEDS} seeds per cell x ${CELLS.length} cells = ${SEEDS * CELLS.length} full careers, 14 -> 38, "${POLICY.label}" policy.
  Bankruptcy is NOT defused. The fork at 19 is answered 'continue' and every retirement offer is
  refused until the game stops asking, so the ladder below is the TENNIS filter with the player's own
  exit choices held out of it.

  ⚠ THE TARGET PAGE IS AMBIGUOUS ON ITS LAST ROW. "Slam-level <1%" does not say whether it means
  ENTERING a major or CONTENDING at one, so both are measured and reported as separate rows.
`)
  const careers = runCells(SEEDS)
  for (const cell of CELLS) reportLadder(cell.label, careers.filter((c) => c.cell === cell.label))
  reportLadder('ALL FOUR CELLS POOLED', careers)
  return careers
}

// =================================================================================================
// §3  CONDITIONED ON TALENT – the bottom decile of total headroom
// =================================================================================================

function section3(unbiased: Career[] | null): void {
  console.log(`\n${rule()}`)
  console.log('§3  IS A p0.7 CAREER REACHING wta500 TYPICAL OR LUCKY? – conditioned on talent')
  console.log(rule())
  const [lo, hi] = ECONOMY.development.potentialBand
  console.log(`
  Total headroom is 5·lo + (hi-lo)·Σu with Σu Irwin-Hall(5), so a career's place in the talent
  distribution is an EXACT population percentile rather than a rank among the seeds that were run.
  Shipped band [${lo}, ${hi}] -> the bottom decile is every career under ${(SKILL_KEYS.length * lo + (hi - lo) * bottomDecileSumU()).toFixed(1)} points of total headroom.

  ⚠ THE SAMPLE IS ENRICHED BY SEED SELECTION, and it is legitimate BY CONSTRUCTION: headroom is a
  pure function of the seed string through the \`seed:potential\` sub-stream alone, so indices can be
  screened arithmetically before a single world is built. Nothing else about the career is selected
  on – MAIN and every event sub-stream are derived from different suffixes of the same seed. The
  unbiased §2 sample's own bottom tail is printed beside it as the check on exactly that.
`)
  const cut = bottomDecileSumU() * (hi - lo) + SKILL_KEYS.length * lo

  // Screen indices arithmetically, then run only the ones that qualify.
  const picked = new Map<string, number[]>()
  for (const cell of CELLS) {
    const idx: number[] = []
    for (let i = 0; i < TALENT_SCAN && idx.length < TALENT_SEEDS; i++) {
      if (headroomOf(seedFor(cell.preset, i), profileFor(cell.preset)) < cut) idx.push(i)
    }
    picked.set(cell.label, idx)
    console.log(`  ${padEnd(cell.label, 30)} bottom-decile indices found: ${idx.length} (scanned ${TALENT_SCAN})`)
  }
  const careers = runCells(0, (preset) => {
    const cell = CELLS.find((c) => c.preset === preset)!
    return picked.get(cell.label)!
  })
  const hr = careers.map((c) => c.headroom)
  console.log(
    `\n  the selected population: headroom min ${Math.min(...hr).toFixed(1)} / median ${pctl(hr, 0.5).toFixed(1)} / max ${Math.max(...hr).toFixed(1)}` +
      `  -> percentile p${pctl(careers.map((c) => c.headroomPct), 0.5).toFixed(1)} median, p${Math.max(...careers.map((c) => c.headroomPct)).toFixed(1)} worst-case`,
  )
  reportLadder('BOTTOM DECILE OF TOTAL HEADROOM (enriched)', careers)

  if (unbiased) {
    const deciles: Array<[string, (c: Career) => boolean]> = [
      ['bottom decile (p<10)', (c) => c.headroomPct < 10],
      ['middle (p10-p90)', (c) => c.headroomPct >= 10 && c.headroomPct <= 90],
      ['top decile (p>90)', (c) => c.headroomPct > 90],
    ]
    console.log(`\n  ${rule(104)}`)
    console.log(`  THE SAME LADDER BY TALENT BAND, on §2's UNBIASED sample – the check on the enrichment`)
    console.log(`  ${rule(104)}`)
    console.log(`  ${padEnd('rung', 32)}${deciles.map(([l]) => pad(l.slice(0, 18), 20)).join('')}`)
    const rowsOf = deciles.map(([, f]) => unbiased.filter(f))
    console.log(`  ${padEnd('n', 32)}${rowsOf.map((r) => pad(r.length, 20)).join('')}`)
    for (const r of RUNGS) {
      console.log(`  ${padEnd(r.label, 32)}${rowsOf.map((rows) => pad(shareOf(rows.filter(r.hit).length, rows.length), 20)).join('')}`)
    }
    console.log(`  ${padEnd('median best WTA rank', 32)}${rowsOf
      .map((rows) => {
        const w = rows.map((c) => c.bestWta).filter((x): x is number => x !== null)
        return pad(w.length ? `#${pctl(w, 0.5)}` : '–', 20)
      })
      .join('')}`)
  }
}

/** `Σu` at the 10th percentile of Irwin-Hall(5) – solved by bisection on the exact CDF. */
function bottomDecileSumU(): number {
  let lo = 0
  let hi = 5
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (irwinHall5CDF(mid) < 0.1) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// =================================================================================================

function main(): void {
  const t0 = Date.now()
  console.log(`\nladder-vs-targets · ${SEEDS} seeds/cell · ${CELLS.length} cells · full careers 14->38 (${FULL_CAREER_WEEKS} weeks max)`)
  const careers = wants('2') ? section2() : null
  if (wants('1')) section1(careers)
  if (wants('3')) section3(careers)
  console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

main()
