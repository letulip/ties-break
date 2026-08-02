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

import { TIERS, TIER_LADDER, hasAcceptanceList } from '../season/calendar'
import { BEST_N_BY_TRACK, computeRanking, windowedBestSum, type SeasonResult } from '../season/ranking'
import type { LadderTrack, RankingRow, TierId } from '../season/types'
import { fieldProsFor, mergedWtaRanking, type FieldPro } from '../season/fieldPros'
import { seasonIndexOf } from './ledger'
import { KID_ID } from './constants'
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

export function rankingFor(world: WorldState, track: LadderTrack): RankingRow[] {
  // THE WINDOW SPLIT LANDS HERE (W2-LADDER §3): best-6 for domestic/itf, best-16 for the
  // professional table, and because this is the ONE fold every table-reader flows through (rank
  // caches, standings, acceptance cuts, LadderViews), no surface can count a season on the wrong
  // rule.
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
  world.kidRank = row?.rank ?? world.cohort.length + 1
  const dom = domesticRanking(world).find((r) => r.playerId === KID_ID)
  world.kidRankDomestic = dom?.rank ?? world.cohort.length + 1
  const wta = rankingFor(world, 'wta').find((r) => r.playerId === KID_ID)
  world.kidRankWta = wta?.rank ?? world.cohort.length + 1
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
  const fieldSize =
    TIERS[tier].track === 'wta'
      ? world.cohort.length + 1 + fieldProsOf(world).length
      : world.cohort.length + 1
  return Math.max(1, Math.round(pct * fieldSize))
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
    return kidPoints(world, 'wta') > 0 && (world.kidRankWta ?? world.cohort.length + 1) <= accepts
  }
  return isTierEligible(tier, kidPoints(world, 'domestic'))
}

/** The GRADUATED-OUT half of the band, on its own: her points have passed the tier's ceiling.
 *  Round-10: pulled out as a named rule because two places need exactly this direction (the entry
 *  gate's 'outgrown' verdict and the deadline release), and each used to spell the comparison out
 *  by hand – which is how "outgrown" came to mean slightly different things on different surfaces. */
export function outgrewTier(tier: TierId, points: number): boolean {
  return points > TIERS[tier].enterPointBand[1]
}
