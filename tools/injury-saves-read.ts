/**
 * injury-saves-read – the owner's own careers as the injury-landscape calibration floor.
 *
 * ⚠ READ-ONLY LAW (same standing as tools/real-vs-bench.ts): the saves are personal, handed in on
 * the command line, read through the game's own import door (`decodeExportFile`) and NEVER copied
 * or committed. What the repo keeps is the DERIVED statistics printed here, recorded in
 * docs/specs/the-injury-landscape-2026-08.md – never the careers.
 *
 * WHAT IT READS, and the honesty caveats that go with each number:
 *   - `injuryHistory` is PRUNED to its last 20 rows by rollInjury, so `onsets` is a FLOOR whenever
 *     the list is full (flagged `20+`); an active layoff has no row yet and is counted separately.
 *   - `careerTotals.weeksLostToInjury` is MONOTONE (v40) – the one weeks-lost figure prune-proof.
 *   - matches come from `seasonHistory` (wins+losses per banked season), the same engine-written
 *     rows real-vs-bench compares on.
 *
 * Run: npx vite-node tools/injury-saves-read.ts -- --save /path/a.tsave [--save /path/b.tsave ...]
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const args = process.argv.slice(2)
const savePaths: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePaths.push(args[++i])
if (savePaths.length === 0) {
  console.error('usage: npx vite-node tools/injury-saves-read.ts -- --save /path/a.tsave [...]')
  process.exit(1)
}

const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

console.log(
  pad('save', 34) +
    padL('week', 6) +
    padL('seasons', 8) +
    padL('onsets', 8) +
    padL('mi/mo/ma/se', 13) +
    padL('wksLost', 8) +
    padL('matches', 8) +
    padL('inj/seas', 9) +
    padL('inj/100m', 9) +
    padL('plan', 7) +
    padL('physio', 7),
)

let totOnsets = 0
let totSeasons = 0
let totMatches = 0
let totWeeksLost = 0
for (const path of savePaths) {
  const world = await decodeExportFile(new Uint8Array(readFileSync(path)))
  const hist = world.injuryHistory ?? []
  const active = world.injury !== null ? 1 : 0
  const onsets = hist.length + active
  const pruned = hist.length >= 20
  const sev = { minor: 0, moderate: 0, major: 0, severe: 0 } as Record<string, number>
  for (const h of hist) sev[h.severity] = (sev[h.severity] ?? 0) + 1
  if (world.injury) sev[world.injury.severity] = (sev[world.injury.severity] ?? 0) + 1
  const weeksLost = world.careerTotals?.weeksLostToInjury ?? hist.reduce((a, h) => a + h.weeksOut, 0)
  const seasons = world.week / WEEKS_PER_YEAR
  const matches = (world.seasonHistory ?? []).reduce((a, r) => a + r.wins + r.losses, 0)
  totOnsets += onsets
  totSeasons += seasons
  totMatches += matches
  totWeeksLost += weeksLost
  console.log(
    pad(basename(path).replace('.tsave', ''), 34) +
      padL(world.week, 6) +
      padL(seasons.toFixed(1), 8) +
      padL(`${onsets}${pruned ? '+' : ''}`, 8) +
      padL(`${sev.minor}/${sev.moderate}/${sev.major}/${sev.severe}`, 13) +
      padL(weeksLost, 8) +
      padL(matches, 8) +
      padL((onsets / seasons).toFixed(2), 9) +
      padL(matches > 0 ? ((100 * onsets) / matches).toFixed(2) : '-', 9) +
      padL(`${world.plan.train}/${world.plan.rest}`, 7) +
      padL(world.physioActive ? 'on' : 'off', 7),
  )
}
console.log(
  '\nPOOLED: ' +
    `onsets/season ${(totOnsets / totSeasons).toFixed(2)} · ` +
    `inj per 100 matches ${totMatches > 0 ? ((100 * totOnsets) / totMatches).toFixed(2) : '-'} · ` +
    `weeks lost/season ${(totWeeksLost / totSeasons).toFixed(2)} ` +
    `(over ${savePaths.length} careers, ${totSeasons.toFixed(1)} seasons, ${totMatches} matches)`,
)
