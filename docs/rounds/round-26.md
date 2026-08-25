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

- [x] **4. «Очень странное пожелание на день рождения She was looking fares home at two in the
  morning для студентки с кошельком 500к+ с предложением подарить велосипед.»** – the wish pool
  assumes a poor family. Her wallet is $500k+. **build**: wishes must read the family's means (and
  her college residence), or the pool must be gated.

  **R26-C, `round26/birthdays`.** Two findings, and they are different.

  **THE WISH WAS THE DEFECT.** A row now DECLARES what its words rest on (`BirthdayGift.means` =
  `hardship | plenty`) and `src/engine/world/means.ts` answers whether that is true of this family –
  a named predicate, the shape R2-18 gave the life stage, **licensed by fact and not by a word
  list**. Three of the 33 rows make a money claim: `flighthome` and `books` (hardship),
  `neverbuy` (plenty); each carries the sentences for when it does not hold.

  **THE THRESHOLD, AND WHERE IT IS READ FROM.** `tight` ≤ **$8,000** =
  `ECONOMY.startingFundsCents.working`; `moneyed` ≥ **$120,000** = `.wealthy`. Neither is chosen –
  the three opening war chests are the only BALANCES the design ever named, everything else in
  `ECONOMY` is a weekly flow or a per-bill factor, and the economy was tuned against them.
  `STARTING_FUNDS_CENTS` moved from `world.ts` into `economy.ts` so a leaf could read it (world.ts
  keeps the historical export, twelve readers untouched). The FARE is the sanity check and not the
  source: at the tight ceiling the dearest domestic fare (`TIERS.national.travelCostCents` = $900)
  is 11.3% of the wallet, at the moneyed floor 0.75%, on his save 0.14%. The wallet is both purses,
  `fundsCents + kidFundsCents`.

  **PROVEN RENDERED**, walked to the real fork, his own numbers, Year 2 of 4, age 20, wallet
  $643,595 (`tests/college-birthday.test.ts`):
  * ASK: *"The journey home is four hundred miles and she has never once asked us to book it."*
  * the same walk at $1,200: *"She has been looking up fares home at two in the morning and booking
    none."* – so the arm is live and the absence above is a licence, not a dead string.

  **AND THE BICYCLE WAS NOT A DEFECT.** The row he read is `campusbike` – "A bicycle for getting
  about there", fifteen minutes between buildings – the COLLEGE band's own row, correct for a girl
  of twenty in a hall of residence. R2-18's band IS being picked: verified on a walked career, the
  child's `bicycle` is unreachable at her residence at any age. ⚠ Measured beside it: **0 of 48**
  walked college birthdays are in the `tight` band (median wallet $133,514), which is exactly why
  the fares line read as absurd – it was printing where it can essentially never be true.

  Spec: `docs/specs/birthday-and-gifts.md` §9. No schema move.

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

- [x] **9. «Just a day together на день рождения случается подозрительно часто. Сколько у нас
  вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не так
  часто?»** – **9a answer**: the pool's real size. **9b build**: repetition control.

  **R26-C, `round26/birthdays`. 9a – THE ANSWER, MEASURED** (`tools/birthday-pool.ts`, 12 walked
  careers = 201 tour birthdays + 48 college birthdays):

  * **29 distinct gifts** in the catalogue before the fix (28 material + the day), across 9 bands.
  * **The day was never the problem.** It is on 100% of dialogs by his own 11.08 ruling – four rows,
    one of them always the day. It is ASKED for on 30% of birthdays, a little over the 25% its share
    implies, because the ask skips presents she already owns and the day is never spent.
  * **The whole dialog was the problem.** 53% of consecutive birthdays (100/189) printed the
    IDENTICAL four rows, and the worst career ran **eight in a row**. At college, 22% (8/36).
  * **The cause is arithmetic, not luck.** Four bands held exactly three material gifts and a dialog
    shows three: C(3,3) = 1, so there was literally one dialog to draw. The peak band (22-28) alone
    is seven consecutive birthdays of it.

  **9b – WHAT WAS BUILT: both, and the shape follows round 24's own ruling** rather than inventing
  one. `docs/decisions.md`, 19.08, on the college birthday lines: «one line per year and not a
  random pick, deliberately – four college birthdays is the whole of the population, so a pool would
  repeat within a single career.»

  1. **A wider pool** – two rows each to the 19-21 band (`languages`, `storage`) and the peak band
     (`dog`, `oldclub`, which the late band inherits): **33 distinct gifts**. The rule the guard
     holds is per birthday and not ">1": a band must print at least as many dialogs as it holds
     birthdays, bounded for the open-ended late band by `ENDINGS.stopAskingAgeYears`. One-year bands
     (17, 18) cannot repeat inside themselves and are left alone.
  2. **A walk, not a draw** – every combination of a band is enumerated, shuffled ONCE per career per
     band on `seed:birthday:cycle:<band>`, and indexed by her age. Consecutive birthdays take
     consecutive entries.

  **MEASURED AFTER**, same tool, same 12 careers: back-to-back identical **53% → 0%** (0/189), worst
  run **8 → 1**; college **22% → 0%** (0/36), worst run **3 → 1**, and her four college birthdays are
  now four DIFFERENT dialogs – the whole population of that band, exactly as round 24 asked.

  ⚠ **RNG.** Two purpose-scoped sub-streams, neither of them MAIN: `…:cycle:<band>` drawn C(n,3)−1
  times once per career, `…:birthday:<age>` drawn exactly four times for every band (three to order
  the rows, one for the ask). `tests/condition.test.ts` green, **41550 / `e6b0c709`**, unchanged. No
  persisted state, so **no schema move**. Spec: `docs/specs/birthday-and-gifts.md` §10.

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
