// THE STAFF'S YEAR-END POST (round 44 #7) – the four salaried seats report on the season that has
// just finished.
//
// THE OWNER, 18.09, having played a career to its end: «письмо от тренера по итогу года мне так и не
// пришло, да и ни от одного специалиста не пришло.»
//
// ⚠ NOT A DEFECT – A FEATURE THAT WAS NEVER BUILT, and that was measured before a line was written.
// Today's post is the brands' kit letters, the academy's yearly review and (since round 43) the
// shop's build notices. The people the family pays EVERY WEEK – the coach, the masseur, the
// psychologist, the hitting partner – had no voice in the inbox at all.
//
// ⚠⚠ THE DESIGN PROBLEM IS NOT «WHAT SHOULD A COACH SAY», IT IS «WHAT DOES THIS WORLD ACTUALLY
// RETAIN», and the four seats are wildly unequal on that question. The inventory was taken against
// the tree, seat by seat, before the shape was chosen:
//
//   · the COACH is rich – the wrap-up banks her whole season (`SeasonHistoryEntry`), `trophiesByTier`
//     keeps every title's WEEK for ever, and `coachPairs` carries the pair's chemistry.
//   · the MASSEUR has exactly one durable artifact of his own work: `injuryHistory[].weeksSaved`,
//     written only on the layoffs he actually shortened.
//   · the PSYCHOLOGIST has the year's FOCUS (one slot, overwritten by the next pick) and, for one
//     focus out of five, a standing counter.
//   · the HITTING PARTNER has NOTHING beyond his own employment. His channel is `FormWeek.rustCut`,
//     and a `FormWeek` is built, read and thrown away inside one week.
//
// THE RULE THAT FOLLOWED, and it governed every decision in this file: **a seat whose facts the
// world does not retain writes a SHORTER letter.** Nothing is inferred from «he was on the payroll»,
// nothing is averaged, nothing is invented, and NOT ONE persisted field was added for any of them.
// `StaffLetterTerms` carries the whole inventory, absence by absence, and is the document of record.
//
// ⚠ RNG. Nothing in this file draws on the MAIN stream and nothing here persists a stream position,
// so the frozen capture (41550 / e6b0c709) cannot see it. It is a REPORT, and a report does not roll
// dice. ⚠ The one sub-stream that is reached is `chemistryReading`'s own
// `seed:chemistry:readable:<coachId>` – re-derived at the call site, read once, thrown away, and a
// pure function of (seed, coachId), exactly as the coach card's ring reaches it. It is the SAME
// function that decides whether the gauge shows a reading, which is the point: two surfaces asking
// one question must ask one function, or the letter can say what the ring is still hiding.

import { chemistryReading } from '../chemistry'
import { raiseStaffLetter } from '../offers'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../season/calendar'
import type { LadderTrack } from '../season/types'
import type { StaffLetterTerms, StaffSeat } from '../../shared/protocol'
import { COACH_CHANGE_KEY, coachSinceWeek } from './coachMarket'
import { seasonIndexOf } from './ledger'
import { MASSEUR_CHANGE_KEY } from './masseur'
import { PSYCHOLOGIST_CHANGE_KEY } from './psychologist'
import { SPARRING_CHANGE_KEY } from './sparring'
import type { WorldState } from '../world'

/** The weeks a season is actually PLAYED in – the window the wrap-up itself folds over
 *  (`[yearStart, wrapWeek)`, and `wrapWeek` is the first off-season week). Not 52: the three quiet
 *  weeks carry no tournament and no ranking, and a seat cannot be judged on them. */
const PLAYED_WEEKS = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** ⭐⭐ HOW MUCH OF ONE SEASON A SEAT HAS TO HAVE WORKED BEFORE IT MAY WRITE ABOUT IT – HALF.
 *
 *  ⚠ IT IS NOT A NUMBER PICKED HERE, AND THAT MATTERS BECAUSE THE ALTERNATIVE WAS ARBITRARY. The
 *  house already had to answer «did this seat have this season» once, for the coach's plaque:
 *  `coachRevealWeek` (world/coachMarket.ts) rules that a run beginning in the FIRST HALF of a season
 *  counts as that season and one beginning in the second half pushes the verdict a year. This is the
 *  same rule read as a gate, so the letter and the plaque cannot disagree about whose year it was.
 *
 *  ⚠ AND IT IS WHAT MAKES «HIRED IN THE LAST WEEK» SILENT, which is the honest half. A seat taken on
 *  at week 48 was present for one week of the year; a letter from it reporting «her season» would be
 *  a sentence claiming more than its code checks – the defect `WorldState.spiritShock.weeks` was
 *  added to avoid, named there in those words. Below the bar the seat simply does not write, which
 *  is the same silence `settleAcademyLetters` keeps over a review it cannot date. */
const MIN_SEASON_SHARE = 0.5

/** ⭐⭐ EVERY WEEK INSIDE `[fromWeek, untilWeek)` THAT A SEAT WAS ON THE PAYROLL.
 *
 *  ⚠ THE SUM OF THE HIRED SPANS CLIPPED TO THE WINDOW, never «weeks since the hire» – this is
 *  `masseurWeeksServedAt` (world/masseur.ts) with a window, and its reasoning is quoted rather than
 *  re-argued: weeks a seat was not employed are weeks it did not work, and a clock that reset on a
 *  re-hire would let a family fire a seat for one week to buy something back. The rows alternate
 *  hire / release by construction – each `hire*` command is the only writer of its tag and returns
 *  before writing when the flag is not actually flipping – so the parity read is sound.
 *
 *  ⚠ THE ROWS ARE `keep: true`, WHICH IS THE ONLY REASON THIS WORKS AT ALL. `pruneEvents` partitions
 *  the feed and never trims the kept rows, so the full employment history of every seat is in every
 *  save that has ever had one – including seasons whose ordinary feed rows were evicted years ago.
 *
 *  ⚠ A HAND-BUILT PROBE WORLD carrying `masseurHired: true` and no tagged row reads as ZERO weeks
 *  served and therefore writes no letter. That is `masseurWeeksServedAt`'s own courtesy (the
 *  identity element rather than a crash) and it is the right answer here too: an employment nobody
 *  recorded is an employment this letter cannot vouch for. Pure read, zero draws. */
export function seatWeeksServedIn(world: WorldState, key: string, fromWeek: number, untilWeek: number): number {
  const marks: number[] = []
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(key) && e.week < untilWeek) marks.push(e.week)
  }
  marks.sort((a, b) => a - b)
  let served = 0
  for (let i = 0; i < marks.length; i += 2) {
    // An odd tail is the span still running – it closes at the end of the window being asked about.
    const spanEnd = i + 1 < marks.length ? marks[i + 1] : untilWeek
    served += Math.max(0, Math.min(spanEnd, untilWeek) - Math.max(marks[i], fromWeek))
  }
  return served
}

/** THE COACH'S OWN WEEKS, and he needs his own reader for one reason the other three do not have:
 *  **a career can begin with a coach already in the chair.** `profile.coachTier` is chosen in the
 *  prologue and no `coach-since-` row is ever written for it, so the span walk above would read a
 *  founding coach as zero weeks served and silence him for ever.
 *
 *  `coachSinceWeek` is the existing answer to exactly that and falls back to week 0 – «they have been
 *  together as long as anyone can remember» – which is the right reading of a ledger with no record
 *  of a change. This is that week's overlap with the season. */
function coachWeeksServedIn(world: WorldState, fromWeek: number, untilWeek: number): number {
  if (!world.coachId) return 0
  const hasMark = world.events.some((e) => e.milestoneKey?.startsWith(COACH_CHANGE_KEY))
  const since = hasMark ? coachSinceWeek(world) : 0
  return Math.max(0, untilWeek - Math.max(since, fromWeek))
}

/** HER TITLES INSIDE ONE SEASON, counted off `trophiesByTier` – which stores absolute WEEKS and is
 *  never pruned, so a season's tally is exact however old it is. (The event feed is not: it caps at
 *  400 rows by COUNT, which is how the wrap-up once reported «no tournaments played» over a 44-19
 *  year. `seasonBestFinish` made the same move for the same reason.) */
function titlesInSeason(world: WorldState, fromWeek: number, untilWeek: number): number {
  let titles = 0
  for (const tier of Object.values(world.trophiesByTier ?? {})) {
    for (const w of tier?.titles ?? []) if (w >= fromWeek && w < untilWeek) titles += 1
  }
  return titles
}

/** ⭐⭐⭐ THE STAFF WRITE. Called on the wrap week, immediately after `maybeFireSeasonWrapUp` has
 *  banked the season row – see the call site in `world/phaseAiWeek.ts` for why that ordering is the
 *  whole design and not a convenience.
 *
 *  ⚠ ONE LETTER PER HIRED SEAT PER SEASON, and idempotent on the id rather than on this call site:
 *  `raiseStaffLetter` refuses a second write, exactly as every other `raise*` in `engine/offers.ts`
 *  does, so a resumed career or a re-run week cannot double the post.
 *
 *  ⚠ THE SEASON'S FIGURES ARE READ OFF THE BANKED ROW AND NEVER RE-FOLDED HERE. `world.results`
 *  prunes to a rolling 52 weeks and `seasonWins` / `seasonLosses` are RESET by the wrap-up moments
 *  before this runs, so a second fold would be both wrong and a second answer to a question the
 *  Stats table already answers. If the row is absent – a hand-built world, or a career whose wrap
 *  never ran – the record fields are simply omitted and the seats say less.
 *
 *  ⚠ ZERO DRAWS ON MAIN. See the file header for the one sub-stream `chemistryReading` re-derives. */
export function settleStaffLetters(world: WorldState): void {
  // The wrap-up's own week test – the first off-season week, «по итогу года» in every other sense
  // too (the same line `maybeFireSeasonWrapUp` and `seasonWrapDue` open with).
  if (world.week % WEEKS_PER_YEAR !== PLAYED_WEEKS) return

  const wrapWeek = world.week
  const yearStart = wrapWeek - PLAYED_WEEKS
  const seasonIndex = seasonIndexOf(wrapWeek)
  const minWeeks = PLAYED_WEEKS * MIN_SEASON_SHARE

  const row = world.seasonHistory.find((h) => h.seasonIndex === seasonIndex) ?? null

  /** The one place a seat's letter is actually pushed: the gate, then the seat's own facts. */
  const write = (seat: StaffSeat, hired: boolean, weeksServed: number, facts: Partial<StaffLetterTerms>) => {
    if (!hired || weeksServed < minWeeks) return
    raiseStaffLetter(world.offers, wrapWeek, { seat, seasonIndex, weeksServed, ...facts })
  }

  // --- the coach ---------------------------------------------------------------------------------
  // ⚠ «HIRED» IS `coachId !== null` AND NOT A TIER TEST. `coachTier: 'self'` is the parent on the
  // court, which is a real arrangement rather than an empty seat – and a parent does not write the
  // family a letter.
  //
  // ⚠⚠ THE CHEMISTRY IS THE ONE FIGURE THAT COULD LEAK, and the guard is `chemistryReading` itself
  // rather than any threshold expressed here. The bar is DRAWN PER PAIR (`seed:chemistry:readable:
  // <coachId>`, a uniform in [1, 2.5] on a -100..+100 scale), so it differs by career and by coach;
  // gating on `ECONOMY.chemistry.readableFloor` instead is a named RED arm in
  // tests/round45-chemistry-readable.test.ts. `null` here means precisely what an empty ring means –
  // she has not trained with him enough for the pair to have a reading, or the reading has not
  // cleared this pair's own bar – and the letter then says nothing whatever about the pair.
  const coachChem = world.coachId
    ? chemistryReading(world.coachPairs?.[world.coachId], world.seed, world.coachId)
    : null
  write('coach', world.coachId !== null, coachWeeksServedIn(world, yearStart, wrapWeek), {
    ...(row
      ? {
          wins: row.wins,
          losses: row.losses,
          titles: titlesInSeason(world, yearStart, wrapWeek),
          ...(row.bestFinish !== undefined ? { bestFinish: row.bestFinish } : {}),
          ...seasonRankOf(row),
        }
      : {}),
    ...(coachChem !== null ? { chem: coachChem } : {}),
  })

  // --- the masseur -------------------------------------------------------------------------------
  // ⚠ HE REPORTS THE LAYOFFS HE DEMONSTRABLY WORKED, WHICH IS A STRICTER CLAIM THAN «he was on the
  // payroll when she was hurt». `weeksSaved` is written onto an `injuryHistory` row only when he
  // actually shortened that layoff, so a row carrying the key is PROOF of his work; a layoff he
  // could not shorten is not counted as one he worked. The row's `week` is the CLEAR week, which is
  // the week the shortening finished, so that is the week the season attribution reads.
  //
  // ⚠ AND HE SAYS NOTHING ABOUT KNOCKS – there is no link to say it through. See `StaffLetterTerms`.
  let layoffs = 0
  let weeksSaved = 0
  for (const h of world.injuryHistory) {
    if (h.week < yearStart || h.week >= wrapWeek) continue
    if (!h.weeksSaved) continue
    layoffs += 1
    weeksSaved += h.weeksSaved
  }
  write(
    'masseur',
    world.masseurHired,
    seatWeeksServedIn(world, MASSEUR_CHANGE_KEY, yearStart, wrapWeek),
    { layoffs, weeksSaved },
  )

  // --- the psychologist --------------------------------------------------------------------------
  // ⚠ THE FOCUS IS NAMED ONLY WHEN THE STAMP STILL POINTS AT THE SEASON BEING REPORTED.
  // `psychologistFocus` is ONE slot, overwritten by the next pick, and `psychologistFocusSeason`
  // records the season the live pick was bought FOR. A change is off-season-only, and this runs on
  // the FIRST off-season week – ahead of any re-pick, which is a command and lands between ticks –
  // so in play the stamp still names the year that just ran. Guarding on it anyway is what stops the
  // letter printing next year's focus over last year's season on a career that got there another way.
  //
  // ⚠⚠ `composureBonus` RIDES ONLY WITH `'coolhead'` AND IS A STANDING LEVEL, NEVER A SEASON'S GAIN.
  // It is the only cumulative counter any focus has, and it DECAYS on every week the nerve focus is
  // not worked – so «this year gave you N» is a claim the number cannot support, while «she stands N
  // above her own nature» is exactly what it holds. The other four focuses retain nothing at all and
  // their letters therefore report the year's subject and no outcome.
  const focusIsThisSeason = world.psychologistFocus !== null && world.psychologistFocusSeason === seasonIndex
  write(
    'psychologist',
    world.psychologistHired,
    seatWeeksServedIn(world, PSYCHOLOGIST_CHANGE_KEY, yearStart, wrapWeek),
    focusIsThisSeason
      ? {
          focus: world.psychologistFocus ?? undefined,
          ...(world.psychologistFocus === 'coolhead' ? { composureBonus: world.composureBonus } : {}),
        }
      : {},
  )

  // --- the hitting partner -----------------------------------------------------------------------
  // ⚠ HIS LETTER CARRIES HIS WEEKS AND NOTHING ELSE, and that is the measured truth of this seat
  // rather than a corner cut. `sparringRustCut` feeds `FormWeek.rustCut`, `FormWeek` is built by
  // `herWeekForForm`, consumed by `accrueForm` and discarded inside the same week; nothing counts the
  // matchless weeks he covered and nothing records the drift he cut. His contribution is not
  // separable from `world.form` even in principle – and `world.form` may not be surfaced anyway
  // (the owner's ruling O2, 16.09: no number, no Mood word, no diary line). Adding a counter for him
  // is a schema move and this item does not own one, so the seat writes the shortest letter of the
  // four and claims nothing it cannot show.
  write('sparring', world.sparringHired, seatWeeksServedIn(world, SPARRING_CHANGE_KEY, yearStart, wrapWeek), {})
}

/** WHERE SHE FINISHED THE YEAR AND WHICH TABLE THAT IS A RANK ON.
 *
 *  ⚠ `SeasonHistoryEntry.endRank` IS THE ITF ALIAS, ALWAYS, and printing it unqualified over a
 *  twenty-one-year-old professional is the defect the wrap-up's own rank line had to fix («Unranked
 *  internationally – she has not played a Junior Tour event yet», shown to a WTA player). `byTrack`
 *  is what tells the three tables apart, so the track carrying the most points that season is the
 *  one the letter names.
 *
 *  ⚠ ABSENT TOGETHER ON A PRE-v46 ROW, which carries no `byTrack` at all. Absent is «not recorded»
 *  and never zero – `SeasonTrackRow`'s own rule, and the season mirror's: a figure printed over a
 *  season nobody counted is the class of defect that reported «no tournaments played» over 44-19. */
function seasonRankOf(row: { endRank: number; byTrack?: Record<LadderTrack, { endRank?: number; points: number }> }) {
  if (!row.byTrack) return {}
  let best: { track: LadderTrack; points: number } | null = null
  for (const track of ['domestic', 'itf', 'wta'] as LadderTrack[]) {
    const r = row.byTrack[track]
    if (!r || r.endRank === undefined) continue
    if (!best || r.points > best.points) best = { track, points: r.points }
  }
  if (!best) return {}
  return { endRank: row.byTrack[best.track].endRank, rankTrack: best.track }
}
