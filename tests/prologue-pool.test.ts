// PHASE 3 – THE PROLOGUE'S OWN TOURNAMENT POOL, and the one thing it may never do.
//
// docs/specs/childhood-prologue-build-2026-09.md §7 phase 3: «8-16 local children, no ranking, no
// potential, no career arc, thrown away at the handover. ⚠ It may never enter `world.cohort` or any
// table: the ladder was just repaired and this must not touch it. *Acceptance*: the main cohort's
// composition is byte-identical with and without a prologue; a played Local Open at 10 produces a
// result and a memory and nothing else.»
//
// ⚠⚠ THE ACCEPTANCE SAYS «BYTE-IDENTICAL», SO THIS FILE COMPARES BYTES. The arms below serialise the
// real cohort out of the real `createWorld` and compare the strings – not a length, not a spot check
// on player 0, not `toEqual` over an object graph. The mutation arm is in the file (`it` further
// down): the same comparison run against a cohort that has been drifted by one week fails, so a green
// result here is a green result about something.
//
// ⚠ AND THE STRONGEST GUARD IN THE SLICE IS NOT IN THIS FILE AT ALL – IT IS THE COMPILER. A pool
// child is a `MatchPlayer` and `world.cohort` is `AiPlayer[]`, and neither type is assignable to the
// other in either direction. The two `@ts-expect-error` cases below are how that is asserted: they
// fail the BUILD if the types ever become compatible, which no runtime test can do.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import {
  LOCAL_POOL,
  PROLOGUE_EVENT_PREFIX,
  localOpenEvent,
  herMatches,
  localOpensIn,
  localPool,
  outcomeOf,
  playLocalOpen,
  prologueEntrant,
  prologueSchedule,
  type LocalOpen,
} from '../src/prologue/pool'
import {
  DECISION_AGES,
  PROLOGUE_CARDS,
  TOURNAMENT_ANSWER,
  TWELFTH_WANTS_MORE,
  entryCostCents,
  type PrologueYear,
} from '../src/prologue/cards'
import {
  EMPTY_RUN,
  askAt,
  askOn,
  chosenYears,
  enteredAges,
  enteredIn,
  readTwelfth,
  spentCents,
  withEntry,
  withOrigin,
  withPick,
  yearsLivedBy,
} from '../src/prologue/run'

/** The two roads through the decision cards, named by what the player did – the same pair every
 *  other prologue test uses, so no two files are talking about different childhoods. */
const LIGHT: Record<number, string> = { 8: 'municipal', 9: 'group', 10: 'stay-home', 11: 'ordinary-school', 12: 'let-her-stop' }
const CARRIED: Record<number, string> = { 8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year' }

/** ⭐ A WHOLE RUN DOWN ONE ROAD, with every year's tournament question answered the same way. The
 *  tenth is answered by the road (its question IS its decision); 11, 12 and 13 by `entered`. */
function roadRun(road: Record<number, string>, entered: boolean): import('../src/prologue/run').PrologueRun {
  let run = withOrigin(EMPTY_RUN, 'middle')
  for (const card of PROLOGUE_CARDS) if (card.options) run = withPick(run, card.age, road[card.age])
  const answer = entered ? TOURNAMENT_ANSWER.enter : TOURNAMENT_ANSWER.decline
  for (const age of [11, 12, 13]) run = withEntry(run, age, answer)
  return run
}
import { childhoodArrival } from '../src/engine/childhood'
import { SKILL_KEYS, STARTING_SKILL_BAND } from '../src/engine/development'
import { TIERS } from '../src/engine/season/calendar'
import { createWorld, KID_ID } from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { driftCohort } from '../src/engine/season/cohort'
import { rngFromSeed } from '../src/engine/rng'
import type { MatchPlayer } from '../src/engine/match/types'
import type { AiPlayer } from '../src/engine/season/types'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

/** An ordinary ten-year-old on the game's own scale: the middle of the band `startingSkills` draws
 *  from. She is the girl a MEDIAN childhood produces (engine/childhood.ts normalises the level so a
 *  median childhood is exactly a no-op), which makes her the right control for a field drawn from
 *  the same band. `offset` moves her the way a childhood would. */
function girl(offset = 0): MatchPlayer {
  const skills = {} as Record<string, number>
  for (const k of SKILL_KEYS) {
    const [lo, hi] = STARTING_SKILL_BAND[k]
    skills[k] = (lo + hi) / 2 + offset
  }
  return { id: KID_ID, name: 'Vera Novak', age: 10, ...skills } as MatchPlayer
}

/** A year row the model eats, for the rhythm cases. Deliberately hand-built: some of them are years
 *  the shipped card table cannot produce, and that is the point of them. */
function year(over: Partial<PrologueYear> & { age: number }): PrologueYear {
  return { practice: 0.5, teaching: 0.5, focus: 'general', ...over }
}

describe('the pool is eight local children, and every one of them is ten', () => {
  it('⚠ is inside his 8-16, and is the local rung\'s own draw rather than a number chosen here', () => {
    expect(LOCAL_POOL.size).toBeGreaterThanOrEqual(8)
    expect(LOCAL_POOL.size).toBeLessThanOrEqual(16)
    expect(LOCAL_POOL.size).toBe(TIERS.local.drawSize)
    expect(localPool('seed', 10)).toHaveLength(LOCAL_POOL.size)
  })

  it('⚠ ...and is big enough to fill the draw, which a mutation run found is not free', () => {
    // `buildDraw` fills the bracket from the entrants it is given and `runTournament` reads
    // `Math.log2` of the result, and this engine has no bye machinery (season/types.ts: «POWERS OF
    // TWO ONLY»). A pool below `drawSize - 1` therefore produces a bracket that is not a power of
    // two – not a smaller tournament, a broken one. Found by setting the dial to 4.
    expect(LOCAL_POOL.size).toBeGreaterThanOrEqual(TIERS.local.drawSize - 1)
  })

  it('⭐ every child is the age she was asked for – which is the whole reason the pool exists (§1b)', () => {
    for (const age of [10, 11, 12, 13]) {
      const pool = localPool('seed', age)
      expect(pool.map((p) => p.age)).toEqual(Array(LOCAL_POOL.size).fill(age))
    }
    // ...and NOT the age the world's own field would have been. `COHORT.ageBand` opens at 13, so a
    // ten-year-old entering the shipped Local Open meets thirteen-to-nineteen-year-olds; the whole
    // slice is the gap between these two numbers.
    expect(localPool('seed', 10).every((p) => (p.age ?? 99) < 13)).toBe(true)
  })

  it('is on the game\'s own attribute scale – the exact band startingSkills draws a build from', () => {
    for (const p of localPool('seed', 10)) {
      for (const k of SKILL_KEYS) {
        const [lo, hi] = STARTING_SKILL_BAND[k]
        expect(p[k]).toBeGreaterThanOrEqual(lo)
        expect(p[k]).toBeLessThanOrEqual(hi)
        expect(Number.isInteger(p[k])).toBe(true)
      }
    }
  })

  it('⚠ carries no ranking, no potential, no growth and no career arc – there are no keys for them', () => {
    for (const p of localPool('seed', 10)) {
      expect(Object.keys(p).sort()).toEqual(['age', 'composure', 'groundstrokes', 'id', 'name', 'ret', 'serve', 'stamina'])
      // Named individually as well, because the sorted-keys assertion above would pass a rename.
      expect('potential' in p).toBe(false)
      expect('growth' in p).toBe(false)
      expect('nation' in p).toBe(false)
      expect('ageYears' in p).toBe(false)
    }
  })

  it('no child can be mistaken for her, and none is drawn from the cohort\'s id space', () => {
    for (const p of localPool('seed', 10)) {
      expect(p.id).not.toBe(KID_ID)
      expect(p.id).toMatch(/^local-10-0-\d+$/)
      // `ai-<n>` is the opening field's id shape and `ai-s<season>-<n>` the conveyor's intake.
      expect(p.id.startsWith('ai-')).toBe(false)
    }
  })

  it('is the acceptance list, strongest first, so the two seeds mean something', () => {
    const means = localPool('seed', 10).map((p) => SKILL_KEYS.reduce((s, k) => s + p[k], 0) / SKILL_KEYS.length)
    for (let i = 1; i < means.length; i++) expect(means[i - 1]).toBeGreaterThanOrEqual(means[i])
  })

  it('⚠ is a function of the seed and nothing else – the same career meets the same children twice', () => {
    expect(localPool('seed-one', 10)).toEqual(localPool('seed-one', 10))
    expect(localPool('seed-two', 10)).not.toEqual(localPool('seed-one', 10))
    // ...and the two Opens of one year are two different fields, which is what the index is for.
    expect(localPool('seed-one', 10, 1)).not.toEqual(localPool('seed-one', 10, 0))
  })
})

// =================================================================================================
// ⚠⚠ THE CONSTRAINT THAT MUST NOT BEND
// =================================================================================================

describe('⚠⚠ the pool may never enter world.cohort or any table', () => {
  /** ⭐ THE ACCEPTANCE, LITERALLY. Arm A creates a world and nothing else. Arm B plays the whole
   *  prologue first – every pool of every year, and a full Local Open with her in it – and then
   *  creates the same world from the same seed. The two cohorts are compared as BYTES. */
  function cohortBytes(prologueFirst: boolean): string {
    if (prologueFirst) {
      // ⚠ PHASE 11 WIDENED ARM B AND DID NOT LOOSEN IT. The wired prologue plays up to TWO weekends
      // in a year and draws HER off a sub-stream of her own (`prologueEntrant`), so arm B now taps
      // every generator the shipped walk taps: the field, the bracket, and the girl. An arm that
      // only did what phase 3 did would be proving something the app no longer does.
      // ⚠⚠ AND PHASE 12 WIDENED IT AGAIN, FOR THE SAME REASON. She is `childhoodArrival` over the
      // years she has lived now, so arm B spends a real childhood on the way through – the engine's
      // own module, called from the prologue, before a world exists. If ANY of that reached MAIN,
      // the cohort below would move. It does not, because `childhoodArrival` imports no generator.
      for (let age = LOCAL_POOL.fromAge; age <= 13; age++) {
        const her = prologueEntrant('cohort-proof', KID_ID, 'Vera Novak', age, yearsLivedBy(roadRun(CARRIED, true), age))
        for (let index = 0; index < LOCAL_POOL.maxPerYear; index++) {
          localPool('cohort-proof', age, index)
          playLocalOpen('cohort-proof', her, age, index)
        }
      }
    }
    return JSON.stringify(createWorld('cohort-proof', DEFAULT_PROFILE, 'career-x').cohort)
  }

  /** ⚠ WHAT THIS PROVES TODAY, SAID PLAINLY. In phase 3 the property is STRUCTURAL: the prologue is
   *  handed no world and creates none, and `rngFromSeed` gives every sub-stream its own generator, so
   *  there is no mechanism by which arm B could differ from arm A. The case is still worth its run
   *  twice over. It is the regression guard PHASE 4 will be measured against – that is the phase that
   *  wires the prologue into `createWorld`, and the day a prologue really does run before a world is
   *  built, this is the assertion that says whether it moved the field. And the arm below proves the
   *  comparison is not blind, which is the half a structural argument cannot supply for itself. */
  it('⭐⭐ the main cohort is BYTE-IDENTICAL with and without a prologue', () => {
    const withoutPrologue = cohortBytes(false)
    const withPrologue = cohortBytes(true)
    expect(withPrologue).toBe(withoutPrologue)
    // The anti-vacuity half: a comparison of two empty strings would also pass.
    expect(withoutPrologue.length).toBeGreaterThan(10_000)
    expect(withoutPrologue).toContain('"ai-0"')
  })

  it('...and so is the WHOLE world, which is the stronger claim and the one that would catch a stream', () => {
    const a = JSON.stringify(createWorld('whole-world', DEFAULT_PROFILE, 'career-x'))
    const her = prologueEntrant('whole-world', KID_ID, 'Vera Novak', 10)
    playLocalOpen('whole-world', her, 10)
    playLocalOpen('whole-world', her, 10, 1)
    localPool('whole-world', 11)
    const b = JSON.stringify(createWorld('whole-world', DEFAULT_PROFILE, 'career-x'))
    expect(b).toBe(a)
  })

  it('⚠ AND THE COMPARISON CAN FAIL – the same assertion reddens against a cohort that did move', () => {
    // The mutation arm, in the file. One week of the cohort's own drift is the smallest real change
    // a prologue could have caused if it had reached the world's stream, and it is visible here.
    const moved = createWorld('cohort-proof', DEFAULT_PROFILE, 'career-x')
    driftCohort(moved.cohort, rngFromSeed('anything'), 'cohort-proof')
    expect(JSON.stringify(moved.cohort)).not.toBe(cohortBytes(false))
  })

  it('⭐ not one pool child reaches the world – no id, no name, anywhere in the save', () => {
    const world = createWorld('no-leak', DEFAULT_PROFILE, 'career-x')
    const serialised = JSON.stringify(world)
    const open = playLocalOpen('no-leak', girl(), 10)
    for (const child of open.field) {
      expect(serialised).not.toContain(child.id)
      expect(world.cohort.some((p) => p.id === child.id)).toBe(false)
      expect(world.results.some((r) => r.playerId === child.id)).toBe(false)
    }
    // ...and the mutation arm: a child that IS put in the cohort is found by exactly this check.
    const smuggled = { ...world, cohort: [...world.cohort, open.field[0] as unknown as AiPlayer] }
    expect(JSON.stringify(smuggled)).toContain(open.field[0].id)
  })

  it('⭐⭐ the TYPES refuse it, in both directions – the guard the compiler enforces on every build', () => {
    const child: MatchPlayer = localPool('types', 10)[0]
    const rival: AiPlayer = createWorld('types', DEFAULT_PROFILE, 'career-x').cohort[0]
    // A pool child is not a career: no nation, no growth, no ageYears, no potential.
    // @ts-expect-error a MatchPlayer may not be pushed into world.cohort
    const asRival: AiPlayer = child
    // ...and a rival is not somebody who can play a match on her own: no stored groundstroke.
    // @ts-expect-error an AiPlayer may not be dropped into the prologue's field
    const asChild: MatchPlayer = rival
    // The values are only here so the two bindings are used; the assertion is the build itself.
    expect(asRival.id).toBe(child.id)
    expect(asChild.id).toBe(rival.id)
  })

  /** ⚠⚠ AND THE PIN IS ON THE DIRECT IMPORTS, BECAUSE REACHABILITY IS NOT A GUARD IN THIS CODEBASE
   *  AND I MEASURED IT RATHER THAN ASSUMING IT. The first version of this case walked the transitive
   *  closure of `src/prologue/pool.ts` and asserted `engine/world.ts` was not in it. It is in it – and
   *  so is `engine/world/*` (47 files), through `engine/economy.ts -> shared/protocol.ts ->
   *  shared/protocol/competition.ts -> season/preview.ts -> season/rival.ts -> kidLife.ts ->
   *  world/age.ts`. That path is not new and not the prologue's: `season/tournament.ts` reaches
   *  `engine/world.ts` by the same route, one screen under a comment saying it «cannot import world.ts
   *  (cycle)» – which is true of the DIRECT import it is talking about and false of the closure.
   *  `shared/protocol.ts` is a hub every engine module ends up behind, so a reachability assertion
   *  here would have been a test that can only ever be red, dressed as one that is green.
   *
   *  ⭐ WHAT IS STILL TRUE, AND WORTH PINNING, IS WHAT THE PROLOGUE NAMES. These four lists are the
   *  whole surface `src/prologue` touches, and adding `engine/world` to any of them reddens this with
   *  the file and the specifier named.
   *
   *  ⚠⚠ PHASE 12 MOVED THE CHILDHOOD FROM ONE SIDE OF THAT SENTENCE TO THE OTHER, DELIBERATELY.
   *  `engine/childhood.ts` used to be reachable from nothing here – and that is precisely the refusal
   *  the owner rejected: a Local Open drew her out of `STARTING_SKILL_BAND` with no connection to the
   *  childhood, so «a player who paid for the club, one-to-one hours and the sports school watches
   *  her play exactly like a neglected girl». `pool.ts` names it now, the list below says so, and the
   *  count is still pinned in `tests/childhood.test.ts` from the other end – at exactly two importers
   *  in the whole of `src/`, with the tick-path claim asserted there rather than inferred here.
   *
   *  ⚠ THE CLAIM THAT DID NOT MOVE IS THE ONE ABOUT THE WORLD. No file in `src/prologue` names
   *  `engine/world` or anything under it, and the per-specifier loop below still asserts it. */
  // ⚠ PHASE 4 CHANGED TWO THINGS HERE AND NEITHER WEAKENS IT. `handover.ts` joined the directory and
  // is pinned like its three siblings; and the list is a SET now, because `cards.ts` names
  // `../shared/protocol` twice since the wire type moved there (once to import `SessionKind`, once to
  // re-export `PrologueYear`). What is pinned is which modules the prologue NAMES – the count of
  // times it names one was never the claim, and a duplicate would otherwise redden a pin about
  // reachability for a reason that has nothing to do with reachability.
  it('⚠ the prologue names four modules of the engine and no more – and never the world', () => {
    const files = ['cards.ts', 'handover.ts', 'pool.ts', 'run.ts']
    const imports: Record<string, string[]> = {}
    for (const name of files) {
      const src = readFileSync(join(SRC, 'prologue', name), 'utf8')
      imports[name] = [...new Set([...src.matchAll(/from\s*'(\.[^']*)'/g)].map((m) => m[1]))].sort()
    }
    // ⚠ PHASE 7 ADDED TWO SPECIFIERS AND NEITHER IS AN ENGINE MODULE. `handover.ts` names
    // `../shared/protocol` for the `HandoverBaseBand` key union (the band is decided engine-side and
    // arrives on the snapshot; the copy table is keyed on the wire type so it is TOTAL), and `run.ts`
    // names `../shared/avatarEmotion` for `PortraitEmotion`, the face `moodAt` returns. Both are
    // type-only, both are `shared/`, and the claim under this list – that the prologue never names
    // the world or the childhood – is unchanged and re-asserted below.
    //
    // ⚠⚠ PHASE 9 ADDED TWO MORE TO `handover.ts`, AND THE SECOND IS THE ONE WORTH READING TWICE.
    // The weekly money line divides the player's own total by the weeks the childhood actually took,
    // and both halves of that divisor had to come from somewhere that is not the engine's childhood
    // module: `../shared/dates` for `WEEKS_IN_SEASON` and `./cards` for `CARD_AGES.length`. The
    // natural spelling would have been `CHILDHOOD.startAge`/`endAge` – and it is precisely what
    // `tests/childhood.test.ts` forbids, because that module's importer set is pinned as exactly
    // `['engine/world.ts']`. The card table is the honest source anyway: the sentence is about what
    // the PLAYER walked, and what the player walked is the cards.
    //
    // ⚠ PHASE 11 ADDED ONE, AND IT IS A SIBLING RATHER THAN AN ENGINE MODULE. `handover.ts` names
    // `./run` for `PlayedOpen` – the record of one weekend the run keeps – because the handover's
    // last line is about what she played and the run is what remembers it. Type-only, inside
    // `src/prologue`, and the claim under this list is unchanged: still never the world.
    //
    // ⚠⚠ PHASE 12 ADDED `../engine/childhood` TO `pool.ts`, AND IT IS THE ONE ADDITION HERE THAT IS
    // A REVERSAL RATHER THAN A GROWTH. The header above says why the refusal it replaces was wrong;
    // what it buys is that the girl a Local Open meets is `childhoodArrival` over the years she has
    // lived instead of a bare band draw. The counter-claim moved to `tests/childhood.test.ts`, which
    // pins the whole of `src/` at exactly two importers and proves neither is on the tick path.
    expect(imports).toEqual({
      'cards.ts': ['../shared/protocol'],
      'handover.ts': [
        '../engine/rng',
        '../shared/dates',
        '../shared/money',
        '../shared/protocol',
        './cards',
        './run',
      ],
      'pool.ts': [
        '../engine/childhood',
        '../engine/development',
        '../engine/match/types',
        '../engine/rng',
        '../engine/season/calendar',
        '../engine/season/names',
        '../engine/season/tournament',
        '../engine/season/types',
        './cards',
      ],
      'run.ts': ['../engine/economy', '../shared/avatarEmotion', '../shared/protocol', './cards'],
    })
    // Named as its own claim so the reason survives a future re-pin of the list above.
    //
    // ⚠ THE `childhood` CLAUSE IS NARROWED, NOT DELETED. It used to be a blanket ban and now names
    // the ONE file allowed to reach it, because that is what the owner's fix required and because a
    // clause deleted outright would let `run.ts` or `cards.ts` acquire it in silence. `pool.ts` is
    // the file that composes an entrant; nothing else in this directory has a reason to know how a
    // childhood is spent.
    for (const name of files) {
      for (const spec of imports[name]) {
        expect(spec).not.toMatch(/\/world$/)
        expect(spec).not.toMatch(/\/world\//)
        if (name !== 'pool.ts') expect(spec).not.toMatch(/childhood/)
      }
    }
    expect(imports['pool.ts'].filter((s) => /childhood/.test(s))).toEqual(['../engine/childhood'])
  })

  it('⚠ ...and no prologue module names a thing that could write a world', () => {
    // The other half of the same guard, over CODE with its comments blanked – this file's own prose
    // says `world.cohort` a dozen times and so does pool.ts's header, which is where the design
    // record lives. `stripComments` is the shape tests/coach-voice.test.ts uses, and its failure
    // direction is the safe one: it can only see less text, never more.
    const stripComments = (src: string): string =>
      src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    const banned = ['createWorld', 'generateCohort', 'driftCohort', 'makeJunior', 'ageCohort', 'computeRanking']
    for (const name of ['cards.ts', 'handover.ts', 'pool.ts', 'run.ts']) {
      const code = stripComments(readFileSync(join(SRC, 'prologue', name), 'utf8'))
      for (const symbol of banned) expect(`${name}: ${code.includes(symbol)}`).toBe(`${name}: false`)
      // ...and the scan is real: it can see a symbol that IS there.
      expect(code.includes('export')).toBe(true)
    }
  })
})

// =================================================================================================
// A RESULT AND A MEMORY AND NOTHING ELSE
// =================================================================================================

describe('a played Local Open produces a result and a memory and nothing else', () => {
  // ⚠ PLAYED INSIDE THE CASES AND NOT AT COLLECT TIME. A dial that cannot fill the draw throws
  // inside `runTournament`, and at collect time that takes the whole FILE down – including the case
  // above whose only job is to explain why. Lazy, so the diagnosis survives the defect.
  const open = (): LocalOpen => playLocalOpen('one-weekend', girl(), 10)

  it('runs the real bracket – eight in the draw, seven matches, three rounds', () => {
    const o = open()
    expect(o.rounds).toBe(3)
    expect(o.result.matches).toHaveLength(7)
    expect(Object.keys(o.result.finishes)).toHaveLength(8)
    // She is in it, and so are seven of the eight children – the weakest missed the cut, exactly as
    // `buildDraw` has always bumped the weakest entrant when she takes a place.
    expect(o.result.finishes[KID_ID]).toBeDefined()
    const children = o.field.filter((c) => c.id in o.result.finishes)
    expect(children).toHaveLength(LOCAL_POOL.size - 1)
    expect(o.field[LOCAL_POOL.size - 1].id in o.result.finishes).toBe(false)
  })

  it('⭐ her matches run the full point engine under a replayable seed', () => {
    const o = open()
    const hers = o.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
    expect(hers.length).toBeGreaterThanOrEqual(1)
    for (const m of hers) {
      expect(m.seed).toBe(`one-weekend:${o.event.id}:r${m.round}`)
      expect(m.score).toMatch(/^\d+-\d+( \d+-\d+)*$/)
    }
  })

  it('⚠⚠ carries NO ranking points – there is no field for them and the table is never read', () => {
    const o = open()
    expect(Object.keys(o).sort()).toEqual(['event', 'field', 'finish', 'result', 'rounds', 'wins'])
    expect('points' in o).toBe(false)
    // The rung DOES have points, which is what makes the absence a decision rather than an oversight.
    expect(TIERS.local.points).toEqual([30, 18, 10, 0])
    const pointsIfCounted = TIERS.local.points[o.finish]
    expect(JSON.stringify(o)).not.toContain(`"points"`)
    // ...and the memory says what she did without ever naming that number.
    expect(o.wins).toBe(o.rounds - o.finish)
    expect(typeof pointsIfCounted).toBe('number')
  })

  it('⚠ the event is unmistakably the prologue\'s, and cannot collide with a world event', () => {
    const e = localOpenEvent(10)
    expect(e.id.startsWith(PROLOGUE_EVENT_PREFIX)).toBe(true)
    // A world event id is `${year}-w${week}-${tier}` and therefore always begins with a digit.
    expect(/^\d/.test(e.id)).toBe(false)
    const world = createWorld('ids', DEFAULT_PROFILE, 'career-x')
    expect(world.season.length).toBeGreaterThan(0)
    for (const ev of world.season) expect(ev.id.startsWith(PROLOGUE_EVENT_PREFIX)).toBe(false)
    // Its week is before the game starts, and outside the 52-week window a season counts over.
    expect(e.week).toBeLessThan(-52)
    // And it charges no travel: the card already bills the weekend (run.ts's `spentCents`).
    expect(e.travelCostCents).toBe(0)
  })

  it('⚠ the module holds nothing between calls – the same weekend replays, a different one does not', () => {
    expect(playLocalOpen('one-weekend', girl(), 10)).toEqual(open())
    expect(playLocalOpen('one-weekend', girl(), 10, 1)).not.toEqual(open())
    expect(playLocalOpen('another', girl(), 10)).not.toEqual(open())
  })

  it('⭐ and the weekend is worth playing – a better childhood wins it more often, measured', () => {
    // Invariant 5: this is the balance claim, so it is measured rather than asserted. `swingPoints`
    // is 2.4, so ±4 comfortably brackets what nine years can be worth.
    const titles = (offset: number): number => {
      let n = 0
      for (let i = 0; i < 200; i++) if (playLocalOpen(`m${i}`, girl(offset), 10).finish === 0) n++
      return n
    }
    const weak = titles(-4)
    const ordinary = titles(0)
    const strong = titles(4)
    expect(weak).toBeLessThan(ordinary)
    expect(ordinary).toBeLessThan(strong)
    // ...and no arm is degenerate: an ordinary ten-year-old can win her local open and can lose early.
    expect(ordinary).toBeGreaterThan(5)
    expect(ordinary).toBeLessThan(120)
  })
})

// =================================================================================================
// THE RHYTHM
// =================================================================================================

describe('⭐ a tournament a year from ten, asked every year – his rhythm', () => {
  it('⚠ none before ten, whatever the player bought', () => {
    for (const age of [5, 6, 7, 8, 9]) {
      expect(localOpensIn(year({ age }), true), `age ${age}`).toBe(0)
    }
    expect(localOpensIn(year({ age: 10 }), true)).toBeGreaterThan(0)
  })

  // ⚠⚠ PHASE 11 REPLACED THE CASE THAT USED TO STAND HERE, TWICE, AND BOTH REPLACEMENTS ARE THE
  // OWNER'S CORRECTIONS RATHER THAN A WEAKENING.
  //   * It first read «none in a year she did not play matches», asserting that a year whose own
  //     `focus` is not `matchplay` holds nothing – which is exactly the reading that produced
  //     «сейчас этого нет»: no card at 11, 12 or 13 is a matchplay year, so a whole childhood held
  //     one weekend.
  //   * It then read «none in a childhood the player never ENTERED», with the tenth's answer carried
  //     forward as a state. THE OWNER: «Сказали "не в этом году" – значит не в этом году, дальше
  //     тоже можно спрашивать.» A refusal is not a switch.
  // What stands is the year-by-year property: a year holds a weekend if and only if the player said
  // yes THAT YEAR, and the answer to one year says nothing about any other.
  it('⭐⭐ a year holds a weekend if and only if the player said yes THAT year', () => {
    for (const age of [10, 11, 12, 13]) {
      expect(localOpensIn(year({ age }), false), `age ${age}`).toBe(0)
      expect(localOpensIn(year({ age }), true), `age ${age}`).toBe(1)
    }
    const years = [10, 11, 12, 13].map((age) => year({ age }))
    // ⭐ SAYING NO ONE YEAR DOES NOT CLOSE THE NEXT – the whole of his correction, in one case.
    expect(prologueSchedule(years, [11, 13])).toEqual([
      { age: 11, index: 0 },
      { age: 13, index: 0 },
    ])
    // ...and a childhood that never said yes holds none at all.
    expect(prologueSchedule(years, [])).toEqual([])
    // ...and one that said yes every year holds one a year, which is his floor.
    expect(prologueSchedule(years, [10, 11, 12, 13]).map((o) => o.age)).toEqual([10, 11, 12, 13])
  })

  it('⚠ a yes below his floor still buys nothing – the age is a floor and not a card rule', () => {
    const early = [8, 9, 10].map((age) => year({ age }))
    expect(prologueSchedule(early, [8, 9, 10])).toEqual([{ age: 10, index: 0 }])
  })

  // ⭐⭐ ONE YES, ONE WEEKEND – and it is a reading of his correction, not of his range. The cap is
  // still «1-2 a year»; what changed is that the question is asked once a year, so a year that
  // quietly produced two weekends would be the game deciding something it had just asked about.
  it('⭐ one yes buys exactly one weekend, at any age and any effort, and never more than his cap', () => {
    for (let age = 5; age <= 13; age++) {
      for (const practice of [0, 0.5, 1, 4]) {
        const n = localOpensIn(year({ age, practice }), true)
        expect(n, `age ${age}, practice ${practice}`).toBeLessThanOrEqual(LOCAL_POOL.maxPerYear)
        expect(n, `age ${age}, practice ${practice}`).toBe(age < LOCAL_POOL.fromAge ? 0 : 1)
      }
    }
    expect(LOCAL_POOL.maxPerYear).toBe(2)
  })

  // ⭐⭐⭐ THE ACCEPTANCE, AGAINST THE REAL CARD TABLE. His ruling: «надо с 10 лет по 1 хотя бы
  // добавить в год» – so a player who says yes every year gets a weekend at 10, 11, 12 and 13, and
  // one who says no every year gets none. The counts are computed off the table, not typed.
  it('⭐⭐ across the real card table: yes every year is 10, 11, 12 and 13; no every year is none', () => {
    const perYear = (rows: { age: number }[]) => [10, 11, 12, 13].map((a) => rows.filter((o) => o.age === a).length)

    // ⚠ «NO EVERY YEAR» HAS TO ANSWER THE TENTH TOO, and the tenth's answer is its own OPTION rather
    // than the lighter ask – so the road, not the flag, is what refuses there. Getting this wrong is
    // how a «he said no» arm quietly still plays a weekend at ten.
    const yesRun = roadRun(CARRIED, true)
    const noRun = roadRun({ ...CARRIED, 10: 'stay-home' }, false)
    const yes = prologueSchedule(chosenYears(yesRun), enteredAges(yesRun))
    const no = prologueSchedule(chosenYears(noRun), enteredAges(noRun))
    console.log(
      `\n  LOCAL OPENS PER YEAR (10, 11, 12, 13)\n` +
        `  yes every year: ${perYear(yes).join(', ')}\n` +
        `  no every year:  ${perYear(no).join(', ')}\n`,
    )
    for (const age of [10, 11, 12, 13]) {
      expect(yes.filter((o) => o.age === age).length, `age ${age}`).toBe(1)
    }
    expect(yes.filter((o) => o.age < LOCAL_POOL.fromAge)).toEqual([])
    expect(no).toEqual([])
  })

  // ⭐ THE OWNER'S OWN CASE: «not this year» at ten, and the question comes back at eleven.
  it('⭐⭐ saying no at ten does not close eleven, twelve or thirteen', () => {
    let run = withOrigin(EMPTY_RUN, 'middle')
    for (const card of PROLOGUE_CARDS) if (card.options) run = withPick(run, card.age, CARRIED[card.age] ?? card.options[0].id)
    run = withPick(run, 10, 'stay-home')
    // The tenth is answered and closed; the eleventh still asks.
    expect(enteredIn(10, run)).toBe(false)
    expect(askAt(11, run), 'the eleventh stopped asking after a refusal at ten').toBeTruthy()
    run = withEntry(run, 11, TOURNAMENT_ANSWER.enter)
    run = withEntry(run, 12, TOURNAMENT_ANSWER.decline)
    run = withEntry(run, 13, TOURNAMENT_ANSWER.enter)
    expect(enteredAges(run)).toEqual([11, 13])
    expect(prologueSchedule(chosenYears(run), enteredAges(run)).map((o) => o.age)).toEqual([11, 13])
  })
})

// =================================================================================================
// ⭐⭐ THE ESCALATION – the same question, asked by somebody else each year
// =================================================================================================

describe('⭐⭐ the asking escalates: an event, then the coach, then her', () => {
  it('⚠ every year from eleven asks, and the tenth asks through its own decision', () => {
    const run = roadRun(CARRIED, true)
    // 11, 12 and 13 carry the lighter ask; the tenth's question IS its two options.
    for (const age of [11, 12, 13]) expect(askOn(age, EMPTY_RUN), `age ${age}`).toBeTruthy()
    for (const age of [5, 6, 7, 8, 9, 10]) expect(askOn(age, EMPTY_RUN), `age ${age}`).toBeNull()
    expect(PROLOGUE_CARDS.find((c) => c.age === 10)!.options!.some((o) => o.focus === 'matchplay')).toBe(true)
    expect(enteredIn(10, run)).toBe(true)
  })

  it('⭐⭐ and it is a different voice each year – the coach, then the coach again, then her', () => {
    const eleven = askOn(11, EMPTY_RUN)!
    const twelveTired = askOn(12, roadRun(LIGHT, false))!
    const twelveWantsMore = askOn(12, roadRun(CARRIED, true))!
    const thirteen = askOn(13, EMPTY_RUN)!
    const asks = [eleven.lede, twelveTired.lede, twelveWantsMore.lede, thirteen.lede]
    console.log(`\n  THE ASKING, YEAR BY YEAR\n  ${asks.map((a, i) => `${[11, 12, 12, 13][i]}: ${a}`).join('\n  ')}\n`)
    // Four different sentences: the same question is never asked the same way twice.
    expect(new Set(asks).size).toBe(4)
    // The coach carries the middle years; by thirteen nobody is telling you – she is.
    expect(eleven.lede).toContain('coach')
    expect(twelveTired.lede).toContain('coach')
    expect(thirteen.lede).not.toContain('coach')
    expect(thirteen.lede.startsWith('She ')).toBe(true)
    // ⚠ AND THE FORK'S OWN FACE ASKS IN HER VOICE A YEAR EARLIER, which is what makes the escalation
    // run through the childhood rather than beside it.
    expect(twelveWantsMore.lede).not.toContain('coach')
    expect(twelveWantsMore.lede.startsWith('She ')).toBe(true)
  })

  it('⚠ the ask is not a decision – it buys no year, and `DECISION_AGES` is unmoved', () => {
    expect(DECISION_AGES).toEqual([8, 9, 10, 11, 12])
    for (const card of [...PROLOGUE_CARDS, TWELFTH_WANTS_MORE]) {
      if (!card.tournament) continue
      // The ask carries copy and nothing that shapes a year.
      expect(Object.keys(card.tournament).sort()).toEqual([
        'declineLabel',
        'declineNote',
        'enterLabel',
        'enterNote',
        'lede',
      ])
    }
    // ...and the thirteenth still has no `options`, which is the sense `DECISION_AGES` measures.
    expect(PROLOGUE_CARDS.find((c) => c.age === 13)!.options).toBeUndefined()
  })

  it('⭐ an entry costs the tenth card`s own difference, and it is never billed twice', () => {
    const tenth = PROLOGUE_CARDS.find((c) => c.age === 10)!
    const [home, enter] = [...tenth.options!].sort((a, b) => a.costCents - b.costCents)
    expect(entryCostCents()).toBe(enter.costCents - home.costCents)

    let run = roadRun(CARRIED, false)
    const nothing = spentCents(run)
    run = withEntry(run, 11, TOURNAMENT_ANSWER.enter)
    expect(spentCents(run) - nothing).toBe(entryCostCents())
    // ⚠ THE TENTH IS NOT CHARGED A SECOND TIME: its price is inside the option the player took.
    const stayed = roadRun({ ...CARRIED, 10: 'stay-home' }, false)
    const entered = roadRun(CARRIED, false)
    expect(spentCents(entered) - spentCents(stayed)).toBe(entryCostCents())
  })
})

// =================================================================================================
// ⭐⭐ WHAT THE FORK READS NOW – measured on both roads, because the count`s input moved
// =================================================================================================

describe('⭐⭐ the twelfth`s fork still splits, with tournaments counted per year', () => {
  it('⭐ quoted: what `readTwelfth` reads on the two roads, with and without the entries', () => {
    const rows: string[] = []
    for (const [name, road] of [['light', LIGHT], ['carried', CARRIED]] as const) {
      for (const entered of [false, true]) {
        const run = roadRun(road as Record<number, string>, entered)
        const read = readTwelfth(run)
        rows.push(
          `${name.padEnd(8)} ${entered ? 'entered every year' : 'entered none     '} -> ` +
            `oneToOne ${read.oneToOne}, tournaments ${read.tournaments}, light ${read.light} => ${read.reading}`,
        )
      }
    }
    console.log(`\n  WHAT THE TWELFTH READS\n  ${rows.join('\n  ')}\n`)

    // ⭐⭐ THE FORK STILL SPLITS ON THE CHILDHOOD, which is §2.5's whole claim: the road decides the
    // face, on either answer to the tournament question.
    for (const entered of [false, true]) {
      expect(readTwelfth(roadRun(LIGHT, entered)).reading, `light, entered=${entered}`).toBe('tired')
      expect(readTwelfth(roadRun(CARRIED, entered)).reading, `carried, entered=${entered}`).toBe('wants-more')
    }
    // ...and the count really moved: entering at ten AND eleven is two, not one.
    expect(readTwelfth(roadRun(CARRIED, true)).tournaments).toBe(2)
    expect(readTwelfth(roadRun(CARRIED, false)).tournaments).toBe(1)
    expect(readTwelfth(roadRun(LIGHT, false)).tournaments).toBe(0)
  })

  it('⚠ ...and a refusal really can move the light road, which is the honest half of that', () => {
    // The light road refuses at ten, so entering at ELEVEN is its only tournament. It is one signal
    // against `light`'s three, so the reading is unchanged – but the number is not, and a fork that
    // silently ignored the entries would print the same three counts either way.
    const refused = readTwelfth(roadRun(LIGHT, false))
    const entered = readTwelfth(roadRun(LIGHT, true))
    expect(entered.tournaments).toBeGreaterThan(refused.tournaments)
    expect(entered.reason).not.toBe(refused.reason)
  })
})

// =================================================================================================
// ⭐⭐ WHAT THE WEEKEND CAME TO – phase 11
// =================================================================================================

describe('⭐⭐ the three faces of a result, and they are the owner\'s own split', () => {
  it('⭐ the title, the final, and out before it – read off the finish index and nothing else', () => {
    const open = (finish: number): LocalOpen =>
      ({ finish, rounds: 3, wins: 3 - finish }) as unknown as LocalOpen
    expect(outcomeOf(open(0))).toBe('won')
    expect(outcomeOf(open(1))).toBe('final')
    for (const finish of [2, 3]) expect(outcomeOf(open(finish))).toBe('lost')
  })

  it('⚠ and `final` really is the match she lost on the last day – checked against a played bracket', () => {
    // The anti-vacuity half: every arm below comes out of a REAL draw rather than a hand-built
    // object, so the arithmetic that maps a lost final onto `finish === 1` is the bracket's own.
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const played = playLocalOpen(`outcomes-${i}`, girl(), 10)
      const outcome = outcomeOf(played)
      seen.add(outcome)
      if (outcome === 'won') expect(played.wins).toBe(played.rounds)
      if (outcome === 'final') expect(played.wins).toBe(played.rounds - 1)
      if (outcome === 'lost') expect(played.wins).toBeLessThan(played.rounds - 1)
    }
    // ...and all three are reachable by an ordinary ten-year-old, or the case above is decoration.
    expect([...seen].sort()).toEqual(['final', 'lost', 'won'])
  })

  it('⭐ her matches come back in the order she played them, every one replayable', () => {
    for (let i = 0; i < 40; i++) {
      const kid = girl()
      const played = playLocalOpen(`hers-${i}`, kid, 10)
      const mine = herMatches(played, kid.id)
      expect(mine.length).toBe(played.finish === 0 ? played.rounds : played.wins + 1)
      expect(mine.map((m) => m.round)).toEqual([...mine.map((m) => m.round)].sort((a, b) => a - b))
      for (const rec of mine) {
        expect(rec.aId === kid.id || rec.bId === kid.id).toBe(true)
        // ⚠ THE SEED IS WHAT MAKES A SCREEN ABLE TO SHOW THIS. `playMatch` writes it on every match
        // she played and on no AI-AI row, so a viewer can re-simulate exactly what the bracket did.
        expect(rec.seed, `round ${rec.round} carries no seed`).toBeTruthy()
      }
      // ...and the rows that are NOT hers carry none, which is what makes the filter meaningful.
      const theirs = played.result.matches.filter((m) => m.aId !== kid.id && m.bId !== kid.id)
      expect(theirs.length).toBeGreaterThan(0)
      for (const rec of theirs) expect(rec.seed).toBeUndefined()
    }
  })
})

describe('⭐ she enters on the game\'s own band, drawn once for the whole childhood', () => {
  it('⭐⭐ the same girl, a year older – one draw, and `age` is the only thing that moves', () => {
    const ten = prologueEntrant('entrant', KID_ID, 'Vera Novak', 10)
    const thirteen = prologueEntrant('entrant', KID_ID, 'Vera Novak', 13)
    expect(ten.age).toBe(10)
    expect(thirteen.age).toBe(13)
    for (const k of SKILL_KEYS) expect(thirteen[k]).toBe(ten[k])
    expect(thirteen.id).toBe(KID_ID)
  })

  it('⚠ on the exact band the eight children are drawn from – she is the ninth, not a visitor', () => {
    for (let i = 0; i < 50; i++) {
      const her = prologueEntrant(`band-${i}`, KID_ID, 'Vera Novak', 10)
      for (const k of SKILL_KEYS) {
        const [lo, hi] = STARTING_SKILL_BAND[k]
        expect(her[k], `${k} out of band`).toBeGreaterThanOrEqual(lo)
        expect(her[k], `${k} out of band`).toBeLessThanOrEqual(hi)
      }
    }
    // ...and a different career draws a different girl, so nothing above is pinned to one lucky seed.
    const a = prologueEntrant('one', KID_ID, 'A', 10)
    const b = prologueEntrant('two', KID_ID, 'A', 10)
    expect(SKILL_KEYS.some((k) => a[k] !== b[k])).toBe(true)
  })

  it('⚠ and her sub-stream is her own – drawing her does not move the field', () => {
    const withoutHer = JSON.stringify(localPool('stream', 10))
    prologueEntrant('stream', KID_ID, 'Vera Novak', 10)
    expect(JSON.stringify(localPool('stream', 10))).toBe(withoutHer)
  })
})

// =================================================================================================
// ⭐⭐ PHASE 12 – THE YEARS SHOW ON THE COURT
// =================================================================================================
//
// THE DEFECT, in the owner's own words: at a Local Open she was drawn as «a ninth child out of
// STARTING_SKILL_BAND, with no connection to the childhood», so «a player who paid for the club,
// one-to-one hours and the sports school watches her play exactly like a neglected girl».
//
// ⚠ THE CONTROL HE ASKED FOR BY NAME is the last block: the eight opponents are drawn from the
// FOURTEEN-year-old band, and phase 3's justification for that («basePServe reads only the
// DIFFERENCE, so the absolute level cancels») holds only while SHE is drawn from the same band.
// Once her build comes from a partial childhood she could sit systematically below them and a
// ten-year-old's tournament would become a guaranteed first-round exit. Measured below and, at
// twenty thousand seeds a cell, in `npm run bench:court` / docs/specs/childhood-on-court-2026-09.md.

describe('⭐⭐ the girl a Local Open meets is the childhood the player bought', () => {
  /** The years she has lived by the weekend at `age`, down one road – exactly what the screen's
   *  `kidAt` passes (`yearsLivedBy(run, age)`). */
  const lived = (road: Record<number, string>, age: number) => yearsLivedBy(roadRun(road, true), age)

  it('⭐⭐ her build IS `childhoodArrival` over the years lived – not a bare band draw', () => {
    for (const age of [10, 11, 12, 13]) {
      for (const road of [LIGHT, CARRIED]) {
        const born = prologueEntrant(`entrant-${age}`, KID_ID, 'Vera Novak', age)
        const played = prologueEntrant(`entrant-${age}`, KID_ID, 'Vera Novak', age, lived(road, age))
        // The engine's own handover arithmetic, called on the same born build. If this file grew a
        // strength model of its own, this line is what would go red.
        expect(played, `${age}`).toEqual({ ...born, ...childhoodArrival(born, lived(road, age)) })
        // ⚠ THE MUTATION ARM. Reverting `prologueEntrant` to the phase-11 band draw makes her equal
        // to `born`, and these two lines are what would catch it.
        expect(SKILL_KEYS.some((k) => played[k] !== born[k]), `${age} is still the band draw`).toBe(true)
        expect(played.id).toBe(born.id)
        expect(played.age).toBe(age)
      }
    }
  })

  it('⚠ and with no years she is the phase-11 girl, to the hundredth – the default is not a fudge', () => {
    const born = prologueEntrant('unchanged', KID_ID, 'Vera Novak', 10)
    expect(prologueEntrant('unchanged', KID_ID, 'Vera Novak', 10, [])).toEqual(born)
    for (const k of SKILL_KEYS) expect(Number.isInteger(born[k])).toBe(true)
  })

  it('⭐ she is still inside the band the eight children come from – the clamp holds at every age', () => {
    for (const age of [10, 11, 12, 13]) {
      for (const road of [LIGHT, CARRIED]) {
        for (let i = 0; i < 40; i++) {
          const her = prologueEntrant(`band12-${i}`, KID_ID, 'Vera Novak', age, lived(road, age))
          for (const k of SKILL_KEYS) {
            const [lo, hi] = STARTING_SKILL_BAND[k]
            expect(her[k], `${k} at ${age}`).toBeGreaterThanOrEqual(lo)
            expect(her[k], `${k} at ${age}`).toBeLessThanOrEqual(hi)
          }
        }
      }
    }
  })

  it('⭐⭐ the gap is SMALL AT TEN AND VISIBLE AT THIRTEEN – and it grows with every year between', () => {
    const meanOf = (p: MatchPlayer) => SKILL_KEYS.reduce((s, k) => s + p[k], 0) / SKILL_KEYS.length
    const gaps = [10, 11, 12, 13].map((age) => {
      let total = 0
      for (let i = 0; i < 400; i++) {
        const seed = `gap-${i}`
        total +=
          meanOf(prologueEntrant(seed, KID_ID, 'V N', age, lived(CARRIED, age))) -
          meanOf(prologueEntrant(seed, KID_ID, 'V N', age, lived(LIGHT, age)))
      }
      return total / 400
    })
    for (let i = 1; i < gaps.length; i++) expect(gaps[i], `age ${10 + i}`).toBeGreaterThan(gaps[i - 1])
    // The bench's own numbers at 20k seeds: 0.49 at ten, 2.38 at thirteen. Four hundred seeds is
    // enough for the SHAPE, which is what this pin is about.
    expect(gaps[0]).toBeLessThan(0.8)
    expect(gaps[3]).toBeGreaterThan(2)
    expect(gaps[3] / gaps[0]).toBeGreaterThan(3)
  })

  it('⚠⚠ the thirteenth year is not lived at twelve – `yearsLivedBy` cuts at the weekend`s own age', () => {
    // The off-by-a-year that would have flattened the gradient. The thirteenth year is
    // `sameAsLastYear`, so `yearsSoFar` reports NINE the moment the twelfth card is answered.
    const run = roadRun(CARRIED, true)
    expect(lived(CARRIED, 10).map((y) => y.age)).toEqual([5, 6, 7, 8, 9, 10])
    expect(lived(CARRIED, 12).map((y) => y.age)).toEqual([5, 6, 7, 8, 9, 10, 11, 12])
    expect(lived(CARRIED, 13).map((y) => y.age)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13])
    // ...and the mutation arm: the uncut list is nine years at TWELVE, which is the bug.
    expect(chosenYears(run)).toHaveLength(9)
    // A weekend's childhood is a PREFIX, so a decision taken later cannot change a year already
    // played – walking only as far as the tenth card gives the identical six years.
    let partial = withOrigin(EMPTY_RUN, 'middle')
    for (const card of PROLOGUE_CARDS) {
      if (card.age > 10) break
      if (card.options) partial = withPick(partial, card.age, CARRIED[card.age])
    }
    expect(yearsLivedBy(partial, 10)).toEqual(lived(CARRIED, 10))
  })
})

// =================================================================================================
// ⚠⚠ THE CONTROL – IS A FOURTEEN-YEAR-OLD'S BAND STILL THE RIGHT FIELD FOR HER?
// =================================================================================================

describe('⚠⚠ the field is still fair at every age – she is neither hopeless nor unbeatable', () => {
  const lived = (road: Record<number, string>, age: number) => yearsLivedBy(roadRun(road, true), age)
  const SEEDS = 500

  /** Her finish distribution over `SEEDS` careers – the real bracket, the real point engine. */
  function finishes(age: number, road: Record<number, string>) {
    const years = lived(road, age)
    const t = { title: 0, exit: 0, wins: 0 }
    for (let i = 0; i < SEEDS; i++) {
      const seed = `control-${i}`
      const open = playLocalOpen(seed, prologueEntrant(seed, KID_ID, 'V N', age, years), age)
      if (open.finish === 0) t.title++
      if (open.finish === open.rounds) t.exit++
      t.wins += open.wins
    }
    return { title: t.title / SEEDS, exit: t.exit / SEEDS, wins: t.wins / SEEDS }
  }

  it('⭐⭐ no age is degenerate – she neither always loses at ten nor always wins at thirteen', () => {
    for (const age of [10, 11, 12, 13]) {
      for (const road of [LIGHT, CARRIED]) {
        const f = finishes(age, road)
        // A first-round exit is what a random one of eight gets half the time; «essentially always»
        // would be four fifths. The bench measures 48-55% at every cell, at 20k seeds.
        expect(f.exit, `${age} exit`).toBeLessThan(0.7)
        expect(f.exit, `${age} exit`).toBeGreaterThan(0.3)
        // ...and the title is 12.5% for a random one of eight. The bench measures 9-14%.
        expect(f.title, `${age} title`).toBeLessThan(0.3)
        expect(f.title, `${age} title`).toBeGreaterThan(0.03)
      }
    }
  })

  it('⭐⭐ the roads differ IN HER FAVOUR, and the difference grows with age', () => {
    const swing = [10, 13].map((age) => finishes(age, CARRIED).wins - finishes(age, LIGHT).wins)
    // The devoted road wins more matches than the light one at both ends...
    for (const s of swing) expect(s).toBeGreaterThan(0)
    // ...and by more at thirteen than at ten, which is the whole shape of the phase. The bench's
    // own numbers at 20k seeds: +0.04 matches a weekend at ten, +0.18 at thirteen.
    expect(swing[1]).toBeGreaterThan(swing[0])
  })

  it('⭐ SHE IS NOT SYSTEMATICALLY BELOW THE FIELD – the fourteen-year-old band is still hers too', () => {
    // ⚠ THE ARGUMENT PHASE 3 MADE, RE-CHECKED UNDER PHASE 12'S BUILD. The eight children come from
    // `STARTING_SKILL_BAND`, which is the fourteen-year-old band, and that was safe because she was
    // drawn from it too. She is not a bare draw any more – so this measures the thing that changed:
    // her mean against the field's, on the road that hurts her most, at the age it hurts most.
    const meanOf = (p: MatchPlayer) => SKILL_KEYS.reduce((s, k) => s + p[k], 0) / SKILL_KEYS.length
    let her = 0
    let field = 0
    for (let i = 0; i < 400; i++) {
      const seed = `fair-${i}`
      her += meanOf(prologueEntrant(seed, KID_ID, 'V N', 13, lived(LIGHT, 13)))
      const pool = localPool(seed, 13)
      field += pool.reduce((s, p) => s + meanOf(p), 0) / pool.length
    }
    her /= 400
    field /= 400
    // The worst cell in the whole table, and she is barely more than a point under the field – a
    // fifth of the band's own width on the narrowest axis. The bench: 47.22 against 48.40.
    expect(field - her).toBeLessThan(2)
    expect(field - her).toBeGreaterThan(0)
  })
})
