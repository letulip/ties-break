// ONE MARKET, DIFFERENT BASKETS – THE BENCH FOR ROUND 41 P1 (invariant 5: a price move ships with a
// measurement and with the prediction written BEFORE the run).
//
//     npx vite-node tools/r41-one-market.ts
//
// WHAT P1 DID, in one line each:
//   A. gear prices became GRADE-ONLY and uniform – `ECONOMY.gear[*].price` is a rung-keyed band for
//      the three laddered lines (strings / frame / shoes) and stays background-keyed for the one
//      line with no ladder (apparel). `kitLinePriceCents` lost its `background` parameter.
//   B. the wealth corridor stops at the top of the coach ladder – `self`/`budget`/`middle` keep
//      ±25-30%, `high`/`elite` are exactly 1.0 for every background, on the coach line, the facility
//      line that came out of it, and the medical bill that rides the same rung.
//
// =================================================================================================
// THE PREDICTIONS. Written from the tables, before the first run, so §1-§4 can falsify them.
// =================================================================================================
//
// ⚠⚠ P0 – THE BRIEF'S OWN PREDICTION IS ALREADY KNOWN TO BE FALSE AND THAT IS THIS BENCH'S HEADLINE.
// The design said the diagonal would give «zero drift by construction» on every background's DEFAULT
// basket, because working defaults to the club rung, middle to performance and wealthy to pro. THE
// CODE HAS NEVER WORKED THAT WAY: `DEFAULT_KIT_GRADES` is `composite` on all three lines for EVERY
// background (engine/equipment.ts), there has never been a per-background starting rung, and no
// engine path ever moves a rung – `setKitGrade` is reachable from the Money screen and from nowhere
// else. So the diagonal preserves the WORKING family's bill exactly and cannot preserve the other
// two, and the size of what it does to them is measured in §1 rather than asserted anywhere.
//
//   §1 default-basket weekly gear spend (old -> new), predicted from the band mids and the cadence
//      mids, to be checked against a real 520-week walk of the actual sub-streams:
//        working   0 cents/wk drift   EXACTLY – the composite band IS the old working band, cent for
//                                     cent, on all three laddered lines, and apparel is untouched.
//        middle    -1,833 cents/wk    (frame -1,000 · strings -417 · shoes -417 · apparel 0)
//        wealthy   -7,077 cents/wk    (frame -4,318 · strings -1,675 · shoes -1,083 · apparel 0)
//      i.e. about -$953 and -$3,680 a season. Nobody's bill RISES, which is the one direction that
//      would have been dangerous to ship silently (the $8k family is the one that cannot absorb it).
//
//   §2 the cross-grade table: three old prices per rung collapse to one. Predicted, for the frame:
//        alloy 49.50 · composite 90.00 · performance 506.00 · pro 2,260.00 – and the last of those
//        is the owner's own number («для богатой 2.2к») now charged to everybody, which is the whole
//        point of the slice. Predicted old spread at `pro`: 360 / 920 / 2,260 (6.3x end to end).
//
//   §3 coach + physio weekly bill per tier x background (old -> new):
//        self / budget / middle rows   0 drift, every background – the corridor is untouched there.
//        high / elite rows             working +33.3% (0.75 -> 1.00), middle 0.0% (its mid was
//                                      already 1.00 – only the week-to-week roll narrows), wealthy
//                                      -20.0% (1.25 -> 1.00). The fade is visible as three numbers
//                                      becoming one.
//
//   §4 icon-allowance coverage. The $12,000 season allowance against a season of the three laddered
//      lines. Predicted: at `pro` the three backgrounds read DIFFERENT coverage today (the same pot
//      buys the working family far more) and IDENTICAL coverage after, which is the owner's second
//      oddity – «a working family's 12k icon allowance would over-cover their cheaper gear» –
//      dissolving by construction. At the DEFAULTS the three still differ, and they differ MORE
//      after, because the cadence (not the price) is what is left carrying the difference.
//
// ⚠ THE OLD ARM IS RECONSTRUCTED ARITHMETIC, NOT A SECOND TREE, and it is honest for exactly one
// reason: the pre-P1 price rule was `mid(band[background]) x grades[grade].priceFactor` and both
// halves are still in the source – the bands as the rung table's own derivation (written out in
// `ECONOMY.gear`'s header) and `priceFactor` as a live field on `ECONOMY.equipment.grades`. So OLD
// is spelled once, below, from the same constants, and a reader can check it against the git history
// in one diff. §1's NEW arm is a real walk of the real sub-stream; its OLD arm is the same walk with
// the same draws and the old price rule applied, which is exact rather than approximate because
// `pickInt` spends one `rng()` call whatever its bounds (so the two arms take the same path).

import { ECONOMY, GEAR_CATEGORIES, gearHitsUpTo, gearPriceBandCents, type GearCategory } from '../src/engine/economy'
import {
  DEFAULT_KIT_GRADES,
  KIT_GRADES,
  LINE_GEAR_CATEGORY,
  kitLinePriceCents,
} from '../src/engine/equipment'
import {
  COACH_TIERS,
  coachCorridorMid,
  coachHoursForPlan,
  coachRateBandCents,
  coachWeeklyCents,
  corridorAppliesAt,
  facilityRateCents,
} from '../src/engine/coach'
import { pickInt, rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { WEEK_PLAN_PRESETS, type CoachTier, type FamilyBackground, type KitGrade, type KitLine } from '../src/shared/protocol'

const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
const LADDERED: GearCategory[] = ['rackets', 'stringing', 'shoes']
const HORIZON = 20 * WEEKS_PER_YEAR
const SEEDS = 64

const money = (c: number): string => `$${(c / 100).toFixed(2)}`
const pad = (s: string, n: number): string => s.padStart(n)
const padEnd = (s: string, n: number): string => s.padEnd(n)
const pct = (a: number, b: number): string => (b === 0 ? '   n/a' : `${(((a - b) / b) * 100).toFixed(1)}%`)

// --- THE OLD RULE, SPELLED ONCE ------------------------------------------------------------------
// The pre-P1 bands, recovered from the rung table's own derivation: each rung's band is the anchor
// background's band times that rung's `priceFactor`, so the anchor background's band is the rung's
// band divided by the factor. `composite` has factor 1, so `oldBand(cat, 'working')` is exactly the
// composite band and needs no division at all - which is why §1's working row is a zero by identity.
const ANCHOR: Record<FamilyBackground, KitGrade> = { working: 'composite', middle: 'performance', wealthy: 'pro' }

function oldBandCents(category: GearCategory, background: FamilyBackground): [number, number] {
  if (!LADDERED.includes(category)) {
    const [lo, hi] = gearPriceBandCents(category, background, null)
    return [lo, hi]
  }
  const grade = ANCHOR[background]
  const [lo, hi] = gearPriceBandCents(category, background, grade)
  const f = ECONOMY.equipment.grades[grade].priceFactor
  return [Math.round(lo / f), Math.round(hi / f)]
}

/** The pre-P1 `gearHitsUpTo`, VERBATIM – the same sub-stream, the same two draws per hit, the old
 *  background-keyed band. Walking it here rather than remapping the new arm's drawn value is what
 *  makes §1's working row an exact 0 instead of a rounding artefact. */
function oldHitsUpTo(seed: string, category: GearCategory, background: FamilyBackground, uptoWeek: number): number[] {
  const [cadLo, cadHi] = ECONOMY.gear[category].cadenceWeeks[background]
  const [prLo, prHi] = oldBandCents(category, background)
  const rng = rngFromSeed(`${seed}:gear:${category}`)
  const out: number[] = []
  let w = 0
  while (w <= uptoWeek) {
    w += pickInt(rng, cadLo, cadHi)
    if (w > uptoWeek) break
    out.push(pickInt(rng, prLo, prHi))
  }
  return out
}

/** What one purchase cost BEFORE P1: the mid of the background's band times the rung's factor. */
function oldKitLinePriceCents(background: FamilyBackground, line: KitLine, grade: KitGrade): number {
  const [lo, hi] = oldBandCents(LINE_GEAR_CATEGORY[line], background)
  return Math.round(((lo + hi) / 2) * ECONOMY.equipment.grades[grade].priceFactor)
}

console.log(`
=================================================================================================
 ROUND 41 P1 – ONE MARKET, DIFFERENT BASKETS.  ${SEEDS} seeds x ${HORIZON} weeks per row.
=================================================================================================`)

// =================================================================================================
// §1 – THE DEFAULT BASKET'S WEEKLY GEAR SPEND, OLD vs NEW
// =================================================================================================
console.log(`
§1  DEFAULT-BASKET WEEKLY GEAR SPEND (every career starts on \`composite\`, all three lines)
    A real walk of \`seed:gear:<category>\` – the same draws in both arms, two price rules.
`)
console.log(`  ${padEnd('background', 12)}${pad('old c/wk', 12)}${pad('new c/wk', 12)}${pad('drift c/wk', 13)}${pad('drift/season', 15)}${pad('change', 9)}`)

const perLineDrift: { bg: FamilyBackground; cat: GearCategory; old: number; nw: number }[] = []
for (const bg of BACKGROUNDS) {
  let oldTotal = 0
  let newTotal = 0
  for (const category of GEAR_CATEGORIES) {
    const kitLine = (Object.keys(LINE_GEAR_CATEGORY) as KitLine[]).find((l) => LINE_GEAR_CATEGORY[l] === category)
    const rung = kitLine ? DEFAULT_KIT_GRADES[kitLine] : null
    const [oLo, oHi] = oldBandCents(category, bg)
    const oldFactor = kitLine ? ECONOMY.equipment.grades[rung as KitGrade].priceFactor : 1
    let o = 0
    let n = 0
    void oLo
    void oHi
    for (let s = 0; s < SEEDS; s++) {
      // NEW: the real function, at the rung the career actually stands on.
      for (const hit of gearHitsUpTo(`om-${s}`, category, bg, HORIZON, rung)) n += hit.amountCents
      // OLD: the pre-P1 function, walking the SAME sub-stream with the old band and the old
      // post-draw multiply. Same seed, same draws, same weeks - two price rules, nothing else.
      for (const amount of oldHitsUpTo(`om-${s}`, category, bg, HORIZON)) o += Math.round(amount * oldFactor)
    }
    o /= SEEDS * HORIZON
    n /= SEEDS * HORIZON
    oldTotal += o
    newTotal += n
    perLineDrift.push({ bg, cat: category, old: o, nw: n })
  }
  console.log(
    `  ${padEnd(bg, 12)}${pad(oldTotal.toFixed(1), 12)}${pad(newTotal.toFixed(1), 12)}${pad((newTotal - oldTotal).toFixed(1), 13)}${pad(money(Math.round((newTotal - oldTotal) * WEEKS_PER_YEAR)), 15)}${pad(pct(newTotal, oldTotal), 9)}`,
  )
}

console.log(`
    ...and the same four lines, itemised (cents/week):
`)
console.log(`  ${padEnd('background', 12)}${padEnd('line', 12)}${pad('old', 11)}${pad('new', 11)}${pad('drift', 11)}`)
for (const row of perLineDrift) {
  console.log(
    `  ${padEnd(row.bg, 12)}${padEnd(row.cat, 12)}${pad(row.old.toFixed(1), 11)}${pad(row.nw.toFixed(1), 11)}${pad((row.nw - row.old).toFixed(1), 11)}`,
  )
}

// =================================================================================================
// §2 – THE CROSS-GRADE PRICE TABLE: three prices become one
// =================================================================================================
console.log(`
§2  THE SHOP WINDOW, OLD (3 backgrounds x 4 rungs) vs NEW (1 uniform price per rung)
`)
for (const line of ['frame', 'strings', 'shoes'] as KitLine[]) {
  console.log(`
  ${line.toUpperCase()}`)
  console.log(`  ${padEnd('rung', 14)}${pad('old working', 14)}${pad('old middle', 13)}${pad('old wealthy', 14)}${pad('NEW, all three', 17)}${pad('spread was', 12)}`)
  for (const g of KIT_GRADES) {
    const o = BACKGROUNDS.map((bg) => oldKitLinePriceCents(bg, line, g))
    const n = kitLinePriceCents(line, g)
    console.log(
      `  ${padEnd(g, 14)}${pad(money(o[0]), 14)}${pad(money(o[1]), 13)}${pad(money(o[2]), 14)}${pad(money(n), 17)}${pad(`${(o[2] / o[0]).toFixed(1)}x`, 12)}`,
    )
  }
}

// =================================================================================================
// §3 – THE CORRIDOR FADE: coach + facility + physio, per tier x background
// =================================================================================================
console.log(`
§3  THE SERVICES CORRIDOR, TIER BY TIER – the weekly training bill at the rung's midpoint, age 19,
    balanced plan; and the medical corridor that rides the same rung.
`)
const PLAN = WEEK_PLAN_PRESETS.balanced
const AGE = 19

function oldCoachWeekly(tier: CoachTier, bg: FamilyBackground): number {
  const [lo, hi] = ECONOMY.wealthCorridor[bg]
  const mid = (lo + hi) / 2
  const rate = tier === 'self' ? facilityRateCents(AGE, tier) : (coachRateBandCents(tier, AGE)[0] + coachRateBandCents(tier, AGE)[1]) / 2
  return Math.round(rate * coachHoursForPlan(PLAN) * mid)
}
function newCoachWeekly(tier: CoachTier, bg: FamilyBackground): number {
  const rate = tier === 'self' ? facilityRateCents(AGE, tier) : (coachRateBandCents(tier, AGE)[0] + coachRateBandCents(tier, AGE)[1]) / 2
  return coachWeeklyCents(rate, PLAN, bg, tier)
}

console.log(`  ${padEnd('rung', 10)}${padEnd('corridor?', 11)}${pad('working old', 13)}${pad('new', 12)}${pad('middle old', 13)}${pad('new', 12)}${pad('wealthy old', 13)}${pad('new', 12)}`)
for (const tier of COACH_TIERS) {
  const cells = BACKGROUNDS.flatMap((bg) => [pad(money(oldCoachWeekly(tier, bg)), 13), pad(money(newCoachWeekly(tier, bg)), 12)])
  console.log(`  ${padEnd(tier, 10)}${padEnd(corridorAppliesAt(tier) ? 'kept' : 'UNIFORM', 11)}${cells.join('')}`)
}

console.log(`
    the same rows as a percentage move, and as the spread the family can see:
`)
console.log(`  ${padEnd('rung', 10)}${pad('working', 11)}${pad('middle', 11)}${pad('wealthy', 11)}${pad('old spread', 13)}${pad('new spread', 13)}`)
for (const tier of COACH_TIERS) {
  const o = BACKGROUNDS.map((bg) => oldCoachWeekly(tier, bg))
  const n = BACKGROUNDS.map((bg) => newCoachWeekly(tier, bg))
  console.log(
    `  ${padEnd(tier, 10)}${BACKGROUNDS.map((_, i) => pad(pct(n[i], o[i]), 11)).join('')}${pad(`${(o[2] / o[0]).toFixed(2)}x`, 13)}${pad(`${(n[2] / n[0]).toFixed(2)}x`, 13)}`,
  )
}

console.log(`
    the MEDICAL corridor (physio retainer / rehab / onset) rides the coach rung since P1 – the same
    predicate, so a mid-anchored bill reads:
`)
console.log(`  ${padEnd('rung', 10)}${pad('working', 12)}${pad('middle', 12)}${pad('wealthy', 12)}`)
const RETAINER_MID = (ECONOMY.physio.retainerPerWeekCents[0] + ECONOMY.physio.retainerPerWeekCents[1]) / 2
for (const tier of COACH_TIERS) {
  const cells = BACKGROUNDS.map((bg) => pad(money(Math.round(RETAINER_MID * coachCorridorMid(bg, tier))), 12))
  console.log(`  ${padEnd(tier, 10)}${cells.join('')}`)
}
console.log(`
    ⚠ the MASSEUR is absent from this table because he was never in it: \`ECONOMY.masseur\` is a flat
      contract per rung and \`world/masseur.ts\` bills \`sessions x ${money(ECONOMY.masseur.perSessionCents)}\` with no background
      anywhere on the path. ${ECONOMY.masseur.rungs.map((r) => `${r.label} ${money(r.sessions * ECONOMY.masseur.perSessionCents)}/wk`).join(' · ')} – identical for all three.`)

// =================================================================================================
// §4 – THE ICON ALLOWANCE'S COVERAGE
// =================================================================================================
console.log(`
§4  WHAT THE ${money(ECONOMY.sponsorship.icon.seasonCents)} ICON ALLOWANCE COVERS – a season of the three laddered lines
    (apparel is never covered by a kit deal, so it is out of this table by the terms themselves).
`)
function seasonLadderedCents(bg: FamilyBackground, grade: KitGrade | 'default', useOld: boolean): number {
  let total = 0
  for (const category of LADDERED) {
    const kitLine = (Object.keys(LINE_GEAR_CATEGORY) as KitLine[]).find((l) => LINE_GEAR_CATEGORY[l] === category)!
    const rung = grade === 'default' ? DEFAULT_KIT_GRADES[kitLine] : grade
    const [lo, hi] = useOld ? oldBandCents(category, bg) : gearPriceBandCents(category, bg, rung)
    const factor = useOld ? ECONOMY.equipment.grades[rung].priceFactor : 1
    const [cadLo, cadHi] = ECONOMY.gear[category].cadenceWeeks[bg]
    total += (((lo + hi) / 2) * factor * WEEKS_PER_YEAR) / ((cadLo + cadHi) / 2)
  }
  return Math.round(total)
}
const ICON = ECONOMY.sponsorship.icon.seasonCents
for (const arm of ['pro', 'default'] as const) {
  console.log(`
  AT ${arm === 'pro' ? 'THE PRO RUNG' : 'THE DEFAULTS (composite, every background)'}`)
  console.log(`  ${padEnd('background', 12)}${pad('old season', 14)}${pad('new season', 14)}${pad('old covered', 13)}${pad('new covered', 13)}`)
  for (const bg of BACKGROUNDS) {
    const o = seasonLadderedCents(bg, arm === 'pro' ? 'pro' : 'default', true)
    const n = seasonLadderedCents(bg, arm === 'pro' ? 'pro' : 'default', false)
    console.log(
      `  ${padEnd(bg, 12)}${pad(money(o), 14)}${pad(money(n), 14)}${pad(`${Math.min(100, Math.round((ICON / o) * 100))}%`, 13)}${pad(`${Math.min(100, Math.round((ICON / n) * 100))}%`, 13)}`,
    )
  }
}

console.log(`
=================================================================================================
 Read §1's working row as the identity check: if it is not 0.0 the diagonal was mis-derived.
=================================================================================================
`)
