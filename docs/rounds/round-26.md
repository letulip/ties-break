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

- [x] **5. «Проверь пожалуйста что со всех выигрышей после своего счета в банке в 18 лет она
  получает свои отчисления и неплохо бы об этом где-то игроку сообщать, кстати»** – **5a measure**:
  verify the 18+ share fires on EVERY prize cheque in a real career. **5b build**: it is invisible –
  no surface tells him it happened.
  · **5a MEASURED, AND IT IS CLEAN.** `tools/kid-share-audit.ts` walks careers and rebuilds every
  cheque from OUTSIDE the till – the `tournament` summary row's own `finishIdx`, `prizeCentsFor`,
  `kidAgeYears`, `kidPrizeShareCents` – then compares with what `world.kidFundsCents` actually did.
  **5,593 paying cheques over 36 careers to week 620; 4,737 of them from her eighteenth; every one
  paid the exact ramp amount to the cent; 0 skipped; 0 rounding drift; 0 credits with no cheque
  behind them (one writer).** The per-age realised rate lands exactly on `ECONOMY.kidShare`:
  10 / 15 / 20 / 25 / 30 / 35 / 40 / 45 %. There is **only one payer** – `prizeCentsFor` has a
  single engine call site (`finalizeTournament`, world.ts:528) – so no path can pay a cheque that
  skips her. The freeze arm shows the four-year hole where it should be (ages 20-22: zero cheques)
  and full payment at her new rate on the far side. ⚠ The one boundary worth naming: the APPEARANCE
  FEE and the SPONSOR BONUS are not prize money and land whole in the family wallet – a recorded
  prior decision (`shared/protocol/offers.ts`: «a brand buys her face, not the family's», the split
  «until that ships»), not a defect. His own save cross-checks: `kidFundsCents` = $59,220.00 against
  `careerTotals.prizeCents` = $592,710.00, i.e. gross $651,930.00 and a realised 9.08% – consistent
  with a career that earned at 10-15% after eighteen and 0% before it, and impossible under any
  higher rate.
  · **5b BUILT.** The prize ledger row now names the money and not only the rate –
  «World Tour 500 prize money – Champion, less her 35% share ($1,750.00)» – so the transfer is
  legible AT THE MOMENT, on the surface where money speaks; and the Money screen carries a share
  strip above its tabs (her balance and the ramp, engine-composed via `kidLife.ownAccountNote`, plus
  the sentence nothing had ever said: the cheque is split **before it reaches this account**).
  Mounted in `tests/component/round26-money-share.test.ts`, walked in `tests/round26-world-speaks.test.ts`.

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

- [x] **10. «В новостях во время колледжа вообще пустота, как будто мир умер, мы вроде делали, чтобы
  он жил, при том, что даже в highlights на результатах есть какие-то события»** – the world runs
  during the freeze (rivals age, retire, win) and the feed says nothing. **build**.
  · **THE INVENTORY FIRST, AND IT SAYS «WRITTEN, NOT FILTERED, AND NOT ABOUT ANYTHING».**
  `tools/college-news-probe.ts`, 5 careers × 4 years = 1,040 freeze weeks: the freeze **writes 3,616
  rows (3.48/week)**, of which **799 reach the news list (0.77/week, on 49% of freeze weeks)**, and
  the Home card at the eight rest states holds **15 rows over 9 week groups, 10 of them about the
  field – and not one of the 40 rest states was empty.** Nothing is being filtered out. What the
  feed said was «🏆 a stranger won the World Tour 500» **29 times a season** with nothing in it that
  could ever change. Two structural facts came out of the same probe and shaped the fix: the freeze
  runs at the **ordinary-row FLOOR** (`rest` pinned at exactly `EVENTS_ORDINARY_FLOOR` = 120 at all
  40 rest states, because her 241-257 protected match rows plus 23-40 kept milestones fill the rest
  of `EVENTS_CAP` = 400), so the world's memory is only ~24-30 weeks deep; and the snapshot's last-60
  window is ~11-14 weeks on top of that. **A once-a-season row is therefore invisible to a college
  player by arithmetic**, not by luck.
  · **WHAT NOW SPEAKS.** (1) Every champion line carries the champion's AGE and, where it applies, a
  «a first season on tour» / «in a last season on tour» clause – **zero new rows**, riding the ~10
  lines already in every window he opens. (2) `world/fieldNews.ts`: on the season's last week, up to
  3 named farewells («👋 R. Delaney (#4) has played a last match on tour – retiring at 28 after 10
  seasons.») plus one turnover line («The tour turns over: 138 professionals retire at the end of
  this season, 5 of them from the top 100.»); on the boundary, one intake line naming the
  highest-placed newcomer. All read off `careerAt`, the succession the field has walked since
  W4-LIVES and never mentioned.
  · **THE ROW BUDGET, CHOSEN AND MEASURED.** 5 rows a season by construction (3 + 1 + 1), matching
  the plan's «+~5 lines fits» arithmetic; **20 over a four-year freeze**. Measured over the freeze:
  news rows 799 → 857 (+7.3%), and the events array at graduation is **401 rows with 39 kept in BOTH
  arms** – her history is untouched, because every new row is ordinary and the ordinary class is
  already at its floor. Generational lines visible on the card at a rest state: **0/40 before, 1.8
  mean after, 33 of 40 rest states carrying at least one.** No points, no prize money, no result
  rows – `amountCents` is undefined on all of them.

- [ ] **11. «На 4й год увидел только одну запись Quarterfinal lost watch на домашнем экране в
  разделе Year 4 of 4 – это настолько неявно и не очевидно.»** – same root as #6/#7: the year's
  competition is a line, not an event. **build**.

- [ ] **12. «И почему-то на Year 4 of 4 меня всё ещё две кнопки внизу интерфейса Another year и Back
  on tour, хотя вроде бы колледж всё»** – the last year must offer graduation, not another year.
  **build**.

- [ ] **13. «Мне кажется мы что-то напутали с годами колледжа, проверь пожалуйста»** – his
  suspicion, and #11/#12 are its symptoms. **measure first**: read the save's own college state and
  say what the years actually are before changing anything.
