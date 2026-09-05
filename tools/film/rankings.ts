// THREE RANKINGS, ONE CAREER - a real National title, then a real Junior Tour semifinal, so the two
// tables can be seen not talking to each other.
//
// ⚠ NOTHING ABOUT THE RESULTS IS WRITTEN HERE. Both tournaments are entered with `enterEvent`,
// played by `tickWeek`, resolved by `revealTournamentRound`/`closeTournament`, and every rank, point
// total, counting result and W-L on screen is whatever `recomputeKidRank` + `toSnapshot` produced.
//
// ⚠ WHAT IS PREPARED, and only what the brief allows: identity, age (via the starting week), skills,
// condition, funds, the seed, and a valid National history whose point values are read out of
// `TIERS[...].points` rather than invented - regional winner 80, regional runner-up 48, local winner
// 30, which is the 158 the brief specifies.
import { createWorld, tickWeek, revealTournamentRound, closeTournament, ensureSeason } from '../../src/engine/world'
import { enterEvent } from '../../src/engine/world/entries'
import { recomputeKidRank } from '../../src/engine/world/ladder'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { resumeMain } from '../../src/engine/rng'
import { TIERS } from '../../src/engine/season/calendar'
import { KID_ID } from '../../src/engine/world/constants'
import { SKILL_KEYS } from '../../src/engine/development'
import { DEFAULT_PROFILE, type TierId } from '../../src/shared/protocol'

/** ⚠ SNAPSHOTS MUST BE DETACHED, NOT JUST TAKEN. A stage captured before the Junior Tour showed
 *  "International W-L 3-1" - which is precisely the J30 record (three wins, the semifinal loss) -
 *  because parts of a snapshot still reference live world structures and go on changing underneath a
 *  capture held for later. Cloning at capture time freezes each stage as the moment it represents. */
const snapshot = (w: any) => structuredClone(toSnapshot(w)) as any

export const PROFILE = { ...DEFAULT_PROFILE, kidName: 'Alice', kidLastName: 'Martin', background: 'middle' as const }
/** ⚠ AGE IS READ OFF HER BIRTH DATE, NOT THE SEASON INDEX. Week 160 satisfies 14 + floor(160/52) = 17
 *  but her birthday is 15 June, so at season week 4 (late January) the standings still printed
 *  "16" - the one-clock ruling asks `kidAgeYears(week, birthMonth)`. Week 186 is season week 30,
 *  comfortably past June, so every surface agrees she is seventeen. */
export const START_WEEK = 186
export const START_CONDITION = 92
export const START_FUNDS = 40_000_00
/** Per-wing offsets so she is a shape rather than a flat block. Skills are a permitted setup value. */
const TILT: Record<string, number> = { serve: 2.5, ret: 1.5, composure: -1.5, stamina: 0.5, groundstrokes: 2 }

export function setup(seed: string, base = 68) {
  const w = createWorld(seed, PROFILE) as any
  w.week = START_WEEK
  w.condition = START_CONDITION
  w.fundsCents = START_FUNDS
  for (const k of SKILL_KEYS) {
    w.skills[k] = base + (TILT[k] ?? 0)
    if (w.potential) w.potential[k] = Math.max(w.potential[k], w.skills[k] + 6)
  }
  // ⚠ THE CALENDAR MUST BE WALKED FORWARD, NOT JUMPED. `ensureSeason` decides what is already
  // covered from the CURRENT week, so setting week 160 and calling it once made it believe chunk 3
  // existed, generate nothing, and then filter every past event away - an empty season with no
  // enterable National Series anywhere. Stepping the horizon the way time would gives the engine's
  // own generator the same sequence of calls a played career makes.
  for (let wk = 0; wk <= START_WEEK; wk += 20) {
    w.week = wk
    ensureSeason(w)
  }
  w.week = START_WEEK
  ensureSeason(w)
  // A valid National book: real finishes at their real point values (regional [80,48,...], local [30,...]).
  const reg = TIERS.regional.points
  const loc = TIERS.local.points
  w.results.push({ playerId: KID_ID, week: START_WEEK - 26, points: reg[0], tier: 'regional' })
  w.results.push({ playerId: KID_ID, week: START_WEEK - 14, points: reg[1], tier: 'regional' })
  w.results.push({ playerId: KID_ID, week: START_WEEK - 6, points: loc[0], tier: 'local' })
  recomputeKidRank(w)
  return w
}

function nextEvent(w: any, tier: TierId) {
  const open = w.season.filter((e: any) => e.tier === tier && e.week > w.week && w.week <= e.deadlineWeek)
  const inSeason = open.filter((e: any) => {
    const dw = ((e.deadlineWeek % 52) + 52) % 52
    return dw >= 1 && dw <= 46
  })
  return inSeason[0] ?? open[0]
}

/** Enter one event and play it out. Returns the finish index the ENGINE recorded, never a set value. */
function playEvent(w: any, rng: any, ev: any) {
  enterEvent(w, ev.id)
  let g = 0
  while (w.week < ev.week && g++ < 60) tickWeek(w, rng)
  if (w.week !== ev.week || !w.pendingTournament) return null
  const before = snapshot(w)
  const seen: any[] = []
  for (let i = 0; i < 8; i++) {
    if (!w.pendingTournament || w.pendingTournament.finished) break
    const snap = snapshot(w)
    if (snap.pending?.kidMatch) seen.push({ round: snap.pending.roundLabel, snapshot: snap })
    revealTournamentRound(w)
  }
  const atEnd = snapshot(w)
  closeTournament(w)
  const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === ev.week)
  const pts = TIERS[ev.tier as TierId].points
  return {
    event: ev,
    points: row?.points ?? 0,
    finishIndex: pts.indexOf(row?.points ?? -1),
    rounds: seen.length,
    before,
    perRound: seen,
    atEnd,
    after: snapshot(w),
  }
}

/** The whole demonstration: win the National Series, then take a Junior Tour result. */
export function run(seed: string, base = 68) {
  const w = setup(seed, base)
  const rng = resumeMain(w.rngMain)
  const startSnap = snapshot(w)

  const natEv = nextEvent(w, 'national')
  if (!natEv) return { ok: false as const, why: 'no enterable National Series' }
  const nat = playEvent(w, rng, natEv)
  if (!nat) return { ok: false as const, why: 'National Series did not resolve' }
  const natChampion = nat.points === TIERS.national.points[0]
  const afterNational = snapshot(w)

  const j30Ev = nextEvent(w, 'j30')
  if (!j30Ev) return { ok: false as const, why: 'no enterable Junior Tour 30 after the title' }
  const j30 = playEvent(w, rng, j30Ev)
  if (!j30) return { ok: false as const, why: 'Junior Tour 30 did not resolve' }
  const j30Semi = j30.points === TIERS.j30.points[2] // index 2 is the semifinal
  const afterJ30 = snapshot(w)

  return { ok: true as const, seed, base, world: w, natChampion, j30Semi, nat, j30, startSnap, afterNational, afterJ30 }
}

/** Seed search: same engine path, no snapshots kept, so a sweep does not time the page out. */
export function quick(seed: string, base = 68) {
  try {
    const r = run(seed, base)
    if (!r.ok) return null
    return {
      seed,
      base,
      natPoints: r.nat.points,
      natChampion: r.natChampion,
      j30Points: r.j30.points,
      j30Semi: r.j30Semi,
      natWeek: r.nat.event.week,
      j30Week: r.j30.event.week,
    }
  } catch (e) {
    return null
  }
}

/** ⚠ SWEEP PATH: no snapshots at all. `run()` builds one per revealed round plus four more per
 *  tournament, which is fine for the film and far too slow for a forty-seed search. */
export function lite(seed: string, base = 62, j30Index = 0) {
  try {
    const w = setup(seed, base)
    const rng = resumeMain(w.rngMain)
    const play = (tier: TierId, idx = 0) => {
      const ev = nextEventLite(w, tier, idx)
      if (!ev) return null
      enterEvent(w, ev.id)
      let g = 0
      while (w.week < ev.week && g++ < 60) tickWeek(w, rng)
      if (w.week !== ev.week || !w.pendingTournament) return null
      for (let i = 0; i < 8 && w.pendingTournament && !w.pendingTournament.finished; i++) revealTournamentRound(w)
      closeTournament(w)
      const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === ev.week)
      return { points: row?.points ?? 0, week: ev.week }
    }
    const nat = play('national')
    if (!nat) return null
    const j30 = play('j30', j30Index)
    if (!j30) return null
    return { seed, base, j30Index, nat: nat.points, j30: j30.points, natWeek: nat.week, j30Week: j30.week }
  } catch (e) {
    return null
  }
}
/** ⚠ WHICH event, not just whether one exists. Choosing among the J30s on the calendar is a player
 *  decision the game already offers, and it widens the search without editing any state: at the skill
 *  level that wins a National Series she beats the FIRST J30 field outright in most seeds. */
function nextEventLite(w: any, tier: TierId, idx = 0) {
  const open = w.season.filter((e: any) => e.tier === tier && e.week > w.week && w.week <= e.deadlineWeek)
  const inSeason = open.filter((e: any) => {
    const dw = ((e.deadlineWeek % 52) + 52) % 52
    return dw >= 1 && dw <= 46
  })
  const list = inSeason.length ? inSeason : open
  return list[Math.min(idx, list.length - 1)]
}
