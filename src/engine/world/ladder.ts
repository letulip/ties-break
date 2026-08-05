// THE LADDER: where she stands, and what that standing opens.
//
// Two questions that turned out to be one module. The ranking helpers answer "what rank is she?"
// (three tables now – domestic, ITF, WTA – all folded from one results ledger), and the eligibility
// helpers answer "what may she enter with it?". They are MUTUALLY dependent by nature: the on-ramp
// latch asks whether she has counting points on a table (`kidPoints`), and the tier gates ask where
// she sits in one (`fieldProsOf` / `inTrack`). Splitting them into two files would have created an
// import cycle, so they live together – measured, not assumed (docs/review/proposals/P4-*.md).
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Nothing here draws on any RNG stream: ranks are folded
// from the ledger, so the frozen MAIN capture cannot notice this file.

import { TIERS, TIER_LADDER, hasAcceptanceList, isTierAgeOpen } from '../season/calendar'
import { BEST_N_BY_TRACK, computeRanking, windowedBestSum, type SeasonResult } from '../season/ranking'
import type { LadderTrack, RankingRow, TierId } from '../season/types'
import { fieldProsFor, mergedWtaRanking, type FieldPro } from '../season/fieldPros'
import { seasonIndexOf } from './ledger'
import { ageAtWeek } from './age'
import { proEntryCapUsage } from './entryCaps'
import { KID_ID, RESULTS_WINDOW } from './constants'
import type { WorldState } from '../world'

export function cohortIds(world: WorldState): string[] {
  return world.cohort.map((p) => p.id)
}

// --- ranking helpers ---------------------------------------------------------
//
// TWO TABLES, ONE LEDGER (docs/specs/two-ladders.md, the owner 29.07). Local / Regional / National
// pay into a NATIONAL table; J30 / J60 / J300 pay into the ITF junior table. Nothing crosses: in the
// real sport a national result produces zero ITF points, because Reg 10's list of ranking
// tournaments is closed and contains only ITF grades, while federations import ITF results at their
// own valuation and never the reverse.
//
// It costs nothing to store, which is the nice part: a result row already carries the `tier` it was
// won at, so a track is a FILTER over the ledger we already keep. Two tables = two folds. No schema
// bump, no migration, no golden save.

/** Does this result pay into `track`? A row with no tier is pre-r5 history and counts as domestic -
 *  it can only have come from the rungs that existed then. */
export function inTrack(track: LadderTrack): (r: SeasonResult) => boolean {
  return (r) => (r.tier ? TIERS[r.tier].track === track : track === 'domestic')
}

/** THE FIELD, for this world as it stands this week – ~300 derived professionals (living-field
 *  phase W, 01.08). Memoised inside fieldProsFor; regenerates only when the season index turns
 *  over, which is the same boundary the conveyor renames the cohort on, so "stable within a
 *  season" holds for both populations at once. Pure derivation, ZERO draws on any stream the tick
 *  walks – the frozen MAIN capture (41550 / e6b0c709) cannot see this function. */
export function fieldProsOf(world: WorldState): FieldPro[] {
  return fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
}

/** HOW MANY ROWS THE TABLE OF `track` HOLDS THIS WEEK – and therefore what "below the whole field"
 *  is worth as a number.
 *
 *  ⚠ THE BUG THIS CLOSES, and it is the "two currencies, no exchange rate" error one more time
 *  (probe/world-strength, docs/specs/world-strength-audit-2026-08.md §6). Three tables are folded
 *  from one ledger, and TWO of them are 199 juniors plus the kid – so `world.cohort.length + 1` was
 *  the right "unranked" sentinel for the domestic and ITF tables and was spelled out by hand at
 *  every site that needed one. The W table stopped being that shape when living-field phase W
 *  merged 364 derived professionals into it: it is 564 rows, and 200 is not below its field, it is
 *  its top 36%. Every W-side `?? world.cohort.length + 1` therefore read a girl with NO ranking at
 *  all as world #200 – past the acceptance cuts of W35, W50, W75, W100, a WTA 125 and a WTA 250,
 *  and worth a top-200 professional's brand valuation in `reviewSponsors`.
 *
 *  `sponsors.ts` states the intent in as many words – *"a career that has never held a point in a
 *  table sits below the whole field rather than at the top of an empty one"* – so this is the code
 *  being made to agree with its own comment rather than a rule being chosen. `world/mandatory.ts`
 *  already had it right, by using `Number.MAX_SAFE_INTEGER` instead; a number the UI can print is
 *  the only reason this is the bottom of the table rather than that.
 *
 *  It is CONSERVATIVE IN ONE DIRECTION BY CONSTRUCTION: the sentinel can only ever get bigger, so
 *  the fix can refuse where the old value admitted and never the reverse. And it is behaviour-neutral
 *  on every path that has a cache, which is all of them in practice – `recomputeKidRank` is the one
 *  writer, it runs on every tick and on every load, and the kid is always in her own roster. What it
 *  removes is the landmine underneath that, of exactly the kind `latchOnRamps`' own defensive branch
 *  exists for: "a later step may never assume an earlier one's post-condition." */
export function tableSize(world: WorldState, track: LadderTrack): number {
  const live = world.cohort.length + 1
  return track === 'wta' ? live + fieldProsOf(world).length : live
}

export function rankingFor(world: WorldState, track: LadderTrack): RankingRow[] {
  // THE WINDOW SPLIT LANDS HERE (W2-LADDER §3): best-6 for domestic/itf, EIGHTEEN for the
  // professional table (the rulebook's own number since 05.08, with eleven of the eighteen reserved
  // for Slams and 1000s - `MANDATORY_SLOTS`), and because this is the ONE fold every table-reader
  // flows through (rank caches, standings, acceptance cuts, LadderViews), no surface can count a
  // season on the wrong rule. The same line is where §VIII.A.2.b's minimum lands, for the same
  // reason: "does she appear on the list at all" has to have exactly one answer.
  const live = computeRanking(world.results, world.week, BEST_N_BY_TRACK[track], [...cohortIds(world), KID_ID], inTrack(track))
  // ⚠ THE W TABLE IS THE MERGED TABLE, everywhere it is read (living-field phase W, 01.08). The
  // professional table used to be ~199 zero rows and whatever the canonical W brackets had paid the
  // juniors – which is why five W15 titles printed "#9" and the acceptance cuts measured nothing.
  // LIVE rows keep exactly the fold above (earned points, kid included); the field's virtual rows
  // interleave by points, earned-beats-derived on ties. ONE merged view by construction: rank
  // caches (kidRankWta), the Stats standings, the tournament overlay's opponent ranks and the
  // entry gates all flow through this line, so no surface can see a different W table.
  if (track !== 'wta') return live
  return mergedWtaRanking(live, fieldProsOf(world))
}

/** THE table when only one is meant: the ITF one. It is what opens the international rungs and what
 *  the game is about. Callers that need the domestic side ask for it by name. */
export function fullRanking(world: WorldState): RankingRow[] {
  return rankingFor(world, 'itf')
}

export function domesticRanking(world: WorldState): RankingRow[] {
  return rankingFor(world, 'domestic')
}

/** Refresh the cheap-access rank caches. `kidRank` stays the ITF one - it is the number the ladder
 *  and the standings are about - and the domestic rank rides beside it for the screens that show her
 *  place before she has an international result at all.
 *
 *  THREE FOLDS SINCE THE ADULT RUNGS (task #17), and the third is built exactly like the other two:
 *  same predicate, same fallback, same one writer. `kidRank` did NOT move to the professional table
 *  when the third one arrived, and that is a deliberate non-decision – WHICH table is "hers" is
 *  `activeLadderOf`'s question and the handover at 19 is what answers it (docs/specs/
 *  adult-tour-and-endings.md §4). This function only guarantees all three are true at once. */
export function recomputeKidRank(world: WorldState): void {
  const row = fullRanking(world).find((r) => r.playerId === KID_ID)
  world.kidRank = row?.rank ?? tableSize(world, 'itf')
  const dom = domesticRanking(world).find((r) => r.playerId === KID_ID)
  world.kidRankDomestic = dom?.rank ?? tableSize(world, 'domestic')
  const wta = rankingFor(world, 'wta').find((r) => r.playerId === KID_ID)
  // ⚠ THE W TABLE IS 564 ROWS, NOT 200 – see `tableSize`. The other two are unchanged in value.
  world.kidRankWta = wta?.rank ?? tableSize(world, 'wta')
  latchOnRamps(world)
}

/** THE ADOPTION-TIME CACHE REFRESH (wave/pro-prep, 02.08). The three rank caches are persisted
 *  state with one writer (`recomputeKidRank`) – which is exactly how a save written under an OLDER
 *  definition of a table wakes up stale: living-field phase W redefined the W table (merged field),
 *  and a pre-phase-W career loaded its chip rank as "#9" off disk while the standings rendered the
 *  merged table's #61 – two surfaces, two answers, until the first tick snapped the chip 52 places
 *  with no play behind it (the owner's «мировые очки как-то странно считаются», measured against
 *  his own save in tools/points-audit.ts). Every load path calls this beside `ensureMainState`:
 *  recompute the caches against TODAY's table definitions, and for any track whose value MOVED,
 *  align that track's prev* to the fresh value – a movement arrow must diff one table with itself
 *  (see `prevKidRankDomestic`), and "old code's table minus new code's" is exactly the
 *  cross-currency subtraction that rule exists to forbid. Tracks that did not move keep their
 *  prev*, so an ordinary reload still shows last week's real movement. Pure recompute, no RNG;
 *  `latchOnRamps` rides along as always (one-way, so a refresh can only latch what the next tick
 *  would have latched anyway). Returns whether anything moved – callers today ignore it, tests
 *  pin idempotence through it. */
export function refreshDerivedRankCaches(world: WorldState): boolean {
  const before = { itf: world.kidRank, dom: world.kidRankDomestic, wta: world.kidRankWta }
  recomputeKidRank(world)
  let moved = false
  if (world.kidRank !== before.itf) {
    world.prevKidRank = world.kidRank
    moved = true
  }
  if (world.kidRankDomestic !== before.dom) {
    world.prevKidRankDomestic = world.kidRankDomestic ?? null
    moved = true
  }
  if (world.kidRankWta !== before.wta) {
    world.prevKidRankWta = world.kidRankWta ?? null
    moved = true
  }
  return moved
}

/** The bottom rung of a table – the one with no acceptance list, whose band is read against the
 *  table BELOW it. Derived from the catalogue rather than written down as 'j30' / 'w15', so a future
 *  table (or a re-shaped one) needs no edit here and cannot silently disagree with `tierOpenFor`,
 *  which detects an on-ramp exactly the same way. */
export function onRampTierOf(track: LadderTrack): TierId | undefined {
  return TIER_LADDER.find((t) => TIERS[t].track === track && !hasAcceptanceList(t))
}

/** ⚠ SET ONCE, NEVER CLEARED (v34). Latches the moment she can prove she belongs on a table, by
 *  either of the two things that prove it:
 *    * she meets the on-ramp's band today - the standard the rung was always asking for; or
 *    * she holds a counting result on the table itself, which is a stronger proof than the band.
 *
 *  The second clause matters more than it looks: it is what latches a girl whose domestic points
 *  have ALREADY decayed but who is visibly out there playing J60s, which is the exact state the
 *  owner was in when he reported this.
 *
 *  Rides with `recomputeKidRank` deliberately - that is the one writer for everything derived from
 *  the ranking tables, it runs on every tick AND on load, so a migrated save latches on the way in
 *  without the migration having to guess. Pure state: zero draws, no stream touched. */
/** ⚠ THE ONE READER, and the reason it is an OR rather than a plain flag lookup.
 *
 *  The latch is PURELY ADDITIVE: "the band is met right now" OR "it was met once". Written that way,
 *  nothing can depend on WHEN `latchOnRamps` last ran - the live half always answers correctly on its
 *  own and the memory only ever adds. A flag-only read would have made every caller order-sensitive:
 *  anything that puts points on a world and asks the gate before the next tick (a test, a bench, a
 *  future tool) would see a stale `false` and be refused on points she is visibly holding. That is a
 *  trap to leave behind for somebody, and it costs one `||` to not leave it.
 *
 *  So the flag can only ever KEEP a door open, never open one that was not already earned. */
export function onRampOpen(world: WorldState, track: 'itf' | 'wta'): boolean {
  if (world.onRampCleared?.[track]) return true
  const rung = onRampTierOf(track)
  if (!rung) return false
  // The band is denominated in the table below: the ITF on-ramp reads domestic, the WTA one reads ITF.
  const below: LadderTrack = track === 'itf' ? 'domestic' : 'itf'
  return isTierEligible(rung, kidPoints(world, below))
}

export function latchOnRamps(world: WorldState): void {
  // ⚠ DEFENSIVE, AND IT IS NOT PARANOIA - it is the v30 rule biting for real. The migration ladder
  // calls `recomputeKidRank` on its way through the EARLY steps (`seedWorldForV6`), which is long
  // before the v33 -> v34 step that creates this field, so a save can genuinely be sitting in this
  // function without it. A later step may never assume an earlier one's post-condition.
  if (!world.onRampCleared || typeof world.onRampCleared !== 'object') {
    world.onRampCleared = { itf: false, wta: false }
  }
  for (const track of ['itf', 'wta'] as const) {
    if (world.onRampCleared[track]) continue
    // Either proof will do: the band the rung asks for, or a counting result on the table itself -
    // which is the stronger of the two and the one that covers a girl whose domestic book has
    // already decayed while she is visibly out there playing J60s.
    if (onRampOpen(world, track) || kidPoints(world, track) > 0) world.onRampCleared[track] = true
  }
}

/** The kid's EARNED ranking points: her windowed best-6 sum at the current week – the same value
 *  `computeRanking` assigns her, an absolute measure of achievement (a fresh kid = 0). Derived on the
 *  fly from the results ledger (no persisted state → no schema bump); the eligibility ladder reads it. */
// NO DEFAULT, DELIBERATELY. There are two tables now and "her points" is no longer a question with
// one answer, so every caller has to say which one it means. Making the argument required turns a
// silent change of meaning into a compile error - which is what a change of this kind should be.
export function kidPoints(world: WorldState, track: LadderTrack): number {
  return windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track))
}

/** Her domestic best-6 - the number the domestic rungs' bands are denominated in. */
export function kidDomesticPoints(world: WorldState): number {
  return kidPoints(world, 'domestic')
}

// =================================================================================================
// WHICH TABLE IS HERS – moved here from world/snapshot.ts (fix/wallet-and-wrapup, 05.08) and
// re-exported from there under its historical name. It is a LADDER fact, and the season wrap-up
// in world/milestones.ts needs the same one answer; snapshot.ts imports milestones.ts, so reading
// it up there would have been a runtime cycle and a second copy of the rule would have been the
// drift this function exists to prevent. Nothing about either function changed in the move.
// =================================================================================================

/** HAS A W RESULT EVER COUNTED - the permanent half of `activeLadderOf`'s professional arm.
 *
 *  ⚠ THE EVIDENCE FOR "EVER" CANNOT BE THE RESULTS LEDGER: `world.results` is pruned to the 52-week
 *  window (RESULTS_WINDOW), so a pro on a long layoff would watch her own debut delete itself. The
 *  v34 migration solved the identical problem for the on-ramp latches with `bestFinishByTier` - a
 *  high-water mark written at tournament finalize and NEVER pruned - and this reads the same mark:
 *  a recorded finish whose points-table row pays > 0 was a counting result the week it landed
 *  (`isCountingResult` IS `points > 0`), and the table is monotone non-increasing, so the BEST
 *  finish paying zero means every finish did. Exact, for every save, however long ago it happened -
 *  no new persisted field, no schema bump. */
export function wtaEverCounted(world: WorldState): boolean {
  return (Object.keys(world.bestFinishByTier) as TierId[]).some((tier) => {
    const finish = world.bestFinishByTier[tier]
    return finish !== undefined && TIERS[tier].track === 'wta' && TIERS[tier].points[finish] > 0
  })
}

/** WHICH TABLE IS SHE ACTUALLY COMPETING IN - one rule, one place, so Home, Stats and the Kid screen
 *  cannot answer it three ways.
 *
 *  docs/specs/two-ladders.md, "Which rank is her rank": the ITF one once she has it, because that is
 *  the table the international rungs open on and the one the game is about. Before her first counting
 *  ITF result she is unranked internationally and the screens show her national standing instead.
 *  "That is the real shape of a junior career, and the moment the first ITF point lands is a beat
 *  worth having."
 *
 *  ⚠ THE PROFESSIONAL ARM IS A ONE-WAY DOOR (architect's ruling, 02.08, on the owner's «для тех кому
 *  актуально уже и мировую можно показывать, она с ней до конца игры будет»). Her first counting
 *  W-series result makes the professional table her table TO THE END OF THE GAME - it never falls
 *  back to 'itf'/'domestic' when the 52-week window later empties, which is why the arm reads the
 *  never-pruned mark (`wtaEverCounted`) and not the live window alone. The junior arm stays a live
 *  read on purpose: J is a stage she passes through, the paid tour is where the story ends. The
 *  live `kidPoints` OR is the latchOnRamps discipline - the fresh fact answers correctly on its
 *  own, the memory only ever adds, so no caller is order-sensitive on when finalize last ran. */
export function activeLadderOf(world: WorldState): LadderTrack {
  if (wtaEverCounted(world) || kidPoints(world, 'wta') > 0) return 'wta'
  return kidPoints(world, 'itf') > 0 ? 'itf' : 'domestic'
}

/** Pure eligibility check for a tier (Phase-4 "Season Life" slice 1, increment 2). A tier is a WINDOW
 *  `[minPoints, maxPoints]` on the kid's EARNED ranking points: eligible ⇔ the points sit inside the
 *  band. Points (not dense-rank POSITION) so a fresh/point-less kid starts at the BOTTOM (local only)
 *  and climbs local → regional → national as she earns results. No world/RNG dependency, so the bench
 *  and tests call it directly. */
export function isTierEligible(tier: TierId, points: number): boolean {
  const [minPoints, maxPoints] = TIERS[tier].enterPointBand
  return minPoints <= points && points <= maxPoints
}

/** The acceptance list as an absolute position, for the one field we actually have this week.
 *
 *  ⚠ ONE FUNCTION, TWO UNITS, AND THE UNIT IS A PROPERTY OF THE TABLE (W2-FIELD2). The ITF and
 *  domestic rungs keep a SHARE (`enterPct`): their tables are population artefacts – 199 juniors
 *  with no external anchor – so position 120 means nothing except "of these people", and a count
 *  there really would be the time bomb TierDef.enterPct describes.
 *
 *  The W rungs take an ABSOLUTE RANK (`acceptsRank`), because their table stopped being an
 *  artefact. Since this wave the merged W standings carry the REAL points-to-rank curve, so #350
 *  in it is an attempt at world #350; the real tour's entry lists are rank cuts (a W100 accepts to
 *  about #350 whether the world holds 500 players or 5,000), and a share of OUR population is the
 *  thing that would drift. It had already drifted: W35's 0.5 resolved to ~219 W points against a
 *  best-16 W15-title ceiling of 160, i.e. the second rung was unreachable from the first.
 *
 *  ⚠ THE FIELD GREW ONCE BEFORE (living-field phase W, 01.08) and the share survived it, which is
 *  why the share was right then: W35's 0.5 went from "top 100 of 200" to "top 250 of 500" with
 *  nobody editing a rule. What changed is not the size of the table but its MEANING. */
export function acceptanceRank(world: WorldState, tier: TierId): number | undefined {
  const absolute = TIERS[tier].acceptsRank
  if (absolute !== undefined) return Math.max(1, absolute)
  const pct = TIERS[tier].enterPct
  if (pct === undefined) return undefined
  // ONE derivation of "how big is this table", shared with the unranked sentinel – see `tableSize`.
  return Math.max(1, Math.round(pct * tableSize(world, TIERS[tier].track)))
}

/** THE ONE GATE, now that there are three tables (docs/specs/two-ladders.md, and the third one in
 *  docs/specs/adult-tour-and-endings.md).
 *
 *  A DOMESTIC rung reads her domestic best-6 against its band, exactly as the single ladder always
 *  did - those bands are denominated in domestic points and did not move, because the domestic
 *  point tables did not move either.
 *
 *  An ITF rung reads her ITF RANK POSITION against `enterRank`. That is the acceptance list, it is
 *  how the real tour works, and it is the same signal `entrantPctBand` already uses to pick the AI
 *  field - which is what closes the "two different entry rules for the same event" finding in
 *  rank-plateau.md 2b. A rung with no `enterRank` is open to anyone, which is what a J30 is.
 *
 *  ⚠ A WTA RUNG IS THE ITF ARM ONE TABLE UP, AND THE ON-RAMP READS THE TABLE BELOW IT. This is the
 *  same shape twice and it has to be, because it is the same problem twice: a player cannot hold a
 *  ranking in a table she has never played in, so the BOTTOM rung of every table must be opened by
 *  the table beneath it or the gate is a closed loop.
 *
 *      domestic points -> j30      (the on-ramp of the ITF table)
 *      ITF rank        -> j60/j300
 *      ITF JUNIOR points -> w15    (the on-ramp of the WTA table)
 *      WTA rank        -> w35/w100
 *
 *  So W15's `enterPointBand` of [120, MAX] is read against her ITF JUNIOR total - the currency of the
 *  table she is standing in, not the one she is stepping into - exactly as J30's [250, MAX] is read
 *  against her DOMESTIC total. The tier comments in season/calendar.ts spell out what 120 buys; this
 *  is the code they describe. Note the on-ramp is detected the same way in both arms - by the tier
 *  having no `enterPct` at all - so a future W50 that gains an acceptance list needs no change here. */
export function tierOpenFor(world: WorldState, tier: TierId): boolean {
  return tierFloorOpen(world, tier) && !tierOutgrown(world, tier)
}

/** HOW MANY RUNGS OF THE LADDER ARE LIVE AT ONCE – the sliding window's width (act2-pro-tour.md §11,
 *  owner ruling 11). Three, and the three are her working rung plus the two she overlaps with.
 *
 *  ⚠ MEASURED, NOT PICKED (§11.1). Two-rung windows carry 2.6-5.1 playable weeks of eight and half
 *  of them are too thin; three-rung windows carry 5.2-6.0 through the middle of the ladder. So three
 *  is the narrowest width that still leaves a real week-to-week choice at every stage. */
const WINDOW_RUNGS = 3

/** ...AND THE TOP OF THE LADDER NEVER SLIDES (§11.1's «в этом случае добавить еще диапазон... 50 +
 *  75 + 100 + 125, когда какой-то совсем перерастает - добавляем новый, а старый уходит», and
 *  «предыдущие тиры никуда не уходят»). The last four rungs have no ceiling at all, so the window
 *  WIDENS to four when she reaches the top - which is exactly what the measurement asks for: three
 *  of the rare top rungs carry only 2.2-2.3 playable weeks of eight, four carry 3.6. Above them is
 *  act 3's mandatory regime, where the big events are compulsory and the rungs below stay open as
 *  filler; until it exists, "the ladder ran out" is the honest reason a rung stops closing. */
const TERMINAL_RUNGS = 4

/** HAS SHE PASSED THIS RUNG? The CEILING half of the window, and the half that did not exist before
 *  W2-WINDOW on any rung above the domestic three.
 *
 *  ⚠ ONE RULE, NO NEW NUMBERS, AND THAT IS THE POINT. A rung closes when the rung THREE ABOVE IT
 *  opens to her – so its ceiling is the next-but-two rung's floor, read through that rung's own
 *  gate in that rung's own currency (domestic points for the domestic rungs, an ITF rank for the
 *  junior ones, the real tour's absolute WTA cuts for the professional ones). Nothing is converted
 *  between tables, nothing is invented, and a re-tuned floor re-tunes the ceiling under it for free.
 *
 *  What it produces, walked end to end: {local} -> {local, regional} -> {local, regional, national}
 *  -> {regional, national, j30} -> {national, j30, j60} -> {j30, j60, j300} -> {j60, j300, w15} ->
 *  {j300, w15, w35} -> {w15, w35, w50} -> {w35, w50, w75} -> {w50, w75, w100} -> {w50, w75, w100,
 *  wta125}. Three rungs at every stage, sliding one at a time, widening to four at the top: the
 *  owner's own worked example («Local 0-100, Regional 80-180, National 150-250, J30 = National +
 *  0-100...  цифры примерные, я хочу показать логику скользящего окна») expressed as its logic
 *  rather than as its numbers.
 *
 *  ⚠ WHY THE FLOOR AND NOT THE NET VERDICT. It asks `tierFloorOpen` of the rung above, never
 *  `tierOpenFor`: reading the net verdict would make the closure a chain, so a rung closing three
 *  storeys up would RE-OPEN the rung at the bottom (a professional's feed would recover its
 *  Regionals). "Has she reached it" is the question; "is it still hers" is a different one.
 *
 *  ⚠ AND IT IS A ROLLING TEST, NOT A LATCH, ON PURPOSE. If her ranking falls back out of the rung
 *  above's acceptance list, the rung below re-opens - the window slides DOWN with her. A latch would
 *  be the boredom failure the owner has ruled against twice: a career that slips must still have
 *  tennis somewhere, and «игрок должен иметь возможность играть... чтобы не скучал» governs.
 *
 *  ⚠⚠ AND THE RUNG ABOVE MUST BE ONE SHE CAN ACTUALLY WALK THROUGH TODAY - THE AGE CLAUSE, and it
 *  is not a special case, it is the same sentence. The three cross-table seams open on LATCHES
 *  («she has crossed this table's front door»), and a latch does not know about birthdays: a
 *  thirteen-year-old with a J300 title holds 300 ITF points, which clears W15's 120-point on-ramp
 *  instantly - so without this clause J30 would close three years before W15's age gate lets her
 *  in, and a girl whose acceptance-list rungs then slipped would have NOTHING open. That is exactly
 *  the boredom failure the owner has ruled against twice, arriving through the ceiling instead of
 *  through the cap. A door she cannot open yet cannot close the one behind her. */
export function tierOutgrown(world: WorldState, tier: TierId): boolean {
  const i = TIER_LADDER.indexOf(tier)
  if (i < 0 || i >= TIER_LADDER.length - TERMINAL_RUNGS) return false
  // ⚠⚠ THE PRO CAP RE-OPENS THE LADDER BELOW IT - ruling 2, and it is an ACCESS rule rather than the
  // visibility one it replaces. «игрок должен иметь возможность играть, если не w-серии то где-то
  // еще, чтобы не скучал»: the tour's own age rule (the AER, §5) caps a sixteen-year-old at 12
  // professional entries and a seventeen-year-old at 16, and once that allowance is spent the
  // window - which by then is all professional - has nothing left to offer her for the rest of the
  // season. MEASURED before this clause, tools/boredom-guard.ts, 8 maximal-grinder careers x 260
  // weeks: 516 cap refusals over 317 weeks, and 144 of those weeks had NOTHING else, every one of
  // them because the ceiling had closed the J or domestic event sitting on it. So a spent pro
  // allowance lifts the ceiling on the NON-professional rungs until the season turns - she may
  // enter the junior and national tennis she has technically outgrown, which is exactly what
  // ruling 2 promises and what the old feed-level "substitution" could only ever SHOW her.
  //
  // It is deliberately narrow: professional rungs never re-open (the cap is about them), it lasts
  // only while the allowance is spent, and the allowance resets every season - so it can never be
  // the reason a twenty-year-old is offered a J30, because `proPerYearByAge` is unlimited from 18.
  if (TIERS[tier].track !== 'wta' && proEntryCapUsage(world, world.week).remaining <= 0) return false
  const above = TIER_LADDER[i + WINDOW_RUNGS]
  if (!isTierAgeOpen(above, ageAtWeek(world.week))) return false
  return tierFloorOpen(world, above)
}

/** THE FLOOR half – "has she reached this rung", which is the whole of what `tierOpenFor` used to
 *  ask. Kept as its own exported name because the ceiling above has to ask it about a DIFFERENT rung
 *  than the one being judged, and because "reached" and "still hers" are two questions. */
export function tierFloorOpen(world: WorldState, tier: TierId): boolean {
  const def = TIERS[tier]
  if (def.track === 'itf') {
    // The on-ramp rung is a threshold she crossed once (see WorldState.onRampCleared and
    // `latchOnRamps`); the rungs above it read her CURRENT ITF rank, because they are acceptance
    // lists and an entry list is never judged on a ranking she used to hold.
    const accepts = acceptanceRank(world, tier)
    if (accepts === undefined) return onRampOpen(world, 'itf')
    return kidPoints(world, 'itf') > 0 && world.kidRank <= accepts
  }
  if (def.track === 'wta') {
    // Same shape one table up, and the latch matters MORE here: the J rungs shut at eighteen on age,
    // so from her birthday she can never earn another junior point - a W15 on-ramp read against a
    // rolling junior window would close on its own a year later with nothing she could do about it.
    const accepts = acceptanceRank(world, tier)
    if (accepts === undefined) return onRampOpen(world, 'wta')
    // ⚠ THE SENTINEL IS THE W TABLE'S OWN SIZE, NOT THE COHORT'S – see `tableSize`. With
    // `cohort.length + 1` a missing cache read as world #200 and cleared this cut and five above it.
    return kidPoints(world, 'wta') > 0 && (world.kidRankWta ?? tableSize(world, 'wta')) <= accepts
  }
  return isTierEligible(tier, kidPoints(world, 'domestic'))
}

// =================================================================================================
// THE SAME DOOR, ASKED OF A COHORT PLAYER (W3-ONRAMP, 04.08) – `tierFloorOpen`'s W arm, read for an
// AI id instead of for the kid.
// =================================================================================================
//
// WHY IT IS HERE AND NOT IN season/tournament.ts: the rule is the LADDER's, and this module is where
// the ladder lives. `selectEntrants` is handed the finished predicate (`OnRamp.admits`) and never
// learns what a track or a ranking table is – the same shape `universeForTier` uses to keep the
// field's population out of the bracket code.
//
// WHY IT IS THE KID'S OWN RULE, LINE FOR LINE, and not a second one tuned for the AI: the closed
// loop this closes exists precisely BECAUSE the cohort never had her rule. Two doors onto one tour
// would be two things to keep in step, and the first time they drifted the standings would stop
// meaning anything. So:
//
//     the on-ramp rung (no acceptance list) -> her ITF JUNIOR points against `enterPointBand`
//     every rung above it                   -> a professional result, AND `acceptsRank` on the
//                                              merged W table
//
// ⚠ THE ONE PLACE IT DIVERGES, AND WHY IT HAS TO. The kid's on-ramp is a LATCH (`onRampCleared`,
// v34) because "the J rungs shut at eighteen on age, so from her birthday she can never earn another
// junior point" – a rolling junior window would close her professional door a year later with
// nothing she could do about it. A latch for 199 rivals would be persisted state and a schema bump,
// so the cohort gets the SECOND of `latchOnRamps`' two proofs instead of the flag: **a W-track row
// inside the ranking window**, i.e. she has actually been out there playing professional
// tournaments this year. That is the stronger of the two proofs in `latchOnRamps`' own words, it is
// derived from the ledger the pruner already maintains, and it costs zero bytes. What it does not
// do is remember a player who has been off the professional tour for a full year – which is the
// honest reading of that state rather than a gap in it.
export interface ProDoors {
  /** the rung's acceptance door, for a cohort id */
  at(tier: TierId): (id: string) => boolean
}

/** Every W rung's door for this week, folded ONCE. `merged` is the kid-free merged W standings the
 *  caller has already built (world.ts's `TourWeek.ranking`), so the professional half is two map
 *  builds over an array the caller already has.
 *
 *  ⚠ THE ON-RAMP HALF IS LAZY, AND THAT IS A TICK-COST DECISION RATHER THAN A STYLE ONE. Only the
 *  entry rung reads the junior table, and only some weeks carry an entry rung – so the extra
 *  `computeRanking` and the ledger scan behind it are built on first use and never on a week that
 *  does not ask. `feat/field-in-brackets` bought this tick a real speed-up and this wave is not
 *  entitled to spend it on a fold nobody reads.
 *
 *  ZERO draws on any stream, and `at()` is a W-track question: every caller asks it of a W rung. */
export function proDoors(world: WorldState, merged: readonly RankingRow[]): ProDoors {
  const rankOf = new Map<string, number>()
  const wtaPointsOf = new Map<string, number>()
  for (const r of merged) {
    rankOf.set(r.playerId, r.rank)
    wtaPointsOf.set(r.playerId, r.points)
  }
  /** The on-ramp's own currency: the ITF junior table, folded WITHOUT the kid on the same
   *  independence rule every other AI-side fold obeys – plus the second proof, that she has played a
   *  professional tournament inside the window. An APPEARANCE, not a counting result: a first-round
   *  exit is still a week she spent on the tour, which is exactly the split `SeasonResult` was
   *  widened to carry (wave-b-first-round-zero). */
  let onRampRead: { itfPointsOf: Map<string, number>; played: Set<string> } | null = null
  const onRampFacts = () => {
    if (onRampRead) return onRampRead
    const itfPointsOf = new Map<string, number>()
    for (const r of computeRanking(
      world.results.filter((x) => x.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.itf,
      cohortIds(world),
      inTrack('itf'),
    )) {
      itfPointsOf.set(r.playerId, r.points)
    }
    const played = new Set<string>()
    for (const r of world.results) {
      if (r.playerId === KID_ID) continue
      if (r.week > world.week || world.week - r.week > RESULTS_WINDOW) continue
      if (r.tier && TIERS[r.tier].track === 'wta') played.add(r.playerId)
    }
    onRampRead = { itfPointsOf, played }
    return onRampRead
  }
  return {
    at(tier: TierId) {
      const accepts = TIERS[tier].track === 'wta' ? acceptanceRank(world, tier) : undefined
      if (accepts === undefined) {
        const { itfPointsOf, played } = onRampFacts()
        // ⚠ THROUGH `isTierEligible`, NEVER BY RE-SPELLING THE BAND. It is the same helper
        // `onRampOpen` reads for the kid – one place derives the point band, which is the fact
        // tests/round10.test.ts R10-5 exists to keep true.
        return (id: string) => isTierEligible(tier, itfPointsOf.get(id) ?? 0) || played.has(id)
      }
      return (id: string) =>
        (wtaPointsOf.get(id) ?? 0) > 0 && (rankOf.get(id) ?? Number.MAX_SAFE_INTEGER) <= accepts
    },
  }
}

/** The GRADUATED-OUT half of the band, on its own: her points have passed the tier's ceiling.
 *  Round-10: pulled out as a named rule because two places need exactly this direction (the entry
 *  gate's 'outgrown' verdict and the deadline release), and each used to spell the comparison out
 *  by hand – which is how "outgrown" came to mean slightly different things on different surfaces. */
export function outgrewTier(tier: TierId, points: number): boolean {
  return points > TIERS[tier].enterPointBand[1]
}

/** HER PLACE in one named table – the one number every rank surface reads, so a chip and the entry
 *  gate that used the same number to decide her entries cannot disagree. */
export function rankIn(world: WorldState, track: LadderTrack): number {
  if (track === 'itf') return world.kidRank
  // ⚠ EACH TABLE'S OWN SIZE IS ITS OWN "unranked" – see `tableSize`. The W one is 564 rows.
  if (track === 'wta') return world.kidRankWta ?? tableSize(world, 'wta')
  return world.kidRankDomestic ?? tableSize(world, 'domestic')
}

/** ...and her place in the SAME table a week ago. Its own function beside `rankIn` for the reason
 *  `prevKidRankDomestic` exists at all: a movement is (previous - current), and the two halves have to
 *  come from one table or the difference is a subtraction across two currencies. */
export function prevRankIn(world: WorldState, track: LadderTrack): number | null {
  if (track === 'itf') return world.prevKidRank
  if (track === 'wta') return world.prevKidRankWta ?? null
  return world.prevKidRankDomestic ?? null
}
