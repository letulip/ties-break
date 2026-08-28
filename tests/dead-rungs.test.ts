// PART 0 – CLOSE THE DEAD RUNGS (round 28 #12, docs/specs/the-calendar-she-can-reach-2026-08.md §2
// Part 0; the ruling it serves is act2-pro-tour.md §4).
//
// ⚠⚠ THIS IS A BUG AGAINST A SHIPPED RULING, NOT A DESIGN CHANGE. §4 already says «Outgrown is GONE:
// once a rung below the working pair is outgrown (THE ENGINE'S LATCH, NOT THE UI'S GUESS), its
// events leave the feed entirely» and «Domestic collapses to its top open rung». Measured on the
// owner's own save at week 675, age 26, WTA #110, read straight off the engine:
//
//     OPEN     local     Local Open        outgrown=n     <- 4 of her 12 open slots
//     refused  regional  [locked] Not enough national pts for Regional Championship yet (need 65)
//     refused  national  [locked] Not enough national pts for National Series yet (need 150)
//     refused  j60       [locked] Junior Tour 60 takes the top 100 – she has no international
//                                 ranking yet
//     refused  j300      [locked] Junior Tour 300 takes the top 50 – she has no international
//                                 ranking yet
//
// THREE FAULTS, ONE DISEASE: a rung was being judged in a currency its player has stopped earning.
//   1. `Local Open` never closes. Its band is `[0, 85]` DOMESTIC points and a world-tour player
//      earns none, so the floor holds it open on a book of zero for ever – and both of its ceilings
//      are denominated the same way, so neither can graduate her (`outgrewTier` reads that same
//      zero; `tierOutgrown` asks whether j30 is open and the J rungs are U18).
//   2. The domestic ladder locks her out FROM BELOW on the identical zero – the world #110 told she
//      lacks national points for a Regional. Same disease, opposite sign.
//   3. Junior rows still open at 26, because `tierOpenFor` for j30 is the on-ramp LATCH and a latch
//      does not know about birthdays; and j60/j300 were refused with an acceptance-list sentence
//      because `entryVerdict`'s ladder arms run before the age gate in `availabilityStatus`.
//
// ⚠⚠ AND THE HALF THAT MAKES IT A §4 BUG RATHER THAN A COSMETIC ONE. The Season feed was ALREADY
// clean, because `feedContext` (composables/tierState.ts) re-derives BOTH rules in the UI – the age
// door since round-17 #19, the table she has left since round-21 #5. So the fix here is not "hide
// the rows": it is to put the closure where §4 says it belongs, in the engine, and every assertion
// below that matters is asserted with the UI's own filters WITHHELD. A test that only checked the
// rendered feed would have passed before this wave and proved nothing.
//
// ⭐ WHAT PART 0 DOES NOT DO, and it is worth saying because the spec's other parts do: it moves no
// tournament, adds none, and changes no draw. It changes what she SEES, never what she plays.
import { describe, it, expect } from 'vitest'
import {
  KID_ID,
  PLAY_DOWN,
  activeLadderOf,
  createWorld,
  entryStatus,
  hasOutgrown,
  kidAgeYears,
  kidPoints,
  recomputeKidRank,
  tickWeek,
  tierOpenFor,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { tierVerdict } from '../src/engine/world/medical'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { resumeMain } from '../src/engine/rng'
import { feedContext, feedShows, isTierOpen, tierState, type TierStateInput } from '../src/composables/tierState'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'
import type { Snapshot } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const DOMESTIC: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'domestic')
const JUNIOR: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'itf')

/** A career ticked to `age`, with whatever book the case is about. Built and TICKED rather than
 *  hand-assembled, so every rung's verdict is read out of a real world's real calendar. */
function careerAt(seed: string, age: number, book: [TierId, number][], wtaRank?: number): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 500_000_00
  for (const [tier, points] of book) world.results.push({ playerId: KID_ID, week: world.week, points, tier })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  if (wtaRank !== undefined) world.kidRankWta = wtaRank
  return world
}

// ⚠ EVERY WORLD IN THIS FILE IS BUILT ONCE, AT MODULE SCOPE, AND SHARED. Ticking a career to
// twenty-six is ~650 real weeks of engine and costs about twenty seconds; one per `it` blew the
// 20s per-test budget and every case in the file timed out on the first run. Nothing below mutates
// a world, so sharing them is safe as well as cheap.
const OWNER = careerAt('p0-owner', 26, [['w100', 900]], 110)
const OWNER_SNAP = toSnapshot(OWNER)
const TEEN = careerAt('p0-teen', 15, [['local', 30], ['regional', 48]])
const CLIMBER = careerAt('p0-climber', 15, [['national', 200], ['regional', 80]])
const SEAM_BEFORE = careerAt('p0-seam-before', 16, [['national', 300], ['j300', 300]])
const SEAM_AFTER = careerAt('p0-seam-after', 16, [['national', 300], ['j300', 300], ['w15', 10]])
// ⚠ THE AMENDMENT CASE REUSES `OWNER` RATHER THAN BUILDING A SECOND #110 CAREER: the ladder shape
// below her working window is the same at 22 as at 26, and a second 470-week tick bought nothing.
// ⚠ AND THE TOP-50 CASE IS NINETEEN, THE FIRST AGE PAST THE JUNIOR TOUR – any older only costs
// ticks, and younger would put the U18 rungs back into a case that is about the W series.
const AMEND = OWNER
const AMEND_TOP50 = careerAt('p0-amend-top50', 19, [['wta250', 2000]], 40)

/** THE OWNER'S OWN CASE: twenty-six, a professional book, inside the world's top 150. */
const her = () => OWNER

/** The feed as a screen would fold it. ⚠ `judge` is what the UI is allowed to decide for itself –
 *  withhold it and only the ENGINE's verdict is left, which is the whole point of this file. */
function fold(snap: Snapshot, judge: { table?: boolean; age?: boolean } = { table: true, age: true }) {
  return feedContext({
    // ⚠ AGE ZERO IS "THE UI JUDGES NO AGE". `feedContext` filters `tierAgeBlock(t, ageYears) ===
    // 'old'` itself; at age 0 nothing is old, so what survives is the engine's answer alone.
    ageYears: judge.age === false ? 0 : snap.ageYears,
    tierOpen: snap.tierOpen,
    tierOutgrown: snap.tierOutgrown,
    ...(judge.table === false ? {} : { activeLadder: snap.activeLadder }),
    upcoming: snap.upcoming,
  })
}

const rowsOf = (snap: Snapshot, tier: TierId) => snap.upcoming.filter((e) => e.tier === tier)

/** One rung's plaque input, assembled off the snapshot exactly as `useTierStates` assembles it -
 *  so what this file asserts is what the Home strip and the Season ladder actually print. */
function stateInput(snap: Snapshot, id: TierId): TierStateInput {
  return {
    ageYears: snap.ageYears,
    points: snap.ladders.domestic.points,
    upcoming: snap.upcoming,
    horizonWeeks: UPCOMING_WEEKS,
    entryCap: snap.entryCap,
    proEntryCap: snap.proEntryCap,
    engineOpen: snap.tierOpen[id],
    engineOutgrown: snap.tierOutgrown[id],
    refusal: snap.tierRefusal[id],
    acceptsRank: snap.tierAcceptance[id],
    itfRank: snap.ladders.itf.rank ?? null,
    itfPoints: snap.ladders.itf.points,
  }
}

// =================================================================================================
// FAULT 1 – `Local Open` leaves the feed, and it is the ENGINE that removes it
// =================================================================================================

describe('fault 1: Local Open closes for a player on the professional table', () => {
  it('⚠⚠ the ENGINE shuts it – asserted with the UI\'s own table filter WITHHELD', () => {
    const world = her()
    expect(activeLadderOf(world), 'she is on the professional table').toBe('wta')
    // The disease, stated as a fact about her book: the currency Local is judged in is one she has
    // stopped earning entirely. Before this wave that zero is exactly what held the rung open.
    expect(kidPoints(world, 'domestic'), 'a professional earns no national points').toBe(0)

    const snap = OWNER_SNAP
    expect(snap.tierOpen.local, 'the oracle itself says shut').toBe(false)
    // ...and the ladder's one "she is past this rung" answer agrees, which is what §4's «outgrown»
    // means and what the owner read as `outgrown=n`.
    expect(snap.tierOutgrown.local).toBe(true)

    // THE HALF THAT MAKES THIS A §4 FIX. Fold the feed with `activeLadder` withheld – i.e. with
    // round-21 #5's UI filter switched off – and Local must STILL be gone. Before this wave it came
    // straight back (tests/tier-window.test.ts pins that as the bug it was).
    const blind = fold(snap, { table: false, age: true })
    expect(blind.rungs).not.toContain('local')
  })

  it('⚠ ABSENT from the feed, not merely refused – and the calendar really does hold some', () => {
    const snap = OWNER_SNAP
    const locals = rowsOf(snap, 'local')
    expect(locals.length, 'the horizon carries Local Opens to be hidden').toBeGreaterThan(0)
    // Every one of them refused would still be four rows of dead furniture. §4 asks for gone.
    const feed = fold(snap)
    expect(locals.filter((e) => feedShows(e, feed)), 'every Local row leaves the feed').toEqual([])
  })

  it('the whole domestic family goes, not just its bottom rung', () => {
    const snap = OWNER_SNAP
    // «Если national доступен - показывать только их» taken to its end: on the professional table
    // there is no top open domestic rung left to collapse to.
    for (const t of DOMESTIC) expect(snap.tierOpen[t], t).toBe(false)
    const blind = fold(snap, { table: false, age: true })
    expect(blind.rungs.filter((t) => TIERS[t].track === 'domestic')).toEqual([])
  })
})

// =================================================================================================
// FAULT 2 – the refusal stops being about points she cannot earn
// =================================================================================================

describe('fault 2: the domestic ladder no longer locks the world #110 out from below', () => {
  it('⚠⚠ no domestic rung refuses her for want of domestic points', () => {
    const world = her()
    for (const t of DOMESTIC) {
      const v = tierVerdict(world, t)
      // The exact sentence the owner was shown, and the exact field the UI turns into "Reach N pts".
      expect(v.detail ?? '', t).not.toMatch(/Not enough/)
      expect(v.pointsToEnter, `${t} offers no points target`).toBeUndefined()
      // It refuses because she is too GOOD for it – the voice `playDownRefusalDetail` already used
      // one table up, reused rather than reinvented.
      expect(v.detail ?? '', t).toContain('she is on the world tour now')
    }
  })

  it('...and the turnstile says the same thing about a real tournament (R10-5)', () => {
    const world = her()
    const event = world.season.find((e) => e.tier === 'regional' && e.week > world.week)
    expect(event, 'a Regional in the horizon to ask about').toBeDefined()
    const gate = entryStatus(world, event!)
    expect(gate.level).toBe('blocked')
    expect(gate.detail ?? '').not.toMatch(/Not enough/)
    expect(gate.outgrown, 'and it is the ladder saying she has passed it').toBe(true)
  })

  it('⚠⚠ ...AND SO DOES THE PLAQUE – the fault does not survive the engine fix by being re-derived', () => {
    // The half an engine-only assertion would have missed, and it nearly shipped that way.
    // `tierState`'s locked arm prices EVERY lock as a distance ("N more national pts"), so with the
    // engine closing these rungs correctly the Home strip and the Season ladder went on printing
    // «Regional Championship – locked: 65 more national pts» and, on Local, the arithmetic's own
    // reductio: «0 more national pts (she has 0 of 0)».
    const snap = OWNER_SNAP
    for (const t of DOMESTIC) {
      const state = tierState(t, stateInput(snap, t))
      expect(state.kind, `${t} is past her, not locked`).toBe('outgrown')
      expect(state.note, t).toBe('Outgrown')
      expect(state.title, t).toContain('she is on the world tour now')
      expect(state.title ?? '', t).not.toMatch(/more national pts/)
      expect(state.pointsToEnter, `${t} offers no points target`).toBeUndefined()
      expect(isTierOpen(state), `${t} is not offered`).toBe(false)
    }
  })

  it('⭐ ...and the same arm fixes the identical defect one table up, which predates this wave', () => {
    // The Play Down rule has been shutting W15/W35 to a top-150 player since 15.08, and the plaque
    // has been telling her to go and earn 120 junior points she can never earn again. Same shape,
    // same arm, found by fixing the domestic one.
    const snap = OWNER_SNAP
    for (const t of ['w15', 'w35'] as const) {
      const state = tierState(t, stateInput(snap, t))
      expect(state.title, t).toContain("closed to the world's top")
      expect(state.title ?? '', t).not.toMatch(/more international pts/)
    }
  })

  it('⚠ HOUSE LAW: the new copy is Latin-only and carries no long dash', () => {
    const world = her()
    for (const t of DOMESTIC) {
      const detail = tierVerdict(world, t).detail ?? ''
      expect(detail, t).not.toMatch(/[Ѐ-ӿ]/)
      expect(detail, t).not.toContain('—')
    }
  })
})

// =================================================================================================
// FAULT 3 – a rung she has aged out of is not open, and does not render
// =================================================================================================

describe('fault 3: aged-out junior rungs', () => {
  it('⚠⚠ the ENGINE shuts them – asserted with the UI\'s own age filter WITHHELD', () => {
    const snap = OWNER_SNAP
    for (const t of JUNIOR) expect(snap.tierOpen[t], `${t} is not open at 26`).toBe(false)
    // j30 is the one that proves it: its floor is the on-ramp LATCH, so before this wave the oracle
    // said OPEN at any age once she had crossed it once.
    const blind = fold(snap, { table: true, age: false })
    expect(blind.rungs.filter((t) => TIERS[t].track === 'itf')).toEqual([])
  })

  it('no junior row renders at all, and the horizon really does hold some', () => {
    const snap = OWNER_SNAP
    const juniors = snap.upcoming.filter((e) => TIERS[e.tier].track === 'itf')
    expect(juniors.length, 'the horizon carries junior events to be hidden').toBeGreaterThan(0)
    const feed = fold(snap)
    expect(juniors.filter((e) => feedShows(e, feed))).toEqual([])
  })

  it('⚠ and the reason names her AGE, never an acceptance list she can no longer join', () => {
    const world = her()
    for (const t of JUNIOR) {
      const detail = tierVerdict(world, t).detail ?? ''
      // «Junior Tour 60 takes the top 100 – she has no international ranking yet», said to a
      // twenty-six-year-old, invites her to go and earn a junior ranking. There is no such door.
      expect(detail, t).not.toContain('takes the top')
      expect(detail, t).not.toContain('international ranking yet')
      expect(detail, t).toContain('aged out')
    }
  })
})

// =================================================================================================
// THE REGRESSION GUARD – the girl the domestic ladder exists for still has it
// =================================================================================================

describe('⭐ the guard: a genuine domestic player is untouched', () => {
  it('a fifteen-year-old on the domestic ladder still sees and enters Local and Regional', () => {
    const teen = TEEN
    expect(activeLadderOf(teen), 'she is on nobody else\'s table').toBe('domestic')
    const snap = toSnapshot(teen)
    for (const t of ['local', 'regional'] as const) {
      expect(snap.tierOpen[t], `${t} is open to her`).toBe(true)
      expect(tierVerdict(teen, t).level, `${t} is enterable`).toBe('ok')
      expect(fold(snap).rungs, `${t} is in her feed`).toContain(t)
    }
    // ...and she is offered real rows, not an empty screen with the right flags on it.
    const feed = fold(snap)
    const shown = snap.upcoming.filter((e) => TIERS[e.tier].track === 'domestic' && feedShows(e, feed))
    expect(shown.length, 'domestic rows actually render for her').toBeGreaterThan(0)
  })

  it('...and a domestic climber keeps the rungs she has outgrown, because the floor still never refuses', () => {
    // The 06.08 ruling («не надо нижнего предела вообще, пусть играет») is untouched by this wave:
    // what closes a rung here is an UPPER bound and a table, never a floor.
    const climber = CLIMBER
    expect(activeLadderOf(climber)).not.toBe('wta')
    for (const t of ['local', 'regional'] as const) {
      expect(hasOutgrown(climber, t), `${t} is behind her`).toBe(true)
      expect(tierOpenFor(climber, t), `${t} is behind her AND still hers`).toBe(true)
    }
  })

  it('⚠ THE SEAM: it is her first counting W point that costs her the club draws, and nothing sooner', () => {
    // The same seam round-21 #5 already shipped in the feed, now decided by the ladder. One table of
    // slack survives: the junior rungs she is still visibly playing stay open.
    const before = SEAM_BEFORE
    expect(activeLadderOf(before)).not.toBe('wta')
    for (const t of DOMESTIC) expect(tierOpenFor(before, t) || hasOutgrown(before, t), t).toBe(true)
    expect(tierOpenFor(before, 'local'), 'still hers the week before').toBe(true)

    const after = SEAM_AFTER
    expect(activeLadderOf(after)).toBe('wta')
    for (const t of DOMESTIC) expect(tierOpenFor(after, t), `${t} goes at the seam`).toBe(false)
    expect(tierOpenFor(after, 'j30'), 'and the junior tour does NOT – one table of slack').toBe(true)
  })

  it('⚠ NOBODY IS STRANDED – the boredom clause holds at every rung this wave closes', () => {
    // «игрок должен иметь возможность играть… чтобы не скучал». The rungs a professional loses here
    // are the ones one table DOWN; the ones she keeps are her own, and there is always at least one.
    for (const [name, world] of [['at 26, #110', OWNER], ['at 22, #110', AMEND], ['at 22, #40', AMEND_TOP50], ['at the seam', SEAM_AFTER]] as const) {
      const open = TIER_LADDER.filter((t) => tierOpenFor(world, t))
      expect(open.length, `${name}: she still has tennis`).toBeGreaterThan(0)
    }
  })
})

// =================================================================================================
// ⚠⚠ THE OWNER'S AMENDMENT (28.08) – «давай 2 ближайших»
// =================================================================================================
//
// «когда она только в своем коридоре, то вполне может случиться так, что она за год ни одного кубка
// не увидит, так что может быть всё-таки какие-то близкие outgrown и стоит оставить, чтобы можно
// было хотя бы где-то что-то выиграть» — and then, sharpened: «Ближайшую переросшую W-ступень из
// ленты не убирать. - давай 2 ближайших.»
//
// ⭐ PART 0 NEVER TOUCHES THIS PATH. It closes domestic rungs (for a player on the professional
// table) and aged-out junior rungs; it closes NO W rung at any rank, and it removes no rung on any
// ground of outgrown-ness. The ruling is therefore satisfied by construction rather than by a number
// this wave chose – but it is pinned here anyway, so it is pinned by something.
describe('the two nearest outgrown rungs below her working one stay reachable', () => {
  /** The ladder below her lowest WORKING rung (open and not outgrown), nearest first.
   *
   *  ⚠ WALKED DOWN RATHER THAN SLICED, and the ratchet is right to have asked. `slice(0,
   *  indexOf(x))` is the shape `npm run pins:check` bans, because `indexOf` returns -1 on a miss
   *  and the slice then silently yields the WRONG range instead of failing. The rungs are asserted
   *  present above, so the walk cannot start from a sentinel. */
  function below(world: WorldState): TierId[] {
    const open = TIER_LADDER.filter((t) => tierOpenFor(world, t))
    const lowestWorking = open.find((t) => !hasOutgrown(world, t))
    expect(lowestWorking, 'she has a working rung at all').toBeDefined()
    const from = TIER_LADDER.indexOf(lowestWorking!)
    expect(from, 'her working rung is on the ladder').toBeGreaterThan(-1)
    const out: TierId[] = []
    for (let n = from - 1; n >= 0; n--) out.push(TIER_LADDER[n])
    return out
  }

  it('⚠⚠ at the owner\'s own rank, the two nearest are hers – and so is a third', () => {
    const world = AMEND
    const rungs = below(world)
    expect(rungs.slice(0, 3), 'the ladder immediately under her working window').toEqual(['w100', 'w75', 'w50'])
    for (const t of rungs.slice(0, 2)) {
      expect(hasOutgrown(world, t), `${t} is genuinely outgrown`).toBe(true)
      expect(tierOpenFor(world, t), `${t} is one of the two nearest and must stay reachable`).toBe(true)
    }
    // ⭐ HIS FLOOR IS TWO AND THE BUILD GIVES THREE. Asserted as the fact it is rather than trimmed
    // to the ruling: «2 ближайших» is a minimum to keep, not a quota to enforce.
    expect(tierOpenFor(world, rungs[2]), 'a third comes free').toBe(true)
    // ...and it renders, which is the half the ruling is actually about.
    const feed = fold(toSnapshot(world))
    for (const t of rungs.slice(0, 3)) expect(feed.rungs, t).toContain(t)
  })

  it('⚠ THE BOUNDARY THAT DOES EXIST IS THE PLAY DOWN RULE\'S, FOUR RUNGS DOWN, AND IT IS NOT THIS WAVE\'S', () => {
    // w35 is the first rung under her that is gone, and it is gone because the 2026 WTT Regulations
    // shut the bottom two rungs to the world's top 150 – the owner's own ruling of 15.08. Naming it
    // here is what makes the test measure a boundary rather than only the permissive side.
    const world = AMEND
    const rungs = below(world)
    expect(rungs[3]).toBe('w35')
    expect(tierOpenFor(world, 'w35')).toBe(false)
    expect(PLAY_DOWN.lowW).toContain('w35')
    expect(110).toBeLessThanOrEqual(PLAY_DOWN.fromLowW)
  })

  it('⚠⚠ REPORTED, NOT FIXED: inside the top 50 the Play Down rule leaves NO W rung below her', () => {
    // The one place the owner's «2 ближайших» is not met today, and this wave is not its cause:
    // `PLAY_DOWN.fromAllW` bars the whole W series from a top-50 player, so everything under
    // WTA 125 goes at once. It is a ruling for the owner (the number is his, 15.08), and it is
    // pinned here so the day it changes this test says so out loud rather than going quietly green.
    const world = AMEND_TOP50
    const rungs = below(world)
    expect(rungs[0], 'her nearest outgrown rung is a WTA one, and it is hers').toBe('wta125')
    expect(tierOpenFor(world, 'wta125')).toBe(true)
    // ...and the SECOND nearest is not, which is the shortfall.
    expect(rungs[1]).toBe('w100')
    expect(tierOpenFor(world, 'w100'), 'the second nearest is barred – by fromAllW, not by Part 0').toBe(false)
    expect(hasOutgrown(world, 'w100')).toBe(true)
    expect(40).toBeLessThanOrEqual(PLAY_DOWN.fromAllW)
  })
})
