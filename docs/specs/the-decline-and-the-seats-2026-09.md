---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-17
---

# The decline, and whether four paid seats may touch it

Opened 17.09 on his own career and his own words: **«мне кажется, что это не спад, а прыжок с
обрыва»**, and **«все эти специалисты должны его если не тормозить, то хотя бы сглаживать, а может
у кого-то и тормозить даже немного»**. With a calibration point he supplied and which the model has
to answer to: **the 2026 US Open final was Sabalenka at 28 and Rybakina at 27.**

## §1 First, the measurement – and it corrects BOTH of us

The curve is `0.00035 × (1 + (age − declineStart) × 0.24)` a week, times the attribute's **normalised**
age weight – `ageWeightOf`, which is `ECONOMY.development.ageWeight` (serve 0.6 · return 1.2 ·
stamina 1.6 · groundstrokes 1.0) divided by those four's own mean of 1.1, so the set has a mean of
exactly 1. Composure is excluded and gains `veteranPoise` instead. For his career, `declineStart` is
**25.99**. Share of each attribute still standing:

| age | serve | return | stamina | groundstrokes |
| --- | ---: | ---: | ---: | ---: |
| 27 | 98.9% | 97.8% | 97.0% | 98.1% |
| 28 | 97.5% | 95.1% | 93.6% | 95.9% |
| **28.76 (his career now)** | **96.4%** | **92.9%** | **90.6%** | **94.0%** |
| 30 | 94.3% | 88.9% | 85.4% | 90.6% |
| 32 | 90.2% | 81.4% | 76.0% | 84.3% |

> ⚠⚠ **THIS TABLE WAS WRONG WHEN IT FIRST SHIPPED AND THE CORRECTION IS DATED 17.09, THE SAME DAY.**
> The first version read 98.8 / 97.5 / 96.7 / 97.9 at 27 and **96.0 / 92.2 / 89.7 / 93.5** at 28.76,
> and those numbers are reproducible – `npm run bench:decline` §1 reproduces them **to the last
> decimal** in a column it prints beside this one, and labels it `raw weights`. They were computed
> against the RAW `ECONOMY.development.ageWeight` values instead of through **`ageWeightOf`**, which
> divides them by their own mean of 1.1. That normalisation is not a detail: `ageWeightOf`'s own
> header calls it «THE WHOLE SAFETY OF THE FEATURE», because it is what keeps
> `physicalMean / peakPhysical` on its old path however the four are retuned. Every published number
> was therefore about **10% too steep**, and the absolute-points line below moved with it
> (−2.6 / −4.6 / −6.2 / −4.1 was the raw reading).
>
> ⭐ **§1's ARGUMENT IS UNHARMED AND SLIGHTLY STRENGTHENED**, which is why the reasoning below stands
> word for word: the real slope is *gentler* than the one that was published, so «a point and a half
> of skill does not move a win rate seventeen points» holds a fortiori. What had to be corrected is
> the table, not the reading of it. The bench prints all three rows – what this page said, what a raw
> walk gives, and what `growWeek` actually does – so this cannot happen quietly a second time.

⭐ **So the slope is NOT a cliff, and the architect's own «cliff» framing was loose.** At 28.76 she
holds 90–96% of her peak. In absolute points the whole decline has cost her **serve −2.4, return
−4.2, stamina −5.7, groundstrokes −3.8**.

⚠⚠ **AND ONE SEASON OF IT IS ABOUT 1.7 POINTS, WHICH CANNOT EXPLAIN 70% → 53%.** His 2044 was 42–18
and his 2045 is 26–23. A point and a half of skill does not move a win rate seventeen points. **The
decline is therefore NOT the whole cause of what he felt**, and saying so is the difference between
a diagnosis and a story. (The figure this paragraph first carried was «about 1.5», from the raw-weight
table above; measured through `growWeek` the 28 → 29 season costs **1.68 points** as a mean over the
four. Same sentence, one decimal kinder to it.)

## §2 What actually produced the fall from #13 to #59 – three terms, not one

1. **~1.7 points of ageing** over the season (the §1 correction; it read ~1.5 on the raw weights).
   Real, small.
2. **Two mid-match retirements, both in 128-draws** – w710 (2044 R16) and w754 (2045 R64). The two
   events that pay the most points, exited at the two rounds that pay least.
3. **The ranking is a rolling 52-week sum.** 4,008 points expired and 1,584 replaced them. The drop
   from #13 to #59 is that arithmetic, not a judgement on how she played.

⭐ **Term 2 is the one the seats could plausibly have touched, and did not.** The shoulder knocked
four times (w676, w685, w699, w709) and was pushed four times, the fourth carrying `brokeDown: true`.
Nothing on the payroll reduces the breakdown hazard of pushing.

## §3 His calibration point, and what the model actually says about it

Sabalenka at 28 and Rybakina at 27 are not merely still playing – they are contesting a Slam final,
after documented career slumps. The model's 28-year-old holds 90–96% of HER OWN peak, which by
itself is not obviously wrong.

⚠⚠ **The mismatch is not in the slope, it is in the LEVEL, and `ECONOMY` already says so in its own
voice.** Round 38 #3d's note over `declineAccel`: «she is at 47 on four attributes where the tour's
elite sit at **65–70** – so **any loss at all is decisive there**. This dial softens the slope; **the
level is C2's question and it is still open.** Said out loud so the next reader does not credit this
change with a fix it does not deliver.»

His player peaked at serve 66 · return 59 · stamina 61 · groundstrokes 63 against an elite band of
65–70, and reached #13 on **composure 78**. A four-point loss from that base crosses a threshold that
the same loss from 70 would not. **That is why a gentle slope feels like a cliff jump** – he is
reading the effect correctly and the cause is one layer under where either of us first looked.

## §4 THE PROPOSAL – one seat, one attribute it plausibly protects. DRAFT, his ruling.

His shape: «если не тормозить, то хотя бы сглаживать, а может у кого-то и тормозить даже немного».
So: **no seat stops the decline; each softens the ONE attribute it has a real-world claim on.**

| seat | attribute | claim | proposed effect |
| --- | --- | --- | --- |
| masseur | **stamina** (weight 1.6, the fastest) | weekly body work is exactly what a veteran's endurance runs on | reduce its effective weight while hired and working |
| hitting partner | **return** (weight 1.2) | the return is reaction, and reaction is what match-style practice drills | reduce its effective weight while hired |
| coach | **all four, slightly** | an elite coach's job past the peak is maintenance, not growth | a small maintenance term, scaled by tier and fit |
| psychologist | **composure** | already aligned – composure is excluded from the decline and gains `veteranPoise` | no change |

⚠⚠ **Numbers are deliberately absent from this table.** Invariant 5: a balance change ships with a
bench arm and a predicted-against-measured spec. The arm has to answer two questions before any
constant is chosen: **does the fully-staffed career still decline** (it must – a seat that stops
ageing is an immortality button), and **does the gap between a staffed and an unstaffed veteran
read as a difference the player can feel** rather than as noise.

⭐ **And the coach's row fixes something that is close to a defect today:** past `declineStart`
`ageFactor` returns 0, so an elite coach multiplies zero. A family paying elite money for a
twenty-eight-year-old is buying nothing at all, and nothing on screen says so.

## §5 What is NOT proposed here

- **Moving `declineStart` or the slope.** Round 38 already measured that and its own note warns the
  next reader not to credit the dial with a fix it does not deliver.
- **Touching the LEVEL question (C2).** It is the real cause of the threshold effect in §3 and it is
  bigger than this spec. Named so it is not quietly absorbed.
- **Anything about the knock hazard.** Round 43 #9 stood that down on his «по ноккам отбой»; if term
  2 of §2 is to be addressed, that ruling is his to revisit.

## §6 BUILT AND MEASURED – predicted against measured (invariant 5)

Built on his «строй и меряй». The bench arm is **`npm run bench:decline`**
(`tools/r44-decline-seats.ts`); the guard is `tests/round44-decline-care.test.ts`. **No schema key
was needed** – every input the rule reads (`masseurHired`, `masseurSessionsPerWeek`, `sparringHired`,
`sparringRung`, `sparringTravels`, `coachId`, the tier, the fit, the chemistry) is already persisted,
so `SAVE_SCHEMA_VERSION` does not move and no migration is owed.

### §6a The mechanism, in one paragraph

`growWeek`'s decline branch charges `declineRate × ageWeightOf(k) × SHIELD × skills[k]`. The shield is
`Π(1 − share)` over the seats working that week, and every factor is `1 − share` with `share` clamped
strictly below 1 – **so the product is strictly positive for any numbers anybody can ever write
here.** It is a shield on the LOSS and never a gain, deliberately: a maintenance term written as
growth would push `physicalMean / peakPhysical` above 1 and all three of its readers
(`ENDINGS.lastOfferPeakShare`, `recoveryAgeFade`, `realisedShare`) would need a new bound.

### §6b How the constants were chosen, and which of them is fitted

**The two seat constants are DERIVED from the shipped `ageWeight` ladder, not fitted.** Each seat
moves its attribute exactly **one rung down that ladder** and stops:

| seat | attribute | derivation | value |
| --- | --- | --- | ---: |
| masseur | stamina | `1 − ageWeight.ret / ageWeight.stamina` = `1 − 1.2/1.6` | **0.25** |
| hitting partner | return | `1 − ageWeight.groundstrokes / ageWeight.ret` = `1 − 1.0/1.2` | **0.1667** |

⭐ **The shape is self-limiting by construction, which is why it beat a round number: no seat can
ever make its attribute the slowest-ageing one.** The serve stays the last thing to go with or
without a payroll – `ageWeight.serve`'s own row is «a serve is a career extender» – and no amount of
money reverses the order the tuned table puts the four in. The bench shows it exactly: a top-rung
masseur leaves stamina at 33 on **77.4%**, which is precisely where the *unshielded return* sits, and
a top-rung partner leaves the return on **80.8%**, precisely where the *unshielded groundstrokes* sit.

⚠ **The partner's shield is smaller than the masseur's while his bill is larger**, and that is stated
rather than smoothed: the ladder's own steps are uneven (1.6→1.2 is a quarter, 1.2→1.0 is a sixth),
the two seats are priced on their OTHER channels – the rust cut and the recovery table – and
re-pricing a seat is round 42 #48's business, not this spec's.

**The coach's `coachMaintenanceTop` is the one fitted number**, swept in `bench:decline` §2s against
four criteria written down before the run:

- **C1** the whole team absorbs ≤ ⅓ of the decline to 33
- **C2** the staffed-vs-unstaffed gap is ≥ **one season** of ageing
- **C3** …and ≤ **two**
- **C4** the coach **alone** is worth ≥ half a season, because §4's own ⭐ says a family paying elite
  money for a twenty-eight-year-old is «buying nothing at all», and a row that fixes that has to be
  visible on its own rather than only inside a full team

| coach term | absorbed | gap (pts) | seasons | coach alone | win prob. | verdict |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 0.00 | 11.5% | +1.47 | 0.87 | 0.00 | +0.90 pp | C2, C4 fail |
| 0.04 | 14.7% | +1.87 | 1.11 | 0.27 | +1.54 pp | C4 fails |
| 0.06 | 16.3% | +2.08 | 1.24 | 0.40 | +1.86 pp | C4 fails |
| **0.08** | **17.9%** | **+2.29** | **1.36** | **0.54** | **+2.19 pp** | ⭐ meets all four |
| 0.10 | 19.5% | +2.49 | 1.48 | 0.68 | +2.53 pp | meets all four |
| 0.14 | 22.8% | +2.91 | 1.73 | 0.95 | +3.22 pp | meets all four |
| 0.20 | 27.7% | +3.54 | 2.11 | 1.37 | +4.30 pp | C3 fails |

⭐ **The selection rule is «the smallest that meets all four», and «smallest» is this spec's own word
for the row** – «a small maintenance term», «all four, slightly». The criteria set the floor and §4
sets the direction; there is no step left for taste to take.

> ⚠⚠⚠ **AND THEN 0.08 TURNED THE SUITE RED, SO THE COACH ROW SHIPS AT ZERO AND ITS SIZING IS AN ASK.
> See §6g.** The sweep chose a number; the gate then found that the number collides with a stated
> fairness rule. The winner is recorded above because the measurement is real and the row is one
> constant from shipping – but what ships today is **0**.

### §6c The two pass/fail questions §4 demanded

**Q1 · Does a fully-staffed career still decline? PASS, and structurally rather than luckily.** At 33,
walked from `declineStart` 25.99 with both seats on their top rungs, she holds **serve 88.0% ·
return 80.8% · stamina 77.4% · groundstrokes 80.8%** of her own peak (with the coach row at its swept
0.08 it would be 88.9 / 82.1 / 79.0 / 82.1) – every one of them below her peak on either reading, and
the best-preserved is still at 88%, so the answer does not depend on which attribute you look at. The
bench also runs the absurdity: at shares of **0.99** on all three constants she *still* falls. There
is no number that buys the immortality button, only one that makes the shield small.

**Q2 · Is the gap something a player would feel? BORDERLINE AS SHIPPED, and the honest answer is a
number rather than a yes.** Two columns, because the coach row is held (§6g):

| attribute | unstaffed at 33 | two seats (SHIPS) | gap | + the coach row at 0.08 | gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| serve | 58.06 | 58.06 | +0.00 | 58.66 | +0.60 |
| return | 45.65 | 47.65 | **+2.00** | 48.47 | **+2.82** |
| stamina | 43.33 | 47.20 | **+3.87** | 48.18 | **+4.85** |
| groundstrokes | 50.88 | 50.88 | +0.00 | 51.75 | +0.88 |

**As shipped: mean +1.47 points = 0.87 of a season handed back, and +0.90 pp of match-win probability**
against a fixed opponent at the elite band §3 names (65–70, taken at 67): 13.6% → 14.5%. ⚠ **That is
BELOW the «one season» floor C2 was written against**, and the floor is not being moved to fit the
result – it is reported as failed. With the coach row it clears comfortably: +2.29 points, 1.4
seasons, 13.6% → 15.8%, **+2.19 pp**.

For scale, the same player at her own untouched peak reads 38.0%, which is §3's threshold effect
showing up again and is *not* something this spec claims to fix.

⚠ **The gap is deliberately lopsided and that is the design, not a defect.** Two of the four barely
move, because only the coach touches them; the two a seat has a real-world claim on move by four to
eight percent of peak. «One seat, one attribute it plausibly protects» is exactly what that looks
like when it is measured.

### §6d The frozen careers did NOT move – predicted, then proven

**Predicted before the run:** nothing moves. `FREEZE_WEEKS` is 156, a frozen career starts at
fourteen, so she is **seventeen** at the end of the walk – the decline branch is unreachable and the
shield multiplies nothing. **Measured,** `tools/frozen-key-diff.ts` on all five cells, both arms,
headers checked against the invocation:

| cell | keys | moved |
| --- | ---: | --- |
| 5/0 (25k middle, grinder) | 93 | **0 – byte-identical** |
| 8/0 (120k wealthy, elite, grinder) | 93 | **0 – byte-identical** |
| 0/1 (8k working, self-coached) | 94 | **0 – byte-identical** |
| 6/1 (25k middle, high, player) | 92 | **0 – byte-identical** |
| 5/1 (25k middle, middle, player) | 93 | **0 – byte-identical** |

`rngMain` reproduces the three canonical fingerprints the ladder has carried for eighteen waves –
5/0 `1dbff28caca2` · 8/0 `aebc8101d6df` · 0/1 `d84bcbf0c481`. **No constant in
`tests/coachTravelEdgeFixtures.ts` was touched and none was owed.** The frozen MAIN capture
(41550 / `e6b0c709`) is unmoved and not re-pinned: the change spends no draw on any stream.

⚠⚠ **AND THE NULL WAS GIVEN THE PROVENANCE CHECK A POSITIVE WOULD GET** (CLAUDE.md's own rule). The
control was **this tree with `declineCareShieldOf` neutralised in place by reverse edit** – never a
checkout, never the previous commit – and the neutralisation was *proven dead* before the diff was
believed: `bench:decline --actuate` on the A arm prints the 0.90 row **identical** to the 0.00 row,
where on the B arm the same two rows are 71.0% and 99.7% on stamina. An A arm that still moved would
have made the byte-identity meaningless.

### §6e What this does NOT deliver, said out loud

- **The LEVEL question (C2) is untouched**, exactly as §5 reserves it. Her 38.0% at her own peak
  against the elite band is the same threshold effect, and no seat in this spec moves it.
- **⚠ THE EFFECT HAS NO CHANNEL ON SCREEN YET, which is the travelling-team §4 legibility law
  unsatisfied.** The radar carries a fogged estimate and never a number, so a player buying a masseur
  at twenty-nine cannot see what it bought. **No string was added** – invariant 4, and this spec did
  not ask for one. A draft for his ruling, and nothing has shipped: *«Her legs are holding up better
  than they were this time last year.»* One line, no figure, no seat named. **His to accept, reword
  or refuse.**
- **⚠ THE COACH MARKET QUOTES A VETERAN «0.0–0.0% a season», AND WITH THE COACH ROW HELD AT ZERO
  THAT IS STILL THE TRUTH – but it becomes an understatement the day §6g is answered (a).**
  `coachMarketViewOf` prices every card with `coachSeasonUplift({ ageFactor: ageFactor(age), … })`,
  and `ageFactor` returns 0 past `declineStart`. Whoever lands the coach row must land a second band
  with it («what this rung holds on to») or the card will quietly lie – and that band is a new number
  and a new sentence, i.e. his decision under invariant 4, not an agent's. Written down here so it
  travels with the constant.
- **The coach's «about N more seasons» now understates a staffed career.** `seasonsOfBodyLeft` walks
  `declineFactor` with no payroll in it, so the sentence is honest for an unstaffed body and
  pessimistic for a staffed one. Left alone deliberately: it is user-facing copy driven by a shipped
  rule, and re-aiming it is a change §4 did not ask for.
- **The masseur already moved `declineStart` before this spec existed**, through
  `weeksLostSoFar → declinePullPerInjuryWeek`: a staffed career loses fewer weeks to injury and so
  reaches its decline *later* as well as falling through it slower. The live arm's `ds` column makes
  that second effect visible, and it is a finding rather than a caveat – the isolated arm in §2 is
  where the sizing is read off precisely because of it.

### §6f The live arm – real careers, the shipped tick, to thirty-three

`bench:decline` §3 walks 8 careers (4 seeds x 25k-middle-high and 120k-wealthy-elite, the player
policy) from fourteen to thirty-three through `tickWeek`, once bare and once with the masseur and the
hitting partner hired at their top rungs and travelling. Both arms are held above the same cash floor
so a $100k-a-year payroll cannot end a career and be read as a decline. **All 8 reached 33 with no
ending; all 8 staffed careers hired.**

- ⭐ **THE BARE ARM REPRODUCES THE ISOLATED WALK**, which is what makes the live arm believable:
  `bench-wealthy-0` at `declineStart` 25.63 reads serve 88.2% · return 77.7% · stamina 71.4% ·
  groundstrokes 81.0%, against §2's 88.0 / 77.4 / 71.0 / 80.8 at 25.99. Two independent paths through
  the same arithmetic, agreeing.
- ⭐ **THE SHIELD LANDS, AND NOT ON EVERY WEEK**: the seats worked **236–336 of 272–403** decline
  weeks per career, ~85–90%. The rest are the college freeze and booked family weeks, exactly as the
  stand-downs intend. A shield that never landed would be worth nothing whatever its constant said.
- **The measured gap, mean over the 8 pairs**: return **+2.5 pp** of peak, stamina **+4.7 pp**, serve
  **−0.1 pp**, groundstrokes **−0.1 pp**. The two attributes a seat has a claim on move; the other two
  are inside the noise of two careers that are not the same career.

⚠ **THE LIVE GAP IS ~60–70% OF THE ISOLATED ONE AND THE REASONS ARE NAMED RATHER THAN SHRUGGED AT**:
the seats stand down on ~12% of the decline weeks; the live coach is `high`/`elite` at whatever fit
the market drew, not the `elite`+`great` the isolated arm prices; and **the pairs are not a clean
control** – the masseur already shortens layoffs, `weeksLostSoFar` already pulls `declineStart`
earlier through `declinePullPerInjuryWeek`, so a staffed career reaches its decline at a different
age as well as falling through it slower. The `ds` column in the bench output is that second effect,
visible (25.63 bare against 25.58 staffed on the first pair, 26.39 against 26.57 on another – it goes
both ways). **§2's isolated arm is where the sizing is read off, precisely because of this.**

## §6g ⚠⚠⚠ THE ONE ASK – the coach's row is built, measured, and held at zero for his ruling

> ⚠⚠ **ANSWERED, 17.09 – HE RULED (§7) AND THE ROW IS LIVE AT 0.08 (§8).** This section is the
> record of the ask and of the day the row was held; it is kept rather than rewritten, because the
> escalation was the right move and the reasoning is what made §7 possible. **Everything below
> describes a tree that existed for one day.** Its option (a) is broadly what happened, with one
> correction §7 supplies: the pin was not measuring class, it was measuring STAFFING.

**What ships:** the masseur's row and the hitting partner's row, at the derived values above.
**What does not:** the coach's maintenance term, which sits at `coachMaintenanceTop: 0`. The whole
mechanism is built and the constant is one edit from live.

**Why it is held, and it is not caution – it is a measured collision.** At the swept 0.08 the gate
goes red in **nine places across three files**, and every one of them pins the same property:
`physicalMean / peakPhysical` is a function of **age alone**. `tests/peak-physical.test.ts` says why
in its own words:

> «a share threshold must not be a different rule for a rich girl than for a poor one»

Round 38 #6c already narrowed that pin once, when the four age weights stopped being one rate, and
priced the cost in weeks rather than waving past it. **Measured on that test's own three careers,
walked to 38** – and the coach row is the *sole* cause, because with it at 0 and both seat rows live
all 87 tests in the three files pass:

| coach term | working / self | middle / middle | wealthy / elite | spread | ≈ career |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0.00 | 71.47% | 71.64% | 71.49% | 0.178 pp | ~2 weeks |
| **0.08** | 71.47% | **72.90%** | **73.35%** | **1.880 pp** | **~24 weeks** |

**A 10.5× widening, ordered by the family's chequebook** – half a season of extra playing life bought
by the coaching rung she has had since she was fourteen. And it spreads on **fit**, which is a seed
draw rather than a purchase: two identical families with identical budgets would age differently on a
style-match roll.

⭐ **The two seat rows do not have this problem in the same way, and the asymmetry is exactly why they
ship and this does not.** They unlock only at her first counting W-series result, they are bought
deliberately to look after a veteran's body, and a career that buys nothing is byte-identical. The
coach row fires for **every coached career**, and nobody ever chose it.

⚠ **What holding it costs, said out loud rather than buried:**

1. **§4's own «close to a defect» still stands.** Past `declineStart` `ageFactor` returns 0, so an
   elite coach still multiplies zero, and a family paying elite money for a twenty-eight-year-old is
   still buying nothing for her tennis.
2. **Q2 lands below its own floor.** The two seats alone hand back **0.87 of a season** and **+0.90 pp**
   of match-win probability, against the «at least one season» bar C2 was written against before the
   run. The bar is reported as failed rather than moved.

**The three ways forward, for his ruling – an agent should not pick between these:**

- **(a) Ship 0.08 and re-aim the pin.** Accept that money buys a slower clock, and rewrite
  `peak-physical`, `recovery-fade` and `ending`'s four assertions – including the deliberate
  70% ⇔ 38 tripwire, whose own comment says «if this line ever needs changing then the claim the
  change was sold on has stopped holding». That claim is what let `ENDINGS.stopAskingAgeYears` be
  deleted.
- **(b) Keep it at zero** – what is on the branch. The seats carry the feature at 0.87 of a season and
  the veteran-coach defect stays open.
- **(c) Re-shape the row so it does not read the chequebook** – e.g. a flat term for «she has a
  professional coach at all», independent of tier and fit. ⚠ This does **not** rescue the pin as
  written (the pin's poorest career is self-coached, so a flat coached/uncoached step still spreads
  it) but it removes the *ladder*, which is the half that reads as wealth. Needs its own sweep.


---

## §7 THE COACH ROW, RESOLVED (his 17.09) – and the pin was measuring something else

The row was held at 0 because at 0.08 it reddened nine cases pinning that the physical share is a
function of age alone, `peak-physical.test.ts` saying why: «a share threshold must not be a different
rule for a rich girl than for a poor one». His answer separates two things the pin had welded
together:

> «спад у нас есть и он может быть разным у разных девушек… и вот на это всё сословие не влияет. Но
> помимо этого у нас есть 4 специалиста, которые напрямую влияют на развитие до потолка, поддержание
> на потолке и на всё, что связано со спадом. **Интенсивность влияния – вот что нам нужно
> запрограммировать.** И здесь нет разницы в начальном сословии: на про уровне они все имеют условно
> одинаковый доход… она заканчивается плюс-минус на уровне начала про карьеры и первых призовых.»

⭐⭐ **AND THE FIXTURE PROVES HIM RIGHT RATHER THAN MERELY AGREEING WITH HIM.** Read the case:
`bornAt(seed, background, coachTier)` sets the tier in the PROFILE at creation and `walkTo` ticks
growth weeks only. **Nothing in that walk ever hires anybody.** So `share-a` is self-coached at 38
because the fixture never hires, not because a working family cannot afford a coach on the pro tour —
and the 1.88pp spread the bench measured is a **STAFFING** difference wearing a class label.

⚠ The test's own comment says what it is really for, and it is not money: «three careers with
deliberately different CEILINGS … must read the same share at 38 while their peaks differ». The
claim is **PROPORTIONALITY** — the share left is a function of age and not of LEVEL. Background and
tier are only how the fixture manufactures three different bodies.

### What this licenses, and what it does not

- ✅ **The decline's SHAPE stays class-blind.** `declineRate`, `declineAccel`, `ageWeight` and the
  drawn `declineStart` are untouched by background, and nothing here proposes touching them. The
  invariant he cares about is intact.
- ⚠ **But the share stops being a pure function of age**, because staffing now enters it. That is a
  REAL change to what the case asserts and it may not be smuggled in by loosening a tolerance.

### The re-aim, and it is a STRENGTHENING

Two cases where there was one:

1. **Proportionality, isolated.** Three careers with different ceilings and **IDENTICAL staffing** —
   same seats filled, same tier — must still read the same share at 38. That tests what the comment
   says it tests, with money no longer able to contaminate it.
2. **The seats, pinned.** Same age, same level, **different staffing** → a different share, by the
   measured margin. The new fact gets its own case instead of being absorbed as slack in an old one.

⚠⚠ **Neither case is weakened and the old claim is not dropped** — it is split into the two claims it
had been carrying at once. ⭐ And the second case is the one that would have caught this whole thing
earlier: there was no pin anywhere asserting that a paid seat changes anything about ageing, which
is precisely why «the coach multiplies zero» survived to be found by a player.

**Owed:** the re-aim, then the sweep re-run with the coach row live, then the constant chosen by
measurement. Q2's floor is re-tested with it — the row was the missing term when the mean landed at
0.87 of a season against a bar of one.

---

## §8 DONE (17.09) – the row is live at 0.08, and what it cost to get there

> ⚠ §6 above is the record of the day the row was **held**, and it is left standing rather than
> rewritten. Where §6c says «BORDERLINE AS SHIPPED», §6e says the coach market «is still the truth»
> and §6g says «what ships today is 0», read this section instead: all three describe a tree that
> existed for one day.

### §8a The pin, re-aimed – one case became two, and both are stronger

`tests/peak-physical.test.ts`, exactly as §7 specifies. **Nothing was weakened anywhere in this
wave; no tolerance was relaxed to make anything pass.**

| | **case 1 · proportionality, isolated** | **case 2 · the seats, pinned** |
| --- | --- | --- |
| how the bodies differ | the CEILING, written directly, on **one seed** | not at all – one career forked at `declineStart` |
| staffing | identical by construction (same coach, tier, fit, chemistry) | the only variable: nobody / coach only / whole team |
| peaks | 51.93 · 63.04 · 74.15 – **22.22 apart**, was 3.37 | **byte-identical**, asserted rather than assumed |
| the assertion | shares agree to **4 decimals** (was 2) | the coach alone is worth **> 1.5pp** of her peak at 38 |
| measured | spread **0.0011pp** (bound 0.005pp) | coach **+1.92pp**, whole team **+4.91pp** (71.39 → 76.30) |

⭐ **6.6× the body spread and 100× the tolerance.** Removing the staffing confound is what bought
the exactness back: what was left over in the old case was money, not arithmetic.

⚠⚠ **Both were mutated and watched to fail, because a green run proves nothing about a new pin.**
Case 1 against a decline made level-independent (`… * skills[k]` → `… * 60` in `growWeek`): spread
**0.0372**, i.e. 744× its bound. Case 2 against `coachMaintenanceTop` back at **0**: the two shares
come back **byte-identical** – `0.7138566613635324` against itself – under the message «the elite
coach is still multiplying zero past the peak». That is the exact defect the row exists to close,
failing on cue.

### §8b The constant, chosen by measurement

`npm run bench:decline` §2s, re-run on this tree, reproduces §6b's table to the decimal. At the
**derived** seat scale the selection rule («the smallest that meets all four») still lands on
**0.08** – 0.06 fails C4 at 0.40 of a season against a bar of 0.5, and 0.08 reads 0.54.

⚠ **The grid is the spec's own and was not refined to shave the number.** C4 crosses its bar at
about 0.074 under linear interpolation, so a finer sweep would select ~0.075; refining the grid
after seeing the result is taste wearing a measurement's clothes, and 0.08 is the row the criteria
picked.

### §8c The two pass/fail questions, with the row live

**Q1 · Does a fully-staffed career still decline? PASS, structurally.** At 33 she holds serve
**88.9%** · return **82.1%** · stamina **79.0%** · groundstrokes **82.1%** of her own peak – every
one below peak, best-preserved at 88.9%. The absurdity arm still falls at shares of 0.99.

**Q2 · Is the gap something a player would feel? YES, and C2's floor is MET.**

| attribute | unstaffed at 33 | fully staffed | gap |
| --- | ---: | ---: | ---: |
| serve | 58.06 | 58.66 | +0.60 |
| return | 45.65 | 48.47 | **+2.82** |
| stamina | 43.33 | 48.18 | **+4.85** |
| groundstrokes | 50.88 | 51.75 | +0.88 |

Mean **+2.29 points = 1.36 seasons** of ageing handed back, and **+2.19 pp** of match-win
probability against the elite band (13.6% → 15.8%).

⭐ **§6g's second cost is therefore paid.** The two seats alone landed at **0.87 of a season**,
below the «at least one season» bar C2 was written against before the run, and it was reported as
failed rather than moved. **The bar was not moved now either** – the coach row was the missing term,
and 1.36 clears a bar of 1.00 that has not shifted by a hundredth since it was written.

The live arm (`§3`, 8 careers through the shipped `tickWeek` to 33) reaches both arms: every bare
career's retained share rose against the held-row run – `bench-wealthy-0` 87.4 / 76.4 / 69.8 / 79.9
→ 88.2 / 77.7 / 71.4 / 81.0 – because in a live career **both** arms employ a coach. All 8 reached
33, all 8 hired.

### §8d The frozen careers did NOT move, and the null was given a positive's provenance check

**Predicted:** nothing moves. The shield only multiplies inside the decline branch, `FREEZE_WEEKS`
is 156, and a frozen career starts at fourteen – so she is **seventeen** and `declineFactor` is 0.
The market quote is a **view**: `coachMarket` is reached only from `snapshot.ts` and writes no world
key.

**Measured,** `tools/frozen-key-diff.ts`, all five cells, both arms, headers checked against the
invocation, **run as five explicit commands**:

| cell | keys | moved |
| --- | ---: | --- |
| 5/0 (25k middle, grinder) | 93 | **0 – byte-identical** |
| 8/0 (120k wealthy, elite, grinder) | 93 | **0 – byte-identical** |
| 0/1 (8k working, self-coached) | 94 | **0 – byte-identical** |
| 6/1 (25k middle, high, player) | 92 | **0 – byte-identical** |
| 5/1 (25k middle, middle, player) | 93 | **0 – byte-identical** |

`rngMain` reproduces the three canonical fingerprints – 5/0 `1dbff28caca2` · 8/0 `aebc8101d6df` ·
0/1 `d84bcbf0c481`. **No constant in `tests/coachTravelEdgeFixtures.ts` was touched and none was
owed.** The frozen MAIN capture (**41550 / `e6b0c709`**) is unmoved and not re-pinned: the wave
spends no draw on any stream.

⚠⚠ **The control was this tree with the change neutralised IN PLACE by reverse edit** – never a
checkout, never the previous commit – and it was **proven dead before the diff was believed**: on
the A arm case 2 fails with the two shares byte-identical, which is only possible if the shield is
exactly 1. An A arm that still moved would have made the byte-identity meaningless.

### §8e Every pin that moved, and why none of them is a loosening

Ten assertions across four files. **Not one tolerance was relaxed.**

| file · case | what moved | why it is not a weakening |
| --- | --- | --- |
| `peak-physical` · proportionality | split into two cases | §8a – 100× tighter, 6.6× the spread |
| `peak-physical` · «falls by exactly the factor» | arm → **self-coached** | `declineFactor` is the whole weekly cost only with nobody on the payroll. Measured: self 0.0031 against the 0.005 bound (the round-38 #6c figure, unchanged); middle-coached 0.0060. The identity was not drifting, it was **incomplete** |
| `peak-physical` · v62 migration | fixture arm → **self-coached** | a v61 save is **by definition** a career walked before round 44, so its decline really was unshielded. ⭐ **Not one number in that describe moved** – the 2% bound, both anti-vacuity lines and the 0.8971 / 0.7102 / 0.5866 table all reproduce to the digit |
| `recovery-fade` · §4a table | 5.00 / 4.46 / 4.11 / 3.51 / 2.89 → **5.00 / 4.50 / 4.16 / 3.60 / 3.01** | re-measured at **±0.02, unchanged**. A body a coach maintains also recovers better – the same second-order consequence #3d recorded. The three shape cases beside it did not move |
| `recovery-fade` · the accrual base | 3.55 → **3.64** (measured 3.6371, 2 dp unchanged) | same cause; the claim (the accumulator spends the FADED base) is untouched |
| `ending` · 70% ⇔ 38 | arm → **self-coached**, plus a new companion case | see §8f – **read this one** |
| `ending` · the last offer lands | arm → **self-coached** | `ageAtPhysicalShare` is payroll-blind by design (§6e). ⭐ **42 and 42.500 reproduce to the digit** |
| `ending` · two bodies 25% apart | both arms **self-coached** | the pair had `wealthy`+`elite` against `working`+`self`, so the coach was one of the variables – §7's confound in a second file. Bodies still **22.5% apart** (69.37 / 56.61), and measured at every tier: ×1.2253 self · ×1.2143 middle · ×1.2101 elite |
| `ending` · the epilogue prints her age | arm → **self-coached** | the coached body crosses later, so the walk reached 43 with no offer raised and the case was asserting about an empty list |
| `round44-decline-care` · the shipped value | `toBe(0)` → **`toBe(0.08)`** | the gate now points at §7 and the sweep instead of §6g's ask |

### §8f ⚠⚠ THE ONE THING TO READ RATHER THAN THE REASSURANCE – 70% ⇔ 38 is now a claim about an unstaffed body

`tests/ending.test.ts`'s tripwire says the off-season a career first falls to 70% of her peak is the
off-season she is first 38, and its own comment says that **if the line ever needs changing, the
claim the change was sold on has stopped holding** – the claim that let `ENDINGS.stopAskingAgeYears`
be deleted. It needed changing. Measured on its own seed:

| staffing | first off-season at or below 70% | her share that winter |
| --- | --- | ---: |
| self-coached | **w1297, age 38** | 69.15% |
| budget coach | **w1297, age 38** | 69.80% |
| middle coach | w1349, age **39** | 70.33% at 38 |
| elite coach | w1349, age **39** | 71.15% at 38 |

⭐ **The dial still reproduces the deleted constant exactly, for the body it was derived from** –
`ageAtPhysicalShare` walks `declineFactor` with no payroll in it, so the unstaffed career is the one
the generalisation was ever about, and the case now says so instead of inheriting
`DEFAULT_PROFILE`'s middle coach by accident. ⚠ **But the shipped default career is coached**, so on
the default profile the last question now arrives **one winter later than the old age constant would
have asked it.** That is the feature working – it is what «a seat softens the decline» has to mean
when it reaches the endings – and it is the sentence in this wave the owner is most likely to want
to overrule. It is **not** hidden inside a tolerance: the old claim is pinned on the unstaffed arm
and the new one has a case of its own beside it («…and A MAINTAINED body is still above the line
that winter»), which fails byte-identically if the row ever returns to zero.

### §8g The coach market's «+0.0-0.0% a season», closed – and NO string was added

§6e's warning landed: `coachSeasonUplift` prices a rung by the headroom it takes, `ageFactor`
returns 0 past `declineStart`, so an elite coach was quoted to a twenty-nine-year-old at
**«+0.0-0.0% a season»**. True while the row was 0; false the week it went live.

**The fix is a number, not a sentence.** `coachMaintenanceSeasonPct` (engine/development.ts) walks
the same horizon `coachedWeeks` already names, asks `declineCareShieldOf` per attribute, and returns
what the rung **holds on to** as a percentage of her level – the same unit as the growth band, so
the two simply add inside the sentence the card already said. The card's copy is **untouched**.

⚠ **§6e's draft second band («what this rung holds on to») is NOT shipped and is not treated as
approved** – it is a new sentence and therefore his, under invariant 4. What shipped is the
arithmetic under the old sentence.

Pinned in `tests/round44-decline-care.test.ts` section F and mutation-verified (four of its five
cases redden at a held row): exactly zero while the whole horizon is short of her own
`declineStart` – so **every junior card is byte-identical** – strictly positive past it, exactly
zero for the parent on the court, monotone in the rung, and scaled by the weeks she actually buys.
⭐ The first draft of that section asserted zero at `declineStart − 0.02` and **measured 0.153**: the
code was right and the assertion was wrong, because the quote is over the next 52 weeks and a card
read eleven months before the door is selling a season that mostly lies past it. There is now a case
that says so on purpose.

### §8h Still NOT delivered, and still not absorbed

- **The LEVEL question (C2 in round 38's terms) is untouched**, exactly as §5 and §6e reserve it.
  Her 38.0% at her own peak against the elite band is the same threshold effect and no constant in
  this wave moves it. Named again so this wave cannot be credited with it.
- **`seasonsOfBodyLeft` and `ageAtPhysicalShare` remain payroll-blind**, so the coach's «about N more
  seasons» still understates a staffed career. §6e left that alone deliberately and this wave does
  too – it is user-facing copy driven by a shipped rule, and re-aiming it is a change §4 did not ask
  for. §8e's `ending` rows are where the consequence is now visible and measured.
