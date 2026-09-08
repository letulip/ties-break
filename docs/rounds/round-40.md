---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-08
---

# Round 40 – the prologue's choices, 2 items (08.09.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

---

- [>] **1. «у нас там есть ряд кнопок, которые, как говорят мои тестеры "не делают ничего", например
  выбор ordinary school/sports school. Надо их найти все там (точно не только это две) и переделать
  интерфейсно на более явный выбор, не чекбокс, а как радио может, но что-то, что их отличит от
  обычных кнопок как-то визуально»** – **build.**

  ⚠ The tester's sentence is the diagnosis, not a complaint about responsiveness: those controls DO
  something – they SELECT – and the prologue renders them like the buttons that ADVANCE, so pressing
  one and seeing the screen stay put reads as a dead control. The item is to make selecting look
  like selecting. His own steer: radio-like, not a checkbox, and visually apart from an ordinary
  button. ⚠ «точно не только эти две» – the census is part of the work, not an afterthought.

  ⭐ **HIS VISUAL (08.09): the selected radio IS the ball.** «можно кастомный радио-батон построить в
  виде теннисного мячика (я имею в виду нашу желтую точку с логотипа в стиле минимализм без лишних
  элементов) мне кажется, может получиться вполне мило.» Both facts the build needs: the mark exists
  as `public/ball.svg` (fill `#C6E12B`, white seam), and the palette already carries its sibling
  `--accent` = `#cfe152`. ⚠ The control uses the TOKEN, never a hard-coded hex – the app is
  themed and a literal would go wrong in one of them. ⚠ Minimal is read strictly: a filled dot in the
  accent, no seam curve, no gloss, no ring beyond what the UNSELECTED state needs to be visible at
  all. The ball is used nowhere in the UI today (asset only), so this is its first appearance
  in-product: it should read as the product's own dot, not as a picture of a ball.

- [>] **2. «когда есть 2 группы кнопок, пока верхние не нажаты нижние ничего не делают, может быть
  сделать, чтобы человек сначала делал верхний выбор, а потом на этом же экране появлялись следующие
  кнопки, чтобы флоу был более явным?»** – **build.** Progressive disclosure on the same screen: the
  second group is not rendered until the first choice exists, so a control is never on screen while
  it cannot work. The first group stays visible and re-choosable after the second appears – a
  disclosed step must not become a trap.

  ⚠ **HIS REFINEMENT (08.09): «верно, но при отжатом верхнем нижний не должен быть доступен».** So
  the second group's availability is DERIVED from the first choice's current value, every render –
  it is not a latch that stays open once opened. The distinction is the whole item: a one-way reveal
  would leave the lower controls live in a state where they cannot work, which is the same defect as
  item 1 wearing different clothes. Unset above -> unavailable below, at any moment, not only on the
  first pass.

---

## Carried in from round 39, still open

- [ ] **r39 #14a/#14b – the retirement voice and «she is done» as a state.** The four ledes are
  drafted and the mechanism is approved; the TRIGGER is being measured now
  (`tools/r40-retire-trigger.ts`), because the owner named why it cannot be guessed: «она буквально
  на пике карьеры начинает говорить, что "всё"». ⚠ Structural finding while reading the code: the
  plateau branch of `retirementDue` CANNOT fire past `askFromAgeYears` (29) – the age branch returns
  first – so the card lives in 24-28 by construction, which is exactly her peak. His objection is
  the shape of the mechanism, not its tuning.

  ⭐⭐ **MEASURED (`tools/r40-retire-trigger.ts`, 108 careers x 900 weeks, the engine's own
  `plateauViewOf`), and the answer is that NO trigger in this window can be right.**

  | | |
  | --- | --- |
  | careers the card ever asks | **52 of 108 – 48.1%**, 141 asks, ages 24-28 (median 26) |
  | careers where she beat that day's rank later | **52 of 52 – 100%** |
  | careers where the FIRST ask preceded a better rank | **50 of 52 – 96.2%** |

  | candidate trigger | fires on | premature |
  | --- | --- | --- |
  | K = 4 one-more-years | 14 of 52 (26.9%) | **14 – 100%** |
  | K = 3 one-more-years | 22 of 52 (42.3%) | **22 – 100%** |
  | physical share <= 0.90 | **0** | – |
  | physical share <= 0.80 | **0** | – |
  | composure + stamina below their mean | 4 of 52 (7.7%) | **4 – 100%** |
  | age >= 27 AND K >= 2 | 33 of 52 (63.5%) | **33 – 100%** |

  ⚠ **The body cannot speak here, by construction.** `declineStart` IS 29 and the plateau branch
  cannot fire past `askFromAgeYears` = 29, so physical share is exactly 1.000 at every ask – a
  wrecked career reads 100% at 28 as surely as a kept one. That is why both share thresholds fire on
  zero careers and would on any corpus. His «завязать на хладнокровие+выносливость» meets the same
  wall from the other side: before 29 those two do not fall, they RISE.

  ⭐ **So the finding is not «which trigger» – it is that the plateau card is her DOUBT and not a
  prediction.** Read as prognosis it is wrong 96.2% of the time. Read as doubt it is right every
  time: she says she cannot reach the top, the parent says keep going, and she breaks through. That
  is the story the numbers actually describe.

  **RECOMMENDATION, for his word:**
  * **14a ships** – the four escalating ledes keyed on `oneMoreYearCount`, pure copy on a card that
    already exists, no trigger change. ⚠ They must read as doubt, never as forecast; the shipped
    lede's «If she cannot reach the top, she would rather go now» is the one line the world
    contradicts 96% of the time.
  * **14b moves to the age branch (29+), where the body actually moves** and `physicalShare` is a
    real signal rather than a constant. His «she is done» becomes an earlier band there, above the
    existing `lastOfferPeakShare` 0.55. That needs its own measurement – when each candidate band
    fires past 29, and what she does after – and it is the next probe, not a guess.

  ⭐⭐ **14b MEASURED (`tools/r40-age-branch.ts`, 108 careers x 1900 weeks): THE SHIPPED BAND IS
  ALREADY THE HONEST PLACE, and every earlier one takes trophies off her.**

  | band | median age | titles she still won after it | max | won nothing more |
  | --- | ---: | ---: | ---: | ---: |
  | share <= 0.95 | 31 | **9** | 23 | 40.7% |
  | share <= 0.90 | 33 | 7 | 19 | 41.7% |
  | share <= 0.85 | 34 | 6 | 19 | 41.7% |
  | share <= 0.80 | 36 | 3 | 17 | 42.6% |
  | share <= 0.75 | 37 | 2 | 16 | 43.5% |
  | share <= 0.70 | 38 | 1 | 11 | 46.3% |
  | **share <= 0.55 (SHIPPED)** | **42** | **0** | 4 | **71.3%** |

  ⚠ The «won nothing more» column is NOT the discriminator – it sits at 41-46% even at the top,
  because plenty of careers were never going to win again whatever the band said. The median is:
  it reaches **zero only at the shipped 0.55**. An earlier «she is done» would cost her a median of
  1 title at 0.70 and 3 at 0.80, and as many as 11 and 17 in the careers that had most left.

  ⭐ **So the recommendation is not a new band.** The engine already turns the question final in the
  right place, and round 38's `lastWordLine` already makes that offer HER sentence rather than a
  formality. What 14b is really missing is not a state – it is WARNING: nothing on screen says the
  last winter is coming until it arrives. That is a Home read, not a new mechanic, and it is
  cheap. ⚠ Owner's word before anything is built.
