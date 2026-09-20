// THE RETURN, WAVE 8 – T6 HALF 1: THE PROTECTED RANK (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T6, constants in `ECONOMY.motherhood`).
//
// T5 resolved `world.pregnancy` into two terminal shapes and marked the seam one line above its own
// clear. This is what lands on that seam: the freeze – «her rank at `pausesWeek`, 12 entries, 156
// weeks», RULED 20.09 («наверное да, у нас тоже были исследования») off his own digest's row, «ranking
// freeze for 3 years post-birth (since 2019, used by 50+ players)».
//
// FOUR CLAIMS, AND THE THIRD IS THE ONE THIS FILE EXISTS FOR:
//
//   1. THE RANK IS A **CAPTURE**, TAKEN ON THE WEEK IT IS TRUE. §A walks the real pause week:
//      `landPregnancyPause` writes `rankAtPause`, and the alternative – deriving it at the return –
//      is not an alternative at all, because the WTA ranking window is 52 weeks and the return lands
//      51 weeks after the pause, so the evidence has just aged out. §A.4 measures that with the
//      engine's own window rather than asserting it.
//   2. IT RESOLVES INTO `world.comeback` ON THE **TRY** ARM AND NOWHERE ELSE. §B: the three ruled
//      numbers, and the ending arm that writes none of them.
//   3. ⚠⚠ IT IS READ AT **THE ONE GATE** AND IS A FOURTH DOOR, NOT A SECOND TURNSTILE. §C asks the
//      real `entryStatus` / `enterEvent`, never a re-implementation: an entry her live standing
//      refuses is allowed while the freeze is live, the twelfth is the last, the thirteenth is
//      refused, and an expired freeze refuses.
//   4. ⚠⚠ IT IS CONSUMED ONLY WHEN IT WAS **DECISIVE**. §D pins that both ways – the entry that
//      needed it spends one, the entry that did not leaves `entriesLeft` unmoved. The argument for
//      that rule is written at the line that computes it (`entryVerdict`, `world/medical.ts`).
//
// §E is the zero-draw net: a KEY COUNT with a positive control, never an alignment comparison
// (wave 3's measured finding, the wave-4 brief's §0.1 law).
//
// ⭐⭐ AND WHAT THIS FILE DELIBERATELY DOES NOT TEST: a ranking decay. `WINDOW_BY_TRACK` and
// `windowedBestSum` age her points out BY CONSTRUCTION while she is away, T9 MEASURES that, and a
// second decay written here would be a disagreeing spelling of a rule that already ran. §A.4 reads
// the window's own constant precisely to show the first one is enough.
//
// MUTATION LEDGER – every arm run red-first against THIS file, applied by a scripted exact-string
// edit with an md5 receipt and reverted by md5, each on a re-verified 20-green baseline. ⚠ THE
// COUNTS ARE **MEASURED** REDS, NOT PREDICTIONS:
//   ARM 1  `&& !freeze` deleted from the acceptance          → 9 RED: every §C case that needs the
//          condition in `entryVerdict`                          door, all of §D but the free-entry
//                                                               one, and §E
//   ARM 2  consume on EVERY entry (`decisive` replaced by    → 1 RED: §D.2. ⚠ AND THE 1 IS THE
//          «a freeze exists») – the rule the trap turns on      FINDING RATHER THAN A WEAK NET: §D.1
//                                                               poses its free entry at a LOCAL rung,
//                                                               which leaves `entryVerdict` through
//                                                               the DOMESTIC arm where the flag is
//                                                               never set at all, so this arm cannot
//                                                               reach it. §D.2 exists precisely
//                                                               because of that – the same claim at
//                                                               the very rung the freeze acts on – and
//                                                               it is the case that catches it.
//   ARM 3  the capture re-taken on every call                → 1 RED: §A.3
//          (`??=` -> `=`) – the number moving under a career
//   ARM 4  the expiry off by one (`>=` -> `>`)               → 1 RED: §C.4
//   ARM 5  the write at T5's seam deleted entirely           → 15 RED: all of §B, §C, §D and §E
//   ARM 6  the entry not counted off in `enterEvent`         → 2 RED: §C.3's walk and §D.4's refund
//   ARM 7  the W-track clause deleted from                   → 1 RED: §C.5
//          `protectedRankPlace`
//   ARM 8  the withdrawal refund deleted from `releaseEntry` → 1 RED: §D.4
//   ARM 9  the FIFTH DOOR deleted from `tierFloorOpen` –     → 1 RED: §C.6, and only §C.6. That is the
//          the calendar's half of R10-5                         R10-5 net doing its job: every other
//                                                               case in this file asks the TURNSTILE,
//                                                               so without §C.6 a freeze written into
//                                                               one gate only would have shipped green.

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, carried by T2's, T3's, T4's and T5's
// suites. Every draw is the engine's own; the mock exists only so §E can COUNT the keys a step
// reached.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  acceptanceRank,
  createWorld,
  decisionWeekOf,
  enterEvent,
  entryStatus,
  kidAgeExact,
  landPregnancyPause,
  protectedRankPlace,
  resolveReturnDecision,
  withdrawEvent,
  type WorldState,
} from '../src/engine/world'
// ⚠ `tierVerdict` IS NOT ON THE `engine/world` BARREL and is imported from its own module, which
// is where `tests/ladder-floor.test.ts` and `tests/wave8-pause.test.ts` already take it from.
import { tierVerdict } from '../src/engine/world/medical'
import { tierFloorOpen } from '../src/engine/world/ladder'
import { WINDOW_BY_TRACK, windowFromWeek } from '../src/engine/season/ranking'
import { TIER_LADDER, TIERS } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import type { LoveEpisode } from '../src/shared/protocol'
import type { PregnancyState } from '../src/engine/world/state'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ⚠⚠ THE BRIEF'S AND THE RULING'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY` – wave 3's
// ARM 2 law, inherited through T2..T5's own `BRIEF` blocks: an expectation read out of the thing
// under test moves with it, so a silent retune has to walk past THIS line. ⭐ `entries` and `weeks`
// are RULED (20.09) and not drafts, which is why they are transcribed as the digest's own «12» and
// «3 years» rather than as a product nobody typed.
const BRIEF = {
  playsOnWeeks: 8,
  termWeeks: 31,
  decisionWeeksAfterBirth: 20,
  protectedEntries: 12,
  protectedWeeks: 156,
} as const

/** The rung every §C case is posed on. ⚠ A **W** RUNG AND NOT A WTA ONE, on purpose: the freeze has
 *  to be shown working at a rung a real comeback would actually re-enter through, and W75's cut is
 *  loose enough that a frozen rank can clear it while an unranked girl cannot. The rule is the same
 *  on every rung of the track – §C.5 sweeps the whole ladder for the ones it must NOT touch. */
const RUNG: TierId = 'w75'

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – T3's and T5's own, one task on
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock (T2's helper). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A married row of the v83 shape – `latchedWeek` non-null, `endedWeek` null (T2's helper). */
function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career standing at `age`, funded, fit, with an EMPTY calendar and the fork long since
 *  answered (T5's `wedded`, and its note: `forkDue` is true of every week of a twenty-eight-year-old,
 *  so an unanswered fork would stop `resolveEndings` two steps above the one under test). */
function wedded(seed: string, age = 28): WorldState {
  const world = createWorld(seed)
  const week = weekAtAge(world, age)
  world.season = []
  world.week = week
  world.loveEpisodes = [married(week - 104, week - 52)]
  world.condition = 100
  world.fundsCents = 500_000_00
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  world.fork = { askedWeek: 0, answer: 'continue', offer: null }
  return world
}

/** The record `rollPregnancy` writes, hand-built on the BRIEF's own arithmetic (T5's `expecting`). */
function expecting(world: WorldState, announcedWeek: number, support: PregnancyState['support'] = 'warm'): WorldState {
  const pausesWeek = announcedWeek + BRIEF.playsOnWeeks
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    announcedWeek,
    pausesWeek,
    dueWeek: pausesWeek + BRIEF.termWeeks,
    support,
    rankAtPause: null,
  }
  return world
}

/** A controlled event on a world's calendar (T3's / T5's helper). */
function injectEvent(
  world: WorldState,
  partial: { week: number; tier?: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `t6-${partial.week}-${partial.tier ?? RUNG}`,
    week: partial.week,
    tier: partial.tier ?? RUNG,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** ⭐⭐ A CAREER STANDING ON ITS RETURN WEEK WITH THE FREEZE ALREADY WRITTEN – posed through the
 *  ENGINE's own writer (`resolveReturnDecision`'s try arm is the only one there is), never by poking
 *  `world.comeback` into place, so every §C case is asked about the record the engine really makes.
 *
 *  ⚠ THE COIN IS NOT BENT. The arm is selected by searching seeds for one whose draw says «she
 *  tries», exactly as T5's `decided` does, because a chance overwritten to 1 would make every
 *  assertion below an assertion about a stub. */
function returned(prefix: string, rankAtPause: number | null, age = 28): WorldState {
  for (let i = 0; i < 500; i++) {
    const world = wedded(`${prefix}-${i}`, age)
    expecting(world, world.week)
    world.pregnancy!.rankAtPause = rankAtPause
    world.week = decisionWeekOf(world.pregnancy!)
    resolveReturnDecision(world)
    if (world.comeback !== null && world.ending === null) return world
  }
  throw new Error(`no seed under '${prefix}' whose coin says she tries`)
}

/** The first `n` weeks from `from` on which the gate would let her into `RUNG` – probed through the
 *  REAL `entryStatus`, so no case is ever posed on an off-season week, an exam week or a week the
 *  caps have closed. Re-probed after every entry, because entering moves the world. */
function enterableWeeks(world: WorldState, from: number, n: number): number[] {
  const out: number[] = []
  for (let w = from; out.length < n && w < from + 3 * 52; w++) {
    if (world.season.some((e) => e.week === w)) continue
    const probe = injectEvent(world, { week: w, id: `probe-${w}` })
    if (entryStatus(world, probe).level !== 'blocked') out.push(w)
    world.season = world.season.filter((e) => e.id !== probe.id)
  }
  if (out.length < n) throw new Error(`only ${out.length} enterable weeks from ${from}`)
  return out
}

// =================================================================================================
// A. THE CAPTURE – «her rank at `pausesWeek`», taken on the week it is true and nowhere else
// =================================================================================================
describe('wave 8 T6 A – the frozen rank is captured at the pause', () => {
  it('⭐⭐ the REAL pause week writes `rankAtPause`, and it is her W standing that week', () => {
    const world = wedded('w8-t6-capture')
    const pausesWeek = world.week + BRIEF.playsOnWeeks
    expecting(world, world.week)
    // ⚠ A REAL W BOOK, so «unranked is not rank one» is not what this case measures. `kidRankWta` is
    // the cache every rank surface reads (`rankIn`), and a counting result is what makes the gate
    // read it at all.
    world.kidRankWta = 41
    world.results = [{ week: world.week - 4, tier: 'w75', points: 30, prize: 0, round: 'F', playerId: 'kid' } as never]
    expect(world.pregnancy!.rankAtPause, 'nothing is frozen before the week arrives').toBeNull()
    world.week = pausesWeek - 1
    landPregnancyPause(world)
    expect(world.pregnancy!.rankAtPause, 'and not on the week before it either').toBeNull()
    world.week = pausesWeek
    landPregnancyPause(world)
    expect(world.pregnancy!.rankAtPause, 'the pause week takes her standing').toBe(41)
  })

  it('⚠ a career with NO counting W result freezes NOTHING – «unranked is not rank one»', () => {
    // `rankIn` hands back the TABLE SIZE for a girl with no W points, and freezing that sentinel
    // would hand a comeback a protected place at the bottom of the world, which is not a place.
    const world = wedded('w8-t6-unranked')
    const pausesWeek = world.week + BRIEF.playsOnWeeks
    expecting(world, world.week)
    world.week = pausesWeek
    landPregnancyPause(world)
    expect(world.pregnancy!.rankAtPause, 'she paused with nothing worth protecting').toBeNull()
  })

  it('it is written ONCE and a later call cannot move it', () => {
    const world = wedded('w8-t6-once')
    const pausesWeek = world.week + BRIEF.playsOnWeeks
    expecting(world, world.week)
    world.kidRankWta = 60
    world.results = [{ week: world.week - 4, tier: 'w75', points: 30, prize: 0, round: 'F', playerId: 'kid' } as never]
    world.week = pausesWeek
    landPregnancyPause(world)
    world.kidRankWta = 300
    landPregnancyPause(world)
    expect(world.pregnancy!.rankAtPause, 'the capture is the number the week held').toBe(60)
  })

  it('⭐⭐⭐ AND THE CAPTURE IS NOT A CONVENIENCE – the window has eaten the evidence by the return', () => {
    // ⚠⚠ THIS IS THE ARITHMETIC THAT MAKES §A A REQUIREMENT RATHER THAN A STYLE CHOICE, and it is
    // asked of the ENGINE's own window function rather than transcribed, because the claim is about
    // that rule. Her rank at `pausesWeek` is a fold over the 52 weeks BEHIND that week; the return
    // lands `termWeeks + decisionWeeksAfterBirth` weeks later, and by then the book the fold was
    // taken from has moved almost entirely out from under it – `pruneResults` has physically deleted
    // the rows, so «derive it at the return» is not a slower answer, it is no answer.
    const absence = BRIEF.termWeeks + BRIEF.decisionWeeksAfterBirth
    expect(absence, 'the pause is 51 weeks with no new entry').toBe(51)
    const returnWeek = 1000
    const pausesWeek = returnWeek - absence
    expect(WINDOW_BY_TRACK.wta, 'the W table is a rolling window').toBe('rolling52')
    const atReturn = windowFromWeek(returnWeek, WINDOW_BY_TRACK.wta)
    const atPause = windowFromWeek(pausesWeek, WINDOW_BY_TRACK.wta)
    expect(atReturn, '⚠ the book she is ranked on at the return starts AFTER the one she paused on')
      .toBeGreaterThan(atPause)
    expect(
      pausesWeek - atReturn,
      '⚠⚠ exactly ONE of the fifty-two weeks her frozen rank was folded from survives the absence',
    ).toBe(1)
  })
})

// =================================================================================================
// B. THE RESOLUTION – the try arm writes `world.comeback`, and the ending arm writes nothing
// =================================================================================================
describe('wave 8 T6 B – the freeze is written at the return', () => {
  it('⭐⭐⭐ the three RULED numbers: her rank at the pause, twelve entries, 156 weeks', () => {
    const world = returned('w8-t6-ruled', 41)
    const freeze = world.comeback!.protectedRank
    expect(world.comeback!.returnedWeek, 'the record is stamped with the week she came back').toBe(world.week)
    expect(freeze, 'she paused ranked, so she is protected').not.toBeNull()
    expect(freeze!.rank, 'the rank is the one the pause captured').toBe(41)
    expect(freeze!.entriesLeft, 'twelve, RULED 20.09').toBe(BRIEF.protectedEntries)
    expect(freeze!.validUntilWeek, 'three years from the return, RULED 20.09')
      .toBe(world.comeback!.returnedWeek + BRIEF.protectedWeeks)
  })

  it('a career that paused with nothing protected still COMES BACK – the fact and the entitlement part', () => {
    const world = returned('w8-t6-bare', null)
    expect(world.comeback, 'she returned, and the world says so').not.toBeNull()
    expect(world.comeback!.protectedRank, 'and she returned with nothing frozen').toBeNull()
    expect(world.ending, 'the career ticks on').toBeNull()
  })

  it('⚠ the ENDING arm writes no comeback at all – there was none to record', () => {
    // Posed the way T5 poses its own ending cases: search for a seed whose coin falls the other way.
    let stopped: WorldState | null = null
    for (let i = 0; i < 500 && stopped === null; i++) {
      const world = wedded(`w8-t6-stops-${i}`)
      expecting(world, world.week)
      world.pregnancy!.rankAtPause = 41
      world.week = decisionWeekOf(world.pregnancy!)
      resolveReturnDecision(world)
      if (world.ending !== null) stopped = world
    }
    expect(stopped, 'a seed whose coin says she does not go back').not.toBeNull()
    expect(stopped!.ending!.type, 'the career stops as `family`').toBe('family')
    expect(stopped!.comeback, '⚠ and nothing pretends she came back').toBeNull()
    expect(stopped!.pregnancy, 'the record is cleared on both arms – T5\'s totality obligation').toBeNull()
  })

  it('the freeze is read off the record BEFORE the clear – it cannot be read after', () => {
    // ⚠ THE ORDER IS THE WHOLE OF `comebackAtReturn`'s CONTRACT. `rankAtPause` lives on
    // `world.pregnancy`, and `resolveReturnDecision` clears that record on both arms, so a freeze
    // assembled after the clear would be assembled off nothing. The mechanical proof is that the
    // record is gone and the number survived.
    const world = returned('w8-t6-order', 77)
    expect(world.pregnancy, 'the record did not survive the function').toBeNull()
    expect(world.comeback!.protectedRank!.rank, 'and the number came out with the comeback').toBe(77)
  })
})

// =================================================================================================
// C. THE ENTRY BAND – the fourth door, at THE ONE GATE
// =================================================================================================
describe('wave 8 T6 C – the freeze at the entry band', () => {
  it('⭐⭐⭐ an entry her LIVE standing refuses is ALLOWED while the protection is live', () => {
    const world = returned('w8-t6-door', 41)
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    const event = injectEvent(world, { week, id: 'door' })
    // ⚠⚠ THE CONTROL FIRST, AND IT IS THE HALF THAT MAKES THE CASE MEAN ANYTHING: with the freeze
    // taken away the very same event is refused, with the acceptance list's own sentence. Without it
    // «she got in» would be satisfied by a rung that was open to everybody.
    const freeze = world.comeback!.protectedRank!
    world.comeback = null
    const refused = entryStatus(world, event)
    expect(refused.level, 'control: her live standing refuses her').toBe('blocked')
    expect(refused.reason, 'control: and it is the acceptance list that does it').toBe('locked')
    world.comeback = { returnedWeek: week - 3, protectedRank: freeze, returnPlan: null }
    const admitted = entryStatus(world, event)
    expect(admitted.level, 'the frozen standing takes her').not.toBe('blocked')
    expect(admitted.onProtectedRank, 'and the verdict says the entry rides it').toBe(true)
  })

  it('⚠ the frozen rank must actually CLEAR the cut – a freeze below the list is no door at all', () => {
    // A protection is an ENTRY STANDING, not a wild card: #520 frozen is still #520 to a list that
    // takes the top 240. This is the clause that stops the freeze becoming «she gets in anywhere».
    const world = returned('w8-t6-short', 41)
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    const event = injectEvent(world, { week, id: 'short' })
    const accepts = acceptanceRank(world, RUNG)!
    world.comeback!.protectedRank!.rank = accepts + 1
    expect(entryStatus(world, event).level, 'one place outside the list is outside the list').toBe('blocked')
    world.comeback!.protectedRank!.rank = accepts
    expect(entryStatus(world, event).level, 'and the last place on it is on it').not.toBe('blocked')
  })

  it('⭐⭐ THE TWELFTH ENTRY IS THE LAST, AND THE THIRTEENTH IS REFUSED – walked, not asserted', () => {
    const world = returned('w8-t6-twelve', 41)
    const weeks = enterableWeeks(world, world.week + 3, BRIEF.protectedEntries + 1)
    for (let i = 0; i < BRIEF.protectedEntries; i++) {
      const event = injectEvent(world, { week: weeks[i], id: `spend-${i}` })
      expect(entryStatus(world, event).level, `entry ${i + 1} of twelve is hers`).not.toBe('blocked')
      enterEvent(world, event.id)
      expect(
        world.comeback!.protectedRank!.entriesLeft,
        `⚠ entry ${i + 1} spent exactly one`,
      ).toBe(BRIEF.protectedEntries - (i + 1))
    }
    expect(world.comeback!.protectedRank!.entriesLeft, 'twelve spent, none left').toBe(0)
    const thirteenth = injectEvent(world, { week: weeks[BRIEF.protectedEntries], id: 'thirteenth' })
    expect(entryStatus(world, thirteenth).level, '⚠⚠ the thirteenth is refused').toBe('blocked')
    expect(() => enterEvent(world, thirteenth.id), 'and the turnstile agrees with the card').toThrow()
  })

  it('⭐⭐ it EXPIRES – `validUntilWeek` is the last week it does not cover', () => {
    const world = returned('w8-t6-expiry', 41)
    const until = world.comeback!.protectedRank!.validUntilWeek
    // ⚠ READ AT THE **EVENT's** WEEK AND NOT AT TODAY'S – R10-17's rule, the same one `layoffCovering`
    // and `pauseCovering` carry. A December horizon must not book her into a March draw on a
    // protection that runs out in January, so the two probes below move the EVENT and not the world.
    expect(protectedRankPlace(world, RUNG, until - 1), 'the week before the horizon is covered').toBe(true)
    expect(protectedRankPlace(world, RUNG, until), '⚠ and the horizon itself is not').toBe(false)
    const expired = injectEvent(world, { week: until + 4, id: 'expired', deadlineWeek: world.week })
    expect(entryStatus(world, expired).level, 'an expired protection refuses').toBe('blocked')
    expect(entryStatus(world, expired).reason, 'with the acceptance list\'s own refusal').toBe('locked')
  })

  it('⚠⚠ THE W TRACK ONLY – a frozen RANK cannot open a rung that reads points or a share', () => {
    // The narrowing has an argument (see `protectedRankPlace`): `acceptanceRank` is an ABSOLUTE rank
    // only on the W rungs, the domestic band is denominated in POINTS, the junior rungs are shut on
    // AGE for every woman this arc can reach, and both on-ramps LATCH. This sweeps the ladder for it.
    // ⚠ RANK 1, so the cut can never be the reason a rung stays shut – the only things left that can
    // are the TRACK and the absence of an acceptance list, which is what the case is about.
    const world = returned('w8-t6-track', 1)
    for (const tier of TIER_LADDER) {
      expect(
        protectedRankPlace(world, tier, world.week + 4),
        `${tier}: the freeze may open a W rung with an acceptance list and no other`,
      ).toBe(TIERS[tier].track === 'wta' && acceptanceRank(world, tier) !== undefined)
    }
  })

  it('⭐⭐⭐ R10-5: THE CALENDAR AND THE TURNSTILE AGREE – `tierFloorOpen` knows about the freeze too', () => {
    // ⚠⚠ THE LESSON THE WILD CARD TAUGHT ON 18.08, QUOTED IN `tierFloorOpen` ITSELF: «a door the
    // calendar does not know about shows her a SHUT rung and admits her anyway». For a woman whose W
    // book has aged out across a 51-week pause that is not an edge case – it is every card of her
    // comeback – so the freeze is asked in BOTH gates, through one function, and this is the case
    // that would go red if it were ever written into only one of them.
    const world = returned('w8-t6-r105', 41)
    const bare = { ...world, comeback: null } as WorldState
    expect(tierFloorOpen(bare, RUNG), 'control: the calendar shuts the rung on her live standing').toBe(false)
    expect(tierFloorOpen(world, RUNG), 'and the freeze opens it for the calendar as well').toBe(true)
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    const event = injectEvent(world, { week, id: 'r105' })
    expect(
      entryStatus(world, event).level !== 'blocked',
      '⚠ one rule, two surfaces, one answer',
    ).toBe(tierFloorOpen(world, RUNG))
  })

  it('a RUNG\'s card sees the same rule – one gate, two questions, never two answers', () => {
    // `tierVerdict` asks the SAME `entryVerdict` with the availability tail off. The freeze is her
    // STANDING and not a per-event door, so it behaves like the junior reserved place and not like
    // the wild card: it is on for a rung-level ask.
    const world = returned('w8-t6-rung', 41)
    const bare = { ...world, comeback: null } as WorldState
    expect(tierVerdict(bare, RUNG).level, 'control: the rung refuses her live standing').toBe('blocked')
    expect(tierVerdict(world, RUNG).level, 'and takes her frozen one').not.toBe('blocked')
  })
})

// =================================================================================================
// D. THE CONSUME RULE – only when the protection was DECISIVE, pinned BOTH ways
// =================================================================================================
describe('wave 8 T6 D – an entry spends one of the twelve only when it needed one', () => {
  it('⭐⭐⭐ an entry that did NOT need the protection leaves `entriesLeft` UNMOVED', () => {
    // ⚠⚠ THIS IS THE HALF THE DESIGN TURNS ON. §2 T6's own sentence is that «small-first books the
    // lower tiers and rebuilds the live ranking the honest way» – under a consume-on-every-entry rule
    // the careful ramp would burn twelve entries on rungs it never needed a freeze for, and the trap
    // would run backwards.
    const world = returned('w8-t6-free', 41)
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    // A LOCAL event: the domestic band takes her on points she has (the ladder's bottom rung is open
    // to a girl with nothing), so no door was needed and none is spent.
    const local = injectEvent(world, { week, tier: 'local', id: 'free' })
    const verdict = entryStatus(world, local)
    expect(verdict.level, 'control: she was always going to get in here').not.toBe('blocked')
    expect(verdict.onProtectedRank, 'and the verdict does not claim a door she did not use').toBeUndefined()
    enterEvent(world, local.id)
    expect(world.comeback!.protectedRank!.entriesLeft, '⚠ nothing was spent').toBe(BRIEF.protectedEntries)
  })

  it('⭐⭐ ...and an entry her live standing would have taken at a W rung spends nothing either', () => {
    // The stronger form of the same claim, at the very rung the freeze acts on: give her a LIVE rank
    // inside the cut and the door is not the freeze, so the entry is free.
    const world = returned('w8-t6-live', 41)
    const accepts = acceptanceRank(world, RUNG)!
    world.kidRankWta = Math.max(1, accepts - 20)
    world.results = [{ week: world.week - 4, tier: RUNG, points: 30, prize: 0, round: 'F', playerId: 'kid' } as never]
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    const event = injectEvent(world, { week, id: 'live' })
    const verdict = entryStatus(world, event)
    expect(verdict.level, 'her live standing is inside the list').not.toBe('blocked')
    expect(verdict.onProtectedRank, 'so the freeze was not the door').toBeUndefined()
    enterEvent(world, event.id)
    expect(world.comeback!.protectedRank!.entriesLeft, 'and none of the twelve went').toBe(BRIEF.protectedEntries)
  })

  it('⚠ a REFUSED entry spends nothing – the card can never take one off her', () => {
    const world = returned('w8-t6-refused', 41)
    // ⚠ THE WEEK IS PROBED WHILE THE FREEZE IS STILL LIVE, because with it spent there is no
    // enterable week to pose the case on at all – which is itself the rule working.
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    const event = injectEvent(world, { week, id: 'refused' })
    world.comeback!.protectedRank!.entriesLeft = 0
    expect(() => enterEvent(world, event.id)).toThrow()
    expect(world.comeback!.protectedRank!.entriesLeft, 'nothing below zero').toBe(0)
  })

  it('⭐⭐ AND A WITHDRAWAL HANDS IT BACK – the slot follows the fee, «мы ни за что не наказываем»', () => {
    // This is `releaseEntry`'s own standing rule («a name taken off an open list never
    // participated»), which already returns the fee and the ITF slot. The injury auto-withdraw comes
    // through the same function, so the alternative is a freeze burned by something nobody chose.
    const world = returned('w8-t6-refund', 41)
    const week = enterableWeeks(world, world.week + 3, 1)[0]
    const event = injectEvent(world, { week, id: 'refund', deadlineWeek: week - 1 })
    enterEvent(world, event.id)
    expect(world.comeback!.protectedRank!.entriesLeft, 'one of the twelve went').toBe(BRIEF.protectedEntries - 1)
    withdrawEvent(world, event.id)
    expect(world.comeback!.protectedRank!.entriesLeft, 'and came back with the fee').toBe(BRIEF.protectedEntries)
  })
})

// =================================================================================================
// E. THE DRAWS – zero, with a positive control
// =================================================================================================
describe('wave 8 T6 E – half 1 takes no draw at all', () => {
  it('⚠ the capture, the resolution\'s write and every gate read are draw-free', () => {
    const world = returned('w8-t6-draws', 41)
    // ⚠ THE POSITIVE CONTROL FIRST AND ON THE SAME INSTRUMENT (wave 3's measured finding): the
    // return itself DOES draw – T5's one coin – so a recorder that saw nothing anywhere would be a
    // broken recorder rather than a draw-free task.
    expect(
      rngKeys.filter((k) => k.includes(':life:return:')).length,
      'control: T5\'s coin was really spent through this recorder',
    ).toBeGreaterThan(0)
    rngKeys.length = 0
    const weeks = enterableWeeks(world, world.week + 3, 2)
    const event = injectEvent(world, { week: weeks[0], id: 'draws', deadlineWeek: weeks[0] - 1 })
    entryStatus(world, event)
    tierVerdict(world, RUNG)
    protectedRankPlace(world, RUNG, weeks[1])
    enterEvent(world, event.id)
    withdrawEvent(world, event.id)
    expect(
      rngKeys.filter((k) => k.includes(':life:')),
      '⚠ the freeze reads and spends without a single life draw',
    ).toEqual([])
  })
})
