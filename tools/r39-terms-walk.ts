/**
 * ROUND 39 #3 – THE AD-CONTRACT TERM LADDER, WALKED: term distribution by band before/after, and
 * whether the LIFETIME letter ever fires on a walked career.
 *
 * The owner, 08.09: «мы обсуждали, что на 12 месяцев дают контракты тем, кто только идёт в топ, а
 * чем выше - тем дольше … А некоторые и пожизненно» – and «давай так попробуем, как ты предложил»
 * on the ladder this measures: 1y at ≤400/≤200, 1–2 at ≤100, 1–3 at ≤50, 2–5 at ≤10, the 8y
 * capstone untouched, the lifetime letter once per career at legend status (a Slam + the
 * capstone's own four top-10 seasons).
 *
 * WHAT IS COUNTED: every advertising letter the walked careers RECEIVE (signing is nobody's policy
 * here – an unanswered letter expires and the category re-rolls, which is more samples, not fewer).
 * For each trade letter the BEFORE term is recovered from the letter's own sub-stream: the ONE
 * uniform that maps to the term is replayed (`adLetterRng`; the author draw is spent first exactly
 * where the engine spends it) and read under the old flat mapping `1 + floor(u * 3)`. Same stream,
 * same draw, two mappings – the two arms cannot diverge by provenance, because they are one draw.
 *
 * ⚠ THE LIFETIME GATE'S REACHABILITY IS REPORTED EITHER WAY: a letter that never fires on any
 * walked career is a finding, not a silence – the per-career gate telemetry (max tenure reached,
 * slams won) says WHICH half of the gate went unmet.
 *
 * MEASUREMENT ONLY: reads the engine through the bench's own career loop, writes no constant.
 *
 * Run:  npx vite-node tools/r39-terms-walk.ts
 *       npx vite-node tools/r39-terms-walk.ts -- --weeks 832 --seeds 2
 */
import { capstoneSeasonsOf, reviewAdOffer } from '../src/engine/world/sponsors'
import { adBandOfTerms, adCategoryOf, adLetterRng, adWritesAt } from '../src/engine/offers'
import { createWorld, KID_ID, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type AdCategory, type AdOfferTerms } from '../src/shared/protocol'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'

const AD = ECONOMY.advertising

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const at = args.indexOf(`--${name}`)
  return at >= 0 && args[at + 1] ? Number(args[at + 1]) : fallback
}
/** His own save's length – the horizon on which the top band and the legend gate are reachable. */
const WEEKS = argOf('weeks', 832)
const SEEDS = argOf('seeds', 2)

/** counts[band][years] for the two arms; trade letters only (fixed-term papers have no draw). */
const after: Record<number, Record<number, number>> = {}
const before: Record<number, Record<number, number>> = {}
const bump = (table: Record<number, Record<number, number>>, band: number, years: number): void => {
  table[band] ??= {}
  table[band][years] = (table[band][years] ?? 0) + 1
}

let capstoneLetters = 0
const lifetimeFires: string[] = []
const gateTelemetry: { career: string; maxTenure: number; slams: number; endWeek: number; bestRank: number | null; ending: string }[] = []

for (const preset of PRESETS) {
  for (let i = 0; i < SEEDS; i++) {
    const { world, rng, seed } = openCareer(preset, i, POLICIES[0])
    let seen = 0
    let maxTenure = 0
    let bestRankSeen: number | null = null
    for (let w = 0; w < WEEKS; w++) {
      stepCareerWeek(world, rng, POLICIES[0])
      maxTenure = Math.max(maxTenure, capstoneSeasonsOf(world))
      const live = world.kidRankWta
      if (typeof live === 'number' && live > 0 && (bestRankSeen === null || live < bestRankSeen)) bestRankSeen = live
      // every letter that arrived THIS week, once
      for (let k = seen; k < world.offers.length; k++) {
        const o = world.offers[k]
        if (o.kind !== 'ad' || o.week !== world.week) continue
        const t = o.terms as AdOfferTerms
        const category = adCategoryOf(t)
        if (category === 'capstone') {
          capstoneLetters++
          continue
        }
        if (category === 'lifetime') {
          lifetimeFires.push(`${seed} w${o.week} (${t.brand})`)
          continue
        }
        const band = adBandOfTerms(t)
        bump(after, band, Math.max(1, t.termYears ?? 1))
        // the same stream the engine rolled: author first (except clothing, whose author is the
        // kit deal), then the ONE term uniform – read under the old flat mapping.
        const replay = adLetterRng(world.seed, o.week, category)
        if (category !== 'clothing') replay()
        const u = replay()
        bump(before, band, 1 + Math.floor(u * 3))
      }
      seen = world.offers.length
    }
    gateTelemetry.push({
      career: seed,
      maxTenure,
      slams: world.trophiesByTier?.slam?.titles?.length ?? 0,
      endWeek: world.week,
      bestRank: bestRankSeen,
      ending: world.ending?.type ?? 'playing',
    })
  }
}

function table(name: string, counts: Record<number, Record<number, number>>): void {
  console.log(`\n${name} – letters by band x term years:`)
  console.log('  band        |    1y |    2y |    3y |    4y |    5y | letters')
  for (let b = 0; b < AD.bands.length; b++) {
    const row = counts[b] ?? {}
    const total = Object.values(row).reduce((s, n) => s + n, 0)
    if (total === 0) continue
    const cells = [1, 2, 3, 4, 5].map((y) => String(row[y] ?? 0).padStart(5))
    console.log(`  <=${String(AD.bands[b].maxWtaRank).padEnd(9)} | ${cells.join(' | ')} | ${total}`)
  }
}

console.log(`r39 #3 – term walk: ${PRESETS.length} presets x ${SEEDS} seeds x ${WEEKS} weeks`)
table('BEFORE (flat 1-3, same draws)', before)
table('AFTER (the band ladder)', after)
console.log(`\ncapstone letters written: ${capstoneLetters}`)
console.log(
  lifetimeFires.length > 0
    ? `lifetime letters written: ${lifetimeFires.length}\n  ${lifetimeFires.join('\n  ')}`
    : 'lifetime letters written: NONE on the walked set',
)
console.log('\nper-career telemetry (why the upper bands did or did not write):')
for (const g of gateTelemetry) {
  console.log(
    `  ${g.career.padEnd(18)} best wta ${String(g.bestRank ?? '-').padStart(4)} | top-10 seasons ${g.maxTenure} | slams ${g.slams} | ${g.ending} at w${g.endWeek}`,
  )
}

// =================================================================================================
// THE PER-BAND PROBE – the same engine path (`reviewAdOffer` -> the letter's own stream) on gate
// probes standing INSIDE each band, because the bench's default policy careers plateau low and the
// walked read alone would leave the upper bands' cells unmeasured. The probe idiom is
// tests/round29p4-ad-portfolio.test.ts's `probeWorld`, verbatim in shape.
// =================================================================================================
function probeWorld(seed: string, week: number, rank: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
  world.kidRankWta = rank
  return world
}
function rollFor(seed: string, category: AdCategory, from: number, limit = 400): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance, category)) return w
  return -1
}
const probeAfter: Record<number, Record<number, number>> = {}
const probeBefore: Record<number, Record<number, number>> = {}
const RANK_IN_BAND = [380, 150, 80, 30, 5]
for (let b = 0; b < AD.bands.length; b++) {
  for (let n = 0; n < 40; n++) {
    const seed = `r39-probe-${b}-${n}`
    const hit = rollFor(seed, 'drinks', 300)
    if (hit < 0) continue
    const world = probeWorld(seed, hit, RANK_IN_BAND[b])
    reviewAdOffer(world)
    const o = world.offers.find((x) => x.kind === 'ad' && adCategoryOf(x.terms as AdOfferTerms) === 'drinks')
    if (!o) continue
    const t = o.terms as AdOfferTerms
    bump(probeAfter, b, Math.max(1, t.termYears ?? 1))
    const replay = adLetterRng(world.seed, o.week, 'drinks')
    replay() // the author draw
    bump(probeBefore, b, 1 + Math.floor(replay() * 3))
  }
}
table('PROBE BEFORE (flat 1-3, same draws) – drinks, 40 probes per band', probeBefore)
table('PROBE AFTER (the band ladder) – drinks, 40 probes per band', probeAfter)
