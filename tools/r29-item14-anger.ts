/**
 * r29-item14-anger – round 29 item 14, the second half: the anger crossings on the owner's save,
 * replayed under BOTH readings of `computeLossStreak`, plus the feed's own audit.
 *
 * ⚠ READ-ONLY. Decodes a save, folds it, prints. Advances nothing, writes nothing.
 *
 *   npx vite-node tools/r29-item14-anger.ts -- --save ~/Downloads/x.tsave
 *
 * ⚠ REPAIRED IN ROUND 34 (QA-34), AND THE DEFECT WAS ORIGINAL RATHER THAN DRIFT. This file read
 * `event.kind` on three lines; `WorldEvent` carried no `kind` field on the day this file was written
 * (29.08, commit 9201e534) and carries none now – it names its discriminator `type` – so the reads
 * were `undefined` from the beginning and printed `undefined` into the evidence. It is NOT frozen:
 * the field it wanted exists under its real name, the repair is that rename and nothing else, and
 * the probe still answers its question against a save. Only `npm run check:tools` could see this,
 * and until round 34 nothing ran it.
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { KID_ID } from '../src/engine/world/constants'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { seasonYear } from '../src/shared/dates'
import { ANGER_STREAK_MIN, ANGER_STREAK_MAX, resultShowsOnHerFace } from '../src/shared/avatarEmotion'
import { rngFromSeed, pickInt } from '../src/engine/rng'

const args = process.argv.slice(2)
const argStr = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const savePath = (argStr('save') ?? '').replace(/^~/, process.env.HOME ?? '~')

function section(t: string): void {
  console.log(`\n${'='.repeat(94)}\n${t}\n${'='.repeat(94)}`)
}

async function main(): Promise<void> {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const face = world.events.filter((e) => resultShowsOnHerFace(e)).sort((a, b) => a.id - b.id)

  section('FEED AUDIT – what the anger walk actually sees')
  const notHers = face.filter((e) => e.match!.aId !== KID_ID && e.match!.bId !== KID_ID)
  console.log(`competitive (non-friendly) match rows in the feed: ${face.length}`)
  console.log(`...of which the kid is NOT a participant: ${notHers.length}`)
  if (notHers.length > 0) {
    for (const e of notHers.slice(0, 12)) {
      console.log(`   w${e.week} id=${e.id} type=${e.type} a=${e.match!.aId} b=${e.match!.bId} winner=${e.match!.winnerId} :: ${e.text?.slice(0, 70)}`)
    }
  }
  const friendlies = world.events.filter((e) => !!e.match && e.friendly).length
  console.log(`friendly match rows (excluded by the predicate): ${friendlies}`)
  const bySeason = new Map<number, number>()
  for (const e of face) bySeason.set(seasonIndexOf(e.week), (bySeason.get(seasonIndexOf(e.week)) ?? 0) + 1)
  console.log('\ncompetitive match rows per season, as retained:')
  for (const [si, n] of [...bySeason.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`   ${seasonYear(si)}: ${n}`)
  }

  // ---- the two readings ---------------------------------------------------
  const replay = (filterToHers: boolean): { crossings: { week: number; startWeek: number; angerAt: number; len: number }[] } => {
    let losses = 0
    let startWeek = 0
    const crossings: { week: number; startWeek: number; angerAt: number; len: number }[] = []
    for (const e of face) {
      const m = e.match!
      if (filterToHers && m.aId !== KID_ID && m.bId !== KID_ID) continue
      if (m.winnerId === KID_ID) {
        losses = 0
        startWeek = 0
        continue
      }
      if (losses === 0) startWeek = e.week
      losses++
      const angerAt = pickInt(rngFromSeed(`${world.seed}:angry:${startWeek}`), ANGER_STREAK_MIN, ANGER_STREAK_MAX)
      if (losses === angerAt) crossings.push({ week: e.week, startWeek, angerAt, len: losses })
    }
    return { crossings }
  }

  section('ANGER CROSSINGS – the ENGINE\'s reading (no participant filter, exactly computeLossStreak)')
  const engineRead = replay(false)
  for (const c of engineRead.crossings) {
    console.log(`  w${c.week} = ${seasonYear(seasonIndexOf(c.week))} (run from w${c.startWeek}, threshold ${c.angerAt})`)
  }
  console.log(`total ${engineRead.crossings.length}`)

  section('ANGER CROSSINGS – restricted to matches she actually played')
  const hersRead = replay(true)
  for (const c of hersRead.crossings) {
    console.log(`  w${c.week} = ${seasonYear(seasonIndexOf(c.week))} (run from w${c.startWeek}, threshold ${c.angerAt})`)
  }
  console.log(`total ${hersRead.crossings.length}`)
  console.log(
    `\nDO THE TWO READINGS AGREE? ${engineRead.crossings.length === hersRead.crossings.length ? 'YES' : 'NO'}`,
  )

  // ---- what the WEEK a crossing lands on looks like ------------------------
  section('THE 2045 CROSSING IN CONTEXT – every competitive match row of season 2045')
  const target = 14
  const rows = face.filter((e) => seasonIndexOf(e.week) === target)
  console.log(`rows: ${rows.length}`)
  let run = 0
  for (const e of rows) {
    const m = e.match!
    const won = m.winnerId === KID_ID
    run = won ? 0 : run + 1
    console.log(`  w${String(e.week).padStart(3)} ${won ? 'W' : 'L'}  run=${won ? 0 : run}  ${e.text?.slice(0, 72) ?? ''}`)
  }

  section('FEED: every NON-match row in 2045 (looking for a second anger surface)')
  const others = world.events.filter((e) => !e.match && seasonIndexOf(e.week) === target)
  // ⚠ `WorldEvent`'s discriminant is `type`, never `kind`. Written as `e.kind` this histogram had
  // exactly one bucket – `undefined` – for the whole of its life, because nothing typechecked it.
  const kinds = new Map<string, number>()
  for (const e of others) kinds.set(e.type, (kinds.get(e.type) ?? 0) + 1)
  console.log([...kinds.entries()].map(([k, n]) => `${k}:${n}`).join('  '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
