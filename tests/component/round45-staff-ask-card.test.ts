// ROUND 45 #3, THE CARD TELLS THE TRUTH – the psychologist's and the hitting partner's dials quote what
// the ENGINE says each rung costs this career, not the catalogue's opening price.
//
// Why this file exists: both seats now ask for a yearly raise, and an accepted raise drifts all three rungs
// of the seat's dial. The card used to print `ECONOMY.<seat>.rungs[n].<price>` for every rung – flat, and
// after the first yes a lie next to the ledger's row (the engine-UI parity class, round 29). The snapshot
// carries the per-rung prices now (`psychologistRungSalaryCents`, `sparringRungSalaryCents`) and the card
// reads them. The engine halves are tests/round45-staff-ask-seats.test.ts.
//
// ⚠ TWO ARMS, BECAUSE ONE CAN BE SATISFIED BY THE WRONG CODE: an ENGINE-BUILT snapshot after a real accepted
// raise (the card shows what the engine derived) and a DOCTORED one carrying prices no formula produces (the
// card shows exactly what it is handed – it neither reads the catalogue nor re-derives the drift).
//
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4, «R45 – DRAFT strings» in docs/rounds/round-45.md): the letter
// assertions are about the unit word and the figures, never a whole sentence.
//
// ⚠ MUTATION-VERIFIED – M6 the engine's per-rung prices are the flat catalogue again; M7 the psychologist's
// dial prints `r.salaryCents` and M7b the partner's prints `r.weeklyCents` (the card back on the constant);
// M8 the letter's unit is the constant «session»; M9 `staffAskUnit` answers «session» for every seat.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { useGameStore } from '../../src/stores/game'
import { acceptOffer, createWorld, hirePsychologist, hireSparring, toSnapshot } from '../../src/engine/world'
import { resolvePsychologistRaise } from '../../src/engine/world/psychologist'
import { resolveSparringRaise } from '../../src/engine/world/sparring'
import { raiseStaffAsk, staffAsks } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Offer, type OfferState, type Snapshot } from '../../src/shared/protocol'

const PSY = '[data-staff="psychologist"]'
const SPA = '[data-staff="sparring"]'

const OPENING_PSY = ECONOMY.psychologist.rungs.map((r) => r.salaryCents)
const OPENING_SPA = ECONOMY.sparring.rungs.map((r) => r.weeklyCents)

/** A professional career with BOTH seats hired and each one's first yearly request SIGNED – through the
 *  engine's own raisers and `acceptOffer`, so the prices on the snapshot are the ones a career really bills. */
function raisedSnapshot(): Snapshot {
  const world = createWorld('r45-card-raised', DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  world.fundsCents = 1_000_000_00
  world.week = 100
  hirePsychologist(world, true)
  hireSparring(world, true)
  world.week = 100 + WEEKS_PER_YEAR
  resolvePsychologistRaise(world)
  resolveSparringRaise(world)
  for (const seat of ['psychologist', 'sparring'] as const) {
    const asks = staffAsks(world.offers, seat)
    expect(asks, `${seat} wrote its request`).toHaveLength(1)
    acceptOffer(world, asks[0].id)
  }
  return toSnapshot(world)
}

async function mountCard(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Support staff')
  expect(pill, 'the Support staff tab is on the screen at all').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

const dialPrices = (wrapper: Awaited<ReturnType<typeof mountCard>>, seat: string): string[] =>
  wrapper.findAll(`${seat} .staff-rung .rung-price`).map((n) => n.text())

describe('round 45 #3 – the dial quotes the SNAPSHOT`s per-rung prices', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ after a granted raise the dial shows the engine`s drifted prices, not the catalogue`s opening ones', async () => {
    const snap = raisedSnapshot()
    // The premise, so a green here means something: the raise really moved every rung.
    expect(snap.psychologistRungSalaryCents).not.toEqual(OPENING_PSY)
    expect(snap.sparringRungSalaryCents).not.toEqual(OPENING_SPA)
    const wrapper = await mountCard(snap)
    expect(dialPrices(wrapper, PSY)).toEqual(snap.psychologistRungSalaryCents.map((c) => `${formatCents(c)}/wk`))
    expect(dialPrices(wrapper, SPA)).toEqual(snap.sparringRungSalaryCents.map((c) => `${formatCents(c)}/wk`))
    // ...and the figures themselves, spelled out (4% on 100/200/400 and 500/900/1,400):
    expect(dialPrices(wrapper, PSY)).toEqual(['$104/wk', '$208/wk', '$416/wk'])
    expect(dialPrices(wrapper, SPA)).toEqual(['$520/wk', '$936/wk', '$1,456/wk'])
    wrapper.unmount()
  })

  it('⭐⭐ a DOCTORED snapshot moves the dial – the card prints what it is handed, it neither reads the catalogue nor re-derives the drift', async () => {
    const doctored: Snapshot = {
      ...raisedSnapshot(),
      psychologistRungSalaryCents: [111_00, 222_00, 333_00],
      sparringRungSalaryCents: [444_00, 555_00, 666_00],
    }
    const wrapper = await mountCard(doctored)
    expect(dialPrices(wrapper, PSY)).toEqual(['$111/wk', '$222/wk', '$333/wk'])
    expect(dialPrices(wrapper, SPA)).toEqual(['$444/wk', '$555/wk', '$666/wk'])
    wrapper.unmount()
  })

  it('a career with no signed request still quotes the catalogue (the card of every existing save is unchanged)', async () => {
    const world = createWorld('r45-card-fresh', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const wrapper = await mountCard(toSnapshot(world))
    expect(dialPrices(wrapper, PSY)).toEqual(OPENING_PSY.map((c) => `${formatCents(c)}/wk`))
    expect(dialPrices(wrapper, SPA)).toEqual(OPENING_SPA.map((c) => `${formatCents(c)}/wk`))
    wrapper.unmount()
  })
})

describe('round 45 #3 – the request sheet of the two weekly seats quotes a WEEK', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  const WRAP = 257
  const letter = (seat: 'masseur' | 'psychologist' | 'sparring', state: OfferState = 'open'): Offer => {
    const offer = raiseStaffAsk([], WRAP, 1, {
      seat,
      seasonIndex: 4,
      weeksServed: 52,
      ask: { fromCents: 200_00, toCents: 208_00 },
    })
    offer.state = state
    return offer
  }
  const sheet = (offer: Offer) => mount(OfferLetter, { props: { offer, week: WRAP + 1 }, attachTo: document.body })

  it.each([
    ['psychologist', 'week'],
    ['sparring', 'week'],
    ['masseur', 'session'],
  ] as const)('⭐⭐ the %s`s request names the figures and says «a %s», on the open sheet and on every settled foot', (seat, unit) => {
    const open = sheet(letter(seat))
    expect(open.text()).toMatch(new RegExp(`\\$200 to \\$208 a ${unit}\\.`))
    expect(open.findAll('button'), 'both doors on a live request').toHaveLength(2)
    open.unmount()
    const arms: Array<[OfferState, RegExp]> = [
      ['signed', new RegExp(`\\$208 a ${unit}\\.`)],
      ['refused', new RegExp(`\\$200 a ${unit}\\.`)],
      ['expired', new RegExp(`\\$200 a ${unit}\\.`)],
    ]
    for (const [state, foot] of arms) {
      const w = sheet(letter(seat, state))
      expect(w.find('.offer-window.settled').text(), `${seat} ${state}`).toMatch(foot)
      expect(w.findAll('button'), `${state}: no doors on a settled paper`).toHaveLength(0)
      w.unmount()
    }
  })
})
