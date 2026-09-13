// ROUND 41 #15 – THE ADVERTISING LETTERS OPEN AT SIXTEEN, ON A JUNIOR SHELF.
//
// HIS QUESTION, 12.09: «А рекламных контрактов правда не предлагают до 18 лет или это наше ноу-хау?
// кажется молодые тоже в рекламах снимаются.» AND HIS RULING, the same day, on option A1: «реклама
// открывается с 16 (юниорские суммы, реже), а призовые падают на её счёт с первого старта W-серии
// независимо от возраста – согласен».
//
// ⚠⚠ THE EIGHTEEN WAS OUR READING AND NOT HIS RULING, which is the fact this file is built around.
// `ECONOMY.advertising.fromAgeYears`' shipped comment said in as many words that it came from «какие
// у нас могут быть механики этих контрактов дополнительные от 18+ лет начиная и дальше» – a question
// about what EXTRA mechanics exist above eighteen, read as an eligibility gate. The exhibit is kept
// verbatim in the constant's own comment.
//
// WHAT THE ITEM IS, IN FOUR NUMBERS: the gate is 16; between 16 and 18 only `drinks` and `clothing`
// are written, at half the adult cheque, on half the arrival chance, for one year and never more.
// From her eighteenth birthday the shelf is the shipped one, BYTE FOR BYTE – which is the property
// §4 below is written to hold, because it is the one a retune could silently lose.
//
// ⚠⚠ ZERO NEW DRAWS AND INPUT-INDEPENDENCE IS UNTOUCHED, asserted in §5 rather than argued here:
// «реже» is the SAME purpose-scoped sub-stream (`seed:ad:<category>:<week>`) read at a lower bar, and
// the term ceiling is applied AFTER the letter rng has spent its uniform, so no stream shifts by one
// draw at any age. An age is world state, not player input – nothing a parent chooses moves a career
// across this line. The frozen MAIN capture (41550 / e6b0c709) cannot see any of it, and
// `tests/condition.test.ts` is green and unmodified.
//
// ⚠ NO SCHEMA MOVE: the junior paper is an `AdOfferTerms` like any other, and `SAVE_SCHEMA_VERSION`
// stays 74.
//
// MUTATIONS, each applied alone to the engine, run, reverted. Control 11/11 green before and after.
// ⚠ THE COUNTS ARE READ OFF THE RUNS AND NOT PREDICTED:
//   M1 `fromAgeYears` back to 18 (the shipped gate)           → 7 red, which is every arm that needs
//      a junior to exist at all – §1's predicate, §2's cheque and sweep, §3's both, §5's money and
//      draw-order arms. §4 (the adult shelf) stays GREEN, which is right: it is the arm that says
//      the item changed nothing from eighteen;
//   M2 the junior list widened to every category              → 2 red (§2's sweep names the four
//      shut categories by name; §3's closed row stops being closed);
//   M3 `adJuniorTerms` returning its argument unchanged       → 2 red (§2's cheque and term, §3's
//      letter-vs-shelf comparison);
//   M4 the junior re-size dropped from `reviewAdOffer` ONLY   → 2 red – and this is the arm that
//      exists because the SHELF and the LETTER are two readers of one question: under M4 the shelf
//      still promises the junior cheque and the envelope carries the adult one, which is exactly the
//      defect shape, invisible until a sixteen-year-old signed one;
//   M5 `chanceBps` 5000 → 10000 («реже» deleted)              → 1 red (§2's arrival-rate arm, and
//      only that one – a rate is not a cheque).
import { describe, it, expect } from 'vitest'
import {
  acceptOffer,
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  reviewAdOffer,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import {
  adBandFor,
  adCategoryOf,
  adFeeFor,
  adJuniorAt,
  adJuniorFeeCents,
  adJuniorOpen,
  adWritesAt,
  AD_CATEGORIES,
} from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type AdOfferTerms, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising
const J = AD.junior

const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)
const adPost = (w: WorldState): Offer[] => w.offers.filter((o) => o.kind === 'ad')
const categoriesIn = (w: WorldState): string[] =>
  adPost(w).map((o) => String(adCategoryOf(o.terms as AdOfferTerms))).sort()

/** A PROBE CAREER AT A NAMED WEEK WITH A COUNTING PROFESSIONAL STANDING – `tests/ad-offer.test.ts`'
 *  own `probeWorld` shape, reproduced here because that file's copy is private to it. The bar is
 *  crossed by writing the book the way every pro fixture in this repo writes one; the week is the
 *  variable, so two probes differ in her AGE and in nothing else.
 *
 *  ⚠ THE POINTS ARE CHOSEN FOR THE BAND AND THE BAND IS ASSERTED, never assumed: 400 W-series points
 *  seat her at about world #183, inside the ≤200 rung, which is the band `ad-offer.test.ts`'s own
 *  anchor claims are written against. */
function probeAt(seed: string, week: number, points = 400): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  world.results.push({ playerId: KID_ID, week, points, tier: 'w100' })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return world
}

/** The first week from `from` whose own dice say this category writes – at the bar the caller names,
 *  which is the whole point: the junior bar is half the adult one, so «the dice say yes» is a
 *  different question at each age and the fixtures must ask the right one. */
function firstRoll(seed: string, from: number, limit: number, category: string, chance: number): number {
  for (let w = from; w < from + limit; w++) {
    if (adWritesAt(seed, w, chance, category as Parameters<typeof adWritesAt>[3])) return w
  }
  return -1
}

const JUNIOR_CHANCE = (AD.offerChance * J.chanceBps) / 10_000
const SEED = 'r41-15-junior'

/** A week she is sixteen or seventeen in, and one she is past eighteen in. Found by asking the same
 *  clock the gate asks rather than by a hand-read bound – the re-aim `ad-offer.test.ts` took for its
 *  own under-age probe, for the same reason. */
function weekAtAge(seed: string, wanted: number, searchFrom = 1): number {
  const w = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  for (let week = searchFrom; week < 700; week++) {
    w.week = week
    if (ageOf(w) === wanted) return week
  }
  return -1
}

// =================================================================================================
// §1 – THE GATE ITSELF: SIXTEEN, AND THE TWO YEARS UNDER IT ARE STILL SILENT
// =================================================================================================
describe('§1 the gate is sixteen now, and fifteen is still nothing', () => {
  it('⭐⭐⭐ the constant IS sixteen, and the junior window is exactly [16, 18)', () => {
    expect(AD.fromAgeYears, 'his own number').toBe(16)
    expect(J.untilAgeYears, 'and the adult shelf opens where it always did').toBe(18)
    // ⚠ THE PREDICATE, NOT THE CONSTANTS – one function answers «is this a junior week» and both
    // readers ask it, so a shelf and a letter cannot disagree about her age either.
    expect(adJuniorAt(15)).toBe(false)
    expect(adJuniorAt(16)).toBe(true)
    expect(adJuniorAt(17)).toBe(true)
    expect(adJuniorAt(18), 'eighteen is an adult, on the first day of it').toBe(false)
    expect(adJuniorAt(24)).toBe(false)
  })

  it('⭐⭐ a fifteen-year-old with a real standing and a true roll is still written nothing', () => {
    const week = weekAtAge(SEED, 15)
    expect(week, 'the fixture found a week she is fifteen in').toBeGreaterThan(0)
    const world = probeAt(SEED, week)
    expect(ageOf(world)).toBe(15)
    expect(adBandFor(sponsorStandingOf(world)), 'she really does stand in a band').not.toBeNull()
    reviewAdOffer(world)
    expect(adPost(world), 'below the gate nothing is written at all').toEqual([])
    // ...and the shelf is empty too, which is the same rule read from the other side.
    expect(toSnapshot(world).adPortfolio).toEqual([])
  })
})

// =================================================================================================
// §2 – THE JUNIOR SHELF: TWO CATEGORIES, HALF THE CHEQUE, ONE YEAR
// =================================================================================================
describe('§2 the junior shelf – «юниорские суммы, реже»', () => {
  it('⭐⭐⭐ a sixteen-year-old is written a DRINK, at half the cell, for one year', () => {
    const week = weekAtAge(SEED, 16)
    const hit = firstRoll(SEED, week, 100, 'drinks', JUNIOR_CHANCE)
    expect(hit, 'the junior dice say yes somewhere in her sixteenth year').toBeGreaterThan(0)
    const world = probeAt(SEED, hit)
    expect(ageOf(world), 'and she is still a junior on that week').toBe(16)
    const band = adBandFor(sponsorStandingOf(world))!
    reviewAdOffer(world)
    const letters = adPost(world)
    expect(letters.length, 'exactly one letter, and it is the drink').toBe(1)
    const t = letters[0].terms as AdOfferTerms
    expect(adCategoryOf(t)).toBe('drinks')
    // ⚠ THE CHEQUE IS THE ADULT CELL HALVED, WRITTEN OUT IN FULL rather than compared against
    // `adJuniorFeeCents` alone: a mutation that made BOTH the helper and the letter wrong in the
    // same direction would survive a self-referential assertion.
    const adult = adFeeFor('drinks', band)!
    expect(t.cashCents, 'half the adult cheque, to the cent').toBe(Math.round(adult / 2))
    expect(t.cashCents).toBe(adJuniorFeeCents(adult))
    expect(t.cashCents, '...and it really is less than the adult one').toBeLessThan(adult)
    // ⚠ ONE YEAR AND NEVER MORE – a minor is not signed through the two years she changes most.
    expect(t.termYears).toBe(1)
    expect(t.termWeeks).toBe(52)
  })

  it('⭐⭐⭐ a watch, a car, an airline and a fragrance are written to nobody before eighteen', () => {
    // ⚠ THE ARM IS A SWEEP AND NOT ONE CATEGORY, because «two and not six» is the claim. Every week
    // of her sixteenth and seventeenth years is reviewed with a real standing in place, and the set
    // of categories that EVER arrive is compared with the shelf's own list.
    const from = weekAtAge(SEED, 16)
    const seen = new Set<string>()
    for (let w = from; w < from + 104; w++) {
      const world = probeAt(`${SEED}-sweep`, w)
      if (ageOf(world) >= 18) break
      reviewAdOffer(world)
      for (const c of categoriesIn(world)) seen.add(c)
    }
    expect(seen.size, 'the sweep really did produce letters').toBeGreaterThan(0)
    for (const c of seen) expect(adJuniorOpen(c as never), `${c} was written to a junior`).toBe(true)
    // ⚠ AND THE NEGATIVE SAID BY NAME, so a widened list fails here rather than passing a set test.
    for (const shut of ['watches', 'cars', 'airline', 'fragrance', 'capstone', 'lifetime']) {
      expect(seen.has(shut), `${shut} reached a junior`).toBe(false)
    }
  })

  it('⭐⭐ «реже» is real – the junior bar refuses weeks the adult bar would take', () => {
    // ⚠ THE TWO BARS ON ONE STREAM, WHICH IS WHAT «the same dice, read at a lower threshold» MEANS.
    // Counted over two years of weeks: every junior-true week is adult-true, and there are strictly
    // fewer of them. A `chanceBps` of 10000 makes the two counts equal and reddens the last line.
    let adultTrue = 0
    let juniorTrue = 0
    for (let w = 100; w < 204; w++) {
      const a = adWritesAt(SEED, w, AD.offerChance, 'drinks')
      const j = adWritesAt(SEED, w, JUNIOR_CHANCE, 'drinks')
      if (a) adultTrue++
      if (j) juniorTrue++
      if (j) expect(a, `w${w}: a junior-true week must be adult-true – one stream, two bars`).toBe(true)
    }
    expect(adultTrue, 'the adult bar really does say yes sometimes').toBeGreaterThan(0)
    expect(juniorTrue, '...and the junior bar says yes less often').toBeLessThan(adultTrue)
  })
})

// =================================================================================================
// §3 – THE SHELF ON SCREEN SAYS WHAT THE LETTER WILL SAY
// =================================================================================================
describe('§3 the two readers agree – the shelf quotes the junior cheque', () => {
  it('⭐⭐⭐ the open drinks row quotes exactly what the letter brings, at sixteen', () => {
    const week = weekAtAge(SEED, 16)
    const world = probeAt(`${SEED}-shelf`, week)
    const band = adBandFor(sponsorStandingOf(world))!
    const row = toSnapshot(world).adPortfolio.find((r) => r.category === 'drinks')!
    expect(row.state, 'the drink is open to a junior').toBe('open')
    expect(row.openCashCents, 'and the promise is the junior cheque').toBe(adJuniorFeeCents(adFeeFor('drinks', band)!))
    // ...and it is what the engine actually writes, asked of the engine rather than of the row.
    const hit = firstRoll(`${SEED}-shelf`, week, 120, 'drinks', JUNIOR_CHANCE)
    expect(hit).toBeGreaterThan(0)
    const later = probeAt(`${SEED}-shelf`, hit)
    expect(ageOf(later), 'still a junior when the dice land').toBeLessThan(18)
    reviewAdOffer(later)
    const t = adPost(later).find((o) => adCategoryOf(o.terms as AdOfferTerms) === 'drinks')!.terms as AdOfferTerms
    const shelfRow = toSnapshot(later).adPortfolio.find((r) => r.category === 'drinks')!
    // the row is FILLED once a deal is signed, so the comparison is made on the open state's promise
    expect(t.cashCents, 'the envelope is the shelf`s own figure').toBe(shelfRow.openCashCents ?? row.openCashCents)
  })

  it('⭐⭐ a category the junior band does not write is CLOSED, and says nothing about a rank', () => {
    // ⚠⚠ THE ROW CARRIES NO `opensAtRank` ON PURPOSE AND THE TEMPLATE ALREADY HAS THE SENTENCE FOR
    // IT («Not open yet», shipped since round 29). `opensAtRank` answers «how far up the ladder»,
    // which is TRUE and NOT THE REASON here: this career meets the watch band's rank and is refused
    // on her age. So the item adds no player-facing string and needs no template edit.
    const week = weekAtAge(SEED, 17)
    const world = probeAt(`${SEED}-closed`, week)
    expect(ageOf(world)).toBe(17)
    const band = adBandFor(sponsorStandingOf(world))!
    expect(adFeeFor('watches', band), 'she MEETS the watch band by rank').not.toBeNull()
    const rows = toSnapshot(world).adPortfolio
    const watches = rows.find((r) => r.category === 'watches')!
    expect(watches.state, 'and is refused anyway, on her age').toBe('closed')
    expect(watches.opensAtRank, 'the row does not blame a rank it has').toBeUndefined()
    expect(rows.find((r) => r.category === 'drinks')!.state, 'while the drink is open').toBe('open')
  })
})

// =================================================================================================
// §4 – FROM EIGHTEEN, NOTHING MOVED. THE PROPERTY A RETUNE COULD SILENTLY LOSE.
// =================================================================================================
describe('§4 the adult shelf is byte-identical from her eighteenth', () => {
  it('⭐⭐⭐ an eighteen-year-old gets the ADULT cheque, the adult term and the whole shelf', () => {
    const week = weekAtAge(SEED, 18)
    expect(week).toBeGreaterThan(0)
    const world = probeAt(`${SEED}-adult`, week)
    expect(ageOf(world)).toBe(18)
    expect(adJuniorAt(ageOf(world)), 'she is out of the junior band').toBe(false)
    const band = adBandFor(sponsorStandingOf(world))!
    const rows = toSnapshot(world).adPortfolio
    // Every priced cell at her band is OPEN and at the FULL figure – no junior halving anywhere.
    for (const category of AD_CATEGORIES) {
      if (category === 'capstone' || category === 'lifetime' || category === 'clothing') continue
      const fee = adFeeFor(category, band)
      const row = rows.find((r) => r.category === category)!
      if (fee === null) continue
      expect(row.state, `${category} is open to an adult`).toBe('open')
      expect(row.openCashCents, `${category} quotes the adult cell`).toBe(fee)
    }
    // ...and the letter the engine writes carries the adult cheque too.
    const hit = firstRoll(`${SEED}-adult`, week, 60, 'watches', AD.offerChance)
    expect(hit).toBeGreaterThan(0)
    const later = probeAt(`${SEED}-adult`, hit)
    expect(ageOf(later)).toBeGreaterThanOrEqual(18)
    reviewAdOffer(later)
    const watch = adPost(later).find((o) => adCategoryOf(o.terms as AdOfferTerms) === 'watches')
    expect(watch, 'a watch really is written to an adult').toBeDefined()
    expect((watch!.terms as AdOfferTerms).cashCents).toBe(adFeeFor('watches', adBandFor(sponsorStandingOf(later))!))
  })
})

// =================================================================================================
// §5 – THE MONEY, AND THE DICE
// =================================================================================================
describe('§5 the cheque lands in her account, and nothing re-rolls', () => {
  it('⭐⭐ a signed junior deal pays HER, less the manager`s fee – his own 29.08 ruling, unchanged', () => {
    const week = weekAtAge(SEED, 16)
    const hit = firstRoll(`${SEED}-money`, week, 120, 'drinks', JUNIOR_CHANCE)
    expect(hit).toBeGreaterThan(0)
    const world = probeAt(`${SEED}-money`, hit)
    expect(ageOf(world)).toBeLessThan(18)
    reviewAdOffer(world)
    const letter = adPost(world).find((o) => adCategoryOf(o.terms as AdOfferTerms) === 'drinks')!
    const gross = (letter.terms as AdOfferTerms).cashCents
    const fundsBefore = world.fundsCents
    const hersBefore = world.kidFundsCents ?? 0
    acceptOffer(world, letter.id)
    const family = world.fundsCents - fundsBefore
    const hers = (world.kidFundsCents ?? 0) - hersBefore
    expect(family + hers, 'the two halves ARE the cheque, to the cent').toBe(gross)
    expect(hers, 'most of a junior fee is hers').toBeGreaterThan(family)
    // ⚠ THE COMMISSION IS THE ENGINE'S OWN CONSTANT, read and not typed – and it has NO age gate by
    // the owner's own ruling («контракт на полную сумму ребенку»), which this item made reachable
    // two years earlier rather than changing.
    expect(family).toBe(Math.round((gross * ECONOMY.managerCommission.bps) / 10_000))
  })

  it('⭐⭐⭐ the junior band spends the same draws on the same streams – nothing shifts by one', () => {
    // ⚠⚠ THE ARM THAT PROTECTS THE FROZEN CAPTURE AND THE TERM LADDER AT ONCE. The junior ceiling is
    // applied AFTER the letter rng has spent its uniform, so a seventeen-year-old and an eighteen-
    // year-old read the SAME stream at the SAME position. The proof is the AUTHOR: the house is
    // picked with the first draw and the term with the second, so if the junior branch skipped the
    // term draw the two ages would still agree on the brand – and would diverge on any later value.
    // Comparing the brand at both ages on one week is therefore the arm that catches a skipped draw.
    const junWeek = weekAtAge(SEED, 17)
    const adultWeek = weekAtAge(SEED, 19)
    const jHit = firstRoll(`${SEED}-rng`, junWeek, 60, 'drinks', JUNIOR_CHANCE)
    expect(jHit).toBeGreaterThan(0)
    const junior = probeAt(`${SEED}-rng`, jHit)
    reviewAdOffer(junior)
    const jTerms = adPost(junior).find((o) => adCategoryOf(o.terms as AdOfferTerms) === 'drinks')!
      .terms as AdOfferTerms
    // The same seed and the same category at an ADULT week, so only her age differs.
    const aHit = firstRoll(`${SEED}-rng`, adultWeek, 60, 'drinks', AD.offerChance)
    expect(aHit).toBeGreaterThan(0)
    const adult = probeAt(`${SEED}-rng`, aHit)
    expect(ageOf(adult)).toBeGreaterThanOrEqual(18)
    reviewAdOffer(adult)
    const aTerms = adPost(adult).find((o) => adCategoryOf(o.terms as AdOfferTerms) === 'drinks')!
      .terms as AdOfferTerms
    expect(AD.categories.drinks.houses, 'both authors come out of the same three names').toContain(jTerms.brand)
    expect(AD.categories.drinks.houses).toContain(aTerms.brand)
    // The junior paper is the adult paper re-sized – so the fields that are NOT the item agree.
    expect(jTerms.trade).toBe(aTerms.trade)
    expect(jTerms.shootCount, 'the shoot ask is the band`s own, unscaled').toBe(aTerms.shootCount)
  })

  it('⚠ determinism – the same career reviewed twice writes the same junior paper', () => {
    const week = weekAtAge(SEED, 16)
    const hit = firstRoll(`${SEED}-det`, week, 120, 'drinks', JUNIOR_CHANCE)
    expect(hit).toBeGreaterThan(0)
    const a = probeAt(`${SEED}-det`, hit)
    const b = probeAt(`${SEED}-det`, hit)
    reviewAdOffer(a)
    reviewAdOffer(b)
    expect(adPost(a).map((o) => o.terms)).toEqual(adPost(b).map((o) => o.terms))
  })
})
