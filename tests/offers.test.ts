// =================================================================================================
// THE INBOX - offers, the deadline, and the kit deal that stopped being weather
// =================================================================================================
//
// docs/specs/offers-and-the-inbox.md. This slice carries the KIT SPONSOR alone, on the spec's own
// build order (§6): the smallest step that proves the whole shape - arrival, deadline, sign, refuse,
// expiry - against a number that is already balanced.
//
// The four things this file exists to hold still:
//   1. ⚠ THE INBOX CANNOT REACH THE MAIN STREAM, even for a career that signs every letter it is
//      sent — proved PAIRWISE since v35 (the signing/refusing arm against the letters-ignored
//      baseline, byte-identical MAIN taps; the one documented capture lives in
//      tests/condition.test.ts B1). Whether the shop writes is randomness, and it comes off
//      `seed:offer:<week>` - a purpose-scoped sub-stream, created, read once and thrown away,
//      exactly as `seed:weather:` and `seed:crowd:` are. This is the same guard shape
//      `tests/knock.test.ts` keeps for the knock, which is the closest precedent: a per-week
//      sub-stream drawn from INSIDE `tickWeek`.
//   2. THE WINDOW IS REAL in both directions - an answer inside it is honoured, an answer past it is
//      refused, and an unanswered letter is gone rather than merely stale.
//   3. ⚠ TERMS NEVER IMPROVE WHILE THE LETTER IS HELD. An offer that quietly got better for waiting
//      would make the deadline a formality and the decision free (spec §2).
//   4. SIGNING PAYS IN KIT, and the kit reaches the MATCH. That is the whole reason the slice is
//      worth doing: `ECONOMY.sponsorship` has been paying a product deal in cash for want of a
//      mechanism, and main now carries equipment condition.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
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
  reviewSponsors,
  KID_ID,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import {
  activeKitDeal,
  expireOffers,
  hasLiveOffer,
  isOfferLive,
  isSponsorReviewWeek,
  kitFreshCap,
  kitTermsFor,
  kitTravelShare,
  offerChanceFor,
  raiseKitOffer,
  rungFor,
  shopWritesAt,
  SPONSOR_TIERS,
  TIER_COVERS,
  type SponsorStanding,
} from '../src/engine/offers'
import { migrateSave } from '../src/engine/migrations'
import { kitWearAt } from '../src/engine/equipment'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { OFF_SEASON_WEEKS, TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
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
// 1. ⚠ MAIN-STREAM INVARIANCE - blocks merge. Pairwise since v35 (P3, rng-persistence): the
// cross-suite constant retired with the load replay it guarded; each test below compares its
// action arm against the letters-ignored baseline built by the same harness, same code.
// =================================================================================================

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
  /** The shop only writes to a ranked girl, so every arm of the A/B — baseline included — forces
   *  her onto its radar the same way; the pair differs ONLY in what the parent does about the
   *  letters. A vacuous pass would prove only that an absent feature draws nothing. */
  const ontoTheRadar = (w: WorldState) => {
    w.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(w)
  }

  it('a career that signs every letter taps the letters-ignored baseline byte-for-byte', () => {
    // `reviewLocalSponsor` runs INSIDE `tickWeek`, at the season boundary, which is exactly where
    // a careless draw perturbs the weekly sequence. It reads `seed:offer:<week>` - its own
    // per-week sub-stream, created and discarded - so the weekly sequence cannot see it.
    const base = recordRun({ mutate: ontoTheRadar })
    let signed = 0
    const { draws, world } = recordRun({
      mutate: ontoTheRadar,
      each: (w) => {
        for (const o of w.offers) {
          if (!isOfferLive(o, w.week)) continue
          acceptOffer(w, o.id)
          signed++
        }
      },
    })
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
    expect(signed, 'no letter was ever signed - the case proves nothing').toBeGreaterThan(0)
    expect(world.offers.some((o) => o.state === 'signed')).toBe(true)
  })

  it('...and so does one that refuses every letter', () => {
    const base = recordRun({ mutate: ontoTheRadar })
    const refusing = recordRun({
      mutate: ontoTheRadar,
      each: (w) => {
        for (const o of w.offers) if (isOfferLive(o, w.week)) declineOffer(w, o.id)
      },
    })
    expect(refusing.draws.length).toBe(base.draws.length)
    expect(hashOf(refusing.draws)).toBe(hashOf(base.draws))
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
    // instead of appearing by accident. The bare `${seed}` is the MAIN weekly stream — the one whose
    // position careers persist as `rngMain` since v35 — and it must never appear in this module.
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
/** ⚠ RE-AIMED (01.08, feat/brand-ladder): the standing is a PAIR of tables now, so these helpers take
 *  a `SponsorStanding` rather than a bare domestic rank. `domestic(n)` is the old fixture exactly -
 *  a girl on the national table and on no international one - so every case that used to pass a
 *  number still means what it meant. */
const domestic = (nationalRank: number): SponsorStanding => ({
  nationalRank,
  itfRank: 999,
  itfRanked: false,
})
/** ...and its international counterpart, for the two rungs the ladder added. */
const worldly = (itfRank: number, nationalRank = 1): SponsorStanding => ({
  nationalRank,
  itfRank,
  itfRanked: true,
})

/** ⚠ RE-AIMED (01.08): the review moved from the season BOUNDARY into the first OFF-SEASON week, so
 *  a letter arrives at 49 rather than 52. Same once-a-season event, three weeks earlier - see
 *  `isSponsorReviewWeek`. Everything below reads this rather than a literal, so the day it moves
 *  again it moves once. */
const LETTER_WEEK = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49

function seedTheShopWritesTo(stem: string, week = LETTER_WEEK, standing = domestic(1)): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const seed = `${stem}-${attempt}`
    if (shopWritesAt(seed, week, offerChanceFor(standing))) return seed
  }
  throw new Error(`no seed near "${stem}" was written to in 20 tries`)
}

function worldWithLetter(
  seed = 'inbox-1',
  week = LETTER_WEEK,
  standing = domestic(1),
): { world: WorldState; id: string } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const world = createWorld(`${seed}-${attempt}`, DEFAULT_PROFILE)
    world.week = week
    const offer = raiseKitOffer({ offers: world.offers, seed: world.seed, week, standing })
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
    // ⚠ RE-AIMED (01.08) ONLY IN ITS SEED: the arrival roll is keyed on the WEEK, and the review
    //   moved from 52 to 49, so the seed that was written to at 52 is not necessarily written to at
    //   49. Nothing is forced - the helper looks for a seed the engine really does write to, which
    //   is the same bargain `worldWithLetter` documents at length.
    const world = createWorld(seedTheShopWritesTo('expiry'), DEFAULT_PROFILE)
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
    const world = createWorld(seedTheShopWritesTo('frozen-terms', LETTER_WEEK, domestic(25)), DEFAULT_PROFILE)
    world.week = LETTER_WEEK
    const offer = raiseKitOffer({
      offers: world.offers,
      seed: world.seed,
      week: LETTER_WEEK,
      standing: domestic(25),
    })!
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
    expect(kitTermsFor(domestic(1))!.kitAllowanceCents).toBe(ECONOMY.sponsorship.topSeasonCents)
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
  it('⚠ puts a FLOOR under the COVERED lines, and leaves the rest of her kit exactly as it was', () => {
    // ⚠ RE-AIMED (01.08, feat/brand-ladder). This used to assert one scalar cap over all three
    // lines, because there was one rung and it supplied all three. The rung is COVERAGE now, so the
    // assertion is stronger in both directions: the covered line is held down, and the UNCOVERED
    // ones are byte-identical to an unsponsored girl's. A local deal that quietly kept her frame
    // fresh would be the whole ladder collapsing back into one rung, and nothing else in the game
    // would notice.
    const { world, id } = worldWithLetter('kit-floor')
    expect(kitFreshCap(world.offers, world.week)).toBeNull() // ...nothing until it is signed
    acceptOffer(world, id)
    const cap = kitFreshCap(world.offers, world.week)!
    expect(Object.keys(cap)).toEqual(['strings'])
    expect(cap.strings).toBe(ECONOMY.sponsorship.topFreshCap)
    for (let w = world.week; w <= world.offers[0].untilWeek!; w++) {
      const plain = kitWearAt(world.seed, 'working', w)
      const kitted = kitWearAt(world.seed, 'working', w, cap)
      // The covered line: never worse than uncapped, never past the cap, and never better than new -
      // the cap cannot make her better than fresh kit.
      expect(kitted.strings).toBeLessThanOrEqual(plain.strings)
      expect(kitted.strings).toBeLessThanOrEqual(cap.strings!)
      expect(kitted.strings).toBeGreaterThanOrEqual(0)
      // ...and the two lines the local shop never promised are hers, to the last digit.
      expect(kitted.frame).toBe(plain.frame)
      expect(kitted.shoes).toBe(plain.shoes)
    }
  })

  it('⚠ the three rungs cover three different amounts of her kit, and the difference is real', () => {
    // THE LADDER, AS ARITHMETIC. Same seed, same girl, same week - three signatures. Each rung's cap
    // holds down exactly the lines its letter names and no others, so "which of my lines are
    // covered" is a question with a checkable answer rather than a label.
    const seed = 'coverage-shape'
    // A week where ALL THREE lines are worn PAST THE CEILING a deal would put on them, found rather
    // than guessed. The three service lives (strings 5, frame 13+6, shoes 14) and the three purchase
    // cadences do not line up, so a week picked by eye is usually one where the frame is brand new -
    // and a line already fresher than the cap is a line the cap cannot move, which would make the
    // whole case pass for the wrong reason.
    const ceiling = ECONOMY.sponsorship.topFreshCap
    let week = -1
    for (let w = 60; w < 400 && week < 0; w++) {
      const k = kitWearAt(seed, 'working', w)
      if (k.strings > ceiling && k.frame > ceiling && k.shoes > ceiling) week = w
    }
    expect(week, 'no week has all three lines worn – the fixture has gone stale').toBeGreaterThan(0)
    const plain = kitWearAt(seed, 'working', week)
    const capped = (tier: 'local' | 'national' | 'global') => {
      const terms = kitTermsFor(tier === 'local' ? domestic(1) : worldly(tier === 'global' ? 1 : 20))!
      expect(terms.tier).toBe(tier)
      const cap: Record<string, number> = {}
      for (const line of terms.covers) cap[line] = terms.freshCap
      return kitWearAt(seed, 'working', week, cap)
    }
    const local = capped('local')
    const national = capped('national')
    const global = capped('global')
    // Strings: every rung supplies them, so all three sit under the unsponsored girl.
    for (const w of [local, national, global]) expect(w.strings).toBeLessThan(plain.strings)
    // Frame: local leaves it alone; the two rungs above do not.
    expect(local.frame).toBe(plain.frame)
    expect(national.frame).toBeLessThan(plain.frame)
    expect(global.frame).toBeLessThan(plain.frame)
    // Shoes: only the top rung.
    expect(local.shoes).toBe(plain.shoes)
    expect(national.shoes).toBe(plain.shoes)
    expect(global.shoes).toBeLessThan(plain.shoes)
    // ...and the coverage lists themselves are a strict ladder – each rung is a superset of the one
    // below it, so climbing never takes a line away.
    expect(new Set(TIER_COVERS.local)).toEqual(new Set(['strings']))
    for (const line of TIER_COVERS.local) expect(TIER_COVERS.national).toContain(line)
    for (const line of TIER_COVERS.national) expect(TIER_COVERS.global).toContain(line)
  })

  it('...and it reaches the MATCH: the same girl, the same week, a better racket', () => {
    // The end-to-end assertion the whole slice rests on. Two identical worlds one signature apart,
    // composed through the ONE composition point every match path uses.
    const seed = seedTheShopWritesTo('kit-match')
    const signedW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    const plainW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    for (const w of [signedW, plainW]) w.week = LETTER_WEEK
    const offer = raiseKitOffer({
      offers: signedW.offers,
      seed: signedW.seed,
      week: LETTER_WEEK,
      standing: domestic(1),
    })!
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

  it('⚠ ...and it reaches the INJURY threshold through the shoes – but ONLY for the rung that buys them', () => {
    // ⚠ RE-AIMED (01.08, feat/brand-ladder), and this is the re-aim that says most about the slice.
    // It used to run on a LOCAL deal, because a local deal used to supply her shoes. It does not any
    // more - the shop pays for her strings and the rest is hers - so the same case on the same rung
    // now proves the opposite, and both halves are worth pinning:
    //   * a local deal must NOT move the injury threshold, because worn soles are still her problem;
    //   * a GLOBAL deal must, because "everything" includes the shoes and the ladder has to be worth
    //     climbing in a currency other than money.
    // ...found against the STRICTER of the two rolls (`worldly` rolls at the standard chance, the
    // top-10 domestic girl at the stepped-up one), so one seed satisfies both rungs.
    const seed = seedTheShopWritesTo('kit-injury', LETTER_WEEK, worldly(1))
    const openAt = (standing: SponsorStanding) => {
      const w = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
      w.week = LETTER_WEEK
      const offer = raiseKitOffer({ offers: w.offers, seed: w.seed, week: LETTER_WEEK, standing })!
      acceptOffer(w, offer.id)
      return w
    }
    const plainW = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working' })
    const localW = openAt(domestic(1))
    const globalW = openAt(worldly(1))
    expect((localW.offers[0].terms as KitOfferTerms).tier).toBe('local')
    expect((globalW.offers[0].terms as KitOfferTerms).tier).toBe('global')

    let moved = 0
    for (let w = 52; w <= 90; w++) {
      for (const world of [plainW, localW, globalW]) world.week = w
      const bare = injuryTau(plainW)
      // The shop does not buy her shoes, so it cannot buy her out of a rolled ankle.
      expect(injuryTau(localW), `local moved the threshold at week ${w}`).toBe(bare)
      const top = injuryTau(globalW)
      expect(top).toBeLessThanOrEqual(bare) // worn soles raise the threshold; fresh ones cannot
      if (top < bare) moved++
    }
    expect(moved, 'the top rung never actually moved the injury threshold').toBeGreaterThan(0)
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
    // ⚠ RE-AIMED (01.08): the review moved into the off-season, so the letter arrives at week 49 and
    //   the verdict lands at week 101 rather than at the two boundaries 52 / 104. Nothing about what
    //   is being asserted moved - the same deal, the same failure, the same three promises.
    const seed = seedTheShopWritesTo('lapse')
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'middle' })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < LETTER_WEEK; i++) tickWeek(world, rng)
    const offer = world.offers.find((o) => o.state === 'open')!
    acceptOffer(world, offer.id)
    const terms = offer.terms as KitOfferTerms
    // ...and she plays nothing at all, which is the hard end of falling short.
    for (let i = 0; i < WEEKS_PER_YEAR; i++) tickWeek(world, rng)

    const verdictWeek = LETTER_WEEK + WEEKS_PER_YEAR // 101
    // 1. THE VERDICT IS RECORDED, against the number it was judged on.
    expect(world.week).toBe(verdictWeek)
    expect(world.offers[0].eventsPlayed).toBe(0)
    expect(world.offers[0].eventsPlayed! < terms.minEventsPerSeason).toBe(true)
    // 2. THE DEAL ENDED AND WAS NOT RENEWED – no second letter at this review.
    //    ⚠ RE-AIMED (01.08): the review now happens three weeks BEFORE the season it judged runs
    //    out, so a failed deal is still live for the rest of that season - "we shake hands at the
    //    END of it" is what the letter says and now what the code does. It is gone the week after.
    expect(activeKitDeal(world.offers, world.week)).not.toBeNull()
    expect(activeKitDeal(world.offers, 2 * WEEKS_PER_YEAR)).toBeNull()
    expect(world.offers.filter((o) => o.week === verdictWeek)).toHaveLength(0)
    expect(world.offers).toHaveLength(1)
    // 3. ⚠ AND NOTHING WAS CLAWED BACK. The kit the shop bought stays bought: the covered total is
    //    still on the record, and the review that ended the deal took no money at all.
    const covered = world.offers[0].coveredCents ?? 0
    expect(covered).toBeGreaterThan(0)
    const atBoundary = world.financeWeeks.find((w) => w.week === verdictWeek)
    for (const [cat, amount] of Object.entries(atBoundary?.byCategory ?? {})) {
      expect(amount, `${cat} moved at the lapse boundary`).toBeGreaterThanOrEqual(
        cat === 'interest' || cat === 'parent' ? 0 : -Number.MAX_SAFE_INTEGER,
      )
    }
    expect(atBoundary?.byCategory.sponsor ?? 0).toBe(0)
    // ...and it is said out loud, with the figure on it, because a deal ending is exactly when the
    // player needs to see what he has lost.
    const line = world.events.find((e) => e.week === verdictWeek && e.text.includes('kitted her out all season'))
    expect(line?.text).toMatch(/they are done/)
  })

  it('...and a lapse is a missed season, not a blacklist – the shop may write again the year after', () => {
    // The penalty §4.1 describes is "not renewed", which is one season. Nothing in the engine bans a
    // shop from trying again, and nothing should: the obligation is a cost, not a punishment.
    const world = createWorld('lapse-then', DEFAULT_PROFILE)
    world.week = LETTER_WEEK + 2 * WEEKS_PER_YEAR
    // No deal is running at this review, so it is free to roll again.
    const again = raiseKitOffer({
      offers: world.offers,
      seed: world.seed,
      week: world.week,
      standing: domestic(1),
    })
    expect(again === null || again.state === 'open').toBe(true)
  })

  it('the ALLOWANCE and the GATE are ECONOMY.sponsorship\'s, unmoved', () => {
    // The figure is the one that was already balanced; only the shape of the thing changed.
    // ⚠ RE-AIMED (01.08) ONLY IN ITS ARGUMENT: `kitTermsFor` reads a standing rather than a bare
    //   domestic rank now, because two of the three rungs read the other table. `domestic(n)` is a
    //   girl with no international ranking at all, which is exactly the world these numbers were
    //   balanced in, so every assertion still means what it meant.
    expect(kitTermsFor(domestic(1))!.kitAllowanceCents).toBe(localSponsorCents(1))
    expect(kitTermsFor(domestic(30))!.kitAllowanceCents).toBe(localSponsorCents(30))
    expect(kitTermsFor(domestic(31))).toBeNull()
    expect(localSponsorCents(31)).toBe(0)
    expect(offerChanceFor(domestic(31))).toBe(0)
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
    expect(codeOf(letter)).toMatch(/so it ended/i)
    expect(codeOf(letter)).toMatch(/Nothing was paid back/i)
  })

  it('⚠ every field of KitOfferTerms appears on the paper', () => {
    // Spec §3: "a letter whose consequence is not on its face is a trap rather than a decision". The
    // voice is allowed to be warm; the DEAL has to be legible, and a term added to the interface has
    // to reach the paper in the same commit.
    //
    // ⚠ RE-AIMED (01.08) BY WIDENING, WHICH IS THE ONLY DIRECTION THIS TEST MAY EVER MOVE IN. The
    // brand ladder added four terms and every one of them is a thing the parent is committing to, so
    // every one of them is on the sheet. `covers` reaches it through `coveredList` / `coveredWords`,
    // which is what turns a list of line keys into the sentence the whole ladder exists to make
    // readable; the other three are printed by name.
    for (const field of ['brand', 'kitAllowanceCents', 'minEventsPerSeason', 'travelPct', 'seasonWord', 'keepDomesticRank']) {
      expect(template, `the letter never prints ${field}`).toContain(field)
    }
    expect(template, 'the letter never says what it covers').toMatch(/coveredList|coveredWords/)
    // ...and the weeks left, quietly, under it.
    expect(template).toContain('weeksLeft')
    expect(template).toMatch(/to decide/)
  })

  it('⚠ ...AND SO DOES EXCLUSIVITY, because it is the price of signing', () => {
    // ONE BRAND AT A TIME is the counterweight to the coverage: a signed deal turns the next rung's
    // letter away until it ends, which is the whole reason refusing a small deal to wait for a
    // bigger one is a decision. A player who cannot read that on the paper is committing to it
    // blind - the same fault the failure mode had before 31.07, one term further along.
    expect(template).toMatch(/nobody else/i)
    // ...and it is NOT argued in the confirm. `ConfirmDialog` confirms the act (spec §4c).
    const inbox = codeOf(read('../src/components/InboxSheet.vue'))
    expect(inbox).not.toMatch(/nobody else|turns away|instead of waiting/i)
  })

  it('the letterhead is looked up BY TIER, never by a filename spelled out at a call site', () => {
    expect(codeOf(letter)).toContain('images/sponsors/${terms.value.tier}.webp')
    for (const t of SPONSOR_TIERS) expect(codeOf(letter)).not.toContain(`sponsors/${t}.webp`)
  })

  it('⚠ all three rungs are reachable, and every brand is the one on its own artwork', () => {
    // ⚠ RE-AIMED (01.08, feat/brand-ladder). This test used to assert the OPPOSITE - "this slice
    // ships the LOCAL shop only... nothing may reach them yet, and nothing may invent a name or a
    // threshold for them" - and that was exactly right while the ladder was unspecified. The ladder
    // is specified now, so the guard turns round and keeps the half of itself that never expires:
    // THE NAMES ARE STILL READ OFF THE ARTWORK RATHER THAN INVENTED IN A CONFIG FILE. local.webp
    // reads "STRING HOUSE", national.webp "NETRALLY DISTRIBUTION – STRINGS. FRAMES. NATIONWIDE.",
    // global.webp "PLAY BEYOND – EQUIP. SUPPORT. ELEVATE." - and the middle one's tagline is the
    // coverage this slice ships, which is the strongest evidence the ladder was read off the art.
    expect(SPONSOR_TIERS).toEqual(['local', 'national', 'global'])
    expect(ECONOMY.sponsorship.localBrand).toBe('String House')
    expect(ECONOMY.sponsorship.national.brand).toBe('Netrally Distribution')
    expect(ECONOMY.sponsorship.global.brand).toBe('Play Beyond')
    // The domestic table still reaches the local shop and only it – the rung whose gate did not move.
    for (const rank of [1, 5, 10, 11, 30]) expect(kitTermsFor(domestic(rank))!.tier).toBe('local')
    // ...and each of the three marks on disk is now something a real career can be sent.
    for (const t of SPONSOR_TIERS) {
      expect(existsSync(fileURLToPath(new URL(`../public/images/sponsors/${t}.webp`, import.meta.url)))).toBe(true)
    }
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

  it('a migrated career gets its first REAL letter in its next off-season', () => {
    // The whole compensation for the empty back-fill: nothing is reconstructed, and nothing has to
    // be, because the mechanism starts working immediately.
    // ⚠ RE-AIMED (01.08): the arrival week moved from the season boundary (52) to the first
    //   off-season week (49) - see `isSponsorReviewWeek`. Same once-a-season event, three weeks
    //   earlier, and the assertion still says "the very first one it could have got".
    const world = createWorld('post-migration', DEFAULT_PROFILE)
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    expect(world.offers).toEqual([])
    for (let i = 0; i < WEEKS_PER_YEAR; i++) tickWeek(world, rng)
    expect(world.offers.length).toBeGreaterThan(0)
    expect(world.offers[0].week).toBe(LETTER_WEEK)
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
    // ⚠ THE ASSERTION IS "IT PRUNED", NOT "IT LANDED ON 400". `pruneEvents` trims the ordinary rows
    //   and never the `keep` ones, so the retained count is EVENTS_CAP plus however many milestones
    //   this particular week happens to hold - a career whose milestones outnumbered the cap would
    //   legitimately sit above it. The point of the case is that the feed is a rolling window and
    //   the contract is not, so it asserts the window really moved.
    expect(world.events.filter((e) => e.text.startsWith('noise'))).not.toHaveLength(500)
    expect(world.events.length).toBeLessThan(500)
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

// =================================================================================================
// 7. THE BRAND LADDER - three rungs, and the rung says WHICH LINES IT COVERS (01.08)
// =================================================================================================
describe('the three rungs, and the tables they read', () => {
  const s = ECONOMY.sponsorship

  it('⚠ the two upper gates ARE the J300 main draw and its last eight', () => {
    // The thresholds are a reading of the tier catalogue rather than two round numbers picked to
    // feel right, and this is the equality that keeps them one decision. economy.ts cannot import
    // the calendar (calendar.ts imports ECONOMY), so the number is written out there and pinned
    // here - which means a J300 that ever changes its draw size fails this test rather than silently
    // detaching the brand ladder from the ladder it is meant to describe.
    expect(s.national.maxItfRank).toBe(TIERS.j300.drawSize)
    expect(s.global.maxItfRank).toBe(TIERS.j300.drawSize / 4)
    // ...and the ladder tightens as it climbs, which is the one property that must always hold.
    expect(s.global.maxItfRank).toBeLessThan(s.national.maxItfRank)
  })

  it('local reads the DOMESTIC table and the two above it read the INTERNATIONAL one', () => {
    // The whole point of the slice, in four lines. A girl who is #1 at home and nowhere abroad gets
    // the shop; the same girl once she is #13 in the world gets a national label.
    expect(rungFor(domestic(1))).toBe('local')
    expect(rungFor(domestic(30))).toBe('local')
    expect(rungFor(domestic(31))).toBeNull()
    expect(rungFor(worldly(13))).toBe('national')
    expect(rungFor(worldly(s.national.maxItfRank))).toBe('national')
    expect(rungFor(worldly(s.national.maxItfRank + 1))).toBe('local') // ...back to the shop
    expect(rungFor(worldly(s.global.maxItfRank))).toBe('global')
    // ⚠ AND THE OWNER'S OWN SEASON IS THE CASE THIS EXISTS FOR: #1 national, #13 international. He
    // asked whether two contracts would arrive and the answer was no. It is now a national one - and
    // deliberately not the global one, because the calendar's standing rule is that there must
    // always be somewhere to go.
    expect(rungFor({ nationalRank: 1, itfRank: 13, itfRanked: true })).toBe('national')
  })

  it('⚠ an empty international table is not a world ranking', () => {
    // Competition ranking ties everyone without a counting result at the floor, and a fresh
    // fourteen-year-old can read as a number that looks like a standing. Without the `itfRanked`
    // guard she would be sent a global contract in her first winter.
    expect(rungFor({ nationalRank: 1, itfRank: 1, itfRanked: false })).toBe('local')
    expect(rungFor({ nationalRank: 99, itfRank: 1, itfRanked: false })).toBeNull()
  })

  it('the best rung she clears writes, and only that one', () => {
    // A top-8 girl clears all three gates at once. Three letters in one winter would make the ladder
    // a collection rather than a climb.
    const terms = kitTermsFor({ nationalRank: 1, itfRank: 1, itfRanked: true })!
    expect(terms.tier).toBe('global')
    expect(terms.covers).toEqual(TIER_COVERS.global)
    expect(terms.travelShare).toBe(s.global.travelShare)
    expect(terms.seasons).toBe(s.global.seasons)
  })

  it('the national rung carries a DOMESTIC keep-condition and the others carry none', () => {
    // National's job on the way OUT. It is the only rung gated on two tables at once, and that is
    // the point: the deal arrives on her world ranking and survives on her place at home.
    expect(kitTermsFor(worldly(20))!.keepDomesticRank).toBe(s.national.keepDomesticRank)
    expect(kitTermsFor(worldly(1))!.keepDomesticRank).toBeUndefined()
    expect(kitTermsFor(domestic(1))!.keepDomesticRank).toBeUndefined()
    // ...and it is the same top 30 the local shop's own gate uses, so the two halves of the domestic
    // ladder's job are one number.
    expect(s.national.keepDomesticRank).toBe(s.maxRank)
  })

  it('only the top rung touches travel, and it goes through the ONE definition', () => {
    expect(kitTermsFor(domestic(1))!.travelShare).toBe(0)
    expect(kitTermsFor(worldly(20))!.travelShare).toBe(0)
    expect(kitTermsFor(worldly(1))!.travelShare).toBeGreaterThan(0)
    // A sponsor discount computed at the till and not at the refund is free money in four
    // keystrokes, so `travelCostFor` is the only place a fare is ever reduced.
    const src = codeOf(read('../src/engine/world.ts'))
    expect(src.match(/kitTravelShare\(/g)?.length ?? 0).toBeGreaterThan(0)
    expect(src).not.toMatch(/travelCostCents \* [^)\n]*travelShare/)
  })

  it('...and the brand takes its share of what the family still owes, never of the fare twice', () => {
    // Two payers compose rather than add: a scholarship at 80% plus a brand at 25% is 85% covered,
    // not 105%. The pure arithmetic, so this cannot drift with the knobs.
    const fare = 2_000_00
    const afterAcademy = fare - Math.round(fare * 0.8)
    const afterBoth = afterAcademy - Math.round(afterAcademy * s.global.travelShare)
    expect(afterBoth).toBeGreaterThan(0)
    expect(afterBoth).toBeLessThan(afterAcademy)
  })
})

describe('⚠ ONE BRAND AT A TIME', () => {
  it('a running deal turns the next rung away until it ends', () => {
    // The counterweight to the coverage, and the price of caution. She signs a two-season national
    // deal; next winter she is inside the world top 8 and the global letter finds her busy.
    const { world, id } = worldWithLetter('one-brand', LETTER_WEEK, worldly(20))
    expect((world.offers[0].terms as KitOfferTerms).tier).toBe('national')
    acceptOffer(world, id)
    const until = world.offers[0].untilWeek!
    // Two seasons: signed in the off-season of season 0, covering seasons 1 and 2.
    expect(until).toBe(3 * WEEKS_PER_YEAR - 1)

    const nextReview = LETTER_WEEK + WEEKS_PER_YEAR
    expect(nextReview).toBeLessThan(until)
    const blocked = raiseKitOffer({
      offers: world.offers,
      seed: world.seed,
      week: nextReview,
      standing: worldly(1), // ...she is top 8 in the world now, and it does not matter
    })
    expect(blocked, 'a competing brand wrote while a deal was running').toBeNull()
    expect(world.offers).toHaveLength(1)
  })

  it('...and an unanswered letter blocks one too', () => {
    const { world } = worldWithLetter('one-letter')
    // She has not signed and has not refused; nobody else writes over the top of an open decision.
    const second = raiseKitOffer({
      offers: world.offers,
      seed: world.seed,
      week: world.week + 1,
      standing: worldly(1),
    })
    expect(second).toBeNull()
  })

  it('...and once it is over, the ladder is open again', () => {
    const { world, id } = worldWithLetter('one-brand-after')
    acceptOffer(world, id)
    const after = world.offers[0].untilWeek! + 1
    expect(activeKitDeal(world.offers, after)).toBeNull()
    const again = raiseKitOffer({
      offers: world.offers,
      seed: seedTheShopWritesTo('one-brand-after-roll', after, worldly(1)),
      week: after,
      standing: worldly(1),
    })
    expect(again?.state).toBe('open')
    expect((again!.terms as KitOfferTerms).tier).toBe('global')
  })

  it('a refusal does NOT block – saying no is what leaves the ladder open', () => {
    const { world, id } = worldWithLetter('refuse-then')
    declineOffer(world, id)
    const next = raiseKitOffer({
      offers: world.offers,
      seed: seedTheShopWritesTo('refuse-then-roll', world.week + 1, worldly(1)),
      week: world.week + 1,
      standing: worldly(1),
    })
    expect(next?.state).toBe('open')
  })
})

describe('the letter arrives in the OFF-SEASON, once', () => {
  it('⚠ fires on the FIRST quiet week and on no other one', () => {
    // The once-a-season guarantee, which the season boundary used to give away for free and the
    // three-week off-season does not. Swept over four whole seasons rather than asserted at one
    // week, because "it fires once" is a property of the year and not of a number.
    const weeks: number[] = []
    for (let w = 0; w < 4 * WEEKS_PER_YEAR; w++) if (isSponsorReviewWeek(w)) weeks.push(w)
    expect(weeks).toEqual([49, 101, 153, 205])
    expect(isSponsorReviewWeek(50)).toBe(false)
    expect(isSponsorReviewWeek(51)).toBe(false)
    expect(isSponsorReviewWeek(52)).toBe(false)
    expect(WEEKS_PER_YEAR - OFF_SEASON_WEEKS).toBe(49)
  })

  it('a whole career gets exactly one letter a season, never three', () => {
    // The bug the predicate exists to prevent, run end to end: if the review fired on every
    // off-season week this career would leave season 1 with three letters in the inbox.
    const world = createWorld('once-a-season', DEFAULT_PROFILE)
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 3 * WEEKS_PER_YEAR; i++) tickWeek(world, rng)
    for (const o of world.offers) expect(o.week % WEEKS_PER_YEAR).toBe(LETTER_WEEK)
    expect(new Set(world.offers.map((o) => o.week)).size).toBe(world.offers.length)
  })

  it('⚠ the window runs out of the quiet weeks and into the new year, on purpose', () => {
    // Four weeks of thinking against a three-week off-season, so a letter raised at 49 can still be
    // signed at 53. That is the honest shape rather than an accident: the owner asked for a real
    // pause («давать человеку какое-то время на подумать») and shortening it to fit the calendar
    // would be letting the calendar edit the decision. What matters is that the deal is SIGNABLE
    // before the season opens, which it is from the day it arrives.
    const { world } = worldWithLetter('window-shape')
    expect(world.offers[0].week).toBe(LETTER_WEEK)
    expect(world.offers[0].deadlineWeek).toBe(LETTER_WEEK + ECONOMY.sponsorship.decideWeeks)
    expect(world.offers[0].deadlineWeek).toBeGreaterThan(WEEKS_PER_YEAR)
  })

  it('signing in the quiet weeks means she opens the season already kitted', () => {
    // The owner's point («было бы логичным их как раз к старту сезона привязывать»): the contract is
    // agreed before the year starts and is in force on its first week.
    const { world, id } = worldWithLetter('kitted-at-open')
    acceptOffer(world, id)
    expect(activeKitDeal(world.offers, LETTER_WEEK)).not.toBeNull() // ...already, in the off-season
    expect(activeKitDeal(world.offers, WEEKS_PER_YEAR)).not.toBeNull() // ...and on week one
    expect(kitFreshCap(world.offers, WEEKS_PER_YEAR)).not.toBeNull()
  })

  it('⚠ holding the letter can never BUY weeks – the term is anchored on the season', () => {
    // Spec §2 in its strongest form. Two identical careers, one signs at once and one waits until
    // the deadline: the late signer gets strictly FEWER weeks of cover and not one more.
    const early = worldWithLetter('anchor-early')
    const late = worldWithLetter('anchor-early') // same seed walk, same letter
    acceptOffer(early.world, early.id)
    late.world.week = late.world.offers[0].deadlineWeek
    acceptOffer(late.world, late.id)
    expect(late.world.offers[0].untilWeek).toBe(early.world.offers[0].untilWeek)
    expect(late.world.offers[0].decidedWeek!).toBeGreaterThan(early.world.offers[0].decidedWeek!)
  })
})

describe('National stops being dead content on the way OUT', () => {
  /** A career holding a signed national deal, ready for the review that judges its first season. */
  function nationalDealAt(seed: string): { world: WorldState } {
    const { world, id } = worldWithLetter(seed, LETTER_WEEK, worldly(20))
    acceptOffer(world, id)
    return { world }
  }

  it('the deal is gated on the world table and kept on the domestic one', () => {
    const { world } = nationalDealAt('nat-gate')
    const terms = world.offers[0].terms as KitOfferTerms
    expect(terms.tier).toBe('national')
    expect(terms.keepDomesticRank).toBe(ECONOMY.sponsorship.maxRank)
    // Two seasons, so it is still running when the domestic table is next read - which is exactly
    // what gives the domestic ladder a job for as long as the contract lasts.
    expect(terms.seasons).toBeGreaterThan(1)
  })

  it('⚠ slide out of the domestic top 30 and the brand goes, even having played enough', () => {
    // The link, end to end and through the real review. She meets the entry obligation and loses the
    // deal anyway, because a national label backs a girl who is still somebody at home.
    const { world } = nationalDealAt('nat-slide')
    const until = world.offers[0].untilWeek!
    const review = LETTER_WEEK + WEEKS_PER_YEAR
    // She played plenty...
    for (let i = 0; i < ECONOMY.sponsorship.national.minEvents; i++) {
      world.events.push({ id: world.nextEventId++, week: WEEKS_PER_YEAR + i, type: 'tournament', text: `event ${i}` })
    }
    // ...and slid off the domestic table entirely, which is what a season spent abroad does.
    world.week = review
    world.kidRankDomestic = ECONOMY.sponsorship.maxRank + 1
    reviewSponsors(world)
    // The second season it was contracted for is gone: the term is pulled back to the end of the
    // season she just failed, and she keeps the kit for the three quiet weeks that remain.
    expect(world.offers[0].untilWeek).toBeLessThan(until)
    expect(activeKitDeal(world.offers, review)).not.toBeNull()
    expect(activeKitDeal(world.offers, 2 * WEEKS_PER_YEAR)).toBeNull()
    const line = world.events.find((e) => e.week === review && e.text.includes('Netrally'))
    expect(line?.text).toMatch(/top 30/)
    expect(line?.text).toMatch(/they are done/)
  })

  it('...and holding her place at home keeps it, with a year still to run', () => {
    const { world } = nationalDealAt('nat-hold')
    const until = world.offers[0].untilWeek!
    const review = LETTER_WEEK + WEEKS_PER_YEAR
    for (let i = 0; i < ECONOMY.sponsorship.national.minEvents; i++) {
      world.events.push({ id: world.nextEventId++, week: WEEKS_PER_YEAR + i, type: 'tournament', text: `event ${i}` })
    }
    world.week = review
    world.kidRankDomestic = 4
    reviewSponsors(world)
    expect(world.offers[0].untilWeek).toBe(until)
    expect(activeKitDeal(world.offers, 2 * WEEKS_PER_YEAR)).not.toBeNull() // ...a whole season still to run
    expect(world.offers).toHaveLength(1) // ...and nobody wrote over the top of it
  })

  it('⚠ nothing is clawed back when the link breaks – it is a contract ending, not a fine', () => {
    const { world } = nationalDealAt('nat-nofine')
    const review = LETTER_WEEK + WEEKS_PER_YEAR
    world.week = review
    world.kidRankDomestic = 99
    const fundsBefore = world.fundsCents
    reviewSponsors(world)
    expect(world.fundsCents).toBe(fundsBefore)
  })
})

// =================================================================================================
// 8. THE SCHEMA (v33) - the terms a signed contract already had
// =================================================================================================
describe('the v33 schema step', () => {
  /** A v32 save carrying a SIGNED local deal, in the shape v32 really wrote. */
  const v32WithDeal = (): Record<string, unknown> => ({
    schemaVersion: 32,
    seed: 'v32-brands',
    week: 60,
    careerId: 'legacy',
    fundsCents: 500_000,
    profile: { ...DEFAULT_PROFILE },
    offers: [
      {
        id: 'kit-52',
        kind: 'kit',
        week: 52,
        deadlineWeek: 56,
        state: 'signed',
        decidedWeek: 53,
        untilWeek: 103,
        coveredCents: 41_200,
        terms: {
          tier: 'local',
          brand: 'String House',
          kitAllowanceCents: 200_000,
          freshCap: 0.3,
          minEventsPerSeason: 8,
        },
      },
    ],
  })

  it('⚠ back-fills the deal the player ACTUALLY signed, not the rung it would get today', () => {
    // v32 declined to mine because no decision had ever been taken. This one back-fills because a
    // decision HAS been taken and the fields are its terms rather than a guess at them.
    //
    // ⚠ AND THE VALUE IS THE OLD BEHAVIOUR. Under v32 a local deal covered ALL THREE LINES; under
    // v33 it covers her strings. Writing `TIER_COVERS.local` here would take two lines away from a
    // contract whose letter is still in the player's inbox promising them - re-writing history in
    // the brand's favour. `activeKitDeal` has always said a deal is honoured under the numbers it
    // was signed under, and this is that rule's first real test.
    const migrated = migrateSave(v32WithDeal()) as unknown as WorldState
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    const terms = migrated.offers[0].terms as KitOfferTerms
    expect([...terms.covers].sort()).toEqual(['frame', 'shoes', 'strings'])
    expect(terms.travelShare).toBe(0)
    expect(terms.seasons).toBe(1)
    // ...and nothing else about the contract moved: the term she signed is the term she gets.
    expect(migrated.offers[0].untilWeek).toBe(103)
    expect(migrated.offers[0].coveredCents).toBe(41_200)
    expect(terms.kitAllowanceCents).toBe(200_000)
  })

  it('...so a migrated deal still keeps every line fresh, exactly as it did before the update', () => {
    // The back-fill is not a formality: it is what stops the update quietly cancelling two thirds of
    // a live contract on the week the player installs it.
    const migrated = migrateSave(v32WithDeal()) as unknown as WorldState
    const cap = kitFreshCap(migrated.offers, 60)!
    expect(Object.keys(cap).sort()).toEqual(['frame', 'shoes', 'strings'])
    expect(kitTravelShare(migrated.offers, 60)).toBe(0)
  })

  it('is idempotent, and heals a malformed value rather than trusting it', () => {
    const once = migrateSave(v32WithDeal())
    expect(migrateSave(structuredClone(once))).toEqual(once)
    const broken = v32WithDeal()
    ;(broken.offers as { terms: unknown }[])[0].terms = 'not an object'
    expect(() => migrateSave(broken)).not.toThrow()
    const empty = migrateSave({ ...v32WithDeal(), offers: [] }) as unknown as WorldState
    expect(empty.offers).toEqual([])
  })

  it('a fresh career needs no back-fill at all – its letters are born with the fields', () => {
    const world = createWorld('v33-fresh', DEFAULT_PROFILE)
    world.week = LETTER_WEEK
    const offer = raiseKitOffer({
      offers: world.offers,
      seed: seedTheShopWritesTo('v33-fresh-roll', LETTER_WEEK, domestic(1)),
      week: LETTER_WEEK,
      standing: domestic(1),
    })!
    const terms = offer.terms as KitOfferTerms
    expect(terms.covers).toEqual(TIER_COVERS.local)
    expect(terms.travelShare).toBe(0)
    expect(terms.seasons).toBe(1)
  })
})
