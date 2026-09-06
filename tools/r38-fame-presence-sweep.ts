/**
 * r38-fame-presence-sweep – WHAT A CAREER OF PRESENCE IS WORTH, AND WHAT IT SHOULD BE.
 *
 * Round 38 #2c. The owner, 06.09: «спортсменка проводит свой лучший сезон (и не один) находясь в
 * топ-100 и входя иногда в топ-50 даже, у нее явно есть и репутация и о ней знают, не могу забыть
 * за год.»
 *
 * ⚠ MEASUREMENT ONLY. Every arm patches `ECONOMY.fame.seasonEndBands` and
 * `ECONOMY.fame.seasonHalfLifeWeeks` in place and restores them in a `finally` – the same move
 * `tools/potential-band-sweep.ts` and `tools/skill-ceiling.ts` make on the live ECONOMY object.
 * `ECONOMY` is `as const`, i.e. deeply readonly to the COMPILER and an ordinary mutable object at
 * RUNTIME; a harness that sweeps a shipped constant has to say so once and out loud. No constant and
 * no engine behaviour is changed by this file.
 *
 * ⚠ THE OWNER'S SAVES ARE PERSONAL. `--dir` / `--save` read them through the game's own import door
 * (`decodeExportFile`) and NOTHING is committed from them – no fixture, no path, no career. Only the
 * aggregate figures quoted in docs/specs/fame-presence-2026-09.md leave.
 *
 * THE TWO ACCEPTANCE CRITERIA, and the second one is the constraint:
 *
 *   1. A LONG MID-TIER CAREER LIFTS. That is the item.
 *   2. THE TOP OF THE SHELF DOES NOT MOVE. `ECONOMY.fame.cap` clamps the floor, and a career at or
 *      near the cap must read the same fame, the same worth and the same weekly cheque after this
 *      as before it – the standing constraint every brand wave since round 32 #3 has carried.
 *
 * Run: npx vite-node tools/r38-fame-presence-sweep.ts -- --dir ~/Downloads
 */
import { readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { fameAt } from '../src/engine/world/fame'
import { brandSignalsOf, brandWeeklyGrossCents, brandMultipleX, brandGrossWorthCents } from '../src/engine/world/brand'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const paths: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--save' && args[i + 1]) paths.push(args[++i]!)
  if (args[i] === '--dir' && args[i + 1]) {
    const dir = args[++i]!.replace(/^~/, process.env.HOME ?? '~')
    for (const f of readdirSync(dir)) if (f.endsWith('.tsave')) paths.push(join(dir, f))
  }
}
if (!paths.length) {
  console.error('usage: npx vite-node tools/r38-fame-presence-sweep.ts -- --dir ~/Downloads')
  process.exit(1)
}
paths.sort()

type Band = { maxEndRank: number; add: number }
/** An arm is the whole set of dials this item can turn: the season ladder and its clock (the LEVEL
 *  half of his complaint), and the stock's tail – retention, its half-life and its floor share (the
 *  SLOPE half). `undefined` means "leave the shipped value alone", so an arm reads as a diff. */
type Arm = {
  label: string
  bands: Band[]
  halfLife: number
  retention?: number
  strengthHalfLife?: number
  floorShare?: number
}

const SHIPPED: Band[] = ECONOMY.fame.seasonEndBands.map((b) => ({ ...b }))
const withRung = (add: number): Band[] => [...SHIPPED.map((b) => ({ ...b })), { maxEndRank: 100, add }]

/** ⚠ THE PRE-WAVE ARM RESTORES ALL FIVE DIALS, and it has to be spelled out now that the wave has
 *  shipped: `SHIPPED` below reads the LIVE catalogue, so an arm that only patched the two season
 *  dials would silently carry the new retention, half-life and floor share and would not be a
 *  baseline at all. These are round 38 #2c's own «was» column. */
const PRE_WAVE: Arm = {
  label: 'PRE-WAVE (before r38 #2c)',
  bands: SHIPPED.filter((b) => b.maxEndRank <= 50),
  halfLife: 104,
  retention: 0.78,
  strengthHalfLife: 208,
  floorShare: 0.4,
}

const ARMS: Arm[] = [
  PRE_WAVE,
  { label: 'SHIPPED NOW (r38 #2c)', bands: SHIPPED, halfLife: ECONOMY.fame.seasonHalfLifeWeeks },
  { label: 'rung 100 @0.6, 104w', bands: withRung(0.6), halfLife: 104 },
  { label: 'shipped bands, 208w', bands: SHIPPED, halfLife: 208 },
  { label: 'rung 100 @0.6, 208w', bands: withRung(0.6), halfLife: 208 },
  { label: 'rung 100 @0.6, 312w', bands: withRung(0.6), halfLife: 312 },
  { label: 'rung 100 @0.6, 416w', bands: withRung(0.6), halfLife: 416 },
  { label: 'rung 100 @1.0, 312w', bands: withRung(1.0), halfLife: 312 },
  // --- THE SLOPE HALF. The level arms above lift where the brand SITS; these change how fast it
  // falls. Each carries the chosen season arm so the two halves are read together, never apart.
  { label: 'season+ floorShare .50', bands: withRung(0.6), halfLife: 312, floorShare: 0.5 },
  { label: 'season+ floorShare .55', bands: withRung(0.6), halfLife: 312, floorShare: 0.55 },
  { label: 'season+ floorShare .65', bands: withRung(0.6), halfLife: 312, floorShare: 0.65 },
  { label: 'season+ strHL 312', bands: withRung(0.6), halfLife: 312, strengthHalfLife: 312 },
  { label: 'season+ .55 + strHL 312', bands: withRung(0.6), halfLife: 312, floorShare: 0.55, strengthHalfLife: 312 },
  { label: 'season+ .55 + ret .85', bands: withRung(0.6), halfLife: 312, floorShare: 0.55, retention: 0.85 },
  { label: 'strHL 416 ALONE', bands: SHIPPED, halfLife: 104, strengthHalfLife: 416 },
  { label: 'strHL 624 ALONE', bands: SHIPPED, halfLife: 104, strengthHalfLife: 624 },
  { label: 'season+ strHL 416', bands: withRung(0.6), halfLife: 312, strengthHalfLife: 416 },
  { label: 'season+ strHL 624', bands: withRung(0.6), halfLife: 312, strengthHalfLife: 624 },
  { label: 'season+ strHL 416 ret .9', bands: withRung(0.6), halfLife: 312, strengthHalfLife: 416, retention: 0.9 },
  { label: 'season+ ret .90', bands: withRung(0.6), halfLife: 312, retention: 0.9 },
  { label: 'season+ ret .95', bands: withRung(0.6), halfLife: 312, retention: 0.95 },
  { label: 'season+ ret .95 strHL 312', bands: withRung(0.6), halfLife: 312, retention: 0.95, strengthHalfLife: 312 },
  { label: 'CANDIDATE .6/312/.95/312', bands: withRung(0.6), halfLife: 312, retention: 0.95, strengthHalfLife: 312, floorShare: 0.5 },
  { label: 'CANDIDATE fs .55', bands: withRung(0.6), halfLife: 312, retention: 0.95, strengthHalfLife: 312, floorShare: 0.55 },
  { label: 'CANDIDATE fs .60', bands: withRung(0.6), halfLife: 312, retention: 0.95, strengthHalfLife: 312, floorShare: 0.6 },
]

/** Patch the two constants, run, and put them back whatever happens. `seasonEndBands` is REPLACED
 *  rather than mutated elementwise – `fameFloorOf` reads `ECONOMY.fame.seasonEndBands` fresh on
 *  every call and captures no reference to the array, which is the property that makes this safe. */
function withArm<T>(arm: Arm, fn: () => T): T {
  const F = ECONOMY.fame as unknown as { seasonEndBands: Band[]; seasonHalfLifeWeeks: number }
  const S = ECONOMY.business.merch.strength as unknown as {
    retention: number
    halfLifeWeeks: number
    floorShare: number
  }
  const bands = F.seasonEndBands
  const hl = F.seasonHalfLifeWeeks
  const ret = S.retention
  const shl = S.halfLifeWeeks
  const fs = S.floorShare
  F.seasonEndBands = arm.bands
  F.seasonHalfLifeWeeks = arm.halfLife
  if (arm.retention !== undefined) S.retention = arm.retention
  if (arm.strengthHalfLife !== undefined) S.halfLifeWeeks = arm.strengthHalfLife
  if (arm.floorShare !== undefined) S.floorShare = arm.floorShare
  try {
    return fn()
  } finally {
    F.seasonEndBands = bands
    F.seasonHalfLifeWeeks = hl
    S.retention = ret
    S.halfLifeWeeks = shl
    S.floorShare = fs
  }
}

const money = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`
const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const f1 = (n: number) => n.toFixed(1)

interface Row {
  name: string
  week: number
  seasons: number
  top100: number
  top50: number
  top20: number
  bestRank: number | null
}

async function main() {
  const worlds: { row: Row; world: WorldState }[] = []
  for (const p of paths) {
    let world: WorldState
    try {
      world = (await decodeExportFile(new Uint8Array(readFileSync(p)))) as WorldState
    } catch {
      console.error(`  skipped (unreadable): ${basename(p)}`)
      continue
    }
    let seasons = 0, top100 = 0, top50 = 0, top20 = 0
    let bestRank: number | null = null
    for (const r of world.seasonHistory ?? []) {
      const er = r.byTrack?.wta?.endRank
      if (er == null) continue
      seasons++
      if (er <= 100) top100++
      if (er <= 50) top50++
      if (er <= 20) top20++
      if (bestRank === null || er < bestRank) bestRank = er
    }
    worlds.push({
      row: { name: basename(p).replace(/^tennis-sim_/, '').replace(/\.tsave$/, ''), week: world.week, seasons, top100, top50, top20, bestRank },
      world,
    })
  }

  console.log(`${worlds.length} careers read · fame cap ${ECONOMY.fame.cap} · title clock ${ECONOMY.fame.halfLifeWeeks}w`)
  console.log()

  const merch = (ECONOMY.shop.catalogue as unknown as { id: string; earningsMultipleX?: number }[]).find((i) => i.id === 'merch-brand')
  const baseX = merch?.earningsMultipleX ?? 14

  // Only careers with a professional history are informative here; a junior has no seasons to pay.
  const pro = worlds.filter((w) => w.row.seasons > 0)
  console.log(`${pro.length} of them have at least one professional season`)
  console.log()

  const tailTarget = pro.find((w) => w.row.name.startsWith('alice-cfbv_w1115'))
  if (tailTarget) {
    await projectTail(
      tailTarget.world,
      `${tailTarget.row.name} – ${tailTarget.row.seasons} pro seasons, ${tailTarget.row.top100} inside the top 100, best #${tailTarget.row.bestRank}`,
      ARMS,
      baseX,
    )
  }

  for (const arm of ARMS) {
    console.log('='.repeat(112))
    console.log(`ARM: ${arm.label}`)
    console.log('='.repeat(112))
    console.log(
      pad('career', 20) + padL('wk', 6) + padL('seas', 6) + padL('t100', 6) + padL('t50', 5) + padL('t20', 5) +
      padL('fame', 8) + padL('gross/wk', 11) + padL('worth', 14) + padL('worth -52w', 14) + padL('season %', 10),
    )
    let liftedWorth = 0
    let capNear = 0
    const pcts: number[] = []
    for (const { row, world } of pro) {
      const out = withArm(arm, () => {
        const sigNow = brandSignalsOf(world, world.week)
        const sigOld = brandSignalsOf(world, world.week - WEEKS_PER_YEAR)
        const worthNow = brandGrossWorthCents(sigNow, baseX)
        const worthOld = brandGrossWorthCents(sigOld, baseX)
        return {
          fame: fameAt(world, world.week),
          gross: brandWeeklyGrossCents(sigNow),
          worthNow,
          worthOld,
          mult: brandMultipleX(sigNow, baseX),
        }
      })
      const pct = out.worthOld > 0 ? ((out.worthNow - out.worthOld) / out.worthOld) * 100 : 0
      if (out.worthOld > 0) pcts.push(pct)
      if (out.fame >= ECONOMY.fame.cap - 0.001) capNear++
      liftedWorth += out.worthNow
      console.log(
        pad(row.name, 20) + padL(row.week, 6) + padL(row.seasons, 6) + padL(row.top100, 6) + padL(row.top50, 5) + padL(row.top20, 5) +
        padL(f1(out.fame), 8) + padL(money(out.gross), 11) + padL(money(out.worthNow), 14) + padL(money(out.worthOld), 14) +
        padL((pct >= 0 ? '+' : '') + pct.toFixed(1) + '%', 10),
      )
    }
    const sorted = [...pcts].sort((a, b) => a - b)
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0
    const mean = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1)
    const falling = sorted.filter((v) => v < 0)
    const meanFall = falling.reduce((a, b) => a + b, 0) / (falling.length || 1)
    console.log(`  total worth across the ${pro.length} careers: ${money(liftedWorth)} · at the fame cap: ${capNear}`)
    console.log(`  season change: median ${median.toFixed(1)}% · mean ${mean.toFixed(1)}% · of the ${falling.length} FALLING careers, mean ${meanFall.toFixed(1)}% · worst ${sorted[0]!.toFixed(1)}%`)
    console.log()
  }
}

/** ⭐ THE TAIL, PROJECTED – the same five-year table `docs/specs/brand-inertia-2026-08.md` §2 used to
 *  force round 32 #4, so the two are read on identical terms. Nothing is won from here on: this is
 *  what a career that STOPPED is worth as the years pass. */
async function projectTail(world: WorldState, label: string, arms: Arm[], baseX: number) {
  console.log('='.repeat(112))
  console.log(`TAIL PROJECTION – ${label}, nothing more won`)
  console.log('='.repeat(112))
  console.log(pad('arm', 28) + padL('now', 13) + padL('+1y', 13) + padL('+2y', 13) + padL('+3y', 13) + padL('+5y', 13) + padL('+5y/now', 10))
  for (const arm of arms) {
    const cells = withArm(arm, () =>
      [0, 1, 2, 3, 5].map((y) => {
        const sig = brandSignalsOf(world, world.week + y * WEEKS_PER_YEAR)
        return brandGrossWorthCents(sig, baseX)
      }),
    )
    const share = cells[0]! > 0 ? (cells[4]! / cells[0]!) * 100 : 0
    console.log(pad(arm.label, 28) + cells.map((c) => padL(money(c), 13)).join('') + padL(share.toFixed(1) + '%', 10))
  }
  console.log()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
