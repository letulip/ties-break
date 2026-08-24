// THE TABLES: three ladders, her place on them, and the two helpers that resolve "her rank".
//
// `LADDER_LABEL` / `LADDER_TRACKS` / `LADDER_POINTS_LABEL` are the one spelling of each table's
// name and currency; `activeLadderOfSnapshot` and `rankChipTrack` are the one implementation of the
// question four surfaces used to answer for themselves.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { LadderTrack, RankingRow, TierId } from '../../engine/season/types'
import type { Snapshot } from './snapshot'

/** A standings row enriched for display (RankingRow only carries ids). */
export interface StandingRow extends RankingRow {
  name: string
  nation: string
  isKid: boolean
  /** HOW OLD SHE IS – the owner, twice: «я просил возраста девочек добавить в stats доп колонкой».
   *
   *  ⚠ HER OWN AGE, NEVER THE BAND. For a rival that is `AiPlayer.ageYears`, which is a PERSON's age
   *  and not the cohort's band: it is drawn once per girl at intake (`COHORT.ageBand` is the range the
   *  draw comes from, not a value anybody carries) and advanced by one at each season boundary, and it
   *  is the same number the match engine feeds the serve-speed curve – so a sixteen-year-old on this
   *  table serves like a sixteen-year-old in the box score. For the KID it is `kidAgeYears`, off her
   *  birth date, per the one-clock ruling of 09.08; `ageAtWeek` is the coach market's restocking clock
   *  and is not an age at all (engine/world/age.ts).
   *
   *  ⚠ THE TWO CLOCKS TICK DIFFERENTLY AND BOTH ARE HONEST. Hers moves on her birthday, a rival's at
   *  the season boundary, because a cohort girl has no birth date to be exact about (the one-clock note
   *  says so in as many words). Whole years on both sides, so the column compares like with like.
   *
   *  Optional: an id with no row behind it (the `?? { name: playerId }` fallback in `computeStandings`)
   *  has no age to state, and a blank is the honest answer rather than a zero. */
  ageYears?: number
  /** true when one or more ranked players were omitted between this row and the
   *  previous displayed row (the standings table shows top 10 + a window around the
   *  kid, not the full field). Competition ranking means a rank number jumping by
   *  more than 1 is no longer proof of an omission on its own (a tie does that too),
   *  so the UI must use this flag rather than diffing `rank` values. */
  gapBefore: boolean
}

/** One of the kid's counted (best-6, windowed) results, for the Kid-screen transparency
 *  list (round-5 item 1b). `tier` is optional: pre-r5 kid results were stored without it. */
export interface CountingResult {
  week: number
  tier?: TierId
  points: number
}

/** ONE LADDER, EVERYTHING ABOUT IT - see `computeLadderView` in engine/world.ts for the argument.
 *
 *  There are two of these on a Snapshot because docs/specs/two-ladders.md designed two tables with
 *  two currencies and no exchange rate between them. They are the SAME SHAPE on purpose: a screen
 *  should render "a ladder" once, not branch on which one it was handed. */
export interface LadderView {
  /** Her dense place in this table, or NULL when she holds no counting result in it - i.e. she is not
   *  ranked here at all.
   *
   *  ⚠ null IS NOT #1, and the distinction is load-bearing. Competition ranking gives every member of
   *  a tie the same place, so while nobody holds a point the whole field ties at zero and a point-less
   *  kid comes out as a single digit. Every screen used to guard that with its own
   *  `countingResults.length > 0` check; carrying it in the type means none of them can forget. */
  rank: number | null
  /** Her place in THIS table at the start of the last resolved week; null before any tick.
   *
   *  ⚠ Per-ladder on purpose. A movement arrow is (previous - current), and with one shared "previous
   *  rank" a screen showing her national place would have diffed it against last week's international
   *  place - a quieter instance of the bug that produced #4 on Home against #128 in Stats. */
  prevRank: number | null
  /** Her windowed best-6 total IN THIS TABLE'S CURRENCY. National points and ITF points are different
   *  units and must never be added, compared or silently swapped for one another. */
  points: number
  /** WHAT SHE HAS WON THAT THE TABLE IS NOT SHOWING YET – present ONLY while §VIII.A.2.b is
   *  withholding her total, absent on every other row and on every other table.
   *
   *  ⚠ THE OWNER FILED THIS AS A CACHE BUG (round-16 #3): *"the professional table shows 0 points
   *  after the second match while the result row shows 6, and the third match onward counts"*. It is
   *  not a cache. It is the WTA's own minimum, shipped deliberately in `rankableTotal` – *"Players
   *  must earn ranking points in at least three (3) valid Tournaments, or a minimum of ten (10)
   *  singles ranking points ... in order to appear on the WTA Rankings"* – so a professional on two
   *  results worth six points reads ZERO on the table while her counting-results list beside it
   *  shows both rows. Reproduced against his own save (tools/round16-read.ts): her first professional
   *  result in the window paid 8 and the table showed 0; the second took her past ten and the table
   *  showed 16. Correct arithmetic, and a screen with no way to say so.
   *
   *  ⚠ THE ENGINE OWNS THE NUMBER, THE SCREEN OWNS THE SENTENCE. This is the sum of the same counted
   *  rows `countingResults` lists, BEFORE the minimum is applied – so the two cannot disagree about
   *  what is being withheld. `RANKABLE_MIN` stays the one place the thresholds are written down.
   *
   *  ABSENT rather than 0 when nothing is withheld: a 0 here would be indistinguishable from "she is
   *  on the list with no points", which is the same "unranked is not a number" trap `rank` avoids. */
  banked?: number
  /** Top 10 + a window around her, rank order - this table only. */
  standings: StandingRow[]
  /** The results THIS table counted, strongest first. Pairs with `rank`: a rank and the results that
   *  earned it have to come from the same table or the explanation contradicts the number. */
  countingResults: CountingResult[]
}

/** Both tables, keyed by the engine's own track names.
 *
 *  ⚠ THESE KEYS ARE NOT PLAYER-FACING COPY. The owner's rule is that a player must never need the
 *  word "track", and "domestic"/"itf" are engine vocabulary. The player-facing labels live in exactly
 *  one place - `LADDER_LABEL` below - so no screen invents its own name for a table. */
export type LadderViews = Record<LadderTrack, LadderView>

/** The player-facing name of each table, defined ONCE. "National" and "International" are the words a
 *  parent would use; nothing in the UI says "domestic", "ITF" or "track".
 *
 *  ⚠ THE THIRD ONE IS "PROFESSIONAL", NOT "WTA" AND NOT "WORLD TOUR". Two acronyms were available and
 *  both are engine vocabulary wearing a tour's logo – a parent watching her daughter does not say
 *  "her WTA ranking", she says the girl has turned professional. It is also the only word that tells
 *  the third table apart from the second on the axis the player actually feels: a W15 is every bit as
 *  INTERNATIONAL as a J30 (same flights, same passport, same two weeks away), so naming it by
 *  geography would have produced two tables called almost the same thing. The break at this table is
 *  junior/professional, and the label says so. */
export const LADDER_LABEL: Record<LadderTrack, string> = {
  domestic: 'National',
  itf: 'International',
  wta: 'Professional',
}

/** EVERY TABLE, LOWEST FIRST – the one list, for the loops that must cover all of them.
 *
 *  ⚠ DERIVED FROM `LADDER_LABEL` RATHER THAN WRITTEN OUT, and that is what makes it exhaustive: the
 *  label map is a TOTAL Record, so a fourth table cannot ship without a name, and the day it gets one
 *  it joins this array too. A hand-written list is the drift `emptySeasonRecord` had to be patched for
 *  when `LadderTrack` gained `wta` – three call sites, one of them forgotten.
 *
 *  ⚠ AND THE ORDER IS MEANING, NOT ALPHABET. Lowest table first: `dominantTrackOfSeason` walks it with
 *  a strictly-greater test so the HIGHER table wins a dead heat, and the Stats switch renders in it.
 *  Reordering `LADDER_LABEL` above moves both. */
export const LADDER_TRACKS = Object.keys(LADDER_LABEL) as LadderTrack[]

/** HER LADDER AND HER PLACE ON IT, resolved once for the surfaces that want "her rank" and have no
 *  table of their own to be about.
 *
 *  ⚠ IT EXISTS BECAUSE `snapshot.kidRank` IS THE WRONG ANSWER TO AN OBVIOUS QUESTION, and it is the
 *  answer three surfaces reached for (31.07, fix/ladder-separation): the week recap's rank-move line
 *  and both friendly-match cards. `kidRank` is the ITF alias and it is always a NUMBER, so an
 *  unranked girl came out as the tie floor she shares with half the field, in a table the Stats
 *  screen was calling "Unranked" on the next tab. Home, Stats and the Kid screen already ask
 *  `ladders[activeLadder]`; this is the same question with one implementation, so the answer cannot
 *  drift for the fourth surface that needs it.
 *
 *  `rank` is null when she holds no counting result in that table – see `LadderView.rank`. */
export function activeLadderOfSnapshot(
  snap: Pick<Snapshot, 'ladders' | 'activeLadder'> | null | undefined,
): { track: LadderTrack; label: string; rank: number | null; points: number } {
  const track = snap?.activeLadder ?? 'domestic'
  // ⚠ `?.` ON `ladders` TOO, not only on `snap`. The signature already promises to survive a null
  // snapshot, and a snapshot whose `ladders` has not been built yet is the same absence one level
  // down – it threw `Cannot read properties of undefined (reading 'domestic')` the first time a
  // partial fixture reached it (round-17 #6, ForkDialog). A total helper is the whole reason this
  // exists rather than every screen indexing `ladders` itself.
  const view = snap?.ladders?.[track]
  return { track, label: LADDER_LABEL[track], rank: view?.rank ?? null, points: view?.points ?? 0 }
}

/** WHICH TABLE HOME'S RANK CHIP NAMES - or null for NO CHIP AT ALL (architect's ruling, 02.08, on
 *  the owner's «нужна ли она там вообще?»).
 *
 *  The chip is her current WORKING track, which is `activeLadder` (the engine's one answer - see
 *  `activeLadderOf`: professional once any W result has ever counted, and from that moment
 *  PERMANENTLY; junior while she holds a counting J result; national before either). What this
 *  helper adds is only the empty case: before her first counting result in ANY table there is no
 *  place to report, and a chip reading "Unranked" over a brand-new career is a readout with nothing
 *  to read - so it is not drawn at all.
 *
 *  ⚠ THE PROFESSIONAL ARM RETURNS EVEN WHEN `rank` IS NULL. "She is a professional now" is decided
 *  once and outlives any 52-week drought that empties her live window; on such a week the chip
 *  honestly reads Professional + Unranked rather than pretending she is a junior again. A pure
 *  selection over snapshot fields - no rank is re-derived here (the engine owns all three). */
export function rankChipTrack(
  snap: Pick<Snapshot, 'ladders' | 'activeLadder'> | null | undefined,
): LadderTrack | null {
  if (!snap) return null
  const track = snap.activeLadder
  if (track === 'wta') return 'wta'
  return snap.ladders[track].rank !== null ? track : null
}

/** The unit each table's points are counted in, for a label that has to name the currency (the Home
 *  ladder's entry thresholds are all denominated in NATIONAL points - see engine/season/calendar.ts,
 *  whose own ladder diagram is drawn against "domestic pts"). */
export const LADDER_POINTS_LABEL: Record<LadderTrack, string> = {
  domestic: 'national pts',
  itf: 'international pts',
  // ⚠ AND THIS IS THE UNIT THE PLAYER MUST NOT ADD TO THE OTHER TWO. It is the smallest-looking
  // number on any of the three tables – a W15 title pays 10 where a J300 title pays 300 – and it is
  // the one that means she is a professional. Naming the currency on every figure is what stops the
  // Stats screen reading like a demotion the week she steps up (see LadderTrack in season/types.ts).
  wta: 'professional pts',
}
