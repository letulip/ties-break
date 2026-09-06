---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-06
---

# Round 38, the balance wave – his three from the merged build (06.09.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

He merged round 37, played on, and came back with three observations «они как раз немного про баланс
тоже», handing in the week-1115 career as the evidence. The wave they join is Wave C of
`docs/specs/next-waves-2026-09.md`, which he had already deferred to «после мержа 37» – so this
ledger owns BOTH his three and C1-C4, and the order between them is the thing to get right: his
items are about what an old career looks like, and C1 changes exactly that.

⚠ THE SAVE IS PERSONAL AND READ-ONLY. `tennis-sim_alice-cfbv_w1115.tsave` is read through the game's
own import door by `tools/r38-save-read.ts` and is never copied into the repo, never a fixture. What
the repo keeps is the derived statistics below.

---

## His three

- [~] **1. «Добавить возможность выбирать стоимость перелета с про уровня, может быть для
  специалистов отдельно даже»** – build, and it needs one ruling from him before it can be one.
  Today a fare is a fact of the event (`travelCostCents`, scaled once by `ECONOMY.travelBgFactor`)
  and the family has no say in it; the travelling team is booked separately
  (`world/bookings.ts`) but rides the same fare. What he is asking for is a CHOICE – a class –
  from the professional rungs up, and possibly a second one for the people she travels with.
  ⚠ Spec written: `docs/specs/travel-class-2026-09.md`. It is an `ask` until he picks the shape.

- [~] **2. «Бизнес в начале сезона стоил около 5млн и приносил 6к в месяц, к концу стал стоить 3млн и
  приносить 3к в месяц. Позиция в таблице практически не изменилась. В чём проблема?»** – answered
  with his own numbers, and the short answer is that **the brand has never read the table**. It reads
  FAME, fame decays on a two-year half-life, and her last title was 119 weeks ago. Measured on the
  save (`tools/r38-save-read.ts` block C):

  | week | fame | strength | reach | gross/wk | multiple | worth |
  | --- | --- | --- | --- | --- | --- | --- |
  | 907 | 35.98 | 38.92 | 65.98 | $15,019 | 14.21x | $11,097,784 |
  | 1011 | 27.69 | 30.48 | 52.69 | $9,451 | 12.68x | $6,232,452 |
  | 1063 | 20.01 | 25.63 | 42.01 | $5,947 | 11.45x | $3,541,982 |
  | 1115 | 14.44 | 21.55 | 36.81 | $4,565 | 10.86x | $2,576,989 |

  Over the season he watched: worth **-27%**, weekly **-23%**, rank **79 -> 84**. The compounding is
  deliberate and documented (`docs/specs/brand-multiple-follows-fame-2026-08.md`: «the income falls
  as fame² and the multiple falls with fame on top of it»); what is NOT settled is whether -25% a
  season is the number we want, and that is item 2b.

- [ ] **2b. The rate, not the mechanism** – `ask`, and the one real question inside item 2. See the
  question list at the foot of this file.

- [~] **3. «Оценка перформанса вообще для Алисы и её возраста в частности. Чем она отличается от
  Ostergaard #3 в списке? А ещё очень интересует наша роза скиллов, которая упала в некоторых местах
  ниже уровня начала игры – разве такое возможно вообще?»** – three questions, all three answered off
  the save. Split as 3a/3b/3c so nothing is lost:

- [~] **3a. Her performance for her age** – she is **35.30** and ranked **#141** of 1,800. The WTA
  top 100 in her own world has a mean age of **24.01** and its OLDEST player is **34**; nobody is
  35 or over anywhere in it. In the top 300 there are four rows aged 34+, best rank 14, median 217.
  So against her own age band she is doing well and against the field she is finished – and the
  reason she is out there at all is `oneMoreYearCount: 6`, six extensions past the retirement offer.

- [~] **3b. Against Ostergaard #3** – #3 is **Nina Ostergaard** (`fp-46`), a field pro, **32**, 5,684
  points, tier `tourElite`. The gap, attribute by attribute:

  | | Alice | Nina | gap |
  | --- | --- | --- | --- |
  | serve | 45.13 | 64.92 | **-19.79** |
  | ret | 49.86 | 67.02 | **-17.16** |
  | composure | 71.45 | 70.36 | **+1.09** |
  | stamina | 48.71 | 70.34 | **-21.63** |
  | groundstrokes | 45.27 | 69.01 | **-23.74** |

  Closed-form match on hard: **7.11%**. The one thing she still wins is composure, and ⚠ composure is
  one of the two attributes `basePServe` never reads – which is C4, and which is why the 7.11% is
  computed as if her nerve did not exist.

- [~] **3c. «Роза скиллов упала ниже уровня начала игры – разве такое возможно?»** – **yes, and it is
  the model working as written, not a defect.** Her birth build, recomputed from her own seed
  (`startingSkills` + `withHeadStart`), against today:

  | skill | birth | now | potential | now-birth | % of birth |
  | --- | --- | --- | --- | --- | --- |
  | serve | 45.90 | 45.13 | 57.38 | **-0.77** | **98.3%** |
  | ret | 46.90 | 49.86 | 63.86 | +2.96 | 106.3% |
  | composure | 53.90 | 71.45 | 72.11 | +17.55 | 132.6% |
  | stamina | 42.90 | 48.71 | 62.74 | +5.81 | 113.5% |
  | groundstrokes | 47.90 | 45.27 | 57.34 | **-2.63** | **94.5%** |

  Two of the five are below where she was born. The mechanism: `declineFactor` is PROPORTIONAL per
  attribute and ACCELERATING (`declineRate 0.00035`, `declineAccel 0.28`), it has run since her
  injury-pulled `declineStart` of **28.85**, and it is floored only by the global
  `ECONOMY.development.floor = 20`. At her age it takes **4.84% a season** and at 40 it would take
  **7.23%**. She is at **80.39%** of her peak physical.

  ⚠ AND THE ASYMMETRY IS THE FINDING: a FIELD pro's decline is floored at **`declineFloor: 0.55`** of
  her peak book and she RETIRES at 26-34 (`ECONOMY.field.career`). Hers is floored at 20/58 = 34% and
  she never has to stop. The two populations age on different rules, which is item 3d.

- [ ] **3d. One floor or two** – `ask`. See the question list.

---

## Wave C, as `docs/specs/next-waves-2026-09.md` recorded it

- [ ] **C1 – the age curve.** `plateauStart` 23 -> 28, `declineStart` 29 -> 33, rate untouched.
- [ ] **C2 – `potentialBand`.** [4, 26] at a measured 93.3% exhausted; target 30-40%. After C1.
- [ ] **C3 – coach tenure.** ⚠ BLOCKED on his own «как это не превратить в гарантию?».
- [ ] **C4 – the two skills that never reach the field.** One calibrated closed form for everybody.

---

## Questions for him

1. **The brand's decay rate (2b).** A brand loses about a quarter of its worth and its income every
   season once the titles stop, and it compounds because the multiple falls with fame too. Three
   shapes: **A** leave it – a business built on fame is supposed to fade with fame; **B** floor the
   WORTH at a share of its own peak, the way `brandStrengthAt` already floors the reach, so a
   $11M brand cannot decay below, say, $3-4M while it still trades; **C** slow the clock – raise
   `fame.halfLifeWeeks` from 104 so a career's fame outlives its last title by longer.
   My reading: **B**. The income SHOULD fade – she stopped winning – but the shelf card is an asset
   the player bought, and an asset with no floor is the one thing on the shelf that can quietly go
   to zero while he is looking at something else.

2. **The decline floor (3d).** The field's pros stop falling at 55% of their peak and then retire.
   She has no such floor and no such retirement. Three shapes: **A** leave it; **B** give her the
   same 0.55 floor of her own peak, so a 35-year-old is a diminished player and not a fourteen-year-
   old; **C** make the retirement offer harder to refuse past a point, so the six extensions become
   two. My reading: **B and C together**, and B first – it is one constant and one guard.

3. **The travel class (1).** What is the choice actually made of? **A** a class per trip, chosen
   when she enters (economy / standard / business), price and a condition effect; **B** a standing
   family policy she sets once and can change; **C** a policy plus a separate one for the travelling
   team, which is his «для специалистов отдельно». My reading: **B for her, C's second half only if
   the team's fares are already a line he can see**. Spec: `docs/specs/travel-class-2026-09.md`.
