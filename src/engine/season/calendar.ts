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
  // THE POINTS ARE THE WTA TABLE'S OWN: a W15 title is 15 points, a W35 title 35, a W100 title 100.
  // ⚠ AND THEY LOOK TINY BESIDE THE JUNIOR NUMBERS ON PURPOSE - a J300 title pays 300 and a W15 title
  // pays 15. That is not a scaling mistake, it is the whole point of the fork at 19: she arrives at
  // the adult tour with a junior ranking that buys her nothing, and starts again at the bottom of a
  // table where the numbers are smaller and mean more. The two columns are never added.
  //
  // ⚠⚠ W15 AND W35 WERE THE TWO RUNGS THAT DISAGREED WITH THE RULE THE OTHER EIGHT KEEP, AND THEY
  // WERE CORRECTED ON 05.08 (docs/specs/points-by-the-book-2026-08.md; owner: «с очками надо
  // разобраться точно совершенно ... надо сделать как в реальности»). We shipped 10 and 20 against
  // a real 15 and 35 - 67% and 57% of the figures the rungs are NAMED after, while every rung from
  // W50 up was already exact. The naming rule is the sport's own and it is the one thing both real
  // ladders share: the 2024 restructure renamed W25/W40/W60 to W35/W50/W75 explicitly "to align the
  // tournament naming with the points awarded to the Winner", so a tier called "World Tour 35" that
  // paid 20 was our own table contradicting our own research (ranking-points-by-tier.md §4).
  //
  // ⚠ AND THE WHOLE ROW MOVED, NOT ONLY THE TITLE, because the shipped rows below the winner were
  // the wrong winner's curve rescaled rather than the chart's. The 2026 chart's own rows, verbatim:
  // W15 = 15/10/6/3/1/0 and W35 = 35/23/14/8/4/0. Two shapes come back with them. (a) The title ÷
  // one-match-won ratio at W15 becomes the real 15.0x (it was 10.0x) - the entry rung is
  // winner-take-most in reality, and showing up is supposed to buy almost nothing. (b) The seam
  // W35 -> W50 falls from the compressed x2.5 the note below records to the real x1.43, which is the
  // one place this correction pays a debt that note explicitly booked.
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
    // The 2026 WTA chart's W15 row, exactly (research §4). Title ÷ one win = 15.0x, the steepest
    // rung either real ladder has.
    points: [15, 10, 6, 3, 1, 0],
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
    // The 2026 WTA chart's W35 row, exactly (research §4). ⚠ ITF Appendix K and the WTA Rulebook
    // disagree on the 48-draw W35 row (ITF 35/30/18/9/5/3); we take the WTA's, which are the
    // governing figures for WTA points and match every neighbouring tier's geometry - research §7b.
    points: [35, 23, 14, 8, 4, 0],
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
    // ⚠ 160 IS HISTORY; THE LIVE CEILING IS 270 (points-by-the-book, 05.08) - eighteen counted slots
    // at the rung's own 15 a title. The argument above is about the UNIT and stands unchanged.
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
    //
    // ⚠⚠ RE-DERIVED FROM THE ACCEPTANCE RANGE ON THE LINE ABOVE (population-1600, 05.08), AND IT IS
    // THE ONE BAND IN THE W FAMILY WHOSE TWO ENCODINGS ACTUALLY DISAGREED.
    // `ladder-pace-2026-08.md` §6C(1) pre-registered this exact repair: every rung carries the real
    // acceptance range beside its `acceptsRank`, `acceptsRank` is that range's floor, and the two are
    // encodings of ONE real-world fact – so a band that does not match its own range is a defect on
    // its own terms rather than a tuning preference.
    //
    // WHAT WENT WRONG, and it is the paragraph above being read at the wrong population. 0.025 was
    // chosen as "the top ~14 rows of 564". Against 1,799 rows the identical share excludes the top
    // **45** – and #45 is still inside `tourElite`, so a 125's field was drawn from the top of the
    // WORLD (measured field core 65.9 against W100's 49.7: a sixteen-point cliff between two
    // adjacent rungs). The range says a 125 draws ~#80–250. 80/1799 = **0.044**, 250/1799 = 0.139;
    // the upper bound is left at 0.26 because `selectEntrants` fills from the top and a wider tail
    // only buys candidate depth (`tools/band-probe.ts` is the receipt).
    //
    // ⚠ IT SOFTENS THE CLIFF AND DOES NOT REMOVE IT, AND THE REASON IS NOT IN THIS FILE. Our table's
    // top 94 rows hold 21 of its core points and the remaining 1,700 hold the rest, so a rung whose
    // field is drawn from the head will always be a step change. That is the exchange-rate defect
    // (`ladder-pace-2026-08.md` §3a: our #50 beats our #100 89.3% of the time against a real 58%),
    // it is measured on its own arm in docs/specs/population-1600-2026-08.md §3, and the arm was
    // reverted. The band is fixed here because the band was wrong; the cliff is reported there.
    entrantPctBand: [0.044, 0.26],
  },
  // --- act 3: the top of the ladder, and the year that has names in it (W3-ACT2) -----------------
  //
  // ⚠ WHY THESE EXIST, and it is a MEASUREMENT rather than a content wish (act2-pro-tour.md §11.3).
  // A perfect, unreachable season of everything W2-LADDER shipped - all four WTA 125s, all four
  // W100s and all eight W75s - is 1,500 points, which against the real points-to-rank curve the
  // owner chose is about world #45. That was the mathematical ceiling of the ladder, so «the top of
  // the world is legitimately out of her reach until act 3 exists» was a fact about arithmetic and
  // not a scheduling note. The same measurement from the other side: the terminal window
  // (W50+W75+W100+125) offers 28 events a season, so a player at the top of the ladder who plays
  // every second week gets ~11 - the ladder ran out of tennis. These four are the fix for both.
  //
  // ⚠ THE POINTS ARE THE RESEARCH DOC'S OWN ROWS, VERBATIM, AND THE RESEARCH CORRECTED THE SPEC
  // ONCE (docs/research/ranking-points-by-tier.md §4, 2026 WTA Official Rulebook VIII.A.5). The
  // spec table (act2-pro-tour.md §2) gives the WTA 500 row as 500/325/195/108/60/**30**; the
  // rulebook chart gives 500/325/195/108/60/**1**. The 30 is the spec author reading the chart's
  // DRAW-SIZE annotation - the research prints the row as "WTA 500 (30/28)" - as a points value.
  // §2's own ⚠ says the research wins every disagreement, so the last element here is 1, which is
  // also the shape every rung from W50 up already carries ("a nominal 1 point higher up").
  //
  // ⚠ AND THE RESEARCH TABLE IS NORMALISED TO 32 MAIN-DRAW ROWS - it says so on its own first line
  // ("32 main draw rows") - which is why all four rows below are exactly six numbers long and why
  // all four draws are 32. See `slam.drawSize` for the measured reason the big draws did not ship.
  //
  // ⚠ THE CHEQUES ARE THE SPEC'S DESIGN VALUES AND THE RESEARCH IS SILENT ON THEM. §7's data-quality
  // note is primary for POINTS above W100 and gives purses only up to W75 ($60k). So §2's ~$40k /
  // ~$140k / ~$500k / ~$3M champions' cheques are kept as designed, stepped down at the W family's
  // own ~0.575x per finish. They are the only numbers in this block that are not sourced, and they
  // are flagged rather than smoothed over.
  wta250: {
    id: 'wta250',
    track: 'wta',
    label: 'WTA 250',
    drawSize: 32,
    entryFeeCents: 800_00,
    travelCostCents: [2300_00, 4600_00],
    // Research §4 verbatim. The nominal 1 for a first-round loser, as at every rung from W50 up.
    points: [250, 163, 98, 54, 30, 1],
    // $40,000 / $23,000 / $13,200 / $7,600 / $4,400 / $2,500 - the spec's ~$40k title at the
    // family's ~0.575x step. ⚠ AND THE CLIFF REACHES THIS RUNG TOO, measured rather than assumed:
    // $2,500 for a first-round exit against a $3,100-5,400 trip is still a loss, so seven rungs of
    // professional tennis pay less for showing up than showing up costs. It is the WTA 500 above
    // that flips it ($8,500 against $3,400-5,900), and one rung later than the family's own name
    // change is the honest place for that to happen: the tour proper starts at 250, the money does
    // not start until 500. Pinned in tests/prize-money.test.ts, which is where the boundary lives.
    prizeCents: [40000_00, 23000_00, 13200_00, 7600_00, 4400_00, 2500_00],
    // NOT ANCHORED, deliberately: the 250 is the FILLER rung of the top window - the week she plays
    // when no named event is on - and the real calendar treats it the same way (~30 a year, scattered
    // wherever the big ones are not). Cadence 6 = 8 a season, twice the 125's four, which is the
    // real 250:125 supply ratio (~30:15) read at our scale.
    everyNWeeks: 6,
    // The family's top half opens at 17, as W75/W100/125 do. The doorway is not the gate here - the
    // acceptance list is (#200), and the AER's own allowance is unlimited from 18.
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // The real tour's acceptance range's FLOOR, the same unit and the same reading W2-FIELD2 gave
    // the six rungs below (see the note on w35): a WTA 250's entry list reaches to about #200.
    acceptsRank: 200,
    // ⚠ THE BAND IS MEASURED AGAINST TWO UNIVERSES OF VERY DIFFERENT SIZE, AND W3-ACT2 IS WHERE
    // THAT STOPPED BEING FREE. Read this note once; the three rungs above refer back to it.
    //
    // A `entrantPctBand` is a SHARE, and it is consumed by two callers with different populations:
    //   * the kid's shadow run and the Season card's preview draw from the MERGED table – LIVE
    //     cohort ∪ 364 derived field pros, ~563 rows. This is the tennis she actually meets.
    //   * the CANONICAL AI bracket draws from the LIVE COHORT ALONE, ~200 rows, because a derived
    //     pro must never write a persisted result row (living-field.md §8.3).
    // So one share resolves to two candidate counts a factor of ~2.8 apart, and at the top of the
    // ladder the smaller one runs out first. MEASURED, tools/big-draw-cost.ts, 3 worlds x 208 weeks:
    // the first-cut Slam band [0, 0.1] left 20 in-band candidates in the canonical universe against
    // a draw of 32, so 37.5% of a major was `selectEntrants` backfill from outside its own window –
    // the exact failure the L6 guard exists to catch, arriving through the population rather than
    // through the number.
    //
    // THE FIX IS THE FLOOR OF THE WIDTH, NOT A NEW RULE: every band below is wide enough that the
    // CANONICAL universe alone clears the draw with margin (44 / 42 / 39 / 37 against 32), and both
    // ends still step down at every rung, which is what keeps six rungs six fields. Read on the
    // merged table the same widths give 125 / 117 / 109 / 104 – and the Slam's 104 is, by arithmetic
    // nobody arranged, exactly the real majors' direct-acceptance depth.
    entrantPctBand: [0.018, 0.24],
  },
  wta500: {
    id: 'wta500',
    track: 'wta',
    label: 'WTA 500',
    drawSize: 32,
    entryFeeCents: 900_00,
    travelCostCents: [2500_00, 5000_00],
    // Research §4 verbatim - AND THE ROW THE SPEC GOT WRONG. See the family note above: the spec's
    // last element (30) is the chart's draw-size annotation "(30/28)" misread as points.
    points: [500, 325, 195, 108, 60, 1],
    // $140,000 / $80,000 / $46,000 / $26,500 / $15,000 / $8,500.
    prizeCents: [140000_00, 80000_00, 46000_00, 26500_00, 15000_00, 8500_00],
    // TEN A SEASON, ON NAMED WEEKS. Real: ~16. The count is what makes §6's mandatory SIX a choice
    // rather than a timetable - six of ten is a decision about which, six of six would not be.
    everyNWeeks: 0,
    anchorWeeks: [4, 10, 15, 19, 24, 28, 33, 39, 43, 47],
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // Real acceptance range's floor (~#40-120).
    acceptsRank: 120,
    // 42 candidates in the canonical universe, 117 in the merged one - see the note on wta250.
    entrantPctBand: [0.012, 0.22],
  },
  wta1000: {
    id: 'wta1000',
    track: 'wta',
    label: 'WTA 1000',
    drawSize: 32,
    entryFeeCents: 1000_00,
    travelCostCents: [2700_00, 5400_00],
    // Research §4 verbatim.
    points: [1000, 650, 390, 215, 120, 65],
    // $500,000 / $287,000 / $165,000 / $95,000 / $55,000 / $31,000. A first-round exit at a 1000
    // pays more than a WTA 125 title - which is the real cliff between the tours, not a rounding.
    prizeCents: [500000_00, 287000_00, 165000_00, 95000_00, 55000_00, 31000_00],
    // EIGHT A SEASON on named weeks (real: 10, scaled to a grid that also has to hold four Slams
    // and ten 500s). Placed AROUND the Slams: two in the opening hard swing, two in the clay one,
    // four across the long autumn hard block, none inside the grass window - which is the real
    // year's own shape, where the grass weeks belong to Wimbledon and its warm-ups alone.
    everyNWeeks: 0,
    anchorWeeks: [5, 8, 12, 18, 31, 37, 41, 45],
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // Real direct acceptance for a 1000 runs to roughly #65 (a 56-draw takes ~#50, a 96-draw ~#90).
    acceptsRank: 65,
    // 39 candidates in the canonical universe, 109 in the merged one - see the note on wta250.
    entrantPctBand: [0.006, 0.2],
  },
  slam: {
    id: 'slam',
    track: 'wta',
    label: 'Grand Slam',
    // ⚠⚠ 32, AND THE REAL DRAW IS 128. THE DEVIATION IS STATED HERE BECAUSE IT IS MEASURED, NOT
    // ASSUMED - tools/big-draw-cost.ts is the receipt and the wave report carries the numbers.
    //
    // The cost is NOT the wall clock (a 128-draw is 127 AI-AI matches against a 32-draw's 31, and
    // `fastMatchProbability` is a closed form). The cost is the POPULATION, and it is structural:
    //
    //   * the canonical bracket is LIVE-ONLY by design (`drawAiEntrants` draws from `world.cohort`,
    //     because a derived field pro must never write a persisted result row - living-field.md
    //     §8.3, and act2-pro-tour.md §8b names this as act-3 work in its own right);
    //   * the cohort is 199 players aged 13-19, of whom ~82 clear a W rung's 17+ age gate;
    //   * `selectEntrants` treats a draw it cannot fill as a crash rather than a compromise, so at
    //     drawSize 128 its escape ladder falls all the way through to `cohort` - and a Grand Slam
    //     would be played by 128 of the 199 CHILDREN in the world, thirteen-year-olds included.
    //     At 64 the age gate survives but the draw eats 64 of the ~82 eligible rivals in one week,
    //     and the week's other events are then made entirely of backfill (the exact failure the L6
    //     guard exists to catch).
    //
    // So the honest ship is a 32-draw Slam with the deviation loud, and the fix is the one
    // living-field §8.3 already names - field pros in the canonical brackets, which needs fp-safe
    // result rows and is its own wave. ⚠ IT ALSO MEANS THE POINTS ROW IS FULLY SOURCED rather than
    // half-derived: the research table is normalised to 32 main-draw rows, so 2000/1300/780/430/
    // 240/130 is exactly what the rulebook publishes and no R64/R128 value had to be invented.
    // A 128-draw Slam would have needed two rows the research does not print.
    //
    // =============================================================================================
    // ✅⚠ THE POPULATION OBJECTION IS ANSWERED (W3-FIELD3, 04.08) AND THE DRAW IS STILL 32.
    // =============================================================================================
    //
    // The wave above is done: the canonical W brackets draw from LIVE cohort ∪ 364 derived
    // professionals, and a pro leaves no persisted row (world.ts `runAiTournament`). Re-measured
    // with the same tool, 4 worlds x 260 weeks, both arms on one branch:
    //
    //     draw   of-age in world   in-band   out-of-band   under-age   youngest   ms   verdict
    //      32     110 -> 450        37 -> 99   0.0% ->  0.0%  0.0% -> 0.0%  17 -> 17  0.13->0.56  OK
    //      64     110 -> 450        37 -> 99  42.2% ->  0.0%  0.0% -> 0.0%  17 -> 17  0.24->0.74  OK
    //     128     110 -> 450        37 -> 99  71.1% -> 22.5% 14.6% -> 0.0%  13 -> 17  0.48->1.76  BROKEN->OK
    //
    // So the sentence this note was built on - "a Grand Slam would be played by children" - is no
    // longer true at any size, and the clock was never the constraint (1.76 ms for 127 matches).
    //
    // ⚠ THE SIZE IS DELIBERATELY NOT CHANGED HERE. It is an owner decision and the numbers are now
    // his to decide on, but two of them belong beside it. (a) At 128 the draw is still 22.5%
    // BACKFILL - this rung's own window [0, 0.185] is 104 rows of a 563-row table against 128
    // chairs - so a real 128 wants a wider top-rung window or the fifth storey living-field.md §8.2c
    // flags (FIELD.size near 520), and shipping 128 without one would trade "played by children" for
    // "a quarter of the Slam is people the rung does not admit". (b) At 64 the field is ENTIRELY
    // IN-BAND, which is the first honestly fillable big draw this game has ever had. (c) The points
    // row above is still normalised to 32 rows, so any size change needs the research's R64/R128
    // values, which it does not print.
    drawSize: 32,
    entryFeeCents: 0,
    // ⚠ SHE IS NOT CHARGED TO ENTER A SLAM. Real rule, and it is the one entry fee in the game that
    // is genuinely zero: the four majors do not levy one. Travel is still hers.
    travelCostCents: [3000_00, 6000_00],
    // Research §4 verbatim (2026 WTA Official Rulebook VIII.A.5).
    points: [2000, 1300, 780, 430, 240, 130],
    // $3,000,000 / $1,725,000 / $990,000 / $570,000 / $330,000 / $190,000. THE MONEY CLIFF, in one
    // row: losing the first round of a major pays more than winning every other tournament in this
    // game put together. That is not a balance failure - docs/research/02-tennis-economics.md is
    // about a sport in which the same week's work is worth $130 at one rung and $190,000 at another.
    prizeCents: [3000000_00, 1725000_00, 990000_00, 570000_00, 330000_00, 190000_00],
    // ⚠ THE FOUR NAMED WEEKS, and they are the whole reason `anchorWeeks` exists. Season-week
    // offsets against the round-5 date epoch (career week 0 = Mon Jan 6), mapped from the real
    // calendar onto our 52-week block, and each one lands in the surface block its real counterpart
    // is played on - which is what `makeEvent`'s dominant-surface rule then makes true of the event:
    //
    //     offset  2   mid-January     hard block (0-9)     the season opener
    //     offset 21   early June      clay block (10-24)   the clay major
    //     offset 26   early July      grass window (25-30) the grass major - the ONLY one there is
    //     offset 34   early September hard block (31-48)   the autumn major
    //
    // ⚠ OFFSET 2 IS NOT PLACEABLE IN A CAREER'S FIRST BLOCK (MIN_FIRST_EVENT_WEEK is 3, so no event
    // opens already-closed), so year 0 carries three majors and every year after it four. That is
    // left as it falls rather than nudged: a career that starts in the third week of January really
    // has missed the season opener, and at fourteen she was never going to be in it.
    everyNWeeks: 0,
    anchorWeeks: [2, 21, 26, 34],
    minAgeYears: 17,
    enterPointBand: [0, Number.MAX_SAFE_INTEGER],
    // ⚠ LOOSER THAN A 1000's, AND THAT IS REAL RATHER THAN A SLIP. A major's main draw is 128 and
    // its direct acceptance reaches about #104; a 1000 draws 56 or 96 and cuts at ~#50-90. The
    // biggest event on earth is the EASIEST of the top three to get into, because it has the most
    // chairs. Nothing reads this as a ceiling (the top four rungs never close - see TERMINAL_RUNGS),
    // so the non-monotone step cannot leak into the window.
    acceptsRank: 104,
    // The head of the merged table, at last. THE FLOOR IS 0 AND ONLY HERE: `wta125`'s own note says
    // why it kept 0.025 ("the two or three names on 9,000+ points play a tour this game does not
    // simulate yet") - this is that tour. The world #1 is resident in exactly one rung, and it is
    // this one. The ceiling reads 37 candidates in the canonical universe and 104 in the merged one,
    // and the second number is the one worth reading twice: a major's real direct-acceptance list is
    // the world's top 104. Nobody arranged that - the width came from the canonical draw's own floor
    // (see the note on wta250) - but it is the check this band would have wanted.
    entrantPctBand: [0, 0.185],
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
  // W3-ACT2. Sixteen rungs now, and the WINDOW's arithmetic moves with the list rather than with a
  // number anybody edited: `tierOutgrown` closes a rung when the rung THREE above it opens and the
  // top FOUR never close, so the terminal window slid from {w50, w75, w100, wta125} to
  // {wta250, wta500, wta1000, slam} by adding four names to this array and nothing else.
  'wta250', 'wta500', 'wta1000', 'slam',
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
  // The same rule one rung up, and the same reason: "250" alone is a number, "WTA 250" is a name.
  wta250: 'WTA 250',
  wta500: 'WTA 500',
  wta1000: 'WTA 1000',
  // ⚠ "Slam" AND NOT THE MAJOR'S NAME. Tournament names in this game are fictional (ITF/WTA/ATP and
  // the majors' own names are trademarks - see the Style rules), so the four anchored weeks are
  // four Grand Slams with no city on them. The short form is the category, which is also what a
  // width-starved surface wants: nobody needs to be told which one it is to know what it is.
  slam: 'Slam',
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

/** THE SUMMER HOLIDAYS, as season-week offsets (R15-8, owner 01.08: «2 месяца обычно после
 *  экзаменов»). The exam fortnight is season-weeks 23-24 (`ECONOMY.availability.examWeeks`), so the
 *  holidays open the week after the last paper and run nine weeks - about the two months he named -
 *  and are over well before the off-season block at 49.
 *
 *  ⚠ IT USED TO BE A DISPLAY FACT AND IT IS AN ENGINE FACT NOW (W3-SUMMER), which is why it moved
 *  here from `composables/weekDays.ts`. Its own note there said «nothing in the sim gates on summer
 *  (school itself is furniture the grid draws)», and that stopped being true the moment the owner
 *  ruled that summer is a real training block: «если мы летом сделаем реальную нагрузку с 2
 *  тренировками в день я не вижу ничего плохого, это как раз частично компенсирует недостаток
 *  тренерских недель в другие периоды». A week the engine develops and fatigues differently is a week
 *  the CALENDAR has to define, beside its exam and off-season siblings, for exactly the reason those
 *  two live here. `weekDays.ts` imports it back and re-exports it under its historical name, so every
 *  existing caller and test is untouched. */
export const SUMMER_WEEKS: readonly [number, number] = [25, 33]

/** Is this week inside the school summer holidays? Season-week arithmetic, total over any week. */
export function isSummerWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return offset >= SUMMER_WEEKS[0] && offset <= SUMMER_WEEKS[1]
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
  // ⚠ AN ANCHORED RUNG IS COUNTED BY ITS OWN LIST (W3-ACT2): its weeks are content, so "how many"
  // is "how many are named" and no cadence arithmetic applies. A career's FIRST block can still
  // hold fewer - MIN_FIRST_EVENT_WEEK floors placement at week 3, so an anchor on offset 0/1/2 has
  // nowhere to go in year 0 - which is a fact about that career and not a miscount here.
  const anchors = TIERS[tier].anchorWeeks
  if (anchors) return anchors.length
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
  // ⚠ THE ROLL IS ALWAYS SPENT, EVEN WHERE IT IS IGNORED (W3-ACT2). An anchored event takes its
  // block's DOMINANT surface rather than a weighted draw from it - a grass major that came out on
  // clay 8% of the time would be the same defect as one placed on a random week - but the draw
  // still happens, in exactly the position it always occupied, because the very next call is the
  // event's base travel cost. Skipping it would have shifted the whole season stream and re-dealt
  // every travel cost in the game. Same discipline as `weeksSinceGear` walking a price draw it
  // does not use.
  const rolled = pickSurface(rng, week)
  const surface = TIERS[tier].anchorWeeks ? dominantSurface(surfaceBlockFor(week)) : rolled
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
  // Season-week offset of an absolute week, the same arithmetic isOffSeasonWeek/isExamWeek use.
  const offsetOf = (w: number) => ((w % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR

  for (const tier of order) {
    const def = TIERS[tier]
    // ⚠ THE ANCHORED RUNGS ARE PLACED FIRST AND BY NAME (W3-ACT2). They come first in `order`
    // anyway (it is TIER_LADDER reversed and they are the top four), which matters: an anchor is
    // not negotiable, so it must claim its week before any cadence rung bends around it. There is
    // no `claimSlot` search, no phase and no jitter here - a named week that could be nudged is not
    // a named week. Two anchored rungs cannot collide because `claimed` is per tier and the four
    // lists are disjoint by construction (pinned in tests/season/calendar.test.ts).
    if (def.anchorWeeks) {
      for (const w of slots) {
        if (!def.anchorWeeks.includes(offsetOf(w))) continue
        events.push(makeEvent(seedStr, w, tier, rng, background))
      }
      continue
    }
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
