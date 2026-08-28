/**
 * r29-item14-read – round 29 item 14. READ-ONLY reading of the owner's own save, to place his
 * season '45 against the two distributions already on the table (ours, from
 * `docs/specs/the-drought-2026-08.md`; reality, from `docs/research/title-drought-reality.md`).
 *
 * ⚠ MEASUREMENT ONLY. It decodes a save, folds what is already in it, and prints. It advances no
 * week, calls no command, patches no constant, and writes nothing anywhere. The save is PERSONAL:
 * it is read from wherever `--save` points and is never copied, never committed, never a fixture.
 *
 * Run:
 *   npx vite-node tools/r29-item14-read.ts -- --save ~/Downloads/x.tsave [--season 14]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { TIERS } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'
import { kidAgeExact } from '../src/engine/world/age'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { seasonYear } from '../src/shared/dates'
import { ANGER_STREAK_MIN, ANGER_STREAK_MAX, resultShowsOnHerFace } from '../src/shared/avatarEmotion'
import { rngFromSeed, pickInt } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argStr = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const savePath = (argStr('save') ?? '').replace(/^~/, process.env.HOME ?? '~')
const wantSeason = argStr('season') === null ? null : Number(argStr('season'))

function section(t: string): void {
  console.log(`\n${'='.repeat(94)}\n${t}\n${'='.repeat(94)}`)
}

/** finish index read back off the tier's own points table – the same inversion counting-window uses */
function finishOf(tier: TierId | undefined, points: number): number | null {
  if (!tier) return null
  const i = TIERS[tier].points.indexOf(points)
  return i < 0 ? null : i
}
function roundsOf(tier: TierId): number {
  return TIERS[tier].points.length - 1
}

async function main(): Promise<void> {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const seasonNow = seasonIndexOf(world.week)
  const target = wantSeason ?? seasonNow - 1

  section(`SAVE: week ${world.week} · season index ${seasonNow} (${seasonYear(seasonNow)}) · schema v${world.schemaVersion}`)
  console.log(`kid: ${world.profile.kidName} ${world.profile.kidLastName}, age ${kidAgeExact(world).toFixed(2)}`)
  console.log(`rank ITF ${world.kidRank} · WTA ${world.kidRankWta ?? '-'} · domestic ${world.kidRankDomestic ?? '-'}`)
  console.log(`events in save: ${world.events.length} · results rows: ${world.results.length}`)
  console.log(`TARGET SEASON: index ${target} = year ${seasonYear(target)}, weeks ${target * 52}..${target * 52 + 51}`)

  // --- season history -------------------------------------------------------
  section('SEASON HISTORY (every banked season)')
  console.log('idx  year  endRank  points  W-L    bestFinish  fundsDelta')
  for (const s of world.seasonHistory) {
    const wta = s.byTrack?.wta
    console.log(
      `${String(s.seasonIndex).padStart(3)}  ${seasonYear(s.seasonIndex)}  ${String(s.endRank).padStart(7)}  ` +
        `${String(s.points).padStart(6)}  ${s.wins}-${s.losses}   ${String(s.bestFinish ?? '-').padStart(10)}  ` +
        `${(s.fundsDeltaCents / 100).toFixed(0).padStart(10)}` +
        (wta ? `   [wta rank ${wta.endRank ?? '-'} pts ${wta.points} ${wta.wins}-${wta.losses}]` : ''),
    )
  }

  // --- the title cabinet, by season ----------------------------------------
  section('TITLE CABINET – every title she has ever won, by season')
  const titlesBySeason = new Map<number, string[]>()
  for (const [tier, t] of Object.entries(world.trophiesByTier ?? {})) {
    for (const w of (t as { titles: number[] }).titles ?? []) {
      const si = seasonIndexOf(w)
      if (!titlesBySeason.has(si)) titlesBySeason.set(si, [])
      titlesBySeason.get(si)!.push(`${tier}@w${w}`)
    }
  }
  const seasonsPlayed = world.seasonHistory.map((s) => s.seasonIndex)
  for (const si of seasonsPlayed) {
    const list = titlesBySeason.get(si) ?? []
    console.log(`${seasonYear(si)} (idx ${si}): ${list.length === 0 ? 'NO TITLE' : `${list.length} – ${list.join(', ')}`}`)
  }

  // --- the target season's tournaments -------------------------------------
  section(`SEASON ${seasonYear(target)} – every tournament she entered (from world.results, 52w window)`)
  const lo = target * 52
  const hi = lo + 51
  const rows = world.results
    .filter((r) => r.playerId === KID_ID && r.week >= lo && r.week <= hi)
    .sort((a, b) => a.week - b.week)
  console.log(`rows in window: ${rows.length}  (⚠ world.results is pruned to the trailing 52 weeks; ` +
    `at week ${world.week} that covers w${world.week - 52}..w${world.week})`)
  console.log('week  tier      pts   finish            matchesWon')
  let firstRoundExits = 0
  const finishTally = new Map<string, number>()
  for (const r of rows) {
    const f = finishOf(r.tier as TierId | undefined, r.points)
    const rounds = r.tier ? roundsOf(r.tier as TierId) : 0
    const won = f === null ? null : rounds - f
    const label =
      f === null ? '?' : f === 0 ? 'CHAMPION' : f === 1 ? 'runner-up' : f === 2 ? 'semi-final' : f === 3 ? 'quarter' : `R${rounds - f + 1} exit (f=${f})`
    if (won === 0) firstRoundExits++
    finishTally.set(label.split(' ')[0], (finishTally.get(label.split(' ')[0]) ?? 0) + 1)
    console.log(
      `${String(r.week).padStart(4)}  ${String(r.tier ?? '-').padEnd(8)}  ${String(r.points).padStart(4)}  ${label.padEnd(17)} ${String(won ?? '-').padStart(3)}`,
    )
  }
  console.log(`\nENTRIES: ${rows.length} · FIRST-ROUND EXITS (0 matches won): ${firstRoundExits}`)

  // --- the anger crossings, reconstructed exactly --------------------------
  section('ANGER CROSSINGS – computeLossStreak replayed forward over world.events')
  // The engine's own walk is backwards from "now"; replayed forward it is the same rule:
  // a competitive (non-friendly) match she lost extends the run, one she won ends it, and the
  // threshold is drawn once per run from `seed:angry:<startWeek>`, ANGER_STREAK_MIN..MAX.
  const faceEvents = world.events
    .filter((e) => resultShowsOnHerFace(e))
    .sort((a, b) => a.id - b.id)
  console.log(`competitive match rows in the feed: ${faceEvents.length}` +
    ` (weeks w${faceEvents[0]?.week} .. w${faceEvents[faceEvents.length - 1]?.week})`)
  let losses = 0
  let startWeek = 0
  const crossings: { week: number; startWeek: number; angerAt: number }[] = []
  const runs: { startWeek: number; endWeek: number; len: number; angerAt: number }[] = []
  const closeRun = (endWeek: number): void => {
    if (losses > 0) {
      runs.push({
        startWeek,
        endWeek,
        len: losses,
        angerAt: pickInt(rngFromSeed(`${world.seed}:angry:${startWeek}`), ANGER_STREAK_MIN, ANGER_STREAK_MAX),
      })
    }
  }
  for (const e of faceEvents) {
    const m = e.match!
    const kidIn = m.aId === KID_ID || m.bId === KID_ID
    if (!kidIn) continue // defensive: the feed should only carry her own matches here
    if (m.winnerId === KID_ID) {
      closeRun(e.week)
      losses = 0
      startWeek = 0
      continue
    }
    if (losses === 0) startWeek = e.week
    losses++
    const angerAt = pickInt(rngFromSeed(`${world.seed}:angry:${startWeek}`), ANGER_STREAK_MIN, ANGER_STREAK_MAX)
    if (losses === angerAt) crossings.push({ week: e.week, startWeek, angerAt })
  }
  closeRun(faceEvents[faceEvents.length - 1]?.week ?? 0)

  console.log(`\nLOSING RUNS in the retained feed (${runs.length}):`)
  for (const r of runs) {
    const flag = r.len >= r.angerAt ? ' ← CROSSED' : ''
    console.log(`  w${r.startWeek}..w${r.endWeek} (${seasonYear(seasonIndexOf(r.startWeek))}) length ${r.len}, threshold ${r.angerAt}${flag}`)
  }
  console.log(`\nANGER CROSSINGS, all retained history (${crossings.length}):`)
  for (const c of crossings) {
    console.log(`  w${c.week} = ${seasonYear(seasonIndexOf(c.week))} – run started w${c.startWeek}, threshold ${c.angerAt}`)
  }
  const inTarget = crossings.filter((c) => seasonIndexOf(c.week) === target)
  console.log(`\nCROSSINGS IN ${seasonYear(target)}: ${inTarget.length}`)
  const bySeason = new Map<number, number>()
  for (const c of crossings) bySeason.set(seasonIndexOf(c.week), (bySeason.get(seasonIndexOf(c.week)) ?? 0) + 1)
  console.log('crossings by season (retained feed only – older seasons are pruned and read low):')
  for (const [si, n] of [...bySeason.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${seasonYear(si)}: ${n}`)
  }

  // --- best finish by tier --------------------------------------------------
  section('bestFinishByTier (career high-water mark)')
  console.log(JSON.stringify(world.bestFinishByTier))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
