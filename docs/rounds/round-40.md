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

- [x] **1. «у нас там есть ряд кнопок, которые, как говорят мои тестеры "не делают ничего", например
  выбор ordinary school/sports school. Надо их найти все там (точно не только это две) и переделать
  интерфейсно на более явный выбор, не чекбокс, а как радио может, но что-то, что их отличит от
  обычных кнопок как-то визуально»** – **build.** Shipped on `r40/wave-a`.

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

  **THE CENSUS – every control in the prologue that sets a value.** Walked off `src/prologue/cards.ts`
  rather than typed, and the count is asserted by `tests/component/round40-prologue-choices.test.ts`
  so a card that grows an answer is covered the day it is added.

  | control | screen | what it sets | changed |
  | --- | --- | --- | --- |
  | `working` / `middle` / `wealthy` | age 5, the origins | `run.origin` – the family's money for nine years (`FamilyBackground`) | ✅ radio |
  | `municipal` / `club` | age 8 | the year's practice, teaching, focus and cost | ✅ radio |
  | `group` / `one-to-one` | age 9 | as above | ✅ radio |
  | `stay-home` / `enter` | age 10 | as above, and whether she plays that year's Local Open | ✅ radio |
  | `ordinary-school` / `sports-school` | age 11 | as above – **the two he named** | ✅ radio |
  | `let-her-stop` / `finish-the-year` | age 12, the tired face | as above | ✅ radio |
  | `keep-the-size` / `give-her-the-year` | age 12, the wants-more face | as above | ✅ radio |
  | `enter-open` / `skip-open` | ages 11, 12 (both faces) and 13 | `run.entries[age]` – whether she enters the Local Open | ✅ radio |
  | the country tiles | age 5, the identity block | `identity.country` | ❌ – it already carries a chosen state (`aria-pressed` + a filled tile), it is a picker and not a column of buttons, so the diagnosis does not reach it, and «do not redesign the picker» stands (02.09). ⚠ Its state is a TOGGLE rather than a radio; making it one would fork the wizard's own shipped control, so it is an ASK rather than a change |
  | the month / day selects | age 5, the identity block | `identity.birthMonth` / `birthDay` | ❌ – native `<select>`s, which already announce a selection |
  | the two name fields | age 5, the identity block | `identity.kidName` / `kidLastName` | ❌ – text fields, not buttons |
  | `Browse all countries` | age 5, the identity block | nothing – it opens the picker | ❌ – a discloser; the screen visibly changes under it |
  | the mute icon | every prologue screen | sound on/off | ❌ – already `role="switch"` with an honest `aria-checked`, and it changes its own glyph on the press |
  | `continueLabel` (the quiet cards and the four weekend result scenes) | ages 6, 7 and every result scene | nothing – it advances | ❌ – **the negative arm**: it must NOT gain the affordance, or «a selection looks like a selection» means nothing |
  | the way out of the prologue (`WALK_COPY.skip`) | age 5 | nothing – it leaves for the wizard | ❌ – same |
  | `Go on` / `Start again` | the handover | nothing – advance / restart | ❌ – same |
  | `Begin`, `Watch match`, `Skip the rest of the weekend`, `Skip to the result` | the weekend | nothing – advance | ❌ – same |

  **What shipped.** 23 selecting controls across ten scenes are now real radios: `role="radio"` with
  an honest `aria-checked` inside a `role="radiogroup"` named by the line it answers (the five's own
  question, the title on 8..12, the ask's line) – no new string anywhere. Visually they leave the
  advance button's accent wash and take the two tokens this card's own FIELDS use (`--card-top` on a
  `--line` hairline) plus a radio mark that fills when the answer is taken; the checked state is the
  mark and the edge rather than a fill, because `--accent-fill` over `--card-top` measures 4.29:1 on
  the note and round-17 #3 is what that rule exists for. Arrow keys walk each group, Space commits
  (arrows deliberately do not select – on 8, 9 and 10 a selection finishes the card). ⚠ Not one
  label changed (invariant 4).

- [x] **2. «когда есть 2 группы кнопок, пока верхние не нажаты нижние ничего не делают, может быть
  сделать, чтобы человек сначала делал верхний выбор, а потом на этом же экране появлялись следующие
  кнопки, чтобы флоу был более явным?»** – **build.** Shipped on `r40/wave-a`. Progressive disclosure
  on the same screen: the second group is not rendered until the first choice exists, so a control is
  never on screen while it cannot work. The first group stays visible and re-choosable after the
  second appears – a disclosed step must not become a trap.

  **Where it applies:** the three card faces that carry a decision AND a tournament question – age 11,
  age 12 (tired) and age 12 (wants more). The thirteenth carries the question and no decision of its
  own (`sameAsLastYear`), so it has no upper group to wait behind and asks straight away. The age-5
  card's two blocks (the identity fields, the three origins) are NOT a case of this: neither waits on
  the other, both work from the moment the card arrives.

  ⚠ Nothing is cleared when the first choice changes, because nothing can be invalidated: the ask
  belongs to the CARD ROW and the twelfth's two faces are derived from years 5..11, not from the
  twelfth's own pick – so no answer to the first question can change which question the second is.

  ⚠ This is not round 35 #4 returning. That defect was two SCENES on one painting (the lede replaced,
  the card's own answers replaced); here nothing above is replaced – the scene, the reading and the
  year's answers all stay, and the ask's line and pair are added under them. `round35-prologue.test.ts`'s
  no-repeat guard was re-aimed to say exactly that: a screen may GROW, never change.

  ⚠ **HIS REFINEMENT (08.09): «верно, но при отжатом верхнем нижний не должен быть доступен».** So
  the second group's availability is DERIVED from the first choice's current value, every render –
  it is not a latch that stays open once opened. The distinction is the whole item: a one-way reveal
  would leave the lower controls live in a state where they cannot work, which is the same defect as
  item 1 wearing different clothes. Unset above -> unavailable below, at any moment, not only on the
  first pass.

---

## Carried in from round 39, still open

- [x] **r39 #14a/#14b – the retirement voice and «she is done» as a state.** The four ledes are
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

  ---

  ⭐⭐⭐ **14b BUILT ON `r40/wave-c` – ONE DERIVATION, THREE VOICES.** The owner, 08.09: «да, это
  именно то, о чем я и говорил. Где-то тренер может подсветить, где-то она сама, где-то финальный
  экран сезона. Давай сделаем.» His window: «за сезон-два до того».

  ⚠ **NO BAND AND NO MECHANIC WERE ADDED**, on the two measurements above: the plateau window can
  carry no trigger, and past 29 the shipped 0.55 is already the honest place. `ENDINGS`,
  `retirementDue`, `plateauReading` and every threshold in them are untouched.

  **THE DERIVATION – `lastWinterIn(world)` (`src/engine/world/coachMarket.ts`), on the wire as
  `Snapshot.lastWinterIn: number | null`.** How many off-seasons are left before the last one; 1
  means the NEXT winter is the one the offer arrives `final` on. It reuses round 39's own walk –
  `seasonsOfBodyLeft` took a `stop` PARAMETER (default `COACH_BODY_END_SHARE`, so every shipped
  caller is byte-identical) and this aims it at `ENDINGS.lastOfferPeakShare`. No second walker: two
  walkers would disagree.

  ⚠ It is EXACT rather than rounded, which is what lets the copy say «the next one». The walk gives
  the WEEK her share crosses the band; the question is raised on one week of the year
  (`resolveEndings` 7d), so the last ask is the first such week at or after the crossing and the
  count is a subtraction on the calendar. `Math.round(years)` would have claimed «next winter is the
  last» on a career whose crossing lands two off-seasons out. Two gates: nothing before
  `ENDINGS.askFromAgeYears` (before 29 the share is exactly 1, so a projection off it is a
  projection off a constant – the plateau measurement's own finding), and nothing above
  `LAST_WINTER_WARN_SEASONS = 2`. Silence on the last winter itself falls out of the arithmetic
  rather than a screen condition: there the count is 0.

  ⭐⭐ **MEASURED BEFORE THE COPY WAS WRITTEN (`tools/r40-last-winter.ts`, invariant 5).** Four
  synthetic careers walked week by week from their own `declineStart`, the share compounded exactly
  as `growWeek` compounds it, every surface asked what it would say on every week, and the walk
  stopped where the career stops:

  | career curve (`declineStart`) | coach's card | Home's plate | her card / the wrap | final ask |
  | --- | --- | --- | --- | --- |
  | as the seed drew it, 29.0 | 40.5 – 42.5, 104 wk | 40.9 – 42.2, 36 wk | 40.5 and 41.5 – **2 off-seasons** | 42.5 |
  | direct route, 27.0 | 38.5 – 40.5, 104 wk | 38.9 – 40.2, 36 wk | 38.5 and 39.5 – **2** | 40.5 |
  | late, 31.0 | 42.5 – 44.5, 104 wk | 42.9 – 44.2, 36 wk | 42.5 and 43.5 – **2** | 44.5 |
  | 29.0 with 40 wk lost to injury, pulled to 28.0 | 39.5 – 41.5, 104 wk | 39.9 – 41.2, 36 wk | 39.5 and 40.5 – **2** | 41.5 |

  So it opens exactly two off-seasons out on every curve, counts 2 → 1 → silent, and speaks for two
  winters and no more. Home's plate is the shortest of the four because it rotates on the season's
  third (round 39 #2b): on a career with a year-on-year fall the body clause holds the MIDDLE third,
  so the plate warns for ~18 weeks a season and the two rank arms keep the rest.

  **EVERY NEW STRING, VERBATIM. ALL OF IT IS DRAFT AND AWAITS THE OWNER'S WORD.**

  * **The coach, long, on his card in the coach list** (`coachDeclineNote`) – the near-final case
    REPLACES the shared body clause; all three of his arms keep their grammar and their rank halves:
    * `Past her peak – down 57 places on the year, and her last winter is 2 seasons away.`
    * `Past her peak – 105 places below her best season, and her last winter is 2 seasons away.`
    * `Past her peak – her last winter is the next one, and no coach buys that back.`
    ⚠ The clause it replaces is DEGENERATE exactly there: `seasonsOfBodyLeft` stops at 0.70 and the
    caller floors at 1, so «her body has about 1 more season in it» is what he says for the whole
    0.70-to-0.55 tail – three and a half years of an unchanging number.
  * **The coach, short, on Home** (`coachDeclineShort`, the `seasons` variant only):
    * `Past her peak – her last winter is next`
    * `Past her peak – her last winter is 2 seasons away`
    ⚠ The plate had to move with the card: it would otherwise keep saying «about 1 season left»
    while his card said «2 seasons away» – two numbers about her remaining time on two of his own
    surfaces, which is the contradiction he reported in #13a arriving from the other side.
  * **Her own voice, on the winter card** (`herLastWinterLine`, `src/composables/declineVoice.ts`) –
    the age branch of `RetirementDialog`, under round 38 #6d's `herSeasonWord`, no new panel:
    * `«One more winter after this one, and it will not be a question. I will tell you myself.»`
    * `«Two more winters after this one, and the last of them is not a question. I will tell you myself.»`
    ⭐ «I will tell you myself» is what the final card actually does – `LAST_WORD_OPENING`'s «Nobody
    asked her this time. She said it herself» – so the parent is told in advance the shape of the
    winter he will not be able to answer.
  * **The season's closing screen** (`seasonLastWinterLine`, rendered by `SeasonSummaryDialog`
    between her line and the parent's scrap), in the wrap-up's own reporting voice:
    * `One more winter after this one, and then nobody asks her again.`
    * `Two more winters after this one, and then nobody asks her again.`

  ⚠ Her voice SPELLS its count where the coach's sentence prints a digit – `Snapshot.coachDeclineNote`
  is documented as the one string on the wire that carries digits about her, and a woman saying «2
  more winters» out loud is a woman reading a dial. ⚠ INVARIANT 4: not one existing sentence was
  reworded. The round-30 lede, the round-31 rung, her season word, the coach's reply, the wrap's
  title and the parent's scrap are byte-identical, and each new line is an added paragraph.

  **EVIDENCE.** `tests/r40-last-winter.test.ts` (8 arms) and
  `tests/component/r40-last-winter-surfaces.test.ts` (11 arms), both mutation-verified – nine
  mutations, nine reds, all restored:

  | mutation | result |
  | --- | --- |
  | the band read as a literal `0.55` instead of `ENDINGS.lastOfferPeakShare` | RED – the one-derivation pin |
  | the window widened to 8 | RED (3 arms) |
  | the age-29 gate removed | RED |
  | the winter count off by one | RED (3 arms) |
  | her line taken off the winter card | RED (3 arms) |
  | the warning taken off the season screen | RED (4 arms) |
  | the coach kept the shipped clause inside the window | RED (2 arms) |
  | the phone-fit assertion given a 60px viewport | RED – it is live |
  | the new lines dropped from `ALL_DECLINE_LINES` | RED – the house-law sweep sees them |

  ⭐ The pin that matters is the first: mutate the walk's target and the coach's card, Home's plate,
  her line and the wrap all move together, to the same number, in both the engine test and the
  mounted one. Both dialogs that grew also carry `assertDismissReachable(... PHONE ...)` per
  CLAUDE.md's round-20 #3 rule.

  **TWO SHIPPED GUARDS WERE RE-AIMED, NEITHER DELETED.**
  * `tests/component/round31-decline-voice.test.ts` – the sweep's length pin becomes
    `10 + LAST_WINTER_LINES.length`, because `ALL_DECLINE_LINES` exists to be swept by the house law
    and the four new rendered warnings belong in it. The arithmetic pin on the owner's own nine
    sentences is untouched and still fails if one of them goes missing.
  * `tests/component/r38-decline-voice.test.ts` – «the borrowed-time tail reads 1» SPLIT IN TWO
    rather than moved. Its fixture sat a whisker above the band, i.e. squarely inside the new
    window; the floor claim keeps its own fixture further up the tail (share 0.65, asserted OUTSIDE
    the window so it cannot drift back in), and the old edge gets a new assertion that it now reads
    the count. That pin's own subject – the degenerate «about 1 more season» across three and a half
    years – is exactly what this item is for.

  ⚠ **RNG (invariant 2): ZERO draws on any stream** – a walk over persisted state plus two
  subtractions on the calendar. `tests/condition.test.ts` green, capture unchanged at **41550 /
  `e6b0c709`**. No save-schema move: the field is derived at snapshot time, `physicalShare`'s own
  precedent.

  ⚠ **What can still move the projection, stated rather than hidden:** `ageCurveOf` pulls her
  `declineStart` earlier by the weeks she loses to injury, so a bad layoff inside the window
  steepens the walk and can bring the last winter forward. Nothing in the engine returns physical
  share, so the projection can only ever be late – the honest direction for a warning.
