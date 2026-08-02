// THE ANNUAL ENTRY CAPS: the ITF junior allowance and the WTA professional one (AER).
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. The knobs live in ECONOMY.entryCap / ECONOMY.proEntryCap
// with the rest of the tuning; these functions only read them and count the ledger.
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { EntryCapUsage } from '../../shared/protocol'
import type { TierId } from '../season/types'
import { seasonStartWeek } from './ledger'
import { ageAtWeek } from './age'
import type { WorldState } from '../world'

// --- the ITF annual entry cap (docs/research/ranking-points-by-tier.md §2) --------------------
// The knob (the per-age table and the tier set) lives in ECONOMY.entryCap with the rest of the
// tuning surface; everything below is logic that reads it, so the numbers can be retuned without
// touching a line of this file. All three helpers are pure and draw ZERO RNG on any stream – an
// entry rule is a post-draw gate, so the frozen MAIN capture cannot move.

/** Is this tier one the ITF counts? Only the international rungs; the domestic ladder is ours. */
export function isCappedTier(tier: TierId): boolean {
  return ECONOMY.entryCap.cappedTiers.includes(tier)
}

/** How many international events she may enter in the season she is `ageYears` old.
 *  MAX_SAFE_INTEGER = unrestricted (17+), the same "no ceiling" sentinel `enterPointBand` uses. */
export function annualEntryLimit(ageYears: number): number {
  const table = ECONOMY.entryCap.perYearByAge
  return table[ageYears] ?? table.default
}

/** Her allowance for the season CONTAINING `week`, and how much of it is already spent.
 *
 *  Scoped to the EVENT's season, never to today's, for the same reason `layoffCovering` is scoped
 *  to the event's week (R10-17): a rule about a future event has to be asked about that event's
 *  future, or the December horizon reports next season's fixture against this season's ledger.
 *  "This season" is `seasonStartWeek` – THE definition the round-11 money accounting introduced
 *  and the wrap-up shares (R11-12a) – rather than a second spelling of the same arithmetic.
 *
 *  Age and season are the same boundary here: `ageAtWeek` is START_AGE_YEARS + floor(week/52) and
 *  `seasonStartWeek` is floor(week/52)*52, so our season block IS the real rule's birthday year. */
export function entryCapUsage(world: WorldState, week: number): EntryCapUsage {
  const from = seasonStartWeek(week)
  const used = world.internationalEntryWeeks.filter((w) => w >= from && w < from + WEEKS_PER_YEAR).length
  const limit = annualEntryLimit(ageAtWeek(week))
  return { used, limit, remaining: Math.max(0, limit - used) }
}

// --- the WTA age-eligibility rule, the PRO cap (W2-LADDER §5) ---------------------------------
// The junior trio above, mirrored one table up and never merged with it: the real rules are two
// rules ("separate from and additional to", research §4), so the game keeps two families
// (ECONOMY.entryCap.cappedTiers / .cappedProTiers), two age tables, two ledgers. Same discipline:
// pure, zero draws on any stream, the knobs in ECONOMY, only logic here.

/** Is this tier one the WTA's age rule counts? The W family; the domestic ladder stays ours. */
export function isCappedProTier(tier: TierId): boolean {
  return ECONOMY.entryCap.cappedProTiers.includes(tier)
}

/** How many PROFESSIONAL events she may enter in the season she is `ageYears` old. 16 -> 12,
 *  17 -> 16, 18+ unlimited; 14/15 never reach this table because every W rung's `minAgeYears` is
 *  16+ and the age gate refuses first (see the knob's note in economy.ts). */
export function annualProEntryLimit(ageYears: number): number {
  const table = ECONOMY.entryCap.proPerYearByAge
  return table[ageYears] ?? table.default
}

/** Her PRO allowance for the season CONTAINING `week`, and how much is spent - `entryCapUsage`'s
 *  season-block arithmetic verbatim, over the pro ledger. Scoped to the EVENT's season for the
 *  same December-horizon reason (see entryCapUsage). */
export function proEntryCapUsage(world: WorldState, week: number): EntryCapUsage {
  const from = seasonStartWeek(week)
  const used = world.proEntryWeeks.filter((w) => w >= from && w < from + WEEKS_PER_YEAR).length
  const limit = annualProEntryLimit(ageAtWeek(week))
  return { used, limit, remaining: Math.max(0, limit - used) }
}
