// ⭐⭐ ROUND-21 #2 – THE COACH ACTUALLY TRAVELS, IT COSTS MONEY, AND IT IS VISIBLE.
//
// THE OWNER, 14.08, ASKING FOR THE THIRD TIME:
//   «Тренер всё ещё не едет на соревнования, как так? Уже 3й раз прошу сделать»
// ...and, on being asked what «едет» should actually build:
//   «прибавка к силе матча сделала элитные результаты ХУЖЕ – это на старых измерениях? мы построили
//    новый стенд, надо актуализировать данные. Присутствие в потоке и трансляции точно надо (если
//    едет), но бонус какой-то тоже нужен, я считаю. А может и не один даже.»
//
// (The quotes live in a TEST rather than in the template they are about: tests/round13-nav.test.ts
// bans Cyrillic inside a Vue template, comments included, and it has caught two drafts of this
// feature's own copy doing exactly that.)
//
// ⚠ WHY IT TOOK THREE ASKS, AND WHAT IS AND IS NOT BEING REVERSED. On 30.07 three STAT versions of
// coach travel were built and measured and all three failed (commit 77e08aa: the boolean cost +$21k
// at elite and bought +0.6 skill points; a run-fatigue discount moved 2 condition points out of ~36;
// a match-strength edge made elite results WORSE, 12.7 wins to 5.8). The owner cancelled the
// mechanic, the switch was locked, and round-20 #1 answered his SECOND report by rewriting the
// locked row's sub-line instead of building anything.
//
// This file is the PRESENCE half and it adds no stat at all. He goes, it costs a second fare, and
// four surfaces say so: the coach room, the tournament flow, the running commentary and the week's
// story. Re-measuring the three stat arms on the rebuilt bench is a separate arm of the same wave.
//
// ⚠ AND THE 08.08 TRAVEL NOTIFICATION FINALLY BECOMES BUILDABLE HERE. His ask that day: «можно
// наверное какое-то уведомление игроку давать, что поездки теперь возможны». docs/decisions.md wrote
// down why nobody could act on it - "travel never becomes possible ... so a notice saying it is now
// available would be false. Needs the unlock ruled on first." The unlock is this branch.
//
// ⚠ MUTATION-VERIFIED, each block naming what was broken to watch it fail:
//   * delete the `chargeCoachTravel` call in world.ts   -> §2 goes red (the money never leaves).
//   * make `coachTravelFareFor` return `event.travelCostCents` instead of `travelCostFor(world, e)`
//                                                       -> §1's academy arm goes red.
//   * drop the `world.coachId === null` clause          -> §1's self-coached arm and §4's notice arm.
//   * drop the fifth argument at MatchViewer's call site or make `coach` unread in buildCommentary
//                                                       -> §5 goes red on both halves.
//   * make the coach beat fire on every point instead of at a set break
//                                                       -> §5's "not on every beat" goes red.
//   * remove the `week > world.week` clause in markCoachTravelOpen
//                                                       -> §4's "before the trip" goes red.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  enterEvent,
  setCoachOnEventWeeks,
  coachTravelFareFor,
  travelCostFor,
  coachTravelsWithHer,
  decideKnock,
  pendingKnock,
  closeTournament,
  skipTournament,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
// ⚠ STRAIGHT FROM ITS OWN MODULE: `world.ts` imports `chargeCoachTravel` but does not re-export it,
// and widening that public surface for a test would be the tail wagging the dog.
import { chargeCoachTravel } from '../src/engine/world/sponsors'
import type { TierId } from '../src/engine/season/types'
import { DEFAULT_PROFILE, type Snapshot } from '../src/shared/protocol'
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import type { MatchOptions, MatchPlayer } from '../src/engine/match/types'
import { buildCommentary } from '../src/viz/commentary'

// -------------------------------------------------------------------------------------------------
// FIXTURES – real careers through the real engine, never a hand-built world.
// -------------------------------------------------------------------------------------------------

/** A career with a hired coach, funds held up so the arms differ by TRAVEL and not by bankruptcy. */
function career(seed: string, opts: { travels: boolean; coach?: 'self' | 'middle' } = { travels: false }): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: opts.coach ?? 'middle' })
  if (opts.travels) setCoachOnEventWeeks(world, true)
  return world
}

/** Tick until she is AT a tournament (the play week resolves inside the tick), entering everything
 *  the engine will let her enter. Returns the week she played and the world standing after it. */
function toFirstTrip(world: WorldState, maxWeeks = 80): { playedWeek: number } {
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < maxWeeks; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* eligibility, caps and deadlines are the engine's business */
        }
      }
    }
    tickWeek(world, rng)
    // ⚠ `world.week` MOVES AT THE TOP OF THE TICK, so the week she played is the one the world is
    // standing in when the reveal opens - not the one that was current before the call.
    if (world.pendingTournament) return { playedWeek: world.week }
  }
  throw new Error('no tournament reached – the fixture is broken, not the assertion')
}

/** ...and on to the first week the JOURNEY PAINTING is shown, which is what the week's story is the
 *  caption of. Two things separate it from `toFirstTrip`: the reveal has to be watched and shut
 *  (`travelHomeFactsFor`'s own rule - "the story does not open until closeTournament"), and not every
 *  entered week is a journey (the family has to have paid to get her there). Returns the snapshot. */
function toFirstJourney(world: WorldState, maxWeeks = 120): Snapshot {
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < maxWeeks; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* the engine decides what she may enter */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    const snap = toSnapshot(world)
    if (snap.diary.facts.travelHomeScene !== null) return snap
  }
  throw new Error('no journey home reached - the fixture is broken, not the assertion')
}

// -------------------------------------------------------------------------------------------------
// 1. THE FARE – whose figure it is, and that it is the ONE fare definition
// -------------------------------------------------------------------------------------------------

describe('§1 the second seat is priced off her own seat', () => {
  it('⚠ IT IS THE OWNER\'S OWN MULTIPLIER, and it reads travelCostFor and nothing else', () => {
    // ⚠ WHERE THE FIGURE COMES FROM, because the brief for this item asked for the 30.07 price to be
    // REUSED rather than invented. It is not recoverable: commit 77e08aa says in capitals that "ALL
    // THE ENGINE WORK IS REVERTED ... the `coachTravelsFrom` threshold, the per-trip fare ... are
    // gone", and it was never committed, so neither git nor any doc holds the number. What IS on the
    // record is the owner pricing the same thing himself on 12.08, in the-wall-2026-08.md §L1: «a
    // per-tournament top-up when the coach travels with her, at DOUBLE THE TRAVEL COST». So a trip he
    // comes on costs twice what it costs without him - his seat is her seat again - which is also
    // what the fallback the brief named ("price it from travelCostFor") arrives at.
    const world = career('fare-a', { travels: true })
    toFirstTrip(world)
    // ⚠ ON A **PAYING** RUNG, SINCE THE FARE GATE (its own block at the bottom of this file). A
    // career's first trip is a domestic or junior event and the fare there is deliberately zero -
    // an ungated one bankrupted 15 of 30 middle careers in the junior years. `coachTravelFareFor` is
    // a pure price function and does not need her to have entered, so the claim about the PRICE is
    // read on a rung the price exists on rather than on the first one the calendar offers.
    const paying = world.season.find((e) => TIERS[e.tier].prizeCents !== undefined && e.travelCostCents > 0)
    expect(paying, 'the calendar reaches a rung that pays').toBeTruthy()
    const event = paying!
    expect(coachTravelFareFor(world, event)).toBe(travelCostFor(world, event))
    expect(coachTravelFareFor(world, event), 'a fare is real money').toBeGreaterThan(0)
    // ...and the first trip of a junior career is exactly the refusal the gate exists for.
    const junior = world.season.find((e) => TIERS[e.tier].prizeCents === undefined)
    if (junior) expect(coachTravelFareFor(world, junior), 'a rung that pays her nothing').toBe(0)
  })

  it('⚠ AND IT FOLLOWS THE COVERS, because the sentence on screen is about the fare the family PAYS', () => {
    // `travelCostFor` applies the academy scholarship and the brand's share; his seat is priced off
    // the RESULT, so "twice the fare" stays true of the number the family actually sees rather than
    // of a gross figure nobody is charged. Read as a property: whatever the covers do to her fare,
    // they do the same to his, on every event on the calendar.
    const world = career('fare-b', { travels: true })
    toFirstTrip(world)
    // ⚠ RE-AIMED TO THE RUNGS THAT PAY (the fare gate, at the bottom of this file). The fare is 0 on
    // a domestic or junior rung by design since the bench measured an ungated one bankrupting 15 of
    // 30 middle careers, so a loop over the WHOLE calendar now compares a real fare with a refused
    // one. The claim is unchanged and is about the rungs the fare exists on.
    const pays = (e: { tier: TierId }): boolean => TIERS[e.tier].prizeCents !== undefined
    for (const e of world.season.filter(pays)) {
      expect(coachTravelFareFor(world, e), `event ${e.id}`).toBe(travelCostFor(world, e))
    }
    // ⚠ AND A CAREER WITH A SCHOLARSHIP IS THE ARM THAT MAKES THAT SENTENCE MEAN SOMETHING. Without
    // one the net and the gross fare are the same integer, so the assertion above is true of a
    // mistake as well as of the rule. Mutation-verified: return `event.travelCostCents` from
    // `coachTravelFareFor` and this block goes red while the loop above stays green.
    world.academy = { level: 2, sinceWeek: 0, seasonIndex: 0, coveredCents: 0 }
    const withCover = world.season.filter((e) => e.travelCostCents > 0 && pays(e))
    expect(withCover.length, 'the calendar has trips worth paying for').toBeGreaterThan(0)
    for (const e of withCover) {
      expect(coachTravelFareFor(world, e), `event ${e.id}`).toBe(travelCostFor(world, e))
      expect(coachTravelFareFor(world, e), `event ${e.id}: his seat is discounted with hers`).toBeLessThan(e.travelCostCents)
    }
  })

  it('a self-coached family sends nobody, and pays nothing', () => {
    const world = career('fare-self', { travels: true, coach: 'self' })
    toFirstTrip(world)
    expect(world.coachId, 'the fixture really is self-coached').toBeNull()
    expect(coachTravelsWithHer(world)).toBe(false)
    for (const e of world.season) expect(coachTravelFareFor(world, e)).toBe(0)
  })

  it('and with the switch off there is no fare at all', () => {
    const world = career('fare-off')
    toFirstTrip(world)
    expect(coachTravelsWithHer(world)).toBe(false)
    for (const e of world.season) expect(coachTravelFareFor(world, e)).toBe(0)
  })
})

// -------------------------------------------------------------------------------------------------
// 2. THE MONEY LEAVES – the half a "does the flag persist" test can never see
// -------------------------------------------------------------------------------------------------

describe('§2 turning it on changes the world', () => {
  it('⭐ THE MONEY LEAVES, and by exactly the fare, on the week she travelled', () => {
    // ⚠ TWO IDENTICAL CAREERS, ONE SWITCH. Same seed, same entries, same ticks - so anything that
    // differs is the switch. This is the assertion the item exists for: a test that only checked
    // `world.coachOnEventWeeks === true` would have been green for the whole two weeks the round-20
    // report was open.
    // ⚠⚠ CHARGED ON A **PAYING** RUNG, and that is the fare gate rather than a convenience. A career's
    // first trip is a junior one, where the fare is zero by design: the bench measured an ungated
    // fare bankrupting 8 of 30 wealthy·elite and 15 of 30 middle·middle careers, every bankruptcy in
    // the junior years (docs/specs/coach-travel-2026-08.md). So this drives `chargeCoachTravel`
    // directly on the rung the fare exists on - the claim is about the LEDGER, not about which week
    // the calendar happens to offer first.
    const off = career('money')
    const on = career('money', { travels: true })
    const paying = on.season.find((e) => TIERS[e.tier].prizeCents !== undefined && e.travelCostCents > 0)!
    expect(paying, 'the calendar reaches a rung that pays').toBeTruthy()
    const before = { off: off.fundsCents, on: on.fundsCents }
    chargeCoachTravel(off, paying)
    chargeCoachTravel(on, paying)

    // NOTHING leaves the family that stayed home - the switch is the only difference.
    expect(off.fundsCents, 'he did not travel, so there is no second seat').toBe(before.off)
    // ...and exactly the fare leaves the one that sent him.
    expect(before.on - on.fundsCents).toBe(coachTravelFareFor(on, paying))
    expect(before.on - on.fundsCents, 'a fare is real money').toBeGreaterThan(0)

    const his = on.events.filter((e) => e.category === 'travel' && /coach/i.test(e.text))
    expect(his, 'the coach\'s fare is its own line in the feed, never folded into the retainer').toHaveLength(1)
    expect(his[0].amountCents).toBe(-coachTravelFareFor(on, paying))
    expect(off.events.filter((e) => /coach/i.test(e.text) && e.category === 'travel')).toHaveLength(0)
    // ...so the trip costs exactly TWICE what it costs without him - the owner's own pricing, 12.08:
    // «a per-tournament top-up when the coach travels with her, at double the travel cost».
    expect(coachTravelFareFor(on, paying) + travelCostFor(on, paying)).toBe(travelCostFor(on, paying) * 2)
  })

  it('nothing is charged on a week she did not travel', () => {
    const world = career('quiet', { travels: true })
    const rng = rngFromSeed(world.seed)
    // Four weeks with nothing entered: no calendar week can be a competition week.
    for (let i = 0; i < 4; i++) {
      if (pendingKnock(world)) decideKnock(world, 'rest')
      tickWeek(world, rng)
    }
    const coachFares = world.events.filter((e) => e.category === 'travel' && /coach/i.test(e.text))
    expect(coachFares, 'he cannot have a fare to a tournament nobody went to').toHaveLength(0)
  })

  it('⚠ AND THE MAIN STREAM DOES NOT MOVE (invariant 2: input-independence is permanent law)', () => {
    // The stance is a player CHOICE, so it may never re-roll the world's dice. The charge is pure
    // arithmetic and the notice is two array scans, so the two careers must tap identical MAIN
    // sequences however differently their money ends up.
    const off = career('rng')
    const on = career('rng', { travels: true })
    const runOff = rngFromSeed(off.seed)
    const runOn = rngFromSeed(on.seed)
    for (let i = 0; i < 40; i++) {
      for (const w of [off, on]) {
        w.fundsCents = Math.max(w.fundsCents, 500_000_00)
        if (pendingKnock(w)) decideKnock(w, 'rest')
      }
      tickWeek(off, runOff)
      tickWeek(on, runOn)
      expect(on.rngMain.n, `week ${i}: the switch moved the main stream`).toBe(off.rngMain.n)
    }
  })
})

// -------------------------------------------------------------------------------------------------
// 3. PRESENCE – the flow and the week's story
// -------------------------------------------------------------------------------------------------

describe('§3 he is visibly there', () => {
  it('⭐ THE TOURNAMENT FLOW IS TOLD, and only when he came', () => {
    const off = career('flow')
    const on = career('flow', { travels: true })
    toFirstTrip(off)
    toFirstTrip(on)
    const snapOff = toSnapshot(off) as Snapshot
    const snapOn = toSnapshot(on) as Snapshot
    expect(snapOff.pending, 'the fixture is at a tournament').toBeTruthy()
    expect(snapOn.pending).toBeTruthy()
    expect(snapOff.pending!.coachTravelled).toBe(false)
    expect(snapOn.pending!.coachTravelled).toBe(true)
  })

  it('⭐ THE WEEK\'S STORY IS TOLD, on every trip he came on and on none that he did not', () => {
    const off = career('story')
    const on = career('story', { travels: true })
    const snapOff = toFirstJourney(off)
    const snapOn = toFirstJourney(on)
    expect(snapOn.week, 'the two careers walk the same calendar').toBe(snapOff.week)
    // The scrap under the journey painting is on both weeks - it is the same week and the same trip.
    expect(snapOff.diary.travelNote, 'a come-home week has a scrap').toBeTruthy()
    expect(snapOn.diary.travelNote).toBeTruthy()
    // ...and only one of them says he was there.
    expect(snapOff.diary.coachNote).toBeNull()
    expect(snapOn.diary.coachNote, 'the second fare bought a line in the week\'s story').toBeTruthy()
    // ⚠ IT IS THE PARENT'S HAND, which is the scrap's own standing rule (diary/travelNotes.ts): it is
    // about HER and the family, never a coaching note about the tennis, and no pronoun names the
    // coach (R15-7 - a woman sits on every roster by construction).
    const note = snapOn.diary.coachNote!
    expect(note.length, 'it fits on a scrap, like every other line on that paper').toBeLessThanOrEqual(80)
    expect(note).not.toMatch(/—/)
    expect(note).toMatch(/^[\x20-\x7e–]+$/)
    expect(note, 'no pronoun names the coach').not.toMatch(/\bhis\b|\bhe\b/i)
  })

  it('the week\'s story is silent on an ordinary training week even with the switch on', () => {
    const world = career('story-quiet', { travels: true })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 3; i++) {
      if (pendingKnock(world)) decideKnock(world, 'rest')
      tickWeek(world, rng)
    }
    expect(toSnapshot(world).diary.coachNote).toBeNull()
  })
})

// -------------------------------------------------------------------------------------------------
// 4. THE NOTICE HE ASKED FOR ON 08.08
// -------------------------------------------------------------------------------------------------

describe('§4 the travel notice, true at last', () => {
  it('⭐ FIRES ONCE, BEFORE THE TRIP, AND SAYS WHAT IT COSTS', () => {
    const world = career('notice')
    const rng = rngFromSeed(world.seed)
    let firstWeekWithNotice: number | null = null
    let hadTripAhead = false
    for (let i = 0; i < 40; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* the engine decides what she may enter */
          }
        }
      }
      tickWeek(world, rng)
      const notice = world.events.filter((e) => e.milestoneKey === 'coach-travel-open')
      if (notice.length > 0 && firstWeekWithNotice === null) {
        firstWeekWithNotice = notice[0].week
        // ⚠ CAPTURED AT THE MOMENT IT FIRED, which is the only moment the claim is about: there is a
        // trip still AHEAD of her, so the switch can be reached in time to matter for it. Read after
        // the tick because that is the week the milestone carries.
        hadTripAhead = world.season.some((e) => e.week > world.week && world.entries.includes(e.id))
      }
      expect(notice.length, 'a first can only happen once').toBeLessThanOrEqual(1)
    }
    expect(firstWeekWithNotice, 'the notice has to be reachable at all').not.toBeNull()
    const row = world.events.find((e) => e.milestoneKey === 'coach-travel-open')!
    expect(row.keep, 'the 400-row prune may never lose it').toBe(true)
    expect(row.text).toMatch(/travel/i)
    expect(row.text, 'it names the price, so the decision can be taken from the notice').toMatch(/twice the fare/i)
    // ⚠ BEFORE THE TRIP, NOT ON IT. A notice landing on the Monday she is already at the venue is a
    // receipt, not news - so it may only fire on a week that still has an entered event ahead of it.
    expect(hadTripAhead, 'the notice arrived with a trip still to come, so it can be acted on').toBe(true)
  })

  it('⚠ AND IT WAITS FOR A TRIP TO BE ON THE CARD, which is what makes it a notice and not a receipt', () => {
    // ⚠ THIS IS THE ARM THAT MAKES THE "before the trip" CLAIM ABOVE MEAN ANYTHING. On a career that
    // enters things, the first week she has a coach and the first week she has a trip ahead are
    // usually the same week, so the assertion above is true of a version that never asked. A career
    // that enters NOTHING separates them: it has a coach from week one and never a trip, so the
    // notice must never arrive. Mutation-verified: delete the `ahead` clause in
    // `markCoachTravelOpen` and this goes red while every other block here stays green.
    const world = career('notice-never')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 40; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      tickWeek(world, rng)
    }
    expect(world.coachId, 'she has a coach the whole way through').not.toBeNull()
    expect(world.entries, 'and she has entered nothing at all').toHaveLength(0)
    expect(world.events.filter((e) => e.milestoneKey === 'coach-travel-open')).toHaveLength(0)
  })

  it('and it is silent for a family with nobody to send', () => {
    const world = career('notice-self', { travels: false, coach: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 40; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* the engine decides */
          }
        }
      }
      tickWeek(world, rng)
    }
    expect(world.coachId).toBeNull()
    expect(world.events.filter((e) => e.milestoneKey === 'coach-travel-open')).toHaveLength(0)
  })
})

// -------------------------------------------------------------------------------------------------
// 5. THE RUNNING COMMENTARY – «присутствие ... в трансляции»
// -------------------------------------------------------------------------------------------------

function fixtureMatch(seed: string) {
  const a: MatchPlayer = { id: 'a', name: 'Vera Novak', serve: 58, ret: 52, composure: 50, stamina: 52, groundstrokes: 54 }
  const b: MatchPlayer = { id: 'b', name: 'Ines Duval', serve: 55, ret: 53, composure: 50, stamina: 50, groundstrokes: 52 }
  const opts: MatchOptions = { surface: 'hard', tour: 'wta', seed }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

describe('§5 the broadcast knows he is in the corner', () => {
  it('⭐ THE SAME MATCH READS DIFFERENTLY WITH HIM THERE', () => {
    const { a, b, match } = fixtureMatch('coach-log-1')
    const without = buildCommentary(match, a.name, b.name)
    const with_ = buildCommentary(match, a.name, b.name, null, { side: 0 })
    expect(with_).not.toEqual(without)
    expect(with_.some((x) => x.kind === 'coach'), 'he is in the log').toBe(true)
    expect(without.some((x) => x.kind === 'coach'), 'and not in the one nobody travelled to').toBe(false)
  })

  it('⚠ AND HE IS NOT ON EVERY BEAT – at most one word per set break, over a corpus', () => {
    // ⚠ THE HALF THAT MATTERS. A presence line on every row is wallpaper inside one match, and the
    // owner has reported exactly that failure mode about other pools. The rules give a coach the
    // changeover and nothing else, so the beat is anchored to the first point of a new set: at most
    // twice in the longest match this engine plays, and it yields to any tennis beat on the same
    // point (`PRIORITY.coach` is last).
    let coachBeats = 0
    let allBeats = 0
    let matches = 0
    for (let i = 0; i < 40; i++) {
      const { a, b, match } = fixtureMatch(`coach-log-${i}`)
      const beats = buildCommentary(match, a.name, b.name, null, { side: 0 })
      const sets = match.result.sets.length
      const mine = beats.filter((x) => x.kind === 'coach')
      expect(mine.length, `match ${i}: one word per completed set break at most`).toBeLessThanOrEqual(sets - 1)
      // never twice on one point, and never inside the same set twice
      expect(new Set(mine.map((x) => x.set)).size).toBe(mine.length)
      coachBeats += mine.length
      allBeats += beats.length
      matches++
    }
    expect(matches).toBe(40)
    expect(coachBeats, 'he does speak, or this test is measuring nothing').toBeGreaterThan(10)
    const share = coachBeats / allBeats
    expect(share, `he is a beat, not the log: ${(share * 100).toFixed(1)}% of rows`).toBeLessThan(0.2)
  })

  it('he is never in the KEY cut, and never claims a word about the tennis', () => {
    for (let i = 0; i < 20; i++) {
      const { a, b, match } = fixtureMatch(`coach-key-${i}`)
      for (const beat of buildCommentary(match, a.name, b.name, null, { side: 0 })) {
        if (beat.kind !== 'coach') continue
        // The 'key' cut is the tennis; presence is not a turning point.
        expect(beat.keyMoment, 'presence is never a highlight').toBe(false)
        // No pronoun names the coach (R15-7), and nothing says what was said or what it changed.
        expect(beat.text).not.toMatch(/\bhis\b/i)
        expect(beat.text).toMatch(/coach/i)
        expect(beat.text.length, 'the row budget is the row budget').toBeLessThanOrEqual(120)
      }
    }
  })

  it('and the log a family who stayed home reads is byte-identical to the one before this wave', () => {
    // The whole ladder is additive: passing nothing is the log this builder has always produced.
    for (let i = 0; i < 20; i++) {
      const { a, b, match } = fixtureMatch(`coach-null-${i}`)
      expect(buildCommentary(match, a.name, b.name, null, null)).toEqual(buildCommentary(match, a.name, b.name))
    }
  })
})

// ---------------------------------------------------------------------------
// ⚠⚠ THE GATE THE BENCH FOUND, AND IT SHIPPED UNGATED FOR ONE COMMIT.
//
// docs/specs/coach-travel-2026-08.md, measured on the rebuilt policy, 30 seeds: at exactly this
// price an UNGATED fare bankrupted 8 of 30 wealthy·elite careers and 15 of 30 middle·middle ones,
// and every single bankruptcy was in the JUNIOR YEARS - ages 15-19, "ever ranked" falling
// 96.7% -> 46.7%, the median middle career's whole prize money going to $0. The 30.07 record priced
// the mechanic at +$21,000; on a career that actually plays it was +$995,979, because nothing
// stopped it buying a second seat on a `local` at fourteen.
//
// The gate is the owner's own 30.07 argument as code - "JUNIOR TENNIS HAS NO PRIZE MONEY. A fare
// can only be a decision if something might come back" - so he travels to the rungs that PAY, and
// the test for that is the rung's own `prizeCents`. These assertions are the bankruptcy, pinned.
// ---------------------------------------------------------------------------
describe('round-21 #2 – he travels to the events that pay, and to no others', () => {
  it('every rung that pays prize money charges the fare, and every rung that does not charges nothing', () => {
    const world = createWorld('coach-fare-gate')
    world.coachId = world.coachId ?? 'x'
    world.coachOnEventWeeks = true
    let paying = 0
    let unpaid = 0
    for (const tier of TIER_LADDER) {
      const event = world.season.find((e) => e.tier === tier) ?? {
        id: `probe-${tier}`,
        week: world.week + 1,
        tier,
        surface: 'hard' as const,
        travelCostCents: 1000_00,
        deadlineWeek: world.week,
      }
      const fare = coachTravelFareFor(world, event)
      if (TIERS[tier].prizeCents === undefined) {
        expect(fare, `${tier} pays her nothing, so it must charge him nothing`).toBe(0)
        unpaid++
      } else {
        expect(fare, `${tier} writes a cheque, so the fare is real`).toBeGreaterThan(0)
        // ...and it is HER fare, so an academy or a brand reaches his seat exactly as it reaches hers.
        expect(fare).toBe(travelCostFor(world, event))
        paying++
      }
    }
    // Both arms are populated - an assertion that only ever visits one side proves nothing.
    expect(unpaid, 'the domestic and junior rungs').toBeGreaterThan(3)
    expect(paying, 'the professional rungs').toBeGreaterThan(3)
  })

  it('the switch still reads ON at a junior rung - it is the FARE that is gated, not the stance', () => {
    // The distinction matters on screen: she has not turned the setting off, there is simply nothing
    // to pay for. A gate that silently flipped the toggle would lose the player's own choice.
    const world = createWorld('coach-fare-stance')
    world.coachId = world.coachId ?? 'x'
    world.coachOnEventWeeks = true
    expect(coachTravelsWithHer(world)).toBe(true)
    const junior = world.season.find((e) => TIERS[e.tier].prizeCents === undefined)
    if (junior) expect(coachTravelFareFor(world, junior)).toBe(0)
  })
})
