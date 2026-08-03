// Package L – tournament calendar. Pure: the season is a deterministic function
// of a seed string and a week span. No worker/DOM/IndexedDB, no Math.random –
// all randomness flows from a season sub-RNG (rngFromSeed(seedStr)).

import { rngFromSeed, pickInt, type Rng } from '../rng'
import type { Surface } from '../match/types'
import type { FamilyBackground } from '../../shared/protocol'
import { ECONOMY } from '../economy'
import type { SeasonEvent, TierDef, TierId } from './types'

// Tier catalogue. Economy numbers are whole cents. `points` length = rounds + 1
// (rounds = log2(drawSize)); index 0 = champion. Every tier is LIVE – the inert `itf`
// placeholder became the j30/j60/j300 family in the ladder-up slice.
//
// THE LAST ELEMENT IS THE FIRST-ROUND EXIT, AND IT IS 0 AT EVERY TIER (wave B, tune/first-round-zero).
// runTournament sets `finishes[loser] = rounds - round` with round 0 = the first round, so a
// first-round loser's finish is exactly `rounds` – the last slot. It used to pay (local 5,
// regional 6, national 6, j30 12, j60 18, j300 30), which with best-6 was a PARTICIPATION INCOME:
// 26 J30 first-round exits a season banked a 72-point floor before she won anything, and
// docs/research/ranking-points-by-tier.md names that floor – not the title value – as the actual
// engine of the "just play J30s" degeneracy. The real ITF table pays nothing at any grade until you
// win a main-draw match (Reg 31(a): "No ranking points will be awarded to a player until he/she has
// played and won a round in the Main Draw"), and the professional table repeats the shape at W15/W35.
// So: she now earns her first point by WINNING one, at every rung. Pinned by tests/wave-b-points.ts.
//
// THE LADDER (owner: "there must ALWAYS be somewhere to go"). Two overlapping ladders. The
// DOMESTIC rungs read off her earned windowed best-6 in the national table; the J rungs above the
// on-ramp read off her ITF RANK instead (see two-ladders.md), so this axis places j60/j300 only
// by where they land in practice:
//
//   domestic pts →   0      65    85       150            250
//   local            ├───────────────┤
//   regional                ├──────────────────────────────┤
//   national                          ├────────────────────────────────────────→ ∞
//   j30 (on-ramp)                                          ├───────────────────→ ∞
//   ITF rank →                                             ·  top 40%   top 25%
//   j60                                                           ├────────────→ ∞
//   j300                                                                  ├────→ ∞
//
// Read it as: she never falls off the bottom (local opens at 0), she is never stranded at the
// top (national and every J level use the MAX sentinel so they never graduate her out), and at
// every total at least TWO rungs are open at once, so the handover is a choice rather than a
// cliff. ⚠ National's floor (150) and J30's (250) are deliberately 100 points apart – closing
// that gap is what killed National once already. Only local and regional graduate her – the two
// tiers she is meant to outgrow. NO junior level pays prize money (real rule: juniors pay to play), which is the
// whole "invest without knowing the return" thesis: international travel out, points only back.
export const TIERS: Record<TierId, TierDef> = {
  local: {
    id: 'local',
    track: 'domestic',
    label: 'Local Open',
    drawSize: 8,
    entryFeeCents: 40_00,
    travelCostCents: [60_00, 120_00],
    points: [30, 18, 10, 0],
    everyNWeeks: 2,
    // The ENTRY tier: open from 0 points (a fresh kid always starts here), graduates out once she has
    // clearly outgrown it (best-6 > 85 pts – roughly three strong local runs). Tuned on the bench so a
    // fresh career shows a real early local phase before the regional/national climb.
    enterPointBand: [0, 85],
    // The bottom 45% of the standings – the draw a kid can genuinely win her first title in.
    entrantPctBand: [0.55, 1.0],
  },
  regional: {
    id: 'regional',
    track: 'domestic',
    label: 'Regional Championship',
    drawSize: 16,
    entryFeeCents: 75_00,
    travelCostCents: [150_00, 400_00],
    points: [80, 48, 28, 14, 0],
    everyNWeeks: 4,
    // Opens once she has a couple of counting results (65 pts); graduates out at 250. Overlaps local
    // (65-85) and national (150-250), so the climb is a smooth local → regional → national handover.
    // ⚠ The ceiling moved 230 → 250 with J30's floor, so that regional stays open right up to the
    // week the international door does. At 230 there was a 20-point band in which National (6 events
    // a season) was the only tier she could enter, and a career can sit in a band like that for
    // months. The two numbers are one decision and must move together.
    enterPointBand: [65, 250],
    entrantPctBand: [0.4, 0.88],
  },
  national: {
    id: 'national',
    track: 'domestic',
    label: 'National Series',
    drawSize: 32,
    entryFeeCents: 120_00,
    travelCostCents: [400_00, 900_00],
    points: [200, 120, 70, 35, 15, 0],
    everyNWeeks: 13,
    // R9-20 (owner): 4 a year is far too sparse for a kid who has outgrown regional but cannot yet
    // afford the international calendar, and the shortage bites hardest in the season's back half
    // (the base cadence puts the last one around week 45). Two EXTRA nationals in the second half
    // takes it to 6/season – a modest bump that keeps the tier prestigious while giving the
    // 150-180 point window a real bridge into the J ladder.
    secondHalfBonus: 2,
    // R12-6 (owner playtest 27.07: "two Nationals on adjacent weeks, twice in one season, including
    // the last two weeks"). The R9-20 extras above are spread across the second half by their OWN
    // even placement, blind to where the 13-week base cadence already put one – so the two could
    // land side by side. A National is a week the family plans around and cannot play twice in a
    // row; 2 means never consecutive. Trivially satisfiable at 6 events over 49 placeable weeks.
    minGapWeeks: 2,
    // Opens at 150 pts; never graduates (sentinel maxPoints keeps the top of the ladder always open).
    enterPointBand: [150, Number.MAX_SAFE_INTEGER],
    // The domestic elite is a mid-table field once the real prospects are away on the J tour.
    entrantPctBand: [0.2, 0.7],
  },
  // --- the junior international tour (age 13-18, no prize money) ------------------------------
  // Real ladder: J500/J300/J200/J100/J60/J30, with J30+J60 = 75% of ALL events. We ship the two
  // dense entry levels plus one rare prestige level; the rest is content later. Points scale with
  // the level off the j30 array (j60 = ×1.5, j300 = ×2.5), and j30 already out-scores a National
  // at every finish – an international result is worth more than a domestic one of the same round.
  j30: {
    id: 'j30',
    track: 'itf',
    label: 'Junior Tour 30',
    drawSize: 32,
    entryFeeCents: 200_00,
    travelCostCents: [900_00, 2000_00],
    points: [30, 18, 9, 5, 2, 0],
    // THE dense entry level – with regional it is what makes an empty week a choice, not a gap.
    everyNWeeks: 2,
    minAgeYears: 13,
    // ⚠ AND IT CLOSES AFTER 18 (§4.1). See TierDef.maxAgeYears: real ITF juniors is U18, and until
    // this landed the three J rungs opened at 13 and shut never. The number lives on all three J
    // rungs and nowhere else - the domestic ladder is OURS, not the ITF's, and stays open at every
    // age because it is where an adult who is not good enough still plays (owner's call 2, §6).
    maxAgeYears: 18,
    // THE DOMESTIC LADDER IS THE ON-RAMP (owner, 29.07). J30 is the one international rung that
    // opens on DOMESTIC points, and everything above it opens on ITF rank. That is how a real
    // career starts: a federation nominates you onto an acceptance list off your national standing,
    // because you cannot have an international ranking before you have played internationally, and
    // a rank gate on the first rung would be a closed loop.
    //
    // ⚠ 250, NOT the 150 that opens National. They were the same number for one release and it made
    // National dead content: the entry policy walks the calendar strongest-tier-first, so the week
    // National opened J30 opened too, J30 always won, and National fell to 0.3 entries per
    // four-year career (measured, 120 seeds - see docs/specs/two-ladders.md). Staggering them makes
    // National the rung she climbs THROUGH rather than past, which is the climb the game is about:
    // Local -> Regional -> National -> the world. Owner, 29.07: «National становится ступенью,
    // через которую проходят, а не мимо которой - вот это мне нравится, да».
    //
    // 250 is a National quarter-final (70) on top of a full regional book - she has to show up at
    // her national championship and win a round before the world opens. It is also exactly where
    // regional graduates out (below), so the domestic ladder hands over to the international one at
    // the point where it ends, with no band in which only one sparse tier is open.
    // Never closes - a J30 stays a legitimate week even for a strong junior.
    enterPointBand: [250, Number.MAX_SAFE_INTEGER],
    entrantPctBand: [0.12, 0.6],
  },
  j60: {
    id: 'j60',
    track: 'itf',
    label: 'Junior Tour 60',
    drawSize: 32,
    entryFeeCents: 250_00,
    travelCostCents: [1100_00, 2400_00],
    points: [60, 36, 18, 10, 5, 0],
    everyNWeeks: 3,
    minAgeYears: 13,
    maxAgeYears: 18, // U18, like every J rung – see TierDef.maxAgeYears and j30 above.
    // THE ACCEPTANCE LIST. A share of the field, not a count, so it survives the population growing
    // from today's ~200 toward the 2-3k living-field.md plans.
    //
    // ⚠ 0.50, RE-PICKED FROM 0.40 (30.07, tune/rank-numbers). The old value was not chosen against
    // any measurement - it was the IDENTITY `enterPct === entrantPctBand[1]`, which read beautifully
    // ("she is accepted if she would be inside the field they draw from") and was the reason this rung
    // was shut. The two numbers are not the same question: `entrantPctBand` is where an AI player's
    // AMBITION window sits (who the field is MADE of), `enterPct` is the ACCEPTANCE CUT (when the
    // tournament stops saying no). In real tennis the cut sits BELOW the regulars - that is what
    // qualifying and wildcards are for - so setting it AT the top of the field was the strictest
    // reading available. Measured against an honest ITF rank it gave 0.0-3.4 j60 entries per
    // four-year career in all nine presets on both arms: a rung nobody played.
    //
    // WHY 0.50 AND NOT MORE. 0.55 makes J60 everybody's home rung and stops the gate telling the
    // classes apart - a SELF-COACHED working family plays 16.8 J60s a career at 0.55 against 3.0 at
    // 0.50, and the 8k budget grinder plays 29.5. 0.50 is the largest share that still discriminates.
    // (And nothing above ~0.65 gates at all: the ITF table is only ~120 deep in a 200-strong cohort
    // because everyone without a counting international result ties at the floor, so every share from
    // 0.65 to 0.90 accepts every ranked player - the weeks-on-list count is identical across all of
    // them, and whole careers re-run at 0.65 and 0.70 are byte-identical. Usable range: 0.40-0.65.)
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    enterPct: 0.5,
    entrantPctBand: [0.05, 0.4],
  },
  j300: {
    id: 'j300',
    track: 'itf',
    label: 'Junior Tour 300',
    drawSize: 32,
    entryFeeCents: 400_00,
    travelCostCents: [1600_00, 3200_00],
    // ⚠ THE LAST ENTRY IS 0, NOT THE ITF TABLE'S 30, and the difference is our draw size. Reg 31's
    // "R32" column means REACHED the round of 32 having won a round, which in a real J300 (draws of
    // 48-64) is a player who has already won. Our J300 draw is 32, so its last finish index IS the
    // first-round loser - and Reg 31(a) is explicit that nobody scores until they have won a main
    // draw round. Copying the 30 across would have paid for losing, which is the exact participation
    // floor wave B removed. Caught by wave-b-points.test.ts, which is what that test is for.
    points: [300, 210, 140, 100, 60, 0],
    // Rare by design: four a year, so each one is an event the family plans a season around.
    everyNWeeks: 13,
    // R12-6: same rule as national, for the same reason and with even more room (4 events). The two
    // DENSE entry rungs – j30 (every 2 weeks) and j60 (every 3) – deliberately get NO gap: they are
    // dense by design, and 26 j30s cannot fit in 49 weeks at 2 apart anyway.
    minGapWeeks: 2,
    minAgeYears: 13,
    maxAgeYears: 18, // U18, like every J rung – see TierDef.maxAgeYears and j30 above.
    // THE ACCEPTANCE LIST for the prestige rung.
    //
    // ⚠ 0.40, RE-PICKED FROM 0.25 (30.07, tune/rank-numbers), and this one deliberately breaks the
    // old identity in the other direction: 0.40 is LOOSER than `entrantPctBand[1]` (0.25), so J300
    // admits players from outside its own regular field. That is the point. The field is drawn from
    // the top quarter of the table; a girl arriving off the domestic ladder with a J30 book sits at
    // #89-#109, and a cut at the top of the field she is trying to break into is a cut no career in
    // any preset ever cleared - measured, 0.0-0.3 entries per four-year career in all eighteen cells.
    // A prestige rung has to be enterable from below or it is not a rung, it is a ceiling.
    //
    // IT STILL TIGHTENS RELATIVE TO j60 (0.40 < 0.50), which is the rule that actually matters: the
    // ladder gets harder as you climb. What it no longer does is equal its own entrant band.
    //
    // WHY 0.40 AND NOT 0.35 OR 0.30. The target was written down before tuning (see
    // docs/specs/two-ladders.md "What a good career ladder looks like"): J300 is the only four-figure
    // crowd in the game (900-2,600 against j60's 110-320), the lore's "one rung where a junior plays
    // in front of strangers", and four exist a season - so it should be 0 for most careers, 1-2 for a
    // good one and 2-3 for the best, never the four-a-year commute the phantom rank made of it.
    // Measured per four-year career: 0.30 gives 0.0-0.9 (still nearly absent), 0.35 gives 0.2-1.4,
    // 0.40 gives 0.3 for the weak presets and 1.8-2.2 for the strong - about one every other season
    // for a career that earns it, and ~14% of the sixteen on the calendar. That is the target.
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    enterPct: 0.4,
    entrantPctBand: [0.0, 0.25],
  },
  // --- the adult tour: the ITF World Tennis Tour, and the first money she is ever paid ------------
  //
  // ⚠ THIS IS A THIRD TABLE, not a continuation of the junior one. See LadderTrack in season/types.ts
  // for why: a seventeen-year-old holds a junior ITF ranking and a senior WTA ranking at the same
  // time, and a junior Slam pays exactly zero WTA points. The two never mix.
  //
  // THE REAL LADDER, so the numbers are checkable rather than invented: the women's professional
  // ladder is W15 -> W35 -> W50 -> W75 -> W100, then WTA 125, then WTA 250/500/1000, then the four
  // Slams. ⚠ THE NUMBER IS THE WINNER'S POINTS, NOT THE PURSE - the 2024 restructure renamed
  // W25/W40/W60 to W35/W50/W75 "aligning the tournament naming with the points awarded to the
  // Winner" (research §4), and the purses stayed where they were: a W35 pays $30,000, a W50
  // $40,000, a W75 $60,000. (This comment used to claim prize-money-in-thousands; true of W15 and
  // W100 by coincidence, false of the three middle rungs, corrected with W2-LADDER.) Since
  // W2-LADDER the family ships COMPLETE through WTA 125 (owner ruling 6): the two middle rungs turn
  // the shipped ×5 title jump W35 -> W100 into ~×2 steps - a girl with five W15 titles has
  // somewhere to GROW every half-season instead of one distant cliff - and the 125 gives W100 the
  // same "one rung above you" pull W100 gives W75. 250s and up are act 3.
  //
  // THE POINTS ARE THE WTA TABLE'S OWN: a W15 title is 10 points, a W35 title 20, a W100 title 100.
  // ⚠ AND THEY LOOK TINY BESIDE THE JUNIOR NUMBERS ON PURPOSE - a J300 title pays 300 and a W15 title
  // pays 10. That is not a scaling mistake, it is the whole point of the fork at 19: she arrives at
  // the adult tour with a junior ranking that buys her nothing, and starts again at the bottom of a
  // table where the numbers are smaller and mean more. The two columns are never added.
  //
  // ⚠ W50/W75/WTA125 CARRY THE REAL 2026 CHART'S OWN ROWS, VERIFIED, NOT THE SPEC'S DESIGN VALUES
  // (W2-LADDER; docs/research/ranking-points-by-tier.md §4, 2026 WTA Official Rulebook VIII.A.5).
  // The spec table (act2-pro-tour.md §2) proposed 40/60/125 titles with invented round rows; its own
  // ⚠ says those are "design values pending the in-wave verification ... the research doc wins", and
  // the research disagrees: the 2024 restructure NAMED every rung after the winner's points (W50
  // title = 50, W75 = 75, 125 = 125), so shipping a "W50" that pays 40 would break the one naming
  // rule both real tours share. The three shipped rows above predate that verification and are canon
  // as-is (spec §2); the seam W35 (20) -> W50 (50) is therefore ×2.5 rather than the real ×1.43,
  // which is the compressed-canon-meets-real-chart cost, accepted over renaming a real rung.
  //
  // ⚠ AND THE LAST ELEMENT IS 1 FROM W50 UP, NOT WAVE B'S 0 - the real chart's own shape: "zero for
  // a first-round loss at the two bottom rungs, a nominal 1 point higher up" (research §4). Wave B's
  // rule ("she earns her first point by WINNING one") was aimed at the PARTICIPATION FLOOR, and the
  // nominal 1 cannot rebuild it: W50+ sit behind the hardest acceptance cuts in the game, the pro
  // entry cap prices every entry, and a whole best-16 window of 1-point exits is out-paid by one
  // W50 semi-final - so the guard in tests/wave-b-points.test.ts is RE-AIMED per family, not
  // weakened.
  //
  // AGE. The ITF age-eligibility rule lets a fourteen-year-old play a handful of pro events and lifts
  // the cap yearly, so a good junior plays her first W15 at sixteen or seventeen. 16 / 16 / 17 below
  // gives her three seasons of overlap with the junior tour, which is what makes the handover at 19 a
  // DECISION with evidence behind it rather than a jump into the dark.
  // --- and the cheque (A2). THE POINT OF THE WHOLE SLICE -------------------------------------
  //
  // Three tables of `prizeCents`, one number per finish, in whole cents, indexed exactly like
  // `points` above. Real ITF World Tennis Tour singles money, rounded to something a tournament
  // would actually print. See TierDef.prizeCents for the three rules that make this different in
  // kind from the points array (a first-round exit is NOT zero; it does not scale with the wealth
  // corridor; and it exists on the W rungs ONLY, because juniors pay to play).
  //
  // SANITY-CHECKED AGAINST `travelCostCents` RATHER THAN TAKEN ON TRUST, which is what the plan
  // asked for and is where the design actually lives. Trip = entry fee + travel, at the middle
  // family's corridor (x0.95-1.05; a working family pays x0.7-0.8 and a wealthy one x1.2-1.3 for
  // exactly the same week, against exactly the same cheque):
  //
  //   rung  trip           R32 exit         break-even finish   title
  //   W15   $1,300-2,500   $130   (~7%)     THE TITLE, barely   $2,200 - i.e. she wins the whole
  //                                                              thing and roughly covers the trip
  //   W35   $1,700-3,200   $290   (~12%)    semi-final          $5,000 - clears ~$2,600
  //   W50   $2,000-3,600   $350   (~13%)    semi-final          $6,000 - clears ~$3,200
  //   W75   $2,200-3,900   $550   (~18%)    semi-final          $9,000 - clears ~$5,900
  //   W100  $2,500-4,400   $900   (~26%)    quarter-final       $14,500 - clears ~$11,000
  //   125   $2,800-4,900   $1,300 (~34%)    quarter-final       $20,000 - clears ~$16,100
  //
  // READ THE W15 ROW AGAIN, because it is the cliff the whole design turns on: at the entry rung of
  // the professional game, WINNING THE TOURNAMENT approximately pays for having gone. Everything
  // else is a loss. That is not a balance failure, it is docs/research/02-tennis-economics.md -
  // Kiranpal Pannu earned $6,771 and spent $34,500 in 2022 - and it is why the ladder has to be
  // climbed rather than farmed. W35 is where a good week starts to pay for a bad one, and W100 is
  // where a single result changes the family's year. The two middle rungs stretch that middle
  // stanza instead of skipping it - the break-even finish stays a semi-final for three rungs
  // running while the CLEARED amount roughly doubles per rung, so climbing pays before surviving
  // gets easier - and the 125 is the first rung where merely reaching the quarters banks a typical
  // trip twice over.
  //
  // ⚠ W50/W75 CHEQUES ARE THE REAL PURSES' FRACTIONS, NOT THE SPEC'S (W2-LADDER, same verification
  // as the points rows above). The spec's ~$7.5k/~$11k titles assumed name-equals-purse ($50k/$75k
  // purses at the shipped ~15% champion's fraction) - the exact misreading the research corrects:
  // the real purses are $40k and $60k (the Aug-2024 press-release rises "never took effect",
  // research §7c). The shipped three take ~14.5-16.7% of the REAL purse as the title cheque and
  // ~0.575x per finish step down; applying the same fractions gives $6,000 and $9,000 titles -
  // within ~$150 of the real 2026 champion's cheques. The 125's ~$20k title keeps the spec's design
  // value: the research is silent on 125 money, and $20k is the top of the real 125 range - the
  // same ~15% of a ~$130k purse.
  w15: {
    id: 'w15',
    track: 'wta',
    label: 'World Tour 15',
    drawSize: 32,
    entryFeeCents: 300_00,
    travelCostCents: [1000_00, 2200_00],
    points: [10, 6, 3, 2, 1, 0],
    // $2,200 / $1,300 / $750 / $450 / $250 / $130.
    prizeCents: [2200_00, 1300_00, 750_00, 450_00, 250_00, 130_00],
    // The dense entry rung of the adult game, exactly as j30 is of the junior one.
    everyNWeeks: 2,
    minAgeYears: 16,
    // ⚠ THE JUNIOR TABLE IS THE ON-RAMP, and this is the same rule j30 keeps one track down: the
    // bottom rung of a table is opened by the table BELOW it, because a player cannot hold a ranking
    // in a table she has never played in, and a rank gate on the first rung would be a closed loop.
    // So W15 reads her ITF JUNIOR points, and W35/W100 read her WTA rank (`enterPct`), which is
    // precisely the j30 / j60+j300 split.
    //
    // 120 ITF junior points is a J60 title, or a J300 quarter-final, or a full book of J30 results -
    // a junior who has actually won something abroad. Below that the adult tour is not a rung she is
    // climbing to, it is a wall she would pay $1,300 to walk into.
    enterPointBand: [120, Number.MAX_SAFE_INTEGER],
    // The bottom of the professional game is a wide field: everyone from a first-year pro to a
    // former top-200 on the way back down.
    //
    // ⚠⚠ THE WHOLE W FAMILY'S WINDOWS WERE RE-MEASURED BY W2-FIELD2 (02.08) AND THEY SLIDE NOW
    // RATHER THAN NEST. Read this note once; the five rungs below refer back to it.
    //
    // WHAT FORCED IT, measured on THIS branch before anything moved (tools/field-quality.ts, 16
    // worlds, six rungs — the printout is in fieldPros.ts's FIELD table too):
    //
    //     rung     field mean core    P(the reference strong junior wins the title)
    //     w15           51.4                      8.8%     <- target 15-35%, ALREADY BROKEN
    //     w35           53.8                      6.8%
    //     w50           57.3                      1.6%
    //     w75           59.7                      0.6%
    //     w100          59.7                      1.0%
    //     wta125        59.7                      2.1%
    //
    // TWO defects in one table. (a) The top THREE rungs draw the SAME field to one decimal, because
    // every window from w75 up opened at percentile 0 and entry is position-biased — L6's own guard
    // says so and names this wave as the fix. (b) W15's title probability had drifted to 8.8%
    // against the shipped 15-35% target, un-noticed, because the last time anyone ran this bench the
    // W family was three rungs: W2-LADDER's 25 extra draws a season give the LIVE cohort real W
    // points, LIVE girls rise in the merged table, and every pro they pass is pushed DOWN into the
    // W15 window — a stronger W15 field every season, by arithmetic nobody chose.
    //
    // THE SHAPE THAT FIXES BOTH: the windows stop being nested prefixes ([0, x] with x shrinking)
    // and become a SLIDING BAND that walks up the table as the rung gets harder. Floors AND ceilings
    // both step down at every rung, so the chain still tightens at both ends, but a rung now has a
    // TOP as well as a bottom: a W75 no longer reaches the head of the world, because in the real
    // sport it does not. That is what makes six rungs six different fields.
    //
    // MEASURED, the shipped set (16 worlds × up to 400 events a rung, fourth storey live,
    // exclusivity on — tools/field-quality.ts, the run that shipped this table):
    //
    //     rung     band              field core   P(title)   candidates (min/mean)
    //     w15      [0.22,  0.72]        48.5        19.8%        226 / 273
    //     w35      [0.185, 0.62]        50.4        13.1%        202 / 237
    //     w50      [0.145, 0.52]        55.1         2.3%        177 / 204
    //     w75      [0.105, 0.42]        60.0         0.0%        139 / 162
    //     w100     [0.065, 0.33]        65.9         0.0%        124 / 137
    //     wta125   [0.025, 0.26]        70.7         0.0%        119 / 125
    //
    // ⚠ THE FLOORS ARE LOWER THAN THE FIRST SHIPPED SET (w15 0.35 -> 0.22 and so on up), and the
    // reason is the POINTS LIFT in fieldPros.ts rather than a second opinion about the fields. When
    // every derived pro holds three-figure points, the LIVE cohort's rows sink beneath all 364 of
    // them, so the same percentile now lands on a DIFFERENT person: the table's top 65% is
    // professionals and its tail is the junior cohort. The bands were re-swept against that table
    // (w15 floor: 0.20 -> 16.0% · 0.24 -> 25.7% · 0.28 -> 34.0% · 0.32 -> 33.0%), which is why 0.22
    // and not 0.35 is what holds the W15 title rate where it belongs.
    //
    // Strictly monotone in field strength, W15 at 19.8% (the shipped calibration read 20.5%),
    // and every window still holds four draws' worth of candidates at its NARROWEST week — the
    // out-of-band share is 0.0% on every rung, i.e. no draw is being quietly made of backfill (the
    // failure W100's own note records). W15's floor sweep, the same run, is the evidence the 0.35 is
    // not a taste — see the floor sweep in the table note above.
    //
    // ⚠ AND `enterPct` DELIBERATELY DID NOT MOVE WITH THEM. The old sentence "she is accepted if she
    // would be inside the field they draw from" (the w35 note below) cannot survive a window with a
    // FLOOR: read literally it would now refuse a player for being too STRONG, which is not what an
    // acceptance list is. The acceptance chain is W2-LADDER's, measured on its own terms, and it
    // stays exactly where that wave left it.
    entrantPctBand: [0.22, 0.72],
  },
  w35: {
    id: 'w35',
    track: 'wta',
    label: 'World Tour 35',
    drawSize: 32,
    entryFeeCents: 400_00,
    travelCostCents: [1300_00, 2800_00],
    points: [20, 13, 8, 4, 2, 0],
    // $5,000 / $2,900 / $1,700 / $1,000 / $550 / $290.
    prizeCents: [5000_00, 2900_00, 1700_00, 1000_00, 550_00, 290_00],
    everyNWeeks: 3,
    minAgeYears: 16,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // ⚠⚠ THE ACCEPTANCE LIST IS AN ABSOLUTE RANK NOW, NOT A SHARE (W2-FIELD2). Read this note once;
    // the four rungs above it refer back here.
    //
    // WHAT BROKE. `enterPct` was a share of the merged W table, and that was the right unit while
    // the table was a compressed artefact in which "the better half" meant "a decent player". This
    // wave gave the table the REAL points-to-rank curve, so a share began biting in real ranks:
    // W35's 0.5 resolved to 282nd place = ~219 W points on a probe career, while a PERFECT best-16
    // window of nothing but W15 TITLES caps at 160. The second rung of the ladder was unreachable
    // from the first. Measured on this branch before the fix, not argued.
    //
    // WHAT REPLACES IT: the real tour's own acceptance ranges. An entry list is a rank cut, and it
    // is the same cut whether 500 or 5,000 players exist - it was never a share of anything.
    //
    //     rung        real acceptance range (women's ITF/WTA)     our cut = the range's FLOOR
    //     W15         ~#400-1000+, unranked players get in        none - it is the on-ramp
    //     W35         ~#250-700                                   700
    //     W50         ~#200-550                                   550
    //     W75         ~#150-450                                   450
    //     W100        ~#120-350                                   350
    //     WTA 125     ~#80-250, plus wildcards                    250
    //
    // ⚠ THE LOWER CUTS ARE NO-OPS BY CONSTRUCTION, AND THAT IS THE FINDING RATHER THAN A SHORTCUT.
    // The merged table is 564 rows deep; a real W35's list reaches #700, i.e. BELOW our whole
    // table. So W35 and W50 admit anybody the table holds - which is exactly what the real rungs
    // do, and it is why «she must always have tennis» survives an honest curve. The cuts that
    // actually bite are W100 and WTA 125; W75's 450 sits just above the point-less tie block, so it
    // opens on her first professional result. See TierDef.acceptsRank for why an absolute number is
    // the SAFE unit against this table and a share is the bomb.
    //
    // ⚠ AND THE `enterPct === entrantPctBand[1]` IDENTITY IS FULLY RETIRED, not merely bent: the
    // window has a floor now (it would refuse a player for being too STRONG) and the cut is in a
    // different unit from the window. Two questions, two answers, stated separately.
    acceptsRank: 700,
    // W2-FIELD2, measured - the family table is on w15 above. One rung up from the entry rung, so
    // one step up the table: field core 50.3 against W15's 48.1, 206 candidates at the narrowest.
    entrantPctBand: [0.185, 0.62],
  },
  w50: {
    id: 'w50',
    track: 'wta',
    label: 'World Tour 50',
    drawSize: 32,
    entryFeeCents: 450_00,
    travelCostCents: [1500_00, 3100_00],
    // The real 2026 chart's own row (research §4) - see the family note above for why these are not
    // the spec's design values. The last element is the chart's nominal 1: W50 is the first rung
    // where a first-round loser leaves with a point, and the first where the flat 8.3x title/one-win
    // ratio replaces the entry rungs' steepness.
    points: [50, 33, 20, 11, 6, 1],
    // $6,000 / $3,500 / $2,000 / $1,200 / $650 / $350 - the real $40k purse at the shipped three's
    // ~15% champion's fraction and ~0.575x per finish step (see the cheque note above for why not
    // the spec's $7.5k). Real 2026 W50 champion's cheque: ~$6,086.
    prizeCents: [6000_00, 3500_00, 2000_00, 1200_00, 650_00, 350_00],
    // The family's cadence descends up the ladder: 2 / 3 / 4 / 6 / 13 / 13 for W15..125 (spec §2).
    // 13 a season - denser than a National, sparser than a W35: the first rung she plans MONTHS
    // around rather than weeks.
    everyNWeeks: 4,
    // Same doorway age as W15/W35: the AER's 16-year-old allowance (12 pro entries) is what
    // actually meters her first season here, not the doorway itself.
    minAgeYears: 16,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // The acceptance chain tightens one step per rung: w35 0.5 -> w50 0.4 -> w75 0.3 -> w100 0.25
    // -> wta125 0.2. 0.4 is deliberately J300's cut one table down - the same "prestige rung has to
    // be enterable from below" argument, one family up.
    // The real acceptance range's FLOOR (~#200-550) - see the note on w35 for why an
    // absolute rank replaced the share, and what the share had made unreachable.
    acceptsRank: 550,
    // ⚠ RE-MEASURED BY W2-FIELD2 — [0.02, 0.40] -> [0.145, 0.52]. W2-LADDER's own reading (the
    // deepest window in the family, floor 0.02 so "the merged table's head must be REACHABLE here
    // without being resident") was the right instinct against a table whose head was one thirty-
    // strong storey; against the fourth storey a floor of 0.02 makes the world's top 11 residents of
    // a W50, which is exactly the inversion the family note on w15 measures. The dense middle rung
    // keeps the family's WIDEST window (0.42 of the table, 195 candidates at the narrowest week) -
    // that part of W2-LADDER's reading is untouched. Field core 55.1, P(title) 2.3%.
    entrantPctBand: [0.145, 0.52],
  },
  w75: {
    id: 'w75',
    track: 'wta',
    label: 'World Tour 75',
    drawSize: 32,
    entryFeeCents: 500_00,
    travelCostCents: [1700_00, 3400_00],
    // Real 2026 chart row (research §4); nominal 1 for the opening-round loser, as at every rung
    // from W50 up.
    points: [75, 49, 29, 16, 9, 1],
    // $9,000 / $5,200 / $3,000 / $1,750 / $1,000 / $550 - the real $60k purse (NOT the press-release
    // $70k, research §7c) at the family's fractions. Real 2026 W75 champion's cheque: ~$9,133.
    prizeCents: [9000_00, 5200_00, 3000_00, 1750_00, 1000_00, 550_00],
    everyNWeeks: 6,
    // 17, one year past W50's door (spec §2: minAge 16/17/17): the rung pairs with W100 as the
    // half of the family a sixteen-year-old can SEE but not enter, which is what makes her first
    // seventeen-year-old season a widening rather than a repeat.
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // The real acceptance range's FLOOR (~#150-450) - see the note on w35 for why an
    // absolute rank replaced the share, and what the share had made unreachable.
    acceptsRank: 450,
    // ⚠ RE-MEASURED BY W2-FIELD2 — [0, 0.35] -> [0.105, 0.42]. This is one of the three rungs whose
    // fields were IDENTICAL before the fourth storey (w75/w100/wta125 all measured field core 59.7,
    // median entrant 33/499): a shared floor of 0 plus position-biased entry meant all three drew
    // the same head. The floor is what separates them now. W75's slice is the elite storey and the
    // contenders' top - the players a first-year top-200 professional actually meets - and the world
    // top-70 are above its window rather than merely unlikely in it. Field core 60.0, P(title) 0.0%,
    // 139 candidates at the narrowest week.
    entrantPctBand: [0.105, 0.42],
  },
  w100: {
    id: 'w100',
    track: 'wta',
    label: 'World Tour 100',
    drawSize: 32,
    entryFeeCents: 600_00,
    travelCostCents: [1900_00, 3800_00],
    points: [100, 65, 40, 25, 12, 0],
    // $14,500 / $8,500 / $5,000 / $2,900 / $1,650 / $900.
    prizeCents: [14500_00, 8500_00, 5000_00, 2900_00, 1650_00, 900_00],
    // Rare and planned around, the way j300 is: four a year.
    everyNWeeks: 13,
    minGapWeeks: 2,
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // The real acceptance range's FLOOR (~#120-350) - see the note on w35 for why an
    // absolute rank replaced the share, and what the share had made unreachable.
    acceptsRank: 350,
    // ⚠ [0, 0.30], RE-MEASURED BY W2-LADDER'S BAND PROBE - the third measurement this band has
    // carried, each against the world of its day. The original 0.55 was measured against the
    // PRE-FIELD world (199 juniors, ~80 of them 17+): its table read 14 candidates at [0, 0.25]
    // and 36 at [0, 0.55], so 0.55 was the narrowest window that cleared the draw with margin, and
    // anything tighter put the backfill in charge (the L6 guard caught a "prestige" draw at 0.256
    // against a 0.25 window). The field-pro population (living-field phase W, 300 pros aged 16-30)
    // made that scarcity historical, and the two rungs W2-LADDER lands AROUND this one forced the
    // re-measurement: with W75 at [0, 0.35] a 0.55-wide W100 window would have drawn a visibly
    // SOFTER field one rung up, inverting the family exactly where it must not invert (the L6
    // monotonicity guard). tools/band-probe.ts, 5 careers x 312 weeks sampled every 13th week,
    // age-17 gate applied, against a draw of 32:
    //
    //   [0, 0.20] -> 88   [0, 0.25] -> 110   [0, 0.30] -> 133 (min; mean 145)   <- shipped
    //   [0, 0.40] -> 170  [0, 0.55] -> 232
    //
    // 0.30 clears the draw four times over at the worst week measured, sits strictly between
    // W75's 0.35 and the 125's 0.25, and hands W2-FIELD2's recalibration a family whose windows
    // already tighten monotonically. The ACCEPTANCE cut the kid faces (`enterPct: 0.25`) is
    // untouched.
    //
    // ⚠ AND W2-FIELD2 IS THAT RECALIBRATION — the FOURTH measurement this band has carried:
    // [0, 0.30] -> [0.065, 0.33]. The note above is right that 0.30 tightened monotonically at the
    // CEILING; what it could not fix was the FLOOR, shared at 0 with the two rungs either side, and
    // that is what made w75/w100/wta125 one field wearing three labels (all three measured field
    // core 59.7, median entrant 33/499). With the fourth storey resident at the head, a floor of
    // 0.065 puts the world top-37 above this window and leaves W100 the elite storey - measured
    // field core 65.9 against W75's 60.0 and the 125's 70.7, 124 candidates at the narrowest week,
    // 0.0% of the draw from outside the band. The ceiling widens 0.30 -> 0.39 to keep the window's
    // DEPTH while its floor rises: a window that only slid up would have starved.
    entrantPctBand: [0.065, 0.33],
  },
  wta125: {
    id: 'wta125',
    track: 'wta',
    label: 'WTA 125',
    drawSize: 32,
    entryFeeCents: 700_00,
    travelCostCents: [2100_00, 4200_00],
    // The real 2026 chart row (research §4): 125/81/49/27/15/1 - NOT the spec table's 29/16/8 tail,
    // which was a design guess the research overrules (see the family note above). The name is the
    // winner's points, here as at every rung of both real tours.
    points: [125, 81, 49, 27, 15, 1],
    // $20,000 / $11,500 / $6,700 / $3,900 / $2,250 / $1,300 - the spec's design cheque kept (the
    // research is silent on 125 money; $20k = ~15% of a ~$130k purse, the top of the real 125
    // range), stepped down at the family's ~0.575x per finish.
    prizeCents: [20000_00, 11500_00, 6700_00, 3900_00, 2250_00, 1300_00],
    // Rare like W100 (spec §2: "125 rare like W100"): four a year, planned around, never adjacent.
    everyNWeeks: 13,
    minGapWeeks: 2,
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // The top of the acceptance chain: 0.2, tighter than W100's 0.25 (spec §2 "tune 125 tighter").
    // On a fresh ~500-row merged table that is "takes the top 100" - the hardest cut in the game,
    // as the top rung's should be.
    // The real acceptance range's FLOOR (~#80-250, plus wildcards) - see the note on w35 for why an
    // absolute rank replaced the share, and what the share had made unreachable.
    acceptsRank: 250,
    // MEASURED, the W100 way - the probe is tools/band-probe.ts (one run, all four upper rungs),
    // candidates left inside the window at its NARROWEST week over 5 careers x 6 seasons sampled
    // every 13th week, age gate applied, against the merged ~500-row universe and a draw of 32:
    //
    //   band        w50(16+)  w75/w100/wta125(17+)
    //   [0, 0.15]      74        65
    //   [0, 0.20]      99        88
    //   [0, 0.25]     124       110
    //   [0, 0.30]     149       133
    //   [0, 0.40]     199       170
    //
    // Every window above clears the draw three times over - the field-pro population (300 pros,
    // all 16+ by construction) is what makes the W windows deep where the pre-field W100 needed
    // 0.55 for a margin of four. [0, 0.25] is picked for the 125 anyway, NOT the minimum that
    // fills: a prestige window that merely fills is a field that never varies (the J300 lesson,
    // one table up), and 110 candidates for 32 chairs keeps the position-biased draw a real draw.
    // The chain w35 [0.08, 0.50] / w50 [0.02, 0.40] / w75 [0, 0.35] / w100 [0, 0.30] / wta125
    // [0, 0.25] tightens at BOTH ends at every step, which is what keeps the L6 guard's family
    // monotonicity true with six rungs: shipped-band minima 190 / 150 / 133 / 110.
    //
    // ⚠ AND THE CHAIN ABOVE IS HISTORICAL SINCE W2-FIELD2 — [0, 0.25] -> [0.025, 0.26]. The measured
    // fact the chain could not see: floors of 0 on three consecutive rungs made three identical
    // fields, so "tightens at both ends" was true of the numbers and false of the tennis. The new
    // chain slides instead of nesting (w15 [0.22, 0.72] · w35 [0.185, 0.62] · w50 [0.145, 0.52] ·
    // w75 [0.105, 0.42] · w100 [0.065, 0.33] · wta125 [0.025, 0.26] — both ends still step down at
    // every rung) and the 125's field finally IS the top of the world: measured field core 70.7
    // against W100's 65.9, median entrant #32 of 564, 119 candidates at the narrowest week.
    //
    // THE FLOOR IS 0.025, NOT 0. The very top of the merged table — the two or three names on 9,000+
    // points — plays a tour this game does not simulate yet (act 3's 250/500/1000/Slams); a WTA 125
    // whose top seed is the world #1 would be as wrong as a W100 whose top seed is. 0.025 of 564 is
    // the top ~14 rows, which is what a 125's entry list actually excludes.
    entrantPctBand: [0.025, 0.26],
  },
}

/** DOES THIS RUNG HAVE AN ACCEPTANCE LIST AT ALL? One predicate, because the answer now lives in
 *  TWO fields – `enterPct` (a share, the ITF and domestic rungs) and `acceptsRank` (an absolute
 *  rank, the W rungs) – and "no list" is the ON-RAMP's defining property: the bottom rung of a
 *  table cannot gate on a ranking in a table she has never played in, so it reads the table below
 *  instead. Written once so a third unit could never make `onRampTierOf` quietly pick a new rung. */
export function hasAcceptanceList(tier: TierId): boolean {
  return TIERS[tier].enterPct !== undefined || TIERS[tier].acceptsRank !== undefined
}

/** The catalogue in ladder order, weakest rung first. The single source of truth for "is tier A
 *  above tier B" – used for scheduling precedence, the tier guide, the Home season strip and
 *  every monotonicity check in the tests.
 *
 *  ⚠ ONE ORDER OVER THREE TABLES, and it is a STRENGTH order, not a points order. The adult rungs
 *  go on the end because that is what "above" means everywhere this list is read – a W15 draw is a
 *  harder week than a J300 draw, it costs more to reach, and the scheduler must pick its weeks
 *  before the dense junior ones bend around them. It emphatically does NOT mean a W15 title is
 *  worth more POINTS than a J300 title: it is worth 10 against 300, in a different currency, and
 *  the two are never added (see LadderTrack in season/types.ts). Reading this list as a points
 *  ranking is the exact error the third table exists to make unrepresentable. */
export const TIER_LADDER: readonly TierId[] = [
  'local', 'regional', 'national',
  'j30', 'j60', 'j300',
  'w15', 'w35', 'w50', 'w75', 'w100', 'wta125',
]

/** Short tier names for width-starved surfaces (the next-week button, the Home season strip) and
 *  for the diary's own voice ("Still tired from the J30 trip"). MOVED here from
 *  composables/weekAhead.ts (Diary-1): the engine's copy system became a second consumer on the
 *  far side of the engine/UI line, and two spellings of a tier's short name is exactly the drift
 *  the one-table rule exists to prevent. weekAhead re-exports it, so UI imports are untouched. */
export const TIER_SHORT: Record<TierId, string> = {
  local: 'Local',
  regional: 'Regional',
  national: 'National',
  j30: 'J30',
  j60: 'J60',
  j300: 'J300',
  // The adult rungs keep the tour's OWN shorthand, which is what everybody in the sport calls them:
  // a W15 is a W15 on the entry list, in the draw sheet and in the conversation about it. It also
  // reads next to J30/J60 as a different family at a glance, which is the whole job of this table
  // on a width-starved surface – one letter apart, one table apart.
  w15: 'W15',
  w35: 'W35',
  w50: 'W50',
  w75: 'W75',
  w100: 'W100',
  // The tour's own shorthand too: everybody in the sport calls these "125s", but a bare number on a
  // width-starved surface reads as a value, not a name - so the short form keeps the tour prefix,
  // which is also how the WTA's own calendar prints it.
  wta125: 'WTA 125',
}

/** Pure age gate for a tier: the junior tour is 13-18, the domestic ladder has no gate at all, the
 *  adult rungs open at 16/16/17 and never close. No world/RNG dependency.
 *
 *  ⚠ IT LIVES HERE, NEXT TO THE TABLE IT READS, BECAUSE THE COHORT NEEDS IT TOO (task #17). It was
 *  world.ts's `isTierAgeOpen` and only ever asked about the KID – which was harmless while every
 *  rung on the calendar opened at 13, and stopped being harmless the moment three rungs opened at
 *  16+. `season/tournament.ts` cannot import world.ts (cycle), so the choice was one predicate here
 *  or a second copy of `minAge === undefined || age >= minAge` on the AI side, and a second copy of
 *  an age rule is precisely how "junior" became a label on a tier rather than a rule about people
 *  (docs/specs/adult-tour-and-endings.md §1). world.ts re-exports it under its historical name, so
 *  every existing call site and test import is untouched.
 *
 *  ⚠ BOTH HALVES LIVE IN THIS ONE EXPRESSION, AND THAT IS THE WHOLE IMPLEMENTATION OF §4.1. The
 *  ceiling needed no new code path anywhere: `selectEntrants` already filters its universe through
 *  this predicate to honour the minimum, so widening the predicate gave the AI side the maximum for
 *  free, and the kid's gate in world.ts reads the same function. One predicate, one rule, both
 *  populations - which is precisely the property whose ABSENCE was the §1 bug. Had the two halves
 *  been written in two places, "juniors" would have been true of the kid and false of the field, or
 *  the reverse, and nobody would have noticed for a release. */
export function isTierAgeOpen(tier: TierId, ageYears: number): boolean {
  const { minAgeYears: minAge, maxAgeYears: maxAge } = TIERS[tier]
  if (minAge !== undefined && ageYears < minAge) return false
  if (maxAge !== undefined && ageYears > maxAge) return false
  return true
}

/** WHY a tier is shut to somebody this age – `'young'`, `'old'`, or null when it is open. Exists so
 *  the two surfaces that must EXPLAIN the refusal (availabilityStatus' detail line and the planner's
 *  locked plaque) do not each re-derive it and drift into telling a nineteen-year-old that the
 *  Junior Tour "opens at 13". Deliberately separate from `isTierAgeOpen`: every gate that only needs
 *  a yes/no keeps reading the boolean, so no call site is forced to care which end it failed. */
export function tierAgeBlock(tier: TierId, ageYears: number): 'young' | 'old' | null {
  const { minAgeYears: minAge, maxAgeYears: maxAge } = TIERS[tier]
  if (minAge !== undefined && ageYears < minAge) return 'young'
  if (maxAge !== undefined && ageYears > maxAge) return 'old'
  return null
}

// Tier ids ordered by DESCENDING label length – the scan order tierFromLabel needs. "Junior Tour
// 30" is a prefix of "Junior Tour 300", so a first-match scan would report every J300 result as a
// J30 one. Derived, not hand-written, so a future label can never silently reintroduce the bug.
const TIER_IDS_BY_LABEL_LENGTH: readonly TierId[] = [...TIER_LADDER].sort(
  (a, b) => TIERS[b].label.length - TIERS[a].label.length,
)

/** The tier a tournament-summary line belongs to. Summaries read `${TIERS[tier].label} (…)`, so
 *  this is a longest-label-first prefix match. Used by the v10 save migration (rebuilding
 *  bestFinishByTier from historical events) and by the avatar-emotion title lookup – ONE
 *  implementation, so the prefix hazard is handled in exactly one place. */
export function tierFromLabel(text: string): TierId | undefined {
  return TIER_IDS_BY_LABEL_LENGTH.find((t) => text.startsWith(TIERS[t].label))
}

// --- off-season (Round 5 items 16/21) ----------------------------------------
// Every season year (52 absolute weeks, year = floor(week / 52)) ends with 3 dead
// weeks that never carry an event – the real-world Nov/Dec break: school, family,
// no travel. Tied to the absolute week number (not to whatever span buildSeason
// happens to be called with) so it lines up with world.ts's year-boundary logic
// regardless of chunking.
export const WEEKS_PER_YEAR = 52
export const OFF_SEASON_WEEKS = 3

/** True for the last `OFF_SEASON_WEEKS` weeks of a season year (e.g. weeks 49-51 of
 *  year 0: Dec 15 - Jan 4 against the Round-5 real-dates epoch). */
export function isOffSeasonWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return offset >= WEEKS_PER_YEAR - OFF_SEASON_WEEKS
}

/** True for a school-exam blackout week – the season-week offset falls inside one of
 *  ECONOMY.availability.examWeeks. Exported so the planner UI can label the calendar row
 *  honestly ("School exams") instead of calling it a training week.
 *  (Lives here, with its off-season sibling, since the rival-life slice: a week's TYPE is a
 *  property of the calendar, and the cohort's condition accrual has to read it without
 *  importing world.ts. world.ts re-exports both under their historical names.) */
export function isExamWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return ECONOMY.availability.examWeeks.some(([lo, hi]) => offset >= lo && offset <= hi)
}

/** A "blackout" week for tournaments: the off-season tail (already event-free) or a school-exam
 *  block. Used by the condition accumulators (extra recovery, for the kid AND the cohort) and by
 *  the availability gate. */
export function isBlackoutWeek(week: number): boolean {
  return isOffSeasonWeek(week) || isExamWeek(week)
}

// --- SEASON STRUCTURE BY SURFACE (owner approved 26.07: "звучит круто") ---------------------
//
// The surface used to be drawn per event off a FLAT mix (hard .50 / clay .35 / grass .15), which
// made the calendar's surface column noise: it told the player nothing, and it taxed a serve-first
// build blindly – she met grass 15% of the time whatever she planned. The real tour has BLOCKS, and
// blocks are what turn the column into information: the calendar now says WHEN her surface arrives,
// so "wait six weeks and enter three grass events" becomes a real season plan.
//
// A block is a pure function of the SEASON WEEK (`week % WEEKS_PER_YEAR`), so it repeats every year
// and a tier's event on week W simply takes that block's surface distribution. Real-tour shape,
// against the round-5 date epoch (career week 0 = Mon Jan 6):
//
//   offset  0-9   Jan 6  – Mar 15   HARD   the Australian / indoor swing
//   offset 10-24  Mar 16 – Jun 28   CLAY   the European spring clay circuit
//   offset 25-30  Jun 29 – Aug 10   GRASS  the SHORT window (junior Wimbledon is the first week
//                                          of July) – 6 weeks of 49, deliberately scarce
//   offset 31-48  Aug 11 – Dec 14   HARD   the US + Asian autumn swing
//   offset 49-51  Dec 15 – Jan 4    off-season – already event-free (isOffSeasonWeek), carried as a
//                                   block only so the lookup is total
//
// NOT UNIFORM INSIDE A BLOCK. A stray hard event in the clay block is realistic and is what keeps
// the calendar from becoming a metronome, so each block is a WEIGHTED mix with a dominant surface
// rather than a single surface. The weights are cumulative in the order (hard, clay, grass) – the
// same order the old flat draw used, so the pre-block behaviour is exactly the special case
// `{ hard: .5, clay: .35, grass: .15 }` in every block.
//
// THE MIX IS PRESERVED, which is the point: the block widths and weights below were solved so the
// season-long mix stays ~hard .50 / clay .37 / grass .13 (measured over 60 seasons – see
// tests/season/calendar.test.ts). Grass stays a SHORT window; nobody's build gets re-tuned by a
// calendar change, and the surface-style balance the surface-style slice measured still holds.
//
// OWNER-TUNABLE: this table IS the knob. Widen the grass window, move the clay swing earlier, or
// flatten a block's weights back toward the old mix – all of it is data.
export interface SurfaceBlock {
  id: string
  /** player-facing name for the season planner's block strip (short dash only) */
  label: string
  /** inclusive season-week offset range, 0-based within the season year */
  from: number
  to: number
  /** surface probabilities, summing to 1; consumed cumulatively in (hard, clay, grass) order */
  weights: Record<Surface, number>
}

/** The dominant-surface weights the two HARD blocks share (they are the same phase of the tour). */
const HARD_BLOCK_WEIGHTS: Record<Surface, number> = { hard: 0.72, clay: 0.22, grass: 0.06 }

export const SURFACE_BLOCKS: readonly SurfaceBlock[] = [
  { id: 'hard-early', label: 'Hard-court swing', from: 0, to: 9, weights: HARD_BLOCK_WEIGHTS },
  { id: 'clay', label: 'Clay swing', from: 10, to: 24, weights: { hard: 0.19, clay: 0.78, grass: 0.03 } },
  { id: 'grass', label: 'Grass window', from: 25, to: 30, weights: { hard: 0.22, clay: 0.08, grass: 0.7 } },
  { id: 'hard-late', label: 'Summer hard swing', from: 31, to: 48, weights: HARD_BLOCK_WEIGHTS },
  { id: 'off-season', label: 'Off-season', from: 49, to: 51, weights: HARD_BLOCK_WEIGHTS },
]

/** Cumulative read order. Keeping it (hard, clay, grass) is what makes the old flat mix an exact
 *  special case of the weighted draw – one code path, no "legacy" branch. */
const SURFACE_ORDER: readonly Surface[] = ['hard', 'clay', 'grass']

/** The block a week belongs to. Pure, total (the table tiles the whole season year), and a function
 *  of the SEASON week only – so every year has the same shape and the UI can label a week without
 *  the engine handing it anything. */
export function surfaceBlockFor(week: number): SurfaceBlock {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return SURFACE_BLOCKS.find((b) => offset >= b.from && offset <= b.to) ?? SURFACE_BLOCKS[0]
}

/** A BLOCK'S IDENTITY IS THE SURFACE IT IS MOSTLY MADE OF – the one the player plans around.
 *
 *  ⚠ IT MOVED HERE FROM SeasonScreen.vue, and the move is the point: the calendar screen wants the
 *  same answer for the week grid's court colour that Season's phase strip prints as a block name, and
 *  the one-line reduce below is exactly the kind of line that gets typed twice and then drifts by an
 *  argument (`>=` versus `>` decides a two-way tie differently). It belongs next to `SURFACE_BLOCKS`
 *  anyway: the table is the knob, so "which surface is this block" is a fact about the table.
 *
 *  Ties break toward the surface that comes FIRST in the table's own key order, which is stable
 *  because the weights are literals in one place. No block in `SURFACE_BLOCKS` is tied today. */
export function dominantSurface(block: SurfaceBlock): Surface {
  return (Object.keys(block.weights) as Surface[]).reduce((a, x) =>
    block.weights[x] > block.weights[a] ? x : a,
  )
}

/** The surface for an event on `week`, given ONE already-drawn uniform in [0,1). Split out from the
 *  draw so it is testable without an Rng and so the caller owns the draw – which is what keeps the
 *  season sub-stream byte-identical (see pickSurface). */
export function surfaceForWeek(week: number, roll: number): Surface {
  const { weights } = surfaceBlockFor(week)
  let cum = 0
  for (const surface of SURFACE_ORDER) {
    cum += weights[surface]
    if (roll < cum) return surface
  }
  return SURFACE_ORDER[SURFACE_ORDER.length - 1]
}

/** ONE draw off the season sub-stream, in exactly the position the old flat `pickSurface` used it.
 *  That is deliberate and load-bearing: the very next draw is the event's base travel cost, so
 *  keeping the draw COUNT and ORDER identical means the whole economy side of the calendar
 *  (travel costs, and everything the econ bench reads off them) is byte-identical across this
 *  change. Only which SURFACE the roll maps to moved. */
function pickSurface(rng: Rng, week: number): Surface {
  return surfaceForWeek(week, rng())
}

// Claim the free SLOT nearest `target`, searching outward (forward first) within [0, slots-1].
// `claimed` is THIS TIER's own slots, so different tiers may share a week – see buildSeason – while
// a tier never runs two events in the same one.
//
// ⚠ IT COUNTS IN PLAYABLE SLOTS, NOT IN WEEKS, AND THAT IS THE FIX FOR THE TAIL DUMP (W2-WINDOW).
// It used to take a raw week span and carry a `reserved` set holding the off-season, so a target
// that landed in December was pushed OUT of it – always in the same direction, always onto the same
// two or three weeks, for every tier at once. Measured on the shipped build, one season: 2-5 events
// a week through the year and then 45:5 46:5 47:8 48:11, with W15/W35/W50/W75/W100/WTA 125 all
// ending on week 48. That is the owner's «3 W35 подряд на 47-48-49». The off-season is now removed
// from the axis BEFORE anything is placed (buildSeason builds the slot list), so there is nothing
// to be pushed out of and no direction to be pushed in.
//
// R12-6: `minGap` keeps a tier's events APART – a slot is only claimable if no event of the same
// tier sits within `minGap - 1` slots of it. Slots inside one season block are contiguous weeks
// (the off-season is the block's tail), so a slot distance IS a week distance and the knob keeps
// meaning exactly what its TierDef comment says.
//
// TOTAL BY CONSTRUCTION. If no slot satisfies the gap, the search RETRIES at gap 1 – a calendar
// that cannot honour the constraint must still be built (the old "no free week" throw stays as the
// genuine over-subscription case). Only the sparse rungs carry a gap today, with 4-6 events over 49
// playable weeks, so the retry is unreachable at the shipped numbers; it exists so that raising a
// cadence can never turn a tuning change into a crash.
function claimSlot(claimed: Set<number>, target: number, lo: number, hi: number, minGap = 1): number {
  const start = Math.min(Math.max(target, lo), hi)
  const free = (s: number, gap: number): boolean => {
    if (claimed.has(s)) return false
    for (let d = 1; d < gap; d++) if (claimed.has(s - d) || claimed.has(s + d)) return false
    return true
  }
  for (const gap of minGap > 1 ? [minGap, 1] : [1]) {
    for (let d = 0; d <= hi - lo; d++) {
      const up = start + d
      if (up <= hi && free(up, gap)) {
        claimed.add(up)
        return up
      }
      if (d > 0) {
        const down = start - d
        if (down >= lo && free(down, gap)) {
          claimed.add(down)
          return down
        }
      }
    }
  }
  throw new Error('buildSeason: no free slot in span (over-subscribed)')
}

/** HOW MANY EVENTS OF THIS TIER A SEASON HOLDS – its cadence measured against the PLAYABLE span,
 *  never against the calendar year.
 *
 *  ⚠ THIS IS HALF THE TAIL-DUMP FIX (W2-WINDOW), and the arithmetic is the whole bug. The count was
 *  `floor(weeks / everyNWeeks)` with `weeks` = 52 while only 49 weeks can carry an event, so every
 *  tier was told to fit 52 weeks of cadence into 49 – and the three events of overflow had nowhere
 *  to go but the last playable weeks, every tier compressing into the same ones. Counting against
 *  the playable span instead means a tier's cadence is a cadence: 25 W15s at "every 2 weeks" over 49
 *  playable weeks really is one a fortnight, where 26 over 49 was one every 1.88 and the remainder
 *  became a pile.
 *
 *  ROUND, NOT FLOOR, and that is deliberate: `floor(49/13)` is 3, and it would quietly cost the game
 *  a quarter of every rare rung – J300, W100 and WTA 125 are "four a year, so each one is an event
 *  the family plans a season around" (their own TierDef comments), and National's 4 + 2 = 6 is
 *  R9-20's own number. Rounding keeps all three, and keeps every dense rung within one event of the
 *  count it shipped with.
 *
 *  IT IS A CONSTANT OF THE TIER TABLE, not of the block: the first career block starts at week 3
 *  (MIN_FIRST_EVENT_WEEK) and therefore has three fewer slots, but a year-block is still a year-block
 *  whichever year it is, so the count does not shrink for it – the placement simply packs slightly
 *  tighter. */
export function seasonEventCount(tier: TierId): number {
  const cadence = TIERS[tier].everyNWeeks
  if (cadence === 0) return 0
  return Math.max(1, Math.round((WEEKS_PER_YEAR - OFF_SEASON_WEEKS) / cadence))
}

/** HOW FAR A SEEDED DRAW MAY MOVE AN EVENT off its evenly-spaced ideal, as a share of the tier's own
 *  cadence interval. 0 = the old fixed grid; 1 = anywhere inside the interval the event owns.
 *
 *  0.5 is the pick: half an interval of play is enough that two seeds deal visibly different weeks
 *  at every rung (a dense rung's event moves ±1 week, a rare rung's ±6), while the tier's OWN rhythm
 *  is still recognisable – a J300 stays roughly quarterly instead of clustering. It also leaves half
 *  the interval for `tierPhase` below to keep the deterministic interleave in, which is what stops
 *  equal-cadence rungs collapsing onto each other. */
const PLACEMENT_JITTER = 0.5

/** Phase offset for a tier – the DETERMINISTIC half of where its events sit, spread across the
 *  ladder so equal-cadence rungs (local/j30/w15, national/j300/w100/wta125) land in each other's
 *  gaps rather than on each other.
 *
 *  ⚠ IT IS BOUNDED INTO [JITTER/2, 1 - JITTER/2] NOW, AND THE OLD UNBOUNDED VERSION WAS THE OTHER
 *  HALF OF THE TAIL DUMP (W2-WINDOW). It read `0.5 + index / 12`, which is 1.42 for the top rung –
 *  more than a whole cadence – so the last WTA 125 of a season targeted week 57 of a 52-week span
 *  and every rung above the sixth targeted a week past the end. The clamp inside `claimWeek` then
 *  did what a clamp does: parked them all on the last playable week. Keeping the phase strictly
 *  inside one interval makes `(i + phase + jitter) * interval < slots` true by construction, so no
 *  event can ever be born outside the span it is placed in.
 *
 *  ⚠ AND THE W-ONLY-WEEK COST THE OLD NOTE RECORDED IS NOW A SEEDED ONE, not a fixed one. With
 *  twelve rungs the interleave used to leave 3-4 W-ONLY weeks in EVERY world (offsets 32/40/44
 *  carried professional events and nothing else – tools/boredom-guard.ts), because the phases were
 *  a fixed grid: the same three weeks, every seed, for ever. The jitter breaks that pattern per
 *  world, which retires the "co-phase the W rungs with their J mirrors" candidate fix as the answer
 *  to a defect that no longer has a fixed address. The guard still exits 1 if a stranded week
 *  appears, so the red stays loud. */
function tierPhase(tier: TierId): number {
  const half = PLACEMENT_JITTER / 2
  return half + (1 - PLACEMENT_JITTER) * (TIER_LADDER.indexOf(tier) / TIER_LADDER.length)
}

function makeEvent(
  seedStr: string,
  week: number,
  tier: TierId,
  rng: Rng,
  background: FamilyBackground,
): SeasonEvent {
  const surface = pickSurface(rng, week)
  const [lo, hi] = TIERS[tier].travelCostCents
  // Draw the base travel first (byte-identical MAIN-stream RNG – the pickInt call/sequence is
  // background-independent, so the calendar structure and the world's RNG identity hold). Then map a
  // per-trip factor out of the background's CORRIDOR using a PURPOSE-SCOPED sub-stream keyed by the
  // event (week+tier) – independent of both the main weekly stream and this season stream, so it is
  // identity-safe. Same roll across backgrounds → the same relative draw, only the corridor differs.
  // This one factored value is both what the UI shows (UpcomingEvent.travelCostCents) and what
  // enterEvent charges (chargeTravel), no divergence.
  const baseTravelCents = pickInt(rng, lo, hi)
  const [cLo, cHi] = ECONOMY.travelBgFactor[background]
  const roll = rngFromSeed(`${seedStr}:travelbg:${week}:${tier}`)()
  const travelCostCents = Math.round(baseTravelCents * (cLo + roll * (cHi - cLo)))
  const year = Math.floor(week / 52)
  return {
    id: `${year}-w${week}-${tier}`,
    week,
    tier,
    surface,
    travelCostCents,
    deadlineWeek: week - 2, // entries close at the END of week - 2
  }
}

// A career's very first season must never spawn an event whose entry deadline
// (`week − 2`) is already in the past at week 0 – that showed a fresh career the
// "Entries closed" state on week 1 (round-5 item 2). Floor the first block's earliest
// placement at week 3 so the soonest deadline is week 1. Only the first block is
// affected (`fromWeek === 0`); later year-blocks start at 52, 104, … already.
export const MIN_FIRST_EVENT_WEEK = 3

// buildSeason – deterministic season for [fromWeek, fromWeek + weeks). Tiers are placed
// strongest-first (wta125 → … → local) so the rare prestige weeks are chosen before the dense ones
// bend around them. Counts come from `seasonEventCount` (the cadence measured against the PLAYABLE
// span), plus each tier's optional `secondHalfBonus` inside the season's back half.
//
// ⚠ THE LAYOUT IS SEED-DEPENDENT SINCE W2-WINDOW, AND IT WAS NOT BEFORE. `buildSeason` took a seed
// and spent it on surfaces and travel costs only: the week/tier grid was a pure function of the tier
// table, so `buildSeason('seed-A', …)` and `buildSeason('seed-B', …)` produced a byte-identical
// calendar and every career in every world played the same season for ever. Placement now takes a
// bounded seeded jitter (see PLACEMENT_JITTER) off a PURPOSE-SCOPED SUB-STREAM –
// `rngFromSeed(`${seedStr}:calweek:${tier}`)`, re-derived at the call site, persisting nothing,
// never MAIN and never the season stream the surfaces and costs are drawn from. Same seed, same
// calendar; different seeds, different calendars.
//
// ⚠ AND IT DOES NOT TOUCH A CAREER'S PAST. Season blocks are PERSISTED (world.season, extended by
// `ensureSeason` a year-block at a time), so a save built under the old rule keeps every block it
// already holds and is dealt new ones under the new rule. Nothing migrates and nothing is rebuilt:
// an existing career's remaining weeks look exactly as they did, and its next season is the first
// one with the new shape. Verified in tests/season/calendar.test.ts ("an existing block is never
// re-dealt").
//
// ONE EVENT PER TIER PER WEEK, NOT ONE EVENT PER WEEK (ladder-up). The pre-J calendar carried 43
// events over 49 playable weeks and could keep a global one-per-week rule; the J family takes it
// to ~92, which no longer fits – and should not. The real tour runs many events the same week,
// and the owner's point is exactly that: "with J-tiers, empty weeks stop being boredom and become
// CHOICE – where to go, what it costs, what her body can take". Occupancy is therefore tracked
// PER TIER (each tier still gets a unique week, which is what keeps the `${year}-w${week}-${tier}`
// ids unique), while the off-season reservation stays global so no tier can schedule into it.
// The kid can still only play one of them: `enterEvent` refuses a second entry in the same week.
export function buildSeason(
  seedStr: string,
  fromWeek: number,
  weeks: number,
  background: FamilyBackground = 'middle',
): SeasonEvent[] {
  const rng = rngFromSeed(seedStr)
  const events: SeasonEvent[] = []
  // Floor the first career block so no event opens already-closed; the makeEvent draw
  // order is unchanged (only the claimed week shifts), so counts/surfaces/costs are stable.
  const lo = fromWeek === 0 ? MIN_FIRST_EVENT_WEEK : fromWeek
  const hi = fromWeek + weeks - 1

  // THE PLAYABLE AXIS. The off-season is taken out of the span BEFORE anything is placed (items
  // 16/21), so no event can land there and – the tail dump's actual cause – nothing has to be
  // pushed out of it. Slot index 0..slots.length-1 is the axis every placement below counts in.
  const slots: number[] = []
  for (let w = lo; w <= hi; w++) if (!isOffSeasonWeek(w)) slots.push(w)
  const span = slots.length
  if (span === 0) return events

  // Strongest tier first, so the scarce high-tier weeks are picked before the dense ones fill in.
  const order: TierId[] = [...TIER_LADDER].reverse()
  for (const tier of order) {
    const def = TIERS[tier]
    if (def.everyNWeeks === 0) continue
    // R12-6: the tier's OWN slots. The off-season no longer needs a set of its own – it is not on
    // this axis at all – so the min gap is measured against events and can only ever have been.
    const claimed = new Set<number>()
    const minGap = def.minGapWeeks ?? 1
    const phase = tierPhase(tier)
    // ONE SUB-STREAM PER TIER PER BLOCK, drawn in event order. Purpose-scoped (`:calweek:`), so it
    // is independent of the season stream below and of MAIN, and re-derived here rather than stored.
    const place = rngFromSeed(`${seedStr}:calweek:${tier}`)
    const count = seasonEventCount(tier)
    const interval = span / count
    // The i-th event owns the interval [i, i+1) of cadences; `phase` says where in it the rung
    // sits by construction and `place()` moves it by up to half an interval either way. Both stay
    // inside the interval, so the result is inside the span and the events stay in order.
    const jitter = () => phase + PLACEMENT_JITTER * (place() - 0.5)
    for (let i = 0; i < count; i++) {
      const target = Math.floor((i + jitter()) * interval)
      const slot = claimSlot(claimed, target, 0, span - 1, minGap)
      events.push(makeEvent(seedStr, slots[slot], tier, rng, background))
    }
    // R9-20: the extra events a tier gets in the season's SECOND half only (national densification).
    // These are the ones R12-6 is about: they are spread across the half by their own even
    // placement, so without the gap they could land right beside a base-cadence event – and
    // `claimed` now carries every base slot, so the gap is enforced against all of them.
    const bonus = def.secondHalfBonus ?? 0
    if (bonus > 0) {
      const halfFrom = Math.floor(span / 2)
      const halfSpan = span - halfFrom
      const bonusInterval = halfSpan / bonus
      for (let i = 0; i < bonus; i++) {
        const target = halfFrom + Math.floor((i + jitter()) * bonusInterval)
        const slot = claimSlot(claimed, target, halfFrom, span - 1, minGap)
        events.push(makeEvent(seedStr, slots[slot], tier, rng, background))
      }
    }
  }

  // Week-ascending; within a week, strongest tier first so the season list reads as a ladder.
  const rung = (t: TierId) => TIER_LADDER.indexOf(t)
  events.sort((a, b) => a.week - b.week || rung(b.tier) - rung(a.tier))
  return events
}
