// THE 48 POSED CAREERS OF ROUND 45 #6 / #8 – every sheet of every book (335 at the time of writing), built once per file. The same careers
// `tests/round45-album-placement.test.ts` sweeps: the geometry arms of round 47 B3 are measured on the SAME sheets, so «335» means one thing.
import { assembleAlbum, createWorld, kidAgeAt, type WorldState } from '../../src/engine/world'
import { TIER_LADDER } from '../../src/engine/season/calendar'
import { pickInt, rngFromSeed } from '../../src/engine/rng'
import type { AlbumBook, AlbumSheetModel } from '../../src/shared/protocol'

function firstWeeks(world: WorldState): Map<number, number> {
  const out = new Map<number, number>()
  for (let w = 0; w < 1500; w++) {
    const age = kidAgeAt(world, w)
    if (!out.has(age)) out.set(age, w)
  }
  return out
}

export function posedCareer(i: number): WorldState {
  const seed = `r45-distinct-${i}`
  const world = createWorld(seed)
  const rng = rngFromSeed(`${seed}:posed`)
  const at = firstWeeks(world)
  const weekIn = (from: number, to: number): number => (at.get(pickInt(rng, from, to)) ?? 0) + pickInt(rng, 0, 45)
  let last = 0
  const note = (w: number): number => {
    last = Math.max(last, w)
    return w
  }
  const away = (w: number): void => {
    if (pickInt(rng, 0, 1) === 1) world.internationalEntryWeeks.push(w)
  }
  const titles = pickInt(rng, 5, 10)
  for (let n = 0; n < titles; n++) {
    const w = note(weekIn(13, 36))
    world.milestones.push({ type: 'title', week: w, tier: TIER_LADDER[pickInt(rng, 0, TIER_LADDER.length - 1)] })
    away(w)
  }
  const finals = pickInt(rng, 3, 6)
  for (let n = 0; n < finals; n++) {
    const w = note(weekIn(13, 36))
    world.milestones.push({ type: 'final', week: w, tier: TIER_LADDER[pickInt(rng, 0, TIER_LADDER.length - 1)] })
    away(w)
  }
  world.milestones.push({ type: 'prize', week: note(weekIn(15, 30)), tier: 'w15' })
  world.milestones.push({ type: 'international', week: note(weekIn(14, 20)), tier: 'j30' })
  world.milestones.push({ type: 'school', week: note(weekIn(17, 19)) })
  world.milestones.push({ type: 'injury', week: note(weekIn(14, 34)), kind: 'ankle soreness' })
  const closes = pickInt(rng, 8, 18)
  for (let n = 0; n < closes; n++) {
    world.milestones.push({ type: 'season-rank', week: note(weekIn(13, 36)), seasonIndex: n, rank: pickInt(rng, 1, 300) })
  }
  world.week = last + 1
  return world
}

export const SWEEP_CAREERS = 48
let books: AlbumBook[] | null = null
export function sweepBooks(): AlbumBook[] {
  books ??= Array.from({ length: SWEEP_CAREERS }, (_, i) => assembleAlbum(posedCareer(i)))
  return books
}
export function sweepSheets(): AlbumSheetModel[] {
  return sweepBooks().flatMap((b) => [...b.sheets])
}
