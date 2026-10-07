---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-03B – записки при дистанции, экзаменах и поездках

Продолжение [RU-03A](ru-fridge-notes-2026-10.md): все остальные текущие строки
`src/composables/fridgeNote.ts`, в исходном порядке. Всё `DRAFT`.

## A. `STRAINED_AWAY_NOTES` – натянутая связь, 8 строк

Это не внезапная теплота: родитель держит канал открытым через бытовые дела. Молчание
регулирует движок, а не текст.

| English | Русский черновик |
| --- | --- |
| `Your post is here. Say when.` | `Твоё письмо здесь. Скажи, когда передать.` |
| `The dentist sent forms. I filled in most of it.` | `Из клиники прислали анкеты. Почти всё уже заполнено.` |
| `Spare key is still under the mat.` | `Запасной ключ всё ещё под ковриком.` |
| `Grandma asks for your address. I said I would check.` | `Бабушка просит твой адрес. Сначала спрошу у тебя.` |
| `The boiler man came. Your old room is fine.` | `С отоплением разобрались. В твоей бывшей комнате всё в порядке.` |
| `Sunday lunch stands, if ever.` | `Воскресный обед никуда не делся. Если захочешь.` |
| `Half the photos here are yours. Say which half.` | `Половина фотографий здесь твои. Скажи, какие забрать.` |
| `New number for the house phone. Same house.` | `У домашнего телефона новый номер. Дом прежний.` |

`В твоей бывшей комнате` звучит чуть отчуждённо; мягче `В твоей комнате всё в порядке`,
но это может утверждать, что комната всё ещё её. В этом регистре отчуждение, возможно,
намеренное. Выбрать после читки всей дуги отношений.

## B. `COLD_AWAY_NOTES` – редкий контакт, 6 строк

| English | Русский черновик |
| --- | --- |
| `Still the same address, if needed.` | `Адрес всё тот же. Если понадобится.` |
| `The last two went unanswered. This is a third.` | `На два прошлых сообщения ответа не было. Вот третье.` |
| `No reply needed. Just checking the line works.` | `Отвечать не нужно. Просто проверяю, доходит ли.` |
| `Draft, never sent: come home for a weekend.` | `Черновик, не отправлено: приезжай на выходные.` |
| `Your grandmother turned eighty. She asked.` | `Бабушке исполнилось восемьдесят. Она спрашивала о тебе.` |
| `The house key still fits. Checked it myself.` | `Ключ от дома всё ещё подходит. Проверено лично.` |

Последняя строка сохраняет след личного действия без `проверил/проверила`. `Draft, never sent`
важно **не** доставить дочери как сообщение в UI: это строка на родительской доске о
несостоявшемся контакте. Если поверхность выглядит как отправленный чат, нужна другая рамка.

## C. `EXAM_NOTES` – экзаменационная неделя, 8 строк

| English | Русский черновик |
| --- | --- |
| `Good luck in the exam. You know this stuff.` | `Удачи на экзамене. Ты это знаешь.` |
| `Exam day – eat something first, please.` | `Сегодня экзамен. Сначала поешь, пожалуйста.` |
| `Pencil case is by the door. Good luck!` | `Пенал у двери. Удачи!` |
| `You have revised enough. Get some sleep.` | `Ты уже достаточно позанималась. Поспи.` |
| `Whatever the paper says, we are proud of you.` | `Как бы ни прошёл экзамен, мы тобой гордимся.` |
| `Deep breath. Read the question twice.` | `Вдохни. Прочитай вопрос дважды.` |
| `Left you a snack for after the exam.` | `После экзамена тебя ждёт перекус.` |
| `Good luck today. Text me when it is done.` | `Удачи сегодня. Напиши, когда закончишь.` |

`Whatever the paper says` не превращено в конкретную оценку или билет: движок не знает
ни форму экзамена, ни его результат.

## D. `TRIP_NOTES` – турнирная поездка из общего дома, 8 строк

| English | Русский черновик |
| --- | --- |
| `Fingers crossed for you. All of us.` | `Все держим за тебя кулаки.` |
| `Kit bag is packed. Trainers by the door.` | `Теннисная сумка собрана. Кроссовки у двери.` |
| `Have fun out there. That is the whole job.` | `Поиграй в удовольствие. Сегодня это главное.` |
| `We are all thinking of you today.` | `Сегодня мы все думаем о тебе.` |
| `Play your game. Nothing else to do.` | `Играй в свою игру. Больше ничего не надо.` |
| `Do not forget the charger this time.` | `Зарядку на этот раз не забудь.` |
| `Whatever happens, ice cream on the way home.` | `Как бы ни сложился матч, на обратном пути – мороженое.` |
| `Good luck. Ring us when you get there.` | `Удачи. Позвони, когда доедешь.` |

Это обещание родителя, не утверждение результата. `Kit bag is packed` допустимо как маленькая бытовая
правда записки; оно не должно попадать в неделю без поездки.

## E. `INDEPENDENT_TRIP_NOTES` – турнирная поездка из своего дома, 8 строк

| English | Русский черновик |
| --- | --- |
| `Safe travels. Message when the hotel door closes.` | `Счастливой дороги. Напиши, когда доберёшься.` |
| `Good luck. Call after, not before.` | `Удачи. Позвони после матча, не до него.` |
| `Passport, charger, tape. You know the list now.` | `Паспорт, зарядка, тейп. Список ты и сама знаешь.` |
| `Whatever happens, send a sign of life.` | `Как бы ни сыграла, дай знать, что ты на связи.` |
| `We are all thinking of you. No reply required.` | `Мы все думаем о тебе. Отвечать не обязательно.` |
| `Play, eat, sleep. Call when the order changes.` | `Играй, ешь, спи. Позвони, когда порядок собьётся.` |
| `The family chat has started. You have been warned.` | `Семейный чат уже оживился. Предупреждаю.` |
| `Home when you can. Dinner when you get here.` | `Приезжай, когда сможешь. Ужин будет.` |

`Hotel` в английском источнике – конкретная дверь, но не каждая оплаченная поездка
обязательно означает гостиницу в данных модели. Русский черновик убирает предположение.
Для college и independent один пул: не писать `после пар`, `из общаги` или `из своей
квартиры` как неизменную подробность.

## Поведение и контроль

- Два deterministic выбора (`:fridge-quiet:` и `:fridge:`) остаются побуквенно теми же.
  Перевод не меняет порядок и число строк в каждом пуле.
- Отсутствие записки на обычной away-неделе при strained/cold – смысловое молчание,
  не missing-key. Русская локаль не должна «заполнять» его запасной строкой.
- Проверить 50 + 27 + 8 + 6 + 8 + 8 + 8 = **115** строк по индексам. В RU-03A и этой части
  представлены все семь текущих пулов.
- В русской сборке проверить переносы на маленьком экране и доступный текст карточки.
