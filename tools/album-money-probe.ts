// THE ALBUM'S TWO NUMBERS, DECOMPOSED – round 46 items 9 and 10, measured rather than argued.
//
//   npx vite-node tools/album-money-probe.ts [--weeks N] [--preset i] [--index i] [--shop 0|1]
//   npx vite-node tools/album-money-probe.ts --census N      # the rank arm over N careers
//
// ⚠ WHY IT EXISTS. The owner finished a career holding $10M+ liquid, a $20M+ fund, houses, an
// academy and a brand, and the album told him «$13M won against $83M spent». The arithmetic cannot
// be right, and the two figures had to be ATTRIBUTED before anything was changed – the house rule
// is that a fix ships with a decomposition, not with a story.
//
// WHAT IT MEASURES, on one walked career that behaves like his (it BUYS – a house, the brand, the
// academy and the fund – which every existing bench in `tools/` refuses to do, so no measurement in
// this repository has ever contained an asset purchase):
//   * every cent that ever moved, GROSS IN and GROSS OUT, per `WorldEventCategory`, captured off
//     `world.events` as they are written – `financeWeeks` prunes at sixty weeks, so a horizon-end
//     scan would see almost none of a fifteen-season career;
//   * `careerTotals` beside that fold, so the two can be reconciled to the cent;
//   * what the album's slot 6 and the epilogue's «Won / Spent» actually print;
//   * what the family HOLDS at the end – wallet, her account, every asset at value and at cost;
//   * and, for item 10, her rank in all three tables EVERY WEEK, so the best rank she ever HELD can
//     be set beside the best SEASON CLOSE the epilogue reads. That weekly minimum is the fact NO
//     save retains, which is the whole reason item 10 needed a probe rather than a read.
//
// MEASUREMENT ONLY: every entry, purchase, tick and answer goes through the same public engine
// commands the UI uses. Zero MAIN draws are added – `resumeMain` + `stepCareerWeek` is the wedding
// bench's own walk, and `buyAsset` draws on nothing.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'
import { drainLifeBeatsTallied } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import {
  answerFork,
  answerRetirement,
  buyAsset,
  deliveredAssets,
  kidPoints,
  ownedAssets,
  pendingBirthday,
  shopCatalogue,
  shopItem,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { activeLadderOf, rankIn } from '../src/engine/world/ladder'
import { buildAlbum } from '../src/engine/world/album'
import { buildEndingView } from '../src/engine/world/endings'
import { formatCents } from '../src/shared/money'
import { LADDER_TRACKS } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'
import type { WorldEventCategory } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}

const WALK_WEEKS = argOf('weeks', 1_400)
const PRESET_IX = argOf('preset', 8)
const SEED_IX = argOf('index', 3)
const SHOP_ON = argOf('shop', 1) === 1
const CENSUS = argOf('census', 0)

/** The questions a walked career answers on its way past them – `tools/wedding-bench.ts`' own list,
 *  verbatim. ⚠ A career does NOT advance on `tickWeek` alone: it stalls at every pending decision. */
function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainLifeBeatsTallied(world)
    answerFork(world, 'continue')
  }
  drainLifeBeatsTallied(world)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

/** ⭐ THE EAGER BUYER – the arm that makes this career look like HIS. The rule is one a parent could
 *  say out loud: buy the next rung of the ladder the moment it is affordable with a large float left
 *  standing, and park everything above that float in the fund. */
const LADDER = ['house-first', 'merch-brand', 'academy-land', 'academy-courts', 'academy-building', 'academy-staff', 'house-garden', 'house-villa']
const FLOAT_CENTS = 2_000_000_00

function shopWeek(world: WorldState): void {
  if (world.ending) return
  const held = new Set(ownedAssets(world).map((a) => a.id))
  for (const id of LADDER) {
    if (held.has(id)) continue
    const item = shopItem(id)
    if (!item) continue
    if (world.fundsCents - item.entryCents < FLOAT_CENTS) break
    try {
      buyAsset(world, id)
    } catch {
      /* not on the shelf this week – the same refusal the screen would print */
    }
    return
  }
  if (world.fundsCents > FLOAT_CENTS + 1_000_000_00) {
    try {
      buyAsset(world, 'index-fund', 1_000_000_00)
    } catch {
      /* refused – nothing moved */
    }
  }
}

// =================================================================================================
// THE WALK
// =================================================================================================

interface Gross {
  in: number
  out: number
}

interface Walked {
  world: WorldState
  gross: Map<WorldEventCategory, Gross>
  bestHeld: Record<LadderTrack, number | null>
  bestHeldWeek: Record<LadderTrack, number | null>
}

function walk(presetIx: number, index: number, shop: boolean): Walked {
  const preset: Preset = PRESETS[presetIx]
  const policy: Policy = POLICIES[1]
  const { world } = openCareer(preset, index, policy)
  const rng = resumeMain(world.rngMain)

  const gross = new Map<WorldEventCategory, Gross>()
  const bump = (cat: WorldEventCategory, cents: number): void => {
    const row = gross.get(cat) ?? { in: 0, out: 0 }
    if (cents > 0) row.in += cents
    else row.out += -cents
    gross.set(cat, row)
  }
  let seenEventId = -1
  const bestHeld: Record<LadderTrack, number | null> = { domestic: null, itf: null, wta: null }
  const bestHeldWeek: Record<LadderTrack, number | null> = { domestic: null, itf: null, wta: null }

  for (let i = 0; i < WALK_WEEKS; i++) {
    if (shop) shopWeek(world)
    stepCareerWeek(world, rng, policy)
    if (world.ending === null) answerWhateverIsOpen(world)
    for (const e of world.events) {
      if (e.id <= seenEventId) continue
      seenEventId = e.id
      if (e.amountCents === undefined || e.amountCents === 0) continue
      bump(e.category ?? 'other', e.amountCents)
    }
    // ⚠ POST-TICK, EVERY WEEK – the weekly minimum per table. `rankIn` is asked only where she holds
    // a point in that table, the «unranked is not a number» rule every rank surface obeys.
    for (const track of LADDER_TRACKS) {
      if (kidPoints(world, track) <= 0) continue
      const r = rankIn(world, track)
      if (bestHeld[track] === null || r < bestHeld[track]!) {
        bestHeld[track] = r
        bestHeldWeek[track] = world.week
      }
    }
    if (world.ending !== null) break
  }
  return { world, gross, bestHeld, bestHeldWeek }
}

/** The best SEASON CLOSE on one table – what the save actually retains. `byTrack` is v46 and
 *  optional; the bare `endRank` is the ITF one, always (SeasonHistoryEntry's own note). */
function bestClose(world: WorldState, track: LadderTrack): number | null {
  let best: number | null = null
  for (const s of world.seasonHistory) {
    const r = track === 'itf' ? (s.byTrack?.itf?.endRank ?? s.endRank) : s.byTrack?.[track]?.endRank
    if (r === undefined || r === null) continue
    if (best === null || r < best) best = r
  }
  return best
}

/** The reader item 10 proposes: her table (`activeLadderOf` – the engine's own one answer), then the
 *  best of every close recorded on it AND the rank she is standing on right now (which is the only
 *  thing that can see a final, partial season the wrap never reached). */
function proposedBest(world: WorldState): { rank: number; track: LadderTrack } | null {
  const track = activeLadderOf(world)
  let best = bestClose(world, track)
  if (kidPoints(world, track) > 0) {
    const live = rankIn(world, track)
    if (best === null || live < best) best = live
  }
  return best === null ? null : { rank: best, track }
}

// =================================================================================================
// THE RANK CENSUS (item 10)
// =================================================================================================

if (CENSUS > 0) {
  console.log(`\n=== BEST-RANK CENSUS – ${CENSUS} careers, shop ${SHOP_ON ? 'on' : 'off'} ===`)
  console.log('  preset/seed        end   ladder   OLD(epilogue)   PROPOSED   TRUE HELD   miss(old)  miss(new)')
  const missOld: number[] = []
  const missNew: number[] = []
  for (let i = 0; i < CENSUS; i++) {
    const presetIx = PRESET_IX
    const { world, bestHeld } = walk(presetIx, SEED_IX + i, SHOP_ON)
    const view = buildEndingView(world)
    const old = view?.bestRank ?? null
    const proposed = proposedBest(world)
    const track = activeLadderOf(world)
    const held = bestHeld[track]
    const mOld = old !== null && held !== null ? old - held : null
    const mNew = proposed !== null && held !== null ? proposed.rank - held : null
    if (mOld !== null) missOld.push(mOld)
    if (mNew !== null) missNew.push(mNew)
    console.log(
      `  ${String(presetIx)}/${String(SEED_IX + i).padEnd(3)} ` +
        `${String(world.ending?.type ?? '–').padEnd(10)} w${String(world.week).padEnd(5)} ${track.padEnd(8)} ` +
        `#${String(old ?? '–').padEnd(6)} #${String(proposed?.rank ?? '–').padEnd(6)} #${String(held ?? '–').padEnd(6)} ` +
        `${mOld === null ? '–' : `+${mOld}`.padEnd(6)}  ${mNew === null ? '–' : `+${mNew}`}`,
    )
  }
  const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)
  console.log(`\n  mean miss – OLD ${(sum(missOld) / Math.max(1, missOld.length)).toFixed(1)} places · PROPOSED ${(sum(missNew) / Math.max(1, missNew.length)).toFixed(1)} places`)
  console.log(`  worst miss – OLD +${Math.max(...missOld, 0)} · PROPOSED +${Math.max(...missNew, 0)}\n`)
  process.exit(0)
}

// =================================================================================================
// THE ONE-CAREER READOUT (item 9)
// =================================================================================================

const { world, gross, bestHeld, bestHeldWeek } = walk(PRESET_IX, SEED_IX, SHOP_ON)
const t = world.careerTotals
const money = (c: number): string => formatCents(c).padStart(14)

console.log(`\n=== ALBUM MONEY PROBE – ${PRESETS[PRESET_IX].label} · seed ${world.seed} · shop ${SHOP_ON ? 'on' : 'off'} ===`)
console.log(`walked to week ${world.week}, ending ${world.ending?.type ?? 'none'}${world.ending ? ` at ${world.ending.ageYears}` : ''}\n`)

console.log('── WHAT THE ALBUM AND THE EPILOGUE PRINT ──')
console.log(`  careerTotals.prizeCents  (album «won», epilogue «Won»)    ${money(t.prizeCents)}`)
console.log(`  careerTotals.spentCents  (album «spent», epilogue «Spent»)${money(t.spentCents)}`)
console.log(`  careerTotals.earnedCents (persisted, read by NOTHING)     ${money(t.earnedCents)}`)
const slot6 = buildAlbum(world)[5]
console.log(`  slot 6 fact: ${slot6.fact ?? '(none)'}\n`)

console.log('── EVERY CENT THAT EVER MOVED, GROSS, BY CATEGORY ──')
const cats = [...gross.keys()].sort((a, b) => gross.get(b)!.in + gross.get(b)!.out - (gross.get(a)!.in + gross.get(a)!.out))
let inAll = 0
let outAll = 0
for (const cat of cats) {
  const row = gross.get(cat)!
  inAll += row.in
  outAll += row.out
  console.log(`  ${cat.padEnd(10)} in ${money(row.in)}   out ${money(row.out)}   net ${money(row.in - row.out)}`)
}
console.log(`  ${'TOTAL'.padEnd(10)} in ${money(inAll)}   out ${money(outAll)}   net ${money(inAll - outAll)}`)
console.log(`  reconcile: earnedCents ${t.earnedCents === inAll ? '==' : '!='} Σin · spentCents ${t.spentCents === outAll ? '==' : '!='} Σout\n`)

console.log('── WHAT THE FAMILY HOLDS AT THE END ──')
console.log(`  family wallet                         ${money(world.fundsCents)}`)
console.log(`  her own account (kidFundsCents)       ${money(world.kidFundsCents ?? 0)}`)
let assetValue = 0
let assetPaid = 0
for (const a of ownedAssets(world)) {
  assetValue += a.valueCents
  assetPaid += a.paidCents
  console.log(`    ${a.id.padEnd(18)} value ${money(a.valueCents)}  paid ${money(a.paidCents)}`)
}
console.log(`  assets at value                       ${money(assetValue)}`)
console.log(`  assets at cost                        ${money(assetPaid)}`)
console.log(`  delivered assets                      ${deliveredAssets(world).length} of ${shopCatalogue().length} rungs`)
console.log(`  HOUSEHOLD WORTH                       ${money(world.fundsCents + (world.kidFundsCents ?? 0) + assetValue)}\n`)

console.log('── THE PROPOSED TAXONOMY ──')
const outlay = Math.max(0, t.spentCents - assetPaid)
console.log(`  SPENT for good  (spentCents − Σ paidCents) ${money(outlay)}`)
console.log(`  HELD            (Σ paidCents at cost)      ${money(assetPaid)}`)
console.log(`  CAME IN         (earnedCents + her account)${money(t.earnedCents + (world.kidFundsCents ?? 0))}`)
const lhs = t.earnedCents + (world.kidFundsCents ?? 0) - outlay
const rhs = world.fundsCents - 120_000_00 + assetPaid + (world.kidFundsCents ?? 0)
console.log(`  identity: cameIn − spent = ${money(lhs)}  vs  walletGrowth + held + hers = ${money(rhs)}  ${lhs === rhs ? 'OK' : 'MISMATCH'}\n`)

console.log('── ITEM 10: BEST RANK ──')
const view = buildEndingView(world)
console.log(`  epilogue bestRank (min over seasonHistory[].endRank, ITF) #${view?.bestRank ?? '–'}`)
console.log(`  activeLadderOf = ${activeLadderOf(world)}`)
for (const track of LADDER_TRACKS) {
  console.log(
    `  ${track.padEnd(9)} best HELD #${String(bestHeld[track] ?? '–').padEnd(5)} (w${bestHeldWeek[track] ?? '–'})   best SEASON CLOSE #${bestClose(world, track) ?? '–'}   live #${kidPoints(world, track) > 0 ? rankIn(world, track) : '–'}`,
  )
}
console.log(`  PROPOSED reader: #${proposedBest(world)?.rank ?? '–'} on ${proposedBest(world)?.track ?? '–'}`)
console.log(`  seasonHistory rows: ${world.seasonHistory.length}, last seasonIndex ${world.seasonHistory[world.seasonHistory.length - 1]?.seasonIndex ?? '–'}`)
console.log(`  ending week ${world.ending?.week ?? '–'} is week ${(world.ending?.week ?? world.week) % 52} of season ${Math.floor((world.ending?.week ?? world.week) / 52)}`)
console.log('')
