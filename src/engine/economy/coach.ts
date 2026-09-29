// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/coach.md#the-coach-block

import type { CoachTier, PlayStyle } from '../../shared/protocol'
import { WEEKS_IN_SEASON } from '../../shared/dates'

// THE COACH LADDER (docs/specs/coach-tiers.md; the model itself is engine/coach.ts) – REPLACES
// `expenseRangeCents` – the old two-band weekly draw (hired $250-700, parent $120-400). The
// bands become a per-tier PER-HOUR ladder, a ROSTER of named coaches is drawn off it, and the
// weekly bill is `coach rate x hours(plan) x wealthCorridor[background]`.
//
// ⚠ coach: THE CORRIDOR IS BACK ON COACHING (Round 2, owner 29.07), and the reason is his, not mine.
// owner (coach), 29.07: «для 8к все тиры [в их академии] стоят согласно их коридору, для 25к – свои цены»…
// → docs/notes/economy/coach.md#coach
export const coach = {
  // Inclusive upper bounds of the age-rate rows: 12-16 (development), 17-22 (pro), 23+ (peak and
  // after). His own caveat is why there are three and not four - 17-22 and 22-28 barely differ,
  // and 29+ holds level because past the peak the work becomes maintenance.
  ageBandUpper: [16, 22] as [number, number],

  // SESSIONS A WEEK, anchored on the three plan PRESETS. ⚠ 4 / 5 / 6, the owner's own numbers
  // (Round 2), replacing the 3/4/6 I anchored on his price table's "x4 h/wk" reference. An hour
  // is a session.
  // → docs/notes/economy/coach.md#coachsessionsbytrain
  sessionsByTrain: [
    [60, 4],
    [75, 5],
    [85, 6],
  ] as [number, number][],

  // THE OWNER'S PRICE RESEARCH (29.07), per hour, individual lessons, big-city rate, converted
  // straight across because per-hour is the unit he priced in. His midpoints, row by row: 12-16
  // Budget 30 · Middle 50 · High 80 · Elite 120 17-22 Budget 35 · Middle 60 · High 100 · Elite
  // 160 23+ Budget 40 · Middle 65 · High 120 · Elite 200
  //
  // ⚠ coach.hourlyRateCents: THESE ARE MIDDLE-CORRIDOR PRICES.
  // owner (coach.hourlyRateCents), 12.09: «единая элит-полка вверх - верно»
  // ⚠ coach.hourlyRateCents: `high` IS DELIBERATELY NOT HERE.
  // ⚠ coach.hourlyRateCents: ZERO RNG.
  // → docs/notes/economy/coach.md#coachhourlyratecents
  hourlyRateCents: {
    self: [[10_00, 30_00], [11_00, 33_00], [12_00, 36_00]],
    budget: [[24_00, 36_00], [28_00, 42_00], [32_00, 48_00]],
    middle: [[40_00, 60_00], [48_00, 72_00], [52_00, 78_00]],
    high: [[64_00, 96_00], [80_00, 120_00], [96_00, 144_00]],
    elite: [[120_00, 180_00], [160_00, 240_00], [200_00, 300_00]],
  } as Record<CoachTier, [number, number][]>,

  // ⭐⭐⭐ ROUND 42 #19 – THE RETAINER FOLLOWS HER RANK. Proposals; the predicted-vs-measured table
  // is docs/specs/elite-retainer-2026-09.md. – THE OWNER: «элитный стоит 830 в неделю, это 43к в
  // год… за такие деньги их не существует», and then the commission: «у нас есть исследование и
  // бенч, надо просто цифры проверить и актуализировать».
  //
  // ⚠⚠ coach.retainerBandByRank: THE WHOLE POINT OF A RANK GATE IS THAT IT CANNOT REACH THE MIDDLE.
  // ⚠ coach.retainerBandByRank: WHY HER RANK AND NOT HER EARNINGS, when 3.2's own complaint is denominated in money…
  // ⚠ coach.retainerBandByRank: THE BAND MULTIPLIES HIS LABOUR AND NEVER THE COURT (`bandedRateCents`).
  // ⚠ coach.retainerBandByRank: STEPS AND NOT A RAMP, deliberately.
  // ⚠ coach.retainerBandByRank: READ TOP-DOWN, FIRST MATCH WINS, so the rows stay ordered tightest-first.
  // → docs/notes/economy/coach.md#coachretainerbandbyrank
  retainerBandByRank: [
    // #1-10. Research: $150-250k/yr. At the elite rung this lands his labour at $172k (17-22) /
    // $225k (23+) a year, which brackets the research's own midpoint.
    { atOrBetter: 10, factor: 4.5 },
    // #11-100. Research: ≈$90k/yr. Lands at $76.5k (17-22) / $100k (23+) - the band around it.
    { atOrBetter: 100, factor: 2.0 },
  ] as { atOrBetter: number; factor: number }[],

  // ⭐⭐⭐ ROUND 42 #51 / ROUND 44 – THE ANNUAL ASK. docs/specs/the-coachs-raise-2026-09.md. – THE
  // OWNER NAMED THE CORRIDOR AND THE CEILING HIMSELF (16.09, #51): «Коридор 5-15%, ceiling = the
  // rank band». What he did NOT want is the trigger the first draft gave it: «может такое быть,
  // что всего с 1 титулом в сезон (например w250/w500) тренер будет требовать 15%? Кажется, что
  // самого факта такого единственного титула маловато, нужна какая-то общая оценка прогресса».
  //
  // ⚠ coach.raise: WHICH IS ALSO THE SAFETY PROPERTY, and it is worth stating as one because it is what makes a live-save migration…
  // ⚠ coach.raise: THE WEIGHTS ARE THE ONLY FITTED NUMBERS HERE
  // → docs/notes/economy/coach.md#coachraise
  raise: {
    /** A FLAT YEAR IS STILL 5%, NEVER NOTHING AND NEVER LESS. His floor, and the one place «he
     *  never asks for less» is enforced - the downward half of the old silent re-price is deleted
     *  rather than lettered. ⚠ It also sits exactly where the masseur's ceiling was argued to:
     *  `ECONOMY.masseur.raisePerYear` is 4% precisely so the second seat stays «не так интенсивно
     *  как тренер», and the two numbers must not be retuned past each other. */
    askFloor: 0.05,
    /** His ceiling on ONE ask. Reached only by a score of 1 - every component at full marks in the
     *  same year, which the bench measures as rare rather than assumes to be. */
    askCeiling: 0.15,
    /** ⭐ THE RANK COMPONENT'S REFERENCE: HALVING HER RANKING NUMBER IN A YEAR IS FULL MARKS.
     *  #400 -> #200 and #20 -> #10 score the same, which is the honest shape - a ranking ladder is
     *  multiplicative and a linear reading would hand a junior climbing out of the four hundreds
     *  the same credit as a top-tenner defending a title. Argued rather than fitted: there is no
     *  free parameter in «twice as good». */
    rankHalving: 2,
    /** The weights, summing to 1. ⭐ THE RESIDUAL IS THE HEAVIEST AND #51 SAYS WHY: «a coach who got
     *  more out of her than the odds said is exactly the one who should ask» - it is the only
     *  component that measures HER AGAINST EXPECTATION rather than against zero, so it cannot be
     *  earned by a big season that was always going to happen. ⚠ TITLES ARE THE LIGHTEST, which is
     *  his correction to the first draft made arithmetic: at 0.15 a single title cannot on its own
     *  take the ask past 6.5% of the corridor, so «одного титула маловато» is true of the shipped
     *  model and not merely of its prose. */
    weights: {
      /** her place in the professional table, against where it was when the fee was agreed */
      rank: 0.25,
      /** the share of her REMAINING HEADROOM she actually took - literally the coach's job */
      development: 0.25,
      /** what she won, weighted by the rung it was won on */
      titles: 0.15,
      /** ⭐ what she did against the odds ring's own expectation (wave F1's results channel) */
      residual: 0.35,
    } as Record<'rank' | 'development' | 'titles' | 'residual', number>,
  },

  // THE VENUE, BY THE RUNG THAT TRAINS THERE (docs/specs/court-follows-the-coach-2026-08.md).
  //
  // ⚠ coach.courtTierFactor: UNTIL 08.08 THE COURT TOOK NO RUNG ARGUMENT AT ALL
  // owner (coach.courtTierFactor), 08.08: «у нас есть корты за 22 доллара в час (кстати, теннисные стоят похожих денег) и за 44+»…
  // ⚠⚠ coach.courtTierFactor: AND THE OWNER RULED ON THE SHAPE THE SAME DAY
  // owner (coach.courtTierFactor): «Можно вообще стоимость корта по тиру к тиру тренера привязывать и всё.»
  // ⚠ coach.courtTierFactor: `budget` IS THE ONE CELL HIS RULE CANNOT REACH, and it is arithmetic rather than an oversight.
  // ⚠ coach.courtTierFactor: IT IS A PARTITION AND NOT A RE-PRICE.
  // ⚠ coach.courtTierFactor: THE THREE CHEAP RUNGS ARE 1.0 ON PURPOSE, and it is the one thing here that is NOT a compromise.
  // ⚠ coach.courtTierFactor: WHY `middle` IS 1.2 AND CANNOT BE MORE.
  // ⚠ coach.courtTierFactor: AND WHY `high` IS 1.9 RATHER THAN THE 2.0 HIS "$44 vs $22" IMPLIES
  // ⚠ coach.courtTierFactor: THE CORNER WHERE THE TWO AXES MEET, checked because it is the one cell two multipliers can turn into…
  // → docs/notes/economy/coach.md#coachcourttierfactor
  courtTierFactor: {
    self: 1.0,
    budget: 1.0,
    middle: 1.2,
    high: 1.9,
    elite: 2.4,
  } as Record<CoachTier, number>,

  // THE WEEK'S JITTER, in basis points, and the ONE main-stream draw the bill spends. A coach
  // has a rate; a WEEK still varies - a session moved, a court booked at a worse hour, an extra
  // half hour before a tournament. +/-8% keeps the bill recognisably his price while leaving the
  // Money screen something to show.
  //
  // ⚠ coach.weekJitterBps: THIS LINE USED TO END "and it is what preserves the frozen MAIN capture: exactly one pickInt…
  // ⚠ coach.weekJitterBps: WHICH LEAVES THE JITTER OWING A REASON OF ITS OWN
  // → docs/notes/economy/coach.md#coachweekjitterbps
  weekJitterBps: [9200, 10800] as [number, number],

  // THE ROSTER (Round 2). «примерно по 4 тренера на тир, по одному на стиль игры» - what makes
  // screen T a market rather than a menu: at one rung the parent chooses between a coach who
  // fits her game and one who does not, at roughly the same money.
  //
  // ⚠ coach.roster: THE OWNER REVERSED "BUDGET SHIPS NO SERVE-FIRST COACH" (playtest, 30.07)
  // ⚠ coach.roster: AND IT COSTS THE R3 DUPLICATE, DELIBERATELY.
  // → docs/notes/economy/coach.md#coachroster
  roster: [
    { portrait: 'budget-1', tier: 'budget', style: 'counterpuncher', gender: 'm' },
    { portrait: 'budget-2', tier: 'budget', style: 'all-court', gender: 'f' },
    { portrait: 'budget-3', tier: 'budget', style: 'aggressive', gender: 'f' },
    { portrait: 'middle-4', tier: 'budget', style: 'serve-first', gender: 'm' },
    { portrait: 'middle-1', tier: 'middle', style: 'all-court', gender: 'f' },
    { portrait: 'middle-2', tier: 'middle', style: 'counterpuncher', gender: 'm' },
    { portrait: 'middle-3', tier: 'middle', style: 'serve-first', gender: 'm' },
    { portrait: 'middle-5', tier: 'middle', style: 'aggressive', gender: 'm' },
    { portrait: 'high-1', tier: 'high', style: 'all-court', gender: 'm' },
    { portrait: 'high-2', tier: 'high', style: 'counterpuncher', gender: 'f' },
    { portrait: 'high-3', tier: 'high', style: 'aggressive', gender: 'm' },
    { portrait: 'high-4', tier: 'high', style: 'serve-first', gender: 'f' },
    { portrait: 'elit-1', tier: 'elite', style: 'aggressive', gender: 'f' },
    { portrait: 'elit-2', tier: 'elite', style: 'all-court', gender: 'f' },
    { portrait: 'elit-3', tier: 'elite', style: 'serve-first', gender: 'm' },
    { portrait: 'elit-4', tier: 'elite', style: 'counterpuncher', gender: 'm' },
  ] as { portrait: string; tier: CoachTier; style: PlayStyle; gender: 'm' | 'f' }[],

  // WHAT EACH RUNG IS WORTH. Replaces ECONOMY.development.coachParent (0.82) / coachHired (1.15),
  // and keeps both of those values as the ENDS of the ladder on purpose - see coachFactor in
  // engine/coach.ts for the argument. Steps shrink as they climb (+0.13, +0.09, +0.07, +0.04)
  // while the price roughly doubles every two rungs, so Elite is a luxury rather than an
  // optimisation.
  developmentFactor: { self: 0.82, budget: 0.95, middle: 1.04, high: 1.11, elite: 1.15 } as Record<
    CoachTier,
    number
  >,

  // FIT, as screen T's three pills - and since Round 2 it is a fact about the COACH, not the
  // tier. A coach coaches the game he plays; how well that transfers to hers is a question about
  // the two STYLES, so this is a compatibility table and not a tier table.
  // → docs/notes/economy/coach.md#coachstyleaffinity
  styleAffinity: {
    aggressive: ['serve-first', 'all-court'],
    counterpuncher: ['all-court'],
    'serve-first': ['aggressive', 'all-court'],
    'all-court': ['aggressive', 'counterpuncher', 'serve-first'],
  } as Record<PlayStyle, PlayStyle[]>,

  // ...and what a pill is worth on the development rate. WIDER than the rung ladder since round
  // 38 #17, not smaller: fit spans x1.67 (1.25/0.75) against x1.21 across the hireable rungs
  // (0.95 -> 1.15) and x1.40 across the whole ladder including the parent (0.82 -> 1.15). So the
  // pill REORDERS the market rather than breaking ties inside it, and in BOTH directions.
  //
  // owner (coach.fitFactor), 1.05: «1. игрок тренирует сам и грамотно 2. она с тренером долгосрочно и у них метч 3. она с элитным»…
  // owner (coach.fitFactor): «вопрос в том, как его показать?»
  // ⚠ coach.fitFactor: THE ANSWER TO THAT QUESTION IS THAT IT ALREADY IS SHOWN.
  // ⚠⚠ coach.fitFactor: IT WIDENS THE SPREAD WHERE `plateauRate` NARROWS IT
  // → docs/notes/economy/coach.md#coachfitfactor
  fitFactor: { great: 1.25, good: 1.0, off: 0.75 } as Record<'great' | 'good' | 'off', number>,

  // THE PARENT'S OWN FIT. Self-coaching has no specialty to match: he taught her the game she
  // plays, so he is never wrong for it and never a specialist in it.
  selfFit: 'good' as 'great' | 'good' | 'off',

  // THE ELITE GATE - AND IT IS ON (owner, 13.09: «elite gate включим здесь же», wave 5 T13).
  // Owner, when it was built: «элит, кстати, могу вообще стать доступны для туров, как вариант и
  // стоит соответствующе». The idea is that an Elite coach does not take a fourteen-year-old
  // with nothing to show, which would turn the top rung from "what rich families buy in week 1"
  // into something earned - the same shape as the academy scholarship.
  //
  // ⚠ coach.eliteGate: IT GATES THE HIRE, NOT THE HAVING - a latent seam, and it is named because it was CHECKED rather than assumed.
  // ⚠ coach.eliteGate: DOMESTIC POINTS, since the two ladders landed.
  // → docs/notes/economy/coach.md#coachelitegate
  eliteGate: { enabled: true, minPoints: 150 },

  // WHAT A RUNG IS WORTH TO HER, RIGHT NOW - the projection screen T prints on every coach row.
  // Owner: «"budget может добавить 0-2%", "middle 1-3%", "high 2-4%" но всё зависит от ребенка».
  // COMPUTED, never written down (see coachSeasonUplift): a hand-written band drifts the moment
  // a knob moves, and the game already knows the answer. `weeks` is the horizon the projection
  // runs over - one season, because that is the unit a weekly bill is judged in.
  //
  // ⚠ coach.upliftHorizonWeeks: THIS NUMBER WAS A HARD-CODED LITERAL 52 FOR ONE REASON, AND THE CYCLE THAT FORCED IT IS NOW CLOSED…
  // → docs/notes/economy/coach.md#coachuplifthorizonweeks
  upliftHorizonWeeks: WEEKS_IN_SEASON,
} as const
