// =================================================================================================
// ⭐⭐⭐ ROUND 42 #46 – WHAT EVERY TRAVELLING SPECIALIST BUYS, ON THE SEAT'S OWN CARD. MOUNTED.
// =================================================================================================
//
// THE OWNER, 15.09: «можно как-то показывать игроку преимущества всех ездящих специалистов, что он
// получает. С главным тренером понятно, а вот с остальными двумя не очень.» The travel switch is a
// real price – a second fare on every event week – and the game stated what it bought for exactly one
// seat, the coach's. The item stood at `[ ]` in round 42's ledger from 15.09 and was carried into
// this wave by his 17.09 ruling: «чини, я был уверен, что уже это всё готово».
//
// ⚠ THE COPY IS HIS, NOT THIS ROUND'S. Round 42 recorded the drafts and his read of them on 16.09:
//   * 46-a / 46-b, the masseur's two states – «слова массажиста ок», approved as drafted;
//   * 46-c (v2), the psychologist's – a RE-DRAFT after he corrected the first one on a fact
//     («психолог не ездит, но онлайн созвоны вполне может делать»), and the one string here he has
//     not yet met in play.
// Nothing was re-worded to fit the card (invariant 4). The two assertions that look like copy pins
// below are there so a вычитка has to be deliberate, not so that this file owns the words.
//
// ⚠⚠ AND THE HITTING PARTNER GETS NOTHING, WHICH IS A DECISION AND IS ASSERTED AS ONE. His own travel
// sub-line already says which half the fare buys, in the owner's own 17.09 words («Home practice is
// already covered; this extends the arrangement to travel weeks»), so a fourth sentence would be a
// draft he never asked for standing beside an approved one he did. §3 is that negative.
//
// ⚠ MUTATION ARMS – each applied alone against the real component, watched red, reverted. Counts
// READ OFF THE RUNS and recorded in the round's handoff, not predicted.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  hireMasseur,
  hirePsychologist,
  hireSparring,
  setMasseurTravels,
  toSnapshot,
} from '../../src/engine/world'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { boxOf, setViewport, DESKTOP, PHONE } from './fits'

/** A professional career – the one-way door all three seats gate on (`activeLadderOf === 'wta'`),
 *  the same handle the other staff-card files put a fixture on the professional table with. */
function pro(seed: string) {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  return world
}

async function mountCard(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  // ⚠ IT MOUNTS THE SCREEN AND PRESSES THE TAB, the two staff-card files' own rule: «can he get to
  // it» IS the defect that made this tab exist, and a test that mounted the tab component directly
  // would be green on the shape that shipped the bug.
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Support staff')
  expect(pill, 'the Support staff tab is on the screen at all').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

const fareOf = (w: Awaited<ReturnType<typeof mountCard>>, seat: string) =>
  w.find(`[data-staff="${seat}"] .staff-fare`)

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

describe('round 42 #46 – the masseur`s card says what his fare buys, in both states', () => {
  it('⭐⭐⭐ §1a – TRAVELLING: the shape of the benefit, and it is his approved sentence', async () => {
    const world = pro('r42-46-travel')
    hireMasseur(world, true)
    setMasseurTravels(world, true)
    const snap = toSnapshot(world)
    expect(snap.masseurTravels, 'the fixture really has him on the road').toBe(true)

    const wrapper = await mountCard(snap)
    const fare = fareOf(wrapper, 'masseur')
    expect(fare.exists(), 'the travelling seat says nothing about what the fare buys').toBe(true)
    expect(fare.text()).toBe(
      'Travels with her: table work between rounds. The deeper the run, the more it buys – a first-round exit buys nothing.',
    )
    wrapper.unmount()
  })

  it('⭐⭐⭐ §1b – STAYING HOME: the other state, and the two are really different sentences', async () => {
    const world = pro('r42-46-home')
    hireMasseur(world, true)
    const snap = toSnapshot(world)
    expect(snap.masseurTravels, 'the default seat stays home').toBe(false)

    const wrapper = await mountCard(snap)
    const fare = fareOf(wrapper, 'masseur')
    expect(fare.exists()).toBe(true)
    expect(fare.text()).toBe('Stays home on tournament weeks. One fare saved on every trip.')
    // ⚠ 46-b STANDS BESIDE HIS EXISTING FEED SENTENCE, never instead of it – round 42 #46's own note:
    // «The masseur stays home on tournament weeks – the table waits for her return» is a one-off
    // event row, and this is the standing line on the card. Asserted as a NEGATIVE on the card so the
    // two can never be confused for one string.
    expect(fare.text(), 'the feed row was not moved onto the card').not.toContain('waits for her return')
    wrapper.unmount()
  })

  it('⭐⭐ §1c – the sentence follows the SWITCH, which is what makes it a price the player can read', async () => {
    // The state is the SNAPSHOT's, so the card cannot be quoting one of the two by accident: one
    // world, two wires, two sentences.
    const world = pro('r42-46-follows')
    hireMasseur(world, true)
    const home = await mountCard(toSnapshot(world))
    const homeText = fareOf(home, 'masseur').text()
    home.unmount()

    setMasseurTravels(world, true)
    const away = await mountCard(toSnapshot(world))
    const awayText = fareOf(away, 'masseur').text()
    away.unmount()

    expect(homeText, 'the switch moved and the sentence did not').not.toBe(awayText)
    expect(awayText).toContain('first-round exit buys nothing')
  })

  it('⚠ §1d – NO NUMBER IN IT, by round 42 #46`s own rule', async () => {
    // «Deliberately NOT a number on screen: `tourRecoveryPerRound` is a tuning constant and printing
    // it would pin copy to a dial. The sentence says the SHAPE, which stays true when the constant
    // moves.» ⚠ THE PRICE IS STILL ON THE CARD – it is on the travel sub-line and the headline, which
    // are figures rather than claims; what must carry no figure is the sentence about the BENEFIT.
    const world = pro('r42-46-digits')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    for (const travels of [false, true]) {
      setMasseurTravels(world, travels)
      const wrapper = await mountCard(toSnapshot(world))
      for (const seat of ['masseur', 'psychologist']) {
        const text = fareOf(wrapper, seat).text()
        expect(text, `${seat} (travels=${travels}): a tuning constant reached the copy`).not.toMatch(/\d/)
        expect(text, 'house law: the short dash only').not.toMatch(/—/)
        expect(text, 'house law: no Cyrillic in player copy').not.toMatch(/[Ѐ-ӿ]/)
      }
      wrapper.unmount()
    }
  })
})

describe('round 42 #46 – the seat with no switch is the one with the most to say', () => {
  it('⭐⭐⭐ §2 – the psychologist pays NO fare, and the card says so instead of leaving a hole', async () => {
    // ⭐ THE RE-DRAFT IS THE GOOD KIND OF CORRECTION. The first version said the sessions are weekly
    // work at home rather than tournament-side; his answer was «психолог не ездит, но онлайн созвоны
    // вполне может делать», and the engine agrees with him in its own comment. So this is a POSITIVE
    // thing to say rather than an absence to explain – without it a third seat on the payroll quietly
    // reads as a third fare the player might be missing, which is the exact half of #46 he could not
    // tell.
    const world = pro('r42-46-psy')
    hirePsychologist(world, true)
    const wrapper = await mountCard(toSnapshot(world))

    const seat = wrapper.find('[data-staff="psychologist"]')
    expect(seat.find('.cm-travel').exists(), 'ruling B: he has no travel switch at all').toBe(false)
    expect(fareOf(wrapper, 'psychologist').text()).toBe(
      'No fare to pay: the sessions follow her as calls – at home, on the road, and through a layoff.',
    )
    wrapper.unmount()
  })
})

describe('round 42 #46 – what the fix deliberately did NOT add', () => {
  it('⭐⭐ §3 – the hitting partner carries no fare line, because his own approved line already says it', async () => {
    // Round 42 #46 names four seats; the hitting partner's half was measured by #48 and answered in
    // his own 17.09 words on the travel sub-line. A second sentence here would be a draft he never
    // asked for beside an approved one he did, which is what invariant 4 is about. ⚠ AND THE CLAIM IS
    // CHECKED IN BOTH DIRECTIONS – no fare line, AND the thing that stands in for one is really on
    // the card – so «he says nothing» could not pass as «he needs nothing».
    const world = pro('r42-46-sparring')
    hireSparring(world, true)
    const wrapper = await mountCard(toSnapshot(world))

    const seat = wrapper.find('[data-staff="sparring"]')
    expect(seat.exists(), 'his card is on the tab at all').toBe(true)
    expect(fareOf(wrapper, 'sparring').exists(), 'a fourth sentence was invented for him').toBe(false)
    expect(seat.find('.cm-travel-sub').text(), 'his own line still answers the fare question').toContain(
      'Home practice is already covered',
    )
    wrapper.unmount()
  })

  it('⭐⭐ §4 – nothing is said before the hire: the sentence is about somebody on the payroll', async () => {
    // The same predicate the dial, the year's work and the travel switch all use. Before the hire the
    // card's own line is the pitch, and a fare sentence there would describe a price nobody is paying.
    const wrapper = await mountCard(toSnapshot(pro('r42-46-unhired')))
    for (const seat of ['masseur', 'psychologist', 'sparring']) {
      expect(wrapper.find(`[data-staff="${seat}"]`).exists(), `${seat}: the card is on the tab`).toBe(true)
      expect(fareOf(wrapper, seat).exists(), `${seat}: an unhired seat quoted a fare`).toBe(false)
    }
    wrapper.unmount()
  })
})

describe('round 42 #46 – the added sentence has a box on the shortest screen the app supports', () => {
  it('⭐ §5 – both seats` lines render a real box at 375x667', async () => {
    // ⚠ HIS STANDING RULE OF 14.09 – the visual pass is a deliverable. This is a card in a page and
    // not a blocking overlay, so the round-20 dialog law does not apply; what CAN go wrong is a
    // sentence that renders to nothing, which is exactly what a `v-if` on the wrong field looks like
    // from the outside. `boxOf` reads the real cascade, which is why the mount is attached.
    setViewport(PHONE)
    const world = pro('r42-46-fit')
    hireMasseur(world, true)
    hirePsychologist(world, true)
    setMasseurTravels(world, true)
    const wrapper = await mountCard(toSnapshot(world), true)
    for (const seat of ['masseur', 'psychologist']) {
      const el = fareOf(wrapper, seat).element
      expect(boxOf(el, PHONE.width - 32).h, `${seat}: the sentence has no rendered box`).toBeGreaterThan(0)
    }
    wrapper.unmount()
    document.body.innerHTML = ''
    setViewport(DESKTOP)
  })
})
