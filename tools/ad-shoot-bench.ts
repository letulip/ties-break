// THE AD-SHOOT BENCH (the-face-and-the-court.md §6 step 2) - `npx vite-node tools/ad-shoot-bench.ts`.
// Same shape as the summer / knock / econ benches: a measurement harness, run by hand, never a gate.
//
// THE OWNER'S RULING IS THE SPECIFICATION (22.08): «съемки должны быть иногда и это надо как-то
// прописывать и отражать потом в свободных неделях, соответственно и восстановления на тех неделях
// должно быть чуть меньше» - two shoot weeks per Quiet Hour term, in-season, named at the
// signature, each recovering like a TRAVEL week rather than a rest week. Three questions, and the
// plan's own bar for the step («a bench shows the season it costs, measured in weeks not lost»):
//
//   (a) WHAT DOES ONE SHOOT WEEK COST? The condition delta a shoot week introduces against the
//       same career without the deal - predicted: the rest week's whole return (base 8 + slider
//       0-2, light = 10) forfeited when she carries a deficit, clamped away at the ceiling (the
//       summer bench's own lesson: a cost in foregone recovery is invisible on a fresh body).
//   (b) IS TWO A YEAR FELT? The term's total cost in condition points, expressed in the game's own
//       units: rest-week equivalents and average-event drains (~12.5, fatigue-reprice spec §1).
//       And the bar's other half, WEEKS NOT LOST: the deal blocks nothing by construction - both
//       arms must play the same calendar, so the played-event counts are printed side by side.
//   (c) IS AN OFF-SEASON LANDING IMPOSSIBLE? The construction swept wide: every drawn pair
//       in-season, never adjacent, inside the term, never before the lead.
//
// METHOD (a/b). The same career, seed for seed, cloned at the letter: one twin SIGNS, one REFUSES,
// and both walk the identical 52 weeks. Signing draws only on `seed:ad:shoots:<week>` (a
// sub-stream), so the two arms tap byte-identical MAIN sequences and every divergence downstream
// of the first shoot is the shoots' own (condition feeds the injury threshold, so late-term drift
// is the system working, not noise in the harness - the per-week introduction is read at the first
// shoot, before any divergence exists).
import {
  acceptOffer,
  createWorld,
  declineOffer,
  enterEvent,
  closeTournament,
  kidAgeYears,
  recomputeKidRank,
  revealTournamentRound,
  tickWeek,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { adWritesAt, chooseShootWeeks } from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { isOffSeasonWeek } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AdOfferTerms, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising
/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20) AND THEN A PORTFOLIO (part four
 *  P6/§8), so the shipped rung's numbers moved twice: first into `advertising.houses.watch`, now
 *  into the watches CATEGORY's bottom-band cell. Every claim in this file is about that one deal –
 *  a watchmaker, $20,000, two shoot weeks over a one-year term – so it is REPOINTED and not
 *  re-aimed: `AD` still carries the mechanics every house shares (the age bar, the weekly chance,
 *  the decide weeks, the lead, the clash price) and `WATCH` freezes the shipped terms this bench
 *  has always measured. The fee is read off the watches category's ≤200 cell (unchanged to the
 *  cent – the anchor); the two-shoots-per-year ask and the one-year term are the shipped letter's
 *  own and are pinned here as literals exactly because the new bands ask differently. */
const WATCH = {
  // ⚠ index 1 since round 34: a band was prepended at ≤400 and this is still the ≤200 cell
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
  termWeeks: 52,
  shootWeeksPerTerm: 2,
}
const CAREERS = 12
const TERM = WATCH.termWeeks

const ageOf = (w: WorldState) => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)

/** The test fixture's own adult-pro idiom (tests/ad-offer.test.ts): a real career ticked to
 *  eighteen, then given a counting professional standing the way the pro fixtures write one. */
function adultPro(seed: string) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
  world.results.push({ playerId: KID_ID, week: world.week, points: 100_000, tier: 'w100' })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return world
}

function firstRollFrom(seed: string, from: number, limit: number): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance)) return w
  return -1
}

interface Arm {
  cond: number[] // condition at the end of each term week, index 0 = the signing week itself
  played: number
  injuries: number
}

/** One twin's 52 weeks from the decision, racing everything the gate allows (the summer bench's
 *  own arm: a cost in foregone recovery is only visible on a body carrying a season). */
function walkTerm(world: WorldState, racing: boolean): Arm {
  const rng = resumeMain(world.rngMain)
  const cond: number[] = [world.condition]
  let played = 0
  let injuries = 0
  const until = world.week + TERM - 1
  while (world.week < until) {
    if (racing) {
      for (const e of world.season) {
        if (e.week <= world.week || world.entries.includes(e.id)) continue
        try {
          enterEvent(world, e.id)
        } catch {
          /* not eligible / capped / blacked out - the gate's answer is the point */
        }
      }
    }
    tickWeek(world, rng)
    // ⚠ THE READER MUST BE IN THE ARM (the null-result law): a pending tournament only COMMITS its
    // matches – and their drain – once every round is REVEALED. The first draft closed the reveal
    // unfinished, no kid match ever landed, and both arms rode the ceiling at 100: a clean-looking
    // zero that was measuring nothing. `finishAnyReveal`'s own idiom (tests/college-departure).
    if (world.pendingTournament) {
      for (let r = 0; r < 40 && !world.pendingTournament.finished; r++) revealTournamentRound(world)
      closeTournament(world)
      played++
    }
    if (world.injury && world.injury.sinceWeek === world.week) injuries++
    cond.push(world.condition)
  }
  return { cond, played, injuries }
}

console.log('='.repeat(100))
console.log('AD-SHOOT BENCH - what do two shoot weeks cost, is it felt, and can one land in the off-season?')
console.log(
  `  ${CAREERS} careers · term ${TERM}w · shoots/term ${WATCH.shootWeeksPerTerm} · lead ${AD.shootLeadWeeks}w · ` +
    `rest week +${ECONOMY.condition.recoveryBase}+slider vs travel week +${ECONOMY.condition.matchWeekRecoveryBase}`,
)
console.log('='.repeat(100))

for (const racing of [false, true] as const) {
  console.log(
    `\n§1${racing ? 'b' : 'a'}  SIGNED vs REFUSED - the same career cloned at the letter` +
      (racing ? ' (RACING: she enters everything the gate allows)' : ' (training only, never competes)'),
  )
  console.log('   career      shoot wks (term-rel)   Δ shoot1 why     Δ shoot2 why     Δ end of term   played S/R   inj S/R')
  let sumFirst = 0
  let sumSecond = 0
  let sumEnd = 0
  let n = 0
  for (let c = 0; c < CAREERS; c++) {
    const base = adultPro(`ad-shoot-bench-${c}`)
    const hit = firstRollFrom(base.seed, base.week + 1, 60)
    if (hit < 0) continue
    const rng = resumeMain(base.rngMain)
    while (base.week < hit) tickWeek(base, rng)
    const offer = base.offers.find((o: Offer) => o.kind === 'ad' && o.state === 'open')
    if (!offer) continue

    const signedWorld = structuredClone(base)
    const refusedWorld = structuredClone(base)
    acceptOffer(signedWorld, offer.id)
    declineOffer(refusedWorld, offer.id)
    const shoots = (signedWorld.offers.find((o: Offer) => o.kind === 'ad')!.terms as AdOfferTerms).shootWeeks!
    const rel = shoots.map((w) => w - signedWorld.week)

    const signed = walkTerm(signedWorld, racing)
    const refused = walkTerm(refusedWorld, racing)
    const delta = signed.cond.map((v, i) => v - refused.cond[i])
    // The introduction at a shoot week: the trajectory step across it. The FIRST is read before any
    // divergence exists; the second can carry drift (injury paths differ once condition does).
    const at = (r: number) => delta[r] - delta[r - 1]
    const dFirst = at(rel[0])
    const dSecond = rel.length > 1 ? at(rel[1]) : 0
    const dEnd = delta[delta.length - 1]
    // WHY a shoot read the way it did, off the REFUSED twin's own week (uncontaminated by the
    // shoot): 'deficit' = the twin recovered that week, so the signed arm forfeited it (the bite);
    // 'ceiling' = the twin sat clamped at 100, nothing to forfeit; 'trip' = the twin itself gained
    // nothing or lost (a tournament/travel week - the no-stacking arm: the shoot adds nothing).
    const why = (r: number): string => {
      const gain = refused.cond[r] - refused.cond[r - 1]
      if (refused.cond[r - 1] >= 100 && gain === 0) return 'ceiling'
      return gain > 0 ? 'deficit' : 'trip'
    }
    const tags = rel.map((r) => why(r))
    sumFirst += dFirst
    sumSecond += dSecond
    sumEnd += dEnd
    n++
    console.log(
      `   ${String(c).padEnd(9)}   ${rel.join(', ').padEnd(20)}   ${String(dFirst).padStart(6)} ${tags[0].padEnd(7)}` +
        ` ${String(dSecond).padStart(6)} ${(tags[1] ?? '-').padEnd(7)}  ${String(dEnd).padStart(6)}` +
        `          ${signed.played}/${refused.played}        ${signed.injuries}/${refused.injuries}`,
    )
  }
  const restWeek = ECONOMY.condition.recoveryBase + 2 // light-slider rest week, the unit the vacation table uses
  console.log(
    `   MEAN over ${n}: shoot1 ${(sumFirst / n).toFixed(1)}, shoot2 ${(sumSecond / n).toFixed(1)}, ` +
      `end of term ${(sumEnd / n).toFixed(1)} condition pts = ${(-sumEnd / n / restWeek).toFixed(2)} rest weeks ` +
      `= ${(-sumEnd / n / 12.5).toFixed(2)} average events (fatigue-reprice §1)`,
  )
}

console.log('\n§2  THE CONSTRUCTION, SWEPT WIDE - 20,000 signature points')
let offSeason = 0
let adjacent = 0
let beforeLead = 0
let outsideTerm = 0
let short = 0
let minGap = Infinity
const gaps: number[] = []
for (let s = 0; s < 200; s++) {
  for (let sw = 200; sw < 300; sw++) {
    const w = chooseShootWeeks(`ad-shoot-c-${s}`, sw, TERM, WATCH.shootWeeksPerTerm, AD.shootLeadWeeks)
    if (w.length !== WATCH.shootWeeksPerTerm) short++
    for (const x of w) {
      if (isOffSeasonWeek(x)) offSeason++
      if (x < sw + AD.shootLeadWeeks) beforeLead++
      if (x > sw + TERM - 1) outsideTerm++
    }
    if (w.length === 2) {
      const gap = Math.abs(w[0] - w[1])
      if (gap <= 1) adjacent++
      minGap = Math.min(minGap, gap)
      gaps.push(gap)
    }
  }
}
gaps.sort((a, b) => a - b)
console.log(
  `   off-season ${offSeason} · adjacent ${adjacent} · before lead ${beforeLead} · outside term ${outsideTerm} · short draws ${short}`,
)
console.log(`   spacing: min ${minGap}, median ${gaps[Math.floor(gaps.length / 2)]}, max ${gaps[gaps.length - 1]}`)
