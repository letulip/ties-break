// WAVE 10 / T1 + T2 – THE INHERITANCE BLOCK AND THE SEAT IT IS PERSISTED IN (v86).
//
// docs/specs/the-dynasty-2026-09.md §2/§3/§4, the plan docs/plans/life-wave-10-builder-2026-09.md.
// His ask, 11.09: «в конце карьеры можно сделать хук на новую карьеру через ребенка, например»;
// his go for the wave, 22.09.
//
// ⚠⚠ EVERY CAREER IN THIS FILE IS **LIVED**, not posed – `openCareer` + `stepCareerWeek` out of
// tools/econ-bench.ts, which wave 9 established as the only honest way a test reaches a late-career
// state. Posing `world.kidFundsCents` onto a probe world would test the arithmetic of a band nobody
// can earn; walking to the ending tests the band the game actually hands over.
//
// ⚠ THE ONE EXCEPTION IS §D, WHICH IS ABOUT A SAVE AND NOT ABOUT A CAREER: a payload carrying a
// dynasty record cannot be produced by any engine path on this tree (the only producer is the door,
// and taking it makes a NEW world), so the keep-branch of the migration's `??=` has to be crafted.
// The migration's own comment says so and points here.
//
// MUTATION-VERIFIED 22.09, each applied, RUN, and reverted – with the count of what went red, because
// «it fails» is the claim and «two of fourteen, these two» is the measurement:
//   · `dynastyBackgroundOf`'s `>= bands.wealthy` -> `>= bands.wealthy * 99`: **2 red** – §B's wealthy
//     career and §B's boundary case.
//   · `DYNASTY_SEED_TAG` `':dynasty:'` -> `':d:'`: **1 red** – §A's field-by-field case.
//   · `wasThereAChild` back to its v1 `return false`: **1 red**, and it is §A's «OTHER arm» case and
//     ONLY that one. ⚠ That is a FINDING rather than a pass: no career this file can afford to walk
//     ever has a child, so the lived case cannot see this mutation at all. The case exists because
//     the measurement said so.
//   · `createWorld`'s `if (dynasty) { profile = { ...profile, background } }` disabled: **2 red** –
//     §B's wealthy career and §C's different-background case.
//   · the migration's `??=` -> `=`: **1 red of 278**, run against §D *and the whole golden corpus*
//     (`goldenSaves`, `-quote`, `-peak`). Every one of the 87 fixtures back-fills, so the keep-branch
//     never executes and the corpus is BLIND to the clobber. §D's crafted payload is the only thing
//     in this repo that sees it.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ancestorSeedOf,
  buildEndingView,
  childSeedFor,
  createWorld,
  dynastyBackgroundOf,
  dynastyHandoverOf,
  SAVE_SCHEMA_VERSION,
  wasThereAChild,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { bestRankOn } from '../src/engine/world/ladder'
import { lineageLicensed, motherWasKnown, newsStandingOf } from '../src/engine/world/spotlight'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type DynastyHandover } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const rec = (w: unknown): Record<string, unknown> => w as unknown as Record<string, unknown>

/** ⚠ THE CAP IS A BELT, NOT A HORIZON. Every career here reaches a latched ending long before it –
 *  the walk stops the moment `world.ending` is non-null – and the number exists so a regression that
 *  made endings unreachable fails as a red assertion rather than as a hung suite. */
const ENDING_CAP_WEEKS = 1600

interface Lived {
  world: WorldState
  weeks: number
}

/** ⚠ MEMOISED PER CELL, and that is a cost decision with a number behind it: a walked week costs
 *  ~5.8 ms here, so the two careers this file lives are ~2.7 s and ~4.5 s each and re-walking them
 *  per `it` would have cost four times that for four identical worlds. Each cell is walked ONCE and
 *  every case reads the same ended career, which is also what makes the cases comparable. */
const walked = new Map<string, Lived>()

function walkToEnding(presetIndex: number, policyIndex: number, seedIndex: number): Lived {
  const key = `${presetIndex}/${policyIndex}/${seedIndex}`
  const hit = walked.get(key)
  if (hit) return hit
  const policy = POLICIES[policyIndex]
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, policy)
  let weeks = 0
  while (world.ending === null && weeks < ENDING_CAP_WEEKS) {
    stepCareerWeek(world, rng, policy)
    weeks += 1
  }
  const lived = { world, weeks }
  walked.set(key, lived)
  return lived
}

// =================================================================================================
// A. THE BLOCK'S ARITHMETIC, ON A CAREER THAT WAS LIVED TO ITS ENDING
// =================================================================================================

describe('wave 10 T1 A – the inheritance block', () => {
  it('⭐⭐⭐ every field is a fact the ended career already holds, and the ending view carries the same object', () => {
    const { world, weeks } = walkToEnding(5, 0, 0)
    expect(world.ending, `the walk has to REACH an ending for this case to mean anything (${weeks} weeks)`).not.toBe(null)

    const block = dynastyHandoverOf(world)
    const view = buildEndingView(world)
    expect(view, 'a latched ending always builds a view').not.toBe(null)

    // ⭐ THE VIEW CARRIES THE SAME BLOCK, which is the property the whole route depends on: the UI
    // never sees a world, so a block the screen could not read would be a door with nothing behind it.
    expect(view!.dynasty, 'the ending view hands over exactly what the builder built').toEqual(block)

    // Generation one, because the mother's own `dynasty` is null – every career ever played.
    expect(block.generation, 'a generation-zero career hands over generation one').toBe(1)
    expect(block.childSeed, 'the seed is DERIVED, never drawn').toBe(childSeedFor(world.seed, 1))
    expect(block.childSeed).toBe(`${world.seed}:dynasty:1`)
    // ⚠ THE INVERSE ROUND-TRIPS, which is what lets `createWorld` recover the root without the block
    // carrying it twice. A red here means the join and the split have drifted apart.
    expect(ancestorSeedOf(block.childSeed, 1), 'the root comes back out of the child seed exactly').toBe(world.seed)

    expect(block.motherName, 'her name, and NOT the daughter\'s – «имя выбирает родитель»').toEqual({
      first: world.profile.kidName,
      last: world.profile.kidLastName,
    })
    expect(block.motherTemperament, 'her BIRTH temperament, the one axis §7 leans on').toBe(world.temperament)

    // ⚠⚠ THE TWO TITLE FOLDS AGREE, ASSERTED RATHER THAN TRUSTED. `buildEndingView` counts its own
    // `titles` and the block counts its own; they are four lines apart in one file and nothing but
    // this line stops them drifting. The comment over `dynastyHandoverOf` promises exactly this case.
    expect(block.motherCareer.titles, 'the block and the epilogue count one cabinet').toBe(view!.titles)
    // ⚠ RE-AIMED AT THE ARCHITECT'S REVIEW (22.09), NOT WEAKENED – the claim it used to make became
    // false BY DESIGN. It asserted the block equals the view's `bestRank`, «`bestRankEver`, the one
    // reader» – and `bestRankEver` answers for the highest ladder REACHED, so a junior-only career
    // handed a junior number to `motherWasKnown`, whose bar is a WTA rank. The two are now two
    // different true things on purpose: the EPILOGUE shows her best on the ladder she reached (a
    // junior story honestly says «junior #74»); the BLOCK carries only what the professional press
    // could have known (`bestRankOn(world, 'wta')`). This cell's career never touched the WTA
    // table, so the block says null while the view still shows her real junior best.
    expect(block.motherCareer.bestRank, 'the block reads the PRO table alone').toBe(bestRankOn(world, 'wta'))
    expect(view!.bestRank, 'while the epilogue still shows the ladder she reached').not.toBe(null)
    expect(block.motherCareer.slams, 'the slam shelf alone').toBe(world.trophiesByTier.slam.titles.length)
    expect(block.motherCareer.slams, '...which cannot exceed the whole cabinet').toBeLessThanOrEqual(block.motherCareer.titles)

    // ⚠ THE WEEK THE STORY STOPPED, off the latched ending and NOT off `world.week`: a career sits on
    // its ending screen for as long as the player leaves it there.
    expect(block.motherCareer.endedWeek, 'the week she stopped, not the week he closed the app').toBe(world.ending!.week)
    expect(block.motherCareer.endingKind, 'the ending id, texture licence only').toBe(world.ending!.type)
  })

  it('⭐⭐ `wasThereAChild` is the ONE predicate the door\'s two texts fork on, and it reads real state now', () => {
    // The hook shipped in v1 returning a literal `false` (`endings.ts`'s own comment records the
    // promise). This is the promise kept, measured on a lived career rather than on a posed one.
    const { world } = walkToEnding(5, 0, 0)
    expect(wasThereAChild(world), 'the predicate answers the world').toBe(world.children.length > 0)
    expect(dynastyHandoverOf(world).raisedOnTour, 'and the block asks it exactly once').toBe(wasThereAChild(world))

    // ⚠ AND THE EPILOGUE VARIANT IS THE ONE THIS CAREER TAKES, which is worth naming rather than
    // implying: a 156-week-plus bench walk under `POLICIES[0]` never marries, so no child is born on
    // tour and the door's text is «роды случились после». The door is open either way – his 20.09
    // ruling – and `handoff.childBorn` is the same read, so the two cannot disagree.
    expect(buildEndingView(world)!.handoff.childBorn, 'the hand-off and the block ask the same question').toBe(
      wasThereAChild(world),
    )
  })

  it('⚠⚠ ...and the OTHER arm, which the walked careers cannot reach – the predicate really reads the array', () => {
    // ⚠⚠ THE CASE ABOVE HAS NO TEETH ON ITS OWN AND THIS ONE IS WHY IT IS HERE. Every career this
    // file can afford to walk ends childless – `POLICIES[0]` never marries inside the walk, and a
    // birth needs a latched episode, a pregnancy and a term – so `return false` (the v1 body) passes
    // the lived case unchanged. Measured, not assumed: reverting `wasThereAChild` leaves the case
    // above GREEN.
    //
    // ⚠ SO THIS ONE POSES `children`, DELIBERATELY, AND THE DISTINCTION IS THE WHOLE JUSTIFICATION:
    // posing state to fake a BEHAVIOUR is the recurring defect wave 8 was full of, and the album test
    // T6 owes must WALK to a birth for exactly that reason. This is a total function of one array –
    // its contract IS «read that array» – so handing it the array is the unit under test and not a
    // shortcut around one. The row is the exact shape `landBirth` writes (`ChildRecord`), so the
    // fixture cannot drift from the writer.
    const world = createWorld('w10-child', DEFAULT_PROFILE)
    expect(wasThereAChild(world), 'week 0, she is eight').toBe(false)
    world.children.push({ bornWeek: 640, sex: 'girl' })
    expect(wasThereAChild(world), 'one row is enough – the door reads a daughter').toBe(true)
    expect(dynastyHandoverOf(world).raisedOnTour, 'and the block forks on it').toBe(true)
  })

  it('⭐⭐⭐ generation two: one root threads the line, and the seed stays deterministic ancestry', () => {
    // ⚠ NO SECOND WALK. The arithmetic under test is `(mother.generation ?? 0) + 1` and the root's
    // survival, and both are answered by a world that CARRIES a record – which is exactly what
    // `createWorld`'s fifth argument builds. Walking a second career to its ending would measure the
    // same two lines at twenty times the cost.
    const { world } = walkToEnding(5, 0, 0)
    const first = dynastyHandoverOf(world)

    const daughter = createWorld(first.childSeed, DEFAULT_PROFILE, 'c-w10-gen2', undefined, first)
    expect(daughter.dynasty, 'the record is persisted at creation').not.toBe(null)
    expect(daughter.dynasty!.generation, 'she is the first daughter').toBe(1)
    expect(daughter.dynasty!.ancestorSeed, 'and the ROOT of the line is her mother\'s own seed').toBe(world.seed)

    const second = dynastyHandoverOf(daughter)
    expect(second.generation, 'her own daughter is generation two').toBe(2)
    expect(second.childSeed, 'and the root is the SAME one, never the mother\'s seed').toBe(
      childSeedFor(world.seed, 2),
    )
    expect(second.childSeed.startsWith(world.seed), 'one root threads every generation').toBe(true)
    expect(ancestorSeedOf(second.childSeed, 2), 'and it comes back out again').toBe(world.seed)

    // ⭐ THE DETERMINISM LAW (§7): the same ancestor taken through the same rulings gives the same
    // girl, always. Two builds of the same block produce the same seed, byte for byte.
    const again = createWorld(first.childSeed, DEFAULT_PROFILE, 'c-w10-gen2', undefined, first)
    expect(JSON.stringify(rec(again)), 'the same block builds the same world').toBe(JSON.stringify(rec(daughter)))
  })
})

// =================================================================================================
// B. THE WEALTH BAND (§4) – MAPPED ONTO THE THREE CORRIDORS THAT EXIST, OFF A CAREER THAT WAS LIVED
// =================================================================================================
//
// ⚠⚠ A MEASUREMENT THIS SECTION OWES THE ARCHITECT, TAKEN BEFORE THE CASES WERE WRITTEN AND
// REPORTED HERE RATHER THAN QUIETLY WORKED AROUND. A 24-cell sweep (presets 0/2/3/5/6/8 × both
// policies × two seeds, walked to an ending or to 1200 weeks) found the band **bimodal**: 12 cells
// landed `working` with `kidFundsCents` of exactly 0 (one at $449) and 12 landed `wealthy` with
// $6.4M–$23.3M. **NOT ONE CELL LANDED `middle`** – the corridor is $25,000–$120,000 in HER OWN
// account, and no career in the sweep ended inside it.
//
// ⚠ THAT ALSO CUTS ACROSS §8's ROW 3 PREDICTION («wealthy for every titled career; middle/working
// only via college-fork and early-leaving mothers»): the `working` cell used below has **31 titles**
// and an injury ending at week 463, so a heavily titled career lands `working` when its titles were
// won on rungs that pay almost nothing. The census belongs to T7's bench over the 168-career corpus
// (§8 row 3) and is carried there rather than guessed at here; what THIS file pins is that the
// mapping is right about the careers it can afford to live.

describe('wave 10 T1 B – the band a career really hands over', () => {
  it('⭐⭐⭐ a career whose own account stayed empty hands over the WORKING corridor', () => {
    const { world, weeks } = walkToEnding(5, 0, 0)
    expect(world.ending, `the walk has to reach an ending (${weeks} weeks)`).not.toBe(null)
    // The career as it was lived: titles on rungs that pay almost nothing, and nothing banked.
    expect(world.kidFundsCents, 'her own account never opened').toBeLessThan(ECONOMY.startingFundsCents.middle)
    expect(dynastyHandoverOf(world).background, 'so the line starts where the money is').toBe('working')
  })

  it('⭐⭐⭐ a career that banked millions hands over the WEALTHY corridor', () => {
    const { world, weeks } = walkToEnding(0, 1, 0)
    expect(world.ending, `the walk has to reach an ending (${weeks} weeks)`).not.toBe(null)
    expect(world.kidFundsCents, 'a star with a cabinet retires wealthy').toBeGreaterThanOrEqual(
      ECONOMY.startingFundsCents.wealthy,
    )
    expect(dynastyHandoverOf(world).background).toBe('wealthy')
    // ⚠ AND THE BAND IS THE **ONLY** THING THAT CROSSES – no special balance, §4's own sentence. The
    // daughter of a $7M mother opens on the wealthy corridor's reserve and not on her mother's money.
    const daughter = createWorld(
      dynastyHandoverOf(world).childSeed,
      DEFAULT_PROFILE,
      'c-w10-band',
      undefined,
      dynastyHandoverOf(world),
    )
    expect(daughter.fundsCents, 'the dynasty invents no fourth corridor').toBe(ECONOMY.startingFundsCents.wealthy)
    expect(daughter.fundsCents, '...and it is nothing like what her mother had').toBeLessThan(world.kidFundsCents)
  })

  it('⚠⚠ the thresholds READ the corridors rather than copying them, at every boundary', () => {
    // ⚠ NOT A POSED WORLD: `dynastyBackgroundOf` is a pure function of cents, so this exercises the
    // MAPPING and never a balance nobody can earn. Every value below is computed from `ECONOMY` – a
    // hand-typed 120_000_00 here would be the second spelling of the corridor that §4 forbids, and
    // it would go on passing the day the economy re-tuned.
    const bands = ECONOMY.startingFundsCents
    expect(dynastyBackgroundOf(bands.wealthy), 'exactly at the wealthy reserve is wealthy').toBe('wealthy')
    expect(dynastyBackgroundOf(bands.wealthy - 1), 'one cent below it is not').toBe('middle')
    expect(dynastyBackgroundOf(bands.middle), 'exactly at the middle reserve is middle').toBe('middle')
    expect(dynastyBackgroundOf(bands.middle - 1), 'one cent below it is not').toBe('working')
    expect(dynastyBackgroundOf(0), 'and an empty account is the working corridor').toBe('working')
    // ⭐ THE MIDDLE CORRIDOR IS REACHABLE BY THE MAPPING even though the sweep above found no career
    // that ends inside it. That distinction is the point of having both halves of this section: the
    // arithmetic is complete, and whether the game ever produces the middle band is a CENSUS question
    // that T7's bench answers over the corpus.
    expect(dynastyBackgroundOf(Math.floor((bands.middle + bands.wealthy) / 2))).toBe('middle')
  })

  it('⚠⚠ a JUNIOR-ONLY career hands over no professional rank and no pro cabinet – the 22.09 review\'s defect, pinned on a lived career', () => {
    // The probe that caught it read «bestRank 3» off an 89-week-old career: `bestRankEver` answers
    // for the highest ladder REACHED, and on a career that never touched the WTA table that is the
    // junior one – so a junior number walked into `motherWasKnown`, whose bar is a WTA rank (D1).
    // This cell ends in its second season, junior shelves only, and is the defect's own shape.
    const { world, weeks } = walkToEnding(2, 0, 0)
    expect(world.ending, `the walk has to reach an ending (${weeks} weeks)`).not.toBe(null)
    expect(weeks, 'ended while the story was still a junior one').toBeLessThan(200)
    const block = dynastyHandoverOf(world)
    expect(block.motherCareer.titles, 'the junior cabinet is real and stays on the block').toBeGreaterThan(0)
    expect(block.motherCareer.proTitles, 'but not one title of it was won on the tour').toBe(0)
    expect(block.motherCareer.bestRank, 'and a junior rank is not a WTA rank – null, not a number').toBe(null)
    // ...and the two consumers stay silent about her, which is what the fix buys:
    const child = createWorld(block.childSeed, DEFAULT_PROFILE, 'c-w10-junior-line', undefined, block)
    expect(motherWasKnown(child.dynasty), 'the press never knew a junior').toBe(false)
    expect(newsStandingOf(child), 'no floor for the daughter').toBe('quiet')
    expect(lineageLicensed(child), 'and no booth line – nothing tour-true to say').toBe(false)
  })
})

// =================================================================================================
// C. THE FIFTH ARGUMENT OPENS NO SECOND CODE PATH
// =================================================================================================

describe('wave 10 T2 C – absent means the career the game has always created', () => {
  it('⭐⭐⭐ passing nothing and passing `undefined` build the same world, byte for byte', () => {
    // `PrologueHandover`'s precedent, verbatim: the absence is the identity rather than a hole.
    const a = createWorld('w10-absent', DEFAULT_PROFILE, 'c-w10-absent')
    const b = createWorld('w10-absent', DEFAULT_PROFILE, 'c-w10-absent', undefined, undefined)
    expect(JSON.stringify(rec(b))).toBe(JSON.stringify(rec(a)))
    expect(a.dynasty, 'and a career with no line behind it says so').toBe(null)
  })

  it('⭐⭐⭐ a block that maps to the SAME background changes EXACTLY one key – there is one literal, not two', () => {
    // ⚠⚠ THE CLAIM THAT MATTERS, AND IT IS A DIFF RATHER THAN A SENTENCE. The fifth argument is
    // allowed to touch `profile.background` (§4's band), the funds that follow from it, and the
    // record itself. Hand it a band the profile already has, and the ONLY key left that may move is
    // `dynasty` – which is what «one code path» means when it is measured instead of asserted.
    const block: DynastyHandover = {
      generation: 1,
      childSeed: 'w10-same:dynasty:1',
      background: DEFAULT_PROFILE.background,
      raisedOnTour: false,
      motherName: { first: 'Alice', last: 'Martin' },
      motherCountry: 'US',
      motherTemperament: 'sunny',
      motherCareer: { titles: 0, proTitles: 0, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'natural' },
    }
    const plain = rec(createWorld('w10-same', DEFAULT_PROFILE, 'c-w10-same'))
    const withLine = rec(createWorld('w10-same', DEFAULT_PROFILE, 'c-w10-same', undefined, block))
    const moved = Object.keys(withLine).filter(
      (k) => JSON.stringify(withLine[k]) !== JSON.stringify(plain[k]),
    )
    expect(moved, 'one key of the whole world, and it is the new one').toEqual(['dynasty'])
  })

  it('⭐⭐ ...and a block that maps to a DIFFERENT background moves the family, which is §4 doing its job', () => {
    // The other arm, and the one that makes the case above non-vacuous: a wealthy line really does
    // open the next career on the wealthy corridor's own reserve, read from `ECONOMY` and never typed.
    const wealthy: DynastyHandover = {
      generation: 1,
      childSeed: 'w10-rich:dynasty:1',
      background: 'wealthy',
      raisedOnTour: true,
      motherName: { first: 'Alice', last: 'Martin' },
      motherCountry: 'US',
      motherTemperament: 'deep',
      motherCareer: { titles: 12, proTitles: 12, bestRank: 3, slams: 2, endedWeek: 1000, endingKind: 'natural' },
    }
    const world = createWorld('w10-rich', { ...DEFAULT_PROFILE, background: 'working' }, 'c-w10-rich', undefined, wealthy)
    expect(world.profile.background, 'the origins card is not asked – the block answers it').toBe('wealthy')
    expect(world.fundsCents, 'and the family opens on the wealthy corridor, read from the constant').toBe(
      ECONOMY.startingFundsCents.wealthy,
    )
    expect(world.dynasty!.motherCareer.slams, 'the cabinet crosses intact').toBe(2)
    // ⚠ NOT AN ALIAS: the engine owns its copy, so mutating the wire object cannot reach the save.
    // ⚠ The wire type is `readonly` all the way down, so the mutation has to be written through a
    // widened view – which is exactly the hole a careless caller would go through, and the reason
    // `createWorld` copies on the way in rather than trusting the type.
    ;(wealthy.motherCareer as { titles: number }).titles = 999
    expect(world.dynasty!.motherCareer.titles, 'the record is a fresh copy of the block, never the block').toBe(12)
  })
})

// =================================================================================================
// D. THE SCHEMA MOVE – `createWorld` AND THE MIGRATION AGREE, AND THE KEEP-BRANCH IS CRAFTED
// =================================================================================================

describe('wave 10 T2 D – v86, one key', () => {
  it('⭐⭐ a fresh career opens at the value the migration back-fills', () => {
    // Two files write this key – `createWorld`'s literal and the v85 -> v86 step – and nothing but
    // this case makes them agree.
    const fresh = createWorld('w10-schema', DEFAULT_PROFILE)
    expect(fresh.dynasty, 'no line behind her, and `null` is the identity rather than a placeholder').toBe(null)
    const migrated = rec(migrateSave(JSON.parse(readFileSync(`${SAVES}/v85.json`, 'utf8'))))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.dynasty, 'and every save in the world is a generation-zero career').toBe(null)
  })

  it('⚠⚠ the step KEEPS a record a save already carries – the `=` arm, crafted because the corpus cannot hold one', () => {
    // ⚠ NO ENGINE PATH ON THIS TREE PRODUCES THIS PAYLOAD: the only producer of a real record is the
    // door, and taking it builds a NEW world at the current version. So the keep-branch of `??=` is
    // unreachable from the golden corpus – all 87 fixtures back-fill – and a plain `=` would pass the
    // whole suite while silently clobbering a dynasty on load. This case is the one that sees it.
    const carried = {
      generation: 3,
      ancestorSeed: 'crafted-root',
      raisedOnTour: true,
      motherName: { first: 'Vera', last: 'Martin' },
      motherTemperament: 'quiet',
      motherCareer: { titles: 4, bestRank: 11, slams: 0, endedWeek: 812, endingKind: 'family' },
    }
    const save = JSON.parse(readFileSync(`${SAVES}/v85.json`, 'utf8'))
    save.dynasty = carried
    const migrated = rec(migrateSave(save))
    expect(migrated.dynasty, 'a line three generations deep survives the upgrade intact').toEqual(carried)
  })

  it('⚠ the step is idempotent – migrating an already-current save changes nothing', () => {
    const once = migrateSave(JSON.parse(readFileSync(`${SAVES}/v86.json`, 'utf8')))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(rec(twice))).toBe(JSON.stringify(rec(once)))
  })

  it('⚠⚠ ...and `dynasty` is the LAST key of `createWorld`\'s literal, which the frozen-career peel depends on', () => {
    // `careerHashAtSchema` reproduces every older schema by dropping exactly the keys appended since,
    // peeling in REVERSE order of arrival – so the literal's order IS the serialisation the live
    // freeze is computed against. The exact claim is CONSECUTIVENESS: v85's three, then v86's one,
    // adjacent and in append order, with nothing of a later wave wedged between them.
    const keys = Object.keys(rec(createWorld('w10-order', DEFAULT_PROFILE)))
    const at = keys.indexOf('comeback')
    expect(at, 'v85\'s last key is there to hand the seat over').toBeGreaterThan(-1)
    expect(keys.slice(at, at + 2), 'and v86 took it').toEqual(['comeback', 'dynasty'])

    // The other half: a MIGRATED save carries it last too, because the step appends to a
    // serialisation that already ends at `comeback`.
    const v86 = Object.keys(JSON.parse(readFileSync(`${SAVES}/v86.json`, 'utf8')))
    expect(v86.slice(-2), 'the golden fixture agrees, at its very end').toEqual(['comeback', 'dynasty'])
  })
})
