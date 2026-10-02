// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/condition.md#the-condition-block

import type { TierId } from '../season/types'

export const condition = {
  start: 100,
  min: 0,
  max: 100,
  // V2.1 SHIPPED (owner 25.07 "все чуть ниже к концу сезона", same pass as the V2 flip): every
  // MATCH-FREE week recovers this base (was 2) – the free-week ladder is now grinder +1 /
  // balanced +2 / careful +3 via the slider bonus, so every policy ARRIVES at the season wrap
  // below 100 and the off-season + a planner vacation earn their keep.
  //
  // ⚠⚠ condition.recoveryBase: 1 -> 8 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §3).
  // owner (condition.recoveryBase): «то, что за off-season РЕАЛЬНО восстановить с 1 большим или парой небольших отпусков»
  // ⚠⚠⚠ condition.recoveryBase: THE OWNER RELEASED «ARRIVE AT THE OFF-SEASON DOOR AROUND 45-50» ON 19.09…
  // owner (condition.recoveryBase), 19.09: «давай изменим эту цель, если она нам мешает.»
  // ⚠ condition.recoveryBase: The 8 itself did NOT move with the release - nothing measured asked it to…
  // ⚠ condition.recoveryBase: IT IS GLOBAL, SO THE JUNIOR ERA AND THE COHORT GET IT TOO - deliberate, not collateral.
  // → docs/notes/economy/condition.md#conditionrecoverybase
  recoveryBase: 8,
  // ⭐ THE PRO PHASE RECOVERS ON 5, NOT 8 (owner 22.08, variant C of his own proposal: «может
  // быть нам тогда стоит дефолтное восстановление с 10 в неделю на 7 опустить? тогда массажист
  // как раз будет еще немного накидывать, может вполне гармонично получиться»).
  //
  // ⚠ condition.proPhaseRecoveryBase: THE GLOBAL DROP (variant B) WAS MEASURED AND REJECTED
  // → docs/notes/economy/condition.md#conditionprophaserecoverybase
  proPhaseRecoveryBase: 5,
  // ⭐⭐⭐ THE FLOOR UNDER THE FADING RECOVERY (the long goodbye §4a, owner 26.08 – «пол 2.5 ок»).
  // From `declineStart` the base above is multiplied by the share of her own peak physical she
  // has left, and this is the lowest that multiplier may go: 0.5, so a professional rest week
  // can never return less than 2.5.
  //
  // owner (condition.recoveryAgeFloor): «и физика будет падать и восстанавливаться будет дольше»
  // ⚠ condition.recoveryAgeFloor: IT IS A MULTIPLIER ON `recoveryBaseFor`, NOT A SECOND CURVE.
  // ⚠⚠ condition.recoveryAgeFloor: AND IT IS ALMOST INERT UNDER THE SHIPPED THRESHOLD, which is worth knowing BEFORE anybody reaches for…
  // ⚠ condition.recoveryAgeFloor: The ONE thing that legitimately moves it is §6.6's veto – if the fade pushes season injury prevalence…
  // → docs/notes/economy/condition.md#conditionrecoveryagefloor
  recoveryAgeFloor: 0.5,
  // V2 SHIPPED (owner verdict 25.07 "V2 хорош", after two fatigue-bench rounds): a tournament
  // week is travel + competition, not rest – NO base recovery on a week the kid plays. The
  // knob stays (the bench's 'legacy' scenario patches it back to 2 for reference runs).
  matchWeekRecoveryBase: 0,
  // Match-free weeks only, first matching threshold wins (descending): the slider stays
  // meaningful – money (planFactor), future skill growth, and recovery pacing.
  restRecoveryBonus: [
    { minRest: 40, bonus: 2 },
    { minRest: 25, bonus: 1 },
  ] as { minRest: number; bonus: number }[],
  blackoutBonus: 1, // off-season (weeks 49-51) and exam weeks (replaces the old offSeasonGain)
  // Per-match drain components (see world.ts matchDrain).
  //
  // ⚠ condition.matchFatigue: AND THE FRIENDLY NO LONGER READS LOCAL'S SURCHARGE AT ALL (W2-WINDOW)
  // → docs/notes/economy/condition.md#conditionmatchfatigue
  matchFatigue: { straightSets: 2, hardMatch: 3, extraTiebreaks: 1 },
  // Tier surcharge PER MATCH – what the WEEK AWAY costs, not the prestige. SINCE 02.10 the whole table
  // speaks one three-step language, 1 / 2 / 3, and a rung's step is its STAGE: local, j30 and the W rungs
  // up to W75 take 1; regional, j60 and W100 to WTA 250 take 2; national, j300 and WTA 500 up take 3.
  // (Until 02.10 the J levels sat ABOVE national at 3/4/5 and the W family between 2 and 5 – the ⚠ lines
  // below are the history of those tables and stay as written.)
  //
  // ⚠⚠⚠⚠ condition.tierMatchFatigue: 02.10 – THE TABLE IS HIS LEVER, AND IT IS NOW 1-2-3 BY STAGE (round 45 #1)
  // owner (condition.tierMatchFatigue), 02.10: «может быть сделать J тоже 1-2-3, а W 1-2-3-4 или тоже 1 для 15-75, 2 для 100-250, а 3 для 500+? и тогда мы как раз можем довольно хорошо отбалансировать эту историю, как мне кажется. А остальное пока оставить как есть и попробовать как будет.»
  // ⚠ condition.tierMatchFatigue: «THE REST STAYS AS IT IS» IS PART OF THE RULING – the ladders, the masseur's 3 a night and matchFatigue (2/3/+1) did not move
  // ⚠ condition.tierMatchFatigue: IT IS A SHARED-WITH-RIVALS TARIFF, so every rival's ledger and every frozen career moved with it
  //
  // ⚠ condition.tierMatchFatigue: THE W FAMILY IS REPRICED ONE STEP OVER THE J FAMILY
  // ⚠ condition.tierMatchFatigue: PRICED FOR TODAY'S SOFT FIELDS, ON PURPOSE, AND THAT IS A DATED DECISION
  // ⚠ condition.tierMatchFatigue: W50/W75/WTA125 (W2-LADDER) INTERPOLATE INSIDE THE PRICED FAMILY, THEY DO NOT EXTEND IT.
  // ⚠⚠ condition.tierMatchFatigue: AND NOW THE WHOLE W FAMILY IS REPRICED DOWN INTO THE 2-3 BAND
  // owner (condition.tierMatchFatigue), 03.08: «по усталости нам надо комплексно что-то сделать, я чувствую.»
  // owner (condition.tierMatchFatigue): «это же работа, она привыкла»
  // ⚠ condition.tierMatchFatigue: SO THE J -> W SEAM NOW DROPS BY THREE, AND A W15 MATCH COSTS WHAT A NATIONAL ONE DOES (both 4).
  // ⚠ condition.tierMatchFatigue: THE ENTRY FLOORS DID NOT MOVE WITH THEM, so R15-6's `floor = 30 + 5 x surcharge` pairing is retired…
  // ⚠⚠⚠ condition.tierMatchFatigue: AND THE DOMESTIC FAMILY GOES UP BY ONE
  // owner (condition.tierMatchFatigue), 03.08: «как для local, Regional и national мы могли бы легко брать больше condition за них»…
  // → docs/notes/economy/condition.md#conditiontiermatchfatigue
  tierMatchFatigue: {
    local: 1, regional: 2, national: 3,
    // 02.10: the J levels on the same 1-2-3 as the domestic ladder, the W family by STAGE – 15 to 75 one,
    // 100 to 250 two, 500 and up three. (HIS FIRST SHAPE, measured beside this one and NOT shipped:
    // W15-50 1, W75-125 2, 250/500 3, 1000/Slam 4, juniors 1/2/3 – tools/condition-drain-probe.ts, T1-first.)
    j30: 1, j60: 2, j300: 3,
    w15: 1, w35: 1, w50: 1, w75: 1, w100: 2, wta125: 2,
    // W3-ACT2 priced these four rungs 4/4/5/5 – "the family's own step continues" – which landed the biggest
    // week in the game on exactly J300's number. 02.10 re-priced them with the rest of the table: what it
    // prices is still the WEEK, not the prestige (a major is a fortnight's trip across a time zone against the
    // strongest field that exists), but the scale now stops at 3 – the 250 sits with the 100 and the 125 at 2,
    // and the 500, the 1000 and the Slam share the top step with National and J300.
    wta250: 2, wta500: 3, wta1000: 3, slam: 3,
  } as Record<TierId, number>,
  // CUMULATIVE RUN FATIGUE (owner idea 26.07): matches at a tournament run every day or every
  // other day, so each SUBSEQUENT match of the SAME run costs EXTRA condition on top of its own
  // scoreline drain – the deeper she goes, the more that week grinds her down. The array is the
  // extra, INDEXED BY MATCH-WITHIN-RUN: index 0 = her first match = 0 extra, index 1 = the
  // second match, and so on (world.ts runFatigueExtra / tournamentRunStrain).
  // → docs/notes/economy/condition.md#conditionrunfatigueladder
  runFatigueLadder: [0, 1, 1, 2, 2] as number[],
  // ⚠ ...AND THE W FAMILY RUNS ON HIS LADDER D (R15-6, owner 01.08: «может быть будет иметь
  // смысл использовать другой кумулятивный механизм для мировой серии, с меньшими надбавками
  // просто. Я несколько тогда предлагал»).
  //
  // ⚠ condition.runFatigueLadderWta: THE TWO BIG RUNGS DO NOT RUN ON THIS LADDER ANY MORE (14.08)
  // ⚠⚠ condition.runFatigueLadderWta: MEASURED ON 19.09 AND DELIBERATELY NOT MOVED
  // → docs/notes/economy/condition.md#conditionrunfatigueladderwta
  runFatigueLadderWta: [0, 1, 1, 1, 1] as number[],
  /** ⚠⚠ THE OWNER'S OWN CURVE FOR THE DEEP DRAWS, 14.08, given as the two bounds of a match at a
   *  Slam and a WTA 1000 round by round: min 5 6 7 7 7 7 7, max 7 8 9 9 9 9 9.
   *
   *  ⚠ condition.runFatigueLadderDeep: IT REPLACES A CAP OF MINE THAT MADE A CLIFF.
   *  owner (condition.runFatigueLadderDeep): «а сейчас немного некорректно получается»
   *  ⚠⚠ condition.runFatigueLadderDeep: AND THAT REJECTION IS A STANDING SHAPE RULE, WHICH THE 19.09 PASS READ OFF IT AND OBEYED.
   *  owner (condition.runFatigueLadderDeep), 19.09: «немного уменьшить усталость на глубоких турнирах»
   *  → docs/notes/economy/condition.md#conditionrunfatigueladderdeep
   */
  runFatigueLadderDeep: [-2, -1, 0] as number[],
  // R9-19: coupling ON, owner curve – NO penalty while condition >= knee (fresh enough),
  // then linear down to `floor` at condition 0:
  //   condFactor = condition >= knee ? 1.0 : floor + (1 − floor) × condition / knee.
  // The kid's MatchPlayer scales by it on the EVENT-scoped `seed:kidtour` stream only; the
  // slice-B fast-follow the owner proved necessary (won a Regional at 0 condition).
  matchStrengthKnee: 70,
  matchStrengthFloor: 0.55,
  // RIVALS BECOME REAL (rival-life slice): how many trailing weeks of the results ledger a
  // COHORT player's condition is reconstructed from. The kid carries a persisted `condition`
  // counter; a rival cannot (world.cohort is inside every save, and a new field would cost a
  // schema bump AND re-roll all 199 players), so hers is DERIVED on the fly from the rows she
  // already has – which means the scan has to be bounded.
  //
  // ⚠ condition.rivalFatigueWindowWeeks: W2-FATIGUE RETIRED THAT PREMISE AND LEFT THE NUMBER ALONE, ON PURPOSE.
  // → docs/notes/economy/condition.md#conditionrivalfatiguewindowweeks
  rivalFatigueWindowWeeks: 16,
} as const
