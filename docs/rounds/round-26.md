---
type: round-ledger
status: current
area: rounds/26
canonical: false
last-reviewed: 2026-08-24
---

# Round 26 – four years of college, played through (24.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**Captured before triage and before a line of code was read**, in his numbering and his words. His
line is quoted first, in the language he wrote it; the reading underneath is mine and is the part
that may be wrong.

## The save and the screenshot

`tennis-sim_alice-cfbv_w502.tsave` – Alice, 20, W35 2037, Year 2 of 4 on the scholarship, wallet
$500k+. ⚠ **READ-ONLY, NEVER COMMITTED, NEVER A FIXTURE.** The screenshot is the Home shell showing
the two college answers as dark-blue-on-dark-blue (item 8) and the stop notice above the fold.

⚠ **THREE ITEMS ARE REOPENED, and they are marked `[!]` rather than renumbered**: #2 (he has asked
before), #6 (he has asked before – «Я уже просил это сделать»), and #11/#12/#13 are the same college
clock he suspects from three directions.

---

## The checklist

- [!] **1. «Что за кнопка Next 4 weeks у меня появилась прямо под пальцем на домашнем экране?»** –
  the R2-13 pill, shipped hours ago and never announced to him. Not a defect: a feature that
  arrived without a sentence. He is asking WHAT it is, and the honest answer is that it should have
  introduced itself. **answer + possibly build** (a first-use line).

- [!] **2. «Ещё раз: почему university at home недоступен для Alice, я уже спрашивал, не понимаю и
  не починено»** – REOPENED. The in-state rung refuses and the card states «The in-state price is
  only for residents of the state, and she is not one» (C2, round 24). Either the residence rule is
  wrong for her, or the sentence does not explain WHY she is not a resident. **build**: the reason
  must name the fact it rests on, or the rule must change.

- [ ] **3. «Что значит Top 100 for 74 in 100 в строке университета? И почему у private этот
  показатель меньше, чем у state?»** – two asks in one line. **3a**: the string is unreadable –
  what quantity is it? **3b**: private scoring WORSE than state is either a real inversion or a
  mis-read label. **answer + build**.

- [ ] **4. «Очень странное пожелание на день рождения She was looking fares home at two in the
  morning для студентки с кошельком 500к+ с предложением подарить велосипед.»** – the wish pool
  assumes a poor family. Her wallet is $500k+. **build**: wishes must read the family's means (and
  her college residence), or the pool must be gated.

- [ ] **5. «Проверь пожалуйста что со всех выигрышей после своего счета в банке в 18 лет она
  получает свои отчисления и неплохо бы об этом где-то игроку сообщать, кстати»** – **5a measure**:
  verify the 18+ share fires on EVERY prize cheque in a real career. **5b build**: it is invisible –
  no surface tells him it happened.

- [!] **6. «За первый год в колледже турнир был, но опять сообщили только постфактум, в чем проблема
  использовать наш флоу турниров полностью и дать возможность игроку их смотреть и сопереживать? Я
  уже просил это сделать»** – REOPENED and it is the round's biggest item. The College League plays
  real matches (G1, round 25) but reports them as a summary. **build**: the tournament flow, not a
  report.

- [ ] **7. «Реплеев этих матчей из п.6 нигде нет, ни в news feed, ни в календаре»** – #6's other
  half: even the retrospective route is missing. **build**.

- [ ] **8. «Another year и Back on tour поменять местами и сделать цветом, сейчас их вообще не
  видно тёмно синие на тёмно синем»** – contrast and order, visible in the screenshot. **build**,
  and the evidence is a measured contrast ratio, not a screenshot.

- [ ] **9. «Just a day together на день рождения случается подозрительно часто. Сколько у нас
  вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не так
  часто?»** – **9a answer**: the pool's real size. **9b build**: repetition control.

- [ ] **10. «В новостях во время колледжа вообще пустота, как будто мир умер, мы вроде делали, чтобы
  он жил, при том, что даже в highlights на результатах есть какие-то события»** – the world runs
  during the freeze (rivals age, retire, win) and the feed says nothing. **build**.

- [ ] **11. «На 4й год увидел только одну запись Quarterfinal lost watch на домашнем экране в
  разделе Year 4 of 4 – это настолько неявно и не очевидно.»** – same root as #6/#7: the year's
  competition is a line, not an event. **build**.

- [ ] **12. «И почему-то на Year 4 of 4 меня всё ещё две кнопки внизу интерфейса Another year и Back
  on tour, хотя вроде бы колледж всё»** – the last year must offer graduation, not another year.
  **build**.

- [ ] **13. «Мне кажется мы что-то напутали с годами колледжа, проверь пожалуйста»** – his
  suspicion, and #11/#12 are its symptoms. **measure first**: read the save's own college state and
  say what the years actually are before changing anything.
