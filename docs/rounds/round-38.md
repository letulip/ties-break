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
  ⭐ **HE ANSWERED ON 06.09 AND REPLACED MY THREE SHAPES WITH A BETTER ONE**, and asked that it be
  written down rather than built now: «давай про класс перелета отдельный документ пока сделаем…
  это можно не сейчас делать, просто хочу закрепить». The class is PER PERSON (she flies first, the
  coach and the masseur business or economy), it reaches HER condition, and – the part that matters
  most – `ECONOMY.travelBgFactor` goes away with it: «нам вообще не надо следить кому и какие цены
  ставить – будет просто цена билетов», with the choice living in Family budget. Spec rewritten
  around his design: `docs/specs/travel-class-2026-09.md` §4-§6. ⚠ NOT in this wave, by his word.

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

- [>] **2b. The rate, not the mechanism** – ⭐ **HE RULED, 06.09, and it is a build now, not an ask:**
  «спортсменка проводит свой лучший сезон (и не один) находясь в топ-100 и входя иногда в топ-50
  даже, у нее явно есть и репутация и о ней знают, не могу забыть за год… мы должны были чинить это
  поведение в купе со стоимостью и доходностью делая его более плавным.»

  ⚠ HE HAD RAISED IT BEFORE AND IT WAS BUILT – `brand-inertia-2026-08.md`, round 32 #4: the slow
  stock, a 208-week half-life and a floor at 0.4 of her own peak. That mechanism is live and
  measured on this save. What his argument points at is a DIFFERENT hole, and the code confirms it
  exactly:

  | what the world pays her for | what it is worth to her today |
  | --- | --- |
  | 9 seasons ended inside the top 100 | **0** – `fame.seasonEndBands` stops at rank 50 |
  | 4 seasons ended inside the top 50 | 1.5 each, on the 104-week TITLE clock |
  | her best season ever, #20 at week 884 | 4 x 2^(-231/104) = **0.86 fame points** |
  | one WTA 500 title | 8 fame points, immediately |

  So a decade of being a professional the world can name buys less fame than a single Sunday
  afternoon, and what it does buy evaporates on the clock built for single results. That is his
  «не могу забыть за год», stated in the game's own numbers. The fix is item 2c.

- [x] **2c. Presence is a different fact from a result** – SHIPPED, `docs/specs/fame-presence-2026-09.md`. Two changes, both inside
  `fameFloorOf`, both precedented in the same function: the season ladder reaches **100**, and the
  season term gets its OWN slower clock instead of borrowing the title one (`shootFloorDecayAt`
  already does exactly this for shoots, per band).

  ⚠ IT TOOK FIVE DIALS AND NOT TWO, and the reason is measured rather than argued: lifting her FAME
  pushed her back ABOVE the stock's floor and therefore back onto the fast title clock, so the level
  rose and **the slope got worse** (-27.2% a season becoming -33.8%). `strength.retention` 0.78 ->
  0.95 is what makes the stock govern the tail again. Final set: rung `{100, 0.6}` ·
  `seasonHalfLifeWeeks` 312 · `retention` 0.95 · `strength.halfLifeWeeks` 312 · `floorShare` 0.5.

  **Measured on his own week-1115 career:** fame 14.4 -> **22.6**, weekly $4,565 -> **$8,111**, worth
  $2,576,989 -> **$5,172,791**, the season fall -27.2% -> **-23.3%**, and the five-year tail $185,285
  -> **$662,364**. ⚠ The top of the shelf held across every tail dial (his two peak careers read the
  same worth to the cent at 0.78 / 0.85 / 0.90 / 0.95 retention); the fame LADDER does lift them,
  +12.5% and +9.9%, which is presence paying everybody who has it.

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

- [x] **3d. One floor or two** – SHIPPED as a RATE and not a floor. ⭐ **HE RULED, 06.09:** «я вижу ветеранов на корте, да, они уже не
  могут так быстро бегать, как раньше, но они и не беспомощны… Может разве что тоже плавнее сделать,
  потому что она за 1 сезон скатилась из топ-50 до топ-150 и это довольно жестко.»

  ⚠ AND HE ALLOWED THE HARSH END TO STAY: «Хотя может быть для формального окончания игры это и ок.»
  So this is a FLOOR and not a flattening – the career must still end, and what must stop is the
  free fall on the way there. The field's own pros already have exactly this
  (`ECONOMY.field.career.declineFloor: 0.55` of peak, then they retire at 26-34).

  ⚠⚠ **AND THE FLOOR WAS MEASURED AND REFUSED.** `ENDINGS.lastOfferPeakShare` is 0.55 and the
  off-season offer is FINAL at or below it, so a floor at 0.45 or 0.50 never binds before 0.55 is
  crossed – decoration – and a floor at 0.55 or above would make the ending unreachable. What shipped
  is the RATE: `ageCurve.declineAccel` **0.28 -> 0.24**, which is 4.35% of her body a season at 35
  instead of 4.76%. ⚠ 0.24 and not softer because `ending.test.ts` pins the 70%-at-38 equivalence
  that let `stopAskingAgeYears` be deleted, and 0.22 breaks it by 0.0019 of share.

  ⚠ **What it costs:** the last offer arrives at 42 instead of 41, and the recovery corridor opens
  slightly for veterans (3.55 at 38 instead of 3.45) because it reads the same share. Both are in
  `docs/specs/fame-presence-2026-09.md` §6.

  ⚠⚠ **And it is NOT what caused «из топ-50 до топ-150».** Her four attributes read 45-50 where the
  tour's elite read 65-70, so any loss at all is decisive. That is the LEVEL, which is C2's question.

- [ ] **4. The academy's worth stands still** – ⭐ HIS OBSERVATION, 06.09: «Академия при этом стоит
  ровно на месте – и это не очень корректно, как мне кажется. Но можем отдельно обсудить.» Recorded,
  not built. Measured: `academy-land` and `academy-courts` both read `valueCents === paidCents`
  ($2,000,000 and $3,000,000) at every week, because the shop values a non-`business` rung off what
  was paid for it and only the merch rung carries a valuation. Its INCOME does move – it reads
  `academyReputationOf` (2.83 on this career) – so the asset earns like a business and is priced like
  a car. ⚠ His «обсудим отдельно» is honoured: this is a note, and it starts when he says so.

---

## His second pass, 06-07.09

- [~] **5. «У 35 летней всё равно приходит по 9 в неделю на пустых неделях, может мы где-то что-то не
  считаем?»** – answered, and he is right. Measured (`tools/r38-decline-cliff.ts` §1): her free week
  returns **9.02**, of which the age fade touches **4.02**. The other five are the rest slider (1),
  the physio (1) and the daily masseur (3) – BOUGHT SERVICES THAT DO NOT AGE. And
  `condition.recoveryAgeFloor` is 0.5, so the worst free week any woman can ever have with this staff
  is 7.50 against a twenty-year-old's 10.00. ⚠ Build candidate B in
  `docs/specs/ageing-mechanism-2026-09.md` §6.

- [~] **6. «Что у нас деградирует и по какому механизму»** – measured, and it found THREE mechanisms,
  only one of which is the skill curve. `docs/specs/ageing-mechanism-2026-09.md`:

  * her body fell **16.8%** from 30 to 35.3 – and her chance against a #50 fell **53%**. The
    skill-to-result curve amplifies three to four times, which is what a Markov match does and what
    tennis does. ⚠ So `declineAccel` is the wrong dial for his complaint.
  * ⚠⚠ **she still beats a #400 player 86% of the time.** On court she is not finished.
  * ⭐⭐⭐ **and the actual mechanism is ACCESS, not skill.** At #141 she is squeezed from both ends:
    w15 and w35 are SHUT BEHIND HER (`tierOutgrown`, and «professional rungs never re-open»), and
    wta500 / wta1000 / slam are shut in front (cuts at 120 / 65 / 112). What is left is w50-wta250,
    where the field sits around #200-330. Nine of her last 26 results are worth ONE point.
  * condition is not the cause: `conditionMatchFactor` is flat from 70 to 100 and she is at 94.1.

- [ ] **6b. The ladder's way down** – build, and it is the first of the three. A rung re-opens when
  her CURRENT rank has fallen far enough below what it was when the rung closed. ⚠ Needs his word on
  the shape.

- [ ] **6c. His own proposal: the ageing penalty moves from skills toward condition** – «может она
  должна больше уставать и больше терять за матч своей кондиции, но не падать по навыкам до уровня
  12 лет». Costed in the spec §5: it is real, the code is closer to it than it looks
  (`conditionMatchFactor` already scales all five attributes), and it touches three curves and every
  AI result. ⚠ Needs his word.

- [ ] **6d. Her own voice on her own decline** – «нужно чётко понимать, что карьера уже не та и явно
  это подсвечивать, как раз срез года закончить/продолжать... там нужно больше её голоса (или голоса
  тренера, если он есть, или совместного)». Content on a screen that already exists. ⚠ Ships with
  whichever of 6b/6c goes first, so the player is told what is happening while it happens.

- [~] **7. «Куда делась надпись с плашки тренера на главной?»** – answered: **he moved it himself.**
  Round 34 #2a, his own words: «Тренер на главном экране (почему-то, давай на карточку тренера
  вернём лучше) написал 14 летней девочке Close to her ceiling … звучит как приговор». It lives on
  the coach card (`CoachMarketScreen`, `.cm-room-band`) and `HomeScreen.vue`'s note at the site says
  so. ⚠ What he is asking for NOW is different and is 6d: the coach speaking about her DECLINE, which
  has never existed anywhere.

- [!] **7b. THE COACH CARD IS TELLING A 35-YEAR-OLD SHE HAS «HUGE POTENTIAL»** – found while checking
  item 7, and it is a real defect rather than a wording nit. Measured on his week-1115 save, the
  shipped `coachRoomNote` returns:

  > «Huge potential – most of her game is still ahead of her, and this is where a coach buys the most.»

  ⚠⚠ THE CAUSE: `realisedShare` is `gained / (room x reachable)` where `gained = Σ(skills − born)`.
  As she DECLINES, `gained` falls – so an ageing player walks BACKWARDS through the bands and ends up
  being told she is a prospect. The measure has no notion of a peak. Her sum of gains is +22.92 of a
  75.93 room, i.e. 30.9%, which is the bottom band.

  ⚠ It is also why he could not find the sentence: it IS on the coach card and it reads as if nothing
  had happened. The fix is 6d's other half – past `declineStart` the read must stop measuring headroom
  and start measuring what is going.

- [~] **7c. «Замер какой-то был на эту тему. Поищи пожалуйста»** – found:
  `docs/specs/skill-model-audit-2026-08.md`, and it says something sharper than he remembers.
  * **P1** – the asymptote (the last few per cent) costs **1.85 skill points at a middle coach, 0.66
    at elite+grind, 2.88 at self-coached** – under a year of development.
  * **P6** – and a skill point is worth about nine rank places: `+7.25` of skill moved the best rank
    **#203 → #139**. So the last few per cent are worth roughly 6-26 places, not 2-3.
  * **§6a, and this is the one that matters for his C1/C2 question** – across the WHOLE potential
    band, from the least talented girl the model can roll to the most, **the realised share does not
    move at all: 94.1% every time.** Realisation is a constant, not an outcome.
  * **P2** – what DOES move it is whether the career survives: 94.1% isolated against **72.8%** for a
    grinder, and **44.3%** for a p10 career that is over at nineteen.

  ⚠⚠ **So the differentiator today is whether the career ENDS, not how well it is run** – which is
  the opposite of what he is asking for («1. игрок тренирует сам и грамотно 2. долгосрочный тренер и
  метч 3. элитный тренер»). C1/C2 is therefore neither «raise the ceiling» nor «lower it» but **make
  realisation respond to how the career was run at all.**

- [~] **6e. His challenge to my #400 number, and he was right to make it** – «будучи в топ-100 и
  топ-50 она сливала матчи в w50, w75 причем хорошо сливала, стабильно». I had quoted a closed form
  against whoever sits at a RANK in the merged table, which is not who a w50 draw contains. Asked the
  game instead (`tools/r38-field-read.ts`, the shipped previewer's own `fieldChance`), at week 1115,
  rank #141:

  | rung | may she enter | vs the FIELD | the card's word |
  | --- | --- | ---: | --- |
  | w15 | **no – outgrown** | **72.6%** | favourite |
  | w35 | **no – outgrown** | **57.8%** | even |
  | w50 | yes | 47.2% | even |
  | w75 | yes | 38.8% | even |
  | w100 | yes | 31.1% | strong |
  | wta125 | yes | 26.7% | strong |
  | wta250 | yes | 19.6% | strong |
  | wta500 | **no – misses the cut** | 18.0% | strong |
  | slam | **no – misses the cut** | 27.7% | strong |

  **His memory is exact: at w50 she is a coin flip and at w75 she is 38.8%.** The two rungs where she
  is a favourite are the two she is barred from. ⚠ And the card next week literally offers her a
  **90.7%** first-round chance at a w15 she may not enter, beside a **20.6%** at the wta500 she may.

- [>] **8. The academy's worth** – ⭐ **HE CHOSE C AND ADDED THE HALF I HAD MISSED**, 07.09: «хорошо
  звучит, а что на счет стоимости и индексации этой стоимости с годами? Как с домами, например.»

  ⚠ AND THE ANSWER IS ONE NUMBER: `assetValueCents` already indexes every rung by
  `annualRateBps`, and **the academy is the only family on the shelf carrying ZERO** – houses carry
  +300 bps, the fund +700, cars −600 to −1500, boats and planes −500 to −700. Spec:
  `docs/specs/academy-worth-2026-09.md`, two independent halves: the houses' drift, and the
  reputation premium with the paid price as a floor. ⚠ Option B (price it on earnings like the brand)
  was measured and refused – it would have cut his academy from $5.0M to $1.4M.

- [ ] **9. Wave A – the snapshot cache** – he pulled it into this round. Plan already written:
  `docs/specs/next-waves-2026-09.md` Wave A, steps A1-A5. Nothing about saves changes.

- [x] **10. Wave B – one owner out of `App.vue`** – same, steps B1-B4. **SHIPPED, all four steps.**
  `src/composables/tabSeen.ts` owns the four tab "seen" marks, their four watchers and their four dot
  computeds; `App.vue` calls it once and renders. Nothing else moved – the mail chime, the week loop
  and the trophy flight stayed, and each is named in the module header as staying.
  - **B1** – `tests/component/r38-tab-seen.test.ts`, six arms, mounted, driven through the bar's
    buttons and Home's next-tournament plate. Written and made red BEFORE the move: inverting any of
    the four conditions (`t === 'x'` → `t !== 'x'`) fails it in two arms each. Green, byte-unchanged,
    after the move. A **seventh arm was added after B2**, deliberately not folded into the five: the
    per-device property itself – a private window (storage that THROWS on the property access) costs
    the dots and never the shell. Unguarding `useWatermark`'s read turns that arm, and only that arm,
    red on the mount with `SecurityError`.
  - **B2** – the move, verbatim, comments included. `vue-tsc -b --force` clean.
  - **B3** – the pin query first (`git grep -l "App.vue'" -- tests/`): 48 files / 76 line hits, of
    which 27 comment-only, 21 SFC imports, 28 source reads. Exactly **3 files / 7 tests** went red and
    every one had been predicted. All re-aimed at `componentLogic`, none deleted or weakened.
    ⚠ And `componentLogic` itself had a hole: its pattern required `../composables/`, so for `App.vue`
    – the one SFC at the root of `src/` – it silently returned the `.vue` alone. Fixed and
    mutation-proved (narrowing it back turns six of the re-aimed tests red).
  - **B4** – `App.vue`'s script block: **1,505 → 1,378 lines (−127, −8.4%)**, of which 1,014 → 957
    are comments. `tabSeen.ts` is 258 lines: 87 code, 160 comment, 11 blank. The shell still holds
    seven concerns and is still too long to read in one sitting; this is one seam, reported and not
    celebrated.

---

## Wave C, as `docs/specs/next-waves-2026-09.md` recorded it

- [?] **C1 – the age curve.** ⚠ **C0 measured it and the proposal does not survive.** The pair C1
  would move (`ECONOMY.development.ageCurve`) is the PRE-FORK curve; a real career resolves
  `ageRoutes` – `direct {22, 27}`, `college {23, 29}` – so moving it would have moved nothing.
  And growth does not stop at `plateauStart`: `plateauRate` is 0.0009, and careers already peak at
  **26.55 direct / 28.56 college** against his own reference of `24-26 / 25-28`. C1 as written would
  push the peak to 32-33. Now an `ask` – question 4.
- [ ] **C2 – `potentialBand`.** [4, 26] at a measured 93.3% exhausted; target 30-40%. After C1.
- [ ] **C3 – coach tenure.** ⚠ BLOCKED on his own «как это не превратить в гарантию?».
- [ ] **C4 – the two skills that never reach the field.** One calibrated closed form for everybody.

---

## Questions for him

⭐ **Questions 1, 2 and 4 were ANSWERED on 06.09 and are struck through below rather than deleted –
the ledger records what was asked and what came back, and the next round audits both.**

1. ~~**The brand's decay rate (2b).**~~ **ANSWERED: smoother, and together with worth and income.**
   Building as 2c. Kept for the argument it carries: A brand loses about a quarter of its worth and its income every
   season once the titles stop, and it compounds because the multiple falls with fame too. Three
   shapes: **A** leave it – a business built on fame is supposed to fade with fame; **B** floor the
   WORTH at a share of its own peak, the way `brandStrengthAt` already floors the reach, so a
   $11M brand cannot decay below, say, $3-4M while it still trades; **C** slow the clock – raise
   `fame.halfLifeWeeks` from 104 so a career's fame outlives its last title by longer.
   My reading: **B**. The income SHOULD fade – she stopped winning – but the shelf card is an asset
   the player bought, and an asset with no floor is the one thing on the shelf that can quietly go
   to zero while he is looking at something else.

2. ~~**The decline floor (3d).**~~ **ANSWERED: «плавнее», with the harsh end allowed to stay.**
   Building as 3d. Kept for the argument: The field's pros stop falling at 55% of their peak and then retire.
   She has no such floor and no such retirement. Three shapes: **A** leave it; **B** give her the
   same 0.55 floor of her own peak, so a 35-year-old is a diminished player and not a fourteen-year-
   old; **C** make the retirement offer harder to refuse past a point, so the six extensions become
   two. My reading: **B and C together**, and B first – it is one constant and one guard.

4. ~~**The age curve (C1).**~~ ⚠ STILL OPEN – he answered 1 and 2 and did not reach this one.

4b. **The age curve (C1), restated.** You objected that «рост как раз идёт до 28-29», and the measurement says
   you are right about the age: she peaks at **26.6** going direct and **28.6** via college. What she
   gains between 22 and that peak is **under one point**. So: **A** leave the curve alone – the peak
   is already where your own reference table puts it; **B** raise `plateauRate` so the late years are
   worth something without moving the peak; **C** move the peak anyway, which means moving
   `ageRoutes` and accepting peaks at 31-33. My reading: **B**, and only after C2 – the plateau being
   thin and the ceiling being exhausted are the same complaint seen from two ends.

5. ~~**The travel class (1).**~~ **ANSWERED, and better than any of the three offered** – see item 1
   and `docs/specs/travel-class-2026-09.md` §4. Held out of this wave by his own word.
