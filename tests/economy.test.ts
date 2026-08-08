import { describe, it, expect, vi } from 'vitest'

// The 16-seed × 52-week calibration batches below sit at ~3s against vitest's 5s default – close
// enough that a busy run tips them over and the gate goes red on timing, not on a claim. Same
// generous file-level timeout the other batch files already use (tests/fatigue-bench.test.ts):
// these tests are deterministic, only slow.
vi.setConfig({ testTimeout: 240_000 })
import {
  ageAtWeek,
  createWorld,
  tickWeek,
  recomputeKidRank,
  financeWindow,
  localSponsorCents,
  acceptOffer,
  declineOffer,
  STARTING_FUNDS_CENTS,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, GEAR_CATEGORIES, gearHitsUpTo } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { COACH_TIERS, coachWeeklyBandCents } from '../src/engine/coach'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground } from '../src/shared/protocol'

// Fixed calibration batch. 16 seeds so the mean is stable against the working-class sponsor's
// high variance (a single working season can swing several $k on sponsor luck – see below), while
// staying cheap.
const SEEDS = Array.from({ length: 16 }, (_, i) => `cal-${i + 1}`)

/** The first week of the season a kit deal signed in the first off-season actually COVERS.
 *  `coveredSeasonStart(49)` – the letter is for the season ahead, not the fortnight it arrives in.
 *  Named because three assertions now measure the ledger over exactly that block, since 08.08 made
 *  `coveredCents` a per-season counter rather than a per-term one. */
const COVERED_SEASON_START = 52

/** The season's physio/medical spend in cents (a positive number). Season-Life slice C layered
 *  injuries + physio ON TOP of the base economy; the owner's net-burn bands below were frozen
 *  BEFORE that layer, so the calibration excludes the 'physio' bucket (a stochastic medical tail
 *  – a single severe onset swings $3-6k) and keeps measuring what it always measured: the fixed
 *  base cashflow. The medical layer's own calibration lives in tests/injuries.test.ts + the bench. */
function physioSpendCents(world: WorldState): number {
  return -(financeWindow(world.financeWeeks, 0).byCategory.physio ?? 0)
}

/** The season's savings-interest income in cents (round-9 R9-1). Like the physio tail above,
 *  the interest layer landed AFTER the owner froze the burn bands – and it scales with the
 *  STARTING reserve (wealthy's 120k earns ~$3.7k/yr, dwarfing middle's), so leaving it in
 *  would warp the band comparison. The calibration adds it back and keeps measuring the fixed
 *  base cashflow it always measured. */
function interestEarnedCents(world: WorldState): number {
  return financeWindow(world.financeWeeks, 0).byCategory.interest ?? 0
}

/** The season's local-sponsor cameo income in cents (working-only; 0 for middle/wealthy). See the
 *  working-burn test below for why the calibration measures the burn BEFORE this gift. */
function sponsorIncomeCents(world: WorldState): number {
  return financeWindow(world.financeWeeks, 0).byCategory.sponsor ?? 0
}

/** Net funds lost over 52 weeks with NO tournaments entered (fixed costs only). A fresh career
 *  earns no ranking points on EITHER ladder, so the kid sits at the bottom of both tables all year →
 *  national rank > 30 → the local sponsor's annual review pays her nothing. These are the owner's
 *  UNSPONSORED-kid bands. (Read "rank > 30" as the NATIONAL rank since 30.07: the sponsorship is a
 *  flat annual grant gated on the domestic table, not a share of a gear bill gated on the ITF one.)
 *
 *  ⚠ TAKES A COACH RUNG NOW – see CALIBRATION_TIER below for why it has to. */
function seasonBurnDollars(
  seed: string,
  background: FamilyBackground,
  opts: { excludeSponsor?: boolean } = {},
): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: CALIBRATION_TIER[background] })
  const rng = rngFromSeed(world.seed)
  const start = STARTING_FUNDS_CENTS[background]
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  const sponsor = opts.excludeSponsor ? sponsorIncomeCents(world) : 0
  return (start - world.fundsCents - physioSpendCents(world) + interestEarnedCents(world) + sponsor) / 100
}

function batchBurns(background: FamilyBackground, opts: { excludeSponsor?: boolean } = {}): number[] {
  return SEEDS.map((s) => seasonBurnDollars(s, background, opts))
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

// ⚠ RE-AIMED BY THE COACH LADDER – THE MECHANISM THAT MAKES THE THREE CELLS DIFFER MOVED, so this
// calibration had to move with it or stop measuring anything about class.
//
// Until now all three cells ran on the SAME coach setting (DEFAULT_PROFILE's `hired`) and the
// WEALTH CORRIDOR did the tiering: one $250-700/wk band × 0.75 / 1.00 / 1.25. The corridor has left
// coaching (docs/specs/coach-tiers.md §2), so holding the coach constant would now charge all three
// families the identical bill and the cells would differ only by income and gear. The rung is what
// tiers them now, so each family is calibrated on the rung it actually buys – the same three rungs
// tools/econ-bench.ts puts them on.
const CALIBRATION_TIER: Record<FamilyBackground, CoachTier> = {
  working: 'budget',
  middle: 'middle',
  wealthy: 'elite',
}

// ⚠ RE-BASED AGAIN (Round 2), and this time the WEALTHY cell flips back to a burn. Two knobs moved
// under it: hours went 4 -> 5 at the balanced plan (the owner's own 4/5/6), which raises every
// weekly bill by a quarter, and the wealth corridor went back ON coaching, which prices each family
// in its own market. Together they put an Elite coach in a premium academy at $750/wk against a
// wealthy family's $750/wk of parent income - so "premium everything must hurt" is back in the idle
// year for the family it was written about, rather than only in the playing season.
//
// The Round-1 note still stands for the other two, and it is worth keeping because it explains what
// the ORIGINAL bands were really measuring: they charged every family a coach the spec prices as
// ELITE (the old `hired` band's ~$475/wk midpoint), so a working family on $245/wk of parent income
// was billed $356/wk for coaching - 145% of its own income - in a year with no tournaments in it.
// That was the wall, measured, in a test that had been reporting it as a healthy $6.8k burn.
//
// Measured (same 16 seeds, sponsor-excluded for working), with the coaching line that produced it:
//   working · budget  $112/wk  burn mean -$5,667   spread -$6,670 .. -$4,798
//   middle  · middle  $250/wk  burn mean -$7,334   spread -$9,441 .. -$4,754
//   wealthy · elite   $750/wk  burn mean +$6,280   spread -$1,126 .. +$13,527
// The mean bands below are those windows with headroom; the per-seed tolerances are wider because
// the corridor roll now breathes on the coaching line every week, which it did not in Round 1.
//
// FOR THE OWNER, and please do not "fix" it by moving these numbers: an idle year is still a SAVING
// for the two families below the top, so the round-7 item-1d burn bands no longer discriminate
// between all three and are due a design decision rather than another re-pin. The bench is where
// the real question lives now - tools/econ-bench.ts walks each family up its own corridor and
// reports which rungs it survives.
const BANDS: Record<FamilyBackground, [number, number]> = {
  working: [-6_500, -4_800],
  middle: [-8_500, -6_000],
  wealthy: [4_500, 8_000],
}

/** Per-seed tolerance around each band. The corridor roll moves the coaching line every week, so a
 *  single season lands further from the batch mean than it did with a corridor-free bill. */
const SEED_SLACK: Record<FamilyBackground, number> = { working: 2_500, middle: 3_500, wealthy: 8_000 }

describe('economy calibration – 52-week net burn (no tournaments, unsponsored kid)', () => {
  it('the calibration kid really is unsponsored: rank stays well past the sponsor threshold', () => {
    const world = createWorld('cal-1', { ...DEFAULT_PROFILE, background: 'middle' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // ⚠ RE-AIMED (30.07, tune/rank-numbers): reads the NATIONAL cache now, because that is the table
    // ECONOMY.sponsorship gates on. THE PROTECTED FACT IS UNCHANGED and it is the whole subject of
    // the bands below – this kid enters nothing all year, so she earns no points on EITHER ladder and
    // no sponsor money reaches her. The old line asserted the same thing against `world.kidRank`,
    // which was the right cache while the gate read the international table and is now simply the
    // wrong one to be asking. Both are still true; this is the one that guards the bands.
    expect(world.kidRankDomestic!).toBeGreaterThan(ECONOMY.sponsorship.maxRank)
    // ...so the annual review pays her nothing, which is what makes these the UNSPONSORED bands.
    expect(localSponsorCents(world.kidRankDomestic!)).toBe(0)
  })

  it('working (budget coach) lands in the -$6.5k..-$4.8k band (batch mean, BEFORE the sponsor cameo)', () => {
    // The sponsor exclusion is UNCHANGED and its reasoning is untouched by the ladder. Working keeps
    // the need-based local sponsor, whose 6% × $500-1500 roll is worth ~$3.1k a season in
    // expectation with a ~$1.7k per-season spread – comparable to the entire measured figure. So a
    // sponsor-INCLUSIVE 16-seed batch mean is nowhere near converged and moves by more than $1k
    // whenever the main stream re-aligns. The band's own subject is the FIXED base cashflow (see the
    // physio / interest exclusions above), so the calibration measures exactly that.
    const burns = batchBurns('working', { excludeSponsor: true })
    const [lo, hi] = BANDS.working
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    // The cameo really is being excluded (the branch is exercised, not a no-op on this batch).
    expect(mean(batchBurns('working'))).toBeLessThan(mean(burns))
  })

  it('middle (middle coach) lands in the -$8.5k..-$6k band (mean, and every seed inside slack)', () => {
    const burns = batchBurns('middle')
    const [lo, hi] = BANDS.middle
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - SEED_SLACK.middle)
      expect(b).toBeLessThanOrEqual(hi + SEED_SLACK.middle)
    }
  })

  it('wealthy (elite coach) BURNS $4.5-8k in an idle year – premium everything hurts again', () => {
    // ⚠ THE SIGN FLIPPED BACK (Round 2). Round 12 had raised the wealthy income to $750/wk and this
    // cell became a break-even; Round 1 of the ladder made it a $8.3k saving, because an Elite coach
    // at four hours and no corridor was $480/wk. With the owner's 5 hours and his corridor, a
    // premium academy's Elite coach is $750/wk - exactly the family's weekly income - so the idle
    // year burns, which is what the round-7 "premium everything must hurt" always meant.
    const burns = batchBurns('wealthy')
    const [lo, hi] = BANDS.wealthy
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo - SEED_SLACK.wealthy)
      expect(b).toBeLessThanOrEqual(hi + SEED_SLACK.wealthy)
    }
  })

  it('ordering: the top of the ladder burns, and the two rungs below it save', () => {
    // ⚠ RE-AIMED TWICE. The original read "working < middle, and wealthy no longer belongs in that
    // ordering" - round 12 had already broken the working < middle < wealthy chain by raising the
    // wealthy income, and what ordered the two survivors was the corridor on their shared coach
    // band. Round 1 of the ladder made it "income minus a rung's price". Round 2 restores the
    // corridor AND raises the hours, and the chain that comes out is a third thing again:
    //   middle  · middle  425/wk income − 250/wk coach   burn -$7,334   saves the MOST
    //   working · budget  245/wk income − 112/wk coach   burn -$5,667
    //   wealthy · elite   750/wk income − 750/wk coach   burn +$6,280   the only one that BURNS
    // Middle on top is not an accident: it buys the rung with the widest gap between what the family
    // earns and what its academy charges. And wealthy at the top of the market spends its whole
    // income on the coach alone, before a single trip - which is the design, stated as a number.
    const w = mean(batchBurns('working', { excludeSponsor: true }))
    const m = mean(batchBurns('middle'))
    const rich = mean(batchBurns('wealthy'))
    expect(m).toBeLessThan(w)
    expect(w).toBeLessThan(rich)
    expect(rich).toBeGreaterThan(0) // the only cell in the table that is a burn at all
  })
})

describe('the local sponsor (round-7 amendment, rebuilt 30.07)', () => {
  // ⚠ RE-AIMED, NOT WEAKENED (30.07, tune/rank-numbers). The three protected facts are the same
  // three this block has always guarded, and all three still hold:
  //   1. a kid who is doing well ends a season materially better off than one who is not, by at
  //      least $1.5k - the "painful but survivable" counter-force is worth real money;
  //   2. the sponsor relationship is VISIBLE in the ledger, under a category the Money screen reads,
  //      rather than a cost quietly shrinking;
  //   3. it draws nothing from the main weekly stream.
  //
  // WHAT MOVED IS THE MECHANISM UNDERNEATH THEM, and both halves of it were wrong:
  //   * THE TABLE. `ECONOMY.sponsorship` gated on `world.kidRank`, the INTERNATIONAL rank, for a
  //     reward that is by concept domestic. Measured over 120 seeds x 208 weeks it fired for nobody
  //     in any preset in any season (her ITF rank sits #89-#109 against a #30 gate; her NATIONAL
  //     rank sits #8-#18). It now reads the national table.
  //   * THE SHAPE. It was a PERCENTAGE off each gear line-item, and a gear bill runs through the
  //     wealth corridor - so the same rule paid the wealthy family $2,384 a season against the
  //     working family's $348. It is now a flat per-season grant, the same figure for everybody.
  // The full argument, including why an annual grant rather than a per-purchase cap, is on
  // ECONOMY.sponsorship in src/engine/economy.ts.
  //
  // AND THE FIXTURE GOES BACK TO A DOMESTIC RESULT. It pushed a tier-less row historically (which
  // `inTrack` reads as domestic) and was moved to `tier: 'j300'` on 30.07 to chase the ITF gate. Now
  // that the gate reads the national table, a domestic row is once again the right way to force the
  // state this block's name claims - stated explicitly as `tier: 'national'` this time rather than
  // relying on the tier-less default, so no future reader has to know that rule to follow it.
  //
  // ============================================================================================
  // ⚠ RE-AIMED AGAIN, NOT WEAKENED (31.07, feat/offers-inbox-slice). The three protected facts are
  // the same three, all three still hold, and one of them is now asserted HARDER than it was.
  //
  // WHAT MOVED IS THAT IT IS PAID IN KIT AND THE PLAYER IS ASKED. `reviewLocalSponsor` used to add
  // $1,000 or $2,000 to the balance at the season boundary; it now raises an OFFER, and signing
  // makes the shop pay her racquet/string/shoe bills up to that same allowance and keep her kit
  // fresh while it does (docs/specs/offers-and-the-inbox.md §4.1, «кит вместо денег»). Neither the
  // gate nor the figure moved - only the shape of the thing.
  //
  // SO EVERY FIXTURE IN THIS BLOCK NOW SIGNS THE LETTER, and that is the change rather than an
  // accommodation of it: a deal nobody signs is worth nothing, on purpose. The arms are a SIGN and a
  // REFUSE on the same seed, which is a cleaner comparison than the old "ranked vs unranked" pair -
  // both careers see the identical draw sequence and the only difference is the answer.
  //
  //   1. doing well is still worth REAL MONEY, and still at least the same $1,500 a season - it is
  //      simply money she does not spend rather than money she is given;
  //   2. the relationship is still VISIBLE, and in more places than before: the gear rows name the
  //      shop, and the boundary line reports what the season of kit was worth;
  //   3. it still draws NOTHING from the main weekly stream. There IS a draw now (whether the shop
  //      writes at all) and it is on `seed:offer:<week>` - its own sub-stream. tests/offers.test.ts
  //      replays the frozen capture against a career that signs every letter it gets.
  // ============================================================================================

  // ============================================================================================
  // ⚠ RE-AIMED A THIRD TIME, NOT WEAKENED (01.08, feat/brand-ladder). Two of the three protected
  // facts have MOVED OBJECT, because the object itself changed: one shop became a three-rung ladder,
  // and the rung says WHICH OF HER EQUIPMENT LINES the deal covers (`SponsorTier`).
  //
  //   * `local` now covers HER STRINGS ALONE - frames and shoes stay hers. So the local deal is
  //     deliberately worth LESS than it was: measured on this block's own fixture it covers $311 /
  //     $638 / $1,548 a season (working / middle / wealthy) against the three-line $900 / $2,000 /
  //     $2,000 it covered before. That is the design and not a regression - the entry rung is meant
  //     to be a shop with one van, and what makes the ladder worth climbing is that the rungs above
  //     it cover more of her.
  //   * So FACT (1) - "doing well is worth real money, at least $1.5k a season" - is asserted where
  //     it now lives: on the ladder. A `global` deal covers $872 / $2,054 / $5,000, and a middle
  //     family keeps $2,087 by signing one. The local shop is asserted separately, for what it
  //     actually is: real money, and less of it.
  //   * FACT (2) and FACT (3) are untouched in every respect.
  //
  // ⚠ AND ONE MEASURED CONSEQUENCE IS FLAGGED RATHER THAN TUNED AWAY, because it is a balance
  // decision with history and this project measures before it picks. The 30.07 rebuild's central
  // claim is that a per-SEASON ceiling is the only flat shape there is, and its evidence was that
  // the ceiling BINDS at the top of the wealth corridor. With `local` down to one line that is no
  // longer true of the STEPPED-UP local deal: a wealthy family's string bill is ~$1,495 against a
  // $2,000 top allowance, so the cap does not bite and the corridor shows through at ~5x (against
  // ~2.2x before). It still binds on the rung whose allowance was sized for the lines it covers -
  // `global` pays a wealthy family exactly its $5,000 ceiling - so the mechanism is intact and it is
  // `ECONOMY.sponsorship.topSeasonCents` that is now sized for a deal it no longer describes.
  // Moving it is a tuning pass with its own sweep and it is reported, not smuggled in here.
  // ============================================================================================

  /** A career forced to the top of the national table, ticked to its first OFF-SEASON review, given
   *  the shop's letter and made to answer it - then ticked through the season that answer covers.
   *
   *  ⚠ 49 RATHER THAN 52 (01.08): the review moved out of the season boundary and into the first
   *  quiet week, because that is when a contract for next year is really agreed. */
  function seasonUnderDeal(
    seed: string,
    background: FamilyBackground,
    answer: 'sign' | 'refuse',
    intl: 'none' | 'world-class' = 'none',
  ): { world: WorldState; covered: number; startOfSeason: number; rng: ReturnType<typeof rngFromSeed> } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    // ...and, for the upper rungs, a body of INTERNATIONAL results, because that is the table they
    // read. Nothing else about the fixture differs.
    if (intl === 'world-class') world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'j300' })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 49; i++) tickWeek(world, rng)
    const offer = world.offers.find((o) => o.state === 'open')
    // A silent no-offer would make every assertion below vacuously true, which is the one way this
    // block could rot without ever going red.
    expect(offer, `${seed}/${background}: no letter arrived at the first boundary`).toBeDefined()
    if (answer === 'sign') acceptOffer(world, offer!.id)
    else declineOffer(world, offer!.id)
    const startOfSeason = world.fundsCents
    // ⚠ 52 -> 54 TICKS, AND `coveredCents` IS NOW A PER-SEASON COUNTER (08.08). The allowance resets
    //   at the season boundary, because the letter has always promised «up to $X of kit OVER THE
    //   SEASON» and a multi-season rung used to get one pot for the whole term. The consequence for
    //   this helper is that "52 ticks from the signature" stopped being a season: the deal runs from
    //   the week he signs (49) and the COVERED season is the calendar block 52-103, so the old
    //   window straddled the reset and read a fragment. Ticking to week 103 measures exactly one
    //   covered season, which is what every assertion below was always trying to ask - and it now
    //   also reaches the sponsor window's last week, which the note below says a caller wants.
    for (let i = 0; i < 54; i++) tickWeek(world, rng)
    // ⚠ `rng` COMES BACK OUT (05.08) so a caller can keep ticking on the SAME stream. The sponsor
    //   window's one feed row is written on the window's LAST week rather than its first, so a test
    //   that wants to read it has to reach week 51 of the year - and re-deriving the stream would
    //   replay a career that has already been lived.
    return { world, covered: offer!.coveredCents ?? 0, startOfSeason, rng }
  }

  it('the allowance is the SAME ceiling for every background (it does not know the family is rich)', () => {
    // THE POINT OF THE 30.07 REBUILD, AND IT SURVIVES BEING SPENT ON KIT RATHER THAN HANDED OVER.
    // The old percentage valve failed exactly here: a share of a corridor-scaled gear bill paid the
    // wealthy family seven times what it paid the working one. A per-SEASON ceiling cannot, because
    // the wealth corridor can raise the BILL and not the CAP - so the most any background can take
    // out of this deal is one number, and it is the same number.
    const cap = ECONOMY.sponsorship.topSeasonCents
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const { covered } = seasonUnderDeal(`flat-${bg}`, bg, 'sign')
      expect(covered, `${bg} spent more than the allowance`).toBeLessThanOrEqual(cap)
      expect(covered, `${bg} got nothing out of a signed deal`).toBeGreaterThan(0)
    }
    // ...and the CAP ITSELF is background-independent, which is the claim above stated exactly.
    //
    // ⚠ RE-AIMED 08.08, AND THE OLD FORM WAS ONLY TRUE BECAUSE OF THE BUG IT SAT ON. It used to
    //   assert `rich.covered === global.seasonCents` - the wealthy family spends the ceiling exactly
    //   - and that held because `coveredCents` never reset, so the accumulator was measuring the
    //   whole TERM against a cap the letter promises per SEASON. With the reset in place a clean
    //   covered season measures (seed flat-rich-top, weeks 52-103, global rung, all three lines):
    //
    //       covered $4,446 · family paid $1,288 (apparel, which no kit deal has ever covered)
    //       gross kit bill $5,734 · cap $5,000
    //
    //   so the covered LINES come to $4,446 against a $5,000 pot and the ceiling does not bite for a
    //   single season of cadence buying. That is not a regression, it is the fix showing through: a
    //   per-season pot is bigger than a per-term one. The invariant is unchanged and is now asserted
    //   where it cannot be an accident of window length - on the TERMS, which is where "it does not
    //   know the family is rich" actually lives - plus the bound on what is spent, which is kept.
    //
    // ⚠ FOR THE OWNER, a tuning question this exposed and does not answer: `global.seasonCents` at
    //   $5,000 is now larger than a wealthy family's whole annual covered-lines bill, so the top rung
    //   effectively covers everything she buys on cadence. It only starts to bite when she also buys
    //   UP the ladder, which since 08.08 spends the same pot. Sized deliberately or not, it is a
    //   number to look at with the per-season reading in mind.
    const caps = new Set<number>()
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const { world } = seasonUnderDeal(`flat-top-${bg}`, bg, 'sign', 'world-class')
      const terms = world.offers[0].terms as { tier: string; kitAllowanceCents: number }
      expect(terms.tier, `${bg} was not written to by the top rung`).toBe('global')
      caps.add(terms.kitAllowanceCents)
    }
    expect(caps.size, 'the allowance differs by background').toBe(1)
    expect([...caps][0]).toBe(ECONOMY.sponsorship.global.seasonCents)
  })

  it('a middle kid on a full deal keeps >= $1.5k more over the covered season than one who refused', () => {
    // Fact (1), and it is a DIRECT measurement now rather than a batch mean: the same seed, the same
    // draws, one signature apart. What she keeps is what the brand paid for.
    // ⚠ RE-AIMED ONTO THE LADDER (01.08): the fact is "doing well is worth real money" and the local
    //   shop is deliberately no longer the rung that proves it - it covers her strings. A career
    //   that has climbed to a brand which covers her kit clears the same $1,500 it always had to.
    // ⚠ THE SEED CHANGED WITH THE RUNG, and not to make anything pass: whether a brand writes is a
    //   draw on `seed:offer:<week>` at that rung's own chance, so a seed the shop wrote to is not
    //   automatically one the world wrote to. Nothing is stubbed - this is a letter the engine
    //   really raised, on its own stream, for a seed it really said yes to.
    const signed = seasonUnderDeal('cal-0', 'middle', 'sign', 'world-class')
    const refused = seasonUnderDeal('cal-0', 'middle', 'refuse', 'world-class')
    const kept = signed.world.fundsCents - signed.startOfSeason - (refused.world.fundsCents - refused.startOfSeason)
    expect(kept / 100).toBeGreaterThanOrEqual(1_500)
    // ...and every cent of it came out of the KIT LINES and nowhere else, which is the assertion that
    // says the deal pays in equipment rather than in money. (`kept` itself is a shade LARGER than the
    // covered total, and correctly so: money she did not spend sits in the account earning R9-1's
    // savings interest, so the balances diverge by a few dollars more than the kit did. Comparing the
    // gear buckets instead measures the mechanism rather than its second-order tail.)
    // ⚠ THE LEDGER WINDOW IS THE COVERED SEASON NOW, NOT WEEK 0 (08.08). `covered` counts one
    //   season since the allowance started resetting at the boundary, so a ledger summed from week 0
    //   includes the three off-season weeks between the signature (49) and the season it is FOR (52)
    //   and would exceed it. Same assertion, same mechanism, measured over the same window as the
    //   number it is compared against - which is what makes the equality meaningful rather than
    //   coincidental.
    const kitSpend = (w: WorldState) => {
      const cats = financeWindow(w.financeWeeks, COVERED_SEASON_START).byCategory
      return -((cats.gear ?? 0) + (cats.stringing ?? 0))
    }
    expect(kitSpend(refused.world) - kitSpend(signed.world)).toBe(signed.covered)
  })

  // ⚠ THE ALLOWANCE IS PER SEASON, BECAUSE THE LETTER SAYS SO (owner, 08.08). `signOffer` zeroed
  // `coveredCents` once, at signature, and nothing reset it again - so «up to $X of kit over the
  // season» was really $X over the whole TERM, and the two- and three-season rungs quietly gave the
  // brand one pot to cover two or three years. The owner's own save is a two-season national deal
  // that had spent $2,463.78 of a single $3,000 pot across a hundred weeks.
  //
  // ⚠ TESTED ON A DEAL BUILT HERE RATHER THAN THROUGH `seasonUnderDeal`, and the reason is worth
  // recording because it cost a debugging pass: that fixture enters NO tournaments, so the brand
  // reviews her at the first window, finds `minEventsPerSeason` unmet and walks. Its deal is already
  // over by week 101 - `activeKitDeal` returns nothing at 103 - so it could never have reached a
  // season boundary alive. What is under test is the rollover, not the obligation.
  it('the kit allowance starts again at the season boundary, once per season', () => {
    const world = createWorld('kit-rollover', { ...DEFAULT_PROFILE, background: 'middle' })
    const deal = {
      id: 'kit-roll',
      kind: 'kit' as const,
      week: 0,
      deadlineWeek: 4,
      state: 'signed' as const,
      decidedWeek: 1,
      fromWeek: 0,
      untilWeek: 400,
      coveredCents: 1_234_00,
      terms: {
        tier: 'national',
        brand: 'Netrally Distribution',
        kitAllowanceCents: 3_000_00,
        freshCap: 0.3,
        // ⚠ ZERO, so the brand cannot walk at the first window for an unmet obligation - which is
        //   exactly what ends `seasonUnderDeal`'s contract before it ever reaches a boundary. What
        //   is under test is the rollover, not the obligation.
        minEventsPerSeason: 0,
        covers: ['strings', 'frame'],
        travelShare: 0,
        seasons: 2,
      },
    }
    world.offers.push(deal as unknown as (typeof world.offers)[number])
    const rng = rngFromSeed(world.seed)

    // Mid-season weeks leave the pot alone (it only ever grows, as gear is billed onto it).
    for (let i = 0; i < 10; i++) tickWeek(world, rng)
    expect(world.week).toBe(10)
    expect(deal.coveredCents).toBeGreaterThanOrEqual(1_234_00)

    // ...and the boundary clears it. ⚠ IDEMPOTENT BY CONSTRUCTION, which is why this needed no
    // persisted `coveredSeasonIndex` and no schema bump: the reset hangs on a WEEK, and a week
    // happens exactly once. So it must fire at 52 and never again until 104.
    while (world.week < 51) tickWeek(world, rng)
    const beforeBoundary = deal.coveredCents
    expect(beforeBoundary).toBeGreaterThan(0)
    tickWeek(world, rng) // -> week 52
    expect(world.week).toBe(52)
    expect(deal.coveredCents).toBe(0)

    // The new season spends the NEW pot, and nothing clears it again inside the year. Twenty weeks
    // is plenty to see it grow monotonically - the file is already the slowest in the suite.
    let peak = 0
    for (let i = 0; i < 20; i++) {
      tickWeek(world, rng)
      const now = deal.coveredCents ?? 0
      expect(now, `cleared mid-season at week ${world.week}`).toBeGreaterThanOrEqual(peak)
      peak = now
    }
    expect(peak).toBeGreaterThan(0)
  })

  it('⚠ ...and the local shop is still worth REAL money – less of it, and only on her strings', () => {
    // The other half of the re-aim above, so that narrowing `local` to one line cannot quietly
    // become narrowing it to nothing. The entry rung has to keep being a deal worth signing:
    // measured, it pays a middle family a few hundred dollars a season and every cent of it comes
    // out of the stringing bucket - which is the coverage claim, in the ledger.
    const signed = seasonUnderDeal('cal-local-worth', 'middle', 'sign')
    const refused = seasonUnderDeal('cal-local-worth', 'middle', 'refuse')
    expect((signed.world.offers[0].terms as { tier: string }).tier).toBe('local')
    expect(signed.covered / 100).toBeGreaterThan(200)
    // Same covered-season window as the test above, and for the same reason (08.08).
    const bucket = (w: WorldState, cat: 'gear' | 'stringing') =>
      -(financeWindow(w.financeWeeks, COVERED_SEASON_START).byCategory[cat] ?? 0)
    // Strings: the shop paid for them, so the family's own stringing bill fell by exactly that much.
    expect(bucket(refused.world, 'stringing') - bucket(signed.world, 'stringing')).toBe(signed.covered)
    // ⚠ Racquets and shoes: NOT one cent. They are on the `gear` line and they stayed hers, which is
    //   the whole difference between this rung and the two above it.
    expect(bucket(signed.world, 'gear')).toBe(bucket(refused.world, 'gear'))
  })

  it('the sponsorship never perturbs the main weekly stream (RNG discipline)', () => {
    // Same seed, same background; one kid is forced to national rank 1, the other is not.
    const plain = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    const sponsored = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    sponsored.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'national' })
    recomputeKidRank(sponsored)
    const rngA = rngFromSeed('valve-rng')
    const rngB = rngFromSeed('valve-rng')
    // ⚠ RE-AIMED (05.08) ONLY IN WHERE IT STOPS: 51 rather than 52, because every letter now dies
    //   with the WINDOW (the off-season's last week) instead of four weeks after its own arrival, so
    //   a career ticked to 52 is holding an expired letter rather than an open one. The MAIN-stream
    //   claim below is a claim about a whole year and is unaffected; the 52nd week is ticked
    //   separately underneath, which lets the same test also pin that the expiry costs no draw.
    for (let i = 0; i < 51; i++) {
      tickWeek(plain, rngA)
      tickWeek(sponsored, rngB)
    }
    // The review reads a rank cache, adds an event and draws once on `seed:offer:<week>` - its own
    // sub-stream, created and thrown away. Cohort drift and the AI field resolve identically.
    expect(plain.cohort).toEqual(sponsored.cohort)
    expect(plain.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      sponsored.results.filter((r) => r.playerId !== KID_ID),
    )
    // ⚠ AND THE MONEY NO LONGER MOVES AT THE BOUNDARY, which is the whole slice in one assertion. The
    // ranked kid used to end week 52 richer by the grant; she now ends it holding a LETTER, and the
    // two balances are identical to the cent until somebody signs something.
    expect(sponsored.fundsCents).toBe(plain.fundsCents)
    expect(sponsored.offers.filter((o) => o.state === 'open')).toHaveLength(1)
    expect(plain.offers).toHaveLength(0)
    // ...and the week the window closes on takes the letter back without touching either stream.
    tickWeek(plain, rngA)
    tickWeek(sponsored, rngB)
    expect(sponsored.offers.filter((o) => o.state === 'open')).toHaveLength(0)
    expect(sponsored.fundsCents).toBe(plain.fundsCents)
    expect(plain.cohort).toEqual(sponsored.cohort)
  })

  it('the ledger says who paid, and the boundary says what the season of kit was worth', () => {
    // Fact (2). The old mechanism was defended for being VISIBLE - one annual lump in the `sponsor`
    // income category, against a valve smeared over 25-39 invisible line-items. Kit has to clear the
    // same bar, and it clears it in two places rather than one.
    const { world, rng } = seasonUnderDeal('cal-2', 'middle', 'sign')
    const covered = world.events.filter(
      (e) => e.type === 'expense' && e.text.includes(ECONOMY.sponsorship.localBrand),
    )
    expect(covered.length, 'no gear row names the shop that paid for it').toBeGreaterThan(0)
    // The line is still EMITTED at what the family actually paid, so the Money breakdown shows the
    // relationship instead of a cost quietly vanishing - `chargeTravel`'s pattern with the academy.
    for (const e of covered) expect(e.amountCents).toBeLessThanOrEqual(0)
    // ...and the season's total is reported at the next boundary, the way the academy's cover is -
    // ⚠ INCLUDING WHEN THE DEAL LAPSES, which is this fixture's case. She never entered a tournament,
    // so the obligation (`minEventsPerSeason`) went unmet and the shop is not renewing; the line still
    // says what the year of kit was worth, because a deal ending is exactly when the player needs to
    // see what he has just lost.
    // ⚠ RE-AIMED (05.08): the review became a five-week WINDOW and its single feed row is written on
    //   the window's last week rather than its first, so the career has to be ticked to it. That is
    //   the feed budget speaking rather than a preference - see `reviewSponsors`: four letter weeks
    //   must not become four rows, and one row written last can carry the whole winter. The claim
    //   being guarded is unchanged and is still exactly one row a season.
    while (world.week % 52 !== 51) tickWeek(world, rng)
    const report = world.events.filter((e) => e.text.includes('kitted her out all season'))
    expect(report.length).toBe(1)
    // ⚠ RE-AIMED (01.08) IN ITS WORDING ONLY: "not renewing" became "they are done", because a rung
    //   whose term can outlast a season does not merely decline to renew - it ENDS. Same fact, same
    //   line, same figure on it.
    expect(report[0].text).toContain('they are done')
    expect(report[0].text).toMatch(/\$[\d,]+ of kit/)
  })

  it('...and the gear line-items are not a PERCENTAGE again - the old valve stays dead', () => {
    // ⚠ RE-AIMED, NOT WEAKENED. Both original pins are kept verbatim: the 30.07 valve's exact copy
    // may never come back. What this case is really guarding is the SHAPE, and that is now stated
    // outright as well - the shop's contribution is capped per SEASON, so no gear row can ever be
    // reduced by a fraction of itself. A per-item share is what paid the wealthy family seven times
    // the working family's subsidy and is the thing that must not return; a bill somebody else paid
    // in full, up to a flat annual ceiling, is a different animal (see ECONOMY.sponsorship).
    const { world, covered } = seasonUnderDeal('cal-2', 'wealthy', 'sign')
    for (const e of world.events) {
      expect(e.text).not.toContain('covered by your racket sponsor')
      expect(e.text).not.toContain('sponsor covers half')
    }
    expect(covered).toBeLessThanOrEqual(ECONOMY.sponsorship.topSeasonCents)
    // Every row the shop touched was paid IN FULL or not at all, bar the single row the allowance
    // ran out on - never a share of each.
    const partPaid = world.events.filter(
      (e) =>
        e.type === 'expense' &&
        e.text.includes(ECONOMY.sponsorship.localBrand) &&
        (e.amountCents ?? 0) < 0,
    )
    expect(partPaid.length, 'more than one row was part-paid - that is a percentage valve').toBeLessThanOrEqual(1)
  })

  it('the gate reads the NATIONAL table – an international-only result buys nothing', () => {
    // The regression that made this dead content, pinned. A kid who is #1 in the world and unranked
    // at home is not somebody a local shop has heard of; more to the point, the reverse is the case
    // this mechanic exists for and the two must not be confused again.
    const world = createWorld('gate-table', { ...DEFAULT_PROFILE, background: 'working' })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000, tier: 'j300' })
    recomputeKidRank(world)
    expect(world.kidRank).toBe(1) // top of the international table...
    expect(world.kidRankDomestic!).toBeGreaterThan(ECONOMY.sponsorship.maxRank) // ...nobody at home
    expect(localSponsorCents(world.kidRankDomestic!)).toBe(0)
  })
})

describe('gear cadence (round-7 a) – each category fires within its window', () => {
  const HORIZON = 520
  for (const background of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    for (const category of GEAR_CATEGORIES) {
      it(`${background}/${category}: gaps and prices stay inside the configured ranges`, () => {
        const line = ECONOMY.gear[category]
        const [cadLo, cadHi] = line.cadenceWeeks[background]
        const [prLo, prHi] = line.priceCents[background]
        const hits = gearHitsUpTo(`gear-cadence-${background}`, category, background, HORIZON)
        expect(hits.length).toBeGreaterThan(0)
        let prev = 0
        for (const h of hits) {
          const gap = h.week - prev
          expect(gap).toBeGreaterThanOrEqual(cadLo)
          expect(gap).toBeLessThanOrEqual(cadHi)
          expect(h.amountCents).toBeGreaterThanOrEqual(prLo)
          expect(h.amountCents).toBeLessThanOrEqual(prHi)
          prev = h.week
        }
      })
    }
  }

  it('gear schedules are deterministic and independent of the main stream / background choice', () => {
    // Same seed → same schedule every time (purpose-scoped sub-stream, re-derived from the seed).
    const a = gearHitsUpTo('det', 'rackets', 'middle', 200)
    const b = gearHitsUpTo('det', 'rackets', 'middle', 200)
    expect(a).toEqual(b)
    // A longer horizon is a strict prefix-superset: the (week, amount) pairs for the earlier weeks
    // never shift, so walking further ahead can't retroactively change a past purchase.
    const short = gearHitsUpTo('det', 'rackets', 'middle', 60)
    const long = gearHitsUpTo('det', 'rackets', 'middle', 200)
    expect(long.slice(0, short.length)).toEqual(short)
  })
})

// ---------------------------------------------------------------------------
// ⚠ RE-AIMED BY THE COACH LADDER (docs/specs/coach-tiers.md §2), AND THE FACT IS INVERTED
// ON PURPOSE. This block used to be "coaching wealth corridor": the weekly coaching bill was a
// band × ONE uniform roll from the private `seed:coachbg:week` sub-stream mapped into
// `wealthCorridor[background]`, and the tests asserted working < middle < wealthy per week.
//
// WHAT MOVED. The corridor came OFF coaching, because the coach TIER now states the family's price
// level explicitly and keeping both would charge the difference twice – a working family would pick
// Budget AND get a discount on it. So the ordering that used to be asserted here is now a bug, and
// the property that replaces it is its exact negation: the coaching bill is a MARKET RATE, the same
// number for every background, and what differs is who can pay it.
//
// WHAT DID NOT MOVE, and is why the third test below is untouched: the corridor was always a
// POST-draw multiply off a private sub-stream, so the MAIN weekly stream never depended on
// background. Removing it cannot have broken that, and the guard still proves it – it is simply
// proving something stronger now (no sub-stream roll to be background-dependent about either).
//
// The corridor itself is alive and asserted elsewhere, on the three bills that kept it: travel
// (tests/season/calendar.test.ts), medical (tests/injuries.test.ts C11) and the season planner's
// packages (tests/planner.test.ts P3).
// ---------------------------------------------------------------------------
// ⚠ RE-AIMED TWICE, AND IT IS BACK WHERE IT STARTED - WITH A BETTER REASON.
//
// Round 1 inverted this block. It had asserted working < middle < wealthy per week (the coaching
// bill × `wealthCorridor[background]` off one `seed:coachbg:week` roll), and I inverted it to
// "every background pays the same" on the argument that the coach TIER already says "poorer
// families buy cheaper coaches", so keeping the corridor charges the difference twice.
//
// Round 2 put it back, because the owner's model is better and is a DIFFERENT claim: the corridor
// is not a discount for being poor, it is THE MARKET SHE TRAINS IN. The same rung of coach costs
// different money in a working-class club, an ordinary academy and a premium one - the court, the
// city and the queue for that coach's time are different. A family does not get a cheaper Middle
// coach because it is poor; it hires the Middle coach its academy HAS. So the ordering below is
// asserted again, and the wealthy family paying MORE for the same rung is the point rather than a
// side effect.
//
// WHAT IS NEW SINCE THE ORIGINAL, and why this is not simply the old block restored: the tier is a
// second, independent dial. The corridor orders the three FAMILIES at one rung; the rung ladder
// orders the five RUNGS inside one family. Both are asserted here, and the bands' own ascent (which
// is what makes the second ordering hold) is pinned in tests/coachTiers.test.ts.
//
// The third test is untouched through both rounds, and that is the point of it: the corridor was
// always a POST-draw multiply on a private sub-stream, so the MAIN weekly stream never depended on
// background - taking it off could not break that and putting it back cannot either.
// ---------------------------------------------------------------------------
describe('the coaching bill is priced in the family\'s own market (the wealth corridor)', () => {
  const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

  // Tick one week and return the week-1 coaching bill in cents.
  function weekOneCoaching(seed: string, background: FamilyBackground, coachTier: CoachTier): number {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier })
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const bill = world.events.find((e) => e.week === 1 && e.category === 'coaching')
    expect(bill).toBeDefined()
    return -bill!.amountCents!
  }

  it('orders working < middle < wealthy for the SAME rung, per week, off the same roll', () => {
    // The corridors are disjoint (≤0.80 < 0.95..1.05 < 1.20≤) and the roll is shared, so the
    // ordering holds every week rather than only on average. Asserted at EVERY rung, because the
    // claim is that the whole ladder is priced in every market and not just the middle of it.
    for (const tier of COACH_TIERS) {
      const costs = BACKGROUNDS.map((bg) => weekOneCoaching('coach-market', bg, tier))
      expect(costs[0]).toBeLessThan(costs[1])
      expect(costs[1]).toBeLessThan(costs[2])
      // ...and each bill sits inside its rung's weekly envelope for ITS market.
      BACKGROUNDS.forEach((bg, i) => {
        const world = createWorld('coach-market', { ...DEFAULT_PROFILE, background: bg, coachTier: tier })
        const [lo, hi] = coachWeeklyBandCents(tier, ageAtWeek(1), world.plan, bg)
        expect(costs[i]).toBeGreaterThanOrEqual(lo)
        expect(costs[i]).toBeLessThanOrEqual(hi)
      })
    }
  })

  it('orders the RUNGS inside one market: self < budget < middle < high < elite', () => {
    // The second dial. Rung bands do not overlap between neighbours (self takes the middle of
    // $10-30/h, budget is $24-36, middle $40-60, high $64-96, elite $96-144), so a career on a
    // dearer rung really does pay more whatever coach it drew - which is what makes "which rung"
    // a decision rather than a lottery.
    for (const bg of BACKGROUNDS) {
      const costs = COACH_TIERS.map((tier) => weekOneCoaching(`rung-${bg}`, bg, tier))
      for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1])
    }
  })

  it('is deterministic: the same seed + market + rung always yields the same bill', () => {
    for (const tier of COACH_TIERS) {
      for (const bg of BACKGROUNDS) {
        expect(weekOneCoaching('coach-det', bg, tier)).toBe(weekOneCoaching('coach-det', bg, tier))
      }
    }
  })

  it('never perturbs the MAIN weekly stream: draw count + sequence are background-independent (52w)', () => {
    // UNCHANGED THROUGH BOTH ROUNDS. The bill is drawn with one main-stream `pickInt` and everything
    // with a decision behind it - rate, hours, corridor - is multiplied on afterwards, off pure
    // look-ups or private sub-streams. So the same seed must produce a byte-identical main-stream
    // sequence for every background.
    const capture = (background: FamilyBackground) => {
      const world = createWorld('coach-invariance', { ...DEFAULT_PROFILE, background })
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) tickWeek(world, rng)
      return draws
    }
    const [w, m, r] = BACKGROUNDS.map(capture)
    expect(m.length).toBe(w.length)
    expect(r.length).toBe(m.length)
    expect(w.join(',')).toBe(m.join(','))
    expect(r.join(',')).toBe(m.join(','))
  })
})
