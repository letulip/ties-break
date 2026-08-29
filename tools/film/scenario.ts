// THE SCENARIO for "She won - and we still lost money", built entirely from real engine calls.
//
// ⚠ WHAT IS PREPARED, and it is only what the brief allows: her identity, her age (via the starting
// week), her condition, her starting funds, a real hired coach, and an eligibility history. J30 opens
// on 250 DOMESTIC points (calendar.ts: "the domestic ladder is the on-ramp"), so she is given genuine
// National results whose point values are read out of `TIERS.national.points` rather than invented.
//
// ⚠ EVERYTHING AFTER SETUP IS THE ENGINE'S: enterEvent charges the fee, the tick charges the travel,
// the tournament is resolved by revealTournamentRound/closeTournament, and the balance is whatever
// `world.fundsCents` says at the end. No ledger row is written here and no result is overwritten.
import { createWorld, tickWeek, revealTournamentRound, closeTournament, ensureSeason, flipScore, prizeCentsFor } from '../../src/engine/world'
import { enterEvent } from '../../src/engine/world/entries'
import { hireCoach, setCoachOnEventWeeks, coachMarket } from '../../src/engine/world/coachMarket'
import { recomputeKidRank } from '../../src/engine/world/ladder'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { resumeMain } from '../../src/engine/rng'
import { TIERS } from '../../src/engine/season/calendar'
import { KID_ID } from '../../src/engine/world/constants'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

export const PROFILE = { ...DEFAULT_PROFILE, kidName: 'Alice', kidLastName: 'Martin', background: 'middle' as const }
export const START_WEEK = 130 // age 16 (START_AGE 14 + floor(130/52))
export const START_CONDITION = 92
export const START_FUNDS = 60_000_00

export function setup(seed: string) {
  const w = createWorld(seed, PROFILE) as any
  w.week = START_WEEK
  w.condition = START_CONDITION
  w.fundsCents = START_FUNDS
  // ⚠ THE CALENDAR HAS TO CATCH UP WITH THE CLOCK. createWorld builds the season around week 0, so
  // moving her to week 130 left a calendar covering weeks 3-48 and no enterable J30 anywhere.
  // `ensureSeason` is the engine's own extender - same generator, same seed, same chunking.
  ensureSeason(w)
  // Eligibility: real National results, at the point values the National tier actually pays.
  const nat = TIERS.national.points
  w.results.push({ playerId: KID_ID, week: START_WEEK - 30, points: nat[0], tier: 'national' })
  w.results.push({ playerId: KID_ID, week: START_WEEK - 18, points: nat[0], tier: 'national' })
  w.results.push({ playerId: KID_ID, week: START_WEEK - 8, points: nat[1], tier: 'national' })
  recomputeKidRank(w)
  const rows = coachMarket(w)
  const coach = rows.find((r: any) => r.tier === 'middle') ?? rows[0]
  hireCoach(w, coach.id)
  setCoachOnEventWeeks(w, true)
  return { w, coach }
}

/** ⚠ NOT SIMPLY THE FIRST ONE. The first enterable J30 fell at week 156 - season week 0 - so the
 *  entry deadline landed at week 154, which is OFF-SEASON (weeks 49-51), and the Season Planner
 *  correctly showed "Off-season" with no calendar to point at. Prefer an event whose deadline sits
 *  in an ordinary competition week, so the screen the film opens on is the one the player would see. */
export function findJ30(w: any) {
  const enterable = w.season.filter((e: any) => e.tier === 'j30' && e.week > w.week && w.week <= e.deadlineWeek)
  const inSeason = enterable.filter((e: any) => {
    const dw = ((e.deadlineWeek % 52) + 52) % 52
    return dw >= 1 && dw <= 46
  })
  return inSeason[0] ?? enterable[0]
}

/** Enter, play, resolve - all through the real path, capturing a snapshot at every beat the film
 *  needs. Nothing here writes a ledger row, awards a point or sets a result.
 *
 *  ⚠ THE MEASUREMENT WINDOW STARTS AT THE ENTRY DEADLINE, NOT AT SETUP. Entering 26 weeks early and
 *  ticking to the event put half a season of parent income inside the window and the family came out
 *  +$3,366 AHEAD - a true number answering the wrong question. She plays forward to the deadline
 *  first, so the window holds the entry fee, the fare and about two weeks of ordinary household and
 *  coaching costs against two weeks of real income.
 */
export function run(seed: string) {
  const { w, coach } = setup(seed)
  const ev = findJ30(w)
  if (!ev) return { ok: false as const, why: 'no enterable J30 in her season' }

  const rng = resumeMain(w.rngMain)
  let guard = 0
  while (w.week < ev.deadlineWeek && guard++ < 80) tickWeek(w, rng)
  if (w.week > ev.deadlineWeek) return { ok: false as const, why: 'overshot the entry deadline' }

  const beforeEntry = toSnapshot(w)
  const fundsBefore = w.fundsCents
  const ledgerFrom = (w.events ?? []).length

  enterEvent(w, ev.id)
  const afterEntry = toSnapshot(w)

  guard = 0
  while (w.week < ev.week && guard++ < 10) tickWeek(w, rng)
  if (w.week !== ev.week) return { ok: false as const, why: `never reached the event week (${w.week})` }
  if (!w.pendingTournament) return { ok: false as const, why: 'no pending tournament on the event week' }

  const atDraw = toSnapshot(w) // round of 32 on deck - the splash, the bracket, "Prize money -"
  const rounds: any[] = []
  let atFinal: any = null
  for (let i = 0; i < 5; i++) {
    const snap = toSnapshot(w)
    const km = (snap as any).pending?.kidMatch
    if (km) {
      // ⚠ SCORES ARE STORED FROM SIDE A. TournamentFlow flips when the kid is B (`kidScore`), and a
      // report that skipped the flip would print the final as "2-6 4-6" - a loss - for a match she won.
      rounds.push({
        round: (snap as any).pending.roundLabel,
        opponent: km.oppName,
        score: km.bId === KID_ID ? flipScore(km.score) : km.score,
      })
    }
    if (i === 4) atFinal = { snapshot: snap, match: km }
    revealTournamentRound(w)
  }
  const atChampion = toSnapshot(w) // pending.finished - the finale / trophy
  closeTournament(w)
  const afterClose = toSnapshot(w)

  const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === ev.week)
  const ledger = (w.events ?? []).slice(ledgerFrom).filter((e: any) => typeof e.amountCents === 'number')
  const income = ledger.filter((e: any) => e.amountCents > 0).reduce((a: number, e: any) => a + e.amountCents, 0)
  const spend = ledger.filter((e: any) => e.amountCents < 0).reduce((a: number, e: any) => a + e.amountCents, 0)

  return {
    ok: true as const,
    seed,
    champion: !!row && row.points === TIERS.j30.points[0],
    points: row?.points ?? 0,
    event: { id: ev.id, week: ev.week, deadlineWeek: ev.deadlineWeek, label: TIERS[ev.tier].label, surface: ev.surface },
    entryFeeCents: TIERS[ev.tier].entryFeeCents,
    travelCents: ev.travelCostCents,
    prizeForChampionCents: prizeCentsFor('j30', 0),
    fundsBefore,
    fundsAfter: w.fundsCents,
    net: w.fundsCents - fundsBefore,
    incomeCents: income,
    spendCents: spend,
    matches: rounds.length,
    rounds,
    coach: { id: coach.id, name: coach.name, tier: coach.tier },
    ledger: ledger.map((e: any) => ({ week: e.week, text: e.text, amountCents: e.amountCents })),
    stages: { beforeEntry, afterEntry, atDraw, atFinal, atChampion, afterClose },
  }
}

/** Seed search only: the same engine path with NO snapshots built, because `run()` makes eleven of
 *  them per seed and a forty-seed sweep timed the page out. */
export function quick(seed: string) {
  const { w } = setup(seed)
  const ev = findJ30(w)
  if (!ev) return null
  const rng = resumeMain(w.rngMain)
  let g = 0
  while (w.week < ev.deadlineWeek && g++ < 80) tickWeek(w, rng)
  if (w.week > ev.deadlineWeek) return null
  const fundsBefore = w.fundsCents
  try { enterEvent(w, ev.id) } catch (e) { return null }
  g = 0
  while (w.week < ev.week && g++ < 10) tickWeek(w, rng)
  if (w.week !== ev.week || !w.pendingTournament) return null
  const scores: string[] = []
  for (let i = 0; i < 5; i++) {
    const km = (w.pendingTournament as any)?.result?.matches?.find(
      (mm: any) => (mm.aId === KID_ID || mm.bId === KID_ID) && mm.round === i,
    )
    if (km) scores.push(String(i))
    revealTournamentRound(w)
  }
  closeTournament(w)
  const row = w.results.find((r: any) => r.playerId === KID_ID && r.week === ev.week)
  return {
    seed,
    champion: !!row && row.points === TIERS.j30.points[0],
    net: w.fundsCents - fundsBefore,
    week: ev.week,
    deadlineWeek: ev.deadlineWeek,
    deadlineSeasonWeek: ((ev.deadlineWeek % 52) + 52) % 52,
  }
}
