// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/psychologist.md#the-psychologist-block

// THE PSYCHOLOGIST (the psychologist's year, docs/specs/the-psychologists-year-2026-09.md) –
// THE SECOND SALARIED SEAT, and the asymmetry with the masseur above IS the design rather than
// a saving (the travelling-team plan's §2, the owner's ruling Б: «массажист ездит, психолог
// работает дистанционно и стоит только зарплату»). So: pro-career gated and cancellable weekly
// like him, and then NO FARE, NO TRAVEL STANCE AND NO RESULTS SHARE – `staffSeatFareCents` is…
//
// ⚠⚠ psychologist: AND THE DIAL IS A DIFFERENT KIND OF THING FROM THE MASSEUR'S
// ⚠ psychologist: WHAT IS DELIBERATELY NOT HERE YET, so nobody reads the absence as an oversight…
// ⚠ psychologist: THEY LIVE HERE AND NOT IN `ECONOMY.spotlight`
// → docs/notes/economy/psychologist.md#psychologist
export const psychologist = {
  // ⚠⚠ PROPOSALS, NOT RULINGS – bench-priced, predicted-first, THE OWNER'S WORD AFTER T10, in
  // the same register the spec marks O5 with. The wave-5 brief's §4 lists them under «Proposals
  // – NONE ruled»: $100 / $200 / $400 a week.
  //
  // ⚠ psychologist.rungs: A FLAT CONTRACT PER RUNG
  // ⚠ psychologist.rungs: EACH RUNG MUST MEASURABLY BEAT THE ONE BELOW **AT THE CHOSEN FOCUS**
  // → docs/notes/economy/psychologist.md#psychologistrungs
  rungs: [
    { label: 'Counsellor', salaryCents: 100_00 },
    { label: 'Sport psychologist', salaryCents: 200_00 },
    { label: 'Tour-grade specialist', salaryCents: 400_00 },
  ],
  // What a fresh hire (and every pre-v76 save) stands on: the MIDDLE rung – the professional
  // default the prices above are anchored to, and meaningless until somebody is hired. A LITERAL 1
  // in the v76 migration, by the house rule (a shipped step must never change what it back-fills
  // because somebody later retuned a constant); keep the two in step.
  //
  // ⚠ TYPED `0 | 1 | 2` RATHER THAN `number` because `createWorld` assigns it straight into
  // `WorldState.psychologistRung`, whose type is the union. Widening it here would push a cast onto
  // the reader, which is the shape this repo keeps out of `createWorld` (the literal it replaces
  // needed none).
  defaultRung: 1 as 0 | 1 | 2,
  /** ⭐⭐⭐ «BACK ON HER FEET» – THE RECOVERY SLOPE, BY RUNG (v76, wave 5's T4). The spec's §2 row,
   *  verbatim: «the recovery slope while a shock is live: **+2 / +3 / +4 per week by rung** (the
   *  23.08 design, preserved whole as ONE focus)». Points of spirit per week, ADDED TO
   *  `ECONOMY.spirit.returnPerWeek[intensity]` inside `accrueSpirit`'s return step and nowhere
   *  else.
   *
   *  ⚠⚠ psychologist.recoverySlope: IT IS A FASTER RETURN AND NEVER A SECOND CURVE
   *  ⚠⚠ psychologist.recoverySlope: `accrueSpirit`'s own note…
   *  ⚠ psychologist.recoverySlope: INDEXED BY RUNG (`0 | 1 | 2`), WHICH IS A DIFFERENT SPELLING FROM `returnPerWeek`'s
   *  ⚠ psychologist.recoverySlope: RULED, NOT PROPOSED – unlike the salaries above.
   *  → docs/notes/economy/psychologist.md#psychologistrecoveryslope
   */
  recoverySlope: [2, 3, 4],
  /** ⭐⭐⭐ «COOL HEAD» – THE BOUNDED COMPOSURE WALK, BY RUNG (v76, wave 5's T5). The spec's §2 row,
   *  verbatim: «bounded composure growth: **+1.5 / +2.5 / +3.5 per held season by rung**, toward
   *  HER EXISTING CEILING only – it accelerates the work, it never breaks the cap». Points of
   *  `composure` per SEASON; `growWeek` spends `coolheadPerSeason[rung] / WEEKS_IN_SEASON` on
   *  each week he actually works it, and nowhere else.
   *
   *  ⚠⚠ psychologist.coolheadPerSeason: A SEASON RATE READ WEEKLY, AND THE FRACTION IS THE MECHANIC RATHER THAN A ROUNDING ACCIDENT.
   *  ⚠ psychologist.coolheadPerSeason: The owner's own anchor sizes it: her measured 7-point composure hole is two to three seasons of…
   *  ⚠⚠ psychologist.coolheadPerSeason: DECIMALS, NOT AN INDEX – and the collision with the row above is worth naming once…
   *  ⚠ psychologist.coolheadPerSeason: PROPOSALS INSIDE A RULED SHAPE
   *  ⚠ psychologist.coolheadPerSeason: MONOTONE BY CONSTRUCTION BELOW THE CEILING
   *  → docs/notes/economy/psychologist.md#psychologistcoolheadperseason
   */
  coolheadPerSeason: [1.5, 2.5, 3.5],
  /** ⭐⭐⭐ ROUND 42 #35, v78 – PAST THE CEILING: THE THREE NUMBERS ARE THE OWNER'S OWN, RULED 15.09
   *  and quoted rather than tuned. «+5 потолок, по очку за сезон, постоянный (здесь не уверен,
   *  можно всё таки небольшой откат сделать мне кажется, например 0.2пп за сезон без этой
   *  тренировки, мне кажется это вполне ок)».
   *
   *  ⚠ psychologist.composureBonusCap: IT IS FLAT ACROSS THE RUNGS, unlike `coolheadPerSeason` above…
   *  ⚠ psychologist.composureBonusCap: HIS WORD IS «пп» AND THE BONUS IS IN COMPOSURE POINTS
   *  ⚠ psychologist.composureBonusCap: ALL THREE ARE PER SEASON AND SPENT PER WEEK
   *  → docs/notes/economy/psychologist.md#psychologistcomposurebonuscap
   */
  composureBonusCap: 5,
  composureBonusPerSeason: 1,
  composureBonusDecayPerSeason: 0.2,
  /** ⭐⭐⭐ «LEARNING TO LISTEN» – THE CHANCE THE PARENT READS HER PLAINLY, BY RUNG (v76, wave 5's
   *  T6). The spec's §2 row, verbatim: «the feed line's wording becomes legible with probability
   *  **0.6 / 0.8 / 0.95 per beat by rung** – a matched reaction becomes the parent's skill, never
   *  a purchase and never a leak of her sessions (`bond` untouched)».
   *
   *  ⚠⚠ psychologist.listenClarity: IT PRICES A WORDING AND NOTHING ELSE, which is the one thing three decimals cannot say for themselves.
   *  ⚠ psychologist.listenClarity: A PROBABILITY, NOT A RATE AND NOT AN INDEX
   *  ⚠ psychologist.listenClarity: RULED, NOT PROPOSED – the wave-5 brief's §4 lists it under «Ruled by the spec §2»…
   *  → docs/notes/economy/psychologist.md#psychologistlistenclarity
   */
  listenClarity: [0.6, 0.8, 0.95],
  /** ⭐⭐⭐ «WORKING ON HERSELF» – THE BEYOND-BASELINE FLIP HAZARD'S SCALE, BY RUNG (v76, wave 5's
   *  T7). The psychologist spec's §2 row, verbatim: «rung scales the armed hazard ×1 / ×1.5 /
   *  ×2». Read by `driftWalls` (engine/spirit.ts) and by nothing else.
   *
   *  ⚠⚠ psychologist.wallsHazardScale: IN THE BEYOND-BASELINE DIRECTION ONLY, AND NEVER ON AN UN-FLIP
   *  ⚠ psychologist.wallsHazardScale: IT RIDES THE BILLING PREDICATE, like everything else of his (ruling J, ruling P's ⚠)…
   *  ⚠ psychologist.wallsHazardScale: RULED, NOT PROPOSED – the wave-5 brief §4 lists…
   *  ⚠ psychologist.wallsHazardScale: INDEXED BY RUNG (`0 | 1 | 2`), the fourth spelling in this block…
   *  → docs/notes/economy/psychologist.md#psychologistwallshazardscale
   */
  wallsHazardScale: [1, 1.5, 2],
  /** ⭐⭐ O6, RULED 13.09 – A RETAINED SEAT AT RUNG ≥ 2 SLOWS THE WALLS' RISE, ANY FOCUS. The
   *  multiplier on `ECONOMY.life.walls.risePerWeek` on a `strained`/`cold` week: «a good
   *  psychologist in the house makes the walls rise slower» (ruling N).
   *
   *  ⚠⚠ psychologist.wallsRetentionSlow: IT SLOWS THE NEGATIVE **DRIFT** AND NEVER THE HAZARD
   *  ⚠ psychologist.wallsRetentionSlow: RUNG ≥ 2 AND ANY FOCUS – it must not read off `psychologistFocus`
   *  ⚠ psychologist.wallsRetentionSlow: AND IT RIDES THE BILLING PREDICATE (ruling P's ⚠: «a standing-down seat slows nothing»)
   *  ⚠ psychologist.wallsRetentionSlow: A PROPOSAL – the wave-5 brief §4's «retention slow-down ×0.75 (rung ≥ 2)»
   *  ⚠⚠ psychologist.wallsRetentionSlow: AND THE TENTHS GRID EATS A LITTLE OF IT – the number to predict is 0.733
   *  → docs/notes/economy/psychologist.md#psychologistwallsretentionslow
   */
  wallsRetentionSlow: 0.75,

  /** ⭐⭐ THE `'herself'` REPAIR ACCELERATION – the multiplier on
   *  `ECONOMY.life.walls.repairPerWeek` while that focus is held at a `close`/`steady` bond.
   *
   *  ⚠⚠ AN ACCELERATION AND NEVER A GATE, which is §0.3's law («repair is free … the seat only ever
   *  ACCELERATES the road home») made arithmetic: the repair term runs at ×1 with nobody hired, and
   *  this multiplies a walk that was already happening. A version of this number that was required
   *  for the walk would be the design violation the brief names, not a tuning miss.
   *
   *  ⚠ IT RIDES THE BILLING PREDICATE for ruling J's reason – pay nothing, receive nothing extra.
   *  ⚠ A PROPOSAL – the brief §4's «`'herself'` repair acceleration ×1.5». */
  wallsHerselfRepair: 1.5,

  /** ⭐⭐⭐ «THE PUBLIC LIFE» – WHAT A YEAR ON THE SPOTLIGHT TAKES OFF EVERY EXPOSURE EVENT, BY RUNG
   *  (v77, wave 6's T5 – O7, ruled 13.09: «ships WITH the spotlight wave, not before it has
   *  something to shrink»). The FIFTH factor of `exposurePressure`'s product (engine/spirit.ts),
   *  and `1` on every week the seat is not working this focus.
   *
   *  ⚠⚠ psychologist.publicLifeShrink: A SHRINK AND NEVER A SHIELD, which is the one thing three decimals cannot say for themselves.
   *  ⚠ psychologist.publicLifeShrink: STRICTLY DECREASING, OR THE RUNG IS RE-PRICED
   *  ⚠ psychologist.publicLifeShrink: A MULTIPLIER ON A SPIRIT TERM, indexed by rung (`0 | 1 | 2`, the roster position)…
   *  ⚠ UNRULED – the wave-6 brief's §4 lists «`publicLifeShrink [0.85, 0.70, 0.55]`» under…
   *  → docs/notes/economy/psychologist.md#psychologistpubliclifeshrink
   */
  publicLifeShrink: [0.85, 0.7, 0.55],
  /** ⭐⭐⭐ «THE PUBLIC LIFE» – HOW MUCH FASTER SHE LEARNS TO LIVE KNOWN, BY RUNG (v77, wave 6's
   *  T5). The multiplier on `growHabituation`'s weekly `+1` (engine/spirit.ts), and `1` on every
   *  week the seat is not working this focus.
   *
   *  ⚠⚠ psychologist.publicLifeAccel: AN ACCELERATION AND NEVER A GATE
   *  ⚠⚠ psychologist.publicLifeAccel: Every entry is ≥ 1 for that reason; a value below 1 would make the seat a BRAKE on her own…
   *  ⚠⚠ psychologist.publicLifeAccel: AND IT CANNOT OUT-RUN THE WALLS, BY CONSTRUCTION RATHER THAN BY SIZE
   *  ⚠ psychologist.publicLifeAccel: STRICTLY INCREASING, OR THE RUNG IS RE-PRICED
   *  ⚠ psychologist.publicLifeAccel: THE CAP IS UNMOVED: `habituationFullWeeks`
   *  ⚠ UNRULED – the brief's §4 «`publicLifeAccel [1.5, 2.0, 2.5]`», in the same «NONE ruled» list as its sibling above.
   *  → docs/notes/economy/psychologist.md#psychologistpubliclifeaccel
   */
  publicLifeAccel: [1.5, 2, 2.5],
  /** ⭐⭐ WHERE THE FIFTH FOCUS'S RECEIPT PRINTS – the habituation-SCALE point whose first crossing,
   *  with the year being worked that week, prints «The cameras stopped costing her sleep.» The
   *  owner's D2 (14.09, «да»), on the strings doc's own trigger proposal and `RECOVERY_RECEIPT`'s
   *  13.09 precedent: the sentence stood, the TRIGGER was the design decision. 0.5 = halfway from
   *  first-news to the shrug. ⚠ ONCE-EVER BY MONOTONICITY, NOT BY A STAMP: `spotlightHabituation`
   *  never decays (v1's own law), so the crossing happens at most once per career and no schema
   *  field is spent on remembering it. ⚠ A PROPOSAL – the POINT is benchable, his word after. */
  publicLifeReceiptAt: 0.5,
} as const
