---
type: round-ledger
status: current
area: rounds/23
canonical: false
last-reviewed: 2026-08-19
---

# Round 23 – two live careers, 20 items (19.08.2026)

Status: `[x]` shipped on `wave/round22` · `[~]` answered, nothing to build · `[>]` in flight, agent
named · `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**Captured before triage and before a line of code was read**, in his numbering and his words – the
thing round 22 could not do for itself (see `round-22.md`'s own opening note). His line is quoted
first, in the language he wrote it; the reading underneath is mine and is the part that may be wrong.

## The two saves

`tennis-sim_alice-cfbv_w257.tsave` and `tennis-sim_ines-xgv7_w570.tsave`, both in `~/Downloads`.

⚠ **READ-ONLY, NEVER COMMITTED, NEVER A FIXTURE.** They are his personal careers. Items 19 and 20
are analyses OF them; every other item that needs a world builds its own.

---

## The checklist

- [ ] **1. «Давай как-то по-другому оформим подсказки про уровень девушки на карточке тренера. Может
  что-то вроде "она близка к своему потолку" или "ещё есть куда расти" или "у неё большой потенциал"
  или что-то в таком духе, что даст игроку понять более явно»**
  – *build.* The coach card's readout of where she stands against her ceiling is too oblique. He
  wants a plain-language band, and has given three of them by example. The number behind it already
  exists (potential vs current); what changes is how it is said.

- [ ] **2. «Письмо Entries Suspended вызывает во мне странные чувства, особенно последняя строчка
  этого письма. Как будто её откуда-то сняли. Может быть можем как-то переформулировать?»**
  – *build (copy).* The suspension letter's closing line reads as if she has been struck off
  something. Find the string as RENDERED with real data, not in source, and rewrite the ending.

- [~] **3. «А может ли соперница травмироваться во время матча?»**
  – *answer, possibly build.* Straight question about the match engine: is a rival's in-match injury
  modelled at all? Answer with the code path or its absence. If absent, that is a design question
  back to him, not a silent build.

  **ANSWERED, and it is two answers. SHE CAN STOP. SHE IS NEVER HURT.**

  *(a) The firing path exists and is symmetric.* `simulateMatch` (`src/engine/match/engine.ts`
  L89-94, L192-206) draws **two** retirement uniforms off `${seed}:ret`, one per side, and walks
  `retireHazard(pointNumber, stamina)` forward for both. Side 1 is the rival's seat and it is not a
  spectator – measured over 900 seeded matches of a low-stamina pair: **side 0 fifteen, side 1
  sixteen, 3.44% of matches**. `playMatch` (`season/tournament.ts` L1000-1003) writes her id into
  `MatchRecord.retiredId`, the kid advances on a full undiscounted win, and `world/matchNews.ts`
  L65-68 gives the feed its own verb – *"beat a retiring"*. Three real ones, printed by
  `tests/match/rival-retirement.test.ts` out of 52 seeded Local Open draws:

  ```
  seed "rival-2"   round 2/3   ai-0 v kid   4-6 6-3 3-2   retired: ai-0   winner: kid
  seed "rival-41"  round 0/3   ai-0 v kid   7-6 4-6 4-2   retired: ai-0   winner: kid
  seed "rival-51"  round 1/3   ai-2 v kid   7-6 6-6       retired: ai-2   winner: kid
  ```

  *(b) But stopping is a SCORELINE event for her, never a BODY event – and this is the half he is
  really asking about.* The layoff is opened by `retirementInjury(world)` (`world/injury.ts` L410),
  which takes **only `world`** – the kid's world – and has no player-id parameter it could aim
  anywhere else. Both of its call sites guard on the kid: `world.ts` L1962 (`if (retiredMatch)`,
  where `retiredMatch` is `…find((m) => m.retiredId === KID_ID)` at L1741) and `world/planner.ts`
  L420 (`if (retiredId === KID_ID)`). **THE FUNCTION THAT WOULD HAVE TO EXIST AND DOES NOT** is a
  rival-side twin of it – something like `rivalUnavailable(world, cohortId, week)` – plus a reader
  for it in `selectEntrants`. Neither exists, and there is nowhere to put the state: a rival is made
  of exactly `ageYears, composure, growth, id, name, nation, potential, ret, serve, stamina` and
  nothing else, and `season/rival.ts` L22 states the rule outright – *"Rivals get NO injuries, NO
  physio, NO vacations and NO plan slider: that asymmetry is the player's edge, and it is
  deliberate."* Proved behaviourally, not just read: the girl who retired in week 10 is byte-
  identical afterwards and is entered, drawn and playing in week 11.

  *(c) And in a match the kid is not in it cannot happen at all.* AI-AI rows resolve through
  `fastMatchProbability` – one Bernoulli against a closed form, no points played, so no in-match
  fatigue to integrate (`season/types.ts` L307 says so on the field itself; pinned by
  `tests/match-retirement.test.ts`). So even if a rival body were added, only rivals who broke down
  **in front of him** could ever be hurt – the rest of the field would stay immortal.

  *(d) What the world DOES already model:* `alternatePlacesOpen` (`season/tournament.ts` L287) rolls
  how many entrants withdrew before each event off `ECONOMY.availability.injuryBaseChance`. The
  field breaking down is already fiction the game tells – anonymously, as a count of empty chairs.
  What is missing is a **named** girl carrying it.

  ⚠ **OWNER CALL, NOT A FIX-ROUND BUILD – and the cheap door is cheaper than it looks.** `retiredId`
  is already persisted on the match row, so a rival's layoff could be *derived* from `world.results`
  exactly the way `season/rival.ts` already derives her fatigue – **zero schema bump, zero RNG
  draws**, which is the one route that respects that module's "derive, never store" contract (a
  stored field on `AiPlayer` would cost a `SAVE_SCHEMA_VERSION` bump *and* re-map all 199 cohort
  draws). The engine slice is genuinely small: a predicate plus a filter in `selectEntrants`.
  **THE EXPENSIVE HALF IS EVERYTHING DOWNSTREAM.** A rival missing draws changes `finishes` →
  changes the `world.results` rows → changes the standings → changes who is in every later draw →
  changes who she meets and what she wins. That is a re-roll of every career's field from the week
  the first rival retirement lands: every frozen hash and golden save that encodes a field or a
  table moves, the corpus benches and the sim project's calibration bands need re-measuring, and
  **his two live careers diverge from that week**. My estimate: a wave of its own, and the
  re-freeze/re-measure tail is bigger than the feature. Recommend it is scheduled deliberately or
  declined deliberately – not smuggled into a fix round.

  *Evidence:* `tests/match/rival-retirement.test.ts` (5 tests, green) – the printed example, the
  per-side rate, the rival's field list, the guarded call sites, and the week-11 re-entry.

- [!] **4. «Проверь ещё раз текстовые трансляции на 500+ сериях пожалуйста, добавилось ли там
  детализации.»**
  – *measure.* A re-check of an earlier fix: did the commentary at the 500-and-above tiers actually
  gain detail? ⚠ Phrased as a RE-check, so if it did not, this is `[!]` REOPENED, not a new ask.

  **⚠ REOPENED. The detail is not there, and at the 500 specifically it never was.**

  *The earlier fix.* Commit `8e38c0d`, round 21 item 3, *"the running commentary knows which rung
  she is playing on"* – his SECOND ask on the same subject («проверь пожалуйста что с комментариями
  текстовой трансляции на 1000 и шлемах, кажется ничего не изменилось»). It gave `buildCommentary`
  a fourth argument, the occasion, and drove three levers off `viz/preview.ts`'s four-storey ladder:
  the phrase pools grow at storey 3 and again at storey 4, the stake is named from storey 2 up, and
  the room appears from storey 3 up. It shipped with its own instrument, `tools/commentary-rung-probe.ts`.

  *Measured now, 120 seeded matches, the same corpus in every arm* (`tests/commentary-tier-detail.test.ts`):

  | arm | storey | draw | beats/m | sentences/m | chars/m | distinct phrasings |
  |---|---|---|---|---|---|---|
  | J30 opener | 2 | 32 | 16.20 | 29.52 | 961.0 | 396 |
  | J30 final | 2 | 32 | 16.20 | 29.52 | 952.5 | 396 |
  | W75 opener | 3 | 32 | 16.20 | 31.76 | 1066.3 | 526 |
  | W75 final | 3 | 32 | 16.20 | 31.99 | 1065.3 | 528 |
  | WTA 250 opener | 4 | 32 | 16.20 | 31.18 | 1077.8 | 606 |
  | WTA 250 final | 4 | 32 | 16.20 | 31.40 | 1077.2 | 611 |
  | **WTA 500 opener** | 4 | 32 | **16.20** | **31.18** | **1077.8** | **606** |
  | **WTA 500 final** | 4 | 32 | **16.20** | **31.40** | **1077.2** | **611** |
  | WTA 1000 opener | 4 | 64 | 16.20 | 31.18 | 1077.8 | 606 |
  | WTA 1000 final | 4 | 64 | 16.20 | 31.40 | 1077.2 | 611 |
  | Slam opener | 4 | 128 | 16.20 | 31.18 | 1077.8 | 606 |
  | Slam final | 4 | 128 | 16.20 | 31.40 | 1077.2 | 611 |

  Rows differing, same match, same row index, out of 1944:

  | pair | differing | |
  |---|---|---|
  | J30 opener → W75 opener | 1064 | 54.7% |
  | W75 opener → WTA 250 opener | 1087 | 55.9% |
  | **WTA 250 opener → WTA 500 opener** | **0** | **0.0%** |
  | WTA 500 opener → WTA 1000 opener | 120 | 6.2% |
  | **WTA 500 final → Slam final** | **0** | **0.0%** |
  | J30 final → WTA 500 final | 1130 | 58.1% |

  **Three findings, and the third is the one that answers him.**

  1. **The top of the ladder is one flat floor.** `storeyOf` (`viz/preview.ts` L60) puts
     `wta250`/`wta500`/`wta1000`/`slam` all on storey 4, and `wta250.drawSize` and
     `wta500.drawSize` are both 32 – so a WTA 500 and a WTA 250 narrate **byte-identically**, and a
     WTA 500 final and a **Grand Slam final** narrate byte-identically too. The only thing separating
     a 500 from a 1000 is **one row per match**: the opener's `stageLabel`, which names the draw size
     ("Round of 64" vs "Round of 32"). Climbing from a 250 to a 500 to a 1000 buys him nothing.
  2. **The beat count never moves at all.** 16.20 rows per match at every rung from J30 to Slam. The
     log's beats are chosen by the *match*, never by the *rung*.
  3. **⚠ WHY THE ROUND-21 FIX MISSED, and it is two mistakes stacked.**
     *First, the arms.* `tools/commentary-rung-probe.ts` has a J30 arm, a W75 arm, a WTA 1000 arm
     and a Slam arm – **and no WTA 250 arm and no WTA 500 arm**. It only ever compared the top of
     the ladder against the bottom, where the storey genuinely changes; it never compared two rungs
     *inside* storey 4, so the flat floor was invisible to the instrument that was built to find
     exactly this. The rung he is standing on now has never been measured until today.
     *Second, and worse, the fix answered the wrong word.* He asked for **детализация**; what
     shipped was **variety**. Storey 4 rewords 56.7% of the rows against a W75 – and delivers
     **+1.1% characters, the same 16.20 beats, and 1.8% FEWER sentences** (31.18 vs 31.76). It says
     *fewer* things in *different* words. The mechanism is the per-row budget: `clausesUpTo` caps a
     row at 120 characters, so an arriving stake or room clause **displaces** a colour clause instead
     of joining it. The round-21 commit noticed this in passing – *"the stake arrives and costs one
     colour clause to the row budget"* – and shipped anyway, because its success metric was distinct
     phrasings (396 → 611, a real +54%) and phrasings are blind to substitution.

     **So the line that stops a third attempt missing the same way:** any next fix must be graded on
     beats-per-match and sentences-per-match with a **500-vs-250 arm in the instrument**, not on
     phrasing counts against a junior arm.

  *Not built:* the fix lives in `src/viz/commentary.ts` and `src/viz/preview.ts`, outside this
  agent's lane (`src/engine/match/**` + tests). Handing over the measurement and the diagnosis.
  ⚠ Also worth his knowing: only `TournamentFlow` passes `preview-event` into `MatchViewer` –
  `MatchReplay`, `PracticeFlow` and `SeasonScreen` do not, so a re-watched match falls all the way
  back to **storey 1**, the poorest log in the game.

  *Evidence:* `tests/commentary-tier-detail.test.ts` (5 tests, green) – the table above is printed by
  the first, and the flat floor, the one-row 1000 delta and the words-not-detail finding are asserted
  by the other four.

- [ ] **5. «Разный текст для каждой из карточек тренеров с микро описанием каждого из них в своём
  тире»**
  – *build.* Each coach gets his own short description, distinct WITHIN his tier – so two coaches of
  the same rung do not read as one man with two names.

- [ ] **6. «Что можем вместо school finished на личной странице написать? Может быть разное что-то
  там можно отображать в течение взросления? Про колледж и его окончание (если пошла и закончила
  конечно) ещё что-то предложишь?»**
  – *build + ask.* Two asks: (6a) replace the terminal "school finished" line with something that
  moves as she grows, and (6b) propose what college and its completion should say. The second is a
  proposal to him, not a build to make unilaterally.

- [ ] **7. «50% покрытия расходов от Meridian - не многовато? Есть какие-то вообще референсы из
  мирового спорта?»**
  – *answer.* A balance question wanting REAL-WORLD references, not an opinion. Answer with sourced
  numbers on what sponsors and federations actually cover, then say whether 50% sits inside that.

- [ ] **8. «Может добавить какой-то "магазин" в игру? Инвестиции, элитная недвижимость, машины,
  яхты? Сделай отдельный файл в беклог пожалуйста с мыслями на этот счёт. Можно как раз на вкладку
  Family budget отдельным пунктом добавить как вариант. А ещё можно какую-то логику простенькую
  изменения цены на эти вещи добавить, кстати, чтобы что-то могло обесцениться, например, или
  стихийно взлететь в цене. Или вообще заморозиться на неопределенный срок. Плюс можно добавить
  "элитного брокера" с еженедельным костом, как тренера»**
  – *build (a document).* He asked for a BACKLOG FILE, not a feature. Deliverable is one design doc:
  the shop, its home on the Family budget tab, simple price movement (depreciate / spike / freeze),
  and a weekly-cost broker modelled on the coach.

- [ ] **9. «И наверное пора задуматься над логикой психолога и массажиста… Текущие траты у меня в
  год 70к поездки с носа (того 140к), 23к тренер… Итого примерно 280к затрат только на этих ребят…
  Итого тотал по году примерно 340к затрат. Профессионально звучит, кстати?»**
  – *measure + ask.* He has done the arithmetic himself and wants it checked against the game's real
  numbers, then a view on whether a ~340k year reads professional. ⚠ Not a build this round: it needs
  the count first, and the count decides whether the 50% travel discount becomes the strong offer he
  suspects.

- [ ] **10. «Я просил уже как-то раз, чтобы local, Regional, national были все игроки с её домашним
  флагом, можешь сделать пожалуйста»**
  – *build.* ⚠ **[!] REOPENED by his own words – "я просил уже как-то раз".** The domestic rungs
  should be an all-home-nation field. Find what the earlier attempt aimed at and why it missed
  before writing anything.

- [ ] **11. «Я встретил unranked на national турнире, мне кажется это надо проверить»**
  – *build or already-works.* Reproduce first: an unranked entrant in a NATIONAL draw. It may be
  correct (a debutante has no ranking yet) – if so, the reproduction is the deliverable.

- [ ] **12. «А ещё в national таблице надо проверить как считаются очки у соперниц: мне кажется,
  что у лидера было 600+, а после моей победы стало 400+, т.е. как будто отнялись, хотя как-будто
  таблица должна просто показывать 6 лучших за сезон.»**
  – *build or already-works.* A rival's domestic total apparently FELL after his win. Best-6 over a
  rolling window can legitimately fall as old results age out – but "right after my win" is a
  different claim. Reproduce against the ledger before deciding.

- [ ] **13. «Куда-то сменилась вся верхушка национальной таблицы к концу сезона полностью»**
  – *measure.* Same table, different symptom: total turnover of the top by season's end. Measure the
  churn; decide whether it is the conveyor working as designed or the same defect as 12.

- [ ] **14. «По какому правилу считается количество допусков на турниры? По сезону не обновляется,
  получается, только по возрасту или как?»**
  – *answer.* He is asking the RULE for the entry allowance and has noticed it does not reset per
  season. Answer with the actual window (`entryCapUsage` / `annualProEntryLimit`) and its rows.

- [ ] **15. «И что-то как-то 25к хуже всех, получается пока что… Проверь там правило пожалуйста про
  поддержку этих ребят? Поправка: пришёл донейшн от локального спонсора почти на самом дне. Так что
  может быть и нормально всё здесь. Просто наблюдение, но твоё мнение послушать интересно.»**
  – *measure + answer.* He half-answered it himself. Wanted: the local-sponsor rule checked, and my
  view on whether the 25k start is survivable. ⚠ He explicitly softened this – do not build a
  balance change off it without saying so first.

- [ ] **16. «Что-то я не увидел когда академия появилась, покрывающая расходы на поездки. Проверь
  функционал оповещения пожалуйста»**
  – *build.* The academy that covers travel arrived without him noticing. The suspect is the
  NOTIFICATION, not the academy: verify the event fires and reaches a surface he actually reads.

- [ ] **17. «Перед ценами на карточках Bills написать "Around", тогда точно не будет вопросов
  "почему ракетка стоит 920, а мы заплатили 1070?"»**
  – *build (copy).* Smallest item in the round and fully specified.

- [ ] **18. «О! А ещё можно сделать после появления её счета в банке в 18 начать ей призовые
  переводить какие-то суммы, например начать с 10-20% и может быть наращивать год к году»**
  – *ask, then build.* A new mechanic with a number he has left open ("10-20%, maybe growing"). Turn
  it into a choice before building.

- [ ] **19. «Вот мой свежий профиль с 5 сезонами, сделай анализ пожалуйста… "не слишком ли быстро мы
  добрались до топ-100" снова? Или это мне только кажется и "глаз замылился"?»**
  – *measure.* Analysis of `alice-cfbv_w257`: starting data, progress, and the top-100 pace against
  the real-ladder references. ⚠ He is asking whether he is IMAGINING it – so the answer has to be a
  distribution, not one career read sympathetically.

- [ ] **20. «И свежий сезон Инес на свежем коде тоже сравнить перформанс, движение, победы и всё
  остальное с нашей системой выстроенной.»**
  – *measure.* Same, for `ines-xgv7_w570`, against what the system predicts for a player at her
  level. The pair (19 + 20) is one question asked at two career lengths.

---

## Triage, bundles and evidence

*Filled in at Step 2/3 – see the commit that follows this one.*
