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

- [ ] **3. «А может ли соперница травмироваться во время матча?»**
  – *answer, possibly build.* Straight question about the match engine: is a rival's in-match injury
  modelled at all? Answer with the code path or its absence. If absent, that is a design question
  back to him, not a silent build.

- [ ] **4. «Проверь ещё раз текстовые трансляции на 500+ сериях пожалуйста, добавилось ли там
  детализации.»**
  – *measure.* A re-check of an earlier fix: did the commentary at the 500-and-above tiers actually
  gain detail? ⚠ Phrased as a RE-check, so if it did not, this is `[!]` REOPENED, not a new ask.

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
