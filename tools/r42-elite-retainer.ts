/**
 * r42-elite-retainer – ROUND 42 #19. THE ELITE TAIL, RE-PRICED AGAINST HIS OWN RESEARCH.
 *
 * THE OWNER: «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не существует. И то же
 * про элит рекавери… 2900», and then «у нас есть исследование и бенч, надо просто цифры проверить и
 * актуализировать». The receipts are docs/research/team-economics-2026-09.md (his 13.09 numbers +
 * our audit) and docs/specs/elite-retainer-2026-09.md, whose §3 table was written BEFORE this file
 * was first run (invariant 5). The measured column goes back into that table.
 *
 * ⚠⚠ FINDING 3.2'S WARNING IS THE HARD CONSTRAINT AND §5 IS ITS PROOF, not a footnote: the raise
 * must reach the elite tail and nothing else. §5 partitions the corpus by whether the career ever
 * entered the band and prints the A-vs-B wallet delta for the ones that never did. A single non-zero
 * cent there is a failure of the whole change, not a tuning note.
 *
 * THE ARMS, on identical seeds and presets:
 *   A · BEFORE     retainerBandByRank = []           – no band anywhere; today's shipped prices.
 *   B1 · BAND ONLY the shipped rows (4.5 / 2.0)      – what this item ships.
 *   B · + CLINIC   B1 plus `uniformPrice` on the elite recovery rung – a proposal the §5 row below
 *                  REFUSED: it moves 4 of 20 mid-careers. Kept so the refusal is re-runnable.
 *   0 · ACTUATION  a single row {atOrBetter: 1e9, factor: 50} – an absurd band that reaches EVERY
 *                  career. If §5's «byte-identical» columns do not explode under this arm, the
 *                  instrument is not reading the thing it claims to read and every table above it is
 *                  a null («prove the arm», CLAUDE.md).
 *
 * ⚠ THE ARMS ARE BUILT BY MUTATING `ECONOMY.coach.retainerBandByRank` IN PLACE, which is the house
 * bench pattern (`tools/r42-coach-every-cheque.ts` does the same to `ECONOMY.staffShare`). The A arm
 * is therefore the real tree with the rows emptied, NOT a worktree at an older commit – which is the
 * arm-provenance rule stated the other way round: both arms contain the reader, and only the
 * constant differs.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A figure with no denominator
 * prints `–`, never `0.0`.
 *
 * Run:  npx vite-node tools/r42-elite-retainer.ts
 *       npx vite-node tools/r42-elite-retainer.ts -- --seeds 2 --weeks 400
 */
import { ECONOMY, vacationPriceCents } from '../src/engine/economy'
import { bandedRateCents, coachRetainerBand, coachRateBandCents, facilityRateCents, coachHoursForPlan } from '../src/engine/coach'
import { financeWindow } from '../src/engine/world'
import { kidLadderRank } from '../src/engine/world/ladder'
import type { CoachTier, FamilyBackground, WeekPlan } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET; n = seeds x 9 careers per arm. */
const SEEDS = argOf('seeds', 4)
/** 600 weeks = 14 -> 25.5, the horizon the every-cheque bench used for the same question. */
const WEEKS = argOf('weeks', 600)
/** ⚠ `POLICIES[1]` ('player'), item 25's own choice inherited on purpose – the 'grinder' arm keeps no
 *  reserve and bankrupts most of the corpus, which makes every corridor a question about who died
 *  first. */
const POLICY = POLICIES[1]

const m = (c: number): string => `$${Math.round(c / 100).toLocaleString('en-US')}`
const padL = (s: string, n: number): string => s.padStart(n)
const padR = (s: string, n: number): string => s.padEnd(n)
const med = (xs: number[]): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const pct = (num: number, den: number): string => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '–')

// =================================================================================================
// THE ARMS
// =================================================================================================

type Row = { atOrBetter: number; factor: number }
/** ⚠ `ECONOMY` is `as const`; an arm reaches it through the cast the house benches already use. */
const BANDS = ECONOMY.coach.retainerBandByRank as unknown as Row[]
const SHIPPED: Row[] = BANDS.map((r) => ({ ...r }))

interface Arm {
  label: string
  rows: Row[]
  /** ⚠ THE SECOND CHANGE IS ITS OWN AXIS, and it has to be, or §5 cannot attribute. A career that
   *  never enters the rank band but DOES book an elite clinic week would move under a combined arm,
   *  and the byte-identical claim would read as broken when what actually moved was a vacation. */
  vacationUniform: boolean
}
const BEFORE: Arm = { label: 'A · BEFORE (nothing)', rows: [], vacationUniform: false }
const BAND_ONLY: Arm = { label: 'B1 · BAND ONLY (4.5 / 2.0)', rows: SHIPPED, vacationUniform: false }
/** ⚠⚠ THE CLINIC HALF OF THIS ARM IS A **REFUSED** PROPOSAL AND THE ARM IS THE RECEIPT. Nothing on
 *  the tree sets `uniformPrice`; this arm switches it on so the refusal can be re-measured rather
 *  than quoted. Its §5 row against B1's is the whole evidence: the rank band moves 0 of 20
 *  mid-careers, the band plus the clinic moves 4 of 20. */
const AFTER: Arm = { label: 'B · band + clinic (clinic REFUSED)', rows: SHIPPED, vacationUniform: true }
/** ⚠⚠ THE ACTUATION ARM REACHES EVERY RANKED CAREER ON PURPOSE. A band that only fires in the tail
 *  cannot prove that §5's untouched column is untouched BECAUSE of the gate rather than because the
 *  instrument reads nothing. */
const ABSURD: Arm = { label: '0 · ACTUATION (x50, everyone)', rows: [{ atOrBetter: 1_000_000_000, factor: 50 }], vacationUniform: false }

/** ⚠ `ECONOMY` is `as const`; the elite package is reached through the same cast the rows are. */
const ELITE_PKG = ECONOMY.vacation.packages.find((p) => p.id === 'elite') as unknown as { uniformPrice?: true }

function setArm(arm: Arm): void {
  BANDS.length = 0
  for (const r of arm.rows) BANDS.push({ ...r })
  if (arm.vacationUniform) ELITE_PKG.uniformPrice = true
  else delete ELITE_PKG.uniformPrice
}

// =================================================================================================
// §0 – THE PRICE TABLE, AS PURE ARITHMETIC. No career walk; this is his two figures reproduced.
// =================================================================================================

const BALANCED: WeekPlan = { train: 75, rest: 25 } as WeekPlan
const AGE_LABEL = ['12-16', '17-22', '23+']
const AGE_AT: number[] = [14, 19, 24]

function section0(): void {
  console.log('\n================================================================================')
  console.log('§0  THE LADDER AS PURE ARITHMETIC – the balanced plan, %d sessions a week, uniform corridor', coachHoursForPlan(BALANCED))
  console.log('================================================================================')
  console.log('    His «$830 a week» is the elite 12-16 band at a rate drawn near its middle.')
  console.log('    LABOUR = the coach line after the court is taken out (weeklyBillSplit\'s own split).')
  console.log('')
  const hours = coachHoursForPlan(BALANCED)
  const tiers: CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']
  console.log(`${padR('rung', 8)}${padR('age', 8)}${padL('rate/h', 10)}${padL('court/h', 10)}${padL('labour/wk', 12)}${padL('labour/yr', 12)}${padL('x2.0 /yr', 12)}${padL('x4.5 /yr', 12)}`)
  for (const tier of tiers) {
    for (let b = 0; b < 3; b++) {
      const [lo, hi] = coachRateBandCents(tier, AGE_AT[b])
      const rate = (lo + hi) / 2
      const court = facilityRateCents(AGE_AT[b], tier)
      const labourWk = (rate - court) * hours
      const at = (band: number): number => (bandedRateCents(Math.round(rate), AGE_AT[b], tier, band) - court) * hours * 52
      console.log(
        padR(tier, 8) + padR(AGE_LABEL[b], 8) + padL(m(rate), 10) + padL(m(court), 10) +
        padL(m(labourWk), 12) + padL(m(labourWk * 52), 12) + padL(tier === 'self' ? '–' : m(at(2.0)), 12) + padL(tier === 'self' ? '–' : m(at(4.5)), 12),
      )
    }
  }
  console.log('\n    RESEARCH (team-economics §1): top-100 coach ≈ $90k/yr · top-10 $150-250k · star $300-500k+')
  console.log('    RESEARCH (§4): sparring partner $50-80k/yr + full travel.')

  console.log('\n--- his second figure: the ELITE RECOVERY rung, per background ---')
  console.log('    (one quote per background at a fixed seed/week; the band is $4,000-7,000)')
  const backgrounds: FamilyBackground[] = ['working', 'middle', 'wealthy']
  for (const id of ['resort', 'elite']) {
    const cells = backgrounds.map((bg) => {
      // ⚠ Averaged over 40 weeks: ONE quote is one draw off one sub-stream and would report the
      // draw, not the price. The corridor is what this table is about, so it needs the mean.
      let sum = 0
      for (let w = 100; w < 140; w++) sum += vacationPriceCents('r42-retainer-probe', w, id, bg)
      return sum / 40
    })
    console.log(`  ${padR(id, 10)}` + backgrounds.map((bg, i) => `${bg} ${m(cells[i])}`).map((s) => padL(s, 22)).join(''))
  }
}

// =================================================================================================
// THE WALK – one arm over the whole corpus, collecting per-season and per-career rows.
// =================================================================================================

interface SeasonRow { rank: number; gross: number; prize: number; team: number; retainer: number; share: number; vacation: number }
interface CareerRow {
  key: string
  background: string
  endFundsCents: number
  bestRank: number
  everInBand: boolean
  bankrupt: boolean
  seasons: SeasonRow[]
}

function walk(arm: Arm): CareerRow[] {
  setArm(arm)
  const out: CareerRow[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < SEEDS; i++) {
      const { world, rng } = openCareer(preset, i, POLICY)
      const seasons: SeasonRow[] = []
      let bestRank = Number.POSITIVE_INFINITY
      let everInBand = false
      for (let w = 0; w < WEEKS; w++) {
        stepCareerWeek(world, rng, POLICY)
        const r = kidLadderRank(world, 'wta')
        if (r !== null) {
          if (r < bestRank) bestRank = r
          // ⚠ THE BAND MEMBERSHIP IS ASKED OF THE SHIPPED ROWS AND NOT OF THE ARM'S, so the same
          // careers are partitioned in every arm. Asking the ARM would put every career in the band
          // under the actuation run and empty §5 exactly when it is doing its job.
          if (coachRetainerBandOfRows(SHIPPED, r) !== 1) everInBand = true
        }
        if ((w + 1) % 52 === 0) {
          const fold = financeWindow(world.financeWeeks, Math.max(0, world.week - 52))
          const c = (k: string): number => fold.byCategory[k as never] ?? 0
          const rank = kidLadderRank(world, 'wta')
          if (rank !== null) {
            const prize = c('prize')
            const retainer = -(c('coaching') + c('facility'))
            const share = -c('staff')
            seasons.push({ rank, prize, gross: prize + c('sponsor'), team: retainer + share, retainer, share, vacation: -c('vacation') })
          }
        }
      }
      out.push({
        key: `${preset.label}#${i}`,
        background: preset.background,
        endFundsCents: world.fundsCents,
        bestRank,
        everInBand,
        bankrupt: world.ending?.type === 'bankruptcy' || world.fundsCents < 0,
        seasons,
      })
    }
  }
  return out
}

/** `coachRetainerBand` against an explicit row list – the partition needs the SHIPPED rows while the
 *  world is running an arm's. Same walk, same first-match-wins order. */
function coachRetainerBandOfRows(rows: Row[], rank: number): number {
  for (const row of rows) if (rank <= row.atOrBetter) return row.factor
  return 1
}

// =================================================================================================
// THE REPORT
// =================================================================================================

const RANK_BANDS: [string, number][] = [['#1-3', 3], ['#4-10', 10], ['#11-25', 25], ['#26-50', 50], ['#51-100', 100], ['#101-200', 200], ['#201+', 1e9]]

function seasonTable(label: string, rows: CareerRow[]): void {
  const all = rows.flatMap((r) => r.seasons)
  console.log(`\n  ${label}   (n season-rows = ${all.length})`)
  console.log(`  ${padR('band', 10)}${padL('n', 5)}${padL('med gross', 14)}${padL('med retainer', 14)}${padL('med share', 12)}${padL('med team', 12)}${padL('team % gross', 14)}`)
  let lo = 0
  for (const [bandLabel, hi] of RANK_BANDS) {
    const b = all.filter((r) => r.rank > lo && r.rank <= hi)
    lo = hi
    if (b.length === 0) { console.log(`  ${padR(bandLabel, 10)}${padL('0', 5)}${padL('–', 14)}`); continue }
    const gross = med(b.map((r) => r.gross))
    console.log(
      `  ${padR(bandLabel, 10)}${padL(String(b.length), 5)}${padL(m(gross), 14)}${padL(m(med(b.map((r) => r.retainer))), 14)}` +
      `${padL(m(med(b.map((r) => r.share))), 12)}${padL(m(med(b.map((r) => r.team))), 12)}${padL(pct(med(b.map((r) => r.team)), gross), 14)}`,
    )
  }
}

function main(): void {
  section0()

  console.log('\n================================================================================')
  console.log(`§1-2  THE TEAM'S BILL, BEFORE AND AFTER   (${PRESETS.length} presets x ${SEEDS} seeds x ${WEEKS} weeks, policy '${POLICY.label}')`)
  console.log('================================================================================')
  const before = walk(BEFORE)
  const bandOnly = walk(BAND_ONLY)
  const after = walk(AFTER)
  seasonTable(BEFORE.label, before)
  seasonTable(AFTER.label, after)

  console.log('\n================================================================================')
  console.log('§3  WHO ACTUALLY BUYS A CLINIC WEEK – the elite recovery rung against finding 3.2')
  console.log('================================================================================')
  console.log('    The rung costs $4,000-7,000 AFTER the change. A season whose whole vacation bill')
  console.log('    never reaches that floor cannot have bought it, whatever the corridor was.')
  for (const bg of ['working', 'middle', 'wealthy']) {
    const seasons = before.filter((c) => c.background === bg).flatMap((c) => c.seasons).filter((s2) => s2.vacation > 0)
    const max = seasons.length ? Math.max(...seasons.map((s2) => s2.vacation)) : 0
    const over = seasons.filter((s2) => s2.vacation >= 4000_00).length
    console.log(`  ${padR(bg, 10)} seasons with a vacation bill ${padL(String(seasons.length), 4)}   median ${padL(m(med(seasons.map((s2) => s2.vacation))), 10)}   max ${padL(m(max), 10)}   >= $4,000: ${over}`)
  }

  console.log('\n================================================================================')
  console.log('§5  THE MIDDLE DID NOT MOVE – the hard constraint (finding 3.2)')
  console.log('================================================================================')
  const absurd = walk(ABSURD)
  const partition = (armRows: CareerRow[], armLabel: string): void => {
    const untouched = before.filter((b, i) => !b.everInBand && armRows[i])
    const touched = before.filter((b) => b.everInBand)
    let worstUntouched = 0
    let movedUntouched = 0
    for (let i = 0; i < before.length; i++) {
      if (before[i].everInBand) continue
      const d = Math.abs(armRows[i].endFundsCents - before[i].endFundsCents)
      if (d > 0) movedUntouched++
      if (d > worstUntouched) worstUntouched = d
    }
    let worstTouched = 0
    let movedTouched = 0
    for (let i = 0; i < before.length; i++) {
      if (!before[i].everInBand) continue
      const d = Math.abs(armRows[i].endFundsCents - before[i].endFundsCents)
      if (d > 0) movedTouched++
      if (d > worstTouched) worstTouched = d
    }
    console.log(`  ${padR(armLabel, 32)} never-in-band ${movedUntouched}/${untouched.length} moved, worst ${m(worstUntouched)}   ` +
      `in-band ${movedTouched}/${touched.length} moved, worst ${m(worstTouched)}`)
  }
  console.log(`  partition: ${before.filter((b) => b.everInBand).length} careers ever inside the shipped band, ` +
    `${before.filter((b) => !b.everInBand).length} never.`)
  partition(bandOnly, 'B1 · BAND ONLY vs A')
  partition(after, 'B · BAND + CLINIC vs A')
  partition(absurd, '0 · ACTUATION vs A')
  console.log('  ⚠ the ACTUATION row must show a LARGE in-band move, or §5 is reading nothing.')
  console.log('  ⚠ B1\'s never-in-band column must be 0/0 moved – THAT is finding 3.2\'s constraint.')
  console.log('  ⚠ B minus B1 on that column is the clinic rung\'s own reach, and is its own decision.')

  console.log('\n--- survival (P5) ---')
  for (const [label, rows] of [[BEFORE.label, before], [BAND_ONLY.label, bandOnly], [AFTER.label, after], [ABSURD.label, absurd]] as [string, CareerRow[]][]) {
    console.log(`  ${padR(label, 32)} bankrupt ${rows.filter((r) => r.bankrupt).length}/${rows.length}   median end funds ${m(med(rows.map((r) => r.endFundsCents)))}`)
  }

  // ⚠ RESTORE **TO THE SHIPPED STATE**, which is the band rows and NO clinic flag - not to `AFTER`,
  // whose clinic half is a refused proposal. A bench that left the arm set would poison anything
  // imported after it, and here it would also leave the tree describing a change nobody took.
  setArm(BAND_ONLY)
  console.log(`\n  (arm restored to shipped: ${JSON.stringify(BANDS)}; sanity: band at #5 = ${coachRetainerBand(5)}, #50 = ${coachRetainerBand(50)}, #500 = ${coachRetainerBand(500)}, unranked = ${coachRetainerBand(null)})`)
}

main()
