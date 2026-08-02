/**
 * FEED AUDIT – "what does the Season feed actually offer her this week, and why?" (owner, 03.08:
 * «обрати внимание какие турниры доступны в ленте с текущим рейтингом, там очень много мусора»)
 *
 * The feed is three rules stacked – the engine's entry gate, the two-type pair, and the empty-week
 * substitution – and a card the player calls junk can come from any of them. Reading the screen
 * cannot tell them apart; this prints the verdict AND the reason for every event in the horizon,
 * off the same functions the screen calls (`entryStatus`, `feedContext`, `feedShows`), so what it
 * says is what the player sees.
 *
 * Sections:
 *   1. WHERE SHE STANDS – the three ranks, the tierOpen oracle's verdict per rung, her age.
 *   2. THE PAIR – which rungs the two-type rule chose, and which open rungs it left out.
 *   3. THE HORIZON – every event in `upcoming`, whether the feed shows it, through which rule, and
 *      what the entry gate says about it. This is the junk list, itemised.
 *   4. THE SEASON'S SUPPLY – the planner's counter, for scale.
 *
 * Reads an exported .tsave through the real import codec; nothing about the file enters the repo.
 *
 * Run:  npx vite-node tools/feed-audit.ts -- --save ~/Downloads/<career>.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import {
  KID_ID,
  entryStatus,
  kidAgeYears,
  kidPoints,
  refreshDerivedRankCaches,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { feedContext, feedShows, type FeedEventFacts } from '../src/composables/tierState'
import { TIERS, TIER_LADDER, TIER_SHORT } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const i = process.argv.indexOf('--save')
if (i === -1 || !process.argv[i + 1]) {
  console.error('usage: npx vite-node tools/feed-audit.ts -- --save <path.tsave>')
  process.exit(1)
}
const world: WorldState = await decodeExportFile(new Uint8Array(readFileSync(process.argv[i + 1])))
refreshDerivedRankCaches(world)
const snap = toSnapshot(world)
const age = kidAgeYears(world.week, world.profile.birthMonth)

// 1. WHERE SHE STANDS -----------------------------------------------------------------------------
console.log(`week ${world.week}, age ${age} – domestic #${world.kidRankDomestic}, itf #${world.kidRank}, wta #${world.kidRankWta}`)
console.log(`points: domestic ${kidPoints(world, 'domestic')}, itf ${kidPoints(world, 'itf')}, wta ${kidPoints(world, 'wta')}`)
const open = snap.tierOpen ?? {}
console.log('\n1. the engine opens: ' + TIER_LADDER.map((t) => `${TIER_SHORT[t]}${open[t] ? '✓' : '·'}`).join(' '))

// 2. THE PAIR -------------------------------------------------------------------------------------
const facts: FeedEventFacts[] = snap.upcoming.map((e) => ({
  id: e.id,
  week: e.week,
  tier: e.tier,
  entered: e.entered,
  eligible: e.eligible,
  ineligibleReason: e.ineligibleReason,
}))
const ctx = feedContext({ ageYears: age, tierOpen: open, upcoming: facts })
console.log(`\n2. the pair: ${ctx.pair.map((t) => TIER_SHORT[t]).join(' + ')}`)
const openNotInPair = TIER_LADDER.filter((t) => open[t] && !ctx.pair.includes(t))
console.log(`   open but outside the pair: ${openNotInPair.map((t) => TIER_SHORT[t]).join(', ') || '(none)'}`)
console.log(`   substituted events this horizon: ${ctx.substitutes.size}`)

// 3. THE HORIZON ----------------------------------------------------------------------------------
console.log(`\n3. the horizon (${facts.length} events over the snapshot window):`)
let shown = 0
for (const f of facts) {
  const gate = entryStatus(world, world.season.find((e) => e.id === f.id)!)
  const via = f.entered ? 'ENTERED' : ctx.pair.includes(f.tier) ? 'pair' : ctx.substitutes.has(f.id) ? 'SUBSTITUTE' : '—'
  const visible = feedShows(f, ctx)
  if (visible) shown++
  const points = TIERS[f.tier].points
  console.log(
    `   w${f.week}  ${TIER_SHORT[f.tier].padEnd(8)} ${visible ? 'SHOWN' : 'hidden'} via ${via.padEnd(10)}` +
      ` gate=${gate.level}${gate.reason ? '/' + gate.reason : ''}  title=${points[0]} pts`,
  )
}
console.log(`   -> ${shown} of ${facts.length} cards render`)

// 4. THE SEASON'S SUPPLY --------------------------------------------------------------------------
const supply = snap.seasonSupply
console.log(`\n4. supply: ${supply.rows.reduce((n, r) => n + r.open, 0)} entries left over ${supply.weeksLeft} weeks`)
console.log('   ' + supply.rows.map((r) => `${TIER_SHORT[r.tier as TierId]} ${r.open}`).join(' · '))
console.log(`\n(kid id ${KID_ID}; nothing of the file enters the repo)`)
