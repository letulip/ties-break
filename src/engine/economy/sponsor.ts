// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/sponsor.md#the-sponsor-block

import type { CoachTier } from '../../shared/protocol'

// Local sponsor cameo. The weekly ROLL is unchanged (draw count!), and round-7 b made the
// payout NEED-BASED – for everyone else the roll result is ignored (no event), the draws still
// happen so the main stream is background-independent. Amounts unchanged.
//
// ⚠ sponsor: AND SINCE 10.08 "NEED" IS THE BALANCE RATHER THAN THE PROFILE ROW.
// owner (sponsor), 24.07: «спонсор нужде-ориентирован (платит только working)»
// owner (sponsor), 10.08: «порог по деньгам на счету, а не по строчке в анкете – всё именно так, и с самого начала так и затевалось»
// → docs/notes/economy/sponsor.md#sponsor
export const sponsor = {
  rollChance: 0.06,
  /** ⭐⭐⭐ THE CHEQUE, AND IT IS THE CHEQUE AGAIN – ROUND 42 #47, SECOND READING (16.09).
   *
   *  ⚠⚠ sponsor.amountCents: THE FIRST READING OF HIS RULING WAS WRONG AND THIS BAND IS THE THING IT BROKE.
   *  owner (sponsor.amountCents), 16.09: «давай что-то вроде 60-80% закрытия»
   *  owner (sponsor.amountCents): «помощь должна срабатывать в 80% случаев примерно»
   *  owner (sponsor.amountCents), 16.09: «у нас был механизм, который нормально давал денег, нормальными суммами»…
   *  owner (sponsor.amountCents): «для семьи 8к самый сложный период это J серия, а там стоимость радикально другая»
   *  ⚠ sponsor.amountCents: THE GAP IS STILL THE TRIGGER, IT IS JUST NOT THE SIZE.
   *  owner (sponsor.amountCents): «в край нужды для закрытия поездок»
   *  ⚠ sponsor.amountCents: The remaining half of his ruling – 60–80% of NEED CASES receiving help, against about 4% today…
   *  → docs/notes/economy/sponsor.md#sponsoramountcents
   */
  amountCents: [500_00, 1500_00] as [number, number],

  // ⭐⭐⭐ ROUND 42 #5 – THE CADENCE DIAL. PROPOSED NUMBERS, HIS TO CONFIRM OFF THE PRINTED TABLE.
  // – THE OWNER, 15.09: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели».
  //
  // ⚠ sponsor.cooldownWeeks: HIS IMPRESSION IS THE DESIGN'S OWN NOISE AND NOT A DEFECT IN THE GATE.
  // ⚠⚠ sponsor.cooldownWeeks: BOTH NUMBERS BELOW WERE A PROPOSAL AND THE PRINT WENT TO HIM.
  // owner (sponsor.cooldownWeeks), 15.09: «сними потолок, а кулдаун давай 4»
  // ⚠ sponsor.cooldownWeeks: AND `seasonCap` IS GONE ENTIRELY
  // ⚠ sponsor.cooldownWeeks: The floor it sets is four, not five: see the block above.
  // → docs/notes/economy/sponsor.md#sponsorcooldownweeks
  cooldownWeeks: 4,

  /** HOW MANY WEEKS OF COURT HIRE THE BALANCE MUST NO LONGER COVER for a shop to chip in.
   *
   *  ⚠ sponsor.runwayWeeks: 62 IS THE MIDDLE OF A MEASURED BAND, not a chosen figure, and both of its walls are numbers rather than…
   *  ⚠ sponsor.runwayWeeks: IT IS DENOMINATED IN COURT WEEKS, WHICH ARE NOT MONEY WEEKS.
   *  → docs/notes/economy/sponsor.md#sponsorrunwayweeks
   */
  runwayWeeks: 62,

  /** ...AND ABOVE THIS RUNG NOBODY CHIPS IN, however empty the account (owner, 10.08: «у нас есть
   *  маркер трат в неделю, если тренер стоит дороже, то нечего и помогать»). A shop backs the
   *  girl whose family is doing this on a shoestring, not the one that has hired the best coach
   *  in the city – a story rule first and an anti-exploit second.
   *
   *  ⚠ sponsor.maxCoachTier: `middle` AND NOT LOWER, because the owner's own two careers are 8k self-coached and 25k middle and both stay…
   *  ⚠ sponsor.maxCoachTier: AND NOT HIGHER, because `high` and `elite` are exactly where a need gate would start paying for the coach…
   *  ⚠ sponsor.maxCoachTier: THE CUT IS ON THE RUNG AND NOT ON THE WEEKLY DOLLARS.
   *  → docs/notes/economy/sponsor.md#sponsormaxcoachtier
   */
  maxCoachTier: 'middle' as CoachTier,
} as const
