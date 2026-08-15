// ⭐⭐ ROUND-21 #2 – THE COACH TRAVELS, ON REAL SCREENS, ON REAL CAREERS.
//
// ⚠ THIS FILE REPLACES `tests/component/coach-travel-row.test.ts`, WHICH WAS ROUND-20 #1 AND IS NOW
// OVERTURNED. That file's whole subject was that the row could never open: «the `disabled` on the
// switch is a LITERAL in the template, not a binding; there is no handler, no computed, no age gate;
// `game.setCoachOnEventWeeks` has NO caller anywhere in src/». It was correct, and it was an answer
// where the owner had asked for a build - which is why he asked a THIRD time on 14.08:
//
//   «Тренер всё ещё не едет на соревнования, как так? Уже 3й раз прошу сделать»
//
// ...and, when asked what «едет» should mean given that three STAT versions of it were measured on
// 30.07 and all three failed:
//
//   «Присутствие в потоке и трансляции точно надо (если едет), но бонус какой-то тоже нужен,
//    я считаю. А может и не один даже.»
//
// (The quotes live here rather than in the templates they are about: tests/round13-nav.test.ts bans
// Cyrillic inside a Vue template, comments included, and it caught the 30.07 draft of that very
// block doing it.)
//
// SO THIS FILE HOLDS THE PRESENCE HALF, on the three screens it has to reach: the coach room, the
// tournament flow and the week's story. The engine half - the fare, the charge, the notice and the
// running commentary - is `tests/round21-coach-travel.test.ts`.
//
// ⚠ AND ONE ASSERTION HERE IS CLAUDE.md's OWN GOTCHA, EARNED BY A DIALOG THAT STOPPED HIS CAREER
// (round-20 #3): anything added or lengthened on a card gets a MOUNTED measurement against a 375x667
// phone. The presence line lands on `.tf-brief`, the tournament splash's own card, so §3 measures
// that card and the control that leaves it. Mutation-verified below.
//
// ⭐⭐ 15.08 – AND TWO MORE THINGS THE OWNER RULED ON THE SAME DAY, BOTH OF THEM ABOUT COPY:
//
//   * «очень согласен» – the screen must say the SECOND SEAT IS NOT COVERED, and show the real
//     figure. His seat is gross since `f9104eb` (the support pays for hers and never for his), so
//     "twice the fare" is now FALSE for exactly the families the support exists for. §1 holds the two
//     arms - a career with a scholarship and the same career without - to different sentences.
//   * «делаем тогда» / «По мне игрок сам решает: есть деньги - едет тренер, нет - не едет, или едет,
//     но быстрее банкротится.» - the junior rungs become an opt-in (schema v49), with a WARNING
//     rather than a gate before the first fare. §1 holds the nested row, the warning's numbers and
//     both answers to it; §3 measures that dialog against the phone, mutation-verified.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  enterEvent,
  setCoachOnEventWeeks,
  setCoachOnJuniorEvents,
  closeTournament,
  skipTournament,
  decideKnock,
  pendingKnock,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'
import { assertDismissReachable, boxOf, setViewport, PHONE } from './fits'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`, and without it this measurement is vacuous')
  }
}

function career(seed: string, travels: boolean, tier: 'self' | 'middle' = 'middle'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
  if (travels) setCoachOnEventWeeks(world, true)
  return world
}

/** A REAL career ticked to a REAL tournament, entering whatever the engine allows. */
function atTournament(seed: string, travels: boolean): Snapshot {
  const world = career(seed, travels)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 80; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* eligibility and caps are the engine's business */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) return toSnapshot(world)
  }
  throw new Error('no tournament reached – the fixture is broken, not the assertion')
}

/** ...and on to the week the journey painting (and its scrap) is drawn on. */
function atJourneyHome(seed: string, travels: boolean): Snapshot {
  const world = career(seed, travels)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 120; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* the engine decides */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    const snap = toSnapshot(world)
    if (snap.diary.facts.travelHomeScene !== null) return snap
  }
  throw new Error('no journey home reached – the fixture is broken, not the assertion')
}

/** ⭐ 15.08 / v49 – A REAL BOOKED SEASON, priced. Ten weeks of a real career entering everything the
 *  engine allows, with the coach travelling and the junior rungs opened, so `coachBilling` has trips
 *  to quote money over. The scholarship is SET rather than earned - the season review that grants one
 *  is years away and this is a copy test, not a test of the academy - but it is the engine's own
 *  shape, the one `reviewAcademy` writes and `travelCostFor` reads, so the discount on screen is
 *  computed by the engine exactly as it would be for a girl who earned it. */
function bookedSeason(seed: string, opts: { scholarship: boolean; juniors?: boolean; travels?: boolean }): Snapshot {
  const world = career(seed, opts.travels ?? true)
  if (opts.juniors ?? true) setCoachOnJuniorEvents(world, true)
  if (opts.scholarship) world.academy = { level: 0.5, sinceWeek: 0, seasonIndex: 0, coveredCents: 0 }
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 10; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* eligibility and caps are the engine's business */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return toSnapshot(world)
}

async function mountMarket(snapshot: Snapshot, opts: { attach?: boolean } = {}) {
  useGameStore().snapshot = snapshot
  const w = mount(CoachMarketScreen, {
    // ⚠ ATTACHED ONLY WHERE THE CASCADE IS BEING MEASURED (the fit assertion): `getComputedStyle`
    // reads the real sheet, and the real sheet only applies to a document the node is in.
    ...(opts.attach ? { attachTo: document.body } : {}),
    global: { stubs: { teleport: true } },
  })
  const pill = w.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return w
}

function travelRow(w: ReturnType<typeof mount>) {
  const section = w.find('.cm-travel')
  expect(section.exists(), 'the travel row is on the screen at all').toBe(true)
  return { section, sub: section.find('.cm-travel-sub'), toggle: section.find('.cm-switch') }
}

// =================================================================================================
// 1. THE COACH ROOM – the switch is a switch again
// =================================================================================================

describe('§1 the row on screen T', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ IS LIVE AT 14, WHICH IS THE AGE THE OLD ROW REFUSED HARDEST', async () => {
    const w = await mountMarket(atTournament('row-junior', false))
    const { toggle } = travelRow(w)
    expect(toggle.attributes('role')).toBe('switch')
    // ⚠ THE ASSERTION ROUND-20 #1 COULD NOT MAKE. It had to pin `disabled` as PRESENT, because
    // nothing in the app could ever lift it. Here it is absent on an idle store, which is the whole
    // of the owner's third report answered in one attribute.
    expect(toggle.attributes('disabled'), 'nothing on this screen refuses the press any more').toBeUndefined()
    expect(toggle.attributes('aria-checked')).toBe('false')
    w.unmount()
  })

  it('⭐ PRESSING IT CALLS THE COMMAND – the caller src/ did not have for three weeks', async () => {
    const snap = atTournament('row-press', false)
    const store = useGameStore()
    const spy = vi.spyOn(store, 'setCoachOnEventWeeks').mockResolvedValue(undefined)
    const w = await mountMarket(snap)
    await travelRow(w).toggle.trigger('click')
    await nextTick()
    expect(spy, 'the switch is wired to the engine command at last').toHaveBeenCalledWith(true)
    w.unmount()
  })

  it('...and it reports the ENGINE\'s stance rather than a literal, in both directions', async () => {
    const on = await mountMarket(atTournament('row-on', true))
    expect(travelRow(on).toggle.attributes('aria-checked')).toBe('true')
    on.unmount()

    setActivePinia(createPinia())
    const off = await mountMarket(atTournament('row-on', false))
    expect(travelRow(off).toggle.attributes('aria-checked')).toBe('false')
    off.unmount()
  })

  it('⭐ AND IT PRICES ITSELF, in the engine\'s own money', async () => {
    const snap = bookedSeason('row-price', { scholarship: false })
    const w = await mountMarket(snap)
    const text = travelRow(w).sub.text()
    // The RULE is always said - it is what makes the decision legible without a booked season.
    expect(text, 'the owner\'s own pricing, in four words').toMatch(/twice the fare/i)
    // ...and the MONEY comes off `coachBilling`, never out of the template's own arithmetic.
    expect(snap.coachBilling.travelTrips, 'the fixture has trips booked').toBeGreaterThan(0)
    expect(text).toMatch(new RegExp(`${snap.coachBilling.travelTrips} trips`))
    expect(text, 'the figure is the engine\'s').toContain(formatCents(snap.coachBilling.travelFareCents))
    expect(text, 'and it is short-dash English, like every other line in the app').not.toMatch(/—/)
    w.unmount()
  })

  // ===============================================================================================
  // ⭐⭐ 15.08 – THE LINE A FAMILY ON A SCHOLARSHIP READS IS A DIFFERENT LINE (owner: «очень согласен»)
  //
  // The support pays for HER seat and never for the coach's (`coachTravelFareFor` is gross since
  // f9104eb, and the principle is held by tests/support-never-pays-the-coach.test.ts). So for a
  // covered family a trip is NOT "twice the fare" - it is her discounted seat plus his whole one, and
  // the better the scholarship the wider those two numbers are apart. Quoting the bare multiple to
  // them would be wrong for precisely the families the mechanism exists for, which is why the two
  // arms below must not read the same.
  // ===============================================================================================
  it('⭐⭐ SAYS THE SECOND SEAT IS NOT COVERED, AND PRINTS BOTH REAL FIGURES', async () => {
    const covered = bookedSeason('row-covered', { scholarship: true })
    const b = covered.coachBilling
    // The fixture is REAL: a booked junior season, a hired coach, and a scholarship that is actually
    // taking money off her fares - so the two figures on screen come apart for the engine's reason.
    expect(b.travelCovered, 'the fixture family really is supported').toBe(true)
    expect(b.travelTrips, 'and it really has trips to price').toBeGreaterThan(0)
    expect(b.travelHerFareCents, 'her seat is discounted').toBeLessThan(b.travelFareCents)

    const w = await mountMarket(covered)
    const text = travelRow(w).sub.text()
    // (a) IT SAYS HIS SEAT IS NOT COVERED. No pronoun names the coach (R15-7) - "the coach" and "she"
    // are the two words this screen is allowed.
    expect(text, 'the sentence the wave exists for').toMatch(/support does not pay|not covered/i)
    expect(text, 'and it says what he does pay').toMatch(/full fare/i)
    // (b) IT NO LONGER QUOTES THE MULTIPLE, which is the half that was WRONG rather than missing.
    expect(text, 'a bare multiple is false for a covered family').not.toMatch(/twice the fare/i)
    // (c) AND BOTH FIGURES ARE THE ENGINE'S, interpolated - hers and his, over the trips he is on.
    expect(text).toContain(formatCents(b.travelHerFareCents))
    expect(text).toContain(formatCents(b.travelFareCents))
    expect(text).toMatch(new RegExp(`${b.travelTrips} trips`))
    expect(text, 'short-dash English').not.toMatch(/—/)
    w.unmount()
  })

  it('...and the family with no scholarship reads the OLD sentence, so the two really differ', async () => {
    // ⚠ THE ARM THAT MAKES THE ONE ABOVE MEAN SOMETHING. Same seed, same season, same coach - the
    // scholarship is the only difference, and it has to be the only difference, or "the copy branches
    // on the cover" would be a claim about two unrelated careers.
    setActivePinia(createPinia())
    const plain = bookedSeason('row-covered', { scholarship: false })
    expect(plain.coachBilling.travelCovered, 'the control holds no cover').toBe(false)
    expect(plain.coachBilling.travelHerFareCents, 'so her seat costs what his does').toBe(
      plain.coachBilling.travelFareCents,
    )
    const plainText = travelRow(await mountMarket(plain)).sub.text()

    setActivePinia(createPinia())
    const covered = bookedSeason('row-covered', { scholarship: true })
    const coveredText = travelRow(await mountMarket(covered)).sub.text()

    expect(plainText, 'nothing moved for a family paying full price').toMatch(/twice the fare/i)
    expect(coveredText, 'and everything moved for the one that is supported').not.toBe(plainText)
  })

  // ===============================================================================================
  // ⭐⭐ v49 – THE NESTED OPTION, AND THE WARNING IN FRONT OF IT
  //
  // Owner, 15.08: «делаем тогда», and «По мне игрок сам решает: есть деньги - едет тренер, нет - не
  // едет, или едет, но быстрее банкротится.» So: no gate on the outcome, a warning before the first
  // fare, and a control that is honest about being a second decision inside the first one.
  // ===============================================================================================
  it('⭐ IS NOT THERE UNTIL THE FIRST SWITCH IS ON - it buys nothing on its own', async () => {
    // The fare reads BOTH stances, so with travel off this option sends nobody anywhere. A row that
    // looked live in that state would be the control lying about itself, which is round-20 #1 exactly.
    const off = await mountMarket(bookedSeason('junior-hidden', { scholarship: false, juniors: false, travels: false }))
    expect(off.find('.cm-travel-nested').exists(), 'nothing to nest under').toBe(false)
    off.unmount()

    setActivePinia(createPinia())
    const on = await mountMarket(bookedSeason('junior-hidden', { scholarship: false }))
    const nested = on.find('.cm-travel-nested')
    expect(nested.exists(), 'and it appears with the switch above it on').toBe(true)
    expect(nested.find('.cm-switch').attributes('aria-checked'), 'it reports the ENGINE stance').toBe('true')
    on.unmount()
  })

  it('⭐ PRICES ITSELF over the trips it would actually buy', async () => {
    const snap = bookedSeason('junior-price', { scholarship: false })
    const b = snap.coachBilling
    expect(b.travelJuniorTrips, 'the fixture has junior trips on the card').toBeGreaterThan(0)
    const w = await mountMarket(snap)
    const text = w.find('.cm-travel-nested .cm-travel-sub').text()
    expect(text, 'it says WHY the rung is the expensive one').toMatch(/no prize money/i)
    expect(text).toContain(formatCents(b.travelJuniorCents))
    expect(text).toMatch(new RegExp(`${b.travelJuniorTrips} more trips`))
    expect(text, 'short-dash English').not.toMatch(/—/)
    w.unmount()
  })

  it('⭐⭐ WARNS BEFORE THE FIRST FARE, WITH THE MEASURED NUMBERS, AND THEN DOES AS IT IS TOLD', async () => {
    // ⚠ THE SHAPE OF THIS IS THE RULING. The bench measured what an unlimited junior fare does
    // (docs/specs/coach-travel-2026-08.md, 30 seeds a cell: 8/30 wealthy·elite and 15/30
    // middle·middle careers bankrupt, EVERY one of them in the junior years, "ever ranked" 96.7% ->
    // 46.7%). The owner has ruled that outcome is the player's own - so this is a WARNING and not a
    // gate: the press opens a question, the question names the risk, and confirming sends the coach.
    const store = useGameStore()
    const spy = vi.spyOn(store, 'setCoachOnJuniorEvents').mockResolvedValue(undefined)
    // ⚠ THE SNAPSHOT IS THE STATE THE DECISION IS TAKEN FROM: travel ON, juniors OFF. It is set in the
    // ENGINE rather than by pressing the row above, because that press is a command to a worker this
    // runner does not have - and a mocked press would leave the screen reading its old snapshot.
    const w = await mountMarket(bookedSeason('junior-warn', { scholarship: false, juniors: false }))
    const nestedSwitch = w.find('.cm-travel-nested .cm-switch')
    expect(nestedSwitch.exists()).toBe(true)
    await nestedSwitch.trigger('click')
    await nextTick()

    // (a) NOTHING IS SENT YET. The press asks; it does not spend.
    expect(spy, 'the press alone must not open the fare').not.toHaveBeenCalled()
    const card = w.find('.dialog-overlay .dialog-card')
    expect(card.exists(), 'the question is up').toBe(true)
    const message = card.find('.dialog-message').text()
    // (b) IT NAMES THE RISK IN THE PLAYER'S OWN TERMS - what the bill is for, and what it did.
    expect(message, 'the rungs pay nothing').toMatch(/no prize money/i)
    expect(message, 'the measured bankruptcies').toMatch(/8 of 30/)
    expect(message, '...both cells of them').toMatch(/15 of 30/)
    expect(message, 'and when it happened').toMatch(/before she turned twenty/i)
    expect(message, 'no Cyrillic leaks out of the comments into the copy').not.toMatch(/[Ѐ-ӿ]/)
    expect(message, 'short-dash English').not.toMatch(/—/)
    // (c) AND IT IS A CHOICE, NOT A BLOCK: the way out is a real button, and so is the way through.
    const buttons = card.findAll('.dialog-actions button').map((b) => b.text())
    expect(buttons.length, 'two answers').toBe(2)
    expect(buttons.join(' '), 'and neither of them refuses on the engine\'s behalf').toMatch(/Not yet/i)

    // (d) CONFIRMING SENDS HIM.
    const confirm = card.findAll('.dialog-actions button').find((b) => /send/i.test(b.text()))!
    await confirm.trigger('click')
    await nextTick()
    expect(spy, 'the owner\'s own ruling: his money, his call').toHaveBeenCalledWith(true)
    expect(w.find('.dialog-overlay').exists(), 'and the question closes behind it').toBe(false)
    w.unmount()
  })

  it('...and turning it back OFF asks nothing - stopping a bill needs no ceremony', async () => {
    const store = useGameStore()
    const spy = vi.spyOn(store, 'setCoachOnJuniorEvents').mockResolvedValue(undefined)
    const w = await mountMarket(bookedSeason('junior-stop', { scholarship: false }))
    await w.find('.cm-travel-nested .cm-switch').trigger('click')
    await nextTick()
    expect(w.find('.dialog-overlay').exists(), 'no warning is owed for spending less').toBe(false)
    expect(spy).toHaveBeenCalledWith(false)
    w.unmount()
  })

  it('cancelling leaves the stance exactly where it was', async () => {
    const store = useGameStore()
    const spy = vi.spyOn(store, 'setCoachOnJuniorEvents').mockResolvedValue(undefined)
    const w = await mountMarket(bookedSeason('junior-cancel', { scholarship: false, juniors: false }))
    await w.find('.cm-travel-nested .cm-switch').trigger('click')
    await nextTick()
    const cancel = w.findAll('.dialog-actions button').find((b) => /not yet/i.test(b.text()))!
    await cancel.trigger('click')
    await nextTick()
    expect(spy, 'a question answered "no" is not a command').not.toHaveBeenCalled()
    expect(w.find('.dialog-overlay').exists()).toBe(false)
    w.unmount()
  })

  it('a self-coached family is told there is nobody to send, and the control still works', async () => {
    // ⚠ THE ONE HONEST REFUSAL LEFT, and it is a FACT rather than a gate. The app has a standing rule
    // against a control that cannot be pressed and does not say why; this row now answers it by
    // working - the stance persists and takes effect the moment she hires somebody.
    const world = career('row-self', false, 'self')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 6; i++) tickWeek(world, rng)
    const snap = toSnapshot(world)
    expect(snap.coachId, 'the fixture really is self-coached').toBeNull()
    const w = await mountMarket(snap)
    const { sub, toggle } = travelRow(w)
    expect(sub.text()).toMatch(/nobody to send/i)
    expect(toggle.attributes('disabled')).toBeUndefined()
    w.unmount()
  })
})

// =================================================================================================
// 2. THE TOURNAMENT FLOW – «присутствие в потоке»
// =================================================================================================

describe('§2 the tournament flow says he came', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ THE LINE IS ON THE SPLASH when he travelled, and nowhere when he did not', async () => {
    assertSheetPresent()
    const store = useGameStore()
    store.snapshot = atTournament('flow-on', true)
    const on = mount(TournamentFlow, { attachTo: document.body })
    const line = on.find('.tf-brief-here')
    expect(line.exists(), 'the screen says he is there').toBe(true)
    expect(line.text().length, 'and it says something, not a marker').toBeGreaterThan(20)
    expect(line.text(), 'it names the price of the trip he is on').toMatch(/fare/i)
    on.unmount()

    setActivePinia(createPinia())
    useGameStore().snapshot = atTournament('flow-on', false)
    const off = mount(TournamentFlow, { attachTo: document.body })
    expect(off.find('.tf-brief-here').exists(), 'a trip nobody was flown to says nothing').toBe(false)
    off.unmount()
  })

  it('...and it hands the same answer to the running commentary, so the two cannot disagree', async () => {
    // The flow's line and the log's beat read ONE engine answer. Mutation-verified: drop
    // `:coach-travelled` from the MatchViewer binding and this goes red while the line above stays
    // green - which is exactly the split the owner would see as "it says he came and never mentions
    // him again".
    assertSheetPresent()
    useGameStore().snapshot = atTournament('flow-wire', true)
    const w = mount(TournamentFlow, { attachTo: document.body })
    const press = async (label: string) => {
      const btn = w.findAll('button').find((b) => b.text().trim() === label)
      expect(btn, `no button labelled ${label}`).toBeTruthy()
      await btn!.trigger('click')
      await nextTick()
    }
    await press('Begin')
    await press('Watch match')
    // The prop reaches the viewer, which is what the running commentary reads.
    const mv = w.findComponent({ name: 'MatchViewer' })
    expect(mv.exists(), 'the viewer is on screen').toBe(true)
    expect(mv.props('coachTravelled')).toBe(true)
    w.unmount()
  })
})

// =================================================================================================
// 3. ⚠ DOES THE CARD STILL FIT A PHONE (CLAUDE.md's gotcha, earned by round-20 #3)
// =================================================================================================

describe('§3 the card I lengthened, measured against a 375x667 phone', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ THE BRIEF CARD STILL FITS THE SCREEN, AND ITS CONTROL WITH IT', () => {
    // ⚠ WHY THIS IS THE MEASUREMENT AND NOT `assertDismissReachable`. That helper is written for a
    // BLOCKING `.dialog-overlay`, where the fix is a `max-height` plus a scroll. The tournament flow
    // is a takeover: `.tournament-flow` is `position: fixed; inset: 0` and `.tf-body` is
    // `flex: 1; overflow-y: auto`, so it is a real scrollport and the splash is ALLOWED to be taller
    // than the phone - it scrolls. What is NOT allowed is for the card carrying the control to grow
    // taller than the screen itself, because then no scroll position exists that shows the card and
    // its Begin pill together. That is the property one honest sentence at a time can break, and it
    // is what this measures.
    //
    // ⚠ MUTATION-VERIFIED: replace the presence line's copy with a four-sentence paragraph and this
    // goes red; the `.tf-brief-here` assertions in §2 stay green, which is the point - they measure
    // what the card SAYS and this measures what the screen can HOLD.
    assertSheetPresent()
    setViewport(PHONE)
    useGameStore().snapshot = atTournament('flow-fits', true)
    const w = mount(TournamentFlow, { attachTo: document.body })

    const flow = document.querySelector('.tournament-flow')
    expect(flow, 'the takeover is on the document').toBeTruthy()
    expect(getComputedStyle(flow!).position, 'the takeover owns the whole screen').toBe('fixed')

    const body = document.querySelector('.tf-body') as HTMLElement
    expect(body, 'the scrollport exists').toBeTruthy()
    const bodyStyle = getComputedStyle(body)
    // (a) THE CONTENT-INDEPENDENT HALF: anything past the fold can be reached at all.
    expect(bodyStyle.overflowY, 'the takeover scrolls, so the splash may be taller than the phone').toBe('auto')

    // (b) THE CARD ITSELF, with the presence line on it, inside the screen.
    const card = w.find('.tf-brief').element
    const pill = w.findAll('button').find((b) => b.text().trim() === 'Begin')!.element
    expect(w.find('.tf-brief-here').exists(), 'the line under test is actually rendered').toBe(true)

    const padX = parseFloat(bodyStyle.paddingLeft || '0') + parseFloat(bodyStyle.paddingRight || '0')
    const maxW = parseFloat(bodyStyle.maxWidth || '0') || PHONE.width
    const contentWidth = Math.min(PHONE.width, maxW) - padX
    const cardBox = boxOf(card, contentWidth)
    const pillBox = boxOf(pill, contentWidth)
    const room = PHONE.height - parseFloat(bodyStyle.paddingTop || '0') - parseFloat(bodyStyle.paddingBottom || '0')

    expect(
      cardBox.h,
      `the brief card is ${cardBox.h.toFixed(0)}px against ${room.toFixed(0)}px of phone – ` +
        'taller than the screen and no scroll position shows the card and its Begin control together',
    ).toBeLessThanOrEqual(room)
    expect(pillBox.h, 'the control is a real box inside that card').toBeGreaterThan(0)
    expect(card.contains(pill), 'Begin is inside the card being measured').toBe(true)

    // ⚠⚠ (c) AND THE GUARD AT THE GRANULARITY THE FAILURE ACTUALLY HAPPENS AT. (b) above is the
    // catastrophe check and it takes an absurd card to trip - measured here at 375x667 the brief is
    // ~200px against ~630px of room, so it would swallow twenty sentences before it complained.
    // Round-20 #4's finding is that this is exactly how the bug gets in: "a dialog grows by one
    // honest sentence at a time and nothing objects until it is taller than a phone". So the LINE
    // itself carries a line budget.
    //
    // Measured at the card's FULL content width, which is a floor: the real text column is narrower
    // (it shares the row with the condition ring), so the shipped line count is at least this. Today
    // the sentence measures 2 lines here; the budget is 3, so ONE more sentence of the same length
    // turns this red - which is the property, and it is what the four-sentence mutation proves.
    const here = w.find('.tf-brief-here').element
    const hcs = getComputedStyle(here)
    const hFont = parseFloat(hcs.fontSize)
    const hLine = hcs.lineHeight.endsWith('px') ? parseFloat(hcs.lineHeight) : hFont * (parseFloat(hcs.lineHeight) || 1.2)
    const hereLines = boxOf(here, contentWidth).h / hLine
    expect(
      hereLines,
      `the presence line wraps to ${hereLines.toFixed(1)} lines at ${contentWidth.toFixed(0)}px – ` +
        'it is one line under a signature, not a paragraph, and the card it sits on is the splash of a phone screen',
    ).toBeLessThanOrEqual(3)
    w.unmount()
  })

  // -----------------------------------------------------------------------------------------------
  // ⭐⭐ v49 – AND THE NEW WARNING IS A BLOCKING DIALOG, SO IT OWES THE SAME MEASUREMENT
  //
  // CLAUDE.md's rule, earned by round-20 #3: "any dialog you add or lengthen gets a mounted assertion
  // that its dismiss control's box is inside a 375x667 viewport". This one is FOUR SENTENCES of
  // measured bankruptcy on the shared `dialog-card` - exactly the shape that grew until Continue left
  // the screen and the owner's career stopped there.
  // -----------------------------------------------------------------------------------------------
  it('⭐⭐ THE JUNIOR-TRAVEL WARNING KEEPS ITS ANSWERS ON A 375x667 PHONE', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const w = await mountMarket(bookedSeason('junior-fits', { scholarship: false, juniors: false }), { attach: true })
    await w.find('.cm-travel-nested .cm-switch').trigger('click')
    await nextTick()

    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the warning is up – nothing below is vacuous').toBeTruthy()
    expect(dismiss.querySelectorAll('button').length, 'the answers ARE the way out').toBe(2)

    const fit = assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (junior travel)')
    expect(fit.available.height, 'the room the scrim leaves on a 667px phone').toBe(635)
    expect(fit.cap, 'the card is BOUNDED, which is the content-independent half').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)

    // ⚠⚠ MUTATION PROOF, in the same shape round21-dialogs.test.ts uses. Today's copy is comfortably
    // inside the screen, so a green run above proves only that the cascade exists. Put round-20 #3
    // back on THIS card - the cap stripped, the way `TourBriefingDialog` shipped - and grow the
    // message the way a dialog really grows, one honest sentence at a time, and the same helper has
    // to report it.
    const message = document.querySelector('.dialog-message') as HTMLElement
    message.textContent = `${message.textContent} `.repeat(8)
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})

// =================================================================================================
// 4. THE WEEK'S STORY
// =================================================================================================

describe('§4 the week\'s story keeps the second fare', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ THE SCRAP CARRIES HIM ON THE TRIP HE CAME ON, and the week\'s own story is not displaced', () => {
    assertSheetPresent()
    const snap = atJourneyHome('story-ui', true)
    expect(snap.diary.travelNote, 'the week has its own story').toBeTruthy()
    useGameStore().snapshot = snap
    const w = mount(WeekRecapCard, { attachTo: document.body })
    const lines = w.findAll('.recap-note-text').map((p) => p.text())
    expect(lines.length, 'two hands on one scrap: the week, then who was there').toBe(2)
    expect(lines[0], 'the week\'s own note is still the first thing on the paper').toBe(snap.diary.travelNote)
    expect(lines[1]).toBe(snap.diary.coachNote)
    expect(w.find('.recap-note-coach').exists()).toBe(true)
    w.unmount()
  })

  it('...and says nothing on the same trip with him left at home', () => {
    assertSheetPresent()
    const snap = atJourneyHome('story-ui', false)
    expect(snap.diary.travelNote).toBeTruthy()
    useGameStore().snapshot = snap
    const w = mount(WeekRecapCard, { attachTo: document.body })
    expect(w.findAll('.recap-note-text')).toHaveLength(1)
    expect(w.find('.recap-note-coach').exists()).toBe(false)
    w.unmount()
  })
})
