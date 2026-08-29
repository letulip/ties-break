// ROUND 28 ITEM 15 – HER CUT REACHES THE SPONSORS' CHEQUES.
//
// ⚠⚠⚠ RE-AIMED BY ROUND 29 PART THREE P3, 29.08, AND NOT ONE ARM DELETED. The owner: «как менеджер
// может от этого что-то получать в свою очередь. 10-20% например… контракт на полную сумму ребенку
// приходит на почту, после подписания видим на счету уже родительский кат.» So round 28 #15's
// ruling – «с чеков спонсоров ребёнку тоже нужно %» – STANDS and is if anything stronger: her share
// of a sponsor cheque went from the ramp's slice to nearly all of it. What changed is the RATE and
// its DIRECTION: the family now takes `managerCommissionBps()` and she takes the remainder.
//
// ⚠ SO EVERY ARM BELOW STILL ASKS ITS ORIGINAL QUESTION and only its expectation moved:
//   §1/§2  «which cheques reach her account, and does the arithmetic re-add to the cent» – yes, at
//          the commission's complement instead of the ramp.
//   §3     UNTOUCHED IN KIND. The scope half is the half P3 does not go near: the allowance, the
//          cameo and the travel share are still not cheques, and still move her account by zero.
//   §4     the same correctness claim about the coach market's cap, against the new splitter.
//   ⚠ The one arm that INVERTED is §1's «not one cent before her eighteenth», and that inversion is
//     the ruling itself rather than a broken test – see the note on it.
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
// ⚠⚠ THE MUTATION LOG BELOW IS ROUND 28'S, KEPT AS THE RECORD OF WHY EACH ARM EXISTS; the rates it
// names are the ramp's. ROUND 29 P3's own re-measurement, each mutation applied alone and reverted:
//   a. `ECONOMY.managerCommission.bps` 1500 -> 2000 -> the two literal-pinned arms redden (§1's «in
//      the actual money», §4's «$433.65 a week») and NOTHING else, which is exactly the split of
//      duties round 28 measured: every other arm asks the engine for its expectation and is
//      therefore correct-but-blind under a retune.
//   b. `bankSponsorCheque` reverted to the ramp (`kidPrizeShareCents` at her age) -> §1's four, §2's
//      first two and §3's allowance walk redden (7). §3's cameo and travel arms stay green,
//      correctly – they assert an absence that both rules keep.
//   c. an AGE GATE re-added to `bankSponsorCheque` (`if (age < 18) family keeps all`) -> §1's
//      under-eighteen arm reddens ALONE. That is the arm the ruling inverted, doing its new job.
//   d. `familyWeeklyIncomeCents` restored to the ramp -> §4 alone reddens.
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
import { adCategoryOf, adWritesAt, kitTermsFor, signOffer } from '../src/engine/offers'
import { ECONOMY, kidPrizeShareBps, managerCommissionBps, managerCommissionCents, parentIncomeForWeekCents } from '../src/engine/economy'
/** ⭐ WHAT SHE KEEPS OF A SPONSOR CHEQUE UNDER P3 – the remainder after the manager's fee, computed
 *  the way the engine computes it (one rounding on the FEE, hers by subtraction) rather than by a
 *  second `Math.round` that would disagree with the till by a cent on half the cheques. */
const hersOf = (grossCents: number): number => grossCents - managerCommissionCents(grossCents)
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AdOfferTerms, type KitOfferTerms, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising
/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20) AND THEN A PORTFOLIO (part four
 *  P6/§8). Every claim in this file is about the shipped watch deal's SHAPE – a watchmaker,
 *  $20,000, two shoot weeks over a one-year term – and papers exactly like it are persisted in
 *  real saves, so `WATCH` freezes that LEGACY paper here: the fee read off the watches category's
 *  ≤200 cell (the anchor, unchanged to the cent), the brand its first house, the term and the
 *  two-shoot ask as the old letters carry them. `AD` still carries the mechanics every house
 *  shares (the age bar, the weekly chance, the decide weeks, the lead, the clash price). */
const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  maxWtaRank: ECONOMY.advertising.bands[0].maxWtaRank,
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[0]!,
  termWeeks: 52,
  shootWeeksPerTerm: 2,
}

/** Her age this week, off the world's own clock – the same read every gate makes. */
const ageOf = (world: WorldState): number =>
  kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)

/** A counting professional result – the `proWorld` fixture idiom, so `wtaRanked` is true and the
 *  table holds a real rank. Copied from tests/ad-offer.test.ts, which is where the gate lives. */
function pushBook(world: WorldState): void {
  // ⚠⚠ 100_000 -> 400, AND IT IS A RE-AIM RATHER THAN A TUNE (round 29 part two #19/#20). The
  // advertising catalogue became a LADDER, so which house writes now depends on where she stands,
  // and 100,000 points put this fixture at world #1 – the top rung. Every claim in this file is
  // about the rung that shipped (Quiet Hour, $20,000, two shoot weeks), so the fixture is moved to
  // the band that rung is FOR rather than the assertions being moved to whatever arrives: 400
  // points is world #183, inside `houses.watch.maxWtaRank` and outside `campaign`'s. The band is
  // asserted as a fixture fact below, so a retuned table that moves her out of it fails there
  // instead of quietly testing a different house.
  world.results.push({ playerId: KID_ID, week: world.week, points: 400, tier: 'w100' })
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

/** The first week at or after `from` whose own dice say the WATCHES house writes – the portfolio
 *  rolls per category (P6) and this file's cash claims are about the anchor cell's letter. -1 for
 *  none. */
function firstAdRollFrom(seed: string, from: number, limit: number): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance, 'watches')) return w
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
  it('⭐⭐ signing pays her the fee less the manager\'s commission, and the family that commission', () => {
    const world = structuredClone(life.world)
    const offer = world.offers.find(
      (o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === 'watches' && o.state === 'open',
    )!
    expect(offer, 'a letter is on the table to sign').toBeDefined()

    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents
    // ⚠ THE EXPECTATION IS THE SHIPPED COMMISSION, never a literal: retuning
    // `ECONOMY.managerCommission` must move the game and this test together, and only a change to
    // the RULE should redden it. ⚠ P3 SWAPPED WHICH SIDE IS COMPUTED AND WHICH IS THE REMAINDER –
    // the fee rounds and she takes the rest – so `hersOf` is a subtraction and not a second rounding.
    const hers = hersOf(WATCH.cashCents)
    expect(hers, 'the arm contains the thing it is measuring').toBeGreaterThan(0)

    acceptOffer(world, offer.id)

    expect((world.kidFundsCents ?? 0) - kidBefore, 'her account took the fee less the commission').toBe(hers)
    expect(world.fundsCents - fundsBefore, 'and the family banked the commission').toBe(WATCH.cashCents - hers)
    // ⭐ AND THE DIRECTION HIS RULING IS ABOUT, ASSERTED RATHER THAN IMPLIED: the money is HERS. A
    // silent revert to the ramp would leave every equality above true of the other side.
    expect(hers, 'she keeps the larger half – that is the ruling').toBeGreaterThan(WATCH.cashCents - hers)
    // ⚠ ONE ROUNDING: the two halves re-add to the brand's cheque to the cent, which is the property
    // a player can check by putting the two balances side by side on screen.
    expect((world.kidFundsCents ?? 0) - kidBefore + (world.fundsCents - fundsBefore)).toBe(WATCH.cashCents)
  })

  it('⭐ ...and in the actual money, at the actual rate, written out', () => {
    // ⚠⚠ THIS ONE IS PINNED TO LITERALS ON PURPOSE, and it is the only test in the file that is.
    // Every other assertion here asks `kidPrizeShareCents` for the expectation, which is right for a
    // retune – the game moves and the test moves with it – but it also means NO other test in this
    // file can see the RATE change. A rule whose rate can be moved without a single red test is not
    // covered. ⚠ RE-AIMED BY P3 AND STILL THE ONLY LITERAL ARM: the manager's commission is 15%
    // (`ECONOMY.managerCommission.bps`, provisional inside his «10-20% например»), the campaign fee
    // is $20,000, and that is $3,000 to the family and $17,000 to her. Move the rate and this
    // reddens, which is exactly what it is for – re-aim it deliberately, the way the ramp's own
    // ladder pin in tests/round23-kid-share.test.ts is re-aimed.
    const world = structuredClone(life.world)
    expect(ageOf(world), 'the fixture is eighteen – the age the OLD rule turned on').toBe(18)
    expect(managerCommissionBps(), 'and the shipped commission is fifteen percent').toBe(1500)
    expect(WATCH.cashCents, 'the campaign fee is twenty thousand dollars').toBe(20_000_00)

    const offer = world.offers.find(
      (o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === 'watches' && o.state === 'open',
    )!
    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents
    acceptOffer(world, offer.id)
    expect((world.kidFundsCents ?? 0) - kidBefore, 'seventeen thousand dollars, hers').toBe(17_000_00)
    expect(world.fundsCents - fundsBefore, 'three thousand, the manager\'s').toBe(3_000_00)
    // ...and the row says so in words, at the rate a player can read against the figure beside it.
    const row = world.events.find((e) => e.week === world.week && e.category === 'sponsor')
    // ⚠ THE ROW NAMES THE FEE AND THE GROSS, not a deduction: the figure ON the row IS the parent's
    // cut now, so the old «less her N% share» wording would have described the wrong arithmetic.
    // `formatCents` drops a zero cents part, exactly as the prize row's own share clause does.
    expect(row?.text).toContain("the manager's 15% of $20,000")
    expect(row?.text, 'and it no longer reads as a subtraction from the family').not.toContain('less her')
  })

  it('the transfer is on the durable ledger too, at the rate that produced it', () => {
    const world = structuredClone(life.world)
    const offer = world.offers.find(
      (o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === 'watches' && o.state === 'open',
    )!
    const hers = hersOf(WATCH.cashCents)
    acceptOffer(world, offer.id)

    // `financeWeeks` prunes on a 60-week window and therefore always holds the week being read –
    // the reason the week recap's memo comes from here and not from the count-capped event feed.
    const week = world.financeWeeks.find((f) => f.week === world.week)
    expect(week?.kidShare?.cents, 'the memo carries the very cents her account received').toBe(hers)
    // ⚠ RE-AIMED BY P3: `bps` is the week's EFFECTIVE rate now (see `accrueKidShare`'s header), and
    // on a week with one sponsor cheque and no prize that is the commission's complement exactly.
    expect(week?.kidShare?.bps, 'and the rate that produced them').toBe(10_000 - managerCommissionBps())
    // ⚠ AND IT IS A MEMO, NOT A CATEGORY: `byCategory` may never learn about her share, or every
    // income total on every screen would count the split twice. The sponsor row is the NET one.
    expect(week?.byCategory.sponsor).toBe(WATCH.cashCents - hers)
  })

  it('⭐⭐ ...and P3 INVERTED THIS ARM: the commission has no age term at all', () => {
    // ⚠⚠ THIS ARM USED TO ASSERT THE OPPOSITE AND IT WAS RE-AIMED, NOT DELETED, BECAUSE THE RULING
    // IS WHAT MOVED. Round 28 shipped her ramp onto sponsor cheques, and a ramp that starts at
    // eighteen means the family kept 100% of every sponsor cheque before it – which is most of what
    // made the measured «the parent keeps 63.1% of gross sponsor money» so much higher than the 50%
    // everybody quoted. P3 replaced the ramp with a flat manager's fee, and «контракт на полную
    // сумму ребенку» has no birthday in it. So the claim is now the ABSENCE of an age term, which is
    // the mutation an age gate re-added to `bankSponsorCheque` reddens alone.
    // ⚠ The AGE is still the only thing varied, so a green here is about the rule's age-independence
    // rather than about a different career.
    const world = structuredClone(life.world)
    const offer = world.offers.find(
      (o) => o.kind === 'ad' && adCategoryOf(o.terms as AdOfferTerms) === 'watches' && o.state === 'open',
    )!
    // Her birthday is her own; moving the world's week back a whole year moves her age by one.
    world.week -= WEEKS_PER_YEAR
    offer.week = world.week
    offer.deadlineWeek = world.week + AD.decideWeeks - 1
    expect(ageOf(world), 'the arm really is under eighteen').toBeLessThan(ECONOMY.kidShare.fromAgeYears)

    expect(kidPrizeShareBps(ageOf(world)), 'and the PRIZE ramp really is dormant at this age').toBe(0)

    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents
    acceptOffer(world, offer.id)
    expect((world.kidFundsCents ?? 0) - kidBefore, 'the cheque is hers at seventeen exactly as at eighteen').toBe(
      hersOf(WATCH.cashCents),
    )
    expect(world.fundsCents - fundsBefore, 'and the family banks the same commission').toBe(
      managerCommissionCents(WATCH.cashCents),
    )
    // The row names the fee here too – there is one to name at every age.
    const row = world.events.find((e) => e.week === world.week && e.category === 'sponsor')
    expect(row?.text).toContain("the manager's")
  })
})

// =================================================================================================
// 2 – THE OTHER THREE CHEQUES THE RULING REACHES
// =================================================================================================
describe('§2 the retainer, the appearance fee and the result bonus', () => {
  it('the quarterly retainer is split at the same commission', () => {
    const world = structuredClone(life.world)
    const terms = signKit(world, 'icon')
    // Stand on a real pay week – `payRetainer` returns early on every other one, and an arm that
    // never pays would pass this test with the feature deleted.
    while (!isRetainerWeek(world.week)) world.week++
    expect(isRetainerWeek(world.week)).toBe(true)

    const hers = hersOf(terms.retainerCents ?? 0)
    expect(hers).toBeGreaterThan(0)
    const kidBefore = world.kidFundsCents ?? 0
    const fundsBefore = world.fundsCents

    payRetainer(world)

    expect((world.kidFundsCents ?? 0) - kidBefore).toBe(hers)
    expect(world.fundsCents - fundsBefore).toBe((terms.retainerCents ?? 0) - hers)
  })

  it('the appearance fee and the result bonus are split at the same commission', () => {
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
      const hers = hersOf(cheque)
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

    // A full season of real weeks. Every week her account moves is recorded with the amount AND what
    // the retainer owed her that week. ⚠ RE-AIMED BY P3: `owed` used to step with her birthday
    // because the ramp did (the first draft of this walk froze the share at the start and reddened
    // on the step); the commission has no age term, so it is now constant across the walk – kept as a
    // per-week record anyway, because the claim is read off it afterwards rather than guessed at per
    // tick, which keeps the arm free of an off-by-one about whether `tickWeek` pays before or after
    // it advances.
    const moved: { week: number; cents: number; owed: number }[] = []
    for (let i = 0; i < WEEKS_PER_YEAR; i++) {
      const before = world.kidFundsCents ?? 0
      tickWeek(world, rng)
      const delta = (world.kidFundsCents ?? 0) - before
      if (delta !== 0) moved.push({ week: world.week, cents: delta, owed: hersOf(terms.retainerCents ?? 0) })
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
      expect(m.cents, `w${m.week} moved by something other than the retainer's share`).toBe(m.owed)
    }
    // ...and she really was paid at least once, so the season is not silently proving nothing.
    // ⚠ AT LEAST ONE RATHER THAN FOUR: `dealUntilWeek` ends a one-season term with the season she
    // signed in, so a deal signed mid-year covers fewer than four of the quarterly pay weeks. The
    // count is not the claim; what moved her account is.
    expect(moved.length, 'the retainer really paid inside the term').toBeGreaterThanOrEqual(1)
    expect((world.kidFundsCents ?? 0) - kidBefore, 'and by exactly the commission\'s complement, every time').toBe(
      moved.reduce((sum, m) => sum + m.owed, 0),
    )
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
  it('⭐ the weekly income is what the till BANKS of the retainer, not the gross', () => {
    // ⚠ THIS IS THE ROUND-21 #12 DEFECT IN MIRROR IMAGE. That item was the cap UNDER-reading the
    // family's income; leaving the gross retainer in it after this ruling would make it OVER-read by
    // exactly her share, every week, for the rest of the career. ⚠ RE-AIMED BY P3 AND THE CLAIM IS
    // UNCHANGED IN KIND – «the meter reads what the till banks» – while what the till banks went
    // from the ramp's remainder to the manager's fee, which is a far bigger correction.
    const world = structuredClone(life.world)
    const terms = signKit(world, 'icon')
    const gross = terms.retainerCents ?? 0
    const hers = hersOf(gross)
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
    // rung pays $37,500 a quarter; at the manager's 15% that is $5,625 to the family, so the
    // pro-rated weekly quote is $433 against the gross quote's $2,884.62. ⚠ P3 MADE THIS THE LARGEST
    // single number this ruling moves on a screen: the cap fell by roughly six sevenths of the
    // retainer term. A rate that moved without a red test here would move it silently for the rest
    // of the career.
    expect(gross, 'the icon retainer is thirty-seven and a half thousand a quarter').toBe(37_500_00)
    expect(managerCommissionCents(gross), 'and fifteen percent of it is the family\'s').toBe(5_625_00)
    expect(quoted - withoutKit, 'so the cap gains $433 a week and not $2,884.62').toBe(
      Math.round((5_625_00 * 4) / WEEKS_PER_YEAR),
    )
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
