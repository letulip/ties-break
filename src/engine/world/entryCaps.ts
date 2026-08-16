// THE ANNUAL ENTRY CAPS: the ITF junior allowance, the WTA professional one (AER) – and since P1
// the JUNIOR ACCESS rules, which are the same family of rule from the same two rulebooks.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. The knobs live in ECONOMY.entryCap / ECONOMY.proEntryCap
// with the rest of the tuning; these functions only read them and count the ledger.
import { ECONOMY } from '../economy'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, isWSeriesTier } from '../season/calendar'
import type { EntryCapUsage } from '../../shared/protocol'
import type { TierId } from '../season/types'
import { seasonStartWeek } from './ledger'
import { kidAgeAt } from './age'
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

/** Her allowance for the AGE-YEAR CONTAINING `week`, and how much of it is already spent.
 *
 *  Scoped to the EVENT's window, never to today's, for the same reason `layoffCovering` is scoped
 *  to the event's week (R10-17): a rule about a future event has to be asked about that event's
 *  future, or the December horizon reports next season's fixture against this season's ledger.
 *
 *  ⚠⚠ THE WINDOW IS HER BIRTHDAY YEAR SINCE P2, AND THE ARGUMENT THAT KEPT IT ON THE SEASON BLOCK IS
 *  WORTH KEEPING RATHER THAN DELETING. It ran: "the WINDOW is still the season block – one allowance,
 *  reset at the season boundary, exactly as the copy promises – while the LIMIT is the one for the age
 *  she actually is in the week of that event", and it argued the two were close enough because both
 *  are one year long.
 *
 *  THEY ARE NOT, AND THE LEAK WAS MEASURED BEFORE IT WAS FIXED. A window on the season block with a
 *  limit on her age means every girl not born in the first week of January gets her sixteenth year
 *  STRADDLING TWO ALLOWANCES – the tail of one at twelve and the head of the next at twelve again –
 *  so a birth-year count of up to 28 is reachable. `docs/specs/ladder-baseline-2026-08.md` §3c-bis
 *  measured 18.8 professional events in her sixteenth year against a rulebook 12, and this branch's
 *  own pre-change arm measured 19.0. THE SOURCE IS EXPLICIT AND DISAGREES WITH THE OLD READING:
 *  `docs/research/retirement-and-withdrawal.md` §6 quotes ITF Juniors Appendix F as counted
 *  "birthday-to-birthday, not by calendar year", and the WTA's §X.A.2 rows are the same shape.
 *
 *  ⚠ THE WINDOW IS EXPRESSED AS AN AGE COMPARISON, NOT AS A PAIR OF BOUNDARIES, and that is what
 *  makes it exact. "The rows inside this event's age-year" is `kidAgeAt(row) === kidAgeAt(event)`,
 *  read off the ONE clock (world/age.ts, the ruling of 09.08) that also chooses the limit – so the
 *  window and the limit cannot drift apart the way a second spelling of the boundary would let them.
 *  `ageWindowStartWeek` exists for the prune, which genuinely needs a first week.
 *
 *  ⚠ AND THE TWO PROPERTIES THE OLD COMMENT PROTECTED BOTH SURVIVE, ONE OF THEM STRENGTHENED:
 *    * INSIDE a window the limit is now CONSTANT rather than merely non-decreasing – the age is the
 *      same in every week of it – so an entry she was allowed to make can never be retro-invalidated
 *      by asking about a later event in the same window;
 *    * ACROSS windows the limit is still non-decreasing, because the table is monotone in the age.
 *  What used to be "the limit rises on her birthday, on the same ledger" is now "the limit rises on
 *  her birthday AND the ledger turns over with it", which is the rule the sport actually writes. */
export function entryCapUsage(world: WorldState, week: number): EntryCapUsage {
  const age = kidAgeAt(world, week)
  const used = world.internationalEntryWeeks.filter((w) => kidAgeAt(world, w) === age).length
  const limit = annualEntryLimit(age)
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

/** How many PROFESSIONAL events she may enter in the season she is `ageYears` old. 14 -> 8, 15 -> 10,
 *  16 -> 12, 17 -> 16, 18+ unlimited - the rulebook's own rows, and 14/15 are in the table since the
 *  09.08 ruling rather than being left to `default` (see the knob's note in economy.ts). */
export function annualProEntryLimit(ageYears: number): number {
  const table = ECONOMY.entryCap.proPerYearByAge
  return table[ageYears] ?? table.default
}

/** Her PRO allowance for the AGE-YEAR CONTAINING `week`, and how much is spent - `entryCapUsage`'s
 *  birthday window verbatim, over the pro ledger. Scoped to the EVENT's window for the same
 *  December-horizon reason, and read off HER age for the same 09.08 reason.
 *
 *  ⚠ THIS IS THE LEDGER THE LEAK WAS MEASURED ON. The WTA's §X.A.2 rows are a BIRTH-YEAR count, so
 *  the straddle described at length on `entryCapUsage` was worth 19.0 professional events in her
 *  sixteenth year against a rulebook 12 – the single biggest measured contributor to «слишком
 *  быстро» anywhere in `docs/plans/college-and-the-junior-ladder.md`. */
export function proEntryCapUsage(world: WorldState, week: number): EntryCapUsage {
  const age = kidAgeAt(world, week)
  const used = world.proEntryWeeks.filter((w) => kidAgeAt(world, w) === age).length
  const limit = annualProEntryLimit(age)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

// =================================================================================================
// JUNIOR ACCESS (P1, docs/specs/junior-access-2026-08.md) – how a JUNIOR gets onto the professional
// ladder at all, which in the real sport is a completely different question from how an adult does.
//
// ⚠⚠ THE ONE-SENTENCE VERSION, AND IT IS WHY THIS EXISTS: **there are no junior-reserved places at
// W35 and above.** The only two formal routes a junior has into a women's main draw are (2026 WTT
// Regulations, quoted in docs/research/ranking-points-by-tier.md §4):
//
//   * **Junior Reserved places** (§VII.A Method E) – at **W15 events only**, up to three main-draw
//     places for a player with an ITF COMBINED JUNIOR RANKING of 1-100 who could not get in any
//     other way, and who has turned 14. This is the literal junior->pro door.
//   * **the Junior Accelerator** (App. D / juniors App. M) – the girls' **year-end junior top 20**
//     get direct main-draw entry into a COUNTED NUMBER of designated women's events, by a table that
//     tops out at W100. One place per tournament.
//
// Everything else at W35+ is direct acceptance on a WTA ranking, qualifying, or a wildcard.
//
// ⚠ SO THE ACCELERATOR IS MODELLED AS A JUNIOR'S CEILING, NOT AS AN EXTRA DOOR, and that choice is
// the whole finding rather than an implementation detail. Read as an extra door it would be an OR
// beside the acceptance cut and would change NOTHING: our W table hands a junior a professional
// ranking cheaply enough that the cut never binds (measured baseline: 93% of careers enter a W75,
// first admission at age 17.2 at rank #279). The real brake on a real seventeen-year-old is that the
// direct-acceptance list is made of rankings built by playing W15s under an age cap she cannot
// exceed – two rules this game does not have yet (P2) and one cut that is measurably too loose (P3).
// Until those land, the honest model of "a junior cannot reach a W75 unless she is world top 5" is a
// ceiling. See the spec's §"what this deliberately does not model".
//
// ⚠ AND AN ADULT ENTRANT IS UNTOUCHED. Every function here is asked only about a player inside
// junior eligibility (`isJuniorAge`); the day she ages out of the junior tour she enters on her
// professional ranking exactly as she does today. The Accelerator is a junior's route, not a
// professional's ceiling.
//
// Pure, zero draws on any stream – an access rule is a post-draw gate, so the frozen MAIN capture
// (41550 / e6b0c709) cannot see any of this.

/** ONE POOL OF THE ACCELERATOR'S ALLOWANCE: `count` main-draw entries usable at any W rung AT OR
 *  BELOW `upTo`. The regulation's own phrasing – "3 tournaments up to W100, 2 up to W75" – is two
 *  pools, not a per-rung table, and the difference is real: #1's three W100 places may be spent at a
 *  W35 instead, and her two W75 places may not be spent at a W100. */
export interface AcceleratorPool {
  upTo: TierId
  count: number
}

/** ONE ROW OF THE TABLE: everything from the previous row's ceiling up to and including `throughRank`
 *  gets these pools. Rows are read in order, first match wins. */
export interface AcceleratorRow {
  throughRank: number
  pools: readonly AcceleratorPool[]
}

/** THE ACCELERATOR TABLE, GIRLS (2026 WTT Regs App. D), keyed on YEAR-END junior rank.
 *
 *  ⚠ A PLAIN MUTABLE OBJECT, NOT A BARE `const`, DELIBERATELY – the same idiom and the same reason
 *  as `BEST_N_BY_TRACK` and `ON_RAMP`: `tools/junior-access.ts` swaps the table for a permissive one
 *  to run the A/B arm and puts it back, so the size of the change is measured rather than argued
 *  about. Engine code never writes it.
 *
 *  ⚠ THE TWO GRAND-SLAM CLAUSES ARE NOT MODELLED AND THAT IS A SCOPE STATEMENT, NOT AN OVERSIGHT.
 *  The real rows read "3 / junior GS winner" and "4-5 / junior GS runner-up"; this game has no junior
 *  Grand Slam (the J family is J30/J60/J300), so there is no such result to read. The day a junior
 *  major exists, it belongs in this table and nowhere else. */
export const ACCELERATOR: { rows: readonly AcceleratorRow[] } = {
  rows: [
    { throughRank: 1, pools: [{ upTo: 'w100', count: 3 }, { upTo: 'w75', count: 2 }] },
    { throughRank: 2, pools: [{ upTo: 'w100', count: 2 }, { upTo: 'w75', count: 3 }] },
    { throughRank: 3, pools: [{ upTo: 'w100', count: 1 }, { upTo: 'w75', count: 2 }, { upTo: 'w50', count: 2 }] },
    { throughRank: 5, pools: [{ upTo: 'w75', count: 2 }, { upTo: 'w50', count: 3 }] },
    { throughRank: 10, pools: [{ upTo: 'w50', count: 2 }, { upTo: 'w35', count: 3 }] },
    { throughRank: 20, pools: [{ upTo: 'w50', count: 1 }, { upTo: 'w35', count: 4 }] },
    // 21+ : nothing above W15. The W15 door below is the whole of her professional access.
    { throughRank: Number.MAX_SAFE_INTEGER, pools: [] },
  ],
}

/** THE JUNIOR-RESERVED DOOR AT W15, as an ITF junior RANK on the table she is standing in.
 *
 *  ⚠ A RANK AND NOT A POINT TOTAL, AND THAT IS THE CORRECTION. W15's `enterPointBand` of
 *  `[120, MAX]` ITF junior points is OUR OWN INVENTION – the rung's own comment says what 120 buys
 *  ("a J60 title, or a J300 quarter-final, or a full book of J30 results") and it is a perfectly
 *  sensible number, but it is not the rule. The rule reads a RANKING: combined junior 1-100.
 *
 *  ⚠ AND THE NUMBER IS A SHARE OF OUR OWN TABLE, NOT THE REGULATION'S 100, for the reason
 *  `TierDef.enterPct` spells out at length: the ITF table here is a POPULATION ARTEFACT – 199 juniors
 *  plus the kid, with no external anchor – so "top 100" of the real combined list (thousands of
 *  players) and "top 100" of ours are not the same rule, and copying the count across would be the
 *  time bomb that field's warning is about. This is the fraction of the table, resolved against its
 *  live size by `juniorReservedRank` below.
 *
 *  ⚠ THE FRACTION IS CHOSEN TO HOLD TODAY'S DIFFICULTY, NOT TO RETUNE IT – see the spec's
 *  predicted-vs-measured. Step 1 is a change of UNIT on this door and a change of RULE above it; if
 *  the door had been quietly loosened at the same time, the slowdown the wave exists to measure would
 *  have been two effects with one number on them. Mutable for the same A/B reason as the table above. */
export const JUNIOR_RESERVED = { rankPct: 0.15 }

/** Her W15 door as an absolute position on the ITF table, for a table of `tableSize` rows. */
export function juniorReservedRank(tableSize: number): number {
  return Math.max(1, Math.round(JUNIOR_RESERVED.rankPct * tableSize))
}

/** Which row of the table a year-end junior rank falls in. `null` in = the 21+ row: a player with no
 *  year-end junior ranking at all has no Accelerator allowance, which is the honest reading of a
 *  rule that keys on a list she is not on. */
export function acceleratorRowFor(yearEndJuniorRank: number | null): AcceleratorRow {
  const rank = yearEndJuniorRank ?? Number.MAX_SAFE_INTEGER
  return ACCELERATOR.rows.find((r) => rank <= r.throughRank) ?? { throughRank: Number.MAX_SAFE_INTEGER, pools: [] }
}

/** HOW MANY ACCELERATOR ENTRIES MAY SIT AT `tier` OR ABOVE – the capacity half of the feasibility
 *  test below. A pool serves a rung at or below its own ceiling, so the pools that can hold an entry
 *  at rung L or higher are exactly those whose ceiling is L or higher. */
export function acceleratorCapacityAtOrAbove(row: AcceleratorRow, tier: TierId): number {
  const at = TIER_LADDER.indexOf(tier)
  let total = 0
  for (const p of row.pools) if (TIER_LADDER.indexOf(p.upTo) >= at) total += p.count
  return total
}

/** WHAT SHE HAS ALREADY SPENT THIS SEASON, per W rung.
 *
 *  ⚠ IT IS FOLDED OFF `seasonEntries`, AND THAT IS THE ONE LEDGER THAT CAN ANSWER IT. The three
 *  obvious sources cannot:
 *    * `world.results` is AWARD-ONLY for the kid (`finalizeTournament` writes it `if (points > 0)`),
 *      so a first-round W35 exit leaves no row – and those are precisely the entries an allowance
 *      counts. This is `internationalEntryWeeks`' own argument, verbatim.
 *    * `world.proEntryWeeks` counts the right entries but keeps only their WEEK, and the Accelerator
 *      is per-RUNG. Widening it to carry a tier is a save-schema change – three-part move – for a
 *      fact another persisted ledger already holds.
 *    * `world.entries` is pruned to FUTURE events by `ensureSeason`, so a played entry disappears the
 *      week it is played.
 *  `world.seasonEntries` (v45) holds one row per entry committed this season and not refunded, it is
 *  reset by the wrap-up at the season boundary, and it obeys exactly the rule an allowance wants: a
 *  refunding withdrawal hands the slot back, every forfeiting exit keeps it.
 *
 *  ⚠ THE TIER COMES OUT OF THE ROW'S EVENT ID, which is `${year}-w${week}-${tier}` (calendar.ts's
 *  `makeEvent`) – matched as a whole trailing segment against the catalogue, never parsed by hand, so
 *  `w15` cannot be read out of `wta125` and a renamed tier is a compile error rather than a silent
 *  zero. `SeasonEntryRow` carries `track` and not `tier`, and widening it is the same schema change
 *  the paragraph above declines.
 *
 *  ⚠ A LEDGER THAT STARTED MID-SEASON UNDER-COUNTS, which is the generous direction and is stated
 *  rather than hidden: `SeasonEntryLedger.fromWeek` exists precisely because a migrated save's first
 *  ledger describes part of a season. It self-corrects at the first wrap-up. */
export function seasonWEntriesByTier(world: WorldState, week: number): Partial<Record<TierId, number>> {
  const counts: Partial<Record<TierId, number>> = {}
  const ledger = world.seasonEntries
  if (!ledger) return counts
  const from = seasonStartWeek(week)
  // The ledger is already scoped to one season by the wrap-up's reset; `fromWeek` is checked so a
  // stale ledger (a save loaded across a boundary before the wrap ran) cannot be read as this year's.
  if (ledger.fromWeek >= from + WEEKS_PER_YEAR) return counts
  for (const r of ledger.rows) {
    if (r.track !== 'wta') continue
    const tier = TIER_LADDER.find((t) => r.id.endsWith(`-${t}`))
    if (!tier || !isWSeriesTier(tier)) continue
    counts[tier] = (counts[tier] ?? 0) + 1
  }
  return counts
}

/** HER ACCELERATOR ALLOWANCE AT ONE RUNG, and how much of it is gone – `entryCapUsage`'s shape, so
 *  every allowance in this file reads the same way and a surface can print any of them. */
export function acceleratorUsage(world: WorldState, week: number, tier: TierId, yearEndJuniorRank: number | null): EntryCapUsage {
  const row = acceleratorRowFor(yearEndJuniorRank)
  const spent = seasonWEntriesByTier(world, week)
  const at = TIER_LADDER.indexOf(tier)
  let used = 0
  for (const t of TIER_LADDER) if (TIER_LADDER.indexOf(t) >= at) used += spent[t] ?? 0
  const limit = acceleratorCapacityAtOrAbove(row, tier)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

/** MAY A JUNIOR ENTER THIS RUNG THIS SEASON? The Accelerator's whole verdict.
 *
 *  ⚠ IT IS A FEASIBILITY TEST OVER POOLS, NOT A PER-RUNG COUNTER, because the allowance is written as
 *  pools with ceilings and a per-rung counter cannot represent one. Adding an entry at rung R is
 *  possible exactly when, for EVERY W rung L at or below R, the entries already sitting at L-or-above
 *  plus this one still fit in the capacity that can serve L-or-above. (That is Hall's condition on a
 *  bipartite matching whose one side is nested intervals, so checking the prefixes is exact rather
 *  than a heuristic.) Worked: #1 holds {W100 x3, W75 x2}, so she may play at most three W100s, at
 *  most five events at W75-or-above, and at most five above W15 in total – which is what the two
 *  lines of the regulation say and what no single counter can say at once.
 *
 *  W15 is not the Accelerator's business (it has its own reserved-place door) and neither is any rung
 *  off the W series – see `W_SERIES` for why a WTA 125 and a major are deliberately left alone. */
export function acceleratorAdmits(world: WorldState, week: number, tier: TierId, yearEndJuniorRank: number | null): boolean {
  if (!isWSeriesTier(tier) || tier === 'w15') return true
  const row = acceleratorRowFor(yearEndJuniorRank)
  const spent = seasonWEntriesByTier(world, week)
  const at = TIER_LADDER.indexOf(tier)
  for (const level of TIER_LADDER) {
    const li = TIER_LADDER.indexOf(level)
    if (li > at || !isWSeriesTier(level) || level === 'w15') continue
    let used = 0
    for (const t of TIER_LADDER) if (TIER_LADDER.indexOf(t) >= li) used += spent[t] ?? 0
    if (used + 1 > acceleratorCapacityAtOrAbove(row, level)) return false
  }
  return true
}

/** The label a refusal carries, so the calendar's verdict and the turnstile's say the same sentence.
 *  It names the rule and the standing behind it – the transparency clause the pro cap already obeys
 *  («the refusal names the rule»): a parent must be able to see that this is the junior programme and
 *  what her place on it is, not merely that the door is shut. */
export function acceleratorRefusalDetail(tier: TierId, yearEndJuniorRank: number | null, usage: EntryCapUsage): string {
  const standing = yearEndJuniorRank === null ? 'no year-end junior ranking' : `year-end junior #${yearEndJuniorRank}`
  if (usage.limit <= 0) {
    return `${TIERS[tier].label} holds no junior places – ${standing}. The junior programme reaches W15 for her.`
  }
  return `Junior programme – ${usage.used} of ${usage.limit} places at ${TIERS[tier].label} or above used (${standing}). A fresh allowance next season.`
}
