// THE BILLS PAGE, MOUNTED, WITH A SPONSOR ON IT - the running quota and the contract's length.
//
// THE OWNER DIAGNOSED THE BUG HIMSELF, 09.08: «Списались расходы на весь шмот на 38 неделе 34 года,
// несмотря на наличие спонсора, bills подсвечивает, что всё на нём, но значки free ушли… а почему
// цена в bills отличается от цены в списаниях?… Я понял почему – видимо мы выбрали квоту. Значит надо
// где-то на странице bills писать доступную еще квоту к распределению.» And beside it: «Непонятно на
// какое количество лет спонсор контракт заключает, нигде не видно этой информации.»
//
// ⚠ WHY THIS IS A MOUNTED TEST. Both halves are surfacing defects: `kit.ts` computed the remaining
// allowance correctly the whole time and `Offer.untilWeek` was persisted the whole time - the engine
// was right and the SCREEN did not print either. An engine-side assertion cannot fail on that, which
// is exactly how it shipped. CLAUDE.md: "Prefer a mounted test to a source pin."
//
// THE FIXTURE IS A REAL DEAL. The letter is raised by `raiseKitOffers` on a seed the shop really does
// write to and signed through `acceptOffer`, so the terms, the weeks and the allowance are the
// engine's own - nothing here is a hand-built snapshot, and the two states the test drives (some
// allowance left, none left) are produced by spending it through the till.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { useGameStore } from '../../src/stores/game'
import { acceptOffer, ageAtWeek, createWorld, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { coachAgeBand, coachById, facilityRateCents, tierOf, weeklyBillSplit } from '../../src/engine/coach'
import { dealUntilWeek, raiseKitOffers, sponsorWindowOpensAt } from '../../src/engine/offers'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type KitOfferTerms, type Offer, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'
import { weekLabel } from '../../src/shared/dates'

/** A career with a signed national kit deal - three lines of terms, two seasons, $3,000 a season.
 *  National rather than local because it covers TWO lines, so "the deal is on some lines and not
 *  others" is exercised by the fixture rather than assumed. */
function worldWithSignedDeal(): WorldState {
  const standing = { nationalRank: 1, itfRank: 20, itfRanked: true, wtaRank: 999, wtaRanked: false }
  const week = sponsorWindowOpensAt(WEEKS_PER_YEAR - 1)
  for (let attempt = 0; attempt < 30; attempt++) {
    const world = createWorld(`bills-quota-${attempt}`, DEFAULT_PROFILE)
    world.week = week
    const raised = raiseKitOffers({ offers: world.offers, seed: world.seed, week, standing })
    const letter = raised.find((o) => (o.terms as KitOfferTerms).tier === 'national')
    if (!letter) continue
    acceptOffer(world, letter.id)
    // ...and move into the season the deal covers, so it is IN FORCE rather than merely signed.
    world.week = world.offers[0].fromWeek!
    return world
  }
  throw new Error('no seed near "bills-quota" was written to by National in 30 tries')
}

/** ⚠ THE TAB HAS TO BE PRESSED, AND THE PRESS HAS TO BE AWAITED. The Bills blocks are behind a
 *  `v-if` on the screen's own tab state, so they are not in the document at all until the segment is
 *  clicked - and a synchronous read after `trigger` sees the SPENDING tab, which is how the first
 *  run of this file "passed" its mount and failed every claim. */
async function mountBills(snap: Snapshot) {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  expect(wrapper.text(), 'the Bills tab is really the one showing').toContain('Her kit')
  return wrapper
}

async function billsText(snap: Snapshot): Promise<string> {
  const wrapper = await mountBills(snap)
  const text = wrapper.text()
  wrapper.unmount()
  return text
}

/** ⚠ THE ROW ITSELF, VALUE AND META, NOT THE PAGE'S TEXT (09.08, and this is a mutation the first
 *  version of this file did not catch). Asserting that the page CONTAINS "$3,000" cannot tell the
 *  balance from the pot: in a fresh season they are the same string, so a row that printed
 *  `allowanceCents` where it means `remainingCents` passed every claim here - which is precisely the
 *  defect being fixed, a surface printing a number that is not the one the till uses. Read off
 *  `StatRow`'s own three slots so the figure has to be the right figure. */
async function allowanceRow(snap: Snapshot): Promise<{ value: string; meta: string }> {
  const wrapper = await mountBills(snap)
  const row = wrapper
    .findAll('.tb-statrow')
    .find((r) => r.find('.tb-statrow-label').text().includes('Allowance left this season'))
  expect(row, 'the allowance row').toBeTruthy()
  const out = {
    value: row!.find('.tb-statrow-value').text().trim(),
    meta: row!.find('.tb-statrow-meta').text().trim(),
  }
  wrapper.unmount()
  return out
}

describe('Bills – the sponsor quota and the length of the contract', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the fixture really is a career under a running multi-season deal', () => {
    const world = worldWithSignedDeal()
    const snap = toSnapshot(world)
    expect(snap.kitDeal).toBeTruthy()
    expect(snap.kitDeal!.seasons).toBeGreaterThan(1)
    expect(snap.kitDeal!.remainingCents).toBe(snap.kitDeal!.allowanceCents)
    expect(snap.kitDeal!.untilWeek).toBeGreaterThan(snap.kitDeal!.fromWeek)
    expect(snap.kit.some((l) => l.sponsored)).toBe(true)
  })

  it('⚠ the page prints what is LEFT of the season allowance, not only that a sponsor exists', async () => {
    const world = worldWithSignedDeal()
    const text = await billsText(toSnapshot(world))
    expect(text).toContain('Allowance left this season')
    // The brand and the full pot are both named, so the running figure has something to be read
    // against - "$3,000 left" alone cannot say whether anything has been spent.
    expect(text).toContain((world.offers[0].terms as KitOfferTerms).brand)
    expect(text).toContain('$3,000')
    // ...and the row's own two figures, so "what is left" is read from the right field. A fresh
    // season has spent nothing, which is the one state in which the balance and the pot agree - see
    // the part-spent case below for the assertion that can tell them apart.
    const terms = world.offers[0].terms as KitOfferTerms
    const row = await allowanceRow(toSnapshot(world))
    expect(row.value).toBe(formatCents(terms.kitAllowanceCents))
    expect(row.meta).toBe(`${formatCents(0)} of ${formatCents(terms.kitAllowanceCents)} used`)
  })

  it('⚠ ...and the figure is the BALANCE, not the pot - it MOVES as she spends', async () => {
    // ⚠ THE MUTATION THIS CATCHES, because nothing above it did: a row printing `allowanceCents`
    // where it means `remainingCents` is invisible in a fresh season and in an empty one it is only
    // caught by the sentence beside it. Half a pot spent is the state where the two numbers differ
    // and neither is zero, so the wrong field cannot pass.
    const world = worldWithSignedDeal()
    const terms = world.offers[0].terms as KitOfferTerms
    const spentCents = Math.round(terms.kitAllowanceCents / 2)
    world.offers[0].coveredCents = spentCents
    const snap = toSnapshot(world)
    expect(snap.kitDeal!.remainingCents).toBe(terms.kitAllowanceCents - spentCents)
    const row = await allowanceRow(snap)
    expect(row.value).toBe(formatCents(terms.kitAllowanceCents - spentCents))
    expect(row.value).not.toBe(formatCents(terms.kitAllowanceCents))
    expect(row.meta).toBe(`${formatCents(spentCents)} of ${formatCents(terms.kitAllowanceCents)} used`)
  })

  it('⚠ ...and it changes as the pot is spent, which is the whole complaint', async () => {
    // The exact state that produced the report: the allowance is gone, the free badges have
    // disappeared, and until this wave NOTHING on the page said why.
    const world = worldWithSignedDeal()
    const terms = world.offers[0].terms as KitOfferTerms
    const fresh = await billsText(toSnapshot(world))
    expect(fresh).not.toContain("The season's allowance is spent")

    world.offers[0].coveredCents = terms.kitAllowanceCents
    const snap = toSnapshot(world)
    expect(snap.kitDeal!.remainingCents).toBe(0)
    const spent = await billsText(snap)
    expect(spent).toContain("The season's allowance is spent")
    // ...and the row reads zero, not the pot it started from.
    expect((await allowanceRow(snap)).value).toBe(formatCents(0))
    // ...and the per-line promise stops promising: "they pay for what she buys" is false now.
    expect(spent).toContain("the season's allowance is gone")
    expect(spent).not.toContain('they pay for what she buys')
  })

  it('⚠ the contract says how long it runs, in seasons AND in weeks', async () => {
    // «Непонятно на какое количество лет спонсор контракт заключает» - `seasons`, `fromWeek` and
    // `untilWeek` were all persisted and none of them reached a surface.
    const world = worldWithSignedDeal()
    const snap = toSnapshot(world)
    const text = await billsText(snap)
    expect(text).toContain('Two seasons')
    // Both ends of the term, in the app's own week vocabulary (`weekLabel`).
    const seasonOf = (w: number) => Math.floor(w / WEEKS_PER_YEAR)
    expect(seasonOf(snap.kitDeal!.untilWeek)).toBeGreaterThan(seasonOf(snap.kitDeal!.fromWeek))
    expect(text).toMatch(/W\d+ '\d\d – W\d+ '\d\d/)
  })
})

// =================================================================================================
// THE TRAINING BILL NOTE – the same defect from the other side: a figure quoted off the wrong clock
// =================================================================================================
//
// It sits in this file because it is the quota bug's twin. The Money screen's own header promises
// "EVERY FIGURE IS THE ENGINE'S OWN … cannot drift from the charge", and a price read off a
// different age than the till uses breaks that promise exactly as a stale allowance did.
//
// ⚠ WHY THE FIXTURE SETS `ageYears` BY HAND. `resolveBaseCosts` prices the week with
// `ageAtWeek(world.week)` - THE BAND - and the coach roster is derived from it with only the chosen
// id persisted. `Snapshot.ageYears` used to be that same band, which is why reading it here was
// invisible; the one-clock ruling makes it HER REAL AGE, and a December girl's age and the band
// disagree for most of a career. This guard has to hold on both sides of that change, so the
// snapshot it mounts is the one-clock shape: her age beside a band the market has already moved on.
describe('MoneyScreen – the coach quote is priced off the band the till charges', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The bill exactly as `resolveBaseCosts` computes it, for a given age input. */
  function billFor(snap: Snapshot, ageYears: number) {
    const coach = coachById(snap.seed, ageYears, snap.coachId)
    const tier = tierOf(coach)
    const rate = coach ? coach.rateCents : facilityRateCents(ageYears, tier)
    return weeklyBillSplit({
      rateCents: rate,
      ageYears,
      tier,
      plan: snap.plan,
      background: snap.profile.background,
    })
  }

  it('⚠ the quote follows ageAtWeek(week), not the age printed on the screen', () => {
    // A REAL career, ticked: the note lives inside the Spending body, which the screen only draws
    // once there is something to break down - so a hand-built world at week 156 shows the empty
    // state and asserts nothing. Funds are set high because bankruptcy would end the career before
    // the band turns and this test is not about survival.
    const world = createWorld('coach-clock', DEFAULT_PROFILE)
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed('coach-clock:bills-test')
    // Week 156 is where the band turns 17 and the rate rows step from 12-16 to 17-22 - the boundary
    // the two clocks straddle for a girl born late in the year. Two weeks past it, so the twelve-week
    // window has bills in it.
    while (world.week < 3 * WEEKS_PER_YEAR + 2) tickWeek(world, rng)
    const snap = toSnapshot(world)
    const band = ageAtWeek(snap.week)
    expect(band).toBe(17)
    expect(snap.coachId, 'the fixture must really have a coach').toBeTruthy()
    const shown: Snapshot = { ...snap, ageYears: band - 1 }
    // The fixture must really cross a row, or this test would pass on a coincidence.
    expect(coachAgeBand(shown.ageYears)).not.toBe(coachAgeBand(band))
    const charged = billFor(shown, band)
    const misquoted = billFor(shown, shown.ageYears)
    expect(misquoted.totalCents).not.toBe(charged.totalCents)

    const store = useGameStore()
    store.snapshot = shown
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    const text = wrapper.text()
    expect(text, 'the Spending tab is the one showing').toContain('Training quotes at')
    expect(text).toContain(`Training quotes at ${formatCents(charged.totalCents)} a week`)
    expect(text, 'the wrong clock must not reach the screen').not.toContain(
      formatCents(misquoted.totalCents),
    )
    wrapper.unmount()
  })
})

// =================================================================================================
// THE LETTER ITSELF – the same fact on the paper, before and after the signature
// =================================================================================================
//
// The Bills card above is where a running contract is READ; this is where it is DECIDED, and the
// owner's «нигде не видно этой информации» was true of both. Mounted for the same reason: the weeks
// were persisted the whole time and the defect was that no template printed them.
describe('OfferLetter – how long the kit deal runs', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ an UNSIGNED letter names the week she is in their kit to', () => {
    const world = worldWithSignedDeal()
    const signed = world.offers[0]
    // The same letter as it was on the desk: open, undecided, with no weeks frozen onto it yet.
    const letter = {
      ...signed,
      state: 'open',
      fromWeek: undefined,
      untilWeek: undefined,
      decidedWeek: undefined,
    } as unknown as Offer
    const wrapper = mount(OfferLetter, { props: { offer: letter, week: letter.week } as never })
    const text = wrapper.text()
    // ⚠ THE ENGINE'S OWN FUNCTION, not 52 x seasons computed here: the paper must promise the week
    // `signOffer` will actually write, which is the whole argument in `runsToWeek`'s comment.
    expect(text).toContain(`she is in our kit to ${weekLabel(dealUntilWeek(letter))}`)
    expect(text).toMatch(/W\d+ '\d\d/)
    wrapper.unmount()
  })

  it('⚠ ...and a SIGNED one is a record: both ends of the term, off the offer', () => {
    const world = worldWithSignedDeal()
    const signed = world.offers[0]
    expect(signed.state).toBe('signed')
    expect(signed.fromWeek).toBeDefined()
    expect(signed.untilWeek).toBeDefined()
    const wrapper = mount(OfferLetter, { props: { offer: signed, week: signed.fromWeek } as never })
    const text = wrapper.text()
    expect(text).toContain(`In their kit ${weekLabel(signed.fromWeek!)} – ${weekLabel(signed.untilWeek!)}`)
    wrapper.unmount()
  })
})
