// ONE CLOCK, AT THE TWO SURFACES THAT DO NOT READ `Snapshot.ageYears` AS AN AGE.
//
// The owner's ruling of 09.08 (docs/specs/round15-triage.md, ruling 1) gave the game ONE age and
// made it hers, and `Snapshot.ageYears` changed meaning: it used to be the birth-month-free BAND
// and it is now the girl. Everything that asked "how old is she" got better for free. Two kinds of
// caller got quietly WORSE, and neither shows up in a grep for `ageAtWeek`:
//
//   1. THE COACH MARKET. `coachById(seed, age, id)` and `facilityRateCents(age, tier)` are keyed on
//      the market's restocking clock, not on her - that is the one job `ageAtWeek` kept, and the
//      engine still bills through it (`resolveBaseCosts`, world.ts). A screen that passed
//      `snap.ageYears` matched the engine exactly while that field WAS the band, and stops matching
//      it the moment the two straddle a coach rate row (12-16 / 17-22 / 23+, engine/coach.ts). A
//      December girl is 16 from week 156 to week 204 while the market has restocked at 17: a whole
//      season of quoting the development rate against a bill charged at the professional one.
//
//   2. AN INLINED BAND. The Careers list printed `14 + Math.floor(c.week / 52)` - the same hiding
//      place `Snapshot.ageYears` itself was in, and the reason `git grep ageAtWeek` never found it.
//      It told the picker a December career was 14 in the week its own Home screen said 13.
//
// ⚠ MOUNTED, NOT PINNED, and CLAUDE.md says why: "Prefer a mounted test to a source pin. Mutate the
// thing you think you are covering and watch it fail before you believe a green run." Both fixtures
// below are built so the two clocks DISAGREE - a January career would pass either way, which is
// exactly how this class of defect survived a full suite the first time.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { ageAtWeek, createWorld, kidAgeYears, toSnapshot } from '../../src/engine/world'
import { coachBillRangeCents, coachById } from '../../src/engine/coach'
import { DEFAULT_PROFILE, type CareerMeta, type Snapshot } from '../../src/shared/protocol'

/** The week the two clocks straddle a coach rate row: `ageAtWeek` is 17 here and a December girl is
 *  still 16 (her birthday is week 205). The whole point of the fixture. */
const STRADDLE_WEEK = 156

/** A December career with a coach actually hired, parked on `STRADDLE_WEEK`. */
function decemberSnapshot(seed = 'one-clock-ui'): Snapshot {
  const world = createWorld(seed, {
    ...DEFAULT_PROFILE,
    birthMonth: 12,
    birthDay: 15,
    coachTier: 'middle',
  })
  world.week = STRADDLE_WEEK
  return toSnapshot(world)
}

describe('the planned-spend quote reads the MARKET clock, never the printed age', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the fixture really does hold two different ages, or the test below is vacuous', () => {
    const snap = decemberSnapshot()
    expect(snap.ageYears, 'her age – the one clock, and what the screen prints').toBe(16)
    expect(kidAgeYears(snap.week, snap.profile.birthMonth)).toBe(16)
    expect(ageAtWeek(snap.week), "the coach market's restocking clock").toBe(17)
    // ...and a coach really is hired, so `coachById` has something to resolve
    expect(snap.coachId).toBeTruthy()
    // ⚠ AND THE TWO AGES REALLY DO BUY DIFFERENT PRICES. 16 is the last year of the development
    // row and 17 the first of the professional one, so this is the seam - if these ever became
    // equal the assertion below would pass on a screen reading either clock.
    const atHerAge = coachById(snap.seed, snap.ageYears, snap.coachId)!
    const atTheBand = coachById(snap.seed, ageAtWeek(snap.week), snap.coachId)!
    expect(atHerAge.id, 'the ROSTER is stable across ages - only the price moves').toBe(atTheBand.id)
    expect(atTheBand.rateCents).not.toBe(atHerAge.rateCents)
  })

  it('quotes the bill the engine will actually charge, not the one her own age would buy', () => {
    const snap = decemberSnapshot()
    const store = useGameStore()
    store.snapshot = snap

    const wrapper = mount(ThisWeekScreen, { global: { stubs: { teleport: true } } })
    const shown = wrapper.find('.spend-row .num').text()
    wrapper.unmount()

    // The engine's own envelope, at the age `resolveBaseCosts` bills through (world.ts:913).
    const market = coachById(snap.seed, ageAtWeek(snap.week), snap.coachId)!
    const [lo, hi] = coachBillRangeCents(market.rateCents, snap.plan, snap.profile.background)
    expect(shown).toBe(`$${Math.round(lo / 100)}–$${Math.round(hi / 100)}`)

    // ...and it is NOT the envelope her printed age would have bought, which is the failure this
    // file exists for: the screen read `snap.ageYears` and that used to be the band.
    const hers = coachById(snap.seed, snap.ageYears, snap.coachId)!
    const [wrongLo, wrongHi] = coachBillRangeCents(hers.rateCents, snap.plan, snap.profile.background)
    expect(shown, 'quoting her age would be a price no week ever bills').not.toBe(
      `$${Math.round(wrongLo / 100)}–$${Math.round(wrongHi / 100)}`,
    )
  })
})

describe('the Careers list prints HER age, not the band it used to inline', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** MoreScreen refreshes the careers list from the worker on mount; there is no worker here, and
   *  the rows are the fixture anyway. */
  async function mountWithCareers(rows: CareerMeta[]): Promise<string> {
    const store = useGameStore()
    store.refreshCareers = async () => {}
    store.careers = rows
    const wrapper = mount(MoreScreen, { global: { stubs: { teleport: true } } })
    // The list lives behind the Saves tab, and `.career-row` is reused by the settings rows on
    // Play - so the tab is switched through its own button rather than the class being trusted.
    const saves = wrapper.findAll('.tab-pill').find((b) => b.text() === 'Saves')!
    await saves.trigger('click')
    const text = wrapper.find('.career-info .hint').text()
    wrapper.unmount()
    return text
  }

  const row = (over: Partial<CareerMeta> = {}): CareerMeta => ({
    careerId: 'c1',
    kidName: 'Vera',
    country: 'US',
    seed: 'careers-list',
    createdAt: 0,
    lastPlayedAt: 0,
    week: STRADDLE_WEEK,
    ...over,
  })

  it('a December career is 16 in week 156, where the band says 17', async () => {
    // Her Home screen says 16 in this week (`Snapshot.ageYears`); before the ruling the picker
    // beside it said 17. Two surfaces, one week, two numbers - the owner's original sighting.
    expect(await mountWithCareers([row({ birthMonth: 12 })])).toContain('age 16')
    expect(ageAtWeek(STRADDLE_WEEK), 'and the band is the number it must NOT print').toBe(17)
  })

  it('a January career is 17 in the same week, because for her the two clocks agree', async () => {
    expect(await mountWithCareers([row({ birthMonth: 1 })])).toContain('age 17')
  })

  it('falls back to the band for a row written before the birthday reached the index', async () => {
    // Not a weakening: `birthMonth` lands on `CareerMeta` from this wave on (shared/protocol.ts),
    // so a career last saved before it has no birthday to read and the band is the honest best
    // guess rather than an invented one. One autosave replaces it.
    expect(await mountWithCareers([row()])).toContain('age 17')
  })
})
