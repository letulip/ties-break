// ⭐⭐⭐ ROUND 39 #17 – THE APPAREL BOND: the house that dresses her is the house that shoots her.
//
// THE OWNER, 08.09: «если у нас есть контракт на 3+ лет на фото от того же Meridian Sport, то если в
// межсезонье она решит подписать другого спонсора, то контракт обнулится… по умолчанию фото спонсор
// одежды уже будет ее снабжать гарантированно и будет возможность переподписывать с ним контракт до
// истечения фото контракта… А игрок уже сам будет решать с кем подписывать.»
//
// The clothing campaign was ALREADY authored by the live kit deal's brand («двойной программой»);
// what did not exist is any re-reading of that bond after signature. Measured before it was built
// (`tools/r39-apparel-bond.ts`, 54 careers x 900 weeks): 68.8% of signed clothing campaigns outlive
// the kit deal that wrote them, by a MEDIAN of 53 weeks – a whole season – and by up to 247. Not one
// of them outlived it by under five weeks, so this is structural and not a calendar seam.
//
// SIX RULINGS ARE THE SPEC, and each has its own section below:
//   1. the termination trigger is signing a DIFFERENT house, NEVER «no live kit deal» (§3);
//   2. the guaranteed letter carries her CURRENT standing's terms, never the expired deal's (§2);
//   3. «обнулится» = it ends; everything banked stays banked, no clawback (§4);
//   4. the LIFETIME letter is exempt, and its house dresses her free for life (§5, §6);
//   5. the reverse order owes no guarantee and charges no price (§7);
//   6. only a CLOTHING campaign creates the bond (§8).
//
// ⚠ RNG: the guarantee BYPASSES the arrival roll and does not add one – §1's last case proves the
// other rungs' dice are untouched by replaying their letters with and without the campaign. No
// `rngFromSeed` is added to engine/offers.ts, which tests/offers.test.ts' closed allowlist enforces,
// and nothing here touches MAIN – tests/condition.test.ts (41550 / e6b0c709) is the standing witness.
import { describe, expect, it } from 'vitest'
import {
  activeAdDeals,
  adAnniversariesLeft,
  adCampaignCutShort,
  apparelBondCost,
  kitTermsFor,
  lifetimeKitHouse,
  offerChanceFor,
  raiseKitOffers,
  runningClothingCampaign,
  rungFor,
  shopWritesAt,
  signOffer,
  sponsorTierOfBrand,
  sponsorWindowOpensAt,
  type SponsorStanding,
} from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { createWorld, kitPurchaseSplit, setKitGrade, tickWeek, KID_ID, type WorldState } from '../src/engine/world'
import { reviewSponsors } from '../src/engine/world/sponsors'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type AdCategory, type AdOfferTerms, type KitOfferTerms, type Offer } from '../src/shared/protocol'

const S = ECONOMY.sponsorship
const FEE = 100_000_00

/** Where she stands, as the ladder reads it – professional rank only, which is what the upper rungs
 *  read and the only axis these cases move. */
function standingAt(wtaRank: number): SponsorStanding {
  return { nationalRank: 400, itfRank: 999, itfRanked: false, wtaRank, wtaRanked: true }
}

/** A signed advertising campaign, built by hand so a case can name its category, its house and its
 *  term exactly. The shape is `raiseAdOffer`'s paper plus what `signOffer`'s ad arm writes onto it. */
function campaign(args: {
  category: AdCategory
  brand: string
  from: number
  years: number
  lifetime?: true
}): Offer {
  const { category, brand, from, years } = args
  const terms: AdOfferTerms = args.lifetime
    ? { category, brand, trade: 'We make her kit', cashCents: FEE, lifetime: true, termWeeks: 0, shootCount: 0 }
    : {
        category,
        brand,
        trade: 'We make her kit',
        cashCents: FEE,
        termYears: years,
        termWeeks: years * WEEKS_PER_YEAR,
        shootCount: 1,
      }
  return {
    id: `ad-${category}-${from}`,
    kind: 'ad',
    week: from,
    deadlineWeek: from + 4,
    terms,
    state: 'signed',
    decidedWeek: from,
    fromWeek: from,
    ...(args.lifetime ? {} : { untilWeek: from + years * WEEKS_PER_YEAR - 1 }),
  }
}

/** A signed kit deal at a named rung, running to `until`. */
function kitDeal(tier: 'local' | 'national' | 'tour' | 'global' | 'premium' | 'icon', from: number, until: number): Offer {
  const terms = kitTermsFor(standingAt(5), tier)!
  return {
    id: `kit-old-${from}`,
    kind: 'kit',
    week: from,
    deadlineWeek: from + 4,
    terms,
    state: 'signed',
    decidedWeek: from,
    fromWeek: from,
    untilWeek: until,
    coveredCents: 0,
  }
}

/** An unsigned kit letter from a named rung, the paper a parent would actually be handed. */
function kitLetter(id: string, tier: 'tour' | 'premium' | 'icon' | 'global', week: number): Offer {
  return {
    id,
    kind: 'kit',
    week,
    deadlineWeek: week + 4,
    terms: kitTermsFor(standingAt(5), tier)!,
    state: 'open',
  }
}

const bondLetter = (offers: Offer[], opened: number): Offer | undefined =>
  offers.find((o) => o.id === `kit-bond-${opened}`)

// =================================================================================================
describe('round 39 #17 §1 – THE GUARANTEE: the house shooting her campaign writes, dice or no dice', () => {
  // A week and a seed where the ladder's own roll for slot 0 comes up EMPTY, so the letter that
  // arrives can only be the guarantee. Searched rather than asserted blind: a case that passed
  // because the dice happened to say yes would prove nothing at all.
  function coldWindow(tier: 'tour' | 'premium' | 'icon'): { seed: string; opened: number } {
    const standing = standingAt(5)
    for (let i = 0; i < 200; i++) {
      const seed = `r39-17-cold-${i}`
      const opened = sponsorWindowOpensAt(52 * 10 + 47)
      if (!shopWritesAt(seed, opened, offerChanceFor(standing, tier))) return { seed, opened }
    }
    throw new Error('no cold window found – the search is broken, not the dice')
  }

  it('⭐⭐⭐ the rung rolls NO and X writes anyway – the guarantee bypasses the arrival roll', () => {
    const { seed, opened } = coldWindow('icon')
    const standing = standingAt(5) // icon: Aurelia is the rung she clears today
    // A – no campaign: the dice said no, so the window is silent at slot 0.
    const quiet: Offer[] = []
    raiseKitOffers({ offers: quiet, seed, week: opened, standing })
    expect(quiet.filter((o) => (o.terms as KitOfferTerms).tier === 'icon')).toHaveLength(0)
    // B – the same seed, the same week, with a clothing campaign from Aurelia running.
    const withBond: Offer[] = [campaign({ category: 'clothing', brand: S.icon.brand, from: opened - 100, years: 3 })]
    raiseKitOffers({ offers: withBond, seed, week: opened, standing })
    const letter = bondLetter(withBond, opened)
    expect(letter, 'the guaranteed letter did not arrive').toBeTruthy()
    expect((letter!.terms as KitOfferTerms).brand).toBe(S.icon.brand)
    expect(letter!.state).toBe('open')
  })

  it('⚠ it is ONE letter per window, however many weeks of the window are replayed', () => {
    const { seed, opened } = coldWindow('icon')
    const offers: Offer[] = [campaign({ category: 'clothing', brand: S.icon.brand, from: opened - 100, years: 3 })]
    for (let w = opened; w <= opened + 4; w++) raiseKitOffers({ offers, seed, week: w, standing: standingAt(5) })
    expect(offers.filter((o) => o.id.startsWith('kit-bond-'))).toHaveLength(1)
  })

  it('⚠ ZERO DRAWS ADDED, PROVED BY THE OTHER RUNGS: their letters are identical with and without it', () => {
    // The guarantee bypasses slot 0's roll rather than spending one. Every other slot's dice are
    // keyed on (seed, opened + slot) and re-derived at the call site, so skipping slot 0's question
    // can shift nobody: the whole window's post below slot 0 must come back byte-identical.
    const seed = 'r39-17-no-draw'
    const opened = sponsorWindowOpensAt(52 * 12 + 47)
    const standing = standingAt(5)
    const walk = (offers: Offer[]): string[] => {
      for (let w = opened; w <= opened + 4; w++) raiseKitOffers({ offers, seed, week: w, standing })
      return offers
        .filter((o) => o.kind === 'kit' && !o.id.startsWith('kit-bond-'))
        .map((o) => `${o.id}:${(o.terms as KitOfferTerms).tier}:${(o.terms as KitOfferTerms).brand}:${o.week}`)
    }
    const plain = walk([])
    const bonded = walk([campaign({ category: 'clothing', brand: S.icon.brand, from: opened - 100, years: 3 })])
    // The guaranteed letter takes the rung she clears today off the ladder's queue – one letter per
    // rung per window, the round-17 rule – and every OTHER rung's paper is untouched.
    const top = rungFor(standing)!
    expect(bonded).toEqual(plain.filter((row) => !row.includes(`:${top}:`)))
  })

  it('⚠ a running deal that covers the season ahead turns it away, exactly as it turns a rung away', () => {
    const seed = 'r39-17-covered'
    const opened = sponsorWindowOpensAt(52 * 10 + 47)
    // A three-season icon deal with years still to run: her kit is not expiring, so nothing is owed.
    const offers: Offer[] = [
      kitDeal('icon', opened - 100, opened + 3 * WEEKS_PER_YEAR),
      campaign({ category: 'clothing', brand: S.icon.brand, from: opened - 100, years: 3 }),
    ]
    raiseKitOffers({ offers, seed, week: opened, standing: standingAt(5) })
    expect(bondLetter(offers, opened)).toBeUndefined()
  })

  it('⚠ and a girl the ladder would not write to at all gets nothing: it bypasses the dice, not the ladder', () => {
    const seed = 'r39-17-no-rung'
    const opened = sponsorWindowOpensAt(52 * 10 + 47)
    // No counting professional result, nothing at home, nothing in the junior world.
    const nobody: SponsorStanding = { nationalRank: 400, itfRank: 999, itfRanked: false, wtaRank: 564, wtaRanked: false }
    expect(rungFor(nobody)).toBeNull()
    const offers: Offer[] = [campaign({ category: 'clothing', brand: S.icon.brand, from: opened - 100, years: 3 })]
    raiseKitOffers({ offers, seed, week: opened, standing: nobody })
    expect(bondLetter(offers, opened)).toBeUndefined()
  })
})

// =================================================================================================
describe('round 39 #17 §2 – RULING 2: the terms are her standing TODAY, never the expired deal’s', () => {
  it('⭐⭐ a slid career gets the rung she clears NOW, with X’s name on it – not premium for ever', () => {
    const seed = 'r39-17-slid'
    const opened = sponsorWindowOpensAt(52 * 14 + 47)
    // She WAS world #5 – Aurelia dressed her and shot her campaign. She is #150 now, which is
    // `tour`'s band and nothing better.
    const today = standingAt(150)
    expect(rungFor(today)).toBe('tour')
    const offers: Offer[] = [campaign({ category: 'clothing', brand: S.icon.brand, from: opened - 100, years: 4 })]
    raiseKitOffers({ offers, seed, week: opened, standing: today })
    const letter = bondLetter(offers, opened)!
    const t = letter.terms as KitOfferTerms
    // ⚠ THE LADDER'S OWN TERMS FOR HER RANK TODAY, FIELD FOR FIELD – and exactly ONE override.
    expect(t).toEqual({ ...kitTermsFor(today, 'tour')!, brand: S.icon.brand })
    expect(t.tier).toBe('tour')
    expect(t.kitAllowanceCents).toBe(kitTermsFor(today, 'tour')!.kitAllowanceCents)
    // ...and it is NOT the icon rung's paper wearing the guarantee's clothes.
    expect(t.kitAllowanceCents).not.toBe(kitTermsFor(standingAt(5), 'icon')!.kitAllowanceCents)
  })

  it('⚠ the letterhead follows the BRAND, so the mark cannot contradict the signature', () => {
    // Every ladder letter carries its own rung's name, so this is the identity for all of them...
    for (const tier of ['local', 'national', 'tour', 'global', 'premium', 'icon'] as const) {
      const terms = kitTermsFor(standingAt(5), tier)!
      expect(sponsorTierOfBrand(terms.brand)).toBe(tier)
    }
    // ...and the bond letter is the one paper where brand and tier come apart.
    expect(sponsorTierOfBrand(S.icon.brand)).toBe('icon')
    expect(sponsorTierOfBrand('Nobody At All')).toBeNull()
  })
})

// =================================================================================================
describe('round 39 #17 §3 – RULING 1: the trigger is signing a DIFFERENT house, never an absence', () => {
  it('⭐⭐⭐ signing a rival kit house ends the campaign on the spot', () => {
    const week = 52 * 10 + 47
    const c = campaign({ category: 'clothing', brand: S.premium.brand, from: week - 60, years: 3 })
    const offers: Offer[] = [c, kitLetter('kit-rival', 'icon', week)]
    expect(runningClothingCampaign(offers, week)).toBe(c)
    expect(signOffer(offers, 'kit-rival', week)).toBeTruthy()
    expect(runningClothingCampaign(offers, week)).toBeNull()
    expect(activeAdDeals(offers, week)).toHaveLength(0)
    expect(c.untilWeek).toBe(week - 1)
    expect(adCampaignCutShort(c)).toBe(true)
  })

  it('⭐⭐⭐ A GAP DOES NOT: two weeks with no kit deal at all leave a three-year contract alone', () => {
    // His own save: kit Meridian Sport to w725, the next deal from w727. An absence trigger would
    // have killed a campaign running to w878 over a calendar seam nobody chose.
    const from = 700
    const c = campaign({ category: 'clothing', brand: S.premium.brand, from, years: 3 })
    const offers: Offer[] = [c, kitDeal('premium', from - 20, 725)]
    for (let w = 726; w <= 727; w++) {
      expect(runningClothingCampaign(offers, w), `week ${w}`).toBe(c)
    }
    expect(c.untilWeek).toBe(from + 3 * WEEKS_PER_YEAR - 1)
    expect(adCampaignCutShort(c)).toBe(false)
  })

  it('⚠ signing the SAME house ends nothing – there is no rival to leave for', () => {
    const week = 52 * 10 + 47
    const c = campaign({ category: 'clothing', brand: S.icon.brand, from: week - 60, years: 3 })
    const offers: Offer[] = [c, kitLetter('kit-same', 'icon', week)]
    expect(apparelBondCost(offers, week, S.icon.brand)).toBeNull()
    signOffer(offers, 'kit-same', week)
    expect(runningClothingCampaign(offers, week)).toBe(c)
  })
})

// =================================================================================================
describe('round 39 #17 §4 – RULING 3: ending is the FUTURE only; what is banked stays banked', () => {
  it('⭐⭐ no further anniversary is paid, and the ones already paid are untouched', () => {
    const from = 520
    const c = campaign({ category: 'clothing', brand: S.premium.brand, from, years: 3 })
    // Two anniversaries were due on this paper; one has already been paid.
    const signWeek = from + WEEKS_PER_YEAR + 10
    expect(adAnniversariesLeft(c, signWeek)).toBe(1)
    const offers: Offer[] = [c, kitLetter('kit-rival', 'icon', signWeek)]
    const cost = apparelBondCost(offers, signWeek, S.icon.brand)!
    expect(cost.anniversariesLeft).toBe(1)
    expect(cost.cents).toBe(FEE)
    signOffer(offers, 'kit-rival', signWeek)
    // The remaining anniversary week arrives and the deal is not live to be paid.
    const nextAnniversary = from + 2 * WEEKS_PER_YEAR
    expect(activeAdDeals(offers, nextAnniversary)).toHaveLength(0)
    // ⚠ NOTHING IS CLAWED BACK: the paper is untouched but for its span. The fee, the term it
    // states and the record of what was signed all survive – there is nothing to pay back.
    const t = c.terms as AdOfferTerms
    expect(t.cashCents).toBe(FEE)
    expect(t.termYears).toBe(3)
    expect(c.state).toBe('signed')
    expect(c.fromWeek).toBe(from)
  })

  it('⚠ a one-year campaign costs NOTHING to leave, and the letter must be able to say so', () => {
    const from = 520
    const c = campaign({ category: 'clothing', brand: S.premium.brand, from, years: 1 })
    const week = from + 10
    const offers: Offer[] = [c]
    const cost = apparelBondCost(offers, week, S.icon.brand)!
    expect(cost.anniversariesLeft).toBe(0)
    expect(cost.cents).toBe(0)
  })

  it('⚠ an anniversary landing on the signing week has already been paid, so it is not counted', () => {
    const from = 520
    const c = campaign({ category: 'clothing', brand: S.premium.brand, from, years: 3 })
    // `payAdAnniversaries` runs in the tick before the parent can act, so today's is banked.
    expect(adAnniversariesLeft(c, from + WEEKS_PER_YEAR)).toBe(1)
    expect(adAnniversariesLeft(c, from + WEEKS_PER_YEAR - 1)).toBe(2)
  })
})

// =================================================================================================
describe('round 39 #17 §5 – RULING 4: the lifetime letter is EXEMPT, in both directions', () => {
  it('⭐⭐⭐ signing a different kit house does not touch it', () => {
    const week = 52 * 10 + 47
    const life = campaign({ category: 'lifetime', brand: S.premium.brand, from: week - 200, years: 0, lifetime: true })
    const offers: Offer[] = [life, kitLetter('kit-rival', 'icon', week)]
    expect(apparelBondCost(offers, week, S.icon.brand)).toBeNull()
    signOffer(offers, 'kit-rival', week)
    expect(life.untilWeek).toBeUndefined()
    expect(activeAdDeals(offers, week + 10 * WEEKS_PER_YEAR)).toHaveLength(1)
    expect(adCampaignCutShort(life)).toBe(false)
  })

  it('⚠ and it raises no guaranteed kit letter either – it is not a clothing campaign', () => {
    const seed = 'r39-17-life-no-bond'
    const opened = sponsorWindowOpensAt(52 * 10 + 47)
    const offers: Offer[] = [
      campaign({ category: 'lifetime', brand: S.premium.brand, from: opened - 200, years: 0, lifetime: true }),
    ]
    raiseKitOffers({ offers, seed, week: opened, standing: standingAt(5) })
    expect(bondLetter(offers, opened)).toBeUndefined()
    expect(runningClothingCampaign(offers, opened)).toBeNull()
  })
})

// =================================================================================================
describe('round 39 #17 §6 – RULING 4, the other half: the lifetime house dresses her FREE', () => {
  it('⭐⭐ `lifetimeKitHouse` is the one predicate, and it is live for ever from the signature', () => {
    const from = 400
    const life = campaign({ category: 'lifetime', brand: S.icon.brand, from, years: 0, lifetime: true })
    const offers: Offer[] = [life]
    expect(lifetimeKitHouse(offers, from - 1)).toBeNull()
    expect(lifetimeKitHouse(offers, from)).toBe(life)
    expect(lifetimeKitHouse(offers, from + 40 * WEEKS_PER_YEAR)).toBe(life)
  })

  it('⚠ an ordinary clothing campaign is NOT one – the free kit is the lifetime paper’s alone', () => {
    const offers: Offer[] = [campaign({ category: 'clothing', brand: S.icon.brand, from: 400, years: 3 })]
    expect(lifetimeKitHouse(offers, 420)).toBeNull()
  })
})

// =================================================================================================
describe('round 39 #17 §7 – RULING 5: the reverse order owes nothing', () => {
  it('⭐⭐ a campaign that ended BEFORE the kit deal did raises no letter and charges no price', () => {
    const seed = 'r39-17-reverse'
    const opened = sponsorWindowOpensAt(52 * 10 + 47)
    // A one-year campaign that ran out long ago, and a kit deal that outlived it.
    const c = campaign({ category: 'clothing', brand: S.premium.brand, from: opened - 200, years: 1 })
    const offers: Offer[] = [c, kitLetter('kit-rival', 'icon', opened)]
    expect(runningClothingCampaign(offers, opened)).toBeNull()
    expect(apparelBondCost(offers, opened, S.icon.brand)).toBeNull()
    raiseKitOffers({ offers, seed, week: opened, standing: standingAt(5) })
    expect(bondLetter(offers, opened)).toBeUndefined()
    signOffer(offers, 'kit-rival', opened)
    // untouched: the campaign ended on its own clock, and nothing rewrote its span afterwards
    expect(c.untilWeek).toBe(opened - 200 + WEEKS_PER_YEAR - 1)
  })
})

// =================================================================================================
describe('round 39 #17 §8 – RULING 6: only a CLOTHING campaign creates the bond', () => {
  const others: AdCategory[] = ['watches', 'cars', 'drinks', 'airline', 'fragrance', 'capstone']

  it('⭐⭐ watches, cars, drinks, the airline, fragrance and the capstone all charge nothing', () => {
    const week = 52 * 10 + 47
    for (const category of others) {
      const c = campaign({ category, brand: S.premium.brand, from: week - 60, years: 3 })
      const offers: Offer[] = [c, kitLetter('kit-rival', 'icon', week)]
      expect(apparelBondCost(offers, week, S.icon.brand), `${category} charged a price`).toBeNull()
      signOffer(offers, 'kit-rival', week)
      expect(c.untilWeek, `${category} was ended`).toBe(week - 60 + 3 * WEEKS_PER_YEAR - 1)
    }
  })

  it('⚠ ...and none of them raises a guaranteed kit letter', () => {
    const seed = 'r39-17-other-cats'
    const opened = sponsorWindowOpensAt(52 * 10 + 47)
    for (const category of others) {
      const offers: Offer[] = [campaign({ category, brand: S.premium.brand, from: opened - 60, years: 3 })]
      raiseKitOffers({ offers, seed, week: opened, standing: standingAt(5) })
      expect(bondLetter(offers, opened), `${category} wrote a kit letter`).toBeUndefined()
    }
  })
})

// =================================================================================================
describe('round 39 #17 §9 – THROUGH THE REAL DOOR: `reviewSponsors` raises it on a real career', () => {
  /** The gate-probe idiom (tests/round29p4-ad-portfolio.test.ts): an adult week, a counting book. */
  function proWorld(seed: string, week: number, rank: number): WorldState {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = week
    world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
    world.kidRankWta = rank
    return world
  }

  it('⭐⭐⭐ the winter after her kit deal ends, X writes – through the tick’s own caller', () => {
    const week = 52 * 12 + 47
    const world = proWorld('r39-17-review', week, 5)
    // Her kit deal ran out with LAST season; the campaign from the same house runs on for years.
    world.offers.push(kitDeal('icon', week - 200, week - 55))
    world.offers.push(campaign({ category: 'clothing', brand: S.icon.brand, from: week - 150, years: 4 }))
    reviewSponsors(world)
    const letter = bondLetter(world.offers, sponsorWindowOpensAt(week))
    expect(letter, 'no guaranteed letter reached the inbox').toBeTruthy()
    expect((letter!.terms as KitOfferTerms).brand).toBe(S.icon.brand)
    // ...and it is a real, answerable proposal rather than a notice.
    expect(letter!.state).toBe('open')
    expect(letter!.deadlineWeek).toBeGreaterThan(week)
  })

  it('⚠ and with no campaign running the same winter is exactly as it was', () => {
    const week = 52 * 12 + 47
    const world = proWorld('r39-17-review', week, 5)
    world.offers.push(kitDeal('icon', week - 200, week - 55))
    reviewSponsors(world)
    expect(bondLetter(world.offers, sponsorWindowOpensAt(week))).toBeUndefined()
  })
})

// =================================================================================================
describe('round 39 #17 §10 – RULING 4: the lifetime house pays for her kit, at the till', () => {
  /** A working career with a signed lifetime paper and no kit deal at all. */
  function lifetimeCareer(seed = 'r39-17-free-kit'): WorldState {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    world.offers.push(campaign({ category: 'lifetime', brand: S.icon.brand, from: 0, years: 0, lifetime: true }))
    return world
  }

  it('⭐⭐⭐ the over-the-counter price to the family is ZERO, on every line, with no kit deal', () => {
    const world = lifetimeCareer()
    for (const line of ['strings', 'frame', 'shoes'] as const) {
      const split = kitPurchaseSplit(world, line, 400_00)
      expect(split.paidCents, line).toBe(0)
      expect(split.coveredCents, line).toBe(400_00)
      expect(split.brand, line).toBe(S.icon.brand)
      expect(split.forLife, line).toBe(true)
    }
  })

  it('⚠ and the family pays in full without one – the control that says the arm contains its reader', () => {
    const world = createWorld('r39-17-free-kit', { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    const split = kitPurchaseSplit(world, 'frame', 400_00)
    expect(split.paidCents).toBe(400_00)
    expect(split.forLife).toBe(false)
  })

  it('⭐⭐ the RECURRING bill is zero too, and the ledger names who paid', () => {
    const world = lifetimeCareer()
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 60; i++) tickWeek(world, rng)
    const rackets = world.events.filter((e) => e.text.startsWith('New racket'))
    expect(rackets.length, 'the fixture has to buy a racket or this asserts nothing').toBeGreaterThan(0)
    for (const row of rackets) {
      expect(row.amountCents, row.text).toBe(0)
      expect(row.text).toContain(`on ${S.icon.brand}`)
    }
  })

  it('⚠ NOTHING IS BANKED AGAINST A KIT DEAL’S ALLOWANCE – the house that pays did not open that pot', () => {
    const world = lifetimeCareer('r39-17-free-kit-both')
    const deal = kitDeal('icon', 0, 10_000)
    world.offers.push(deal)
    kitPurchaseSplit(world, 'frame', 400_00)
    setKitGrade(world, 'frame', 'pro')
    expect(deal.coveredCents).toBe(0)
    // ...and the family paid nothing for the rung it just bought.
    const bought = world.events.filter((e) => e.text.startsWith('Bought:'))
    expect(bought.length).toBe(1)
    expect(bought[0].amountCents).toBe(0)
    expect(bought[0].text).toContain(`on ${S.icon.brand}`)
  })
})
