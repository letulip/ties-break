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

---

## Carried in from round 39, still open

- [ ] **r39 #14a/#14b – the retirement voice and «she is done» as a state.** The four ledes are
  drafted and the mechanism is approved; the TRIGGER is being measured now
  (`tools/r40-retire-trigger.ts`), because the owner named why it cannot be guessed: «она буквально
  на пике карьеры начинает говорить, что "всё"». ⚠ Structural finding while reading the code: the
  plateau branch of `retirementDue` CANNOT fire past `askFromAgeYears` (29) – the age branch returns
  first – so the card lives in 24-28 by construction, which is exactly her peak. His objection is
  the shape of the mechanism, not its tuning.
