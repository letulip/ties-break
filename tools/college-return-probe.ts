// ⭐⭐ THE ROAD BACK – what happens to a career AFTER the four years, per place
// (17.08.2026, docs/specs/the-college-answers-2026-08.md).
//
//   npx vite-node tools/college-return-probe.ts -- [--seeds N] [--after N] [--ledger]
//
// ⚠⚠ WHY THIS FILE EXISTS, AND IT IS AN INSTRUMENT BUG RATHER THAN AN ENGINE ONE.
// `tools/college-choice-probe.ts` reported *"has a professional rank after: 0 / 53"* at every tier
// and the owner read it as the road back being gone. It is not. That column is
// `kidLadderRank(world, 'wta')` sampled on the GRADUATION WEEK ITSELF – the one week of the whole
// career when the 52-week ranking window is empty BY CONSTRUCTION, because college awards no ranking
// points and she has just spent four years entering nothing. It could only ever have printed zero.
// The probe simply stopped walking at the last college week: `for (y = 0; y < YEARS && ending ===
// 'college')` exits when `finishCollege` clears the latch, and nothing after it advanced a week.
//
// So this file walks PAST graduation and asks the question the owner is actually asking: **does she
// come back, how fast, and how high.**
//
// ⚠ THERE IS NO TOUR ARM HERE EITHER (owner, 17.08). The three college places are compared with each
// other and with a rank band, never with a career that answered «continue» at the fork.
//
// ⚠ MEASUREMENT ONLY: nothing is patched and no engine number is written from here.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, median } from './econ-bench'
import { chooseGift, pendingBirthday, resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { COLLEGE_TIER_ORDER, canAfford } from '../src/engine/collegeOffer'
// ⚠ FROM world/ladder, NOT world/snapshot (TB-07): kidLadderRank moved down to the ladder leaf so
// world/college.ts could stop importing the aggregate projection layer. Same function.
import { kidLadderRank } from '../src/engine/world/ladder'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'
import type { CollegeOffer, CollegeTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = argOf('seeds', 6)
const YEARS = argOf('years', 4)
/** how many seasons after she leaves the road back is measured over. ⚠ OURS, and it is the same
 *  length as the degree on purpose: "what four years there bought her, four years later". */
const AFTER = argOf('after', 4)
const WALK_CAP = argOf('cap', 340)
const LEDGER = args.includes('--ledger')
const POLICY = POLICIES[1]

/** ⚠ THE BANDS ARE THE OWNER'S OWN – «топ-200… или топ-100 или топ-50». */
const BANDS = [200, 100, 50] as const

const usd = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`
const pctOf = (n: number, d: number) => (d === 0 ? '  – ' : `${((100 * n) / d).toFixed(0)}%`)
const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n: number) => '-'.repeat(n)

interface Row {
  tier: CollegeTier
  affordable: boolean
  familyPerYearCents: number
  rankAtFork: number | null
  /** ⚠ THE ARTEFACT ITSELF, kept in the output so the old number and the real one sit side by side. */
  rankAtGraduation: number | null
  /** did she finish the four years at all, or did something end the career inside them */
  graduated: boolean
  endedInCollege: string | null
  /** weeks after graduation until she first holds a WTA rank again. null = never, inside the window */
  weeksToRank: number | null
  rankAfterOneYear: number | null
  /** best rank reached at any week of the return window */
  bestRankAfter: number | null
  endedAfter: string | null
  /** what the family had the week she enrolled – the ledger's starting point */
  fundsAtEnrolCents: number
}

interface Career {
  preset: string
  seed: number
  rows: Partial<Record<CollegeTier, Row>>
}

function toTheFork(preset: (typeof PRESETS)[number], i: number): { world: WorldState; rng: Rng } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng }
  }
  return null
}

/** ⭐ ONE ARM: the fork answered with one place, the four years, and then the road back.
 *  `trace` collects a week-by-week ledger when one is asked for (§6 of the spec). */
function walkOneArm(
  preset: (typeof PRESETS)[number],
  i: number,
  tier: CollegeTier,
  trace?: LedgerRow[],
): Row | null {
  const at = toTheFork(preset, i)
  if (at === null) return null
  const offer = at.world.fork!.offer as CollegeOffer
  const quote = offer.quotes.find((q) => q.tier === tier)!
  const rankAtFork = kidLadderRank(at.world, 'wta')
  answerFork(at.world, 'college', tier)
  // ROUND 24 #5: the answer reserves – walk the gap to the September departure first, on the same
  // bench step the career arrived on, so the tour arm and the college arm compare like for like.
  for (let gapW = 0; gapW < 54 && at.world.ending === null; gapW++) stepCareerWeek(at.world, at.rng, POLICIES[0])
  const fundsAtEnrolCents = at.world.fundsCents
  for (let y = 0; y < YEARS && at.world.ending?.type === 'college'; y++) {
    const yearStart = at.world.week
    // Round 24: the year pauses on her birthday week – press, answer, press again.
    for (let press = 0; press < 3 && at.world.college!.years.length === y && at.world.ending?.type === 'college'; press++) {
      resumeFromCollege(at.world, at.rng)
      if (pendingBirthday(at.world) !== null) chooseGift(at.world, 'day')
    }
    if (trace) traceYear(at.world, yearStart, trace)
  }
  const graduated = at.world.ending === null
  const endedInCollege = at.world.ending ? at.world.ending.type : null
  const rankAtGraduation = kidLadderRank(at.world, 'wta')

  let weeksToRank: number | null = null
  let bestRankAfter: number | null = null
  let rankAfterOneYear: number | null = null
  if (graduated) {
    for (let w = 0; w < AFTER * WEEKS_PER_YEAR; w++) {
      if (at.world.ending) break
      stepCareerWeek(at.world, at.rng, POLICY)
      const r = kidLadderRank(at.world, 'wta')
      if (r !== null) {
        if (weeksToRank === null) weeksToRank = w + 1
        if (bestRankAfter === null || r < bestRankAfter) bestRankAfter = r
      }
      if (w + 1 === WEEKS_PER_YEAR) rankAfterOneYear = r
    }
  }
  return {
    tier,
    fundsAtEnrolCents,
    affordable: canAfford(offer, quote) === true,
    familyPerYearCents: quote.familyPerYearCents,
    rankAtFork,
    rankAtGraduation,
    graduated,
    endedInCollege,
    weeksToRank,
    rankAfterOneYear,
    bestRankAfter,
    endedAfter: at.world.ending ? at.world.ending.type : null,
  }
}

// =================================================================================================
// ⭐⭐ THE LEDGER – §6. What actually happens to the balance, week by week, inside the freeze.
// =================================================================================================
//
// ⚠ IT IS READ OFF `world.financeWeeks`, WHICH IS A ROLLING 60-WEEK WINDOW, so it is harvested at
// the end of every college YEAR rather than once at the end – a single read after four years would
// show the last fourteen months and nothing else. Each harvest keeps only the weeks it has not seen.
interface LedgerRow {
  week: number
  incomeCents: number
  tuitionCents: number
  otherCents: number
}

function traceYear(world: WorldState, fromWeek: number, into: LedgerRow[]): void {
  const seen = into.length ? into[into.length - 1].week : -1
  for (const fw of world.financeWeeks) {
    if (fw.week <= seen || fw.week < fromWeek) continue
    let income = 0
    let tuition = 0
    let other = 0
    for (const [cat, cents] of Object.entries(fw.byCategory)) {
      // ⚠ TUITION IS PULLED OUT OF THE EXPENSE SIDE AND NAMED, because the whole question is whether
      // the bill or everything else is what took her under.
      if (cat === 'tuition') tuition += cents
      else if (cents > 0) income += cents
      else other += cents
    }
    into.push({ week: fw.week, incomeCents: income, tuitionCents: tuition, otherCents: other })
  }
  into.sort((a, b) => a.week - b.week)
}

// =================================================================================================
const t0 = Date.now()
const careers: Career[] = []
for (let p = 0; p < PRESETS.length; p++) {
  for (let i = 0; i < SEEDS; i++) {
    const rows: Partial<Record<CollegeTier, Row>> = {}
    let any = false
    for (const tier of COLLEGE_TIER_ORDER) {
      const row = walkOneArm(PRESETS[p], i, tier)
      if (row === null) break
      rows[tier] = row
      any = true
    }
    if (any) careers.push({ preset: PRESETS[p].label ?? String(p), seed: i, rows })
  }
}

const n = careers.length
const all = (t: CollegeTier) => careers.map((c) => c.rows[t]!).filter(Boolean)

console.log(`\n⭐⭐ THE ROAD BACK – ${n} careers x 3 places, ${YEARS} years at college then ${AFTER} on tour`)
console.log(`   POLICY ${POLICY.label} · seeds ${SEEDS}/preset · ⚠ NO TOUR ARM (owner, 17.08) · ${((Date.now() - t0) / 1000).toFixed(0)}s`)

// =================================================================================================
// 1. DOES SHE COME BACK
// =================================================================================================
console.log(`\n⭐⭐ 1. THE ROAD BACK – and the first column is the ARTEFACT the old probe printed`)
console.log(
  `  ${padE('place', 11)}${pad('ranked AT grad', 16)}${pad('graduated', 12)}${pad('ranked within 1y', 18)}${pad('median wks to rank', 20)}${pad('rank +1y', 11)}`,
)
console.log(`  ${rule(88)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = all(tier)
  const grads = rs.filter((r) => r.graduated)
  const atGrad = rs.filter((r) => r.rankAtGraduation !== null).length
  const backIn1 = grads.filter((r) => r.weeksToRank !== null && r.weeksToRank <= WEEKS_PER_YEAR).length
  const wks = grads.filter((r) => r.weeksToRank !== null).map((r) => r.weeksToRank!)
  const y1 = grads.filter((r) => r.rankAfterOneYear !== null).map((r) => r.rankAfterOneYear!)
  console.log(
    `  ${padE(tier, 11)}${pad(`${atGrad}/${rs.length}`, 16)}${pad(`${grads.length}/${rs.length}`, 12)}` +
      `${pad(`${backIn1}/${grads.length} ${pctOf(backIn1, grads.length)}`, 18)}${pad(wks.length ? Math.round(median(wks)) : '–', 20)}` +
      `${pad(y1.length ? `#${Math.round(median(y1))}` : '–', 11)}`,
  )
}

// =================================================================================================
// 2. THE ODDS – the owner's own question, per place
// =================================================================================================
console.log(`\n⭐⭐ 2. THE ODDS OF A RANK BAND WITHIN ${AFTER} YEARS OF LEAVING (of ALL ${n} careers that took the place)`)
console.log(
  `  ${padE('place', 11)}${BANDS.map((b) => pad(`top ${b}`, 14)).join('')}${pad('median best', 14)}${pad('ended', 10)}`,
)
console.log(`  ${rule(72)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = all(tier)
  const best = rs.filter((r) => r.bestRankAfter !== null).map((r) => r.bestRankAfter!)
  const ended = rs.filter((r) => r.endedInCollege !== null || r.endedAfter !== null).length
  console.log(
    `  ${padE(tier, 11)}` +
      BANDS.map((b) => {
        const k = rs.filter((r) => r.bestRankAfter !== null && r.bestRankAfter <= b).length
        return pad(`${k}/${rs.length} ${pctOf(k, rs.length)}`, 14)
      }).join('') +
      `${pad(best.length ? `#${Math.round(median(best))}` : '–', 14)}${pad(`${ended}/${rs.length}`, 10)}`,
  )
}

// ⚠⚠ AND THE SAME ODDS AMONG THE CAREERS THAT WERE NOT ENDED BY THE BILL. If the two tables agree,
// the tier is not moving the odds at all; if they disagree, the mechanism is MONEY and the spec has
// to say so rather than let a card imply a stronger squad makes a better player.
console.log(`\n⚠ THE SAME ODDS AMONG CAREERS THAT SURVIVED THE BILL (the arithmetic behind the gap)`)
console.log(`  ${padE('place', 11)}${pad('survived', 12)}${BANDS.map((b) => pad(`top ${b}`, 14)).join('')}`)
console.log(`  ${rule(60)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = all(tier).filter((r) => r.endedInCollege === null)
  console.log(
    `  ${padE(tier, 11)}${pad(`${rs.length}`, 12)}` +
      BANDS.map((b) => {
        const k = rs.filter((r) => r.bestRankAfter !== null && r.bestRankAfter <= b).length
        return pad(`${k}/${rs.length} ${pctOf(k, rs.length)}`, 14)
      }).join(''),
  )
}

// =================================================================================================
// 3. THE BANKRUPTCIES – and the model of a player they were measured under
// =================================================================================================
console.log(`\n⭐⭐ 3. WHAT ENDED A CAREER, per place, and under the two models of a player`)
console.log(`  ${padE('place', 11)}${pad('ended IN college', 18)}${pad('ended after', 14)}${pad('affordable', 12)}`)
console.log(`  ${rule(55)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = all(tier)
  const kinds = new Map<string, number>()
  for (const r of rs) if (r.endedInCollege) kinds.set(r.endedInCollege, (kinds.get(r.endedInCollege) ?? 0) + 1)
  const list = [...kinds.entries()].map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'
  const after = rs.filter((r) => r.endedAfter !== null).length
  const aff = rs.filter((r) => r.affordable).length
  console.log(`  ${padE(tier, 11)}${pad(list, 18)}${pad(`${after}/${rs.length}`, 14)}${pad(`${aff}/${rs.length}`, 12)}`)
}

// ⭐⭐ THE MODEL OF A PLAYER IS THE OTHER HALF OF THE BANKRUPTCY NUMBER. "dearest always" forces the
// private place on every family INCLUDING the ones the card already tells «Beyond what the family
// has». A player who reads the card takes the dearest place she can pay for.
console.log(`\n⭐⭐ THE SAME BANKRUPTCIES UNDER THE TWO STATED MODELS OF A PLAYER (⚠ our models, not a measurement of players)`)
const MODELS: Array<[string, (c: Career) => CollegeTier]> = [
  ['cheapest always', () => 'state'],
  [
    'dearest affordable',
    (c) => {
      const open = COLLEGE_TIER_ORDER.filter((t) => c.rows[t]?.affordable)
      return open.length ? open[open.length - 1] : 'state'
    },
  ],
  ['dearest always', () => 'private'],
]
console.log(`  ${padE('model', 22)}${pad('ended in college', 18)}${pad('of which bankruptcy', 21)}${pad('reached top 200', 17)}`)
console.log(`  ${rule(78)}`)
for (const [label, pick] of MODELS) {
  const taken = careers.map((c) => c.rows[pick(c)]!).filter(Boolean)
  const ended = taken.filter((r) => r.endedInCollege !== null).length
  const bank = taken.filter((r) => r.endedInCollege === 'bankruptcy').length
  const t200 = taken.filter((r) => r.bestRankAfter !== null && r.bestRankAfter <= 200).length
  console.log(
    `  ${padE(label, 22)}${pad(`${ended}/${taken.length}`, 18)}${pad(`${bank}/${taken.length} ${pctOf(bank, taken.length)}`, 21)}` +
      `${pad(`${t200}/${taken.length} ${pctOf(t200, taken.length)}`, 17)}`,
  )
}

// =================================================================================================
// 4. ⭐ ONE BANKRUPT CAREER, WEEK BY WEEK – so he can watch it happen
// =================================================================================================
if (LEDGER) {
  let found = false
  for (let p = 0; p < PRESETS.length && !found; p++) {
    for (let i = 0; i < SEEDS && !found; i++) {
      const c = careers.find((x) => x.preset === (PRESETS[p].label ?? String(p)) && x.seed === i)
      if (!c || c.rows.private?.endedInCollege !== 'bankruptcy') continue
      found = true
      const trace: LedgerRow[] = []
      const arm = walkOneArm(PRESETS[p], i, 'private', trace)!
      console.log(`\n⭐⭐ 4. THE LEDGER OF ONE BANKRUPT CAREER – ${c.preset} seed ${i}, the PRIVATE place`)
      console.log(`  she enrolled with ${usd(arm.fundsAtEnrolCents)} in the bank, at ${usd(arm.familyPerYearCents)} a year`)
      console.log(`  ${pad('week', 6)}${pad('parents in', 13)}${pad('tuition', 11)}${pad('everything else', 18)}${pad('balance', 13)}`)
      console.log(`  ${rule(61)}`)
      // ⚠ THE BALANCE IS RECONSTRUCTED FORWARD FROM THE WEEK SHE ENROLLED, because `FinanceWeek`
      // carries the week's flows and not a running total. Every week is present – the trace is
      // harvested once a YEAR and the window holds 60 – so the cumulative sum is exact.
      let balance = arm.fundsAtEnrolCents
      const last = trace.length ? trace[trace.length - 1].week : 0
      for (const r of trace) {
        balance += r.incomeCents + r.tuitionCents + r.otherCents
        if (r.week % 4 !== 0 && r.week < last - WEEKS_PER_YEAR) continue
        console.log(
          `  ${pad(r.week, 6)}${pad(usd(r.incomeCents), 13)}${pad(usd(r.tuitionCents), 11)}${pad(usd(r.otherCents), 18)}${pad(usd(balance), 13)}`,
        )
      }
      const totIn = trace.reduce((s, r) => s + r.incomeCents, 0)
      const totTui = trace.reduce((s, r) => s + r.tuitionCents, 0)
      const totOther = trace.reduce((s, r) => s + r.otherCents, 0)
      console.log(`  ${rule(61)}`)
      console.log(
        `  over ${trace.length} weeks: parents in ${usd(totIn)} · tuition ${usd(totTui)} · everything else ${usd(totOther)}`,
      )
    }
  }
  if (!found) console.log(`\n⚠ 4. NO CAREER WENT BANKRUPT AT THE PRIVATE PLACE ON THIS POPULATION – nothing to trace`)
}

console.log()
