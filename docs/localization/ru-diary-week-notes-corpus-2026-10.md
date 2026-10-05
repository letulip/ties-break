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

All lines are `DRAFT`. This pass completes the sunny voice (37 cells). Fiery, quiet and deep follow
in the same order.

## 2. Sunny voice – rectangular moments

| moment | school | after-school | college | independent |
| --- | --- | --- | --- | --- |
| grind | `Она сказала за ужином: «Тяжёлая неделя, хорошая неделя. Я бы повторила».` | `После ужина она подвела итог: «Тяжёлая работа, все шесть дней. Оно того стоило».` | `Позвонила между парами: «Тяжёлая неделя – из хороших. Я бы повторила».` | `После темноты оставила голосовое: «Шесть дней без остановки. Я бы взяла ещё».` |
| light | `За завтраком она уже всё решила: «Два свободных утра – и оба мои».` | `Между турнирами заняла диван: «Два утра без дел. Я их заслужила».` | `Посреди недели написала: «Два свободных утра. Одно я проспала целиком».` | `Прислала фотографию кофе: «Два чистых утра – и оба мои».` |
| fresh body | `Выпрыгнула к машине: «На этой неделе мне хорошо. По-настоящему».` | `Всю неделю вставала первой, без будильника: «Я сильная. Вся целиком».` | `Перед тренировкой оставила голосовое: «Сегодня всё хорошо. Совсем всё».` | `Написала в семейный чат: «На этой неделе тело на всё отвечает: да».` |
| vacation | `Всё утро не уходила из-за стола: «Неделя отдыха – и я возьму её целиком».` | `В календаре появилось окно, и она наконец замедлилась: «Отдых. Настоящий. На всю неделю».` | `Прислала фотографию и одну строку: «Неделя без всего. Мне это нужно».` | `Ответила через несколько дней: «Целая неделя отдыха – и вся моя».` |
| resting knock | `Оставила ракетку у двери: «На этой неделе берегу себя, и всё нормально».` | `Дома залечивала ушиб и пожала плечами: «На этой неделе отдыхаю. Меня это устраивает».` | `Позвонила раньше, чем мы успели разволноваться: «Отдыхаю как следует, обещаю».` | `Переслала облегчённый план: «Неделя отдыха – и снова в дело».` |
| pushing knock | `За ужином сама показала: «Всю неделю держалось. Я была осторожна».` | `Посреди сезона отмахнулась от тревоги: «Держится. Я с этим осторожна».` | `После тренировки написала: «Всю неделю держалось. Всё хорошо».` | `После занятия оставила голосовое: «Держится. Я не рисковала».` |
| injured | `К вечеру лист восстановления уже висел на холодильнике: «Скажите, с чего начинать».` | `Вечером проговорила всё по порядку: «Теперь восстановление. С чего начать?»` | `Позвонила с новостями: «Теперь восстановление. Скажите первый шаг».` | `Написала, когда всё стало ясно: «Значит, восстановление. Что сначала?»` |
| tired | `Ушла наверх ещё до десерта: «Эта неделя меня выжала».` | `Дома легла раньше обычного: «Вся эта неделя меня опустошила».` | `Написала и замолчала: «Сегодня во мне ничего не осталось. Сначала сон».` | `Ответила на несколько дней позже: «На этой неделе потратила всё. Скоро вернусь к себе».` |

`Ушиб` in the resting-knock frame is the diary's generic minor knock, not a medical diagnosis or a
localized body-part name. If the shared glossary chooses `повреждение`, update all four cells as one
term.

## 3. Sunny voice – scoped moments

| moment/stage | Russian draft |
| --- | --- |
| exams, school | `Она превратила неделю в расписание: «Сначала экзамены, потом корт. Именно так».` |
| birthday, school | `{N} сегодня. «Оставьте мне угловой кусок», – сказала она за столом.` |
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
