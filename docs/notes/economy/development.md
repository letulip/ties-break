---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The development block

The comment essays that stood above the `development` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `development`

```ts
  // Season-Life condition accumulator (0..100, 100 = fresh). Pure INTEGER arithmetic –
  // accrueCondition draws ZERO main-stream RNG, so none of these can shift the weekly draw
  // sequence (the B1 invariance test guards it).
  //
  // Round-9 OWNER REDESIGN (replaces the old restBase/restSlope/trainSlope plan formula AND
  // the flat per-tier tournamentStrain – everything integer, no fractions):
  //  - FATIGUE comes from MATCHES, per kid match played (world.ts matchDrain, applied when the
  //    run COMMITS at finalizeTournament): straight sets with no tiebreak = 2; a 3-setter OR a
  //    tiebreak in a 2-setter = 3; +1 more when the match had MORE than 2 tiebreak sets (a
  //    three-TB epic) – max 4; plus the tier surcharge PER MATCH below. Hardest national
  //    match = 4 + 2 = 6, so a five-match National run of epics costs 30 + the cumulative ladder.
  //    (BASE RAISED 1 → 2, owner 26.07; the old "maxes at 25" check was that same run at base 1.)
  //  - RECOVERY comes from TIME: recoveryBase every week, always; on a week with NO kid match
  //    the train/rest slider adds restRecoveryBonus (threshold-based on plan.rest – the 60/40
  //    preset earns +2, 75/25 earns +1, the 85/15 grind earns 0; NEVER interpolated); physio
  //    adds ECONOMY.physio.conditionBonusPerWeek; a blackout week (off-season / exams) adds
  //    blackoutBonus. condition = clamp(condition + recovery − matchDrain, 0, 100).
  // --- DEVELOPMENT (Phase 4) --------------------------------------------------------------------
  // Every number the growth model reads, in one object, because this is the block the owner will
  // want to turn. The shape is docs/plan.md's ("potential + age curves ... weekly training
  // allocation, coach quality"); these are its first measured values, not its last.
```

## `development.ageCurve.plateauRate`

```ts
      /** ⭐⭐⭐ ROUND 38 #17 (07.09) – 0.0009 -> 0.0027, AND IT IS C1 AND C3 TURNING OUT TO BE ONE DIAL.
       *
       *  THE OWNER, on the coach: «нет варианта, что они и дальше гармонично сотрудничают до
       *  абсолютного потолка» – he read it as a fact about COACHES and it is not. Measured: at 23 the
       *  weekly rate sits on this number, so with an elite coach, a great fit and a grind plan a year
       *  buys about 5-7% of what headroom is left; on two remaining points that is the «+0,1%» he was
       *  seeing. No coach can be the one who takes her all the way, because the PLATEAU is what has
       *  flattened, not the coaching.
       *
       *  ⚠ AND IT IS THE SAME LEVER C1 NEEDED. His «рост как раз идёт до 28-29» is already true –
       *  careers peak at 26.6 direct and 28.6 via college – so nothing about the phase BOUNDARIES had
       *  to move; what was missing is that the late years were worth almost nothing. One number
       *  answers both, and the boundaries stay where his own reference table puts them.
       *
       *  MEASURED (`tools/r38-ceiling-dials.ts`, the analytic share of her own headroom that can EVER
       *  arrive, walked to 38 – `skill-ceiling.ts` §1's arithmetic):
       *
       *      arm                     nonsense  self-run-well  coach+fit  coach-off  elite  yardstick  spread
       *      shipped 0.0009             61.2%          92.3%      92.4%      90.0%  97.3%      98.3%    37.1
       *      x3      0.0027             75.1%          97.7%      97.7%      96.6%  99.5%      99.7%    24.7
       *      x3 + the fit span below    67.0%          98.9%      98.9%      93.2%  99.8%      99.9%    32.9
       *
       *  ⚠⚠ ON ITS OWN IT NARROWS THE SPREAD – it lifts the bottom more than the top, because the top
       *  was already at 98%. That is why it ships WITH the fit span and not before it: the pair moves
       *  the well-run career to 98.9% while a mismatched partnership falls to 93.2%, which is the
       *  «три пути должны различаться» half. The owner picked that row: «очень хорошо выглядит». */
```

## `development.ageCurve.declineAccel`

```ts
      /** ...growing each year past it, so a career ends rather than fading forever.
       *
       *  ⭐⭐⭐ ROUND 38 #3d (06.09) – 0.28 -> 0.22. THE OWNER: «я вижу ветеранов на корте, да, они уже
       *  не могут так быстро бегать, как раньше, но они и не беспомощны… Может разве что тоже плавнее
       *  сделать.»
       *
       *  ⚠⚠ AND HE ALLOWED THE OTHER HALF TO STAY – «Хотя может быть для формального окончания игры
       *  это и ок» – which is the constraint this number is chosen against rather than a courtesy.
       *  `ENDINGS.lastOfferPeakShare` is 0.55 and `ending.ts` marks an off-season offer FINAL at or
       *  below it, so the body must still be able to end a career. Measured
       *  (`tools/r38-decline-shape.ts`, exact arithmetic – past `declineStart` nothing else moves a
       *  physical attribute, so the share of peak is the product of the weekly factors):
       *
       *      accel   loss/season at 35   share at 40   body can end the career at
       *      0.28              4.76%          0.601                            42
       *      0.24              4.35%          0.628                            42
       *      0.22              4.14%          0.642                            43
       *      0.18              3.72%          0.671                            44
       *      0.14              3.29%          0.701                            45
       *
       *  ⚠⚠ 0.24 AND NOT 0.22, AND THE REASON IS A PIN THIS REPO LEFT AS A TRIPWIRE. `ending.test.ts`
       *  pins that the off-season her body first falls to 70% is the off-season she is first 38 –
       *  the equivalence that let `ENDINGS.stopAskingAgeYears = 38` be DELETED and replaced by a
       *  body-share rule, and whose own comment says «if this line ever needs changing then the claim
       *  the change was sold on has stopped holding». Measured: at 0.22 she reads 0.7019 at 38 and
       *  crosses during her 39th year – the equivalence breaks by 0.0019 of share. At 0.24 she reads
       *  0.6905 at 38 and the body and the birthday name the SAME off-season, exactly as before.
       *  So the softening is taken right up to that pin and stops there.
       *
       *  ⚠ A FLOOR WAS MEASURED AND REFUSED: at 0.45 or 0.50 it never binds before 0.55 is crossed,
       *  so it would have been decoration.
       *
       *  ⚠⚠ AND IT IS NOT WHAT CAUSED HIS «из топ-50 до топ-150 за сезон». That fall is her ABSOLUTE
       *  level against the field's – she is at 47 on four attributes where the tour's elite sit at
       *  65-70 – so any loss at all is decisive there. This dial softens the slope; the level is C2's
       *  question and it is still open. Said out loud so the next reader does not credit this change
       *  with a fix it does not deliver. */
```

## `development.ageWeight`

```ts
    /** ⭐⭐⭐ ROUND 38 #6c (07.09) – WHICH SKILLS AGE, AND HOW FAST RELATIVE TO EACH OTHER.
     *
     *  THE OWNER: «может быть и навыки могут деградировать, это вполне ок, надо только подумать
     *  какие и с какой скоростью» – and, on the four below: «веса ок, строй и меряй пожалуйста».
     *
     *  ⚠⚠ WHAT THIS ENDS. `growWeek`'s decline branch charged `decline x skills[k]` to all four
     *  physical attributes at the SAME proportional rate, so a thirty-five-year-old lost her serve
     *  at exactly the rate she lost her legs. Nothing about that was wrong arithmetic; it was
     *  shapeless, and it is the one thing every tennis broadcast in the world says is not true.
     *
     *  ⚠⚠⚠ THESE ARE RAW WEIGHTS AND THE CODE NORMALISES THEM, WHICH IS THE WHOLE SAFETY OF THE
     *  CHANGE AND IS DELIBERATELY NOT FOUR HAND-TYPED DECIMALS. `ageWeightOf` divides by their own
     *  mean, so `mean(normalised) === 1` holds BY CONSTRUCTION however these four are retuned –
     *  and that is what keeps `physicalMean(skills) / peakPhysical` on its old path. Three things
     *  read that ratio and none of them may move: `ENDINGS.lastOfferPeakShare` (the last off-season
     *  offer), `recoveryAgeFade` (the corridor), and `realisedShare` (the coach's ceiling read).
     *  ⚠ A fifth attribute appended to `SKILL_KEYS` without a row here reads 1 and is therefore
     *  ordinary, never zero – see `ageWeightOf`.
     *
     *  ⚠ COMPOSURE IS ABSENT ON PURPOSE and would be inert if present: `isPhysicalSkill` excludes
     *  it from the decline branch entirely and it GAINS `veteranPoise` past the peak instead.
     *
     *  Measured predicted-against-measured in docs/specs/what-ages-first-2026-09.md §3. */
```

## `development.declineCare`

```ts
    /** ⭐⭐⭐ ROUND 44 – WHAT THE PAYROLL TAKES OFF THE DECLINE, AND NOTHING MORE THAN THAT.
     *
     *  THE OWNER, 17.09: «все эти специалисты должны его если не тормозить, то хотя бы сглаживать,
     *  а может у кого-то и тормозить даже немного.» `docs/specs/the-decline-and-the-seats-2026-09.md`
     *  §4 turns that shape into one rule: NO SEAT STOPS THE DECLINE; each softens the ONE attribute
     *  it has a real-world claim on, and the coach maintains all four a little.
     *
     *  ⚠⚠ THESE ARE SHARES OF THE ORDINARY WEEKLY LOSS, NOT NEW RATES, and the difference is the
     *  whole safety of the feature. `growWeek` charges `declineRate x ageWeightOf(k) x SHIELD x
     *  skills[k]`, where the shield is `Π(1 - share)` over the seats that apply – a product of
     *  factors each strictly inside [0, 1), so it is STRICTLY POSITIVE BY CONSTRUCTION and a fully
     *  staffed veteran still ages. That is the spec's own first pass/fail question answered in the
     *  shape of the arithmetic rather than in a measurement that could drift: there is no set of
     *  numbers anybody can write here that buys immortality, only one that makes the shield small.
     *
     *  ⚠⚠ AND NOTHING HERE MOVES `declineStart`, `declineRate` OR `declineAccel`. Round 38 #3d
     *  measured those and its own note warns the next reader off them; the spec's §5 rules them out
     *  by name. What this block changes is how much of the SAME curve a paid team absorbs.
     *
     *  ⚠ COMPOSURE IS ABSENT AND WOULD BE INERT, exactly as in `ageWeight` above: `isPhysicalSkill`
     *  keeps it out of the decline branch and it gains `veteranPoise` instead. So the psychologist
     *  has NO row here – the spec's §4 table says «no change» for that seat, because he is already
     *  aligned – and «all four» in the coach's row means the four PHYSICAL attributes.
     *
     *  Measured predicted-against-measured in docs/specs/the-decline-and-the-seats-2026-09.md §6. */
```

## `development.declineCare.masseur`

```ts
      /** ⭐ THE MASSEUR PROTECTS HER LEGS. Weekly body work is exactly what a veteran's endurance
       *  runs on, and stamina is the fastest-ageing attribute in the table above (weight 1.6), so
       *  it is both the honest claim and the one the player can feel.
       *
       *  ⚠ THE SHARE IS THE TOP RUNG'S. The rungs below it deliver a PROPORTION of it, derived from
       *  the seat's own `conditionBonusPerWeek` ladder (1/2/3) rather than written down again –
       *  see `declineCareShieldOf` in engine/development.ts. Without that, the cheapest rung would
       *  buy the whole shield and a veteran's correct play would be to drop to it, which is the
       *  farming hole the knock's rest branch already documents one module over.
       *
       *  ⭐⭐⭐ 0.25 IS DERIVED FROM THE `ageWeight` LADDER ABOVE AND IS NOT A FITTED NUMBER:
       *  `1 - ageWeight.ret / ageWeight.stamina` = `1 - 1.2/1.6` EXACTLY. The sentence it spells is
       *  «weekly body work makes her legs age like her RETURN, and never slower than that» – the
       *  seat moves its attribute exactly ONE RUNG down the tuned ladder and stops.
       *
       *  ⚠⚠ THAT SHAPE IS SELF-LIMITING BY CONSTRUCTION, WHICH IS WHY IT BEAT A ROUND NUMBER: no
       *  seat can ever make its attribute the SLOWEST-ageing one. The serve is the last thing to go
       *  with or without a payroll – `ageWeight.serve`'s own row says «a serve is a career extender»
       *  – and no amount of money reverses the order the tuned table puts the four in.
       *  `tests/round44-decline-care.test.ts` asserts this equals the ladder step, so a wave that
       *  retunes `ageWeight` reddens here and has to decide rather than drift. */
```

## `development.declineCare.sparring`

```ts
      /** ⭐ THE HITTING PARTNER PROTECTS HER RETURN. The return is reaction before it is technique
       *  (the `ageWeight` row above says so in its own words) and reaction is what match-style
       *  practice drills. Same top-rung doctrine, off this seat's own `driftCut` ladder.
       *
       *  ⭐⭐ AND THE SAME DERIVATION, ONE RUNG ALONG: `1 - ageWeight.groundstrokes / ageWeight.ret`
       *  = `1 - 1.0/1.2` = 0.1667. «Match-style practice makes her return age like her RALLY, and
       *  never slower than that.»
       *
       *  ⚠ SO THIS SEAT'S SHIELD IS SMALLER THAN THE MASSEUR'S WHILE ITS BILL IS LARGER, and that is
       *  said out loud rather than smoothed over: the LADDER'S OWN STEPS ARE UNEVEN (1.6→1.2 is a
       *  quarter, 1.2→1.0 is a sixth), the two seats are priced on their OTHER channels – the rust
       *  cut and the recovery table – and re-pricing a seat is not this spec's to do. Round 42 #48
       *  is where the hitting partner's money was measured; nothing here revisits it. */
```

## `development.declineCare.coachMaintenanceTop`

```ts
      /** ⭐⭐ AND THE COACH MAINTAINS ALL FOUR, SLIGHTLY – the row that fixes something close to a
       *  defect. Past `declineStart` `ageFactor` returns 0, so `growWeek`'s whole GAIN term is zero
       *  and an elite coach multiplies nothing: a family paying elite money for a twenty-eight-year-
       *  old is buying literally nothing, and no screen says so. An elite coach's job past the peak
       *  is maintenance rather than growth, and this is the first term in the engine that says it.
       *
       *  ⚠ SCALED BY TIER AND FIT, AND THE SCALE IS DERIVED. `declineCareShieldOf` reads the week's
       *  own `coachFactor(tier, fit, chemistry)` – the number `growWeek` already computed – and
       *  places it between the self-coached rate and `coachFactor('elite', 'great')`. So the parent
       *  on the court buys exactly 0, a badly-matched budget coach also buys 0 (his rate is BELOW
       *  the parent's), and the ladder in between moves with `developmentFactor`, `fitFactor` and
       *  the chemistry term by construction rather than by a second table kept in step by hand.
       *
       *  ⭐⭐⭐ 0.08 IS THE ONE FITTED NUMBER IN THIS BLOCK, AND IT WAS SWEPT RATHER THAN CHOSEN.
       *  `npm run bench:decline` §2s moves it against four criteria written down BEFORE the run
       *  (invariant 5's own shape – «written down so the run can embarrass them»):
       *
       *      C1  the whole team absorbs <= 1/3 of the decline to 33
       *      C2  the staffed-vs-unstaffed gap is >= ONE season of ageing
       *      C3  ...and <= TWO
       *      C4  the coach ALONE is worth >= half a season, because §4's own ⭐ says a family paying
       *          elite money for a twenty-eight-year-old is «buying nothing at all», and a row that
       *          fixes that has to be visible on its own rather than only inside a full team
       *
       *  MEASURED, at the derived seat shares above (one season = 1.68 points, the whole decline to
       *  33 = 51.1 points over the four):
       *
       *      coach   absorbed   gap      seasons   coach alone   win prob.   verdict
       *      0.00       11.5%   +1.47      0.87          0.00       +0.90 pp  C2, C4 fail
       *      0.04       14.7%   +1.87      1.11          0.27       +1.54 pp  C4 fails
       *      0.06       16.3%   +2.08      1.24          0.40       +1.86 pp  C4 fails
       *      **0.08**   17.9%   +2.29      1.36          0.54       +2.19 pp  ⭐ meets all four
       *      0.10       19.5%   +2.49      1.48          0.68       +2.53 pp  meets all four
       *      0.14       22.8%   +2.91      1.73          0.95       +3.22 pp  meets all four
       *      0.20       27.7%   +3.54      2.11          1.37       +4.30 pp  C3 fails
       *
       *  ⭐ THE SELECTION RULE IS «THE SMALLEST THAT MEETS ALL FOUR», and «smallest» is the SPEC'S
       *  own word for this row – «a small maintenance term», «all four, slightly». So the criteria
       *  set the floor and the spec sets the direction; there is no step left for taste to take.
       *
       *  ⚠⚠⚠ IT WAS HELD AT **ZERO** FOR A DAY, AND THE REASON IS WORTH KEEPING BECAUSE THE FIXTURE
       *  IS WHAT SETTLED IT. At 0.08 this row turned the suite red in nine places across three
       *  files, every one of them pinning that `physicalMean / peakPhysical` is a function of AGE
       *  ALONE, and `tests/peak-physical.test.ts` said why in its own words – «a share threshold must
       *  not be a different rule for a rich girl than for a poor one». The previous builder held the
       *  row and escalated rather than loosening a tolerance, which was right.
       *
       *  ⚠⚠ THE MEASUREMENT THAT LOOKED LIKE CLASS – on that test's own three careers walked to 38
       *  (working/self · middle/middle · wealthy/elite):
       *
       *      coach term   working/self   middle/middle   wealthy/elite   spread    ≈ career
       *      0.00               71.47%          71.64%          71.49%   0.178pp    2 weeks
       *      0.08               71.47%          72.90%          73.35%   1.880pp   24 weeks
       *
       *  ⭐⭐ ...AND IT WAS A **STAFFING** DIFFERENCE WEARING A CLASS LABEL. The owner, 17.09: «на про
       *  уровне они все имеют условно одинаковый доход». `bornAt(seed, background, coachTier)` puts
       *  the tier in the PROFILE at creation and the fixture's walk ticks growth weeks only –
       *  NOTHING IN IT EVER HIRES ANYBODY – so the poorest arm read 71.47% because it was
       *  self-coached, not because a working family cannot afford a coach on the pro tour. The case's
       *  own comment says what it is for and it is not money: «three careers with deliberately
       *  different CEILINGS … must read the same share at 38». The claim is PROPORTIONALITY.
       *
       *  ⭐ SO THE PIN WAS SPLIT INTO THE TWO CLAIMS IT HAD BEEN CARRYING AT ONCE, and both are
       *  STRONGER than the one they replace – proportionality is now measured at identical staffing
       *  and holds to 0.0011pp across bodies 22 points apart (it was 0.20pp across 3.4), and «a paid
       *  seat changes the share» has a case of its own for the first time. See
       *  docs/specs/the-decline-and-the-seats-2026-09.md §7 and §8.
       *
       *  ⚠ WHAT THE ROW IS WORTH, RE-MEASURED WITH IT LIVE (`npm run bench:decline`, 17.09): the
       *  fully-staffed veteran at 33 holds serve 88.9% · ret 82.1% · stamina 79.0% · groundstrokes
       *  82.1% – still falling on every one of the four, so Q1 passes structurally – and the payroll
       *  hands back **+2.29 points = 1.36 SEASONS** of ageing and **+2.19 pp** of match-win
       *  probability (13.6% -> 15.8%). ⭐ That clears C2's «at least one season» floor, which the two
       *  seat rows alone MISSED at 0.87 – the coach row was the term the sweep said was missing and
       *  the re-run says so from the other side.
       *
       *  ⚠ AND IT CLOSES §4's «close to a defect»: past `declineStart` `ageFactor` returns 0, so an
       *  elite coach multiplied zero and a family paying elite money for a twenty-eight-year-old
       *  bought her tennis nothing at all. `tests/round44-decline-care.test.ts` section F is the
       *  other half of that – the coach MARKET quoted the same veteran «+0.0-0.0% a season», which
       *  was true at 0 and would have been a lie the day this shipped. */
```

## `development.ageRoutes`

```ts
    /** ⭐⭐⭐ ROUND 31 #10 – THE FORK SHAPES THE CURVE, and until now it only priced it.
     *
     *  The owner supplied real WTA reference data and the round-31 ledger checked the engine against
     *  it (docs/rounds/round-31.md §10). His table:
     *
     *      modern top-100 peak window   24-26  direct       |  25-28  via college
     *      entry to top 100             ~21    direct       |  23-25  via college
     *
     *  The shipped `ageCurve` above peaks 23-28, which is EXACTLY the college window's top edge and
     *  two to four years late for a girl who went straight to the tour – so one curve was being worn
     *  by both routes, and it was the college one. His ruling, 31.08: «я думал уже так и есть, но
     *  тоже неплохо звучит.» He believed the fork already did this.
     *
     *  ⚠ THE COLLEGE PAIR IS TODAY'S PAIR, UNCHANGED. This is a change to the DIRECT route only:
     *  nothing about a college career moves, which is why the owner's own career (Alice went through
     *  college, weeks 294-502) reads identically under it before the pin is even considered.
     *
     *  ⚠ THE ROUTE IS THE FORK'S ANSWER AND NOT `world.college`. A career that leaves the programme
     *  early still went; reading the enrolment state would flip her back to the direct curve the week
     *  she came home. `ForkState.answer` is the decision itself and never changes once made.
     *
     *  ⚠ THE TOUR'S OWN POOL IS NOT THIS AND MUST NOT BE TUNED WITH IT. `FIELD.career` is separately
     *  and correctly calibrated – §10 measured the top-100 mean age at 25.3 against his real 25-27 –
     *  and it is a MIXED field that legitimately spans both routes. */
```

## `development.declineSpreadYears`

```ts
    /** ⭐⭐ THE PER-CAREER SPREAD, IN YEARS EITHER SIDE OF THE ROUTE'S `declineStart` (round 31 #13,
     *  his ruling: «полностью согласен, если это реализуемо»). One uniform draw off the career's own
     *  `seed:decline` sub-stream, so the age she stops performing is not the same number for
     *  everybody.
     *
     *  ⚠ WHY 1.5, AND IT IS READ OFF HIS OWN REFERENCE RATHER THAN PICKED. His table gives WINDOWS,
     *  not modes – «24-26 direct, 25-28 via college» – i.e. three-to-four-year ranges inside which
     *  real peaks fall, with the modern tail «stretched to 30-35 for the exceptional». A uniform
     *  draw over ±1.5 reproduces a WINDOW (3 years wide, matching his) instead of pretending to know
     *  its shape; a bell would be a claim about clustering his data does not make.
     *
     *  ⚠ AND THE TWO ROUTES THEN OVERLAP, WHICH IS THE POINT. Direct lands in 25.5-28.5 and college
     *  in 27.5-30.5: a long-lasting direct player and an early-fading college one are both possible,
     *  the route only moves the ODDS by two years. A band narrower than the route gap would have made
     *  the fork a strictly-dominant choice, which is the failure mode the owner named when he held
     *  back option B (physical build) for exactly that reason.
     *
     *  ⚠ `plateauStart` DOES NOT GET THE SPREAD – his ruling names `declineStart` alone. The plateau
     *  is where a route stops climbing; the decline is where a BODY goes, and only the second is a
     *  fact about the individual. */
```

## `development.declinePullPerInjuryWeek`

```ts
    /** ⭐⭐ ROUND 31 #13 – WHAT A BROKEN BODY COSTS HER AT THE FAR END: years of peak lost per week
     *  she has spent off court, counted off `weeksLostSoFar` (the monotone v40 total, never the
     *  pruned `injuryHistory`).
     *
     *  ⚠ SCALED TO LOSE YEARS, NOT WEEKS – the task's own bar. 0.025 is one year of peak per 40
     *  weeks of absence: a clean career (a handful of weeks) sits within a month of its drawn value,
     *  and a career that has lost three seasons to injury finishes two years early. Measured
     *  distributions in docs/specs/age-curve-fork-and-spread.md §4.
     *
     *  ⚠ IT IS NOT A SECOND INJURY PENALTY. The weeks themselves are already charged – she does not
     *  play them, does not train them and does not earn in them. This is the LONG-RUN half round 30
     *  #27's recurrence had no way to express: an injury that only costs the week it happens in is a
     *  week, and a body is a career. */
```
