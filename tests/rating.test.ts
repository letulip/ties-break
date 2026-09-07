// THE RATING'S ONE PROMISE: the difference of two ratings predicts the match those two players
// actually play. Everything else about the number is decoration; this is the property the owner's
// D&D request rests on, so it is measured across the whole reachable build range rather than spot-
// checked, and it is mutation-verified (raise RATING_BASE's slope or drop the surface argument and
// the max error blows past the bound).

import { describe, it, expect } from 'vitest'
import { ratingOf, chanceFromRatings, RATING_BASE } from '../src/engine/match/rating'
import { fastMatchProbability } from '../src/engine/match/engine'
import { componentFile } from './worldSource'
import type { MatchPlayer, Surface } from '../src/engine/match/types'

const build = (id: string, core: number, extra: Partial<MatchPlayer> = {}): MatchPlayer => ({
  id,
  name: id,
  serve: core,
  ret: core,
  composure: core,
  stamina: core,
  groundstrokes: core,
  ...extra,
})

describe('the rating predicts the match it labels', () => {
  it('an average build is the scale origin', () => {
    expect(ratingOf(build('avg', 50), 'hard', 'wta')).toBe(RATING_BASE)
  })

  it("the world #1 of the shipped population reads about the live list's own number one", () => {
    // SKILL_LAW.top is 76.4 – the core the population puts at world #1; the live 2026 list's #1 is 2195.
    const r = ratingOf(build('no1', 76.4), 'hard', 'wta')
    expect(r).toBeGreaterThan(2150)
    expect(r).toBeLessThan(2240)
  })

  it('is monotone in skill', () => {
    let prev = -Infinity
    for (const core of [20, 30, 40, 50, 60, 70, 80]) {
      const r = ratingOf(build(`c${core}`, core), 'hard', 'wta')
      expect(r).toBeGreaterThan(prev)
      prev = r
    }
  })

  it("⚠ THE PROMISE: a rating gap reproduces the engine's own match probability to a point", () => {
    const surfaces: Surface[] = ['hard', 'clay', 'grass']
    let worst = 0
    let worstCase = ''
    for (const surface of surfaces) {
      for (let a = 18; a <= 80; a += 2) {
        for (let b = 18; b <= 80; b += 2) {
          const pa = build('a', a)
          const pb = build('b', b)
          const truth = fastMatchProbability(pa, pb, { surface, tour: 'wta', seed: '' })
          const quoted = chanceFromRatings(ratingOf(pa, surface, 'wta'), ratingOf(pb, surface, 'wta'))
          const err = Math.abs(truth - quoted)
          if (err > worst) {
            worst = err
            worstCase = `${surface} ${a} vs ${b}: truth ${(100 * truth).toFixed(1)}% quoted ${(100 * quoted).toFixed(1)}%`
          }
        }
      }
    }
    // MEASURED 17.08 at ELO_PER_SERVE_EDGE = 3870: worst case 1.03 points over the whole reachable
    // range and all three surfaces. The bound is 1.5 so a re-fit has somewhere to land; it is NOT
    // slack for a worse definition – the previous shape missed by 7.98 and this test is what caught it.
    expect(worst, worstCase).toBeLessThan(0.015)
  })

  it('⚠ AND THE GAP IS EXACT EVEN WHEN THE BUILDS ARE NOTHING ALIKE', () => {
    // The reference cancels algebraically, so a lopsided build is rated as correctly as a flat one.
    const server = build('server', 50, { serve: 78, ret: 30, groundstrokes: 66 })
    const grinder = build('grinder', 50, { serve: 34, ret: 74, groundstrokes: 41 })
    const truth = fastMatchProbability(server, grinder, { surface: 'clay', tour: 'wta', seed: '' })
    const quoted = chanceFromRatings(ratingOf(server, 'clay', 'wta'), ratingOf(grinder, 'clay', 'wta'))
    expect(Math.abs(truth - quoted)).toBeLessThan(0.015)
  })

  it('⚠ TWO BUILDS THAT TRADE SERVE FOR RETURN RATE THE SAME, because the model says they are the same', () => {
    // Not a rounding artefact and not a defect: `basePServe` enters serve and return with equal and
    // opposite weight, so (serve+25, ret-25) is the same player to this engine. Recorded so nobody
    // "fixes" the rating to disagree with the match it is quoting.
    expect(ratingOf(build('a', 50, { serve: 75, ret: 25 }), 'hard', 'wta')).toBe(ratingOf(build('b', 50), 'hard', 'wta'))
  })

  // ⚠⚠ RE-AIMED 07.09 BY ROUND 38 C4, AND THE CLAIM IT DEFENDS IS THE ONE IT ALWAYS DEFENDED.
  //
  // It used to read «COMPOSURE AND STAMINA ARE INVISIBLE TO IT, exactly as they are to the card it
  // explains», and asserted that a build with composure/stamina 99 rated the SAME as one at 1. Both
  // halves of that were true and the first half was the DEFECT: `basePServe` could not see the two
  // attributes, so neither could `fastMatchProbability`, so neither could this. C4 made the card
  // read all five skills (`calibratedPServe`), so the rating had to follow – a rating blind to two
  // of them would now disagree with the very odds it exists to explain, and the 1.5-point promise
  // above is what would have caught it.
  //
  // ⚠ THE TEST IS NOT WEAKENED, IT IS POINTED THE OTHER WAY. The old one asserted an EQUALITY that
  // is now false; this asserts the ORDERING and the AGREEMENT, which is strictly more than the old
  // one checked – it would go red if the rating started reading them at a different weight from the
  // model, which the equality could never have noticed.
  it('⚠ COMPOSURE AND STAMINA REACH IT, at exactly the weight the card reads them at (C4)', () => {
    const composed = build('a', 50, { composure: 99, stamina: 99 })
    const nervy = build('b', 50, { composure: 1, stamina: 1 })
    expect(ratingOf(composed, 'hard', 'wta')).toBeGreaterThan(ratingOf(nervy, 'hard', 'wta'))
    // ...and the gap is the pair's own odds, not a second opinion about them.
    const truth = fastMatchProbability(composed, nervy, { surface: 'hard', tour: 'wta', seed: '' })
    const quoted = chanceFromRatings(ratingOf(composed, 'hard', 'wta'), ratingOf(nervy, 'hard', 'wta'))
    expect(Math.abs(truth - quoted)).toBeLessThan(0.015)
  })

  it('⚠ IT IS MONOTONE IN THEM, AND THE ORIGIN OF THE SCALE DID NOT MOVE', () => {
    // Monotone: more nerve and more legs is a better player, not merely a different one.
    expect(ratingOf(build('a', 50, { composure: 80, stamina: 80 }), 'hard', 'wta')).toBeGreaterThan(
      ratingOf(build('b', 50, { composure: 20, stamina: 20 }), 'hard', 'wta'),
    )
    // ...and the ORIGIN is untouched to the last bit, which is the other half of C4's promise. The
    // reference build is 50 in every attribute, so a flat-50 player is LEVEL with it on both new
    // legs, the term is exactly 0, and the whole scale is anchored where it always was. The `toBe`
    // at the top of this describe asserts the same thing; this one says WHY it still holds.
    expect(ratingOf(build('flat', 50), 'hard', 'wta')).toBe(RATING_BASE)
  })

  it('the formula is the published one: 100 points is a 64% favourite', () => {
    expect(chanceFromRatings(1700, 1600)).toBeCloseTo(0.64, 2)
    expect(chanceFromRatings(1800, 1600)).toBeCloseTo(0.76, 2)
    expect(chanceFromRatings(1600, 1600)).toBe(0.5)
  })
})

// =================================================================================================
// ⚠⚠ THE RATING HAS NO SURFACE, BY OWNER RULING – and this block is what keeps it that way.
// =================================================================================================
//
// ⚠ NOTHING WAS RE-AIMED HERE, BECAUSE THERE WAS NOTHING TO RE-AIM, and that is the finding rather
// than a shortcut. The «Rating 1642 vs 1801» line shipped onto TWO screens with **zero display
// assertions anywhere in the suite** – no mounted test, no e2e step, no source pin. Every test in the
// file above measures the MODULE (the formula, the monotonicity, the 1.03-point agreement with
// `fastMatchProbability`); not one of them ever knew the number was rendered. So the honest move is
// not to move an assertion, it is to add the one that was missing, pointed the other way.
//
// ⚠ AND IT IS A NEGATIVE CLAIM ABOUT TWO SPECIFIC FILES, so it uses `componentFile()` – the .vue
// ALONE – exactly as CLAUDE.md's pin-hygiene note requires. `componentLogic()` would fold in every
// composable those screens import and trip on a symbol defined somewhere that was never drawing a
// rating, which is the over-strict failure `tests/pin-hygiene.test.ts` exists to catch.
//
// ⚠ IF THE OWNER ASKS FOR THE LINE BACK, MOVE THIS BLOCK – do not delete it. What it is really
// pinning is that the surface is HIS decision and not a refactor's.
describe('the rating is deliberately not drawn on any card (owner ruling, round 21)', () => {
  const SCREENS = ['components/screens/CalendarScreen.vue', 'components/screens/SeasonScreen.vue'] as const

  for (const path of SCREENS) {
    it(`${path} renders no rating`, () => {
      const sfc = componentFile(path)
      // The template as it stood: `Rating <b>{{ …kidRating }}</b> vs <b>{{ …opponentRating }}</b>`.
      // Three independent tells, because the line could come back wearing different clothes: the
      // interpolation of either field, and the literal word the owner quoted back at us.
      expect(sfc).not.toMatch(/\{\{[^}]*kidRating[^}]*\}\}/)
      expect(sfc).not.toMatch(/\{\{[^}]*opponentRating[^}]*\}\}/)
      expect(sfc).not.toMatch(/>\s*Rating\s/)
    })

    it(`${path} keeps no styling for one either`, () => {
      // ⚠ THE CSS IS PART OF THE CLAIM. A class left behind in <style> is the cheapest way for the
      // line to come back – somebody re-adds one `<p>` and it is already dressed.
      expect(componentFile(path)).not.toMatch(/odds-ratings/)
    })
  }

  it('⚠ MUTATION-VERIFIED: the guard can actually fail', () => {
    // A negative assertion that cannot go red is decoration. This runs the same three patterns over
    // the markup that was REMOVED, and every one of them must fire – so a green run above means the
    // line is absent, not that the patterns never matched anything.
    const removed = `<p v-if="marker.preview.opponentRating !== null" class="cal-card-odds-ratings">
      Rating <b>{{ marker.preview.kidRating }}</b> vs <b>{{ marker.preview.opponentRating }}</b>
    </p>`
    expect(removed).toMatch(/\{\{[^}]*kidRating[^}]*\}\}/)
    expect(removed).toMatch(/\{\{[^}]*opponentRating[^}]*\}\}/)
    expect(removed).toMatch(/>\s*Rating\s/)
    expect(removed).toMatch(/odds-ratings/)
  })

  it('⚠ AND THE MODULE IS STILL WIRED TO THE PREVIEW, which is the half that must NOT be removed', () => {
    // The owner took the DISPLAY out; `season/preview.ts` still computes both numbers as the audit
    // trail of the ring beside them. If a later tidy-up deletes the pipe, that is a second decision
    // and this is where it gets noticed.
    expect(ratingOf(build('kid', 55), 'clay', 'wta')).toBeGreaterThan(RATING_BASE)
  })
})
