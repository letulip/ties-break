// ⭐⭐ COLLEGE ON ITS OWN TERMS – what each place costs, who can pay for it, and what four years there
// do to her (17.08.2026, docs/specs/the-college-choice-2026-08.md).
//
//   npx vite-node tools/college-choice-probe.ts -- [--seeds N] [--years N]
//
// ⚠⚠ THERE IS NO TOUR ARM IN THIS FILE AND THERE MAY NOT BE ONE. That is the owner's instruction of
// 17.08, verbatim: «Есть стоимость в год, она складывается из 52 недельных платежей семьи простым
// суммированием, плюс может быть ситуация, что есть деньги на счете и семья хочет выбрать колледж
// дороже… И всё. мы больше ничего ни с чем не сравниваем.» `tools/college-price-probe.ts` is the
// instrument that compares college with four years on tour; it is kept for P6's decomposition
// question and is NOT the answer to this one. A column here that read "better off than the tour"
// would be re-asking the question he closed.
//
// WHAT IT REPORTS, and the list is his:
//   1. THE PRICE of each place – three sourced stickers.
//   2. THE SCHOLARSHIP at each – merit-only, a share of the price of THAT place.
//   3. THE WEEKLY PAYMENT the family is left with.
//   4. WHETHER SHE CAN AFFORD IT, and how often a family runs out of money mid-degree.
//   5. WHICH PLACE GETS TAKEN, under three explicitly-stated models of a player.
//   6. ⭐ AND WHAT THE FOUR YEARS DO TO HER GAME at each place, which is this phase's own proposal and
//      the one dimension that had to be measured before it could be claimed.
//
// METHOD. For each preset x seed, the career is walked from week 0 to the fork with a fresh stream –
// so every arm is byte-identical up to that week by determinism – and then RE-WALKED once per tier,
// each arm answering the fork with a different place and living the four years. Careers that never
// reach the fork are skipped; the population is every career that gets there, which since 16.08 is
// every career that gets there with the college answer on the card (it always is).
//
// MEASUREMENT ONLY: nothing is patched and no engine number is written from here.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, median } from './econ-bench'
import { resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { skillMeanOf } from '../src/engine/world/college'
import { COLLEGE_TIERS, COLLEGE_TIER_ORDER, canAfford, coveredShareOf, familyCanPayPerYearCents } from '../src/engine/collegeOffer'
// ⚠ FROM world/ladder, NOT world/snapshot (TB-07): kidLadderRank moved down to the ladder leaf so
// world/college.ts could stop importing the aggregate projection layer. Same function.
import { kidLadderRank } from '../src/engine/world/ladder'
import { parentIncomeForWeekCents } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'
import type { CollegeOffer, CollegeTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
/** 6 per preset = n 54, the n `college-as-a-second-act-2026-08.md` §2a measured on. */
const SEEDS = argOf('seeds', 6)
const YEARS = argOf('years', 4)
/** Far enough past the nineteenth birthday for the fork to have been raised on any seed. */
const WALK_CAP = argOf('cap', 340)
const POLICY = POLICIES[1]

const usd = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`
const pctOf = (n: number, d: number) => (d === 0 ? '  – ' : `${((100 * n) / d).toFixed(0)}%`)
const one = (n: number) => n.toFixed(1)
const two = (n: number) => n.toFixed(2)
const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n: number) => '-'.repeat(n)

interface Row {
  tier: CollegeTier
  costPerYearCents: number
  athleticShare: number
  needShare: number
  coveredShare: number
  familyPerYearCents: number
  weeklyCents: number
  affordable: boolean
  /** her build at the two ends of the four years */
  skillBefore: number
  skillAfter: number
  /** what the ledger actually took, off `financeWeeks` rather than off the quote */
  tuitionPaidCents: number
  fundsBeforeCents: number
  fundsAfterCents: number
  /** ⭐ DID THE MONEY RUN OUT WHILE SHE WAS THERE? The owner asked for exactly this. */
  ranOut: boolean
  rankAfter: number | null
  ended: string | null
}

interface Career {
  preset: string
  juniorScoreProxy: number
  walkOn: boolean
  canPayPerYearCents: number
  rows: Record<CollegeTier, Row>
}

/** Walk a fresh career to the week the fork is raised. Null if it never got there. */
function toTheFork(preset: (typeof PRESETS)[number], i: number): { world: WorldState; rng: Rng } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng }
  }
  return null
}

/** ⚠ OFF THE LEDGER, NOT OFF THE QUOTE. A disagreement between what the card promised and what the
 *  tick charged has to be able to show up as a difference between two numbers, not be hidden by
 *  computing both from the same one. */
function tuitionSoFar(world: WorldState): number {
  let sum = 0
  for (const w of world.financeWeeks) sum += w.byCategory.tuition ?? 0
  return sum
}

const careers: Career[] = []
let reached = 0

for (let p = 0; p < PRESETS.length; p++) {
  for (let i = 0; i < SEEDS; i++) {
    const peek = toTheFork(PRESETS[p], i)
    if (peek === null) continue
    reached += 1
    const offer = peek.world.fork!.offer as CollegeOffer
    const rows = {} as Record<CollegeTier, Row>

    for (const tier of COLLEGE_TIER_ORDER) {
      const at = toTheFork(PRESETS[p], i)!
      const o = at.world.fork!.offer as CollegeOffer
      const quote = o.quotes.find((q) => q.tier === tier)!
      const skillBefore = skillMeanOf(at.world.skills)
      const fundsBefore = at.world.fundsCents
      const tuitionBefore = tuitionSoFar(at.world)
      // ⚠ A PLACE RESIDENCE SHUTS IS STILL WALKED, AND `answerFork` FALLS BACK. The bench's presets
      // are all American so this never fires today; the row records the tier it ASKED for and the
      // engine's re-validation is what decides. See `answerFork`'s own note.
      answerFork(at.world, 'college', tier)
      let firstYearTuition = 0
      for (let y = 0; y < YEARS && at.world.ending?.type === 'college'; y++) {
        resumeFromCollege(at.world, at.rng)
        // ⚠⚠ THE LEDGER CHECK IS TAKEN AFTER ONE YEAR AND NOT AFTER FOUR, AND THAT IS THE INSTRUMENT
        // BEING HONEST ABOUT ITS OWN WINDOW. `financeWeeks` keeps a ROLLING 60 WEEKS, so a four-year
        // sum off it reads about a quarter of what was actually charged and looks exactly like an
        // engine that under-bills. One year is inside the window, so this comparison is exact.
        if (y === 0) firstYearTuition = tuitionSoFar(at.world) - tuitionBefore
      }
      rows[tier] = {
        tier,
        costPerYearCents: quote.costPerYearCents,
        athleticShare: quote.athleticShare,
        needShare: quote.needShare,
        coveredShare: coveredShareOf(quote),
        familyPerYearCents: quote.familyPerYearCents,
        weeklyCents: Math.round(quote.familyPerYearCents / WEEKS_PER_YEAR),
        affordable: canAfford(o, quote) === true,
        skillBefore,
        skillAfter: skillMeanOf(at.world.skills),
        tuitionPaidCents: firstYearTuition,
        fundsBeforeCents: fundsBefore,
        fundsAfterCents: at.world.fundsCents,
        ranOut: at.world.fundsCents < 0,
        rankAfter: kidLadderRank(at.world, 'wta'),
        ended: at.world.ending ? at.world.ending.type : null,
      }
    }

    careers.push({
      preset: PRESETS[p].label ?? String(p),
      juniorScoreProxy: 0,
      walkOn: offer.quotes.every((q) => q.athleticShare === 0),
      canPayPerYearCents:
        offer.canPayPerYearCents ??
        familyCanPayPerYearCents({
          familyIncomeCents:
            parentIncomeForWeekCents(peek.world.seed, peek.world.profile.background, peek.world.week) * WEEKS_PER_YEAR,
          familyAssetsCents: peek.world.fundsCents,
        }),
      rows,
    })
  }
}

const n = careers.length
console.log(`\n⭐⭐ COLLEGE ON ITS OWN TERMS – ${n} careers reached the fork (of ${PRESETS.length * SEEDS} walked), ${YEARS} years each, ${n * 3} arms`)
console.log(`   POLICY ${POLICY.label} · seeds ${SEEDS}/preset · ⚠ NO TOUR ARM IN THIS FILE (owner, 17.08)`)

// =================================================================================================
// 1-3. THE PLACE, THE AWARD, THE PAYMENT
// =================================================================================================
console.log(`\n⭐⭐ THE THREE PLACES – the price is SOURCED, the squad and the recruiting bar are OURS`)
console.log(`  ${padE('place', 11)}${pad('price/yr [S]', 14)}${pad('squad', 8)}${pad('full-award', 12)}${pad('matches/wk', 12)}`)
console.log(`  ${rule(57)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const t = COLLEGE_TIERS[tier]
  console.log(
    `  ${padE(tier, 11)}${pad(usd(t.costPerYearCents), 14)}${pad(t.squad, 8)}${pad(t.fullAwardScore, 12)}${pad(t.matchesPerWeek, 12)}`,
  )
}

console.log(`\n⭐⭐ WHAT THE AWARD COVERS AND WHAT IS LEFT TO PAY (medians over ${n})`)
console.log(
  `  ${padE('place', 11)}${pad('athletic', 10)}${pad('need', 8)}${pad('covered', 10)}${pad('family $/yr', 14)}${pad('$/week', 10)}${pad('full rides', 12)}`,
)
console.log(`  ${rule(75)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = careers.map((c) => c.rows[tier])
  const free = rs.filter((r) => r.familyPerYearCents === 0).length
  console.log(
    `  ${padE(tier, 11)}${pad(one(100 * median(rs.map((r) => r.athleticShare))) + '%', 10)}` +
      `${pad(one(100 * median(rs.map((r) => r.needShare))) + '%', 8)}` +
      `${pad(one(100 * median(rs.map((r) => r.coveredShare))) + '%', 10)}` +
      `${pad(usd(median(rs.map((r) => r.familyPerYearCents))), 14)}` +
      `${pad(usd(median(rs.map((r) => r.weeklyCents))), 10)}` +
      `${pad(`${free}/${n}`, 12)}`,
  )
}

// =================================================================================================
// 4. CAN SHE PAY FOR IT, AND HOW OFTEN DOES THE MONEY RUN OUT
// =================================================================================================
console.log(`\n⭐⭐ WHETHER THE FAMILY CAN PAY, AND WHETHER IT RAN OUT ANYWAY (over ${n})`)
console.log(`  ${padE('place', 11)}${pad('affordable', 13)}${pad('ran out', 11)}${pad('ended early', 13)}${pad('funds after', 14)}`)
console.log(`  ${rule(62)}`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = careers.map((c) => c.rows[tier])
  const afford = rs.filter((r) => r.affordable).length
  const out = rs.filter((r) => r.ranOut).length
  const ended = rs.filter((r) => r.ended !== null && r.ended !== 'college').length
  console.log(
    `  ${padE(tier, 11)}${pad(`${afford}/${n} ${pctOf(afford, n)}`, 13)}${pad(`${out}/${n} ${pctOf(out, n)}`, 11)}` +
      `${pad(`${ended}/${n}`, 13)}${pad(usd(median(rs.map((r) => r.fundsAfterCents))), 14)}`,
  )
}

// =================================================================================================
// 5. WHICH PLACE GETS TAKEN – ⚠ UNDER THREE STATED MODELS OF A PLAYER, WHICH ARE OURS
// =================================================================================================
//
// ⚠⚠ THIS IS NOT A MEASUREMENT OF PLAYERS AND MUST NOT BE READ AS ONE. Nobody has played this build.
// What the three rows below measure is what the POPULATION allows: how many careers could take each
// place under a rule stated out loud. `dearest affordable` is the one worth arguing with – it is a
// family that spends everything it has and no more.
const POLICIES_OF_CHOICE: Array<[string, (c: Career) => CollegeTier]> = [
  ['cheapest always', () => 'state'],
  [
    'dearest affordable',
    (c) => {
      const open = COLLEGE_TIER_ORDER.filter((t) => c.rows[t].affordable)
      return open.length ? open[open.length - 1] : 'state'
    },
  ],
  ['dearest always', () => 'private'],
]
console.log(`\n⭐⭐ WHICH PLACE THE POPULATION CAN TAKE (⚠ OUR models of a player, not a measurement of players)`)
console.log(`  ${padE('model', 22)}${pad('state', 12)}${pad('national', 12)}${pad('private', 12)}${pad('median $/wk', 13)}`)
console.log(`  ${rule(71)}`)
for (const [label, pick] of POLICIES_OF_CHOICE) {
  const taken = careers.map((c) => c.rows[pick(c)])
  const share = (t: CollegeTier) => {
    const k = taken.filter((r) => r.tier === t).length
    return `${k} ${pctOf(k, n)}`
  }
  console.log(
    `  ${padE(label, 22)}${pad(share('state'), 12)}${pad(share('national'), 12)}${pad(share('private'), 12)}` +
      `${pad(usd(median(taken.map((r) => r.weeklyCents))), 13)}`,
  )
}

// =================================================================================================
// 6. ⭐ WHAT THE FOUR YEARS DO TO HER GAME – this phase's own proposal, under test
// =================================================================================================
//
// ⚠⚠ THE PREDICTION WRITTEN BEFORE THE BUILD WAS THAT THIS WOULD BE SMALL (spec §1, P4), because P5
// measured the ENTIRE coached/un-coached gap over the same four years at 0.12 of one skill point. The
// column below is what decides whether the tier is legible through her game or only through money.
console.log(`\n⭐ WHAT ${YEARS} YEARS AT EACH PLACE DO TO HER GAME (skill mean, over ${n})`)
console.log(`  ${padE('place', 11)}${pad('before', 10)}${pad('after', 10)}${pad('gain', 10)}${pad('vs state', 11)}${pad('rank after', 12)}`)
console.log(`  ${rule(64)}`)
const stateGain = median(careers.map((c) => c.rows.state.skillAfter - c.rows.state.skillBefore))
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = careers.map((c) => c.rows[tier])
  const gain = median(rs.map((r) => r.skillAfter - r.skillBefore))
  const ranked = rs.filter((r) => r.rankAfter !== null)
  console.log(
    `  ${padE(tier, 11)}${pad(two(median(rs.map((r) => r.skillBefore))), 10)}${pad(two(median(rs.map((r) => r.skillAfter))), 10)}` +
      `${pad('+' + two(gain), 10)}${pad(tier === 'state' ? '–' : '+' + two(gain - stateGain), 11)}` +
      `${pad(ranked.length ? `${ranked.length}/${n} #${Math.round(median(ranked.map((r) => r.rankAfter!)))}` : `0/${n}`, 12)}`,
  )
}

// =================================================================================================
// 7. THE WALK-ON, AND THE QUOTE THE LEDGER ACTUALLY CHARGED
// =================================================================================================
const walkOns = careers.filter((c) => c.walkOn).length
console.log(`\n⚠ NOBODY FUNDED HER AT ALL: ${walkOns} of ${n} (${pctOf(walkOns, n)}) – an EMPTY junior record, and she still enrols and pays`)
console.log(`\n⚠ THE QUOTE AGAINST THE LEDGER – the card's promise against what the tick took, over the FIRST YEAR`)
console.log(`  (⚠ one year, not four: \`financeWeeks\` is a rolling 60-week window and a four-year sum off it reads a quarter of the truth)`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = careers.map((c) => c.rows[tier])
  const quoted = median(rs.map((r) => r.familyPerYearCents))
  const charged = median(rs.map((r) => -r.tuitionPaidCents))
  console.log(`  ${padE(tier, 11)}quoted ${padE(usd(quoted), 12)}charged ${padE(usd(charged), 12)}delta ${usd(charged - quoted)}`)
}

// ⭐⭐ AND WHAT ENDED THOSE CAREERS. The dear place is the first thing on the college branch that can
// end one, and the owner has to be told which mechanic does it rather than that "some ended".
console.log(`\n⭐⭐ WHAT ENDED A CAREER INSIDE THE ${YEARS} YEARS, per place`)
for (const tier of COLLEGE_TIER_ORDER) {
  const rs = careers.map((c) => c.rows[tier])
  const kinds = new Map<string, number>()
  for (const r of rs) if (r.ended !== null && r.ended !== 'college') kinds.set(r.ended, (kinds.get(r.ended) ?? 0) + 1)
  const list = [...kinds.entries()].map(([k, v]) => `${k} ${v}`).join(' · ') || 'nothing ended'
  console.log(`  ${padE(tier, 11)}${list}`)
}

// ⚠ THE FAMILY'S OWN POSITION, so the affordability column above is legible rather than a verdict.
console.log(`\n⚠ WHAT A YEAR OF THIS FAMILY'S MONEY IS AT THE FORK (income + savings spread over the ${YEARS} years)`)
{
  const cp = careers.map((c) => c.canPayPerYearCents).sort((a, b) => a - b)
  const q = (f: number) => usd(cp[Math.min(cp.length - 1, Math.floor(f * cp.length))])
  console.log(`  min ${q(0)} · p25 ${q(0.25)} · median ${q(0.5)} · p75 ${q(0.75)} · max ${q(0.999)}`)
}
console.log()
