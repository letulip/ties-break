// =================================================================================================
// P2 ITEM 4 – DOES THE COHORT NEED THE AGE-ELIGIBILITY RULE TOO?
// =================================================================================================
//
// THE PLAN'S OWN WARNING (docs/plans/college-and-the-junior-ladder.md §P2): «⚠ THE COHORT NEEDS IT
// TOO, or the field she meets is playing a different sport. `rival.ts` and the conveyor build AI
// seasons; if only the kid is capped she is uniquely handicapped. Check what the cohort does today
// before deciding – this may be the larger half of the work.»
//
// ⭐ IT WAS CHECKED, AND THE ANSWER IS THAT THE COHORT IS ALREADY INSIDE THE RULE – measured, 0 of
// 312 player-seasons over the AER row for that player's age (`npx vite-node tools/aer-cohort.ts`,
// 3 careers x 312 weeks; the table is in docs/specs/age-eligibility-window-2026-08.md §4). So the
// larger half of the work turned out to be a MEASUREMENT rather than a build, and what ships is this
// guard: the property is structural, and a structural property that nothing watches is a property
// that will stop being true.
//
// WHY IT IS STRUCTURAL, in one paragraph. A W draw's universe is `universeForTier` = the live cohort
// PLUS the field pros (season/fieldPros.ts), and the pros are derived adults who carry no persisted
// row and no age rule at all. A live junior reaches a professional draw through `selectEntrants`'
// bands – where a player with no W points sits at the back of the merged table – and through
// `fillOnRamp`, which holds `ON_RAMP.slots` (two of thirty-two) per event behind the RUNG'S OWN
// acceptance door. Neither route can hand one player a season: the slots are shared across 199
// people, and the band is a percentile of a table she is at the bottom of.
//
// ⚠ AND THE ASYMMETRY RUNS THE OTHER WAY FROM THE PLAN'S FEAR. Before P2 the kid played 19.0
// professional events in her sixteenth year against the cohort's mean 3.0 – she was not handicapped
// by the cap, she was six times outside it. After P2 she plays 10.8 against their 3.0. The rule
// brings her TOWARDS the field, not away from it.
import { describe, expect, it } from 'vitest'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from '../tools/econ-bench'
import { KID_ID, annualProEntryLimit, isCappedProTier } from '../src/engine/world'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { AiPlayer } from '../src/engine/season/types'

interface Season {
  playerId: string
  ageYears: number
  entries: number
}

/** Every (cohort player, season) pair of one career, with the professional draws she entered in the
 *  trailing 52 weeks. `world.results` holds one row per ENTRANT per draw for every live player since
 *  the rival-life slice, and is pruned to 52 weeks – so a fold at a season's end IS her year. */
function cohortSeasons(seed: number, weeks: number): { rows: Season[]; kid: Season[]; kidLedger: number } {
  const { world, rng } = openCareer(PRESETS[seed % PRESETS.length], 0, POLICIES[1])
  const rows: Season[] = []
  const kid: Season[] = []
  const kidWeeks = new Set<number>()
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(world, rng, POLICIES[1])
    // Her professional entries come off her OWN ledger, harvested weekly because it prunes.
    for (const week of world.proEntryWeeks) kidWeeks.add(week)
    if ((world.week + 1) % WEEKS_PER_YEAR !== 0 || world.week < WEEKS_PER_YEAR) continue
    const ageOf = new Map<string, number>()
    for (const p of world.cohort as AiPlayer[]) ageOf.set(p.id, p.ageYears)
    const counts = new Map<string, number>()
    for (const r of world.results) {
      if (!isCappedProTier(r.tier ?? 'local')) continue
      counts.set(r.playerId, (counts.get(r.playerId) ?? 0) + 1)
    }
    for (const [playerId, entries] of counts) {
      if (playerId === KID_ID) {
        kid.push({ playerId, ageYears: 0, entries })
        continue
      }
      const ageYears = ageOf.get(playerId)
      if (ageYears !== undefined) rows.push({ playerId, ageYears, entries })
    }
  }
  return { rows, kid, kidLedger: kidWeeks.size }
}

describe('P2 item 4 — the cohort is already inside the age-eligibility rule', () => {
  const { rows, kid, kidLedger } = cohortSeasons(0, 3 * WEEKS_PER_YEAR)

  it('is not vacuous: cohort players really do play professional tennis', () => {
    expect(rows.length, 'player-seasons measured').toBeGreaterThan(20)
    expect(rows.some((r) => r.entries > 0), 'somebody entered a W draw').toBe(true)
    // ⚠ THE KID IS COUNTED OFF HER OWN LEDGER AND NOT OFF `results`, and the reason is P1's own:
    // `world.results` is AWARD-ONLY for her (`finalizeTournament` writes it `if (points > 0)`), so a
    // first-round exit leaves no row. The fold above is honest for a RIVAL – `runAiTournament` writes
    // a row for every entrant – and silent for her, which is exactly why both entry ledgers exist.
    expect(kid.length + kidLedger, 'and the kid played some too, for scale').toBeGreaterThan(0)
  })

  it('⭐ NO LIVE PLAYER EXCEEDS THE AER ROW FOR HER OWN AGE – and since 19.08 that is ENFORCED, not lucky', () => {
    // ⚠ THE BOUND IS THE ENGINE'S OWN TABLE, never a copied number, so a phase that retunes
    // `proPerYearByAge` re-measures this claim instead of silently outliving it.
    //
    // ⚠⚠ THIS ARM USED TO PASS BY LUCK AND NOW PASSES BY RULE, and the history is the point. The
    // file's own header records the original finding: the cohort was INSIDE the AER without being
    // subject to it, because no rival had ever been drawn into more events than her row allows. That
    // was an asymmetry - the rule was enforced on exactly one person in the world, the kid - and it
    // held only as long as draw composition did.
    //
    // The live professional table (v53) ended it. A field pro's standing moves with her results, the
    // merged table moves with her, `selectEntrants` draws from a different order, and this arm went
    // RED on `ai-177 at 14: 10 > 8` - a fourteen-year-old in ten capped draws against a rulebook row
    // of eight. The owner ruled the rule rather than a wider guard: «да, это как раз защитит нас от
    // 16 летних в топ-10». `withinAnnualEntryLimit` (world/entryCaps.ts) now gates the DRAW'S
    // UNIVERSE on both call sites, so what this arm asserts is enforced upstream of it.
    const over = rows.filter((r) => r.entries > annualProEntryLimit(r.ageYears))
    expect(
      over.map((r) => `${r.playerId} at ${r.ageYears}: ${r.entries} > ${annualProEntryLimit(r.ageYears)}`),
      'a capped-age rival playing more than the rule allows – the field gate is not holding',
    ).toEqual([])
  })

  it('⚠ THE INTERACTION GUARD: nobody plays a rung her age has not opened', () => {
    // This is the line item 6 moves. `w15.minAgeYears` went 16 -> 14 on the owner's ruling of 16.08,
    // which widens who may appear in a W15 draw – and if that let fourteen-year-old rivals play a
    // full W15 season the answer above would change. Derived from the catalogue, so the claim
    // survives the constant moving and re-measures instead of breaking.
    const youngest = Math.min(...TIER_LADDER.filter(isCappedProTier).map((t) => TIERS[t].minAgeYears ?? 0))
    for (const r of rows) expect(r.ageYears, `a ${r.ageYears}-year-old in a professional draw`).toBeGreaterThanOrEqual(youngest)
  })
})
