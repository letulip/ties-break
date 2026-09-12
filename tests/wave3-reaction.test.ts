// =================================================================================================
// WAVE 3, T7 – THE REACTION DELTAS AND THE WANTS FLIP
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T7. T6 put the four answers on the card; this is
// what saying one of them COSTS, and the one rule in the layer that reads a fact about HER before it
// prices a sentence of HIS: a girl whose drawn `wants` is `'private'` reads silence as the kindness
// and warmth as the thing that puts it in the room.
//
// ⚠⚠ AND THE READ IS SURFACED IN THE WORDING ALONE – never marked, never labelled, no meter, no
// badge, no option that looks different from the others. §C is the pin on that, and it has BOTH
// halves: nothing on the card carries a number, AND the lines genuinely differ between the two
// readings. Only the first half would be satisfied by a design that surfaced nothing at all, which
// is the same rule being unlearnable rather than unmarked.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts SHAPES and never wording: every sentence it reaches is a
// DRAFT for the owner (CLAUDE.md invariant 4), so what is pinned is «the two readings differ», «no
// price in any word», «the labels do NOT move» – never a string.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back. The count is what the
// mutation actually reddened, because a mutation that reddens the WRONG case is as much a finding as
// one that reddens nothing.
// =================================================================================================
//
//   ARM 1   ⚠⚠ THE SINGLE-ENTRY ARM, AND IT IS THE ONE THIS FILE WAS BUILT AROUND. The brief's own
//           warning for this step: «an equality test can pass because both sides moved together», so
//           a difference asserted against the TABLE rather than against a literal measures the table
//           against itself. `ECONOMY.bond.delta.metSilentPrivate` 2 -> 3, one row, nothing else.
//           5 RED · §A «private: warm against silent: expected -4 to be -3», §A «private: silent:
//           expected 3 to be 2», §B «private: the flip, brief §4: expected [ -1, +0, -3, 3 ] to
//           deeply equal [ -1, +0, -3, 2 ]», §B «private: silent», §B «the priced set for the row in
//           hand»
//
//   ARM 2   ⚠⚠ AND THE WHOLE-TABLE ARM, which is the half ARM 1 cannot speak for: every `'met'` row
//           scaled by two (`metWarm` 2->4, `metIntrusive` -3->-6, `metSilent` -1->-2,
//           `metWarmPrivate` -1->-2, `metSilentPrivate` 2->4, `metWary` left at 0). A file that read
//           its expectations out of `LIFE_BEAT_OPTIONS` would stay GREEN through all of it – the
//           gaps between the rows scale with the rows.
//           6 RED · §A «open: warm against wary: expected 4 to be 2» (⭐ the pair assertion itself,
//           which is the trap the brief named), §A «open: warm: expected 4 to be 2», §A «and the gap
//           is warm minus silent, by the ruled row: expected 6 to be 3», §B «open: warm / wary /
//           intrusive / silent: expected [ 4, +0, -6, -2 ] to deeply equal [ 2, +0, -3, -1 ]» and
//           two more
//
//   ARM 3   the flip neutralised – `lifeBeatOptionsFor` returns `base` for every `wants`
//           6 RED · §A «private: warm against wary: expected 2 to be -1», §B «private: the flip,
//           brief §4: expected [ 2, +0, -3, -1 ] to deeply equal [ -1, +0, -3, 2 ]», §B «⭐ warm is
//           no longer the warm answer: expected 2 not to be 2» and three more
//
//   ARM 4   ⚠⚠ THE HAZARD ARM. `MET_BOND_PRIVATE` gains `wary: 1`, so a private girl's card has NO
//           bond-neutral answer. This is the mutation that would silently move every bond number the
//           forty benches draining through `tools/_lifeBeats.ts` measure, with `npm run check` green
//           the whole way, and §D is the pin that exists to stop it.
//           9 RED · §D «⚠⚠ met @ private has no answer a harness could give for free: expected 0 to
//           be greater than or equal to 1», §D `Error: met has no bond-neutral answer – a walk
//           cannot drain it without moving the number` (the shared helper itself, refusing), §B «⚠
//           wary is untouched – the flip is an overlay, not a second table: expected 1 to be +0» and
//           six more
//
//   ARM 5   the wording half neutralised – `lifeBeatSaid` and `deliverKnownPartner` forced onto the
//           `'open'` column, so the flip is priced but unreadable. §C's anti-vacuity half.
//           3 RED · §C «sunny @ close: her reading is legible in the line», §C «close: and the two
//           rows are two different lines», §C «close: while the line under it is hers»
//           ⚠ AND THE OTHER NINETEEN STAYED GREEN, which is the finding: every «never marked»
//           assertion in this file passes on a design that surfaces nothing at all. That is why §C
//           has two halves and why this arm is recorded beside them.
//
//   ARM 6   `answerLifeBeat` reads `LIFE_BEAT_OPTIONS[kind]` again instead of `lifeBeatOptionsFor` –
//           the card shows the right four and charges the wrong price for two of them.
//           3 RED · §A «private: warm against wary: expected 2 to be -1», §A «private: warm» and §B
//           «private: warm» – the three that answer a real world, and none of the pure-table ones,
//           which is exactly right: this mutation is in the CHARGING and not in the table.
//
//   ARM 7   ⚠⚠⚠ THE ARM THAT WENT GREEN, AND IT IS THE FINDING OF THIS FILE. `answerLifeBeat` given
//           a `world.spirit = (world.spirit ?? 70) + 0.5` beside the bond delta – the exact thing
//           §A's «nothing else moves» claims cannot happen.
//           FIRST RUN: 0 RED, 22 GREEN. The case compared the two ARMS to each other (warm's world
//           against silent's), and a mutation that moves BOTH arms identically is invisible to it.
//           That is the brief's own «both sides moved together» trap wearing a second face, and it
//           had got past the same reading twice.
//           REWRITTEN to compare the world BEFORE the answer against the world AFTER, which is the
//           side that is held still, and the arm re-run: 1 RED · §A «⚠⚠ open/warm: his words move
//           `bond` and nothing else». The arm-against-arm equality is kept as its own smaller case
//           («one career twice»), which is the control the gap assertion needs and no more.
//
//   ARM 8   `answerLifeBeat`'s `if (at < 0) throw` deleted – a second press on a stale card
//           1 RED · §E «⚠ and pressing its buttons is refused: expected [Function] to throw error
//           matching /No life beat is waiting/ but got 'Cannot read properties of undefined (…'».
//           ⚠ The refusal is what the pin is about, so a mutation that still throws – with a
//           TypeError, from a read off `rows[-1]` – correctly does NOT satisfy it.
//
//   ARM 9   the flip leaked onto the labels – `lifeBeatOptionsFor` appending a phrase to the two
//           re-priced buttons, which is the «never marked» rule broken in the most tempting way
//           1 RED · §C «⭐⭐ the card is the same card – the flip is not on it»
import { describe, expect, it } from 'vitest'
import {
  answerLifeBeat,
  buildLifeBeatPrompt,
  createWorld,
  deliverKnownPartner,
  lifeBeatHeading,
  lifeBeatOptionsFor,
  lifeBeatSaid,
  lifeLogOf,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  LIFE_BEAT_OPTIONS,
  PARTNER_WANTS,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf } from '../src/engine/spirit'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { DEFAULT_PROFILE, type BondBand, type LifeBeatKind, type LoveEpisode } from '../src/shared/protocol'

// -------------------------------------------------------------------------------------------------
// THE TABLE, TRANSCRIBED
// -------------------------------------------------------------------------------------------------

/** ⭐⭐⭐ THE BRIEF'S §4 ROW AS LITERALS, AND THE LITERALS ARE THE WHOLE POINT OF THIS FILE.
 *
 *  ⚠⚠ NOT `LIFE_BEAT_OPTIONS.met.map(o => o.bond)`, AND NOT `ECONOMY.bond.delta.*`. An expectation
 *  read out of the thing under test moves WITH it: scale every row by two and a difference asserted
 *  that way still holds, which is a test measuring the table against itself. Every number below is
 *  typed out from `docs/plans/life-wave-3-builder-2026-09.md` §4 – «warm +2 · wary 0 · intrusive −3
 *  · silent −1 | flip: private → silent +2, warm −1» – and ARM 1 and ARM 2 are what say so. */
const TABLE: Record<LoveEpisode['wants'], Record<string, number>> = {
  open: { warm: 2, wary: 0, meet: -3, silent: -1 },
  private: { warm: -1, wary: 0, meet: -3, silent: 2 },
}

/** The four answer ids, in the engine's own order. ⚠ READ FROM THE TABLE and not transcribed a
 *  second time: WHICH answers exist is T6's contract and has its own pin over there; what this file
 *  is about is what each one costs. */
const IDS = LIFE_BEAT_OPTIONS.met.map((o) => o.id)

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The lowest `bond` that still reads as this band, found by ASKING THE LADDER rather than by
 *  re-deriving its cut points – `bondBandOf` is the one reader of them. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** ⚠ A BOND IN THE MIDDLE OF THE LADDER, so no delta in the table can reach a clamp. `applyBondDelta`
 *  clamps to 0..100 and a fixture parked at either end would turn «costs −3» into «costs whatever
 *  was left», which is a silently weaker assertion rather than a failing one. 60 is `steady`, and the
 *  widest swing here is 3. */
const MID_BOND = 60

/** A career parked at `week` with an empty life – a REAL `createWorld`, so the profile, the seed and
 *  the temperament are the engine's own (wave3-arrival.test.ts's fixture doctrine). */
function careerAt(seed: string, week: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.week = week
  return world
}

/** An attachment, hand-built – T5's draws decide `wants` in a career and are not under test here. */
function episode(sinceWeek: number, knownWeek: number, wants: LoveEpisode['wants']): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek, wants, partnerId: `p:${sinceWeek}` }
}

/** A career on the week it was told, with the beat already raised and waiting. */
function told(seed: string, wants: LoveEpisode['wants'], bond = MID_BOND): WorldState {
  const known = 900
  const world = careerAt(seed, known)
  world.bond = bond
  world.loveEpisodes = [episode(known - 8, known, wants)]
  deliverKnownPartner(world)
  return world
}

/** Everything about a world EXCEPT what answering a beat is allowed to touch. `answerLifeBeat` writes
 *  `bond` (the price), the answer onto its `lifeLog` row, and one feed row – so those four keys are
 *  peeled and the rest is compared whole. What survives is «the same career, twice». */
function everythingElse(world: WorldState): string {
  const { bond: _bond, lifeLog: _log, events: _events, nextEventId: _next, ...rest } = world as unknown as Record<string, unknown> & WorldState
  return JSON.stringify(rest)
}

/** The bond a career ends on when this is the answer – the same seed, the same week, the same girl,
 *  one sentence apart. */
function bondAfter(seed: string, wants: LoveEpisode['wants'], id: string): number {
  const world = told(seed, wants)
  answerLifeBeat(world, id)
  return world.bond
}

// =================================================================================================
// A. THE REVERT-THE-REACTION EQUALITY – ⭐⭐ TWO ANSWERS, ONE SEED, AND THE GAP IS THE TABLE
// =================================================================================================
describe('wave 3 T7 A – answer A against answer B, and the difference is exactly the ruled row', () => {
  it('⭐⭐⭐ every PAIR of answers is exactly its two rows apart, under both readings', () => {
    // ⚠⚠ PAIRS AND NOT JUST ABSOLUTES, which is wave 2's own gate shape: the claim a player can
    // actually check is «I could have said the other thing», and the gap between the two careers is
    // what the choice was worth. ⚠ AND THE EXPECTATION IS A LITERAL MINUS A LITERAL – see `TABLE`.
    for (const wants of PARTNER_WANTS) {
      for (const a of IDS) {
        for (const b of IDS) {
          const seed = `t7-pair-${wants}-${a}-${b}`
          const gap = bondAfter(seed, wants, a) - bondAfter(seed, wants, b)
          expect(gap, `${wants}: ${a} against ${b}`).toBe(TABLE[wants][a] - TABLE[wants][b])
        }
      }
    }
  })

  it('⭐⭐ and each answer on its own is worth its own row, to the half point', () => {
    for (const wants of PARTNER_WANTS) {
      for (const id of IDS) {
        const world = told(`t7-abs-${wants}-${id}`, wants)
        const before = world.bond
        answerLifeBeat(world, id)
        expect(world.bond - before, `${wants}: ${id}`).toBe(TABLE[wants][id])
      }
    }
  })

  it('⭐⭐ DETERMINISTIC AND NOT STATISTICAL – the same seed and the same answer land on the same number twice', () => {
    // ⚠ The brief asks for «deterministic, no SEM» in as many words. If any of this reached a stream
    // the two runs would part; they do not, because answering a beat draws nothing.
    for (const wants of PARTNER_WANTS) {
      for (const id of IDS) {
        expect(bondAfter('t7-twice', wants, id), `${wants}: ${id} is the same number twice`).toBe(
          bondAfter('t7-twice', wants, id),
        )
      }
    }
  })

  it('⚠⚠ AND THE ANSWER MOVES `bond` AND NOTHING ELSE – measured BEFORE against AFTER, not arm against arm', () => {
    // ⚠⚠ BEFORE-AGAINST-AFTER, AND ARM 7 IS WHY. This case first compared the two ARMS to each other
    // – warm's world against silent's – and a mutation adding `world.spirit += 0.5` inside
    // `answerLifeBeat` left it GREEN, because both arms moved together. That is the brief's own trap
    // wearing a second face: an equality is only a net when one side is held still. The world before
    // the answer is the side that is held still.
    for (const wants of PARTNER_WANTS) {
      for (const id of IDS) {
        const world = told(`t7-isolated-${wants}-${id}`, wants)
        // ⚠ THE PEEL IS NOT THE WHOLE WORLD, which is what stops this being vacuous: four keys come
        // off a career that has dozens, and what is compared has to still be most of it.
        expect(Object.keys(world).length, 'the career has keys to compare').toBeGreaterThan(40)
        const before = everythingElse(world)
        expect(before.length, 'and the peel left nearly all of them in').toBeGreaterThan(5_000)
        const spirit = world.spirit
        const funds = world.fundsCents
        const rng = JSON.stringify(world.rngMain)
        answerLifeBeat(world, id)
        expect(everythingElse(world), `⚠⚠ ${wants}/${id}: his words move \`bond\` and nothing else`).toBe(before)
        // The named fields as well, so a key that somehow joined the peel cannot hide behind it.
        expect(world.spirit, `${wants}/${id}: no spirit delta – weather is hers`).toBe(spirit)
        expect(world.fundsCents, `${wants}/${id}: and a life beat is never a purchase`).toBe(funds)
        expect(JSON.stringify(world.rngMain), `${wants}/${id}: the MAIN stream is not reached`).toBe(rng)
      }
    }
  })

  it('⚠ and the two arms genuinely are one career twice – the control for the gap above', () => {
    const warm = told('t7-one-career', 'open')
    const silent = told('t7-one-career', 'open')
    expect(everythingElse(warm), 'same seed, same week, same girl').toBe(everythingElse(silent))
    answerLifeBeat(warm, 'warm')
    answerLifeBeat(silent, 'silent')
    expect(warm.bond - silent.bond, 'and the gap is warm minus silent, by the ruled row').toBe(2 - -1)
  })
})

// =================================================================================================
// B. THE FLIP – ⭐⭐⭐ WHAT SHE ASKED FOR RE-PRICES TWO OF THE FOUR, AND ONLY TWO
// =================================================================================================
describe('wave 3 T7 B – a private girl reads silence as the kindness', () => {
  it('⭐⭐⭐ the two tables, as literals – open is the ruled row, private flips warm and silent', () => {
    expect(lifeBeatOptionsFor('met', 'open').map((o) => o.bond), 'open: warm / wary / intrusive / silent').toEqual([
      2, 0, -3, -1,
    ])
    expect(lifeBeatOptionsFor('met', 'private').map((o) => o.bond), 'private: the flip, brief §4').toEqual([
      -1, 0, -3, 2,
    ])
    expect(
      [ECONOMY.bond.delta.metWarmPrivate, ECONOMY.bond.delta.metSilentPrivate],
      'and the two constants they are wired from',
    ).toEqual([-1, 2])
  })

  it('⭐⭐ TWO ROWS MOVE AND TWO DO NOT, which is the shape of the ruling rather than a number', () => {
    const open = new Map(lifeBeatOptionsFor('met', 'open').map((o) => [o.id, o.bond]))
    const priv = new Map(lifeBeatOptionsFor('met', 'private').map((o) => [o.id, o.bond]))
    expect(priv.get('warm'), '⭐ warm is no longer the warm answer').not.toBe(open.get('warm'))
    expect(priv.get('silent'), '⭐ and silence is').not.toBe(open.get('silent'))
    expect(priv.get('wary'), '⚠ wary is untouched – the flip is an overlay, not a second table').toBe(open.get('wary'))
    expect(priv.get('meet'), '⚠ and so is the intrusive answer').toBe(open.get('meet'))
    // The direction, stated rather than implied: silence GAINS and warmth LOSES.
    expect(priv.get('silent')!, 'silence is worth more to her than it was').toBeGreaterThan(open.get('silent')!)
    expect(priv.get('warm')!, 'and being told about it is worth less').toBeLessThan(open.get('warm')!)
  })

  it('⭐ the flip is `met`\'s alone – the fork\'s three are byte-identical under both readings', () => {
    expect(lifeBeatOptionsFor('fork-opinion', 'private'), 'her college answer is not an attachment').toEqual(
      LIFE_BEAT_OPTIONS['fork-opinion'],
    )
    expect(lifeBeatOptionsFor('fork-opinion', 'open'), 'and the open reading is the same list again').toEqual(
      LIFE_BEAT_OPTIONS['fork-opinion'],
    )
  })

  it('⭐⭐ THE ENGINE CHARGES THE FLIPPED PRICE END TO END, through a real delivery and a real answer', () => {
    // ⚠ THE PAIRED CONTROL IS THE POINT: the same seed, the same week, the same answer id – and the
    // only difference between the two careers is a fact about HER that neither of them chose.
    for (const id of ['warm', 'silent']) {
      const open = told(`t7-end-${id}`, 'open')
      const priv = told(`t7-end-${id}`, 'private')
      const openBefore = open.bond
      const privBefore = priv.bond
      answerLifeBeat(open, id)
      answerLifeBeat(priv, id)
      expect(open.bond - openBefore, `open: ${id}`).toBe(TABLE.open[id])
      expect(priv.bond - privBefore, `private: ${id}`).toBe(TABLE.private[id])
      expect(open.bond, `${id}: and the two careers genuinely part`).not.toBe(priv.bond)
    }
  })

  it('⚠ `pendingLifeBeatOptions` reads the row\'s OWN attachment, not the base table', () => {
    const priv = told('t7-pending', 'private')
    expect(pendingLifeBeatOptions(priv)!.map((o) => o.bond), 'the priced set for the row in hand').toEqual([-1, 0, -3, 2])
    const open = told('t7-pending', 'open')
    expect(pendingLifeBeatOptions(open)!.map((o) => o.bond), 'and the other girl gets the other one').toEqual([2, 0, -3, -1])
    // ⚠ NULL AND NOT A THROW when nothing is waiting – it is asked on worlds with no beat at all.
    answerLifeBeat(open, 'wary')
    expect(pendingLifeBeatOptions(open), 'nothing pending, nothing priced').toBeNull()
  })
})

// =================================================================================================
// C. ⭐⭐⭐ THE READ IS IN THE WORDING AND IN NOTHING ELSE – never marked, never labelled
// =================================================================================================
describe('wave 3 T7 C – a player may notice it over months and may never read it off a number', () => {
  it('⭐⭐⭐ THE BUTTONS DO NOT MOVE – same ids, same order, same sentences, both readings', () => {
    const open = buildLifeBeatPrompt(told('t7-labels', 'open'))!
    const priv = buildLifeBeatPrompt(told('t7-labels', 'private'))!
    expect(priv.options, '⭐⭐ the card is the same card – the flip is not on it').toEqual(open.options)
  })

  it('⭐⭐ and no option carries a price at all – the prompt\'s own type is the fence', () => {
    const prompt = buildLifeBeatPrompt(told('t7-no-price', 'private'))!
    for (const option of prompt.options) {
      expect(Object.keys(option).sort(), 'an id and a label, and nothing a meter could be built from').toEqual([
        'id',
        'label',
      ])
    }
    // ...and no price in the WORDS either, which is the half a missing field cannot guarantee.
    for (const word of [prompt.heading, prompt.said, ...prompt.options.map((o) => o.label)]) {
      expect(word, word).not.toMatch(/\d|\$|\+|−|%/)
      expect(word, word).not.toMatch(/\b(bond|points?|score|meter|closer|further)\b/i)
    }
  })

  it('⭐⭐⭐ AND THE ANTI-VACUITY HALF – the two readings really do sound different, on every rung', () => {
    // ⚠⚠ WITHOUT THIS CASE THE TWO ABOVE ARE SATISFIED BY A DESIGN THAT SURFACES NOTHING, and a rule
    // nothing surfaces is exactly the hidden number this wave refuses to ship. Every voice, every
    // band: the `open` line and the `private` line are two different sentences.
    for (const voice of TEMPERAMENTS) {
      for (const band of ['close', 'steady', 'strained', 'cold'] as BondBand[]) {
        const open = lifeBeatSaid('met', 'p:1', voice, 'level', band, 'open')
        const priv = lifeBeatSaid('met', 'p:1', voice, 'level', band, 'private')
        expect(priv, `${voice} @ ${band}: her reading is legible in the line`).not.toBe(open)
        expect(priv.length, `${voice} @ ${band}: and it is a real sentence`).toBeGreaterThan(20)
      }
    }
  })

  it('⭐⭐ the FEED row carries it too, which is the half that survives the week', () => {
    // ⚠ The card is answered once and gone; the feed row is `keep: true` and a career reads its own
    // life back seasons later. A player who was not listening the first time still has this.
    for (const band of ['close', 'strained'] as BondBand[]) {
      const open = told(`t7-feed-${band}`, 'open', bondFor(band))
      const priv = told(`t7-feed-${band}`, 'private', bondFor(band))
      const openRow = open.events.filter((e) => e.type === 'life')[0]
      const privRow = priv.events.filter((e) => e.type === 'life')[0]
      expect(openRow, `${band}: the delivery wrote a row at all`).not.toBeUndefined()
      expect(privRow.text, `${band}: and the two rows are two different lines`).not.toBe(openRow.text)
      for (const row of [openRow, privRow]) {
        expect(row.amountCents, '⚠⚠ a life beat is never a purchase').toBeUndefined()
        expect(row.text, row.text).not.toMatch(/\d|\$/)
        expect(row.text, row.text).not.toMatch(/[Ѐ-ӿ]/)
      }
    }
  })

  it('⚠ the heading is NOT the surface – the parent\'s frame reads the distance, not her request', () => {
    // A scope statement rather than a claim about copy: `MET_HEADING` keys on the bond band alone, so
    // the wording that carries the read is the LINE and the FEED ROW. If a later wave wants the frame
    // to say it too, that is a decision and not a drift.
    for (const band of ['close', 'steady', 'strained', 'cold'] as BondBand[]) {
      const open = buildLifeBeatPrompt(told(`t7-head-${band}`, 'open', bondFor(band)))!
      const priv = buildLifeBeatPrompt(told(`t7-head-${band}`, 'private', bondFor(band)))!
      expect(priv.heading, `${band}: one frame per rung`).toBe(open.heading)
      expect(priv.heading, `${band}: and it is the assembler's own`).toBe(lifeBeatHeading('met', 'level', band))
      expect(priv.said, `${band}: while the line under it is hers`).not.toBe(open.said)
    }
  })

  it('⚠ every new line is a clean draft – no Cyrillic, no digits, no long dash', () => {
    const pool = PARTNER_WANTS.flatMap((wants) =>
      TEMPERAMENTS.flatMap((voice) =>
        (['close', 'steady', 'strained', 'cold'] as BondBand[]).map((band) =>
          lifeBeatSaid('met', 'p:1', voice, 'level', band, wants),
        ),
      ),
    )
    for (const line of pool) {
      expect(line, line).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, line).not.toMatch(/\d|\$/)
      expect(line, line).not.toMatch(/—/)
    }
    // ⚠ FOUR VOICES STAY FOUR VOICES IN THE NEW COLUMN: a `quiet` girl may never be handed a `fiery`
    // girl's line as a fallback (§5b's completeness rule), and the second axis does not relax it.
    for (const wants of PARTNER_WANTS) {
      const spoken = TEMPERAMENTS.map((voice) => lifeBeatSaid('met', 'p:1', voice, 'level', 'close', wants))
      expect(new Set(spoken).size, `${wants}: four voices, four lines`).toBe(4)
    }
  })
})

// =================================================================================================
// D. ⚠⚠ THE BOND-NEUTRAL PIN – THE ONE THAT STOPS THE NEXT WAVE BREAKING FORTY TOOLS
// =================================================================================================
//
// `tools/_lifeBeats.ts`' `drainLifeBeats` is how forty benches, `npm run e2e:fixtures` and
// `tests/helpers/career.ts` walk a career past a beat they never meant to price: it answers with the
// option whose delta is ZERO and THROWS if a kind has no such option, because a silently costed
// answer would move every bond number those harnesses measure.
//
// ⚠⚠ AND `npm run check` WOULD STAY GREEN THROUGH THE BREAKAGE – that is the whole reason this pin
// is written down rather than assumed. Every one of those call sites typechecks; T6b's own evidence
// is a bench that exited 0 while measuring nothing. The flip is written as an OVERLAY on two rows
// precisely so `wary`'s zero is the SAME zero in both readings, and this is the net that says so.
describe('wave 3 T7 D – every beat kind keeps a bond-neutral answer under every `wants`', () => {
  it('⚠⚠ EVERY KIND x EVERY READING HAS AN ANSWER THAT COSTS NOTHING', () => {
    // ⚠ THE KINDS COME FROM THE RECORD ITSELF, so T8's `'small-talk'` and every kind after it is
    // covered the day it is declared – `LIFE_BEAT_OPTIONS` is keyed on `LifeBeatKind`, so its own
    // keys are the total list and cannot go stale. `PARTNER_WANTS` is derived the same way.
    const kinds = Object.keys(LIFE_BEAT_OPTIONS) as LifeBeatKind[]
    expect(kinds.length, 'the sweep has kinds to sweep').toBeGreaterThan(0)
    expect(PARTNER_WANTS.length, 'and both readings of her wants').toBe(2)
    for (const kind of kinds) {
      for (const wants of PARTNER_WANTS) {
        const free = lifeBeatOptionsFor(kind, wants).filter((o) => o.bond === 0)
        expect(free.length, `⚠⚠ ${kind} @ ${wants} has no answer a harness could give for free`).toBeGreaterThanOrEqual(
          1,
        )
      }
    }
  })

  it('⚠ and on `met` it is the SAME answer either way, which is what an overlay guarantees', () => {
    const free = PARTNER_WANTS.map((wants) => lifeBeatOptionsFor('met', wants).find((o) => o.bond === 0)!.id)
    expect(new Set(free).size, 'one free answer, not one per reading').toBe(1)
    expect(free[0], 'and it is the wary one, as T6b recorded').toBe('wary')
  })

  it('⭐⭐⭐ `drainLifeBeats` really drains a PRIVATE girl\'s beat, and her bond does not move', () => {
    // END TO END, THROUGH THE SHARED HELPER ITSELF – not through a copy of what it does. This is the
    // path `npm run e2e:fixtures` and every bench takes.
    for (const wants of PARTNER_WANTS) {
      const world = told(`t7-drain-${wants}`, wants)
      const before = world.bond
      const cleared = drainLifeBeats(world)
      expect(cleared, `${wants}: the helper answered the row`).toBe(1)
      expect(pendingLifeBeat(world), `${wants}: and the queue is empty`).toBeNull()
      expect(world.bond, `⚠⚠ ${wants}: a walk that never asked the player put nothing on the scale`).toBe(before)
      // ⚠ THE ANTI-VACUITY HALF: «bond did not move» is free on a drain that did nothing at all.
      expect(lifeLogOf(world)[0].answer, `${wants}: something really was answered`).toBe('wary')
    }
  })

  it('⚠ the neutral id the drain picks is priced zero BY THE ENGINE, not by the base table', () => {
    // The two readings agree today; this is the assertion that would notice the day they stop.
    for (const wants of PARTNER_WANTS) {
      const world = told(`t7-neutral-${wants}`, wants)
      const free = pendingLifeBeatOptions(world)!.find((o) => o.bond === 0)!
      const before = world.bond
      answerLifeBeat(world, free.id)
      expect(world.bond, `${wants}: ${free.id} charged exactly nothing`).toBe(before)
    }
  })
})

// =================================================================================================
// E. THE REFUSAL – ⚠ A STALE OR UNOFFERED ANSWER IS REFUSED ENGINE-SIDE, UNDER BOTH READINGS
// =================================================================================================
describe('wave 3 T7 E – the engine re-validates the id, whatever she wants', () => {
  it('⚠ an option this beat never offered is refused, and the row stays waiting', () => {
    for (const wants of PARTNER_WANTS) {
      for (const stale of ['back', 'press', 'listen', 'shrug', '', 'WARM']) {
        const world = told(`t7-refuse-${wants}-${stale}`, wants)
        const before = world.bond
        expect(() => answerLifeBeat(world, stale), `${wants}: «${stale}» is not one of hers`).toThrow(
          /not one of the answers/,
        )
        expect(pendingLifeBeat(world), `${wants}: the row is still waiting`).not.toBeNull()
        expect(world.bond, `${wants}: and a refused answer costs nothing`).toBe(before)
      }
    }
  })

  it('⚠⚠ A STALE CARD CANNOT BE ANSWERED TWICE – the second press finds no row', () => {
    // The live shape of the hazard: a dialog rendered before the beat was answered, pressed again
    // after. The prompt it was built from is gone, and the engine is the thing that knows it.
    const world = told('t7-twice-refused', 'private')
    const prompt = buildLifeBeatPrompt(world)!
    answerLifeBeat(world, 'silent')
    const after = world.bond
    expect(buildLifeBeatPrompt(world), 'the card is gone').toBeNull()
    expect(() => answerLifeBeat(world, prompt.options[0].id), '⚠ and pressing its buttons is refused').toThrow(
      /No life beat is waiting/,
    )
    expect(world.bond, 'the price was paid exactly once').toBe(after)
    expect(lifeLogOf(world).filter((r) => r.answer !== null).length, 'one answered row, not two').toBe(1)
  })

  it('⭐ the four the card DID offer are all accepted, under both readings', () => {
    // The control for everything above: the refusals are about the ids and not about the fixture.
    for (const wants of PARTNER_WANTS) {
      for (const id of IDS) {
        const world = told(`t7-accept-${wants}-${id}`, wants)
        expect(() => answerLifeBeat(world, id), `${wants}: ${id} is one of hers`).not.toThrow()
        expect(lifeLogOf(world)[0].answer, `${wants}: ${id} is recorded`).toBe(id)
      }
    }
  })
})
