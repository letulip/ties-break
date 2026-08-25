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

- [x] **8. «Another year и Back on tour поменять местами и сделать цветом, сейчас их вообще не
  видно тёмно синие на тёмно синем»** – contrast and order, visible in the screenshot. **build**,
  and the evidence is a measured contrast ratio, not a screenshot.
  → **SHIPPED (R26-A).** Order swapped – «Back on tour now» is first now, the year answer second.
  THE EVIDENCE IS THREE RATIOS, computed from the real cascade on a mounted 375x667 Home
  (`tests/component/round26-college-card.test.ts`), not from a hex in the stylesheet:

  | what | before | after | rule |
  |---|---|---|---|
  | the LABEL on its own fill | 16.60:1 | 16.60:1 | AA 4.5:1 – never the problem, and the reason nothing caught this |
  | the BUTTON'S EDGE on the page | **1.29:1** | **3.70:1** | WCAG 1.4.11 non-text, 3:1 |
  | the BUTTON'S FILL on the page | 1.07:1 | 1.07:1 | unchanged, and deliberately so |

  ⚠ **THE FILL CANNOT BE THE FIX AND THE ARITHMETIC SAYS SO.** Against `--bg` (#0a0e13, luminance
  0.0041) a surface needs luminance 0.112 to reach 3:1 – a mid-grey near #6a737c. Every dark neutral
  the app owns is an order of magnitude under it (`--panel` 1.07:1, `--card-top` the lightest at
  1.21:1). On a near-black page a control is made visible by its BOUNDARY, which is exactly what
  1.4.11 measures, so the hairline moved from `--line` to `--accent-soft` – the app's own token for
  this, already bordering BirthdayDialog's choices. ⚠ Round 24's equal-weight ruling is kept and
  re-asserted: both answers take the same edge, the same fill and the same single class; neither is
  the lime CTA. Equal weight is not the same claim as invisible.

- [ ] **9. «Just a day together на день рождения случается подозрительно часто. Сколько у нас
  вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не так
  часто?»** – **9a answer**: the pool's real size. **9b build**: repetition control.

- [ ] **10. «В новостях во время колледжа вообще пустота, как будто мир умер, мы вроде делали, чтобы
  он жил, при том, что даже в highlights на результатах есть какие-то события»** – the world runs
  during the freeze (rivals age, retire, win) and the feed says nothing. **build**.

- [x] **11. «На 4й год увидел только одну запись Quarterfinal lost watch на домашнем экране в
  разделе Year 4 of 4 – это настолько неявно и не очевидно.»** – same root as #6/#7: the year's
  competition is a line, not an event. **build**.
  → **THE CARD'S HALF SHIPPED (R26-A); the live-flow half is #6/#7's and rides with them.** Two
  things were wrong with that one grey row and neither was the row. (a) NOTHING SAID WHICH YEAR IT
  BELONGED TO – the heading named the year ahead, so a result from year three sat under «Year 4 of
  4». The report block is headed now, off the banked row's own `index`: «Year 3, as it happened».
  (b) THE YEAR'S RESULT WAS PROSE AMONG PROSE – 13.5px of `--ink-soft` in a stack of five such
  lines. It is a FACT now, in the same grid as the money and the rank: `COLLEGE LEAGUE` /
  «Quarterfinal» (or «Final», «Semifinal», «Won it»), stated in the draw sheet's own words with no
  adjective near it (ruling 4). It takes the full grid row because a word-valued fact does not fit a
  90px column on a 375px phone. ⚠ Nothing in the `.college-league` block or its match rows was
  touched – that surface is R26-B's this wave.

- [x] **12. «И почему-то на Year 4 of 4 меня всё ещё две кнопки внизу интерфейса Another year и Back
  on tour, хотя вроде бы колледж всё»** – the last year must offer graduation, not another year.
  **build**.
  → **SHIPPED (R26-A), AND THE BUTTON WAS RIGHT WHILE THE WORD WAS WRONG.** At that rest state three
  years were banked and the press spends the FOURTH – the last one – so there was no fifth year on
  offer and no gate to add. What «Another year» did was name the last year as one more of an
  open-ended series, under a heading that had already said the scholarship was over. It reads «Play
  the final year» now, and «Another year» is gone from that screen. ⚠ THE ENGINE'S REFUSAL, CHECKED
  AS ASKED: `resumeFromCollege` answers a fifth year with a THROW – «She is not at college» (walked,
  not read) – and so does `endCollegeEarly`. The player never reached it, because the latch is off
  by then and the bar is not drawn; the bar now also stands down when no year is left, as a TRIPWIRE
  for the next wave rather than as a gate on a live path. There is no «graduate» command to offer:
  graduation is what spending the fourth year DOES (`finishCollege` inside `resumeFromCollege`), and
  `CollegeDoneDialog` is the screen that reports it.

- [x] **13. «Мне кажется мы что-то напутали с годами колледжа, проверь пожалуйста»** – his
  suspicion, and #11/#12 are its symptoms. **measure first**: read the save's own college state and
  say what the years actually are before changing anything.
  → **MEASURED FIRST, AND THE ENGINE'S CLOCK IS EXACT (R26-A).** His save: `college.fromWeek 294`,
  `untilWeek 502`, `doneWeek 502`, **four years banked** – **208 weeks, exactly 4.00 years**. A
  career walked from the fork to graduation reproduces it from a different enrolment week
  (86 -> 294, the same 208, four banked years, four rest states) and then refuses a fifth. NOT ONE
  ENGINE LINE CHANGED, and none should: the clock was never wrong.
  → **THE DEFECT WAS THE CARD, AT `CollegeYearCard.vue:66`**, and it was wrong in two ways at once.
  (1) `Year ${Math.min(yearsDone + 1, totalYears)} of ${totalYears}` NAMED THE YEAR AHEAD while
  everything under it – facts, championship, call-up – reported the year BEHIND. That single string
  is #12 and #11 in one place: it told him college was over and then showed him the older year's one
  match row as its whole tennis. (2) The clamp made three-banked and four-banked print the same four
  words – **and it was DEAD as well as ambiguous**: `collegeProgressOf` returns null the moment
  `doneWeek` is set and `resumeFromCollege` graduates her in the same call that banks the fourth
  year, so this card is never on screen with four years behind her. So the answer to «does the card
  say something else at `yearsDone === totalYears`, or does it stop rendering» is that **it already
  stops rendering and hands to the graduation dialog** – the latch does not outlive the last year,
  and the card was never in a window it should not be. What shipped is one sentence per state, no
  clamp: «Year 1 of 4 is next – none spent», «Year 4 of 4 is next – 3 spent», «Year 4 of 4 under way
  – 3 spent» (the round-24 birthday pause), «All 4 years spent» for the unreachable state, kept so
  that no two states can ever share a sentence again.
