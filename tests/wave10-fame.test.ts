// WAVE 10 / T5 – FAME FROM BIRTH: THE NEWS FLOOR, AND THE BOOTH'S LICENCE TO NAME THE LINE.
//
// docs/specs/the-dynasty-2026-09.md §5. The floor is a RECORDED AMENDMENT to his own D1 of 14.09,
// ruled 22.09 («давай по твоей рекомендации»); the booth's licence is §5's first bullet.
//
// ⚠⚠ THE TWO CLAUSES READ ONE PREDICATE, AND THAT IS WHAT §D MEASURES. «Her mother was known» is
// spelled once (`motherWasKnown`) and both sides call it – the floor directly, the booth as one arm
// of a disjunction. Two spellings of one question is the defect class this repo catches most often,
// and a test that only checked the two OUTCOMES would not see them drift.
//
// MUTATION-VERIFIED 22.09, each applied, RUN and reverted, with the count of what went red:
//   · `motherWasKnown`'s `best !== null` dropped: **4 red** – every college-fork arm at once, which is
//     the shape that says `null <= 100` really is the hazard the guard is written for.
//   · the floor returning `'known'` instead of `'noticed'`: **4 red**, including §B's habituation case
//     and §D's sweep – the set that says fame from birth is a COST and not a promotion.
//   · `lineageLicensed`'s `proTitles > 0 ||` dropped: **1 red** – §C's titled-but-unranked mother,
//     the only arm in the file where the cabinet is the whole licence. (⚠ The licence read
//     `titles > 0` until the architect's review of 22.09 moved it to the PRO shelves – the junior
//     cabinet licensed a booth that says «her mother won here».)
//   · `boothLineageAt`'s `atOrAboveStageBar` gate dropped: **1 red** – §C's small-stage case.

import { describe, expect, it } from 'vitest'
import { createWorld } from '../src/engine/world'
import {
  boothLineageAt,
  lineageLicensed,
  motherWasKnown,
  newsStandingOf,
} from '../src/engine/world/spotlight'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type DynastyHandover } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'
import { boothLineageLines } from '../src/viz/commentary'

/** A block whose mother's career is exactly what the arm is about. ⚠ `bestRank: null` is the
 *  college-fork mother of §5's own sentence: a real career that never held a professional rank. */
function block(over: Partial<DynastyHandover['motherCareer']> = {}): DynastyHandover {
  return {
    generation: 1,
    childSeed: 'w10-fame:dynasty:1',
    background: 'middle',
    raisedOnTour: false,
    motherName: { first: 'Alice', last: 'Martin' },
    motherCountry: 'US',
    childBirthdays: [],
    motherTemperament: 'sunny',
    motherCareer: { titles: 0, proTitles: 0, collegeTitles: 0, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'college', ...over },
  }
}

function dynastyWorld(over: Partial<DynastyHandover['motherCareer']> = {}): WorldState {
  return createWorld('w10-fame', DEFAULT_PROFILE, 'c-w10-fame', undefined, block(over))
}

const KNOWN_RANK = ECONOMY.spotlight.newsRankKnown

// =================================================================================================
// A. THE ONE PREDICATE – «HER MOTHER WAS KNOWN»
// =================================================================================================

describe('wave 10 T5 A – the predicate both clauses read', () => {
  it('⭐⭐⭐ a career that never held a professional rank NEVER qualifies', () => {
    // §5 says `null` never qualifies in as many words, and the reason it is written down is that
    // `null <= 100` is `true` in a language with looser rules than this one.
    expect(motherWasKnown(dynastyWorld({ bestRank: null }).dynasty)).toBe(false)
    // ⚠ ADVERSARIAL ON PURPOSE: a pro cabinet beside a null rank is a block no engine path produces
    // (a pro title pays WTA points, and points are a rank). It is posed anyway because this case
    // pins the predicate's READ-SET – rank and nothing else – and `proTitles: 9` is what catches a
    // rewiring onto the cabinet, which `proTitles: 0` would let through green.
    expect(motherWasKnown(dynastyWorld({ bestRank: null, titles: 9, proTitles: 9 }).dynasty), 'even with a cabinet')
      .toBe(false)
  })

  it('⭐⭐ the bar is the SAME one her daughter\'s own standing is read against', () => {
    expect(motherWasKnown(dynastyWorld({ bestRank: KNOWN_RANK }).dynasty), 'exactly at the bar').toBe(true)
    expect(motherWasKnown(dynastyWorld({ bestRank: KNOWN_RANK + 1 }).dynasty), 'one place below it').toBe(false)
    // One bar, two careers – that is what makes the floor an amendment to D1 and not a second system.
    expect(KNOWN_RANK).toBe(ECONOMY.spotlight.newsRankKnown)
  })

  it('⚠ a career that continues no line answers no', () => {
    expect(motherWasKnown(createWorld('w10-plain', DEFAULT_PROFILE).dynasty)).toBe(false)
  })
})

// =================================================================================================
// B. THE FLOOR – `noticed` FROM WEEK 0, AND NEVER `known`
// =================================================================================================

describe('wave 10 T5 B – the news floor', () => {
  it('⭐⭐⭐ a dynasty week-0 world with a KNOWN mother reads `noticed` on zero points', () => {
    const world = dynastyWorld({ bestRank: 11, titles: 6, proTitles: 6 })
    expect(world.week, 'week 0 – she is eight and has no ranking at all').toBe(0)
    expect(newsStandingOf(world), 'the press finds the famous name before the ranking exists').toBe('noticed')
  })

  it('⭐⭐⭐ ...and NEVER `known`, which stays earned by her own rank alone', () => {
    // The strongest form the mother can take: a slam champion who never fell out of the top ten.
    const world = dynastyWorld({ bestRank: 1, titles: 40, proTitles: 40, slams: 8 })
    expect(newsStandingOf(world), 'being born to one is not the same as having done it').toBe('noticed')
  })

  it('⭐⭐ a college-fork mother reads `quiet` – the door opened, the light did not', () => {
    expect(newsStandingOf(dynastyWorld({ bestRank: null, titles: 0 }))).toBe('quiet')
  })

  it('⭐⭐⭐ a NON-dynasty world is byte-identical to today – the pin the amendment stands on', () => {
    const plain = createWorld('w10-plain', DEFAULT_PROFILE)
    expect(newsStandingOf(plain)).toBe('quiet')
    // ⚠ AND THE SHAPE OF THE PIN MATTERS: the shipped read is a separate function now
    // (`ownNewsStandingOf`) and the floor is one line on top of it, so «a career with no record takes
    // exactly the old path» is true by construction. What this case adds is the arm the construction
    // cannot prove – that the floor is not reachable without a record.
    expect(plain.dynasty).toBe(null)
    expect(newsStandingOf(dynastyWorld({ bestRank: null })), 'a record alone is not enough either').toBe('quiet')
  })

  it('⚠⚠ habituation stays 0 at the floor – `noticed`\'s own shipped law, asserted so it cannot drift', () => {
    // `phaseHerWeek` grows habituation on `newsStandingOf(world) === 'known'` and on nothing else, so
    // a floor that returned `'known'` would hand a girl with no ranking the one band that gets USED to
    // the light. That is the difference between fame from birth being a cost and being a gift.
    const world = dynastyWorld({ bestRank: 3, titles: 12, proTitles: 12 })
    expect(newsStandingOf(world) === 'known', 'the floor may not reach the growing band').toBe(false)
    expect(world.spotlightHabituation, 'and a week-0 career has learned nothing yet').toBe(0)
  })
})

// =================================================================================================
// C. THE BOOTH'S LICENCE – ONLY OFF REAL FACTS
// =================================================================================================

describe('wave 10 T5 C – what there is to say about the line', () => {
  it('⭐⭐⭐ A COLLEGE MOTHER LICENSES NOTHING, and that is the point rather than a side effect', () => {
    const world = dynastyWorld({ titles: 0, bestRank: null, endingKind: 'college' })
    expect(lineageLicensed(world), 'there is nothing true to say, so nothing is said').toBe(false)
    expect(boothLineageAt(world, 'slam'), 'not even on the biggest stage there is').toBe(null)
  })

  it('⭐⭐⭐ a cabinet licenses the TEXTURE – but a quiet girl still gets no booth, and that is the shipped law', () => {
    // ⚠⚠ A FINDING WORTH STATING RATHER THAN A CASE THAT NEEDED BENDING. The two halves of §5 do not
    // line up for one kind of mother: a woman with a cabinet whose best PROFESSIONAL ranking was
    // never inside the bar licenses the texture (`lineageLicensed`) and does NOT raise the floor
    // (`motherWasKnown`). So her daughter is `quiet` at week 0, and the booth's own shipped gate –
    // «an unknown girl has no spotlight, whatever she wins», his D1 of 14.09 – keeps it silent until
    // the girl is noticed in her OWN right.
    //
    // ⚠ THAT IS THE RIGHT ORDER AND NOT A GAP: the lineage rides the booth's licence rather than
    // replacing it, so a dynasty can never buy a mention that a girl's own standing has not opened.
    // What the block buys is something TRUE TO SAY once the light is already on her.
    //
    // ⚠ RE-POSED AT THE ARCHITECT'S REVIEW (22.09): this block used to be `titles: 4, bestRank:
    // null` – a pro cabinet beside no rank, which no engine path produces (a pro title pays WTA
    // points). The honest form of the same mother is a real rank OUTSIDE the bar: cabinet, never
    // known. The claim of the case is unchanged.
    const world = dynastyWorld({ titles: 4, proTitles: 4, bestRank: ECONOMY.spotlight.newsRankNoticed + 40 })
    expect(lineageLicensed(world), 'there is something true to say about her mother').toBe(true)
    expect(newsStandingOf(world), '...and the floor does not fire, because the press did not know her').toBe('quiet')
    expect(boothLineageAt(world, 'slam'), 'so the booth stays silent until the girl is noticed herself').toBe(null)
  })

  it('⚠⚠ a JUNIOR cabinet licenses NOTHING – the 22.09 review\'s other half', () => {
    // Thirty junior trophies, no professional rank: a college-fork mother with a childhood full of
    // silverware. Until the review the licence read the whole cabinet and this block bought a booth
    // saying «her mother won here» at a slam. `proTitles` is what the booth may claim, and hers is 0.
    const world = dynastyWorld({ titles: 30, proTitles: 0, bestRank: null, endingKind: 'college' })
    expect(lineageLicensed(world), 'a junior shelf is not a tour cabinet').toBe(false)
    expect(boothLineageAt(world, 'slam'), 'silent on the biggest stage there is').toBe(null)
  })

  it('⭐⭐ ...and a ranking licenses it whatever she won', () => {
    const world = dynastyWorld({ titles: 0, bestRank: 12 })
    expect(lineageLicensed(world)).toBe(true)
    // ⚠ `proTitles: 0` IS WHAT THE COPY FORKS ON: a mother the tour merely knew must not be given a
    // cabinet by the booth. The packet carries the count so the viz can tell them apart.
    expect(boothLineageAt(world, 'slam')).toEqual({ proTitles: 0, collegeTitles: 0, slams: 0 })
  })

  it('⚠⚠ the big stage is the rarity – a small rung says nothing, however famous the mother', () => {
    // A KNOWN mother, so the floor has already made the girl `noticed` and the standing gate is open:
    // what is left to fail is the stage, which is the one this case is about.
    const world = dynastyWorld({ titles: 40, proTitles: 40, bestRank: 1, slams: 8 })
    expect(boothLineageAt(world, 'local'), 'the shipped licence, unchanged').toBe(null)
    expect(boothLineageAt(world, 'j30')).toBe(null)
    expect(boothLineageAt(world, 'slam')).toEqual({ proTitles: 40, collegeTitles: 0, slams: 8 })
  })

  it('⚠ a career that continues no line is silent, on every rung', () => {
    const plain = createWorld('w10-plain', DEFAULT_PROFILE)
    expect(lineageLicensed(plain)).toBe(false)
    for (const tier of ['local', 'w15', 'wta1000', 'slam'] as const) {
      expect(boothLineageAt(plain, tier), tier).toBe(null)
    }
  })
})

// =================================================================================================
// D. THE TWO CLAUSES REALLY SHARE ONE SPELLING
// =================================================================================================

describe('wave 10 T5 D – one predicate, two readers', () => {
  it('⭐⭐⭐ every rank either qualifies for BOTH or for neither – swept, not sampled', () => {
    // ⚠ THE ARM THAT CATCHES A SECOND SPELLING. If the floor and the booth ever read different bars,
    // some rank between them qualifies for one and not the other; this sweep walks every rank from
    // the top to well past the bar and asserts the two never disagree on a TITLELESS mother, where
    // the booth's only licence IS the shared predicate.
    for (let rank = 1; rank <= ECONOMY.spotlight.newsRankNoticed + 50; rank += 1) {
      const world = dynastyWorld({ titles: 0, bestRank: rank })
      const known = motherWasKnown(world.dynasty)
      expect(newsStandingOf(world) === 'noticed', `rank ${rank}: the floor`).toBe(known)
      expect(lineageLicensed(world), `rank ${rank}: the booth`).toBe(known)
    }
  })
})

// =================================================================================================
// E. THE COPY FORKS ON THE FACTS – AND NEVER ON A FACT THE PACKET DOES NOT CARRY
// =================================================================================================

describe('wave 10 T5 E – what the booth may say', () => {
  it('⭐⭐⭐ a mother the tour merely KNEW is never given a cabinet by the booth', () => {
    // ⚠ THE HONESTY RULE OF `src/viz/commentary.ts`, applied to this fact: two different TRUE things
    // need two pools, and a single pool would put a title in the booth's mouth that nobody won.
    const known = boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 0, slams: 0 })
    const titled = boothLineageLines({ side: 0, proTitles: 6, collegeTitles: 0, slams: 1 })
    expect(known).not.toBe(titled)
    for (const line of known.map((f) => f('Nadia'))) {
      expect(line, `a titleless mother's line claims a cabinet: ${line}`).not.toMatch(/won|title|troph/i)
    }
    for (const line of titled.map((f) => f('Nadia'))) {
      expect(line, `a titled mother's line says nothing about the cabinet: ${line}`).toMatch(/won|troph/i)
    }
  })

  it('⚠⚠ not one line names the mother – the packet carries no name and none is invented', () => {
    for (const proTitles of [0, 6]) {
      for (const line of boothLineageLines({ side: 0, proTitles, collegeTitles: 0, slams: 0 }).map((f) => f('Nadia'))) {
        expect(line, line).not.toMatch(/Alice|Martin/)
        // ...and no number either: the booth is not reading a stat sheet.
        expect(line, line).not.toMatch(/\d/)
      }
    }
  })

  it('⚠ three to five drafts in total, which is what the plan asked for', () => {
    // ⚠ LEFT AT THE TWO POOLS IT WAS WRITTEN ABOUT, ON PURPOSE (24.09, the college scene T4.3). There
    // is a THIRD pool now – `collegeTitles > 0` inside the same licence – and it is deliberately not
    // summed here: this case pins WAVE 10's own budget, «one or two lines per shape, his pass», and
    // widening it to a later wave's shapes would turn a spent budget into a moving one. The college
    // pool carries its own count in tests/college-scene.test.ts §B.
    const all = [
      ...boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 0, slams: 0 }),
      ...boothLineageLines({ side: 0, proTitles: 1, collegeTitles: 0, slams: 0 }),
    ]
    expect(all.length).toBeGreaterThanOrEqual(3)
    expect(all.length).toBeLessThanOrEqual(5)
    // A pool of one is a line that repeats; every pool has at least two so `variant` can cycle.
    expect(boothLineageLines({ side: 0, proTitles: 0, collegeTitles: 0, slams: 0 }).length).toBeGreaterThan(1)
    expect(boothLineageLines({ side: 0, proTitles: 1, collegeTitles: 0, slams: 0 }).length).toBeGreaterThan(1)
  })
})
