// ⭐⭐⭐⭐ WHAT THE HOME UNIVERSITY COSTS THE DESIGN – round 26 #2, second pass (26.08.2026).
//
//   npx vite-node tools/college-home-place.ts -- [--seeds N] [--years N] [--countries US,AU]
//
// The owner, having asked twice why the cheapest college place was refused: «по-моему в каждой стране
// есть домашний универ». The rung is open to every career now. The round's own instruction is that
// this changes WHO CAN TAKE the cheap place and not WHAT IT IS WORTH – so the question this tool
// answers is the one that follows: **how often is the home place now taken, and does the college
// branch's own survival change?**
//
// ⚠⚠ THE ARMS ARE TIERS, NOT TREES, AND THAT IS DELIBERATE. CLAUDE.md's own warning is that a null
// result needs the same provenance check as a positive one, and the classic way to get a false one
// here would be to build an "A" worktree at the commit before the rule change – where the bench's
// profiles are all `country: 'US'` and the change is therefore UNREACHABLE. The rule's entire
// behavioural content is *which tier a non-American career can take*: before, the cheapest place open
// to her was `national`; after, it is `state`. Both are expressible as an ANSWER to the same fork on
// the same tree, so both arms run against identical code and differ only in the input – which is the
// one comparison that cannot be a null-arm artefact.
//
// ⚠ AND THE COUNTRY IS THE AXIS THE STANDING BENCHES DO NOT HAVE. `openCareer` builds every career
// from `DEFAULT_PROFILE` (`country: 'US'`), so `econ-bench`, `ladder-baseline`, `college-price-probe`
// and `college-choice-probe` are all blind to this change by construction. The opener below is
// `openCareer`'s body with one field added, and the seed string is unchanged – so the US column here
// is byte-identical to what those benches walk, which is what makes it a control.
//
// MEASUREMENT ONLY: nothing is patched and no engine number is written from here.
import { stepCareerWeek, POLICIES, PRESETS, median } from './econ-bench'
import {
  chooseGift,
  closeTournament,
  collegeLeagueRevealOpen,
  createWorld,
  pendingBirthday,
  resumeFromCollege,
  skipTournament,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { COLLEGE_TIERS, COLLEGE_TIER_ORDER, canAfford, coveredShareOf } from '../src/engine/collegeOffer'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'
import type { CollegeOffer, CollegeTier, PlayerProfile } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const argStr = (n: string, d: string) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : d
}
const SEEDS = argOf('seeds', 3)
const YEARS = argOf('years', 4)
const WALK_CAP = argOf('cap', 340)
/** ⚠ US IS THE CONTROL AND MUST STAY IN THE LIST: it is the one country whose answer did not move, so
 *  a change that shows up in its column is a change this round did not intend. */
const COUNTRIES = argStr('countries', 'US,AU').split(',')
const POLICY = POLICIES[1]

const usd = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`
const pct = (n: number, d: number) => (d === 0 ? '  – ' : `${((100 * n) / d).toFixed(0)}%`)
const one = (n: number) => n.toFixed(1)
const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n: number) => '-'.repeat(n)

/** ⚠ `openCareer`'s BODY WITH ONE FIELD ADDED, and the seed string is untouched – so `country: 'US'`
 *  here is the identical career `econ-bench` opens. Copied rather than imported because the shared
 *  opener takes no country and this tool may not change a signature nine other benches read. */
function openCareerIn(
  preset: (typeof PRESETS)[number],
  index: number,
  country: string,
): { world: WorldState; rng: Rng } {
  const seed = `bench-${preset.background}-${index}`
  const profile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: preset.background,
    coachTier: preset.coachTier,
    country,
  }
  const world = createWorld(seed, profile)
  world.coachOnEventWeeks = POLICY.coachOnEventWeeks
  return { world, rng: rngFromSeed(world.seed) }
}

function toTheFork(preset: (typeof PRESETS)[number], i: number, country: string): { world: WorldState; rng: Rng } | null {
  const { world, rng } = openCareerIn(preset, i, country)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng }
  }
  return null
}

interface Arm {
  tier: CollegeTier
  familyPerYearCents: number
  coveredShare: number
  affordable: boolean
  /** ⭐ DID THE MONEY RUN OUT WHILE SHE WAS THERE? */
  ranOut: boolean
  /** ⭐ DID THE COLLEGE BRANCH SURVIVE ALL FOUR YEARS? */
  finished: boolean
  fundsAfterCents: number
}

interface Career {
  country: string
  preset: string
  arms: Record<CollegeTier, Arm>
}

const careers: Career[] = []
let walked = 0

for (const country of COUNTRIES) {
  for (let p = 0; p < PRESETS.length; p++) {
    for (let i = 0; i < SEEDS; i++) {
      walked += 1
      const arms = {} as Record<CollegeTier, Arm>
      let reached = true
      for (const tier of COLLEGE_TIER_ORDER) {
        const at = toTheFork(PRESETS[p], i, country)
        if (at === null) {
          reached = false
          break
        }
        const offer = at.world.fork!.offer as CollegeOffer
        const quote = offer.quotes.find((q) => q.tier === tier)!
        answerFork(at.world, 'college', tier)
        // ⚠ THE ANSWER RESERVES; the September departure enrols (round 24 #5). Walk the gap, then the
        // four years – pressing through the birthday pause the way the player does.
        for (let gap = 0; gap < 54 && at.world.ending === null; gap++) stepCareerWeek(at.world, at.rng, POLICIES[0])
        // ⚠⚠ A COLLEGE YEAR NOW STOPS TWICE, AND A PROBE THAT PRESSES ONCE MEASURES A CAREER STUCK IN
        // YEAR ONE. Round 24 gave the year a birthday pause; round 26 #6 gave it the CHAMPIONSHIP –
        // `resolveCollegeLeague` opens `college.leagueReveal` and `resumeFromCollege` refuses to tick
        // until the reveal is answered the way a tour reveal is («Skip all rounds», then «Continue»).
        // The first cut of this tool pressed 3 times a year and reported **0 of 18 careers finishing
        // four years**, which is the walk being wedged and not a survival figure.
        for (let press = 0; press < 6 * YEARS && at.world.ending?.type === 'college'; press++) {
          if (collegeLeagueRevealOpen(at.world)) {
            skipTournament(at.world)
            closeTournament(at.world)
            continue
          }
          if (pendingBirthday(at.world) !== null) {
            chooseGift(at.world, 'day')
            continue
          }
          resumeFromCollege(at.world, at.rng)
        }
        arms[tier] = {
          tier,
          familyPerYearCents: quote.familyPerYearCents,
          coveredShare: coveredShareOf(quote),
          affordable: canAfford(offer, quote) === true,
          ranOut: at.world.fundsCents < 0,
          // ⚠ "FINISHED" IS THE COLLEGE LATCH SURVIVING FOUR YEARS. An ending of any other type means
          // the branch did not carry her to graduation – which is the survival figure §10i reports as
          // «eleven of 53 careers never finish at all».
          finished: at.world.college !== null && at.world.college.years.length >= YEARS,
          fundsAfterCents: at.world.fundsCents,
        }
      }
      if (reached) careers.push({ country, preset: PRESETS[p].label ?? String(p), arms })
    }
  }
}

console.log(`\n⭐⭐⭐⭐ THE HOME UNIVERSITY – round 26 #2, second pass`)
console.log(
  `   ${careers.length} careers reached the fork (of ${walked} walked) x ${COLLEGE_TIER_ORDER.length} places x ${YEARS} years` +
    ` · policy ${POLICY.label} · seeds ${SEEDS}/preset · countries ${COUNTRIES.join(', ')}`,
)

// =================================================================================================
// 1. WHICH PLACE THE FORK'S OWN DEFAULT TAKES – the answer to "how often is the home place taken"
// =================================================================================================
//
// ⚠ THE DEFAULT IS THE ONLY MODEL OF A PLAYER THIS TOOL USES, and it is not a model at all: it is
// what `answerFork` records when the card is pressed with no row chosen, and what every bench and
// every test in the repo gets. BEFORE the ruling it was «the cheapest place OPEN to her», which for
// 23 of the 24 playable countries meant the second-cheapest.
console.log(`\n⭐⭐ WHICH PLACE THE BUTTON TAKES WITH NOTHING PRESSED`)
console.log(`  ${padE('country', 10)}${pad('before', 26)}${pad('after', 26)}${pad('careers', 10)}`)
console.log(`  ${rule(72)}`)
for (const country of COUNTRIES) {
  const rows = careers.filter((c) => c.country === country)
  const before = country === 'US' ? 'state (the home place)' : 'national'
  console.log(`  ${padE(country, 10)}${pad(before, 26)}${pad('state (the home place)', 26)}${pad(rows.length, 10)}`)
}

// =================================================================================================
// 2. WHAT THE HOME PLACE COSTS HER, AND WHETHER THE BRANCH SURVIVES IT
// =================================================================================================
for (const country of COUNTRIES) {
  const rows = careers.filter((c) => c.country === country)
  if (!rows.length) continue
  console.log(`\n⭐⭐ ${country} – ${rows.length} careers, every place walked`)
  console.log(
    `  ${padE('place', 11)}${pad('covered', 10)}${pad('family $/yr', 14)}${pad('affordable', 13)}` +
      `${pad('ran out', 11)}${pad('finished 4y', 13)}${pad('funds after', 14)}`,
  )
  console.log(`  ${rule(86)}`)
  for (const tier of COLLEGE_TIER_ORDER) {
    const a = rows.map((c) => c.arms[tier])
    const aff = a.filter((r) => r.affordable).length
    const out = a.filter((r) => r.ranOut).length
    const fin = a.filter((r) => r.finished).length
    console.log(
      `  ${padE(tier, 11)}${pad(`${one(100 * median(a.map((r) => r.coveredShare)))}%`, 10)}` +
        `${pad(usd(median(a.map((r) => r.familyPerYearCents))), 14)}` +
        `${pad(`${aff}/${a.length} ${pct(aff, a.length)}`, 13)}` +
        `${pad(`${out}/${a.length} ${pct(out, a.length)}`, 11)}` +
        `${pad(`${fin}/${a.length} ${pct(fin, a.length)}`, 13)}` +
        `${pad(usd(median(a.map((r) => r.fundsAfterCents))), 14)}`,
    )
  }
}

// =================================================================================================
// 3. THE DELTA THAT IS THE RULE CHANGE – the place she used to be pushed to, against the one she can
//    take now. US is printed too and must read zero on every line.
// =================================================================================================
console.log(`\n⭐⭐⭐ WHAT THE RULING CHANGES, PER COUNTRY (the default's arm, before -> after)`)
console.log(
  `  ${padE('country', 10)}${pad('$/yr before', 14)}${pad('$/yr after', 14)}${pad('saved/yr', 13)}` +
    `${pad('ran out', 18)}${pad('finished 4y', 18)}`,
)
console.log(`  ${rule(87)}`)
for (const country of COUNTRIES) {
  const rows = careers.filter((c) => c.country === country)
  if (!rows.length) continue
  const beforeTier: CollegeTier = country === 'US' ? 'state' : 'national'
  const b = rows.map((c) => c.arms[beforeTier])
  const a = rows.map((c) => c.arms.state)
  const bill = (xs: Arm[]) => median(xs.map((r) => r.familyPerYearCents))
  const outOf = (xs: Arm[]) => xs.filter((r) => r.ranOut).length
  const finOf = (xs: Arm[]) => xs.filter((r) => r.finished).length
  console.log(
    `  ${padE(country, 10)}${pad(usd(bill(b)), 14)}${pad(usd(bill(a)), 14)}${pad(usd(bill(b) - bill(a)), 13)}` +
      `${pad(`${outOf(b)} -> ${outOf(a)} of ${rows.length}`, 18)}` +
      `${pad(`${finOf(b)} -> ${finOf(a)} of ${rows.length}`, 18)}`,
  )
}

console.log(`\n  ⚠ THE THREE STICKERS ARE UNCHANGED BY THIS ROUND AND SO ARE THE MEASURED ODDS:`)
for (const tier of COLLEGE_TIER_ORDER) {
  console.log(`    ${padE(tier, 10)} ${usd(COLLEGE_TIERS[tier].costPerYearCents)}/yr`)
}
console.log(
  `  ⚠ AND THE ONE COUNTRY RULE LEFT IS A PRICE, NOT A DOOR: \`needShareOf\` pays the need layer to a US`,
)
console.log(`    family only (34 CFR 668.33), so the ${COUNTRIES.filter((c) => c !== 'US').join('/')} column above pays more of the SAME bill.`)
console.log(`  ⚠ Weekly, at the home place: ${usd(Math.round(COLLEGE_TIERS.state.costPerYearCents / WEEKS_PER_YEAR))}/wk of sticker before any award.`)
