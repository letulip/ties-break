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

- [>] **2. «когда есть 2 группы кнопок, пока верхние не нажаты нижние ничего не делают, может быть
  сделать, чтобы человек сначала делал верхний выбор, а потом на этом же экране появлялись следующие
  кнопки, чтобы флоу был более явным?»** – **build.** Progressive disclosure on the same screen: the
  second group is not rendered until the first choice exists, so a control is never on screen while
  it cannot work. The first group stays visible and re-choosable after the second appears – a
  disclosed step must not become a trap.

---

## Carried in from round 39, still open

- [ ] **r39 #14a/#14b – the retirement voice and «she is done» as a state.** The four ledes are
  drafted and the mechanism is approved; the TRIGGER is being measured now
  (`tools/r40-retire-trigger.ts`), because the owner named why it cannot be guessed: «она буквально
  на пике карьеры начинает говорить, что "всё"». ⚠ Structural finding while reading the code: the
  plateau branch of `retirementDue` CANNOT fire past `askFromAgeYears` (29) – the age branch returns
  first – so the card lives in 24-28 by construction, which is exactly her peak. His objection is
  the shape of the mechanism, not its tuning.
