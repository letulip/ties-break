---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-03A – записки на календаре и сообщения после переезда

Построчная читка `src/composables/fridgeNote.ts`. Всё ниже – `DRAFT`.
`FRIDGE_NOTES` доступны только пока она живёт дома (`school`, `after-school`),
`INDEPENDENT_NOTES` и холодные/натянутые варианты – когда живёт отдельно (`college`,
`independent`), а не только на профессиональном туре. `EXAM_NOTES` доступны в экзаменационную
неделю; `TRIP_NOTES` и `INDEPENDENT_TRIP_NOTES` – в неделю турнирной поездки. Порядок строк
сохранён для сравнения; техническая локализация должна сохранять детерминированный выбор
индекса, не хешировать перевод и не менять вероятность молчания.

Короткая бытовая записка допускает микродеталь, которую движок не хранит (суп, зонт,
звонок бабушки), но не вправе утверждать исход матча, травму, баланс или турнирный результат.
Родитель в русском не получает пола: нет `оставил/оставила` от его лица. Дочь получает `ты`.

## A. `FRIDGE_NOTES` – общий дом, 50 строк

| English | Русский черновик |
| --- | --- |
| `Bins go out tonight, please.` | `Мусор вынеси сегодня, пожалуйста.` |
| `There is soup in the fridge – just heat it up.` | `В холодильнике суп. Только разогрей.` |
| `Remember to pack the rain jacket.` | `Не забудь дождевик.` |
| `Water the plants. They are drooping again.` | `Полей цветы. Опять повесили головы.` |
| `Milk, bread, eggs – if you pass the shop.` | `Если будешь у магазина: молоко, хлеб, яйца.` |
| `Back late tonight. Dinner is in the oven.` | `Вернёмся поздно. Ужин в духовке.` |
| `Grandma called. Ring her back when you can.` | `Бабушка звонила. Перезвони ей, когда сможешь.` |
| `Your washing is dry. It is on your bed.` | `Твои вещи высохли. Лежат на кровати.` |
| `The dishwasher is clean. Please empty it.` | `Посудомойка закончила. Разгрузи, пожалуйста.` |
| `Do not forget your keys again.` | `Ключи. Да, опять напоминаем.` |
| `Lock the door if you go out.` | `Уходя, закрой дверь на ключ.` |
| `Left the umbrella by the door for you.` | `Зонт для тебя у двери.` |
| `Apples in the bowl. Eat one.` | `Яблоки в миске. Хоть одно съешь.` |
| `Please tidy your room today.` | `Прибери сегодня у себя, пожалуйста.` |
| `Your bag is by the stairs.` | `Твоя сумка у лестницы.` |
| `Charge your phone. It was on two percent again.` | `Заряди телефон. Там опять было два процента.` |
| `Love you. Have a good day.` | `Любим тебя. Хорошего дня.` |
| `Text me when you get home.` | `Напиши, когда доберёшься домой.` |
| `Sandwiches are in the blue box.` | `Бутерброды в синем контейнере.` |
| `Do not touch the cake. It is for Sunday.` | `Торт не трогай – он на воскресенье.` |
| `Put the laundry on if you get a minute.` | `Будет минутка – запусти стирку.` |
| `The kettle is playing up. Be careful with it.` | `Чайник барахлит. Осторожнее с ним.` |
| `New toothpaste is in the cupboard.` | `Новая зубная паста в шкафчике.` |
| `Recycling goes out in the morning.` | `Макулатуру нужно вынести утром.` |
| `Please hang the towels up.` | `Повесь полотенца, пожалуйста.` |
| `The hall window sticks. Push, do not pull.` | `Окно в прихожей заедает. Толкай, не тяни.` |
| `There is pasta left if you are hungry.` | `Если проголодаешься, осталась паста.` |
| `Wear something warm. It is colder than it looks.` | `Оденься теплее. На улице холоднее, чем кажется.` |
| `Your lunch is on the middle shelf.` | `Твой обед на средней полке.` |
| `Socks belong in the basket, not the hallway.` | `Носки – в корзину, не в коридор.` |
| `Home around six. Help yourself to anything.` | `Будем дома около шести. Пока бери что хочешь.` |
| `Bed before eleven, please. Both of us.` | `Давай сегодня до одиннадцати уже спать. Это и нас касается.` |
| `Plate in the sink, not on the table.` | `Тарелку – в раковину, не на стол.` |
| `I moved your shoes to the cupboard.` | `Твоя обувь теперь в шкафу.` |
| `Post came for you. It is on the table.` | `Тебе пришло письмо. Лежит на столе.` |
| `The heating is on a timer now. Do not fiddle.` | `Отопление теперь по таймеру. Не крути настройки.` |
| `Take the washing in if it rains.` | `Если пойдёт дождь, занеси бельё.` |
| `Fridge light is out. Do not panic.` | `В холодильнике погасла лампочка. Без паники.` |
| `Say hello to the neighbours, they asked after you.` | `Поздоровайся с соседями – спрашивали о тебе.` |
| `Ice cream in the freezer. One scoop.` | `Мороженое в морозилке. По одной порции.` |
| `Please answer the phone if it rings.` | `Если телефон зазвонит, возьми трубку, пожалуйста.` |
| `Left the spare key under the mat. Again.` | `Запасной ключ снова под ковриком.` |
| `The tap in the bathroom drips. Turn it hard.` | `Кран в ванной капает. Закручивай посильнее.` |
| `Biscuits are gone. Do not blame me.` | `Печенье кончилось. Только не вини нас.` |
| `Bring the washing basket down when you come.` | `Когда спустишься, захвати корзину для белья.` |
| `Do the shopping list on the pad, not on your hand.` | `Список покупок пиши в блокноте, не на ладони.` |
| `Sorry about this morning. Tea when I am back.` | `Прости за утро. Вернёмся – попьём чаю.` |
| `Proud of you. Just so you know.` | `Гордимся тобой. Просто чтобы ты знала.` |
| `Feed the sourdough or it will sulk.` | `Подкорми закваску, а то обидится.` |
| `Dentist appointment on the calendar. Do not forget.` | `Запись к стоматологу есть в календаре. Не забудь.` |

`Bed before eleven. Both of us.` не переведено через `оба`: так строка задала бы
неизвестный род родителя. Смысл общей договорённости сохранён второй фразой.

## B. `INDEPENDENT_NOTES` – отдельная жизнь, 27 строк

| English | Русский черновик |
| --- | --- |
| `Call when you have a minute. No emergency, for once.` | `Позвони, когда будет минутка. На этот раз ничего срочного.` |
| `Your post came here again. I did not open it.` | `Тебе опять пришло письмо сюда. Оно закрыто, честно.` |
| `Dinner Sunday? This is me booking early.` | `Поужинаем в воскресенье? Зовём заранее.` |
| `The spare key is still where you left it.` | `Запасной ключ всё там же, где ты его оставила.` |
| `Grandma says you never ring. She told me by ringing.` | `Бабушка говорит, ты ей не звонишь. Сама позвонила сообщить.` |
| `Soup here if you are passing. No questions asked.` | `Будешь рядом – заходи за супом. Без расспросов.` |
| `You left a charger here. Of course you did.` | `Ты оставила зарядку. Конечно, оставила.` |
| `Come over when you can. Bring nothing.` | `Заезжай, когда сможешь. Ничего не привози.` |
| `You called while I was out. Call again; I liked it.` | `Ты звонила, когда нас не было. Позвони ещё – нам понравилось.` |
| `The family chat needs a reply, even one full stop.` | `Ответь в семейном чате. Хоть точку поставь.` |
| `We are home Sunday. The kettle will be on.` | `В воскресенье мы дома. Чайник поставим.` |
| `No advice today. Just eat something.` | `Сегодня без советов. Только поешь что-нибудь.` |
| `Proud of you. Not because of anything in particular.` | `Гордимся тобой. Не за что-то конкретное.` |
| `Parcel here for you. It can wait. I apparently cannot.` | `Тебе посылка сюда пришла. Она подождёт. Мы, похоже, нет.` |
| `Saw your message. I was asleep at nine. Roles reversed.` | `Твоё сообщение пришло в девять, а мы уже спать. Теперь всё наоборот.` |
| `Your keys are not here. I checked before you asked.` | `Твоих ключей здесь нет. Уже проверено – до твоего вопроса.` |
| `Sunday lunch still counts if you arrive at three.` | `Воскресный обед считается и в три часа.` |
| `The hall is quieter. I am not saying that is better.` | `В прихожей стало тише. Не говорим, что лучше.` |
| `Blue mug found. You did not take everything after all.` | `Синяя кружка нашлась. Значит, не всё ты забрала.` |
| `Text when you get in. Yes, I know you are grown.` | `Напиши, когда доберёшься. Да, знаем, что ты уже взрослая.` |
| `I put the old photos in a box. Come and veto it.` | `Старые фотографии теперь в коробке. Приезжай и разбирай.` |
| `The plant you left us is doing suspiciously well.` | `Цветок, который ты нам оставила, подозрительно хорошо себя чувствует.` |
| `Nothing urgent. I just wanted to hear your voice.` | `Ничего срочного. Просто хотелось услышать твой голос.` |
| `Too much bread again. Some things do not change.` | `Опять хлеба больше, чем нужно. Некоторые вещи не меняются.` |
| `Missed you by a minute. Rang back into voicemail.` | `Разминулись на минуту. В ответ – только автоответчик.` |
| `Sent you a photo of the garden. No caption needed.` | `Фото сада уже у тебя. Без подписи понятно.` |
| `Played your voice note twice. Once was on purpose.` | `Твоё голосовое – два раза подряд. Второй раз нарочно.` |

`В девять, а я уже спать` – намеренно разговорная записка, а не интерфейсная фраза.
У этих трёх строк особенно важна читка владельца: в русском нельзя использовать прошлое
время первого лица с неизвестным родом родителя, и механическая безличность тоже портит голос.

## C. Дистанция и событие

Оставшиеся четыре пула (`STRAINED_AWAY_NOTES`, `COLD_AWAY_NOTES`, `EXAM_NOTES`,
`TRIP_NOTES`, `INDEPENDENT_TRIP_NOTES`) продолжаются во второй части RU-03B, чтобы не
делать один документ трудно читаемым. Пока они **не** отмечены как переведённые.
