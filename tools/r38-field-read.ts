/**
 * r38-field-read – WHAT THE GAME ITSELF THINKS HER CHANCES ARE, rung by rung.
 *
 * Round 38. The owner, 07.09, refusing a closed-form number I quoted at him: «будучи в топ-100 и
 * топ-50 она сливала матчи в w50, w75 причем хорошо сливала, стабильно. Так что этот аргумент пока
 * для меня выглядит не очень.»
 *
 * ⚠ HE IS RIGHT TO REFUSE IT. `tools/r38-decline-cliff.ts` §2 compared her against the player sitting
 * at a RANK in the merged table, which is not who a w50 draw contains. This file asks the game
 * instead: `toSnapshot` builds every upcoming card through the shipped previewer, so
 * `firstMatchChance` is the number the CARD shows her and the bracket will honour.
 *
 * ⚠ MEASUREMENT ONLY. Read-only on a personal save, through the game's own import door.
 *
 * Run: npx vite-node tools/r38-field-read.ts -- --save /path/career.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { toSnapshot } from '../src/engine/world/snapshot'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
let savePath = ''
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePath = args[++i]!
if (!savePath) {
  console.error('usage: npx vite-node tools/r38-field-read.ts -- --save /path/career.tsave')
  process.exit(1)
}

const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

async function main() {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const snap = toSnapshot(world)
  console.log(`week ${world.week} · her WTA rank ${world.kidRankWta} · ITF ${world.kidRank} · condition ${world.condition.toFixed(1)}`)
  console.log()
  console.log(pad('week', 7) + pad('tier', 10) + padL('eligible', 10) + padL('outgrown', 10) + padL('vs the FIELD', 14) + padL('read as', 12) + padL('1st round', 11) + padL('opp rank', 10))
  const rows = (snap as unknown as { upcoming: Record<string, unknown>[] }).upcoming ?? []
  for (const raw of rows) {
    const e = raw as {
      week: number
      tier: string
      eligible?: boolean
      outgrown?: boolean
      preview?: {
        firstMatchChance: number | null
        fieldChance?: number | null
        fieldStrength?: string
        opponentRank: number | null
      }
    }
    const p = e.preview
    console.log(
      pad(e.week, 7) + pad(e.tier, 10) +
      padL(String(e.eligible ?? '-'), 10) + padL(String(e.outgrown ?? '-'), 10) +
      padL(p?.fieldChance != null ? (p.fieldChance * 100).toFixed(1) + '%' : '-', 14) +
      padL(p?.fieldStrength ?? '-', 12) +
      padL(p?.firstMatchChance != null ? (p.firstMatchChance * 100).toFixed(1) + '%' : '-', 11) +
      padL(String(p?.opponentRank ?? '-'), 10),
    )
  }
  console.log()
  const one = rows.find((r) => (r as { tier?: string }).tier === 'w15')
  const two = rows.find((r) => (r as { tier?: string }).tier === 'wta500')
  console.log('FULL PREVIEW, w15:', JSON.stringify((one as { preview?: unknown })?.preview))
  console.log('FULL PREVIEW, wta500:', JSON.stringify((two as { preview?: unknown })?.preview))
  console.log('FULL ROW KEYS:', JSON.stringify(Object.keys(one ?? {})))
  console.log()
  console.log('⚠ `1st-round chance` is the card\'s own number, through the shipped previewer – not a')
  console.log('  closed form against whoever happens to sit at a rank in the merged table.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
