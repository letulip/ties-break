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

- [x] **2. «Ещё раз: почему university at home недоступен для Alice, я уже спрашивал, не понимаю и
  не починено»** – REOPENED. The in-state rung refuses and the card states «The in-state price is
  only for residents of the state, and she is not one» (C2, round 24). Either the residence rule is
  wrong for her, or the sentence does not explain WHY she is not a resident. **build**: the reason
  must name the fact it rests on, or the rule must change.

  **R26-D, 25.08 – DIAGNOSED FIRST, AND THE SAVE IS THE EVIDENCE.** Read read-only from
  `tennis-sim_alice-cfbv_w502.tsave` (schema v59, never copied, never a fixture):
  `profile = {kidName: Alice, kidLastName: Martin, country: **AU**, background: middle}`; her fork
  was asked on w258 and her own persisted quote for `state` carries `open: false` while `national`
  and `private` carry `open: true` (she took `private`).

  1. **THE FACT, AND IT IS TRUE OF HER.** The refusal rests on one rule and one field:
     `COLLEGE_SHUT_RULES['not-a-resident']` fires when `country !== 'US'`.
     `tierShutFor('state', 'AU')` returns `not-a-resident`; `quoteShutFor({tier: 'state',
     open: false})` returns the same code off her persisted quote. **She is Australian, so the rung
     is correctly shut and the rule is not wrong for her** – in-state tuition IS state residence and
     a non-resident alien is never in-state (sourced in `collegeOffer.ts`, and two places stay open,
     so nothing removes the college answer). The defect was never the verdict.
  2. **⚠ CAN A PLAYER CHANGE IT? NO – AND THAT IS THE PART THAT IS A DESIGN QUESTION, NOT A COPY
     FIX.** `profile.country` is written in exactly one place in the codebase,
     `OnboardingWizard.vue:275` (`pickCountry`), on the third onboarding screen – *Where Are You
     Starting?* There is **no other write anywhere**: no engine command, no dev tool, no migration
     touches it (audited across `src/`; the only other occurrences are `DEFAULT_PROFILE.country =
     'US'` and the legacy-save backfill in `db/saves.ts`). So residence is fixed **before week 0 and
     for the whole career**, and this card draws on w258 – **444 weeks later**.
     **The rung is reachable, but only by a different career**: of the 24 playable countries in
     `COUNTRY_NAMES`, **exactly one (US) opens it**. A US career draws three live places (asserted).
     ⚠ **OWNER QUESTION, NOT ACTIONED HERE:** 23 of 24 starting countries can never see the cheapest
     place, the choice that decides it is made five real seasons earlier, and **nothing on the
     onboarding country step says that picking a country prices college.** That is either intended
     (residence is a real constraint and the game models it) or it wants a line at onboarding. Not
     changed without a ruling – changing the rule would delete a sourced fact.
  3. **SHIPPED – THE SENTENCE NAMES THE FACT.** `COLLEGE_SHUT_DETAIL` is still a total `Record` over
     the reason codes and the words are still 100% the engine's, but the values are FUNCTIONS of the
     family's home now, so the card passes the one noun it cannot invent. Rendered on a mounted
     dialog against a real `AU` world (`tests/component/round26-fork-card.test.ts`):
     *«The in-state price is only for residents of a US state, and this family is from Australia –
     chosen at the start of the career.»* `open` is still DERIVED from `quoteShutFor`; reading her
     country to NAME the refusal is not a second judgement and never reaches that call.
     ⚠ Guard re-aims, all mutation-proved: reverting to the round-24 line turns **1 unit + 6
     component** cases red; hard-coding the country turns **3** red.

- [x] **3. «Что значит Top 100 for 74 in 100 в строке университета? И почему у private этот
  показатель меньше, чем у state?»** – two asks in one line. **3a**: the string is unreadable –
  what quantity is it? **3b**: private scoring WORSE than state is either a real inversion or a
  mis-read label. **answer + build**.

  **R26-D, 25.08 – 3a SHIPPED, 3b ANSWERED AND DELIBERATELY NOT RETUNED.**

  **3a. WHAT THE NUMBER IS.** `COLLEGE_TIER_ODDS[tier].top100In100` is **a count of careers in a
  hundred**: of a hundred girls who took that place, how many touched the **world top 100 at any
  week of the four years back on tour after graduating**. Measured, not designed –
  `tools/college-return-probe.ts --seeds 6` at commit `3b6d92e`, **n = 53** careers walked to the
  fork under `POLICIES[1]` and then re-walked once per place
  (`docs/specs/the-college-answers-2026-08.md` §2a / §10h). The frame was the whole problem: `Top
  100 for 74 in 100` reads as a LABEL followed by two numbers with no verb between them, so the
  quantity is unrecoverable – 74 what, out of which hundred, measured when.
  **The figure is unchanged and the line now says it in words.** Rendered:
  `85 in 100 reach the world top 100 · A full ride (100%)`. The window stays named once under the
  list («Four years after she leaves, over 53 careers.») – it is capped at ~49 characters because a
  two-line caption is what put the dismiss control at y=-25 in round 21.

  **3b. HE IS READING IT CORRECTLY, AND IT IS NOT A LABEL FAULT.** The table as it really is:
  **state 85 · national 93 · private 74** – the dear place is **19 points behind the middle one and
  11 behind the cheap one**. Checked on the RENDERED rows by NAME, not by tier id (a mis-map would
  put another place's figure on the row): *The university at home* carries 85, *A university out of
  state* 93, *A private university* 74, and the $65,470 sticker is on that same row. **Not
  mislabelled and not mis-mapped.**
  **It is deliberate, measured, and recorded** – `the-college-answers-2026-08.md` §10i: the dear
  place develops her the MOST (+1.37 against +1.21) and still finishes last, because **eleven of 53
  careers there never finish at all** (the family goes bankrupt paying) and the survivors come out
  with **$64,903** against the middle place's **$116,844** to fund a comeback with. Among the
  careers the bill did NOT end the row is **85 / 94 / 82** – so the deficit is money, not a weaker
  programme. **Nothing here retunes the table** (`COLLEGE_ODDS_MEASURED_AT` is untouched and its
  staleness pin is still green).
  ⚠ **TWO THINGS FOR THE OWNER.** (a) The template comment beside this line still said «the three
  are nearly the same» – it described **38 / 40 / 34**, a table re-measured away in the same round
  it was written; corrected in place. (b) The spec itself says **a re-measure is owed** the moment
  the skill wave (`a412162`, `season/fieldPros.ts`) settles – these figures jumped from 38 / 40 / 34
  to 85 / 93 / 74 on another wave's change, and `COLLEGE_ODDS_MEASURED_AT` **cannot** notice that
  because it folds only the college tier table. Re-running the probe is a five-minute job that
  nobody is currently on the hook for.

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
