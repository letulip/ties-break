// ⭐⭐ THE ENGINE/UI PARITY CLASS, SITE 1 – THE FEED FILTER AGAINST THE LADDER.
//
// Round 29 #3's calendar half, the first of the three instances the class was named for
// (docs/backlog/the-quality-rig.md row 13, docs/specs/the-calendar-she-can-reach-2026-08.md Part 0).
// The shape: the screen held a predicate the engine did not. `composables/tierState.ts` re-derived
// BOTH of the feed's closures by hand – the age door (round-17 #19) and the table she has left
// (round-21 #5) – so the rendered feed was clean while the ENGINE still called those rungs open, and
// §4's rule («the engine's latch, not the UI's guess») was being met by coincidence.
//
// ⚠⚠ WHAT THIS FILE ADDS, AND WHAT IT DELIBERATELY DOES NOT REPEAT. The composable-level half of
// this site is ALREADY BUILT and is mutation-verified: `tests/dead-rungs.test.ts` folds the feed
// with the UI's own filters WITHHELD (its `fold(snap, { table: false })`), which is the one claim a
// rendered test cannot make, and `tests/tier-window.test.ts` pins the window as the oracle's answer
// verbatim. Neither of them renders anything. So what was missing on 24.09 is the SURFACE: the
// composables are one layer short of the screen the owner is looking at, exactly as
// `round29-masseur-parity.test.ts` says of its own reader. This file is that layer and nothing else
// – if a claim here can be made without mounting, it belongs in `dead-rungs.test.ts` instead.
//
// ⚠ THE SCREEN-SIDE COPIES ARE STILL LIVE, WHICH IS WHY THE GUARD IS WORTH HAVING. Part 0 moved the
// closure into the ladder and LEFT `paysIntoHerTables` and the age filter in `feedContext` (harmless
// while the two agree, and the safe direction when no oracle arrives). Two rules in two places is
// two places to change, so the day one moves without the other this file reddens.
//
// ⚠ MUTATION-VERIFIED, three arms run RED before this was believed – see the table above §2, where
// the third one is what proves this file is not a second copy of `dead-rungs.test.ts`.
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSeason } from '../helpers/mountSeason'
import {
  KID_ID,
  activeLadderOf,
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import type { TierId } from '../../src/engine/season/types'
import type { Snapshot } from '../../src/shared/protocol'

/** A career ticked to `age` with whatever book the case is about – `tests/dead-rungs.test.ts`'
 *  `careerAt`, which is where both of these worlds come from. Ticked rather than hand-assembled, so
 *  every rung's verdict is a real world's real answer.
 *
 *  ⚠ SIXTEEN, NOT TWENTY-SIX. `dead-rungs.test.ts` walks the owner's own save to 26 and its own note
 *  prices that at about twenty seconds; the professional TABLE (`activeLadderOf`) is what the
 *  domestic closure turns on and one counting W result settles that at any age, so this fixture
 *  reaches the same verdict in a quarter of the ticks – comfortably inside the component project's
 *  20 s budget, which is the constraint that made the age a decision at all. The age-out half of
 *  Part 0 is the other file's: at sixteen the junior rungs are still hers, which is exactly what
 *  makes j30 the OPEN junior row §1 needs. */
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

// ⚠ BUILT ONCE AT MODULE SCOPE AND SHARED, on `dead-rungs.test.ts`' own reasoning: nothing below
// mutates a world, and a walk per `it` would pay the tick cost once for every case in the file.
//
// THE PROFESSIONAL: a counting W result and a world rank, so `activeLadderOf` is 'wta' and the Play
// Down rule shuts the club draws under her. Her domestic book is EMPTY, which is the owner's own
// case – a professional earns no national points and the ones she had age out.
const PRO = careerAt('parity-feed-pro', 16, [['w100', 900]], 110)
const PRO_SNAP = toSnapshot(PRO)
// THE CLIMBER: the girl the domestic ladder exists for, on the other side of the same seam.
const CLIMBER = careerAt('parity-feed-climber', 15, [['local', 30]])
const CLIMBER_SNAP = toSnapshot(CLIMBER)

const DOMESTIC: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'domestic')

/** Which tier each `.event-card` on the rendered screen belongs to.
 *
 *  ⚠ THE JOIN IS THE SNAPSHOT'S OWN, never a table written here: the card prints `ev.label` in
 *  `.event-tier`, so the labels the horizon carries are mapped back to their tiers off the same
 *  snapshot the screen was handed. A hand-kept label table is the second implementation this whole
 *  class of test exists to forbid. */
function renderedTiers(snapshot: Snapshot): TierId[] {
  const tierOf = new Map<string, TierId>()
  for (const e of snapshot.upcoming) tierOf.set(e.label, e.tier)
  setActivePinia(createPinia())
  const wrapper = mountSeason(snapshot)
  const tiers = wrapper.findAll('.event-card .event-tier').map((h) => tierOf.get(h.text()))
  wrapper.unmount()
  expect(tiers.every((t) => t !== undefined), 'every drawn card is a row of this snapshot').toBe(true)
  return tiers as TierId[]
}

/** The tiers the horizon actually carries – what there is to hide or to draw. */
function horizonTiers(snapshot: Snapshot): Set<TierId> {
  return new Set(snapshot.upcoming.map((e) => e.tier))
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// §0 – THE TWO WORLDS ARE WHAT THEY CLAIM TO BE, AND THEY DISAGREE
// =================================================================================================
//
// ⚠ WITHOUT THIS THE SWEEP IN §2 IS UNFALSIFIABLE. Two worlds that both call the domestic rungs shut
// would let a screen that drew no domestic card ever pass every row below.
describe('site 1 – the fixture', () => {
  it('a professional with an empty national book, and a climber still on that table', () => {
    expect(activeLadderOf(PRO), 'she is on the professional table').toBe('wta')
    expect(PRO_SNAP.ladders.domestic.points, 'a professional earns no national points').toBe(0)
    expect(activeLadderOf(CLIMBER), 'and she is on nobody else\'s').toBe('domestic')

    // The disagreement the sweep needs: the SAME rung, open to one and shut to the other.
    expect(PRO_SNAP.tierOpen.local, 'the ladder shuts the club draw under the professional').toBe(false)
    expect(CLIMBER_SNAP.tierOpen.local, 'and holds it open for the climber').toBe(true)
    // ...and a junior rung the ladder holds OPEN for the professional, which is the row §1 is about.
    expect(PRO_SNAP.tierOpen.j30, 'at sixteen the junior tour is still hers').toBe(true)
  })

  it('...and both horizons really carry the rows under test, so there is something to hide', () => {
    for (const [name, snap] of [['professional', PRO_SNAP], ['climber', CLIMBER_SNAP]] as const) {
      const held = horizonTiers(snap)
      for (const t of DOMESTIC) expect(held.has(t), `${name}: the calendar holds a ${t}`).toBe(true)
      expect(held.has('j30'), `${name}: and a j30`).toBe(true)
    }
  })
})

// =================================================================================================
// §1 – THE PLAN'S OWN SENTENCE: A ROW THE LADDER CALLS OPEN IS NOT FILTERED
// =================================================================================================
describe('site 1 – the screen draws what the ladder opens', () => {
  it('⭐⭐ a DOMESTIC row the ladder calls open is on the climber\'s screen', () => {
    // The direction a hidden second rule breaks. `paysIntoHerTables` is a live screen-side copy of
    // the engine's Play Down limb; widen it by one table and this girl loses the only tennis she has.
    expect(CLIMBER_SNAP.tierOpen.local).toBe(true)
    expect(renderedTiers(CLIMBER_SNAP)).toContain('local')
  })

  it('⭐⭐ ...and so is a JUNIOR row, on the professional\'s – the age filter is the other copy', () => {
    expect(PRO_SNAP.tierOpen.j30).toBe(true)
    expect(renderedTiers(PRO_SNAP)).toContain('j30')
  })

  it('a row the ladder SHUT is absent, not merely refused – the negative half', () => {
    // Without this pair the tests above would pass against a screen that drew the whole calendar.
    const drawn = renderedTiers(PRO_SNAP)
    for (const t of DOMESTIC) expect(drawn, `${t} left the feed`).not.toContain(t)
  })
})

// =================================================================================================
// §2 – ⭐⭐ THE PARITY: ONE SNAPSHOT, THE ENGINE'S LADDER AND THE RENDERED FEED, SWEPT
// =================================================================================================
//
// ⚠⚠ THE MUTATION TABLE, EACH ARM APPLIED ALONE AND REVERTED, AND WHAT EACH ONE ACTUALLY REDDENED –
// measured on 24.09 rather than predicted. The THIRD arm is the one that says why this file exists
// beside `dead-rungs.test.ts` instead of repeating it.
//
//   A. THE SOURCE MOVED – `PLAY_DOWN.domesticFromProTable` set to false (engine/world/ladder.ts), so
//      the ladder re-opens the club draws under a professional -> 3 red here (§0's disagreement row,
//      the professional's «every open rung is drawn» row, the anti-vacuity row) and 9 red in
//      `tests/dead-rungs.test.ts`. Both readers moved with the source, which is what one source
//      looks like from the outside.
//   B. ONLY THE UI MOVED, IN THE COMPOSABLE – `paysIntoHerTables`' `floor <= 0` escape removed, so
//      the screen drops the club draws from the girl whose only table they are (the round-21 #5 rule
//      re-spelled one table too wide, which is exactly the mistake a hand-kept copy makes) -> 2 red
//      here, plus `dead-rungs.test.ts:293` and `tier-window.test.ts:528`; `ladder-floor.test.ts`
//      GREEN. So the engine is untouched and the composable net catches this one too.
//   C. ⭐⭐ ONLY THE UI MOVED, IN THE TEMPLATE – `visibleUpcoming` in `SeasonScreen.vue` given a
//      fourth term (`&& e.tier !== 'local'`), a filter living where no composable can see it ->
//      2 red HERE and `dead-rungs.test.ts` + `tier-window.test.ts` ENTIRELY GREEN, 47 passed. ⭐ That
//      asymmetry is this file's whole reason to exist: the composable-level net cannot see a rule
//      the SCREEN holds, and the rendered feed can.
describe('site 1 – the feed and the ladder agree, rung by rung', () => {
  const worlds: { name: string; snap: Snapshot }[] = [
    { name: 'the professional', snap: PRO_SNAP },
    { name: 'the climber', snap: CLIMBER_SNAP },
  ]

  for (const w of worlds) {
    it(`${w.name}: every drawn card sits on a rung the engine holds open`, () => {
      // ⚠ TOTAL OVER THE LADDER, not a list of the three rungs the defect happened to touch: a rung
      // added tomorrow inherits the guard instead of needing its own case.
      for (const tier of new Set(renderedTiers(w.snap))) {
        expect(w.snap.tierOpen[tier], `${w.name}: ${tier} is drawn on a rung the ladder shut`).toBe(true)
      }
    })

    it(`${w.name}: ...and every rung it holds open with tennis on it is drawn`, () => {
      const drawn = new Set(renderedTiers(w.snap))
      const held = horizonTiers(w.snap)
      for (const tier of TIER_LADDER) {
        if (!w.snap.tierOpen[tier] || !held.has(tier)) continue
        expect(drawn.has(tier), `${w.name}: the ladder opens ${tier} and the screen filtered it`).toBe(true)
      }
    })
  }

  it('⚠ the sweep is not one answer twice – the two worlds part company on the same rungs', () => {
    // A parity sweep whose every row reads the same way would pass against a screen that drew
    // everything, or nothing. This is what stops both readings.
    const open = (snap: Snapshot) => DOMESTIC.filter((t) => snap.tierOpen[t]).length
    expect(open(PRO_SNAP), 'the professional keeps a club draw').toBe(0)
    expect(open(CLIMBER_SNAP), 'the climber has none of them').toBeGreaterThan(0)
  })
})
