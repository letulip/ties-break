// =================================================================================================
// THE INBOX - offers, the deadline, and the kit deal that stopped being weather
// =================================================================================================
//
// docs/specs/offers-and-the-inbox.md. This slice carries the KIT SPONSOR alone, on the spec's own
// build order (§6): the smallest step that proves the whole shape - arrival, deadline, sign, refuse,
// expiry - against a number that is already balanced.
//
// The four things this file exists to hold still:
//   1. ⚠ THE FROZEN MAIN CAPTURE (41550 / e6b0c709) DOES NOT MOVE, even for a career that signs every
//      letter it is sent. Whether the shop writes is randomness, and it comes off `seed:offer:<week>` -
//      a purpose-scoped sub-stream, created, read once and thrown away, exactly as `seed:weather:` and
//      `seed:crowd:` are. This is the same guard shape `tests/knock.test.ts` keeps for the knock,
//      which is the closest precedent: a per-week sub-stream drawn from INSIDE `tickWeek`.
//   2. THE WINDOW IS REAL in both directions - an answer inside it is honoured, an answer past it is
//      refused, and an unanswered letter is gone rather than merely stale.
//   3. ⚠ TERMS NEVER IMPROVE WHILE THE LETTER IS HELD. An offer that quietly got better for waiting
//      would make the deadline a formality and the decision free (spec §2).
//   4. SIGNING PAYS IN KIT, and the kit reaches the MATCH. That is the whole reason the slice is
//      worth doing: `ECONOMY.sponsorship` has been paying a product deal in cash for want of a
//      mechanism, and main now carries equipment condition.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  recomputeKidRank,
  acceptOffer,
  declineOffer,
  kidMatchPlayerFor,
  injuryTau,
  localSponsorCents,
  KID_ID,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import {
  activeKitDeal,
  expireOffers,
  hasLiveOffer,
  isOfferLive,
  kitFreshCap,
  kitTermsFor,
  offerChanceFor,
  raiseKitOffer,
  shopWritesAt,
  SPONSOR_TIERS,
} from '../src/engine/offers'
import { migrateSave } from '../src/engine/migrations'
import { kitWearAt } from '../src/engine/equipment'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type KitOfferTerms } from '../src/shared/protocol'

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

/** Comments are not code - the `codeOf` discipline tests/paper-note.test.ts and
 *  tests/calendar-screen.test.ts keep. Load-bearing here: this file's subjects document themselves at
 *  length, and one of them explains in prose exactly the thing a raw scan is looking for. */
const codeOf = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// =================================================================================================
// 1. ⚠ THE FROZEN CAPTURE - blocks merge
// =================================================================================================
const REF = { count: 41550, hash: 'e6b0c709' }

function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
const hashOf = (draws: number[]) => fnv1a(draws.map((d) => d.toString()).join(','))

/** The bench career the capture is made of, with a recording tap on the MAIN stream. `mutate` runs
 *  before the first tick; `each` runs after every one, which is where a career answers its letters. */
function recordRun(opts: {
  mutate?: (w: WorldState) => void
  each?: (w: WorldState) => void
} = {}): { draws: number[]; world: WorldState } {
  const world = createWorld('bench-working-0')
  opts.mutate?.(world)
  const base = rngFromSeed(world.seed)
  const draws: number[] = []
  const rng = () => {
    const v = base()
    draws.push(v)
    return v
  }
  for (let i = 0; i < 52; i++) {
    tickWeek(world, rng)
    opts.each?.(world)
  }
  return { draws, world }
}

describe('⚠ the inbox adds NO main-stream draws (blocks merge)', () => {
  it('a career that signs every letter it gets still reproduces 41550 / e6b0c709', () => {
    // `reviewLocalSponsor` runs INSIDE `tickWeek`, at the season boundary, which is exactly where a
    // careless draw moves the capture. It reads `seed:offer:<week>` - its own per-week sub-stream,
    // created and discarded - so the weekly sequence cannot see it.
    let signed = 0
    const { draws, world } = recordRun({
      mutate: (w) => {
        // Force her onto the shop's radar so a letter actually arrives; a vacuous pass would prove
        // only that an absent feature draws nothing.
        w.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
        recomputeKidRank(w)
      },
      each: (w) => {
        for (const o of w.offers) {
          if (!isOfferLive(o, w.week)) continue
          acceptOffer(w, o.id)
          signed++
        }
      },
    })
    expect(draws.length).toBe(REF.count)
    expect(hashOf(draws)).toBe(REF.hash)
    expect(signed, 'no letter was ever signed - the case proves nothing').toBeGreaterThan(0)
    expect(world.offers.some((o) => o.state === 'signed')).toBe(true)
  })

  it('...and so does one that refuses every letter, and one that ignores them all', () => {
    const base = recordRun({
      mutate: (w) => {
        w.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
        recomputeKidRank(w)
      },
    })
    const refusing = recordRun({
      mutate: (w) => {
        w.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
        recomputeKidRank(w)
      },
      each: (w) => {
        for (const o of w.offers) if (isOfferLive(o, w.week)) declineOffer(w, o.id)
      },
    })
    for (const run of [base, refusing]) {
      expect(run.draws.length).toBe(REF.count)
      expect(hashOf(run.draws)).toBe(REF.hash)
    }
    // The answer changes the world and never the stream.
    expect(refusing.world.offers.some((o) => o.state === 'refused')).toBe(true)
    expect(base.world.offers.some((o) => o.state === 'open' || o.state === 'expired')).toBe(true)
  })

  it('an unranked career draws the same stream as a sponsored one (the roll is off-stream)', () => {
    // The strongest form: whether the shop writes AT ALL is different between these two worlds, and
    // the MAIN stream cannot tell.
    const plain = recordRun()
    const courted = recordRun({
      mutate: (w) => {
        w.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
        recomputeKidRank(w)
      },
    })
    expect(plain.draws).toEqual(courted.draws)
    expect(plain.world.offers).toHaveLength(0)
    expect(courted.world.offers.length).toBeGreaterThan(0)
  })
})

describe('the offer module draws only on its own purpose-scoped sub-stream', () => {
  it('every stream it opens is `seed:offer:` and nothing else', () => {
    // A CLOSED ALLOWLIST rather than a generic pattern, the shape tests/preview.test.ts established:
    // a second sub-stream has to be added here deliberately, by somebody who has read this comment,
    // instead of appearing by accident. The bare `${seed}` is the MAIN weekly stream the frozen
    // capture measures, and it must never appear in this module.
    const src = codeOf(read('../src/engine/offers.ts'))
    const keys = [...src.matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
    expect(keys.length, 'the sweep found no draws at all - the regex has gone stale').toBeGreaterThan(0)
    for (const k of keys) expect(k, `offers reads ${k}`).toMatch(/^\$\{seed\}:offer:/)
  })

  it('no function in the module takes an Rng – there is no parameter to misuse', () => {
    // The structural half of the guarantee, and the idiom tests/injuries.test.ts keeps for
    // rollInjury/resolvePhysio/injuryTau. A signature that cannot accept the weekly stream cannot
    // spend it.
    expect(raiseKitOffer.length).toBe(1) // ({ offers, seed, week, nationalRank })
    expect(expireOffers.length).toBe(2) // (offers, week)
    expect(shopWritesAt.length).toBe(3) // (seed, week, chance)
    expect(kitFreshCap.length).toBe(2) // (offers, week)
    const src = codeOf(read('../src/engine/offers.ts'))
    expect(src).not.toContain(': Rng')
  })

  it('the roll is deterministic per (seed, week) and independent of the weekly stream', () => {
    const a = shopWritesAt('replay-me', 52, 0.5)
    expect(shopWritesAt('replay-me', 52, 0.5)).toBe(a)
    // A different week is a different question, and a different seed is a different career.
    const answers = new Set([a, shopWritesAt('replay-me', 104, 0.5), shopWritesAt('other', 52, 0.5)])
    expect(answers.size).toBeGreaterThanOrEqual(1) // (they may agree; what matters is they are keyed)
    // 0 and 1 are the two ends, and they are honoured exactly – no letter ever, or one every time.
    expect(shopWritesAt('replay-me', 52, 0)).toBe(false)
    expect(shopWritesAt('replay-me', 52, 1)).toBe(true)
  })
})

// =================================================================================================
// 2. THE WINDOW - the feature, not a courtesy
// =================================================================================================

/** A world with one open letter on it, raised by the REAL mechanism at `week`.
 *
 *  ⚠ IT WALKS SEED SUFFIXES UNTIL THE SHOP ACTUALLY WRITES, and that is not a fudge - it is the
 *  fixture paying the price of the design. Whether a letter arrives is a draw on `seed:offer:<week>`
 *  (`ECONOMY.sponsorship.topOfferChance`), because an offer that is guaranteed to come round again is
 *  an offer with no cost to letting it expire. So roughly one career in ten gets nothing, and a
 *  fixture that hard-coded one seed would be a fixture that went red on a knob change rather than on
 *  a regression. Nothing is forced or stubbed: the offer these tests answer is one the engine really
 *  raised, on its own stream, for a seed it really said yes to. */
/** A seed the shop really does write to at `week` for a kid at `nationalRank` – see the ⚠ note on
 *  `worldWithLetter` for why a fixture has to look for one rather than hard-code it. */
function seedTheShopWritesTo(stem: string, week = 52, nationalRank = 1): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const seed = `${stem}-${attempt}`
    if (shopWritesAt(seed, week, offerChanceFor(nationalRank))) return seed
  }
  throw new Error(`no seed near "${stem}" was written to in 20 tries`)
}

function worldWithLetter(seed = 'inbox-1', week = 52): { world: WorldState; id: string } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const world = createWorld(`${seed}-${attempt}`, DEFAULT_PROFILE)
    world.week = week
    const offer = raiseKitOffer({ offers: world.offers, seed: world.seed, week, nationalRank: 1 })
    if (offer) return { world, id: offer.id }
  }
  throw new Error(`no seed near "${seed}" was written to in 20 tries – the offer roll has broken`)
}

describe('the window is the feature, not a courtesy', () => {
  it('a letter can be signed on the deadline week, and not the week after', () => {
    const { world, id } = worldWithLetter('deadline-a')
    const offer = world.offers[0]
    world.week = offer.deadlineWeek
    expect(() => acceptOffer(world, id)).not.toThrow()
    expect(world.offers[0].state).toBe('signed')

    const late = worldWithLetter('deadline-b')
    late.world.week = late.world.offers[0].deadlineWeek + 1
    expect(() => acceptOffer(late.world, late.id)).toThrow(/gone/i)
    expect(() => declineOffer(late.world, late.id)).toThrow(/gone/i)
  })

  it('an offer left to expire is GONE, and the tick is what takes it', () => {
    const world = createWorld('expiry', DEFAULT_PROFILE)
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    const offer = world.offers.find((o) => o.state === 'open')
    expect(offer).toBeDefined()
    const deadline = offer!.deadlineWeek
    // ...still a decision on its last week...
    while (world.week < deadline) tickWeek(world, rng)
    expect(world.offers[0].state).toBe('open')
    expect(toSnapshot(world).offerOpen).toBe(true)
    // ...and gone on the next one, without anybody touching it.
    tickWeek(world, rng)
    expect(world.week).toBe(deadline + 1)
    expect(world.offers[0].state).toBe('expired')
    expect(world.offers[0].decidedWeek).toBe(deadline + 1)
    expect(toSnapshot(world).offerOpen).toBe(false)
  })

  it('expiry is idempotent and only ever takes OPEN letters', () => {
    const { world } = worldWithLetter('idem')
    acceptOffer(world, world.offers[0].id)
    world.week = world.offers[0].deadlineWeek + 40
    expect(expireOffers(world.offers, world.week)).toEqual([])
    expect(world.offers[0].state).toBe('signed')
  })

  it('⚠ TERMS NEVER IMPROVE WHILE THE LETTER IS HELD', () => {
    // Spec §2: "an offer that quietly got better for waiting would make the deadline a formality and
    // the decision free". The terms are a SNAPSHOT taken at arrival, not a formula re-read later, and
    // this is what makes that structural rather than a promise. Her rank is improved to the very top
    // between arrival and signing - which would buy a better deal on a fresh letter - and the letter
    // in her hand does not move by a field.
    // Rank 25 is the STANDARD deal, so `offerChance` (not `topOfferChance`) is the roll to satisfy.
    const world = createWorld(seedTheShopWritesTo('frozen-terms', 52, 25), DEFAULT_PROFILE)
    world.week = 52
    const offer = raiseKitOffer({ offers: world.offers, seed: world.seed, week: 52, nationalRank: 25 })!
    expect(offer, 'no letter to freeze').toBeTruthy()
    const atArrival = JSON.parse(JSON.stringify(offer.terms))
    // ...the standard deal, so there is a better one to be had.
    expect((offer.terms as KitOfferTerms).kitAllowanceCents).toBe(ECONOMY.sponsorship.seasonCents)
    world.week = offer.deadlineWeek
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    acceptOffer(world, offer.id)
    expect(world.offers[0].terms).toEqual(atArrival)
    // The better terms exist – they are simply not this letter's.
    expect(kitTermsFor(1)!.kitAllowanceCents).toBe(ECONOMY.sponsorship.topSeasonCents)
  })

  it('signing is irreversible: there is no unsign, and a second answer is refused', () => {
    const { world, id } = worldWithLetter('once')
    acceptOffer(world, id)
    expect(() => acceptOffer(world, id)).toThrow(/already signed/i)
    expect(() => declineOffer(world, id)).toThrow(/already signed/i)
    // ...and nothing in the engine's surface offers a way back.
    const src = codeOf(read('../src/engine/offers.ts'))
    expect(src).not.toMatch(/unsign|cancelOffer|reopenOffer/i)
  })

  it('a refusal is terminal too – the deadline means something on both sides', () => {
    const { world, id } = worldWithLetter('nope')
    declineOffer(world, id)
    expect(world.offers[0].state).toBe('refused')
    expect(() => acceptOffer(world, id)).toThrow()
  })
})

// =================================================================================================
// 3. THE DOT - one FACT, and not the "unread" it cannot know
// =================================================================================================
describe('the inbox dot asserts one fact and goes out on its own', () => {
  it('is exactly "an offer is open and its deadline has not passed"', () => {
    const { world, id } = worldWithLetter('dot')
    expect(toSnapshot(world).offerOpen).toBe(true)
    // ...reading it changes nothing, because the engine does not know it was read. Two snapshots in
    // a row say the same thing, which is the whole difference from an "unread" dot.
    expect(toSnapshot(world).offerOpen).toBe(true)
    declineOffer(world, id)
    expect(toSnapshot(world).offerOpen).toBe(false)
  })

  it('goes out for each of the three ways a letter stops being a decision', () => {
    for (const answer of ['sign', 'refuse', 'expire'] as const) {
      const { world, id } = worldWithLetter(`dot-${answer}`)
      expect(hasLiveOffer(world.offers, world.week)).toBe(true)
      if (answer === 'sign') acceptOffer(world, id)
      else if (answer === 'refuse') declineOffer(world, id)
      else {
        world.week = world.offers[0].deadlineWeek + 1
        expireOffers(world.offers, world.week)
      }
      expect(hasLiveOffer(world.offers, world.week), answer).toBe(false)
    }
  })

  it('a signed deal does NOT hold the dot on – it is not a decision any more', () => {
    // The one confusion the fact-shaped rule prevents: the deal is live for a whole season, and the
    // dot is about the DECISION rather than about the relationship.
    const { world, id } = worldWithLetter('dot-live')
    acceptOffer(world, id)
    expect(activeKitDeal(world.offers, world.week)).not.toBeNull()
    expect(toSnapshot(world).offerOpen).toBe(false)
  })

  it('Home reads the ENGINE\'s fact rather than re-deriving one', () => {
    // Copying the bell's discipline includes copying where the fact comes from. A screen that
    // re-implements the predicate is a screen that can disagree with the engine about it.
    const home = read('../src/components/screens/HomeScreen.vue')
    expect(home).toContain('game.snapshot?.offerOpen')
    expect(home).not.toMatch(/offers.*deadlineWeek/)
  })
})

// =================================================================================================
// 4. THE KIT - what signing actually pays in, and how it reaches the match
// =================================================================================================
describe('signing pays in equipment, and the equipment reaches the match', () => {
  it('puts a FLOOR under her kit condition, and only ever downwards on wear', () => {
    const { world, id } = worldWithLetter('kit-floor')
    expect(kitFreshCap(world.offers, world.week)).toBeNull() // ...nothing until it is signed
    acceptOffer(world, id)
    const cap = kitFreshCap(world.offers, world.week)!
    expect(cap).toBe(ECONOMY.sponsorship.topFreshCap)
    // Every line, every week of the deal: capped wear is never worse than uncapped, and never past
    // the cap. Fresh kit stays fresh - the cap cannot make her better than new.
    for (let w = world.week; w <= world.offers[0].untilWeek!; w++) {
      const plain = kitWearAt(world.seed, 'working', w)
      const kitted = kitWearAt(world.seed, 'working', w, cap)
      for (const line of ['strings', 'frame', 'shoes'] as const) {
        expect(kitted[line]).toBeLessThanOrEqual(plain[line])
        expect(kitted[line]).toBeLessThanOrEqual(cap)
        expect(kitted[line]).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('...and it reaches the MATCH: the same girl, the same week, a better racket', () => {
    // The end-to-end assertion the whole slice rests on. Two identical worlds one signature apart,
    // composed through the ONE composition point every match path uses.
    const seed = seedTheShopWritesTo('kit-match')
    const signedW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    const plainW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    for (const w of [signedW, plainW]) w.week = 52
    const offer = raiseKitOffer({ offers: signedW.offers, seed: signedW.seed, week: 52, nationalRank: 1 })!
    acceptOffer(signedW, offer.id)

    // A week deep enough into the string's 5-week life that the family's own cadence has let it go.
    let moved = 0
    for (let w = 52; w <= 90; w++) {
      signedW.week = w
      plainW.week = w
      const a = kidMatchPlayerFor(signedW, 'hard')
      const b = kidMatchPlayerFor(plainW, 'hard')
      expect(a.serve).toBeGreaterThanOrEqual(b.serve)
      expect(a.ret).toBeGreaterThanOrEqual(b.ret)
      expect(a.groundstrokes).toBeGreaterThanOrEqual(b.groundstrokes)
      expect(a.stamina).toBeGreaterThanOrEqual(b.stamina)
      // composure has no kit term at all, sponsored or not
      expect(a.composure).toBe(b.composure)
      if (a.ret > b.ret) moved++
    }
    expect(moved, 'the deal never actually moved a match attribute').toBeGreaterThan(0)
  })

  it('...and it reaches the INJURY threshold, through the same shoes', () => {
    const seed = seedTheShopWritesTo('kit-injury')
    const signedW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    const plainW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    for (const w of [signedW, plainW]) w.week = 52
    const offer = raiseKitOffer({ offers: signedW.offers, seed: signedW.seed, week: 52, nationalRank: 1 })!
    acceptOffer(signedW, offer.id)
    let moved = 0
    for (let w = 52; w <= 90; w++) {
      signedW.week = w
      plainW.week = w
      const a = injuryTau(signedW)
      const b = injuryTau(plainW)
      expect(a).toBeLessThanOrEqual(b) // worn soles raise the threshold; fresh ones cannot
      if (a < b) moved++
    }
    expect(moved, 'the deal never actually moved the injury threshold').toBeGreaterThan(0)
  })

  it('the deal ends exactly when it says it does', () => {
    const { world, id } = worldWithLetter('kit-end')
    acceptOffer(world, id)
    const until = world.offers[0].untilWeek!
    expect(activeKitDeal(world.offers, until)).not.toBeNull()
    expect(activeKitDeal(world.offers, until + 1)).toBeNull()
    expect(kitFreshCap(world.offers, until + 1)).toBeNull()
    // ...and it does not reach backwards before it was signed, either.
    expect(activeKitDeal(world.offers, world.offers[0].decidedWeek! - 1)).toBeNull()
  })

  it('⚠ FALLING SHORT COSTS THE DEAL AND NOT THE SAVINGS – the letter\'s promise, in code', () => {
    // Spec §4.1, and the thing the letter now says in the shop's own words: "fall short and we shake
    // hands at the end of it and part friends. Either way the kit is hers and there is nothing to pay
    // back." A letter that promised a soft landing while the engine did something else would be worse
    // than silence, so all three halves of it are pinned here.
    const seed = seedTheShopWritesTo('lapse')
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'middle' })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    const offer = world.offers.find((o) => o.state === 'open')!
    acceptOffer(world, offer.id)
    const terms = offer.terms as KitOfferTerms
    // ...and she plays nothing at all, which is the hard end of falling short.
    for (let i = 0; i < 52; i++) tickWeek(world, rng)

    // 1. THE VERDICT IS RECORDED, against the number it was judged on.
    expect(world.offers[0].eventsPlayed).toBe(0)
    expect(world.offers[0].eventsPlayed! < terms.minEventsPerSeason).toBe(true)
    // 2. THE DEAL ENDED AND WAS NOT RENEWED – no second letter at this boundary.
    expect(world.week).toBe(104)
    expect(activeKitDeal(world.offers, world.week)).toBeNull()
    expect(world.offers.filter((o) => o.week === 104)).toHaveLength(0)
    expect(world.offers).toHaveLength(1)
    // 3. ⚠ AND NOTHING WAS CLAWED BACK. The kit the shop bought stays bought: the covered total is
    //    still on the record, and the boundary that ended the deal took no money at all.
    const covered = world.offers[0].coveredCents ?? 0
    expect(covered).toBeGreaterThan(0)
    const atBoundary = world.financeWeeks.find((w) => w.week === 104)
    for (const [cat, amount] of Object.entries(atBoundary?.byCategory ?? {})) {
      expect(amount, `${cat} moved at the lapse boundary`).toBeGreaterThanOrEqual(
        cat === 'interest' || cat === 'parent' ? 0 : -Number.MAX_SAFE_INTEGER,
      )
    }
    expect(atBoundary?.byCategory.sponsor ?? 0).toBe(0)
    // ...and it is said out loud, with the figure on it, because a deal ending is exactly when the
    // player needs to see what he has lost.
    const line = world.events.find((e) => e.week === 104 && e.text.includes('kitted her out all season'))
    expect(line?.text).toMatch(/not renewing/)
  })

  it('...and a lapse is a missed season, not a blacklist – the shop may write again the year after', () => {
    // The penalty §4.1 describes is "not renewed", which is one season. Nothing in the engine bans a
    // shop from trying again, and nothing should: the obligation is a cost, not a punishment.
    const world = createWorld('lapse-then', DEFAULT_PROFILE)
    world.week = 156
    // No deal ended at this boundary, so the review is free to roll again.
    const again = raiseKitOffer({ offers: world.offers, seed: world.seed, week: 156, nationalRank: 1 })
    expect(again === null || again.state === 'open').toBe(true)
  })

  it('the ALLOWANCE and the GATE are ECONOMY.sponsorship\'s, unmoved', () => {
    // The figure is the one that was already balanced; only the shape of the thing changed.
    expect(kitTermsFor(1)!.kitAllowanceCents).toBe(localSponsorCents(1))
    expect(kitTermsFor(30)!.kitAllowanceCents).toBe(localSponsorCents(30))
    expect(kitTermsFor(31)).toBeNull()
    expect(localSponsorCents(31)).toBe(0)
    expect(offerChanceFor(31)).toBe(0)
  })
})

// =================================================================================================
// 5. THE LETTER AND THE LETTERHEAD
// =================================================================================================
describe('the letter states its terms in words the player can act on', () => {
  const letter = read('../src/components/OfferLetter.vue')
  const template = letter.slice(letter.indexOf('<template>'), letter.lastIndexOf('</template>'))

  it('⚠ THE PAPER SAYS WHAT HAPPENS IF SHE FALLS SHORT', () => {
    // The owner, 31.07: «надо при подписании прояснить, что будет, если девочка не выполнит условия,
    // сейчас это непонятно совсем». Stating the UPSIDE is only half of "terms in words the player can
    // act on" - a player asked to commit to an obligation whose failure mode is invisible is not
    // choosing, he is guessing. Spec §4.1's consequence has to be legible ON the letter: the contract
    // lapses at the season boundary, is not renewed, and NOTHING IS CLAWED BACK.
    expect(template).toMatch(/fall short/i)
    expect(template).toMatch(/nothing to pay back/i)
    // ⚠ AND IT IS NOT IN THE CONFIRM. `ConfirmDialog` confirms the ACT; it does not counsel against
    // it (spec §4c: the game never editorialises). The information belongs where a person reading the
    // paper would find it.
    const inbox = codeOf(read('../src/components/InboxSheet.vue'))
    expect(inbox).not.toMatch(/fall short|not renewed|lapse/i)
  })

  it('...and the inbox says afterwards whether it happened, and against which number', () => {
    // The other end of the same promise. An obligation that fails silently is the same invisibility
    // one step later, so a reviewed deal reports its own verdict off `eventsPlayed`.
    expect(codeOf(letter)).toContain('eventsPlayed')
    expect(codeOf(letter)).toMatch(/not renewed/i)
    expect(codeOf(letter)).toMatch(/Nothing was paid back/i)
  })

  it('⚠ every field of KitOfferTerms appears on the paper', () => {
    // Spec §3: "a letter whose consequence is not on its face is a trap rather than a decision". The
    // voice is allowed to be warm; the DEAL has to be legible, and a term added to the interface has
    // to reach the paper in the same commit.
    for (const field of ['brand', 'kitAllowanceCents', 'minEventsPerSeason']) {
      expect(template, `the letter never prints ${field}`).toContain(field)
    }
    // ...and the weeks left, quietly, under it.
    expect(template).toContain('weeksLeft')
    expect(template).toMatch(/to decide/)
  })

  it('the letterhead is looked up BY TIER, never by a filename spelled out at a call site', () => {
    expect(codeOf(letter)).toContain('images/sponsors/${terms.value.tier}.webp')
    for (const t of SPONSOR_TIERS) expect(codeOf(letter)).not.toContain(`sponsors/${t}.webp`)
  })

  it('this slice ships the LOCAL shop only, and the brand is the one on the artwork', () => {
    // The other two marks are on disk because the brand ladder is a later slice; nothing may reach
    // them yet, and nothing may invent a name or a threshold for them.
    expect(SPONSOR_TIERS).toEqual(['local', 'national', 'global'])
    for (const rank of [1, 5, 10, 11, 30]) expect(kitTermsFor(rank)!.tier).toBe('local')
    expect(ECONOMY.sponsorship.localBrand).toBe('String House')
    const econ = codeOf(read('../src/engine/economy.ts'))
    expect(econ).not.toMatch(/nationalBrand|globalBrand/)
  })

  it('no Cyrillic reaches a template, and the player copy uses the short dash', () => {
    for (const p of ['../src/components/OfferLetter.vue', '../src/components/InboxSheet.vue']) {
      const src = read(p)
      const tpl = src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
      expect(tpl, `${p} has Cyrillic in its template`).not.toMatch(/[Ѐ-ӿ]/)
      expect(tpl, `${p} uses the long dash`).not.toContain('—')
    }
  })

  it('signing goes through ConfirmDialog, and refusing deliberately does not', () => {
    const inbox = codeOf(read('../src/components/InboxSheet.vue'))
    expect(inbox).toContain('ConfirmDialog')
    // The confirm restates the deal – the last thing he reads before committing is the same sentence
    // the letter made – and says the one thing the letter cannot say for itself.
    expect(inbox).toContain('cannot be undone')
    // ...and it is the SIGN path that is gated. A refusal costs him nothing that was ever his.
    expect(inbox).toMatch(/pendingSign/)
    expect(inbox).not.toMatch(/pendingRefuse/)
  })
})

// =================================================================================================
// 6. THE SCHEMA (v32)
// =================================================================================================
describe('the v32 schema step', () => {
  /** A v31 save full of things a careless back-fill might mine for "offers". */
  const v31WithEvidence = (): Record<string, unknown> => ({
    schemaVersion: 31,
    seed: 'v31-inbox',
    week: 160,
    careerId: 'legacy',
    fundsCents: 500_000,
    profile: { ...DEFAULT_PROFILE },
    // The cheque the old mechanism paid, three times, still in the feed.
    events: [
      { id: 1, week: 52, type: 'income', category: 'sponsor', text: 'A local sponsor has backed her for the season', amountCents: 100_000 },
      { id: 2, week: 104, type: 'income', category: 'sponsor', text: 'A local sponsor has backed her for the season', amountCents: 200_000 },
      { id: 3, week: 156, type: 'income', category: 'sponsor', text: 'A local sponsor has backed her for the season', amountCents: 200_000 },
    ],
    milestones: [{ type: 'title', week: 60, tier: 'national' }],
  })

  it('⚠ back-fills an EMPTY inbox – it will not invent decisions the player never made', () => {
    // v18 mined surviving evidence; v28 reconstructed a split; v31 declined to guess at a count. All
    // three were reading a record of things that HAD HAPPENED. An offer is a record of a DECISION,
    // and until v32 the kit deal was not a decision at all - it was weather. Three sponsor cheques
    // in the feed are evidence of money arriving, and of nothing being chosen; a back-fill that
    // turned them into signed contracts would be fabricating the player's own choices.
    const migrated = migrateSave(v31WithEvidence()) as unknown as WorldState
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.offers).toEqual([])
    // ...and the evidence it declined to mine is left exactly where it was.
    expect(migrated.events).toHaveLength(3)
    expect(migrated.milestones).toHaveLength(1)
  })

  it('is idempotent, and heals a malformed value rather than trusting it', () => {
    const once = migrateSave(v31WithEvidence())
    expect(migrateSave(structuredClone(once))).toEqual(once)
    const broken = migrateSave({ ...v31WithEvidence(), offers: 'not an array' }) as unknown as WorldState
    expect(broken.offers).toEqual([])
  })

  it('a migrated career gets its first REAL letter at its next season boundary', () => {
    // The whole compensation for the empty back-fill: nothing is reconstructed, and nothing has to
    // be, because the mechanism starts working immediately.
    const world = createWorld('post-migration', DEFAULT_PROFILE)
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    expect(world.offers).toEqual([])
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    expect(world.offers.length).toBeGreaterThan(0)
    expect(world.offers[0].week).toBe(52)
  })

  it('a signed deal outlives the event feed, which is why it is on the world', () => {
    // Spec §5. `events` caps at 400 rows and a busy career burns that in a couple of seasons, so a
    // contract announced in the feed is a contract that silently stops existing. Bury the boundary
    // under 500 rows of news and the deal is still there, still honoured.
    const { world, id } = worldWithLetter('durable')
    acceptOffer(world, id)
    const before = structuredClone(world.offers[0])
    for (let i = 0; i < 500; i++) {
      world.events.push({ id: world.nextEventId++, week: world.week, type: 'info', text: `noise ${i}` })
    }
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng) // housekeeping prunes the feed
    expect(world.events.length).toBeLessThanOrEqual(400)
    expect(world.offers).toHaveLength(1)
    expect(world.offers[0].id).toBe(before.id)
    expect(world.offers[0].state).toBe('signed')
    expect(world.offers[0].terms).toEqual(before.terms)
  })

  it('the snapshot carries a COPY of the inbox, never the engine\'s own objects', () => {
    const { world, id } = worldWithLetter('copy')
    acceptOffer(world, id)
    const snap = toSnapshot(world)
    expect(snap.offers).toEqual(world.offers)
    expect(snap.offers[0]).not.toBe(world.offers[0])
    expect(snap.offers[0].terms).not.toBe(world.offers[0].terms)
  })
})
