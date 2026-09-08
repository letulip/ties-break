// =================================================================================================
// ⭐⭐⭐ ROUND 40 #14b – THE LAST WINTER IS COMING, AND THREE VOICES READ ONE NUMBER
// =================================================================================================
//
// THE OWNER, 08.09, on the recommendation r39 #14b's two measurements produced: «да, это именно то,
// о чем я и говорил. Где-то тренер может подсветить, где-то она сама, где-то финальный экран сезона.
// Давай сделаем.» And the window: «за сезон-два до того».
//
// ⚠⚠ THE ITEM ADDS NO BAND AND NO MECHANIC, and that is what the measurements decided rather than a
// scope call (both tables in docs/rounds/round-40.md): the plateau window can carry no trigger (52
// of 52 careers beat that day's rank afterwards, and the share is exactly 1.000 there because
// `declineStart` IS 29), and past 29 the shipped 0.55 is already the honest band – the median number
// of titles she still wins after a band fires reaches zero only there. What was missing was WARNING.
//
// FOUR CLAIMS, and each is a way this could go wrong later:
//   1. ⭐ ONE DERIVATION. Move the walk's target and all four sentences move together. A surface
//      with its own walk, its own threshold or a copied band fails here the week it appears.
//   2. IT SPEAKS ONLY INSIDE HIS WINDOW – at `LAST_WINTER_WARN_SEASONS` or fewer, never above it,
//      never before `ENDINGS.askFromAgeYears`, and never on the last winter itself.
//   3. THE BOUNDARY IS EXACT, walked rather than asserted: at every off-season of a whole career,
//      «1» means the NEXT winter is the one `retirementDue` marks final, and «2» means the one after
//      it. This is the claim the copy makes out loud, so it is the claim the test makes.
//   4. ZERO DRAWS (invariant 2): a projection over persisted state, on no stream at all.
import { describe, it, expect, afterEach } from 'vitest'
import {
  LAST_WINTER_WARN_SEASONS,
  coachDeclineNote,
  coachRoomShort,
  lastWinterIn,
} from '../src/engine/world/coachMarket'
import { herLastWinterLine, seasonLastWinterLine } from '../src/composables/declineVoice'
import { createWorld, toSnapshot } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { ENDINGS, retirementDue } from '../src/engine/ending'
import { plateauViewOf } from '../src/engine/world/endings'
import { ageCurveOf, declineFactor, physicalMean } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}

/** A synthetic past-peak world at (age, share) – r38-decline-voice's fixture shape, never a save.
 *
 *  ⚠ ONE SEASON ROW BY DEFAULT, AND THAT IS DELIBERATE: with no adjacent pair there is no
 *  year-on-year move and the career sits on its own best, so BOTH rank arms decline and every
 *  surface falls through to the body clause – which is the clause this file is about. The rank arms
 *  get their own fixture below. */
function worldAt(opts: { ageYears: number; share: number; seasons?: SeasonHistoryEntry[]; seasonWeek?: number }): WorldState {
  const world = createWorld('r40-last-winter', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.week = Math.round((opts.ageYears - 14) * WEEKS_PER_YEAR) + (opts.seasonWeek ?? 0)
  world.peakPhysical = physicalMean(world.skills) / opts.share
  world.seasonHistory = opts.seasons ?? [season(20, 125)]
  return world
}

/** The four sentences the item ships, off ONE world. The two display formatters are handed the
 *  number the way the screens are handed it – through the snapshot – so a field that stopped being
 *  wired shows up here as silence rather than as a passing unit test. */
function surfaces(world: WorldState): { card: string; plate: string; her: string | null; wrap: string | null } {
  const snap = toSnapshot(world)
  return {
    card: coachDeclineNote(world),
    plate: coachRoomShort(world),
    her: herLastWinterLine(snap.lastWinterIn),
    wrap: seasonLastWinterLine(snap.lastWinterIn),
  }
}

/** The first world whose count is exactly `winters`, found by sweeping the share rather than by
 *  writing one down – so a moved band or a moved window re-finds its own fixture instead of pinning
 *  a number that has quietly stopped meaning what it meant. */
function worldWithWinters(winters: number, ageYears = 41, seasonWeek = 0): WorldState {
  for (let share = 0.95; share > 0.45; share -= 0.002) {
    const world = worldAt({ ageYears, share, seasonWeek })
    if (lastWinterIn(world) === winters) return world
  }
  throw new Error(`no share between 0.45 and 0.95 gives ${winters} winters at ${ageYears} – the window has moved`)
}

/** The retirement question's own week, `resolveEndings` 7d's test restated. */
const isAskWeek = (week: number) => week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** ⚠ THE BAND IS A `const` OBJECT AND `as const` DOES NOT FREEZE IT, which is what makes claim 1
 *  measurable at all. Every mutation is restored in an `afterEach` and not merely at the end of the
 *  arm that made it, so a failing expectation cannot leave the dial moved for the next file. */
const setBand = (value: number): void => {
  ;(ENDINGS as unknown as { lastOfferPeakShare: number }).lastOfferPeakShare = value
}
const SHIPPED_BAND = ENDINGS.lastOfferPeakShare
afterEach(() => setBand(SHIPPED_BAND))

describe('round 40 #14b – one derivation under three voices', () => {
  // ===============================================================================================
  // 1. ⭐⭐ THE PIN THAT MATTERS: MOVE THE TARGET, AND ALL FOUR MOVE
  // ===============================================================================================
  it('⭐⭐ mutating the walk\'s target moves the coach card, Home\'s plate, her line and the wrap TOGETHER', () => {
    // A career still well clear of the band: everything is silent, which is the control.
    const world = worldAt({ ageYears: 41, share: 0.72 })
    expect(lastWinterIn(world), 'the fixture is not outside the window – re-place it').toBeNull()
    const quiet = surfaces(world)
    expect(quiet.her, 'her line spoke outside the window').toBeNull()
    expect(quiet.wrap, 'the wrap spoke outside the window').toBeNull()
    expect(quiet.card).not.toContain('last winter')
    expect(quiet.plate).not.toContain('last winter')

    // ⚠ RAISE THE BAND AND THE LAST WINTER COMES FORWARD – the same body, a nearer end. Nothing else
    // is touched: not the age, not the share, not the season history. The band is swept rather than
    // written down, so this arm keeps working the day the owner moves his own dial.
    let n: number | null = null
    for (let band = SHIPPED_BAND + 0.01; band < 0.72 && n === null; band += 0.01) {
      setBand(band)
      n = lastWinterIn(world)
    }
    expect(n, 'the target moved and the derivation did not follow it').not.toBeNull()
    expect(n).toBeLessThanOrEqual(LAST_WINTER_WARN_SEASONS)
    const loud = surfaces(world)
    // All four now speak, and every one of them speaks the SAME number – which is the whole claim.
    expect(loud.her, 'her line reads a different derivation from the engine').toBe(herLastWinterLine(n))
    expect(loud.wrap, 'the wrap reads a different derivation from the engine').toBe(seasonLastWinterLine(n))
    expect(loud.card, 'the coach card did not follow the target').toContain('last winter')
    expect(loud.plate, 'Home\'s plate did not follow the target').toContain('last winter')
    expect(loud.card, 'the card and the count disagree').toContain(
      n === 1 ? 'her last winter is the next one' : `her last winter is ${n} seasons away`,
    )
    expect(loud.plate, 'the plate and the count disagree').toContain(
      n === 1 ? 'her last winter is next' : `her last winter is ${n} seasons away`,
    )

    // ...and back down again: a target further away puts every one of them back to silence.
    setBand(0.3)
    expect(lastWinterIn(world)).toBeNull()
    const quietAgain = surfaces(world)
    expect(quietAgain).toEqual(quiet)
  })

  it('⭐ the coach\'s two surfaces carry the count into all three of his arms, and nowhere else', () => {
    const n = 2
    // Both rank arms true: an adjacent pair that fell, and a career best above both.
    const fell = worldAt({ ageYears: 41, share: 0.6, seasons: [season(24, 20), season(25, 68), season(26, 125)] })
    // The share is swept for the count rather than assumed – the fixture must be inside the window.
    const withCount = (seasons: SeasonHistoryEntry[], seasonWeek = 0): WorldState => {
      for (let share = 0.95; share > 0.45; share -= 0.002) {
        const world = worldAt({ ageYears: 41, share, seasons, seasonWeek })
        if (lastWinterIn(world) === n) return world
      }
      throw new Error('no share inside the window for this fixture')
    }
    const ranked = withCount(fell.seasonHistory as SeasonHistoryEntry[])
    // Arm 1 – the year-on-year fall keeps its half of the sentence and the body clause becomes the
    // warning. ⚠ THE RANK HALVES ARE UNTOUCHED COPY: this asserts they still render, byte for byte.
    expect(coachDeclineNote(ranked)).toBe(
      `Past her peak – down 57 places on the year, and her last winter is ${n} seasons away.`,
    )
    // Arm 3 – no rank fact the history can support, so his own clause closes the sentence.
    const plain = withCount([season(20, 125)])
    expect(coachDeclineNote(plain)).toBe(
      `Past her peak – her last winter is ${n} seasons away, and no coach buys that back.`,
    )
    // Arm 2 – below her best without an adjacent pair (the seasons are not consecutive).
    const below = withCount([season(16, 20), season(20, 125)])
    expect(coachDeclineNote(below)).toBe(
      `Past her peak – 105 places below her best season, and her last winter is ${n} seasons away.`,
    )
  })

  it('⚠ outside the window his sentence is BYTE-IDENTICAL to what shipped', () => {
    // Three winters out and past 0.70, which is where the shipped clause floors at «about 1 more
    // season in it». Nothing about the warning may reach this week.
    const world = worldAt({ ageYears: 33, share: 0.9, seasons: [season(24, 20), season(25, 68), season(26, 125)] })
    expect(lastWinterIn(world)).toBeNull()
    expect(coachDeclineNote(world)).toMatch(
      /^Past her peak – down 57 places on the year, and her body has about \d+ more seasons? in it\.$/,
    )
    expect(coachRoomShort(world)).not.toContain('winter')
  })

  // ===============================================================================================
  // 2. IT SPEAKS ONLY INSIDE HIS WINDOW
  // ===============================================================================================
  it('⚠ nothing above the window, and the edge is exact', () => {
    for (let n = 1; n <= LAST_WINTER_WARN_SEASONS; n++) {
      expect(lastWinterIn(worldWithWinters(n)), `the window should include ${n}`).toBe(n)
    }
    // ...and one further out is silence on every surface. Swept rather than picked: the first share
    // that is outside the window is the boundary, whatever it happens to be.
    let outside: WorldState | null = null
    for (let share = 0.95; share > 0.45; share -= 0.002) {
      const world = worldAt({ ageYears: 41, share })
      if (lastWinterIn(world) === null && share > 0.6) outside = world
    }
    expect(outside, 'no fixture outside the window – the walk is not moving with the share').not.toBeNull()
    const quiet = surfaces(outside!)
    expect(quiet.her).toBeNull()
    expect(quiet.wrap).toBeNull()
    expect(quiet.card).not.toContain('last winter')
    expect(quiet.plate).not.toContain('last winter')
  })

  it('⚠⚠ NOTHING BEFORE 29, whatever the share says – the plateau measurement\'s own finding', () => {
    // ⚠ THE GATE IS NOT REDUNDANT AND THIS IS WHY: before `askFromAgeYears` the share is exactly 1
    // by construction, so a projection off it is a projection off a constant. A poked save with an
    // absurd share is the strongest form of the claim – even THAT may not produce a warning.
    for (const age of [24, 26, 28, 28.9]) {
      for (const share of [0.99, 0.6, 0.3]) {
        const world = worldAt({ ageYears: age, share })
        // Only measure the rows the fixture actually places under 29 – `kidAgeExact` anchors on her
        // birth date, so the week arithmetic can land a fraction either side.
        const exact = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
        if (exact >= ENDINGS.askFromAgeYears) continue
        expect(lastWinterIn(world), `age ${exact.toFixed(2)} share ${share} spoke before 29`).toBeNull()
        expect(herLastWinterLine(toSnapshot(world).lastWinterIn)).toBeNull()
        expect(seasonLastWinterLine(toSnapshot(world).lastWinterIn)).toBeNull()
      }
    }
  })

  it('⚠ a save with no peak to measure against says nothing rather than guessing', () => {
    const world = worldAt({ ageYears: 41, share: 0.6 })
    expect(lastWinterIn(world)).not.toBeNull()
    world.peakPhysical = 0
    expect(lastWinterIn(world), 'a zero peak produced a count').toBeNull()
  })

  // ===============================================================================================
  // 3. ⭐⭐ THE BOUNDARY IS EXACT – WALKED, NOT ASSERTED
  // ===============================================================================================
  //
  // ⚠ THE COPY SAYS «One more winter after this one, and it will not be a question», so the test has
  // to be that claim and not a weaker one. The walk below is the measurement in `tools/r40-last-winter.ts`
  // reduced to its assertion: one whole career of off-seasons, the share compounded exactly as
  // `growWeek` compounds it, and at every ask week the count is compared against the ask that
  // `retirementDue` actually marks final.
  it('⭐⭐ «1» means the NEXT off-season is the final one, on every career curve', () => {
    for (const curve of [undefined, { plateauStart: 22, declineStart: 27 }, { plateauStart: 24, declineStart: 31 }]) {
      const world = createWorld('r40-boundary', { ...DEFAULT_PROFILE, coachTier: 'middle' })
      world.seasonHistory = [season(20, 125)]
      if (curve) world.ageCurve = { ...curve, injuryFrom: 0 }
      const bounds = ageCurveOf(world.ageCurve, 0)
      const base = physicalMean(world.skills)

      const asks: { week: number; count: number | null; final: boolean }[] = []
      let share = 1
      let started = false
      for (let week = 0; week < 46 * WEEKS_PER_YEAR; week++) {
        const age = kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay)
        if (age < bounds.declineStart) continue
        if (started) share *= 1 - declineFactor(age, bounds)
        started = true
        if (!isAskWeek(week)) continue
        world.week = week
        world.peakPhysical = base / share
        const offer = retirementDue(plateauViewOf(world))
        asks.push({ week, count: lastWinterIn(world), final: offer?.final === true })
        if (offer?.final) break
      }

      const label = curve ? `${curve.plateauStart}/${curve.declineStart}` : 'shipped'
      const finalAt = asks.findIndex((a) => a.final)
      expect(finalAt, `${label}: no final winter inside the walk`).toBeGreaterThan(0)
      for (let i = 0; i < asks.length; i++) {
        const away = finalAt - i
        const expected = away >= 1 && away <= LAST_WINTER_WARN_SEASONS ? away : null
        expect(asks[i]!.count, `${label}: off-season ${i} is ${away} away from the final one`).toBe(expected)
      }
      // ...and the last winter itself is silent: `lastWordLine` is the only voice there.
      expect(asks[finalAt]!.count, `${label}: the warning spoke on the final winter`).toBeNull()
      // The window is a window and not a permanent state – exactly his «сезон-два», no more.
      expect(asks.filter((a) => a.count !== null), `${label}: the warning fired on the wrong number of off-seasons`)
        .toHaveLength(LAST_WINTER_WARN_SEASONS)
    }
  })

  // ===============================================================================================
  // 4. ZERO DRAWS (invariant 2)
  // ===============================================================================================
  it('⚠ RNG: the projection touches no stream, and re-reading it cannot change a word', () => {
    const world = worldWithWinters(2)
    const before = { ...world.rngMain }
    const first = surfaces(world)
    for (let i = 0; i < 50; i++) {
      expect(surfaces(world), 'a surface changed between reads – something in here is drawing').toEqual(first)
    }
    expect(world.rngMain, 'the MAIN stream moved – this file may not draw').toEqual(before)
  })
})
