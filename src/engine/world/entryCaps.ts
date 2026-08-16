// THE ANNUAL ENTRY CAPS: the ITF junior allowance, the WTA professional one (AER) – and since P1
// the JUNIOR ACCESS rules, which are the same family of rule from the same two rulebooks.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. The knobs live in ECONOMY.entryCap / ECONOMY.proEntryCap
// with the rest of the tuning; these functions only read them and count the ledger.
import { ECONOMY } from '../economy'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, isWSeriesTier } from '../season/calendar'
import type { EntryCapUsage, SeasonHistoryEntry } from '../../shared/protocol'
import type { TierId } from '../season/types'
import { seasonIndexOf, seasonStartWeek } from './ledger'
import { ageWindowStartWeek, kidAgeAt } from './age'
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
  // The same MAX_SAFE_INTEGER guard the pro arm carries and for the same reason – see there. It
  // cannot fire at the shipped knob (no merit row exists above 15, and 15's limit is 18), and it is
  // here so that adding one later is a tuning change rather than a broken sentinel.
  const base = annualEntryLimit(age)
  const limit = base >= Number.MAX_SAFE_INTEGER ? base : base + juniorMerit(world, week, age)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

// --- THE MERITED INCREASES (P2, docs/specs/age-eligibility-window-2026-08.md) -------------------
//
// ⚠⚠ THE ONE PROPERTY THAT SHAPES BOTH ARMS: A BONUS MAY NEVER FALL INSIDE A WINDOW. The limit is
// what refuses an entry, so a bonus that could evaporate mid-year would retro-invalidate an entry
// she was ALLOWED to make – and worse, `tierOutgrown` (world/ladder.ts) reads `remaining <= 0` to
// re-open the rungs below her, so an oscillating limit would flicker the whole ladder on and off.
// The old comment on `entryCapUsage` made non-decrease the headline property of the age table; this
// is the same property, defended for an addition rather than for a lookup.
//
// SO BOTH ARMS READ A YEAR-END ROW AND NEVER A LIVE RANK, and they take THE BEST OF THE ROWS CURRENT
// AT ANY POINT IN THE WINDOW. An age year straddles at most one season boundary, so that is at most
// two rows; taking the best of them is monotone in the week by construction (a row can only be
// added, never withdrawn), it resets with the window, and it lands on the same generous side the age
// table already sits on – the limit rises on her birthday and rises again when a season she finished
// well closes inside her birth year. A live `world.kidRank` would have been none of those things.
//
// ⚠ AND IT IS THE SAME READ P1 BUILT, DELIBERATELY. `yearEndJuniorRank` and the absolute rows the
// Accelerator keys on are the decision this game has already taken about what a year-end standing
// means (ECONOMY.entryCap.meritIncrease carries the argument). A second mapping here – a share of
// the table, say – would be two answers to one question in two files.

/** The year-end rows current at some week of the age year containing `week`: the one current when the
 *  window opened, plus any season that closed inside it. At most two, in banked order. */
function rowsAcrossWindow(world: WorldState, week: number): (SeasonHistoryEntry | undefined)[] {
  const from = ageWindowStartWeek(world, week)
  const out: (SeasonHistoryEntry | undefined)[] = [rowCurrentAt(world, from)]
  for (const row of world.seasonHistory) {
    if (row.seasonIndex >= seasonIndexOf(from) && row.seasonIndex < seasonIndexOf(week)) out.push(row)
  }
  return out
}

/** Her BEST year-end junior place anywhere in an ALREADY-GATHERED window, or null if she was on no
 *  list in it. Split from `bestJuniorRankInWindow` so a caller that needs the rows for something else
 *  does not gather them twice – see `proMerit`, which needed both halves and was paying two walks. */
function bestJuniorRankOf(rows: (SeasonHistoryEntry | undefined)[]): number | null {
  let best: number | null = null
  for (const row of rows) {
    const rank = juniorRankOf(row)
    if (rank !== null && (best === null || rank < best)) best = rank
  }
  return best
}

export function bestJuniorRankInWindow(world: WorldState, week: number): number | null {
  return bestJuniorRankOf(rowsAcrossWindow(world, week))
}

/** THE ITF MERIT INCREASE: +4 international events to a top-50 junior at 13, to a top-20 at 14 and
 *  15 (Appendix F). Zero at every other age, and zero for a girl on no year-end list. */
export function juniorMerit(world: WorldState, week: number, ageYears: number): number {
  const row = ECONOMY.entryCap.meritIncrease.juniorByAge[ageYears]
  if (!row) return 0
  const rank = bestJuniorRankInWindow(world, week)
  return rank !== null && rank <= row.throughRank ? row.extra : 0
}

/** THE PRO MERIT INCREASE: up to 4 extra professional events a year, earned by Grand Slam / WTA 1000
 *  DIRECT ACCEPTANCE **or** by year-end ITF junior top 5.
 *
 *  ⚠ "DIRECT ACCEPTANCE" IS THE RUNG'S OWN ACCEPTANCE CUT, READ OFF THE YEAR-END TABLE, and both
 *  halves of that sentence are decisions. The cut is `TIERS[t].acceptsRank` for the tiers the knob
 *  names, never a copied number, so a phase that re-tunes those lists moves this rule with them. The
 *  TABLE is the banked year-end one for the same non-decrease reason as the junior arm: a girl who
 *  slipped out of the majors' list in March would otherwise lose four entries she had already been
 *  granted, in the middle of the year they belong to.
 *
 *  ⚠ IT IS AN OR AND NOT A SUM. The rulebook grants "up to 4 Merited Increases", not four per route. */
export function proMerit(world: WorldState, week: number): number {
  const knob = ECONOMY.entryCap.meritIncrease
  // ⚠ ONE WALK, NOT TWO (16.08). Both arms read the same at-most-two rows, and gathering them costs a
  // backward scan of a year of weeks through the age clock – so asking twice doubled the hot path for
  // an answer that cannot differ between the two calls.
  const rows = rowsAcrossWindow(world, week)
  const junior = bestJuniorRankOf(rows)
  if (junior !== null && junior <= knob.proJuniorThroughRank) return knob.proExtra
  let cut = 0
  for (const tier of knob.proDirectTiers) cut = Math.max(cut, TIERS[tier].acceptsRank ?? 0)
  if (cut <= 0) return 0
  for (const row of rows) {
    const wta = yearEndWtaRankOf(row)
    if (wta !== null && wta <= cut) return knob.proExtra
  }
  return 0
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
  const base = annualProEntryLimit(age)
  // ⚠ A MERIT INCREASE ON AN UNLIMITED ROW IS STILL UNLIMITED, and the guard is arithmetic rather
  // than taste: `default` is MAX_SAFE_INTEGER and the protocol spells "no ceiling" as exactly that,
  // so adding four to it would overflow the sentinel and every surface that tests `limit >= MAX`
  // would start printing a denominator for an eighteen-year-old.
  const limit = base >= Number.MAX_SAFE_INTEGER ? base : base + proMerit(world, week)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

/** HER YEAR-END ITF JUNIOR RANKING – the standing the Accelerator keys on, and the reason it is a
 *  read of PERSISTED HISTORY rather than a live fold.
 *
 *  ⚠ THE RULE SAYS "YEAR-END", AND THAT IS NOT A DETAIL. `world.kidRank` is her position TODAY; the
 *  Accelerator grants a season's allowance off where she finished LAST season, which is a fact that
 *  stops moving on the day the season closes. Reading the live rank instead would hand her a W75
 *  place in the same week she climbed into the junior top five and take it away again the week she
 *  slipped out – an allowance that flickers is not an allowance, and a player could not plan a season
 *  around one.
 *
 *  ⚠ NOTHING NEW IS PERSISTED FOR IT. The wrap-up has banked exactly this number since v14
 *  (`SeasonHistoryEntry.endRank` – *"⚠ THE ITF ONE, always"*) and since v46 it also banks the
 *  per-table row, whose `endRank` is ABSENT when she held no counting ITF result at all. Prefer the
 *  v46 row where it exists, because "absent" is the honest reading of unranked and the flat field's
 *  fallback (`tableSize`) is a number that would print as a place; fall back to the flat field for
 *  the rows banked before v46, where it is the only figure there is.
 *
 *  `null` = SHE HAS NO YEAR-END JUNIOR RANKING – either because no season has closed yet (every
 *  fourteen-year-old, for her first year) or because she held no counting ITF result in the one that
 *  did. Both are the same answer to the rule's own question: she is not on the list it reads.
 *
 *  ⚠ `week` IS OPTIONAL AND ADDITIVE (P2). Omitted, this is the function P1 shipped, to the letter:
 *  the newest banked row. Given, it is the row current in THAT week – which a rule about a future
 *  event has to ask for, on `entryCapUsage`'s own R10-17 rule. No existing caller passes it. */
export function yearEndJuniorRank(world: WorldState, week?: number): number | null {
  return juniorRankOf(rowCurrentAt(world, week))
}

/** The season-history row that is CURRENT at `week` – the last season to have closed before it. With
 *  no week (every pre-P2 caller) it is simply the newest row, which is what "current" means today.
 *
 *  ⚠ IT EXISTS FOR THE MERIT INCREASES AND FOR NOTHING ELSE YET. An allowance is a rule about a
 *  YEAR, so a bonus attached to it has to be answerable about a week inside that year rather than
 *  about the week the question happens to be asked in – the same R10-17 rule the caps themselves
 *  obey. Seasons close in order, so "the last row banked before this week" is `seasonIndex` arithmetic
 *  and not a search. */
function rowCurrentAt(world: WorldState, week?: number): SeasonHistoryEntry | undefined {
  if (week === undefined) return world.seasonHistory[world.seasonHistory.length - 1]
  const before = seasonIndexOf(week)
  let out: SeasonHistoryEntry | undefined
  for (const row of world.seasonHistory) if (row.seasonIndex < before) out = row
  return out
}

/** Her ITF place on one banked row, on the v46 convention `yearEndJuniorRank` documents above. */
function juniorRankOf(row: SeasonHistoryEntry | undefined): number | null {
  if (!row) return null
  if (row.byTrack) return row.byTrack.itf?.endRank ?? null
  return row.endRank
}

/** ...and her PROFESSIONAL place on the same row. Absent before v46 and absent when she held no
 *  counting W result, which are the same answer to the question the merit rule asks: she was not on
 *  the list. The flat `endRank` is deliberately NOT a fallback here – it is the ITF one, always. */
function yearEndWtaRankOf(row: SeasonHistoryEntry | undefined): number | null {
  return row?.byTrack?.wta?.endRank ?? null
}

/** THE SUB-CAP INSIDE THE FOURTEEN-YEAR-OLD'S EIGHT: at most three of them at W75 or above (WTA
 *  §X.A.2). `null` when the age has no sub-cap row or the rung is below its floor – i.e. almost
 *  always, which is the honest answer for a quota that governs one age and the top of the ladder.
 *
 *  ⚠⚠ IT IS COUNTED OFF `seasonEntries`, WHICH IS A SEASON LEDGER, AND THAT IS A STATED LIMITATION
 *  RATHER THAN AN OVERSIGHT. Everything else in P2 windows on her birthday year; this one cannot,
 *  and the reason is that `proEntryWeeks` records a WEEK and no rung, so the only ledger in the world
 *  that can answer "how many of them were at W75 or above" is `world.seasonEntries` – the same one
 *  P1's Accelerator folds, with the same argument (see `seasonWEntriesByTier` for why the three
 *  obvious alternatives cannot answer). It is reset by the wrap, so a birth year that straddles a
 *  season boundary sees only the part of itself after the wrap.
 *
 *  THE THREE THINGS THAT MAKE THAT PROPORTIONATE, IN ORDER:
 *    1. THE UNDER-COUNT IS THE GENEROUS DIRECTION, exactly as `seasonWEntriesByTier`'s own note says
 *       of a ledger that started mid-season. A sub-cap that forgets is never a sub-cap that invents.
 *    2. ⚠⚠ IT COULD NOT BIND AT ALL UNTIL 16.08, AND NOW IT CAN – WHICH PROMOTES THE LIMITATION
 *       ABOVE FROM ACADEMIC TO LIVE. This item used to read: *"IT CANNOT BIND AT THE SHIPPED
 *       CONSTANTS AT ALL. W75 opens at 17 (`minAgeYears`), so a fourteen-year-old's count of
 *       W75-or-above entries is structurally zero – measured, and reported as a zero rather than
 *       hidden (docs/specs/age-eligibility-window-2026-08.md §5)."* The owner's age-grid ruling of
 *       16.08 put `w75.minAgeYears` at 14, so the count is no longer STRUCTURALLY zero.
 *
 *       ⚠⚠ AND IT STILL MEASURES ZERO, FOR A DIFFERENT REASON, WHICH IS THE HONEST STATE OF IT.
 *       Re-measured on P0's frozen battery the evening the floors moved (n = 90, 676 weeks,
 *       `docs/specs/college-is-its-own-branch-2026-08.md` §3): a fourteen-year-old's mean W75-or-above
 *       entries is **0.0**, because `w75.acceptsRank` is #300 and she holds no professional ranking at
 *       fourteen at all. The gate moved from the DOORWAY to the ACCEPTANCE LIST; the sub-cap sits
 *       behind both. So the ledger window below is a limitation that can now be reached in principle
 *       and is not reached in practice – and item 1 is why the under-count is the safe direction when
 *       it is. Item 3 is the fix and it is unchanged: the pro ledger needs a tier, a save-schema move.
 *    3. THE FIX IS NAMED, so the day it CAN bind nobody has to rediscover it: give the pro ledger a
 *       tier. That is a save-schema change – the three-part move – and buying one for a rule that
 *       cannot fire would have been machinery bought on speculation.
 *
 *  ⚠ AND IT IS A QUOTA, NOT A DOOR (the acceptance-cuts audit's own wording). It refuses the ninth
 *  W75 entry of a year, never the rung – which is why it is a separate verdict from `minAgeYears`. */
export function proSubCapUsage(world: WorldState, week: number, tier: TierId): EntryCapUsage | null {
  const row = ECONOMY.entryCap.proSubCapByAge[kidAgeAt(world, week)]
  if (!row) return null
  const floor = TIER_LADDER.indexOf(row.fromTier)
  if (floor < 0 || TIER_LADDER.indexOf(tier) < floor) return null
  const spent = seasonWEntriesByTier(world, week)
  let used = 0
  for (const t of TIER_LADDER) if (TIER_LADDER.indexOf(t) >= floor) used += spent[t] ?? 0
  return { used, limit: row.max, remaining: Math.max(0, row.max - used) }
}

/** The sub-cap's refusal, in the same register as every other allowance here: it names the rule, the
 *  count and what is still open, because a quota is a budget and not a verdict. */
export function proSubCapRefusalDetail(ageYears: number, usage: EntryCapUsage, fromTier: TierId): string {
  return (
    `Tour age rule – at ${ageYears} only ${usage.limit} of her professional entries may be at ` +
    `${TIERS[fromTier].label} or above, and she has used ${usage.used}. The smaller rungs stay open.`
  )
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
