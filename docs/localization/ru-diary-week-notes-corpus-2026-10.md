---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# RU-09D – Weekly voice-note corpus

## 1. Shape

The corpus is a compile-time cross: four voices × (eight moments × four life stages + school exams
+ birthdays at both roof stages + off-season at both away stages) = 148 lines. Russian mirrors the
same rectangle. Missing cells must fail catalogue construction; locale cannot fall back to another
voice or stage.

All lines are `DRAFT`. This pass completes all four core voices: 148 of 148 cells. The remaining
work in `weekNotes.ts` is the aftermath/special-state layer and the older flat note pool; those are
tracked separately below rather than being mistaken for holes in this matrix.

## 2. Sunny voice – rectangular moments

| moment | school | after-school | college | independent |
| --- | --- | --- | --- | --- |
| grind | `Она сказала за ужином: «Тяжёлая неделя, хорошая неделя. Я бы повторила».` | `После ужина она подвела итог: «Тяжёлая работа, все шесть дней. Оно того стоило».` | `Позвонила между парами: «Тяжёлая неделя – из хороших. Я бы повторила».` | `После темноты оставила голосовое: «Шесть дней без остановки. Я бы взяла ещё».` |
| light | `За завтраком она уже всё решила: «Два свободных утра – и оба мои».` | `Между турнирами заняла диван: «Два утра без дел. Я их заслужила».` | `Посреди недели написала: «Два свободных утра. Одно я проспала целиком».` | `Прислала фотографию кофе: «Два чистых утра – и оба мои».` |
| fresh body | `Выпрыгнула к машине: «На этой неделе мне хорошо. По-настоящему».` | `Всю неделю вставала первой, без будильника: «Я сильная. Вся целиком».` | `Перед тренировкой оставила голосовое: «Сегодня всё хорошо. Совсем всё».` | `Написала в семейный чат: «На этой неделе тело на всё отвечает: да».` |
| vacation | `Всё утро не уходила из-за стола: «Неделя отдыха – и я возьму её целиком».` | `В календаре освободилась неделя. «Отдых. Настоящий. На всю неделю».` | `Прислала фотографию и одну строку: «Неделя без всего. Мне это нужно».` | `Ответила через несколько дней: «Целая неделя отдыха – и вся моя».` |
| resting knock | `Оставила ракетку у двери: «На этой неделе берегу себя, и всё нормально».` | `Дома берегла ушиб. «На этой неделе отдыхаю. Меня это устраивает».` | `Позвонила раньше, чем мы успели разволноваться: «Отдыхаю как следует, обещаю».` | `Переслала облегчённый план: «Неделя отдыха – и снова в дело».` |
| pushing knock | `За ужином сама показала: «Всю неделю держалось. Я была осторожна».` | `Посреди сезона отмахнулась от тревоги: «Держится. Я с этим осторожна».` | `После тренировки написала: «Всю неделю держалось. Всё хорошо».` | `После занятия оставила голосовое: «Держится. Я не рисковала».` |
| injured | `К вечеру план восстановления висел на холодильнике: «Скажи, с чего начинать».` | `Вечером проговорила всё по порядку: «Теперь восстановление. С чего начать?»` | `Позвонила с новостями: «Теперь восстановление. Скажи, что сначала».` | `Написала, когда всё стало ясно: «Значит, восстановление. Что сначала?»` |
| tired | `Ушла наверх ещё до десерта: «Эта неделя меня выжала».` | `Дома легла раньше обычного: «Вся эта неделя меня опустошила».` | `Написала и замолчала: «Сегодня во мне ничего не осталось. Сначала сон».` | `Ответила через несколько дней: «Потратила всё. Скоро вернусь к себе».` |

`Ушиб` in the resting-knock frame is the diary's generic minor knock, not a medical diagnosis or a
localized body-part name. If the shared glossary chooses `повреждение`, update all four cells as one
term.

## 3. Sunny voice – scoped moments

| moment/stage | Russian draft |
| --- | --- |
| exams, school | `Она превратила неделю в расписание: «Сначала экзамены, потом корт. Именно так».` |
| birthday, school | `{N} сегодня. «Оставь мне угловой кусок», – сказала она за столом.` |
| birthday, after-school | `{N} сегодня. Она собрала всю семью: «Давайте по-крупному».` |
| off-season, college | `Позвонила утром в будний день: «Матчей пока не будет. Я рада перерыву».` |
| off-season, independent | `Пришла и заняла кухню: «Матчей пока нет. Я беру этот перерыв себе».` |

## 4. Parity rules

- Frames and quotations remain one authored line; punctuation uses Russian quotation marks and the
  project dash.
- A stage changes only the observable channel: shared room, campus call/message or independent
  contact. It does not change the underlying moment or temperament.
- The quoted daughter uses intimate family language where a second person appears. Narration stays
  the parent's third person.
- The same voice/moment/stage cell index is selected in English and Russian with no additional draw.

## 5. Fiery voice – rectangular moments

| moment | school | after-school | college | independent |
| --- | --- | --- | --- | --- |
| grind | `За ужином она всё ещё была в форме: «Шесть дней, а я ещё не закончила!»` | `Влетела домой после последнего занятия: «Лучшая тренировочная неделя сезона!»` | `После тренировки оставила голосовое: «Шесть дней. Я не сбавляю!»` | `Написала в полночь: «Весь блок на пределе. Вот как мне нравится!»` |
| light | `На второй свободный день заскучала: «Два утра без дел? Буду тренироваться!»` | `К понедельнику она распланировала всю неделю: «Свободное время? Я не умею!»` | `Написала из кампуса: «Лёгкая неделя? Я всё равно нашла корт!»` | `На рассвете оставила голосовое: «Выходной? Я на стену лезу!»` |
| fresh body | `Не хотела уходить с корта: «Сегодня всё работает! Всё!»` | `Добавила сеты, которых никто не просил: «Меня не остановить. Всё работает!»` | `Прислала фотографию корта: «Всё работает! Только не сглазьте!»` | `Позвонила посреди занятия, запыхавшись: «Сегодня я лечу. Ничего не болит!»` |
| vacation | `На второй день уже отбивала мяч от стены: «Я отдыхаю! Видишь? Отдыхаю!»` | `Без тренировок выдержала три дня. «Целая неделя отдыха? Пытка!»` | `Бросила в семейный чат: «Неделя без тенниса, и я уже схожу с ума!»` | `Написала на второй день: «Отдых? Я не знаю, что с ним делать!»` |
| resting knock | `Дважды в день просилась на корт: «Отдыхает больное место, не я! Пусти играть!»` | `Вслух считала дни без корта: «Дольше недели сидеть не буду!»` | `Переслала пустой план недели: «Семь дней. Потом я снова на корте!»` | `Ответила через день: «Отдыхает одна часть меня. Остальные – нет!»` |
| pushing knock | `Всю неделю играла через боль: «Выдержало! Я же говорила!»` | `Протянула на этом всю неделю: «Выдержало! Я была осторожна. Почти!»` | `Ответила через несколько дней: «Всю неделю выдержало! Завтра на корт!»` | `Написала в семейный чат: «Выдержало. Я и не сомневалась!»` |
| injured | `За ужином спорила с диагнозом: «Есть путь быстрее. Найди его!»` | `Не поверила срокам: «Вернусь раньше, чем говорят. Вот увидишь!»` | `Вернулась из клиники, сжав челюсть: «Ладно. Новый план. Смотри».` | `Позвонила прямо из клиники: «Всё плохо. Но вернусь быстро!»` |
| tired | `Сумка осталась там, где она её бросила. «Пусто», – сказала она.` | `Еле добралась до стола. «Всё, кончилась», – сказала она.` | `После темноты оставила голосовое: «Выжата. Поговорим завтра».` | `Написала через несколько часов: «Всё потратила. Завтра поговорим».` |

`Больное место` is deliberately generic: the knock packet does not carry a safe Russian noun in
this table. `Играла через боль` follows the source's explicit pushing choice; it is not advice.

## 6. Fiery voice – scoped moments

| moment/stage | Russian draft |
| --- | --- |
| exams, school | `Сложила учебники туда, где обычно лежат ракетки: «Один час на корте. Один!»` |
| birthday, school | `{N} сегодня. Весь день носилась: «Сначала торт! Вопросы потом!»` |
| birthday, after-school | `{N} сегодня. К завтраку весь день уже был размечен: «Гуляем по-крупному!»` |
| off-season, college | `В середине декабря написала: «Межсезонье, а мне уже не терпится играть!»` |
| off-season, independent | `Прислала фотографию и строку: «Уже межсезонье. Дай мне сетку!»` |

## 7. Quiet voice – rectangular moments

| moment | school | after-school | college | independent |
| --- | --- | --- | --- | --- |
| grind | `«Шесть дней на корте», – сказала она и спросила, что на ужин.` | `Оставила сумку у двери. «Тяжёлая неделя. Всё сделано».` | `Переслала план тренировок из кампуса. «Всё сделано. До конца».` | `Написала после последнего занятия: «Неделя закончена. В понедельник снова».` |
| light | `«Два свободных утра», – сказала она и всю дорогу читала.` | `Лёгкая неделя в сезоне. «Оба утра оставила себе», – сказала и отоспалась.` | `Прислала фотографию кампуса и одну строку: «Здесь тихая неделя».` | `Вечером оставила голосовое: «Тихая неделя. Наконец выспалась».` |
| fresh body | `Первой вышла на корт и ушла последней. «На этой неделе тело готово».` | `Вернулась с корта всё ещё свежей. «Ничего не ноет. К серии готова».` | `Написала с кортов в кампусе: «Ничего не беспокоит. Отработала всё».` | `Позвонила после первого занятия: «Ноги снова держат».` |
| vacation | `Целая неделя без тенниса. «Ракетка остаётся дома», – сказала она.` | `Между блоками отложила эту неделю в сторону. «На этот раз отдых значит отдых».` | `В семейный чат отправила одну строку: «На этой неделе перерыв. Читаю».` | `Ответила через два дня: «У меня перерыв. Ничего не планирую».` |
| resting knock | `«Корт подождёт», – сказала она и вытянула ноги.` | `Убрала из недели все занятия. «Одна неделя отдыха не отнимет сезон».` | `Переслала облегчённый план недели. «Даю повреждению отдохнуть. Скоро вернусь».` | `Написала посреди недели: «На этой неделе его не трогаю. В календаре пусто».` |
| pushing knock | `«Терпимо», – сказала она и перед выходом замотала больное место.` | `Каждое утро сама накладывала тейп. «Держится. Ни одного занятия не пропустила».` | `Под фотографией корта оставила одну строку: «Замотала, играю дальше».` | `После тренировки оставила голосовое: «Повязка выдержала. Неделю отыграла».` |
| injured | `«Когда начинается восстановление?» – спросила она, уже занося его в календарь.` | `Прикрепила план восстановления рядом с календарём. «Что сначала и когда?»` | `Позвонила домой с диагнозом. «Восстановление расписано. Буду идти по плану».` | `Переслала график восстановления. «Вот план. Я уже начала».` |
| tired | `«Просто устала», – сказала она и позволила другому поставить чайник.` | `Половина ужина осталась на тарелке. «Выдохлась. Лягу пораньше», – сказала она.` | `Около полуночи написала: «Сил мало. На этой неделе ложусь раньше».` | `Ответила через несколько дней: «Выжата. Отсыпаюсь всю неделю».` |

`Повреждение`, `больное место`, `его` and `повязка` deliberately avoid inventing an injured body
part. They should be revised as one lexical family if runtime later supplies a safe localized noun.
The independent resting cell's pronoun refers to the already-known knock in the diary packet, not
to an unnamed person.

## 8. Quiet voice – scoped moments

| moment/stage | Russian draft |
| --- | --- |
| exams, school | `Всю неделю допоздна горела настольная лампа. «С работами всё по плану».` |
| birthday, school | `{N} сегодня. «Можно без шума?» – спросила она.` |
| birthday, after-school | `{N} сегодня. «Ужина дома вполне хватит», – сказала она, накрывая на стол.` |
| off-season, college | `В семейном чате появилась одна строка: «Сезон закончился. Теперь отдыхаю».` |
| off-season, independent | `Пришла с пустыми руками. «До нового года теперь тихо».` |

## 9. Deep voice – rectangular moments

| moment | school | after-school | college | independent |
| --- | --- | --- | --- | --- |
| grind | `Сказала уже в машине, когда двигатель был выключен: «Много. Но я этого хотела».` | `Вернулась поздно и сказала с лестницы: «Сезон берёт своё».` | `Позвонила после недели. «Было тяжело. И я рада, что так».` | `Ответила через несколько дней: «Работа требует многого. Я говорю ей да».` |
| light | `Сказала в дверях, ещё не войдя до конца: «Воскресенье было моим».` | `Сказала поздно, когда дом уже спал: «Эту неделю я вернула себе».` | `Ответила через два дня: «В пустых днях и был смысл».` | `Позвонила поздно. «Я позволила неделе затихнуть. Я это заслужила».` |
| fresh body | `«Готова», – сказала она перед первым мячом. Так и выглядела.` | `«Я забыла, что бывает так». Она сказала это поздно вечером в воскресенье.` | `В полночь написала: «Я снова чувствую своё тело. Скучала по этому».` | `Поздно оставила голосовое: «Тело как новое. Теперь такое редко».` |
| vacation | `Сказала в последний вечер: «Я снова чувствую себя собой».` | `Сказала в конце недели: «Мне нужно было остановиться. Не знала, как сильно».` | `Позвонила в конце, не во время. «Помогло. Не думала, что поможет».` | `Ответила к концу недели: «Я остановилась. Уже забыла, как это».` |
| resting knock | `Сказала с дивана: «Пусть подождёт. Я тоже подожду».` | `Сказала в начале и не отступила: «Пропуск – тоже цена. Я её заплачу».` | `Поздно оставила голосовое: «Повреждению – неделя. Мне – терпение».` | `Позвонила поздно вечером: «Либо оно отдыхает, либо потом я потеряю больше».` |
| pushing knock | `Сказала один раз, в понедельник, и ушла тренироваться: «Держится».` | `Сказала, ещё не сняв форму: «Держится. Я не стану из-за этого останавливаться».` | `Ответила через день: «Держится. Больше ничего обещать не буду».` | `Написала за полночь: «Держится. Я знаю, чем рискую».` |
| injured | `«Надолго?» – спросила она за кухонным столом.` | `Дождалась, пока все соберутся. «Что есть, то есть. Буду делать всё, что нужно».` | `Сама позвонила с диагнозом. «Это всерьёз. Притворяться не буду».` | `Ответила на день позже: «Вот цена этой работы. Я её знала».` |
| tired | `«Больше ничего». Она сказала это в дверях, уже собираясь уйти.` | `Сказала и сразу ушла наверх. «Сезон забрал всё. Всё».` | `В ту ночь оставила голосовое: «Ничего не осталось. Ещё будет».` | `Написала за полночь: «Сегодня я расплатилась за эту неделю. Силы вернутся».` |

The deep voice can carry a metaphor, but Russian still needs a speakable sentence. `Сезон берёт
своё` and `расплатилась за эту неделю` preserve the source's cost language without translating its
English syntax. `Повреждению – неделя` remains body-part-neutral for the same runtime reason as the
other voices.

## 10. Deep voice – scoped moments

| moment/stage | Russian draft |
| --- | --- |
| exams, school | `Сказала, сдав последнюю работу: «Всё. Хочу обратно на корт».` |
| birthday, school | `{N} сегодня. «Без шума», – сказала она и не спешила к торту.` |
| birthday, after-school | `{N} сегодня. Вернувшись поздно, сказала: «Старше – и дальше по этому пути».` |
| off-season, college | `Уже уходя, сказала: «Сезон закончился. Мне было нужно, чтобы он закончился».` |
| off-season, independent | `Позвонила, когда всё наконец осталось позади. «Пока всё. Спроси меня в январе».` |

## 11. Core-matrix completion ledger

| voice | rectangular cells | scoped cells | total | state |
| --- | ---: | ---: | ---: | --- |
| sunny | 32 | 5 | 37 | drafted |
| fiery | 32 | 5 | 37 | drafted |
| quiet | 32 | 5 | 37 | drafted |
| deep | 32 | 5 | 37 | drafted |
| **total** | **128** | **20** | **148** | **complete as DRAFT** |

This ledger closes only the typed voice cross. It does not claim that all player-facing strings in
`weekNotes.ts` are localized. Motherhood, bereavement, divorce, fork aftermath and the flat legacy
pool remain distinct authored surfaces and must receive their own exact-source inventories.

## 12. Motherhood voice layer – 28 lines

`MotherhoodBand` has seven states, not eight; the separate warm postpartum scene is outside this
typed voice table. The Russian catalogue must preserve that distinction and the same band licence.

| voice | announced | early | mid | last |
| --- | --- | --- | --- | --- |
| sunny | `Пришла, ещё не сняв пальто. «Это хорошая новость».` | `Позвонила за готовкой. «Пока без заявок. А я всё проверяю календарь».` | `Прислала фотографию сумки с формой. «Ещё нет. Просто захотелось посмотреть».` | `После прогулки позвонила: «Сегодня медленно. Очень. Но я всё равно счастлива».` |
| fiery | `Вошла и сразу заговорила. «Всё меняется. Хорошо».` | `На рассвете оставила голосовое: «Никаких заявок. Я тихо сойду с ума».` | `Позвонила, пройдя половину квартала. «Я могу ходить. Вот и хожу».` | `Позвонила поздно. «Отдых, отдых, отдых. Видимо, теперь это вся моя работа».` |
| quiet | `Когда приехала, сказала прямо, а потом спросила, как остальные.` | `Позвонила ненадолго. «Календарь пуст. Странно. Нормально».` | `Позвонила по дороге домой. «Пошла домой длинной дорогой. Всё тихо».` | `Позвонила. «Уже недолго. Я перестала считать вслух».` |
| deep | `Позвонила поздно. «Я хотела сначала убедиться».` | `Позвонила поздно. «Сезон идёт дальше. Меня это тревожит меньше, чем я думала».` | `Позвонила. «Когда-нибудь она спросит. Я не знаю, что отвечу».` | `Позвонила после темноты. «Значит, скоро. Я пока не нашла для этого слов».` |

| voice | birth | postpartum | returned |
| --- | --- | --- | --- |
| sunny | `Позвонила утром. «Мы все здесь. Приходи, когда сможешь».` | `Поздно оставила голосовое: «Я устала. А она, видимо, нет».` | `Позвонила с парковки. «Ноги помнят больше, чем я сама».` |
| fiery | `Позвонила охрипшая. «Ну. Это было что-то. Она здесь».` | `Написала до рассвета: «Снова не спим. Она совсем не уважает расписания».` | `Позвонила с кортов. «Я скучала по этому. Даже бесит».` |
| quiet | `Позвонила один раз, рано. «Она здесь. Позвоню нормально, как смогу».` | `Позвонила, пока дом не проснулся. «В основном спим. Но в основном – она».` | `Позвонила после тренировки. «Сегодня била по мячу. Странно снова это говорить».` |
| deep | `Позвонила. «Она здесь. Я пока не знаю, что чувствую».` | `Позвонила, пока дом спал. «Иногда по утрам я просто сижу с ней».` | `Позвонила с дороги. «Я пока не знаю, какая я теперь на корте. Хочу узнать».` |

`Приходи` is the approved intimate daughter-to-parent `ты`, not system address. `Никаких заявок`
means tournament entries and uses the same term as the season catalogue. `Она` in the birth and
postpartum cells is the newborn; implementation must not extract these quotations from their band
context into a generic pool.

## 13. Bereavement and divorce – four voices each

These are parent-authored weekly observations, not quotations from her. Russian must keep the
source's refusal to name the deceased person, assign blame, describe an unseen home or claim an
interior feeling.

| state | sunny | fiery | quiet | deep |
| --- | --- | --- | --- | --- |
| bereaved | `На этой неделе звонила чаще обычного и говорила о повседневном.` | `Продолжала тренироваться. Никто и не предлагал иначе.` | `У неё было тихо. Чайник кипел часто.` | `Почти ничего не говорила. На корте оставалась дольше, чем было нужно.` |
| divorced | `Звонила о корте, погоде, следующей неделе. О браке – нет.` | `Тренировалась. Когда разговор дошёл до этого, она его оборвала.` | `Прислала даты на следующую неделю. Больше в сообщении ничего не было.` | `Позвонила. Мы говорили о неделе, не о том, что закончилось.` |

The English quiet bereavement line says `at her place`; Russian `У неё было тихо` preserves only
what the authored parent observation claims and does not invent a flat, roommate or address. Both
state windows remain mechanics (`6` and `8` weeks respectively), never numbers printed in the copy.

## 14. Fork aftermath – eight lines

| voice | parent went with her want | parent went against her want |
| --- | --- | --- |
| sunny | `Поблагодарила нас и сменила тему, пока разговор не стал слишком серьёзным.` | `Сказала: «Хорошо», – и спросила о другом.` |
| fiery | `Сказала «да», не дав нам договорить.` | `Сказала: «Ладно». Прозвучало как точка.` |
| quiet | `Записала ответ и спросила, что дальше.` | `Записала ответ. Рядом – ничего.` |
| deep | `Почти ничего не сказала. Мы тоже.` | `Сказала, что понимает. Не сказала, что согласна.` |

The against arm records disagreement without grading the parent or predicting resentment. These
remain occasional diary texture behind the existing week-note gate; translation must not promote
them into guaranteed feedback or imply what the underlying fork was about.

## 15. Special-state completion ledger

| group | source lines | Russian drafts | state |
| --- | ---: | ---: | --- |
| motherhood voices | 28 | 28 | complete as DRAFT |
| bereavement voices | 4 | 4 | complete as DRAFT |
| divorce voices | 4 | 4 | complete as DRAFT |
| fork aftermath | 8 | 8 | complete as DRAFT |
| **total** | **44** | **44** | **complete as DRAFT** |

All Russian player-facing snippets in §§2–14 are at most 80 Unicode characters in their current
template form. This mirrors the scrap's visual-mass constraint; implementation still needs a
rendered narrow-screen check because equal character counts do not imply equal glyph widths.

Next inventory boundary: the `WEEK_NOTES` flat pool after these generated spreads. Count and group
that pool from source before translating; do not infer its size from the historical comment above
it, because later waves may have changed the rows without revising prose.

## 16. Explicit `WEEK_NOTES` inventory

The current source contains **132 explicit `text:` rows** inside `WEEK_NOTES`, excluding generated
spreads. The nearby historical comment still says 113; it is stale evidence, not the translation
target. Exact current grouping:

| group | rows |
| --- | ---: |
| grind | 8 |
| light | 7 |
| ordinary middle | 12 |
| body | 4 |
| money | 2 |
| calendar-owned weeks | 13 |
| knock | 9 |
| birthday | 11 |
| generic layoff | 6 |
| exam inside layoff | 5 |
| body-group layoff | 11 |
| fallible parent | 6 |
| partner known | 5 |
| fresh breakup | 4 |
| spouse spoke | 4 |
| own key | 1 |
| lineage/mother in a new career | 8 |
| shared motherhood | 8 |
| strained/cold flat pool | 8 |
| **total** | **132** |

## 17. Flat pool A – ordinary training weeks (33 lines)

### 17.1 Grind – eight

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F001 | `Six days on court. She ate like someone twice her size.` | `Шесть дней на корте. Ела будто была вдвое крупнее.` |
| RU09D-F002 | `Out before we were up, back after dark. All week.` | `Уходила до нашего подъёма, возвращалась затемно. Всю неделю.` |
| RU09D-F003 | `She fell asleep on the sofa with her shoes on. Twice.` | `Дважды уснула на диване, не сняв обуви.` |
| RU09D-F004 | `Three shirts a day this week. The machine has not stopped.` | `По три футболки в день. Машинка всю неделю не останавливалась.` |
| RU09D-F005 | `She asked for an extra hour on Sunday. We said no. She went anyway.` | `В воскресенье попросила ещё час. Мы отказали. Она всё равно пошла на корт.` |
| RU09D-F006 | `A blister on her serving hand. She taped it and said nothing.` | `Мозоль на руке, которой подаёт. Заклеила и промолчала.` |
| RU09D-F007 | `Three voice notes this week, all sent after dark.` | `За неделю – три голосовых. Все после темноты.` |
| RU09D-F008 | `She asked about Sunday. By the time we replied, she had booked the court.` | `Спросила про воскресенье. Пока мы ответили, уже забронировала корт.` |

F002–F005 retain the source's same-roof licence; F007–F008 remain away-stage contact. Russian must
not flatten them into one stage-neutral pool.

### 17.2 Light – seven

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F009 | `Two mornings off. She spent both of them at the courts anyway.` | `Два свободных утра. Оба всё равно провела на кортах.` |
| RU09D-F010 | `A slow week. She baked something and it was mostly edible.` | `Тихая неделя. Что-то испекла, и это почти можно было есть.` |
| RU09D-F011 | `A light week, and she filled the gaps with things that are not tennis.` | `Лёгкая неделя. Пустоты заполнила чем-то, кроме тенниса.` |
| RU09D-F012 | `She had time to be fifteen this week. It suited her.` | `В эту неделю она успела побыть просто пятнадцатилетней. Ей шло.` |
| RU09D-F013 | `Light week. She and the neighbour argued about a film for an hour.` | `Лёгкая неделя. Целый час спорила о фильме с кем-то по соседству.` |
| RU09D-F014 | `Rest days, and she was restless by the second one.` | `Дни отдыха. На второй она уже не находила себе места.` |
| RU09D-F015 | `A light week. She called before nine, which is how we knew she was bored.` | `В лёгкую неделю позвонила до девяти. Так мы поняли, что ей скучно.` |

### 17.3 The ordinary middle – twelve

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F016 | `Drills, school, dinner, bed. She did not complain once.` | `Упражнения, школа, ужин, сон. Ни одной жалобы.` |
| RU09D-F017 | `Drills, dinner, bed. She did not complain once.` | `Упражнения, ужин, сон. Ни одной жалобы.` |
| RU09D-F018 | `Training, physio, groceries, sleep. Her own little circuit.` | `Тренировка, физиотерапевт, магазин, сон. Её маленький круг.` |
| RU09D-F019 | `Same courts, same hours. She is getting quietly better at this.` | `Те же корты, те же часы. И у неё всё лучше получается.` |
| RU09D-F020 | `She practised her toss against the garage door until it got dark.` | `До темноты отрабатывала подброс у двери гаража.` |
| RU09D-F021 | `A week of nothing much. She read a whole book on the bus.` | `Неделя без особых событий. В автобусе прочитала целую книгу.` |
| RU09D-F022 | `She has started keeping a notebook of what the coach says.` | `Начала записывать слова тренера в отдельную тетрадь.` |
| RU09D-F023 | `New strings, an old grip she refuses to change. Superstition.` | `Новые струны, старая обмотка, которую не даёт сменить. Суеверие.` |
| RU09D-F024 | `She watched a match on her phone at the table and forgot to eat.` | `За столом смотрела матч в телефоне и забыла поесть.` |
| RU09D-F025 | `Rain all week. She hit against the wall in the car park instead.` | `Всю неделю дождь. Вместо корта била о стену на парковке.` |
| RU09D-F026 | `A photo of the new strings. No caption; apparently none was needed.` | `Фотография новых струн. Без подписи – видимо, она не нужна.` |
| RU09D-F027 | `She called after practice and talked about everything except practice.` | `Позвонила после тренировки и говорила обо всём, только не о ней.` |

F016 is school-only; F017 is after-school-only; F018, F026 and F027 are away-stage lines. Those
licences carry narrative information and are part of the key even when the Russian wording itself
could look portable.

### 17.4 Body – four

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F028 | `She is running on empty and pretending she is not.` | `Сил уже нет, а она делает вид, что есть.` |
| RU09D-F029 | `Ice on her knee in front of the television. Not a word about it.` | `Лёд на колене перед телевизором. И ни слова об этом.` |
| RU09D-F030 | `She is answering in single words this week. That is the tell.` | `На этой неделе отвечает односложно. Это её выдаёт.` |
| RU09D-F031 | `She has her legs back. It shows in the way she walks.` | `Ноги снова её слушаются. Это видно по походке.` |

### 17.5 Money – two

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F032 | `We went through the coaching bill twice. It said the same thing both times.` | `Дважды проверили счёт тренера. Сумма не изменилась.` |
| RU09D-F033 | `She offered to drop a session. We found something else to cut.` | `Предложила убрать занятие. Мы нашли, на чём сэкономить вместо этого.` |

The second line deliberately does not say what the family cut: the economy model does not hold that
fact. Both lines retain the `fundsPressure === 'tight'` licence and print no amount.

## 18. Flat pool B – calendar-owned weeks (13 lines)

### 18.1 Exams – four

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F034 | `Exams. She trained early and revised late, and looked tired both ways.` | `Экзамены. Рано тренировалась, поздно готовилась. Оба раза выглядела уставшей.` |
| RU09D-F035 | `Revision at the kitchen table until eleven. Tennis got the mornings.` | `До одиннадцати готовилась за кухонным столом. Теннису достались утра.` |
| RU09D-F036 | `She revised with the television on and somehow it worked.` | `Готовилась при включённом телевизоре. Каким-то образом это работало.` |
| RU09D-F037 | `Two sessions all week instead of five. The rest of it was papers.` | `Две тренировки вместо пяти. Всё остальное – экзамены.` |

The Russian uses `готовилась`, not `повторяла`: this is exam preparation, not a second occurrence.
F035–F036 retain the same-roof licence.

### 18.2 Vacation – three

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F038 | `A week away as a family. Nobody mentioned rankings once.` | `Неделя семейной поездки. Никто ни разу не вспомнил о рейтинге.` |
| RU09D-F039 | `A week off the court. She came back browner, and louder at dinner.` | `Неделя без корта. Вернулась загорелее и громче за ужином.` |
| RU09D-F040 | `Seven days, no drills. She did not ask about the calendar once.` | `Семь дней без упражнений. Ни разу не спросила о календаре.` |

F039 must stay package-agnostic despite `загорелее`: it claims only the visible result already in
the approved source, never water, beach, hotel or another destination.

### 18.3 Off-season – four

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F041 | `The season is over. She slept until nine and it was glorious.` | `Сезон закончился. Она спала до девяти, и это было прекрасно.` |
| RU09D-F042 | `Off-season. The bag is in the cupboard and the house is louder.` | `Межсезонье. Сумка в шкафу, а дома стало громче.` |
| RU09D-F043 | `December. She is teaching her cousin to serve, badly.` | `Декабрь. Учит кого-то из родни подавать. Плохо.` |
| RU09D-F044 | `Off-season. She came over without the racquet bag. We noticed.` | `Межсезонье. Пришла без сумки с ракетками. Мы заметили.` |

`Кого-то из родни` avoids inventing a cousin's grammatical gender; the runtime holds neither a
named cousin nor that person's gender. F042 is same-roof, while F044 is explicitly an away-stage
visit.

### 18.4 Practice match – two

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F045 | `A hit-out at the club. She played the whole thing like it counted.` | `Поиграла в клубе. Провела всё так, будто матч шёл в зачёт.` |
| RU09D-F046 | `A practice match, and she still shook hands like it was a final.` | `Тренировочный матч. А руку пожала так, будто это был финал.` |

These are `playedPractice` weeks. Use the established `тренировочный матч`; do not call either one
an exhibition or ranking match.

## 19. Flat pool C – the week under a knock (nine lines)

### 19.1 Rested knock – five

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F047 | `A week off the {knockPart}. She was bored by Tuesday and said so by Wednesday.` | `Неделя отдыха для {knockPart.gen}. Во вторник заскучала, в среду сказала.` |
| RU09D-F048 | `Rest week – doctor's orders, and ours. She watched the others hit.` | `Врач велел отдыхать, мы тоже. Она смотрела, как играют другие.` |
| RU09D-F049 | `Ice, stretching, no court. The {knockPart} is quieter than it was.` | `Лёд, растяжка, без корта. {knockPart.nomCap} беспокоит меньше.` |
| RU09D-F050 | `She asked twice if she could go in for an hour. Twice we said no.` | `Дважды просила час на корте. Дважды мы отказали.` |
| RU09D-F051 | `Rest week. She asked the physio twice. The answer stayed no.` | `Неделя отдыха. Дважды спросила физиотерапевта. Ответ – нет.` |

### 19.2 Pushed knock – four

| id | English source | Russian draft |
| --- | --- | --- |
| RU09D-F052 | `She trained on the {knockPart} all week and did not mention it once.` | `Всю неделю тренировалась с повреждением {knockPart.gen}. Ни слова.` |
| RU09D-F053 | `Full week on court. She strapped it up herself before every session.` | `Полная неделя на корте. Перед каждым занятием сама накладывала тейп.` |
| RU09D-F054 | `The {knockPart} held. We watched her serve more closely than usual.` | `С {knockPart.ins} всё обошлось. За подачей следили внимательнее.` |
| RU09D-F055 | `She trained through it. The coach said nothing and watched everything.` | `Тренировалась через боль. Тренер молчал и следил за всем.` |

`{knockPart.gen}`, `.ins` and `.nomCap` are localization requirements, not suggested text to show
the player. The Russian body-part catalogue needs genitive, instrumental and a sentence-initial
nominative form. F054 deliberately avoids a gendered past-tense verb such as
`выдержал/выдержала`: the body-part noun can be masculine, feminine or neuter. If localization uses
ICU/select instead, it must provide the same grammatical result without changing the deterministic
row selection.
