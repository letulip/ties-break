// ROUND 46 #6 – «Может для своей яхты тоже поставим -15% вероятности травмы?» (owner, 05.10).
//
// «Тоже» is the Elite recovery programme: `buffFactor` 0.85 -> `world.recoveryBuff` -> ONE post-draw
// multiply in `injuryTau`, printed on the sheet as «injury risk −15% for 4 weeks». The own-yacht week had
// none. It carries the same −15% now, on the OWNER's week only (`grantedBuffFactor`), through the SAME
// pathway: nothing here adds a draw, a stream or a second multiply.
//
// ⚠ WHAT THIS FILE HOLDS: (a) the row and the one rule that reads it, (b) the booking through the real tick
// seam – owner against charter, same seed, (c) the compare, p x 0.85 exactly, (d) the measurement arm of
// invariant 5 – 40 seeds x 1040 weeks, predicted against measured – and (e) that nothing but the owner's
// yacht week moved. The sheet's half of the parity lives in tests/component/round29-shop-elite.test.ts.

import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek, bookVacation, injuryTau, toSnapshot } from '../src/engine/world'
import { resolveVacation } from '../src/engine/world/planner'
import type { WorldState } from '../src/engine/world/state'
import { ECONOMY, vacationBuffFactor, vacationPackage } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import type { FamilyBackground, PlayerProfile } from '../src/shared/protocol'
import { fnv1aHex } from './helpers/hash'

function bgProfile(background: FamilyBackground): PlayerProfile {
  return {
    kidName: 'Vera',
    kidLastName: 'Martin',
    gender: 'girl',
    country: 'US',
    background,
    coachTier: 'self',
    playStyle: 'all-court',
    birthMonth: 6,
    birthDay: 15,
  }
}

/** The first week with no tournament on it and clear of the exam / summer blocks (planner.test.ts' own). */
function freeWeek(world: WorldState): number {
  for (let w = world.week + 1; w < world.week + 40; w++) {
    if (world.season.some((e) => e.week === w)) continue
    const offset = w % 52
    if (offset >= 49 || (offset >= 24 && offset <= 25)) continue
    return w
  }
  throw new Error('no free week')
}

/** THE DELIVERED SHAPE, WRITTEN DIRECTLY: an owned row with no `readyWeek` is what «delivered» means
 *  (shared/protocol/profile.ts). The three-year wait is ticked for real in round29-shop-elite.test.ts; what
 *  this file asks is what a DELIVERED yacht does to a booked week. */
const yachtRow = () => ({ id: 'yacht', boughtWeek: 0, paidCents: 12_000_000_00, valueCents: 12_000_000_00, entries: [] })

const FUNDS = 60_000_000_00

/** Book `packageId` on the first free week and tick the REAL week loop up to it – `resolveVacation` runs
 *  inside that tick, so what comes back is what a played career would hold. */
function atTheBookedWeek(seed: string, ownsYacht: boolean, packageId = 'yacht-week') {
  const w = createWorld(seed, bgProfile('wealthy'))
  w.fundsCents = FUNDS
  if (ownsYacht) w.assets = [yachtRow()]
  const week = freeWeek(w)
  bookVacation(w, week, packageId)
  const rng = rngFromSeed(w.seed)
  while (w.week < week) tickWeek(w, rng)
  return { w, week }
}

describe('round 46 #6 – the own yacht week carries the −15% (his «тоже»)', () => {
  it('(a) the row: the charter keeps buffFactor 1, the owner\'s week carries Elite\'s own 0.85 – and no other rung has the field', () => {
    const yacht = vacationPackage('yacht-week')!
    const elite = vacationPackage('elite')!
    expect(yacht.buffFactor, 'the charter row is untouched – §13g\'s «weaker after-effect»').toBe(1)
    expect(yacht.grantedBuffFactor, '«тоже» = exactly the clinic\'s factor, not a nearby number').toBe(elite.buffFactor)
    expect(yacht.grantedBuffFactor).toBe(0.85)
    // ...and the six that were never the owner's say so by silence
    expect(
      ECONOMY.vacation.packages.filter((p) => p.grantedBuffFactor !== undefined).map((p) => p.id),
      'exactly one package carries the owner\'s buff',
    ).toEqual(['yacht-week'])
  })

  it('(a) the ONE rule: only (yacht-week, granted) answers 0.85 – every other pairing answers the shipped buffFactor', () => {
    for (const p of ECONOMY.vacation.packages) {
      for (const granted of [[], ['yacht-week'], ['yacht-week', 'elite']]) {
        const expected = p.id === 'yacht-week' && granted.includes('yacht-week') ? 0.85 : p.buffFactor
        expect(vacationBuffFactor(p, granted), `${p.id} with [${granted.join(',')}]`).toBe(expected)
      }
    }
    // THE CONSERVATIVE DEFAULT: a caller that forgot the list is told the charter's factor, never a promise.
    expect(vacationBuffFactor(vacationPackage('yacht-week')!)).toBe(1)
    // ...and the clinic and the resort are exactly what they were
    expect(vacationBuffFactor(vacationPackage('elite')!, ['yacht-week'])).toBe(0.85)
    expect(vacationBuffFactor(vacationPackage('resort')!, ['yacht-week'])).toBe(0.9)
  })

  it('(b)+(c) THE SEAM: the owner\'s booked week sets recoveryBuff 0.85 and the compare sees tau x 0.85; the charter sets nothing', () => {
    const owner = atTheBookedWeek('r46-6-seam', true)
    const charter = atTheBookedWeek('r46-6-seam', false)
    expect(toSnapshot(owner.w).shop.vacationIds, 'the engine reads the row as a delivered yacht').toEqual(['yacht-week'])
    expect(toSnapshot(charter.w).shop.vacationIds, 'and the charter family owns nothing').toEqual([])

    expect(owner.w.recoveryBuff).toEqual({ untilWeek: owner.week + ECONOMY.vacation.buffWeeks, factor: 0.85 })
    expect(charter.w.recoveryBuff, 'a charter carries no after-effect – unchanged').toBeNull()

    // THE COMPARE: the same world, the buff on and off – tau is cut by exactly the factor (post-draw multiply)
    owner.w.condition = 60
    charter.w.condition = 60
    const buffed = injuryTau(owner.w)
    const unbuffed = (() => {
      const buff = owner.w.recoveryBuff
      owner.w.recoveryBuff = null
      const t = injuryTau(owner.w)
      owner.w.recoveryBuff = buff
      return t
    })()
    expect(buffed).toBeLessThan(unbuffed)
    expect(buffed).toBeCloseTo(unbuffed * 0.85, 12)
    // OWNERSHIP IS THE ONLY DIFFERENCE: the charter family's tau is the owner's UNBUFFED tau – the yacht
    // leaks into the compare through the buff and through nothing else.
    expect(injuryTau(charter.w)).toBeCloseTo(unbuffed, 12)

    // THE LOG TELLS THE TRUTH ABOUT THE BUFF: the existing «recovery holds» template is selected by the buff
    // that is actually live, never by the row (no string was written for this item).
    const lineOf = (w: WorldState) =>
      w.events.filter((e) => e.text.startsWith('Family vacation – A week on the yacht')).map((e) => e.text)
    expect(lineOf(owner.w)).toHaveLength(1)
    expect(lineOf(owner.w)[0]).toMatch(/recovery holds/)
    expect(lineOf(charter.w)).toHaveLength(1)
    expect(lineOf(charter.w)[0]).not.toMatch(/recovery holds/)
  })

  it('(e) NOTHING ELSE MOVED: an owner who books the clinic gets the clinic\'s 0.85, one who books the seaside gets none', () => {
    const clinic = atTheBookedWeek('r46-6-elite', true, 'elite')
    expect(clinic.w.recoveryBuff).toEqual({ untilWeek: clinic.week + ECONOMY.vacation.buffWeeks, factor: 0.85 })
    const seaside = atTheBookedWeek('r46-6-seaside', true, 'seaside')
    expect(seaside.w.recoveryBuff, 'owning a yacht buffs no other week').toBeNull()
    const resort = atTheBookedWeek('r46-6-resort', true, 'resort')
    expect(resort.w.recoveryBuff?.factor, 'the resort is still the resort').toBe(0.9)
  })

  // ⭐ (f) BYTE-IDENTICAL TO TODAY, with a control that can fail. The knob is optional and the one rule answers
  // `buffFactor` whenever it is absent, so DELETING `grantedBuffFactor` IS the pre-change table – the control arm
  // is this very engine with the change reverted, which is the only honest A in a shared checkout. Six worlds
  // are serialised with the knob and without it: a charter family's yacht week, and a yacht-less or yacht-owning
  // family's other packages. They must hash identically. And the owner's own yacht week must NOT – the positive
  // control, without which "identical" could just mean the arm never reached the change.
  it('(f) a world that owns no delivered yacht serialises byte-identically with and without the knob; the owner\'s yacht week is the one that moves', () => {
    const row = vacationPackage('yacht-week')!
    const knob = row.grantedBuffFactor
    expect(knob, 'the arm starts with the change in place').toBe(0.85)
    const hashOf = (ownsYacht: boolean, id: string) =>
      fnv1aHex(JSON.stringify(atTheBookedWeek(`r46-6-ident-${id}-${ownsYacht}`, ownsYacht, id).w))
    const unaffected: Array<[boolean, string]> = [
      [false, 'yacht-week'], // the charter
      [false, 'elite'],
      [false, 'seaside'],
      [true, 'elite'], // a yacht owner booking something else
      [true, 'seaside'],
      [true, 'resort'],
    ]
    const withKnob = unaffected.map(([owns, id]) => hashOf(owns, id))
    const ownerWith = hashOf(true, 'yacht-week')
    delete row.grantedBuffFactor // = the table as it was before round 46 #6
    let withoutKnob: string[]
    let ownerWithout: string
    try {
      withoutKnob = unaffected.map(([owns, id]) => hashOf(owns, id))
      ownerWithout = hashOf(true, 'yacht-week')
    } finally {
      row.grantedBuffFactor = knob // restore, even if an assertion below is about to fail
    }
    expect(new Set(withKnob).size, 'six different worlds, so the comparison below has something to compare').toBeGreaterThan(1)
    expect(withoutKnob, 'no world but the owner\'s yacht week moved').toEqual(withKnob)
    expect(ownerWithout, 'the positive control: the owner\'s yacht week IS what the knob changes').not.toBe(ownerWith)
    expect(row.grantedBuffFactor, 'and the knob is back').toBe(0.85)
  })

  // ⭐ INVARIANT 5, THE MEASUREMENT ARM – predicted, then measured, and the instrument is the COMPARE itself.
  //
  // PREDICTED: tau x 0.85 on every buffed week, so the weekly injury chance falls by exactly fifteen per
  // cent (the sum of tau over the sample is the exact figure; the cap `injuryChanceCap` can only RAISE the
  // ratio and no sampled state reaches it), and the HITS – the same seeded roll u read by `rollInjury` as
  // `u < tau` – fall by fifteen per cent in expectation, within sampling noise (about +-0.02 at this size: 1040 weeks is twenty seasons of one body, a whole career's span).
  //
  // WHY THE COMPARE AND NOT A FULL SEASON: a played season diverges after the first injury either arm takes
  // (results, condition and the next roll's state all move), so a full-tick count measures the path, not the
  // multiplier. Here both arms see the IDENTICAL roll on the identical state – the owner's arm's hits are a
  // subset of the charter's, and the only thing that differs is the one factor under test. The `resolveVacation`
  // seam runs for real, once per seed, and supplies the factor.
  it('(d) MEASURED – 40 seeds x 1040 weeks: tau x 0.85 at the compare, and the hits fall by the same fifteen per cent', () => {
    let sumCharter = 0
    let sumOwner = 0
    let hitsCharter = 0
    let hitsOwner = 0
    let weeks = 0
    let maxTau = 0
    for (let s = 0; s < 40; s++) {
      const w = createWorld(`r46-6-measure-${s}`, bgProfile('wealthy'))
      w.assets = [yachtRow()]
      const week = freeWeek(w)
      bookVacation(w, week, 'yacht-week')
      w.week = week
      resolveVacation(w) // the REAL seam, once per seed
      expect(w.recoveryBuff, `seed ${s}: the owner's week set the buff`).not.toBeNull()
      const factor = w.recoveryBuff!.factor
      expect(factor).toBe(0.85)
      w.vacations = [] // sample ordinary weeks, not the booked one
      for (let i = 1; i <= 1040; i++) {
        const wk = week + i
        w.week = wk
        w.condition = 5 + ((i * 37 + s * 11) % 56) // fatigue 40..95 – the tired end of the range, where injuries live
        w.recoveryBuff = null
        const tauCharter = injuryTau(w)
        w.recoveryBuff = { untilWeek: wk, factor }
        const tauOwner = injuryTau(w)
        // the very first draw `rollInjury` takes on the private stream (`roll >= tau` returns, so a hit is `<`)
        const u = rngFromSeed(`${w.seed}:injury:${wk}`)()
        sumCharter += tauCharter
        sumOwner += tauOwner
        if (u < tauCharter) hitsCharter++
        if (u < tauOwner) hitsOwner++
        weeks++
        maxTau = Math.max(maxTau, tauCharter)
      }
    }
    const tauRatio = sumOwner / sumCharter
    const hitRatio = hitsOwner / hitsCharter
    console.log(
      'B10-MEASURE ' +
        JSON.stringify({ weeks, hitsCharter, hitsOwner, tauRatio: +tauRatio.toFixed(6), hitRatio: +hitRatio.toFixed(4), maxTau: +maxTau.toFixed(5) }),
    )
    expect(weeks, 'a non-empty denominator on both arms').toBe(40 * 1040)
    expect(hitsCharter, 'enough injuries to read a ratio off').toBeGreaterThan(150)
    // the cap never binds in this spread (a binding cap would only RAISE the ratio, and this says it did not)
    expect(maxTau).toBeLessThan(ECONOMY.availability.injuryChanceCap)
    // PREDICTED, exactly: the chance is cut by the factor and by nothing else
    expect(tauRatio).toBeGreaterThanOrEqual(0.85 - 1e-9)
    expect(tauRatio).toBeLessThan(0.86)
    // the owner's hits are a SUBSET of the charter's: same roll, lower threshold
    expect(hitsOwner).toBeLessThanOrEqual(hitsCharter)
    // MEASURED: the realised ratio sits on the prediction, inside a four-sigma band of the sampling noise
    expect(hitRatio).toBeGreaterThan(0.78)
    expect(hitRatio).toBeLessThan(0.92)
  })
})
