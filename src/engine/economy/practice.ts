// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/practice.md#the-practice-block

// Season planner: practice matches (spec §4) – A friendly on an empty week: court rental
// $30-80 × corridor off `seed:practice:week`, plus an OPTIONAL coach. Effect: condition drain
// max(1, local SCORELINE drain − 1) - the tier surcharge is subtracted out by name, see
// resolvePractice - ZERO ranking points, and the week keeps the base recovery but FORFEITS the
// rest-slider bonus (she played, even if friendly). GUARDRAIL…
// → docs/notes/economy/practice.md#practice
export const practice = {
  courtFeeCents: [30_00, 80_00] as [number, number],
  // ⚠ `coachSessionCents: [120_00, 250_00]` IS GONE (Round 3), and it is the owner's ruling that
  // retired it: «справедливо будет завязать на стоимость выбранного тренера или best-fit если не
  // выбран». The friendly's optional coach is HER coach, so it costs a share of HIS OWN rate -
  // there is no second, unrelated price for a coaching hour any more.
  // → docs/notes/economy/practice.md#practicecoachhours
  coachHours: 2,
  coachShare: 0.5,
  cautionCondition: 55,
  /** the SHORT streak – warns only while she is under the strain gate below */
  cautionStreak: 3,
  /** the short streak's strain gate: 3 match weeks in a row warn only below this condition */
  cautionStreakCondition: 75,
  /** a run this long warns at ANY condition – no gate */
  cautionStreakAlways: 4,
  /** the rescue prompt fires at or below this condition (spec §4b – an OFFER, never an
   *  auto-book). WIDENED 65 → 80 (Wave-2): the narrow band meant the offer only ever appeared
   *  on a deep deficit, where nothing but the expensive packages could clear the target – so
   *  seaside took 88% of every booking in the bench. A mildly-tired week is exactly where a
   *  cheap package is the right answer. */
  rescueCondition: 80,
  /** the offer pre-highlights the CHEAPEST package sufficient to return her to this condition
   *  (see recommendVacationPackage) – so the recommendation slides down the ladder as the
   *  deficit shrinks, instead of always demanding the +20 tier. */
  rescueTargetCondition: 85,
} as const
