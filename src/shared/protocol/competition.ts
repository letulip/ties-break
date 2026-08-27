// THE TOURNAMENTS: what she entered, what the draw did, and what the season came to.
//
// The season recap and its persisted entry ledger, the reveal's bracket views, the planning
// counters, the tier gates and their refusals, the trophy cabinet, and the arrival preview.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { Surface } from '../../engine/match/types'
import type { EventPreview } from '../../engine/season/preview'
import type { LadderTrack, TierId } from '../../engine/season/types'
import type { WorldMatch } from './events'

/** Structured end-of-season recap (schema v10). Written at wrap-up time (the tick into the
 *  season year's first off-season week) off the world state itself – W-L are counted as the
 *  season's kid matches resolve (never re-parsed from event text), so pruning can't lose them.
 *  Surfaced on the snapshot and shown by SeasonSummaryDialog when `advance` reports 'season-end'. */
export interface SeasonSummary {
  /** DISPLAY year of the season that just ended – `seasonYear(seasonIndex)` in shared/dates.ts,
   *  i.e. derived from the season's INDEX, never from the calendar year of its first Monday.
   *  It used to be `weekYear(yearStart)`, which repeats 2035 for seasons 4 and 5 (a season is 364
   *  days, so its opening Monday walks back over New Year); the popup would then have announced
   *  "Season 2035" two years running. Label only – the season's identity is its index. */
  seasonYear: number
  /** kid's dense rank at wrap-up */
  endRank: number
  /** kid's dense rank at the season's first week (null if it couldn't be reconstructed) */
  startRank: number | null
  /** season points (sum of the kid's results earned in-season) */
  points: number
  wins: number
  losses: number
  /** THREE ANSWERS, not two: a finish ("Semifinalist"), "no result that scored" (she entered and
   *  nothing counted – her result row is award-only, so the ledger has nothing to invert), or
   *  "no tournaments played" (she genuinely did not play). The middle one arrived with
   *  fix/wallet-and-wrapup, which moved this fold off the count-capped event feed and onto
   *  `world.results`; collapsing the first two was how a 44-19 season came to report the third. */
  bestResultText: string
  /** signed funds delta across the season (== earnedCents - spentCents, and == the change in
   *  `fundsCents` across the season window). R11-12a: this used to be a scrape of the CAPPED
   *  `events` feed over a window that also excluded the wrap-up week, so it disagreed with the
   *  Money screen by hundreds of dollars a season; it is now the same `financeWindow` fold the
   *  wallet reads, over the same window. */
  fundsDeltaCents: number
  /** GROSS spend across the season window (a positive number) – the figure the Money screen's
   *  "This season" donut shows in its centre. OPTIONAL: summaries banked before R11-12a never
   *  stored it, so readers must treat `undefined` as "not recorded" and show nothing. */
  spentCents?: number
  /** GROSS income across the same window (a positive number). Same optionality as `spentCents`. */
  earnedCents?: number
  /** weeks lost to injury inside the season (Season-Life slice C). OPTIONAL – summaries
   *  banked before slice C never stored it; readers default to 0 (no schema bump). */
  weeksInjured?: number
  /** travel the academy paid for inside the season, in cents (schema v21). 0 when nobody was
   *  backing her. OPTIONAL for the same reason as the two above: a recap is a record of what was
   *  said, and summaries banked before v21 never knew this number. */
  academyCoveredCents?: number
  /** WHICH TABLE THIS SEASON WAS PLAYED ON – the track that carried the most competitive matches
   *  (`dominantTrackOfSeason`, engine/world/milestones.ts), falling back to `activeLadderOf` for a
   *  season she did not play at all.
   *
   *  ⚠ IT EXISTS BECAUSE THE WRAP-UP NAMED THE JUNIOR TABLE FOR EVER (fix/wallet-and-wrapup, on the
   *  owner's «на том же экране всегда показывается international, хотя мы уже давно там не
   *  играем»). The rank line was pinned to `LADDER_LABEL.itf` in 79567f9, when a career had two
   *  tables and the junior one was the destination; the professional table landed the next day and
   *  nothing widened it, so a W75 player with no junior point in the 52-week window read "Unranked
   *  – she has not played a Junior Tour event yet".
   *
   *  OPTIONAL, and readers fall back to the junior table exactly as before – the `weeksInjured`
   *  precedent, so no schema bump: a summary banked before this wave never knew its own track. */
  rankTrack?: LadderTrack
  /** Her dense place in `rankTrack` at the wrap, or null when she holds no counting result in it.
   *
   *  ⚠ NOT THE SAME NUMBER AS `endRank`, which is and stays the ITF one (`world.kidRank`) so the
   *  season-history table it also feeds keeps meaning one thing down its whole column. null follows
   *  `LadderView.rank`: unranked is not a number, and a dense place inside the 0-point tie group is
   *  what that rule exists to refuse to print. Same optionality as `rankTrack`. */
  rankInTrack?: number | null
  /** WHAT THE SEASON COULD NOT DO – the entries it spent on rungs whose title could not have entered
   *  her book (schema v45, docs/specs/season-mirror-2026-08.md).
   *
   *  ⚠ IT EXISTS BECAUSE THE LADDER FLOOR GREW A DECISION WHOSE WRONG ANSWER IS INVISIBLE. With the
   *  lower bound gone (`ladder-floor-2026-08.md`, the owner's ruling of 08.08) a rung she has outgrown
   *  is enterable, which is correct – but `human-arm-forward-2026-08.md` then measured a season paying
   *  10.3 entries into rungs that cannot move her, with **six of nine axes still inside the human
   *  envelope**: the matches, the win rate and the money all look like a career that is working. The
   *  coach already says the same thing on the card (`coachLadderNote`), about 1,150 times a career,
   *  which is background rather than signal. This is the season's own count of it.
   *
   *  ⚠ CAPTURED AT ENTRY, NEVER RECONSTRUCTED, and that is the whole reason it is persisted state
   *  rather than a fold. The judgement is «could a title here have entered the book SHE HELD THAT
   *  WEEK», and the book at week W is her results over [W-52, W] – rows `pruneResults` has already
   *  deleted by the wrap. Two ledgers have produced a wrong wrap-up line here for exactly this reason
   *  (`bestResultText` off the 400-row event feed; the season money off the same feed), so this one is
   *  counted in the branch that commits the entry and read at the wrap.
   *
   *  OPTIONAL, AND ABSENT MEANS ABSENT. A migration cannot back-fill a judgement made at a week whose
   *  evidence is gone, so a season that began before the counter did carries no pair at all and the
   *  card shows no line – which is honest, where a 0 would read as "none of them". */
  entryMirror?: SeasonEntryMirror
}

/** The pair the wrap-up prints: how many tournaments the season entered, and how many of those were
 *  entered into a book that could not have taken their title.
 *
 *  ⚠ BOTH NUMBERS COME FROM ONE LEDGER, WHICH IS THE POINT OF PUTTING THEM IN ONE OBJECT. The
 *  denominator cannot be counted off `world.results` – a result row is AWARD-ONLY, so a season of lost
 *  openers leaves no row (see `seasonBestFinish`) – and it cannot be counted off `world.events`, which
 *  is capped at 400 rows. Counting both at the same commit is what stops the line from being a ratio
 *  of two different seasons. */
export interface SeasonEntryMirror {
  /** tournaments entered during the season and PAID FOR. The count follows the fee: a withdrawal
   *  inside the deadline hands the money back and is un-counted with it, every forfeiting exit (a
   *  late cancel, a skip, a medical forfeit) keeps its entry – the same rule `releaseEntry` already
   *  applies to the ITF participation slot. */
  entered: number
  /** ...of those, how many could not have moved her on the table this card names. See
   *  `entryCouldNotMove` in engine/world/ladder.ts for the rule and the measurement that chose it. */
  couldNotMove: number
}

/** THE PERSISTED HALF: the season's entry ledger, written at the entry choke point and reset by the
 *  wrap-up (schema v45). `SeasonEntryMirror` above is what the wrap BANKS out of this.
 *
 *  ⚠ IDS AND NOT TWO COUNTERS, and the reason is a measured off-by-a-season. The count follows the
 *  fee, so a refunding withdrawal has to un-count its entry – and an entry taken in week 45 of one
 *  season can be withdrawn in week 2 of the next, after the wrap has already banked and reset. Two
 *  bare integers would then decrement a season that never counted that entry. The id says which
 *  season's ledger owns the row, so the wrong one cannot be debited.
 *
 *  ⚠ AND `closed` IS A SUBSET OF `entered`, WRITTEN AT THE SAME MOMENT rather than re-derived on the
 *  way out. `bookClosedTo` at withdrawal time would answer about a book that has since moved, which is
 *  the recomputation this whole field exists to avoid.
 *
 *  Bounded by construction: one entry per week is a rule (`enterEvent`), and the ledger resets every
 *  52 weeks, so neither array can exceed a season's worth of ids. */
export interface SeasonEntryLedger {
  /** the week the ledger began counting. The wrap prints its pair only when this is at or before the
   *  season's first week – a ledger that started mid-season describes part of a season, and a part is
   *  not a statistic. */
  fromWeek: number
  /** one row per entry committed since `fromWeek` and not refunded. */
  rows: SeasonEntryRow[]
}

/** ONE ENTRY, AS THE WEEK IT WAS MADE SAW IT.
 *
 *  ⚠ THE SPLIT BETWEEN WHAT IS CAPTURED AND WHAT IS FOLDED IS THE WHOLE DESIGN, and it is a fix for a
 *  contradiction found in the browser. Two of these three facts are about her BOOK, which
 *  `pruneResults` deletes 52 weeks later, so they must be captured. The third – which table the rung
 *  pays into – is a property of the calendar and never decays, so it is stored raw and compared at the
 *  wrap against `SeasonSummary.rankTrack`, the table the card itself names two rows above the line.
 *
 *  Judging the table at ENTRY time instead (against `activeLadderOf`) printed a card reading
 *  «Final national rank #3» over «13 could not move her ranking», where all thirteen were the domestic
 *  events that had made her third. One card, two tables, and the reader is right and the card is
 *  wrong – which is the same defect the wrap-up's junior-rank line was, arriving through a new door. */
export interface SeasonEntryRow {
  id: string
  /** which table this rung pays into. Durable: a property of the tier, not of her. */
  track: LadderTrack
  /** CAPTURED: she had already climbed past the rung when she entered (`hasOutgrown`). */
  outgrown: boolean
  /** CAPTURED: her best-N book on that rung's own table was shut to its title (`bookClosedTo`) – the
   *  window was full and its weakest counted row already paid at least what winning would pay. */
  bookShut: boolean
}

/** ONE SEASON, ON ONE TABLE (schema v46) – the per-track half of a `SeasonHistoryEntry`.
 *
 *  ⚠ IT IS `seasonRecord`'S SHAPE, WIDENED, AND DELIBERATELY NOT A SECOND CONVENTION.
 *  `Snapshot.seasonRecord` is `Record<LadderTrack, { wins, losses }>` – the live season's W-L told
 *  apart by table – and this is the same record with the two figures a FINISHED season also has:
 *  where she ended and what she earned. A career's history is therefore read with the same keys and
 *  the same mental model as the season in progress, and the wrap-up banks one from the other.
 *
 *  ⚠ `endRank` IS OPTIONAL AND THE OPTIONALITY IS LOAD-BEARING – the `spentCents` contract, one
 *  field over. Absent means SHE HELD NO COUNTING RESULT IN THIS TABLE, which is not a place: with
 *  nobody holding a point the whole field ties at zero and competition ranking hands every member of
 *  that tie the same number, which is the tie-floor `LadderView.rank`'s null exists to refuse to
 *  print. A surface reading this prints silence, never a number and never a zero.
 *
 *  The other three are always written, because a season that was played on another table really did
 *  score nothing here, win nothing here and lose nothing here – those zeros are measurements. */
export interface SeasonTrackRow {
  /** her dense place in THIS table at the wrap; absent when she was not ranked in it at all */
  endRank?: number
  /** ranking points earned in-season IN THIS TABLE'S CURRENCY – never added to another track's */
  points: number
  wins: number
  losses: number
}

/** One FINISHED season, appended to the career's history at wrap-up (schema v14, R10-9).
 *  `lastSeasonSummary` above is overwritten every year, so there was no way to compare against
 *  last season; this is the append-only list behind the Stats screen's season-by-season table.
 *  Deliberately TINY – a couple of dozen numbers per SEASON (never per week), so a decade of career
 *  costs bytes, not kilobytes: no strings, and the full recap keeps living in SeasonSummary. */
export interface SeasonHistoryEntry {
  /** THE SEASON'S IDENTITY: its 0-based index (`floor(week / WEEKS_PER_YEAR)`), schema v16.
   *
   *  This used to be `year`, the calendar year of the season's first Monday, and that is a value
   *  that REPEATS: a season is 52 weeks = 364 days, so its opening Monday walks ~1.25 days earlier
   *  every year and steps back over New Year at season 5 – `weekYear(208)` and `weekYear(260)` are
   *  both 2035. The wrap-up's "already banked?" guard tested that year, so season 5 looked like a
   *  season already in the list and its whole row was dropped: the player lost a season out of the
   *  Stats table at age 19, from the very feature that table exists for.
   *
   *  An index cannot drift, cannot repeat and needs no calendar to compute. The year the table
   *  PRINTS is derived from it (`seasonYear(seasonIndex)`, shared/dates.ts) – the same function
   *  `weekLabel` uses, so a row's header and the week labels inside that season always agree. */
  seasonIndex: number
  /** her dense rank at the season's wrap-up. ⚠ THE ITF ONE, always – the wrap writes `world.kidRank`,
   *  which is the international alias. See `byTrack` below for the other two tables. */
  endRank: number
  /** ranking points earned in-season, ALL THREE TABLES ADDED TOGETHER. A fold, and it is kept as one
   *  because `matchesEverPlayed` and the radar's confidence read these totals; `byTrack` splits them. */
  points: number
  wins: number
  losses: number
  /** v46 – THE SAME SEASON, TOLD APART BY TABLE (the owner, twice: «Season by season в stats в разных
   *  вкладках всё ещё одно и то же показывает»).
   *
   *  ⚠ IT HAD TO BE A SCHEMA CHANGE AND COULD NOT BE FIXED ON THE SCREEN. The four figures above are
   *  one rank (the ITF one) and three folds, so the Stats table showed the identical row under all
   *  three tabs for the only possible reason: the record had nothing else in it. No amount of work in
   *  `StatsScreen.vue` can split a number that was never stored apart.
   *
   *  ⚠ OPTIONAL, AND ABSENT MEANS "NOT RECORDED" RATHER THAN "ZERO" – the distinction the season
   *  mirror was built around (v45: a zero is a claim, and «0 could not move her ranking» is the good
   *  news printed over a season nobody counted). Rows banked before v46 have no per-track figures and
   *  none can be invented: `pruneResults` keeps a rolling 52 weeks, so the results that produced those
   *  seasons were deleted years before the question was asked. See the v45 -> v46 step in
   *  engine/migrations.ts for what an old row is therefore allowed to say.
   *
   *  TOTAL over `LadderTrack` on purpose, like `seasonRecord`: a fourth table cannot ship without a
   *  season history that knows about it. */
  byTrack?: Record<LadderTrack, SeasonTrackRow>
  /** signed funds delta across the season */
  fundsDeltaCents: number
  /** the balance she ended the season with (the "how much is left" figure) */
  endFundsCents: number
  /** best tournament finish index that season (0 = champion). Absent when she played none, and
   *  on rows the v14 migration backfilled (the old summary stored only prose for it). */
  bestFinish?: number
  /** W7 – WHAT THE SEASON COST, gross, in positive cents. The owner: «было бы очень интересно где-то
   *  хранить всю историю затрат за карьеру по годам в каком-то виде.»
   *
   *  ⚠ THE NET WAS ALREADY HERE AND IT IS NOT THE SAME QUESTION. `fundsDeltaCents` answers "did the
   *  family end the year up or down", which a season of big prize money and bigger bills can report
   *  as a shrug. He asked about ЗАТРАТЫ – what it cost to keep her playing – and gross spend is the
   *  only number that says it. Both are kept because both are true and neither implies the other.
   *
   *  ⚠ AND IT HAD TO BE BANKED HERE OR IT WAS GONE FOR EVER. The per-category ledger
   *  (`WorldState.financeWeeks`) is pruned to a 60-week trailing window, so a career keeps roughly
   *  1.15 YEARS of spending detail and nothing older – season 1's spend is unrecoverable by the time
   *  season 3 opens, from the save and from anywhere else. `maybeFireSeasonWrapUp` was already
   *  computing this exact figure off that ledger at the wrap-up (when the whole season is still
   *  inside the window) and dropping it into `lastSeasonSummary`, which is overwritten every year.
   *  Banking it costs two numbers a season against a 30-season cap.
   *
   *  OPTIONAL, AND THE OPTIONALITY IS LOAD-BEARING: rows written before v28 have no gross figure and
   *  none can be invented for them, so the surface that reads this must print silence rather than a
   *  zero. Same contract as `bestFinish` above and `SeasonSummary.spentCents`.
   *
   *  BOUNDARY, stated once so both readers agree: the window ENDS at the wrap-up week, so the
   *  season's last two off-season weeks are not in it. That is deliberate and is the same window
   *  `SeasonSummary` reports – the figure describes the season she PLAYED. */
  spentCents?: number
  /** what the season brought in, gross, in positive cents. Same window, same optionality, and it is
   *  here so a year can be read as a pair: a season that cost $9k and earned $4k is a different
   *  story from one that cost $9k and earned nothing, and `fundsDeltaCents` alone tells neither. */
  earnedCents?: number
}

// --- Tournament experience (feat/tournament-experience) -----------------------
// One revealed round on the kid's path through the bracket (the between-rounds strip).
export interface PendingBracketRound {
  roundLabel: string
  /** short opponent name */
  oppName: string
  kidWon: boolean
  /** kid's-perspective scoreline, e.g. "6-4 3-6 7-6" */
  score?: string
}

/** One match in the FULL draw view (Round 5 item 5) – every match of a revealed round,
 *  not just the kid's. AI-vs-AI matches never carry a `score` (they resolve from a single
 *  closed-form probability draw, no point-by-point sim), so it stays undefined for those. */
export interface FullBracketMatch {
  round: number
  roundLabel: string
  aId: string
  bId: string
  aName: string
  bName: string
  winnerId: string
  /** kid-vs-anyone matches only; AI-AI matches have no simulated scoreline */
  score?: string
}

/** The live view of an in-progress tournament reveal. Present on the snapshot only while
 *  `world.pendingTournament` is set; drives the full-screen TournamentFlow overlay. Lean:
 *  enough for the pre-match card, the post-match card, the bracket strip and the finale. */
export interface PendingView {
  eventId: string
  /** ⭐⭐⭐ ROUND 26 #6 – NULL IS «THIS FIXTURE HAS NO RUNG», AND IT IS THE ONE DISCRIMINATOR THE
   *  AMATEUR REVEAL NEEDS. The owner: «в чем проблема использовать наш флоу турниров полностью и
   *  дать возможность игроку их смотреть и сопереживать? Я уже просил это сделать».
   *
   *  The College League is played through `simulateMatch` like everything else and is now walked in
   *  `TournamentFlow` like everything else – but it awards no ranking points and no prize money
   *  (round 25's ruling, and it is what keeps the fork a real choice), so there is genuinely no
   *  `TierId` behind it. `collegeLeagueMatchId` already refuses to name one for the same reason.
   *
   *  ⚠⚠ A NULL RATHER THAN AN INVENTED RUNG IS THE WHOLE SAFETY OF THIS. Every arithmetic that could
   *  pay her is reached through `TIERS[tier]` – `finalizeTournament`'s points table, `prizeCentsFor`,
   *  `trophiesByTier` – so a view that HAS no tier cannot be plugged into any of them by accident.
   *  The five facts the flow actually prints (`tierLabel`, `points`, `finishLabel`, `roundLabel`,
   *  `surface`) are already resolved on this view and carry the amateur answers: the label is the
   *  competition's own name, and `points` is 0. */
  tier: TierId | null
  surface: Surface
  /** THE DAY'S TEMPERATURE, for the live match's weather plate. The SAME number the Season card
   *  showed for this tournament – `eventTemperature`, one source, so the two surfaces cannot
   *  disagree about the weather at one event. Decorative: nothing reads it but a screen.
   *  ⚠ `upcoming` is filtered to `week > world.week`, so an event BEING PLAYED has already dropped
   *  out of it and its preview is unreachable. That is why this rides on the pending view instead
   *  of the viewer re-deriving it – two call sites computing one number is how they drift. */
  temperatureC: number
  /** stage of the round currently being presented, e.g. "Round of 16", "Final" */
  roundLabel: string
  /** ⭐ ROUND-21 #2 – DID THE COACH COME? The owner, third ask: «Присутствие в потоке и трансляции
   *  точно надо (если едет).» This is the "в потоке" half.
   *
   *  It rides here rather than being re-derived in the component for the same reason `temperatureC`
   *  and `ladder` do, and the reason is sharper for this one: the flow, the live commentary and the
   *  week's story must all be describing the SAME trip, so `coachTravelsWithHer` is asked once, in
   *  the engine, and the answer is carried. A screen that re-read `coachBilling.onEventWeeks` would
   *  also be re-deriving the "and there IS a coach" clause, which is exactly the half a self-coached
   *  career gets wrong. */
  coachTravelled: boolean
  /** WHICH TABLE THIS TOURNAMENT IS PLAYED ON – `TIERS[tier].track`, carried rather than re-derived.
   *
   *  ⚠ THE BUG THIS CLOSES (31.07, fix/ladder-separation). The owner, after a National: «по итогам
   *  матча national в таблице пишут # из international». Every rank on this overlay – the splash's
   *  VS panel, the pre-match scene, the post-match box score, and the two the live MatchViewer
   *  prints over the players' heads – came from ONE table: the kid's off `Snapshot.kidRank` (the
   *  ITF alias) and the opponent's off `fullRanking`, which is `rankingFor(world, 'itf')` with its
   *  name filed off. So a National quarter-final between two girls with no international result
   *  showed two numbers from a table neither of them was playing in, next to a trophy worth 70
   *  NATIONAL points. Two currencies with no exchange rate (docs/specs/two-ladders.md) and the one
   *  screen where both players are on the court at once was quoting the wrong one.
   *
   *  It rides on the pending view rather than being re-derived in the component for the same reason
   *  `temperatureC` does: the event has already dropped out of `upcoming` by the time it is played,
   *  and a second derivation of "which ladder is this" is a second thing to get wrong.
   *
   *  ⚠⚠ NULL MEANS «NONE OF THE THREE», AND IT IS THE ROUND-27 #4 HALF OF THE SAME BUG. The owner,
   *  27.08: «на экране итогов матча the College League написано Professional ranking – как будто
   *  нет». `LadderTrack` is `'domestic' | 'itf' | 'wta'` – three real tables and no fourth answer –
   *  so a fixture played in NONE of them still had to name one, and the College League was carried
   *  as `'wta'` with a note saying the screen would not print it. The screen printed it: the box
   *  score's own «… · {ladder} ranking» line had no amateur branch, and «Professional» is
   *  `LADDER_LABEL.wta`. That is this field's founding bug read from the other end – two ranks are
   *  not being compared across two currencies, ONE table is being named over a fixture that awards
   *  nothing at all.
   *
   *  ⛔ NOT A FOURTH `LadderTrack` MEMBER: this is the ABSENCE of a table, not another one, and
   *  `LADDER_LABEL`, `LADDER_TRACKS` and `LadderViews` are total records that would all have to be
   *  taught a ladder that does not exist. ⛔ AND NOT A SECOND BOOLEAN BESIDE IT: two fields for one
   *  fact is precisely how the first version of this bug happened.
   *
   *  ⚠ THE SECOND FIXTURE IS THE NATIONS CUP AND IT IS NOT ON THIS VIEW YET. The tie is played
   *  outside all three tables too (`engine/nationalTeam.ts`: no points, no cheque), and spec §6
   *  routes it through `TournamentFlow`. Whoever builds that sets this to `null` and the ranking
   *  line stays off by construction – the type can say «neither» now, so nothing has to remember to.
   *  ⚠ What that wave DOES have to write is its own amateur sentence: the splash's «a student field
   *  awards neither» is the College League's, and a national squad is not a student field. */
  ladder: LadderTrack | null
  /** HER rank in `ladder`, or null when she holds no counting result in it.
   *
   *  ⚠ NULL IS NOT #1 and it is not the tie floor either – the same distinction `LadderView.rank`
   *  carries, for the same reason. This used to be read off `Snapshot.kidRank`, which is a NUMBER at
   *  all times: with nobody holding a point the whole field ties at zero, competition ranking hands
   *  every member of that tie the same place, and `recomputeKidRank` falls back to `cohort.length + 1`
   *  on top of that. So a fourteen-year-old walking into her first Local Open was introduced on the
   *  splash as "Rank #119". */
  kidRank: number | null
  /** the kid's opponent this round: short name, ISO-2 nation, her rank IN THE SAME TABLE – null when
   *  she holds no counting result in it, by the identical rule; a rank printed beside another rank has
   *  to be measured in the same units or the comparison the card invites is a lie – and HOW OLD SHE IS
   *  (the owner: «и в турнирах перед матчем тоже можно показывать»).
   *
   *  ⚠ THE AGE COMES OFF THE FROZEN MATCH PLAYER, not off today's cohort row, and that is the same
   *  ruling `MatchPlayer.age` carries: the composed player is what the save keeps, so a card re-opened
   *  three seasons later reports the girl who played, not the girl she has since become. `null` on a
   *  reveal frozen before ages were composed (see LEGACY_SNAPSHOT_AGE) – a blank, never a guess. */
  opponent: { name: string; nation: string; rank: number | null; ageYears: number | null }
  /** the current round's record – MatchReplay source + post-match stats */
  kidMatch?: WorldMatch
  /** revealed rounds so far, the kid's path (oldest first) */
  bracket: PendingBracketRound[]
  /** every match (all players) from every round revealed so far, round order (Round 5 item 5) */
  fullBracket: FullBracketMatch[]
  /** true once the last kid match has been revealed and the run finalized */
  finished: boolean
  kidChampion: boolean
  /** finale card copy */
  tierLabel: string
  points: number
  finishLabel: string
  /** how many people came, for the E brief's fourth fact. The SAME decorative reading the Season
   *  card's `UpcomingEvent.preview.crowd` carries, off the same `seed:crowd:<eventId>` sub-stream –
   *  carried here because a preview leaves the snapshot the week its event arrives (upcomingEvents
   *  filters to `week > world.week`), and screen E must not print a second, different number for the
   *  same tournament. Decorative: nothing in the simulation reads it (engine/season/preview.ts). */
  crowd: number
}

/** One rung's remaining supply this season. `open` counts events she may still enter (her own
 *  entries included); `entered` is how many of those are already hers. */
export interface SeasonSupplyRow {
  tier: TierId
  open: number
  entered: number
}

/** THE PLANNING COUNTER: how much tennis is left this season, and on which rungs. Ladder order,
 *  rungs with nothing left omitted entirely - the list is what she can still do, not a table of
 *  zeroes. */
export interface SeasonSupply {
  /** weeks between now and the season's last week (the off-season is inside the count, because it
   *  is inside the season block - a card that says "over 12 weeks" must not promise playable ones) */
  weeksLeft: number
  rows: SeasonSupplyRow[]
}

export interface UpcomingEvent {
  id: string
  week: number
  tier: TierId
  surface: Surface
  /** ⭐⭐ THE ALTERNATES LIST, 18.08 – her place in the queue below this rung's cut (1 = first in
   *  line, 0 = not on the list at all) and how many chairs the field's withdrawals have opened.
   *
   *  ⚠⚠ BOTH NUMBERS ARE HERE SO THE CARD CAN SHOW THEM BEFORE SHE COMMITS, WHICH IS THE WHOLE
   *  DESIGN. The owner refused a probabilistic tail twice because «заявка станет частично броском
   *  кубика, а это реальная потеря в игре про планирование сезона», and accepted this because the
   *  numbers are readable in advance: "two places open, you are first in line" is something a parent
   *  can plan a season around, and a hard cut tells her nothing about next week.
   *
   *  The world rolls `alternatesOpen` – a fact about the FIELD, on its own event-keyed sub-stream.
   *  `alternateQueue` is arithmetic off the table and never rolls. */
  alternateQueue: number
  alternatesOpen: number
  /** what the Season card may say about an event she has not played: her odds in ROUND ONE against
   *  the field as it would be drawn today, who that opponent would be, how strong the field is, and
   *  two decorative readings (the temperature and the crowd). Derived at snapshot time, persists
   *  nothing, and draws only on the event's own `seed:kidtour:` / `seed:weather:` / `seed:crowd:`
   *  sub-streams. Explicitly an estimate about a field that will have moved by the time the event
   *  plays – see engine/season/preview.ts. */
  preview: EventPreview
  travelCostCents: number
  deadlineWeek: number
  entryFeeCents: number
  label: string
  entered: boolean
  /** whether she may ENTER this event right now – the verdict of the engine's one entry gate
   *  (`entryStatus` = point band + availability). Snapshot-only (derived from the results ledger at
   *  snapshot time), so it persists nothing and bumps no schema.
   *
   *  Round-10 R10-5/R10-3, and this is the part that bit: `eligible` is about ENTERING, never about
   *  an entry already made. An entry survives a band crossing once its list has closed (the fee is
   *  committed and the event plays), so an `entered` card can legitimately read `eligible: false` –
   *  and the UI must show it anyway, with `cancellable` as its way out. Hiding or locking an entered
   *  card on this flag is what produced the dead end. */
  eligible: boolean
  /** R10-13: the entry is COMMITTED (its list has closed) but its week has not started – the window
   *  in which the player may CANCEL, forfeiting the fee, and get the week back for a practice match
   *  or a family vacation. Before the deadline the same control is an ordinary refunded withdrawal;
   *  once the week starts, the tournament flow's Skip owns it. */
  cancellable: boolean
  /** why the kid HARD-cannot enter, for the UI lock label; absent when eligible. Point-band reason:
   *  'locked' = not enough ranking points yet (below the tier's minPoints), or below an acceptance
   *  cut. ⚠ 'outgrown' LEFT THIS UNION on 06.08 and is `outgrown` below – a rung she has passed no
   *  longer refuses her. Hard availability blocks (Season-Life slice B, checked after the point band):
   *  'unavailable' = school exams / off-season / a booked family vacation; 'injured' = she is out;
   *  'medical' = the doctor's veto below ECONOMY.availability.medicalFloor (the one hard body-gate
   *  – see availabilityStatus). Ordinary fatigue is NOT here – it is a soft, warned CHOICE (see
   *  cautionReason), so a fatigued event stays eligible.
   *  'capped' = she has spent her year's allowance of INTERNATIONAL entries (the ITF annual entry
   *  cap, docs/research/ranking-points-by-tier.md §2) – a hard block, but one that lifts by itself
   *  when the season turns, which is why it is its own reason and not folded into 'unavailable'. */
  ineligibleReason?: 'locked' | 'injured' | 'unavailable' | 'medical' | 'capped'
  /** ⭐ THE ENGINE'S OWN SENTENCE for the refusal above – `cautionDetail`'s twin, one gate up.
   *
   *  ⚠ IT EXISTS BECAUSE 'unavailable' IS FIVE REFUSALS WEARING ONE CODE (round-17 #19): a tour
   *  suspension, the tier's age door, a booked family vacation, a school exam week and the
   *  off-season all arrive as `'unavailable'`, and a client holding only the code cannot tell them
   *  apart. SeasonScreen's lock pill guessed, and its guess was "Exams this week" – which it printed
   *  on a Junior Tour 30 offered to a twenty-year-old, two years past her last exam. `availabilityStatus`
   *  writes the true sentence for every arm and it was being discarded at this boundary.
   *
   *  Absent on old fixtures and on any gate that produced no detail, so every reader must keep a
   *  fallback – but the fallback must not be a SECOND GUESS at which refusal this was. */
  ineligibleDetail?: string
  /** ⭐ THE TOUR'S PRO ALLOWANCE FOR **THIS EVENT'S** SEASON – present on every rung the rule counts
   *  (`ECONOMY.entryCap.cappedProTiers`), whether or not this card is blocked.
   *
   *  ⚠ IT IS PER-EVENT AND `Snapshot.proEntryCap` IS NOT, and round-17 #2 is the difference. The
   *  season card's budget chip read the snapshot-wide number – one read, at `world.week` – and
   *  attached it to every W card in an EIGHT-WEEK horizon. From about week 44 that horizon holds
   *  cards belonging to the next season block, so each of them printed the OLD season's `16 / 16`
   *  and the allowance looked as though it never reset. It always reset: `proEntryCapUsage` filters
   *  `proEntryWeeks` to `seasonStartWeek(week)`, so the counter is a filter and a missed reset is
   *  unexpressible. What was wrong was the WEEK it was asked about – the same lesson `pointsToEnter`
   *  and `entryCap` already carry.
   *
   *  ⚠ AND SINCE P2 THAT WEEK MATTERS MORE, not less: the allowance's window is her BIRTHDAY YEAR
   *  now, so an eight-week horizon can cross the turnover in the middle of a season block. The
   *  function is unchanged in shape – ask it about the event's week and it answers about the
   *  allowance the event is in. */
  proEntryCap?: EntryCapUsage
  /** SHE HAS PASSED THIS RUNG – and it is not a lock (the owner's ruling on backlog #84, 06.08,
   *  quoted verbatim in docs/specs/ladder-floor-2026-08.md: no lower bound at all, let her play, and
   *  lead with the more relevant tournament of the week when there is one). 'outgrown' used to be an
   *  `ineligibleReason` above and is deliberately no longer in
   *  that union: it is orthogonal to whether she may enter, so the compiler is what stops a surface
   *  from reading it as a refusal again. An outgrown card is ENTERABLE, says so, and loses the week's
   *  slot to any rung she has not passed – see `preferredWeekEvent`. */
  outgrown?: boolean
  /** ⭐⭐ HER PLACE HERE IS A WILD CARD, not a direct acceptance (round 21 #2b, 17.08). A Grand Slam's
   *  128 is 112 direct acceptances + 8 qualifiers + 8 wild cards, and these are the eight the
   *  tournament gives away – ours go to players of the HOST NATION whom the acceptance list refused.
   *  See `WILD_CARD` in engine/season/tournament.ts for the whole rule, including which of reality's
   *  three grounds we can express and which one is not expressible at all.
   *
   *  ⚠ PRESENT ONLY WHEN THE LIST WOULD HAVE REFUSED HER, which is what keeps the badge honest: the
   *  rule's first clause is "outside `acceptsRank`", so a direct acceptance never carries it and the
   *  card can never claim she was given a place she earned.
   *
   *  Snapshot-only and derived, exactly like `eligible` and `outgrown`: the host nation is a pure
   *  function of `(seed, event.id)` and her rank is folded from the ledger, so nothing is persisted
   *  and no save schema moves. */
  wildCard?: boolean
  /** a SOFT warning on an event the kid CAN still enter (eligible stays true): 'fatigued' = her
   *  condition is below the tier's floor, so racing risks a deeper hole / injury. The owner's call
   *  is that a tired body is a tough-parent decision, not a hard rule. */
  cautionReason?: 'fatigued'
  /** human-readable caution copy for the soft-warning UI (short dash). */
  cautionDetail?: string
  /** THE HIRED COACH'S OWN OPINION about this trip (docs/specs/coach-as-load-manager.md §8), or absent.
   *
   *  Present only when a coach is HIRED and he would advise against it; never on a self-coached career,
   *  because there is nobody to have the opinion. A SENTENCE rather than a flag, for the same reason
   *  `cautionDetail` is one: the card prints what he said.
   *
   *  ⚠ ITS OWN FIELD, NOT A NEW `cautionReason`, and the two are independent on purpose. `'fatigued'`
   *  is the ENGINE's rule (she is under `minConditionToEnter`), and this is a PERSON's read of her -
   *  which can fire when the engine's rule does not, because the coach's margin is scaled by what he
   *  believes about her stamina. A cheap coach who thinks she is tough will stay quiet on a trip the
   *  fatigue caution is already flagging; an expensive one will speak up before it does. Folding them
   *  into one enum would have made those two states indistinguishable, and the gap between them IS the
   *  thing being sold.
   *
   *  NEVER A BLOCK. "The parent may push" is a standing rule of this game and the doctor's veto
   *  (`ineligibleReason: 'medical'`) is its single exception. `eligible` stays true. */
  coachCaution?: string
  /* ⚠ `costsCollege?: boolean` WAS HERE (P4) AND IS REMOVED ON THE OWNER'S RULING OF 16.08. It carried
   *  P4's warning – *"a result here can cost the college place at nineteen"* – to both entry paths,
   *  and it was true of the rule as it then stood. College is an independent branch now and no result
   *  closes it, so the field would be reporting a consequence that cannot happen. It was optional and
   *  derived at snapshot time, never persisted, so nothing in the save schema moves with it: the
   *  record of the whole rule is on the retired `ENDINGS.collegeClosedFromTier`. */
  /** the tier's minPoints threshold, present only when 'locked', so the UI can show "Reach N pts". */
  pointsToEnter?: number
  /** the ITF rank an international rung accepts down to, on a card locked by an ACCEPTANCE LIST
   *  rather than by points (docs/specs/two-ladders.md). The card says "takes the top N" instead of
   *  quoting a points number she cannot read off her own table. N is DERIVED from the tier's
   *  `enterPct` and the live field size (see acceptanceRank), so it moves with a re-picked list and
   *  with the population - do not quote a literal here, as the "top 50" this comment used to name
   *  was stale by two re-pins when it was found on 30.07. */
  rankToEnter?: number
  /** the ITF annual allowance THIS event is judged against, so the card can print "N of M" without
   *  re-deriving it. Per-event for the same reason `pointsToEnter` is – an event in the next
   *  allowance year is measured against a different year's ledger than today's.
   *
   *  ⚠ PRESENT ON EVERY JUNIOR CARD SINCE P2, NOT ONLY ON A REFUSED ONE. It used to be written only
   *  when the verdict was 'capped', which meant the one number a parent needs in order to SPEND the
   *  allowance sensibly arrived after it was spent – the fuel gauge that lights up when the tank is
   *  empty. `proEntryCap` one table up has ridden every professional card since round-17 #2; this is
   *  the same fix on the same terms, and the two families are disjoint so no card carries both. */
  entryCap?: EntryCapUsage
}

/** The ITF annual entry cap as it stands for ONE season (docs/research/ranking-points-by-tier.md
 *  §2, Appendix F of the 2026 ITF junior regulations): how many INTERNATIONAL events (j30/j60/j300)
 *  a player of that age may enter in a year, and how many of them she has already spent. The
 *  domestic tiers are our own invention and are not counted – see ECONOMY.entryCap.
 *  `limit === Number.MAX_SAFE_INTEGER` means unrestricted (17 and over). */
/** WHICH RUNGS THE ENGINE WILL ACTUALLY LET HER ENTER, as the engine itself decides it
 *  (`tierOpenFor`). Derived at snapshot time; persists nothing.
 *
 *  ⚠ IT EXISTS BECAUSE THE TWO LADDERS BROKE A SHARED ASSUMPTION. `composables/tierState.ts` read
 *  `enterPointBand` for every tier, which was the one rule while every rung gated on points. Since
 *  the two-ladder slice, J60 and J300 gate on her ITF RANK POSITION and their bands are `[0, MAX]` -
 *  so the readout said "Unlocked - enter your first!" about events the engine refuses, which is
 *  exactly the failure HomeScreen's own comment warns against. The screens now ask the engine
 *  rather than re-deriving a rule that no longer covers every rung. */
export type TierOpenMap = Record<TierId, boolean>

/** Why one rung is shut, as `Snapshot.tierRefusal` carries it – the engine's `EntryStatus` narrowed
 *  to the half a rung can answer. `detail` is the refusal's own words, the same string an event's
 *  card gets, because 'unavailable' alone is five different refusals collapsed into one code. */
export interface TierRefusal {
  reason: 'locked' | 'injured' | 'unavailable' | 'medical' | 'capped'
  detail?: string
  pointsToEnter?: number
  rankToEnter?: number
  entryCap?: EntryCapUsage
}

export interface EntryCapUsage {
  used: number
  limit: number
  /** `limit - used`, floored at 0. `remaining <= 0` is the whole gate. */
  remaining: number
}

// --- THE TITLES LEDGER (schema v31, the Trophy Cabinet) ----------------------------------------

/** Every gold and every silver she has ever taken at ONE tier, as the WEEKS they happened in.
 *
 *  ⚠ `finals` MEANS SHE LOST THE FINAL, and it is the one thing about this shape that has to be
 *  read carefully, because the game already has a second, incompatible sense of the word.
 *  `MilestoneType: 'final'` means SHE REACHED a final, so a title captures it too (`kidFinish <= 1`
 *  in finalizeTournament) - correct for a memory ledger, where "the first final she ever played" is
 *  the moment worth remembering. This ledger counts OBJECTS IN A CABINET: a runner-up plate and a
 *  winner's trophy are two different pieces of silverware and one week produces exactly one of
 *  them. If `finals` included titles, the silver plate would light up the first time she WON
 *  something, and its count would read "5" for a tier she never actually lost a final at. So the
 *  two arrays are disjoint by construction (`=== 0` and `=== 1`, never `<= 1`) and runner-up is
 *  countable on its own, which is the only way the silver half of the screen can be honest.
 *
 *  WEEKS, NOT COUNTS, and not years either. A count could not answer "in which years", which is
 *  half of what the owner asked the screen to say; a YEAR could not be recomputed if the season
 *  arithmetic ever moves, and it would freeze into the save a display decision that belongs to the
 *  reader. The absolute career week is the engine's own unit for everything else it persists, so it
 *  is what gets stored, and the screen derives the year with `seasonYear(Math.floor(week / 52))`.
 *
 *  ⚠ NOT `weekYear(week)` - that is the real calendar year of that week's Monday, and it COLLIDES:
 *  a season is 364 days, so the opening Monday drifts back a day and a quarter a year and
 *  `weekYear(208) === weekYear(260) === 2035`. Two consecutive seasons would print as the same
 *  year and their trophies would merge into one group. That exact collision already ate a season
 *  out of the Stats history table once (see `seasonYear` in shared/dates.ts and the v16 migration).
 *
 *  Append-only and bounded by how many tournaments a career can play, so it is never pruned - which
 *  is the whole reason it exists. Ordered by construction: `finalizeTournament` pushes as weeks
 *  happen, so both arrays are ascending and the screen can group without sorting. */
export interface TierTrophies {
  /** the weeks she WON this tier. `kidFinish === 0`. */
  titles: number[]
  /** the weeks she LOST A FINAL at this tier. `kidFinish === 1` - never a title. */
  finals: number[]
}

/** The kid's current run of consecutive COMPETITIVE losses, and the threshold at which this
 *  particular run turns her face angry (fix/world-trio item 3, owner's call).
 *
 *  Computed by the ENGINE (it owns the seed, the full event log and the RNG discipline) and carried
 *  on the snapshot so the pure `avatarEmotion` decision only has to compare two numbers. Null when
 *  her most recent competitive match was a WIN, or when she has never played one.
 *
 *  WHAT COUNTS (see `computeLossStreak` in engine/world.ts for the reasoning):
 *   - a tournament match she lost           -> counts, and extends the streak;
 *   - a tournament match she won            -> BREAKS the streak (nothing else does);
 *   - a practice friendly, either result    -> invisible (R11-2: a friendly never moves her face);
 *   - a walkover / medical withdrawal       -> invisible: she never took the court, so there is no
 *                                              defeat to add and nothing to forgive either. */
export interface LossStreak {
  /** consecutive competitive losses ending at her most recent competitive match (>= 1) */
  losses: number
  /** the week the streak's FIRST loss was played – the sub-stream key `angerAt` is drawn on, and
   *  what makes the threshold stable for the life of one streak instead of re-rolled per render */
  startWeek: number
  /** how many consecutive losses THIS streak needs before her face turns angry (4..6, drawn once) */
  angerAt: number
}

/** R12-15 / R12-3 – WHAT THE "next week" BUTTON IS ACTUALLY ABOUT TO DO.
 *
 *  The sticky bar's label used to be derived from one fact: is there an entered event on
 *  `week + 1`? If yes it said "🏆 Play {TIER} ▶", whatever her body or her ranking points had done
 *  since. So an entry that was going to resolve as a walkover was advertised as a tournament, and
 *  a committed entry to a tier she had outgrown was advertised as an ordinary one.
 *
 *  This is the ENGINE's own arrival verdict for that event (`arrivalStatus` in engine/world.ts) –
 *  the very verdict `tickWeek` will resolve the week with – carried on the snapshot so the button
 *  reads it instead of guessing. Null when no entry sits on `week + 1`.
 *
 *  ONLY FACTS ARE PREVIEWED. The layoff window and the point band are pure state: they cannot
 *  change between this snapshot and the tick that reads them, so previewing them is safe. The
 *  DOCTOR's arm is deliberately absent – his verdict is re-read on arrival against a condition that
 *  can still rise before then (physio, a blackout week), so a "not cleared" preview could turn out
 *  false and a button that cried wolf would be a NEW lie in place of the old one. A medical
 *  withdrawal announces itself the way it always has: it halts the advance with the 'medical' stop
 *  and its own toast. */
export interface ArrivalPreview {
  eventId: string
  tier: TierId
  /** the event's week – always `snapshot.week + 1` by construction */
  week: number
  /** 'injured' = the layoff still covers that week, so it will be a walkover (0 pts, fee
   *  forfeited); 'play' = she takes the court, as far as anything knowable today says. */
  verdict: 'play' | 'injured'
  /** player-facing reason, present exactly when `verdict === 'injured'` */
  detail?: string
  /** her points have passed the tier's ceiling. The entry is COMMITTED and still plays (R10-3) –
   *  this is here so the button can say so, never so a surface can block it. */
  outgrown: boolean
}
