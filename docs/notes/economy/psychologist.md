---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The psychologist block

The comment essays that stood above the `psychologist` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `psychologist`

```ts
  // --- THE PSYCHOLOGIST (the psychologist's year, docs/specs/the-psychologists-year-2026-09.md) ---
  // THE SECOND SALARIED SEAT, and the asymmetry with the masseur above IS the design rather than a
  // saving (the travelling-team plan's §2, the owner's ruling Б: «массажист ездит, психолог работает
  // дистанционно и стоит только зарплату»). So: pro-career gated and cancellable weekly like him,
  // and then NO FARE, NO TRAVEL STANCE AND NO RESULTS SHARE – `staffSeatFareCents` is never asked
  // for this seat and `staffShare` above stays `'coach' | 'masseur'` (O3, ruled 13.09: he is not in
  // the box on match day; his product is the year, not the title).
  //
  // ⚠⚠ AND THE DIAL IS A DIFFERENT KIND OF THING FROM THE MASSEUR'S, which is why the rung is an
  // INDEX and not a quantity. His dial buys a BUSIER CALENDAR (2/4/7 sessions a week, and the bill
  // is sessions × a rate). This one is ONE SESSION A WEEK AT EVERY RUNG – the spec's own «the rung
  // buys WHO comes to the call» – so there is no quantity to multiply and the price is simply the
  // person's weekly retainer. A rung here is a position in a three-member roster, `0 | 1 | 2`.
  //
  // ⚠ WHAT IS DELIBERATELY NOT HERE YET, so nobody reads the absence as an oversight: the four
  // focus tables (`recoverySlope` T4, `coolheadPerSeason` T5, `listenClarity` T6, the walls'
  // beyond-baseline hazard scale T7 – all four ruled in the spec's §2 and quoted in the wave-5
  // brief's §4) land with the passes that READ them. T2 ships the seat and the seat's price, and a
  // constant with no reader is a constant nobody can be wrong about yet.
  // ⭐ T4 (v76) LANDED THE FIRST OF THE FOUR – `recoverySlope`, below, with `accrueSpirit`'s own
  // reader in the same commit, exactly as the rule above requires. Three remain.
  // ⭐ T5 (v76) LANDED THE SECOND – `coolheadPerSeason`, below, with `growWeek`'s own reader in the
  // same commit. Two remain (`listenClarity` T6, the walls' hazard scale T7).
  // ⭐⭐ AND THE LIST IS CLOSED: v76's T6 and T7 landed the last two, and **v77's T5 adds a FIFTH
  // FOCUS the wave-5 forecast could not name** – «The public life» (O7, ruled 13.09), whose two
  // ladders `publicLifeShrink` and `publicLifeAccel` land at the foot of this block with their one
  // reader (`engine/spirit.ts` – the pressure term and the habituation growth) in the same commit,
  // which is the rule this block has kept since T2. ⚠ THEY LIVE HERE AND NOT IN `ECONOMY.spotlight`
  // by the spotlight block's own instruction: they are the SEAT's price list, keyed on the rung the
  // family is paying for, and `ECONOMY.spotlight` holds only what is true of a career with nobody
  // hired.
```

## `psychologist.rungs`

```ts
    // ⚠⚠ PROPOSALS, NOT RULINGS – bench-priced, predicted-first, THE OWNER'S WORD AFTER T10, in the
    // same register the spec marks O5 with. The wave-5 brief's §4 lists them under «Proposals – NONE
    // ruled»: $100 / $200 / $400 a week. What they are sized AGAINST is the game's own scale and the
    // spec's §3 table: the counsellor sits BELOW the masseur's entry rung ($150/wk – a weekly hour,
    // not a specialist), the sport psychologist between his entry and default rungs ($300/wk) and is
    // the DEFAULT, and the tour-grade specialist lands in the high coach's neighbourhood ($500/wk).
    // The travelling-team plan's own sizing sketch («psychologist salary ≈ a third» of a coach rung)
    // is what those three land on when it is read against the roster the game actually sells.
    //
    // ⚠ A FLAT CONTRACT PER RUNG: no corridor, no jitter, NO DRAW ON ANY STREAM – the masseur's own
    // legibility argument, which is stronger here because there is not even a session count to
    // multiply. The ledger row is the number on the card, every week.
    //
    // ⚠ EACH RUNG MUST MEASURABLY BEAT THE ONE BELOW **AT THE CHOSEN FOCUS** or it is re-priced (the
    // masseur spec's §4 law, applied per focus by the spec's §3). That is T10's 4×3 grid; T2 can
    // only make the ladder exist.
```

## `psychologist.recoverySlope`

```ts
    /** ⭐⭐⭐ «BACK ON HER FEET» – THE RECOVERY SLOPE, BY RUNG (v76, wave 5's T4). The spec's §2 row,
     *  verbatim: «the recovery slope while a shock is live: **+2 / +3 / +4 per week by rung** (the
     *  23.08 design, preserved whole as ONE focus)». Points of spirit per week, ADDED TO
     *  `ECONOMY.spirit.returnPerWeek[intensity]` inside `accrueSpirit`'s return step and nowhere
     *  else.
     *
     *  ⚠⚠ IT IS A FASTER RETURN AND NEVER A SECOND CURVE, which is the one thing a later reader
     *  cannot recover from the three numbers. `accrueSpirit`'s own ⚠⚠ note («THERE IS NO RECOVERY
     *  CURVE, ANYWHERE, BY DESIGN … a second return rate, a «recovering» flag or a taper read off
     *  `spiritShock` would all be the same mistake») still governs: this is a SUMMAND on the
     *  standing rate, it goes through the same `stepToward` clamp and the same tenths rounding, and
     *  it dies with the clear because the predicate that gates it reads the live mark. No taper, no
     *  flag, no second target.
     *
     *  ⚠ INDEXED BY RUNG (`0 | 1 | 2`), WHICH IS A DIFFERENT SPELLING FROM `returnPerWeek`'s and the
     *  collision is worth naming once: `ECONOMY.spirit.returnPerWeek` is an OBJECT keyed by the
     *  intensity NAME (`{steady, intense}`) and this is an ARRAY indexed by the roster position.
     *  The two are summed on one line in `accrueSpirit` and a reader who mixes them gets
     *  `undefined`; the rungs are the same `0 | 1 | 2` that indexes `rungs` above.
     *
     *  ⚠ RULED, NOT PROPOSED – unlike the salaries above. The wave-5 brief's §4 lists it under
     *  «Ruled by the spec §2», so T10's grid MEASURES this ladder rather than pricing it: each rung
     *  strictly better than the one below on weeks-under-the-knee, by more than 2×SEM, or the
     *  masseur §4 law re-prices the RUNG and not this row. */
```

## `psychologist.coolheadPerSeason`

```ts
    /** ⭐⭐⭐ «COOL HEAD» – THE BOUNDED COMPOSURE WALK, BY RUNG (v76, wave 5's T5). The spec's §2 row,
     *  verbatim: «bounded composure growth: **+1.5 / +2.5 / +3.5 per held season by rung**, toward
     *  HER EXISTING CEILING only – it accelerates the work, it never breaks the cap». Points of
     *  `composure` per SEASON; `growWeek` spends `coolheadPerSeason[rung] / WEEKS_IN_SEASON` on each
     *  week he actually works it, and nowhere else.
     *
     *  ⚠⚠ A SEASON RATE READ WEEKLY, AND THE FRACTION IS THE MECHANIC RATHER THAN A ROUNDING
     *  ACCIDENT. 3.5 / 52 = 0.0673 of a point a week, and `KidSkills` fields are plain `number`s that
     *  `growWeek` never rounds – measured before the term was written, because an integer skill would
     *  have made the whole focus dead on arrival (every week's term would truncate to nothing). The
     *  owner's own anchor sizes it: her measured 7-point composure hole is two to three seasons of
     *  rung-2 work, «not a purchase» (the spec's ⚠ under the table).
     *
     *  ⚠⚠ DECIMALS, NOT AN INDEX – and the collision with the row above is worth naming once, as
     *  that row names its own: `recoverySlope` is POINTS OF SPIRIT PER WEEK, this is POINTS OF A
     *  SKILL PER SEASON. Both are indexed by the same rung (`0 | 1 | 2`, the roster position), and
     *  the two must never be read into each other's arithmetic.
     *
     *  ⚠ PROPOSALS INSIDE A RULED SHAPE – O5, the spec's §6: «the +1.5/+2.5/+3.5 season rates and the
     *  own-ceiling cap are bench proposals; measured against the training-only control before any
     *  ruling». So T10's grid PRICES these three numbers (growth against a training-only arm, more
     *  than 2×SEM per rung, zero at the ceiling proven) while the shape they sit in – a per-week
     *  summand beside training growth, clamped at her own ceiling – is ruled and stays.
     *
     *  ⚠ MONOTONE BY CONSTRUCTION BELOW THE CEILING: the three are strictly increasing and the term
     *  is `min(rate, headroom)`, so a higher rung is never worth less than a lower one on any week –
     *  the equality case is the ceiling, where all three are 0 and the focus is finished. */
```

## `psychologist.composureBonusCap`

```ts
    /** ⭐⭐⭐ ROUND 42 #35, v78 – PAST THE CEILING: THE THREE NUMBERS ARE THE OWNER'S OWN, RULED
     *  15.09 and quoted rather than tuned. «+5 потолок, по очку за сезон, постоянный (здесь не
     *  уверен, можно всё таки небольшой откат сделать мне кажется, например 0.2пп за сезон без этой
     *  тренировки, мне кажется это вполне ок)».
     *
     *  `composureBonusCap` – how far above her rolled ceiling sustained work can carry her, in
     *  composure points. Five is about a fifth of the biggest nerve draw the game deals
     *  (`potentialBand` tops out at +26), so the seed still decides who she is and the seat decides
     *  how much further than that a patient family can take her.
     *
     *  `composureBonusPerSeason` – a season of continuous work on the `'coolhead'` focus is worth
     *  exactly one point of headroom, so the cap is a FIVE-SEASON project and nobody buys it inside
     *  one wave. ⚠ IT IS FLAT ACROSS THE RUNGS, unlike `coolheadPerSeason` above, and that is the
     *  design rather than an omission: the rung already prices how fast she CLIMBS to a ceiling, and
     *  pricing how high the ceiling goes on the same dial would pay the top rung twice for one
     *  purchase. The owner named one number, not three.
     *
     *  `composureBonusDecayPerSeason` – what an idle season costs. ⚠ HIS WORD IS «пп» AND THE BONUS
     *  IS IN COMPOSURE POINTS, so this is READ as a fifth of a point per idle season – a fifth of
     *  the earning rate, so a family that stops working keeps almost all of it and a full +5 takes
     *  twenty-five idle seasons to unwind, which is longer than any career. That reading is written
     *  down in round 42 #35 rather than assumed silently; if he meant a fifth of a percentage point
     *  of match win rate, this constant is where the correction lands.
     *
     *  ⚠ ALL THREE ARE PER SEASON AND SPENT PER WEEK (`composureBonusAfterWeek` divides by
     *  `WEEKS_IN_SEASON`), which is `coolheadPerSeason`'s own shape three lines up. A whole season
     *  worked is exactly +1 and a whole season idle exactly −0.2; a part season is proportional,
     *  which is what keeps «continuous» from needing an invented threshold on a seat that STANDS
     *  DOWN by design for a college freeze and a booked family week. */
```

## `psychologist.listenClarity`

```ts
    /** ⭐⭐⭐ «LEARNING TO LISTEN» – THE CHANCE THE PARENT READS HER PLAINLY, BY RUNG (v76, wave 5's
     *  T6). The spec's §2 row, verbatim: «the feed line's wording becomes legible with probability
     *  **0.6 / 0.8 / 0.95 per beat by rung** – a matched reaction becomes the parent's skill, never a
     *  purchase and never a leak of her sessions (`bond` untouched)».
     *
     *  ⚠⚠ IT PRICES A WORDING AND NOTHING ELSE, which is the one thing three decimals cannot say for
     *  themselves. One uniform on `seed:psy:listen:<kind>:<week>` decides whether the card's heading
     *  and the kept feed row say plainly what she wants; the bond deltas, her drawn `wants`, the
     *  space-vs-company read and the priced option set are the SAME BYTES on both sides of it
     *  (`tests/wave5-psychologist-listen.test.ts` §D deep-equals the priced sets across the toggle).
     *  A rung that bought a better PRICE would be the purchase the spec's own sentence forbids.
     *
     *  ⚠ A PROBABILITY, NOT A RATE AND NOT AN INDEX – the third spelling in this block and the
     *  collision is worth naming once, as its two neighbours name theirs: `recoverySlope` is POINTS
     *  OF SPIRIT PER WEEK, `coolheadPerSeason` is POINTS OF A SKILL PER SEASON, and this is a SHARE
     *  OF BEATS, 0..1, compared against one uniform. All three are indexed by the same rung
     *  (`0 | 1 | 2`, the roster position) and none of their arithmetic may be read into another's.
     *
     *  ⚠ RULED, NOT PROPOSED – the wave-5 brief's §4 lists it under «Ruled by the spec §2», so
     *  T10's grid MEASURES this ladder (the realised clarity inside the CI of each number, the
     *  matched-reaction share monotone in rung) rather than pricing it. */
```

## `psychologist.wallsHazardScale`

```ts
    /** ⭐⭐⭐ «WORKING ON HERSELF» – THE BEYOND-BASELINE FLIP HAZARD'S SCALE, BY RUNG (v76, wave 5's
     *  T7). The psychologist spec's §2 row, verbatim: «rung scales the armed hazard ×1 / ×1.5 / ×2».
     *  Read by `driftWalls` (engine/spirit.ts) and by nothing else.
     *
     *  ⚠⚠ IN THE BEYOND-BASELINE DIRECTION ONLY, AND NEVER ON AN UN-FLIP – the architect's ruling N,
     *  and the sentence that decides it is «the seat accelerates her own work and never her
     *  collapse». So the scale applies to exactly one draw in the whole model: the FLIP of an axis
     *  that has somewhere to grow. A born-open girl's walls-up flip, and every un-flip in either
     *  direction, are ×1 whatever the family is paying – a better psychologist does not make a
     *  collapse likelier, and he is not what un-does one either (repair is free and needs no dice
     *  scaled for it).
     *
     *  ⚠ IT RIDES THE BILLING PREDICATE, like everything else of his (ruling J, ruling P's ⚠): a
     *  college-freeze week and a booked family week stand the scale down with the bill.
     *
     *  ⚠ RULED, NOT PROPOSED – the wave-5 brief §4 lists «the beyond-baseline hazard scale [1, 1.5,
     *  2]» under «Ruled by the spec §2», so T10's grid MEASURES this ladder (flip medians monotone in
     *  rung) rather than pricing it. ⚠ INDEXED BY RUNG (`0 | 1 | 2`), the fourth spelling in this
     *  block: `recoverySlope` is POINTS OF SPIRIT PER WEEK, `coolheadPerSeason` POINTS OF A SKILL PER
     *  SEASON, `listenClarity` a SHARE OF BEATS, and this a MULTIPLIER ON A PROBABILITY. */
```

## `psychologist.wallsRetentionSlow`

```ts
    /** ⭐⭐ O6, RULED 13.09 – A RETAINED SEAT AT RUNG ≥ 2 SLOWS THE WALLS' RISE, ANY FOCUS. The
     *  multiplier on `ECONOMY.life.walls.risePerWeek` on a `strained`/`cold` week: «a good
     *  psychologist in the house makes the walls rise slower» (ruling N).
     *
     *  ⚠⚠ IT SLOWS THE NEGATIVE **DRIFT** AND NEVER THE HAZARD – ruling N's own warning about the two
     *  multipliers being swapped. Once the walls are up and the axis is armed, he does not make the
     *  flip less likely; what he buys is the seasons it takes to get there.
     *
     *  ⚠ RUNG ≥ 2 AND ANY FOCUS: this is the second legible thing the RETAINER buys, so it must not
     *  read off `psychologistFocus` – a family working on «cool head» still has him in the house.
     *  ⚠ AND IT RIDES THE BILLING PREDICATE (ruling P's ⚠: «a standing-down seat slows nothing»).
     *  ⚠ A PROPOSAL – the wave-5 brief §4's «retention slow-down ×0.75 (rung ≥ 2)», priced at the
     *  census, his word after.
     *
     *  ⚠⚠ AND THE TENTHS GRID EATS A LITTLE OF IT, WHICH T10 MUST PREDICT OR IT WILL READ A CORRECT
     *  IMPLEMENTATION AS A MISS (ruling M's lesson, one focus over). The lean is stored to ONE
     *  DECIMAL, so a slowed week is `roundTenth(1.5 × 0.75) = roundTenth(1.125) = 1.1` and the
     *  REALISED slow-down is ≈ ×0.733 rather than ×0.75. Measured, not derived after the fact:
     *  tests/wave5-psychologist-walls.test.ts §F asserts the rounded value and says so. The grid is
     *  the field's own (spirit's, one concept over) and the arithmetic is not going to be un-rounded
     *  for a multiplier's sake – so the number to predict is 0.733. */
```

## `psychologist.publicLifeShrink`

```ts
    /** ⭐⭐⭐ «THE PUBLIC LIFE» – WHAT A YEAR ON THE SPOTLIGHT TAKES OFF EVERY EXPOSURE EVENT, BY RUNG
     *  (v77, wave 6's T5 – O7, ruled 13.09: «ships WITH the spotlight wave, not before it has
     *  something to shrink»). The FIFTH factor of `exposurePressure`'s product (engine/spirit.ts),
     *  and `1` on every week the seat is not working this focus.
     *
     *  ⚠⚠ A SHRINK AND NEVER A SHIELD, which is the one thing three decimals cannot say for
     *  themselves. Every entry is strictly between 0 and 1: the cameras cost her LESS while somebody
     *  is working the year with her, and they never cost her nothing. A `0` here would switch the
     *  whole spotlight off for anyone who can afford a retainer, which is the shape who-she-is §3c
     *  forbids in its own words about the habituation floor one block over («a SHRUG and not an
     *  immunity») – and the two multiply, so the seat and the veteran together must still leave a
     *  cost standing.
     *
     *  ⚠ STRICTLY DECREASING, OR THE RUNG IS RE-PRICED – the masseur spec's §4 law, which the wave
     *  brief applies per focus. T9's psy-grid benches the fifth column against the rung below AND
     *  against no-seat; `tests/wave6-spotlight-focus.test.ts` §A holds the SHAPE so a re-tune cannot
     *  quietly flatten a step.
     *
     *  ⚠ A MULTIPLIER ON A SPIRIT TERM, indexed by rung (`0 | 1 | 2`, the roster position) – the
     *  FIFTH spelling in this block and the collision is worth naming once, as its four neighbours
     *  name theirs: `recoverySlope` is POINTS OF SPIRIT PER WEEK, `coolheadPerSeason` POINTS OF A
     *  SKILL PER SEASON, `listenClarity` a SHARE OF BEATS, `wallsHazardScale` a MULTIPLIER ON A
     *  PROBABILITY, and this a MULTIPLIER ON A COST.
     *
     *  ⚠ UNRULED – the wave-6 brief's §4 lists «`publicLifeShrink [0.85, 0.70, 0.55]`» under
     *  «Proposals – NONE ruled, all bench-priced predicted-first, his word after», and the architect's
     *  ruling N adds the measurement that makes the size a real question rather than a formality: at
     *  the drafted bases a calm, open, habituated girl holding this focus at the top rung takes
     *  `−4 × 0.8 × 0.75 × 0.25 × 0.55 = −0.33` from the worst week of her public life – three tenths,
     *  which the screen renders as nothing. Not one pin below asserts these three numbers; every
     *  expectation is computed from this row, so a re-tune moves both sides together. */
```

## `psychologist.publicLifeAccel`

```ts
    /** ⭐⭐⭐ «THE PUBLIC LIFE» – HOW MUCH FASTER SHE LEARNS TO LIVE KNOWN, BY RUNG (v77, wave 6's T5).
     *  The multiplier on `growHabituation`'s weekly `+1` (engine/spirit.ts), and `1` on every week the
     *  seat is not working this focus.
     *
     *  ⚠⚠ AN ACCELERATION AND NEVER A GATE – `wallsHerselfRepair`'s own law one row up, and §0.3's
     *  («repair is free … the seat only ever ACCELERATES the road home») read onto this focus: the
     *  counter grows at `+1` a week with nobody hired, and this multiplies a walk that was already
     *  happening. Every entry is ≥ 1 for that reason; a value below 1 would make the seat a BRAKE on
     *  her own acclimatising, which is the same defect `wallsHazardScale`'s ⚠⚠ names in the other
     *  direction.
     *
     *  ⚠⚠ AND IT CANNOT OUT-RUN THE WALLS, BY CONSTRUCTION RATHER THAN BY SIZE: `growHabituation`
     *  returns BEFORE this factor is read when she is not news or when either wall is flipped, so ×0
     *  beats any accelerator and no `Math.max` is reachable from here. That composition is where a
     *  builder reaches for one, so it is pinned (`tests/wave6-spotlight-focus.test.ts` §D).
     *
     *  ⚠ STRICTLY INCREASING, OR THE RUNG IS RE-PRICED – the masseur §4 law again, benched by T9
     *  against the §3c habituation curve. ⚠ THE CAP IS UNMOVED: `habituationFullWeeks` is still both
     *  the clamp and `habituationScale`'s denominator, so a faster walk arrives at the same floor
     *  sooner and never past it.
     *
     *  ⚠ UNRULED – the brief's §4 «`publicLifeAccel [1.5, 2.0, 2.5]`», in the same «NONE ruled» list
     *  as its sibling above. T9 prices it; no pin below asserts the three numbers. */
```
