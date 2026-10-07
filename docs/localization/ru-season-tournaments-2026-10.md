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
| w15…w1000 | `World Tour {n}` | `Мировой тур {n}` | `W{n}` |
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
| RU04-S04 | supply summary | `{n} left to enter over {weeks} weeks` | `До конца сезона: {availableEvents} за {remainingWeeks}` |
| RU04-S05 | lower-rung tail | `+{n} lower` | `+{lowerEvents} на уровнях ниже` |
| RU04-S06 | visible reconciliation | `{n} of them on the cards below` | `На карточках ниже показано: {visibleEvents}` |

`{availableEvents}` and `{remainingWeeks}` are complete counted phrases: `1 доступный турнир`, `2
доступных турнира`, `5 доступных турниров`; `за 1 неделю`, `за 2 недели`, `за 5 недель`. The compact
per-tier fragments use `{code}: {count}` rather than `W15 3`, which reads like another tier code.

The explanatory titles become visible help in any later redesign; for the current accessible and
pointer surfaces they are:

| id | English meaning | Russian |
| --- | --- | --- |
| RU04-S07 | pro allowance explanation | `Возрастное правило тура ограничивает число профессиональных турниров между двумя днями рождения. Новый лимит начинается в следующий день рождения; юниорские и национальные турниры в него не входят.` |
| RU04-S08 | supply explanation | `Все турниры до конца сезона, на которые она ещё может заявиться, включая редкие уровни за пределами восьминедельной ленты. За одну неделю можно сыграть только один турнир.` |

The five narrow phase cells use `Хард · Грунт · Трава · Хард · Пауза`. Their week ranges use the
shared localized week formatter; `W3–W10` must not survive inside an otherwise Russian strip.

## 4. Tour guide

| id | English | Russian |
| --- | --- | --- |
| RU04-G01 | `Close tier guide` | `Закрыть гид по туру` |
| RU04-G02 | `Close` | `Закрыть` |
| RU04-G03 | `Tour guide` | `Гид по туру` |
| RU04-G04 | `Tier` | `Уровень` |
| RU04-G05 | `Opens at` | `Открывается при` |
| RU04-G06 | `Draw` | `Сетка` |
| RU04-G07 | `Entry fee` | `Взнос` |
| RU04-G08 | `Travel` | `Поездка` |
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
| RU04-N08 | positive court read | `Этот корт подходит под её игру.` |
| RU04-N09 | negative court read | `Этот корт ей не подходит.` |

N08–N09 are rendered from semantic affinity, not by cutting and re-capitalizing the localized
surface hint. `event.coachCaution` remains authored coach prose and is translated with the coach
voice in RU-05.

### 6.2 Facts and first round

| id | English | Russian |
| --- | --- | --- |
| RU04-N10 | `Surface` | `Покрытие` |
| RU04-N11 | `Prize money` | `Призовые` |
| RU04-N12 | winner-cheque title | `Чек победительницы на этом уровне` |
| RU04-N13 | junior zero title | `На юниорском туре призовых нет ни на одном уровне` |
| RU04-N14 | `Winner` | `Победительница` |
| RU04-N15 | `Spectators` | `Зрители` |
| RU04-N16 | crowd title | `Около {spectators} зрителей у кортов – это атмосфера, а не фактор матча` |
| RU04-N17 | `First round` | `Первый круг` |
| RU04-N18 | `{n}-player draw` | `Сетка на {players}` |
| RU04-N19 | `Unranked` | `Без рейтинга` |
| RU04-N20 | `VS` | `–` |
| RU04-N21 | drawn-note | `До начала недели известна только соперница по первому кругу – остальная сетка сложится на месте.` |

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
| RU04-C11 | shoot title | `Съёмка для {brand}: тренировки остаются, остальное время уходит на съёмку` |
| RU04-C12 | deadline open | `closes {week}` | `заявки до {week}` |
| RU04-C13 | deadline passed | `Closed {week}` | `заявки закрыты · {week}` |
| RU04-C14 | `Entered` | `Заявлена` |
| RU04-C15 | `wild card` | `уайлд-кард` |
| RU04-C16 | wild-card title | `Одно из {places}, которые турнир оставляет игрокам страны-хозяйки: в обычный список участниц она не проходит.` |
| RU04-C17 | `defending {points} pts` | `защищает {points}` |
| RU04-C18 | defending title | `Результат этой недели год назад ({points}) выйдет из 52-недельного профессионального зачёта с началом этой недели.` |
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
| RU04-E01 | `Withdraw` | `Сняться` |
| RU04-E02 | `Cancel entry` | `Отменить заявку` |
| RU04-E03 | `Entries closed {week}` | `Заявки закрыты · {week}` |
| RU04-E04 | `Enter` | `Подать заявку` |
| RU04-E05 | accessible `Enter the {event}, {weekRange}` (`src/composables/eventName.ts:40`) | `Подать заявку на турнир «{event}» ({weekRange})` |
| RU04-E06 | `Not enough funds` | `Недостаточно средств` |
| RU04-E07 | `Exhausted – race anyway? Rest would be wiser.` | `Вымоталась – всё равно играть? Отдых был бы разумнее.` |
| RU04-E08 | `+ Plan week` | `+ Спланировать неделю` |
| RU04-E09 | `Exams this week` | `На этой неделе экзамены` |
| RU04-E10 | pro counter | `проф. турниры: {used} / {limit}` |
| RU04-E11 | junior counter | `юниорские турниры: {used} / {limit}` |

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
| RU04-W11 | `Cancel` | `Отменить` |
| RU04-W12 | `School owns this week.` | `Эта неделя принадлежит школе.` |
| RU04-W13 | open-but-unscheduled note | `Ей также доступны: {tiers}. В ближайшие {weeks} их нет в календаре. Это не блокировка – просто такие турниры проходят реже.` |
| RU04-W14 | stacked-week note | `На одной неделе теперь может быть несколько турниров. Сыграть можно только один – выбирать вам.` |

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
| RU04-F03 | visible `vs` | `–` |
| RU04-F04 | `No points, no money – a hit-out` | `Без очков и призовых – просто сыграть` |
| RU04-F05 | `Play match` | `Сыграть матч` |
| RU04-F06 | seed field label | `Ключ матча` |
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
| 0 | `Champion` | `Победительница` |
| 1 | `Runner-up` | `Финалистка` |
| 2 | `Semifinalist` | `Полуфиналистка` |
| 3 | `Quarterfinalist` | `Четвертьфиналистка` |
| 4+ | `Round of {2^finish}` | `Выбыла в {localized stage}` |

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
| RU04-T06 | fact | `Winner` | `Победительнице` |
| RU04-T07 | fact | `Spectators` | `Зрители` |
| RU04-T08 | winner cheque title | `The winner's cheque at this tier` | `Приз победительнице на этом уровне` |
| RU04-T09 | junior zero-prize title | `The junior tour pays no prize money at any level` | `На юниорском туре призовых нет ни на одном уровне` |
| RU04-T10 | student zero-points title | `A student field awards no ranking points` | `Студенческий турнир не даёт рейтинговых очков` |
| RU04-T11 | crowd title | `About {n} people around the courts – atmosphere, not a factor in play` | `Около {people} у кортов – это атмосфера, а не фактор матча` |
| RU04-T12 | draw size | `{n}-player draw` | `Сетка на {players}` |
| RU04-T13 | age | `Age {n}` | `{age}` |
| RU04-T14 | versus, visible | `VS` / `vs` | `–` |
| RU04-T15 | versus, accessible | `{a} vs {b}` | `{a} против {b}` |
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
| RU04-T19 | fit | `The court suits her game.` | `Это покрытие подходит под её игру.` |
| RU04-T20 | mismatch | `The court is not her surface.` | `Это не её покрытие.` |
| RU04-T21 | title price | `{n} wins for the title.` | `До титула – {wins}.` |
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
| RU04-T35 | `Skip` | `Пропустить` |
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
| RU04-T39 | result pair | `{kid} vs {opponent}` | `{kid} – {opponent}` |
| RU04-T40 | `Aces` | `Эйсы` |
| RU04-T41 | `Double faults` | `Двойные ошибки` |
| RU04-T42 | `Winners` | `Виннеры` |
| RU04-T43 | `Unforced errors` | `Невынужденные ошибки` |
| RU04-T44 | `Max serve` | `Макс. скорость подачи` |
| RU04-T45 | `km/h` | `км/ч` |
| RU04-T46 | metadata | `Avg rally {n} shots · ~{duration}` | `В среднем {shots} за розыгрыш · около {duration}` |
| RU04-T47 | `Watch again` | `Посмотреть ещё раз` |
| RU04-T48 | `Next` | `Дальше` |
| RU04-T49 | viewer proceed | `To the result` | `К результату` |

`Виннеры` is established Russian tennis language and avoids the ambiguous `победные удары`.
`{shots}` is a locale-formatted decimal phrase such as `3,4 удара`; the decimal separator changes
to a comma. Match duration needs a semantic duration formatter (`1 ч 24 мин`), not localization of
an already assembled English value. Ranking caption after the player pair uses exactly the ladder
label from section 2, with no extra `рейтинг`: `· Международный рейтинг`.

## 17. Watching after her exit

| id | English | Russian |
| --- | --- | --- |
| RU04-T50 | `{kid} – {finish}` | `{kid} – {finish sentence}` |
| RU04-T51 | `She's out – see how the draw finishes.` | `Она выбыла – посмотрим, чем закончится сетка.` |
| RU04-T52 | `Next round` | `Следующий раунд` |
| RU04-T53 | `Continue` | `Продолжить` |

The first line needs the sentence projection described in section 12: `Аня – выбыла в четвертьфинале`,
not `Аня – четвертьфиналистка`. The latter reads like an accolade while the screen is following the
rest of the field.

## 18. Finale posters

| id | surface | English | Russian |
| --- | --- | --- | --- |
| RU04-T54 | champion status | `Champion` | `Победительница` |
| RU04-T55 | runner-up status | `Runner-up` | `Финалистка` |
| RU04-T56 | champion line | `def. {opponent} in the Final` | `Обыграла {opponent} в финале` |
| RU04-T57 | runner-up line | `lost to {opponent} in the Final` | `Уступила {opponent} в финале` |
| RU04-T58 | points | `+{n} pts` | `+{points}` |
| RU04-T59 | path win | `def. {opponent}` | `обыграла {opponent}` |
| RU04-T60 | path loss | `lost to {opponent}` | `уступила {opponent}` |
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
