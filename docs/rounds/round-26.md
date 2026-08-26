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

- [x] **6. «За первый год в колледже турнир был, но опять сообщили только постфактум, в чем проблема
  использовать наш флоу турниров полностью и дать возможность игроку их смотреть и сопереживать? Я
  уже просил это сделать»** – REOPENED and it is the round's biggest item. The College League plays
  real matches (G1, round 25) but reports them as a summary. **build**: the tournament flow, not a
  report.
  **R26-B, shipped.** THE INVENTORY FROM HIS SAVE FIRST (w502, v59, read-only): round 25's tennis
  was all real – four banked years, leagues 1 / 3 / 0 / 1, eight `college-w<week>-r<n>` rows in
  `world.events`, every one `friendly: true`, `keep: true`, carrying a `WorldMatch` and its seed.
  What failed is that the year never STOPPED: `resumeFromCollege` added `'college-league'` to the
  stop set and kept ticking, so the fixture happened on week 12 of the academic year and the screen
  came back at week 52. Fixed by giving the week the tour's own road: `resolveCollegeLeague` opens
  `college.leagueReveal` (v60), the year PAUSES on it in the same block her birthday already pauses
  in, `pendingView` projects it onto `snapshot.pending`, and `TournamentFlow` mounts over the live
  Home shell – reached by the same `tournamentReveal` / `tournamentSkip` / `tournamentClose`
  commands a tour reveal uses (three dispatch lines in `world.ts`; the worker, the store and every
  button are untouched). ⚠ B1's law is EXTENDED, not weakened: `world.pendingTournament` is still
  never written inside the freeze (pinned over a walked four-year career), so round 24's throw still
  guards a state that cannot occur; the new state RETURNS `['college-league']` at the entry guard
  because – unlike that one – it has a surface. The amateur line holds: `tier` is `null` on the
  view, `points` 0, no cheque, no cabinet entry, no trophy flight. Proof is mounted, not grepped:
  `tests/component/round26-college-flow.test.ts` walks a real career to the fixture and asserts the
  takeover is in the DOM, the college bar has stood down and the global resume press is up.
  Six mutation arms, all red.

- [x] **7. «Реплеев этих матчей из п.6 нигде нет, ни в news feed, ни в календаре»** – #6's other
  half: even the retrospective route is missing. **build**.
  **R26-B, shipped (feed) + answered (calendar).** THE FEED: the route was always there – Home's
  news feed opens any row carrying a `match` in `MatchReplay` – and the rows had fallen out of the
  WINDOW. `snapshot.events` was a positional `slice(-60)` over his 401-row ledger: at week 480,
  inside the freeze, sixty rows still reached back to week 273 and all eight matches were openable;
  the week she graduated and the tour started writing again the window collapsed to weeks 493-502
  and held 20 income + 30 expense + 9 info + 1 milestone rows – **zero matches**, ten visible feed
  rows, exactly what he saw. The snapshot now pins every `keep: true` row that carries a match into
  the window, in ledger order, no duplicates – the engine's own promise («a week she is still
  allowed to watch has to still be in the feed to open») honoured one layer further out. Measured
  on his save: 8 of 8 championship matches and 3 of 3 Nations Cup rubbers reachable, feed 60 -> 71
  rows. Bounded by construction: only the amateur competitions mark a match row `keep`, so a
  tour-only career is byte-identical (pinned). THE CALENDAR: **nothing was built there, and the
  finding is why.** `CalendarScreen` and `SeasonScreen` are strictly FUTURE – `SeasonScreen`'s
  replay button covers the CURRENT week only, and no past tour match is reachable from either
  screen either. The league is not treated worse than the tour; the app has one retrospective route
  and the league now keeps it. A past-results list is a feature, not a fix, and belongs to a round
  that scopes it.

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

---

## Second pass – his corrections after reading the first report (24.08)

⚠ Four items come back. They are marked `[!]` on their ORIGINAL numbers, not renumbered: a repeat is
a repeat, and the record has to show the first fix missing.

- [x] **1 (again). «давай сделаем ее во-первых слева от основной, а во-вторых по условию, появляться
  она должна на тех моментах, где либо в календаре нет ни одного события в ближайшие 5 недель, либо
  у нее травма на 5+ недель или до конца травмы осталось не меньше 5 недель. Иначе это совершенно
  дурной элемент управления получается, с которым пропускается всё, а еще и прямо под пальцем.»** –
  the first pass shipped the pill wherever the engine could move time, which is almost always. His
  rule is the opposite: it appears only when there is genuinely nothing to do. **build**: left of
  the week button, and gated on an empty five-week calendar OR a layoff of five-plus weeks (total or
  remaining).

  **R26-F, 25.08 – SHIPPED, AND HIS OBJECTION WAS A NUMBER BEFORE IT WAS A FEELING.** Walked career,
  208 weeks, `r26-gate`: the FIRST pass's gate ("the engine can move time") was true on **204 of 208
  weeks – 98.1 %**, which is «с которым пропускается всё» exactly. His rule is true on **5 of 208 –
  2.4 %**.
  1. **POSITION.** The pill is the FIRST child of `.next-week-bar` now, so in a plain
     `flex-direction: row` it is left of the CTA and the keyboard reaches them in the order the eye
     does. No CSS `order` – a visual order that contradicts the DOM is the one arrangement a screen
     reader and a sighted player disagree about, and the mounted test asserts BOTH (index, and that
     neither button carries an `order`). **The bar has four states and only one of them has two
     controls**: quiet week on Home = pill + CTA (`with-span`, the CTA drops its 206px floor); busy
     week on Home = CTA alone at full width; a paused reveal on ANY tab = the resume arm alone (the
     pill can never join it – `multiOffered` returns false on `snap.pending` before it reaches the
     owner's rule, asserted); college latch on Home = no bar at all, unchanged.
  2. **⚠⚠ THE FIRST ARM AS HE WORDED IT WOULD HAVE KILLED THE FEATURE, AND THAT IS MEASURED, NOT
     ARGUED.** «нет ни одного события» read as *any dated row in `world.season`* fires on **0 of 900
     weeks** (three careers × 300): the generated tour always has something at some rung within five
     weeks. Read as *nothing on HER calendar* – `eventIsHers`, which is the look-ahead marker's own
     predicate, moved to the engine and re-exported into `composables/weekDays.ts` under its
     historical name `isSuitable` – it fires on 6 / 5 / 7 of 300. That reading is the calendar's own
     doctrine, already written down beside those markers: «empty means empty FOR HER». A third
     reading (`+ feedShows`, the Season feed's rung window) agreed on all 900 weeks and is not
     carried.
  3. **ONE QUESTION, ONE FUNCTION.** `spanWorthOffering(week, upcoming, injury)` lives in
     `engine/world/multiWeek.ts` and takes primitives, so the shell hands it `snapshot.upcoming` /
     `snapshot.injury` and a test hands it `toSnapshot(world)`'s – one producer, `upcomingEvents`,
     for both. The layoff's «осталось не меньше 5» is asked through R10-17's own window
     (`layoffCoversWeek(week, remaining, week + 4)`), not a fifth spelling of it. `isSuitable ===
     eventIsHers` is asserted as an object identity, so the markers and the pill cannot part.
  4. **THE REFUSALS AND THE STOPS ARE UNTOUCHED, AND THAT IS DRIVEN RATHER THAN CLAIMED.** This is
     an OFFER rule and never a refusal: on a week the pill is withheld the span still runs and still
     halts on the letter (`['offer']`, block D of `tests/r2-13-advance-span.test.ts`, on that file's
     own fixture). `ADVANCE_REFUSALS` is the same six in the same order, `'offer'` is still a halt
     and not a refusal, and the college pauses keep their slots.
  5. **⚠ ONE HONEST CAVEAT ON HIS SECOND ARM.** «травма на 5+ недель» (total) and «осталось не
     меньше 5» (remaining) are both implemented because he named both – but `weeksRemaining` starts
     at `totalWeeks` and only ever decrements, so the second term is **subsumed** and no career this
     engine can produce is caught by it alone. It is kept for the day a layoff can be extended, and
     pinned with the one state that separates them. The consequence of taking `total` literally: a
     six-week layoff still offers the pill in its LAST week, when one week remains.
  ⚠ Tests: `tests/round26-span-gate.test.ts` (15 cases, walked careers) and
  `tests/component/round26-span-gate-ui.test.ts` (9 mounted, position + 375x667 + 320x568). Guard
  re-aims, all noted in place: 1 case in `r2-13-advance-span.test.ts`, 1 in
  `component/r2-13-span-report.test.ts`, 1 in `calendar-screen.test.ts` – each red before the re-aim
  and each re-aimed to the STRONGER claim, never relaxed. 12 mutations run, every arm killed (see
  the report). RNG capture 41550 / `e6b0c709` untouched; `SAVE_SCHEMA_VERSION` stays 60 and no
  migration, fixture or protocol shape moved.

- [!] **2 (again). «по-моему в каждой стране есть домашний универ»** – ⭐ he is overruling the RULE,
- [x] **2 (again). «по-моему в каждой стране есть домашний универ»** – ⭐ he is overruling the RULE,
  not the sentence. The in-state rung is US-only because it models US in-state tuition; his ruling is
  that a home university exists everywhere. **build**: the cheap rung becomes the home-country place
  for every country, and the refusal it keeps (if any) must be one a player can meet.

  **R26-G, `round26/home-university`. NO REFUSAL SURVIVES – that is the answer to "if any".**
  All three places are pressable in all **24** playable countries, in every career, and the boolean
  that could shut one is gone from the wire and from the save.

  **1. THE LADDER, AND WHY THESE WORDS.** The shape is his: home / away / private.

  | id (persisted, unchanged) | was | **is** | price `[S]`, unchanged | the fact under the price |
  |---|---|---|---|---|
  | `state` | The university at home | **The university at home** | $30,990/yr | she can live at home |
  | `national` | A university out of state | **A university away from home** | $50,920/yr | she cannot |
  | `private` | A private university | **A private university** | $65,470/yr | it is private |

  * `state` KEEPS its caption and that is the finding rather than the laziness – «The university at
    home» was already the right four words (they are his own), and what was US-shaped was the RULE
    underneath. Renaming would have hidden that.
  * `national` HAD to move, and its own round-21 justification says why: «out of state» was defended
    as «not jargon here, it is the sourced reason the second price is higher than the first» – and
    that reason WAS US residence. A caption cannot outlive the fact it was defending. What replaces
    it says the same thing from the family's side: she cannot sleep at home. True in Adelaide, Osaka
    and Belgrade, with no administrative vocabulary at all.
  * ⚠ **The caption is 27 characters against 25, on the row that already cost this card a definite
    article in round 21** – so it is MEASURED, not reasoned about: a mounted 320x568 card, the
    round-21 caption swapped back in, content floor re-read through the real cascade – **identical**,
    with a mutation arm (an over-long caption) that moves it.

  **2. WHAT A PLAYER CAN NOW REACH.** Everything. `tierShutFor`, `tierOpenTo`, `quoteShutFor`,
  `COLLEGE_SHUT_RULES`, `COLLEGE_SHUT_DETAIL`, `CollegeShutReason`, `residentOnly`,
  `.fork-place-refusal`, `.fork-place.is-shut` and `answerFork`'s `&& q.open` are all deleted.
  ⚠ **The one country rule that survives is a PRICE, not a door**: `needShareOf` still pays the
  need-based layer to a US family only (34 CFR §668.33 – who may receive a US GRANT, not who may
  enrol). A non-American family is quoted the same three places at the same three stickers and pays
  more of the bill.

  **3. SCHEMA v60 → v61, THE FULL 4-PART MOVE, AND IT IS NOT COSMETIC.** `CollegeQuote.open` is the
  first field this ladder has REMOVED rather than added. An always-true boolean was the other
  candidate and it is worse: the next reader believes a place can be shut and the next edit can shut
  one. ⚠ **And a v60 career sitting on an unanswered fork carries `state: {open: false}`** – under
  the new card that row is pressable, so without the migration the player presses «The university at
  home», `find(q => q.tier === tier && q.open)` misses, and the fallback enrols her **$20,000 a year
  dearer, silently, on the exact screen the item exists to fix.** Mutation-verified: the pre-round
  code plus no migration reproduces it exactly – *`the place she pressed: expected 'national' to be
  'state'`*.

  **4. MEASURED – `tools/college-home-place.ts --seeds 3 --countries US,AU`, n = 54 careers, 162
  four-year arms.** ⚠ The arms are TIERS on one tree, not two worktrees: the standing benches all
  build `country: 'US'` profiles, so a pre-commit "A" arm could not contain the change at all.

  | | before | after |
  |---|---|---|
  | how often the button takes the home place, US | 100% | 100% |
  | how often the button takes the home place, everywhere else (23 of 24 countries) | **0%** | **100%** |
  | AU median family bill at the default place | $25,062/yr | **$5,398/yr** (−$19,664) |
  | AU careers whose money ran out | 8/27 (30%) | **5/27 (19%)** |
  | AU careers finishing four years | 19/27 (70%) | **22/27 (81%)** |
  | US control – every line | $896 · 4/27 · 23/27 | **$896 · 4/27 · 23/27** |

  **5. NO CALIBRATED FIGURE MOVES AND NONE IS RETUNED.** `COLLEGE_TIER_ODDS` is still **85 / 93 / 74**:
  it is measured per PLACE, and this round changes who can TAKE a place, never what a place is worth
  once taken. The private deficit is still money and not tennis. ⚠ One PIN moved and it is not a
  figure – `COLLEGE_ODDS_MEASURED_AT` folds the whole tier object and `residentOnly` left it. The
  probe never reads that property, so no re-measure is owed, and the claim is mechanical rather than
  a comment: block F now pins the round-21 string beside the new one and asserts the only difference
  is the removed residence property.

  ⚠ **A measurement-instrument defect found on the way, and it is not this item's.** Round 26 #6 gave
  the college year a SECOND stop (the championship reveal) and every probe that walks the freeze
  presses once a year. `tools/birthday-pool.ts` reported **«no birthdays recorded»** for the whole
  college band; my own first cut reported 0 of 18 careers finishing four years. Both fixed here.
  **`tools/college-choice-probe.ts` and `tools/college-price-probe.ts` were NOT audited for the same
  hazard, and they are where §10i's bankruptcy figures came from.**

  Spec: `docs/specs/the-college-answers-2026-08.md` §11 (§4's names marked superseded, unedited).

- [x] **4 (again). «надо переписать значит саму фразу для велосипеда … достаток здесь вообще не при
  чем. У меня нет проблем с велосипедом, может быть это должна быть как раз просьба на первый ДР во
  время учебы вообще.»** – the means licence was the wrong tool for this row. **build**: the WISH
  beside `campusbike` is rewritten to be about the bicycle, and the pairing is a candidate for her
  FIRST college birthday specifically.

- [x] **10 (again). «у меня в ленте предпоследняя новость были из мира "до колледжа" на протяжении
  **R26-G, `round26/home-university`. HE WAS READING THE ASK AND THE OPTION AS A PAIR, and he was
  right to.** The dialog he read had `flighthome`'s fares line at the top and the bicycle in the
  options – a girl who cannot afford a train ticket, offered a bike. The first pass fixed the half
  that was visible (a hardship sentence over a $584,375 wallet) and left the half he was pointing at:
  **the bicycle had no wish of its own.** Its ask hooked on «minutes» and never said the word.

  **THE WISH, RENDERED** off `toSnapshot(world).birthdayPrompt` on a walked career, never a source
  string:
  * was: *"She has counted the minutes she spends walking between buildings. It is a lot."*
  * **is: *"Everyone there has a bicycle. She walks, and she has mentioned it twice."***

  It names the thing, it is 71 characters against 76 (so the prompt got SHORTER), and it hooks twice
  where the old line hooked once – *bicycle* is on this row's label and no other row of the band,
  *walks* is in its note and nowhere else (rule 2, `tests/birthday-ask.test.ts`).

  **AND IT IS FIRST-COLLEGE-BIRTHDAY-SPECIFIC, WITH A REASON BEYOND HIS SUGGESTION.** A bicycle is a
  fresher's problem: the fifteen minutes between buildings are a discovery in the first term and
  solved furniture by the fourth year. The band's other three rows – the room, the journey home, the
  reading list – are true of all four years, so this is the one row that belongs to a particular one.
  A deterministic college year is also the house's own shape (`decisions.md` 19.08: «one line per
  year and not a random pick… four college birthdays is the whole of the population»).
  Built in three parts, each load-bearing: the college cycle is **rotated** so entry 0 carries the
  bicycle (exactly one of the four C(4,3) combinations omits it, so it costs at most one step and no
  draw); the college walk is indexed by the **college birthday** rather than by her age (she enrols at
  18, 19 or 20, so no fixed rotation could land entry 0 on her first otherwise); and the ask is
  **overridden after the draw, not instead of it** – `seed:birthday:<age>` is still drawn exactly four
  times for every birthday in the game, and the override reads from `pool`, so §2ab holds: the ask is
  one of the four on screen and never a present she already owns.

  ⚠ **«достаток здесь вообще не при чем», as a measurement**: the same first wish renders identically
  at a household wallet of **$1,200** and of **$643,595**. And the means predicate is NOT deleted –
  `flighthome` and `books` keep it, `neverbuy` keeps it, `campusbike` declares nothing in any of its
  four strings, and a test asserts that split mechanically.

  **RE-MEASURED, `tools/birthday-pool.ts`, 12 walked careers:** back-to-back identical dialogs
  **college 0/36 = 0%** (worst run 1), **tour 0/189 = 0%** (worst run 1). Her four college birthdays
  are still four DIFFERENT dialogs – each row appears on 36 of 48 = **75%**, i.e. exactly 3 of the 4
  combinations, which is the arithmetic proof that all four are visited. The bicycle is asked for on
  **20 of 48 (42%)** college birthdays: twelve are the first-birthday pin, eight are ordinary draws.

  ⚠ **The instrument was broken before it was read.** `tools/birthday-pool.ts` presses three times a
  year and round 26 #6 gave the college year a second stop, so before the fix it printed **«no
  birthdays recorded»** for the entire college band. Fixed; it now reproduces §9's census exactly
  (48 college birthdays, median wallet $133,514, 0 in the `tight` band).

  ⚠ **RNG**: no new stream, no new draw. `tests/condition.test.ts` green, **41550 / `e6b0c709`**,
  unchanged. **No schema move for this item.** Spec: `docs/specs/birthday-and-gifts.md` §11.

- [!] **10 (again). «у меня в ленте предпоследняя новость были из мира "до колледжа" на протяжении
  всей учебы, а последняя жёлтым про её учебный год. Вот я бы хотел, чтобы "мир жил" и пока она в
  колледже, пусть и сжато»** – five rows a season is still invisible at eight screens in 208 weeks.
  **build**: the world must be visibly alive on the college screens themselves, compressed.
  · **THE THREE CANDIDATES, SEPARATED BY NUMBER (R26-H).** Walked four-year freezes, 4 careers × 12
  rest states = 48 screens, the real `toSnapshot` and Home's own ordering
  (`tools/college-news-probe.ts`). ⚠ **The probe had to be repaired first and that is a finding of
  its own**: round 26 #6 taught the year to pause on the championship and RETURN rather than spend
  itself, so the first pass's walk – which answers the cake and not the draw sheet – had put all
  twelve presses of every career **at the same week (324)** while dividing real rows by an imaginary
  208-week span. Repaired, the three candidates read: **(1) THE WINDOW dominates** – the card reaches
  **90 weeks** back, its median row is **9.2 weeks** old, and of the **17 weeks a press actually
  spends only 7.8 (45%)** have a row on the card at all. **(2) THE RATE is refuted** – the freeze
  writes **1.01 news rows a week** and the card holds **21.1** of them, never zero at any of the 48.
  **(3) THE SURFACE is refuted as "not drawn"** – `#diary-news` carries no college condition and the
  card renders under the college card (measured mounted, and mutation-verified by gating it).
  · **AND HIS OWN SAVE SAYS IT EXACTLY** (`alice-cfbv_w502`, read-only, never copied): the build he
  played printed **TEN rows** on that card – one yellow milestone and then **eight «🏆 <a stranger>
  won the World Tour N»**, the identical sentence he had been reading before she enrolled. Of his
  208 freeze weeks, **25** still had a news row alive at graduation. ⚠ His literal «предпоследняя
  из мира до колледжа» does not reproduce as a WEEK – no walked rest state prints a row older than
  enrolment (0/48) – it reproduces as a SENTENCE, which is the same complaint and a worse one.
  · **SO THE FIRST PASS WAS NOT WRONG, IT WAS UNREACHABLE**, and the fix follows from that: five
  rows a season posted into a window that covers 45% of the year is a coin flip – **2.4 generational
  rows at a rest state, NONE AT ALL at 9 of 48**. ⚠ Widening the window was measured and rejected:
  spending the whole 60-row snapshot budget on news (Home discards every `expense`/`income`, and the
  Money screen reads its own `financialEvents` slice, so five rows in six of that window are thrown
  away before drawing) gives **60 rows reaching 138 weeks** – more and older, the opposite of «сжато».
  · **WHAT SHIPPED: ONE ROW, ON THE WEEK HE IS STANDING ON.** `world/fieldNews.ts:160-258` –
  `campusDigestLine` + `announceCampusInterlude`, called from `world.ts:1775` at the one point every
  exit from `resumeFromCollege` passes (its other two lines: the `pressFrom` capture at `world.ts:1711`
  and the import/re-export at `world.ts:305-306`; `FIELD_NEWS.churnDepth`'s doc gained three lines at
  `fieldNews.ts:57`): «🌍 The tour has not waited: 34 of today's top 100 have come up since
  the scholarship began, and R. Delaney is #1 at 26.» Its week IS the rest week, so it is the top
  week group of the feed **by construction rather than by budget** – no window can lose it. Both
  facts are pure walks of `careerAt` / `rankingFor`; the newcomer count reads `debutSeason`, i.e. the
  PERSON and not the chair. ⚠ No pronoun anywhere: the first draft said «since she enrolled», which
  genders the KID and not a professional – legal, but it turns a mechanical assertion into one with a
  carve-out, so the clause was rewritten instead.
  · **MEASURED AFTER, same probe, same 48 rest states:** generational rows at rest **2.4 → 3.9**, rest
  states with none **9/48 → 0/48**, rows on the card 21.1 → 22.4, median age 9.2w → 8.7w.
  · **THE FOUR-YEAR BUDGET.** 11 rows per degree measured over four careers, 12 on the hashed one
  (0.05/week) against the first pass's 20 – one per press that moved time, and no more. Rows
  written inside the freeze 3,628 → 3,672; news rows Home shows 841 → **885 (+5.2%)**; the events
  array at graduation **401 → 402 with 39 kept in BOTH arms**. On the hashed college career, events
  401 → 402, `nextEventId` 1811 → 1823, **kept 24 in both arms** – every new row is ordinary, the
  ordinary class is at its floor through the whole freeze, and her history cannot be displaced.
  · **BYTE-IDENTICAL, PROVED.** A tour-only career (fork answered «continue», 8 seasons, week 416,
  400 events) hashes **`cb37b713c01df04a9febefe618bc86f24e85df72bdabe64f7eea77f2f876e8b8`** on both
  arms, every top-level key identical. A arm = `959264e` with `git revert --no-commit 959264e` in a
  detached worktree, B arm = `959264e`. ⚠ The harness was proved SENSITIVE before the null was
  believed: the same script on a COLLEGE career moves (`7c495576…` → `7f7c7dd0…`).
  · ⚠ **THE FROZEN CAREERS DO NOT MOVE, and it was measured rather than argued.** `events` and
  `nextEventId` are touched only inside `resumeFromCollege`, and the three frozen careers are 156
  weeks (she is 16.6 at the end, years short of the fork). `tools/frozen-key-diff.ts` on both arms,
  presets 0/1/2 at policy 1 – printed header checked against each invocation – is IDENTICAL on every
  top-level key. **No re-freeze.** `tests/condition.test.ts` green, **41550 / `e6b0c709`**, unchanged.
  No persisted field, no wire field, **no schema move**.
  · ⚠ **NOTHING ON THE COLLEGE CARD WAS TOUCHED** – not its heading, not its facts, not its answer
  buttons, and no news area was added to it: the card and the feed are on the same page, so the same
  sentence in both is one sentence twice. `CollegeYearCard.vue` is unmodified.
  · **THE GATES.** Unit project GREEN in full (`scripts/units.mjs`, 238 s); the 12-file guard batch
  (condition, coach-travel-edge, the six college files, events, pin-hygiene) 256/256; the component
  batch (my file plus college-card, college-flow, college-shell, second-act, home-strip, mount-smoke)
  98/98; `vue-tsc -b --force` clean; `doc-facts` ok; `pin-ratchet` ok (**3 raw marker slices, baseline
  3 – this wave added none**); `engine-purity` ok. ⚠ **`test:sim` exits 1 and it is NOT this branch,
  reproduced as CLAUDE.md demands rather than argued**: 9 of 10 files ok, `econ-reach-pro` "stalled
  twice (runner, not tests)" with its own report reading **10/10 passed** – the documented birpc
  `onTaskUpdate` 60 s RPC timeout. The same file ALONE: **37.27 s / exit 0 / 10 passed on this
  branch** against **36.95 s / exit 0 / 10 passed at `origin/wave/review-intake`**. Same file, both
  trees, no difference.
  · **MUTATION ARMS, each run and watched red:** `announceCampusInterlude` early-returns → 5 arms;
  the row dated `college.fromWeek` instead of `world.week` → the 3 RECENCY arms only, presence arms
  still green (a test that only counted rows would have passed this one); the row written
  `keep: true` → the budget arm; the zero-newcomer branch dropped → the pure-line arm; `#diary-news`
  gated on `!collegeWeek` → both mounted arms.

- [~] **14. «Alice поймала 2 травмы за половину сезона до колледжа, как будто многовато, но проверь
  пожалуйста по всем показателям»** – **measure**, against the shipped rates and her own load.
  → **MEASURED, AND THE MODEL IS CORRECT – IT IS A 13% WINDOW, NOT A DEFECT (R26-I).** Full workings
  in `docs/specs/the-injury-landscape-2026-08.md` §§12-17; instrument
  `tools/his-careers-brackets.ts --window 268:293` (the §9 reader extended, no fourth reader, no
  `src/` line touched). ⭐ **NEITHER INJURY CAME FROM THE WEEKLY ROLL.** Both are on-court
  retirements – `retiredId === KID_ID` on the w279 WT500 quarterfinal and the w286 slam R32 – and
  the weekly door produced exactly the **zero** its own hazard predicts (SUM of the shipped
  `injuryTau` over her 23 healthy weeks = **0.177**). ⚠ And `injuryHistory[].week` is the RECOVERY
  week, not the onset week (`rollInjury` writes the row in the branch that CLEARS the layoff); onset
  is `week − weeksOut`, and 0 of her 8 rows cross a season boundary between the two readings, so
  §9's published panel is unaffected. **THE GROUND TRUTH:** two `minor` layoffs, 2 and 1 weeks, **3
  weeks lost of 26** – in the same 26 weeks she won three titles. **THE EXPOSURE:** 42 matches in 14
  event weeks, **1.62 matches a calendar week against 0.78-0.85 for a comparable professional
  season** – twice the load, and the retirement hazard is bought per MATCH. ⭐ **CONDITION AT ENTRY
  RECOVERED for the first time** – it is not stored but it is invertible out of the frozen match
  snapshots against the save's own `college.years[0].startSkill` anchor, as a two-sided bracket
  whose both ends are proofs: she went on court at 67-70 all window and at **≤57 at w288**. **THE
  MODEL'S OWN PREDICTION at her own exposure** (4,000 reseeds of `simulateMatch` per match; all 42
  matches reproduce winner AND scoreline at their stored seed first): 0.461 ± 0.675 retirements +
  0.177 weekly = **0.638 expected onsets, and P(>=2) = 13.4% exactly** – one window in seven and a
  half. Per season she is at 4.00 ± 2.83 against round 25's 1.00 ± 0.20 – **z = 1.06, which is two
  events and not a signal**; normalised per match it is 4.76 ± 3.37 against a corrected bench's 3.19.
  **Answer: dense, then unlucky, and both injuries were the smallest the game deals.**

- [~] **15. «Посмотри статистику побед/поражений для Alice за эту половину сезона до колледжа и
  сверь с её показателями скиллов – всё ли соответствует?»** – **measure**: her realised win rate
  against what her skills predict.
  → **REPRODUCED AND IT IS CORRECT (R26-I).** `docs/specs/the-injury-landscape-2026-08.md` §§15-16.
  Realised **31-11**; the engine's own closed form (`fastMatchProbability` on the frozen players she
  actually met) expects **29.20 ± 2.76 (z +0.65)** and the full point loop **29.39 ± 2.74 (z +0.59)**.
  No tier and no round departs: the largest of twelve cells is r0 at z 1.74, which is what twelve
  cells do. ⚠ **42 matches is a wide sample and this is «consistent with», not a finding** – saying
  so plainly is the result. **AND THE TWO ITEMS ARE NOT LINKED IN HER DATA**: after an onset she is
  13-3 against an expected 12.75 ± 1.50 (z 0.16). The condition→win-probability mechanism is real and
  already inside the expectation – priced by re-running the identical MC on the same snapshot with
  the condition scaling undone, it is worth **0.16 of a win over the whole window**, 0.139 of which
  is one match (w288, condition ≤57, 0.380 -> 0.518, and she lost it).

- [?] **14b (raised by the measurement, NOT by him). The pro-era injury acceptance number has been
  stale since 10.08, and it may be the real «многовато».** `tools/pro-season-probe.ts` – the
  acceptance bench for `fatigue-reprice-2026-08.md` §6 – read the body BEFORE it resolved the
  tournament, so every onset opened by `retirementInjury` (inside `finalizeTournament`) landed after
  the check and **vanished from the ledger entirely**. Proved before it was believed: 30 retirements
  counted straight off `MatchRecord.retiredId` in the same run that reported ZERO retirement-door
  onsets, with 75% of those matches long enough to carry any hazard. Fixed in `tools/` only. The §6.4
  prevalence at the spec's own reference cell now reads **71% against the 30-54% professional band**
  (weekly door alone: 60%, against the **51%** recorded when `injuryBaseChance: 0.003` was set on 02.08 – the
  retirement door shipped 10.08). Variant C is measured NOT to be the drift.

  ⚠⚠ **THE FORK I PUT TO HIM WAS THE WRONG QUESTION, AND THE TARGET I QUOTED WAS STALE (26.08).** I
  asked whether 46-54% meant all injuries or only the weekly door. The spec answers it without him:
  §6.4's criterion was **RE-AIMED ON 04.08** (`fatigue-injury-audit-2026-08.md` §8) from the JUNIOR
  band 46-54% to the **PROFESSIONAL band 30-54%**, because the reference cell is twenty PROFESSIONAL
  events a year. The definition never changed – it is season prevalence, every injury – so there is
  no fork: **the number to beat is 30-54%, and today's reading is 71%. Seventeen points over the
  ceiling.**

  ⭐ **AND THE DRIFT IS DATED.** The 38% recorded on 04.08 was HONEST when it was taken – the
  retirement door did not ship until 10.08, so the probe's blindness could not yet hide anything.
  Splitting today's 71%: the retirement door accounts for about eleven points (weekly door alone
  reads 60%), and the weekly door itself drifted from the **51%** recorded when `injuryBaseChance`
  was set on 02.08 to 60% – **nine points nobody authored.** Those nine are the thing to chase
  first: a knob re-derived against an unexplained drift bakes the drift in.

  **VERDICT (mine, 26.08): a real overshoot, and NOTHING MOVES THIS WAVE.** It is an engine number,
  §7 reserves the professional week's price to him, and he is mid-way through playing the K=8/F=0.3
  dose himself – re-pricing the body underneath a live dose test would destroy the only reading that
  matters. What this round owes him is the corrected target and the corrected number, so the next
  measurement is not taken against a band retired three weeks ago. Both are now recorded here.

- [x] **14c (the audit 14b's finding demanded). BOTH college probes had rotted the same way, and
  one of them was printing a defect that does not exist.** `tools/college-choice-probe.ts` and
  `tools/college-price-probe.ts` answered the fork with `answerFork(world, 'college')` and went
  straight to `resumeFromCollege` – but ROUND 24 SPLIT THE ANSWER FROM THE DEPARTURE. The answer only
  RESERVES a place; `resolveCollegeDeparture` enrols her when `world.week` reaches `fork.departsWeek`,
  the following September. Neither probe ticked those weeks, so `world.college` stayed null, no ending
  latched, the press loop's `ending?.type === 'college'` was false on its first test, and both walks
  fell through to the read. Measured, not reasoned: week frozen at 242 in every career, `funds after`
  byte-identical to `savings at the fork`, «under water» 0/n.

  ⚠⚠ **THE CHOICE PROBE'S HEADLINE WAS THE INVERSE OF THE TRUTH.** Its quote-against-the-ledger line
  read `quoted $27,327 / charged $-0 / delta $-27,327` on the private tier – it looked exactly like
  the card promising a bill the tick never takes. Control (the file as shipped, run beside the fix):
  `charged $-0` on all three tiers, «nothing ended» everywhere. Fixed, n=54: **state $0/$-0, national
  $16,731/$16,732, private $26,594/$25,769**, and **bankruptcy 3 national, 4 private** where the
  shipped file reported none.

  ⭐ **THE SPEC IS NOT AFFECTED, and that was checked rather than assumed.** `the-college-choice-2026-08.md`
  records quoted == charged to the dollar (`national $14,144 / $14,144`) and real bankruptcies (6 of 53
  at the private place) – figures the broken walk CANNOT produce. The spec was measured before round 24
  split the departure; the instruments rotted afterwards and nobody re-ran them. The restored shape
  matches the spec's: state safe, national rare, private worst.

  ⚠ Both walks also learned round 26's league reveal (`skipTournament` + `closeTournament`), and the
  price probe now THROWS on a stalled walk – a press budget running out was indistinguishable from a
  career finishing, which is how a manufactured 0/n reached a report with a green run beside it.
  `tools/` only; no engine number is touched.

- [x] **14d. Does the country choice affect anything? (his question, and my earlier answer to it was
  wrong.)** I reported that country «no longer decides» the college price. It still does, in two
  shipped places. **(1) The need layer is US-only** – `needShareOf` returns 0 outright for a non-US
  family (`collegeOffer.ts:701`, the 34 CFR 668.33 rule the price probe already prints), so a
  non-American pays the sticker with the athletic share alone and no need-based discount. Round 26 #2
  removed the rule that shut a PLACE by country; it did not touch the rule that prices one.
  **(2) `homeWildCardPlace`** opens a rung she has not earned when the event is hosted in her country
  (`ladder.ts:688`). Both are real and neither is on any screen: **backlog, not a defect** – the
  onboarding country step still says nothing about either.

- [ ] **16. «test-build падает на гите»** – **build/diagnose**: CI is red and the local gate is
  green, so the difference is the runner. Reproduce before guessing.

- [x] **17. «жду what и checklist проверенный по итогу»** – the PR body, every box earned. Handed over
  26.08 against `2937502`: `CHECK_EXIT=0` from a file (engine purity ok, unit green in 255s, component
  733 passed, build ok), `TESTSIM_EXIT=0` with 10 sim files in 305s and no corridor moved, and the
  frozen MAIN capture unmoved – `tests/condition.test.ts` is byte-identical to main and passes 51/51 at
  41550 / `e6b0c709`. The one box that needed a reason rather than a tick is the schema: it MOVED,
  59 -> 61, and both 4-part moves are named in What (v60 the league's replays, v61 the deletion of the
  per-place `open` field).

  ⚠ **THE FIRST RE-GATE CAME BACK RED AND IT WAS MINE.** `CHECK_EXIT=1` with **3455 of 3455 tests
  passed and zero assertion failures** – the error was vitest's own `Timeout calling "onTaskUpdate"`,
  its reporter RPC, and `units.mjs` classified it itself: «1 stalled twice (runner, not tests)». Cause:
  I had `pkill`-ed the previous run and started the next one on top of it. Re-run clean on the same
  commit: green. Recorded because the contention signature is now three-for-three this round – zero
  failed assertions is the tell, and the answer is always to re-run before diagnosing.

  ⚠ **PR #105 WAS ALREADY MERGED by the owner** (the R2 programme, the world.ts/protocol.ts
  decomposition, #16's CI ceiling). This PR is round 26 alone: 43 commits on top.
