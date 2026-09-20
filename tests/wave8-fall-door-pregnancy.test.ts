// RULING B – THE FALL DOOR DECLINES WHILE A PREGNANCY STANDS (life/wave-8, T6's fourth commit;
// the architect's ruling of 20.09, carried to the owner as a ruling to confirm).
//
// ⚠⚠ THE DEFECT, AND IT IS ROUND 45's RULED MACHINERY READING THE WRONG FACT. `resolveLeaving`'s
// fall door latches «She stopped after the fall» on three terms – points at most halved, rank at
// least doubled, and thirty places gone – and every one of them is exactly what A YEAR OF NOT
// PLAYING produces. `WINDOW_BY_TRACK` and `windowedBestSum` age her book out BY CONSTRUCTION through
// the 51 weeks the maternity pause runs (`termWeeks` + `decisionWeeksAfterBirth`), so on the wrap
// week inside that pause the instrument reads «her results collapsed» while the truth is «she did
// not play». A career could therefore END, irreversibly, ABOUT A SEASON SHE SPENT OFF TOUR HAVING A
// CHILD.
//
// ⭐ THE PRECEDENT IS ALREADY IN THAT FUNCTION, ONE LINE UP: `if (inCollege(world)) return`. The
// college absence is ALREADY excluded explicitly, and `leavingViewOf`'s own note carries the
// sentence the new clause is written from – «a season she spent at college … is not a season she
// fell FROM – it is a gap». The maternity pause is the game's second kind of absence and the same
// refusal extends to it. This is the existing rule meeting a new case, not new design.
//
//   §A  the defect, posed and refused: a career at a wrap week inside the pause, with all three of
//       the fall's terms met and a coin that lands, latches NOTHING
//   §B  ⚠ THE BOUNDARY: the clause covers the PAUSE and deliberately not the COMEBACK RAMP
//   §C  nothing else about round 45 moved – the peak door and an ordinary fall are untouched
//
// MUTATION LEDGER – run red-first, applied by a scripted exact-string edit with an md5 receipt and
// reverted by md5, on a re-verified green baseline. ⚠ THE COUNTS ARE **MEASURED** REDS:
//   ARM 1  the clause deleted (`if (world.pregnancy !== null) return`)  → 3 RED on a 5-green
//          – i.e. the code exactly as it stood before this commit          baseline: §A.1 and §A.2,
//          which is the whole point of the file – without it the door        and §C.1's structural
//          latches `'fall'` on a season she spent pregnant                    read
//
// ⚠⚠ ONE FIXTURE FINDING IS IN THIS LEDGER ON PURPOSE. The first draft built the fall out of
// `seasonHistory` alone and EVERY seed was refused, on `view.professional === false`: what makes her
// professional is `bestFinishByTier` (through `activeLadderOf` -> `wtaEverCounted` ->
// `everCountedOn`), which is an INDEX into the tier's `points` array and not a round letter. A
// fixture that never qualifies would have made «nothing latched» pass for the wrong reason on every
// case in the file – which is exactly what §A.1's control exists to catch, and did.

import { describe, it, expect } from 'vitest'
import {
  createWorld,
  kidAgeExact,
  resolveLeaving,
  type WorldState,
} from '../src/engine/world'
import { leavingViewOf } from '../src/engine/world/endings'
import { fallLeavingDue, peakLeavingDue, ENDINGS } from '../src/engine/ending'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { engineModuleSource } from './worldSource'
import { region } from './helpers/source'
import type { LoveEpisode } from '../src/shared/protocol'

const BRIEF = { playsOnWeeks: 8, termWeeks: 31 } as const

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** ⭐⭐ A CAREER STANDING ON AN OFF-SEASON WRAP WEEK WITH THE FALL'S THREE TERMS MET.
 *
 *  ⚠ THE TERMS ARE BUILT FROM THE ENGINE'S OWN CONSTANTS AND THEN READ BACK THROUGH
 *  `leavingViewOf` / `fallLeavingDue`, never asserted from arithmetic here: the claim of this file is
 *  about the CLAUSE, so the fall itself has to be the engine's own verdict or the case would prove
 *  nothing about the door it is supposed to be standing in front of.
 *
 *  ⚠ `wtaEverCounted` IS WHAT MAKES HER PROFESSIONAL, and it is fed by the banked season rows below
 *  rather than poked: `activeLadderOf` reads the unpruned high-water mark, so a career with two W
 *  seasons in `seasonHistory` is on the professional table exactly as a real one would be. */
function fallen(seed: string): WorldState {
  const world = createWorld(seed)
  const age = weekAtAge(world, 30)
  // the wrap week of the season she is standing in – `resolveLeaving`'s own week and no other
  const week = Math.ceil((age - (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)) / WEEKS_PER_YEAR) * WEEKS_PER_YEAR
    + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
  world.week = week
  world.condition = 100
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: 0, answer: 'continue', offer: null }
  world.loveEpisodes = [married(week - 156, week - 104)]
  // ⚠⚠ WHAT MAKES HER PROFESSIONAL IS , NOT THE BANKED SEASONS – checked rather
  // than assumed, because the first draft of this fixture set only  and
  //  refused every seed on .  asks
  // , which asks  over the TROPHY-shaped : a rung on
  // the W track with a finish that pays points. One real W result is what a career that fell from #60
  // obviously has, so the fixture says so.
  world.bestFinishByTier = { ...world.bestFinishByTier, w75: 0 }
  const now = seasonIndexOf(week)
  world.seasonHistory = [
    // the season she fell FROM: a real professional year, well above `fallPointsFloor`
    { seasonIndex: now - 1, byTrack: { wta: { endRank: 60, points: 900 } } },
    // ...and the one that just closed: points more than halved, rank more than doubled and far more
    // than thirty places gone – which is what a year off tour produces, and is the whole problem
    { seasonIndex: now, byTrack: { wta: { endRank: 420, points: 80 } } },
  ] as never
  return world
}

/** The record `rollPregnancy` writes, posed so that `world.week` sits INSIDE the pause. */
function expectingAround(world: WorldState, pausesWeek: number): WorldState {
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    announcedWeek: pausesWeek - BRIEF.playsOnWeeks,
    pausesWeek,
    dueWeek: pausesWeek + BRIEF.termWeeks,
    support: 'warm',
    rankAtPause: 60,
  }
  return world
}

/** A seed whose `seed:ending:fall:<seasonIndex>` coin lands under the 1% chance – SEARCHED, never
 *  forced, on T5's own rule: a chance overwritten to 1 would make every assertion below an assertion
 *  about a stub. */
function fallenWithACoin(prefix: string): WorldState {
  for (let i = 0; i < 4000; i++) {
    const world = fallen(`${prefix}-${i}`)
    const view = leavingViewOf(world)
    if (!fallLeavingDue(view) || peakLeavingDue(view)) continue
    if (rngFromSeed(`${world.seed}:ending:fall:${view.seasonIndex}`)() < ENDINGS.fallLeavingChance) return world
  }
  throw new Error(`no seed under '${prefix}' whose fall coin lands`)
}

// =================================================================================================
// A. THE DEFECT, POSED AND REFUSED
// =================================================================================================
describe('ruling B A – the fall door does not fire on a season she spent pregnant', () => {
  it('⭐⭐⭐ all three terms met, the coin lands, and NOTHING latches while the record stands', () => {
    const world = fallenWithACoin('rb-fall')
    const view = leavingViewOf(world)
    // ⚠⚠ THE CONTROL FIRST, AND IT IS WHAT MAKES THE CASE MEAN ANYTHING: with no pregnancy this very
    // career ENDS. Without it «nothing latched» would be satisfied by a career that never qualified,
    // by a coin that missed, or by the wrong week – three ways to pass for the wrong reason.
    expect(view.professional, 'control: she is on the professional table').toBe(true)
    expect(fallLeavingDue(view), 'control: the engine\'s own verdict is that the year collapsed').toBe(true)
    resolveLeaving(world)
    expect(world.ending?.type, 'control: and the door really does latch on this career').toBe('fall')

    // ...and now the same career, the same week, the same coin, with the record standing.
    const pregnant = expectingAround(fallenWithACoin('rb-fall'), 0)
    pregnant.pregnancy!.pausesWeek = pregnant.week - 30
    pregnant.pregnancy!.dueWeek = pregnant.pregnancy!.pausesWeek + BRIEF.termWeeks
    expect(pregnant.week, 'the fixture really is INSIDE the pause').toBeGreaterThan(pregnant.pregnancy!.pausesWeek)
    expect(fallLeavingDue(leavingViewOf(pregnant)), 'and the instrument still reads a collapse').toBe(true)
    resolveLeaving(pregnant)
    expect(pregnant.ending, '⚠⚠ «she did not play» is not «her results collapsed»').toBeNull()
  })

  it('⚠ and the refusal is the RECORD\'s and not the week\'s – clearing it re-opens the door', () => {
    // The clause reads `world.pregnancy` and nothing else, which is the decoupling law's own shape
    // (§14's banner) and is what keeps the exclusion exactly as long as the absence.
    const world = expectingAround(fallenWithACoin('rb-clear'), 0)
    world.pregnancy!.pausesWeek = world.week - 30
    resolveLeaving(world)
    expect(world.ending, 'shut while she is carrying').toBeNull()
    world.pregnancy = null
    resolveLeaving(world)
    expect(world.ending?.type, '...and open the moment the record goes').toBe('fall')
  })
})

// =================================================================================================
// B. ⚠ THE BOUNDARY – the pause, and deliberately NOT the comeback ramp
// =================================================================================================
describe('ruling B B – a fall during the COMEBACK stays possible, and that is the design', () => {
  it('⭐⭐ a career with a live `comeback` and no pregnancy can still latch the fall', () => {
    // ⚠⚠ THIS IS THE HALF THAT MUST NOT BE «FIXED». «She came back and could not regain it» is
    // exactly the research's ~40% read from the other side, and suppressing it would hide the wave's
    // own honest outcome. The clause stops of its own accord on the day the ramp begins, because
    // `resolveReturnDecision` clears `world.pregnancy` on both arms – one record, no second date.
    const world = fallenWithACoin('rb-ramp')
    world.comeback = { returnedWeek: world.week - 20, protectedRank: null, returnPlan: 'straight-back' }
    resolveLeaving(world)
    expect(world.ending?.type, 'the comeback that did not work is a real ending').toBe('fall')
  })
})

// =================================================================================================
// C. NOTHING ELSE ABOUT ROUND 45 MOVED
// =================================================================================================
describe('ruling B C – one clause, beside an identical one', () => {
  it('⚠ the clause is the COLLEGE clause\'s twin – same function, same position, same shape', () => {
    // A structural read rather than a behavioural one, because the claim is about the SHAPE of the
    // refusal: two absences, two `return`s, no new machinery and no new date anywhere.
    const src = readLeaving()
    expect(src.includes('if (inCollege(world)) return'), 'the precedent is still there').toBe(true)
    expect(src.includes('if (world.pregnancy !== null) return'), 'and the new clause is its twin').toBe(true)
    expect(src.includes('ENDINGS.fallLeavingChance'), 'the coin is untouched').toBe(true)
  })

  it('⚠ an ordinary fall on an ordinary career is exactly what it was', () => {
    const world = fallenWithACoin('rb-ordinary')
    expect(world.pregnancy, 'nothing here is pregnant').toBeNull()
    resolveLeaving(world)
    expect(world.ending?.type, 'round 45 still works').toBe('fall')
    expect(world.ending?.detail, 'and its record is the one it always wrote').toBeTruthy()
  })
})

/** `resolveLeaving`'s own text, cut with the marker helpers – never a raw `indexOf` slice, which
 *  widens in silence when a marker rots (`tests/helpers/source.ts`, and `npm run pins:check` is the
 *  ratchet that stops a new one appearing). */
function readLeaving(): string {
  return region(
    engineModuleSource('world'),
    'export function resolveLeaving(world: WorldState): void {',
    'export function raiseForkOpinion(',
  )
}
