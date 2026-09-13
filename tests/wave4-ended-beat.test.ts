// =================================================================================================
// WAVE 4, T4 – THE `'ended'` BEAT, THE REACT OVERLAY, AND THE TOLD-LATE BRANCH
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T4 and `docs/plans/life-wave-4-rulings-2026-09.md`
// A, B, F and G. T2 wrote `endedWeek`, T3 wrote the mark; this is the conversation, and it is where
// the private life's two halves finally meet – the arrival's `'met'` receipt is what decides which of
// the ending's two registers the parent gets.
//
// ⚠⚠ THREE OF THE FOUR RULINGS THIS FILE PINS ARE **DEPARTURES FROM THE BRIEF'S LITERAL WORDS**, and
// the sections are named for them so that a later reader who disagrees knows exactly what to re-aim:
//
//   RULING A  told-late is «no `'met'` receipt», never `endedWeek < knownWeek`   – §B
//   RULING B  delivery SCANS the episode list; the tail read is gone            – §C
//   RULING G  the read is RE-DERIVED from `endedWeek`, never stored, and it
//             moves the PRICE as well as the wording                            – §E
//
// ⚠ THE STRINGS HERE ARE DRAFTS AND T6 OWNS THE MATRIX (CLAUDE.md invariant 4). §G asserts the
// STRUCTURE of the pools – every voice, both registers, both presences, the dry fallback, the read on
// the heading – and never a sentence's wording, except where a sentence is wave 3's and the claim is
// that T4 did not touch it.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ⚠ FIFTEEN MUTATIONS, RUN 12.09.2026, CONTROL GREEN FIRST (196 -> 198 passed as two nets were
//   added mid-run) AND EVERY ONE RE-EDITED BACK BY HAND – never `git checkout`. The counts are
//   MEASURED over the eight-file discriminating set (this file, wave3-reaction, wave3-delivery,
//   wave3-soft-surface, wave3-small-talk, wave4-ends, wave2-life-beat, wave3-presence).
//
//   ARM 1   ⚠⚠ RULING A REVERTED TO THE BRIEF'S LITERAL WORDS – `rollEnds` gates on
//           `knownWeek <= week` instead of the `'met'` receipt, AND `deliverKnownPartner`'s dedupe
//           narrowed back to `['met']`, which together are the code the brief describes.
//           **4 RED** · §B «⚠⚠ sunny: ONE honest late row, not two contradictory beats: expected
//           [ 'ended', 'ended' ] to deeply equal [ 'ended' ]», §B's once-only case, §C's scan case,
//           and tests/wave4-ends.test.ts §D.
//           ⚠⚠ AND THE MEASUREMENT CORRECTS THE RULING'S OWN PREDICTION, which is worth reading.
//           Ruling A says the literal rule raises «`'ended'` AND `'met'`». It raises `'ended'`
//           TWICE – because ruling B's told-late branch is in the same function, so the second row
//           comes out of the delivery's ENDED path rather than its `'met'` one. The ruling's verdict
//           is right and its arithmetic is one row off; the defect is the same defect.
//
//   ARM 1b  THE LITERAL RULE ALONE, with the two-kind dedupe kept (i.e. ruling A reverted but ruling
//           B's dedupe left in place – the shape somebody would actually reach for).
//           **3 RED** · §B «sunny: one feed row for one piece of news: expected [] to have a length
//           of 1 but got +0». ⚠ THE FAILURE MODE CHANGES SHAPE RATHER THAN GOING AWAY: the card is
//           raised by the hazard, the delivery then sees a receipt and skips, and the week's news
//           never reaches the album at all. Recorded because it is the version a later reader is
//           most likely to try.
//
//   ARM 2   ⚠⚠ RULING B REVERTED – `deliverKnownPartner` reads the TAIL (`knownPartner`'s shape:
//           last row, and only if still open) instead of scanning.
//           **14 RED**, the whole of §C plus §A's untold case, all four of §E, §F, §G's detour case
//           and both of §H. The told-late scene simply does not exist under the tail read.
//
//   ARM 3   the told-late path raises `'met'` as well as `'ended'`.
//           **13 RED**, including tests/wave3-delivery.test.ts's own guard («an attachment that ended
//           before its `knownWeek` tells him nothing here – wave 4 owns that late row»), which is the
//           cross-file catch worth having.
//
//   ARM 4   ⚠⚠ RULING G.1 – `beatEndsRead` keyed on `world.week` (the RAISE week) instead of
//           `episode.endedWeek`.
//           **1 RED** · §E «sunny: the matching answer is the one the ENDING's own week drew:
//           expected 'company' to be 'space'».
//
//   ARM 5   ⚠⚠ RULING G.2 – `answerLifeBeat` prices from the base table, i.e. the read is dropped at
//           CHARGE time while the card still shows it.
//           **1 RED** · §E «sunny: the match is charged +3, 260 weeks after the ending: expected -3
//           to be 3». That is the card and the charge disagreeing by six points.
//
//   ARM 6   `drawEndsRead` becomes a coin flip (`roll < 0.5`), dropping who-she-is §4's «Wants
//           weights» row.
//           **1 RED** · §E «sunny: her own register comes up about 70% of the time (50.5%)».
//
//   ARM 7   ⚠⚠ THE DRAIN ANSWER MADE READ-DEPENDENT – `ENDED_BOND_COMPANY` re-prices `fix-it`.
//           **10 RED across three files** · wave3-reaction §D (all four cases, including the
//           refusal), §D and both drain cases here, and BOTH of tests/wave2-life-beat.test.ts's
//           walked fixtures – which throw inside `walkToFork`, exactly the fifty-call-sites failure
//           mode T3b's commit predicted for a kind with no knowable price.
//
//   ARM 7b  ⚠⚠ THE ARM THAT SAYS THE WIDENED SWEEP IS LOAD-BEARING. ARM 7 kept, and `drainCostOf`'s
//           sweep narrowed back to `PARTNER_WANTS` alone (what T3b shipped, before T4 made it the
//           cross product with `ENDS_READS`).
//           **3 RED** – and `drainCostOf` STOPS REFUSING: the wave2 walks go green again and so does
//           «`drainCostOf` REFUSES a price that depends on how she is read». A genuinely
//           read-dependent drain answer walks straight through the guard, and only the LITERAL pins
//           notice. That is the whole argument for widening the product rather than leaving the
//           second axis at its default.
//
//   ARM 8   `LIFE_BEAT_BLOCKING['ended'] = false`.
//           **11 RED across three files** · §A's blocking case and its told-now case, §B, §E x3,
//           §G's detour case, both drain cases, and the two wave-3 registry pins.
//
//   ARM 9   §0.3 BROKEN – the ending reads its roof line at every stage (the away column dropped).
//           **1 RED** · §G «⚠⚠ sunny/told-now: an away frame of its own, not the roof line reused».
//
//   ARM 10  ⚠⚠ THE FORBIDDEN LEVER – a `+3` spirit delta in `answerLifeBeat` on a matched ending.
//           **2 RED** · §F's behavioural case («company: a spirit delta in `answerLifeBeat` is the
//           red flag: expected 51 to be 48») and §F's source pin. Two different instruments, one law.
//
//   ARM 11  `beatEndsRegister` collapsed to a constant `'told-now'` (the register stops being
//           derived from the receipt).
//           **1 RED at first, 2 RED after §C gained its own register assertion** · §B and §C. The
//           second assertion was written BECAUSE of this arm: the pure told-late path – an ending
//           surfacing seasons later, which is the scene the schema was re-cut for – was covered only
//           through the collision case.
//
//   ARM 12  ⚠⚠ **0 RED, AND THE HOLE WAS REAL.** `ANSWER_EVENT['ended']` replaced by `null`, so
//           answering an ending writes no feed row at all. Nothing in the eight-file set noticed.
//           The only arm that saw it was `npm run e2e:fixtures`, where four rows quietly left a
//           career – a record that lives in a fixture regeneration is a record nobody watches.
//           §D's «ANSWERING WRITES ONE FEED ROW» was written for it, and re-measured:
//   ARM 12b **1 RED** on the same mutation.
//
//   ARM 13  the told-late FEED ROW's read taken on the raise week while the CARD keeps the ending's
//           – the two surfaces of one draw disagreeing. The net (§E «THE TOLD-LATE FEED ROW AND THE
//           CARD READ THE SAME DRAW») was written first and then armed: **1 RED**.
//
//   COMPONENT ARMS (tests/component/life-beat-dialog.test.ts, the round-20 popup law) – both are
//   IN-TEST mutations and therefore run on every green build rather than being a one-off:
//     · the height cap removed on the SHIPPED ending card -> «declares no height bound that fits»;
//     · a grown ending card (her line plus eighteen sentences, four lengthened labels) with the cap
//       AND the scroller removed -> «taller than the screen|outside the viewport», and green again
//       with the cap restored.
//
import { describe, expect, it } from 'vitest'

import {
  answerLifeBeat,
  activeEpisode,
  buildLifeBeatPrompt,
  createWorld,
  deliverKnownPartner,
  drawEndsRead,
  endsHazardFor,
  lifeBeatHeading,
  lifeBeatOptionsFor,
  lifeBeatSaid,
  lifeLogOf,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  raiseLifeBeat,
  rollArrival,
  rollEnds,
  rollSmallTalk,
  ENDS_READS,
  ENDS_REGISTERS,
  LIFE_BEAT_BLOCKING,
  LIFE_BEAT_OPTIONS,
  PARTNER_WANTS,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf, temperamentOpenness } from '../src/engine/spirit'
import { rngFromSeed } from '../src/engine/rng'
import { drainCostOf, drainLifeBeats, drainLifeBeatsTallied, drainSkewLine, DRAIN_ANSWER } from '../tools/_lifeBeats'
import { DEFAULT_PROFILE, type BondBand, type DiaryLifeStage, type LoveEpisode, type WorldEvent } from '../src/shared/protocol'
import { worldFunction } from './worldSource'

// -------------------------------------------------------------------------------------------------
// THE RULINGS, TRANSCRIBED AS LITERALS
// -------------------------------------------------------------------------------------------------

/** ⭐⭐⭐ THE FOUR PRICES AS LITERALS, AND THE LITERALS ARE THE WHOLE POINT (wave-4 rulings §3, and
 *  build plan §5's own row: «match +3, mismatch −3, fix-it −1, blame −4 always»).
 *
 *  ⚠⚠ NOT `ECONOMY.bond.delta.ended*` AND NOT `LIFE_BEAT_OPTIONS.ended.map(o => o.bond)`. An
 *  expectation read out of the thing under test moves WITH it: a wave that re-tuned the table would
 *  keep this file green while every number on screen changed, which is the «two arms that move
 *  together» trap this layer has now fired three times. The instruction that produced this file names
 *  it explicitly – «do not assert the `'ended'` prices by reading `ECONOMY.bond.delta` – write
 *  +3 / −3 / −1 / −4 as literals». */
const MATCH = 3
const MISMATCH = -3
const FIX_IT = -1
const BLAME = -4

/** The four ids, likewise transcribed rather than read off the table. */
const SPACE = 'space'
const COMPANY = 'company'

/** ⭐ WHAT THE SHIPPED `'met'` DELIVERY ROW SAYS – transcribed from wave 3's own pool so that ruling
 *  B's «byte unchanged» is a CLAIM here rather than a hope. ⚠ INVARIANT 4: this sentence is not T4's
 *  to touch and the assertion exists to prove it was not touched. */
const MET_TOLD_OPEN = 'She told us there is someone in her life.'

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** A career parked at `week` with an empty life. ⚠ A REAL `createWorld`, so the profile, the seed and
 *  the temperament are the engine's own (wave 3's and wave 4 T2's shared fixture doctrine). */
function careerAt(seed: string, week: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.week = week
  return world
}

/** An attachment, hand-built. ⚠ POKED RATHER THAN ROLLED: T2's hazard decides WHEN it ends and T5's
 *  draws decide when he hears, and neither is under test in this file. */
function episode(sinceWeek: number, knownWeek: number | null, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek, wants: 'open', partnerId: `p:${sinceWeek}`, ...over }
}

/** The lowest `bond` that still reads as this band – ASKED OF THE LADDER rather than re-derived from
 *  its cut points, which is wave 3's own helper and the reason a band move cannot silently retune
 *  this file. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

const lifeRows = (world: WorldState): WorldEvent[] => world.events.filter((e) => e.type === 'life')
const beatsAbout = (world: WorldState, id: string) => lifeLogOf(world).filter((r) => r.detail === id)

/** ⭐⭐ A SEED WHOSE ENDS HAZARD REALLY FIRES ON `week` FOR THIS TEMPERAMENT – found by asking the
 *  engine's own stream and its own hazard, never by stubbing either.
 *
 *  ⚠ IT ASKS `rngFromSeed` AND `endsHazardFor` DIRECTLY rather than rolling worlds, so the search
 *  costs nothing and – more importantly – the seed it returns is one the REAL `rollEnds` will fire on
 *  when the section below runs it through the tick's own call order. A helper that poked `endedWeek`
 *  by hand would have removed the very code §B is about. */
function seedEndingOn(prefix: string, week: number, temperament: (typeof TEMPERAMENTS)[number]): string {
  const hazard = endsHazardFor(temperament)
  for (let i = 0; i < 20000; i++) {
    const seed = `${prefix}-${i}`
    if (rngFromSeed(`${seed}:life:ends:${week}`)() < hazard) return seed
  }
  throw new Error(`no seed in 20000 ends on week ${week} for a ${temperament} girl`)
}

// =================================================================================================
// ⚠⚠ THE TICK'S OWN CALL ORDER, READ OUT OF THE SOURCE – the apparatus §B and §C both stand on
// =================================================================================================
//
// ⚠⚠ THE WHOLE OF RULING A RESTS ON WHICH OF THESE RUNS FIRST, so a walk that hard-coded the order
// would prove a property of this file rather than of the engine. This is wave 4 T2's §E apparatus
// widened by one call (`deliverKnownPartner`), for its stated reason: «a walk that hard-coded the
// order would have proved a property of the test».
const LIFE_CALLS: Record<string, (world: WorldState) => void> = {
  'rollEnds(world)': rollEnds,
  'rollArrival(world)': rollArrival,
  'deliverKnownPartner(world)': deliverKnownPartner,
  'rollSmallTalk(world)': rollSmallTalk,
}

/** The private life's weekly calls, in the order `resolveBodyAndPlanner` declares them. */
function lifeCallsInSourceOrder(): { names: string[]; run: (world: WorldState) => void } {
  const code = worldFunction('resolveBodyAndPlanner')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
  const i = code.indexOf('accrueCondition(world, playedThisWeek)')
  const j = code.indexOf('accrueSpirit(world)')
  expect(i, 'the accrueCondition call moved').toBeGreaterThan(-1)
  expect(j, 'the accrueSpirit call moved').toBeGreaterThan(i)
  const names = code.slice(i + 1, j).filter((l) => l in LIFE_CALLS)
  // ⚠ THE ORDER IS ASSERTED HERE AND THE WALKS BELOW READ IT – so a reversed call site fails with
  // this sentence rather than as four confusing behavioural surprises.
  expect(names, '⚠⚠ the tick ends, then arrives, then delivers – rulings A and F rest on it').toEqual([
    'rollEnds(world)',
    'rollArrival(world)',
    'deliverKnownPartner(world)',
    'rollSmallTalk(world)',
  ])
  return {
    names,
    run: (world) => {
      for (const name of names) LIFE_CALLS[name](world)
    },
  }
}

// =================================================================================================
// A. RULING B's SPLIT – `rollEnds` RAISES THE TOLD-NOW CARD, AND ONLY BEHIND THE `'met'` RECEIPT
// =================================================================================================
describe('wave 4 T4 A – who raises the card', () => {
  it('⭐⭐⭐ he already knew there was somebody: the ending raises ONE `\'ended\'` beat, on the tick', () => {
    // ⚠ THE HAZARD IS MADE TO FIRE BY CHOOSING A SEED, NEVER BY POKING `endedWeek`: the branch under
    // test lives inside `rollEnds`, after the roll, so a fixture that dated the row by hand would have
    // deleted the code this case is about.
    const temperament = TEMPERAMENTS[1]
    const world = careerAt(seedEndingOn('t4-toldnow', 900, temperament), 900)
    world.temperament = temperament
    world.loveEpisodes = [episode(880, 890)]
    // THE RECEIPT, PUT THERE BY THE ENGINE'S OWN DELIVERY rather than by hand – so what this case
    // calls «he was told» is the same fact `deliverKnownPartner` writes.
    deliverKnownPartner(world)
    expect(lifeLogOf(world).map((r) => r.kind), 'the fixture really delivered the arrival').toEqual(['met'])
    answerLifeBeat(world, 'wary')

    rollEnds(world)
    expect(world.loveEpisodes[0].endedWeek, 'the hazard really fired').toBe(900)
    const raised = beatsAbout(world, 'p:880')
    expect(raised.map((r) => r.kind), '⭐ one `met` and then one `ended`, in that order').toEqual(['met', 'ended'])
    expect(pendingLifeBeat(world)?.kind, 'and the ending is what is waiting').toBe('ended')
    // ⚠ AND `rollEnds` STILL WRITES NO FEED ROW – that is T5's, and the commit order is the design.
    // ⭐⭐ RE-AIMED 12.09 BY T5, NOT WEAKENED, AND THE SENTENCE ABOVE IS KEPT AS THE RECORD. T5 is the
    // step this line was written to be re-read on: the told-now ending now writes its OWN kept row,
    // behind the same `'met'` receipt as the card. WHAT MOVED: the feed holds two rows here instead of
    // one. WHAT DID NOT AND IS THE POINT OF THE ASSERTION: wave 3's delivery sentence is still the
    // FIRST of them, byte unchanged (invariant 4), and the ending did not overwrite or re-word it.
    // ⚠ THE ENDING'S OWN SENTENCE IS NOT PINNED HERE – it is a T6 draft, and tests/wave4-life-row
    // -stamp.test.ts §C owns the claims about it.
    const feedNow = lifeRows(world)
    expect(feedNow.map((e) => e.text)[0], 'wave 3\'s own delivery row is still there, unchanged').toBe(MET_TOLD_OPEN)
    expect(feedNow, '⭐ and the ending added one row of its own beside it').toHaveLength(2)
    expect(feedNow.map((e) => e.lifeKind), 'each stamped with the kind the glyph column reads').toEqual(['met', 'ended'])
  })

  it('⚠⚠ he was NEVER told: the ending raises NOTHING, and the row waits for `knownWeek`', () => {
    // The negative half of ruling B's split, with its positive control in the case above: an ending
    // inside the lag must not put a card on screen about somebody the parent has never heard of.
    const temperament = TEMPERAMENTS[0]
    const world = careerAt(seedEndingOn('t4-untold', 900, temperament), 900)
    world.temperament = temperament
    world.loveEpisodes = [episode(880, 940)] // the lag is still running
    rollEnds(world)
    expect(world.loveEpisodes[0].endedWeek, 'the hazard really fired – this is not a vacuous null').toBe(900)
    expect(lifeLogOf(world), '⚠⚠ nothing is raised about a romance he was never told about').toEqual([])
    expect(pendingLifeBeat(world), 'and the week is not stopped').toBeNull()
    // ...and it is DEFERRED rather than lost, which is the other half of the claim.
    world.week = 940
    deliverKnownPartner(world)
    expect(beatsAbout(world, 'p:880').map((r) => r.kind), 'it surfaces on `knownWeek`, as one late row').toEqual(['ended'])
  })

  it('⚠ `LIFE_BEAT_BLOCKING[\'ended\'] is true – the week stops until he answers', () => {
    expect(LIFE_BEAT_BLOCKING.ended, 'declared blocking').toBe(true)
    const world = careerAt('t4-blocking', 900)
    world.loveEpisodes = [episode(880, 890, { endedWeek: 899 })]
    raiseLifeBeat(world, 'ended', 'p:880')
    expect(pendingLifeBeat(world)?.kind, 'and `pendingLifeBeat` really returns it').toBe('ended')
  })
})

// =================================================================================================
// B. ⚠⚠ RULING A – `endedWeek === knownWeek` RAISES **EXACTLY ONE** BEAT
// =================================================================================================
//
// ⚠⚠ THIS IS THE CASE THE RULING EXISTS FOR, AND IT IS THE ONE THE BRIEF'S LITERAL RULE FAILS. Under
// «told-late when `endedWeek < knownWeek`» this week is *known* (`knownWeek <= endedWeek`), so
// `rollEnds` raises `'ended'` AND the same tick's `deliverKnownPartner` still sees `knownWeek <= week`
// and raises `'met'`: two contradictory beats about one girl in one week. Under the receipt reading
// the ending finds no `'met'` row, raises nothing, and the delivery four calls later raises ONE
// told-late card.
//
// ⚠ IT IS REACHABLE RATHER THAN THEORETICAL: ruling F gives `endedWeek >= sinceWeek + 1`, so the
// collision needs only a lag of one or more and the hazard landing on that exact week. The fixture
// below builds it out of a REAL hazard hit on a REAL seed, run through the tick's own call order.
describe('wave 4 T4 B – the week it ends is the week he hears of it', () => {
  it('⭐⭐⭐ EXACTLY ONE beat, and it is the TOLD-LATE ending – never `\'met\'` as well', () => {
    const order = lifeCallsInSourceOrder()
    const week = 900
    for (const temperament of TEMPERAMENTS) {
      const seed = seedEndingOn(`t4-collide-${temperament}`, week, temperament)
      const world = careerAt(seed, week)
      world.temperament = temperament
      // ⚠ `knownWeek === week` AND `sinceWeek < week` – the collision, and ruling F's own bound
      // respected: the row existed before this tick, so the hazard can reach it.
      world.loveEpisodes = [episode(week - 6, week)]
      expect(activeEpisode(world), `${temperament}: the fixture starts with somebody there`).not.toBeNull()

      order.run(world)

      const row = world.loveEpisodes[0]
      expect(row.endedWeek, `${temperament}: the hazard really fired on this very week`).toBe(week)
      expect(row.knownWeek, `${temperament}: ...and it is the week he was owed the news`).toBe(week)
      // ⚠⚠ THE CLAIM, IN ONE ASSERTION: one beat about this episode, and it is the ending.
      const raised = beatsAbout(world, row.id)
      expect(raised.map((r) => r.kind), `⚠⚠ ${temperament}: ONE honest late row, not two contradictory beats`)
        .toEqual(['ended'])
      expect(lifeLogOf(world).filter((r) => r.kind === 'met'), `${temperament}: no \`met\` beat, ever`).toEqual([])
      // ...and the card he is shown is the told-late one, which is what makes the single row honest.
      const prompt = buildLifeBeatPrompt(world)!
      expect(prompt.kind, `${temperament}: the blocking card is the ending`).toBe('ended')
      // ⚠ THE REGISTER IS ASSERTED AND THE READ IS NOT – §E owns the read. The two candidate sets are
      // built from the pool INDEPENDENTLY of the prompt (both reads of each register), so this says
      // «the card he is shown is a told-late card» without reading the answer off the thing under
      // test, which is what the `.includes(...)` shape would have done.
      const band = bondBandOf(world.bond)
      const late = ENDS_READS.map((r) => lifeBeatHeading('ended', 'level', band, 'told-late', r))
      const now = ENDS_READS.map((r) => lifeBeatHeading('ended', 'level', band, 'told-now', r))
      expect(late, `${temperament}: the two registers are distinguishable at all`).not.toEqual(now)
      expect(late, `${temperament}: the card is worded in the told-late register`).toContain(prompt.heading)
      expect(now, `${temperament}: and not in the told-now one`).not.toContain(prompt.heading)
      // ⚠ THE FEED HALF: one kept row too, and it is the told-late one rather than «there is someone».
      const feed = lifeRows(world)
      expect(feed, `${temperament}: one feed row for one piece of news`).toHaveLength(1)
      expect(feed[0].text.startsWith('There had been someone'), `${temperament}: and it is the late row`).toBe(true)
      expect(feed[0].text, `${temperament}: never wave 3's «there is someone» about somebody already gone`)
        .not.toBe(MET_TOLD_OPEN)
    }
  })

  it('⚠ and the SAME collision stays one beat a week later – the told-late row is delivered once', () => {
    const order = lifeCallsInSourceOrder()
    const week = 900
    const temperament = TEMPERAMENTS[0]
    const seed = seedEndingOn(`t4-collide-once-${temperament}`, week, temperament)
    const world = careerAt(seed, week)
    world.temperament = temperament
    world.loveEpisodes = [episode(week - 6, week)]
    order.run(world)
    const after = beatsAbout(world, 'p:894').length
    expect(after, 'the collision raised its one card').toBe(1)
    // ⚠ ANSWER IT, THEN TICK ON. A queue that re-delivered would raise a second card here, and the
    // dedupe that stops it is the `'ended'` receipt – the half of ruling B a `'met'`-only dedupe
    // would have missed.
    answerLifeBeat(world, DRAIN_ANSWER.ended)
    for (let w = week + 1; w <= week + 10; w++) {
      world.week = w
      deliverKnownPartner(world)
    }
    expect(beatsAbout(world, 'p:894'), 'still one row, ten weeks later').toHaveLength(1)
    expect(lifeRows(world), 'and still one feed row').toHaveLength(1)
  })
})

// =================================================================================================
// C. RULING B – THE DELIVERY SCANS, AND THE `'met'` PATH IS BYTE UNCHANGED
// =================================================================================================
describe('wave 4 T4 C – delivery walks the list', () => {
  it('⭐⭐⭐ an ENDED row that was never delivered surfaces as the told-late card, and raises no `\'met\'`', () => {
    const world = careerAt('t4-late', 960)
    world.loveEpisodes = [episode(880, 940, { endedWeek: 900 })]
    deliverKnownPartner(world)
    const raised = beatsAbout(world, 'p:880')
    expect(raised.map((r) => r.kind), '⚠⚠ one `ended` row and no `met` row, ever').toEqual(['ended'])
    expect(raised[0].detail, 'the detail is the EPISODE ID – machine-readable, never a sentence').toBe('p:880')
    expect(lifeRows(world), 'and one kept feed row').toHaveLength(1)
    expect(lifeRows(world)[0].keep, 'kept, so the album still has it seasons later').toBe(true)
    expect(lifeRows(world)[0].amountCents, '⚠ a life beat is never a purchase').toBeUndefined()
    // ⚠⚠ AND THE REGISTER IS DERIVED FROM THE ABSENT RECEIPT (ruling A), which is what makes the card
    // the honest one. The candidate sets are built from the pool independently of the prompt, so this
    // never reads the answer off the thing under test.
    const prompt = buildLifeBeatPrompt(world)!
    const band = bondBandOf(world.bond)
    const late = ENDS_READS.map((r) => lifeBeatHeading('ended', 'level', band, 'told-late', r))
    const now = ENDS_READS.map((r) => lifeBeatHeading('ended', 'level', band, 'told-now', r))
    expect(late, 'told-now and told-late are two different frames at all').not.toEqual(now)
    expect(late, 'and this card is worded as the late one').toContain(prompt.heading)
    expect(now, 'never as the ending of a romance he had already been told about').not.toContain(prompt.heading)
    // ⚠ AND HER LINE IS THE TOLD-LATE ONE TOO, which is the other half of the register reaching the
    // card – the heading and the line must not read from two different scenes. ⚠⚠ BOTH PRESENCES ARE
    // CANDIDATES AND THE STAGE IS NOT ASSERTED HERE: at week 960 she is long out of the house, and a
    // hard-coded `'school'` would be this case quietly claiming a fact about the presence law that
    // belongs to §G. What is claimed is the REGISTER, so the candidate set is «her told-late line, at
    // either distance» and the refused set is «her told-now line, at either distance».
    const lineIn = (register: (typeof ENDS_REGISTERS)[number]): string[] =>
      [ROOF, AWAY].map((stage) => lifeBeatSaid('ended', 'p:880', world.temperament!, 'level', band, 'open', stage, 'own', register))
    expect(lineIn('told-late'), 'her line is the told-late one').toContain(prompt.said)
    expect(lineIn('told-now'), 'and never the one for an ending he saw coming').not.toContain(prompt.said)
  })

  it('⚠⚠ THE SCAN: a row that is NOT the tail is still delivered – the tail read would have missed it', () => {
    // ⚠ THE SHAPE RULING B REFUSES TO RELY ON CONSTANTS FOR. `activeEpisode` reads the TAIL and only
    // if it is open, so this world – an undelivered ENDED row followed by a live one – is exactly
    // what the old `knownPartner` path returned null for.
    const world = careerAt('t4-scan', 960)
    world.loveEpisodes = [
      episode(800, 850, { endedWeek: 820 }), // over, and he was never told
      episode(900, 910), // and somebody new, who he has been told about
    ]
    deliverKnownPartner(world)
    const rows = lifeLogOf(world)
    expect(rows, 'the FIRST undelivered row is the one taken – the queue doctrine').toHaveLength(1)
    expect([rows[0].kind, rows[0].detail], 'the older, ended one').toEqual(['ended', 'p:800'])
    // ...and the newer one is delivered next, once the first is out of the way.
    answerLifeBeat(world, DRAIN_ANSWER.ended)
    deliverKnownPartner(world)
    expect(lifeLogOf(world).map((r) => `${r.kind}:${r.detail}`), 'then the live one, as a `met`').toEqual([
      'ended:p:800',
      'met:p:900',
    ])
  })

  it('⭐ AN OPEN ROW TAKES THE `\'met\'` PATH, BYTE UNCHANGED – same row, same sentence, same beat', () => {
    // The control for the whole of §C: ruling B says the `endedWeek === null` branch is untouched, and
    // this is the assertion that says so against a LITERAL rather than against the pool.
    const world = careerAt('t4-met-unchanged', 900)
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(880, 900)]
    deliverKnownPartner(world)
    expect(lifeRows(world).map((e) => e.text), 'wave 3\'s own delivery line, untouched').toEqual([MET_TOLD_OPEN])
    expect(lifeLogOf(world).map((r) => `${r.kind}:${r.detail}`), 'and wave 3\'s own beat').toEqual(['met:p:880'])
  })

  it('⚠ nothing is due, nothing is written – and the same world one week on DOES deliver', () => {
    const world = careerAt('t4-not-due', 899)
    world.loveEpisodes = [episode(880, 900, { endedWeek: 890 })]
    deliverKnownPartner(world)
    expect(lifeLogOf(world), 'the lag has not run out').toEqual([])
    expect(lifeRows(world), 'and no row either').toEqual([])
    world.week = 900
    deliverKnownPartner(world)
    expect(lifeLogOf(world).map((r) => r.kind), 'and now it lands – the negative above is not vacuous').toEqual(['ended'])
  })
})

// =================================================================================================
// D. THE FOUR PRICES, AS LITERALS, AND THE FLIP THAT MOVES TWO OF THEM
// =================================================================================================
describe('wave 4 T4 D – what the four answers cost', () => {
  it('⭐⭐⭐ +3 / −3 / −1 / −4, transcribed from the ruling and not from the table', () => {
    const space = lifeBeatOptionsFor('ended', 'open', 'space')
    const company = lifeBeatOptionsFor('ended', 'open', 'company')
    const priced = (list: readonly { id: string; bond: number }[], id: string): number =>
      list.find((o) => o.id === id)!.bond

    expect(space.map((o) => o.id), 'four answers, in the ruled order').toEqual([SPACE, COMPANY, 'fix-it', 'blame'])
    // A girl who wants the room: giving it to her is the match.
    expect(priced(space, SPACE), 'space, to a girl who wants space – the match').toBe(MATCH)
    expect(priced(space, COMPANY), 'company, to a girl who wants space – the mismatch').toBe(MISMATCH)
    // ...and the other way round, which is the whole of the overlay.
    expect(priced(company, COMPANY), 'company, to a girl who wants company – the match').toBe(MATCH)
    expect(priced(company, SPACE), 'space, to a girl who wants company – the mismatch').toBe(MISMATCH)
    // ⚠⚠ AND THE TWO THAT DO NOT MOVE. «Some things are wrong regardless of what she wanted.»
    for (const read of ENDS_READS) {
      const list = lifeBeatOptionsFor('ended', 'open', read)
      expect(priced(list, 'fix-it'), `fix-it @ ${read}: −1 always`).toBe(FIX_IT)
      expect(priced(list, 'blame'), `blame @ ${read}: −4 always`).toBe(BLAME)
    }
  })

  it('⚠⚠ THE LABELS ARE UNTOUCHED BY THE FLIP – same sentences, same order, same ids', () => {
    // Ruling G's own words, and the `'met'` flip's law generalised: a button that changed its words
    // with its price would be the meter this layer refuses to build, one step removed.
    const labels = (read: 'space' | 'company'): string[] =>
      lifeBeatOptionsFor('ended', 'open', read).map((o) => `${o.id}|${o.label}`)
    expect(labels('space'), 'both readings show the player the identical four buttons').toEqual(labels('company'))
  })

  it('⚠ NO NUMBER, NO PRICE AND NO GENDER in any of the four labels', () => {
    for (const option of LIFE_BEAT_OPTIONS.ended) {
      expect(option.label, `${option.id}: no figure on a button`).not.toMatch(/\d/)
      expect(option.label.toLowerCase(), `${option.id}: the schema holds no gender, so neither may a label`)
        .not.toMatch(/\b(him|her boyfriend|girlfriend|he|she'?s ex)\b/)
    }
  })

  it('⭐⭐ ANSWERING WRITES ONE FEED ROW, ONE PER ANSWER, AND IT NAMES WHAT THE PARENT DID', () => {
    // ⚠ ADDED AFTER ARM 12 WENT GREEN IN 0 CASES. `ANSWER_EVENT['ended']` is §5 of the T4 brief's
    // plumbing, and nothing in this file noticed when the whole entry was replaced by `null` – the
    // only arm that saw it was `npm run e2e:fixtures`, where four rows disappeared out of a career.
    // A record that lives only in a fixture regeneration is a record nobody watches.
    const lines = new Set<string>()
    for (const id of LIFE_BEAT_OPTIONS.ended.map((o) => o.id)) {
      const world = careerAt(`t4-answer-row-${id}`, 1000)
      world.bond = 60
      world.loveEpisodes = [episode(900, 1000, { endedWeek: 950 })]
      deliverKnownPartner(world)
      const before = world.events.length
      answerLifeBeat(world, id)
      const written = world.events.slice(before)
      expect(written, `${id}: exactly one row for one thing said`).toHaveLength(1)
      expect(written[0].amountCents, `${id}: ⚠ an answer is never a purchase (rule 4)`).toBeUndefined()
      expect(written[0].text, `${id}: no figure in a feed line`).not.toMatch(/\d/)
      lines.add(written[0].text)
    }
    expect(lines.size, '⚠ four answers, four DIFFERENT rows – the feed can tell them apart later').toBe(4)
  })

  it('⚠ `wants` DOES NOT REACH `\'ended\'` AND THE READ DOES NOT REACH `\'met\'` – two axes, two kinds', () => {
    // Neither parameter is merely unused on the other kind: they are meaningless there, and a
    // collapse of the two into one axis is the `endsMult`/`temperamentMult` defect (ruling E) moved
    // into the copy layer.
    for (const read of ENDS_READS) {
      expect(lifeBeatOptionsFor('met', 'private', read), '`met` prices on `wants` alone').toEqual(
        lifeBeatOptionsFor('met', 'private'),
      )
    }
    for (const wants of PARTNER_WANTS) {
      expect(lifeBeatOptionsFor('ended', wants, 'company'), '`ended` prices on the read alone').toEqual(
        lifeBeatOptionsFor('ended', 'open', 'company'),
      )
    }
  })
})

// =================================================================================================
// E. RULING G – THE READ IS DRAWN ON `endedWeek`, AND RE-DERIVED AT ANSWER TIME
// =================================================================================================
describe('wave 4 T4 E – the read', () => {
  it('⭐⭐⭐ it is keyed on the ENDING\'s week, not on the week the card is raised', () => {
    // ⚠⚠ THE TWO ARMS ARE DIFFERENT SOURCES ON PURPOSE. The left-hand side is the ENGINE's own
    // derivation reached through a raised card; the right-hand side is the stream re-derived here from
    // the seed and the date. A pin that asked `drawEndsRead` on both sides would assert that the
    // function agrees with itself.
    for (const temperament of TEMPERAMENTS) {
      const world = careerAt(`t4-read-key-${temperament}`, 960)
      world.temperament = temperament
      world.loveEpisodes = [episode(880, 940, { endedWeek: 900 })]
      deliverKnownPartner(world)
      const offered = pendingLifeBeatOptions(world)!
      const match = offered.find((o) => o.bond === MATCH)!.id

      const atEnding = rngFromSeed(`${world.seed}:life:ends:900:react`)()
      const own = temperamentOpenness(temperament) === 'open' ? COMPANY : SPACE
      const other = own === COMPANY ? SPACE : COMPANY
      const expected = atEnding < ECONOMY.life.wantsOwnRegister ? own : other
      expect(match, `${temperament}: the matching answer is the one the ENDING's own week drew`).toBe(expected)

      // ⚠ AND THE RAISE WEEK'S STREAM IS NOT WHAT WAS READ – the anti-vacuity half, run only where the
      // two streams actually disagree, so a seed where they happen to agree cannot pass this by luck.
      const atRaise = rngFromSeed(`${world.seed}:life:ends:960:react`)()
      const wouldHaveBeen = atRaise < ECONOMY.life.wantsOwnRegister ? own : other
      if (wouldHaveBeen !== expected) {
        expect(match, `${temperament}: and it is NOT the week the card was raised on`).not.toBe(wouldHaveBeen)
      }
    }
  })

  it('⭐⭐ the weights are who-she-is §4\'s own row – 70/30 toward her register, not a coin flip', () => {
    // §4, verbatim: «open girls draw `'open'` / `'company'` at ~70%; private girls `'private'` /
    // `'space'` at ~70%». ⚠ MEASURED OVER A SWEEP rather than asserted off the constant, so a draw
    // wired to the wrong side of the comparison – or to no bias at all – fails here.
    for (const temperament of TEMPERAMENTS) {
      const own = temperamentOpenness(temperament) === 'open' ? COMPANY : SPACE
      let hers = 0
      const n = 2000
      for (let i = 0; i < n; i++) if (drawEndsRead(`read-weights-${i}`, 700, temperament) === own) hers++
      const share = hers / n
      expect(share, `${temperament}: her own register comes up about 70% of the time (${(share * 100).toFixed(1)}%)`)
        .toBeGreaterThan(0.66)
      expect(share, `${temperament}: ...and not always (${(share * 100).toFixed(1)}%)`).toBeLessThan(0.74)
    }
  })

  it('⚠⚠ RE-DERIVED, NOT STORED – answering charges the price the CARD was built with', () => {
    // The property ruling G.2 forces: `answerLifeBeat` re-validates against the priced set, so the
    // price must reconstruct from facts the world holds. A told-late row answered seasons after the
    // ending is the case that would break a stored read, and it is the case run here.
    for (const temperament of TEMPERAMENTS) {
      const world = careerAt(`t4-rederive-${temperament}`, 1000)
      world.temperament = temperament
      world.bond = 60
      world.loveEpisodes = [episode(700, 1000, { endedWeek: 740 })]
      deliverKnownPartner(world)
      const offered = pendingLifeBeatOptions(world)!
      const match = offered.find((o) => o.bond === MATCH)!
      const before = world.bond
      answerLifeBeat(world, match.id)
      expect(world.bond - before, `${temperament}: the match is charged +3, 260 weeks after the ending`).toBe(MATCH)
      expect(lifeLogOf(world)[0].answer, `${temperament}: and the row records it`).toBe(match.id)
    }
  })

  it('⭐⭐⭐ THE TOLD-LATE FEED ROW AND THE CARD READ THE SAME DRAW – two surfaces, one fact', () => {
    // ⚠⚠ RULING G.1's REAL RISK, WHICH IS NOT THAT THE KEY IS WRONG BUT THAT THERE ARE TWO OF THEM.
    // The kept row is worded in `deliverKnownPartner` and the card is priced in `answerLifeBeat`,
    // seasons apart; both derive the read from the episode's own `endedWeek`, and if either ever
    // reached for `world.week` instead the album would say she wanted one thing while the buttons
    // charged for the other.
    //
    // ⚠ ASSERTED AS A **FUNCTION**, NOT AGAINST A SENTENCE. The two told-late lines are DRAFTS (T6
    // owns them), so this groups a sweep by the answer the engine prices as the match and asserts the
    // row's wording is constant inside each group and different between them. That survives any
    // rewording and still fails the moment the two surfaces read different weeks.
    const byMatch = new Map<string, Set<string>>()
    for (let i = 0; i < 40; i++) {
      const ended = 700 + i * 7
      const world = careerAt(`t4-row-card-${i}`, ended + 120)
      world.loveEpisodes = [episode(ended - 30, ended + 120, { endedWeek: ended })]
      deliverKnownPartner(world)
      const match = pendingLifeBeatOptions(world)!.find((o) => o.bond === MATCH)!.id
      const text = lifeRows(world)[0].text
      if (!byMatch.has(match)) byMatch.set(match, new Set())
      byMatch.get(match)!.add(text)
    }
    expect([...byMatch.keys()].sort(), 'the sweep really saw both reads').toEqual([COMPANY, SPACE])
    for (const [match, texts] of byMatch) {
      expect(texts.size, `${match}: one wording per read, never two`).toBe(1)
    }
    expect(new Set([...byMatch.values()].map((s) => [...s][0])).size, 'and the two reads are worded differently').toBe(2)
  })

  it('⚠ the MISMATCH is charged too – the flip is a real price and not a label', () => {
    const world = careerAt('t4-mismatch', 1000)
    world.bond = 60
    world.loveEpisodes = [episode(700, 1000, { endedWeek: 740 })]
    deliverKnownPartner(world)
    const offered = pendingLifeBeatOptions(world)!
    const wrong = offered.find((o) => o.bond === MISMATCH)!
    const before = world.bond
    answerLifeBeat(world, wrong.id)
    expect(world.bond - before, 'the other one of the pair costs −3').toBe(MISMATCH)
  })

  it('⚠ blame is −4 through the ENGINE on both reads, which is what «always» means', () => {
    for (const forceRead of ENDS_READS) {
      // Find an ending week whose draw gives this read, so both branches are really exercised.
      let week = 700
      while (drawEndsRead('t4-blame', week, createWorld('t4-blame').temperament!) !== forceRead) week++
      const world = careerAt('t4-blame', week + 40)
      world.bond = 60
      world.loveEpisodes = [episode(week - 20, week + 40, { endedWeek: week })]
      deliverKnownPartner(world)
      const before = world.bond
      answerLifeBeat(world, 'blame')
      expect(world.bond - before, `@ ${forceRead}: −4, regardless of what she wanted`).toBe(BLAME)
    }
  })
})

// =================================================================================================
// F. ⚠⚠ HIS WORDS NEVER SPEED HER RECOVERY – BOND ONLY
// =================================================================================================
describe('wave 4 T4 F – the fence', () => {
  it('⚠⚠ answering an ending moves `bond` AND NOTHING ELSE – not spirit, not the shock', () => {
    for (const id of LIFE_BEAT_OPTIONS.ended.map((o) => o.id)) {
      const world = careerAt(`t4-fence-${id}`, 1000)
      world.bond = 60
      world.spirit = 48
      world.spiritShock = { week: 990, kind: 'breakup' }
      world.loveEpisodes = [episode(900, 1000, { endedWeek: 990 })]
      deliverKnownPartner(world)
      const spiritBefore = world.spirit
      const shockBefore = { ...world.spiritShock }
      answerLifeBeat(world, id)
      expect(world.spirit, `${id}: ⚠⚠ a spirit delta in \`answerLifeBeat\` is the red flag`).toBe(spiritBefore)
      expect(world.spiritShock, `${id}: and the mark is not cleared by kind words either`).toEqual(shockBefore)
      // ⚠ THE ANTI-VACUITY HALF: something really did happen on that call.
      expect(lifeLogOf(world)[0].answer, `${id}: the beat really was answered`).toBe(id)
    }
  })

  it('⚠ the source of `answerLifeBeat` writes no `world.spirit` at all – the structural half', () => {
    const code = worldFunction('answerLifeBeat')
    expect(code.length, 'the function was found').toBeGreaterThan(200)
    expect(code, '⚠⚠ the psychologist is wave 5\'s and the recovery lever is his').not.toMatch(/world\.spirit\s*=/)
    expect(code, 'and no shock is cleared here either').not.toMatch(/spiritShock\s*=/)
  })
})

// =================================================================================================
// G. THE POOLS – PRESENCE FROM DAY ONE, BOTH REGISTERS, AND THE READ ON THE HEADING
// =================================================================================================
const ROOF: DiaryLifeStage = 'school'
const AWAY: DiaryLifeStage = 'college'

/** The ending's line, with only the axes this pool reads spelled out. ⚠ The five arguments between
 *  `bond` and `endsRegister` are `lifeBeatSaid`'s shipped defaults for the kinds that use them; the
 *  ending reads none of them, which §G's last case asserts rather than assumes. */
const said = (
  voice: (typeof TEMPERAMENTS)[number],
  band: BondBand,
  stage: DiaryLifeStage,
  register: (typeof ENDS_REGISTERS)[number],
): string => lifeBeatSaid('ended', 'p:1', voice, 'level', band, 'open', stage, 'own', register)

describe('wave 4 T4 G – the pools', () => {
  it('⭐⭐⭐ PRESENCE FROM DAY ONE – every voice, both registers, a DIFFERENT frame away from home', () => {
    // ⚠⚠ §0.3, and it is an absolute: «No single-register pools, ever again.» Wave 3 shipped two
    // pools with one column each and the owner's own вычитка had to add sixteen away frames.
    for (const voice of TEMPERAMENTS) {
      for (const register of ENDS_REGISTERS) {
        const roof = said(voice, 'close', ROOF, register)
        const away = said(voice, 'close', AWAY, register)
        expect(roof.length, `${voice}/${register}: there is a roof line`).toBeGreaterThan(20)
        expect(away, `⚠⚠ ${voice}/${register}: an away frame of its own, not the roof line reused`).not.toBe(roof)
      }
    }
  })

  it('⚠ the QUOTED SPAN is shared between the two presences – presence moves the frame, never the line', () => {
    // The presence law's own rule («цитаты ... общие с домашними рамками»), asserted the way wave 3's
    // §D asserts it: extract both quotations and compare them.
    const quoted = (s: string): string => {
      const m = /"([^"]+)"/.exec(s)
      expect(m, `no quotation found in: ${s}`).not.toBeNull()
      return m![1]
    }
    for (const voice of TEMPERAMENTS) {
      for (const register of ENDS_REGISTERS) {
        expect(quoted(said(voice, 'close', AWAY, register)), `${voice}/${register}: she says the same words`)
          .toBe(quoted(said(voice, 'close', ROOF, register)))
      }
    }
  })

  it('⭐⭐⭐ v75 T6 – NO ENDING FRAME IS AN ARRIVAL FRAME, which is the one collision that reads as a bug', () => {
    // ⚠⚠ WHY THIS NET EXISTS AND WHAT IT CAUGHT. T4's draft gave `deep` two frames BYTE-IDENTICAL to
    // `MET_HER_LINE.deep.open`'s – «She waited until the house was quiet, then said it once.» and
    // «She called late, when the day was done, and said it once.» – so one girl's career staged the
    // very same scene for «there is someone» and for «it is over», seasons apart, and the second
    // reading of it would land as a copy-paste rather than as a life. NOTHING IN THE TREE COULD SEE
    // IT: §G's cases compare cells inside this pool, `wave3-delivery` compares cells inside that one,
    // and the two pools are never held up against each other. It was found by reading and this is
    // what stops the next one.
    //
    // ⚠ IT COMPARES THE FRAME AND NOT THE LINE, deliberately: the quotations differ by construction
    // (one says there is someone, the other that it is over), so a whole-line comparison would pass
    // over exactly the defect. The frame is the scene the parent is standing in, and that is the part
    // a player recognises.
    const frameOf = (s: string): string => s.split('"')[0].trim()
    const arrivals = new Set(
      TEMPERAMENTS.flatMap((v) =>
        PARTNER_WANTS.flatMap((w) =>
          [ROOF, AWAY].map((stage) => frameOf(lifeBeatSaid('met', 'p:1', v, 'level', 'close', w, stage))),
        ),
      ),
    )
    // ⚠ THE POSITIVE CONTROL FIRST – a negative claim over an empty set passes forever, and the
    // extractor is the thing most likely to break here (a pool that stopped quoting, a split that
    // stopped splitting). Sixteen arrival cells, and the frames really are frames.
    expect(arrivals.size, 'the arrival frames were extracted at all').toBeGreaterThan(8)
    for (const f of arrivals) expect(f, 'a frame that is really the whole line').not.toContain('"')
    let checked = 0
    for (const voice of TEMPERAMENTS) {
      for (const register of ENDS_REGISTERS) {
        for (const stage of [ROOF, AWAY]) {
          const frame = frameOf(said(voice, 'close', stage, register))
          expect(frame.length, `${voice}/${register}/${stage}: there is a frame to compare`).toBeGreaterThan(10)
          expect(
            arrivals.has(frame),
            `⚠⚠ ${voice}/${register}/${stage} stages the SAME scene as her arrival line: "${frame}"`,
          ).toBe(false)
          checked++
        }
      }
    }
    expect(checked, 'all sixteen cells were compared').toBe(16)
  })

  it('⭐⭐ FOUR DISTINCT VOICES in each register – no girl silently receives another\'s line', () => {
    for (const register of ENDS_REGISTERS) {
      const lines = TEMPERAMENTS.map((v) => said(v, 'close', ROOF, register))
      expect(new Set(lines).size, `${register}: four voices, four lines`).toBe(TEMPERAMENTS.length)
    }
    // ...and the two registers are genuinely different scenes, per voice.
    for (const voice of TEMPERAMENTS) {
      expect(said(voice, 'close', ROOF, 'told-late'), `${voice}: told-late is not told-now`)
        .not.toBe(said(voice, 'close', ROOF, 'told-now'))
    }
  })

  it('⚠ at `strained` and `cold` the card carries NO line of hers – the dry pool, shared', () => {
    for (const register of ENDS_REGISTERS) {
      const dry = said('sunny', 'strained', ROOF, register)
      for (const voice of TEMPERAMENTS) {
        for (const band of ['strained', 'cold'] as BondBand[]) {
          expect(said(voice, band, ROOF, register), `${voice}/${band}/${register}: the shared dry card`).toBe(dry)
          expect(said(voice, band, AWAY, register), `${voice}/${band}/${register}: and distance does not move it`).toBe(dry)
        }
      }
      expect(dry, `${register}: and it is not one of her own lines`).not.toBe(said('sunny', 'close', ROOF, register))
      expect(dry.includes('"'), `${register}: no quotation anywhere on a dry card`).toBe(false)
    }
  })

  it('⭐⭐⭐ THE READ IS ON THE HEADING, AT EVERY BOND BAND – the surface a cold home can still read', () => {
    const bands: BondBand[] = ['close', 'steady', 'strained', 'cold']
    for (const register of ENDS_REGISTERS) {
      for (const band of bands) {
        const space = lifeBeatHeading('ended', 'level', band, register, 'space')
        const company = lifeBeatHeading('ended', 'level', band, register, 'company')
        expect(space, `${register}/${band}: the two reads are worded differently`).not.toBe(company)
      }
      // ⚠ AND THE BOND BAND AND THE MOOD REGISTER ARE NOT THIS CARD'S AXES, which is the other half of
      // «the read is the thing the heading carries».
      for (const band of bands) {
        expect(lifeBeatHeading('ended', 'bright', band, register, 'space'), `${register}/${band}: no ladder in it`)
          .toBe(lifeBeatHeading('ended', 'level', 'close', register, 'space'))
      }
    }
  })

  it('⚠ no number anywhere in the ending\'s copy, and no Cyrillic', () => {
    const strings = [
      ...TEMPERAMENTS.flatMap((v) =>
        ENDS_REGISTERS.flatMap((r) => [said(v, 'close', ROOF, r), said(v, 'close', AWAY, r), said(v, 'cold', ROOF, r)]),
      ),
      ...ENDS_REGISTERS.flatMap((r) => ENDS_READS.map((read) => lifeBeatHeading('ended', 'level', 'close', r, read))),
      ...LIFE_BEAT_OPTIONS.ended.map((o) => o.label),
    ]
    expect(strings.length, 'the sweep has strings to sweep').toBeGreaterThan(20)
    for (const s of strings) {
      expect(s, `a figure in player-facing copy: ${s}`).not.toMatch(/\d/)
      expect(s, `Cyrillic in a shipped string: ${s}`).not.toMatch(/[Ѐ-ӿ]/)
      expect(s, 'the long dash is never used in this repo\'s copy').not.toMatch(/—/)
    }
  })

  it('⚠ the ending offers NO listening detour – its four answers are the whole card', () => {
    const world = careerAt('t4-no-detour', 1000)
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(900, 1000, { endedWeek: 950 })]
    deliverKnownPartner(world)
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.listenFollowUp, 'giving her room is already one of the four').toBeNull()
    expect(prompt.options, 'and there are four of them').toHaveLength(4)
  })
})

// =================================================================================================
// H. THE DRAIN – `fix-it` IS READ-INDEPENDENT, AND A HARNESS CAN STATE ITS SKEW
// =================================================================================================
describe('wave 4 T4 H – the harness answer', () => {
  it('⭐⭐⭐ `drainCostOf(\'ended\')` NAMES −1 – it does not refuse, which is T3b\'s law satisfied', () => {
    expect(DRAIN_ANSWER.ended, 'the registered answer is the fix-it one').toBe('fix-it')
    expect(() => drainCostOf('ended'), '⚠⚠ the price is knowable through the engine under every read')
      .not.toThrow()
    expect(drainCostOf('ended'), 'and it is the ruled −1').toBe(FIX_IT)
  })

  it('⭐⭐ a real `\'ended\'` row is really drained, and the skew is printable arithmetic', () => {
    const world = careerAt('t4-drain', 1000)
    world.bond = 60
    world.loveEpisodes = [episode(900, 1000, { endedWeek: 950 })]
    deliverKnownPartner(world)
    expect(pendingLifeBeat(world)?.kind, 'the fixture really raised one').toBe('ended')
    const before = world.bond
    const tally = drainLifeBeatsTallied(world)
    expect(tally.cleared, 'the shared helper answered it').toBe(1)
    expect(tally.byKind.ended, 'and counted it under its own kind').toBe(1)
    expect(lifeLogOf(world)[0].answer, 'with the ruled drain answer').toBe('fix-it')
    expect(world.bond - before, 'the engine really charged −1').toBe(FIX_IT)
    expect(tally.bondSkew, 'the tally predicted the same −1').toBe(FIX_IT)
    expect(tally.bondMoved, 'and measured it – no clamp in the middle').toBe(FIX_IT)
    expect(drainSkewLine(tally.byKind), '⭐ the bench line the wave-4 brief §0.2 asks for').toBe(
      'drained 1: ended 1 x -1  = bond skew -1',
    )
  })

  it('⚠ `drainLifeBeats` keeps its signature – the ~50 call sites still read one number', () => {
    const world = careerAt('t4-drain-signature', 1000)
    world.loveEpisodes = [episode(900, 1000, { endedWeek: 950 })]
    deliverKnownPartner(world)
    expect(drainLifeBeats(world), 'one row cleared').toBe(1)
    expect(pendingLifeBeat(world), 'and the queue is empty').toBeNull()
  })
})
