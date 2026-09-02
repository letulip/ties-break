// =================================================================================================
// ⭐⭐ ROUND 34 #2b – THE CEILING READ MEASURES WHAT SHE ACHIEVED, NOT WHAT SHE WAS BORN WITH
// =================================================================================================
//
// The owner, 02.09, on a fourteen-year-old with a coach on the Home screen:
//
//     «Тренер на главном экране … написал 14 летней девочке Close to her ceiling … звучит как
//      приговор … не рановато ли? … давай подумаем в какой конкретно момент должно это появляться»
//
// and, having thought about the moment himself:
//
//     «давай сделаем, например, что At her ceiling будет звучать на 90% реальной реализации, например,
//      а Close to her ceiling с 75 до 90»
//
// ⚠⚠ THE DEFECT UNDER IT IS ARITHMETIC, NOT COPY. `coachRoomBandOf` divided `level / (level + room)`,
// i.e. `mean(skills) / mean(potential)` – which counts the skill she was BORN with as achievement.
// Every career is born around 48 of a ~68 ceiling, so that ratio opens near 0.70 before a single week
// has been coached, and it opens HIGHER the SMALLER her ceiling is. Measured on his own save (§A1 of
// docs/rounds/round-34.md): Vera heard «Close to her ceiling» with 41.6% of her headroom actually
// realised and «At her ceiling» at 76.3%, while a high-ceiling girl heard the same two sentences at
// 72.3% and 87.7%. ⭐ The verdict arrived EARLIER for the girl with LESS talent. That inversion is the
// item, and the first test below is it, in two careers.
//
// ⚠ THE FIX IS `handoverRoomBand`'S APPROACH, NOT A NEW ONE. That function (childhood prologue) already
// measures against `potential - startingSkills(seed, profile)` – the potential ROLL itself, pure talent –
// and `realisedShare` now puts her current build over exactly that denominator.
//
// ⚠ THE FOUR LABELS DID NOT MOVE, AND THE LAST TEST HERE IS WHAT SAYS SO. Invariant 4: a label may only
// change when the task asked for it, and this task asked for thresholds. `ROOM_BANDS` is untouched.
import { describe, it, expect } from 'vitest'
import {
  coachRoomBandIndex,
  coachRoomBandLabel,
  coachRoomBandOf,
  coachRoomNote,
} from '../src/engine/world/coachMarket'
import { SKILL_KEYS } from '../src/engine/development'
import { createWorld, startingSkills } from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** A career built around her REAL birth build – the one thing about her nothing may re-roll – with a
 *  ceiling `room` points above it and `gained` of those points already taken. */
function careerWith(seed: string, room: number, gained: number) {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const born = startingSkills(world.seed, world.profile)
  for (const k of SKILL_KEYS) {
    world.potential[k] = born[k] + room
    world.skills[k] = born[k] + gained
  }
  return world
}

/** ⚠ THE SUPERSEDED MEASURE, SPELLED OUT ONCE so the inversion is visible in this file rather than
 *  described in it: `level / (level + room)`, which is `mean(skills) / mean(potential)`. This is
 *  exactly what `coachRoomBandOf` computed until round 34 – and it is NOT imported from anywhere,
 *  because the point of the item is that nothing computes it any more. It is compared as a SHARE
 *  rather than pushed through `coachRoomBandIndex`: the edges below belong to the new quantity, and
 *  feeding them the old one is the category error this whole item is about. */
function theOldMeasure(world: ReturnType<typeof careerWith>): number {
  let level = 0
  let room = 0
  for (const k of SKILL_KEYS) {
    level += world.skills[k]
    room += Math.max(0, world.potential[k] - world.skills[k])
  }
  return level / (level + room)
}

/** The share the SHIPPED band is a function of, re-derived here so the ordering can be read as a
 *  number and not only as a band index. Mirrors `realisedShare` in world/coachMarket.ts. */
function theShippedMeasure(world: ReturnType<typeof careerWith>): number {
  const born = startingSkills(world.seed, world.profile)
  let gained = 0
  let room = 0
  for (const k of SKILL_KEYS) {
    gained += world.skills[k] - born[k]
    room += world.potential[k] - born[k]
  }
  return gained / room
}

describe('#2b the band reads TRUE realisation, so the verdict follows the work', () => {
  it('⭐⭐ THE INVERSION, IN TWO CAREERS: born-high-and-stalled reads BELOW born-low-and-grown', () => {
    // ⚠ THIS IS THE TEST THAT FAILS IF THE MEASURE REVERTS. `stalled` was born near her ceiling and
    // has taken HALF of the little room she had; `grown` was born far from a big one and has taken
    // four fifths of it. Any honest reading of "how close is she to what she could be" puts `grown`
    // higher. The old ratio put `stalled` higher, because 2.5 points on top of a 48-point birth build
    // is 95% of her ceiling and 32 points on top of the same build is 91% of a bigger one.
    const stalled = careerWith('r34-stalled', 5, 2.5) // half of five points of room
    const grown = careerWith('r34-grown', 40, 32) // four fifths of forty

    // The defect, reproduced: the old measure ranks the STALLED girl closer to her ceiling.
    expect(theOldMeasure(stalled), 'the old measure no longer inverts them – re-read the item')
      .toBeGreaterThan(theOldMeasure(grown))
    // ...while the truth about their careers is the other way round, by a mile.
    expect(theShippedMeasure(stalled)).toBeLessThan(theShippedMeasure(grown))

    // ⚠⚠ AND THIS IS THE ARM THAT REDDENS IF THE MEASURE REVERTS. The band she is SHOWN follows the
    // work, not the birth: a strict `<`, not `<=`, because two careers that merely tie would satisfy
    // a loose comparison and say nothing about an ordering.
    const stalledBand = coachRoomBandOf(stalled)!
    const grownBand = coachRoomBandOf(grown)!
    expect(stalledBand, `stalled ${stalledBand} vs grown ${grownBand}`).toBeLessThan(grownBand)
  })

  it('⭐ a girl who has not trained a day reads «Huge potential», however well she was born', () => {
    // The same defect at its cleanest. Under the old measure a girl born at 55 with a ceiling of 60
    // was told she was «Close to her ceiling» in week one, before anybody had coached her: that is
    // the sentence the owner met at fourteen. Her build is placed exactly at her birth values here,
    // so the numerator is zero by construction whatever the seed drew.
    for (const seed of ['r34-born-a', 'r34-born-b', 'r34-born-c']) {
      const untrained = careerWith(seed, 5, 0)
      // The old measure had her at nine tenths of her ceiling before her first session.
      expect(theOldMeasure(untrained), `${seed}: the old measure already read her high`)
        .toBeGreaterThan(0.9)
      expect(theShippedMeasure(untrained), `${seed}: she has realised nothing yet`).toBe(0)
      expect(coachRoomBandOf(untrained), seed).toBe(0)
      expect(coachRoomNote(untrained), seed).toMatch(/^Huge potential/)
    }
  })

  it('⭐ the approved edges, pinned to the digit: 0.40 / 0.75 / 0.90', () => {
    // Owner-approved 02.09 and not an agent's to re-derive (docs/rounds/round-34.md §A1):
    //   0-40% Huge potential | 40-75% Still room to grow | 75-90% Close to her ceiling | 90-100% At
    //   her ceiling. Each edge is checked from BOTH sides, so an arm moved by a hundredth reddens.
    expect(coachRoomBandIndex(0.399)).toBe(0)
    expect(coachRoomBandIndex(0.4)).toBe(1)
    expect(coachRoomBandIndex(0.749)).toBe(1)
    expect(coachRoomBandIndex(0.75)).toBe(2)
    expect(coachRoomBandIndex(0.899)).toBe(2)
    expect(coachRoomBandIndex(0.9)).toBe(3)
    // The ends, which no threshold names.
    expect(coachRoomBandIndex(0)).toBe(0)
    expect(coachRoomBandIndex(1)).toBe(3)
  })

  it('⭐ monotone in headroom over the whole range, and every band entered exactly once', () => {
    // The ladder property, on the INDEX, densely – a swapped arm inside a band is what four sample
    // points miss. The same claim `round23-coach-copy` makes; kept here too because the edges moved
    // and this file is where the new ones are argued.
    let last = 0
    const entered: number[] = [0]
    for (let r = 0; r <= 1.0001; r += 0.001) {
      const band = coachRoomBandIndex(Math.min(r, 1))
      expect(band, `realised ${r.toFixed(3)} went backwards`).toBeGreaterThanOrEqual(last)
      if (band !== last) entered.push(band)
      last = band
    }
    expect(entered, 'four bands, each entered once, in order').toEqual([0, 1, 2, 3])
  })

  it('⚠ and the FOUR LABELS ARE UNTOUCHED – invariant 4, which this item did not ask to break', () => {
    // «запрети на уровне документации и спек агентам самовольно изменять вординг» (owner, 30.08). The
    // round asked for thresholds; the words are his. A rename would pass every other test in this
    // file, which is exactly why this one is here.
    expect([0, 1, 2, 3].map(coachRoomBandLabel)).toEqual([
      'Huge potential',
      'Still room to grow',
      'Close to her ceiling',
      'At her ceiling',
    ])
    // ...and still no digit in any of them: the fog-of-war ruling is older than this round.
    for (const label of [0, 1, 2, 3].map(coachRoomBandLabel)) expect(label).not.toMatch(/\d/)
  })
})
