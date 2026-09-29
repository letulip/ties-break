// ⭐⭐ T4.2 · E-07 – THE RENDERED HALF: THE SHEET'S LIST AND THE LETTER'S BUTTONS, ON THE LAST WEEK.
//
// The finding (docs/review-principles-2026-09-26/05-ui.md, E-07) counted four copies of
// `isOfferLive`; `tests/principles-e07-offer-live.test.ts` owns the two that are plain functions.
// This file owns the two that are SURFACES, because a `computed` in a `<script setup>` block feeding
// a `v-if` is not something a unit case can see – and the spec is explicit that the third arm is
// owed where the surface is a template (docs/specs/engine-ui-parity-2026-09.md §2).
//
// ⚠⚠ THE FIXTURE IS THE BOUNDARY WEEK, AND NOTHING ELSE SEPARATES THE TWO SPELLINGS. `isOfferLive`
// is `state === 'open' && week <= deadlineWeek`; the copies were the same conjunction, so every
// other week of a letter's life agrees under either rule. `week === deadlineWeek` – her LAST week to
// answer – is the one input a `<` drift moves, and it is the input a real career reaches on every
// letter it lets run.
//
// ⚠ WHAT IS ASSERTED IS THE THREE THINGS THE SHEET'S COPY DROVE and the one the letter's did:
//   the sheet   the «Needs an answer» pill, the absence of «Nothing waiting on an answer.», and the
//               row's «1 week to decide» tail – three readers of ONE local `live()`
//   the letter   `.offer-actions`, i.e. Sign and Refuse, on both letter kinds' feet
// No string here is new: every one of them is quoted out of the shipped template, and this file's job
// is which STATE they appear in.
//
// ⚠⚠ MUTATION ARMS – the report quotes all three outputs:
//   arm A  the shared SOURCE (`isOfferLive`'s `<=` → `<`): BOTH surfaces red together, with the
//          engine's own suites. On the pre-fix tree the identical break leaves both surfaces GREEN,
//          which is the finding reproduced.
//   arm B  the SHARING (restore `OfferLetter`'s own body): this file red ALONE, while the letter's own
//          suites stay green – the asymmetry that earns the file its place.
//   arm C  the TEMPLATE (spell the conjunction inside `OfferLetter`'s `v-if`): the mount red alone.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { acceptOffer, createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { isOfferLive, raiseKitOffers } from '../../src/engine/offers'
import { DEFAULT_PROFILE, type Offer } from '../../src/shared/protocol'
import type { SponsorStanding } from '../../src/engine/offers'
import { mountInbox } from './inbox'

// The inbox annotates letters with two per-device facts (read / binned) and both live in
// localStorage; this runner has none. Same shim, and the same argument, as the other mail suites.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** The week the sponsor window writes in – `tests/offers.test.ts`' own number. */
const LETTER_WEEK = 49

/** A standing the local rungs clear – `tests/offers.test.ts`' `domestic` helper, verbatim. */
const domestic = (nationalRank: number): SponsorStanding => ({
  nationalRank,
  itfRank: 999,
  itfRanked: false,
  wtaRank: 999,
  wtaRanked: false,
})

/** A REAL kit letter, from the shipped producer, with the world's clock parked on its LAST answerable
 *  week. Seeds are walked rather than a letter hand-built: the roll is a separate question from the
 *  gate, and a posed letter with terms this file chose would be measuring its own fixture. */
function onTheLastWeek(seed: string): { world: WorldState; offer: Offer } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const world = createWorld(`${seed}-${attempt}`, DEFAULT_PROFILE)
    world.week = LETTER_WEEK
    const [offer] = raiseKitOffers({ offers: world.offers, seed: world.seed, week: LETTER_WEEK, standing: domestic(1) })
    if (!offer) continue
    world.offers.push(offer)
    // THE BOUNDARY, off the letter's own deadline rather than off a number written here.
    world.week = offer.deadlineWeek
    expect(offer.deadlineWeek, 'a letter with a window to stand on').toBeGreaterThan(LETTER_WEEK)
    // ⚠⚠ THE GUARD IS RAW FACTS AND **NOT** `isOfferLive`, AND THAT IS A MEASUREMENT MISTAKE CORRECTED
    // RATHER THAN A PREFERENCE. Built the obvious way – `expect(isOfferLive(offer, world.week))` – the
    // fixture calls the very function arm A breaks, so arm A killed all six cases inside the BUILDER
    // and the file could no longer say anything about the surfaces (measured: 6 failed on the pre-fix
    // tree, where both copies were untouched and should have stayed green). That is CLAUDE.md's «prove
    // the arm contains both the change and its reader» arriving from the other side. The letter's
    // openness is therefore posed in the two fields the state IS, and the engine's own verdict on this
    // fixture is asserted in a case of its own below, where it cannot contaminate the arm.
    expect(offer.state, 'the fixture letter is open').toBe('open')
    expect(world.week, 'and the clock is parked on its last answerable week').toBe(offer.deadlineWeek)
    return { world, offer }
  }
  throw new Error(`no seed near "${seed}" was written to in 20 tries – the offer roll has broken`)
}

/** ⚠ REPOINTED, NOT WEAKENED (T6.2 · D-07, 28.09): the sheet's list is a QUERY now – the weekly
 *  snapshot carries the letters this week still needs and `loadInbox()` answers with the career's whole
 *  post – so a mounted test answers it and waits one microtask. `./inbox` is that arrangement. ⚠ THE
 *  CLAIM IS UNTOUCHED: E-07 is about the sheet asking `isOfferLive` rather than re-spelling it, and a
 *  live letter is carried on the wire either way – the query is here so the LIST is the real one. */
async function sheetOn(world: WorldState): Promise<{ text: string; waiting: boolean }> {
  const wrapper = await mountInbox(
    toSnapshot(world),
    { global: { stubs: { teleport: true } } },
    world.offers.map((o) => ({ ...o, terms: { ...o.terms } })),
  )
  const out = {
    text: wrapper.text().replace(/\s+/g, ' ').trim(),
    waiting: wrapper.find('.inbox-waiting').exists(),
  }
  wrapper.unmount()
  return out
}

describe('E-07 rendered: the sheet\'s list reads the engine on the last week', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⚠ the fixture is live by the ENGINE\'s reckoning – the anti-vacuity case, kept apart', () => {
    // The claim the builder's guard is deliberately NOT making (see its own note): if this line ever
    // fails, every case below is asserting things about a letter the engine considers gone, and a
    // green file would be measuring nothing. It is here, alone, so that arm A's red lands on the
    // SURFACES rather than inside the fixture.
    const { world, offer } = onTheLastWeek('e07-anti-vacuity')
    expect(isOfferLive(offer, world.week), 'her last week is a week the engine still calls live').toBe(true)
  })

  it('⭐⭐ the row wears «Needs an answer» on the very week the window closes', async () => {
    const { world } = onTheLastWeek('e07-sheet-pill')
    const { waiting, text } = await sheetOn(world)
    expect(waiting, 'the accent pill the copy drove').toBe(true)
    // The empty-state hint is the same computed read from the other side: `open.length === 0`.
    expect(text, 'and the sheet does not call the list empty').not.toContain('Nothing waiting on an answer.')
  })

  it('⭐ ...and the tail counts the last week as one week to decide', async () => {
    const { world } = onTheLastWeek('e07-sheet-tail')
    const { text } = await sheetOn(world)
    // `metaOf`'s early return is the THIRD reader of the sheet's one liveness call: a letter it
    // thinks is gone prints the filing line and stops. Singular, because the boundary week is one.
    expect(text, 'the row still offers the decision').toContain('1 week to decide')
  })

  it('⚠ one week later the same three readers go quiet together', async () => {
    const { world } = onTheLastWeek('e07-sheet-past')
    world.week += 1
    const { waiting, text } = await sheetOn(world)
    expect(waiting, 'no pill past the deadline').toBe(false)
    expect(text, 'the sheet says the list is empty').toContain('Nothing waiting on an answer.')
    expect(text, 'and no decision is offered').not.toContain('week to decide')
  })
})

describe('E-07 rendered: the letter\'s Sign and Refuse read the engine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⭐⭐ the paper still offers both controls on the last answerable week', () => {
    const { world, offer } = onTheLastWeek('e07-letter-live')
    const w = mount(OfferLetter, { props: { offer, week: world.week } as never })
    expect(w.find('.offer-actions').exists(), 'the foot carries the two controls').toBe(true)
    expect(w.find('button.offer-sign').exists(), 'Sign').toBe(true)
    expect(w.find('button.offer-refuse').exists(), 'Refuse').toBe(true)
    w.unmount()
  })

  it('⚠ and one week later it is a record instead of a decision', () => {
    const { world, offer } = onTheLastWeek('e07-letter-gone')
    const w = mount(OfferLetter, { props: { offer, week: world.week + 1 } as never })
    expect(w.find('.offer-actions').exists(), 'no controls past the window').toBe(false)
    expect(w.find('button.offer-sign').exists()).toBe(false)
    w.unmount()
  })

  it('⚠ a SIGNED paper shows no controls whatever the week says', () => {
    // `isOfferLive`'s first half, on the surface that has the most to lose from it: a signed deal is
    // not a decision, and the letter's foot must not offer one however far inside its old window the
    // clock is. The engine's own note – «a signed offer is not live however early it is».
    const { world, offer } = onTheLastWeek('e07-letter-signed')
    acceptOffer(world, offer.id)
    expect(offer.state, 'the fixture really signed').toBe('signed')
    const w = mount(OfferLetter, { props: { offer, week: world.week } as never })
    expect(w.find('.offer-actions').exists()).toBe(false)
    w.unmount()
  })
})
