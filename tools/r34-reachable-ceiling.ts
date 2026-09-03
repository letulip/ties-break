// ROUND 34 BUNDLE I – WHAT THE CEILING READ IS A FRACTION *OF*, measured three ways.
//
//   npx vite-node tools/r34-reachable-ceiling.ts [--seeds N] [--weeks N] [--skip-walk]
//
// WHY IT EXISTS. Round 34 #2b made the coach's ceiling read measure true realisation –
// `(skills - born) / (potential - born)` – and the owner approved band edges of 0.40 / 0.75 / 0.90
// on it. Bundle A then walked real careers and found the top band effectively elite-only: budget,
// middle and high rungs peak at 0.855 / 0.879 / 0.895 and never hear «At her ceiling» at all.
//
// THE DENOMINATOR IS AN ASYMPTOTE. `growWeek` gains `rate * headroom * luck` – a SHARE of what is
// left – so the distance to `potential` shrinks geometrically and never closes, and `ageFactor`
// returns 0 from `declineStart`, so whatever is unfilled at that age is unfilled for ever. The
// approved edges were being applied to a scale whose top does not exist. Bundle H divides by
// `reachableHeadroomShare()` instead.
//
// ⚠⚠ AND BUNDLE I IS THE CORRECTION TO BUNDLE H, WHICH IS WHY THIS TOOL WAS RE-AIMED RATHER THAN
// RETIRED. H normalised by `ageFactor` ALONE – the growth of a girl with no coach at all and no
// matches. A girl WITH a coach grows faster than that, so she exceeds the denominator and hits the
// `Math.min(1, …)` clamp in `realisedShare`: measured, a middle-coached career read «At her ceiling»
// from about NINETEEN and for the rest of her life, while an elite coach demonstrably still added.
// That is the owner's own complaint («звучит как приговор») moved from fourteen to nineteen. The
// band's job is to answer «is there still room worth BUYING», so the yardstick is the BEST COACHING
// AVAILABLE – `coachFactor('elite', 'great')` with the match bonus at its cap – and section 2 below
// is the before/after that says so in numbers. This tool is the evidence for three questions:
//
//   1. WHAT IS THE NORMALISER, and does it move when its inputs move? (It must: a future wave is
//      approved to move `plateauStart` 23 -> 28 and `declineStart` 29 -> 33, and a hardcoded 0.9766
//      would rot silently the day it landed. Section 1 moves the curve AND the coach ladder AND the
//      match bonus, because since bundle I all three are inputs.)
//   2. BARE CURVE OR BEST COACHED? Both are measured here, so the choice is made against numbers –
//      and section 2 prints what each rung READS under each denominator, which is where H's defect
//      is visible as a column of clamped 1.000s.
//   3. WHICH BAND DOES EACH RUNG NOW REACH at its own peak – walked through the real engine, the
//      same walk bundle A ran, so the before and after are the same measurement. ⚠ `self` is in the
//      list since bundle I: it must NEVER reach the top band, because a coach would still buy her
//      something and that is exactly what the band exists to say.
//
// MEASUREMENT ONLY. It calls engine functions and counts. No engine number is written from here –
// section 1's sensitivity arms mutate `ECONOMY` and put it back.

import { ageFactor, reachableHeadroomShare, SKILL_KEYS } from '../src/engine/development'
import { coachFactor } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_IN_SEASON } from '../src/shared/dates'
import { createWorld, tickWeek } from '../src/engine/world'
import { startingSkills } from '../src/engine/world/player'
import { coachRoomBandOf, coachRoomBandLabel } from '../src/engine/world/coachMarket'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 8)
/** 780 weeks = 15 seasons, 14 -> 29: the whole growth arc and none of the decline past it. The same
 *  horizon bundle A walked, so its 0.855 / 0.879 / 0.895 and this tool's numbers are comparable. */
const WEEKS = argOf('weeks', 780)
const SKIP_WALK = args.includes('--skip-walk')

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const pct = (x: number) => (100 * x).toFixed(1) + '%'

// =================================================================================================
// 1. THE NORMALISER ITSELF – derived from the curve, and it MOVES WITH THE CURVE
// =================================================================================================

console.log('ROUND 34 BUNDLE I – the yardstick is the BEST COACHING AVAILABLE, not no coaching\n')
console.log(
  '1. THE DERIVED NORMALISER – 1 - Π(1 - ageFactor(age) * bestCoachedRate()) to declineStart',
)

const c = ECONOMY.development.ageCurve
console.log(
  `   shipped curve: growthStart ${c.growthStart} · growthEnd ${c.growthEnd} · plateauStart ` +
    `${c.plateauStart} · declineStart ${c.declineStart} · peakRate ${c.peakRate} · ` +
    `growthEase ${c.growthEase} · plateauRate ${c.plateauRate}`,
)
/** The multiplier `reachableHeadroomShare` walks at. ⚠ RE-DERIVED HERE, NOT IMPORTED: `bestCoachedRate`
 *  is private to development.ts, and a tool that quoted its VALUE would be the hardcode the whole
 *  bundle is about. Same expression, same inputs, so a retune moves both. */
const BEST = coachFactor('elite', 'great') * (1 + ECONOMY.development.matchBonusCap * ECONOMY.development.matchBonus)
console.log(
  `   shipped ladder: coachFactor('elite','great') = ${coachFactor('elite', 'great').toFixed(4)} · ` +
    `matchBonus ${ECONOMY.development.matchBonus} capped at ${ECONOMY.development.matchBonusCap} ` +
    `-> best week = ${BEST.toFixed(6)}x the bare curve`,
)
const SHIPPED = reachableHeadroomShare()
console.log(
  `   ⭐ reachableHeadroomShare() = ${SHIPPED.toFixed(6)}  (${pct(SHIPPED)} of her headroom)`,
)
console.log(
  `   ...so even the best-coached career leaves ${pct(1 - SHIPPED)} nobody can ever take – the ` +
    `ceiling is still an asymptote – and the approved 0.90 edge now sits INSIDE the scale.`,
)

// The two route pairs a career can actually resolve at the fork (round 31 #10). Reported because
// they are NOT the shipped default and a reader will ask.
console.log('\n   the per-route curves, for scale – the normaliser is the shipped pair, not these:')
for (const [route, pair] of Object.entries(ECONOMY.development.ageRoutes)) {
  const share = reachableHeadroomShare(pair)
  console.log(
    `     ${padE(route, 8)} plateau ${pad(pair.plateauStart, 2)} decline ${pad(pair.declineStart, 2)}` +
      `  ->  ${share.toFixed(6)}  (${pct(share)}, ${((share / SHIPPED - 1) * 100).toFixed(1)}% vs shipped)`,
  )
}

// --- the arm that proves it is derived and not written down --------------------------------------
//
// ⚠ THIS MUTATES THE SHIPPED KNOBS AND PUTS THEM BACK. The approved future wave moves `plateauStart`
// and `declineStart`; if any of these rows prints the same number as the shipped one, the normaliser
// is a literal wearing a function and this whole bundle is void.
//
// ⚠⚠ AND SINCE BUNDLE I THE LADDER IS AN INPUT TOO. The last three rows move `developmentFactor.elite`,
// `fitFactor.great` and `matchBonus` – a curve-only sensitivity table would now be testing half the
// function and would pass while a coach retune rotted the read.
console.log('\n   SENSITIVITY – move any input and the normaliser must move with it:')
console.log('   what moved                              normaliser      delta')
// ⚠ `ECONOMY` IS DECLARED `as const`, so these numbers are readonly to the type system and writeable
// at runtime. Each cast is narrowed to the fields this section moves, every arm restores before it
// runs, and the last line below re-reads the shipped value to prove the tool left nothing behind.
const mut = c as { peakRate: number; plateauRate: number; declineStart: number }
const dev = ECONOMY.development as { matchBonus: number; matchBonusCap: number }
const ladder = ECONOMY.coach.developmentFactor as Record<string, number>
const fits = ECONOMY.coach.fitFactor as Record<string, number>
const restore = { plateauRate: c.plateauRate, declineStart: c.declineStart, peakRate: c.peakRate }
const restoreLadder = {
  matchBonus: ECONOMY.development.matchBonus,
  matchBonusCap: ECONOMY.development.matchBonusCap,
  elite: ECONOMY.coach.developmentFactor.elite,
  great: ECONOMY.coach.fitFactor.great,
}
const putBack = () => {
  Object.assign(mut, restore)
  dev.matchBonus = restoreLadder.matchBonus
  dev.matchBonusCap = restoreLadder.matchBonusCap
  ladder.elite = restoreLadder.elite
  fits.great = restoreLadder.great
}
const sensitivity: { what: string; apply: () => void }[] = [
  { what: 'shipped (nothing moved)', apply: () => {} },
  { what: `plateauRate ${restore.plateauRate} -> 0.0018 (doubled)`, apply: () => { mut.plateauRate = 0.0018 } },
  { what: `plateauRate ${restore.plateauRate} -> 0.0005`, apply: () => { mut.plateauRate = 0.0005 } },
  { what: `declineStart ${restore.declineStart} -> 33 (the approved wave)`, apply: () => { mut.declineStart = 33 } },
  { what: `declineStart ${restore.declineStart} -> 26 (earlier)`, apply: () => { mut.declineStart = 26 } },
  { what: 'both: plateauRate 0.0018 and declineStart 33', apply: () => { mut.plateauRate = 0.0018; mut.declineStart = 33 } },
  { what: `peakRate ${restore.peakRate} -> 0.0080`, apply: () => { mut.peakRate = 0.008 } },
  { what: `coach elite ${restoreLadder.elite} -> 1.30`, apply: () => { ladder.elite = 1.3 } },
  { what: `coach elite ${restoreLadder.elite} -> 1.05`, apply: () => { ladder.elite = 1.05 } },
  { what: `fit great ${restoreLadder.great} -> 1.15`, apply: () => { fits.great = 1.15 } },
  { what: `matchBonus ${restoreLadder.matchBonus} -> 0.30`, apply: () => { dev.matchBonus = 0.3 } },
  { what: `matchBonus ${restoreLadder.matchBonus} -> 0.08`, apply: () => { dev.matchBonus = 0.08 } },
  { what: `matchBonusCap ${restoreLadder.matchBonusCap} -> 5`, apply: () => { dev.matchBonusCap = 5 } },
]
for (const arm of sensitivity) {
  putBack()
  arm.apply()
  const share = reachableHeadroomShare()
  console.log(
    `   ${padE(arm.what, 38)}  ${pad(share.toFixed(6), 10)}  ${pad(((share - SHIPPED) * 100).toFixed(2) + 'pp', 9)}`,
  )
}
putBack()
console.log(
  `   restored: reachableHeadroomShare() = ${reachableHeadroomShare().toFixed(6)} ` +
    `(${reachableHeadroomShare() === SHIPPED ? 'identical to the shipped value' : '⚠⚠ NOT RESTORED'})`,
)

// =================================================================================================
// 2. CURVE-ONLY OR BEST-COACHED – the decision, measured at both ends of the market
// =================================================================================================
//
// The same walk with a CONSTANT multiplier on the rate, which is what everything other than age
// contributes in `growWeek`: `rate = ageFactor * trainFactor * loadFactor * coachFactor * matchBonus`.
// Luck is left at its mean of 1.0 – `weekLuck` is symmetric [0.55, 1.45] – because a normaliser that
// moved with the dice would not be a scale.
function reachableAt(multiplier: number): number {
  let left = 1
  for (let w = 0; ; w++) {
    const age = c.growthStart + w / WEEKS_IN_SEASON
    if (age >= c.declineStart) break
    left *= 1 - ageFactor(age) * multiplier
  }
  return 1 - left
}

console.log('\n2. THE DECISION – normalise by the BARE CURVE (bundle H), or by the best coaching?')
console.log(
  '   arm                                              multiplier   reachable    H shows    I shows',
)
// ⚠ THE COACH ARMS ARE READ AT trainFactor 1.0 – the plan whose `train` is 72.5 – so the coach's
// contribution stands alone and the ladder below is the market's own spread and nothing else.
const GRIND = ECONOMY.development.trainAt85 // what `trainFactor` returns at plan.train = 85
const BARE = reachableAt(1) // what bundle H divided by: age alone, no coach, no matches
const arms: { what: string; m: number }[] = [
  { what: 'bare curve – no coach, no matches, nothing but age', m: 1 },
  {
    what: 'self-coached, badly matched (0.82 x 0.94)',
    m: coachFactor('self', 'off'),
  },
  {
    what: "self-coached, the parent's own fit (0.82 x 1.00)",
    m: coachFactor('self', ECONOMY.coach.selfFit),
  },
  { what: 'budget coach, well matched (0.95 x 1.05)', m: coachFactor('budget', 'great') },
  { what: 'middle coach, well matched (1.04 x 1.05)', m: coachFactor('middle', 'great') },
  { what: 'high coach, well matched (1.11 x 1.05)', m: coachFactor('high', 'great') },
  { what: 'elite coach, well matched (1.15 x 1.05)', m: coachFactor('elite', 'great') },
  {
    what: '⭐ elite + great + the match bonus at its cap = THE YARDSTICK',
    m: BEST,
  },
  {
    what: 'elite + great + a grinding plan every week',
    m: coachFactor('elite', 'great') * GRIND,
  },
  {
    what: 'elite + great + grind + three matches a week',
    m:
      coachFactor('elite', 'great') *
      GRIND *
      (1 + ECONOMY.development.matchBonusCap * ECONOMY.development.matchBonus),
  },
]
for (const arm of arms) {
  const share = reachableAt(arm.m)
  // What a career that took EXACTLY this arm's maximum would be SHOWN under each denominator, with
  // `realisedShare`'s clamp applied – which is where bundle H's defect becomes a column of 1.000s.
  const underH = Math.min(1, share / BARE)
  const underI = Math.min(1, share / SHIPPED)
  console.log(
    `   ${padE(arm.what, 48)} ${pad(arm.m.toFixed(4), 10)}   ${pad(share.toFixed(4), 9)}  ` +
      `${pad(underH.toFixed(3) + (underH >= 1 ? '⚠' : ' '), 9)}  ${pad(underI.toFixed(3), 8)}`,
  )
}
console.log(
  '\n   ⚠⚠ THE «H shows» COLUMN IS THE DEFECT. Bundle H divided by the BARE CURVE – the growth of a\n' +
    '     girl with no coach at all and no matches – so every rung from budget upward exceeds the\n' +
    '     denominator and is PINNED at 1.000 by the clamp in `realisedShare`. A middle-coached career\n' +
    '     read «At her ceiling» from about nineteen and for ever after, while an elite coach\n' +
    '     demonstrably still added to her, and the band\'s own note («no coach can add much more now,\n' +
    '     whatever the price») was false where it was being shown.\n' +
    '\n   ⭐ THE CHOICE IS THE BEST-COACHED ARM, and the argument is what the band is FOR: it answers\n' +
    '     «is there still room worth BUYING», so the yardstick has to be what the best available\n' +
    '     coaching could reach. Bundle H rejected this denominator for putting «the parent\'s\n' +
    '     chequebook inside his daughter\'s ceiling» – reconsidered, and the objection does not apply:\n' +
    '     the denominator is ONE CONSTANT for every career, so two identical girls read identically\n' +
    '     whatever their families can afford. What differs is the NUMERATOR – how much she actually\n' +
    '     gained – and that difference is real.',
)

// =================================================================================================
// 3. WHAT EACH RUNG NOW READS – walked through the real engine, before and after
// =================================================================================================

/** The RAW share – `(skills - born) / (potential - born)`, the quantity round 34 #2b shipped and
 *  bundle A measured. Re-derived here rather than imported: `realisedShare` is private, and the
 *  point of the table is to show the raw number beside the normalised one. */
function rawShare(world: ReturnType<typeof createWorld>): number {
  const born = startingSkills(world.seed, world.profile)
  let gained = 0
  let room = 0
  for (const k of SKILL_KEYS) {
    gained += world.skills[k] - born[k]
    room += world.potential[k] - born[k]
  }
  return room > 0 ? gained / room : 0
}

if (!SKIP_WALK) {
  console.log(
    `\n3. WHAT EACH RUNG REACHES AT ITS PEAK – ${SEEDS} careers per rung, ${WEEKS} weeks (14 -> ` +
      `${(14 + WEEKS / WEEKS_IN_SEASON).toFixed(0)}), real engine, real ticks`,
  )
  console.log(
    '   rung     peak RAW share   peak SHOWN share   band reached          reached «At her ceiling»',
  )
  // ⚠ `self` IS IN THE LIST SINCE BUNDLE I and it is the row that must say «never». A self-coached
  // career tops out around 0.85 of the best-coached scale, so the top band stays out of her reach –
  // which is the CORRECT advice, because a coach would still buy her something.
  const RUNGS: CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']
  for (const tier of RUNGS) {
    const raws: number[] = []
    const showns: number[] = []
    const bands: number[] = []
    let reachedTop = 0
    const topWeeks: number[] = []
    for (let s = 0; s < SEEDS; s++) {
      const world = createWorld(`r34h-${tier}-${s}`, { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      let peakRaw = 0
      let peakBand = coachRoomBandOf(world) ?? 0
      let topWeek = -1
      for (let w = 0; w < WEEKS; w++) {
        tickWeek(world, rng)
        peakRaw = Math.max(peakRaw, rawShare(world))
        const band = coachRoomBandOf(world) ?? 0
        if (band > peakBand) peakBand = band
        if (band === 3 && topWeek < 0) topWeek = world.week
      }
      raws.push(peakRaw)
      showns.push(Math.min(1, peakRaw / SHIPPED))
      bands.push(peakBand)
      if (topWeek >= 0) {
        reachedTop += 1
        topWeeks.push(topWeek)
      }
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const best = Math.max(...bands)
    const weeksNote =
      topWeeks.length > 0
        ? `weeks ${Math.min(...topWeeks)}-${Math.max(...topWeeks)}`
        : 'never'
    console.log(
      `   ${padE(tier, 8)} ${pad(mean(raws).toFixed(3), 14)}   ${pad(mean(showns).toFixed(3), 16)}   ` +
        `${padE(coachRoomBandLabel(best), 21)} ${pad(`${reachedTop}/${SEEDS}`, 5)} ${weeksNote}`,
    )
  }
  console.log(
    '\n   ⚠ THE RAW COLUMN IS BUNDLE A\'S MEASUREMENT, UNCHANGED – budget / middle / high peaked at\n' +
      '     0.855 / 0.879 / 0.895 there and none of them reached the approved 0.90. The SHOWN column\n' +
      '     is the same careers over the best-coached denominator, which is the only thing bundle I\n' +
      '     moved. ⭐ `self` reaches band 2 and stops, which is the row bundle I exists to produce.',
  )

  // --- IS THE CLAMP LOAD-BEARING? -----------------------------------------------------------------
  //
  // ⚠⚠ THIS IS THE MEASUREMENT THAT NAMES BUNDLE H'S DEFECT MECHANICALLY. `realisedShare` ends in
  // `Math.min(1, …)`. Under H's bare-curve denominator that clamp was doing the READING – a coached
  // career sailed past 1.0 early and sat there – so the top of the scale was not a scale at all.
  // Under bundle I an ordinary well-coached career must stay UNDER 1 on the raw ratio, with the
  // clamp a guard against the maximally optimised case and nothing else.
  console.log('\n   IS THE CLAMP LOAD-BEARING? – peak raw ratio against each denominator, and the')
  console.log('   share of the career\'s weeks spent pinned at 1.000 by it:')
  console.log('   rung     peak ratio (I)   weeks pinned (I)   peak ratio (H)   weeks pinned (H)')
  for (const tier of RUNGS) {
    let peakI = 0
    let peakH = 0
    let pinnedI = 0
    let pinnedH = 0
    let weeks = 0
    for (let s = 0; s < SEEDS; s++) {
      const world = createWorld(`r34i-clamp-${tier}-${s}`, { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      for (let w = 0; w < WEEKS; w++) {
        tickWeek(world, rng)
        const raw = rawShare(world)
        peakI = Math.max(peakI, raw / SHIPPED)
        peakH = Math.max(peakH, raw / BARE)
        if (raw / SHIPPED >= 1) pinnedI += 1
        if (raw / BARE >= 1) pinnedH += 1
        weeks += 1
      }
    }
    console.log(
      `   ${padE(tier, 8)} ${pad(peakI.toFixed(3), 14)}   ${pad(pct(pinnedI / weeks), 16)}   ` +
        `${pad(peakH.toFixed(3), 14)}   ${pad(pct(pinnedH / weeks), 16)}`,
    )
  }

  // --- the ladder a normal career now walks --------------------------------------------------------
  //
  // The other half of the question: not only WHICH band it reaches, but WHEN each one arrives. The
  // owner's complaint was that «Close to her ceiling» landed on a fourteen-year-old.
  // ⚠⚠ EVERY SEED, NOT ONE CAREER. Bundle H printed a single career per rung here, and on the top
  // band that is exactly the resolution at which a marginal result looks decisive: under bundle I
  // the budget and middle rungs sit ON the 0.90 edge, so one seed says "age 28.8" and the next says
  // "never" for the same rung. The reach count and the spread are the honest report.
  console.log(
    `\n4. WHEN EACH BAND ARRIVES – ${SEEDS} careers per rung, the age at each first reading` +
      ' (median, and the range)',
  )
  console.log(
    '   rung     ' + [0, 1, 2, 3].map((b) => padE(coachRoomBandLabel(b), 26)).join('') + 'reached top',
  )
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b)
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
  }
  const ageOf = (week: number) => 14 + week / WEEKS_IN_SEASON
  // ⚠ `r23-walk` IS THE CAREER THE GUARD TEST WALKS (tests/round23-coach-copy.test.ts, the
  // no-flicker walk). It is listed by name because that test's pinned band list moved with this
  // bundle, and a reader comparing the two wants the same career, not a similar one.
  const COHORTS: { label: string; seeds: string[]; tier: CoachTier }[] = [
    ...RUNGS.map((tier) => ({
      label: tier,
      tier,
      seeds: Array.from({ length: SEEDS }, (_, s) => `r34h-when-${tier}-${s}`),
    })),
    { label: 'r23-walk', seeds: ['r23-walk'], tier: 'middle' as CoachTier },
  ]
  for (const { label, seeds, tier } of COHORTS) {
    const arrivals: number[][] = [[], [], [], []]
    for (const seed of seeds) {
      const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      const firstAt = new Map<number, number>()
      firstAt.set(coachRoomBandOf(world) ?? 0, 0)
      for (let w = 0; w < WEEKS; w++) {
        tickWeek(world, rng)
        const band = coachRoomBandOf(world) ?? 0
        if (!firstAt.has(band)) firstAt.set(band, world.week)
      }
      for (const b of [0, 1, 2, 3]) {
        const week = firstAt.get(b)
        if (week !== undefined) arrivals[b].push(week)
      }
    }
    const cells = [0, 1, 2, 3].map((b) => {
      const got = arrivals[b]
      if (got.length === 0) return padE('never', 26)
      const lo = ageOf(Math.min(...got))
      const hi = ageOf(Math.max(...got))
      const mid = ageOf(median(got))
      const miss = got.length < seeds.length ? ` ${got.length}/${seeds.length}` : ''
      return padE(`${mid.toFixed(1)} (${lo.toFixed(1)}-${hi.toFixed(1)})${miss}`, 26)
    })
    console.log(
      `   ${padE(label, 8)} ${cells.join('')}${arrivals[3].length}/${seeds.length}`,
    )
  }

  // --- the same career, share by share, which is what the guard test's comment table carries -----
  console.log('\n5. `r23-walk` YEAR BY YEAR – the raw share, and the share the player is now shown')
  {
    const world = createWorld('r23-walk', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const rng = rngFromSeed(world.seed)
    const raws: number[] = [rawShare(world)]
    const shown: number[] = [Math.min(1, raws[0] / SHIPPED)]
    const ages: number[] = [14]
    for (let w = 1; w <= 780; w++) {
      tickWeek(world, rng)
      if (w % WEEKS_IN_SEASON === 0) {
        const raw = rawShare(world)
        raws.push(raw)
        shown.push(Math.min(1, raw / SHIPPED))
        ages.push(14 + w / WEEKS_IN_SEASON)
      }
    }
    console.log('   age   ' + ages.map((a) => pad(a.toFixed(0), 6)).join(''))
    console.log('   raw   ' + raws.map((x) => pad(x.toFixed(3), 6)).join(''))
    console.log('   shown ' + shown.map((x) => pad(x.toFixed(3), 6)).join(''))
  }
}
