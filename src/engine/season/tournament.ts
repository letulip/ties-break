// Package L – single-elimination tournaments. Pure: given the entrants, an
// optional kid, and an RNG, the bracket resolves deterministically. Kid matches
// run the full point engine under an event-scoped seed (replayable); AI-AI matches
// resolve from the closed-form win probability with a single RNG draw.

import { rngFromSeed, type Rng } from '../rng'
import type { MatchPlayer, Tour } from '../match/types'
import { simulateMatch, fastMatchProbability } from '../match/engine'
import { TIERS, TIER_LADDER, isTierAgeOpen } from './calendar'
import { NATION_POOL } from './cohort'
import { ECONOMY } from '../economy'
import type { AiPlayer, MatchRecord, RankingRow, SeasonEvent, TierId, TournamentResult } from './types'

// Junior events run under WTA-average scoring (the project is WTA-first). Fixed so
// stored kid-match seeds reproduce exactly.
export const JUNIOR_TOUR: Tour = 'wta'

// AI entry ambition, by standings PERCENTILE (`(position + 1) / fieldSize`, 0 = best).
//
// Was a partition (top 25% → national, next → regional, rest → local) with exactly one tier per
// player. The J family broke that: six tiers, four of them 32-draws, over a 199-strong cohort
// leaves ~33 candidates per disjoint band – barely more than the draw itself, so every J300 would
// have run with the same 32 players. Windows now OVERLAP (TierDef.entrantPctBand), exactly like
// the kid's `enterPointBand`: a junior is a candidate for several rungs at once and the
// position-biased jitter below decides which draw she actually turns up in.
//
// The candidate COUNT per tier is a constant of the window, because percentiles are derived from
// ORDINAL POSITION and the positions are always a permutation of 0..n-1. `selectEntrants`' draw
// count is therefore independent of the ranking's CONTENT – it was what kept the MAIN weekly
// stream stable back when the AI brackets ran on it, and it still keeps each event's own
// `seed:aitour:<id>` / `seed:kidtour:<id>` stream aligned across replays of the same event.

/** True ⇔ a player at standings percentile `pct` is a candidate for `tier`'s draws. */
export function isEntrantBand(tier: TierId, pct: number): boolean {
  const [lo, hi] = TIERS[tier].entrantPctBand
  return pct >= lo && pct <= hi
}

/** The STRONGEST tier a player at percentile `pct` is a candidate for – her "home" level, used to
 *  give the cohort a coherent pre-history (season/prehistory.ts). Falls back to the entry tier.
 *
 *  ⚠ THE PRE-HISTORY IS A JUNIOR PAST, AND THE ADULT RUNGS ARE EXCLUDED FROM IT ON PURPOSE (task
 *  #17). W100's entrant window is [0, 0.25] – identical to J300's, because both are the prestige rung
 *  of their own table – so the moment the W family joined TIER_LADDER this walk started handing the
 *  top quarter of the cohort a professional pre-history. A W result pays into the WTA table and not
 *  the ITF one, so the junior ranking THE GAME IS ABOUT emptied out: measured on the pinned career,
 *  the kid's opening ITF rank went #120 -> #1, not because she had improved but because the elite's
 *  points had left the table she is ranked in.
 *
 *  The right answer is not an age gate here (the cohort spans 13-19, so a gate would still have given
 *  the older third a professional past). It is that THE PROFESSIONAL TABLE STARTS EMPTY, for everyone,
 *  because nobody in this world has ever played a professional tournament: the rungs opened this
 *  release. Every WTA point in a career is therefore one somebody actually won, in a draw the engine
 *  actually ran – which is also what makes W35/W100's acceptance cut mean something instead of being
 *  measured against a fabrication. This function's own pre-adult behaviour is byte-identical, which is
 *  why every ranking pin in the suite still reads what it read yesterday.
 *
 *  Who is in a LIVE draw is a different question with a different answer – see the age gate in
 *  `selectEntrants` below, which is where age genuinely belongs. */
export function topBandForPercentile(pct: number): TierId {
  for (let i = TIER_LADDER.length - 1; i >= 0; i--) {
    const tier = TIER_LADDER[i]
    if (TIERS[tier].track === 'wta') continue
    if (isEntrantBand(tier, pct)) return tier
  }
  return TIER_LADDER[0]
}

// Standard seeded-bracket slot order for a power-of-two draw: slot i holds the
// seed at index i (1-based). Seed 1 and seed 2 land in opposite halves; each round
// pairs adjacent slots. Built by the classic recursive fold.
export function standardSeedOrder(n: number): number[] {
  let seeds = [1, 2]
  while (seeds.length < n) {
    const sum = seeds.length * 2 + 1
    const next: number[] = []
    for (const s of seeds) {
      next.push(s)
      next.push(sum - s)
    }
    seeds = next
  }
  return seeds
}

// =================================================================================================
// THE ON-RAMP, FOR THE AI SIDE (W3-ONRAMP, 04.08) – slots a professional draw holds for the players
// coming up from the table below it.
// =================================================================================================
//
// WHY IT EXISTS: THE CLOSED LOOP W3-FIELD3 LEFT BEHIND, measured before a line of this was written
// (tools/w-onramp-probe.ts). That wave made the W-track canonical brackets select from LIVE cohort ∪
// 364 derived professionals against the MERGED W standings. The merged table sorts on points, every
// derived pro holds three figures of them and every LIVE player starts on nought – so the whole
// cohort sits at positions 364+ of a 563-row table, while a W15 draw is filled position-biased
// (`key = position + rng × drawSize`) from the head of its own band, around #124. A cohort player
// can therefore never be DRAWN into a W event; never being drawn she can never EARN a W point; never
// earning one she can never LEAVE position 364. Measured on the shipped engine: **0.0 W-tier ledger
// rows for LIVE players, per season, on every seed** – against 3,170 a season the week before the
// wave. The only player in the world who could ever hold a W point was the kid.
//
// ⚠ AND IT IS THE SAME SENTENCE THE W15 TIER NOTE ALREADY WRITES, one population over: "a player
// cannot hold a ranking in a table she has never played in, and a rank gate on the first rung would
// be a closed loop" (calendar.ts, `w15.enterPointBand`). The KID has had the answer since the adult
// rungs shipped – her W15 door reads her ITF JUNIOR points, and the rungs above it read her W rank –
// and the cohort simply never got it. This is that door, opened for everybody.
//
// THE SHAPE, in one sentence: a W draw holds `ON_RAMP.slots` of its places for LIVE players who pass
// the RUNG'S OWN ACCEPTANCE DOOR – the kid's, in the kid's currency – and among them entry is the
// same position-biased lottery, read on the table they DO have a place in (the AI side's mixed
// ordinal fold) rather than on the professional one they do not.
//
// WHAT IT IS NOT: it is not a fabricated standing. Nobody is given a W point they did not win, so
// `topBandForPercentile`'s ruling («the professional table starts empty, for everyone, because
// nobody in this world has ever played a professional tournament») survives intact – what moves is
// who is allowed through the DOOR, never what is written on the table behind it.
//
// ⚠⚠ AND IT IS FILLED AFTER `resolveDoubleBookings`, NOT INSIDE `selectEntrants` – WHICH IS A
// MEASURED DECISION AND NOT A LAYERING PREFERENCE. The first build ran the lottery inside the draw,
// which left a held slot free to land on a junior the SAME WEEK'S J300 had already drawn. The engine
// then resolved that collision exactly as it is supposed to (the higher rung keeps her, the junior
// event backfills «best standing first» – §"ONE BODY, ONE WEEK" below), and the side effect was that
// **every held slot quietly UPGRADED a junior draw**: the girl it pulled out was replaced by a
// stronger one. Measured, ~100 such collisions a season, and two shipped balance tripwires moved on
// it – tests/econ-reach.test.ts's 14→16 count and the C3 corridor in
// tests/fatigue-bench-policy.test.ts. Filling after the week is resolved, from the players nobody has
// booked, makes "one body, one week" true of the held slots BY CONSTRUCTION and leaves the junior
// tour's fields exactly as the junior tour drew them.
//
// The event's own sub-stream does not notice the move: nothing else touches `seed:aitour:<id>`
// between `selectEntrants` and `runTournament`, so the draws still sit in the same position in the
// same order, and the candidate COUNT is the band's, never the booked set's.
//
// ⚠ SCOPE: THE CANONICAL BRACKETS ONLY, AND THAT IS STATED RATHER THAN DISCOVERED LATER. Her own
// shadow draws and their previews (`seed:kidtour:`) still fill a W field from professionals alone,
// so she does not yet MEET the cohort's graduates in the tournament she plays – she only meets them
// in the standings. The two universes have always differed for one event id (see
// `announceTourChampion`'s note and docs/specs/dual-universe.md), and widening the seam to her side
// moves her measured difficulty at every W rung, which is a second change and wants its own
// measurement. Both halves come through THIS function, so it is three call sites and no new
// mechanism when the owner wants it.

/** WHO GETS THE HELD SLOTS – everything `fillOnRamp` needs to run the lottery. Built for W rungs
 *  only; the six junior/domestic rungs never call it and are byte-identical, draws included. */
export interface OnRamp {
  /** the LIVE players – `world.cohort`, in world order */
  pool: readonly AiPlayer[]
  /** the table they HAVE a place in: the AI side's mixed ordinal fold, folded without the kid */
  ranking: readonly RankingRow[]
  /** the rung's own acceptance door, asked per id. See `proDoors` (world/ladder.ts) – it is the
   *  kid's `tierFloorOpen`, read for a cohort id instead of for her. */
  admits: (id: string) => boolean
  /** how many of the draw are held. `ON_RAMP.slots` at every engine call site; a parameter rather
   *  than a constant read in here so a bench can sweep it without patching the module. */
  slots: number
}

/** HOW MANY OF A 32-DRAW ARE HELD, and it is one number for the whole W track on purpose.
 *
 *  The real tour's answer is "the qualifiers and the wildcards", which at an ITF W15 is a quarter of
 *  the draw and at a major is a handful – but the TAPER IS ALREADY IN THE RULE rather than in a
 *  table of ten numbers: `OnRamp.admits` is the rung's own acceptance cut, so a cohort player is
 *  admitted to W15 on junior points, to W35/W50/W75 on her first professional result, and to a major
 *  only once she is genuinely inside its list. A rung nobody clears holds no slots however many it
 *  reserves, and the constant never has to know which rung it is on.
 *
 *  ⚠ A PLAIN OBJECT, NOT A BARE `const`, DELIBERATELY – the same idiom and the same reason as
 *  `BEST_N_BY_TRACK`: tools/w-onramp-probe.ts sweeps it (`--slots`) and restores it, so the number
 *  can be re-derived by a bench rather than argued about. Engine code never writes it.
 *
 *  TWO of thirty-two (6.3%) – A WILDCARD PAIR, and it is the CONSERVATIVE end of the real anchor on
 *  purpose. A real 32-draw holds more than this for the players coming up (about four qualifiers,
 *  plus wildcards); what fixes the number here is not the sport but the three shipped balance
 *  tripwires the cohort's professional load moves, and the measurement that decided it:
 *
 *      slots            0      1      2      3      4      6      8
 *      C3 ratio      2.538  1.941  2.071  1.688  2.067  1.813  2.067   (tests/fatigue-bench-policy)
 *      reach 14->16     10      4      6      6      4      5      9   (tests/econ-reach, band 6-20)
 *      reach 14->18     21     22     23     22     28     22      -   (tests/econ-reach, band 9-24)
 *
 *  ⚠ READ THAT AS THE FINDING IT IS: ONE held slot moves them as far as EIGHT do. They are small
 *  pooled counts over 20-30 careers and they respond to the world being DIFFERENT, not to how
 *  different - so no setting buys the C3 corridor back, and choosing a number to make them read well
 *  would be "a number picked to make a test interesting", the failure mode econ-reach's own history
 *  is a record of. What CAN be chosen honestly is the setting that leaves the most guards standing
 *  exactly as they shipped, and that is 2: both reach bands hold untouched, and the only assertion
 *  re-aimed anywhere is the C3 corridor, which cannot be held at any non-zero setting.
 *
 *  So the number is small by evidence rather than by taste, and RAISING IT IS AN OWNER DECISION with
 *  the table above in hand: 6 gives the cohort half again as much professional tennis and costs the
 *  `econ-reach` 14->16 band a re-aim. docs/specs/ai-w-onramp.md §4f and §5. */
export const ON_RAMP: { slots: number } = { slots: 2 }

// =================================================================================================
// ⭐⭐ THE WILD CARDS (round 21 #2b, 17.08 – the owner: «112 и надо подумать про wild card 8»)
// =================================================================================================
//
// A Grand Slam's 128 is **112 direct acceptances + 8 qualifiers + 8 wild cards** (2026 Grand Slam
// Rule Book, the same line `slam.acceptsRank = 112` is read off). We model the direct-acceptance
// line exactly; these are the eight the tournament GIVES AWAY. Qualifying is still not modelled and
// is not modelled here either – a qualifier earns her place in a draw we do not run.
//
// ⚠⚠ IT IS NOT A FIX FOR A STALL, BECAUSE THERE IS NO STALL. Measured before it was built
// (docs/specs/round21-measured-2026-08.md §5b): **0 of 14 careers had a career best inside the
// refused band**, and the band costs a median of fourteen weeks at the shipped 112. A wild card
// buys a STORY – one home crowd, one draw she had not earned – and if it is ever measured
// materially moving who reaches what, that is a finding to report and not a success.
//
// ⚠ WHY THE HOME-NATION GROUND AND NOT THE OTHER TWO. Reality uses three and we can express two:
//   * A HOME PLAYER. Built. There is no venue machinery anywhere in `src/`, but a host nation is
//     derivable from `(seed, event.id)` at zero persisted bytes, and every player already carries
//     `nation`. It is the one ground with a CAP INSIDE ITS OWN DEFINITION – at most one Slam a
//     season can be anybody's home Slam – so it needs no second tuning number to stop it running
//     away, and it reads as a reward rather than a gift.
//   * A YOUNG PROSPECT. Not built, and deliberately: `juniorReservedPlace` IS that idea one ladder
//     down, and `ON_RAMP` already holds two places in every W draw for exactly that population.
//     A third route with the same purpose would be the drift this file's ⚠⚠ box warns about.
//   * ⚠ A RETURNING NAME IS NOT EXPRESSIBLE AND IS DROPPED – SAID ONCE HERE SO THE NEXT READER DOES
//     NOT TRY. "She used to be #12 and has been away" needs a memory of a rank a player no longer
//     holds. Field pros persist ZERO BYTES (they are re-derived per season from `seed:field:<n>`,
//     see fieldPros.ts), so there is nowhere for a former ranking to live and nothing to read it
//     back from. It is not a missing feature; it is unrepresentable in this population model.
//
// ⚠ ONE MECHANISM, TWO CONFIGURATIONS – `fillOnRamp` is called a second time and NOT reimplemented.
// The eight held places are that function's exact existing shape: hold N of the draw, key one draw
// per candidate off the band, drop the LAST DIRECT ACCEPTANCES to make room. Two ways to hold a
// place in one draw is how the next inconsistency gets written, and the sport itself does it this
// way – qualifiers and wild cards are two reserved routes filled by one entry-list process.

/** HOW MANY PLACES A SLAM HOLDS FOR ITS WILD CARDS, and the rung it is the published number of.
 *
 *  ⚠ A PLAIN OBJECT, NOT A BARE `const`, the same idiom and the same reason as `ON_RAMP` and
 *  `BEST_N_BY_TRACK`: a bench can sweep `slots` and restore it rather than patch this module.
 *  Engine code never writes it.
 *
 *  ⚠ THE SLAM ALONE, AND THAT IS THE RULEBOOK'S OWN SCOPE. Research §4c-B prints four wild cards
 *  in a 32-draw W event too – but those rungs already hold `ON_RAMP.slots` for the junior on-ramp,
 *  and the W regulations are ONE "System of Merit" ordering with no published cut to be outside of
 *  (§4-A), so "a player the list refused" is not even expressible there. The Slam is the one rung
 *  whose regulation states a count, which is the same sentence that made `acceptsRank: 112`
 *  possible. See docs/decisions.md, round 21 item 2. */
export const WILD_CARD: { tier: TierId; slots: number } = { tier: 'slam', slots: 8 }

/** THE NATIONS A TOURNAMENT CAN BE HELD IN – the population's own weighted pool, plus the playable
 *  countries that pool happens not to contain.
 *
 *  ⚠ THE SECOND HALF IS THE WHOLE REASON THIS IS NOT JUST `NATION_POOL`. `NATION_WEIGHTS` is the
 *  distribution the WORLD's players are drawn from; the onboarding wizard offers a partly different
 *  list of twenty-four countries to the PLAYER. A code in one and not the other would give that
 *  player a mechanic that silently never fires – the quiet dead branch, not a refusal she could
 *  read. `tests/season/wildCard.test.ts` pins the two lists against each other by source, because
 *  the engine may not import a component (invariant 1) and a list that can drift needs a guard that
 *  cannot.
 *
 *  ⚠ NOT A SPECIAL CASE FOR THE PLAYER: the pool is a fixed array, identical in every career, and
 *  is never widened by reading `profile.country`. Her nation is one entry among the rest.
 *
 *  ⚠ AND IT IS NOT `NATION_WEIGHTS` ITSELF, which must not move: `makeJunior` spends one `pickInt`
 *  against `NATION_POOL`, so appending to it would re-map every existing seed's entire field – the
 *  cost the SURNAMES note in cohort.ts spells out. Appending HERE costs nothing, because nothing
 *  else reads this array. */
export const HOST_NATIONS: readonly string[] = [...NATION_POOL, 'BY']

/** WHERE THIS EVENT IS PLAYED – one draw on a purpose-scoped sub-stream, persisted nowhere.
 *
 *  ⚠ `seed:host:<eventId>`, NEVER MAIN, and re-derived at the call site every time (invariant 2).
 *  The event id is `${year}-w${week}-${tier}`, so a given Slam of a given season is held in the same
 *  country however many times anybody asks, across a save/load, and with no byte spent on it. That
 *  is what makes "no venue machinery in `src/`" a non-obstacle rather than a blocker.
 *
 *  ⚠ THE REAL FOUR MAJORS DO NOT ROTATE and ours do – a stated deviation. We name no city and no
 *  country anywhere in the UI (engine/nationalTeam.ts's note is the standing rule), so a fixed four
 *  would buy nothing a player could see while denying the beat to twenty of the twenty-four
 *  countries he may pick. The weighting still puts most home Slams in the deep tennis nations,
 *  which is the pattern that actually shows. */
export function hostNationOf(seed: string, eventId: string): string {
  const rng = rngFromSeed(`${seed}:host:${eventId}`)
  return HOST_NATIONS[Math.min(HOST_NATIONS.length - 1, Math.floor(rng() * HOST_NATIONS.length))]
}

/** ⭐ THE WILD-CARD RULE ITSELF, AS A PREDICATE OVER A RANK – written ONCE and read by both sides.
 *
 *  This is `proDoors`' discipline applied to a second door: the kid's gate and the AI fill ask the
 *  SAME function, so they cannot drift. "She can receive one on the same rule as everybody else"
 *  is not a promise in a comment here – it is the fact that there is one function.
 *
 *  `rank` is a 1-based position in the MERGED W table; `total` is that table's size.
 *
 *  TWO CLAUSES, AND NEITHER IS A NEW TUNING NUMBER:
 *   1. **Outside the rung's acceptance cut.** A direct acceptance does not need a wild card and
 *      must never be counted as having used one – that is what would turn the marker into a lie.
 *   2. **Inside the rung's own entrant band ceiling** (`entrantPctBand[1]`), which is the exact
 *      expression `fillOnRamp` already keys its candidates on. It is what stops the eight places
 *      going to a #900: a real home wild card goes to a player of roughly the level, and at the
 *      shipped numbers this window is about #113 to #333 of a ~1,799-row table.
 *
 *  ⚠ IT DOES NOT CLOSE THE REFUSED BAND AND IS NOT TRYING TO. Only #128 would, and #128 is
 *  "everybody in the draw size gets in", which is not a door at all. */
export function wildCardWindow(tier: TierId, rank: number, total: number, accepts: number | undefined): boolean {
  // ⚠ NO PLACES HELD ⇒ NOBODY HOLDS ONE, AND THIS LINE IS WHAT MAKES `WILD_CARD.slots` A REAL
  // MASTER SWITCH rather than half of one (found 17.08 while building the A/B for the field-strength
  // measurement). `fillWildCards` already returns early at `slots <= 0`, so the AI side went quiet –
  // but HER door read only the tier and the window, so at `slots 0` a tournament that holds no wild
  // cards would still have let her in on one. That is the two-sides-of-one-rule drift `proDoors`
  // exists to prevent, and it is also what a bench needs: `ON_RAMP`'s own note says the constant is a
  // plain object precisely so a probe can sweep it and get the pre-mechanic world back. It could not,
  // until this line.
  if (WILD_CARD.slots <= 0) return false
  if (tier !== WILD_CARD.tier || accepts === undefined) return false
  if (rank <= accepts) return false
  const ceiling = TIERS[tier].entrantPctBand[1]
  return total > 0 && rank / total <= ceiling
}

/** THE HELD SLOTS, FILLED – called once per W event after `resolveDoubleBookings` has settled the
 *  week (see the ⚠⚠ box above for why it is here and not inside `selectEntrants`).
 *
 *  `field` is the event's resolved entrants, in standings order. `ranking` is the table the draw is
 *  SEEDED by (the merged W standings); `onRamp.ranking` is the table the CANDIDATES are read on (the
 *  AI side's mixed ordinal fold) – two tables on purpose, because a player with no professional
 *  points has a place in exactly one of them. `booked` is everybody already playing somewhere this
 *  week, hers included: a held slot may never create the double-booking the week has just resolved.
 *
 *  Returns a NEW array of the same length, in standings order, ready for `buildDraw`. */
export function fillOnRamp(
  event: SeasonEvent,
  field: readonly AiPlayer[],
  ranking: readonly RankingRow[],
  rng: Rng,
  onRamp: OnRamp,
  /** the week's rival conditions, exactly as `selectEntrants` takes them */
  conditions?: ReadonlyMap<string, number>,
  booked?: ReadonlySet<string>,
): AiPlayer[] {
  // ⚠ FIRST, AND BEFORE A SINGLE DRAW: `slots = 0` must cost nothing on the stream, or the bench's
  // own A-arm (`tools/w-onramp-probe.ts --slots 0`) would not be the pre-fix world it claims to be.
  if (onRamp.slots <= 0) return [...field]
  const total = ranking.length || field.length
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const posFor = (id: string) => posOf.get(id) ?? total - 1
  const jitter = TIERS[event.tier].drawSize
  const floor = ECONOMY.availability.minConditionToEnter[event.tier]
  const fit = (id: string) => (conditions?.get(id) ?? ECONOMY.condition.max) >= floor

  // ONE DRAW PER BAND CANDIDATE, and the gates come AFTER the keying – exactly as the availability
  // floor in `selectEntrants` does, and for the same reason: the count must be a function of the
  // WINDOW and the population, never of who happens to be fit, admitted or booked this week.
  //
  // THE CEILING OF THE BAND, NOT THE WHOLE BAND. `isEntrantBand` has a floor to keep weak players out
  // of big draws; for the on-ramp that job belongs to `admits`, in the professional table's own
  // currency, and reading the floor here as well would rebuild the closed loop one storey up – the
  // cohort's best juniors sit at the TOP of their own table, so a floor would make them candidates
  // for the majors alone, where the acceptance cut then refuses them for holding no professional
  // points. The ceiling is the half that is still meaningful: it is what stops the tail of the junior
  // field turning up at a WTA 1000.
  const jTotal = onRamp.ranking.length || onRamp.pool.length
  const jPos = new Map<string, number>()
  onRamp.ranking.forEach((r, i) => jPos.set(r.playerId, i))
  const jPosOf = (id: string) => jPos.get(id) ?? jTotal - 1
  const ceiling = TIERS[event.tier].entrantPctBand[1]
  const keyed = onRamp.pool
    .filter((p) => isTierAgeOpen(event.tier, p.ageYears) && (jPosOf(p.id) + 1) / jTotal <= ceiling)
    .map((p) => ({ p, key: jPosOf(p.id) + rng() * jitter }))
  keyed.sort((a, b) => a.key - b.key)

  const take = keyed
    .filter((c) => !booked?.has(c.p.id) && fit(c.p.id) && onRamp.admits(c.p.id))
    .slice(0, Math.min(onRamp.slots, field.length))
    .map((c) => c.p)
  if (!take.length) return [...field]

  // ...and the players who step aside are the LAST DIRECT ACCEPTANCES – the worst-positioned of the
  // field as drawn, which is precisely whom a qualifier or a wildcard displaces on a real entry list.
  //
  // A held slot is still a slot in THIS draw: the newcomer's seeding position is her real one in the
  // table the draw is seeded by, which for a player with no professional points is the back of it.
  // That is what an unseeded wildcard is, and `buildDraw` needs no special case for her.
  const kept = [...field].sort((a, b) => posFor(a.id) - posFor(b.id)).slice(0, field.length - take.length)
  return [...kept, ...take].sort((a, b) => posFor(a.id) - posFor(b.id))
}

// selectEntrants – the AI field for an event. Candidates are the cohort players whose standings
// percentile falls inside the tier's (overlapping) entrant window; entry among them is stochastic
// (position-biased) so the field varies, but the returned array is seeded by standings position
// (best first). Exactly one RNG draw per candidate – a fixed pattern given the ranking.
//
// The band is keyed off the player's ORDINAL POSITION in the standings, not the
// dense `rank` field: dense ranks collapse every zero-point player onto a single
// rank number, so `rank / total` would be a meaningless percentile and would herd
// the whole field into one band. Position gives a true 0..1 spread.
export function selectEntrants(
  event: SeasonEvent,
  cohort: AiPlayer[],
  ranking: RankingRow[],
  rng: Rng,
  /** every cohort player's condition this week (`rivalConditions`). A player absent from it has no
   *  results in the fatigue window and is fresh. Optional so the bench and the older tests can call
   *  this without one - and when it is absent, nobody is gated, which is the pre-gate behaviour. */
  conditions?: ReadonlyMap<string, number>,
  /** WEEK EXCLUSIVITY (W2-FIELD2): players a HIGHER W rung already drew for this same week. Empty
   *  or absent ⇒ byte-identical to the pre-rule function, which is what every non-W caller gets.
   *  See `weekFieldExclusion` below for who computes it and why it is not a filter on the pool. */
  excluded?: ReadonlySet<string>,
): AiPlayer[] {
  const total = ranking.length || cohort.length
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i)) // 0 = best standing
  const drawSize = TIERS[event.tier].drawSize

  // Percentile from position: (position + 1) / total lands in (0, 1]. Players
  // absent from the ranking sort to the back.
  const pctOf = (id: string) => ((posOf.get(id) ?? total - 1) + 1) / total

  // ⚠ WHO IS OLD ENOUGH TO BE HERE AT ALL – the universe this whole function draws from (task #17,
  // completed by §4.1). The cohort's own age band is [13, 19]: a junior field has always contained
  // the ones just starting and the ones about to age out, and that spread is what tells the two
  // tours apart. A W15 draw is the sixteen-and-overs; a J30 draw is the eighteen-and-unders; the
  // three-year overlap between them is deliberate and is what makes the fork at 19 a decision made
  // with evidence rather than a wall (see TierDef.maxAgeYears).
  //
  // BOTH ENDS OF THE RULE ARRIVED THROUGH THIS ONE LINE, and neither needed its own code. Task #17
  // added the minimum, so the adult tour's first season would not be played by thirteen-year-olds;
  // §4.1 added the maximum to `isTierAgeOpen` itself, so the junior tour stopped being played by
  // nineteen-year-olds. Measured on the shipped calendar before the ceiling: 13.7% of a J300 draw
  // and 11.3% of a J30 draw were 19 or older. That is the bug §1 of
  // docs/specs/adult-tour-and-endings.md names from the other side ("the field she meets there can
  // contain 28-year-olds"), and the fix is the same sentence for both: age is a fact about people,
  // not a label on a tier.
  //
  // IT IS THE UNIVERSE AND NOT JUST THE BAND, deliberately: both backfills below reach OUTSIDE the
  // entrant window, and an age rule that the backfills could walk around would be no rule at all -
  // the tired-elite path would have handed W100 slots straight to the children it just excluded,
  // and now would have handed J300 slots back to the adults who have just aged out of them.
  //
  // TOTAL: if the age gate leaves fewer players than the draw needs the whole cohort plays, because
  // a draw that cannot be filled is a crash rather than a compromise (same discipline as claimWeek's
  // gap retry). It cannot fire at the shipped numbers from either end - the J rungs want 32 of the
  // ~170 eighteen-and-unders and the youngest adult rung 32 of the ~82 sixteen-and-overs, in a 199
  // cohort whose conveyor intake keeps arriving at 13.
  const ofAge = cohort.filter((p) => isTierAgeOpen(event.tier, p.ageYears))
  //
  // ⚠ AND WHO IS ALREADY PLAYING SOMEWHERE ELSE THIS WEEK (W2-FIELD2, act2-pro-tour.md §8.2). The
  // exclusion lands HERE, on the universe, for exactly the reason the age gate does one line up:
  // both backfills below reach OUTSIDE the entrant window, so a rule they could walk around would
  // be no rule at all - the tired-elite path would hand a W15 slot straight back to the pro the
  // W100 drew an hour earlier, and "one pro plays one event a week" would be true of the band and
  // false of the draw.
  //
  // IT YIELDS TO FILLABILITY, in the same order the age gate's own escape does: a draw that cannot
  // be filled is a crash, not a compromise. So the ladder is free-and-of-age → of-age → everybody,
  // and the exclusivity rule is the first thing dropped rather than the last. It cannot fire at the
  // shipped numbers (the narrowest measured W window holds ~110 candidates against a draw of 32 and
  // at most one higher rung takes 32 of them), and it is here so a future cadence change cannot
  // turn a tuning decision into an undefined player in a bracket.
  const free = excluded && excluded.size ? ofAge.filter((p) => !excluded.has(p.id)) : ofAge
  const eligible = free.length >= drawSize ? free : ofAge.length >= drawSize ? ofAge : cohort
  //
  // RNG: the age gate changes the candidate COUNT, and therefore the per-event draw count, on every
  // rung that HAS one - which since §4.1 means the J rungs too, not the W rungs alone. Their event
  // sub-streams are NOT byte-identical to the pre-cap ones and cannot be: a J30 field really is
  // different people now.
  //
  // ⚠ NONE OF THAT IS ON THE MAIN WEEKLY STREAM, which is the invariant that matters and the reason
  // this was safe to widen. Every draw here comes off the event-scoped `seed:aitour:<id>` /
  // `seed:kidtour:<id>` sub-stream (see the callers in world.ts), so the frozen MAIN capture -
  // 41550 draws / hash e6b0c709, which is `driftCohort` spending exactly four draws per rival per
  // week and nothing else - is untouched BY CONSTRUCTION rather than by luck. Verified: it
  // re-derives byte-for-byte on this branch. The three domestic rungs carry no age gate at all, so
  // their sub-streams are byte-identical as well.
  const banded = eligible.filter((p) => isEntrantBand(event.tier, pctOf(p.id)))

  // ⭐⭐ THE HEAD OF THE ENTRY LIST (round 21 #4, 17.08) – `TierDef.acceptsFromRank`, and the whole
  // mechanism is three lines because the band already had the other end of it.
  //
  // `acceptsRank` is where a rung's list STOPS and this is where it STARTS: a player ranked inside
  // it is not refused a WTA 250, she is at a 1000 or a major that week. Without it the top of the
  // table filled every rung above the WTA 125 – measured, mean field core 68.4 / 68.9 / 68.4 at the
  // 250 / 500 / 1000, three windows onto one sixty-four-chair storey – and the 250 was worth 20.1
  // expected points to a #121 player against a W50's 29.7. See docs/specs/round21-measured-2026-08.md
  // §3f for the measurement and the-250-is-not-a-1000-2026-08.md for the fix.
  //
  // ⚠ THE POSITION, NOT THE DENSE RANK, exactly as the band above reads it and for the same reason:
  // dense ranks collapse every zero-point player onto one number. `position + 1` is a world rank
  // here because every W caller passes the MERGED W standings (world.ts's `selRanking`, the canonical
  // `tour.ranking`, preview.ts's) – which is why the field is documented WTA-track-only.
  //
  // ⚠ IT YIELDS TO FILLABILITY, in the same order and for the same reason as the age gate and the
  // week exclusion two blocks up: a draw that cannot be filled is a crash, not a compromise. It
  // cannot fire at the shipped number (the 250's band holds ~400 candidates against a draw of 32 and
  // the head takes 18 of them), and it is here so a caller handing this function a small,
  // cohort-only ranking – a bench, an old test – degrades to the pre-rule field instead of to an
  // undefined player in a bracket.
  //
  // ⚠ RNG: the candidate COUNT moves, which is the documented mutable class this function has moved
  // in at every band and age re-pick (see the box above). It moves as a function of (tier, the
  // kid-free ranking's ordinal positions, ages, the week's exclusions) and of NOTHING the player
  // does, so input-independence – the fairness property – is untouched, and not one draw of this is
  // on the MAIN weekly stream.
  const head = TIERS[event.tier].acceptsFromRank
  const gated = head ? banded.filter((p) => (posOf.get(p.id) ?? total - 1) + 1 > head) : banded
  const band = gated.length >= drawSize ? gated : banded

  // Position-biased stochastic entry: lower key = more likely to enter. Jitter is a
  // fraction of the draw so strong players usually enter but the field still moves.
  const jitter = drawSize
  const keyed = band.map((p) => {
    const pos = posOf.get(p.id) ?? total - 1
    return { p, pos, key: pos + rng() * jitter }
  })
  keyed.sort((a, b) => a.key - b.key)

  // THE AVAILABILITY GATE, and it is the KID's gate applied to everybody (28.07, the owner).
  //
  // She has never been allowed to enter a tier below its condition floor; the cohort had no such
  // rule, so a rival wrecked to 0 turned up in a draw exactly as readily as a fresh one. The
  // measurement that produced this, by a player's home band over 6 careers x 120 weeks:
  //
  //   band     runs/wk  strain/wk  net/wk   median condition  weeks at or below 5
  //   local     0.00      0.00      +1.00        100                 0%
  //   regional  0.00      0.00      +1.00        100                 0%
  //   national  0.00      0.00      +1.00        100                 0%
  //   j30       0.19      0.92      -0.11         95                 0%
  //   j60       0.26      2.79      -2.06         73                 6%
  //   j300      0.64      7.58      -7.22         10                42%
  //
  // The elite played 0.64 events a week and took 7.58 strain against a recovery capped at 1 per
  // QUIET week: minus seven, every week, forever. One run cost about twelve idle weeks to repay,
  // so the top of the table lived at condition 10 and spent two weeks in five pinned at the floor.
  // Meanwhile the three lower bands played NOTHING - the field was an exhausted elite and a crowd
  // of extras. The fatigue model was working perfectly and changing nothing, because nothing ever
  // read it.
  //
  // Now a tired rival sits the week out, recovers, and comes back - and the draw she vacated goes
  // to the next echelon down, which is what makes the rest of the cohort play at all.
  //
  // THE DRAW COUNT IS UNTOUCHED, which is the constraint that matters: the gate is applied AFTER
  // every candidate's key has been drawn, never before, so `selectEntrants` still takes exactly one
  // number per band candidate. The event's sub-stream stays aligned across replays, and nothing on
  // the MAIN weekly stream moves.
  const floor = ECONOMY.availability.minConditionToEnter[event.tier]
  const fit = (id: string) => (conditions?.get(id) ?? ECONOMY.condition.max) >= floor
  let chosen = keyed.filter((c) => fit(c.p.id)).slice(0, drawSize)

  // Short of a full draw: reach OUTSIDE the band for the nearest-positioned players who are fit.
  // This is the same defensive backfill the thin-band case always had, and it is also the path that
  // lets a wrecked elite hand its slots to the tier below.
  if (chosen.length < drawSize) {
    const have = new Set(chosen.map((c) => c.p.id))
    const fill = eligible
      .filter((p) => !have.has(p.id) && fit(p.id))
      .map((p) => ({ p, pos: posOf.get(p.id) ?? total - 1, key: 0 }))
      .sort((a, b) => a.pos - b.pos)
      .slice(0, drawSize - chosen.length)
    chosen = chosen.concat(fill)
  }

  // Last resort: a draw must be filled, so if everybody eligible is under the floor the tired ones
  // play after all - in key order, so the same players are not always the ones dragged in.
  //
  // ⚠ IT REACHES OUTSIDE THE BAND NOW, AND IT HAS TO (task #17). It used to top up from `keyed`,
  // i.e. from the entrant window alone, which was safe only because every window was deliberately
  // wider than its own draw - so this branch could never actually run short and the shortfall was
  // unreachable. The age gate above breaks that guarantee for the W rungs (W100's window is the top
  // quarter of the table, intersected with "seventeen or older"), and a draw that comes up short
  // does not degrade gracefully: `buildDraw` hands `standardSeedOrder` a non-power-of-two field and
  // the bracket reads `undefined` as a player. Falling back to everyone eligible cannot change any
  // pre-existing tier - reaching this line at all needed a cohort with fewer than `drawSize` fit
  // players AND a band too small to cover the rest, which on the six original rungs would have
  // crashed the same way years ago.
  if (chosen.length < drawSize) {
    const have = new Set(chosen.map((c) => c.p.id))
    const rest = keyed.filter((c) => !have.has(c.p.id))
    for (const p of eligible) {
      if (!have.has(p.id) && !rest.some((c) => c.p.id === p.id)) {
        rest.push({ p, pos: posOf.get(p.id) ?? total - 1, key: Number.MAX_SAFE_INTEGER })
      }
    }
    rest.sort((a, b) => a.key - b.key || a.pos - b.pos)
    chosen = chosen.concat(rest.slice(0, drawSize - chosen.length))
  }

  // Seed order = ascending standings position (best first).
  chosen.sort((a, b) => a.pos - b.pos)
  return chosen.map((c) => c.p)
}

// --- ONE BODY, ONE WEEK, ON THE PROFESSIONAL SIDE TOO -------------------------------------------
//
// WEEK EXCLUSIVITY FOR THE W TRACK (W2-FIELD2, act2-pro-tour.md §8.2: «when two W rungs share a
// week, the HIGHER tier's field is drawn first and its members are excluded from the lower window»).
//
// WHY IT IS A SEPARATE MECHANISM FROM `resolveDoubleBookings` BELOW, and not the same rule twice.
// That one is POST-DRAW arithmetic over the CANONICAL brackets: it may not touch a candidate pool,
// because the canonical `seed:aitour:` draw count is what every persisted AI result in the game was
// recorded against. This one runs on the MERGED universe - LIVE cohort ∪ derived field pros - which
// exists only on the `seed:kidtour:` side (her shadow run and the Season card's preview of it), and
// there the pool is the only place the rule CAN live: a field pro has no ledger row for
// `resolveDoubleBookings` to rearrange, and the two rungs' fields are built by two independent
// calls that never meet. So the higher rung simply draws first and the lower one is handed the
// list.
//
// DETERMINISTIC, AND THE ORDER IS `TIER_LADDER`, never a map's iteration order: the week's W events
// are sorted strongest-rung-first with an event-id tie-break, so the resolution is TOTAL even if
// `buildSeason` ever emits two events of one tier on one week. Each higher rung is drawn off its
// OWN `seed:kidtour:<id>` sub-stream - the very numbers it would read if she had entered THAT event
// instead - so the exclusion set is the same whichever event of the week is being asked about, and
// a preview and the bracket it previews agree by construction rather than by luck.
//
// ⚠ RNG: this creates its own generators and hands them nothing. Not one draw on the MAIN weekly
// stream (the frozen capture 41550 / e6b0c709 cannot see this function), not one on any
// `seed:aitour:` bracket, and not one on the CALLER's own stream - `selectEntrants` below is given
// a fresh `rngFromSeed` per higher event, read and thrown away. The caller's event then draws off
// its own stream exactly as it always did, from the first number.
//
// ⚠ AND THE CANDIDATE COUNT: this DOES change how many numbers the lower rung's own sub-stream
// spends, which is the documented mutable class (`seed:kidtour:<id>` composition has moved with
// every band and age re-pick this engine has had). What it may never depend on is PLAYER INPUT, and
// it does not: the exclusion is a function of (seed, week's calendar, the kid-free merged standings,
// the rivals' conditions) - the same four inputs `computeShadowTournament` already builds its own
// draw from, all of them independent of what she has entered or won.
//
// ⚠ SCOPE: THE W TRACK ONLY. A non-W event returns the empty set on the first line, so the six
// junior/domestic rungs are byte-identical - their universes are LIVE-only and the mixed-percentile
// question there is phase 2 by name (docs/specs/living-field.md §8.3).

/** Everyone a HIGHER W rung of the same week has already drawn. Empty for a non-W event, for a week
 *  with a single W rung on it, and for any caller that does not pass a season. */
export function weekFieldExclusion(
  event: SeasonEvent,
  season: readonly SeasonEvent[],
  universe: AiPlayer[],
  ranking: readonly RankingRow[],
  seed: string,
  conditions?: ReadonlyMap<string, number>,
): Set<string> {
  const booked = new Set<string>()
  if (TIERS[event.tier].track !== 'wta') return booked
  const rung = TIER_LADDER.indexOf(event.tier)
  const above = season
    .filter(
      (e) =>
        e.week === event.week &&
        e.id !== event.id &&
        TIERS[e.tier].track === 'wta' &&
        TIER_LADDER.indexOf(e.tier) > rung,
    )
    .sort(
      (a, b) =>
        TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
  for (const e of above) {
    const rng = rngFromSeed(`${seed}:kidtour:${e.id}`)
    for (const p of selectEntrants(e, universe, ranking as RankingRow[], rng, conditions, booked)) {
      booked.add(p.id)
    }
  }
  return booked
}

// --- ONE BODY, ONE WEEK ------------------------------------------------------------------------
//
// «они физически не могут сразу везде играть, ведь так?» – the owner, 31.07. No, they cannot, and
// until now nothing said so. `selectEntrants` is called ONCE PER EVENT, each call gets the same
// condition map (derived once, before any of the week's brackets run) and there is no cross-event
// exclusion of any kind, so the same rival was drawn into two of the same week's tournaments and
// played both. Measured on the live engine (tools/double-booked.ts, 6 careers x 156 weeks), read
// off the results ledger – i.e. what the cohort ACTUALLY played, not what a replica would draw:
//
//                                 nine rungs      six rungs (junior-only)
//     events a season                    139                          92
//     player-weeks in a draw          45,675                      27,248
//     DOUBLE-BOOKED player-weeks      14,381 (31.5%)                6,198 (22.7%)
//     phantom appearances             17,301                       7,600
//
// ⚠ AND IT IS NOT AN ADULT-TOUR REGRESSION – IT IS AN OLD DEFECT THE ADULT TOUR MADE VISIBLE. Read
// the second column: the junior-only calendar, the one every historical bench in this repo was taken
// on, loses 22.7% of its player-weeks to the same collision, and there is nothing adult about the
// cause. The junior entrant windows overlap almost completely – j300 [0, 0.25], j60 [0.05, 0.4],
// j30 [0.12, 0.6], national [0.2, 0.7] – so two junior events on the same week have always drawn
// twice out of the same slice of the table. What the adult rungs added was WITNESSES, not the bug.
//
// It is not a cosmetic impossibility. `walkWindow` in season/rival.ts charges EVERY run of a week
// and pays ONE week's recovery for all of them:
//
//     const recovery = played ? matchWeekRecoveryBase : recoveryBase + ...
//     if (played) for (const run of played) condition -= run.strain
//
// so a rival drawn twice takes two runs' strain against a single week's rest, and the extra
// appearances land entirely on the players the standings favour.
//
// ⚠ IT IS NOT, HOWEVER, THE CAUSE OF THE COHORT-FATIGUE COLLAPSE THE ADULT-TOUR WAVE REPORTED, and
// this was the first thing measured after the fix rather than assumed. THE COLLISIONS NEVER ADDED
// TENNIS TO THE WORLD, THEY CONCENTRATED IT: the number of draw slots in a season is a property of
// the calendar alone (3,616 on nine rungs, 2,112 on six) and this rule does not change it by one.
// What it changes is WHO plays them. Field measured 8 seeds x 40 ticked weeks, 20-week window:
//
//                              nine rungs            six rungs (junior-only)
//     min median condition     34-36 -> 35-37        69-79 -> 63-70
//     rivals sitting at 100     9-16 -> 0            75-80 -> 61-64
//     never played at all     4.5-7.5% -> 0.0%    30.7-33.7% -> 26.6-28.6%
//     busiest rival, events/s   42.9 -> 35.1          33.8 -> 29.9
//     mean events per rival     17.8 -> 17.8          10.5 -> 10.5   <- unchanged, by construction
//
// The median moves UP on nine rungs and DOWN on six, and both are the same effect seen from either
// side: spreading a fixed load over more bodies pulls the extremes in. Where the field was wrecked,
// strain that used to be clamped away on a player already at 0 now lands on somebody who can feel
// it; where the field was healthy, players who had been idle start paying. So the C3 injury anchor
// only half returns (1.836 -> 2.032 against a 2.5 corridor floor) and the knee claim stays lost. The
// cohort on nine rungs is tired because it plays eighteen tournaments a season on `recoveryBase` 1 a
// week, and the remedy for THAT is a rung that reduces how many draws one rival is ELIGIBLE for –
// §4.1's `maxAgeYears` on the J tiers. Both guards keep their inverted pins and both carry the
// measurement; see tests/rivals.test.ts C2 and tests/fatigue-bench.test.ts C3.
//
// ⚠ WHY THIS IS POST-DRAW ARITHMETIC AND NOT A FILTER ON THE CANDIDATE POOL. The obvious fix –
// drop the already-booked players before the draw – is the one fix this engine may not have. Read
// the note at the top of this file again: the candidate COUNT per tier is a constant of the window
// *because percentiles come from ORDINAL POSITION*, and `selectEntrants` spends exactly one draw
// per candidate. A pool that shrinks as the week fills up would make the draw count depend on which
// events came earlier – i.e. on results, on content and ultimately on player input – and every
// stream in the game is pinned on that count not moving. So the draws happen EXACTLY as they always
// did: same calls, same order, same numbers off the same `seed:aitour:<id>` sub-streams. This
// function runs AFTERWARDS, on the arrays they returned, and it draws NOTHING – on any stream. The
// frozen MAIN capture (41550 draws / e6b0c709) cannot move by construction: it never enters the
// tick's weekly `rng` at all, and tests/knock.test.ts re-derives it from the live engine anyway.
//
// THE TWO RULES, and both are ORDINAL facts – a tier's rung and a player's standings position –
// never a new random number:
//
//   1. THE HIGHER TIER KEEPS HER. Given a W35 and a J30 on the same Tuesday, she goes to the W35:
//      it is the more important week, it costs more to reach and it is the one a player plans a
//      season around. `TIER_LADDER` is the project's single source of truth for "is tier A above
//      tier B" (season/calendar.ts) and it is a STRENGTH order, so this is a lookup, not a
//      judgement. `buildSeason` already emits a week strongest-tier-first, so the natural order is
//      usually the right one – the sort below states the rule anyway, because a rule that depends
//      on another module's sort staying the way it is today is not a rule.
//
//   2. THE LOSING EVENT BACKFILLS BY STANDINGS POSITION. It takes the next player who is not
//      already booked this week, best standing first – which is exactly the tie-break
//      `selectEntrants`' own two backfills use, so a slot vacated by this rule is filled by the
//      same kind of player it would have been filled by there. It reaches OUTSIDE the entrant band
//      for the same reason those do, and it honours the age gate for the same reason they do: an
//      age rule a backfill can walk around is no rule at all, and handing a W100 slot to a
//      thirteen-year-old to avoid a collision would trade one impossibility for a worse one.
//
// THE ORDER OF PREFERENCE WHEN A SLOT HAS TO BE FILLED, weakest excuse last:
//   a. unbooked, old enough, and above the tier's condition floor  – a player who could have been
//      drawn here in the first place;
//   b. unbooked and old enough, floor ignored – the tired ones play, exactly as `selectEntrants`'
//      own last resort lets them, because a draw that cannot be filled is a crash and not a
//      compromise;
//   c. the event's OWN drawn entrants, handed back. Reachable only when the WEEK IS
//      OVER-SUBSCRIBED – when the calendar has scheduled more slots than the world has players –
//      and it is not hypothetical: season offset 48, the last playable week before the off-season,
//      collects ALL NINE rungs in every season of every seed, because `claimWeek` pushes each
//      tier's overshooting final event down against the off-season wall. 248 slots, 199 rivals.
//      Nothing a selection rule can do about that: 49 of those slots have no fifth-of-a-person to
//      put in them. ⚠ W3-FIELD3 RELIEVES THIS WITHOUT AIMING AT IT: on such a week the W events'
//      pool is now 563 people rather than 199, so the arithmetic that made (c) reachable is the
//      junior half of the week's alone. The branch stays, because the junior half is still 199.
//      So the surplus events keep the players they drew – the collision is then a fact
//      about the CALENDAR, and it is left visible instead of being smeared over the whole week.
//      Flagged for the owner; the fix is in the scheduler, not here, and it is deliberately not
//      taken on this branch because moving a claimed week changes `pickSurface`'s block lookup and
//      therefore the SURFACE of real events.
//      FOR THE OWNER, the one alternative considered and not taken: (c) could instead fill from the
//      LEAST-BOOKED players, which would cap every rival at two events on such a week rather than
//      letting a popular one collect three (measured 654 players carrying 882 phantom appearances,
//      i.e. 1.35 each). It spreads the same total strain over more bodies – strictly a tuning call
//      about whether concentrated or distributed overload is the lesser evil, and not one to smuggle
//      in under a correctness fix.
//   d. anybody at all, by standing. Unreachable today (it needs `entrants` itself to have come in
//      short, which `selectEntrants`' own total-escape already prevents) and present for the same
//      reason `claimWeek`'s gap retry is: a future cadence change must not be able to turn a tuning
//      decision into a crash. `buildDraw` reads a short field as `undefined` players.
//
// SCOPE: THE CANONICAL BRACKETS, WHICH IS THE WHOLE OF THE PROBLEM. `runAiTournament` is the ONLY
// live write site for a rival's ledger row (world.ts), and a ledger row is what `rivalConditions`
// reconstructs a rival's week from – so the load this fixes is the entire load the cohort carries.
// The kid's shadow run (`computeShadowTournament`) deliberately stays out of it: it draws its field
// on the separate `seed:kidtour:<id>` stream and already IS a different universe from the canonical
// bracket for the same event, it writes no rival rows, and pulling it in would move every kid
// result in every pinned career to fix nothing that is measured.
//
// ⚠ TWO UNIVERSES ON ONE WEEK SINCE W3-FIELD3 (04.08). The canonical W brackets now draw from LIVE
// cohort ∪ derived field pros while the six junior/domestic rungs still draw from the cohort alone,
// so a single week can hold events whose candidate POOLS and whose STANDINGS TABLES are different
// objects. The rule spans them anyway, and it has to: the cohort's 16-18-year-olds are eligible for
// both tours, so a J300 and a W15 on one Tuesday can still draw the same girl. `booked` is therefore
// ONE set for the whole week; what varies per event is (a) the pool a short field backfills from –
// a pro may never appear in a J30 – and (b) the table positions are read off, because a pro has no
// row in the mixed junior fold and would otherwise sort to the very back of a W draw, silently
// destroying the seed order this function is contracted to return. Both come from the optional
// `pro` argument; omit it and every line below is byte-identical to the pre-W3 function, which is
// what every non-world caller (benches, the older tests) gets.
//
// A ONE-EVENT WEEK RETURNS UNTOUCHED, by an early exit rather than by arithmetic that happens to be
// the identity – 66 of the 852 event weeks measured above, and on those the engine is byte-identical.

/** One event and the field its own sub-stream drew for it, before any cross-event rule is applied. */
export interface DrawnEvent {
  event: SeasonEvent
  entrants: readonly AiPlayer[]
}

/** Make the week physically possible: no rival in two of its draws. Returns `eventId -> entrants`,
 *  each list the tier's full `drawSize` and SORTED BY STANDING (best first) – the same contract
 *  `selectEntrants` gives `buildDraw`, because it is the same consumer.
 *
 *  PURE, and ZERO RNG DRAWS ON ANY STREAM. See the long note above for why that is the requirement
 *  and not merely a nicety. */
export function resolveDoubleBookings(
  drawn: readonly DrawnEvent[],
  cohort: readonly AiPlayer[],
  ranking: readonly RankingRow[],
  /** the week's rival conditions, exactly as `selectEntrants` takes them; absent ⇒ nobody is gated */
  conditions?: ReadonlyMap<string, number>,
  /** THE PROFESSIONAL SIDE OF THE WEEK (W3-FIELD3): the universe and the standings table the W-track
   *  events were drawn against – LIVE cohort ∪ field pros, positioned by the merged W table. Absent
   *  ⇒ every event is resolved against `cohort`/`ranking`, i.e. the pre-W3 function exactly. */
  pro?: { universe: readonly AiPlayer[]; ranking: readonly RankingRow[] },
): Map<string, AiPlayer[]> {
  const out = new Map<string, AiPlayer[]>()
  // One event cannot collide with itself. Explicit, so "the engine does not move on a single-event
  // week" is a property of the code rather than a consequence of the sort being stable.
  if (drawn.length < 2) {
    for (const d of drawn) out.set(d.event.id, [...d.entrants])
    return out
  }

  // One position map per table, built once for the whole week rather than once per event.
  const indexOf = (rows: readonly RankingRow[]) => {
    const m = new Map<string, number>()
    rows.forEach((r, i) => m.set(r.playerId, i)) // 0 = best standing
    return m
  }
  const livePos = indexOf(ranking)
  const liveTotal = ranking.length || cohort.length
  const proPos = pro ? indexOf(pro.ranking) : null
  const proTotal = pro ? pro.ranking.length || pro.universe.length : 0

  // Rule 1. Strongest rung first. The id tie-break is unreachable at the shipped calendar
  // (`buildSeason` tracks occupancy PER TIER, so a tier runs at most one event in a week) and is
  // here so the order is TOTAL – an ordering that is only deterministic while an invariant in
  // another module holds is a latent non-determinism, and this one would show up as a save that
  // replays differently.
  const order = [...drawn].sort(
    (a, b) =>
      TIER_LADDER.indexOf(b.event.tier) - TIER_LADDER.indexOf(a.event.tier) ||
      (a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0),
  )

  const booked = new Set<string>()
  for (const { event, entrants } of order) {
    const drawSize = TIERS[event.tier].drawSize
    const floor = ECONOMY.availability.minConditionToEnter[event.tier]
    const fit = (id: string) => (conditions?.get(id) ?? ECONOMY.condition.max) >= floor
    // Which world this event lives in – see the two-universes note above.
    const onTour = pro !== undefined && TIERS[event.tier].track === 'wta'
    const pool = onTour ? pro.universe : cohort
    const posOf = onTour ? proPos! : livePos
    const total = onTour ? proTotal : liveTotal
    const posFor = (id: string) => posOf.get(id) ?? total - 1

    // Whoever the event drew and nobody has claimed: the overwhelming majority of every field.
    const field = entrants.filter((p) => !booked.has(p.id))
    const have = new Set(field.map((p) => p.id))
    const fill = (pool: readonly AiPlayer[]) => {
      for (const p of pool) {
        if (field.length >= drawSize) return
        if (have.has(p.id)) continue
        field.push(p)
        have.add(p.id)
      }
    }

    if (field.length < drawSize) {
      // Rule 2: best standing first, age gate honoured, fit players before tired ones.
      const free = pool
        .filter((p) => !booked.has(p.id) && isTierAgeOpen(event.tier, p.ageYears))
        .sort((a, b) => posFor(a.id) - posFor(b.id))
      fill(free.filter((p) => fit(p.id))) // (a)
      fill(free) // (b)
    }
    if (field.length < drawSize) {
      fill(entrants) // (c) – the week is over-subscribed; see (c) in the note above
      fill([...pool].sort((a, b) => posFor(a.id) - posFor(b.id))) // (d) – never a short draw
    }

    // Back into standings order, which is the contract `buildDraw` seeds off. Stable, and keyed on
    // the same positions `selectEntrants` used, so an untouched field comes out exactly as it went in.
    field.sort((a, b) => posFor(a.id) - posFor(b.id))
    for (const p of field) booked.add(p.id)
    out.set(event.id, field)
  }
  return out
}

// Resolve one match. Kid matches (either side is the kid) run the full engine under
// a deterministic event-scoped seed and record seed + scoreline. AI-AI matches draw
// once against the closed-form win probability.
function playMatch(
  a: MatchPlayer,
  b: MatchPlayer,
  round: number,
  event: SeasonEvent,
  kid: MatchPlayer | null,
  worldSeed: string,
  rng: Rng,
): MatchRecord {
  const kidPlays = kid !== null && (a.id === kid.id || b.id === kid.id)
  if (kidPlays) {
    const seed = `${worldSeed}:${event.id}:r${round}`
    const res = simulateMatch(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed })
    const winnerId = res.winner === 0 ? a.id : b.id
    const score = res.sets.map((s) => `${s.a}-${s.b}`).join(' ')
    // SHE (or her opponent) STOPPED. `simulateMatch` has already done the work: the loser is the
    // side that retired, the winner is the other one at full value, and `sets` is the partial
    // scoreline. Nothing here decides anything – it carries one id onto the record so the bracket
    // above and `finalizeTournament` below do not have to re-simulate the match to find out.
    //
    // ⚠ THE BRACKET NEEDS NO BRANCH FOR IT, which is the whole reason this shape was chosen.
    // `runTournament` reads `winnerId` and advances that player; a retirement is a loss like any
    // other loss, so her opponent goes through and the round she reached is `rounds - round` by the
    // arithmetic that was already there. That IS the owner's ruling («защитываем поражение в текущей
    // ступени») – it needed no code, only the guarantee that the run still reaches finalize.
    if (res.retired) {
      const retiredId = res.retired.side === 0 ? a.id : b.id
      return { round, aId: a.id, bId: b.id, winnerId, seed, score, retiredId }
    }
    return { round, aId: a.id, bId: b.id, winnerId, seed, score }
  }
  const p = fastMatchProbability(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
  const aWins = rng() < p
  return { round, aId: a.id, bId: b.id, winnerId: aWins ? a.id : b.id }
}

// runTournament – single-elimination from `entrants` (seed order, best first). When the kid enters
// she takes a slot, bumping the lowest-ranked entrant, and is then DRAWN INTO THE BRACKET AT
// RANDOM. Losers get finish = rounds - round (0 = champion), indexing TierDef.points.
//
// WHY THE DRAW IS PART SEEDED AND PART RANDOM (the owner, 28.07: «в настоящем теннисе несеяная
// новичок попадает в сетку случайно – мне кажется нам тоже так надо делать», and its other half,
// 29.07, after the rank diagnosis).
//
// FIRST VERSION. She was appended last, which made her the LOWEST seed – and in a standard seeded
// bracket the lowest seed meets seed 1 in round one, by construction. At every draw size and every
// tier her first opponent was the strongest player in the field, every tournament of every career.
// That was fixed by trading her into a uniformly random slot.
//
// WHAT THAT LEFT, AND WHY IT WAS STILL WRONG. `standardSeedOrder` seeded the ENTIRE field, so every
// one of the other 31 players was protected – a mid-table AI met the player adjacent to her in the
// standings – while she alone carried the variance of a random draw. Measured (docs/specs/
// rank-plateau.md): her entries produced a scoring result 27% of the time against her direct rivals'
// 47%, and she sat five points of raw power above the players she was tied with on points. A rule
// that applies to exactly one player in the world is not a difficulty setting, it is a bug.
//
// A REAL DRAW SEEDS THE TOP AND RANDOMISES THE REST. The ITF seeds 8 of a 32-draw (4 of 16, 2 of 8);
// everybody else goes into the gaps by lot. So that is what this does, and the kid is nobody special
// in it: she takes her place in the field BY HER STANDING, is seeded when that standing earns it,
// and is drawn at random when it does not - on the same terms as every other unseeded player.
//
// TWO INVARIANTS, both load-bearing:
//   * every draw comes off the `rng` already passed in, which is the EVENT-scoped
//     `seed:kidtour:<id>` / `seed:aitour:<id>` sub-stream. Not one draw on the MAIN weekly stream –
//     the frozen capture (41550 / e6b0c709) cannot move, and its test proves it.
//   * the shuffle spends exactly one draw per unseeded player, a count that depends only on the
//     tier's draw size. It cannot depend on player input, on funds, or on who is in the field.
//
// `entrants` is a MatchPlayer[] (it was an AiPlayer[], which is a subtype, so every existing call
// site still type-checks): since the rival-life slice the caller hands in cohort rows ALREADY put
// through `rivalMatchPlayer` – surface/style modifier and condition factor applied – so the
// bracket sees exactly the players who take the court, and the cohort rows themselves stay pristine.
/** How many of a draw are seeded. The ITF shape: 8 of 32, 4 of 16, 2 of 8. */
export function seedsFor(drawSize: number): number {
  return Math.max(2, Math.floor(drawSize / 4))
}

/** Where the kid slots into a standings-ordered entrant list – simply how many of them outrank her.
 *  Exported because THREE callers have to agree on it to the place: the bracket that plays, the
 *  Season screen's preview of it, and the test that proves those two agree. */
export function kidSeedIndexIn(
  entrants: readonly MatchPlayer[],
  ranking: readonly RankingRow[],
  kidId: string,
): number {
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const last = ranking.length
  const mine = posOf.get(kidId) ?? last
  return entrants.filter((p) => (posOf.get(p.id) ?? last) < mine).length
}

/** THE DRAW, as one function, because two callers need to agree on it to the slot: the bracket that
 *  actually plays, and the Season screen's preview of who she would meet.
 *
 *  `entrants` arrive SORTED BY STANDING (selectEntrants guarantees it). The kid, when she is in the
 *  field, is spliced in at `kidSeedIndex` – her place by standing, not the bottom – and the weakest
 *  entrant is bumped to keep the draw at `drawSize`. The top `seedsFor(drawSize)` then take the
 *  standard seed positions and EVERYBODY ELSE is shuffled into the remaining slots.
 *
 *  Exactly one draw per unseeded player, in a fixed order, off the event's own stream. */
export function buildDraw(
  event: SeasonEvent,
  entrants: readonly MatchPlayer[],
  kid: MatchPlayer | null,
  kidSeedIndex: number | null,
  rng: Rng,
): MatchPlayer[] {
  const drawSize = TIERS[event.tier].drawSize
  let field: MatchPlayer[]
  if (kid) {
    field = entrants.slice(0, drawSize - 1)
    const at = Math.max(0, Math.min(kidSeedIndex ?? field.length, field.length))
    field.splice(at, 0, kid)
  } else {
    field = entrants.slice(0, drawSize)
  }

  const seeded = seedsFor(field.length)
  // Fisher-Yates over the unseeded tail. `pool` is a copy: `field` stays in standings order so the
  // seed lookup below is unambiguous.
  const pool = field.slice(seeded)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  let next = 0
  return standardSeedOrder(field.length).map((s) => (s <= seeded ? field[s - 1] : pool[next++]))
}

/** Who `kid` meets in round one of `alive`, once drawn. Round one pairs adjacent slots. */
export function firstRoundOpponent(alive: readonly MatchPlayer[], kid: MatchPlayer): MatchPlayer | null {
  const i = alive.findIndex((p) => p.id === kid.id)
  if (i < 0) return null
  return alive[i % 2 === 0 ? i + 1 : i - 1] ?? null
}

export function runTournament(
  event: SeasonEvent,
  entrants: MatchPlayer[],
  kid: MatchPlayer | null,
  worldSeed: string,
  rng: Rng,
  /** her place among the entrants by standing (see `kidSeedIndexIn`). Omitted ⇒ she goes in last,
   *  which is what an unranked newcomer deserves and what the tests that do not care want. */
  kidSeedIndex?: number,
): TournamentResult {
  let alive: MatchPlayer[] = buildDraw(event, entrants, kid, kidSeedIndex ?? null, rng)
  const rounds0 = alive.length

  const matches: MatchRecord[] = []
  const finishes: Record<string, number> = {}
  const rounds = Math.log2(rounds0)

  for (let round = 0; round < rounds; round++) {
    const winners: MatchPlayer[] = []
    for (let i = 0; i < alive.length; i += 2) {
      const a = alive[i]
      const b = alive[i + 1]
      const rec = playMatch(a, b, round, event, kid, worldSeed, rng)
      matches.push(rec)
      const winner = rec.winnerId === a.id ? a : b
      const loser = rec.winnerId === a.id ? b : a
      finishes[loser.id] = rounds - round
      winners.push(winner)
    }
    alive = winners
  }
  finishes[alive[0].id] = 0 // champion

  return { eventId: event.id, matches, finishes }
}
