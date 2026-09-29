// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/weight.md#the-weight-block

/** ⭐⭐⭐ v87 – **THE WEIGHT** (wave 11; docs/specs/the-weight-2026-09.md, the design
 *  docs/design/the-months-before-she-says-2026-09.md, the research
 *  docs/research/pregnancy-in-sport-2026-09.md). The layer's last step: the pregnancy that ends,
 *  and the death in the family. Both behind ONE switch, `world.weightEnabled`, RULED 22.09.
 *
 *  ⚠⚠ **THE ONE THING THIS BLOCK MUST NEVER MODEL IS THE PARENT AS THE CAUSE, AND IT IS A FINDING
 *  RATHER THAN A SCRUPLE.** The design's §2, the research's §6.3: nothing in the evidence supports
 *  training as a cause of a pregnancy loss, the IOC summary's concern is contact and falls, and AGE
 *  DOMINATES THE VARIANCE. A game where a hard training block CAUSES a loss is asserting something
 *  untrue and is telling every player the sentence women already hear too often. So the hazard
 *  below takes AGE and the dice, and its signature is written so the read-set is visible from the
 *  outside – `pregnancyLossChanceAt(ageYears)` takes no world at all, which is a fence a refactor
 *  cannot quietly move. ⚠ The same law binds the bereavement: temperament-free, world's dice. */
export const weight = {
  /** ⭐⭐⭐ **THE WEEKLY LOSS HAZARD, BY AGE** – per-week rates that integrate to the research's
   *  J-curve over the window the research itself defines. DRAFTED; T6's bench confirms the
   *  integral, and his word finalises.
   *
   *  ⚠⚠ weight.lossPerWeekByAge: THE TOTALS ARE THE PRIMARY SOURCE'S, QUOTED AS THE NUMERATORS THEY ARE
   *  ⚠⚠ weight.lossPerWeekByAge: **THE INTEGRAL RUNS OVER 14 WEEKS AND NOT OVER THE 39-WEEK TERM…
   *  ⚠ weight.lossPerWeekByAge: SPREADING THE SAME TOTAL OVER ALL 39 WEEKS WOULD SHIP A DIFFERENT EVENT
   *  ⚠ weight.lossPerWeekByAge: READ AS RUNGS, `motherhood.perWeekByAge`'s
   *  ⚠ weight.lossPerWeekByAge: 24 TAKES THE 25–29 RATE because the study's floor band is the lowest it publishes inside our window…
   *  ⚠ weight.lossPerWeekByAge: NO RUNG ABOVE 35: the game's window closes at 38 and the study's 35–39 band covers all of it…
   *  → docs/notes/economy/weight.md#weightlossperweekbyage
   */
  lossPerWeekByAge: [
    // 24–29 – the J-curve's floor, and the lowest single year in the study is 27 at 9.5%.
    { fromAge: 24, perWeek: 1 - Math.pow(1 - 0.098, 1 / 14) },
    // 30–34 – barely above the floor, which is the finding rather than the middle of a slope.
    { fromAge: 30, perWeek: 1 - Math.pow(1 - 0.108, 1 / 14) },
    // 35+ – the climb. Half again on the floor, and the reason a flat rate would be wrong.
    { fromAge: 35, perWeek: 1 - Math.pow(1 - 0.167, 1 / 14) },
  ],
  /** ⭐⭐ THE FIRST WEEK AFTER THE CONCEPTION THE HAZARD CAN FIRE ON, and the last (EXCLUSIVE) –
   *  the research's own recognised-pregnancy window, mapped onto the conception clock. See
   *  `lossPerWeekByAge`'s block for the mapping and for why the integral runs over these fourteen
   *  weeks rather than over the whole term.
   *
   *  ⚠ THE WINDOW OFTEN CLOSES BEFORE SHE HAS EVEN TOLD HIM, and that is the arithmetic rather
   *  than a design decision: a private girl's hidden window runs up to 12 weeks, so a loss can land
   *  on a pregnancy the parent never knew existed. The design's §4 row for `deep` – «the one who
   *  may not tell him at all» – is exactly this case, and T4's words are written for both sides of
   *  it. */
  lossFromWeek: 4,
  lossUntilWeek: 18,
  /** ⭐⭐ HOW SOON AFTER A LOSS THE PREGNANCY HAZARD MAY FIRE AGAIN – DRAFTED 26, against the
   *  BIRTH's 52 (`motherhood.repeatCooldownWeeks`). The spec's §3: «a loss re-arms the pregnancy
   *  hazard behind a gentler cooldown, reading the same eligibility machinery wave 9 built».
   *
   *  ⚠ weight.lossCooldownWeeks: GENTLER FOR A MECHANICAL REASON AND NOT A KIND ONE
   *  → docs/notes/economy/weight.md#weightlosscooldownweeks
   */
  lossCooldownWeeks: 26,
  /** ⭐⭐⭐ **A DEATH IN THE FAMILY** (the spec's §4; his 23.08 «вплести похороны» and the numbers
   *  he drafted on 11.09). ⭐ RULED 22.09 (question 3): **his 11.09 figures enter as DRAFTED
   *  CONSTANTS** – the bench confirms the corridor, his word finalises.
   *
   *  ⚠⚠ weight.bereavement: **THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN**: a death is the world's dice…
   *  ⚠ weight.bereavement: THE ARITHMETIC, IN FULL, because his own words on 11.09 are the corridor T6 measures against rather than a…
   *  → docs/notes/economy/weight.md#weightbereavement
   */
  bereavement: {
    /** the weekly chance, from the adult rung. ⚠ A **RATE** AND NOT A GATE – the gate is the rung. */
    perWeek: 0.0008,
    /** ⭐⭐ THE FLOOR IN WEEKS BETWEEN TWO OF THEM – his 11.09 «spacing ≥ 156». Three years, which
     *  is `motherhood.protectedRankWeeks`' own span read for a different reason: two deaths inside
     *  a season would read as a mechanic rather than as a life, and the spacing is what stops the
     *  dice telling that story. ⚠ IT READS `world.bereavementWeeks` and never a derived guess. */
    spacingWeeks: 156,
    /** ⭐⭐ AND THE HARD CAP – his 11.09 «hard cap 2 per career». ⚠ A CAP AND NOT A SHAPED DECAY,
     *  deliberately: a third is not rarer, it is absent, because past two the arc stops being a
     *  life and starts being a theme. */
    capPerCareer: 2,
    /** ⭐⭐ THE RUNG NOTHING FIRES BELOW – `kidAgeExact >= 23`, his 23.08 «начиная со ступени
     *  adult». ⚠⚠ **THE ASSET ENFORCES WHAT THE GATE PROMISES**, which is why this number is not
     *  merely a taste: `fem-euro-brunnet-adult-funeral.webp` exists at the `adult` band and at no
     *  other, so a bereavement below it would have no picture to wear. The 11.09 log says so in as
     *  many words – «Funeral exists at `adult` ONLY – the asset enforces his 23.08 by
     *  construction». */
    fromAgeYears: 23,
  },
} as const
