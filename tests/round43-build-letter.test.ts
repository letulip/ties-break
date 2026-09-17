// =================================================================================================
// ⭐⭐ ROUND 43 #11 – A LETTER WHEN A BUILD FINISHES
// =================================================================================================
//
// The owner, 16.09: «давай на почту присылать письмо про те объекты, которые у нас строятся в
// магазине, в момент, когда они достроены.» His own word for it was a cheap micro-idea, and it is –
// the shelf already knows, because a build-to-order rung carries its own weeks.
//
// ⭐ AND HIS RULING NARROWS IT: «всё верно, я так и сказал, только те, которые имеют сроки построек.»
// An index fund bought and held the same week writes nothing, because the letter exists for the WAIT
// and where there was no wait there is no news. §2 is that ruling.
//
// ⚠⚠ THE THING TO GET RIGHT IS WHICH WEEK IT FIRES, and it is not a design choice. The tile's build
// ring (round 41 #28) filling and the delivery landing are not automatically the same instant –
// `deliverAssets` compares with `>=`, so a multi-week skip delivers on the week the skip LANDS on
// rather than on the week the count ran out. A letter a week early or late about a thing standing in
// the garden is worse than no letter. §3 and §4 are that question, from both sides.
//
// ⚠ MUTATION-VERIFIED – the ARMS table at the foot of the file.
import { describe, it, expect } from 'vitest'
import {
  buyAsset,
  createWorld,
  deliverAssets,
  shopItem,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { buildLetterId, expireOffers, pruneEntryLetters } from '../src/engine/offers'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type BuildLetterTerms, type Offer } from '../src/shared/protocol'

/** The shortest build a career can order WITHOUT first buying something else – a year, the sailing
 *  boat. ⚠ NOT `academy-staff`, whose three weeks are the shelf's shortest: the academy is a LADDER
 *  (`requiresId` runs land -> courts -> clubhouse -> staff), so a case that opened with it would be
 *  measuring the ladder's refusal rather than the letter. The rule under test is «has `buildWeeks`»,
 *  and the boat has one. */
const SHORT = 'boat-launch'
/** ...and a long one, because the item is FOR the long wait. Four years, the shelf's own longest. */
const LONG = 'yacht-big'
/** The counter-example, and it is his ruling rather than an edge case: a rung with no build time. */
const INSTANT = 'index-fund'

function richWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.fundsCents = 100_000_000_00
  return world
}

const buildLetters = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'build')
const termsOf = (o: Offer) => o.terms as BuildLetterTerms

describe('round 43 #11 — the build writes when it lands', () => {
  it('§1 – ordering writes nothing; the DELIVERY writes one letter, on its own week', () => {
    const world = richWorld('r43-build-1')
    const item = shopItem(SHORT)!
    expect(item.buildWeeks, 'the fixture is a build-to-order rung').toBeGreaterThan(0)

    buyAsset(world, SHORT)
    // ⚠ THE ORDER IS NOT THE NEWS. The ledger already says «Ordered: …» and «… is on order – due …»
    // the week the money leaves; a letter there would be a third telling of the same thing, and the
    // owner asked for one «в момент, когда они достроены».
    expect(buildLetters(world), 'nothing on the order week').toHaveLength(0)

    const ready = world.assets[0].readyWeek!
    // Every week up to the one before delivery: still silent, and the ring is still filling.
    for (let w = world.week + 1; w < ready; w++) {
      world.week = w
      deliverAssets(world)
      expect(buildLetters(world), `still building at week ${w}`).toHaveLength(0)
      expect(world.assets[0].readyWeek, `still on order at week ${w}`).toBe(ready)
    }

    world.week = ready
    deliverAssets(world)
    const letters = buildLetters(world)
    expect(letters, 'one letter, on the week it arrives').toHaveLength(1)
    expect(letters[0].week, 'and it is dated the delivery week').toBe(ready)
    expect(world.assets[0].readyWeek, 'absent = delivered').toBeUndefined()
  })

  it('§2 – ⭐ his ruling: a rung with no build time writes nothing at all', () => {
    // «только те, которые имеют сроки построек». ⚠ THE RULE IS NOT ENFORCED BY A LIST ANYWHERE – it
    // falls out of `readyWeek` being written in exactly one branch of `buyAsset` – so this case is
    // what says the construction really does hold.
    const world = richWorld('r43-build-2')
    expect(shopItem(INSTANT)!.buildWeeks ?? 0, 'the fixture really has no wait').toBe(0)
    buyAsset(world, INSTANT, 50_000_00)
    expect(world.assets[0].readyWeek, 'nothing to deliver').toBeUndefined()
    for (let w = 1; w <= 8; w++) {
      world.week += 1
      deliverAssets(world)
    }
    expect(buildLetters(world), 'no wait, no news').toHaveLength(0)
  })

  it('§3 – ⚠⚠ the letter reads the DELIVERY, not the ring: a multi-week skip lands it with the thing', () => {
    // `deliverAssets` uses `>=` precisely so a career that presses the fast-forward is not skipped
    // over its own delivery. The letter has to ride that, or it dates itself to a week the family
    // was never told about.
    const world = richWorld('r43-build-3')
    buyAsset(world, SHORT)
    const ready = world.assets[0].readyWeek!
    // Jump clean past the ready week, exactly as a multi-week advance does.
    world.week = ready + 5
    deliverAssets(world)
    const letters = buildLetters(world)
    expect(letters, 'the skip does not lose the letter').toHaveLength(1)
    expect(letters[0].week, 'and it is dated the week the family was told, not the week the count ran out').toBe(ready + 5)
    // ⚠ THE ID IS STILL THE ORDER'S, which is why the date can move without the identity moving: a
    // career that pressed the fast-forward differently must not write a different letter.
    expect(letters[0].id).toBe(buildLetterId(SHORT, termsOf(letters[0]).orderedWeek))
  })

  it('§4 – it fires exactly once, however many times the week is re-ticked', () => {
    const world = richWorld('r43-build-4')
    buyAsset(world, SHORT)
    world.week = world.assets[0].readyWeek!
    for (let i = 0; i < 5; i++) deliverAssets(world)
    expect(buildLetters(world), 'one delivery, one letter').toHaveLength(1)
    // ...and the raiser is idempotent on its id in its own right, which is the second lock: even a
    // caller that somehow reached it with the key already gone cannot write a duplicate.
    const terms = termsOf(buildLetters(world)[0])
    world.assets[0].readyWeek = world.week
    deliverAssets(world)
    expect(buildLetters(world), 'still one').toHaveLength(1)
    expect(termsOf(buildLetters(world)[0])).toEqual(terms)
  })

  it('§5 – the paper carries the label AS WRITTEN and the week the order was placed', () => {
    const world = richWorld('r43-build-5')
    buyAsset(world, LONG)
    const orderedWeek = world.week
    const ready = world.assets[0].readyWeek!
    expect(ready - orderedWeek, 'the shelf`s longest wait').toBe(shopItem(LONG)!.buildWeeks)
    world.week = ready
    deliverAssets(world)

    const terms = termsOf(buildLetters(world)[0])
    expect(terms.itemId).toBe(LONG)
    expect(terms.label, 'the rung`s label, frozen onto the paper').toBe(shopItem(LONG)!.label)
    expect(terms.orderedWeek, 'the week the money left').toBe(orderedWeek)
    // ⚠ NUMBERS AND IDS, NEVER ASSEMBLED PROSE – `AcademyLetterTerms`' rule. `world.offers` is
    // persisted, so a sentence frozen here would outlive the rung it describes. The whole terms
    // object is these three keys and nothing else.
    expect(Object.keys(terms).sort()).toEqual(['itemId', 'label', 'orderedWeek'])
  })

  it('§6 – it is a NOTICE: nothing to sign, nothing to lapse, and nothing prunes it away', () => {
    const world = richWorld('r43-build-6')
    buyAsset(world, SHORT)
    world.week = world.assets[0].readyWeek!
    deliverAssets(world)
    const letter = buildLetters(world)[0]
    expect(letter.state, 'info – the academy`s and the tour`s shape').toBe('info')

    // `expireOffers` only ever touches an `open` letter, so there is nothing here for it to lapse.
    expireOffers(world.offers, world.week + 500)
    expect(buildLetters(world)[0].state).toBe('info')

    // ⚠⚠ AND IT SURVIVES THE SEASON BOUNDARY, which is the half the feed cannot do. `deliverAssets`
    // also writes an `entry` row saying «Delivered: …» and that row is exactly what `pruneEvents`
    // throws away first – on a purchase whose whole point was a four-year wait. `pruneEntryLetters`
    // drops `entry` and `tour` letters at the boundary and never a `build` one.
    world.offers = pruneEntryLetters(world.offers, world.week + WEEKS_PER_YEAR * 2)
    expect(buildLetters(world), 'still findable two seasons later').toHaveLength(1)
  })

  it('§7 – through a real career: the tick delivers and writes, and the two agree about the week', () => {
    // §1-§6 drive `deliverAssets` directly, which is the honest way to isolate the rule; this one
    // runs the real `tickWeek` so the wiring inside `phaseObligations` is exercised too. A delivery
    // that only happened when a test called the function would be a feature nobody can reach.
    const world = richWorld('r43-build-7')
    const rng = rngFromSeed(world.seed)
    buyAsset(world, SHORT)
    const ready = world.assets[0].readyWeek!
    while (world.week < ready + 2) tickWeek(world, rng)
    const letters = buildLetters(world)
    expect(letters, 'the career wrote itself one letter').toHaveLength(1)
    expect(letters[0].week, 'on the delivery week').toBe(ready)
    // The feed's own row is on the same week – the two surfaces cannot disagree, because one call
    // writes both.
    const delivered = world.events.filter((e) => e.text?.startsWith('Delivered: '))
    expect(delivered, 'the ledger row is still there').toHaveLength(1)
    expect(delivered[0].week).toBe(letters[0].week)
  })
})

// ===========================================================================
// THE ARMS. Each applied to src, this file run, then reverted.
//
//   1. `raiseBuildLetter(...)` deleted from `deliverAssets`
//      -> RED [6]: §1, §3, §4, §5, §6, §7 – every case but §2, which asserts an absence. The shipped
//         state before this item.
//   2. the raiser moved ABOVE the `world.week < owned.readyWeek` guard (the "ring" reading: write
//      because the row exists rather than because it delivered)
//      -> RED [2]: §1 (a letter on the order week, and one per week after it) and §7. ⭐ THE ARM THE
//         LEDGER'S OWN WARNING IS ABOUT – «the ring filling and the delivery landing are not
//         automatically the same instant».
//   3. `deliverAssets`'s `>=` narrowed to `!==`
//      -> RED [1]: §3 – a multi-week skip steps over the delivery and the letter with it. The
//         comparison this function's own docblock already argues for, now with a second reader.
//   4. the id keyed on the ARRIVAL week (`buildLetterId(itemId, week)`) instead of the order week
//      -> RED [1]: §3 – the same order writes a different letter depending on how the player
//         pressed the fast-forward.
//   5. `terms.label` taken from the catalogue at RENDER time rather than frozen onto the paper
//      -> not reachable as a src arm (the terms are built in the engine, and the sheet is handed
//         them); the property is asserted positively in §5, whose `Object.keys` check is what stops
//         a fourth key drifting into the shape.
//   6. `'build'` added to `pruneEntryLetters`'s dropped kinds
//      -> RED [1]: §6's last assertion.
// ===========================================================================
