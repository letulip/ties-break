// ROUND 34 BUNDLE H – WHAT THE CEILING READ IS A FRACTION *OF*, measured three ways.
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
// `reachableHeadroomShare()` instead. This tool is the evidence for all three questions that raised:
//
//   1. WHAT IS THE NORMALISER, and does it move when the curve moves? (It must: a future wave is
//      approved to raise `plateauRate` and push `declineStart` later, and a hardcoded 0.867 would
//      rot silently the day it landed.)
//   2. CURVE-ONLY OR BEST-COACHED? Both are measured here, so the choice is made against numbers.
//   3. WHICH BAND DOES EACH RUNG NOW REACH at its own peak – walked through the real engine, the
//      same walk bundle A ran, so the before and after are the same measurement.
//
// MEASUREMENT ONLY. It calls engine functions and counts. No engine number is written from here –
// section 1's sensitivity arm mutates `ECONOMY.development.ageCurve` and puts it back.

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

console.log('ROUND 34 BUNDLE H – the ceiling read is normalised against what is REACHABLE\n')
console.log('1. THE DERIVED NORMALISER – 1 - Π(1 - ageFactor(age)) from growthStart to declineStart')

const c = ECONOMY.development.ageCurve
console.log(
  `   shipped curve: growthStart ${c.growthStart} · growthEnd ${c.growthEnd} · plateauStart ` +
    `${c.plateauStart} · declineStart ${c.declineStart} · peakRate ${c.peakRate} · ` +
    `growthEase ${c.growthEase} · plateauRate ${c.plateauRate}`,
)
const SHIPPED = reachableHeadroomShare()
console.log(
  `   ⭐ reachableHeadroomShare() = ${SHIPPED.toFixed(6)}  (${pct(SHIPPED)} of her headroom)`,
)
console.log(
  `   ...so the ceiling is short by ${pct(1 - SHIPPED)} that no career can ever take, and the ` +
    `approved 0.90 edge sat above ${pct(SHIPPED)} of the old scale.`,
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
// ⚠ THIS MUTATES THE SHIPPED CURVE AND PUTS IT BACK. The approved future wave raises `plateauRate`
// and pushes `declineStart`; if either of these rows prints the same number as the shipped one, the
// normaliser is a literal wearing a function and this whole bundle is void.
console.log('\n   SENSITIVITY – move the curve and the normaliser must move with it:')
console.log('   what moved                              normaliser      delta')
// ⚠ `ECONOMY` IS DECLARED `as const`, so these numbers are readonly to the type system and writeable
// at runtime. The cast is narrowed to the three fields this section moves, every arm restores before
// it runs, and the last line below re-reads the shipped value to prove the tool left nothing behind.
const mut = c as { peakRate: number; plateauRate: number; declineStart: number }
const restore = { plateauRate: c.plateauRate, declineStart: c.declineStart, peakRate: c.peakRate }
const sensitivity: { what: string; apply: () => void }[] = [
  { what: 'shipped (nothing moved)', apply: () => {} },
  { what: `plateauRate ${restore.plateauRate} -> 0.0018 (doubled)`, apply: () => { mut.plateauRate = 0.0018 } },
  { what: `plateauRate ${restore.plateauRate} -> 0.0005`, apply: () => { mut.plateauRate = 0.0005 } },
  { what: `declineStart ${restore.declineStart} -> 32 (later)`, apply: () => { mut.declineStart = 32 } },
  { what: `declineStart ${restore.declineStart} -> 26 (earlier)`, apply: () => { mut.declineStart = 26 } },
  { what: 'both: plateauRate 0.0018 and declineStart 32', apply: () => { mut.plateauRate = 0.0018; mut.declineStart = 32 } },
  { what: `peakRate ${restore.peakRate} -> 0.0080`, apply: () => { mut.peakRate = 0.008 } },
]
for (const arm of sensitivity) {
  Object.assign(mut, restore)
  arm.apply()
  const share = reachableHeadroomShare()
  console.log(
    `   ${padE(arm.what, 38)}  ${pad(share.toFixed(6), 10)}  ${pad(((share - SHIPPED) * 100).toFixed(2) + 'pp', 9)}`,
  )
}
Object.assign(mut, restore)
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

console.log('\n2. THE DECISION – normalise by the CURVE, or by the best coach money can buy?')
console.log('   arm                                              multiplier   reachable')
// ⚠ THE COACH ARMS ARE READ AT trainFactor 1.0 – the plan whose `train` is 72.5 – so the coach's
// contribution stands alone and the ladder below is the market's own spread and nothing else.
const GRIND = ECONOMY.development.trainAt85 // what `trainFactor` returns at plan.train = 85
const arms: { what: string; m: number }[] = [
  { what: 'curve only – no coach, no plan, nothing but age', m: 1 },
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
  { what: '⭐ elite coach, well matched (1.15 x 1.05)', m: coachFactor('elite', 'great') },
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
  console.log(
    `   ${padE(arm.what, 48)} ${pad(arm.m.toFixed(4), 10)}   ${pad(share.toFixed(4), 9)} (${pct(share)})`,
  )
}
console.log(
  '\n   ⭐ THE CHOICE IS THE CURVE-ONLY ARM. Normalising by the best-coached maximum would put the\n' +
    '     parent\'s chequebook inside HER ceiling: two identical girls would read differently because\n' +
    '     one family could afford an elite coach, and the well-coached one would be told she has LESS\n' +
    '     left than she has. The curve is the part of the denominator that belongs to the player.',
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
  const RUNGS: CoachTier[] = ['budget', 'middle', 'high', 'elite']
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
      '     is the same careers over the reachable denominator, which is the only thing bundle H moved.',
  )

  // --- the ladder a normal career now walks --------------------------------------------------------
  //
  // The other half of the question: not only WHICH band it reaches, but WHEN each one arrives. The
  // owner's complaint was that «Close to her ceiling» landed on a fourteen-year-old.
  console.log('\n4. WHEN EACH BAND ARRIVES – one career per rung, the age at each first reading')
  console.log('   career   ' + [0, 1, 2, 3].map((b) => padE(coachRoomBandLabel(b), 22)).join(''))
  // ⚠ `r23-walk` IS THE CAREER THE GUARD TEST WALKS (tests/round23-coach-copy.test.ts, the
  // no-flicker walk). It is listed by name because that test's pinned band list moved with this
  // bundle, and a reader comparing the two wants the same career, not a similar one.
  const CAREERS: { label: string; seed: string; tier: CoachTier }[] = [
    ...(['budget', 'middle', 'high', 'elite'] as CoachTier[]).map((tier) => ({
      label: tier,
      seed: `r34h-when-${tier}`,
      tier,
    })),
    { label: 'r23-walk', seed: 'r23-walk', tier: 'middle' },
  ]
  for (const { label, seed, tier } of CAREERS) {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
    const rng = rngFromSeed(world.seed)
    const firstAt = new Map<number, number>()
    firstAt.set(coachRoomBandOf(world) ?? 0, 0)
    for (let w = 0; w < WEEKS; w++) {
      tickWeek(world, rng)
      const band = coachRoomBandOf(world) ?? 0
      if (!firstAt.has(band)) firstAt.set(band, world.week)
    }
    const cells = [0, 1, 2, 3].map((b) => {
      const week = firstAt.get(b)
      if (week === undefined) return padE('never', 22)
      return padE(`age ${(14 + week / WEEKS_IN_SEASON).toFixed(1)} (w${week})`, 22)
    })
    console.log(`   ${padE(label, 8)} ${cells.join('')}`)
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
