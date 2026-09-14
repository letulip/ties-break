// ⭐⭐⭐ THE SPOTLIGHT'S LEDGER – who the world is looking at, and what put her in the light THIS
// WEEK. Wave 6's T2 (docs/plans/life-wave-6-builder-2026-09.md §2), the model
// docs/specs/who-she-is-2026-09.md §3c and §3c-bis, the booth's own boundary
// docs/plans/the-way-she-sounds-2026-09.md C4.
//
// THE OWNER, 09.09: «давление известности и как она с ним справляется (и справляется ли вообще).»
//
// ⚠⚠ PURE DERIVATION: ZERO DRAWS, ZERO WRITES, NO CLOCK. Everything here is a question asked of
// records the world already keeps – the trophy cabinet, the signed letters' shoot weeks, the results
// ledger, the episode rows' publicity stamps. There is no `Rng` argument anywhere in this file, no
// `Math.random`, no `new Date` and not one assignment to anything reachable from `world`, which is
// what makes it safe to call from the weekly tick, from a bench and from a test in any order. The
// FROZEN MAIN capture (41550 / `e6b0c709`) cannot see this file by construction, and
// `tests/wave6-spotlight-ledger.test.ts` §E proves both halves with a key counter and a byte-for-byte
// world comparison rather than with this sentence. It is `world/fame.ts`'s own discipline, one
// concern over: fame is an accounted stock and this is an accounted WEEK.
//
// ⚠⚠ AND IT SHIPS WITH NO CALLER, WHICH IS THE WAVE'S DESIGN AND NOT AN UNFINISHED STEP. T3 passes
// the list into `accrueSpirit`'s own pass at the `phaseHerWeek` caller (§0.1's dependency
// inversion), T4 reads the news gate for habituation, T5 shrinks the term by rung, T6 fires the leak
// behind the same gate and T7 stamps the booth. A reader looking here for an EFFECT is in the wrong
// file by exactly one commit.
//
// ⚠ TWO OF THE FIVE KINDS CANNOT FIRE ON THIS TREE, AND THAT IS ALSO BY CONSTRUCTION. `'aired'`
// reads `airedMetWeek` / `airedEndedWeek` and `'wrongStory'` reads `publicWeek` + `publicWrong` –
// four v77 fields whose only writers are T6 and T7, so today they are `null` / `false` on every row
// in the game. Reading the STAMP rather than deciding the fact is what keeps this function pure; the
// two kinds are proven live by crafted worlds that set the fields directly (the ledger test's §C and
// §D), because a kind whose test can never reach it is a kind that ships unproven.
import { ECONOMY } from '../economy'
import { TIERS, TIER_LADDER } from '../season/calendar'
import { KID_ID } from './constants'
import { completedShootWeeks, fameAt } from './fame'
import { loveEpisodesOf } from './loveEpisodes'
import type { TierId } from '../season/types'
import type { WorldState } from '../world'

/** The five things that put her in the light, and there are exactly five (§3c's own list plus the
 *  two the leak model adds). ⚠ T3 prices the week by KIND – `pressureBase[kind]` – so a sixth member
 *  is a design decision with a number attached, never a convenience. */
export type ExposureKind = 'stage' | 'shoot' | 'publicLoss' | 'aired' | 'wrongStory'

/** ONE thing that put her in the light this week.
 *
 *  ⚠ AN OBJECT WITH ONE FIELD RATHER THAN A BARE `ExposureKind[]`, deliberately and for the reason
 *  `LoveEpisode.partnerId` is its own field: the shape is what the wave's other seven tasks receive,
 *  and a later wave that needs to say WHICH stage or WHICH episode adds a field here without
 *  touching a signature or a caller. It carries the kind alone today because that is all T3's
 *  product reads, and a field nobody reads is a field nobody can be wrong about yet. */
export interface ExposureEvent {
  kind: ExposureKind
}

/** ⭐⭐⭐ IS SHE NEWS AT `week`? – THE ONE GATE EVERY PUBLIC SURFACE IN THIS WAVE SHARES. The
 *  pressure, habituation's growth, the leak hazard, the booth's licence and all five exposure kinds
 *  sit behind this single predicate: an unknown girl has no spotlight, whatever she wins.
 *
 *  ⚠ `week` IS REQUIRED AND NOT DEFAULTED TO `world.week`, unlike `fameAt`'s own trailing parameter.
 *  This wave's benches ask about weeks that are not today (T9), and a default is what lets a caller
 *  silently ask about the wrong one – the same argument ruling A makes about `accrueSpirit`'s third
 *  parameter, applied where it costs nothing: every call site states the week out loud.
 *
 *  ⚠ THE BAR IS `ECONOMY.spotlight.newsFameMin` AND IT IS UNRULED – see that constant for the 33-save
 *  measurement that replaced the brief's struck anchor, and for T9's own sweep of it. */
export function sheIsNewsAt(world: WorldState, week: number): boolean {
  return fameAt(world, week) >= ECONOMY.spotlight.newsFameMin
}

/** Is this tier at or above the big-stage bar? `TIER_LADDER`'s index and nothing else – ruling F.
 *
 *  ⚠⚠ BOTH SIDES ARE GUARDED AGAINST −1, WHICH IS THE WHOLE POINT OF THE HELPER. `indexOf` does not
 *  throw: it returns −1, and −1 compares as «below every rung» on the left and «above every rung» on
 *  the right. `src/art/venues.ts:150` records what that costs in this repo – a hand-written tier
 *  array whose walk «never» ran, silently. So an unknown tier (a stale save, a renamed rung) is NOT
 *  a big stage, and a bar that fails to resolve turns the kind OFF rather than on. ⚠ The bar's own
 *  resolution is pinned by a test (`… §A`, «the bar resolves to an index > -1»), so the second guard
 *  is a belt on a braced constant rather than a silent fallback anybody could come to rely on. */
function atOrAboveStageBar(tier: TierId): boolean {
  const bar = TIER_LADDER.indexOf(ECONOMY.spotlight.stageTierMin)
  const rung = TIER_LADDER.indexOf(tier)
  if (bar < 0 || rung < 0) return false
  return rung >= bar
}

/** ⭐⭐⭐ WHAT PUT HER IN THE LIGHT THIS WEEK – five kinds, every one of them licensed by a fact the
 *  world already records, every one of them gated on `sheIsNewsAt`.
 *
 *  §3c's own sentence is the list: «the weeks that put her in the light – a title or a final on a big
 *  stage, a shoot week, a heavily public loss – carry a pressure perturbation», plus the booth's
 *  mention (ruled 10.09: «such a mention IS an exposure event of this very family») and §3c-bis's
 *  wrong story («a wrong public story is its own pressure event»).
 *
 *  ⚠⚠ THE HORIZON IS NOT THE SAME FOR ALL FIVE, AND THIS IS THE ASYMMETRY THE NEXT WAVE WOULD
 *  OTHERWISE FIND AS A BUG (the architect's ruling G, 14.09, written down here because an asymmetry
 *  nobody wrote down is an asymmetry somebody re-discovers). Four of the five read facts that are
 *  kept forever: `trophiesByTier` is append-only and never pruned, `AdOfferTerms.shootWeeks` lives on
 *  a signed letter, and the episode rows' four v77 stamps are part of the biography. **`'publicLoss'`
 *  is the exception**: an early exit is stamped nowhere permanent – `bestFinishByTier` is a
 *  high-water mark carrying no week at all – so its only record is `world.results`, and that array
 *  PRUNES AT 52 WEEKS (`RESULTS_WINDOW`, `world/bookkeeping.ts`; the engine says so twice in its own
 *  comments, at `world.ts:652` and again in the fame context at `world.ts:1093`). **So this function
 *  is honest about `'publicLoss'` only inside a 52-week horizon**, and about the other four at any
 *  age. The weekly tick asks about the week that has just CLOSED – `world.week − 1`, the architect's
 *  ruling P, corrected from `world.week` by v77's T3b – which sits ONE week inside a 52-week window,
 *  so the tick never meets the edge either; T9's benches MUST stay inside it too – a bench that walks
 *  a career and asks retrospectively will see every `'stage'` and no `'publicLoss'`, and will report
 *  the prune as if it were a fact about her life. The pin is
 *  the ledger test's §F: a big-stage title and a big-stage early exit stamped in the SAME old week,
 *  pruned by the engine's own `housekeep`, and only one of the two still answers.
 *
 *  ⚠⚠ AND `'stage'` READS THE CABINET, NOT `fameEventWeeks`. The brief warns about this and it is
 *  worth the second sentence: `fameEventWeeks` (`world/fame.ts`) is the list of every week fame CAN
 *  RISE ON, which is a different question – it carries w15 titles, season-end stamps, the Slam debut,
 *  every ad campaign's start week and every shoot week + 1. Half of those are nobody's spotlight, and
 *  a ledger built on it would charge her for a W15 trophy nobody outside the tournament noticed.
 *
 *  ⚠ ORDER IS THE DECLARATION ORDER OF THE KINDS, AND THE LADDER'S FOR `'stage'` – deterministic, so
 *  a test may deep-equal the list rather than sorting it, and two runs of the same world can never
 *  disagree. Duplicates are real and kept: two facts in one week are two events, because T3 sums the
 *  week's events and a week that held two is not a week that held one. (The FEED prints one row a
 *  week whatever the count – §3c's legibility law – but that is T3's business and not this list's.)
 *
 *  Pure: reads the world, writes nothing, draws nothing. */
export function exposureEventsOf(world: WorldState, week: number): ExposureEvent[] {
  const out: ExposureEvent[] = []
  // ⚠⚠ A WEEK BEFORE THE CAREER BEGAN HOLDS NOTHING, AND IT IS ANSWERED RATHER THAN REFUSED (v77's
  // T3b, the architect's ruling P). The weekly caller now asks about `world.week − 1`, so «the week
  // before week 0» is a question this function has to have an answer to. The honest one is the
  // EMPTY LIST: a negative week carries no trophy, no result row and no stamp, because every record
  // this function reads is written with a week that is 0 or more. ⚠ IT IS A STATED LAW AND NOT A
  // REPAIR – measured 14.09, the readers below already answer a negative week with nothing
  // (`decayAt` returns 0 for anything in the future, so `fameAt(world, −1)` is 0 and the news gate
  // alone would close the door), and that is exactly why it is written down: the emptiness would
  // otherwise be a coincidence of three separate rules, any one of which a later wave could retune.
  // Nothing indexes, nothing throws, and nothing depends on `newsFameMin` being above zero. ⚠ IT IS
  // NOT A SIXTH GATE: it answers a week that never existed, and every KIND is still gated in exactly
  // one place, one line down.
  if (week < 0) return out
  // ⚠⚠ THE GATE COMES BEFORE EVERY KIND, AND IT GATES EVERY KIND – «an unknown girl has no spotlight,
  // whatever she wins» (the brief's T2, in those words). It is deliberately not five separate checks:
  // one predicate, one place, so no kind can be added later that quietly forgets it.
  if (!sheIsNewsAt(world, week)) return out

  // 'stage' – A TITLE OR A FINAL AT A BIG STAGE THIS WEEK. Ruling G part 1: the cabinet is the
  // permanent, exact record, written at `finalizeTournament` (`world.ts:673-674`) where `kidFinish
  // === 0` pushes the week onto `titles` and `=== 1` onto `finals`. ⚠ `finals` MEANS SHE LOST THE
  // FINAL (the ledger's own contract, so a title is never counted twice) – and a lost final is still
  // «a final on a big stage» in §3c's sentence, so the kind is `titles ∪ finals`. The walk is over
  // THE LADDER rather than over `Object.entries(trophiesByTier)` so the order is the ladder's own and
  // not a record's insertion order.
  for (const tier of TIER_LADDER) {
    if (!atOrAboveStageBar(tier)) continue
    const shelf = world.trophiesByTier?.[tier]
    if (!shelf) continue
    for (const w of shelf.titles) if (w === week) out.push({ kind: 'stage' })
    for (const w of shelf.finals) if (w === week) out.push({ kind: 'stage' })
  }

  // 'shoot' – A DELIVERED SHOOT WEEK. §3c lists «a shoot week» among the weeks that put her in the
  // light, so the event is the week the CAMERAS WERE THERE.
  //
  // ⚠⚠ AND THE ARGUMENT IS `week + 1`, WHICH IS NOT A TYPO AND IS THE ONE CORRECTION T2 MAKES TO ITS
  // OWN BRIEF. `completedShootWeeks(world, w)` returns the shoot weeks lived STRICTLY BEFORE `w` –
  // its own contract, `world/fame.ts`: «a week still ahead is a promise, not a photograph». So
  // `completedShootWeeks(world, week).includes(week)` – the brief's literal spelling – is FALSE for
  // every world at every week: the filter that makes the helper correct is the filter that makes that
  // reading a kind which can never fire. Measured 14.09 on a crafted world with a shoot at week 200:
  // `completedShootWeeks(w, 200)` is `[]` and `completedShootWeeks(w, 201)` is `[200]`. Asking with
  // `week + 1` asks «has week `week` been lived yet», which is exactly the question, and it keeps the
  // ONE predicate (`shootWeeksLived`, private to fame.ts) rather than copying its two rules – so a
  // week the college freeze swallowed lapsed silently here too, and bought no exposure because the
  // photograph was never taken. ⚠ ONE EVENT FOR THE WEEK AND NOT ONE PER LETTER: the kind answers
  // «was this a shoot week», the clash machinery (`world/shootClash.ts`) exists precisely because the
  // calendar does not want two in one week, and the pressure is for the cameras being there.
  if (completedShootWeeks(world, week + 1).includes(week)) out.push({ kind: 'shoot' })

  // 'publicLoss' – A HEAVILY PUBLIC LOSS: an early exit at a big stage, this week. Ruling K owns this
  // kind end to end, and both halves of it are load-bearing.
  //
  // ⚠⚠ IT IS DERIVED FROM POINTS, NEVER FROM A ROUND, BECAUSE THE ROW HAS NO ROUND. `SeasonResult`
  // (`season/ranking.ts`) is `{ playerId, week, points, tier?, mandatoryMiss? }` – no finish index,
  // nothing about the draw. `points` is the only signal, and it identifies the round EXACTLY: each
  // tier's `points` array is strictly decreasing with `log2(drawSize) + 1` entries, so the finish
  // index and the payout are in bijection and a points threshold IS a round threshold. «Lost in the
  // first or second round» is finish index `>= log2(drawSize) − 1`, i.e. `points <=
  // points[log2(drawSize) − 1]` – re-measured 14.09: 60 at wta500, 65 at wta1000, 70 at a slam.
  //
  // ⚠⚠ READ THE THRESHOLD, NEVER INVERT THE ARRAY. `points.indexOf(row.points)` is exact only while
  // every value in every array is distinct – true today, guarded by nothing, and silently wrong the
  // day a tier is re-priced with a repeat, because `indexOf` returns −1 and −1 compares as «the
  // earliest exit there is». The comparison is `<=` against the named slot, which stays true under
  // any re-pricing that keeps the array decreasing.
  //
  // ⚠⚠ A SKIPPED MANDATORY IS NOT A PUBLIC LOSS. `mandatoryMiss` marks the scoreless row the tour
  // writes when she does not turn up – it takes a SLOT, not points – and she was never at the
  // tournament. A girl who did not play did not lose in front of anyone, and charging her spotlight
  // pressure for it would be a success tax on an ABSENCE, which the wave's §0.4 forbids twice over.
  //
  // ⚠ AND THE ROW EXISTS AT ALL ONLY BECAUSE THE BIG STAGES PAY FOR A FIRST-ROUND LOSS. `world.ts`
  // pushes her row `if (points > 0)`, and the four tiers this kind can reach pay 1 / 1 / 10 / 10 at
  // the last rung (wta250 / wta500 / wta1000 / slam, measured) – so every early exit at a big stage
  // leaves a record. A tier re-priced to 0 at R1 would stop writing the row and this kind would go
  // quiet for it; that coupling is stated here because it is invisible from this file.
  //
  // ⚠ A ROW WITH NO `tier` CANNOT BE JUDGED and is therefore not a public loss: the field is optional
  // for AI rows and pre-r5 saves (`SeasonResult`'s own note), and «unknown stage» must not be read as
  // «big stage».
  for (const row of world.results ?? []) {
    if (row.playerId !== KID_ID || row.week !== week) continue
    if (row.mandatoryMiss === true) continue
    const tier = row.tier
    if (!tier || !atOrAboveStageBar(tier)) continue
    const def = TIERS[tier]
    // ⚠ TYPED NULLABLE ON PURPOSE. The compiler has no `noUncheckedIndexedAccess` here, so an
    // out-of-range read types as `number` and would compare as one; a tier whose `points` array is
    // shorter than its draw (a re-pricing accident) would then charge her for every result at that
    // rung. Annotated, the guard below is a guard rather than a comparison TypeScript refuses.
    const earlyExitFloor: number | undefined = def.points[Math.log2(def.drawSize) - 1]
    if (earlyExitFloor === undefined) continue
    if (row.points <= earlyExitFloor) out.push({ kind: 'publicLoss' })
  }

  // 'aired' – THE BOOTH TOUCHED HER PRIVATE LIFE THIS WEEK. T7 decides in the weekly tick and STAMPS
  // the episode; this reads the stamp, which is what keeps the function pure – the decision has a
  // licence, a window and a once-ness, and none of them belongs in a derivation. ⚠ TWO STAMPS AND
  // NOT ONE: the world can learn she is with somebody long before it learns it ended, they air
  // independently, and a week that voiced both facts is a week that held two events (T7 voices at
  // most one, so today the second is unreachable through the engine – it is the DATA's shape that is
  // honoured here, not T7's policy).
  for (const ep of loveEpisodesOf(world)) {
    if (ep.airedMetWeek === week) out.push({ kind: 'aired' })
    if (ep.airedEndedWeek === week) out.push({ kind: 'aired' })
  }

  // 'wrongStory' – A LEAK LANDED WRONG THIS WEEK (§3c-bis: «a wrong public story is its own pressure
  // event, its own feed row, and its own beat»). The landing WEEK is `publicWeek`, so the event fires
  // on the week the world was told the wrong thing and never again. ⚠ `publicWrong` IS MEANINGLESS
  // WHILE `publicWeek` IS NULL – the field's own contract in `protocol/narrative.ts` – and the `&&`
  // here is where that licence is honoured: a story that was never told cannot have been told wrong.
  for (const ep of loveEpisodesOf(world)) {
    if (ep.publicWeek === week && ep.publicWrong) out.push({ kind: 'wrongStory' })
  }

  return out
}
