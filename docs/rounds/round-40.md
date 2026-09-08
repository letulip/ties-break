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
