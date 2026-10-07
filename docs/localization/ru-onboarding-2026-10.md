---
type: corpus
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-01
---

# RU-02A – entry, career wizard and interface tour

This batch covers the route into a career after the splash and the coach-mark tour shown after
creation. The childhood prologue is deliberately the next document: it is a narrative corpus with
ages, voices and dynasty branches, and folding it into this interface table would make both reviews
harder.

Every Russian line below is `DRAFT` unless its note says `APPROVED`. The owner has ruled that the
finished Russian mode may not show English islands. Product marks, tier codes and personal names are
not translation failures; an untranslated accessible label, country name or saved story line is.

## 1. Splash

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-S01 | `src/components/SplashScreen.vue:30` | `Tap to start` | `Нажмите, чтобы начать` | accessible name; must match the visible instruction |
| RU02A-S02 | `src/components/SplashScreen.vue:39` | `Tap to start` | `Нажмите, чтобы начать` | works for touch, mouse and keyboard without naming one device |
| RU02A-S03 | `src/components/SplashScreen.vue:35` | `Ties Break` | `Ties Break` | `APPROVED` product mark |
| RU02A-S04 | `src/components/SplashScreen.vue:36` | `Ace Parent` | `Ace Parent` | `APPROVED` product mark |

## 2. Wizard progress, headings and opening

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-H01 | `OnboardingWizard.vue:364` | `Step {step} of {count}` | `Шаг {step} из {count}` | accessible progress label |
| RU02A-H02 | `OnboardingWizard.vue:379` | `Raise a Champion. Together.` | `Воспитать чемпионку. Вместе.` | keeps the two-beat hero line; heroine is feminine |
| RU02A-H03 | `OnboardingWizard.vue:198` | `Raise a Champion` | `Воспитать чемпионку` | hidden by the custom first-step heading today, but still a catalogue unit |
| RU02A-H04 | `OnboardingWizard.vue:199` | `Who Is Your Player?` | `Кто она?` | the step asks identity, not ability |
| RU02A-H05 | `OnboardingWizard.vue:199` | `Let's start with who she is.` | `Сначала – самое главное о ней.` | avoids imported English syntax |
| RU02A-H06 | `OnboardingWizard.vue:200` | `Where Are You Starting?` | `Откуда начинается её путь?` | country is origin, not the player's current location |
| RU02A-H07 | `OnboardingWizard.vue:200` | `Select your country.` | `Выберите страну.` | direct imperative; address choice does not change its form |
| RU02A-H08 | `OnboardingWizard.vue:201` | `Family Setup` | `Семья и поддержка` | names the two decisions on the screen |
| RU02A-H09 | `OnboardingWizard.vue:201` | `Your resources and support shape the path.` | `Возможности семьи и поддержка определяют её путь.` | no promise of success |
| RU02A-H10 | `OnboardingWizard.vue:202` | `Choose Play Style` | `Выберите стиль игры` | tennis term, not visual style |
| RU02A-H11 | `OnboardingWizard.vue:202` | `This shapes strengths and training focus.` | `От него зависят сильные стороны и направление тренировок.` | states the mechanical consequence |
| RU02A-H12 | `OnboardingWizard.vue:203` | `All Set!` | `Всё готово` | owner-approved `ё` rule applied |
| RU02A-H13 | `OnboardingWizard.vue:203` | `Here she is. The rest is the two of you.` | `Вот она. Дальше – вы вдвоём.` | warm without promising an outcome; `вы` is owner-approved |
| RU02A-H14 | `OnboardingWizard.vue:390` | `You're the parent now – every choice, every dollar, every away tournament is yours to carry.` | `Теперь вы – родитель. Решения, расходы и каждый выездной турнир ложатся на вас.` | product premise; interface `вы` is owner-approved |
| RU02A-H15 | `OnboardingWizard.vue:392` | `Rackets, coaches, flights, hotels – the costs are honest, and they don't wait for a breakthrough.` | `Ракетки, тренеры, перелёты, отели – расходы здесь честные и не ждут первого прорыва.` | keeps the economic warning, not advertising copy |

### Opening promise pool

The English chooses one line once when the wizard opens. Russian must use the same draw and must not
introduce a second random choice.

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02A-P01 | `OnboardingWizard.vue:191` | `The talent is hers. The bills, the drives and the decisions are yours.` | `Талант – её. Счета, поездки и решения – ваши.` |
| RU02A-P02 | `OnboardingWizard.vue:192` | `Your kid can play. What happens next is mostly about you, and it will cost more than you think, sooner than you think.` | `Играть она умеет. Что будет дальше, во многом зависит от вас – и расходы начнутся раньше и окажутся больше, чем кажется.` |
| RU02A-P03 | `OnboardingWizard.vue:193` | `She has something. Whether it becomes anything is a question about your time, your money and your nerve.` | `В ней что-то есть. Станет ли это чем-то большим, зависит от вашего времени, денег и выдержки.` |

## 3. Identity and country

These units live in `src/composables/identityCopy.ts` and are shared with the childhood prologue.
They must remain one semantic declaration in the technical catalogue; the prologue must not receive
a private duplicate.

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-I01 | `identityCopy.ts:45` | `First name` | `Имя` | label and placeholder |
| RU02A-I02 | `identityCopy.ts:46` | `Last name` | `Фамилия` | label and placeholder |
| RU02A-I03 | `OnboardingWizard.vue:409` | `Random first name` | `Выбрать случайное имя` | accessible control name |
| RU02A-I04 | `OnboardingWizard.vue:428` | `Random last name` | `Выбрать случайную фамилию` | accessible control name |
| RU02A-I05 | `OnboardingWizard.vue:448` | `Gender` | `Пол` | current value is fixed, but the label is visible |
| RU02A-I06 | `OnboardingWizard.vue:454` | `Girl` | `Девочка` | creation begins in childhood |
| RU02A-I07 | `OnboardingWizard.vue:460` | `Boy` | `Мальчик` | disabled future route |
| RU02A-I08 | `OnboardingWizard.vue:456` | `The boys' tour is coming later` | `Мужской тур появится позже` | title on disabled choice |
| RU02A-I09 | `identityCopy.ts:48` | `Birthday` | `Дата рождения` | one label for month and day |
| RU02A-I10 | `identityCopy.ts:50` | `Birth month` | `Месяц рождения` | accessible select name |
| RU02A-I11 | `identityCopy.ts:51` | `Birth day` | `День месяца` | avoids colliding with the whole `день рождения` concept |
| RU02A-I12 | `OnboardingWizard.vue:541` | relative-age explanation | `Возрастные группы считают по году рождения. Старшие в группе сильнее сейчас; у младших больше времени для роста и меньше пропусков из-за травм. День нужен, чтобы поздравлять её вовремя.` | preserves both mechanical sides; phone-height LQA required |
| RU02A-I13 | `identityCopy.ts:53` | `Search countries...` | `Поиск страны…` | real ellipsis character |
| RU02A-I14 | `identityCopy.ts:54` | `Search countries` | `Искать страну` | accessible input name |
| RU02A-I15 | `identityCopy.ts:55` | `Popular` | `Популярные` | agrees with omitted `страны` |
| RU02A-I16 | `identityCopy.ts:56` | `Results` | `Результаты` | search results heading |
| RU02A-I17 | `identityCopy.ts:57` | `All countries` | `Все страны` | heading |
| RU02A-I18 | `identityCopy.ts:58` | `Browse all countries` | `Показать все страны` | action, not a second heading |
| RU02A-I19 | `identityCopy.ts:59` | `No country matches that.` | `Такой страны в списке нет.` | says the limitation honestly |

### Months and dates

The month picker needs nominative month names, but a displayed date needs the genitive. One shared
English array cannot be interpolated into both Russian shapes.

| use | Russian |
| --- | --- |
| standalone picker | `Январь`, `Февраль`, `Март`, `Апрель`, `Май`, `Июнь`, `Июль`, `Август`, `Сентябрь`, `Октябрь`, `Ноябрь`, `Декабрь` |
| full date | `{day} января`, `{day} февраля`, `{day} марта`, `{day} апреля`, `{day} мая`, `{day} июня`, `{day} июля`, `{day} августа`, `{day} сентября`, `{day} октября`, `{day} ноября`, `{day} декабря` |

Technical requirement: replace the current `` `${MONTHS[month - 1]} ${day}` `` composition at
`OnboardingWizard.vue:274`, `:508` and `:525` with a locale-aware date label. Do not build Russian
dates by reordering a localized picker array.

### Country names

`COUNTRY_NAMES` is presentation data, not a save value. Search, tiles, summaries and later profile
surfaces must all read the localized name map while the stored two-letter code remains unchanged.

| code | English | Russian | code | English | Russian |
| --- | --- | --- | --- | --- | --- |
| US | United States | США | GB | United Kingdom | Великобритания |
| FR | France | Франция | ES | Spain | Испания |
| IT | Italy | Италия | DE | Germany | Германия |
| RU | Russia | Россия | RS | Serbia | Сербия |
| CH | Switzerland | Швейцария | CZ | Czechia | Чехия |
| PL | Poland | Польша | UA | Ukraine | Украина |
| KZ | Kazakhstan | Казахстан | BY | Belarus | Беларусь |
| AU | Australia | Австралия | JP | Japan | Япония |
| CN | China | Китай | KR | South Korea | Южная Корея |
| IN | India | Индия | BR | Brazil | Бразилия |
| AR | Argentina | Аргентина | CA | Canada | Канада |
| NL | Netherlands | Нидерланды | SE | Sweden | Швеция |

Search should match Russian names and two-letter codes in Russian mode. Matching English names as
an additional invisible alias is harmless, but showing them as fallback labels is not.

## 4. Dynasty identity copy

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-D01 | `identityCopy.ts:72` | `She is born into her mother's family and carries her name.` | `Она родилась в семье матери и носит её фамилию.` | explains the locked surname |
| RU02A-D02 | `identityCopy.ts:75` | `Her birthday is a matter of record.` | `Её дата рождения уже записана.` | plain fact, not bureaucratic voice |
| RU02A-D03 | `identityCopy.ts:78` | `More than one daughter grew up here. Whose story is this?` | `В этой семье выросло несколько дочерей. Чью историю продолжить?` | the choice continues a dynasty rather than identifying a record |
| RU02A-D04 | `identityCopy.ts:81` | `The means she starts with are her mother's story, not a choice.` | `Её стартовые возможности определила история матери – здесь это не выбор.` | family-background controls are absent |

## 5. Family resources and coaching

The Russian labels describe the playable economic condition rather than importing English social
class names literally. The IDs and budgets do not change.

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-F01 | `OnboardingWizard.vue:598,611` | `Family background` | `Условия семьи` | visible heading and accessible group name |
| RU02A-F02 | `OnboardingWizard.vue:70` | `Wealthy` | `Обеспеченная семья` | `APPROVED` 07.10 (spec §9.9b; `docs/decisions.md`) · `wealthy` ID stays unchanged |
| RU02A-F03 | `OnboardingWizard.vue:70` | `Top academies are within reach.` | `Лучшие академии по карману.` | names the actual advantage |
| RU02A-F04 | `OnboardingWizard.vue:71` | `Middle class` | `Средний достаток` | `APPROVED` 07.10 (spec §9.9b; `docs/decisions.md`) · compact card label |
| RU02A-F05 | `OnboardingWizard.vue:71` | `Smart choices, steady progress.` | `Придётся считать расходы и выбирать.` | avoids promising steady success |
| RU02A-F06 | `OnboardingWizard.vue:72` | `Working class` | `Скромный бюджет` | `APPROVED` 07.10 (spec §9.9b; `docs/decisions.md`) · names the gameplay condition without a clumsy class label |
| RU02A-F07 | `OnboardingWizard.vue:72` | `Big dreams, hard mode.` | `Мечта та же, путь гораздо труднее.` | warm, but honest about difficulty |
| RU02A-F08 | `OnboardingWizard.vue:638` | `{budget} starting budget` | `Стартовый бюджет – {budget}` | do not append an inflected fragment after the number |
| RU02A-F09 | `OnboardingWizard.vue:647,648` | `Coaching` | `Тренер` | screen section and accessible group name |
| RU02A-F10 | `OnboardingWizard.vue:99` | `Coach yourself` | `Тренировать её самостоятельно` | the parent, not the girl, is the coach |
| RU02A-F11 | `OnboardingWizard.vue:99` | `Cheaper now, training unlocks later.` | `Сейчас дешевле, новые тренировки откроются позже.` | states the unlock consequence |
| RU02A-F12 | `OnboardingWizard.vue:100` | `Hire a coach` | `Нанять тренера` | action label |
| RU02A-F13 | `OnboardingWizard.vue:100` | `Pro guidance, and a real weekly bill.` | `Профессиональная работа – и еженедельная оплата.` | cost remains explicit |

## 6. Play styles

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02A-T01 | `OnboardingWizard.vue:674` | `Play style` | `Стиль игры` |
| RU02A-T02 | `OnboardingWizard.vue:135` | `Aggressive baseliner` | `Атакующая игра с задней линии` |
| RU02A-T03 | `OnboardingWizard.vue:136` | `Dictate with heavy groundstrokes.` | `Диктует игру мощными ударами с отскока.` |
| RU02A-T04 | `OnboardingWizard.vue:137` | `Power` / `Consistency` | `Мощь` / `Стабильность` |
| RU02A-T05 | `OnboardingWizard.vue:142` | `Counterpuncher` | `Контратакующая игра` |
| RU02A-T06 | `OnboardingWizard.vue:143` | `Speed, defense, and endless patience.` | `Скорость, защита и бесконечное терпение.` |
| RU02A-T07 | `OnboardingWizard.vue:144` | `Defense` / `Stamina` | `Защита` / `Выносливость` |
| RU02A-T08 | `OnboardingWizard.vue:149` | `Big serve` | `Мощная подача` |
| RU02A-T09 | `OnboardingWizard.vue:150` | `Free points first.` | `Сначала – лёгкие очки на подаче.` |
| RU02A-T10 | `OnboardingWizard.vue:151` | `Serve` / `Power` | `Подача` / `Мощь` |
| RU02A-T11 | `OnboardingWizard.vue:156` | `All-court` | `Игра по всему корту` |
| RU02A-T12 | `OnboardingWizard.vue:157` | `No weaknesses, no shortcuts.` | `Без явных слабостей, но и без коротких путей.` |
| RU02A-T13 | `OnboardingWizard.vue:158` | `Versatility` / `Balance` | `Универсальность` / `Баланс` |

## 7. Summary and the weight switch

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-C01 | `OnboardingWizard.vue:707` | `Your champion, on the day she first walks into the club` | `Её первый день в клубе` | removes an outcome promise the simulation may not keep |
| RU02A-C02 | `OnboardingWizard.vue:716` | `Name` | `Имя` | summary term |
| RU02A-C03 | `OnboardingWizard.vue:723` | `Country` | `Страна` | summary term |
| RU02A-C04 | `OnboardingWizard.vue:730` | `Birth month` | `Дата рождения` | value includes month and day |
| RU02A-C05 | `OnboardingWizard.vue:738` | `Background` | `Условия семьи` | matches section heading |
| RU02A-C06 | `OnboardingWizard.vue:745` | `Coaching` | `Тренер` | matches section heading |
| RU02A-C07 | `OnboardingWizard.vue:752` | `Play style` | `Стиль игры` | matches section heading |
| RU02A-C08 | `OnboardingWizard.vue:787` | `Every practice. Every match. Every choice. You've got this.` | `Каждая тренировка. Каждый матч. Каждое решение – вместе.` | warm without guaranteeing success |

The weight copy is shared by the wizard, prologue and settings. Its localization remains one unit.

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02A-W01 | `identityCopy.ts:104` | `The weight` | `Тяжёлые темы` | describes the setting rather than translating the metaphor mechanically |
| RU02A-W02 | `identityCopy.ts:107` | pregnancy and bereavement lead | `В некоторых историях встречаются прервавшаяся беременность или смерть в семье. Мы пишем об этом бережно, но эти события можно исключить.` | names both themes without previewing scenes or frequency |
| RU02A-W03 | `identityCopy.ts:111` | `Include them` | `Включить` | no option is framed as correct |
| RU02A-W04 | `identityCopy.ts:112` | `Leave them out` | `Не включать` | neutral counterpart |
| RU02A-W05 | `identityCopy.ts:115` | change-later note | `Этот выбор можно изменить позже в разделе «Ещё». Отключение остановит только будущие события и не сотрёт уже случившееся.` | `Ещё` is still a draft navigation term |
| RU02A-W06 | `identityCopy.ts:117` | `The weight` | `Тяжёлые темы` | accessible group name |
| RU02A-W07 | `identityCopy.ts:121` | settings hint | `Выключено: новых сюжетов о прервавшейся беременности или смерти в семье не будет. Уже случившееся останется в истории.` | settings surface; included here because the source is shared |

## 8. Wizard controls

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02A-A01 | `OnboardingWizard.vue:811` | `Begin` | `Начать` |
| RU02A-A02 | `OnboardingWizard.vue:813` | `Skip for now` | `Пока пропустить` |
| RU02A-A03 | `OnboardingWizard.vue:824,831` | `Back` | `Назад` |
| RU02A-A04 | `OnboardingWizard.vue:826` | `Start career` | `Начать карьеру` |
| RU02A-A05 | `OnboardingWizard.vue:833` | `Next` | `Далее` |

## 9. Interface tour

The tour must teach the Russian labels actually visible underneath it. `Дом` and `Рейтинг` are
owner-approved and therefore appear here as settled terminology.

| id | source | English title | Russian title | Russian text |
| --- | --- | --- | --- | --- |
| RU02A-O01 | `OnboardingTour.vue:96` | `You are the parent` | `Вы – родитель` | `Матчи играет она, а вы помогаете ей расти. На экране «Дом» – её неделя, фотография и главное о том, как у неё дела.` |
| RU02A-O02 | `OnboardingTour.vue:102` | `Her page` | `Её профиль` | `Нажмите на фотографию, чтобы открыть полный профиль: навыки, физическую форму, школу и тренера.` |
| RU02A-O03 | `OnboardingTour.vue:108` | `News and letters` | `Новости и письма` | `Колокольчик показывает новости прошедшей недели. В конверте – предложения и письма; точка означает, что одно из них ждёт ответа.` |
| RU02A-O04 | `OnboardingTour.vue:114` | `The money is yours` | `Семейный бюджет` | `Заявки, поездки, тренер и экипировка оплачиваются из семейного бюджета. Нажмите на карточку, чтобы увидеть расходы.` |
| RU02A-O05 | `OnboardingTour.vue:120` | `This week` | `Эта неделя` | `Нажмите на карточку турнира, чтобы выбрать план тренировок на следующую неделю и прочитать итоги предыдущей.` |
| RU02A-O06 | `OnboardingTour.vue:126` | `Season – where you enter` | `Сезон – заявки на турниры` | `На вкладке «Сезон» видны доступные по рейтингу турниры, их стоимость и положение в таблице.` |
| RU02A-O07 | `OnboardingTour.vue:132` | `Calendar` | `Календарь` | `Весь её год по неделям: заявки на турниры, школьные экзамены, каникулы и отдых.` |
| RU02A-O08 | `OnboardingTour.vue:138` | `Stats` | `Рейтинг` | `Здесь видно главное на длинной дистанции: как с начала карьеры менялись её рейтинг и навыки.` |
| RU02A-O09 | `OnboardingTour.vue:144` | `Trophies` | `Трофеи` | `Здесь остаётся каждый выигранный титул и сезон, в котором она его завоевала.` |
| RU02A-O10 | `OnboardingTour.vue:150` | `Settings` | `Настройки` | `За шестерёнкой – звук, анимация, сохранения и карьеры. Здесь же можно снова открыть это обучение.` |
| RU02A-O11 | `OnboardingTour.vue:156` | `Now play a week` | `Теперь – сыграть неделю` | `Кнопка проводит одну неделю и показывает, что в ней произошло. План, заявка, игра – и следующая неделя.` |

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02A-O12 | `OnboardingTour.vue:262` | `Skip tour` | `Пропустить обучение` |
| RU02A-O13 | `OnboardingTour.vue:263` | `Next` | `Далее` |
| RU02A-O14 | `OnboardingTour.vue:263` | `Got it` | `Понятно` |

## 10. Technical and LQA consequences

1. Localize by semantic unit, not by replacing English literals. Shared `IDENTITY_COPY`,
   `DYNASTY_COPY` and `WEIGHT_COPY` prove that the same words appear on several routes.
2. `COUNTRY_NAMES`, month names and the derived date label must become locale-aware presentation
   data. Codes, profile IDs and saved dates remain language-neutral.
3. Russian date morphology needs separate standalone and contextual month forms. A reordered English
   template is not sufficient.
4. The opening promise draw must happen exactly once as it does now. Locale selection must not
   consume RNG or change which semantic promise was selected.
5. All visible copy and accessible names on each step switch together. A Russian card with an English
   `aria-label` fails the no-mixed-language ruling.
6. Measure at 375 px and with text zoom: the family labels, play-style labels, weight lead, tour cards
   and `Начать карьеру` are the likely pressure points.
7. The owner confirmed that the splash logo is the English product mark. This is not permission for
   any other English fallback.

## 11. Owner reads still needed

Read the three economic labels together: `Обеспеченная семья` / `Средний достаток` / `Скромный
   бюджет`. They are intentionally about playable means, not a literal Russian class taxonomy.
