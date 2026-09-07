/**
 * r38-decline-read – item 7b's probe: what the coach's read SAYS about a career past its peak.
 *
 * ⚠ READ-ONLY LAW (tools/r38-save-read.ts' own standing): the save is personal, handed in on the
 * command line, read through the game's own import door (`decodeExportFile`) and NEVER copied or
 * committed. What the repo keeps is the derived statistics printed here.
 *
 * It prints the rendered sentence, the quantity behind it and every ingredient of the decline read,
 * so the before/after of the fix is one command and not an argument.
 *
 * Run: npx vite-node tools/r38-decline-read.ts -- --save /path/career.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ageCurveOf, physicalMean, ageAtPhysicalShare, SKILL_KEYS } from '../src/engine/development'
import { startingSkills } from '../src/engine/world/player'
import { kidAgeExact } from '../src/engine/world/age'
import { coachRoomNote, coachRoomBandOf } from '../src/engine/world/coachMarket'
import { ENDINGS } from '../src/engine/ending'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
let savePath = ''
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePath = args[++i]!
if (!savePath) {
  console.error('usage: npx vite-node tools/r38-decline-read.ts -- --save /path/career.tsave')
  process.exit(1)
}

const f2 = (n: number) => n.toFixed(2)

async function main() {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const w = world.week
  const age = kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay)
  const bounds = ageCurveOf(world.ageCurve, world.careerTotals?.weeksLostToInjury ?? 0)
  const born = startingSkills(world.seed, world.profile)
  let gained = 0
  let room = 0
  for (const k of SKILL_KEYS) {
    gained += world.skills[k] - born[k]
    room += world.potential[k] - born[k]
  }
  const pm = physicalMean(world.skills)
  const peak = world.peakPhysical ?? pm
  const share = pm / (peak || 1)

  console.log('='.repeat(96))
  console.log(`ITEM 7b PROBE – ${world.profile.kidName} ${world.profile.kidLastName}, week ${w}, schema v${world.schemaVersion}`)
  console.log('='.repeat(96))
  console.log(`age ${f2(age)} · declineStart ${f2(bounds.declineStart)} · past peak by ${f2(age - bounds.declineStart)} years`)
  console.log(`gained ${f2(gained)} of room ${f2(room)} = ${f2((gained / room) * 100)}% raw`)
  console.log(`physicalMean ${f2(pm)} · peakPhysical ${f2(peak)} · share ${f2(share * 100)}%`)
  console.log(`lastOfferPeakShare ${ENDINGS.lastOfferPeakShare} · age at that share ${f2(ageAtPhysicalShare(ENDINGS.lastOfferPeakShare, bounds))}`)
  console.log(`coachRoomBandOf = ${coachRoomBandOf(world)}`)
  console.log()
  console.log('THE RENDERED SENTENCE:')
  console.log(`  >>> ${coachRoomNote(world)}`)
  console.log()

  const hist = world.seasonHistory ?? []
  console.log(`seasonHistory rows ${hist.length} – wta endRank by season:`)
  const ranks: { seasonIndex: number; rank: number }[] = []
  for (const h of hist) {
    const r = h.byTrack?.wta?.endRank
    if (typeof r === 'number') ranks.push({ seasonIndex: h.seasonIndex, rank: r })
  }
  console.log('  ' + ranks.map((r) => `s${r.seasonIndex}:#${r.rank}`).join(' '))
  if (ranks.length >= 2) {
    const last = ranks[ranks.length - 1]!
    const prev = ranks[ranks.length - 2]!
    const best = ranks.reduce((a, b) => (b.rank < a.rank ? b : a))
    console.log(`  last season #${last.rank} (s${last.seasonIndex}) · the one before #${prev.rank} · move ${last.rank - prev.rank}`)
    console.log(`  career best #${best.rank} (s${best.seasonIndex}) · below it by ${last.rank - best.rank}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
