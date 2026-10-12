---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-04 – Season, tournament cards and tournament flow

## 1. Scope and current state

This batch owns the Season planner, the tour guide, shared tournament-card wording, the dedicated
next-tournament preview and the complete tournament flow. It also records the small practice-match
sandbox that lives at the bottom of Season. Week planning controls are cross-referenced to RU-05 and
vacation package names to RU-06 rather than translated twice.

All Russian copy below is `DRAFT`. Runtime code and tests remain the authority for gates, entry
windows, points, money, draws and match results. Localization may rephrase facts; it may not infer a
different eligibility verdict from the one the worker provides.

## 2. Tournament and surface lexicon

Codes such as `J30`, `W15` and `W100` are international tennis shorthand and remain unchanged.
Full catalogue labels are localized; compact surfaces may continue to use the codes alone.

| id | English full label | Russian full label | compact |
| --- | --- | --- | --- |
| local | `Local Open` | `Местный открытый турнир` | `Местный` |
| regional | `Regional Championship` | `Региональный чемпионат` | `Региональный` |
| national | `National Series` | `Национальная серия` | `Национальный` |
| j30 | `Junior Tour 30` | `Юниорский тур 30` | `J30` |
| j60 | `Junior Tour 60` | `Юниорский тур 60` | `J60` |
| j300 | `Junior Tour 300` | `Юниорский тур 300` | `J300` |
| w15…w1000 | `World Tour {n}` | `Мировой тур {n}` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` | `W{n}` |
| slam | `Grand Slam` | `Большой шлем` | `Большой шлем` |

`Местный открытый турнир` is already the RU-02B tournament name and must be the same catalogue
entry here. Russian match headers may use the compact domestic adjective, but must not obtain it by
blindly deleting the last word from an arbitrary translated label.

| semantic value | English | Russian |
| --- | --- | --- |
| hard | `Hard` | `Хард` |
| clay | `Clay` | `Грунт` |
| grass | `Grass` | `Трава` |
| suits | `{surface} – suits her game` | `{surface} – подходит под её игру` |
| against | `{surface} – not her surface` | `{surface} – не её покрытие` |

The neutral affinity remains silent. The localized helper must consume `surface` and `affinity`
instead of slicing the phrase after an English `– `; both Season and the tournament preview
currently depend on that English punctuation trick.

## 3. Season header and phase strip

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU04-S01 | heading | `Season Planner` | `План сезона` |
| RU04-S02 | guide button | `Tour guide` | `Гид по туру` |
| RU04-S03 | pro allowance | `Pro entries, birthday to birthday: {used} of {limit}` | `Профессиональные турниры, от дня рождения до дня рождения: {used} из {limit}` |
| RU04-S04 | supply summary | `{n} left to enter over {weeks} weeks` | `До конца сезона: {availableEvents} за {remainingWeeks}` – ⚙ 11.10 дыра {remainingWeeks} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |
| RU04-S05 | lower-rung tail | `+{n} lower` | `+{n} на уровнях ниже` |
| RU04-S06 | visible reconciliation | `{n} of them on the cards below` | `На карточках ниже показано: {visibleEvents}` – ⚙ 11.10 дыра {visibleEvents} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |

`{availableEvents}` and `{remainingWeeks}` are complete counted phrases: `1 доступный турнир`, `2
доступных турнира`, `5 доступных турниров`; `за 1 неделю`, `за 2 недели`, `за 5 недель`. The compact
per-tier fragments use `{code}: {count}` rather than `W15 3`, which reads like another tier code.

The explanatory titles become visible help in any later redesign; for the current accessible and
pointer surfaces they are:

| id | English meaning | Russian |
| --- | --- | --- |
| RU04-S07 | `The tour's age rule limits how many professional (W) events she may enter in the year she is this age – counted from birthday to birthday. A fresh allowance arrives on her next birthday; junior and national events are not counted.` · pro allowance explanation | `Возрастное правило тура ограничивает число профессиональных турниров между двумя днями рождения. Новый лимит начинается в следующий день рождения; юниорские и национальные турниры в него не входят.` |
| RU04-S08 | `Tournaments you can still enter this season, counted across every level open to her – including the rare ones the eight-week feed cannot show. She can play one event a week at most, so the supply is always larger than the schedule.` · supply explanation | `Все турниры до конца сезона, на которые она ещё может заявиться, включая редкие уровни за пределами восьминедельной ленты. За одну неделю можно сыграть только один турнир.` |

The five narrow phase cells use `Хард · Грунт · Трава · Хард · Пауза`. Their week ranges use the
shared localized week formatter; `W3–W10` must not survive inside an otherwise Russian strip.

## 4. Tour guide

| id | English | Russian |
| --- | --- | --- |
| RU04-G01 | `Close tier guide` | `Закрыть гид по туру` |
| RU04-G02 | `Close` | `Закрыть` |
| RU04-G03 | `Tour guide` | `Гид по туру` |
| RU04-G04 | `Tier` (`TierGuide.vue`) | `Уровень` · `APPROVED` 10.10 |
| RU04-G05 | `Opens at` | `Открывается при` |
| RU04-G06 | `Draw` | `Сетка` |
| RU04-G07 | `Entry fee` | `Взнос` |
| RU04-G08 | `Travel` (`TierGuide.vue`) | `Поездка` · `APPROVED` 10.10 – заголовок колонки гайда: цена одной поездки этого уровня; категория расходов «Поездки» – ряд `spend\|Travel` в RU-06 |
| RU04-G09 | `Points (W / F / SF / …)` | `Очки (П / Ф / ПФ / …)` |
| RU04-G10 | zero entry fee | `none` | `нет` |

Round abbreviations in the table may be Russian because its header explicitly explains a points
sequence: `П` = победа, `Ф` = финал, `ПФ` = полуфинал, `ЧФ` = четвертьфинал. Match badges and stored
results keep their internationally recognizable codes until RU-07 reviews them as one system.

The opening-condition formatter needs semantic clauses:

| condition | Russian template |
| --- | --- |
| no gate | `доступен с начала карьеры` |
| minimum age | `с {age} лет` |
| bounded age | `в возрасте {min}–{max} лет` |
| acceptance rank | `место в {rankingPrepositional}: не ниже №{cut}` |
| acceptance percentile | `верхние {pct} % {rankingGenitive}` |
| point floor | `{points} {pointUnitGenitive}` |
| multiple clauses | join with `и`, without rebuilding cases at the call site |

The current guide's closing paragraph is stale: it still describes “the first four rungs” and “the
top two” from an older, smaller ladder. The Russian replacement describes the live invariant rather
than copying the obsolete count:

> `Диапазоны намеренно перекрываются – почти всегда есть выбор, куда ехать. Национальный,
> международный и профессиональный рейтинги – разные таблицы: их очки не складываются. Юниорский
> тур начинается с тринадцати лет и не приносит призовых; деньги появляются в профессиональном
> туре.`

⚙ RULED 10.10 (чат-ок №6): the stale English was corrected in TierGuide.vue to the mirror of the
replacement above; the pair lives as the row below.

| id | English | Russian |
| --- | --- | --- |
| RU04-G12 | `The bands overlap on purpose – there is always more than one place to go. National, international and professional rankings are separate tables: their points never add up. The Junior Tour starts at thirteen and pays no prize money; the money starts on the pro tour.` | `Диапазоны намеренно перекрываются – почти всегда есть выбор, куда ехать. Национальный, международный и профессиональный рейтинги – разные таблицы: их очки не складываются. Юниорский тур начинается с тринадцати лет и не приносит призовых; деньги появляются в профессиональном туре.` · `APPROVED` 10.10 |

## 5. Shared draw and probability wording

These messages are shared by Season, Calendar and the dedicated preview. One catalogue key per row
prevents the same ring from receiving three translations.

| id | English | Russian |
| --- | --- | --- |
| RU04-P01 | `The draw has not been made yet.` | `Жеребьёвки ещё не было.` |
| RU04-P02 | `Her chance to win the first match: {pct} percent, against {opponent}` | `Шанс выиграть первый матч против {opponent}: {pct} процентов` |
| RU04-P03 | `First round vs {opponent}` | `Первый круг: {opponent}` |
| RU04-P04 | `Her chance to win a first match at this level: {pct} percent. The draw has not been made yet.` | `Обычный шанс выиграть первый матч на этом уровне: {pct} процентов. Жеребьёвки ещё не было.` |
| RU04-P05 | `A typical first round at this level` | `Обычный первый круг на этом уровне` |
| RU04-P06 | `A typical figure for this level – it sharpens when the draw is made.` | `Это ориентир для уровня – после жеребьёвки расчёт станет точнее.` |

The number before the draw and the number after it remain different facts. P04 says `обычный шанс`
so the jump at the draw reads as new information about a named opponent, not a changed forecast for
the same question.

## 6. The dedicated next-tournament preview

### 6.1 Photograph and reading

| id | English | Russian |
| --- | --- | --- |
| RU04-N01 | `Entry fee` | `Взнос` |
| RU04-N02 | `Travel budget` | `Бюджет поездки` |
| RU04-N03 | `Conditions` | `Условия` |
| RU04-N04 | `The read` | `Оценка` |
| RU04-N05 | `Most of this field is ranked above her.` | `Большинство участниц стоит в рейтинге выше неё.` |
| RU04-N06 | `A field of about her own level.` | `Поле примерно её уровня.` |
| RU04-N07 | `She is among the strongest entered.` | `Она среди сильнейших в заявке.` |
| RU04-N08 | positive court read | `Этот корт подходит под её игру.` – ⚙ 11.10 ключ умер, ряд исторический – ключ уже переведён другим рядом иначе `QUESTION` |
| RU04-N09 | negative court read | `Этот корт ей не подходит.` – ⚙ 11.10 ключ умер, ряд исторический – ключ уже переведён другим рядом иначе `QUESTION` |

N08–N09 are rendered from semantic affinity, not by cutting and re-capitalizing the localized
surface hint. `event.coachCaution` remains authored coach prose and is translated with the coach
voice in RU-05.

### 6.2 Facts and first round

| id | English | Russian |
| --- | --- | --- |
| RU04-N10 | `Surface` | `Покрытие` |
| RU04-N11 | `Prize money` | `Призовые` |
| RU04-N12 | winner-cheque title | `Чек победительницы на этом уровне` – ⚙ 11.10 ключ умер, ряд исторический – ключ уже переведён другим рядом иначе `QUESTION` |
| RU04-N13 | `The junior tour pays no prize money at any level` · junior zero title | `На юниорском туре призовых нет ни на одном уровне` |
| RU04-N14 | `Winner` (`NextTournamentPanel.vue`) | `Победитель` – ⚙ 12.10 r49 №6 слово владельца |
| RU04-N15 | `Spectators` | `Зрители` |
| RU04-N16 | `About {spectators} people around the courts – atmosphere, not a factor in play` · crowd title | `Около {spectators} зрителей у кортов – это атмосфера, а не фактор матча` |
| RU04-N17 | `First round` | `Первый круг` |
| RU04-N18 | `{n}-player draw` | `Сетка на {players}` – ⚙ 11.10 ключ умер, ряд исторический – ключ уже переведён другим рядом (ряд в childhood-prologue даёт «Сетка на {0} участниц» для всех размеров сетки) `QUESTION` |
| RU04-N19 | `Unranked` | `Без рейтинга` |
| RU04-N20 | `VS` | `–` |
| RU04-N21 | `Only the first round is drawn before the week starts – the rest of the bracket is made when she gets there.` · drawn-note | `До начала недели известна только соперница по первому кругу – остальная сетка сложится на месте.` |

The winner-points value uses `{points} очков` with the shared point formatter. N18 uses a complete
counted phrase (`8 участниц`, `32 участницы`) rather than appending a noun to the number. The visible
dash in N20 has an accessible `{player} против {opponent}` label.

## 7. Season cards – frame and status

| id | English | Russian |
| --- | --- | --- |
| RU04-C01 | `This week's tournament` | `Турнир этой недели` |
| RU04-C02 | `Watch match` | `Смотреть матч` |
| RU04-C03 | `This week's practice match` | `Тренировочный матч этой недели` |
| RU04-C04 | `Watch practice match` | `Смотреть тренировочный матч` |
| RU04-C05 | `My entries` | `Мои заявки` |
| RU04-C06 | `Calendar` | `Календарь` |
| RU04-C07 | `Travel budget` | `Бюджет поездки` |
| RU04-C08 | `academy covers {pct}%` | `академия оплачивает {pct} %` |
| RU04-C09 | `injury` | `травма` |
| RU04-C10 | `shoot` | `съёмка` |
| RU04-C11 | `{brand} shoot week – she keeps her sessions and gives up the rest` · shoot title | `Съёмка для {brand}: тренировки остаются, остальное время уходит на съёмку` |
| RU04-C12 | deadline open | `closes {week}` | `заявки до {week}` |
| RU04-C13 | deadline passed | `Closed {week}` | `заявки закрыты · {week}` |
| RU04-C14 | `Entered` | `Заявлена` |
| RU04-C15 | `wild card` | `уайлд-кард` |
| RU04-C16 | wild-card title | `Одно из {places}, которые турнир оставляет игрокам страны-хозяйки: в обычный список участниц она не проходит.` – ⚙ 11.10 дыра русского ждёт готовую фразу со словом, а ключ отдаёт голое число: ряд ждёт локализованный аргумент `QUESTION` |
| RU04-C17 | `defending {points} pts` | `защищает {points}` |
| RU04-C18 | `Her counted result from this week last year ({points} pts) leaves the 52-week professional window as this week arrives.` · defending title | `Результат этой недели год назад ({points}) выйдет из 52-недельного профессионального зачёта с началом этой недели.` |
| RU04-C19 | `Outgrown – she is past this level` | `Уровень пройден – она его переросла` |
| RU04-C20 | parent plaque | `Your read:` | `Наша оценка:` |
| RU04-C21 | hired-coach plaque | `Coach says:` | `Тренер говорит:` |

C17 and C18 take an already formatted points phrase such as `1 очко`, `12 очков`; `защищает 12`
without the unit is too cryptic in Russian. Tournament summaries and match-row titles currently
come from stored `WorldEvent.text`; RU-11 must provide their Russian projection. The score remains
structural and must never be parsed out of a translated sentence.

### 7.1 Coach field voice

The hired coach stays short and declarative:

| verdict | English | Russian |
| --- | --- | --- |
| strong | `This field is strong.` | `Поле сильное.` |
| strong | `Tough draw. Plenty of good players here.` | `Тяжёлая сетка. Здесь хватает сильных соперниц.` |
| strong | `She will have to earn every game here.` | `Здесь ей придётся выгрызать каждый гейм.` |
| strong | `This is a level up. Good practice either way.` | `Это уровень выше. В любом случае будет полезно.` |
| even | `An even field.` | `Ровное поле.` |
| even | `Good field. Many solid players.` | `Хороший состав. Много крепких игроков.` |
| even | `She belongs in this one.` | `В этой компании она на своём месте.` |
| even | `Nothing here she has not seen before.` | `Ничего нового для неё здесь нет.` |
| favourite | `She should be among the best here.` | `Она должна быть среди сильнейших.` |
| favourite | `She is one of the strongest in this draw.` | `Она одна из сильнейших в этой сетке.` |
| favourite | `On paper this is hers to lose.` | `На бумаге всё в её руках.` |
| favourite | `A field she should be beating.` | `Такое поле она должна проходить.` |

The self-coached family sounds observant, less certain and not professionally omniscient:

| verdict | English | Russian |
| --- | --- | --- |
| strong | `Reading down the list, most of these names are above her.` | `Смотрю по списку – большинство выше неё.` |
| strong | `This one looks hard on paper.` | `На бумаге будет тяжело.` |
| strong | `A lot of good players in this draw. More than usual.` | `В сетке непривычно много сильных игроков.` |
| strong | `We do not recognise half of them, and that is usually the bad half.` | `Половину имён мы не знаем. Обычно это плохая половина.` |
| even | `Names we half know, and some we do not.` | `Кого-то знаем, кого-то нет.` |
| even | `Looks like the girls she usually plays.` | `Похоже на тех, с кем она обычно играет.` |
| even | `Nothing on this sheet we have not seen before.` | `В этом списке нет никого, кого мы ещё не видели.` |
| even | `An ordinary week, as far as we can tell.` | `Насколько можно судить, обычная неделя.` |
| favourite | `Reading the sheet, she may be the best name on it.` | `По списку она, может быть, здесь самая сильная.` |
| favourite | `We have watched her beat most of these.` | `Большинство из них она уже обыгрывала.` |
| favourite | `Nobody on this list has frightened us before.` | `В этом списке её ещё никто не пугал.` |
| favourite | `She is the one to beat here, unless we are reading it wrong.` | `Похоже, обыгрывать здесь надо именно её. Если мы всё правильно поняли.` |

Draw-seam additions:

| kind | Russian variants |
| --- | --- |
| kind draw | `Но с жеребьёвкой повезло.` · `Но первую соперницу можно проходить.` · `Но вход в турнир есть – достаточно посмотреть, с кем она начинает.` |
| cruel draw | `Но ей попалась как раз та, кто может её остановить.` · `Из всего списка в первом круге досталась не та.` · `Но самое трудное здесь – первый круг.` |

The deterministic per-event selection is unchanged. Localization selects the corresponding index
inside the Russian pool; it must not draw again or consume the main RNG stream.

## 8. Entry controls, locks and confirmations

### 8.1 Card controls

| id | English | Russian |
| --- | --- | --- |
| RU04-E01 | `Withdraw` (`SeasonScreen.vue`) | `Сняться` · `APPROVED` 10.10 – турнирная форма; магазинная «Снять с продажи» – ряд `listing\|Withdraw` в RU-06 |
| RU04-E02 | `Cancel entry` | `Отменить заявку` |
| RU04-E03 | `Entries closed {week}` | `Заявки закрыты · {week}` |
| RU04-E04 | `Enter` | `Подать заявку` |
| RU04-E05 | `Enter the {event}, {weekRange}` – accessible (`src/composables/eventName.ts:40`) | `Подать заявку на турнир «{event}» ({weekRange})` |
| RU04-E06 | `Not enough funds` (`SeasonScreen.vue`) | `Недостаточно средств` · `APPROVED` 10.10 |
| RU04-E07 | `Exhausted – race anyway? Rest would be wiser.` | `Вымоталась – всё равно играть? Отдых был бы разумнее.` |
| RU04-E08 | `+ Plan week` | `+ Спланировать неделю` |
| RU04-E09 | `Exams this week` | `На этой неделе экзамены` |
| RU04-E10 | pro counter | `проф. турниры: {used} / {limit}` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| RU04-E11 | junior counter | `юниорские турниры: {used} / {limit}` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

The accessible entry name needs the **date** as well as the event label: a season can show
several tournaments of the same tier. This is the exact `enterActionName` source, not merely a
generic `Enter {event}` control. The visible `Подать заявку` remains the start of the accessible
name; `{weekRange}` uses the Russian shared formatter in RU-13D.
| RU04-E12 | pager `Back` / `Next` | `Назад` / `Вперёд` |

Lock vocabulary:

| state | Russian short form |
| --- | --- |
| injured fallback | `Травма – нужен отдых` |
| medical veto | `Врач не разрешил играть` |
| capped pro | `Возрастной лимит тура – {used} из {limit}` |
| capped junior | `Годовой лимит – {used} из {limit}` |
| capped fallback | `Годовой лимит исчерпан` |
| vacation | `Семейная поездка – {package}` |
| generic unavailable | `На этой неделе недоступен` |
| points lock | `{current} из {required} {pointUnitGenitive}` |
| acceptance lock | `Открывается в первых {cut} местах рейтинга` |
| young | `Откроется в {age}` |
| old/outgrown | `Возрастной уровень пройден` |
| scheduled | `Доступен – есть в календаре` |
| unscheduled | `Доступен – в ближайшие {weeks} его нет` |

RU-19 staff flag – нужна форма по полу говорящего (select): `medical veto` (the unnamed doctor is masculine in `не разрешил`).

Engine refusal details must become semantic reason plus arguments before entering the snapshot.
Rendering the existing `ineligibleDetail` in Russian is impossible at the component boundary, and
re-authoring the eligibility rule in the UI would violate the worker-authority invariant.

### 8.2 Confirmation messages

| id | situation | Russian message | action |
| --- | --- | --- | --- |
| RU04-Q01 | ordinary entry | `Подать заявку на турнир «{event}» ({week}, {surface})? {feeSentence}` | `Подать заявку` |
| RU04-Q02 | enter despite coach | `{coachCaution} Всё равно подать заявку на турнир «{event}» ({week}, {surface})? {feeSentence}` | `Всё равно заявиться` |
| RU04-Q03 | enter exhausted | `{caution} Всё равно подать заявку на турнир «{event}» ({week}, {surface})? {feeSentence}` | `Играть несмотря на усталость` |
| RU04-Q04 | withdraw before close | `Сняться с турнира «{event}» ({week})? Взнос {fee} вернётся полностью.` | `Сняться` |
| RU04-Q05 | cancel after close | `Отменить заявку на турнир «{event}» ({week})? Приём заявок закончился {deadline}, поэтому взнос {fee} не вернётся. Неделю можно будет отдать тренировочному матчу или семье.` | `Отменить заявку` |
| RU04-Q06 | zero fee | `Взноса нет, но поездку семья оплачивает сама.` | – |
| RU04-Q07 | paid fee | `Взнос – {fee}.` | – |

Q02 and Q03 must not concatenate punctuation onto an already punctuated coach sentence. Catalogue
arguments should carry semantic advice text or a separately rendered sentence, not a raw fragment
plus a space.

## 9. Planned-week rows and recovery offer

| id | English | Russian |
| --- | --- | --- |
| RU04-W01 | `Off-season` | `Межсезонье` |
| RU04-W02 | `Exams` | `Экзамены` |
| RU04-W03 | `Shooting week` | `Неделя съёмок` |
| RU04-W04 | `Training week` | `Неделя тренировок` |
| RU04-W05 | `+{gain} condition` | `Форма +{gain}` |
| RU04-W06 | `Skipping {event}.` | `Пропускает турнир «{event}».` |
| RU04-W07 | `Practice match` | `Тренировочный матч` |
| RU04-W08 | `Practice match + coach` | `Тренировочный матч + тренер` |
| RU04-W09 | `instead of {event}` | `вместо турнира «{event}»` |
| RU04-W10 | `Play it and watch` | `Сыграть и посмотреть` |
| RU04-W11 | `undo\|Cancel` | `Отменить` · `APPROVED` 10.10 – ключ получил `undo\|`-тег (чат-ок: «Отмена» закрывает диалог, «Отменить» отменяет бронь; это кнопки отмены брони на Сезоне) |
| RU04-W12 | `School owns this week.` | `Эта неделя принадлежит школе.` |
| RU04-W13 | open-but-unscheduled note | `Ей также доступны: {tiers}. В ближайшие {weeks} их нет в календаре. Это не блокировка – просто такие турниры проходят реже.` – ⚙ 11.10 дыра русского ждёт готовую фразу со словом, а ключ отдаёт голое число: ряд ждёт локализованный аргумент `QUESTION` |
| RU04-W14 | stacked-week note | `На одной неделе теперь может быть несколько турниров. Сыграть можно только один – выбирать вам.` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

The recovery offer:

| id | English | Russian |
| --- | --- | --- |
| RU04-R01 | severe title | `She is worn out – maybe a family week?` | `Она вымоталась – может, провести неделю с семьёй?` |
| RU04-R02 | mild title | `She could use a week off – maybe a family week?` | `Ей не помешает неделя отдыха – может, с семьёй?` |
| RU04-R03 | body | `Форма: {condition}/100. Неделя отдыха в {week} поможет восстановиться. Мы ничего не забронируем без вашего решения.` |
| RU04-R04 | `See the options` | `Посмотреть варианты` |
| RU04-R05 | `Not now` | `Не сейчас` |

Vacation and practice booking confirmations are owned with `PlanWeekSheet` in RU-05/RU-06, but
the Season call sites must consume those same message keys. They must not retain separate English
sentence builders merely because the sheet emits structured values.

## 10. Practice-match sandbox on Season

| id | English | Russian |
| --- | --- | --- |
| RU04-F01 | `Friendly match` | `Тренировочный матч` |
| RU04-F02 | `Top seed` | `Первая сеяная` |
| RU04-F03 | `vs` – visible · (`SeasonScreen.vue`) | `–` |
| RU04-F04 | `No points, no money – a hit-out` | `Без очков и призовых – просто сыграть` |
| RU04-F05 | `Play match` | `Сыграть матч` |
| RU04-F06 | `friendly\|Seed` · seed field label | `Ключ матча` |
| RU04-F07 | `optional` | `необязательно` |
| RU04-F08 | `Close the friendly` | `Закрыть тренировочный матч` |
| RU04-F09 | `Close` | `Закрыть` |

`Seed` here is a deterministic simulation key, not a tournament seeding position. Translating it as
`Посев` would falsely promise control over the opponent; `Ключ матча` is a clearer advanced option.
The visible dash needs the accessible sentence `{player} против первой сеяной`.

## 11. Implementation boundary so far

1. Tournament names, surface names, rank labels, dates, money and points must be localized at their
   shared semantic owners. Season and NextTournamentPanel must not keep private lookup tables.
2. `surfaceStyleHint`, `tierOpensWhen`, `TierState.note/title`, `entryFeeLabel`, `rankLabel`,
   `eventCard` probability helpers and all engine refusal details currently return finished English.
   Each needs either a typed message descriptor or a locale parameter at the presentation boundary.
3. Preserve the worker's eligibility verdict and every deterministic pool index. Localization is a
   projection; it does not make decisions and consumes no RNG.
4. The tour-guide closing paragraph is confirmed stale against the live ladder. Correct the English
   source when localization implementation begins so Russian is not the only truthful locale.
5. `WorldEvent.text`, `coachCaution`, tournament summaries and match plaques are unresolved English
   islands until RU-05/RU-11 provide semantic messages. No Russian visible fallback may expose them.
6. Phone LQA so far: 320/375 px; 200% text; all five phase cells; longest full tier names; guide
   table horizontal scroll; 1/2/5/21 events and weeks; every lock kind; two and three stacked cards;
   draw absent/present; `Без рейтинга`; long opponent surname; pro and junior counters; zero fee;
   five-digit travel; self-coached and hired-coach pools.

## 12. Tournament-flow stage grammar

Round names are facts, not free copy. The worker should expose a stage kind plus the draw remainder;
the locale owns both the full label and its compact tab. Do not translate a finished `roundLabel` or
derive behaviour by comparing its text.

| semantic stage | English full | Russian full | Russian compact |
| --- | --- | --- | --- |
| final | `Final` | `Финал` | `Ф` |
| semifinal | `Semifinal` | `Полуфинал` | `ПФ` |
| quarterfinal | `Quarterfinal` | `Четвертьфинал` | `ЧФ` |
| round of 16 | `Round of 16` | `1/8 финала` | `1/8` |
| round of 32 | `Round of 32` | `1/16 финала` | `1/16` |
| round of 64 | `Round of 64` | `1/32 финала` | `1/32` |
| round of 128 | `Round of 128` | `1/64 финала` | `1/64` |

`ПФ` and `ЧФ` are used only where the tab width demands them. Full headings remain unabbreviated.
The compact path result uses `В` for `выиграла` and `П` for `проиграла`; its accessible label must
say the whole result, because two isolated letters are not enough for a screen reader.

Finish labels use the same semantic source:

| finish index | English | Russian |
| --- | --- | --- |
| 0 | `Champion` | `Победитель` – ⚙ 12.10 r49 №6 |
| 1 | `Runner-up` | `Финалистка` |
| 2 | `Semifinalist` | `Полуфиналистка` |
| 3 | `Quarterfinalist` | `Четвертьфиналистка` |
| 4+ | `Round of {2^finish}` | `Выбыла в {localized stage}` – ⚙ 11.10 дыра русского ждёт готовую фразу со словом, а ключ отдаёт голое число: ряд ждёт локализованный аргумент `QUESTION` |

On a poster the early-exit form is a sentence, for example `Аня – выбыла в 1/8 финала`, rather than
the unnatural noun `участница 1/8 финала`. In tables that need a compact value, render the stage
alone: `1/8 финала`. Those are two projections of the same finish index, not two stored strings.

The Nations Cup has no knockout finish. Its three `Rubber` labels become `Матч 1`, `Матч 2 из 3`,
and so on; the final placing is `{place}-е место из {n} сборных`. Do not call a rubber `раундом` or
feed a national placing through the knockout formatter.

## 13. Tournament splash and header exits

| id | surface | English | Russian |
| --- | --- | --- | --- |
| RU04-T01 | hero back, accessible | `Back` | `Назад` |
| RU04-T02 | match-view exit | `To result` | `К результату` |
| RU04-T03 | unresolved-draw exit | `Skip all rounds` | `Пропустить все раунды` |
| RU04-T04 | fact | `Surface` | `Покрытие` |
| RU04-T05 | fact | `Prize money` | `Призовые` |
| RU04-T06 | fact | `splash\|Winner` | `Победителю` – ⚙ 12.10 r49 №6 падеж следует за словом |
| RU04-T07 | fact | `Spectators` | `Зрители` |
| RU04-T08 | winner cheque title | `The winner's cheque at this tier` | `Приз победителю на этом уровне` – ⚙ 12.10 r49 №6 падеж следует за словом |
| RU04-T09 | junior zero-prize title | `The junior tour pays no prize money at any level` | `На юниорском туре призовых нет ни на одном уровне` |
| RU04-T10 | student zero-points title | `A student field awards no ranking points` | `Студенческий турнир не даёт рейтинговых очков` |
| RU04-T11 | crowd title | `About {n} people around the courts – atmosphere, not a factor in play` | `Около {people} у кортов – это атмосфера, а не фактор матча` – ⚙ 11.10 ключ умер, ряд исторический – ключ уже переведён другим рядом (ряд с подписью зрителей выше по файлу) `QUESTION` |
| RU04-T12 | draw size | `{n}-player draw` | `Сетка на {players}` – ⚙ 11.10 ключ умер, ряд исторический – ключ уже переведён другим рядом (ряд в childhood-prologue даёт «Сетка на {0} участниц» для всех размеров сетки) `QUESTION` |
| RU04-T13 | age | `Age {n}` | `{age}` – ⚙ 11.10 дыра {age} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |
| RU04-T14 | versus, visible, panel | `VS` | `–` |
| RU04-T14a | versus, visible, compact | `vs` (`TournamentFlow.vue`) | `–` |
| RU04-T15 | versus, accessible | `{a} vs {b}` | `{a} против {b}` `QUESTION` – ⚙ 11.10: ключ в коде общий с видимой парой «{0} – {1}» (T39-ок); aria-форма «против» ждёт своего ключа (№15) |
| RU04-T16 | rank | `Unranked` | `Без рейтинга` |
| RU04-T17 | ladder caption | `{ladder} ranking` | `{ladder}` |

`{players}` is `8 участниц`, `16 участниц`, never the mechanical `8-игроковая сетка`. `{age}` is
the shared counted age (`17 лет`, `21 год`). Crowd figures use Russian grouping (`1 750`), not the
current forced `en-US` comma. The visible dash is typographic; the accessible comparison says
`против` in full.

The no-ladder explanations are competition-owned messages:

| fixture | Russian |
| --- | --- |
| College League | `Без рейтинговых очков и призовых – студенческий турнир не даёт ни того ни другого.` |
| Nations Cup | `Без рейтинговых очков и призовых – в этом турнире их не получает никто.` |

They must be selected by a competition message key. A single generic `любительский турнир` sentence
would erase why the two competitions differ.

## 14. Coach brief and beginning the event

| id | English | Russian |
| --- | --- | --- |
| RU04-T18 | `Coach prediction` | `Оценка тренера` |
| RU04-T19 | `The court suits her game.` – fit | `Это покрытие подходит под её игру.` |
| RU04-T20 | `The court is not her surface.` – mismatch | `Это не её покрытие.` · `APPROVED` 10.10 – чат-ок №7: «лучше грамотно написать» – код берёт форму таблицы (с «is»), правка английского едет следующим пушем |
| RU04-T21 | title price | `{n} wins for the title.` | `До титула – {wins}.` – SUPERSEDED 10.10 (чат-ок №9: семь словесных форм остаются, генерик умер; ряды ниже – на твой русский) |
| RU04-T21a | title price, 1 | `One win for the title.` | |
| RU04-T21b | title price, 2 | `Two wins for the title.` | |
| RU04-T21c | title price, 3 | `Three wins for the title.` | |
| RU04-T21d | title price, 4 | `Four wins for the title.` | |
| RU04-T21e | title price, 5 | `Five wins for the title.` | |
| RU04-T21f | title price, 6 | `Six wins for the title.` | |
| RU04-T21g | title price, fallback | `{0} wins for the title.` | |
| RU04-T22 | travelled | `At the tournament with her this week – one additional fare on this trip.` | `На этой неделе тренер с ней на турнире – ещё один билет в расходах поездки.` |
| RU04-T23 | `Her condition` | `Её форма` |
| RU04-T24 | condition aria | `Her condition going into this tournament: {n} percent` | `Форма перед турниром: {n} процентов` |
| RU04-T25 | `Begin` | `Начать` |
| RU04-T26 | `Skip this event – withdraw` | `Пропустить турнир – сняться` |

`{wins}` is a counted phrase: `1 победа`, `2 победы`, `5 побед`. When the fixture has no title, the
whole title-price clause is absent. The fit line must be rendered from affinity and surface meaning;
the current English implementation slices text after `– ` and cannot be localized safely.

The withdrawal confirmation is:

> `Пропустить турнир «{event}»? Взнос не вернётся: приём заявок уже закрылся, когда она оставалась в списке. Расходы на поездку вернутся, а неделя пройдёт без матча.`

Confirm: `Пропустить турнир`. Cancel uses the shared `Отмена`. This is deliberately different from
`Пропустить все раунды`: withdrawal erases her run and forfeits the entry fee; skipping rounds only
fast-forwards presentation of a run already under way.

## 15. Walk through the draw

The path strip is compact but still localized:

| id | English | Russian |
| --- | --- | --- |
| RU04-T27 | win marker | `W` | `В` |
| RU04-T28 | loss marker | `L` | `П` |
| RU04-T29 | section | `Draw` | `Сетка` |
| RU04-T30 | tab group aria | `Draw rounds` | `Раунды турнирной сетки` |
| RU04-T31 | final heading | `The Final` | `Финал` |
| RU04-T32 | final aria | `The final – {a} vs {b}` | `Финал: {a} против {b}` |
| RU04-T33 | her match aria | `Her match – {a} vs {b}` | `Её матч: {a} против {b}` |
| RU04-T34 | semifinal trail | `Semifinals: def. {a} · def. {b}` | `В полуфиналах: обыграла {a} · обыграла {b}` |

The semifinal trail describes each finalist's route; the repeated feminine verb is therefore
correct for this all-women field. If mixed fields ever become possible, the result should carry a
winner relation rather than relying on this grammar.

Pre-match:

| id | English | Russian |
| --- | --- | --- |
| RU04-T35 | `Skip` (`TournamentFlow.vue`) | `Пропустить` |
| RU04-T36 | `Watch match` | `Смотреть матч` |

Here `Пропустить` means skip the replay and reveal this one result. It must never reuse the command
or confirmation for withdrawing from the event.

## 16. Match result and shared box score

The box score is shared with the practice match and is formally owned by RU-08. These bindings are
fixed here because the table is part of the tournament route; RU-08 must reuse them rather than
write a second set.

| id | English | Russian |
| --- | --- | --- |
| RU04-T37 | `Win` | `Победа` |
| RU04-T38 | `Loss` | `Поражение` |
| RU04-T39 | `{kid} vs {opponent}` – result pair | `{kid} – {opponent}` · `APPROVED` 10.10 |
| RU04-T40 | `Aces` | `Эйсы` |
| RU04-T41 | `Double faults` | `Двойные ошибки` |
| RU04-T42 | `Winners` | `Удары навылет` · `APPROVED` 10.10 – чат-ок: таблица должна читаться без знания жаргона; «Виннеры» – историческая форма этой ячейки |
| RU04-T43 | `Unforced errors` | `Невынужденные ошибки` |
| RU04-T44 | `Max serve` | `Макс. скорость подачи` |
| RU04-T45 | `km/h` | `км/ч` · `APPROVED` 10.10 |
| RU04-T46 | `Avg rally {n} shots · ~{duration}` – metadata | `В среднем {n} за розыгрыш · около {duration}` · `APPROVED` 10.10 – дыра переименована {shots}→{n} под английскую ячейку (позиционный маппинг) |
| RU04-T47 | `Watch again` | `Посмотреть ещё раз` · `APPROVED` 10.10 |
| RU04-T48 | `result\|Next` | `Дальше` |
| RU04-T49 | viewer proceed | `To the result` | `К результату` |

`Виннеры` is established Russian tennis language and avoids the ambiguous `победные удары`.
`{shots}` is a locale-formatted decimal phrase such as `3,4 удара`; the decimal separator changes
to a comma. Match duration needs a semantic duration formatter (`1 ч 24 мин`), not localization of
an already assembled English value. Ranking caption after the player pair uses exactly the ladder
label from section 2, with no extra `рейтинг`: `· Международный рейтинг`.

## 17. Watching after her exit

| id | English | Russian |
| --- | --- | --- |
| RU04-T50 | `{kid} – {finish}` | `{kid} – {finish}` – ⚙ 11.10: ключ – чистая пунктуационная склейка, identity; слова живут в параметрах |
| RU04-T51 | `She's out – see how the draw finishes.` | `Она выбыла – посмотрим, чем закончится сетка.` |
| RU04-T52 | `Next round` | `Следующий раунд` |
| RU04-T53 | `Continue` | `Продолжить` |

The first line needs the sentence projection described in section 12: `Аня – выбыла в четвертьфинале`,
not `Аня – четвертьфиналистка`. The latter reads like an accolade while the screen is following the
rest of the field.

## 18. Finale posters

| id | surface | English | Russian |
| --- | --- | --- | --- |
| RU04-T54 | champion status | `Champion` | `Победитель` – ⚙ 12.10 r49 №6 |
| RU04-T55 | runner-up status | `Runner-up` | `Финалистка` |
| RU04-T56 | champion line | `def. {opponent} in the Final` | `Обыграла {opponent} в финале` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| RU04-T57 | runner-up line | `lost to {opponent} in the Final` | `Уступила {opponent} в финале` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| RU04-T58 | points | `+{n} pts` | `+{n}` |
| RU04-T59 | path win | `def. {opponent}` | `обыграла {opponent}` |
| RU04-T60 | path loss | `lost to {opponent}` | `уступила {opponent}` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| RU04-T61 | `Continue` | `Продолжить` |

`{points}` is `1 очко`, `2 очка`, `5 очков`. The poster deliberately says `Финалистка`, not
`Вице-чемпионка`: it is standard tennis wording, modest enough for every tier and does not imply a
league title. In the early-exit poster, another player's status is `Победительница`; the heroine's
line below uses `выбыла в …`. A college or Nations Cup poster never invents a trophy, champion,
ranking gain or prize line when the engine has none.

## 19. Implementation contract

1. Add semantic tournament stage and finish descriptors to the worker snapshot. Retain the numeric
   facts already used for behaviour; do not make Russian or English display labels authoritative.
2. Represent rungless competition explanations by message id and typed arguments. This is required
   for old saves too: stored or reconstructed English `ladderNote`, `roundLabel` and `finishLabel`
   must not cross into the Russian UI.
3. Move `shortStage`, full stage rendering, finish rendering and counted title wins behind shared
   locale-aware formatters. `TournamentFlow`, `BracketTabs`, history and albums consume the same
   semantic values.
4. Move `matchStatRows` labels and the match metadata line into the shared message catalogue. Keep
   match arithmetic untouched.
5. Format crowd, decimal rally length, duration, age, participants, wins and points with Russian
   plural rules. Do not use `toLocaleString('en-US')` in a Russian route.
6. Preserve the resolved match record, reveal order, bracket cap and every command. Localization is
   presentation only and consumes no RNG.
7. Correct the stale English Tour Guide paragraph identified in section 4 during implementation;
   otherwise locale parity would preserve a known factual error.

## 20. LQA matrix and completion status

Test at 320 and 375 px, at 100% and 200% text, across:

- 8-, 16-, 32-, 64- and 128-player draws, including all compact tabs;
- Local, National, J30, W15 and Grand Slam events on every surface;
- ranked and unranked players, both ages present and legacy saves where both are absent;
- self-coached, non-travelling coach and travelling coach;
- watched match, skipped match, replay, skip all rounds and confirmed withdrawal;
- win, ordinary loss, retirement, champion, finalist and every earlier exit;
- College League and Nations Cup, proving neither leaks professional ranking language;
- long Cyrillic player and tournament names, four three-set score columns and 1 000+ spectators;
- keyboard focus, screen-reader comparisons, reduced motion and confetti disabled;
- English and Russian careers loaded from both new and old save fixtures.

Batch status: **drafted end to end**. Every current Season, tournament-card and tournament-flow
surface has a proposed Russian binding; cross-screen match commentary remains RU-08, historical
records RU-07 and worker-event history RU-11.

### ⚙ 10.10 добавка (№40, усмотрение архитектора): итоги сезона (SeasonSummaryDialog) – русская колонка твоя (DRAFT); общие ключи (Close, Continue, #{rank}, Unranked) живут в своих таблицах

| id | English | Russian |
| --- | --- | --- |
| RU04-SW01 | `Academy covered` | `Оплатила академия` |
| RU04-SW02 | `Best result` | `Лучший результат` |
| RU04-SW03 | `Earned this season` | `Заработано за сезон` |
| RU04-SW05 | `Final {n} rank` | `Итоговый рейтинг ({n})` |
| RU04-SW08 | `Lost to injury` | `Потеряно из-за травм` |
| RU04-SW09 | `Matches` | `Матчи` |
| RU04-SW10 | `Money` | `Деньги` |
| RU04-SW11 | `No result counted on that table this season. Her other standings are on the Stats tab.` | `В этой таблице за сезон нет зачётных результатов. Остальные её места в рейтингах – на вкладке «Рейтинг».` |
| RU04-SW12 | `Off-season now: rest, family time, and the block where next year gets built.` | `Теперь межсезонье: отдых, время с семьёй и работа над планом на следующий год.` |
| RU04-SW13 | `Off-season now: rest, school, family time.` | `Теперь межсезонье: отдых, школа, время с семьёй.` |
| RU04-SW15 | `Ranking` | `Рейтинг` |
| RU04-SW16 | `Record` | `Победы и поражения` |
| RU04-SW17 | `Season points` | `Очки сезона` |
| RU04-SW18 | `Season {n} · wrap-up` | `Сезон {n} · итоги` |
| RU04-SW19 | `She has not played a Junior Tour event yet. Her national standing is on the Stats tab.` | `Она ещё не играла на юниорском туре. Её национальное место – на вкладке «Рейтинг».` |
| RU04-SW21 | `Spent this season` | `Потрачено за сезон` |
| RU04-SW22 | `That's a season.` | `Вот и сезон позади.` |
| RU04-SW23 | `Tournaments entered` | `Заявлено турниров` |
| RU04-SW24 | `from #{n}` | `с №{n}` |
| RU04-SW25 | `{a} could not move her {b} ranking` | `Не могли повлиять на её рейтинг ({b}): {a}` |
| RU04-SW26 | `{n} wk` | `{n} нед.` |

### ⚙ 10.10 добавка (№40, усмотрение архитектора): отчёт промежутка недель (WeekSpanReport) – русская колонка твоя (DRAFT); общие ключи (Close, Continue, #{rank}, Unranked) живут в своих таблицах

| id | English | Russian |
| --- | --- | --- |
| RU04-SP01 | `1 week passed. Everything they raised is below.` | `Прошла 1 неделя. Всё, что произошло за это время, – ниже.` |
| RU04-SP02 | `Nothing was raised in that time.` | `За это время ничего не произошло.` |
| RU04-SP03 | `{n} weeks passed. Everything they raised is below.` | `{n, plural, one {Прошла {n} неделя} few {Прошли {n} недели} many {Прошло {n} недель} other {Прошло {n} недели}}. Всё, что произошло за это время, – ниже.` |

## ⚙ 11.10 agent-authored (бланкет) – the Season screen, the tournament flow and the tier states, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

125 keys of the Season screen (`SeasonScreen.vue`), the tournament flow and its bracket (`TournamentFlow.vue`, `BracketTabs.vue`), the tier states (`tierState.ts`), the tour guide and briefing, and the calendar tooltips the two screens share. The 24 scaffold cells of the 10.10 №40 addition (`SeasonSummaryDialog`, `WeekSpanReport`) are filled in place above and are not repeated.

**RU-04's own words are kept wherever they say the same thing.** Most of them sit in rows with four cells under a three-cell header – the parser skips such rows as malformed, so they never compiled; the cells below are their compiled home and the skipped rows stay untouched: §12's compact stage tabs (`Ф`, `ПФ`, `ЧФ`, `1/8` … `1/64`) and the path marks `В` / `П`, the draw-rounds and finale aria lines, `Наша оценка:` / `Тренер говорит:`, `Пауза`, `нет`, the supply phrases (`До конца сезона: … доступных турниров за … недель`), the §4 clause templates for the opening conditions (`с {age} лет`, `в возрасте {min}–{max} лет`, `место в международном рейтинге: не ниже №{cut}`, `верхние {pct}% …`, `доступен с начала карьеры`, joined by `и`) RU-03 M08–M11 (the wild-card tooltip, the exhaustion line, the entered state), §8.1's lock vocabulary (`Доступен – есть в календаре`, `Откроется в {age}`, `Открывается в первых {cut} местах рейтинга`, `Возрастной лимит тура – …`, `Семейная поездка – …`), §8.2's confirmations Q01 – Q07 (`Подать заявку на турнир «…»`, `Играть несмотря на усталость`, `Взнос … вернётся полностью`), §9's W13 / W14 / R03 (the open-but-unscheduled note, the stacked weeks, the recovery offer) and the draw-seam closing lines (`Но с жеребьёвкой повезло.`, `Но самое трудное здесь – первый круг.`).

**The tier-state sentences read their holes in nominative positions.** `{tier}` is the engine's tier label (`Local Open`, `World Tour 15`) – a name, put inside `«…»` after `Уровень` and never declined; `{when}` is the string `tierOpensWhen()` builds from the clauses above (the sentence says `откроется – {when}`); `{gap}` is `gapInResultsNote`'s English phrase (L2-4's named leftover) and stays after a dash; `{unit}` is RU-21's genitive-plural point unit. `Round of {0}` cannot be RU02B-LO's `1/{remaining / 2} финала` (an ICU message does no arithmetic), so the rare non-power-of-two round reads `Круг из N участниц`; the powers of two keep `1/8 … 1/64` through the compact tabs. The coach's draw-seam clauses follow a field reading and open with `Но` or state the draw outright. `def.` is the plain half of a same-file twin (`poster|def.`): its Russian is parked below as `QUESTION`, and until its call sites are tagged the two path rows of the flow read `def. I. Aigner` beside `уступила I. Aigner`.

| id | English | Russian |
| --- | --- | --- |
| RU21-SEA-01 | `Draw rounds` | `Круги сетки` |
| RU21-SEA-02 | `Her match – {0} vs {1}` | `Её матч: {0} против {1}` |
| RU21-SEA-03 | `Semifinals:` | `В полуфиналах:` |
| RU21-SEA-04 | `The Final` | `Финал` |
| RU21-SEA-05 | `The final – {0} vs {1}` | `Финал: {0} против {1}` |
| RU21-SEA-06 | `stage\|F` | `Ф` |
| RU21-SEA-07 | `stage\|QF` | `ЧФ` |
| RU21-SEA-08 | `stage\|R128` | `1/64` |
| RU21-SEA-09 | `stage\|R16` | `1/8` |
| RU21-SEA-10 | `stage\|R32` | `1/16` |
| RU21-SEA-11 | `stage\|R64` | `1/32` |
| RU21-SEA-12 | `stage\|R{0}` | `из {0}` |
| RU21-SEA-13 | `stage\|SF` | `ПФ` |
| RU21-SEA-14 | `Exhausted – racing risks injury.` | `Вымоталась – плотный график повышает риск травмы.` |
| RU21-SEA-15 | `One of the {0} places this tournament holds for players of the host nation – she is outside the acceptance list.` | `Одно из {0, plural, one {{0} места} few {{0} мест} many {{0} мест} other {{0} места}}, которые турнир оставляет игрокам страны-хозяйки: в обычный список участниц она не проходит.` |
| RU21-SEA-16 | `Also open to her: {0} – none scheduled in the next {1} weeks. Not locked, just rarer: keep watching the calendar.` | `Ей также доступны: {0}. В ближайшие {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}} их нет в календаре. Это не блокировка – просто такие турниры проходят реже; следите за календарём.` |
| RU21-SEA-17 | `Book it` | `Забронировать` |
| RU21-SEA-18 | `Cancel her entry to {event} ({week})? Entries closed on {deadline}, so the {fee} entry fee is NOT refunded. The week frees up for a practice match or a family week.` | `Отменить заявку на турнир «{event}» ({week})? Приём заявок закончился {deadline}, поэтому взнос {fee} не вернётся. Неделю можно будет отдать тренировочному матчу или семье.` |
| RU21-SEA-19 | `Cancel the entry` | `Отменить заявку` |
| RU21-SEA-20 | `Cancel the match` | `Отменить матч` |
| RU21-SEA-21 | `Cancel the practice match in {week}? {fee} comes back in full.` | `Отменить тренировочный матч ({week})? Сумма {fee} вернётся полностью.` |
| RU21-SEA-22 | `Cancel {package} in {week}? Nothing was paid for it.` | `Отменить «{package}» ({week})? За это ничего не заплачено.` |
| RU21-SEA-23 | `Cancel {package} in {week}? {fee} comes back in full.` | `Отменить «{package}» ({week})? Сумма {fee} вернётся полностью.` |
| RU21-SEA-24 | `Closed {week}` | `заявки закрыты · {week}` |
| RU21-SEA-25 | `Coach says:` | `Тренер говорит:` |
| RU21-SEA-26 | `Condition {0}/100. A week away in {1} would bring her back fresher – nothing is booked until you say so.` | `Форма: {0}/100. Неделя отдыха ({1}) поможет восстановиться. Мы ничего не забронируем без вашего решения.` |
| RU21-SEA-27 | `Enter anyway` | `Всё равно заявиться` |
| RU21-SEA-28 | `Enter {event} ({week}, {surface})? {fee}` | `Подать заявку на турнир «{event}» ({week}, {surface})? {fee}` |
| RU21-SEA-29 | `Entry fee {fee}.` | `Взнос – {fee}.` |
| RU21-SEA-30 | `Family vacation – {package}` | `Семейный отпуск – {package}` |
| RU21-SEA-31 | `First round: {0}, {1}.` | `Первый круг: {0}, {1}.` |
| RU21-SEA-32 | `Her first one is winnable, though.` | `Но первую соперницу можно обыграть.` |
| RU21-SEA-33 | `Injured – rest up` | `Травма – нужен отдых` |
| RU21-SEA-34 | `No entry fee – the trip is still yours to pay for.` | `Взноса нет, но поездку семья оплачивает сама.` |
| RU21-SEA-35 | `Not available this week` | `На этой неделе недоступен` |
| RU21-SEA-36 | `Of everyone here, she drew the wrong one first.` | `Из всего списка в первом круге досталась не та.` |
| RU21-SEA-37 | `Practice match in {week} – {fee}. No ranking points.` | `Тренировочный матч ({week}) – {fee}. Рейтинговых очков нет.` |
| RU21-SEA-38 | `Practice match with the coach in {week} – {fee}. No ranking points.` | `Тренировочный матч с тренером ({week}) – {fee}. Рейтинговых очков нет.` |
| RU21-SEA-39 | `Push through` | `Играть несмотря на усталость` |
| RU21-SEA-40 | `She could use a week off – maybe a family week?` | `Ей не помешает неделя отдыха – может, с семьёй?` |
| RU21-SEA-41 | `She has a way in, though – look who she opens against.` | `Но вход в турнир есть – достаточно посмотреть, с кем она начинает.` |
| RU21-SEA-42 | `She has drawn the one who can stop her, though.` | `Но ей попалась как раз та, которая может её остановить.` |
| RU21-SEA-43 | `She is worn out – maybe a family week?` | `Она вымоталась – может, провести неделю с семьёй?` |
| RU21-SEA-44 | `The draw has been kind, though.` | `Но с сеткой повезло.` |
| RU21-SEA-45 | `The first round is the hard part, though.` | `Но самое трудное здесь – первый круг.` |
| RU21-SEA-46 | `The junior tour caps how many international tournaments she may enter in the year she is this age – counted from birthday to birthday. This is where she stands against it.` | `Юниорский тур ограничивает число международных турниров между двумя днями рождения. Здесь видно, сколько из лимита уже использовано.` |
| RU21-SEA-47 | `The tour's age rule caps how many professional tournaments she may enter in the year she is this age – counted from birthday to birthday. This is where she stands against it.` | `Возрастное правило тура ограничивает число профессиональных турниров между двумя днями рождения. Здесь видно, сколько из лимита уже использовано.` |
| RU21-SEA-48 | `Weeks can carry more than one event now – she can only play one, so the pick is yours.` | `На одной неделе теперь может быть несколько турниров. Сыграть можно только один – выбирать вам.` |
| RU21-SEA-49 | `Withdraw from {event} ({week})? Entry fee {fee} will be refunded.` | `Сняться с турнира «{event}» ({week})? Взнос {fee} вернётся полностью.` |
| RU21-SEA-50 | `Year limit reached` | `Годовой лимит исчерпан` |
| RU21-SEA-51 | `Your read:` | `Наша оценка:` |
| RU21-SEA-52 | `junior entries {used} / {limit}` | `юниорские заявки {used} / {limit}` |
| RU21-SEA-53 | `pager\|Next` | `Вперёд` |
| RU21-SEA-54 | `phase\|Off` | `Пауза` |
| RU21-SEA-55 | `pro entries {used} / {limit}` | `профессиональные заявки {used} / {limit}` |
| RU21-SEA-56 | `skipping {0}` | `пропускает турнир «{0}»` |
| RU21-SEA-57 | `supply\|{code} {count}` | `{code}: {count}` |
| RU21-SEA-58 | `{0} left to enter over {1} weeks` | `До конца сезона: {0, plural, one {{0} доступный турнир} few {{0} доступных турнира} many {{0} доступных турниров} other {{0} доступного турнира}} за {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}` |
| RU21-SEA-59 | `{0} of them on the cards below` | `На карточках ниже показано: {0, plural, one {{0} доступный турнир} few {{0} доступных турнира} many {{0} доступных турниров} other {{0} доступного турнира}}` |
| RU21-SEA-60 | `{0}, {1} - open the planner` | `{0}, {1} – открыть план недели` |
| RU21-SEA-61 | `{caution} Enter {event} ({week}, {surface}) anyway? {fee}` | `{caution} Всё равно подать заявку на турнир «{event}» ({week}, {surface})? {fee}` |
| RU21-SEA-62 | `{caution} Enter {event} ({week}, {surface})? {fee}` | `{caution} Подать заявку на турнир «{event}» ({week}, {surface})? {fee}` |
| RU21-SEA-63 | `{label} in {week} – {price}, +{gain} condition. No tournaments that week.` | `{label} ({week}) – {price}, форма +{gain}. Турниров на этой неделе не будет.` |
| RU21-SEA-64 | `Tour age rule – {used} of {limit}` | `Возрастной лимит тура – {used} из {limit}` |
| RU21-SEA-65 | `Year limit – {used} of {limit}` | `Годовой лимит – {used} из {limit}` |
| RU21-SEA-66 | `fee\|none` | `нет` |
| RU21-SEA-67 | `The commitment rules now apply.` | `Теперь действуют правила обязательного участия.` |
| RU21-SEA-68 | `Tour office · {0}` | `Администрация тура · {0}` |
| RU21-SEA-69 | `What declining costs` | `Во что обойдётся отказ` |
| RU21-SEA-70 | `What the tour asks for` | `Чего требует тур` |
| RU21-SEA-71 | `At the tournament with her this week – one additional fare on this trip.` | `На этой неделе тренер с ней на турнире – ещё один билет в расходах поездки.` |
| RU21-SEA-72 | `Five wins for the title.` | `До титула – пять побед.` |
| RU21-SEA-73 | `Four wins for the title.` | `До титула – четыре победы.` |
| RU21-SEA-74 | `Her condition going into this tournament: {0} percent` | `Форма перед турниром: {0, plural, one {{0} процент} few {{0} процента} many {{0} процентов} other {{0} процента}}` |
| RU21-SEA-75 | `One win for the title.` | `До титула – одна победа.` |
| RU21-SEA-76 | `Round of {0}` | `Круг из {0, plural, one {{0} участницы} few {{0} участниц} many {{0} участниц} other {{0} участницы}}` |
| RU21-SEA-77 | `Six wins for the title.` | `До титула – шесть побед.` |
| RU21-SEA-78 | `Skip event` | `Пропустить турнир` |
| RU21-SEA-79 | `Skip {0}? The entry fee is forfeited – the list closed with her on it. Travel is refunded and the week passes without playing.` | `Пропустить турнир «{0}»? Заявочный взнос не возвращается – список закрылся, когда она уже была в нём. Дорожные расходы вернутся, а неделя пройдёт без игры.` |
| RU21-SEA-80 | `Three wins for the title.` | `До титула – три победы.` |
| RU21-SEA-81 | `Two wins for the title.` | `До титула – две победы.` |
| RU21-SEA-82 | `def.` | `обыграла` – ⚙ 11.10 RESOLVED: оба вызова переведены на существующие `poster\|`-ключи, голый ключ умер; ряд исторический `QUESTION` |
| RU21-SEA-83 | `in the Final` | `в финале` |
| RU21-SEA-84 | `path\|L` | `П` |
| RU21-SEA-85 | `path\|W` | `В` |
| RU21-SEA-86 | `poster\|def.` | `обыграла` |
| RU21-SEA-87 | `poster\|lost to` | `уступила` |
| RU21-SEA-88 | `{0} wins for the title.` | `До титула – {0, plural, one {{0} победа} few {{0} победы} many {{0} побед} other {{0} победы}}.` |
| RU21-SEA-89 | `Age {0}` | `{0, plural, one {{0} год} few {{0} года} many {{0} лет} other {{0} года}}` |
| RU21-SEA-90 | `International points come from Junior Tour events.` | `Международные очки приносят турниры юниорского тура.` |
| RU21-SEA-91 | `National points come from Local, Regional and National events, and the table starts again each season.` | `Национальные очки приносят местные, региональные и национальные турниры; таблица начинается заново каждый сезон.` |
| RU21-SEA-92 | `National points come from Local, Regional and National events.` | `Национальные очки приносят местные, региональные и национальные турниры.` |
| RU21-SEA-93 | `Not on the list yet` | `Пока не в списке` |
| RU21-SEA-94 | `Open – none in {weeks} weeks` | `Доступен – в ближайшие {weeks, plural, one {{weeks} неделю} few {{weeks} недели} many {{weeks} недель} other {{weeks} недели}} его нет` |
| RU21-SEA-95 | `Open – on the calendar` | `Доступен – есть в календаре` |
| RU21-SEA-96 | `Opens at {age}` | `Откроется в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} года}}` |
| RU21-SEA-97 | `Opens in the top {cut}` | `Открывается в первых {cut} местах рейтинга` |
| RU21-SEA-98 | `Outgrown` | `Уровень пройден` |
| RU21-SEA-99 | `Past this level – none in {weeks} weeks` | `Уровень пройден – в ближайшие {weeks, plural, one {{weeks} неделю} few {{weeks} недели} many {{weeks} недель} other {{weeks} недели}} его нет` |
| RU21-SEA-100 | `Past this level – still open` | `Уровень пройден – но доступен` |
| RU21-SEA-101 | `Reach {required} {unit}` | `Набрать {required} {unit}` |
| RU21-SEA-102 | `Under-{n}` | `Младше {n}` |
| RU21-SEA-103 | `age {age}` | `с {age, plural, one {{age} года} few {{age} лет} many {{age} лет} other {{age} года}}` |
| RU21-SEA-104 | `age {min}-{max}` | `в возрасте {min}–{max, plural, one {{max} года} few {{max} лет} many {{max} лет} other {{max} года}}` |
| RU21-SEA-105 | `gate\|{0} and {1}` | `{0} и {1}` |
| RU21-SEA-106 | `gate\|{points} {unit}` | `{points} {unit}` |
| RU21-SEA-107 | `open from the start` | `доступен с начала карьеры` |
| RU21-SEA-108 | `the top {cut} internationally` | `место в международном рейтинге: не ниже №{cut}` |
| RU21-SEA-109 | `the top {pct}% internationally` | `верхние {pct}% международного рейтинга` |
| RU21-SEA-110 | `{current} / {required} {unit}` | `{current} из {required} {unit}` |
| RU21-SEA-111 | `{points} {unit} in one season` | `{points} {unit} за один сезон` |
| RU21-SEA-112 | `{tier} is under-{n} – at {age} she has aged out of it.` | `Уровень «{tier}» – для возраста младше {n}: в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} года}} она уже из него выросла.` |
| RU21-SEA-113 | `{tier} – locked: {more} more {unit} (she has {has} of {need}) – {gap}. {earned}` | `Уровень «{tier}» закрыт: нужно ещё {more} {unit} (у неё {has} из {need}) – {gap}. {earned}` |
| RU21-SEA-114 | `{tier} – locked: {more} more {unit} (she has {has} of {need}). {earned}` | `Уровень «{tier}» закрыт: нужно ещё {more} {unit} (у неё {has} из {need}). {earned}` |
| RU21-SEA-115 | `{tier} – open to her, but none is scheduled in the next {weeks} weeks. This tier comes round less often than the others; it is not locked.` | `Уровень «{tier}» ей доступен, но в ближайшие {weeks, plural, one {{weeks} неделю} few {{weeks} недели} many {{weeks} недель} other {{weeks} недели}} турниров нет. Турниры этого уровня проходят реже остальных; сам уровень не закрыт.` |
| RU21-SEA-116 | `{tier} – open to her, next one {when}` | `Уровень «{tier}» ей доступен, ближайший турнир: {when}` |
| RU21-SEA-117 | `{tier} – opens at {when}` | `Уровень «{tier}» откроется – {when}` |
| RU21-SEA-118 | `{tier} – opens at {when}. Entry here is an acceptance list read off her international ranking – she has no international ranking yet.` | `Уровень «{tier}» откроется – {when}. Допуск сюда идёт по списку, который строится по международному рейтингу, а международного рейтинга у неё пока нет.` |
| RU21-SEA-119 | `{tier} – opens at {when}. Entry here is an acceptance list read off her international ranking – she is #{rank}.` | `Уровень «{tier}» откроется – {when}. Допуск сюда идёт по списку, который строится по международному рейтингу; сейчас она – №{rank}.` |
| RU21-SEA-120 | `{tier} – outgrown: she is past this level` | `Уровень «{tier}» пройден: она его переросла` |
| RU21-SEA-121 | `{tier} – past this level but still hers to enter, but none is scheduled in the next {weeks} weeks. This tier comes round less often than the others; it is not locked.` | `Уровень «{tier}» ею пройден, но заявляться на него по-прежнему можно; в ближайшие {weeks, plural, one {{weeks} неделю} few {{weeks} недели} many {{weeks} недель} other {{weeks} недели}} турниров нет. Турниры этого уровня проходят реже остальных; сам уровень не закрыт.` |
| RU21-SEA-122 | `{tier} – she has used all {limit} of her international events for this year (age {age}). Not locked: a fresh allowance arrives on her next birthday.` | `Уровень «{tier}»: на этот год (возраст – {age}) использованы все {limit, plural, one {{limit} международный турнир} few {{limit} международных турнира} many {{limit} международных турниров} other {{limit} международного турнира}}. Он не закрыт: новый лимит появится в её следующий день рождения.` |
| RU21-SEA-123 | `{tier} – she is past this level, and it is still hers to enter: next one {when}. The stronger rung on a week takes the card.` | `Уровень «{tier}» ею пройден, но заявляться на него можно: ближайший турнир – {when}. Если на неделе несколько уровней, в карточку попадает более сильный.` |
| RU21-SEA-124 | `{tier} – she is past this level.` | `Уровень «{tier}» ею пройден.` |
| RU21-SEA-125 | `{tier} – the tour's age rule allows {limit} pro entries at {age} and she has used all {used}. Not locked: a fresh allowance arrives on her next birthday, and the junior and national events stay open.` | `Уровень «{tier}»: по возрастному правилу тура в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} года}} ей доступно не больше {limit, plural, one {{limit} профессиональной заявки} few {{limit} профессиональных заявок} many {{limit} профессиональных заявок} other {{limit} профессиональной заявки}}, и использовано уже {used}. Он не закрыт: новый лимит появится в её следующий день рождения, а юниорские и национальные турниры остаются открытыми.` |
