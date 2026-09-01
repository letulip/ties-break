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
  localOpensIn,
  localPool,
  playLocalOpen,
  prologueSchedule,
  type LocalOpen,
} from '../src/prologue/pool'
import { PROLOGUE_CARDS, type PrologueYear } from '../src/prologue/cards'
import { EMPTY_RUN, chosenYears, withOrigin, withPick } from '../src/prologue/run'
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
      const her = girl()
      for (let age = LOCAL_POOL.fromAge; age <= 13; age++) {
        localPool('cohort-proof', age)
        playLocalOpen('cohort-proof', { ...her, age }, age)
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
    const her = girl()
    playLocalOpen('whole-world', her, 10)
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
   *  the file and the specifier named. The measured exception is the one that matters:
   *  `engine/childhood.ts` is reachable from NOTHING here, which is phase 1's own guarantee and is
   *  pinned where it belongs, in tests/childhood.test.ts. */
  it('⚠ the prologue names four modules of the engine and no more – and never the world', () => {
    const files = ['cards.ts', 'pool.ts', 'run.ts']
    const imports: Record<string, string[]> = {}
    for (const name of files) {
      const src = readFileSync(join(SRC, 'prologue', name), 'utf8')
      imports[name] = [...src.matchAll(/from\s*'(\.[^']*)'/g)].map((m) => m[1]).sort()
    }
    expect(imports).toEqual({
      'cards.ts': ['../shared/protocol'],
      'pool.ts': [
        '../engine/development',
        '../engine/match/types',
        '../engine/rng',
        '../engine/season/calendar',
        '../engine/season/names',
        '../engine/season/tournament',
        '../engine/season/types',
        './cards',
      ],
      'run.ts': ['../engine/economy', '../shared/protocol', './cards'],
    })
    // Named as its own claim so the reason survives a future re-pin of the list above.
    for (const name of files) {
      for (const spec of imports[name]) {
        expect(spec).not.toMatch(/\/world$/)
        expect(spec).not.toMatch(/\/world\//)
        expect(spec).not.toMatch(/childhood/)
      }
    }
  })

  it('⚠ ...and no prologue module names a thing that could write a world', () => {
    // The other half of the same guard, over CODE with its comments blanked – this file's own prose
    // says `world.cohort` a dozen times and so does pool.ts's header, which is where the design
    // record lives. `stripComments` is the shape tests/coach-voice.test.ts uses, and its failure
    // direction is the safe one: it can only see less text, never more.
    const stripComments = (src: string): string =>
      src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    const banned = ['createWorld', 'generateCohort', 'driftCohort', 'makeJunior', 'ageCohort', 'computeRanking']
    for (const name of ['cards.ts', 'pool.ts', 'run.ts']) {
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

describe('⭐ 1-2 tournaments a year, from ten – his rhythm', () => {
  it('⚠ none before ten, whatever the player bought', () => {
    for (const age of [5, 6, 7, 8, 9]) {
      expect(localOpensIn(year({ age, focus: 'matchplay', practice: 1 }))).toBe(0)
    }
    expect(localOpensIn(year({ age: 10, focus: 'matchplay', practice: 1 }))).toBeGreaterThan(0)
  })

  it('none in a year she did not play matches', () => {
    for (const focus of ['general', 'serve', 'rally', 'fitness'] as const) {
      expect(localOpensIn(year({ age: 11, focus, practice: 1 }))).toBe(0)
    }
  })

  it('⚠ never more than two in one year, at any age and any effort', () => {
    for (let age = 5; age <= 13; age++) {
      for (const practice of [0, 0.5, 1, 4]) {
        expect(localOpensIn(year({ age, practice, focus: 'matchplay' }))).toBeLessThanOrEqual(LOCAL_POOL.maxPerYear)
      }
    }
    expect(LOCAL_POOL.maxPerYear).toBe(2)
  })

  it('⭐ and both numbers of his range are reachable – one for a part year, two for a full one', () => {
    // 0.71875 is what a ten-year-old can take (`APPETITE_AT[10]`, pinned against the real
    // `appetiteAt` in tests/prologue-cards.test.ts).
    expect(localOpensIn(year({ age: 10, focus: 'matchplay', practice: 0.5 }))).toBe(1)
    expect(localOpensIn(year({ age: 10, focus: 'matchplay', practice: 0.71875 }))).toBe(2)
  })

  it('⭐⭐ across the real card table: entering the Open at ten is one weekend, and staying home is none', () => {
    // The join with phase 2, made in the test rather than in the source – the same shape
    // tests/prologue-cards.test.ts uses to keep the card table and `childhoodWalk` from drifting.
    const answer = (tenth: string): PrologueYear[] => {
      let run = withOrigin(EMPTY_RUN, 'middle')
      for (const card of PROLOGUE_CARDS) {
        if (!card.options) continue
        run = withPick(run, card.age, card.age === 10 ? tenth : card.options[0].id)
      }
      return chosenYears(run)
    }
    expect(prologueSchedule(answer('enter'))).toEqual([{ age: 10, index: 0 }])
    expect(prologueSchedule(answer('stay-home'))).toEqual([])
  })

  it('⚠ and no decision year 8..12 can hold more than his two, whatever the table grows into', () => {
    const every = prologueSchedule(
      [8, 9, 10, 11, 12, 13].map((age) => year({ age, focus: 'matchplay', practice: 4 })),
    )
    for (const age of [8, 9, 10, 11, 12]) {
      expect(every.filter((o) => o.age === age).length).toBeLessThanOrEqual(LOCAL_POOL.maxPerYear)
    }
    // Below ten there is nothing at all, which is his floor rather than a cap.
    expect(every.filter((o) => o.age < LOCAL_POOL.fromAge)).toEqual([])
  })
})
