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
import { worldSource } from './worldSource'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  cancelEntry,
  releaseEntry,
  createWorld,
  enterEvent,
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
  isSponsorWindowWeek,
  sponsorWindowOpensAt,
  kitOfferDeadline,
  isSponsorLetterWeek,
  contractEndWeek,
  kitFreshCap,
  kitTermsFor,
  kitTravelShare,
  offerChanceFor,
  pruneEntryLetters,
  raiseKitOffers,
  raiseKitEndLetter,
  raiseKitRenewal,
  rungFor,
  shopWritesAt,
  standingClears,
  seasonSpokenFor,
  windowLadder,
  SPONSOR_TIERS,
  SPONSOR_WINDOW_WEEKS,
  SPONSOR_LETTER_WEEKS,
  TIER_COVERS,
  type SponsorStanding,
} from '../src/engine/offers'
import type { Offer } from '../src/shared/protocol'
import { migrateSave } from '../src/engine/migrations'
import { kitWearAt } from '../src/engine/equipment'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { rollInjury } from '../src/engine/world/injury'
import { layoffCovering } from '../src/engine/world/medical'
import { OFF_SEASON_WEEKS, TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { SeasonEvent } from '../src/engine/season/types'
import { DEFAULT_PROFILE, type EntryLetterTerms, type KitOfferTerms } from '../src/shared/protocol'
// Comments are not code - the `codeOf` discipline, now in tests/helpers/source.ts. Load-bearing
// here: this file's subjects document themselves at length, and one of them explains in prose
// exactly the thing a raw scan is looking for.
import { codeOf, regionToLast } from './helpers/source'
import { fnv1aHex } from './helpers/hash'

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

// =================================================================================================
// 1. ⚠ MAIN-STREAM INVARIANCE - blocks merge. Pairwise since v35 (P3, rng-persistence): the
// cross-suite constant retired with the load replay it guarded; each test below compares its
// action arm against the letters-ignored baseline built by the same harness, same code.
// =================================================================================================

// FNV-1a over the stringified draw stream – the hash lives in tests/helpers/hash.ts.
const hashOf = (draws: number[]) => fnv1aHex(draws.map((d) => d.toString()).join(','))

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
  it('every stream it opens is `seed:offer:` or `seed:ad:` and nothing else', () => {
    // A CLOSED ALLOWLIST rather than a generic pattern, the shape tests/preview.test.ts established:
    // a second sub-stream has to be added here deliberately, by somebody who has read this comment,
    // instead of appearing by accident. The bare `${seed}` is the MAIN weekly stream — the one whose
    // position careers persist as `rngMain` since v35 — and it must never appear in this module.
    //
    // ⭐ `seed:ad:` EARNED ITS SLOT WITH ROUND 24 ITEM 2 (the-face-and-the-court.md §6 step 1): the
    // advertising letter's one roll, in `adWritesAt`. It is deliberately NOT `seed:offer:` — putting
    // both letters on one stream would make the kit roll and the ad roll read the same dice on the
    // same week, which is exactly the coupling purpose-scoping exists to forbid.
    const src = codeOf(read('../src/engine/offers.ts'))
    const keys = [...src.matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
    expect(keys.length, 'the sweep found no draws at all - the regex has gone stale').toBeGreaterThan(0)
    for (const k of keys) expect(k, `offers reads ${k}`).toMatch(/^\$\{seed\}:(offer|ad):/)
  })

  it('no function in the module takes an Rng – there is no parameter to misuse', () => {
    // The structural half of the guarantee, and the idiom tests/injuries.test.ts keeps for
    // rollInjury/resolvePhysio/injuryTau. A signature that cannot accept the weekly stream cannot
    // spend it.
    expect(raiseKitOffers.length).toBe(1) // ({ offers, seed, week, standing })
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
  ...unranked.wta,
})
/** ...and its international counterpart, for the two rungs the ladder added. */
const worldly = (itfRank: number, nationalRank = 1): SponsorStanding => ({
  nationalRank,
  itfRank,
  itfRanked: true,
  ...unranked.wta,
})
/** ⚠ RE-AIMED AGAIN (02.08, the professional arm): the standing is THREE tables now. Every fixture
 *  above is a girl with no professional standing - which is what they all meant when they were
 *  written - so `unranked.wta` spells that once instead of twice per helper, and the cases that
 *  are ABOUT the professional table say so by building it themselves (`pro` below). */
const unranked = { wta: { wtaRank: 999, wtaRanked: false } } as const
/** A professional standing: her merged W rank, and by default nothing left in the junior or
 *  domestic tables - the real shape of a career two seasons into the tour. */
const pro = (wtaRank: number, over: Partial<SponsorStanding> = {}): SponsorStanding => ({
  nationalRank: 999,
  itfRank: 999,
  itfRanked: false,
  wtaRank,
  wtaRanked: true,
  ...over,
})

/** ⚠ RE-AIMED TWICE, AND THE SECOND TIME IS WHY IT IS A CONSTANT AT ALL.
 *
 *  (01.08) the review moved from the season BOUNDARY into the first OFF-SEASON week, so a letter
 *  arrived at 49 rather than 52.
 *
 *  (05.08, feat/sponsor-window) the single review week became a FIVE-WEEK WINDOW - the off-season
 *  plus the two weeks before it - with a letter landing on each of its first four weeks, one rung at
 *  a time. So the week a career's FIRST letter arrives is the window's OPENING week, 47: the ladder
 *  is walked weakest-first, and a girl who clears only the local rung is written to in slot 0.
 *  Everything below reads this rather than a literal, which is what made the second move a one-line
 *  change to a helper rather than a rewrite of forty assertions. */
const LETTER_WEEK = WEEKS_PER_YEAR - SPONSOR_WINDOW_WEEKS // 47
/** The window's last week - every letter in a window expires with the window, so this is the last
 *  week any of them can be signed. */
const WINDOW_CLOSE_WEEK = WEEKS_PER_YEAR - 1 // 51

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
    const [offer] = raiseKitOffers({ offers: world.offers, seed: world.seed, week, standing })
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
    // ⚠ RE-AIMED (05.08) ONLY IN HOW FAR IT TICKS: it used to run a full 52 weeks and still find the
    //   letter open, because a letter raised at 49 carried a four-week deadline that reached into
    //   week 53. Every letter now dies with the WINDOW (week 51) instead of four weeks after its own
    //   arrival - see `SPONSOR_LETTER_WEEKS` for why - so a career ticked to 52 has already had it
    //   taken. Nothing about what is being asserted moved: the deadline is real, the tick is what
    //   enforces it, and nobody has to touch the letter for it to go.
    for (let i = 0; i < WINDOW_CLOSE_WEEK; i++) tickWeek(world, rng)
    const offer = world.offers.find((o) => o.state === 'open')
    expect(offer).toBeDefined()
    const deadline = offer!.deadlineWeek
    expect(deadline).toBe(WINDOW_CLOSE_WEEK)
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
    const [offer] = raiseKitOffers({
      offers: world.offers,
      seed: world.seed,
      week: LETTER_WEEK,
      standing: domestic(25),
    })
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
    const [offer] = raiseKitOffers({
      offers: signedW.offers,
      seed: signedW.seed,
      week: LETTER_WEEK,
      standing: domestic(1),
    })
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
      const [offer] = raiseKitOffers({ offers: w.offers, seed: w.seed, week: LETTER_WEEK, standing })
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

  it('⚠ a term served in full also gets its goodbye - the bills are the family\'s again', () => {
    // The owner's report was about a deal that FAILED, but the same silence hides the happier
    // ending: a contract that simply runs out stops paying for her kit on a week nobody announced.
    // Both endings raise a notice; only the copy differs (KitEndReason).
    const reasons = ['events', 'standing', 'term'] as const
    for (const r of reasons) {
      const offers: Offer[] = []
      const deal: Offer = {
        id: `kit-${r}`,
        kind: 'kit',
        week: 49,
        deadlineWeek: 53,
        state: 'signed',
        terms: kitTermsFor(worldly(4))!,
        untilWeek: 101,
      }
      const notice = raiseKitEndLetter(offers, 101, deal, r, 9)
      expect(notice.state, r).toBe('info')
      expect((notice.terms as KitOfferTerms).ended, r).toBe(r)
      expect((notice.terms as KitOfferTerms).endedEventsPlayed, r).toBe(9)
      // A notice is never a decision: it cannot be live, so it cannot light the "answer me" dot.
      expect(isOfferLive(notice, 101), r).toBe(false)
    }
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
    // ⚠ RE-AIMED (owner, 04.08: «I believe we need to send an email with the termination message»).
    // What this pinned, and still pins, is that a brand which has just walked away does NOT turn
    // round and offer her a new contract in the same breath. What it accidentally also pinned was
    // SILENCE - and silence was the bug: the status line on the signed letter was already correct
    // and already unread, so the first thing the player noticed was gear bills he thought the brand
    // was paying. The goodbye now arrives as its own letter, which is what makes the inbox knock.
    // So the assertion moves from "nothing was raised" to "nothing SIGNABLE was raised".
    const raisedAtVerdict = world.offers.filter((o) => o.week === verdictWeek)
    expect(raisedAtVerdict.every((o) => o.state === 'info')).toBe(true)
    expect(raisedAtVerdict.filter((o) => (o.terms as KitOfferTerms).ended === 'events')).toHaveLength(1)
    expect(world.offers).toHaveLength(2)
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
    // ⚠ RE-AIMED (05.08): the ONE feed row a sponsor season is allowed now lands on the window's
    //   LAST week rather than on its first. That is the feed budget rather than a preference - four
    //   letter weeks could otherwise have become four rows, and the measurement above
    //   `reviewSponsors` prices one extra row a season at 0.36 -> 0.64 points of radar re-widening.
    //   Written last, one line can carry the whole winter. The news the player actually needs at the
    //   moment of the verdict is the brand's own GOODBYE LETTER, which is still raised on the
    //   verdict week and is what makes the inbox knock (04.08) - and that is asserted above.
    for (let i = 0; i < SPONSOR_WINDOW_WEEKS - 1; i++) tickWeek(world, rng)
    expect(world.week).toBe(WINDOW_CLOSE_WEEK + WEEKS_PER_YEAR)
    const line = world.events.find((e) => e.text.includes('kitted her out all season'))
    expect(line?.week).toBe(WINDOW_CLOSE_WEEK + WEEKS_PER_YEAR)
    expect(line?.text).toMatch(/they are done/)
  })

  it('...and a lapse is a missed season, not a blacklist – the shop may write again the year after', () => {
    // The penalty §4.1 describes is "not renewed", which is one season. Nothing in the engine bans a
    // shop from trying again, and nothing should: the obligation is a cost, not a punishment.
    const world = createWorld('lapse-then', DEFAULT_PROFILE)
    world.week = LETTER_WEEK + 2 * WEEKS_PER_YEAR
    // No deal is running at this review, so it is free to roll again.
    const again = raiseKitOffers({
      offers: world.offers,
      seed: world.seed,
      week: world.week,
      standing: domestic(1),
    })
    expect(again.length === 0 || again[0].state === 'open').toBe(true)
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
  const template = regionToLast(letter, '<template>', '</template>')

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
    // ⚠ RE-AIMED TWICE, NEVER WEAKENED, AND THE CLAIM IS THE SAME ONE EVERY TIME. W3-ACT2 pointed
    // the lookup at `sponsorArtKey` because three marks had to serve six rungs; on 05.08 the owner
    // shipped the missing three, the redirect was deleted (engine/offers.ts records why an identity
    // function was not left behind), and the tier is the key again. The property this test protects
    // is untouched: no call site spells out a letterhead's filename.
    expect(codeOf(letter)).toContain('images/sponsors/${terms.value.tier}.webp')
    for (const t of SPONSOR_TIERS) expect(codeOf(letter)).not.toContain(`sponsors/${t}.webp`)
    // ...and every rung really does resolve to a mark that exists on disk. Asserted against the
    // FILESYSTEM rather than against a hand-kept list of three keys, which is what the old arm did
    // and what a redirect made necessary; there is nothing to redirect now, so the honest question
    // is whether the file is there. (tests/art-placeholders.test.ts owns the same claim as the
    // registry's guard; this one keeps it local to the letter that renders the mark.)
    for (const t of SPONSOR_TIERS) {
      expect(
        existsSync(new URL(`../public/images/sponsors/${t}.webp`, import.meta.url)),
        `the "${t}" rung is on the sponsor ladder but public/images/sponsors/${t}.webp does not exist`,
      ).toBe(true)
    }
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
    // ⚠ SIX RUNGS SINCE W3-ACT2, and the half of this guard that never expires is untouched: the
    // three junior-era names are still read off the artwork. The three PROFESSIONAL names were
    // invented here for one wave, because no mark existed for them - stated openly and flagged for
    // the owner. ⚠⚠ THAT DEBT IS PAID (05.08): he drew all three, and they are read off the artwork
    // like the first three - tour.webp is BASELINE ATHLETIC, premium.webp MERIDIAN SPORT, icon.webp
    // AURELIA. So every rung on the ladder now takes its name from a picture again, which is the
    // property this guard has protected since 01.08.
    // ⚠ AND THE ORDER IS THE LADDER, not a listing. `rungFor` reverses this and takes the first
    // rung she clears, so `tour` (WTA 200) must sit BELOW `global` (WTA 87) or a #60 professional
    // would be handed the weaker brand and the stronger one would be unreachable. Pinned exactly.
    expect(SPONSOR_TIERS).toEqual(['local', 'national', 'tour', 'global', 'premium', 'icon'])
    expect(ECONOMY.sponsorship.localBrand).toBe('String House')
    expect(ECONOMY.sponsorship.national.brand).toBe('Netrally Distribution')
    expect(ECONOMY.sponsorship.global.brand).toBe('Play Beyond')
    // The domestic table still reaches the local shop and only it – the rung whose gate did not move.
    for (const rank of [1, 5, 10, 11, 30]) expect(kitTermsFor(domestic(rank))!.tier).toBe('local')
    // ...and every rung resolves to a mark that really is on disk. ⚠ BY ITS OWN NAME AGAIN (05.08).
    // W3-ACT2 had to route this through `sponsorArtKey` because three marks served six rungs; the
    // three real marks shipped, the redirect is deleted, and the check goes back to the filename
    // convention - which is no longer "a convention that happened to hold" but the whole mapping.
    // The claim is unchanged and still exhaustive: no rung may be sendable without a picture on the
    // letter.
    for (const t of SPONSOR_TIERS) {
      expect(existsSync(fileURLToPath(new URL(`../public/images/sponsors/${t}.webp`, import.meta.url))), t).toBe(true)
    }
  })

  it('no Cyrillic reaches a template, and the player copy uses the short dash', () => {
    for (const p of ['../src/components/OfferLetter.vue', '../src/components/InboxSheet.vue']) {
      const src = read(p)
      const tpl = regionToLast(src, '<template>', '</template>')
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

  it('⚠ ...and the FLOOR is that same draw run the other way - a whole season of it', () => {
    // 09.08 (fix/sponsor-floor). The local rung grew a junior arm because the domestic one alone is
    // inverted - see ECONOMY.sponsorship.localMaxItfRank - and its number is read off the SAME tier
    // row its two neighbours are, so the ladder stays one decision rather than three.
    //
    // TWO READINGS, ONE NUMBER, which is why it is 128 and not a figure that felt about right:
    //   * the ladder's own step is a factor of four (32 -> 8 climbing), so one rung DOWN is 32 x 4;
    //   * J300 runs every 13 weeks, i.e. four a season, so 128 is every main-draw place at the
    //     prestige rung over a year - "good enough to be in a J300 draw at some point this season".
    expect(s.localMaxItfRank).toBe(TIERS.j300.drawSize * 4)
    expect(s.localMaxItfRank).toBe(TIERS.j300.drawSize * (WEEKS_PER_YEAR / TIERS.j300.everyNWeeks))
    // ...and the shop is WIDER than the distributor, which is the whole point of a floor: it must
    // catch the careers the bigger brands passed on, not the same ones under another name.
    expect(s.localMaxItfRank).toBeGreaterThan(s.national.maxItfRank)
  })

  it('⚠ THE INVERTED GATE: a girl the world ranks is not refused by the shop in her own town', () => {
    // THE OWNER'S OWN SAVE, 09.08, as a fixture: Olivia at week 104 stands national #67, ITF #4, no
    // professional ranking. She cleared `global` and `national` and the LOCAL shop refused her,
    // because her domestic points had decayed while she was abroad - so her window carried two
    // letters instead of three and both dice missed.
    const olivia: SponsorStanding = { nationalRank: 67, itfRank: 4, itfRanked: true, ...unranked.wta }
    expect(standingClears(olivia, 'global')).toBe(true)
    expect(standingClears(olivia, 'national')).toBe(true)
    expect(standingClears(olivia, 'local')).toBe(true)
    // ...and the whole ladder writes to her, strongest first, which is the letter that was missing.
    expect(windowLadder(olivia)).toEqual(['global', 'national', 'local'])
    // The rung she is OFFERED is unchanged: the floor is an alternative below the best brand, never
    // a replacement for it (`rungFor` is still strongest-first).
    expect(rungFor(olivia)).toBe('global')
  })

  it('⚠ ...and it is a floor, not an amnesty - three things it still refuses', () => {
    // The counterweight, because a gate that never says no is not a gate.
    //   1. NO STANDING ANYWHERE. Outside the domestic top 30, no live junior points, no W ranking:
    //      the shop has genuinely not heard of her, and «nothing is manufactured» still holds.
    expect(rungFor(domestic(31))).toBeNull()
    //   2. AN EMPTY TABLE IS NOT A RANKING. Competition ranking ties everyone without a counting
    //      result at the floor, so `itfRanked` guards the new arm exactly as it guards the two above.
    expect(standingClears({ nationalRank: 99, itfRank: 1, itfRanked: false, ...unranked.wta }, 'local')).toBe(false)
    //   3. AND IT HAS A CEILING. It reads as "ranked at all" only because today's junior table is
    //      shallower than the cut; past it the shop still says no, and it starts biting again the day
    //      the cohort outgrows the number.
    const deep = { nationalRank: 99, itfRank: s.localMaxItfRank + 1, itfRanked: true, ...unranked.wta }
    expect(standingClears(deep, 'local')).toBe(false)
    expect(standingClears({ ...deep, itfRank: s.localMaxItfRank }, 'local')).toBe(true)
  })

  // ===============================================================================================
  // ⭐⭐ THE SPONSOR GATES READ THEIR OWN CONSTANTS, AND NOTHING ELSE (16.08)
  // ===============================================================================================
  // WHAT WAS HERE: `expect(s.national.maxWtaRank).toBe(TIERS.w100.acceptsRank)` – an equality PIN,
  // whose whole job was to stop the two drifting apart. It did that, and the drift it prevented was
  // the one worth having: P3's acceptance-cut work moved `TIERS.w100.acceptsRank` 350 -> 240, the pin
  // held, and BOTH sponsor rungs moved with it – national 350 -> 240, global 87 -> 60, narrowing
  // global's professional band from 37 ranks wide to ten. Nobody decided that. A pin on a coupling
  // does not remove the coupling; it guarantees it.
  //
  // ⚠ IT IS THE SAME DEFECT P4 FIXED FOR THE COLLEGE DOOR – one constant doing two unrelated jobs –
  // and the fix is the same shape. An acceptance cut is a rule of the TOUR (who may enter); a
  // sponsor's interest is a fact about VISIBILITY (how famous a rank makes you). They coincided once,
  // in 02.08's derivation, and a coincidence is not a dependency.
  //
  // These two cases are what makes the decoupling a PROPERTY rather than a claim, and they are P4's
  // own pattern: the first MOVES the constant that used to drag and asserts nothing follows; the
  // second moves the sponsor rung's OWN knob, so the first cannot pass vacuously (a `standingClears`
  // that ignored the gates entirely would satisfy it). ⚠ Both mutate the shipped module objects and
  // restore them in `finally` – `TIERS` is a plain `Record` and `ECONOMY` is `as const` but the same
  // live object at runtime, so a throw between the two would leak into every later file in this worker.
  //
  /** ⚠ THE ONE WIDENING, AND IT IS AS NARROW AS IT CAN BE. `ECONOMY` is declared `as const`, so a
   *  decoupling proof that moves a sponsor gate has to widen the field it moves; naming the two rungs
   *  and the one field keeps the cast from becoming a licence to edit the block. */
  const sponsorKnob = (rung: 'national' | 'global'): { maxWtaRank: number } =>
    ECONOMY.sponsorship[rung] as unknown as { maxWtaRank: number }
  it('⭐⭐ moving the W100 ACCEPTANCE CUT does not move either sponsor gate', () => {
    const shippedNational = s.national.maxWtaRank
    const shippedGlobal = s.global.maxWtaRank
    const shippedCut = TIERS.w100.acceptsRank
    // The restored values, stated here so the case fails loudly if a later wave edits them without
    // reading the reasoning on the constants themselves.
    expect(shippedNational, 'national holds the value the coupling dragged it off').toBe(350)
    expect(shippedGlobal, 'and so does global').toBe(87)
    // ...and the two are no longer the same number as the cut, which is the visible half of it.
    expect(shippedNational).not.toBe(TIERS.w100.acceptsRank)

    // #300 is the probe: on the W100 list at 350, off it at 240 – so under the old wiring this rank's
    // answer flipped when P3 moved the ladder. It must not flip now, at ANY cut.
    const probe = pro(300)
    try {
      // P3's own move, the value before it, and two nothing would ever ship.
      for (const cut of [350, 240, 1, 5000]) {
        TIERS.w100.acceptsRank = cut
        expect(s.national.maxWtaRank, `who may ENTER a W100 is not who a distributor writes to (cut ${cut})`).toBe(350)
        expect(s.global.maxWtaRank, `nor who a global brand writes to (cut ${cut})`).toBe(87)
        expect(standingClears(probe, 'national'), `#300 keeps her distributor at every cut (cut ${cut})`).toBe(true)
        expect(rungFor(probe), `and the rung she is offered is unchanged (cut ${cut})`).toBe('national')
      }
    } finally {
      TIERS.w100.acceptsRank = shippedCut
    }
    expect(TIERS.w100.acceptsRank, 'the shipped cut is back – later files read this object').toBe(shippedCut)
  })

  it('⭐⭐ ...and what DOES move them is their own knob, and only that', () => {
    // The mirror, and the reason the case above is not vacuous: the SAME rank, two different sponsor
    // gates, two answers. Nothing here touches the calendar at all.
    const shippedNational = s.national.maxWtaRank
    const shippedGlobal = s.global.maxWtaRank
    const probe = pro(300)
    try {
      sponsorKnob('national').maxWtaRank = 240
      expect(standingClears(probe, 'national'), '#300 is off a top-240 distributor list').toBe(false)
      sponsorKnob('national').maxWtaRank = 350
      expect(standingClears(probe, 'national'), '...and on a top-350 one').toBe(true)
      // The same for global, on the rank its own band is about.
      const inner = pro(70)
      sponsorKnob('global').maxWtaRank = 60
      expect(standingClears(inner, 'global'), '#70 is outside a ten-wide band').toBe(false)
      sponsorKnob('global').maxWtaRank = 87
      expect(standingClears(inner, 'global'), '...and inside a 37-wide one').toBe(true)
    } finally {
      sponsorKnob('national').maxWtaRank = shippedNational
      sponsorKnob('global').maxWtaRank = shippedGlobal
    }
    expect([s.national.maxWtaRank, s.global.maxWtaRank], 'the shipped pair is back').toEqual([350, 87])
  })

  it('⚠ ...and the sponsor chain is still monotone, which is the one property the pair must keep', () => {
    // The rungs are read strongest-first by `rungFor`, so a chain that inverts would make a rung
    // unreachable in silence. national 350 > tour 200 > global 87 > premium 50 > icon 10.
    const chain = [s.national.maxWtaRank, s.tour.maxWtaRank, s.global.maxWtaRank, s.premium.maxWtaRank, s.icon.maxWtaRank]
    expect(chain).toEqual([350, 200, 87, 50, 10])
    for (let i = 1; i < chain.length; i++) {
      expect(chain[i], `rung ${i} is tighter than the one below it`).toBeLessThan(chain[i - 1])
    }
    // ⚠ AND THE JUNIOR PAIR IS UNTOUCHED BY ANY OF THIS. Its derivation reads `TIERS.j300.drawSize`,
    // which is a DRAW SIZE – a structural fact about the event, not a tuning cut somebody retunes –
    // so it is the one coupling here that is not the defect above. Pinned two cases up.
    expect(s.national.maxItfRank).toBe(TIERS.j300.drawSize)
  })

  it('a professional keeps her sponsor - the tables she leaves cannot un-sign her', () => {
    // THE OWNER'S 02.08 RULING («спонсор вполне может жить и дальше»). Two seasons into the tour
    // her junior and domestic points have decayed to nothing - she stopped entering the events that
    // feed them - so under the junior-only gate NOBODY would write to a top-100 professional.
    //
    // ⚠ THE PROBE RANKS MOVED WITH THE TABLE (W2-FIELD2), and the claim did not. Both professional
    // gates are derived from W100's acceptance list - "National signs the girl who would be IN the
    // prestige draw, Global the one still in it on the last day" - and that list stopped being a
    // share of our population and became the real tour's own cut (350, so global is 87). #61 is
    // therefore a GLOBAL-grade professional now rather than a national one: the same sentence
    // against an honest table. What this case is actually about is that a professional standing
    // alone signs her, so the probes are re-pointed at the three rungs rather than re-argued.
    // ⚠ RE-POINTED AGAIN BY W3-ACT2, AND THE CLAIM IS AGAIN UNCHANGED. Three PROFESSIONAL rungs now
    // sit in the same chain (act2-pro-tour.md §7: national 350 > tour 200 > global 87 > premium 50 >
    // icon 10), so the probe ranks resolve one rung higher than they did - which is the ladder
    // getting longer above her rather than the rule moving. What this case is about is that a
    // professional standing ALONE signs her, and every line below still says exactly that.
    expect(rungFor(pro(5))).toBe('icon') // the very top of the world
    expect(rungFor(pro(20))).toBe('premium') // inside the top 50
    // ⚠ RE-POINTED A THIRD TIME BY P3 (16.08, docs/specs/acceptance-cuts-corrected-2026-08.md), AND
    // FOR THE THIRD TIME THE CLAIM IS UNCHANGED. The sourced acceptance chain took
    // `TIERS.w100.acceptsRank` 350 -> 240, and BOTH professional gates were derived from it, so the
    // chain re-resolved to national 240 > tour 200 > global 60 > premium 50 > icon 10. Two probes
    // had to move because the rungs beneath them did: #300 was no longer on the W100 list at all
    // (240), and global's band narrowed from ranks 51-87 to 51-60, so "deep inside" was #55 rather
    // than #60.
    //
    // ⭐⭐ AND THAT RE-POINTING IS RETIRED, BECAUSE THE DERIVATION IT FOLLOWED IS (16.08). The two
    // gates carry their own constants now - see the decoupling pair below - so the chain is back to
    // national 350 > tour 200 > global 87 > premium 50 > icon 10 and stays there whatever the ladder
    // does. #55 is kept as the global probe: it read correctly under both wirings, which is exactly
    // the property this case is about. Every line still says the one thing it has always said - a
    // professional standing ALONE signs her.
    expect(rungFor(pro(55))).toBe('global') // deep inside global's own band (#51-87)
    expect(rungFor(pro(150))).toBe('tour') // a working professional with a ranking that reads
    expect(rungFor(pro(200))).toBe('tour') // the tour rung's own gate, exactly
    expect(rungFor(pro(230))).toBe('national') // on the W100 list, not near the top of it
    // ...and the shop always would: the local rung is "somebody has heard of her".
    expect(rungFor(pro(400))).toBe('local')
    // The guard the junior table keeps, kept here too: an EMPTY professional table is not a world
    // ranking, so a fourteen-year-old tied at the floor is not a top-100 pro.
    expect(rungFor({ nationalRank: 999, itfRank: 999, itfRanked: false, wtaRank: 1, wtaRanked: false })).toBeNull()
  })

  it('the keep-condition asks the same question the gate does, in whichever table she is in', () => {
    // `standingClears` is the single predicate both callers use (world.ts's reviewSponsors and
    // rungFor above), which is what makes "a deal killed by a rule that would have offered it back
    // the same winter" unrepresentable.
    expect(standingClears(pro(61), 'national')).toBe(true)
    expect(standingClears(domestic(1), 'national')).toBe(false) // no international standing at all
    expect(standingClears(domestic(1), 'local')).toBe(true)
    // A professional who has stopped scoring holds no professional standing - a sponsor asks what
    // she is worth now, and the live 52-week window is the honest answer.
    expect(standingClears({ ...pro(61), wtaRanked: false }, 'national')).toBe(false)
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
    expect(rungFor({ nationalRank: 1, itfRank: 13, itfRanked: true, ...unranked.wta })).toBe('national')
  })

  it('⚠ an empty international table is not a world ranking', () => {
    // Competition ranking ties everyone without a counting result at the floor, and a fresh
    // fourteen-year-old can read as a number that looks like a standing. Without the `itfRanked`
    // guard she would be sent a global contract in her first winter.
    expect(rungFor({ nationalRank: 1, itfRank: 1, itfRanked: false, ...unranked.wta })).toBe('local')
    expect(rungFor({ nationalRank: 99, itfRank: 1, itfRanked: false, ...unranked.wta })).toBeNull()
  })

  it('the best rung she clears writes, and only that one', () => {
    // A top-8 girl clears all three gates at once. Three letters in one winter would make the ladder
    // a collection rather than a climb.
    const terms = kitTermsFor({ nationalRank: 1, itfRank: 1, itfRanked: true, ...unranked.wta })!
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
    // world.ts AND every world/*.ts part – `travelCostFor` moved to world/sponsors.ts with the
    // P4 decomposition, and the invariant is "exactly one place", not "one place in one file".
    const src = codeOf(worldSource())
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
    // Two seasons: signed in the window of season 0, covering seasons 1 and 2.
    // ⚠ RE-AIMED (05.08): a term now ends WITH THE SEASON, on week 49 of its last year, rather than
    //   on the calendar year's own last week - the owner's «заканчивать контракты вместе с сезоном
    //   на 49 неделе… чтобы с 50 точно уже было пусто». Two weeks shorter, and they are the two
    //   quiet weeks that carry no tournament; what the change buys is that a running contract can
    //   never shut the window against its own successor. Same two seasons, same rung, same block.
    expect(until).toBe(3 * WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
    expect(until).toBe(contractEndWeek(until))

    const nextReview = LETTER_WEEK + WEEKS_PER_YEAR
    expect(nextReview).toBeLessThan(until)
    const blocked = raiseKitOffers({
      offers: world.offers,
      seed: world.seed,
      week: nextReview,
      standing: worldly(1), // ...she is top 8 in the world now, and it does not matter
    })
    expect(blocked, 'a competing brand wrote while a deal was running').toEqual([])
    expect(world.offers).toHaveLength(1)
  })

  it('⚠ REVERSED (05.08): an unanswered letter no longer blocks – that IS the choice', () => {
    // ⚠ THIS TEST USED TO ASSERT THE OPPOSITE AND IT WAS RIGHT TO, under a schedule where exactly one
    //   letter a year was ever raised: with one arrival week, a second letter could only mean the
    //   parent had accumulated two rungs at once, and "which of my lines are covered" would stop
    //   being a question. The five-week window is built on the other side of that trade - the owner
    //   asked for «есть время на принятие решения и выбор (если он будет конечно)», and a choice
    //   between letters is impossible if the first one turns the second away.
    //
    //   WHAT STOPS IT BECOMING A COLLECTION IS NOW A DIFFERENT AND NARROWER RULE, pinned in the two
    //   tests either side of this one: the season she is about to play may be promised to ONE brand
    //   (`seasonSpokenFor`), signing one letter refuses every other open one in the same breath, and
    //   `offerAnswerError` refuses a second signature even from a stale screen. So she can hold three
    //   letters and can only ever hold one contract.
    const { world } = worldWithLetter('one-letter')
    const [second] = raiseKitOffers({
      offers: world.offers,
      seed: seedTheShopWritesTo('one-letter-roll', world.week + 1, worldly(1)),
      week: world.week + 1,
      standing: worldly(1),
    })
    expect(second?.state).toBe('open')
    expect(world.offers.filter((o) => o.state === 'open')).toHaveLength(2)
    // ...and the moment he answers one of them, the rest are answered too.
    acceptOffer(world, second!.id)
    expect(world.offers.filter((o) => o.state === 'open')).toHaveLength(0)
    expect(world.offers.filter((o) => o.state === 'signed')).toHaveLength(1)
    expect(world.offers.filter((o) => o.state === 'refused')).toHaveLength(1)
  })

  it('...and once its last season is being judged, the ladder is open again', () => {
    // ⚠ RE-AIMED (05.08), and the re-aim is the unlock itself. It used to step to the week AFTER the
    //   term ran out, because under the old schedule a live contract turned every letter away and the
    //   next review was a year further on. That is precisely the rule that produced the owner's
    //   forty-seven-week hole. A contract now stops blocking as soon as the season it still covers is
    //   the one being finished - `seasonSpokenFor` asks about the season AHEAD - so the window that
    //   judges its last year is already open to its successor, two weeks before it formally ends.
    const { world, id } = worldWithLetter('one-brand-after')
    acceptOffer(world, id)
    const until = world.offers[0].untilWeek!
    const nextWindowOpens = LETTER_WEEK + WEEKS_PER_YEAR
    expect(nextWindowOpens).toBeLessThan(until) // ...the old deal is still supplying her
    expect(activeKitDeal(world.offers, nextWindowOpens)).not.toBeNull()
    expect(seasonSpokenFor(world.offers, nextWindowOpens)).toBeNull() // ...but next season is free
    const [again] = raiseKitOffers({
      offers: world.offers,
      seed: seedTheShopWritesTo('one-brand-after-roll', nextWindowOpens, worldly(1)),
      week: nextWindowOpens,
      standing: worldly(1),
    })
    expect(again?.state).toBe('open')
    expect((again!.terms as KitOfferTerms).tier).toBe('global')
    // ...and signing it starts cover the week the old contract stops, never a week before.
    world.week = nextWindowOpens
    acceptOffer(world, again!.id)
    expect(again!.fromWeek).toBe(until + 1)
    expect(activeKitDeal(world.offers, until)!.id).toBe(id)
    expect(activeKitDeal(world.offers, until + 1)!.id).toBe(again!.id)
  })

  it('a refusal does NOT block – saying no is what leaves the ladder open', () => {
    const { world, id } = worldWithLetter('refuse-then')
    declineOffer(world, id)
    const [next] = raiseKitOffers({
      offers: world.offers,
      seed: seedTheShopWritesTo('refuse-then-roll', world.week + 1, worldly(1)),
      week: world.week + 1,
      standing: worldly(1),
    })
    expect(next?.state).toBe('open')
  })
})

// =================================================================================================
// THE FIVE-WEEK WINDOW (05.08, feat/sponsor-window)
// =================================================================================================
//
// The owner's own save is what this block exists for. Decoded, it held a local letter raised at week
// 257 that EXPIRED unsigned at 262 and the next letter at 309 - forty-seven weeks with no deal,
// because letters were raised on ONE week a year and the one he missed was the only one there was.
describe('the sponsor window', () => {
  it('is the off-season plus two, and no brand writes on its last week', () => {
    // Swept over four seasons rather than asserted at one week, because "the window is five weeks"
    // is a property of the year and not of a number.
    const windowWeeks: number[] = []
    const letterWeeks: number[] = []
    for (let w = 0; w < 4 * WEEKS_PER_YEAR; w++) {
      if (isSponsorWindowWeek(w)) windowWeeks.push(w % WEEKS_PER_YEAR)
      if (isSponsorLetterWeek(w)) letterWeeks.push(w % WEEKS_PER_YEAR)
    }
    expect([...new Set(windowWeeks)].sort((a, b) => a - b)).toEqual([47, 48, 49, 50, 51])
    expect([...new Set(letterWeeks)].sort((a, b) => a - b)).toEqual([47, 48, 49, 50])
    expect(windowWeeks).toHaveLength(4 * SPONSOR_WINDOW_WEEKS)
    expect(letterWeeks).toHaveLength(4 * SPONSOR_LETTER_WEEKS)
    // ...and it still contains the whole off-season, which is what the two predicates share.
    for (let w = 0; w < 4 * WEEKS_PER_YEAR; w++) {
      if (isSponsorReviewWeek(w)) expect(isSponsorWindowWeek(w)).toBe(true)
    }
  })

  it('⚠ walks the ladder STRONGEST first, so signing on sight is never a mistake', () => {
    // The order is the safety property (see `windowLadder`). Weakest-first would put the shop's
    // letter in week 47 and the global brand's in week 49, so a parent who signed the first letter
    // he was ever sent would have thrown the better one away unseen - a trap dressed as a gamble.
    expect(windowLadder(worldly(1))).toEqual(['global', 'national', 'local'])
    expect(windowLadder(worldly(20))).toEqual(['national', 'local'])
    // ...and a career that clears ONE rung gets ONE letter. Nothing is manufactured.
    expect(windowLadder(domestic(1))).toEqual(['local'])
    expect(windowLadder(domestic(999))).toEqual([])
    // ...and the list is cut from the TOP, so the biggest names can never be crowded off the
    // calendar by four smaller ones - a top-10 professional does not hear from a shop in her town.
    const top = windowLadder(pro(1))
    expect(top).toHaveLength(SPONSOR_LETTER_WEEKS)
    expect(top[0]).toBe('icon')
    expect(top).not.toContain('local')
  })

  it('raises at most one letter a week, and one per rung across the window', () => {
    // A girl inside the world top 8 clears three rungs, so three letters land on three consecutive
    // weeks and the fourth week has nobody left to write. Rolled with a seed that says yes to each.
    const offers: Offer[] = []
    const seen: string[] = []
    for (let slot = 0; slot < SPONSOR_LETTER_WEEKS; slot++) {
      const week = LETTER_WEEK + slot
      const raised = raiseKitOffers({
        offers,
        seed: seedTheShopWritesTo(`ladder-slot-${slot}`, week, worldly(1)),
        week,
        standing: worldly(1),
      })
      for (const o of raised) seen.push((o.terms as KitOfferTerms).tier)
    }
    expect(seen).toEqual(['global', 'national', 'local'])
    expect(offers).toHaveLength(3)
    // ⚠⚠ RE-AIMED, NOT WEAKENED (28.08, round 28 #17-b, the owner's ruling: «в чем проблема сделать
    //   5? … даже если приглашение придет на 1й или 2й неделе я не вижу проблем сделать слот в 5
    //   недель»). This asserted `o.deadlineWeek === WINDOW_CLOSE_WEEK` for all three - the deadline
    //   was a property of the WINDOW, so three letters landing on three different weeks shared one
    //   expiry and the last was worth less than the first. The claim is now the stronger one: each
    //   letter carries the SAME five weeks, counted from its own arrival, so which week a brand
    //   writes on no longer decides how long the parent has. The old shape is what this exact loop
    //   would have proved, so it is asserted in the negative below rather than merely dropped.
    for (const o of offers) {
      expect(o.deadlineWeek, `a letter dated ${o.week} did not get its own five weeks`).toBe(o.week + 4)
      expect(isOfferLive(o, o.week + 4)).toBe(true)
      expect(isOfferLive(o, o.week + 5)).toBe(false)
    }
    // ⚠ AND THE THREE NO LONGER SHARE AN EXPIRY, which is the whole of what his ruling changed. A
    //   batch deadline creeping back in - by anybody re-deriving it from `sponsorWindowClosesAt` -
    //   collapses this set to one element.
    expect(new Set(offers.map((o) => o.deadlineWeek)).size).toBe(3)
  })

  // ===============================================================================================
  // ⭐ ROUND-17 #27 – ONE LETTER PER RUNG PER WINDOW, EVEN WHEN THE LADDER MOVES UNDER IT
  // ===============================================================================================
  // THE REPORT: two identical Baseline Athletics letters, W48 and W49. REPRODUCED on the owner's own
  // save before this was written - `w359 kit open tour Baseline Athletic` and `w360 kit open tour
  // Baseline Athletic`, identical brand, allowance, covers, travel share and term; then `w361`
  // correctly moved on to national. The ladder had gained a rung at the top between the two weeks.
  //
  // THE CAUSE: a letter's IDENTITY is its slot (`kit-<opened+slot>`) and its CONTENT is its tier
  // (`ladder[slot]`), and `windowLadder` is recomputed from a LIVE standing every week of the window.
  // A rung that starts clearing mid-window shifts every rung below it down one slot, so the same tier
  // lands on a slot whose id has never been seen, rolls a fresh independent draw, and writes again.
  it('⭐ the tour rung that slides down a slot mid-window does not write twice', () => {
    // ⚠ THE STANDINGS ARE THE OWNER'S CASE, MEASURED. `pro(100)` puts `tour` at slot 0 and `pro(60)`
    // slides it to slot 1 by adding `global` above it - which is precisely what his save shows
    // between w359 and w360, and `tour`'s brand is Baseline Athletic.
    const offers: Offer[] = []
    const before = pro(100)
    const after = pro(60)
    expect(windowLadder(before), 'tour leads the ladder in week 47').toEqual(['tour', 'national', 'local'])
    expect(windowLadder(after), 'and a rung appears above it in week 48').toEqual([
      'global',
      'tour',
      'national',
      'local',
    ])

    const first = raiseKitOffers({
      offers,
      seed: seedTheShopWritesTo('sliding-ladder', LETTER_WEEK, before),
      week: LETTER_WEEK,
      standing: before,
    })
    expect(first.map((o) => (o.terms as KitOfferTerms).tier)).toEqual(['tour'])
    const brand = (first[0].terms as KitOfferTerms).brand

    // WEEK 48: slot 0's id is already taken, so it is skipped - and slot 1, which has never been
    // written, now carries `tour`. Its roll is a fresh, independent draw.
    const second = raiseKitOffers({
      offers,
      seed: seedTheShopWritesTo('sliding-ladder', LETTER_WEEK + 1, after),
      week: LETTER_WEEK + 1,
      standing: after,
    })
    // THE CLAIM. Mutation-verified by deleting the `alreadyWritten.has(tier)` guard in
    // `raiseKitOffers`: a second `tour` letter appears from the same brand and this fails.
    expect(second.map((o) => (o.terms as KitOfferTerms).tier), 'the same rung must not write twice').not.toContain('tour')
    expect(second.map((o) => (o.terms as KitOfferTerms).brand), `${brand} wrote twice`).not.toContain(brand)

    // ...and across the whole window no rung and no brand is ever heard from twice.
    const tiers = offers.map((o) => (o.terms as KitOfferTerms).tier)
    expect(new Set(tiers).size, `one letter per rung, got ${tiers.join(', ')}`).toBe(tiers.length)
    const brands = offers.map((o) => (o.terms as KitOfferTerms).brand)
    expect(new Set(brands).size, `one letter per brand, got ${brands.join(', ')}`).toBe(brands.length)
  })

  it('⭐ ...and the whole window is duplicate-free however the standing wanders', () => {
    // The general claim rather than one worked case: walk the window with a standing that climbs on
    // every week, which is the shape that re-maps the slots the hardest.
    const climb = [domestic(1), worldly(20), worldly(1), pro(1)]
    for (let s = 0; s < 12; s++) {
      const offers: Offer[] = []
      for (let slot = 0; slot < SPONSOR_LETTER_WEEKS; slot++) {
        const week = LETTER_WEEK + slot
        const standing = climb[slot]
        raiseKitOffers({
          offers,
          seed: seedTheShopWritesTo(`wander-${s}`, week, standing),
          week,
          standing,
        })
      }
      const tiers = offers.map((o) => (o.terms as KitOfferTerms).tier)
      expect(new Set(tiers).size, `seed ${s}: ${tiers.join(', ')}`).toBe(tiers.length)
    }
  })

  it('⚠ a contract ends WITH the season, on week 49, so week 50 is empty', () => {
    // The owner's own rule: «заканчивать контракты вместе с сезоном на 49 неделе (если они
    // однолетние), т.е. чтобы с 50 точно уже было пусто».
    const { world, id } = worldWithLetter('ends-with-season')
    acceptOffer(world, id)
    const until = world.offers[0].untilWeek!
    expect(until % WEEKS_PER_YEAR).toBe(WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
    expect(until).toBe(contractEndWeek(WEEKS_PER_YEAR))
    expect(activeKitDeal(world.offers, until)).not.toBeNull()
    expect(activeKitDeal(world.offers, until + 1)).toBeNull()
    // ...and the slot being empty is what the NEXT window needs: nothing is spoken for at its open.
    expect(seasonSpokenFor(world.offers, LETTER_WEEK + WEEKS_PER_YEAR)).toBeNull()
  })

  it('⚠ the deals MEET: no week under two contracts, and no week between them', () => {
    // The seam the window created and `fromWeek` closes. She signs next year's letter three weeks
    // before this year's contract stops, so the two would otherwise overlap - and `activeKitDeal`
    // promises there is at most one.
    //
    // ⚠ RE-AIMED (round 28 #17): the second letter comes from a DIFFERENT rung, and it has to. Both
    //   letters used to be `local`, i.e. the shop she was already with writing to her as a stranger
    //   on the window's opening week - the duplicate the owner reported («Baseline athletic 2 раза
    //   письмо о спонсорстве прислали на 48 и 52 неделе одинаковое»), and it is now suppressed. A
    //   career stepping UP a rung is the honest way to have two consecutive terms that meet inside
    //   the window, since the incumbent's own second year is the renewal and the renewal is signed
    //   on the closing week, after the old term has already stopped (see the renewal block: that
    //   fortnight belongs to nobody, deliberately). Nothing about the CLAIM moves - two terms, no
    //   overlapping week and no hole between them.
    const { world, id } = worldWithLetter('seam')
    acceptOffer(world, id)
    const first = world.offers[0]
    const nextOpen = LETTER_WEEK + WEEKS_PER_YEAR
    const stepUp = worldly(20) // ITF top 32: the national rung clears, and it is not her shop
    const [second] = raiseKitOffers({
      offers: world.offers,
      seed: seedTheShopWritesTo('seam-roll', nextOpen, stepUp),
      week: nextOpen,
      standing: stepUp,
    })
    expect((second.terms as KitOfferTerms).tier, 'the fixture must step her up a rung').toBe('national')
    world.week = nextOpen
    acceptOffer(world, second.id)
    expect(second.decidedWeek).toBe(nextOpen)
    expect(second.fromWeek).toBe(first.untilWeek! + 1) // ...it starts the week the old one stops
    // Swept week by week over both terms: exactly one deal in force, every week, with no hole.
    for (let w = first.fromWeek!; w <= second.untilWeek!; w++) {
      const live = world.offers.filter(
        (o) => o.state === 'signed' && w >= (o.fromWeek ?? 0) && w <= (o.untilWeek ?? -1),
      )
      expect(live, `week ${w}`).toHaveLength(1)
    }
  })

  it('a multi-season deal still turns the whole window away, which is what gives it bite', () => {
    const { world, id } = worldWithLetter('multi-block', LETTER_WEEK, worldly(20))
    acceptOffer(world, id) // ...national, two seasons
    const until = world.offers[0].untilWeek!
    // The window a whole season later: the deal still covers the season ahead, so nobody writes -
    // on ANY of the four letter weeks, and however well she has done in the meantime.
    for (let slot = 0; slot < SPONSOR_LETTER_WEEKS; slot++) {
      const week = LETTER_WEEK + WEEKS_PER_YEAR + slot
      expect(seasonSpokenFor(world.offers, week)?.id, `week ${week}`).toBe(id)
      expect(
        raiseKitOffers({
          offers: world.offers,
          seed: seedTheShopWritesTo(`multi-block-${slot}`, week, worldly(1)),
          week,
          standing: worldly(1),
        }),
        `a competing brand wrote at week ${week}`,
      ).toEqual([])
    }
    expect(world.offers).toHaveLength(1)
    // ...and the winter AFTER that, when its last season is the one being judged, it stops blocking.
    expect(seasonSpokenFor(world.offers, LETTER_WEEK + 2 * WEEKS_PER_YEAR)).toBeNull()
    expect(LETTER_WEEK + 2 * WEEKS_PER_YEAR).toBeLessThan(until)
  })

  it("⚠ THE OWNER'S OWN HOLE: a letter missed in the window costs a season, not forty-seven weeks", () => {
    // His save, as a fixture. A local letter arrived, he did not answer it, and the next one did not
    // come for forty-seven weeks because the schedule had exactly one arrival week a year. Under the
    // window the same miss costs him the season the letter was FOR - which is the real price of
    // letting a decision lapse - and the next window is a year away rather than a year and a season.
    const world = createWorld(seedTheShopWritesTo('owners-hole'), DEFAULT_PROFILE)
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 3 * WEEKS_PER_YEAR; i++) tickWeek(world, rng)
    const kit = world.offers.filter((o) => o.kind === 'kit' && o.state !== 'info')
    expect(kit.length).toBeGreaterThan(0)
    // Every letter she was ever sent arrived inside a window, and none of them expired into a
    // season she was playing - which is the half of the fault that made his lapse invisible.
    for (const o of kit) {
      expect(isSponsorLetterWeek(o.week), `letter at ${o.week}`).toBe(true)
      expect(isSponsorWindowWeek(o.deadlineWeek)).toBe(true)
      expect(o.deadlineWeek % WEEKS_PER_YEAR).toBe(WEEKS_PER_YEAR - 1)
    }
    // ...and the gap between one window's letters and the next is one season, by construction.
    const windows = [...new Set(kit.map((o) => Math.floor(o.week / WEEKS_PER_YEAR)))].sort()
    for (let i = 1; i < windows.length; i++) expect(windows[i] - windows[i - 1]).toBe(1)
  })

  it('never lets two contracts be signed for the same season, even from a stale screen', () => {
    // The window deliberately leaves several letters open at once; this is the rule that keeps the
    // game's oldest invariant - at most one deal - from being broken by the feature that makes
    // signing a choice.
    const { world, id } = worldWithLetter('stale-screen')
    const [second] = raiseKitOffers({
      offers: world.offers,
      seed: seedTheShopWritesTo('stale-screen-roll', world.week + 1, worldly(1)),
      week: world.week + 1,
      standing: worldly(1),
    })
    acceptOffer(world, id)
    // The second letter was refused in the same breath, so a screen still showing it is stale...
    expect(second.state).toBe('refused')
    // ...and forcing it through the engine's own gate is refused with a reason, not honoured.
    second.state = 'open' // a corrupted save / a hand-edited screen, in one line
    expect(() => acceptOffer(world, second.id)).toThrow()
    expect(world.offers.filter((o) => o.state === 'signed')).toHaveLength(1)
  })
})

// =================================================================================================
// ARRIVING LATE (06.08, fix/sponsor-catchup)
// =================================================================================================
//
// The owner merged the window wave, loaded his own career and got NO SPONSOR LETTER AT ALL - which is
// the exact outcome the wave existed to prevent. His save sits at week 412: season week 48, one week
// past the window's opening week. Two faults fell out of it and they are different.
//
//   1. THE OPENING WEEK DID WORK NO OTHER WEEK COULD DO. The outgoing deal's verdict, its
//      `eventsPlayed`, the ending of a failed deal and the brand's goodbye were all gated on week 47,
//      so a career that never had a week 47 never had its season judged. The shipped spec called that
//      a known consequence for a migrated save; he hit it on the first career he loaded, and it is
//      not only a migration problem - any career inside the window when the app updates has it.
//   2. THE RUNG WAS INDEXED BY THE CALENDAR. Loaded at 411 he was written to by `national`; loaded at
//      412, the SAME standing one week later, by `local`. The better brand was never offered and he
//      was never told it existed - the precise trap `windowLadder`'s strongest-first order exists to
//      close, since «signing on sight is never a mistake» only holds if the strongest rung she clears
//      is the one that writes first FROM WHEREVER SHE IS.
//
// Everything below is one property in several voices: nothing about her winter may depend on which
// week of it the code met her.
describe('the window can be entered late', () => {
  /** The window of season 1 – the second one a career ever sees, which is where these fixtures put
   *  her so that there is an OUTGOING deal to be judged. */
  const LATE_OPEN = LETTER_WEEK + WEEKS_PER_YEAR // 99
  const LATE_CLOSE = WINDOW_CLOSE_WEEK + WEEKS_PER_YEAR // 103

  /** A career standing in a window with a one-season deal finishing under it, and a standing deep
   *  enough to clear three rungs. Built once per test and CLONED per arm, so every arm is the same
   *  career picked up at a different week – which is the whole point.
   *
   *  The seed is searched rather than asserted: the dice are real (`shopWritesAt`), and a fixture
   *  that needed a particular career to be written to by all its rungs has to find one rather than
   *  pretend the roll always says yes.
   *
   *  ⚠ RE-AIMED (round 28 #17): `rungsWanted` is TWO where it used to be three, and the missing one
   *  is the defect this round removed rather than a rung that stopped writing. Her ladder is still
   *  global -> national -> local, and the outgoing contract below is still a NATIONAL one - so
   *  `national` is now the incumbent's own rung and does not also write to her as a stranger on the
   *  window's slot. It writes once, on the closing week, as the renewal (`kit-renew-kit-47/national`
   *  is still asserted below, in the same place it always was). Everything this block CLAIMS is
   *  untouched: the claims are about the ladder being the same from every entry week, and two rungs
   *  plus a renewal exercise a multi-letter queue exactly as three did. */
  function careerInTheWindow(stem: string, rungsWanted = 2): WorldState {
    for (let attempt = 0; attempt < 60; attempt++) {
      const world = createWorld(`${stem}-${attempt}`, DEFAULT_PROFILE)
      // #1 at home and #1 in the world juniors, so her ladder is global -> national -> local.
      world.results.push({ playerId: KID_ID, week: 60, points: 100_000, tier: 'national' })
      world.results.push({ playerId: KID_ID, week: 60, points: 100_000, tier: 'j300' })
      // ...and she played her season, so the outgoing deal's obligation is comfortably met.
      for (let i = 0; i < 12; i++) {
        world.results.push({ playerId: KID_ID, week: 60 + i, points: 10, tier: 'j60' })
      }
      // ⚠ AND TWO OF THEM ARE IN WEEKS 47-48 OF THE SEASON BEFORE, which is what makes the rolling
      //   year the verdict is judged on actually ROLL. `eventsPlayedInSeason` reads a 52-week window
      //   ending at the review week, so these two fall out of it the moment the review week moves -
      //   they are the difference between a verdict taken on the window's opening week and the same
      //   verdict taken on its last. Without them the count is accidentally the same either way and
      //   "the count does not drift with the entry week" is untested rather than true.
      world.results.push({ playerId: KID_ID, week: LETTER_WEEK, points: 10, tier: 'j60' })
      world.results.push({ playerId: KID_ID, week: LETTER_WEEK + 1, points: 10, tier: 'j60' })
      world.week = LATE_OPEN
      recomputeKidRank(world)
      world.offers.push({
        id: 'kit-47',
        kind: 'kit',
        week: LETTER_WEEK,
        deadlineWeek: WINDOW_CLOSE_WEEK,
        terms: kitTermsFor(worldly(1), 'national')!,
        state: 'signed',
        decidedWeek: LETTER_WEEK,
        fromWeek: LETTER_WEEK,
        untilWeek: contractEndWeek(LATE_OPEN),
        coveredCents: 40_000,
      })
      const probe = JSON.parse(JSON.stringify(world)) as WorldState
      if (winterFrom(probe, LATE_OPEN).filter(rungLetter).length === rungsWanted) {
        return world
      }
    }
    throw new Error(`no career near "${stem}" was written to by ${rungsWanted} rungs in 60 tries`)
  }

  /** Load the career at `entryWeek` and play the rest of the winter: what does the post look like?
   *  Returns `<id>/<rung>` per kit letter that was not already on file, in the order they were
   *  raised – the letters, the rungs and the order, which is the whole claim. */
  function winterFrom(world: WorldState, entryWeek: number): string[] {
    const before = new Set(world.offers.map((o) => o.id))
    for (let week = entryWeek; week <= LATE_CLOSE + 1; week++) {
      world.week = week
      reviewSponsors(world)
    }
    return world.offers
      .filter((o) => o.kind === 'kit' && !before.has(o.id))
      .map((o) => `${o.id}/${(o.terms as KitOfferTerms).tier}`)
  }

  const clone = (world: WorldState): WorldState => JSON.parse(JSON.stringify(world)) as WorldState

  /** IS THIS A RUNG'S LETTER? – as opposed to the two letters the review writes that are not a rung's
   *  turn: the brand's goodbye (`kit-end-*`) and, since 10.08, the incumbent's renewal
   *  (`kit-renew-*`).
   *
   *  ⚠ ADDED WITH THE RENEWAL, AND IT WIDENS AN EXISTING FILTER RATHER THAN CHANGING WHAT ANYTHING
   *  ASSERTS. Every claim in this block is about THE LADDER - which rungs wrote, in which order, and
   *  whether a late entry cost her one - and `raiseKitRenewal` is neither a rung nor a roll (it takes
   *  no dice at all). Counting it would have silently redefined "she was written to by three rungs"
   *  in the fixture search below, which is exactly what it did before this predicate existed: the
   *  search started accepting careers where two rungs wrote and the renewal made up the third. */
  const rungLetter = (letter: string): boolean =>
    !letter.startsWith('kit-end') && !letter.startsWith('kit-renew')

  it('⚠ THE PROPERTY: weeks 46-51 all end the winter with the SAME letters, rungs and order', () => {
    // The one the whole fix is for. Every arm is the same career - same seed, same standing, same
    // inbox - loaded at a different week, and every arm must finish the winter holding the same post.
    // Before the fix, arm 47 got three letters and arm 48 got one, from a WORSE rung.
    const base = careerInTheWindow('late-entry')
    const winters = new Map<number, string[]>()
    for (let entry = LATE_OPEN - 1; entry <= LATE_CLOSE; entry++) {
      winters.set(entry, winterFrom(clone(base), entry))
    }
    const opening = winters.get(LATE_OPEN)!
    // The strongest rung she clears writes FIRST, which is what makes signing on sight safe.
    //
    // ⚠ RE-AIMED (round 28 #17), AND THE MISSING LINE IS THE DEFECT RATHER THAN A LOST LETTER. This
    //   used to read `kit-99/global`, `kit-100/national`, `kit-101/local` - and `kit-100/national`
    //   was the bug the owner reported: her outgoing contract is a NATIONAL one, so that letter was
    //   the brand she is already wearing writing to her as a stranger, four weeks before the same
    //   brand's renewal. «Baseline athletic 2 раза письмо о спонсорстве прислали на 48 и 52 неделе
    //   одинаковое.» The slot ids are deliberately UNCHANGED either side of the hole - `local` is
    //   still `kit-101` and not `kit-100` - because a rung's id is its place in the queue and its
    //   dice are keyed on it; a suppression that shifted the queue would silently re-roll every rung
    //   below it.
    expect(opening.filter(rungLetter)).toEqual([
      'kit-99/global',
      'kit-101/local',
    ])
    // ⚠ ...AND THE FAMILIAR BRAND WRITES LAST, WHICH IS THE 10.08 PLACEMENT AS A PROPERTY RATHER THAN
    //   AS A COMMENT. `seasonSpokenFor` turns every other rung away the moment a letter is signed, so
    //   a renewal offered on the window's OPENING week would let the shop she is already with crowd
    //   out the global brand that writes on week 99 - the exact inversion `windowLadder` exists to
    //   prevent. Asserted as "it is the last letter of the winter", because that is the whole of what
    //   makes it safe, and the loop below then holds it true from EVERY entry week.
    expect(opening[opening.length - 1]).toBe('kit-renew-kit-47/national')
    for (const [entry, winter] of winters) {
      expect(winter, `a career loaded at week ${entry % WEEKS_PER_YEAR} got a different winter`).toEqual(opening)
    }
  })

  it('...including the CLOSING week, which is the last moment a career can still be caught', () => {
    // A career whose first week inside the window is its LAST week would otherwise have the whole
    // winter's post cancelled by `isSponsorLetterWeek` - a rule written to guarantee every letter two
    // weeks of thinking time, turning into a rule that guarantees a year of silence. It gets the week
    // it has, which is the whole of what was left to give it, and every letter is live on it.
    const base = careerInTheWindow('late-close')
    const arm = clone(base)
    const winter = winterFrom(arm, LATE_CLOSE)
    expect(winter).toEqual(winterFrom(clone(base), LATE_OPEN))
    const post = arm.offers.filter((o) => o.kind === 'kit' && o.state === 'open')
    // ⚠ THE RUNG COUNT AND THE RENEWAL ARE COUNTED SEPARATELY (10.08). The incumbent's renewal always
    //   lands on the window's closing week - that IS its placement, see `raiseKitRenewal` - so a
    //   career caught on the very last week is handed its whole winter AND the offer of another year,
    //   and the loop below then holds every one of them to the same two facts: dated the week it
    //   landed, and still answerable on it. Split in two rather than asserted as one total, so the
    //   claim about the LADDER stays exactly the claim it was.
    //
    // ⚠ RE-AIMED 3 -> 2 (round 28 #17), for the reason written out on the fixture and on the ladder
    //   assertion above: the third rung was `national`, which is the outgoing contract's OWN rung,
    //   and that letter was the duplicate the owner reported. The property under test here is
    //   untouched - a career caught on the closing week still receives a QUEUE of letters in one
    //   post, every one of them live on the week it arrives.
    expect(post.filter((o) => !o.id.startsWith('kit-renew'))).toHaveLength(2)
    expect(post).toHaveLength(3)
    for (const o of post) {
      expect(o.week, 'a caught-up letter is dated the week it landed').toBe(LATE_CLOSE)
      expect(isOfferLive(o, LATE_CLOSE), 'a letter he can never answer is worse than none').toBe(true)
    }
  })

  it('⚠ THE VERDICT IS ONCE A SEASON, NOT ONCE ON WEEK 47 – and it is taken exactly once', () => {
    // Fault 1. Every arm judges the same deal, on the same count, and posts exactly ONE goodbye -
    // `eventsPlayed` is read at the window's OPENING week whichever week the verdict is taken on, so
    // the rolling year it is judged against cannot drift with the entry week, and
    // `raiseKitEndLetter` returns the notice already in the inbox rather than posting a second copy.
    const base = careerInTheWindow('late-verdict')
    const verdicts = new Map<number, string>()
    for (let entry = LATE_OPEN - 1; entry <= LATE_CLOSE; entry++) {
      const arm = clone(base)
      winterFrom(arm, entry)
      const goodbyes = arm.offers.filter((o) => o.id === 'kit-end-kit-47')
      expect(goodbyes, `week ${entry}: the brand said goodbye ${goodbyes.length} times`).toHaveLength(1)
      const deal = arm.offers.find((o) => o.id === 'kit-47')!
      const paper = goodbyes[0].terms as KitOfferTerms
      verdicts.set(entry, `${paper.endedEventsPlayed}/${deal.untilWeek}/${paper.ended}`)
    }
    expect(new Set(verdicts.values()).size, `the verdict differed by entry week: ${[...verdicts]}`).toBe(1)
    expect([...verdicts.values()][0]).toBe(`16/${contractEndWeek(LATE_OPEN)}/term`)

    // ⚠ AND THE COUNT ON THE CONTRACT IS THE OPENING WEEK'S OR NOTHING, which is the one thing about
    //   the verdict that is deliberately NOT the same from every entry week. `world.results` is
    //   pruned on a rolling 52 weeks relative to `world.week`, so a count read on a later week is a
    //   LOWER BOUND (see `eventsPlayedInSeason`) - and a lower bound written over a true number would
    //   make the record worse the longer the window ran. The brand's goodbye still carries the number
    //   its own verdict used, which is what the assertion above reads and what the feed row prints.
    const fromOpen = clone(base)
    winterFrom(fromOpen, LATE_OPEN)
    expect(fromOpen.offers.find((o) => o.id === 'kit-47')!.eventsPlayed).toBe(16)
    const fromLate = clone(base)
    winterFrom(fromLate, LATE_OPEN + 2)
    expect(fromLate.offers.find((o) => o.id === 'kit-47')!.eventsPlayed).toBeUndefined()
  })

  it('...and it never judges a deal signed INSIDE the window, which has not run a season yet', () => {
    // The trap the verdict's own subject had to be re-aimed around. Once the verdict runs on every
    // week of the window, "the deal in force today" stops meaning "the deal that covered the season
    // now finishing" - by week 49 it is the letter he signed on week 47. Judged on a season it did
    // not cover, a brand-new two-season contract would fail its obligation and be ended before it
    // began. `dealUnderReview` is anchored on the window's opening week, so it cannot see it.
    const world = careerInTheWindow('late-signed-inside')
    world.week = LATE_OPEN
    reviewSponsors(world)
    const fresh = world.offers.find((o) => o.state === 'open' && (o.terms as KitOfferTerms).tier === 'global')!
    acceptOffer(world, fresh.id)
    const untilAtSignature = fresh.untilWeek
    for (let week = LATE_OPEN + 1; week <= LATE_CLOSE; week++) {
      world.week = week
      reviewSponsors(world)
    }
    expect(fresh.untilWeek, 'the new deal was ended before it started').toBe(untilAtSignature)
    expect(fresh.eventsPlayed, 'the new deal was judged on a season it did not cover').toBeUndefined()
    expect(world.offers.filter((o) => o.id === `kit-end-${fresh.id}`)).toHaveLength(0)
  })

  it('a rung is never denied its ROLL by the calendar – only ever by its own dice', () => {
    // The zero-valued number: whichever week the career arrives on, every rung on her ladder gets
    // exactly one roll, and it is the SAME roll (`shopWritesAt` is keyed on the rung's place in the
    // queue, not on the day the letter lands). So the post can only ever differ from the full ladder
    // because a shop said no - never because a week went by without her.
    //
    // Rolled over twenty careers rather than one, because "no rung is skipped" is a property of the
    // schedule and a single seed cannot show it.
    let denied = 0
    let armsChecked = 0
    for (let n = 0; n < 20; n++) {
      // ⚠ 3 -> 2 (round 28 #17): her ladder is unchanged, but the rung her outgoing contract came
      //   from now writes once, as the renewal, instead of twice. See `careerInTheWindow`.
      const base = careerInTheWindow(`no-rung-denied-${n}`, 2)
      const fromOpen = winterFrom(clone(base), LATE_OPEN).filter(rungLetter)
      for (let entry = LATE_OPEN + 1; entry <= LATE_CLOSE; entry++) {
        armsChecked++
        if (winterFrom(clone(base), entry).filter(rungLetter).length < fromOpen.length) {
          denied++
        }
      }
    }
    expect(armsChecked).toBe(20 * 4)
    expect(denied, 'a rung lost its turn because the career arrived late').toBe(0)
  })

  it('⚠ THE ONE ASYMMETRY: the STANDING half of the verdict is the opening week\'s or nobody\'s', () => {
    // The events half of the verdict is anchored on the window's opening week and can therefore be
    // re-read on any week of the window. The STANDING half cannot: her domestic points are a rolling
    // 52-week best-6, so the previous year's weeks 47-48 age out DURING the window and her rank
    // slides for a reason that has nothing to do with the season being judged. The reading is gone
    // by week 48 and `pruneResults` has taken the evidence, so the rule is "the opening week's
    // reading or none at all".
    //
    // MEASURED (`npm run bench:sponsor`, eager, 144 careers): judging it on every week of the window
    // cost coverage 62.2% -> 61.8% and sponsor value $10,178 -> $9,832 on careers that were never
    // late, purely from deals ended by a fortnight of decay. Declining to judge is the safe
    // direction – a deal is kept, never killed – and it is confined to a career that met the window
    // late, i.e. one the app updated under.
    const build = (): WorldState => {
      const world = careerInTheWindow('standing-half')
      // ...and now she has slid out of the band the national deal keeps. The domestic and junior
      // ranks are written directly rather than reverse-engineered out of the ledger, because
      // competition ranking ties EVERYBODY at the floor of an empty table - strip her results and
      // she reads as #1 of nobody, which is the trap `itfRanked` exists for and the opposite of
      // what this fixture needs. These are the two cached numbers `sponsorStandingOf` reads.
      world.results = world.results.filter((r) => r.tier !== 'national' && r.tier !== 'j300')
      recomputeKidRank(world)
      world.kidRankDomestic = 999 // out of the top 30 at home...
      world.kidRank = 999 // ...and with no junior standing that `standingClears` would hand it back on
      return world
    }
    const atOpen = build()
    const terms = atOpen.offers.find((o) => o.id === 'kit-47')!.terms as KitOfferTerms
    expect(terms.keepDomesticRank, 'the fixture must be a rung that keeps a domestic condition').toBeGreaterThan(0)
    winterFrom(atOpen, LATE_OPEN)
    const endedAtOpen = atOpen.offers.find((o) => o.id === 'kit-end-kit-47')!
    expect((endedAtOpen.terms as KitOfferTerms).ended, 'judged at the open, she is out of the band').toBe('standing')

    // ...and the career that only met the window on its second week keeps the deal, because the
    // reading that would have ended it belongs to a week it was never present for.
    const late = build()
    winterFrom(late, LATE_OPEN + 1)
    const endedLate = late.offers.find((o) => o.id === 'kit-end-kit-47')!
    expect((endedLate.terms as KitOfferTerms).ended, 'a late arrival was failed on a reading it never had').toBe('term')
  })

  it('...and the EVENTS half the same way, because a later week can only see a lower bound', () => {
    // The half that cost real money before it was found. `eventsPlayedInSeason` anchors its 52-week
    // window on the window's opening week, but `world.results` is ITSELF pruned on a rolling 52 weeks
    // relative to `world.week` – so the ledger under the anchored window loses its own oldest weeks
    // as the window runs, and the count comes back SHORT by up to two competitive weeks.
    //
    // Measured in the bench, not deduced: a `tour` deal on `bench-working-2` counted 14 events
    // against a minimum of 14 on the window's opening week and 13 the next, was ended for not playing
    // enough, and the career lost four seasons of retainer and bonus ($49,252 -> $21,960).
    const build = (): WorldState => {
      const world = careerInTheWindow('events-half')
      // She barely played: two entries against an obligation of many. Her RANKS are left where they
      // were, so the standing half of the verdict cannot be what ends the deal.
      world.results = world.results.filter((r) => r.tier === 'national' || r.tier === 'j300')
      return world
    }
    const atOpen = build()
    const min = (atOpen.offers.find((o) => o.id === 'kit-47')!.terms as KitOfferTerms).minEventsPerSeason
    expect(min, 'the fixture must be short of the obligation').toBeGreaterThan(2)
    winterFrom(atOpen, LATE_OPEN)
    expect((atOpen.offers.find((o) => o.id === 'kit-end-kit-47')!.terms as KitOfferTerms).ended).toBe('events')

    const late = build()
    winterFrom(late, LATE_OPEN + 1)
    expect(
      (late.offers.find((o) => o.id === 'kit-end-kit-47')!.terms as KitOfferTerms).ended,
      'a late arrival was failed on a count it could no longer see in full',
    ).toBe('term')
  })

  it('⚠ AND PAST THE WINDOW SHE GETS NOTHING, WHICH IS THE DICE AND NOT THE SCHEDULE', () => {
    // The one arm that is NOT equal to the others, stated rather than hidden. A career that is past
    // the window's close never entered it, and there is no honest way to tell "she was not here" from
    // "the shops said no" without persisting a mark - so a catch-up on the far side would re-roll the
    // dice for every career the brands genuinely passed on, which is exactly the manufacturing
    // `windowLadder` promises not to do («nothing is manufactured»).
    //
    // It costs nothing, because it cannot happen to a career that is being PLAYED: the tick advances
    // one week at a time (`world.week += 1` is the only writer), so weeks 47-51 cannot be jumped. It
    // is reachable only by loading a save written before the window existed - and that code's own
    // review week, `isSponsorReviewWeek`, is INSIDE this window, so such a save has already had its
    // winter transacted by whichever code was running. See docs/specs/sponsor-window-2026-08.md §4.
    const base = careerInTheWindow('past-the-window')
    expect(winterFrom(clone(base), LATE_CLOSE + 1)).toEqual([])
    // ...and the old schedule's one review week is inside the new window, which is why it is safe.
    for (let w = 0; w < 4 * WEEKS_PER_YEAR; w++) {
      if (isSponsorReviewWeek(w)) expect(isSponsorWindowWeek(w)).toBe(true)
    }
  })
})

// =================================================================================================
// ⚠ THE RENEWAL (10.08) - the brand she has been with asks for another year, and it asks LAST
// =================================================================================================
//
// The owner's own shape: renewal is A LETTER, not an automatic re-signing; new letters still arrive;
// the five-week window stays. The whole design argument is on `raiseKitRenewal`; what this block
// holds is the part a reader would otherwise have to take on trust - WHERE in the window it lands,
// and why that placement is not a scheduling preference.
//
// THE TRAP IT IS WRITTEN AROUND, in one sentence: `seasonSpokenFor` turns every other rung away the
// moment a letter is SIGNED, so a renewal offered early would let the shop in her home town crowd out
// a global brand that would have written two weeks later - the exact inversion `windowLadder` exists
// to prevent, and worse than the weakest-first ordering that argument was written against, because
// the incumbent is the letter a parent is likeliest to sign on sight.
describe('⚠ THE RENEWAL – the familiar brand writes last, and only last', () => {
  const LATE_OPEN = LETTER_WEEK + WEEKS_PER_YEAR // 99
  const LATE_CLOSE = WINDOW_CLOSE_WEEK + WEEKS_PER_YEAR // 103

  /** A career standing in a window with a one-season LOCAL deal finishing under it.
   *
   *  `ranked` decides whether any rung ALSO writes this winter (she needs an international standing
   *  for that); `events` is how much of her end of the bargain she kept - the rows are pushed with
   *  zero points on purpose, so the obligation and the ranking are two dials and not one. */
  function careerWithExpiringDeal(
    seed: string,
    opts: { ranked?: boolean; events?: number } = {},
  ): WorldState {
    const { ranked = false, events = 20 } = opts
    const world = createWorld(seed, DEFAULT_PROFILE)
    if (ranked) {
      world.results.push({ playerId: KID_ID, week: 60, points: 100_000, tier: 'national' })
      world.results.push({ playerId: KID_ID, week: 60, points: 100_000, tier: 'j300' })
    }
    for (let i = 0; i < events; i++) {
      world.results.push({ playerId: KID_ID, week: 60 + i, points: 0, tier: 'j60' })
    }
    world.week = LATE_OPEN
    recomputeKidRank(world)
    world.offers.push({
      id: 'kit-47',
      kind: 'kit',
      week: LETTER_WEEK,
      deadlineWeek: WINDOW_CLOSE_WEEK,
      terms: kitTermsFor(domestic(1), 'local')!,
      state: 'signed',
      decidedWeek: LETTER_WEEK,
      fromWeek: LETTER_WEEK,
      untilWeek: contractEndWeek(LATE_OPEN),
      coveredCents: 30_000,
    })
    return world
  }

  function playWinter(world: WorldState, from = LATE_OPEN, to = LATE_CLOSE): void {
    for (let week = from; week <= to; week++) {
      world.week = week
      reviewSponsors(world)
    }
  }

  const renewalIn = (world: WorldState): Offer | undefined =>
    world.offers.find((o) => o.id.startsWith('kit-renew'))

  it('⚠ arrives on the window\'s LAST week and on no earlier one', () => {
    // The placement IS the feature. Asserted as a sweep of the window rather than at one week,
    // because "it writes last" is a property of the winter and not of a number.
    const world = careerWithExpiringDeal('renew-when')
    for (let week = LATE_OPEN; week < LATE_CLOSE; week++) {
      world.week = week
      reviewSponsors(world)
      expect(
        renewalIn(world),
        `the incumbent wrote on week ${week % WEEKS_PER_YEAR}, before every rung had had its turn`,
      ).toBeUndefined()
    }
    world.week = LATE_CLOSE
    reviewSponsors(world)
    const renewal = renewalIn(world)
    expect(renewal, 'the brand she held up her end for never wrote at all').toBeDefined()
    expect(renewal!.week).toBe(LATE_CLOSE)
    expect(renewal!.state).toBe('open')
    // ...and the week it lands on is still not a RUNG's turn: `SPONSOR_LETTER_WEEKS` is untouched,
    // so no fifth rung was given a slot to make room for it.
    expect(isSponsorLetterWeek(LATE_CLOSE)).toBe(false)
  })

  it('⚠ ...and refuses to write on any other week even when a caller asks it to directly', () => {
    // BELT AND BRACES, and the reason the placement is not merely a property of `reviewSponsors`'s
    // early return. The test above cannot tell the two gates apart - it goes through the review, so
    // the call site alone would satisfy it - and the placement is far too load-bearing to rest on one
    // `return`. A second caller (a test, a bench, a future dev tool) must not be able to post the
    // incumbent's letter on the window's opening week and hand the shop in her home town a veto over
    // every rung above it. Same discipline `reviewSponsors` keeps about April.
    const world = careerWithExpiringDeal('renew-direct')
    const ended = world.offers.find((o) => o.id === 'kit-47')!
    for (let week = LATE_OPEN; week < LATE_CLOSE; week++) {
      expect(
        raiseKitRenewal(world.offers, week, ended),
        `it wrote on week ${week % WEEKS_PER_YEAR} when asked directly`,
      ).toBeNull()
    }
    expect(raiseKitRenewal(world.offers, LATE_CLOSE, ended)).not.toBeNull()
  })

  it('is the same paper, marked as a renewal, and refusable like any other letter', () => {
    const world = careerWithExpiringDeal('renew-terms')
    playWinter(world)
    const renewal = renewalIn(world)!
    const old = world.offers.find((o) => o.id === 'kit-47')!.terms as KitOfferTerms
    const terms = renewal.terms as KitOfferTerms
    // ⚠ THE SAME TERMS, NOT RE-DERIVED. A renewal is the brand extending what it already gave her;
    // re-reading `kitTermsFor` would silently re-price the relationship against today's standing.
    expect(terms.renewal).toBe(true)
    expect({ ...terms, renewal: undefined }).toEqual({ ...old, renewal: undefined })
    expect(isOfferLive(renewal, LATE_CLOSE)).toBe(true)
    declineOffer(world, renewal.id)
    expect(renewal.state, 'a renewal he cannot say no to is a re-signing').toBe('refused')
  })

  it('⚠ HIS CASE: the renewal-only ladder carries FIVE weeks, not the one it used to', () => {
    // ⚠⚠ RE-AIMED, NOT WEAKENED (28.08, round 28 #17-b). This was «expires with the window, so
    //   waiting past it is still a decision», and it pinned `deadlineWeek === LATE_CLOSE` - which on
    //   the closing week is TODAY. That is not a decision, it is a notification, and it is exactly
    //   what the owner reported once round 28 #17 removed the duplicate that had been hiding it: the
    //   commonest career in the game is the local shop renewing every winter, and its whole winter's
    //   post was one letter he had to answer the day it arrived.
    //
    //   His ruling: «в чем проблема сделать 5? у нас конечная неделя сезона 49 по сути, дальше окно
    //   в новый сезон, даже если приглашение придет на 1й или 2й неделе я не вижу проблем сделать
    //   слот в 5 недель». The SECOND half of the old claim - that waiting past the deadline is still
    //   a real loss - is untouched and asserted below; only the deadline moved.
    const world = careerWithExpiringDeal('renew-expire')
    playWinter(world)
    const renewal = renewalIn(world)!
    // Five weeks, counted inclusively from arrival, as a LITERAL rather than as a constant - the
    // trap this very file taught us in round 28 #2: every assertion written in terms of the constant
    // stayed green while the ruled number was wrong.
    expect(renewal.week).toBe(LATE_CLOSE)
    expect(renewal.deadlineWeek).toBe(LATE_CLOSE + 4)
    expect(renewal.deadlineWeek - renewal.week + 1, 'the paper says five, so five it must be').toBe(5)
    for (let n = 0; n < 5; n++) expect(isOfferLive(renewal, LATE_CLOSE + n)).toBe(true)
    // ...and it is STILL a deadline. An offer left past it is gone, which is «the window is the
    // feature, not a courtesy» and the half of this test that did not change.
    expect(isOfferLive(renewal, LATE_CLOSE + 5)).toBe(false)
    expireOffers(world.offers, LATE_CLOSE + 4)
    expect(renewal.state, 'it lapsed on the last week he was promised').toBe('open')
    expireOffers(world.offers, LATE_CLOSE + 5)
    expect(renewal.state).toBe('expired')
  })

  it('⚠ ...and those five weeks run INTO the new season, which is what he traded for them', () => {
    // The property `docs/specs/sponsor-window-2026-08.md` §3.1 bought and he has given up, pinned so
    // that nobody re-derives the old rule from a document that still argues for it. A renewal raised
    // on the window's closing week - season offset 51 - is answerable on offsets 0, 1, 2 and 3 of
    // the season she is now playing. He was shown that objection in those words and overruled it.
    const world = careerWithExpiringDeal('renew-into-season')
    playWinter(world)
    const renewal = renewalIn(world)!
    expect(renewal.week % WEEKS_PER_YEAR, 'the fixture must raise it on the closing week').toBe(WEEKS_PER_YEAR - 1)
    expect(renewal.deadlineWeek % WEEKS_PER_YEAR, 'it should now die in week 4 of the new season').toBe(3)
    expect(isSponsorWindowWeek(renewal.deadlineWeek), 'the deadline is outside the window now').toBe(false)
    // ⚠⚠ AND IT CANNOT REACH THE NEXT WINDOW – the property that keeps `seasonSpokenFor` honest and
    //   stops a letter outliving the deal it was competing for. Forty-four weeks of daylight, and it
    //   is arithmetic rather than luck: the latest arrival is offset 51 and the shelf life is five,
    //   so the latest death is offset 3, and the next window does not open until offset 47.
    expect(renewal.deadlineWeek).toBeLessThan(sponsorWindowOpensAt(renewal.deadlineWeek + WEEKS_PER_YEAR))
    const nextOpen = sponsorWindowOpensAt(LATE_CLOSE) + WEEKS_PER_YEAR
    expect(nextOpen - renewal.deadlineWeek, 'two windows must never be able to overlap').toBe(44)
    expect(isOfferLive(renewal, nextOpen), 'a letter was still live when the next winter opened').toBe(false)
  })

  it('⚠ takes NO dice and asks no table – it is a relationship, not a competitive selection', () => {
    // A girl who has slid out of every rung's gate hears from nobody new... and still hears from the
    // brand she has been with, because they know her. That is what makes this a renewal rather than
    // a sixth rung, and it is why `raiseKitRenewal` consults neither `shopWritesAt` nor
    // `standingClears`. The obligation she DID keep is the whole of what earns it.
    const world = careerWithExpiringDeal('renew-nodice', { ranked: false, events: 20 })
    // Out of the top 30 at home and with no junior standing `standingClears` would hand it back on -
    // the same two lines the standing-verdict fixture above uses, and for the same reason: an
    // early-season field is young enough that zero points can still rank inside the band.
    world.kidRankDomestic = 999
    world.kidRank = 999
    expect(windowLadder(sponsorStandingOf(world)), 'the fixture must clear no rung at all').toEqual([])
    playWinter(world)
    const fresh = world.offers.filter(
      (o) => o.kind === 'kit' && o.id !== 'kit-47' && !o.id.startsWith('kit-end') && !o.id.startsWith('kit-renew'),
    )
    expect(fresh, 'a rung wrote to a career that clears none').toHaveLength(0)
    expect(renewalIn(world), 'the relationship rolled dice it was not supposed to have').toBeDefined()
  })

  it('does not write over a signature – one brand at a time still holds', () => {
    // He took a better rung on the window's opening week. The incumbent is answered by that
    // signature and does not turn round and post a competing letter four weeks later.
    let world: WorldState | null = null
    for (let attempt = 0; attempt < 40 && !world; attempt++) {
      const probe = careerWithExpiringDeal(`renew-spoken-${attempt}`, { ranked: true })
      probe.week = LATE_OPEN
      reviewSponsors(probe)
      if (probe.offers.some((o) => o.state === 'open')) world = probe
    }
    expect(world, 'no seed in 40 tries was written to on the window\'s opening week').not.toBeNull()
    const open = world!.offers.find((o) => o.state === 'open')!
    acceptOffer(world!, open.id)
    playWinter(world!, LATE_OPEN + 1)
    expect(seasonSpokenFor(world!.offers, LATE_CLOSE)).not.toBeNull()
    expect(renewalIn(world!), 'the incumbent wrote over a season already promised').toBeUndefined()
  })

  it('⚠ a brand that was let down does not ask for more of the same', () => {
    // The one condition that is a JUDGEMENT rather than a schedule. A deal ended for `events` or
    // `standing` is a relationship that failed, and only a term served in full earns the offer of
    // another one - read off the goodbye letter the review already posted, so the letter and the
    // feed row cannot disagree about what happened.
    const world = careerWithExpiringDeal('renew-letdown', { events: 0 })
    playWinter(world)
    const goodbye = world.offers.find((o) => o.id === 'kit-end-kit-47')!
    expect((goodbye.terms as KitOfferTerms).ended, 'the fixture must FAIL its obligation').toBe('events')
    expect(renewalIn(world), 'a brand that was let down asked for another year').toBeUndefined()
  })

  it('is raised once however often the window is re-read, and the season\'s one row names it', () => {
    const world = careerWithExpiringDeal('renew-once')
    playWinter(world)
    const brand = (world.offers.find((o) => o.id === 'kit-47')!.terms as KitOfferTerms).brand
    const rows = world.events.filter((e) => e.week === LATE_CLOSE && e.type === 'info')
    expect(rows.some((e) => e.text.includes(`${brand} would like another season`))).toBe(true)
    // ...and the row does not ALSO describe it as a stranger writing in, one sentence apart.
    expect(rows.some((e) => e.text.includes(`Letters from ${brand}`))).toBe(false)
    reviewSponsors(world)
    reviewSponsors(world)
    expect(world.offers.filter((o) => o.id.startsWith('kit-renew'))).toHaveLength(1)
  })

  it('signing it covers the season ahead, and no week is ever under two contracts', () => {
    const world = careerWithExpiringDeal('renew-sign')
    playWinter(world)
    const renewal = renewalIn(world)!
    acceptOffer(world, renewal.id)
    const old = world.offers.find((o) => o.id === 'kit-47')!
    // ⚠ COVER STARTS TODAY, NOT THE WEEK AFTER THE OLD DEAL STOPPED, and the difference is the
    //   fortnight `contractEndWeek` deliberately gives to nobody: the outgoing term ends on week 49
    //   of its season so that the window's last two weeks are unencumbered («чтобы с 50 точно уже
    //   было пусто»). `dealStartsAt` is "today, unless a contract she is still under runs past
    //   today" - and by the closing week the old one has already stopped. So week 102 carries no
    //   deal, by design, and that is a gap in the calendar rather than a gap in the cover: it holds
    //   no tournament and no ranking.
    expect(renewal.fromWeek).toBe(LATE_CLOSE)
    expect(renewal.untilWeek).toBe(contractEndWeek(LATE_CLOSE + WEEKS_PER_YEAR))
    expect(activeKitDeal(world.offers, old.untilWeek!)!.id, 'the old deal was cut short').toBe('kit-47')
    expect(activeKitDeal(world.offers, old.untilWeek! + 1), 'the unencumbered fortnight is spoken for').toBeNull()
    expect(activeKitDeal(world.offers, LATE_CLOSE)!.id).toBe(renewal.id)
    // ...and it really does cover the season she is about to play, start to finish.
    expect(activeKitDeal(world.offers, LATE_CLOSE + 1)!.id).toBe(renewal.id)
    expect(activeKitDeal(world.offers, renewal.untilWeek!)!.id).toBe(renewal.id)
    expect(activeKitDeal(world.offers, renewal.untilWeek! + 1)).toBeNull()
    // ...and the allowance starts again, rather than the second year inheriting the first's spend.
    expect(renewal.coveredCents).toBe(0)
  })

  // ===============================================================================================
  // ⚠⚠ ROUND 28 #17 – ONE LETTER PER BRAND, AND THE INCUMBENT'S IS THE RENEWAL
  // ===============================================================================================
  //
  // The owner: «Baseline athletic 2 раза письмо о спонсорстве прислали на 48 и 52 неделе
  // одинаковое». Read off his own save: `kit-671` (W48, the window's opening week, tier `tour`) and
  // `kit-renew-kit-567` (W52, the closing week, `renewal: true`) - the same brand, and terms
  // identical field for field, because the contract ending under her came from that very rung.
  //
  // THE SEAM: `raiseKitOffers` dedupes rung against rung (round 17 #27) and `raiseKitRenewal`
  // dedupes the incumbent against itself, and nobody asked whether the two are the same brand. When
  // the deal finishing under her is from a rung she still clears, the ladder writes to her as a
  // stranger AND the relationship writes to her four weeks later.
  //
  // ⚠ IT IS THE RUNG'S LETTER THAT GOES, NOT THE RENEWAL - the argument is written out on
  // `raiseKitOffers`, and the shortest form of it is that the other choice would make the
  // relationship depend on a competing letter's dice, and «⚠ NO DICE» is a pinned property of it
  // three tests up.
  //
  // ⚠ AND THE ASSERTIONS READ THE SNAPSHOT, because he reported this off the SCREEN. `world.offers`
  // is the engine's own array; `toSnapshot(world).offers` is the only thing the UI is ever given
  // (CLAUDE.md invariant 1), and `live()` below is `InboxSheet`'s own predicate copied verbatim.
  it('⚠ ROUND 28 #17 – a contract runs to its natural end and the brand writes ONCE', () => {
    /** `InboxSheet`'s own rule for a letter that is still a decision. */
    const live = (o: Offer, week: number): boolean => o.state === 'open' && week <= o.deadlineWeek
    const brandOf = (o: Offer): string => (o.terms as KitOfferTerms).brand

    // THE FIXTURE HAS TO BE ONE WHERE THE DEFECT COULD FIRE, and both halves of that are asserted
    // rather than hoped for: her ladder must still contain the rung her outgoing contract came from,
    // and that rung's own dice must say YES on its slot. Without the second one the winter is silent
    // for a reason that has nothing to do with this fix and the test proves nothing.
    let world: WorldState | null = null
    let ladder: readonly string[] = []
    for (let attempt = 0; attempt < 60 && !world; attempt++) {
      const probe = careerWithExpiringDeal(`dup-brand-${attempt}`, { ranked: true })
      const rungs = windowLadder(sponsorStandingOf(probe))
      const slot = rungs.indexOf('local') // `kit-47` in this fixture is a LOCAL deal
      if (slot < 0) continue
      const standing = sponsorStandingOf(probe)
      if (!shopWritesAt(probe.seed, LATE_OPEN + slot, offerChanceFor(standing, 'local'))) continue
      world = probe
      ladder = rungs
    }
    expect(world, 'no seed in 60 tries put the incumbent\'s own rung on her ladder with a live roll').not.toBeNull()
    expect(ladder, 'the fixture must still clear the rung the ending contract came from').toContain('local')
    const incumbent = world!.offers.find((o) => o.id === 'kit-47')!
    const brand = brandOf(incumbent)

    // THE WINTER, week by week, exactly as a player lives it - and the inbox checked on every one of
    // them, because "two letters from one brand" is a fact about a MOMENT and not about a total.
    for (let week = LATE_OPEN; week <= LATE_CLOSE; week++) {
      world!.week = week
      reviewSponsors(world!)
      const inbox = toSnapshot(world!).offers.filter((o) => o.kind === 'kit' && live(o, week))
      const names = inbox.map(brandOf)
      expect(new Set(names).size, `week ${week % WEEKS_PER_YEAR}: ${names.join(', ')}`).toBe(names.length)
    }

    // The contract ran to its natural end - this is a renewal case and not a brand that was let
    // down, which is the arm the duplicate lives in.
    const goodbye = world!.offers.find((o) => o.id === 'kit-end-kit-47')!
    expect((goodbye.terms as KitOfferTerms).ended).toBe('term')

    // ...and over the whole window, one letter per brand, full stop. `info` is excluded because the
    // goodbye is a notice rather than an offer - he cannot sign it - which is the same line
    // `reviewSponsors` draws when it composes the season's one feed row.
    const winter = world!.offers.filter(
      (o) => o.kind === 'kit' && o.week >= LATE_OPEN && o.state !== 'info',
    )
    const winterBrands = winter.map(brandOf)
    expect(new Set(winterBrands).size, winterBrands.join(', ')).toBe(winterBrands.length)

    // ...and the one from the brand she has been wearing is the RENEWAL, on the paper she has been
    // reading all season. Without this the letter would say «A kit deal for your daughter» and
    // introduce a brand she has been in the kit of for a year (`InboxSheet.subjectOf`).
    const hers = winter.filter((o) => brandOf(o) === brand)
    expect(hers).toHaveLength(1)
    expect(hers[0].id).toBe('kit-renew-kit-47')
    expect((hers[0].terms as KitOfferTerms).renewal).toBe(true)

    // AND THE FEED SAYS IT ONCE. `reviewSponsors` already keeps the renewal out of the "letters from
    // X and Y" clause so the row cannot «name the same brand twice in two different voices one
    // sentence apart» - and then named it twice anyway, in two clauses, because the ladder had also
    // written. This is that comment as a test.
    const row = world!.events.find((e) => e.week === LATE_CLOSE && e.type === 'info')!
    expect(row.text).toContain(`${brand} would like another season`)
    expect(row.text).not.toContain(`A letter from ${brand}`)
    expect(row.text).not.toContain(`Letters from ${brand}`)
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

  it('⚠ REVERSED TWICE (05.08, then 28.08): the window is when brands WRITE, not when letters die', () => {
    // ⚠ THE FIRST REVERSAL (05.08) is kept here as history because it is what makes the second one
    //   legible. This test originally asserted «four weeks of thinking against a three-week
    //   off-season, so a letter raised at 49 can still be signed at 53», reasoning that shortening
    //   the pause to fit the calendar «would be letting the calendar edit the decision». The sponsor
    //   window reversed it: the deadline became a property of the WINDOW, every letter of a winter
    //   died when it closed, and that bought «no decision is ever open while she is playing» - the
    //   thing the 01.08 move into the off-season existed for.
    //
    // ⚠⚠ THE SECOND REVERSAL (28.08, round 28 #17-b) PUTS IT BACK, ON THE OWNER'S RULING, AND HE WAS
    //   SHOWN THE COST FIRST:
    //
    //     «в чем проблема сделать 5? у нас конечная неделя сезона 49 по сути, дальше окно в новый
    //      сезон, даже если приглашение придет на 1й или 2й неделе я не вижу проблем сделать слот в
    //      5 недель»
    //
    //   So a letter raised on the closing week now runs four weeks into the new season and the inbox
    //   CAN hold a live decision while she is playing. Two things make that the better trade:
    //     * the property was already gone. Round 28 #2 gave the ADVERTISING letter five fixed weeks
    //       from arrival, and those letters land mid-season - so «no decision open while playing»
    //       had stopped being true of the inbox as a whole; the window only ever covered kit post.
    //       His ruling makes the two kinds one rule instead of two.
    //     * what the window's deadline actually cost was the thing `decideWeeks` is NAMED for: the
    //       last letter of a winter carried two weeks, and a renewal carried ONE.
    //
    //   ⚠ `docs/specs/sponsor-window-2026-08.md` §3.1 still argues for the old rule, in detail. It
    //   is superseded by §12 and by `ECONOMY.sponsorship.decideWeeks`; this note exists so that a
    //   reader who reaches the spec first does not re-derive it.
    const { world } = worldWithLetter('window-shape')
    expect(world.offers[0].week).toBe(LETTER_WEEK)
    // Five weeks from arrival, as a LITERAL - the round 28 #2 trap, in the file that taught it.
    expect(world.offers[0].deadlineWeek).toBe(LETTER_WEEK + 4)
    expect(world.offers[0].deadlineWeek - world.offers[0].week + 1).toBe(5)
    // ⚠ THE WINDOW ITSELF DID NOT MOVE, and it is still «межсезонье +2» - what changed is that it is
    //   now ONLY the weeks a brand may write in. The third reading, `decideWeeks + 1`, is RETIRED:
    //   the two numbers are independent now and only coincidentally equal, so asserting one from the
    //   other would re-couple exactly what the ruling separated.
    expect(SPONSOR_WINDOW_WEEKS).toBe(OFF_SEASON_WEEKS + 2)
    expect(SPONSOR_WINDOW_WEEKS).toBe(5)
    expect(ECONOMY.sponsorship.decideWeeks).toBe(5)
    // ...and the closing week is still nobody's TURN, which is the job `SPONSOR_LETTER_WEEKS` kept
    // when its old job (guaranteeing a late letter two weeks) was retired: it is reserved for the
    // incumbent's renewal, so no fifth rung can crowd the relationship out. See its own comment.
    const lastLetterWeek = LETTER_WEEK + SPONSOR_LETTER_WEEKS - 1
    expect(isSponsorLetterWeek(lastLetterWeek)).toBe(true)
    expect(isSponsorLetterWeek(lastLetterWeek + 1)).toBe(false)
    expect(isSponsorWindowWeek(lastLetterWeek + 1)).toBe(true)
    expect(WINDOW_CLOSE_WEEK - lastLetterWeek + 1).toBe(2)
  })

  it('⚠⚠ HIS RULING, SWEPT: every week of the window gives five, and the last one crosses the year', () => {
    // Round 28 #17-b. The claim is «the deadline is a property of the LETTER», and the only honest
    // way to assert that is to raise letters on EVERY week a brand can write on and show the number
    // does not move - including the two weeks that put the answer in the next season, which is the
    // half he was warned about and accepted.
    //
    // FIVE IS A LITERAL HERE. Writing it as `SPONSOR_LETTER_WEEKS - 1` or as `decideWeeks` is the
    // trap round 28 #2 was invisible behind for three weeks: every assertion in that file was
    // expressed in terms of the constant, so not one of them could fail when the constant was wrong.
    const RULED = 5
    const seen: { week: number; deadline: number }[] = []
    for (let slot = 0; slot < SPONSOR_WINDOW_WEEKS; slot++) {
      const week = LETTER_WEEK + slot
      const offers: Offer[] = []
      const raised = raiseKitOffers({
        offers,
        seed: seedTheShopWritesTo(`sweep-${slot}`, week, worldly(1)),
        week,
        standing: worldly(1),
      })
      // The closing week raises nothing NEW for a career that has been here all along, but this arm
      // is a career meeting the window there - the catch-up case - so it does write.
      expect(raised.length, `no brand wrote on window week ${week % WEEKS_PER_YEAR}`).toBeGreaterThan(0)
      for (const o of raised) {
        expect(o.week).toBe(week)
        expect(o.deadlineWeek - o.week + 1, `window week ${week % WEEKS_PER_YEAR} gave a different shelf life`).toBe(RULED)
        expect(isOfferLive(o, week + RULED - 1)).toBe(true)
        expect(isOfferLive(o, week + RULED)).toBe(false)
        seen.push({ week, deadline: o.deadlineWeek })
      }
    }
    expect(seen.length).toBeGreaterThanOrEqual(SPONSOR_WINDOW_WEEKS)

    // ⚠ AND THE TWO LAST WEEKS REALLY DO REACH INTO THE SEASON – «даже если приглашение придет на 1й
    //   или 2й неделе я не вижу проблем сделать слот в 5 недель». A letter on the closing week (season
    //   offset 51) is answerable on offset 3 of the year she is now playing. That is the property
    //   §3.1 bought and he sold; it is asserted rather than merely allowed, so nobody can quietly
    //   restore the old rule and still pass.
    const onClose = seen.filter((s) => s.week === WINDOW_CLOSE_WEEK)
    expect(onClose.length).toBeGreaterThan(0)
    for (const s of onClose) {
      expect(s.deadline).toBe(WINDOW_CLOSE_WEEK + 4)
      expect(s.deadline % WEEKS_PER_YEAR).toBe(3)
      expect(s.deadline).toBeGreaterThanOrEqual(WEEKS_PER_YEAR) // ...genuinely the next season
      expect(isSponsorWindowWeek(s.deadline)).toBe(false)
    }

    // ⚠⚠ ...AND NO LETTER CAN SURVIVE TO THE NEXT WINDOW. Forty-four weeks of daylight between the
    //   latest possible expiry and the next winter's opening week, so two windows can never overlap
    //   and a letter can never outlive the deal it was competing for. Arithmetic, not luck.
    const latestDeath = kitOfferDeadline(WINDOW_CLOSE_WEEK)
    const nextOpen = sponsorWindowOpensAt(LETTER_WEEK) + WEEKS_PER_YEAR
    expect(nextOpen - latestDeath).toBe(44)
    expect(latestDeath).toBeLessThan(nextOpen)
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
      // ⚠ SEEDED INTO THE RESULTS LEDGER, NOT THE NEWS FEED (04.08). `eventsPlayedInSeason` used to
      // count feed rows, which `pruneEvents` caps at 400 and trims oldest-first - so on a real busy
      // career her own early tournaments were displaced by later ones and the sponsor undercounted
      // (measured on the owner's W230 save: 7 counted against 10 played). The fixture followed the
      // wrong ledger because the code did; both now use the one that is pruned by TIME.
      world.results.push({ playerId: KID_ID, week: WEEKS_PER_YEAR + i, points: 10, tier: 'national' })
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
    // ⚠ RE-AIMED (05.08): the verdict is reached on the window's OPENING week and the one feed row
    //   it is allowed is written on its CLOSING week - see `reviewSponsors` for why the row waits
    //   (the feed budget: four letter weeks must not become four rows). The knock the player
    //   actually gets at the verdict is the brand's goodbye LETTER, asserted here too, because that
    //   is the surface the 04.08 fix put it on.
    const goodbye = world.offers.find((o) => o.state === 'info' && (o.terms as KitOfferTerms).ended)
    expect((goodbye!.terms as KitOfferTerms).ended).toBe('standing')
    expect(goodbye!.week).toBe(review)
    for (let w = review + 1; w <= review + SPONSOR_WINDOW_WEEKS - 1; w++) {
      world.week = w
      reviewSponsors(world)
    }
    const line = world.events.find((e) => e.text.includes('Netrally'))
    expect(line?.week).toBe(review + SPONSOR_WINDOW_WEEKS - 1)
    expect(line?.text).toMatch(/top 30/)
    expect(line?.text).toMatch(/they are done/)
  })

  it('...and holding her place at home keeps it, with a year still to run', () => {
    const { world } = nationalDealAt('nat-hold')
    const until = world.offers[0].untilWeek!
    const review = LETTER_WEEK + WEEKS_PER_YEAR
    for (let i = 0; i < ECONOMY.sponsorship.national.minEvents; i++) {
      // ⚠ SEEDED INTO THE RESULTS LEDGER, NOT THE NEWS FEED (04.08). `eventsPlayedInSeason` used to
      // count feed rows, which `pruneEvents` caps at 400 and trims oldest-first - so on a real busy
      // career her own early tournaments were displaced by later ones and the sponsor undercounted
      // (measured on the owner's W230 save: 7 counted against 10 played). The fixture followed the
      // wrong ledger because the code did; both now use the one that is pruned by TIME.
      world.results.push({ playerId: KID_ID, week: WEEKS_PER_YEAR + i, points: 10, tier: 'national' })
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
    // ⚠ RE-AIMED (05.08, schema v41), and this is the one place the sponsor window can be FELT by a
    //   career already in flight, so it is asserted rather than described. Every pre-v41 term ended
    //   on the calendar year's last week (103 here); a term now ends WITH THE SEASON, on week 49,
    //   and the migration snaps every running contract onto that boundary. The direction is DOWN for
    //   this shape and for every other shape the shipped rules produce - by two weeks, and they are
    //   off-season weeks that carry no tournament, no ranking and no entry, so what is lost is at
    //   most a fortnight of the freshness ceiling. Anything ending EARLIER in a season is rounded UP
    //   to the same week instead, because extending a promise is safe and shortening one is not; the
    //   test below walks both directions off one expression.
    expect(migrated.offers[0].untilWeek).toBe(101)
    expect(migrated.offers[0].untilWeek).toBe(contractEndWeek(103))
    // ...and the start of cover is back-filled EXACTLY rather than reconstructed: `decidedWeek` is
    // what a pre-v41 deal meant by "the first week it covers", and that is what it becomes.
    expect(migrated.offers[0].fromWeek).toBe(53)
    expect(migrated.offers[0].coveredCents).toBe(41_200)
    expect(terms.kitAllowanceCents).toBe(200_000)
  })

  it('⚠ v41 lands a mid-season term on the season boundary, and says which way it rounded', () => {
    // The migration's own rule, both directions, on the same expression. A save whose contract dies
    // in the middle of a competitive season - which no shipped rule produces, but a hand-edited or a
    // future one could - is rounded UP to that season's contract end, so the player is never handed
    // LESS cover than his letter promised. A save whose contract runs past week 49 into the two
    // quiet weeks is rounded DOWN to the same week, which costs a fortnight of nothing.
    const midSeason = v32WithDeal()
    ;(midSeason.offers as { untilWeek: number }[])[0].untilWeek = 70 // ...season 1, week 18
    const up = migrateSave(midSeason) as unknown as WorldState
    expect(up.offers[0].untilWeek).toBe(101)
    expect(up.offers[0].untilWeek!).toBeGreaterThan(70)

    const lateSeason = v32WithDeal()
    ;(lateSeason.offers as { untilWeek: number }[])[0].untilWeek = 103 // ...season 1, the year's end
    const down = migrateSave(lateSeason) as unknown as WorldState
    expect(down.offers[0].untilWeek).toBe(101)
    expect(down.offers[0].untilWeek!).toBeLessThan(103)
    // ...and both landings are the same week, because there is only one rule.
    expect(up.offers[0].untilWeek).toBe(down.offers[0].untilWeek)
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
    const [offer] = raiseKitOffers({
      offers: world.offers,
      seed: seedTheShopWritesTo('v33-fresh-roll', LETTER_WEEK, domestic(1)),
      week: LETTER_WEEK,
      standing: domestic(1),
    })
    const terms = offer.terms as KitOfferTerms
    expect(terms.covers).toEqual(TIER_COVERS.local)
    expect(terms.travelShare).toBe(0)
    expect(terms.seasons).toBe(1)
  })
})

// =================================================================================================
// THE TOURNAMENT DESK — W2-LADDER §6's informational half (owner ruling 1: the letters system).
// =================================================================================================
describe('the tournament desk writes on W-rung registration, and only then', () => {
  /** An open world aged into the W era by the EVENT's week (the gate reads age there), with the
   *  books the W15 on-ramp wants. Same idiom as the pro-cap suite in tests/age-caps.test.ts. */
  /** ⚠ THE JANUARY BIRTHDAY IS LOAD-BEARING AND IS A RE-AIM, NOT A WEAKENING (one-clock ruling,
   *  09.08). Every letter below is raised by an entry into `wEvent`, a W15 in week 110, and W15 opens
   *  at 16 – asked of HER age now rather than of the birth-month-free band. `DEFAULT_PROFILE` is a
   *  June girl, who is fifteen in week 110 and is correctly refused, so the desk fixture would have
   *  been measuring the age gate instead of the desk. A January girl is sixteen there, which is what
   *  this file has always assumed and never said. No assertion changed. */
  function wWorld(seed: string): { world: WorldState; wEvent: SeasonEvent; jEvent: SeasonEvent } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 6 })
    world.fundsCents = 9_999_999_00
    world.results.push({ playerId: KID_ID, week: 0, points: 1500, tier: 'national' })
    for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: 0, points: 300, tier: 'j300' })
    // ⚠ RE-AIMED, NOT WEAKENED (P1, docs/specs/junior-access-2026-08.md). The junior book above is
    // written at WEEK 0 and the W15 this fixture is about sits at week 110, so by the time the desk
    // is asked her ITF rows are outside the 52-week window and `kidPoints(world,'itf')` reads zero –
    // the on-ramp has always been carried across that gap by the LATCH, which `recomputeKidRank` set
    // at week 0 off the 1,200-point book. P1 moved the door onto her junior RANKING, and 1,200 ITF
    // points lands her around #21-#35 against the pre-history table (tests/age-caps.test.ts says so
    // in as many words), i.e. either side of the reserved place's cut depending on the seed. This
    // file seed-hunts across 3,000 worlds, so "depending on the seed" means the fixture throws. The
    // latch is set explicitly instead – the same idiom `proWorld` and `worldAt` already use – which
    // reproduces exactly what week 0 used to do and keeps this file about the tournament desk.
    world.onRampCleared = { itf: true, wta: true }
    recomputeKidRank(world)
    const wEvent: SeasonEvent = {
      id: 'desk-w15', week: 110, tier: 'w15', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 108,
    }
    const jEvent: SeasonEvent = {
      id: 'desk-j30', week: 12, tier: 'j30', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 10,
    }
    world.season.push(wEvent, jEvent)
    return { world, wEvent, jEvent }
  }

  it('a W entry raises the registration letter; a junior entry raises none', () => {
    const { world, wEvent, jEvent } = wWorld('desk-1')
    enterEvent(world, jEvent.id)
    expect(world.offers.filter((o) => o.kind === 'entry')).toEqual([])
    enterEvent(world, wEvent.id)
    const letters = world.offers.filter((o) => o.kind === 'entry')
    expect(letters).toHaveLength(1)
    const letter = letters[0]
    expect(letter.state).toBe('info')
    expect(letter.id).toBe(`entry-${wEvent.id}-0`)
    const terms = letter.terms as EntryLetterTerms
    expect(terms.tier).toBe('w15')
    expect(terms.label).toBe(TIERS.w15.label)
    expect(terms.eventWeek).toBe(wEvent.week)
    // The one number on the paper is the number the engine enforces: withdrawEvent's own deadline.
    expect(terms.freeUntilWeek).toBe(wEvent.deadlineWeek)
    expect(terms.cancelled).toBeUndefined()
  })

  it('an informational letter is never LIVE: no dot, no answer path', () => {
    const { world, wEvent } = wWorld('desk-2')
    enterEvent(world, wEvent.id)
    const letter = world.offers.find((o) => o.kind === 'entry')!
    expect(isOfferLive(letter, world.week)).toBe(false)
    expect(hasLiveOffer(world.offers, world.week)).toBe(false)
    expect(toSnapshot(world).offerOpen).toBe(false)
  })

  it('a free, in-time cancellation writes the confirmation; the two letters are distinct records', () => {
    const { world, wEvent } = wWorld('desk-3')
    enterEvent(world, wEvent.id)
    cancelEntry(world, wEvent.id) // before the deadline -> delegates to the refunding withdrawal
    const letters = world.offers.filter((o) => o.kind === 'entry')
    expect(letters).toHaveLength(2)
    expect(letters.map((o) => o.id)).toEqual([`entry-${wEvent.id}-0`, `entry-${wEvent.id}-1`])
    expect((letters[1].terms as EntryLetterTerms).cancelled).toBe(true)
    // ...and a re-registration is a THIRD record, never an overwrite: the inbox is a history.
    enterEvent(world, wEvent.id)
    expect(world.offers.filter((o) => o.kind === 'entry')).toHaveLength(3)
  })

  // ===============================================================================================
  // WHO ENDED IT (fix/outgrown-entry, 05.08) – the third state of a desk letter.
  //
  // The owner was shown «Your withdrawal from the World Tour 50 ... is confirmed – in time, free of
  // charge, and nothing is recorded against her» for an entry the ENGINE had cancelled. He had taken
  // no decision, so the letter was a receipt for something he never did. `releasedBy` is what makes
  // the two cases distinguishable on the paper; these tests are what keep them distinguishable.
  // ===============================================================================================

  it("the parent's own withdrawal is byte-identical to what it always was: no releasedBy key at all", () => {
    const { world, wEvent } = wWorld('desk-by-parent')
    enterEvent(world, wEvent.id)
    cancelEntry(world, wEvent.id)
    const terms = world.offers.filter((o) => o.kind === 'entry')[1].terms as EntryLetterTerms
    expect(terms.cancelled).toBe(true)
    // ⚠ ABSENT, not `'parent'`. Old saves carry letters without the key and must keep rendering the
    // voluntary arm; writing the default would make "absent" and "parent" two things to keep in step.
    expect('releasedBy' in terms).toBe(false)
  })

  it('an INJURY release says so on the paper – the desk acted, and the letter names it', () => {
    const { world, wEvent } = wWorld('desk-by-injury')
    enterEvent(world, wEvent.id)
    // A layoff that swallows the event week, with the list still open: the auto-withdraw's own
    // two conditions (see the loop in engine/world/injury.ts).
    world.week = wEvent.deadlineWeek - 1
    world.injury = {
      kind: 'stress reaction',
      severity: 'severe',
      weeksRemaining: 12,
      totalWeeks: 12,
      sinceWeek: world.week,
    }
    releaseEntry(world, wEvent.id, 'injury')
    const letters = world.offers.filter((o) => o.kind === 'entry')
    const terms = letters[letters.length - 1].terms as EntryLetterTerms
    expect(terms.cancelled).toBe(true)
    expect(terms.releasedBy).toBe('injury')
    // ...and the FEED row does not put the verb in the parent's mouth either.
    const row = world.events.filter((e) => e.type === 'entry').pop()!
    expect(row.text).not.toMatch(/^Withdrew/)
    expect(row.text).toMatch(/^Taken out of World Tour 15/)
    expect(row.text).toMatch(/not fit for that week/)
  })

  it('END TO END: the injury auto-withdraw inside rollInjury reaches that same path', () => {
    // ⚠ THE REASON IS ONLY WORTH HAVING IF THE ENGINE'S OWN CALLER PASSES IT, so this drives the
    // real onset rather than calling `releaseEntry` by hand. It is the one automatic release left
    // after the outgrown step was retired (05.08), which makes it the whole of the released arm's
    // reachable surface. Seed-hunted for an onset long enough to swallow the event week – the same
    // idiom tests/injuries.test.ts uses (`findFiringSeed`), against the real distribution.
    for (let i = 0; i < 3000; i++) {
      const { world, wEvent } = wWorld(`desk-injury-e2e-${i}`)
      world.week = wEvent.deadlineWeek - 2 // list still open, four weeks before she is due on court
      enterEvent(world, wEvent.id) // entered fit, as a parent would
      world.condition = 0 // ...and then ground down: the highest-risk arm of `injuryTau`
      rollInjury(world)
      if (world.injury === null || layoffCovering(world, wEvent.week) === null) continue
      expect(world.entries).not.toContain(wEvent.id)
      const letters = world.offers.filter((o) => o.kind === 'entry')
      expect((letters[letters.length - 1].terms as EntryLetterTerms).releasedBy).toBe('injury')
      expect(world.events.filter((e) => e.type === 'entry').pop()!.text).toMatch(/^Taken out of/)
      return
    }
    throw new Error('no seed produced a layoff covering the event week')
  })

  // ⚠ RE-AIMED FOR ROUND-17 #1, NOT WEAKENED. The claim was "desk letters age out after a year";
  // the owner asked for last SEASON's tournament letters to go, and a rolling year never crosses a
  // boundary - a week-3 letter survived to week 3 of the next season, so a new season opened with
  // almost all of the old one still in the inbox. The window is `seasonIndexOf` now. Every original
  // assertion still holds at the same call (a year-old letter is by then two seasons back), and the
  // block gains the cases the new clock has to get right.
  it('tournament letters go with their season; sponsor letters never do', () => {
    const world = createWorld('desk-prune')
    world.offers.push(
      { id: 'entry-old-0', kind: 'entry', week: 0, deadlineWeek: 0, state: 'info',
        terms: { tier: 'w15', label: 'World Tour 15', eventWeek: 2, freeUntilWeek: 0 } },
      { id: 'kit-old', kind: 'kit', week: 0, deadlineWeek: 4, state: 'signed',
        terms: { tier: 'local', brand: 'x', kitAllowanceCents: 1, freshCap: 1, minEventsPerSeason: 1,
          covers: ['strings'], travelShare: 0, seasons: 1 } },
    )
    const pruned = pruneEntryLetters(world.offers, WEEKS_PER_YEAR + 1)
    expect(pruned.some((o) => o.id === 'entry-old-0')).toBe(false)
    expect(pruned.some((o) => o.id === 'kit-old')).toBe(true)
  })

  it('⭐ #1 – a letter from LAST season goes the week the season turns, not a year later', () => {
    // The bug in one line: at week 53 (the first week of season 1) a letter written in week 40 of
    // season 0 was 13 weeks old, so the rolling year kept it - and kept it until week 92.
    const late = [
      { id: 'entry-late', kind: 'entry', week: 40, deadlineWeek: 40, state: 'info',
        terms: { tier: 'w15', label: 'World Tour 15', eventWeek: 42, freeUntilWeek: 40 } },
    ] as Offer[]
    expect(pruneEntryLetters(late, 50).some((o) => o.id === 'entry-late'), 'its own season keeps it').toBe(true)
    expect(pruneEntryLetters(late, WEEKS_PER_YEAR).some((o) => o.id === 'entry-late'), 'the new season does not').toBe(false)
  })

  it('⭐ #1 – but an entry for an event that has NOT been played survives the boundary', () => {
    // Entries for the opening weeks of a season are written in the off-season before it. Deleting
    // the confirmation for an event she is about to play would be the prune doing real damage.
    const ahead = [
      { id: 'entry-ahead', kind: 'entry', week: 48, deadlineWeek: 48, state: 'info',
        terms: { tier: 'w15', label: 'World Tour 15', eventWeek: WEEKS_PER_YEAR + 2, freeUntilWeek: 48 } },
    ] as Offer[]
    expect(pruneEntryLetters(ahead, WEEKS_PER_YEAR).some((o) => o.id === 'entry-ahead')).toBe(true)
    // ...and it goes once the event is behind her.
    expect(pruneEntryLetters(ahead, WEEKS_PER_YEAR + 3).some((o) => o.id === 'entry-ahead')).toBe(false)
  })

  it('⭐ #1 – and a LIVE suspension keeps its paper, whatever season imposed it', () => {
    // The only document that says why her entries are being refused. A suspension imposed in
    // November runs into the new year; this is the case where deleting "last season's letters"
    // would leave the player with a broken game and no explanation.
    const susp = [
      { id: 'tour-susp', kind: 'tour', week: 46, deadlineWeek: 46, state: 'info',
        terms: { notice: 'suspension', untilWeek: WEEKS_PER_YEAR + 6 } },
    ] as Offer[]
    expect(pruneEntryLetters(susp, WEEKS_PER_YEAR + 1).some((o) => o.id === 'tour-susp'), 'still serving it').toBe(true)
    expect(pruneEntryLetters(susp, WEEKS_PER_YEAR + 7).some((o) => o.id === 'tour-susp'), 'served, and gone').toBe(false)
  })

  it('⭐ #1 – nothing that is not a tournament letter is touched, at any distance', () => {
    // The owner's second half, said as plainly as he said it. A refused kit offer from four seasons
    // ago is still the record of a decision he made.
    const kits = [
      { id: 'kit-refused', kind: 'kit', week: 3, deadlineWeek: 7, state: 'refused', decidedWeek: 5,
        terms: { tier: 'local', brand: 'x', kitAllowanceCents: 1, freshCap: 1, minEventsPerSeason: 1,
          covers: ['strings'], travelShare: 0, seasons: 1 } },
    ] as Offer[]
    expect(pruneEntryLetters(kits, WEEKS_PER_YEAR * 4).some((o) => o.id === 'kit-refused')).toBe(true)
  })
})
