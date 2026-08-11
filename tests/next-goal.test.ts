// =================================================================================================
// THE "NEXT GOAL" LADDER (docs/specs/calendar-week-grid.md §4b.2)
// =================================================================================================
//
// The owner, 30.07: «надо что-то более осмысленное писать про цель, например писать реально, что она
// на какой-то тир турнира целится, на четверть или полуфинал, на победу потом, т.е. на шаги ее путь
// разложить. Если долго не получается дойти, то разбавлять какими-то навыками, например next goal:
// improve stability».
//
// WHAT WAS THERE. `goalLine` had two arms: entered for a tournament -> "Win one match at the
// {label}", forever and without ever escalating, and otherwise `weekAhead.label` - the BUTTON's
// text - so an ordinary week printed "Next goal: Training week". The second arm is the one this file
// most wants to keep dead: it is not a goal, it is the week's name written twice.
//
// FOUR THINGS ARE PINNED HERE:
//   1. THE INVERSION. `TierDef.points` is indexed by finish, so a counting result reads back as the
//      round she reached - checked against the catalogue itself, at every tier, rather than against
//      a table copied into a test.
//   2. THE RUNGS ESCALATE, and they skip the rounds a small draw does not have. A Local Open is a
//      draw of eight, so "reach the quarter-final" there is a goal she meets by turning up.
//   3. THE TWO CONVENTIONS the spec asked to be written down rather than discovered: the best-6
//      window as the source, and a result with no `tier` (pre-r5 saves) being unreadable rather than
//      guessable.
//   4. ⚠ THE SKILL LINE READS THE FOG. Naming a wing off her TRUE attributes would leak exactly what
//      the radar's fog exists to hide (decisions.md #11), so the goal is only available when the
//      coach has a note, and it names the wing his own SHOWN estimate puts lowest.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  STUCK_AFTER_WEEKS,
  finishOf,
  ladderStandingFor,
  nextGoalFor,
  nextRungFor,
  rungLine,
  rungsFor,
  skillGoalFor,
  weeksOnRung,
  type GoalFacts,
} from '../src/composables/nextGoal'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { RADAR_AXIS_LABEL } from '../src/engine/radar'
import type { CountingResult, LadderView, RadarAxis, UpcomingEvent } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
/** Comments are not code – the house helper (tests/calendar-screen.test.ts, tests/knock.test.ts).
 *  This card documents what it deliberately STOPPED doing, and naming the composable it no longer
 *  calls was enough to fail a raw `not.toContain` on the first run. */
const codeOf = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

function ladder(results: CountingResult[] = []): LadderView {
  return { rank: null, prevRank: null, points: 0, standings: [], countingResults: results }
}
function axis(over: Partial<RadarAxis> = {}): RadarAxis {
  // ⚠ `startValue` ARRIVED WITH THE THIRD CONTOUR (11.08) and defaults BELOW `shownValue`, which is
  // what a career that has gone forward looks like. This file is about the next-goal card and never
  // reads it; the default is here so the shape stays a real `RadarAxis` rather than a cast.
  return { key: 'serve', shownValue: 50, startValue: 42, band: 6, ceilingLo: 60, ceilingHi: 80, note: null, ...over }
}
function event(over: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    id: 'e1', week: 7, tier: 'local', surface: 'hard', label: 'Local Open', entered: false,
    eligible: true, cancellable: false, deadlineWeek: 6, entryFeeCents: 0, travelCostCents: 0,
    preview: { firstMatchChance: 0.5, opponentName: 'Mirra', fieldStrength: 'even', temperatureC: 20, crowd: 40 },
    ...over,
  } as UpcomingEvent
}
/** ⚠ `ladders` IS MERGED, NOT REPLACED (task #17). Every case in this file names only the tables it
 *  is about – almost all of them `{ domestic, itf }` – and when the third table arrived that stopped
 *  compiling in twenty-four places at once. Widening the parameter here rather than adding
 *  `wta: ladder()` to twenty-four literals keeps each case saying what it is about, and means a
 *  FOURTH table would cost this file nothing. Nothing is weakened: an empty `LadderView` is exactly
 *  what those cases were already asserting against for the table they did not mention. */
function facts(over: Partial<Omit<GoalFacts, 'ladders'>> & { ladders?: Partial<GoalFacts['ladders']> } = {}): GoalFacts {
  return {
    week: 30,
    upcoming: [],
    radar: [],
    ...over,
    ladders: { domestic: ladder(), itf: ladder(), wta: ladder(), ...over.ladders },
  }
}
/** A counting result AT a given round of a given tier, priced off the catalogue itself. */
function result(tier: TierId, finish: number, week = 10): CountingResult {
  return { week, tier, points: TIERS[tier].points[finish] }
}

// =================================================================================================
// 1. THE INVERSION
// =================================================================================================
describe('a result reads back as the round she reached', () => {
  it('every finish at every tier inverts, off the engine\'s own points table', () => {
    for (const tier of TIER_LADDER) {
      const table = TIERS[tier].points
      for (let finish = 0; finish < table.length; finish++) {
        expect(finishOf(result(tier, finish)), `${tier} finish ${finish}`).toEqual({ tier, finish })
      }
      // the table is strictly decreasing, which is WHY the inversion is unambiguous inside a tier
      for (let i = 1; i < table.length; i++) expect(table[i], `${tier}`).toBeLessThan(table[i - 1])
      // ...and the last entry is the wave-B/W2-LADDER family split: 0 everywhere a first-round
      // loss pays nothing, the real chart's nominal 1 at W50/W75/WTA125 (see
      // tests/wave-b-points.test.ts NOMINAL_ONE_TIERS for the whole ruling). The inversion stays
      // unambiguous either way - strict descent is asserted above.
      // ⚠ W3-ACT2 EXTENDS THE NOMINAL-ONE FAMILY RATHER THAN CHANGING THE RULE: research §4's
      // chart pays "a nominal 1 point higher up" from W50, and WTA 250/500 carry it too. The two
      // biggest rungs do NOT - a WTA 1000's own row bottoms at 65 and a Slam's at 130, because
      // their published tables are 32-main-draw rows in which even the first round is somebody who
      // cleared the hardest acceptance list in the sport.
      expect(table.at(-1), `${tier}`).toBe(
        tier === 'slam' ? 130 : tier === 'wta1000' ? 65
          : ['w50', 'w75', 'wta125', 'wta250', 'wta500'].includes(tier) ? 1 : 0,
      )
    }
  })

  it('⚠ CONVENTION 2: a result with no tier is unreadable rather than guessable', () => {
    // Pre-r5 saves stored results without a tier, and the same points value means a different round
    // at every rung - a local title and a J30 title both pay 30. Guessing would put a girl on a rung
    // she never reached, so it is skipped, and a whole window of them falls back to the first rung.
    expect(finishOf({ week: 3, points: 30 })).toBeNull()
    const old = facts({ ladders: { domestic: ladder([{ week: 3, points: 30 }]), itf: ladder() } })
    expect(ladderStandingFor(old)).toBeNull()
    expect(nextRungFor(old)).toEqual(rungsFor(TIER_LADDER[0])[0])
  })

  it('a points value that is not in its tier\'s table reads as nothing at all', () => {
    // A tuning change that re-prices a tier would otherwise silently map old results onto wrong
    // rounds. Better to say nothing than to say something false about how far she got.
    expect(finishOf({ week: 3, tier: 'local', points: 41 })).toBeNull()
  })
})

// =================================================================================================
// 2. THE RUNGS
// =================================================================================================
describe('the rungs escalate, and a small draw does not pretend to have rounds it lacks', () => {
  it('a 32-draw has all five rungs; a Local Open has three', () => {
    // national: [W,F,SF,QF,R16,R32] – one match won is the round of 16, then QF, SF, F, title.
    expect(rungsFor('national').map((r) => r.finish)).toEqual([4, 3, 2, 1, 0])
    // regional (draw 16): winning one match IS the quarter-final, so the QF rung collapses into it.
    expect(rungsFor('regional').map((r) => r.finish)).toEqual([3, 2, 1, 0])
    // local (draw 8): its first round is the quarter-final, so "reach the QF" would be met by
    // turning up. One match won is the semi-final.
    expect(rungsFor('local').map((r) => r.finish)).toEqual([2, 1, 0])
    for (const tier of TIER_LADDER) {
      expect(rungsFor(tier)[0].firstMatch, tier).toBe(true)
      expect(rungsFor(tier).at(-1)!.finish, tier).toBe(0)
      // strictly harder, rung by rung – a ladder that ever asked for less would be a bug you could
      // only see by playing for a season
      const finishes = rungsFor(tier).map((r) => r.finish)
      for (let i = 1; i < finishes.length; i++) expect(finishes[i]).toBeLessThan(finishes[i - 1])
    }
  })

  it('it climbs: each result moves the goal to the next round up', () => {
    const at = (finish: number) =>
      nextRungFor(facts({ ladders: { domestic: ladder([result('national', finish)]), itf: ladder() } }))
    expect(at(5).finish).toBe(4) // a first-round loss still only asks for one match
    expect(at(4).finish).toBe(3)
    expect(at(3).finish).toBe(2)
    expect(at(2).finish).toBe(1)
    expect(at(1).finish).toBe(0)
  })

  it('winning a tier moves her up and starts again at "win one match"', () => {
    const won = facts({ ladders: { domestic: ladder([result('regional', 0)]), itf: ladder() } })
    const next = nextRungFor(won)
    expect(next.tier).toBe('national')
    expect(next.firstMatch).toBe(true)
    // ⚠ RE-AIMED, NOT WEAKENED (task #17, then W2-LADDER): the top of the ladder is the WTA 125
    // now. The claim is unchanged and is still asserted twice - a title moves the goal to the next
    // rung up, and at the rung with nothing above it the goal stays "win it". What moved is where
    // the ceiling is, twice over: a J300 title hands her the professional tour's first rung, and a
    // W100 title now hands her the 125 instead of ending the game's ambitions - the ~x2-per-step
    // growth act2-pro-tour.md §2 built the middle rungs for.
    const wasTop = facts({ ladders: { itf: ladder([result('j300', 0)]) } })
    expect(nextRungFor(wasTop)).toEqual({ tier: 'w15', finish: 4, firstMatch: true })
    const wasW100 = facts({ ladders: { wta: ladder([result('w100', 0)]) } })
    expect(nextRungFor(wasW100)).toEqual({ tier: 'wta125', finish: 4, firstMatch: true })
    // ⚠ RE-AIMED A THIRD TIME (W3-ACT2): the ceiling moved four rungs, so a WTA 125 title now hands
    // her the 250 and the "nothing above it" case is the Grand Slam. Both halves of the claim are
    // still asserted, which is the whole point of the pair.
    const wasWta125 = facts({ ladders: { wta: ladder([result('wta125', 0)]) } })
    expect(nextRungFor(wasWta125)).toEqual({ tier: 'wta250', finish: 4, firstMatch: true })
    const top = facts({ ladders: { wta: ladder([result('slam', 0)]) } })
    expect(nextRungFor(top)).toEqual({ tier: 'slam', finish: 0, firstMatch: false })
  })

  it('the goal is about the STRONGEST tier she has played, not the busiest', () => {
    // Five local titles and one national first-round loss: she is climbing the National.
    const f = facts({
      ladders: {
        domestic: ladder([result('local', 0, 4), result('local', 0, 8), result('national', 5, 20)]),
        itf: ladder(),
      },
    })
    expect(ladderStandingFor(f)!.tier).toBe('national')
    expect(nextRungFor(f).tier).toBe('national')
  })

  it('BOTH ladders are read – an international result is not invisible to the goal', () => {
    const f = facts({ ladders: { domestic: ladder([result('national', 2)]), itf: ladder([result('j30', 3)]) } })
    expect(nextRungFor(f).tier).toBe('j30')
  })

  it('a career with nothing in the window is on the first rung of the first tier', () => {
    const first = nextRungFor(facts())
    expect(first.tier).toBe(TIER_LADDER[0])
    expect(first.firstMatch).toBe(true)
    expect(rungLine(first, TIERS.local.label)).toBe('Win one match at the Local Open')
  })

  it('the lines read as goals, in the app\'s own round vocabulary', () => {
    expect(rungLine({ tier: 'national', finish: 4, firstMatch: true }, 'National Series'))
      .toBe('Win one match at the National Series')
    expect(rungLine({ tier: 'national', finish: 3, firstMatch: false }, 'National Series'))
      .toBe('Reach the quarter-final at the National Series')
    expect(rungLine({ tier: 'national', finish: 2, firstMatch: false }, 'National Series'))
      .toBe('Reach the semi-final at the National Series')
    expect(rungLine({ tier: 'national', finish: 1, firstMatch: false }, 'National Series'))
      .toBe('Reach the final at the National Series')
    expect(rungLine({ tier: 'national', finish: 0, firstMatch: false }, 'National Series'))
      .toBe('Win the National Series')
    // ⚠ ONE VOCABULARY: the round names come from tierState.ts's `finishPhrase`, which is where the
    // Home ladder's "one more semi-final at Regional Championship" also comes from. Two spellings of
    // "the round after a quarter-final" is the drift every shared-vocabulary note in this codebase
    // is about.
    expect(read('../src/composables/nextGoal.ts')).toContain("import { finishPhrase } from './tierState'")
  })
})

// =================================================================================================
// 3. WHAT THE SCRAP PRINTS
// =================================================================================================
describe('the goal the card prints', () => {
  it('an entered tournament owns the goal, and it names that draw', () => {
    const f = facts({
      upcoming: [event({ entered: true, tier: 'regional', label: 'Regional Championship' })],
      ladders: { domestic: ladder([result('regional', 2)]), itf: ladder() },
    })
    // she has reached a semi-final there, so the goal is the final – NOT "win one match" forever,
    // which is what the arm this replaced said until the end of the career.
    expect(nextGoalFor(f).text).toBe('Reach the final at the Regional Championship')
    expect(nextGoalFor(f).kind).toBe('rung')
  })

  it('...and the rung is the one AT THAT DRAW, not her overall best', () => {
    // A National semi-finalist entering a Local Open is still being asked to win the Local Open, not
    // to reach a semi-final she has already had elsewhere.
    const f = facts({
      upcoming: [event({ entered: true, tier: 'local', label: 'Local Open' })],
      ladders: { domestic: ladder([result('national', 2), result('local', 1)]), itf: ladder() },
    })
    expect(nextGoalFor(f).text).toBe('Win the Local Open')
  })

  it('⚠ AN ORDINARY WEEK NEVER PRINTS THE WEEK\'S OWN NAME AGAIN', () => {
    // The dead arm: `weekAhead.label` put "Next goal: Training week" on the scrap. Nothing in the
    // ladder can produce a week's name, and the card no longer reads the composable that has one.
    const card = codeOf(read('../src/components/WeekRecapCard.vue'))
    expect(card).toContain('const goalLine = computed(() => (game.snapshot ? nextGoalFor(game.snapshot).text : \'\'))')
    expect(card, 'the card still reads the week-ahead composable for its goal').not.toContain('useWeekAhead')
    expect(nextGoalFor(facts()).text).toBe('Win one match at the Local Open')
  })

  it('the goal names the TIER when nothing is booked, and the event when something is', () => {
    const standing = { domestic: ladder([result('regional', 2)]), itf: ladder() }
    expect(nextGoalFor(facts({ ladders: standing })).text).toBe('Reach the final at the Regional Championship')
    expect(
      nextGoalFor(facts({ ladders: standing, upcoming: [event({ entered: true, tier: 'local', label: 'Spring Local Open' })] })).text,
    ).toBe('Win one match at the Spring Local Open')
  })

  it('⚠ A TITLE SHE ALREADY HOLDS NEVER PRINTS "WIN IT AGAIN" – the goal escalates past the draw', () => {
    // The owner's own screen (01.08): she won the W15, was entered for the NEXT W15, and the scrap
    // read "Next goal: Win the World Tour 15". `rungAfter` is null when the title is hers, and the
    // old fallback printed {finish: 0} - the tier's own title, again. The arm now falls through to
    // the GLOBAL rung under the TIER's label (never the entered event's - she is not climbing the
    // event she is entered for, she is climbing the ladder above it).
    const won = facts({
      upcoming: [event({ entered: true, tier: 'w15', label: 'World Tour 15 Monastir' })],
      ladders: { wta: ladder([result('w15', 0)]) },
    })
    const goal = nextGoalFor(won)
    expect(goal.text).toBe('Win one match at the World Tour 35')
    expect(goal.rung).toEqual({ tier: 'w35', finish: 4, firstMatch: true })
    // ...and the same shape one table down, where the rung above a won Regional is National.
    const reg = facts({
      upcoming: [event({ entered: true, tier: 'regional', label: 'Regional Championship' })],
      ladders: { domestic: ladder([result('regional', 0)]) },
    })
    expect(nextGoalFor(reg).text).toBe('Win one match at the National Series')
    // A W100 title escalates to the rung W2-LADDER put above it...
    const w100 = facts({
      upcoming: [event({ entered: true, tier: 'w100', label: 'World Tour 100 Dubai' })],
      ladders: { wta: ladder([result('w100', 0)]) },
    })
    expect(nextGoalFor(w100).text).toBe('Win one match at the WTA 125')
    // ⚠ RE-AIMED BY W3-ACT2, AND THE RE-AIM IS THE WHOLE POINT OF THE WAVE. A WTA 125 title used to
    // be the top of the world, so "win it" was the honest goal there; there are four rungs above it
    // now, so the escalation keeps going and the 125 case moves to the ordinary arm.
    const wta125 = facts({
      upcoming: [event({ entered: true, tier: 'wta125', label: 'WTA 125 Limoges' })],
      ladders: { wta: ladder([result('wta125', 0)]) },
    })
    expect(nextGoalFor(wta125).text).toBe('Win one match at the WTA 250')
    // ...and at the very top there is still nothing above, so "win it" IS the honest goal - the one
    // case the old fallback was right about, kept right, one storey higher. The calendar's own
    // standing rule ("there must ALWAYS be somewhere to go") now runs out at a Grand Slam, which is
    // where a tennis career runs out of somewhere to go too.
    const top = facts({
      upcoming: [event({ entered: true, tier: 'slam', label: 'Grand Slam Melbourne' })],
      ladders: { wta: ladder([result('slam', 0)]) },
    })
    // `rungLine`'s `where` is the TIER's own label when she is entered for one, so the top rung
    // prints its catalogue name. Fictional by the Style rules - a category, never a city.
    expect(nextGoalFor(top).text).toBe('Win the Grand Slam')
  })

  it('⚠ `bestAt` READS ALL THREE TABLES – a W15 result is not invisible to the entered arm', () => {
    // The latent twin of the ladderStandingFor fold (task #17): her STANDING sits at W35 (the
    // stronger tier), she is entered for a W15, and her W15 semi-final lives in the wta table -
    // which `bestAt` did not fold. The goal then asked her to win one match at a draw she had
    // already gone deep in.
    const f = facts({
      upcoming: [event({ entered: true, tier: 'w15', label: 'World Tour 15 Antalya' })],
      ladders: { wta: ladder([result('w35', 3), result('w15', 2)]) },
    })
    expect(nextGoalFor(f).text).toBe('Reach the final at the World Tour 15 Antalya')
  })
})

// =================================================================================================
// 4. ⚠ THE SKILL LINE, AND THE FOG IT MUST NOT LIFT
// =================================================================================================
describe('the skill goal reads the coach, never her true build', () => {
  const stuck = { domestic: ladder([result('regional', 2, 1)]), itf: ladder() }

  it('it exists only when the coach has something to say', () => {
    // A stranger of a daughter has no diagnosis to offer, and on a week-1 radar he is silent about
    // half her wings. Silence is a state here, not a fallback.
    expect(skillGoalFor(facts({ radar: [axis(), axis({ key: 'ret' })] }))).toBeNull()
    expect(skillGoalFor(facts({ radar: [axis({ key: 'ret', note: 'The return is where she loses.' })] })))
      .toBe('Work on her return')
  })

  it('it names the wing HIS OWN ESTIMATE puts lowest – never the engine\'s number', () => {
    const line = skillGoalFor(
      facts({
        radar: [
          axis({ key: 'serve', shownValue: 70, note: 'The serve is a weapon.' }),
          axis({ key: 'stamina', shownValue: 32, note: 'She fades in a third set.' }),
          axis({ key: 'ret', shownValue: 20, note: null }), // lower, but he has said nothing
        ],
      }),
    )
    expect(line).toBe('Work on her stamina')
    // ⚠ `shownValue` IS THE FOGGED ESTIMATE THE PLAYER IS ALREADY SHOWN on screen C, which is the
    // whole reason it may be read here. The module must not reach for anything the radar hides.
    const src = read('../src/composables/nextGoal.ts')
    for (const forbidden of ['ceilingHi', 'ceilingLo', '.band', 'potential', 'skills.']) {
      expect(src, `the goal reached for ${forbidden}`).not.toContain(forbidden)
    }
    // ...and the wing's word is the engine's own, so `ret` can never reach a parent as "Ret"
    expect(src).toContain('RADAR_AXIS_LABEL')
    expect(RADAR_AXIS_LABEL.ret).toBe('Return')
  })

  it('it appears only after a LONG stall, and never over a booked tournament', () => {
    const spoken = [axis({ key: 'stamina', shownValue: 30, note: 'She fades in a third set.' })]
    // one week on the rung: the ladder still has something to ask for
    expect(nextGoalFor(facts({ week: 2, ladders: stuck, radar: spoken })).kind).toBe('rung')
    // a long way in: the scrap changes the subject
    const long = facts({ week: 1 + STUCK_AFTER_WEEKS, ladders: stuck, radar: spoken })
    expect(nextGoalFor(long).kind).toBe('skill')
    expect(nextGoalFor(long).text).toBe('Work on her stamina')
    // ...but a booked draw always wins: she is playing it this week or next.
    const booked = facts({
      week: 1 + STUCK_AFTER_WEEKS,
      ladders: stuck,
      radar: spoken,
      upcoming: [event({ entered: true, tier: 'regional', label: 'Regional Championship' })],
    })
    expect(nextGoalFor(booked).kind).toBe('rung')
  })

  it('⚠ THE THRESHOLD IS A MEASURED NUMBER, and the bench that measured it is in the tree', () => {
    // The spec's instruction was the order, not the value: measure how long a career really sits on
    // one rung BEFORE wiring the copy, and say so if the rungs turn out to be spaced wrong. The
    // measurement (12 seeds x 3 backgrounds x 208 weeks) is written out at the constant.
    expect(STUCK_AFTER_WEEKS).toBe(20)
    const src = read('../src/composables/nextGoal.ts')
    expect(src).toContain('tools/next-goal-bench.ts')
    expect(src).toContain('median 11w')
    // ...and it is past the median of the number it is compared against (16w), or "stuck" would
    // describe the ordinary state of a career rather than a stall.
    expect(STUCK_AFTER_WEEKS).toBeGreaterThan(16)
    expect(read('../tools/next-goal-bench.ts')).toContain('MEASUREMENT ONLY')
  })

  it('weeks on the rung count from the result that put her there', () => {
    const f = facts({ week: 40, ladders: { domestic: ladder([result('regional', 2, 12)]), itf: ladder() } })
    expect(weeksOnRung(f)).toBe(28)
    // the EARLIEST time she got that far, not the latest repeat of it
    const twice = facts({
      week: 40,
      ladders: { domestic: ladder([result('regional', 2, 12), result('regional', 2, 30)]), itf: ladder() },
    })
    expect(weeksOnRung(twice)).toBe(28)
    // an empty window has been trying to win its first match since week 0
    expect(weeksOnRung(facts({ week: 9 }))).toBe(9)
  })
})

// =================================================================================================
// THE PAYLOAD DID NOT MOVE
// =================================================================================================
describe('nothing new on the Snapshot, the protocol or the save schema', () => {
  it('the ladder is arithmetic on fields that have been there since r5', () => {
    const src = read('../src/composables/nextGoal.ts')
    expect(src).toContain("export type GoalFacts = Pick<Snapshot, 'week' | 'ladders' | 'upcoming' | 'radar'>")
    // it reads the engine's CATALOGUE (a table of constants) and never its state
    expect(src).toContain("import { TIERS, TIER_LADDER } from '../engine/season/calendar'")
    for (const forbidden of ['createWorld', 'tickWeek', 'schemaVersion', 'migrat']) {
      expect(src, `the goal reached for ${forbidden}`).not.toContain(forbidden)
    }
  })

  it('player copy: short dash only, no Cyrillic in anything the scrap can print', () => {
    const lines = [
      ...TIER_LADDER.flatMap((t) => rungsFor(t).map((r) => rungLine(r, TIERS[t].label))),
      skillGoalFor(facts({ radar: [axis({ note: 'x' })] }))!,
    ]
    for (const line of lines) {
      expect(line).not.toContain('—')
      expect(line).not.toMatch(/[Ѐ-ӿ]/)
      expect(line).not.toMatch(/undefined|null|NaN/)
      expect(line.length).toBeGreaterThan(8)
    }
  })
})
