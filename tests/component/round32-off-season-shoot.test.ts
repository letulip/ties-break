// =================================================================================================
// ⭐⭐ ROUND 32 #1 – A SHOOT BOOKED IN THE OFF-SEASON IS DRAWN, because the winter IS the shoot season
// =================================================================================================
//
// THE OWNER, 31.08, playing the merged round-31 build: a shooting week that falls in the off-season
// shows no shoot in the calendar at all. His words are in docs/rounds/round-32.md item 1, where they
// may be quoted in his own language.
//
// ⚠⚠ THE ENGINE WAS RIGHT AND THE CALENDAR WAS BLIND – the fourth «you paid and cannot see it» this
// year, and the third in `weekDays.ts` alone (round 29 #3's masseur, round 29 P13's tour table,
// round 30 #2's «do both», and now this). `WINTER_SHOOT_WEEKS = OFF_SEASON_WEEKS + 3` since round 29
// part four P9, so the shoot season CONTAINS the whole off-season and `chooseShootWeeks` fills those
// weeks FIRST. The picture stopped at an order of branches: the off-season branch returned with
// `base`'s `shoot: null` and seven `off` days, and the shoot's days were computed two branches
// below it.
//
// ⚠ IT IS THE COMMONEST SHOOT WEEK THERE IS, WHICH IS WHY IT MATTERS. Measured over 8,000 booked
// weeks from 4,000 one-year deals: 45.4% land in an off-season week. His own save says it from the
// other end - 11 of its 30 booked shoot weeks are off-season weeks, and week 933, the week the save
// sits on, is one of them (a Faro Automobiles shoot). §1 below is that week, rebuilt.
//
// ⚠ THE FIXTURE MIRRORS THE PERSISTED SHAPE AND IS NOT DERIVED FROM HIS SAVE. The booked weeks live
// on a signed `ad` offer's `terms.shootWeeks`; `toSnapshot` turns those into `adShoots` through
// `activeAdDeals`, and `calendarWeekFor` reads THAT. Every arm below walks the whole chain, because
// a fact-bag test would have proved the grid can draw a block nobody can reach - `round30-do-both-
// shoot.test.ts`'s own finding, restated.
//
// ⚠ MUTATION-VERIFIED, EACH CLAIM AGAINST ITS OWN ARM (measured, not asserted):
//   * reverting the off-season branch to `days: uniform('off', null, 'Off')` with no `shoot`
//     - i.e. the defect itself - reddens §1's «the hours are on the week», §1's `week.shoot`, and
//       every slot of §2, and leaves §1's «the week is still the off-season» arms green;
//   * dropping the branch's `shoot:` line alone - the days drawn, the deal unnamed - reddens the
//     `week.shoot` arm and the neighbours arm and LEAVES the «hours are on the week» arm green,
//     which is what makes those two separate claims rather than one restated;
//   * writing `title: 'Shooting week'` on the branch (the ordinary week's rule, wrongly copied)
//     reddens the two identity arms and §2's three off-season slots - and NONE of §1's picture
//     arms, which is the direction that matters: the fix may add a block, not rename the week;
//   * dropping `nextTripRounds: null` from the branch reddens the lent-Sunday arm alone - and it is
//     a separate arm precisely because the identity arm's fixture has nothing entered, so on that
//     one the field is null either way and the mutation would not have been felt.
import { describe, it, expect } from 'vitest'
import { calendarWeekFor, type CalendarWeek } from '../../src/composables/weekDays'
import { weekGridFor, type DayBlock, type GridDay } from '../../src/composables/weekGrid'
import { weekDayNumbers } from '../../src/shared/dates'
import { adOfferId } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { isExamWeek, isOffSeasonWeek, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { DEFAULT_PROFILE, type AdOfferTerms, type Snapshot } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// =================================================================================================
// FIXTURES
// =================================================================================================

/** ⭐ HIS WEEK. 933 is season-year 17, offset 49 – the first of the three off-season weeks – and it
 *  is the week his save sits on with a Faro Automobiles shoot booked in it. Named as arithmetic
 *  rather than as a literal so the fixture follows `OFF_SEASON_WEEKS` if the calendar ever moves. */
const SEASON = 17
const slot = (offset: number): number => SEASON * WEEKS_PER_YEAR + offset
const HIS_WEEK = slot(49)

const BRAND = 'Faro Automobiles'

/** THE PERSISTED SHAPE, MIRRORED: a signed advertising deal in force, whose frozen terms name the
 *  weeks. This is what his export carries and what `toSnapshot` reads `adShoots` out of – the file
 *  itself is read-only and never copied here.
 *
 *  ⚠ THE DEAL IS SIGNED TEN WEEKS BEFORE AND RUNS A YEAR, which is `activeAdDeals`' own window
 *  ([fromWeek, untilWeek]). A deal outside it is not on the snapshot at all, and an arm built on one
 *  would be asserting about an empty `adShoots`. */
function shootWorld(seed: string, at: number, shootWeeks: number[]): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = at
  world.plan = { train: 75, rest: 25 }
  world.condition = 60
  world.fundsCents = 500_000_00
  world.offers.push({
    id: adOfferId(at - 10, 'cars'),
    kind: 'ad',
    week: at - 10,
    deadlineWeek: at - 7,
    state: 'signed',
    decidedWeek: at - 10,
    fromWeek: at - 10,
    untilWeek: at - 10 + 51,
    terms: {
      brand: BRAND,
      // ⚠ index 1 since round 34: a band was prepended at ≤400 and this is still the ≤200 cell
      cashCents: ECONOMY.advertising.categories.cars.feeCentsByBand[1]!,
      termWeeks: 52,
      shootCount: shootWeeks.length,
      shootWeeks: [...shootWeeks],
    } as AdOfferTerms,
  })
  return world
}

/** ...and the same world with no campaign at all – the control every «it appears» arm needs. */
function bareWorld(seed: string, at: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = at
  world.plan = { train: 75, rest: 25 }
  world.condition = 60
  world.fundsCents = 500_000_00
  return world
}

/** The snapshot, with the fixture's own honesty checks: an arm about a shoot the snapshot does not
 *  carry would pass on nothing. */
function snapshotOf(world: WorldState, expectShoots: boolean): Snapshot {
  const snap = toSnapshot(world)
  expect(snap.week, 'the world really stands on the fixture week').toBe(world.week)
  if (expectShoots) {
    expect(snap.adShoots.length, 'the signed deal reached the snapshot as an adShoots row').toBe(1)
    expect(snap.adShoots[0].brand).toBe(BRAND)
  } else {
    expect(snap.adShoots, 'the control carries no campaign at all').toEqual([])
  }
  return snap
}

function weekOf(snap: Snapshot, week: number): CalendarWeek {
  return calendarWeekFor(snap, week)
}
function gridOf(snap: Snapshot, week: number): GridDay[] {
  return weekGridFor(weekOf(snap, week), snap.ageYears, weekDayNumbers(week))
}
const blocksOf = (grid: GridDay[]): DayBlock[] => grid.flatMap((d) => d.blocks)
const shootBlocks = (grid: GridDay[]): DayBlock[] => blocksOf(grid).filter((b) => b.label === 'Shoot')
const daysWithShoot = (grid: GridDay[]): number[] =>
  grid.filter((d) => d.blocks.some((b) => b.label === 'Shoot')).map((d) => d.index)

/** The one sentence the branch prints, quoted once so an arm about it cannot drift into re-spelling
 *  it. ⚠ IT IS HIS COPY AND THIS ROUND MAY NOT MOVE IT (invariant 4) – the assertion exists to catch
 *  a fix that rewrote the week while adding the shoot to it. */
const OFF_SEASON_READOUT = 'The tour is closed – this is the block where next year gets built.'

// =================================================================================================
// §1 – HIS WEEK: the defect, rebuilt, and the half of the week that must not move with the fix
// =================================================================================================
describe('round 32 #1 §1 – a booked shoot in the off-season is on the calendar', () => {
  it('⚠⚠ the defect itself: an off-season week with a live shoot draws Shoot hours, and without one draws none', () => {
    expect(isOffSeasonWeek(HIS_WEEK), 'the fixture week really is an off-season week').toBe(true)

    const withShoot = gridOf(snapshotOf(shootWorld('r32-his-week', HIS_WEEK, [HIS_WEEK]), true), HIS_WEEK)
    const without = gridOf(snapshotOf(bareWorld('r32-his-week-control', HIS_WEEK), false), HIS_WEEK)

    expect(shootBlocks(without), 'an off-season week with no campaign is untouched by this item').toHaveLength(0)
    expect(shootBlocks(withShoot).length, 'the day he paid for is on the week').toBeGreaterThan(0)
    // The call time goes with it – `SHOOT_DAY` is a call and a shoot block, and half a shoot day
    // would be a shape nobody drew.
    expect(
      blocksOf(withShoot).filter((b) => b.label === 'Call').length,
      'every shoot day has its call time',
    ).toBe(shootBlocks(withShoot).length)
  })

  it('⭐ the week names WHOSE shoot it is, and on exactly the days it drew', () => {
    const snap = snapshotOf(shootWorld('r32-brand', HIS_WEEK, [HIS_WEEK]), true)
    const week = weekOf(snap, HIS_WEEK)
    expect(week.shoot, 'the week carries the deal').not.toBeNull()
    expect(week.shoot!.brand, 'the brand rides along, as it does on an ordinary shoot week').toBe(BRAND)
    expect(week.shoot!.days.length, 'and it took some of her days').toBeGreaterThan(0)
    // ⚠ THE FACT AND THE PICTURE ARE THE SAME DAYS. Two spellings of "which days" is exactly the
    // drift `weekDays.ts` spends its comments avoiding, and the grid is the half he can see.
    expect(daysWithShoot(gridOf(snap, HIS_WEEK)), 'the drawn days are the named days').toEqual(
      week.shoot!.days,
    )
    expect(
      week.days.filter((d) => d.kind === 'shoot').map((d) => d.index),
      'and so are the days the layout marks',
    ).toEqual(week.shoot!.days)
  })

  it('⭐⭐ ...and it is STILL the off-season in every other respect', () => {
    // ⚠ THE HALF THAT MUST NOT MOVE. He named a missing block, not a different week: the blackout
    // facts this branch carries are real and its copy is his (invariant 4). ⚠ MUTATION: writing
    // `title: 'Shooting week'` here - the ordinary branch's own rule, wrongly copied across - or
    // dropping `nextTripRounds: null`, reddens this arm alone.
    const snap = snapshotOf(shootWorld('r32-identity', HIS_WEEK, [HIS_WEEK]), true)
    const week = weekOf(snap, HIS_WEEK)
    const bare = weekOf(snapshotOf(bareWorld('r32-identity-control', HIS_WEEK), false), HIS_WEEK)

    expect(week.title, 'the eyebrow is the calendar block, not the campaign').toBe('Off-season')
    expect(week.readout, 'his sentence about the block where next year gets built').toBe(OFF_SEASON_READOUT)
    expect(week.readout, 'and it is the same sentence a shoot-free off-season week prints').toBe(bare.readout)
    expect(week.offSeason, 'the grid is still told which of the two `off` weeks this is').toBe(true)
    expect(week.trip, 'and nothing about it is a trip').toBeNull()
  })

  it('⚠ ...including the Sunday it refuses to lend, with a real entry waiting the week after', () => {
    // ⚠ THE ARM THAT MAKES `nextTripRounds: null` LOAD-BEARING. On a fixture with nothing entered the
    // field is null anyway (it comes off `base`), so dropping the branch's own refusal would not be
    // felt - the null result with no reader, in miniature. This one puts a committed entry in the
    // week after the LAST off-season slot, which is the only off-season week that can have one:
    // offsets 49 and 50 are followed by more off-season. ⚠ MUTATION: delete `nextTripRounds: null`
    // from the off-season branch and this reddens on its own.
    const week = slot(51)
    const next = slot(51) + 1
    expect(isOffSeasonWeek(week) && !isOffSeasonWeek(next), 'the last slot, and the season after it').toBe(true)

    const world = shootWorld('r32-lent-sunday', week, [week])
    const event: SeasonEvent = {
      id: 'r32-next-season-opener',
      week: next,
      tier: 'local',
      surface: 'hard',
      travelCostCents: 100_00,
      deadlineWeek: week - 2,
    }
    world.season = [event]
    world.entries = [event.id]
    const snap = snapshotOf(world, true)
    expect(
      snap.upcoming.some((e) => e.week === next && e.entered),
      'the fixture really has her entered in the week after',
    ).toBe(true)

    const drawn = weekOf(snap, week)
    expect(drawn.nextTripRounds, 'the tour is shut, so no Sunday is lent to a draw').toBeNull()
    expect(drawn.title, 'and it is still the off-season, shoot and all').toBe('Off-season')
    expect(shootBlocks(gridOf(snap, week)).length, 'with the shoot still on it').toBeGreaterThan(0)
  })

  it('⚠ the days the shoot did NOT take are still off-season days, drawn by the pre-season arc', () => {
    // The shoot takes DAYS of this week; it does not own it. The days around it keep the block's own
    // picture - court work and gym, the arc `PRE_SEASON_ARC` was written for - which is the same
    // combination the owner asked for on an ordinary shoot week in round 28 #6.
    const snap = snapshotOf(shootWorld('r32-neighbours', HIS_WEEK, [HIS_WEEK]), true)
    const week = weekOf(snap, HIS_WEEK)
    const grid = gridOf(snap, HIS_WEEK)
    const shootDays = new Set(week.shoot!.days)

    expect(shootDays.size, 'the shoot did not swallow the week').toBeLessThan(7)
    for (const day of week.days) {
      if (shootDays.has(day.index)) continue
      expect(day.kind, `${day.short} is not a shoot day and must still read as the off-season`).toBe('off')
    }
    const arcDays = grid.filter((d) => !shootDays.has(d.index))
    expect(
      arcDays.some((d) => d.blocks.some((b) => b.kind === 'training' || b.kind === 'trainingAlt')),
      'the block where next year gets built still has court work in it',
    ).toBe(true)
    expect(
      arcDays.every((d) => d.blocks.every((b) => b.label !== 'Shoot')),
      'and no shoot hour strayed onto a day the deal did not name',
    ).toBe(true)
  })
})

// =================================================================================================
// §2 – ALL THREE OFF-SEASON SLOTS, and the winter weeks either side that already worked
// =================================================================================================
describe('round 32 #1 §2 – every off-season slot, not just the one he stood on', () => {
  // ⚠ A SWEEP RATHER THAN ONE WEEK, because the branch is chosen by `isOffSeasonWeek` and all three
  // of its slots reach it. His save books shoots on all three (49, 50 and 51).
  for (const offset of [49, 50, 51]) {
    it(`⭐ offset ${offset} draws the shoot it is booked for`, () => {
      const week = slot(offset)
      expect(isOffSeasonWeek(week), `offset ${offset} is an off-season week`).toBe(true)
      const snap = snapshotOf(shootWorld(`r32-slot-${offset}`, week, [week]), true)
      expect(shootBlocks(gridOf(snap, week)).length, 'the booked week is drawn').toBeGreaterThan(0)
      expect(weekOf(snap, week).title, 'and it is still the off-season').toBe('Off-season')
    })
  }

  // ⚠ THE CONTROL THAT KEEPS THE SWEEP HONEST. Offsets 46-48 are winter shoot weeks too
  // (`WINTER_SHOOT_WEEKS` is `OFF_SEASON_WEEKS + 3`) and they are NOT off-season, so they have
  // always reached the ordinary-week branch and always drawn. If these were red, the defect would
  // have been somewhere else entirely and this whole file would be aimed at the wrong branch.
  for (const offset of [46, 47, 48]) {
    it(`⚠ offset ${offset} is a winter week the ordinary branch already drew, and still does`, () => {
      const week = slot(offset)
      expect(isOffSeasonWeek(week), `offset ${offset} is winter but not off-season`).toBe(false)
      const snap = snapshotOf(shootWorld(`r32-winter-${offset}`, week, [week]), true)
      expect(shootBlocks(gridOf(snap, week)).length, 'unchanged by this round').toBeGreaterThan(0)
    })
  }

  it('⚠ and a shoot booked SOMEWHERE ELSE does not paint the off-season week it is not on', () => {
    // The predicate is per-week (`weeks.includes(week)`), and an arm that never checks the negative
    // would pass on a branch that drew a shoot on every off-season week of the career.
    const here = HIS_WEEK
    const elsewhere = slot(50)
    const snap = snapshotOf(shootWorld('r32-elsewhere', here, [elsewhere]), true)
    expect(shootBlocks(gridOf(snap, elsewhere)).length, 'the booked week draws it').toBeGreaterThan(0)
    expect(shootBlocks(gridOf(snap, here)), 'the week beside it does not').toHaveLength(0)
    expect(weekOf(snap, here).shoot, 'and carries no deal').toBeNull()
  })
})

// =================================================================================================
// §3 – WHAT THIS ROUND DID NOT DO, pinned so the next reader sees a decision rather than an oversight
// =================================================================================================
describe('round 32 #1 §3 – the exam fortnight is knowingly left as it is', () => {
  it('⚠ a shoot booked in an exam week is still not drawn – recorded, not overlooked', () => {
    // ⚠⚠ THIS PINS AN OMISSION AND SAYS SO. The exam branch has the identical latent gap and it was
    // NOT fixed: the round asked for the off-season, `chooseShootWeeks` reaches offsets 23-24 only
    // through the in-season spill (0.4% of booked weeks against the off-season's 45.4%), the gap
    // closes itself once she leaves school, and this branch's read-out counts her sessions out loud
    // - so drawing a shoot beside it is a WORDING question, and the wording is his (invariant 4).
    // The whole argument is in `calendarWeekFor`'s own note above the branch. If he asks for it,
    // this arm is what moves.
    const world = shootWorld('r32-exam', slot(23), [slot(23)])
    // She has to still be at school for the fortnight to exist at all – past `schoolEndsWeek`
    // `isExamWeek` answers false and the week is an ordinary training week that already draws.
    world.week = slot(23)
    const snap = toSnapshot(world)
    if (!isExamWeek(slot(23), snap.schoolEndsWeek !== undefined && slot(23) >= snap.schoolEndsWeek)) {
      // A fixture this old is past school; assert the branch is unreachable rather than skip, so a
      // calendar change that puts her back in school here fails loudly instead of passing silently.
      expect(weekOf(snap, slot(23)).title, 'past school this is an ordinary week and it draws').not.toBe('Exams')
      return
    }
    expect(weekOf(snap, slot(23)).shoot, 'unchanged by round 32').toBeNull()
  })
})
