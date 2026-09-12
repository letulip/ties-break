// =================================================================================================
// WAVE 3, T6 – THE DELIVERY: THE WEEK THE PARENT IS TOLD THERE IS SOMEONE
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T6. The arrival (T3/T5) wrote a fact about HER and
// told nobody; this is the other end of the lag – a kept feed row, a `'met'` beat, and the bond band
// deciding the REGISTER of both and never their existence (the architect's 11.09 resolution).
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts SHAPES and never wording: every sentence it reaches is a
// DRAFT for the owner (CLAUDE.md invariant 4), so what is pinned is «her voice is present at close»,
// «no voice of hers at strained», «no price in any word», «four voices, four lines» – never a string.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back. The count is what the
// mutation actually reddened, because a mutation that reddens the WRONG case is as much a finding as
// one that reddens nothing.
// =================================================================================================
//
//   ARM 1   the once-ness dedupe deleted from `deliverKnownPartner`
//           (`if (lifeLogOf(world).some(...)) return` removed)
//           1 RED · §A «⭐⭐ exactly once per episode, over twenty weeks of asking: expected 21 to
//           be 1»
//
//   ARM 1b  ⚠⚠ THE ANTI-VACUITY ARM, AND IT IS THE REASON §A's SECOND CASE IS LONGER THAN ITS CLAIM.
//           «Fires exactly once» is the shape that holds BY CONSTRUCTION on a beat that never fires,
//           so ARM 1 alone cannot tell a working dedupe from a dead function. The opposite mutation:
//           `deliverKnownPartner`'s body short-circuited to `return`.
//           10 RED, across §A, §B and §C – including «⭐⭐ exactly once per episode, over twenty
//           weeks of asking: expected +0 to be 1» (the SAME assertion, from the other side) and §A's
//           «and the same week with the row open delivers: expected +0 to be 1».
//
//   ARM 2   `knownPartner`'s comparison relaxed by a week (`open.knownWeek <= week + 1`)
//           2 RED · §A «⭐⭐ nothing at all before the week he is owed it: expected 1 to be +0» and
//           §E «the lag is still running: expected { id: 'p:890', sinceWeek: 890, …(4) } to be null»
//
//   ARM 3   the feed row deleted from `deliverKnownPartner` (the `addEvent` call gated off)
//           4 RED · §A «one kept feed row on the beat's own tick: expected +0 to be 1», «and one
//           feed row, not twenty-one», «the delivery wrote a row at all: expected undefined not to
//           be undefined» and §B «close: and the feed row with it»
//
//   ARM 4   `metRegisterOf` returns `'her'` for every band
//           3 RED · §B «strained: not one word of hers on the card: expected 'She brought it up over
//           dinner, before…' not to contain '\"'», «a mention quotes nobody» and «a frame per rung:
//           expected 1 to be 3»
//
//   ARM 5   `MET_DRY` given `MET_MENTION`'s string – the two quiet rungs collapsed into one
//           1 RED · §B «⚠ a home that was TOLD and a home that FOUND OUT do not read the same»
//
//   ARM 6   `'life'` moved ABOVE `'birthday'` in `STOP_PRECEDENCE`
//           1 RED · §D «the cake is asked first: expected 1 to be less than 0»
//
//   ARM 6b  and the SAME reordering in `blockingOverlay` (the `'life'` clause hoisted over the
//           birthday's), because the two orders are independent code and the engine's list does not
//           make the shell obey it
//           1 RED · §D «the birthday's card is the one on screen: expected 'life' to be 'birthday'»
//           ⚠ ARM 6 left this assertion GREEN and ARM 6b left ARM 6's GREEN, which is exactly why
//           §D asserts both and why they are two arms.
//
//   ARM 7   `answerLifeBeat` reads the whole table instead of the row's own kind
//           (`Object.values(LIFE_BEAT_OPTIONS).flat().find(...)`)
//           1 RED · §C «⚠ the fork's own answers are refused on a 'met' row: expected [Function] to
//           throw an error» – the arm that says the per-kind record is load-bearing, not tidy
//
//   ARM 8   the `if (kind === 'met') return null` guard deleted from `lifeBeatListenFollowUp`
//           6 RED · §B, §C and §D, all of them «A fork-opinion row carries no want: p:890» – the
//           `'met'` detail being an episode id is what makes the fork's path throw on sight
//
//   ARM 9   `deliverKnownPartner` writing `amountCents: -1` on the feed row
//           1 RED · §A «⚠⚠ a life beat is never a purchase: expected -1 to be undefined»
//
//   ARM W2  ⚠⚠ AND THE RE-AIM'S OWN ARM, because a re-aimed guard that stopped biting would be a
//           deletion wearing a diff. `LIFE_BEAT_OPTIONS` became a `Record<LifeBeatKind, …>` and
//           `tests/wave2-life-beat.test.ts` now reads `FORK_OPTIONS`; wave 2's own ARM 1
//           (`beatBacked` 2 -> 2.5) was re-run against the re-aimed file.
//           4 RED in that file · «back / press / listen, as ruled: expected [ 2.5, -2, +0 ] to
//           deeply equal [ 2, -2, +0 ]» and three more. The pin still bites exactly as it did.
import { describe, expect, it } from 'vitest'
import {
  activeEpisode,
  advanceWeeks,
  answerLifeBeat,
  buildLifeBeatPrompt,
  chooseGift,
  createWorld,
  deliverKnownPartner,
  kidAgeExact,
  knownPartner,
  lifeBeatHeading,
  lifeBeatListenFollowUp,
  lifeBeatSaid,
  lifeLogOf,
  pendingBirthday,
  pendingLifeBeat,
  toSnapshot,
  birthdayTurning,
  LIFE_BEAT_OPTIONS,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf } from '../src/engine/spirit'
import { blockingOverlay } from '../src/composables/blockingOverlay'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type BondBand, type LoveEpisode, type WorldEvent } from '../src/shared/protocol'

const MET_OPTIONS = LIFE_BEAT_OPTIONS.met

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The lowest `bond` that still reads as this band, found by ASKING THE LADDER rather than by
 *  re-deriving its cut points – `bondBandOf` is the one reader of them, exactly as wave 2's heading
 *  sweep asks `spiritBandOf` for its own. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** A career parked at `week` with an empty life. ⚠ A REAL `createWorld`, so the profile, the seed and
 *  the temperament are the engine's own (wave3-arrival.test.ts's own fixture doctrine). */
function careerAt(seed: string, week: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.week = week
  return world
}

/** An attachment, hand-built. ⚠ POKED RATHER THAN ROLLED, and that is the point of the whole file:
 *  T3's hazard decides WHETHER someone appears and T5's draws decide WHEN he hears – neither is under
 *  test here, and a fixture that had to roll for them would be testing the dice again. */
function episode(sinceWeek: number, knownWeek: number | null, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek, wants: 'open', partnerId: `p:${sinceWeek}`, ...over }
}

/** A career standing one week short of the news, with the whole machine real except the row. */
function aboutToBeTold(seed: string, knownWeek: number, bond?: BondBand): WorldState {
  const world = careerAt(seed, knownWeek - 1)
  world.loveEpisodes = [episode(knownWeek - 10, knownWeek)]
  if (bond !== undefined) world.bond = bondFor(bond)
  return world
}

const lifeRows = (world: WorldState): WorldEvent[] => world.events.filter((e) => e.type === 'life')
const metRows = (world: WorldState) => lifeLogOf(world).filter((r) => r.kind === 'met')

/** Walk the delivery over a span of weeks WITHOUT the rest of the tick – the same span a career would
 *  live, and nothing else moving, so what the count below measures is this function alone. */
function walkDelivery(world: WorldState, from: number, to: number): void {
  for (let w = from; w <= to; w++) {
    world.week = w
    deliverKnownPartner(world)
  }
}

// =================================================================================================
// A. THE DELIVERY – ON `knownWeek`, ON THE SAME TICK, AND EXACTLY ONCE
// =================================================================================================
describe('wave 3 T6 A – the week he is told', () => {
  it('⭐⭐ the feed row and the beat land on the SAME TICK, and that tick is `knownWeek`', () => {
    const known = 900
    const world = careerAt('t6-same-tick', known - 20)
    world.loveEpisodes = [episode(known - 12, known)]

    // ⚠ THE NEGATIVE HALF FIRST, AND IT IS PAIRED WITH ITS OWN CONTROL two lines down: a «nothing
    // happens» assertion is worthless unless the same case proves the machinery could have fired.
    walkDelivery(world, known - 20, known - 1)
    expect(lifeRows(world).length, '⭐⭐ nothing at all before the week he is owed it').toBe(0)
    expect(metRows(world).length, 'and no beat either').toBe(0)
    expect(knownPartner(world, known - 1), 'the selector agrees: he has not been told').toBeNull()

    world.week = known
    deliverKnownPartner(world)
    const feed = lifeRows(world)
    const beats = metRows(world)
    expect(feed.length, 'one kept feed row on the beat\'s own tick').toBe(1)
    expect(beats.length, 'and one beat').toBe(1)
    expect(feed[0].week, 'the row is dated the week he was told').toBe(known)
    expect(beats[0].week, 'and so is the beat – the SAME tick, which is the claim').toBe(known)
    // ⚠ AND THE ROW IS KEPT. `pruneEvents` drops ordinary rows at sixty weeks and a career reads its
    // own life back seasons later – «a kept feed row» is the brief's own word.
    expect(feed[0].keep, 'the life row survives pruning').toBe(true)
    // The beat's detail is the EPISODE, machine-readable, never a rendered sentence.
    expect(beats[0].detail, 'the beat names the attachment it is about').toBe(activeEpisode(world)!.id)
    expect(beats[0].answer, 'and it is pending – the row IS the queue').toBeNull()
    expect(pendingLifeBeat(world), 'so the week is stopped').not.toBeNull()
  })

  it('⭐⭐ EXACTLY ONCE PER EPISODE – twenty more weeks of asking, and a second episode that proves the loop still fires', () => {
    const known = 900
    const world = careerAt('t6-once', known)
    world.loveEpisodes = [episode(known - 5, known)]

    walkDelivery(world, known, known + 20)
    expect(metRows(world).length, '⭐⭐ exactly once per episode, over twenty weeks of asking').toBe(1)
    expect(lifeRows(world).length, 'and one feed row, not twenty-one').toBe(1)

    // ⚠⚠ THE ANTI-VACUITY HALF, AND IT IS THE WHOLE REASON THIS CASE IS LONGER THAN ITS CLAIM.
    // «Fires exactly once» is the property that holds by construction on a beat that never fires at
    // all, so the count above cannot distinguish a working dedupe from a dead function. A SECOND
    // attachment, appended after the first has ended, has to get its own row out of the same loop.
    world.loveEpisodes = [
      { ...world.loveEpisodes[0], endedWeek: known + 21 },
      episode(known + 30, known + 32),
    ]
    walkDelivery(world, known + 22, known + 40)
    expect(metRows(world).length, 'and the SECOND episode gets its own row').toBe(2)
    expect(metRows(world)[1].detail, 'about the second attachment, not the first').toBe('p:930')
  })

  it('⚠⚠ A LIFE BEAT IS NEVER A PURCHASE – no `amountCents`, no price in any word, nothing in the ledger', () => {
    const world = aboutToBeTold('t6-no-cents', 900)
    const fundsBefore = world.fundsCents
    const ledgerBefore = world.financeWeeks.length
    world.week = 900
    deliverKnownPartner(world)
    const row = lifeRows(world)[0]
    expect(row, 'the delivery wrote a row at all').not.toBeUndefined()
    expect(row.amountCents, '⚠⚠ a life beat is never a purchase').toBeUndefined()
    expect(world.fundsCents, 'the wallet is untouched').toBe(fundsBefore)
    expect(world.financeWeeks.length, 'and nothing folded into the finance ledger').toBe(ledgerBefore)
    // ...and no price in the WORDS either, which is the half a missing field cannot guarantee.
    expect(row.text, row.text).not.toMatch(/\$|\d/)
  })

  it('⚠ an attachment that ended before its `knownWeek` tells him nothing here – wave 4 owns that late row', () => {
    const world = careerAt('t6-ended-first', 900)
    world.loveEpisodes = [episode(880, 900, { endedWeek: 895 })]
    expect(activeEpisode(world), 'the fixture really is an ended row').toBeNull()
    deliverKnownPartner(world)
    expect(metRows(world).length, 'nobody is there, so nothing says there is').toBe(0)
    // The control: the identical week with the row still open DOES deliver, so the line above is
    // about the ending and not about the fixture being unreachable.
    const open = careerAt('t6-ended-first', 900)
    open.loveEpisodes = [episode(880, 900)]
    deliverKnownPartner(open)
    expect(metRows(open).length, 'and the same week with the row open delivers').toBe(1)
  })

  it('⚠ a `knownWeek` that has not been reached is silence, and a null one is silence for ever', () => {
    const late = careerAt('t6-not-yet', 900)
    late.loveEpisodes = [episode(890, 950)]
    deliverKnownPartner(late)
    expect(metRows(late).length, 'the lag is still running').toBe(0)

    const never = careerAt('t6-never', 900)
    never.loveEpisodes = [episode(890, null)]
    deliverKnownPartner(never)
    expect(metRows(never).length, 'and a null `knownWeek` is «he has not been told», not «tell him now»').toBe(0)
  })
})

// =================================================================================================
// B. THE REGISTER SPLIT – ⭐⭐ THE BAND PICKS HOW THE NEWS SOUNDS AND NEVER WHETHER IT ARRIVES
// =================================================================================================
describe('wave 3 T6 B – the bond band decides the register, never the existence', () => {
  it('⭐⭐⭐ THE BEAT FIRES AT EVERY BAND – which is the ruling this wave was given', () => {
    for (const band of ['close', 'steady', 'strained', 'cold'] as BondBand[]) {
      const world = aboutToBeTold(`t6-fires-${band}`, 900, band)
      world.week = 900
      deliverKnownPartner(world)
      expect(metRows(world).length, `${band}: the beat fires`).toBe(1)
      expect(lifeRows(world).length, `${band}: and the feed row with it`).toBe(1)
      expect(buildLifeBeatPrompt(world), `${band}: and there is a card to answer it on`).not.toBeNull()
    }
  })

  it('⭐⭐ AT `close` THE NEWS ARRIVES IN HER OWN VOICE, and the four voices are four different lines', () => {
    const spoken = TEMPERAMENTS.map((voice) => lifeBeatSaid('met', 'p:1', voice, 'level', 'close'))
    for (const [i, line] of spoken.entries()) {
      // ⚠ THE POSITIVE CLAIM COMES FIRST AND IS WHAT MAKES §B's NEGATIVES MEAN ANYTHING. «The
      // strained card carries no line of hers» is worthless unless the same file proves the close
      // card carries one.
      expect(line, `${TEMPERAMENTS[i]}: she speaks`).toContain('"')
      expect((line.match(/"[^"]*"/g) ?? []).length, `${TEMPERAMENTS[i]}: at most one quoted span`).toBe(1)
      expect(line.replace(/"[^"]*"/g, ' '), `${TEMPERAMENTS[i]}: the narration names her`).toMatch(/\bshe\b/i)
    }
    expect(new Set(spoken).size, 'four voices, four lines – no silent fallback between them').toBe(TEMPERAMENTS.length)
  })

  it('⭐⭐ AT `strained` AND `cold` THERE IS NO LINE OF HERS AT ALL – one dry card, whoever she is', () => {
    for (const band of ['strained', 'cold'] as BondBand[]) {
      const said = TEMPERAMENTS.map((voice) => lifeBeatSaid('met', 'p:1', voice, 'level', band))
      for (const line of said) expect(line, `${band}: not one word of hers on the card`).not.toContain('"')
      expect(new Set(said).size, `${band}: one card, not four`).toBe(1)
    }
  })

  it('⭐ AT `steady` IT IS A MENTION – no voice of hers, and not the dry card either', () => {
    const mention = TEMPERAMENTS.map((voice) => lifeBeatSaid('met', 'p:1', voice, 'level', 'steady'))
    for (const line of mention) expect(line, 'a mention quotes nobody').not.toContain('"')
    expect(new Set(mention).size, 'one mention, not four').toBe(1)
    // ⚠ A HOME THAT WAS TOLD AND A HOME THAT FOUND OUT DO NOT READ THE SAME. Without this the three
    // rungs could collapse into two and every assertion above would still pass.
    expect(mention[0], '⚠ a home that was TOLD and a home that FOUND OUT do not read the same').not.toBe(
      lifeBeatSaid('met', 'p:1', 'sunny', 'level', 'strained'),
    )
    expect(mention[0], 'and neither of them is her own voice').not.toBe(lifeBeatSaid('met', 'p:1', 'sunny', 'level', 'close'))
  })

  it('⚠ the heading moves with the band too, and the three are three', () => {
    const headings = (['close', 'steady', 'strained'] as BondBand[]).map((b) => lifeBeatHeading('met', 'level', b))
    expect(new Set(headings).size, 'a frame per rung').toBe(3)
    expect(lifeBeatHeading('met', 'level', 'cold'), 'cold reads the dry frame with strained').toBe(headings[2])
    // ⚠ AND THE SPIRIT REGISTER MOVES NOTHING HERE, which is the reading: this card is about the
    // distance between them, not about how her week went.
    for (const register of ['bright', 'level', 'low'] as const) {
      expect(lifeBeatHeading('met', register, 'close'), `${register}: the Mood ladder is not this card's axis`).toBe(headings[0])
    }
  })

  it('⚠ every word the `met` beat can print: short dash only, no Cyrillic, no number, no price', () => {
    const everyWord = [
      ...TEMPERAMENTS.flatMap((v) => (['close', 'steady', 'strained', 'cold'] as BondBand[]).map((b) => lifeBeatSaid('met', 'p:1', v, 'level', b))),
      ...(['close', 'steady', 'strained', 'cold'] as BondBand[]).map((b) => lifeBeatHeading('met', 'level', b)),
      ...MET_OPTIONS.map((o) => o.label),
    ]
    for (const t of everyWord) {
      expect(t, t).not.toContain('—')
      expect(t, t).not.toMatch(/[Ѐ-ӿ]/)
      expect(t, t).not.toMatch(/\d|\$/)
    }
  })
})

// =================================================================================================
// C. THE ANSWER SET – ⭐⭐ PER KIND, AND THE FORK'S THREE ARE NOT OFFERED HERE
// =================================================================================================
describe('wave 3 T6 C – a `met` answer set is not a fork-opinion answer set', () => {
  it('⭐⭐ the card offers the `met` four and none of the fork\'s three', () => {
    const world = aboutToBeTold('t6-options', 900, 'close')
    world.week = 900
    deliverKnownPartner(world)
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.kind, 'the card knows which beat it is').toBe('met')
    expect(prompt.options.map((o) => o.id), 'the four reactions, in the engine\'s order').toEqual(MET_OPTIONS.map((o) => o.id))
    for (const forkId of LIFE_BEAT_OPTIONS['fork-opinion'].map((o) => o.id)) {
      expect(prompt.options.some((o) => o.id === forkId), `${forkId} belongs to the other beat`).toBe(false)
    }
    expect(new Set(prompt.options.map((o) => o.label)).size, 'four different sentences').toBe(4)
  })

  it('⚠⚠ no listen detour on a `met` card – its options are reactions, not «say nothing and let her talk»', () => {
    const world = aboutToBeTold('t6-no-detour', 900, 'close')
    world.week = 900
    deliverKnownPartner(world)
    expect(buildLifeBeatPrompt(world)!.listenFollowUp, '⚠ no listen detour').toBeNull()
    expect(lifeBeatListenFollowUp('met', 'p:1', 'sunny', 'close'), 'and the assembler says so directly').toBeNull()
    // The control: the fork's own beat DOES carry one at the same band, so the null above is about
    // this kind and not about the band or a broken fixture.
    expect(lifeBeatListenFollowUp('fork-opinion', 'tour', 'sunny', 'close'), 'the fork still has hers').not.toBeNull()
  })

  it('⚠ the fork\'s own answers are refused on a `met` row, engine-side', () => {
    const world = aboutToBeTold('t6-stale', 900, 'close')
    world.week = 900
    deliverKnownPartner(world)
    expect(() => answerLifeBeat(world, 'back'), '⚠ the fork\'s own answers are refused on a \'met\' row').toThrow(/not one of the answers/)
    expect(pendingLifeBeat(world), 'and the row is still waiting').not.toBeNull()
  })

  it('⭐ each reaction is worth exactly its row, and moves nothing else', () => {
    for (const option of MET_OPTIONS) {
      const world = aboutToBeTold(`t6-answer-${option.id}`, 900, 'close')
      world.week = 900
      deliverKnownPartner(world)
      const before = { bond: world.bond, spirit: world.spirit, funds: world.fundsCents }
      answerLifeBeat(world, option.id)
      expect(world.bond - before.bond, `${option.id} is worth exactly its row`).toBe(option.bond)
      expect(world.spirit, `${option.id} moves no spirit`).toBe(before.spirit)
      expect(world.fundsCents, `${option.id} moves no money`).toBe(before.funds)
      expect(metRows(world)[0].answer, `${option.id} is recorded`).toBe(option.id)
      expect(pendingLifeBeat(world), 'and the queue is empty again').toBeNull()
    }
    // ⚠⚠ THE TABLE ITSELF AS LITERALS, which the loop above deliberately cannot do: it reads
    // `option.bond`, so it moves WITH a retune. These four are the brief §4's ruled row.
    expect(MET_OPTIONS.map((o) => o.bond), 'warm / wary / intrusive / silent, as ruled').toEqual([2, 0, -3, -1])
    expect(
      [ECONOMY.bond.delta.metWarm, ECONOMY.bond.delta.metWary, ECONOMY.bond.delta.metIntrusive, ECONOMY.bond.delta.metSilent],
      'and the constants they are wired from',
    ).toEqual([2, 0, -3, -1])
  })

  it('⚠ the `met` labels name no gender – the schema persists none, so no button may print one', () => {
    // ⚠ `LoveEpisode` carries no name and no gender ON PURPOSE («the schema must not hardwire
    // boyfriend -> husband»), so a label that said «him» would put on screen a fact the world does
    // not hold. The wave-3 brief's own draft of the intrusive label says «him»; this pin is why the
    // shipped draft does not, and the wording is the owner's to settle either way.
    for (const option of MET_OPTIONS) {
      expect(option.label, `${option.id} names no gender`).not.toMatch(/\b(him|his|her boyfriend|girlfriend|he|she)\b/i)
    }
  })
})

// =================================================================================================
// D. THE QUEUE – ⭐ THE CAKE IS ASKED FIRST, END TO END
// =================================================================================================
describe('wave 3 T6 D – a beat on a birthday week queues behind the birthday', () => {
  it('⭐⭐ both stops are reported, the birthday leads, and the queue empties in that order', () => {
    // A REAL career, a REAL birthday week, a REAL advance – the brief asks for this one end to end.
    const world = careerAt('t6-birthday', 0)
    const rng = resumeMain(world.rngMain)
    // The first birthday week she reaches at or past the age gate, found by asking the engine's own
    // clock rather than by arithmetic of this file's.
    let cake = 0
    for (let w = 1; w < 40 * 52; w++) {
      const age = birthdayTurning(w, world.profile.birthMonth, world.profile.birthDay)
      if (age !== null && kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= ECONOMY.life.ageGate) {
        cake = w
        break
      }
    }
    expect(cake, 'the fixture found a birthday week past the gate').toBeGreaterThan(0)

    world.week = cake - 1
    world.fundsCents = 500_000_00
    world.loveEpisodes = [episode(cake - 6, cake)]

    const stops = advanceWeeks(world, rng, 1)
    expect(world.week, 'exactly one week was lived').toBe(cake)
    expect(stops, 'the week is both things and reports both').toContain('birthday')
    expect(stops, 'the week is both things and reports both').toContain('life')
    expect(stops.indexOf('birthday'), 'the cake is asked first').toBeLessThan(stops.indexOf('life'))
    // ...and the ORDER is the engine's own list rather than this array's accident.
    expect(STOP_PRECEDENCE.indexOf('birthday'), 'STOP_PRECEDENCE is what decided it').toBeLessThan(
      STOP_PRECEDENCE.indexOf('life'),
    )

    // END TO END: the shell shows the birthday, and the beat only after it has been answered.
    expect(pendingBirthday(world), 'a birthday really is pending').not.toBeNull()
    expect(blockingOverlay(toSnapshot(world)), 'the birthday\'s card is the one on screen').toBe('birthday')
    chooseGift(world, toSnapshot(world).birthdayPrompt!.options[0].id)
    expect(blockingOverlay(toSnapshot(world)), 'and hers is next, not lost').toBe('life')
    answerLifeBeat(world, MET_OPTIONS[0].id)
    expect(blockingOverlay(toSnapshot(world)), 'and the queue empties').toBeNull()
  })
})

// =================================================================================================
// E. THE FACT – ⭐ `partnerKnown`, AND THE MINIMUM IT LICENSES
// =================================================================================================
describe('wave 3 T6 E – the one thing the diary may know', () => {
  it('⭐⭐ it turns true on `knownWeek` and not before, all the way out to the snapshot', () => {
    const world = careerAt('t6-fact', 899)
    world.loveEpisodes = [episode(890, 900)]
    expect(knownPartner(world, 899), 'the lag is still running').toBeNull()
    expect(toSnapshot(world).diary.facts.partnerKnown, 'so the diary knows nothing').toBe(false)
    // ⚠ AND THE ATTACHMENT IS ALREADY THERE WHILE THE FACT IS FALSE, which is the design: the parent
    // sees a lighter week before he is told why.
    expect(activeEpisode(world), 'somebody is there all the same').not.toBeNull()

    world.week = 900
    expect(knownPartner(world, 900), 'and on `knownWeek` he knows').not.toBeNull()
    expect(toSnapshot(world).diary.facts.partnerKnown, 'and so does the diary').toBe(true)
  })

  it('⚠ an ended attachment is not a known one, however long ago he was told', () => {
    const world = careerAt('t6-fact-ended', 950)
    world.loveEpisodes = [episode(890, 900, { endedWeek: 940 })]
    expect(knownPartner(world, 950), 'it is over, so nobody is there to know about').toBeNull()
    expect(toSnapshot(world).diary.facts.partnerKnown).toBe(false)
  })
})
