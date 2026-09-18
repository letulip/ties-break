// ⭐⭐⭐ ROUND 42 #23 – THE TILE THAT SAYS «Team budget» HAS TO KNOW WHO THE TEAM IS.
//
// THE OWNER, 15.09: «в coaching budget я просил отражать всех активных специалистов… переименовать в
// Week budget или team budget.»
//
// ⚠ THE AUDIT FIRST, because the first half of his sentence is a claim about what was built: round 36
// review #9 («Coaching budget несёт больше информации») was answered with THE METER'S OWN FOUR
// FIGURES – free, the bar, committed, cap – and every one of them is about the COACH.
// `useCoachingBudget` reads exactly one row (`coachMarket.find(r => r.current)`); the masseur and the
// psychologist have always lived elsewhere. So the «all specialists» half was never a ledger item,
// and this file is it.
//
// ⚠⚠ THE ARITHMETIC IS DELIBERATELY UNTOUCHED, AND §3 BELOW IS THE GUARD THAT SAYS SO. Round 28 #8
// settled the same question in the opposite direction and its own guard still stands
// (`round28-household-block.test.ts` §4): the committed figure is the COACH's line and must not
// absorb the support staff, because the cap it is drawn against is the very denominator the ENGINE
// cuts every `overBudgetCents` from. A free figure that subtracted the payroll would disagree with
// the over-budget flags on the cards below it. The seats are a LISTING beside the meter.
//
// ⚠⚠⚠ ROUND 42 #42 (15.09) – AND THE PARAGRAPH ABOVE IS HISTORY, BY HIS WORD. It is kept verbatim
// because it is the reasoning, not the verdict. «committed должен это и показывать»: the meter is the
// payroll now, AND the engine moved with it (`overBudgetCents` is cut from the income less
// `supportPayrollWeeklyCents`), so the objection above is satisfied rather than overruled – the tile
// and the cards still describe one budget. §3 below is re-aimed in place and gains the arm that says
// so; its old form is quoted where it stood.
//
// ⚠ MUTATION-VERIFIED – each arm was watched failing. Recorded in the round 42 handoff:
//   * `seats` returns `[]` unconditionally            -> §1 and §2 go red; §3 stays green.
//   * `seats` drops its `masseurHired` clause         -> the «hire the masseur» arms go red on BOTH
//     hosts, alone, which is the item's own sentence.
//   * `committedCents` becomes the sum of the seats   -> §3 goes red (and round 28 #8's guard with
//     it), while §1/§2 stay green – the two claims really are separate.
// ⚠ THAT LAST ROW IS NOW THE SHIPPED BEHAVIOUR (round 42 #42), so it is a description of the change
//   rather than of a mutation. Its replacement, ⚠ COUNTS READ OFF THE RUNS AND NOT PREDICTED, each
//   mutation applied alone and reverted (control 30/30 green before and after, over this file plus
//   round28-household-block and round21-coach):
//     * `committedCents` back to the coach's row alone  -> **2 red**: §3's FIRST arm here, and round
//       28 #8's re-aimed §4 guard. §3's SECOND arm stays green.
//     * the `supportPayrollWeeklyCents` term dropped out of `coachMarket`'s `coachBudgetCents`
//       -> **1 red**: §3's SECOND arm, alone. §1, §2 and the first arm stay green.
//   ⭐ THAT SEPARATION IS THE POINT: the tile's figure and the engine's flag are still two claims, and
//   each has exactly one arm that can tell you which of them broke.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING – round 26 #16's rule for every mounted case over ~1s.
vi.setConfig({ testTimeout: 30_000 })
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import RailDashboard from '../../src/components/RailDashboard.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  hireMasseur,
  hirePsychologist,
  // ⭐ 17.09 – the third salaried seat, and the engine's own payroll figure beside it: §5 counts the
  // tile against what the ENGINE bills, never against a sum re-added in a test.
  hireSparring,
  masseurWeeklyCents,
  openingCoachId,
  psychologistWeeklyCents,
  sparringWeeklyCents,
  supportPayrollWeeklyCents,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { formatCents } from '../../src/shared/money'
import { TEAM_BUDGET_LABEL } from '../../src/composables/coachingBudget'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
// ⭐ HIS STANDING RULE OF 14.09 – the visual pass is a deliverable, at the wave gate's own parity
// widths. `fits.ts` is the instrument; §4 says what it can and cannot prove.
import { DESKTOP, PHONE, TABLET, assertInlineRowFits, setViewport, type Viewport } from './fits'

/** A professional career with a coach engaged and both seats UNLOCKED but empty – the state the
 *  «hire the masseur and the tile grows a row» measurement starts from. `bestFinishByTier.w15 = 0`
 *  is the one-way door both seats gate on (`activeLadderOf(world) === 'wta'`), which is the same
 *  handle `tests/team-share.test.ts` uses to put a fixture on the professional table. */
function proCareer(seed: string, coached = true): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle', background: 'wealthy' })
  world.bestFinishByTier.w15 = 0
  world.coachId = coached ? openingCoachId(world.seed, { ...world.profile, coachTier: 'middle' }) : null
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 40; i++) tickWeek(world, rng)
  world.fundsCents = Math.max(world.fundsCents, 500_000_00)
  return world
}

function mountRail(snapshot: Snapshot): VueWrapper {
  useGameStore().snapshot = snapshot
  return mount(RailDashboard, { global: { stubs: { teleport: true } } })
}

async function mountMarket(snapshot: Snapshot): Promise<VueWrapper> {
  useGameStore().snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  await nextTick()
  return wrapper
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
/** Every seat row a surface drew, as `name` / `cost` pairs – the shape the tile promises. */
const seatRows = (w: VueWrapper) =>
  w.findAll('.budget-seat').map((p) => ({
    key: p.attributes('data-seat') ?? '',
    name: clean(p.find('.seat-name').text()),
    cost: clean(p.find('.seat-cost').text()),
  }))

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// 1 – HIRE THE MASSEUR AND THE TILE GROWS A ROW. THE ITEM, IN ONE MEASUREMENT.
// =================================================================================================
describe('round 42 #23 – the tile lists every filled seat', () => {
  it('⭐⭐ the market\'s meter grows a row when the masseur is hired', async () => {
    const world = proCareer('r42-23-market')
    const before = seatRows(await mountMarket(toSnapshot(world)))
    expect(before.map((s) => s.key), 'a coached family with no staff lists the coach alone').toEqual(['coach'])

    hireMasseur(world, true)
    const snap = toSnapshot(world)
    const after = seatRows(await mountMarket(snap))
    expect(after.map((s) => s.key), 'the masseur did not join the tile').toEqual(['coach', 'masseur'])
    // ⚠ THE FIGURE IS THE ENGINE'S, REBUILT FROM THE FUNCTION THAT BILLS IT – never read back off the
    // component, and never off the snapshot field the component itself reads.
    expect(after[1].cost).toBe(`${formatCents(masseurWeeklyCents(world))} /wk`)
    expect(after[1].name).toBe('Masseur')
  })

  it('⭐⭐ …and so does the rail\'s shortcut, off the same computed', async () => {
    // His tile is on every desktop page, so the item is only half built if one host grows the row.
    const world = proCareer('r42-23-rail')
    expect(seatRows(mountRail(toSnapshot(world))).map((s) => s.key)).toEqual(['coach'])

    hireMasseur(world, true)
    hirePsychologist(world, true)
    const snap = toSnapshot(world)
    const rail = seatRows(mountRail(snap))
    expect(rail.map((s) => s.key), 'the third seat is missing from the rail').toEqual([
      'coach',
      'masseur',
      'psychologist',
    ])
    expect(rail.map((s) => s.name)).toEqual(['Coach', 'Masseur', 'Psychologist'])
    expect(rail[1].cost).toBe(`${formatCents(masseurWeeklyCents(world))} /wk`)
    expect(rail[2].cost).toBe(`${formatCents(psychologistWeeklyCents(world))} /wk`)

    // ...and the market says the identical thing about the identical world – one computed, two
    // surfaces, which is what `composables/coachingBudget.ts` exists for.
    expect(seatRows(await mountMarket(snap))).toEqual(rail)
  })

  it('⭐ the coach\'s own row is the roster row she is on, and a self-coached family has none', async () => {
    const hired = proCareer('r42-23-coach')
    const snap = toSnapshot(hired)
    const current = snap.coachMarket.find((r) => r.current)
    expect(current, 'the fixture really engaged a coach').toBeTruthy()
    const rows = seatRows(await mountMarket(snap))
    expect(rows[0].name).toBe('Coach')
    expect(rows[0].cost).toBe(`${formatCents(current!.weeklyCents)} /wk`)

    // The negative half: a parent on the court is nobody's employer, so there is no coach line –
    // and with no staff either the tile lists nothing at all rather than an empty payroll.
    const selfCoached = proCareer('r42-23-self', false)
    expect(selfCoached.coachId, 'the fixture really is self-coached').toBeNull()
    expect(seatRows(await mountMarket(toSnapshot(selfCoached)))).toEqual([])
    expect(seatRows(mountRail(toSnapshot(selfCoached)))).toEqual([])
  })
})

// =================================================================================================
// 2 – THE NAME IS HIS, AND IT IS THE SAME NAME ON BOTH HOSTS
// =================================================================================================
describe('round 42 #23 – «Team budget», once, off the constant', () => {
  it('⭐⭐ both surfaces file the tile under the shared constant', async () => {
    const world = proCareer('r42-23-name')
    const snap = toSnapshot(world)
    expect(clean((await mountMarket(snap)).find('.budget-label').text())).toBe(TEAM_BUDGET_LABEL)
    // ⚠ THE SECOND CARD, BY POSITION – the rail draws «In the account» first, and this tile is the
    // one holding the budget bar. Asked by structure rather than by index alone so an added card
    // cannot quietly re-point the assertion at something else.
    const railTitles = mountRail(snap)
      .findAll('.rail-dash-card')
      .filter((c) => c.find('.budget-bar').exists())
      .map((c) => clean(c.find('.rail-dash-title').text()))
    expect(railTitles, 'the rail draws no budget tile at all').toHaveLength(1)
    expect(railTitles[0], 'the rail names a different tile').toBe(TEAM_BUDGET_LABEL)
    // ⚠ HIS OWN PROPOSED WORDING, PINNED AS A LITERAL EXACTLY ONCE – here, so that the app can read
    // the constant everywhere and a silent re-wording still has one place to fail. It is a DRAFT at
    // his gate (invariant 4); the round's handoff reports it verbatim.
    expect(TEAM_BUDGET_LABEL).toBe('Team budget')
  })
})

// =================================================================================================
// 3 – AND NOT ONE FIGURE OF THE METER MOVED
// =================================================================================================
//
// ⚠⚠ ROUND 28 #8's STANDING GUARD, RESTATED HERE SO THE ITEM OWNS IT. «Can this family afford THIS
// COACH» is round 21 #12's claim and the cap is the engine's own over-budget denominator, so the
// seats are information and never a new subtrahend.
// ⚠⚠⚠ RE-AIMED BY ROUND 42 #42 (15.09), AND THE SECTION NOW ASSERTS THE OPPOSITE OF WHAT IT DID.
// Its old title was «the committed figure is still the coach's, with a full payroll on screen» and
// its arm was «⭐⭐ free == cap − the COACH alone, with the masseur and the psychologist both hired».
// That was item 23's deliberate restraint – the tile listed three people and counted one – and the
// owner looked at the result and said «committed должен это и показывать». So the restraint is
// lifted BY HIM, and this arm is the same arithmetic pointed the other way.
//
// ⚠ THE REASON THE OLD ARM GAVE IS NOT BEING DISMISSED, IT IS BEING SATISFIED. It said a free figure
// that subtracted the payroll «would disagree with the engine's own over-budget flags on the cards
// below it». Item 42 moved the engine with the tile: `coachMarket`'s `overBudgetCents` is cut from
// `familyWeeklyIncomeCents − supportPayrollWeeklyCents`. So this section gains a SECOND arm holding
// exactly that – the tile and the cards, on one mounted screen, agreeing about one budget – which is
// the property the old guard was really protecting.
describe('round 42 #42 – the committed figure is the WHOLE PAYROLL, and the cards agree with it', () => {
  it('⭐⭐ committed == every filled seat, and free == cap − that, with all three hired', async () => {
    const world = proCareer('r42-42-arith')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    const snap = toSnapshot(world)
    expect(snap.masseurSalaryCents, 'the arm needs a payroll to be absorbed at all').toBeGreaterThan(0)
    expect(snap.psychologistSalaryCents).toBeGreaterThan(0)

    // ⚠ REBUILT FROM THE SNAPSHOT'S OWN FIELDS, never read back off the component.
    const coach = snap.coachMarket.find((r) => r.current)?.weeklyCents ?? 0
    const payroll = coach + snap.masseurSalaryCents + snap.psychologistSalaryCents
    const cap = snap.coachBilling.weeklyIncomeCents
    const wrapper = await mountMarket(snap)

    const legend = clean(wrapper.find('.budget-legend').text())
    expect(legend, 'the committed figure is the payroll his tile lists').toContain(`${formatCents(payroll)} committed`)
    expect(legend, 'the cap line did not survive the change').toContain(`${formatCents(cap)} weekly cap`)
    // ...and it is no longer the coach alone, which is the whole of his sentence.
    expect(legend, 'the coach`s line alone is not what «committed» says any more').not.toContain(
      `${formatCents(coach)} committed`,
    )
    expect(clean(wrapper.find('.budget-free').text())).toContain(formatCents(Math.max(0, cap - payroll)))
  })

  it('⭐⭐⭐ ...and the ENGINE agrees: a rung is flagged against the income the payroll has left', async () => {
    // ⚠ THIS IS THE ARM THE OLD GUARD WAS ACTUALLY ABOUT. Round 28 #8 §4 and item 23's own note both
    // refused the payroll-inclusive meter on ONE ground: it would disagree with `overBudgetCents`.
    // So the claim worth pinning is not «which figure is on the tile» but «the tile and the cards are
    // one budget», and it is asserted here against the engine's own rows.
    const world = proCareer('r42-42-engine')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    const snap = toSnapshot(world)
    const payrollSupport = snap.masseurSalaryCents + snap.psychologistSalaryCents
    expect(payrollSupport, 'there really is a support payroll to subtract').toBeGreaterThan(0)
    const budget = Math.max(0, snap.coachBilling.weeklyIncomeCents - payrollSupport)
    for (const row of snap.coachMarket) {
      expect(row.overBudgetCents, `${row.name}: flagged against income less the payroll`).toBe(
        Math.max(0, row.weeklyCents - budget),
      )
    }
    // ⚠ AND THE ARM HAS TO CONTAIN THE THING IT IS PROVING: at least one rung must actually be over,
    // or every line above would pass with the payroll term deleted.
    expect(
      snap.coachMarket.filter((r) => r.overBudgetCents > 0).length,
      'some rung really is over this family`s payroll-adjusted budget',
    ).toBeGreaterThan(0)
  })
})

// =================================================================================================
// 3b – ⭐⭐⭐ HIS RULING OF 15.09: SHOW THE COST, NEVER REFUSE THE HIRE
// =================================================================================================
//
// «мы не можем запретить нанимать специалистов, если у них есть желание – они нанимают, просто в
// этом индикаторе мы покажем реальные затраты в неделю.» (Quoted here and not in a template: no
// Cyrillic may appear inside one, tests/round13-nav.test.ts.)
//
// The engine had always agreed – `hireCoach` does not consult the budget at all – so the defect was
// on the SCREEN, and it was two things at once: an over-budget row swapped its «Hire ›» chip for a
// shortfall figure, and took `blocked`, which paints a refusal (a dashed grey border, a dimmed
// portrait, a greyed name and price). A hire the engine would have accepted READ as forbidden.
//
// ⚠ THIS SECTION IS THE OTHER HALF OF §3 AND THEY ARE DELIBERATELY BOTH HERE. §3 says the flag is
// computed against the whole payroll; this says the flag is a WARNING and refuses nothing. Round 21
// #11's guards (tests/component/round21-coach.test.ts) hold the rest: the coach she HAS is not drawn
// as a refusal either, and the points lock still is one.
describe('round 42 #42 – an over-budget rung is a price, not a gate', () => {
  /** A career with at least one rung over the payroll-adjusted budget, and that rung's row. */
  async function marketWithAnOverBudgetRung(seed: string) {
    const world = proCareer(seed)
    hireMasseur(world, true)
    hirePsychologist(world, true)
    const snap = toSnapshot(world)
    const over = snap.coachMarket.find((r) => !r.current && r.lockedPoints === null && r.overBudgetCents > 0)
    expect(over, 'the fixture really holds an unaffordable rung she has earned').toBeTruthy()
    const wrapper = await mountMarket(snap)
    const row = wrapper
      .findAll('.cm-row')
      .find((n) => (n.attributes('aria-label') ?? '').startsWith(`${over!.name},`))
    expect(row, 'the row is on screen under its own name').toBeTruthy()
    return { wrapper, snap, over: over!, row: row! }
  }

  it('⭐⭐⭐ it keeps «Hire», it is not painted as a refusal, and the price is the week`s real cost', async () => {
    const { wrapper, over, row } = await marketWithAnOverBudgetRung('r42-42-cta')
    expect(row.find('.cm-action').text(), 'the call to action survives the shortfall').toBe('Hire ›')
    expect(row.classes(), 'and the refusal treatment is gone from it').not.toContain('blocked')
    expect(row.attributes('disabled'), 'nothing is disabled on money').toBeUndefined()
    // ⚠ «WE SHOW THE REAL WEEKLY COST» – and it is the engine's figure, rebuilt rather than read back.
    expect(clean(row.find('.cm-price').text())).toBe(`${formatCents(over.weeklyCents)}/wk`)
    // ...and the shortfall chip the row used to wear is gone from the whole page, not just this row.
    expect(wrapper.findAll('.cm-action.is-over').length, 'no row anywhere says «$X over»').toBe(0)
    expect(clean(wrapper.text()), 'and no row spells the shortfall in words either').not.toContain(
      `${formatCents(over.overBudgetCents)} over`,
    )
    // THE LISTENER HEARS THE SAME THING, which is the half a sighted reader cannot check: the label
    // used to end «over budget by $487» while the chip now says «Hire».
    const label = row.attributes('aria-label') ?? ''
    expect(label, 'the accessible name ends in the action the chip shows').toMatch(/– hire$/)
    expect(label, 'and still carries what the week costs').toContain(`${formatCents(over.weeklyCents)} a week`)
    expect(label, 'the refusal is not whispered to a screen reader either').not.toContain('over budget')
    wrapper.unmount()
  })

  it('⭐⭐⭐ ...and pressing it really asks to hire – the engine never consulted the budget', async () => {
    const { wrapper, over, row } = await marketWithAnOverBudgetRung('r42-42-press')
    await row.trigger('click')
    await nextTick()
    // The market's own confirm, which is the screen's whole answer to a press. A row that refused on
    // money would raise nothing at all, which is exactly what it used to do.
    const dialog = wrapper.find('.dialog-card')
    expect(dialog.exists(), 'the press opened the hire confirmation').toBe(true)
    expect(clean(dialog.text()), 'and it is about the coach that was pressed').toContain(over.name)
    wrapper.unmount()
  })

  it('⚠ the POINTS LOCK is untouched – that one IS a gate, and the engine enforces it', async () => {
    // The control that keeps the arm above honest: `blocked` did not stop being applied, it stopped
    // being applied to the wrong thing. A rung she has not earned is still refused, still disabled,
    // and still says what it is short by.
    // ⚠ A JUNIOR CAREER AND NOT `proCareer`. `eliteGateStandingOf` floors a professional at
    // `eliteGate.minPoints`, so a pro fixture has no locked rung to look at at all – measured while
    // writing this case (the first draft used `proCareer` and found none).
    const world = createWorld('r42-42-locked', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const snap = toSnapshot(world)
    const locked = snap.coachMarket.find((r) => r.lockedPoints !== null)
    expect(locked, 'the fixture holds a rung she has not earned').toBeTruthy()
    const wrapper = await mountMarket(snap)
    // ⚠ THE MARKET IS BEHIND ITS OWN TAB on a career with nobody hired – wave 5 T13's idiom, and the
    // two cases above reach it without this only because their fixture opens on the coaches list.
    const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
    await pill!.trigger('click')
    await nextTick()
    const row = wrapper
      .findAll('.cm-row')
      .find((n) => (n.attributes('aria-label') ?? '').startsWith(`${locked!.name},`))
    expect(row, 'the locked rung is on screen').toBeTruthy()
    expect(row!.classes(), 'and it still reads as a refusal').toContain('blocked')
    expect(row!.attributes('disabled'), 'and cannot be pressed').toBeDefined()
    expect(row!.find('.cm-action').text()).toBe(`${locked!.lockedPoints} pts short`)
    wrapper.unmount()
  })
})

// =================================================================================================
// 4 – THE VISUAL SWEEP (his standing rule of 14.09)
// =================================================================================================
//
// «визуальную проверку на всех экранах надо тоже заложить в билдера в спеку при внесении правок» –
// so the widths are the wave gate's own parity set, 375 / 768 / 900 / 1280, and the measurement is
// the repo's own `fits.ts` rather than an opinion about how it reads.
//
// ⚠ WHAT THIS CAN AND CANNOT PROVE, said out loud: happy-dom has no layout engine, so `fits.ts`
// COMPUTES the boxes off the real cascade with a fitted glyph advance, and it is a FLOOR – it
// under-counts. A red verdict is therefore always true; a green one says the row is not close. It is
// not a screenshot, and it is the instrument this repo gates on.
describe('round 42 #23 – the payroll fits the screens that draw it', () => {
  const WIDE_900: Viewport = { width: 900, height: 1024 }
  const SWEEP: Viewport[] = [PHONE, TABLET, WIDE_900, DESKTOP]

  for (const vp of SWEEP) {
    it(`⭐ the meter's seat rows stand on one line at ${vp.width}x${vp.height}`, async () => {
      // ⚠ setViewport BEFORE the mount – a media query is evaluated on an element's FIRST
      // computed-style read and then cached (fits.ts's own trap, measured on happy-dom 04.09).
      setViewport(vp)
      const world = proCareer(`r42-23-fit-${vp.width}`)
      hireMasseur(world, true)
      hirePsychologist(world, true)
      const wrapper = mount(CoachMarketScreen, {
        global: { stubs: { teleport: true } },
        attachTo: document.body,
      })
      await nextTick()
      useGameStore().snapshot = toSnapshot(world)
      await nextTick()

      const rows = wrapper.findAll('.budget-seat')
      expect(rows, 'the widest payroll the game can hire').toHaveLength(3)
      for (const row of rows) {
        const name = row.find('.seat-name').element
        const cost = row.find('.seat-cost').element
        assertInlineRowFits(row.element, [name, cost], vp, `the ${row.attributes('data-seat')} seat row`)
      }
      wrapper.unmount()
      document.body.innerHTML = ''
    })
  }

  it('⭐⭐ …and inside the 196px rail strip, which is the narrowest place it is drawn', () => {
    // ⚠ THE RAIL IS THE REAL RISK AND IT IS NOT A VIEWPORT WIDTH. The strip is `--app-rail-w: 196px`
    // and only exists from 1024 up, so the room a seat row has there is a fact about the RAIL rather
    // than about the window – measuring it at 1280 the way the four arms above measure the market
    // would score it a thousand pixels too generous. So the room handed to the model is the strip
    // itself: the honest narrowing, and the number the rail's own rules are written against
    // («18px is what a 196px strip holds without wrapping -$1,234,567»).
    setViewport(DESKTOP)
    const world = proCareer('r42-23-fit-rail')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    useGameStore().snapshot = toSnapshot(world)
    const wrapper = mount(RailDashboard, { global: { stubs: { teleport: true } }, attachTo: document.body })
    const rows = wrapper.findAll('.budget-seat')
    expect(rows).toHaveLength(3)
    const strip: Viewport = { width: 196, height: 1024 }
    for (const row of rows) {
      assertInlineRowFits(
        row.element,
        [row.find('.seat-name').element, row.find('.seat-cost').element],
        strip,
        `the ${row.attributes('data-seat')} seat row on the rail`,
      )
    }
    wrapper.unmount()
    document.body.innerHTML = ''
  })
})

// =================================================================================================
// 5 – ⭐⭐⭐ 17.09: EVERY SEAT THE SNAPSHOT SAYS IS FILLED, COUNTED AGAINST THE WIRE AND NOT A LITERAL
// =================================================================================================
//
// HIS REPORT, off his own play: «спарринг не учитывается в недельных расходах на верхней плашке на
// вкладке тренеров, его там просто нет».
//
// ⚠⚠ AND IT WAS NOT COSMETIC. `committedCents` is SUMMED off `seats`, so a family with a hitting
// partner was not merely missing a row – the bar, the «committed» figure and the «/week free» figure
// were all short by his salary, and the tile under-reported what the family had promised. It
// disagreed with the ENGINE at the same time: `supportPayrollWeeklyCents` has counted all three
// salaried seats since v80, so the denominator every `overBudgetCents` is cut from already knew
// about him. Section 3's second arm is the claim that broke; this section is why it can be trusted
// the next time a seat arrives.
//
// ⭐⭐ THE COMMENT ABOVE `seats` PROMISED THIS COULD NOT HAPPEN – «a fourth salaried seat added to the
// snapshot joins THIS array and both surfaces grow the row». It was aspirational: `seats` is a
// hand-written push per seat. So the guard below counts the tile's rows against the SNAPSHOT's own
// `*Hired` flags, discovered from the wire rather than typed out here – a FIFTH seat reddens this by
// existing, which is the only shape of test that could not have shipped the same defect twice.
//
// ⚠ MUTATION ARMS – applied alone against the real composable, watched red, reverted. Counts READ
// OFF THE RUNS: the round's handoff carries them.
describe('17.09 – the hitting partner is on the payroll, and the tile counts him', () => {
  /** Every salaried seat the WIRE says is filled, found by walking the snapshot's own `<seat>Hired`
   *  booleans. ⚠ THE COACH IS NOT IN IT AND THAT IS THE WIRE'S SHAPE, not an omission: he is flagged
   *  by `coachId`, because a family can be coached by a parent and owe nothing. */
  function hiredSeatKeys(snap: Snapshot): string[] {
    return Object.keys(snap)
      .filter((k) => k.endsWith('Hired') && (snap as unknown as Record<string, unknown>)[k] === true)
      .map((k) => k.slice(0, -'Hired'.length))
  }

  it('⭐⭐⭐ every seat the snapshot says is filled has a row – on BOTH surfaces', async () => {
    const world = proCareer('r44-seats-all')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    hireSparring(world, true)
    const snap = toSnapshot(world)

    // The instrument first: a discovery that found nothing would make every assertion below vacuous.
    const filled = hiredSeatKeys(snap)
    expect(filled.length, 'the wire really carries a filled payroll to count').toBe(3)
    expect([...filled].sort()).toEqual(['masseur', 'psychologist', 'sparring'])

    const expected = ['coach', ...filled].sort()
    for (const [host, rows] of [
      ['the market meter', seatRows(await mountMarket(snap))],
      ['the rail shortcut', seatRows(mountRail(snap))],
    ] as const) {
      // ⚠ MEMBERSHIP, SORTED, AND THAT IS THE POINT OF THIS ASSERTION rather than a weakening of it.
      // The expectation is DISCOVERED from the wire, and the wire's key order is the order somebody
      // typed `toSnapshot`'s object literal in – `sparringHired` happens to stand above
      // `psychologistHired` there, which is a fact about a file and not about a payroll. What the
      // tile owes is that nobody the family pays is missing; the ORDER it draws them in is a
      // separate claim with a separate reason, asserted on its own below.
      expect([...rows.map((s) => s.key)].sort(), `${host}: a seat the family pays is missing from the tile`)
        .toEqual(expected)
    }
    // ...AND THE ORDER, which is the Support-staff tab's own and deliberate: the masseur is the seat
    // the owner commissioned and could not find, so he stays first, and the newest seat goes last.
    // A literal, because it is a decision rather than a derivation.
    expect(seatRows(mountRail(snap)).map((s) => s.key)).toEqual([
      'coach',
      'masseur',
      'psychologist',
      'sparring',
    ])
    // ⚠ HIS SEAT'S FIGURE IS THE ENGINE'S, rebuilt from the function that bills it rather than read
    // back off the component or off the field the component itself reads.
    const his = seatRows(await mountMarket(snap)).find((s) => s.key === 'sparring')!
    expect(his.cost).toBe(`${formatCents(sparringWeeklyCents(world))} /wk`)
    expect(his.name, 'the tab`s own name for him, taken and not invented').toBe('Hitting partner')
  })

  it('⭐⭐⭐ ...and «committed» is the engine`s payroll, not a payroll one seat short', async () => {
    // THE HALF THAT WAS NOT COSMETIC. `committedCents` is the sum of the rows, so a missing row is a
    // wrong number in three places at once – and the number it has to agree with is the ENGINE's own
    // over-budget denominator, asked here of `supportPayrollWeeklyCents` rather than re-added.
    const world = proCareer('r44-seats-money')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    hireSparring(world, true)
    const snap = toSnapshot(world)
    expect(snap.sparringSalaryCents, 'the arm needs a salary that could go missing').toBeGreaterThan(0)

    const coach = snap.coachMarket.find((r) => r.current)?.weeklyCents ?? 0
    const payroll = coach + supportPayrollWeeklyCents(world)
    const cap = snap.coachBilling.weeklyIncomeCents
    const wrapper = await mountMarket(snap)
    const legend = clean(wrapper.find('.budget-legend').text())
    expect(legend, 'the committed figure is the whole team, his seat included')
      .toContain(`${formatCents(payroll)} committed`)
    expect(legend, 'and it is not the payroll that forgot him').not.toContain(
      `${formatCents(payroll - snap.sparringSalaryCents)} committed`,
    )
    expect(clean(wrapper.find('.budget-free').text()), 'so the free figure is not short by his salary')
      .toContain(formatCents(Math.max(0, cap - payroll)))
  })

  it('⭐ a seat that is NOT hired draws no row – the rows are the flags and nothing else', () => {
    // The negative half of the same claim, which is what stops «list them all» being satisfied by a
    // list of everybody.
    const world = proCareer('r44-seats-one')
    hireSparring(world, true)
    const snap = toSnapshot(world)
    expect(hiredSeatKeys(snap), 'one seat filled, two empty').toEqual(['sparring'])
    expect(seatRows(mountRail(snap)).map((s) => s.key)).toEqual(['coach', 'sparring'])
  })
})
