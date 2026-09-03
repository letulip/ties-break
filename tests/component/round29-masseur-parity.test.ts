// ⭐⭐ ROUND 29 #3 – THE MASSEUR: THE WEEK THE BILL IS CHARGED FOR AND THE WEEK HIS DAYS ARE DRAWN
// ON ARE THE SAME WEEK.
//
// The owner found the defect from first principles while reading an answer that repeated it back to
// him – «а вот не очень понятно как связано. Если есть турнир или тренировки, то есть и массажист.»
// His words are in docs/rounds/round-29.md, where they may be quoted in his own language.
//
// WHAT WAS WRONG. `resolveMasseur` bills the weekly salary through `masseurWorksThisWeek`, whose
// three stand-downs are the hire, the college freeze and a booked family week. A SHOOT is not one of
// them – so the salary was charged on every shoot week of every career. `composables/weekDays.ts`
// had re-spelled those three refusals by hand and added a fourth, `&& !shooting`, which exists
// nowhere in the engine. A shoot week therefore CHARGED for the masseur and DREW none of his
// sessions: «вы заплатили и не можете этого заметить», the exact failure the travelling-team plan
// bans specialists for – and the sentence saying so is written fifteen lines above where the bug was.
//
// ⚠ THE FIX RUNS IN THE ENGINE'S DIRECTION. The bill is correct; the drawing was not. So `shooting`
// is not added to the engine to make the two agree – the fourth term is deleted from the screen, and
// the screen asks the engine's own predicate (`masseurWorksInWeek`, `masseurWorksThisWeek`'s body
// taking primitives, on `spanWorthOffering`'s precedent) instead of re-spelling it.
//
// ⚠ WHAT IS DELIBERATELY UNCHANGED: `accrueCondition`'s own `!shooting` term. That one is about the
// CONDITION SUM – «lights and flights, not his table», the same reason a shoot week recovers at the
// travel figure at all – it is an owner-approved design decision, and round 29 does not touch it.
//
// ⭐⭐ THE PARITY BLOCK BELOW IS THE POINT OF THIS FILE, on round 28 #8's own pattern
// (`round28-household-shared.test.ts`): one world, two readers, asserted equal week kind by week
// kind. It is the THIRD time this round that the UI was found holding a rule the engine does not
// hold (calendar Part 0, the domestic-points plaque, this), so what is wanted is a check that fails
// when the two part company, not three separate fixes.
//
// ⚠ MUTATION-VERIFIED, and the ASYMMETRY is the record – see the note above §2.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  hireMasseur,
  masseurWorksThisWeek,
  setMasseurSessions,
  setMasseurTravels,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { adOfferId } from '../../src/engine/offers'
import { resumeMain } from '../../src/engine/rng'
import { ECONOMY } from '../../src/engine/economy'
import { isOffSeasonWeek } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20) AND THEN A PORTFOLIO (part four
 *  P6/§8). Every claim in this file is about the shipped watch deal's SHAPE – papers exactly like
 *  it are persisted in real saves – so `WATCH` freezes that LEGACY paper: the fee off the watches
 *  category's ≤200 cell (the anchor, unchanged to the cent), the brand its first house, the
 *  52-week term and two-shoot ask the old letters carry. */
// ⚠ INDEX 1 SINCE ROUND 34 #7/#11/#12/#13 (03.09), AND IT IS THE SAME ≤200 CELL. A fifth band was
// prepended to `advertising.bands` at ≤400, so every band index moved one to the right; the cheque
// itself was lifted tenfold at that rung by the owner's approved table.
const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  maxWtaRank: ECONOMY.advertising.bands[1].maxWtaRank,
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
  termWeeks: 52,
  shootWeeksPerTerm: 2,
}
/** The dearest rung, so "he drew nothing" and "he drew his sessions" are the widest apart. */
const DAILY = ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions

// The calendar always draws `week + 1` (`useCalendarWeek`), so the career stands one week short of
// the week under test in every fixture below. Week 216 is offset 8 of season 5 – an ordinary
// in-season adult week, asserted rather than assumed by the fixture test in §0.
const SHOOT_WEEK = 216
const AT = SHOOT_WEEK - 1

/** A world standing at `AT` with a signed endorsement naming `shootWeeks`, the masseur hired at the
 *  dearest rung and TRAVELLING – so the away term (which answers WHERE he works, not WHETHER) is
 *  neutral and the two readers are comparable on every week kind.
 *
 *  The `shootProbe` idiom of `tests/ad-offer.test.ts`: a fresh world handed a signed deal whose
 *  shoot weeks the test controls, so exactly one condition varies per arm. Walking a career until a
 *  house happened to write would be testing `chooseShootWeeks`, which that file already owns. */
function payrolled(shootWeeks: number[]): WorldState {
  const world = createWorld('r29-masseur-parity', { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = AT
  world.offers.push({
    id: adOfferId(AT - 10),
    kind: 'ad',
    week: AT - 10,
    deadlineWeek: AT - 7,
    state: 'signed',
    decidedWeek: AT - 10,
    fromWeek: AT - 10,
    untilWeek: AT - 10 + WATCH.termWeeks - 1,
    terms: { brand: WATCH.brand, cashCents: WATCH.cashCents, termWeeks: WATCH.termWeeks, shootCount: 2, shootWeeks },
  })
  // The hire is gated on a professional standing; the market's own door, opened the way the
  // `proWorld` fixtures do rather than by writing `masseurHired` behind the command's back.
  world.bestFinishByTier.w15 = 0
  hireMasseur(world, true)
  setMasseurSessions(world, DAILY)
  setMasseurTravels(world, true)
  return world
}

function mountCalendar(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(CalendarScreen, { global: { stubs: { teleport: true } } })
}

/** THE SCREEN'S VERDICT, read off the RENDERED grid and nothing else: does the drawn week carry his
 *  table? A composable read would be one layer short of the surface the owner is looking at. */
function screenDrawsTable(snapshot: Snapshot): boolean {
  setActivePinia(createPinia())
  const wrapper = mountCalendar(snapshot)
  const blocks = wrapper.findAll('.cal-block').filter((b) => b.text() === 'Body work').length
  wrapper.unmount()
  return blocks > 0
}

/** THE ENGINE'S VERDICT for the week the calendar is drawing. `masseurWorksThisWeek` is pure state –
 *  the hire, `inCollege`, `vacationForWeek` – so asking it of the same world seen one week on is the
 *  same question the tick will ask, without ticking anything into the arm under test. */
function engineWorks(world: WorldState): boolean {
  return masseurWorksThisWeek({ ...world, week: world.week + 1 })
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// §0 – THE FIXTURE IS WHAT IT CLAIMS TO BE
// =================================================================================================
describe('round 29 #3 – the fixture', () => {
  it('an ordinary in-season week, a signed deal that names it, and a masseur on the payroll', () => {
    expect(isOffSeasonWeek(SHOOT_WEEK), 'an off-season shoot is a cost wearing a cost\'s clothes').toBe(false)
    const world = payrolled([SHOOT_WEEK])
    const snap = toSnapshot(world)
    expect(snap.adShoots.flatMap((d) => d.weeks), 'the deal does not name the week under test').toContain(SHOOT_WEEK)
    expect(snap.masseurHired).toBe(true)
    expect(snap.masseurSessionsPerWeek).toBe(DAILY)
  })
})

// =================================================================================================
// §1 – THE BILL AND THE PICTURE, MEASURED IN ONE BREATH
// =================================================================================================
//
// ⚠ THE TWO HALVES ARE ASSERTED TOGETHER ON PURPOSE. Either alone is defensible on its own terms –
// "the engine bills him" and "the calendar draws nothing" are both coherent sentences – and it is
// only holding them side by side that names the defect. This is the assertion the shipped build
// fails.
describe('round 29 #3 – a shoot week bills for the masseur, so it draws him', () => {
  it('⚠⚠ the salary really is charged on the shoot week – read out of a ticked world', () => {
    const world = payrolled([SHOOT_WEEK])
    const rng = resumeMain(world.rngMain)
    tickWeek(world, rng) // spends AT, landing the world ON the shoot week
    tickWeek(world, rng) // and spends the shoot week itself
    const billed = world.events.filter((e) => e.week === SHOOT_WEEK && e.text.startsWith('Masseur – weekly salary'))
    expect(billed, 'the engine charged nothing, so this whole item is about something else').toHaveLength(1)
    expect(billed[0].amountCents).toBeLessThan(0)
  })

  it('⚠⚠ ...and the calendar draws every session the rung buys on that same week', () => {
    // ⚠ MUTATION: put `&& !shooting` back into `calendarWeekFor`'s masseur predicate – the shipped
    // defect – and this goes red while the billing assertion above stays green. That pair IS the
    // owner's complaint.
    const snap = toSnapshot(payrolled([SHOOT_WEEK]))
    const wrapper = mountCalendar(snap)
    expect(wrapper.findAll('.cal-block').filter((b) => b.text() === 'Body work').length).toBe(DAILY)
    wrapper.unmount()
  })

  it('...and the shoot is still on the same week, so the two are really sharing it', () => {
    // Without this, "he draws" could mean the shoot silently stopped being a shoot.
    const snap = toSnapshot(payrolled([SHOOT_WEEK]))
    const wrapper = mountCalendar(snap)
    expect(wrapper.findAll('.cal-block').filter((b) => b.text() === 'Shoot').length).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

// =================================================================================================
// §2 – THE PARITY: ONE WORLD, TWO READERS, FOUR WEEK KINDS
// =================================================================================================
//
// ⚠⚠ THE ASYMMETRY IS THE RECORD, and it is what makes this worth more than the fix above it:
//
//   A. THE ENGINE RULE MOVED – `masseurWorksInWeek` forced to ignore its `bookedOff` argument ->
//      this block AND `tests/masseur.test.ts` redden together, because both readers moved with it.
//   B. ⭐⭐ ONLY THE UI MOVED – `&& !shooting` put back into `calendarWeekFor` (the second
//      implementation this block exists to forbid, making exactly the mistake a hand-spelled copy
//      plausibly makes) -> THIS BLOCK ALONE reddens, on the shoot row, with every engine-side
//      masseur test green beside it. That is the proof: an engine test cannot see a rule the screen
//      invented, and this can.
describe('round 29 #3 – the screen and the engine agree about every week kind', () => {
  /** The four kinds, each built on the SAME career by changing exactly the one fact that names it. */
  const arms: { name: string; world: () => WorldState }[] = [
    { name: 'a shoot week', world: () => payrolled([SHOOT_WEEK]) },
    {
      name: 'a booked family week',
      world: () => {
        const w = payrolled([])
        w.vacations.push({ week: SHOOT_WEEK, packageId: ECONOMY.vacation.packages[0].id, paidCents: 0 })
        return w
      },
    },
    {
      name: 'a week inside the college freeze',
      world: () => {
        const w = payrolled([])
        w.college = { fromWeek: AT, untilWeek: AT + 52, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
        return w
      },
    },
    { name: 'an ordinary training week', world: () => payrolled([]) },
  ]

  for (const arm of arms) {
    it(`${arm.name}: the drawn table and \`masseurWorksThisWeek\` say the same thing`, () => {
      const world = arm.world()
      const engine = engineWorks(world)
      const screen = screenDrawsTable(toSnapshot(world))
      expect(screen, `${arm.name}: the screen and the engine disagree about the masseur`).toBe(engine)
    })
  }

  it('⚠ the arms are not all the same answer – two say yes and two say no', () => {
    // A parity test whose four rows all read `true` would pass against a screen that drew his table
    // unconditionally. This is what stops that reading.
    const verdicts = arms.map((a) => engineWorks(a.world()))
    expect(verdicts.filter(Boolean).length, 'every arm agrees, so the sweep proves nothing').toBe(2)
  })
})

// =================================================================================================
// §3 – THE ONE PLACE THEY DIFFER, NAMED SO THE EQUALITY ABOVE IS NOT READ AS "ALWAYS"
// =================================================================================================
describe('round 29 #3 – a masseur left at home on a tournament week', () => {
  it('the retainer runs (the engine says he works) and the calendar draws no table', () => {
    // `resolveMasseur`: "The retainer RUNS on a tournament week he STAYS HOME from – the coach's own
    // 08.08 rule." The screen's away term answers a DIFFERENT question – where he works – so this
    // difference is deliberate, and it is the reason §2 sets `masseurTravels` on.
    const world = payrolled([])
    setMasseurTravels(world, false)
    // ⚠ RE-AIMED (round 29 P15): the arrival used to be spread from `{} as never`, so the fixture's
    // `arrival` carried a WEEK and nothing else – no event id, no verdict and no TIER. That was
    // invisible until the trip arc became a function of the draw's rounds and asked for the tier it
    // had never been given. A real `ArrivalPreview` always names one, so the fixture names one too;
    // the tier is deliberately the common 32-draw, because this case is about the masseur's seat and
    // not about the length of the week.
    const snap: Snapshot = {
      ...toSnapshot(world),
      arrival: { eventId: 'r29-p15-fixture', tier: 'w15', week: SHOOT_WEEK, verdict: 'play', outgrown: false },
    }
    expect(engineWorks(world), 'the retainer stopped running on a week she is away').toBe(true)
    expect(screenDrawsTable(snap), 'the calendar promised a table nobody is on').toBe(false)
  })
})
