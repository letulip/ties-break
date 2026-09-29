// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/fame.md#the-fame-block

import type { TierId } from '../season/types'

// FAME (round 29 part four P7/P8, docs/specs/fame-and-the-shoots-2026-08.md) – «нам важны
// разные спонсоры и их появление как можно раньше в плане фотосессий и их количества – это
// прямой рычаг известности» – and his «здесь полностью согласен» on the floor-and-multiplier
// shape: THE FLOOR IS EARNED ON COURT AND THE SHOOTS MULTIPLY IT. A champion who never shoots
// is still famous; a face with no results has nothing for the photographs to multiply.
//
// ⚠⚠ FAME IS A FOLD, NEVER A ROLL.
// → docs/notes/economy/fame.md#fame
export const fame = {
  /** ⭐ THE FLOOR, PER RESULT THE WORLD NOTICES – fame points per TITLE at each professional
   *  tier, freshest worth the full step and every step fading on `halfLifeWeeks` below. The
   *  spec's own floor list is «a Slam final, a title at 1000+, a first top-10 season»; the
   *  ladder below extends it downward with small steps so a climbing career is not a flat zero –
   *  the local paper notices a W35 title even if the world does not. Tiers absent here (the
   *  junior and domestic rungs) buy no fame at all: the world does not read junior draws. */
  titleFloor: {
    w15: 0.25, w35: 0.5, w50: 0.75, w75: 1, w100: 1.5, wta125: 2,
    wta250: 4, wta500: 8, wta1000: 14, slam: 25,
  } as Partial<Record<TierId, number>>,
  /** a LOST Slam final – the one runner-up plate the world remembers (spec §3's own example).
   *  ⚠ ITS OWN NUMBER AND NOT A SHARE, and it stays that way: 12 is 48% of the Slam title's 25,
   *  which is not `finalFloorShare` below, and the difference is the argument the constant was
   *  written on. A Slam final is a global broadcast in its own right. */
  slamFinalFloor: 12,
  /** ⭐⭐⭐ ROUND 41 #18 PART TWO (12.09) – WHAT HER FIRST GRAND SLAM MAIN DRAW IS WORTH, once,
   *  dated at the week she played it and decaying on the TITLE clock like every other result.
   *
   *  owner (fame.slamDebutFloor), 12.09: «да, делаем fame за основу Шлема, надо полностью с математикой бренда разобраться»…
   *  ⚠⚠ fame.slamDebutFloor: THE DEFECT IT ENDS.
   *  ⚠⚠ fame.slamDebutFloor: THE DEBUT AND NOT THE APPEARANCE, which is the whole sizing argument.
   *  ⚠ fame.slamDebutFloor: 4, AND THE LADDER IS WHY.
   *  ⚠ fame.slamDebutFloor: IT NEEDS A DATED ROW AND IT HAS ONE WITHOUT A SCHEMA MOVE
   *  → docs/notes/economy/fame.md#fameslamdebutfloor
   */
  slamDebutFloor: 4,
  /** ⭐⭐⭐ ROUND 34 #17 (03.09) – WHAT A LOST FINAL AT EVERY OTHER PROFESSIONAL TIER IS WORTH, as a
   *  SHARE of that tier's own title step. Approved by the owner at 0.4.
   *
   *  ⚠⚠ fame.finalFloorShare: THE DEFECT IT ENDS: `trophiesByTier[tier].finals`
   *  owner (fame.finalFloorShare): «доход опустился с 200 до 65 долларов в неделю с бизнеса… Она доходит в Шлеме до QF и вообще»…
   *  ⚠ fame.finalFloorShare: A SHARE AND NOT A LADDER, so it cannot drift away from `titleFloor`.
   *  ⚠⚠ fame.finalFloorShare: AND IT DOES NOT REACH 'slam', WHICH IS THE ONE PLACE IT WOULD DOUBLE-COUNT.
   *  ⚠ fame.finalFloorShare: IT IS FAME AND NOT THE VALUATION MULTIPLE.
   *  → docs/notes/economy/fame.md#famefinalfloorshare
   */
  finalFloorShare: 0.4,
  /** ⭐⭐ WHAT A FINISHED SEASON'S END-RANK IS WORTH, best matching band only, counted once per
   *  season from its wrap week. The spec's floor list says «a first top-10 season»; this is that
   *  entry as a LADDER, in the shape `academy.reputationBands` already uses two blocks up.
   *
   *  ⚠ fame.seasonEndBands: THE DATA FOR «DEEP RUNS» ITSELF DOES NOT EXIST AT THE TOURNAMENT LEVEL
   *  ⚠⚠ fame.seasonEndBands: IT MOVES MERCH INCOME AND THE BRAND'S WORTH ON EVERY CAREER, and it was benched before it was kept
   *  → docs/notes/economy/fame.md#fameseasonendbands
   */
  seasonEndBands: [
    { maxEndRank: 10, add: 10 },
    { maxEndRank: 20, add: 4 },
    { maxEndRank: 50, add: 1.5 },
    /** ⭐⭐⭐ ROUND 38 #2c (06.09) – THE RUNG THE LADDER STOPPED ONE SHORT OF, and the owner's own
     *  words are the argument: «спортсменка проводит свой лучший сезон (и не один) находясь в
     *  ТОП-100 … у нее явно есть и репутация и о ней знают».
     *
     *  ⚠⚠ fame.seasonEndBands[3]: WHAT IT ENDS, on his week-1115 career: NINE seasons ended inside the top 100 were worth exactly ZERO…
     *  ⚠ fame.seasonEndBands[3]: 0.6 IS THE LADDER'S OWN RATIO CONTINUED AND NOT A NEW LEVEL.
     *  → docs/notes/economy/fame.md#fameseasonendbands3
     */
    { maxEndRank: 100, add: 0.6 },
  ] as readonly { maxEndRank: number; add: number }[],
  /** ⭐ THE SLOW DECAY – the half-life of every contribution, in weeks. Two seasons: a Slam won
   *  six seasons ago still carries an eighth of its step, so a reign fades over about four to
   *  six seasons rather than overnight. ⚠ Decay is what makes fame a lever and not a rank by
   *  another name (spec §3) – a stock that only rises is a trophy cabinet. */
  halfLifeWeeks: 104,
  /** ⭐⭐⭐ ROUND 38 #2c (06.09) – THE CAREER CLOCK: how long a FINISHED SEASON inside a band the
   *  world notices is remembered, against `halfLifeWeeks` above for a single title.
   *
   *  owner (fame.seasonHalfLifeWeeks), 06.09: «у нее явно есть и репутация и о ней знают, не могу забыть за год.»
   *  ⚠⚠ fame.seasonHalfLifeWeeks: IT SHIPPED AT 104 FIRST – identical to the title clock, deliberately…
   *  ⚠ fame.seasonHalfLifeWeeks: IT MUST BE THE LONGEST OF THE THREE CLOCKS
   *  ⚠⚠ fame.seasonHalfLifeWeeks: 312 = SIX YEARS, AND IT IS MEASURED.
   *  → docs/notes/economy/fame.md#fameseasonhalflifeweeks
   */
  seasonHalfLifeWeeks: 312,
  /** ⭐ THE MULTIPLIER'S STEP – each shoot week ALREADY LIVED multiplies the floor by
   *  (1 + step), the step itself decaying on the same half-life. Twelve fresh shoots ≈ ×1.6:
   *  enough to reorder two comparable floors (the census's #30-on-court / #2-off-court shape),
   *  never enough to make a face out of nothing – zero floor times anything is zero. */
  shootStep: 0.05,
  /** ...and the multiplier's ceiling. The photographs can at most double what the court earned –
   *  the spec's «a multiplier on a floor she earns on court, not the only road», as a bound. */
  shootMultCap: 2,
  /** ⭐⭐⭐ ROUND 32 #5 (31.08) – WHAT A DELIVERED SHOOT ADDS TO THE FLOOR, per band of the deal
   *  that asked for it. `docs/specs/collaborations-as-early-fame-2026-08.md`, and it is the item.
   *
   *  owner (fame.shootFloorByBand), 31.08: «карьера топ-20 без титулов … Мне кажется здесь как раз на раннем этапе коллаборации нам»…
   *  owner (fame.shootFloorByBand): «и это надо внедрять да»
   *  ⚠⚠ fame.shootFloorByBand: AN ADDITION AND NOT A COEFFICIENT, WHICH IS THE WHOLE ITEM.
   *  ⚠⚠ fame.shootFloorByBand: BY THE DEAL'S BAND, ON HIS RULING
   *  owner (fame.shootFloorByBand): «по полосе сделки (глобальный дом это не локальный ретейнер) – да»
   *  ⚠⚠ fame.shootFloorByBand: A STEEP GRADIENT ALSO DESTROYS THE THING THE ITEM IS FOR
   *  ⚠ fame.shootFloorByBand: THE SIZES ARE THE MEASUREMENT'S, not a guess, and the binding criterion is ROUND 32 #3'S OWN…
   *  ⚠⚠ fame.shootFloorByBand: ROUND 34 (03.09) – A FIFTH RUNG WAS PREPENDED BECAUSE `advertising.bands` GAINED A FIFTH BAND…
   *  ⚠ fame.shootFloorByBand: THE NEW ≤400 RUNG IS NOT A FIGURE THE OWNER SIZED
   *  → docs/notes/economy/fame.md#fameshootfloorbyband
   */
  shootFloorByBand: [0.03, 0.04, 0.06, 0.08, 0.11] as readonly number[],
  /** ⭐⭐ ...AND IT IS FORGOTTEN FASTER THAN A TITLE, WHICH IS THE OTHER HALF OF HIS RULING. He put
   *  the decay question back with both halves of the tension named: «наверное истлевает (мало кто
   *  смотрит журналы 2 годичной давности) … с другой стороны "что попало в интернет осталось
   *  навсегда"».
   *
   *  ⚠ fame.shootFloorHalfLifeByBand: AROUND ONE SEASON, AGAINST A TITLE'S TWO.
   *  ⚠⚠ fame.shootFloorHalfLifeByBand: AND IT IS WHAT KEEPS THE TERM BOUNDED.
   *  owner (fame.shootFloorHalfLifeByBand), 31.08: «у нас есть популярные сайты, журналы и бренды, а есть менее популярные»…
   *  ⚠ fame.shootFloorHalfLifeByBand: HIS OWN EXAMPLE IS NOT THE ARGUMENT.
   *  owner (fame.shootFloorHalfLifeByBand): «как то женщин из номинации плейбоя помнят довольно долго … но может быть я ошибаюсь»
   *  ⚠⚠ fame.shootFloorHalfLifeByBand: THE TOP RUNG IS STILL SHORTER THAN A TITLE'S 104 WEEKS
   *  ⚠ fame.shootFloorHalfLifeByBand: THE SIZES ARE MEASURED, and the criterion is the one this ladder exists to satisfy…
   *  ⚠ fame.shootFloorHalfLifeByBand: Band 2 is left at the shipped 52 on purpose – the anchor round 32 #5 was sized on does not move…
   *  ⚠⚠ fame.shootFloorHalfLifeByBand: ROUND 34 (03.09) – A FIFTH RUNG, FOR THE SAME REASON AND ON THE SAME TERMS AS `shootFloorByBand`…
   *  → docs/notes/economy/fame.md#fameshootfloorhalflifebyband
   */
  shootFloorHalfLifeByBand: [13, 26, 39, 52, 78] as readonly number[],
  /** fame is bounded 0–100 – the spec's own scale; the cap is «the whole world knows her». */
  cap: 100,
} as const
