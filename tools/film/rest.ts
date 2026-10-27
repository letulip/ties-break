// WHEN REST BECOMES TRAINING - condition drained by real tournament runs, a real medical block, a
// real recovery booking, and a real return to competition.
//
// ⚠ EVERY CONSTANT HERE WAS READ OUT OF THE ENGINE, NOT ASSUMED:
//   medicalFloor 15 (condition < 15 -> 'withdraw'), medicalWarningCeiling 25 (so the warning band is
//   15-24), recoveryBase 8 with the 60/40 slider adding 2 (the economy comment says so in as many
//   words: "the rest week owes ~10 = base 8 + the 60/40 slider's 2"), matchStrengthKnee 70 with
//   floor 0.55, and the Sports recovery resort at conditionGain 40 / buffFactor 0.9 / buffWeeks 4.
//
// ⚠ NOTHING IS EDITED AFTER SETUP. The drain comes from `matchDrain(tier, score) + runFatigueExtra`
// inside the real tick, the block comes from `medicalClearance`, and the recovery comes from the
// booked week resolving. No condition value, clearance, result or scoreline is written here.
import { createWorld, tickWeek, revealTournamentRound, closeTournament, ensureSeason } from '../../src/engine/world'
import { enterEvent, cancelEntry } from '../../src/engine/world/entries'
import { bookVacation } from '../../src/engine/world/planner'
import { recomputeKidRank } from '../../src/engine/world/ladder'
import { medicalClearance } from '../../src/engine/world/medical'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { resumeMain } from '../../src/engine/rng'
import { conditionMatchFactor } from '../../src/engine/condition'
import { planFromWeek } from '../../src/engine/plan'
import { TIERS } from '../../src/engine/season/calendar'
import { vacationPriceCents } from '../../src/engine/economy'
import { KID_ID } from '../../src/engine/world/constants'
import { SKILL_KEYS } from '../../src/engine/development'
import { DEFAULT_PROFILE, type SessionKind, type TierId } from '../../src/shared/protocol'

export const PROFILE = { ...DEFAULT_PROFILE, kidName: 'Alice', kidLastName: 'Martin', background: 'middle' as const }
/** Age 17 and past her 15 June birthday, so every surface agrees (see the rankings rig). */
export const START_WEEK = 186
export const START_FUNDS = 60_000_00
/** The Light plan: four single sessions, which `planFromWeek` projects to 60/40. */
export const LIGHT_WEEK: SessionKind[][] = [['general'], [], ['general'], [], ['general'], [], ['general']]
const TILT: Record<string, number> = { serve: 2, ret: 1, composure: -1, stamina: 1, groundstrokes: 1.5 }

const snapshot = (w: any) => structuredClone(toSnapshot(w)) as any

export function setup(seed: string, base = 64) {
  const w = createWorld(seed, PROFILE) as any
  // The calendar has to be WALKED forward: ensureSeason decides what is covered from the current
  // week, so jumping straight to 186 leaves an empty season.
  for (let wk = 0; wk <= START_WEEK; wk += 20) {
    w.week = wk
    ensureSeason(w)
  }
  w.week = START_WEEK
  ensureSeason(w)
  w.condition = 100
  w.fundsCents = START_FUNDS
  for (const k of SKILL_KEYS) {
    w.skills[k] = base + (TILT[k] ?? 0)
    if (w.potential) w.potential[k] = Math.max(w.potential[k], w.skills[k] + 6)
  }
  // Enough domestic points to open Junior Tour 30 (its gate is 250), at real tier point values.
  const reg = TIERS.regional.points
  const nat = TIERS.national.points
  w.results.push({ playerId: KID_ID, week: START_WEEK - 30, points: nat[0], tier: 'national' })
  w.results.push({ playerId: KID_ID, week: START_WEEK - 16, points: reg[0], tier: 'regional' })
  recomputeKidRank(w)
  w.plan = planFromWeek(LIGHT_WEEK)
  return w
}

/** ⚠ SKIP WHAT IS ALREADY ENTERED. The drain block books a run of events up front, so the central
 *  Junior Tour 30 was frequently one of them and `enterEvent` threw "Already entered this event". */
function eventsFrom(w: any, tiers: TierId[]) {
  return w.season
    .filter((e: any) => tiers.includes(e.tier) && e.week > w.week && w.week <= e.deadlineWeek)
    .filter((e: any) => !w.entries.includes(e.id))
    .sort((a: any, b: any) => a.week - b.week)
}

/** Enter one event and play it out through the real path. */
function playEvent(w: any, rng: any, ev: any) {
  enterEvent(w, ev.id)
  let g = 0
  while (w.week < ev.week && g++ < 60) tickWeek(w, rng)
  if (w.week !== ev.week || !w.pendingTournament) return null
  const before = w.condition
  const rounds: any[] = []
  for (let i = 0; i < 8; i++) {
    if (!w.pendingTournament || w.pendingTournament.finished) break
    const s = snapshot(w)
    if (s.pending?.kidMatch) rounds.push({ round: s.pending.roundLabel, snapshot: s, match: s.pending.kidMatch })
    revealTournamentRound(w)
  }
  const atEnd = snapshot(w)
  closeTournament(w)
  const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === ev.week)
  return {
    tier: ev.tier as TierId,
    label: TIERS[ev.tier as TierId].label,
    week: ev.week,
    conditionBefore: before,
    conditionAfter: w.condition,
    drain: before - w.condition,
    points: row?.points ?? 0,
    rounds,
    atEnd,
    after: snapshot(w),
  }
}

/** Drain her with REAL tournament runs until she is in the doctor's warning band.
 *
 *  ⚠ THE ENTRIES GO IN UP FRONT, ONE PER WEEK. Entry closes two weeks before an event, so a loop
 *  that enters the next event only after finishing the last one can never book consecutive weeks -
 *  every run is followed by a recovery week worth +10, and the first attempt bottomed out at 75
 *  instead of reaching the warning band at all. Entering a block of events while they are all still
 *  open is what a parent racing a calendar actually does, and it is the only way the drain outruns
 *  the recovery. */
export function drainToWarning(w: any, rng: any, target = 20) {
  const played: any[] = []
  const wanted = w.season
    .filter((e: any) => ['local', 'regional', 'national', 'j30'].includes(e.tier))
    .filter((e: any) => e.week > w.week && w.week <= e.deadlineWeek)
    .sort((a: any, b: any) => a.week - b.week)
  const takenWeeks = new Set<number>()
  for (const ev of wanted) {
    if (takenWeeks.has(ev.week)) continue
    try {
      enterEvent(w, ev.id)
      takenWeeks.add(ev.week)
    } catch (e) {
      /* gate, funds or a clash - skip it */
    }
    if (takenWeeks.size >= 12) break
  }

  let guard = 0
  while (w.condition > target && guard++ < 40) {
    tickWeek(w, rng)
    if (!w.pendingTournament) continue
    const before = w.condition
    const rounds: any[] = []
    for (let i = 0; i < 8; i++) {
      if (!w.pendingTournament || w.pendingTournament.finished) break
      const s = snapshot(w)
      if (s.pending?.kidMatch) rounds.push({ round: s.pending.roundLabel, match: s.pending.kidMatch })
      revealTournamentRound(w)
    }
    const tier = (w.pendingTournament && w.season.find((e: any) => e.id === w.pendingTournament.eventId)?.tier) as TierId
    const atEnd = snapshot(w)
    closeTournament(w)
    const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === w.week)
    played.push({
      tier,
      label: tier ? TIERS[tier].label : '',
      week: w.week,
      conditionBefore: before,
      conditionAfter: w.condition,
      drain: before - w.condition,
      points: row?.points ?? 0,
      rounds,
      atEnd,
    })
  }
  return played
}

/** ⚠ THE CENTRAL TOURNAMENT MUST BE INSIDE THE BLOCK, NOT BOOKED AFTER IT. Entry closes two weeks
 *  out, so a J30 entered once she was already worn sat two recovery weeks away - she arrived at it
 *  on 49, not 20, and the whole premise evaporated. She has to WALK INTO it still tired, which is
 *  what the block does: the first J30 whose week arrives while the doctor is warning IS the central
 *  match, and every condition value is read at the moment its week opens.
 */
export function run(seed: string, base = 64) {
  const w = setup(seed, base)
  const rng = resumeMain(w.rngMain)

  const wanted = w.season
    .filter((e: any) => ['local', 'regional', 'national', 'j30'].includes(e.tier))
    .filter((e: any) => e.week > w.week && w.week <= e.deadlineWeek)
    .sort((a: any, b: any) => a.week - b.week)
  const taken = new Set<number>()
  for (const ev of wanted) {
    if (taken.has(ev.week)) continue
    try {
      enterEvent(w, ev.id)
      taken.add(ev.week)
    } catch (e) {
      /* gate, funds or a clash */
    }
    if (taken.size >= 14) break
  }

  const history: any[] = []
  let central: any = null
  let atWarning: any = null
  let guard = 0
  while (!central && guard++ < 40) {
    tickWeek(w, rng)
    if (!w.pendingTournament) continue
    const eventId = w.pendingTournament.eventId
    const ev = w.season.find((e: any) => e.id === eventId) ?? { tier: 'j30', week: w.week }
    const pre = w.condition
    const clearance = medicalClearance(pre)
    const isCentral = ev.tier === 'j30' && clearance === 'warn'
    if (isCentral) atWarning = snapshot(w)

    const rounds: any[] = []
    for (let i = 0; i < 8; i++) {
      if (!w.pendingTournament || w.pendingTournament.finished) break
      const s = snapshot(w)
      if (s.pending?.kidMatch) rounds.push({ round: s.pending.roundLabel, match: s.pending.kidMatch, snapshot: s })
      revealTournamentRound(w)
    }
    const atEnd = snapshot(w)
    closeTournament(w)
    const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === w.week)
    const rec = {
      tier: ev.tier as TierId,
      label: TIERS[ev.tier as TierId].label,
      week: w.week,
      conditionBefore: pre,
      conditionAfter: w.condition,
      drain: pre - w.condition,
      points: row?.points ?? 0,
      rounds,
      atEnd,
      after: snapshot(w),
    }
    if (isCentral) central = rec
    else history.push(rec)
  }
  if (!central) return { ok: false as const, why: 'never reached a J30 inside the warning band' }

  // --- the parent stops. Withdrawing the rest of the block is the real command for the real
  //     decision: sacrificing calendar time is the whole point of the film. -------------------------
  for (const id of [...w.entries]) {
    try {
      cancelEntry(w, id)
    } catch (e) {
      /* past its deadline - it stays, and the medical floor will refuse it anyway */
    }
  }
  const atBlocked = snapshot(w)
  const clearanceAtBlocked = medicalClearance(w.condition)

  // --- the recovery booking, through the real catalogue and the real price quote -------------------
  const bookWeek = w.week + 1
  const resortPriceCents = vacationPriceCents(w.seed, bookWeek, 'resort', w.profile.background)
  let booked = false
  try {
    bookVacation(w, bookWeek, 'resort')
    booked = true
  } catch (e) {
    return { ok: false as const, why: `could not book the resort: ${String(e).slice(0, 80)}` }
  }
  const atBooking = snapshot(w)
  const conditionAtBooking = w.condition

  // --- the booked week resolves, then one ordinary Light match-free week ---------------------------
  tickWeek(w, rng)
  const afterResort = w.condition
  const atAfterResort = snapshot(w)
  tickWeek(w, rng)
  const afterLightWeek = w.condition
  const atAfterLight = snapshot(w)

  // --- back on the calendar, with the locks gone --------------------------------------------------
  const returnEv = eventsFrom(w, ['j30', 'national', 'regional', 'local'])[0]
  let returned: any = null
  if (returnEv) {
    try {
      enterEvent(w, returnEv.id)
      let g = 0
      while (w.week < returnEv.week && g++ < 12) tickWeek(w, rng)
      if (w.pendingTournament) {
        const s = snapshot(w)
        returned = {
          label: TIERS[returnEv.tier as TierId].label,
          week: returnEv.week,
          condition: w.condition,
          snapshot: s,
          match: s.pending?.kidMatch ?? null,
        }
      }
    } catch (e) {
      /* reported as null */
    }
  }

  return {
    ok: true as const,
    seed,
    base,
    world: w,
    history,
    atWarning,
    central,
    conditionBeforeCentral: central.conditionBefore,
    conditionAfterCentral: central.conditionAfter,
    blocked: medicalClearance(central.conditionAfter) === 'withdraw',
    factorAtEntry: conditionMatchFactor(central.conditionBefore),
    atBlocked,
    clearanceAtBlocked,
    resortPriceCents,
    booked,
    atBooking,
    conditionAtBooking,
    afterResort,
    atAfterResort,
    afterLightWeek,
    atAfterLight,
    factorAfter: conditionMatchFactor(afterLightWeek),
    returned,
  }
}

/** Search only: no snapshots kept. */
export function lite(seed: string, base = 64) {
  try {
    const r = run(seed, base)
    if (!r.ok) return null
    return {
      seed,
      base,
      entry: r.conditionBeforeCentral,
      after: r.conditionAfterCentral,
      drain: r.central.drain,
      points: r.central.points,
      blocked: r.blocked,
      events: r.history.length,
      score: r.central.rounds[0]?.match?.score ?? '',
      afterResort: r.afterResort,
      afterLight: r.afterLightWeek,
      price: r.resortPriceCents,
      ret: r.returned?.label ?? null,
    }
  } catch (e) {
    return null
  }
}
