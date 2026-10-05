// =================================================================================================
// ROUND 46 #16 – «W11 2049 в календаре показали injured, на home injured walkover, но при этом
// пустили играть на W500 и далее выиграли 2 матча, что-то странное было»
// =================================================================================================
//
// THE SAVE NEVER ARRIVED, so this is the law found in code and then reproduced, not a replay of his
// career. The two surfaces he names – the home verdict («injured walkover») and the Calendar's grid
// («injury», the week ahead) – ask ONE question about the week the main button plays: "will she
// still be laid up when that week resolves?", and both answer it from the CLINIC's number
// (`injury.weeksRemaining`) with `layoffCoversWeek`. The tick answers it from what is left AFTER
// `rollInjury` has run – and `rollInjury` pays the MASSEUR's rehab week inside the tick
// (world/injury.ts, "the masseur bought a week back"). So on the one snapshot where the clinic has
// TWO weeks left and his cadence lands on the next tick, the clinic reads "out for next week" and
// the tick finds her cleared: the entered tournament is PLAYED, not walked over.
//
//     clinic weeksRemaining = 2  ·  tick: 2 − 1 (the week) − 1 (the masseur) = 0  ·  cleared, plays
//
// It is one week wide per layoff and only on the cadence's parity, which is why it looks like a
// glitch rather than a rule. The wire already carries the honest figure –
// `injury.expectedWeeks = weeksRemaining − masseurRehabWeeksAhead` (round 41 #19) – and for the NEXT
// tick that replay is not a forecast but the very arithmetic the tick will run, so it is exact.
//
// ⚠ WHAT IS DELIBERATELY NOT TOUCHED: the clinic's countdown on the plaque (round 34: «the countdown
// on screen is NOT rewritten – his weeks arrive one receipt at a time»), the entry gate and the
// planner (`layoffCovering`, the clinic's window, R10-17), and the look-ahead rows (they start the
// week AFTER the grid, so they are forecasts by construction). Only the week the button plays is
// previewed from the replay; the scope fence below pins that boundary.
import { describe, expect, it } from 'vitest'
import { createWorld, tickWeek, toSnapshot, type WorldState } from '../src/engine/world'
import { masseurRehabWeeksAhead } from '../src/engine/world/masseur'
import { rngFromSeed } from '../src/engine/rng'
import { calendarWeekFor, layoffHoldsWeek, lookAheadFor } from '../src/composables/weekDays'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

const PLAY_WEEK = 11
const EVENT_ID = 'r46-16-committed'

interface Case {
  weeksRemaining: number
  totalWeeks: number
  /** weeks into the layoff WHEN THE TICK RUNS – the cadence reads `world.week − sinceWeek` */
  rehabWeekAtTick: number
  /** null = no masseur; 2 / 4 / 7 sessions are the three rungs (N = 3 / 2 / 1) */
  sessions: number | null
  tier: TierId
}

/** The owner's state, built through the public shape: week 10, an entry on W11 whose list closed
 *  at W9 (so the fee is committed and the entry survives the layoff – the R12-15 shape), and a
 *  layoff the clinic says runs through W11. ⚠ The injury is WRITTEN, not rolled: the law under test
 *  is what the surfaces and the tick do with a layoff, not how a layoff is dealt. */
function hurtWorld(c: Case): WorldState {
  const world = createWorld('r46-16', { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = PLAY_WEEK - 1
  world.physioActive = false
  world.condition = 100
  world.fundsCents = 1_000_000_00
  world.entries = []
  world.masseurHired = c.sessions !== null
  if (c.sessions !== null) world.masseurSessionsPerWeek = c.sessions
  const event: SeasonEvent = {
    id: EVENT_ID,
    week: PLAY_WEEK,
    tier: c.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: PLAY_WEEK - 2,
  }
  world.season.push(event)
  world.season.sort((a, b) => a.week - b.week)
  world.entries.push(EVENT_ID)
  world.injury = {
    kind: 'ankle sprain',
    severity: 'moderate',
    weeksRemaining: c.weeksRemaining,
    totalWeeks: c.totalWeeks,
    sinceWeek: PLAY_WEEK - c.rehabWeekAtTick,
  }
  return world
}

type Verdict = 'play' | 'injured'

/** What the two surfaces say about the week the button plays – read BEFORE the tick, off one snapshot. */
function whatTheScreensSay(world: WorldState): { home: Verdict | undefined; grid: Verdict } {
  const snap = toSnapshot(world)
  // `useCalendarWeek` is exactly `calendarWeekFor(snap, snap.week + 1)`; `days[0]` is what the
  // screen's `injuredNow` pill reads ('rehab' = «On the bench»).
  const gridDay = calendarWeekFor(snap, snap.week + 1).days[0]
  return {
    home: snap.arrival?.verdict,
    grid: gridDay?.kind === 'rehab' ? 'injured' : 'play',
  }
}

/** What the engine does with that week: one real tick. */
function whatTheTickDoes(world: WorldState): Verdict {
  tickWeek(world, rngFromSeed(world.seed))
  expect(world.week, 'the tick played the week the button plays').toBe(PLAY_WEEK)
  expect(world.medicalWithdrawalWeek, 'the doctor is not the question here').not.toBe(PLAY_WEEK)
  // The ENTRY LAW, asserted in every cell that calls this: she plays exactly when the layoff is
  // over at the play week, and walks over exactly when it is not. No cell has her playing under an
  // injury (a hole at play time) or walking over while fit (a stale entry) – the only gap this file
  // finds is between the engine and the two screens.
  expect(world.injury !== null, 'she plays exactly when the layoff is over').toBe(world.walkoverWeek === PLAY_WEEK)
  return world.walkoverWeek === PLAY_WEEK ? 'injured' : 'play'
}

describe('round 46 #16 – the week the button plays is previewed with the rule the tick pays', () => {
  it('⭐ THE OWNER\'S STATE: clinic says two weeks, the daily masseur buys one back – the W500 is PLAYED', () => {
    const world = hurtWorld({ weeksRemaining: 2, totalWeeks: 6, rehabWeekAtTick: 3, sessions: 7, tier: 'wta500' })
    // Both halves of the state, so a change that removes either fails HERE rather than making the
    // rest of this block vacuous.
    expect(masseurRehabWeeksAhead(world), 'his hands take the last week off at the very next tick').toBe(1)
    const snap = toSnapshot(world)
    expect(snap.injury?.weeksRemaining, 'the plaque keeps the clinic\'s number – round 34').toBe(2)
    expect(snap.injury?.expectedWeeks, 'and the wire already carries the honest one – round 41').toBe(1)

    const said = whatTheScreensSay(world)
    const did = whatTheTickDoes(world)
    expect(world.injury, 'the tick cleared her at the top of the week').toBeNull()
    expect(world.entries, 'and the entry was kept to be played').toContain(EVENT_ID)
    // ⚠ `pending` is ABSENT, not null, when nothing was drawn – so the positive claim is truthiness.
    expect(toSnapshot(world).pending, 'a W500 drawn and waiting to be revealed: she PLAYS').toBeTruthy()
    // The claim: every screen said what the tick then did. Before the fix: home 'injured',
    // grid 'injured', tick 'play' – the owner's two surfaces against one tournament.
    expect({ ...said, tick: did }).toEqual({ home: 'play', grid: 'play', tick: 'play' })
  })

  it('⚠ CONTROL – no masseur: the same layoff still walks over, and both screens say so', () => {
    const world = hurtWorld({ weeksRemaining: 2, totalWeeks: 6, rehabWeekAtTick: 3, sessions: null, tier: 'wta500' })
    expect(masseurRehabWeeksAhead(world)).toBe(0)
    const said = whatTheScreensSay(world)
    const did = whatTheTickDoes(world)
    expect(world.walkoverWeek, 'the walkover is marked, so the advance halts on it').toBe(PLAY_WEEK)
    expect(toSnapshot(world).pending, 'nothing was drawn – she did not appear').toBeFalsy()
    expect({ ...said, tick: did }).toEqual({ home: 'injured', grid: 'injured', tick: 'injured' })
  })

  it('⭐ EXACT, NOT LUCKY: three rungs × layoffs of 1–6 weeks × three cadence phases – both screens equal the tick in every cell', () => {
    const rungs: Array<{ sessions: number; every: number }> = [
      { sessions: 2, every: 3 },
      { sessions: 4, every: 2 },
      { sessions: 7, every: 1 },
    ]
    const disagreements: string[] = []
    let walkovers = 0
    let plays = 0
    let masseurSavedTheWeek = 0
    for (const rung of rungs) {
      for (let weeksRemaining = 1; weeksRemaining <= 6; weeksRemaining++) {
        for (let rehabWeekAtTick = 1; rehabWeekAtTick <= 3; rehabWeekAtTick++) {
          const world = hurtWorld({
            weeksRemaining,
            totalWeeks: weeksRemaining + rehabWeekAtTick,
            rehabWeekAtTick,
            sessions: rung.sessions,
            tier: 'national',
          })
          const clinicSaysOut = weeksRemaining > 1
          const said = whatTheScreensSay(world)
          const did = whatTheTickDoes(world)
          if (did === 'injured') walkovers++
          else plays++
          if (clinicSaysOut && did === 'play') masseurSavedTheWeek++
          const cell = `N=${rung.every} R=${weeksRemaining} phase=${rehabWeekAtTick}`
          for (const [surface, verdict] of Object.entries(said)) {
            if (verdict !== did) disagreements.push(`${cell}: ${surface} said ${verdict}, the tick did ${did}`)
          }
        }
      }
    }
    // A non-empty denominator on BOTH arms, and on the arm that is the bug: a sweep in which the
    // masseur never changed a verdict would pass on today's code too and prove nothing.
    expect(walkovers, 'the walkover arm ran').toBeGreaterThan(0)
    expect(plays, 'the play arm ran').toBeGreaterThan(0)
    expect(masseurSavedTheWeek, 'cells where the clinic says out and the tick says play').toBeGreaterThan(0)
    expect(disagreements).toEqual([])
  }, 60_000)

  it('⚠ SCOPE FENCE – only the played week is previewed from the replay; the look-ahead keeps the clinic\'s countdown (round 34)', () => {
    // Daily rung, six weeks left: the clinic window is [10, 16); his replay clears her at the top of
    // week 13. Week 12 is out on BOTH readings, week 14 is out on the clinic's and not on his – and
    // the look-ahead still draws it as the clinic's, because the countdown on screen is not rewritten
    // and the entry gate / planner read the same window. Widening this is an owner call, not a parity
    // read: see the ledger entry under round 46 #16.
    const world = hurtWorld({ weeksRemaining: 6, totalWeeks: 9, rehabWeekAtTick: 3, sessions: 7, tier: 'national' })
    const snap = toSnapshot(world)
    expect(snap.injury?.expectedWeeks, 'the replay says back at 13: three weeks, not six').toBe(3)
    const rows = lookAheadFor(snap)
    expect(rows[0]?.week, 'the look-ahead starts the week AFTER the grid – it is forecast territory').toBe(PLAY_WEEK + 1)
    expect(rows.find((r) => r.week === 12)?.injured, 'out on both readings').toBe(true)
    expect(rows.find((r) => r.week === 14)?.injured, 'the clinic\'s window, unchanged').toBe(true)
  })

  it('⭐ `layoffHoldsWeek` – the played week reads the replay, every other week the clinic\'s window (what the grid and the Season chips share)', () => {
    const owner = toSnapshot(hurtWorld({ weeksRemaining: 2, totalWeeks: 6, rehabWeekAtTick: 3, sessions: 7, tier: 'wta500' }))
    expect(layoffHoldsWeek(owner, PLAY_WEEK - 1), 'today: she is laid up now').toBe(true)
    expect(layoffHoldsWeek(owner, PLAY_WEEK), 'the played week: the tick clears her, the clinic said out').toBe(false)
    const longer = toSnapshot(hurtWorld({ weeksRemaining: 6, totalWeeks: 9, rehabWeekAtTick: 3, sessions: 7, tier: 'national' }))
    expect(layoffHoldsWeek(longer, PLAY_WEEK), 'out on both readings').toBe(true)
    // The mutation arm: widen the replay to every week and this reads `14 < 10 + 3` = false.
    expect(layoffHoldsWeek(longer, 14), 'a later week keeps the clinic\'s window – the replay is NOT widened to it').toBe(true)
    const nobody = toSnapshot(hurtWorld({ weeksRemaining: 2, totalWeeks: 6, rehabWeekAtTick: 3, sessions: null, tier: 'national' }))
    expect(nobody.injury?.expectedWeeks, 'no masseur, no replay on the wire').toBeUndefined()
    expect(layoffHoldsWeek(nobody, PLAY_WEEK), 'the clinic\'s number is already the truth').toBe(true)
  })
})
