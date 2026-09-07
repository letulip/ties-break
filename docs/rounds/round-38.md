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
  * ⚠⚠ **I FIRST WROTE THAT THE LADDER HAS NO WAY DOWN. THAT WAS WRONG AND IT IS CORRECTED.**
    `playDownBars` is a RANK READ that persists nothing: `fromAllW: 50` bars every W event inside
    the top 50, `fromLowW: 150` bars w15 and w35 inside 150 – and the owner named the property
    himself on 15.08, «когда она вывалится из топ-50 и топ-150 оно само откроется обратно». She is
    **#141**: those two rungs are shut by NINE PLACES and open by themselves. Everything from w50
    upward was open all along.
  * **What is actually wrong is LAG.** Her rank is a 52-week trailing sum, so it stands about a
    hundred places above her level for a season: #141 on the table, ~#250 by her chance against a w50
    field. ⭐ Which is what he said before the measurement ran: «она играет на уровне #250 с рангом
    #141… до конца сезона она просто по очкам проигрыша как раз упадет к этим 250».
  * condition is not the cause: `conditionMatchFactor` is flat from 70 to 100 and she is at 94.1.

- [~] **6b. The ladder's way down** – ⚠ **WITHDRAWN: it already exists and it is his own design.**
  See the correction above. Nothing to build; what is left of the finding is the LAG, and that is a
  question about the ranking window rather than about access.

- [ ] **6c. His own proposal: the ageing penalty moves from skills toward condition** – «может она
  должна больше уставать и больше терять за матч своей кондиции, но не падать по навыкам до уровня
  12 лет». Costed in the spec §5: it is real, the code is closer to it than it looks
  (`conditionMatchFactor` already scales all five attributes), and it touches three curves and every
  AI result. ⚠ Needs his word.

- [x] **6d. Her own voice on her own decline** – «нужно чётко понимать, что карьера уже не та и явно
  это подсвечивать, как раз срез года закончить/продолжать... там нужно больше её голоса (или голоса
  тренера, если он есть, или совместного)». Content on a screen that already exists. ⚠ Ships with
  whichever of 6b/6c goes first, so the player is told what is happening while it happens.

  **SHIPPED, in two places, and it ships WITHOUT 6b/6c** – his 07.09 follow-up moved it: «вполне
  можно вернуть на home и как раз расширить на старение тоже, чтобы было видно, что оно пошло». No
  save schema, no migration, no MAIN draw: both readings are derived at snapshot time.

  **(a) THE COACH PLATE IS BACK ON HOME, CARRYING THE DECLINE READ AND NOTHING ELSE.**
  `Snapshot.coachDeclineNote` is a NEW field beside `coachRoomNote` and it is the empty string on
  every career that has not passed its own `declineStart` – so the sentence round 34 #2a sent away
  («Close to her ceiling» to a fourteen-year-old, «звучит как приговор») cannot reach Home through
  this line even if every condition on the template were deleted. ⭐ The guarantee is in the DATA,
  not in a `v-if`. Rendered on his week-1115 career:

  > Past her peak – down 57 places on the year, and her body has about 6 more seasons in it.

  **(b) SHE SPEAKS AT THE SEASON CUT.** `RetirementDialog` already carried round 31 #9's rung, which
  is her BODY; her PERFORMANCE was nowhere on the one card where a season is closed. One added
  passage, hers, with his coach agreeing under it when she has one, off `seasonHistory`'s own
  integers:

  > «#68 last winter, #125 this one. I can read a table as well as you can.»
  > M. Ricci does not argue with her. The work holds what she has left; it stopped adding to it a
  > while ago.

  ⚠ IT SAYS NOTHING RATHER THAN SOMETHING VAGUE – three silences, all deliberate: no banked
  professional season, a year she IMPROVED on that is also her own best, and a history with a gap
  where «last winter» would be a false sentence with a true number in it.

  ⚠ HIS ROUND-30 LEDE AND ROUND-31 RUNG ARE UNTOUCHED, to the byte, and `tests/component/
  last-word.test.ts`'s pins on them stay green. The added paragraphs are measured against a 375x667
  phone (`assertDismissReachable`) and the measurement is mutation-proved.

- [~] **7. «Куда делась надпись с плашки тренера на главной?»** – answered: **he moved it himself.**
  Round 34 #2a, his own words: «Тренер на главном экране (почему-то, давай на карточку тренера
  вернём лучше) написал 14 летней девочке Close to her ceiling … звучит как приговор». It lives on
  the coach card (`CoachMarketScreen`, `.cm-room-band`) and `HomeScreen.vue`'s note at the site says
  so. ⚠ What he is asking for NOW is different and is 6d: the coach speaking about her DECLINE, which
  has never existed anywhere.

- [x] **7b. THE COACH CARD IS TELLING A 35-YEAR-OLD SHE HAS «HUGE POTENTIAL»** – found while checking
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

  **FIXED, and reproduced on his save before and after.** `tools/r38-decline-read.ts` reads the
  week-1115 career through `decodeExportFile` and prints the rendered sentence. Before:

  > Huge potential – most of her game is still ahead of her, and this is where a coach buys the most.

  After:

  > Past her peak – down 57 places on the year, and her body has about 6 more seasons in it.

  **HOW.** `coachRoomNote` asks `coachDeclineNote` first, and past her own `declineStart` –
  `ageCurveOf(world.ageCurve, weeksLost)`, **28.85** for her, never the shipped 29 – it stops reading
  `realisedShare` at all. ⚠ `realisedShare` IS NOT TOUCHED and is not wrong: it answers «is there
  still room worth buying», which is the right question right up until the week `ageFactor` returns 0
  and there is no room to buy at all.

  **WHAT IT SAYS, AND WHY EACH NUMBER IS ONE THE ENGINE CAN STAND BEHIND.**
  * **the year-on-year move** – `seasonHistory[].byTrack.wta.endRank`, last banked season against the
    one before it, and ONLY when the two are adjacent (her own history skips s6-s8). #68 → #125.
  * **how many seasons the body has** – her measured `physicalMean / peakPhysical` walked forward at
    her own curve until it crosses `ENDINGS.lastOfferPeakShare`, which is the rule `ending.ts` itself
    uses to make a winter's question final. ⚠ **«Пара лет» is NOT derivable as a couple**: the honest
    figure on his save is **6.45 years**, so the sentence says six. A prose figure that contradicts
    its own constant is worse than one that cannot move with it.
  * **the fallbacks** – she may still CLIMB past her peak, so a year she rose reads «N places below
    her best season» instead, and a career sitting on its own best reads «no coach buys that back»,
    which is `ageFactor(age) === 0` said in words.

  ⚠ THE FOG OF WAR IS INTACT. Nothing in the decline read touches `skills` against `potential`; it
  reads her RANK (printed on four screens already) and `physicalShare` (on the wire since round 31
  #9). ⚠ And the label is deliberately NOT one of `ROOM_BANDS`': «Close to her ceiling» past the peak
  would say the one thing that is now false.

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

- [x] **8. The academy's worth** – ⭐ **HE CHOSE C AND ADDED THE HALF I HAD MISSED**, 07.09: «хорошо
  звучит, а что на счет стоимости и индексации этой стоимости с годами? Как с домами, например.»

  ⚠ AND THE ANSWER IS ONE NUMBER: `assetValueCents` already indexes every rung by
  `annualRateBps`, and **the academy is the only family on the shelf carrying ZERO** – houses carry
  +300 bps, the fund +700, cars −600 to −1500, boats and planes −500 to −700. Spec:
  `docs/specs/academy-worth-2026-09.md`, two independent halves: the houses' drift, and the
  reputation premium with the paid price as a floor. ⚠ Option B (price it on earnings like the brand)
  was measured and refused – it would have cut his academy from $5.0M to $1.4M.

  **SHIPPED, both halves, and `SAVE_SCHEMA_VERSION` did not move** – no migration and no new golden
  fixture, because the rate is read at valuation time off `paidCents` and `boughtWeek`, which every
  save already carries. **On his own week-1115 career, through `revalueAssets` and `shopView`:**

  | | today | + the drift | + the premium |
  | --- | ---: | ---: | ---: |
  | academy-land | $2,000,000 | $2,280,641 | **$2,904,966** |
  | academy-courts | $3,000,000 | $3,128,885 | **$3,985,417** |
  | **together** | **$5,000,000** | **$5,409,526** | **$6,890,384** |

  ⚠⚠ **And nothing else on the shelf moved a cent** – index-fund $1,819,442, house-first $298,036,
  merch-brand $5,172,791, car-good $100,100, identical in all three arms. The control was run rather
  than assumed: with both halves reverted in place the probe reprints the "today" column exactly and
  five pins in four files go red (`tools/r38-academy-worth.ts` – the shop probe walks synthetic bench
  careers and takes no save).

  ⭐ **HALF ONE** is four fields: `annualRateBps: 0 -> 300` on the four `academy-*` rungs, the houses'
  own number. One rate and not two – the spec's §2 refuses a land/building split while this family
  carries no maintenance line to justify the losing half.

  ⭐ **HALF TWO** is `premiumPerRep: 0.15` in `ECONOMY.business.academy`, read in `assetWorthCents`'s
  non-business branch for `family === 'academy'` only. At his reputation of 2.825 that is **+27.37%**
  on top of the drifted price. It starts at exactly zero – reputation is 1.0 until a season is banked
  – so **the paid price times the drift is a floor by construction**, which is the whole of option C.

  ⚠ **Three consequences named rather than absorbed** (spec §3a, and (a) is the one he will see
  first):
  * the shop card's sentence moved to the houses' own – **«Gains about 3% a season»** in place of
    «Neither gains nor loses». ⚠ **No string was edited**: `rateLine` picks its branch off
    `annualRatePct`, `MoneyScreen.vue` is untouched to the byte, and the mounted pin now also asserts
    the card says nothing about the premium. The zero branch is kept for the next rate-0 rung.
  * the academy now feeds the household strip's **shelf line** – the line the houses and the fund
    were already on. Nothing was added to the strip; a rate-0 academy simply moved it by zero.
  * ⚠ a stage bought today is worth more than it cost **the same week** on a reputable career (~$3.82M
    on a $3M `academy-staff` at reputation 2.825), because the shelf has priced a rung at what it is
    WORTH on the buying week since round 30 #9. That is the existing law applied to a second family –
    the merch brand already carries a 20x version of it on his save – but it is his call whether a
    premium bankable on the buying week stays open.

  ⚠ **One structural move**: `academyReputationOf` went from `world/business.ts` **down** into
  `world/assets.ts`. `assets.ts` is deliberately a leaf and `business.ts` imports it at runtime, so
  importing upward would have been a real cycle; `business.ts` re-exports the name, so every importer
  is untouched. Same shape, same reason as round 30 #9's `assetEarningsRateCents`.

- [x] **9. Wave A – the snapshot cache** – he pulled it into this round. Plan already written:
  `docs/specs/next-waves-2026-09.md` Wave A, steps A1-A5. Nothing about saves changes.

  **SHIPPED, A1-A5, and `SAVE_SCHEMA_VERSION` did not move** – no migration, no new golden fixture,
  no user-facing string. `toSnapshot` hot: **14.7 → 3.3 ms** on the professional career and
  **20.5 → 5.9 ms** on the junior one, against the spec's target of «13 ms → 5 ms or less».

  **A1 – the bench first** (`tools/snapshot-bench.ts`, `npm run bench:snapshot`). It times the
  worker's real loop – `structuredClone` → command → `toSnapshot` – per command kind on the three
  careers the 05.09 review profiled. Baseline before a single memo existed, 25 repeats, load 3.3-4.4,
  ms:

  | fixture | repeat | setPlan | setPhysio | buyKit | enterEvent | tick | clone |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | junior@w120 | 18.53 | 17.83 | 17.81 | 18.20 | 18.21 | 19.60 | 1.7 |
  | pro@w412 | 11.97 | 11.48 | 11.60 | 11.37 | 11.76 | 11.94 | 2.2 |
  | golden@w333 | 2.59 | 2.47 | 2.46 | refused | 2.44 | 1.36 | 1.8 |

  It reproduces P-02 within noise (the review read 13.0 ms hot / 2.3 ms clone on `pro`). The golden
  v70 career is at college, which is why it is cheap – no upcoming feed to preview – and why `buyKit`
  is refused there: `guardNotEnded`, the engine being right.

  **⚠ WHERE THE COST ACTUALLY WAS, and it is not where the review's remedy pointed.**
  `node --cpu-prof` over a snapshot-only loop on `pro`, inclusive share of `toSnapshot`:

  | | | | |
  | --- | --- | --- | --- |
  | `upcomingEvents` | 55.2% | `ratedField` | 15.8% |
  | ` preview` | 46.4% | `weekFieldExclusion` | 13.5% |
  | `  argsFor` | 36.0% | `kidPoints` | 11.4% |
  | `  previewEvent` | 10.3% | `rankingFor` | **7.7%** |
  | ` entryStatus` | 5.1% | `tierExpectedField` | 7.4% |

  Two corrections fell out of it. `kidPoints` is the LARGER of the two ledger folds, not `rankingFor`
  – the entry gates ask it once per upcoming event and each ask re-filters all 2,234 rows – so A2
  memoises both on the same content. And three quarters of a card's cost is `argsFor` ASSEMBLING the
  arguments rather than `previewEvent` folding them, so A3's memo sits one frame further out than the
  spec's wording suggests; wrapped around `previewEvent` alone it would have bought about a quarter
  of what it buys.

  **A2 – the ranking table's key and memo, alone** (`src/engine/world/ladder.ts`,
  `src/engine/world/derivedCache.ts`). Module-level, keyed by CONTENT: `(track, week, ledger, roster)`
  plus `(seed, fieldSeasonPoints)` on the W table; `kidPoints` takes the narrower key its fold
  deserves. The ledger's digest is paid once per snapshot through `appendOnlyToken`, whose
  append-only precondition was checked rather than assumed – three `push` sites, one filter that
  builds a new array, one wholesale replacement, and no line in `src/engine` that writes a row's
  fields. `world.cohort` is explicitly NOT such a list (`driftCohort` moves rows in place) and is
  folded in full. A2 alone: junior 20.5 → 12.2, pro 14.5 → 10.4 hot.

  **A3 – the far-horizon card, and the field it is banded against** (`src/engine/world/snapshot.ts`).
  Two memos. `ratedField` per (universe content, surface) – it composes a full match player for every
  one of ~1,800 rows in the W universe. And the WHOLE card past `DRAW_LEAD_WEEKS`, keyed
  `(seed, event id, tier, surface, universe token, her rating on that surface, her rested rating)`.
  ⭐ The key is exact out there and `firstRoundDraw`'s own first line is why: past the horizon it
  returns null before reading anything, so with no opponent the card reads `ranking`, `standing`,
  `excluded` and the pinned draw NOWHERE. The near card is untouched and memoised nowhere. One
  structural change rides with it: `wtaCtx` splits into the universe (what the BAND is folded from)
  and the draw's ranking + conditions, so a window of far cards no longer walks the whole ledger
  through `rivalConditions` to answer a question none of them asks.

  **A1's probe re-run, both arms on this commit, separated by `TB_SNAPSHOT_CACHE` only** – the
  control CLAUDE.md asks for, expressed as a switch rather than a worktree. 25 repeats, load 4.9-5.4,
  snapshot hot, ms:

  | fixture | command | off | on | delta |
  | --- | --- | --- | --- | --- |
  | junior@w120 | repeat | 20.51 | **5.85** | −71% |
  | junior@w120 | setPlan | 20.05 | **5.74** | −71% |
  | junior@w120 | setPhysio | 20.68 | **6.92** | −67% |
  | junior@w120 | buyKit | 19.97 | **5.99** | −70% |
  | junior@w120 | enterEvent | 19.92 | **5.43** | −73% |
  | junior@w120 | tick ⚠ | 21.43 | 15.54 | −27% |
  | pro@w412 | repeat | 14.71 | **3.27** | −78% |
  | pro@w412 | setPlan | 14.68 | **3.46** | −76% |
  | pro@w412 | setPhysio | 14.14 | **3.14** | −78% |
  | pro@w412 | buyKit | 13.10 | **3.11** | −76% |
  | pro@w412 | enterEvent | 12.93 | **2.96** | −77% |
  | pro@w412 | tick ⚠ | 13.16 | 12.19 | −7% |
  | golden@w333 | repeat | 3.11 | 2.16 | −31% |
  | golden@w333 | enterEvent | 3.44 | 2.08 | −40% |
  | golden@w333 | tick ⚠ | 1.81 | 1.94 | +7% |

  ⚠ **The `tick` rows run against an EMPTIED memo**, which is what a new week really is – without
  that, every repeat ticks the same base world to the same week and the second one would read the
  first one's cache. What they still show is within-snapshot de-duplication of ~490 identical folds,
  which is real and is not reuse across a command. ⚠ And `golden`'s +7% is the honest cost of the
  keys themselves on a career the memo cannot help: she is at college, there is no feed, and building
  a key buys nothing. It is ~0.1 ms. ⚠ Two more numbers that are NOT in the medians: `pro buyKit`
  reads **8.75 ms cold** – a purchase moves her rating, so every card's key changes and the first
  snapshot after it re-previews the window – and the bench's own null-arm check prints
  `ranking 242,761 hit / 673 miss · preview 6,890 / 1,370 · rated 293 / 284` with the cache on and
  `0/0` with it off, so neither arm is measuring the wrong tree.

  **A4 – `TB_SNAPSHOT_VERIFY=1`** (`tests/snapshot-cache-verify.test.ts`, in `HEAVY_SIM_FILES`).
  Every memoised fold computes both answers and throws on a difference NAMING THE KEY; off in the
  product, on for all 71 golden fixtures and the six e2e careers. **Mutation-verified, and the second
  mutation found a real hole in the arm rather than confirming it:**

  * `rankingKey` with the ledger dropped → RED on the first fixture,
    `the ranking memo returned a different answer than a fresh fold for key "itf|w3|199.4051447544"`,
    cached all-zero table against a fresh one with 1,800 points – thrown inside `migrateSave` →
    `replayMainState` → `recomputeKidRank`, i.e. on the LOAD path, which is exactly where his
    question about old saves lives.
  * the far-card key with her two RATINGS dropped → still **green, 79/79**. No fixture in the corpus
    presents two worlds that share a week, a cohort and an event id while she is a different player.
    A guard that cannot fail on the mutation it exists for is not a guard, so the kit-purchase case
    was added – buy her a rung of strings, which moves her rating and nothing either table reads –
    and the same mutation then reads
    `the preview memo returned a different answer … for key "far|e2e-pro-0|8-w416-w15|w15|hard|wta.1799.2520396076"`.
    It asserts the rating actually moved, so it cannot decay into two identical worlds agreeing.

  It also carries an anti-vacuity census: 21 of the 71 fixtures are at college and preview nothing,
  so the corpus is required to reach all three memos (measured today: 49 fixtures carry a feed;
  16,229 / 390 / 91 misses across it). Both mutations reverted, files diffed clean against their
  pre-mutation copies. 80/80 green in 20.6 s.

  **A5 – the frozen careers and the parity spec.** `tests/coachTravelEdgeFixtures.ts` is untouched by
  this branch and its three hashes are **unmoved**, asserted green:

  ```
  middleGrinder    0ea52c5e584c92945c926cd41ad13a6d5a004dc9048937a047e0d052584ee051
  eliteGrinder     58025fd6210842129fca13520f3c4b664ebe584006f1f9ad7c3895cc0eba15f3
  selfTravelling   24353723dc9af07d04d4d4eddb534d9d573939436564f22f2ba7362643242867
  ```

  `coach-travel-edge`, `-helping`, `-older-schemas`, `condition` (the frozen MAIN capture 41550 /
  `e6b0c709`), `goldenSaves`, `migrations` and `round32-brand-inertia`: **377/377 green**. The parity
  harness `e2e/parity.spec.ts` re-run against a fresh production build: **29/29 green in 18.1 s**.
  Nothing here draws on any RNG stream, so the MAIN capture needed no re-pin – and could not have
  moved.

  **The gate, read out of the files and not out of a notification.** `CHECK_EXIT=0` – bulk unit 4,342
  tests + 13 heavy shards, component 142 files / 1,604 tests, seven doc gates, both typechecks, the
  build and the install-size guard (15,768 KiB, 616 under the ceiling). `SIM_EXIT=0` – 13 files green
  in 372 s, `snapshot-cache-verify` among them at 19 s. ⚠ Both background completion notices claimed
  *exit code 0* for the FIRST `check`, whose log said `CHECK_EXIT=2`; CLAUDE.md's note about that lie
  earned its place again.

  ⚠ **One inherited red had to be cleared to gate at all**, and it is not this wave's:
  `tools/r38-decline-cliff.ts` arrived with `91084738` importing `KidSkills` from the `world` barrel,
  which does not export it. `check:tools` fails fast, so that one line took the unit suite, the
  component suite, the build and the install-size guard down with it for everybody on `round/38`.
  Reproduced at `91084738` in a detached worktree – identical error, exit 2 – then fixed the way
  `52c9ab78` fixed `r38-save-read`: the import moved to `src/engine/development`, where the type is
  declared, and nothing else touched.

- [ ] **10. Wave B – one owner out of `App.vue`** – same, steps B1-B4.

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

- [~] **11. «Может ли бренд дойти до нуля?»** – answered, and the answer is that **the state he
  describes is not reachable.** «При условии, что нет вообще участия в турнирах и движения по
  лестнице» requires a world that ticks while she does not play, and `guardNotEnded` refuses EVERY
  mutating command the moment `world.ending` is set – the only pause that is not an end is the college
  freeze, and that one also refuses the shop. So there is no five-year silence to price: in the game
  the brand's worth is always read on a career that is still going.

  ⭐ **So my recommendation is to leave the formula alone**, and the round-32 argument is the one that
  covers what is left: `assetWorthCents`' own note cites Björn Borg's company going bankrupt in 1990
  and the NAME selling outright for $18M in 2006. A floor at 0.4 of her own peak fame is only ever
  read by a name that is still on tour. ⚠ What WAS wrong – presence buying nothing – is fixed in #2c,
  and that was the real content of his complaint.

  ⚠ If he wants the zero case anyway it is a different feature, not a constant: a career that can be
  PAUSED, and there is no such state today.

- [~] **12. C1/C2, and his memory of the measurement was right** – «мощный тренер + мощный скилл могут
  выше 100% дать совокупно». Confirmed, `tools/r34-reachable-ceiling.ts` §2:

  | arm | reaches | against the BARE-CURVE denominator |
  | --- | ---: | --- |
  | bare curve – no coach, no matches | 0.8668 | 1.000 |
  | self-coached, badly matched | 0.7885 | 0.910 |
  | budget coach, well matched | 0.8661 | 0.999 |
  | middle coach, well matched | 0.8894 | **1.000, clamped** |
  | elite + great fit | 0.9124 | **1.000, clamped** |
  | elite + great + grind + three matches a week | **0.9919** | **1.000, clamped** |

  ⭐⭐ **AND IT REFRAMES C2 A THIRD TIME.** A perfectly-run career already reaches **99.2%** of the raw
  headroom – 100% is reachable today. What does NOT happen is the other end: the WORST-run career, self
  coached and badly matched, still realises **78.9%**. So the spread is not missing at the top, it is
  missing at the bottom, and «раздвинуть шкалу» means **making bad career management cost more**, not
  moving the ceiling at either end. That is a different measurement from the one C2 has written and it
  is the one to run.

- [x] **6c. Which skills age, and how fast** – SHIPPED. ⭐ HIS RULING, 07.09: «может быть и навыки могут
  деградировать, это вполне ок, надо только подумать какие и с какой скоростью», and «деньги покупают
  восстановление и это ок» – which CLOSES the recovery finding (§1 of the ageing spec) as a
  non-defect. Spec written with the four weights and his own career's table:
  `docs/specs/what-ages-first-2026-09.md`. ⭐ **HE APPROVED THEM: «веса ок, строй и меряй пожалуйста».**

  **Built:** `ECONOMY.development.ageWeight` holds the four RAW numbers (serve 0.6, ret 1.2, stamina
  1.6, groundstrokes 1.0) and `ageWeightOf` divides by their own mean, so `mean === 1` holds BY
  CONSTRUCTION however they are retuned – which is what keeps `physicalMean / peakPhysical` on its
  path. `growWeek`'s decline branch reads it.

  **Measured** (`tools/r38-decline-shape.ts --save`, the shipped arithmetic, predicted against
  measured): serve **49.62** where one rate gives 45.13, stamina **44.30** where one rate gives 48.71,
  and the physical mean moves by **0.00**. ⭐ Attributes finishing below the build she was born with:
  **two on one rate, ONE with the weights** – her serve ends **+3.72 above** where it started instead
  of below it. Every prediction within 0.22 of a point.

  ⚠ **Four pins re-aimed, none deleted, each with the measured worst-case drift**: the weekly mean is
  no longer exactly `(1 − decline)` (worst 0.0031 of 675 weeks), two differently-shaped bodies no
  longer hold an identical share (worst 0.0084), three careers at 38 spread by 0.0020, and the v62
  peak reconstruction lands within 1.37% instead of on floating-point equality. ⚠⚠ That last one is an
  artefact of the FIXTURE and not a defect for any real save – a genuine v61 career was played
  entirely under the single factor, so running that factor backwards is exactly right for it, and the
  migration is deliberately untouched. `physicalMean`'s header, which claimed the mean was EXACT, is
  corrected in the same commit.

  ⚠ The recovery corridor moved by at most 0.04 of a point (4.49 → 4.46 at 33), re-aimed with its
  reading.

- [!] **13. ⚠⚠ A LIVE MONEY LOOP ON THE SHELF, AND IT IS NOT ROUND 38'S** – found while checking a
  consequence the academy agent flagged. `buyAsset` charges the CATALOGUE price (`entryCents`) while
  `sellAsset` pays what the row is WORTH (`owned.valueCents`), and `buyAsset` refuses only a rung
  currently owned. So a rung whose worth is DERIVED rather than paid can be sold and bought straight
  back. Measured on his week-1115 save, through the shipped commands:

  ```
  merch-brand: paid $250,000, worth $2,576,989
     sold for $2,576,989, re-bought for $250,000
     NET +$2,326,989 ... and it is worth $5,172,791 again
  ```

  ⚠ **Repeatable, in one week, unbounded.** It exists on `main` today – it is `entryCents` against
  `brandGrossWorthCents` and owes nothing to this round.

  ⚠⚠ **AND THE ACADEMY PREMIUM WOULD OPEN A SECOND ONE.** The same probe reads **NET $0** on
  `academy-courts` today, because its worth is exactly what was paid – which is the very thing item 8
  changes. At the measured premium a $3,000,000 stage is worth ~$3,985,000 the same week, so the
  cycle would pay about **$985,000** with no build delay to slow it (no academy rung carries
  `buildWeeks`).

  ⭐ **Proposed fix, one line, closing both:** a rung whose worth is derived is BOUGHT at
  `max(entryCents, its current worth)`. A first purchase is unchanged – a brand with no fame is worth
  its floor – and a buy-back after a sale costs what the thing is now worth, which is what any market
  does. ⚠ HIS CALL, and item 8 is held until it is made.

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
