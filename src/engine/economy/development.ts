// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/development.md#the-development-block

// Season-Life condition accumulator (0..100, 100 = fresh). Pure INTEGER arithmetic –
// accrueCondition draws ZERO main-stream RNG, so none of these can shift the weekly draw
// sequence (the B1 invariance test guards it).
// → docs/notes/economy/development.md#development
export const development = {
  /** Headroom rolled per attribute ON TOP of where she starts. A career at the bottom of this
   *  band is a girl who was never going to make it, and that has to be a career the game can
   *  tell - so the low end is deliberately small, not merely "less good". */
  potentialBand: [4, 26] as [number, number],
  /** She never falls below this, whatever age does to her. */
  floor: 20,
  ageCurve: {
    /** the steep years start here (our START_AGE is 14, so a prologue at 13 is covered) */
    growthStart: 13,
    /** ...and ease off into the late teens */
    growthEnd: 18,
    /** by the plan's calibration: first points 17-18, top-100 about 4.5 years later.
     *
     *  ⚠⚠ SINCE ROUND 31 #10 THIS PAIR IS THE **DEFAULT** CURVE, NOT THE ONLY ONE. It is what a
     *  career runs on before the fork at nineteen has been answered – nothing can read it there,
     *  because `plateauStart` first bites at 18 and `declineStart` at 23 – and it is what the v68
     *  migration PINS every career that already existed onto. The per-route pair a new career
     *  resolves at the fork is `ageRoutes` below. See `development.ts#resolveAgeCurve`. */
    plateauStart: 23,
    /** peak 23-28 – and it is the COLLEGE window, which is the whole of round 31 #10 */
    declineStart: 29,
    /** share of remaining headroom taken per week at the steepest age */
    peakRate: 0.0062,
    /** how much of that is gone by `growthEnd` (0.5 = half the rate at 18 that she had at 13) */
    growthEase: 0.5,
    /** ⭐⭐⭐ ROUND 38 #17 (07.09) – 0.0009 -> 0.0027, AND IT IS C1 AND C3 TURNING OUT TO BE ONE DIAL.
     *
     *  owner (development.ageCurve.plateauRate), 07.09: «нет варианта, что они и дальше гармонично сотрудничают до абсолютного потолка»
     *  ⚠ development.ageCurve.plateauRate: AND IT IS THE SAME LEVER C1 NEEDED.
     *  owner (development.ageCurve.plateauRate): «рост как раз идёт до 28-29»
     *  ⚠⚠ development.ageCurve.plateauRate: ON ITS OWN IT NARROWS THE SPREAD
     *  owner (development.ageCurve.plateauRate): «три пути должны различаться»
     *  → docs/notes/economy/development.md#developmentagecurveplateaurate
     */
    plateauRate: 0.0027,
    /** share of an attribute lost per week at `declineStart` */
    declineRate: 0.00035,
    /** ...growing each year past it, so a career ends rather than fading forever.
     *
     *  owner (development.ageCurve.declineAccel), 06.09: «я вижу ветеранов на корте, да, они уже не могут так быстро бегать, как раньше»…
     *  ⚠⚠ development.ageCurve.declineAccel: AND HE ALLOWED THE OTHER HALF TO STAY
     *  owner (development.ageCurve.declineAccel), 06.09: «Хотя может быть для формального окончания игры это и ок»
     *  ⚠⚠ development.ageCurve.declineAccel: 0.24 AND NOT 0.22, AND THE REASON IS A PIN THIS REPO LEFT AS A TRIPWIRE.
     *  ⚠ development.ageCurve.declineAccel: A FLOOR WAS MEASURED AND REFUSED
     *  ⚠⚠ development.ageCurve.declineAccel: AND IT IS NOT WHAT CAUSED HIS «из топ-50 до топ-150 за сезон».
     *  → docs/notes/economy/development.md#developmentagecurvedeclineaccel
     */
    declineAccel: 0.24,
  },
  /** ⭐⭐⭐ ROUND 38 #6c (07.09) – WHICH SKILLS AGE, AND HOW FAST RELATIVE TO EACH OTHER.
   *
   *  owner (development.ageWeight), 07.09: «может быть и навыки могут деградировать, это вполне ок»…
   *  owner (development.ageWeight), 07.09: «веса ок, строй и меряй пожалуйста»
   *  ⚠⚠ development.ageWeight: WHAT THIS ENDS.
   *  ⚠⚠⚠ development.ageWeight: THESE ARE RAW WEIGHTS AND THE CODE NORMALISES THEM, WHICH IS THE WHOLE SAFETY OF THE CHANGE AND IS…
   *  ⚠ development.ageWeight: A fifth attribute appended to `SKILL_KEYS` without a row here reads 1 and is therefore ordinary, never zero…
   *  ⚠ development.ageWeight: COMPOSURE IS ABSENT ON PURPOSE and would be inert if present…
   *  → docs/notes/economy/development.md#developmentageweight
   */
  ageWeight: {
    /** struck from a standing start – the last thing to go, and a serve is a career extender */
    serve: 0.6,
    /** the return is movement and reaction before it is technique */
    ret: 1.2,
    /** endurance goes first and fastest, and it is the loss everybody can see */
    stamina: 1.6,
    /** rally quality: half movement, half shot-making */
    groundstrokes: 1.0,
    // ⚠ TYPED `string` AND NOT `SkillKey`, AND THE REASON IS THE IMPORT GRAPH. `SkillKey` is
    // declared in `engine/development.ts`, which imports THIS file – a type-only import back
    // would still be a cycle for the tools' project (`match/style.ts` declares a second copy of
    // the union, and a third reader of it is not a trade worth making). The membership check
    // that a plain `string` gives up is made mechanically instead:
    // `tests/r38-age-weights.test.ts` asserts every key here is in `SKILL_KEYS`, so a typo
    // reddens rather than reading 1 in silence.
  } as Record<string, number>,
  /** ⭐⭐⭐ ROUND 44 – WHAT THE PAYROLL TAKES OFF THE DECLINE, AND NOTHING MORE THAN THAT.
   *
   *  owner (development.declineCare), 17.09: «все эти специалисты должны его если не тормозить, то хотя бы сглаживать»…
   *  ⚠⚠ development.declineCare: THESE ARE SHARES OF THE ORDINARY WEEKLY LOSS, NOT NEW RATES
   *  ⚠⚠ development.declineCare: AND NOTHING HERE MOVES `declineStart`, `declineRate` OR `declineAccel`.
   *  ⚠ development.declineCare: COMPOSURE IS ABSENT AND WOULD BE INERT, exactly as in `ageWeight` above…
   *  → docs/notes/economy/development.md#developmentdeclinecare
   */
  declineCare: {
    /** ⭐ THE MASSEUR PROTECTS HER LEGS. Weekly body work is exactly what a veteran's endurance runs
     *  on, and stamina is the fastest-ageing attribute in the table above (weight 1.6), so it is
     *  both the honest claim and the one the player can feel.
     *
     *  ⚠ development.declineCare.masseur: THE SHARE IS THE TOP RUNG'S.
     *  ⚠⚠ development.declineCare.masseur: THAT SHAPE IS SELF-LIMITING BY CONSTRUCTION, WHICH IS WHY IT BEAT A ROUND NUMBER
     *  → docs/notes/economy/development.md#developmentdeclinecaremasseur
     */
    masseur: { skill: 'stamina', topRungShare: 0.25 },
    /** ⭐ THE HITTING PARTNER PROTECTS HER RETURN. The return is reaction before it is technique
     *  (the `ageWeight` row above says so in its own words) and reaction is what match-style
     *  practice drills. Same top-rung doctrine, off this seat's own `driftCut` ladder.
     *
     *  ⚠ development.declineCare.sparring: SO THIS SEAT'S SHIELD IS SMALLER THAN THE MASSEUR'S WHILE ITS BILL IS LARGER
     *  → docs/notes/economy/development.md#developmentdeclinecaresparring
     */
    sparring: { skill: 'ret', topRungShare: 0.1667 },
    /** ⭐⭐ AND THE COACH MAINTAINS ALL FOUR, SLIGHTLY – the row that fixes something close to a
     *  defect. Past `declineStart` `ageFactor` returns 0, so `growWeek`'s whole GAIN term is zero
     *  and an elite coach multiplies nothing: a family paying elite money for a twenty-eight-year-
     *  old is buying literally nothing, and no screen says so. An elite coach's job past the peak
     *  is maintenance rather than growth, and this is the first term in the engine that says it.
     *
     *  ⚠ development…coachMaintenanceTop: SCALED BY TIER AND FIT, AND THE SCALE IS DERIVED.
     *  ⚠⚠⚠ development…coachMaintenanceTop: IT WAS HELD AT **ZERO** FOR A DAY, AND THE REASON IS WORTH KEEPING BECAUSE THE FIXTURE IS WHAT…
     *  ⚠⚠ development…coachMaintenanceTop: THE MEASUREMENT THAT LOOKED LIKE CLASS
     *  owner (development…coachMaintenanceTop), 17.09: «на про уровне они все имеют условно одинаковый доход»
     *  ⚠ development…coachMaintenanceTop: WHAT THE ROW IS WORTH, RE-MEASURED WITH IT LIVE (`npm run bench:decline`, 17.09)
     *  ⚠ development…coachMaintenanceTop: AND IT CLOSES §4's «close to a defect»: past `declineStart` `ageFactor` returns 0…
     *  → docs/notes/economy/development.md#developmentdeclinecarecoachmaintenancetop
     */
    coachMaintenanceTop: 0.08,
    // ⚠ `skill` IS TYPED `string` FOR `ageWeight`'s OWN REASON, one concern up: `SkillKey` is
    // declared in `engine/development.ts`, which imports THIS file. The membership check a plain
    // string gives up is made mechanically instead – `tests/round44-decline-care.test.ts` asserts
    // both names are in `SKILL_KEYS` and are PHYSICAL, so a typo reddens rather than shielding an
    // attribute that does not exist in silence.
  } as { masseur: { skill: string; topRungShare: number }; sparring: { skill: string; topRungShare: number }; coachMaintenanceTop: number },
  /** ⭐⭐⭐ ROUND 31 #10 – THE FORK SHAPES THE CURVE, and until now it only priced it.
   *
   *  owner (development.ageRoutes), 31.08: «я думал уже так и есть, но тоже неплохо звучит.»
   *  ⚠ development.ageRoutes: THE COLLEGE PAIR IS TODAY'S PAIR, UNCHANGED.
   *  ⚠ development.ageRoutes: THE ROUTE IS THE FORK'S ANSWER AND NOT `world.college`.
   *  ⚠ development.ageRoutes: THE TOUR'S OWN POOL IS NOT THIS AND MUST NOT BE TUNED WITH IT.
   *  → docs/notes/economy/development.md#developmentageroutes
   */
  ageRoutes: {
    /** straight to the tour: earlier, sharper. Peak 22-26, decline from 27. */
    direct: { plateauStart: 22, declineStart: 27 },
    /** via college: today's numbers, kept. Peak 23-28, decline from 29. */
    college: { plateauStart: 23, declineStart: 29 },
  },
  /** ⭐⭐ THE PER-CAREER SPREAD, IN YEARS EITHER SIDE OF THE ROUTE'S `declineStart` (round 31 #13,
   *  his ruling: «полностью согласен, если это реализуемо»). One uniform draw off the career's
   *  own `seed:decline` sub-stream, so the age she stops performing is not the same number for
   *  everybody.
   *
   *  ⚠ development.declineSpreadYears: WHY 1.5, AND IT IS READ OFF HIS OWN REFERENCE RATHER THAN PICKED.
   *  ⚠ development.declineSpreadYears: AND THE TWO ROUTES THEN OVERLAP, WHICH IS THE POINT.
   *  ⚠ development.declineSpreadYears: `plateauStart` DOES NOT GET THE SPREAD
   *  → docs/notes/economy/development.md#developmentdeclinespreadyears
   */
  declineSpreadYears: 1.5,
  /** ⭐⭐ ROUND 31 #13 – WHAT A BROKEN BODY COSTS HER AT THE FAR END: years of peak lost per week
   *  she has spent off court, counted off `weeksLostSoFar` (the monotone v40 total, never the
   *  pruned `injuryHistory`).
   *
   *  ⚠ development…declinePullPerInjuryWeek: SCALED TO LOSE YEARS, NOT WEEKS
   *  ⚠ development…declinePullPerInjuryWeek: IT IS NOT A SECOND INJURY PENALTY.
   *  → docs/notes/economy/development.md#developmentdeclinepullperinjuryweek
   */
  declinePullPerInjuryWeek: 0.025,
  /** The plan slider, end to end. Roughly a factor of two between coasting and committing. */
  trainAt60: 0.72,
  trainAt85: 1.28,
  /* ⚠ THE COACH MOVED OUT (coach-tiers slice). `coachParent: 0.82` and `coachHired: 1.15` lived
   * here; they are now the two ENDS of `ECONOMY.coach.developmentFactor`, beside the prices they
   * are traded against, because "what a rung costs" and "what a rung is worth" are one decision
   * and were never legible split across two objects. Neither value changed. */
  /** Competition teaches what practice cannot – capped, because a fourth match in a week is
   *  fatigue, not education, and the condition model already charges her for that. */
  matchBonus: 0.18,
  matchBonusCap: 3,
  /** One draw per week, shared across the four attributes: a good week is a good week. */
  weekLuck: [0.55, 1.45] as [number, number],
  /** Past the peak, composure keeps creeping up – the veteran is slower and calmer. */
  veteranPoise: 0.004,
} as const
