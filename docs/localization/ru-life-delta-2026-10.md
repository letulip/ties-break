---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-17 – семейная речь и отношения: дельта свежего main

Продолжение [RU-10D](ru-life-beats-family-2026-10.md). Срез исходника:
`d69ff15d..origin/main` на 06.10.2026. Русский текст `DRAFT`. Переводим **текущий
пул**, а не прежние четыре строки: в `src/engine/world/lifeBeat/spouseViewCopy.ts`
первые строки четырёх ситуаций переписаны, к ним добавлены варианты. `line` в сохранённом
`lifeLog` – индекс; его порядок не менять, а старый индекс `0` продолжать показывать как
первую строку соответствующей ситуации.

## Слова супруга: четыре ситуации × новые варианты

Это чужой голос внутри семейной сцены, не голос дочери. Исходный `SpouseViewOccasion` не
хранит пола партнёра, поэтому обрамление без «он/она». Заголовок называет, чей это взгляд;
сама строка сразу входит в сцену, не повторяя «человек, за которого она вышла замуж».
Ни одна строка не называет имя, цену или счёт сверх того, что проверяет gate.

| Ситуация / индекс | Английский источник | Русский черновик |
| --- | --- | --- |
| `distant-swing` 0 | `After the plates were cleared: "The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer."` | `Когда убрали тарелки: «Следующий турнир на другом конце света. Я знаю, какая у нас жизнь. Но иногда хочется, чтобы она была чуть ближе».` |
| `distant-swing` 1 | `Two suitcases stood by the door a week early. "I keep packing in my head long before you do. It is not a complaint. It is just where my evenings go."` | `Два чемодана стояли у двери за неделю до отъезда. «Я мысленно собираюсь гораздо раньше тебя. Не жалуюсь. Просто вот на что уходят мои вечера».` |
| `distant-swing` 2 | `The call ended past midnight, cheerful to the last minute. "Those time zones are yours now. I am learning which hours of my day still reach you."` | `Разговор закончился за полночь – и до самого конца был весёлым. «Ты уже живёшь в этих часовых поясах. А я учусь понимать, в какие часы до тебя ещё можно дозвониться».` |
| `distant-swing` 3 | `A map stayed open on the kitchen table all week. "I measured it with my thumb. Three thumbs of ocean. Nobody tells you marriage involves this much geography."` | `Карта всю неделю лежала раскрытой на кухонном столе. «Я измеряю расстояние большим пальцем. Между нами – три пальца океана. Никто не предупреждал, сколько в браке географии».` |
| `road-stretch` 0 | `On a quiet evening, plainly: "The family has been on the road for weeks now. The house does not really get lived in between the trips."` | `Тихим вечером – без обиняков: «Мы уже несколько недель в разъездах. Между поездками дома толком никто не живёт».` |
| `road-stretch` 1 | `The fridge note said back Thursday, then said nothing for a while. "I have stopped counting weeks and started counting airports. It comes to the same number, but it sounds more like your life."` | `На холодильнике висело: «Дома в четверг». Потом записка долго не менялась. «Теперь я считаю не недели, а аэропорты. Число почти то же, зато на нашу жизнь больше похоже».` |
| `road-stretch` 2 | `The neighbours asked when the family would next be under one roof. "I said soon, with the confidence of somebody who has learned not to check the calendar first."` | `Соседи спросили, когда вся семья снова соберётся дома. «Говорю: скоро. Уверенно – если сначала не заглядывать в календарь».` |
| `no-vacation` 0 | `As the season closed: "A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all."` | `Под конец сезона: «Целый сезон прошёл, а ни одной недели для нас не нашлось. В следующем году хочу отметить одну заранее – пока теннис не занял всё».` |
| `no-vacation` 1 | `The brochure stayed on the shelf from last winter. "I am not asking for the sea. I am asking for one week where nobody's racket comes with us."` | `Брошюра лежала на полке с прошлой зимы. «Мне не обязательно к морю. Мне нужна одна неделя, когда с нами не поедет ничья ракетка».` |
| `no-vacation` 2 | `"People think being married into tennis means holidays. I showed them a photo of a car park in the rain. They stopped asking."` | `«Все думают, что у теннисной семьи сплошные отпуска. Показываю им фотографию парковки под дождём – и вопросов больше нет».` |
| `money` 0 | `Without an edge: "That was a large bill, and the season sits in her account now. I am not counting anybody's money. I am asking how this house plans."` | `Без упрёка: «Счёт вышел большой. Я не считаю чужие деньги. Просто хочу понять, как мы будем планировать расходы».` |
| `money` 1 | `The bank letter lay opened beside the fruit bowl. "I grew up thinking a good month meant nothing broke. I am still translating what a good month means in this house."` | `Открытое письмо из банка лежало возле вазы с фруктами. «Раньше хорошим месяцем для меня был тот, когда ничего не сломалось. А здесь я ещё учусь понимать, что значит хороший месяц».` |
| `money` 2 | `"I paid for dinner and it felt like a historical reenactment. Let me have that one. Some things should still be mine to buy."` | `«Оплачиваю ужин – почти историческая реконструкция. Оставь мне хотя бы это. Кое-что я всё ещё хочу покупать на свои».` |

Все 13 русских строк обходятся без формы прошедшего времени в первом лице: пол супруга
не сохранён в модели. Английские авторские детали (`два чемодана`, `три пальца океана`)
сохранены как сцена конкретного варианта, но не должны превращаться в общую подпись
ситуации.

| Поверхность | Новый английский источник | Русский черновик |
| --- | --- | --- |
| `SPOUSE_VIEW_HEADING` | `Her spouse has something to say about this season` | `У них дома хотят поговорить об этом сезоне` |
| `SPOUSE_VIEW_CARD` | `The one she married wants a word.` | `У них дома хотят поговорить.` |

Перевод заголовка сохраняет прежнее редакторское решение RU-10D: он звучит чуть менее
конкретно, зато не утверждает пол партнёра. Если модель явно закрепит мужа, лучше станет
`Её муж хочет поговорить об этом сезоне` – не раньше.

## Отношения на личной карточке и срок вместе

Источники: `src/engine/kidLife.ts` и `src/engine/world/lifeBeat/weddingCopy.ts`.
Карточка показывает **текущую известную связь**, а не реестр всех отношений. После
расставания или при отсутствии известного партнёра `it seems` сохраняет неопределённость.
Фраза о сроке помолвки добавляется только при найденном эпизоде; без него исходную реплику
не дополнять.

| ID | Английский источник | Русский черновик |
| --- | --- | --- |
| R01 | `Relationships` | `Отношения` |
| R02 | `On her own` / `it seems` | `Сейчас одна` / `похоже` |
| R03 | `Married` / `together {span}` | `В браке` / `вместе {span}` |
| R04 | `Engaged` / `together {span}` | `Помолвлена` / `вместе {span}` |
| R05 | `Together for` / `{span}` | `Вместе` / `{span}` |
| R06 | `They have been together for {span}.` | `Они вместе уже {span}.` |
| R07 | `less than a month` | `меньше месяца` |
| R08 | `1 month` / `{n} months` | `1 месяц` / `{n} {месяц/месяца/месяцев}` |
| R09 | `1 year` / `{n} years` | `1 год` / `{n} {год/года/лет}` |
| R10 | `{years} and {months}` | `{years} и {months}` |
| R11 | `<1m`, `{n}m`, `{n}y`, `{y}y {m}m` | `до 1 мес.`, `{n}м`, `{n}г`, `{y}г {m}м` |

`R11` – **не финальная типографика**. У плитки ограничение в 16 знаков, поэтому обычное
`3 года 6 месяцев` туда не влезает. Нужна телефонная LQA: без пробелов `3г 6м` компактно,
но может выглядеть бухгалтерски. Не сокращать полную фразу `R06–R10` только потому, что
сокращение нужно плитке. Краткая и длинная формы должны вычисляться из одних недель.

## Помолвка, календарь и наступивший день

| Источник | Английский | Русский черновик |
| --- | --- | --- |
| `engagedWithTogether` | `{said} They have been together for {span}.` | `{said} Они вместе уже {span}.` |
| `CalendarScreen.vue` | `Her wedding` | `Её свадьба` |
| `world/lifeMomentCopy.ts` | `Continue` | `Продолжить` |

Оверлей свадьбы/рождения берёт строку из **сохранённого события** `LifeMoment.line`, а не
из собственной таблицы. Значит перевести только кнопку недостаточно: для старых `.tsave`
нужна та же семантическая миграция строк события, что и в RU-14. На календаре отмечается
объявленная предстоящая свадьба; показ оверлея – уже случившийся день. Не склеивать
эти два времени одной фразой.
