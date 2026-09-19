// =================================================================================================
// WAVE 5, T8 – `'fork-psy'`: THE PSYCHOLOGIST'S READ ON THE SAME `stop`, AT THE RESERVED SLOT
// =================================================================================================
//
// `docs/plans/life-wave-5-builder-2026-09.md` §2 T8, under §0.5's binding promise – «the psy beat is
// ONE `raiseLifeBeat` call at the reserved slot plus registry rows … nothing about this file changes
// shape to take him». So this file's subject is as much what did NOT move as what did, and §D is the
// half that says so.
//
// THE THREE DESIGN CALLS THIS IS BUILT TO (the architect, 13.09):
//
//   1. THE GATE IS `psychologistWorksThisWeek`, NOT `world.psychologistHired` – ruling J, which
//      supersedes the brief's own wording. A seat stood down by a college freeze or a booked family
//      week is not billed that week and must not work it either. §A3/§A4.
//   2. NO FOCUS IS REQUIRED. The fork is the SEAT's, not a year-focus's. §A5.
//   3. HE MAY READ `spiritShock` FOR THE WORDING REGISTER ONLY – never for weights, never for the
//      option set, never for a price. §B, and the fence is pinned from BOTH sides.
//
// ⚠⚠ WHY §B IS WRITTEN THE WAY IT IS, AND IT IS RULING L AS AMENDED APPLIED DELIBERATELY. «The two
// arms' option sets are equal» is an equality comparing two arms, which is INVISIBLE to a mutation
// that moves both – the family that has bitten three times this wave. So the priced set is asserted
// against a TRANSCRIBED LITERAL first (a mutation moving both goes red twice), and the identity of
// the two arms is asserted second, with `toBe` rather than `toEqual` because `lifeBeatOptionsFor`
// returns the base list itself when a kind has no overlay – the strongest form the claim can take.
// And §B2 is the anti-vacuity half: the SAID line really does move with the shock, or §B1 would be
// asserting that nothing reads the shock at all.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and re-edited back BY HAND (never
// `git checkout`; md5 back to pristine). Red counts are MEASURED over the discriminating set
// (this file, wave3-stop-want, wave3-reaction, wave3-soft-surface, wave3-small-talk,
// wave4-life-row-stamp, wave4-ended-beat, wave4-spirit-shock, wave2-life-beat, wave3-delivery,
// coach-voice, condition, and the five wave5-psychologist files) – 16 files / 402 tests when arms
// 1-6 and 8-9 were run, 17 / 433 after `npm run check` found a SECOND copy of the ruled blocking
// table that the narrower set could not see (`tests/wave3-small-talk.test.ts` §H, re-aimed in
// place). ⚠ ARM 7 was RE-MEASURED over the widened set for that reason; the others were not, so
// their counts are floors rather than totals and say so.
// =================================================================================================
//
//   ⚠ NINE BEHAVIOURAL MUTATIONS PLUS THREE COMPILE ONES, RUN 13.09.2026. CONTROL GREEN FIRST –
//   16 files / 402 tests – AND EVERY ONE RE-EDITED BACK BY HAND, never `git checkout`, with
//   `md5 src/engine/world/lifeBeat.ts` back to `f929e724…` after each.
//
//   ARM 1   THE GATE NEUTRALISED TO THE BRIEF'S OWN WORDING – `psychologistWorksThisWeek(world)`
//           -> `(world.psychologistHired ?? false)`, i.e. ruling J un-applied.
//           **1 RED** · §A's stand-down case, on the college-freeze line. ⚠ THIS IS THE WHOLE
//           MEASURED DIFFERENCE BETWEEN THE TWO READINGS, and it is exactly one test: every other
//           case in this file passes under both, which is why the ruling had to be a ruling.
//
//   ARM 2   THE RAISE NEVER FIRES (`&& false` on the condition).
//           **11 RED** · §A x3, §B x3, §C's cascade, §E's info row, §F's lint, §G x2. The positive
//           control for everything below: the file is measuring a row that really is raised.
//
//   ARM 3   THE SHOCK NEVER READ AT THE RAISE – the detail's register hard-wired to `'plain'`.
//           **1 RED**, and it is the anti-vacuity half of §B (the SAID line stops moving). ⚠ §B1
//           stays GREEN, which is correct and is the point: an unread shock cannot re-price anything.
//
//   ARM 4   A PRICED ACKNOWLEDGMENT – `straight`'s bond 0 -> 2.
//           **7 RED** · wave3-reaction §D x3 (the cross-file catch, through the registry law) plus
//           §B1, §B3 and §C x2 here. ⚠⚠ §B1 GOES RED ON THE **LITERAL** HALF, which is the receipt
//           that its two-arm equality is not the «unable to fail» shape: a mutation that moves BOTH
//           arms is caught by the transcribed pair, and only by it.
//
//   ARM 5   A READ-DEPENDENT PRICE – an overlay `kind === 'fork-psy' && read === 'company'` added
//           to `lifeBeatOptionsFor`, which is the only shape in which this kind's price COULD move
//           with a fact a harness is not tracking.
//           **7 RED** · wave3-reaction §D x4 and §B1, §C x2 here. ⚠ §B1 goes red on the STRUCTURAL
//           half this time (`toBe` – the base list is no longer the same object), so the two halves
//           of that case catch two different defects and both are wanted.
//
//   ARM 6   THE SEAT CALLS **BEFORE** THE COACH – the raise hoisted above `'fork-counsel'`'s.
//           **3 RED** · §A1's order case, §D2's source order, §G2's count-keys net (which walks the
//           arc by kind). A queue order is a player-facing fact and not a detail.
//
//   ARM 7   `LIFE_BEAT_BLOCKING['fork-psy']` -> `false`.
//           **15 RED over the widened set** (14 before it was widened), the broadest arm in the
//           file, and TWO of them are CROSS-FILE: wave3-soft-surface §A's ruled table and
//           wave3-small-talk §H's second copy of it. The one word really is the whole mechanism.
//           ⚠ THE SECOND COPY IS WHY THIS FILE'S SET IS WIDER THAN IT STARTED: `npm run check`
//           found it, not the narrow set – «a walk that cannot reach the case is a green that means
//           nothing», in its registry form.
//
//   ARM 8   A `heard` STAMP ADDED AT THE RAISE (`, true` as the fourth argument).
//           **1 RED** · §G1. ⚠ T6's coin is for read-bearing beats and this beat carries no read;
//           nothing else in the tree notices, which is exactly why the pin is written down.
//
//   ARM 9   THE POOL NEUTRALISED INSTEAD OF THE DETAIL – `PSY_COUNSEL[psyRegister]` -> `.plain`.
//           **3 RED** · §B2, §F1 (six cells collapse to three) and §F3's distinctness. The same
//           property attacked from the other side from ARM 3, and a different set of cases catches
//           it, which is why both arms were run.
//
//   COMPILE ARM A   the `'fork-psy'` case removed from `lifeBeatSaid`.
//           `vue-tsc` TS2366 «Function lacks ending return statement and return type does not
//           include 'undefined'» at the switch – the union forcing the case, as the file's own v74
//           note claims it does. (Plus two TS6133 for the now-unread pool.)
//   COMPILE ARM B   the `LIFE_BEAT_BLOCKING` row removed.
//           TS2741 «Property '"fork-psy"' is missing … but required in type
//           `Record<LifeBeatKind, boolean>`».
//   COMPILE ARM C   ⚠⚠ THE GLYPH GATE, MEASURED RATHER THAN ASSUMED – `'fork-psy': '♡'` added to
//           `KIND_PICKS` (src/components/screens/lifeRowGlyphs.ts).
//           TS2353 «''fork-psy'' does not exist in type `Partial<Record<"ended" | "met", string>>`».
//           So the gate does NOT force a pick for a new `LifeBeatKind` – `LifeBeatGlyphs` is a
//           `Partial` over the narrow `LIFE_BEAT_ROW_KINDS` roster – and it DOES refuse one for a
//           kind that writes no `'life'` row. The owner is asked nothing and 🤍 carries the row.
//
// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, wave 4's and T4/T5/T6's §B apparatus, verbatim.
// Every call is delegated to the real `rngFromSeed`, so any number this file measures is the
// engine's own; the mock exists only so §G can COUNT the keys the answer reached. Hoisted, because
// `vi.mock`'s factory is lifted above the imports.
import { describe, expect, it, vi } from 'vitest'

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

import {
  answerFork,
  answerLifeBeat,
  birthdayOfferFor,
  buildLifeBeatPrompt,
  chooseGift,
  closeTournament,
  createWorld,
  decideKnock,
  deliverKnownPartner,
  forkWantOf,
  lifeBeatHeading,
  lifeBeatListenFollowUp,
  lifeBeatOptionsFor,
  lifeBeatSaid,
  lifeLogOf,
  pendingBirthday,
  pendingKnock,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  raiseLifeBeat,
  skipTournament,
  tickWeek,
  ENDS_READS,
  FORK_STOP_DRIVERS,
  LIFE_BEAT_BLOCKING,
  LIFE_BEAT_OPTIONS,
  PARTNER_WANTS,
  PSY_FOCUSES,
  TEMPERAMENTS,
  type ForkWant,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type DiaryLifeStage, type LifeBeatKind } from '../src/shared/protocol'
import { LIFE_BEAT_ROW_KINDS, lifeRowGlyph, LIFE_ROW_EMOJI } from '../src/components/screens/lifeRowGlyphs'
import { DRAIN_ANSWER, drainCostOf, drainLifeBeats, drainLifeBeatsTallied, drainSkewLine } from '../tools/_lifeBeats'
import { worldFunction, worldSource } from './worldSource'
import { at, codeOf } from './helpers/source'

const B = ECONOMY.bond

// -------------------------------------------------------------------------------------------------
// FIXTURES – wave 3 T17's own, TRANSCRIBED rather than imported, because that file's helpers are
// module-private and copying the walk is cheaper than exporting test apparatus across files (the
// wave-4 T5 precedent). ⚠ IT IS A REAL ENGINE WALK TO A REAL FORK, nine years of ticks: the one
// fixture shape that can prove the raise is reachable at all.
// -------------------------------------------------------------------------------------------------

function atTheForkWanting(want: ForkWant, hold: { spirit: number; bond: number }): WorldState {
  const tried: ForkWant[] = []
  for (let seed = 0; seed < 12; seed++) {
    const world = createWorld(`t17-${want}-${seed}`, { ...DEFAULT_PROFILE, birthMonth: 9, birthDay: 1, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52 * 9 && world.fork === null; i++) {
      if (pendingKnock(world)) decideKnock(world, 'rest')
      const birthday = pendingBirthday(world)
      if (birthday !== null) chooseGift(world, birthdayOfferFor(world, birthday).options[0].id)
      drainLifeBeats(world, 'fork-opinion')
      world.spirit = hold.spirit
      world.bond = hold.bond
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      tickWeek(world, rng)
      while (world.pendingTournament) {
        if (!world.pendingTournament.finished) skipTournament(world)
        closeTournament(world)
      }
      world.season = []
    }
    const drawn = forkWantOf(world)
    if (drawn === want && world.fork !== null && world.fork.answer === null) return world
    if (drawn !== null) tried.push(drawn)
  }
  throw new Error(`no seed in 12 reached a fork wanting '${want}' – drew ${tried.join(', ')}`)
}

/** Her state at the fork, chosen so the WORN root is the one the driver reads – T17's own constant. */
const WORN_AT_THE_FORK = { spirit: 0, bond: B.start }

/** A career standing at a `stop` fork, hers still unanswered. ⚠ MEMOISED: the walk is nine years of
 *  real ticks and every case below wants the same starting world. Each caller gets a deep COPY, so a
 *  case that pokes the seat or the shock cannot leak into the next one. */
let forkTemplate: WorldState | null = null
function atTheStopFork(): WorldState {
  forkTemplate ??= atTheForkWanting('stop', WORN_AT_THE_FORK)
  return structuredClone(forkTemplate) as WorldState
}

/** The seat, hired and working – poked rather than walked, because the hire is T2's subject and not
 *  this one's. ⚠ The FOCUS is a parameter with `null` as its default, which is design call 2 written
 *  into the fixture: the fork is the seat's, so the default case is a seat with no year-focus at all. */
function withSeat(world: WorldState, focus: (typeof PSY_FOCUSES)[number] | null = null): WorldState {
  world.psychologistHired = true
  world.psychologistRung = 1
  world.psychologistFocus = focus
  return world
}

/** The shock, live on the week the fork is answered. ⚠ ITS `kind` IS THE SCHEMA'S OWN AND NOT A
 *  STRING THIS FILE INVENTED – `world.spiritShock` is `{week, kind: 'breakup'}` (state.ts). */
function withShock(world: WorldState): WorldState {
  world.spiritShock = { week: world.week, kind: 'breakup' }
  return world
}

/** ⭐⭐⭐ THE OTHER ARM, AND IT HAS TO BE POKED TOO – A MEASURED SURPRISE WORTH THE COMMENT. The walk
 *  above reaches its fork with a `spiritShock` ALREADY LIVE (`{week: 251, kind: 'breakup'}` on the
 *  seed it settles on), because `WORN_AT_THE_FORK` pins her spirit at 0 every week and the clear is
 *  `spirit >= baseline − 2` – so an attachment that ends anywhere in those nine years leaves a mark
 *  that can never lift. The first draft of §B took the untouched walk as its «plain» control and the
 *  arm was the thing that was wrong, which is the null-arm check running in the useful direction.
 *
 *  ⚠ SO BOTH ARMS ARE POKED, DELIBERATELY AND SYMMETRICALLY. Neither register is an accident of the
 *  fixture, and «the two arms differ» cannot be an artefact of one of them being the walk's leftovers.
 *  ⭐ The finding itself is worth keeping: on the WORN fork – the state the whole counsel arc is
 *  most about – a live shock is the common case rather than a corner. */
function withoutShock(world: WorldState): WorldState {
  world.spiritShock = null
  return world
}

/** Answer her row and hand back the psy row that is waiting, or null. ⚠ IT DRAINS THE COACH FIRST,
 *  which is the queue's own order and the thing §A1 asserts before anything here relies on it. */
function psyRowAfterAnswering(world: WorldState): ReturnType<typeof pendingLifeBeat> {
  answerLifeBeat(world, 'back')
  const coach = pendingLifeBeat(world)
  if (coach !== null && coach.kind === 'fork-counsel') answerLifeBeat(world, DRAIN_ANSWER['fork-counsel'])
  const row = pendingLifeBeat(world)
  return row !== null && row.kind === 'fork-psy' ? row : null
}

/** THE RULED PRICES, TRANSCRIBED. ⚠⚠ NOT `LIFE_BEAT_OPTIONS['fork-psy']` AND NOT `drainCostOf` – an
 *  expectation read out of the thing under test moves WITH it, which is ruling L as amended and this
 *  wave's most-repeated instrument lesson. Both are zero because the wave brief's T8 says «mirror
 *  `'fork-counsel'`'s option and pricing shape exactly» and v74 T17 ruled that pair zero: «counsel is
 *  information, not a test». */
const PSY_RULED: readonly { id: string; bond: number }[] = [
  { id: 'straight', bond: 0 },
  { id: 'keep', bond: 0 },
]

// =================================================================================================
// A. THE ROW IS RAISED BESIDE THE COACH'S, AND ONLY ON A WEEK THE SEAT IS WORKING
// =================================================================================================

describe('wave 5 T8 A – the seat calls, one line after the coach', () => {
  it('⭐⭐⭐ answering a `stop` raises BOTH rows, in the order they called, and the fork waits for both', () => {
    const world = withSeat(atTheStopFork())
    // THE ACTUATION CHECKS FIRST – «prove your walk contains a raised `'fork-psy'`». A walk that
    // cannot reach the case is a green that means nothing.
    expect(forkWantOf(world), 'the engine really drew `stop`').toBe('stop')
    expect(world.fork!.answer, 'and the fork is open behind her').toBeNull()
    expect(pendingLifeBeat(world)!.kind, 'her row is the one waiting').toBe('fork-opinion')

    answerLifeBeat(world, 'back')
    expect(pendingLifeBeat(world)!.kind, '⭐ the COACH is first – the queue answers in `lifeLog` order').toBe('fork-counsel')
    expect(() => answerFork(world, 'continue'), 'and the fork is shut behind him').toThrow()

    answerLifeBeat(world, DRAIN_ANSWER['fork-counsel'])
    const psy = pendingLifeBeat(world)
    expect(psy, '⭐⭐⭐ a second row is waiting where the fork used to be').not.toBeNull()
    expect(psy!.kind, '...and it is the psychologist').toBe('fork-psy')
    expect(() => answerFork(world, 'continue'), '⚠⚠ and the fork is STILL shut – the blocking row is the whole mechanism').toThrow()

    answerLifeBeat(world, PSY_RULED[0].id)
    expect(pendingLifeBeat(world), 'nothing else is raised behind him').toBeNull()
    answerFork(world, 'continue')
    expect(world.fork!.answer, 'and only now does the fork take an answer').toBe('continue')
    // ⚠ THE ARC IS THREE CARDS AND THE LOG SAYS SO, IN ORDER.
    expect(lifeLogOf(world).slice(-3).map((r) => r.kind), 'her, the coach, the seat').toEqual([
      'fork-opinion',
      'fork-counsel',
      'fork-psy',
    ])
  })

  it('⭐⭐⭐ NO SEAT, NO CALL – and the coach\'s shipped arc is exactly the two cards it was', () => {
    // ⚠⚠ THE CONTROL FOR THE WHOLE FILE. «The psychologist calls» is worth nothing without a world
    // in which he does not, and the great majority of careers never hire anybody.
    const world = atTheStopFork()
    expect(world.psychologistHired ?? false, 'the fixture really has no seat').toBe(false)
    answerLifeBeat(world, 'back')
    expect(pendingLifeBeat(world)!.kind, 'the coach still calls').toBe('fork-counsel')
    answerLifeBeat(world, DRAIN_ANSWER['fork-counsel'])
    expect(pendingLifeBeat(world), '⚠ and nothing is behind him').toBeNull()
    expect(lifeLogOf(world).filter((r) => r.kind === 'fork-psy'), 'no row of his kind exists at all').toEqual([])
    answerFork(world, 'continue')
    expect(world.fork!.answer, 'the fork answers exactly as it did before T8').toBe('continue')
  })

  it('⚠⚠ THE STAND-DOWN (ruling J): a college freeze and a booked family week buy no counsel', () => {
    // ⚠ THE BRIEF SAYS «gated `world.psychologistHired`»; ruling J supersedes it, and these two cases
    // are the whole of the difference between the two readings. On both weeks `resolvePsychologist`
    // charges NOTHING – so a call on either would be work the parent did not pay for, which is the
    // travelling-team §4 legibility law read backwards.
    const frozen = withSeat(atTheStopFork())
    frozen.college = { fromWeek: frozen.week - 10, untilWeek: frozen.week + 50, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    expect(psyRowAfterAnswering(frozen), 'a college-freeze week stands the seat down').toBeNull()

    const booked = withSeat(atTheStopFork())
    booked.vacations = [...booked.vacations, { week: booked.week, packageId: 'coast', paidCents: 0 }]
    expect(psyRowAfterAnswering(booked), 'and so does a booked family week').toBeNull()

    // ⚠⚠ AND IT SUSPENDS RATHER THAN CANCELS – the flag survives both, so the seat resumes by itself.
    // Measured on the SAME two careers with the stand-down lifted, which is what makes this a
    // statement about the predicate rather than about two unrelated fixtures.
    const thawed = withSeat(atTheStopFork())
    thawed.college = { fromWeek: thawed.week - 60, untilWeek: thawed.week, doneWeek: thawed.week, years: [], pendingCallUp: null, pendingLeague: null }
    expect(thawed.psychologistHired, 'the hire was never cancelled').toBe(true)
    expect(psyRowAfterAnswering(thawed)?.kind, '⭐ the week the freeze ends, the call happens').toBe('fork-psy')

    const unbooked = withSeat(atTheStopFork())
    unbooked.vacations = [...unbooked.vacations, { week: unbooked.week + 1, packageId: 'coast', paidCents: 0 }]
    expect(psyRowAfterAnswering(unbooked)?.kind, '⭐ and a holiday booked for NEXT week stands nothing down').toBe('fork-psy')
  })

  it('⭐⭐ NO FOCUS IS REQUIRED – every focus, and none, raises the same row', () => {
    // Design call 2: the fork is the SEAT, not a year-focus. `psychologistWorkingRung` is the other
    // question and belongs to the focus passes; this one asks whether anybody is being paid at all.
    const details: string[] = []
    for (const focus of [null, ...PSY_FOCUSES]) {
      const world = withSeat(atTheStopFork(), focus)
      const row = psyRowAfterAnswering(world)
      expect(row?.kind, `focus ${focus ?? 'none'}: the call happens`).toBe('fork-psy')
      details.push(row!.detail)
    }
    // ⚠ RE-AIMED 14.09 BY WAVE 6's T5 AND **STRENGTHENED IN THE SAME EDIT**: «The public life» joins
    // `PsyFocus` (O7), so the walk is six seats and not five. The literal `5` was the weaker half of
    // this pair anyway – it named a number a reader checks against the roster, while the claim is
    // that the walk covered EVERY focus and the seatless arm. So the count is now read off
    // `PSY_FOCUSES` itself and a SIXTH focus forgotten here can no longer pass by arithmetic. The
    // second assertion is untouched and is the one that carries the design call.
    expect(details.length, 'every focus on the roster was walked, and the seatless arm too')
      .toBe(PSY_FOCUSES.length + 1)
    expect(new Set(details).size, '⚠ and the focus reaches the row not at all – one detail, every time').toBe(1)
  })
})

// =================================================================================================
// B. HIS READ OF THE SHOCK IS A WORDING REGISTER AND NEVER A WEIGHT
// =================================================================================================

describe('wave 5 T8 B – `spiritShock` colours the words and touches no number', () => {
  it('⭐⭐⭐ THE PRICED OPTION SET IS BYTE-IDENTICAL with a shock live and with none', () => {
    const plain = withoutShock(withSeat(atTheStopFork()))
    const shocked = withShock(withSeat(atTheStopFork()))
    expect(plain.spiritShock ?? null, 'the control arm really carries no shock').toBeNull()
    expect(shocked.spiritShock?.kind, 'and the live arm really carries one').toBe('breakup')

    expect(psyRowAfterAnswering(plain)?.kind, 'both arms reach the card').toBe('fork-psy')
    expect(psyRowAfterAnswering(shocked)?.kind, 'both arms reach the card').toBe('fork-psy')

    const pricedPlain = pendingLifeBeatOptions(plain)!
    const pricedShocked = pendingLifeBeatOptions(shocked)!
    // ⚠⚠ THE LITERAL FIRST. An equality between the two arms is blind to a mutation that moves BOTH,
    // so each arm is checked against the ruling's own transcribed pair before they are compared to
    // each other. A `bond: 2` typed into either row of `LIFE_BEAT_OPTIONS['fork-psy']` reds here twice.
    for (const [name, priced] of [['plain', pricedPlain], ['shocked', pricedShocked]] as const) {
      expect(priced.map((o) => ({ id: o.id, bond: o.bond })), `${name}: the ruled pair, transcribed`).toEqual([...PSY_RULED])
    }
    // ...and only now, the identity.
    expect(pricedShocked.map((o) => ({ id: o.id, bond: o.bond, label: o.label })), '⚠⚠ and the two priced sets are the same bytes')
      .toEqual(pricedPlain.map((o) => ({ id: o.id, bond: o.bond, label: o.label })))
    // ⚠⚠ THE STRUCTURAL FORM OF THE SAME CLAIM, AND IT IS THE STRONGER ONE. `lifeBeatOptionsFor`
    // returns the BASE LIST ITSELF for a kind with no overlay, so this is not «equal», it is «the
    // same object» – and the shock is not a parameter of that function at all, which is why a price
    // that moved with it could not be written without a signature change.
    for (const wants of PARTNER_WANTS) {
      for (const read of ENDS_READS) {
        expect(lifeBeatOptionsFor('fork-psy', wants, read), `${wants}/${read}: the base list itself`)
          .toBe(LIFE_BEAT_OPTIONS['fork-psy'])
      }
    }
  })

  it('⭐⭐ ...AND THE LINE REALLY MOVES – the anti-vacuity half of the fence', () => {
    // Without this, §B1 would be satisfied by a psychologist who reads nothing at all.
    const plain = withoutShock(withSeat(atTheStopFork()))
    const shocked = withShock(withSeat(atTheStopFork()))
    const saidPlain = buildLifeBeatPrompt(plain) // her row, not his – answered below
    expect(saidPlain!.kind, 'the fixture starts on her row').toBe('fork-opinion')

    const rowPlain = psyRowAfterAnswering(plain)!
    const rowShocked = psyRowAfterAnswering(shocked)!
    expect(rowPlain.detail.split(':')[0], '⭐ the register is stamped at the raise, from the shock').toBe('plain')
    expect(rowShocked.detail.split(':')[0], '...and the live arm stamps the shock\'s own KIND').toBe('breakup')
    expect(rowPlain.detail.split(':')[1], '⚠ and the driver half is the coach\'s own, unchanged by either')
      .toBe(rowShocked.detail.split(':')[1])

    const cardPlain = buildLifeBeatPrompt(plain)!
    const cardShocked = buildLifeBeatPrompt(shocked)!
    expect(cardPlain.said, '⭐⭐ two different reads of one girl').not.toBe(cardShocked.said)
    expect(cardPlain.heading, '⚠ and the parent\'s frame is NOT on that axis – one heading, both arms')
      .toBe(cardShocked.heading)
    expect(cardPlain.options.map((o) => o.label), '⚠⚠ and the buttons do not move with the words either')
      .toEqual(cardShocked.options.map((o) => o.label))
  })

  it('⚠⚠ neither answer moves bond, and nothing in this arc writes spirit – in EITHER register', () => {
    for (const shock of [false, true]) {
      for (const option of PSY_RULED) {
        const world = shock ? withShock(withSeat(atTheStopFork())) : withoutShock(withSeat(atTheStopFork()))
        expect(psyRowAfterAnswering(world)?.kind, `${shock}/${option.id}: the card is up`).toBe('fork-psy')
        const bondBefore = world.bond
        const spiritBefore = world.spirit
        answerLifeBeat(world, option.id)
        expect(world.bond, `${shock}/${option.id}: costs and earns nothing`).toBe(bondBefore)
        expect(world.spirit, `${shock}/${option.id}: and this file writes no spirit anywhere`).toBe(spiritBefore)
      }
    }
  })
})

// =================================================================================================
// C. THE REGISTRY ROWS, AND THE DRAIN THE WHOLE HARNESS LAYER DEPENDS ON
// =================================================================================================

describe('wave 5 T8 C – the drain answer, and read-independence proved by running it', () => {
  it('⭐⭐⭐ `drainCostOf(\'fork-psy\')` is 0, asked of the ENGINE, over every way a girl can be read', () => {
    // ⚠ THE LAW IS RUN, NOT READ. `drainCostOf` prices the registered id through
    // `lifeBeatOptionsFor` under the cross product of her `wants` and her ends-read and THROWS if
    // they disagree, so a green here is the engine's own arithmetic rather than a claim about it.
    expect(DRAIN_ANSWER['fork-psy'], 'the registered answer is the card\'s first acknowledgment').toBe(PSY_RULED[0].id)
    expect(() => drainCostOf('fork-psy'), 'the shipped registry is answerable').not.toThrow()
    expect(drainCostOf('fork-psy'), '⭐ and the price it names is the ruled zero').toBe(PSY_RULED[0].bond)

    // ⚠⚠ AND THE SAME PROPERTY FROM A DIFFERENT SOURCE, which is what stops this being two readings
    // of one thing agreeing with themselves: the registry knows an id and nothing about money, the
    // engine knows the money and nothing about draining, and `PSY_RULED` is the ruling's literal.
    const priced = PARTNER_WANTS.flatMap((wants) =>
      ENDS_READS.map((read) => lifeBeatOptionsFor('fork-psy', wants, read).find((o) => o.id === DRAIN_ANSWER['fork-psy'])!.bond),
    )
    expect(priced.length, 'four ways to read one girl, and the sweep walks all of them').toBe(4)
    expect(new Set(priced).size, '⚠⚠ its price does not move by the read – a harness can state this skew').toBe(1)
    expect(priced[0], 'and the number is the ruled one').toBe(PSY_RULED[0].bond)
  })

  it('⭐⭐ THE CASCADE IS THREE KINDS NOW – one answer, three rows, and the bench line says so', () => {
    // ⚠ THE ONE PLACE THREE KINDS DRAIN IN ONE CALL, and it is a real engine path rather than a
    // hand-built queue: answering a `stop` fork raises the coach (v74 T17) and, with a working seat,
    // the psychologist (v76 T8).
    const world = withSeat(atTheStopFork())
    const tally = drainLifeBeatsTallied(world)
    expect(tally.cleared, 'her row, the coach\'s and the seat\'s').toBe(3)
    expect(tally.byKind['fork-opinion'], 'one fork').toBe(1)
    expect(tally.byKind['fork-counsel'], 'one coach').toBe(1)
    expect(tally.byKind['fork-psy'], 'and one psychologist').toBe(1)
    expect(tally.bondSkew, '⚠ and a walk that never asked the player put nothing on the scale').toBe(0)
    expect(tally.bondMoved, 'predicted and measured agree – no clamp in the middle').toBe(tally.bondSkew)
    expect(drainSkewLine(tally.byKind), 'the bench line names all three and totals them').toBe(
      'drained 3: fork-opinion 1 x 0 · fork-counsel 1 x 0 · fork-psy 1 x 0  = bond skew 0',
    )
    // ⚠ THE CONTROL: with no seat the same walk clears TWO, which is the shipped line unchanged.
    const seatless = drainLifeBeatsTallied(atTheStopFork())
    expect(seatless.cleared, 'and a career with no seat drains exactly what it always did').toBe(2)
    expect(seatless.byKind['fork-psy'], 'with no row of his kind in it').toBe(0)
  })

  it('⚠ the registry is TOTAL over the engine\'s own kinds, and `fork-psy` blocks', () => {
    expect(Object.keys(DRAIN_ANSWER).sort(), 'one drain answer per declared kind').toEqual(
      Object.keys(LIFE_BEAT_OPTIONS).sort(),
    )
    expect(LIFE_BEAT_BLOCKING['fork-psy'], '⚠⚠ TRUE is the whole mechanism – `answerFork` waits on blocking rows').toBe(true)
    expect(lifeBeatListenFollowUp('fork-psy', 'plain:own', 'deep', 'close'), 'and no listening detour').toBeNull()
  })
})

// =================================================================================================
// D. ZERO NEW PLUMBING – §0.5's promise, as a NEGATIVE claim with its target proved first
// =================================================================================================

describe('wave 5 T8 D – nothing about the queue or the fork changed shape to take him', () => {
  it('⭐⭐⭐ `answerFork` took no change: it still waits on `pendingLifeBeat` and names no seat', () => {
    // ⚠⚠ THE TARGET IS PROVED TO EXIST FIRST. `worldFunction` THROWS on an absent name, and the
    // positive assertions below are what stop this being a negative claim about an empty string –
    // the failure mode CLAUDE.md's marker-helper rule exists for.
    const fork = worldFunction('answerFork')
    expect(fork.length, 'the function was really found').toBeGreaterThan(200)
    expect(fork, '⭐ and the gate it has had since v73 is the gate it still has').toContain('pendingLifeBeat(world) !== null')
    const code = codeOf(fork)
    for (const symbol of ['psychologist', 'fork-psy', 'PsyFocus', 'spiritShock']) {
      expect(code, `⚠ answerFork knows nothing about «${symbol}»`).not.toContain(symbol)
    }
  })

  it('⭐⭐ the whole of the raise is ONE call site in the engine, and the queue predicate is untouched', () => {
    const source = codeOf(worldSource())
    // The positive control first: the sweep really finds the raise it is about to count.
    const raises = [...source.matchAll(/raiseLifeBeat\(\s*world,\s*'fork-psy'/g)]
    expect(raises.length, '⭐⭐⭐ ONE `raiseLifeBeat` at the reserved slot, and nowhere else').toBe(1)
    // ...and it sits inside `answerLifeBeat`, beside the coach's, which is where the reserved comment
    // put it. ⚠ Asserted by containment in that function's own source rather than by a line number,
    // which has already moved once this wave.
    const answer = worldFunction('answerLifeBeat')
    expect(answer, 'the raise is inside `answerLifeBeat`').toContain("raiseLifeBeat(world, 'fork-psy'")
    expect(answer, '⚠ and one line after the coach\'s, so the queue answers them in that order')
      .toContain("raiseLifeBeat(world, 'fork-counsel', counselDriver)")
    // ⚠⚠ `at()` AND NOT `indexOf`, WHICH IS THE ORDERING FAMILY `scripts/pin-ratchet.mjs`' OWN
    // HEADER NAMES AS UNRATCHETABLE AND STILL WRONG: `expect(a.indexOf(X)).toBeLessThan(a.indexOf(Y))`
    // PASSES when X is absent, because −1 is less than everything. The helper THROWS on an absent
    // marker, which is the whole difference between this pin and one that cannot fail.
    expect(at(answer, "'fork-counsel', counselDriver"), 'the coach is raised first, in the source too')
      .toBeLessThan(at(answer, "'fork-psy'"))

    const pending = worldFunction('pendingLifeBeat')
    expect(pending.length, 'the predicate was really found').toBeGreaterThan(80)
    expect(pending, '⚠⚠ and it is still the one-line registry read it has been since v74 T15')
      .toContain('LIFE_BEAT_BLOCKING[row.kind]')
    expect(codeOf(pending), 'with no kind named in it at all').not.toContain('fork-psy')
  })
})

// =================================================================================================
// E. THE SURFACES HE REACHES – the `'life'` row law, and the glyph totality gate
// =================================================================================================

describe('wave 5 T8 E – one `info` row, no life row, no glyph forced', () => {
  it('⭐⭐⭐ answering him writes ONE `info` row, with no `lifeKind` and no `amountCents`', () => {
    // ⚠ MEASURED RATHER THAN ASSUMED (the brief's own ⚠). `'fork-counsel'`'s answer row is an
    // `'info'` row carrying no `lifeKind` – `tests/wave4-life-row-stamp.test.ts` §A pins it – and
    // mirroring that is not a choice this kind makes: every kind's answer line goes through the ONE
    // `addEvent` at the foot of `answerLifeBeat`.
    const world = withSeat(atTheStopFork())
    expect(psyRowAfterAnswering(world)?.kind, 'the card is up').toBe('fork-psy')
    const before = world.events.length
    answerLifeBeat(world, PSY_RULED[0].id)
    expect(world.events.length, 'answering really wrote a row').toBe(before + 1)
    const row = world.events[world.events.length - 1]
    expect(row.type, '⚠ an `info` row, as wave 2 left it').toBe('info')
    expect(row.lifeKind, '...so it carries no life kind, and evades no sweep by living elsewhere').toBeUndefined()
    expect(row.amountCents, '⚠⚠ and it is never a purchase – rule 4').toBeUndefined()
    expect(row.text, 'and the line is his').toContain('psychologist')
  })

  it('⚠⚠ the glyph totality gate is NOT tripped by the new kind, and 🤍 carries it', () => {
    // MEASURED: `LIFE_BEAT_ROW_KINDS` is the narrow roster of kinds that reach a `'life'` feed row,
    // and `LifeBeatGlyphs` is a `Partial` over THAT roster – so a kind added to `LifeBeatKind` forces
    // no pick, and one added to the ROSTER without a pick still forces none. What the compile gate
    // does still refuse is a PICK for a kind that writes no life row: `'fork-psy': '…'` inside
    // `KIND_PICKS` fails `vue-tsc` (COMPILE ARM C in the ledger above).
    expect(LIFE_BEAT_ROW_KINDS as readonly string[], '⚠ he writes no `life` row, so he is not markable')
      .not.toContain('fork-psy')
    // ⭐ RE-AIMED 18.09 BY v83 (wave 7 – T10): the roster grew by `'own-key'` – `deliverOwnKey`
    // writes one kept, STAMPED `'life'` row per career – and the claim this case makes about the
    // psychologist is untouched: he still writes none and is still not markable. No pick was made
    // for the new kind either (§5a), so the 🤍 fallback case below covers it the same way.
    expect([...LIFE_BEAT_ROW_KINDS], 'and the roster is the row-writing kinds, exactly').toEqual(['met', 'ended', 'own-key'])
    expect(lifeRowGlyph('fork-psy'), '⭐ and an unpicked kind is not unmarked – it wears the owner\'s own heart')
      .toBe(LIFE_ROW_EMOJI.life)
    // ⚠ THE GLYPH PICK IS A QUESTION FOR THE OWNER EITHER WAY (who-she-is §5a: «no agent adds or
    // swaps one unasked»), and 🤍 stands until his word. This line is the record of what it is today.
    expect(LIFE_ROW_EMOJI.life, 'his 11.09 pick, read out of `PICKS` rather than copied').toBe('🤍')
  })

  it('⚠ no new `type: \'life\'` write site anywhere in the engine', () => {
    // The floor-plus-count shape wave 4's §A ratcheted: a sweep that found nothing would pass forever.
    //
    // ⚠⚠ RE-AIMED 14.09: FIRST by wave 6's T6 (four life-row sites, the leak row left unstamped),
    // THEN by the owner's D3 the same day. D3 answered the question T6 left open – «whether the
    // spotlight deserves a mark of its own» – with his 📸, so the leak row (`LEAK_EVENT`) and the
    // exposure row both carry `lifeKind: 'exposure'`, a ROW kind that is deliberately NOT a member of
    // `LifeBeatKind` (wave 6's §8 forbids that), declared on `WorldEvent.lifeKind`'s widened type.
    // So the property flipped from «exactly one licensed-unstamped row» to the STRONGER «every
    // `type:'life'` site now stamps a kind» – the guard tightened, not loosened.
    // ⚠ A NEW unstamped site still reddens here (the length stays pinned), which is the ratchet.
    // ⭐ RE-AIMED 18.09 BY v83 (wave 7 – T10), THE RATCHET DOING ITS JOB: the count moved 4 → 5
    // because `deliverOwnKey` writes the wave's ONE new `type: 'life'` row – kept, stamped
    // `lifeKind: 'own-key'` – and both halves of the pin move together, so «every site stamps a
    // kind» stays the total claim it became at D3. An UNSTAMPED site still reddens the second
    // assertion alone, which is the ratchet's whole point.
    const code = codeOf(worldSource())
    const sites = [...code.matchAll(/\{[^{}]*type:\s*'life'[^{}]*\}/g)].map((m) => m[0])
    expect(sites.length, 'the sweep really found the life-row write sites').toBe(5)
    const spotlight = sites.filter((s) => s.includes('LEAK_EVENT['))
    expect(spotlight, '⚠ the leak row is still one of them – D3 stamped it, it did not remove it').toHaveLength(1)
    expect(sites.filter((s) => /lifeKind:\s*'/.test(s)), '⚠⚠ and after D3 every one of them stamps a kind')
      .toHaveLength(5)
  })
})

// =================================================================================================
// F. THE DRAFTS – total, distinct, legal, and carrying no read of hers
// =================================================================================================

describe('wave 5 T8 F – the new pool obeys exactly what the shipped ones obey', () => {
  const REGISTERS = ['plain', 'breakup'] as const
  const cells = REGISTERS.flatMap((r) => FORK_STOP_DRIVERS.map((d) => lifeBeatSaid('fork-psy', `${r}:${d}`, 'deep', 'low', 'cold')))

  it('⭐⭐ six cells, six reads – his register x the coach\'s driver, and not one repeats another', () => {
    expect(cells.length, 'two registers by three drivers').toBe(6)
    expect(new Set(cells).size, 'and every cell is its own sentence').toBe(6)
    // ⚠⚠ AND HE IS NOT INDEXED BY HER VOICE, BY THE BOND BAND OR BY THE MOOD REGISTER – the
    // supporting-cast rule (who-she-is §5c) as a property rather than as a comment, `COACH_COUNSEL`'s
    // own sweep one pool over.
    for (const voice of TEMPERAMENTS) {
      for (const band of ['close', 'steady', 'strained', 'cold'] as const) {
        for (const register of ['bright', 'level', 'low'] as const) {
          expect(lifeBeatSaid('fork-psy', 'plain:worn', voice, register, band), `${voice}/${band}/${register}`).toBe(cells[0])
          expect(lifeBeatHeading('fork-psy', register, band), 'one frame, keyed on nothing').toBe(
            lifeBeatHeading('fork-psy', 'bright', 'close'),
          )
        }
      }
    }
  })

  it('⚠ PRESENCE IS A NULL HERE, AND THE NULL IS MEASURED – no pool of HERS ships in T8', () => {
    // Wave-4 §0.3: every new pool of HER voice carries roof+away frames from day one. This pool is
    // not hers – it is the parent's narration of a professional's phone call, `COACH_COUNSEL`'s own
    // shape – so there is no scene she is standing in and no presence axis to carry. Stated as a
    // property so it cannot quietly become false: the line does not move with the life stage.
    const stages: readonly DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']
    for (const stage of stages) {
      expect(lifeBeatSaid('fork-psy', 'breakup:own', 'sunny', 'level', 'close', 'open', stage), `stage ${stage}`)
        .toBe(lifeBeatSaid('fork-psy', 'breakup:own', 'sunny', 'level', 'close', 'open', 'school'))
    }
  })

  it('⚠ one quoted span, short dash only, no Cyrillic, no number and no price, in every new line', () => {
    const world = withSeat(atTheStopFork())
    expect(psyRowAfterAnswering(world)?.kind, 'the feed lines are reached through a real card').toBe('fork-psy')
    const feed: string[] = []
    for (const option of PSY_RULED) {
      const arm = withSeat(atTheStopFork())
      psyRowAfterAnswering(arm)
      answerLifeBeat(arm, option.id)
      feed.push(arm.events[arm.events.length - 1].text)
    }
    const lines = [
      ...cells,
      lifeBeatHeading('fork-psy', 'level', 'close'),
      ...LIFE_BEAT_OPTIONS['fork-psy'].map((o) => o.label),
      ...feed,
    ]
    expect(lines.length, 'the sweep has lines to sweep').toBe(6 + 1 + 2 + 2)
    expect(new Set(lines).size, 'and not one of them is a duplicate of another').toBe(lines.length)
    for (const line of lines) {
      expect((line.match(/"[^"]*"/g) ?? []).length, `at most one quoted span: ${line}`).toBeLessThanOrEqual(1)
      expect(line, `no em-dash: ${line}`).not.toMatch(/—/)
      expect(line, `no Cyrillic: ${line}`).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, `no price: ${line}`).not.toMatch(/[$£€]|\d/)
      // ⚠ R15-7's own rule, applied at the pool rather than waiting for the corpus sweep: the sim
      // holds no gender for a member of staff. `tests/coach-voice.test.ts` is the net; this is the
      // line that names the rule beside the drafts it binds.
      expect(line, `no guessed pronoun: ${line}`).not.toMatch(/\b(he|his|him|himself)\b/i)
    }
  })

  it('⚠⚠ and no cell names the thing that landed – a told-LATE ending is a fact the parent may not hold', () => {
    // The two-tier honesty law, at its hardest point in this pool. `spiritShock` is set by `rollEnds`
    // whether or not the parent was ever told there was anybody, so the shock column can be live on a
    // career where «a break-up» is news the game has not broken. It says what can be seen and stops.
    for (const cell of cells) {
      for (const word of ['break', 'partner', 'boyfriend', 'relationship', 'left her', 'ended']) {
        expect(cell.toLowerCase(), `⚠ «${word}» is a fact this card may not assert: ${cell}`).not.toContain(word)
      }
    }
  })
})

// =================================================================================================
// G. HE CARRIES NO READ – no `heard` stamp, and the answer draws nothing at all
// =================================================================================================

describe('wave 5 T8 G – the listen coin is for read-bearing beats, and this is not one', () => {
  it('⭐⭐⭐ the row takes no `heard` key under ANY focus, `listen` included', () => {
    for (const focus of [null, ...PSY_FOCUSES]) {
      const world = withSeat(atTheStopFork(), focus)
      const row = psyRowAfterAnswering(world)!
      expect(row.kind, `focus ${focus ?? 'none'}: the card is up`).toBe('fork-psy')
      expect('heard' in row, `⚠ focus ${focus ?? 'none'}: the key is ABSENT, not false`).toBe(false)
    }
  })

  it('⭐⭐⭐ THE COUNT-KEYS NET: answering the fork\'s three cards reaches no `psy:listen` key', () => {
    // ⚠⚠ THE POSITIVE CONTROL FIRST, or this is a net that cannot fail: the recorder really does see
    // a listen key when one is drawn. `deliverKnownPartner` raises a read-bearing `'met'` row with
    // the focus on, which is the path T6 built.
    const control = withSeat(createWorld('t8-listen-control', DEFAULT_PROFILE), 'listen')
    control.season = []
    control.week = 900
    control.loveEpisodes = [{ id: 'p:880', sinceWeek: 880, endedWeek: null, knownWeek: 890, wants: 'open', partnerId: 'p:880', publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: null }]
    rngKeys.length = 0
    deliverKnownPartner(control)
    expect(rngKeys.filter((k) => k.includes(':psy:listen:')).length, '⚠⚠ the recorder really sees a listen key').toBe(1)

    // ...and now the subject. The whole arc, all three cards, with the seat on the `listen` year.
    const world = withSeat(atTheStopFork(), 'listen')
    rngKeys.length = 0
    answerLifeBeat(world, 'back')
    answerLifeBeat(world, DRAIN_ANSWER['fork-counsel'])
    expect(pendingLifeBeat(world)!.kind, 'the fixture really reached his card').toBe('fork-psy')
    answerLifeBeat(world, PSY_RULED[0].id)
    expect(rngKeys.filter((k) => k.includes(':psy:listen:')), '⚠⚠ not one listen key, on the listen year itself').toEqual([])
    expect(rngKeys, '⚠ and the whole arc draws NOTHING on any stream – a raise is not a hazard').toEqual([])
  })

  it('⚠ a hand-raised row with a detail his card cannot read is refused, not worded by a fallback', () => {
    // The completeness law's own shape: no silent fallback onto another cell. `raiseLifeBeat` takes
    // the detail rather than computing it, so this is the guard that stops a bad one rendering.
    for (const bad of ['own', 'plain', 'plain:nonsense', 'nonsense:own', '']) {
      const world = createWorld(`t8-bad-${bad}`, DEFAULT_PROFILE)
      world.season = []
      raiseLifeBeat(world, 'fork-psy' as LifeBeatKind, bad)
      expect(() => buildLifeBeatPrompt(world), `«${bad}» is refused`).toThrow(/fork-psy row carries no register and driver/)
    }
  })
})
