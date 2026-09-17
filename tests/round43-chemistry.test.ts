// THE CHEMISTRY WAVE C1, AND SCHEMA v79 – the net under `docs/specs/the-chemistry-2026-09.md`.
//
// WHAT THIS FILE IS FOR. C1 ships four things that can each be wrong in a way no other test would
// notice: a per-career roster draw, a signed affinity, a corridor whose two ends are the OWNER'S
// numbers, and a weekly walk whose whole job is to be autocorrelated. The bench
// (`npm run bench:chemistry`) measures how OFTEN each of them happens; this file pins WHAT they are.
//
// ⚠⚠ THE MEASURED MUTATION ARMS. Every claim below was mutated and watched to go red before it was
// believed – the house rule that a test which cannot fail on the broken version is not this test.
// Each arm was applied to `src/`, the file re-run, and the tree restored:
//
//   #  mutation                                                              RED cases  scope
//   1  `centreScale: 0.26` -> `0`          (flatten the 4x4)                       3     the table
//   2  swap `mannerPush`'s two poles                                               2     the axes
//   3  `ceilingAtPerfect: 33` -> `30`      (move HIS number)                       1     the corridor
//   4  `floorAtPerfect: -7` -> `-9`        (move HIS number)                       1     the corridor
//   5  `phaseRevert: 0.05` -> `0.9`        (destroy the periods)                   1     the walk
//   6  `resultsDamp: 0.5` -> `1`           (undo C13)                              1     the channels
//   7  `phasePerLoss: -0.1` -> `-0.15`     (re-break the flat tax)                 1     the channels
//   8  one roster slot's style changed     (punch a hole in a rung)                2     the roster
//   9  `coachFactor`'s chemistry term multiplied by 0                              3     the reader
//  10  the v79 migration's `coachPairs ??= {}` deleted                             2     the schema
//
// Ten arms, ten non-zero RED counts, exit 1 on every one. The file is 42 cases and runs in ~1.0 s.
//
// ⚠ NO SOURCE PINS. Every case here mounts the real functions and asserts on BEHAVIOUR, which is the
// repo's stated preference and is what lets C2 move `standing` into this same row without re-aiming
// a single line of it.

import { describe, expect, it } from 'vitest'
import {
  accrueChemistry,
  affinityCentre,
  affinityFor,
  chemistryCeilingPerYear,
  chemistryDriftPerYear,
  chemistryEventNudge,
  chemistryFloorPerYear,
  chemistryWeeklyRate,
  COACH_MANNERS,
  createWorld,
  freshCoachPair,
  mannerFromAxes,
  mannerPush,
  mannerVoice,
  nextChemistryPhase,
  quietWeek,
  SAVE_SCHEMA_VERSION,
  TEMPERAMENTS,
  tickWeek,
  type CoachManner,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { buildCoachRoster, COACH_TIERS, coachFactor, HIREABLE_TIERS } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type PlayStyle } from '../src/shared/protocol'
import { load } from './goldenSavesCorpus'

const FITS = ['great', 'good', 'off'] as const

describe('C1 A – the manner is a 2x2 and its two projections are the one spelling of it', () => {
  it('every manner round-trips through its own axes', () => {
    for (const m of COACH_MANNERS) {
      expect(mannerFromAxes(mannerPush(m), mannerVoice(m)), `${m} composes back to itself`).toBe(m)
    }
  })

  it('...and the four are exactly the four cells – no pole is doubled up', () => {
    const cells = COACH_MANNERS.map((m) => `${mannerPush(m)}/${mannerVoice(m)}`)
    expect(new Set(cells).size, 'four manners, four distinct cells').toBe(4)
    expect(COACH_MANNERS.filter((m) => mannerPush(m) === 'hot')).toHaveLength(2)
    expect(COACH_MANNERS.filter((m) => mannerVoice(m) === 'person')).toHaveLength(2)
  })
})

describe('C1 B – the 4x4 table, and B11 is a STRUCTURAL claim rather than a truth claim', () => {
  // ⚠ THE PRINCIPLE ITSELF IS NOT TESTED AND CANNOT BE. §1a says so out loud: «two intense people
  // burn out» is a claim about human beings, and a test that «confirmed» it would only be confirming
  // the table it was handed. What IS testable is that the table is BALANCED – which is a check
  // against a broken game, not against a wrong design.
  it('every temperament has exactly one warm manner and exactly one cold one', () => {
    for (const t of TEMPERAMENTS) {
      const row = COACH_MANNERS.map((m) => affinityCentre(t, m))
      expect(row.filter((x) => x > 0), `${t} has a manner that suits her`).toHaveLength(1)
      expect(row.filter((x) => x < 0), `${t} has a manner that does not`).toHaveLength(1)
    }
  })

  it('...and no manner is best for all four – otherwise the axis is a formality', () => {
    const bestFor = TEMPERAMENTS.map((t) => {
      const row = COACH_MANNERS.map((m) => affinityCentre(t, m))
      return COACH_MANNERS[row.indexOf(Math.max(...row))]
    })
    expect(new Set(bestFor).size, 'each temperament is best served by a different manner').toBe(4)
  })

  it('the table IS the principle: match on the voice axis, complement on the push axis', () => {
    // The one case that ties the numbers to the sentence. A cell is at its best when the two axes
    // agree with the rule and at its worst when both disagree – so a sign check over all sixteen
    // says the table was not typed in by hand and left to drift from its own docblock.
    for (const t of TEMPERAMENTS) {
      const open = t === 'sunny' || t === 'fiery'
      const steady = t === 'sunny' || t === 'quiet'
      for (const m of COACH_MANNERS) {
        const language = (open ? 'person' : 'technique') === mannerVoice(m) ? 1 : -1
        const temperature = (steady ? 'hot' : 'cool') === mannerPush(m) ? 1 : -1
        const want = ((language + temperature) / 2) * ECONOMY.chemistry.centreScale
        expect(affinityCentre(t, m), `${t} x ${m}`).toBeCloseTo(want, 10)
      }
    }
  })
})

describe('C1 C – the affinity is drawn once per pair and is a pure function of (seed, coachId)', () => {
  it('the same pair draws the same number, for ever', () => {
    const a = affinityFor('sd', 'budget-1', 'fiery', 'warm')
    expect(affinityFor('sd', 'budget-1', 'fiery', 'warm'), 'same inputs, same disposition').toBe(a)
  })

  it('...and the seed, the coach, the temperament and the manner each move it', () => {
    const base = affinityFor('sd', 'budget-1', 'fiery', 'warm')
    expect(affinityFor('other', 'budget-1', 'fiery', 'warm'), 'another career').not.toBe(base)
    expect(affinityFor('sd', 'high-2', 'fiery', 'warm'), 'another man').not.toBe(base)
    expect(affinityFor('sd', 'budget-1', 'quiet', 'warm'), 'another girl').not.toBe(base)
    expect(affinityFor('sd', 'budget-1', 'fiery', 'driving'), 'another manner').not.toBe(base)
  })

  it('it is signed, bounded, and BOTH ends are reachable – his «ПРОТИВОПОЛОЖНАЯ химия» is a real cell', () => {
    const draws: number[] = []
    for (let i = 0; i < 4000; i++) {
      for (const t of TEMPERAMENTS) draws.push(affinityFor(`s${i}`, 'budget-1', t, 'demanding'))
    }
    expect(Math.min(...draws), 'never below -1').toBeGreaterThanOrEqual(-1)
    expect(Math.max(...draws), 'never above +1').toBeLessThanOrEqual(1)
    expect(draws.filter((a) => a >= 0.6).length, 'the click happens').toBeGreaterThan(0)
    expect(draws.filter((a) => a <= -0.6).length, 'and so does the anti-match').toBeGreaterThan(0)
    // C10, ruled 16.09 («согласен»): the anti-match is as FREQUENT as the click. A game where good
    // luck is rare and bad luck is common is not variable, it is punishing.
    const up = draws.filter((a) => a >= 0.6).length
    const down = draws.filter((a) => a <= -0.6).length
    expect(Math.abs(up - down) / draws.length, 'the two tails are the same size').toBeLessThan(0.01)
  })

  it('⭐ AND THE DRAW DOMINATES THE TABLE – B10, the lookup test, as a gate rather than a report', () => {
    // The bench prints the ratio; this fails the build if it ever falls under the veto line. §1a: if
    // the cell dominates, the player has been handed a strategy guide and «the discovery he asked
    // for is gone».
    const cells: number[][] = []
    for (const t of TEMPERAMENTS) {
      for (const m of COACH_MANNERS) {
        cells.push(Array.from({ length: 900 }, (_, i) => affinityFor(`b10-${i}`, 'budget-1', t, m)))
      }
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const varOf = (xs: number[]) => mean(xs.map((x) => (x - mean(xs)) ** 2))
    const within = mean(cells.map(varOf))
    const between = varOf(cells.map(mean))
    expect(within / between, 'within-cell variance dominates between-cell by at least 2:1').toBeGreaterThanOrEqual(2)
  })
})

describe('C1 D – the corridor, and its ceiling column is the OWNER\'S', () => {
  // ⚠⚠ THESE FOUR NUMBERS ARE HIS AND ARE NOT AN AGENT'S TO MOVE (spec §3.2). Pinned here precisely
  // so that a later tuning wave has to argue with a failing test instead of quietly editing a
  // constant: +33 a year at a perfect pair, +5 with SHORT ups at no match, and the floor's two ends.
  it('+33 a year at a perfect pair and +5 at none – his two ceiling anchors', () => {
    expect(chemistryCeilingPerYear(1), 'the click can reach 33% a year').toBe(33)
    expect(chemistryCeilingPerYear(0), 'and a no-match pair tops out at 5').toBe(5)
  })

  it('...and the floor\'s two ends, the only half of that column he was sure of', () => {
    expect(chemistryFloorPerYear(1), 'the Borg year, -5 to -10').toBe(-7)
    expect(chemistryFloorPerYear(-1), 'deepest at the anti-match').toBe(-33)
    expect(chemistryFloorPerYear(0), 'deeper than a perfect pair\'s').toBeLessThan(chemistryFloorPerYear(1))
  })

  it('«the ups are SHORT» is the corridor\'s SHAPE and not a second rule', () => {
    // At A = 0 the room above the drift is five points and the room below it is twenty, so an
    // ordinary relationship has many small good weeks and fewer, larger bad ones – his «чаще»,
    // expressed once, in geometry.
    const up = chemistryCeilingPerYear(0) - chemistryDriftPerYear(0)
    const down = chemistryDriftPerYear(0) - chemistryFloorPerYear(0)
    expect(down / up, 'four times as much room below as above').toBeGreaterThan(3)
  })

  it('the drift is 0 at affinity 0 – corner E is not quietly taxed', () => {
    expect(chemistryDriftPerYear(0), 'nobody clicks, nobody repels, nothing drains').toBe(0)
    expect(chemistryDriftPerYear(1), 'and a click climbs').toBeGreaterThan(0)
    expect(chemistryDriftPerYear(-1), 'and an anti-match falls').toBeLessThan(0)
    // C10's one asymmetry: the anti-match is SLOWER TO ARRIVE than the click.
    expect(Math.abs(chemistryDriftPerYear(-1))).toBeLessThan(chemistryDriftPerYear(1))
  })

  it('the phase reads the corridor: 0 is the drift, +1 the ceiling, -1 the floor', () => {
    for (const a of [1, 0.5, 0, -0.5, -1]) {
      expect(chemistryWeeklyRate(a, 0) * 52, `A=${a} at rest`).toBeCloseTo(chemistryDriftPerYear(a), 9)
      expect(chemistryWeeklyRate(a, 1) * 52, `A=${a} at its best`).toBeCloseTo(chemistryCeilingPerYear(a), 9)
      expect(chemistryWeeklyRate(a, -1) * 52, `A=${a} at its worst`).toBeCloseTo(chemistryFloorPerYear(a), 9)
    }
  })
})

describe('C1 E – the weather, and «periods» is the load-bearing word (B9)', () => {
  const walk = (weeks: number, seed = 'w') => {
    const out: number[] = []
    let phase = 0
    for (let w = 1; w <= weeks; w++) {
      phase = nextChemistryPhase(phase, seed, 'budget-1', w, quietWeek('steady'))
      out.push(phase)
    }
    return out
  }

  it('it is bounded, and deterministic in (seed, coachId, week)', () => {
    const xs = walk(600)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1)
    expect(Math.max(...xs)).toBeLessThanOrEqual(1)
    expect(nextChemistryPhase(0.3, 's', 'c', 12, quietWeek('steady'))).toBe(
      nextChemistryPhase(0.3, 's', 'c', 12, quietWeek('steady')),
    )
    expect(nextChemistryPhase(0.3, 's', 'c', 13, quietWeek('steady'))).not.toBe(
      nextChemistryPhase(0.3, 's', 'c', 12, quietWeek('steady')),
    )
  })

  it('⭐ AND IT HAS PERIODS RATHER THAN NOISE – runs of 8+ weeks on one side of its own mean', () => {
    // ⚠ THIS IS THE CASE THAT SAYS §3.3 WAS BUILT. A series that alternates every week is white
    // noise wearing a phase, and it would pass every other assertion in this describe.
    const xs = walk(5200)
    const m = xs.reduce((a, b) => a + b, 0) / xs.length
    const runs: number[] = []
    let run = 0
    let side = 0
    for (const x of xs) {
      const s = x >= m ? 1 : -1
      if (s === side) run += 1
      else {
        if (run) runs.push(run)
        side = s
        run = 1
      }
    }
    runs.push(run)
    const weeksInLongRuns = runs.filter((r) => r >= 8).reduce((a, b) => a + b, 0) / xs.length
    expect(runs.filter((r) => r >= 8).length, 'long stretches happen at all').toBeGreaterThan(20)
    expect(weeksInLongRuns, 'and most of the series lives inside one').toBeGreaterThan(0.5)
  })
})

describe('C1 F – the three event channels (§3.4), and C13\'s damp', () => {
  it('a 50/50 week is exactly neutral – the flat tax the bench caught cannot come back', () => {
    // ⚠⚠ MEASURED, NOT CHOSEN. An asymmetric win/loss pair plus a first-round-exit charge drove the
    // MEDIAN career to a standing phase of -0.36 over 208 weeks, because in a knockout sport every
    // event but one ends in a loss. `wins - losses` is the whole read and it already encodes depth.
    expect(chemistryEventNudge({ wins: 3, losses: 3, titles: 0, band: 'steady' })).toBe(0)
    expect(chemistryEventNudge({ wins: 40, losses: 40, titles: 0, band: 'steady' })).toBeCloseTo(0, 12)
  })

  it('...so a deep run pays and an early exit costs, off the same one term', () => {
    const final = chemistryEventNudge({ wins: 5, losses: 1, titles: 0, band: 'steady' })
    const firstRound = chemistryEventNudge({ wins: 0, losses: 1, titles: 0, band: 'steady' })
    expect(final, 'a run to the final is a good fortnight').toBeGreaterThan(0)
    expect(firstRound, 'and out in the first round is not').toBeLessThan(0)
  })

  it('C13 – the RESULTS read is damped and her STATE is not', () => {
    const c = ECONOMY.chemistry
    expect(chemistryEventNudge({ wins: 1, losses: 0, titles: 0, band: 'steady' })).toBeCloseTo(
      c.phasePerWin * c.resultsDamp,
      12,
    )
    expect(c.resultsDamp, 'lightly damped – «окей, давай слегка»').toBeLessThan(1)
    expect(c.resultsDamp, '...and not fenced off').toBeGreaterThan(0)
    expect(chemistryEventNudge(quietWeek('heavy'))).toBe(c.phasePerBand.heavy)
    expect(chemistryEventNudge(quietWeek('glowing'))).toBe(c.phasePerBand.glowing)
  })

  it('her state runs the right way down the Mood ladder', () => {
    const b = ECONOMY.chemistry.phasePerBand
    expect(b.glowing).toBeGreaterThan(b.bright)
    expect(b.bright).toBeGreaterThan(b.steady)
    expect(b.steady).toBe(0)
    expect(b.steady).toBeGreaterThan(b.dimmed)
    expect(b.dimmed).toBeGreaterThan(b.heavy)
  })
})

describe('C1 G – the accrual clamps, pauses, and leaves C2\'s number alone', () => {
  it('the level is bounded at both ends of its own range', () => {
    let pair = { chem: 99, phase: 1, standing: 0 }
    for (let w = 1; w < 400; w++) pair = accrueChemistry(pair, 1, 's', 'c', w, quietWeek('glowing'))
    expect(pair.chem, 'a perfect pair stops at +100').toBeLessThanOrEqual(100)
    let bad = { chem: -99, phase: -1, standing: 0 }
    for (let w = 1; w < 400; w++) bad = accrueChemistry(bad, -1, 's', 'c', w, quietWeek('heavy'))
    expect(bad.chem, 'and an anti-match at -100').toBeGreaterThanOrEqual(-100)
  })

  it('⚠ `standing` is carried through untouched – it is wave C2\'s and this pass must not invent it', () => {
    const out = accrueChemistry({ chem: 0, phase: 0, standing: 41 }, 0.8, 's', 'c', 9, quietWeek('bright'))
    expect(out.standing, 'C1 writes the key and reads nothing into it').toBe(41)
  })

  it('a fresh pair starts at the neutral working relationship', () => {
    expect(freshCoachPair()).toEqual({ chem: 0, phase: 0, standing: 0 })
  })

  it('⭐ AND THE WEEK\'S DRAW IS THE SAME WHATEVER THE PLAYER DID – input-independence, literally', () => {
    // The shock is keyed on the coach's IDENTITY and the week NUMBER, so a quiet week and a week
    // full of results tap the same number and differ only in what is DONE with it. That is
    // CLAUDE.md invariant 2 read as a fairness property rather than as a draw count.
    const quiet = nextChemistryPhase(0, 's', 'c', 30, quietWeek('steady'))
    const busy = nextChemistryPhase(0, 's', 'c', 30, { wins: 4, losses: 0, titles: 1, band: 'glowing' })
    expect(busy - quiet, 'the difference is EXACTLY the event nudge, so the draw did not move').toBeCloseTo(
      chemistryEventNudge({ wins: 4, losses: 0, titles: 1, band: 'glowing' }),
      12,
    )
  })
})

describe('C1 H – the roster is drawn per career, and the 30.07 ruling survives it', () => {
  const rosters = Array.from({ length: 200 }, (_, i) => buildCoachRoster(`r${i}`, 14))

  it('it is still a pure derivation of (seed, ageYears)', () => {
    expect(buildCoachRoster('r1', 14)).toEqual(buildCoachRoster('r1', 14))
    expect(buildCoachRoster('r1', 14).map((c) => c.manner)).not.toEqual(
      buildCoachRoster('r2', 14).map((c) => c.manner),
    )
  })

  it('⭐ the market\'s SHAPE now varies between careers – which is the defect this wave fixes', () => {
    // Until C1 the roster drew ONLY the names and the rates, so what every coach on the shelf was
    // LIKE was byte-identical in every career this game has ever run, and the owner's corners B, C
    // and D could not happen at all.
    const shapes = new Set(rosters.map((r) => r.map((c) => `${c.tier}:${c.manner}`).join('|')))
    expect(shapes.size, 'two hundred careers, two hundred different markets').toBeGreaterThan(190)
  })

  it('⚠ ...AND EVERY RUNG STILL SHIPS ALL FOUR STYLES, IN EVERY CAREER – C1a IS NOT BUILT', () => {
    // ⚠⚠ THE ONE ITEM OF THE SPEC THAT SHIPPED DIFFERENTLY FROM HOW IT IS WRITTEN, and it is pinned
    // here so a later wave has to argue with a failing test instead of quietly re-adding the draw.
    // C1a rules that `style` is drawn per career; the bench measured what that costs and the wave
    // handed the decision back. `buildCoachRoster`'s own docblock carries the three numbers:
    // corner B moved 41.3% -> 42.8% and corner C 25.7% -> 28.6%, against a 4.7% COACHING DISCOUNT at
    // every rung above budget, because `bestFitCoachAt` breaks a tie by PRICE and a shuffled shelf
    // creates ties. That flipped the wealthy cell of `tests/economy-calibration.test.ts` from a
    // $2,970 idle-year BURN to break-even, reversing round 7's «premium everything must hurt».
    //
    // ⚠ AND THE OWNER ALREADY RULED THE BOTTOM RUNG SEPARATELY, on 30.07 («2 counterpancher budget,
    // none big serve»): a play style is chosen ONCE, on screen R, before the player knows what
    // coaching costs, and it is irreversible – so a rung with a hole in it taxes the family least
    // able to buy its way out. That ruling is what a style draw would have had to work around, and
    // it is why the case below is asserted at EVERY rung rather than only at budget.
    for (const roster of rosters) {
      for (const tier of HIREABLE_TIERS) {
        const styles = roster.filter((c) => c.tier === tier).map((c) => c.style)
        expect(new Set(styles).size, `every game she plays has a great-fit coach at ${tier}`).toBe(4)
      }
    }
  })

  it('...and the shelf\'s style balance is the shipped constant, untouched', () => {
    for (const roster of rosters) {
      const byStyle = new Map<PlayStyle, number>()
      for (const c of roster) byStyle.set(c.style, (byStyle.get(c.style) ?? 0) + 1)
      expect([...byStyle.values()].sort(), 'four rungs, four styles, one each').toEqual([4, 4, 4, 4])
    }
  })

  it('⭐ ...and the MANNER is what varies, at every rung including the bottom one', () => {
    // Corner B is «every affordable coach sits in ONE of the two good cells and never both», and the
    // half that has to vary for a working-class family is the CHEMISTRY one. It does: the manner is
    // drawn for all sixteen slots, budget included.
    for (const tier of HIREABLE_TIERS) {
      const seen = new Set(rosters.flatMap((r) => r.filter((c) => c.tier === tier).map((c) => c.manner)))
      expect(seen.size, `all four manners turn up at ${tier} across careers`).toBe(4)
    }
  })
})

describe('C1 I – the ONE line in coachFactor (§5 / §5a)', () => {
  it('⚠ AT CHEMISTRY 0 IT IS BYTE-IDENTICAL TO WHAT THIS ENGINE HAS ALWAYS RUN', () => {
    // The whole reason every call site outside the weekly growth path could stay untouched.
    for (const tier of COACH_TIERS) {
      for (const fit of FITS) {
        expect(coachFactor(tier, fit, 0), `${tier} x ${fit}`).toBe(
          ECONOMY.coach.developmentFactor[tier] * ECONOMY.coach.fitFactor[fit],
        )
        expect(coachFactor(tier, fit), 'and the default argument is 0').toBe(coachFactor(tier, fit, 0))
      }
    }
  })

  it('a click reaches the NEXT rung\'s number, and at 100 it arrives exactly', () => {
    for (let i = 0; i < COACH_TIERS.length - 1; i++) {
      const tier = COACH_TIERS[i]
      const next = COACH_TIERS[i + 1]
      expect(coachFactor(tier, 'good', 100), `${tier} at +100 develops like ${next}`).toBeCloseTo(
        ECONOMY.coach.developmentFactor[next] * ECONOMY.coach.fitFactor.good,
        10,
      )
    }
  })

  it('...and an anti-match falls to the rung BELOW, symmetrically', () => {
    for (let i = 1; i < COACH_TIERS.length; i++) {
      const tier = COACH_TIERS[i]
      const below = COACH_TIERS[i - 1]
      expect(coachFactor(tier, 'good', -100), `${tier} at -100 develops like ${below}`).toBeCloseTo(
        ECONOMY.coach.developmentFactor[below] * ECONOMY.coach.fitFactor.good,
        10,
      )
    }
    // §5a's own line: the budget coach she cannot work with teaches her like no coach at all.
    expect(coachFactor('budget', 'good', -100)).toBeCloseTo(coachFactor('self', 'good', 0), 10)
  })

  it('C3 – `elite` has no next rung and takes a token step up, and the full fall down', () => {
    const elite = ECONOMY.coach.developmentFactor.elite
    expect(coachFactor('elite', 'good', 100)).toBeCloseTo(
      (elite + ECONOMY.chemistry.eliteUpStep) * ECONOMY.coach.fitFactor.good,
      10,
    )
    // ⚠ AND «A TOKEN» MEANS THE LADDER'S OWN SMALLEST RUNG, which is a fact about the ladder worth
    //   writing down: `developmentFactor`'s steps SHRINK as they climb (+0.13, +0.09, +0.07, +0.04)
    //   because Elite is a luxury rather than an optimisation, so the last real step is already
    //   0.04 – and the owner's C3 figure is exactly it. The first draft of this case asserted the
    //   token was strictly SMALLER than `high`'s step and went red at the twelfth decimal, which is
    //   the ladder telling the test what «token» had to mean.
    const steps = COACH_TIERS.slice(1).map(
      (t, i) => ECONOMY.coach.developmentFactor[t] - ECONOMY.coach.developmentFactor[COACH_TIERS[i]],
    )
    expect(ECONOMY.chemistry.eliteUpStep, 'no larger than the smallest rung on the ladder').toBeLessThanOrEqual(
      Math.min(...steps) + 1e-9,
    )
    expect(coachFactor('elite', 'good', -100)).toBeCloseTo(
      ECONOMY.coach.developmentFactor.high * ECONOMY.coach.fitFactor.good,
      10,
    )
  })

  it('⚠ `self` has no pair, so the bottom of the ladder cannot fall through itself', () => {
    expect(coachFactor('self', 'good', -100)).toBe(coachFactor('self', 'good', 0))
  })

  it('...and chemistry is NOT a second fit pill – the two spans stay their own', () => {
    // Spec §6, fence 3. Chemistry moves `developmentFactor`, which is the TIER's number; the pill
    // keeps its own span untouched, and both still multiply exactly once.
    for (const chem of [-100, -50, 0, 50, 100]) {
      const ratio = coachFactor('middle', 'great', chem) / coachFactor('middle', 'off', chem)
      expect(ratio, `the pill's span is the same at chemistry ${chem}`).toBeCloseTo(
        ECONOMY.coach.fitFactor.great / ECONOMY.coach.fitFactor.off,
        10,
      )
    }
  })
})

describe('C1 J – schema v79, the full move', () => {
  it('the ladder\'s head is past 79 – this wave\'s rung is not the last one', () => {
    // ⚠ RE-AIMED BY v80 (wave F1) AND DELIBERATELY NOT RE-PINNED TO A NUMBER. «Is 79 the head» was
    // the right question on the day C1 landed and is the wrong one for ever after: an append-only
    // ladder grows, and a case that has to be edited by every later wave is a case that teaches
    // nothing. What C1 actually owes is that ITS rung is reachable and lands where it said – which
    // is the case directly below.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(79)
  })

  it('the v78 -> v79 step back-fills «she has worked with nobody» and «nobody travels»', () => {
    const migrated = migrateSave(load('v78.json')) as WorldState
    // ⚠ THE HEAD OF THE LADDER AND NOT 79: `migrateSave` walks every rung, so a v78 save arrives at
    // whatever the current version is. C1's claim is about the two KEYS the v78 -> v79 step writes,
    // and those are asserted on the next two lines.
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.coachPairs, 'an empty map is exactly true, not a placeholder').toEqual({})
    expect(migrated.sparringTravels, 'round 42 #48, keys only').toBe(false)
  })

  it('...and it is idempotent, which is what an append-only ladder needs from every rung', () => {
    const once = migrateSave(load('v78.json')) as WorldState
    once.coachPairs['budget-1'] = { chem: 12.5, phase: -0.2, standing: 3 }
    const twice = migrateSave(once) as WorldState
    expect(twice.coachPairs['budget-1'], 'a live row is not overwritten by the back-fill').toEqual({
      chem: 12.5,
      phase: -0.2,
      standing: 3,
    })
  })

  it('a fresh career opens with the same two literals the migration writes', () => {
    const world = createWorld('v79-fresh', { ...DEFAULT_PROFILE })
    expect(world.coachPairs, 'on week 0 she has trained with nobody').toEqual({})
    expect(world.sparringTravels).toBe(false)
  })

  it('⭐⭐ A SELF-COACHED CAREER WRITES NO ROW AND GROWS EXACTLY AS IT ALWAYS HAS', () => {
    // ⚠ THE END-TO-END FORM OF THE «ZERO IS THE IDENTITY» CLAIM, across real ticks rather than at the
    //   function boundary. `accrueCoachPair` is gated on `coachWorksThisWeek(world) && coachId`, so a
    //   girl with no coach never reaches it – the map stays `{}` for the whole career and `growWeek`
    //   is handed 0, which `coachFactor` returns unchanged.
    const world = createWorld('v79-alone', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 60; i++) tickWeek(world, rng)
    expect(Object.keys(world.coachPairs), 'sixty weeks alone, nothing to remember').toHaveLength(0)
  })

  it('...and a career WITH a coach writes exactly one row, for the man she actually trains with', () => {
    const world = createWorld('v79-hired', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const rng = rngFromSeed(world.seed)
    expect(world.coachId, 'this career opens with somebody').not.toBeNull()
    for (let i = 0; i < 60; i++) tickWeek(world, rng)
    expect(Object.keys(world.coachPairs), 'one man, one row').toEqual([world.coachId])
    const pair = world.coachPairs[world.coachId!]
    expect(pair.chem, 'the level has moved off zero').not.toBe(0)
    expect(Math.abs(pair.chem), 'and it is bounded').toBeLessThanOrEqual(100)
    expect(pair.standing, '⚠ and C2\'s number is still untouched after sixty weeks').toBe(0)
  })

  it('⭐ the map is SPARSE – shopping the market writes no row', () => {
    // A row appears on the first week she TRAINS with a man. `buildCoachRoster`, `coachById` and
    // `affinityFor` are all pure reads and none of them can write one.
    const world = createWorld('v79-shop', { ...DEFAULT_PROFILE, coachTier: 'self' })
    buildCoachRoster(world.seed, 14).forEach((c) => affinityFor(world.seed, c.id, world.temperament, c.manner))
    expect(Object.keys(world.coachPairs), 'sixteen dispositions read, zero rows written').toHaveLength(0)
  })
})

describe('C1 K – the manner is not the style, and neither reads the other', () => {
  it('⚠ two facts, two jobs, no overlap (spec §6, fence 1)', () => {
    // A roster where the two were the same fact would show a perfect correlation between them. They
    // are drawn independently, so across 200 careers every (style, manner) combination turns up.
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      for (const c of buildCoachRoster(`k${i}`, 14)) seen.add(`${c.style}:${c.manner}`)
    }
    expect(seen.size, 'all sixteen (style x manner) pairings occur').toBe(16)
  })

  it('...and the affinity does not read `style` at all', () => {
    // Same seed, same coach id, same temperament, same manner – one call, so a style term could not
    // hide in it. This is the negative half of the fence and it is why `affinityFor` takes a manner
    // and not a `Coach`.
    const manners: CoachManner[] = [...COACH_MANNERS]
    for (const m of manners) {
      expect(affinityFor('k', 'budget-1', 'deep', m)).toBe(affinityFor('k', 'budget-1', 'deep', m))
    }
  })
})


// =================================================================================================
// ⭐⭐ C1a IS REFUSED, AND THIS IS WHAT MAKES THE REFUSAL SAFE (17.09)
// =================================================================================================
//
// C1a proposed drawing each roster slot's `style` per career, so that «this tier has nobody for her
// game» could happen. The owner refused it once the roster's real shape was put in front of him:
// «у нас в каждом тире 4 тренера (по 1 на стиль), коридоры их цен вообще не должны были измениться.»
//
// ⚠⚠ THE ROSTER IS A 4×4 LATIN SQUARE AND THAT IS A GUARANTEE, NOT AN ARRANGEMENT. Every tier
// offers every style, so a family's irreversible style choice on screen R can never be taxed by a
// hole in the ladder – which is the same guarantee his 30.07 ruling defends from the other side
// («2 контрпанчера бюджетных, ни одного бигсервера»).
//
// ⭐ AND IT IS WHY THE BENCHED C1a COST 4.7% OF COACHING. Drawing style independently per slot breaks
// the square: 24% of careers drew TWO great fits at a rung and 25% drew NONE, which is arithmetically
// impossible while it holds, and `bestFitCoachAt` breaks the resulting ties by PRICE. The discount was
// the price of a broken invariant rather than the price of variability.
//
// ⚠ This case exists so the draw cannot be re-added silently. It is not a style-fit test and it is
// not a pricing test – it asserts the SHAPE, which is the thing both of those rest on.
describe('the coach roster is a Latin square – every tier offers every style (C1a refused)', () => {
  it('⭐⭐ four coaches a tier, four distinct styles a tier, and every style in every tier', () => {
    const byTier = new Map<string, string[]>()
    for (const slot of ECONOMY.coach.roster) {
      const row = byTier.get(slot.tier) ?? []
      row.push(slot.style)
      byTier.set(slot.tier, row)
    }
    expect(byTier.size, 'the ladder lost or gained a rung').toBe(4)
    const styles = [...new Set(ECONOMY.coach.roster.map((s) => s.style))].sort()
    expect(styles.length, 'the game no longer has four play styles').toBe(4)
    for (const [tier, row] of byTier) {
      expect(row.length, `${tier} does not carry four coaches`).toBe(4)
      expect([...row].sort(), `${tier} does not offer every style exactly once`).toEqual(styles)
    }
  })
})
