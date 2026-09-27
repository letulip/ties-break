// ⭐ W4's P3 POLISH ON THE SEASON SCREEN – the two lane-E rows that need no ruling, with nets.
//
// The wave's plan §2: «P3 polish rides along: in every file a wave touches, apply the lane P3 rows
// that need no ruling (no wording, no balance) and list them in the report». Two of lane E's rows
// land on `SeasonScreen.vue`, which T4.3 and T4.11 already opened:
//
//   E-P04 – the event row spelled `week > ev.deadlineWeek` inline, twice, beside the screen's own
//           `entriesClosed(e)`. A pure de-duplication: the words, the classes and the verdicts are
//           byte-identical, so what this file pins is the BEHAVIOUR on both sides of a deadline –
//           which is what a refactor of a predicate can silently invert.
//   E-P13 – the booked-vacation card is ONE control (`role="button"`, it opens the planner), so a
//           screen reader hears its `aria-label` and stops; the condition the week is worth and the
//           money the family paid were on screen and outside the name. `aria-describedby` now points
//           at the two spans the sighted player is reading. ⚠ NO NEW WORDS: every sentence and every
//           number is the one already rendered.
//
// ⚠ E-P02 IS DELIBERATELY NOT HERE, and the reason is in the wave's report: applying it as written
// means synthesising a `practiceCaution` input on a card where no booking exists, which would drag
// the 'streak' limb into a title that must turn on tiredness alone.
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSeason } from '../helpers/mountSeason'
import { careerSnapshot } from '../helpers/career'
import { ECONOMY, vacationPackage } from '../../src/engine/economy'
import { formatCents } from '../../src/shared/money'
import type { Snapshot } from '../../src/shared/protocol'

describe('W4 P3 · E-P04 – one spelling of "the deadline has passed"', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  /** The career's own feed with every deadline moved to `week + offset`.
   *
   *  ⚠ THE FEED FILTER IS WHY THIS MOVES EVERY EVENT RATHER THAN POSING ONE. `feedShows` draws the
   *  rungs of her working pair, so a hand-built card on an unrelated rung is filtered out before any
   *  pill is rendered and the case passes on an absent element. Moving the deadline on the cards the
   *  screen already chose leaves that choice alone – measured: posing one event found no pill at all. */
  function withDeadline(offset: number): Snapshot {
    const base = careerSnapshot(4, 'w4-p3-deadline')
    expect(base.upcoming.length, 'the fixture career must offer events at all').toBeGreaterThan(0)
    return {
      ...base,
      upcoming: base.upcoming.map((e) => ({ ...e, deadlineWeek: base.week + offset, entered: false })),
    }
  }

  it('an open deadline reads "closes", in the neutral register', () => {
    const snap = withDeadline(2)
    const wrapper = mountSeason(snap)
    const pill = wrapper.findAll('.event-card .pill').find((p) => /closes|Closed/.test(p.text()))
    expect(pill, 'the deadline pill must be on the card').toBeDefined()
    expect(pill!.text()).toContain('closes')
    expect(pill!.classes(), 'an open window is not bad news').not.toContain('negative')
    expect(snap.upcoming[0].deadlineWeek).toBeGreaterThan(snap.week)
    wrapper.unmount()
  })

  it('...and a passed one reads "Closed" and turns negative – the same predicate, the other way', () => {
    const snap = withDeadline(-1)
    const wrapper = mountSeason(snap)
    const pill = wrapper.findAll('.event-card .pill').find((p) => /closes|Closed/.test(p.text()))
    expect(pill, 'the deadline pill must be on the card').toBeDefined()
    expect(pill!.text()).toContain('Closed')
    expect(pill!.classes(), 'a shut window is what `negative` is for').toContain('negative')
    wrapper.unmount()
  })

  it('⚠ an ENTERED card past its deadline keeps the word and drops the alarm', () => {
    // The one asymmetry between the two halves of the old inline pair – the class carried
    // `&& !ev.entered` and the word did not – asserted so the de-duplication cannot quietly align
    // them. A place she already holds is not a missed deadline.
    const snap = withDeadline(-1)
    const entered: Snapshot = { ...snap, upcoming: snap.upcoming.map((e) => ({ ...e, entered: true })) }
    const wrapper = mountSeason(entered)
    const pill = wrapper.findAll('.event-card .pill').find((p) => /closes|Closed/.test(p.text()))
    expect(pill!.text()).toContain('Closed')
    expect(pill!.classes()).not.toContain('negative')
    wrapper.unmount()
  })
})

describe('W4 P3 · E-P13 – the booked family week says what it is worth, to everyone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  /** A career with one booked family week, on a package that HAS a painting – the card only renders
   *  on that branch (`vacationArt(row)`), and the plain fallback row is a different shape. */
  function withVacation(packageId: string, paidCents = 1_250_00): Snapshot {
    const base = careerSnapshot(4, 'w4-p3-vacation')
    return { ...base, vacations: [{ week: base.week + 2, packageId, paidCents }] }
  }

  it('⭐ the card points at the gain and the price it draws, by id', () => {
    const snap = withVacation('seaside')
    const gain = vacationPackage('seaside')!.conditionGain
    expect(gain, 'the fixture package must promise a gain, or the first id is never listed').toBeGreaterThan(0)
    const wrapper = mountSeason(snap)
    const card = wrapper.find('.week-card.vacation')
    expect(card.exists(), 'the painted vacation card must be on screen').toBe(true)
    const ids = (card.attributes('aria-describedby') ?? '').split(' ').filter(Boolean)
    expect(ids.length, 'the card describes itself with nothing').toBe(2)
    // Every id RESOLVES – a `describedby` naming an absent element is silently dropped, which is the
    // failure that would look exactly like a fix.
    const described = ids.map((id) => card.find(`#${id}`))
    for (const [i, el] of described.entries()) {
      expect(el.exists(), `aria-describedby names ${ids[i]}, which is not in the card`).toBe(true)
    }
    const said = described.map((el) => el.text()).join(' ')
    expect(said, 'the condition the week buys is still outside the accessible description').toContain(
      `+${gain} condition`,
    )
    expect(said, 'what the family paid is still outside it').toContain(formatCents(1_250_00))
    wrapper.unmount()
  })

  it('⚠ EVERY shipped package promises a gain, so the first id is never a dangling reference', () => {
    // ⚠ MEASURED, NOT ASSUMED, AND THE CASE IS WRITTEN ROUND THE MEASUREMENT. The gain chip is
    // `v-if`-ed on `vacationGain(row) > 0`, so `vacationDescribedBy` lists its id conditionally – a
    // `describedby` naming an absent element is silently dropped by every AT, which is the failure that
    // would look exactly like a fix. The catalogue holds no zero-gain package today (the cheapest,
    // `staycation`, promises ten), so the conditional cannot be exercised from a fixture and what this
    // case pins is the PREMISE: the day a package ships with nothing to promise, this goes red and the
    // conditional is what will be keeping the description honest. Same shape as `vacationArt`'s own
    // note – the catalogue can grow before the art does.
    for (const pkg of ECONOMY.vacation.packages) {
      expect(pkg.conditionGain, `${pkg.id} promises no condition – E-P13's conditional is now live`).toBeGreaterThan(0)
    }
    const wrapper = mountSeason(withVacation('staycation'))
    const card = wrapper.find('.week-card.vacation')
    const ids = (card.attributes('aria-describedby') ?? '').split(' ').filter(Boolean)
    expect(ids.length, 'the cheapest package still describes both chips').toBe(2)
    for (const id of ids) expect(card.find(`#${id}`).exists(), `${id} is not in the card`).toBe(true)
    expect(ids.map((id) => card.find(`#${id}`).text()).join(' ')).toContain(formatCents(1_250_00))
    wrapper.unmount()
  })

  it('⚠ the accessible NAME is untouched – invariant 4, stated where it could regress', () => {
    // `aria-describedby` is additive: the name the owner's copy produces has to be the same string it
    // was before this row. A description that replaced the name would be a wording change nobody asked
    // for, and it is the kind no rendered-text assertion elsewhere would see.
    const wrapper = mountSeason(withVacation('seaside'))
    const card = wrapper.find('.week-card.vacation')
    expect(card.attributes('aria-label')).toMatch(/^.+, .+ - open the planner$/)
    expect(card.attributes('aria-label')).not.toContain('condition')
    wrapper.unmount()
  })
})
