/**
 * coach-travel-bench – THE THREE CANCELLED ARMS, RE-MEASURED ON THE REBUILT BENCH.
 *
 * ⚠ WHY THIS FILE EXISTS AT ALL, given that `docs/decisions.md` says «Do NOT build a "he contributes
 * differently at a tournament" mechanic». The owner overruled that on 15.08 and his reason is the
 * brief:
 *
 *     «прибавка к силе матча сделала элитные результаты ХУЖЕ – это на старых измерениях?
 *      мы построили новый стенд, надо актуализировать данные.»
 *
 * He is right that the verdict is stale. All three arms of 30.07 (commit `77e08aa`) were measured on
 * the OLD bench policy – the one `docs/specs/the-wall-2026-08.md` §6-§7 later proved never got
 * ANYBODY ranked, because an absolute $5,000 reserve permanently refused the trips that pay and
 * permanently allowed the ones that do not. Task #89 records that every absolute economy verdict
 * from that bench is suspect. Two further things changed after 30.07: the Slam draw is 128 and the
 * WTA 1000 is 64 (14.08), and a first-round loss at either now pays the rulebook's 10 instead of
 * 130/65. So the numbers in that commit's own record describe a world that no longer exists.
 *
 * ⚠⚠ MEASUREMENT ONLY. NOTHING HERE SHIPS. No engine file is touched, no constant is decided, no
 * fixture is written. Every arm is patch-and-restore over an EXISTING knob, the licensed idiom
 * (`tools/best16-bench.ts` on BEST_N_BY_TRACK, `tools/opener-price-bench.ts` on TIERS[t].points,
 * `tools/wall-l1-bench.ts` on COACH_EDGE_CORRIDOR_PP), with the restore in a `finally` and a
 * post-run assertion that exits non-zero if it did not take.
 *
 * ⚠ AND EVERY ARM SHARES EVERY SEED, WORLD AND TALENT DRAW. `openCareer(preset, index, POLICIES[1])`
 * keys the world on `bench-<background>-<index>`, so arm and control are the same girl in the same
 * family meeting the same calendar; the ONLY difference is the knob. Anything that moves, moved
 * because of the arm.
 *
 * ⚠⚠ RUN IT IN A WORKTREE AT A COMMIT, NEVER IN A SHARED CHECKOUT WITH AGENTS IN IT – and that is a
 * measured hazard here rather than hygiene advice. This bench's first full run was thrown away
 * because ANOTHER agent was building the presence mechanic in the same working tree at the same
 * time, and its uncommitted `chargeCoachTravel` was already wired into `tickWeek`. `POLICIES[1]`
 * sets `coachOnEventWeeks: true`, so the CONTROL arm was already paying a doubled fare on every trip
 * and `a1-cost` was stacking a second fare on top of it – a control that is not the shipped game,
 * and worse, a working tree that can change BETWEEN arms, which breaks the one guarantee the whole
 * design rests on. `git worktree add --detach ../tb-coach-travel HEAD`, symlink `node_modules`, run
 * there.
 *
 * ------------------------------------------------------------------------------------------------
 * THE THREE ARMS, and how each is expressed WITHOUT an engine hook
 * ------------------------------------------------------------------------------------------------
 *
 * 1. THE BOOLEAN (he travels, you pay, she gains). Measured then: +$21,000 at elite over a career
 *    for +0.6 skill points – «a tax, not a decision».
 *      cost  -> `TIERS[t].travelCostCents` scaled by (1 + FARE_SHARE) on every rung with a real trip
 *               in it (j30 upward). This is the honest place for it: the fare lands in the REAL
 *               ledger under `travel`, so the rebuilt policy's R1 reserve and R6 coach review both
 *               see the bill and react to it, which a raw `fundsCents` debit would hide.
 *               ⚠ ONE KNOWN DISTORTION, stated rather than hidden: the academy scholarship and a kit
 *               deal's travel share both discount the whole line, so they discount the coach's seat
 *               too. The alternative hides the bill from the policy, which is worse.
 *      gain  -> `ECONOMY.coach.developmentFactor[tier]`, +DEV_UPLIFT. ⚠ THIS IS THE CEILING OF THE
 *               ARM AND NOT ITS REALISTIC SIZE: the factor applies EVERY week, and he only travels
 *               on competition weeks (~a third of them), so an honest event-scoped bonus would be a
 *               third of this at most. Deliberately generous – if the ceiling buys nothing, the
 *               realistic size cannot buy anything either, and that verdict is robust.
 *      The two are also run APART (`a1-cost`, `a1-gain`) because "is it a tax or a decision" is a
 *      question about which half moves the career, and a combined arm cannot answer it.
 *
 * 2. THE RUN-FATIGUE DISCOUNT. Measured then: 2 condition points out of ~36.
 *    ⚠⚠ THE LADDER CHANGED ON 14.08 AND THE ARITHMETIC NOW REFUSES THIS ARM BEFORE IT RUNS. The two
 *    rungs an elite career is decided on run on `runFatigueLadderDeep` = [-2, -1, 0], whose total
 *    over a full run is NEGATIVE THREE – the ladder is already a discount there, so there is nothing
 *    for a coach to discount. Full derivation in docs/specs/coach-travel-2026-08.md §2. What is left
 *    to give is 4 points on a 32-draw W run and 6 on a junior one, against a `recoveryBase` of 8 a
 *    week. So the arm is run ONCE, at its absolute ceiling (both positive ladders zeroed, the deep
 *    one left alone so the arm cannot accidentally PUNISH her), and not swept: a sweep of doses
 *    inside a 4-point envelope is a pointless sweep.
 *    ⚠ AND EVEN THAT ENVELOPE IS THE TITLE RUN. The ladder is indexed by MATCH-WITHIN-RUN and a first
 *    match always costs 0, so a girl who loses her opener is charged NOTHING by it (and −2 at a Slam
 *    or a 1000, i.e. she is already being handed a discount). `draw-vs-band` measures the owner's own
 *    #106 girl exiting first-up in 62.5% of wta500 draws. For the player this bonus was designed to
 *    rescue it is worth zero to one condition point a tournament.
 *
 * 3. THE MATCH-STRENGTH EDGE. Measured then at 2.8-5.0 pp, and elite results got WORSE: 12.7 wins
 *    -> 5.8, rank 90.7 -> 103.6 over 30 seeds. "Worse from a BONUS" is the single most suspicious
 *    number in the record, so this arm runs at TWO sizes on the SAME seeds:
 *      a3-small -> the cell's corridor shifted +0.5 pp (about one rung of the coach ladder)
 *      a3-big   -> shifted +3.0 pp (the middle of the cancelled arm's own 2.8-5.0 band)
 *    Shifted, never widened: the man's uniform position inside his bracket is preserved, so the
 *    same seed hires the same coach and only his number moves.
 *    ⚠ THE CONFOUND IS A REPORTED COLUMN, not an afterthought. A stronger kid ranks better, and a
 *    better rank PROMOTES her into rungs whose opener now pays 10 – so a bonus can buy tennis and
 *    lose points at the same time. `entriesByTier`, the median rank at entry and the opener-loss
 *    share at the four big rungs are printed per arm for exactly that reading, and the draw side of
 *    it is `tools/draw-vs-band.ts` on a real save (see the spec's §4).
 *
 * Run (long – background it):
 *   npx vite-node tools/coach-travel-bench.ts -- --out /tmp/coach-travel --seeds 24
 *   npx vite-node tools/coach-travel-bench.ts -- --report /tmp/coach-travel
 *
 * Resumable by construction: one JSON per arm-cell, written the moment that cell finishes, and a
 * cell already on disk is skipped.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { openCareer, stepCareerWeek, POLICIES, type Preset } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement } from '../src/engine/world'
import { startingSkills } from '../src/engine/world/player'
import { kidPoints } from '../src/engine/world/ladder'
import { COACH_EDGE_CORRIDOR_PP } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { rollPotential, SKILL_KEYS } from '../src/engine/development'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'
import type { CoachTier, FamilyBackground, WorldEventCategory } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const argv = process.argv.slice(2)
const flag = (name: string): string | null => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? (argv[i + 1] ?? '') : null
}
const SEEDS = Number(flag('seeds') ?? 24)
const WEEKS = Number(flag('weeks') ?? FULL_CAREER_WEEKS)

// -------------------------------------------------------------------------------------------------
// THE ARM SIZES, each with the reason it is that number
// -------------------------------------------------------------------------------------------------
/** A second seat on every trip, and the multiplier is THE OWNER'S OWN, not mine. `77e08aa` reverted
 *  the 30.07 per-trip fare while it was still uncommitted, so that number is not recoverable from git
 *  or from any document. What IS on the record is his pricing of the same thing on 12.08,
 *  `docs/specs/the-wall-2026-08.md` §L1: «a per-tournament top-up when the coach travels with her, at
 *  double the travel cost». One more flight, one more room: his seat costs exactly hers. */
const FARE_SHARE = 1.0
/** ⚠ THE CEILING, NOT THE SIZE – see the header. +0.04 is one full rung of
 *  `ECONOMY.coach.developmentFactor` (the high -> elite step) applied to EVERY week of her career. */
const DEV_UPLIFT = 0.04
/** The rungs with a real trip in them. The three domestic rungs (local/regional/national, $60-900 a
 *  trip) are a drive across the county and he is already there; the J family upward is the fare the
 *  cancelled `coachTravelsFrom` threshold was about. */
const TRAVELLED: readonly TierId[] = TIER_LADDER.slice(TIER_LADDER.indexOf('j30'))
/** The four rungs the confound lives on – where a better rank promotes her and the opener pays 10. */
const BIG: readonly TierId[] = ['wta250', 'wta500', 'wta1000', 'slam']

interface Arm {
  id: string
  label: string
  /** multiplies TIERS[t].travelCostCents on TRAVELLED rungs by (1 + this) */
  fare: number
  /** added to ECONOMY.coach.developmentFactor[cell.coachTier] */
  dev: number
  /** added to BOTH ends of the cell's coach corridor, pp per match */
  edgePp: number
  /** zero the two POSITIVE run-fatigue ladders (the deep one is already negative – left alone) */
  ladderOff: boolean
}

const ARMS: Arm[] = [
  { id: 'ctl', label: 'control (shipped)', fare: 0, dev: 0, edgePp: 0, ladderOff: false },
  { id: 'a1-cost', label: 'A1 fare only', fare: FARE_SHARE, dev: 0, edgePp: 0, ladderOff: false },
  { id: 'a1-gain', label: 'A1 skill only (ceiling)', fare: 0, dev: DEV_UPLIFT, edgePp: 0, ladderOff: false },
  { id: 'a1-both', label: 'A1 the boolean', fare: FARE_SHARE, dev: DEV_UPLIFT, edgePp: 0, ladderOff: false },
  { id: 'a2-ceiling', label: 'A2 ladder ceiling', fare: 0, dev: 0, edgePp: 0, ladderOff: true },
  { id: 'a3-small', label: 'A3 edge +0.5pp', fare: 0, dev: 0, edgePp: 0.5, ladderOff: false },
  { id: 'a3-big', label: 'A3 edge +3.0pp', fare: 0, dev: 0, edgePp: 3.0, ladderOff: false },
]

/** THE CELLS. `wealthy · elite` first and foremost, because THAT is the cell the cancelled record's
 *  headline is about («elite results got WORSE»); `middle · middle` second, so the verdict is not a
 *  fact about one corner of the wealth corridor. */
const CELLS: { id: string; background: FamilyBackground; coachTier: CoachTier }[] = [
  { id: 'elite', background: 'wealthy', coachTier: 'elite' },
  { id: 'middle', background: 'middle', coachTier: 'middle' },
]

// -------------------------------------------------------------------------------------------------
// PATCH AND RESTORE – captured at import, asserted after every run
// -------------------------------------------------------------------------------------------------
type Cond = { runFatigueLadder: number[]; runFatigueLadderWta: number[]; runFatigueLadderDeep: number[] }
const COND = ECONOMY.condition as unknown as Cond
const DEV_FACTOR = ECONOMY.coach.developmentFactor

const SHIPPED = {
  corridors: Object.fromEntries(
    Object.entries(COACH_EDGE_CORRIDOR_PP).map(([t, c]) => [t, [c[0], c[1]] as [number, number]]),
  ) as Record<CoachTier, [number, number]>,
  dev: { ...DEV_FACTOR },
  travel: Object.fromEntries(TIER_LADDER.map((t) => [t, [...TIERS[t].travelCostCents] as [number, number]])) as Record<
    TierId,
    [number, number]
  >,
  ladder: [...COND.runFatigueLadder],
  ladderWta: [...COND.runFatigueLadderWta],
  ladderDeep: [...COND.runFatigueLadderDeep],
}

function withArm<T>(arm: Arm, tier: CoachTier, fn: () => T): T {
  try {
    if (arm.fare > 0) {
      for (const t of TRAVELLED) {
        const [lo, hi] = SHIPPED.travel[t]
        TIERS[t].travelCostCents = [Math.round(lo * (1 + arm.fare)), Math.round(hi * (1 + arm.fare))]
      }
    }
    if (arm.dev !== 0) DEV_FACTOR[tier] = SHIPPED.dev[tier] + arm.dev
    if (arm.edgePp !== 0) {
      const [lo, hi] = SHIPPED.corridors[tier]
      COACH_EDGE_CORRIDOR_PP[tier] = [lo + arm.edgePp, hi + arm.edgePp]
    }
    if (arm.ladderOff) {
      // ⚠ THE DEEP LADDER IS NOT TOUCHED. It is [-2, -1, 0] – already a DISCOUNT – so zeroing it
      // would make this arm a PENALTY on the two rungs that matter most, and the arm would then be
      // measuring the opposite of the mechanic it is named for.
      //
      // ⚠⚠ AND THIS IS THE ONE ARM THAT CANNOT BE SCOPED TO HER. `runFatigueExtra` is deliberately
      // shared with the rival cohort ("the ladder must apply to BOTH sides or a deep run would grind
      // only the player" – engine/condition.ts), so zeroing it makes the whole WORLD fresher, not
      // her. That means this arm UNDER-states a kid-only discount and its Δ is a cross-check, never
      // the verdict; the verdict on arm 2 is the arithmetic in the header, which bounds a kid-only
      // version at 6 points a junior run / 4 a W one / −3 on the two deep rungs regardless of who
      // else gets it. Scoping it to her would need an engine hook, and this file ships none.
      COND.runFatigueLadder = SHIPPED.ladder.map(() => 0)
      COND.runFatigueLadderWta = SHIPPED.ladderWta.map(() => 0)
    }
    return fn()
  } finally {
    for (const t of TIER_LADDER) TIERS[t].travelCostCents = [...SHIPPED.travel[t]] as [number, number]
    Object.assign(DEV_FACTOR, SHIPPED.dev)
    Object.assign(COACH_EDGE_CORRIDOR_PP, SHIPPED.corridors)
    COND.runFatigueLadder = [...SHIPPED.ladder]
    COND.runFatigueLadderWta = [...SHIPPED.ladderWta]
    COND.runFatigueLadderDeep = [...SHIPPED.ladderDeep]
  }
}

function assertRestored(): void {
  const bad: string[] = []
  for (const t of TIER_LADDER) {
    const [lo, hi] = TIERS[t].travelCostCents
    if (lo !== SHIPPED.travel[t][0] || hi !== SHIPPED.travel[t][1]) bad.push(`TIERS.${t}.travelCostCents`)
  }
  for (const t of Object.keys(SHIPPED.dev) as CoachTier[]) {
    if (DEV_FACTOR[t] !== SHIPPED.dev[t]) bad.push(`developmentFactor.${t}`)
    const c = COACH_EDGE_CORRIDOR_PP[t]
    if (c[0] !== SHIPPED.corridors[t][0] || c[1] !== SHIPPED.corridors[t][1]) bad.push(`corridor.${t}`)
  }
  const same = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x, i) => x === b[i])
  if (!same(COND.runFatigueLadder, SHIPPED.ladder)) bad.push('runFatigueLadder')
  if (!same(COND.runFatigueLadderWta, SHIPPED.ladderWta)) bad.push('runFatigueLadderWta')
  if (!same(COND.runFatigueLadderDeep, SHIPPED.ladderDeep)) bad.push('runFatigueLadderDeep')
  if (bad.length) {
    console.error(`FATAL: knobs not restored -> ${bad.join(', ')}`)
    process.exit(1)
  }
}

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
const pad = (s: string | number, w: number): string => String(s).padStart(w)
const padEnd = (s: string | number, w: number): string => String(s).padEnd(w)
const money = (c: number): string => `${c < 0 ? '-' : ''}$${Math.abs(Math.round(c / 100)).toLocaleString('en-US')}`
const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
function med(xs: readonly number[]): number {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
const share = (hits: number, of: number): string => (of === 0 ? '–' : `${((100 * hits) / of).toFixed(1)}%`)

// -------------------------------------------------------------------------------------------------
// ONE CAREER
// -------------------------------------------------------------------------------------------------
interface Career {
  index: number
  weeks: number
  ending: string | null
  bankrupt: boolean
  /** best WTA rank ever held once she had been paid at all (wall-l1-bench's own reading) */
  bestWta: number | null
  endWta: number | null
  peakWtaPoints: number
  matchesWon: number
  matchesLost: number
  /** total skill points across the five wings */
  skillsAt: { a18: number | null; a22: number | null; end: number }
  peakSkills: number
  prizeCents: number
  endFundsCents: number
  travelCents: number
  entryCents: number
  coachBillCents: number
  entriesByTier: Partial<Record<TierId, number>>
  /** per big rung: entries, opener losses, ranking points banked */
  big: Partial<Record<TierId, { entries: number; openerLosses: number; points: number }>>
  /** her WTA rank the week she committed to each big-rung entry */
  rankAtBigEntry: number[]
}

function runCareer(cell: (typeof CELLS)[number], index: number): Career {
  const preset: Preset = { label: cell.id, background: cell.background, coachTier: cell.coachTier }
  const { world, rng, seed } = openCareer(preset, index, POLICIES[1])
  // ⚠ HER TALENT IS READ, NOT USED, AND THAT IS ON PURPOSE. Both calls run on purpose-scoped
  // sub-streams (`startingSkills` off the seed, `rollPotential` off it in turn), so neither touches
  // MAIN and neither can move a career – they are here so this file makes the same reads
  // wall-l1-bench makes at the same point, which is what lets the two benches be compared row for
  // row. Peak skill is read off `world.skills` below instead, because "how good did she get" is a
  // fact about the career and not about the draw she was born with.
  const start = startingSkills(seed, world.profile)
  rollPotential(seed, start)
  const skillsSum = (): number => SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0)

  const entriesByTier: Partial<Record<TierId, number>> = {}
  const big: Career['big'] = {}
  const rankAtBigEntry: number[] = []
  const skillsAt = { a18: null as number | null, a22: null as number | null, end: 0 }
  let peakSkills = 0
  let bestWta: number | null = null
  let peakWtaPoints = 0
  let travelCents = 0
  let entryCents = 0
  let coachBillCents = 0
  let matchesWon = 0
  let matchesLost = 0
  const seenFinance = new Set<number>()
  const seenResults = new Set<string>()
  let weeks = 0

  const scanFinance = (): void => {
    for (const fw of world.financeWeeks) {
      if (seenFinance.has(fw.week)) continue
      seenFinance.add(fw.week)
      const by = fw.byCategory as Partial<Record<WorldEventCategory, number>>
      travelCents += -Math.min(0, by.travel ?? 0)
      entryCents += -Math.min(0, by.entry ?? 0)
      coachBillCents += -Math.min(0, by.coaching ?? 0) - Math.min(0, by.facility ?? 0)
    }
  }
  // ⚠ `world.results` PRUNES AT 52 WEEKS, so this has to run inside the loop and not once at the end –
  // the same reason wall-l1-bench scans every 8 weeks. The dedupe key is week+tier+points, which is
  // unique per row because a week holds at most one committed run.
  const scanResults = (): void => {
    for (const r of world.results) {
      if (r.playerId !== KID_ID || !r.tier || r.mandatoryMiss) continue
      const key = `${r.week}:${r.tier}:${r.points}`
      if (seenResults.has(key)) continue
      seenResults.add(key)
      const table = TIERS[r.tier].points
      const finish = table.indexOf(r.points)
      if (finish < 0) continue
      matchesWon += table.length - 1 - finish
      if (finish > 0) matchesLost += 1
      if (BIG.includes(r.tier)) {
        const rec = (big[r.tier] ??= { entries: 0, openerLosses: 0, points: 0 })
        rec.entries += 1
        rec.points += r.points
        if (finish === table.length - 1) rec.openerLosses += 1
      }
    }
  }

  for (; weeks < WEEKS && world.ending === null; weeks++) {
    const rankBefore = world.kidRankWta
    const entered = stepCareerWeek(world, rng, POLICIES[1])
    for (const t of TIER_LADDER) {
      if (entered[t] > 0) {
        entriesByTier[t] = (entriesByTier[t] ?? 0) + entered[t]
        if (BIG.includes(t)) rankAtBigEntry.push(rankBefore ?? 9999)
      }
    }
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    const r = world.kidRankWta
    if (world.careerTotals.prizeCents > 0 && typeof r === 'number' && (bestWta === null || r < bestWta)) bestWta = r
    const pts = kidPoints(world, 'wta')
    if (pts > peakWtaPoints) peakWtaPoints = pts
    const sk = skillsSum()
    if (sk > peakSkills) peakSkills = sk
    if (weeks % 8 === 0) {
      scanFinance()
      scanResults()
    }
    if (world.week === 4 * WEEKS_PER_YEAR) skillsAt.a18 = sk
    if (world.week === 8 * WEEKS_PER_YEAR) skillsAt.a22 = sk
  }
  scanFinance()
  scanResults()

  const ending = world.ending
  return {
    index,
    weeks,
    ending: ending?.type ?? null,
    bankrupt: ending?.type === 'bankruptcy',
    bestWta,
    endWta: typeof world.kidRankWta === 'number' && world.kidRankWta <= 1600 ? world.kidRankWta : null,
    peakWtaPoints,
    matchesWon,
    matchesLost,
    skillsAt: { ...skillsAt, end: skillsSum() },
    peakSkills,
    prizeCents: world.careerTotals.prizeCents,
    endFundsCents: world.fundsCents,
    travelCents,
    entryCents,
    coachBillCents,
    entriesByTier,
    big,
    rankAtBigEntry,
  }
}

interface ArmResult {
  cell: string
  arm: string
  careers: Career[]
}

// -------------------------------------------------------------------------------------------------
// RUN
// -------------------------------------------------------------------------------------------------
function runAll(outDir: string): void {
  mkdirSync(outDir, { recursive: true })
  const t0 = Date.now()
  for (const cell of CELLS) {
    for (const arm of ARMS) {
      const file = join(outDir, `${cell.id}__${arm.id}.json`)
      let onDisk = false
      try {
        readFileSync(file)
        onDisk = true
      } catch {
        onDisk = false
      }
      if (onDisk) {
        console.log(`${padEnd(`${cell.id}/${arm.id}`, 24)} already on disk – skipped`)
        continue
      }
      const t1 = Date.now()
      const careers = withArm(arm, cell.coachTier, () =>
        Array.from({ length: SEEDS }, (_, i) => runCareer(cell, i)),
      )
      assertRestored()
      writeFileSync(file, JSON.stringify([{ cell: cell.id, arm: arm.id, careers }] satisfies ArmResult[]))
      console.log(
        `${padEnd(`${cell.id}/${arm.id}`, 24)} ${SEEDS} careers in ${((Date.now() - t1) / 1000).toFixed(0)}s`,
      )
    }
  }
  console.log(`\nall arm-cells done in ${((Date.now() - t0) / 60000).toFixed(1)} min -> ${outDir}`)
}

// -------------------------------------------------------------------------------------------------
// REPORT
// -------------------------------------------------------------------------------------------------
function load(dir: string): ArmResult[] {
  const out: ArmResult[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    out.push(...(JSON.parse(readFileSync(join(dir, f), 'utf8')) as ArmResult[]))
  }
  return out
}

function bigOf(cs: Career[], k: 'entries' | 'openerLosses' | 'points'): number {
  let n = 0
  for (const c of cs) for (const t of BIG) n += c.big[t]?.[k] ?? 0
  return n
}

function report(dir: string): void {
  const all = load(dir)
  const byCell = new Map<string, Map<string, Career[]>>()
  for (const r of all) {
    const m = byCell.get(r.cell) ?? new Map<string, Career[]>()
    m.set(r.arm, r.careers)
    byCell.set(r.cell, m)
  }
  console.log(
    `coach-travel-bench · rebuilt player policy (POLICIES[1]) · ${WEEKS} weeks (14 -> ${14 + Math.round(WEEKS / 52)}) · same seeds/worlds/talent per arm\n` +
      `fare +${(100 * FARE_SHARE).toFixed(0)}% on ${TRAVELLED.length} travelled rungs · dev uplift +${DEV_UPLIFT} (CEILING) · edge shifts +0.5 / +3.0 pp\n`,
  )

  for (const [cellId, arms] of byCell) {
    const cell = CELLS.find((c) => c.id === cellId)!
    const ctl = arms.get('ctl')
    console.log(`\n${'='.repeat(132)}`)
    console.log(`CELL ${cellId}  –  ${cell.background} family, ${cell.coachTier} coach  ·  corridor ${SHIPPED.corridors[cell.coachTier].join('-')} pp`)
    console.log('='.repeat(132))
    console.log(
      `${padEnd('arm', 24)}${pad('rank p50', 10)}${pad('best p50', 10)}${pad('top100', 8)}${pad('ranked', 8)}` +
        `${pad('prize p50', 12)}${pad('funds p50', 12)}${pad('peak skill', 11)}${pad('wins', 7)}${pad('losses', 8)}${pad('bankrupt', 9)}`,
    )
    for (const arm of ARMS) {
      const cs = arms.get(arm.id)
      if (!cs) continue
      const ends = cs.map((c) => c.endWta).filter((x): x is number => x !== null)
      const bests = cs.map((c) => c.bestWta).filter((x): x is number => x !== null)
      console.log(
        `${padEnd(arm.label, 24)}${pad(ends.length ? `#${med(ends)}` : '–', 10)}${pad(bests.length ? `#${med(bests)}` : '–', 10)}` +
          `${pad(share(cs.filter((c) => c.bestWta !== null && c.bestWta <= 100).length, cs.length), 8)}` +
          `${pad(share(ends.length, cs.length), 8)}` +
          `${pad(money(med(cs.map((c) => c.prizeCents))), 12)}${pad(money(med(cs.map((c) => c.endFundsCents))), 12)}` +
          `${pad(mean(cs.map((c) => c.peakSkills)).toFixed(1), 11)}${pad(mean(cs.map((c) => c.matchesWon)).toFixed(1), 7)}` +
          `${pad(mean(cs.map((c) => c.matchesLost)).toFixed(1), 8)}${pad(cs.filter((c) => c.bankrupt).length, 9)}`,
      )
    }

    if (!ctl) continue
    console.log(`\nPAIRED AGAINST THE CONTROL, SAME SEED (Δ rank negative = better; b/w/t on best rank)`)
    console.log(
      `${padEnd('arm', 24)}${pad('Δbest rank', 12)}${pad('b/w/t', 10)}${pad('Δwins', 9)}${pad('Δpeak skill', 13)}` +
        `${pad('Δprize', 13)}${pad('Δfunds', 13)}${pad('Δtravel', 12)}${pad('Δspend', 12)}`,
    )
    for (const arm of ARMS) {
      if (arm.id === 'ctl') continue
      const cs = arms.get(arm.id)
      if (!cs) continue
      const dRank: number[] = []
      const dWins: number[] = []
      const dSkill: number[] = []
      const dPrize: number[] = []
      const dFunds: number[] = []
      const dTravel: number[] = []
      /** ⚠ NOT "the price of the arm" – it is every outgoing, so it carries the family's BEHAVIOURAL
       *  response too (an arm that wins more plays more, and playing more costs more). Read it beside
       *  Δtravel, which for `a1-cost` IS the fare and nothing else. */
      const dSpend: number[] = []
      let b = 0
      let w = 0
      let t = 0
      for (const c of cs) {
        const o = ctl.find((x) => x.index === c.index)
        if (!o) continue
        const cr = c.bestWta ?? 9999
        const orr = o.bestWta ?? 9999
        if (cr < orr) b++
        else if (cr > orr) w++
        else t++
        if (c.bestWta !== null && o.bestWta !== null) dRank.push(c.bestWta - o.bestWta)
        dWins.push(c.matchesWon - o.matchesWon)
        dSkill.push(c.peakSkills - o.peakSkills)
        dPrize.push(c.prizeCents - o.prizeCents)
        dFunds.push(c.endFundsCents - o.endFundsCents)
        dTravel.push(c.travelCents - o.travelCents)
        dSpend.push(c.travelCents + c.entryCents + c.coachBillCents - (o.travelCents + o.entryCents + o.coachBillCents))
      }
      console.log(
        `${padEnd(arm.label, 24)}${pad(dRank.length ? mean(dRank).toFixed(1) : '–', 12)}${pad(`${b}/${w}/${t}`, 10)}` +
          `${pad(mean(dWins).toFixed(1), 9)}${pad(mean(dSkill).toFixed(2), 13)}${pad(money(med(dPrize)), 13)}` +
          `${pad(money(med(dFunds)), 13)}${pad(money(med(dTravel)), 12)}${pad(money(med(dSpend)), 12)}`,
      )
    }

    console.log(`\nTHE CONFOUND – where a bonus sends her, and what that rung pays (all careers pooled)`)
    console.log(
      `${padEnd('arm', 24)}${pad('big entries', 13)}${pad('opener losses', 15)}${pad('pts/entry', 11)}` +
        `${pad('rank@entry p50', 16)}${pad('W-track entries', 17)}${pad('junior entries', 16)}`,
    )
    for (const arm of ARMS) {
      const cs = arms.get(arm.id)
      if (!cs) continue
      const ent = bigOf(cs, 'entries')
      const ranks = cs.flatMap((c) => c.rankAtBigEntry).filter((r) => r < 9999)
      const wTrack = cs.reduce(
        (n, c) => n + TIER_LADDER.filter((t) => TIERS[t].track === 'wta').reduce((m, t) => m + (c.entriesByTier[t] ?? 0), 0),
        0,
      )
      const junior = cs.reduce(
        (n, c) => n + (['j30', 'j60', 'j300'] as TierId[]).reduce((m, t) => m + (c.entriesByTier[t] ?? 0), 0),
        0,
      )
      console.log(
        `${padEnd(arm.label, 24)}${pad(ent, 13)}${pad(`${bigOf(cs, 'openerLosses')} (${share(bigOf(cs, 'openerLosses'), ent)})`, 15)}` +
          `${pad(ent ? (bigOf(cs, 'points') / ent).toFixed(1) : '–', 11)}${pad(ranks.length ? `#${med(ranks)}` : '–', 16)}` +
          `${pad(wTrack, 17)}${pad(junior, 16)}`,
      )
    }
  }
}

// -------------------------------------------------------------------------------------------------
function main(): void {
  const out = flag('out')
  const rep = flag('report')
  if (out) runAll(out)
  else if (rep) report(rep)
  else throw new Error('one of --out <dir> | --report <dir>')
  assertRestored()
}

main()
