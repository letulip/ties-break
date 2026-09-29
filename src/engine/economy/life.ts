// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/life.md#the-life-block

// ⭐⭐ THE PRIVATE LIFE, WAVE 3 – «SOMEONE EXISTS»: WHETHER HE ARRIVES, AND WHEN THE PARENT
// HEARS – ITS OWN BLOCK BESIDE `spirit` AND `bond` for the reason those two are beside each
// other rather than nested: three numbers, three rules. Spirit is weather, bond is a
// relationship, and THIS is a biography – a thing that happens to her once and then stays
// happened.
//
// ⚠ life: EVERY VALUE BELOW IS SOURCED TO `docs/specs/who-she-is-2026-09.md` §4
// ⚠ life: Two of them are the architect's concretisations rather than the spec's own rows and are marked where they sit…
// ⚠ life: THE LIFT THAT BELONGS TO THIS LAYER IS NOT HERE.
// ⚠⚠ life: THE BRIEF'S §4 TABLE LISTS IT UNDER THIS BLOCK AND THE BRIEF IS WRONG ON THAT ROW
// → docs/notes/economy/life.md#life
export const life = {
  /** ⭐ THE AGE GATE – RULED 23.08 and confirmed for this wave. Read against `kidAgeExact`, the
   *  FRACTIONAL age, so a girl turns eligible in the week she turns sixteen and not in the January
   *  of the year she will. A whole-years read would have handed a December girl eleven free
   *  months. */
  ageGate: 16,
  /** The step in the hazard below: under this she is at school and the base rate is the low one,
   *  from it she is not. Named rather than inlined so the two rows below cannot drift from it. */
  adultFrom: 18,
  /** THE BASE WEEKLY ARRIVAL HAZARD, before temperament (who-she-is §4, on the build plan's base:
   *  «arrival 1.0%/wk before 18, 2.5% from 18»). Per WEEK, not per season: the roll is one uniform
   *  on `seed:life:arrival:<week>` and nothing accumulates between weeks. */
  arrivalPerWeek: { minor: 0.010, adult: 0.025 },
  /** ...and how hard each girl leans on it (who-she-is §4's hazard-multiplier table, verbatim).
   *  ⚠ THE CENSUS BARS ARE THIS TABLE'S OTHER FACE – the expected biographies in the same row of
   *  the same table («fiery ~4–6 romances, quiet first arrival median ~18») are what T11 measures,
   *  so a number moved here moves an acceptance bar and is never a local tweak. */
  temperamentMult: { sunny: 1.2, fiery: 1.6, quiet: 0.6, deep: 0.5 },
  /** ⭐⭐⭐ v75 (the private life, wave 4 – T2) – THE BASE WEEKLY **END** HAZARD, before temperament
   *  (who-she-is §4, verbatim: «end 1.2%/wk»). Per WEEK while an attachment is ACTIVE, and it
   *  counts from `sinceWeek` and never from `knownWeek`: a romance can end before the parent ever
   *  knew it existed, which is the whole of the told-late scene wave 4 is built on.
   *
   *  ⚠ ONE NUMBER AND NO AGE STEP, unlike `arrivalPerWeek` one row up. §4's end column is a single
   *  rate: whether she is sixteen or twenty-two changes how often somebody APPEARS, and the spec
   *  says nothing about it changing how long it lasts. A second row invented here would be a design
   *  decision wearing a constant. */
  endsPerWeek: 0.012,
  /** ...and how hard each girl leans on THAT (who-she-is §4's `end` column, verbatim).
   *
   *  ⚠⚠ life.endsMult: A TABLE OF ITS OWN AND **NEVER** `temperamentMult` OVERLOADED
   *  ⚠ life.endsMult: AND THE TWO COLUMNS DO NOT EVEN AGREE ON THEIR ORDER, which is the design speaking
   *  → docs/notes/economy/life.md#lifeendsmult
   */
  endsMult: { sunny: 0.6, fiery: 1.5, quiet: 0.35, deep: 0.9 },
  /** THE WEEKS AFTER AN ENDING BEFORE ANYONE MAY APPEAR AGAIN (who-she-is §4, the `cooldown`
   *  column).
   *
   *  ⚠ life.cooldownWeeks: The ordering does the rest by construction – `rollEnds` runs BEFORE `rollArrival` in the same tick…
   *  → docs/notes/economy/life.md#lifecooldownweeks
   */
  cooldownWeeks: { fiery: 12, sunny: 26, quiet: 39, deep: 52 },
  /** THE RAW FEED LAG, in weeks, by her OPENNESS REGISTER (who-she-is §4, «Feed lag», verbatim:
   *  open – 0 with p 0.70, else uniform 1..4; private – 0 with p 0.10, else uniform 2..12).
   *
   *  ⚠ life.lag: THE BAR ITSELF DID NOT MOVE AND MUST NOT
   *  ⚠ life.lag: INDEXED BY THE REGISTER SHE WAS BORN WITH, not by the `wants` she drew for this particular attachment.
   *  ⚠ life.lag: RAW, and the bond band shortens it afterwards (`bondShave`).
   *  → docs/notes/economy/life.md#lifelag
   */
  lag: {
    open: { zeroChance: 0.70, min: 1, max: 4 },
    private: { zeroChance: 0.10, min: 2, max: 12 },
  },
  /** HOW HEAVILY THE `wants` DRAW LEANS ON HER OWN REGISTER (who-she-is §4, «Wants weights»: «open
   *  girls draw `open` ... at ~70%»). A TENDENCY and never a rule – the other 30% is the whole
   *  reason the want is drawn instead of read off the temperament, and it is what stops an open
   *  girl being a stereotype who never once keeps something to herself. */
  wantsOwnRegister: 0.70,
  /** ⚠ THE BOND SHAVE – THE ARCHITECT'S CONCRETISATION (wave-3 brief §4), bench-visible, NOT a
   *  ruling: the divisor the raw lag is floored by, read off the bond band AT the arrival week.
   *  who-she-is §2a channel 1 is the design it serves – «she trusts THIS parent» – and 1 is the
   *  identity, so `strained` and `cold` pay the raw lag in full.
   *
   *  ⚠⚠ THIS IS THE ONE PLACE IN THE WAVE WHERE A PLAYER CHOICE IS ALLOWED TO SHOW, and it is
   *  deliberate. The DRAW is keyed on (seed, calendar) alone, so `sinceWeek` is identical across
   *  every run of one seed – CLAUDE.md invariant 2's input-independence, intact. The SHAVE is a
   *  pure function of the relationship the player built, so `knownWeek` MAY differ between runs.
   *  That is the relationship affecting DISCLOSURE, not the world's dice being re-rolled. */
  bondShave: { close: 3, steady: 2, strained: 1, cold: 1 },
  /** ⭐⭐ TIER-1 SMALL TALK, PER WEEK, BY BOND BAND (wave-3 brief §4's last row, verbatim) – ⚠ THE
   *  ARCHITECT'S PROPOSAL AND MARKED AS ONE THERE, bench-visible, NOT a ruling. It is sourced to
   *  who-she-is §5b's frequency column, which is prose rather than a number: «a few per season at
   *  `close`; none at `cold`».
   *
   *  ⚠ life.smallTalkPerWeek: THE RULING THAT CAME WITH IT, kept where the numbers are: NO AGE GATE.
   *  ⚠⚠ life.smallTalkPerWeek: THE TWO ZEROES ARE A SHORT-CIRCUIT AND NEVER A COMPARISON.
   *  ⚠ life.smallTalkPerWeek: AND «NONE AT COLD» IS THE DESIGN RATHER THAN A FLOOR
   *  → docs/notes/economy/life.md#lifesmalltalkperweek
   */
  smallTalkPerWeek: { close: 0.08, steady: 0.04, strained: 0, cold: 0 },
  /** ⭐⭐⭐ v74 T15 – HOW LONG A SOFT ROW STAYS ANSWERABLE: THE RAISE WEEK AND THE TWO AFTER IT
   *  (who-she-is §5b's SOFT BLOCK CONCRETIZED amendment, 11.09: «a soft row is live for 3 weeks
   *  (the raise week + 2)»).
   *
   *  ⚠⚠ life.smallTalkTtlWeeks: LIVENESS IS **DERIVED** FROM `week − row.week` AND IS NEVER STORED
   *  ⚠ life.smallTalkTtlWeeks: 3 IS «THE RAISE WEEK + 2» AND THE COMPARISON IS STRICTLY `<`
   *  → docs/notes/economy/life.md#lifesmalltalkttlweeks
   */
  smallTalkTtlWeeks: 3,
  /** THE HARD CAP PER SEASON (brief §4: «cap 4/season»), counted off `lifeLog` itself.
   *
   *  ⚠⚠ life.smallTalkCapPerSeason: THE LOG IS THE COUNTER AND THERE IS NO NEW STATE
   *  ⚠ life.smallTalkCapPerSeason: THE COUNT IS `'small-talk'` ROWS OF **THIS** SEASON AND NOTHING ELSE.
   *  → docs/notes/economy/life.md#lifesmalltalkcapperseason
   */
  smallTalkCapPerSeason: 4,
  /** ⭐⭐⭐ v74 T17 – WHAT IT TAKES FOR HER TO WANT TO STOP (the owner's ruling of 11.09, made on
   *  his own playtest: his world #5, healthy, close home, met «I want to finish» at eighteen).
   *
   *  ⚠⚠ life.forkStop: THE SHAPE IS THE RULING AND THE THREE NUMBERS ARE **DRAFT FOR THE BENCH**
   *  ⚠ life.forkStop: THE TAIL IS PRICED, NOT REMOVED.
   *  ⚠ life.forkStop: `strained` IS THE MIRROR OF `close` and is measured off the distance BELOW `bond.start`…
   *  → docs/notes/economy/life.md#lifeforkstop
   */
  forkStop: { floor: 0.12, gainWorn: 2.5, gainStrained: 2.0 },
  /** ⭐⭐ THE DRIVER'S THRESHOLD – the one number that decides which ROOT her stop line and the
   *  coach's counsel are worded from (`worn > this` → `'worn'`, else `strained > this` →
   *  `'strained'`, else `'own'`).
   *
   *  ⚠⚠ life.forkStopDriverFrom: IT IS SPENT ON WORDING AND ON NOTHING ELSE.
   *  ⚠ life.forkStopDriverFrom: 0.15 IS «SOMETHING REAL RATHER THAN ROUNDING»
   *  → docs/notes/economy/life.md#lifeforkstopdriverfrom
   */
  forkStopDriverFrom: 0.15,
  /** ⭐⭐⭐ HER WALLS AND HER REGULATION – who-she-is §2a's leanings, their hysteresis and the
   *  hazard that flips a pole (v76, wave 5's T7). The one reader is `driftWalls`
   *  (engine/spirit.ts).
   *
   *  ⚠⚠ life.walls: THE HOME IS `ECONOMY.life` AND NOT `ECONOMY.psychologist`, AND THAT IS A DELIBERATE DEPARTURE FROM THE WAVE-5 BRIEF'S…
   *  ⚠⚠ life.walls: ALL SEVEN ARE PROPOSALS AND NONE IS RULED
   *  ⚠ life.walls: THE SIGN CONVENTION IS THE ARCHITECT'S RULING N AND IS NOT NEGOTIABLE HERE
   *  → docs/notes/economy/life.md#lifewalls
   */
  walls: {
    /** ⚠ WALLS UP, PER WEEK AT A `strained`/`cold` bond – §2a's «walls RISE from neglect itself»,
     *  applied to BOTH axes (kicks close her AND dysregulate her). Subtracted from the lean, so it
     *  also eats a positive lean first: «если она стала более открытой, а ее начали пинать, то она
     *  вполне может и назад откатиться» (the owner, 09.09) is this one sign doing that work.
     *  ⚠ 1.5/wk against `flipArm` 60 is ~40 held weeks to arm – «a flip is an event of seasons». */
    risePerWeek: 1.5,
    /** ⚠ THE WALK HOME, PER WEEK AT A `close`/`steady` bond – toward 0 and NEVER PAST IT. Slower
     *  than the rise on purpose: coming back is longer than going away, and it is FREE (no hire,
     *  no focus, no money – §0.3's law, benched with `psychologistHired === false`). */
    repairPerWeek: 1.0,
    /** ⚠ BEYOND HER OWN BASELINE, PER WEEK – the slowest of the three, because it is the only one
     *  she has to WORK for: it runs ONLY while the `'herself'` focus is held AND the bond is
     *  `close`/`steady` (§2a's «BEYOND her baseline is her own work»), and ONLY on the axis that
     *  has somewhere to grow. That gate is the anti-«hugged into an extravert» dam and it is a HARD
     *  invariant, not a corridor: a caring career with no focus produces zero of this, ever. */
    growthPerWeek: 0.5,
    /** ⚠ WHERE AN AXIS ARMS, in the ONE direction birth left open to it (ruling N): a born-OPEN or
     *  born-STEADY girl arms at −this (walls up, the expressed pole inverts); a born-PRIVATE or
     *  born-INTENSE one arms at +this (her own work). The other direction arms NOTHING – for the
     *  first pair it is clamped at 0 (nowhere to grow), for the second it accumulates as real walls
     *  that change no bucket and still have to be walked back before a point of growth can be
     *  bought. That asymmetry is «repair is free, growth is work» in the arithmetic. */
    flipArm: 60,
    /** ⚠ WHERE A FLIPPED AXIS ARMS THE UN-FLIP – strictly inside `flipArm`, and the band between
     *  the two is the HYSTERESIS DEAD ZONE that arms nothing in either direction. It is what makes
     *  a flip an event of seasons rather than a flicker: at `repairPerWeek` the 20 points between
     *  60 and 40 are twenty held weeks before the un-flip can even be rolled for. */
    flipRelease: 40,
    /** ⚠ THE HAZARD ON AN ARMED AXIS-WEEK – one uniform on `seed:life:walls:<axis>:<week>`, p =
     *  this. 0.05 gives a median ~13 armed weeks (ln 0.5 / ln 0.95 = 13.5), which is the wave-5
     *  brief's own «~40 weeks of sustained pattern to arm, then a median ~13 armed weeks».
     *  ⚠ NEVER GUARANTEED IN EITHER DIRECTION (§2a): two identical patterns can differ by a season. */
    flipHazardPerWeek: 0.05,
    /** ⚠⚠ THE MAGNITUDE CAP ON THE LEAN, ±. **THE BUILDER'S ADDITION, NOT THE BRIEF'S** – §4 names
     *  six walls numbers and this is a seventh, added because without it §2a's own law is
     *  ARITHMETICALLY FALSE and reported to the architect as such rather than slipped in.
     *
     *  ⚠ life.walls.leanMax: 100 IS SIZED AGAINST THE TWO THRESHOLDS IT HAS TO LEAVE ROOM FOR, not picked round
     *  → docs/notes/economy/life.md#lifewallsleanmax
     */
    leanMax: 100,
  },
} as const
