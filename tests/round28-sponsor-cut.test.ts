// ROUND 28 ITEM 15 – HER CUT REACHES THE SPONSORS' CHEQUES.
//
// THE OWNER, 28.08: «С чеков спонсоров мне кажется ребёнку тоже нужно % перечислять, как и с
// призовых, давай сделаем». A ruling, not a question. «как и с призовых» is the whole spec: the same
// `ECONOMY.kidShare` ramp, the same single rounding, the same family-keeps-the-remainder
// subtraction, the same memo on the durable ledger.
//
// ⚠⚠ THE HARD PART OF THIS ITEM IS NOT THE ARITHMETIC, IT IS THE SCOPE – which money is «чек
// спонсора». The ruling is written out over `bankSponsorCheque` in engine/world/sponsors.ts and the
// line it draws is the engine's OWN, written in 2026-08 for a different purpose: «every one of them
// is a cheque somebody writes to the PLAYER rather than a price the family pays». So:
//
//   HERS      the advertising fee, the kit retainer, the appearance fee, the result bonus
//   NOT HERS  the kit allowance (it buys her rackets), the kit travel share (it reduces a fare), the
//             local sponsor cameo (need-based rescue, written to the family), the academy grant
//
// This file measures BOTH halves, because a rule that only ever says yes is not a rule.
//
// ⚠ MUTATION-VERIFIED, four mutations, each applied alone against this file and reverted. What each
// one actually reddened, measured rather than predicted:
//
//   1. `ECONOMY.kidShare.startBps` 1000 -> 2000, i.e. THE RATE MOVED -> the two literal-pinned tests
//      redden (§1's «in the actual money» and §4's «$2,596.15»), and NOTHING else. ⚠ THAT IS WHY
//      THOSE TWO TESTS EXIST AND WHY THEY ARE THE ONLY ONES CARRYING LITERALS: every other
//      assertion here asks `kidPrizeShareCents` for its expectation, which is correct for a retune –
//      the game moves and the test moves with it – and therefore CANNOT see the rate change. A
//      first draft of this file had no literal pin anywhere and survived this mutation entirely
//      green, which is the whole reason the measurement is run instead of assumed.
//   2. `bankSponsorCheque` short-circuited to `{ herCents: 0, familyCents: grossCents }` – the
//      feature removed -> all four of §1, all three of §2 and §3's allowance walk redden (8 of 13).
//      §3's cameo and travel tests stay green, correctly: they assert an absence, and the absence is
//      still true when the whole rule is gone.
//   3. THE RULE WIDENED, not the rate – the local sponsor cameo routed through
//      `bankSponsorCheque` -> §3's cameo test reddens ALONE. This is the mutation the negative half
//      exists for: no rate change can produce it and no positive test can see it.
//   4. `familyWeeklyIncomeCents` restored to quoting the GROSS retainer -> §4 alone reddens.
import { describe, it, expect, vi } from 'vitest'

// A real career to eighteen is ~210 ticks; the runner is shared with heavier suites.
vi.setConfig({ testTimeout: 300_000 })

import {
  acceptOffer,
  bankSponsorCheque,
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { familyWeeklyIncomeCents } from '../src/engine/world/coachMarket'
import { payRetainer, isRetainerWeek, appearanceFeeFor, resultBonusFor, sponsorStandingOf, travelCostFor } from '../src/engine/world/sponsors'
import type { SeasonEvent } from '../src/engine/season/types'
import { resumeMain } from '../src/engine/rng'
import { adWritesAt, kitTermsFor, signOffer } from '../src/engine/offers'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents, parentIncomeForWeekCents } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type KitOfferTerms, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising

/** Her age this week, off the world's own clock – the same read every gate makes. */
const ageOf = (world: WorldState): number =>
  kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)

/** A counting professional result – the `proWorld` fixture idiom, so `wtaRanked` is true and the
 *  table holds a real rank. Copied from tests/ad-offer.test.ts, which is where the gate lives. */
function pushBook(world: WorldState): void {
  world.results.push({ playerId: KID_ID, week: world.week, points: 100_000, tier: 'w100' })
}

/** A REAL career ticked to her eighteenth year, then given a professional standing. Self-coached and
 *  entering nothing, so the walk is deterministic and no tournament dialog arises; every week of it
 *  is still lived by the engine. */
function adultPro(seed: string) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
  pushBook(world)
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return { world, rng }
}

/** The first week at or after `from` whose own dice say an advertising house writes. -1 for none. */
function firstAdRollFrom(seed: string, from: number, limit: number): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance)) return w
  return -1
}

/** ONE shared adult career, cloned per test so nothing leaks between them. */
const life = (() => {
  const { world, rng } = adultPro('r28-cut')
  const hit = firstAdRollFrom(world.seed, world.week + 1, 40)
  if (hit > 0) while (world.week < hit) tickWeek(world, rng)
  return { world, hit }
})()

/** A signed kit deal on the world, at the rung named, running from this week.
 *
 *  ⚠ THE TERMS ARE THE ENGINE'S OWN (`kitTermsFor`) AND THE SIGNATURE IS THE ENGINE'S OWN
 *  (`signOffer`), never a hand-built object. A fixture that types the shape out itself is a second
 *  definition of a contract, and it goes stale silently the day the catalogue gains a field – which
 *  is precisely what the terms-are-a-snapshot rule exists to prevent. */
function signKit(world: WorldState, rung: 'tour' | 'premium' | 'icon'): KitOfferTerms {
  const terms = kitTermsFor(sponsorStandingOf(world), rung)
  if (!terms) throw new Error(`no kit terms at rung ${rung}`)
  const offer: Offer = {
    id: `kit-test-${world.week}`,
    kind: 'kit',
    week: world.week,
    deadlineWeek: world.week + 4,
    state: 'open',
    terms,
  }
  world.offers.push(offer)
  signOffer(world.offers, offer.id, world.week)
  return terms
}

describe('the fixture is what it claims to be', () => {
  it('eighteen-plus, professionally ranked, with a ramp that is really paying', () => {
    expect(ageOf(life.world)).toBeGreaterThanOrEqual(ECONOMY.kidShare.fromAgeYears)
    expect(kidPrizeShareBps(ageOf(life.world)), 'the ramp is on at this age').toBeGreaterThan(0)
    // The advertising dice hit inside the window, so §1 has a real letter to sign. A retuned
    // `offerChance` fails HERE rather than silently leaving §1 testing nothing.
    expect(life.hit).toBeGreaterThan(0)
  })
})

// =================================================================================================
// 1 – THE CASH SPONSOR DEAL: signing one moves her account by the ruled share
// =================================================================================================
describe('§1 a cash sponsor deal', () => {
  it('⭐⭐ signing pays her the ramp\'s share of the campaign fee, and the family the rest', () => {
    const world = structuredClone(life.world)
    const offer = world.offers.find((o) => o.kind === 'ad')!
    expect(offer, 'a letter is on the table to sign').toBeDefined()

    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents
    // ⚠ THE EXPECTATION IS THE SHIPPED RAMP AT HER REAL AGE, never a literal: retuning
    // `ECONOMY.kidShare` must move the game and this test together, and only a change to the RULE
    // should redden it.
    const hers = kidPrizeShareCents(AD.cashCents, ageOf(world))
    expect(hers, 'the arm contains the thing it is measuring').toBeGreaterThan(0)

    acceptOffer(world, offer.id)

    expect((world.kidFundsCents ?? 0) - kidBefore, 'her account moved by the ruled share').toBe(hers)
    expect(world.fundsCents - fundsBefore, 'and the family banked the remainder').toBe(AD.cashCents - hers)
    // ⚠ ONE ROUNDING: the two halves re-add to the brand's cheque to the cent, which is the property
    // a player can check by putting the two balances side by side on screen.
    expect((world.kidFundsCents ?? 0) - kidBefore + (world.fundsCents - fundsBefore)).toBe(AD.cashCents)
  })

  it('⭐ ...and in the actual money, at the actual rate, written out', () => {
    // ⚠⚠ THIS ONE IS PINNED TO LITERALS ON PURPOSE, and it is the only test in the file that is.
    // Every other assertion here asks `kidPrizeShareCents` for the expectation, which is right for a
    // retune – the game moves and the test moves with it – but it also means NO other test in this
    // file can see the RATE change. A rule whose rate can be moved without a single red test is not
    // covered. So: her first year is 10% (`ECONOMY.kidShare.startBps`), the campaign fee is $20,000,
    // and that is $2,000 to her and $18,000 to the family. Move the ramp and this reddens, which is
    // exactly what it is for – re-aim it deliberately, the way the ramp's own ladder pin in
    // tests/round23-kid-share.test.ts is re-aimed.
    const world = structuredClone(life.world)
    expect(ageOf(world), 'the fixture is in her first year on the ramp').toBe(18)
    expect(kidPrizeShareBps(18), 'and the first year is ten percent').toBe(1000)
    expect(AD.cashCents, 'the campaign fee is twenty thousand dollars').toBe(20_000_00)

    const offer = world.offers.find((o) => o.kind === 'ad')!
    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents
    acceptOffer(world, offer.id)
    expect((world.kidFundsCents ?? 0) - kidBefore, 'two thousand dollars, hers').toBe(2_000_00)
    expect(world.fundsCents - fundsBefore, 'eighteen thousand, the family\'s').toBe(18_000_00)
    // ...and the row says so in words, at the rate a player can read against the figure beside it.
    const row = world.events.find((e) => e.week === world.week && e.category === 'sponsor')
    // `formatCents` drops a zero cents part, exactly as the prize row's own share clause does.
    expect(row?.text).toContain('less her 10% share ($2,000)')
  })

  it('the transfer is on the durable ledger too, at the rate that produced it', () => {
    const world = structuredClone(life.world)
    const offer = world.offers.find((o) => o.kind === 'ad')!
    const hers = kidPrizeShareCents(AD.cashCents, ageOf(world))
    acceptOffer(world, offer.id)

    // `financeWeeks` prunes on a 60-week window and therefore always holds the week being read –
    // the reason the week recap's memo comes from here and not from the count-capped event feed.
    const week = world.financeWeeks.find((f) => f.week === world.week)
    expect(week?.kidShare?.cents, 'the memo carries the very cents her account received').toBe(hers)
    expect(week?.kidShare?.bps, 'and the rate that produced them').toBe(kidPrizeShareBps(ageOf(world)))
    // ⚠ AND IT IS A MEMO, NOT A CATEGORY: `byCategory` may never learn about her share, or every
    // income total on every screen would count the split twice. The sponsor row is the NET one.
    expect(week?.byCategory.sponsor).toBe(AD.cashCents - hers)
  })

  it('...and not one cent of it before her eighteenth', () => {
    // The same signing, on a world wound back below the threshold birthday. ⚠ The AGE is what is
    // varied and nothing else, so a green here is about the ramp's floor rather than about a
    // different career.
    const world = structuredClone(life.world)
    const offer = world.offers.find((o) => o.kind === 'ad')!
    // Her birthday is her own; moving the world's week back a whole year moves her age by one.
    world.week -= WEEKS_PER_YEAR
    offer.week = world.week
    offer.deadlineWeek = world.week + AD.decideWeeks - 1
    expect(ageOf(world), 'the arm really is under eighteen').toBeLessThan(ECONOMY.kidShare.fromAgeYears)

    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents
    acceptOffer(world, offer.id)
    expect(world.kidFundsCents ?? 0, 'her account does not exist yet').toBe(kidBefore)
    expect(world.fundsCents - fundsBefore, 'and the family banks the whole fee').toBe(AD.cashCents)
    // The row says nothing about a share, because there was none to name.
    const row = world.events.find((e) => e.week === world.week && e.category === 'sponsor')
    expect(row?.text).not.toContain('share')
  })
})

// =================================================================================================
// 2 – THE OTHER THREE CHEQUES THE RULING REACHES
// =================================================================================================
describe('§2 the retainer, the appearance fee and the result bonus', () => {
  it('the quarterly retainer is split at the same ramp', () => {
    const world = structuredClone(life.world)
    const terms = signKit(world, 'icon')
    // Stand on a real pay week – `payRetainer` returns early on every other one, and an arm that
    // never pays would pass this test with the feature deleted.
    while (!isRetainerWeek(world.week)) world.week++
    expect(isRetainerWeek(world.week)).toBe(true)

    const hers = kidPrizeShareCents(terms.retainerCents ?? 0, ageOf(world))
    expect(hers).toBeGreaterThan(0)
    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents

    payRetainer(world)

    expect((world.kidFundsCents ?? 0) - kidBefore).toBe(hers)
    expect(world.fundsCents - fundsBefore).toBe((terms.retainerCents ?? 0) - hers)
  })

  it('the appearance fee and the result bonus are split at the same ramp', () => {
    // ⚠ ASKED OF THE SHIPPED PRICE FUNCTIONS rather than of a number typed here, so a retuned
    // catalogue cannot leave this arm measuring a cheque the engine no longer writes.
    const world = structuredClone(life.world)
    signKit(world, 'icon')
    const fee = appearanceFeeFor(world, 'wta250')
    const bonus = resultBonusFor(world, 'wta250', 0)
    expect(fee, 'the icon rung really pays an appearance fee at this rung').toBeGreaterThan(0)
    expect(bonus, 'and a title bonus').toBeGreaterThan(0)

    for (const cheque of [fee, bonus]) {
      const w = structuredClone(world)
      const hers = kidPrizeShareCents(cheque, ageOf(w))
      const kidBefore = w.kidFundsCents ?? 0
      const fundsBefore = w.fundsCents
      bankSponsorCheque(w, cheque, { category: 'income', text: 'a cheque' })
      expect((w.kidFundsCents ?? 0) - kidBefore).toBe(hers)
      expect(w.fundsCents - fundsBefore).toBe(cheque - hers)
    }
  })

  it('a week that pays twice SUMS her memo rather than overwriting it', () => {
    // A title week really does pay a prize, an appearance fee and a bonus, so this is the ordinary
    // case and not an edge one. `accrueKidShare` sums by design; this is the assertion that says so.
    const world = structuredClone(life.world)
    const first = bankSponsorCheque(world, 10_000_00, { category: 'income', text: 'one' })
    const second = bankSponsorCheque(world, 4_000_00, { category: 'income', text: 'two' })
    const week = world.financeWeeks.find((f) => f.week === world.week)
    expect(week?.kidShare?.cents).toBe(first.herCents + second.herCents)
  })
})

// =================================================================================================
// 3 – AND THE MONEY THAT IS NOT HERS MOVES HER ACCOUNT BY ZERO
// =================================================================================================
describe('§3 the sponsor money that is NOT a cheque to her', () => {
  it('⭐⭐ the kit allowance buys her rackets and never touches her account', () => {
    // The allowance is spent on her equipment inside `settleSponsors` / the kit lines; it is a cost
    // cover, not a cheque, and a cut of it would leave her half a racket. ⚠ THE ARM CONTAINS THE
    // THING IT IS PROVING ABSENT: the deal really carries an allowance, and a season of ticks really
    // runs the sponsor settle.
    const world = structuredClone(life.world)
    const terms = signKit(world, 'icon')
    expect(terms.kitAllowanceCents, 'there really is an allowance to be tempted by').toBeGreaterThan(0)

    const rng = resumeMain(world.rngMain)
    const kidBefore = world.kidFundsCents ?? 0
    const share = kidPrizeShareCents(terms.retainerCents ?? 0, ageOf(world))

    // A full season of real weeks. Every week her account moves is recorded with the amount, and the
    // claim is read off that record afterwards rather than guessed at per tick – which also keeps
    // the arm free of an off-by-one about whether `tickWeek` pays before or after it advances.
    const moved: { week: number; cents: number }[] = []
    for (let i = 0; i < WEEKS_PER_YEAR; i++) {
      const before = world.kidFundsCents ?? 0
      tickWeek(world, rng)
      const delta = (world.kidFundsCents ?? 0) - before
      if (delta !== 0) moved.push({ week: world.week, cents: delta })
    }

    // ⚠⚠ THE ARM CONTAINS THE THING IT IS PROVING ABSENT, and this is the assertion that says so:
    // the brand really did pick up gear this season. `deal.coveredCents` is the allowance actually
    // consumed at the till (world/phaseFinance.ts), so a walk where the allowance was never touched
    // – which would make the whole test vacuous – fails HERE rather than passing silently.
    const signed = world.offers.find((o) => o.kind === 'kit' && o.state === 'signed')
    expect(signed?.coveredCents ?? 0, 'the brand really bought her kit this season').toBeGreaterThan(0)

    // ⚠ THE CLAIM: this season spent an allowance, covered her fares and bought kit lines – and the
    // ONLY thing in any of it that reached her account is the quarterly cheque. She enters nothing,
    // so no prize, appearance fee or result bonus can be mistaken for one here.
    for (const m of moved) {
      expect(isRetainerWeek(m.week), `w${m.week} moved her account and is not a pay week`).toBe(true)
      expect(m.cents, `w${m.week} moved by something other than the retainer's share`).toBe(share)
    }
    // ...and she really was paid at least once, so the season is not silently proving nothing.
    // ⚠ AT LEAST ONE RATHER THAN FOUR: `dealUntilWeek` ends a one-season term with the season she
    // signed in, so a deal signed mid-year covers fewer than four of the quarterly pay weeks. The
    // count is not the claim; what moved her account is.
    expect(moved.length, 'the retainer really paid inside the term').toBeGreaterThanOrEqual(1)
    expect((world.kidFundsCents ?? 0) - kidBefore, 'and by exactly the ramp, every time').toBe(share * moved.length)
  })

  it('⭐⭐ the local sponsor cameo is a rescue written to the FAMILY, and she takes none of it', () => {
    // Need-based by the owner's own gate («порог по деньгам на счету, а не по строчке в анкете»).
    // Taking a cut of a rescue is the opposite of what the rescue is for.
    //
    // ⚠ THE CAMEO IS DRIVEN THROUGH THE REAL TICK, not simulated by adding cents here: a hand-added
    // gift would prove nothing about the code path. The family is put into need (an empty account is
    // inside `sponsorNeedMet`'s runway by construction) and the walk runs until its own dice fire.
    const world = structuredClone(life.world)
    const rng = resumeMain(world.rngMain)
    let paid = false
    for (let i = 0; i < WEEKS_PER_YEAR * 2 && !paid; i++) {
      world.fundsCents = 0 // held in need every week, so only the roll decides
      const kidBefore = world.kidFundsCents ?? 0
      tickWeek(world, rng)
      const gift = world.events.find((e) => e.week === world.week - 1 && e.text === 'A local sponsor chipped in!')
      if (gift) {
        paid = true
        expect(gift.amountCents ?? 0, 'the cameo really paid something').toBeGreaterThan(0)
        expect(world.kidFundsCents ?? 0, 'and her account took none of it').toBe(kidBefore)
      }
    }
    // ⚠ THE ARM HAS TO CONTAIN THE THING IT IS PROVING ABSENT: a walk the cameo never fired on would
    // pass this test with the whole gate deleted.
    expect(paid, 'the cameo fired at least once in two seasons of need').toBe(true)
  })

  it('the travel share reduces a FARE, so there is no cheque for a ramp to act on', () => {
    // A cover is a price going down, not money arriving. The claim is structural and it is asserted
    // as such: the cover is real (it really reduces `travelCostFor`), and no balance moves from
    // holding it – there is nothing to split because nothing was paid.
    const world = structuredClone(life.world)
    const terms = signKit(world, 'icon')
    expect(terms.travelShare, 'the icon rung really covers travel').toBeGreaterThan(0)
    const probe = { travelCostCents: 10_000_00 } as SeasonEvent
    expect(travelCostFor(world, probe), 'and the cover really bites on a fare').toBeLessThan(probe.travelCostCents)
    // Signing it moved neither balance: a discount is not a cheque.
    expect(world.kidFundsCents ?? 0).toBe(life.world.kidFundsCents ?? 0)
    expect(world.fundsCents).toBe(life.world.fundsCents)
  })
})

// =================================================================================================
// 4 – THE ONE FIGURE THE RULING MOVES: the coach market's weekly income cap
// =================================================================================================
describe('§4 the coaching cap quotes what the till actually banks', () => {
  it('⭐ the weekly income is NET of her cut of the retainer, not the gross', () => {
    // ⚠ THIS IS THE ROUND-21 #12 DEFECT IN MIRROR IMAGE. That item was the cap UNDER-reading the
    // family's income; leaving the gross retainer in it after this ruling would make it OVER-read by
    // exactly her share, every week, for the rest of the career.
    const world = structuredClone(life.world)
    const terms = signKit(world, 'icon')
    const gross = terms.retainerCents ?? 0
    const hers = kidPrizeShareCents(gross, ageOf(world))
    expect(hers).toBeGreaterThan(0)

    const quoted = familyWeeklyIncomeCents(world)
    // Rebuild the figure from its parts: the two streams that did not move, plus the NET retainer
    // pro-rated across the year exactly as the shipped function does.
    const noDeal = { ...world, offers: world.offers.filter((o) => o.kind !== 'kit') }
    const withoutKit = familyWeeklyIncomeCents(noDeal as WorldState)
    expect(quoted - withoutKit).toBe(Math.round(((gross - hers) * 4) / WEEKS_PER_YEAR))
    // ...and it really is smaller than the gross quote would have been, by a figure a player would
    // notice. This is the assertion that reddens if the netting is taken back out.
    expect(quoted).toBeLessThan(withoutKit + Math.round((gross * 4) / WEEKS_PER_YEAR))

    // ⚠ AND THE SIZE OF IT, IN MONEY, PINNED – the same reason §1 carries one literal test. The icon
    // rung pays $37,500 a quarter; at her first 10% that is $3,750 hers, so the family's pro-rated
    // weekly quote falls from $2,884.62 to $2,596.15 – $288.47 a week. A ramp that moved without a
    // red test here would move this cap silently for the rest of the career.
    expect(gross, 'the icon retainer is thirty-seven and a half thousand a quarter').toBe(37_500_00)
    expect(hers, 'and a tenth of it is hers in her first year').toBe(3_750_00)
    expect(quoted - withoutKit, 'so the cap gains $2,596.15 a week and not $2,884.62').toBe(2_596_15)
  })

  it('a family with no kit deal is untouched by any of this', () => {
    // THE SCOPE OF THE CHANGE, STATED AS AN ASSERTION: most families hold no deal – every one below
    // the tour rung, and every junior career – and for them the cap is the number it always was,
    // whatever the ramp is doing. Asserted as "the figure is those two streams and no third term",
    // which is the only form that stays true when the ramp is retuned.
    const world = structuredClone(life.world)
    expect(world.offers.some((o) => o.kind === 'kit' && o.state === 'signed'), 'no deal on this career').toBe(false)
    expect(kidPrizeShareBps(ageOf(world)), 'and the ramp IS running – she is eighteen').toBeGreaterThan(0)

    // ⚠ RE-AIMED BY ROUND 29 #12 – ONE stream now, not two: the savings interest left this figure
    // with the accrual. The claim this arm makes is unchanged in kind («no third term, and nothing
    // taken off»); it is the list of streams that got shorter.
    const parents = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
    expect(familyWeeklyIncomeCents(world), 'the one stream, and nothing taken off it').toBe(parents)
  })
})
