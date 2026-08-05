// Package L – the rolling ranking. Pure and total: a deterministic function of the
// results ledger and the current week. No RNG, no mutation of the input.
//
// ⚠ THE ONE VALUE IMPORT, AND WHY IT IS NOT A CYCLE. `TIERS` is a frozen constant table and
// `season/calendar.ts` imports nothing from this file (checked: rng, match/types, protocol, economy,
// ./types), so the edge is one-way and the module stays pure and total. It is here because the
// rulebook's ranking rules are stated in terms of tournament CATEGORIES - eighteen results "which
// must include four (4) Grand Slams", a minimum that governs the WTA list and not the ITF one - and
// a ranking module that cannot tell a Slam from a W15 cannot express them. `world/ladder.ts`'
// `inTrack` reads the same table for the same reason.

import { TIERS } from './calendar'
import type { LadderTrack, RankingRow, TierId } from './types'

/** ONE APPEARANCE in a draw – "she was in it", with what it paid.
 *
 *  SHE PLAYED and SHE SCORED are two different facts and this row carries BOTH: the (playerId,
 *  week, tier) triple says she was in that draw, `points` says what the finish was worth. They used
 *  to be the same fact – every finish paid something, so "has a row" and "played" were
 *  interchangeable – and wave B's first-round zero pulled them apart (docs/specs/
 *  wave-b-first-round-zero.md §5). A scoreless row is therefore NORMAL and load-bearing: it is the
 *  only record `season/rival.ts` has that a cohort player spent that week travelling and playing
 *  rather than resting.
 *
 *  Which half a reader wants is now an explicit choice, made through `isCountingResult` below –
 *  never by re-spelling `points > 0` at each site, which is exactly how the two halves of the
 *  engine came to disagree in the first place. */
export interface SeasonResult {
  playerId: string
  week: number
  /** what the finish PAID. 0 is a real, written value: a first-round exit (every tier, wave B). */
  points: number
  /** the tier this result was earned at (round-5: set on kid results for the "counting
   *  results" list; optional so AI results and pre-r5 saves can omit it). Never affects ranking. */
  tier?: TierId
  /** ⚠ THE ZERO THAT COUNTS (W3-ACT2 §6, the owner's spec: «пропущенный обязательный турнир ЗАНИМАЕТ
   *  один из 16 зачётных слотов нулём»). Set on the row a SKIPPED MANDATORY writes, and it is the
   *  only thing in the game that makes a scoreless row count.
   *
   *  Why it is the real rule and crueller than the fine: the tour does not take points away, it
   *  takes a SLOT. A zero sorts last in the best-N fold, so it costs her nothing while she has
   *  sixteen better results and costs her a whole result the moment she does not - which is exactly
   *  when a professional feels it. It also means the enforcement surface is the best-16 window she
   *  already reads every week rather than a second ledger nobody looks at.
   *
   *  ⚠ AND IT IS THE ONE EXCEPTION `isCountingResult` CARRIES. Everything else about a scoreless row
   *  is unchanged: this flag is absent on every row the brackets write, so the wave-B split ("a row
   *  is an appearance; a counting result is one that scored") is untouched for the cohort, for the
   *  fatigue reconstruction and for every historical save. */
  mandatoryMiss?: true
}

/** THE ranking half of the row: a result COUNTS when it scored. A scoreless appearance is a record
 *  of play, not an achievement – it never enters the standings, the best-6 sum, or the kid's
 *  counting-results list. Splitting it out here (rather than leaving a `points > 0` in each reader)
 *  is what keeps the standings arithmetic byte-identical now that scoreless rows exist: without it
 *  a scoreless row would lend its week to `recency`, silently reordering tied players and with them
 *  the entrant percentiles `selectEntrants` reads. */
export function isCountingResult(r: SeasonResult): boolean {
  return r.points > 0 || r.mandatoryMiss === true
}

const WINDOW_WEEKS = 52

/** HOW MANY RESULTS A TABLE COUNTS - per track (W2-LADDER; act2-pro-tour.md §3, the owner's 30.07
 *  call re-affirmed 02.08; the professional number corrected to the rulebook's own on 05.08 -
 *  docs/specs/points-by-the-book-2026-08.md).
 *
 *  ⚠ THE SPLIT IS THE REAL SPORT'S OWN. The ITF junior ranking counts "the six best singles
 *  results" (Reg 10, verbatim in ranking-points-by-tier.md §1) and our domestic ladder has always
 *  mirrored it; the WTA ranking counts EIGHTEEN. Under best-6 a professional season was worth
 *  nothing past six results - "playing more" bought points for nobody - which wasted the
 *  availability currency the load-manager wave built precisely where scheduling becomes the game:
 *  fatigue's ladder D prices a dense season at ~15-20 events, so a window that wide is "almost
 *  everything a full season earns", a thin season is visibly thin, and a full one is worth playing.
 *
 *  ⚠⚠ EIGHTEEN, NOT SIXTEEN, AND IT IS THE RULEBOOK'S NUMBER RATHER THAN A TUNING. 2026 WTA
 *  Rulebook §VIII.A.4.a.i, verbatim: a ranking is "her total ranking points, including any
 *  applicable zero (0) ranking point results ... from eighteen (18) Tournament results during a
 *  rolling, 52-week period, which must include: four (4) Grand Slams; six (6) WTA 1000 Mandatory
 *  combined/virtually combined Tournaments; one (1) WTA 1000 Mandatory Tournament (WTA only); best
 *  seven (7) results from all WTA 1000 Mandatory, WTA 500, WTA 250, WTA 125 and ITF W15+ events."
 *  4 + 6 + 1 = eleven mandatory slots, plus best seven = eighteen. The sixteen we shipped was our
 *  own number and it was simply wrong; `MANDATORY_SLOTS` below carries the other half of the same
 *  sentence.
 *
 *  ⚠ A PLAIN OBJECT, NOT `as const`, DELIBERATELY: the before/after bench
 *  (tools/best16-bench.ts) patches `.wta` back to 6 for its A arm and restores it - the same
 *  patch-and-restore idiom the fatigue bench uses on `matchWeekRecoveryBase`. Engine code never
 *  writes it. TWO LICENSED WRITERS NOW: tools/ceiling-walk.ts sweeps it (8/12/24/32) to price what
 *  the window width is worth to a perfect season - docs/specs/ranking-ceiling-2026-08.md section 6,
 *  where narrowing to best-8 measures as 50 places and widening past 16 as exactly nothing. */
export const BEST_N_BY_TRACK: Record<LadderTrack, number> = { domestic: 6, itf: 6, wta: 18 }

/** THE OTHER HALF OF §VIII.A.4.a.i: eleven of the eighteen slots are RESERVED for the tour's own
 *  compulsory events, and a reserved slot she has no result for CONVERTS INTO AN OPEN ONE -
 *  "for each Grand Slam or WTA 1000 Mandatory Tournament that a player is not required to count on
 *  her ranking ..., the number of results from all other Tournaments that count on her ranking is
 *  increased by one (1)". So the total is always eighteen; what changes is how many of them she is
 *  free to choose.
 *
 *  ⚠ WHY IT MATTERS AT ALL, GIVEN THAT MOST OF OUR CAREERS NEVER SEE A SLAM. For a player never
 *  accepted into either family all eleven convert and her ranking is simply her best eighteen -
 *  which is the state nearly every career in this game lives in, and the reason the correction
 *  measures as a small one. It starts biting the day she is IN those draws: a bad Slam is then
 *  locked in at what it paid instead of being dropped for a better W100 title, and a SKIPPED
 *  mandatory (`mandatoryMiss`) occupies a reserved slot with a zero WHATEVER ELSE SHE HAS. That is
 *  the owner's own spec - «пропущенный обязательный турнир ЗАНИМАЕТ один из зачётных слотов нулём»
 *  (act2-pro-tour.md §6) - arriving a second time from the rulebook, and it is strictly crueller
 *  than what best-N alone could express, where a zero sorts last and is dropped by anyone holding a
 *  full book.
 *
 *  ⚠ THE COUNTS ARE ADAPTED TO OUR GRID, EXACTLY AS act2-pro-tour.md §6 AUTHORISES, and the
 *  adaptation is stated rather than smuggled. The real tour designates four Slams and seven
 *  particular 1000s; our calendar carries four Slams (`TIERS.slam.anchorWeeks`) and EIGHT 1000s
 *  (`TIERS.wta1000.anchorWeeks`). We reserve four and seven - the rulebook's own numbers - so her
 *  EIGHTH 1000 result falls back into the open pool. That is not a fudge: the rulebook's "best
 *  seven from all other tournaments" list explicitly re-includes WTA 1000 Mandatory events, so a
 *  1000 beyond the reserved ones competing for an open slot is the real rule's own behaviour.
 *
 *  ⚠ AND WHERE OUR MANDATORY REGIME AND THE RULEBOOK DISAGREE, OURS GOVERNS (the owner's ruling,
 *  05.08: we import the COUNT, not the whole commitment system). Three live differences, all
 *  recorded in docs/specs/points-by-the-book-2026-08.md §2: (a) our obligations bind the top 50
 *  only (`ECONOMY.mandatory.maxRank`) where the real ones bind by acceptance; (b) our 500s are a
 *  quota of six from ten and are NOT reserved here, because the tour lets her pick which six and a
 *  reserved slot would take that choice away; (c) an obligation she could not have met is not an
 *  obligation (`mandatoryBinds`), so no zero is ever written for an injury, a suspension or an
 *  acceptance list that refused her - which means a reserved slot in this game can only ever be
 *  occupied by a zero she chose.
 *
 *  ⚠ ORDERED, AND THE ORDER IS PART OF THE RULE: Slams are filled before 1000s, so a player short
 *  of the total spends her reservations on the family the tour cares most about. */
export const MANDATORY_SLOTS: readonly { readonly tier: TierId; readonly slots: number }[] = [
  { tier: 'slam', slots: 4 },
  { tier: 'wta1000', slots: 7 },
]

/** WHICH RESULTS THE WINDOW FOLD ACTUALLY COUNTS, at one width - the single definition
 *  `windowedBestSum` and `computeRanking` both call, so the two can never disagree about what a
 *  ranking is.
 *
 *  `list` MUST already be filtered to the window and to counting results, and sorted best-first
 *  (points desc, then week desc) - both callers do exactly that, and doing it here would sort the
 *  same array twice on the hot path `recomputeKidRank` walks every tick.
 *
 *  ⚠ IT IS `slice(0, bestN)` EXACTLY WHENEVER NO RESERVED TIER IS PRESENT, which is every domestic
 *  and ITF fold, every pre-professional career, and every professional career that has not yet been
 *  in a Slam or a 1000 draw. That is what makes this correction free where it should be free and
 *  visible only where the real rule is visible.
 *
 *  ⚠ AND THE RESERVATION IS CAPPED BY THE WINDOW ITSELF (`taken.length >= bestN`), because the
 *  width is a caller's argument and the benches sweep it: a best-8 arm must not reserve eleven
 *  slots out of eight. */
export function windowSlots(list: SeasonResult[], bestN: number): SeasonResult[] {
  if (bestN <= 0) return []
  // Everything fits: the reservation cannot change which rows are counted, only their order, and
  // the two things read off the fold (a points sum and a max week) are order-independent.
  if (list.length <= bestN) return list
  if (!list.some((r) => r.tier !== undefined && MANDATORY_SLOTS.some((m) => m.tier === r.tier))) {
    return list.slice(0, bestN)
  }
  const taken: SeasonResult[] = []
  const reserved = new Set<SeasonResult>()
  for (const family of MANDATORY_SLOTS) {
    let used = 0
    for (const r of list) {
      if (taken.length >= bestN || used >= family.slots) break
      if (r.tier !== family.tier) continue
      taken.push(r)
      reserved.add(r)
      used++
    }
  }
  for (const r of list) {
    if (taken.length >= bestN) break
    if (reserved.has(r)) continue
    taken.push(r)
  }
  return taken
}

/** THE MINIMUM THAT PUTS A NAME ON THE LIST AT ALL - 2026 WTA Rulebook §VIII.A.2.b, verbatim:
 *  *"Players must earn (i) ranking points in at least three (3) valid Tournaments, or (ii) a
 *  minimum of ten (10) singles ranking points ... in order to appear on the WTA Rankings."*
 *
 *  ⚠ WHY IT IS NOT COSMETIC HERE, WHICH IS THE THING THE RESEARCH GOT WRONG ABOUT IT. We ranked a
 *  player on a single point, and «one W ranking point» is therefore a STATE in this game that the
 *  sport does not have - the state the world audit found opens W75 and shuts W15 in the same
 *  instant, because one point makes `kidPoints(world, 'wta') > 0` true and `tierFloorOpen` then
 *  reads a rank against acceptance cuts that refuse nobody. Three tournaments or ten points is the
 *  real tour's own answer to exactly that, and it is the reason this correction is measured against
 *  `tierFloorOpen`/`tierOutgrown` rather than against the standings alone.
 *
 *  ⚠ A PLAIN OBJECT, THE LICENSED PATCH-AND-RESTORE IDIOM (as `BEST_N_BY_TRACK` above): the A/B
 *  arms of docs/specs/points-by-the-book-2026-08.md turn it off with `{ tournaments: 1, points: 0 }`
 *  - a total of at least zero is a tautology, so that is "off" and not "nearly off". Engine code
 *  never writes it. */
export const RANKABLE_MIN = { tournaments: 3, points: 10 }

/** The counted slots folded into the number a table shows - the sum, unless she is not on the list
 *  at all, in which case it is nothing.
 *
 *  ⚠ IT GOVERNS THE PROFESSIONAL TABLE AND ONLY THE PROFESSIONAL TABLE, decided by the rows rather
 *  than by a parameter every caller would have to remember. §VIII.A.2.b is the WTA's rule; the ITF
 *  junior ranking has a different and much harsher eligibility rule of its own (Juniors Reg 14: no
 *  year-end ranking without six events, four of them top-grade and three abroad -
 *  ranking-points-by-tier.md §1), which we do not model, and our domestic ladder is invented
 *  outright. Importing the WTA's threshold into either would be importing a rule that is not
 *  theirs, and would silently un-rank a thirteen-year-old on her first two J30 wins.
 *
 *  ⚠ AND IT DEMANDS THAT EVERY ROW BE PROFESSIONAL, NOT MERELY THAT ONE IS. Every engine fold of
 *  the W table passes `inTrack('wta')`, so its rows are all professional by construction; a MIXED
 *  fold (no track filter at all - what the pre-history generator and a few characterisation tests
 *  ask for) is not the WTA ranking and is left exactly as it was. Conservative in the direction
 *  that cannot invent a change nobody measured. */
export function rankableTotal(counted: SeasonResult[]): number {
  let total = 0
  let scoring = 0
  let professional = counted.length > 0
  for (const r of counted) {
    total += r.points
    if (r.points > 0) scoring++
    if (r.tier === undefined || TIERS[r.tier].track !== 'wta') professional = false
  }
  if (!professional) return total
  return scoring >= RANKABLE_MIN.tournaments || total >= RANKABLE_MIN.points ? total : 0
}

/** A single player's windowed best-N points sum at `currentWeek` – the exact value
 *  `computeRanking` assigns as that player's `points`. Pure. Used to
 *  diff the effective ranking delta of a freshly-added result (round-5 item 1).
 *  Scoreless appearances are skipped: they add 0 to the sum but would otherwise consume best-N
 *  slots from a player who has fewer than N counting results.
 *
 *  ⚠ IT READS `tier` NOW, THROUGH `windowSlots` – the reserved-slot half of §VIII.A.4.a.i. It is
 *  the same fold `computeRanking` runs, called from the same place, which is the only way the
 *  "effective delta" this function exists to print can stay the delta the table will show.
 *
 *  ⚠ `bestN` IS REQUIRED AND SITS BEFORE THE FILTER, DELIBERATELY (W2-LADDER §3). The window
 *  width stopped being one number when the adult table went to best-16, and a default of 6 here
 *  would be a silent way to count a professional season on the junior rule - the exact class of
 *  "one answer to two questions" bug the two-ladders work spent a round unpicking. Every caller
 *  therefore states its track's N (BEST_N_BY_TRACK above), and the compiler visits them all. */
export function windowedBestSum(
  results: SeasonResult[],
  currentWeek: number,
  playerId: string,
  /** the track's window width - BEST_N_BY_TRACK[track] at every real call site */
  bestN: number,
  /** Same track filter `computeRanking` takes, for the same reason: her domestic points and her ITF
   *  points are two numbers, and every caller has to say which one it is asking for. */
  countsFor?: (r: SeasonResult) => boolean,
): number {
  const list = results
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === playerId &&
        (!countsFor || countsFor(r)) &&
        r.week <= currentWeek &&
        currentWeek - r.week <= WINDOW_WEEKS,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
  return rankableTotal(windowSlots(list, bestN))
}

// computeRanking – rolling 52-week window, best-N results per player (N is the TRACK's window
// width, stated by every caller – see BEST_N_BY_TRACK), competition
// ranks (ties share a rank; the next rank skips by the tie count, e.g. 4, 4, 6).
// Ties on points break by the more recent counted result for *order* only; remaining
// ties keep a stable order (roster order, then first-appearance in results). Passing
// `roster` makes the table total: every roster member appears, zero-point players
// ranked after pointed ones in stable order.
//
// A STANDINGS TABLE IS BUILT FROM COUNTING RESULTS ONLY (`isCountingResult`). The ledger also
// carries scoreless appearances now – the record a played-but-unrewarded week leaves for the
// fatigue reconstruction – and they are dropped here BEFORE anything reads them, in both places a
// row can enter the table: the per-player list and the "seen only in results" tail of the base
// order. So showing up and losing your opener neither banks points nor puts you on the table nor
// refreshes your `recency`, which is exactly the pre-wave-B behaviour this function must keep.
export function computeRanking(
  results: SeasonResult[],
  currentWeek: number,
  /** THE TRACK'S WINDOW WIDTH, REQUIRED AND THIRD (W2-LADDER §3): best-6 for domestic/itf, best-16
   *  for the professional table (BEST_N_BY_TRACK). Required for the same reason `kidPoints` has no
   *  default track - "how many results count" stopped having one answer, and a silent 6 would fold
   *  a professional season on the junior rule without a single call site changing. Placed before
   *  the optional pair so the compiler walks every caller. */
  bestN: number,
  roster?: string[],
  /** TWO TABLES OUT OF ONE LEDGER (docs/specs/two-ladders.md). A result already carries the tier it
   *  was won at, so a track is a filter and not a second ledger - which is why two ranking tables
   *  cost no persisted state, no schema bump and no migration. Absent ⇒ every result counts, which
   *  is what the pre-history generator and the old single-table callers want. */
  countsFor?: (r: SeasonResult) => boolean,
): RankingRow[] {
  // Keep only counting results inside the window (age ≤ 52 weeks, not in the future).
  const perPlayer = new Map<string, SeasonResult[]>()
  for (const res of results) {
    if (!isCountingResult(res)) continue
    if (countsFor && !countsFor(res)) continue
    if (res.week > currentWeek || currentWeek - res.week > WINDOW_WEEKS) continue
    const list = perPlayer.get(res.playerId)
    if (list) list.push(res)
    else perPlayer.set(res.playerId, [res])
  }

  // WHO IS IN THE TABLE. A roster, when one is passed, is now a FILTER and not merely a base order.
  //
  // ⚠ THE BUG THIS CLOSES. It used to seed the order from the roster and then add anybody with a
  // counting result in the window, roster or not. That was harmless while every id with results
  // stayed in the cohort for ever - and the junior conveyor made it a bug: a player who leaves at
  // nineteen keeps her results for 52 weeks, so for a year afterwards she still held a ranking
  // place, printed as a raw id (her card is gone, so `computeStandings` falls back to the id) and
  // pushing everyone below her - the kid included - down a spot. Seen live on the Stats screen:
  // "ai-153", 1715 pts. See docs/specs/junior-conveyor.md.
  //
  // With NO roster the old behaviour stands: rank whoever has results. That is what the pre-history
  // generator and several tests want, and it is a different question ("who scored?") from the one a
  // roster asks ("where do these players stand?").
  const order: string[] = []
  const seen = new Set<string>()
  const add = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id)
      order.push(id)
    }
  }
  if (roster) for (const id of roster) add(id)
  else for (const res of results) if (isCountingResult(res)) add(res.playerId)

  // Per player: the counted slots' points sum + recency (latest week among them).
  //
  // ⚠ `recency` IS DELIBERATELY UNTOUCHED BY THE MINIMUM (§VIII.A.2.b, `rankableTotal`). A player
  // below it reads 0 points, which is the whole of what "does not appear on the rankings" means
  // here, and she therefore shares the pointless tail's single competition RANK with everyone else
  // in it. Her ORDER inside that tail is our own bookkeeping – the thing `selectEntrants`'
  // percentiles walk – and zeroing it as well would be inventing a second rule the book does not
  // state, on top of the one it does.
  const rows = order.map((playerId, idx) => {
    const list = (perPlayer.get(playerId) ?? [])
      .slice()
      .sort((a, b) => b.points - a.points || b.week - a.week)
    const best = windowSlots(list, bestN)
    const points = rankableTotal(best)
    const recency = best.length ? Math.max(...best.map((x) => x.week)) : -1
    return { playerId, points, recency, idx }
  })

  rows.sort((a, b) => b.points - a.points || b.recency - a.recency || a.idx - b.idx)

  // Competition ranks (standard "1224" numbering, same convention real tennis rankings
  // use): tied points share one rank, and the next distinct points value takes the rank
  // equal to how many players sit ahead of it (+1) – i.e. it skips by the tie count
  // (4, 4, 6 – never 4, 4, 5). Recency (set above, sort only) still breaks the *order*
  // among equal-points players; it never affects the rank number they share.
  const ranking: RankingRow[] = []
  let rank = 0
  let prevPoints: number | null = null
  rows.forEach((row, i) => {
    if (prevPoints === null || row.points !== prevPoints) {
      rank = i + 1
      prevPoints = row.points
    }
    ranking.push({ playerId: row.playerId, points: row.points, rank })
  })
  return ranking
}
